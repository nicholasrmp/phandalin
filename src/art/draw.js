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

  // ---- onde a mão fecha ----------------------------------------------------
  // A arma é desenhada A PARTIR da mão, não ao lado do braço. A empunhadura
  // ocupa exatamente os pixels onde a mão está, e a mão é repintada por cima
  // do cabo. Sem isso a figura não segura nada: carrega a espada flutuando.
  const sleeve = look.armorStyle === 'plate' ? look.metal : look.outfit;
  const armY = torsoTop + 2 + (attack ? -2 : 0);
  const armH = Math.max(4, r(m.torsoH * 0.6 * (m.sp.arms ?? 1)));
  // Os braços pendem FORA da linha do ombro, sobrepondo-a em 1 px só. Encostados
  // no tronco, a lâmina que sobe da mão passa por cima do peito e da cabeça.
  const farX = side ? lead - Math.floor(chest / 2) - m.armW : shoulderX - m.armW;
  const nearX = side ? lead + Math.floor(chest / 2) : shoulderX + shoulder;
  const nearY = armY - lean;
  const gripX = nearX;
  const gripY = nearY + armH;

  const braco = (x, y, cor) => {
    px(x, y, m.armW, armH, cor);
    px(x, y, m.armW, 1, lit(cor));
    px(x + m.armW - 1, y + 1, 1, armH - 1, dim(cor));
  };
  const mao = (x, y) => {
    px(x, y, m.armW, 3, look.skin);
    px(x, y, m.armW, 1, lit(look.skin));
    px(x, y + 2, m.armW, 1, shade(look.skin, 0.62));
  };
  const arma = () => drawWeapon(px, look, m, {
    gripX, gripY, armW: m.armW, back, attack, frame: pose.frame,
  });

  // ---- pernas --------------------------------------------------------------
  const robe = look.armorStyle === 'robe';
  if (!robe) drawLegs(px, look, m, { side, attack, lean });

  // De costas a arma fica atrás do corpo.
  if (back && !look.cloak) arma();

  // ---- tronco --------------------------------------------------------------
  drawTorso(px, look, m, { chestX, chest, torsoTop, side, back, robe });

  // ---- braços e arma -------------------------------------------------------
  if (!side) { braco(farX, armY, sleeve); mao(farX, armY + armH); }
  braco(nearX, nearY, sleeve);
  if (!back) arma();
  mao(gripX, gripY);

  // ---- escudo --------------------------------------------------------------
  // Mais alto que largo e com os cantos cortados: um retângulo cheio lê como
  // bandeja, não como escudo.
  // O campo do escudo é pintado com a cor de destaque e só o aro e o umbo são
  // de metal. Escudo inteiro da cor do peitoral vira uma caixa cinza colada no
  // corpo — é a mesma armadilha da lâmina que some dentro da armadura.
  if (look.shield) {
    const campo = look.trim ?? dim(look.metal);
    const aro = look.metal;
    const sw = Math.max(5, r(m.shoulderW * 0.34));
    const sh = Math.max(9, r(m.torsoH * 1.0));
    const sy = torsoTop + 2;
    const sx = side ? shoulderX - 2 : back ? shoulderX + shoulder - 1 : shoulderX - sw + 1;
    px(sx, sy + 1, sw, sh - 2, campo);
    px(sx + 1, sy, sw - 2, sh, campo);
    px(sx + 1, sy, sw - 2, 1, aro);                       // aro
    px(sx, sy + 1, 1, sh - 2, aro);
    px(sx + sw - 1, sy + 1, 1, sh - 2, dim(aro));
    px(sx + 1, sy + sh - 1, sw - 2, 1, dim(aro));
    px(sx + 1, sy + 1, 1, sh - 3, lit(campo));
    const bw = Math.max(2, sw - 4);                       // umbo
    const by = sy + r(sh * 0.38);
    px(sx + Math.floor((sw - bw) / 2), by, bw, bw, aro);
    px(sx + Math.floor((sw - bw) / 2), by, bw, 1, lit(aro));
    px(sx + Math.floor((sw - bw) / 2), by + bw - 1, bw, 1, dim(aro));
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

  // Pelagem: o bugbear do bestiário é um goblinoide peludo. `fur` estava
  // declarado na espécie e o pintor ignorava — ele saía liso como um humano
  // de túnica marrom.
  if (m.sp.fur) {
    const pelo = look.hair ?? dim(look.outfit);
    px(chestX - 1, torsoTop, chest + 2, 3, pelo);          // gola
    px(chestX - 1, torsoTop, chest + 2, 1, lit(pelo));
    px(chestX - 1, torsoTop + 3, chest + 2, 1, dim(pelo));
    for (let c = 1; c < chest - 1; c += 3) {               // tufos no peito
      px(chestX + c, torsoTop + 4, 1, Math.max(2, r(h * 0.3)), dim(pelo));
    }
    px(chestX - 1, m.waist - 4, 2, 4, pelo);
    px(chestX + chest - 1, m.waist - 4, 2, 4, pelo);
  }

  // A faixa de destaque cairia na mesma altura da guarda da espada e as duas
  // leriam como uma barra só atravessando o peito. Nas placas, as ombreiras e
  // a costura central já dão detalhe suficiente.
  if (look.trim && look.armorStyle !== 'plate') {
    px(chestX, torsoTop + r(h * 0.3), chest, 1, look.trim);
  }
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
  if (sp.ear === 'swept') {
    // goblinoides: pontuda, colada ao crânio e inclinada para trás e para
    // cima. Orelha-pá abanando para o lado é gremlin de desenho, não goblin.
    for (const s of [-1, 1]) {
      const x = s < 0 ? headX - 2 : headX + headW;
      px(x, earY, 2, 3, look.skin);
      px(x + (s < 0 ? -1 : 1), earY - 2, 2, 3, look.skin);
      px(x + (s < 0 ? -1 : 2), earY - 3, 1, 1, look.skin);
      px(x + (s < 0 ? 0 : 1), earY + 1, 1, 1, skinDark);
    }
  } else if (sp.ear === 'wide') {
    // bugbear: orelha grande e arredondada, de bicho
    const len = Math.max(3, r(headW * 0.38));
    for (const s of [-1, 1]) {
      const x = s < 0 ? headX - len : headX + headW;
      px(x, earY - 2, len, 5, look.skin);
      px(x, earY - 2, len, 1, lit(look.skin));
      px(x + (s < 0 ? 0 : len - 1), earY - 1, 1, 3, skinDark);
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
  const eyeY = headTop + r(headH * 0.4);
  const eyeW = 2;
  const eyeH = 2;
  // Goblinoide tem olho escuro de bicho: nada de branco em volta, só a íris
  // acesa num buraco preto. É isso que dá o olhar do bestiário.
  const branco = sp.darkEyes ? '#15110e' : '#f4efe4';

  if (sp.brow) {
    px(headX + 1, eyeY - 2, headW - 2, 2, shade(look.skin, 0.58));
    px(headX + 1, eyeY - 3, headW - 2, 1, shade(look.skin, 0.72));
  }

  if (front) {
    const off = Math.max(1, r(headW * 0.18));
    px(-off - eyeW + lead, eyeY, eyeW, eyeH, branco);
    px(off + lead, eyeY, eyeW, eyeH, branco);
    px(-off - eyeW + 1 + lead, eyeY + (sp.darkEyes ? 1 : 0), 1, sp.darkEyes ? 1 : eyeH, look.eyes);
    px(off + lead, eyeY + (sp.darkEyes ? 1 : 0), 1, sp.darkEyes ? 1 : eyeH, look.eyes);
  } else {
    px(r(headW * 0.15) + lead, eyeY, eyeW, eyeH, branco);
    px(r(headW * 0.15) + lead, eyeY + (sp.darkEyes ? 1 : 0), 1, sp.darkEyes ? 1 : eyeH, look.eyes);
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
    // O hobgoblin do bestiário tem o nariz grande e puxado para o azul; é um
    // detalhe pequeno que separa a cara dele da de um humano bronzeado.
    const nw = Math.max(3, r(headW * 0.32));
    const cor = look.noseTint ?? skinDark;
    px(-Math.floor(nw / 2) + lead, noseY, nw, 2, cor);
    px(-Math.floor(nw / 2) + lead, noseY - 1, nw - 2, 1, shade(cor, 1.1));
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

/**
 * A arma, desenhada A PARTIR da empunhadura.
 *
 * `gripX/gripY` são os pixels onde a mão fecha — vêm do braço, não de uma
 * posição inventada. O cabo atravessa esse ponto e a mão é repintada por cima
 * depois, então a figura segura a arma em vez de carregá-la ao lado.
 */
function drawWeapon(px, look, m, { gripX, gripY, armW, attack, frame }) {
  const metal = look.metal;
  const wood = look.leather;
  const trim = look.trim ?? wood;

  // Arma escala com o dono: a espada do bugbear é maior que a do halfling.
  const s = Math.max(0.75, Math.min(1.5, m.h));
  const L = (v) => Math.max(2, r(v * s));
  const T = Math.max(2, r(2 * s));
  const x = gripX + Math.floor((armW - T) / 2);
  // O golpe inclina a lâmina; o braço já subiu, então o movimento se soma.
  const tilt = attack ? (frame === 1 ? T + 2 : T) : 0;

  /**
   * Haste ou lâmina subindo a partir de `baseY`, inclinando se houver golpe.
   *
   * A borda escura dos dois lados não é enfeite: a lâmina é `look.metal`, a
   * mesma cor da armadura de placas, e sem ela a espada simplesmente some
   * dentro do peitoral de quem a segura.
   */
  const haste = (bx, baseY, len, t, cor, inclina = 0) => {
    const borda = shade(cor, 0.42);
    const segs = inclina ? 3 : 1;
    const segH = Math.ceil(len / segs);
    for (let i = 0; i < segs; i++) {
      const off = inclina ? r((inclina * (i + 1)) / segs) : 0;
      const y = baseY - segH * (i + 1);
      px(bx + off - 1, y, t + 2, segH, borda);
      px(bx + off, y, t, segH, cor);
      px(bx + off, y, 1, segH, lit(cor));
    }
    return r(inclina);
  };

  const cabo = (len = 6, cor = wood) => {
    px(x, gripY - 1, T, len, cor);
    px(x, gripY - 1, 1, len, lit(cor));
  };

  switch (look.weapon) {
    case 'sword': {
      cabo(6);
      px(x, gripY + 5, T, 1, trim);                       // pomo
      px(x - 1, gripY - 3, T + 2, 1, trim);               // guarda, estreita:
      px(x - 1, gripY - 2, T + 2, 1, dim(trim));          // larga vira barra atravessada
      haste(x, gripY - 3, L(16), T, metal, tilt);
      break;
    }
    case 'dagger': {
      cabo(5);
      px(x - 1, gripY - 2, T + 2, 1, trim);
      haste(x, gripY - 2, L(7), T, metal, tilt);
      break;
    }
    case 'axe': {
      cabo(L(14) + 4);
      px(x, gripY - 2 - L(14), T, L(14), wood);
      px(x, gripY - 2 - L(14), 1, L(14), lit(wood));
      const hy = gripY - 2 - L(14) + r(tilt * 0.4);
      px(x + T, hy, T + 2, L(6), metal);                  // lâmina de um gume
      px(x + T, hy, T + 2, 1, lit(metal));
      px(x + T, hy + L(6) - 1, T + 2, 1, dim(metal));
      px(x - 1, hy + 1, 1, L(4), dim(metal));
      break;
    }
    case 'mace': {
      cabo(L(12) + 4);
      px(x, gripY - 2 - L(12), T, L(12), wood);
      px(x, gripY - 2 - L(12), 1, L(12), lit(wood));
      const hy = gripY - 2 - L(12) - L(5) + r(tilt * 0.4);
      px(x - 2, hy, T + 4, L(5), metal);
      px(x - 2, hy, T + 4, 1, lit(metal));
      px(x - 2, hy + L(5) - 1, T + 4, 1, dim(metal));
      px(x - 3, hy + 1, 1, L(3), metal);
      px(x + T + 2, hy + 1, 1, L(3), metal);
      break;
    }
    case 'staff': {
      const orb = look.glow ?? metal;
      const alto = gripY + 4 - L(30);
      px(x, alto, T, L(30), wood);
      px(x, alto, 1, L(30), lit(wood));
      // segunda mão mais acima: é o que mostra que o cajado é de duas mãos
      px(x - 1, gripY - L(9), armW + 1, 3, look.skin);
      px(x - 1, gripY - L(9), armW + 1, 1, lit(look.skin));
      px(x - 1, gripY - L(9) + 2, armW + 1, 1, shade(look.skin, 0.68));
      px(x - 2, alto - L(4), T + 4, L(5), orb);
      px(x - 1, alto - L(5), T + 2, 1, orb);
      px(x - 1, alto - L(3), T, 2, '#ffffff');
      px(x - 2, alto, T + 4, 1, dim(orb));
      break;
    }
    case 'bow': {
      const meia = L(13);
      px(x, gripY - 1, T, 5, wood);                       // empunhadura
      px(x, gripY - 1, 1, 5, lit(wood));
      px(x, gripY - 1 - meia, T, meia, wood);             // braço de cima
      px(x, gripY + 4, T, meia, wood);                    // braço de baixo
      px(x - 1, gripY - 1 - meia, T, 2, wood);            // pontas
      px(x - 1, gripY + 3 + meia, T, 2, wood);
      px(x + T, gripY - meia, 1, meia * 2 + 4, '#e8e2d0'); // corda
      // mão de cima na corda
      px(x + T - 1, gripY - r(meia * 0.5), 3, 3, look.skin);
      break;
    }
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

/**
 * Quadrúpedes: lobo e afins.
 *
 * Não passa por `body.js` — a anatomia de quatro patas não é a mesma conta.
 * O que importa aqui é a proporção contra os bípedes: o lobo é mais baixo que
 * um goblin na cernelha e bem mais comprido, que é como um animal ocupa o
 * quadrado sem parecer um humanoide agachado.
 */
function paintBeast(px, look, dir, pose) {
  const down = pose.kind === 'down';
  const step = pose.kind === 'attack' ? 3 : pose.frame === 1 ? 1 : 0;
  const crouch = pose.kind === 'attack' ? 2 : 0;    // agacha para dar o bote
  const body = look.outfit;
  const dark = look.outfitDark;
  const fur = look.hair ?? dark;

  if (down) {
    px(-13, -6, 26, 6, dark);
    px(-13, -6, 26, 1, lit(dark));
    px(-13, -2, 26, 2, shade(dark, 0.68));
    px(9, -10, 7, 4, body);
    px(14, -9, 3, 2, look.skin);
    px(-16, -8, 4, 3, body);
    return;
  }

  if (dir === 'side') {
    // patas de trás, atrás do corpo
    px(-9 - step, -7, 3, 7, shade(dark, 0.82));
    px(2 - step, -7, 3, 7, shade(dark, 0.82));

    px(-12, -17 + crouch, 24, 10, body);               // tronco
    px(-12, -17 + crouch, 24, 2, lit(body));
    px(-12, -8 + crouch, 24, 1, dark);
    px(-13, -16 + crouch, 4, 9, dark);                 // quarto traseiro
    px(6, -18 + crouch, 7, 9, fur);                    // cupim / pelagem do ombro
    px(6, -18 + crouch, 7, 1, lit(fur));

    px(-6 + step, -7, 3, 7, dark);                     // patas da frente
    px(5 + step, -7, 3, 7, dark);
    px(-7 + step, -2, 5, 2, shade(dark, 0.7));         // pés
    px(4 + step, -2, 5, 2, shade(dark, 0.7));
    px(-10 - step, -2, 5, 2, shade(dark, 0.7));
    px(1 - step, -2, 5, 2, shade(dark, 0.7));

    px(9, -24 + crouch, 9, 8, body);                   // cabeça
    px(9, -24 + crouch, 9, 1, lit(body));
    px(9, -17 + crouch, 9, 1, dark);
    px(16, -21 + crouch, 5, 4, shade(body, 0.9));      // focinho
    px(20, -21 + crouch, 2, 2, '#241e1a');             // tromba
    px(16, -18 + crouch, 5, 1, '#efe8d4');             // dentes
    px(14, -22 + crouch, 2, 2, look.eyes);
    px(9, -28 + crouch, 3, 4, dark);                   // orelhas
    px(13, -28 + crouch, 3, 4, dark);
    px(10, -27 + crouch, 1, 2, shade(look.skin, 0.8));

    px(-17, -20 + crouch, 5, 7, body);                 // cauda
    px(-17, -20 + crouch, 5, 1, lit(body));
    px(-18, -21 + crouch, 3, 4, fur);
  } else {
    px(-8, -16, 16, 11, body);
    px(-8, -16, 16, 2, lit(body));
    px(-8, -6, 16, 1, dark);
    px(-9 - step, -7, 4, 7, dark);
    px(5 + step, -7, 4, 7, dark);
    px(-10 - step, -2, 6, 2, shade(dark, 0.7));
    px(4 + step, -2, 6, 2, shade(dark, 0.7));

    px(-7, -19, 14, 5, fur);                           // peitoral
    px(-6, -26, 12, 9, body);                          // cabeça
    px(-6, -26, 12, 1, lit(body));
    px(-3, -20, 6, 4, shade(body, 0.9));               // focinho
    px(-2, -17, 4, 1, '#efe8d4');
    px(-1, -19, 2, 2, '#241e1a');
    px(-5, -23, 3, 2, look.eyes);
    px(2, -23, 3, 2, look.eyes);
    px(-7, -30, 4, 5, dark);                           // orelhas
    px(3, -30, 4, 5, dark);
    px(-6, -29, 2, 3, shade(look.skin, 0.8));
    px(4, -29, 2, 3, shade(look.skin, 0.8));
  }
}
