// PLANO CORPORAL: aberração e limo.
//
// Cinco criaturas moram aqui, escolhidas por `look.aberracao`:
//   'gosma'            gelatina ocre — SRD
//   'cranioFlamejante' criatura NOSSA (o monstro do módulo não está no SRD)
//   'olhoVigia'        criatura NOSSA, no papel que o nothic ocupa no encontro
//   'brotoEspinhoso'   criatura NOSSA, no papel dos blights
//   'spectator'        nome e conceito de CONTEÚDO DE FÃ, arte e números nossos
//
// POR QUE AS CINCO NUM ARQUIVO
// Nenhuma delas tem esqueleto. O que elas compartilham não é anatomia — o
// vigia tem quatro patas e a gelatina não tem nenhuma —, é o problema de
// desenho: sem o par de ombros e o par de pernas do humanoide, a silhueta tem
// de vir de outro lugar. De uma massa que escorre, de uma chama que lambe, de
// uma única característica grande demais, de um feixe que não fecha contorno,
// de fios soltos em volta de uma bola. É a mesma caixa de ferramentas, então é
// o mesmo arquivo.
//
// A REGRA QUE GOVERNA AS CINCO: nada aqui pode ler como humanoide de fantasia.
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
    case 'spectator': return pintaSpectator(kit, look, dir, pose);
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
// CAVEIRA CANDENTE  (criatura nossa)
//
// SILHUETA: uma língua de fogo alta que se DOBRA PARA TRÁS no alto, com um
// bulbo arredondado e oco suspenso no seu terço inferior, e nada tocando o
// chão.
//
// O "nada tocando o chão" é metade da identidade. É a única figura do elenco
// cuja silhueta não encosta na linha do chão, e a 55 px isso se lê antes de
// qualquer detalhe.
//
// A OUTRA METADE É O CONTRASTE DE MATIZ, e ele está INVERTIDO em relação ao
// que a intuição pede: a fogueira é VERDE e as órbitas são VERMELHO-LARANJA.
// A primeira versão fazia o contrário — chama laranja, órbita azul — e punha o
// calor na massa grande e o frio no detalhe pequeno. O olhar do jogador caía na
// fogueira e a cabeça sumia dentro dela. Verde frio na massa de 30 px e brasa
// quente de 5 px no rosto faz o oposto: a mancha grande vira moldura e o olho
// pousa onde a mira precisa cair.
// ---------------------------------------------------------------------------

