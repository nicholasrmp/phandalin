// O Durable Object da sala: um por código, no mesmo Worker que serve o site.
//
// Ele guarda o estado da sala e retransmite. NÃO conhece regra nenhuma além das
// de `game/sala.js` (quem pegou qual herói, quem está pronto): o jogo roda no
// navegador do anfitrião (A-01), e na Fase 2 nem isso — não há jogo sincronizado.
//
// Usa a API de hibernação: o objeto dorme entre mensagens e só conta o tempo em
// que trabalha, o que importa no plano grátis (13.000 GB-s por dia). Por isso o
// estado vive em `ctx.storage`, e o que identifica a conexão vive no anexo do
// WebSocket, não em memória.
//
// Quem é cada conexão: o navegador diz na PRIMEIRA mensagem (`eu`), não na URL
// (a URL vai para os registros do Cloudflare). Enquanto não se identifica, a
// conexão não recebe nada.

import { DurableObject } from 'cloudflare:workers';
import { deveFechar, desconectar, promoverAnfitriao, GRACA_DO_ANFITRIAO_MS, MINUTOS_VAZIA } from '../game/sala.js';
import { MAX_VISTA } from '../game/partida-vista.js';
import {
  tratarMensagem, tratarVista, ehVista, tratarNarrativa, ehNarrativa, MAX_NARRATIVA, tratarSave, ehSave, MAX_SAVE, dentroDoLimite, mensagemDeSala, identidade, erro,
  MAX_BYTES, MAX_CONEXOES_POR_SALA, MAX_CONEXOES_POR_JOGADOR,
} from './sala-servidor.js';

/** O `tipo` da mensagem sem a tratar (para recusar `criar` antes de a sala existir). */
function tipoDe(texto) {
  try { return JSON.parse(texto)?.tipo; } catch { return undefined; }
}

const CODIGO_DE_FECHAMENTO = 4000;   // removido ou sala fechada: o navegador não deve tentar reconectar
const UMA_HORA = 3_600_000;

