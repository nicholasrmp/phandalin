// PLANO CORPORAL: aberração e limo.
//
// Quatro criaturas moram aqui, escolhidas por `look.aberracao`:
//   'gosma'            gelatina ocre — SRD
//   'cranioFlamejante' criatura NOSSA (o monstro do módulo não está no SRD)
//   'olhoVigia'        criatura NOSSA, no papel que o nothic ocupa no encontro
//   'brotoEspinhoso'   criatura NOSSA, no papel dos blights
//
// POR QUE AS QUATRO NUM ARQUIVO
// Nenhuma delas tem esqueleto. O que elas compartilham não é anatomia, é o
// problema de desenho: sem ombro, sem quadril e sem par de pernas, a silhueta
// tem de vir de outro lugar — de uma massa que escorre, de uma chama que lambe,
// de uma única característica grande demais, de um feixe que não fecha
// contorno. É a mesma caixa de ferramentas, então é o mesmo arquivo.
//
// A REGRA QUE GOVERNA AS QUATRO: nada aqui pode ler como humanoide de fantasia.
// Onde um humanoide tem simetria, aqui tem assimetria; onde ele tem proporção,
// aqui tem uma parte grande demais; onde ele tem detalhe parelho do pé à
// cabeça, aqui tem um elemento-herói e o resto calado.
//
// Coordenadas: x = 0 no centro da célula, y negativo sobe a partir da linha do
// chão. Célula 52x80, 75 px úteis. O contorno preto entra depois, em sheet.js.

import { ramp } from '../kit.js';

const r = Math.round;

/**
 * Ruído determinístico. NÃO é `Math.random()` de propósito, mesmo sendo efeito
 * puramente visual: a folha de sprites é assada uma vez por look e o resultado
 * precisa sair igual em toda sessão. Com sorteio real, um quadro nasceria com
 * uma língua de fogo torta, o próximo não, e ninguém conseguiria reproduzir o
 * defeito para consertá-lo.
 */
function ruido(n) {
  const s = Math.sin(n * 12.9898 + 7.137) * 43758.5453;
  return s - Math.floor(s);
}

/** Ruído centrado em zero, com amplitude `amp`. */
const jitter = (n, amp) => (ruido(n) - 0.5) * 2 * amp;

/**
 * Prende o centro de uma linha para que ela não passe de x = ±24.
 *
 * Não é preciosismo: `sheet.js` põe os dois quadros da animação LADO A LADO na
 * mesma imagem, então um pixel que vaza pela direita aparece dentro do quadro
 * vizinho. E o contorno automático ainda precisa de uma coluna livre em cada
 * borda para ter onde se desenhar. Estas criaturas são as mais largas do
 * elenco — a gelatina espalhada e os galhos abertos chegam perto do limite —
 * então toda largura irregular passa por aqui.
 */
function dentro(c, w) {
  const meia = w / 2;
  return Math.max(-24 + meia, Math.min(24 - meia, c));
}

export function paintAberracao(kit, look, dir, pose) {
  switch (look.aberracao ?? (look.plan === 'gosma' ? 'gosma' : null)) {
    case 'cranioFlamejante': return pintaCranio(kit, look, dir, pose);
    case 'olhoVigia': return pintaOlho(kit, look, dir, pose);
    case 'brotoEspinhoso': return pintaBroto(kit, look, dir, pose);
    default: return pintaGosma(kit, look, dir, pose);
  }
}

// ---------------------------------------------------------------------------
// GELATINA OCRE
//
// SILHUETA: uma poça achatada de contorno irregular, duas vezes mais larga que
// alta, com o cume deslocado para um lado e filetes pendendo das bordas.
//
// A altura fica fora da faixa "Grande" da tabela de escala de propósito: o que
// comunica o tamanho desta criatura é a LARGURA que ela ocupa no quadrado, não
// a altura. Uma gelatina de 70 px de pé seria uma coluna de geleia, e leria
// como morto-vivo encapotado a 55 px de distância.
// ---------------------------------------------------------------------------