function pintaCranio(kit, look, dir, pose) {
  const { px, coluna, contato, traco, disco } = kit;
  const osso = look.skin ?? '#e4dcc4';
  const cavidade = look.outfitDark ?? '#3c3a26';
  const chama = look.outfit ?? '#4fa818';
  const nucleo = look.glow ?? '#caf062';
  // Fogo das órbitas: o ÚNICO ponto quente da figura inteira, e por isso o
  // único lugar onde o olhar tem onde pousar.
  const brasa = look.eyes ?? '#ff5a10';

  if (pose.kind === 'down') {
    // "Morrer", para esta coisa, é a chama apagar. O crânio cai no chão e o que
    // resta acima dele é brasa verde morrendo, não língua de fogo.
    coluna(-12, 12, (t) => {
      const w = 17 - t * 5;
      return { c: dentro(-2 + t * 2, w), w };
    }, ramp(osso, -1), { topo: 1 });
    contato(-11, -1, 16, osso);
    // Órbitas APAGADAS. É o sinal de leitura instantânea do quadro morto: a
    // figura viva é a única do elenco com dois pontos vermelhos, e aqui eles
    // somem. Quem olha o tabuleiro não precisa ler mais nada.
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
  const altChama = [26, 31, 24, 34, 19][fase];

  // DEITA é o quanto a ponta da chama tomba para trás. Ele muda em TODO quadro
  // e é a animação inteira da criatura: sem corpo, sem perna e sem peito, a
  // única coisa que pode mudar de forma entre dois quadros é o contorno do
  // fogo. Chama que só cresce e encolhe no eixo lê como lâmpada piscando.
  const deita = [-6, -11, -4, -14, -5][fase];

  /**
   * Uma casca de chama. Larga embaixo, ponta em cima, centro ondulando — e o
   * jitter por linha, que é o que impede a chama de ler como triângulo.
   *
   * O tombo entra com `sobe` elevado ao quadrado: a base fica presa no osso e
   * só o terço de cima se deita, que é como fogo real se comporta quando lambe
   * para trás. Aplicado linear, a chama inteira saía torta como bandeira.
   *
   * A CHAMA É A SILHUETA desta criatura, então ela é desenhada em três cascas
   * (externa escura e larga, média, núcleo claro colado no osso): uma casca só
   * dá uma mancha chapada, e é no degrau entre elas que o fogo aparece.
   */
  const casca = (altura, baseY, largura, cor, s, tombo) => {
    coluna(baseY - altura, altura, (t) => {
      const sobe = 1 - t;
      const w = Math.max(1, largura * Math.pow(t, 0.62)
        + jitter(r(t * altura) * 5 + s * 29, 1.8));
      const c = tombo * Math.pow(sobe, 2.2)
        + Math.sin(sobe * 4.4 + s) * 3.2 * sobe
        + jitter(r(t * altura) * 3 + s * 11, 1.2);
      return { c: dentro(c, w), w };
    }, cor, { topo: 1 });
  };

  casca(altChama + 6, -voo - 2, 23, ramp(chama, -2), fase + 1, deita);
  casca(altChama, -voo - 4, 16, chama, fase + 5, deita * 0.78);
  casca(Math.max(6, altChama - 9), -voo - 6, 11, nucleo, fase + 9, deita * 0.52);

  // Duas ou três línguas soltas saindo da coroa, todas puxadas para o lado do
  // tombo. Chama vertical e simétrica lê como tocha presa na parede, não como
  // criatura em movimento.
  //
  // O comprimento é sempre maior que o desvio lateral: uma língua mais
  // horizontal que vertical deixava de ler como fogo e virava um braço saindo
  // do lado da figura — foi exatamente o que aconteceu no quadro de ataque.
  for (let i = 0; i < 3; i++) {
    // Elas nascem DENTRO da massa principal, não acima dela: saindo da ponta,
    // as três viravam prongas separadas e a chama lia como par de orelhas.
    const lx = -6 + r(ruido(fase * 7 + i * 17) * 12) + r(deita * 0.3);
    const ly = altoCranio + 3 - r(ruido(fase * 7 + i * 17 + 1) * 8);
    const comp = 8 + r(ruido(fase * 7 + i * 17 + 2) * 8);
    const desvio = r(deita * 0.35) + r(jitter(fase * 3 + i, 3));
    traco(lx, ly, Math.max(-22, Math.min(22, lx + desvio)), ly - comp, 2,
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
    // com o quadro todo, o que é exatamente o que queremos nesta fileira — e é
    // a única vista em que a figura some inteira dentro do verde.
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
    // Uma órbita só, mais o arco zigomático e o maxilar travado. São eles que
    // impedem um perfil de crânio de virar um ovo com dentes.
    disco(2, topo + 7, 5, ramp(cavidade, -3));
    disco(3, topo + 7, 3, ramp(brasa, -2));
    disco(3, topo + 7, 2, brasa);
    px(2, topo + 6, 1, 1, ramp(brasa, 3));
    traco(-1, topo + 9, 5, topo + 10, 1, ramp(osso, -2));
    px(6, topo + 10, 3, 2, ramp(osso, 1));
    // Mandíbula TRAVADA de perfil: a fileira de cima encosta na de baixo e o
    // sulco entre os dentes é vertical e curto. Boca entreaberta de lado
    // devolvia o crânio de festa junina que estamos tirando daqui.
    px(0, topo + 12, 9, 1, ramp(cavidade, -2));
    px(0, topo + 13, 9, 3, ramp(osso, 2));
    for (let d = 1; d < 9; d += 2) px(d, topo + 13, 1, 3, ramp(cavidade, -1));
    px(0, topo + 15, 9, 1, ramp(osso, -2));
    px(-1, topo + 16, 10, 2, ramp(osso, -1));
    traco(-9, topo + 11, -6, topo + 3, 2, ramp(chama, 1));
    return;
  }

  // Órbitas: a esquerda é um pixel maior. A assimetria vem antes de qualquer
  // outra informação quando o jogador olha uma cabeça.
  disco(-5, topo + 7, 5, ramp(cavidade, -3));
  disco(5, topo + 7, 4, ramp(cavidade, -3));
  px(-8, topo + 4, 6, 1, ramp(osso, -1));        // arco supra-orbital
  px(3, topo + 4, 5, 1, ramp(osso, -1));

  // A BRASA EM TRÊS ANÉIS. Disco de cor única lê como adesivo colado no osso; é
  // o degrau do vermelho fundo para o amarelo quase branco que faz a órbita
  // parecer acesa POR DENTRO, que é a diferença entre fogo e tinta.
  disco(-5, topo + 7, 3, ramp(brasa, -2));
  disco(-5, topo + 7, 2, brasa);
  px(-6, topo + 6, 2, 1, ramp(brasa, 3));
  disco(5, topo + 7, 2, ramp(brasa, -2));
  disco(5, topo + 7, 1, brasa);
  px(4, topo + 6, 1, 1, ramp(brasa, 3));
  // O derrame de luz: a brasa transborda a órbita e acende o osso em volta. São
  // seis pixels e são eles que impedem o vermelho de ler como miolo recortado.
  px(-8, topo + 9, 3, 1, ramp(brasa, -3));
  px(6, topo + 9, 2, 1, ramp(brasa, -3));

  px(-1, topo + 10, 3, 3, ramp(cavidade, -3));   // abertura nasal
  px(-1, topo + 10, 1, 2, ramp(cavidade, -1));

  // DENTES CERRADOS. A versão anterior tinha arcada com falha e boca
  // entreaberta; a referência tem a mandíbula TRAVADA e a fileira inteira à
  // mostra. Fileira cheia com sulco escuro de dois em dois: é o sulco que
  // impede a faixa de osso de ler como esparadrapo branco colado no queixo.
  px(-5, topo + 12, 11, 1, ramp(cavidade, -2));  // sombra da gengiva
  px(-5, topo + 13, 11, 3, ramp(osso, 2));       // a fileira travada
  for (let d = 1; d < 11; d += 2) px(-5 + d, topo + 13, 1, 3, ramp(cavidade, -1));
  px(-5, topo + 15, 11, 1, ramp(osso, -2));      // linha de oclusão
  px(-6, topo + 16, 12, 2, ramp(osso, -1));      // mandíbula por fora da arcada
  px(-4, topo + 18, 8, 1, ramp(osso, -3));       // mento

  // A chama passa POR CIMA do osso em dois pontos. Sem isso ela fica atrás do
  // crânio como pano de fundo, e o crânio não está "envolto" em nada.
  traco(-11, topo + 12, -8, topo + 2, 2, ramp(chama, 1));
  traco(9, topo + 11, 7, topo + 4, 2, chama);
  px(-7, topo, 3, 2, nucleo);
}

// ---------------------------------------------------------------------------
// VIGIA CICLÓPICO  (criatura nossa)
//
// SILHUETA: um quadrúpede de dorso arqueado MAIS ALTO QUE A PRÓPRIA CABEÇA,
// eriçado de espinhos desiguais apontando para trás, com a cabeça pendurada à
// frente, entre os cotovelos.
//
// O desenho anterior era um vulto humanoide curvado sobre duas pernas, e isso
// reprovava o teste da silhueta contra o goblin corcunda: mesma mancha, outro
// tamanho. A ESPÉCIE estava errada, não o acabamento. Esta coisa anda nas
// QUATRO PATAS e o ponto mais alto dela não é a cabeça, é a corcova — pintada
// de preto ela é um arco espinhado com uma bola pendurada na ponta da frente,
// e nenhuma outra figura do elenco faz esse contorno.
//
// A proporção continua sendo o inimigo: se a cabeça couber confortavelmente no
// corpo, o olho deixa de ser grande demais e a figura vira "cachorro feio".
// ---------------------------------------------------------------------------

function pintaOlho(kit, look, dir, pose) {
  const { px, coluna, contato, traco, disco } = kit;
  const pele = look.skin ?? '#4a3a2e';
  const peleEsc = look.outfitDark ?? '#241b15';
  const esclera = look.outfit ?? '#e8e0bc';
  const iris = look.eyes ?? '#c3cf3a';
  const pupila = look.trim ?? '#0b0908';
  // Garra e espinho são QUERATINA PRETA, não pele escurecida. Uma ponta de
  // 2 px só continua lendo como ponta se o valor dela estiver fora da faixa do
  // corpo — escurecer a pele mais três degraus devolvia uma farpa cinzenta que
  // some assim que o contorno automático de sheet.js passa por cima.
  const queratina = '#120e0b';

  const ataque = pose.kind === 'attack';
  const dor = pose.kind === 'hurt';
  const lado = dir === 'side';
  const costas = dir === 'back';

  /**
   * Pata: fina, longa, e ENGROSSANDO DE NOVO no pé.
   *
   * A perna de um bicho assim afina do ombro ao pulso e volta a abrir no
   * metatarso. É esse "volta a abrir" que separa pata com garra de palito
   * espetado no chão — e o seno dá a barriga invertida numa linha.
   */
  const pata = (xAlto, yAlto, xPe, esp, cor, dedos = 3) => {
    const alt = -yAlto - 3;
    if (alt <= 1) return;
    coluna(yAlto, alt, (t) => {
      const w = Math.max(2, esp - Math.sin(t * Math.PI) * (esp - 2));
      return { c: dentro(xAlto + (xPe - xAlto) * t, w), w };
    }, cor, { topo: 1 });
    px(xPe - 3, -3, 7, 2, ramp(cor, -1));
    px(xPe - 3, -3, 7, 1, ramp(cor, 1));       // dorso do pé pega a luz de cima
    // Garras grandes e viradas para a frente, passando da linha dos dedos.
    for (let d = 0; d < dedos; d++) {
      const gx = xPe - 3 + d * 3;
      px(gx, -2, 2, 2, queratina);
      px(gx - 1, -1, 2, 1, queratina);
    }
    contato(xPe - 4, -1, 9, cor);
  };

  /**
   * Espinho: cone que afina da base para a ponta, não traço de espessura
   * constante. Traço constante lê como antena de inseto; o que ameaça numa
   * silhueta é a ponta, e ponta exige que a base seja mais gorda que ela.
   */
  const espinho = (x0, y0, x1, y1, base, cor) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const w = Math.max(1, r(base * (1 - t * 0.88)));
      const x = r(x0 + (x1 - x0) * t) - (w >> 1);
      const y = r(y0 + (y1 - y0) * t);
      px(x, y, w, 1, t < 0.35 ? cor : ramp(cor, -2));
      if (w >= 2) px(x, y, 1, 1, ramp(cor, 1));
    }
  };

  /** Rugas: sulcos curtos de um lado só, para o couro não ler como borracha. */
  const rugas = (x0, y0, largura, altura, sem) => {
    for (let i = 0; i < 9; i++) {
      const x = x0 + r(ruido(sem + i * 11) * largura);
      const y = y0 + r(ruido(sem + i * 11 + 1) * altura);
      px(x, y, 2 + (i % 2), 1, ramp(pele, -3));
      px(x, y - 1, 1 + (i % 2), 1, ramp(pele, 1));
    }
  };

  if (pose.kind === 'down') {
    // Caído, as quatro patas se abrem e o dorso achata — mas o olho continua
    // aberto e continua sendo a maior coisa do quadro. É o que impede o sprite
    // morto de virar um borrão marrom indistinguível de qualquer outro.
    coluna(-13, 13, (t) => {
      const w = 30 - t * 9;
      return { c: dentro(4 + t * 2, w), w };
    }, ramp(peleEsc, 1), { topo: 1 });
    contato(-13, -1, 34, peleEsc);
    for (const [x0, y0, x1, y1] of [[1, -12, -15, -6], [6, -13, 21, -7], [10, -9, 22, -4]]) {
      espinho(x0, y0, x1, y1, 3, ramp(peleEsc, 2));
    }
    // AS QUATRO PATAS ESPALHADAS, duas para cada lado e nenhuma em pé: é o que
    // diferencia "quadrúpede morto" de "pedra escura no chão". Com o corpo
    // achatado sozinho, o quadro perdia a espécie da criatura.
    for (const [x0, y0, x1, y1, e] of [
      [-2, -9, -18, -3, 3], [1, -6, -15, -1, 2],
      [12, -10, 22, -3, 3], [10, -6, 21, -1, 2],
    ]) traco(x0, y0, x1, y1, e, ramp(peleEsc, e > 2 ? 3 : 2));
    for (const gx of [-19, 21]) { px(gx, -2, 3, 2, queratina); px(gx, -1, 4, 1, queratina); }
    disco(-11, -10, 7, ramp(esclera, -2));
    disco(-11, -10, 4, ramp(iris, -3));
    disco(-11, -10, 1, pupila);
    px(-13, -13, 2, 1, ramp(esclera, 2));
    return;
  }

  // `arqueia` é a altura da corcova e `avanca` é o quanto a cabeça se projeta.
  // Mudam nas quatro poses porque é assim que um bicho sem peito que infle
  // respira: o arco das costas sobe e desce, e a cabeça entra e sai.
  const arqueia = ataque ? (pose.frame === 1 ? 4 : 2) : dor ? -3 : pose.frame === 1 ? 1 : 0;
  const avanca = ataque ? (pose.frame === 1 ? 5 : 2) : dor ? -3 : 0;

  /**
   * O OLHO. É A MARCA REGISTRADA, O ELEMENTO-HERÓI e a ÚNICA COR VIVA.
   *
   * O resto do bicho é marrom quase preto de propósito: uma íris de 10 px de
   * diâmetro numa figura dessaturada é o primeiro e o último lugar onde o olhar
   * do jogador pousa, e é isso que resolve o defeito 5 do ELENCO.md nesta
   * criatura. Quatro anéis — órbita, esclera, íris raiada, pupila minúscula —
   * porque disco de cor única lê como botão costurado.
   */
  const olho = (ox, oy, raio) => {
    disco(ox, oy, raio + 1, ramp(peleEsc, -2));
    disco(ox, oy, raio, esclera);
    // Veias na esclera: sem elas o globo sai de porcelana, e porcelana não dói.
    for (let i = 0; i < 5; i++) {
      const a = ruido(i * 13 + 3) * Math.PI * 2;
      traco(ox + r(Math.cos(a) * (raio - 1)), oy + r(Math.sin(a) * (raio - 1)),
        ox + r(Math.cos(a) * 3), oy + r(Math.sin(a) * 3), 1, ramp(iris, -3));
    }
    // A íris abre e fecha entre os quadros: é a segunda animação da criatura, e
    // a que o jogador percebe mesmo com o sprite a 55 px.
    const abre = Math.max(3, dor ? raio - 3 : ataque ? raio - 1 : raio - 2);
    disco(ox, oy, abre, iris);
    // Íris RAIADA, não chapada. Os fios do centro para a borda são o que faz o
    // disco ler como lente viva; sem eles volta a ser o botão.
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      traco(ox + r(Math.cos(a) * 2), oy + r(Math.sin(a) * 2),
        ox + r(Math.cos(a) * (abre - 1)), oy + r(Math.sin(a) * (abre - 1)), 1,
        i % 2 ? ramp(iris, 2) : ramp(iris, -2));
    }
    // Pupila PEQUENA e preta, no meio de uma íris enorme. É a desproporção
    // entre as duas que faz o olho parecer errado em vez de bonito — olho de
    // pupila grande lê como bicho simpático de desenho animado.
    disco(ox, oy, dor ? 1 : ataque ? 3 : 2, pupila);
    px(ox - r(raio * 0.45), oy - r(raio * 0.45), 2, 2, ramp(esclera, 3));
    px(ox - r(raio * 0.45), oy - r(raio * 0.45), 1, 1, '#ffffff');
    // Pálpebra pesada: a luz vem de cima, então ela joga a própria sombra sobre
    // o terço alto do globo. É esse degrau que enfia o olho na cabeça em vez de
    // deixá-lo colado por fora como um adesivo.
    for (let i = -raio; i <= raio; i++) {
      px(ox + i, oy - raio + r(Math.abs(i) * 0.5), 1, r(2 - Math.abs(i) * 0.14) + 1,
        ramp(peleEsc, -1));
    }
  };

  /**
   * Boca larga logo abaixo do olho, cheia de dentes FINOS e desencontrados.
   * Dente regular é dentadura de vitrine; o que assusta é a fileira torta, e a
   * irregularidade sai do ruído determinístico, não de sorteio.
   */
  const boca = (bx, by, largura) => {
    const aberta = ataque ? 4 : dor ? 1 : 2;
    px(bx, by - 1, largura, 1, ramp(pele, -4));            // não há lábio, há borda
    px(bx, by, largura, aberta + 2, ramp(peleEsc, -4));
    for (let d = 0; d + 2 < largura; d += 2) {
      const alt = 1 + r(ruido(d * 7 + 3) * 2);
      px(bx + 1 + d, by, 1, alt, ramp(esclera, 1));
      px(bx + 2 + d, by + aberta + 2 - alt, 1, alt, ramp(esclera, -2));
    }
  };

  // =========================================================== VISTA DE COSTAS
  if (costas) {
    // Pela garupa não há olho, e sem o olho esta criatura não tem rosto nenhum.
    // Então a informação desta fileira é O ARCO: a corcova cheia de espinhos
    // ocupando o quadro inteiro, com a cabeça apenas espiando por baixo. É a
    // única vista em que a silhueta é pura crista, e ela continua sendo só
    // desta criatura.
    const topoDorso = -46 - arqueia;
    pata(-11, -33, -15, 6, ramp(peleEsc, 2));
    pata(10, -34 - arqueia, 14, 7, ramp(peleEsc, 2));
    pata(-3, -30, -5, 5, ramp(peleEsc, 1));
    pata(4, -31, 6, 5, ramp(peleEsc, 1));

    coluna(topoDorso, 22 + arqueia, (t) => {
      const w = 12 + 20 * Math.pow(t, 0.55);
      return { c: dentro(1 - t * 2, w), w };
    }, pele, { topo: 2, base: 1 });
    rugas(-12, topoDorso + 4, 22, 14, 71);

    // Rego da espinha: duas linhas paralelas, uma escura e uma clara, correndo
    // pelo eixo do arco. É o que dá volume ao dorso visto de trás sem precisar
    // de mais nenhuma forma.
    for (let i = 0; i < 18; i++) {
      px(r(1 - (i / 18) * 2) - 1, topoDorso + 2 + i, 2, 1, ramp(pele, -4));
      px(r(1 - (i / 18) * 2) + 1, topoDorso + 2 + i, 1, 1, ramp(pele, 2));
    }
    for (const [x0, y0, x1, y1, b] of [
      [-1, topoDorso + 1, -6, -64, 5], [4, topoDorso + 2, 10, -62, 4],
      [-6, topoDorso + 4, -14, -56, 4], [9, topoDorso + 5, 17, -54, 3],
      [1, topoDorso + 7, 2, -58, 3], [-11, topoDorso + 9, -19, -47, 3],
      [13, topoDorso + 10, 20, -45, 3],
    ]) espinho(x0, y0, x1, y1, b, ramp(peleEsc, 1));
    // A cabeça espiando por baixo do arco, de nuca: só a calota e a sombra onde
    // o olho estaria do outro lado.
    coluna(-26, 11, (t) => {
      const w = 9 + Math.sin(Math.min(1, t * 1.1) * Math.PI) * 7;
      return { c: dentro(-7, w), w };
    }, ramp(pele, -2), { topo: 1, base: 1 });
    px(-11, -20, 9, 1, ramp(peleEsc, -2));
    return;
  }

  // ============================================================= VISTA DE LADO
  if (lado) {
    const topoDorso = -47 - arqueia;
    // Patas de trás primeiro (estão do outro lado do corpo), depois o flanco,
    // depois as da frente — é a ordem que dá profundidade sem canal alfa.
    pata(-14, -34 - arqueia, -18, 5, ramp(peleEsc, 1));
    pata(-7, -32 - arqueia, -10, 4, ramp(peleEsc, 1));

    // De lado o corpo é lido de CIMA PARA BAIXO: na linha mais alta só a
    // corcova existe; descendo, o flanco vai se abrindo para a frente e para
    // trás até virar a barriga inteira. Ler assim deixa a `coluna` do kit fazer
    // o arco do dorso de graça — e o arco é a silhueta inteira desta figura.
    coluna(topoDorso, 19 + arqueia, (t) => {
      const w = 11 + 25 * Math.pow(t, 0.55);
      return { c: dentro(-4 + t * 2, w), w };
    }, pele, { topo: 2, base: 1 });
    rugas(-16, topoDorso + 5, 26, 12, 37);
    // Costelas de um lado só: hierarquia de leitura. O flanco fica quase mudo
    // para que o olho não tenha onde parar antes de chegar na cabeça.
    for (let i = 0; i < 4; i++) px(-2 + i * 3, -33 + i, 2, 5 - i, ramp(pele, -3));

    for (const [x0, y0, x1, y1, b] of [
      [-2, topoDorso + 1, -13, -64, 5], [3, topoDorso + 2, -4, -61, 4],
      [-8, topoDorso + 4, -19, -56, 4], [7, topoDorso + 4, 1, -57, 3],
      [-13, topoDorso + 7, -22, -49, 3],
    ]) espinho(x0, y0, x1, y1, b, ramp(peleEsc, 1));

    // Pescoço curto DESCENDO da frente dos ombros até dentro da cabeça. Ele
    // termina abaixo do topo do crânio de propósito: parando na linha dela, o
    // pescoço virava um degrau e a cabeça lia como peça colada ao lado do
    // corpo em vez de pendurada do pescoço.
    coluna(-34, 14, (t) => {
      const w = 11 - t * 2;
      return { c: dentro(9 + t * 4 + avanca * 0.4, w), w };
    }, ramp(pele, -1), { topo: 1 });

    pata(-1, -33, -4, 5, ramp(peleEsc, 3));
    pata(6, -31, 4, 4, ramp(peleEsc, 2));

    // A cabeça pendura ABAIXO da linha dos ombros e à frente dela. O ponto alto
    // do bicho é a corcova, e a vista de lado é onde isso precisa ficar provado
    // — de perfil a diferença de altura entre crânio e dorso é mensurável a
    // olho nu, e é o que separa esta figura de um javali.
    const cabX = 14 + r(avanca * 0.5);
    coluna(-30, 19, (t) => {
      const w = 7 + Math.sin(Math.min(1, t * 1.05) * Math.PI) * 13;
      return { c: dentro(cabX, w), w };
    }, pele, { topo: 2, base: 1 });
    olho(cabX + 1, -22, 6);
    boca(cabX - 5, -15, 12);
    return;
  }

  // =========================================================== VISTA DE FRENTE
  // Três quartos de propósito: a corcova nasce à direita, o eixo do corpo
  // caminha para a esquerda ao descer e a cabeça pendura nessa ponta. De frente
  // perfeita, um quadrúpede vira dois pares de palitos sob uma mancha — perde o
  // arco, que é justamente a coisa que o desenho tem para vender.
  const topoDorso = -48 - arqueia;

  pata(13, -40 - arqueia, 16, 6, ramp(peleEsc, 2));
  pata(7, -38 - arqueia, 9, 4, ramp(peleEsc, 1));

  // O TRONCO FICA ALTO E CURTO. Ele ocupa só a faixa de -48 a -31, e todo o
  // resto da altura é perna e cabeça pendurada. A primeira versão dava 18 px de
  // tronco sobre pernas de 29 e o bicho saía como um toco de árvore com patas:
  // o que faz ler "quadrúpede de membro fino" é o corpo ser a MENOR das três
  // massas, não a maior.
  coluna(topoDorso, 17 + arqueia, (t) => {
    const w = 10 + 16 * Math.pow(t, 0.6);
    return { c: dentro(6 - t * 8, w), w };
  }, pele, { topo: 2, base: 1 });
  rugas(-8, topoDorso + 4, 17, 11, 19);
  // Costelas à mostra do lado da sombra, três linhas e para. O lado iluminado
  // fica calado: é a hierarquia de leitura que o ELENCO.md pede.
  for (let i = 0; i < 3; i++) px(2 + i, topoDorso + 8 + i * 3, 7 - i, 1, ramp(pele, -4));

  for (const [x0, y0, x1, y1, b] of [
    [5, topoDorso + 1, 13, -64, 5], [1, topoDorso + 2, 6, -62, 4],
    [9, topoDorso + 3, 19, -56, 4], [-3, topoDorso + 5, -1, -58, 3],
    [12, topoDorso + 7, 21, -48, 3], [-6, topoDorso + 8, -10, -51, 3],
  ]) espinho(x0, y0, x1, y1, b, ramp(peleEsc, 1));

  pata(-13, -35, -16 - r(avanca * 0.3), 5, ramp(peleEsc, 3));
  pata(3, -34, 5, 4, ramp(peleEsc, 2));

  // ---- cabeça: PENDURADA ABAIXO DO PEITO, e grande demais para o pescoço ---
  // Ela começa onde o tronco acaba e desce mais 20 px, atravessando a altura
  // dos cotovelos. É isso que faz o dorso ficar "bem acima da cabeça", que é a
  // frase que a referência pede — com a cabeça na linha dos ombros, a figura
  // voltava a ser um bicho de quatro patas qualquer.
  const cabX = -6 - r(avanca * 0.4);
  coluna(-33, 21, (t) => {
    const w = 8 + Math.sin(Math.min(1, t * 1.04) * Math.PI) * 13;
    return { c: dentro(cabX + t * 2, w), w };
  }, pele, { topo: 2, base: 1 });
  olho(cabX, -25, 7);
  boca(cabX - 6, -17, 13);
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

