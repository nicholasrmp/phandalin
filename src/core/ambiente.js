// O AMBIENTE SONORO: o "chão" de som de cada lugar (vento e pássaros na floresta, gotas na caverna, burburinho e lareira na taverna) e a
// TENSÃO da luta (um pulso grave por baixo). Tudo gerado por código com a Web Audio API, como os efeitos: nenhum arquivo, nenhuma licença.
//
//   audio.ambiente('floresta')    troca o ambiente com um fade (`null` o silencia)
//   audio.tensao(true | false)    liga e desliga o pulso da luta
//
// Cada ambiente é uma lista de CAMADAS: uma camada contínua (ruído filtrado com uma onda lenta no volume, ou um zumbido grave) e
// uma de EVENTOS ao acaso (um pássaro, uma gota, uma caneca). Os eventos têm intervalo irregular: uma grade regular soa como metrônomo.

/** Qual ambiente toca em cada encontro (a `variante` do mapa). Puro e testável. */
export function ambienteDaVariante(variante) {
  switch (variante) {
    case 'ondaEco': case 'caverna': case 'esconderijo': case 'mansao': case 'mansaoTunel': case 'castelo': return 'caverna';
    case 'rua': return 'vila';
    case 'ermoNoite': return 'noite';
    default: return 'floresta';
  }
}

export const AMBIENTES = ['floresta', 'noite', 'vila', 'caverna', 'taverna'];
/** Quais ambientes têm camadas definidas (o teste confere que toda cena aponta para um que existe). */
export const temCamadas = (nome) => Object.hasOwn(CAMADAS, nome);

const entre = (a, b) => a + Math.random() * (b - a);

export class Ambiente {
  constructor(audio) {
    this.audio = audio;
    this.atual = null;          // { nome, g, nos: [], timers: [] }
    this.pedido = null;         // o ambiente pedido antes do primeiro gesto
    this.pulso = null;
    this.querTensao = false;
  }

  get ctx() { return this.audio.ctx; }

  /** O primeiro gesto do usuário chegou: cumpre o que foi pedido antes. */
  destravar() {
    if (this.pedido !== null) this.tocar(this.pedido);
    if (this.querTensao) this.tensao(true);
  }

  /** Liga o canal próprio do ambiente: segue o volume e o mudo do jogo, mais baixo que os efeitos. */
  mestre() {
    if (this._mestre || !this.ctx) return this._mestre;
    this._mestre = this.ctx.createGain();
    this._mestre.gain.value = this.audio.muted ? 0 : this.audio.volume * 0.9;
    this._mestre.connect(this.ctx.destination);
    return this._mestre;
  }

  /** Volume ou mudo mudou. */
  seguirVolume() {
    if (this._mestre) this._mestre.gain.value = this.audio.muted ? 0 : this.audio.volume * 0.9;
  }

  tocar(nome, { fade = 2.5 } = {}) {
    this.pedido = nome;
    if (!this.ctx) return;
    if (this.atual?.nome === nome) return;
    this.parar(fade);
    if (!nome || !CAMADAS[nome]) return;
    const m = this.mestre();
    const g = this.ctx.createGain();
    g.gain.value = 0;
    g.connect(m);
    const cena = { nome, g, nos: [], timers: [] };
    this.atual = cena;
    CAMADAS[nome](this, cena);
    g.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(1, this.ctx.currentTime + fade);
  }

  parar(fade = 2) {
    const c = this.atual;
    this.atual = null;
    if (!c) return;
    for (const t of c.timers) clearTimeout(t);
    c.timers.length = 0;
    const t = this.ctx.currentTime;
    c.g.gain.cancelScheduledValues(t);
    c.g.gain.setValueAtTime(Math.max(0.0001, c.g.gain.value), t);
    c.g.gain.exponentialRampToValueAtTime(0.0001, t + fade);
    setTimeout(() => { for (const n of c.nos) { try { n.stop?.(); } catch { /* já parado */ } try { n.disconnect?.(); } catch { /* idem */ } } c.g.disconnect(); }, fade * 1000 + 200);
  }

