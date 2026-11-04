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
import { temEscuridaoEm, visaoDoGrupo } from '../rules/luz.js';
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
    this.imgFrente = null;       // a máscara da folhagem, derivada da pintura em `carregarFundo`
    this.imgSobre = new Map();   // url -> Image das sobreposições que o roteiro acende e apaga
    this.enquadrar();
    this.rebuildOrder();
    this.carregarFundo();
    this.carregarSobreposicoes();
  }

  /**
   * As imagens das sobreposições. Carregam TODAS no começo, mesmo as apagadas: se esperássemos o roteiro
   * acender para só então buscar o arquivo, a ponte cairia um instante depois do estrondo.
   */
  carregarSobreposicoes() {
    for (const o of this.field.sobreposicoes ?? []) {
      if (!o.url || this.imgSobre.has(o.url)) continue;
      const img = new Image();
      this.imgSobre.set(o.url, img);
      img.src = o.url;
    }
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
    img.addEventListener('load', () => {
      this.imgFundo = img;
      // A máscara da folhagem sai da pintura uma vez, no carregamento: é uma varredura de 2,4 milhões de pixels
      // na Emboscada, e repeti-la a cada quadro seria absurdo.
      this.imgFrente = this.field.frente?.cor ? V.mascaraDaFrente(img, this.field.frente.cor) : null;
    }, { once: true });
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

    // O QUE O GRUPO ENXERGA. Tem de sair ANTES das fichas: `figuraVisivel` (herdada) consulta `_visao` para
    // esconder quem está no escuro, e sem isto ela devolvia sempre `true` — a vista de cima mostrava a masmorra
    // inteira, monstros e tudo, assim que a cena abria.
    this._visao = temEscuridaoEm(this.enc) ? visaoDoGrupo(this.enc, this.filtroDeVisao ?? null) : null;

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
    if (!comPintura) V.pintarChao(ctx, this.field, C);
    // As sobreposições de CHÃO: a fogueira acesa, o destroço, o baú aberto. Entram logo depois do mapa pintado,
    // por baixo de tudo o mais, porque é chão repintado — as fichas passam por cima.
    V.pintarSobreposicoes(ctx, this.imgSobre, this.field, C, false);
    // Com mapa pintado, só os móveis que a cena marcou com `sobreOFundo`: o desenho já tem o resto.
    V.pintarMoveis(ctx, this.field, C, atlas, imgAtlas, comPintura);
    V.pintarGrade(ctx, this.field, C, comPintura ? 'rgba(120,200,255,.25)' : 'rgba(0,0,0,.28)');
    V.pintarInterativos(ctx, this.field, C, this.time);
    ctx.restore();

    this.realce(ctx);
    this.fx.drawGround(ctx, this);

    // a parede por cima do chão e do realce, para o alcance não vazar por cima dela.
    // Com traço livre (`field.tracos`), desenha-se o traço: a aresta de casa é só a derivada que a regra usa.
    ctx.save();
    ctx.translate(this.ox, this.oy);
    if (this.field.tracos?.length) V.pintarTracos(ctx, this.field.tracos, C, comPintura);
    else V.pintarArestas(ctx, this.field, C, comPintura);
    ctx.restore();

    const aVista = new Map();
    for (const c of this.enc.combatants) {
      if (!c.pos) continue;
      if (this.figuraVisivel && !this.figuraVisivel(c)) continue;
      aVista.set(c.id, c);
      this.ficha(ctx, c);
    }

    this.desenharFrente(ctx, aVista);

    // O VÉU, na mesma ordem do isométrico: por cima do chão e das fichas, por baixo dos efeitos e dos números.
    // `desenharEscuridao` é herdada inteira; o que muda de vista são as três peças de geometria logo abaixo.
    if (this._visao) this.desenharEscuridao(ctx, aVista);
    else this.desenharAmbienteAoLuz(ctx);

    this.fx.drawOver(ctx, this);
    this.drawFloaters(ctx, dt);
    // o cartão de previsão de acerto, que segue o cursor: é desenhado em pixel de tela, então vale nas duas vistas
    this.drawCartao(ctx);
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

  /**
   * A CAMADA DE FRENTE: a copa e o beiral redesenhados POR CIMA das fichas, para quem passa debaixo deles ser
   * coberto em parte e ficar DENTRO do desenho em vez de em cima dele.
   *
   * Vem antes do véu, para a folha escurecer junto com o chão que ela cobre, e antes dos efeitos e dos números,
   * que ninguém quer ver tapados por uma folha. Não mexe em regra: a casa continua valendo o que o terreno diz.
   *
   * E A FOLHA DESBOTA ONDE HÁ FICHA. Sem isto a camada ESCONDE o personagem: medido na Emboscada, a copa cobre
   * 75% a 89% das casas em que se quis a prova, e o herói simplesmente sumiu debaixo dela. É o mesmo problema
   * que o Foundry resolve com a oclusão do tile de frente (o modo "Fade"), e a saída aqui é a mesma do véu —
   * a camada vai para uma tela à parte e se fura com `destination-out`, só que com degradê, para a borda do
   * furo não aparecer. Sobra folha por cima do ombro: o suficiente para ler "está debaixo da árvore".
   */
  desenharFrente(ctx, aVista) {
    // a sobreposição marcada `frente` (a ponte quebrada) desenha-se aqui mesmo sem haver camada de frente
    const comSobre = (this.field.sobreposicoes ?? []).some((o) => o.ligada && o.frente);
    if (!this.field.frente && !comSobre) return;
    const { width: w, height: h } = this.canvas;
    const lona = this._frente ?? (this._frente = document.createElement('canvas'));
    if (lona.width !== w) lona.width = w;
    if (lona.height !== h) lona.height = h;
    const m = lona.getContext('2d');
    m.globalCompositeOperation = 'source-over';
    m.clearRect(0, 0, w, h);
    m.save();
    m.translate(this.ox, this.oy);
    V.pintarFrente(m, this.imgFundo, this.imgFrente, this.field, this.casa);
    V.pintarSobreposicoes(m, this.imgSobre, this.field, this.casa, true);
    m.restore();
    m.globalCompositeOperation = 'destination-out';
    for (const c of aVista.values()) this.recortarFiguraDaFrente(m, c);
    m.globalCompositeOperation = 'source-over';
    ctx.drawImage(lona, 0, 0);
  }

  /** O furo da ficha na camada de frente: o disco da figura em degrau suave, mais a faixa da barra e do nome. */
  recortarFiguraDaFrente(m, c) {
    const C = this.casa;
    const andando = this.fx.positionFor(c.id);
    const pegada = c.pos.f ?? 1;
    const meio = (pegada - 1) / 2;
    const { sx, sy } = this.centerF((andando ? andando.x : c.pos.x) + meio, (andando ? andando.y : c.pos.y) + meio);
    const r = C * pegada * 0.42;
    const g = m.createRadialGradient(sx, sy, r * 0.2, sx, sy, r * 1.55);
    g.addColorStop(0, 'rgba(0,0,0,.9)');
    g.addColorStop(0.62, 'rgba(0,0,0,.82)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    m.fillStyle = g;
    m.beginPath();
    m.arc(sx, sy, r * 1.55, 0, Math.PI * 2);
    m.fill();
    // a barra de vida e o nome ficam ABAIXO do disco e são escritos antes desta camada: sem furo próprio,
    // a folhagem cobria justamente o que diz de quem é a ficha
    const bh = Math.max(4, C * 0.075);
    const letra = Math.max(10, Math.round(C * 0.16));
    m.fillStyle = 'rgba(0,0,0,.9)';
    m.fillRect(sx - r * 1.2, sy + r - bh, r * 2.4, bh * 2 + letra + 6);
  }

  // ---- as três peças da escuridão que sabem de geometria (ver `board.js`) --------------------------------

  /** De cima a casa é um quadrado e não tem face lateral: `alto` não existe aqui. */
  recortarCasaDaMascara(m, x, y) {
    const C = this.casa;
    // meio pixel de sangria para duas casas vizinhas não deixarem um fio de véu na emenda
    m.fillRect(this.ox + x * C - 0.5, this.oy + y * C - 0.5, C + 1, C + 1);
  }

  /** A ficha é um disco na própria casa; o recorte cobre o anel e a barra de vida colada embaixo dele. */
  recortarFiguraDaMascara(m, c, domo) {
    const C = this.casa;
    const pegada = c.pos.f ?? 1;
    const meio = (pegada - 1) / 2;
    const { sx, sy } = this.centerF(c.pos.x + meio, c.pos.y + meio);
    const r = (domo ? domo.raio + 4 : C * pegada * 0.42) + 4;
    m.beginPath();
    m.arc(sx, sy, r, 0, Math.PI * 2);
    m.fill();
    if (!domo) m.fillRect(sx - r, sy + r - C * 0.08, r * 2, C * 0.30);
  }

  /**
   * De cima a tocha acende um CÍRCULO, e não a elipse 2:1 do isométrico — e o raio é o alcance de verdade:
   * `claro` pés viram `claro / 1,5 m` casas. No isométrico o número era 0,55 largura de losango por casa,
   * que ali funciona porque o losango tem o dobro da largura da altura.
   */
  pocaDeLuz(bg, f) {
    const { sx, sy } = this.center(f.pos.x, f.pos.y);
    const r = (Math.max(f.claro, 5) / 5) * this.casa;
    // Duas ondas que não casam: o fogo treme sem repetir o compasso.
    const pulso = Math.sin(this.time * 9 + f.pos.x * 1.7) * 0.02 + Math.sin(this.time * 14.3 + f.pos.y * 2.9) * 0.012;
    for (const [esc, forca, cor] of [[0.55, 0.26, '255, 186, 96'], [1, 0.10, '255, 136, 52']]) {
      const g = bg.createRadialGradient(sx, sy, 3, sx, sy, r * esc);
      g.addColorStop(0, `rgba(${cor}, ${forca + pulso})`);
      g.addColorStop(0.55, `rgba(${cor}, ${(forca + pulso) * 0.35})`);
      g.addColorStop(1, 'rgba(255, 120, 40, 0)');
      bg.fillStyle = g;
      bg.beginPath();
      bg.arc(sx, sy, r * esc, 0, Math.PI * 2);
      bg.fill();
    }
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
