// PLANO CORPORAL: dragao — ver ELENCO.md secao 3 para o contrato.
//
// POR QUE ESTE ARQUIVO MEDE AS COISAS DIFERENTE DOS OUTROS PLANOS
// O dragao e a unica criatura do elenco que precisa ENCOSTAR no teto da
// celula: ele e a recompensa do fim da campanha e tem de ler como maior que
// tudo que o grupo viu ate ali. Os outros planos cabem com folga nos 75 px
// uteis; aqui a crista de chifres para em -74, porque o quadro de respiracao
// do idle sobe 1 px e -75 e a ultima linha da celula. Um pixel acima disso nao
// e "um pouco maior": vaza para a celula de cima na folha de sprites e aparece
// como lixo preso no sprite do vizinho.
//
// ASA DOBRADA, NAO ABERTA
// Asa aberta de um Grande ocuparia os 52 px de largura e cobriria os quadrados
// vizinhos no tabuleiro. No idle ela fica dobrada sobre o dorso com o no do
// pulso quebrando a linha das costas — e o que entrega "dragao" na silhueta
// sem gastar largura. Ela so abre no `down`, caida, quando a criatura ja nao
// disputa espaco com ninguem.
//
// ESCAMA
// Nenhuma escama e desenhada uma por uma. A 55 px de altura no tabuleiro, uma
// malha de escamas vira ruido cinza e come a silhueta. O flanco leva tres
// fileiras diagonais de ramp(-2) com uma aresta de ramp(+1) em cima, e o
// ventre leva placas horizontais claras. A 55 px isso le como couro escamado;
// a malha completa lia como sujeira.

import { ramp } from '../kit.js';

const r = Math.round;

/**
 * Interpola uma lista de pontos de controle igualmente espacados em t.
 *
 * O pescoco em S nao sai de formula fechada: a curva precisa de duas
 * inflexoes em altura escolhida a mao, senao o S vira um C e a silhueta perde
 * exatamente o que a identifica contra o resto do elenco. Mesma coisa na
 * cauda, que tem de descer e engrossar em ritmos diferentes.
 */
function curva(pontos) {
  return (t) => {
    const u = Math.max(0, Math.min(1, t)) * (pontos.length - 1);
    const i = Math.min(pontos.length - 2, Math.floor(u));
    return pontos[i] + (pontos[i + 1] - pontos[i]) * (u - i);
  };
}

/**
 * Volume de eixo HORIZONTAL — a `coluna` do kit transposta.
 *
 * `coluna` resolve tudo que cresce para cima: tronco, perna, pescoco. Cauda e
 * pescoco deitado correm na horizontal, e empilhar retangulos deitados daria
 * de novo o efeito de papel recortado que o ELENCO manda consertar. Aqui cada
 * fatia e uma coluna de 1 px com luz no topo, nucleo, sombra e a aresta de luz
 * refletida embaixo — a luz vem de cima, entao o gradiente e vertical.
 */
function faixa({ px }, x0, x1, forma, cor, { topo = 1 } = {}) {
  const passos = Math.abs(x1 - x0);
  const sentido = x1 >= x0 ? 1 : -1;
  const luz = ramp(cor, 3);
  const som = ramp(cor, -2);
  const ref = ramp(cor, -1);
  for (let i = 0; i <= passos; i++) {
    const t = passos === 0 ? 0 : i / passos;
    const { c, h } = forma(t);
    const alt = Math.max(1, r(h));
    const x = x0 + sentido * i;
    const y = r(c) - Math.floor(alt / 2);
    px(x, y, 1, alt, cor);
    if (topo) px(x, y, 1, 1, luz);
    if (alt >= 4) {
      px(x, y + alt - 2, 1, 1, som);
      px(x, y + alt - 1, 1, 1, ref);
    } else if (alt >= 2) {
      px(x, y + alt - 1, 1, 1, ref);
    }
  }
}

/**
 * Cores do dragao verde jovem.
 *
 * Os `??` nao sao preguica: `looks/bestiario.js` e de outro dono e o look do
 * dragao pode ainda nao existir quando esta folha e montada. Um plano que
 * estoura sem look derruba a construcao da folha inteira, inclusive dos
 * monstros que estao prontos.
 */
function cores(look = {}) {
  const escama = look.outfit ?? '#3d6b33';
  return {
    escama,
    dorso: look.outfitDark ?? ramp(escama, -2),
    ventre: look.trim ?? '#a8b357',
    membrana: look.cloak ?? look.leather ?? '#4d5a2e',
    osso: look.metal ?? '#cfc3a2',
    olho: look.eyes ?? '#e7a324',
    goela: look.glow ?? '#9ad42a',
  };
}

