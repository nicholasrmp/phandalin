// Camada de animação do combate.
//
// O motor de regras resolve tudo de uma vez: quando um ataque acontece, o dano
// já foi aplicado. Esta camada existe para CONTAR esse resultado ao longo de
// alguns décimos de segundo — investida, projétil, impacto — e para atrasar o
// número de dano até o momento em que ele faz sentido visualmente.
//
// Nada aqui altera estado de jogo. Se um efeito for descartado, a partida
// continua idêntica.
//
// Cada primitiva é uma peça de vocabulário. As "frases" — o que cada arma e
// cada magia mostram — ficam em `visuals.js`.

const EASE_OUT = (k) => 1 - (1 - k) * (1 - k);
const EASE_IN_OUT = (k) => (k < 0.5 ? 2 * k * k : 1 - ((-2 * k + 2) ** 2) / 2);

/** Altura, em pixels, do "peito" de uma figura acima do centro do quadrado. */
export const CHEST = 32;

export class Fx {
  constructor() {
    this.items = [];
    this.offsets = new Map();
  }

  clear() {
    this.items.length = 0;
    this.offsets.clear();
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
        const push = Math.sin(k * Math.PI) * (it.reach ?? 0.38);
        this.offsets.set(it.id, { dx: it.vec.dx * push, dy: it.vec.dy * push });
      }
      if (it.kind === 'hop') {
        // Pulo curto para o golpe de cima para baixo: sobe e desce.
        this.offsets.set(it.id, { dx: 0, dy: 0, lift: Math.sin(k * Math.PI) * (it.height ?? 16) });
      }
      if (it.kind === 'projectile' && it.trail) {
        it.past ??= [];
        const e = EASE_IN_OUT(k);
        it.past.push({ x: it.from.x + (it.to.x - it.from.x) * e, y: it.from.y + (it.to.y - it.from.y) * e, lift: Math.sin(e * Math.PI) * 40 * it.arc, age: 0 });
        for (const p of it.past) p.age += dt;
        while (it.past.length && it.past[0].age > 0.22) it.past.shift();
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

  // ---- movimento do corpo -------------------------------------------------

  /** Investida: o atacante avança na direção do alvo e volta. */
  lunge(actor, target, dur = 0.26, reach = 0.38) {
    const dx = target.x - actor.pos.x;
    const dy = target.y - actor.pos.y;
    const len = Math.hypot(dx, dy) || 1;
    return this.add({ kind: 'lunge', id: actor.id, dur, reach, vec: { dx: dx / len, dy: dy / len } });
  }

  /** Salto curto, para golpes de cima para baixo. */
  hop(actor, { dur = 0.3, height = 18 } = {}) {
    return this.add({ kind: 'hop', id: actor.id, dur, height });
  }

  // ---- projéteis ----------------------------------------------------------

  projectile(from, to, {
    color = '#ffe9b0', style = 'arrow', dur = 0.26, arc = 0.5,
    trail = false, spin = false, onDone = null,
  } = {}) {
    return this.add({ kind: 'projectile', from: { ...from }, to: { ...to }, color, style, dur, arc, trail, spin, onDone });
  }

  beam(from, to, { color = '#bfe6ff', dur = 0.22, width = 3, jagged = true } = {}) {
    return this.add({ kind: 'beam', from: { ...from }, to: { ...to }, color, dur, width, jagged });
  }

  // ---- impactos -----------------------------------------------------------

  impact(tile, { color = '#ffd27a', count = 10, spread = 46, dur = 0.42 } = {}) {
    const parts = [];
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const speed = spread * (0.4 + Math.random() * 0.8);
      parts.push({ vx: Math.cos(a) * speed, vy: Math.sin(a) * speed * 0.55 - 40, size: 2 + Math.random() * 3 });
    }
    return this.add({ kind: 'impact', tile: { ...tile }, color, parts, dur });
  }

  /** Arco de corte. `sweep` controla a abertura; `angle`, a inclinação. */
  slash(tile, { color = '#ffffff', dur = 0.22, angle = -0.6, sweep = 0.9, radius = 24, width = 4 } = {}) {
    return this.add({ kind: 'slash', tile: { ...tile }, color, dur, angle, sweep, radius, width });
  }

  /** Estocada: um traço curto e rápido na direção do golpe. */
  stab(tile, { color = '#ffffff', dur = 0.16, angle = 0, length = 26 } = {}) {
    return this.add({ kind: 'stab', tile: { ...tile }, color, dur, angle, length });
  }

