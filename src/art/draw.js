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
 *   (arma)    lado | ombro | cravada | vertical | baixa | erguida
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
 *   arma      lado | ombro | cravada | vertical | baixa | erguida
 *             (`look.armaApoio` sobrescreve, para quem quer a postura da
 *              espécie mas segura a arma de outro jeito)
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

  // Bloco baixo e torcido de joelhos dobrados, com uma placa adiantada
  // cobrindo metade da figura e a arma saindo baixa do outro lado.
  //
  // É a postura do soldado que ESPERA A CARGA, e o oposto de `militar`: lá a
  // figura se põe em pé para ser vista, aqui ela se encolhe atrás do escudo.
  // O agachamento também devolve altura à célula — quem precisa de 64 px de
  // corpo e estava gastando 73 de contorno conserta a escala aqui.
  combate: {
    agacha: 4, lean: 2, peito: 1, passo: 5, pernaFrente: 2, cabeca: 1,
    bracoFora: 2, arma: 'baixa', escudoAdiante: 3, estreita: 3, apoio: 1,
  },

  // Massa oval pendendo à frente sobre pernas curtas, cabeça abaixo da linha
  // dos ombros e mãos à altura do joelho.
  //
  // Nenhum outro arquétipo inclina tanto: somado à corcunda da espécie dá 7
  // px de peito à frente do pé, contra 5 do goblin. É a leitura do ogro, e é
  // o que o separa de `bruto` (orc, rufião), que também tem ombro caído mas
  // fica de pé.
  //
  // `lean` é deslocamento REAL em x na vista de lado, e na vista de lado ele
  // empurra o ombro — e com ele o braço — para fora da célula. Com lean 7
  // mais corcunda 5, o braço do ogro saía pela lateral. Quem mexer nisto
  // mede de novo: o teto é `lean + hunch + bracoFora + armW <= 22`.
  barrigudo: {
    agacha: 2, lean: 5, ombroCai: 3, passo: 3, pernaFrente: 1, cabeca: 8,
    bracoFora: 4, bracoExtra: 10, arma: 'baixa', estreita: 2, apoio: 1,
  },

  // Passada aberta com um braço esticado para cima e uma haste acima da
  // cabeça, mais alta que qualquer outra coisa do contorno.
  conjurador: {
    agacha: 1, lean: 1, passo: 4, pernaFrente: 3, bracoFora: 1,
    arma: 'erguida', estreita: 2, apoio: 1,
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
  // `look.armaApoio` deixa um look manter a postura da espécie e mudar só a
  // mão da arma: o bugbear continua curvado como todo bugbear, mas com a
  // clava ERGUIDA acima da cabeça em vez de pendurada ao lado.
  const apoio = attack ? 'lado' : (look.armaApoio ?? st.arma);

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
  // `look.sleeve` é a cor do braço. Por padrão ela segue a roupa, o que está
  // certo para quem veste manga — e errado para quem não veste nada: o ogro
  // nu saía com braço da cor exata da barriga e PERDIA OS BRAÇOS, porque a
  // única coisa que separava um do outro era a sombra de contato.
  const sleeve = look.sleeve ?? (look.armorStyle === 'plate' ? look.metal : look.outfit);
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
    case 'erguida':
      // A mão sobe ACIMA DO CRÂNIO e a arma sobe junto. É o que faz a clava do
      // bugbear e o cajado de Nezznar existirem no contorno: parada ao lado do
      // corpo, uma clava de espigões é só mais um retângulo colado no quadril.
      gripY = Math.max(TETO + r(m.headH * 1.2), crown - Math.max(3, r(m.headH * 0.5)));
      gripX = nearX + (side ? -1 : 2);
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
    if (m.sp.fur) {
      // O mesmo tufo das pernas: o braço de uma criatura peluda também tem de
      // ter a borda rasgada, senão o pelo fica só no tronco e a figura vira
      // "bicho de colete".
      for (let i = 2; i < alt - 2; i += 3) {
        const t = i / Math.max(1, alt - 1);
        const ex = Math.round(cxc + fora * t);
        const lw = Math.round(m.armW - afinaBraco * t);
        px(ex - Math.floor(lw / 2) - 1, y + i, 1, 2, ramp(cor, 1));
        px(ex + Math.ceil(lw / 2), y + i + 1, 1, 2, ramp(cor, -2));
      }
    }
    if (look.faixas) {
      const pano = ramp(look.leather, 2);
      for (let i = 0; i < 2; i++) {
        const t = 0.6 + i * 0.17;
        const ex = Math.round(cxc + fora * t);
        px(ex - Math.floor(m.armW / 2) - 1, y + r(alt * t), m.armW + 2, 2, i ? ramp(pano, -1) : pano);
        px(ex - Math.floor(m.armW / 2) - 1, y + r(alt * t) + 1, m.armW + 2, 1, ramp(pano, -3));
      }
    }
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
    if (look.garras) {
      // Unhas grossas e escuras na ponta dos dedos. Numa mão de 5 px é o
      // único detalhe que cabe, e é o que diz que a mão AGARRA — sem elas a
      // mão de um ogro ou de um bugbear é um bloco de pele.
      for (let i = 0; i < m.armW; i += 2) px(x + i, y + 3, 1, 1, look.unha ?? '#2e261f');
    }
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
    const altFar = Math.max(4, Math.min(armH, m.footTop - 4 - armY));
    bracoReto(farX, armY, altFar, ramp(sleeve, -2), -st.bracoFora);
    const maoX = farX - Math.max(0, st.bracoFora);
    if (look.manopla) {
      // Manopla rebitada no braço que NÃO segura a arma. A assimetria é
      // deliberada e é metade da silhueta do bugbear: ombreira espigada num
      // ombro, manopla no outro braço. Equipamento assimétrico lê como saque
      // de bandido; dois iguais leem como armadura de soldado.
      const cou = look.leather;
      const mh = Math.max(5, r(altFar * 0.45));
      const my = armY + altFar - mh;
      volume(maoX - 1, my, m.armW + 2, mh + 2, cou, { topo: 1 });
      for (let i = 1; i < mh; i += 2) px(maoX, my + i, 1, 1, ramp(cou, 3));
      // O espigão do punho é clampado à célula: num Rei Grol de ombro de 28
      // px a manopla já nasce na borda, e o espigão saía fora — o contorno
      // automático varre o alfa e some junto com o que foi cortado.
      const esp = Math.max(-(META - 3), maoX - 3);
      px(esp, my + mh - 3, 3, 2, ramp(cou, 1));               // espigão no punho
      px(Math.max(-(META - 2), esp - 1), my + mh - 3, 1, 1, ramp(cou, 2));
      contato(maoX - 1, my + mh + 2, m.armW + 2, cou);
    }
    mao(maoX, armY + altFar);
  }

  // Reto quando a mão cai embaixo do ombro; dobrado quando a postura a levou
  // para outro lugar.
  const retoNear = Math.abs(gripX - nearX) <= 1 && gripY >= nearY + r(armH * 0.8);
  if (apoio === 'erguida') {
    // Braço esticado para cima: uma diagonal só, do ombro à mão. O cotovelo
    // de `bracoDobrado` desce antes de subir, e num braço erguido isso dá uma
    // dobra ao contrário — o ombro parecia deslocado.
    membro(nearX, nearY, gripX, gripY, m.armW, ramp(sleeve, -1));
  } else if (retoNear) bracoReto(nearX, nearY, Math.max(4, gripY - nearY), ramp(sleeve, -1), st.bracoFora);
  else bracoDobrado(nearX, nearY, gripX, gripY, ramp(sleeve, -1), Math.max(1, st.bracoFora));

  // De costas a arma fica escondida atrás do corpo — menos quando está
  // ERGUIDA: aí ela passa acima da cabeça e é a assinatura da figura. Sem
  // esta exceção o Nezznar de costas é um toco de braço apontando para o
  // nada, e o cajado com a aranha, que é o apelido dele, some.
  if (!back || apoio === 'erguida') arma();
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
  const peludo = !!m.sp.fur;
  // Criatura coberta de pelo não calça bota, e quem anda de trapo também não.
  // Bota em cima de uma perna peluda é exatamente o detalhe que faz o bugbear
  // ler como humano fantasiado de bicho.
  const descalco = peludo || !!look.descalco;
  const bota = descalco ? cor : m.sp.bigFeet ? look.skin : look.leather;
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
    // Onde a perna está, a cada altura: tufo de pelo e faixa de pano precisam
    // acompanhar a perna que abre e o joelho que dobra, senão ficam flutuando.
    const eixo = (t) => Math.round(anca + lado * aberto * t + curva(t));
    if (peludo) {
      // Tufos saindo das DUAS bordas. O contorno automático segue cada tufo, e
      // é só assim que "peludo" chega ao jogador a 45 px: pelo pintado dentro
      // da silhueta some, pelo que quebra a borda não.
      for (let i = 2; i < hh - 2; i += 3) {
        const t = i / Math.max(1, hh - 1);
        const ex = eixo(t);
        const lw = Math.round(larg(t));
        px(ex - Math.floor(lw / 2) - 1, y + atraso + i, 1, 2, ramp(c, 1));
        px(ex + Math.ceil(lw / 2), y + atraso + i + 1, 1, 2, ramp(c, -2));
      }
    }
    if (look.faixas) {
      // Tiras de pano enroladas na canela, em alturas desiguais. É o que o
      // ogro esfarrapado tem no lugar de bota, e dá à perna nua uma junta.
      const pano = ramp(look.leather, 2);
      for (let i = 0; i < 3; i++) {
        const t = 0.58 + i * 0.14;
        const ex = eixo(t);
        const lw = Math.round(larg(t)) + 1;
        px(ex - Math.floor(lw / 2), y + atraso + r(hh * t), lw, 2, i % 2 ? ramp(pano, -1) : pano);
        px(ex - Math.floor(lw / 2), y + atraso + r(hh * t) + 1, lw, 1, ramp(pano, -3));
      }
    }
    const pe = Math.round(anca + lado * aberto);
    px(pe - Math.floor(larg(1) / 2), y + atraso + r(hh * 0.5), Math.max(1, r(larg(1)) - 1), 1, ramp(c, 1));
    contato(pe - Math.floor(m.legW / 2), m.footTop - 1, m.legW, c);
    const pw = m.footW + (st.calcanhares ? 1 : 0);
    const bx = pe - Math.floor(pw / 2) + (st.calcanhares ? lado : 0);
    const b = tom ? ramp(bota, tom) : bota;
    volume(bx, m.footTop, pw, m.feetH, b, { topo: 1 });
    px(bx, m.footTop + m.feetH - 1, pw, 1, ramp(b, -4));
    if (m.feetH >= 4) px(bx, m.footTop + 1, pw, 1, ramp(b, 1));
    if (descalco) {
      // Dedos separados e garras de osso na ponta: é o que transforma o bloco
      // do pé numa pata. A garra é o único ponto claro lá embaixo, e serve de
      // âncora para o olho encontrar a base da figura.
      for (let g = 1; g < pw - 1; g += 2) {
        px(bx + g, m.footTop + 1, 1, m.feetH - 2, ramp(b, -3));
        px(bx + g, m.footTop + m.feetH - 1, 1, 1, '#e4d8bc');
      }
    }
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
    // A barriga PENDE. A versão anterior só alargava a coluna do tronco para
    // baixo, o que engrossa a figura inteira e lê como "ombro largo", não como
    // pança: um ogro assim era um trapézio um pouco mais gordo.
    //
    // Agora ela é uma massa própria, que nasce no meio do tronco, é mais larga
    // que o peito, tem o maior diâmetro ABAIXO da cintura e desce um pouco
    // além dela. A curva de seno é o que a faz pender em vez de encaixar.
    const by = torsoTop + r(h * 0.34);
    const bh = Math.max(6, bottom + r(m.belly * 0.42) - by);
    const bw = larguraEm(tDe(by)) + m.belly;
    // Ela pende para o LADO PARA ONDE O TRONCO SE INCLINA: um ogro curvado com
    // a barriga centrada no quadril parecia equilibrar um barril.
    const caiPara = r(desvio * 0.45);
    coluna(by, bh, (t) => ({
      c: dx(by + t * (bh - 1)) + r(caiPara * t),
      w: bw * (0.56 + 0.44 * Math.sin(Math.PI * (0.16 + t * 0.72))),
    }), look.outfit, { topo: 1 });
    // Vinco sob a curva: a sombra onde a pança encosta no resto do corpo. Sem
    // ela a barriga lê como um escudo redondo amarrado na frente.
    const vy = by + r(bh * 0.72);
    const vw = Math.max(3, r(bw * 0.62));
    px(-Math.floor(vw / 2) + dx(vy) + caiPara, vy, vw, 1, ramp(look.outfit, -3));
    px(-Math.floor(vw / 2) + dx(vy) + caiPara + 1, by + r(bh * 0.3), Math.max(2, r(vw * 0.5)), 1, ramp(look.outfit, 2));
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