/**
 * Deslocamentos por pose.
 *
 *   nx, ny  pescoco e cabeca (o S inteiro se inclina; ny negativo sobe)
 *   ax, ay  no do pulso da asa dobrada
 *   rx, ry  tronco (ry positivo afunda, como peso caindo nas patas)
 *   boca    mandibula aberta — e o quadro em que o sopro nasce
 *
 * O ataque e dois tempos de verdade: no quadro 0 o pescoco RECUA e afunda,
 * enrolado sobre o ombro; no quadro 1 ele PROJETA. Um dragao que so empurra a
 * cabeca para frente nos dois quadros nao tem de onde tirar a forca do sopro.
 */
function poseOffsets(pose) {
  const f1 = pose.frame === 1;
  switch (pose.kind) {
    case 'attack':
      return f1
        ? { nx: 2, ny: -1, ax: -1, ay: 1, rx: 2, ry: 0, boca: 1 }
        : { nx: -4, ny: 4, ax: 1, ay: -2, rx: -1, ry: 1, boca: 0 };
    case 'hurt':
      return { nx: -3, ny: 6, ax: 2, ay: 2, rx: -2, ry: 2, boca: 1 };
    default:
      return f1
        ? { nx: 0, ny: -1, ax: 0, ay: -1, rx: 0, ry: 0, boca: 0 }
        : { nx: 0, ny: 0, ax: 0, ay: 0, rx: 0, ry: 0, boca: 0 };
  }
}

// O S do pescoco, de cima (t=0, logo abaixo do cranio) para baixo (t=1, peito).
// Duas inflexoes: a garganta avanca, o meio recua sobre o ombro, a base volta a
// avancar. E o peso da inclinacao cai com a altura, senao a pose move a base do
// pescoco junto com a cabeca e o peito desgruda do tronco.
// Duas coisas aqui sao correcao de erro medido na silhueta, nao gosto:
//
// 1. A amplitude do desvio (7 px) e MAIOR que o afunilamento (6 -> 13 px de
//    largura). Com 4 px de desvio o S desaparecia: um desvio menor que o
//    crescimento da largura e engolido pela propria silhueta e sobra um tronco
//    de cone vertical.
// 2. As duas inflexoes estao posicionadas pela ALTURA EM QUE APARECEM, nao
//    espalhadas pelo pescoco todo. Os 5 px de cima do pescoco ficam atras do
//    cranio e da mandibula: toda curva colocada ali nao existe para o jogador.
//    O S inteiro tem de caber abaixo do queixo, entre y=-56 e y=-45.
const PESCOCO_C = curva([12, 14, 12, 7, 8, 12, 10]);
const PESCOCO_W = curva([7, 7, 8, 8, 9, 11, 13]);
const pesoPescoco = (t) => (1 - t) ** 1.6;

// ---------------------------------------------------------------------------

/**
 * Cabeca de perfil: cranio curto e alto, mandibula longa, crista de chifres
 * varrida para TRAS. Os chifres apontam para tras porque e o que separa este
 * perfil do javali e do urso do elenco, que tem massa na frente da cabeca.
 */
