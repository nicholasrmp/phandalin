// PLANO CORPORAL: dragao — ver ELENCO.md secao 3 para o contrato.
//
// POR QUE ESTE ARQUIVO MEDE AS COISAS DIFERENTE DOS OUTROS PLANOS
// O dragao e a unica criatura do elenco que precisa ENCOSTAR no teto da
// celula: ele e a recompensa do fim da campanha e tem de ler como maior que
// tudo que o grupo viu ate ali. Os outros planos cabem com folga nos 75 px
// uteis; aqui a coroa de chifres para em -73, porque o quadro de respiracao do
// idle sobe 1 px e o contorno preto automatico de `sheet.js` pinta mais 1 px
// acima disso. -75 e a ultima linha da celula: um pixel alem nao e "um pouco
// maior", vaza para a celula de cima na folha e aparece como lixo preso no
// sprite do vizinho.
//
// A JANELA UTIL E [-25, +24], NAO [-26, +25]
// A celula tem 52 px de largura e `cx = 26`, logo x vai de -26 a +25. Mas o
// contorno e posto DEPOIS, por cima da folha inteira: um pixel em x=-26 ganha
// contorno em x=-27, que ja e a celula da esquerda. A versao anterior deixava
// a cauda da vista de lado chegar a -26 e por isso sujava o quadro vizinho.
// Tudo que este plano desenha passa por `lim()` ou nasce dentro de [-25, 24].
//
// ASA ABERTA (REFERENCIAS.md secao 11)
// A versao anterior dobrava a asa sobre o dorso para economizar largura. Era
// barato e estava errado: na referencia as asas ABERTAS sao metade do bicho.
// Asa inteiramente aberta nao cabe em 52 px, entao aqui ela abre ate a borda
// util e as PONTAS SOBEM em vez de so sairem para o lado — e o leque erguido
// que diz "aberta" numa silhueta estreita. O que nao se negocia, porque e o
// que sobra na silhueta a 55 px, e o pescoco em S e a coroa de chifres; a
// envergadura cede primeiro.
//
// ESCAMA
// Nenhuma escama e desenhada uma por uma. A 55 px de altura no tabuleiro, uma
// malha de escamas vira ruido cinza e come a silhueta. O flanco leva fileiras
// diagonais de ramp(-2) com uma aresta de ramp(+1) em cima, e o ventre leva
// placas horizontais claras. A 55 px isso le como couro escamado; a malha
// completa lia como sujeira.

import { ramp } from '../kit.js';

const r = Math.round;

/** Janela util da celula depois do contorno automatico. Ver cabecalho. */
const lim = (x) => Math.max(-25, Math.min(24, x));

// `lim` sozinho protege o PONTO, e `coluna`, `volume` e `px` crescem a partir
// dele: a coxa, que e a peca mais larga da figura, saia 4 px fora da celula na
// vista de frente mesmo com o centro dentro da janela. Estas duas guardas
// recebem a largura junto.
const limCentro = (c, w) =>
  Math.max(-25 + Math.floor(w / 2), Math.min(24 - Math.floor((Math.max(1, w) - 1) / 2), c));
const limEsq = (x, w) => Math.max(-25, Math.min(24 - Math.max(1, w) + 1, x));

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
 * focinho correm na horizontal, e empilhar retangulos deitados daria de novo o
 * efeito de papel recortado que o ELENCO manda consertar. Aqui cada fatia e
 * uma coluna de 1 px com luz no topo, nucleo, sombra e a aresta de luz
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
    const x = lim(x0 + sentido * i);
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
 * Membro afilado entre dois pontos — coxa, canela, braco, dedo grosso.
 *
 * E so `coluna` com o centro andando junto com a altura. Existe como funcao
 * propria porque sem ela cada perna vira tres chamadas de `coluna` com os
 * mesmos tres erros de alinhamento, e porque `traco` (que seria a alternativa
 * diagonal) nao tem luz nem sombra: pinta quadrados de cor chapada, e perna
 * chapada e exatamente o defeito 1 do ELENCO.
 */
function membro({ coluna }, cor, y0, y1, x0, x1, w0, w1, opts = {}) {
  const h = y1 - y0;
  if (h <= 0) return;
  coluna(y0, h, (t) => {
    const w = w0 + (w1 - w0) * t;
    return { c: limCentro(x0 + (x1 - x0) * t, w), w };
  }, cor, opts);
}

/**
 * Preenche um poligono fechado varrendo por COLUNA.
 *
 * Por que coluna e nao linha: a luz do projeto vem de cima, entao o degrade de
 * qualquer peca e vertical. Varrendo por coluna, cada fatia de 1 px recebe luz
 * no topo, nucleo, sombra e a aresta de luz refletida embaixo — a mesma receita
 * de `faixa`. Varrida por linha, a membrana sairia uma chapa de cor unica, que
 * e como a asa lia antes e a razao de ela parecer uma capa.
 *
 * O poligono e rasterizado ARESTA POR ARESTA antes do preenchimento: assim
 * nenhuma coluna fica sem topo ou sem base, mesmo quando a borda de tras da
 * asa festona e volta sobre si mesma.
 */
function poligono({ px }, pontos, cor) {
  let x0 = Infinity;
  let x1 = -Infinity;
  for (const [x] of pontos) {
    const xl = lim(x);
    if (xl < x0) x0 = xl;
    if (xl > x1) x1 = xl;
  }
  if (!Number.isFinite(x0) || x1 < x0) return;
  const n = x1 - x0 + 1;
  const topo = new Array(n).fill(Infinity);
  const base = new Array(n).fill(-Infinity);

  for (let i = 0; i < pontos.length; i++) {
    const [ax, ay] = pontos[i];
    const [bx, by] = pontos[(i + 1) % pontos.length];
    const passos = Math.max(Math.abs(bx - ax), Math.abs(by - ay), 1);
    for (let s = 0; s <= passos; s++) {
      const t = s / passos;
      const x = lim(r(ax + (bx - ax) * t)) - x0;
      const y = r(ay + (by - ay) * t);
      if (y < topo[x]) topo[x] = y;
      if (y > base[x]) base[x] = y;
    }
  }

  const luz = ramp(cor, 3);
  const som = ramp(cor, -2);
  const ref = ramp(cor, -1);
  for (let i = 0; i < n; i++) {
    if (topo[i] === Infinity) continue;
    const alt = base[i] - topo[i] + 1;
    px(x0 + i, topo[i], 1, alt, cor);
    px(x0 + i, topo[i], 1, 1, luz);
    if (alt >= 4) {
      px(x0 + i, base[i] - 1, 1, 1, som);
      px(x0 + i, base[i], 1, 1, ref);
    } else if (alt >= 2) {
      px(x0 + i, base[i], 1, 1, ref);
    }
  }
}