  /** Pancada: onda no chão e poeira. Para maça, bordão e coice. */
  smash(tile, { color = '#e8d6a8', dur = 0.4 } = {}) {
    this.ring(tile, { color, radius: 42, dur: 0.45, width: 4 });
    return this.add({ kind: 'smash', tile: { ...tile }, color, dur });
  }

  /** Mordida: duas marcas convergindo. */
  fangs(tile, { color = '#ffffff', dur = 0.24 } = {}) {
    return this.add({ kind: 'fangs', tile: { ...tile }, color, dur });
  }

  /** Três riscos paralelos. */
  claw(tile, { color = '#ffd7d0', dur = 0.26, angle = -0.5 } = {}) {
    return this.add({ kind: 'claw', tile: { ...tile }, color, dur, angle });
  }

  // ---- magia --------------------------------------------------------------

  /** Coluna de luz descendo do alto sobre o quadrado. */
  pillar(tile, { color = '#ffe9a8', dur = 0.5, width = 18, height = 190 } = {}) {
    return this.add({ kind: 'pillar', tile: { ...tile }, color, dur, width, height });
  }

  /** Línguas de fogo subindo. Serve para magia de fogo e para queimadura. */
  flames(tile, { color = '#ff7a3a', count = 5, dur = 0.5, scale = 1 } = {}) {
    const seeds = [];
    for (let i = 0; i < count; i++) seeds.push({ phase: Math.random() * 6.28, off: (Math.random() - 0.5) * 16 * scale });
    return this.add({ kind: 'flames', tile: { ...tile }, color, dur, seeds, scale });
  }

  /** Pontos leves subindo. Cura, bênção, encantamento. */
  motes(tile, { color = '#6ee89a', count = 10, dur = 0.7, rise = 46, spread = 20 } = {}) {
    const parts = [];
    for (let i = 0; i < count; i++) {
      parts.push({ x: (Math.random() - 0.5) * spread, delay: Math.random() * 0.3, size: 2 + Math.random() * 2, wob: Math.random() * 6.28 });
    }
    return this.add({ kind: 'motes', tile: { ...tile }, color, dur, parts, rise });
  }

