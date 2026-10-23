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
import { distanceFt } from '../core/grid.js';
import { previsaoDeAtaque, previsaoDeMagia, pct } from '../rules/odds.js';
import { SPELLS } from '../rules/spells.js';
import { spellAttackBonus, spellSaveDc } from '../rules/abilities.js';
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

// Paleta do cartão de previsão. Os valores são os mesmos de `style.css`
// (--pedra, --gold, --ink, --muted, --green, --red, --blue): o cartão é
// desenhado no canvas, logo não herda as variáveis CSS, mas tem de ler como
// parte da mesma interface de pedra e latão.
const CARTAO = {
  fundo: 'rgba(17, 15, 21, .9)',
  fio: 'rgba(222, 198, 140, .34)',
  luz: 'rgba(255, 255, 255, .07)',
  sombra: 'rgba(0, 0, 0, .55)',
  gold: '#d9b45a',
  ink: '#ece6d8',
  muted: '#998f7e',
  green: '#5fd07a',
  red: '#e0553c',
  blue: '#6eb8ff',
  amber: '#e0963c',
};

// Alcance normal em latão discreto; alcance longo em âmbar tracejado, porque
// atirar ali custa desvantagem e o tracejado lê como "permitido, mas pior".
const CHAO_ALCANCE = { fill: 'rgba(217, 180, 90, .12)', stroke: 'rgba(217, 180, 90, .3)' };
const CHAO_LONGO = { fill: 'rgba(224, 150, 60, .13)', stroke: 'rgba(224, 150, 60, .5)' };

const FONTE_NOME = "13px 'Palatino Linotype', Palatino, Georgia, serif";
const FONTE_DADO = '11px system-ui, sans-serif';
const FONTE_DADO_FORTE = '700 11px system-ui, sans-serif';
const FONTE_CHANCE = '700 19px system-ui, sans-serif';

const vkey = (vx, vy) => `${vx},${vy}`;

