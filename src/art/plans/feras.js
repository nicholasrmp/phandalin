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
//   coruja-urso  66–72  Grande, a faixa 66–75 do contrato (medido)
//   urso         52–58 na cernelha, 47 de comprimento
//   javali       35–38 de garupa, 48 de comprimento
//   rato gigante 21–26
//   morcego      29–30 de altura por 47 de envergadura
//   stirge       23 de altura por 35 de envergadura
//   Para o morcego e o stirge a ALTURA não é a medida: eles voam, e o que
//   informa o tamanho é a envergadura contra a célula. O morcego vai de borda
//   a borda; o stirge fica em pouco mais da metade dela. Os dois também param
//   acima da linha do chão — 8 px o morcego, 15 o stirge — e essa folga é a
//   única coisa que diz "está no ar" num quadro parado.

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
  if (w < 5 || h < 2) return;
  const esc = ramp(cor, -2);
  const luz = ramp(cor, 1);
  for (let c = 2; c < w - 2; c += passo) {
    // Cada mecha é QUEBRADA: dois ou três trechos curtos com folga entre eles,
    // e a fase depende da coluna. Mecha inteira, de borda a borda e sempre no
    // mesmo passo, não lê como pelo: lê como veludo cotelê, e esse listrado
    // vertical regular era metade do motivo de a coruja-urso parecer gente de
    // pijama. As contas de fase são aritmética de inteiros de propósito — a
    // folha de sprites tem de sair idêntica a cada build.
    // ATENÇÃO: `y` é negativo neste sistema (tudo se mede para cima a partir
    // da linha do chão) e o `%` do JavaScript devolve resto NEGATIVO para
    // operando negativo. Sem o `+ n) % n` a altura do trecho saía negativa, o
    // avanço do laço saía zero e a folha de sprites travava o build num laço
    // infinito. Custou uma hora da primeira vez.
    const mod = (a, n) => ((a % n) + n) % n;
    const fase = mod(c * 7, 5);
    let yy = y + mod(fase, 3);
    while (yy < y + h) {
      const seg = Math.min(2 + mod(c + yy, 4), y + h - yy);
      px(x + c, yy, 1, seg, esc);
      px(x + c + 1, yy, 1, seg, luz);
      yy += seg + 1 + mod(fase, 2);
    }
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
 * Garra em foice: desce reta e encurva para o lado na ponta.
 *
 * `garras()` acima resolve unha de rato e casco de javali — dois pixels que
 * dizem "tem unha aqui". A coruja-urso precisa de outra coisa: na referência a
 * garra dianteira é quase do tamanho da própria mão e o gancho dela é metade
 * da ameaça da figura. Garra reta de dois pixels lê como unha de pé humano, e
 * foi parte do motivo de a criatura antiga parecer gente de pijama.
 *
 * `lado` é +1/-1 e diz para que lado a ponta encurva — sempre para FORA do
 * corpo, porque é assim que a mão fica quando a fera arma o golpe.
 */
function garraCurva({ px }, x, y, comp, lado, cor) {
  for (let i = 0; i < comp; i++) {
    const curva = i < comp - 2 ? 0 : lado * (i - comp + 3);
    // A ponta é o tom mais claro: queratina polida pega a luz na quina. De um
    // tom só, a garra lê como dedo sujo.
    const tom = i >= comp - 2 ? ramp(cor, 2) : i === 0 ? ramp(cor, -2) : cor;
    px(x + curva, y + i, i === comp - 1 ? 1 : 2, 1, tom);
  }
}

/**
 * Penas em camadas escalonadas.
 *
 * `mechas()` corre na VERTICAL e é pelo. Pena corre em ARCOS horizontais
 * sobrepostos: cada camada tem a borda de cima clara (a curva da pena pegando
 * a luz) e uma fileira de entalhes escuros embaixo (o vão entre uma pena e a
 * vizinha), e os entalhes andam meio passo de uma camada para a outra, senão
 * saem alinhados em colunas e lêem como grade.
 *
 * Na coruja-urso as duas texturas se encostam na cintura — pena em cima, pelo
 * embaixo. É o encontro delas que faz a quimera ler como quimera em vez de
 * como um urso de cor estranha.
 */
function penas({ px }, x, y, w, linhas, cor, passo = 3, salto = 4) {
  if (w < 4) return;
  for (let i = 0; i < linhas; i++) {
    const yy = y + i * salto;
    px(x + 1, yy, w - 2, 1, ramp(cor, 2));
    for (let c = (i % 2) * 2; c < w - 1; c += passo) {
      px(x + c, yy + salto - 2, 1, 2, ramp(cor, -3));
    }
  }
}

/**
 * Asa membranosa em lâmina — a asa do stirge, que não é asa de pássaro.
 *
 * Caminha da raiz até a ponta e, em cada coluna, pinta uma fatia vertical: a
 * nervura da borda de ataque (clara, 1 px, porque é a quina que pega a luz) e
 * a membrana pendurada nela, que engorda no meio do percurso e afina até a
 * ponta. É a variação de espessura que dá a lâmina; `traco()`, de espessura
 * constante, só sabe fazer palheta.
 *
 * `rasgo` abre os furos: na referência a membrana é toda esburacada, e um
 * polígono liso lê como pétala. Os furos são pixels ESCUROS e não `cut()` —
 * numa criatura de 20 px o contorno automático circunda cada buraco vazado e
 * devolve uma pinta preta, que lê como sujeira em vez de asa gasta.
 */
function membrana({ px }, xr, yr, xp, yp, esp, cor, rasgo = 0) {
  const n = Math.max(Math.abs(xp - xr), Math.abs(yp - yr), 1);
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = r(xr + (xp - xr) * t);
    const y = r(yr + (yp - yr) * t);
    const h = Math.max(1, r(esp * sin(0.2 + 0.75 * t)));
    px(x, y, 1, h, t > 0.8 ? ramp(cor, 1) : cor);
    px(x, y, 1, 1, ramp(cor, 2));
    if (rasgo && h > 2 && i % rasgo === rasgo - 1) px(x, y + h - 2, 1, 1, ramp(cor, -3));
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

// SILHUETA: massa larga de urso erguida sobre duas pernas, encimada sem pescoço
// por uma cabeça de coruja mais larga que alta, com dois tufos de pena abrindo
// em V acima dela e um bico aberto em gancho no meio do disco facial.
//
// O QUE ESTA RODADA CONSERTOU (REFERENCIAS.md §6)
//   A figura antiga era verde-água e lia como gente de pijama. Três causas, e
//   nenhuma delas era a cor sozinha:
//   1. A cabeça tinha 20 px de largura contra 19 de altura — proporção de
//      crânio de primata. Coruja tem a cabeça MAIS LARGA QUE ALTA: agora são
//      25 por 20, e ela se apoia direto no ombro, sem pescoço.
//   2. O bico era uma cunha de 7 px fechada, escondida no disco facial. Agora
//      é o bico aberto da referência — maxila em cunha com gancho, o vão
//      escuro da boca e a mandíbula de baixo — e é o único amarelo da figura.
//   3. O corpo inteiro tinha a mesma textura. A referência é uma quimera
//      COSTURADA: pena escalonada na metade de cima (peito, ombro, braço) e
//      pelo de urso na metade de baixo, e a cintura é onde as duas se
//      encostam. `penas()` e `mechas()` existem para marcar essa costura.
function corujaUrso(kit, p, dir, pose) {
  const { px, volume, coluna, contato, traco, disco } = kit;
  const side = dir === 'side';
  const back = dir === 'back';
  // A garra é PRETA e o bico é o único amarelo. Na referência as duas coisas
  // são materiais diferentes; pintar as duas com `p.quer` espalhava oito
  // pontos de amarelo pela figura e o bico deixava de ser o ponto de leitura.
  const unha = ramp(p.couro, -2);
  // Vão da boca e língua: as duas únicas cores quentes fora do bico. São
  // literais porque não existe papel de look para "dentro da boca", e inventar
  // um campo novo só para isto espalharia a decisão por dois arquivos.
  const goela = '#5e1418';
  const lingua = '#b8545a';

  if (pose.kind === 'down') {
    // Caída, a coruja-urso tem de continuar sendo ELA: o monte é o maior do
    // arquivo, a bola da cabeça fica inteira na ponta com um tufo de pé, e a
    // costura pena/pelo sobrevive — pena na crista do monte, pelo na saia.
    volume(-17, -11, 32, 11, p.pelo, { topo: 1, base: 1 });
    mechas(kit, -15, -5, 28, 4, p.pelo, 4);
    penas(kit, -15, -10, 26, 2, ramp(p.pelo, 1), 3, 3);
    contato(-17, -1, 32, p.pelo);
    coluna(-19, 16, (t) => ({ c: 11, w: 19 * bola(t, 1.5) }), ramp(p.pelo, -1), { topo: 1 });
    disco(12, -12, 6, ramp(p.ventre, 1));
    disco(13, -13, 2, ramp(p.olho, 1));
    coluna(-13, 5, (t) => ({ c: 18, w: 7 - 4 * t }), p.quer, { topo: 1 });
    px(16, -9, 4, 1, goela);
    traco(8, -19, 4, -25, 3, p.fundo);
    volume(-21, -8, 6, 5, p.fundo, { topo: 1 });
    garraCurva(kit, -20, -6, 4, -1, unha);
    garraCurva(kit, -17, -6, 4, -1, unha);
    return;
  }

  const { atk, alto } = ritmo(pose);
  // O golpe ERGUE a fera em vez de empurrá-la para o lado: a perna continua
  // plantada no chão e estica, e é isso que dá peso a um bicho de 72 px.
  const salto = atk ? (pose.frame === 1 ? -3 : -1) : 0;
  const y0 = alto + salto;

  // A cabeça fecha em -62 por uma razão de borda, não de gosto: o tufo de pena
  // sai 9 px acima dela e no quadro 1 do ataque a fera ainda sobe 3. A última
  // linha válida da célula é y = -75 e o contorno automático quer um pixel de
  // folga, então o teto real é -74. Com -64 a ponta do tufo caía fora e
  // `fillRect` descartava a linha, o que decepa a orelha da criatura
  // exatamente no quadro em que o jogador está olhando para ela.
  const ombro = -47 + y0;
  const cabBase = -43 + y0;
  const cabTopo = -62 + y0;
  const quadril = -28 + y0;
  const pernaH = -6 - quadril;
  const cabH = cabBase - cabTopo;
  const torsoH = quadril + 3 - ombro;
  // CINTURA: a linha onde a pena acaba e o pelo começa. É uma medida de
  // desenho, não de anatomia — é ela que divide a figura nas duas metades da
  // referência.
  const cintura = ombro + 13;

  if (!side) {
    // --- pernas traseiras de urso: pelo, maciças, plantígradas -------------
    for (const s of [-1, 1]) {
      coluna(quadril, pernaH, (t) => ({ c: s * 9, w: 13 - 2 * t }),
        s < 0 ? p.pelo : ramp(p.pelo, -1), { topo: 0 });
      mechas(kit, s * 9 - 5, quadril + 2, 10, pernaH - 5, p.pelo, 3);
    }
    for (const s of [-1, 1]) {
      const fx = s * 9 - 7;
      volume(fx, -6, 14, 6, p.fundo, { topo: 1 });
      contato(fx, -1, 14, p.fundo);
      if (!back) for (let i = 0; i < 4; i++) garraCurva(kit, fx + 2 + i * 3, -4, 4, s, unha);
    }

    // Tronco em tonel, mais largo logo ABAIXO do ombro. Largo no ombro e
    // estreito embaixo daria um triângulo de super-herói; a coruja-urso é um
    // barril e é essa massa que carrega a escala de criatura Grande.
    coluna(ombro, torsoH, (t) => ({ c: 0, w: 25 + 7 * sin(Math.pow(t, 0.7)) }), p.pelo, { topo: 1 });
    mechas(kit, -13, cintura, 26, quadril + 2 - cintura, p.pelo, 4);
    contato(-12, ombro + torsoH - 1, 24, p.pelo);

    if (!back) {
      // Peito em penas escalonadas e CLARO: na referência é a mancha mais
      // clara do bicho inteiro e é o que impede o torso de ler como urso.
      coluna(ombro + 1, 15, (t) => ({ c: 0, w: 21 - 6 * t }), p.ventre, { topo: 1 });
      penas(kit, -10, ombro + 2, 20, 4, p.ventre, 3, 4);
      penas(kit, -13, ombro, 26, 1, ramp(p.pelo, 1), 3, 3);     // ombro emplumado
    } else {
      // De costas, o manto de penas desce em camadas sobre o dorso e só vira
      // pelo na cintura — a mesma costura, vista por trás.
      penas(kit, -13, ombro + 1, 26, 3, ramp(p.pelo, 1), 3, 4);
    }

    // --- braços: franja de pena no úmero, pelo no antebraço, garra enorme ---
    for (const s of [-1, 1]) {
      const bal = atk ? (s > 0 ? -6 : -2) : 0;
      // Os braços saem MAIS para fora do que o tonel do tronco: na referência
      // a fera está com eles abertos e são eles que quebram a silhueta. Colados
      // no tronco, a figura vira um bloco único — e bloco único de pé, com
      // duas pernas listradas embaixo, é exatamente a leitura de "gente de
      // pijama" que esta rodada tinha de matar.
      coluna(ombro + 2 + bal, 21, (t) => ({ c: s * (15 + 3 * t), w: 11 - 3 * t }),
        s < 0 ? ramp(p.pelo, -1) : p.fundo, { topo: 1 });
      penas(kit, s * 15 - 5, ombro + 3 + bal, 10, 3,
        s < 0 ? ramp(p.pelo, 1) : ramp(p.fundo, 1), 3, 4);
      const mx = s * 18 - 5;
      const my = ombro + 22 + bal;
      volume(mx, my, 10, 6, p.fundo, { topo: 1 });
      if (!back) for (let i = 0; i < 3; i++) garraCurva(kit, mx + 1 + i * 3, my + 5, 5, s, unha);
    }

    // --- cabeça: redonda e LARGA, apoiada direto no ombro -------------------
    coluna(cabTopo, cabH, (t) => ({ c: 0, w: 25 * bola(t, 1.5) }), p.pelo, { topo: 2 });
    mechas(kit, -10, cabTopo + 1, 20, 4, p.pelo, 4);

    if (!back) {
      // DISCO FACIAL: dois discos claros encostados, um por olho. Um disco só,
      // redondo e centrado, lê como focinho de urso; o par em coração é o que
      // a coruja tem e nenhum outro bicho do elenco tem.
      for (const s of [-1, 1]) disco(s * 5, cabTopo + 10, 7, ramp(p.ventre, 1));
      px(-12, cabTopo + 5, 3, 8, ramp(p.pelo, -2));          // borda escura do disco
      px(9, cabTopo + 5, 3, 8, ramp(p.pelo, -2));
      // Sobrancelha escura descendo do tufo até o bico: é ela que dá o olhar
      // fechado da referência em vez de cara de boneco surpreso.
      for (const s of [-1, 1]) traco(s * 11, cabTopo + 3, s * 3, cabTopo + 6, 2, ramp(p.pelo, -3));

      // Olhos GRANDES, escuros e virados para a frente — olho de predador
      // noturno, não os dois pontinhos âmbar de antes.
      for (const s of [-1, 1]) {
        disco(s * 5, cabTopo + 9, 4, ramp(p.olho, 1));
        disco(s * 5, cabTopo + 9, 2, '#140e0c');
        px(s * 5 - 2, cabTopo + 7, 1, 1, '#ffffff');
      }

      // BICO amarelo, curvo e ABERTO. Maxila em cunha, gancho na ponta, o vão
      // escuro da boca e a mandíbula menor fechando embaixo. Fechado, o bico
      // sumia dentro do disco facial e a criatura perdia a espécie.
      coluna(cabTopo + 11, 5, (t) => ({ c: 0, w: 9 - 4 * t }), p.quer, { topo: 1 });
      px(-2, cabTopo + 16, 4, 2, ramp(p.quer, -2));
      px(-3, cabTopo + 18, 6, 2, goela);
      px(-2, cabTopo + 19, 4, 1, lingua);
      coluna(cabTopo + 20, 3, (t) => ({ c: 0, w: 7 - 3 * t }), ramp(p.quer, -1), { topo: 1 });
    } else {
      mechas(kit, -10, cabTopo + 4, 20, 13, p.pelo, 4);
    }

    // TUFOS: penas erguidas, não orelhas. Por isso têm 3 px de espessura e a
    // ponta se ABRE num tufo em vez de afinar numa agulha — orelha pontuda
    // aqui puxaria a leitura para gato.
    //
    // Saem bem ABERTOS, quase a 45 graus. Eretos e paralelos, como estavam, os
    // dois viram um par de orelhas de coelho em cima de um corpo de urso: na
    // referência eles abrem em V e é esse ângulo que faz a cabeça ler como
    // cabeça de coruja mesmo de longe.
    for (const s of [-1, 1]) {
      traco(s * 5, cabTopo + 3, s * 14, cabTopo - 6, 3, s < 0 ? p.fundo : ramp(p.fundo, -1));
      px(s * 14 - (s < 0 ? 2 : 0), cabTopo - 7, 4, 3, ramp(p.pelo, -1));
      px(s * 11 - (s < 0 ? 1 : 0), cabTopo - 3, 2, 3, ramp(p.pelo, 1));
    }
    return;
  }

  // ---- de lado: a cabeça AVANÇA e o bico vira gancho de perfil ------------
  const frente = atk ? 4 : 0;

  coluna(quadril, pernaH, (t) => ({ c: -7 + 2 * t, w: 12 - 2 * t }), ramp(p.pelo, -2), { topo: 0 });
  mechas(kit, -12, quadril + 2, 9, pernaH - 5, p.pelo, 3);
  volume(-15, -6, 14, 6, ramp(p.fundo, -1), { topo: 1 });
  contato(-15, -1, 14, p.fundo);

  coluna(ombro, torsoH, (t) => ({ c: 1 - 2 * t, w: 24 + 5 * sin(Math.pow(t, 0.7)) }), p.pelo, { topo: 1 });
  mechas(kit, -10, cintura, 21, quadril + 2 - cintura, p.pelo, 4);
  penas(kit, -9, ombro + 1, 20, 3, back ? ramp(p.pelo, 1) : p.ventre, 3, 4);
  contato(-9, ombro + torsoH - 1, 19, p.pelo);
  // Tufo de cauda curto: sem ele o traseiro de perfil é uma parede reta.
  volume(-16, ombro + 16, 7, 8, p.fundo, { topo: 1 });

  coluna(quadril, pernaH, (t) => ({ c: 7 + 2 * t, w: 13 - 2 * t }), p.pelo, { topo: 0 });
  volume(2 + frente, -6, 15, 6, p.fundo, { topo: 1 });
  contato(2 + frente, -1, 15, p.fundo);
  for (let i = 0; i < 3; i++) garraCurva(kit, 9 + frente + i * 3, -4, 4, 1, unha);

  const bal = atk ? -6 : 0;
  coluna(ombro + 2 + bal, 21, (t) => ({ c: 9 + r(5 * t) + r(frente * t), w: 11 - 3 * t }),
    ramp(p.pelo, -1), { topo: 1 });
  penas(kit, 4 + frente, ombro + 3 + bal, 10, 3, ramp(p.pelo, 1), 3, 4);
  volume(9 + frente, ombro + 22 + bal, 10, 6, p.fundo, { topo: 1 });
  // Duas garras, não três: com o braço avançado no ataque a terceira, mais a
  // curva da ponta, passava da coluna x=24 e saía da célula.
  for (let i = 0; i < 2; i++) garraCurva(kit, 11 + frente + i * 4, ombro + 27 + bal, 5, 1, unha);

  coluna(cabTopo, cabH, (t) => ({ c: 5 + frente, w: 24 * bola(t, 1.5) }), p.pelo, { topo: 2 });
  disco(8 + frente, cabTopo + 10, 7, ramp(p.ventre, 1));
  traco(1 + frente, cabTopo + 3, 8 + frente, cabTopo + 6, 2, ramp(p.pelo, -3));
  disco(10 + frente, cabTopo + 8, 4, ramp(p.olho, 1));
  disco(10 + frente, cabTopo + 8, 2, '#140e0c');
  px(9 + frente, cabTopo + 6, 1, 1, '#ffffff');
  // De perfil o bico tem de SAIR da bola da cabeça, ou a coruja-urso vira um
  // urso de cara chata: a fatia de cima vai da face até a ponta e as de baixo
  // recolhem, que é o gancho. Entre a maxila e a mandíbula fica o vão da boca
  // aberta — dois pixels de saliência fechada não leem a 50 px.
  coluna(cabTopo + 11, 6, (t) => ({ c: 15 + frente - r(2 * t), w: 12 - 6 * t }), p.quer, { topo: 1 });
  px(16 + frente, cabTopo + 16, 3, 2, ramp(p.quer, -2));
  px(10 + frente, cabTopo + 17, 8, 2, goela);
  px(11 + frente, cabTopo + 18, 5, 1, lingua);
  coluna(cabTopo + 19, 3, (t) => ({ c: 13 + frente, w: 10 - 4 * t }), ramp(p.quer, -1), { topo: 1 });
  traco(2 + frente, cabTopo + 3, -5 + frente, cabTopo - 6, 3, ramp(p.fundo, -1));
  traco(9 + frente, cabTopo + 3, 16 + frente, cabTopo - 6, 3, p.fundo);
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
    // encurtam e recuam, que é o flanco do urso subindo para a virilha. O
    // `sin()` no comprimento tira o canto reto da garupa — o urso antigo lia
    // como um armário marrom porque as quatro quinas do tronco eram quinas.
    coluna(-48 + y0 + baixa, 26, (t) => ({ c: -4 + r(3 * t), w: 34 - 8 * Math.pow(t, 2) + 3 * sin(t) }),
      p.pelo, { topo: 1 });
    mechas(kit, -20, -45 + y0 + baixa, 34, 21, p.pelo, 4);
    contato(-18, -23 + y0 + baixa, 32, p.pelo);

    // CERNELHA: o bloco de músculo acima da linha das costas, sobre a pata
    // dianteira. Sem ele o urso é um lobo gordo. O topo é ABAULADO (`bola`) e
    // não chanfrado: corcunda com o topo plano é telhado, não músculo.
    coluna(-57 + y0 + baixa, 13, (t) => ({ c: 6, w: 20 * bola(Math.min(0.5, t * 0.8), 1.25) }),
      ramp(p.pelo, 1), { topo: 2 });
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

    // Orelhas: discos de pele FINA, com o miolo mais escuro para só a borda
    // ler como cartilagem. Maiores que a caixa da cabeça, de propósito — e o
    // miolo cresce junto com o disco, senão a orelha engrossa e o rato volta a
    // ser um borrão rosa com dois botões.
    for (const [ex, ey, tom] of [[16, -21, 0], [10, -22, -1]]) {
      disco(ex, ey + y0, 4, ramp(p.couro, tom));
      disco(ex + 1, ey + 1 + y0, 3, ramp(p.couro, tom - 3));
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
    disco(s * 9, -18 + y0, 4, ramp(p.couro, s < 0 ? -3 : -4));
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

// SILHUETA: quatro lâminas membranosas esticadas em cruz em volta de um corpo
// minúsculo, com uma agulha reta saindo à frente da cabeça, mais longa que o
// corpo e com a ponta virada, e uma cauda fina encurvada por baixo.
//
// O QUE ESTA RODADA CONSERTOU (REFERENCIAS.md §5)
//   1. A probóscide era um taco de dois pixels colado na frente do corpo, do
//      tamanho do corpo. Na referência ela é a ASSINATURA: sai da cabeça, é
//      mais comprida que o bicho inteiro e a ponta vira para cima num gancho.
//   2. As asas eram quatro palhetas de `traco`, espessura constante. Asa de
//      stirge é MEMBRANA: fina na raiz, larga no meio, afinando até a ponta, e
//      esburacada. `membrana()` existe só para isso.
//   3. Não havia cabeça, nem olho grande, nem tufo de pelos, nem cauda — e
//      sem a cauda e os pelos o bicho lia como mosquito de desenho animado.
function stirge(kit, p, dir, pose) {
  const { px, coluna, contato, traco, disco } = kit;
  const side = dir === 'side';
  const back = dir === 'back';

  if (pose.kind === 'down') {
    // Morto, o stirge pousa de barriga para cima com as pernas no ar: a pose de
    // insetinho, e é o único do arquivo que fica assim. A probóscide e a cauda
    // continuam inteiras porque são o que resta de identificável no monte.
    coluna(-5, 5, (t) => ({ c: 0, w: 11 - 2 * t }), p.pelo, { topo: 1, base: 1 });
    contato(-5, -1, 11, p.pelo);
    for (const [lx, ly] of [[-4, -9], [-1, -10], [2, -10], [5, -9]]) traco(lx, -5, lx + 1, ly, 1, p.fundo);
    traco(6, -4, 18, -4, 2, ramp(p.quer, -1));
    px(19, -6, 2, 2, ramp(p.quer, 1));                        // ponta virada
    for (const s of [-1, 1]) membrana(kit, s * 4, -5, s * 13, -7, 4, ramp(p.couro, -1), 3);
    traco(-6, -3, -12, -6, 1, p.couro);                       // cauda
    return;
  }

  const atk = pose.kind === 'attack';
  // O stirge só tem duas alturas de voo: pairando e investindo. A investida
  // abaixa o corpo e estica a probóscide para a altura do pescoço de quem está
  // no chão.
  const y0 = (pose.kind === 'hurt' ? 2 : 0) + (atk ? 4 : pose.kind === 'idle' && pose.frame === 1 ? -1 : 0);
  const CT = -32 + y0;
  const bat = pose.kind === 'idle' && pose.frame === 1 ? 1 : 0;

  // Corpo: pequeno e pendurado no MEIO da cruz de asas. Ele não é a figura —
  // é a escala que faz as quatro lâminas lerem como asas e não como folhas.
  coluna(CT + 2, 11, (t) => ({ c: 0, w: 11 * bola(t, 1.6) }), p.pelo, { topo: 1 });
  mechas(kit, -4, CT + 4, 8, 6, p.pelo, 3);
  contato(-3, CT + 12, 6, p.pelo);
  // Papo: a bolsa de sangue, mais clara. É o detalhe que diz o que o bicho faz.
  disco(0, CT + 9, 3, ramp(p.ventre, 1));

  // QUATRO asas, duas por flanco, esticadas para os lados como lâminas. Quatro
  // é uma contagem que nenhum outro voador do elenco tem, e vale mais que
  // qualquer detalhe de desenho dentro delas.
  for (const s of [-1, 1]) {
    const tom = s < 0 ? p.couro : ramp(p.couro, -1);
    membrana(kit, s * 4, CT + 2, s * 13, CT - 4 + bat, 6, tom, 3);
    membrana(kit, s * 4, CT + 7, s * 11, CT + 11 - bat, 5, ramp(tom, -1), 4);
  }

  // Cabeça pequena, erguida à frente do corpo.
  const hx = side ? 2 : 1;
  coluna(CT - 1, 7, (t) => ({ c: hx, w: 9 * bola(t, 1.5) }), ramp(p.pelo, 1), { topo: 1 });

  // TUFO DE PELOS ERIÇADOS no alto da cabeça: na referência o bicho é peludo
  // em volta da cara, e é esse tufo que o separa de um mosquito. Espinhos de
  // alturas desiguais — alinhados, viram pente.
  // Sete espinhos de UM pixel, não cinco grossos: grosso demais, os dois das
  // pontas sobressaem e o stirge ganha chifres.
  for (let i = 0; i < 7; i++) {
    const ex = hx - 4 + i;
    traco(ex, CT, ex + (i - 3), CT - 3 - (i % 3), 1, ramp(p.fundo, i % 2 ? -1 : 1));
  }

  if (!back) {
    // UM olho grande e redondo, não dois pontinhos: a cabeça tem 9 px e o olho
    // ocupa quase metade dela, que é a proporção da referência.
    disco(hx + 1, CT + 2, 3, ramp(p.olho, 1));
    disco(hx + 1, CT + 2, 1, '#180f10');
    px(hx, CT + 1, 1, 1, '#ffffff');

    // PROBÓSCIDE: reta, fina, mais comprida que o corpo, saindo da FRENTE da
    // cabeça — e com a ponta virada para cima num gancho. Reta até o fim ela
    // lê como palito; curva no meio ela vira bico e a criatura vira pássaro.
    // O comprimento fecha em bx + 14 + 2: a probóscite esticada do ataque já
    // encostava em x = 26 e perdia a ponta — justamente o pixel que carrega a
    // criatura inteira.
    const bx = hx + 4;
    const comp = atk ? 14 : 12;
    px(bx - 2, CT + 3, 3, 3, ramp(p.quer, 1));                 // base engrossada
    traco(bx, CT + 4, bx + comp, CT + 4, 2, p.quer);
    // Aresta escura por baixo do fuste: sem ela a probóscide é uma barra
    // chapada e lê como braço estendido em vez de tubo.
    px(bx, CT + 5, comp, 1, ramp(p.quer, -3));
    // Ponta VIRADA: sobe dois e devolve um. É o gancho da referência, e é o
    // único pixel que separa esta agulha de um palito.
    px(bx + comp, CT + 2, 2, 3, ramp(p.quer, -1));
    px(bx + comp + 1, CT + 1, 1, 2, ramp(p.quer, 2));
    px(bx + comp - 1, CT + 1, 1, 1, ramp(p.quer, 2));
  } else {
    for (let i = 0; i < 3; i++) px(-3 + i, CT + 4 + i * 2, 7 - i * 2, 1, ramp(p.pelo, -3));
  }

  // Pernas: quatro fios ARTICULADOS — coxa numa diagonal, canela em outra. O
  // joelho é um pixel de mudança de ângulo e é o que separa perna de inseto de
  // risco solto. Param a 15 px do chão, bem acima do morcego: a diferença de
  // altura de voo entre os dois é informação de tabuleiro.
  for (const [lx, joelho, pe] of [[-4, -7, -8], [-1, -3, -4], [2, 4, 5], [4, 7, 9]]) {
    traco(lx, CT + 11, joelho, CT + 14, 1, ramp(p.fundo, -1));
    traco(joelho, CT + 14, pe, CT + 17, 1, p.fundo);
    px(pe, CT + 17, 2, 1, ramp(p.quer, -2));                   // garra
  }

  // CAUDA: longa, fina e encurvada, saindo por baixo e para trás. Na
  // referência ela é mais comprida que o corpo e fecha a leitura de bicho.
  traco(-3, CT + 11, -8, CT + 14, 1, p.couro);
  traco(-8, CT + 14, -10, CT + 17, 1, ramp(p.couro, -1));
  px(-10, CT + 17, 2, 1, ramp(p.couro, -2));
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
