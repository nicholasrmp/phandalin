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
import { temEscuridaoEm, visaoDoGrupo, fontesDeLuz, visaoNoEscuro, CLARO } from '../rules/luz.js';
import { emissoresDoAmbiente, desenharAmbiente } from './ambiente.js';
import { criarCacheDePoligonos } from './raios.js';
import * as V from './vista-topo.js';
import { makePortrait } from '../art/sheet.js';
import { fichaDe } from '../art/fichas-de-criatura.js';
import atlas from '../art/folhas/cenario.json';
import urlAtlas from '../art/folhas/cenario.png';

export const CASA = 64;          // o lado da casa, em pixels
const MARGEM = 24;
const ZOOM_INICIAL = 0.8;        // a abertura do mapa grande, em fração do tamanho nativo (64 px por casa)

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
    this.arrastarParaMover();
  }

  // ---- a câmera -------------------------------------------------------------
  //
  // De cima o mapa pintado tem 64 px por casa, e encaixado inteiro no quadro ele encolhe a um terço: medido no
  // esconderijo (30 x 20), a casa ficava com ~20 px na tela e a ficha do herói do tamanho de um selo — a luz, a
  // faísca da pista e a arte da FA simplesmente não se viam. Então a vista de cima trata todo mapa que não cabe como
  // GRANDE: abre aproximada no grupo, segue o herói, e o botão direito arrastado move o mapa (como no Foundry).

  /** Não cabe a uma escala que se leia: a partir de 18 casas de largura ou 14 de altura. */
  get mapaGrande() {
    return this.field.w >= 18 || this.field.h >= 14;
  }

  /** Abre a 80% do tamanho nativo (casa de ~51 px), centrada em `pos`. */
  enquadrarGrande(pos) {
    if (!this.mapaGrande) return;
    this.setZoom(1);
    this.fitWidth = null;
    this.setZoom(this.fatorDeMapa * ZOOM_INICIAL);
    this.focarEm(pos);
  }

  /** O ⌖ volta ao enquadramento de abertura, no herói escolhido (ou no grupo, se ninguém estiver escolhido). */
  resetCamera() {
    const alvo = this.overlay.selected?.pos ?? this.focoInicial;
    if (this.mapaGrande && alvo) this.enquadrarGrande(alvo);
    else this.setZoom(1);
  }

  /** Rola o quadro até o CENTRO da casa `pos` ficar no meio do que se vê (o herdado mirava o canto de cima). */
  focarEm(pos) {
    const el = this.canvas;
    const quadro = el.parentElement;
    if (!quadro || !pos) return;
    const f = pos.f ?? 1;
    const { sx, sy } = this.centerF(pos.x + (f - 1) / 2, pos.y + (f - 1) / 2);
    const r = el.getBoundingClientRect();
    const q = quadro.getBoundingClientRect();
    const k = r.width / el.width;
    quadro.scrollLeft += (r.left + sx * k) - (q.left + q.width / 2);
    quadro.scrollTop += (r.top + sy * k) - (q.top + q.height / 2);
    this.atualizarHover();
  }

  /** Se `pos` saiu do miolo do quadro (os 60% do meio), recentra; dentro dele não mexe, senão a tela balança. */
  seguir(pos) {
    if (!this.mapaGrande || !pos) return;
    const el = this.canvas;
    const quadro = el.parentElement;
    if (!quadro) return;
    const { sx, sy } = this.center(pos.x, pos.y);
    const r = el.getBoundingClientRect();
    const q = quadro.getBoundingClientRect();
    const k = r.width / el.width;
    const px = r.left + sx * k;
    const py = r.top + sy * k;
    const mx = q.width * 0.2;
    const my = q.height * 0.2;
    if (px < q.left + mx || px > q.right - mx || py < q.top + my || py > q.bottom - my) this.focarEm(pos);
  }

  /**
   * ARRASTAR COM O BOTÃO DIREITO MOVE O MAPA. O herdado usa o arrasto para girar a câmera, e de cima ela não gira:
   * o arrasto não fazia nada. Soltar sem arrastar continua abrindo o menu da casa — o herdado só conta como arrasto
   * depois de 8 px, e aqui o movimento vertical também conta (lá só o horizontal contava).
   */
  arrastarParaMover() {
    const signal = this._abort?.signal;
    addEventListener('mousemove', (e) => {
      if (!this.drag) return;
      const quadro = this.canvas.parentElement;
      if (!quadro) return;
      quadro.scrollLeft -= e.movementX;
      quadro.scrollTop -= e.movementY;
      this.drag.total += Math.abs(e.movementY);
      if (this.drag.total > 8) this.dragMoved = true;
    }, { signal });
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
    // trocou o herói escolhido (clique na ficha, fim do turno de outro): a câmera vai até ele, se estiver fora do miolo
    const sel = this.overlay.selected;
    if (sel !== this._seguido) { this._seguido = sel; if (sel?.pos) this.seguir(sel.pos); }
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
    V.pintarPontos(ctx, this.overlay.pontos, C, this.time);
    ctx.restore();

    this.realce(ctx);
    this.fx.drawGround(ctx, this);

    // a parede por cima do chão e do realce, para o alcance não vazar por cima dela.
    // Com traço livre (`field.tracos`), desenha-se o traço: a aresta de casa é só a derivada que a regra usa.
    ctx.save();
    ctx.translate(this.ox, this.oy);
    // SOBRE MAPA PINTADO A PAREDE NÃO SE DESENHA: o desenho já a tem, e a linha por cima é coisa de editor (o jogador
    // via a planta inteira em ciano, até onde não enxergava). Fica só a PORTA, que abre e fecha e o desenho não sabe.
    if (comPintura) V.pintarArestas(ctx, this.field, C, false, true);
    else if (this.field.tracos?.length) V.pintarTracos(ctx, this.field.tracos, C, false);
    else V.pintarArestas(ctx, this.field, C, false);
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

  /**
   * O realce do HUD: alcance, caminho, alvos e a casa sob o cursor.
   *
   * O ALCANCE NÃO PINTA O CHÃO. Encher de azul cada casa alcançável cobria o mapa pintado justamente onde o jogador
   * precisa olhar — o baú, a fogueira, a laje rachada. Agora:
   * - explorando, não se desenha alcance nenhum: o passo é de 60 pés e cabe quase tudo; o caminho sob o cursor basta;
   * - na luta, só o CONTORNO da área alcançável, uma linha fina na borda (como o Foundry e o BG3 fazem), e o resto do
   *   chão fica limpo;
   * - o caminho sob o cursor é uma LINHA pelos centros das casas, com um anel no destino (os pés, no cartão).
   */
  realce(ctx) {
    const { reachable, path, targets, selected, explorando } = this.overlay;
    if (reachable && !explorando) this.contornoDoAlcance(ctx, reachable);
    if (path?.length > 1) this.linhaDoCaminho(ctx, path);
    for (const t of targets ?? []) this.fillDiamond(ctx, t.pos.x, t.pos.y, 'rgba(220,90,70,.26)', '#d9594a');
    if (selected?.pos) this.fillDiamond(ctx, selected.pos.x, selected.pos.y, 'rgba(0,0,0,0)', '#ffd868');
    if (this.hover) this.fillDiamond(ctx, this.hover.x, this.hover.y, 'rgba(255,255,255,.05)', 'rgba(255,216,104,.55)');
  }

  /**
   * A borda da área que o herói alcança: cada lado de casa alcançável que encosta numa casa que não é.
   *
   * A casa de um aliado conta como DENTRO (passa-se por ela, só não se para): sem isso cada aliado ganhava uma
   * caixinha própria no meio da área. E a cor NÃO é a da grade — a grade é azul claro sobre o mapa pintado, e um
   * contorno azul lia como mais uma linha dela. É marfim, mais grosso, com sombra embaixo.
   */
  contornoDoAlcance(ctx, reachable) {
    const C = this.casa;
    const dentro = (x, y) => {
      const n = reachable.get(`${x},${y}`);
      if (n) return true;
      const quem = this.enc?.at?.(x, y);
      return Boolean(quem && quem.side === 'party');
    };
    ctx.save();
    ctx.translate(this.ox, this.oy);
    ctx.beginPath();
    for (const k of reachable.keys()) {
      const [x, y] = String(k).split(',').map(Number);
      if (!dentro(x, y - 1)) { ctx.moveTo(x * C, y * C); ctx.lineTo((x + 1) * C, y * C); }
      if (!dentro(x, y + 1)) { ctx.moveTo(x * C, (y + 1) * C); ctx.lineTo((x + 1) * C, (y + 1) * C); }
      if (!dentro(x - 1, y)) { ctx.moveTo(x * C, y * C); ctx.lineTo(x * C, (y + 1) * C); }
      if (!dentro(x + 1, y)) { ctx.moveTo((x + 1) * C, y * C); ctx.lineTo((x + 1) * C, (y + 1) * C); }
    }
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(0, 0, 0, .55)';
    ctx.lineWidth = Math.max(5, C * 0.09);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(246, 230, 186, .92)';
    ctx.lineWidth = Math.max(2.5, C * 0.045);
    ctx.stroke();
    ctx.restore();
  }

  /** O caminho: linha pelos centros e anel no destino (o custo em pés já vai no cartão que segue o cursor). */
  linhaDoCaminho(ctx, path) {
    const C = this.casa;
    const pts = path.map((p) => this.center(p.x, p.y));
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0].sx, pts[0].sy);
    for (const p of pts.slice(1)) ctx.lineTo(p.sx, p.sy);
    ctx.strokeStyle = 'rgba(0, 0, 0, .5)';
    ctx.lineWidth = Math.max(4, C * 0.08);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(200, 230, 255, .9)';
    ctx.lineWidth = Math.max(2, C * 0.035);
    ctx.setLineDash([C * 0.12, C * 0.08]);
    ctx.lineDashOffset = -this.time * C * 0.6;
    ctx.stroke();
    ctx.setLineDash([]);
    const fim = pts.at(-1);
    ctx.beginPath();
    ctx.arc(fim.sx, fim.sy, C * 0.3, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 0, 0, .5)';
    ctx.lineWidth = Math.max(4, C * 0.07);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(200, 230, 255, .95)';
    ctx.lineWidth = Math.max(2, C * 0.035);
    ctx.stroke();
    ctx.restore();
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

  // ---- a escuridão de cima: luz em raio, recortada pela parede --------------------------------------------

  /**
   * O VÉU DE CIMA. O herdado acende casa por casa e borra: de cima isso lê como uma escada de quadrados, e a tocha
   * vira um tabuleiro de xadrez. Aqui a luz é desenhada como o Foundry desenha:
   *
   * - cada fonte (tocha, fogueira, Luz do Dia) acende um CÍRCULO do tamanho do alcance dela, cheio até a luz plena
   *   e esmaecendo na penumbra, recortado pelo polígono de raios (`raios.js`): a rocha corta a luz, a luz não vaza;
   * - a visão no escuro acende o mesmo círculo a meia força, do alcance dela;
   * - a luz do mapa (a clareira de dia, `field.luz`) entra como está, com a borda borrada;
   * - tudo isso só onde algum herói tem linha de visão (o polígono dele, sem limite) E onde a regra diz que ele
   *   enxerga (a máscara de casas, um pouco dilatada): é o que faz o platô alto cortar a vista na tela também.
   *
   * E O QUE NINGUÉM VÊ É PRETO. O isométrico deixa 20% (o já visto se adivinha); de cima, com mapa pintado, os 20%
   * entregavam a caverna inteira — o desenho da FA mostra cada sala, cada baú. `veuDaEscuridao` do mapa ainda manda.
   *
   * A regra não muda: quem aparece continua decidido por `_visao` (a casa da figura tem de estar nela).
   */
  desenharEscuridao(ctx, byView) {
    const { width: w, height: h } = this.canvas;
    const C = this.casa;
    const field = this.field;
    const figuras = [];
    for (const c of byView.values()) {
      if (!c.dead && this.figuraVisivel(c) && this._visao.has(`${c.pos.x},${c.pos.y}`)) figuras.push(c);
    }
    const fontes = fontesDeLuz(this.enc);
    let grupo = this.enc.combatants.filter((c) => c.side === 'party' && !c.dead && c.pos);
    const proprios = this.filtroDeVisao ? grupo.filter(this.filtroDeVisao) : null;
    if (proprios?.length) grupo = proprios;
    const domoDe = new Map(this.fx.domosAtivos(this).filter((o) => o.it.id != null).map((o) => [o.it.id, o.it]));
    const chave = [w, h, this.ox, this.oy, C, field.versao ?? 0,
      grupo.map((c) => `${c.pos.x},${c.pos.y},${visaoNoEscuro(c)}`).join(';'),
      fontes.map((f) => `${f.pos.x},${f.pos.y},${f.claro},${f.penumbra}`).join(';'),
      figuras.map((c) => `${c.pos.x},${c.pos.y}${domoDe.has(c.id) ? 'd' : ''}`).join(';')].join('|');
    if (this._mascara?.visao !== this._visao || this._mascara.chave !== chave) {
      this._mascara = this.montarVeuDeCima(w, h, fontes, grupo, figuras, domoDe, chave);
    }
    ctx.drawImage(this._mascara.borrada, 0, 0);
    this.zonasObscurasPorCima(ctx, figuras);

    // o brilho quente do fogo, como no herdado: numa tela à parte, furado pelo mesmo véu
    const ambiente = emissoresDoAmbiente(field);
    if (!fontes.length && ambiente.vazio) return;
    const brilho = this._brilho ?? (this._brilho = document.createElement('canvas'));
    if (brilho.width !== w) brilho.width = w;
    if (brilho.height !== h) brilho.height = h;
    const bg = brilho.getContext('2d');
    bg.globalCompositeOperation = 'source-over';
    bg.clearRect(0, 0, w, h);
    bg.globalCompositeOperation = 'lighter';
    for (const f of fontes) this.pocaDeLuz(bg, f);
    desenharAmbiente(bg, this.time, (x, y) => this.center(x, y), ambiente);
    bg.globalCompositeOperation = 'destination-out';
    bg.drawImage(this._mascara.borrada, 0, 0);
    bg.globalCompositeOperation = 'source-over';
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(brilho, 0, 0);
    ctx.restore();
  }

  /** Monta o véu (uma tela preta furada onde se enxerga). Só roda quando muda quem vê, a luz, o mapa ou a câmera. */
  montarVeuDeCima(w, h, fontes, grupo, figuras, domoDe, chave) {
    const C = this.casa;
    const field = this.field;
    const tela = (nome) => {
      const telas = (this._telasDoVeu ??= {});
      const cv = telas[nome] ?? (telas[nome] = document.createElement('canvas'));
      if (cv.width !== w) cv.width = w;
      if (cv.height !== h) cv.height = h;
      const g = cv.getContext('2d');
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalCompositeOperation = 'source-over';
      g.globalAlpha = 1;
      g.filter = 'none';
      g.clearRect(0, 0, w, h);
      return [cv, g];
    };
    // os polígonos valem enquanto o mapa não muda (porta aberta, parede caída sobem `versao`)
    this._poligonos ??= criarCacheDePoligonos();
    const poligono = (ox, oy, raio, n) => this._poligonos(field, ox, oy, raio, n, `${field.versao ?? 0}`);
    const caminho = (g, pts) => {
      g.beginPath();
      g.moveTo(this.ox + pts[0] * C, this.oy + pts[1] * C);
      for (let i = 2; i < pts.length; i += 2) g.lineTo(this.ox + pts[i] * C, this.oy + pts[i + 1] * C);
      g.closePath();
    };
    const centroDe = (pos) => { const f = pos.f ?? 1; return [pos.x + f / 2, pos.y + f / 2]; };
    const diagonal = Math.hypot(field.w, field.h) + 1;

    // 1. A LUZ: quanto cada ponto está aceso (alfa), sem olhar quem vê.
    const [luz, gl] = tela('luz');
    if (field.luz) {
      // a luz do mapa por casa, borrada para a borda da clareira não sair em degrau
      const [amb, ga] = tela('amb');
      for (let y = 0; y < field.h; y++) {
        for (let x = 0; x < field.w; x++) {
          const n = field.luz[y * field.w + x];
          if (!n) continue;
          ga.fillStyle = n >= CLARO ? '#fff' : 'rgba(255,255,255,.5)';
          ga.fillRect(this.ox + x * C - 0.5, this.oy + y * C - 0.5, C + 1, C + 1);
        }
      }
      gl.filter = `blur(${Math.round(C * 0.45)}px)`;
      gl.drawImage(amb, 0, 0);
      gl.filter = 'none';
    } else {
      gl.fillStyle = '#fff';
      gl.fillRect(0, 0, w, h);
    }
    gl.globalCompositeOperation = 'lighter';
    const circulo = (ox, oy, raioCasas, paradas) => {
      const pts = poligono(ox, oy, raioCasas, 720);
      const sx = this.ox + ox * C;
      const sy = this.oy + oy * C;
      const g = gl.createRadialGradient(sx, sy, 0, sx, sy, raioCasas * C);
      for (const [p, a] of paradas) g.addColorStop(p, `rgba(255,255,255,${a})`);
      gl.fillStyle = g;
      caminho(gl, pts);
      gl.fill();
    };
    for (const f of fontes) {
      const claro = Math.max(0, f.claro) / 5;
      const total = (Math.max(0, f.claro) + f.penumbra) / 5;
      if (total <= 0) continue;
      const [ox, oy] = centroDe(f.pos);
      const k = claro / total;
      // plena até o fim da luz plena, com o degrau para a penumbra macio, e a penumbra morrendo até a borda
      circulo(ox, oy, total, claro > 0
        ? [[0, 1], [Math.max(0, k - 0.08), 1], [Math.min(1, k + 0.06), 0.55], [0.85, 0.4], [1, 0]]
        : [[0, 0.55], [0.85, 0.4], [1, 0]]);
    }
    for (const c of grupo) {
      const dv = visaoNoEscuro(c) / 5;
      if (dv <= 0) continue;
      const [ox, oy] = centroDe(c.pos);
      circulo(ox, oy, dv, [[0, 0.5], [0.88, 0.45], [1, 0]]);
    }

    // 2. QUEM VÊ: a união das linhas de visão dos heróis. O polígono não sabe de ALTURA, e a regra sabe: o platô
    // mais alto que os dois olhos corta a vista (`hasLineOfSight`). Essas casas — só essas — saem por cima, borradas.
    // A máscara de casas inteira da regra NÃO entra: ela é a derivada em degrau do traço, e era ela que fazia a
    // borda da luz sair em escada.
    const [vista, gv] = tela('vista');
    gv.fillStyle = '#fff';
    for (const c of grupo) {
      const [ox, oy] = centroDe(c.pos);
      caminho(gv, poligono(ox, oy, diagonal, 1080));
      gv.fill();
    }
    const cortes = this.casasAtrasDoAlto(grupo);
    if (cortes.size) {
      const [casas, gc] = tela('casas');
      const folga = C * 0.1;
      gc.fillStyle = '#fff';
      for (const k of cortes) {
        const [x, y] = k.split(',').map(Number);
        gc.fillRect(this.ox + x * C - folga, this.oy + y * C - folga, C + 2 * folga, C + 2 * folga);
      }
      gv.globalCompositeOperation = 'destination-out';
      gv.filter = `blur(${Math.round(C * 0.15)}px)`;
      gv.drawImage(casas, 0, 0);
      gv.filter = 'none';
    }
    gl.globalCompositeOperation = 'destination-in';
    gl.drawImage(vista, 0, 0);

    // 3. O VÉU: preto, furado pela luz que se vê e pela ficha de quem está à vista
    const [nitida, m] = tela('nitida');
    m.fillStyle = `rgba(0, 0, 0, ${this.field.veuDaEscuridao ?? 1})`;
    m.fillRect(0, 0, w, h);
    m.globalCompositeOperation = 'destination-out';
    m.drawImage(luz, 0, 0);
    m.fillStyle = '#000';
    for (const c of figuras) {
      m.globalAlpha = this._visao.get(`${c.pos.x},${c.pos.y}`) === CLARO ? 1 : 0.5;
      this.recortarFiguraDaMascara(m, c, domoDe.get(c.id));
    }
    m.globalAlpha = 1;
    const [borrada, b] = tela('borrada');
    b.filter = 'blur(1.5px)';
    b.drawImage(nitida, 0, 0);
    b.filter = 'none';
    return { nitida, borrada, visao: this._visao, chave };
  }

  /**
   * As casas que NENHUM herói vê porque um platô mais alto que os dois olhos fica no meio — o mesmo teste de altura
   * de `Battlefield.hasLineOfSight`, sem as paredes (essas o polígono já tem). Num mapa chato, nenhuma.
   */
  casasAtrasDoAlto(grupo) {
    const f = this.field;
    const chave = `${f.versao ?? 0}|${grupo.map((c) => `${c.pos.x},${c.pos.y}`).join(';')}`;
    if (this._atrasDoAlto?.chave === chave) return this._atrasDoAlto.casas;
    const casas = new Set();
    let plano = true;
    const h0 = f.heightAt(0, 0);
    for (let y = 0; y < f.h && plano; y++) for (let x = 0; x < f.w; x++) if (f.heightAt(x, y) !== h0) { plano = false; break; }
    if (!plano && grupo.length) {
      for (let y = 0; y < f.h; y++) {
        for (let x = 0; x < f.w; x++) {
          const alvo = { x, y };
          const tapada = grupo.every((c) => {
            const eye = Math.max(f.heightAt(c.pos.x, c.pos.y), f.heightAt(x, y));
            const pts = f.line(c.pos, alvo);
            for (let i = 1; i < pts.length - 1; i++) if (f.heightAt(pts[i].x, pts[i].y) > eye) return true;
            return false;
          });
          if (tapada) casas.add(`${x},${y}`);
        }
      }
    }
    this._atrasDoAlto = { chave, casas };
    return casas;
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

  /** A imagem da ficha da criatura, já carregada; `null` enquanto carrega ou se ela fica com o retrato em pixel. */
  imagemDaFicha(c) {
    const url = fichaDe(c);
    if (!url) return null;
    this.fichas ??= new Map();
    let img = this.fichas.get(url);
    if (!img) {
      img = new Image();
      img.src = url;
      this.fichas.set(url, img);
    }
    return img.complete && img.naturalWidth ? img : null;
  }

  /** A ficha: retrato recortado em círculo (ou a ficha da criatura), anel da disposição, barra de vida e nome. */
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
    const ficha = this.imagemDaFicha(c);
    if (ficha) {
      // A FICHA DA CRIATURA (`art/fichas-de-criatura.js`): a imagem já traz o anel dourado dela, e enche o disco
      // inteiro. Por fora, um fio na cor do lado — o dourado da ficha é igual para todos, e sem o fio o goblin e o
      // aliado teriam a mesma moldura.
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(ficha, sx - r * 1.04, sy - r * 1.04, r * 2.08, r * 2.08);
      ctx.strokeStyle = 'rgba(0,0,0,.6)';
      ctx.lineWidth = Math.max(3, C * 0.05);
      ctx.beginPath(); ctx.arc(sx, sy, r * 1.08, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = anel;
      ctx.lineWidth = Math.max(1.5, C * 0.028);
      ctx.beginPath(); ctx.arc(sx, sy, r * 1.08, 0, Math.PI * 2); ctx.stroke();
    } else {
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
    }

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
