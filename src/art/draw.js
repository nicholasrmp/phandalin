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
//   faz um goblin de 41 px e um bugbear de 69 px saírem do mesmo código — e o
//   que impede o hobgoblin de virar "humano de armadura".
//
// LUZ
//   Vem de cima e da esquerda. Cada peça do corpo é um VOLUME, não um
//   retângulo chapado: coluna de luz, núcleo, duas colunas de sombra e uma
//   aresta de luz refletida — porque a borda de um cilindro nunca é o ponto
//   mais escuro dele, a sombra fica um pouco antes. Onde duas peças se
//   encontram entra sombra de contato. Esses dois detalhes, mais a rampa de
//   `palette.js` que desloca o matiz em vez de multiplicar o RGB, são a
//   diferença entre pixel art e blocos coloridos empilhados.
//
//   O contorno preto é posto depois, em sheet.js, varrendo o alfa.

import { metrics } from './body.js';
import { makeKit } from './kit.js';
import { planFor } from './plans/index.js';
import { ramp, shade as tom, lit as claro, dim as escuro, deep, lum } from './palette.js';

export const GROUND = 5;

// Três vistas desenhadas. Com o espelhamento horizontal elas cobrem as oito
// orientações da grade — e as quatro diagonais que a câmera isométrica usa.
export const DIRECTIONS = ['front', 'side', 'back'];

export const shade = tom;
export { ramp, deep };

const lit = claro;
const dim = escuro;
const r = Math.round;

/**
 * Afasta uma cor de outra até dar para distinguir as duas. Serve para barba
 * contra pele: cabelo castanho-claro em pele morena vira uma mancha só, e a
 * barba é metade da leitura de um anão.
 */
function apart(color, from, min = 0.14) {
  let c = color;
  const subir = lum(color) >= lum(from);
  for (let i = 0; i < 6 && Math.abs(lum(c) - lum(from)) < min; i++) {
    c = ramp(c, subir ? 1 : -1);
  }
  return c;
}

