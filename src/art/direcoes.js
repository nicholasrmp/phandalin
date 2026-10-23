// O EIXO DE DIREÇÕES DA FOLHA DE SPRITES.
//
// Ficava embutido em dois lugares: a lista `DIRECTIONS` no pintor e a regra
// `row = toward >= 0 ? 0 : 2` no tabuleiro. Enquanto a resposta fosse sempre
// três fileiras, isso não incomodava. Deixou de ser: uma folha vinda de fora
// pode trazer oito direções, e aí o número de fileiras é uma propriedade DA
// FOLHA, não uma constante do jogo.
//
// Então a escolha da fileira passa a ser uma função da lista que a folha
// declara. Com a lista de três, ela devolve exatamente o que o tabuleiro já
// fazia — mesmo desenho, mesmo espelho. Com a de oito, devolve o setor certo.
//
// POR QUE O PINTOR FICA EM TRÊS
// `paint` entende `front`, `side` e `back`, e só. Desenhar oito vistas de cada
// um dos seis planos corporais é outro trabalho, grande, e que não se faz por
// antecipação. A arte desenhada em código continua em três; uma folha
// importada pode vir em oito; o tabuleiro atende as duas sem saber qual é.

/** O que o pintor deste projeto sabe desenhar. */
export const DIRECOES_3 = ['front', 'side', 'back'];

/**
 * A bússola de oito pontos, na ordem em que o PixelLab a entrega.
 * `south` é a criatura virada PARA o jogador; `north`, de costas.
 */
export const DIRECOES_8 = [
  'south', 'south-east', 'east', 'north-east',
  'north', 'north-west', 'west', 'south-west',
];

// Setores de 45 graus no espaço da TELA, indexados por
// `Math.round(atan2(sy, sx) / (PI/4))`: 0 é a direita, e cresce no sentido
// horário porque o y da tela cresce para baixo.
const SETOR = [
  'east', 'south-east', 'south', 'south-west',
  'west', 'north-west', 'north', 'north-east',
];

// Quem vira em quem quando a figura é espelhada. Serve para uma folha que
// traga só metade da bússola: o lado que falta sai do lado que existe.
const ESPELHO = {
  east: 'west', west: 'east',
  'south-east': 'south-west', 'south-west': 'south-east',
  'north-east': 'north-west', 'north-west': 'north-east',
  south: 'south', north: 'north',
};

/**
 * Em que fileira da folha está esta criatura virada para cá, e se o desenho
 * precisa ser espelhado.
 *
 * @param {string[]} dirs  as direções que a folha declara, na ordem das fileiras
 * @param {number} sx      componente horizontal da direção, no espaço da tela
 * @param {number} sy      componente vertical; positivo é para o jogador
 * @returns {{row: number, flip: boolean}}
 */
export function linhaDaDirecao(dirs, sx, sy) {
  // LISTA DE TRÊS: a regra antiga, repetida de propósito.
  //
  // Dá para derivar isto do caminho da bússola, mas não se deve: a folha de
  // três não tem leste nem oeste, tem `side`, que é uma vista de perfil usada
  // para os dois lados. Forçá-la no vocabulário da bússola trocaria o
  // comportamento de setenta criaturas por elegância.
  if (dirs.length === 3 && dirs[0] === 'front') {
    return { row: sy >= 0 ? 0 : 2, flip: sx < 0 };
  }

  const i = ((Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) % 8) + 8) % 8;
  const nome = SETOR[i];

  const direto = dirs.indexOf(nome);
  if (direto >= 0) return { row: direto, flip: false };

  const refletido = dirs.indexOf(ESPELHO[nome]);
  if (refletido >= 0) return { row: refletido, flip: true };

  // Folha que não declara nem a direção nem o espelho dela: a primeira
  // fileira é sempre a de frente, e de frente é melhor que nada.
  return { row: 0, flip: false };
}
