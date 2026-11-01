// Livro do Jogador não é SRD: a Maldição de Strahd é conteúdo da Wizards. A PLANTA é nossa — ver NOTICE.md e STRAHD.md.
//
// A PLANTA DA CASA DA MORTE NA ESCALA DO LIVRO. O mapa do apêndice B é de quadrados de 5 pés (1,5 m), e a casa tem 6 quadrados de largura por
// 11 de comprimento: um quadrado do mapa é uma casa do jogo (só a masmorra usa 2 x 2 casas por quadrado). Cada andar aqui é escrito em
// QUADRADOS DO LIVRO (0 a 5 de largura, 0 a 10 de comprimento): cada sala é um conjunto de retângulos, cada porta é uma aresta entre dois
// quadrados vizinhos. A parede é a aresta entre duas casas de salas diferentes (a casa NÃO gasta uma casa de chão com parede).
//
// O MAPA TEM UM ANEL DE UMA CASA EM VOLTA: o lado de FORA da casa (chão cinza, fora de qualquer sala). A parede da casa fica na aresta entre o
// anel e a primeira sala; o tabuleiro baixa o muro da frente (o do sul e o do leste), e a casa aparece por dentro. Por isso toda coordenada de
// MAPA é a do livro mais `D` (o anel): use `casa(x, y)` e `ret(x1, y1, x2, y2)` para passar de uma para a outra.

/** O anel: a coordenada do mapa é a do livro mais isto. */
export const D = 1;
export const casa = (x, y) => ({ x: x + D, y: y + D });
export const ret = (x1, y1, x2, y2) => ({ x1: x1 + D, y1: y1 + D, x2: x2 + D, y2: y2 + D });

/** A largura e o comprimento do mapa de um andar (a casa mais o anel). */
export const LARGURA = 6 + 2 * D;
export const COMPRIMENTO = 11 + 2 * D;

/**
 * @param {object} p
 * @param {Array<{ id: string, piso?: string, retangulos: number[][] }>} p.salas retângulos [x1, y1, x2, y2] em quadrados do livro (inclusivos)
 * @param {number[][]} [p.portas] arestas [ax, ay, bx, by, codigo?] (3 arco aberto, 2 porta fechada); só arestas entre duas salas
 * @param {number} [p.extraLeste] colunas a mais a leste do anel (a floresta de fora)
 * @param {number} [p.extra] linhas a mais ao sul do anel (o jardim da frente do térreo)
 * @param {{ retangulo: number[], portao: number[] }} [p.quintal] o jardim de fora: o retângulo (quadrados do livro) e as duas colunas do portão da cerca de ferro
 * @param {number[][][]} [p.duplas] pares de arestas de porta vizinhas que formam UM vão (a porta dupla de dois quadrados): um arco só, centrado
 * @param {Array<[number, number, string]>} [p.glifos] casas que trocam de glifo: escada ('l'), tapete ('*')
 * @param {string} [p.piso] glifo do piso das salas que não dizem o seu
 */
