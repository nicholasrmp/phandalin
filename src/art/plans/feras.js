// PLANO CORPORAL: feras — as bestas que a anatomia de quatro patas iguais não
// resolve. O lobo e o mastim ficam em `quadrupede.js`; aqui mora o que tem
// asa, bico, presa curva ou um corpo que não é um tubo sobre quatro colunas.
//
// POR QUE UM ARQUIVO SEPARADO
//   Pintar a coruja-urso com o molde do lobo dá um lobo com bico. O que faz
//   uma besta ser reconhecida quando a figura chega ao jogador com ~50 px de
//   altura é a peça dela que nenhuma outra criatura do elenco tem: o disco
//   facial da coruja, a cernelha sem cauda do urso, o arco do lombo do javali,
//   a orelha maior que a própria cabeça do rato, o leque de dedos do morcego,
//   a agulha do stirge. Cada criatura aqui é construída EM VOLTA dessa peça, e
//   o resto do corpo existe para dar escala a ela.
//
// CONTRATO (ELENCO.md §3)
//   paintFeras(kit, look, dir, pose)
//     kit  { px, cut, volume, contato, coluna, traco, disco } de `../kit.js`
//     dir  'front' | 'side' | 'back'
//     pose { kind: 'idle'|'attack'|'hurt'|'down', frame: 0|1 }
//   x = 0 no centro da célula, y negativo sobe a partir da linha do chão.
//   Célula 52x80, 75 px úteis. O contorno preto é posto depois, em sheet.js —
//   nada aqui desenha contorno. A luz vem de cima e da esquerda, e quem
//   garante isso é `volume()`/`coluna()`: nenhuma peça é retângulo chapado.
//
// LIMITE DE x
//   `cx = floor(52/2) = 26`, então a coluna de pixels válida vai de x = -26 a
//   x = 25. Tudo aqui se fecha em -25..24, porque o contorno automático de
//   sheet.js precisa de um pixel de folga ou a figura sai cortada na borda da
//   célula — foi o que aconteceu com a primeira asa de morcego.
//
// ESCALA, em pixels de figura medidos na folha (ELENCO.md §3) — a comparação
// entre as criaturas é o que dá sentido de tamanho ao tabuleiro:
//   coruja-urso  72–75  Grande, a faixa 66–75 do contrato
//   urso         54–57 na cernelha, 47 de comprimento
//   javali       35–38 de garupa, 48 de comprimento
//   rato gigante 23–26
//   morcego      29–30 de altura por 47 de envergadura
//   stirge       19–20
//   Para o morcego e o stirge a ALTURA não é a medida: eles voam, e o que
//   informa o tamanho é a envergadura contra a célula. O morcego vai de borda
//   a borda; o stirge cabe num quinto dela. Os dois também param acima da
//   linha do chão — 8 px o morcego, 16 o stirge — e essa folga é a única
//   coisa que diz "está no ar" num quadro parado.

import { ramp } from '../kit.js';

const r = Math.round;

/** Meio arco de seno, para barriga de barril e lombo arqueado. */
const sin = (t) => Math.sin(Math.PI * t);

/**
 * Perfil de bola para `coluna`: 1 no meio da altura, afinando nas duas pontas.
 * `d` aperta ou alarga — 1.7 dá uma esfera com o topo levemente achatado, que
 * é o que uma cabeça redonda precisa para não virar gota.
 */
const bola = (t, d = 1.7) => {
  const u = Math.min(0.98, Math.abs(t - 0.5) * d);
  return Math.sqrt(1 - u * u);
};

/**
 * Cores por PAPEL, não por nome de campo do look.
 *
 * Os nomes do look são de origem humanoide (`outfit`, `leather`, `metal`) e
 * numa besta não querem dizer nada. Traduzir uma vez aqui deixa o resto do
 * arquivo falando de pelo, ventre e queratina — e quem escrever
 * `looks/feras.js` preenche os mesmos campos que já preenche para o lobo.
 */
function paleta(look) {
  const pelo = look.hair ?? look.outfit ?? '#6a6058';
  return {
    pelo,                                       // dorso, a cor que domina
    fundo: look.outfitDark ?? ramp(pelo, -3),   // membro, pata, orelha de trás
    ventre: look.trim ?? ramp(pelo, 2),         // peito e barriga, mais claros
    couro: look.leather ?? ramp(pelo, -2),      // pele nua: cauda, membrana
    quer: look.metal ?? '#ded0ae',              // queratina: bico, presa, garra
    olho: look.eyes ?? '#d8a23a',
  };
}

/**
 * Mechas de pelo: colunas alternadas, uma escura e uma clara.
 *
 * `volume()` e `coluna()` só variam a cor nas bordas da peça, então um dorso
 * de 30 px de largura sai como chapa lisa — é o defeito 5 do ELENCO (detalhe
 * uniforme, nenhum lugar para o olho pousar). A mecha custa duas linhas e dá
 * textura de pelo sem pintar pixel a pixel.
 */
function mechas({ px }, x, y, w, h, cor, passo = 3) {
  for (let c = 2; c < w - 2; c += passo) {
    px(x + c, y, 1, h, ramp(cor, -2));
    px(x + c + 1, y, 1, h, ramp(cor, 1));
  }
}

/**
 * Garras e unhas. A PONTA é mais clara que a base: garra é material polido e
 * pega a luz na quina. Pintada de um tom só, lê como dedo sujo.
 */
function garras({ px }, x, y, n, cor, passo = 3) {
  for (let i = 0; i < n; i++) {
    px(x + i * passo, y, 2, 2, ramp(cor, -1));
    px(x + i * passo, y, 1, 1, ramp(cor, 2));
  }
}

/**
 * Leitura da pose, igual para todas as bestas.
 *
 * `resp` é o quadro de respiração do idle: um pixel. Mais que isso e o animal
 * parado parece estar pulando no lugar.
 */
