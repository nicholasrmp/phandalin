// O pintor: look → pixels, com fillRect.
//
// COORDENADAS
//   cx = floor(w / 2)   centro horizontal da célula
//   gy = h - GROUND     linha do chão; tudo se mede PARA CIMA (y negativo)
//   px(x, y, w, h, cor) retângulo relativo a (cx, gy)
//
// ANATOMIA (a partir do chão)
//   -29..-27  cabelo / elmo
//   -27..-17  cabeça
//   -17..-8   torso (armadura)
//    -8..-2   pernas
//    -2..0    pés

export const GROUND = 3;

// Três vistas desenhadas. Com o espelhamento horizontal elas cobrem as oito
// orientações da grade — e as quatro diagonais que a câmera isométrica usa.
export const DIRECTIONS = ['front', 'side', 'back'];

export function shade(hex, mult) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v) => Math.max(0, Math.min(255, Math.round(v * mult))).toString(16).padStart(2, '0');
  return `#${ch(n >> 16)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
}

export function paint(ctx, ox, oy, w, h, look, dir, pose) {
  const cx = Math.floor(w / 2);
  const gy = h - GROUND;
  const px = (x, y, pw, ph, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(ox + cx + x, oy + gy + y, pw, ph);
  };
  const cut = (x, y) => ctx.clearRect(ox + cx + x, oy + gy + y, 1, 1);

  if (look.quadruped) return paintBeast(px, look, dir, pose);

  const side = dir === 'side';
  const back = dir === 'back';
  const front = dir === 'front';
  const down = pose.kind === 'down';
  const hurt = pose.kind === 'hurt';
  const attack = pose.kind === 'attack';

  // O "shrink" encolhe a figura: caído vira um vulto rente ao chão.
  const bob = pose.frame === 1 && pose.kind === 'idle' ? -1 : 0;
  const lean = attack ? (pose.frame === 1 ? 2 : 1) : 0;
  const recoil = hurt ? -2 : 0;
  const small = look.small ? 3 : 0;

  if (down) {
    const body = look.outfit;
    px(-7, -4, 14, 4, body);
    px(-7, -2, 14, 2, shade(body, 0.7));
    px(5, -7, 5, 4, look.skin);
    px(7, -6, 1, 1, shade(look.skin, 0.6));
    px(-9, -5, 3, 2, look.leather);
    return;
  }

  const gy0 = small;             // figuras pequenas sobem a linha do chão
  const headTop = -27 + gy0 + recoil;
  const chin = -17 + gy0 + recoil;
  const waist = -8 + gy0;
  const skinDark = shade(look.skin, 0.82);

  // ---- capa ----------------------------------------------------------------
  // De costas a capa cobre o corpo inteiro: é o que torna a vista traseira
  // legível num relance, sem precisar de rosto.
  if (look.cloak) {
    const cw = back ? 15 : side ? 4 : 14;
    const cxo = back ? -7 : side ? -5 : -7;
    px(cxo, chin + bob - 1, cw, back ? 16 : 13, look.cloak);
    px(cxo, chin + bob + (back ? 15 : 12), cw, 1, shade(look.cloak, 0.7));
    if (back) px(cxo + Math.floor(cw / 2), chin + bob, 1, 15, shade(look.cloak, 0.85));
  }

  // ---- arma nas costas / preparada ----------------------------------------
  if (!back || !look.cloak) drawWeapon(px, look, side, { chin, bob, lean, attack, frame: pose.frame, back });

  // ---- pernas --------------------------------------------------------------
  const legColor = look.armorStyle === 'robe' ? look.outfit : look.outfitDark;
  if (side) {
    const step = attack ? 2 : 0;
    px(-3 - step, waist, 4, 6, shade(legColor, 0.8));
    px(-4 - step, -2 + gy0, 5, 2, look.leather);
    px(-1 + step, waist, 4, 6, legColor);
    px(-2 + step, -2 + gy0, 5, 2, look.leather);
  } else {
    px(-4, waist, 4, 6, legColor);
    px(1, waist, 4, 6, legColor);
    px(-5, -2 + gy0, 5, 2, look.leather);
    px(1, -2 + gy0, 5, 2, look.leather);
  }

  // ---- torso / armadura ----------------------------------------------------
  const torsoW = side ? 7 : 10;
  const torsoX = side ? -3 : -5;
  const torsoY = chin + bob;
  px(torsoX, torsoY, torsoW, 9, look.outfit);
  px(torsoX, torsoY, torsoW, 2, look.outfitDark);

  switch (look.armorStyle) {
    case 'plate':
      px(torsoX, torsoY + 2, torsoW, 7, look.metal);
      px(torsoX, torsoY + 2, torsoW, 1, shade(look.metal, 1.25));
      px(torsoX + 1, torsoY + 4, 1, 4, shade(look.metal, 0.75));
      px(torsoX, torsoY + 8, torsoW, 1, shade(look.metal, 0.65));
      px(torsoX - 1, torsoY + 1, 2, 3, look.metal); // ombreira
      px(torsoX + torsoW - 1, torsoY + 1, 2, 3, look.metal);
      break;
    case 'scale':
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < torsoW; c += 2) {
          px(torsoX + c + (r % 2), torsoY + 2 + r * 2, 1, 2, r % 2 ? shade(look.metal, 0.85) : look.metal);
        }
      }
      break;
    case 'leather':
      px(torsoX, torsoY + 2, torsoW, 7, look.leather);
      px(torsoX, torsoY + 5, torsoW, 1, shade(look.leather, 0.7));
      break;
    default: // robe
      px(torsoX, torsoY + 2, torsoW, 11, look.outfit);
      px(torsoX, torsoY + 12, torsoW, 1, shade(look.outfit, 0.65));
      break;
  }
  if (look.trim) px(torsoX, torsoY + 6, torsoW, 1, look.trim);

  // ---- braços --------------------------------------------------------------
  const sleeve = look.armorStyle === 'plate' ? look.metal : look.outfit;
  const armY = torsoY + 2 + (attack ? -2 : 0);
  if (side) {
    px(-1 + lean, armY, 2, 6, sleeve);
    px(-1 + lean, armY + 6, 2, 2, look.skin);
  } else {
    px(torsoX - 2, armY, 2, 6, sleeve);
    px(torsoX + torsoW, armY - lean, 2, 6, sleeve);
    px(torsoX - 2, armY + 6, 2, 2, look.skin);
    px(torsoX + torsoW, armY + 6 - lean, 2, 2, look.skin);
  }

  // ---- escudo --------------------------------------------------------------
  if (look.shield) {
    const sx = side ? -6 : back ? torsoX + torsoW + 2 : torsoX - 4;
    px(sx, torsoY + 1, 4, 8, look.metal);
    px(sx, torsoY + 1, 4, 1, shade(look.metal, 1.2));
    px(sx + 1, torsoY + 4, 2, 2, look.trim ?? shade(look.metal, 0.7));
  }

  // ---- cabeça --------------------------------------------------------------
  const headW = side ? 8 : 10;
  const headX = side ? -3 : -5;
  const headY = headTop + bob;
  px(headX, headY, headW, 10, look.skin);
  cut(headX, headY);
  cut(headX + headW - 1, headY);
  cut(headX, headY + 9);
  cut(headX + headW - 1, headY + 9);
  px(headX, headY + 8, headW, 1, skinDark);

  if (look.ears) {
    px(headX - 2, headY + 2, 2, 2, look.skin);
    px(headX + headW, headY + 2, 2, 2, look.skin);
  }

  if (front) {
    px(-3, headY + 4, 2, 2, look.eyes);
    px(1, headY + 4, 2, 2, look.eyes);
    if (look.glow) {
      px(-3, headY + 3, 2, 1, shade(look.eyes, 1.5));
      px(1, headY + 3, 2, 1, shade(look.eyes, 1.5));
    }
  } else if (side) {
    px(1, headY + 4, 2, 2, look.eyes);
  } else {
    // De costas: nuca sombreada no lugar do rosto.
    px(headX + 1, headY + 4, headW - 2, 5, skinDark);
  }

  if (look.beard && !back) {
    px(headX + 1, headY + 6, headW - 2, 4, look.hair);
    px(headX + 1, headY + 9, headW - 2, 1, shade(look.hair, 0.7));
  }

  // ---- cabelo / elmo -------------------------------------------------------
  if (look.helm) {
    px(headX - 1, headY - 2, headW + 2, 5, look.metal);
    px(headX - 1, headY - 2, headW + 2, 1, shade(look.metal, 1.3));
    px(headX + Math.floor(headW / 2) - 1, headY - 4, 2, 2, look.trim ?? look.metal);
    if (dir === 'front') px(-1, headY + 3, 2, 3, shade(look.metal, 0.5)); // nasal
  } else {
    const hairY = headY - 2;
    switch (look.hairStyle) {
      case 'bald': break;
      case 'hood':
        px(headX - 1, hairY, headW + 2, 7, look.outfitDark);
        break;
      case 'long':
        px(headX, hairY, headW, 4, look.hair);
        px(headX - 1, hairY + 2, 2, 12, look.hair);
        px(headX + headW - 1, hairY + 2, 2, 12, look.hair);
        break;
      case 'spiky':
        px(headX, hairY + 1, headW, 3, look.hair);
        for (let i = 0; i < headW; i += 2) px(headX + i, hairY - 1, 2, 2, i % 4 === 0 ? look.hair : shade(look.hair, 0.75));
        break;
      default:
        px(headX, hairY + 1, headW, 4, look.hair);
        px(headX - 1, hairY + 2, 1, 3, look.hair);
        px(headX + headW, hairY + 2, 1, 3, look.hair);
        break;
    }
  }

  if (look.horns) {
    px(headX - 1, headY - 5, 2, 4, shade(look.skin, 0.65));
    px(headX + headW - 1, headY - 5, 2, 4, shade(look.skin, 0.65));
  }
}

function drawWeapon(px, look, side, { chin, bob, lean, attack, frame, back = false }) {
  const metal = look.metal;
  const wood = look.leather;
  const y = chin + bob;
  const swing = attack ? (frame === 1 ? -6 : -3) : 0;
  // De costas a arma aparece do outro lado do corpo.
  const hand = back ? -8 : 6;

  switch (look.weapon) {
    case 'sword': {
      const x = side ? 3 + lean : hand;
      px(x, y - 4 + swing, 2, 12, metal);
      px(x, y - 4 + swing, 1, 12, shade(metal, 1.25));
      px(x - 1, y + 8 + swing, 4, 1, look.trim ?? wood);
      px(x, y + 9 + swing, 2, 3, wood);
      break;
    }
    case 'dagger': {
      const x = side ? 3 + lean : hand;
      px(x, y + 1 + swing, 2, 6, metal);
      px(x - 1, y + 7 + swing, 4, 1, wood);
      px(x, y + 8 + swing, 2, 2, wood);
      break;
    }
    case 'mace': {
      const x = side ? 3 + lean : hand;
      px(x, y - 1 + swing, 2, 10, wood);
      px(x - 1, y - 4 + swing, 4, 4, metal);
      px(x - 1, y - 4 + swing, 4, 1, shade(metal, 1.2));
      break;
    }
    case 'staff': {
      const x = side ? 3 + lean : hand;
      px(x, y - 8, 2, 20, wood);
      px(x - 1, y - 11, 4, 4, look.glow ?? metal);
      px(x, y - 10, 2, 2, '#ffffff');
      break;
    }
    case 'bow': {
      const x = side ? 3 : hand;
      px(x, y - 4, 2, 14, wood);
      px(x - 1, y - 5, 2, 2, wood);
      px(x - 1, y + 9, 2, 2, wood);
      px(x + 2, y - 3, 1, 12, shade(metal, 1.1));
      break;
    }
    default:
      break;
  }
}

/** Quadrúpedes: lobo e afins. */
function paintBeast(px, look, dir, pose) {
  const down = pose.kind === 'down';
  const step = pose.kind === 'attack' ? 2 : pose.frame === 1 ? 1 : 0;
  const body = look.outfit;
  const dark = look.outfitDark;

  if (down) {
    px(-9, -4, 18, 4, dark);
    px(-9, -2, 18, 2, shade(dark, 0.7));
    px(7, -7, 5, 3, look.skin);
    return;
  }

  if (dir === 'side') {
    px(-8, -10, 16, 6, body);           // tronco
    px(-8, -5, 16, 1, dark);
    px(-9, -6, 3, 6, dark);             // traseira
    px(-6 - step, -4, 2, 4, dark);      // patas
    px(-2 + step, -4, 2, 4, dark);
    px(3 - step, -4, 2, 4, dark);
    px(6 + step, -4, 2, 4, dark);
    px(6, -14, 6, 5, body);             // cabeça
    px(11, -12, 3, 2, look.skin);       // focinho
    px(10, -13, 2, 1, look.eyes);
    px(6, -16, 2, 2, dark);             // orelhas
    px(9, -16, 2, 2, dark);
    px(-11, -12, 3, 5, body);           // cauda
  } else {
    px(-5, -11, 10, 7, body);
    px(-5, -5, 10, 1, dark);
    px(-5 - step, -4, 3, 4, dark);
    px(2 + step, -4, 3, 4, dark);
    px(-4, -17, 8, 6, body);
    px(-2, -13, 4, 2, look.skin);
    px(-3, -15, 2, 2, look.eyes);
    px(1, -15, 2, 2, look.eyes);
    px(-5, -19, 2, 3, dark);
    px(3, -19, 2, 3, dark);
  }
}