function pintaGosma(kit, look, dir, pose) {
  const { px, coluna, contato, disco } = kit;
  const geleia = look.outfit ?? '#a8822c';
  const fundo = look.outfitDark ?? '#6b4f14';
  const pelicula = look.glow ?? '#e8cd74';
  const osso = look.trim ?? '#ded2b4';
  const moeda = look.metal ?? '#c9a43c';

  // A vista muda a semente, não o corpo. Uma massa amorfa não tem frente nem
  // costas — o que ela tem é OUTRA irregularidade quando a câmera gira, e
  // repetir o mesmo recorte nas três fileiras denunciaria o truque.
  const sem = dir === 'side' ? 61 : dir === 'back' ? 131 : 11;

  if (pose.kind === 'down') {
    // Morta, ela para de pulsar: é o único quadro em que a silhueta não mexe.
    // A poça sai quase regular justamente para ler como "acabou".
    coluna(-7, 7, (t) => {
      const w = 44 - (1 - t) * 11;
      return { c: dentro(-1, w), w };
    }, ramp(geleia, -1), { topo: 1 });
    contato(-22, -1, 44, fundo);
    // O que ela comeu fica à vista quando a massa achata — é a piada do quadro.
    px(-11, -5, 10, 2, ramp(osso, -1));
    px(-12, -6, 3, 4, ramp(osso, -1));
    disco(9, -4, 3, ramp(moeda, -1));
    for (let i = 0; i < 9; i++) {
      px(-19 + i * 5, -2 - r(ruido(i * 7 + sem) * 3), 2, 1, ramp(geleia, -3));
    }
    return;
  }

  // A FASE É O PULSO. A silhueta inteira muda de proporção entre os dois
  // quadros de idle — alta e estreita, depois baixa e espalhada. Para uma
  // criatura sem membro nenhum, isso é a única animação possível: se a
  // silhueta não respirar, o sprite lê como pedra.
  const fase = pose.kind === 'attack' ? (pose.frame === 1 ? 3 : 2)
    : pose.kind === 'hurt' ? 4
      : pose.frame === 1 ? 1 : 0;
  const alt = [21, 26, 28, 23, 17][fase];
  const raio = [20, 17, 16, 19, 21][fase];

  /**
   * Perfil da massa, de cima (t=0) para a base (t=1).
   *
   * Três coisas acontecem juntas aqui, e é a soma delas que separa um limo de
   * uma pedra arredondada: a largura engorda da base para o cume sem nunca
   * repetir a linha vizinha (o jitter), o corpo tem uma onda que desloca o
   * cume para fora do meio, e o centro caminha — não há eixo de simetria.
   */
  const perfil = (t) => {
    const cheio = 0.42 + 0.58 * Math.pow(t, 0.7);
    const onda = Math.sin(t * 2.6 + fase * 0.8) * 0.07;
    const linha = r(t * (alt - 1));
    const j = jitter(linha * 3 + sem + fase * 17, 2.2);
    const w = Math.min(46, Math.max(4, raio * 2 * (cheio + onda) + j));
    const c = -2 + Math.sin(t * 2.0 + fase * 1.3) * 2.5 + j * 0.4;
    return { c: dentro(c, w), w };
  };

  coluna(-alt, alt, perfil, geleia, { topo: 2, base: 0 });

  // TRANSLUCIDEZ sem canal alfa. A borda é onde a luz atravessa pouca massa e
  // o meio é onde ela atravessa muita, então o centro é MAIS ESCURO que a
  // beirada — o contrário do que vale para um corpo opaco. Duas faixas
  // concêntricas para dentro dão essa profundidade de graça.
  coluna(-alt + 3, alt - 4, (t) => {
    const p = perfil(0.18 + t * 0.8);
    const w = Math.max(3, p.w - 9);
    return { c: p.c, w };
  }, ramp(geleia, -2), { topo: 1 });
  coluna(-alt + 6, alt - 8, (t) => {
    const p = perfil(0.32 + t * 0.66);
    const w = Math.max(3, p.w - 18);
    return { c: p.c + 1, w };
  }, fundo, { topo: 1 });

  // COISAS MEIO DIGERIDAS. Entram com dois e três degraus de sombra porque a
  // luz que chega nelas já atravessou a massa. Osso em tom cheio leria como
  // adesivo colado na frente do sprite, não como osso dentro da geleia.
  const dentroY = -r(alt * 0.36);
  px(-11, dentroY, 9, 2, ramp(osso, -2));          // diáfise
  px(-12, dentroY - 1, 3, 4, ramp(osso, -2));      // epífise mais perto da luz
  px(-3, dentroY - 1, 3, 4, ramp(osso, -3));       // a outra, mais funda
  px(-11, dentroY, 9, 1, ramp(osso, -1));          // aresta de luz no osso
  disco(8, dentroY + 2, 3, ramp(moeda, -2));
  px(7, dentroY + 1, 2, 1, ramp(moeda, -1));

  // PELÍCULA: alguns pixels da própria massa POR CIMA do osso e da moeda. Sem
  // eles o objeto fica na frente do limo em vez de dentro dele — foi o que
  // resolveu a leitura, e custa sete pixels.
  for (let i = 0; i < 8; i++) {
    const x = -13 + r(ruido(sem + i * 5) * 24);
    const y = dentroY - 2 + r(ruido(sem + i * 5 + 1) * 6);
    px(x, y, 1, 1, ramp(geleia, -1));
  }

  // Bolhas presas na superfície, pelo lado iluminado, e o único ponto
  // especular. A luz vem de cima e da esquerda, então ele mora no ombro
  // esquerdo do cume — um limo sem especular lê como massa de modelar.
  for (let i = 0; i < 5; i++) {
    const t = 0.12 + i * 0.17;
    const p = perfil(t);
    const bx = r(p.c - p.w * 0.22 + jitter(sem + i * 9, 3));
    disco(bx, -alt + r(t * alt) + 2, 1 + (i % 2), ramp(geleia, 2));
  }
  disco(r(perfil(0.22).c) - 5, -alt + 5, 3, ramp(pelicula, 2));

  // FILETES escorrendo das bordas. A borda de um limo nunca é uma curva limpa,
  // e são eles que fazem a silhueta ter farpa em vez de contorno de bolha.
  for (const lado of [-1, 1]) {
    for (let i = 0; i < 2; i++) {
      const t = 0.5 + i * 0.24;
      const p = perfil(t);
      const x = r(p.c + lado * p.w * 0.5) - (lado < 0 ? 1 : 2);
      const y = -alt + r(t * alt);
      const comp = Math.max(1, Math.min(3 + r(ruido(sem + i * 13 + (lado + 1) * 7) * 5), -y - 1));
      coluna(y, comp, (q) => {
        const w = Math.max(1, 3 - q * 1.6);
        return { c: dentro(x + 1, w), w };
      }, lado < 0 ? ramp(geleia, 1) : ramp(geleia, -1), { topo: 0 });
    }
  }

  if (fase === 3) {
    // A gelatina não dá soco: ela estende um pseudópode e desaba sobre o alvo.
    // Ele sai pela direita e sem par do outro lado — simetria mataria a ideia.
    coluna(-alt - 3, 15, (t) => {
      const w = Math.max(3, 9 - (1 - t) * 5);
      return { c: dentro(13 + (1 - t) * 8, w), w };
    }, geleia, { topo: 1 });
    px(18, -alt + 4, 3, 3, ramp(pelicula, 1));
  }

  // Sombra de contato em toda a largura da base: um limo não tem pé, ele se
  // apoia em tudo que toca.
  const base = perfil(1);
  contato(r(base.c - base.w / 2), -1, r(base.w), fundo);
}