function ritmo(pose) {
  const atk = pose.kind === 'attack';
  return {
    atk,
    // A dor vai PARA BAIXO, não para trás: deslocamento horizontal se perde
    // quando a célula é espelhada para cobrir as oito orientações da grade.
    alto: (pose.kind === 'idle' && pose.frame === 1 ? -1 : 0) + (pose.kind === 'hurt' ? 2 : 0),
    // Passo das patas. No ataque o vão abre mais, porque bicho pesado avança
    // com o corpo e não com o pescoço.
    passo: atk ? (pose.frame === 1 ? 4 : 2) : pose.frame === 1 ? 1 : 0,
  };
}

// ---------------------------------------------------------------------------
// CORUJA-URSO
// ---------------------------------------------------------------------------

// SILHUETA: massa de urso erguida sobre duas pernas, encimada sem pescoço por
// uma cabeça redonda de onde saem um bico em cunha e dois tufos em diagonal,
// com os braços dianteiros pendurados à frente terminando em garras largas.
function corujaUrso(kit, p, dir, pose) {
  const { px, volume, coluna, contato, traco, disco } = kit;
  const side = dir === 'side';
  const back = dir === 'back';

  if (pose.kind === 'down') {
    // Caída, a coruja-urso tem de continuar sendo ELA: o monte é o maior do
    // arquivo e a bola da cabeça fica inteira na ponta, com um tufo de pé.
    volume(-17, -11, 32, 11, p.pelo, { topo: 1, base: 1 });
    mechas(kit, -15, -9, 28, 7, p.pelo, 4);
    contato(-17, -1, 32, p.pelo);
    coluna(-19, 16, (t) => ({ c: 11, w: 17 * bola(t) }), ramp(p.pelo, -1), { topo: 1 });
    disco(12, -12, 5, ramp(p.ventre, -1));
    coluna(-14, 5, (t) => ({ c: 17, w: 5 - 3 * t }), p.quer, { topo: 1 });
    traco(8, -19, 4, -24, 2, p.fundo);
    volume(-21, -8, 6, 5, p.fundo, { topo: 1 });
    garras(kit, -20, -5, 2, p.quer);
    return;
  }

  const { atk, alto } = ritmo(pose);
  // O golpe ERGUE a fera em vez de empurrá-la para o lado: a perna continua
  // plantada no chão e estica, e é isso que dá peso a um bicho de 74 px.
  const salto = atk ? (pose.frame === 1 ? -3 : -1) : 0;
  const y0 = alto + salto;

  // A cabeça fecha em -64 e não em -66 por uma razão de borda: o tufo sai 8 px
  // acima dela e, no quadro 1 do ataque, a fera ainda sobe 3. Com -66 a ponta
  // do tufo caía fora da célula e `fillRect` descartava a linha, o que corta a
  // orelha da criatura exatamente no quadro em que o jogador está olhando.
  const ombro = -48 + y0;
  const cabBase = -45 + y0;
  const cabTopo = -64 + y0;
  const quadril = -28 + y0;
  const pernaH = -6 - quadril;
  const cabH = cabBase - cabTopo;
  const torsoH = quadril + 3 - ombro;

  if (!side) {
    for (const s of [-1, 1]) {
      coluna(quadril, pernaH, (t) => ({ c: s * 9, w: 12 - 2 * t }),
        s < 0 ? p.pelo : ramp(p.pelo, -1), { topo: 0 });
    }
    for (const s of [-1, 1]) {
      const fx = s * 9 - 7;
      volume(fx, -6, 14, 6, p.fundo, { topo: 1 });
      contato(fx, -1, 14, p.fundo);
      if (!back) garras(kit, fx + 2, -3, 3, p.quer);
    }

    // Tronco em barril, mais largo logo ABAIXO do ombro. Largo no ombro e
    // estreito embaixo daria um triângulo de super-herói; a coruja-urso é um
    // tonel.
    coluna(ombro, torsoH, (t) => ({ c: 0, w: 23 + 7 * sin(Math.pow(t, 0.7)) }), p.pelo, { topo: 1 });
    mechas(kit, -13, ombro + 4, 26, torsoH - 6, p.pelo, 4);
    contato(-11, ombro + torsoH - 1, 22, p.pelo);

    if (!back) {
      // Plumagem do peito em galões: o ponto onde a coruja vence o urso na
      // leitura do torso.
      coluna(ombro + 3, 15, (t) => ({ c: 0, w: 15 - 5 * t }), p.ventre, { topo: 1 });
      for (let i = 0; i < 4; i++) {
        px(-5 + (i % 2), ombro + 6 + i * 3, 9 - i * 2, 1, ramp(p.ventre, -2));
      }
    } else {
      // De costas, o manto de penas desce em escamas sobre o dorso.
      for (let i = 0; i < 5; i++) px(-9 + (i % 2) * 2, ombro + 5 + i * 4, 18 - i, 1, ramp(p.pelo, -3));
    }

    for (const s of [-1, 1]) {
      const bal = atk ? (s > 0 ? -5 : -2) : 0;
      coluna(ombro + 2 + bal, 20, (t) => ({ c: s * (14 + 2 * t), w: 10 - 3 * t }),
        s < 0 ? ramp(p.pelo, -1) : p.fundo, { topo: 1 });
      const mx = s * 16 - 4;
      const my = ombro + 21 + bal;
      volume(mx, my, 9, 5, p.fundo, { topo: 1 });
      garras(kit, mx + 1, my + 4, 3, p.quer);
    }

    coluna(cabTopo, cabH, (t) => ({ c: 0, w: 20 * bola(t) }), p.pelo, { topo: 2 });

    if (!back) {
      // Disco facial: a placa clara em volta dos olhos. É a marca da criatura
      // e a razão de ela não ser um urso.
      disco(0, cabTopo + 11, 7, ramp(p.ventre, 1));
      px(-9, cabTopo + 8, 2, 6, ramp(p.pelo, -2));
      px(7, cabTopo + 8, 2, 6, ramp(p.pelo, -2));
      for (const s of [-1, 1]) {
        disco(s * 4, cabTopo + 8, 3, ramp(p.olho, 1));
        px(s * 4 - 1, cabTopo + 7, 2, 3, '#120e0c');
        px(s * 4 - 1, cabTopo + 7, 1, 1, '#ffffff');
      }
      coluna(cabTopo + 12, 7, (t) => ({ c: 0, w: 7 - 5 * t }), p.quer, { topo: 1 });
      px(-1, cabTopo + 13, 1, 1, ramp(p.quer, -3));
      px(0, cabTopo + 17, 2, 1, ramp(p.quer, -2));
    } else {
      mechas(kit, -9, cabTopo + 4, 18, 12, p.pelo, 4);
    }

    for (const s of [-1, 1]) {
      traco(s * 5, cabTopo + 2, s * 11, cabTopo - 8, 2, s < 0 ? p.fundo : ramp(p.fundo, -1));
      px(s * 10, cabTopo - 8, 2, 2, ramp(p.pelo, 1));
    }
    return;
  }

  // ---- de lado: a cabeça AVANÇA e o bico vira gancho de perfil ------------
  const frente = atk ? 4 : 0;

  coluna(quadril, pernaH, (t) => ({ c: -6 + 2 * t, w: 11 - 2 * t }), ramp(p.pelo, -2), { topo: 0 });
  volume(-14, -6, 13, 6, ramp(p.fundo, -1), { topo: 1 });
  contato(-14, -1, 13, p.fundo);

  coluna(ombro, torsoH, (t) => ({ c: 1 - 2 * t, w: 22 + 5 * sin(Math.pow(t, 0.7)) }), p.pelo, { topo: 1 });
  mechas(kit, -9, ombro + 4, 20, torsoH - 6, p.pelo, 4);
  contato(-9, ombro + torsoH - 1, 19, p.pelo);
  // Tufo de cauda curto: sem ele o traseiro de perfil é uma parede reta.
  volume(-15, ombro + 15, 6, 7, p.fundo, { topo: 1 });

  coluna(quadril, pernaH, (t) => ({ c: 6 + 2 * t, w: 12 - 2 * t }), p.pelo, { topo: 0 });
  volume(2 + frente, -6, 14, 6, p.fundo, { topo: 1 });
  contato(2 + frente, -1, 14, p.fundo);
  garras(kit, 10 + frente, -3, 3, p.quer);

  const bal = atk ? -6 : 0;
  coluna(ombro + 2 + bal, 20, (t) => ({ c: 9 + r(5 * t) + r(frente * t), w: 10 - 3 * t }),
    ramp(p.pelo, -1), { topo: 1 });
  volume(10 + frente, ombro + 21 + bal, 9, 5, p.fundo, { topo: 1 });
  // Duas garras, não três: com o braço avançado no ataque a terceira caía na
  // coluna x=26, fora da célula.
  garras(kit, 14 + frente, ombro + 24 + bal, 2, p.quer);

  coluna(cabTopo, cabH, (t) => ({ c: 5 + frente, w: 20 * bola(t) }), p.pelo, { topo: 2 });
  disco(7 + frente, cabTopo + 11, 6, ramp(p.ventre, 1));
  disco(9 + frente, cabTopo + 7, 3, ramp(p.olho, 1));
  px(8 + frente, cabTopo + 6, 2, 3, '#120e0c');
  px(8 + frente, cabTopo + 6, 1, 1, '#ffffff');
  // De perfil o bico tem de SAIR da bola da cabeça, ou a coruja-urso vira um
  // urso de cara chata: a fatia de cima vai da face até a ponta e as de baixo
  // recolhem, que é o gancho. Dois pixels de saliência não leem a 50 px.
  coluna(cabTopo + 10, 8, (t) => ({ c: 14 + frente - r(2 * t), w: 11 - 7 * t }), p.quer, { topo: 1 });
  px(11 + frente, cabTopo + 11, 1, 1, ramp(p.quer, -3));
  px(13 + frente, cabTopo + 16, 2, 1, ramp(p.quer, -2));
  traco(2 + frente, cabTopo + 3, -2 + frente, cabTopo - 7, 2, ramp(p.fundo, -1));
  traco(7 + frente, cabTopo + 3, 10 + frente, cabTopo - 8, 2, p.fundo);
}

