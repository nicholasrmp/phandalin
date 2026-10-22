// Quatro direções de design para personagens e inimigos.
//
// Página de decisão: nada aqui é código de produção. As quatro pintam a MESMA
// ficha de dados (o look), então a escolha não muda o sistema — só o traço.
//
// Todas desenham em célula maior que a atual (44×56 contra 32×40): mais pixel
// por figura é o que permite ler elmo, escudo e arma no isométrico.

export const CELL_W = 44;
export const CELL_H = 64;   // folga no topo: cajado, cimeira e cabelo espetado
const GROUND = 6;

const hex = (h) => parseInt(h.slice(1), 16);
export function shade(h, m) {
  const n = hex(h);
  const ch = (v) => Math.max(0, Math.min(255, Math.round(v * m))).toString(16).padStart(2, '0');
  return `#${ch(n >> 16)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
}
function desat(h, amount) {
  const n = hex(h);
  const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const l = r * 0.3 + g * 0.59 + b * 0.11;
  const mix = (c) => Math.round(c + (l - c) * amount).toString(16).padStart(2, '0');
  return `#${mix(r)}${mix(g)}${mix(b)}`;
}

/** Fábrica do helper de desenho, comum às quatro. */
function brush(ctx, ox, oy) {
  const cx = Math.floor(CELL_W / 2);
  const gy = CELL_H - GROUND;
  return {
    cx,
    gy,
    px: (x, y, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(ox + cx + x, oy + gy + y, w, h); },
    cut: (x, y, w = 1, h = 1) => ctx.clearRect(ox + cx + x, oy + gy + y, w, h),
  };
}

// ===========================================================================
// A — PIXEL ART REFINADO
// O traço de hoje, com o dobro de resolução e três tons por material em vez
// de dois: base, luz vinda de cima-esquerda e sombra. Proporção heroica.
// ===========================================================================
function paintRefined(ctx, ox, oy, look) {
  const { px, cut } = brush(ctx, ox, oy);
  const lit = (c) => shade(c, 1.22);
  const dim = (c) => shade(c, 0.72);

  const armor = look.armorStyle === 'plate' ? look.metal
    : look.armorStyle === 'scale' ? look.metal
      : look.armorStyle === 'leather' ? look.leather : look.outfit;

  // capa
  if (look.cloak) {
    px(-10, -34, 20, 24, look.cloak);
    px(-10, -34, 20, 2, lit(look.cloak));
    px(-10, -12, 20, 2, dim(look.cloak));
  }
  // arma nas costas / na mão
  drawWeaponA(px, look, lit, dim);

  // pernas
  px(-6, -12, 5, 9, look.pants);
  px(2, -12, 5, 9, look.pants);
  px(-6, -12, 5, 1, lit(look.pants));
  px(2, -12, 5, 1, lit(look.pants));
  px(-7, -3, 7, 3, look.leather);
  px(1, -3, 7, 3, look.leather);
  px(-7, -1, 7, 1, dim(look.leather));
  px(1, -1, 7, 1, dim(look.leather));

  // torso
  px(-7, -30, 14, 18, armor);
  px(-7, -30, 14, 2, lit(armor));
  px(-7, -14, 14, 2, dim(armor));
  px(5, -28, 2, 14, dim(armor));              // lado em sombra
  if (look.armorStyle === 'plate') {
    px(-7, -31, 4, 4, lit(look.metal));       // ombreiras
    px(3, -31, 4, 4, lit(look.metal));
    px(-1, -28, 2, 14, dim(look.metal));
  }
  if (look.armorStyle === 'scale') {
    for (let r = 0; r < 5; r++) {
      for (let c = -6; c < 7; c += 3) px(c + (r % 2), -28 + r * 3, 2, 3, r % 2 ? dim(look.metal) : look.metal);
    }
  }
  if (look.trim) px(-7, -18, 14, 2, look.trim);
  if (look.belt) px(-7, -16, 14, 3, look.belt);

  // braços
  px(-10, -29, 3, 12, armor);
  px(7, -29, 3, 12, armor);
  px(-10, -29, 3, 1, lit(armor));
  px(-10, -17, 3, 3, look.skin);
  px(7, -17, 3, 3, look.skin);

  // escudo
  if (look.shield) {
    px(-14, -29, 6, 15, look.metal);
    px(-14, -29, 6, 2, lit(look.metal));
    px(-14, -16, 6, 2, dim(look.metal));
    px(-12, -24, 3, 5, look.trim ?? dim(look.metal));
  }

  // cabeça
  px(-6, -45, 12, 15, look.skin);
  px(-6, -45, 12, 2, lit(look.skin));
  px(3, -43, 3, 12, shade(look.skin, 0.86));
  px(-6, -32, 12, 2, dim(look.skin));
  cut(-6, -45); cut(5, -45); cut(-6, -32); cut(5, -32);
  if (look.ears) { px(-8, -40, 2, 4, look.skin); px(6, -40, 2, 4, look.skin); }

  // rosto
  px(-4, -39, 3, 3, '#ffffff');
  px(2, -39, 3, 3, '#ffffff');
  px(-3, -39, 2, 3, look.eyes);
  px(2, -39, 2, 3, look.eyes);
  px(-5, -41, 4, 1, dim(look.hair ?? look.skin));
  px(2, -41, 4, 1, dim(look.hair ?? look.skin));
  if (look.mask) px(-6, -36, 12, 6, look.mask);

  // cabelo / elmo
  if (look.helm) {
    px(-7, -49, 14, 7, look.metal);
    px(-7, -49, 14, 2, lit(look.metal));
    px(-7, -43, 14, 1, dim(look.metal));
    px(-1, -51, 3, 3, look.trim ?? lit(look.metal));
    px(-1, -42, 2, 6, dim(look.metal));
  } else {
    const hair = look.hair ?? '#3a2c22';
    px(-7, -48, 14, 6, hair);
    px(-7, -48, 14, 2, lit(hair));
    if (look.hairStyle === 'long') { px(-9, -46, 3, 16, hair); px(7, -46, 3, 16, hair); }
    if (look.hairStyle === 'spiky') for (let i = -7; i < 7; i += 3) px(i, -51, 3, 3, i % 2 ? hair : lit(hair));
  }
  if (look.beard) px(-5, -34, 10, 5, look.hair ?? '#5a4a3a');
}