/**
 * Cores do dragao verde jovem.
 *
 * Os `??` nao sao preguica: `looks/dragao.js` pode mudar de mao e o look pode
 * nao existir quando esta folha e montada. Um plano que estoura sem look
 * derruba a construcao da folha inteira, inclusive dos monstros prontos.
 */
function cores(look = {}) {
  const escama = look.outfit ?? '#4a7236';
  const membrana = look.cloak ?? '#a3b25c';
  return {
    escama,
    dorso: look.outfitDark ?? ramp(escama, -2),
    ventre: look.trim ?? '#c2c86e',
    membrana,
    nervura: look.leather ?? ramp(membrana, -3),
    // Na referencia a COROA E A CRISTA SAO ESCURAS, verde quase preto; so o
    // dente e claro. A versao anterior pintava chifre, espinho e garra todos
    // no mesmo marfim: no alto da figura isso virava uma antena mais clara que
    // a cabeca, e na espinha virava colar de contas. Tres materiais, tres
    // valores — e o que separa a serra do dorso do brilho do dente.
    espinho: look.horn ?? ramp(escama, -4),
    garra: look.claw ?? '#9a8f73',
    osso: look.metal ?? '#e4dec3',
    olho: look.eyes ?? '#efa81e',
    goela: look.glow ?? '#a6e02c',
  };
}

/**
 * Deslocamentos por pose.
 *
 *   nx, ny  pescoco e cabeca (o S inteiro se inclina; ny negativo sobe)
 *   ax, ay  pulso da asa: ay negativo ergue o leque, ax abre ou recolhe
 *   rx, ry  tronco (ry positivo afunda, como peso caindo nas patas)
 *   boca    mandibula aberta — e o quadro em que o sopro nasce
 *
 * O ataque e dois tempos de verdade: no quadro 0 o pescoco RECUA e afunda e as
 * asas CAEM, juntando energia; no quadro 1 o pescoco PROJETA e as asas sobem.
 * Um dragao que so empurra a cabeca para frente nos dois quadros nao tem de
 * onde tirar a forca do sopro. No `idle` o que respira e a asa, nao o peito:
 * ponta de asa subindo 1 px le, a 55 px, melhor que um torax inflando.
 */
function poseOffsets(pose) {
  const f1 = pose.frame === 1;
  switch (pose.kind) {
    case 'attack':
      return f1
        ? { nx: 2, ny: -1, ax: 1, ay: -3, rx: 2, ry: 0, boca: 1 }
        : { nx: -4, ny: 4, ax: -2, ay: 3, rx: -1, ry: 1, boca: 0 };
    case 'hurt':
      return { nx: -3, ny: 6, ax: -2, ay: 4, rx: -2, ry: 2, boca: 1 };
    default:
      return f1
        ? { nx: 0, ny: -1, ax: 0, ay: -2, rx: 0, ry: 0, boca: 0 }
        : { nx: 0, ny: 0, ax: 0, ay: 0, rx: 0, ry: 0, boca: 0 };
  }
}

// O S do pescoco, de cima (t=0, logo abaixo do cranio) para baixo (t=1, peito).
// Duas inflexoes: a garganta avanca, o meio recua sobre o ombro, a base volta a
// avancar. E o peso da inclinacao cai com a altura, senao a pose move a base do
// pescoco junto com a cabeca e o peito desgruda do tronco.
// Duas coisas aqui sao correcao de erro medido na silhueta, nao gosto:
//
// 1. A amplitude do desvio (7 px) e MAIOR que o afunilamento (7 -> 13 px de
//    largura). Com 4 px de desvio o S desaparecia: um desvio menor que o
//    crescimento da largura e engolido pela propria silhueta e sobra um tronco
//    de cone vertical.
// 2. As duas inflexoes estao posicionadas pela ALTURA EM QUE APARECEM, nao
//    espalhadas pelo pescoco todo. Os 4 px de cima do pescoco ficam atras do
//    cranio e da mandibula: toda curva colocada ali nao existe para o jogador.
//    O S inteiro tem de caber abaixo do queixo, entre y=-58 e y=-45.
const PESCOCO_C = curva([10, 12, 10, 5, 6, 9, 6]);
const PESCOCO_W = curva([7, 7, 8, 9, 10, 12, 13]);
const pesoPescoco = (t) => (1 - t) ** 1.6;

// Tronco de bipede: ombro estreito, peito fundo, quadril recolhido. O centro
// anda para a direita no meio porque o PEITO avanca e as costas ficam retas —
// uma coluna simetrica daria um barril, e barril e o que o ogro ja e.
const TRONCO_W = curva([17, 21, 22, 19, 16, 13]);
const TRONCO_C = curva([-2, -1, 0, 0, -1, -2]);

// ---------------------------------------------------------------------------

/**
 * Um espinho da crista: base de 3 px afinando para 1, com `inc` de deriva
 * lateral para ele apontar para tras.
 *
 * Por que nao um retangulo: a versao anterior desenhava 3x2 com um pixel de
 * luz, e enfileirados esses retangulos leem como conta de colar — no `back`
 * a espinha inteira virava um ziper. O que diz "serra" e o triangulo.
 */
function espinho({ px }, x, y, alt, cor, inc = 0) {
  for (let i = 0; i < alt; i++) {
    const t = alt <= 1 ? 1 : i / (alt - 1);
    const w = Math.max(1, r(3 - t * 2));
    px(limEsq(r(x + inc * t), w), y - i, w, 1, t > 0.66 ? ramp(cor, 2) : cor);
  }
}

