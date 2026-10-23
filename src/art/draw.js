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
//   faz um goblin de 41 px e um ogro de 72 px saírem do mesmo código — e o
//   que impede o hobgoblin de virar "humano de armadura".
//
// POSTURA — ver POSTURAS, abaixo
//   No tabuleiro a figura aparece com ~55 px e SÓ A SILHUETA chega ao jogador.
//   A versão anterior punha todo mundo de braço reto para baixo, pé plantado e
//   de frente: pintada de preto, a guerreira era o mesmo retângulo que o orc.
//   Agora cada arquétipo tem um jeito próprio de ficar parado, e isso muda o
//   contorno antes de mudar o detalhe.
//
// MARCA REGISTRADA — ver MARCAS
//   Além da postura, cada figura pode ter UM elemento que invade o contorno
//   (chapéu pontudo, cimeira, corcunda, manto, ombreira, capuz, tranças,
//   mochila). É o que identifica a figura pintada de preto.
//
// ROSTO — ver drawFace
//   Com 13 px de cabeça dá para arcada, nariz com lado iluminado e lado em
//   sombra, maçã do rosto, boca e queixo. A estrutura vem de `body.js`
//   (`m.face`), por espécie, e `look.facial` acrescenta a variação individual.
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

// Célula de 52x80 com a linha do chão a 5 px da base: 75 px úteis de altura e
// 26 px de cada lado do centro. Quem desenha para CIMA do topo da cabeça
// (cajado em pé, cimeira, chapéu) ou para FORA do ombro (arma apoiada,
// ombreira) tem de caber aqui, senão o sprite sai decepado na folha — e o
// contorno automático de sheet.js, que varre o alfa, some junto.
const UTIL = 75;
const META = 26;
/** Teto para qualquer coisa desenhada acima da cabeça. */
const TETO = -(UTIL - 2);

// Três vistas desenhadas. Com o espelhamento horizontal elas cobrem as oito
// orientações da grade — e as quatro diagonais que a câmera isométrica usa.
export const DIRECTIONS = ['front', 'side', 'back'];

export const shade = tom;
export { ramp, deep };

const lit = claro;
const dim = escuro;
const r = Math.round;

/**
 * POSTURAS — o jeito de ficar parado, por arquétipo.
 *
 * Tudo em pixels na escala do humano de 58 px; `postura()` reescala pela altura
 * da criatura e corta o agachamento para a perna nunca virar um toco.
 *
 *   agacha    joelho dobrado: a cintura desce e a perna encurta
 *   lean      tronco para a frente (na vista de lado é deslocamento real em x)
 *   ombroCai  ombro desce e afunda no peito; negativo levanta
 *   peito     peito estufado: ombro e tórax mais largos
 *   passo     afastamento entre os pés; negativo junta
 *   pernaFrente  uma perna adiantada
 *   cabeca    cabeça projetada à frente
 *   bracoFora quanto o braço se afasta do corpo (0 = colado)
 *   bracoExtra  braço mais comprido, pendendo abaixo do quadril
 *   estreita  ombro de três quartos: o corpo se vira (vista de frente/costas)
 *   apoio     peso num pé só: o quadril do outro lado cede
 *   arma      lado | ombro | cravada | vertical | baixa
 *   escudoAdiante  escudo puxado para a frente do tronco
 *   calcanhares    pés juntos com a ponta virada para fora
 *
 * A frase de silhueta de cada postura está no comentário de cada entrada: se a
 * frase servir para outra, a postura não resolveu nada.
 */
const POSTURAS = {
  // Figura simétrica e imóvel, braços retos colados ao corpo.
  neutro: {},

  // Figura de pé com o peso num quadril, um pé adiantado e os braços soltos.
  solto: { agacha: 1, passo: 2, pernaFrente: 1, bracoFora: 1, apoio: 1 },

  // Triângulo largo de base: pernas bem abertas e uma barra vertical cravada
  // no chão à frente do corpo.
  guerreiro: { agacha: 1, peito: 1, passo: 5, bracoFora: 2, arma: 'cravada' },

  // Bloco baixo e comprido: joelhos flexionados, ombros à frente da cintura e
  // nada subindo acima da cabeça.
  ladino: {
    agacha: 4, lean: 3, ombroCai: 1, passo: 2, pernaFrente: 3, cabeca: 2,
    bracoFora: 0, arma: 'baixa', estreita: 5, apoio: 1,
  },

  // Coluna estreita e imóvel com uma haste vertical mais alta que a figura.
  mago: { passo: -2, cabeca: -1, bracoFora: 0, arma: 'vertical', estreita: 1 },

  // Retângulo largo no tronco por causa da placa adiantada, e uma haste curta
  // apoiada no ombro.
  clerico: {
    agacha: 1, lean: 1, passo: 1, pernaFrente: 1, bracoFora: 1,
    arma: 'ombro', escudoAdiante: 2, apoio: 1,
  },

  // Cunha baixa: cabeça à frente dos ombros, quadril recuado, quase sem
  // pescoço, a figura mais curta do elenco bípede.
  agachado: {
    agacha: 5, lean: 3, ombroCai: 1, passo: 3, pernaFrente: 1, cabeca: 3,
    bracoFora: 1, arma: 'baixa', estreita: 2,
  },

  // Coluna vertical de ombro reto e pés juntos, com a haste atravessando a
  // diagonal por cima de um dos ombros.
  militar: {
    ombroCai: -1, peito: 2, passo: -2, cabeca: -1, bracoFora: 0,
    arma: 'ombro', calcanhares: 1,
  },

  // Pêra invertida: ombros caídos e arredondados no alto, braços passando
  // abaixo do quadril, cabeça entre os ombros.
  curvado: {
    agacha: 3, lean: 2, ombroCai: 4, passo: 0, cabeca: 3, bracoFora: 3,
    // Pé junto e braço MUITO longo: é o que separa o bugbear do ogro, que
    // também é largo e também tem o ombro caído. Com os dois de perna aberta,
    // os dois viravam o mesmo trapézio no teste da silhueta.
    bracoExtra: 7, arma: 'lado', estreita: 1, apoio: 1,
  },

  // Trapézio pesado: ombro largo caído sobre pernas muito abertas, uma
  // adiantada, com a haste descansando na diagonal do ombro.
  bruto: {
    agacha: 2, lean: 1, ombroCai: 3, passo: 5, pernaFrente: 4, cabeca: 1,
    bracoFora: 2, bracoExtra: 2, arma: 'ombro', apoio: 1,
  },
};

const POSTURA_ZERO = {
  agacha: 0, lean: 0, ombroCai: 0, peito: 0, passo: 0, pernaFrente: 0,
  cabeca: 0, bracoFora: 1, bracoExtra: 0, estreita: 0, apoio: 0,
  arma: 'lado', escudoAdiante: 0, calcanhares: 0,
};

/**
 * Arquétipo deduzido do equipamento.
 *
 * Existe porque os looks do grupo (`looks/party.js`) foram escritos antes do
 * campo `stance` e não podem ser editados por este arquivo. Armadura e arma já
 * dizem o que a figura é: placa com escudo é guerreiro, veste com cajado é
 * mago. Quem declara `stance` no look não passa por aqui.
 */
function arquetipo(look) {
  if (look.armorStyle === 'robe' || look.weapon === 'staff') return 'mago';
  if (look.shield && (look.weapon === 'mace' || look.weapon === 'axe')) return 'clerico';
  if (look.weapon === 'dagger' || look.weapon === 'bow') return 'ladino';
  if (look.armorStyle === 'plate' || look.armorStyle === 'scale' || look.shield) return 'guerreiro';
  return 'solto';
}

/** Postura resolvida e já em pixels desta criatura. */
function postura(look, m) {
  const nome = m.stance ?? arquetipo(look);
  const st = { ...POSTURA_ZERO, ...(POSTURAS[nome] ?? POSTURAS.solto) };
  // Agachar é limitado pela perna que a criatura tem: os 5 px do goblin
  // agachado sobre 11 px de perna deixariam a figura sem canela.
  const agacha = Math.max(0, Math.min(r(st.agacha * m.h), Math.floor(m.legH * 0.34)));
  return {
    ...st,
    nome,
    agacha,
    lean: st.lean + m.hunch,
    passo: r(st.passo * m.h),
    pernaFrente: r(st.pernaFrente * m.h),
    bracoExtra: r(st.bracoExtra * m.h),
  };
}

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

/** `look.marca` e `look.facial` aceitam uma string ou uma lista. */
const lista = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
const tem = (v, nome) => lista(v).includes(nome);