export function plantaDeSalas({ salas, portas = [], duplas = [], glifos = [], piso = 'U', extra = 0, extraLeste = 0, quintal = null }) {
  const w = LARGURA + extraLeste; const h = COMPRIMENTO + extra;
  const dentro = (x, y) => x >= 0 && y >= 0 && x < w && y < h;
  const dono = Array.from({ length: h }, () => Array(w).fill(-1));
  const glifo = Array.from({ length: h }, () => Array(w).fill('Z'));
  salas.forEach((s, i) => {
    for (const [x1, y1, x2, y2] of s.retangulos) {
      for (let y = y1; y <= y2; y++) {
        for (let x = x1; x <= x2; x++) {
          if (dono[y + D][x + D] >= 0) throw new Error(`casa ${x},${y} está em duas salas: ${salas[dono[y + D][x + D]].id} e ${s.id}`);
          dono[y + D][x + D] = i;
          glifo[y + D][x + D] = s.piso ?? piso;
        }
      }
    }
  });
  for (const [x, y, g] of glifos) glifo[y + D][x + D] = g;

  const nRows = Array.from({ length: h }, () => Array(w).fill('.'));
  const oRows = Array.from({ length: h }, () => Array(w).fill('.'));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      for (const [dx, dy, rows] of [[0, -1, nRows], [-1, 0, oRows]]) {
        const ax = x + dx; const ay = y + dy;
        if (!dentro(ax, ay)) continue;
        if (dono[ay][ax] === dono[y][x]) continue;
        rows[y][x] = '#';
      }
    }
  }
  // a casa de fora (o anel e os recortes) contra a casa de fora não tem parede; a parede é só entre a casa e o lado de fora ou entre salas
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (dono[y][x] >= 0) continue;
      if (x > 0 && dono[y][x - 1] < 0) oRows[y][x] = '.';
      if (y > 0 && dono[y - 1][x] < 0) nRows[y][x] = '.';
    }
  }
  const aresta = (ax, ay, bx, by) => (bx === ax + 1 ? [oRows, bx, by] : bx === ax - 1 ? [oRows, ax, ay] : by === ay + 1 ? [nRows, bx, by] : [nRows, ax, ay]);
  for (const [ax, ay, bx, by, cod = '/'] of portas) {
    const [rows, x, y] = aresta(ax + D, ay + D, bx + D, by + D);
    if (rows[y][x] !== '#') throw new Error(`a porta ${ax},${ay} - ${bx},${by} não está numa parede`);
    rows[y][x] = cod;
  }

  // O JARDIM DA FRENTE: fora de qualquer sala (o muro da casa não cobre quem está nele), cercado por grades de ferro (`J`, as barras que a
  // cela da mansão usa) e com um portão de duas colunas na cerca do sul.
  const grades = [];
  const portaoDuplo = [];
  if (quintal) {
    const [qx1, qy1, qx2, qy2] = quintal.retangulo.map((v, i) => v + D);
    const cerca = (rows, x, y, lado) => { if (rows[y][x] === '.') { rows[y][x] = 'J'; grades.push(`${x},${y},${lado}`); } };
    for (let y = qy1; y <= qy2; y++) { cerca(oRows, qx1, y, 'O'); cerca(oRows, qx2 + 1, y, 'O'); }
    for (let x = qx1; x <= qx2; x++) cerca(nRows, x, qy2 + 1, 'N');
    for (const c of quintal.portao) {
      const x = c + D;
      nRows[qy2 + 1][x] = '+';
      const k = `${x},${qy2 + 1},N`;
      grades.splice(grades.indexOf(k), 1);
      portaoDuplo.push(k);
    }
  }
  // as portas duplas: as duas arestas viram um vão só ('x,y,N|O' do mapa)
  const vaoUnido = [];
  for (const par of duplas) {
    for (const [ax, ay, bx, by] of par) {
      const [rows, x, y] = aresta(ax + D, ay + D, bx + D, by + D);
      vaoUnido.push(`${x},${y},${rows === nRows ? 'N' : 'O'}`);
    }
  }
  // as portas têm folha (o tabuleiro a desenha encostada no batente quando o arco está aberto)
  vaoUnido.push(...portaoDuplo);
  const folhas = portas.map(([ax, ay, bx, by]) => [{ x: ax + D, y: ay + D }, { x: bx + D, y: by + D }]);

  const mapaSalas = {};
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) if (dono[y][x] >= 0) (mapaSalas[salas[dono[y][x]].id] ??= []).push({ x, y });
  }
  return {
    terreno: glifo.map((l) => l.join('')),
    paredes: { n: nRows.map((l) => l.join('')), o: oRows.map((l) => l.join('')) },
    salas: mapaSalas,
    folhas,
    vaoUnido,
    grades,
    dono,
  };
}

/**
 * Uma área do livro: o texto e as casas (um ou mais retângulos, em quadrados do livro). `x1..y2` é a caixa que a contém, e `contem` diz
 * se uma casa do mapa é mesmo dela (as salas em L não são um retângulo).
 */
export function criarArea({ id, area, nome, texto, cel }) {
  const r = cel.map(([x1, y1, x2, y2]) => ret(x1, y1, x2, y2));
  return {
    id, area, nome, texto,
    x1: Math.min(...r.map((a) => a.x1)), y1: Math.min(...r.map((a) => a.y1)),
    x2: Math.max(...r.map((a) => a.x2)), y2: Math.max(...r.map((a) => a.y2)),
    contem: (p) => r.some((a) => p.x >= a.x1 && p.x <= a.x2 && p.y >= a.y1 && p.y <= a.y2),
  };
}

/** Os tapetes: retângulo de casas do livro (inclusivo) que vira tapete onde havia piso (vai em `glifos`). */
export const tapete = (x1, y1, x2, y2) => {
  const o = [];
  for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) o.push([x, y, '*']);
  return o;
};
