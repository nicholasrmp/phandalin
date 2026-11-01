// Livro do Jogador não é SRD: a Maldição de Strahd é conteúdo da Wizards. A PLANTA é nossa — ver NOTICE.md e STRAHD.md.
//
// PAREDE DE BORDA para os quatro andares da casa. As plantas de `casadamorte.js` e `casadamorte-alto.js` foram desenhadas com a parede
// ocupando uma casa (`M`) e a porta sendo uma casa (`?`): é como o motor faz a masmorra, mas numa casa de moradia isso deixa uma faixa
// morta entre as salas e, nos vestíbulos de uma casa de largura, uma floresta de tocos de parede. O motor também sabe fazer a parede FINA,
// na aresta ENTRE duas casas (a da taverna e a do castelo), com porta de verdade e quina que emenda.
//
// Este arquivo converte uma planta na outra SEM MUDAR NENHUMA COORDENADA (as salas, os pontos de investigação, os gatilhos, a mobília e as
// escadas seguem onde estão):
//   1. cada trecho de piso (sem contar parede e porta) é uma SALA;
//   2. cada casa de parede ou de porta vira piso da sala que está logo ao sul dela (senão a leste, ao norte, a oeste: a que vier primeiro),
//      e as que não têm sala por perto herdam a do vizinho que já foi resolvido;
//   3. onde duas casas vizinhas são de salas diferentes, há uma parede na aresta entre elas — e é porta (arco aberto) quando uma das duas
//      era uma casa de porta;
//   4. a borda norte e a borda oeste do mapa são parede; a sul e a leste ficam abertas, como as outras casas do jogo ("inteiras no
//      fundo, cortadas na frente"), para o grupo ver dentro da casa.
//
// `nichos` são grupos de casas de parede que ficam escondidos (o poço da escada secreta): cada um vira uma sala própria, fechada, até a
// casa abrir uma aresta dela.

const SUL = [0, 1]; const LESTE = [1, 0]; const NORTE = [0, -1]; const OESTE = [-1, 0];
const DIRECOES = [SUL, LESTE, NORTE, OESTE];
const PISOS = new Set(['U', '-', '*', '+']);

/**
 * @param {string[]} base planta com `M` (parede), `?` (porta) e o resto piso/mobília
 * @param {object} [o]
 * @param {string} [o.piso] glifo do piso das casas que eram parede
 * @param {Array<Array<[number, number]>>} [o.nichos] grupos de casas de parede escondidas
 * @param {string[]} [o.fechadas] portas que começam trancadas: 'x,y,N' ou 'x,y,O' (a aresta, do lado da casa dona dela)
 */