export function paint(ctx, ox, oy, w, h, look, dir, pose) {
  const kit = makeKit(ctx, ox, oy, w, h, GROUND);
  const { px, cut, volume, contato, coluna } = kit;

  // Criatura que não é humanoide tem plano corporal próprio, no seu arquivo.
  const plano = planFor(look);
  if (plano) return plano(kit, look, dir, pose);


  const m = metrics(look);
  const side = dir === 'side';
  const back = dir === 'back';
  const front = dir === 'front';

  if (pose.kind === 'down') return paintDown(kit, look, m);

  // ---- pose ----------------------------------------------------------------
  const attack = pose.kind === 'attack';
  const bob = pose.kind === 'idle' && pose.frame === 1 ? -1 : 0;
  const lean = attack ? (pose.frame === 1 ? 2 : 1) : 0;
  const recoil = pose.kind === 'hurt' ? -2 : 0;
  const stoop = m.hunch;
  const upper = bob + recoil + stoop;
  const lead = side ? r(stoop * 0.8) : 0;

  const chin = m.chin + upper;
  const torsoTop = m.torsoTop + upper;
  const headTop = m.headTop + upper;
  const crown = m.crown + upper;

  const chest = side ? Math.max(6, r(m.chestW * 0.64)) : m.chestW;
  const shoulder = side ? Math.max(7, r(m.shoulderW * 0.6)) : m.shoulderW;
  const headW = side ? Math.max(7, r(m.headW * 0.84)) : m.headW;
  const chestX = -Math.floor(chest / 2);
  const shoulderX = -Math.floor(shoulder / 2);
  const headX = -Math.floor(headW / 2) + lead;

  // ---- capa ----------------------------------------------------------------
  if (look.cloak) {
    const cw = back ? m.shoulderW + 2 : side ? Math.max(3, r(m.chestW * 0.3)) : m.shoulderW;
    const cxo = back ? -Math.floor(cw / 2) : side ? shoulderX - 1 : shoulderX;
    const ch = back ? m.torsoH + m.legH - 2 : r(m.torsoH * 0.95);
    volume(cxo, torsoTop + 1, cw, ch, look.cloak, { topo: 1, base: 1 });
    // dobras: colunas alternadas, é o que impede a capa de ler como cartolina
    for (let c = 2; c < cw - 2; c += 3) {
      px(cxo + c, torsoTop + 3, 1, ch - 3, ramp(look.cloak, -2));
      px(cxo + c + 1, torsoTop + 3, 1, ch - 3, ramp(look.cloak, 1));
    }
  }

  // ---- onde a mão fecha ----------------------------------------------------
  const sleeve = look.armorStyle === 'plate' ? look.metal : look.outfit;
  const armY = torsoTop + 2 + (attack ? -2 : 0);
  const armH = Math.max(5, r(m.torsoH * 0.6 * (m.sp.arms ?? 1)));
  const farX = side ? lead - Math.floor(chest / 2) - m.armW : shoulderX - m.armW;
  const nearX = side ? lead + Math.floor(chest / 2) : shoulderX + shoulder;
  // Peso no lado da arma: aquele ombro desce um pixel. Os dois ombros na mesma
  // linha dão uma figura de boneco de papel, simétrica e parada.
  const nearY = armY - lean + (side || back ? 0 : 1);
  const gripX = nearX;
  const gripY = nearY + armH;

  const afinaBraco = m.armW >= 4 ? 1 : 0;
  const braco = (x, y, cor, fora = 0) => {
    const cxc = x + Math.floor(m.armW / 2);
    // afina até o punho e cai um pouco para fora: braço de largura constante
    // colado ao corpo é o que lê como palito pregado no tronco.
    coluna(y, armH, (t) => ({ c: cxc + fora * t, w: m.armW - afinaBraco * t }), cor, { topo: 1 });
    contato(cxc - Math.floor(m.armW / 2) + fora, y + armH - 1, m.armW, cor);
  };
  const mao = (x, y) => {
    volume(x, y, m.armW, 3, look.skin, { topo: 1 });
    px(x, y + 2, m.armW, 1, ramp(look.skin, -3));   // dedos
    if (m.armW >= 4) px(x + 1, y + 1, 1, 1, ramp(look.skin, -2));
  };
  const arma = () => drawWeapon(kit, look, m, {
    gripX, gripY, armW: m.armW, attack, frame: pose.frame,
  });

  // ---- pernas --------------------------------------------------------------
  const robe = look.armorStyle === 'robe';
  if (!robe) drawLegs(kit, look, m, { side, attack, lean });

  if (back && !look.cloak) arma();

  // ---- tronco --------------------------------------------------------------
  drawTorso(kit, look, m, { chestX, chest, shoulderX, shoulder, torsoTop, side, back, robe });

  // ---- braços e arma -------------------------------------------------------
  // A cava: uma coluna escura onde o braço encaixa no tronco. Sem ela o braço
  // da mesma cor da armadura funde com o peito e a figura fica sem membro.
  if (!side) {
    px(shoulderX, torsoTop + 1, 1, armH, ramp(look.outfit, -4));
    px(shoulderX + shoulder - 1, torsoTop + 1, 1, armH, ramp(look.outfit, -4));
  }
  if (!side) { braco(farX, armY, ramp(sleeve, -2), -1); mao(farX - 1, armY + armH); }
  braco(nearX, nearY, ramp(sleeve, -1), 1);
  if (!back) arma();
  mao(gripX, gripY);

  // ---- escudo --------------------------------------------------------------
  if (look.shield) drawShield(kit, look, m, { shoulderX, shoulder, torsoTop, side, back });

  // ---- pescoço -------------------------------------------------------------
  if (m.neckH > 0) {
    const nw = Math.max(2, r(headW * 0.42));
    const nx = -Math.floor(nw / 2) + lead;
    px(nx, chin, nw, m.neckH + 1, ramp(look.skin, -2));
    px(nx, chin, 1, m.neckH + 1, ramp(look.skin, -1));
  }

  // ---- cabeça --------------------------------------------------------------
  drawHead(kit, look, m, { headX, headW, headTop, chin, front, side, back, lead });
  drawCrown(kit, look, m, { headX, headW, headTop, crown, front, side, lead });

  if (look.horns) {
    const hy = crown - Math.max(3, r(m.headH * 0.4));
    for (const s of [-1, 1]) {
      const x = s < 0 ? headX - 1 : headX + headW - 1;
      volume(x, hy, 2, headTop - hy + 1, ramp(look.skin, -3), { topo: 1 });
    }
  }
}

// ---------------------------------------------------------------------------

function drawLegs({ px, volume, contato, coluna }, look, m, { side, attack, lean }) {
  const cor = look.outfitDark;
  const h = m.legH;
  const y = m.waist;
  const bota = m.sp.bigFeet ? look.skin : look.leather;
  const abre = Math.max(1, r(m.legW * 0.34));      // a perna abre do quadril ao pé
  const fino = m.legW >= 4 ? 1 : 0;                // e afina até o tornozelo

  const larg = (t) => m.legW - fino * t + (t > 0.42 && t < 0.62 ? 1 : 0);

  const perna = (quadril, lado, tom = 0) => {
    const c = tom ? ramp(cor, tom) : cor;
    coluna(y, h, (t) => ({ c: quadril + lado * abre * t, w: larg(t) }), c, { topo: 0 });
    const pe = Math.round(quadril + lado * abre);
    px(pe - Math.floor(larg(1) / 2), y + r(h * 0.5), Math.max(1, r(larg(1)) - 1), 1, ramp(c, 1));
    contato(pe - Math.floor(m.legW / 2), y + h - 1, m.legW, c);
    const bx = pe - Math.floor(m.footW / 2);
    const b = tom ? ramp(bota, tom) : bota;
    volume(bx, m.footTop, m.footW, m.feetH, b, { topo: 1 });
    px(bx, m.footTop + m.feetH - 1, m.footW, 1, ramp(b, -4));
    if (m.feetH >= 4) px(bx, m.footTop + 1, m.footW, 1, ramp(b, 1));
  };

  if (side) {
    const passo = attack ? 2 : 0;
    perna(-r(m.legW / 2) - passo, -1, -2);
    perna(-r(m.legW / 2) + passo + lean, 1);
  } else {
    const quadril = Math.floor(m.legW / 2) + Math.floor(m.gap / 2);
    perna(-quadril, -1);
    perna(quadril, 1);
    // vão entre as pernas: sombra, não vazio
    px(-Math.floor(m.gap / 2), y, m.gap, Math.max(1, r(h * 0.45)), ramp(cor, -4));
  }
}