// ---------------------------------------------------------------------------
// CRÂNIO FLAMEJANTE  (criatura nossa)
//
// SILHUETA: uma chama alta e estreita que afunila para cima, com um bulbo
// arredondado e oco suspenso no seu terço inferior, e nada tocando o chão.
//
// O "nada tocando o chão" é metade da identidade. É a única figura do elenco
// cuja silhueta não encosta na linha do chão, e a 55 px isso se lê antes de
// qualquer detalhe.
// ---------------------------------------------------------------------------

function pintaCranio(kit, look, dir, pose) {
  const { px, coluna, contato, traco, disco } = kit;
  const osso = look.skin ?? '#d8cdae';
  const cavidade = look.outfitDark ?? '#5d4e32';
  const chama = look.outfit ?? '#d4541c';
  const nucleo = look.glow ?? '#ffd24a';
  // A chama das órbitas é FRIA, contra o laranja de tudo o mais. O contraste de
  // matiz é o que põe o olhar do jogador no rosto e não na fogueira — sem ele a
  // figura é uma tocha e a cabeça desaparece dentro dela.
  const olho = look.eyes ?? '#8fe6ff';

  if (pose.kind === 'down') {
    // "Morrer", para esta coisa, é a chama apagar. O crânio cai no chão e o que
    // resta acima dele é brasa, não língua de fogo.
    coluna(-12, 12, (t) => {
      const w = 17 - t * 5;
      return { c: dentro(-2 + t * 2, w), w };
    }, ramp(osso, -1), { topo: 1 });
    contato(-11, -1, 16, osso);
    disco(-5, -7, 3, ramp(cavidade, -3));
    disco(4, -7, 2, ramp(cavidade, -3));
    for (let i = 0; i < 5; i++) px(-12 + i * 6, -2, 2, 1, ramp(chama, -2));
    return;
  }

  const fase = pose.kind === 'attack' ? (pose.frame === 1 ? 3 : 2)
    : pose.kind === 'hurt' ? 4
      : pose.frame === 1 ? 1 : 0;

  // Altura de voo. Ele SOBE e DESCE entre os quadros de idle: é o único sinal
  // de que a coisa está viva, já que não há peito que respire nem pé que mude
  // de apoio. No quadro de dor ele recua para cima e a chama encolhe.
  const voo = [20, 23, 18, 17, 22][fase];
  const altoCranio = -voo - 17;
  const altChama = [26, 30, 24, 33, 19][fase];

  /**
   * Uma casca de chama. Larga embaixo, ponta em cima, centro ondulando — e o
   * jitter por linha, que é o que impede a chama de ler como triângulo.
   *
   * A CHAMA É A SILHUETA desta criatura, então ela é desenhada em três cascas
   * (externa escura e larga, média, núcleo claro colado no osso): uma casca só
   * dá uma mancha chapada, e é no degrau entre elas que o fogo aparece.
   */
  const casca = (altura, baseY, largura, cor, s) => {
    coluna(baseY - altura, altura, (t) => {
      const sobe = 1 - t;
      const w = Math.max(1, largura * Math.pow(t, 0.62)
        + jitter(r(t * altura) * 5 + s * 29, 1.8));
      const c = Math.sin(sobe * 4.4 + s) * 3.4 * sobe
        + jitter(r(t * altura) * 3 + s * 11, 1.2);
      return { c: dentro(c, w), w };
    }, cor, { topo: 1 });
  };

  casca(altChama + 6, -voo - 2, 23, ramp(chama, -2), fase + 1);
  casca(altChama, -voo - 4, 16, chama, fase + 5);
  casca(Math.max(6, altChama - 9), -voo - 6, 11, nucleo, fase + 9);

  // Duas ou três línguas soltas, em ângulo, saindo da coroa. Chama vertical e
  // simétrica lê como tocha presa na parede, não como criatura em movimento.
  for (let i = 0; i < 3; i++) {
    const lx = -7 + r(ruido(fase * 7 + i * 17) * 14);
    const ly = altoCranio - r(ruido(fase * 7 + i * 17 + 1) * 6);
    const comp = 6 + r(ruido(fase * 7 + i * 17 + 2) * 9);
    traco(lx, ly, lx + r(jitter(fase * 3 + i, 7)), ly - comp, 2,
      i === 1 ? nucleo : ramp(chama, 1));
  }

  // ---- o crânio ------------------------------------------------------------
  // Tudo nele está um bocado errado de propósito: a caixa craniana é grande
  // demais para a mandíbula, a órbita esquerda é maior que a direita e a sutura
  // corre torta. Crânio correto é prop de Halloween; crânio errado é aberração.
  const topo = altoCranio;
  coluna(topo, 17, (t) => {
    const w = t < 0.5
      ? 12 + t * 12                  // a caixa engorda até a maçã do rosto
      : 18 - (t - 0.5) * 14;         // e desaba na mandíbula
    const c = dir === 'side' ? 1 + t * 2 : -1 + t * 0.5;
    return { c: dentro(c, w), w };
  }, osso, { topo: 2 });

  // Sutura: corre de um lado, nunca pelo meio. Uma linha pelo eixo criaria
  // exatamente a simetria que estamos evitando.
  traco(-4, topo + 1, 2, topo + 4, 1, ramp(osso, -2));
  px(2, topo + 4, 4, 1, ramp(osso, -2));

  if (dir === 'back') {
    // Pela nuca não há rosto: só a caixa, a sutura e o occipital. A chama fica
    // com o quadro todo, o que é exatamente o que queremos nesta fileira.
    px(-5, topo + 7, 11, 1, ramp(osso, -2));
    coluna(topo + 10, 6, (t) => {
      const w = 10 - t * 3;
      return { c: dentro(0, w), w };
    }, ramp(osso, -1), { topo: 1 });
    disco(-3, topo + 5, 2, ramp(osso, 2));
    traco(-10, topo + 13, -7, topo + 3, 2, ramp(chama, 1));
    traco(9, topo + 12, 7, topo + 5, 2, chama);
    return;
  }

  if (dir === 'side') {
    // Uma órbita só, mais o arco zigomático e o maxilar projetado. São eles que
    // impedem um perfil de crânio de virar um ovo com dentes.
    disco(2, topo + 7, 4, ramp(cavidade, -2));
    disco(3, topo + 7, 2, olho);
    px(2, topo + 6, 1, 1, ramp(olho, 3));
    traco(-1, topo + 9, 5, topo + 10, 1, ramp(osso, -2));
    px(6, topo + 10, 3, 2, ramp(osso, 1));
    for (let d = 0; d < 4; d++) px(1 + d * 2, topo + 13, 1, 2, ramp(osso, 2));
    px(0, topo + 13, 9, 1, ramp(cavidade, -2));
    px(0, topo + 15, 8, 2, ramp(osso, -1));
    traco(-9, topo + 11, -6, topo + 3, 2, ramp(chama, 1));
    return;
  }

  // Órbitas: a esquerda é um pixel maior. A assimetria vem antes de qualquer
  // outra informação quando o jogador olha uma cabeça.
  disco(-5, topo + 7, 4, ramp(cavidade, -2));
  disco(5, topo + 7, 3, ramp(cavidade, -2));
  px(-8, topo + 4, 6, 1, ramp(osso, -1));        // arco supra-orbital
  px(3, topo + 4, 5, 1, ramp(osso, -1));
  disco(-5, topo + 7, 2, olho);
  disco(5, topo + 7, 1, olho);
  px(-6, topo + 6, 1, 1, ramp(olho, 3));
  px(4, topo + 6, 1, 1, ramp(olho, 2));

  px(-1, topo + 10, 3, 3, ramp(cavidade, -3));   // abertura nasal
  px(-1, topo + 10, 1, 2, ramp(cavidade, -1));

  // Arcada com falha. Dentadura completa e regular lê como máscara de plástico.
  for (const d of [-5, -3, 0, 2, 5]) px(d, topo + 14, 2, 2, ramp(osso, 2));
  px(-6, topo + 13, 13, 1, ramp(cavidade, -2));  // sombra de contato da arcada
  px(-5, topo + 16, 10, 1, ramp(osso, -2));      // mandíbula

  // A chama passa POR CIMA do osso em dois pontos. Sem isso ela fica atrás do
  // crânio como pano de fundo, e o crânio não está "envolto" em nada.
  traco(-11, topo + 12, -8, topo + 2, 2, ramp(chama, 1));
  traco(9, topo + 11, 7, topo + 4, 2, chama);
  px(-7, topo, 3, 2, nucleo);
}

