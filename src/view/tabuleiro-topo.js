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

import { distanceFt, ARESTA } from '../core/grid.js';
import { temEscuridaoEm, visaoDoGrupo, fontesDeLuz, visaoNoEscuro, CLARO, aparenciaDaLuz } from '../rules/luz.js';
import { explorar } from '../rules/nevoa.js';
import { emissoresDoAmbiente, desenharAmbiente } from './ambiente.js';
import { criarCacheDePoligonos } from './raios.js';
import { SUPERFICIE } from './superficies.js';
import * as V from './vista-topo.js';
import { makePortrait } from '../art/sheet.js';
import { fichaDe } from '../art/fichas-de-criatura.js';
import atlas from '../art/folhas/cenario.json';
import urlAtlas from '../art/folhas/cenario.png';
import { hasCondition } from '../rules/conditions.js';
import { iconCanvas, temIcone } from '../art/icons.js';
import { previsaoDeAtaque, previsaoDeMagia, pct, MAGIAS_DE_ATAQUE } from '../rules/odds.js';
import { HABILIDADES_DE_ALVO, vetoDaHabilidade, previaDaHabilidade, estadoDoFurtivo } from '../rules/habilidades-alvo.js';
import { SPELLS, dadosDaMagia } from '../rules/spells.js';
import { spellAttackBonus, spellSaveDc } from '../rules/abilities.js';
import { Fx, quadro } from './fx.js';
import { desenharVolumeObscuro } from './zonas25d.js';
import { pintarZonaComArte, zonaTemArte } from './fx.js';
import { EFEITOS } from '../art/efeitos.js';

export const CASA = 64;          // o lado da casa, em pixels
const MARGEM = 24;
const ZOOM_INICIAL = 0.8;        // a abertura do mapa grande, em fração do tamanho nativo (64 px por casa)

const ANEL_ALIADO = '#d9b45a';
const ANEL_NEUTRO = '#6fa8dc';
const ANEL_INIMIGO = '#b3433a';

const imgAtlas = new Image();
imgAtlas.src = urlAtlas;

// ---- do antigo board.js: o cartão de previsão, as zonas e as legendas -------------------------------------------

// QUAL CONDIÇÃO GANHA O LUGAR NO TABULEIRO.
//
// Os ícones são de 32 px, e três lado a lado dariam 96 — uma vez e meia a
// largura de um ladrilho, por cima da criatura vizinha. Então o tabuleiro
// mostra UM, o que mais muda a próxima decisão, mais um "+N"; a lista
// completa fica no HUD. A ordem é do que tira a criatura de jogo para o que
// só a atrapalha, e as condições boas vêm por último.
const PRIORIDADE = ['inconsciente', 'paralisado', 'atordoado', 'contido', 'presoPorVinhas', 'agarrado', 'amedrontado',
  'envenenado', 'caido', 'queimando', 'amaldicoado', 'lento', 'abencoado', 'esquivando'];
// As condições sem ícone próprio que têm um PARENTE com ícone: a mão que prende vale para quem está contido ou preso nas
// vinhas, as estrelas do atordoado para quem está paralisado. As outras (cego, enfeitiçado...) ficam só no HUD.
const ICONE_DA_CONDICAO = { contido: 'agarrado', presoPorVinhas: 'agarrado', paralisado: 'atordoado' };
const iconeDe = (id) => (temIcone(id) ? id : ICONE_DA_CONDICAO[id] ?? null);
const COR_DA_CONCENTRACAO = '#8fd3ff';
/** Quanto do véu a memória tira (`rules/nevoa.js`): 0,42 deixa o chão lembrado visível e claramente no escuro. */
const NEVOA_LEMBRADA = 0.42;
/** '#rrggbb' → [r, g, b] (a cor da luz). */
const rgbDe = (hex) => {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(String(hex ?? ''));
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [255, 177, 90];
};

const peso = (id) => { const i = PRIORIDADE.indexOf(id); return i < 0 ? PRIORIDADE.length : i; };

// Objetos que se estendem por mais de uma casa. As casas vizinhas com a mesma
// superfície formam UM objeto, desenhado uma vez só. Sem isto a carroça 2x2
// saía como quatro caixotes e cada par de cavalo como dois cavalos: quatro
// cavalos na tela onde o mapa tem dois. Árvore, arbusto e pedra ficam fora de
// propósito — a mata inteira é uma mancha contínua de `T`, e agrupá-la faria
// dela uma árvore só.
const MULTICASA = new Set(['carroca', 'cavalo', 'casa', 'taverna', 'tenda',
  'altar', 'banheira', 'mesaBanquete', 'camaRei', 'portaoQuebrado']);

// Paleta do cartão de previsão. Os valores são os mesmos de `style.css`
// (--papel-2, --gold, --ink, --muted, --green, --red, --blue): o cartão é
// desenhado no canvas, logo não herda as variáveis CSS, mas tem de ler como
// parte da mesma interface de pergaminho e latão.
//
// É tinta escura sobre claro, ao contrário do mapa por baixo. Por isso o
// verde, o vermelho e o azul daqui são mais fechados que os do tabuleiro: o
// mesmo #5fd07a que brilha sobre pedra escura some sobre creme.
const CARTAO = {
  fundo: 'rgba(235, 220, 186, .94)',
  fio: 'rgba(117, 80, 26, .85)',
  luz: 'rgba(255, 252, 242, .6)',
  sombra: 'rgba(78, 56, 24, .35)',
  gold: '#8a5f1d',
  ink: '#352718',
  muted: '#7c6a4e',
  green: '#2f7a3c',
  red: '#a83420',
  blue: '#2c6a9e',
  amber: '#8a5a12',
};

export const COR_DA_ZONA = {
  // Detectar Magia: o chão onde há aura brilha em violeta.
  auraMagica: { fill: 'rgba(170,120,255,.34)', stroke: 'rgba(222,196,255,.95)' },
  graxa: { fill: 'rgba(24,20,16,.42)', stroke: 'rgba(120,104,72,.55)' },
  // as pás do moinho do Vazio: só o contorno, que a arte da FA já desenha o moinho
  paDoMoinho: { fill: 'rgba(0,0,0,0)', stroke: 'rgba(212,190,140,.7)' },
  teia: { fill: 'rgba(244,240,228,.46)', stroke: 'rgba(255,255,255,.95)' },
  aura: { fill: 'rgba(232,195,90,.06)', stroke: 'rgba(255,224,138,.38)' },
  emaranhar: { fill: 'rgba(80,150,70,.34)', stroke: 'rgba(110,232,154,.6)' },
  // Plantas Constritoras (a vinha infectada): raiz e cipó, mais terroso que a magia de druida.
  plantasConstritoras: { fill: 'rgba(72,104,52,.32)', stroke: 'rgba(132,176,88,.6)' },
  nuvemFetida: { fill: 'rgba(196,200,80,.34)', stroke: 'rgba(212,224,74,.6)' },
  crescimentoDeEspinhos: { fill: 'rgba(110,90,50,.38)', stroke: 'rgba(176,135,90,.65)' },
  raioLunar: { fill: 'rgba(110,168,232,.20)', stroke: 'rgba(170,200,240,.6)' },
  esferaFlamejante: { fill: 'rgba(224,85,60,.30)', stroke: 'rgba(232,195,90,.7)' },
  nuvemDeAdagas: { fill: 'rgba(170,182,198,.30)', stroke: 'rgba(232,238,245,.7)' },
  tempestadeDeGranizo: { fill: 'rgba(110,168,232,.22)', stroke: 'rgba(232,238,245,.55)' },
  // As três que escondem são repintadas POR CIMA da máscara de escuridão
  // (`zonasObscurasPorCima`), senão a máscara apaga a cor e viram o mesmo buraco
  // preto. A Névoa é pálida e respira (`onda`); as outras duas são pretas, com
  // a borda que as distingue: violeta na Escuridão, azul-gelo na Fome de Hadar.
  nevoaObscurecente: { fill: 'rgba(214,222,230,.7)', stroke: 'rgba(240,244,248,.65)', rgb: '214,222,230', alfa: 0.7, onda: 0.07 },
  escuridao: { fill: 'rgba(28,20,40,.85)', stroke: 'rgba(120,90,170,.6)' },
  fomeDeHadar: { fill: 'rgba(18,10,32,.85)', stroke: 'rgba(130,200,240,.65)' },
  // Silêncio: um véu azul-gelo e parado, sem brilho; a Muralha de Vento: faixa de ar claro.
  silencio: { fill: 'rgba(120,150,190,.26)', stroke: 'rgba(190,215,245,.7)' },
  muralhaDeVento: { fill: 'rgba(214,236,248,.15)', stroke: 'rgba(240,250,255,.6)' },
  muralhaDeFogo: { fill: 'rgba(224,85,60,.25)', stroke: 'rgba(255,170,90,.7)' },
  // A de PEDRA tem arte de ladrilho por cima desta cor; ela fica como o fundo que aparece enquanto
  // a imagem não chegou, e por isso é cheia e opaca, como a pedra que vai cobri-la.
  muralhaDePedra: { fill: 'rgba(96,92,88,.92)', stroke: 'rgba(168,160,150,.95)' },
  muralhaDeForca: { fill: 'rgba(170,140,255,.14)', stroke: 'rgba(206,186,255,.75)' },
  muralhaDeGelo: { fill: 'rgba(150,210,240,.30)', stroke: 'rgba(222,244,255,.85)' },
  muralhaDeEspinhos: { fill: 'rgba(92,78,46,.34)', stroke: 'rgba(150,120,70,.7)' },
  nuvemMortal: { fill: 'rgba(90,150,70,.32)', stroke: 'rgba(143,214,90,.65)' },
  guardiaoDaFe: { fill: 'rgba(255,233,168,.12)', stroke: 'rgba(255,233,168,.55)' },
  // Lote 11: a imagem quase não pinta o chão (o volume é que conta); a luz é um calor leve; o mato, um verde fraco.
  ilusaoMenor: { fill: 'rgba(199,180,255,.10)', stroke: 'rgba(199,180,255,.45)' },
  luzDoDia: { fill: 'rgba(255,240,170,.05)', stroke: 'rgba(255,244,190,.18)' },
  crescimentoDePlantas: { fill: 'rgba(70,130,60,.16)', stroke: 'rgba(110,200,100,.22)' },
  // Lote 12: as imagens e as flechas têm volume em 2.5D (`zonas25d.js`), então o chão mal se pinta;
  // a runa do Glifo paira sobre a casa e não pinta o chão (para o inimigo ela nem existe).
  imagemSilenciosa: { fill: 'rgba(199,180,255,.07)', stroke: 'rgba(199,180,255,.38)' },
  imagemMaior: { fill: 'rgba(199,180,255,.07)', stroke: 'rgba(199,180,255,.38)' },
  cordaoDeFlechas: { fill: 'rgba(216,196,154,.06)', stroke: 'rgba(216,196,154,.35)' },
  glifoDeProtecao: { fill: 'rgba(0,0,0,0)', stroke: 'rgba(0,0,0,0)' },
  // Lote 13: o Círculo Mágico tem cilindro de runas em 2.5D (`fx.js`, `cilindroCamadas`); o chão só leva um véu.
  circuloMagico: { fill: 'rgba(214,204,255,.10)', stroke: 'rgba(236,230,255,.5)' },
};

export const PAPEL_NA_AREA = {
  inimigo: { fill: 'rgba(230, 70, 50, .40)', stroke: '#ff6a4b' },
  aliado: { fill: 'rgba(240, 200, 60, .45)', stroke: '#ffd84a' },
  poupado: { fill: 'rgba(110, 200, 120, .40)', stroke: '#8ff0a0' },
};

