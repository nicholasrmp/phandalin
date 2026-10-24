// As zonas persistentes em 2.5D: têm VOLUME, não só chão pintado.
//
// Nada aqui tem tempo de vida: o tabuleiro lê `enc.zonas` a cada quadro e a
// forma existe enquanto a zona existir. Tudo é pixel art (sem suavização, cores
// em degraus) e CACHEADO — nenhum pixel é rasterizado por quadro, só colado.
//
//   Muralha de Vento    uma parede de ar, uma tira por casa, na diagonal da casa
//                       (entra no laço de profundidade de `board.fecharDiagonal`);
//   Escuridão e Hadar   esferas escuras (o domo de `fx.js`), por cima da máscara;
//   Fome de Hadar       + tentáculos nas casas da borda e cristais de gelo fixos;
//   Névoa Obscurecente  uma nuvem de tufos em pé nas casas;
//   Ilusão Menor        um caixote ou uma rocha trêmulo e translúcido;
//   Crescer Plantas     capim e moitas floridas, afastadas das figuras;
//   Luz do Dia          um sol pequeno sobre o ponto (+ o domo 'sol' de `fx.js`);
//   Imagem Silenciosa/  pilhas de caixotes e rochas trêmulas e translúcidas, uma por casa
//   Imagem Maior        (mais altas no miolo), que pulam as casas com figuras;
//   Cordão de Flechas   o feixe de flechas fincadas no ponto;
//   Glifo de Proteção   uma runa que paira e pulsa (só o grupo a vê).
//
// As que ESCONDEM são desenhadas por `board.zonasObscurasPorCima`, depois da
// máscara de escuridão, com o recorte elíptico das figuras à vista.

const hash = (x, y, k = 0) => (((x * 73856093) ^ (y * 19349663) ^ (k * 83492791)) >>> 0);

const cv = (w, h) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};

/** Pinta pixels num canvas pelo ImageData: sem AA, um pixel é um pixel. */
function pintar(w, h, fn) {
  const c = cv(w, h);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(w, h);
  const put = (x, y, [r, g, b], a = 1) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = (y * w + x) * 4;
    img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = Math.round(a * 255);
  };
  fn(put);
  ctx.putImageData(img, 0, 0);
  return c;
}

// ---- Muralha de Vento ---------------------------------------------------------

const ALTURA_PAREDE = 80; // ~2,5 casas
// Os 4 jeitos de uma linha de casas correr na TELA: a base da tira vai da
// ponta esquerda `L` à direita `R` (relativas ao centro da casa).
const PAREDE_CLASSES = {
  vx: { L: [-16, -8], R: [16, 8] }, // ao longo de +vx: desce para a direita
  v: { L: [-10, 0], R: [10, 0] }, // ao longo de (1,1): de perfil, uma coluna
  vy: { L: [-16, 8], R: [16, -8] }, // ao longo de +vy: sobe para a direita
  h: { L: [-32, 0], R: [32, 0] }, // ao longo de (1,-1): reta na horizontal
};
const NOMES_PAREDE = ['vx', 'v', 'vy', 'h'];
const paredeAtlas = new Map();

function paredeTira(cls, fase) {
  const chave = `${cls}|${fase}`;
  if (paredeAtlas.has(chave)) return paredeAtlas.get(chave);
  const { L, R } = PAREDE_CLASSES[cls];
  const larg = R[0] - L[0];
  const topo = Math.min(L[1], R[1]) - ALTURA_PAREDE - 2;
  const alt = Math.max(L[1], R[1]) + 2 - topo;
  const ox = -L[0];
  const oy = -topo;
  const canvas = pintar(larg, alt, (put) => {
    for (let x = 0; x < larg; x++) {
      const yb = oy + L[1] + (larg > 0 ? ((R[1] - L[1]) * x) / larg : 0);
      const base = Math.round(yb);
      for (let v = 0; v <= ALTURA_PAREDE; v++) {
        const y = base - v;
        // O corpo: fraco no pé, mais claro para o alto, o topo brilhando.
        const f = v / ALTURA_PAREDE;
        let a = f < 0.33 ? 0.07 : f < 0.66 ? 0.13 : 0.2;
        let c = [206, 234, 250];
        if (v < 2) a = 0.2; // a linha onde a parede pisa
        // Listras brancas que sobem (4 fases de 4 px fecham o ciclo de 16).
        if (v >= 2 && ((v - fase * 4 + ((x * 5) % 13)) % 16 + 16) % 16 < 3 && ((x >> 1) % 3) !== 0) {
          a = 0.46;
          c = [255, 255, 255];
        }
        if (v >= ALTURA_PAREDE - 1) { a = 0.88; c = [255, 255, 255]; }
        else if (v >= ALTURA_PAREDE - 4) { a = Math.max(a, 0.34); c = [236, 248, 255]; }
        put(x, y, c, a);
      }
    }
  });
  const o = { canvas, ox, oy };
  paredeAtlas.set(chave, o);
  return o;
}