// ---------------------------------------------------------------------------
// OLHO VIGIA  (criatura nossa)
//
// SILHUETA: um vulto agachado de dorso arqueado e braços longos e desiguais
// quase no chão, encimado por uma cabeça redonda grande demais para ele, onde
// há um único domo circular.
//
// A proporção é o inimigo aqui. Se a cabeça couber no corpo, isto vira
// "humanoide curvado" e falha o teste contra o goblin corcunda.
// ---------------------------------------------------------------------------

function pintaOlho(kit, look, dir, pose) {
  const { px, coluna, contato, traco, disco } = kit;
  const pele = look.skin ?? '#8e7f8c';
  const peleEsc = look.outfitDark ?? '#4a3f4c';
  const esclera = look.outfit ?? '#e6dcc4';
  const iris = look.eyes ?? '#c8461e';
  const pupila = look.trim ?? '#150f12';

  const ataque = pose.kind === 'attack';
  const dor = pose.kind === 'hurt';

  if (pose.kind === 'down') {
    // Caído, o olho continua sendo a coisa que o jogador procura no quadro:
    // aberto, embaçado e maior que o resto do corpo largado.
    coluna(-9, 9, (t) => {
      const w = 26 - t * 8;
      return { c: dentro(-5 + t * 3, w), w };
    }, peleEsc, { topo: 1 });
    contato(-18, -1, 25, peleEsc);
    disco(9, -8, 7, ramp(esclera, -2));
    disco(9, -8, 3, ramp(iris, -3));
    px(8, -9, 2, 2, pupila);
    px(7, -11, 2, 1, ramp(esclera, 2));
    traco(-13, -10, -19, -4, 2, peleEsc);          // o braço comprido largado
    traco(12, -6, 18, -2, 2, ramp(peleEsc, -1));
    return;
  }

  // `curva` é o quanto o dorso se projeta para a frente. Ele muda em TODA pose:
  // é a respiração desta criatura, porque ela não tem peito que infle.
  const curva = ataque ? (pose.frame === 1 ? 5 : 3) : dor ? -2 : pose.frame === 1 ? 1 : 2;
  const estreito = dir === 'side' ? 0.62 : 1;

  // ---- pernas: curtas e dobradas, com o peso todo adiantado ----------------
  const passo = ataque ? 3 : pose.frame === 1 ? 1 : 0;
  for (const lado of [-1, 1]) {
    const quadril = lado < 0 ? -7 : 5;
    const pe = quadril + lado * 2 + lado * passo;
    coluna(-15, 12, (t) => {
      const w = Math.max(3, (6 - t * 2) * estreito + (dir === 'side' ? 2 : 0));
      return { c: dentro(quadril + (pe - quadril) * t, w), w };
    }, lado < 0 ? peleEsc : ramp(peleEsc, -1), { topo: 1 });
    contato(pe - 2, -4, 5, peleEsc);
    px(pe - 3, -3, 7, 3, ramp(peleEsc, 1));        // pé chato e espalmado
    px(pe - 3, -1, 7, 1, ramp(peleEsc, -3));       // sombra sob os dedos
  }

  // ---- tronco: a espinha é um ARCO, não uma coluna -------------------------
  // É isso que faz o vulto ler como coisa que anda curvada em vez de humano de
  // ombro largo. A corcova fica de UM lado; centrada, ela viraria mochila.
  coluna(-32, 18, (t) => {
    const w = (13 + t * 5) * estreito + (dir === 'side' ? 4 : 0);
    return { c: dentro(curva * (1 - t) * 1.6 - 2 + t * 2, w), w };
  }, pele, { topo: 1, base: 1 });
  coluna(-34, 9, (t) => {
    const w = Math.max(4, (12 - t * 4) * estreito);
    return { c: dentro(-4 + curva, w), w };
  }, ramp(pele, 1), { topo: 2 });
  contato(-9, -15, 17, pele);

  // Costelas à mostra de um lado só: hierarquia de leitura. O lado iluminado
  // fica calado para que o olho não tenha onde parar antes de chegar na cabeça.
  if (dir !== 'side') {
    for (let i = 0; i < 4; i++) px(2 + i, -28 + i * 3, 6 - i, 1, ramp(pele, -3));
  }

  // ---- braços: longos demais para o tronco, e desiguais entre si -----------
  // O esquerdo quase raspa o chão, o direito para na altura do joelho. Dois
  // braços iguais no mesmo nível é a pose de prancha de boneco de vestir.
  // O braço longo sai BEM para fora do quadril. Colado ao corpo ele funde com
  // a perna e a silhueta perde o membro inteiro — era o defeito do primeiro
  // traçado, e o conserto é horizontal, não de cor.
  const alcance = ataque ? 3 : 0;
  traco(-9, -31, -16 - alcance, -18, 4, ramp(pele, -1));
  traco(-16 - alcance, -18, -17 - alcance, -5, 3, ramp(pele, -2));
  px(-19 - alcance, -5, 5, 4, ramp(pele, -1));
  // Os dedos param em y = -1: encostar na linha do chão faria a mão ler como
  // terceiro pé, e o que queremos é "quase raspa", não "apoia".
  for (let d = 0; d < 3; d++) px(-19 - alcance + d * 2, -2, 1, 2, ramp(pele, -3));

  traco(8, -29, 14 + alcance, -20, 3, ramp(pele, -2));
  traco(14 + alcance, -20, 13 + alcance, -12, 3, ramp(pele, -3));
  px(12 + alcance, -13, 5, 4, ramp(pele, -2));
  for (let d = 0; d < 3; d++) px(12 + alcance + d * 2, -10, 1, 3, ramp(pele, -4));

  // ---- cabeça: grande demais, redonda, e sem rosto além do olho ------------
  const inclina = dor ? -2 : ataque ? 2 : 0;
  const cabX = curva + inclina;
  coluna(-50, 19, (t) => {
    // Círculo achatado: estreita nas duas pontas, cheia no meio. Caixa com
    // canto cortado não convence; o seno resolve em uma linha.
    const w = (10 + Math.sin(Math.min(1, t * 1.02) * Math.PI) * 11) * (dir === 'side' ? 0.92 : 1);
    return { c: dentro(cabX + (dir === 'side' ? 2 : 0), w), w };
  }, pele, { topo: 2, base: 1 });
  contato(-8 + r(cabX), -32, 16, pele);

  if (dir === 'back') {
    // De costas o olho desaparece e a cabeça fica sem leitura nenhuma — então
    // aqui a informação é a NUCA: a cicatriz onde o segundo olho não cresceu, e
    // o rego fundo da espinha arqueada descendo pelo dorso.
    disco(r(cabX) + 2, -41, 4, ramp(peleEsc, -1));
    disco(r(cabX) + 2, -41, 2, ramp(pele, -3));
    px(r(cabX) - 6, -45, 8, 1, ramp(pele, -3));
    for (let i = 0; i < 9; i++) {
      px(r(curva * (1 - i / 9) * 1.6) - 1, -31 + i * 2, 2, 1, ramp(pele, -4));
      px(r(curva * (1 - i / 9) * 1.6) + 1, -31 + i * 2, 1, 1, ramp(pele, 1));
    }
    return;
  }

  // ---- O OLHO. É A MARCA REGISTRADA E O ELEMENTO-HERÓI --------------------
  // Metade da cabeça, quatro anéis: órbita, esclera, íris, pupila. Disco de cor
  // única lê como botão costurado; é o degrau entre os anéis que faz um olho.
  const ox = r(cabX) + (dir === 'side' ? 5 : 1);
  const oy = -42;
  const raio = dir === 'side' ? 6 : 7;

  disco(ox, oy, raio + 1, ramp(peleEsc, -2));
  disco(ox, oy, raio, esclera);

  // Veias na esclera. Sem elas o olho sai de porcelana, e porcelana não dói.
  for (let i = 0; i < 5; i++) {
    const a = ruido(i * 13 + 3) * Math.PI * 2;
    traco(ox + r(Math.cos(a) * (raio - 1)), oy + r(Math.sin(a) * (raio - 1)),
      ox + r(Math.cos(a) * 3), oy + r(Math.sin(a) * 3), 1, ramp(iris, -1));
  }

  // A íris abre e fecha entre os quadros: é a segunda animação da criatura, e a
  // que o jogador percebe mesmo com o sprite a 55 px.
  const abre = dor ? 3 : ataque ? 5 : 4;
  disco(ox, oy, abre, iris);

  // Pupila em FENDA VERTICAL. Redonda leria como olho de bicho simpático.
  const fenda = ataque ? 4 : dor ? 1 : pose.frame === 1 ? 2 : 3;
  px(ox - 1, oy - fenda, 2, fenda * 2 + 1, pupila);
  px(ox - 1, oy - fenda, 1, fenda * 2 + 1, ramp(pupila, 1));

  // Pálpebra pesada: a luz vem de cima, então o que ela produz é a sombra da
  // própria pálpebra caindo sobre o terço alto do globo. É esse degrau que
  // enfia o olho na cabeça em vez de deixá-lo colado por fora.
  for (let i = -raio; i <= raio; i++) {
    const alturaPalpebra = r(2 - Math.abs(i) * 0.16) + 1;
    px(ox + i, oy - raio + r(Math.abs(i) * 0.55), 1, alturaPalpebra, ramp(peleEsc, -1));
  }
  px(ox - r(raio * 0.55), oy - r(raio * 0.55), 2, 2, ramp(esclera, 3));
  px(ox - 2, oy - 2, 1, 1, '#ffffff');

  // Boca: uma fenda sem lábio, torta, bem abaixo do olho. Não precisa de mais
  // nada — o rosto já está todo tomado e qualquer detalhe extra rouba o olho.
  const bx = r(cabX) - 4 + (dir === 'side' ? 3 : 0);
  px(bx, -34, 9, 2, ramp(peleEsc, -2));
  for (let d = 0; d < 4; d++) px(bx + 1 + d * 2, -34, 1, 1, ramp(esclera, -1));
}