/**
 * Asa ABERTA. Dois chamados, nao um, porque a membrana fica ATRAS do corpo
 * (a asa nasce no dorso) e o braco da asa fica NA FRENTE da linha das costas:
 * desenhados juntos, ou o pulso some atras do tronco ou a membrana passa por
 * cima do flanco.
 *
 * `pontas` sao as pontas dos dedos. Entre duas pontas a borda de tras AFUNDA
 * na direcao do pulso: e o festao que separa asa de membrana de capa de pano.
 */
function asaMembrana(kit, c, { ombro, pulso, pontas, ancora, tom = 0 }) {
  const { traco } = kit;
  const cor = ramp(c.membrana, tom);

  const borda = [];
  for (let i = 0; i < pontas.length; i++) {
    borda.push(pontas[i]);
    if (i + 1 < pontas.length) {
      const [ax, ay] = pontas[i];
      const [bx, by] = pontas[i + 1];
      const mx = (ax + bx) / 2;
      const my = (ay + by) / 2;
      borda.push([mx + (pulso[0] - mx) * 0.16, my + (pulso[1] - my) * 0.16]);
    }
  }
  poligono(kit, [ombro, pulso, ...borda, ancora], cor);

  // Nervuras: os dedos. Sem elas a cunha clara nao vira asa — e o erro que a
  // versao dobrada ja tinha e que a aberta ampliaria para metade da figura.
  for (let i = 0; i < pontas.length; i++) {
    const [tx, ty] = pontas[i];
    traco(lim(pulso[0]), pulso[1], lim(tx), ty, 1, ramp(c.nervura, tom + (i === 0 ? 1 : 0)));
  }
  // A membrana entre o ultimo dedo e o flanco e a parte em sombra: fica atras
  // do corpo e nao pega a luz que vem de cima e da esquerda.
  traco(lim(pontas[pontas.length - 1][0]), pontas[pontas.length - 1][1], lim(ancora[0]), ancora[1], 1, ramp(cor, -3));
}

/** Umero, pulso e a GARRA NA DOBRA — o gancho que remata a asa na referencia. */
function asaBraco(kit, c, { ombro, pulso, tom = 0 }) {
  const { px, volume, traco } = kit;
  const corpo = ramp(c.escama, tom - 1);
  traco(lim(ombro[0]), ombro[1], lim(pulso[0]), pulso[1], 3, corpo);
  traco(lim(ombro[0]), ombro[1] - 1, lim(pulso[0]), pulso[1] - 1, 1, ramp(corpo, 2));

  const wx = lim(pulso[0]) - 3;
  volume(wx, pulso[1] - 2, 6, 5, ramp(c.escama, tom), { topo: 1 });
  // GARRA NA DOBRA, em 3 px de garra escura. Em marfim e com 4 px ela ficava
  // mais clara e mais alta que a cabeca: a silhueta ganhava uma antena e
  // perdia o unico ponto para onde o olho devia ir, que e a coroa.
  const garra = ramp(c.garra, tom);
  px(limEsq(wx + 1, 2), pulso[1] - 4, 2, 3, garra);
  px(limEsq(wx + 1, 1), pulso[1] - 4, 1, 1, ramp(garra, 2));
  px(limEsq(wx, 1), pulso[1] - 3, 1, 2, ramp(garra, -2));
}

/**
 * Perna traseira de bipede: coxa grossa que avanca, canela que recua, pe
 * chapado no chao com tres garras. O joelho a frente do tornozelo e o que
 * separa este andar do urso e do javali do elenco, que pisam de quatro.
 */
function pernaTraseira(kit, c, { qx, qy, tom = 0, peW = 12 }) {
  const { px, volume, contato } = kit;
  const corpo = ramp(c.escama, tom);
  const baixo = ramp(corpo, -1);

  // Coxa CURTA e canela LONGA, nao o contrario: e a proporcao de bipede que
  // corre, e e ela que da o joelho visivel. Com a coxa descendo ate o
  // tornozelo a perna saia um tronco de arvore de ponta a ponta.
  membro(kit, corpo, qy, qy + 12, qx, qx + 4, 14, 9, { topo: 1 });
  contato(limEsq(qx + 1, 9), qy + 12, 9, corpo);
  membro(kit, baixo, qy + 12, -4, qx + 4, qx + 1, 9, 5, { topo: 0 });
  contato(limEsq(qx - 1, 6), -4, 6, baixo);                    // tornozelo

  const fx = limEsq(qx - 4, peW);
  volume(fx, -4, peW, 4, baixo, { topo: 1 });
  // Dois sulcos escuros separam tres dedos. Um pe chapado le como tijolo.
  px(limEsq(fx + r(peW * 0.38), 1), -3, 1, 2, ramp(baixo, -3));
  px(limEsq(fx + r(peW * 0.68), 1), -3, 1, 2, ramp(baixo, -3));
  contato(fx, -1, peW, baixo);

  // Garras em ESCADA, nao alinhadas: tres pontas na mesma linha leem como um
  // bloco unico nos 55 px do tabuleiro. E nenhuma passa de y=-2, porque y=0 e
  // a linha do chao — garra abaixo dela flutua sobre o quadrado vizinho.
  const garra = ramp(c.garra, tom);
  for (let i = 0; i < 3; i++) {
    const gx = limEsq(fx + peW - 5 + i * 2, 2);
    const gy = i === 1 ? -3 : -2;
    px(gx, gy, 2, 2, garra);
    px(gx, gy, 1, 1, ramp(garra, 2));
  }
}

/**
 * Braco dianteiro. Curto e colado ao peito, quase so garra na ponta: na
 * referencia ele nao sustenta o bicho, quem sustenta sao as traseiras. Desenha-
 * lo do tamanho da perna devolveria o quadrupede que estava errado.
 */
