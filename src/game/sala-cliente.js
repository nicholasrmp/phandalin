// O cliente da sala: a conexão WebSocket de um navegador com o Durable Object.
//
// Sem tela e sem `window`: o `WebSocket` e o relógio entram por parâmetro, para
// os testes rodarem em Node com uma conexão de mentira. A tela (`view/menu-sala.js`)
// só escuta `aoVisao` e manda intenções por `enviar`.
//
// Reconexão (A-04): se a conexão cai sem o servidor ter mandado `fechada`, tenta
// de novo (1, 2, 4, 8, 15 s) e, ao reabrir, manda `entrar` outra vez: o servidor
// reconhece o `jogadorId` e devolve o lugar e os heróis. Fechamento 4000 é do
// servidor ("você foi removido", "sala fechada") e NÃO se reconecta.

export const ESPERAS_DE_RECONEXAO = [1000, 2000, 4000, 8000, 15000];
export const CODIGO_DO_SERVIDOR = 4000;

/** O batimento: um ping a cada 20 s; sem NENHUMA mensagem por 50 s, a conexão é dada como morta. */
export const INTERVALO_DO_PING = 20_000;
export const SILENCIO_MAXIMO = 50_000;

/**
 * O endereço do WebSocket da sala, a partir do endereço da página. O id do
 * jogador NÃO vai aqui: a URL aparece nos registros do servidor, e o id é um
 * segredo (quem o souber assume o lugar do jogador). Vai na primeira mensagem.
 */
