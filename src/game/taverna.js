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
const ALTURA_DO_MURO = 5;

// O chão é de tábuas (`prop`s e piso vêm do atlas, ver `dev/acrescentar-taverna.py`); as paredes são as
// de BORDA do fundo, como nos outros mapas fechados: a do norte e a do oeste, inteiras, e a frente
// aberta para quem olha (a câmera é fixa: "paredes inteiras no fundo, cortadas na frente").
const linhas = Array.from({ length: ALTURA }, () => Array(LARGURA).fill('L'));

/**
 * A MOBÍLIA e os frequentadores: cada um é uma anotação `prop` do mapa (`board.varianteDaProp`), e a
 * casa onde ela está vira um `^` (bloqueia o passo). Peça de várias casas desenha na casa da FRENTE da
 * pegada e leva `nada` nas outras, só para ocupar o chão. `de` e `ate` são o canto de trás e o da
 * frente da pegada (inclusive).
 */
const objetos = [];
function peca(variante, de, ate = de) {
  for (let y = de.y; y <= ate.y; y++) {
    for (let x = de.x; x <= ate.x; x++) {
      linhas[y][x] = '^';
      objetos.push({ tipo: 'prop', x, y, variante: x === ate.x && y === ate.y ? `taverna-${variante}` : 'taverna-nada' });
    }
  }
}

// A parede do FUNDO, a do norte: a estante de garrafas atrás do balcão, a lareira, os barris de cerveja.
peca('prateleira', { x: 2, y: 0 }, { x: 3, y: 0 });
peca('prateleiraB', { x: 4, y: 0 }, { x: 5, y: 0 });
peca('lareira', { x: 8, y: 0 }, { x: 9, y: 0 });
peca('barrilCerveja', { x: 11, y: 0 });
peca('caixote', { x: 11, y: 1 });
// O balcão do bar, de quatro casas, com o Toblen atrás dele.
// Uma peça só de quatro casas, ao longo de +x: a ponta redonda é a do leste.
peca('balcao', { x: 2, y: 2 }, { x: 5, y: 2 });
peca('toblen', { x: 3, y: 1 });
// A parede do OESTE: a escada para o andar de cima, a estante, o lampião.
// A escada: uma casa de largura, colada ao muro do oeste, subindo para o canto do fundo (o andar de cima).
peca('escada', { x: 0, y: 1 }, { x: 0, y: 3 });
peca('prateleiraO', { x: 0, y: 9 }, { x: 0, y: 10 });
peca('lampiao', { x: 1, y: 5 });
peca('lampiao', { x: 10, y: 9 });
// A mesa de grupo (T-07): uma mesa redonda com quatro banquinhos. Clicar nela, ou num banquinho, abre o lobby.
peca('mesaRedonda', { x: 8, y: 6 });
for (const [x, y] of [[7, 6], [9, 6], [8, 5], [8, 7]]) peca('banquinho', { x, y });
// Uma mesa de cartas à esquerda, com o lenhador e a jogadora mascarada; outra à direita, com o corsário e o aventureiro.
peca('mesaCartas', { x: 4, y: 7 });
peca('banquinho', { x: 4, y: 8 });
peca('banquinho', { x: 5, y: 7 });
peca('lenhador', { x: 4, y: 6 });
peca('mascarada', { x: 3, y: 7 });
peca('mesaVela', { x: 10, y: 3 });
peca('corsario', { x: 10, y: 2 });
peca('chapeuRoxo', { x: 9, y: 3 });
// O mago de chapéu vermelho, ao lado da lareira.
peca('magoVermelho', { x: 7, y: 1 });

/** A mesa de grupo: a mesa redonda e os quatro banquinhos em volta. Clicar em qualquer parte abre o lobby do grupo. */
export const MESA_DE_GRUPO = [{ x: 8, y: 6 }, { x: 7, y: 6 }, { x: 9, y: 6 }, { x: 8, y: 5 }, { x: 8, y: 7 }];

export const MAPA_TAVERNA = {
  terreno: linhas.map((l) => l.join('')),
  altura: null,
  objetos,
  // Duas grades de arestas (ver `core/grid.js`): a parede do norte de cada casa da primeira
  // fileira e a do oeste de cada casa da primeira coluna.
  paredes: {
    n: Array.from({ length: ALTURA }, (_, y) => (y === 0 ? '#'.repeat(LARGURA) : '.'.repeat(LARGURA))),
    o: Array.from({ length: ALTURA }, () => `#${'.'.repeat(LARGURA - 1)}`),
    // Muro alto: 5 níveis (110 px) em vez dos 3 de sempre, para a sala ter pé-direito.
    alt: Array.from({ length: ALTURA }, () => String(ALTURA_DO_MURO).repeat(LARGURA)),
  },
  // Onde os grupos aparecem e para onde olham: a entrada, ao sul.
  olhar: { dx: 0, dy: -1 },
};

/** O campo de regras da taverna (o mesmo que o `Board` desenha). */
export function campoDaTaverna() {
  const m = MAPA_TAVERNA;
  const campo = new Battlefield(LARGURA, ALTURA, m.terreno, m.altura, m.objetos, m.paredes);
  // O salão inteiro é UMA sala, com piso de tábuas e parede de tijolo: o tabuleiro pinta o chão de toda
  // casa da sala com o piso dela (por baixo da mobília também) e as paredes com o material dela.
  campo.sala = new Map();
  for (let y = 0; y < ALTURA; y++) for (let x = 0; x < LARGURA; x++) campo.sala.set(`${x},${y}`, 'taverna');
  campo.pisoDeSala = new Map([['taverna', 'tabuasTaverna']]);
  campo.materialDaParede = 'tijolo';
  return campo;
}

/** Casas onde os avatares nascem, da mais perto da porta para fora. */
export const NASCEDOUROS = [
  { x: 5, y: 10 }, { x: 6, y: 10 }, { x: 4, y: 10 }, { x: 7, y: 10 },
  { x: 5, y: 11 }, { x: 6, y: 11 }, { x: 4, y: 11 }, { x: 7, y: 11 },
];

/** O balcão do Toblen (T-09): o taverneiro e as quatro casas do balcão. Clicar nele abre o painel dele, em vez de andar. */
export const BALCAO = [{ x: 3, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 2 }];
export const ehBalcao = (x, y) => BALCAO.some((c) => c.x === x && c.y === y);

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
