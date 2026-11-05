// O POLÍGONO DE VISÃO, como o Foundry faz: de um ponto, raios em leque até a primeira parede. É com ele que a vista
// de cima desenha luz e escuro, em vez de acender casa por casa — a tocha vira um círculo que a rocha recorta, e não
// uma escada de quadrados.
//
// Só DESENHO. Quem decide o que o grupo enxerga continua sendo a regra (`rules/luz.js`, `grid.hasLineOfSight`): a
// figura só aparece se a casa dela está na visão do grupo, e a máscara de casas entra por cima disto para a altura
// (o platô que corta a visão) valer na tela também. O polígono só dá a forma.
//
// O QUE BARRA O RAIO é o mesmo que barra a reta dos olhos na regra:
// - com traço livre (`field.tracos`), o traço — e no cruzamento vale a exceção da porta de `cortadoPorTraco`: o
//   traço que cai numa aresta que deixa a visão passar (porta aberta, arco, grade) não conta. A aresta de casa
//   derivada do traço NÃO barra o raio (é ela que faria a escada); só a porta fechada desenhada na aresta;
// - sem traço, a aresta de casa (parede, porta fechada) e a casa que tapa a vista (`blocksSight`). Essa casa entra
//   no polígono inteira: a parede se vê, o que está atrás dela não.

import { barraVisaoAlemDoTraco, segmentoBarra } from '../core/grid.js';

const EPS = 1e-7;

/** Onde o raio `O + t·d` cruza o segmento `c→e` (t, ou Infinity). */
function cruzamento(ox, oy, dx, dy, c, e) {
  const sx = e[0] - c[0];
  const sy = e[1] - c[1];
  const den = dx * sy - dy * sx;
  if (Math.abs(den) < EPS) return Infinity;
  const qx = c[0] - ox;
  const qy = c[1] - oy;
  const t = (qx * sy - qy * sx) / den;
  const u = (qx * dy - qy * dx) / den;
  if (t <= EPS || u < -EPS || u > 1 + EPS) return Infinity;
  return t;
}

/** O traço cruzado em `t` barra mesmo? A exceção da porta, igual à de `Battlefield.cortadoPorTraco`. */
function tracoBarra(field, ox, oy, dx, dy, t) {
  const e = 0.02;
  const ax = Math.floor(ox + (t - e) * dx);
  const ay = Math.floor(oy + (t - e) * dy);
  const bx = Math.floor(ox + (t + e) * dx);
  const by = Math.floor(oy + (t + e) * dy);
  if (ax === bx && ay === by) return true;
  return !field.passa(ax, ay, bx, by, 'visao');
}

/** Até onde vai UM raio, em casas (no máximo `raio`). */
function lancar(field, idx, ox, oy, ang, raio) {
  const dx = Math.cos(ang);
  const dy = Math.sin(ang);
  let cx = Math.floor(ox);
  let cy = Math.floor(oy);
  const passoX = dx > 0 ? 1 : -1;
  const passoY = dy > 0 ? 1 : -1;
  const deltaX = Math.abs(dx) > EPS ? Math.abs(1 / dx) : Infinity;
  const deltaY = Math.abs(dy) > EPS ? Math.abs(1 / dy) : Infinity;
  let maxX = Math.abs(dx) > EPS ? (dx > 0 ? cx + 1 - ox : ox - cx) * deltaX : Infinity;
  let maxY = Math.abs(dy) > EPS ? (dy > 0 ? cy + 1 - oy : oy - cy) * deltaY : Infinity;
  let melhor = raio;
  let limitadas = 0;   // a moita: a primeira aresta limitada deixa ver, a segunda para o raio (como na regra)
  const vistos = idx ? new Set() : null;
  for (let guarda = 0; guarda < 4096; guarda++) {
    if (idx) {
      // o índice guarda cada segmento com uma casa de folga: o cruzamento achado aqui pode cair adiante, e por isso
      // se guarda o MENOR e só se para quando a saída desta casa já passou dele
      const lista = idx.get(`${cx},${cy}`);
      if (lista) {
        for (const seg of lista) {
          if (vistos.has(seg)) continue;
          vistos.add(seg);
          const t = cruzamento(ox, oy, dx, dy, seg[0], seg[1]);
          // o traço de janela, invisível ou moita não para o raio (`grid.segmentoBarra`, o mesmo da regra)
          if (t < melhor && segmentoBarra(seg) && tracoBarra(field, ox, oy, dx, dy, t)) melhor = t;
        }
      }
    }
    const sai = Math.min(maxX, maxY);
    if (melhor <= sai || sai >= raio) break;
    let nx = cx;
    let ny = cy;
    if (maxX < maxY) { nx += passoX; maxX += deltaX; } else { ny += passoY; maxY += deltaY; }
    if (!field.inside(nx, ny)) { melhor = Math.min(melhor, sai); break; }
    limitadas += field.limitadasNoPasso?.(cx, cy, nx, ny, 'visao') ?? 0;
    if (limitadas >= 2) { melhor = Math.min(melhor, sai); break; }
    if (idx) {
      if (barraVisaoAlemDoTraco(field.aresta(cx, cy, nx, ny))) { melhor = Math.min(melhor, sai); break; }
    } else {
      if (!field.passa(cx, cy, nx, ny, 'visao')) { melhor = Math.min(melhor, sai); break; }
      // a casa que tapa a vista entra inteira: vê-se a parede, não o que há atrás
      if (field.blocksSight(nx, ny)) { melhor = Math.min(melhor, Math.min(maxX, maxY), raio); break; }
    }
    cx = nx;
    cy = ny;
  }
  return melhor;
}

/**
 * O polígono do que se vê de (`ox`, `oy`), em casas com fração, até `raio` casas. Devolve [x0, y0, x1, y1, ...].
 * `raios` é quantos raios no leque: 720 dá um degrau de meio grau, liso até numa tocha de tela inteira.
 */
export function poligonoDeVisao(field, ox, oy, raio, raios = 720) {
  const idx = field.tracos?.length ? field.indiceDosTracos() : null;
  const pts = new Float32Array(raios * 2);
  for (let i = 0; i < raios; i++) {
    const ang = (i / raios) * Math.PI * 2;
    const t = lancar(field, idx, ox, oy, ang, raio);
    pts[i * 2] = ox + Math.cos(ang) * t;
    pts[i * 2 + 1] = oy + Math.sin(ang) * t;
  }
  return pts;
}

/** Guarda de polígonos: o mesmo ponto, raio e estado do mapa devolvem o mesmo polígono sem lançar raio nenhum. */
export function criarCacheDePoligonos() {
  let versao = null;
  let mapa = new Map();
  return (field, ox, oy, raio, raios, estado) => {
    if (estado !== versao) { versao = estado; mapa = new Map(); }
    const k = `${ox},${oy},${raio},${raios}`;
    let p = mapa.get(k);
    if (!p) { p = poligonoDeVisao(field, ox, oy, raio, raios); mapa.set(k, p); }
    return p;
  };
}