function drawWeaponA(px, look, lit, dim) {
  const m = look.metal;
  switch (look.weapon) {
    case 'sword':
      px(11, -42, 4, 24, m); px(11, -42, 2, 24, lit(m));
      px(9, -19, 8, 2, look.trim ?? '#8a6a3a'); px(11, -17, 4, 6, look.leather);
      break;
    case 'dagger':
      px(11, -28, 3, 11, m); px(11, -28, 1, 11, lit(m));
      px(10, -18, 5, 2, '#6a4a30');
      break;
    case 'mace':
      px(11, -34, 3, 20, look.leather);
      px(9, -40, 7, 7, m); px(9, -40, 7, 2, lit(m)); px(9, -35, 7, 2, dim(m));
      break;
    case 'staff':
      px(11, -50, 3, 36, look.leather);
      px(9, -55, 7, 7, look.glow ?? m); px(11, -53, 3, 3, '#ffffff');
      break;
    case 'bow':
      px(11, -44, 3, 28, '#6a4a30');
      px(9, -46, 4, 3, '#6a4a30'); px(9, -19, 4, 3, '#6a4a30');
      px(14, -43, 1, 26, '#e8e2d0');
      break;
    default: break;
  }
}

// ===========================================================================
// B — SILHUETA FORTE
// Cor chapada, contorno grosso, formas simplificadas, cabeça maior.
// Linhagem de jogo de tabuleiro moderno: lê perfeitamente em qualquer tamanho.
// ===========================================================================
function paintSilhouette(ctx, ox, oy, look) {
  const { px } = brush(ctx, ox, oy);
  const ink = '#15121c';
  const armor = look.armorStyle === 'plate' || look.armorStyle === 'scale' ? look.metal
    : look.armorStyle === 'leather' ? look.leather : look.outfit;

  // A capa é curta de propósito: se cobrir as pernas, a figura vira um saco.
  if (look.cloak) px(-12, -38, 24, 22, look.cloak);
  drawWeaponB(px, look, ink);

  // pernas separadas — o vão entre elas é o que faz a figura "ficar de pé"
  px(-9, -18, 7, 14, look.pants);
  px(2, -18, 7, 14, look.pants);
  px(-10, -5, 8, 5, ink);
  px(2, -5, 8, 5, ink);

  // torso: ombros largos, cintura estreita
  px(-9, -34, 18, 17, armor);
  px(-12, -36, 24, 7, armor);
  px(-7, -19, 14, 3, look.belt ?? shade(armor, 0.6));
  if (look.trim) px(-9, -26, 18, 3, look.trim);

  // braços
  px(-15, -34, 5, 15, shade(armor, 0.78));
  px(10, -34, 5, 15, shade(armor, 0.78));
  if (look.weapon && look.weapon !== 'none') px(10, -21, 6, 5, look.skin); // mão no cabo

  if (look.shield) {
    px(-20, -34, 9, 19, look.metal);
    px(-18, -28, 5, 8, look.trim ?? shade(look.metal, 0.6));
  }

  // cabeça grande, pouco detalhe
  px(-8, -52, 16, 16, look.skin);
  if (look.helm) {
    px(-9, -55, 18, 10, look.metal);
    px(-3, -45, 6, 7, ink);                  // visor
  } else {
    px(-9, -56, 18, 8, look.hair ?? ink);
    if (look.hairStyle === 'long') { px(-11, -53, 3, 22, look.hair ?? ink); px(8, -53, 3, 22, look.hair ?? ink); }
    px(-6, -45, 4, 4, look.eyes);
    px(2, -45, 4, 4, look.eyes);
  }
  if (look.mask) px(-8, -45, 16, 9, look.mask);
  if (look.ears) { px(-11, -49, 3, 5, look.skin); px(8, -49, 3, 5, look.skin); }
}

