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

import { EFEITOS } from '../art/efeitos.js';
import '../art/efeitos-variantes.js';
import { PALETA } from '../art/icons.js';

const EASE_OUT = (k) => 1 - (1 - k) * (1 - k);

// Quadros de efeito (folhas do OpenArt convertidas em grade): um canvas por
// quadro, feito uma vez. O desenho é 1:1, como as figuras do tabuleiro.
const quadrosCache = new Map();
export function quadro(nome, i) {
  const ef = EFEITOS[nome];
  if (!ef) return null;
  const k = `${nome}|${i}`;
  let cv = quadrosCache.get(k);
  if (!cv) {
    const grade = ef.quadros[i];
    cv = document.createElement('canvas');
    // Quadro pode ser mais largo que alto (a onda de choque, a névoa).
    cv.width = grade[0].length;
    cv.height = grade.length;
    const c = cv.getContext('2d');
    for (let y = 0; y < grade.length; y++) {
      for (let x = 0; x < grade[y].length; x++) {
        const cor = PALETA[grade[y][x]];
        if (!cor) continue;
        c.fillStyle = cor;
        c.fillRect(x, y, 1, 1);
      }
    }
    quadrosCache.set(k, cv);
  }
  return cv;
}

/** Quantos quadros tem um efeito (0 se ele não existe). */
export const temEfeito = (nome) => EFEITOS[nome]?.quadros.length ?? 0;
const EASE_IN_OUT = (k) => (k < 0.5 ? 2 * k * k : 1 - ((-2 * k + 2) ** 2) / 2);
const TAU = Math.PI * 2;

/** Altura, em pixels, do "peito" de uma figura acima do centro do quadrado. */
export const CHEST = 32;

/**
 * Jeitos de atravessar um quadrado.
 *
 * O caminho é o mesmo para todo mundo; o que diferencia um espectro de um
 * zumbi e de uma aranha é o RITMO. Separar o ritmo do caminho é o que permite
 * reaproveitar a mesma interpolação em seis criaturas sem copiar código.
 *
 * - `tempo(k)`    remapeia o tempo global: aceleração, parada seca.
 * - `passoFrac(frac, idx)` remapeia DENTRO de um quadrado: arrasto, surto.
 * - `lift(f, t)`  altura em pixels (f = posição contínua em quadrados).
 * - `lateral(f, t)` desvio perpendicular ao avanço, em quadrados.
 * - `squash(f, t)` escala vertical pedida ao tabuleiro (ver relatório).
 */
const ANDARES = {
  // Passo normal: o balancinho por quadrado é o que faz ler como passo e não
  // como deslize. É o andar herdado, não mexa nos números.
  passo: { tps: 6.5, lift: (f) => Math.abs(Math.sin(f * Math.PI)) * 3 },

  // Gosma: avança em surtos, achatando no empurrão e esticando ao escorrer.
  // Sem balanço nenhum — qualquer sobe-e-desce devolveria pernas à criatura.
  rastejar: {
    tps: 3,
    lift: () => 0,
    passoFrac: (frac) => EASE_OUT(frac),
    squash: (f) => 1 - 0.22 * Math.sin((f % 1) * Math.PI),
  },

  // Aranha: três toques de pata por quadrado e tremor lateral que nunca para.
  // O tremor é o que dá o nojo; a velocidade sozinha só parece pressa.
  aranha: {
    tps: 9,
    lift: (f) => Math.abs(Math.sin(f * Math.PI * 3)) * 2,
    lateral: (_f, t) => Math.sin(t * 38) * 0.03,
  },

  // Stirge: voa alto e nunca em linha reta. Duas frequências somadas porque
  // uma só lê como pêndulo, e pêndulo não é nervoso.
  voo: {
    tps: 7,
    lift: (_f, t) => 16 + Math.sin(t * 17) * 5,
    lateral: (_f, t) => Math.sin(t * 26) * 0.09 + Math.sin(t * 11) * 0.04,
  },

  // Criatura Grande: sai do zero acelerando e chega no último instante. Os
  // 14% finais são a parada seca — é a pausa que comunica o peso, não a velocidade.
  investida: {
    tps: 5,
    tempo: (k) => Math.min(1, (k / 0.86) ** 2.1),
    lift: (f) => Math.abs(Math.sin(f * Math.PI)) * 1.5,
  },

  // Zumbi: uma perna sustenta pior que a outra, então um passo em cada dois
  // arrasta e afunda. O desequilíbrio é sempre para o mesmo lado.
  cambalear: {
    tps: 3.4,
    passoFrac: (frac, idx) => (idx % 2 === 0 ? EASE_IN_OUT(frac) : EASE_OUT(frac ** 1.7)),
    lift: (f) => Math.abs(Math.sin(f * Math.PI)) * (Math.floor(f) % 2 === 0 ? 1.5 : 4.5),
    lateral: (f) => Math.abs(Math.sin(f * Math.PI)) * 0.07,
  },
};

