// O GOBLIN DESENHADO À MÃO, pixel a pixel.
//
// POR QUE ISTO EXISTE
//
// Tudo que foi tentado antes era GERAÇÃO PROCEDURAL: uma função geral que
// produz setenta criaturas, oito direções e treze poses a partir de um
// esqueleto. Deu manequim três vezes. Mas desenhar UM goblin específico é
// outra tarefa — muito mais fácil, e nunca testada.
//
// Este arquivo é esse teste. Se a figura aqui prestar, vale comprar o Aseprite
// e trabalhar no meio de verdade. Se não prestar, o problema nunca foi a
// ferramenta e nós economizamos o dinheiro e a tarde.
//
// O FORMATO é o mesmo de `icones-itens.js`: uma linha de texto por fileira de
// pixels, um caractere por pixel. Dá para ler e corrigir sem abrir editor.
//
// PALETA — dezesseis cores, que é o teto que a skill `pixel-art` estabelece.
// As rampas deslocam o matiz: sombra puxa para o vermelho, luz para o
// amarelo, e cada degrau tem 20% de diferença de luminosidade.

export const PALETA = {
  '#': '#12101a',   // contorno
  '1': '#5a3416',   // pele, sombra
  '2': '#b07d27',   // pele, corpo
  '3': '#d6c066',   // pele, luz
  '4': '#e3e1bf',   // pele, realce
  '5': '#1a1a23',   // cabelo
  '6': '#4f4c61',   // cabelo, luz
  '7': '#42261a',   // couro, sombra
  '8': '#936639',   // couro, corpo
  '9': '#bfa97d',   // couro, luz
  'A': '#393f4c',   // metal, sombra
  'B': '#717f8e',   // metal, corpo
  'C': '#bcc3c7',   // metal, luz
  'D': '#b5ab87',   // osso e dente
  'E': '#ff8c14',   // o olho — o único acento
  'F': '#8a4a12',   // contorno do lado da luz (selout)
};

/**
 * 40 colunas por 52 fileiras.
 *
 * A POSE É DE GUARDA, não de sentido. A silhueta de alguém parado com os
 * braços caídos é um retângulo, e retângulo não lê como criatura — foi o
 * defeito que o teste da silhueta acusou nas três tentativas anteriores.
 * Aqui a cimitarra sobe à esquerda, o escudo avança à direita e as pernas
 * abrem: três coisas que quebram o contorno antes de qualquer pintura.
 */
export const GOBLIN = [
  '........................................',
  '...........#CC#.........................',
  '..........#CBBC#........................',
  '..........#CBBBC#.......................',
  '.........#CBBBBC#.......................',
  '.........#CBBBBBC#......................',
  '.........#CBBBBBBC#.....................',
  '.........#CBBBBBBC#.....5555............',
  '..........#CBBBBBC#....5#55#5...........',
  '..........#CBBBBC#....5#5555#5..........',
  '...........#CBBC#....5#555555#5.........',
  '............#CC#....5#5566655#55........',
  '.............##....5#55666655#555.......',
  '............#88#..5#556666655#5555......',
  '...........#8998#.#5566666655#55555.....',
  '..........#89988#.#55666666#..#5555#....',
  '.........#8998#...#5#######....#555#....',
  '.......###88#....##2222222##....###.....',
  '....###33###....#2333333332#............',
  '..###3332#.....#233##222##32#...........',
  '.##33322#.....#23#E#232#E#32#...........',
  '.#2332##......#23#EE#2#EE#32#...........',
  '.#3321#.......#2332#222#2332#...........',
  '.##11#........#23332#2#23332#...........',
  '..####.........#2333#2#2333#............',
  '................#2#DDDDD#2#.............',
  '.......#888#.....#DD#D#DD#..............',
  '......#89998#.....#DDDDD#...............',
  '.....#8999998#.....##2##................',
  '.....#899AA998#...##333##...............',
  '......#8AAAA8#...#2333332#..............',
  '.......#AAAA#...#23333332#..............',
  '........####...#2233333322#.....##CC##..',
  '..............#122333333221#..##C9999C#.',
  '..............#122333333221#.#C999999C#.',
  '..............#1223333332 1#.#99988999#.',
  '..............#12233333221#.#C99888999C#',
  '...............#7777777777#.#C99888999C#',
  '...............#7988888897#.#C999999999#',
  '...............#79###8###97#.#C9999999C#',
  '...............#7#A#A#A#A#7#..#C99999C#.',
  '...............#7#A#A#A#A#7#...##CCCC##.',
  '...............##A#A#A#A##......######..',
  '................#A#.#.#A#...............',
  '...............#223#.#322#..............',
  '..............#12233#33221#.............',
  '..............#12233#33221#.............',
  '..............#12233#33221#.............',
  '.............#7888887#788887#...........',
  '.............#7999987#789997#...........',
  '............#DD###DD#.#DD###DD#.........',
  '............##########..##########......',
];
