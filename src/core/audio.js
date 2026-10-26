// Os EFEITOS são gerados por código, no mesmo espírito da arte: nenhum arquivo
// de áudio para eles. Tudo sai de osciladores e ruído da Web Audio API.
//
// Vantagens que valem a pena aqui: zero peso de download, nenhuma licença de
// sample para checar, e variação de graça — cada golpe sai com um tom levemente
// diferente, então repetir 40 ataques não vira metralhadora de um som só.
//
// A MÚSICA é a exceção, e a única: um arquivo tocado em laço (`tocarMusica`),
// que passa por fora do compressor dos efeitos. Ela depende de a licença do
// arquivo estar resolvida, e o jogo funciona calado sem ele (ver abaixo).
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
    // A música pedida, mesmo antes de haver `ctx`: o navegador só deixa tocar
    // depois de um gesto, e o pedido fica guardado até lá.
    this.musicaUrl = null;
    this.musicaOpcoes = null;
    this.musica = null;
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
    // A música tem a SUA barra de volume, que segue o mesmo controle do jogo
    // (volume e mudo), mas liga direto na saída: se passasse pelo compressor
    // dos efeitos, cada golpe e cada grito faria a música abaixar e subir.
    this.musicaMestre = this.ctx.createGain();
    this.musicaMestre.gain.value = this.muted ? 0 : this.volume;
    this.musicaMestre.connect(this.ctx.destination);
    // Se o menu pediu música antes do primeiro clique, é agora que ela nasce.
    if (this.musicaUrl) this.tocarMusica(this.musicaUrl, this.musicaOpcoes ?? {});
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    this.muted = false;
    if (this.master) this.master.gain.value = this.volume;
    if (this.musicaMestre) this.musicaMestre.gain.value = this.volume;
    this.save();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : this.volume;
    if (this.musicaMestre) this.musicaMestre.gain.value = this.muted ? 0 : this.volume;
    this.save();
    return this.muted;
  }

  // ---- música -------------------------------------------------------------

  /**
   * Toca um arquivo em laço, entrando em fade.
   *
   * Pode ser chamado ANTES do primeiro clique: o pedido fica guardado e
   * `unlock()` o cumpre. Chamar de novo com a mesma URL não recomeça a faixa.
   *
   * Arquivo ausente ou ilegível NÃO é erro: o jogo roda calado. A música é o
   * único áudio que vem de arquivo e o único que pode faltar (licença,
   * tamanho do repositório), então a falta dela não pode derrubar o menu.
   */
  tocarMusica(url, { ganho = 0.55, fade = 2 } = {}) {
    this.musicaUrl = url;
    this.musicaOpcoes = { ganho, fade };
    if (!this.ctx) return; // sem gesto ainda: `unlock()` volta aqui
    if (this.musica?.url === url) {
      // Da altura em que o fade-out do menu a deixou, e não de uma fixa: voltar
      // ao título no meio de um fade não pode dar salto de volume.
      this.rampa(this.musica.g.gain.value, ganho, fade);
      this.musica.ganho = ganho;
      this.musica.el.play().catch(() => {});
      return;
    }
    this.pararMusica(0.4);
    this.musicaUrl = url; // `pararMusica` limpou o pedido
    this.musicaOpcoes = { ganho, fade };
    let el;
    try {
      el = document.createElement('audio');
      el.src = url;
      el.loop = true;
      el.preload = 'auto';
      const no = this.ctx.createMediaElementSource(el);
      const g = this.ctx.createGain();
      g.gain.value = 0;
      no.connect(g).connect(this.musicaMestre);
      this.musica = { url, el, no, g, ganho };
      // Faixa que não carrega (404, formato): some em silêncio e libera o pedido.
      el.addEventListener('error', () => { if (this.musica?.el === el) { this.musica = null; this.musicaUrl = null; } });
      el.play().catch(() => {});
      this.rampa(0, ganho, fade);
    } catch {
      this.musica = null;
    }
  }

  /** Fade-out e fim. Esquece o pedido: `unlock()` não a traz de volta. */
  pararMusica(fade = 1.4) {
    this.musicaUrl = null;
    this.musicaOpcoes = null;
    const m = this.musica;
    if (!m) return;
    this.musica = null;
    this.rampa(m.g.gain.value, 0, fade, m.g);
    setTimeout(() => {
      try { m.el.pause(); m.el.removeAttribute('src'); m.el.load(); m.no.disconnect(); m.g.disconnect(); } catch { /* já solto */ }
    }, fade * 1000 + 120);
  }

  /** Rampa linear do ganho da faixa, de `de` até `ate` em `seg` segundos. */
  rampa(de, ate, seg, g = this.musica?.g) {
    if (!g || !this.ctx) return;
    const t = this.ctx.currentTime;
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(de, t);
    g.gain.linearRampToValueAtTime(ate, t + Math.max(0.05, seg));
  }

  get now() {
    return this.ctx.currentTime;
  }

  // ---- primitivas ---------------------------------------------------------

  /**
   * Envelope de ganho: ataque curto por padrão, decaimento exponencial.
   *
   * `attack` é parâmetro e não constante porque metade do bestiário novo depende
   * dele: impacto precisa dos 6 ms originais, mas uivo, gemido, sopro e lamento
   * só soam como ar em movimento se a energia levar centésimos de segundo para
   * chegar. Ataque instantâneo transforma qualquer coisa em pancada.
   */
  env(gain, t0, peak, decay, attack = 0.006) {
    const sobe = Math.max(0.002, Math.min(attack, decay * 0.9));
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak), t0 + sobe);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.max(decay, sobe + 0.01));
  }

  /**
   * Buffer de ruído branco, reutilizado entre os sons.
   *
   * 2,5 s e não 1,2: o sopro do dragão, o rangido da porta de pedra e o lamento
   * do espectro passam de um segundo, e um buffer curto simplesmente termina no
   * meio do som — o ruído some e sobra só o oscilador.
   */
  noiseBuffer() {
    if (this._noise) return this._noise;
    const len = this.ctx.sampleRate * 2.5;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this._noise = buf;
    return buf;
  }

  noise({ delay = 0, dur = 0.18, type = 'bandpass', freq = 1400, q = 1, gain = 0.3, sweepTo = null, attack = 0.006 }) {
    const t0 = this.now + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer();
    // Começa em um ponto aleatório do buffer: dois ruídos disparados juntos a
    // partir da amostra 0 se somam em fase e viram um "chiado" idêntico sempre.
    const inicio = Math.random() * Math.max(0, src.buffer.duration - dur - 0.1);
    const filter = this.ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(freq, t0);
    if (sweepTo) filter.frequency.exponentialRampToValueAtTime(Math.max(40, sweepTo), t0 + dur);
    filter.Q.value = q;
    const g = this.ctx.createGain();
    this.env(g, t0, gain, dur, attack);
    src.connect(filter).connect(g).connect(this.master);
    src.start(t0, inicio);
    src.stop(t0 + dur + 0.05);
  }

  tone({ delay = 0, dur = 0.2, type = 'triangle', from = 440, to = null, gain = 0.2, attack = 0.006, vibrato = null }) {
    const t0 = this.now + delay;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t0);
    if (to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
    // Vibrato existe por causa das vozes: é a modulação da altura, não o timbre
    // do oscilador, que separa um rosnado de uma nota grave de serra. O LFO soma
    // no AudioParam, então conviva com o ramp de altura em vez de substituí-lo.
    if (vibrato) {
      const lfo = this.ctx.createOscillator();
      lfo.type = vibrato.type ?? 'sine';
      lfo.frequency.value = vibrato.rate;
      const prof = this.ctx.createGain();
      prof.gain.value = vibrato.depth;
      lfo.connect(prof).connect(osc.frequency);
      lfo.start(t0);
      lfo.stop(t0 + dur + 0.05);
    }
    const g = this.ctx.createGain();
    this.env(g, t0, gain, dur, attack);
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

// Atraso irregular. Grade regular de cliques soa como metrônomo; é a irregularidade
// que faz o ouvido ouvir osso solto, casco e cascata em vez de sequenciador.
const jitter = (amount) => Math.random() * amount;

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
  // Recusa: duas notas descendo. Avisa que nada foi gasto.
  deny: (a) => {
    a.tone({ dur: 0.09, type: 'square', from: 330, gain: 0.1 });
    a.tone({ delay: 0.08, dur: 0.16, type: 'square', from: 247, gain: 0.1 });
  },
  turn: (a) => {
    a.tone({ dur: 0.3, type: 'triangle', from: vary(392), to: 523, gain: 0.1 });
  },

  // --- ataques naturais ----------------------------------------------------
  // Osso antes de carne: a trinca de Q 7 chega 20 ms antes do baque de passa-baixa,
  // e é essa ordem (seco, depois molhado) que o ouvido lê como dentada.
  bite: (a) => {
    a.noise({ dur: 0.05, type: 'bandpass', freq: vary(2000), q: 7, gain: 0.26 });
    a.noise({ delay: 0.02, dur: 0.18, type: 'lowpass', freq: vary(380), gain: 0.3 });
    a.tone({ delay: 0.02, dur: 0.14, type: 'sine', from: vary(110), to: 44, gain: 0.2 });
  },
  // Três riscos que sobem de frequência e encurtam: garra que escapa da carne,
  // não três golpes iguais em fila.
  claw: (a) => {
    for (let i = 0; i < 3; i++) {
      a.noise({ delay: i * 0.045 + jitter(0.012), dur: 0.09 - i * 0.02, type: 'highpass', freq: vary(2400 + i * 520), gain: 0.2 });
      a.noise({ delay: i * 0.045, dur: 0.1, type: 'bandpass', freq: vary(720), q: 2.2, gain: 0.11 });
    }
  },
  // Subida de 900 para 1500 Hz em 100 ms com corpo nenhum: agulha entrando.
  // Qualquer grave aqui engordaria o bicho e viraria lança.
  sting: (a) => {
    a.noise({ dur: 0.03, type: 'bandpass', freq: vary(4200), q: 6, gain: 0.16 });
    a.tone({ dur: 0.1, type: 'sine', from: vary(900), to: 1500, gain: 0.09, attack: 0.02 });
  },
  // Fundamental de 90 Hz caindo para 38 com 300 ms de cauda: casco transfere massa.
  // O estalo agudo é só a casca da costela, por isso entra 15 ms depois e baixo.
  kick: (a) => {
    a.tone({ dur: 0.3, type: 'sine', from: vary(90), to: 38, gain: 0.34 });
    a.noise({ dur: 0.12, type: 'lowpass', freq: vary(300), gain: 0.22 });
    a.noise({ delay: 0.015, dur: 0.07, type: 'bandpass', freq: vary(1200), q: 3, gain: 0.1 });
  },
  // Investida de criatura Grande: a massa é contada no TEMPO. Dois passos pesados
  // e meio segundo de grave rolando antes do impacto dizem "isso é enorme"
  // melhor do que subir o volume do choque.
  charge: (a) => {
    a.noise({ dur: 0.52, type: 'lowpass', freq: 240, gain: 0.18, sweepTo: 90, attack: 0.14 });
    [0, 0.17].forEach((d) => {
      a.tone({ delay: d, dur: 0.2, type: 'sine', from: vary(70), to: 34, gain: 0.26 });
      a.noise({ delay: d, dur: 0.1, type: 'lowpass', freq: vary(320), gain: 0.14 });
    });
    a.noise({ delay: 0.36, dur: 0.32, type: 'lowpass', freq: vary(440), gain: 0.36 });
    a.tone({ delay: 0.36, dur: 0.36, type: 'sawtooth', from: vary(120), to: 40, gain: 0.2 });
  },

  // --- vozes ---------------------------------------------------------------
  // Vibrato de 26 Hz numa serra de 95 Hz: rosnado é textura de prega vocal
  // batendo, não altura. Sem o LFO isto é só uma nota grave de sintetizador.
  growlWolf: (a) => {
    a.tone({ dur: 0.55, type: 'sawtooth', from: vary(95, 0.08), to: 78, gain: 0.16, attack: 0.05, vibrato: { rate: 26, depth: 18 } });
    a.noise({ dur: 0.5, type: 'bandpass', freq: vary(520), q: 1.4, gain: 0.1, attack: 0.06 });
  },
  // O perfil de altura é tudo: sobe de 300 a 620, sustenta e cai de volta.
  // Ataque de 180 ms impede o transiente que transformaria o uivo em grito.
  howlWolf: (a) => {
    a.tone({ dur: 0.34, type: 'triangle', from: vary(300), to: 620, gain: 0.14, attack: 0.18 });
    a.tone({ delay: 0.3, dur: 0.95, type: 'triangle', from: vary(620), to: 330, gain: 0.15, attack: 0.12, vibrato: { rate: 5.5, depth: 14 } });
    a.tone({ delay: 0.3, dur: 0.9, type: 'sine', from: vary(1240), to: 680, gain: 0.05, attack: 0.14 });
  },
  // Vibrato largo (60 Hz de profundidade) e rápido sobre serra aguda: voz de
  // caixa torácica pequena, esganiçada e instável. Curta, porque goblin não sustenta nota.
  yellGoblin: (a) => {
    a.tone({ dur: 0.26, type: 'sawtooth', from: vary(520), to: 410, gain: 0.13, attack: 0.02, vibrato: { rate: 19, depth: 60 } });
    a.noise({ dur: 0.2, type: 'highpass', freq: vary(2400), gain: 0.08 });
  },
  // Fundamental abaixo de 75 Hz e 300 ms de duração: peito grande, frase curta.
  // Ogro que sustenta a nota soa como dragão; o ogro tem de soar burro.
  gruntOgre: (a) => {
    a.tone({ dur: 0.3, type: 'sawtooth', from: vary(72, 0.08), to: 58, gain: 0.26, attack: 0.03, vibrato: { rate: 13, depth: 9 } });
    a.noise({ dur: 0.26, type: 'lowpass', freq: vary(420), gain: 0.14, attack: 0.05 });
  },
  // Ataque de 300 ms e passa-baixa fechando: ar saindo de um peito que já não
  // controla a respiração. O que assusta no zumbi é a falta de intenção no som.
  moanZombie: (a) => {
    a.tone({ dur: 1.0, type: 'triangle', from: vary(150, 0.1), to: 104, gain: 0.14, attack: 0.3, vibrato: { rate: 3.2, depth: 7 } });
    a.noise({ dur: 1.0, type: 'lowpass', freq: vary(620), gain: 0.12, attack: 0.35, sweepTo: 260 });
  },
  // Sete estalos de 35 ms em espaçamento irregular: osso solto batendo em osso.
  // Em grade regular isto viraria claves de samba.
  rattleSkeleton: (a) => {
    for (let i = 0; i < 7; i++) {
      a.noise({ delay: i * 0.034 + jitter(0.026), dur: 0.035, type: 'bandpass', freq: vary(2300, 0.35), q: 9, gain: 0.12 });
    }
  },
  // O mais assustador do lote, e não por volume: duas senoides desafinadas em
  // 0,9% batem a ~3 Hz, frequência que o ouvido não resolve e lê como errado;
  // o trítono abaixo não cabe em nenhuma escala usada no jogo, então entra como
  // defeito; e 500 ms de ataque tiram qualquer ponto de início identificável.
  wailSpectre: (a) => {
    const base = vary(330, 0.06);
    a.tone({ dur: 1.7, type: 'sine', from: base, to: base * 1.18, gain: 0.13, attack: 0.5 });
    a.tone({ dur: 1.7, type: 'sine', from: base * 1.009, to: base * 1.19, gain: 0.12, attack: 0.56 });
    a.tone({ delay: 0.25, dur: 1.45, type: 'triangle', from: base / 1.414, to: base / 1.3, gain: 0.07, attack: 0.6, vibrato: { rate: 4.5, depth: 5 } });
    a.noise({ delay: 0.1, dur: 1.5, type: 'highpass', freq: 2600, gain: 0.06, attack: 0.7 });
  },
  // Trinado de três lambidas de 50 ms acima de 2 kHz: inseto grande continua
  // sendo inseto — o guincho tem de ser rápido demais para ter corpo.
  screechStirge: (a) => {
    for (let i = 0; i < 3; i++) {
      a.tone({ delay: i * 0.06, dur: 0.05, type: 'square', from: vary(2600, 0.2), to: 1700, gain: 0.07 });
    }
    a.noise({ dur: 0.18, type: 'highpass', freq: vary(3800), gain: 0.07 });
  },
  // Só ruído, nenhum oscilador: silvo não tem altura definida. Dar altura a ele
  // faz a aranha soar como chaleira.
  hissSpider: (a) => {
    a.noise({ dur: 0.5, type: 'bandpass', freq: vary(4000), q: 1.1, gain: 0.14, attack: 0.09, sweepTo: 2600 });
    a.noise({ delay: 0.06, dur: 0.32, type: 'highpass', freq: 6000, gain: 0.06, attack: 0.07 });
  },
  // Serra de 80 Hz com vibrato de 30 Hz dá o grão do rugido; a camada uma oitava
  // acima existe só para o dragão continuar audível por cima da mixagem cheia.
  // Coruja em cima, urso embaixo: guincho de 760 a 520 Hz com vibrato rápido
  // sobre um grunhido de 112 Hz. Meio segundo, porque ela ataca duas vezes no
  // mesmo turno e 1,3 s de rugido se atropelariam.
  screechOwlbear: (a) => {
    a.tone({ dur: 0.42, type: 'sawtooth', from: vary(760, 0.07), to: 520, gain: 0.15, attack: 0.03, vibrato: { rate: 22, depth: 40 } });
    a.tone({ dur: 0.5, type: 'sawtooth', from: vary(112, 0.07), to: 92, gain: 0.14, attack: 0.05, vibrato: { rate: 14, depth: 10 } });
    a.noise({ dur: 0.3, type: 'bandpass', freq: vary(2100), q: 2, gain: 0.09, attack: 0.04 });
  },
  // O rugido é EXCLUSIVO do dragão: é o único chefe final do jogo, e uma voz
  // que o jogador já ouviu em outro bicho não anuncia mais nada.
  roarDragon: (a) => {
    a.tone({ dur: 1.3, type: 'sawtooth', from: vary(80, 0.06), to: 62, gain: 0.26, attack: 0.09, vibrato: { rate: 30, depth: 22 } });
    a.tone({ delay: 0.04, dur: 1.1, type: 'sawtooth', from: vary(160, 0.06), to: 118, gain: 0.12, attack: 0.13, vibrato: { rate: 17, depth: 30 } });
    a.noise({ dur: 1.2, type: 'lowpass', freq: vary(1300), gain: 0.2, attack: 0.1, sweepTo: 420 });
  },

  // --- dano por tipo -------------------------------------------------------
  // Cada bolha é um blip que SOBE uma oitava e morre em 50 ms; é a subida, e o
  // espaçamento aleatório entre nove delas, que soa como fervura.
  castAcid: (a) => {
    for (let i = 0; i < 9; i++) {
      const f = vary(260 + jitter(500), 0.1);
      a.tone({ delay: jitter(0.5), dur: 0.05, type: 'sine', from: f, to: f * 2.1, gain: 0.08 });
    }
    a.noise({ dur: 0.6, type: 'bandpass', freq: vary(900), q: 0.9, gain: 0.1, attack: 0.1, sweepTo: 500 });
  },
  // Ganho crescendo por 550 ms enquanto a altura cai de 420 para 70 Hz: a energia
  // vem para dentro. É o inverso exato de uma explosão, e é por isso que soa como sugar.
  castNecrotic: (a) => {
    a.tone({ dur: 0.9, type: 'triangle', from: vary(420), to: 70, gain: 0.16, attack: 0.55 });
    a.noise({ dur: 0.85, type: 'bandpass', freq: 220, q: 2, gain: 0.14, attack: 0.6, sweepTo: 1800 });
    a.tone({ delay: 0.62, dur: 0.3, type: 'sine', from: vary(58), gain: 0.18, attack: 0.1 });
  },
  // Passa-baixa fechando de 1200 para 300 Hz sem nenhum transiente seco: algo
  // espesso cobrindo o alvo. Veneno não bate, ele se espalha.
  castPoison: (a) => {
    a.noise({ dur: 0.7, type: 'lowpass', freq: vary(1200), gain: 0.18, attack: 0.16, sweepTo: 300 });
    a.tone({ dur: 0.6, type: 'sine', from: vary(190), to: 96, gain: 0.1, attack: 0.22, vibrato: { rate: 7, depth: 12 } });
  },
  // Jato: um segundo inteiro de ruído com a banda ABRINDO de 300 para 2400 Hz e
  // Q baixo. Banda que abre = pressão contínua saindo; banda que fecha seria vento passando.
  breathDragon: (a) => {
    a.noise({ dur: 1.0, type: 'bandpass', freq: 300, q: 0.7, gain: 0.3, attack: 0.15, sweepTo: 2400 });
    a.noise({ delay: 0.08, dur: 0.95, type: 'highpass', freq: 1800, gain: 0.12, attack: 0.22 });
    a.tone({ dur: 0.9, type: 'sawtooth', from: vary(68), to: 50, gain: 0.14, attack: 0.18 });
  },

  // --- morte por tipo ------------------------------------------------------
  // Espaçamento que CRESCE e altura que cai a cada estalo: pilha desabando em
  // cadeia. Nove estalos equidistantes seriam uma régua caindo na mesa.
  deathBones: (a) => {
    for (let i = 0; i < 9; i++) {
      a.noise({ delay: i * 0.05 + i * i * 0.008 + jitter(0.02), dur: 0.06, type: 'bandpass', freq: vary(2200 - i * 150, 0.25), q: 7, gain: 0.14 });
    }
    a.noise({ delay: 0.6, dur: 0.3, type: 'lowpass', freq: 260, gain: 0.18, attack: 0.03 });
  },
  // Passa-baixa largo caindo de 900 para 120 Hz e nenhum transiente: massa
  // perdendo forma. Os blips descendentes são bolhas afundando, não estourando.
  deathOoze: (a) => {
    a.noise({ dur: 0.7, type: 'lowpass', freq: vary(900), gain: 0.3, attack: 0.05, sweepTo: 120 });
    for (let i = 0; i < 5; i++) {
      const f = vary(180 + jitter(220), 0.1);
      a.tone({ delay: 0.12 + jitter(0.4), dur: 0.08, type: 'sine', from: f, to: f * 0.5, gain: 0.08 });
    }
  },
  // Altura subindo enquanto o ganho morre: a coisa não cai no chão, ela afina
  // até sair do alcance. Único som de morte do jogo que termina mais agudo do que começou.
  deathSpectre: (a) => {
    a.tone({ dur: 1.2, type: 'sine', from: vary(300), to: 1500, gain: 0.12, attack: 0.08 });
    a.tone({ delay: 0.05, dur: 1.1, type: 'triangle', from: vary(450), to: 1900, gain: 0.07, attack: 0.1 });
    a.noise({ dur: 1.0, type: 'highpass', freq: 1200, gain: 0.1, attack: 0.06, sweepTo: 7000 });
  },

  // --- ambiente ------------------------------------------------------------
  // Banda estreita em 1,5 kHz com 60 ms de cauda: pedra devolve o transiente.
  stepStone: (a) => {
    a.noise({ dur: 0.06, type: 'bandpass', freq: vary(1500), q: 2.5, gain: 0.12 });
    a.noise({ dur: 0.12, type: 'lowpass', freq: vary(430), gain: 0.08 });
  },
  // Mesmo passo sem a banda aguda e com o dobro de duração: terra engole o
  // transiente. A diferença entre os dois pisos é só onde está a energia.
  stepDirt: (a) => {
    a.noise({ dur: 0.15, type: 'lowpass', freq: vary(520), gain: 0.14, attack: 0.014, sweepTo: 220 });
  },
  // Rangido de 1,2 s com a banda descendo devagar: atrito de pedra é LONGO.
  // O mesmo material em 200 ms soa como porta de madeira; o baque no fim é o encaixe.
  doorStone: (a) => {
    a.noise({ dur: 1.2, type: 'bandpass', freq: vary(700), q: 3.5, gain: 0.16, attack: 0.28, sweepTo: 180 });
    a.noise({ delay: 0.1, dur: 1.0, type: 'lowpass', freq: 160, gain: 0.14, attack: 0.3 });
    a.tone({ delay: 1.12, dur: 0.35, type: 'sine', from: vary(80), to: 40, gain: 0.22 });
  },
  // Dois parciais em razão inarmônica (1 : 2,76): razão inteira soaria como sino
  // de igreja; a razão quebrada é o que faz metal pequeno e chato.
  coin: (a) => {
    const f = vary(2300, 0.08);
    a.tone({ dur: 0.3, type: 'triangle', from: f, gain: 0.1 });
    a.tone({ delay: 0.01, dur: 0.22, type: 'sine', from: f * 2.76, gain: 0.06 });
    a.noise({ dur: 0.04, type: 'highpass', freq: 5000, gain: 0.1 });
  },
  // Trava seca primeiro, madeira girando depois: a ordem dos dois eventos conta
  // a ação (destravou, então abriu). Invertida, soa como fechar.
  chestOpen: (a) => {
    a.noise({ dur: 0.05, type: 'bandpass', freq: vary(1800), q: 6, gain: 0.16 });
    a.noise({ delay: 0.08, dur: 0.45, type: 'bandpass', freq: vary(420), q: 4, gain: 0.12, attack: 0.12, sweepTo: 900 });
    a.tone({ delay: 0.08, dur: 0.3, type: 'triangle', from: vary(160), to: 240, gain: 0.06, attack: 0.12 });
  },
  // Dois sopros de passa-alta de 70 ms: papel é atrito agudo e nada mais.
  // Qualquer energia abaixo de 3 kHz transforma a página em pano.
  pageWhisper: (a) => {
    a.noise({ dur: 0.07, type: 'highpass', freq: vary(4200), gain: 0.1 });
    a.noise({ delay: 0.07 + jitter(0.03), dur: 0.1, type: 'highpass', freq: vary(3200), gain: 0.08 });
  },

  // --- interface -----------------------------------------------------------
  // Três notas subindo em quinta aberta, sem terça: anuncia ordem estabelecida
  // sem o colorido maior/menor que faria disto uma fanfarra de vitória.
  initiative: (a) => {
    [392, 587, 784].forEach((f, i) => {
      a.tone({ delay: i * 0.08, dur: 0.26, type: 'triangle', from: f, gain: 0.11 });
    });
    a.noise({ dur: 0.05, type: 'highpass', freq: 4000, gain: 0.08 });
  },
  // Notas de 0,9 s entrando a cada 0,07 s: elas se SOBREPÕEM e viram ACORDE.
  // A iniciativa também empilha notas, mas em 0,26 s cada: aqui a cauda é três
  // vezes mais longa que o intervalo, e é isso que soa como harmonia em vez de
  // arpejo — a diferença que marca progresso permanente.
  levelUp: (a) => {
    [523, 659, 784, 1047].forEach((f, i) => {
      a.tone({ delay: i * 0.07, dur: 0.9, type: 'triangle', from: f, gain: 0.11 });
      a.tone({ delay: i * 0.07 + 0.02, dur: 0.7, type: 'sine', from: f * 2, gain: 0.045 });
    });
  },
};