function drawTorso({ px, volume, contato, coluna }, look, m, { chestX, chest, shoulderX, shoulder, torsoTop, side, back, robe }) {
  const bottom = robe ? m.footTop : m.waist + 1;
  const h = bottom - torsoTop;
  const cintura = Math.max(4, chest - (m.chestW - m.waistW));

  /**
   * Perfil do tronco. Ombro largo no alto, peito cheio, cintura estreita, e as
   * duas primeiras linhas puxadas para dentro para arredondar o trapézio. Um
   * retângulo da altura toda é o que faz a figura parecer uma caixa com cabeça.
   */
  const larguraEm = (t) => {
    if (robe && t > 0.5) {                         // a veste alarga para baixo
      return cintura + (shoulder - cintura) * 0.9 * ((t - 0.5) / 0.5);
    }
    if (t <= 0.05) return shoulder - 3;
    if (t <= 0.12) return shoulder - 1;
    if (t <= 0.40) return chest + (shoulder - chest) * (1 - (t - 0.12) / 0.28);
    return chest - (chest - cintura) * ((t - 0.40) / 0.60);
  };
  const forma = (t) => ({ c: 0, w: larguraEm(t) });
  const tDe = (y) => (h <= 1 ? 0 : (y - torsoTop) / (h - 1));
  const linha = (y) => Math.round(larguraEm(tDe(y)));
  const esq = (y) => -Math.floor(linha(y) / 2);

  coluna(torsoTop, h, forma, look.outfit, { topo: 1 });

  if (m.belly > 0 && !robe) {
    const by = torsoTop + r(h * 0.45);
    coluna(by, bottom - by, (t) => ({ c: 0, w: larguraEm(tDe(by + t * (bottom - by))) + m.belly * t }), look.outfit, { topo: 0 });
  }

  const plateY = torsoTop + 1;
  const plateH = Math.max(5, (robe ? m.waist : bottom) - plateY);
  const formaArm = (t) => ({ c: 0, w: larguraEm(tDe(plateY + t * (plateH - 1))) });

  switch (look.armorStyle) {
    case 'plate': {
      const met = look.metal;
      coluna(plateY, plateH, formaArm, met, { topo: 1 });
      // quilha central: o peitoral é uma aresta, não uma chapa plana
      px(-1, plateY + 1, 1, plateH - 2, ramp(met, 3));
      px(0, plateY + 1, 1, plateH - 2, ramp(met, -1));
      // peitoral sugerido por duas sombras curtas
      const yPeito = plateY + r(plateH * 0.4);
      const wPeito = Math.max(2, r(linha(yPeito) * 0.28));
      px(esq(yPeito) + 1, yPeito, wPeito, 1, ramp(met, -2));
      px(-esq(yPeito) - 1 - wPeito, yPeito, wPeito, 1, ramp(met, -3));
      // fralda de placas na cintura
      if (!robe) {
        const fy = m.waist - 3;
        const fw = linha(fy) + 2;
        volume(-Math.floor(fw / 2), fy, fw, 4, met, { topo: 1 });
        for (let c = 1; c < fw; c += 3) px(-Math.floor(fw / 2) + c, fy + 1, 1, 3, ramp(met, -3));
        contato(-Math.floor(fw / 2), fy, fw, met);
      }
      // ombreiras arredondadas, passando da linha do peito
      const pw = Math.max(4, r(shoulder * 0.34));
      const ph = Math.max(4, r(plateH * 0.34));
      for (const [ox, cor] of [[shoulderX, met], [shoulderX + shoulder - pw, ramp(met, -1)]]) {
        volume(ox, plateY, pw, ph, cor, { topo: 1 });
        px(ox + 1, plateY - 1, pw - 2, 1, ramp(cor, 3));
        px(ox + 2, plateY - 2, Math.max(1, pw - 4), 1, ramp(cor, 2));
        contato(ox, plateY + ph - 1, pw, cor);
      }
      break;
    }
    case 'scale': {
      const met = look.metal;
      coluna(plateY, plateH, formaArm, ramp(met, -3), { topo: 0 });
      const rows = Math.max(3, Math.floor(plateH / 3));
      for (let i = 0; i < rows; i++) {
        const y = plateY + i * 3;
        const lw = linha(y);
        const x0 = -Math.floor(lw / 2);
        for (let c = (i % 2) ? 0 : 2; c < lw - 1; c += 4) {
          px(x0 + c, y, 3, 3, met);
          px(x0 + c, y, 3, 1, ramp(met, 2));
          px(x0 + c + 2, y + 1, 1, 2, ramp(met, -2));
          px(x0 + c, y + 2, 3, 1, ramp(met, -3));
        }
      }
      break;
    }
    case 'leather': {
      // Colete, não tábua: mais estreito que o tronco (a túnica aparece no
      // ombro), com decote em V dividido em duas alças e costura na borda.
      const cou = look.leather;
      const vy = plateY + 1;
      const vh = Math.max(3, plateH - 2);
      const recuo = chest >= 11 ? 2 : 1;
      coluna(vy, vh, (t) => ({ c: 0, w: larguraEm(tDe(vy + t * (vh - 1))) - recuo }), cou, { topo: 1 });
      // decote: devolve o meio do peito à túnica nas primeiras linhas
      const decote = Math.max(2, r(vh * 0.3));
      for (let i = 0; i < decote; i++) {
        const abre2 = Math.max(1, r(((decote - i) / decote) * chest * 0.3));
        px(-abre2, vy + i, abre2 * 2, 1, look.outfit);
        px(-abre2, vy + i, 1, 1, ramp(cou, -4));
        px(abre2 - 1, vy + i, 1, 1, ramp(cou, -4));
      }
      // costura na borda e fivela lateral
      for (let i = 1; i < vh; i += 2) {
        const lw = linha(vy + i) - recuo;
        px(-Math.floor(lw / 2) + 1, vy + i, 1, 1, ramp(cou, 3));
      }
      const ys = vy + r(vh * 0.55);
      px(esq(ys) + 1, ys, Math.max(2, r(linha(ys) * 0.3)), 2, ramp(cou, -3));
      break;
    }
    default: // túnica ou veste
      if (robe) {
        for (let y = m.waist; y < bottom; y += 1) {
          const lw = linha(y);
          const x0 = -Math.floor(lw / 2);
          for (let c = 2; c < lw - 1; c += 4) {
            px(x0 + c, y, 1, 1, ramp(look.outfit, -2));
            px(x0 + c + 1, y, 1, 1, ramp(look.outfit, 1));
          }
        }
        px(esq(bottom - 1), bottom - 1, linha(bottom - 1), 1, ramp(look.outfit, -4));
        px(esq(m.waist), m.waist, linha(m.waist), 1, ramp(look.outfit, -3));
      }
      break;
  }

  // Pelagem do bugbear.
  if (m.sp.fur) {
    const pelo = look.hair ?? ramp(look.outfit, -2);
    const topW = linha(torsoTop + 2) + 2;
    volume(-Math.floor(topW / 2), torsoTop, topW, 4, pelo, { topo: 1 });
    for (let c = 1; c < topW; c += 2) {
      px(-Math.floor(topW / 2) + c, torsoTop + 3, 1, 2 + (c % 4 ? 1 : 0), ramp(pelo, -2));
    }
    for (let c = 2; c < topW - 2; c += 3) {
      px(-Math.floor(topW / 2) + c, torsoTop + 6, 1, Math.max(2, r(h * 0.26)), ramp(pelo, -1));
    }
  }

  if (look.trim && look.armorStyle !== 'plate') {
    const yt = torsoTop + r(h * 0.26);
    px(esq(yt), yt, linha(yt), 1, look.trim);
    px(esq(yt + 1), yt + 1, linha(yt + 1), 1, ramp(look.trim, -3));
  }

  // cinto com fivela, na largura real da cintura
  if (!robe && !back) {
    const cinto = look.leather;
    const cy = m.waist - 3;
    const cw = linha(cy) + 1;
    volume(-Math.floor(cw / 2), cy, cw, 3, cinto, { topo: 1 });
    const fw = Math.max(2, r(cw * 0.22));
    px(-Math.floor(fw / 2), cy, fw, 3, look.trim ?? look.metal);
    px(-Math.floor(fw / 2), cy, fw, 1, ramp(look.trim ?? look.metal, 3));
    px(-Math.floor(fw / 2) + 1, cy + 1, Math.max(1, fw - 2), 1, ramp(look.trim ?? look.metal, -3));
    contato(-Math.floor(cw / 2), m.waist - 1, cw, cinto);
  }
}


