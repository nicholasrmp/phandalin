// Livro do Jogador não é SRD: a Maldição de Strahd é conteúdo da Wizards. A MOBÍLIA e o TEXTO são nossos — ver NOTICE.md e STRAHD.md.
//
// A MOBÍLIA DA CASA DA MORTE: cada peça é uma anotação `prop` do mapa (`board.varianteDaProp`) sobre uma casa `^` (que bloqueia o passo) ou
// `&` (peça baixa, de passar por cima). Peça de várias casas desenha na casa da FRENTE da pegada e leva `nada` nas outras. O sprite é o do
// atlas `cenario` (as peças da taverna, da aldeia e da mina, que já existem): nada novo foi gerado para isto.
//
//   [variante, x, y, opções]
//     espelhar  a peça de parede do norte, virada para a parede do oeste
//     nada      as outras casas da pegada: só ocupam o chão
//     baixo     peça de passar por cima (tapete, pele): vai sobre `&`
//     piso      o piso que fica por baixo (padrão: o piso que a casa já tinha)

import { D } from './casadamorte-plantas.js';

const PISO_DO_GLIFO = { U: 'assoalho', '*': 'tapete', '-': 'parquet', '+': 'terraSocada' };

/** Põe as peças no terreno e devolve o terreno novo e as anotações de `objetos`. As casas da lista são quadrados do livro (o mapa tem um anel a mais). */
export function mobiliar(terreno, lista, pisoPadrao = 'assoalho') {
  const linhas = terreno.map((l) => [...l]);
  const objetos = [];
  const casa = (x, y, variante, { piso, baixo = false, espelhar = false } = {}) => {
    const antes = linhas[y][x];
    const pisoDe = piso ?? PISO_DO_GLIFO[antes] ?? pisoPadrao;
    linhas[y][x] = baixo ? '&' : '^';
    objetos.push({ tipo: 'prop', x, y, variante, piso: pisoDe, ...(espelhar ? { espelhar: true } : {}) });
  };
  for (const [v, x, y, o = {}] of lista) {
    for (const [nx, ny] of o.nada ?? []) casa(nx + D, ny + D, 'taverna-nada', { piso: o.piso });
    casa(x + D, y + D, v, o);
  }
  return { terreno: linhas.map((l) => l.join('')), objetos };
}