/**
 * Os nomes que o despachante conhece. Existe para o TESTE: `play` ignora nome
 * desconhecido em silencio — e foi assim que nove criaturas ficaram com voz
 * declarada e muda sem ninguem notar. Um nome errado agora quebra o teste.
 */
export const SOUND_NAMES = Object.freeze(Object.keys(SOUNDS));

export const audio = new Audio();

/**
 * Som do passo conforme o chao.
 *
 * So dois pisos tem som proprio, e de proposito: pedra devolve o transiente,
 * terra o engole. O resto fica no `step` genérico porque o NOME da superficie
 * nao diz do que ela e feita — `chao` e tabua na casa da vila e laje no porao
 * da mansao, e inventar um som para os dois seria errar metade das vezes.
 *
 * Classificar mal aqui e pior que nao classificar: o ouvido aprende o piso em
 * duas telas e estranha na terceira.
 */
const CHAO_DE_PEDRA = new Set(['laje', 'pedra', 'alvenaria', 'caverna', 'escada', 'rocha', 'pedregal', 'sarcofago']);
const CHAO_DE_TERRA = new Set(['grama', 'mato', 'estrada', 'palha']);

export function passoSoundFor(sup) {
  if (CHAO_DE_PEDRA.has(sup)) return 'stepStone';
  if (CHAO_DE_TERRA.has(sup)) return 'stepDirt';
  return 'step';
}

