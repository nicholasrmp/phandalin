// Tabuleiro isométrico em Canvas 2D, com câmera que gira.
//
// PROJEÇÃO
//   sx = ox + (vx - vy) · TW/2
//   sy = oy + (vx + vy) · TH/2 - altura · LIFT
//   O losango tem vértices em (sx, sy), (sx+TW/2, sy+TH/2), (sx, sy+TH) e
//   (sx-TW/2, sy+TH/2); o centro fica em (sx, sy+TH/2).
//
// ROTAÇÃO
//   A grade do jogo NUNCA gira — girar o mundo quebraria as regras. O que gira
//   é a leitura dela: `toView` manda (x, y) do mundo para a coordenada que a
//   câmera usa, e `fromView` desfaz. Quatro orientações, de 90 em 90 graus.
//
//     r=0  (x, y)              r=2  (W-1-x, H-1-y)
//     r=1  (H-1-y, x)          r=3  (y, W-1-x)
//
//   Um vetor de direção gira junto: (dx,dy) → (-dy,dx) a cada passo.
//
// PROJEÇÃO INVERSA (clique → quadrado)
//   A partir do centro do losango:  vx = cx/TW + cy/TH,  vy = cy/TH - cx/TW.
//   Arredondar dá o losango que contém o ponto. Como a altura desloca o
//   losango para cima, os platôs são testados do mais alto para o mais baixo.

import { getSheet, drawSprite, frameAt } from '../art/sheet.js';
import { hasCondition, CONDITIONS } from '../rules/conditions.js';
import { Fx } from './fx.js';

export const TW = 64;
export const TH = 32;
export const LIFT = 22;
const PAD = 30;

const TOP_COLORS = {
  0: ['#4d6440', '#44583a'],
  1: ['#6a6276', '#5c5468'],
  2: ['#4a5a35', '#42512f'],
  3: ['#5e5040', '#544738'],
};

const SIDE_LEFT = '#22301c';
const SIDE_RIGHT = '#3b4e30';
const WALL_LEFT = '#332e42';
const WALL_RIGHT = '#564e6b';

const vkey = (vx, vy) => `${vx},${vy}`;

export class Board {
  constructor(canvas, { encounter, onTileClick, onTileHover }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.enc = encounter;
    this.field = encounter.field;
    this.onTileClick = onTileClick;
    this.onTileHover = onTileHover;

    this.overlay = { reachable: null, path: null, targets: null, selected: null };
    this.hover = null;
    this.floaters = [];
    this.shake = 0;
    this.time = 0;
    this.rot = 0;
    this.fx = new Fx();
    this.displayHp = new Map();

    this.maxHeight = 0;
    for (let i = 0; i < this.field.heights.length; i++) {
      this.maxHeight = Math.max(this.maxHeight, this.field.heights[i]);
    }

    const { w, h } = this.field;
    const span = w + h;
    const wide = Math.max(w, h);
    // Dimensionado para o pior caso, para não redimensionar ao girar.
    canvas.width = span * (TW / 2) + PAD * 2;
    canvas.height = span * (TH / 2) + this.maxHeight * LIFT + PAD * 2 + 40;
    this.ox = PAD + (wide - 1) * (TW / 2) + (span - 2 * wide + 2) * (TW / 4);
    this.oy = PAD + this.maxHeight * LIFT;

    this.rebuildOrder();

    canvas.addEventListener('mousemove', (e) => {
      const t = this.tileFromEvent(e);
      const changed = !this.hover || !t || this.hover.x !== t.x || this.hover.y !== t.y;
      this.hover = t;
      if (changed) this.onTileHover?.(t);
    });
    canvas.addEventListener('mouseleave', () => { this.hover = null; this.onTileHover?.(null); });
    canvas.addEventListener('click', (e) => {
      const t = this.tileFromEvent(e);
      if (t) this.onTileClick?.(t);
    });
  }

  get tileHalf() {
    return TH / 2;
  }

  // ---- rotação -------------------------------------------------------------

  setRotation(r) {
    this.rot = ((r % 4) + 4) % 4;
    this.rebuildOrder();
    this.hover = null;
  }

  rotate(delta) {
    this.setRotation(this.rot + delta);
    return this.rot;
  }

  toView(x, y) {
    const { w, h } = this.field;
    switch (this.rot) {
      case 1: return { vx: h - 1 - y, vy: x };
      case 2: return { vx: w - 1 - x, vy: h - 1 - y };
      case 3: return { vx: y, vy: w - 1 - x };
      default: return { vx: x, vy: y };
    }
  }