// A MOBÍLIA FEITA PARA A CASA (`objetos-pixellab.py --conjunto casa...`): cada peça tem uma vista por direção, `casa-<peça>:<direção>`, e a
// direção é para onde a peça OLHA nos eixos do mapa: `+y` (sudoeste na tela) é a peça encostada na parede do norte, `+x` (sudeste) a da parede do
// oeste; `-y` e `-x` olham para longe da câmera (só as poltronas, que se viram para a lareira). Peça de parede só vai nas paredes do norte e do
// oeste (as do sul e do leste ficam na frente da câmera e mostrariam as costas). As peças compridas (`mesaJantar`, `cama`, `tina`, `cravo`)
// ficam na direção do eixo em que correm: `+x` corre ao longo de x, `+y` ao longo de y; as casas de trás da pegada levam `nada`.
export const MOBILIA = {
  // ------------------------------------------------------------------------------------------------ 1º andar ---
  casaDaMorte1: [
    // sala de jantar (5): lareira na parede oeste, a mesa comprida e as cadeiras do lado do norte (o do sul fica livre para a passagem)
    ['casa-lareira:+x', 0, 1],
    ['casa-mesaJantar:+x', 2, 1, { nada: [[1, 1]] }],
    ['casa-cadeira:+y', 1, 0], ['casa-cadeira:+y', 2, 0], ['casa-candelabro:+y', 0, 0],
    // cozinha (4A) e despensa (4B): o forno na parede do norte, o aparador (o monta-cargas) e as prateleiras
    ['casa-fogao:+y', 5, 1], ['casa-bau:+y', 5, 3], ['casa-estante:+y', 5, 0],
    // salão principal (2A): a lareira na parede oeste, a escadaria em curva a leste e os candelabros ao pé dela
    ['casa-lareiraB:+x', 0, 5],
    ['casa-candelabro:+y', 3, 6],
    ['casa-escadaria:+x', 5, 6, { nada: [[5, 4], [4, 5], [5, 5], [4, 6]] }],
    // sala de espera (1B)
    ['banco', 0, 8],
    // canil (3): a lareira na parede do norte, flanqueada pelos armários, duas poltronas de frente para ela e os lobos
    ['casa-guardaRoupa:+y', 3, 7], ['casa-lareira:+y', 4, 7], ['casa-guardaRoupa:+y', 5, 7],
    ['casa-cadeira:+y', 3, 8], ['casa-cadeira:+y', 5, 8],
  ],

  // ------------------------------------------------------------------------------------------------ 2º andar ---
  casaDaMorte2: [
    // biblioteca (8): a lareira entre duas estantes na parede oeste, estantes na do norte, a escrivaninha com a cadeira
    ['casa-lareiraB:+x', 0, 1], ['casa-estante:+x', 0, 0], ['casa-estante:+x', 0, 2],
    ['casa-estanteB:+y', 1, 0], ['casa-estante:+y', 2, 0],
    ['casa-escrivaninha:+y', 2, 1], ['casa-cadeira:+x', 1, 1],
    // quartos dos empregados (7A): uma cama de palha ao longo da parede, e um banquinho
    ['casa-camaVelha:+y', 5, 2, { nada: [[5, 1]] }], ['banquinho', 5, 3],
    // salão superior (6): a lareira na parede oeste, a escadaria em curva, as armaduras de pé na parede do norte
    ['casa-lareira:+x', 0, 5],
    ['casa-armadura:+y', 0, 4], ['casa-armadura:+y', 3, 6],
    ['casa-escadaria:+x', 5, 6, { nada: [[5, 4], [4, 5], [5, 5], [4, 6]] }],
    // conservatório (10): a lareira na parede do norte com duas poltronas de frente, o cravo na parede oeste e um candelabro
    ['casa-lareiraB:+y', 4, 7], ['casa-cadeira:+y', 3, 8], ['casa-cadeira:+y', 5, 8], ['casa-candelabro:+y', 5, 7],
    ['casa-cravo:+y', 0, 9, { nada: [[0, 8]] }],
  ],

  // ------------------------------------------------------------------------------------------------ 3º andar ---
  casaDaMorte3: [
    // suíte principal (12): a lareira e o guarda-roupa na parede oeste, a cama de dossel, a penteadeira, a pele de tigre e a mesa do canto
    ['casa-lareiraApagada:+x', 0, 1], ['casa-guardaRoupaB:+x', 0, 0], ['casa-escrivaninha:+x', 0, 2],
    ['camaViuva', 3, 1, { nada: [[3, 0], [4, 0], [4, 1]] }],
    // banheiro (13): a tina ao longo da parede oeste e o fogãozinho
    ['casa-tina:+x', 1, 5, { nada: [[0, 5]] }], ['casa-fogao:+y', 0, 4],
    // berçário (15B)
    ['casa-berco:+y', 0, 7],
    // suíte da babá (15A): a cama ao longo da parede leste e o guarda-roupa ao lado da porta do espelho
    ['casa-camaVelha:+y', 5, 10, { nada: [[5, 9]] }], ['casa-guardaRoupa:+x', 2, 9],
    // varanda (11)
    ['casa-candelabro:+y', 3, 5],
    ['casa-escadaria:+x', 5, 6, { nada: [[5, 4], [4, 5], [5, 5], [4, 6]] }],
  ],

  // ----------------------------------------------------------------------------------------------------- sótão ---
  casaDaMorte4: [
    // quarto de repouso (19, a noroeste)
    ['casa-camaVelha:+y', 1, 1, { nada: [[1, 0]] }], ['casa-fogao:+y', 0, 0], ['casa-guardaRoupa:+x', 0, 1],
    // quarto das crianças (20): as camas pequenas, o baú de brinquedos e a casa de bonecas
    ['casa-camaVelha:+y', 2, 1, { nada: [[2, 0]] }], ['casa-camaVelha:+y', 4, 1, { nada: [[4, 0]] }], ['casa-bau:+y', 4, 2], ['casa-berco:+y', 2, 2],
    // depósito dos móveis cobertos (18): lençóis sobre tudo, o baú dos restos e o fogão
    ['casa-lareiraApagada:+x', 0, 5],
    ['trapos', 0, 6], ['trapos', 2, 5], ['trapos', 0, 7], ['trapos', 2, 7],
    // quarto de repouso (17, a sudeste)
    ['casa-camaVelha:+y', 5, 9, { nada: [[5, 8]] }], ['casa-fogao:+y', 4, 8], ['casa-escrivaninha:+x', 2, 9], ['casa-guardaRoupa:+x', 2, 10], ['casa-cadeira:+y', 3, 10],
  ],
};
