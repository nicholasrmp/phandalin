// As telas do multijogador: criar sala, entrar e o lobby (MULTIJOGADOR.md, seção 6).
//
//   multi    criar, entrar, retomar uma sala recente
//   criar    nome e quantos jogadores (a aventura é a Mina Perdida: a F2 só cria
//            campanha nova; carregar save em sala pede a F4, com o jogo sincronizado)
//   entrar   o código (ou o link `?sala=ABC234`) e o nome
//   lobby    quem está na sala, os 12 heróis, pronto, iniciar
//
// O estado da sala vem do servidor (`game/sala-cliente.js`); aqui só se desenha
// o que chegou e se mandam intenções. A tela NUNCA decide o que vale: o servidor
// recusa o que não vale (`game/sala.js`), e o recado dele aparece aqui.

import { el } from './hud.js';
import { audio } from '../core/audio.js';
import { temArteImportada } from '../art/folhas/index.js';
import { HEROIS } from '../game/criacao.js';
import {
  gerarCodigo, aleatorioSeguro, normalizarCodigo, limparNome, MAX_NOME, TAMANHO_DO_GRUPO, PILOTO, HEROIS_COM_ARTE,
} from '../game/sala.js';
import {
  criarClienteDeSala, urlDaSala, salasRecentes, lembrarSala, esquecerSala, nomeLembrado, lembrarNome, personaLembrada, lembrarPersona,
} from '../game/sala-cliente.js';

