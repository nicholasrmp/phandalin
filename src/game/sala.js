// A sala do multijogador: a máquina de estados do lobby (MULTIJOGADOR.md, seção 6,
// L-01…L-12, Fase 2).
//
// Este arquivo é PURO: sem tela, sem rede, sem relógio próprio. O Durable Object
// (`worker/sala-do.js`) guarda o estado e retransmite; o navegador desenha. As
// regras moram aqui para serem testadas em Node e para o cliente e o servidor
// nunca discordarem sobre o que é uma jogada válida.
//
// O que a sala é: quem está nela, qual herói é de quem, quem está pronto e se a
// partida começou. NÃO é o jogo: a Fase 2 entrega "dois jogadores, cada um pega
// um herói", sem sincronizar nada do tabuleiro (isso é a F4 em diante).
//
// Toda mudança entra por `aplicar(sala, jogadorId, mensagem)`. Ela confere TUDO
// (quem manda, o tipo de cada campo, o limite de cada lista): a mensagem vem de
// um navegador, e um navegador é entrada hostil.
//
// O `jogadorId` é um SEGREDO (quem o souber assume o lugar da pessoa, L-03): ele
// nunca sai daqui. Os clientes veem só o rótulo público `pub` ('p1', 'p2'…).

import { PADRAO_DA_CORDA, MODOS_DA_CORDA } from './corda.js';
import { acaoRemotaValida, tilesValidos, circuloValido } from './acoes.js';
import { key } from '../core/grid.js';
import {
  campoDaTaverna, caminhoNaTaverna, casaLivre, NASCEDOUROS, marcadorLivre, marcadorN, LARGURA, ALTURA,
} from './taverna.js';

export const VERSAO_DA_SALA = 1;

/**
 * F6, A-04: o anfitrião roda o jogo, então se ele cai a partida para. Passado este tempo sem ele (a aba que recarrega volta
 * antes), o servidor passa o posto a quem está conectado, que retoma do último save que o anfitrião mandou.
 */
export const GRACA_DO_ANFITRIAO_MS = 20_000;

/** O que um jogador de fora pode pedir ao anfitrião durante a partida (F4.3 andar; F5 atacar e terminar o turno do herói). */
export const ACOES_DA_PARTIDA = ['mover', 'atacar', 'terminar', 'usar', 'lugar', 'descanso', 'comprar', 'vender', 'equipar', 'contexto', 'contexto-escolher', 'nivel', 'preparar', 'vila-acao', 'descanso-dado', 'descanso-magia', 'descanso-pronto', 'alfinete', 'pronto-cena'];
export const ENCAIXES = ['maoPrincipal', 'maoSecundaria', 'armadura', 'escudo'];

/** Os doze heróis prontos (`game/criacao.js: HEROIS`). O teste confere que não saíram do lugar. */
export const HEROIS_JOGAVEIS = [
  'pc-guerreiro', 'pc-ladino', 'pc-clerigo', 'pc-mago', 'pc-barbaro', 'pc-druida',
  'pc-bruxo', 'pc-feiticeira', 'pc-paladino', 'pc-guardiao', 'pc-monja', 'pc-barda',
];

/**
 * Quem tem arte final do PixelLab (as 8 direções e as animações) e por isso pode
 * ser persona na taverna (T-02). Os outros ganham a vez quando ganharem folha.
 */
export const HEROIS_COM_ARTE = ['pc-guerreiro', 'pc-ladino', 'pc-clerigo', 'pc-mago', 'pc-barbaro', 'pc-paladino', 'pc-guardiao'];
export const PERSONA_PADRAO = 'pc-guerreiro';

/**
 * Quanto tempo cada casa andada ocupa o avatar (T-11): o servidor só aceita outro `mover` do mesmo
 * jogador quando o anterior já terminaria de andar, e a tela anda no mesmo ritmo. Sem isto o
 * servidor aceitaria um trajeto de 20 casas e outro 150 ms depois, e a figura "pularia" nos outros.
 */
export const MS_POR_CASA = 200;

export const TAMANHO_DO_GRUPO = 4;
export const MAX_JOGADORES = 4;
export const MAX_NOME = 24;
export const MAX_REMOVIDOS = 32;
export const PILOTO = 'piloto';

/** L-12: sala sem ninguém conectado por 30 minutos fecha (o save permanece). */
export const MINUTOS_VAZIA = 30;

// L-02: seis caracteres de um alfabeto sem ambíguos (sem 0/O, 1/I/L). São 31
// símbolos, não 32: tirando só esses cinco do alfabeto de letras e dígitos, é o
// que sobra. 31^6 ≈ 8,9 × 10^8 combinações.
export const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const TAMANHO_DO_CODIGO = 6;

/**
 * Um código novo. `aleatorio(n)` devolve um inteiro de 0 a n-1 (no navegador e no
 * Worker, `crypto.getRandomValues`; nos testes, uma semente).
 */
export function gerarCodigo(aleatorio) {
  let c = '';
  for (let i = 0; i < TAMANHO_DO_CODIGO; i += 1) c += ALFABETO[aleatorio(ALFABETO.length)];
  return c;
}

/** Sorteio sem viés por `crypto.getRandomValues` (rejeita o resto que enviesaria). */
export function aleatorioSeguro(n, cripto = globalThis.crypto) {
  const limite = Math.floor(0x100000000 / n) * n;
  const buf = new Uint32Array(1);
  for (;;) {
    cripto.getRandomValues(buf);
    if (buf[0] < limite) return buf[0] % n;
  }
}