function bracoDianteiro(kit, c, { ox, oy, tom = 0, lado = 1 }) {
  const { px } = kit;
  const corpo = ramp(c.escama, tom);
  membro(kit, corpo, oy, oy + 8, ox, ox + lado * 3, 7, 5, { topo: 1 });
  membro(kit, ramp(corpo, -1), oy + 8, oy + 14, ox + lado * 3, ox + lado * 4, 5, 4, { topo: 0 });

  const garra = ramp(c.garra, tom);
  for (let i = 0; i < 3; i++) {
    const gx = limEsq(ox + lado * 4 - 2 + i * 2, 2);
    px(gx, oy + 14, 2, 3 - (i === 2 ? 1 : 0), garra);
    px(gx, oy + 14, 1, 1, ramp(garra, 2));
  }
}

/**
 * Cabeca de perfil: cranio curto e alto, mandibula longa e a COROA DE CHIFRES
 * varrida para tras. Os chifres apontam para tras porque e o que separa este
 * perfil do javali e do urso do elenco, que tem massa na frente da cabeca — e
 * porque, com as asas comendo a largura, a coroa e o que sobra de dragao no
 * alto da silhueta.
 */
function cabecaLado(kit, c, hx, hy, boca) {
  const { px, volume, contato, coluna, traco } = kit;

  coluna(hy, 9, (t) => ({ c: limCentro(hx + 5, 11 - r(t * 2)), w: 11 - r(t * 2) }), c.escama, { topo: 2 });
  px(limEsq(hx + 1, 7), hy + 3, 7, 1, ramp(c.escama, 2));            // arcada da sobrancelha
  volume(limEsq(hx + 1, 6), hy + 6, 6, 4, ramp(c.escama, -1), { topo: 1 }); // bochecha

  // Focinho: a mandibula longa e metade da leitura do perfil.
  faixa(kit, hx + 8, hx + 14, (t) => ({ c: hy + 5 + t * 1, h: 6 - r(t * 2) }), c.escama);
  px(lim(hx + 13), hy + 4, 2, 1, ramp(c.escama, 2));                // alto do focinho pega luz
  px(lim(hx + 12), hy + 6, 1, 1, ramp(c.escama, -3));               // narina

  // Mandibula inferior. Aberta, ela cai e a goela acende: dali sai o sopro.
  const queda = boca ? 4 : 0;
  faixa(kit, hx + 6, hx + 13, (t) => ({ c: hy + 10 + queda * t, h: 4 - r(t * 1) }), ramp(c.escama, -1));
  if (boca) {
    px(limEsq(hx + 7, 6), hy + 9, 6, 3, ramp(c.goela, -3));
    px(limEsq(hx + 8, 4), hy + 10, 4, 2, c.goela);
    px(limEsq(hx + 9, 3), hy + 10, 3, 1, ramp(c.goela, 2));
    for (let i = 0; i < 3; i++) px(lim(hx + 8 + i * 2), hy + 9, 1, 1, ramp(c.osso, 2));
  } else {
    px(limEsq(hx + 7, 7), hy + 9, 7, 1, ramp(c.escama, -4));        // linha da boca fechada
    px(lim(hx + 9), hy + 10, 1, 1, ramp(c.osso, 1));                // um canino aparecendo
    px(lim(hx + 12), hy + 10, 1, 1, ramp(c.osso, 1));
  }

  // Olho: iris vertical de reptil. A pupila e uma fenda de 1x2 — e o unico
  // detalhe de dentro da figura que sobrevive aos 55 px do tabuleiro, por isso
  // leva o maior contraste do sprite.
  px(limEsq(hx + 2, 4), hy + 3, 4, 3, ramp(c.olho, -3));
  px(limEsq(hx + 2, 3), hy + 3, 3, 2, c.olho);
  px(lim(hx + 3), hy + 3, 1, 1, ramp(c.olho, 3));
  px(lim(hx + 4), hy + 3, 1, 2, '#1a1410');

  // COROA: quatro chifres varridos para tras, em comprimentos diferentes. Dois
  // chifres iguais leem como orelha; quatro desiguais leem como coroa.
  traco(lim(hx + 3), hy - 1, lim(hx - 6), hy - 2, 2, ramp(c.espinho, 1));
  traco(lim(hx + 2), hy + 1, lim(hx - 8), hy + 1, 2, c.espinho);
  traco(lim(hx + 2), hy + 4, lim(hx - 6), hy + 5, 2, ramp(c.espinho, 1));
  traco(lim(hx + 3), hy + 7, lim(hx - 2), hy + 9, 1, c.espinho);
  px(lim(hx - 6), hy - 2, 1, 1, ramp(c.espinho, 3));                // ponta pega luz
  contato(limEsq(hx + 1, 6), hy + 10, 6, c.escama);                 // queixo contra o pescoco
}

// ---------------------------------------------------------------------------

