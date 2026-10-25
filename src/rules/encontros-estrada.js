// A tabela de encontros da Trilha Triboar, o teste que a dispara e o que
// acontece ANTES das armas saírem: a que distância um vê o outro, com que cara
// eles chegam, e se dá para passar sem luta.
//
// Mora aqui, e não em `game/regiao.js`, porque é regra: o mapa da região
// importa a pintura dele, e um arquivo de imagem impede que os testes carreguem
// o módulo em Node.
//
// A TABELA: um teste por período (dia e noite). d20; 17 a 20 é encontro, e um
// d12 na tabela diz o quê. `qtd` é a rolagem do número de criaturas, como
// [dados, faces, bônus]. `dia`/`noite` são as faixas do d12 em cada período
// (null quer dizer que aquele bando não aparece naquele período).
//
// O QUE É NOSSO, e está dito na tela do encontro:
//   - a distância em que os dois lados se veem (2d6 × 3 m no aberto, metade no
//     mato fechado) e a reação de quem chega (2d6, do hostil ao indiferente)
//     vêm da tradição dos manuais de mestre, não do Livro do Jogador;
//   - quem não quer conversa não conversa: bicho, morto-vivo e ogro chegam
//     hostis e pronto. Não é falta de língua — o ogro fala Comum e Gigante, e
//     o carniçal fala Comum —, é que nenhum deles tem o que ganhar em parar;
//   - evitar o encontro é um teste de grupo de Furtividade contra a atenção
//     deles; falhando, o grupo é notado fora de posição e rola a iniciativa
//     com desvantagem. Surpresa não há: o grupo VIU o bando;
//   - conversar rende metade do XP do bando: resolver o encontro vale, mas
//     menos que encarar. Passar sem ser visto não rende XP nenhum.

export const ENCONTROS = [
  { id: 'stirge', nome: 'stirges', dia: [1, 2], noite: [1, 3], qtd: [1, 8, 2] },
  { id: 'ghoul', nome: 'carniçais', dia: null, noite: [4, 4], qtd: [1, 4, 1] },
  { id: 'ogro', nome: 'um ogro', dia: [3, 4], noite: null, qtd: [0, 0, 1] },
  { id: 'goblin', nome: 'goblins', dia: [5, 6], noite: [5, 5], qtd: [1, 6, 3] },
  { id: 'hobgoblin', nome: 'hobgoblins', dia: [7, 8], noite: [6, 6], qtd: [1, 4, 2] },
  { id: 'orc', nome: 'orcs', dia: [9, 10], noite: [7, 8], qtd: [1, 4, 2] },
  { id: 'lobo', nome: 'lobos', dia: [11, 11], noite: [9, 10], qtd: [1, 4, 2] },
  { id: 'corujaUrso', nome: 'um urso-coruja', dia: [12, 12], noite: [11, 12], qtd: [0, 0, 1] },
];

/** A barra do d20: de 17 para cima é encontro. */
export const BARRA_DE_ENCONTRO = 17;

const rolar = (rng, faces) => 1 + Math.floor(rng() * faces);

/**
 * O encontro do período, ou null. `rng()` devolve [0, 1).
 *
 * `ajuste` é o que o acampamento esconde (ou entrega): ele sobe ou desce a
 * barra do d20. Acampamento bem escondido sobe; fogueira acesa desce
 * (`rules/acampamento.js`).
 */
export function sortearEncontro(rng, periodo, { ajuste = 0 } = {}) {
  // A barra para em 20: nem o acampamento mais escondido fica imune. Um
  // natural 20 sempre acha alguém — 5% de chance, que é o piso da noite.
  const barra = Math.max(2, Math.min(20, BARRA_DE_ENCONTRO + ajuste));
  if (rolar(rng, 20) < barra) return null;
  const d = rolar(rng, 12);
  const e = ENCONTROS.find((x) => x[periodo] && d >= x[periodo][0] && d <= x[periodo][1]);
  if (!e) return null;
  const [n, f, b] = e.qtd;
  let qtd = b;
  for (let i = 0; i < n; i++) qtd += rolar(rng, f);
  return { id: e.id, nome: e.nome, qtd, periodo };
}