/** O código como o jogador o digita: maiúsculas, sem espaços; `null` se não for um código. */
export function normalizarCodigo(texto) {
  if (typeof texto !== 'string') return null;
  const c = texto.trim().toUpperCase();
  if (c.length !== TAMANHO_DO_CODIGO) return null;
  return [...c].every((ch) => ALFABETO.includes(ch)) ? c : null;
}

/** Um nome de exibição limpo, ou `null`: sem controle, sem espaço dobrado, 1 a 24 caracteres. */
export function limparNome(texto) {
  if (typeof texto !== 'string') return null;
  // eslint-disable-next-line no-control-regex
  const n = texto.normalize('NFC').replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩]/g, '').replace(/\s+/g, ' ').trim();
  return n.length >= 1 && n.length <= MAX_NOME ? n : null;
}

/**
 * Um id de jogador aceitável: o UUID do `localStorage`, ou algo do mesmo feitio.
 * Exige um hífen: sem isso `constructor`, `toString` e afins passariam, e com um
 * objeto comum no lugar de mapa eles apareceriam "dentro" da sala pelo protótipo.
 */
export const idValido = (id) => typeof id === 'string' && /^[A-Za-z0-9_-]{8,64}$/.test(id) && id.includes('-');

/** O jogador da sala com esse id SECRETO, só se for dele mesmo (nunca do protótipo). */
export const jogadorDe = (sala, id) => (typeof id === 'string' && Object.hasOwn(sala.jogadores, id) ? sala.jogadores[id] : undefined);

// ----------------------------------------------------------------- a taverna --

let campoEmCache = null;
/** O campo da taverna, montado uma vez: o mesmo mapa que o navegador desenha. */
const campo = () => (campoEmCache ??= campoDaTaverna());

const casasOcupadas = (sala, menos = null) => new Set(Object.entries(sala.avatares)
  .filter(([id]) => id !== menos).map(([, a]) => key(a.x, a.y)));

/**
 * T-06: o nome é único por sala. O segundo "Gandalf" vira "Gandalf (2)", e o terceiro "Gandalf (3)".
 * O corte de um nome longo é por CARACTERE (nunca no meio de um emoji) e sem deixar espaço sobrando.
 */
export function nomeUnico(sala, nome) {
  const usados = new Set(Object.values(sala.jogadores).map((j) => j.nome));
  if (!usados.has(nome)) return nome;
  for (let n = 2; n < 1000; n++) {
    const sufixo = ` (${n})`;
    const base = [...nome].slice(0, Math.max(1, MAX_NOME - sufixo.length)).join('').trimEnd();
    const candidato = `${base}${sufixo}`;
    if (!usados.has(candidato)) return candidato;
  }
  return nome;
}

/**
 * T-14: a conversa do B0/B1 são FRASES PRONTAS, nunca texto livre (isso é do B2, com moderação). O servidor
 * só aceita um destes ids; o texto é do cliente, que o mostra num balão sobre a cabeça por alguns segundos.
 */
export const EMOTES = [
  { id: 'ola', texto: 'Olá!' },
  { id: 'brinde', texto: 'Um brinde!' },
  { id: 'risada', texto: 'Ha ha ha!' },
  { id: 'duvida', texto: 'Hmm…' },
  { id: 'jogar', texto: 'Bora jogar?' },
  { id: 'valeu', texto: 'Valeu!' },
  { id: 'tchau', texto: 'Até mais!' },
];
export const MS_ENTRE_EMOTES = 2000;

const personaValida = (h) => (HEROIS_COM_ARTE.includes(h) ? h : PERSONA_PADRAO);

/** Põe o avatar de um jogador na taverna: persona, marcador e uma casa livre perto da porta. */
function nascer(sala, jogadorId, persona, agora) {
  const usados = new Set(Object.values(sala.avatares).map((a) => a.marcador));
  const marcador = marcadorLivre(usados) ?? 0;
  const casa = casaLivre(campo(), NASCEDOUROS[0], casasOcupadas(sala)) ?? NASCEDOUROS[0];
  sala.avatares[jogadorId] = { x: casa.x, y: casa.y, persona: personaValida(persona), marcador, livreEm: 0 };
}

/**
 * A figura que aparece na taverna (T-03): o PRIMEIRO herói que o jogador pegou, na ordem em que pegou,
 * entre os que têm arte (T-02: o look pintado por código não aparece na taverna); sem nenhum, a persona.
 * Pegar um segundo herói não troca a figura, e largar o primeiro passa para o seguinte.
 */
export function figuraDe(sala, jogadorId) {
  const comArte = heroisDe(sala, jogadorId).find((h) => HEROIS_COM_ARTE.includes(h));
  return comArte ?? sala.avatares?.[jogadorId]?.persona ?? PERSONA_PADRAO;
}

// ------------------------------------------------------------------- criar --

/**
 * L-01. O anfitrião cria a sala escolhendo o que se joga e quantos jogadores.
 * `origem` é `{ tipo: 'nova', aventura }` ou `{ tipo: 'save', aventura, resumo }`
 * (a aventura vem do save; o save em si fica com o anfitrião, que roda o jogo).
 */