/** Som de impacto conforme o tipo de dano da arma. */
export function hitSoundFor(damageType) {
  if (damageType === 'cortante') return 'hitSlash';
  if (damageType === 'concussão') return 'hitBlunt';
  return 'hitPierce';
}

/**
 * Som de conjuração conforme o tipo de dano da magia.
 *
 * `origem` existe porque o sopro do dragão verde causa dano de veneno e soaria,
 * pelo tipo, igual a um frasco de veneno estourando. Jato de pressão e líquido
 * espesso não são o mesmo som: quem dispara um sopro diz de onde ele vem.
 */
export function spellSoundFor(damageType, { origem = 'magia' } = {}) {
  if (origem === 'sopro') return 'breathDragon';
  switch (damageType) {
    case 'fogo': return 'castFire';
    case 'elétrico': return 'castLightning';
    case 'radiante': return 'castRadiant';
    case 'energético': return 'castForce';
    case 'frio': return 'castCold';
    case 'ácido': return 'castAcid';
    case 'necrótico': return 'castNecrotic';
    case 'veneno': return 'castPoison';
    default: return 'castGeneric';
  }
}

/**
 * Som de ataque natural a partir do nome do ataque no bloco de monstro.
 *
 * Devolve `null` de propósito quando não reconhece: aí quem chama cai no
 * `hitSoundFor` pelo tipo de dano, que é a resposta certa para arma empunhada.
 * Casa por substring porque o bloco escreve "Mordida", "Duas garras",
 * "Mordida (forma de lobo)" — e não um identificador.
 */