// ------------------------------------------------- antes das armas saírem ----

/** Quem conversa: tem o que ganhar em não brigar hoje. */
export const NEGOCIAVEIS = new Set(['goblin', 'hobgoblin', 'orc']);

/**
 * A que distância os dois lados se veem, em pés. No aberto, 2d6 × 3 m; no mato
 * fechado, metade disso. A distância pesa em sair da trilha
 * (`vantagemDeDistancia`).
 */
export function distanciaInicial(rng, terreno = 'comum') {
  const d6 = () => 1 + Math.floor(rng() * 6);
  const base = (d6() + d6()) * 10;
  return terreno === 'farto' ? Math.round(base / 2 / 5) * 5 : base;
}

/**
 * Com que cara eles chegam: 2d6.
 *   2-5   hostil, vêm para cima
 *   6-8   desconfiado, mas ouve
 *   9-12  indiferente, não quer briga
 * Quem não fala chega sempre hostil.
 */
export const REACOES = {
  // Hostil não tem CD: o livro não dá teste para convencer quem já vem
  // atacando, e a tela não oferece conversa com eles.
  hostil: { id: 'hostil', nome: 'Hostis', cd: null, texto: 'Vêm para cima assim que veem o grupo.' },
  desconfiado: { id: 'desconfiado', nome: 'Desconfiados', cd: 15, texto: 'Param, armas na mão, mas ninguém avançou ainda.' },
  indiferente: { id: 'indiferente', nome: 'Indiferentes', cd: 10, texto: 'Estavam indo para outro lugar e não parecem com pressa de brigar.' },
};

export function reacaoDe(rng, encontroId) {
  if (!NEGOCIAVEIS.has(encontroId)) return REACOES.hostil;
  const d6 = () => 1 + Math.floor(rng() * 6);
  const t = d6() + d6();
  if (t <= 5) return REACOES.hostil;
  if (t <= 8) return REACOES.desconfiado;
  return REACOES.indiferente;
}

/** Metade do XP do bando: resolver sem luta vale, mas menos que encarar. */
export const xpDeConversa = (xpDoBando) => Math.floor((xpDoBando ?? 0) / 2);

/** Há conversa quando o bando negocia e não chegou decidido a brigar. */
export function podeConversar(encontroId, reacao) {
  const id = reacao?.id ?? reacao;
  return NEGOCIAVEIS.has(encontroId) && id !== 'hostil';
}

/**
 * O que ajuda e o que atrapalha quem tenta sumir da trilha, em
 * { vantagem, desvantagem } para o teste de grupo de Furtividade.
 *
 * Regra da casa: longe dá tempo (90 pés ou mais), em cima não dá (30 ou
 * menos). E o MATO FECHADO esconde: nele há onde se meter, e por isso vale
 * vantagem mesmo com o bando perto — sem isso o terreno farto saía pior que o
 * descampado, porque ele encurta a distância do encontro.
 */
export function vantagemDeDistancia(distanciaFt, terreno = 'comum') {
  const mato = terreno === 'farto';
  if (mato) return { vantagem: distanciaFt > 20, desvantagem: distanciaFt <= 20 };
  return { vantagem: distanciaFt >= 90, desvantagem: distanciaFt <= 30 };
}

/**
 * A atenção do bando contra quem tenta sumir: a melhor Percepção passiva dele,
 * mais 1 a cada três criaturas além da primeira. Regra da casa: um bando de
 * nove tem mais olhos do que um de um, e o livro não dá número para isso.
 */
export function atencaoDoBando(passivas) {
  if (!passivas.length) return 0;
  return Math.max(...passivas) + Math.floor((passivas.length - 1) / 3);
}
