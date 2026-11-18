// PERGUNTAR QUALQUER COISA A UM NPC, sem modelo de linguagem nenhum.
//
// A conversa deste jogo é árvore de nós (`game/dialogo.js`): o jogador escolhe falas escritas. Isto aqui é a
// outra metade — o jogador DIGITA a pergunta, e o NPC responde o que sabe, ou diz que não sabe.
//
// COMO FUNCIONA, E POR QUE ASSIM. Não há modelo por trás: há um CATÁLOGO DE ASSUNTOS, que é o mundo da
// aventura, e uma tabela de quem sabe o quê. A pergunta digitada é reduzida a letras sem acento e comparada
// com as chaves de cada assunto; ganha o assunto com mais peso, e o peso de uma chave é o tamanho dela — assim
// "aranha negra" vence "aranha", e quem pergunta pelo drow não cai na resposta sobre bicho de teia.
//
// A consequência é a que se quer: **o NPC só diz o que escrevemos**. Ele nunca inventa um fato, nunca
// contradiz o livro e nunca sabe o que não deveria — e, quando a pergunta cai fora do que ele conhece, a
// resposta honesta ("isso eu não sei") é parte do personagem e não uma falha do sistema. O Droop não sabe o
// caminho do Castelo; essa ignorância é do livro e aqui ela tem voz.
//
// QUEM NÃO SABE É DIFERENTE DE QUEM NÃO CONTA. `sabe` devolve a fala; `null` é não saber; e um assunto pode
// trazer `requer`, para o que ele só conta sob pressão (a Intimidação já feita, a Zona da Verdade de pé).
//
// Puro: roda em Node, sem tabuleiro e sem interface. `src/dev/testes-perguntas.mjs` prova a classificação.

import { ASSUNTOS_NOVOS as ASSUNTOS_DA_VILA_DO_OBELISCO } from './npc-saber-obelisco-vila.js';
import { ASSUNTOS_NOVOS as ASSUNTOS_DO_REINO } from './npc-saber-obelisco-reino.js';