function cabecaLado(kit, c, hx, hy, boca) {
  const { px, volume, contato, coluna, traco } = kit;

  // Cranio: alto atras, afinando para a orbita.
  coluna(hy, 9, (t) => ({ c: hx + 5, w: 11 - r(t * 2) }), c.escama, { topo: 2 });
  px(hx + 1, hy + 3, 7, 1, ramp(c.escama, 2));                  // arcada da sobrancelha
  volume(hx + 1, hy + 6, 6, 4, ramp(c.escama, -1), { topo: 1 }); // bochecha / dobradica

  // Focinho: a mandibula longa e metade da leitura do perfil.
  faixa(kit, hx + 8, hx + 14, (t) => ({ c: hy + 5 + t * 1, h: 6 - r(t * 2) }), c.escama);
  px(hx + 13, hy + 4, 2, 1, ramp(c.escama, 2));                  // alto do focinho pega luz
  px(hx + 12, hy + 6, 1, 1, ramp(c.escama, -3));                 // narina

  // Mandibula inferior. Aberta, ela cai e a goela acende: e dali que o sopro sai.
  const queda = boca ? 4 : 0;
  faixa(kit, hx + 6, hx + 13, (t) => ({ c: hy + 10 + queda * t, h: 4 - r(t * 1) }), ramp(c.escama, -1));
  if (boca) {
    px(hx + 7, hy + 9, 6, 3, ramp(c.goela, -3));
    px(hx + 8, hy + 10, 4, 2, c.goela);
    px(hx + 9, hy + 10, 3, 1, ramp(c.goela, 2));
    for (let i = 0; i < 3; i++) px(hx + 8 + i * 2, hy + 9, 1, 1, ramp(c.osso, 2)); // dentes de cima
  } else {
    px(hx + 7, hy + 9, 7, 1, ramp(c.escama, -4));                // linha da boca fechada
    px(hx + 9, hy + 10, 1, 1, ramp(c.osso, 1));                  // um canino aparecendo
    px(hx + 12, hy + 10, 1, 1, ramp(c.osso, 1));
  }

  // Olho: iris vertical de reptil. A pupila e uma fenda de 1x2 — e o unico
  // detalhe de dentro da figura que sobrevive aos 55 px do tabuleiro, por isso
  // leva o maior contraste do sprite.
  px(hx + 2, hy + 3, 4, 3, ramp(c.olho, -3));
  px(hx + 2, hy + 3, 3, 2, c.olho);
  px(hx + 3, hy + 3, 1, 1, ramp(c.olho, 3));
  px(hx + 4, hy + 3, 1, 2, '#1a1410');

  // Crista: tres chifres varridos para tras, o de cima e o mais longo.
  traco(hx + 2, hy - 2, hx - 4, hy - 4, 2, c.osso);
  traco(hx + 1, hy + 1, hx - 6, hy - 1, 2, ramp(c.osso, -1));
  traco(hx + 2, hy + 5, hx - 3, hy + 5, 1, ramp(c.osso, -2));
  px(hx - 4, hy - 4, 1, 1, ramp(c.osso, 3));                     // ponta do chifre pega luz
  contato(hx + 1, hy + 10, 6, c.escama);                         // queixo contra o pescoco
}

/**
 * Asa dobrada sobre o dorso. O no do pulso sobe acima da linha das costas e
 * as varetas dos dedos descem ao longo do flanco. Essa ponta alta e a parte da
 * silhueta que nenhuma outra criatura do elenco tem.
 */
function asaDobrada(kit, c, ax, ay) {
  const { px, volume, contato, coluna, traco } = kit;

  // Membrana: cunha que desce e se afasta ao longo do flanco.
  const mc = curva([-5, -6, -8, -10, -12, -13]);
  const mw = curva([5, 9, 13, 15, 14, 10]);
  coluna(-56 + ay, 21, (t) => ({ c: mc(t) + ax, w: mw(t) }), c.membrana, { topo: 1 });

  // Varetas dos dedos sobre a membrana: tres, abrindo em leque para tras.
  traco(-4 + ax, -54 + ay, -16 + ax, -40 + ay, 2, ramp(c.escama, -2));
  traco(-5 + ax, -54 + ay, -14 + ax, -37 + ay, 2, ramp(c.escama, -2));
  traco(-6 + ax, -54 + ay, -10 + ax, -36 + ay, 2, ramp(c.escama, -3));

  // Umero: do ombro para cima e para tras, ate o pulso.
  traco(5, -45, -3 + ax, -54 + ay, 3, ramp(c.escama, -1));

  // No do pulso e a garra que o remata — o pico da asa.
  volume(-9 + ax, -59 + ay, 7, 5, c.escama, { topo: 1 });
  px(-10 + ax, -61 + ay, 2, 3, c.osso);
  px(-10 + ax, -61 + ay, 1, 1, ramp(c.osso, 3));
  contato(-17 + ax, -36 + ay, 10, c.membrana);
}

/** Pata, dianteira ou traseira, com garras apontando para a frente. */
function pata(kit, c, { quadril, coxaY, coxaH, coxaW, peY, peW, tom = 0 }) {
  const { px, volume, contato, coluna } = kit;
  const corpo = tom ? ramp(c.escama, tom) : c.escama;
  const baixo = ramp(corpo, -1);

  coluna(coxaY, coxaH, (t) => ({ c: quadril, w: coxaW - r(t * 4) }), corpo, { topo: 1 });
  coluna(coxaY + coxaH, peY - (coxaY + coxaH), (t) => ({ c: quadril + r(t * 2), w: coxaW - 6 - r(t * 2) }), baixo, { topo: 0 });

  const px0 = quadril - r(peW * 0.4);
  volume(px0, peY, peW, -peY, baixo, { topo: 1 });
  contato(px0, -1, peW, baixo);

  // Garras em ESCADA, nao alinhadas: tres pontas na mesma linha leem como um
  // bloco unico nos 55 px do tabuleiro. E nenhuma passa de y=-2, porque y=0 e
  // a linha do chao — garra abaixo dela flutua sobre o quadrado vizinho.
  const garra = tom ? ramp(c.osso, tom) : c.osso;
  for (let i = 0; i < 3; i++) {
    const gx = px0 + peW - 6 + i * 2;
    const gy = i === 1 ? -4 : -3;
    px(gx, gy, 2, 2, garra);
    px(gx, gy, 1, 1, ramp(garra, 2));
  }
  px(px0 + peW, -3, 1, 2, garra);
}