// ---------------------------------------------------------------------------
// URSO
// ---------------------------------------------------------------------------

// SILHUETA: massa de quatro patas curtas com a cernelha corcunda mais alta que
// o quadril, a cabeça curta pendurada à frente e ABAIXO dessa corcunda, e
// nenhuma cauda.
function urso(kit, p, dir, pose) {
  const { px, volume, coluna, contato, disco } = kit;
  const side = dir === 'side';
  const back = dir === 'back';

  if (pose.kind === 'down') {
    // O maior monte do arquivo, e a corcunda continua de pé: é o que sobra do
    // urso quando ele deita.
    volume(-22, -10, 42, 10, p.pelo, { topo: 1, base: 1 });
    mechas(kit, -20, -8, 38, 6, p.pelo, 4);
    contato(-22, -1, 42, p.pelo);
    coluna(-17, 8, (t) => ({ c: -4, w: 20 - 6 * t }), ramp(p.pelo, -1), { topo: 2 });
    coluna(-13, 7, (t) => ({ c: 14 + r(2 * t), w: 13 - 3 * t }), p.pelo, { topo: 1 });
    volume(19, -10, 5, 5, ramp(p.fundo, 1), { topo: 1 });
    px(23, -9, 1, 2, '#201a16');
    for (const gx of [-19, -9, 6, 14]) garras(kit, gx, -12, 2, p.quer, 2);
    return;
  }

  const { alto, passo } = ritmo(pose);
  // No avanço o urso BAIXA a frente: ombro desce, cabeça desce o dobro. Ele
  // não se ergue nas patas traseiras aqui — isso é a coruja-urso.
  const baixa = pose.kind === 'attack' ? 3 : 0;
  const y0 = alto;

  if (side) {
    // Patas de trás primeiro: na profundidade ficam atrás do tronco.
    for (const tx of [-16 - passo, -9 - passo]) {
      coluna(-26 + y0, 26 - y0, (t) => ({ c: tx + t, w: 9 - 2 * t }), ramp(p.pelo, -2), { topo: 0 });
      volume(tx - 4, -5, 10, 5, ramp(p.fundo, -1), { topo: 1 });
      contato(tx - 4, -1, 10, p.fundo);
    }

    // Tronco: a fatia de cima é a LINHA DAS COSTAS, comprida; as de baixo
    // encurtam e recuam, que é o flanco do urso subindo para a virilha.
    coluna(-48 + y0 + baixa, 26, (t) => ({ c: -4 + r(3 * t), w: 36 - 7 * Math.pow(t, 2) }),
      p.pelo, { topo: 1 });
    mechas(kit, -20, -45 + y0 + baixa, 34, 21, p.pelo, 4);
    contato(-18, -23 + y0 + baixa, 32, p.pelo);

    // CERNELHA: o bloco de músculo acima da linha das costas, sobre a pata
    // dianteira. Sem ele o urso é um lobo gordo.
    coluna(-56 + y0 + baixa, 12, (t) => ({ c: 6, w: 19 - 5 * t }), ramp(p.pelo, 1), { topo: 2 });
    mechas(kit, -2, -54 + y0 + baixa, 16, 9, p.pelo, 3);

    for (const fx of [4 + passo, 12 + passo]) {
      coluna(-28 + y0 + baixa, 28 - y0 - baixa, (t) => ({ c: fx, w: 10 - 2 * t }), p.pelo, { topo: 0 });
      volume(fx - 5, -5, 11, 5, p.fundo, { topo: 1 });
      contato(fx - 5, -1, 11, p.fundo);
      if (!back) garras(kit, fx + 1, -7, 3, p.quer, 2);
    }

    // Cabeça pendurada à frente e ABAIXO da cernelha, nunca no alto dela.
    coluna(-46 + y0 + baixa * 2, 15, (t) => ({ c: 15 + r(2 * t), w: 14 - 3 * t }), p.pelo, { topo: 1 });
    disco(13, -48 + y0 + baixa * 2, 3, ramp(p.pelo, -1));   // orelha redonda e pequena
    disco(20, -48 + y0 + baixa * 2, 3, ramp(p.fundo, -1));
    if (!back) {
      // Focinho CURTO: três quartos do comprimento do do lobo. É a diferença
      // de cara entre os dois na mesma vista.
      volume(18, -40 + y0 + baixa * 2, 7, 7, ramp(p.ventre, -1), { topo: 1 });
      px(22, -39 + y0 + baixa * 2, 2, 3, '#201a16');
      px(18, -34 + y0 + baixa * 2, 6, 1, '#ebe3cf');
      px(19, -33 + y0 + baixa * 2, 1, 1, '#ffffff');
      px(22, -33 + y0 + baixa * 2, 1, 1, '#ffffff');
      px(15, -43 + y0 + baixa * 2, 3, 2, ramp(p.olho, -2));
      px(15, -43 + y0 + baixa * 2, 2, 1, p.olho);
    }
    return;
  }

  // ---- de frente e de costas: peito largo, corcunda atrás da cabeça -------
  coluna(-54 + y0, 13, (t) => ({ c: 0, w: 25 - 6 * t }), ramp(p.pelo, 1), { topo: 2 });
  mechas(kit, -11, -52 + y0, 22, 10, p.pelo, 3);

  coluna(-46 + y0, 26, (t) => ({ c: 0, w: 28 + 3 * sin(t) }), p.pelo, { topo: 1 });
  mechas(kit, -14, -42 + y0, 28, 19, p.pelo, 4);
  contato(-13, -21 + y0, 26, p.pelo);

  for (const s of [-1, 1]) {
    coluna(-26 + y0, 26 - y0, (t) => ({ c: s * (12 + t), w: 11 - 2 * t }),
      s < 0 ? p.pelo : ramp(p.pelo, -1), { topo: 0 });
    const fx = s * 12 - 6;
    volume(fx, -5, 13, 5, p.fundo, { topo: 1 });
    contato(fx, -1, 13, p.fundo);
    if (!back) garras(kit, fx + 2, -3, 3, p.quer);
  }

  if (back) {
    for (let i = 0; i < 4; i++) px(-10 + i, -40 + y0 + i * 4, 20 - i * 2, 1, ramp(p.pelo, -3));
    return;
  }

  coluna(-46 + y0, 17, (t) => ({ c: 0, w: 19 - 2 * t }), p.pelo, { topo: 1 });
  disco(-8, -46 + y0, 3, ramp(p.pelo, -1));
  disco(8, -46 + y0, 3, ramp(p.fundo, -1));
  volume(-4, -35 + y0, 8, 7, ramp(p.ventre, -1), { topo: 1 });
  px(-2, -34 + y0, 4, 3, '#201a16');
  px(-3, -30 + y0, 6, 1, '#ebe3cf');
  for (const s of [-1, 1]) {
    px(s * 6 - (s < 0 ? 1 : 0), -41 + y0, 3, 2, ramp(p.olho, -2));
    px(s * 6 - (s < 0 ? 1 : 0), -41 + y0, 2, 1, p.olho);
  }
}