function drawShield({ px, volume, contato }, look, m, { shoulderX, shoulder, torsoTop, side, back }) {
  const campo = look.trim ?? ramp(look.metal, -2);
  const aro = look.metal;
  const sw = Math.max(6, r(m.shoulderW * 0.36));
  const sh = Math.max(11, r(m.torsoH * 1.0));
  const sy = torsoTop + 2;
  const sx = side ? shoulderX - 2 : back ? shoulderX + shoulder - 1 : shoulderX - sw + 1;

  // corpo do escudo, com os cantos de cima cortados e a ponta embaixo
  volume(sx, sy + 1, sw, sh - 3, campo, { topo: 0 });
  px(sx + 1, sy, sw - 2, 1, ramp(campo, 3));
  px(sx + 2, sy + sh - 2, sw - 4, 1, ramp(campo, -3));
  // aro
  px(sx + 1, sy, sw - 2, 1, aro);
  px(sx, sy + 1, 1, sh - 4, ramp(aro, 2));
  px(sx + sw - 1, sy + 1, 1, sh - 4, ramp(aro, -2));
  px(sx + 1, sy + sh - 3, sw - 2, 1, ramp(aro, -2));
  px(sx + 2, sy + sh - 2, sw - 4, 1, ramp(aro, -3));
  // umbo
  const bw = Math.max(3, sw - 5);
  const bx = sx + Math.floor((sw - bw) / 2);
  const by = sy + r(sh * 0.36);
  volume(bx, by, bw, bw, aro, { topo: 1 });
  px(bx + 1, by + 1, 1, 1, ramp(aro, 3));
  contato(bx, by + bw, bw, campo);
}