function drawWeaponB(px, look, ink) {
  const m = look.metal;
  switch (look.weapon) {
    case 'sword': px(13, -52, 6, 30, m); px(11, -24, 10, 3, look.leather); break;
    case 'dagger': px(13, -36, 5, 15, m); px(11, -23, 9, 3, look.leather); break;
    case 'mace': px(13, -40, 5, 22, look.leather); px(10, -48, 11, 10, m); break;
    case 'staff': px(13, -52, 5, 36, look.leather); px(10, -58, 11, 9, look.glow ?? m); break;
    case 'bow': px(13, -52, 5, 34, look.leather); px(19, -50, 2, 30, '#e8e2d0'); break;
    default: break;
  }
}

// ===========================================================================
// C — MINIATURA PINTADA
// Base circular, paleta dessaturada, luz forte de cima e brilho de aresta.
// Parece peça de metal pintada à mão sobre a mesa.
// ===========================================================================
function paintMiniature(ctx, ox, oy, look) {
  const { px } = brush(ctx, ox, oy);
  const mute = (c) => desat(c, 0.3);
  const top = (c) => shade(desat(c, 0.25), 1.35);
  const low = (c) => shade(desat(c, 0.35), 0.55);

  // base da miniatura
  px(-13, -3, 26, 3, '#4a4740');
  px(-13, -3, 26, 1, '#6e6a60');
  px(-11, 0, 22, 2, '#2e2c28');

  if (look.cloak) {
    px(-10, -34, 20, 26, mute(look.cloak));
    px(-10, -34, 20, 2, top(look.cloak));
  }
  drawWeaponC(px, look, top, low, mute);

  // pernas
  px(-6, -14, 5, 11, mute(look.pants));
  px(2, -14, 5, 11, mute(look.pants));
  px(-6, -14, 5, 2, top(look.pants));
  px(-7, -5, 7, 3, mute(look.leather));
  px(1, -5, 7, 3, mute(look.leather));

  // torso: o material segue o que a pessoa está vestindo, não um metal fixo
  const armor = look.armorStyle === 'plate' || look.armorStyle === 'scale' ? look.metal
    : look.armorStyle === 'leather' ? look.leather : look.outfit;
  px(-8, -32, 16, 19, mute(armor));
  px(-8, -32, 16, 3, top(armor));
  px(-8, -16, 16, 3, low(armor));
  px(6, -30, 2, 15, low(armor));
  if (look.armorStyle === 'plate') {
    px(-9, -33, 5, 5, top(look.metal));
    px(4, -33, 5, 5, top(look.metal));
    px(-1, -30, 2, 15, low(look.metal));
  }
  if (look.armorStyle === 'scale') {
    for (let r = 0; r < 5; r++) {
      for (let c = -7; c < 8; c += 4) px(c + (r % 2) * 2, -30 + r * 3, 3, 3, r % 2 ? low(armor) : mute(armor));
    }
  }
  if (look.armorStyle === 'leather') {
    px(-8, -26, 16, 2, low(armor));
    px(-8, -21, 16, 2, low(armor));
  }
  if (look.trim) px(-8, -20, 16, 2, mute(look.trim));

  px(-11, -31, 3, 13, mute(armor));
  px(11, -31, 3, 13, mute(armor));
  px(-11, -18, 3, 4, mute(look.skin));
  px(11, -18, 3, 4, mute(look.skin));

  if (look.shield) {
    px(-16, -31, 7, 17, mute(look.metal));
    px(-16, -31, 7, 2, top(look.metal));
    px(-14, -25, 3, 6, mute(look.trim ?? look.metal));
  }

  // cabeça
  px(-6, -46, 12, 15, mute(look.skin));
  px(-6, -46, 12, 2, top(look.skin));
  px(-6, -34, 12, 2, low(look.skin));
  px(-3, -40, 2, 2, '#2a2420');
  px(2, -40, 2, 2, '#2a2420');
  if (look.mask) px(-6, -38, 12, 6, mute(look.mask));

  if (look.helm) {
    px(-7, -50, 14, 7, mute(look.metal));
    px(-7, -50, 14, 2, top(look.metal));
    px(-1, -52, 3, 3, mute(look.trim ?? look.metal));
  } else {
    const hair = mute(look.hair ?? '#4a3a2a');
    px(-7, -49, 14, 6, hair);
    px(-7, -49, 14, 2, shade(hair, 1.3));
    if (look.hairStyle === 'long') { px(-9, -47, 3, 15, hair); px(7, -47, 3, 15, hair); }
  }
  if (look.beard) px(-5, -35, 10, 5, mute(look.hair ?? '#5a4a3a'));
  if (look.ears) { px(-8, -41, 2, 4, mute(look.skin)); px(6, -41, 2, 4, mute(look.skin)); }
}

