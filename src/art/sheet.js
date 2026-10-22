// Monta a folha de sprites em runtime e põe o contorno automático.
// Cache por look: a folha é construída uma vez e reusada por todos os
// combatentes do mesmo tipo, entre encontros.

import { paint, DIRECTIONS } from './draw.js';
import { resolveLook } from './looks.js';

export const CELL_W = 32;
export const CELL_H = 40;
export const OUTLINE = [22, 18, 28];

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
export function makePortrait(lookKey, scale = 2) {
  const sheet = getSheet(lookKey);
  const canvas = document.createElement('canvas');
  canvas.width = CELL_W * scale;
  canvas.height = CELL_H * scale;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sheet.image, 0, sheet.anims.idle.y, CELL_W, CELL_H, 0, 0, canvas.width, canvas.height);
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