// ---------------------------------------------------------------------------

function paintLado(kit, c, p) {
  const { px, contato, coluna, traco } = kit;
  const { rx, ry } = p;

  // 1. Cauda, atras de tudo: engrossa na base e sai pela borda esquerda. E a
  // unica peca do elenco que atravessa o limite da celula, de proposito.
  faixa(kit, -14 + rx, -26, (t) => ({ c: -22 + t * 16, h: 13 - r(t * 5) }), c.escama);
  for (let i = 0; i < 4; i++) {
    const tx = -17 - i * 3;
    const ty = -24 + i * 4;
    px(tx, ty, 2, 3, ramp(c.osso, -2));
    px(tx, ty, 1, 1, ramp(c.osso, 1));
  }

  // 2. Patas do lado de la: mesmas formas, dois degraus mais escuras e
  // deslocadas. Sem elas o dragao le como recorte de duas pernas.
  pata(kit, c, { quadril: -9 + rx, coxaY: -36 + ry, coxaH: 13, coxaW: 12, peY: -5, peW: 10, tom: -3 });
  pata(kit, c, { quadril: 11 + rx, coxaY: -40 + ry, coxaH: 12, coxaW: 10, peY: -5, peW: 9, tom: -3 });

  // 3. Tronco: dorso reto, peito fundo, barriga recolhida.
  const tronco = curva([28, 32, 34, 34, 31, 26]);
  coluna(-46 + ry, 23 - ry, (t) => ({ c: -2 + rx, w: tronco(t) }), c.escama, { topo: 2 });
  contato(-14 + rx, -24, 26, c.escama);

  // 4. Ventre de placas horizontais claras. Duas faixas de valor, nunca uma
  // chapa: a barriga e o unico lugar claro da figura e serve de descanso para
  // o olho depois do dorso escuro.
  for (let i = 0; i < 4; i++) {
    const y = -31 + ry + i * 2;
    const w = 26 - i * 2;
    const x = -Math.floor(w / 2) + rx;
    px(x, y, w, 2, i % 2 ? ramp(c.ventre, 1) : ramp(c.ventre, 2));
    px(x, y + 1, w, 1, ramp(c.ventre, -2));
  }

  // 5. Flanco: tres fileiras diagonais, cada uma com a aresta clara em cima.
  const fileiras = [[-14, -42, -3, -36], [-10, -45, 2, -38], [-3, -44, 8, -36]];
  for (const [x0, y0, x1, y1] of fileiras) {
    traco(x0 + rx, y0 + ry - 1, x1 + rx, y1 + ry - 1, 1, ramp(c.escama, 1));
    traco(x0 + rx, y0 + ry, x1 + rx, y1 + ry, 1, ramp(c.escama, -2));
  }

  // 6. Espinhos do dorso, do cangote ao quadril.
  for (let i = 0; i < 7; i++) {
    const sx = -15 + rx + i * 4;
    const alt = 3 + (i % 2);
    px(sx, -46 + ry - alt, 2, alt, ramp(c.osso, -2));
    px(sx, -46 + ry - alt, 1, 1, ramp(c.osso, 1));
  }

  // 7. Vulto da asa do outro lado, atras do dorso: so um degrau de valor, o
  // bastante para a asa proxima ter de que se separar.
  coluna(-54 + p.ay, 15, (t) => ({ c: -1 + r(t * 3), w: 6 + r(t * 5) }), ramp(c.membrana, -3), { topo: 0 });

  // 8. Asa proxima, dobrada.
  asaDobrada(kit, c, p.ax, p.ay);

  // 9. Patas deste lado, na frente do tronco e da asa.
  pata(kit, c, { quadril: -12 + rx, coxaY: -38 + ry, coxaH: 14, coxaW: 14, peY: -5, peW: 12 });
  pata(kit, c, { quadril: 8 + rx, coxaY: -42 + ry, coxaH: 13, coxaW: 11, peY: -6, peW: 11 });

  // 10. Pescoco em S. A inclinacao da pose pesa na cabeca e se dissolve na base.
  const topoP = -62 + p.ny;
  coluna(topoP, -45 - topoP, (t) => ({ c: PESCOCO_C(t) + p.nx * pesoPescoco(t), w: PESCOCO_W(t) }), c.escama, { topo: 2 });
  // Placas da garganta: horizontais, na frente do pescoco, acompanhando o S.
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    const y = topoP + 2 + r(t * (-45 - topoP - 4));
    const cc = PESCOCO_C(t) + p.nx * pesoPescoco(t);
    const w = PESCOCO_W(t);
    px(r(cc) + Math.floor(w / 2) - 3, y, 3, 2, ramp(c.ventre, 1));
    px(r(cc) + Math.floor(w / 2) - 3, y + 1, 3, 1, ramp(c.ventre, -2));
  }
  contato(r(PESCOCO_C(1)) - 7, -45, 14, c.escama);

  // 11. Cabeca.
  cabecaLado(kit, c, 8 + p.nx, -70 + p.ny, p.boca);
}