function drawWeaponC(px, look, top, low, mute) {
  const m = look.metal;
  switch (look.weapon) {
    case 'sword': px(12, -44, 4, 26, mute(m)); px(12, -44, 2, 26, top(m)); px(10, -19, 8, 2, mute(look.leather)); break;
    case 'dagger': px(12, -29, 3, 12, mute(m)); px(12, -29, 1, 12, top(m)); break;
    case 'mace': px(12, -35, 3, 21, mute(look.leather)); px(10, -42, 7, 8, mute(m)); px(10, -42, 7, 2, top(m)); break;
    case 'staff': px(12, -52, 3, 38, mute(look.leather)); px(10, -57, 7, 7, mute(look.glow ?? m)); break;
    case 'bow': px(12, -46, 3, 30, mute('#6a4a30')); px(15, -45, 1, 28, '#d8d2c0'); break;
    default: break;
  }
}

// ===========================================================================
// D — ILUSTRADO DRAMÁTICO
// Sombra preta tomando a parte de baixo, paleta reduzida, um acento saturado,
// ombros exagerados e olhos acesos no escuro do rosto.
// ===========================================================================
function paintDramatic(ctx, ox, oy, look) {
  const { px } = brush(ctx, ox, oy);
  const ink = '#0d0b12';
  const dark = (c) => shade(desat(c, 0.45), 0.42);
  const acento = look.trim ?? look.eyes;
  const armor = look.armorStyle === 'plate' || look.armorStyle === 'scale' ? look.metal
    : look.armorStyle === 'leather' ? look.leather : look.outfit;

  if (look.cloak) {
    px(-13, -36, 26, 30, dark(look.cloak));
    px(-13, -36, 26, 3, shade(desat(look.cloak, 0.3), 0.9));
  }
  drawWeaponD(px, look, ink, acento);

  // pernas engolidas pela sombra
  px(-7, -14, 14, 14, ink);
  px(-7, -14, 14, 2, dark(look.pants));

  // torso com ombros largos
  px(-8, -32, 16, 20, dark(armor));
  px(-13, -34, 26, 7, dark(armor));
  px(-13, -34, 26, 2, shade(desat(armor, 0.3), 1.1));
  px(-8, -18, 16, 6, ink);                     // sombra subindo
  if (look.trim) px(-8, -24, 16, 2, acento);

  px(-14, -31, 4, 13, dark(armor));
  px(10, -31, 4, 13, dark(armor));
  px(-14, -19, 4, 4, ink);
  px(10, -19, 4, 4, ink);

  if (look.shield) {
    px(-19, -33, 8, 19, dark(look.metal));
    px(-19, -33, 8, 2, shade(look.metal, 0.95));
    px(-17, -26, 4, 7, acento);
  }

  // cabeça: rosto quase todo em sombra, olhos acesos
  px(-7, -48, 14, 16, dark(look.skin));
  px(-7, -48, 14, 2, shade(desat(look.skin, 0.2), 1.05));
  px(-7, -38, 14, 6, ink);
  px(-4, -41, 3, 3, acento);
  px(2, -41, 3, 3, acento);
  if (look.mask) px(-7, -40, 14, 8, ink);

  if (look.helm) {
    px(-8, -53, 16, 9, dark(look.metal));
    px(-8, -53, 16, 2, shade(look.metal, 1.05));
    px(-2, -56, 4, 4, acento);
    px(-8, -44, 16, 3, ink);
  } else {
    const hair = dark(look.hair ?? '#2a2028');
    px(-8, -53, 16, 8, hair);
    if (look.hairStyle === 'long') { px(-10, -50, 3, 20, hair); px(8, -50, 3, 20, hair); }
    if (look.hairStyle === 'spiky') for (let i = -8; i < 8; i += 4) px(i, -57, 4, 5, hair);
  }
  if (look.ears) { px(-10, -44, 3, 5, dark(look.skin)); px(7, -44, 3, 5, dark(look.skin)); }
}