export function criarSala({ codigo, anfitriao, nome, maxJogadores = MAX_JOGADORES, origem, persona, agora }) {
  if (!normalizarCodigo(codigo)) return { ok: false, erro: 'código inválido' };
  if (!idValido(anfitriao)) return { ok: false, erro: 'jogador inválido' };
  const nomeLimpo = limparNome(nome);
  if (!nomeLimpo) return { ok: false, erro: 'nome inválido' };
  if (!Number.isInteger(maxJogadores) || maxJogadores < 1 || maxJogadores > MAX_JOGADORES) return { ok: false, erro: 'número de jogadores inválido' };
  const o = origem ?? { tipo: 'nova', aventura: 'mina-perdida' };
  if (!['nova', 'save'].includes(o.tipo) || typeof o.aventura !== 'string' || o.aventura.length > 40) return { ok: false, erro: 'aventura inválida' };
  const sala = {
    versao: VERSAO_DA_SALA,
    codigo,
    criadaEm: agora,
    fase: 'lobby',
    origem: { tipo: o.tipo, aventura: o.aventura, resumo: o.tipo === 'save' && typeof o.resumo === 'string' ? o.resumo.slice(0, 120) : null },
    maxJogadores,
    anfitriao,
    lider: anfitriao,
    // A corda do grupo (J-03, D4): `unido` ou `livre`, escolha do anfitrião no lobby (`game/corda.js`).
    corda: PADRAO_DA_CORDA,
    ordem: [anfitriao],
    proximoPub: 2,
    jogadores: { [anfitriao]: { id: anfitriao, pub: 'p1', nome: nomeLimpo, conectado: true, pronto: false, desde: agora } },
    herois: {},
    // Cada jogador anda na taverna com UM avatar: onde está, a persona e o marcador (T-05).
    avatares: {},
    // Heróis que o anfitrião mandou para o piloto automático quando o dono estava ausente: quem
    // volta recupera os seus (A-04). Herói posto no piloto de propósito nunca entra aqui.
    cedidos: {},
    removidos: [],
    vaziaDesde: null,
  };
  nascer(sala, anfitriao, persona, agora);
  return { ok: true, sala };
}

// ----------------------------------------------------------------- consultas --

export const heroisDe = (sala, jogadorId) => Object.entries(sala.herois).filter(([, dono]) => dono === jogadorId).map(([h]) => h);
export const jogadoresPresentes = (sala) => sala.ordem.map((id) => jogadorDe(sala, id)).filter(Boolean);
/** O id secreto de quem tem o rótulo público `pub` (o que os clientes veem). */
export const idPorPub = (sala, pub) => (typeof pub === 'string' ? Object.values(sala.jogadores).find((j) => j.pub === pub)?.id ?? null : null);
const conectados = (sala) => jogadoresPresentes(sala).filter((j) => j.conectado);

/**
 * L-07: o grupo é sempre de 4 e cada jogador tem pelo menos 1 herói. Quantos um
 * jogador pode segurar para os outros ainda caberem: 4 menos um para cada outro.
 */
/**
 * Quantos heróis `jogadorId` pode segurar. Cada jogador controla UM herói (regra do autor); o anfitrião fica também com os que
 * SOBRAM (com menos de quatro jogadores): os que nenhum outro pegou. Ele nunca segura tantos que um jogador fique sem o dele.
 */
export const limiteDeHerois = (sala, jogadorId = sala.anfitriao) => (jogadorId === sala.anfitriao ? TAMANHO_DO_GRUPO - (sala.ordem.length - 1) : 1);

/**
 * O que falta para iniciar (L-11), em frases para o anfitrião. Lista vazia =
 * pode iniciar. Ausentes não bloqueiam se o anfitrião aceitar o piloto, e
 * essa opção aparece como `aceitarPiloto` na tela.
 */
export function pendenciasParaIniciar(sala, { aceitarPiloto = false } = {}) {
  const faltas = [];
  if (sala.fase !== 'lobby') return ['a partida já começou'];
  const escolhidos = Object.keys(sala.herois).length;
  if (escolhidos < TAMANHO_DO_GRUPO) faltas.push(`faltam ${TAMANHO_DO_GRUPO - escolhidos} herói${TAMANHO_DO_GRUPO - escolhidos > 1 ? 's' : ''} no grupo`);
  for (const j of jogadoresPresentes(sala)) {
    if (heroisDe(sala, j.id).length === 0) faltas.push(`${j.nome} ainda não pegou um herói`);
    else if (j.conectado && !j.pronto) faltas.push(`${j.nome} não está pronto`);
    else if (!j.conectado && !aceitarPiloto) faltas.push(`${j.nome} está desconectado (remova ou aceite o piloto automático)`);
  }
  return faltas;
}

// -------------------------------------------------------------------- aplicar --

const ok = (extra = {}) => ({ ok: true, ...extra });
const recusa = (erro) => ({ ok: false, erro });

/**
 * Mudar o grupo desfaz o "pronto" de TODOS: o que cada um aprovou já não é o que
 * está na tela (alguém pegou, largou, saiu ou foi removido).
 */
const desfazerProntos = (sala) => { for (const j of jogadoresPresentes(sala)) j.pronto = false; };

const soAnfitriao = (sala, id) => (id === sala.anfitriao ? null : recusa('só o anfitrião pode fazer isso'));
const heroiValido = (h) => typeof h === 'string' && HEROIS_JOGAVEIS.includes(h);