function paintLado(kit, c, p) {
  const { px, contato, coluna, traco } = kit;
  const { rx, ry, ax, ay } = p;

  const ombroY = -47 + ry;

  // 1. Asa do lado de la, atras de tudo e dois degraus mais escura. Ela existe
  //    para que a asa proxima tenha de que se separar: uma asa so num perfil le
  //    como barbatana.
  const asaLonge = {
    ombro: [3 + rx, ombroY + 2],
    pulso: [14 + ax, -56 + ay],
    pontas: [
      [24, -49 + ay],
      [24, -41 + ay],
      [20, -35 + ay],
      [14, -31 + ay],
    ],
    ancora: [5 + rx, -36 + ry],
    tom: -3,
  };
  asaMembrana(kit, c, asaLonge);
  asaBraco(kit, c, asaLonge);

  // 2. Asa proxima: abre para TRAS e para CIMA. As pontas sobem porque em 52 px
  //    nao ha para onde sair de lado — e o leque erguido que le como "aberta".
  const asaPerto = {
    ombro: [-3 + rx, ombroY],
    pulso: [-12 + ax, -60 + ay],
    pontas: [
      [-25, -52 + ay],
      [-24, -43 + ay],
      [-19, -36 + ay],
      [-13, -32 + ay],
    ],
    ancora: [-5 + rx, -37 + ry],
    tom: 0,
  };
  asaMembrana(kit, c, asaPerto);

  // 3. Cauda longa e sinuosa, pousada no chao atras das pernas. Ela nao sai
  //    mais pela borda: com a asa gastando largura, cauda vazada era a segunda
  //    peca a sujar o quadro vizinho.
  // A ondulacao da cauda vem de DUAS curvas com ritmos diferentes (o centro
  // desce em S, a espessura afina devagar); uma reta que afina sai rabo de rato.
  const cauY = curva([-26, -22, -15, -9, -4]);
  const cauH = curva([14, 12, 9, 6, 4]);
  faixa(kit, -4 + rx, -24, (t) => ({ c: cauY(t), h: cauH(t) }), c.escama);
  for (let i = 0; i < 5; i++) {
    const t = (i + 0.5) / 5;
    const tx = r(-4 + rx - t * (20 + rx));
    const ty = r(cauY(t) - cauH(t) / 2);
    espinho(kit, tx, ty, 4 - i, c.espinho, 1);
  }

  // 4. Perna do lado de la, escura e atrasada.
  pernaTraseira(kit, c, { qx: -6 + rx, qy: -26 + ry, tom: -3, peW: 11 });

  // 5. Tronco ERGUIDO: eixo vertical, peito fundo, quadril recolhido. E esta
  //    verticalidade, nao o detalhe, que tira o dragao da familia dos
  //    quadrupedes do elenco.
  coluna(-50 + ry, 27 - ry, (t) => ({ c: limCentro(TRONCO_C(t) + rx, TRONCO_W(t)), w: TRONCO_W(t) }), c.escama, { topo: 2 });
  contato(limEsq(-11 + rx, 21), -24, 21, c.escama);

  // 6. VENTRE EM PLACAS horizontais, encostadas na borda da frente do tronco.
  //    Duas faixas de valor, nunca uma chapa: a barriga e o unico lugar claro
  //    da figura e serve de descanso para o olho depois do dorso escuro.
  for (let i = 0; i < 8; i++) {
    const t = i / 7;
    const y = -47 + ry + i * 3;
    const dir = TRONCO_C(t) + rx + TRONCO_W(t) / 2;
    const w = 10 - r(t * 3);
    const x = limEsq(r(dir) - w, w);
    px(x, y, w, 2, i % 2 ? ramp(c.ventre, 1) : ramp(c.ventre, 2));
    px(x, y + 2, w, 1, ramp(c.ventre, -2));
  }

  // 7. Flanco: tres fileiras diagonais, cada uma com a aresta clara em cima.
  const fileiras = [[-9, -45, 0, -39], [-9, -39, 1, -33], [-8, -33, 1, -28]];
  for (const [x0, y0, x1, y1] of fileiras) {
    traco(lim(x0 + rx), y0 + ry - 1, lim(x1 + rx), y1 + ry - 1, 1, ramp(c.escama, 1));
    traco(lim(x0 + rx), y0 + ry, lim(x1 + rx), y1 + ry, 1, ramp(c.escama, -2));
  }

  // 8. FILEIRA DE ESPINHOS pelas costas, do cangote ao quadril — e ela que
  //    continua na cauda e faz a linha de espinhos ir de ponta a ponta.
  for (let i = 0; i < 8; i++) {
    const t = i / 7;
    const y = -49 + ry + i * 3;
    const esq = TRONCO_C(t) + rx - TRONCO_W(t) / 2;
    espinho(kit, r(esq) - 2, y, 4 + (i % 2), c.espinho, 1);
  }

  // 9. Braco da asa proxima POR CIMA do dorso: o pulso alto e a garra da dobra
  //    sao o que diz, de relance, que a asa esta aberta e nao dobrada.
  asaBraco(kit, c, asaPerto);

  // 10. Perna deste lado, na frente de tudo.
  // Sombra do quadril antes da perna da frente: sem ela o tronco desce direto
  // para a coxa e a figura vira um sino.
  contato(limEsq(-8 + rx, 14), -25 + ry, 14, c.escama);
  pernaTraseira(kit, c, { qx: 2 + rx, qy: -28 + ry, tom: 0, peW: 13 });

  // 11. Bracos dianteiros, curtos, colados ao peito.
  // Os bracos passam A FRENTE da borda do peito, nao por cima dela: colados ao
  // meio do tronco eles tapavam justamente as placas do ventre, que sao o
  // unico claro da figura.
  bracoDianteiro(kit, c, { ox: 9 + rx, oy: -43 + ry, tom: -2 });
  bracoDianteiro(kit, c, { ox: 12 + rx, oy: -41 + ry, tom: 0 });

  // 12. PESCOCO EM S. A inclinacao da pose pesa na cabeca e se dissolve na base.
  const topoP = -62 + p.ny;
  coluna(topoP, -45 - topoP, (t) => ({
    c: limCentro(PESCOCO_C(t) + p.nx * pesoPescoco(t), PESCOCO_W(t)),
    w: PESCOCO_W(t),
  }), c.escama, { topo: 2 });

  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    const y = topoP + 1 + r(t * (-45 - topoP - 3));
    const cc = PESCOCO_C(t) + p.nx * pesoPescoco(t);
    const w = PESCOCO_W(t);
    // Placas da garganta na frente...
    px(limEsq(r(cc) + Math.floor(w / 2) - 3, 3), y, 3, 2, ramp(c.ventre, 1));
    px(limEsq(r(cc) + Math.floor(w / 2) - 3, 3), y + 1, 3, 1, ramp(c.ventre, -2));
    // ...e a CRISTA ESPINHOSA atras, descendo da coroa ate as costas. Ela
    // cresce para baixo: na referencia os espinhos da nuca sao os menores.
    espinho(kit, r(cc) - Math.floor(w / 2) - 2, y + 2, 3 + r(t * 2), c.espinho, 1);
  }
  contato(limEsq(r(PESCOCO_C(1)) - 6, 13), -45, 13, c.escama);

  // 13. Cabeca.
  cabecaLado(kit, c, 5 + p.nx, -71 + p.ny, p.boca);
}

// ---------------------------------------------------------------------------