// ---------------------------------------------------------------------------
// JAVALI
// ---------------------------------------------------------------------------

// SILHUETA: cunha rasteira e comprida, lombo em arco com crista de cerdas,
// cabeça do tamanho de um terço do corpo quase encostada no chão, e duas
// presas curvando para cima à frente do focinho.
function javali(kit, p, dir, pose) {
  const { px, volume, coluna, contato, traco } = kit;
  const side = dir === 'side';
  const back = dir === 'back';

  if (pose.kind === 'down') {
    volume(-21, -8, 36, 8, p.pelo, { topo: 1, base: 1 });
    mechas(kit, -19, -6, 32, 5, p.pelo, 3);
    contato(-21, -1, 36, p.pelo);
    coluna(-11, 6, (t) => ({ c: 16 + r(2 * t), w: 12 - 4 * t }), p.pelo, { topo: 1 });
    // As presas continuam apontando para cima: é o resto de javali que o monte
    // precisa para não ser um saco de pelo.
    traco(18, -9, 21, -14, 2, p.quer);
    traco(13, -8, 15, -12, 2, ramp(p.quer, -1));
    for (const hx of [-14, -6, 4]) px(hx, -11, 2, 3, ramp(p.fundo, -1));
    return;
  }

  const { alto, passo } = ritmo(pose);
  // A carga do javali é um empurrão com a cabeça: ela desce e avança, o lombo
  // não muda. É assim que um bicho de garupa baixa ameaça.
  const avanca = pose.kind === 'attack' ? 3 : 0;
  const y0 = alto;

  if (side) {
    for (const tx of [-15 - passo, -8 - passo]) {
      coluna(-13 + y0, 13 - y0, (t) => ({ c: tx, w: 5 - t }), ramp(p.fundo, -2), { topo: 0 });
      volume(tx - 2, -3, 5, 3, ramp(p.quer, -3), { topo: 1 });     // casco
      contato(tx - 2, -1, 5, p.fundo);
    }

    // Tronco: a fatia de cima é curta — é a CRISTA do arco, não a linha das
    // costas inteira. Embaixo o corpo abre para trás, e o resultado é a cunha
    // pesada na frente que o javali tem.
    coluna(-30 + y0, 18, (t) => ({ c: -2 - r(4 * t), w: 12 + 24 * Math.sqrt(t) }), p.pelo, { topo: 1 });
    mechas(kit, -22, -27 + y0, 32, 13, p.pelo, 3);
    contato(-20, -13 + y0, 30, p.pelo);

    // Crista de cerdas: espinhos alternados na linha do lombo. É o que faz a
    // silhueta do javali serrada, e não lisa como a do urso.
    for (let i = 0; i < 7; i++) {
      const cx0 = -7 + i * 3;
      traco(cx0, -29 + y0, cx0 + 1, -34 + y0 - (i % 2), 2, ramp(p.fundo, -1));
    }

    for (const fx of [2 + passo, 8 + passo]) {
      coluna(-14 + y0, 14 - y0, (t) => ({ c: fx, w: 6 - t }), ramp(p.fundo, -1), { topo: 0 });
      volume(fx - 2, -3, 6, 3, ramp(p.quer, -3), { topo: 1 });
      contato(fx - 2, -1, 6, p.fundo);
    }

    // Cabeça: um terço do corpo, inclinada para o chão, sem pescoço visível.
    coluna(-27 + y0 + avanca, 17, (t) => ({ c: 12 + r(4 * t), w: 15 - 3 * t }), p.pelo, { topo: 1 });
    mechas(kit, 6, -25 + y0 + avanca, 14, 12, p.pelo, 3);
    if (!back) {
      volume(18, -17 + y0 + avanca, 6, 7, ramp(p.couro, 1), { topo: 1 });   // disco do focinho
      px(21, -15 + y0 + avanca, 2, 2, ramp(p.couro, -3));
      // Presas: duas pernas de curva cada, porque uma reta lê como palito. A
      // de cá é maior — presa de javali é assimétrica no desgaste.
      traco(21, -12 + y0 + avanca, 23, -17 + y0 + avanca, 2, p.quer);
      traco(23, -17 + y0 + avanca, 22, -21 + y0 + avanca, 2, ramp(p.quer, 1));
      traco(16, -11 + y0 + avanca, 17, -15 + y0 + avanca, 2, ramp(p.quer, -1));
      px(13, -22 + y0 + avanca, 3, 2, ramp(p.olho, -2));
      px(13, -22 + y0 + avanca, 2, 1, p.olho);
      traco(9, -26 + y0 + avanca, 7, -31 + y0 + avanca, 2, p.fundo);        // orelha em folha
    }
    // Cauda fininha, reta para cima: dois pixels que dizem "porco". Nasce
    // DENTRO da garupa (x = -17) porque o contorno de sheet.js circunda cada
    // ilha de pixels, e uma cauda que não toca o corpo sai como um risco solto
    // flutuando atrás do bicho.
    traco(-17, -20 + y0, -22, -26 + y0, 1, ramp(p.couro, -1));
    px(-23, -27 + y0, 2, 2, p.fundo);
    return;
  }

  // ---- de frente: a cunha vista de topo, cabeça enchendo a figura ---------
  coluna(-32 + y0, 11, (t) => ({ c: 0, w: 20 - 4 * t }), ramp(p.pelo, 1), { topo: 2 });
  for (let i = 0; i < 5; i++) {
    traco(-6 + i * 3, -31 + y0, -6 + i * 3, -36 + y0 - (i % 2), 2, ramp(p.fundo, -1));
  }

  coluna(-26 + y0, 14, (t) => ({ c: 0, w: 22 + 4 * sin(t) }), p.pelo, { topo: 1 });
  mechas(kit, -10, -24 + y0, 20, 11, p.pelo, 3);
  contato(-10, -13 + y0, 20, p.pelo);

  for (const s of [-1, 1]) {
    coluna(-14 + y0, 14 - y0, (t) => ({ c: s * 8, w: 6 - t }),
      s < 0 ? ramp(p.fundo, -1) : ramp(p.fundo, -2), { topo: 0 });
    volume(s * 8 - 3, -3, 6, 3, ramp(p.quer, -3), { topo: 1 });
    contato(s * 8 - 3, -1, 6, p.fundo);
  }

  if (back) {
    traco(0, -22 + y0, 1, -29 + y0, 1, ramp(p.couro, -1));
    px(0, -31 + y0, 2, 2, p.fundo);
    return;
  }

  coluna(-24 + y0 + avanca, 16, (t) => ({ c: 0, w: 17 - 3 * t }), p.pelo, { topo: 1 });
  for (const s of [-1, 1]) traco(s * 8, -23 + y0 + avanca, s * 11, -29 + y0 + avanca, 2, p.fundo);
  volume(-4, -12 + y0 + avanca, 8, 6, ramp(p.couro, 1), { topo: 1 });
  px(-2, -10 + y0 + avanca, 1, 2, ramp(p.couro, -3));
  px(1, -10 + y0 + avanca, 1, 2, ramp(p.couro, -3));
  for (const s of [-1, 1]) {
    traco(s * 6, -7 + y0 + avanca, s * 8, -13 + y0 + avanca, 2, p.quer);
    traco(s * 8, -13 + y0 + avanca, s * 7, -17 + y0 + avanca, 2, ramp(p.quer, 1));
    px(s * 5 - (s < 0 ? 1 : 0), -19 + y0 + avanca, 3, 2, ramp(p.olho, -2));
    px(s * 5 - (s < 0 ? 1 : 0), -19 + y0 + avanca, 2, 1, p.olho);
  }
}