export function paint(ctx, ox, oy, w, h, look, dir, pose) {
  const kit = makeKit(ctx, ox, oy, w, h, GROUND);
  const { px, volume, contato, coluna, traco } = kit;

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
  const st = postura(look, m);
  const bob = pose.kind === 'idle' && pose.frame === 1 ? -1 : 0;
  const lean = attack ? (pose.frame === 1 ? 2 : 1) : 0;
  const recoil = pose.kind === 'hurt' ? -2 : 0;

  // Atacar devolve o braço ao movimento: a arma apoiada no ombro ou cravada no
  // chão é pose de descanso, e manter isso no golpe faria a figura bater com a
  // arma parada. O corpo de baixo mantém a postura — quem agacha, agacha para
  // golpear também.
  const apoio = attack ? 'lado' : st.arma;

  // Vira o corpo de três quartos na vista de frente/costas. É o que dá "corpo
  // de lado" ao ladino sem desenhar uma quarta vista.
  const giro = front || back ? r(st.estreita * 0.5) * (back ? -1 : 1) : 0;
  const desvio = side ? st.lean : giro;
  // Cabeça projetada: na vista de lado é deslocamento real; de frente ela só
  // pode descer e engrossar, que é como a perspectiva lê um pescoço esticado.
  const cabX = side ? st.cabeca : 0;
  const cabY = side ? 0 : r(Math.max(0, st.cabeca) * 0.5);

  const upper = bob + recoil + st.agacha;
  const cintura = m.waist + st.agacha;
  const torsoTop = m.torsoTop + upper + st.ombroCai;
  const chin = m.chin + upper + r(st.ombroCai * 0.5) + cabY;
  const headTop = chin - m.headH;
  const crown = headTop - m.hairH;

  const estreita = front || back ? st.estreita : 0;
  const chest = side
    ? Math.max(6, r(m.chestW * 0.64))
    : Math.max(6, m.chestW + st.peito - Math.max(0, estreita - 1));
  const shoulder = side
    ? Math.max(7, r(m.shoulderW * 0.6))
    : Math.max(chest + 2, m.shoulderW + st.peito - estreita);
  const headW = side ? Math.max(7, r(m.headW * 0.84)) : m.headW + (cabY > 0 ? 1 : 0);
  const chestX = -Math.floor(chest / 2) + desvio;
  const shoulderX = -Math.floor(shoulder / 2) + desvio;
  const headX = -Math.floor(headW / 2) + desvio + cabX;
  const lead = desvio + cabX;

  const ctxArt = {
    chest, shoulder, headW, chestX, shoulderX, headX, torsoTop, chin, headTop,
    crown, cintura, lead, desvio, side, back, front, st, pose,
  };

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

  // ---- marca registrada, camada de trás ------------------------------------
  drawMarca(kit, look, m, ctxArt, 'atras');

  // ---- onde a mão fecha ----------------------------------------------------
  const sleeve = look.armorStyle === 'plate' ? look.metal : look.outfit;
  const armY = torsoTop + 2 + (attack ? -2 : 0);
  let armH = Math.max(5, r(m.torsoH * 0.6 * m.arms)) + st.bracoExtra;
  armH = Math.min(armH, Math.max(5, m.footTop - 3 - armY));
  const farX = side ? lead - Math.floor(chest / 2) - m.armW : shoulderX - m.armW;
  const nearX = side ? desvio + Math.floor(chest / 2) : shoulderX + shoulder;
  // Peso no lado da arma: aquele ombro desce um pixel. Os dois ombros na mesma
  // linha dão uma figura de boneco de papel, simétrica e parada.
  const nearY = armY - lean + (side || back ? 0 : 1);

  // A mão vai para onde a postura manda, e o braço se dobra para alcançá-la.
  let gripX = nearX;
  let gripY = nearY + armH;
  switch (apoio) {
    case 'ombro':
      // A mão sobe até o ombro e a arma fica POR FORA dele. Encostada por
      // dentro, a lâmina cruzava a cabeça e a figura perdia o rosto.
      gripY = torsoTop + Math.max(2, r(m.torsoH * 0.2));
      gripX = nearX + (side ? -1 : 1);
      break;
    case 'baixa':
      gripY = cintura - 2;
      gripX = nearX - (side ? 0 : 1);
      break;
    case 'vertical':
      gripY = cintura - Math.max(2, r(m.torsoH * 0.18));
      gripX = side ? desvio + Math.floor(chest / 2) + 1 : desvio + Math.max(2, r(shoulder * 0.26));
      break;
    case 'cravada':
      gripY = torsoTop + r(m.torsoH * 0.46);
      gripX = side ? desvio + Math.floor(chest / 2) + 1 : nearX - 1;
      break;
    default:
      break;
  }
  gripY = Math.min(gripY, m.footTop - 4);
  // A arma nasce da mão: se a mão sai da célula, a arma sai junto.
  gripX = Math.max(-(META - m.armW - 5), Math.min(META - m.armW - 5, gripX));

  /**
   * Membro diagonal. `coluna` resolve braço e perna na vertical, mas um braço
   * que sobe até o ombro ou avança para cravar a arma é uma diagonal, e
   * retângulo axial não faz diagonal sem escada.
   */
  const membro = (x0, y0, x1, y1, esp, cor) => {
    traco(x0, y0, x1, y1, esp, cor);
    if (esp >= 3) traco(x0 + esp - 1, y0, x1 + esp - 1, y1, 1, ramp(cor, -1));
    if (esp >= 2) traco(x0 + esp - 2, y0 + 1, x1 + esp - 2, y1 + 1, 1, ramp(cor, -2));
    traco(x0, y0, x1, y1, 1, ramp(cor, 2));
  };

  const afinaBraco = m.armW >= 4 ? 1 : 0;
  /** Braço reto, pendendo do ombro: fica melhor de `coluna`, que afina o punho. */
  const bracoReto = (x, y, alt, cor, fora = 0) => {
    const cxc = x + Math.floor(m.armW / 2);
    coluna(y, alt, (t) => ({ c: cxc + fora * t, w: m.armW - afinaBraco * t }), cor, { topo: 1 });
    contato(cxc - Math.floor(m.armW / 2) + fora, y + alt - 1, m.armW, cor);
  };
  /** Braço dobrado: ombro → cotovelo (para baixo e fora) → mão. */
  const bracoDobrado = (xo, yo, hx, hy, cor, fora) => {
    // O cotovelo sai para fora, mas não para fora da célula: num ogro de ombro
    // de 32 px, `fora * 2` mais a espessura do braço passava da borda.
    const ex = Math.max(-(META - m.armW - 2), Math.min(META - m.armW - 2, xo + fora * 2));
    const ey = yo + Math.max(3, r(armH * 0.62));
    membro(xo, yo, ex, ey, m.armW, cor);
    membro(ex, ey, hx, hy, Math.max(2, m.armW - 1), ramp(cor, 1));
    contato(Math.min(ex, hx), ey + m.armW - 1, Math.abs(hx - ex) + m.armW, cor);
  };
  const mao = (x, y) => {
    volume(x, y, m.armW, 3, look.skin, { topo: 1 });
    px(x, y + 2, m.armW, 1, ramp(look.skin, -3));   // nó dos dedos
    // Sulco entre os dedos. Numa mão de ogro, com 6 px de largura, o bloco de
    // pele sem sulco nenhum lia como luva de boxe.
    for (let i = 1; i < m.armW - 1; i += 2) px(x + i, y + 1, 1, 1, ramp(look.skin, -2));
  };
  const arma = () => drawWeapon(kit, look, m, {
    gripX, gripY, armW: m.armW, attack, frame: pose.frame, apoio, crown, lead,
  });

  // ---- pernas --------------------------------------------------------------
  const robe = look.armorStyle === 'robe';
  if (!robe) drawLegs(kit, look, m, { side, attack, lean, st, cintura });

  if (back && !look.cloak) arma();

  // ---- tronco --------------------------------------------------------------
  drawTorso(kit, look, m, {
    chestX, chest, shoulderX, shoulder, torsoTop, side, back, robe, cintura, desvio,
  });

  // ---- braços e arma -------------------------------------------------------
  // A cava: uma coluna escura onde o braço encaixa no tronco. Sem ela o braço
  // da mesma cor da armadura funde com o peito e a figura fica sem membro.
  if (!side) {
    // Meia altura do tronco: a cava inteira seguia reta enquanto o tronco
    // inclinado se afastava dela, e a linha escura ficava boiando no ar.
    const cava = Math.max(3, Math.min(armH, r(m.torsoH * 0.55)));
    px(shoulderX, torsoTop + 1, 1, cava, ramp(look.outfit, -4));
    px(shoulderX + shoulder - 1, torsoTop + 1, 1, cava, ramp(look.outfit, -4));
  }
  if (!side) {
    const altFar = Math.min(armH, m.footTop - 4 - armY);
    bracoReto(farX, armY, Math.max(4, altFar), ramp(sleeve, -2), -st.bracoFora);
    mao(farX - Math.max(0, st.bracoFora), armY + Math.max(4, altFar));
  }

  // Reto quando a mão cai embaixo do ombro; dobrado quando a postura a levou
  // para outro lugar.
  const retoNear = Math.abs(gripX - nearX) <= 1 && gripY >= nearY + r(armH * 0.8);
  if (retoNear) bracoReto(nearX, nearY, Math.max(4, gripY - nearY), ramp(sleeve, -1), st.bracoFora);
  else bracoDobrado(nearX, nearY, gripX, gripY, ramp(sleeve, -1), Math.max(1, st.bracoFora));

  if (!back) arma();
  mao(gripX, gripY);

  // ---- escudo --------------------------------------------------------------
  if (look.shield) {
    drawShield(kit, look, m, {
      shoulderX, shoulder, torsoTop, side, back, adiante: st.escudoAdiante, cintura,
    });
  }

  // ---- pescoço -------------------------------------------------------------
  // Da base do queixo até a linha do ombro, qualquer que seja ela: com ombro
  // caído e cabeça baixa o pescoço some, e é assim que tem de ser.
  const neckH = Math.max(1, torsoTop + 1 - chin);
  const nw = Math.max(2, r(headW * 0.42));
  const nx = -Math.floor(nw / 2) + r((desvio + lead) / 2);
  px(nx, chin, nw, neckH, ramp(look.skin, -2));
  px(nx, chin, 1, neckH, ramp(look.skin, -1));

  // ---- cabeça --------------------------------------------------------------
  drawHead(kit, look, m, { headX, headW, headTop, chin, front, side, back, lead });
  drawCrown(kit, look, m, { headX, headW, headTop, crown, front, side, lead });

  if (look.horns) {
    const hy = Math.max(crown - Math.max(3, r(m.headH * 0.4)), TETO);
    for (const s of [-1, 1]) {
      const x = s < 0 ? headX - 1 : headX + headW - 1;
      volume(x, hy, 2, headTop - hy + 1, ramp(look.skin, -3), { topo: 1 });
    }
  }

  // ---- marca registrada, camada da frente ----------------------------------
  drawMarca(kit, look, m, ctxArt, 'frente');
}