/**
 * Vista de frente. E aqui que a envergadura aparece inteira: as duas asas
 * abrem ate a borda util da celula e as pontas sobem acima da linha dos ombros.
 * Sem isso o `front` viraria o mesmo trapezio com cabeca que o ELENCO reprova
 * nos humanoides.
 */
function paintFrente(kit, c, p) {
  const { px, contato, coluna, traco } = kit;
  const { rx, ry, ax, ay } = p;

  // Cauda espiando por tras, entre as patas de tras. Para em -3: de frente ela
  // esta ATRAS do bicho, e cauda abaixo da linha do chao leria como se
  // estivesse na frente das patas.
  coluna(-16, 13, (t) => ({ c: -1, w: 9 - r(t * 3) }), ramp(c.escama, -4), { topo: 0 });

  // Asas abertas, uma para cada lado. A da direita leva um degrau a menos de
  // luz, porque a luz vem da esquerda.
  for (const lado of [-1, 1]) {
    const tom = lado < 0 ? 0 : -2;
    const asa = {
      ombro: [lado * 8 + rx, -45 + ry],
      pulso: [lado * 16 + lado * ax, -60 + ay],
      pontas: [
        [lado * 24, -53 + ay],
        [lado * 24, -43 + ay],
        [lado * 20, -36 + ay],
        [lado * 13, -32 + ay],
      ],
      ancora: [lado * 7 + rx, -37 + ry],
      tom,
    };
    asaMembrana(kit, c, asa);
    asaBraco(kit, c, asa);
  }

  // Peito: largo no ombro, cheio no meio, recolhido na virilha.
  const peito = curva([21, 24, 25, 23, 21, 19]);
  coluna(-50 + ry, 27 - ry, (t) => ({ c: limCentro(rx, peito(t)), w: peito(t) }), c.escama, { topo: 2 });
  contato(limEsq(-10 + rx, 20), -24, 20, c.escama);

  // Esterno: placas claras descendo pelo meio do peito, alargando.
  // As placas afinam em cima e alargam na barriga. Largura constante dava uma
  // escada regular de 25 px de altura no meio da figura: lia como grade, e uma
  // grade clara no centro rouba o olho da cabeca.
  for (let i = 0; i < 8; i++) {
    const t = i / 7;
    const y = -47 + ry + i * 3;
    const w = 7 + r(t * 5);
    px(limEsq(-Math.floor(w / 2) + rx, w), y, w, 2, i % 2 ? c.ventre : ramp(c.ventre, 1));
    px(limEsq(-Math.floor(w / 2) + rx, w), y + 2, w, 1, ramp(c.ventre, -2));
  }

  // Sao DUAS pernas, nao quatro: o bicho se ergue nas traseiras e as dianteiras
  // viraram bracos. A versao anterior desenhava quatro patas plantadas e por
  // isso lia como quadrupede — o erro de especie que a referencia aponta.
  pernaTraseira(kit, c, { qx: -9 + rx, qy: -29 + ry, tom: 0, peW: 13 });
  pernaTraseira(kit, c, { qx: 9 + rx, qy: -29 + ry, tom: -2, peW: 13 });

  // Bracos dianteiros contra o peito. Eles precisam de sombra de contato e de
  // um degrau de valor proprio: pintados na cor da escama, sobre a escama, nao
  // existiam — era so o peito com tres garras penduradas.
  for (const lado of [-1, 1]) {
    const ox = lado * 10 + rx;
    contato(limEsq(ox - 3, 7), -44 + ry, 7, c.escama);
    bracoDianteiro(kit, c, { ox, oy: -43 + ry, tom: lado < 0 ? 1 : -2, lado });
  }

  // Pescoco de frente: o S vira so uma inclinacao lateral, mas a largura ainda
  // conta a historia — fino no cangote, grosso onde entra no peito.
  const topoP = -62 + p.ny;
  const pw = curva([8, 9, 11, 13, 15]);
  coluna(topoP, -45 - topoP, (t) => ({
    c: limCentro(p.nx * pesoPescoco(t) * 0.6, pw(t)),
    w: pw(t),
  }), c.escama, { topo: 2 });
  for (let i = 0; i < 6; i++) {
    const y = topoP + 2 + i * 3;
    const w = 5 + i;
    px(limEsq(-Math.floor(w / 2), w), y, w, 2, ramp(c.ventre, 1));
    px(limEsq(-Math.floor(w / 2), w), y + 1, w, 1, ramp(c.ventre, -2));
  }

  // Cabeca de frente: cranio largo, focinho estreito, dois olhos e a coroa
  // abrindo para os lados.
  const hx = r(p.nx * 0.6);
  const hy = -70 + p.ny;
  coluna(hy, 9, (t) => ({ c: limCentro(hx, 15 - r(t * 3)), w: 15 - r(t * 3) }), c.escama, { topo: 2 });
  faixa(kit, hx - 4, hx + 4, (t) => ({ c: hy + 11, h: 7 - r(Math.abs(t - 0.5) * 4) }), c.escama);
  const queda = p.boca ? 3 : 0;
  faixa(kit, hx - 3, hx + 3, (t) => ({ c: hy + 14 + queda, h: 3 }), ramp(c.escama, -1));
  if (p.boca) {
    px(limEsq(hx - 3, 7), hy + 13, 7, 3, ramp(c.goela, -3));
    px(limEsq(hx - 2, 5), hy + 14, 5, 2, c.goela);
    px(limEsq(hx - 1, 3), hy + 14, 3, 1, ramp(c.goela, 2));
  } else {
    px(limEsq(hx - 3, 7), hy + 14, 7, 1, ramp(c.escama, -4));
  }
  for (const ex of [hx - 5, hx + 2]) {
    px(limEsq(ex, 4), hy + 4, 4, 3, ramp(c.olho, -3));
    px(limEsq(ex, 3), hy + 4, 3, 2, c.olho);
    px(limEsq(ex + 1, 1), hy + 4, 1, 2, '#1a1410');
  }
  px(lim(hx - 1), hy + 9, 1, 1, ramp(c.escama, -3));                // narinas
  px(lim(hx + 1), hy + 9, 1, 1, ramp(c.escama, -3));
  // Coroa de frente: curta e aberta para cima e para fora. Longa e horizontal
  // ela virava bigode — e, em marfim, o ponto mais claro da figura inteira.
  for (const lado of [-1, 1]) {
    const tom = lado < 0 ? 1 : 0;
    traco(lim(hx + lado * 5), hy + 1, lim(hx + lado * 10), hy - 3, 2, ramp(c.espinho, tom));
    traco(lim(hx + lado * 6), hy + 4, lim(hx + lado * 10), hy, 1, ramp(c.espinho, tom));
    px(lim(hx + lado * 10), hy - 3, 1, 1, ramp(c.espinho, 3));
  }
}