function drawHead({ px, cut, volume, contato, coluna }, look, m, { headX, headW, headTop, chin, front, side, back, lead }) {
  const sp = m.sp;
  const pele = look.skin;
  const jaw = sp.jaw ?? 0;
  const headH = chin - headTop;
  const rico = headH >= 11;                 // há pixel para um rosto de verdade
  const jawY = headTop + r(headH * 0.56);
  const jawW = Math.max(4, headW + jaw * 2);
  const jawX = -Math.floor(jawW / 2) + lead;

  // Crânio com a calota arredondada e maxilar que afina até o queixo. Dois
  // retângulos empilhados leem como caixa com olhos, não como cabeça.
  const craH = Math.max(1, jawY - headTop);
  const estreita = Math.min(4, Math.max(2, r(headW * 0.3)));
  coluna(headTop, craH, (t) => ({
    c: lead,
    w: t < 0.22 ? headW - estreita + (estreita * t) / 0.22 : headW,
  }), pele, { topo: 1 });
  coluna(jawY, Math.max(1, chin - jawY), (t) => ({
    c: lead,
    w: jawW - Math.min(2, jawW - 3) * t,
  }), pele, { topo: 0 });
  px(jawX + 1, chin - 1, Math.max(1, jawW - 2), 1, ramp(pele, -3));

  // ---- orelhas -------------------------------------------------------------
  const earY = headTop + r(headH * 0.36);
  if (sp.ear === 'swept') {
    for (const s of [-1, 1]) {
      const x = s < 0 ? headX - 2 : headX + headW;
      const d = s < 0 ? -1 : 1;
      px(x, earY, 2, 3, pele);
      px(x + d, earY - 2, 2, 3, pele);
      px(x + (s < 0 ? -1 : 2), earY - 3, 1, 1, ramp(pele, 1));
      px(x + (s < 0 ? 1 : 0), earY, 1, 2, ramp(pele, -3));   // concha
    }
  } else if (sp.ear === 'wide') {
    const len = Math.max(3, r(headW * 0.36));
    for (const s of [-1, 1]) {
      const x = s < 0 ? headX - len : headX + headW;
      volume(x, earY - 2, len, 5, pele, { topo: 1 });
      px(x + (s < 0 ? 1 : len - 2), earY - 1, 1, 3, ramp(pele, -3));
    }
  } else if (sp.ear === 'long') {
    for (const s of [-1, 1]) {
      const x = s < 0 ? headX - 2 : headX + headW;
      px(x, earY, 2, 4, pele);
      px(x, earY - 3, 2, 3, pele);
      px(x + (s < 0 ? 0 : 1), earY - 4, 1, 1, ramp(pele, 1));
      px(x + (s < 0 ? 1 : 0), earY, 1, 3, ramp(pele, -3));
    }
  } else if (look.ears !== false) {
    for (const s of [-1, 1]) {
      const x = s < 0 ? headX - 1 : headX + headW;
      px(x, earY, 1, Math.max(2, r(headH * 0.25)), ramp(pele, s < 0 ? 0 : -1));
    }
  }

  if (back) {
    px(headX + 1, headTop + 2, headW - 2, chin - headTop - 3, ramp(pele, -2));
    return;
  }

  // ---- maçãs do rosto ------------------------------------------------------
  if (rico) {
    px(headX, jawY - 2, 1, 4, ramp(pele, -2));
    px(headX + headW - 1, jawY - 3, 1, 5, ramp(pele, -3));
  }

  // ---- olhos ---------------------------------------------------------------
  const eyeY = headTop + r(headH * 0.4);
  const branco = sp.darkEyes ? ramp(pele, -5) : '#f2ece0';

  if (sp.brow) {
    px(headX + 1, eyeY - 2, headW - 2, 2, ramp(pele, -4));
    px(headX + 1, eyeY - 3, headW - 2, 1, ramp(pele, -2));
  } else if (rico) {
    px(headX + 1, eyeY - 1, headW - 2, 1, ramp(pele, -2));   // arcada
  }

  const off = Math.max(1, r(headW * 0.17));
  const olho = (x) => {
    px(x, eyeY, 2, 2, branco);
    px(x, eyeY, 2, 1, ramp(branco, -2));                     // cílio
    px(x + (sp.darkEyes ? 0 : 1), eyeY + (sp.darkEyes ? 1 : 0), 1, sp.darkEyes ? 1 : 2, look.eyes);
  };
  if (front) { olho(-off - 2 + lead); olho(off + lead); } else { olho(r(headW * 0.14) + lead); }

  // ---- nariz ---------------------------------------------------------------
  const noseY = eyeY + 2 + (rico ? 1 : 0);
  if (sp.snout) {
    const nw = Math.max(3, r(headW * 0.34));
    const nx = -Math.floor(nw / 2) + lead;
    volume(nx, noseY, nw, 3, ramp(pele, -1), { topo: 1 });
    px(nx + 1, noseY + 1, 1, 1, ramp(pele, -5));
    px(nx + nw - 2, noseY + 1, 1, 1, ramp(pele, -5));
    if (side) volume(headX + headW, noseY, 3, 3, ramp(pele, -1), { topo: 1 });
  } else if (sp.flatNose || sp.wideNose) {
    const nw = Math.max(3, r(headW * 0.32));
    const nx = -Math.floor(nw / 2) + lead;
    const cor = look.noseTint ?? ramp(pele, -2);
    px(nx, noseY, nw, 2, cor);
    px(nx, noseY, 1, 2, ramp(cor, 1));
    px(nx + nw - 1, noseY, 1, 2, ramp(cor, -2));
    px(nx, noseY + 1, 1, 1, ramp(cor, -4));
    px(nx + nw - 1, noseY + 1, 1, 1, ramp(cor, -4));
  } else {
    px(lead - 1, noseY - 1, 1, 3, ramp(pele, 1));            // dorso iluminado
    px(lead, noseY, 1, 2, ramp(pele, -3));                   // lado em sombra
    if (rico) px(lead - 2, noseY + 1, 1, 1, ramp(pele, -4)); // narina
  }
  if (rico) px(lead - 1, noseY + 2, 1, 1, ramp(pele, -2));   // sombra sob o nariz

  // ---- boca ----------------------------------------------------------------
  // Estreita e só um degrau abaixo da maçã do rosto. Larga e escura, somada à
  // sombra do nariz logo acima, as duas liam como um bigode desenhado.
  const mouthY = Math.min(chin - 2, noseY + (rico ? 3 : 2));
  const mw = Math.max(2, r(headW * 0.26));
  px(-Math.floor(mw / 2) + lead, mouthY, mw, 1, ramp(pele, -3));
  if (rico) px(-Math.floor(mw / 2) + lead, mouthY + 1, mw, 1, ramp(pele, 1));
  if (sp.fangs) {
    px(-Math.floor(mw / 2) + lead, mouthY + 1, 1, 1, '#ebe3cf');
    px(Math.floor(mw / 2) - 1 + lead, mouthY + 1, 1, 1, '#ebe3cf');
  }
  if (sp.tusks) {
    for (const s of [-1, 1]) {
      const x = s < 0 ? -Math.floor(mw / 2) - 1 + lead : Math.floor(mw / 2) + lead;
      px(x, mouthY - 1, 2, 3, '#ebe3cf');
      px(x + (s < 0 ? 0 : 1), mouthY - 2, 1, 1, '#f6f0e2');
      px(x + (s < 0 ? 1 : 0), mouthY, 1, 2, ramp('#ebe3cf', -2));
    }
  }

  // ---- barba ---------------------------------------------------------------
  if ((look.beard || sp.beardAlways) && !back) {
    const farta = !!sp.beardAlways;
    const hair = apart(look.hair ?? '#4a3a2a', pele);
    const by = farta ? eyeY + 3 : mouthY + 1;
    const bw = jawW + (farta ? 4 : 0);
    const bx = -Math.floor(bw / 2) + lead;
    const queda = farta ? r(m.headH * 0.6) : 2;
    volume(bx, by, bw, Math.max(1, chin - by), hair, { topo: 1 });
    volume(bx + 1, chin, bw - 2, queda, hair, { topo: 0 });
    px(bx + 2, chin + queda - 1, Math.max(1, bw - 4), 1, ramp(hair, -4));
    for (let c = 2; c < bw - 2; c += 3) {
      px(bx + c, by + 2, 1, Math.max(1, chin - by + queda - 3), ramp(hair, -2));
      px(bx + c + 1, by + 2, 1, Math.max(1, chin - by + queda - 3), ramp(hair, 1));
    }
    if (!farta) px(bx, by, bw, 1, ramp(hair, -3));
  }
}