// ---------------------------------------------------------------------------
// SPECTATOR  (criatura nova desta rodada)
//
// SILHUETA: uma bola flutuando bem acima da linha do chão, com quatro fios
// finos saindo dela em direções diferentes, cada um terminando num nó, e uma
// fita comprida escorrendo para baixo da metade inferior.
//
// Nenhuma outra figura do elenco tem o contorno furado por fios soltos ao redor
// de uma massa fechada. A caveira candente também flutua, mas ela é uma chama
// alta e estreita com um bulbo dentro; esta é larga, redonda, e tem braços de
// contorno que saem para os quatro cantos do quadrado. Pintadas de preto, as
// duas não se confundem.
//
// LICENÇA — o NOME e o CONCEITO desta criatura são CONTEÚDO DE FÃ (Fan Content
// Policy da Wizards of the Coast), a mesma política que já sustenta "Phandalin"
// e "Nezznar" neste projeto, e que depende de o jogo continuar gratuito. A ARTE
// é nossa, desenhada do zero aqui, e os NÚMEROS do bloco em
// `rules/monsters/aberracoes.js` são do projeto (`fonte: 'propria'`): nada foi
// copiado nem parafraseado de livro publicado.
// ---------------------------------------------------------------------------

function pintaSpectator(kit, look, dir, pose) {
  const { px, coluna, contato, traco, disco } = kit;
  const escama = look.outfit ?? '#607b36';
  const escamaEsc = look.outfitDark ?? '#32451b';
  const goela = look.glow ?? '#7a3b44';
  const dente = look.skin ?? '#ded5b2';
  const iris = look.eyes ?? '#93a8c2';
  const hasteOlho = look.metal ?? '#d9d07c';
  const lingua = look.trim ?? '#d79aa6';
  const pupila = '#0d0c10';

  const ataque = pose.kind === 'attack';
  const dor = pose.kind === 'hurt';
  const lado = dir === 'side';
  const costas = dir === 'back';

  /**
   * Haste ocular: uma Bézier quadrática, não um traço reto.
   *
   * Reto, o fio lê como arame de antena e as quatro hastes saem paralelas; o
   * que faz a leitura é cada uma CURVAR para um lado diferente, uma passando
   * por cima da esfera e outra caindo abaixo dela. É a curva que ocupa os
   * quatro cantos do quadrado e dá à silhueta a sua assinatura.
   */
  const haste = (bx, by, mx, my, tx, ty) => {
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const u = 1 - t;
      const x = r(u * u * bx + 2 * u * t * mx + t * t * tx);
      const y = r(u * u * by + 2 * u * t * my + t * t * ty);
      const w = t < 0.72 ? 3 : 2;
      px(x - (w >> 1), y, w, 1, t < 0.45 ? escama : ramp(escama, -1));
      px(x - (w >> 1), y, 1, 1, ramp(escama, 2));       // aresta de luz do fio
      px(x - (w >> 1) + w - 1, y, 1, 1, ramp(escamaEsc, -1));
    }
  };

  /** O olho da ponta: pequeno, amarelado e de pupila em fenda, como o central. */
  const olhinho = (ox, oy, aberto = true) => {
    disco(ox, oy, 4, ramp(escamaEsc, -2));              // anel de pele do nó
    disco(ox, oy, 3, ramp(hasteOlho, -1));
    disco(ox, oy, 2, hasteOlho);
    if (aberto) {
      px(ox, oy - 2, 1, 5, pupila);
      px(ox - 2, oy - 2, 1, 1, '#ffffff');
    } else {
      px(ox - 2, oy, 5, 1, ramp(escamaEsc, -3));
    }
  };

  /** Escamas: meia-lua escura com reforço claro em cima, espalhadas sem grade. */
  const escamas = (x0, y0, largura, altura, sem) => {
    for (let i = 0; i < 16; i++) {
      const x = x0 + r(ruido(sem + i * 13) * largura);
      const y = y0 + r(ruido(sem + i * 13 + 1) * altura);
      px(x, y, 2 + (i % 2), 1, ramp(escama, -2));
      px(x, y - 1, 2, 1, ramp(escama, 2));
    }
  };

  if (pose.kind === 'down') {
    // Morto, ele CAI — e isso é informação, porque viva esta coisa nunca toca o
    // chão. A esfera murcha, as hastes se largam como cordas e os olhinhos
    // fecham. O único que fica aberto e embaçado é o central.
    coluna(-14, 14, (t) => {
      const w = 30 - t * 8;
      return { c: dentro(-1 + t * 2, w), w };
    }, ramp(escamaEsc, 1), { topo: 1 });
    contato(-16, -1, 32, escamaEsc);
    for (const [bx, by, mx, my, tx, ty] of [
      [-6, -11, -14, -6, -18, -3], [6, -12, 15, -8, 18, -4],
      [-3, -13, -10, -14, -16, -9], [8, -10, 15, -5, 18, -2],
    ]) {
      haste(bx, by, mx, my, tx, ty);
      olhinho(tx, ty - 1, false);
    }
    disco(0, -9, 6, ramp(escamaEsc, -3));
    disco(0, -9, 4, ramp(iris, -3));
    px(0, -12, 1, 7, ramp(pupila, 1));
    // A língua largada no chão, para fora: a última coisa que a figura morta
    // ainda tem de reconhecível.
    for (let i = 0; i <= 14; i++) {
      px(-2 - i, -2 + r(Math.sin(i * 0.4) * 1.5), 2, 1, i < 8 ? ramp(lingua, -1) : ramp(lingua, -2));
    }
    return;
  }

  const fase = ataque ? (pose.frame === 1 ? 3 : 2) : dor ? 4 : pose.frame === 1 ? 1 : 0;

  // VOO: a distância entre a base da esfera e o chão. Ela muda em todo quadro,
  // e é a respiração desta criatura — não há peito, não há perna, não há asa.
  // No quadro de ataque ela MERGULHA (voo menor) e no de dor ela recua.
  const voo = [24, 27, 21, 19, 28][fase];
  const raioX = 14;
  const raioY = 12;
  const cy = -voo - raioY;
  const cx = costas ? 1 : lado ? -2 : -1;

  // Sombra no chão. Três linhas de larguras decrescentes fazem uma elipse, e a
  // elipse é a prova de que a coisa flutua: sem ela o sprite lê como recortado
  // e colado no ar. Ela encolhe quando ele sobe, como sombra de verdade.
  // Dois degraus de cinza, não um risco preto: sombra projetada tem penumbra, e
  // um traço chapado no valor do contorno lia como barra de vida sob a figura.
  const sombra = Math.max(9, 23 - r(voo * 0.35));
  px(-r(sombra / 2), -1, sombra, 1, ramp(escamaEsc, -2));
  px(-r(sombra / 2) + 3, -2, sombra - 6, 1, ramp(escamaEsc, -1));

  // ---- as quatro hastes, ATRÁS da esfera ----------------------------------
  // As duas de cima nascem escondidas pelo corpo e passam por cima dele; as de
  // baixo saem pelos lados. Desenhadas antes da esfera, elas emergem de dentro
  // em vez de ficarem coladas por fora.
  const sopro = ataque ? 3 : dor ? -3 : pose.frame === 1 ? 1 : 0;
  //
  // As pontas param em x = +-17 e o balanco anda +-3: com o olho da ponta (raio
  // 4) isso fecha em +-24, um pixel antes da borda da celula. E preciso: a
  // figura que ENCOSTA na borda ganha, em `sheet.js`, um pixel de contorno
  // dentro do quadro vizinho da folha.
  const pontas = costas
    ? [[-7, cy - 8, -18, cy - 20, -10 - sopro, -60], [10, cy - 6, 19, cy - 17, 16 + sopro, -52],
      [-12, cy, -20, cy + 6, -16 - sopro, -29], [12, cy + 4, 19, cy + 11, 15 + sopro, -18]]
    : [[-9, cy - 8, -19, cy - 21, -13 - sopro, -61], [11, cy - 6, 20, cy - 16, 17 + sopro, -49],
      [-13, cy - 1, -21, cy + 5, -17 - sopro, -27], [13, cy + 3, 20, cy + 10, 15 + sopro, -17]];
  for (const [bx, by, mx, my, tx, ty] of pontas) haste(bx, by, mx, my, tx, ty);

  // ---- a esfera ------------------------------------------------------------
  // Achatada: mais larga que alta. Esfera perfeita lê como bola de gude, e o
  // que a referência tem é uma cabeça sem corpo, que é um pouco mais larga.
  coluna(cy - raioY, raioY * 2, (t) => {
    const a = t * 2 - 1;
    const w = raioX * 2 * Math.sqrt(Math.max(0, 1 - a * a));
    return { c: dentro(cx, w), w };
  }, escama, { topo: 2, base: 1 });
  escamas(cx - 11, cy - 9, 22, 16, lado ? 83 : costas ? 157 : 29);

  // Cristas e espinhos curtos no alto. São curtos de propósito: longos virariam
  // concorrência para as hastes, e a silhueta já tem quatro fios para vender.
  for (let i = 0; i < 7; i++) {
    const a = -0.95 + i * 0.32;
    const bx = cx + r(Math.sin(a) * raioX * 0.86);
    const by = cy - r(Math.cos(a) * raioY * 0.86);
    const comp = 3 + r(ruido(i * 9 + 5) * 3);
    traco(bx, by, bx + r(Math.sin(a) * comp), by - comp, 2,
      i % 2 ? ramp(escamaEsc, 1) : escamaEsc);
  }

  if (costas) {
    // De costas não há olho nem boca, e sem eles esta criatura não tem rosto.
    // A informação desta fileira é o COURO: a nuca escamosa, a crista que desce
    // pelo meio e os quatro fios saindo por trás dos ombros da esfera. É a
    // única vista em que o quadro é quase todo hastes.
    for (let i = 0; i < 16; i++) {
      px(cx - 1, cy - 9 + i, 3, 1, ramp(escamaEsc, i % 3 ? 0 : 1));
      px(cx + 2, cy - 9 + i, 1, 1, ramp(escama, 2));
    }
    disco(cx - 5, cy - 3, 3, ramp(escamaEsc, -1));    // a fosseta da nuca
    disco(cx + 6, cy + 2, 2, ramp(escamaEsc, -1));
    for (const [, , , , tx, ty] of pontas) olhinho(tx, ty, false);
    return;
  }

  for (const [, , , , tx, ty] of pontas) olhinho(tx, ty);

  // ---- a boca: metade de baixo da esfera, escancarada ----------------------
  // Ela ocupa METADE da figura. É o elemento-herói junto com o olho, e é a
  // razão de a esfera não ler como um orbe mágico qualquer: a coisa tem fome.
  const abre = ataque ? 3 : dor ? -2 : pose.frame === 1 ? 1 : 0;
  const bocaTopo = cy - 1 - abre;
  const bocaAlt = 13 + abre;
  const bocaX = lado ? cx + 4 : cx;
  coluna(bocaTopo, bocaAlt, (t) => {
    // Funil: larga na frente dos dentes e fechando para o fundo. Retângulo
    // escuro lê como buraco recortado, não como goela.
    const w = Math.max(3, (lado ? 18 : 25)
      * Math.sqrt(Math.max(0, 1 - Math.pow(t * 0.94, 2))) - t * 4);
    return { c: dentro(bocaX, w), w };
  }, goela, { topo: 1 });
  // O FUNDO DA GOELA É QUASE PRETO. A luz entra pela frente e não chega lá, e
  // sem esse buraco escuro a boca lia como uma faixa rosada sob o olho — era o
  // defeito da primeira passada. A área preta ocupa quase toda a boca de
  // propósito: é ela, e não os dentes, que diz "escancarada" a 55 px.
  coluna(bocaTopo + 2, bocaAlt - 4, (t) => {
    const w = Math.max(3, (lado ? 15 : 21)
      * Math.sqrt(Math.max(0, 1 - Math.pow(t * 0.9, 2))) - t * 3);
    return { c: dentro(bocaX + 1, w), w };
  }, ramp(goela, -4), { topo: 1 });

  // DENTES CÔNICOS, de alturas desencontradas, nas duas arcadas. Fileira
  // regular é dentadura de vitrine; o que morde é a fileira torta.
  // Os dentes ficam BAIXOS nas duas arcadas (1 a 2 px) para que a faixa escura
  // entre elas continue grossa. Com dentes altos as duas fileiras quase se
  // encontravam e a boca escancarada virava um sorriso fechado com serrilha —
  // metade da figura é goela aberta, e é essa área preta que tem de ler.
  //
  // A ARCADA DE CIMA É DESENHADA NA LINHA ABAIXO DO OLHO, não no topo da boca:
  // o olho central é pintado depois e cobriria dente posto mais acima. É por
  // isso que `dentesY` não é `bocaTopo`.
  const meiaB = lado ? 8 : 12;
  const dentesY = cy + 2;
  for (let i = 0; i * 2 < meiaB * 2 - 1; i++) {
    const x = bocaX - meiaB + 1 + i * 2;
    const alt = 1 + r(ruido(i * 5 + 9) * 2);
    px(x, dentesY, 2, alt, ramp(dente, 1));
    px(x, dentesY, 1, alt, ramp(dente, 3));
    // A arcada de baixo acompanha a curva da esfera: os dentes do meio sobem
    // mais que os das pontas, senão a boca fica com um sorriso reto de abóbora.
    const alt2 = 1 + r(ruido(i * 7 + 2) * 2);
    const yb = bocaTopo + bocaAlt - 1 - r(Math.abs(x - bocaX) * 0.34);
    px(x, yb - alt2, 2, alt2, ramp(dente, -1));
    px(x, yb - alt2, 1, alt2, ramp(dente, 1));
  }

  // ---- a língua ------------------------------------------------------------
  // Sai do fundo da goela, DESCE e encurva. É o terceiro elemento de silhueta,
  // depois da esfera e das hastes, e o único que aponta para baixo: sem ele a
  // figura lê como bola flutuante com antenas, que é meia criatura.
  const curvaL = ataque ? 1.55 : dor ? 0.7 : pose.frame === 1 ? 1.15 : 0.95;
  // A língua nasce FUNDO na goela, não na borda: nascendo em cima ela tapava
  // justamente o buraco escuro que a boca precisa mostrar.
  const baseL = bocaTopo + 9;
  for (let i = 0; i <= 32; i++) {
    const t = i / 32;
    const lx = bocaX - 1 - Math.sin(t * 2.5 * curvaL) * 14 * Math.pow(t, 1.3);
    const ly = baseL + t * (-baseL - 5);
    const w = Math.max(1, r(4 - t * 2.6));
    const x = Math.max(-21, Math.min(20, r(lx))) - (w >> 1);
    px(x, r(ly), w, 1, t < 0.5 ? lingua : ramp(lingua, -1));
    px(x, r(ly), 1, 1, ramp(lingua, 2));
    if (w >= 3) px(x + w - 1, r(ly), 1, 1, ramp(lingua, -3));
  }

  // ---- O OLHO CENTRAL ------------------------------------------------------
  // Grande, alto na esfera, e com a íris quase preenchendo o globo: é para onde
  // o jogador olha primeiro. A pupila é uma FENDA VERTICAL DE GATO — redonda
  // leria como olho de bicho de estimação, e esta coisa não é uma delas.
  // Ele sobe um pouco na esfera para deixar a metade de baixo inteira livre
  // para a boca: com o olho centrado, a arcada de cima ficava escondida atrás
  // dele e a boca perdia a borda superior.
  const ox = lado ? cx + 5 : cx + 1;
  const oy = cy - 6;
  const raioO = lado ? 6 : 7;
  disco(ox, oy, raioO + 1, ramp(escamaEsc, -2));        // pálpebra escamosa
  disco(ox, oy, raioO, ramp(dente, -1));                // esclera
  const abreI = Math.max(4, dor ? raioO - 3 : ataque ? raioO - 1 : raioO - 2);
  disco(ox, oy, abreI, iris);
  // Íris raiada em azul-acinzentado: fios claros e escuros do centro para fora.
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    traco(ox + r(Math.cos(a) * 2), oy + r(Math.sin(a) * 2),
      ox + r(Math.cos(a) * (abreI - 1)), oy + r(Math.sin(a) * (abreI - 1)), 1,
      i % 2 ? ramp(iris, 2) : ramp(iris, -2));
  }
  // A fenda não atravessa a íris de ponta a ponta: ela para dois pixels antes
  // da borda em cima e em baixo. Atravessando inteira, ela lê como uma barra
  // preta partindo o olho ao meio em vez de uma pupila dentro dele.
  const fenda = ataque ? 2 : dor ? 1 : pose.frame === 1 ? 1 : 2;
  const altP = abreI * 2 - 3;
  px(ox - r(fenda / 2), oy - abreI + 2, Math.max(1, fenda), altP, pupila);
  px(ox - r(fenda / 2), oy - abreI + 2, 1, altP, ramp(pupila, 1));
  px(ox - r(raioO * 0.45), oy - r(raioO * 0.5), 2, 2, ramp(dente, 3));
  px(ox - r(raioO * 0.45), oy - r(raioO * 0.5), 1, 1, '#ffffff');
  // Pálpebra superior pesada, com a sombra dela caindo sobre o globo: é o que
  // enfia o olho na carne em vez de deixá-lo pousado por cima.
  for (let i = -raioO; i <= raioO; i++) {
    px(ox + i, oy - raioO + r(Math.abs(i) * 0.46), 1, r(2 - Math.abs(i) * 0.12) + 1,
      ramp(escamaEsc, -1));
  }
}
