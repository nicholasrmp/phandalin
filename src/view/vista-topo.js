// A VISTA DE CIMA do tabuleiro, em canvas 2D. É o mesmo mapa do jogo (`terreno`, `paredes`, `objetos`) visto de
// cima, numa grade de quadrados de `C` pixels. Serve a duas páginas:
//
//   `/topo.html`  — o protótipo que compara a visão de cima com o isométrico;
//   `/editor.html` — a vista em que se ENQUADRA um mapa pintado e se desenha parede e porta em cima dele, como no
//                    Roll20 e no Foundry. O isométrico não serve para isso: mapa pintado é visto de cima.
//
// Nada aqui sabe de mouse nem de painel: recebe o campo (`Battlefield`), o mapa e o contexto, e pinta.

import { ARESTA } from '../core/grid.js';
import { SUPERFICIE } from './board.js';
import { sorteio } from '../art/chao.js';

const COR_PADRAO = ['#3a3630', '#36322c'];
const corDoChao = (sup) => SUPERFICIE[sup]?.topo ?? COR_PADRAO;

/** Quantos pixels da imagem de fundo valem um pixel da tela, no zoom atual. */
export const escalaDoFundo = (fundo, C) => C / (fundo?.escala || 1);

/**
 * A imagem de fundo deitada na grade: `fundo.escala` pixels da imagem por casa, `fundo.x0/y0` dizendo onde cai,
 * em pixels da imagem (já girada), o canto da casa (0,0), e `fundo.giro` em graus (0, 90, 180 ou 270).
 */
export function pintarFundo(ctx, img, fundo, C) {
  if (!img?.naturalWidth || !fundo) return false;
  const k = escalaDoFundo(fundo, C);
  const iw = img.naturalWidth * k;
  const ih = img.naturalHeight * k;
  ctx.save();
  ctx.globalAlpha = fundo.opacidade ?? 1;
  ctx.imageSmoothingEnabled = true;
  ctx.translate(-fundo.x0 * k, -fundo.y0 * k);
  ctx.rotate(((fundo.giro ?? 0) * Math.PI) / 180);
  const canto = { 0: [0, 0], 90: [0, -ih], 180: [-iw, -ih], 270: [-iw, 0] }[fundo.giro ?? 0] ?? [0, 0];
  ctx.drawImage(img, canto[0], canto[1], iw, ih);
  ctx.restore();
  return true;
}

/** O chão: a cor que o jogo já usa para cada superfície, variada por casa para não virar um lençol liso. */
export function pintarChao(ctx, field, C) {
  for (let y = 0; y < field.h; y++) {
    for (let x = 0; x < field.w; x++) {
      const cores = corDoChao(field.surfaceAt(x, y));
      ctx.fillStyle = cores[sorteio(x, y, cores.length)];
      ctx.fillRect(x * C, y * C, C, C);
      // pedra maciça (parede de casa inteira, rocha): escurece e põe um chanfro, que é o que dá relevo visto de cima
      if (field.tileAt(x, y) === 1) {
        ctx.fillStyle = 'rgba(0,0,0,.45)';
        ctx.fillRect(x * C, y * C, C, C);
        ctx.strokeStyle = 'rgba(255,255,255,.07)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x * C + 2, y * C + 2, C - 4, C - 4);
      }
    }
  }
}

export function pintarGrade(ctx, field, C, cor = 'rgba(0,0,0,.28)') {
  ctx.strokeStyle = cor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= field.w; x++) { ctx.moveTo(x * C + 0.5, 0); ctx.lineTo(x * C + 0.5, field.h * C); }
  for (let y = 0; y <= field.h; y++) { ctx.moveTo(0, y * C + 0.5); ctx.lineTo(field.w * C, y * C + 0.5); }
  ctx.stroke();
}

const COR_DA_ARESTA = {
  [ARESTA.parede]: '#9ad7ff', [ARESTA.porta]: '#ffb347', [ARESTA.aberta]: '#7bd88f', [ARESTA.seteira]: '#c49cff',
};

/** Uma aresta. `aMostra` desenha como o editor do Foundry: linha fina e colorida, para ver o mapa pintado por baixo. */
export function traco(ctx, x0, y0, x1, y1, codigo, C, aMostra) {
  if (!codigo) return;
  if (aMostra) {
    const cor = COR_DA_ARESTA[codigo] ?? '#fff';
    ctx.strokeStyle = cor; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.fillStyle = cor;
    for (const [px, py] of [[x0, y0], [x1, y1]]) { ctx.beginPath(); ctx.arc(px, py, 3.5, 0, 7); ctx.fill(); }
    return;
  }
  if (codigo === ARESTA.parede || codigo === ARESTA.seteira) {
    ctx.strokeStyle = '#17141a'; ctx.lineWidth = Math.max(5, C * 0.1);
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.strokeStyle = 'rgba(190,180,165,.35)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    if (codigo === ARESTA.seteira) {   // a fresta: um corte claro no meio da parede
      const mx = (x0 + x1) / 2; const my = (y0 + y1) / 2;
      ctx.strokeStyle = '#c9d6e4'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(mx - (y1 - y0) * 0.14, my - (x1 - x0) * 0.14);
      ctx.lineTo(mx + (y1 - y0) * 0.14, my + (x1 - x0) * 0.14);
      ctx.stroke();
    }
    return;
  }
  // porta: a madeira no vão, clara quando aberta
  const aberta = codigo === ARESTA.aberta;
  ctx.strokeStyle = '#17141a'; ctx.lineWidth = Math.max(5, C * 0.1);
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.strokeStyle = aberta ? '#6f5a3a' : '#9a6b35'; ctx.lineWidth = Math.max(3, C * 0.07);
  const t = aberta ? 0.3 : 0.86;   // aberta: só os batentes
  const mx = (x0 + x1) / 2; const my = (y0 + y1) / 2;
  ctx.beginPath();
  ctx.moveTo(mx - (x1 - x0) * t / 2, my - (y1 - y0) * t / 2);
  ctx.lineTo(mx + (x1 - x0) * t / 2, my + (y1 - y0) * t / 2);
  ctx.stroke();
}