  fromView(vx, vy) {
    const { w, h } = this.field;
    switch (this.rot) {
      case 1: return { x: vy, y: h - 1 - vx };
      case 2: return { x: w - 1 - vx, y: h - 1 - vy };
      case 3: return { x: w - 1 - vy, y: vx };
      default: return { x: vx, y: vy };
    }
  }

  /** Gira um vetor de direção do mundo para a tela. */
  rotateVec(dx, dy) {
    switch (this.rot) {
      case 1: return { dx: -dy, dy: dx };
      case 2: return { dx: -dx, dy: -dy };
      case 3: return { dx: dy, dy: -dx };
      default: return { dx, dy };
    }
  }

  /** Ordem de desenho: diagonais crescentes no espaço da câmera. */
  rebuildOrder() {
    const list = [];
    for (let y = 0; y < this.field.h; y++) {
      for (let x = 0; x < this.field.w; x++) {
        const { vx, vy } = this.toView(x, y);
        list.push({ x, y, vx, vy, d: vx + vy });
      }
    }
    list.sort((a, b) => a.d - b.d || a.vx - b.vx);
    this.order = list;
  }

  // ---- projeção ------------------------------------------------------------

  iso(x, y, height = null) {
    const hgt = height ?? this.field.heightAt(x, y);
    const { vx, vy } = this.toView(x, y);
    return {
      sx: this.ox + (vx - vy) * (TW / 2),
      sy: this.oy + (vx + vy) * (TH / 2) - hgt * LIFT,
    };
  }

  center(x, y) {
    const { sx, sy } = this.iso(x, y);
    return { sx, sy: sy + TH / 2 };
  }

  /** Centro para coordenadas contínuas — projéteis viajam entre quadrados. */
  centerF(fx, fy) {
    const hgt = this.field.heightAt(Math.round(fx), Math.round(fy));
    const { vx, vy } = this.toView(fx, fy);
    return {
      sx: this.ox + (vx - vy) * (TW / 2),
      sy: this.oy + (vx + vy) * (TH / 2) - hgt * LIFT + TH / 2,
    };
  }

  tileFromEvent(e) {
    const r = this.canvas.getBoundingClientRect();
    const px = (e.clientX - r.left) * (this.canvas.width / r.width);
    const py = (e.clientY - r.top) * (this.canvas.height / r.height);
    for (let hgt = this.maxHeight; hgt >= 0; hgt--) {
      const cx = px - this.ox;
      const cy = py - this.oy - TH / 2 + hgt * LIFT;
      const vx = Math.round(cx / TW + cy / TH);
      const vy = Math.round(cy / TH - cx / TW);
      const { x, y } = this.fromView(vx, vy);
      if (this.field.inside(x, y) && this.field.heightAt(x, y) === hgt) return { x, y };
    }
    return null;
  }

  setOverlay(patch) {
    Object.assign(this.overlay, patch);
  }

  floatText(pos, text, color, big = false) {
    this.floaters.push({ x: pos.x, y: pos.y, text, color, big, t: 0 });
  }

  bump(strength = 0.35) {
    this.shake = Math.max(this.shake, strength);
  }

  // ---- primitivas ----------------------------------------------------------