// ---------------------------------------------------------------------------

/**
 * Vista de frente. O peito e a parte mais larga da figura e as duas pontas de
 * asa saem dos ombros como dois picos — e o jeito de o `front` nao virar o
 * mesmo trapezio com cabeca que o ELENCO reprova nos humanoides.
 */
function paintFrente(kit, c, p) {
  const { px, volume, contato, coluna, traco } = kit;
  const { rx, ry } = p;

  // Cauda espiando por tras, entre as patas de tras. Para em -3: de frente ela
  // esta ATRAS do bicho, e cauda abaixo da linha do chao leria como se
  // estivesse na frente das patas.
  coluna(-16, 13, (t) => ({ c: -1, w: 9 - r(t * 3) }), ramp(c.escama, -4), { topo: 0 });

  // Patas de tras: mais abertas e mais escuras, atras do corpo.
  pata(kit, c, { quadril: -17, coxaY: -26 + ry, coxaH: 11, coxaW: 11, peY: -5, peW: 10, tom: -3 });
  pata(kit, c, { quadril: 17, coxaY: -26 + ry, coxaH: 11, coxaW: 11, peY: -5, peW: 10, tom: -3 });

  // Peito: largo no ombro, cheio no meio, recolhido na virilha.
  const peito = curva([26, 30, 32, 30, 26, 22]);
  coluna(-46 + ry, 23 - ry, (t) => ({ c: rx, w: peito(t) }), c.escama, { topo: 2 });
  contato(-11 + rx, -24, 22, c.escama);

  // Esterno: placas claras subindo pelo meio do peito.
  for (let i = 0; i < 6; i++) {
    const y = -42 + ry + i * 3;
    const w = 10 + i;
    const x = -Math.floor(w / 2) + rx;
    px(x, y, w, 2, i % 2 ? ramp(c.ventre, 1) : ramp(c.ventre, 2));
    px(x, y + 2, w, 1, ramp(c.ventre, -2));
  }

  // Asas dobradas: dois picos acima da linha do ombro. O da direita leva um
  // degrau a menos de luz, porque a luz vem da esquerda.
  // `p.ax` entra SEM o sinal do lado: a asa ajusta na mesma direcao de tela
  // nos dois lados, como um ombro que gira. Multiplicado por `lado` ele abria
  // as duas asas para fora e a direita saia da celula no quadro de recuo.
  for (const lado of [-1, 1]) {
    const tom = lado < 0 ? 0 : -1;
    const mc = curva([12, 14, 16, 17, 17]);
    const mw = curva([8, 12, 14, 13, 10]);
    coluna(-55 + p.ay, 19, (t) => ({ c: lado * mc(t) + p.ax, w: mw(t) }), ramp(c.membrana, tom), { topo: 1 });
    volume(lado * 20 - (lado < 0 ? 0 : 7) + p.ax, -58 + p.ay, 7, 5, ramp(c.escama, tom), { topo: 1 });
    px(lado * 21 - (lado < 0 ? 0 : 2) + p.ax, -60 + p.ay, 2, 3, ramp(c.osso, tom));
    traco(lado * 10, -44, lado * 17 + p.ax, -53 + p.ay, 3, ramp(c.escama, tom - 1));
  }

  // Patas da frente, plantadas e na nossa frente.
  pata(kit, c, { quadril: -12 + rx, coxaY: -34 + ry, coxaH: 14, coxaW: 12, peY: -6, peW: 12 });
  pata(kit, c, { quadril: 12 + rx, coxaY: -34 + ry, coxaH: 14, coxaW: 12, peY: -6, peW: 12, tom: -1 });

  // Pescoco de frente: o S vira so uma inclinacao lateral, mas a largura ainda
  // conta a historia — fino no cangote, grosso onde entra no peito.
  const topoP = -63 + p.ny;
  coluna(topoP, -45 - topoP, (t) => ({ c: p.nx * pesoPescoco(t) * 0.6, w: curva([9, 10, 12, 14, 16])(t) }), c.escama, { topo: 2 });
  for (let i = 0; i < 5; i++) {
    const y = topoP + 3 + i * 3;
    const w = 5 + i;
    px(-Math.floor(w / 2), y, w, 2, ramp(c.ventre, 1));
    px(-Math.floor(w / 2), y + 1, w, 1, ramp(c.ventre, -2));
  }

  // Cabeca de frente: cranio largo, focinho estreito, dois olhos e a crista
  // abrindo para os lados.
  const hx = r(p.nx * 0.6);
  const hy = -72 + p.ny;
  coluna(hy, 8, (t) => ({ c: hx, w: 13 - r(t * 2) }), c.escama, { topo: 2 });
  faixa(kit, hx - 4, hx + 4, (t) => ({ c: hy + 11, h: 7 - r(Math.abs(t - 0.5) * 4) }), c.escama);
  const queda = p.boca ? 3 : 0;
  faixa(kit, hx - 3, hx + 3, (t) => ({ c: hy + 14 + queda, h: 3 }), ramp(c.escama, -1));
  if (p.boca) {
    px(hx - 3, hy + 13, 7, 3, ramp(c.goela, -3));
    px(hx - 2, hy + 14, 5, 2, c.goela);
    px(hx - 1, hy + 14, 3, 1, ramp(c.goela, 2));
  } else {
    px(hx - 3, hy + 14, 7, 1, ramp(c.escama, -4));
  }
  for (const ex of [hx - 5, hx + 2]) {
    px(ex, hy + 4, 4, 3, ramp(c.olho, -3));
    px(ex, hy + 4, 3, 2, c.olho);
    px(ex + 1, hy + 4, 1, 2, '#1a1410');
  }
  px(hx - 1, hy + 9, 1, 1, ramp(c.escama, -3));                  // narinas
  px(hx + 1, hy + 9, 1, 1, ramp(c.escama, -3));
  for (const lado of [-1, 1]) {
    traco(hx + lado * 4, hy, hx + lado * 11, hy - 2, 2, lado < 0 ? c.osso : ramp(c.osso, -1));
    traco(hx + lado * 5, hy + 4, hx + lado * 11, hy + 3, 1, ramp(c.osso, -2));
  }
}