/**
 * Aplica UMA intenção de `jogadorId`. Muta `sala` só quando dá certo. Devolve
 * `{ ok: true, ... }` ou `{ ok: false, erro }`. O transporte diz QUEM mandou
 * (`jogadorId`); a mensagem nunca carrega essa informação.
 */
export function aplicar(sala, jogadorId, mensagem, agora = 0) {
  if (sala.fase === 'fechada') return recusa('a sala foi fechada');
  if (!mensagem || typeof mensagem !== 'object' || typeof mensagem.tipo !== 'string') return recusa('mensagem inválida');
  sala.avatares ??= {};   // uma sala guardada antes da taverna
  const eu = jogadorDe(sala, jogadorId);

  if (mensagem.tipo === 'entrar') {
    if (sala.removidos.includes(jogadorId)) return recusa('você foi removido desta sala');
    const nome = limparNome(mensagem.nome);
    if (eu) {
      // Quem volta no mesmo navegador reassume o lugar (L-03), e os heróis que o
      // piloto automático segurou por ele durante a ausência (A-04).
      // O avatar guardado pode ter ficado numa casa que o mapa de hoje bloqueia (um deploy mudou a mobília).
      const av = sala.avatares[jogadorId];
      if (!av || !campo().inside(av.x, av.y) || campo().blocksMove(av.x, av.y)) nascer(sala, jogadorId, mensagem.persona, agora);
      const devolveu = devolverHerois(sala, jogadorId);   // antes do `||`: não pode ser pulado
      // O nome NÃO muda na volta: o cliente reenvia o digitado a cada reconexão, e trocá-lo desfaria o
      // "Gandalf (2)" (T-06) ou deixaria alguém tomar o nome de outro.
      const mudou = devolveu || !eu.conectado || sala.vaziaDesde != null;
      eu.conectado = true;
      sala.vaziaDesde = null;
      if (jogadorId === sala.anfitriao) sala.anfitriaoAusenteDesde = null;
      return ok({ reentrou: true, igual: !mudou });
    }
    if (!idValido(jogadorId)) return recusa('jogador inválido');
    if (!nome) return recusa('nome inválido');
    if (sala.fase !== 'lobby' && sala.fase !== 'iniciada') return recusa('a partida já acabou');
    if (sala.ordem.length >= sala.maxJogadores) return recusa('a sala está cheia');
    // Um jogador novo diminui o limite de todos: se alguém já segura mais do que sobraria, não cabe (só no lobby: na partida, ninguém perde herói).
    const limiteDepois = TAMANHO_DO_GRUPO - sala.ordem.length;
    if (sala.fase === 'lobby' && jogadoresPresentes(sala).some((j) => heroisDe(sala, j.id).length > limiteDepois)) {
      return recusa('um jogador está com heróis demais: peça para ele soltar um antes de entrar mais gente');
    }
    sala.ordem.push(jogadorId);
    sala.jogadores[jogadorId] = { id: jogadorId, pub: `p${sala.proximoPub}`, nome: nomeUnico(sala, nome), conectado: true, pronto: false, desde: agora };
    sala.proximoPub += 1;
    nascer(sala, jogadorId, mensagem.persona, agora);
    sala.vaziaDesde = null;
    // Entrar com a partida em andamento: fica com um herói que SOBROU (o anfitrião o conduzia) ou, se não há, só assiste.
    if (sala.fase === 'iniciada') {
      const sobra = heroiQueSobra(sala);
      if (sobra) sala.herois[sobra] = jogadorId;
      return ok({ reentrou: false, entrouNaPartida: true });
    }
    desfazerProntos(sala);
    return ok({ reentrou: false });
  }

  if (!eu) return recusa('você não está nesta sala');

  switch (mensagem.tipo) {
    case 'sair': {
      // O anfitrião é a sala: se for embora, ela fecha (ou ele passa o posto... o que a F6 resolve).
      if (jogadorId === sala.anfitriao) return recusa('o anfitrião não sai: feche a sala');
      saiu(sala, jogadorId, agora);
      return ok({ saiu: jogadorId });
    }
    case 'mover': {
      if (sala.fase !== 'lobby') return recusa('a partida já começou');
      const { x, y } = mensagem;
      if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= LARGURA || y >= ALTURA) return recusa('casa inexistente');
      const av = sala.avatares[jogadorId];
      if (!av) return recusa('você não está na taverna');
      if (av.x === x && av.y === y) return ok({ igual: true });
      if (agora < (av.livreEm ?? 0)) return recusa('devagar');
      const caminho = caminhoNaTaverna(campo(), { x: av.x, y: av.y }, { x, y }, casasOcupadas(sala, jogadorId));
      if (!caminho.length) return recusa('não dá para chegar lá');
      av.x = x; av.y = y;
      av.livreEm = agora + (caminho.length - 1) * MS_POR_CASA;   // só anda de novo quando esta caminhada acabar
      return ok();
    }
    case 'emote': {
      if (sala.fase !== 'lobby') return recusa('a partida já começou');
      if (!EMOTES.some((e) => e.id === mensagem.id)) return recusa('essa frase não existe');
      const av = sala.avatares[jogadorId];
      if (!av) return recusa('você não está na taverna');
      if (agora < (av.emoteLivreEm ?? 0)) return recusa('devagar');
      av.emote = { id: mensagem.id, n: (av.emote?.n ?? 0) + 1 };   // `n` faz a MESMA frase de novo valer como nova
      av.emoteLivreEm = agora + MS_ENTRE_EMOTES;
      return ok();
    }
    // F4.3: as intenções de quem NÃO roda a partida. O servidor confere o que pode conferir (de quem é o herói, quem
    // é o líder) e repassa ao anfitrião, que é quem aplica (A-01); o estado da sala não muda (`igual`).
    case 'agir': {
      if (sala.fase !== 'iniciada') return recusa('a partida não está em andamento');
      if (jogadorId === sala.anfitriao) return recusa('o anfitrião age pela própria tela');
      if (!ACOES_DA_PARTIDA.includes(mensagem.acao)) return recusa('ação desconhecida');
      // Na vila e na região o grupo vota o destino e vai junto: o voto é do JOGADOR (não de um herói) e leva só o id do lugar.
      // Qualquer jogador pode PEDIR um descanso rápido (uma hora); o grupo vota (a votação é do anfitrião, que roda o jogo).
      if (mensagem.acao === 'descanso') {
        const tipo = mensagem.descanso ?? 'curto';
        if (tipo !== 'curto' && tipo !== 'longo') return recusa('descanso inválido');
        return ok({ igual: true, repassar: { tipo: 'agir', de: eu.pub, acao: 'descanso', descanso: tipo } });
      }
      // O alfinete no mapa (Alt+clique): todos veem onde o jogador aponta. Não é de um herói: é do jogador.
      if (mensagem.acao === 'alfinete') {
        const { x, y } = mensagem;
        if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x > 400 || y > 400) return recusa('casa inexistente');
        return ok({ igual: true, repassar: { tipo: 'agir', de: eu.pub, acao: 'alfinete', x, y } });
      }
      // "Pronto para sair da cena": o jogador marca (ou desmarca) que não tem mais nada a fazer aqui.
      if (mensagem.acao === 'pronto-cena') {
        if (typeof mensagem.valor !== 'boolean') return recusa('valor inválido');
        return ok({ igual: true, repassar: { tipo: 'agir', de: eu.pub, acao: 'pronto-cena', valor: mensagem.valor } });
      }
      // Um botão da tela da vila ou da região (Dormir, Acampar…): o jogador pede, o anfitrião roda.
      if (mensagem.acao === 'vila-acao') {
        const { qual } = mensagem;
        if (typeof qual !== 'string' || !/^(dormir|b\d{1,2})$/.test(qual)) return recusa('ação inválida');
        return ok({ igual: true, repassar: { tipo: 'agir', de: eu.pub, acao: 'vila-acao', qual } });
      }
      if (mensagem.acao === 'lugar') {
        const { lugar } = mensagem;
        if (typeof lugar !== 'string' || !lugar || lugar.length > 40) return recusa('lugar inválido');
        return ok({ igual: true, repassar: { tipo: 'agir', de: eu.pub, acao: 'lugar', lugar } });
      }
      if (!heroiValido(mensagem.heroi) || sala.herois[mensagem.heroi] !== jogadorId) return recusa('esse herói não é seu');
      const base = { tipo: 'agir', de: eu.pub, heroi: mensagem.heroi, acao: mensagem.acao };
      if (mensagem.acao === 'terminar') return ok({ igual: true, repassar: base });
      // Loja e ficha (cada jogador cuida do SEU herói): o servidor confere de quem é o herói e a forma; o anfitrião, o resto.
      // Interagir (botão direito): 'contexto' pede o menu da casa (x, y, como mover) e 'contexto-escolher' escolhe a opção `idx` dele.
      if (mensagem.acao === 'contexto-escolher') {
        const { idx } = mensagem;
        if (!Number.isInteger(idx) || idx < 0 || idx > 60) return recusa('opção inválida');
        return ok({ igual: true, repassar: { ...base, idx } });
      }
      // O descanso curto em curso: gastar um dado (ou rezar uma cura) do SEU herói, e avisar que terminou. O anfitrião confere o resto.
      if (mensagem.acao === 'descanso-dado' || mensagem.acao === 'descanso-magia' || mensagem.acao === 'descanso-pronto') {
        const { id, spellId = null, circulo = null } = mensagem;
        if (!Number.isInteger(id)) return recusa('descanso inválido');
        if (mensagem.acao === 'descanso-magia' && (typeof spellId !== 'string' || !spellId || spellId.length > 40 || !Number.isInteger(circulo) || circulo < 1 || circulo > 9)) return recusa('descanso inválido');
        return ok({ igual: true, repassar: { ...base, id, spellId, circulo } });
      }
      // Preparar magias (pela ficha): a lista que o jogador quer; o anfitrião a confere contra as magias que o herói pode preparar.
      if (mensagem.acao === 'preparar') {
        const { lista } = mensagem;
        if (!Array.isArray(lista) || lista.length > 40 || !lista.every((x) => typeof x === 'string' && x.length <= 40)) return recusa('lista inválida');
        return ok({ igual: true, repassar: { ...base, lista } });
      }
      // Subir de nível: o dono do herói devolve as magias que escolheu (o anfitrião as confere contra as opções).
      if (mensagem.acao === 'nivel') {
        const { id, selecoes } = mensagem;
        if (!Number.isInteger(id) || !selecoes || typeof selecoes !== 'object' || Array.isArray(selecoes)) return recusa('escolhas inválidas');
        const chaves = Object.keys(selecoes);
        if (chaves.length > 8) return recusa('escolhas inválidas');
        for (const k of chaves) {
          const v = selecoes[k];
          if (k.length > 30 || !Array.isArray(v) || v.length > 8 || !v.every((x) => typeof x === 'string' && x.length <= 40)) return recusa('escolhas inválidas');
        }
        return ok({ igual: true, repassar: { ...base, id, selecoes } });
      }
      if (mensagem.acao === 'comprar' || mensagem.acao === 'vender') {
        const { item } = mensagem;
        if (typeof item !== 'string' || !item || item.length > 40) return recusa('item inválido');
        return ok({ igual: true, repassar: { ...base, item } });
      }
      if (mensagem.acao === 'equipar') {
        const { slot, item = null } = mensagem;
        if (!ENCAIXES.includes(slot)) return recusa('encaixe inexistente');
        if (item !== null && (typeof item !== 'string' || !item || item.length > 40)) return recusa('item inválido');
        return ok({ igual: true, repassar: { ...base, slot, item } });
      }
      if (mensagem.acao === 'usar') {
        // F5.2: qualquer ação da barra (magia, item, correr, esquivar…): a forma é conferida aqui, o direito de fazê-la é do motor do anfitrião.
        const { action, circulo, tiles } = mensagem;
        if (!acaoRemotaValida(action)) return recusa('ação inválida');
        if (!tilesValidos(tiles) || !circuloValido(circulo)) return recusa('ação inválida');
        return ok({ igual: true, repassar: { ...base, action, circulo: circulo ?? null, tiles: tiles ?? [] } });
      }
      if (mensagem.acao === 'atacar') {
        // F5: o alvo vai pelo id do combatente, e a arma (opcional) pelo id dela; o anfitrião confere o resto (alcance, ação).
        const { alvo, arma = null } = mensagem;
        if (typeof alvo !== 'string' || !alvo || alvo.length > 40) return recusa('alvo inválido');
        if (arma !== null && (typeof arma !== 'string' || !arma || arma.length > 40)) return recusa('arma inválida');
        return ok({ igual: true, repassar: { ...base, alvo, arma } });
      }
      const { x, y } = mensagem;
      if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x > 400 || y > 400) return recusa('casa inexistente');
      return ok({ igual: true, repassar: { ...base, x, y } });
    }
    case 'resposta': {
      if (sala.fase !== 'iniciada') return recusa('a partida não está em andamento');
      if (jogadorId === sala.anfitriao) return recusa('o anfitrião responde pela própria tela');
      // J-20 (como no Baldur's Gate 3): quem decide é o jogador do personagem que começou a cena, ou todos, em votação. O servidor
      // não sabe qual é o caso (isso é do jogo): confere só a forma e diz de quem veio; o anfitrião aceita ou ignora.
      const { id, indice = null } = mensagem;
      if (!Number.isInteger(id) || id < 1) return recusa('resposta inválida');
      if (indice !== null && (!Number.isInteger(indice) || indice < 0 || indice > 50)) return recusa('resposta inválida');
      return ok({ igual: true, repassar: { tipo: 'resposta', id, indice, continuar: mensagem.continuar === true, de: eu.pub } });
    }
    case 'persona': {
      if (sala.fase !== 'lobby') return recusa('a partida já começou');
      if (!HEROIS_COM_ARTE.includes(mensagem.heroi)) return recusa('esse herói ainda não tem arte para a taverna');
      const av = sala.avatares[jogadorId];
      if (!av) return recusa('você não está na taverna');
      if (av.persona === mensagem.heroi) return ok({ igual: true });
      av.persona = mensagem.heroi;
      return ok();
    }
    case 'pegar': {
      if (sala.fase !== 'lobby') return recusa('a partida já começou');
      if (!heroiValido(mensagem.heroi)) return recusa('herói inexistente');
      if (sala.herois[mensagem.heroi]) return recusa('esse herói já tem dono');
      if (Object.keys(sala.herois).length >= TAMANHO_DO_GRUPO) return recusa('o grupo já tem quatro heróis');
      if (heroisDe(sala, jogadorId).length >= limiteDeHerois(sala, jogadorId)) {
        return recusa(jogadorId === sala.anfitriao ? 'os outros jogadores ficariam sem herói' : 'cada jogador controla um herói: o anfitrião fica com os que sobram');
      }
      sala.herois[mensagem.heroi] = jogadorId;
      desfazerProntos(sala);
      return ok();
    }
    case 'largar': {
      if (sala.fase !== 'lobby') return recusa('a partida já começou');
      if (!heroiValido(mensagem.heroi)) return recusa('herói inexistente');
      const dono = sala.herois[mensagem.heroi];
      if (!dono) return recusa('esse herói não tem dono');
      // P2: ninguém mexe no herói de outro. O anfitrião só solta os do piloto automático.
      if (dono === PILOTO ? jogadorId !== sala.anfitriao : dono !== jogadorId) return recusa('esse herói não é seu');
      delete sala.herois[mensagem.heroi];
      desfazerProntos(sala);
      return ok();
    }
    case 'piloto': {
      const f = soAnfitriao(sala, jogadorId); if (f) return f;
      if (sala.fase !== 'lobby') return recusa('a partida já começou');
      if (!heroiValido(mensagem.heroi)) return recusa('herói inexistente');
      if (sala.herois[mensagem.heroi]) return recusa('esse herói já tem dono');
      if (Object.keys(sala.herois).length >= TAMANHO_DO_GRUPO) return recusa('o grupo já tem quatro heróis');
      sala.herois[mensagem.heroi] = PILOTO;
      desfazerProntos(sala);
      return ok();
    }
    case 'pronto': {
      if (sala.fase !== 'lobby') return recusa('a partida já começou');
      if (typeof mensagem.valor !== 'boolean') return recusa('mensagem inválida');
      if (mensagem.valor && heroisDe(sala, jogadorId).length === 0) return recusa('pegue um herói antes de ficar pronto');
      if (eu.pronto === mensagem.valor) return ok({ igual: true });
      eu.pronto = mensagem.valor;
      return ok();
    }
    case 'corda': {
      const f = soAnfitriao(sala, jogadorId); if (f) return f;
      if (sala.fase !== 'lobby') return recusa('a partida já começou');
      if (!MODOS_DA_CORDA.includes(mensagem.valor)) return recusa('modo de corda inexistente');
      if ((sala.corda ?? PADRAO_DA_CORDA) === mensagem.valor) return ok({ igual: true });
      sala.corda = mensagem.valor;
      return ok();
    }
    // F4.4: o anfitrião diz a UM jogador por que o passo dele foi ignorado ("o grupo se separaria demais").
    case 'aviso': {
      const f = soAnfitriao(sala, jogadorId); if (f) return f;
      if (sala.fase !== 'iniciada') return recusa('a partida não está em andamento');
      const alvo = idPorPub(sala, mensagem.para);
      if (!alvo || alvo === jogadorId) return recusa('jogador inexistente');
      if (typeof mensagem.texto !== 'string' || !mensagem.texto.trim() || mensagem.texto.length > 120) return recusa('aviso inválido');
      return ok({ igual: true, repassarA: { id: alvo, msg: { tipo: 'aviso', texto: mensagem.texto.trim() } } });
    }
    case 'lider': {
      const f = soAnfitriao(sala, jogadorId); if (f) return f;
      const alvo = idPorPub(sala, mensagem.jogador);
      if (!alvo) return recusa('jogador inexistente');
      sala.lider = alvo;
      return ok();
    }
    case 'remover': {
      const f = soAnfitriao(sala, jogadorId); if (f) return f;
      const alvo = idPorPub(sala, mensagem.jogador);
      if (!alvo) return recusa('jogador inexistente');
      if (alvo === sala.anfitriao) return recusa('o anfitrião não se remove: feche a sala');
      saiu(sala, alvo, agora);
      sala.removidos.push(alvo);
      if (sala.removidos.length > MAX_REMOVIDOS) sala.removidos.shift();
      return ok({ removido: alvo });   // o id SECRETO: só o transporte o usa, para derrubar a conexão
    }
    case 'iniciar': {
      const f = soAnfitriao(sala, jogadorId); if (f) return f;
      const aceitarPiloto = mensagem.aceitarPiloto === true;
      const faltas = pendenciasParaIniciar(sala, { aceitarPiloto });
      if (faltas.length) return recusa(faltas[0]);
      // Quem não está aqui entrega os heróis ao piloto automático (L-08), e a partida começa.
      // Os heróis ficam anotados em `cedidos`: se o dono voltar, recupera os seus.
      for (const j of jogadoresPresentes(sala)) {
        if (j.conectado) continue;
        for (const h of heroisDe(sala, j.id)) { sala.herois[h] = PILOTO; sala.cedidos[h] = j.id; }
      }
      sala.fase = 'iniciada';
      sala.iniciadaEm = agora;
      return ok();
    }
    case 'fechar': {
      const f = soAnfitriao(sala, jogadorId); if (f) return f;
      sala.fase = 'fechada';
      return ok();
    }
    default:
      return recusa('mensagem desconhecida');
  }
}