// ---------------------------------------------------------------------------

function drawLegs({ px, volume, contato, coluna }, look, m, { side, attack, lean, st, cintura }) {
  const cor = look.outfitDark;
  const y = cintura;
  const h = m.footTop - cintura;
  const bota = m.sp.bigFeet ? look.skin : look.leather;
  const quadril = Math.floor(m.legW / 2) + Math.floor(m.gap / 2);   // quadril anatômico
  // `passo` abre o PÉ, não o quadril. Somado ao quadril, ele afastava o ponto
  // onde a perna nasce do tronco: o guerreiro de pernas abertas ficava com um
  // rasgo preto de 17 px na virilha, e não com uma base larga.
  // Teto pelo comprimento da perna: a passada não pode ser tão aberta que a
  // coxa vire uma diagonal de 45 graus, que em pixel art lê como escada.
  const abre = Math.max(-(quadril - 1), Math.min(
    Math.floor((m.footTop - cintura) * 0.4),
    Math.max(1, r(m.legW * 0.34)) + st.passo,
  ));
  const fino = m.legW >= 4 ? 1 : 0;                // e afina até o tornozelo

  const larg = (t) => m.legW - fino * t + (t > 0.42 && t < 0.62 ? 1 : 0);
  // Joelho dobrado empurra a canela para a frente. Sem isso o agachamento só
  // encurta a perna, e a figura lê como anão, não como alguém agachado.
  const curva = (t) => (side ? r(st.agacha * 0.9 * Math.sin(Math.PI * t)) : 0);

  const perna = (anca, lado, tom = 0, atraso = 0, aberto = abre) => {
    const c = tom ? ramp(cor, tom) : cor;
    const hh = Math.max(4, h - atraso);
    coluna(y + atraso, hh, (t) => ({ c: anca + lado * aberto * t + curva(t), w: larg(t) }), c, { topo: 0 });
    const pe = Math.round(anca + lado * aberto);
    px(pe - Math.floor(larg(1) / 2), y + atraso + r(hh * 0.5), Math.max(1, r(larg(1)) - 1), 1, ramp(c, 1));
    contato(pe - Math.floor(m.legW / 2), m.footTop - 1, m.legW, c);
    const pw = m.footW + (st.calcanhares ? 1 : 0);
    const bx = pe - Math.floor(pw / 2) + (st.calcanhares ? lado : 0);
    const b = tom ? ramp(bota, tom) : bota;
    volume(bx, m.footTop, pw, m.feetH, b, { topo: 1 });
    px(bx, m.footTop + m.feetH - 1, pw, 1, ramp(b, -4));
    if (m.feetH >= 4) px(bx, m.footTop + 1, pw, 1, ramp(b, 1));
  };

  if (side) {
    const avanco = (attack ? 2 : 0) + Math.max(0, st.pernaFrente);
    perna(-r(m.legW / 2) - r(avanco * 0.6), -1, -2, 0, 1);
    perna(-r(m.legW / 2) + avanco + lean, 1, 0, 0, 1);
  } else {
    // Peso num pé só: o quadril do lado solto cede e aquela perna começa mais
    // baixo. Dois quadris na mesma linha é o que fazia a figura ler como
    // boneco de vestir.
    perna(-quadril, -1, 0, st.apoio);
    // Perna adiantada: de frente ela aparece como um pé mais aberto e mais
    // baixo, que é o que a perspectiva faz com quem dá um passo à frente.
    perna(quadril, 1, 0, 0, abre + Math.max(0, r(st.pernaFrente * 0.5)));
    const vao = Math.max(1, quadril * 2 - m.legW + 1);
    px(-Math.floor(vao / 2), y, vao, Math.max(1, r(h * 0.45)), ramp(cor, -4));
  }
}