  /** Lascas angulares — gelo, pedra, vidro. */
  shards(tile, { color = '#bfe9ff', count = 8, dur = 0.45, spread = 40 } = {}) {
    const parts = [];
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      parts.push({ a, vx: Math.cos(a) * spread * (0.5 + Math.random()), vy: Math.sin(a) * spread * 0.5 - 30, len: 5 + Math.random() * 6, rot: Math.random() * 3 });
    }
    return this.add({ kind: 'shards', tile: { ...tile }, color, dur, parts });
  }

  /** Argola girando acima da cabeça. Bênção, consagração. */
  halo(tile, { color = '#ffe9a8', dur = 0.8, radius = 16 } = {}) {
    return this.add({ kind: 'halo', tile: { ...tile }, color, dur, radius });
  }

  /** Símbolo que sobe e some. Sono, confusão, marcação. */
  glyph(tile, { text = 'z', color = '#c7b4ff', dur = 0.9, rise = 40, size = 20 } = {}) {
    return this.add({ kind: 'glyph', tile: { ...tile }, text, color, dur, rise, size });
  }

  ring(tile, { color = '#9fe8ff', radius = 46, dur = 0.5, width = 3 } = {}) {
    return this.add({ kind: 'ring', tile: { ...tile }, color, radius, dur, width });
  }

  area(tiles, { color = '#ff8a4a', dur = 0.5 } = {}) {
    return this.add({ kind: 'area', tiles: tiles.map((t) => ({ ...t })), color, dur });
  }

  // ---- desenho: rente ao chão ---------------------------------------------

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
      }

      if (it.kind === 'area') {
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

      if (it.kind === 'smash') {
        const { sx, sy } = board.centerF(it.tile.x, it.tile.y);
        ctx.save();
        ctx.globalAlpha = (1 - k) * 0.85;
        // Rachaduras saindo do ponto de impacto.
        ctx.strokeStyle = it.color;
        ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 + 0.3;
          const len = 10 + 26 * EASE_OUT(k);
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + Math.cos(a) * len, sy + Math.sin(a) * len * 0.5);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
  }

  // ---- desenho: acima das figuras -----------------------------------------

  drawOver(ctx, board) {
    for (const it of this.items) {
      const k = Math.min(1, it.t / it.dur);
      const at = (tile) => board.centerF(tile.x, tile.y);

      switch (it.kind) {
        case 'projectile': {
          const e = EASE_IN_OUT(k);
          const p = board.centerF(
            it.from.x + (it.to.x - it.from.x) * e,
            it.from.y + (it.to.y - it.from.y) * e,
          );
          const lift = Math.sin(e * Math.PI) * 40 * it.arc;
          const y = p.sy - CHEST - lift;
          const ang = Math.atan2(it.to.y - it.from.y, it.to.x - it.from.x);

          if (it.trail && it.past) {
            ctx.save();
            for (const q of it.past) {
              const qp = board.centerF(q.x, q.y);
              ctx.globalAlpha = Math.max(0, 1 - q.age / 0.22) * 0.5;
              ctx.fillStyle = it.color;
              const s = 5 * (1 - q.age / 0.22);
              ctx.fillRect(qp.sx - s / 2, qp.sy - CHEST - q.lift - s / 2, s, s);
            }
            ctx.restore();
          }

          ctx.save();
          ctx.translate(p.sx, y);
          if (it.spin) ctx.rotate(it.t * 18);
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
          } else if (it.style === 'shard') {
            ctx.rotate(ang * 0.5);
            ctx.fillStyle = it.color;
            ctx.beginPath();
            ctx.moveTo(10, 0); ctx.lineTo(-4, -5); ctx.lineTo(-7, 0); ctx.lineTo(-4, 5);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-2, -1, 7, 2);
          } else if (it.style === 'javelin') {
            ctx.rotate(ang * 0.5);
            ctx.fillStyle = '#6a4a30';
            ctx.fillRect(-12, -1, 22, 2);
            ctx.fillStyle = it.color;
            ctx.beginPath();
            ctx.moveTo(12, 0); ctx.lineTo(4, -3); ctx.lineTo(4, 3);
            ctx.closePath(); ctx.fill();
          } else { // bolt
            ctx.strokeStyle = it.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-10, 0); ctx.lineTo(-3, -4); ctx.lineTo(2, 3); ctx.lineTo(10, -1);
            ctx.stroke();
          }
          ctx.restore();
          break;
        }

        case 'beam': {
          const a = at(it.from);
          const b = at(it.to);
          ctx.save();
          ctx.globalAlpha = 1 - k;
          ctx.strokeStyle = it.color;
          ctx.lineWidth = it.width * (1 - k * 0.5);
          ctx.shadowColor = it.color;
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.moveTo(a.sx, a.sy - CHEST);
          const segs = it.jagged ? 6 : 1;
          for (let i = 1; i <= segs; i++) {
            const t = i / segs;
            const j = i === segs || !it.jagged ? 0 : (Math.random() - 0.5) * 12;
            ctx.lineTo(a.sx + (b.sx - a.sx) * t + j, a.sy - CHEST + (b.sy - a.sy) * t + j * 0.4);
          }
          ctx.stroke();
          ctx.restore();
          break;
        }

        case 'impact': {
          const { sx, sy } = at(it.tile);
          ctx.save();
          ctx.globalAlpha = 1 - k;
          ctx.fillStyle = it.color;
          for (const p of it.parts) {
            ctx.fillRect(sx + p.vx * it.t, sy - 26 + p.vy * it.t + 150 * it.t * it.t, p.size, p.size);
          }
          ctx.restore();
          break;
        }

        case 'shards': {
          const { sx, sy } = at(it.tile);
          ctx.save();
          ctx.globalAlpha = 1 - k;
          ctx.fillStyle = it.color;
          for (const p of it.parts) {
            const px = sx + p.vx * it.t;
            const py = sy - 26 + p.vy * it.t + 130 * it.t * it.t;
            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(p.a + it.t * p.rot);
            ctx.beginPath();
            ctx.moveTo(p.len, 0); ctx.lineTo(-p.len * 0.4, -3); ctx.lineTo(-p.len * 0.4, 3);
            ctx.closePath(); ctx.fill();
            ctx.restore();
          }
          ctx.restore();
          break;
        }

        case 'slash': {
          const { sx, sy } = at(it.tile);
          ctx.save();
          ctx.translate(sx, sy - 30);
          ctx.rotate(it.angle);
          ctx.globalAlpha = 1 - k;
          ctx.strokeStyle = it.color;
          ctx.lineWidth = it.width * (1 - k);
          ctx.beginPath();
          ctx.arc(0, 0, it.radius + k * 10, -it.sweep, it.sweep);
          ctx.stroke();
          ctx.restore();
          break;
        }

        case 'stab': {
          const { sx, sy } = at(it.tile);
          const reach = it.length * EASE_OUT(k);
          ctx.save();
          ctx.translate(sx, sy - 30);
          ctx.rotate(it.angle);
          ctx.globalAlpha = 1 - k;
          ctx.strokeStyle = it.color;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(-reach * 0.5, 0);
          ctx.lineTo(reach * 0.5, 0);
          ctx.stroke();
          ctx.restore();
          break;
        }

        case 'fangs': {
          const { sx, sy } = at(it.tile);
          const close = 1 - k;          // as presas fecham
          ctx.save();
          ctx.globalAlpha = 1 - k * 0.7;
          ctx.strokeStyle = it.color;
          ctx.lineWidth = 3;
          for (const side of [-1, 1]) {
            ctx.beginPath();
            ctx.moveTo(sx + side * (6 + close * 14), sy - 42);
            ctx.lineTo(sx + side * (3 + close * 6), sy - 22);
            ctx.stroke();
          }
          ctx.restore();
          break;
        }

        case 'claw': {
          const { sx, sy } = at(it.tile);
          ctx.save();
          ctx.translate(sx, sy - 30);
          ctx.rotate(it.angle);
          ctx.globalAlpha = 1 - k;
          ctx.strokeStyle = it.color;
          ctx.lineWidth = 2.5;
          for (let i = -1; i <= 1; i++) {
            ctx.beginPath();
            ctx.arc(i * 7, 0, 18 + k * 8, -0.7, 0.7);
            ctx.stroke();
          }
          ctx.restore();
          break;
        }

        case 'pillar': {
          const { sx, sy } = at(it.tile);
          // Desce rápido, depois dissolve.
          const drop = Math.min(1, k / 0.35);
          const fade = k < 0.35 ? 1 : 1 - (k - 0.35) / 0.65;
          const top = sy - it.height;
          const bottom = top + it.height * drop;
          const w = it.width * (0.6 + 0.4 * fade);
          ctx.save();
          ctx.globalAlpha = fade;
          const grd = ctx.createLinearGradient(sx, top, sx, bottom);
          grd.addColorStop(0, 'rgba(255,255,255,0)');
          grd.addColorStop(0.3, it.color);
          grd.addColorStop(1, '#ffffff');
          ctx.fillStyle = grd;
          ctx.fillRect(sx - w / 2, top, w, bottom - top);
          if (drop >= 1) {
            ctx.globalAlpha = fade * 0.8;
            ctx.fillStyle = it.color;
            ctx.beginPath();
            ctx.ellipse(sx, sy, w * 1.6, w * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
          break;
        }

        case 'flames': {
          const { sx, sy } = at(it.tile);
          const fade = 1 - k;
          ctx.save();
          ctx.globalAlpha = fade;
          for (const s of it.seeds) {
            const ph = it.t * 9 + s.phase;
            const h = (12 + Math.sin(ph) * 6) * it.scale * (0.5 + fade * 0.5);
            const x = sx + s.off + Math.sin(ph * 0.7) * 3;
            const y = sy - 6;
            ctx.fillStyle = it.color;
            ctx.beginPath();
            ctx.moveTo(x, y - h);
            ctx.lineTo(x + 4 * it.scale, y);
            ctx.lineTo(x - 4 * it.scale, y);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#ffe9a8';
            ctx.beginPath();
            ctx.moveTo(x, y - h * 0.55);
            ctx.lineTo(x + 2 * it.scale, y);
            ctx.lineTo(x - 2 * it.scale, y);
            ctx.closePath();
            ctx.fill();
          }
          ctx.restore();
          break;
        }

        case 'motes': {
          const { sx, sy } = at(it.tile);
          ctx.save();
          ctx.fillStyle = it.color;
          for (const p of it.parts) {
            const pk = (it.t - p.delay) / (it.dur - p.delay);
            if (pk < 0 || pk > 1) continue;
            ctx.globalAlpha = Math.sin(pk * Math.PI);
            const x = sx + p.x + Math.sin(pk * 6 + p.wob) * 4;
            const y = sy - 6 - it.rise * pk;
            ctx.fillRect(x, y, p.size, p.size);
          }
          ctx.restore();
          break;
        }

        case 'halo': {
          const { sx, sy } = at(it.tile);
          const y = sy - 56;
          ctx.save();
          ctx.globalAlpha = Math.sin(Math.min(1, k * 1.3) * Math.PI) * 0.9;
          ctx.strokeStyle = it.color;
          ctx.lineWidth = 3;
          ctx.shadowColor = it.color;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.ellipse(sx, y, it.radius, it.radius * 0.38, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          break;
        }

        case 'glyph': {
          const { sx, sy } = at(it.tile);
          ctx.save();
          ctx.globalAlpha = Math.sin(Math.min(1, k * 1.2) * Math.PI);
          ctx.fillStyle = it.color;
          ctx.font = `700 ${it.size}px Georgia, serif`;
          ctx.textAlign = 'center';
          ctx.fillText(it.text, sx, sy - 40 - it.rise * k);
          ctx.restore();
          break;
        }

        default:
          break;
      }
    }
  }
}