  diamond(ctx, sx, sy) {
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + TW / 2, sy + TH / 2);
    ctx.lineTo(sx, sy + TH);
    ctx.lineTo(sx - TW / 2, sy + TH / 2);
    ctx.closePath();
  }

  drawTile(ctx, x, y, alpha = 1) {
    const kind = this.field.tileAt(x, y);
    const hgt = this.field.heightAt(x, y);
    const { sx, sy } = this.iso(x, y, hgt);
    const wall = kind === 1;
    const lift = wall ? LIFT * 1.6 : hgt * LIFT;

    ctx.save();
    ctx.globalAlpha = alpha;

    if (lift > 0) {
      ctx.fillStyle = wall ? WALL_LEFT : SIDE_LEFT;
      ctx.beginPath();
      ctx.moveTo(sx - TW / 2, sy + TH / 2);
      ctx.lineTo(sx, sy + TH);
      ctx.lineTo(sx, sy + TH + lift);
      ctx.lineTo(sx - TW / 2, sy + TH / 2 + lift);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = wall ? WALL_RIGHT : SIDE_RIGHT;
      ctx.beginPath();
      ctx.moveTo(sx + TW / 2, sy + TH / 2);
      ctx.lineTo(sx, sy + TH);
      ctx.lineTo(sx, sy + TH + lift);
      ctx.lineTo(sx + TW / 2, sy + TH / 2 + lift);
      ctx.closePath();
      ctx.fill();
    }

    const pair = TOP_COLORS[kind] ?? TOP_COLORS[0];
    this.diamond(ctx, sx, sy);
    ctx.fillStyle = (x + y) % 2 ? pair[0] : pair[1];
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.22)';
    ctx.stroke();

    if (kind === 2) {
      ctx.strokeStyle = 'rgba(170,215,120,.5)';
      for (let i = 0; i < 5; i++) {
        const bx = sx - 16 + i * 8;
        const by = sy + TH / 2 + ((i % 2) ? 4 : -2);
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + 2, by - 9);
        ctx.stroke();
      }
    }
    if (kind === 3) {
      ctx.fillStyle = '#7a6342';
      ctx.fillRect(sx - 13, sy + TH / 2 - 20, 26, 22);
      ctx.fillStyle = '#5a4830';
      ctx.fillRect(sx - 13, sy + TH / 2 - 2, 26, 4);
      ctx.fillStyle = '#8c7450';
      ctx.fillRect(sx - 13, sy + TH / 2 - 20, 26, 3);
    }
    ctx.restore();
  }

  fillDiamond(ctx, x, y, fill, stroke = null) {
    const { sx, sy } = this.iso(x, y);
    this.diamond(ctx, sx, sy);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  }

  // ---- render --------------------------------------------------------------

  render(dt) {
    this.time += dt;
    this.fx.update(dt);
    const ctx = this.ctx;

    ctx.save();
    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt * 2);
      const k = this.shake * this.shake * 16;
      ctx.translate((Math.random() - 0.5) * k, (Math.random() - 0.5) * k);
    }

    const sky = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    sky.addColorStop(0, '#231d33');
    sky.addColorStop(1, '#13111b');
    ctx.fillStyle = sky;
    ctx.fillRect(-60, -60, this.canvas.width + 120, this.canvas.height + 120);

    // Ocupantes indexados por coordenada de câmera, para a checagem de oclusão.
    const byView = new Map();
    const byTile = new Map();
    for (const c of this.enc.combatants) {
      if (c.dead && c.kind === 'npc') continue;
      const v = this.toView(c.pos.x, c.pos.y);
      byView.set(vkey(v.vx, v.vy), c);
      byTile.set(`${c.pos.x},${c.pos.y}`, c);
    }

    const reach = this.overlay.reachable;
    const targetSet = new Set((this.overlay.targets ?? []).map((t) => `${t.pos.x},${t.pos.y}`));
    const pathSet = new Set((this.overlay.path ?? []).map((p) => `${p.x},${p.y}`));

    this.fx.drawGround(ctx, this);

    let lastD = -1;
    for (const cell of this.order) {
      // Ao mudar de diagonal, desenha quem estava na anterior.
      if (cell.d !== lastD && lastD >= 0) this.drawOccupantsOnDiagonal(ctx, byView, lastD);
      lastD = cell.d;

      const { x, y, vx, vy } = cell;
      let alpha = 1;
      const kind = this.field.tileAt(x, y);
      const tall = kind === 1 || this.field.heightAt(x, y) > 0;
      if (tall) {
        for (const [ox, oy] of [[-1, 0], [0, -1], [-1, -1], [-2, 0], [0, -2], [-1, -2], [-2, -1]]) {
          const behind = byView.get(vkey(vx + ox, vy + oy));
          if (behind && this.field.heightAt(x, y) >= this.field.heightAt(behind.pos.x, behind.pos.y)) {
            alpha = 0.42;
            break;
          }
        }
      }
      this.drawTile(ctx, x, y, alpha);

      const k = `${x},${y}`;
      if (reach) {
        const node = reach.get(k);
        if (node && node.cost > 0 && !this.enc.occupied(x, y, this.overlay.selected)) {
          this.fillDiamond(ctx, x, y, 'rgba(96,168,255,.26)', 'rgba(140,200,255,.45)');
        }
      }
      if (pathSet.has(k)) this.fillDiamond(ctx, x, y, 'rgba(170,225,255,.42)', 'rgba(200,240,255,.8)');
      if (targetSet.has(k)) this.fillDiamond(ctx, x, y, 'rgba(255,90,70,.22)', '#ff6a4b');
      if (this.hover && this.hover.x === x && this.hover.y === y) {
        this.fillDiamond(ctx, x, y, 'rgba(255,255,255,.08)', 'rgba(255,255,255,.5)');
      }
    }
    if (lastD >= 0) this.drawOccupantsOnDiagonal(ctx, byView, lastD);

    this.fx.drawOver(ctx, this);
    this.drawFloaters(ctx, dt);
    ctx.restore();
  }

  drawOccupantsOnDiagonal(ctx, byView, d) {
    for (const [k, c] of byView) {
      const [vx, vy] = k.split(',').map(Number);
      if (vx + vy === d) this.drawCombatant(ctx, c);
    }
  }

  drawCombatant(ctx, c) {
    const { sx: baseX, sy: baseY } = this.center(c.pos.x, c.pos.y);
    const down = c.dead || hasCondition(c, 'inconsciente');
    const ally = c.side === 'party';

    // Deslocamento de investida, já no espaço da câmera.
    const off = this.fx.offsetFor(c.id);
    let sx = baseX;
    let sy = baseY;
    if (off) {
      const v = this.rotateVec(off.dx, off.dy);
      sx += (v.dx - v.dy) * (TW / 2);
      sy += (v.dx + v.dy) * (TH / 2);
      sy -= off.lift ?? 0;   // salto do golpe de cima para baixo
    }

    ctx.fillStyle = 'rgba(0,0,0,.42)';
    ctx.beginPath();
    ctx.ellipse(baseX, baseY, 17, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    if (!down) {
      ctx.strokeStyle = ally ? 'rgba(110,200,255,.85)' : 'rgba(255,120,96,.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(baseX, baseY, 19, 9.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;
    }

    if (this.overlay.selected === c) {
      ctx.strokeStyle = '#ffd24a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(baseX, baseY, 23, 11.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;
    }

    // Caído usa a mesma pose de quem está no chão, mas sem o esmaecido:
    // continua consciente, só derrubado.
    const prone = !down && hasCondition(c, 'caido');
    const sheet = getSheet(c.look);
    const animName = down || prone ? 'down' : c.anim?.name ?? 'idle';
    const anim = sheet.anims[animName];
    const frame = c.anim?.frame ?? frameAt(anim, this.time + (c.pos.x + c.pos.y) * 0.17);

    // A direção do mundo gira junto com a câmera.
    const world = c.facingVec ?? { dx: 1, dy: 1 };
    const face = this.rotateVec(world.dx, world.dy);
    const toward = face.dx + face.dy;
    const row = down ? 0 : toward >= 0 ? 0 : 2;
    const flip = !down && (face.dx - face.dy) < 0;

    drawSprite(ctx, sheet, animName, frame, {
      x: sx,
      y: sy + 6,
      scale: c.kind === 'npc' ? 1.55 : 1.7,
      flip,
      row,
      alpha: c.acted && ally && !down ? 0.62 : 1,
      tint: c.flash > 0 ? { color: '#ffffff', strength: Math.min(1, c.flash) } : null,
    });
    if (c.flash > 0) c.flash -= 0.08;

    this.drawConditionFx(ctx, c, baseX, baseY, prone);

    if (down) return;

    // Barra de vida com transição suave: o número do motor é instantâneo, mas a
    // barra alcança em ~0,3 s, o que casa com o tempo da animação de impacto.
    const real = Math.max(0, c.hp / c.maxHp);
    const shown = this.displayHp.get(c.id) ?? real;
    const next = shown + (real - shown) * 0.12;
    this.displayHp.set(c.id, Math.abs(next - real) < 0.003 ? real : next);

    const bw = 34;
    const by = baseY - 52 - (c.kind === 'npc' ? 0 : 4);
    ctx.fillStyle = 'rgba(0,0,0,.66)';
    ctx.fillRect(baseX - bw / 2 - 1, by - 1, bw + 2, 6);
    // Rastro vermelho do dano recém-tomado.
    if (shown > real) {
      ctx.fillStyle = 'rgba(255,90,90,.55)';
      ctx.fillRect(baseX - bw / 2, by, bw * shown, 4);
    }
    ctx.fillStyle = ally ? (real > 0.5 ? '#5fd07a' : real > 0.25 ? '#ffc83a' : '#ff5a5a') : '#d4574a';
    ctx.fillRect(baseX - bw / 2, by, bw * real, 4);

    const conds = (c.conditions ?? []).filter((x) => CONDITIONS[x.id]);
    if (conds.length) {
      ctx.font = '12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(conds.slice(0, 3).map((x) => CONDITIONS[x.id].icon).join(''), baseX, by - 4);
    }
  }

  /**
   * Efeitos CONTÍNUOS das condições — desenhados todo quadro enquanto a
   * condição dura, diferente dos efeitos de `fx.js`, que são disparos únicos.
   * É o que faz "queimando" ser uma coisa que se vê, não só um ícone.
   */
  drawConditionFx(ctx, c, sx, sy, prone) {
    const conds = c.conditions ?? [];
    if (conds.length === 0 && !prone) return;
    const t = this.time;
    const has = (id) => conds.some((x) => x.id === id);

    // Queimando: línguas de fogo lambendo a figura.
    if (has('queimando')) {
      ctx.save();
      for (let i = 0; i < 5; i++) {
        const ph = t * 10 + i * 1.6;
        const h = 14 + Math.sin(ph) * 7;
        const x = sx + (i - 2) * 6 + Math.sin(ph * 0.6) * 2.5;
        const y = sy - 4 - (prone ? 0 : 6);
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = '#ff5a1a';
        ctx.beginPath();
        ctx.moveTo(x, y - h);
        ctx.lineTo(x + 4, y);
        ctx.lineTo(x - 4, y);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffd24a';
        ctx.beginPath();
        ctx.moveTo(x, y - h * 0.5);
        ctx.lineTo(x + 2, y);
        ctx.lineTo(x - 2, y);
        ctx.closePath();
        ctx.fill();
      }
      // Brasas subindo.
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = '#ffb04a';
      for (let i = 0; i < 3; i++) {
        const ph = (t * 0.9 + i * 0.33) % 1;
        ctx.fillRect(sx + Math.sin(t * 4 + i * 2) * 9, sy - 10 - ph * 42, 2, 2);
      }
      ctx.restore();
    }

    // Atordoado: estrelas girando acima da cabeça.
    if (has('atordoado')) {
      ctx.save();
      ctx.fillStyle = '#ffe14d';
      ctx.font = '700 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      for (let i = 0; i < 3; i++) {
        const a = t * 3.4 + (i / 3) * Math.PI * 2;
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(a);
        ctx.fillText('✦', sx + Math.cos(a) * 17, sy - 58 + Math.sin(a) * 6);
      }
      ctx.restore();
    }

    // Caído: poeira rente ao chão.
    if (prone) {
      ctx.save();
      ctx.globalAlpha = 0.25 + 0.1 * Math.sin(t * 3);
      ctx.strokeStyle = '#c8b68a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(sx, sy + 2, 20, 6, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Abençoado: argola dourada pulsando.
    if (has('abencoado')) {
      ctx.save();
      ctx.globalAlpha = 0.4 + 0.25 * Math.sin(t * 2.6);
      ctx.strokeStyle = '#ffe9a8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(sx, sy - 56, 15, 5.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Lento: setas azuis arrastando para trás.
    if (has('lento')) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = '#8fd8ff';
      ctx.lineWidth = 2;
      for (let i = 0; i < 2; i++) {
        const o = ((t * 0.8 + i * 0.5) % 1) * 14;
        ctx.beginPath();
        ctx.moveTo(sx - 14 - o, sy - 14);
        ctx.lineTo(sx - 20 - o, sy - 9);
        ctx.lineTo(sx - 14 - o, sy - 4);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Esquivando: brilho de escudo em volta.
    if (has('esquivando')) {
      ctx.save();
      ctx.globalAlpha = 0.25 + 0.15 * Math.sin(t * 5);
      ctx.strokeStyle = '#cfe4ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(sx, sy - 24, 20, 28, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  drawFloaters(ctx, dt) {
    for (let i = this.floaters.length - 1; i >= 0; i--) {
      const f = this.floaters[i];
      f.t += dt;
      if (f.t > 1.1) { this.floaters.splice(i, 1); continue; }
      const k = f.t / 1.1;
      const { sx, sy } = this.center(f.x, f.y);
      ctx.save();
      ctx.globalAlpha = 1 - k * k;
      ctx.font = `700 ${f.big ? 23 : 17}px ui-monospace, monospace`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = 'rgba(0,0,0,.8)';
      const ty = sy - 56 - k * 28;
      ctx.strokeText(f.text, sx, ty);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, sx, ty);
      ctx.restore();
    }
  }
}