// ---------------------------------------------------------------------------

/**
 * Vista de costas. Aqui a fileira de espinhos e a protagonista: desce pela
 * espinha inteira e continua na cauda, que sai pela borda de baixo. Nenhuma
 * outra criatura do elenco tem nada saindo pela base da celula.
 */
function paintCostas(kit, c, p) {
  const { px, contato, coluna, traco } = kit;
  const { rx, ry, ax, ay } = p;

  // Cauda descendo pelo centro e saindo pela borda inferior da celula.
  coluna(-26, 30, (t) => ({ c: 1 + r(t * 2), w: 12 - r(t * 6) }), c.escama, { topo: 0 });
  for (let i = 0; i < 6; i++) {
    espinho(kit, -1 + r(i * 0.4), -24 + i * 5, 4, c.espinho);
  }

  // Asas abertas vistas de tras: daqui a membrana aparece inteira, sem o corpo
  // comendo a raiz, e a envergadura e a maior das tres vistas.
  for (const lado of [-1, 1]) {
    const tom = lado < 0 ? 0 : -2;
    const asa = {
      ombro: [lado * 7 + rx, -46 + ry],
      pulso: [lado * 15 + lado * ax, -61 + ay],
      pontas: [
        [lado * 24, -54 + ay],
        [lado * 24, -44 + ay],
        [lado * 20, -37 + ay],
        [lado * 13, -33 + ay],
      ],
      ancora: [lado * 6 + rx, -38 + ry],
      tom,
    };
    asaMembrana(kit, c, asa);
    asaBraco(kit, c, asa);
  }

  pernaTraseira(kit, c, { qx: -9 + rx, qy: -29 + ry, tom: 0, peW: 13 });
  pernaTraseira(kit, c, { qx: 9 + rx, qy: -29 + ry, tom: -2, peW: 13 });

  // Dorso: largo no ombro, estreitando no quadril.
  const dorso = curva([21, 23, 24, 22, 20, 18]);
  coluna(-50 + ry, 27 - ry, (t) => ({ c: limCentro(rx, dorso(t)), w: dorso(t) }), c.dorso, { topo: 2 });
  contato(limEsq(-9 + rx, 18), -24, 18, c.dorso);

  // Escama do dorso: duas fileiras diagonais por lado, espelhadas.
  for (const lado of [-1, 1]) {
    for (let i = 0; i < 2; i++) {
      const y0 = -45 + ry + i * 8;
      traco(lim(lado * 3), y0 - 1, lim(lado * 10), y0 + 4, 1, ramp(c.dorso, 1));
      traco(lim(lado * 3), y0, lim(lado * 10), y0 + 5, 1, ramp(c.dorso, -2));
    }
  }

  // FILEIRA DE ESPINHOS pela espinha, da nuca ao quadril.
  for (let i = 0; i < 9; i++) {
    espinho(kit, -1, -48 + ry + i * 3, 4 + (i % 2), c.espinho);
  }

  bracoDianteiro(kit, c, { ox: -11 + rx, oy: -42 + ry, tom: -2, lado: -1 });
  bracoDianteiro(kit, c, { ox: 11 + rx, oy: -42 + ry, tom: -3, lado: 1 });

  // Pescoco de costas e a nuca: sem olhos, a coroa de chifres e a crista sao
  // tudo o que identifica a cabeca daqui.
  const topoP = -62 + p.ny;
  const pwc = curva([9, 10, 12, 14, 16]);
  coluna(topoP, -46 - topoP, (t) => ({
    c: limCentro(p.nx * pesoPescoco(t) * 0.6, pwc(t)),
    w: pwc(t),
  }), c.dorso, { topo: 2 });
  for (let i = 0; i < 5; i++) {
    espinho(kit, -1, topoP + 4 + i * 3, 3 + i, c.espinho);
  }

  const hx = r(p.nx * 0.6);
  const hy = -70 + p.ny;
  coluna(hy, 9, (t) => ({ c: limCentro(hx, 13 - r(t * 1)), w: 13 - r(t * 1) }), c.escama, { topo: 2 });
  contato(limEsq(hx - 6, 12), hy + 9, 12, c.escama);
  for (const lado of [-1, 1]) {
    const tom = lado < 0 ? 1 : 0;
    traco(lim(hx + lado * 4), hy + 1, lim(hx + lado * 10), hy - 2, 2, ramp(c.espinho, tom));
    traco(lim(hx + lado * 5), hy + 5, lim(hx + lado * 10), hy + 1, 1, ramp(c.espinho, tom));
  }
}

// ---------------------------------------------------------------------------

/**
 * Abatido. O corpo achata no chao, o pescoco se estende e UMA ASA FICA ABERTA
 * e esparramada, sem forca — e o unico quadro em que a asa pode passar da
 * largura toda, porque uma criatura no chao ja nao disputa espaco com os
 * vizinhos do tabuleiro. A silhueta deitada tem de ser inconfundivel: o
 * jogador precisa saber, de relance, que o dragao caiu.
 *
 * A versao anterior era uma caixa deitada com uma listra clara. Nos 55 px do
 * tabuleiro isso lia como pedra, nao como dragao: faltavam a asa, a coroa e a
 * cauda, que sao os tres sinais que o jogador aprendeu a reconhecer nos outros
 * quadros.
 */