function drawCrown({ px, volume, contato }, look, m, { headX, headW, headTop, crown, front, side, lead }) {
  const hairH = headTop - crown;
  if (look.helm) {
    const met = look.metal;
    const hw = headW + 2;
    const hx = headX - 1;
    const hh = hairH + r(m.headH * 0.42);
    volume(hx, crown, hw, hh, met, { topo: 1 });
    px(hx + 1, crown - 1, hw - 2, 1, ramp(met, 3));          // calota
    px(hx + Math.floor(hw / 2) - 1, crown, 1, hh, ramp(met, 3));
    px(hx + Math.floor(hw / 2), crown, 1, hh, ramp(met, -2));
    px(hx, crown + hh - 1, hw, 1, ramp(met, -3));
    contato(hx + 1, crown + hh, hw - 2, met);                 // sombra na testa
    const cw = Math.max(2, r(hw * 0.2));
    volume(-Math.floor(cw / 2) + lead, crown - 3, cw, 3, look.trim ?? ramp(met, 2), { topo: 1 });
    if (front) {
      px(-1 + lead, headTop, 2, r(m.headH * 0.5), ramp(met, -2)); // nasal
      px(-1 + lead, headTop, 1, r(m.headH * 0.5), ramp(met, 1));
    }
    return;
  }

  const hair = look.hair ?? '#3a2c22';
  const long = look.hairStyle === 'long';
  switch (look.hairStyle) {
    case 'bald':
      px(headX + 1, crown + hairH - 1, headW - 2, 1, ramp(look.skin, 2));
      px(headX + 2, crown + hairH - 2, Math.max(1, headW - 5), 1, ramp(look.skin, 3));
      break;
    case 'hood': {
      const cap = look.outfitDark;
      const hh = hairH + r(m.headH * 0.6);
      volume(headX - 1, crown, headW + 2, hh, cap, { topo: 1 });
      px(headX, crown - 1, headW, 1, ramp(cap, 2));
      px(headX - 1, crown + hh - 1, headW + 2, 1, ramp(cap, -4));
      px(headX, crown + hh, headW, 1, ramp(cap, -5));
      break;
    }
    case 'spiky':
      volume(headX, crown + 1, headW, hairH, hair, { topo: 1 });
      for (let i = 0; i < headW - 1; i += 2) {
        px(headX + i, crown - 1, 2, 2, i % 4 === 0 ? ramp(hair, 1) : ramp(hair, -2));
        px(headX + i, crown - 2, 1, 1, i % 4 === 0 ? ramp(hair, 2) : hair);
      }
      contato(headX + 1, crown + hairH + 1, headW - 2, hair);
      break;
    default:
      volume(headX, crown, headW, hairH + 2, hair, { topo: 1 });
      px(headX - 1, crown + 2, 1, hairH + 1, ramp(hair, -1));
      px(headX + headW, crown + 2, 1, hairH + 1, ramp(hair, -2));
      for (let c = 2; c < headW - 1; c += 3) px(headX + c, crown + 1, 1, hairH + 1, ramp(hair, -2));
      px(headX + 1, crown, 2, 1, ramp(hair, 3));
      contato(headX + 1, crown + hairH + 2, headW - 2, hair);
      break;
  }
  if (long) {
    const fall = r(m.headH * 1.15);
    for (const s of [-1, 1]) {
      const x = s < 0 ? headX - 1 : headX + headW - 1;
      volume(x, crown + 1, 2, fall, s < 0 ? hair : ramp(hair, -1), { topo: 0 });
      px(x, crown + fall, 2, 1, ramp(hair, -4));
    }
  }
  if (side) px(headX + headW - 1, crown, 2, hairH + 2, ramp(hair, -1));
}