const paredeCache = new Map();
/** As casas de uma muralha, com a classe de direção e a diagonal de cada uma. */
function dadosDaParede(board, z) {
  const chave = `${z.id}|${board.rot}|${z.casas.size}`;
  let d = paredeCache.get(chave);
  if (d) return d;
  if (paredeCache.size > 12) paredeCache.clear();
  const cs = [...z.casas].map((k) => {
    const [x, y] = k.split(',').map(Number);
    const v = board.toView(x, y);
    return { x, y, vx: v.vx, vy: v.vy };
  });
  // A direção da linha: o par de casas mais afastado entre si.
  let a = cs[0];
  let b = cs[0];
  let melhor = -1;
  for (const p of cs) for (const q of cs) {
    const dd = (p.vx - q.vx) ** 2 + (p.vy - q.vy) ** 2;
    if (dd > melhor) { melhor = dd; a = p; b = q; }
  }
  let ang = Math.atan2(b.vy - a.vy, b.vx - a.vx);
  if (ang < 0) ang += Math.PI;
  const cls = melhor <= 0 ? 'vx' : NOMES_PAREDE[Math.round(ang / (Math.PI / 4)) % 4];
  const porDiag = new Map();
  for (const c of cs) {
    const dg = c.vx + c.vy;
    if (!porDiag.has(dg)) porDiag.set(dg, []);
    porDiag.get(dg).push(c);
  }
  d = { cls, porDiag };
  paredeCache.set(chave, d);
  return d;
}


// ---- Lote 11: Ilusão Menor, Crescer Plantas, Luz do Dia ---------------------------------
//
//   Ilusão Menor     um caixote (ou uma rocha) trêmulo e translúcido, em pé na casa;
//   Crescer Plantas  tufos de capim em todas as casas e moitas floridas esparsas, que
//                    se afastam das figuras (nunca as escondem);
//   Luz do Dia       um sol pequeno boiando sobre o ponto; a esfera clara em volta é o
//                    domo 'sol' de `fx.js` (`domosAtivos`).
//
// Tudo pintado ponto a ponto, sem suavização, e guardado: nenhum pixel é refeito por quadro.

const dentroPoligono = (x, y, pts) => {
  let dentro = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dentro = !dentro;
  }
  return dentro;
};

// ---- a imagem do objeto ----

const CX_A = 24; // meia largura da face de cima
const CX_B = 12; // meia altura
const CX_H = 32; // altura do caixote
const CAIXA_W = CX_A * 2 + 6;
const CAIXA_H = CX_H + CX_B * 2 + 6;
const CAIXA_OX = CX_A + 3;
const CAIXA_OY = CX_H + CX_B + 3;
const caixaCache = new Map();

/** Cor [r,g,b] do objeto no pixel (x, y) relativo ao centro da casa, ou null fora dele. */
function objetoCor(variante, x, y) {
  if (variante === 0) {
    const T = [0, -CX_H - CX_B]; const R = [CX_A, -CX_H]; const B = [0, -CX_H + CX_B]; const L = [-CX_A, -CX_H];
    const Lb = [-CX_A, 0]; const Bb = [0, CX_B]; const Rb = [CX_A, 0];
    const cima = dentroPoligono(x, y, [T, R, B, L]);
    const esq = dentroPoligono(x, y, [L, B, Bb, Lb]);
    const dir = dentroPoligono(x, y, [B, R, Rb, Bb]);
    if (cima) {
      const tira = Math.floor(((y + CX_H) - x / 2 + 400) / 6) % 2 === 0;
      return { rgb: tira ? [226, 190, 132] : [208, 170, 114], face: 1 };
    }
    if (esq) {
      const tira = Math.floor((x + CX_A + 400) / 8) % 2 === 0;
      return { rgb: tira ? [170, 128, 80] : [152, 112, 68], face: 2 };
    }
    if (dir) {
      const tira = Math.floor((x + 400) / 8) % 2 === 0;
      return { rgb: tira ? [124, 90, 56] : [106, 76, 46], face: 3 };
    }
    return null;
  }
  // A rocha: uma elipse achatada embaixo, luz de cima e da esquerda.
  const cy = -14;
  const e = (x / 22) ** 2 + ((y - cy) / (y > cy ? 15 : 19)) ** 2;
  if (e > 1) return null;
  const luz = -x * 0.55 - (y - cy) * 0.95 + (((x * 7 + y * 13) & 7) - 3);
  const rgb = luz > 14 ? [196, 198, 208] : luz > 2 ? [158, 160, 172] : luz > -12 ? [116, 118, 132] : [82, 84, 98];
  return { rgb, face: 1 };
}

/** O objeto, em 4 fases de tremor. `v`: 0 caixote, 1 rocha. */
function objetoSprite(v, fase) {
  const chave = `${v}|${fase}`;
  if (caixaCache.has(chave)) return caixaCache.get(chave);
  const c = pintar(CAIXA_W, CAIXA_H, (put) => {
    for (let py = 0; py < CAIXA_H; py++) {
      const y = py - CAIXA_OY;
      // O tremor: de tempos em tempos uma linha escorrega 1 px e fica mais fraca.
      const sorte = (py * 7 + fase * 5) % 13;
      const desliza = sorte === 0 ? 1 : sorte === 6 ? -1 : 0;
      for (let px = 0; px < CAIXA_W; px++) {
        const x = px - CAIXA_OX;
        const p = objetoCor(v, x - desliza, y);
        if (!p) continue;
        // Contorno: o pixel que tem vizinho vazio.
        const borda = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !objetoCor(v, x - desliza + dx, y + dy));
        const entre = !borda && [[1, 0], [0, 1], [-1, 0], [0, -1]].some(([dx, dy]) => objetoCor(v, x - desliza + dx, y + dy)?.face !== p.face);
        let rgb = p.rgb.map((q, i) => Math.round(q * 0.75 + [160, 150, 220][i] * 0.25));
        let a = 0.68;
        if (entre) { rgb = rgb.map((q) => Math.round(q * 0.7)); a = 0.78; }
        if (borda) { rgb = [168, 148, 226].map((q, i) => Math.round(q * 0.82 + [199, 180, 255][i] * 0.18)); a = 0.85; }
        if (desliza) a *= 0.55;
        put(px, py, rgb, a);
      }
    }
    // Faíscas violeta: aparecem em lugares diferentes a cada fase.
    for (let i = 0; i < 5; i++) {
      const h = hash(i, fase, v + 3);
      const x = (h % 36) - 18;
      const y = -((h >>> 6) % 34) - 3;
      if (objetoCor(v, x, y)) put(x + CAIXA_OX, y + CAIXA_OY, [236, 226, 255], 0.95);
    }
  });
  const o = { canvas: c, ox: CAIXA_OX, oy: CAIXA_OY };
  caixaCache.set(chave, o);
  return o;
}