/** Devolve a `jogadorId` os heróis que o piloto segurou por ele. `true` se devolveu algum. */
function devolverHerois(sala, jogadorId) {
  let algum = false;
  for (const [h, dono] of Object.entries(sala.cedidos)) {
    if (dono !== jogadorId) continue;
    if (sala.herois[h] === PILOTO) { sala.herois[h] = jogadorId; algum = true; }
    delete sala.cedidos[h];
  }
  return algum;
}

/**
 * O herói que um jogador que entra com a partida em andamento pode assumir: um que ficou no piloto de propósito (não os cedidos por
 * quem estava ausente) ou, se não há, o último dos que o anfitrião conduz além do primeiro. `null`: só assiste.
 */
export function heroiQueSobra(sala) {
  const ids = Object.keys(sala.herois);
  const noPiloto = ids.find((h) => sala.herois[h] === PILOTO && !(h in sala.cedidos));
  if (noPiloto) return noPiloto;
  const doAnfitriao = ids.filter((h) => sala.herois[h] === sala.anfitriao);
  return doAnfitriao.length > 1 ? doAnfitriao[doAnfitriao.length - 1] : null;
}

/**
 * Tira o jogador (saiu ou foi removido). No lobby ele some e solta os heróis; na
 * partida em curso o grupo precisa continuar de 4, então os heróis vão para o
 * piloto automático e o jogador continua no registro, desconectado.
 */
