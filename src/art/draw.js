// O pintor: look → pixels, com fillRect. Nenhum arquivo de arte no repositório.
//
// COORDENADAS
//   cx = floor(w / 2)   centro horizontal da célula
//   gy = h - GROUND     linha do chão; tudo se mede PARA CIMA (y negativo)
//   px(x, y, w, h, cor) retângulo relativo a (cx, gy)
//
// ANATOMIA
//   Nenhuma medida é fixa aqui. `body.js` devolve, para cada look, onde fica o
//   queixo, a cintura, o alto da cabeça e quanto mede cada largura. É o que
//   faz um goblin de 32 px e um bugbear de 57 px saírem do mesmo código — e o
//   que impede o hobgoblin de virar "humano de armadura".
//
// TOM
//   Três tons por material: base, luz (de cima-esquerda) e sombra. O contorno
//   preto é posto depois, em sheet.js, varrendo o alfa.

import { metrics } from './body.js';

export const GROUND = 4;

// Três vistas desenhadas. Com o espelhamento horizontal elas cobrem as oito
// orientações da grade — e as quatro diagonais que a câmera isométrica usa.
export const DIRECTIONS = ['front', 'side', 'back'];

export function shade(hex, mult) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v) => Math.max(0, Math.min(255, Math.round(v * mult))).toString(16).padStart(2, '0');
  return `#${ch(n >> 16)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
}

const lit = (c) => shade(c, 1.22);
const dim = (c) => shade(c, 0.74);
const r = Math.round;

const lum = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11) / 255;
};

/**
 * Afasta uma cor de outra até dar para distinguir as duas. Serve para barba
 * contra pele: cabelo castanho-claro em pele morena vira uma mancha só, e a
 * barba é metade da leitura de um anão.
 */
function apart(color, from, min = 0.14) {
  let c = color;
  const subir = lum(color) >= lum(from);
  for (let i = 0; i < 6 && Math.abs(lum(c) - lum(from)) < min; i++) {
    c = shade(c, subir ? 1.16 : 0.84);
  }
  return c;
}

export function paint(ctx, ox, oy, w, h, look, dir, pose) {
  const cx = Math.floor(w / 2);
  const gy = h - GROUND;
  const px = (x, y, pw, ph, color) => {
    if (pw <= 0 || ph <= 0) return;
    ctx.fillStyle = color;
    ctx.fillRect(ox + cx + x, oy + gy + y, pw, ph);
  };
  const cut = (x, y, cw = 1, ch = 1) => ctx.clearRect(ox + cx + x, oy + gy + y, cw, ch);

  if (look.quadruped) return paintBeast(px, look, dir, pose);

  const m = metrics(look);
  const side = dir === 'side';
  const back = dir === 'back';
  const front = dir === 'front';

  if (pose.kind === 'down') return paintDown(px, look, m);

  // ---- pose ----------------------------------------------------------------
  const attack = pose.kind === 'attack';
  const bob = pose.kind === 'idle' && pose.frame === 1 ? -1 : 0;
  const lean = attack ? (pose.frame === 1 ? 2 : 1) : 0;
  const recoil = pose.kind === 'hurt' ? -2 : 0;
  // Corcunda: o tronco e a cabeça descem e, de perfil, avançam.
  const stoop = m.hunch;
  const upper = bob + recoil + stoop;
  const lead = side ? r(stoop * 0.8) : 0;

  const chin = m.chin + upper;
  const torsoTop = m.torsoTop + upper;
  const headTop = m.headTop + upper;
  const crown = m.crown + upper;

  const chest = side ? Math.max(5, r(m.chestW * 0.62)) : m.chestW;
  const shoulder = side ? Math.max(6, r(m.shoulderW * 0.58)) : m.shoulderW;
  const headW = side ? Math.max(6, r(m.headW * 0.82)) : m.headW;
  const chestX = -Math.floor(chest / 2);
  const shoulderX = -Math.floor(shoulder / 2);
  const headX = -Math.floor(headW / 2) + lead;

  // ---- capa ----------------------------------------------------------------
  // De costas a capa cobre o corpo inteiro: é o que torna a vista traseira
  // legível num relance, sem precisar de rosto.
  if (look.cloak) {
    const cw = back ? m.shoulderW + 2 : side ? Math.max(3, r(m.chestW * 0.3)) : m.shoulderW;
    const cxo = back ? -Math.floor(cw / 2) : side ? shoulderX - 1 : shoulderX;
    const ch = back ? m.torsoH + m.legH - 2 : r(m.torsoH * 0.9);
    px(cxo, torsoTop + 1, cw, ch, look.cloak);
    px(cxo, torsoTop + 1, cw, 1, lit(look.cloak));
    px(cxo, torsoTop + ch, cw, 1, dim(look.cloak));
    if (back) px(cxo + Math.floor(cw / 2), torsoTop + 1, 1, ch, dim(look.cloak));
  }

  // ---- arma ----------------------------------------------------------------
  // De costas a arma fica atrás do corpo; de frente e de perfil ela vem na
  // FRENTE do braço, senão some atrás da manga e a figura perde a leitura.
  const arma = () => drawWeapon(px, look, m, { side, back, lean, attack, frame: pose.frame, upper });
  if (back && !look.cloak) arma();

  // ---- pernas --------------------------------------------------------------
  const robe = look.armorStyle === 'robe';
  if (!robe) drawLegs(px, look, m, { side, attack, lean });

  // ---- tronco --------------------------------------------------------------
  drawTorso(px, look, m, { chestX, chest, torsoTop, side, back, robe });

  // ---- braços --------------------------------------------------------------
  const sleeve = look.armorStyle === 'plate' ? look.metal : look.outfit;
  const armY = torsoTop + 2 + (attack ? -2 : 0);
  const armH = Math.max(4, r(m.torsoH * 0.62));
  if (side) {
    px(lead, armY, m.armW, armH, sleeve);
    px(lead, armY, m.armW, 1, lit(sleeve));
    px(lead, armY + armH, m.armW, 2, look.skin);
  } else {
    const leftX = shoulderX - 1;
    const rightX = shoulderX + shoulder - m.armW + 1;
    px(leftX, armY, m.armW, armH, sleeve);
    px(rightX, armY - lean, m.armW, armH, sleeve);
    px(leftX, armY, m.armW, 1, lit(sleeve));
    px(rightX, armY - lean, m.armW, 1, lit(sleeve));
    px(leftX, armY + armH, m.armW, 2, look.skin);
    px(rightX, armY + armH - lean, m.armW, 2, look.skin);
  }

  if (!back) arma();

  // ---- escudo --------------------------------------------------------------
  // Mais alto que largo e com os cantos cortados: um retângulo cheio lê como
  // bandeja, não como escudo.
  if (look.shield) {
    const sw = Math.max(5, r(m.shoulderW * 0.36));
    const sh = Math.max(9, r(m.torsoH * 1.05));
    const sy = torsoTop + 1;
    const sx = side ? shoulderX - 2 : back ? shoulderX + shoulder - 1 : shoulderX - sw + 2;
    px(sx, sy + 1, sw, sh - 2, look.metal);
    px(sx + 1, sy, sw - 2, sh, look.metal);
    px(sx + 1, sy, sw - 2, 1, lit(look.metal));
    px(sx, sy + 1, 1, sh - 2, lit(look.metal));
    px(sx + sw - 1, sy + 1, 1, sh - 2, dim(look.metal));
    px(sx + 1, sy + sh - 1, sw - 2, 1, dim(look.metal));
    const bw = Math.max(2, sw - 4);
    px(sx + Math.floor((sw - bw) / 2), sy + r(sh * 0.36), bw, Math.max(2, r(sh * 0.28)), look.trim ?? dim(look.metal));
  }

  // ---- pescoço -------------------------------------------------------------
  if (m.neckH > 0) {
    const nw = Math.max(2, r(headW * 0.45));
    px(-Math.floor(nw / 2) + lead, chin, nw, m.neckH + 1, shade(look.skin, 0.88));
  }

  // ---- cabeça --------------------------------------------------------------
  drawHead(px, cut, look, m, { headX, headW, headTop, chin, front, side, back, lead });

  // ---- cabelo / elmo -------------------------------------------------------
  drawCrown(px, look, m, { headX, headW, headTop, crown, front, side, back, lead });

  if (look.horns) {
    const hy = crown - Math.max(2, r(m.headH * 0.35));
    px(headX - 1, hy, 2, headTop - hy + 1, shade(look.skin, 0.6));
    px(headX + headW - 1, hy, 2, headTop - hy + 1, shade(look.skin, 0.6));
  }
}

// ---------------------------------------------------------------------------

function drawLegs(px, look, m, { side, attack, lean }) {
  const color = look.outfitDark;
  const h = m.legH;
  const y = m.waist;
  if (side) {
    const step = attack ? 2 : 0;
    px(-r(m.legW / 2) - step, y, m.legW, h, dim(color));
    px(-r(m.legW / 2) - step - 1, m.footTop, m.footW, m.feetH, dim(look.leather));
    px(-r(m.legW / 2) + step + lean, y, m.legW, h, color);
    px(-r(m.legW / 2) + step + lean - 1, m.footTop, m.footW, m.feetH, look.leather);
  } else {
    const half = m.legW + Math.floor(m.gap / 2);
    px(-half, y, m.legW, h, color);
    px(half - m.legW + m.gap, y, m.legW, h, color);
    px(-half, y, m.legW, 1, lit(color));
    px(half - m.legW + m.gap, y, m.legW, 1, lit(color));
    const boot = m.sp?.bigFeet ? look.skin : look.leather;
    px(-half - 1, m.footTop, m.footW, m.feetH, boot);
    px(half - m.legW + m.gap - 1, m.footTop, m.footW, m.feetH, boot);
    px(-half - 1, m.footTop + m.feetH - 1, m.footW, 1, dim(boot));
    px(half - m.legW + m.gap - 1, m.footTop + m.feetH - 1, m.footW, 1, dim(boot));
  }
}

function drawTorso(px, look, m, { chestX, chest, torsoTop, side, back, robe }) {
  const bottom = robe ? m.footTop : m.waist + 1;
  const h = bottom - torsoTop;

  // base: a roupa por baixo de tudo
  px(chestX, torsoTop, chest, h, look.outfit);
  px(chestX, torsoTop, chest, 1, lit(look.outfit));
  px(chestX + chest - 1, torsoTop, 1, h, dim(look.outfit));

  // barriga: alarga a parte de baixo do tronco
  if (m.belly > 0 && !robe) {
    const bw = Math.min(chest + m.belly, m.shoulderW + 2);
    const bx = -Math.floor(bw / 2);
    const by = torsoTop + r(h * 0.45);
    px(bx, by, bw, bottom - by, look.outfit);
    px(bx, by, bw, 1, lit(look.outfit));
    px(bx + bw - 1, by, 1, bottom - by, dim(look.outfit));
  }

  const plateY = torsoTop + 1;
  const plateH = Math.max(4, (robe ? m.waist : bottom) - plateY);

  switch (look.armorStyle) {
    case 'plate': {
      px(chestX, plateY, chest, plateH, look.metal);
      px(chestX, plateY, chest, 1, lit(look.metal));
      px(chestX, plateY + plateH - 1, chest, 1, dim(look.metal));
      px(chestX + Math.floor(chest / 2), plateY + 1, 1, plateH - 2, dim(look.metal));
      // ombreiras: passam da largura do peito, é o que dá a leitura de placas
      const pw = Math.max(3, r(m.shoulderW * 0.3));
      px(chestX - 2, plateY, pw, Math.max(3, r(plateH * 0.35)), lit(look.metal));
      px(chestX + chest + 2 - pw, plateY, pw, Math.max(3, r(plateH * 0.35)), look.metal);
      break;
    }
    case 'scale': {
      const rows = Math.max(3, Math.floor(plateH / 2));
      for (let i = 0; i < rows; i++) {
        for (let c = 0; c < chest; c += 2) {
          px(chestX + c + (i % 2), plateY + i * 2, 1, 2, i % 2 ? dim(look.metal) : look.metal);
        }
      }
      break;
    }
    case 'leather': {
      px(chestX, plateY, chest, plateH, look.leather);
      px(chestX, plateY, chest, 1, lit(look.leather));
      px(chestX, plateY + r(plateH * 0.4), chest, 1, dim(look.leather));
      px(chestX, plateY + plateH - 1, chest, 1, dim(look.leather));
      break;
    }
    default: // robe / sem armadura: já está pintado pela roupa
      if (robe) {
        px(chestX, bottom - 1, chest, 1, dim(look.outfit));
        px(chestX + 1, m.waist, chest - 2, 1, dim(look.outfit));
      }
      break;
  }

  if (look.trim) px(chestX, torsoTop + r(h * 0.45), chest, 1, look.trim);
  if (!robe && !back) {
    const belt = look.trim ?? dim(look.leather);
    px(chestX, m.waist - 2, chest, 2, look.leather);
    px(chestX + Math.floor(chest / 2) - 1, m.waist - 2, 2, 2, belt);
  }
}

function drawHead(px, cut, look, m, { headX, headW, headTop, chin, front, side, back, lead }) {
  const sp = m.sp;
  const skinDark = shade(look.skin, 0.82);
  const jaw = sp.jaw ?? 0;
  const headH = chin - headTop;
  const jawY = headTop + r(headH * 0.55);
  const jawW = Math.max(4, headW + jaw * 2);
  const jawX = -Math.floor(jawW / 2) + lead;

  // crânio e maxilar são dois blocos: é a diferença entre queixo quadrado de
  // hobgoblin e queixo afilado de elfo.
  px(headX, headTop, headW, jawY - headTop, look.skin);
  px(jawX, jawY, jawW, chin - jawY, look.skin);
  px(headX, headTop, headW, 1, shade(look.skin, 1.12));
  px(jawX, chin - 1, jawW, 1, skinDark);
  px(headX + headW - 1, headTop + 1, 1, jawY - headTop - 1, skinDark);
  cut(headX, headTop);
  cut(headX + headW - 1, headTop);
  cut(jawX, chin - 1);
  cut(jawX + jawW - 1, chin - 1);

  // ---- orelhas -------------------------------------------------------------
  const earY = headTop + r(headH * 0.35);
  if (sp.ear === 'wide') {
    // goblin / hobgoblin / bugbear: abanando para os lados, pontudas
    const len = Math.max(2, r(headW * 0.42));
    for (const s of [-1, 1]) {
      const x = s < 0 ? headX - len : headX + headW;
      px(x, earY, len, 3, look.skin);
      px(x, earY - 1, len - 1, 1, look.skin);
      px(x, earY + 3, len - 1, 1, skinDark);
    }
  } else if (sp.ear === 'long') {
    // elfo: coladas e apontando para cima
    for (const s of [-1, 1]) {
      const x = s < 0 ? headX - 2 : headX + headW;
      px(x, earY, 2, 4, look.skin);
      px(x, earY - 2, 2, 2, look.skin);
      px(x, earY - 3, 1, 1, look.skin);
    }
  } else if (look.ears !== false) {
    for (const s of [-1, 1]) {
      const x = s < 0 ? headX - 1 : headX + headW;
      px(x, earY, 1, 3, look.skin);
    }
  }

  if (back) {
    px(headX + 1, headTop + 2, headW - 2, chin - headTop - 3, skinDark);
    return;
  }

  // ---- rosto ---------------------------------------------------------------
  const eyeY = headTop + r(headH * 0.38);
  const eyeW = sp.bigEyes ? 3 : 2;
  const eyeH = sp.bigEyes ? 3 : 2;

  if (sp.brow) {
    px(headX + 1, eyeY - 2, headW - 2, 2, shade(look.skin, 0.62));
  }

  if (front) {
    const off = Math.max(1, r(headW * 0.16));
    px(-off - eyeW + lead, eyeY, eyeW, eyeH, '#f4efe4');
    px(off + lead, eyeY, eyeW, eyeH, '#f4efe4');
    px(-off - eyeW + 1 + lead, eyeY, eyeW - 1, eyeH, look.eyes);
    px(off + lead, eyeY, eyeW - 1, eyeH, look.eyes);
  } else {
    px(r(headW * 0.15) + lead, eyeY, eyeW, eyeH, look.eyes);
  }

  // ---- nariz / focinho -----------------------------------------------------
  const noseY = eyeY + eyeH + 1;
  if (sp.snout) {
    // goblin e bugbear: o focinho avança para fora da linha do rosto
    const nw = Math.max(3, r(headW * 0.34));
    px(-Math.floor(nw / 2) + lead, noseY, nw, 2, skinDark);
    px(side ? headX + headW : -Math.floor(nw / 2) + lead, noseY, side ? 2 : nw, 1, look.skin);
    if (side) px(headX + headW, noseY, 3, 2, look.skin);
  } else if (sp.flatNose || sp.wideNose) {
    const nw = Math.max(3, r(headW * 0.3));
    px(-Math.floor(nw / 2) + lead, noseY, nw, 2, skinDark);
  } else {
    px(lead - 1, noseY, 2, 2, skinDark);
  }

  // ---- boca, presas e defesas ----------------------------------------------
  const mouthY = Math.min(chin - 2, noseY + 2);
  px(-Math.max(1, r(headW * 0.2)) + lead, mouthY, Math.max(3, r(headW * 0.4)), 1, shade(look.skin, 0.55));
  if (sp.fangs) {
    px(-Math.max(1, r(headW * 0.2)) + lead, mouthY + 1, 1, 1, '#efe8d4');
    px(Math.max(1, r(headW * 0.2)) - 1 + lead, mouthY + 1, 1, 1, '#efe8d4');
  }
  if (sp.tusks) {
    px(-Math.max(2, r(headW * 0.26)) + lead, mouthY - 1, 2, 3, '#efe8d4');
    px(Math.max(2, r(headW * 0.26)) - 2 + lead, mouthY - 1, 2, 3, '#efe8d4');
  }

  // ---- barba ---------------------------------------------------------------
  if ((look.beard || sp.beardAlways) && !back) {
    const farta = !!sp.beardAlways;                  // anão: barba até o peito
    const hair = apart(look.hair ?? '#4a3a2a', look.skin);
    const by = farta ? eyeY + eyeH + 1 : mouthY + 1;
    const bw = jawW + (farta ? 4 : 0);
    const bx = -Math.floor(bw / 2) + lead;
    const queda = farta ? r(m.headH * 0.55) : 1;
    px(bx, by, bw, chin - by, hair);
    px(bx, by, bw, 1, lit(hair));
    px(bx + 1, chin, bw - 2, queda, hair);
    px(bx + 2, chin + queda, bw - 4, 1, dim(hair));
    if (farta) {
      px(bx + 1, chin + queda - 1, bw - 2, 1, dim(hair));
      px(bx, by, 1, chin - by, dim(hair));
    }
  }
}

function drawCrown(px, look, m, { headX, headW, headTop, crown, front, side, lead }) {
  const hairH = headTop - crown;
  if (look.helm) {
    const hw = headW + 2;
    const hx = headX - 1;
    px(hx, crown, hw, hairH + r(m.headH * 0.4), look.metal);
    px(hx, crown, hw, 1, lit(look.metal));
    px(hx, crown + hairH + r(m.headH * 0.4) - 1, hw, 1, dim(look.metal));
    px(-1 + lead, crown - 2, 2, 2, look.trim ?? lit(look.metal));
    if (front) px(-1 + lead, headTop + 1, 2, r(m.headH * 0.5), dim(look.metal)); // nasal
    return;
  }

  const hair = look.hair ?? '#3a2c22';
  const long = look.hairStyle === 'long';
  switch (look.hairStyle) {
    case 'bald':
      px(headX + 1, crown + hairH - 1, headW - 2, 1, shade(look.skin, 1.1));
      break;
    case 'hood':
      px(headX - 1, crown, headW + 2, hairH + r(m.headH * 0.55), look.outfitDark);
      px(headX - 1, crown, headW + 2, 1, lit(look.outfitDark));
      break;
    case 'spiky':
      px(headX, crown + 1, headW, hairH, hair);
      for (let i = 0; i < headW; i += 2) {
        px(headX + i, crown - 1, 2, 2, i % 4 === 0 ? hair : dim(hair));
      }
      break;
    default:
      px(headX, crown, headW, hairH + 1, hair);
      px(headX, crown, headW, 1, lit(hair));
      px(headX - 1, crown + 1, 1, hairH + 1, hair);
      px(headX + headW, crown + 1, 1, hairH + 1, hair);
      break;
  }
  if (long) {
    const fall = r(m.headH * 1.1);
    px(headX - 1, crown + 1, 2, fall, hair);
    px(headX + headW - 1, crown + 1, 2, fall, hair);
    px(headX - 1, crown + fall, 2, 1, dim(hair));
    px(headX + headW - 1, crown + fall, 2, 1, dim(hair));
  }
  if (side) px(headX + headW - 1, crown, 2, hairH + 1, hair);
}

function drawWeapon(px, look, m, { side, back, lean, attack, frame, upper }) {
  const metal = look.metal;
  const wood = look.leather;
  const swing = attack ? (frame === 1 ? -6 : -3) : 0;
  const x = (side ? m.handX - 2 + lean : back ? -m.handX - 1 : m.handX + 1);
  const y = m.handY + upper + swing;
  // Arma escala com o dono: a espada do bugbear é maior que a do halfling, e
  // a lâmina engrossa junto — 2 px de largura somem numa figura de 46 px.
  const s = Math.max(0.75, Math.min(1.5, m.h));
  const L = (v) => Math.max(2, r(v * s));
  const T = Math.max(2, r(2 * s));          // espessura de lâmina / haste
  const H = T + 2;                          // largura de guarda e cabeça

  switch (look.weapon) {
    case 'sword':
      px(x, y - L(15), T, L(17), metal);
      px(x, y - L(15), 1, L(17), lit(metal));
      px(x + T - 1, y - L(15), 1, L(17), dim(metal));
      px(x - 1, y + 2, H, 1, look.trim ?? wood);
      px(x, y + 3, T, L(4), wood);
      break;
    case 'dagger':
      px(x, y - L(7), T, L(9), metal);
      px(x, y - L(7), 1, L(9), lit(metal));
      px(x - 1, y + 2, H, 1, wood);
      px(x, y + 3, T, L(3), wood);
      break;
    case 'axe':
      px(x, y - L(13), T, L(17), wood);
      px(x - 2, y - L(14), T + 3, L(7), metal);
      px(x - 2, y - L(14), T + 3, 1, lit(metal));
      px(x - 2, y - L(14) + L(7) - 1, T + 3, 1, dim(metal));
      break;
    case 'mace':
      px(x, y - L(11), T, L(15), wood);
      px(x - 2, y - L(15), T + 3, L(6), metal);
      px(x - 2, y - L(15), T + 3, 1, lit(metal));
      px(x - 2, y - L(15) + L(6) - 1, T + 3, 1, dim(metal));
      break;
    case 'staff': {
      const orb = look.glow ?? metal;
      px(x, y - L(24), T, L(30), wood);
      px(x - 2, y - L(29), T + 4, L(6), orb);
      px(x - 1, y - L(30), T + 2, 1, orb);
      px(x - 1, y - L(28), T, 2, '#ffffff');
      px(x - 2, y - L(29) + L(6), T + 4, 1, dim(orb));
      break;
    }
    case 'bow':
      px(x, y - L(15), T, L(21), wood);
      px(x - 1, y - L(16), T, 2, wood);
      px(x - 1, y + L(5), T, 2, wood);
      px(x + T, y - L(14), 1, L(19), '#e8e2d0');
      break;
    default:
      break;
  }
}

/** Caído: um vulto rente ao chão, do tamanho de quem caiu. */
function paintDown(px, look, m) {
  const w = Math.max(10, r(m.shoulderW * 1.3));
  const x = -Math.floor(w / 2);
  const body = look.armorStyle === 'robe' ? look.outfit : look.outfitDark;
  px(x, -5, w, 5, body);
  px(x, -5, w, 1, lit(body));
  px(x, -2, w, 2, dim(body));
  px(x + w - r(w * 0.3), -8, r(m.headW * 0.7), 4, look.skin);
  px(x + w - r(w * 0.3), -8, r(m.headW * 0.7), 1, lit(look.skin));
  px(x - 2, -6, 3, 2, look.leather);
}

/** Quadrúpedes: lobo e afins. */
function paintBeast(px, look, dir, pose) {
  const down = pose.kind === 'down';
  const step = pose.kind === 'attack' ? 2 : pose.frame === 1 ? 1 : 0;
  const body = look.outfit;
  const dark = look.outfitDark;

  if (down) {
    px(-11, -5, 22, 5, dark);
    px(-11, -2, 22, 2, shade(dark, 0.7));
    px(8, -9, 6, 4, look.skin);
    return;
  }

  if (dir === 'side') {
    px(-10, -13, 20, 8, body);            // tronco
    px(-10, -13, 20, 1, lit(body));
    px(-10, -6, 20, 1, dark);
    px(-11, -8, 3, 8, dark);              // traseira
    px(-8 - step, -5, 3, 5, dark);        // patas
    px(-3 + step, -5, 3, 5, dark);
    px(3 - step, -5, 3, 5, dark);
    px(7 + step, -5, 3, 5, dark);
    px(7, -18, 7, 6, body);               // cabeça
    px(7, -18, 7, 1, lit(body));
    px(13, -15, 4, 3, look.skin);         // focinho
    px(16, -15, 1, 2, '#2a2420');
    px(12, -16, 2, 2, look.eyes);
    px(7, -21, 2, 3, dark);               // orelhas
    px(10, -21, 2, 3, dark);
    px(-14, -15, 4, 6, body);             // cauda
    px(-14, -15, 4, 1, lit(body));
  } else {
    px(-6, -14, 12, 9, body);
    px(-6, -14, 12, 1, lit(body));
    px(-6, -6, 12, 1, dark);
    px(-6 - step, -5, 4, 5, dark);
    px(2 + step, -5, 4, 5, dark);
    px(-5, -21, 10, 7, body);
    px(-5, -21, 10, 1, lit(body));
    px(-2, -16, 4, 3, look.skin);
    px(-4, -19, 2, 2, look.eyes);
    px(2, -19, 2, 2, look.eyes);
    px(-6, -24, 3, 4, dark);
    px(3, -24, 3, 4, dark);
  }
}
