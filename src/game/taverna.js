// A taverna: o lobby andável (MULTIJOGADOR.md, seção 13, T-01…T-17).
//
// Este arquivo é o MAPA e as contas sobre ele, e é puro: o servidor da sala o usa
// para saber se uma casa existe e se dá para chegar nela, e o navegador o usa
// para desenhar e para animar o caminho. Os dois leem exatamente o mesmo mapa,
// então nunca discordam sobre onde se pode pisar.
//
// É uma cena de exploração, sem combate e sem regra de D&D (T-11). O desenho é o
// do tabuleiro de sempre (`Board`); a mobília são os glifos que o jogo já tem:
// `m` mesa, `e` braseiro, `s` barris e estantes, `K` baú, `u` barris de cerveja.
// A arte NOVA da taverna (balcão, lareira, quadro de avisos, o Toblen) é da T-16 e
// entra pelo pipeline da sessão do Cenário; esta é a taverna com o que existe.

import { Battlefield, key } from '../core/grid.js';

// QUADRADA DE PROPÓSITO. O `Board` dimensiona o canvas pela soma largura + altura e centra o
// mapa como se ele fosse quadrado (`board.js`: `ox`): com a largura DOIS ou mais acima da altura a
// ponta leste do chão sai do canvas e é cortada (e com a altura dois ou mais acima, a oeste). De
// altura-1 a altura+1 cabe inteiro, com folga só no que sobra do PAD; 12 x 12 é o caso sem nenhuma.
export const LARGURA = 12;
export const ALTURA = 12;

// O chão é de laje (a que o jogo tem); as paredes são as de BORDA do fundo, como nos outros
// mapas fechados: a do norte e a do oeste, inteiras, e a frente aberta para quem olha (a
// câmera é fixa: "paredes inteiras no fundo, cortadas na frente").
const linhas = Array.from({ length: ALTURA }, () => Array(LARGURA).fill('L'));
const poe = (x, y, c) => { linhas[y][x] = c; };

// A lareira, no meio da parede do fundo, com os braseiros em fila.
for (const x of [4, 5, 6, 7]) poe(x, 0, 'e');
// O balcão do bar: uma fileira de mesas, com o espaço do Toblen atrás.
for (let x = 2; x <= 6; x++) poe(x, 3, 'm');
// Barris e estantes na quina do bar; os barris de cerveja e o baú da casa no canto oposto.
for (const [x, y] of [[1, 0], [2, 0], [1, 1]]) poe(x, y, 's');
for (const [x, y] of [[10, 0], [11, 0], [11, 1]]) poe(x, y, 'u');
poe(11, 5, 'K');
// Mesas de conversa, soltas pelo salão.
for (const [x, y] of [[2, 6], [2, 7], [4, 8], [5, 8], [9, 2], [9, 3]]) poe(x, y, 'm');

/** A mesa de grupo: 2 x 2 casas, com quatro lugares em volta (T-07). Clicar nela abre o lobby do grupo. */
export const MESA_DE_GRUPO = [{ x: 7, y: 5 }, { x: 8, y: 5 }, { x: 7, y: 6 }, { x: 8, y: 6 }];
for (const { x, y } of MESA_DE_GRUPO) poe(x, y, 'm');

export const MAPA_TAVERNA = {
  terreno: linhas.map((l) => l.join('')),
  altura: null,
  objetos: [],
  // Duas grades de arestas (ver `core/grid.js`): a parede do norte de cada casa da primeira
  // fileira e a do oeste de cada casa da primeira coluna.
  paredes: {
    n: Array.from({ length: ALTURA }, (_, y) => (y === 0 ? '#'.repeat(LARGURA) : '.'.repeat(LARGURA))),
    o: Array.from({ length: ALTURA }, () => `#${'.'.repeat(LARGURA - 1)}`),
  },
  // Onde os grupos aparecem e para onde olham: a entrada, ao sul.
  olhar: { dx: 0, dy: -1 },
};

/** O campo de regras da taverna (o mesmo que o `Board` desenha). */
export function campoDaTaverna() {
  const m = MAPA_TAVERNA;
  return new Battlefield(LARGURA, ALTURA, m.terreno, m.altura, m.objetos, m.paredes);
}

/** Casas onde os avatares nascem, da mais perto da porta para fora. */
export const NASCEDOUROS = [
  { x: 5, y: 10 }, { x: 6, y: 10 }, { x: 4, y: 10 }, { x: 7, y: 10 },
  { x: 5, y: 11 }, { x: 6, y: 11 }, { x: 4, y: 11 }, { x: 7, y: 11 },
];

export const ehMesaDeGrupo = (x, y) => MESA_DE_GRUPO.some((c) => c.x === x && c.y === y);

// ---- andar ---------------------------------------------------------------------

/** Custo de sobra: a taverna cabe em muito menos, e o orçamento só existe porque a busca pede um. */
const ORCAMENTO_EM_PES = 1000;

/**
 * O caminho de `de` até `ate` pelo chão da taverna, ou `[]` se não há. A casa de
 * destino não pode estar ocupada (`ocupadas`: um `Set` de "x,y"); passar por cima
 * de outro avatar pode, como no resto do jogo.
 */
export function caminhoNaTaverna(campo, de, ate, ocupadas = new Set()) {
  if (!campo.inside(ate.x, ate.y) || campo.blocksMove(ate.x, ate.y)) return [];
  if (ocupadas.has(key(ate.x, ate.y)) && !(de.x === ate.x && de.y === ate.y)) return [];
  const alcancadas = campo.reachable({ x: de.x, y: de.y }, ORCAMENTO_EM_PES);
  return Battlefield.pathFrom(alcancadas, ate);
}

/** A casa livre mais perto de `perto` (por onde se anda), para nascer ou reaparecer sem pisar em ninguém. */
export function casaLivre(campo, perto, ocupadas = new Set()) {
  const alcancadas = campo.reachable({ x: perto.x, y: perto.y }, ORCAMENTO_EM_PES);
  let melhor = null;
  for (const n of alcancadas.values()) {
    if (ocupadas.has(key(n.x, n.y)) || campo.blocksMove(n.x, n.y)) continue;
    if (!melhor || n.cost < melhor.cost) melhor = n;
  }
  return melhor ? { x: melhor.x, y: melhor.y } : null;
}

// ---- o marcador de cada jogador (T-05) --------------------------------------------

/** 8 cores × 2 formas = 16, a lotação de uma taverna (T-10). A forma ajuda quem não distingue as cores. */
export const CORES_DO_MARCADOR = ['#e53935', '#1e88e5', '#43a047', '#fdd835', '#8e24aa', '#fb8c00', '#00acc1', '#ec407a'];
export const FORMAS_DO_MARCADOR = ['circulo', 'losango'];
export const TOTAL_DE_MARCADORES = CORES_DO_MARCADOR.length * FORMAS_DO_MARCADOR.length;

/** O número `n` (0 a 15) como `{ cor, forma }`; as 8 primeiras são círculos, as outras losangos. */
export const marcadorN = (n) => ({ cor: n % CORES_DO_MARCADOR.length, forma: Math.floor(n / CORES_DO_MARCADOR.length) % FORMAS_DO_MARCADOR.length });

/** O primeiro marcador que ninguém está usando; `usados` é um `Set` de números. `null` se a taverna lotou. */
export function marcadorLivre(usados) {
  for (let n = 0; n < TOTAL_DE_MARCADORES; n++) if (!usados.has(n)) return n;
  return null;
}