export function naturalAttackSoundFor(nome = '') {
  const n = nome.toLowerCase();
  if (n.includes('mordida') || n.includes('presa') || n.includes('bico')) return 'bite';
  if (n.includes('garra') || n.includes('talão') || n.includes('talao')) return 'claw';
  if (n.includes('picada') || n.includes('ferrão') || n.includes('ferrao') || n.includes('dreno de sangue')) return 'sting';
  if (n.includes('coice') || n.includes('casco')) return 'kick';
  if (n.includes('investida') || n.includes('pisoteio') || n.includes('tromba')) return 'charge';
  return null;
}

/**
 * Som de morte a partir do tipo da criatura.
 *
 * `incorporeo` é um sinalizador separado do tipo porque esqueleto e espectro são
 * os dois mortos-vivos e morrem de formas opostas: um desaba no chão, o outro
 * afina até desaparecer. O tipo sozinho não distingue, e errar aqui tira o medo
 * do espectro, que é o que ele tem de melhor.
 *
 * `carne` manda o morto-vivo carnudo (zumbi, ghoul) para o colapso genérico em
 * vez da cascata de ossos: zumbi que morre fazendo chocalho soa como esqueleto.
 */
export function deathSoundFor(tipo, { incorporeo = false, carne = false } = {}) {
  if (incorporeo) return 'deathSpectre';
  switch (tipo) {
    case 'limo': case 'gosma': return 'deathOoze';
    case 'aberração': case 'aberracao': return 'deathOoze';
    case 'morto-vivo': return carne ? 'down' : 'deathBones';
    default: return 'down';
  }
}

