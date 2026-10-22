// Som gerado por código, no mesmo espírito da arte: nenhum arquivo de áudio
// no repositório. Tudo sai de osciladores e ruído da Web Audio API.
//
// Vantagens que valem a pena aqui: zero peso de download, nenhuma licença de
// sample para checar, e variação de graça — cada golpe sai com um tom levemente
// diferente, então repetir 40 ataques não vira metralhadora de um som só.
//
// O AudioContext só nasce depois de um gesto do usuário (política de autoplay
// dos navegadores). Até lá, `play()` é um no-op silencioso.

const STORAGE_KEY = 'phandalin:audio';

class Audio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.volume = 0.7;
    this.muted = false;
    this.load();
  }

  load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
      if (typeof saved.volume === 'number') this.volume = saved.volume;
      if (typeof saved.muted === 'boolean') this.muted = saved.muted;
    } catch {
      /* storage bloqueado: segue com o padrão */
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ volume: this.volume, muted: this.muted }));
    } catch {
      /* sem storage, sem drama */
    }
  }

  /** Chamado no primeiro gesto do usuário. Antes disso o navegador bloqueia. */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : this.volume;
    // Um compressor leve evita que explosão + grito + dado estourem juntos.
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -12;
    comp.ratio.value = 6;
    this.master.connect(comp).connect(this.ctx.destination);
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    this.muted = false;
    if (this.master) this.master.gain.value = this.volume;
    this.save();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : this.volume;
    this.save();
    return this.muted;
  }

  get now() {
    return this.ctx.currentTime;
  }

  // ---- primitivas ---------------------------------------------------------

  /** Envelope de ganho curto: ataque quase instantâneo, decaimento exponencial. */
  env(gain, t0, peak, decay) {
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak), t0 + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + decay);
  }

  /** Buffer de ruído branco, reutilizado entre os sons. */
  noiseBuffer() {
    if (this._noise) return this._noise;
    const len = this.ctx.sampleRate * 1.2;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this._noise = buf;
    return buf;
  }

  noise({ delay = 0, dur = 0.18, type = 'bandpass', freq = 1400, q = 1, gain = 0.3, sweepTo = null }) {
    const t0 = this.now + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer();
    const filter = this.ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(freq, t0);
    if (sweepTo) filter.frequency.exponentialRampToValueAtTime(Math.max(40, sweepTo), t0 + dur);
    filter.Q.value = q;
    const g = this.ctx.createGain();
    this.env(g, t0, gain, dur);
    src.connect(filter).connect(g).connect(this.master);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  }

  tone({ delay = 0, dur = 0.2, type = 'triangle', from = 440, to = null, gain = 0.2 }) {
    const t0 = this.now + delay;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t0);
    if (to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
    const g = this.ctx.createGain();
    this.env(g, t0, gain, dur);
    osc.connect(g).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  // ---- vocabulário do jogo ------------------------------------------------

  play(name, opts = {}) {
    if (!this.ctx || this.muted) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const fn = SOUNDS[name];
    if (fn) fn(this, opts);
  }
}

// Pequena variação de altura a cada disparo: é o que impede o som de virar
// metralhadora quando o mesmo golpe repete muitas vezes seguidas.
const vary = (base, amount = 0.12) => base * (1 + (Math.random() - 0.5) * 2 * amount);