function saiu(sala, id, agora) {
  if (sala.fase === 'iniciada') {
    for (const h of heroisDe(sala, id)) sala.herois[h] = PILOTO;
    const j = jogadorDe(sala, id);
    if (j) { j.conectado = false; j.pronto = false; }
  } else {
    for (const h of heroisDe(sala, id)) delete sala.herois[h];
    delete sala.jogadores[id];
    delete sala.avatares[id];
    sala.ordem = sala.ordem.filter((x) => x !== id);
    desfazerProntos(sala);
  }
  if (sala.lider === id) sala.lider = sala.anfitriao;
  atualizarVazia(sala, agora);
}

/**
 * O anfitrião está fora há mais que a graça? Então o posto passa ao primeiro jogador CONECTADO, na ordem de entrada (e o
 * líder da narrativa vai junto, se era ele). Devolve `{ ok, novo, antigo }` (ids secretos) ou `{ ok: false }`.
 * Quando é o antigo anfitrião que volta, entra como jogador comum: o posto é de quem o tem.
 */
export function promoverAnfitriao(sala, agora) {
  if (sala.fase !== 'iniciada' || sala.anfitriaoAusenteDesde == null) return { ok: false };
  if (agora - sala.anfitriaoAusenteDesde < GRACA_DO_ANFITRIAO_MS) return { ok: false };
  const novo = jogadoresPresentes(sala).find((j) => j.conectado && j.id !== sala.anfitriao);
  if (!novo) return { ok: false };
  const antigo = sala.anfitriao;
  sala.anfitriao = novo.id;
  if (sala.lider === antigo) sala.lider = novo.id;
  sala.anfitriaoAusenteDesde = null;
  sala.trocasDeAnfitriao = (sala.trocasDeAnfitriao ?? 0) + 1;
  return { ok: true, novo: novo.id, antigo };
}