export function criarTelasDeSala({
  botao, voltarBtn, cabecalho, ir, redesenhar, retratoDe,
  jogadorId, storage, local, WebSocketCtor = globalThis.WebSocket,
  taverna = null, partida = null, fecharMenu = () => {}, abrirMenuNaTela = () => {},
}) {
  const estado = {
    cliente: null, codigo: null, nome: '', visao: null, status: 'conectando', aviso: null, fechada: null,
  };

  const link = (codigo) => `${local.origin}${local.pathname}?sala=${codigo}`;

  function abrirSala(codigo, primeira) {
    estado.cliente?.sair();
    estado.codigo = codigo; estado.visao = null; estado.aviso = null; estado.fechada = null; estado.status = 'conectando';
    estado.partidaIniciada = false;
    primeira = { ...primeira, persona: personaLembrada(storage, HEROIS_COM_ARTE) };
    estado.nome = primeira.nome;
    lembrarNome(storage, primeira.nome);
    // Um cliente velho (de uma sala que o jogador já deixou) ainda pode entregar uma mensagem em
    // trânsito: só o cliente ATUAL escreve no estado.
    const atual = (fn) => (...a) => { if (estado.cliente === cliente) fn(...a); };
    const cliente = criarClienteDeSala({
      WebSocketCtor,
      jogadorId,
      urlDe: (c) => urlDaSala(local, c),
      aoVisao: atual((v) => {
        const primeira = !estado.visao;
        estado.visao = v; lembrarSala(storage, v.codigo);
        if (taverna) {
          // Na fase de lobby a sala é a taverna; quando a partida começa (ou fecha), volta o painel.
          if (v.fase === 'lobby') {
            if (!taverna.aberta()) { taverna.abrir(document.getElementById('app')); fecharMenu(); }
            taverna.atualizar(v);
            if (primeira) taverna.avisar(null);
          } else if (taverna.aberta()) {
            taverna.fechar();
            if (!partida || v.fase !== 'iniciada') abrirMenuNaTela('lobby');
          }
        }
        // F4: a partida começou. O anfitrião a roda, os outros a veem; o painel "A partida começou" some.
        if (partida && v.fase === 'iniciada') {
          if (!estado.partidaIniciada) {
            estado.partidaIniciada = true;
            fecharMenu();
            partida.aoComecar(v, { souAnfitriao: v.voce === v.anfitriao });
          }
          partida.aoSala?.(v);
        }
        redesenhar('lobby');
      }),
      aoPartida: atual((vista) => partida?.aoVista(vista)),
      aoNarrativa: atual((msg) => partida?.aoNarrativa?.(msg)),
      aoIntencao: atual((msg) => partida?.aoIntencao?.(msg)),
      aoAviso: atual((texto) => partida?.aoAviso?.(texto)),
      aoErro: atual((t) => {
        estado.aviso = t;
        // Na taverna o erro é uma frase embaixo do salão ("devagar", "não dá para chegar lá").
        if (taverna?.aberta() && estado.visao) { taverna.avisar(t); setTimeout(() => taverna.avisar(null), 2500); estado.aviso = null; return; }
        // Erro antes de a sala existir para este jogador (código que não existe, sala cheia, removido):
        // não há lobby a mostrar, e a conexão aberta não serve de nada.
        if (!estado.visao) { cliente.sair(); estado.status = 'recusada'; }
        else limparAvisoDepois();
        redesenhar('lobby');
      }),
      aoFechar: atual((motivo) => {
        estado.fechada = motivo; esquecerSala(storage, codigo);
        if (taverna?.aberta()) { taverna.fechar(); abrirMenuNaTela('lobby'); }
        if (estado.partidaIniciada) { estado.partidaIniciada = false; partida?.aoEncerrar(); abrirMenuNaTela('lobby'); }
        redesenhar('lobby');
      }),
      aoStatus: atual((s) => { if (estado.status !== 'recusada') estado.status = s; redesenhar('lobby'); }),
    });
    estado.cliente = cliente;
    cliente.abrir(codigo, primeira);
  }

  function sairDaSala() {
    estado.cliente?.sair();
    estado.cliente = null; estado.visao = null; estado.confirmar = null;
    taverna?.fechar();
    if (estado.partidaIniciada) { estado.partidaIniciada = false; partida?.aoEncerrar(); }
  }

  // O aviso some sozinho: uma visão nova (de outro jogador) não deve apagá-lo na hora, nem ele ficar para sempre.
  let relogioDoAviso = null;
  function limparAvisoDepois(ms = 4000) {
    clearTimeout(relogioDoAviso);
    relogioDoAviso = setTimeout(() => { estado.aviso = null; redesenhar('lobby'); }, ms);
  }

  // A mesma mensagem duas vezes em 300 ms é um duplo clique, não duas intenções.
  let ultimoEnvio = { texto: '', quando: 0 };
  const mandar = (msg) => {
    if (msg.tipo === 'persona') lembrarPersona(storage, msg.heroi);
    const texto = JSON.stringify(msg);
    const agora = Date.now();
    if (texto === ultimoEnvio.texto && agora - ultimoEnvio.quando < 300) return;
    ultimoEnvio = { texto, quando: agora };
    if (!estado.cliente?.enviar(msg)) { estado.aviso = 'Sem conexão com a sala. Aguarde a reconexão.'; limparAvisoDepois(); redesenhar('lobby'); }
  };

  /** Ações que não se desfazem (fechar a sala, remover alguém): o primeiro clique só pede confirmação, por 3 s. */
  function comConfirmacao(chave, msg) {
    if (estado.confirmar === chave) { estado.confirmar = null; mandar(msg); return; }
    estado.confirmar = chave;
    redesenhar('lobby');
    setTimeout(() => { if (estado.confirmar === chave) { estado.confirmar = null; redesenhar('lobby'); } }, 3000);
  }

  /** O Esc só larga o lobby quando não há sala a proteger: antes de entrar, depois de recusada ou encerrada. */
  const lobbyAtivo = () => Boolean(estado.visao) && !estado.fechada && estado.status !== 'recusada';

  // ------------------------------------------------------------ campos ----

  const campoDeTexto = (rotulo, { valor = '', maximo = MAX_NOME, id, dica = null, maiusculo = false, aoEnter = null } = {}) => {
    const campo = el('input', { type: 'text', id, maxlength: maximo, value: valor, autocomplete: 'off', spellcheck: 'false', 'aria-label': rotulo, placeholder: dica });
    if (maiusculo) campo.addEventListener('input', () => { campo.value = campo.value.toUpperCase(); });
    if (aoEnter) campo.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); aoEnter(); } });
    return el('label', { class: 'menu-campo' }, el('span', {}, rotulo), campo);
  };
  const valorDe = (id) => document.getElementById(id)?.value ?? '';

  // ------------------------------------------------------------- telas ----

  const TELAS = {
    multi: (dados) => {
      const recentes = salasRecentes(storage);
      return el('div', {},
        cabecalho('Multijogador', 'Jogue com amigos: encontrem-se na taverna e sentem na mesa de grupo para escolher os heróis.'),
        dados?.recado && el('p', { class: 'menu-recado erro', role: 'status' }, dados.recado),
        el('div', { class: 'menu-cartoes' },
          cartao('Criar sala', 'Você é o anfitrião: escolhe quantos jogam e passa o código aos amigos.', () => ir('salaCriar')),
          cartao('Entrar numa sala', 'Com o código de seis letras ou o link que o anfitrião mandou.', () => ir('salaEntrar'))),
        recentes.length > 0 && el('section', { class: 'menu-recentes' },
          el('h3', {}, 'Retomar sala'),
          el('ul', {}, recentes.map((s) => el('li', {},
            botao(`Sala ${s.codigo}`, () => ir('salaEntrar', { codigo: s.codigo }), { dica: 'Volta para o seu lugar, se a sala ainda existe' }))))),
        el('div', { class: 'menu-rodape' }, voltarBtn()));
    },

    salaCriar: (dados) => {
      const maximo = dados?.maximo ?? 4;
      const trocar = (n) => { audio.play('click'); const nome = valorDe('sala-nome'); ir.trocar({ ...dados, maximo: n, nome }); };
      const criar = () => {
        const nome = limparNome(valorDe('sala-nome'));
        if (!nome) { ir.recado('Escreva o seu nome (até 24 letras).'); return; }
        const codigo = gerarCodigo((n) => aleatorioSeguro(n));
        abrirSala(codigo, { tipo: 'criar', nome, maxJogadores: maximo, origem: { tipo: 'nova', aventura: 'mina-perdida' } });
        ir('lobby');
      };
      return el('div', {},
        cabecalho('Criar sala', 'A campanha começa do começo: A Mina Perdida de Phandelver.'),
        dados?.recado && el('p', { class: 'menu-recado erro', role: 'status' }, dados.recado),
        campoDeTexto('Seu nome', { id: 'sala-nome', valor: dados?.nome ?? nomeLembrado(storage), dica: 'Como os outros vão ver você', aoEnter: criar }),
        el('div', { class: 'menu-niveis', role: 'group', 'aria-label': 'Quantos jogadores' },
          [1, 2, 3, 4].map((n) => el('button', {
            class: `menu-nivel${n === maximo ? ' ativo' : ''}`, 'aria-pressed': String(n === maximo), onclick: () => trocar(n),
          }, `${n} jogador${n > 1 ? 'es' : ''}`))),
        el('p', { class: 'menu-nota' }, 'O grupo é sempre de quatro heróis. Com menos jogadores, cada um joga com mais de um; herói sem dono pode ficar no piloto automático.'),
        el('div', { class: 'menu-rodape' }, voltarBtn(), botao('Criar sala', criar, { primario: true })));
    },

    salaEntrar: (dados) => {
      const entrar = () => {
        const codigo = normalizarCodigo(valorDe('sala-codigo'));
        const nome = limparNome(valorDe('sala-nome'));
        if (!codigo) { ir.recado('O código tem seis letras e números (sem 0, O, 1, I, L).'); return; }
        if (!nome) { ir.recado('Escreva o seu nome (até 24 letras).'); return; }
        abrirSala(codigo, { tipo: 'entrar', nome });
        ir('lobby');
      };
      return el('div', {},
        cabecalho('Entrar numa sala', 'O anfitrião passa o código; ele também aparece no link da sala.'),
        dados?.recado && el('p', { class: 'menu-recado erro', role: 'status' }, dados.recado),
        campoDeTexto('Código da sala', { id: 'sala-codigo', valor: dados?.codigo ?? '', maximo: 6, dica: 'ABC234', maiusculo: true, aoEnter: entrar }),
        campoDeTexto('Seu nome', { id: 'sala-nome', valor: dados?.nome ?? nomeLembrado(storage), dica: 'Como os outros vão ver você', aoEnter: entrar }),
        el('div', { class: 'menu-rodape' }, voltarBtn(), botao('Entrar', entrar, { primario: true })));
    },

    lobby: () => telaDoLobby(),
  };

  function cartao(titulo, texto, onclick) {
    return el('button', { class: 'menu-cartao', onclick: () => { audio.play('click'); onclick(); } }, el('strong', {}, titulo), el('span', {}, texto));
  }

  // ------------------------------------------------------------- lobby ----

  const NOMES_DE_STATUS = { conectando: 'Conectando…', conectado: 'Entrando na sala…', reconectando: 'Reconectando…', caiu: 'Sem conexão com a sala.' };

  function telaDoLobby() {
    const v = estado.visao;
    const sair = () => { sairDaSala(); estado.status = 'conectando'; estado.aviso = null; estado.fechada = null; ir.aoMulti(); };

    if (estado.fechada) {
      return el('div', {},
        cabecalho('Sala encerrada', estado.fechada),
        el('div', { class: 'menu-rodape' }, botao('Voltar ao menu', () => { sairDaSala(); ir.raiz(); }, { primario: true })));
    }
    if (!v) {
      const recusada = estado.status === 'recusada';
      return el('div', {},
        cabecalho(`Sala ${estado.codigo}`, recusada ? 'Não foi possível entrar nesta sala.'
          : (NOMES_DE_STATUS[estado.status] ?? 'Entrando na sala…')),
        estado.aviso && el('p', { class: 'menu-recado erro', role: 'status' }, estado.aviso),
        el('div', { class: 'menu-rodape' }, botao(recusada ? 'Voltar' : 'Cancelar', sair, { primario: recusada }),
          estado.status === 'caiu' && botao('Tentar de novo', () => estado.cliente?.tentarDeNovo(), { primario: true })));
    }

    const eu = v.jogadores.find((j) => j.id === v.voce);
    const souAnfitriao = v.voce === v.anfitriao;
    const sem = estado.status !== 'conectado';   // sem conexão, nenhuma ação vale: a tela diz em vez de prometer
    const meusHerois = eu?.herois ?? [];
    const nomeDe = (pub) => (pub === PILOTO ? 'Piloto automático' : v.jogadores.find((j) => j.id === pub)?.nome ?? '?');

    if (v.fase === 'iniciada') {
      return el('div', {},
        cabecalho('A partida começou', `Sala ${v.codigo}`),
        el('p', { class: 'menu-nota' }, 'O grupo está formado. O jogo sincronizado entre os jogadores é a próxima fase da construção: por enquanto a sala guarda quem joga com quem.'),
        el('ul', { class: 'menu-grupo-final' }, Object.entries(v.herois).map(([id, dono]) => el('li', {}, `${HEROIS.find((h) => h.id === id)?.name ?? id} — ${nomeDe(dono)}`))),
        el('div', { class: 'menu-rodape' }, botao('Sair da sala', sair)));
    }

    return el('div', { class: 'menu-lobby' },
      cabecalho(`Sala ${v.codigo}`, `${v.origem.tipo === 'nova' ? 'Campanha nova' : 'Save'}: A Mina Perdida de Phandelver · até ${v.maxJogadores} jogador${v.maxJogadores > 1 ? 'es' : ''}`),
      estado.status !== 'conectado' && el('p', { class: 'menu-recado erro', role: 'status' }, NOMES_DE_STATUS[estado.status],
        estado.status === 'caiu' && botao('Tentar de novo', () => estado.cliente?.tentarDeNovo(), { chave: 'tentar' })),
      estado.aviso && el('p', { class: 'menu-recado erro', role: 'status' }, estado.aviso),
      el('div', { class: 'menu-lobby-topo' },
        el('span', { class: 'menu-codigo', title: 'O código da sala' }, v.codigo),
        botao('Copiar link', () => copiar(link(v.codigo)), { dica: link(v.codigo) })),

      el('section', { class: 'menu-lobby-jogadores' }, el('h3', {}, 'Jogadores'),
        el('ul', {}, v.jogadores.map((j) => linhaDeJogador(j, v, souAnfitriao)))),

      el('section', {}, el('h3', {}, `Heróis (${Object.keys(v.herois).length} de ${TAMANHO_DO_GRUPO})`),
        v.limiteDeHerois < TAMANHO_DO_GRUPO && el('p', { class: 'menu-nota' }, `Com ${v.jogadores.length} jogadores, cada um pode ter até ${v.limiteDeHerois} herói${v.limiteDeHerois > 1 ? 's' : ''}.`),
        el('div', { class: 'menu-herois-sala' }, HEROIS.map((h) => cartaoDeHeroi(h, v, { eu, souAnfitriao, meusHerois, nomeDe, sem })))),

      // D4: a corda do grupo. Só o anfitrião muda; os outros veem o que ficou.
      el('section', { class: 'menu-lobby-corda' }, el('h3', {}, 'Corda do grupo'),
        el('p', { class: 'menu-nota' }, v.corda === 'livre'
          ? 'Livre: cada herói vai aonde quiser, mesmo longe dos outros.'
          : 'Unido: um herói não se afasta mais de 12 casas dos outros, para ninguém começar a luta sozinho.'),
        souAnfitriao && botao(v.corda === 'livre' ? 'Mudar para Unido' : 'Mudar para Livre', () => mandar({ tipo: 'corda', valor: v.corda === 'livre' ? 'unido' : 'livre' }),
          { chave: 'corda', desabilitado: sem })),

      v.pendencias.length > 0 && el('ul', { class: 'menu-pendencias' }, v.pendencias.map((p) => el('li', {}, p))),
      el('div', { class: 'menu-rodape' },
        // O anfitrião não "sai": a sala é dele, e ele a fecha (a F6 trata a troca de anfitrião).
        taverna?.aberta() && botao('Voltar à taverna', () => fecharMenu(), { chave: 'taverna', primario: true }),
        !souAnfitriao && botao('Sair da sala', sair, { chave: 'sair' }),
        souAnfitriao && botao(estado.confirmar === 'fechar' ? 'Clique de novo: fechar' : 'Fechar sala', () => comConfirmacao('fechar', { tipo: 'fechar' }),
          { chave: 'fechar', desabilitado: sem, dica: 'Encerra a sala para todos' }),
        eu && botao(eu.pronto ? 'Não estou pronto' : 'Estou pronto', () => mandar({ tipo: 'pronto', valor: !eu.pronto }),
          { primario: !eu.pronto, chave: 'pronto', desabilitado: sem || meusHerois.length === 0, dica: meusHerois.length === 0 ? 'Pegue um herói antes' : null }),
        souAnfitriao && botao('Iniciar', () => mandar({ tipo: 'iniciar' }),
          { primario: v.pendencias.length === 0, chave: 'iniciar', desabilitado: sem || v.pendencias.length > 0, dica: v.pendencias[0] ?? null }),
        souAnfitriao && v.jogadores.some((j) => !j.conectado) && botao('Iniciar com piloto', () => mandar({ tipo: 'iniciar', aceitarPiloto: true }),
          { chave: 'iniciar-piloto', desabilitado: sem, dica: 'Os heróis de quem está desconectado vão para o piloto automático' })));
  }

  function linhaDeJogador(j, v, souAnfitriao) {
    const marcas = [j.id === v.anfitriao && 'anfitrião', j.id === v.lider && j.id !== v.anfitriao && 'líder', j.id === v.voce && 'você'].filter(Boolean).join(' · ');
    const situacao = j.conectado ? (j.pronto ? 'pronto' : 'aqui') : 'fora';
    const texto = { pronto: 'pronto', aqui: 'conectado', fora: 'desconectado' }[situacao];
    return el('li', { class: `menu-jogador${j.conectado ? '' : ' ausente'}` },
      el('span', { class: `menu-ponto ${situacao}`, title: texto, 'aria-hidden': 'true' }),
      el('strong', {}, j.nome),
      el('small', { class: 'menu-situacao' }, texto),
      marcas && el('small', {}, marcas),
      el('span', { class: 'menu-jogador-herois' }, j.herois.map((h) => HEROIS.find((x) => x.id === h)?.name ?? h).join(', ') || 'sem herói'),
      souAnfitriao && j.id !== v.anfitriao && el('span', { class: 'menu-jogador-acoes' },
        j.id !== v.lider && botao('Líder', () => mandar({ tipo: 'lider', jogador: j.id }), { chave: `lider:${j.id}`, aria: `Passar a liderança para ${j.nome}`, dica: 'Passar a liderança' }),
        botao(estado.confirmar === `remover:${j.id}` ? 'Clique de novo' : 'Remover', () => comConfirmacao(`remover:${j.id}`, { tipo: 'remover', jogador: j.id }),
          { chave: `remover:${j.id}`, aria: `Remover ${j.nome}`, dica: 'Tira o jogador da sala; ele não volta' })));
  }

  function cartaoDeHeroi(h, v, { eu, souAnfitriao, meusHerois, nomeDe, sem }) {
    const dono = v.herois[h.id] ?? null;
    const meu = dono && dono === v.voce;
    const comArte = temArteImportada(h.look);
    const cheio = Object.keys(v.herois).length >= TAMANHO_DO_GRUPO;
    const noLimite = meusHerois.length >= v.limiteDeHerois;
    let acao = null;
    if (!comArte) acao = el('small', { class: 'menu-sem-regra' }, 'Não disponível');
    else if (meu || (dono === PILOTO && souAnfitriao)) acao = botao('Largar', () => mandar({ tipo: 'largar', heroi: h.id }), { chave: `largar:${h.id}`, aria: `Largar ${h.name}`, desabilitado: sem });
    else if (!dono) {
      acao = el('span', { class: 'menu-heroi-acoes' },
        eu && botao('Pegar', () => mandar({ tipo: 'pegar', heroi: h.id }),
          { primario: true, chave: `pegar:${h.id}`, aria: `Pegar ${h.name}`, desabilitado: sem || cheio || noLimite, dica: cheio ? 'O grupo já tem quatro heróis' : noLimite ? 'Os outros jogadores ficariam sem herói' : null }),
        souAnfitriao && botao('Piloto', () => mandar({ tipo: 'piloto', heroi: h.id }), { chave: `piloto:${h.id}`, aria: `${h.name} no piloto automático`, desabilitado: sem || cheio, dica: 'Fica no piloto automático' }));
    }
    const rosto = retratoDe(h.look);
    return el('div', { class: `menu-heroi-sala${meu ? ' meu' : ''}${dono && !meu ? ' ocupado' : ''}${comArte ? '' : ' apagado'}` },
      el('span', { class: 'menu-heroi-rosto' }, rosto ?? el('canvas', { width: 48, height: 48, class: 'pixel' })),
      el('strong', {}, h.name),
      el('small', {}, `${h.className}`),
      dono && el('em', {}, meu ? 'seu' : nomeDe(dono)),
      acao);
  }

  async function copiar(texto) {
    try { await navigator.clipboard.writeText(texto); estado.aviso = 'Link copiado.'; } catch { estado.aviso = texto; }
    redesenhar('lobby');
  }

  /** Estou numa sala (a taverna, a mesa de grupo ou a partida iniciada)? O menu, por cima dela, não é o título. */
  const dentroDeSala = () => Boolean(estado.visao) && !estado.fechada && estado.status !== 'recusada';
  const souAnfitriao = () => Boolean(estado.visao) && estado.visao.voce === estado.visao.anfitriao;
  function avisar(texto) { estado.aviso = texto; limparAvisoDepois(5000); redesenhar('lobby'); }
  /** A vista da partida (F4): vai direto, sem a trava de mensagem repetida de `mandar`, e só o anfitrião a envia. */
  const mandarVista = (vista) => estado.cliente?.enviar({ tipo: 'partida', vista }) ?? false;
  /** Uma mensagem da partida (F4.3): a narrativa do anfitrião, a intenção de quem joga, a resposta do líder. Sem a trava de repetição. */
  const mandarCru = (msg) => estado.cliente?.enviar(msg) ?? false;
  return { TELAS, abrirSala, sairDaSala, estado, lobbyAtivo, mandar, mandarVista, mandarCru, dentroDeSala, souAnfitriao, avisar, copiarLink: () => copiar(link(estado.codigo)) };
}
