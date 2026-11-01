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

const PISO_DO_GLIFO = { U: 'assoalho', '*': 'tapete', '-': 'parquet', '+': 'terraSocada' };

/** Põe as peças no terreno e devolve o terreno novo e as anotações de `objetos`. */
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
    for (const [nx, ny] of o.nada ?? []) casa(nx, ny, 'taverna-nada', { piso: o.piso });
    casa(x, y, v, o);
  }
  return { terreno: linhas.map((l) => l.join('')), objetos };
}

export const MOBILIA = {
  // ------------------------------------------------------------------------------------------------ 1º andar ---
  casaDaMorte1: [
    // sala de jantar (5): lareira na parede oeste e oito cadeiras em volta da mesa
    ['taverna-lareira', 1, 3, { espelhar: true }],
    ...[3, 4, 5, 6].flatMap((x) => [['cadeira', x, 2], ['cadeira', x, 5]]),
    ['candelabro', 7, 1], ['candelabro', 1, 7],
    // cozinha (4A) e despensa (4B)
    ['fogao', 10, 4], ['prateleira', 12, 5],
    ['prateleira', 10, 1], ['prateleira', 11, 1], ['prateleira', 12, 1],
    // vestiário (2B)
    ['guardaRoupa', 5, 8],
    // salão principal (2A): lareira, duas poltronas e candelabros
    ['taverna-lareira', 1, 12, { espelhar: true }],
    ['cadeira', 3, 11], ['cadeira', 3, 13],
    ['candelabro', 4, 10], ['candelabro', 7, 10], ['candelabro', 4, 14], ['candelabro', 7, 14],
    // sala de espera (1)
    ['banco', 2, 22], ['candelabro', 4, 16],
    // canil (3): lareira, poltronas, os lobos empalhados e os dois armários
    ['taverna-lareira', 12, 19],
    ['cadeira', 9, 19], ['cadeira', 9, 20],
    ['peles', 7, 17, { baixo: true }], ['peles', 12, 17, { baixo: true }], ['peles', 8, 21, { baixo: true }],
    ['armario', 12, 21], ['armario', 12, 16],
  ],

  // ------------------------------------------------------------------------------------------------ 2º andar ---
  casaDaMorte2: [
    // biblioteca (8): lareira, escrivaninha e cadeira, estantes do chão ao teto na parede sul, duas poltronas
    ['taverna-lareira', 1, 3, { espelhar: true }],
    ['escrivaninha', 3, 2], ['cadeira', 3, 3],
    ['estante', 1, 5], ['estante', 2, 5], ['estante', 3, 5], ['estante', 4, 5], ['estante', 5, 5],
    ['cadeira', 8, 1], ['cadeira', 1, 1], ['estante', 8, 4],
    // sala secreta (9)
    ['estante', 6, 6], ['estante', 6, 7], ['estante', 8, 6],
    // quartos dos empregados (7A, 7B)
    ['cama', 10, 5], ['cama', 12, 5], ['banquinho', 11, 6],
    ['prateleira', 10, 1], ['prateleira', 11, 1], ['prateleira', 12, 1],
    // salão superior (6): lareira, armaduras de pé ladeando as portas, candelabros
    ['taverna-lareira', 1, 11, { espelhar: true }],
    ['estatuaPalien', 3, 9], ['estatuaPalien', 5, 9], ['estatuaPalien', 3, 14], ['estatuaPalien', 6, 14],
    ['candelabro', 8, 9], ['candelabro', 8, 14],
    // conservatório (10): lareira, cadeiras ao longo das paredes e o cravo
    ['taverna-lareira', 12, 19],
    ['cadeira', 3, 16], ['cadeira', 5, 16], ['cadeira', 10, 16], ['cadeira', 3, 22], ['cadeira', 6, 22], ['cadeira', 9, 22],
    ['escrivaninha', 1, 17],
  ],

  // ------------------------------------------------------------------------------------------------ 3º andar ---
  casaDaMorte3: [
    // suíte principal (12): lareira, cama de dossel, guarda-roupas, penteadeira, a pele de tigre, poltrona e a mesa do canto
    ['taverna-lareira', 1, 1, { espelhar: true }],
    ['camaViuva', 7, 1, { nada: [[6, 1], [8, 1], [9, 1]] }],
    ['guardaRoupa', 3, 1], ['guardaRoupa', 4, 1], ['escrivaninha', 11, 1],
    ['peles', 3, 3, { baixo: true }], ['cadeira', 2, 5], ['cadeira', 10, 4], ['cadeira', 12, 4],
    // banheiro (13)
    ['tina', 2, 10], ['fogao', 1, 11],
    // depósito (14)
    ['prateleira', 2, 14], ['prateleira', 3, 14], ['prateleira', 4, 14],
    // berçário (15B)
    ['berco', 1, 19], ['cadeira', 3, 17],
    // suíte da babá (15A)
    ['camaViuva', 9, 22, { nada: [[9, 21], [10, 21], [10, 22]] }],
    ['guardaRoupa', 12, 19], ['banquinho', 8, 21], ['banquinho', 11, 21],
    // varanda (11)
    ['candelabro', 6, 9], ['candelabro', 8, 15],
  ],

  // ----------------------------------------------------------------------------------------------------- sótão ---
  casaDaMorte4: [
    // quarto de repouso (17)
    ['cama', 2, 2, { nada: [[1, 2]] }], ['escrivaninha', 3, 1], ['cadeira', 3, 4], ['fogao', 1, 5],
    // quarto das crianças (20): as camas, o baú de brinquedos e a casa de bonecas
    ['cama', 5, 2], ['cama', 10, 2], ['cofreVazio', 6, 4], ['armario', 6, 5],
    // depósito dos móveis cobertos (18): lençóis sobre tudo, o baú dos restos e o fogão
    ['fogao', 1, 11],
    ['trapos', 2, 12], ['trapos', 3, 14], ['trapos', 5, 15], ['trapos', 2, 16], ['trapos', 5, 17], ['trapos', 3, 18],
    // quarto de repouso (19)
    ['cama', 10, 19], ['fogao', 12, 22], ['cadeira', 12, 19],
  ],
};
