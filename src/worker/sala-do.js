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
import { deveFechar, desconectar, MINUTOS_VAZIA } from '../game/sala.js';
import {
  tratarMensagem, dentroDoLimite, mensagemDeSala, identidade, erro,
  MAX_BYTES, MAX_CONEXOES_POR_SALA, MAX_CONEXOES_POR_JOGADOR,
} from './sala-servidor.js';

const CODIGO_DE_FECHAMENTO = 4000;   // removido ou sala fechada: o navegador não deve tentar reconectar
const UMA_HORA = 3_600_000;

export class SalaDO extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sala = undefined;       // `undefined`: ainda não lida; `null`: não existe
    this.ritmo = new Map();      // jogador -> instantes das últimas mensagens (some ao hibernar; o limite reinicia)
    this.alarme = undefined;     // o instante do alarme que armamos, para não regravar o mesmo
  }

  async carregar() {
    if (this.sala !== undefined) return this.sala;
    this.sala = (await this.ctx.storage.get('sala')) ?? null;
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
    if (this.sala) await this.ctx.storage.put('sala', this.sala);
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
    servidor.serializeAttachment({ codigo, jogadorId: null });
    return new Response(null, { status: 101, webSocket: cliente });
  }

  async webSocketMessage(ws, mensagem) {
    const anexo = ws.deserializeAttachment() ?? {};
    const agora = Date.now();
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

    await this.carregar();
    const outrasConexoes = this.ctx.getWebSockets().filter((w) => w !== ws && w.deserializeAttachment()?.jogadorId === jogadorId).length;
    const r = tratarMensagem({ sala: this.sala, jogadorId, bruto: mensagem, codigo: anexo.codigo, agora, outrasConexoes });
    if (r.sala !== this.sala) this.sala = r.sala;
    if (r.resposta) ws.send(JSON.stringify(r.resposta));
    if (r.soEsta) { try { ws.close(1000, 'saiu'); } catch { /* já fechado */ } return; }
    if (!r.mudou) {
      // Quem acabou de entrar recebe o estado mesmo sem mudança (a aba que reabre).
      if (!r.resposta && this.sala) ws.send(JSON.stringify(mensagemDeSala(this.sala, jogadorId)));
      return;
    }

    await this.guardar();
    if (r.removido) this.derrubar(r.removido, 4000, 'removido da sala');
    if (r.saiu) this.derrubar(r.saiu, 1000, 'saiu');
    this.retransmitir();
    if (this.sala.fase === 'fechada') await this.encerrar();
    else await this.reagendar();
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
    const quando = this.sala?.vaziaDesde != null ? this.sala.vaziaDesde + MINUTOS_VAZIA * 60_000 : null;
    await this.agendar(quando);
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
    if (deveFechar(this.sala, Date.now())) {
      this.sala.fase = 'fechada';
      await this.guardar();
      await this.encerrar();
    }
  }
}