// ---------------------------------------------------------------------------

/**
 * Vista de costas. Aqui a cauda e a protagonista: desce pelo meio e sai pela
 * borda de baixo, e a crista de espinhos corre por cima dela. Nenhuma outra
 * criatura do elenco tem nada saindo pela base da celula.
 */
function paintCostas(kit, c, p) {
  const { px, volume, contato, coluna, traco } = kit;
  const { rx, ry } = p;

  // Cauda descendo pelo centro e saindo pela borda inferior da celula.
  coluna(-28, 32, (t) => ({ c: 1 + r(t * 2), w: 13 - r(t * 6) }), c.escama, { topo: 0 });
  for (let i = 0; i < 6; i++) {
    const y = -26 + i * 5;
    px(-1 + r(i * 0.4), y, 3, 2, ramp(c.osso, -2));
    px(-1 + r(i * 0.4), y, 1, 1, ramp(c.osso, 1));
  }

  pata(kit, c, { quadril: -14 + rx, coxaY: -34 + ry, coxaH: 14, coxaW: 14, peY: -5, peW: 12 });
  pata(kit, c, { quadril: 14 + rx, coxaY: -34 + ry, coxaH: 14, coxaW: 14, peY: -5, peW: 12, tom: -1 });

  // Dorso: largo no ombro, estreitando no quadril.
  const dorso = curva([28, 30, 30, 27, 23, 20]);
  coluna(-46 + ry, 22 - ry, (t) => ({ c: rx, w: dorso(t) }), c.dorso, { topo: 2 });
  contato(-10 + rx, -25, 20, c.dorso);

  // Escama do dorso: duas fileiras diagonais por lado, espelhadas.
  for (const lado of [-1, 1]) {
    for (let i = 0; i < 2; i++) {
      const y0 = -42 + ry + i * 7;
      traco(lado * 3, y0 - 1, lado * 13, y0 + 4, 1, ramp(c.dorso, 1));
      traco(lado * 3, y0, lado * 13, y0 + 5, 1, ramp(c.dorso, -2));
    }
  }

  // Crista do dorso, descendo da nuca ao quadril.
  for (let i = 0; i < 8; i++) {
    const y = -44 + ry + i * 3;
    const alt = 3 + (i % 2);
    px(-1, y, 3, 2, ramp(c.osso, -2));
    px(-1, y, 1, 1, ramp(c.osso, 1));
    if (alt > 3) px(0, y - 1, 1, 1, ramp(c.osso, -1));
  }

  // Asas dobradas vistas de tras: as membranas quase se tocam sobre a espinha.
  for (const lado of [-1, 1]) {
    const tom = lado < 0 ? 0 : -1;
    const mc = curva([8, 11, 14, 16, 17]);
    const mw = curva([9, 13, 15, 14, 11]);
    coluna(-56 + p.ay, 20, (t) => ({ c: lado * mc(t) + p.ax, w: mw(t) }), ramp(c.membrana, tom), { topo: 1 });
    traco(lado * 6, -46, lado * 14 + p.ax, -55 + p.ay, 3, ramp(c.escama, tom - 1));
    volume(lado * 17 - (lado < 0 ? 0 : 7) + p.ax, -60 + p.ay, 7, 5, ramp(c.escama, tom), { topo: 1 });
    px(lado * 18 - (lado < 0 ? 0 : 2) + p.ax, -62 + p.ay, 2, 3, ramp(c.osso, tom));
    for (let i = 0; i < 3; i++) {
      traco(lado * (9 + i), -54 + p.ay, lado * (14 + i * 3), -40 + p.ay, 2, ramp(c.escama, tom - 2));
    }
  }

  // Pescoco de costas e a nuca: sem olhos, a crista de chifres e tudo o que
  // identifica a cabeca daqui.
  const topoP = -63 + p.ny;
  coluna(topoP, -46 - topoP, (t) => ({ c: p.nx * pesoPescoco(t) * 0.6, w: curva([10, 11, 13, 15, 17])(t) }), c.dorso, { topo: 2 });
  for (let i = 0; i < 5; i++) {
    const y = topoP + 2 + i * 3;
    px(-1, y, 3, 2, ramp(c.osso, -2));
    px(-1, y, 1, 1, ramp(c.osso, 1));
  }

  const hx = r(p.nx * 0.6);
  const hy = -72 + p.ny;
  coluna(hy, 9, (t) => ({ c: hx, w: 12 - r(t * 1) }), c.escama, { topo: 2 });
  contato(hx - 6, hy + 9, 12, c.escama);
  for (const lado of [-1, 1]) {
    traco(hx + lado * 3, hy + 1, hx + lado * 10, hy - 2, 2, lado < 0 ? c.osso : ramp(c.osso, -1));
    traco(hx + lado * 4, hy + 5, hx + lado * 10, hy + 4, 1, ramp(c.osso, -2));
  }
}

