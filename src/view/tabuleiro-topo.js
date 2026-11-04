// O TABULEIRO VISTO DE CIMA. É o que substitui o isométrico (`board.js`): mapa pintado por baixo, grade quadrada,
// parede e porta por aresta, e a criatura como FICHA REDONDA — anel da disposição, barra de vida e nome, no estilo
// do Foundry e do Roll20.
//
// POR QUE HERDA DO `Board` em vez de nascer do zero. O jogo conversa com o tabuleiro por uma superfície grande: 530
// chamadas a `board.fx`, mais o realce de alcance, o cartão de previsão de acerto, a mira de área, a escuridão e as
// salas reveladas. Quase nada disso é isométrico — o que é isométrico é a GEOMETRIA, e ela mora em meia dúzia de
// métodos. Trocando esses seis e o `render`, todo o resto continua valendo, e o jogo muda de vista sem saber.
//
// A herança é um degrau, não o destino: quando o desenho de cima cobrir tudo o que o isométrico cobria, as 4.800
// linhas do `board.js` saem e esta classe vira a classe.
//
// O QUE AINDA NÃO FAZ, e o isométrico fazia: elevação (de cima, 1,5 m não aparece — a altura continua valendo na
// regra, só não se vê), oclusão e transparência de parede (não fazem sentido sem volume) e a arte de cenário, que é
// toda isométrica: o móvel aqui é o sprite deitado na casa, provisório.

import { Board, SUPERFICIE } from './board.js';
import * as V from './vista-topo.js';
import { makePortrait } from '../art/sheet.js';
import atlas from '../art/folhas/cenario.json';
import urlAtlas from '../art/folhas/cenario.png';

export const CASA = 64;          // o lado da casa, em pixels
const MARGEM = 24;

const ANEL_ALIADO = '#d9b45a';
const ANEL_NEUTRO = '#6fa8dc';
const ANEL_INIMIGO = '#b3433a';

const imgAtlas = new Image();
imgAtlas.src = urlAtlas;

export class TabuleiroTopo extends Board {
  constructor(canvas, opcoes) {
    super(canvas, opcoes);
    this.casa = CASA;
    this.rot = 0;                 // de cima não há rotação de câmera
    this.maxHeight = 0;
    this.retratos = new Map();
    this.imgFundo = null;
    this.enquadrar();
    this.rebuildOrder();
    this.carregarFundo();
  }

  /** O canvas é o mapa inteiro: largura por altura em casas, mais uma margem. */
  enquadrar() {
    const { w, h } = this.field;
    this.ox = MARGEM;
    this.oy = MARGEM;
    this.canvas.width = w * this.casa + MARGEM * 2;
    this.canvas.height = h * this.casa + MARGEM * 2;
    this.canvas.style.width = '';
    this.canvas.style.height = '';
    this.canvas.style.maxWidth = '';
    this.canvas.style.maxHeight = '';
  }

  /** O mapa pintado, quando o mapa traz o enquadramento (`field.fundo`, ver `game/mapa-editor.js`). */
  carregarFundo() {
    const f = this.field.fundo;
    if (!f?.nome) return;
    const img = new Image();
    img.addEventListener('load', () => { this.imgFundo = img; }, { once: true });
    img.src = f.url ?? `/_referencias/roll20/${f.nome}`;
  }

  // ---- geometria: a casa é um quadrado, e não um losango --------------------

  iso(x, y) {
    return { sx: this.ox + x * this.casa, sy: this.oy + y * this.casa };
  }

  center(x, y) {
    return { sx: this.ox + (x + 0.5) * this.casa, sy: this.oy + (y + 0.5) * this.casa };
  }

  centerF(fx, fy) {
    return { sx: this.ox + (fx + 0.5) * this.casa, sy: this.oy + (fy + 0.5) * this.casa };
  }

  toView(x, y) { return { vx: x, vy: y }; }

  fromView(vx, vy) { return { x: vx, y: vy }; }

  rotateVec(dx, dy) { return { dx, dy }; }

  setRotation() { /* de cima não gira */ }

  rotate() { /* de cima não gira */ }

  /** De cima a elevação não aparece: a altura continua valendo na regra, só não desloca o desenho. */
  alturaVisual() { return 0; }

  /** Ordem de desenho: linha a linha, que é o que a vista de cima pede. */
  rebuildOrder() {
    const lista = [];
    for (let y = 0; y < this.field.h; y++) {
      for (let x = 0; x < this.field.w; x++) lista.push({ x, y, vx: x, vy: y, d: y });
    }
    this.order = lista;
  }

  /** O "losango" do realce vira o quadrado da casa — e com isso todo o realce herdado já sai certo. */
  diamond(ctx, sx, sy) {
    ctx.beginPath();
    ctx.rect(sx, sy, this.casa, this.casa);
    ctx.closePath();
  }

  casaNoPonto(px, py) {
    const t = V.casaNoPonto(this.field, this.casa, px - this.ox, py - this.oy);
    return t && this.field.inside(t.x, t.y) ? t : null;
  }

  /** De cima a figura fica dentro da própria casa: não há corpo em pé invadindo a casa de trás. */
  casaDaFigura() { return null; }

  // ---- desenho --------------------------------------------------------------