// ---------------------------------------------------------------------------
// RATO GIGANTE
// ---------------------------------------------------------------------------

// SILHUETA: fuso rasteiro pequeno cujo nariz afunila até uma ponta, com duas
// orelhas em disco maiores que a própria cabeça e uma cauda fina mais longa
// que o corpo saindo em curva.
function ratoGigante(kit, p, dir, pose) {
  const { px, coluna, contato, traco, disco } = kit;
  const side = dir === 'side';
  const back = dir === 'back';

  if (pose.kind === 'down') {
    coluna(-5, 5, (t) => ({ c: 0, w: 19 - 4 * t }), p.pelo, { topo: 1, base: 1 });
    contato(-9, -1, 19, p.pelo);
    coluna(-7, 4, (t) => ({ c: 11 + r(3 * t), w: 8 - 5 * t }), p.pelo, { topo: 1 });
    disco(7, -7, 3, ramp(p.couro, -1));
    // A cauda sobrevive inteira: é metade do que identifica o rato.
    traco(-9, -3, -17, -5, 2, p.couro);
    traco(-17, -5, -23, -2, 2, ramp(p.couro, -1));
    return;
  }

  const { alto, passo } = ritmo(pose);
  const y0 = alto;
  const estica = pose.kind === 'attack' ? 2 : 0;   // no ataque ele se joga no comprimento

  if (side) {
    // Patas: quatro fios. O rato não tem massa de membro — pata grossa o faz
    // ler como urso pequeno, e aí a escala de Miúdo vai embora.
    for (const lx of [-7 - passo, -3 - passo, 4 + passo, 8 + passo]) {
      coluna(-5 + y0, 5 - y0, () => ({ c: lx, w: 2 }), ramp(p.fundo, -2), { topo: 0 });
      px(lx - 2, -1, 4, 1, ramp(p.couro, -2));
    }

    coluna(-18 + y0, 13, (t) => ({ c: -1 + r(2 * t), w: 20 - 5 * Math.pow(t, 2) + 2 * estica }),
      p.pelo, { topo: 1 });
    mechas(kit, -10, -16 + y0, 18, 9, p.pelo, 3);
    contato(-9, -6 + y0, 18, p.pelo);

    // Focinho: afunila até DOIS pixels. É o que separa a cabeça do rato da do
    // lobo, que termina numa caixa de seis.
    coluna(-16 + y0, 11, (t) => ({ c: 11 + r(5 * t) + estica, w: 11 - 8 * t }), p.pelo, { topo: 1 });
    if (!back) {
      px(19 + estica, -8 + y0, 2, 2, ramp(p.couro, 1));
      px(16 + estica, -7 + y0, 3, 2, '#ebe3cf');                  // incisivos
      px(13 + estica, -13 + y0, 3, 2, ramp(p.olho, -2));
      px(13 + estica, -13 + y0, 2, 1, p.olho);
      // A vibrissa COMEÇA no focinho (x = 17), não a dois pixels dele: solta,
      // o contorno automático a transforma numa pinta preta no ar.
      px(17 + estica, -10 + y0, 4, 1, ramp(p.couro, 2));
    }

    // Orelhas: discos de pele fina, com o miolo mais escuro para a borda ler
    // como cartilagem. Maiores que a caixa da cabeça, de propósito.
    for (const [ex, ey, tom] of [[16, -21, 0], [10, -22, -1]]) {
      disco(ex, ey + y0, 4, ramp(p.couro, tom));
      disco(ex + 1, ey + 1 + y0, 2, ramp(p.couro, tom - 3));
    }

    traco(-10, -9 + y0, -17, -13 + y0, 2, p.couro);
    traco(-17, -13 + y0, -23, -18 + y0, 2, ramp(p.couro, -1));
    px(-24, -19 + y0, 2, 2, ramp(p.couro, -2));
    return;
  }

  coluna(-16 + y0, 12, (t) => ({ c: 0, w: 13 + 3 * sin(t) }), p.pelo, { topo: 1 });
  mechas(kit, -7, -14 + y0, 14, 9, p.pelo, 3);
  contato(-6, -5 + y0, 12, p.pelo);
  for (const s of [-1, 1]) {
    coluna(-5 + y0, 5 - y0, () => ({ c: s * 6, w: 2 }), ramp(p.fundo, -2), { topo: 0 });
    px(s * 6 - 2, -1, 4, 1, ramp(p.couro, -2));
  }
  for (const s of [-1, 1]) {
    disco(s * 9, -19 + y0, 5, ramp(p.couro, s < 0 ? 0 : -1));
    disco(s * 9, -18 + y0, 3, ramp(p.couro, s < 0 ? -3 : -4));
  }
  if (back) {
    traco(2, -8 + y0, 10, -12 + y0, 2, p.couro);
    traco(10, -12 + y0, 17, -8 + y0, 2, ramp(p.couro, -1));
    return;
  }
  coluna(-17 + y0, 14, (t) => ({ c: 0, w: 11 - 8 * t }), p.pelo, { topo: 1 });
  px(-1, -5 + y0, 2, 2, ramp(p.couro, 1));
  for (const s of [-1, 1]) {
    px(s * 4 - (s < 0 ? 1 : 0), -14 + y0, 3, 2, ramp(p.olho, -2));
    px(s * 4 - (s < 0 ? 1 : 0), -14 + y0, 2, 1, p.olho);
    px(s * 6, -7 + y0, 3, 1, ramp(p.couro, 2));
  }
  traco(4, -9 + y0, 12, -13 + y0, 2, p.couro);
  traco(12, -13 + y0, 19, -9 + y0, 2, ramp(p.couro, -1));
}