function drawWeaponD(px, look, ink, acento) {
  switch (look.weapon) {
    case 'sword': px(14, -48, 5, 30, ink); px(15, -48, 2, 30, acento); px(11, -20, 11, 3, ink); break;
    case 'dagger': px(14, -31, 4, 15, ink); px(15, -31, 1, 15, acento); break;
    case 'mace': px(14, -37, 4, 23, ink); px(10, -46, 12, 11, ink); px(14, -43, 4, 4, acento); break;
    case 'staff': px(14, -52, 4, 38, ink); px(10, -58, 12, 10, ink); px(14, -55, 4, 4, acento); break;
    case 'bow': px(14, -50, 4, 34, ink); px(18, -48, 2, 30, acento); break;
    default: break;
  }
}

export const STYLES = [
  {
    id: 'A',
    name: 'Pixel art refinado',
    pitch: 'O traço de hoje, com o dobro de resolução e três tons por material: base, luz de cima-esquerda e sombra. Proporção heroica, equipamento com peça própria.',
    pros: ['Continuidade: nada do que já existe se perde', 'Equipamento lê bem: elmo, escudo e arma têm forma própria', 'Mais barato de levar adiante — é refinar, não refazer'],
    cons: ['Continua sendo "jogo indie em pixel"', 'Detalhe fino some quando a câmera se afasta'],
    outline: { color: '#1a1520', width: 1 },
    paint: paintRefined,
  },
  {
    id: 'B',
    name: 'Silhueta forte',
    pitch: 'Cor chapada, contorno grosso, ombros largos e cabeça maior. Linhagem de jogo de tabuleiro moderno: a forma carrega a informação, não a textura.',
    pros: ['Leitura perfeita em qualquer tamanho e com zoom afastado', 'Acessível: alto contraste, não depende de detalhe fino', 'Identidade visual própria e barata de manter'],
    cons: ['Menos "fantasia", mais "jogo de tabuleiro"', 'Equipamento diferencia por forma; detalhe de material se perde'],
    outline: { color: '#15121c', width: 2 },
    paint: paintSilhouette,
  },
  {
    id: 'C',
    name: 'Miniatura pintada',
    pitch: 'Base circular, paleta dessaturada, luz forte de cima e brilho de aresta. Parece peça de metal pintada à mão em cima da mesa.',
    pros: ['Casa com a fantasia de D&D sem imitar ferramenta de VTT', 'A base ancora a figura no quadrado — ajuda no isométrico', 'Paleta dessaturada faz os efeitos coloridos saltarem'],
    cons: ['Dessaturado pode ficar monótono em mapa grande', 'Inimigo e herói ficam mais parecidos entre si'],
    outline: { color: '#231f1a', width: 1 },
    paint: paintMiniature,
  },
  {
    id: 'D',
    name: 'Ilustrado dramático',
    pitch: 'Sombra preta engolindo a parte de baixo, paleta reduzida com um acento saturado, ombros exagerados e olhos acesos no escuro do rosto.',
    pros: ['De longe o mais marcante e o mais adulto', 'Acento colorido vira linguagem: ouro aliado, vermelho inimigo', 'Esconde falta de detalhe na sombra — barato para o que entrega'],
    cons: ['Escuro demais para mapa noturno ou caverna', 'Difícil distinguir dois personagens da mesma classe', 'Exige disciplina de paleta em todo conteúdo novo'],
    outline: { color: '#e8dfc8', width: 1 },
    paint: paintDramatic,
  },
];