export function urlDaSala(local, codigo) {
  const proto = local.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${local.host}/api/sala/${encodeURIComponent(codigo)}`;
}

/**
 * @param {object} o
 * @param {typeof WebSocket} o.WebSocketCtor
 * @param {string} o.jogadorId                          o id secreto deste navegador (ou aba)
 * @param {(codigo: string) => string} o.urlDe          o endereço do WebSocket de uma sala
 * @param {(visao: object) => void} o.aoVisao           o estado inteiro da sala, depois de cada mudança
 * @param {(vista: object) => void} o.aoPartida         a vista da partida que o anfitrião publica (F4); só chega a quem não é ele
 * @param {(msg: object) => void} o.aoNarrativa         uma página da narrativa que o anfitrião transmite (F4.3)
 * @param {(save: string|null) => void} o.aoAssumir     o servidor passou a você o posto de anfitrião (F6): o save da partida, em texto
 * @param {(texto: string) => void} o.aoAviso           o anfitrião diz por que o seu passo foi ignorado (F4.4)
 * @param {(msg: object) => void} o.aoIntencao          uma intenção de outro jogador (`agir`, `resposta`); só chega ao anfitrião (F4.3)
 * @param {(texto: string) => void} o.aoErro            a intenção foi recusada
 * @param {(motivo: string) => void} o.aoFechar         o servidor encerrou: removido, ou sala fechada (sem volta)
 * @param {(status: 'conectando'|'conectado'|'reconectando'|'caiu') => void} o.aoStatus
 */
export function criarClienteDeSala({
  WebSocketCtor, jogadorId, urlDe, aoVisao = () => {}, aoPartida = () => {}, aoNarrativa = () => {}, aoIntencao = () => {}, aoAviso = () => {}, aoConvite = () => {}, aoAssumir = () => {}, aoErro = () => {}, aoFechar = () => {}, aoStatus = () => {},
  agendar = (fn, ms) => setTimeout(fn, ms), cancelar = (id) => clearTimeout(id),
  repetir = (fn, ms) => setInterval(fn, ms), parar = (id) => clearInterval(id), relogio = () => Date.now(),
}) {
  let ws = null;
  let codigo = null;
  let abertura = null;       // a mensagem que apresenta o jogador: `criar` na primeira vez, `entrar` depois
  let nome = null;
  let tentativa = 0;
  let timer = null;
  let batida = null;
  let ultimaMensagem = 0;
  let encerrado = false;
  let confirmado = false;    // o servidor já respondeu à apresentação: antes disso, uma reconexão reenvia a MESMA

  function pararBatimento() { if (batida != null) { parar(batida); batida = null; } }

  function conectar() {
    aoStatus(confirmado ? 'reconectando' : 'conectando');
    const conexao = new WebSocketCtor(urlDe(codigo));
    ws = conexao;
    conexao.addEventListener('open', () => {
      if (ws !== conexao) return;
      tentativa = 0;
      ultimaMensagem = relogio();
      aoStatus('conectado');
      // Enquanto o servidor não confirmou a apresentação, repete a original (um `criar` que se
      // perdeu na queda); depois dela, sempre `entrar`, que o servidor reconhece pelo id.
      const msg = confirmado ? { tipo: 'entrar', nome } : abertura;
      conexao.send(JSON.stringify({ ...msg, eu: jogadorId }));
      pararBatimento();
      batida = repetir(() => {
        if (ws !== conexao) return;
        if (relogio() - ultimaMensagem > SILENCIO_MAXIMO) { try { conexao.close(); } catch { /* já fechado */ } return; }
        if (conexao.readyState === 1) conexao.send(JSON.stringify({ tipo: 'ping' }));
      }, INTERVALO_DO_PING);
    });
    conexao.addEventListener('message', (e) => {
      if (ws !== conexao) return;
      ultimaMensagem = relogio();
      let m;
      try { m = JSON.parse(e.data); } catch { return; }
      if (m?.tipo === 'sala') { confirmado = true; aoVisao(m.visao); }
      else if (m?.tipo === 'partida') aoPartida(m.vista);
      else if (m?.tipo === 'narrativa') aoNarrativa(m.msg);
      else if (m?.tipo === 'aviso') aoAviso(m.texto);
      else if (m?.tipo === 'assumir') aoAssumir(m.save ?? null);
      else if (m?.tipo === 'convite') aoConvite({ codigo: m.codigo, de: m.de });
      else if (m?.tipo === 'agir' || m?.tipo === 'resposta') aoIntencao(m);
      else if (m?.tipo === 'erro') { confirmado = true; aoErro(m.erro); }
      else if (m?.tipo === 'fechada') { encerrado = true; pararBatimento(); aoFechar(m.motivo ?? 'a sala foi fechada'); }
    });
    conexao.addEventListener('close', (e) => {
      if (ws !== conexao) return;
      ws = null;
      pararBatimento();
      if (encerrado || e.code === CODIGO_DO_SERVIDOR) { encerrado = true; return; }
      if (tentativa >= ESPERAS_DE_RECONEXAO.length) { aoStatus('caiu'); return; }
      timer = agendar(() => { timer = null; if (!encerrado) conectar(); }, ESPERAS_DE_RECONEXAO[tentativa]);
      tentativa += 1;
      aoStatus('reconectando');
    });
  }

  return {
    /** Abre a sala. `primeira` é `{ tipo: 'criar', ... }` ou `{ tipo: 'entrar', nome }`. */
    abrir(codigoDaSala, primeira) {
      codigo = codigoDaSala; abertura = primeira; nome = primeira.nome; encerrado = false; confirmado = false; tentativa = 0;
      conectar();
    },
    /** Uma intenção. Devolve `false` se a conexão não está aberta (a tela deve avisar). */
    enviar(msg) {
      if (!ws || ws.readyState !== 1) return false;
      ws.send(JSON.stringify(msg));
      return true;
    },
    /**
     * Sai por conta própria e não reconecta. Só avisa o servidor (`sair`, que tira o jogador da
     * sala) se ele já entrou; cancelar antes disso apenas fecha a conexão.
     */
    sair() {
      encerrado = true;
      pararBatimento();
      if (timer != null) { cancelar(timer); timer = null; }
      const conexao = ws;
      ws = null;
      if (conexao) { try { if (confirmado && conexao.readyState === 1) conexao.send(JSON.stringify({ tipo: 'sair' })); conexao.close(1000, 'saiu'); } catch { /* já fechado */ } }
    },
    /** Tentar de novo na hora (o botão "Tentar de novo" depois de `caiu`, ou a rede que voltou). */
    tentarDeNovo() {
      if (encerrado || ws) return;
      if (timer != null) { cancelar(timer); timer = null; }
      tentativa = 0;
      conectar();
    },
  };
}

// ---- quem sou eu, neste navegador ------------------------------------------------

const CHAVE_SALAS = 'phandalin:salas';
const CHAVE_NOME = 'phandalin:nome';

/**
 * O `jogadorId` desta aba. Com `?como=Beto` na página (para testar com duas abas
 * no mesmo navegador) o id é por ABA, em `sessionStorage`; sem isso é o id do
 * navegador (`game/save.js: jogadorLocal`), e quem volta reassume o lugar (L-03).
 */
export function jogadorDaAba({ busca, sessionStorage: sess, jogadorLocal }) {
  const como = new URLSearchParams(busca).get('como');
  if (!como) return jogadorLocal();
  try {
    const chave = `phandalin:aba:${como}`;
    let id = sess.getItem(chave);
    if (!id) { id = `aba-${como.replace(/[^A-Za-z0-9]/g, '').slice(0, 20)}-${Math.random().toString(36).slice(2, 12)}`; sess.setItem(chave, id); }
    return id;
  } catch { return jogadorLocal(); }
}

/** As salas recentes deste navegador (para "Retomar sala"). Só o que a tela precisa: o código, o nome e quando. */
export function salasRecentes(storage) {
  try {
    const l = JSON.parse(storage.getItem(CHAVE_SALAS) ?? '[]');
    return Array.isArray(l) ? l.filter((s) => s && typeof s.codigo === 'string' && typeof s.quando === 'number').slice(0, 5) : [];
  } catch { return []; }
}

export function lembrarSala(storage, codigo, agora = Date.now()) {
  try {
    const outras = salasRecentes(storage).filter((s) => s.codigo !== codigo);
    storage.setItem(CHAVE_SALAS, JSON.stringify([{ codigo, quando: agora }, ...outras].slice(0, 5)));
  } catch { /* sem armazém: não lembra */ }
}

export function esquecerSala(storage, codigo) {
  try { storage.setItem(CHAVE_SALAS, JSON.stringify(salasRecentes(storage).filter((s) => s.codigo !== codigo))); } catch { /* sem armazém */ }
}

const CHAVE_PERSONA = 'phandalin:persona';

/**
 * A persona deste navegador (T-02): a que o jogador escolheu da última vez, ou, na
 * primeira vez, uma das que têm arte sorteada (duas pessoas entrando juntas
 * raramente começam com a mesma figura; o marcador é que garante serem distintas).
 */
export function personaLembrada(storage, personas, aleatorio = Math.random) {
  try {
    const guardada = storage.getItem(CHAVE_PERSONA);
    if (guardada && personas.includes(guardada)) return guardada;
  } catch { /* sem armazém */ }
  return personas[Math.floor(aleatorio() * personas.length)];
}

export function lembrarPersona(storage, heroi) {
  try { storage.setItem(CHAVE_PERSONA, heroi); } catch { /* sem armazém */ }
}

export function nomeLembrado(storage) {
  try { return storage.getItem(CHAVE_NOME) ?? ''; } catch { return ''; }
}

export function lembrarNome(storage, nome) {
  try { storage.setItem(CHAVE_NOME, nome); } catch { /* sem armazém */ }
}