export class SalaDO extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sala = undefined;       // `undefined`: ainda não lida; `null`: não existe
    this.ritmo = new Map();      // jogador -> instantes das últimas mensagens (some ao hibernar; o limite reinicia)
    this.alarme = undefined;     // o instante do alarme que armamos, para não regravar o mesmo
    this.ultimaGravacao = 0;
    this.ultimaVista = null;     // o texto da última vista da partida (F4); fica só em memória: o anfitrião a refaz em segundos
    this.ultimaVistaEm = 0;
    this.ultimoSaveEm = 0;
  }

  async carregar() {
    if (this.sala !== undefined) return this.sala;
    this.sala = (await this.ctx.storage.get('sala')) ?? null;
    // Uma sala guardada antes da taverna não tem estes campos, e a visão os lê.
    if (this.sala) { this.sala.avatares ??= {}; this.sala.cedidos ??= {}; }
    // Depois de hibernar ou de um deploy, jogador marcado como conectado sem nenhuma conexão
    // viva nunca receberia o `close`: sem isto a sala "tem gente" para sempre.
    if (this.sala && this.sala.fase !== 'fechada') {
      const vivos = new Set(this.ctx.getWebSockets().map((w) => w.deserializeAttachment()?.jogadorId).filter(Boolean));
      let mexeu = false;
      for (const j of Object.values(this.sala.jogadores)) {
        if (j.conectado && !vivos.has(j.id)) { desconectar(this.sala, j.id, Date.now()); mexeu = true; }
      }
      if (mexeu) { await this.guardar(); await this.reagendar(); }
    }
    return this.sala;
  }

  async guardar() {
    if (!this.sala) return;
    this.ultimaGravacao = Date.now();
    await this.ctx.storage.put('sala', this.sala);
  }

  async fetch(request) {
    const codigo = request.headers.get('x-sala');
    if (!codigo) return new Response('pedido inválido', { status: 400 });
    if ((request.headers.get('Upgrade') ?? '').toLowerCase() !== 'websocket') return new Response('esperava WebSocket', { status: 426 });
    const sala = await this.carregar();
    const [cliente, servidor] = Object.values(new WebSocketPair());

    // Sala fechada: aceita o WebSocket só para DIZER que fechou. Um 410 no upgrade chegaria ao
    // navegador como uma queda qualquer (1006) e o cliente ficaria reconectando.
    if (sala?.fase === 'fechada') {
      servidor.accept();
      servidor.send(JSON.stringify({ tipo: 'fechada', motivo: 'essa sala já foi encerrada' }));
      servidor.close(CODIGO_DE_FECHAMENTO, 'sala fechada');
      return new Response(null, { status: 101, webSocket: cliente });
    }
    if (this.ctx.getWebSockets().length >= MAX_CONEXOES_POR_SALA) {
      servidor.accept();
      servidor.send(JSON.stringify(erro('a sala está com conexões demais')));
      servidor.close(1008, 'conexões demais');
      return new Response(null, { status: 101, webSocket: cliente });
    }
    this.ctx.acceptWebSocket(servidor);
    // Com `CODIGO_DO_SERVIDOR`, só abre sala (`criar`) quem veio com um código que o servidor emitiu a este IP.
    servidor.serializeAttachment({ codigo, jogadorId: null, podeCriar: request.headers.get('x-exigir-emitido') !== '1' || request.headers.get('x-emitido') === '1' });
    return new Response(null, { status: 101, webSocket: cliente });
  }

  async webSocketMessage(ws, mensagem) {
    const anexo = ws.deserializeAttachment() ?? {};
    const agora = Date.now();
    // A vista da partida (F4) é grande de propósito: tem a sua porta e o seu teto, antes do teto das outras mensagens.
    if (ehVista(mensagem)) { await this.receberVista(ws, anexo, mensagem, agora); return; }
    if (ehNarrativa(mensagem)) { await this.receberNarrativa(ws, anexo, mensagem); return; }
    if (ehSave(mensagem)) { await this.receberSave(ws, anexo, mensagem, agora); return; }
    if (typeof mensagem !== 'string' || mensagem.length > MAX_BYTES * 2) { try { ws.close(1009, 'mensagem grande demais'); } catch { /* já fechado */ } return; }

    // A primeira mensagem diz quem é a conexão; até lá nada mais vale.
    let jogadorId = anexo.jogadorId;
    if (!jogadorId) {
      jogadorId = identidade(mensagem);
      if (!jogadorId) { ws.send(JSON.stringify(erro('identifique-se na primeira mensagem'))); return; }
      const mesmos = this.ctx.getWebSockets().filter((w) => w !== ws && w.deserializeAttachment()?.jogadorId === jogadorId);
      if (mesmos.length >= MAX_CONEXOES_POR_JOGADOR) { try { ws.send(JSON.stringify(erro('abas demais para um jogador'))); ws.close(1008, 'abas demais'); } catch { /* já fechado */ } return; }
      ws.serializeAttachment({ ...anexo, jogadorId });
    }

    // O ritmo é por JOGADOR, não por conexão: abrir mais conexões não dá mais mensagens.
    const registro = this.ritmo.get(jogadorId) ?? [];
    this.ritmo.set(jogadorId, registro);
    if (!dentroDoLimite(registro, agora)) { ws.send(JSON.stringify(erro('devagar: mensagens demais'))); return; }

    if (anexo.podeCriar === false && tipoDe(mensagem) === 'criar') { ws.send(JSON.stringify(erro('peça um código de sala ao servidor para criar uma sala'))); return; }

    await this.carregar();
    const outrasConexoes = this.ctx.getWebSockets().filter((w) => w !== ws && w.deserializeAttachment()?.jogadorId === jogadorId).length;
    const r = tratarMensagem({ sala: this.sala, jogadorId, bruto: mensagem, codigo: anexo.codigo, agora, outrasConexoes });
    if (r.sala !== this.sala) this.sala = r.sala;
    if (r.resposta) ws.send(JSON.stringify(r.resposta));
    // Intenção de quem não roda a partida (F4.3): vai ao anfitrião, que a aplica. Não muda o estado da sala.
    if (r.repassar) { this.enviarAoAnfitriao(r.repassar); return; }
    // O anfitrião fala com UM jogador (o aviso de um passo ignorado): todas as conexões dele, e mais ninguém.
    if (r.repassarA) { this.enviarAoJogador(r.repassarA.id, r.repassarA.msg); return; }
    if (r.soEsta) { try { ws.close(1000, 'saiu'); } catch { /* já fechado */ } return; }
    if (!r.mudou) {
      // Quem acabou de entrar recebe o estado mesmo sem mudança (a aba que reabre).
      if (!r.resposta && this.sala) ws.send(JSON.stringify(mensagemDeSala(this.sala, jogadorId)));
      this.entregarUltimaVista(ws, jogadorId, r.tipo);
      return;
    }

    // Andar e trocar de persona são só de enfeite: gravar a cada passo gastaria a cota de escrita do plano
    // grátis (100 mil linhas por dia, para a conta inteira). Retransmite na hora e grava no máximo a cada 5 s;
    // o que sobrar é gravado junto com a próxima mudança de verdade ou na saída de alguém.
    const enfeite = r.tipo === 'mover' || r.tipo === 'persona' || r.tipo === 'emote';
    if (!enfeite || agora - this.ultimaGravacao >= 5000) await this.guardar();
    if (r.removido) this.derrubar(r.removido, 4000, 'removido da sala');
    if (r.saiu) this.derrubar(r.saiu, 1000, 'saiu');
    this.retransmitir();
    this.entregarUltimaVista(ws, jogadorId, r.tipo);
    if (this.sala.fase === 'fechada') await this.encerrar();
    else await this.reagendar();
  }

  /** Manda uma mensagem a todas as conexões do anfitrião (ele pode ter mais de uma aba). */
  enviarAoAnfitriao(msg) {
    const texto = JSON.stringify(msg);
    for (const w of this.ctx.getWebSockets()) {
      if (w.deserializeAttachment()?.jogadorId !== this.sala?.anfitriao) continue;
      try { w.send(texto); } catch { /* conexão caindo */ }
    }
  }

  /** Manda uma mensagem a todas as conexões de UM jogador (pelo id secreto, que nunca sai daqui). */
  enviarAoJogador(jogadorId, msg) {
    const texto = JSON.stringify(msg);
    for (const w of this.ctx.getWebSockets()) {
      if (w.deserializeAttachment()?.jogadorId !== jogadorId) continue;
      try { w.send(texto); } catch { /* conexão caindo */ }
    }
  }

  /** O anfitrião transmitiu uma página de narrativa (ou o fim dela): confere e repassa aos outros. */
  async receberNarrativa(ws, anexo, mensagem) {
    const jogadorId = anexo.jogadorId;
    if (!jogadorId) { ws.send(JSON.stringify(erro('identifique-se na primeira mensagem'))); return; }
    await this.carregar();
    const teto = this.sala?.anfitriao === jogadorId ? MAX_NARRATIVA : MAX_BYTES * 2;
    if (mensagem.length > teto) { try { ws.close(1009, 'narrativa grande demais'); } catch { /* já fechado */ } return; }
    const r = tratarNarrativa({ sala: this.sala, jogadorId, bruto: mensagem });
    if (!r.ok) { ws.send(JSON.stringify(erro(r.erro))); return; }
    for (const outro of this.ctx.getWebSockets()) {
      if (outro === ws || !outro.deserializeAttachment()?.jogadorId) continue;
      try { outro.send(r.texto); } catch { /* conexão caindo */ }
    }
  }

  /** O anfitrião mandou o save da cena: guarda o último (sobrevive a o objeto dormir) e, no máximo, um a cada 3 s. */
  async receberSave(ws, anexo, mensagem, agora) {
    const jogadorId = anexo.jogadorId;
    if (!jogadorId) { ws.send(JSON.stringify(erro('identifique-se na primeira mensagem'))); return; }
    await this.carregar();
    const teto = this.sala?.anfitriao === jogadorId ? MAX_SAVE + 200 : MAX_BYTES * 2;
    if (mensagem.length > teto) { try { ws.close(1009, 'save grande demais'); } catch { /* já fechado */ } return; }
    if (agora - this.ultimoSaveEm < 3000) return;    // um autosave por cena; mais que isso é excesso
    const r = tratarSave({ sala: this.sala, jogadorId, bruto: mensagem });
    if (!r.ok) { ws.send(JSON.stringify(erro(r.erro))); return; }
    this.ultimoSaveEm = agora;
    await this.ctx.storage.put('saveDaSala', r.texto);
  }

  /** O posto de anfitrião passou a outro (o antigo caiu): avisa todos com a visão nova e entrega o save a quem assume. */
  async passarOPosto(novoId) {
    this.retransmitir();
    const save = (await this.ctx.storage.get('saveDaSala')) ?? null;
    this.ultimaVista = null;      // a vista velha é do jogo velho
    this.enviarAoJogador(novoId, { tipo: 'assumir', save });
  }

  /** Quem acaba de entrar (ou voltar) numa partida em andamento recebe a última vista, sem esperar a próxima. */
  entregarUltimaVista(ws, jogadorId, tipo) {
    if (tipo !== 'entrar' || !this.ultimaVista || this.sala?.fase !== 'iniciada' || this.sala.anfitriao === jogadorId) return;
    try { ws.send(this.ultimaVista); } catch { /* conexão caindo */ }
  }

  /** O anfitrião publicou a vista da partida: confere e repassa a todos os outros, sem gravar nada. */
  async receberVista(ws, anexo, mensagem, agora) {
    const jogadorId = anexo.jogadorId;
    if (!jogadorId) { ws.send(JSON.stringify(erro('identifique-se na primeira mensagem'))); return; }
    await this.carregar();
    // Só o anfitrião manda vista grande: de quem não é, o teto é o das mensagens comuns.
    const teto = this.sala?.anfitriao === jogadorId ? MAX_VISTA + 200 : MAX_BYTES * 2;
    if (mensagem.length > teto) { try { ws.close(1009, 'vista grande demais'); } catch { /* já fechado */ } return; }
    const r = tratarVista({ sala: this.sala, jogadorId, bruto: mensagem, agora, ultimaEm: this.ultimaVistaEm });
    if (!r.ok) { if (!r.calado) ws.send(JSON.stringify(erro(r.erro))); return; }
    if (!r.delta) this.ultimaVista = r.texto;     // quem entra agora recebe a última COMPLETA; as diferenças só servem a quem já a tem
    this.ultimaVistaEm = agora;
    for (const outro of this.ctx.getWebSockets()) {
      if (outro === ws || !outro.deserializeAttachment()?.jogadorId) continue;
      try { outro.send(r.texto); } catch { /* conexão caindo */ }
    }
  }

  async webSocketClose(ws, code) {
    try { ws.close(code === 1005 || code === 1006 ? 1000 : code, 'até logo'); } catch { /* já fechado */ }
    await this.aoDesconectar(ws);
  }

  async webSocketError(ws) {
    await this.aoDesconectar(ws);
  }

  async aoDesconectar(ws) {
    const { jogadorId } = ws.deserializeAttachment() ?? {};
    if (!jogadorId) return;
    await this.carregar();
    if (!this.sala || this.sala.fase === 'fechada') return;   // sala fechada: nada a gravar
    // O mesmo jogador pode ter outra aba aberta: só cai quando a última fecha.
    const outras = this.ctx.getWebSockets().filter((w) => w !== ws && w.deserializeAttachment()?.jogadorId === jogadorId);
    if (outras.length) return;
    this.ritmo.delete(jogadorId);
    desconectar(this.sala, jogadorId, Date.now());
    await this.guardar();
    this.retransmitir();
    await this.reagendar();
  }

  /** Manda a cada conexão IDENTIFICADA a visão DELA (o `voce` muda de um para outro). */
  retransmitir() {
    for (const ws of this.ctx.getWebSockets()) {
      const { jogadorId } = ws.deserializeAttachment() ?? {};
      if (!jogadorId) continue;
      try { ws.send(JSON.stringify(mensagemDeSala(this.sala, jogadorId))); } catch { /* conexão morrendo */ }
    }
  }

  derrubar(jogadorId, codigo, motivo) {
    for (const ws of this.ctx.getWebSockets()) {
      if (ws.deserializeAttachment()?.jogadorId !== jogadorId) continue;
      try {
        if (codigo === 4000) ws.send(JSON.stringify({ tipo: 'fechada', motivo }));
        ws.close(codigo, motivo);
      } catch { /* já fechado */ }
    }
  }

  /** A sala fechou: avisa todos, e agenda a limpeza do armazenamento (o código volta a ficar livre). */
  async encerrar() {
    for (const ws of this.ctx.getWebSockets()) {
      try { ws.send(JSON.stringify({ tipo: 'fechada', motivo: 'o anfitrião fechou a sala' })); ws.close(CODIGO_DE_FECHAMENTO, 'sala fechada'); } catch { /* já fechado */ }
    }
    await this.agendar(Date.now() + UMA_HORA);
  }

  async agendar(quando) {
    if (this.alarme === quando) return;
    this.alarme = quando;
    if (quando == null) await this.ctx.storage.deleteAlarm();
    else await this.ctx.storage.setAlarm(quando);
  }

  /** L-12: com a sala vazia, acorda daqui a 30 minutos para fechá-la; com gente, cancela. */
  async reagendar() {
    if (this.sala?.fase === 'fechada') return;
    const prazos = [];
    if (this.sala?.vaziaDesde != null) prazos.push(this.sala.vaziaDesde + MINUTOS_VAZIA * 60_000);
    // F6: o anfitrião caído tem uma graça; passada ela, o alarme passa o posto.
    if (this.sala?.fase === 'iniciada' && this.sala.anfitriaoAusenteDesde != null) prazos.push(this.sala.anfitriaoAusenteDesde + GRACA_DO_ANFITRIAO_MS);
    await this.agendar(prazos.length ? Math.min(...prazos) : null);
  }

  async alarm() {
    await this.carregar();
    this.alarme = undefined;
    if (!this.sala) return;
    if (this.sala.fase === 'fechada') {
      // Uma hora depois de fechar: apaga tudo, e o código fica livre de novo.
      await this.ctx.storage.deleteAll();
      this.sala = null;
      return;
    }
    const troca = promoverAnfitriao(this.sala, Date.now());
    if (troca.ok) {
      await this.guardar();
      await this.passarOPosto(troca.novo);
      await this.reagendar();
      return;
    }
    // Ninguém conectado para assumir: o alarme volta quando a graça tiver passado de novo (ou a sala fecha por vazia).
    if (deveFechar(this.sala, Date.now())) {
      this.sala.fase = 'fechada';
      await this.guardar();
      await this.encerrar();
    }
  }
}