// ---- capim e moitas ----

const MATO_ESC = [34, 78, 38];
const MATO_MED = [66, 138, 54];
const MATO_CLA = [122, 196, 82];
const MATO_PONTA = [194, 232, 126];
const TUFO_PW = 30;
const TUFO_PH = 22;
const MOITA_W = 46;
const MOITA_H = 36;
const matoCache = new Map();

function tufoDeCapim(v, fase) {
  const chave = `t${v}|${fase}`;
  if (matoCache.has(chave)) return matoCache.get(chave);
  const c = pintar(TUFO_PW, TUFO_PH, (put) => {
    const n = 7 + v;
    for (let i = 0; i < n; i++) {
      const h = hash(i, v, 11);
      const ang = n === 1 ? 0 : (i / (n - 1) - 0.5) * 2;
      const len = 9 + (h % 8);
      const lean = ang * 9 + (fase ? 1.4 : -1.4) * ang * (len / 12);
      for (let k = 0; k <= len; k++) {
        const f = k / len;
        const x = Math.round(TUFO_PW / 2 + ang * 4 + lean * f);
        const y = TUFO_PH - 2 - k;
        const rgb = f < 0.3 ? MATO_ESC : f < 0.7 ? MATO_MED : f < 0.92 ? MATO_CLA : MATO_PONTA;
        put(x, y, rgb);
        if (f < 0.55 && i % 2 === 0) put(x + 1, y, MATO_ESC);
      }
    }
  });
  const o = { canvas: c, ox: TUFO_PW / 2, oy: TUFO_PH - 2 };
  matoCache.set(chave, o);
  return o;
}

const MOITA_BOLAS = [
  [[14, 24, 10], [26, 25, 11], [20, 15, 10], [34, 26, 8]],
  [[12, 25, 9], [23, 21, 12], [34, 25, 10], [27, 13, 8]],
];
const FLORES = [[246, 232, 120], [240, 150, 190], [250, 250, 244]];
function moita(v, fase) {
  const chave = `m${v}|${fase}`;
  if (matoCache.has(chave)) return matoCache.get(chave);
  const bolas = MOITA_BOLAS[v % 2];
  const dentro = (x, y) => bolas.some(([cx, cy, r]) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r);
  const c = pintar(MOITA_W, MOITA_H, (put) => {
    for (let y = 0; y < MOITA_H; y++) {
      for (let x = 0; x < MOITA_W; x++) {
        if (!dentro(x, y)) continue;
        const borda = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !dentro(x + dx, y + dy));
        // Luz de cima e da esquerda; folhas em xadrez grosso para não virar bola lisa.
        const luz = (MOITA_H - y) * 1.5 + (MOITA_W - x) * 0.6 + (((x >> 1) + (y >> 1) + fase) % 3) * 4;
        put(x, y, borda ? [26, 58, 30] : luz > 62 ? MATO_CLA : luz > 44 ? MATO_MED : MATO_ESC);
      }
    }
    for (let i = 0; i < 4; i++) {
      const h = hash(i, v, 29);
      const x = 8 + (h % 28);
      const y = 10 + ((h >>> 5) % 18);
      if (dentro(x, y)) { put(x, y, FLORES[(h >>> 9) % 3]); put(x + 1, y, FLORES[(h >>> 9) % 3]); }
    }
  });
  const o = { canvas: c, ox: MOITA_W / 2, oy: MOITA_H - 6 };
  matoCache.set(chave, o);
  return o;
}

const matoDados = new Map();
function dadosDoMato(board, z) {
  const chave = `${z.id}|${board.rot}|${z.casas.size}`;
  let d = matoDados.get(chave);
  if (d) return d;
  if (matoDados.size > 6) matoDados.clear();
  const porDiag = new Map();
  for (const k of z.casas) {
    const [x, y] = k.split(',').map(Number);
    const v = board.toView(x, y);
    const h = hash(x, y, 41);
    const item = { x, y, vx: v.vx, vy: v.vy, moita: h % 5 === 0, v: (h >>> 4) % 3, ox: (h >>> 7) % 17 - 8, oy: (h >>> 12) % 7 - 3, fase: (h >>> 16) & 1 };
    const dg = v.vx + v.vy;
    if (!porDiag.has(dg)) porDiag.set(dg, []);
    porDiag.get(dg).push(item);
  }
  d = { porDiag };
  matoDados.set(chave, d);
  return d;
}