/**
 * Perfis de investida: como o corpo vai e volta ao longo do golpe.
 * `arco` é o golpe de arma; `bote` é o predador — sai disparado e recolhe devagar.
 */
const PERFIS = {
  arco: (k) => Math.sin(k * Math.PI),
  bote: (k) => (k < 0.26 ? EASE_OUT(k / 0.26) : 1 - EASE_IN_OUT((k - 0.26) / 0.74)),
};

export class Fx {
  constructor() {
    this.items = [];
    this.offsets = new Map();
    this.positions = new Map();   // id → posição CONTÍNUA em quadrados
    this.camera = { dx: 0, dy: 0 }; // tremor da tela, recalculado todo quadro
    this.tremorSink = null;        // ver ligarTremor()
  }

  clear() {
    this.items.length = 0;
    this.offsets.clear();
    this.positions.clear();
    this.camera.dx = 0;
    this.camera.dy = 0;
  }

  /**
   * Cancela efeitos presos a uma figura. Existe por causa dos efeitos em laço
   * (flutuar), que por definição não terminam sozinhos: quem liga, desliga.
   */
  cancel(id, kind = null) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      if (it.id === id && (kind === null || it.kind === kind)) this.items.splice(i, 1);
    }
    return this;
  }

  /**
   * Liga o tremor da tela a quem sabe sacudir a câmera (`board.bump`).
   * Sem isso o tremor fica guardado em `fx.camera` e cabe a quem desenha usá-lo.
   */
  ligarTremor(fn) {
    this.tremorSink = fn;
    return this;
  }

  /**
   * Soma um deslocamento ao que a figura já tem neste quadro.
   *
   * Sobrescrever seria mais curto, mas os efeitos se acumulam de verdade: a
   * maça dispara salto E investida no mesmo quadro, e um morto-vivo pode estar
   * flutuando enquanto recua. Quem sobrescreve perde um dos dois sem avisar.
   */
  _somaOffset(id, patch) {
    const cur = this.offsets.get(id);
    if (!cur) {
      this.offsets.set(id, {
        dx: 0, dy: 0, lift: 0, tilt: 0, squash: 1, alpha: 1, flash: 0, ...patch,
      });
      return;
    }
    cur.dx += patch.dx ?? 0;
    cur.dy += patch.dy ?? 0;
    cur.lift += patch.lift ?? 0;
    cur.tilt += patch.tilt ?? 0;
    cur.squash *= patch.squash ?? 1;
    cur.alpha *= patch.alpha ?? 1;
    cur.flash = Math.max(cur.flash, patch.flash ?? 0);
  }

  /** Posição interpolada de quem está andando, ou null. */
  positionFor(id) {
    return this.positions.get(id) ?? null;
  }

  /** Quanto falta, em segundos, para as caminhadas em curso terminarem. */
  get walkTimeLeft() {
    let left = 0;
    for (const it of this.items) {
      if (it.kind === 'walk') left = Math.max(left, it.dur - it.t);
    }
    return left;
  }

  add(item) {
    this.items.push({ t: 0, ...item });
    return this;
  }

  update(dt) {
    this.offsets.clear();
    this.positions.clear();
    this.camera.dx = 0;
    this.camera.dy = 0;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.t += dt;
      // Efeito em laço (flutuar) não tem fim: o tempo volta ao começo do ciclo.
      if (it.loop && it.t >= it.dur) it.t -= it.dur;
      const k = Math.min(1, it.t / it.dur);

      if (it.kind === 'walk' && it.path.length < 2) {
        // CAMINHO DE UM PONTO SÓ — e isto travava o jogo inteiro.
        //
        // Acontece quando o motor manda andar para o quadrado onde a criatura
        // já está. Aí `segs` é 0, o índice do segmento vira -1, e `path[-1]`
        // é `undefined`: a linha seguinte lia `.x` dele e lançava. Como isso
        // é dentro de `render`, que é dentro do `requestAnimationFrame`, a
        // exceção não derrubava só o quadro — derrubava o laço, e o tabuleiro
        // congelava de vez.
        //
        // Sem segmento não há o que interpolar: a figura fica onde está.
        const p = it.path[0];
        this.positions.set(it.id, { x: p.x, y: p.y, lift: 0, squash: 1, dx: 0, dy: 0 });
      } else if (it.kind === 'walk') {
        const modo = ANDARES[it.andar] ?? ANDARES.passo;
        const segs = it.path.length - 1;
        const kk = modo.tempo ? modo.tempo(k) : k;
        const bruto = Math.min(segs, kk * segs);
        const idx = Math.min(segs - 1, Math.floor(bruto));
        const frac = modo.passoFrac ? modo.passoFrac(bruto - idx, idx) : bruto - idx;
        const f = idx + frac;
        const a = it.path[idx];
        const b = it.path[idx + 1];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        // Desvio perpendicular ao avanço: é o que faz a aranha tremer e o
        // stirge zigue-zaguear sem sair do caminho que o motor autorizou.
        const lat = modo.lateral ? modo.lateral(f, it.t) : 0;
        this.positions.set(it.id, {
          x: a.x + dx * frac - dy * lat,
          y: a.y + dy * frac + dx * lat,
          lift: modo.lift(f, it.t),
          squash: modo.squash ? modo.squash(f, it.t) : 1,
          dx,
          dy,
        });
        if (idx !== it.lastStep) {
          it.lastStep = idx;
          it.onStep?.(idx);
        }
      }

      if (it.kind === 'lunge') {
        const push = (PERFIS[it.perfil] ?? PERFIS.arco)(k) * (it.reach ?? 0.38);
        this._somaOffset(it.id, { dx: it.vec.dx * push, dy: it.vec.dy * push });
      }
      if (it.kind === 'hop') {
        // Pulo curto para o golpe de cima para baixo: sobe e desce.
        this._somaOffset(it.id, { lift: Math.sin(k * Math.PI) * (it.height ?? 16) });
      }

      // Oscilação vertical contínua, sem passo: a figura não toca o chão.
      if (it.kind === 'flutuar') {
        this._somaOffset(it.id, { lift: it.altura + Math.sin(k * TAU) * it.amplitude });
      }

      // Stirge grudado: deixa o próprio quadrado e fica pousado na vítima.
      if (it.kind === 'grudar') {
        const chega = 0.18;
        const sai = 0.85;
        const avanco = k < chega ? EASE_OUT(k / chega) : k > sai ? 1 - EASE_IN_OUT((k - sai) / (1 - sai)) : 1;
        this.positions.set(it.id, {
          x: it.de.x + (it.sobre.x - it.de.x) * avanco,
          y: it.de.y + (it.sobre.y - it.de.y) * avanco,
          // Sobe para o peito da vítima e pulsa junto com a sucção.
          lift: 16 * avanco + Math.sin(it.t * 14) * 2 * avanco,
          dx: it.sobre.x - it.de.x,
          dy: it.sobre.y - it.de.y,
        });
      }

      // Recuo: o alvo é empurrado para longe de quem bateu e volta frouxo.
      if (it.kind === 'recuo') {
        const push = (k < 0.3 ? EASE_OUT(k / 0.3) : 1 - EASE_IN_OUT((k - 0.3) / 0.7)) * it.dist;
        this._somaOffset(it.id, { dx: it.vec.dx * push, dy: it.vec.dy * push });
      }

      if (it.kind === 'piscar') {
        // Dois clarões em vez de um: um só se confunde com o clarão de dano.
        this._somaOffset(it.id, { flash: Math.abs(Math.sin(k * Math.PI * 2)) * (1 - k * 0.4) });
      }

      // Derreter: a figura afunda e achata ao mesmo tempo que esmaece.
      if (it.kind === 'derreter') {
        this._somaOffset(it.id, { squash: 1 - 0.85 * EASE_IN_OUT(k), lift: -4 * k, alpha: 1 - k * 0.7 });
      }

      // Dissipar: nada de queda — some no ar subindo um pouco.
      if (it.kind === 'dissipar') {
        this._somaOffset(it.id, { lift: 14 * EASE_OUT(k), alpha: 1 - k, squash: 1 + 0.2 * k });
      }

      // Desabar: o corpo cede de uma vez, sem voltar.
      if (it.kind === 'ossos') {
        this._somaOffset(it.id, { squash: Math.max(0, 1 - EASE_IN_OUT(Math.min(1, k * 3))), alpha: Math.max(0, 1 - k * 3) });
      }

      if (it.kind === 'tremor') {
        // Duas frequências primas entre si para o tremor não parecer vibração
        // de motor; o quadrado da sobra do tempo é o que faz assentar rápido.
        const sobra = (1 - k) ** 2;
        this.camera.dx += Math.sin(it.t * 94) * it.forca * 9 * sobra;
        this.camera.dy += Math.cos(it.t * 71) * it.forca * 6 * sobra;
      }
      if (it.kind === 'projectile' && it.trail) {
        it.past ??= [];
        const e = EASE_IN_OUT(k);
        it.past.push({ x: it.from.x + (it.to.x - it.from.x) * e, y: it.from.y + (it.to.y - it.from.y) * e, lift: Math.sin(e * Math.PI) * 40 * it.arc, age: 0 });
        for (const p of it.past) p.age += dt;
        while (it.past.length && it.past[0].age > 0.22) it.past.shift();
      }

      if (it.t >= it.dur && !it.loop) {
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

  /**
   * Caminhada: a figura percorre o caminho quadrado a quadrado.
   *
   * O motor já moveu a peça — isto só conta a viagem. Enquanto dura, o
   * tabuleiro desenha a figura na posição interpolada em vez do destino.
   */
  walk(actor, path, { tilesPerSecond = null, andar = 'passo', onStep = null, onDone = null } = {}) {
    if (!path || path.length < 2) return this;
    const modo = ANDARES[andar] ?? ANDARES.passo;
    const dur = Math.max(0.14, (path.length - 1) / (tilesPerSecond ?? modo.tps));
    return this.add({
      kind: 'walk', id: actor.id, andar, path: path.map((p) => ({ ...p })),
      dur, lastStep: -1, onStep, onDone,
    });
  }

  // ---- deslocamento por criatura ------------------------------------------
  //
  // Todos são `walk` com outro ritmo, então `walkTimeLeft` continua valendo e
  // `main.js` segue esperando a viagem terminar sem saber qual criatura é.

  /** Gosma escorrendo: comunica que a coisa não tem pernas — ela se derrama. */
  rastejar(actor, path, opts = {}) {
    return this.walk(actor, path, { ...opts, andar: 'rastejar' });
  }

  /** Aranha: comunica pressa de bicho — muitas patas e nenhum peso. */
  correrAranha(actor, path, opts = {}) {
    return this.walk(actor, path, { ...opts, andar: 'aranha' });
  }

  /** Stirge: comunica voo de inseto — alto, torto e impossível de prever. */
  voar(actor, path, opts = {}) {
    return this.walk(actor, path, { ...opts, andar: 'voo' });
  }

  /** Criatura Grande: comunica massa — custa para sair e custa para parar. */
  investir(actor, path, opts = {}) {
    return this.walk(actor, path, { ...opts, andar: 'investida' });
  }

  /** Zumbi: comunica corpo quebrado — anda, mas um lado não obedece. */
  cambalear(actor, path, opts = {}) {
    return this.walk(actor, path, { ...opts, andar: 'cambalear' });
  }

  /**
   * Espectro e crânio flamejante: comunica que não há pés no chão.
   *
   * É um efeito em LAÇO — fica até alguém chamar `cancel(id, 'flutuar')`.
   * Serve para o estado parado da criatura, não para uma ação.
   */
  flutuar(actor, { altura = 7, amplitude = 4, periodo = 2.2 } = {}) {
    this.cancel(actor.id, 'flutuar');   // nunca dois laços somando altura
    return this.add({ kind: 'flutuar', id: actor.id, dur: periodo, loop: true, altura, amplitude });
  }

  // ---- ataques de criatura -------------------------------------------------

  /**
   * Bote da aranha: comunica predador — o corpo sai disparado e recolhe devagar,
   * ao contrário do golpe de arma, que vai e volta no mesmo tempo.
   */
  bote(actor, target, { dur = 0.34, reach = 0.6, color = '#dff0c0' } = {}) {
    const dx = target.x - actor.pos.x;
    const dy = target.y - actor.pos.y;
    const len = Math.hypot(dx, dy) || 1;
    this.add({ kind: 'lunge', id: actor.id, dur, reach, perfil: 'bote', vec: { dx: dx / len, dy: dy / len } });
    this.fangs(target, { color, dur: 0.2 });
    return this;
  }

  /**
   * Sugada do stirge: comunica que o bicho não bate e vai embora — ele pousa
   * na vítima e fica lá bebendo, que é o que torna o dano por turno plausível.
   */
  sugar(actor, target, { dur = 1.1, color = '#b4262a' } = {}) {
    const sobre = {
      // Pousa um pouco antes do centro do alvo, senão a figura do stirge
      // desaparece dentro da figura da vítima.
      x: target.x + (actor.pos.x - target.x) * 0.26,
      y: target.y + (actor.pos.y - target.y) * 0.26,
    };
    return this.add({ kind: 'grudar', id: actor.id, de: { ...actor.pos }, sobre, tile: { ...target }, dur, color });
  }

  /**
   * Sopro do dragão em cone: comunica que o perigo não é o alvo, é a área —
   * quem estava no caminho se explica depois.
   */
  sopro(from, to, { color = '#8ed46a', dur = 0.65, spread = 0.5, tiles = null } = {}) {
    if (tiles) this.area(tiles, { color, dur: dur * 1.2 });
    const faiscas = [];
    for (let i = 0; i < 26; i++) {
      faiscas.push({ off: (Math.random() - 0.5) * 2, atraso: Math.random() * 0.45, vel: 0.7 + Math.random() * 0.6, size: 2 + Math.random() * 4 });
    }
    return this.add({ kind: 'sopro', from: { ...from }, to: { ...to }, color, dur, spread, faiscas });
  }

  /**
   * Batida de cauda: comunica golpe que vem de baixo e de lado — varre as
   * pernas em vez de descer sobre a cabeça, por isso o arco é rente ao chão.
   */
  cauda(tile, { color = '#cbb891', dur = 0.3, angle = 0, radius = 42 } = {}) {
    this.ring(tile, { color, radius: radius * 0.8, dur: 0.35, width: 2 });
    return this.add({ kind: 'cauda', tile: { ...tile }, color, dur, angle, radius });
  }

  /**
   * Agarrão: comunica contenção, não dano — duas garras fecham e o alvo é
   * puxado para dentro, que é o que o jogador precisa entender antes de fugir.
   */
  agarrao(tile, { color = '#e8d6a8', dur = 0.38 } = {}) {
    return this.add({ kind: 'agarrao', tile: { ...tile }, color, dur });
  }

  // ---- morte ---------------------------------------------------------------

  /**
   * Desabar em ossos: comunica que aquilo nunca foi vivo — não cai, desmonta.
   * Esqueleto e crânio flamejante.
   */
  ossos(actor, { color = '#ded2b4', dur = 0.95, count = 14 } = {}) {
    const tile = actor.pos ?? actor;
    const parts = [];
    for (let i = 0; i < count; i++) {
      const a = Math.random() * TAU;
      parts.push({
        vx: Math.cos(a) * (14 + Math.random() * 26),
        vy: -30 - Math.random() * 40,
        y0: 10 + Math.random() * 34,
        len: 4 + Math.random() * 7,
        rot: (Math.random() - 0.5) * 9,
        ang: a,
      });
    }
    this.add({ kind: 'ossos-pilha', tile: { ...tile }, color, dur, parts });
    if (actor.id !== undefined) this.add({ kind: 'ossos', id: actor.id, dur: dur * 0.45 });
    return this;
  }

  /**
   * Derreter: comunica que o corpo é só matéria — perde a forma e fica a poça.
   * Gelatina ocre e limos.
   */
  derreter(actor, { color = '#c8a84a', dur = 0.85 } = {}) {
    const tile = actor.pos ?? actor;
    this.add({ kind: 'poca', tile: { ...tile }, color, dur: dur * 1.3 });
    if (actor.id !== undefined) this.add({ kind: 'derreter', id: actor.id, dur });
    return this;
  }

  /**
   * Dissipar: comunica que não havia corpo para cair — o que existia se desfaz
   * subindo. Espectro, wraith, aparição.
   */
  dissipar(actor, { color = '#9fc6ff', dur = 0.8 } = {}) {
    const tile = actor.pos ?? actor;
    this.motes(tile, { color, count: 12, dur: dur * 1.1, rise: 62, spread: 22 });
    if (actor.id !== undefined) {
      this.cancel(actor.id, 'flutuar');   // quem dissipa para de flutuar
      this.add({ kind: 'dissipar', id: actor.id, dur });
    }
    return this;
  }

  // ---- reação --------------------------------------------------------------

  /**
   * Tremor da tela: comunica peso de impacto. É a única primitiva que fala do
   * jogo todo e não de uma figura, por isso sacode a câmera, não o alvo.
   */
  tremor(forca = 0.5, { dur = 0.34 } = {}) {
    if (this.tremorSink) this.tremorSink(forca);
    return this.add({ kind: 'tremor', forca, dur });
  }

  /**
   * Recuo do alvo: comunica para onde a força foi. Sem isso o golpe acontece
   * no atacante e o alvo só perde número.
   */
  recuo(target, from, { dur = 0.26, dist = 0.3 } = {}) {
    const alvo = target.pos ?? target;
    const dx = alvo.x - from.x;
    const dy = alvo.y - from.y;
    const len = Math.hypot(dx, dy) || 1;
    return this.add({ kind: 'recuo', id: target.id, dur, dist, vec: { dx: dx / len, dy: dy / len } });
  }

  /**
   * Piscar: comunica "foi este aqui" quando nada se move — resistiu, falhou no
   * salvamento, recebeu condição. Dois clarões, para não virar clarão de dano.
   */
  piscar(target, { dur = 0.34, color = '#ffffff' } = {}) {
    const tile = target.pos ?? target;
    this.add({ kind: 'clarao', tile: { ...tile }, color, dur });
    if (target.id !== undefined) this.add({ kind: 'piscar', id: target.id, dur });
    return this;
  }

  // ---- projéteis ----------------------------------------------------------

  projectile(from, to, {
    color = '#ffe9b0', style = 'arrow', dur = 0.26, arc = 0.5,
    trail = false, spin = false, onDone = null, sprite = null, fps = 14,
  } = {}) {
    return this.add({ kind: 'projectile', from: { ...from }, to: { ...to }, color, style, dur, arc, trail, spin, onDone, sprite, fps });
  }

  beam(from, to, { color = '#bfe6ff', dur = 0.22, width = 3, jagged = true } = {}) {
    return this.add({ kind: 'beam', from: { ...from }, to: { ...to }, color, dur, width, jagged });
  }

  // ---- impactos -----------------------------------------------------------

  /**
   * Efeito de quadros tocado uma vez sobre um quadrado (a explosão do Raio de
   * Fogo, o estouro de gelo). `altura` é quanto acima do chão o centro fica.
   * `sumir` (segundos): segura o último quadro e esmaece, para efeito que
   * termina cheio (a poça de graxa) não sumir de estalo.
   */
  quadros(tile, nome, { fps = 14, altura = CHEST, sumir = 0 } = {}) {
    const n = temEfeito(nome);
    if (!n) return this;
    const anim = n / fps;
    return this.add({ kind: 'quadros', tile: { ...tile }, nome, n, anim, dur: anim + sumir, altura });
  }

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

      if (it.kind === 'poca') {
        // A poça cresce enquanto a figura afunda e só então começa a secar:
        // é a sequência que conta "isto aqui era a criatura".
        const { sx, sy } = board.centerF(it.tile.x, it.tile.y);
        const r = 10 + 16 * EASE_OUT(Math.min(1, k / 0.45));
        ctx.save();
        ctx.globalAlpha = k < 0.55 ? 0.8 : 0.8 * (1 - (k - 0.55) / 0.45);
        ctx.fillStyle = it.color;
        ctx.beginPath();
        ctx.ellipse(sx, sy, r, r * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();
        // Brilho em cima da poça: sem ele a mancha lê como buraco.
        ctx.globalAlpha *= 0.5;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(sx - r * 0.3, sy - r * 0.12, r * 0.3, r * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (it.kind === 'cauda') {
        // Arco longo e achatado passando rente ao chão, com poeira atrás.
        const { sx, sy } = board.centerF(it.tile.x, it.tile.y);
        const varre = -0.9 + 1.8 * EASE_OUT(k);
        ctx.save();
        ctx.globalAlpha = Math.sin(Math.min(1, k * 1.2) * Math.PI);
        ctx.translate(sx, sy - 6);
        ctx.rotate(it.angle);
        ctx.strokeStyle = it.color;
        ctx.lineWidth = 5 * (1 - k * 0.6);
        ctx.beginPath();
        ctx.ellipse(0, 0, it.radius, it.radius * 0.3, 0, varre - 0.8, varre + 0.2);
        ctx.stroke();
        ctx.globalAlpha *= 0.5;
        ctx.fillStyle = '#d8c9a8';
        for (let i = 0; i < 5; i++) {
          const a = varre - 0.8 + (i / 5) * 0.9;
          ctx.fillRect(Math.cos(a) * it.radius, Math.sin(a) * it.radius * 0.3 - i, 3, 3);
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
          if (it.style === 'sprite' && temEfeito(it.sprite)) {
            // O projétil desenhado aponta para a direita: gira para o ângulo
            // NA TELA, inclinando com o arco de subida e descida.
            const naTela = (ee) => {
              const q = board.centerF(it.from.x + (it.to.x - it.from.x) * ee, it.from.y + (it.to.y - it.from.y) * ee);
              return { x: q.sx, y: q.sy - CHEST - Math.sin(ee * Math.PI) * 40 * it.arc };
            };
            const p1 = naTela(Math.min(e, 0.98));
            const p2 = naTela(Math.min(e, 0.98) + 0.02);
            const angTela = Math.atan2(p2.y - p1.y, p2.x - p1.x);
            const n = temEfeito(it.sprite);
            const cv = quadro(it.sprite, Math.floor(it.t * (it.fps ?? 14)) % n);
            ctx.rotate(angTela);
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(cv, -Math.round(cv.width * 0.75), -Math.round(cv.height / 2));
          } else if (it.style === 'arrow') {
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

        case 'quadros': {
          const { sx, sy } = at(it.tile);
          const t = k * it.dur;
          const cv = quadro(it.nome, Math.min(it.n - 1, Math.floor((t / it.anim) * it.n)));
          if (!cv) break;
          ctx.save();
          ctx.imageSmoothingEnabled = false;
          if (t > it.anim) ctx.globalAlpha = Math.max(0, 1 - (t - it.anim) / (it.dur - it.anim));
          ctx.drawImage(cv, Math.round(sx - cv.width / 2), Math.round(sy - it.altura - cv.height / 2));
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

        case 'sopro': {
          // O cone abre a partir do peito de quem sopra e avança até o alvo;
          // o jogador tem de ver a FORMA antes de ver o dano.
          const a = at(it.from);
          const b = at(it.to);
          const ang = Math.atan2(b.sy - a.sy, b.sx - a.sx);
          const dist = Math.hypot(b.sx - a.sx, b.sy - a.sy) * 1.15;
          const abre = EASE_OUT(Math.min(1, k / 0.3));
          const fade = k < 0.5 ? 1 : 1 - (k - 0.5) / 0.5;
          const alc = dist * abre;
          ctx.save();
          ctx.translate(a.sx, a.sy - CHEST * 0.8);
          ctx.rotate(ang);
          ctx.globalAlpha = fade * 0.75;
          const grd = ctx.createLinearGradient(0, 0, alc, 0);
          grd.addColorStop(0, '#ffffff');
          grd.addColorStop(0.35, it.color);
          grd.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(alc, -alc * it.spread);
          ctx.lineTo(alc, alc * it.spread);
          ctx.closePath();
          ctx.fill();
          // Faíscas dentro do cone: o gradiente sozinho lê como vidro fosco.
          ctx.globalAlpha = fade;
          ctx.fillStyle = '#ffffff';
          for (const s of it.faiscas) {
            const pk = (k - s.atraso) * s.vel * 2.4;
            if (pk < 0 || pk > 1) continue;
            const d = alc * pk;
            ctx.globalAlpha = fade * (1 - pk) * 0.9;
            ctx.fillRect(d, s.off * d * it.spread, s.size, s.size);
          }
          ctx.restore();
          break;
        }

        case 'agarrao': {
          // Duas garras fecham na altura do peito e dão um tranco para dentro.
          const { sx, sy } = at(it.tile);
          const fecha = EASE_OUT(Math.min(1, k / 0.55));
          const aberto = 30 * (1 - fecha) + 7;
          const puxa = k > 0.55 ? Math.sin(((k - 0.55) / 0.45) * Math.PI) * 4 : 0;
          ctx.save();
          ctx.globalAlpha = 1 - Math.max(0, (k - 0.6) / 0.4);
          ctx.strokeStyle = it.color;
          ctx.lineWidth = 3.5;
          for (const lado of [-1, 1]) {
            const x = sx + lado * (aberto - puxa);
            ctx.beginPath();
            ctx.moveTo(x + lado * 9, sy - 44);
            ctx.lineTo(x, sy - 30);
            ctx.lineTo(x + lado * 9, sy - 16);
            ctx.stroke();
          }
          ctx.restore();
          break;
        }

        case 'ossos-pilha': {
          // Os ossos sobem pouco, caem e param no chão; o resto do tempo é só
          // o monte esmaecendo. Parar no chão é o que separa morte de explosão.
          const { sx, sy } = at(it.tile);
          const g = 260;
          ctx.save();
          ctx.fillStyle = it.color;
          ctx.globalAlpha = k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4;
          for (const p of it.parts) {
            const tq = it.t;
            const x = sx + p.vx * tq;
            let y = sy - p.y0 + p.vy * tq + g * tq * tq;
            let rot = p.ang + tq * p.rot;
            if (y > sy) { y = sy; rot = p.ang + p.rot; }   // assentou
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rot);
            ctx.fillRect(-p.len / 2, -1.5, p.len, 3);
            ctx.fillRect(-p.len / 2 - 1, -2.5, 2, 5);      // epífise
            ctx.fillRect(p.len / 2 - 1, -2.5, 2, 5);
            ctx.restore();
          }
          ctx.restore();
          break;
        }

        case 'clarao': {
          // Clarão branco sobre a figura: marca QUEM, quando nada se move.
          const { sx, sy } = at(it.tile);
          const pulso = Math.abs(Math.sin(k * Math.PI * 2)) * (1 - k * 0.4);
          ctx.save();
          ctx.globalAlpha = pulso * 0.55;
          const grd = ctx.createRadialGradient(sx, sy - 26, 2, sx, sy - 26, 30);
          grd.addColorStop(0, it.color);
          grd.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.ellipse(sx, sy - 26, 30, 34, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          break;
        }

        case 'grudar': {
          // Gotas subindo da vítima para o bicho: é o que mostra que o dano
          // continua enquanto ele está lá, e não um golpe que já passou.
          const { sx, sy } = at(it.tile);
          ctx.save();
          ctx.fillStyle = it.color;
          // Só enquanto está pousado: na aproximação e na saída não há sucção.
          for (let i = 0; k > 0.2 && k < 0.9 && i < 4; i++) {
            const pk = (it.t * 1.6 + i * 0.25) % 1;
            ctx.globalAlpha = Math.sin(pk * Math.PI) * 0.9;
            ctx.fillRect(sx - 3 + i * 2, sy - 20 - pk * 16, 2, 3);
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
