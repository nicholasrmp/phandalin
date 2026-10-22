// Tabuleiro isométrico em Canvas 2D.
//
// PROJEÇÃO
//   sx = ox + (x - y) * TW/2
//   sy = oy + (x + y) * TH/2 - altura * LIFT
//   O losango de um quadrado tem vértices em (sx, sy), (sx+TW/2, sy+TH/2),
//   (sx, sy+TH) e (sx-TW/2, sy+TH/2); o centro fica em (sx, sy+TH/2).
//
// PROJEÇÃO INVERSA (clique → quadrado)
//   Invertendo o sistema acima a partir do CENTRO do losango:
//     x = cx/TW + cy/TH        y = cy/TH - cx/TW
//   Arredondar dá o losango que contém o ponto. Como a altura desloca o
//   losango para cima, testamos dos platôs mais altos para os mais baixos e
//   ficamos com o primeiro cuja altura real bate — assim clicar no topo de um
//   platô seleciona o platô, não o chão atrás dele.
//
// ORDEM DE DESENHO
//   Diagonais de x+y crescente, do fundo para a frente. Dentro de cada
//   diagonal: primeiro os quadrados, depois quem está em cima deles.

import { getSheet, drawSprite, frameAt } from '../art/sheet.js';
import { hasCondition, CONDITIONS } from '../rules/conditions.js';

export const TW = 64;   // largura do losango
export const TH = 32;   // altura do losango
export const LIFT = 22; // pixels por nível de elevação
const PAD = 28;

const TOP_COLORS = {
  0: ['#4d6440', '#44583a'],   // chão
  1: ['#6a6276', '#5c5468'],   // parede
  2: ['#4a5a35', '#42512f'],   // terreno difícil
  3: ['#5e5040', '#544738'],   // cobertura
};