/**
 * A arma, desenhada A PARTIR da empunhadura.
 *
 * `gripX/gripY` são os pixels onde a mão fecha — vêm do braço, não de uma
 * posição inventada. O cabo atravessa esse ponto e a mão é repintada por cima
 * depois, então a figura segura a arma em vez de carregá-la ao lado.
 */
function drawWeapon({ px, volume }, look, m, { gripX, gripY, armW, attack, frame }) {
  const metal = look.metal;
  const wood = look.leather;
  const trim = look.trim ?? wood;

  const s = Math.max(0.75, Math.min(1.5, m.h));
  const L = (v) => Math.max(2, r(v * s));
  const T = Math.max(2, r(2.4 * s));
  const x = gripX + Math.floor((armW - T) / 2);
  const tilt = attack ? (frame === 1 ? T + 2 : T) : 0;

  /**
   * Lâmina subindo a partir de `baseY`. A borda escura dos dois lados não é
   * enfeite: a lâmina é `look.metal`, a mesma cor da armadura de placas, e sem
   * ela a espada some dentro do peitoral de quem a segura.
   */
  const haste = (bx, baseY, len, t, cor, inclina = 0) => {
    const borda = ramp(cor, -5);
    const segs = inclina ? 3 : 1;
    const segH = Math.ceil(len / segs);
    for (let i = 0; i < segs; i++) {
      const off = inclina ? r((inclina * (i + 1)) / segs) : 0;
      const y = baseY - segH * (i + 1);
      px(bx + off - 1, y, t + 2, segH, borda);
      px(bx + off, y, t, segH, cor);
      px(bx + off, y, 1, segH, ramp(cor, 3));       // fio iluminado
      if (t >= 3) px(bx + off + t - 1, y, 1, segH, ramp(cor, -2));
    }
  };

  const cabo = (len = 6, cor = wood) => {
    volume(x, gripY - 1, T, len, cor, { topo: 1 });
    for (let i = 1; i < len; i += 2) px(x, gripY - 1 + i, T, 1, ramp(cor, -2));
  };

  switch (look.weapon) {
    case 'sword': {
      cabo(6);
      volume(x - 1, gripY + 5, T + 2, 2, trim, { topo: 1 });     // pomo
      px(x - 2, gripY - 3, T + 4, 1, ramp(trim, 2));             // guarda
      px(x - 2, gripY - 2, T + 4, 1, ramp(trim, -2));
      haste(x, gripY - 3, L(20), T, metal, tilt);
      break;
    }
    case 'dagger':
      cabo(5);
      px(x - 1, gripY - 2, T + 2, 1, ramp(trim, 1));
      haste(x, gripY - 2, L(9), T, metal, tilt);
      break;
    case 'axe': {
      cabo(L(17) + 4);
      volume(x, gripY - 2 - L(17), T, L(17), wood, { topo: 1 });
      const hy = gripY - 2 - L(17) + r(tilt * 0.4);
      volume(x + T, hy, T + 3, L(8), metal, { topo: 1 });
      px(x + T, hy + 1, 1, L(6), ramp(metal, -4));
      px(x + T + 2, hy + 1, T, L(6), ramp(metal, 2));
      px(x - 1, hy + 1, 1, L(5), ramp(metal, -1));
      break;
    }
    case 'mace': {
      cabo(L(15) + 4);
      volume(x, gripY - 2 - L(15), T, L(15), wood, { topo: 1 });
      const hy = gripY - 2 - L(15) - L(6);
      volume(x - 2, hy, T + 4, L(6), metal, { topo: 1 });
      px(x - 3, hy + 1, 1, L(4), ramp(metal, -1));
      px(x + T + 2, hy + 1, 1, L(4), ramp(metal, -2));
      px(x - 1, hy + 1, 1, 1, ramp(metal, 3));
      break;
    }
    case 'staff': {
      const orb = look.glow ?? metal;
      const alto = gripY + 4 - L(36);
      volume(x, alto, T, L(36), wood, { topo: 1 });
      for (let i = 4; i < L(36); i += 7) px(x, alto + i, T, 1, ramp(wood, -2));
      volume(x - 1, gripY - L(11), armW, 3, look.skin, { topo: 1 });
      px(x - 1, gripY - L(11) + 2, armW, 1, ramp(look.skin, -3));
      volume(x - 2, alto - L(5), T + 4, L(6), orb, { topo: 1 });
      px(x - 1, alto - L(6), T + 2, 1, ramp(orb, 3));
      px(x - 1, alto - L(4), 2, 2, '#ffffff');
      px(x - 2, alto, T + 4, 1, ramp(orb, -3));
      break;
    }
    case 'bow': {
      const meia = L(16);
      volume(x, gripY - 1, T, 5, wood, { topo: 1 });
      volume(x, gripY - 1 - meia, T, meia, wood, { topo: 1 });
      volume(x, gripY + 4, T, meia, wood, { topo: 0 });
      px(x - 1, gripY - 1 - meia, T, 2, ramp(wood, 1));
      px(x - 1, gripY + 3 + meia, T, 2, ramp(wood, -2));
      px(x + T, gripY - meia, 1, meia * 2 + 4, '#e2dac6');
      volume(x + T - 1, gripY - r(meia * 0.5), 3, 3, look.skin, { topo: 1 });
      break;
    }
    default:
      break;
  }
}

/** Caído: um vulto rente ao chão, do tamanho de quem caiu. */
function paintDown({ px, volume, contato }, look, m) {
  const w = Math.max(12, r(m.shoulderW * 1.4));
  const x = -Math.floor(w / 2);
  const body = look.armorStyle === 'robe' ? look.outfit : look.outfitDark;
  volume(x, -6, w, 6, body, { topo: 1, base: 1 });
  contato(x, -1, w, body);
  volume(x + w - r(w * 0.32), -10, Math.max(4, r(m.headW * 0.7)), 5, look.skin, { topo: 1 });
  volume(x - 2, -8, 4, 3, look.leather, { topo: 1 });
}
