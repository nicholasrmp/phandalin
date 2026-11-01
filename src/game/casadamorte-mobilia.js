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

export const MOBILIA = {
  // ------------------------------------------------------------------------------------------------ 1º andar ---
  casaDaMorte1: [
    // sala de jantar (5): lareira na parede oeste, a mesa (glifo) e as cadeiras em volta
    ['taverna-lareira', 0, 1, { espelhar: true }],
    ['cadeira', 1, 0], ['cadeira', 2, 0], ['candelabro', 0, 0],
    // cozinha (4A) e despensa (4B): o forno, o aparador (o monta-cargas) e as prateleiras
    ['fogao', 5, 1], ['prateleira', 5, 3], ['prateleira', 5, 0],
    // salão principal (2A): lareira na parede oeste e candelabros ao pé da escadaria
    ['taverna-lareira', 0, 5, { espelhar: true }],
    ['candelabro', 3, 4], ['candelabro', 3, 6],
    // sala de espera (1B)
    ['banco', 0, 8],
    // canil (3): lareira, poltronas, os lobos empalhados e os dois armários
    ['taverna-lareira', 5, 9],
    ['cadeira', 4, 9], ['cadeira', 4, 10],
    ['peles', 3, 7, { baixo: true }], ['peles', 5, 7, { baixo: true }], ['peles', 5, 8, { baixo: true }],
    ['armario', 4, 7], ['armario', 5, 10],
  ],

  // ------------------------------------------------------------------------------------------------ 2º andar ---
  casaDaMorte2: [
    // biblioteca (8): lareira, escrivaninha e cadeira, estantes junto da parede leste, a poltrona e o canto da escada em espiral
    ['taverna-lareira', 0, 1, { espelhar: true }],
    ['escrivaninha', 2, 1], ['cadeira', 2, 2],
    ['estante', 3, 1], ['estante', 3, 2], ['estante', 0, 2], ['cadeira', 0, 0],
    // sala secreta (9): o baú, em cima do esqueleto (o glifo `)` fica no mapa)
    // quartos dos empregados (7A): duas camas de palha
    ['cama', 5, 1], ['cama', 5, 3],
    // salão superior (6): lareira, armaduras de pé ladeando as portas
    ['taverna-lareira', 0, 5, { espelhar: true }],
    ['estatuaPalien', 0, 4], ['estatuaPalien', 3, 4], ['estatuaPalien', 0, 6], ['estatuaPalien', 3, 6],
    // conservatório (10): lareira, cadeiras ao longo das paredes, o cravo e a harpa
    ['taverna-lareira', 5, 9],
    ['cadeira', 0, 7], ['cadeira', 2, 10], ['cadeira', 3, 10],
    ['escrivaninha', 1, 10], ['candelabro', 4, 8],
  ],

  // ------------------------------------------------------------------------------------------------ 3º andar ---
  casaDaMorte3: [
    // suíte principal (12): lareira, cama de dossel, guarda-roupa, penteadeira, a pele de tigre e as cadeiras da mesa do canto
    ['taverna-lareira', 0, 1, { espelhar: true }],
    ['camaViuva', 3, 1, { nada: [[3, 0], [4, 0], [4, 1]] }],
    ['guardaRoupa', 0, 0], ['escrivaninha', 0, 2],
    ['peles', 1, 1, { baixo: true }], ['cadeira', 4, 3],
    // banheiro (13)
    ['tina', 1, 5], ['fogao', 0, 5],
    // depósito (14): as prateleiras são só parede; a vassoura espera no fundo
    // berçário (15B)
    ['berco', 0, 7],
    // suíte da babá (15A)
    ['camaViuva', 3, 10, { nada: [[4, 10]] }],
    ['guardaRoupa', 4, 8], ['banquinho', 5, 10],
    // varanda (11)
    ['candelabro', 3, 5],
  ],

  // ----------------------------------------------------------------------------------------------------- sótão ---
  casaDaMorte4: [
    // quarto de repouso (19, a noroeste)
    ['cama', 1, 0], ['fogao', 0, 0], ['guardaRoupa', 0, 1],
    // quarto das crianças (20): as camas, o baú de brinquedos e a casa de bonecas
    ['cama', 2, 0], ['cama', 4, 0], ['cofreVazio', 4, 2], ['armario', 2, 2],
    // depósito dos móveis cobertos (18): lençóis sobre tudo, o baú dos restos e o fogão
    ['fogao', 0, 5],
    ['trapos', 0, 6], ['trapos', 2, 5], ['trapos', 0, 7], ['trapos', 2, 7],
    // quarto de repouso (17, a sudeste)
    ['cama', 5, 8], ['fogao', 5, 9], ['escrivaninha', 2, 9], ['guardaRoupa', 4, 10], ['cadeira', 2, 10],
  ],
};