// ---------------------------------------------------------------------------
// MORCEGO GIGANTE
// ---------------------------------------------------------------------------

// SILHUETA: duas asas em leque de dedos abertas de uma borda da célula à
// outra, com um corpo minúsculo suspenso entre elas e nada tocando o chão.
function morcegoGigante(kit, p, dir, pose) {
  const { px, cut, volume, coluna, contato, traco } = kit;
  const back = dir === 'back';
  const side = dir === 'side';

  if (pose.kind === 'down') {
    // Morcego no chão é um trapo: a asa fecha em dobras e o que resta é um
    // monte baixo e irregular, nada parecido com o leque de antes.
    volume(-13, -6, 26, 6, p.couro, { topo: 1, base: 1 });
    contato(-13, -1, 26, p.couro);
    for (let i = 0; i < 5; i++) px(-11 + i * 5, -6, 2, 6, ramp(p.couro, -3));
    coluna(-10, 5, (t) => ({ c: 0, w: 9 - 3 * t }), p.pelo, { topo: 1 });
    traco(-4, -10, -7, -14, 2, ramp(p.couro, -1));
    traco(3, -10, 6, -14, 2, p.couro);
    return;
  }

  const atk = pose.kind === 'attack';
  // Batida de asa: no quadro 1 a PONTA desce; no ataque ela vem para a frente.
  // Sem variar a ponta, a asa parece uma placa parafusada no corpo.
  const bate = pose.kind === 'idle' && pose.frame === 1 ? 3 : 0;
  const varre = atk ? (pose.frame === 1 ? -3 : -1) : 0;
  const y0 = pose.kind === 'hurt' ? 2 : 0;

  // A asa: fatia de cima comprida (a borda de ataque, do ombro à ponta) e
  // fatias de baixo curtas (a membrana recolhendo para o corpo).
  for (const s of [-1, 1]) {
    const tom = s < 0 ? p.couro : ramp(p.couro, -1);
    coluna(-34 + y0 + bate + varre, 16, (t) => ({ c: s * r(14 - 5 * t), w: 19 - 13 * t }), tom, { topo: 1 });

    // Dedos: as varetas que esticam a membrana. Três por asa, radiando do
    // ombro — é o detalhe que separa uma asa de morcego de um pano preso. Cada
    // ponta para DENTRO da membrana: dedo passando da borda vira uma lasca
    // solta de dois pixels quando o contorno entra.
    const oy = -28 + y0;
    traco(s * 5, oy, s * 22, -33 + y0 + bate + varre, 2, ramp(p.couro, -3));
    traco(s * 5, oy, s * 15, -26 + y0 + bate, 2, ramp(p.couro, -3));
    traco(s * 5, oy, s * 10, -21 + y0 + bate, 2, ramp(p.couro, -3));
    // Festonado: as mordidas da borda de fuga, na diagonal externa da asa.
    // `cut` existe exatamente para isto — recortar em vez de pintar por cima —
    // e o recorte morde a BORDA, nunca o meio: buraco no meio da membrana lê
    // como sujeira, não como asa gasta.
    const espelha = (x) => (s > 0 ? x : -x - 2);
    cut(espelha(17), -29 + y0 + bate, 3, 3);
    cut(espelha(14), -25 + y0 + bate, 3, 3);
    px(s * 22, -33 + y0 + bate + varre, 2, 2, ramp(p.quer, -1));   // gancho da ponta
  }

  // Ombro: a massa que amarra as duas raízes de asa. Sem ela sobra uma fenda
  // de dois pixels entre a membrana e o corpo, e o contorno de sheet.js entra
  // nela e desenha uma rachadura preta no meio da criatura.
  coluna(-33 + y0, 14, (t) => ({ c: 0, w: 15 - 2 * t }), p.pelo, { topo: 1 });

  // Corpo: pequeno, peludo e pendurado no meio do leque.
  coluna(-26 + y0, 13, (t) => ({ c: 0, w: 10 - 3 * t }), p.pelo, { topo: 1 });
  mechas(kit, -5, -24 + y0, 10, 9, p.pelo, 3);
  contato(-4, -14 + y0, 8, p.pelo);

  if (back) {
    for (let i = 0; i < 3; i++) px(-4 + i, -24 + y0 + i * 4, 9 - i * 2, 1, ramp(p.pelo, -3));
  }

  coluna(-33 + y0, 8, (t) => ({ c: side ? 2 : 0, w: 10 * bola(t, 1.3) }), p.pelo, { topo: 1 });
  // Orelhas em pá, erguidas: passam a linha da asa e dizem que o bicho escuta
  // antes de ver.
  traco(side ? 0 : -4, -31 + y0, side ? -2 : -6, -36 + y0, 2, ramp(p.fundo, -1));
  traco(side ? 5 : 3, -31 + y0, side ? 7 : 5, -36 + y0, 2, p.fundo);
  if (!back) {
    const fx = side ? 3 : 0;
    px(fx - 3, -29 + y0, 2, 2, ramp(p.olho, -1));
    px(fx + 2, -29 + y0, 2, 2, ramp(p.olho, -1));
    px(fx - 1, -26 + y0, 3, 2, ramp(p.couro, 1));              // fossa nasal
    px(fx - 2, -24 + y0, 5, 1, ramp(p.pelo, -4));              // boca
    px(fx - 2, -23 + y0, 1, 1, '#ebe3cf');                     // presas
    px(fx + 2, -23 + y0, 1, 1, '#ebe3cf');
  }

  // Pés: dois ganchos pendurados. Param a 8 px do chão — é a folga que diz,
  // sem animação nenhuma, que esta criatura está no ar.
  for (const s of [-1, 1]) {
    traco(s * 3, -14 + y0, s * 5, -9 + y0, 2, ramp(p.fundo, -1));
    garras(kit, s * 5 - 1, -9 + y0, 2, p.quer, 2);
  }
}