// ---------------------------------------------------------------------------

/**
 * Abatido. O pescoco se estende no chao e a asa ABRE, caida — e o unico quadro
 * em que ela pode abrir, porque uma criatura no chao ja nao disputa espaco com
 * os vizinhos do tabuleiro. A silhueta deitada tem de ser inconfundivel: o
 * jogador precisa saber, de relance, que o dragao caiu.
 */
function paintCaido(kit, c, dir) {
  const { px, volume, contato, coluna, traco } = kit;
  const espelho = dir === 'back' ? -1 : 1;
  // A celula e ASSIMETRICA: cx = 26, logo x vai de -26 a +25. Espelhar -26 daria
  // +26, um pixel fora, que na folha de sprites vaza para a celula vizinha. O
  // limite usavel de qualquer peca espelhada e 24.
  const e = (x) => Math.max(-24, Math.min(24, x)) * espelho;
  // Espelhar um RETANGULO nao e espelhar o seu x: a largura continua crescendo
  // para a direita, entao o canto que vira esquerdo e o outro. Sem isto as
  // placas do ventre e a sombra de contato saiam 15 px fora da celula na vista
  // de costas, por cima do sprite vizinho.
  const eb = (x, w) => (espelho < 0 ? -(x + w) : x);

  // Asa aberta caida, varrendo o chao para o lado oposto a cabeca.
  for (let i = 0; i < 4; i++) {
    traco(e(-2), -15, e(-23 + i * 4), -3 - i * 4, 2, ramp(c.membrana, -2));
  }
  faixa(kit, e(-4), e(-22), (t) => ({ c: -9 + t * 5, h: 12 - r(t * 6) }), c.membrana, { topo: 1 });
  traco(e(-2), -16, e(-22), -5, 2, ramp(c.escama, -2));

  // Cauda saindo pela borda do mesmo lado.
  faixa(kit, e(-10), e(-24), (t) => ({ c: -4 + t * 1, h: 9 - r(t * 4) }), ramp(c.escama, -1));

  // Massa do corpo, achatada no chao.
  coluna(-17, 17, (t) => ({ c: e(-2), w: 24 + r(t * 6) }), c.escama, { topo: 1, base: 1 });
  contato(eb(-15, 26), -1, 26, c.escama);
  for (let i = 0; i < 3; i++) {
    const bx = eb(-10 + i * 6, 10);
    px(bx, -14, 10, 2, ramp(c.ventre, 1));
    px(bx, -12, 10, 1, ramp(c.ventre, -2));
  }
  // Patas dobradas sob o corpo: so os dedos aparecem.
  for (const base of [-8, 6]) {
    const fx = eb(base, 9);
    volume(fx, -5, 9, 4, ramp(c.escama, -2), { topo: 1 });
    px(espelho < 0 ? fx : fx + 7, -3, 2, 2, ramp(c.osso, -1));
    contato(fx, -1, 9, ramp(c.escama, -2));
  }

  // Pescoco estendido no chao e a cabeca de lado, com o olho fechado.
  faixa(kit, e(8), e(17), (t) => ({ c: -9 + t * 3, h: 11 - r(t * 4) }), c.escama);
  coluna(-12, 11, (t) => ({ c: e(19), w: 9 - r(t * 2) }), c.escama, { topo: 1 });
  faixa(kit, e(21), e(25), (t) => ({ c: -6 + t * 1, h: 5 - r(t * 1) }), c.escama);
  px(eb(17, 3), -9, 3, 1, '#1a1410');                            // olho fechado: uma linha
  px(eb(20, 4), -3, 4, 1, ramp(c.osso, 1));                      // dentes contra o chao
  // A crista continua la, caida para tras: e o que ainda diz "dragao" deitado.
  traco(e(16), -14, e(10), -17, 2, ramp(c.osso, -1));
  traco(e(15), -11, e(9), -13, 2, ramp(c.osso, -2));
  contato(eb(14, 12), -1, 12, c.escama);
}