export class Board {
  constructor(canvas, { encounter, onTileClick, onTileHover }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.enc = encounter;
    this.field = encounter.field;
    this.onTileClick = onTileClick;
    this.onTileHover = onTileHover;

    // `mode` é a ação escolhida no HUD (ataque ou magia). O tabuleiro precisa
    // dela para pintar alcance e prever o acerto ANTES do clique.
    this.overlay = { reachable: null, path: null, targets: null, selected: null, mode: null };
    this.hover = null;
    this.pointer = null;
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

    this.zoom = 1;
    this.drag = null;

    canvas.addEventListener('mousemove', (e) => {
      if (this.drag) return;   // arrastando a câmera: não realça quadrado
      const t = this.tileFromEvent(e);
      const changed = !this.hover || !t || this.hover.x !== t.x || this.hover.y !== t.y;
      this.hover = t;
      if (changed) this.onTileHover?.(t);
    });
    canvas.addEventListener('mouseleave', () => {
      this.hover = null;
      this.pointer = null;
      this.onTileHover?.(null);
    });
    canvas.addEventListener('click', (e) => {
      if (this.dragMoved) { this.dragMoved = false; return; }  // fim de arrasto não é clique
      const t = this.tileFromEvent(e);
      if (t) this.onTileClick?.(t);
    });

    // ---- girar com o botão direito ----
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener('mousedown', (e) => {
      if (e.button !== 2) return;
      this.drag = { x: e.clientX, acc: 0 };
      this.dragMoved = false;
      this.hover = null;
      this.pointer = null;
      canvas.style.cursor = 'grabbing';
      e.preventDefault();
    });
    this._onDragMove = (e) => {
      if (!this.drag) return;
      const dx = e.clientX - this.drag.x;
      this.drag.x = e.clientX;
      this.drag.acc += dx;
      if (Math.abs(dx) > 1) this.dragMoved = true;
      // Arrastar ~110 px vira a câmera um quarto de volta.
      const STEP = 110;
      while (this.drag.acc >= STEP) { this.drag.acc -= STEP; this.rotate(1); this.onCameraChange?.(); }
      while (this.drag.acc <= -STEP) { this.drag.acc += STEP; this.rotate(-1); this.onCameraChange?.(); }
    };
    this._onDragEnd = () => {
      if (!this.drag) return;
      this.drag = null;
      canvas.style.cursor = '';
    };
    addEventListener('mousemove', this._onDragMove);
    addEventListener('mouseup', this._onDragEnd);

    // ---- zoom com a roda ----
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.setZoom(this.zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15));
      this.onCameraChange?.();
    }, { passive: false });
  }

  /**
   * Zoom por CSS: o canvas continua com a mesma resolução interna e só muda de
   * tamanho na tela. Como `tileFromEvent` converte pelo retângulo medido, o
   * clique continua caindo no quadrado certo em qualquer zoom.
   */
  setZoom(z) {
    this.zoom = Math.max(0.55, Math.min(3, z));
    const el = this.canvas;
    if (Math.abs(this.zoom - 1) < 0.02) {
      this.zoom = 1;
      el.style.width = '';
      el.style.height = '';
      el.style.maxWidth = '';
      el.style.maxHeight = '';
      return;
    }
    // Mede uma vez o tamanho "encaixado" para usar de base.
    this.fitWidth ??= el.getBoundingClientRect().width || el.width;
    el.style.maxWidth = 'none';
    el.style.maxHeight = 'none';
    el.style.width = `${Math.round(this.fitWidth * this.zoom)}px`;
    el.style.height = 'auto';
  }

  zoomBy(factor) {
    this.setZoom(this.zoom * factor);
  }

  resetCamera() {
    this.setZoom(1);
    this.setRotation(0);
  }

  disposeCamera() {
    removeEventListener('mousemove', this._onDragMove);
    removeEventListener('mouseup', this._onDragEnd);
  }

  get tileHalf() {
    return TH / 2;
  }

  // ---- rotação -------------------------------------------------------------

  setRotation(r) {
    this.rot = ((r % 4) + 4) % 4;
    this.rebuildOrder();
    this.hover = null;
    this.pointer = null;
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
    // Guardado em pixel interno do canvas (não de tela) porque é nele que o
    // cartão é desenhado — assim o cartão segue o cursor em qualquer zoom.
    this.pointer = { px, py };
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
      // Quem está andando é ordenado pelo quadrado em que ESTÁ, não pelo
      // destino: senão a figura passa por cima de paredes que já deixou.
      const w = this.fx.positionFor(c.id);
      const tx = w ? Math.round(w.x) : c.pos.x;
      const ty = w ? Math.round(w.y) : c.pos.y;
      const v = this.toView(tx, ty);
      byView.set(vkey(v.vx, v.vy), c);
      byTile.set(`${tx},${ty}`, c);
    }

    const reach = this.overlay.reachable;
    const targetSet = new Set((this.overlay.targets ?? []).map((t) => `${t.pos.x},${t.pos.y}`));
    const pathSet = new Set((this.overlay.path ?? []).map((p) => `${p.x},${p.y}`));

    // Camada de LEITURA: recalculada a cada quadro de propósito. `odds.js` é
    // pura, então prever custa menos que manter dois estados em sincronia.
    this.modo = this.modoDeAlvo();
    this.previsoes = this.modo ? this.preverInimigos(this.modo) : null;

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
      if (this.modo && this.modo.limite > 0) {
        const d = distanceFt(this.modo.actor.pos, { x, y });
        if (d > 0 && d <= this.modo.alcance) {
          this.fillDiamond(ctx, x, y, CHAO_ALCANCE.fill, CHAO_ALCANCE.stroke);
        } else if (d > 0 && d <= this.modo.limite) {
          this.fillDiamond(ctx, x, y, CHAO_LONGO.fill, null);
          this.strokeDiamondTracejado(ctx, x, y, CHAO_LONGO.stroke);
        }
      }
      if (this.previsoes?.impossiveis.has(k)) this.tintaImpossivel(ctx, x, y);
      if (pathSet.has(k)) this.fillDiamond(ctx, x, y, 'rgba(170,225,255,.42)', 'rgba(200,240,255,.8)');
      if (targetSet.has(k)) this.fillDiamond(ctx, x, y, 'rgba(255,90,70,.22)', '#ff6a4b');
      if (this.hover && this.hover.x === x && this.hover.y === y) {
        this.fillDiamond(ctx, x, y, 'rgba(255,255,255,.08)', 'rgba(255,255,255,.5)');
      }
    }
    if (lastD >= 0) this.drawOccupantsOnDiagonal(ctx, byView, lastD);

    // A cruz vem DEPOIS das figuras, de propósito: ela precisa riscar a
    // criatura, não ficar escondida atrás das pernas dela.
    if (this.previsoes) {
      for (const k of this.previsoes.impossiveis) {
        const [ix, iy] = k.split(',').map(Number);
        this.cruzImpossivel(ctx, ix, iy);
      }
    }

    this.fx.drawOver(ctx, this);
    this.drawFloaters(ctx, dt);
    ctx.restore();

    // Fora do `restore` do tremor: o cartão é leitura, e texto que sacode fica
    // ilegível justamente no quadro em que o jogador quer ler.
    this.drawCartao(ctx);
  }

  drawOccupantsOnDiagonal(ctx, byView, d) {
    for (const [k, c] of byView) {
      const [vx, vy] = k.split(',').map(Number);
      if (vx + vy === d) this.drawCombatant(ctx, c);
    }
  }

  drawCombatant(ctx, c) {
    const walking = this.fx.positionFor(c.id);
    const here = walking ?? c.pos;
    // Criatura Grande ocupa 2x2 e Enorme 3x3. A âncora continua sendo o canto,
    // porque é com ele que o motor conta quadrados — mas ela é DESENHADA no
    // centro da própria pegada, senão o ogro fica pendurado num canto do
    // espaço que ocupa.
    const pegada = c.pos.f ?? 1;
    const meio = (pegada - 1) / 2;
    const { sx: baseX, sy: baseY0 } = this.centerF(here.x + meio, here.y + meio);
    const baseY = baseY0 - (walking?.lift ?? 0);
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
      ctx.ellipse(baseX, baseY, 19 * pegada, 9.5 * pegada, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;
    }

    if (this.overlay.selected === c) {
      ctx.strokeStyle = '#ffd24a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(baseX, baseY, 23 * pegada, 11.5 * pegada, 0, 0, Math.PI * 2);
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
    const world = walking && (walking.dx || walking.dy)
      ? { dx: walking.dx, dy: walking.dy }
      : c.facingVec ?? { dx: 1, dy: 1 };
    const face = this.rotateVec(world.dx, world.dy);
    const toward = face.dx + face.dy;
    const row = down ? 0 : toward >= 0 ? 0 : 2;
    const flip = !down && (face.dx - face.dy) < 0;

    drawSprite(ctx, sheet, animName, frame, {
      x: sx,
      y: sy + 6,
      // 1:1 para quem ocupa um quadrado — escala quebrada borra a grade de
      // pixels. Para Grande e Enorme a regra cede: um ogro desenhado 1:1 em
      // cima de uma base do dobro da largura lê como anão num tablado. A conta
      // vai atrás da proporção real (ogro ~1,7x a altura de um humano), que a
      // célula de 80 px sozinha não alcança.
      scale: 1 + (pegada - 1) * 0.4,
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

  // ---- previsão de alvo e alcance ------------------------------------------
  //
  // POR QUE ESTA CAMADA EXISTE
  // O HUD diz o que o personagem TEM; o tabuleiro não dizia nada sobre o ALVO.
  // O jogador clicava e descobria depois se acertava, se estava no alcance
  // longo ou se a parede cortava a linha de visão. Tudo aqui é leitura: as
  // contas vêm de `rules/odds.js`, que é pura, e nenhuma linha deste trecho
  // escreve no encontro.

  /** Losango tracejado — usado no alcance longo, que custa desvantagem. */
  strokeDiamondTracejado(ctx, x, y, stroke) {
    const { sx, sy } = this.iso(x, y);
    ctx.save();
    ctx.setLineDash([5, 4]);
    this.diamond(ctx, sx, sy);
    ctx.strokeStyle = stroke;
    ctx.stroke();
    ctx.restore();
  }

  /** Chão avermelhado sob um alvo que esta ação não alcança. */
  tintaImpossivel(ctx, x, y) {
    this.fillDiamond(ctx, x, y, 'rgba(224, 85, 60, .18)', 'rgba(224, 85, 60, .55)');
  }

  /** Cruz riscando o alvo impossível — a recusa chega ANTES do clique. */
  cruzImpossivel(ctx, x, y) {
    const { sx, sy } = this.iso(x, y);
    const cy = sy + TH / 2 - 22;
    ctx.save();
    ctx.strokeStyle = CARTAO.red;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(sx - 14, cy - 14);
    ctx.lineTo(sx + 14, cy + 14);
    ctx.moveTo(sx + 14, cy - 14);
    ctx.lineTo(sx - 14, cy + 14);
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Traduz `overlay.mode` (a ação escolhida no HUD) no que o chão precisa
   * saber: quem age, como se chama a ação e onde o alcance normal acaba.
   */
  modoDeAlvo() {
    const modo = this.overlay.mode;
    const actor = this.overlay.selected;
    if (!modo || !actor || actor.dead) return null;

    if (modo.kind === 'attack') {
      const perfil = this.enc.weaponAttackProfile(actor, modo.weaponId);
      return {
        kind: 'attack',
        actor,
        weaponId: modo.weaponId ?? null,
        rotulo: perfil.name,
        alcance: perfil.ranged ? perfil.rangeFt : perfil.reachFt,
        limite: perfil.ranged ? perfil.longRangeFt : perfil.reachFt,
      };
    }
    if (modo.kind === 'spell') {
      // `SPELLS` direto, e não `getSpell`, porque `getSpell` lança: um id
      // estranho não pode derrubar o quadro inteiro do tabuleiro.
      const spell = SPELLS[modo.spellId];
      if (!spell) return null;
      return {
        kind: 'spell',
        actor,
        spell,
        rotulo: spell.name,
        // Magia não tem alcance longo: o limite é o próprio alcance.
        alcance: spell.rangeFt,
        limite: spell.rangeFt,
      };
    }
    return null;
  }

  /** Previsão de cada inimigo vivo, mais o índice dos que são impossíveis. */
  preverInimigos(modo) {
    const porId = new Map();
    const impossiveis = new Set();
    for (const alvo of this.enc.combatants) {
      if (alvo.dead || alvo.side === modo.actor.side) continue;
      const pv = this.preverContra(modo, alvo);
      if (!pv) continue;
      porId.set(alvo.id, pv);
      if (pv.foraDeAlcance || pv.semVisao) impossiveis.add(`${alvo.pos.x},${alvo.pos.y}`);
    }
    return { porId, impossiveis };
  }

  /** Previsão normalizada: ataque e magia saem com os mesmos campos. */
  preverContra(modo, alvo) {
    if (modo.kind === 'attack') {
      const p = previsaoDeAtaque(this.enc, modo.actor, alvo, modo.weaponId);
      return {
        tipo: 'ataque',
        chance: p.chance,
        danoMedio: p.danoMedio,
        esperado: p.esperado,
        dist: p.dist,
        alcance: p.alcance,
        foraDeAlcance: p.foraDeAlcance,
        alcanceLongo: p.alcanceLongo,
        semVisao: p.semVisao,
        vantagem: p.mods.advantage && !p.mods.disadvantage,
        desvantagem: p.mods.disadvantage && !p.mods.advantage,
        motivos: p.motivos,
        dc: null,
        dano: p.perfil.damage,
        danoTipo: p.perfil.type,
      };
    }
    if (modo.kind === 'spell') {
      const p = previsaoDeMagia(this.enc, modo.actor, alvo, modo.spell, {
        atkBonus: spellAttackBonus(modo.actor) ?? 0,
        dc: spellSaveDc(modo.actor) ?? 10,
      });
      // `previsaoDeMagia` devolve os motivos, mas não de que lado eles pesam;
      // a mesma conta pura diz isso, e o cartão precisa da direção.
      const mods = modo.spell.kind === 'attack'
        ? this.enc.attackModifiers(modo.actor, alvo, { ranged: true })
        : { advantage: false, disadvantage: false };
      return {
        tipo: p.tipo,
        chance: p.chance,
        danoMedio: p.danoMedio,
        esperado: p.esperado,
        dist: p.dist,
        alcance: modo.alcance,
        foraDeAlcance: p.foraDeAlcance,
        alcanceLongo: false,
        semVisao: p.semVisao,
        vantagem: mods.advantage && !mods.disadvantage,
        desvantagem: mods.disadvantage && !mods.advantage,
        motivos: p.motivos,
        dc: p.dc,
        dano: modo.spell.damage ?? null,
        danoTipo: modo.spell.damageType ?? null,
      };
    }
    return null;
  }

  // ---- cartão --------------------------------------------------------------

  /** Decide qual cartão cabe no que o cursor está olhando, e o desenha. */
  drawCartao(ctx) {
    const t = this.hover;
    if (!t || this.drag) return;
    const cartao = this.modo ? this.cartaoDeAlvo(t) : this.cartaoDeMovimento(t);
    if (cartao) this.desenharCartao(ctx, cartao, t);
  }

  cartaoDeAlvo(t) {
    const modo = this.modo;
    const alvo = this.enc.at(t.x, t.y);
    const linhas = [];
    const avisos = [];

    // Quadrado vazio (ou aliado): o que o jogador precisa ali é só saber se a
    // ação alcança aquele ponto.
    if (!alvo || alvo.side === modo.actor.side) {
      const d = distanceFt(modo.actor.pos, { x: t.x, y: t.y });
      linhas.push({ rotulo: 'distância', valor: `${d} pés` });
      if (modo.limite > 0 && d > modo.limite) {
        avisos.push({ texto: `fora de alcance — alcança ${modo.limite} pés`, cor: CARTAO.red });
      } else if (modo.limite > 0 && d > modo.alcance) {
        avisos.push({ texto: 'alcance longo — desvantagem', cor: CARTAO.amber });
      }
      return { titulo: modo.rotulo, subtitulo: null, destaque: null, linhas, avisos };
    }

    // Recalculado para o alvo sob o cursor em vez de lido do índice: o índice
    // é do quadro, e um cartão com a previsão da ação anterior seria mentira.
    const pv = this.preverContra(modo, alvo);
    if (!pv) return null;

    let destaque;
    if (pv.chance !== null) {
      destaque = { rotulo: 'acerto', valor: pct(pv.chance), cor: this.corDaChance(pv.chance) };
    } else if (pv.dc) {
      // Magia de resistência não rola d20 do conjurador: o número que decide é
      // a CD que o alvo tem de bater.
      destaque = { rotulo: 'resistência', valor: `CD ${pv.dc}`, cor: CARTAO.gold };
    } else {
      destaque = { rotulo: pv.danoMedio > 0 ? 'acerta sempre' : 'sem jogada', valor: null, cor: CARTAO.gold };
    }

    if (pv.dano) linhas.push({ rotulo: 'dano', valor: `${pv.dano} ${pv.danoTipo ?? ''}`.trim() });
    if (pv.danoMedio > 0) {
      linhas.push({ rotulo: 'dano médio', valor: umaCasa(pv.danoMedio) });
      // O esperado é o número que escolhe o alvo: o dano médio já descontada a
      // chance de errar. É a única coluna que compara dois alvos de verdade.
      linhas.push({ rotulo: 'esperado', valor: umaCasa(pv.esperado), cor: CARTAO.gold });
    }
    // CA só entra quando existe jogada contra ela: numa magia de resistência o
    // número que importa é a CD, e mostrar CA ali confunde.
    if (pv.chance !== null) linhas.push({ rotulo: 'CA', valor: `${alvo.ac}` });
    linhas.push({ rotulo: 'PV', valor: `${Math.max(0, alvo.hp)}/${alvo.maxHp}` });

    if (pv.foraDeAlcance) {
      avisos.push({ texto: `impossível: fora de alcance — ${pv.dist} pés, alcança ${pv.alcance}`, cor: CARTAO.red });
    }
    if (pv.semVisao) avisos.push({ texto: 'impossível: sem linha de visão', cor: CARTAO.red });
    const motivos = pv.motivos?.length ? ` — ${pv.motivos.join(', ')}` : '';
    if (pv.vantagem) avisos.push({ texto: `vantagem${motivos}`, cor: CARTAO.green });
    if (pv.desvantagem) avisos.push({ texto: `desvantagem${motivos}`, cor: CARTAO.amber });

    return {
      titulo: alvo.name,
      subtitulo: `${modo.rotulo} · ${pv.dist} pés`,
      destaque,
      linhas,
      avisos,
    };
  }

  /** Sem ação escolhida: o cursor responde "quanto custa chegar" e "quem está ali". */
  cartaoDeMovimento(t) {
    const actor = this.overlay.selected;
    const alvo = this.enc.at(t.x, t.y);

    if (alvo) {
      const linhas = [
        { rotulo: 'PV', valor: `${Math.max(0, alvo.hp)}/${alvo.maxHp}` },
        { rotulo: 'CA', valor: `${alvo.ac}` },
      ];
      if (actor && alvo !== actor) {
        linhas.push({ rotulo: 'distância', valor: `${distanceFt(actor.pos, alvo.pos)} pés` });
      }
      return {
        titulo: alvo.name,
        subtitulo: alvo.side === 'party' ? 'aliado' : 'inimigo',
        destaque: null,
        linhas,
        avisos: [],
      };
    }

    const reach = this.overlay.reachable;
    const node = reach?.get(`${t.x},${t.y}`);
    if (!node || node.cost <= 0) return null;
    const restam = Math.max(0, (actor?.movementLeftFt ?? 0) - node.cost);
    return {
      titulo: 'mover',
      subtitulo: null,
      destaque: { rotulo: 'custo', valor: `${node.cost} pés`, cor: CARTAO.blue },
      linhas: [{ rotulo: 'restam', valor: `${restam} pés` }],
      avisos: [],
    };
  }

  corDaChance(p) {
    if (p >= 0.65) return CARTAO.green;
    if (p >= 0.4) return CARTAO.gold;
    return CARTAO.red;
  }

  /**
   * Mede e desenha. O cartão nasce ao lado do cursor e é empurrado para dentro
   * quando encosta na borda: previsão que sai do tabuleiro não serve de nada.
   */
  desenharCartao(ctx, cartao, tile) {
    const PADC = 8;
    const MAXW = 208;
    const GAP = 14;

    ctx.save();
    ctx.textBaseline = 'alphabetic';

    // ---- medir ----
    let w = 94;
    if (cartao.titulo) {
      ctx.font = FONTE_NOME;
      w = Math.max(w, ctx.measureText(cartao.titulo).width);
    }
    ctx.font = FONTE_DADO;
    if (cartao.subtitulo) w = Math.max(w, ctx.measureText(cartao.subtitulo).width);
    for (const l of cartao.linhas) {
      w = Math.max(w, ctx.measureText(l.rotulo).width + 18 + ctx.measureText(l.valor).width);
    }
    if (cartao.destaque) {
      const rw = cartao.destaque.rotulo ? ctx.measureText(cartao.destaque.rotulo).width : 0;
      ctx.font = FONTE_CHANCE;
      const vw = cartao.destaque.valor ? ctx.measureText(cartao.destaque.valor).width : 0;
      w = Math.max(w, vw + rw + (vw && rw ? 7 : 0));
    }
    w = Math.min(MAXW, Math.ceil(w));

    // Aviso é frase, não rótulo: quebra em linhas para não estourar a largura.
    ctx.font = FONTE_DADO;
    const avisos = [];
    for (const a of cartao.avisos) {
      for (const linha of quebrar(ctx, a.texto, w)) avisos.push({ texto: linha, cor: a.cor });
    }

    let h = PADC * 2;
    if (cartao.titulo) h += 15;
    if (cartao.subtitulo) h += 13;
    if (cartao.destaque) h += 23;
    h += cartao.linhas.length * 13;
    if (avisos.length) h += 4 + avisos.length * 12;

    const bw = w + PADC * 2;
    const bh = h;

    // ---- posicionar ----
    const centro = this.center(tile.x, tile.y);
    const px = this.pointer?.px ?? centro.sx;
    const py = this.pointer?.py ?? centro.sy;
    let bx = px + GAP;
    let by = py - bh - GAP;
    if (bx + bw > this.canvas.width - 6) bx = px - GAP - bw;
    if (by < 6) by = py + GAP;
    bx = Math.max(6, Math.min(bx, this.canvas.width - bw - 6));
    by = Math.max(6, Math.min(by, this.canvas.height - bh - 6));

    // ---- moldura: pedra, fio de latão e bisel ----
    this.caminhoArredondado(ctx, bx, by, bw, bh, 7);
    ctx.fillStyle = CARTAO.fundo;
    ctx.fill();
    ctx.strokeStyle = CARTAO.fio;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.strokeStyle = CARTAO.luz;
    ctx.beginPath();
    ctx.moveTo(bx + 2, by + 1.5);
    ctx.lineTo(bx + bw - 2, by + 1.5);
    ctx.stroke();
    ctx.strokeStyle = CARTAO.sombra;
    ctx.beginPath();
    ctx.moveTo(bx + 2, by + bh - 1.5);
    ctx.lineTo(bx + bw - 2, by + bh - 1.5);
    ctx.stroke();

    // ---- conteúdo ----
    const left = bx + PADC;
    const right = bx + bw - PADC;
    let y = by + PADC;

    if (cartao.titulo) {
      // Serifa no nome próprio, sem-serifa no número: o mesmo contrato de
      // `style.css`, que o canvas não pode herdar das variáveis CSS.
      ctx.font = FONTE_NOME;
      ctx.textAlign = 'left';
      ctx.fillStyle = CARTAO.ink;
      y += 11;
      ctx.fillText(cartao.titulo, left, y);
      y += 4;
    }
    if (cartao.subtitulo) {
      ctx.font = FONTE_DADO;
      ctx.textAlign = 'left';
      ctx.fillStyle = CARTAO.muted;
      y += 10;
      ctx.fillText(cartao.subtitulo, left, y);
      y += 3;
    }
    if (cartao.destaque) {
      y += 18;
      ctx.textAlign = 'left';
      let x = left;
      if (cartao.destaque.rotulo) {
        ctx.font = FONTE_DADO;
        ctx.fillStyle = CARTAO.muted;
        ctx.fillText(cartao.destaque.rotulo, x, y);
        x += ctx.measureText(cartao.destaque.rotulo).width + 7;
      }
      if (cartao.destaque.valor) {
        ctx.font = FONTE_CHANCE;
        ctx.fillStyle = cartao.destaque.cor;
        ctx.fillText(cartao.destaque.valor, x, y);
      }
      y += 5;
    }
    for (const l of cartao.linhas) {
      y += 13;
      ctx.font = FONTE_DADO;
      ctx.textAlign = 'left';
      ctx.fillStyle = CARTAO.muted;
      ctx.fillText(l.rotulo, left, y);
      ctx.font = FONTE_DADO_FORTE;
      ctx.textAlign = 'right';
      ctx.fillStyle = l.cor ?? CARTAO.ink;
      ctx.fillText(l.valor, right, y);
    }
    if (avisos.length) {
      y += 4;
      ctx.font = FONTE_DADO;
      ctx.textAlign = 'left';
      for (const a of avisos) {
        y += 12;
        ctx.fillStyle = a.cor;
        ctx.fillText(a.texto, left, y);
      }
    }
    ctx.restore();
  }

  caminhoArredondado(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
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

/** Uma casa decimal, com vírgula: número de mesa se lê em português. */
function umaCasa(n) {
  return n.toFixed(1).replace('.', ',');
}

/** Quebra uma frase em linhas que caibam na largura medida do cartão. */
function quebrar(ctx, texto, largura) {
  const linhas = [];
  let atual = '';
  for (const palavra of texto.split(' ')) {
    const tentativa = atual ? `${atual} ${palavra}` : palavra;
    if (atual && ctx.measureText(tentativa).width > largura) {
      linhas.push(atual);
      atual = palavra;
    } else {
      atual = tentativa;
    }
  }
  if (atual) linhas.push(atual);
  return linhas;
}