export function pintarArestas(ctx, field, C, aMostra = false) {
  ctx.save();
  ctx.lineCap = 'round';
  for (let y = 0; y < field.h; y++) {
    for (let x = 0; x < field.w; x++) {
      const i = y * field.w + x;
      traco(ctx, x * C, y * C, (x + 1) * C, y * C, field.paredeN[i], C, aMostra);     // a de cima
      traco(ctx, x * C, y * C, x * C, (y + 1) * C, field.paredeO[i], C, aMostra);     // a da esquerda
    }
  }
  ctx.restore();
}

/**
 * A PAREDE LIVRE, desenhada como foi traçada: polilinhas em casas (com fração), e não degraus da grade.
 *
 * É a diferença entre parecer uma caverna e parecer uma escada de quadrados. Pedra, caverna e destroço são
 * irregulares, e forçá-los na aresta de casa destrói justamente o que os faz parecer o que são. A aresta de casa
 * continua existindo (`paredes`), mas como DERIVADA, para a regra de movimento; quem manda no desenho é o traço.
 */
export function pintarTracos(ctx, tracos, C, aMostra = false) {
  if (!tracos?.length) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const pts of tracos) {
    if (!pts || pts.length < 2) continue;
    ctx.beginPath();
    ctx.moveTo(pts[0][0] * C, pts[0][1] * C);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0] * C, pts[i][1] * C);
    if (aMostra) {
      // sobre um mapa pintado a parede já está desenhada: basta a linha fina, como na camada do editor do Foundry
      ctx.strokeStyle = '#9ad7ff'; ctx.lineWidth = 2.5; ctx.stroke();
      continue;
    }
    ctx.strokeStyle = '#17141a'; ctx.lineWidth = Math.max(5, C * 0.11); ctx.stroke();
    ctx.strokeStyle = 'rgba(190,180,165,.32)'; ctx.lineWidth = 1.5; ctx.stroke();
  }
  ctx.restore();
}

/** Os móveis: o sprite ISOMÉTRICO centrado na casa. É provisório — arte de cima não existe no projeto. */
export function pintarMoveis(ctx, mapa, C, atlas, imgAtlas) {
  if (!imgAtlas?.complete || !imgAtlas.naturalWidth) return;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = 0.95;
  for (const o of mapa.objetos ?? []) {
    if (o.tipo !== 'prop' || o.variante === 'taverna-nada') continue;
    const f = atlas[`prop-${o.variante}`]?.todas?.[0];
    if (!f) continue;
    const k = Math.min((C * 0.92) / f.w, (C * 0.92) / f.h);
    const w = f.w * k; const h = f.h * k;
    ctx.drawImage(imgAtlas, f.x, f.y, f.w, f.h, o.x * C + (C - w) / 2, o.y * C + (C - h) / 2, w, h);
  }
  ctx.restore();
}

// ------------------------------------------------------------------------------------------------- pontaria ---

/** A casa sob o ponto (em pixels da tela), ou null fora do mapa. */
export function casaNoPonto(field, C, px, py) {
  const x = Math.floor(px / C);
  const y = Math.floor(py / C);
  return x >= 0 && y >= 0 && x < field.w && y < field.h ? { x, y } : null;
}

/**
 * A aresta mais perto do ponto, entre as quatro da casa apontada. Devolve `{ x, y, lado }` no mesmo formato do
 * editor: 'N' é a borda de cima da casa (x,y) e 'O' a da esquerda.
 */
export function arestaNoPonto(w, h, C, px, py) {
  const cx = px / C; const cy = py / C;
  const x = Math.floor(cx); const y = Math.floor(cy);
  if (x < 0 || y < 0 || x >= w || y >= h) return null;
  const fx = cx - x; const fy = cy - y;
  const perto = [
    { x, y, lado: 'N', d: fy },
    { x, y: y + 1, lado: 'N', d: 1 - fy },
    { x, y, lado: 'O', d: fx },
    { x: x + 1, y, lado: 'O', d: 1 - fx },
  ].filter((a) => a.x < w && a.y < h && !(a.lado === 'N' && a.y === 0) && !(a.lado === 'O' && a.x === 0));
  perto.sort((a, b) => a.d - b.d);
  return perto[0] ?? null;
}