  render(dt) {
    if (this.congela > 0 && Number.isFinite(dt)) { this.congela = Math.max(0, this.congela - dt); dt *= 0.05; }
    this.time += Number.isFinite(dt) ? dt : 0;
    this.fx.update(dt);
    const ctx = this.ctx;
    const C = this.casa;

    ctx.save();
    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt * 2);
      const k = this.shake * this.shake * 16;
      ctx.translate((Math.random() - 0.5) * k, (Math.random() - 0.5) * k);
    }
    ctx.fillStyle = '#0d0c11';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // o chão: o mapa pintado se houver, senão as cores que o jogo já usa para cada superfície
    ctx.save();
    ctx.translate(this.ox, this.oy);
    const comPintura = V.pintarFundo(ctx, this.imgFundo, this.field.fundo, C);
    if (!comPintura) {
      V.pintarChao(ctx, this.field, C);
      V.pintarMoveis(ctx, this.field, C, atlas, imgAtlas);
    }
    V.pintarGrade(ctx, this.field, C, comPintura ? 'rgba(120,200,255,.25)' : 'rgba(0,0,0,.28)');
    ctx.restore();

    this.realce(ctx);
    this.fx.drawGround(ctx, this);

    // a parede por cima do chão e do realce, para o alcance não vazar por cima dela
    ctx.save();
    ctx.translate(this.ox, this.oy);
    V.pintarArestas(ctx, this.field, C, comPintura);
    ctx.restore();

    for (const c of this.enc.combatants) {
      if (!c.pos) continue;
      if (this.figuraVisivel && !this.figuraVisivel(c)) continue;
      this.ficha(ctx, c);
    }

    this.fx.drawOver(ctx, this);
    this.drawFloaters(ctx, dt);
    ctx.restore();
  }

  /** O realce do HUD: alcance, caminho, alvos e a casa sob o cursor. `fillDiamond` é o herdado — agora pinta quadrado. */
  realce(ctx) {
    const { reachable, path, targets, selected } = this.overlay;
    if (reachable) {
      // as mesmas cores do isométrico: o jogador não tem de reaprender o que é azul
      for (const chave of reachable.keys()) {
        const [x, y] = String(chave).split(',').map(Number);
        this.fillDiamond(ctx, x, y, 'rgba(96,168,255,.26)', 'rgba(140,200,255,.45)');
      }
    }
    for (const p of path ?? []) this.fillDiamond(ctx, p.x, p.y, 'rgba(160,210,255,.5)', '#bfe0ff');
    for (const t of targets ?? []) this.fillDiamond(ctx, t.pos.x, t.pos.y, 'rgba(220,90,70,.26)', '#d9594a');
    if (selected?.pos) this.fillDiamond(ctx, selected.pos.x, selected.pos.y, 'rgba(0,0,0,0)', '#ffd868');
    if (this.hover) this.fillDiamond(ctx, this.hover.x, this.hover.y, 'rgba(255,255,255,.07)', 'rgba(255,216,104,.7)');
  }

  retrato(look) {
    if (!this.retratos.has(look)) {
      let c = null;
      try { c = makePortrait(look, 64); } catch { c = null; }
      this.retratos.set(look, c);
    }
    return this.retratos.get(look);
  }

  /** A ficha: retrato recortado em círculo, anel da disposição, barra de vida e nome. */
  ficha(ctx, c) {
    const C = this.casa;
    const andando = this.fx.positionFor(c.id);
    const fx = andando ? andando.x : c.pos.x;
    const fy = andando ? andando.y : c.pos.y;
    const pegada = c.pos.f ?? 1;
    const { sx, sy } = this.centerF(fx + (pegada - 1) / 2, fy + (pegada - 1) / 2);
    const r = C * pegada * 0.42;
    const anel = c.side === 'party' ? ANEL_ALIADO : c.side === 'neutro' ? ANEL_NEUTRO : ANEL_INIMIGO;

    ctx.save();
    ctx.globalAlpha = c.dead ? 0.45 : 1;
    ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.closePath();
    ctx.fillStyle = 'rgba(10,8,14,.85)';
    ctx.fill();
    ctx.save();
    ctx.clip();
    const p = this.retrato(c.look);
    if (p) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(p, sx - r, sy - r, r * 2, r * 2);
    } else {
      ctx.fillStyle = anel;
      ctx.globalAlpha = 0.5;
      ctx.fillRect(sx - r, sy - r, r * 2, r * 2);
    }
    ctx.restore();
    ctx.strokeStyle = anel;
    ctx.lineWidth = Math.max(2, C * 0.045);
    ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.stroke();

    // a barra de vida, colada embaixo do anel
    const bw = r * 1.8;
    const bh = Math.max(4, C * 0.075);
    const bx = sx - bw / 2;
    const by = sy + r - bh / 2;
    const frac = Math.max(0, Math.min(1, (c.hp ?? 1) / (c.maxHp || 1)));
    ctx.fillStyle = 'rgba(0,0,0,.75)';
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = frac > 0.5 ? '#5fbf5f' : frac > 0.25 ? '#d9b45a' : '#b3433a';
    ctx.fillRect(bx + 1, by + 1, (bw - 2) * frac, bh - 2);

    ctx.font = `${Math.max(10, Math.round(C * 0.16))}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0,0,0,.9)';
    ctx.strokeText(c.name ?? '', sx, by + bh + 3);
    ctx.fillStyle = '#efe8da';
    ctx.fillText(c.name ?? '', sx, by + bh + 3);
    ctx.restore();
  }
}

export { SUPERFICIE };