/** Marca (ou desmarca) o instante em que a sala ficou sem ninguém conectado. */
export function atualizarVazia(sala, agora) {
  if (conectados(sala).length === 0) sala.vaziaDesde ??= agora;
  else sala.vaziaDesde = null;
}

/**
 * O transporte avisa que a conexão de `jogadorId` caiu. No lobby o jogador
 * continua na sala (volta reassumindo o lugar); a aba que recarrega não perde o
 * herói. Funciona mesmo se o id não está mais na sala (quem saiu e fechou a
 * aba): a conta de "sala vazia" é refeita de qualquer jeito.
 */
export function desconectar(sala, jogadorId, agora) {
  const j = jogadorDe(sala, jogadorId);
  if (j) { j.conectado = false; j.pronto = false; }
  if (jogadorId === sala.anfitriao && sala.fase === 'iniciada') sala.anfitriaoAusenteDesde ??= agora;
  atualizarVazia(sala, agora);
}

/** L-12: a sala vazia há `MINUTOS_VAZIA` minutos deve fechar. */
export const deveFechar = (sala, agora) => sala.fase !== 'fechada' && sala.vaziaDesde != null
  && agora - sala.vaziaDesde >= MINUTOS_VAZIA * 60_000;

// ------------------------------------------------------------------- a visão --

