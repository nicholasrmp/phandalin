// Monta a folha de sprites em runtime e põe o contorno automático.
// Cache por look: a folha é construída uma vez e reusada por todos os
// combatentes do mesmo tipo, entre encontros.

import { paint, DIRECTIONS } from './draw.js';
import { resolveLook } from './looks.js';

export const CELL_W = 52;
export const CELL_H = 80;
export const OUTLINE = [13, 11, 17];

export const ANIMS = [
  { name: 'idle', frames: 2, hold: [40, 40], pose: (i) => ({ kind: 'idle', frame: i }) },
  { name: 'attack', frames: 2, hold: [8, 14], pose: (i) => ({ kind: 'attack', frame: i }) },
  { name: 'hurt', frames: 1, hold: [18], pose: () => ({ kind: 'hurt', frame: 0 }) },
  { name: 'down', frames: 1, hold: [60], pose: () => ({ kind: 'down', frame: 0 }) },
];

const cache = new Map();

export function getSheet(lookKey) {
  let sheet = cache.get(lookKey);
  if (!sheet) {
    sheet = buildSheet(lookKey);
    cache.set(lookKey, sheet);
  }
  return sheet;
}

export function buildSheet(lookKey) {
  const look = resolveLook(lookKey);
  const maxFrames = ANIMS.reduce((m, a) => Math.max(m, a.frames), 0);
  const width = CELL_W * maxFrames;
  const height = CELL_H * DIRECTIONS.length * ANIMS.length;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  const anims = {};
  ANIMS.forEach((anim, block) => {
    const blockY = block * DIRECTIONS.length * CELL_H;
    anims[anim.name] = {
      y: blockY, fw: CELL_W, fh: CELL_H, frames: anim.frames,
      hold: anim.hold, total: anim.hold.reduce((a, b) => a + b, 0),
    };
    DIRECTIONS.forEach((dir, row) => {
      for (let f = 0; f < anim.frames; f++) {
        paint(ctx, f * CELL_W, blockY + row * CELL_H, CELL_W, CELL_H, look, dir, anim.pose(f));
      }
    });
  });

  outline(ctx, width, height);
  return { key: lookKey, image: canvas, w: width, h: height, anims };
}

function outline(ctx, width, height) {
  const img = ctx.getImageData(0, 0, width, height);
  const src = new Uint8ClampedArray(img.data);
  const dst = img.data;
  const opaque = (x, y) => x >= 0 && y >= 0 && x < width && y < height && src[(y * width + x) * 4 + 3] > 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (src[i + 3] > 0) continue;
      if (!(opaque(x - 1, y) || opaque(x + 1, y) || opaque(x, y - 1) || opaque(x, y + 1))) continue;
      dst[i] = OUTLINE[0]; dst[i + 1] = OUTLINE[1]; dst[i + 2] = OUTLINE[2]; dst[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

/** Retrato estático para as fichas da UI. */
const caixas = new Map();

/** Onde a figura começa e termina dentro da célula, no quadro parado. */
function caixaDo(lookKey) {
  const pronta = caixas.get(lookKey);
  if (pronta) return pronta;
  const sheet = getSheet(lookKey);
  const ctx = sheet.image.getContext('2d', { willReadFrequently: true });
  const d = ctx.getImageData(0, sheet.anims.idle.y, CELL_W, CELL_H).data;
  let x0 = CELL_W; let y0 = CELL_H; let x1 = -1; let y1 = -1;
  for (let y = 0; y < CELL_H; y++) {
    for (let x = 0; x < CELL_W; x++) {
      if (d[(y * CELL_W + x) * 4 + 3] === 0) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  const caixa = x1 < 0
    ? { x0: 0, y0: 0, x1: CELL_W - 1, y1: CELL_H - 1, cx: CELL_W / 2 }
    : { x0, y0, x1, y1, cx: (x0 + x1) / 2 };
  caixas.set(lookKey, caixa);
  return caixa;
}

/**
 * Retrato quadrado, mirando na CABEÇA.
 *
 * Antes isto devolvia a célula inteira de 52x80 e o corte ficava a cargo de um
 * `margin-top` fixo no CSS. Não funciona: a célula tem o chão na base, e a
 * cabeça de um goblin de 41 px fica trinta pixels abaixo da de um bugbear de
 * 73 px. Com um corte só, metade do elenco aparecia decapitado.
 *
 * Aqui a caixa real da figura é medida do alfa e a janela desce a partir do
 * alto dela. Sem reescalar: o pixel continua pixel, e uma criatura pequena
 * aparecer menor dentro do quadro é informação, não defeito.
 */
export function makePortrait(lookKey, lado = 40) {
  const sheet = getSheet(lookKey);
  const b = caixaDo(lookKey);
  const w = Math.min(lado, CELL_W);
  const h = Math.min(lado, CELL_H);
  const sx = Math.max(0, Math.min(Math.round(b.cx - w / 2), CELL_W - w));
  const sy = Math.max(0, Math.min(b.y0 - 1, CELL_H - h));

  const canvas = document.createElement('canvas');
  canvas.width = lado;
  canvas.height = lado;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    sheet.image,
    sx, sheet.anims.idle.y + sy, w, h,
    Math.floor((lado - w) / 2), Math.floor((lado - h) / 2), w, h,
  );
  return canvas;
}

export function frameAt(anim, t, loop = true) {
  let k = Math.floor(t * 60);
  k = loop ? ((k % anim.total) + anim.total) % anim.total : Math.min(k, anim.total - 1);
  for (let i = 0; i < anim.hold.length; i++) {
    if (k < anim.hold[i]) return i;
    k -= anim.hold[i];
  }
  return anim.hold.length - 1;
}

/**
 * Desenha um combatente no canvas do tabuleiro.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} sheet
 * @param {string} animName
 * @param {number} frame
 * @param {boolean} flip espelha horizontalmente (direção "side" ao contrário)
 * @param {number} row 0 = front, 1 = side
 */
export function drawSprite(ctx, sheet, animName, frame, { x, y, scale = 1, flip = false, row = 0, alpha = 1, tint = null }) {
  const anim = sheet.anims[animName] ?? sheet.anims.idle;
  const sx = Math.min(frame, anim.frames - 1) * anim.fw;
  const sy = anim.y + row * anim.fh;
  const w = anim.fw * scale;
  const h = anim.fh * scale;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.imageSmoothingEnabled = false;
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(sheet.image, sx, sy, anim.fw, anim.fh, -w / 2, -h, w, h);
  if (tint) {
    ctx.globalCompositeOperation = 'source-atop';
    ctx.globalAlpha = alpha * tint.strength;
    ctx.fillStyle = tint.color;
    ctx.fillRect(-w / 2, -h, w, h);
  }
  ctx.restore();
}