/**
 * A VOZ DA CRIATURA, com freio.
 *
 * Som de bicho é o que mais rápido vira piada: quatro lobos atacando no mesmo
 * turno rosnariam juntos, e o mesmo lobo rosnaria a cada golpe por seis
 * rodadas. Dois relógios resolvem isso sem precisar saber de rodada nenhuma:
 *
 * - um por CRIATURA, para a mesma dar voz de vez em quando e não a cada golpe;
 * - um GLOBAL, curto, para duas vozes não saírem empilhadas no mesmo instante.
 *
 * Quem não tem `voice` na ficha continua calado, e isso é a maioria: a voz é
 * sotaque de quem tem, não enfeite de todo mundo.
 */
const ESPERA_DA_VOZ_MS = 5000;
const ESPERA_ENTRE_VOZES_MS = 700;
let ultimaVozDe = new WeakMap();
let ultimaVozQualquer = -Infinity;

// `performance.now()`, e não `Date.now()`: o relógio do sistema pode ANDAR
// PARA TRÁS (troca de fuso, ajuste de NTP), e aí a última voz fica no futuro,
// a conta dá negativo e o jogo inteiro emudece até o tempo alcançar. O relógio
// do navegador só anda para frente, e existe no Node também.
export function vozDa(criatura, { agora = performance.now() } = {}) {
  const voz = criatura?.voice;
  if (!voz) return null;
  if (agora - ultimaVozQualquer < ESPERA_ENTRE_VOZES_MS) return null;
  if (agora - (ultimaVozDe.get(criatura) ?? -Infinity) < ESPERA_DA_VOZ_MS) return null;
  ultimaVozDe.set(criatura, agora);
  ultimaVozQualquer = agora;
  return voz;
}

/**
 * Zera os dois relógios da voz. É do TESTE: sem isto, um teste que passa
 * `agora` na mão depende de nenhuma voz ter tocado antes no mesmo processo, e
 * passa ou falha pela ordem dos testes.
 */
export function esquecerVozes() {
  ultimaVozQualquer = -Infinity;
  ultimaVozDe = new WeakMap();
}

/**
 * Vozes disponíveis. Exportado para que o bloco de monstro possa guardar o nome
 * da voz e para que o revisor veja de uma vez o que existe — sem tabela de
 * espécie aqui dentro, que é informação do bestiário e não do sintetizador.
 */
export const VOICE_SOUNDS = Object.freeze([
  'growlWolf', 'howlWolf', 'yellGoblin', 'gruntOgre', 'moanZombie',
  'rattleSkeleton', 'wailSpectre', 'screechStirge', 'hissSpider', 'roarDragon',
  'screechOwlbear',
]);