/** As casas (em coordenadas da vista) onde há uma criatura viva. */
function casasOcupadasNaVista(board) {
  const s = new Set();
  for (const c of board.enc.combatants) {
    if (c.dead) continue;
    const f = c.pos.f ?? 1;
    for (let dy = 0; dy < f; dy++) for (let dx = 0; dx < f; dx++) {
      const v = board.toView(c.pos.x + dx, c.pos.y + dy);
      s.add(`${v.vx},${v.vy}`);
    }
  }
  return s;
}

function desenharMato(ctx, board, z, d, ocupadas) {
  const lista = dadosDoMato(board, z).porDiag.get(d);
  if (!lista) return;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  for (const t of lista) {
    // Quem está na casa fica livre; a moita não tapa quem está atrás dela.
    if (ocupadas.has(`${t.vx},${t.vy}`)) continue;
    const { sx, sy } = board.centerF(t.x, t.y);
    const bal = Math.floor(board.time * 1.6 + t.x * 0.7 + t.y * 0.45) & 1;
    if (t.moita) {
      if (ocupadas.has(`${t.vx - 1},${t.vy}`) || ocupadas.has(`${t.vx},${t.vy - 1}`) || ocupadas.has(`${t.vx - 1},${t.vy - 1}`)) {
        const m = tufoDeCapim(t.v, bal);
        ctx.drawImage(m.canvas, Math.round(sx - m.ox + t.ox), Math.round(sy - m.oy + 6));
        continue;
      }
      const m = moita(t.v, bal);
      ctx.drawImage(m.canvas, Math.round(sx - m.ox + t.ox * 0.5), Math.round(sy - m.oy + 6));
    } else {
      const a = tufoDeCapim(t.v, bal);
      ctx.drawImage(a.canvas, Math.round(sx - a.ox + t.ox), Math.round(sy - a.oy + 7 + t.oy));
      const b = tufoDeCapim((t.v + 1) % 3, bal ^ 1);
      ctx.drawImage(b.canvas, Math.round(sx - b.ox - t.ox), Math.round(sy - b.oy + 9 - t.oy));
    }
  }
  ctx.restore();
}

// ---- o sol pequeno da Luz do Dia ----

const SOL_W = 56;
const solCache = [];
function solSprite(fase) {
  if (solCache[fase]) return solCache[fase];
  const cx = SOL_W / 2;
  const c = pintar(SOL_W, SOL_W, (put) => {
    const raio = (x, y) => Math.hypot(x - cx + 0.5, y - cx + 0.5);
    for (let y = 0; y < SOL_W; y++) {
      for (let x = 0; x < SOL_W; x++) {
        const r = raio(x, y);
        if (r <= 7) put(x, y, r <= 4.5 ? [255, 252, 232] : [255, 240, 168]);
        else if (r <= 8.5) put(x, y, [255, 214, 110]);
        else if (r <= 14) put(x, y, [255, 236, 150], 0.22);
        else if (r <= 20) put(x, y, [255, 240, 170], 0.1);
      }
    }
    // Oito raios, que giram de fase em fase.
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2 + (fase * Math.PI) / 16;
      const longo = i % 2 === 0 ? 19 : 14;
      for (let r = 11; r <= longo; r++) {
        put(Math.round(cx + Math.cos(ang) * r), Math.round(cx + Math.sin(ang) * r), r > longo - 3 ? [255, 250, 214] : [255, 226, 130], 0.95);
      }
    }
  });
  solCache[fase] = c;
  return c;
}