  // ---- blocos ---------------------------------------------------------------

  /** Ruído filtrado em laço contínuo, com o volume ondulando devagar. */
  vento(c, { freq = 420, q = 0.7, ganho = 0.2, onda = 0.12, tipo = 'lowpass', fundo = 0.6 } = {}) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.audio.noiseBuffer();
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = tipo; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain();
    g.gain.value = ganho * fundo;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = onda;
    const prof = ctx.createGain();
    prof.gain.value = ganho * (1 - fundo);
    lfo.connect(prof).connect(g.gain);
    src.connect(f).connect(g).connect(c.g);
    src.start(ctx.currentTime, Math.random() * 1.5);
    lfo.start();
    c.nos.push(src, lfo);
  }

  /** Um zumbido grave de duas notas ligeiramente desafinadas (bate devagar). */
  zumbido(c, { base = 55, desafina = 0.7, ganho = 0.06, tipo = 'sine' } = {}) {
    const ctx = this.ctx;
    for (const f of [base, base + desafina]) {
      const o = ctx.createOscillator();
      o.type = tipo; o.frequency.value = f;
      const g = ctx.createGain(); g.gain.value = ganho;
      o.connect(g).connect(c.g);
      o.start();
      c.nos.push(o);
    }
  }

  /** Um evento que se repete a intervalos irregulares enquanto o ambiente existir. */
  evento(c, fazer, [min, max]) {
    const agenda = () => {
      const t = setTimeout(() => {
        if (this.atual !== c) return;
        if (!this.audio.muted && this.ctx.state === 'running') fazer();
        agenda();
      }, entre(min, max) * 1000);
      c.timers.push(t);
    };
    agenda();
  }

  /** Um som curto direto na camada do ambiente (não passa pelo compressor dos efeitos). */
  ping({ from, to = null, dur = 0.3, gain = 0.1, type = 'sine', delay = 0 }, c) {
    const ctx = this.ctx; const t0 = ctx.currentTime + delay;
    const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(from, t0);
    if (to) o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(c.g);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }

  estalo({ dur = 0.05, freq = 3000, gain = 0.08, q = 1.2 }, c) {
    const ctx = this.ctx; const t0 = ctx.currentTime;
    const src = ctx.createBufferSource(); src.buffer = this.audio.noiseBuffer();
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f).connect(g).connect(c.g);
    src.start(t0, Math.random() * 1.5); src.stop(t0 + dur + 0.05);
  }

  // ---- a tensão da luta -------------------------------------------------------

  tensao(ligar) {
    this.querTensao = ligar;
    if (!this.ctx) return;
    if (!ligar) {
      const p = this.pulso;
      this.pulso = null;
      if (!p) return;
      const t = this.ctx.currentTime;
      p.g.gain.cancelScheduledValues(t);
      p.g.gain.setValueAtTime(Math.max(0.0001, p.g.gain.value), t);
      p.g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
      setTimeout(() => { for (const n of p.nos) { try { n.stop(); } catch { /* já parado */ } } p.g.disconnect(); }, 2000);
      return;
    }
    if (this.pulso) return;
    const ctx = this.ctx;
    const g = ctx.createGain(); g.gain.value = 0.0001; g.connect(this.mestre());
    // Um coração grave (60 Hz) pulsando a ~1,4 Hz, e uma quinta diminuta fina por cima, quase inaudível: tensão sem melodia.
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 58;
    const batida = ctx.createGain(); batida.gain.value = 0.5;
    const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 1.4;
    const prof = ctx.createGain(); prof.gain.value = 0.5;
    lfo.connect(prof).connect(batida.gain);
    o.connect(batida).connect(g);
    const a = ctx.createOscillator(); a.type = 'triangle'; a.frequency.value = 164.8;
    const b = ctx.createOscillator(); b.type = 'triangle'; b.frequency.value = 233.1;
    const fino = ctx.createGain(); fino.gain.value = 0.045;
    a.connect(fino); b.connect(fino); fino.connect(g);
    for (const n of [o, lfo, a, b]) n.start();
    g.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 2.5);
    this.pulso = { g, nos: [o, lfo, a, b] };
  }
}