// As duas laterais de cada bloco têm luminância bem diferente: é o que faz a
// elevação ser lida como volume, e não como mancha de cor.
const SIDE_LEFT = '#22301c';
const SIDE_RIGHT = '#3b4e30';
const WALL_LEFT = '#332e42';
const WALL_RIGHT = '#564e6b';

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

    this.maxHeight = 0;
    for (let i = 0; i < this.field.heights.length; i++) {
      this.maxHeight = Math.max(this.maxHeight, this.field.heights[i]);
    }

    const { w, h } = this.field;
    canvas.width = (w + h) * (TW / 2) + PAD * 2;
    canvas.height = (w + h) * (TH / 2) + this.maxHeight * LIFT + PAD * 2 + 30;
    this.ox = PAD + (h - 1) * (TW / 2);
    this.oy = PAD + this.maxHeight * LIFT;

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

  // ---- projeção ------------------------------------------------------------

  iso(x, y, height = null) {
    const hgt = height ?? this.field.heightAt(x, y);
    return {
      sx: this.ox + (x - y) * (TW / 2),
      sy: this.oy + (x + y) * (TH / 2) - hgt * LIFT,
    };
  }

  center(x, y) {
    const { sx, sy } = this.iso(x, y);
    return { sx, sy: sy + TH / 2 };
  }

  tileFromEvent(e) {
    const r = this.canvas.getBoundingClientRect();
    const px = (e.clientX - r.left) * (this.canvas.width / r.width);
    const py = (e.clientY - r.top) * (this.canvas.height / r.height);
    for (let hgt = this.maxHeight; hgt >= 0; hgt--) {
      const cx = px - this.ox;
      const cy = py - this.oy - TH / 2 + hgt * LIFT;
      const x = Math.round(cx / TW + cy / TH);
      const y = Math.round(cy / TH - cx / TW);
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

  bump() {
    this.shake = 0.35;
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

    // laterais (a "espessura" do bloco)
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

    // topo
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
    const ctx = this.ctx;
    const { w, h } = this.field;

    ctx.save();
    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt * 2);
      const k = this.shake * this.shake * 14;
      ctx.translate((Math.random() - 0.5) * k, (Math.random() - 0.5) * k);
    }

    const sky = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    sky.addColorStop(0, '#231d33');
    sky.addColorStop(1, '#13111b');
    ctx.fillStyle = sky;
    ctx.fillRect(-40, -40, this.canvas.width + 80, this.canvas.height + 80);

    const occupantAt = new Map();
    for (const c of this.enc.combatants) {
      if (c.dead && c.kind === 'npc') continue;
      occupantAt.set(`${c.pos.x},${c.pos.y}`, c);
    }

    const reach = this.overlay.reachable;
    const targetSet = new Set((this.overlay.targets ?? []).map((t) => `${t.pos.x},${t.pos.y}`));
    const pathSet = new Set((this.overlay.path ?? []).map((p) => `${p.x},${p.y}`));

    // Diagonais do fundo para a frente.
    for (let d = 0; d <= (w - 1) + (h - 1); d++) {
      for (let x = 0; x < w; x++) {
        const y = d - x;
        if (y < 0 || y >= h) continue;

        // Oclusão: parede/platô que taparia alguém atrás fica translúcido.
        let alpha = 1;
        const kind = this.field.tileAt(x, y);
        const tall = kind === 1 || this.field.heightAt(x, y) > 0;
        if (tall) {
          for (const [dx, dy] of [[-1, 0], [0, -1], [-1, -1], [-2, 0], [0, -2], [-1, -2], [-2, -1]]) {
            const behind = occupantAt.get(`${x + dx},${y + dy}`);
            if (behind && this.field.heightAt(x, y) >= this.field.heightAt(x + dx, y + dy)) {
              alpha = 0.42;
              break;
            }
          }
        }
        this.drawTile(ctx, x, y, alpha);

        // sobreposições no topo do quadrado
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

      // quem está nesta diagonal
      for (let x = 0; x < w; x++) {
        const y = d - x;
        if (y < 0 || y >= h) continue;
        const c = occupantAt.get(`${x},${y}`);
        if (c) this.drawCombatant(ctx, c);
      }
    }

    this.drawFloaters(ctx, dt);
    ctx.restore();
  }

  drawCombatant(ctx, c) {
    const { sx, sy } = this.center(c.pos.x, c.pos.y);
    const down = c.dead || hasCondition(c, 'inconsciente');
    const ally = c.side === 'party';

    ctx.fillStyle = 'rgba(0,0,0,.42)';
    ctx.beginPath();
    ctx.ellipse(sx, sy, 17, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    if (!down) {
      ctx.strokeStyle = ally ? 'rgba(110,200,255,.85)' : 'rgba(255,120,96,.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(sx, sy, 19, 9.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;
    }

    if (this.overlay.selected === c) {
      ctx.strokeStyle = '#ffd24a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(sx, sy, 23, 11.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;
    }

    const sheet = getSheet(c.look);
    const animName = down ? 'down' : c.anim?.name ?? 'idle';
    const anim = sheet.anims[animName];
    const frame = c.anim?.frame ?? frameAt(anim, this.time + (c.pos.x + c.pos.y) * 0.17);
    const face = c.facingVec ?? { dx: 1, dy: 1 };
    const toward = face.dx + face.dy;
    const row = down ? 0 : toward >= 0 ? 0 : 2;       // 0 = frente, 2 = costas
    const flip = !down && (face.dx - face.dy) < 0;

    drawSprite(ctx, sheet, animName, frame, {
      x: sx,
      y: sy + 6,
      // A figura precisa ocupar o losango: menor que isso e some no cenário.
      scale: c.kind === 'npc' ? 1.55 : 1.7,
      flip,
      row,
      alpha: c.acted && ally && !down ? 0.62 : 1,
      tint: c.flash > 0 ? { color: '#ffffff', strength: Math.min(1, c.flash) } : null,
    });
    if (c.flash > 0) c.flash -= 0.08;

    if (down) return;

    const bw = 34;
    const by = sy - 52 - (c.kind === 'npc' ? 0 : 4);
    ctx.fillStyle = 'rgba(0,0,0,.66)';
    ctx.fillRect(sx - bw / 2 - 1, by - 1, bw + 2, 6);
    const pct = Math.max(0, c.hp / c.maxHp);
    ctx.fillStyle = ally ? (pct > 0.5 ? '#5fd07a' : pct > 0.25 ? '#ffc83a' : '#ff5a5a') : '#d4574a';
    ctx.fillRect(sx - bw / 2, by, bw * pct, 4);

    const conds = (c.conditions ?? []).filter((x) => CONDITIONS[x.id]);
    if (conds.length) {
      ctx.font = '12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(conds.slice(0, 3).map((x) => CONDITIONS[x.id].icon).join(''), sx, by - 4);
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
