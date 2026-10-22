// Camada de animação do combate.
//
// O motor de regras resolve tudo de uma vez: quando um ataque acontece, o dano
// já foi aplicado. Esta camada existe para CONTAR esse resultado ao longo de
// alguns décimos de segundo — investida, projétil, impacto — e para atrasar o
// número de dano até o momento em que ele faz sentido visualmente.
//
// Nada aqui altera estado de jogo. Se um efeito for descartado, a partida
// continua idêntica.

const EASE_OUT = (k) => 1 - (1 - k) * (1 - k);
const EASE_IN_OUT = (k) => (k < 0.5 ? 2 * k * k : 1 - ((-2 * k + 2) ** 2) / 2);

export class Fx {
  constructor() {
    this.items = [];
    this.offsets = new Map();   // id do combatente → deslocamento de tela
  }

  clear() {
    this.items.length = 0;
    this.offsets.clear();
  }

  get busy() {
    return this.items.some((i) => i.blocking);
  }

  add(item) {
    this.items.push({ t: 0, ...item });
    return this;
  }

  update(dt) {
    this.offsets.clear();
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.t += dt;
      const k = Math.min(1, it.t / it.dur);

      if (it.kind === 'lunge') {
        // Vai até 38% do caminho e volta.
        const push = Math.sin(k * Math.PI) * 0.38;
        this.offsets.set(it.id, { dx: it.vec.dx * push, dy: it.vec.dy * push });
      }

      if (it.t >= it.dur) {
        it.onDone?.();
        this.items.splice(i, 1);
      }
    }
  }

  offsetFor(id) {
    return this.offsets.get(id) ?? null;
  }

  // ---- fábricas -----------------------------------------------------------

  /** Investida: o atacante avança na direção do alvo e volta. */
  lunge(actor, target, dur = 0.26) {
    const dx = target.x - actor.pos.x;
    const dy = target.y - actor.pos.y;
    const len = Math.hypot(dx, dy) || 1;
    return this.add({
      kind: 'lunge', id: actor.id, dur,
      vec: { dx: dx / len, dy: dy / len },
    });
  }

  /** Projétil viajando entre dois quadrados. `style` muda o desenho. */
  projectile(from, to, { color = '#ffe9b0', style = 'arrow', dur = 0.26, arc = 0.5, onDone = null } = {}) {
    return this.add({ kind: 'projectile', from: { ...from }, to: { ...to }, color, style, dur, arc, onDone, blocking: true });
  }

  /** Feixe instantâneo que some. Para raio e olhares mágicos. */
  beam(from, to, { color = '#bfe6ff', dur = 0.22, width = 3, onDone = null } = {}) {
    return this.add({ kind: 'beam', from: { ...from }, to: { ...to }, color, dur, width, onDone });
  }

  /** Estilhaços no ponto de impacto. */
  impact(tile, { color = '#ffd27a', count = 10, spread = 46, dur = 0.42 } = {}) {
    const parts = [];
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const speed = spread * (0.4 + Math.random() * 0.8);
      parts.push({ a, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed * 0.55 - 40, size: 2 + Math.random() * 3 });
    }
    return this.add({ kind: 'impact', tile: { ...tile }, color, parts, dur });
  }

  /** Anel expandindo no chão. Área de magia, cura, pulso. */
  ring(tile, { color = '#9fe8ff', radius = 46, dur = 0.5, width = 3 } = {}) {
    return this.add({ kind: 'ring', tile: { ...tile }, color, radius, dur, width });
  }

  /** Arco de corte sobre o alvo. */
  slash(tile, { color = '#ffffff', dur = 0.22, angle = -0.6 } = {}) {
    return this.add({ kind: 'slash', tile: { ...tile }, color, dur, angle });
  }

  /** Marca cada quadrado afetado por uma magia de área. */
  area(tiles, { color = '#ff8a4a', dur = 0.5 } = {}) {
    return this.add({ kind: 'area', tiles: tiles.map((t) => ({ ...t })), color, dur });
  }

  // ---- desenho ------------------------------------------------------------

  /** Efeitos rentes ao chão, desenhados antes dos combatentes. */
  drawGround(ctx, board) {
    for (const it of this.items) {
      const k = Math.min(1, it.t / it.dur);
      if (it.kind === 'ring') {
        const r = it.radius * EASE_OUT(k);
        const { sx, sy } = board.centerF(it.tile.x, it.tile.y);
        ctx.save();
        ctx.globalAlpha = 1 - k;
        ctx.strokeStyle = it.color;
        ctx.lineWidth = it.width;
        ctx.beginPath();
        ctx.ellipse(sx, sy, r, r * 0.5, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (it.kind === 'area') {
        ctx.save();
        ctx.globalAlpha = (1 - k) * 0.5;
        ctx.fillStyle = it.color;
        for (const t of it.tiles) {
          const { sx, sy } = board.centerF(t.x, t.y);
          board.diamond(ctx, sx, sy - board.tileHalf);
          ctx.fill();
        }
        ctx.restore();
      }
    }
  }

  /** Efeitos acima dos combatentes. */
  drawOver(ctx, board) {
    for (const it of this.items) {
      const k = Math.min(1, it.t / it.dur);

      if (it.kind === 'projectile') {
        const e = EASE_IN_OUT(k);
        const fx = it.from.x + (it.to.x - it.from.x) * e;
        const fy = it.from.y + (it.to.y - it.from.y) * e;
        const p = board.centerF(fx, fy);
        // Arco: sobe no meio do percurso.
        const lift = Math.sin(e * Math.PI) * 40 * it.arc;
        const y = p.sy - 32 - lift;
        const ang = Math.atan2(it.to.y - it.from.y, it.to.x - it.from.x);

        ctx.save();
        ctx.translate(p.sx, y);
        if (it.style === 'arrow') {
          ctx.rotate(ang * 0.5);
          ctx.fillStyle = it.color;
          ctx.fillRect(-9, -1.5, 18, 3);
          ctx.beginPath();
          ctx.moveTo(9, 0); ctx.lineTo(3, -4); ctx.lineTo(3, 4);
          ctx.closePath(); ctx.fill();
        } else if (it.style === 'orb') {
          const grd = ctx.createRadialGradient(0, 0, 1, 0, 0, 11);
          grd.addColorStop(0, '#ffffff');
          grd.addColorStop(0.4, it.color);
          grd.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = grd;
          ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill();
        } else { // bolt
          ctx.strokeStyle = it.color;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(-10, 0);
          ctx.lineTo(-3, -4);
          ctx.lineTo(2, 3);
          ctx.lineTo(10, -1);
          ctx.stroke();
        }
        ctx.restore();
      }

      if (it.kind === 'beam') {
        const a = board.centerF(it.from.x, it.from.y);
        const b = board.centerF(it.to.x, it.to.y);
        ctx.save();
        ctx.globalAlpha = 1 - k;
        ctx.strokeStyle = it.color;
        ctx.lineWidth = it.width * (1 - k * 0.5);
        ctx.shadowColor = it.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        // Zigue-zague leve, para não virar um traço reto sem vida.
        const segs = 6;
        ctx.moveTo(a.sx, a.sy - 34);
        for (let i = 1; i <= segs; i++) {
          const t = i / segs;
          const jitter = i === segs ? 0 : (Math.random() - 0.5) * 12;
          ctx.lineTo(a.sx + (b.sx - a.sx) * t + jitter, a.sy - 34 + (b.sy - a.sy) * t + jitter * 0.4);
        }
        ctx.stroke();
        ctx.restore();
      }

      if (it.kind === 'impact') {
        const { sx, sy } = board.centerF(it.tile.x, it.tile.y);
        ctx.save();
        ctx.globalAlpha = 1 - k;
        ctx.fillStyle = it.color;
        for (const p of it.parts) {
          const px = sx + p.vx * it.t;
          const py = sy - 26 + p.vy * it.t + 150 * it.t * it.t;
          ctx.fillRect(px, py, p.size, p.size);
        }
        ctx.restore();
      }

      if (it.kind === 'slash') {
        const { sx, sy } = board.centerF(it.tile.x, it.tile.y);
        ctx.save();
        ctx.translate(sx, sy - 30);
        ctx.rotate(it.angle);
        ctx.globalAlpha = 1 - k;
        ctx.strokeStyle = it.color;
        ctx.lineWidth = 4 * (1 - k);
        ctx.beginPath();
        ctx.arc(0, 0, 24 + k * 10, -0.9, 0.9);
        ctx.stroke();
        ctx.restore();
      }
    }
  }
}