const FONTE_NOME = "13px 'Palatino Linotype', Palatino, Georgia, serif";

const FONTE_DADO = '11px system-ui, sans-serif';

const FONTE_DADO_FORTE = '700 11px system-ui, sans-serif';

const FONTE_CHANCE = '700 19px system-ui, sans-serif';

const LEGENDA_DA_MARCA = {
  'marca-bem': 'Detectar o Bem e o Mal: o bem (+)',
  'marca-mal': 'Detectar o Bem e o Mal: o mal (x)',
  'marca-neutro': 'Detectar o Bem e o Mal: nem bem nem mal',
  'marca-armadilha': 'Encontrar Armadilhas: perigo escondido',
  'marca-alvo': 'Localizar Objeto: o que você procura',
  'marca-espia': 'Sentidos da Fera: o que o bicho viu',
  'marca-verdade': 'Zona da Verdade: não consegue mentir',
  'marca-alarme': 'Alarme: a área vigiada',
  'marca-aparencia': 'Alterar Aparência: o corpo está transformado',
  'marca-fingido': 'Fingir de Morto: parece morto',
  'marca-olho': 'Clarividência: o olho invisível viu algo aqui',
};

function umaCasa(n) {
  return n.toFixed(1).replace('.', ',');
}

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

export class TabuleiroTopo {
  constructor(canvas, opcoes) {
    const { encounter, onTileClick, onTileHover } = opcoes;

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

    // (o canvas é dimensionado por `enquadrar`: o mapa inteiro, casa de 64 px, mais a margem)


    this.zoom = 1;
    // o zoom CSS do andar anterior não pode ficar no canvas novo (de outro tamanho)
    canvas.style.width = ''; canvas.style.height = ''; canvas.style.maxWidth = ''; canvas.style.maxHeight = '';
    this.drag = null;

    // Todos os ouvintes saem juntos (`disposeCamera`): o canvas é um só para todos os encontros, e um Board antigo que ficasse
    // ouvindo clicava com a geometria do mapa anterior (o herói ia para outra casa) e limpava o realce a cada rolagem.
    this._abort = new AbortController();
    const { signal } = this._abort;
    canvas.addEventListener('mousemove', (e) => {
      if (this.drag) return;   // arrastando a câmera: não realça quadrado
      this.atualizarHover(e);
    }, { signal });
    // A rolagem do quadro (e a câmera que segue o herói) move o tabuleiro debaixo do mouse parado: o realce acompanha.
    canvas.parentElement?.addEventListener('scroll', () => this.atualizarHover(), { passive: true, signal });
    canvas.addEventListener('mouseleave', () => {
      this._ultimoMouse = null;
      this.hover = null;
      this.pointer = null;
      this.onTileHover?.(null);
    }, { signal });
    canvas.addEventListener('click', (e) => {
      if (this.dragMoved) { this.dragMoved = false; return; }  // fim de arrasto não é clique
      const t = this.tileFromEvent(e);
      if (t) this.onTileClick?.(t, e);
    }, { signal });

    // ---- botão direito: girar arrastando, menu de ações clicando ----
    // Botão direito: soltar sem arrastar abre o menu de contexto da casa
    // (a câmera não gira mais: arrastar não faz nada) (`onTileContext`: inspecionar, atacar, conversar...).
    canvas.addEventListener('contextmenu', (e) => e.preventDefault(), { signal });
    canvas.addEventListener('mousedown', (e) => {
      if (e.button !== 2) return;
      this.drag = { x: e.clientX, acc: 0, total: 0 };
      this.dragMoved = false;
      this.hover = null;
      this.pointer = null;
      canvas.style.cursor = 'grabbing';
      e.preventDefault();
    }, { signal });
    this._onDragMove = (e) => {
      if (!this.drag) return;
      const dx = e.clientX - this.drag.x;
      this.drag.x = e.clientX;
      this.drag.acc += dx;
      // Só vira arrasto depois de ~8 px ACUMULADOS: a mão treme, e um empurrão de 2 px cancelava o menu do botão direito.
      this.drag.total += Math.abs(dx);
      if (this.drag.total > 8) this.dragMoved = true;
      // Arrastar ~110 px vira a câmera um quarto de volta.
      const STEP = 110;
      while (this.drag.acc >= STEP) { this.drag.acc -= STEP; this.rotate(1); this.onCameraChange?.(); }
      while (this.drag.acc <= -STEP) { this.drag.acc += STEP; this.rotate(-1); this.onCameraChange?.(); }
    };
    this._onDragEnd = (e) => {
      if (!this.drag) return;
      this.drag = null;
      canvas.style.cursor = '';
      if (!this.dragMoved && e?.button === 2) {
        // A PORTA primeiro: ela é uma aresta, e a folha desenhada em pé cobre casas de trás da porta; sem isto, clicar nela
        // acertava uma casa longe dela e o menu de abrir e fechar nunca saía.
        // A CRIATURA vem antes de tudo: o herói parado junto de uma porta é o alvo, não a porta nem a casa de trás dele.
        const t0 = this.tileFromEvent(e);
        const { px, py } = this.pointer;
        const figura = this.casaDaFigura(px, py, null);
        const porta = figura ? null : this.portaDoPonto(e);
        const t = figura ?? (porta ? this.casaParaAPorta(porta) : (this.objetoDoPonto(e) ?? t0));
        if (t) this.onTileContext?.(t, e);
      }
      this.dragMoved = false;
    };
    addEventListener('mousemove', this._onDragMove, { signal });
    addEventListener('mouseup', this._onDragEnd, { signal });

    // ---- zoom com a roda ----
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      // O zoom vai para onde o ponteiro está, não para o canto.
      this.setZoom(this.zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15), { x: e.clientX, y: e.clientY });
      this.onCameraChange?.();
    }, { passive: false, signal });

    // ---- o tabuleiro de cima ----
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

  /**
   * A PORTA debaixo do ponteiro (o botão direito nela abre o menu de abrir e fechar), ou null: a aresta de casa mais
   * perto do ponto, se ela for porta e o ponto estiver a menos de um quinto de casa dela.
   */
  portaDoPonto(e) {
    const { px, py } = this.pontoDoEvento(e);
    const a = V.arestaNoPonto(this.field.w, this.field.h, this.casa, px - this.ox, py - this.oy);
    if (!a || a.d > 0.2) return null;
    const outra = a.lado === 'N' ? { x: a.x, y: a.y - 1 } : { x: a.x - 1, y: a.y };
    const codigo = this.field.aresta(outra.x, outra.y, a.x, a.y);
    if (codigo !== ARESTA.porta && codigo !== ARESTA.aberta) return null;
    return { a: outra, b: { x: a.x, y: a.y } };
  }

  /** De cima o objeto fica deitado na própria casa: não há corpo em pé que o clique acerte numa casa de trás. */
  objetoDoPonto() { return null; }

  /** Um quarto da casa: o quanto os efeitos sobem do centro da casa (era a meia altura do losango, 16 px). */
  get tileHalf() { return this.casa / 4; }

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
    // a NÉVOA EXPLORADA (`rules/nevoa.js`): o que se vê agora fica lembrado
    if (this._visao) explorar(this.field, this._visao);
    this.prepararLeitura();

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

    this.desenharLeitura(ctx);
    this.realce(ctx);
    this.fx.drawGround(ctx, this);

    // a parede por cima do chão e do realce, para o alcance não vazar por cima dela.
    // Com traço livre (`field.tracos`), desenha-se o traço: a aresta de casa é só a derivada que a regra usa.
    ctx.save();
    ctx.translate(this.ox, this.oy);
    // SOBRE MAPA PINTADO A PAREDE NÃO SE DESENHA: o desenho já a tem, e a linha por cima é coisa de editor (o jogador
    // via a planta inteira em ciano, até onde não enxergava). Fica só a PORTA, que abre e fecha e o desenho não sabe.
    if (comPintura) V.pintarArestas(ctx, this.field, C, false, true);
    else if (this.field.tracos?.length) V.pintarTracos(ctx, this.field.tracos, C, false, this.field.tracosTipo, this.field.portaDoTracoAberta);
    else V.pintarArestas(ctx, this.field, C, false);
    ctx.restore();

    // a metade de trás da roda dos Espíritos Guardiões, e a arma espiritual, antes das fichas
    this.drawMagiasAtivas(ctx, 'tras');
    const aVista = new Map();
    // o corpo primeiro: quem está vivo na mesma casa fica por cima dele
    const ordem = [...this.enc.combatants].sort((a, b) => Number(!a.dead) - Number(!b.dead));
    for (const c of ordem) {
      if (!c.pos) continue;
      if (this.figuraVisivel && !this.figuraVisivel(c)) continue;
      aVista.set(c.id, c);
      this.ficha(ctx, c);
    }

    this.desenharFrente(ctx, aVista);
    this.tomDaNoite(ctx, dt);

    // O VÉU, na mesma ordem do isométrico: por cima do chão e das fichas, por baixo dos efeitos e dos números.
    // `desenharEscuridao` é herdada inteira; o que muda de vista são as três peças de geometria logo abaixo.
    if (this._visao) this.desenharEscuridao(ctx, aVista);
    else this.desenharAmbienteAoLuz(ctx);
    // por cima do véu: onde o inimigo foi visto por último, o selo de cada alvo escolhido e a cruz do impossível
    this.desenharContatosPerdidos(ctx);
    this.desenharLeituraPorCima(ctx);
    this.drawMagiasAtivas(ctx, 'frente');

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
   * - na luta também não: o contorno da área alcançável saiu (2026-11-05, o dono achou feio). Quem diz até onde se
   *   vai é o CARTÃO sob o cursor (`cartaoDeMovimento`): custo, quanto resta, o terreno difícil no caminho, e
   *   "longe demais" fora do alcance;
   * - o caminho sob o cursor é uma LINHA pelos centros das casas, com um anel no destino (os pés, no cartão).
   */
  realce(ctx) {
    const { path, targets, selected, rota, escalas } = this.overlay;
    if (path?.length > 1) this.linhaDoCaminho(ctx, path, Boolean(rota && !rota.ok));
    this.marcasDaRegua(ctx, escalas, rota);
    // alvo possível: vermelho quando a ação mira inimigo, verde quando mira aliado (cura, Bênção, Armadura Arcana)
    const miraAliados = (this.modo?.kind === 'spell' && this.enc.miraAliados(this.modo.spell)) || this.modo?.kind === 'featureAlvo';
    for (const t of targets ?? []) {
      if (miraAliados) this.fillDiamond(ctx, t.pos.x, t.pos.y, 'rgba(110,200,120,.24)', '#8ff0a0');
      else this.fillDiamond(ctx, t.pos.x, t.pos.y, 'rgba(220,90,70,.26)', '#d9594a');
    }
    if (selected?.pos) this.fillDiamond(ctx, selected.pos.x, selected.pos.y, 'rgba(0,0,0,0)', '#ffd868');
    if (this.hover) this.fillDiamond(ctx, this.hover.x, this.hover.y, 'rgba(255,255,255,.05)', 'rgba(255,216,104,.55)');
  }

  /**
   * O contorno de um conjunto de casas: só os lados que dão para fora dele. É o desenho de toda área do realce que
   * não deve pintar o chão — o alcance do passo, o da arma, o da magia.
   */
  contornoDeCasas(ctx, chaves, dentro, cor, { tracejado = false } = {}) {
    const C = this.casa;
    ctx.save();
    ctx.translate(this.ox, this.oy);
    ctx.beginPath();
    for (const k of chaves) {
      const [x, y] = String(k).split(',').map(Number);
      if (!dentro(x, y)) continue;
      if (!dentro(x, y - 1)) { ctx.moveTo(x * C, y * C); ctx.lineTo((x + 1) * C, y * C); }
      if (!dentro(x, y + 1)) { ctx.moveTo(x * C, (y + 1) * C); ctx.lineTo((x + 1) * C, (y + 1) * C); }
      if (!dentro(x - 1, y)) { ctx.moveTo(x * C, y * C); ctx.lineTo(x * C, (y + 1) * C); }
      if (!dentro(x + 1, y)) { ctx.moveTo((x + 1) * C, y * C); ctx.lineTo((x + 1) * C, (y + 1) * C); }
    }
    ctx.lineCap = 'round';
    if (tracejado) ctx.setLineDash([C * 0.14, C * 0.1]);
    ctx.strokeStyle = 'rgba(0, 0, 0, .55)';
    ctx.lineWidth = Math.max(5, C * 0.09);
    ctx.stroke();
    ctx.strokeStyle = cor;
    ctx.lineWidth = Math.max(2.5, C * 0.045);
    ctx.stroke();
    ctx.restore();
  }

  // ---- a leitura do alvo ----------------------------------------------------------------------------------

  /**
   * A CAMADA DE LEITURA, recalculada a cada quadro (as contas são puras: prever custa menos que manter estado):
   * a ação escolhida no HUD (`modo`), a chance contra cada inimigo e quem esta ação não alcança (`previsoes`), a
   * área que a magia pegaria se o jogador clicasse agora (`areaMirada`) e os alvos já marcados. O cartão que segue o
   * cursor lê tudo isso. Antes só o isométrico calculava — de cima não havia área de magia nem chance de acerto.
   */
  prepararLeitura() {
    this.modo = this.modoDeAlvo();
    this.previsoes = this.modo ? this.preverInimigos(this.modo) : null;
    this.areaMirada = this.areaDaMira();
    this._escolhidos = this.alvosEscolhidos();
  }

  /** No chão, por baixo das fichas: as zonas das magias, o alcance da ação, a área mirada e quem ela pega. */
  desenharLeitura(ctx) {
    // O chão que uma magia deixou (Graxa, Teia) enquanto dura, e a BORDA da aura de quem a conjurou.
    const zonas = new Map();
    const comArte = (this.enc.zonas ?? []).filter((z) => !z.obscuro && zonaTemArte(z));
    for (const z of this.enc.zonas ?? []) {
      // A zona com arte não leva o traço casa a casa, que vira uma grade por cima do desenho: ela ganha um contorno só, depois da arte.
      const cor = COR_DA_ZONA[z.spellId] ?? COR_DA_ZONA.graxa;
      for (const k of z.casas) zonas.set(k, zonaTemArte(z) && !z.obscuro ? { fill: cor.fill, stroke: null } : cor);
    }
    for (const a of this.enc.auras ?? []) {
      const casas = new Set(this.enc.casasDaAura(a).map((t) => `${t.x},${t.y}`));
      for (const k of casas) {
        const [x, y] = k.split(',').map(Number);
        const borda = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !casas.has(`${x + dx},${y + dy}`));
        if (borda && !zonas.has(k)) zonas.set(k, COR_DA_ZONA.aura);
      }
    }
    for (const a of this.overlay.auras ?? []) zonas.set(`${a.x},${a.y}`, COR_DA_ZONA.auraMagica);
    for (const [k, z] of zonas) {
      const [x, y] = k.split(',').map(Number);
      this.fillDiamond(ctx, x, y, z.fill, z.stroke);
    }
    // Por cima da cor, a arte da magia, recortada nas casas da zona. As que escondem são pintadas depois da máscara.
    for (const z of comArte) {
      pintarZonaComArte(ctx, this, z);
      this.contornoDeCasas(ctx, z.casas, (x, y) => z.casas.has(`${x},${y}`), (COR_DA_ZONA[z.spellId] ?? COR_DA_ZONA.graxa).stroke);
    }
    // O ALCANCE da arma ou da magia em contorno, como o do passo: dourado até o alcance normal, tracejado laranja até o
    // longo (desvantagem). O chão fica limpo.
    const m = this.modo;
    if (m && m.limite > 0) {
      const origem = m.origem ?? m.actor.pos;
      const raio = Math.ceil(m.limite / 5) + 1;
      const perto = new Set();
      const longe = new Set();
      for (let y = origem.y - raio; y <= origem.y + raio; y++) {
        for (let x = origem.x - raio; x <= origem.x + raio; x++) {
          if (!this.field.inside(x, y)) continue;
          const d = distanceFt(origem, { x, y });
          if (d <= m.alcance) perto.add(`${x},${y}`);
          if (d <= m.limite) longe.add(`${x},${y}`);
        }
      }
      if (m.limite > m.alcance) this.contornoDeCasas(ctx, longe, (x, y) => longe.has(`${x},${y}`), 'rgba(236, 160, 70, .85)', { tracejado: true });
      this.contornoDeCasas(ctx, perto, (x, y) => perto.has(`${x},${y}`), 'rgba(236, 206, 120, .9)');
    }
    // A área que a magia pegaria agora (laranja; cinza e borda vermelha se não dá para conjurar ali), e quem ela pega.
    const area = this.areaMirada;
    if (area) {
      for (const k of area.casas) {
        const [x, y] = k.split(',').map(Number);
        this.fillDiamond(ctx, x, y, area.ok ? 'rgba(255,128,48,.30)' : 'rgba(150,150,160,.22)', area.ok ? 'rgba(255,170,100,.9)' : 'rgba(210,90,80,.75)');
      }
      for (const [k, papel] of area.papeis) {
        const [x, y] = k.split(',').map(Number);
        this.fillDiamond(ctx, x, y, PAPEL_NA_AREA[papel].fill, PAPEL_NA_AREA[papel].stroke);
      }
    }
    for (const k of this._escolhidos?.keys() ?? []) {
      const [x, y] = k.split(',').map(Number);
      this.fillDiamond(ctx, x, y, 'rgba(232,195,90,.35)', '#ffe08a');
    }
    for (const k of this.previsoes?.impossiveis ?? []) {
      const [x, y] = k.split(',').map(Number);
      this.tintaImpossivel(ctx, x, y);
    }
  }

  /** Por cima das fichas e do véu: o selo de cada alvo escolhido e a cruz riscando o alvo impossível. */
  desenharLeituraPorCima(ctx) {
    for (const [k, n] of this._escolhidos ?? []) {
      const [x, y] = k.split(',').map(Number);
      this.seloDeAlvo(ctx, x, y, n);
    }
    for (const k of this.previsoes?.impossiveis ?? []) {
      const [x, y] = k.split(',').map(Number);
      this.cruzImpossivel(ctx, x, y);
    }
  }

  /** O selo dourado no alto da ficha do alvo escolhido, com "×N" quando leva mais de um dardo. */
  seloDeAlvo(ctx, x, y, n) {
    const { sx, sy } = this.center(x, y);
    const cy = sy - this.casa * 0.42;
    ctx.save();
    ctx.fillStyle = '#2a2430';
    ctx.strokeStyle = '#ffe08a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx, cy, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffe08a';
    ctx.font = 'bold 12px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(n > 1 ? `×${n}` : '✓', sx, cy + 1);
    ctx.restore();
  }

  /** A cruz riscando a ficha do alvo que esta ação não alcança — a recusa chega ANTES do clique. */
  cruzImpossivel(ctx, x, y) {
    const { sx, sy } = this.center(x, y);
    const r = this.casa * 0.3;
    ctx.save();
    ctx.strokeStyle = '#e0553c';
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(sx - r, sy - r); ctx.lineTo(sx + r, sy + r);
    ctx.moveTo(sx + r, sy - r); ctx.lineTo(sx - r, sy + r);
    ctx.stroke();
    ctx.restore();
  }

  /**
   * A RÉGUA (`rules/rota.js`): cada escala é um disco numerado na casa, na ordem em que se passa; o que acontece no
   * caminho é um selo na casa — vermelho com "!" onde um inimigo leva a reação (a casa de onde se sai do alcance
   * dele), âmbar onde se entra numa região que fere ou prende.
   */
  marcasDaRegua(ctx, escalas, rota) {
    const C = this.casa;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    (escalas ?? []).forEach((p, i) => {
      const { sx, sy } = this.center(p.x, p.y);
      ctx.beginPath();
      ctx.arc(sx, sy, C * 0.17, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(20, 28, 40, .85)';
      ctx.fill();
      ctx.lineWidth = Math.max(1.5, C * 0.03);
      ctx.strokeStyle = 'rgba(200, 230, 255, .95)';
      ctx.stroke();
      ctx.fillStyle = '#e8f3ff';
      ctx.font = `bold ${Math.round(C * 0.2)}px system-ui, sans-serif`;
      ctx.fillText(String(i + 1), sx, sy + 0.5);
    });
    for (const a of rota?.avisos ?? []) {
      const { sx, sy } = this.center(a.x, a.y);
      const x = sx + C * 0.3;
      const y = sy - C * 0.3;
      ctx.beginPath();
      ctx.arc(x, y, C * 0.13, 0, Math.PI * 2);
      ctx.fillStyle = a.tipo === 'oportunidade' ? '#c4402f' : '#c98a1c';
      ctx.fill();
      ctx.lineWidth = Math.max(1, C * 0.02);
      ctx.strokeStyle = 'rgba(0, 0, 0, .6)';
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.round(C * 0.17)}px system-ui, sans-serif`;
      ctx.fillText('!', x, y + 0.5);
    }
    ctx.restore();
  }

  /** O caminho: linha pelos centros e anel no destino (o custo em pés já vai no cartão que segue o cursor). Vermelha: não chega. */
  linhaDoCaminho(ctx, path, ruim = false) {
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
    ctx.strokeStyle = ruim ? 'rgba(255, 130, 110, .9)' : 'rgba(200, 230, 255, .9)';
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
    ctx.strokeStyle = ruim ? 'rgba(255, 130, 110, .95)' : 'rgba(200, 230, 255, .95)';
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
    // UMA PASSADA POR FORÇA DE OCLUSÃO. O telhado e a copa não podem sair na mesma tela: cada um desaparece de
    // um jeito. Então se desenha por grupo — primeiro a máscara de cor e as peças de oclusão 0 (somem), depois
    // as de 0,1 (desbotam) —, e cada grupo leva o seu furo antes de ir para o tabuleiro.
    // A PEÇA QUE SOME INTEIRA (`modo: 'peca'`): é o telhado, uma peça por casa. Enquanto houver ficha à vista
    // dentro da caixa dela, ela simplesmente não se desenha — e aí aparece a casa toda, com parede, porta e a
    // luz de dentro, em vez de um buraco redondo no meio da telha. É o modo "Roof" do Foundry, e o que faz o
    // mapa ter dinamismo: a casa se abre quando se entra nela, e fecha quando se sai.
    //
    // Quem é `modo: 'ficha'` (a copa) continua com o furo redondo, porque a copa é UMA mancha sobre o mapa
    // inteiro: sumir com ela toda tiraria a mata da aldeia. O que mudou é a força — some, não desbota.
    // QUEM LEVANTA O TELHADO É O GRUPO, não quem estiver lá dentro. Medido: um zumbi à vista debaixo de uma
    // árvore apagava a copa dela para todo mundo — e aí a árvore deixava de ser cobertura e o mapa entregava
    // o chão que ninguém devia ver. É a mesma regra do Foundry, onde a oclusão responde às fichas que VOCÊ
    // controla. O inimigo continua aparecendo: o furo redondo de `recortarFiguraDaFrente` é feito para toda
    // ficha à vista, então ele se vê debaixo da folha em vez de sumir sob ela.
    this._tapadas = new Set();
    for (const o of this.field.sobreposicoes ?? []) {
      if (!o.ligada || !o.frente || o.modo !== 'peca') continue;
      for (const c of aVista.values()) {
        if (c.side !== 'party' || c.dead) continue;
        const p = this.fx.positionFor(c.id) ?? c.pos;
        const px = Math.round(p.x);
        const py = Math.round(p.y);
        if (px >= o.x && px < o.x + o.w && py >= o.y && py < o.y + o.h && this.cobertaPelaPeca(o, px, py)) {
          this._tapadas.add(o.id);
          break;
        }
      }
    }
    const forcas = new Set([0]);
    for (const o of this.field.sobreposicoes ?? []) if (o.ligada && o.frente && !this._tapadas.has(o.id)) forcas.add(o.oclusao ?? 0);
    let primeira = true;
    for (const oclusao of [...forcas].sort((a, b) => a - b)) {
      m.globalCompositeOperation = 'source-over';
      m.clearRect(0, 0, w, h);
      m.save();
      m.translate(this.ox, this.oy);
      // a máscara derivada da cor (a folha do mapa pintado) vai junto do primeiro grupo
      if (primeira) V.pintarFrente(m, this.imgFundo, this.imgFrente, this.field, this.casa);
      V.pintarSobreposicoes(m, this.imgSobre, this.field, this.casa, true, oclusao, this._tapadas);
      m.restore();
      m.globalCompositeOperation = 'destination-out';
      for (const c of aVista.values()) this.recortarFiguraDaFrente(m, c, 1 - oclusao);
      m.globalCompositeOperation = 'source-over';
      ctx.drawImage(lona, 0, 0);
      primeira = false;
    }
  }

  /**
   * A CASA É A TELHA, NÃO A CAIXA. A peça de frente é um retângulo, e num battlemap a rua, o quintal e o
   * telhado do vizinho caem dentro desse retângulo. Medido na Árvore Trovão: com o grupo parado na rua, a duas
   * casas da parede, `_tapadas` acusava `arvoretrovao-telhado3` — a casa se abria sozinha com ninguém dentro.
   *
   * Então a peça só se apaga quando a ficha está DEBAIXO DE TELHA: alfa opaco na casa dela. A máscara sai da
   * própria arte, uma amostra por casa (a imagem desenhada numa tela de `o.w` x `o.h`), e vale para a vida
   * toda da peça. Imagem de outro domínio suja o canvas e `getImageData` lança: aí vale a caixa inteira, que é
   * o que havia antes.
   */
  cobertaPelaPeca(o, x, y) {
    const img = this.imgSobre.get(o.url);
    if (!img?.naturalWidth || !img.naturalHeight) return false;
    this._mascaraDaPeca ??= new Map();
    let m = this._mascaraDaPeca.get(o.id);
    if (!m) {
      const cv = document.createElement('canvas');
      cv.width = Math.max(1, o.w);
      cv.height = Math.max(1, o.h);
      const g = cv.getContext('2d');
      g.drawImage(img, 0, 0, cv.width, cv.height);
      try { m = g.getImageData(0, 0, cv.width, cv.height).data; }
      catch { m = new Uint8ClampedArray(cv.width * cv.height * 4).fill(255); }
      this._mascaraDaPeca.set(o.id, m);
    }
    return m[((y - o.y) * Math.max(1, o.w) + (x - o.x)) * 4 + 3] > 96;
  }

  /**
   * O furo da SALA: apaga a camada de frente em todas as casas do cômodo em que a ficha está, mais uma orla de
   * meia casa para o beiral do telhado não ficar como moldura. Devolve `false` quando a ficha não está em sala
   * nenhuma (na rua), e aí vale o furo redondo.
   */
  recortarSalaDaFrente(m, c) {
    const nome = this.field.sala?.get(`${c.pos.x},${c.pos.y}`);
    if (!nome) return false;
    this._casasDaSala ??= (() => {
      const mapa = new Map();
      for (const [k, n] of this.field.sala) {
        if (!mapa.has(n)) mapa.set(n, []);
        const [x, y] = k.split(',').map(Number);
        mapa.get(n).push({ x, y });
      }
      return mapa;
    })();
    const casas = this._casasDaSala.get(nome);
    if (!casas?.length) return false;
    const C = this.casa;
    const orla = C * 0.5;
    m.fillStyle = 'rgba(0,0,0,1)';
    for (const q of casas) {
      const { sx, sy } = this.centerF(q.x, q.y);
      m.fillRect(sx - C / 2 - orla, sy - C / 2 - orla, C + orla * 2, C + orla * 2);
    }
    return true;
  }

  /**
   * O furo da ficha na camada de frente: o disco da figura em degrau suave, mais a faixa da barra e do nome.
   * `forca` é quanto se tira: 1 abre buraco (o telhado some), 0,9 deixa 10% (a copa desbota e ainda se vê a
   * folha sobre o ombro). É o `occlusion.alpha` do Foundry, só que escrito do outro lado — lá se diz quanto
   * FICA, aqui quanto SAI.
   */
  recortarFiguraDaFrente(m, c, forca = 0.9) {
    const C = this.casa;
    const andando = this.fx.positionFor(c.id);
    const pegada = c.pos.f ?? 1;
    const meio = (pegada - 1) / 2;
    const { sx, sy } = this.centerF((andando ? andando.x : c.pos.x) + meio, (andando ? andando.y : c.pos.y) + meio);
    const r = C * pegada * 0.42;
    const g = m.createRadialGradient(sx, sy, r * 0.2, sx, sy, r * 1.55);
    g.addColorStop(0, `rgba(0,0,0,${forca})`);
    g.addColorStop(0.62, `rgba(0,0,0,${(forca * 0.91).toFixed(3)})`);
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
    const chave = [w, h, this.ox, this.oy, C, field.versao ?? 0, field.exploradoVersao ?? 0,
      grupo.map((c) => `${c.pos.x},${c.pos.y},${visaoNoEscuro(c)}`).join(';'),
      fontes.map((f) => `${f.pos.x},${f.pos.y},${f.claro},${f.penumbra},${f.angulo ?? ''},${f.direcao ?? ''}`).join(';'),
      figuras.map((c) => `${c.pos.x},${c.pos.y}${domoDe.has(c.id) ? 'd' : ''}`).join(';')].join('|');
    if (this._mascara?.visao !== this._visao || this._mascara.chave !== chave) {
      this._mascara = this.montarVeuDeCima(w, h, fontes, grupo, figuras, domoDe, chave);
    }
    ctx.drawImage(this._mascara.borrada, 0, 0);
    this.zonasObscurasPorCima(ctx, figuras);

    // o brilho quente do fogo, como no herdado: numa tela à parte, furado pelo véu SEM a memória — a fogueira de
    // uma sala que o grupo só lembra não brilha (quem garante que ainda está acesa?)
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
    bg.drawImage(this._mascara.semMemoria, 0, 0);
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
    const circulo = (ox, oy, raioCasas, paradas, fonte = null) => {
      const pts = poligono(ox, oy, raioCasas, 720);
      const sx = this.ox + ox * C;
      const sy = this.oy + oy * C;
      const g = gl.createRadialGradient(sx, sy, 0, sx, sy, raioCasas * C);
      for (const [p, a] of paradas) g.addColorStop(p, `rgba(255,255,255,${a})`);
      gl.fillStyle = g;
      gl.save();
      if (fonte) this.recortarCone(gl, fonte, sx, sy, raioCasas * C);
      caminho(gl, pts);
      gl.fill();
      gl.restore();
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
        : [[0, 0.55], [0.85, 0.4], [1, 0]], f);
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
    const [semMemoria, sm] = tela('semMemoria');
    sm.filter = 'blur(1.5px)';
    sm.drawImage(nitida, 0, 0);
    sm.filter = 'none';
    // 4. A MEMÓRIA (`rules/nevoa.js`): o chão já visto sai do preto e fica no escuro, com a borda borrada como a da
    // luz do mapa. Sem fichas: quem está lá só aparece onde alguém olha agora (`_visao`).
    const explorado = field.explorado;
    let borrada = semMemoria;
    if (explorado?.some((v) => v)) {
      const [lembrado, ge] = tela('lembrado');
      ge.fillStyle = '#fff';
      for (let y = 0; y < field.h; y++) {
        for (let x = 0; x < field.w; x++) {
          if (explorado[y * field.w + x]) ge.fillRect(this.ox + x * C - 0.5, this.oy + y * C - 0.5, C + 1, C + 1);
        }
      }
      m.globalCompositeOperation = 'destination-out';
      m.globalAlpha = NEVOA_LEMBRADA;
      m.filter = `blur(${Math.round(C * 0.3)}px)`;
      m.drawImage(lembrado, 0, 0);
      m.filter = 'none';
      m.globalAlpha = 1;
      const [comMemoria, b] = tela('borrada');
      b.filter = 'blur(1.5px)';
      b.drawImage(nitida, 0, 0);
      b.filter = 'none';
      borrada = comMemoria;
    }
    return { nitida, borrada, semMemoria, visao: this._visao, chave };
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
  /**
   * O BRILHO de uma fonte, na cor dela e com a animação dela (`rules/luz.js APARENCIA_DA_LUZ`):
   *   fogo   duas ondas que não casam: a chama treme sem repetir o compasso
   *   vela   uma onda só, lenta e pequena
   *   pulso  a luz de magia respira devagar
   *   fixa   não se mexe
   * A CHAMA tem o miolo mais claro que a cor (perto do branco) e a borda na cor cheia. A luz FRIA (magia, fungo,
   * luar) fica na cor do miolo à borda: o brilho é SOMADO ao chão, e um miolo quase branco somado à estrada marrom
   * dava bege, não azul. A lanterna coberta só brilha dentro do cone.
   */
  pocaDeLuz(bg, f) {
    const { sx, sy } = this.center(f.pos.x, f.pos.y);
    const r = (Math.max(f.claro, 5) / 5) * this.casa;
    const { cor, animacao } = aparenciaDaLuz(f);
    const t = this.time;
    const pulso = animacao === 'fogo' ? Math.sin(t * 9 + f.pos.x * 1.7) * 0.02 + Math.sin(t * 14.3 + f.pos.y * 2.9) * 0.012
      : animacao === 'vela' ? Math.sin(t * 3.1 + f.pos.x) * 0.012
        : animacao === 'pulso' ? Math.sin(t * 1.9 + f.pos.y) * 0.05
          : 0;
    const [rr, gg, bb] = rgbDe(cor);
    const chama = animacao === 'fogo' || animacao === 'vela';
    const branco = chama ? 0.35 : 0.08;
    // a cor fria soma menos ao chão marrom que a quente (o vermelho dele é o canal mais cheio): mais força, para a
    // luz de magia brilhar tanto quanto a tocha, que acende a mesma distância
    const ganho = chama ? 1 : 1.5;
    const miolo = `${Math.round(rr + (255 - rr) * branco)}, ${Math.round(gg + (255 - gg) * branco)}, ${Math.round(bb + (255 - bb) * branco)}`;
    const borda = `${rr}, ${gg}, ${bb}`;
    bg.save();
    this.recortarCone(bg, f, sx, sy, r);
    for (const [esc, forca, c] of [[0.55, 0.26 * ganho, miolo], [1, 0.10 * ganho, borda]]) {
      const g = bg.createRadialGradient(sx, sy, 3, sx, sy, r * esc);
      g.addColorStop(0, `rgba(${c}, ${forca + pulso})`);
      g.addColorStop(0.55, `rgba(${c}, ${(forca + pulso) * 0.35})`);
      g.addColorStop(1, `rgba(${borda}, 0)`);
      bg.fillStyle = g;
      bg.beginPath();
      bg.arc(sx, sy, r * esc, 0, Math.PI * 2);
      bg.fill();
    }
    bg.restore();
  }

  /** Recorta o contexto no cone da fonte (a lanterna coberta), se ela tiver um. Quem chama faz o save/restore. */
  recortarCone(g, f, sx, sy, raio) {
    const ang = Number(f.angulo);
    if (!ang || ang >= 360) return;
    const meio = ((Number(f.direcao) || 0) * Math.PI) / 180;
    const meia = (ang * Math.PI) / 360;
    g.beginPath();
    g.moveTo(sx, sy);
    g.arc(sx, sy, raio + 2, meio - meia, meio + meia);
    g.closePath();
    g.clip();
  }

  /**
   * A NOITE DA CENA (`field.escuridao`, de 0 a 1): um véu azul-escuro por cima do mapa e das fichas, que chega aos
   * poucos quando a escuridão muda (a transição do Foundry), e por baixo do brilho das luzes, que o fura. A regra
   * de quem vê é a grade de luz (`rules/luz.js definirEscuridao`); isto é só o tom.
   */
  tomDaNoite(ctx, dt) {
    const alvo = this.field.escuridao ?? 0;
    const atual = this.escuridaoVista ?? alvo;
    const passo = Math.min(1, (Number.isFinite(dt) ? dt : 0) * 0.9);
    this.escuridaoVista = Math.abs(alvo - atual) < 0.005 ? alvo : atual + (alvo - atual) * passo;
    if (this.escuridaoVista < 0.01) return;
    ctx.save();
    ctx.fillStyle = `rgba(8, 12, 34, ${0.45 * this.escuridaoVista})`;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();
  }

  retrato(look) {
    if (!this.retratos.has(look)) {
      let c = null;
      try { c = makePortrait(look, 64); } catch { c = null; }
      this.retratos.set(look, c);
    }
    return this.retratos.get(look);
  }

  /** Na luta (e não explorando, nem depois dela)? É só aí que vez e "já agiu" querem dizer alguma coisa. */
  emLuta() {
    return Boolean(this.enc) && !this.enc.over && !this.overlay?.explorando;
  }

  /** É a vez desta criatura agora? Do grupo, o herói escolhido; dos inimigos, o que a IA está jogando (`enc.agindo`). */
  agindoAgora(c) {
    if (!this.emLuta() || c.side !== this.enc.side) return false;
    return c === (this.enc.side === 'party' ? this.overlay?.selected : this.enc.agindo);
  }

  /** Do lado da vez e já agiu nesta rodada. */
  jaAgiu(c) {
    return this.emLuta() && c.side === this.enc.side && Boolean(c.acted);
  }

  /** O ícone de condição, desenhado uma vez por id (a grade de 32 px, ampliada pelo canvas da ficha). */
  iconeDaCondicao(id) {
    this.iconesDeCondicao ??= new Map();
    if (!this.iconesDeCondicao.has(id)) this.iconesDeCondicao.set(id, iconCanvas(id, 32));
    return this.iconesDeCondicao.get(id);
  }

  /**
   * AS MARCAS DA FICHA, como o Foundry as põe em cima do token:
   *   - a VEZ: um anel dourado que pulsa em quem está agindo (o herói escolhido, ou o inimigo que a IA joga);
   *   - a CONCENTRAÇÃO: um anel azul tracejado que gira devagar — é o que mais se perde de vista numa luta;
   *   - as CONDIÇÕES: até três ícones no alto, à direita do anel, da que mais muda a próxima decisão para a que só
   *     atrapalha (`PRIORIDADE`), e um "+N" com as que não couberam.
   * Quem já agiu fica apagado (`jaAgiu`, no `ficha`).
   */
  marcasDaFicha(ctx, c, sx, sy, r) {
    const C = this.casa;
    const t = this.time ?? 0;
    if (this.agindoAgora(c)) {
      ctx.save();
      ctx.globalAlpha = 0.55 + 0.35 * Math.sin(t * 4.2);
      ctx.strokeStyle = '#ffd868';
      ctx.lineWidth = Math.max(2.5, C * 0.05);
      ctx.beginPath(); ctx.arc(sx, sy, r * 1.22, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
    if (c.concentrating) {
      ctx.save();
      ctx.strokeStyle = COR_DA_CONCENTRACAO;
      ctx.lineWidth = Math.max(1.5, C * 0.03);
      ctx.setLineDash([C * 0.09, C * 0.06]);
      ctx.lineDashOffset = -t * C * 0.25;
      ctx.beginPath(); ctx.arc(sx, sy, r * 1.14, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
    const ids = [...new Set((c.conditions ?? []).map((k) => k.id))]
      .filter((id) => iconeDe(id))
      .sort((a, b) => peso(a) - peso(b));
    const icones = [...new Set(ids.map(iconeDe))];
    if (!icones.length) return;
    // três selos em arco no alto à direita, sem se encavalar: o espaço entre os centros (r · 0,62 rad) é maior que o
    // diâmetro de cada selo (lado · 1,1)
    const lado = Math.max(11, r * 0.5);
    const mostrar = icones.slice(0, 3);
    const sobra = icones.length - mostrar.length;
    const angulos = [-Math.PI * 0.42, -Math.PI * 0.22, -Math.PI * 0.02];
    ctx.save();
    ctx.globalAlpha = 1;
    mostrar.forEach((id, i) => {
      const a = angulos[i];
      const bx = sx + Math.cos(a) * r * 1.02;
      const by = sy + Math.sin(a) * r * 1.02;
      ctx.fillStyle = 'rgba(16,12,10,.88)';
      ctx.strokeStyle = 'rgba(235,220,186,.9)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(bx, by, lado * 0.58, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this.iconeDaCondicao(id), bx - lado / 2, by - lado / 2, lado, lado);
    });
    if (sobra > 0) {
      const a = Math.PI * 0.18;
      const bx = sx + Math.cos(a) * r * 1.02;
      const by = sy + Math.sin(a) * r * 1.02;
      ctx.fillStyle = 'rgba(16,12,10,.88)';
      ctx.beginPath(); ctx.arc(bx, by, lado * 0.46, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#efe8da';
      ctx.font = `700 ${Math.round(lado * 0.5)}px system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`+${sobra}`, bx, by + 1);
    }
    ctx.restore();
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

    // O QUE É PINTADO NO MAPA (o obelisco da Ânima): a arte já está no chão; o tabuleiro só põe o anel do lado, para
    // se ver que é um alvo
    if (c.pintadoNoMapa) {
      if (c.dead) return;
      ctx.save();
      ctx.strokeStyle = 'rgba(0,0,0,.6)';
      ctx.lineWidth = Math.max(3, C * 0.05);
      ctx.beginPath(); ctx.arc(sx, sy, r * 1.08, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = anel;
      ctx.lineWidth = Math.max(1.5, C * 0.028);
      ctx.setLineDash([C * 0.12, C * 0.08]);
      ctx.beginPath(); ctx.arc(sx, sy, r * 1.08, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      return;
    }
    // os ganchos de cena (a taverna: o marcador do jogador no chão e a placa com o nome em cima)
    this.aoPes?.(ctx, c, sx, sy);
    ctx.save();
    // na luta, quem do lado da vez já agiu fica em CINZA: dá para ver de relance quem ainda falta. (Só transparência
    // não servia: sobre a areia clara da estrada, 60% de opacidade quase não se nota.)
    ctx.globalAlpha = c.dead ? 0.45 : 1;
    if (!c.dead && this.jaAgiu(c)) ctx.filter = 'grayscale(0.9) brightness(0.75)';
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
        // a pintura (o retrato pintado do pronto, a imagem do herói criado) pede suavização; o pixel, vizinho
        ctx.imageSmoothingEnabled = p.style?.imageRendering === 'auto';
        ctx.imageSmoothingQuality = 'high';
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

    // as marcas do Foundry: de quem é a vez, a concentração e as condições
    if (!this.soCenario && !c.dead) this.marcasDaFicha(ctx, c, sx, sy, r);

    // `soCenario` (o fundo do título, a taverna): é cena, não jogo — sem barra de vida nem nome
    if (this.soCenario) {
      ctx.restore();
      this.aoCima?.(ctx, c, sx, sy + r);
      return;
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
    this.aoCima?.(ctx, c, sx, sy + r);
  }

  // ---- do antigo board.js: câmera, ponteiro, cartão de previsão, números e efeitos ------------------------

  setZoom(z, ancora = null) {
    const el = this.canvas;
    const quadro = el.parentElement;
    const antes = el.getBoundingClientRect();
    if (!ancora && quadro) {
      const q = quadro.getBoundingClientRect();
      ancora = { x: q.left + q.width / 2, y: q.top + q.height / 2 };
    }
    // Em que fração do tabuleiro a âncora cai, antes de mudar o tamanho.
    const fx = ancora && antes.width ? (ancora.x - antes.left) / antes.width : 0.5;
    const fy = ancora && antes.height ? (ancora.y - antes.top) / antes.height : 0.5;

    // O teto de 3x serve para o mapa que cabe na tela. Num mapa grande o canvas
    // é encaixado a 15% do tamanho nativo, e 3x disso é 46%: os heróis ficam
    // do tamanho de um selo. Aí o teto sobe até o tamanho nativo (1:1).
    this.fitWidth ??= antes.width || el.width;
    this.zoom = Math.max(0.55, Math.min(Math.max(3, el.width / this.fitWidth), z));
    if (Math.abs(this.zoom - 1) < 0.02) {
      this.zoom = 1;
      el.style.width = '';
      el.style.height = '';
      el.style.maxWidth = '';
      el.style.maxHeight = '';
    } else {
      // Mede uma vez o tamanho "encaixado" para usar de base.
      this.fitWidth ??= antes.width || el.width;
      el.style.maxWidth = 'none';
      el.style.maxHeight = 'none';
      el.style.width = `${Math.round(this.fitWidth * this.zoom)}px`;
      el.style.height = 'auto';
    }

    // Rola o quadro para a mesma fração do tabuleiro voltar para a âncora.
    // `getBoundingClientRect` já mede o tamanho novo (força o layout).
    if (ancora && quadro) {
      const depois = el.getBoundingClientRect();
      quadro.scrollLeft += depois.left + fx * depois.width - ancora.x;
      quadro.scrollTop += depois.top + fy * depois.height - ancora.y;
    }
    this.atualizarHover();
  }

  get fatorDeMapa() {
    const el = this.canvas;
    this.fitWidth ??= el.getBoundingClientRect().width || el.width;
    return el.width / this.fitWidth;
  }

  atualizarHover(e = this._ultimoMouse) {
    if (!e) return;
    let t = this.tileFromEvent(e);
    if (t && this.field.tileAt(t.x, t.y) === 1 && !this.modoDeAlvo?.()) t = null;     // parede: sem realce, a não ser que se mire nela (área de magia)
    const mudou = !this.hover || !t || this.hover.x !== t.x || this.hover.y !== t.y;
    this.hover = t;
    if (mudou) this.onTileHover?.(t);
  }

  pontoDoEvento(e) {
    const c = this.canvas;
    const r = c.getBoundingClientRect();
    return {
      px: (e.clientX - r.left - c.clientLeft) * (c.width / c.clientWidth),
      py: (e.clientY - r.top - c.clientTop) * (c.height / c.clientHeight),
    };
  }

  drawMagiasAtivas(ctx, camada) {
    const t = this.time;
    const desenha = (nome, i, sx, sy, alpha = 1) => {
      const n = EFEITOS[nome]?.quadros.length;
      if (!n) return false;
      const cv = quadro(nome, ((i % n) + n) % n);
      if (!cv) return false;
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.globalAlpha = alpha;
      ctx.drawImage(cv, Math.round(sx - cv.width / 2), Math.round(sy - cv.height / 2));
      ctx.restore();
      return true;
    };
    for (const aura of this.enc.auras ?? []) {
      const dono = aura.dono;
      if (dono.dead) continue;
      const meio = ((dono.pos.f ?? 1) - 1) / 2;
      const cx = dono.pos.x + meio;
      const cy = dono.pos.y + meio;
      // Meia-largura do quadrado, medida até o centro das casas da borda.
      const r = aura.raioFt / 5 + meio;
      const volta = 8 * r;
      // Manto do Cruzado: faíscas douradas miúdas, não os espíritos.
      const manto = aura.tipo === 'manto';
      // O espírito alado da folha j-herois; a chaminha só se ele faltar.
      const sprite = EFEITOS['espirito-guardiao'] ? 'espirito-guardiao' : 'espirito-chama';
      const n = manto ? 16 : 12;
      const posicao = (tempo, i) => {
        // Posição ao longo do perímetro, andando 1,5 casa por segundo.
        const d = (((tempo * 1.5 + (i / n) * volta) % volta) + volta) % volta;
        const lado = Math.floor(d / (2 * r));
        const k = d - lado * 2 * r - r;
        return [[k, -r], [r, k], [-k, r], [-r, -k]][lado];
      };
      for (let i = 0; i < n; i++) {
        const [ox, oy] = posicao(t, i);
        // Fora do mapa não se desenha (o clérigo encostado na borda).
        if (!this.field.inside(Math.round(cx + ox), Math.round(cy + oy))) continue;
        // Mais longe da câmera que o clérigo: atrás das figuras. Na tela, não
        // no mundo: com a câmera girada o "atrás" muda.
        const v = this.rotateVec(ox, oy);
        if ((v.dx + v.dy < 0) !== (camada === 'tras')) continue;
        const p = this.centerF(cx + ox, cy + oy);
        const sy = p.sy - 11 + Math.sin(t * 2.6 + i) * 2;
        if (manto) {
          ctx.fillStyle = 'rgba(255,233,168,.75)';
          ctx.fillRect(Math.round(p.sx) - 1, Math.round(sy) - 6, 2, 2);
          continue;
        }
        // Um rastro curto (uma posição antes, fraca): sensação de giro.
        // Os mesmos testes da chama: dentro do mapa e na mesma camada.
        for (const [atras, alfa] of [[0.15, 0.2]]) {
          const [rx, ry] = posicao(t - atras, i);
          if (!this.field.inside(Math.round(cx + rx), Math.round(cy + ry))) continue;
          const w = this.rotateVec(rx, ry);
          if ((w.dx + w.dy < 0) !== (camada === 'tras')) continue;
          const q = this.centerF(cx + rx, cy + ry);
          desenha(sprite, Math.floor((t - atras) * 8 + i * 2), q.sx, q.sy - 16 + Math.sin((t - atras) * 2.6 + i) * 2, alfa);
        }
        desenha(sprite, Math.floor(t * 8 + i * 2), p.sx, sy - 5, 0.9);
      }
    }
    // Na camada de trás: a Teia no chão, a Esfera acesa e o Raio Lunar (o
    // que está no chão fica atrás de quem está à frente dele).
    if (camada === 'tras') {
      for (const z of this.enc.zonas ?? []) {
        if (!z.centro) continue;
        const p = this.centerF(z.centro.x, z.centro.y);
        if (z.spellId === 'teia') {
          // O quadrado parte do canto: a teia vai no meio das casas dela.
          const casas = [...z.casas].map((k) => k.split(',').map(Number));
          const meio = this.centerF(casas.reduce((a, c) => a + c[0], 0) / casas.length, casas.reduce((a, c) => a + c[1], 0) / casas.length);
          const n = EFEITOS.teia?.quadros.length ?? 1;
          desenha('teia', n - 1, meio.sx, meio.sy + 4, 0.9);
        } else if (z.spellId === 'esferaFlamejante') {
          // Só os quadros de chama cheia: sem a brasa do começo nem a fumaça do fim.
          desenha('fogo-chama', [1, 2, 3, 2][Math.floor(t * 8) % 4], p.sx, p.sy - 18);
        } else if (z.spellId === 'raioLunar') {
          desenha('luz-coluna-prata', 2, p.sx, p.sy - 30, 0.45 + 0.15 * Math.sin(t * 3));
        }
      }
    }
    if (camada === 'tras') return;
    for (const c of this.enc.combatants) {
      const arma = c.magiasAtivas?.armaEspiritual;
      if (!arma || c.dead || performance.now() < (c.armaOcultaAte ?? 0)) continue;
      // Ao lado direito do alvo na tela (x+ desce à direita, y− sobe à
      // direita): não cobre a cabeça dele.
      // No mesmo ponto em que o ataque começa: a troca parada↔golpe não pula.
      const p = this.centerF(arma.pos.x + 0.3, arma.pos.y - 0.3);
      desenha('arma-parada', Math.floor(t * 6), p.sx, p.sy - 36 + Math.sin(t * 2) * 2);
    }
  }

  figuraVisivel(c) {
    // Piscar: quem está no Plano Etéreo não aparece no tabuleiro.
    if (hasCondition(c, 'etereo')) return false;
    // Quem está numa construção que o grupo não vê por dentro não aparece (mesmo sem neblina).
    if (c.side !== 'party' && this.field.fachadaFechada && this._salasReveladas !== 'todas' && c.pos) {
      const sala = this.field.sala?.get(`${c.pos.x},${c.pos.y}`);
      if (sala && !this._salasReveladas?.has(sala)) return false;
    }
    if (!this._visao || c.side === 'party') return true;
    // Criatura Grande (2 x 2): vista se QUALQUER casa da pegada está à vista.
    // Só a âncora decidia, e o dragão sumia mesmo com três das quatro casas
    // dele no campo de visão.
    const p = c.pos.f ?? 1;
    for (let j = 0; j < p; j++) {
      for (let i = 0; i < p; i++) if (this._visao.has(`${c.pos.x + i},${c.pos.y + j}`)) return true;
    }
    return false;
  }

  desenharAmbienteAoLuz(ctx) {
    const amb = emissoresDoAmbiente(this.field);
    if (amb.vazio) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    // a casa fechada de fora não entrega onde ficam as lareiras: faísca só em sala que o grupo vê
    const visivel = this.field.fachadaFechada ? (x, y) => {
      const sala = this.field.sala?.get(`${x},${y}`);
      return !sala || this._salasReveladas === 'todas' || Boolean(this._salasReveladas?.has(sala));
    } : null;
    desenharAmbiente(ctx, this.time, (x, y) => this.center(x, y), amb, visivel);
    ctx.restore();
  }

  desenharContatosPerdidos(ctx) {
    this.ultimaVista ??= new Map();
    if (!this._visao || !this.field.avisosDeVista) { this.ultimaVista.clear(); return; }
    for (const c of this.enc.combatants) {
      if (c.side !== 'foes' || !c.pos) { this.ultimaVista.delete(c.id); continue; }
      // Morreu fora da vista: a marca só SOME quando alguém vê o corpo. Apagá-la
      // na hora diria ao jogador que o bicho morreu.
      if (c.dead) { if (this.figuraVisivel(c)) this.ultimaVista.delete(c.id); continue; }
      if (this.figuraVisivel(c)) this.ultimaVista.set(c.id, { x: c.pos.x, y: c.pos.y });
    }
    for (const [id, pos] of this.ultimaVista) {
      const c = this.enc.combatants.find((x) => x.id === id);
      if (!c || c.side !== 'foes') { this.ultimaVista.delete(id); continue; }
      if (c.dead) continue;
      // A casa da marca voltou a ser vista e o bicho não está lá: a marca era
      // de um lugar que o grupo já conferiu. Sem isto o "?" ficava para sempre
      // sobre uma casa vazia e visível.
      if (this._visao.has(`${pos.x},${pos.y}`) && !this.figuraVisivel(c)) { this.ultimaVista.delete(id); continue; }
      if (this.figuraVisivel(c)) continue;
      const { sx, sy: meio } = this.center(pos.x, pos.y);
      const sy = meio + 6;   // o "?" no meio da casa (o texto sobe 6 px)
      this.fillDiamond(ctx, pos.x, pos.y, 'rgba(255,106,85,.16)', 'rgba(255,106,85,.55)');
      ctx.save();
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(0,0,0,.8)';
      ctx.fillStyle = 'rgba(255,150,130,.95)';
      ctx.strokeText('?', sx, sy - 6);
      ctx.fillText('?', sx, sy - 6);
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
      // O número "estoura" ao nascer (cresce e assenta em 0,12 s) e é maior quanto mais pesado o golpe; nos primeiros instantes é branco.
      const pop = 1 + 0.55 * Math.max(0, 1 - f.t / 0.12);
      const base = (f.big ? 23 : 17) + (f.peso - 1) * 4;
      ctx.font = `700 ${Math.round(base * pop)}px ui-monospace, monospace`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 3.5 + (f.peso - 1);
      ctx.strokeStyle = 'rgba(0,0,0,.85)';
      const ty = sy - 56 - k * 28 + f.dy;
      ctx.strokeText(f.text, sx, ty);
      ctx.fillStyle = f.t < 0.06 ? '#ffffff' : f.color;
      ctx.fillText(f.text, sx, ty);
      ctx.restore();
    }
  }

  drawCartao(ctx) {
    const t = this.hover;
    if (!t || this.drag) return;
    const cartao = this.modo ? this.cartaoDeAlvo(t) : this.cartaoDeMovimento(t);
    if (cartao) this.desenharCartao(ctx, cartao, t);
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
      // Raio Lunar, Esfera Flamejante já no chão: o limite é quanto a zona
      // anda, contado de onde ela está — não o alcance da magia.
      const zona = spell.zona?.movel && actor.magiasAtivas?.[spell.id]?.zona;
      if (zona?.centro) {
        return { kind: 'spell', actor, spell, rotulo: `Mover ${spell.name}`, origem: zona.centro, alcance: spell.zona.movel, limite: spell.zona.movel };
      }
      return {
        // A forma escolhida e as dobras marcadas vêm para a prévia: sem elas ela mostraria a reta
        // de sempre e a magia sairia em anel ou em L — a prévia tem de ser o que a magia PEGA.
        opcao: modo.opcao ?? null,
        dobras: modo.dobras?.length ? modo.dobras : null,
        kind: 'spell',
        actor,
        spell,
        rotulo: spell.name,
        // Magia não tem alcance longo: o limite é o próprio alcance.
        alcance: spell.rangeFt,
        limite: spell.rangeFt,
      };
    }
    // Cura pelas Mãos, Inspiração Bárdica: a mira pede um ALIADO (verde).
    if (modo.kind === 'featureAlvo') {
      const h = HABILIDADES_DE_ALVO[modo.featureId];
      if (!h) return null;
      return { kind: 'featureAlvo', actor, featureId: modo.featureId, rotulo: h.nome, alcance: h.alcanceFt, limite: h.alcanceFt };
    }
    return null;
  }

  preverInimigos(modo) {
    const porId = new Map();
    const impossiveis = new Set();
    if (modo.kind === 'spell' && (modo.spell.shape || this.enc.miraAliados(modo.spell))) return { porId, impossiveis };
    for (const alvo of this.enc.combatants) {
      if (alvo.dead || alvo.side === modo.actor.side || !this.figuraVisivel(alvo)) continue;
      const pv = this.preverContra(modo, alvo);
      if (!pv) continue;
      porId.set(alvo.id, pv);
      if (pv.foraDeAlcance || pv.semVisao) impossiveis.add(`${alvo.pos.x},${alvo.pos.y}`);
    }
    return { porId, impossiveis };
  }

  areaDaMira() {
    const m = this.modo;
    if (!m || m.kind !== 'spell' || !m.spell.shape || !this.hover) return null;
    const actor = m.actor;
    // O círculo escolhido conta: a Névoa em círculo maior tem área maior.
    const circulo = this.overlay.mode?.circulo ?? m.spell.level;
    const extra = { escalas: m.dobras ?? null, opcao: m.opcao ?? null };
    const casas = this.enc.casasDaZona(actor, m.spell, this.enc.areaDaMagia(actor, m.spell, this.hover, circulo, extra) ?? []);
    if (!casas.length) return null;
    const ok = this.enc.canCast(actor, m.spell.id, { point: this.hover, circulo, ...extra }).ok;
    // A mesma conta do motor: quem dorme, quem queima, quem Esculpir poupa.
    const papeis = new Map();
    let inimigos = 0;
    let aliados = 0;
    for (const { c, papel } of this.enc.afetadosPelaArea(actor, m.spell, casas, circulo)) {
      if (papel === 'inimigo') inimigos += 1;
      if (papel === 'aliado') aliados += 1;
      papeis.set(`${c.pos.x},${c.pos.y}`, papel);
    }
    return { casas: new Set(casas.map((t) => `${t.x},${t.y}`)), ok, papeis, inimigos, aliados, poupados: [...papeis.values()].filter((p) => p === 'poupado').length };
  }

  alvosEscolhidos() {
    const out = new Map();
    const modo = this.overlay.mode;
    let alvos = modo?.alvos ?? [];
    // Míssil Mágico: os dardos que sobram ao confirmar vão em rodízio para os
    // marcados — o selo mostra essa conta, não só o clique.
    const spell = modo?.kind === 'spell' ? SPELLS[modo.spellId] : null;
    if (['auto', 'raios'].includes(spell?.kind) && alvos.length) {
      const n = this.enc.alvosDaMagia(spell, modo.circulo, this.overlay.selected);
      alvos = Array.from({ length: n }, (_, i) => alvos[i % alvos.length]);
    }
    for (const a of alvos) {
      const k = `${a.pos.x},${a.pos.y}`;
      out.set(k, (out.get(k) ?? 0) + 1);
    }
    return out;
  }

  tintaImpossivel(ctx, x, y) {
    this.fillDiamond(ctx, x, y, 'rgba(224, 85, 60, .18)', 'rgba(224, 85, 60, .55)');
  }

  zonasObscurasPorCima(ctx, figuras = []) {
    const zonas = (this.enc.zonas ?? []).filter((z) => z.obscuro);
    if (!zonas.length) return;
    // O volume vai num canvas auxiliar; em volta de cada figura à vista o
    // tom é apagado com um degradê radial (suave, sem borda de bolha), então
    // não revela quem a máscara esconde.
    const w = this.canvas.width;
    const h = this.canvas.height;
    const aux = (this._zonaAux ??= document.createElement('canvas'));
    if (aux.width !== w || aux.height !== h) { aux.width = w; aux.height = h; }
    const a = aux.getContext('2d');
    a.setTransform(1, 0, 0, 1, 0, 0);
    a.globalCompositeOperation = 'source-over';
    a.clearRect(0, 0, w, h);
    a.save();
    a.lineWidth = 1.5;
    for (const z of zonas) {
      const cor = COR_DA_ZONA[z.spellId] ?? COR_DA_ZONA[z.obscuro === 'pesada' ? 'nevoaObscurecente' : 'escuridao'];
      for (const k of z.casas) {
        const [x, y] = k.split(',').map(Number);
        const borda = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !z.casas.has(`${x + dx},${y + dy}`));
        // A névoa respira: o alfa oscila devagar, defasado de casa em casa.
        const fill = cor.onda
          ? `rgba(${cor.rgb},${(cor.alfa + Math.sin(this.time * 1.4 + (x + y) * 0.7) * cor.onda).toFixed(3)})`
          : cor.fill;
        this.marcar(a, x, y, fill, borda ? cor.stroke : null);
      }
      // O volume: a esfera escura (Escuridão, Hadar) ou a nuvem de tufos (Névoa).
      if (!pintarZonaComArte(a, this, z)) desenharVolumeObscuro(a, this, z);
    }
    a.restore();
    a.globalCompositeOperation = 'destination-out';
    for (const c of figuras) {
      const { sx, sy } = this.center(c.pos.x, c.pos.y);
      const g = a.createRadialGradient(sx, sy - 30, 0, sx, sy - 30, 44);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(20 / 44, 'rgba(0,0,0,1)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      a.fillStyle = g;
      a.fillRect(sx - 44, sy - 74, 88, 88);
    }
    a.globalCompositeOperation = 'source-over';
    ctx.drawImage(aux, 0, 0);
    // `marcar` guarda contornos para o raio-X das copas; estes não entram.
    if (this._raioX) this._raioX.length = 0;
  }

  zoomBy(factor) {
    this.setZoom(this.zoom * factor);
  }

  disposeCamera() {
    this._abort?.abort();
    removeEventListener('mousemove', this._onDragMove);
    removeEventListener('mouseup', this._onDragEnd);
  }

  setOverlay(patch) {
    Object.assign(this.overlay, patch);
  }

  floatText(pos, text, color, big = false, { peso = 1, dy = 0 } = {}) {
    // Danos que chegam juntos na mesma casa (os dardos do Míssil, o golpe e a
    // chuva da Saraivada) viram um número só, somado — e não três empilhados.
    const m = /^-(\d+)$/.exec(text);
    const junto = m && this.floaters.find((f) => f.x === pos.x && f.y === pos.y && f.color === color && f.t < 0.15 && /^-\d+$/.test(f.text));
    if (junto) {
      const total = Number(junto.text.slice(1)) + Number(m[1]);
      junto.text = `-${total}`;
      junto.big = junto.big || big || total >= 10;
      return;
    }
    this.floaters.push({ x: pos.x, y: pos.y, text, color, big, t: 0, peso, dy });
  }

  bump(strength = 0.35) {
    this.shake = Math.max(this.shake, strength);
  }

  hitStop(ms) {
    this.congela = Math.max(this.congela ?? 0, ms / 1000);
  }

  marcar(ctx, x, y, fill, stroke, tracejado = false) {
    if (fill) this.fillDiamond(ctx, x, y, fill, tracejado ? null : stroke);
    if (tracejado) this.strokeDiamondTracejado(ctx, x, y, stroke);
    if (stroke && (this._copas?.get(`${x},${y}`)?.frac ?? 0) > 0.25) {
      (this._raioX ??= []).push([x, y, stroke, tracejado]);
    }
  }

  pegadaDe(x, y) {
    if (!this._pegadas) {
      this._pegadas = new Map();
      const { w, h } = this.field;
      for (let yy = 0; yy < h; yy++) {
        for (let xx = 0; xx < w; xx++) {
          const sup = this.field.surfaceAt(xx, yy);
          if (!MULTICASA.has(SUPERFICIE[sup]?.objeto) || this._pegadas.has(`${xx},${yy}`)) continue;
          const casas = [];
          const fila = [{ x: xx, y: yy }];
          const vistos = new Set([`${xx},${yy}`]);
          while (fila.length) {
            const c = fila.shift();
            casas.push(c);
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
              const n = { x: c.x + dx, y: c.y + dy };
              const k = `${n.x},${n.y}`;
              if (!vistos.has(k) && this.field.surfaceAt(n.x, n.y) === sup) {
                vistos.add(k);
                fila.push(n);
              }
            }
          }
          for (const c of casas) this._pegadas.set(`${c.x},${c.y}`, casas);
        }
      }
    }
    return this._pegadas.get(`${x},${y}`) ?? null;
  }

  tileFromEvent(e) {
    const { px, py } = this.pontoDoEvento(e);
    // Guardado em pixel interno do canvas (não de tela) porque é nele que o
    // cartão é desenhado — assim o cartão segue o cursor em qualquer zoom.
    this.pointer = { px, py };
    this._ultimoMouse = e;
    const t = this.casaNoPonto(px, py);
    return this.casaDaFigura(px, py, t) ?? t;
  }

  casaParaAPorta(porta) {
    const livre = (c) => !this.enc.at(c.x, c.y);
    const vista = (c) => !this._visao || this._visao.has(`${c.x},${c.y}`);
    const perto = (c) => Math.min(...this.enc.combatants.filter((o) => o.side === 'party' && o.pos).map((o) => Math.abs(o.pos.x - c.x) + Math.abs(o.pos.y - c.y)), 99);
    const lado = [porta.a, porta.b].sort((p, q) => ((vista(q) - vista(p)) || (livre(q) - livre(p)) || (perto(p) - perto(q))));
    return lado[0];
  }

  strokeDiamondTracejado(ctx, x, y, stroke) {
    const { sx, sy } = this.iso(x, y);
    ctx.save();
    ctx.setLineDash([5, 4]);
    this.diamond(ctx, sx, sy);
    ctx.strokeStyle = stroke;
    ctx.stroke();
    ctx.restore();
  }

  preverContra(modo, alvo) {
    if (modo.kind === 'attack') {
      const p = previsaoDeAtaque(this.enc, modo.actor, alvo, modo.weaponId);
      const fu = estadoDoFurtivo(this.enc, modo.actor, p);
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
        // Vantagem e desvantagem juntas se anulam, e o jogador precisa ler isso.
        anulados: Boolean(p.mods.advantage && p.mods.disadvantage),
        motivos: p.motivos,
        dc: null,
        dano: p.perfil.damage,
        danoTipo: p.perfil.type,
        // O Ataque Furtivo (automático): se este golpe o leva, ou por que não.
        // Sem linha de visão ou fora de alcance (à distância) não há golpe, logo não há furtivo.
        furtivo: fu?.aplica ? p.furtivo : null,
        estadoFurtivo: fu,
      };
    }
    if (modo.kind === 'spell') {
      const circulo = this.overlay.mode?.circulo ?? modo.spell.level;
      const p = previsaoDeMagia(this.enc, modo.actor, alvo, modo.spell, {
        atkBonus: spellAttackBonus(modo.actor) ?? 0,
        dc: spellSaveDc(modo.actor) ?? 10,
        circulo,
      });
      // `previsaoDeMagia` devolve os motivos, mas não de que lado eles pesam;
      // a mesma conta pura diz isso, e o cartão precisa da direção.
      const mods = MAGIAS_DE_ATAQUE.includes(modo.spell.kind)
        ? this.enc.attackModifiers(modo.actor, alvo, { ranged: !modo.spell.melee })
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
        dano: modo.spell.damage ? dadosDaMagia(modo.spell, { nivel: modo.actor.level ?? 1, circulo }) : null,
        danoTipo: modo.spell.damageType ?? null,
      };
    }
    return null;
  }

  cartaoDeAlvo(t) {
    const modo = this.modo;
    const quem = this.enc.at(t.x, t.y);
    // Quem o grupo não vê é chão vazio para o cartão: mostrar a chance já o entregaria.
    const alvo = quem && this.figuraVisivel(quem) ? quem : null;
    const linhas = [];
    const avisos = [];

    // Cura pelas Mãos / Inspiração Bárdica: o cartão diz o que o clique faria
    // no aliado sob o cursor (quanto cura, quanto sobra da reserva) ou por que não.
    if (modo.kind === 'featureAlvo') {
      const id = modo.featureId;
      if (!quem || quem.side !== modo.actor.side || !alvo) {
        avisos.push({ texto: 'clique num aliado aceso', cor: CARTAO.muted });
        return { titulo: modo.rotulo, subtitulo: null, destaque: null, linhas, avisos };
      }
      const veto = vetoDaHabilidade(this.enc, modo.actor, id, quem);
      const p = previaDaHabilidade(this.enc, modo.actor, id, quem);
      let destaque = null;
      if (id === 'layOnHands') {
        destaque = { rotulo: 'cura', valor: `+${p.cura} PV`, cor: veto ? CARTAO.muted : CARTAO.green };
        linhas.push({ rotulo: 'faltam', valor: `${p.falta} PV` });
        linhas.push({ rotulo: 'reserva', valor: `${p.reserva} → ${p.restaria}`, cor: CARTAO.gold });
        linhas.push({ rotulo: 'PV', valor: `${Math.max(0, quem.hp)}/${quem.maxHp}` });
      } else {
        destaque = { rotulo: 'dado', valor: p.dado ?? '', cor: veto ? CARTAO.muted : CARTAO.green };
        linhas.push({ rotulo: 'cargas', valor: `${p.cargas} → ${p.restaria}`, cor: CARTAO.gold });
      }
      if (veto) avisos.push({ texto: `não dá: ${veto}`, cor: CARTAO.red });
      return { titulo: quem.name, subtitulo: `${modo.rotulo} · ${distanceFt(modo.actor.pos, quem.pos)} pés`, destaque, linhas, avisos };
    }

    // Quadrado vazio (ou aliado): o que o jogador precisa ali é só saber se a
    // ação alcança aquele ponto.
    if (!alvo || alvo.side === modo.actor.side || this.areaMirada) {
      const d = distanceFt(modo.origem ?? modo.actor.pos, { x: t.x, y: t.y });
      linhas.push({ rotulo: modo.origem ? 'distância da zona' : 'distância', valor: `${d} pés` });
      const a = this.areaMirada;
      if (a) {
        linhas.push({ rotulo: 'inimigos na área', valor: `${a.inimigos}`, cor: a.inimigos ? CARTAO.gold : undefined });
        if (a.aliados) avisos.push({ texto: `${a.aliados} aliado${a.aliados > 1 ? 's' : ''} na área!`, cor: CARTAO.amber });
        if (a.poupados) avisos.push({ texto: `${a.poupados} poupado${a.poupados > 1 ? 's' : ''} por Esculpir Magias`, cor: CARTAO.green });
        if (!a.ok) {
          const why = this.enc.canCast(modo.actor, modo.spell.id, { point: t, circulo: this.overlay.mode?.circulo }).why;
          avisos.push({ texto: `não dá: ${why}`, cor: CARTAO.red });
        }
        return { titulo: modo.rotulo, subtitulo: 'área da magia', destaque: null, linhas, avisos };
      }
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

    // O dano médio e o esperado já somam o furtivo (`previsaoDeAtaque`); a linha de dano o mostra.
    if (pv.dano) linhas.push({ rotulo: 'dano', valor: `${pv.dano} ${pv.danoTipo ?? ''}${pv.furtivo ? ` + ${pv.furtivo} furtivo` : ''}`.trim() });
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
    if (pv.anulados) avisos.push({ texto: `vantagem e desvantagem se anulam${motivos}`, cor: CARTAO.amber });
    // Ataque Furtivo: automático, mas o jogador precisa VER que vale (ou por que não).
    if (pv.estadoFurtivo) {
      const fu = pv.estadoFurtivo;
      avisos.push({ texto: fu.aplica ? `Ataque Furtivo +${fu.dado} neste golpe` : fu.texto, cor: fu.aplica ? CARTAO.gold : CARTAO.muted });
    }

    return {
      titulo: alvo.name,
      subtitulo: `${modo.rotulo} · ${pv.dist} pés`,
      destaque,
      linhas,
      avisos,
    };
  }

  cartaoDeMovimento(t) {
    const actor = this.overlay.selected;
    const alvo = this.enc.at(t.x, t.y);
    // A coluna de luz de uma magia de utilidade: a cor sozinha não diz o que é (legenda na dica).
    const marca = (this.overlay.marcas ?? []).find((k) => k.x === t.x && k.y === t.y);
    const legenda = marca ? LEGENDA_DA_MARCA[marca.cor] : null;
    const ponto = !alvo && (this.overlay.pontos ?? []).find((k) => k.x === t.x && k.y === t.y);
    if (ponto) return { titulo: ponto.nome, subtitulo: 'botão direito: examinar', destaque: null, linhas: [], avisos: [] };
    if (legenda && !alvo) {
      return { titulo: marca.nome ?? 'Marca', subtitulo: legenda, destaque: null, linhas: [], avisos: [] };
    }

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
        avisos: legenda ? [{ texto: legenda, cor: CARTAO.gold }] : [],
      };
    }

    const reach = this.overlay.reachable;
    if (!reach || !actor) return null;
    const node = reach.get(`${t.x},${t.y}`);
    const sobra = actor.movementLeftFt ?? 0;
    if (!node) {
      // Fora do alcance: só na luta (explorando, o passo é de 60 pés e o cartão viraria ruído) e só no chão.
      if (this.overlay.explorando || this.field.blocksMove(t.x, t.y)) return null;
      // O custo do caminho de verdade, com um teto de uma Disparada a mais: a reta diz pouco quando há mato no meio.
      const disparada = this.enc.speedOf?.(actor) ?? actor.speedFt ?? 30;
      const longe = this.alcanceAlem(actor, reach, sobra + disparada).get(`${t.x},${t.y}`);
      const avisos = [];
      if (longe && !actor.actionUsed) avisos.push({ texto: 'dá com Disparada (gasta a ação)', cor: CARTAO.amber });
      if (!longe) avisos.push({ texto: 'nem com Disparada', cor: CARTAO.muted });
      return {
        titulo: 'longe demais',
        subtitulo: null,
        destaque: longe
          ? { rotulo: 'caminho', valor: `${longe.cost} pés`, cor: CARTAO.red }
          : { rotulo: 'distância', valor: `${distanceFt(actor.pos, t)} pés`, cor: CARTAO.red },
        linhas: [{ rotulo: 'movimento', valor: `${sobra} pés` }],
        avisos,
      };
    }
    if (node.cost <= 0) return null;
    // A RÉGUA (`rules/rota.js`): com escalas, o custo é o da rota por elas; e o que acontece no caminho vai embaixo.
    const rota = this.overlay.rota;
    const fim = rota?.caminho?.at(-1);
    const daRota = rota && (rota.ate ? rota.ate.x === t.x && rota.ate.y === t.y : fim?.x === t.x && fim?.y === t.y);
    const perigos = daRota ? rota.avisos.map((a) => ({ texto: a.texto, cor: a.tipo === 'oportunidade' ? CARTAO.red : CARTAO.amber })) : [];
    if (daRota && rota.escalas.length) {
      const n = rota.escalas.length;
      return {
        titulo: rota.ok ? 'mover pelas escalas' : 'longe demais pelas escalas',
        subtitulo: `${n} escala${n > 1 ? 's' : ''} · Esc desfaz a última`,
        destaque: rota.ok
          ? { rotulo: 'custo', valor: `${rota.custo} pés`, cor: CARTAO.blue }
          : { rotulo: 'movimento', valor: `${sobra} pés`, cor: CARTAO.red },
        linhas: rota.ok ? [{ rotulo: 'restam', valor: `${rota.restante} pés` }] : [],
        avisos: perigos,
      };
    }
    const avisos = [...this.porQueCustaMais(reach, node, actor).map((texto) => ({ texto, cor: CARTAO.amber })), ...perigos];
    if (!node.parar) avisos.push({ texto: 'só de passagem: não dá para parar aqui', cor: CARTAO.red });
    return {
      titulo: 'mover',
      subtitulo: null,
      destaque: { rotulo: 'custo', valor: `${node.cost} pés`, cor: CARTAO.blue },
      linhas: [{ rotulo: 'restam', valor: `${Math.max(0, sobra - node.cost)} pés` }],
      avisos,
    };
  }

  /** O alcance com teto maior, calculado uma vez por alcance mostrado (ele muda a cada passo, não a cada quadro). */
  alcanceAlem(actor, reach, orcamentoFt) {
    if (this._alem?.reach !== reach) {
      this._alem = { reach, mapa: this.enc.reachableFor?.(actor, { orcamentoFt }) ?? new Map() };
    }
    return this._alem.mapa;
  }

  /**
   * O que encareceu o caminho até `node`, passo a passo: cada casa que custou mais de 5 pés diz por quê. A conta é a
   * do motor (`grid.costOf`, já somada no `cost` de cada nó); aqui só se lê a diferença de um passo ao outro e se dá
   * nome a ela — criatura atravessada, subida, ou terreno difícil (o do mapa e o de magia, que o desenho não separa).
   */
  porQueCustaMais(reach, node, actor) {
    const extra = { dificil: 0, criatura: 0, subida: 0 };
    const rasteja = this.enc.rastejando?.(actor);
    for (let n = node; n?.from; ) {
      const antes = reach.get(n.from);
      if (!antes) break;
      let aMais = n.cost - antes.cost - 5 - (rasteja ? 5 : 0);
      if (aMais > 0) {
        const subida = Math.max(0, this.field.heightAt(n.x, n.y) - this.field.heightAt(antes.x, antes.y)) * 5;
        const sobe = Math.min(aMais, subida);
        extra.subida += sobe;
        aMais -= sobe;
        const quem = this.enc.at(n.x, n.y);
        if (quem && quem !== actor) extra.criatura += aMais;
        else extra.dificil += aMais;
      }
      n = antes;
    }
    const frases = [];
    if (extra.dificil) frases.push(`terreno difícil: +${extra.dificil} pés`);
    if (extra.criatura) frases.push(`atravessa criatura: +${extra.criatura} pés`);
    if (extra.subida) frases.push(`escalada: +${extra.subida} pés`);
    if (rasteja) frases.push('rastejando: cada passo custa o dobro');
    return frases;
  }

  /** O retângulo do canvas que o quadro mostra agora, em pixels do canvas (o mapa inteiro, quando não há rolagem). */
  areaVisivel() {
    const el = this.canvas;
    const quadro = el.parentElement;
    const r = el.getBoundingClientRect();
    if (!quadro || !r.width) return { x0: 0, y0: 0, x1: el.width, y1: el.height };
    const q = quadro.getBoundingClientRect();
    const k = el.width / r.width;
    return {
      x0: Math.max(0, (q.left - r.left) * k),
      y0: Math.max(0, (q.top - r.top) * k),
      x1: Math.min(el.width, (q.right - r.left) * k),
      y1: Math.min(el.height, (q.bottom - r.top) * k),
    };
  }

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
    // Cabe no que SE VÊ, não no canvas: com o mapa ampliado e rolado, a borda do canvas está longe da do quadro, e o
    // cartão de uma casa na beirada de cima sumia fora da vista.
    const v = this.areaVisivel();
    let bx = px + GAP;
    let by = py - bh - GAP;
    if (bx + bw > v.x1 - 6) bx = px - GAP - bw;
    if (by < v.y0 + 6) by = py + GAP;
    bx = Math.max(v.x0 + 6, Math.min(bx, v.x1 - bw - 6));
    by = Math.max(v.y0 + 6, Math.min(by, v.y1 - bh - 6));

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

  corDaChance(p) {
    if (p >= 0.65) return CARTAO.green;
    if (p >= 0.4) return CARTAO.gold;
    return CARTAO.red;
  }
}