function drawTorso({ px, volume, contato, coluna }, look, m, { chestX, chest, shoulderX, shoulder, torsoTop, side, back, robe, cintura, desvio }) {
  const bottom = robe ? m.footTop : cintura + 1;
  const h = Math.max(6, bottom - torsoTop);
  const cintW = Math.max(4, chest - (m.chestW - m.waistW));

  /**
   * Perfil do tronco. Ombro largo no alto, peito cheio, cintura estreita, e as
   * duas primeiras linhas puxadas para dentro para arredondar o trapézio. Um
   * retângulo da altura toda é o que faz a figura parecer uma caixa com cabeça.
   */
  const larguraEm = (t) => {
    if (robe && t > 0.5) {                         // a veste alarga para baixo
      return cintW + (shoulder - cintW) * 0.9 * ((t - 0.5) / 0.5);
    }
    if (t <= 0.05) return shoulder - 3;
    if (t <= 0.12) return shoulder - 1;
    if (t <= 0.40) return chest + (shoulder - chest) * (1 - (t - 0.12) / 0.28);
    return chest - (chest - cintW) * ((t - 0.40) / 0.60);
  };
  // O tronco INCLINA, não desliza. `desvio` vale inteiro no ombro e some na
  // cintura: deslocando o tronco todo, o quadril do goblin corcunda ficava 5 px
  // atrás do peito e a figura parecia partida em duas na altura do cinto.
  const tDe = (y) => (h <= 1 ? 0 : (y - torsoTop) / (h - 1));
  const inclina = (t) => Math.round(desvio * (1 - 0.75 * Math.min(1, Math.max(0, t))));
  const dx = (y) => inclina(tDe(y));
  const forma = (t) => ({ c: inclina(t), w: larguraEm(t) });
  const linha = (y) => Math.round(larguraEm(tDe(y)));
  const esq = (y) => -Math.floor(linha(y) / 2) + dx(y);

  coluna(torsoTop, h, forma, look.outfit, { topo: 1 });

  if (m.belly > 0 && !robe) {
    const by = torsoTop + r(h * 0.45);
    coluna(by, bottom - by, (t) => ({ c: dx(by + t * (bottom - by)), w: larguraEm(tDe(by + t * (bottom - by))) + m.belly * t }), look.outfit, { topo: 0 });
  }

  const plateY = torsoTop + 1;
  const plateH = Math.max(5, (robe ? cintura : bottom) - plateY);
  const formaArm = (t) => ({ c: dx(plateY + t * (plateH - 1)), w: larguraEm(tDe(plateY + t * (plateH - 1))) });

  switch (look.armorStyle) {
    case 'plate': {
      const met = look.metal;
      coluna(plateY, plateH, formaArm, met, { topo: 1 });
      // quilha central: o peitoral é uma aresta, não uma chapa plana
      for (let q = 1; q < plateH - 1; q++) {
        px(dx(plateY + q) - 1, plateY + q, 1, 1, ramp(met, 3));
        px(dx(plateY + q), plateY + q, 1, 1, ramp(met, -1));
      }
      // peitoral sugerido por duas sombras curtas
      const yPeito = plateY + r(plateH * 0.4);
      const wPeito = Math.max(2, r(linha(yPeito) * 0.28));
      px(esq(yPeito) + 1, yPeito, wPeito, 1, ramp(met, -2));
      px(-esq(yPeito) - 1 - wPeito + dx(yPeito) * 2, yPeito, wPeito, 1, ramp(met, -3));
      // fralda de placas na cintura
      if (!robe) {
        const fy = cintura - 3;
        const fw = linha(fy) + 2;
        volume(-Math.floor(fw / 2) + dx(fy), fy, fw, 4, met, { topo: 1 });
        for (let c = 1; c < fw; c += 3) px(-Math.floor(fw / 2) + dx(fy) + c, fy + 1, 1, 3, ramp(met, -3));
        contato(-Math.floor(fw / 2) + dx(fy), fy, fw, met);
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
        const x0 = -Math.floor(lw / 2) + dx(y);
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
      coluna(vy, vh, (t) => ({ c: dx(vy + t * (vh - 1)), w: larguraEm(tDe(vy + t * (vh - 1))) - recuo }), cou, { topo: 1 });
      // decote: devolve o meio do peito à túnica nas primeiras linhas
      const decote = Math.max(2, r(vh * 0.3));
      for (let i = 0; i < decote; i++) {
        const abre2 = Math.max(1, r(((decote - i) / decote) * chest * 0.3));
        px(dx(vy + i) - abre2, vy + i, abre2 * 2, 1, look.outfit);
        px(dx(vy + i) - abre2, vy + i, 1, 1, ramp(cou, -4));
        px(dx(vy + i) + abre2 - 1, vy + i, 1, 1, ramp(cou, -4));
      }
      // costura na borda e fivela lateral
      for (let i = 1; i < vh; i += 2) {
        const lw = linha(vy + i) - recuo;
        px(-Math.floor(lw / 2) + dx(vy + i) + 1, vy + i, 1, 1, ramp(cou, 3));
      }
      const ys = vy + r(vh * 0.55);
      px(esq(ys) + 1, ys, Math.max(2, r(linha(ys) * 0.3)), 2, ramp(cou, -3));
      break;
    }
    default: // túnica ou veste
      if (robe) {
        for (let y = cintura; y < bottom; y += 1) {
          const lw = linha(y);
          const x0 = -Math.floor(lw / 2) + dx(y);
          for (let c = 2; c < lw - 1; c += 4) {
            px(x0 + c, y, 1, 1, ramp(look.outfit, -2));
            px(x0 + c + 1, y, 1, 1, ramp(look.outfit, 1));
          }
        }
        px(esq(bottom - 1), bottom - 1, linha(bottom - 1), 1, ramp(look.outfit, -4));
        px(esq(cintura), cintura, linha(cintura), 1, ramp(look.outfit, -3));
      }
      break;
  }

  // Pelagem do bugbear.
  if (m.sp.fur) {
    const pelo = look.hair ?? ramp(look.outfit, -2);
    const topW = linha(torsoTop + 2) + 2;
    volume(-Math.floor(topW / 2) + desvio, torsoTop, topW, 4, pelo, { topo: 1 });
    for (let c = 1; c < topW; c += 2) {
      px(-Math.floor(topW / 2) + desvio + c, torsoTop + 3, 1, 2 + (c % 4 ? 1 : 0), ramp(pelo, -2));
    }
    for (let c = 2; c < topW - 2; c += 3) {
      px(-Math.floor(topW / 2) + dx(torsoTop + 6) + c, torsoTop + 6, 1, Math.max(2, r(h * 0.26)), ramp(pelo, -1));
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
    const cy = cintura - 3;
    const cw = linha(cy) + 1;
    const cdx = dx(cy);
    volume(-Math.floor(cw / 2) + cdx, cy, cw, 3, cinto, { topo: 1 });
    const fw = Math.max(2, r(cw * 0.22));
    px(-Math.floor(fw / 2) + cdx, cy, fw, 3, look.trim ?? look.metal);
    px(-Math.floor(fw / 2) + cdx, cy, fw, 1, ramp(look.trim ?? look.metal, 3));
    px(-Math.floor(fw / 2) + cdx + 1, cy + 1, Math.max(1, fw - 2), 1, ramp(look.trim ?? look.metal, -3));
    contato(-Math.floor(cw / 2) + cdx, cintura - 1, cw, cinto);
  }
}

function drawShield({ px, volume, contato }, look, m, { shoulderX, shoulder, torsoTop, side, back, adiante, cintura }) {
  const campo = look.trim ?? ramp(look.metal, -2);
  const aro = look.metal;
  // Escudo adiantado cobre o tronco: é a silhueta do clérigo, um retângulo
  // largo e alto onde os outros têm cintura.
  const sw = Math.max(6, r(m.shoulderW * (adiante ? 0.52 : 0.36)));
  const sh = Math.max(11, r(m.torsoH * (adiante ? 1.15 : 1.0)));
  const sy = torsoTop + 2;
  const sx = side
    ? shoulderX - 2 + adiante
    : back ? shoulderX + shoulder - 1 : shoulderX - sw + 1 + adiante * 2;

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
  const bw = Math.max(3, Math.min(sw - 5, r(sh * 0.3)));
  const bx = sx + Math.floor((sw - bw) / 2);
  const by = sy + r(sh * 0.36);
  volume(bx, by, bw, bw, aro, { topo: 1 });
  px(bx + 1, by + 1, 1, 1, ramp(aro, 3));
  contato(bx, by + bw, bw, campo);
  if (adiante) contato(sx, Math.min(cintura, sy + sh - 1), sw, campo);
}

function drawHead(kit, look, m, { headX, headW, headTop, chin, front, side, back, lead }) {
  const { px, coluna } = kit;
  const f = m.face;
  const pele = look.skin;
  const headH = chin - headTop;
  const jawY = headTop + Math.max(2, r(headH * (0.30 + f.testa * 0.6)));
  const jawW = Math.max(4, side ? r(m.jawW * 0.86) : m.jawW);
  // Queixo recuado some para trás no perfil; mandíbula projetada avança.
  const jawLead = side
    ? lead + (f.queixo === 'recuado' ? -1 : f.projeta === 'mandibula' ? 2 : 0)
    : lead;

  // Quanto o maxilar afina do alto do queixo até a ponta. É aqui que o queixo
  // pontudo do elfo deixa de ser o queixo quadrado do hobgoblin.
  const afina = Math.max(0, Math.min(jawW - 5, {
    pontudo: 3, redondo: 2, quadrado: 1, largo: 0, recuado: 3,
  }[f.queixo] ?? 1));

  // Crânio com a calota arredondada e maxilar que afina até o queixo. Dois
  // retângulos empilhados leem como caixa com olhos, não como cabeça.
  const craH = Math.max(1, jawY - headTop);
  const estreita = Math.min(4, Math.max(2, r(headW * 0.3)));
  coluna(headTop, craH, (t) => ({
    c: lead,
    w: t < 0.22 ? headW - estreita + (estreita * t) / 0.22 : headW,
  }), pele, { topo: 1 });
  coluna(jawY, Math.max(1, chin - jawY), (t) => ({
    c: jawLead,
    w: jawW - afina * t,
  }), pele, { topo: 0 });
  // Sombra sob o queixo. Só as bordas: a faixa escura de ponta a ponta caía
  // em cima do lábio inferior e as duas liam juntas como um bigode pintado.
  const chinW = Math.max(1, jawW - 2 - afina);
  px(jawX(jawW, jawLead) + 1, chin - 1, chinW, 1, ramp(pele, -1));
  px(jawX(jawW, jawLead) + 1, chin - 1, 1, 1, ramp(pele, -3));
  px(jawX(jawW, jawLead) + chinW, chin - 1, 1, 1, ramp(pele, -4));

  drawEars(kit, look, m, { headX, headW, headTop, headH, lead, pele });

  if (back) {
    px(headX + 1, headTop + 2, headW - 2, chin - headTop - 3, ramp(pele, -2));
    return;
  }

  drawFace(kit, look, m, {
    headX, headW, headTop, chin, headH, jawY, jawW, jawLead, front, side, lead, pele, afina,
  });
}

const jawX = (jawW, jawLead) => -Math.floor(jawW / 2) + jawLead;

function drawEars({ px, volume }, look, m, { headX, headW, headTop, headH, lead, pele }) {
  const sp = m.sp;
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
  } else if (sp.ear === 'point') {
    // Meio-elfo: a ponta existe e é só um pixel acima da hélice. É o que faz
    // "meio" ler como meio em vez de ler como elfo pequeno.
    for (const s of [-1, 1]) {
      const x = s < 0 ? headX - 1 : headX + headW;
      px(x, earY, 2, 3, pele);
      px(x + (s < 0 ? 0 : 1), earY - 1, 1, 1, ramp(pele, 1));
      px(x + (s < 0 ? 1 : 0), earY + 1, 1, 2, ramp(pele, -3));
    }
  } else if (look.ears !== false) {
    for (const s of [-1, 1]) {
      const x = s < 0 ? headX - 1 : headX + headW;
      px(x, earY, 1, Math.max(2, r(headH * 0.25)), ramp(pele, s < 0 ? 0 : -1));
    }
  }
}

/**
 * O ROSTO.
 *
 * Antes daqui, hobgoblin e orc tinham a mesma cara com tinta diferente: uma
 * arcada genérica, dois olhos de 2 px, um nariz de três pixels e um traço de
 * boca. A estrutura agora vem de `m.face` — testa, arcada, maçã, mandíbula,
 * formato de nariz, formato de boca — e cada espécie tem a sua.
 *
 * `look.facial` acrescenta a variação individual: é o que impede dois plebeus
 * humanos de serem o mesmo NPC.
 */
function drawFace(kit, look, m, { headX, headW, headTop, chin, headH, jawY, jawW, jawLead, front, side, lead, pele, afina }) {
  const { px, volume, coluna } = kit;
  const sp = m.sp;
  const f = m.face;
  const rico = headH >= 11;
  const eyeY = headTop + Math.max(2, r(headH * f.testa));
  const jx = jawX(jawW, jawLead);

  // ---- maçãs do rosto ------------------------------------------------------
  // Duas colunas de sombra na borda da face não são enfeite: são o que dá
  // volume à cabeça e o que separa a face angulosa do hobgoblin da face lisa e
  // seca do goblin.
  // A coluna da maçã PARA na linha do maxilar. Descendo além dela, ela caía
  // fora da mandíbula (que é mais estreita que o crânio) e virava dois
  // colchetes escuros soltos ao lado da cara.
  if (f.macas >= 1 && rico) {
    const alt = 2 + f.macas;
    px(headX, jawY - alt, 1, alt, ramp(pele, -2));
    px(headX + headW - 1, jawY - alt - 1, 1, alt + 1, ramp(pele, -3));
  }
  if (f.macas >= 2) {
    px(headX + 1, jawY - 1, 1, 1, ramp(pele, 2));            // osso iluminado
    px(headX + headW - 2, jawY - 1, 1, 1, ramp(pele, 1));
    // A maçã alta se diz com a LUZ no osso, não com sombra na bochecha. Os
    // dois pixels escuros ao lado da boca que a versão anterior punha aqui
    // liam como sujeira e puxavam a cara para baixo, num esgar.
  }

  // ---- arcada --------------------------------------------------------------
  // De 0 (elfo, halfling) a 3 (hobgoblin). Em 3 ela PASSA DA LARGURA do crânio
  // e projeta sombra sobre o olho: a arcada é a assinatura do hobgoblin, e no
  // contorno ela aparece como uma aba acima dos olhos.
  //
  // Só a arcada pesada é uma FAIXA de ponta a ponta. A arcada média e a leve
  // são dois trechos curtos, um sobre cada olho: a faixa inteira em pele clara
  // vira uma barra laranja atravessada na testa — monocelha, não osso.
  const sobrancelha = (yy, passo, alt = 1) => {
    const lw = Math.max(2, r(headW * 0.3));
    for (const sgn of [-1, 1]) {
      const x = sgn < 0 ? headX + 1 : headX + headW - 1 - lw;
      px(x, yy, lw, alt, ramp(pele, sgn < 0 ? passo : passo - 1));
    }
  };
  if (f.arcada >= 3) {
    px(headX - 1, eyeY - 2, headW + 2, 2, ramp(pele, -4));
    px(headX - 1, eyeY - 3, headW + 2, 1, ramp(pele, -1));
    // A sombra da arcada cai entre os olhos e nas têmporas, nunca SOBRE o
    // olho: cobrindo a linha inteira, a arcada apagava o único ponto claro do
    // rosto e o hobgoblin ficava sem olhar.
    px(lead - 2, eyeY, 4, 1, ramp(pele, -3));
    px(headX, eyeY, 1, 1, ramp(pele, -3));
    px(headX + headW - 1, eyeY, 1, 1, ramp(pele, -4));
  } else if (f.arcada === 2) {
    sobrancelha(eyeY - 2, -4, 2);
    sobrancelha(eyeY - 3, -2);
  } else if (f.arcada === 1 && rico) {
    sobrancelha(eyeY - 1, -2);
  } else if (rico) {
    sobrancelha(eyeY - 1, -1);
  }

  // ---- olhos ---------------------------------------------------------------
  const branco = sp.darkEyes ? ramp(pele, -5) : '#f2ece0';
  const ew = Math.max(1, Math.min(f.olhoW, Math.floor((headW - 3) / 2)));
  const eh = f.olhoH;
  const off = Math.max(1, r(headW * 0.17) + f.olhoGap);
  const olho = (x, s) => {
    const esc = s < 0 ? branco : ramp(branco, -1);   // o olho do lado da sombra é um degrau abaixo
    const ix = x + (s < 0 ? Math.max(0, ew - 2) : Math.min(1, ew - 1));
    px(x, eyeY, ew, eh, esc);
    if (eh >= 2) {
      px(x, eyeY, ew, 1, ramp(esc, -2));                     // pálpebra superior
      px(ix, eyeY + 1, Math.max(1, Math.min(2, ew - 1)), 1, look.eyes);
    } else {
      // Olho em fenda: a pálpebra é a SOMBRA ACIMA do olho, não tinta POR CIMA
      // dele. Pintar a pálpebra sobre uma fenda de 1 px apagava o olho inteiro
      // e deixava uma barra preta no lugar da cara — era o que fazia elfo,
      // hobgoblin e ogro parecerem cegos.
      px(x, eyeY - 1, ew, 1, ramp(pele, -4));
      px(ix, eyeY, 1, 1, look.eyes);
    }
    if (ew >= 3) px(x + (s < 0 ? 0 : ew - 1), eyeY + eh - 1, 1, 1, ramp(esc, 2));
  };
  if (front) {
    olho(-off - ew + lead, -1);
    olho(off + lead, 1);
  } else {
    olho(r(headW * 0.14) + lead, 1);
  }

  // ---- nariz ---------------------------------------------------------------
  const noseY = eyeY + eh + (rico ? 1 : 0);
  const nw = Math.max(2, r(headW * 0.3 * f.narizW));
  const nx = -Math.floor(nw / 2) + lead;
  const noseTint = look.noseTint ?? null;
  switch (f.nariz) {
    case 'focinho': {
      // Focinho do bugbear: um volume que SAI da cara, não um nariz pintado.
      const fw = Math.max(3, nw);
      volume(nx, noseY, fw, 3, ramp(pele, -1), { topo: 1 });
      px(nx + 1, noseY + 1, 1, 1, ramp(pele, -5));
      px(nx + fw - 2, noseY + 1, 1, 1, ramp(pele, -5));
      if (side) volume(headX + headW, noseY, 3, 3, ramp(pele, -1), { topo: 1 });
      break;
    }
    case 'chata': {
      // Narina larga e achatada do goblinoide: duas asas e nenhum dorso.
      const cor = noseTint ?? ramp(pele, -2);
      px(nx, noseY, nw, 2, cor);
      px(nx, noseY, 1, 2, ramp(cor, 1));
      px(nx + nw - 1, noseY, 1, 2, ramp(cor, -2));
      px(nx, noseY + 1, 1, 1, ramp(cor, -4));
      px(nx + nw - 1, noseY + 1, 1, 1, ramp(cor, -4));
      if (side) px(headX + headW, noseY, 2, 2, cor);
      break;
    }
    case 'bulbosa': {
      // Bola de nariz do anão e do ogro: luz em cima à esquerda, sombra
      // embaixo à direita, e larga o bastante para ler a 55 px.
      const cor = noseTint ?? ramp(pele, 1);
      const bw = Math.max(3, nw);
      coluna(noseY - 1, 4, (t) => ({ c: lead, w: bw - (t < 0.3 ? 2 : t > 0.8 ? 1 : 0) }), cor, { topo: 1 });
      px(lead - Math.floor(bw / 2) + 1, noseY, 1, 1, ramp(cor, 3));
      px(lead - Math.floor(bw / 2), noseY + 2, 1, 1, ramp(cor, -4));
      px(lead + Math.ceil(bw / 2) - 2, noseY + 2, 1, 1, ramp(cor, -4));
      px(lead - 1, noseY + 3, 2, 1, ramp(pele, -3));
      if (side) volume(headX + headW, noseY, 2, 3, cor, { topo: 1 });
      break;
    }
    case 'arrebitada': {
      // Ponta para cima: a sombra fica EMBAIXO da ponta, não ao lado dela.
      px(lead - 1, noseY - 1, 1, 2, ramp(pele, 2));
      px(lead, noseY - 1, 1, 2, ramp(pele, -2));
      px(lead - 1, noseY + 1, 2, 1, ramp(pele, -4));
      break;
    }
    case 'fina': {
      px(lead - 1, noseY - 1, 1, 3, ramp(pele, 2));          // dorso estreito
      px(lead, noseY, 1, 2, ramp(pele, -3));
      if (rico) px(lead - 1, noseY + 2, 1, 1, ramp(pele, -4));
      break;
    }
    default: {
      px(lead - 1, noseY - 1, 1, 3, ramp(pele, 1));          // dorso iluminado
      px(lead, noseY, 1, 2, ramp(pele, -3));                 // lado em sombra
      if (rico) px(lead + 1, noseY + 1, 1, 1, ramp(pele, -4)); // narina do lado da sombra
      break;
    }
  }
  if (rico && f.nariz !== 'bulbosa' && f.nariz !== 'focinho') {
    px(lead - 1, noseY + 2, 1, 1, ramp(pele, -2));           // sombra sob o nariz
  }
  // No perfil, quem projeta avança de verdade: é geometria, não sombreado.
  if (side && f.projeta === 'nariz') px(headX + headW, noseY, 2, 2, ramp(pele, -1));
  if (side && f.projeta === 'arcada') {
    px(headX + headW, eyeY - 2, 2, 2, ramp(pele, -1));
    px(headX + headW, eyeY - 3, 1, 1, ramp(pele, 1));
  }

  // ---- boca ----------------------------------------------------------------
  // Estreita e só um degrau abaixo da maçã do rosto. Larga e escura, somada à
  // sombra do nariz logo acima, as duas liam como um bigode desenhado.
  const larguraBoca = { fina: 0.20, reta: 0.26, larga: 0.34, frouxa: 0.40, presas: 0.34 }[f.boca] ?? 0.26;
  // Três pixels acima do queixo, sempre. Colada no queixo, a boca somava com a
  // sombra da mandíbula e a figura ganhava um bigode que ninguém desenhou.
  const mouthY = Math.max(noseY + 2, Math.min(chin - 3, noseY + (rico ? 3 : 2)));
  const mw = Math.max(2, r(headW * larguraBoca));
  const mx = -Math.floor(mw / 2) + lead;
  if (f.boca === 'frouxa') {
    // Boca de ogro: aberta, lábio de baixo pendendo. É o que diz "burro e
    // perigoso" sem precisar de expressão.
    px(mx, mouthY, mw, 2, ramp(pele, -5));
    px(mx + 1, mouthY + 2, mw - 2, 1, ramp(pele, 1));
    px(mx, mouthY - 1, mw, 1, ramp(pele, -2));
  } else {
    px(mx, mouthY, mw, 1, ramp(pele, -3));
    if (rico) px(mx + 1, mouthY + 1, Math.max(1, mw - 1), 1, ramp(pele, 1)); // lábio de baixo
  }
  if (sp.fangs) {
    px(mx, mouthY + 1, 1, 1, '#ebe3cf');
    px(mx + mw - 1, mouthY + 1, 1, 1, '#ebe3cf');
  }
  if (sp.tusks || f.boca === 'presas') {
    for (const s of [-1, 1]) {
      const x = s < 0 ? mx - 1 : mx + mw;
      px(x, mouthY - 1, 2, 3, '#ebe3cf');
      px(x + (s < 0 ? 0 : 1), mouthY - 2, 1, 1, '#f6f0e2');
      px(x + (s < 0 ? 1 : 0), mouthY, 1, 2, ramp('#ebe3cf', -2));
    }
  }

  // ---- queixo --------------------------------------------------------------
  if (f.queixo === 'largo' && rico) {
    px(lead, chin - 2, 1, 2, ramp(pele, -3));                // covinha
    px(lead - 1, chin - 2, 1, 2, ramp(pele, 1));
  } else if (f.queixo === 'recuado') {
    px(jx + 1, chin - 2, Math.max(1, jawW - afina - 2), 1, ramp(pele, -3)); // o queixo foge
  } else if (f.queixo === 'pontudo' && rico) {
    px(lead - 1, chin - 1, 1, 1, ramp(pele, -4));            // a ponta do queixo
  }

  // ---- variação individual -------------------------------------------------
  drawFacial(kit, look, m, { headX, headW, headTop, eyeY, noseY, mouthY, lead, pele, ew, off, front });

  // ---- barba ---------------------------------------------------------------
  if (look.beard || sp.beardAlways) {
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

/**
 * Variação individual do rosto: `look.facial`, string ou lista.
 *
 * cicatriz · tapaOlho · pinturaGuerra · idoso · narizQuebrado
 *
 * Existe para os NPCs. Um plebeu e outro plebeu com a mesma espécie, a mesma
 * compleição e a mesma pele são o mesmo NPC — e o contrato do elenco diz que o
 * jogador tem de reconhecer cada um na segunda vez que o vê.
 */
function drawFacial({ px, traco, volume }, look, m, { headX, headW, headTop, eyeY, noseY, mouthY, lead, pele, ew, off, front }) {
  const marcas = lista(look.facial);
  if (!marcas.length) return;

  if (marcas.includes('idoso')) {
    px(headX + 1, eyeY + 2, 2, 1, ramp(pele, -3));           // pé de galinha
    px(headX + headW - 3, eyeY + 2, 2, 1, ramp(pele, -4));
    px(headX + 2, headTop + 2, Math.max(1, headW - 4), 1, ramp(pele, -2)); // ruga da testa
    px(lead - 2, mouthY - 1, 1, 2, ramp(pele, -3));          // sulco nasogeniano
    px(lead + 2, mouthY - 1, 1, 2, ramp(pele, -4));
  }

  if (marcas.includes('pinturaGuerra')) {
    const tinta = look.trim ?? ramp(look.outfit, 2);
    px(headX, eyeY - 1, headW, 1, tinta);
    px(headX, eyeY + 2, headW, 1, ramp(tinta, -2));
    if (front) px(lead - 1, headTop + 1, 2, eyeY - headTop - 1, ramp(tinta, -1));
  }

  if (marcas.includes('narizQuebrado')) {
    px(lead, noseY - 1, 1, 1, ramp(pele, -4));               // dorso torto
    px(lead - 2, noseY, 1, 1, ramp(pele, 2));
  }

  if (marcas.includes('cicatriz')) {
    // Diagonal clara atravessando a face esquerda: `traco` porque uma cicatriz
    // em escada de retângulos lê como sujeira de compressão.
    traco(headX + 1, eyeY - 2, headX + Math.max(2, r(headW * 0.4)), mouthY, 1, ramp(pele, 3));
    px(headX + 1, eyeY - 1, 1, 1, ramp(pele, -2));
  }

  if (marcas.includes('tapaOlho')) {
    const couro = ramp(look.leather ?? '#3a2b1e', -1);
    const ex = front ? -off - ew + lead - 1 : r(headW * 0.14) + lead - 1;
    volume(ex, eyeY - 1, ew + 2, 4, couro, { topo: 1 });
    px(headX, eyeY - 2, headW, 1, ramp(couro, -2));          // correia na cabeça
    px(headX, eyeY - 2, 1, 1, ramp(couro, 1));
  }
}

function drawCrown({ px, cut, volume, contato }, look, m, { headX, headW, headTop, crown, front, side, lead }) {
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
      // Espetos de alturas diferentes. Todos iguais, de dois em dois pixels,
      // leem como pente de plástico — era o mesmo "pente" no hobgoblin, no orc
      // e no bugbear, e por isso os três tinham a mesma cabeça de longe.
      for (let i = 0; i < headW - 1; i += 2) {
        const alt = 2 + ((i / 2) % 3 === 1 ? 1 : 0);
        const claro = (i / 2) % 2 === 0;
        px(headX + i, crown - alt + 1, 2, alt, claro ? ramp(hair, 1) : ramp(hair, -2));
        px(headX + i, crown - alt, 1, 1, claro ? ramp(hair, 2) : hair);
      }
      contato(headX + 1, crown + hairH + 1, headW - 2, hair);
      break;
    default:
      volume(headX, crown, headW, hairH + 2, hair, { topo: 1 });
      // Canto arredondado: o retângulo cheio em cima da cabeça lia como boina
      // de feltro. Nada é desenhado acima do cabelo, então cortar é seguro.
      cut(headX, crown, 1, 1);
      cut(headX + headW - 1, crown, 1, 1);
      px(headX - 1, crown + 2, 1, hairH + 1, ramp(hair, -1));
      px(headX + headW, crown + 2, 1, hairH + 1, ramp(hair, -2));
      // Mecha a cada 4 px e só meia altura: a listra inteira a cada 3 px
      // transformava o cabelo num código de barras.
      for (let c = 2; c < headW - 1; c += 4) px(headX + c, crown + 1, 1, hairH, ramp(hair, -2));
      for (let c = 4; c < headW - 1; c += 4) px(headX + c, crown + 1, 1, Math.max(1, hairH - 1), ramp(hair, 2));
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
 * MARCAS — a marca registrada de silhueta.
 *
 * `look.marca` aceita uma string ou uma lista. Cada marca é um elemento que
 * INVADE O CONTORNO: pintada de preto, a figura continua identificável. É a
 * resposta ao defeito mais caro do elenco — a 55 px no tabuleiro só a silhueta
 * chega ao jogador, e quatro humanoides de ombro reto são a mesma mancha.
 *
 *   chapeuPontudo  cone alto com aba — mago, bruxa, charlatão
 *   cimeira        crista alta de frente para trás — oficial, cavaleiro
 *   corcunda       bossa no alto das costas — goblin, aberração, velho
 *   manto          pano esvoaçando para um lado — nobre, espião, drow
 *   ombreira       uma ombreira enorme, só de um lado — capitão, chefe
 *   capuz          capuz de ponta caída atrás — ladino, acólito, assassino
 *   trancas        tranças ou rabo caindo abaixo do ombro — bárbaro, orc
 *   mochila        fardo nas costas com rolo acima do ombro — batedor, plebeu
 *
 * `camada` é 'atras' (antes do tronco) ou 'frente' (depois da cabeça).
 */
function drawMarca({ px, volume, contato, coluna, traco }, look, m, c, camada) {
  const marcas = lista(look.marca);
  if (!marcas.length) return;
  const { shoulderX, shoulder, torsoTop, crown, headX, headW, headTop, chin, side, back, front, lead, desvio, cintura, pose } = c;
  const sopro = pose.kind === 'idle' && pose.frame === 1 ? 1 : 0;

  if (camada === 'atras') {
    if (marcas.includes('corcunda')) {
      // Bossa no alto das costas, mais alta que o ombro. Na vista de frente ela
      // aparece como um ombro assimétrico; de lado e de costas é uma cúpula.
      const cor = look.armorStyle === 'leather' ? look.leather : look.outfitDark;
      const bw = Math.max(6, r(shoulder * (back ? 0.78 : 0.56)));
      const bh = Math.max(5, r(m.torsoH * 0.46));
      const bx = back ? -Math.floor(bw / 2) + desvio : side ? shoulderX - 2 : shoulderX - 3;
      // A bossa tem de CRISTAR acima da linha do ombro: encaixada entre os
      // ombros, o tronco a cobria e de frente não sobrava nada do corcunda.
      coluna(torsoTop - bh + 1, bh, (t) => ({
        c: bx + Math.floor(bw / 2),
        w: bw * (0.5 + 0.5 * Math.sin(Math.PI * (0.22 + t * 0.78))),
      }), cor, { topo: 1 });
      for (let i = 1; i < bh - 1; i += 2) px(bx + 1, torsoTop - bh + 1 + i, 1, 1, ramp(cor, 2));
      contato(bx + 1, torsoTop + 1, bw - 2, cor);
    }

    if (marcas.includes('mochila')) {
      // Fardo com rolo de dormir: o rolo é o que invade o contorno acima do
      // ombro, e é por ele que a figura se reconhece de longe.
      const couro = look.leather;
      const bw = Math.max(6, r(shoulder * (back ? 0.78 : side ? 0.5 : 0.34)));
      const bh = Math.max(7, r(m.torsoH * 0.6));
      const bx = back ? -Math.floor(bw / 2) + desvio : side ? shoulderX - bw + 2 : shoulderX - bw + 1;
      volume(bx, torsoTop + 2, bw, bh, couro, { topo: 1 });
      px(bx + 1, torsoTop + 2 + r(bh * 0.5), bw - 2, 1, ramp(couro, -4));
      contato(bx, torsoTop + 2 + bh, bw, couro);
      // rolo acima do ombro
      const rw = bw + 2;
      const ry = torsoTop - 2;
      volume(bx - 1, ry, rw, 3, ramp(couro, 2), { topo: 1 });
      for (let i = 1; i < rw; i += 3) px(bx - 1 + i, ry, 1, 3, ramp(couro, -1));
      px(bx - 1, ry + 2, rw, 1, ramp(couro, -4));
    }

    if (marcas.includes('manto')) {
      // Pano esvoaçando para um lado só. A assimetria é o ponto: um manto
      // simétrico é uma capa, e capa já existe em `look.cloak`.
      const pano = look.cloak ?? look.outfitDark;
      const alto = torsoTop + 1;
      const base = cintura + r(m.legH * 0.5);
      const alc = Math.max(5, r(m.shoulderW * 0.75)) + sopro;
      const lado = back ? 1 : -1;
      for (let y = alto; y < base; y++) {
        const t = (y - alto) / Math.max(1, base - alto - 1);
        const ext = r(alc * Math.pow(t, 1.4));
        if (ext <= 0) continue;
        const x0 = lado < 0 ? shoulderX - ext : shoulderX + shoulder;
        px(x0, y, ext, 1, t > 0.75 ? ramp(pano, -2) : pano);
        px(lado < 0 ? x0 : x0 + ext - 1, y, 1, 1, ramp(pano, -3));
        if (ext >= 4) px(lado < 0 ? x0 + 1 : x0 + ext - 2, y, 1, 1, ramp(pano, 2));
      }
      px(shoulderX - (lado < 0 ? 1 : 0), alto, shoulder + 1, 1, ramp(pano, 1));
    }

    if (marcas.includes('trancas')) {
      // Duas tranças caindo ABAIXO do ombro: medem o dobro do cabelo solto e
      // quebram a linha reta do ombro nas três vistas.
      const hair = apart(look.hair ?? '#3a2c22', look.skin, 0.1);
      const queda = Math.max(6, r(m.headH * 1.4));
      const lados = side ? [-1] : [-1, 1];
      for (const s of lados) {
        const x = s < 0 ? headX - 1 : headX + headW - 1;
        coluna(headTop + 2, queda, (t) => ({
          c: x + 1 + s * r(2 * t) + (t > 0.7 ? s * sopro : 0),
          w: 3 - (t > 0.6 ? 1 : 0),
        }), s < 0 ? hair : ramp(hair, -1), { topo: 0 });
        // amarração na ponta
        px(x + s * 2 - 1, headTop + 2 + queda, 3, 2, look.trim ?? ramp(hair, -3));
      }
    }
  }

  if (camada === 'frente') {
    if (marcas.includes('capuz')) {
      // Capuz com ponta caída para trás. Diferente de `hairStyle: 'hood'`, que
      // é só uma touca: aqui a ponta sai da cabeça e marca o contorno.
      const cap = look.cloak ?? look.outfitDark;
      // Até a testa e nem um pixel mais: com 80% da cabeça o capuz engolia os
      // olhos, e uma figura sem olhar não é um ladino, é um poste.
      const hh = Math.max(4, m.hairH + r(m.headH * 0.3));
      volume(headX - 2, crown - 1, headW + 4, hh, cap, { topo: 1 });
      px(headX - 1, crown - 2, headW + 2, 1, ramp(cap, 2));
      px(headX - 2, crown - 1 + hh - 1, headW + 4, 1, ramp(cap, -4));
      // ombro do capuz caindo sobre as costas
      volume(shoulderX - 1, chin, shoulder + 2, Math.max(3, r(m.torsoH * 0.3)), ramp(cap, -1), { topo: 1 });
      // a ponta, atrás
      const pLado = back || front ? 1 : -1;
      const px0 = pLado < 0 ? headX - 3 : headX + headW;
      for (let i = 0; i < Math.max(4, r(m.headH * 0.7)); i++) {
        px(px0 + pLado * r(i * 0.5), crown + 1 + i, 3 - r(i * 0.2), 1, ramp(cap, i > 3 ? -3 : -1));
      }
      if (!back) {
        // a sombra do capuz cai sobre a testa: é ela que faz o rosto "sumir"
        px(headX, headTop, headW, 2, ramp(cap, -5));
      }
    }

    if (marcas.includes('chapeuPontudo')) {
      // Cone alto com a ponta tombada e aba larga. Nenhuma outra figura do
      // elenco tem um triângulo acima da cabeça.
      const pano = look.cloak ?? look.outfit;
      const abaW = headW + Math.max(5, r(headW * 0.6));
      const abaX = -Math.floor(abaW / 2) + lead;
      const topo = Math.max(crown - Math.max(9, r(m.headH * 1.25)), TETO);
      const alt = crown - topo;
      const tomba = r(alt * 0.22) + sopro;
      coluna(topo, alt, (t) => ({
        c: lead + r(tomba * (1 - t)),
        w: 1 + (headW + 1) * Math.pow(t, 1.25),
      }), pano, { topo: 1 });
      volume(abaX, crown - 1, abaW, 2, ramp(pano, -1), { topo: 1 });
      px(abaX + 1, crown + 1, abaW - 2, 1, ramp(pano, -4));
      contato(abaX + 2, crown + 1, abaW - 4, pano);
      // fita e fivela na base do cone
      px(abaX + 3, crown - 3, abaW - 6, 2, ramp(look.trim ?? pano, -1));
      px(lead - 1, crown - 3, 2, 2, look.trim ?? ramp(pano, 2));
    }

    if (marcas.includes('cimeira')) {
      // Crista de frente para trás no alto do elmo. De frente é uma lâmina
      // estreita; de lado é uma meia-lua alta — e nas duas ela some do resto
      // do elenco.
      const met = look.trim ?? look.metal;
      const alt = Math.max(3, Math.min(r(m.headH * 0.65), crown - TETO));
      if (side) {
        const cw = headW + 2;
        for (let i = 0; i < cw; i++) {
          const t = i / Math.max(1, cw - 1);
          const hAlt = r(alt * Math.sin(Math.PI * (0.18 + t * 0.64)));
          if (hAlt <= 0) continue;
          px(headX - 1 + i, crown - hAlt, 1, hAlt + 1, i < 2 ? ramp(met, 2) : i > cw - 3 ? ramp(met, -2) : met);
          px(headX - 1 + i, crown - hAlt, 1, 1, ramp(met, 3));
        }
      } else {
        coluna(crown - alt, alt + 1, (t) => ({ c: lead, w: 2 + 2 * t }), met, { topo: 1 });
        px(lead - 1, crown - alt, 1, alt, ramp(met, 3));
        px(lead + 1, crown - alt + 1, 1, alt - 1, ramp(met, -3));
      }
      contato(lead - 2, crown, 4, met);
    }

    if (marcas.includes('ombreira')) {
      // UMA ombreira, de um lado só. A assimetria é o que identifica: as
      // ombreiras de `armorStyle: 'plate'` são duas e simétricas, e duas
      // ombreiras leem como armadura, não como figura.
      const met = look.metal;
      const ow = Math.max(5, r(shoulder * 0.34));
      const oh = Math.max(5, r(m.torsoH * 0.42));
      const ox = back ? shoulderX : side ? shoulderX - 1 : shoulderX + shoulder - ow;
      coluna(torsoTop - 1, oh, (t) => ({
        c: ox + Math.floor(ow / 2),
        w: ow * (0.62 + 0.38 * Math.sin(Math.PI * (0.2 + t * 0.6))),
      }), met, { topo: 1 });
      // espigões: é o que faz a ombreira passar do contorno
      for (let i = 1; i < ow - 1; i += 3) {
        px(ox + i, torsoTop - 3, 2, 2, ramp(met, 2));
        px(ox + i, torsoTop - 4, 1, 1, ramp(met, 3));
      }
      contato(ox + 1, torsoTop - 1 + oh, ow - 2, met);
    }
  }
}

/**
 * A arma, desenhada A PARTIR da empunhadura.
 *
 * `gripX/gripY` são os pixels onde a mão fecha — vêm do braço, não de uma
 * posição inventada. O cabo atravessa esse ponto e a mão é repintada por cima
 * depois, então a figura segura a arma em vez de carregá-la ao lado.
 *
 * `apoio` vem da postura: lado (pendurada), ombro (apoiada no ombro), cravada
 * (ponta no chão à frente), vertical (cajado em pé), baixa (junto do corpo).
 */
function drawWeapon({ px, volume, contato, coluna }, look, m, { gripX, gripY, armW, attack, frame, apoio = 'lado', crown = m.crown, lead = 0 }) {
  const metal = look.metal;
  const wood = look.leather;
  const trim = look.trim ?? wood;

  const s = Math.max(0.75, Math.min(1.5, m.h));
  const L = (v) => Math.max(2, r(v * s));
  const T = Math.max(2, r(2.4 * s));
  const x = gripX + Math.floor((armW - T) / 2);
  // Apoiada no ombro, a lâmina se deita para fora; no golpe, ela corta à
  // frente. Parada e reta para o alto é pose de desfile, não de combate.
  // A inclinação da arma apoiada é contida de propósito: com T+3 o fio da
  // espada de um hobgoblin de ombro largo saía pela lateral da célula, e o
  // contorno automático cortava junto.
  const tilt = attack ? (frame === 1 ? T + 2 : T) : apoio === 'ombro' ? T : 0;

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

  // O cabo desce A PARTIR da mão, e a mão de quem tem braço de bugbear chega
  // perto do chão: sem teto, o cabo da maça entrava dois dedos no piso.
  const cabo = (len = 6, cor = wood) => {
    const alt = Math.max(3, Math.min(len, -2 - (gripY - 1)));
    volume(x, gripY - 1, T, alt, cor, { topo: 1 });
    for (let i = 1; i < alt; i += 2) px(x, gripY - 1 + i, T, 1, ramp(cor, -2));
  };

  /** Haste em pé com a ponta no chão: cajado, lança, bordão de druida. */
  const emPe = () => {
    // Espaço reservado acima: o orbe do cajado mede L(6) e a ponta de lança
    // mede L(9). Reservar só o orbe decapitava a lança na folha.
    const teto = -(UTIL - 2) + L(10);
    const alto = Math.max(crown - Math.max(4, r(m.headH * 0.55)), teto);
    const base = -1;
    volume(x, alto, T, base - alto, wood, { topo: 1 });
    for (let i = 4; i < base - alto; i += 7) px(x, alto + i, T, 1, ramp(wood, -2));
    px(x, base - 1, T, 1, ramp(wood, -4));
    contato(x - 1, base, T + 2, wood);
    if (look.weapon === 'staff') {
      const orb = look.glow ?? metal;
      volume(x - 2, alto - L(5), T + 4, L(6), orb, { topo: 1 });
      px(x - 1, alto - L(6), T + 2, 1, ramp(orb, 3));
      px(x - 1, alto - L(4), 2, 2, '#ffffff');
      px(x - 2, alto, T + 4, 1, ramp(orb, -3));
    } else {
      haste(x, alto, L(9), T, metal, 0);                     // ponta de metal
    }
  };

  /**
   * Cravada à frente: a arma vira uma BARRA VERTICAL do ombro ao chão. É a
   * marca da silhueta do guerreiro parado, e o que mais muda o contorno de
   * todas as poses de descanso.
   */
  const cravar = () => {
    const base = -2;
    switch (look.weapon) {
      case 'sword':
      case 'dagger': {
        volume(x, gripY - 4, T, 5, wood, { topo: 1 });        // cabo acima da mão
        volume(x - 1, gripY - 6, T + 2, 2, trim, { topo: 1 }); // pomo
        px(x - 2, gripY + 2, T + 4, 1, ramp(trim, 2));        // guarda sob a mão
        px(x - 2, gripY + 3, T + 4, 1, ramp(trim, -2));
        const len = base - (gripY + 4);
        if (len > 2) {
          px(x - 1, gripY + 4, T + 2, len, ramp(metal, -5));
          px(x, gripY + 4, T, len, metal);
          px(x, gripY + 4, 1, len, ramp(metal, 3));
          px(x, base - 1, T, 1, ramp(metal, -3));             // ponta no chão
        }
        contato(x - 1, base, T + 2, metal);
        break;
      }
      case 'axe':
      case 'mace': {
        const len = base - (gripY - 1);
        volume(x, gripY - 1, T, Math.max(4, len), wood, { topo: 1 });
        for (let i = 2; i < len; i += 5) px(x, gripY - 1 + i, T, 1, ramp(wood, -2));
        contato(x - 1, base, T + 2, wood);
        const hy = gripY - 2 - L(7);
        volume(x, hy, T, L(7), wood, { topo: 1 });
        if (look.weapon === 'axe') {
          volume(x + T, hy, T + 3, L(8), metal, { topo: 1 });
          px(x + T, hy + 1, 1, L(6), ramp(metal, -4));
          px(x + T + 2, hy + 1, T, L(6), ramp(metal, 2));
        } else {
          volume(x - 2, hy - L(5), T + 4, L(6), metal, { topo: 1 });
          px(x - 1, hy - L(6), T + 2, 1, ramp(metal, 3));
        }
        break;
      }
      default:
        emPe();
        break;
    }
  };

  if (apoio === 'cravada') return cravar();
  if (apoio === 'vertical') return emPe();

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
      if (apoio === 'ombro') volume(x + 1, gripY - 2 - L(17), T, L(17), wood, { topo: 1 });
      volume(x + T, hy, T + 3, L(8), metal, { topo: 1 });
      px(x + T, hy + 1, 1, L(6), ramp(metal, -4));
      px(x + T + 2, hy + 1, T, L(6), ramp(metal, 2));
      px(x - 1, hy + 1, 1, L(5), ramp(metal, -1));
      break;
    }
    case 'mace': {
      cabo(L(15) + 4);
      volume(x, gripY - 2 - L(15), T, L(15), wood, { topo: 1 });
      const hy = gripY - 2 - L(15) - L(6) + r(tilt * 0.3);
      volume(x - 2, hy, T + 4, L(6), metal, { topo: 1 });
      px(x - 3, hy + 1, 1, L(4), ramp(metal, -1));
      px(x + T + 2, hy + 1, 1, L(4), ramp(metal, -2));
      px(x - 1, hy + 1, 1, 1, ramp(metal, 3));
      break;
    }
    case 'staff':
      emPe();
      break;
    case 'bow': {
      // A braçadeira de baixo para no chão. Quem tem braço longo segura o arco
      // mais embaixo, e a ponta de baixo furava o piso.
      const meia = L(16);
      const baixo = Math.max(3, Math.min(meia, -4 - (gripY + 4)));
      volume(x, gripY - 1, T, 5, wood, { topo: 1 });
      volume(x, gripY - 1 - meia, T, meia, wood, { topo: 1 });
      volume(x, gripY + 4, T, baixo, wood, { topo: 0 });
      px(x - 1, gripY - 1 - meia, T, 2, ramp(wood, 1));
      px(x - 1, gripY + 2 + baixo, T, 2, ramp(wood, -2));
      px(x + T, gripY - meia, 1, meia + baixo + 4, '#e2dac6');
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