// ---------------------------------------------------------------------------
// STIRGE
// ---------------------------------------------------------------------------

// SILHUETA: corpo de pássaro gordo flutuando, com uma agulha reta saindo à
// frente tão longa quanto ele, quatro palhetas curtas nos flancos e pernas de
// fio penduradas.
function stirge(kit, p, dir, pose) {
  const { px, volume, coluna, contato, traco, disco } = kit;
  const side = dir === 'side';
  const back = dir === 'back';

  if (pose.kind === 'down') {
    // Morto, o stirge pousa de barriga para cima com as pernas no ar: a pose de
    // insetinho, e é o único do arquivo que fica assim.
    volume(-5, -5, 11, 5, p.pelo, { topo: 1, base: 1 });
    contato(-5, -1, 11, p.pelo);
    for (const [lx, ly] of [[-4, -9], [-1, -10], [2, -10], [5, -9]]) traco(lx, -5, lx + 1, ly, 1, p.fundo);
    traco(6, -3, 15, -3, 2, ramp(p.quer, -1));
    for (const s of [-1, 1]) traco(s * 4, -4, s * 9, -6, 1, ramp(p.couro, -1));
    return;
  }

  const atk = pose.kind === 'attack';
  // O stirge só tem duas alturas de voo: pairando e investindo. A investida
  // abaixa o corpo e estica a probóscide para a altura do pescoço de quem está
  // no chão.
  const y0 = (pose.kind === 'hurt' ? 2 : 0) + (atk ? 4 : pose.kind === 'idle' && pose.frame === 1 ? -1 : 0);
  const corpoTopo = -32 + y0;
  const bat = pose.kind === 'idle' && pose.frame === 1 ? 1 : 0;

  coluna(corpoTopo, 11, (t) => ({ c: 0, w: 13 * bola(t, 1.6) }), p.pelo, { topo: 1 });
  mechas(kit, -5, corpoTopo + 2, 10, 7, p.pelo, 3);
  contato(-4, corpoTopo + 10, 8, p.pelo);
  // Papo: a bolsa de sangue. É ela que faz o corpo ler como gordo em 13 px de
  // largura.
  disco(side ? 2 : 0, corpoTopo + 7, 3, ramp(p.ventre, 1));

  // Quatro asas, duas por flanco, curtas e rígidas. Quatro é uma contagem que
  // nenhum outro voador do elenco tem — vale mais que qualquer detalhe.
  for (const s of [-1, 1]) {
    traco(s * 3, corpoTopo + 2, s * 11, corpoTopo - 3 + bat, 2, s < 0 ? p.couro : ramp(p.couro, -1));
    traco(s * 3, corpoTopo + 5, s * 12, corpoTopo + 2 - bat, 2, ramp(p.couro, -2));
    px(s * 11, corpoTopo - 3 + bat, 2, 1, ramp(p.couro, 2));
  }

  if (!back) {
    // Probóscide: reta, de dois pixels de espessura, do comprimento do corpo.
    // Qualquer curva nela e a criatura vira pássaro.
    const bx = side ? 5 : 2;
    traco(bx, corpoTopo + 5, bx + (atk ? 13 : 11), corpoTopo + 5, 2, p.quer);
    px(bx + (atk ? 13 : 11), corpoTopo + 5, 2, 2, ramp(p.quer, -2));
    px(bx - 1, corpoTopo + 4, 2, 3, ramp(p.quer, 1));          // base engrossada
    for (const s of side ? [1] : [-1, 1]) {
      px(bx - 4 + (s < 0 ? -1 : 0), corpoTopo + 2, 2, 2, ramp(p.olho, 1));
      px(bx - 4 + (s < 0 ? -1 : 0), corpoTopo + 2, 1, 1, '#ffffff');
    }
  } else {
    for (let i = 0; i < 3; i++) px(-3 + i, corpoTopo + 3 + i * 2, 7 - i * 2, 1, ramp(p.pelo, -3));
  }

  // Pernas: fios. Param a 15 px do chão, bem acima do morcego — a diferença de
  // altura de voo entre os dois é informação de tabuleiro.
  for (const [lx, dx] of [[-4, -3], [-1, -1], [2, 2], [4, 4]]) {
    traco(lx, corpoTopo + 10, lx + dx, corpoTopo + 16, 1, ramp(p.fundo, -1));
    px(lx + dx, corpoTopo + 16, 2, 1, ramp(p.quer, -2));
  }
}

// ---------------------------------------------------------------------------

const VARIANTES = {
  'coruja-urso': corujaUrso,
  urso,
  javali,
  ratoGigante,
  morcegoGigante,
  stirge,
};

/**
 * Bestas que não são quadrúpedes comuns. O lobo e o mastim continuam em
 * `quadrupede.js`; nada aqui o duplica.
 *
 * A besta é escolhida pelo campo `fera` do look. Os dois apelidos existem por
 * um motivo prático: `looks/feras.js` tem outro dono, e aceitar três nomes
 * custa uma linha e evita a folha de sprites sair com seis vultos iguais por
 * divergência de nome de campo.
 */
export function paintFeras(kit, look, dir, pose) {
  const pintar = VARIANTES[look.fera ?? look.variant ?? look.beast];
  if (pintar) return pintar(kit, paleta(look), dir, pose);
  // Sem campo `fera`, o palpite menos errado é o urso: é a besta mais genérica
  // do arquivo, e um urso no lugar de um javali ainda lê como animal grande.
  return urso(kit, paleta(look), dir, pose);
}

/** Nomes aceitos em `look.fera`, para quem escreve os looks conferir. */
export const FERAS_VARIANTES = Object.keys(VARIANTES);
