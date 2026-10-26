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
//   - o bando que cruza a trilha é o da aventura, sempre; o que muda com o
//     nível do grupo é QUANTOS vieram. A tabela publicada foi escrita para o
//     1º ao 3º nível, e no 5º sete das oito linhas viram passeio, então o
//     bando cresce até deixar de ser fácil para quem está ali (`escalarBando`);
//   - conversar rende XP pelo PERIGO que o bando era: metade quando ele seria
//     uma luta fácil, três quartos quando difícil, tudo quando mortal.
//     Resolver um encontro perigoso sem derramar sangue vale tanto quanto
//     vencê-lo. Passar sem ser visto não rende XP nenhum.

import { XP_POR_NIVEL } from './progressao.js';

export const ENCONTROS = [
  { id: 'stirge', nome: 'stirges', um: 'uma stirge', dia: [1, 2], noite: [1, 3], qtd: [1, 8, 2] },
  { id: 'ghoul', nome: 'carniçais', um: 'um carniçal', dia: null, noite: [4, 4], qtd: [1, 4, 1] },
  { id: 'ogro', nome: 'ogros', um: 'um ogro', dia: [3, 4], noite: null, qtd: [0, 0, 1] },
  { id: 'goblin', nome: 'goblins', um: 'um goblin', dia: [5, 6], noite: [5, 5], qtd: [1, 6, 3] },
  { id: 'hobgoblin', nome: 'hobgoblins', um: 'um hobgoblin', dia: [7, 8], noite: [6, 6], qtd: [1, 4, 2] },
  { id: 'orc', nome: 'orcs', um: 'um orc', dia: [9, 10], noite: [7, 8], qtd: [1, 4, 2] },
  { id: 'lobo', nome: 'lobos', um: 'um lobo', dia: [11, 11], noite: [9, 10], qtd: [1, 4, 2] },
  { id: 'corujaUrso', nome: 'ursos-coruja', um: 'um urso-coruja', dia: [12, 12], noite: [11, 12], qtd: [0, 0, 1] },
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
  return { id: e.id, nome: e.nome, um: e.um ?? e.nome, qtd, periodo };
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

/**
 * Quanto o bando pesa para ESTE grupo, medido no que o jogo já tem: o XP dele,
 * por cabeça, contra o que falta a um herói para subir do nível em que está.
 * A tabela de XP por nível é do SRD; os cortes são nossos.
 *
 * Devolve 'facil', 'dificil' ou 'mortal'.
 *
 * ATÉ ONDE VAI: medido contra o simulador, acerta cerca de três em cada
 * quatro bandos. Erra porque XP não distingue espécie — um lobo e um goblin
 * valem os mesmos 50 XP e não dão a mesma luta. Serve para graduar o XP da
 * conversa e o tamanho do bando, não para prometer dificuldade exata.
 */
export function perigoDoBando(xpDoBando, herois) {
  const vivos = (herois ?? []).filter((c) => !c.dead);
  if (!vivos.length || !xpDoBando) return 'facil';
  const nivel = Math.max(1, Math.round(vivos.reduce((n, c) => n + (c.level ?? 1), 0) / vivos.length));
  const degrau = (XP_POR_NIVEL[nivel + 1] ?? XP_POR_NIVEL[XP_POR_NIVEL.length - 1]) - (XP_POR_NIVEL[nivel] ?? 0);
  if (degrau <= 0) return 'facil';
  const fracao = (xpDoBando / vivos.length) / degrau;
  if (fracao >= 0.17) return 'mortal';
  if (fracao >= 0.065) return 'dificil';
  return 'facil';
}

/** O quanto do XP do bando a conversa rende, por perigo. */
export const XP_POR_PERIGO = { facil: 0.5, dificil: 0.75, mortal: 1 };

/**
 * O XP de resolver o encontro na conversa. Sem o grupo, metade — é o que a
 * camada anterior fazia, e serve de valor de segurança.
 */
export function xpDeConversa(xpDoBando, herois = null) {
  const fatia = herois ? XP_POR_PERIGO[perigoDoBando(xpDoBando, herois)] : 0.5;
  return Math.floor((xpDoBando ?? 0) * fatia);
}

/**
 * Quantos do bando vieram, para este grupo. A tabela da aventura foi escrita
 * para os primeiros níveis: no 5º, quase toda linha dela é passeio. O bando
 * cresce — nunca a espécie, sempre o número — até deixar de ser uma luta
 * fácil, com teto para a cena caber no mapa.
 *
 * O NÚMERO SOZINHO NÃO SALVA TUDO: medido, no 2º nível quase nada cresce (a
 * tabela publicada já serve), no 3º e no 5º o bando sobe até metade a mais do
 * que o dado tirou. As linhas fracas — estirge, goblin, lobo — continuam
 * fáceis no 5º nível mesmo no teto. Para o 5º valer de verdade faltaria
 * criatura mais dura na tabela, e essa é da aventura: não é nossa para mudar.
 *
 * Devolve { qtd, cresceu }.
 */
export function escalarBando(qtd, xpDeUm, herois, { teto = 12 } = {}) {
  // Sem XP não há como medir: o bando fica como a tabela mandou.
  if (!(xpDeUm > 0)) return { qtd, cresceu: 0 };
  // O teto é RELATIVO ao que o dado tirou, além do teto da cena. Sem isso
  // toda rolagem da tabela virava o mesmo número — 4 goblins e 9 goblins
  // acabavam ambos em 11 — e o crescimento passava por cima de bandos que já
  // eram perigosos: onze lobos no 3º nível matavam o grupo em 65% das lutas.
  const limite = Math.min(teto, Math.ceil(qtd * 1.5));
  let n = qtd;
  // Cresce enquanto o bando É fácil E o passo seguinte não vira difícil ou
  // mortal. Olhar só o estado atual fazia um passo pular a faixa inteira: um
  // urso-coruja sozinho (700 de XP) é fácil no 4º nível, e o segundo leva o
  // bando a 2.100 ajustados — mortal, com 61% de vitória de noite e 27% de
  // morte de herói. Um encontro de estrada é imprevisto, não emboscada.
  while (n < limite && perigoDoBando(n * xpDeUm, herois) === 'facil') {
    const depois = perigoDoBando((n + 1) * xpDeUm, herois);
    if (depois === 'dificil' || depois === 'mortal') break;
    n += 1;
  }
  return { qtd: n, cresceu: n - qtd };
}

/**
 * O que o Augúrio responde sobre uma das saídas do encontro: 'bom', 'mau',
 * 'os dois' ou null (nada). Regra da casa, porque o livro deixa a resposta
 * com o mestre: aqui a magia olha o que a escolha renderia de verdade.
 *
 * `chance` é a de a saída dar certo; `perigo` é o do bando.
 */
export function auguriumDaSaida(saida, { chance = 0, perigo = 'facil' } = {}) {
  if (saida === 'luta') {
    if (perigo === 'mortal') return 'mau';
    if (perigo === 'facil') return 'bom';
    return 'os dois';
  }
  // Evitar e conversar: a palavra sai da chance de dar certo, e o risco de
  // falhar pesa mais quando o bando é perigoso.
  if (chance >= 0.75) return perigo === 'mortal' ? 'os dois' : 'bom';
  if (chance <= 0.35) return 'mau';
  // Chance no meio e bando fraco: o livro manda responder NADA quando o que
  // vem não é nem bom nem mau o bastante para ter nome. É este caso.
  if (perigo === 'facil') return null;
  return 'os dois';
}

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