/**
 * O que um cliente recebe: a sala inteira (não há segredo no jogo) mais quem
 * ele é. O id do jogador é um SEGREDO (quem o souber assume o lugar dele,
 * L-03), então a visão só traz o rótulo público `pub` ('p1', 'p2'…).
 */
export function visaoDaSala(sala, paraJogador) {
  const pubDe = (id) => (id === PILOTO ? PILOTO : jogadorDe(sala, id)?.pub ?? null);
  return {
    versao: sala.versao,
    codigo: sala.codigo,
    fase: sala.fase,
    origem: sala.origem,
    maxJogadores: sala.maxJogadores,
    anfitriao: pubDe(sala.anfitriao),
    lider: pubDe(sala.lider),
    corda: sala.corda ?? PADRAO_DA_CORDA,
    voce: jogadorDe(sala, paraJogador)?.pub ?? null,
    jogadores: jogadoresPresentes(sala).map((j) => ({
      id: j.pub, nome: j.nome, conectado: j.conectado, pronto: j.pronto, herois: heroisDe(sala, j.id),
    })),
    herois: Object.fromEntries(Object.entries(sala.herois).map(([h, dono]) => [h, pubDe(dono)])),
    limiteDeHerois: limiteDeHerois(sala, paraJogador),
    // Heróis que o piloto automático segura porque o dono estava ausente quando a partida começou (vão de volta ao dono se ele reaparece).
    cedidos: Object.keys(sala.cedidos ?? {}).filter((h) => sala.herois[h] === PILOTO),
    pendencias: sala.fase === 'lobby' ? pendenciasParaIniciar(sala) : [],
    // Quem anda na taverna: o rótulo público, onde está, a figura e o marcador (a cor e a forma).
    avatares: jogadoresPresentes(sala).filter((j) => sala.avatares?.[j.id]).map((j) => {
      const a = sala.avatares[j.id];
      return { id: j.pub, nome: j.nome, x: a.x, y: a.y, figura: figuraDe(sala, j.id), persona: a.persona, marcador: marcadorN(a.marcador), conectado: j.conectado, emote: a.emote?.id ?? null, emoteN: a.emote?.n ?? 0 };
    }),
  };
}