/** Sem acento, sem pontuação, em minúsculas e com um espaço entre palavras. */
export function normal(t) {
  return String(t ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------------------------------------------------------------- o mundo ----
/**
 * OS ASSUNTOS DA AVENTURA. Um por coisa sobre a qual faz sentido perguntar, com as palavras que o jogador
 * provavelmente vai usar — inclusive as erradas de propósito ("teia", "aranha") e as do livro em inglês, que
 * quem leu a aventura digita sem pensar.
 */
export const ASSUNTOS = {
  aranhaNegra: {
    nome: 'o Aranha Negra',
    chaves: ['aranha negra', 'black spider', 'nezznar', 'quem manda em voce', 'quem manda em voces',
      'quem paga', 'seu chefe', 'patrao', 'quem mandou'],
  },
  gundren: {
    nome: 'Gundren Buscapedra',
    chaves: ['gundren', 'buscapedra', 'rockseeker', 'o anao', 'anao preso', 'anao barba ruiva'],
  },
  irmaos: { nome: 'os irmãos Buscapedra', chaves: ['nundro', 'tharden', 'irmaos do gundren', 'os irmaos', 'seus irmaos', 'teus irmaos'] },
  castelo: {
    nome: 'o Castelo Dentefino',
    chaves: ['castelo dentefino', 'cragmaw castle', 'castelo', 'fortaleza', 'dentefino', 'cragmaw', 'rei grol', 'grol'],
  },
  ondaEco: {
    nome: 'a Caverna Onda Eco',
    chaves: ['onda eco', 'wave echo', 'mina perdida', 'caverna onda', 'a mina', 'forja das magias',
      'forja', 'spellforge'],
  },
  mapa: { nome: 'o mapa do Gundren', chaves: ['mapa', 'pergaminho do anao', 'o tubo'] },
  cajavidro: {
    nome: 'o Cajavidro',
    chaves: ['cajavidro', 'glasstaff', 'iarno', 'albrek', 'o mago', 'mago do cajado', 'cajado de vidro'],
  },
  marcarrubra: {
    nome: 'os Marcarrubra',
    chaves: ['marcarrubra', 'redbrand', 'manto vermelho', 'mantos vermelhos', 'capa vermelha', 'capas vermelhas', 'os bandidos', 'a gangue'],
  },
  sildar: { nome: 'Sildar Hallwinter', chaves: ['sildar', 'hallwinter', 'humano preso', 'homem preso', 'cabelo cinza'] },
  klarg: { nome: 'Klarg', chaves: ['klarg', 'o bugbear', 'bugbears', 'tapa olho', 'o chefe daqui', 'o peludo grande'] },
  dendrar: { nome: 'a família Dendrar', chaves: ['dendrar', 'mirna', 'nars', 'nilsa', 'marceneiro', 'viuva', 'os presos', 'as jaulas', 'o entalhador'] },
  secretas: { nome: 'as passagens secretas', chaves: ['porta secreta', 'portas secretas', 'passagem secreta', 'passagens', 'segredo da parede'] },
  senha: { nome: 'a senha dos esqueletos', chaves: ['senha', 'palavra', 'esqueletos', 'ossos', 'cripta'] },
  vigia: { nome: 'o vigia de um olho só', chaves: ['nothic', 'vigia', 'um olho', 'olho so', 'bicho da fenda', 'a fenda'] },
  tesouro: { nome: 'o tesouro', chaves: ['tesouro', 'ouro', 'dinheiro', 'moeda', 'onde guardam', 'o bau', 'bau', 'de valor'] },
  saida: { nome: 'a saída', chaves: ['saida', 'como sair', 'outra saida', 'por onde se sai'] },
  quemEVoce: { nome: 'quem ele é', chaves: ['quem e voce', 'seu nome', 'como se chama', 'quem es tu'] },
  agatha: { nome: 'a banshee Agatha', chaves: ['agatha', 'banshee', 'a elfa morta', 'conyberry'] },
  phandalin: { nome: 'Phandalin', chaves: ['phandalin', 'a vila', 'o povoado'] },
  estalagem: { nome: 'a estalagem e a taverna', chaves: ['estalagem', 'stonehill', 'quarto', 'dormir', 'cerveja', 'comida', 'gigante adormecido', 'taverna'] },
  armazem: { nome: 'o armazém', chaves: ['armazem', 'barthen', 'provisoes', 'mercadoria', 'corda', 'lanterna'] },
  linene: { nome: 'a Escudo Leão', chaves: ['escudo leao', 'linene', 'armadura', 'comprar armas', 'caravana'] },
  halia: { nome: 'Halia Thornton', chaves: ['halia', 'thornton', 'cambio de minerio', 'cambio', 'zhentarim'] },
  garaele: { nome: 'Irmã Garaele', chaves: ['garaele', 'a elfa do santuario', 'irma'] },
  santuario: { nome: 'o santuário de Tymora', chaves: ['santuario', 'tymora', 'deusa'] },
  daran: { nome: 'Daran Edermath', chaves: ['daran', 'edermath', 'pomar', 'manopla'] },
  carp: { nome: 'o menino Carp', chaves: ['carp', 'o menino', 'seu filho', 'buraco no mato', 'passagem no mato'] },
  reidoth: { nome: 'Reidoth', chaves: ['reidoth', 'druida', 'velha de peles', 'velho de peles'] },
  dragao: { nome: 'o dragão da torre', chaves: ['dragao', 'venomfang', 'a torre de arvore trovao'] },
  arvoreTrovao: { nome: 'Árvore Trovão', chaves: ['arvore trovao', 'thundertree', 'a ruina', 'as ruinas'] },
  kost: { nome: 'Hamun Kost', chaves: ['kost', 'hamun', 'necromante', 'poco da coruja', 'mago vermelho', 'quem e voce mago'] },
  trabalho: { nome: 'trabalho e recompensa', chaves: ['trabalho', 'recompensa', 'servico', 'missao', 'quanto paga', 'precisa de ajuda', 'favor'] },
  orcs: { nome: 'os orcs do Cume da Wyvern', chaves: ['orcs', 'orc', 'cume da wyvern', 'wyvern', 'brughor'] },
};

// OS ASSUNTOS DO OBELISCO (capítulos 5 a 8), das fichas de `npc-saber-obelisco-*.js`. O que os dois arquivos têm em comum (o
// obelisco, os fragmentos, a Gwyn...) vira um assunto só, com as chaves dos dois.
// Uma chave vale num assunto só (senão é empate para sempre): a que outro assunto já tem fica com quem chegou antes, e os da Mina
// Perdida chegam primeiro ("o que é aquele bicho de um olho só" continua sendo o olho da fenda, e não os nothics do Obelisco).
const chaveUsada = new Set(Object.values(ASSUNTOS).flatMap((a) => a.chaves.map(normal)));
for (const novos of [ASSUNTOS_DA_VILA_DO_OBELISCO, ASSUNTOS_DO_REINO]) {
  for (const [id, a] of Object.entries(novos)) {
    const livres = [...new Map(a.chaves.map((c) => [normal(c), c])).values()].filter((c) => !chaveUsada.has(normal(c)));
    for (const c of livres) chaveUsada.add(normal(c));
    if (ASSUNTOS[id]) ASSUNTOS[id] = { ...ASSUNTOS[id], chaves: [...ASSUNTOS[id].chaves, ...livres] };
    else ASSUNTOS[id] = { nome: a.nome, chaves: livres };
  }
}

// ---------------------------------------------------------------- achar ----
const LIMITE = 3;        // menos que isto é ruído: "o", "e", "de" não escolhem assunto nenhum

/**
 * O assunto da pergunta, ou `null`. Devolve também a pontuação e o segundo colocado, para quem quiser
 * desempatar na interface ("você quer dizer o castelo, ou o rei?").
 */
export function assuntoDe(pergunta, { entre = null } = {}) {
  const t = ` ${normal(pergunta)} `;
  if (!t.trim()) return null;
  const alvos = entre ?? Object.keys(ASSUNTOS);
  const notas = [];
  for (const id of alvos) {
    const a = ASSUNTOS[id];
    if (!a) continue;
    let nota = 0;
    let achada = null;
    for (const chave of a.chaves) {
      const c = normal(chave);
      if (!c) continue;
      // a chave inteira, cercada de espaço: "mina" não casa dentro de "caminhada". Pedaço de palavra só vale se a chave for
      // longa, ou se ela abrir uma palavra ("mapas" acha "mapa"): a curta no meio de outra ("ilha" em "trilha", em "milhas")
      // trazia assunto que ninguém perguntou
      const peso = t.includes(` ${c} `) || (t.includes(` ${c}`) && t.endsWith(`${c} `)) ? c.length + 2
        : t.includes(` ${c}`) || (c.length > 5 && t.includes(c)) ? c.length : 0;
      if (peso > nota) { nota = peso; achada = c; }
    }
    if (nota >= LIMITE) notas.push({ id, nota, nome: a.nome, chave: achada });
  }
  if (!notas.length) return null;
  notas.sort((x, y) => y.nota - x.nota);
  return { ...notas[0], segundo: notas[1] ?? null, empate: Boolean(notas[1] && notas[1].nota === notas[0].nota) };
}

// ---------------------------------------------------------- continuação ----
const REFERE = /\b(ele|ela|eles|elas|dele|dela|deles|delas|nele|nela|neles|nelas|isso|disso|nisso|esse|essa|esses|essas|aquele|aquela|aquilo|la)\b/;
const SOLTA = /^(e|mas|entao|onde|quando|como|por que|porque|pq|quem|quantos|quantas|qual|o que|conta mais|fala mais|mais)\b/;
const FALA_DO_NPC_OU_DAQUI = /\b(voce|voces|tu|seu|sua|teu|tua|aqui|daqui)\b/;
const MAX_COM_ASSUNTO = 200;

/**
 * A MEMÓRIA DA CONVERSA, sem histórico nem modelo: guarda de que assunto se falava e completa a pergunta que depende dele, então "e onde
 * ele mora?" depois de "quem é Klarg?" vira "sobre klarg: e onde ele mora?". Continua sendo uma pergunta independente, e por isso a
 * fala segue reaproveitável pelo banco e responde igual sem API. O nome posto é o que o próprio jogador escreveu, então a trava de
 * nomes (`conferir`) não ganha nada que ele já não tivesse dito. Pergunta sobre o próprio NPC não fica como assunto: "ele" não seria ele.
 */
export function continuarAssunto(pergunta, memoria) {
  const texto = String(pergunta ?? '').trim();
  const proprio = assuntoDe(texto);
  if (proprio) {
    memoria.chave = proprio.id === 'quemEVoce' ? null : proprio.chave;
    return texto;
  }
  if (!memoria.chave) return texto;
  const t = normal(texto);
  if (FALA_DO_NPC_OU_DAQUI.test(t)) return texto;
  const curta = t.split(' ').length <= 3 && SOLTA.test(t);
  if (!curta && !REFERE.test(t)) return texto;
  const completa = `sobre ${memoria.chave}: ${texto}`;
  return completa.length <= MAX_COM_ASSUNTO ? completa : texto;
}

// ---------------------------------------------------------------- saber ----
/**
 * O que ESTE npc responde sobre este assunto. `saber` é a tabela dele: assunto → fala, ou função que recebe o
 * contexto da conversa. Ausente ou `null` quer dizer que ele não sabe, e aí quem responde é a voz de não
 * saber dele (`naoSei`), que também é escrita — "Droop não sabe!" não é a mesma coisa que "Não sei do que
 * fala", e a diferença é o personagem.
 */
export function responder(saber, assunto, ctx = {}) {
  if (!assunto) return { tipo: 'naoEntendi', texto: saber?.naoEntendi ?? null };
  const r = saber?.sabe?.[assunto.id];
  if (r == null) return { tipo: 'naoSabe', assunto, texto: saber?.naoSei ?? null };
  const motivo = saber?.requer?.[assunto.id]?.(ctx);
  if (motivo) return { tipo: 'naoConta', assunto, motivo, texto: saber?.naoConto ?? null };
  return { tipo: 'sabe', assunto, texto: typeof r === 'function' ? r(ctx) : r };
}

/** Os assuntos que este NPC sabe, para a interface sugerir ("ele pode falar de…"). */
export const assuntosDe = (saber) => Object.keys(saber?.sabe ?? {}).filter((id) => ASSUNTOS[id]);