function desenharSol(ctx, board, z) {
  if (!z.centro) return;
  const { sx, sy } = board.centerF(z.centro.x, z.centro.y);
  const bob = Math.sin(board.time * 1.8) * 3;
  const fase = Math.floor(board.time * 4) % 4;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  // A sombra de luz no chão.
  ctx.fillStyle = 'rgba(255,236,150,.16)';
  ctx.beginPath();
  ctx.ellipse(Math.round(sx), Math.round(sy), 22, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.drawImage(solSprite(fase), Math.round(sx - SOL_W / 2), Math.round(sy - 62 - SOL_W / 2 + bob));
  ctx.restore();
}

// ---- Lote 12: Cordão de Flechas e Glifo de Proteção ----------------------------------------
//
//   Cordão de Flechas  o feixe das flechas fincadas no ponto (uma a menos a cada tiro);
//   Glifo de Proteção  uma runa que paira e pulsa sobre a casa, na cor do dano — só o lado
//                      de quem a gravou a vê (a runa é invisível para os inimigos).
//
// Pintados ponto a ponto, sem suavização, e guardados por (quantidade|tipo|fase).

const linhaPx = (put, x0, y0, x1, y1, rgb, a = 1) => {
  let x = Math.round(x0); let y = Math.round(y0);
  const xf = Math.round(x1); const yf = Math.round(y1);
  const dx = Math.abs(xf - x); const dy = Math.abs(yf - y);
  const sx = x < xf ? 1 : -1; const sy = y < yf ? 1 : -1;
  let err = dx - dy;
  for (let i = 0; i < 200; i++) {
    put(x, y, rgb, a);
    if (x === xf && y === yf) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
  }
};

const FLECHAS_W = 48;
const FLECHAS_H = 60;
const FLECHAS_OX = 24;
const FLECHAS_OY = 52;
const flechasCache = new Map();

/** O feixe de `n` flechas fincadas (até 8): hastes pardas, penas vermelhas e brancas, ponta de aço cravada. */
function feixeDeFlechas(n) {
  n = Math.max(1, Math.min(8, n));
  if (flechasCache.has(n)) return flechasCache.get(n);
  const c = pintar(FLECHAS_W, FLECHAS_H, (put) => {
    // A sombra no chão: uma elipse achatada, em pixels.
    for (let y = -4; y <= 4; y++) for (let x = -14; x <= 14; x++) {
      if ((x / 14) ** 2 + (y / 4) ** 2 <= 1) put(FLECHAS_OX + x, FLECHAS_OY + y, [28, 22, 18], 0.35);
    }
    for (let i = 0; i < n; i++) {
      const f = n === 1 ? 0 : i / (n - 1) - 0.5;
      const base = FLECHAS_OX + f * 22 + (i % 2 ? 1 : -1);
      const inclina = f * 0.7 + (i % 2 ? 0.06 : -0.06);
      const comp = Math.round((27 + (i % 3) * 2) * 1.3);
      const topoX = base + Math.sin(inclina) * comp;
      const topoY = FLECHAS_OY + 2 - Math.cos(inclina) * comp;
      // A haste: parda com um fio claro do lado da luz.
      linhaPx(put, base, FLECHAS_OY + 2, topoX, topoY, [128, 90, 54]);
      linhaPx(put, base + 1, FLECHAS_OY + 2, topoX + 1, topoY, [128, 90, 54]);
      linhaPx(put, base - 1, FLECHAS_OY + 2, topoX - 1, topoY, [176, 132, 82], 0.9);
      // A ponta de aço, cravada: só o primeiro palmo aparece.
      linhaPx(put, base, FLECHAS_OY + 2, base + Math.sin(inclina) * 3, FLECHAS_OY + 2 - Math.cos(inclina) * 3, [190, 196, 208]);
      // As penas: três linhas curtas no alto, alternando vermelho e marfim.
      for (let k = 0; k < 3; k++) {
        const t = 1 - k * 0.07;
        const px = base + Math.sin(inclina) * comp * t;
        const py = FLECHAS_OY + 2 - Math.cos(inclina) * comp * t;
        put(px - 1, py, k % 2 ? [245, 240, 230] : [210, 60, 50]);
        put(px + 1, py, k % 2 ? [210, 60, 50] : [245, 240, 230]);
      }
      put(topoX, topoY - 1, [236, 232, 214]);
    }
  });
  flechasCache.set(n, c);
  return c;
}

function desenharFeixe(ctx, board, z) {
  const { sx, sy } = board.centerF(z.centro.x, z.centro.y);
  const o = feixeDeFlechas(z.cordao.flechas);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  // Nasce em meio segundo, como as esferas; um brilho fraco rodeia o feixe.
  if (!vistaEm.has(z)) vistaEm.set(z, board.time);
  const nasce = Math.min(1, (board.time - vistaEm.get(z)) / 0.5);
  // Halo quente atrás do feixe, para ele ler como flechas e não como um cajado.
  const hx = Math.round(sx);
  const hy = Math.round(sy - 22);
  const g = ctx.createRadialGradient(hx, hy, 2, hx, hy, 32);
  g.addColorStop(0, 'rgba(255,236,190,.5)');
  g.addColorStop(1, 'rgba(255,236,190,0)');
  ctx.globalAlpha = nasce;
  ctx.fillStyle = g;
  ctx.fillRect(hx - 32, hy - 32, 64, 64);
  ctx.drawImage(o, Math.round(sx - FLECHAS_OX), Math.round(sy - FLECHAS_OY + 4));
  ctx.restore();
}

const RUNA_W = 64;
const RUNA_H = 40;
const COR_RUNA = {
  'ácido': [[158, 232, 74], [88, 148, 40]],
  frio: [[196, 236, 255], [96, 160, 214]],
  fogo: [[255, 150, 70], [188, 64, 30]],
  'elétrico': [[200, 232, 255], [92, 140, 230]],
  trovejante: [[226, 214, 255], [128, 104, 200]],
};
const runaCache = new Map();

/** A runa: dois anéis em perspectiva, uma estrela de seis pontas e tracinhos entre os anéis. */
function runaSprite(tipo, fase) {
  const chave = `${tipo}|${fase}`;
  if (runaCache.has(chave)) return runaCache.get(chave);
  const [claro, escuro] = COR_RUNA[tipo] ?? COR_RUNA.trovejante;
  const cx = RUNA_W / 2;
  const cy = RUNA_H / 2;
  const A = 28; const B = 14; // raio do anel de fora
  const c = pintar(RUNA_W, RUNA_H, (put) => {
    for (let y = 0; y < RUNA_H; y++) for (let x = 0; x < RUNA_W; x++) {
      const e = ((x - cx + 0.5) / A) ** 2 + ((y - cy + 0.5) / B) ** 2;
      if (e <= 1 && e > 0.8) put(x, y, e > 0.9 ? claro : escuro, 0.95); // anel de fora
      else if (e <= 0.62 && e > 0.5) put(x, y, claro, 0.8); // anel de dentro
      else if (e <= 0.5) put(x, y, escuro, 0.16); // o disco
    }
    // A estrela de seis pontas, girando de quadro em quadro (os pontos andam pelo anel de dentro).
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2 + (fase * Math.PI) / 12;
      pts.push([cx + Math.cos(ang) * A * 0.72, cy + Math.sin(ang) * B * 0.72]);
    }
    for (let i = 0; i < 6; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[(i + 2) % 6];
      linhaPx(put, x0, y0, x1, y1, claro, 0.9);
    }
    // Tracinhos entre os dois anéis, onde estariam as letras da runa.
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2 + (fase % 2 ? 0.1 : 0);
      const r1 = 0.83; const r2 = 0.93;
      linhaPx(put, cx + Math.cos(ang) * A * r1, cy + Math.sin(ang) * B * r1, cx + Math.cos(ang) * A * r2, cy + Math.sin(ang) * B * r2, escuro, 0.9);
    }
    put(cx, cy, [255, 255, 255], 0.95);
  });
  runaCache.set(chave, c);
  return c;
}