// ---------------------------------------------------------------------------
// BROTO ESPINHOSO  (criatura nossa)
//
// SILHUETA: um feixe esgalhado de hastes finas e tortas, mais largo em cima que
// em baixo, com farpas em ângulos irregulares e um membro mais comprido que o
// outro.
//
// É a única figura do elenco cuja silhueta NÃO FECHA contorno: tem buraco no
// meio. Preenchida de preto, ela é uma teia de linhas, não uma mancha. Isso é
// o que a separa de tudo o mais no tabuleiro a 55 px.
// ---------------------------------------------------------------------------

function pintaBroto(kit, look, dir, pose) {
  const { px, coluna, contato, traco, disco } = kit;
  const casca = look.outfit ?? '#5a4326';
  const cascaEsc = look.outfitDark ?? '#33230f';
  const seiva = look.trim ?? '#6e7a34';
  // A brasa é o que mora dentro do feixe. É o único ponto quente e saturado da
  // criatura, e a razão de ela não ler como arbusto morto.
  const brasa = look.glow ?? '#c2531c';

  const sem = dir === 'side' ? 203 : dir === 'back' ? 307 : 101;

  if (pose.kind === 'down') {
    // Quebrado, ele não tomba: DESMONTA. O feixe se abre em gravetos soltos e a
    // brasa do meio é a última coisa a apagar.
    // O graveto tem 2 px de espessura, então a ponta fica presa a x = ±22 e a
    // y = -2: o traço cresce para a direita e para baixo a partir do ponto, e
    // sem essa trava ele invade o quadro vizinho da folha e a faixa do chão.
    for (let i = 0; i < 10; i++) {
      const x0 = -17 + r(ruido(sem + i * 7) * 32);
      const y0 = -2 - r(ruido(sem + i * 7 + 1) * 5);
      const x1 = Math.max(-22, Math.min(22, x0 + r(jitter(sem + i * 11, 8))));
      traco(x0, y0, x1, y0 - r(ruido(sem + i * 7 + 2) * 4), 2, i % 3 ? cascaEsc : casca);
    }
    contato(-17, -1, 33, cascaEsc);
    disco(-1, -4, 3, ramp(brasa, -2));
    px(-2, -5, 2, 1, brasa);
    return;
  }

  // `bal` é o balanço do feixe. Como ele não tem articulação, a animação é o
  // feixe inteiro torcendo — e isso muda a silhueta, que é o que importa.
  const bal = pose.kind === 'attack' ? (pose.frame === 1 ? 4 : 2)
    : pose.kind === 'hurt' ? -3 : pose.frame === 1 ? 1 : 0;

  // ---- o feixe -------------------------------------------------------------
  // Quatro hastes que sobem torcendo e se CRUZAM. Não é um tronco com galhos: é
  // o cruzamento que produz a silhueta esgalhada. Cada haste tem espessura e
  // altura diferentes, porque quatro hastes iguais leriam como pilar estriado.
  const hastes = [
    { base: -3, topo: -9, alt: 34, esp: 4, cor: casca },
    { base: 2, topo: 8, alt: 37, esp: 3, cor: ramp(casca, -1) },
    { base: 0, topo: -4, alt: 30, esp: 3, cor: cascaEsc },
    { base: 4, topo: 3, alt: 26, esp: 2, cor: ramp(casca, 1) },
  ];
  hastes.forEach((h, i) => {
    coluna(-h.alt, h.alt, (t) => {
      // Galho seco amarrado em feixe ENGROSSA EM CIMA, onde os nós se juntam —
      // ao contrário de um tronco, que afina para o alto. Invertido, lê como
      // árvore pequena, e aí vira cenário em vez de criatura.
      const torce = Math.sin((1 - t) * 3.4 + i * 1.7 + bal * 0.3) * 3;
      const w = Math.max(1, h.esp - t * 1.2
        + jitter(r(t * h.alt) * 3 + sem + i * 23, 1.1));
      const c = h.base + (h.topo + bal * 0.5 - h.base) * (1 - t) + torce;
      return { c: dentro(c, w), w };
    }, h.cor, { topo: 1 });
  });

  // ---- membros: TRÊS de um lado, DOIS do outro ----------------------------
  // Contagem par e simétrica é exatamente o que faria isto ler como humanoide
  // de fantasia. A irregularidade da contagem é mais barata e mais eficaz que
  // qualquer detalhe de superfície.
  const membros = [
    { x: -3, y: -28, dx: -13, dy: -6, esp: 2 },
    { x: -2, y: -22, dx: -11, dy: 4, esp: 2 },
    // Este sobe pouco de propósito: com os dedos somados, um membro mais alto
    // empurrava a figura para 48 px e o broto deixava de ler como criatura
    // Pequena ao lado de um goblin de 41.
    { x: -4, y: -33, dx: -8, dy: -4, esp: 1 },
    { x: 4, y: -30, dx: 11, dy: -3, esp: 3 },
    { x: 5, y: -19, dx: 9, dy: 6, esp: 2 },
  ];
  membros.forEach((m, i) => {
    const sopro = r(bal * (m.dx < 0 ? -0.4 : 0.6));
    const x1 = m.x + m.dx + sopro;
    const y1 = m.y + m.dy;
    traco(m.x, m.y, x1, y1, m.esp, i % 2 ? casca : ramp(casca, -1));
    // Cada membro acaba em dois ou três dedos de galho, de comprimentos
    // diferentes. A mão é o que o jogador olha quando a coisa ataca.
    const dedos = 2 + (i % 2);
    for (let d = 0; d < dedos; d++) {
      const comp = 3 + r(ruido(sem + i * 31 + d * 5) * 4);
      traco(x1, y1, x1 + r(jitter(sem + i * 31 + d, 5)), y1 - comp, 1, cascaEsc);
    }
  });

  // ---- o nó de cima --------------------------------------------------------
  // Não é cabeça: é o ponto onde as hastes se amarram. Dar olhos e boca a isto
  // devolveria o rosto humanoide que o resto do desenho está tentando evitar —
  // dois pontos de brasa funda bastam de rosto.
  const noX = r(-1 + bal * 0.5);
  const noY = -38;
  for (let i = 0; i < 7; i++) {
    const a = ruido(sem + i * 17) * Math.PI * 2;
    traco(noX, noY, noX + r(Math.cos(a) * 6), noY + r(Math.sin(a) * 5),
      i % 3 ? 1 : 2, i % 2 ? cascaEsc : casca);
  }
  disco(noX, noY, 4, ramp(cascaEsc, -1));
  if (dir !== 'back') {
    px(noX - 3, noY - 1, 2, 2, ramp(brasa, -1));
    px(noX - 3, noY - 1, 1, 1, brasa);
    if (dir !== 'side') px(noX + 1, noY, 2, 2, ramp(brasa, -2));
  }

  // ---- raízes: ele não tem pé, e a raiz não é simétrica --------------------
  for (const [x0, comp] of [[-3, -11], [2, 9], [-1, -5], [4, 4], [0, 13]]) {
    traco(x0, -6, x0 + comp, -2, 2, cascaEsc);
    px(x0 + comp - 1, -2, 3, 2, ramp(cascaEsc, -2));
  }
  contato(-14, -1, 28, cascaEsc);

  // ---- espinhos ------------------------------------------------------------
  // Saem em ângulo, para fora e também PARA BAIXO. Todos apontando para cima
  // leria como capim, e capim não ameaça ninguém.
  for (let i = 0; i < 22; i++) {
    const y = -4 - r(ruido(sem + i * 9) * 32);
    const lado = ruido(sem + i * 9 + 1) < 0.5 ? -1 : 1;
    const x = r(lado * (2 + ruido(sem + i * 9 + 2) * 5) + bal * 0.3);
    const comp = 2 + r(ruido(sem + i * 9 + 3) * 3);
    const sub = ruido(sem + i * 9 + 4) < 0.65 ? -1 : 1;
    traco(x, y, x + lado * comp, y + sub * r(comp * 0.8), 1,
      i % 4 ? ramp(cascaEsc, 1) : seiva);
  }
}