export function paredesDeBorda(base, { piso = 'U', nichos = [], fechadas = [] } = {}) {
  const h = base.length;
  const w = base[0].length;
  const g = (x, y) => base[y]?.[x];
  const dentro = (x, y) => x >= 0 && y >= 0 && x < w && y < h;
  const ehParede = (x, y) => g(x, y) === 'M';
  const ehPorta = (x, y) => g(x, y) === '?';
  const nicho = new Map();
  nichos.forEach((grupo, i) => grupo.forEach(([x, y]) => nicho.set(`${x},${y}`, i)));

  // 1. as salas: piso ligado por quatro lados (parede e porta separam)
  const sala = Array.from({ length: h }, () => Array(w).fill(null));
  let n = 0;
  const preencher = (x0, y0, id, serve) => {
    const fila = [[x0, y0]];
    sala[y0][x0] = id;
    while (fila.length) {
      const [x, y] = fila.pop();
      for (const [dx, dy] of DIRECOES) {
        const nx = x + dx; const ny = y + dy;
        if (!dentro(nx, ny) || sala[ny][nx] !== null || !serve(nx, ny)) continue;
        sala[ny][nx] = id;
        fila.push([nx, ny]);
      }
    }
  };
  // os nichos primeiro: cada grupo é uma sala só dele
  nichos.forEach((grupo, i) => {
    const id = n++;
    const quais = new Set(grupo.map(([x, y]) => `${x},${y}`));
    preencher(grupo[0][0], grupo[0][1], id, (x, y) => quais.has(`${x},${y}`));
    void i;
  });
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (sala[y][x] !== null || ehParede(x, y) || ehPorta(x, y)) continue;
      preencher(x, y, n++, (px, py) => sala[py][px] === null && !ehParede(px, py) && !ehPorta(px, py) && !nicho.has(`${px},${py}`));
    }
  }

  // 2. as casas de parede e de porta ficam com a sala de um vizinho
  const piso_de = (x, y) => {
    const v = g(x, y);
    return PISOS.has(v) && v !== '*' ? v : piso;
  };
  const glifo = base.map((l) => [...l]);
  let pendentes = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (sala[y][x] === null) pendentes.push([x, y]);
  // A casa de parede (ou de porta) fica com a sala do vizinho: primeiro só os que já eram piso; depois, os que acabaram de ser resolvidos.
  for (const soDePiso of [true, false]) {
    let avancou = true;
    while (pendentes.length && avancou) {
      avancou = false;
      const resolvidos = [];
      for (const [x, y] of pendentes) {
        for (const [dx, dy] of DIRECOES) {
          const nx = x + dx; const ny = y + dy;
          if (!dentro(nx, ny) || sala[ny][nx] === null || nicho.has(`${nx},${ny}`)) continue;
          if (soDePiso && (ehParede(nx, ny) || ehPorta(nx, ny))) continue;
          resolvidos.push([x, y, sala[ny][nx], piso_de(nx, ny)]);
          break;
        }
      }
      // aplica depois de olhar todas: o resultado não depende da ordem das casas
      for (const [x, y, id, pv] of resolvidos) { sala[y][x] = id; glifo[y][x] = pv; avancou = true; }
      pendentes = pendentes.filter(([x, y]) => sala[y][x] === null);
    }
  }
  // (sobrou alguma casa sem vizinho resolvido: vira piso solto de uma sala própria)
  for (const [x, y] of pendentes) { sala[y][x] = n++; glifo[y][x] = piso; }
  // as casas dos nichos escondidos: piso liso até a casa mostrar a escada
  for (const chave of nicho.keys()) { const [x, y] = chave.split(',').map(Number); glifo[y][x] = piso; }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (glifo[y][x] === 'M' || glifo[y][x] === '?') glifo[y][x] = piso;

  // 3 e 4. as arestas
  const trancadas = new Set(fechadas);
  const nRows = Array.from({ length: h }, () => Array(w).fill('.'));
  const oRows = Array.from({ length: h }, () => Array(w).fill('.'));
  const portas = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      for (const [lado, dx, dy, rows] of [['N', 0, -1, nRows], ['O', -1, 0, oRows]]) {
        const ax = x + dx; const ay = y + dy;
        if (!dentro(ax, ay)) { rows[y][x] = '#'; continue; }       // a borda norte e a oeste do mapa
        if (sala[ay][ax] === sala[y][x]) continue;
        const porta = ehPorta(x, y) || ehPorta(ax, ay);
        if (porta) {
          rows[y][x] = trancadas.has(`${x},${y},${lado}`) ? '+' : '/';
          portas.push({ x, y, lado, trancada: trancadas.has(`${x},${y},${lado}`) });
        } else rows[y][x] = '#';
      }
    }
  }

  // as salas, para o tabuleiro apagar a parede da sala em que o grupo está
  const salas = {};
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) (salas[`s${sala[y][x]}`] ??= []).push({ x, y });
  return {
    terreno: glifo.map((l) => l.join('')),
    paredes: { n: nRows.map((l) => l.join('')), o: oRows.map((l) => l.join('')) },
    salas,
    portas,
    sala,
  };
}

/** A aresta entre duas casas vizinhas, no campo vivo: porta aberta, trancada, parede. */
export const ARESTA_CODIGO = { parede: 1, porta: 2, aberta: 3 };
export function mudarAresta(field, ax, ay, bx, by, codigo) {
  field.porAresta(ax, ay, bx, by, codigo);
}