const SOUNDS = {
  // --- combate corpo a corpo ---
  swing: (a) => {
    a.noise({ dur: 0.16, type: 'bandpass', freq: vary(900), q: 0.8, gain: 0.16, sweepTo: 260 });
  },
  hitSlash: (a) => {
    a.noise({ dur: 0.1, type: 'highpass', freq: vary(2600), gain: 0.3 });
    a.noise({ dur: 0.22, type: 'bandpass', freq: vary(420), q: 1.6, gain: 0.3 });
    a.tone({ dur: 0.1, type: 'square', from: vary(180), to: 70, gain: 0.1 });
  },
  hitBlunt: (a) => {
    a.noise({ dur: 0.2, type: 'lowpass', freq: vary(520), gain: 0.34 });
    a.tone({ dur: 0.16, type: 'sine', from: vary(120), to: 48, gain: 0.26 });
  },
  hitPierce: (a) => {
    a.noise({ dur: 0.08, type: 'bandpass', freq: vary(3200), q: 3, gain: 0.26 });
    a.tone({ dur: 0.12, type: 'triangle', from: vary(620), to: 180, gain: 0.14 });
  },
  critical: (a) => {
    a.noise({ dur: 0.26, type: 'bandpass', freq: vary(700), q: 1.2, gain: 0.4 });
    a.tone({ dur: 0.3, type: 'square', from: vary(880), to: 240, gain: 0.16 });
    a.tone({ delay: 0.05, dur: 0.4, type: 'triangle', from: vary(1320), to: 660, gain: 0.12 });
  },
  miss: (a) => {
    a.noise({ dur: 0.22, type: 'bandpass', freq: vary(1100), q: 0.6, gain: 0.12, sweepTo: 380 });
  },

  // --- magia, por natureza ---
  castFire: (a) => {
    a.noise({ dur: 0.45, type: 'lowpass', freq: vary(1600), gain: 0.3, sweepTo: 300 });
    a.tone({ dur: 0.35, type: 'sawtooth', from: vary(140), to: 60, gain: 0.1 });
  },
  castLightning: (a) => {
    a.noise({ dur: 0.07, type: 'highpass', freq: 5200, gain: 0.34 });
    a.tone({ dur: 0.25, type: 'square', from: vary(2100), to: 320, gain: 0.12 });
    a.noise({ delay: 0.04, dur: 0.3, type: 'bandpass', freq: vary(1800), q: 0.7, gain: 0.18 });
  },
  castRadiant: (a) => {
    a.tone({ dur: 0.5, type: 'sine', from: vary(880), to: 1320, gain: 0.14 });
    a.tone({ delay: 0.06, dur: 0.5, type: 'triangle', from: vary(1320), to: 1760, gain: 0.08 });
  },
  castForce: (a) => {
    for (let i = 0; i < 3; i++) {
      a.tone({ delay: i * 0.09, dur: 0.18, type: 'triangle', from: vary(760), to: 420, gain: 0.12 });
      a.noise({ delay: i * 0.09, dur: 0.12, type: 'bandpass', freq: vary(2200), q: 2, gain: 0.12 });
    }
  },
  castCold: (a) => {
    a.noise({ dur: 0.35, type: 'highpass', freq: vary(3000), gain: 0.16 });
    a.tone({ dur: 0.4, type: 'sine', from: vary(1400), to: 700, gain: 0.1 });
  },
  castGeneric: (a) => {
    a.tone({ dur: 0.3, type: 'triangle', from: vary(520), to: 780, gain: 0.12 });
    a.noise({ dur: 0.2, type: 'bandpass', freq: vary(1800), q: 1.5, gain: 0.1 });
  },

  // --- resultado ---
  heal: (a) => {
    a.tone({ dur: 0.35, type: 'sine', from: vary(520), gain: 0.14 });
    a.tone({ delay: 0.1, dur: 0.45, type: 'sine', from: vary(780), gain: 0.12 });
    a.tone({ delay: 0.2, dur: 0.5, type: 'triangle', from: vary(1040), gain: 0.08 });
  },
  down: (a) => {
    a.tone({ dur: 0.6, type: 'sawtooth', from: vary(220), to: 55, gain: 0.2 });
    a.noise({ dur: 0.4, type: 'lowpass', freq: 400, gain: 0.2 });
  },
  victory: (a) => {
    [523, 659, 784, 1047].forEach((f, i) => {
      a.tone({ delay: i * 0.12, dur: 0.5, type: 'triangle', from: f, gain: 0.14 });
    });
  },
  defeat: (a) => {
    [392, 330, 262, 196].forEach((f, i) => {
      a.tone({ delay: i * 0.18, dur: 0.7, type: 'sine', from: f, gain: 0.14 });
    });
  },

  // --- interface ---
  dice: (a) => {
    for (let i = 0; i < 4; i++) {
      a.noise({ delay: i * 0.055, dur: 0.05, type: 'bandpass', freq: vary(2400, 0.3), q: 4, gain: 0.12 });
    }
  },
  step: (a) => {
    a.noise({ dur: 0.08, type: 'lowpass', freq: vary(700), gain: 0.12 });
  },
  click: (a) => {
    a.tone({ dur: 0.05, type: 'square', from: vary(1200), gain: 0.06 });
  },
  turn: (a) => {
    a.tone({ dur: 0.3, type: 'triangle', from: vary(392), to: 523, gain: 0.1 });
  },
};

export const audio = new Audio();

/** Som de impacto conforme o tipo de dano da arma. */
export function hitSoundFor(damageType) {
  if (damageType === 'cortante') return 'hitSlash';
  if (damageType === 'concussão') return 'hitBlunt';
  return 'hitPierce';
}

/** Som de conjuração conforme o tipo de dano da magia. */
export function spellSoundFor(damageType) {
  switch (damageType) {
    case 'fogo': return 'castFire';
    case 'elétrico': case 'raio': return 'castLightning';
    case 'radiante': return 'castRadiant';
    case 'energético': return 'castForce';
    case 'frio': return 'castCold';
    default: return 'castGeneric';
  }
}