function drawShield({ px, volume, contato, coluna }, look, m, { shoulderX, shoulder, torsoTop, side, back, adiante, cintura }) {
  const campo = look.trim ?? ramp(look.metal, -2);
  const aro = look.metal;
  // `shieldStyle: 'torre'` é outro objeto, não um escudo maior: uma placa
  // angulosa que vai do ombro ao joelho e come METADE da figura. Quando ele
  // existe, é ele a silhueta — e é por isso que o dono dele não precisa de
  // mais nenhuma marca alta.
  const torre = look.shieldStyle === 'torre';
  // Escudo adiantado cobre o tronco: é a silhueta do clérigo, um retângulo
  // largo e alto onde os outros têm cintura.
  const sw = torre
    ? Math.max(12, r(m.shoulderW * 0.78))
    : Math.max(6, r(m.shoulderW * (adiante ? 0.52 : 0.36)));
  const sh = torre
    ? Math.max(20, r((m.torsoH + m.legH) * 0.76))
    : Math.max(11, r(m.torsoH * (adiante ? 1.15 : 1.0)));
  // A torre começa ABAIXO da linha do ombro: encostada no alto, ela comia o
  // ombro e o pescoço e a figura virava um escudo com uma cabeça em cima.
  const sy = torsoTop + (torre ? 3 : 2);
  const sx = side
    ? shoulderX - (torre ? r(sw * 0.5) : 2) + adiante
    : back ? shoulderX + shoulder - (torre ? r(sw * 0.4) : 1) : shoulderX - sw + 3 + adiante * 2;

  if (torre) {
    // Placa angulosa: larga no alto, bico embaixo, com uma QUILHA central de
    // reforço. Os dois ombros do escudo são cortados em diagonal — um
    // retângulo inteiro lia como porta, não como escudo de guerra.
    const forma = (t) => ({
      c: sx + Math.floor(sw / 2),
      w: t < 0.1 ? sw - 4 + 40 * t : t < 0.68 ? sw : sw * (1 - (t - 0.68) * 1.35),
    });
    coluna(sy, sh, forma, campo, { topo: 1 });
    // quilha: duas colunas no meio, uma de luz e uma de sombra
    const qx = sx + Math.floor(sw / 2);
    px(qx - 1, sy + 1, 1, sh - 3, ramp(campo, 3));
    px(qx, sy + 1, 1, sh - 3, ramp(campo, -2));
    // reforços horizontais em aço, que é o que dá as placas sobrepostas
    for (let i = 1; i < 4; i++) {
      const y = sy + r(sh * (0.18 * i + 0.1));
      const lw = Math.round(forma((y - sy) / (sh - 1)).w);
      px(qx - Math.floor(lw / 2) + 1, y, lw - 2, 1, ramp(aro, 1));
      px(qx - Math.floor(lw / 2) + 1, y + 1, lw - 2, 1, ramp(aro, -3));
    }
    // aro externo e espigões no canto de fora, apontando para trás
    px(sx + 1, sy, sw - 2, 1, ramp(aro, 2));
    px(sx, sy + 2, 1, r(sh * 0.66), ramp(aro, 1));
    px(sx + sw - 1, sy + 2, 1, r(sh * 0.66), ramp(aro, -3));
    for (let i = 0; i < 3; i++) {
      const y = sy + 1 + i * r(sh * 0.2);
      px(sx - 2, y, 2, 2, ramp(aro, 1));
      px(sx - 3, y, 1, 1, ramp(aro, 2));
    }
    contato(sx + 2, sy + sh, Math.max(2, sw - 6), campo);
    return;
  }

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
  } else if (sp.ear === 'tufo') {
    // Orelha de lince: alta, pontuda, e com um TUFO DE PELO saindo da ponta.
    // É o detalhe mais barato do bugbear e o mais útil — sai do contorno, e
    // pintado de preto é o que separa a cabeça dele da do orc e da do urso.
    const pelo = look.hair ?? ramp(pele, -2);
    const len = Math.max(3, r(headW * 0.26));
    for (const s of [-1, 1]) {
      const x = s < 0 ? headX - len : headX + headW;
      const fora = s < 0 ? x : x + len - 1;              // a borda externa
      volume(x, earY - 1, len, 4, pele, { topo: 1 });
      px(fora, earY - 3, 1, 3, pele);                    // a ponta sobe
      px(x + (s < 0 ? len - 2 : 1), earY, 1, 3, ramp(pele, -3));   // concha
      px(fora, earY - 5, 1, 2, pelo);                    // o tufo
      px(fora + s, earY - 6, 1, 3, ramp(pelo, 1));
      px(fora - s, earY - 4, 1, 1, ramp(pelo, -2));
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
  const larguraBoca = { fina: 0.20, reta: 0.26, larga: 0.34, frouxa: 0.40, presas: 0.34, escancarada: 0.52 }[f.boca] ?? 0.26;
  // Três pixels acima do queixo, sempre. Colada no queixo, a boca somava com a
  // sombra da mandíbula e a figura ganhava um bigode que ninguém desenhou.
  const mouthY = Math.max(noseY + 2, Math.min(chin - 3, noseY + (rico ? 3 : 2)));
  const mw = Math.max(2, r(headW * larguraBoca));
  const mx = -Math.floor(mw / 2) + lead;
  if (f.boca === 'escancarada') {
    // BOCARRA aberta, com mais de metade da largura da cara e dentes
    // irregulares em cima e embaixo. No ogro, com olho de 1 px e nariz chato,
    // é a única coisa do rosto que chega ao jogador a 45 px — e é ela que diz
    // que o bicho está gritando, não posando.
    const mh = Math.max(3, r(headH * 0.24));
    px(mx, mouthY - 1, mw, mh, ramp(pele, -5));                  // o vão
    px(mx, mouthY - 2, mw, 1, ramp(pele, -2));                   // lábio de cima
    px(mx + 1, mouthY - 1 + mh, mw - 2, 1, ramp(pele, 1));       // lábio de baixo
    px(mx, mouthY - 1, 1, mh, ramp(pele, -3));                   // canto iluminado
    for (let i = 0; i < mw - 1; i += 2) {
      px(mx + i, mouthY - 1, 1, 1 + (i % 4 ? 1 : 0), '#e4d8bc');          // dentes de cima
      px(mx + i + 1, mouthY - 2 + mh, 1, 1, ramp('#e4d8bc', -2));         // dentes de baixo
    }
  } else if (f.boca === 'frouxa') {
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
 *   saiote         tiras largas descendo do cinto até o meio da coxa —
 *                  bugbear, ogro esfarrapado
 *   arcoCostas     arco atravessado nas costas, passando acima do ombro, com
 *                  aljava de flechas — hobgoblin, batedor
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
      //
      // `look.forro` é o lado de DENTRO da capa. Quando a capa abre, é o forro
      // que o jogador vê — e é por isso que o único vermelho de Nezznar está
      // aqui e não no manto fechado das costas.
      const pano = look.forro ?? look.cloak ?? look.outfitDark;
      const alto = torsoTop + 1;
      const base = cintura + r(m.legH * 0.5);
      const alc = Math.max(5, r(m.shoulderW * 0.75)) + sopro;
      const lado = back ? 1 : -1;
      // A célula tem 52 px e x=0 é o centro, então o desenho vai de -26 a 25.
      // Sem travar aqui, o manto de quem tem ombro largo — capitão bandido,
      // sacerdote — escreve no quadrado VIZINHO da folha de sprites, e o
      // contorno automático de sheet.js varre o alfa e prende o lixo lá.
      const LIM = 24;   // 24, não 25: a última coluna fica para o contorno
      for (let y = alto; y < base; y++) {
        const t = (y - alto) / Math.max(1, base - alto - 1);
        let ext = r(alc * Math.pow(t, 1.4));
        ext = lado < 0
          ? Math.min(ext, shoulderX + LIM)
          : Math.min(ext, LIM - shoulderX - shoulder + 1);
        if (ext <= 0) continue;
        const x0 = lado < 0 ? shoulderX - ext : shoulderX + shoulder;
        px(x0, y, ext, 1, t > 0.75 ? ramp(pano, -2) : pano);
        px(lado < 0 ? x0 : x0 + ext - 1, y, 1, 1, ramp(pano, -3));
        if (ext >= 4) px(lado < 0 ? x0 + 1 : x0 + ext - 2, y, 1, 1, ramp(pano, 2));
      }
      px(shoulderX - (lado < 0 ? 1 : 0), alto, shoulder + 1, 1, ramp(pano, 1));
    }

    if (marcas.includes('arcoCostas')) {
      // Arco e aljava atravessados nas costas. Fica na camada de trás: o
      // tronco cobre o meio e sobram as duas pontas, uma ACIMA DO OMBRO e
      // outra abaixo do quadril. São essas duas pontas que dizem "este
      // soldado também atira" num contorno que o escudo já tomou inteiro.
      const vara = ramp(look.leather, 2);
      // A ponta de cima sobe até a ALTURA DA CABEÇA. Parando na linha do
      // ombro, o arco ficava inteiro atrás do tronco e não existia no
      // contorno — e um arco que não quebra o contorno não serve de marca.
      const alto = Math.max(TETO + 6, torsoTop - Math.max(9, r(m.torsoH * 0.78)));
      const baixo = cintura + r(m.legH * 0.3);
      // A ponta alta fica do lado do ESCUDO e não do lado da arma: do lado da
      // arma ela disputava espaço com a lâmina e as duas viravam um feixe de
      // paus. Aqui ela sobe sozinha ao lado da cabeça.
      const xAlto = (back ? 1 : -1) * 1 + (back ? shoulderX + shoulder : shoulderX - 2);
      const xBaixo = back ? shoulderX - 1 : shoulderX + shoulder - 1;
      traco(xBaixo, baixo, xAlto, alto, 2, vara);
      px(xAlto, alto, 2, 2, ramp(vara, 2));                     // a ponta encastoada
      // a corda, um pixel ao lado da vara e num tom bem mais claro
      traco(xBaixo + 2, baixo, xAlto + 2, alto + 1, 1, '#ded2b4');
      // Aljava: tubo curto no ombro com as PENAS saindo acima dele. São as
      // penas que o jogador vê, porque o tubo fica atrás do tronco.
      const ax = back ? shoulderX + 2 : shoulderX + shoulder - 4;
      const ay = torsoTop - 1;
      const ah = Math.max(6, r(m.torsoH * 0.55));
      volume(ax, ay, 4, ah, look.leather, { topo: 1 });
      px(ax, ay + ah - 1, 4, 1, ramp(look.leather, -4));
      for (let i = 0; i < 4; i++) {
        px(ax + i, ay - 5 - (i % 2), 1, 6, i % 2 ? ramp(vara, 1) : ramp(look.trim ?? vara, -1));
        px(ax + i, ay - 5 - (i % 2), 1, 1, '#ded2b4');          // a ponta da pena
      }
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
      //
      // Quem veste couro ganha a ombreira EM COURO, e não em aço: num bugbear
      // coberto de pelo fulvo, a peça preta rebitada contra o pelo é metade
      // da leitura da figura — uma placa clara de metal some no meio do pelo.
      const couro = look.armorStyle === 'leather' || !look.armorStyle;
      const met = couro ? look.leather : look.metal;
      const ow = Math.max(5, r(shoulder * (couro ? 0.42 : 0.34)));
      const oh = Math.max(5, r(m.torsoH * 0.42));
      const ox = back ? shoulderX : side ? shoulderX - 1 : shoulderX + shoulder - ow;
      coluna(torsoTop - 1, oh, (t) => ({
        c: ox + Math.floor(ow / 2),
        w: ow * (0.62 + 0.38 * Math.sin(Math.PI * (0.2 + t * 0.6))),
      }), met, { topo: 1 });
      // espigões: é o que faz a ombreira passar do contorno
      const alto = couro ? 5 : 4;
      for (let i = 1; i < ow - 1; i += 3) {
        px(ox + i, torsoTop - 3, 2, 2, ramp(met, 2));
        px(ox + i, torsoTop - alto, 1, alto - 2, ramp(met, 3));
      }
      if (couro) {
        // rebites: duas colunas de pontos claros, que é o que diz "couro
        // cravejado" e não "pedra"
        for (let i = 2; i < oh - 1; i += 3) px(ox + 1, torsoTop - 1 + i, 1, 1, ramp(met, 3));
      }
      contato(ox + 1, torsoTop - 1 + oh, ow - 2, met);
    }

    if (marcas.includes('saiote')) {
      // Saiote de tiras largas, do cinto ao meio da coxa. É massa onde a
      // figura peluda não tem nenhuma, e corta o corpo em dois: sem ele o
      // bugbear é um bloco contínuo de pelo do ombro ao pé, e o ogro é uma
      // barriga nua que desce direto na perna.
      //
      // As tiras têm COMPRIMENTOS DIFERENTES de propósito. Todas rentes na
      // mesma linha leem como saia de prato; desiguais leem como couro velho.
      const couro = look.leather;
      const lw = Math.max(8, m.waistW + 3);
      const x0 = -Math.floor(lw / 2) + r(desvio * 0.3);
      const topo = cintura - 2;
      // Até o MEIO da coxa e nem um pixel mais. Em criatura de perna curta
      // (ogro), 46% da perna cobria o joelho inteiro e a figura ficava sem
      // perna nenhuma — uma barriga pousada numa saia.
      const queda = Math.max(4, r(m.legH * 0.36));
      // cinto largo por cima das tiras
      volume(x0, topo, lw, 3, ramp(couro, 1), { topo: 1 });
      px(x0, topo + 2, lw, 1, ramp(couro, -4));
      for (let i = 0; i < lw - 1; i += 3) {
        const n = i / 3;
        const alt = queda - (n % 3) * 2 - (i % 2);
        // Largura irregular junto com o comprimento: tiras todas de 3 px e
        // todas rentes leem como cerca de madeira, não como couro gasto.
        const tw = 2 + (n % 4 === 1 ? 0 : 1);
        const cor = n % 2 ? ramp(couro, -1) : couro;
        px(x0 + i, topo + 3, tw, alt, cor);
        px(x0 + i, topo + 3, 1, alt, ramp(cor, 2));              // fio de luz na tira
        px(x0 + i + tw - 1, topo + 3, 1, alt, ramp(cor, -3));    // vão entre as tiras
        px(x0 + i, topo + 3 + alt - 1, tw - 1, 1, ramp(cor, -4));  // ponta da tira
      }
      contato(x0 + 1, topo, lw - 2, couro);
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
function drawWeapon({ px, volume, contato, coluna, traco }, look, m, { gripX, gripY, armW, attack, frame, apoio = 'lado', crown = m.crown, lead = 0 }) {
  const metal = look.metal;
  // `look.cabo` separa a MADEIRA do couro. Sem isso, o pau da clava do ogro
  // saía da mesma cor dos trapos dele e a arma desaparecia dentro da figura:
  // `leather` é, ao mesmo tempo, o cinto, o trapo e o cabo de toda arma.
  const wood = look.cabo ?? look.leather;
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
      // O PRIMEIRO segmento não se desloca. Deslocando já no primeiro, a
      // lâmina nascia a três pixels da guarda e a arma lia como se estivesse
      // flutuando ao lado da mão, partida em duas.
      const off = inclina ? r((inclina * i) / (segs - 1 || 1)) : 0;
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

  /**
   * Remate do cajado. Orbe por padrão; `look.staffTop: 'aranha'` troca por uma
   * aranha de metal.
   *
   * A aranha não é enfeite: o apelido de Nezznar é "a Aranha Negra" e é ela
   * que diz isso ao jogador. Oito pernas saindo de um corpo bulboso dão um
   * remate ESTRELADO, e nenhum outro cajado do elenco tem um — pintada de
   * preto, a figura continua sendo "o mago da aranha no cajado".
   */
  const remate = (bx, topo) => {
    const eixo = bx + Math.floor(T / 2);
    if (look.staffTop !== 'aranha') {
      const orb = look.glow ?? metal;
      volume(bx - 2, topo - L(5), T + 4, L(6), orb, { topo: 1 });
      px(bx - 1, topo - L(6), T + 2, 1, ramp(orb, 3));
      px(bx - 1, topo - L(4), 2, 2, '#ffffff');
      px(bx - 2, topo, T + 4, 1, ramp(orb, -3));
      return;
    }
    // A aranha NÃO pode ser preta de verdade. O contorno automático de
    // sheet.js é quase preto, e preencheu os vãos entre as pernas com a cor
    // das pernas: com `#17151c` ela saía um borrão com duas pontas, lendo
    // como coroa ou morcego. Em cinza-ardósia os vãos ficam mais escuros que
    // as pernas e as oito pernas aparecem uma a uma.
    const ferro = look.staffDark ?? ramp(metal, -4);
    const cy = topo - 4;
    // Quatro pernas de cada lado, com joelho ALTO e ponta BAIXA, em quatro
    // ângulos diferentes — é o leque que lê como aranha. Pernas paralelas,
    // todas no mesmo ângulo, leem como coroa de pontas.
    const PERNAS = [[2, -4, 4, -1], [4, -3, 6, 1], [5, -1, 7, 3], [4, 1, 6, 5]];
    for (const s of [-1, 1]) {
      PERNAS.forEach(([jx, jy, px2, py2], i) => {
        const claro = i % 2 === 0;
        traco(eixo + s * 2, cy + r(i * 0.6), eixo + s * jx, cy + jy, 1, claro ? ramp(ferro, 2) : ferro);
        traco(eixo + s * jx, cy + jy, eixo + s * px2, cy + py2, 1, claro ? ferro : ramp(ferro, -2));
        px(eixo + s * px2, cy + py2, 1, 1, ramp(ferro, claro ? 3 : 1));   // a ponta da pata
      });
    }
    // Corpo: cefalotórax pequeno embaixo, abdome bulboso em cima. O abdome é
    // o ponto mais claro da peça, para o olho achar o centro do bicho.
    volume(eixo - 1, cy, 3, 3, ferro, { topo: 1 });
    volume(eixo - 2, cy - 4, 4, 4, ramp(ferro, 1), { topo: 1 });
    px(eixo - 1, cy - 4, 2, 1, ramp(ferro, 3));          // luz no dorso polido
    px(eixo - 1, cy + 2, 2, 1, ramp(ferro, -3));
    // o engaste onde a aranha prende na haste
    px(bx - 1, topo - 1, T + 2, 2, ramp(trim, 1));
    px(bx - 1, topo + 1, T + 2, 1, ramp(trim, -3));
  };

  /**
   * ERGUIDA acima da cabeça. A arma deixa de ser um apêndice pendurado ao
   * lado do quadril e passa a ser a parte MAIS ALTA do contorno.
   */
  const erguer = () => {
    const teto = TETO + 2;
    if (look.weapon === 'staff') {
      // O cajado atravessa a mão: sobe um pouco acima dela e desce ao longo
      // do corpo, na diagonal do braço. O que marca o contorno é o remate.
      const alto = Math.max(teto + L(8), gripY - L(6));
      const baixo = Math.min(-2, gripY + L(26));
      volume(x, alto, T, baixo - alto, wood, { topo: 1 });
      for (let i = 5; i < baixo - alto; i += 8) px(x, alto + i, T, 1, ramp(wood, -2));
      px(x, baixo - 1, T, 1, ramp(wood, -4));
      remate(x, alto);
      return;
    }
    // Cabo descendo da mão e cabeça da arma acima dela.
    const haste0 = Math.max(teto + L(9), gripY - L(14));
    const caboH = Math.max(5, gripY + L(9) - haste0);
    volume(x, haste0, T, caboH, wood, { topo: 1 });
    for (let i = 3; i < caboH; i += 5) px(x, haste0 + i, T, 1, ramp(wood, -2));
    px(x - 1, haste0 + caboH - 2, T + 2, 2, ramp(trim, -1));   // soquete do punho
    const hy = haste0;
    switch (look.weapon) {
      case 'axe':
        volume(x + T, hy, T + 3, L(8), metal, { topo: 1 });
        px(x + T, hy + 1, 1, L(6), ramp(metal, -4));
        px(x + T + 2, hy + 1, T, L(6), ramp(metal, 2));
        break;
      case 'sword':
      case 'dagger':
      case 'gancho':
        px(x - 2, hy, T + 4, 1, ramp(trim, 2));
        haste(x, hy, L(16), T, metal, 0);
        break;
      default: {
        // CLAVA DE ESPIGÕES. Os espigões saem dos dois lados e do alto: é
        // isso que impede a cabeça da clava de ler como um tijolo no ar.
        const ch = L(8);
        const cy = hy - ch;
        volume(x - 2, cy, T + 4, ch, metal, { topo: 1 });
        px(x - 1, cy, T + 2, 1, ramp(metal, 3));
        for (let i = 1; i < ch - 1; i += 3) {
          px(x - 4, cy + i, 2, 2, ramp(metal, 1));
          px(x + T + 2, cy + i + 1, 2, 2, ramp(metal, -2));
        }
        px(x, cy - 2, 2, 2, ramp(metal, 2));                   // o espigão do topo
        px(x, cy - 3, 1, 1, ramp(metal, 3));
        break;
      }
    }
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
      remate(x, alto);
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
  if (apoio === 'erguida') return erguer();

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
    case 'gancho': {
      // Lâmina LONGA E FINA com um gancho perto da ponta, deitada para fora.
      //
      // Duas correções em relação à espada comum, e as duas são de leitura. A
      // primeira: a lâmina é mais ESTREITA que a haste padrão (T-1). Com a
      // espessura cheia, uma lâmina de 24 px saía com 5 px de largura e lia
      // como rolo de papel, não como fio. A segunda: ela se deita de verdade
      // (incl ≈ 1/3 do comprimento), e assim sai da frente do rosto de quem a
      // segura em vez de cruzar a cara dele como um poste.
      const fio = Math.max(2, T - 1);
      // A lâmina se deita até onde a célula deixa. No golpe, um hobgoblin de
      // ombro largo somava `gripX` já na borda com a inclinação e o fio saía
      // pela lateral — e o que sai da célula perde o contorno.
      const incl = Math.max(0, Math.min(tilt ? tilt + 2 : r(L(20) * 0.26), META - 4 - fio - x));
      cabo(6);
      volume(x - 1, gripY + 5, T + 2, 2, trim, { topo: 1 });   // pomo
      px(x - 2, gripY - 3, T + 4, 1, ramp(trim, 2));           // guarda
      px(x - 2, gripY - 2, T + 4, 1, ramp(trim, -2));
      const len = L(22);
      haste(x, gripY - 3, len, fio, metal, incl);
      // O GANCHO: um dente saindo do dorso, a um quarto da ponta. É o que
      // impede esta espada de ser a mesma barra cinza do bandido.
      const gx = x + incl;
      const gy = gripY - 3 - len + r(len * 0.26);
      px(gx + fio, gy, 3, 2, metal);
      px(gx + fio, gy, 3, 1, ramp(metal, 3));
      px(gx + fio + 2, gy - 2, 1, 2, ramp(metal, 2));          // a ponta do dente
      px(gx + fio, gy + 2, 2, 1, ramp(metal, -5));             // sombra sob o dente
      break;
    }
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
    case 'clava': {
      // CLAVA DE TRONCO: um pau grosso que AFINA até a mão, com espigões
      // escuros cravados no bojo. A maça do clérigo é uma haste fina com uma
      // cabeça de metal — simétrica, fabricada. Esta é o contrário: um tronco
      // que alguém arrancou e espetou pregos. O ogro não fabrica nada, e a
      // arma tem de dizer isso.
      // Ela aponta PARA BAIXO, e é isso que a faz ler como clava de ogro: o
      // braço é tão longo que a mão já está na altura do joelho, e o tronco
      // pendurado dali arrasta o bojo espetado perto do chão. Erguida, ela
      // virava uma prancha de 40 px ao lado da figura.
      const topo = gripY - 4;
      const base = Math.min(-2, gripY + L(24));
      const len = Math.max(8, base - topo);
      const grosso = T + 2;
      // O bojo é mais largo que a haste, e os espigões saem dele: o tronco
      // inteiro é recuado para dentro da célula antes de desenhar, senão a
      // ponta espetada some no corte da folha na vista de lado.
      const cx0 = Math.max(-(META - grosso - 2), Math.min(META - grosso - 3, x));
      coluna(topo, len, (t) => ({
        c: cx0 + Math.floor(T / 2),
        w: T + (grosso - T) * t,                // fino na mão, grosso no bojo
      }), wood, { topo: 1 });
      for (let i = 3; i < len; i += 5) px(cx0 - 1, topo + i, grosso - 1, 1, ramp(wood, -2));
      px(cx0 - 1, base - 1, grosso, 1, ramp(wood, -4));
      contato(cx0 - 1, base, grosso, wood);
      // Espigões no terço de baixo, alternados, mais um na ponta. O ogro não
      // fabrica arma: ele espeta prego num pau.
      for (let i = 0; i < 2; i++) {
        const sy = base - 4 - i * 4;
        px(cx0 - 3, sy, 2, 2, ramp(metal, 1));
        px(cx0 - 4, sy, 1, 1, ramp(metal, 2));
        px(cx0 + grosso - 2, sy + 2, 2, 2, ramp(metal, -1));
        px(cx0 + grosso, sy + 2, 1, 1, ramp(metal, 1));
      }
      px(cx0 + 1, base, 2, 2, ramp(metal, -2));
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