function desenharRuna(ctx, board, z, ocupadas) {
  // A runa é invisível para os inimigos de quem a gravou: só o grupo a vê.
  if (z.lado !== 'party') return;
  const v = board.toView(z.centro.x, z.centro.y);
  if (ocupadas.has(`${v.vx},${v.vy}`)) return;
  const { sx, sy } = board.centerF(z.centro.x, z.centro.y);
  const fase = Math.floor(board.time * 3) % 4;
  const bob = Math.round(Math.sin(board.time * 2.2) * 4);
  const pulso = 0.72 + 0.18 * Math.sin(board.time * 3.1);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (!vistaEm.has(z)) vistaEm.set(z, board.time);
  const nasce = Math.min(1, (board.time - vistaEm.get(z)) / 0.5);
  // A sombra da runa no chão, para ela ler como algo que paira.
  ctx.globalAlpha = 0.22 * nasce;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(Math.round(sx), Math.round(sy + 2), 24, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = pulso * nasce;
  ctx.drawImage(runaSprite(z.glifo.tipo, fase), Math.round(sx - RUNA_W / 2), Math.round(sy - RUNA_H / 2 - 10 + bob));
  // Um segundo anel, mais largo, respira por cima da sombra.
  const [, escuroRuna] = COR_RUNA[z.glifo.tipo] ?? COR_RUNA.trovejante;
  ctx.globalAlpha = (0.55 + 0.25 * Math.sin(board.time * 2.6)) * nasce;
  ctx.strokeStyle = `rgb(${escuroRuna.join(',')})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(Math.round(sx), Math.round(sy + 1), 30, 14, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Três faíscas sobem devagar da runa.
  const [claro] = COR_RUNA[z.glifo.tipo] ?? COR_RUNA.trovejante;
  ctx.fillStyle = `rgb(${claro.join(',')})`;
  for (let i = 0; i < 3; i++) {
    const t = (board.time * 0.5 + i / 3) % 1;
    ctx.globalAlpha = (1 - t) * 0.9 * nasce;
    ctx.fillRect(Math.round(sx - 14 + i * 14 + Math.sin(t * 6 + i) * 3), Math.round(sy - 12 - t * 26), 2, 2);
  }
  ctx.restore();
}

/**
 * Os volumes em pé das zonas do lote 11 cuja casa está na diagonal `d`
 * (chamado por `paredesNaDiagonal`, depois das figuras dessa diagonal).
 */
const vistaEm = new WeakMap();
function volumesNaDiagonal(ctx, board, d) {
  const zs = board.enc.zonas;
  let ocupadas = null;
  for (const z of zs) {
    if (z.ilusao) {
      // Imagem de mais de uma casa: pilhas em cada casa, mais altas no miolo; as casas com figura ficam livres.
      const grande = z.casas.size > 1;
      if (grande) ocupadas ??= casasOcupadasNaVista(board);
      for (const k of z.casas) {
        const [x, y] = k.split(',').map(Number);
        const v = board.toView(x, y);
        if (v.vx + v.vy !== d) continue;
        if (grande && ocupadas.has(`${v.vx},${v.vy}`)) continue;
        const atras = grande && ocupadas.has(`${v.vx - 1},${v.vy - 1}`);
        const { sx, sy } = board.centerF(x, y);
        const o = objetoSprite((x + y) % 2, Math.floor(board.time * 5) % 4);
        // Nasce em meio segundo, como as esferas.
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        if (!vistaEm.has(z)) vistaEm.set(z, board.time);
        const base = Math.min(1, (board.time - vistaEm.get(z)) / 0.5) * (0.85 + 0.15 * Math.sin(board.time * Math.PI * 12));
        const miolo = grande && [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy]) => z.casas.has(`${x + dx},${y + dy}`));
        ctx.globalAlpha = grande ? base * 0.8 : base;
        ctx.drawImage(o.canvas, Math.round(sx - o.ox), Math.round(sy - o.oy + 4));
        // O segundo andar do miolo: só a caixa de cima, mais fraca, para o que está atrás aparecer.
        if (miolo && !atras) {
          ctx.globalAlpha = base * 0.5;
          ctx.drawImage(o.canvas, Math.round(sx - o.ox), Math.round(sy - o.oy + 4 - CX_H));
        }
        ctx.restore();
      }
    } else if (z.cordao && z.centro) {
      const v = board.toView(z.centro.x, z.centro.y);
      if (v.vx + v.vy === d) desenharFeixe(ctx, board, z);
    } else if (z.glifo && z.centro) {
      const v = board.toView(z.centro.x, z.centro.y);
      if (v.vx + v.vy === d) {
        ocupadas ??= casasOcupadasNaVista(board);
        desenharRuna(ctx, board, z, ocupadas);
      }
    } else if (z.dificil4) {
      ocupadas ??= casasOcupadasNaVista(board);
      desenharMato(ctx, board, z, d, ocupadas);
    } else if (z.luz && z.centro) {
      const v = board.toView(z.centro.x, z.centro.y);
      if (v.vx + v.vy === d) desenharSol(ctx, board, z);
    }
  }
}

/** As tiras da muralha cuja casa está na diagonal `d` (depois das figuras dela). */
export function paredesNaDiagonal(ctx, board, d) {
  const zs = board.enc.zonas;
  if (!zs?.length) return;
  volumesNaDiagonal(ctx, board, d);
  for (const z of zs) {
    if (!z.barraProjetil) continue;
    const lista = dadosDaParede(board, z).porDiag.get(d);
    if (!lista) continue;
    const { cls } = dadosDaParede(board, z);
    const t = paredeTira(cls, Math.floor(board.time * 6) % 4);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    for (const c of lista) {
      const { sx, sy } = board.centerF(c.x, c.y);
      ctx.drawImage(t.canvas, Math.round(sx - t.ox), Math.round(sy - t.oy));
    }
    ctx.restore();
  }
}

// ---- Névoa Obscurecente: tufos ----------------------------------------------------

const NEVOA_CLARO = [244, 248, 252];
const NEVOA_MIOLO = [214, 222, 230];
const NEVOA_SOMBRA = [168, 180, 194];
const TUFO_W = 48;
const TUFO_H = 40;
// Três jeitos de juntar bolas: círculos [cx, cy, r].
const TUFO_BOLAS = [
  [[15, 26, 11], [31, 25, 12], [23, 16, 11], [39, 29, 8]],
  [[12, 27, 9], [24, 22, 13], [36, 26, 10], [28, 12, 8]],
  [[18, 27, 12], [34, 27, 10], [20, 15, 9], [31, 17, 9]],
];
const tufoCache = [];
function tufo(v) {
  if (tufoCache[v]) return tufoCache[v];
  const bolas = TUFO_BOLAS[v];
  const c = pintar(TUFO_W, TUFO_H, (put) => {
    const dentro = (x, y) => bolas.some(([cx, cy, r]) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r);
    for (let y = 0; y < TUFO_H; y++) {
      for (let x = 0; x < TUFO_W; x++) {
        if (!dentro(x, y)) continue;
        // A luz vem de cima e da esquerda; o fundo e a direita ficam na sombra.
        const luz = (TUFO_H - y) * 1.1 + (TUFO_W - x) * 0.55;
        // Três tons chapados, sem degradê (o dithering em xadrez virava listra).
        const xad = 0;
        const t = luz + xad;
        put(x, y, t > 52 ? NEVOA_CLARO : t > 34 ? NEVOA_MIOLO : NEVOA_SOMBRA);
      }
    }
  });
  tufoCache[v] = c;
  return c;
}

const nevoaCache = new Map();
function dadosDaNevoa(board, z) {
  const chave = `${z.id}|${board.rot}|${z.casas.size}`;
  let d = nevoaCache.get(chave);
  if (d) return d;
  if (nevoaCache.size > 8) nevoaCache.clear();
  d = [];
  for (const k of z.casas) {
    const [x, y] = k.split(',').map(Number);
    const borda = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !z.casas.has(`${x + dx},${y + dy}`));
    // O miolo só em xadrez: o monte não vira parede opaca.
    if (!borda && (x + y) % 2 !== 0) continue;
    const v = board.toView(x, y);
    const h = hash(x, y, 7);
    d.push({ x, y, borda, d: v.vx + v.vy, v: h % 3, ox: (h >> 3) % 15 - 7, oy: (h >> 8) % 7 - 3 });
  }
  d.sort((p, q) => p.d - q.d || p.x - q.x);
  nevoaCache.set(chave, d);
  return d;
}

/** A nuvem de tufos (por cima da máscara, dentro do recorte das figuras). */
function desenharNevoa(ctx, board, z) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  for (const t of dadosDaNevoa(board, z)) {
    const { sx, sy } = board.centerF(t.x, t.y);
    // Respira devagar, defasada de casa em casa.
    const bal = Math.round(Math.sin(board.time * 1.4 + (t.x + t.y) * 0.7) * 2);
    ctx.globalAlpha = t.borda ? 0.92 : 0.5;
    ctx.drawImage(tufo(t.v), Math.round(sx - TUFO_W / 2 + t.ox), Math.round(sy + 8 - TUFO_H + t.oy + bal));
  }
  ctx.restore();
}

// ---- Fome de Hadar: tentáculos e cristais -------------------------------------------

const TENT_W = 26;
const TENT_H = 72;
const tentCache = [];
function tentaculo(frame) {
  if (tentCache[frame]) return tentCache[frame];
  const c = pintar(TENT_W, TENT_H, (put) => {
    const fase = frame * ((Math.PI * 2) / 3);
    for (let y = TENT_H - 1; y >= 0; y--) {
      const t = 1 - y / (TENT_H - 1); // 0 na base, 1 na ponta
      const cx = 13 + Math.sin(t * 5.2 + fase) * (3 + t * 6);
      const meia = Math.max(0.8, 5.6 * (1 - t) + 0.6);
      const x0 = Math.round(cx - meia);
      const x1 = Math.round(cx + meia);
      for (let x = x0; x <= x1; x++) {
        const borda = x <= x0 + 1 ? [150, 110, 220] : x === x1 ? [40, 22, 70] : [66, 38, 112];
        put(x, y, borda);
      }
      // Ventosas: um pontinho roxo a cada 6 linhas, no lado claro.
      if (y % 6 === 2 && x1 - x0 >= 3) put(x0 + 1, y, [130, 96, 196]);
    }
    put(Math.round(13 + Math.sin(5.2 + fase) * 9), 0, [159, 224, 255]); // a ponta gelada
  });
  tentCache[frame] = c;
  return c;
}

const CRISTAL_W = 12;
const CRISTAL_H = 24;
let cristalCache = null;
function cristal() {
  if (cristalCache) return cristalCache;
  cristalCache = pintar(CRISTAL_W, CRISTAL_H, (put) => {
    const pts = [[6, 0], [10, 5], [10, 20], [6, 23], [2, 20], [2, 5]];
    // Preenche o hexágono por varredura.
    for (let y = 0; y < CRISTAL_H; y++) {
      for (let x = 0; x < CRISTAL_W; x++) {
        let dentro = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const [xi, yi] = pts[i];
          const [xj, yj] = pts[j];
          if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dentro = !dentro;
        }
        if (!dentro) continue;
        put(x, y, x <= 4 ? [220, 245, 255] : x >= 8 ? [92, 150, 204] : [159, 224, 255]);
      }
    }
    put(5, 1, [255, 255, 255]);
    put(4, 6, [255, 255, 255]);
  });
  return cristalCache;
}

const hadarCache = new Map();
/** Os tentáculos (casas da borda, de 3 em 3) e os cristais (5, sobre a elipse). */
function dadosDeHadar(board, z, esf) {
  const chave = `${z.id}|${board.rot}|${z.casas.size}`;
  let d = hadarCache.get(chave);
  if (d) return d;
  if (hadarCache.size > 6) hadarCache.clear();
  const cs = [...z.casas].map((k) => k.split(',').map(Number));
  const dentro = (x, y) => (board.enc.field?.inside ? board.enc.field.inside(x, y) : true);
  const bordas = cs
    .filter(([x, y]) => dentro(x, y) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !z.casas.has(`${x + dx},${y + dy}`)))
    .map(([x, y]) => ({ x, y, a: Math.atan2(y - esf.y, x - esf.x) }))
    .sort((p, q) => p.a - q.a);
  const tentaculos = bordas.filter((_, i) => i % 2 === 0).slice(0, 8);
  // Os cristais ficam em casas de borda da zona (dentro do mapa): espaçados
  // pelo anel, deslocados por zona.
  const desl = hash(z.id ?? 1, 3, 5) % Math.max(1, bordas.length);
  const pega = (n, off) => (bordas.length ? Array.from({ length: Math.min(n, bordas.length) }, (_, i) => bordas[(desl + off + Math.floor((i * bordas.length) / n)) % bordas.length]) : []);
  const cristais = pega(5, 0);
  const halo = pega(12, 1).filter((h) => !cristais.includes(h));
  d = { tentaculos, cristais, halo };
  hadarCache.set(chave, d);
  return d;
}

// ---- Esferas escuras ------------------------------------------------------------------

/**
 * Escuridão e Fome de Hadar: a esfera escura de `fx.js` (casca forte, miolo
 * fraco) por cima da máscara. Ordem: costas, o que está dentro, frente.
 */
function desenharEsferaEscura(ctx, board, z) {
  const cor = z.spellId === 'fomeDeHadar' ? 'vazio' : 'breu';
  const o = board.fx.domoDaZona(board, z, cor);
  board.fx.desenharDomo(ctx, board, o, 'tras');
  if (z.spellId === 'fomeDeHadar') {
    const { sx, sy } = board.centerF(o.x, o.y);
    const h = dadosDeHadar(board, z, o);
    const cris = (costas) => {
      for (const [t, k] of [...h.halo.map((t) => [t, 1]), ...h.cristais.map((t) => [t, 2])]) {
        const c = board.centerF(t.x, t.y);
        if ((c.sy < sy) !== costas) continue;
        const px = Math.round(c.sx - (CRISTAL_W * k) / 2);
        const py = Math.round(c.sy - CRISTAL_H * k + 4);
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(cristal(), px, py, CRISTAL_W * k, CRISTAL_H * k);
        ctx.restore();
      }
    };
    cris(true);
    const quadro = Math.floor(board.time * 5) % 3;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    h.tentaculos.forEach((t, i) => {
      const c = board.centerF(t.x, t.y);
      ctx.drawImage(tentaculo((quadro + i) % 3), Math.round(c.sx - TENT_W / 2), Math.round(c.sy + 6 - TENT_H));
    });
    ctx.restore();
    board.fx.desenharDomo(ctx, board, o, 'frente');
    cris(false);
  } else {
    board.fx.desenharDomo(ctx, board, o, 'frente');
  }
}

/**
 * O volume das zonas que escondem, por cima da máscara. Chamado por
 * `board.zonasObscurasPorCima` dentro do recorte das figuras à vista.
 */
export function desenharVolumeObscuro(ctx, board, z) {
  if (z.obscuro === 'pesada') desenharNevoa(ctx, board, z);
  else desenharEsferaEscura(ctx, board, z);
}