function paintCaido(kit, c, dir) {
  const { px, contato, traco } = kit;
  const sp = dir === 'back' ? -1 : 1;
  // A celula e ASSIMETRICA e o contorno automatico come mais 1 px: a janela
  // util e [-25, 24], entao qualquer peca espelhada tem de caber em +-24.
  const P = (x) => lim(Math.max(-24, Math.min(24, x)) * sp);
  // Espelhar um RETANGULO nao e espelhar o seu x: a largura continua crescendo
  // para a direita, entao o canto que vira esquerdo e o outro. Sem isto as
  // placas do ventre saiam 15 px fora da celula na vista de costas, por cima
  // do sprite vizinho.
  const R = (x, w) => limEsq(sp < 0 ? -(x + w) : x, w);

  // 1. Cauda, estendida no chao do lado oposto a cabeca.
  faixa(kit, P(-12), P(-24), (t) => ({ c: -5 + t * 2, h: 8 - r(t * 5) }), ramp(c.escama, -1));
  for (let i = 0; i < 3; i++) espinho(kit, P(-14 - i * 4), -8 + i, 3 - i, c.espinho, sp);

  // 2. Asa aberta, caida e esparramada sobre o chao.
  asaMembrana(kit, c, {
    ombro: [P(-3), -15],
    pulso: [P(-8), -21],
    pontas: [[P(-24), -12], [P(-23), -5], [P(-17), -2], [P(-10), -2]],
    ancora: [P(-4), -7],
    tom: -1,
  });
  asaBraco(kit, c, { ombro: [P(-3), -15], pulso: [P(-8), -21], tom: -1 });

  // 3. Massa do corpo, achatada: morro baixo, nao caixa.
  const corpoC = curva([-5, -8, -10, -9, -7]);
  const corpoH = curva([9, 13, 15, 12, 9]);
  faixa(kit, P(-13), P(8), (t) => ({ c: corpoC(t), h: corpoH(t) }), c.escama);
  contato(R(-13, 22), -1, 22, c.escama);

  // Fileira de espinhos acompanhando o lombo caido.
  for (let i = 0; i < 5; i++) {
    const t = (i + 0.5) / 5;
    espinho(kit, P(r(-11 + t * 20)), r(corpoC(t) - corpoH(t) / 2), 3, c.espinho, sp);
  }
  // Ventre em placas, agora voltado para a camera porque o bicho tombou.
  for (let i = 0; i < 3; i++) {
    px(R(-9 + i * 7, 7), -5, 7, 2, ramp(c.ventre, 1));
    px(R(-9 + i * 7, 7), -3, 7, 1, ramp(c.ventre, -2));
  }
  // Patas dobradas sob o corpo: so os dedos aparecem.
  for (const base of [-7, 4]) {
    const fx = R(base, 8);
    px(fx, -5, 8, 4, ramp(c.escama, -2));
    px(fx, -5, 8, 1, ramp(c.escama, 0));
    px(sp < 0 ? fx : fx + 6, -3, 2, 2, ramp(c.garra, -1));
    contato(fx, -1, 8, ramp(c.escama, -2));
  }

  // 4. Pescoco estendido no chao e cabeca de lado, com o olho fechado. O S
  //    desaparece de proposito: pescoco frouxo e metade do "caiu".
  // Um degrau de sombra onde o pescoco sai do lombo: sem ele a cabeca vira
  // mais um pedaco do monte e o quadro volta a ler como pedra.
  contato(R(6, 4), -13, 4, c.escama);
  faixa(kit, P(7), P(15), (t) => ({ c: -8 + t * 1, h: 9 - r(t * 2) }), ramp(c.escama, -1));
  faixa(kit, P(15), P(24), (t) => ({ c: -8 + t * 2, h: 11 - r(t * 6) }), c.escama);
  px(R(17, 4), -10, 4, 2, ramp(c.olho, -4));               // orbita apagada
  px(R(17, 4), -10, 4, 1, '#1a1410');                      // olho fechado: uma linha
  px(R(20, 4), -3, 4, 1, ramp(c.osso, 1));                 // dentes contra o chao
  px(R(15, 9), -4, 9, 1, ramp(c.escama, -4));              // linha da mandibula no chao
  // A coroa continua la, caida para tras: e o que ainda diz "dragao" deitado.
  traco(P(18), -13, P(10), -17, 2, ramp(c.espinho, 1));
  traco(P(17), -11, P(9), -13, 2, c.espinho);
  traco(P(16), -8, P(11), -9, 1, ramp(c.espinho, 1));
}

// ---------------------------------------------------------------------------

/**
 * SILHUETA: unica figura do elenco que se ergue nas duas patas traseiras com
 * um pescoco em S acima de tudo, uma coroa de chifres varrida para tras e um
 * par de asas abertas em leque que passa da largura do proprio corpo.
 *
 * DRAGAO VERDE JOVEM (SRD) — criatura Grande, a maior do elenco, 73 px de
 * coroa a garra contra os 58 px do humano e os 41 do goblin. Essa diferenca de
 * tamanho e o unico recurso que o tabuleiro tem para dizer, sem texto, que
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
 * O cone de sopro nao pode nascer do centro do quadrado: num sprite de 73 px a
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
    // Caido, o focinho fica deitado no chao, na ponta da celula: y=-6 e o meio
    // da cabeca tombada, nao os pes.
    return { x: 24 * espelho, y: -6, aberta: false };
  }
  const p = poseOffsets(pose);
  // `aberta` NAO e "a mandibula esta aberta": no `hurt` ela tambem abre, e um
  // rugido de dor, nao um sopro. So o quadro 1 do attack autoriza o cone.
  const aberta = pose.kind === 'attack' && pose.frame === 1;
  if (dir === 'side') {
    return { x: lim(5 + p.nx + 14), y: -71 + p.ny + 11 + (p.boca ? 3 : 0), aberta };
  }
  // De frente e de costas a boca fica no eixo: o cone sai na direcao da camera.
  return { x: r(p.nx * 0.6), y: -70 + p.ny + 14 + (p.boca ? 3 : 0), aberta };
}