// ---------------------------------------------------------------------------

/**
 * SILHUETA: pescoco em S subindo acima de tudo no tabuleiro, crista de chifres
 * varrida para tras, uma ponta de asa dobrada quebrando a linha das costas e
 * uma cauda grossa saindo pela borda do quadro.
 *
 * DRAGAO VERDE JOVEM (SRD) — criatura Grande, a maior do elenco, 74 px de
 * crista a garra contra os 58 px do humano e os 41 do goblin. Essa diferenca
 * de tamanho e o unico recurso que o tabuleiro tem para dizer, sem texto, que
 * este encontro nao e como os outros.
 */
export function paintDragao(kit, look, dir, pose) {
  const c = cores(look ?? {});

  if (pose.kind === 'down') return paintCaido(kit, c, dir);

  const p = poseOffsets(pose);
  if (dir === 'front') return paintFrente(kit, c, p);
  if (dir === 'back') return paintCostas(kit, c, p);
  return paintLado(kit, c, p);
}

/**
 * GANCHO PARA O SOPRO — para `view/visuals.js`.
 *
 * O cone de sopro nao pode nascer do centro do quadrado: num sprite de 74 px a
 * boca esta a tres quartos da altura e bem na frente do centro, e um cone
 * saindo dos pes do dragao estraga o unico golpe que a campanha guarda para o
 * fim. Isto devolve a ponta do focinho em coordenadas da CELULA (x=0 no
 * centro, y negativo para cima, igual ao resto do plano), para `visuals.js`
 * converter em tela com a escala e o espelhamento que ja usa nos projeteis.
 *
 * `aberta` diz se este quadro e o da mandibula aberta — o sopro deve comecar
 * no quadro 1 do attack, nao no 0, que e o de recuo.
 */
export function bocaDragao(dir = 'side', pose = { kind: 'idle', frame: 0 }) {
  if (pose.kind === 'down') {
    const espelho = dir === 'back' ? -1 : 1;
    return { x: 25 * espelho, y: -5, aberta: false };
  }
  const p = poseOffsets(pose);
  // `aberta` NAO e "a mandibula esta aberta": no `hurt` ela tambem abre, e um
  // rugido de dor, nao um sopro. So o quadro 1 do attack autoriza o cone.
  const aberta = pose.kind === 'attack' && pose.frame === 1;
  if (dir === 'side') {
    return { x: 8 + p.nx + 14, y: -70 + p.ny + 11 + (p.boca ? 3 : 0), aberta };
  }
  // De frente e de costas a boca fica no eixo: o cone sai na direcao da camera.
  return { x: r(p.nx * 0.6), y: -72 + p.ny + 14 + (p.boca ? 3 : 0), aberta };
}