/** As camadas de cada ambiente. */
const CAMADAS = {
  floresta(a, c) {
    a.vento(c, { freq: 520, ganho: 0.16, onda: 0.09 });
    a.vento(c, { freq: 2800, q: 0.9, ganho: 0.03, onda: 0.2, tipo: 'bandpass' });      // folhas
    // Um pássaro de dia: dois a quatro pios curtos, subindo.
    a.evento(c, () => {
      const base = entre(2400, 3600);
      for (let i = 0, n = 2 + Math.floor(Math.random() * 3); i < n; i += 1) a.ping({ from: base, to: base * entre(1.15, 1.4), dur: 0.09, gain: 0.05, delay: i * 0.14 }, c);
    }, [2.5, 9]);
  },

  noite(a, c) {
    a.vento(c, { freq: 380, ganho: 0.14, onda: 0.07 });
    // Grilos: um trinado agudo em pulsos rápidos.
    a.evento(c, () => {
      const f = entre(4200, 4800);
      for (let i = 0; i < 6; i += 1) a.ping({ from: f, dur: 0.035, gain: 0.03, delay: i * 0.055 }, c);
    }, [0.9, 2.6]);
    a.evento(c, () => { a.ping({ from: entre(350, 420), to: 300, dur: 0.5, gain: 0.04, type: 'triangle' }, c); }, [12, 30]);     // uma coruja distante
  },

  vila(a, c) {
    a.vento(c, { freq: 460, ganho: 0.12, onda: 0.1 });
    a.evento(c, () => { a.estalo({ freq: 2200, dur: 0.07, gain: 0.07 }, c); a.ping({ from: 1250, dur: 0.18, gain: 0.03, type: 'triangle', delay: 0.01 }, c); }, [4, 11]);   // martelo longe
    a.evento(c, () => { const f = entre(2600, 3300); a.ping({ from: f, to: f * 1.25, dur: 0.1, gain: 0.035 }, c); }, [3, 8]);
  },

  caverna(a, c) {
    a.zumbido(c, { base: 49, desafina: 0.6, ganho: 0.07 });
    a.vento(c, { freq: 210, q: 1.1, ganho: 0.09, onda: 0.05, tipo: 'bandpass' });
    // Uma gota que cai e ecoa uma vez, mais baixa.
    a.evento(c, () => {
      const f = entre(900, 1500);
      a.ping({ from: f, to: f * 0.7, dur: 0.22, gain: 0.07 }, c);
      a.ping({ from: f * 0.98, to: f * 0.68, dur: 0.3, gain: 0.025, delay: 0.17 }, c);
    }, [2, 7]);
  },

  taverna(a, c) {
    a.vento(c, { freq: 620, q: 0.8, ganho: 0.16, onda: 0.3, tipo: 'bandpass', fundo: 0.5 });     // burburinho
    a.vento(c, { freq: 1500, q: 0.6, ganho: 0.05, onda: 0.5, tipo: 'bandpass', fundo: 0.4 });
    a.evento(c, () => { for (let i = 0, n = 2 + Math.floor(Math.random() * 3); i < n; i += 1) a.estalo({ freq: entre(1800, 4200), dur: 0.03, gain: 0.07 }, c); }, [0.5, 2]);   // a lareira
    a.evento(c, () => { a.ping({ from: entre(2500, 3200), dur: 0.12, gain: 0.04, type: 'triangle' }, c); a.ping({ from: entre(3300, 4000), dur: 0.1, gain: 0.025, delay: 0.05 }, c); }, [6, 16]);   // canecas
  },
};
