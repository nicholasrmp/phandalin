// PLANO CORPORAL: mortoVivo — esqueleto, zumbi, ghoul, espectro e wraith.
//
// POR QUE UM ARQUIVO SÓ PARA QUATRO FIGURAS
//   Elas compartilham quase nada de anatomia (uma não tem carne, outra não tem
//   pernas), mas compartilham o problema: no tabuleiro aparecem lado a lado, no
//   mesmo encontro, e o jogador precisa saber qual é qual pela mancha. Mantê-las
//   no mesmo arquivo é o que deixa comparar as quatro silhuetas de uma olhada
//   enquanto se desenha — era exactamente o que faltava quando o hobgoblin e o
//   orc saíram com o mesmo retângulo.
//
// O QUE ESCOLHE A LEITURA
//   `look.undead` ∈ 'esqueleto' | 'zumbi' | 'ghoul' | 'espectro'. `specter` e
//   `wraith` caem no espectro (o wraith é o mesmo plano com manto mais escuro e
//   um pouco mais alto — quem decide isso é o look, não este arquivo).
//
// VALOR, NÃO SÓ MATIZ
//   O defeito 4 do ELENCO (paleta de inimigo virou uma lama só) se conserta
//   separando o VALOR, não inventando cor nova. As quatro famílias ficam em
//   quatro faixas distantes: osso claro e quente, zumbi médio esverdeado, ghoul
//   claro-frio acinzentado com garra quase branca, espectro escuro e azul. De
//   olhos semicerrados dá para contar quatro manchas diferentes.
//
// ELEMENTO-HERÓI (defeito 5: o olho não tem onde pousar)
//   esqueleto → o vão entre as costelas · zumbi → a mandíbula caída e o ombro
//   torto · ghoul → as garras grandes demais · espectro → os dois pontos de luz
//   dentro do capuz vazio. O resto do corpo é propositalmente menos detalhado.
//
// Contorno preto é posto depois, em sheet.js, varrendo o alfa. Nada aqui
// desenha contorno. Luz vem de cima e da esquerda, sempre.

import { ramp } from '../kit.js';

const r = Math.round;

// Paletas de partida. O look manda e sobrepõe campo por campo; estes valores
// existem para o plano já sair legível antes de `looks/mortosvivos.js` existir.
const CORES = {
  esqueleto: { osso: '#ded2ae', orbita: '#191520' },
  zumbi: { pele: '#8d9a7a', mancha: '#474f3c', pano: '#6b5f49', olho: '#c9c7a8' },
  ghoul: { pele: '#a89aa0', garra: '#efe6d8', boca: '#7a3436', olho: '#e8d26a' },
  espectro: { manto: '#58708f', brilho: '#a8ecff', vazio: '#131726' },
};

/**
 * Irregularidade reprodutível. Farrapo, mancha de podridão e ponta de franja
 * precisam ser desiguais, mas IGUAIS em todo quadro: a folha de sprites é
 * montada uma vez e cacheada, e um farrapo que troca de lugar entre o quadro 0
 * e o 1 pisca na tela. Por isso um ruído por índice, e não `Math.random()`.
 */
const ruido = (i) => {
  const v = Math.sin(i * 12.9898 + 4.1414) * 43758.5453;
  return v - Math.floor(v);
};

/**
 * Alfa é a única coisa que a rampa não dá, e o espectro precisa deixar o
 * tabuleiro passar por dentro do manto. A COR continua saindo de `ramp()`;
 * aqui só se pendura o alfa nela — nunca se multiplica RGB.
 *
 * Buraco de verdade não serve para translucidez: `sheet.js` pinta de preto todo
 * pixel transparente que tenha vizinho opaco, então um manto furado sairia
 * salpicado de preto em vez de transparente.
 */
function veu(hex, alfa) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${Math.max(0, Math.min(1, alfa)).toFixed(3)})`;
}

/**
 * Mesma conta da `coluna` do kit — luz na borda esquerda, núcleo, sombra e a
 * aresta de luz refletida — mas emitindo cor com alfa. Existe porque `coluna`
 * chama `ramp` por dentro e `ramp` só entende hexadecimal.
 */
function colunaVeu({ px }, y, ch, forma, cor, alfa, { topo = 0, base = 0 } = {}) {
  if (ch <= 0) return;
  const luz = ramp(cor, 2);
  const som = ramp(cor, -2);
  const ref = ramp(cor, -1);
  for (let i = 0; i < ch; i++) {
    const { c, w } = forma(ch === 1 ? 0 : i / (ch - 1));
    if (w <= 0) continue;
    const lw = Math.max(1, r(w));
    const x = r(c) - Math.floor(lw / 2);
    let nucleo = cor;
    if (topo && i < topo) nucleo = ramp(cor, 3);
    else if (base && i >= ch - base) nucleo = ramp(cor, -3);
    px(x, y + i, lw, 1, veu(nucleo, alfa));
    if (lw >= 4) {
      px(x, y + i, 1, 1, veu(luz, alfa));
      px(x + lw - 2, y + i, 1, 1, veu(som, alfa));
      px(x + lw - 1, y + i, 1, 1, veu(ref, alfa));
    } else if (lw === 3) {
      px(x + 2, y + i, 1, 1, veu(som, alfa));
    } else if (lw === 2) {
      px(x + 1, y + i, 1, 1, veu(ref, alfa));
    }
  }
}

/** Segmento de osso: diagonal com junta marcada nas duas pontas. */
function ossoDiagonal({ traco, volume }, x0, y0, x1, y1, esp, cor) {
  traco(x0, y0, x1, y1, esp, cor);
  // A junta é o que faz um osso parecer osso e não um palito: um nó mais claro
  // e um pixel de sombra de contato logo abaixo dele.
  volume(x1 - 1, y1 - 1, esp + 1, esp + 1, ramp(cor, 1), { topo: 1 });
}

export function paintMortoVivo(kit, look, dir, pose) {
  switch (look.undead) {
    case 'zumbi': return pintarZumbi(kit, look, dir, pose);
    case 'ghoul': return pintarGhoul(kit, look, dir, pose);
    case 'espectro':
    case 'specter':
    case 'wraith': return pintarEspectro(kit, look, dir, pose);
    default: return pintarEsqueleto(kit, look, dir, pose);
  }
}

// ---------------------------------------------------------------------------
// ESQUELETO
//
// SILHUETA: figura ereta e vazada, de membros finos como gravetos com juntas
// nodosas, cujo tronco é uma gaiola de barras separadas por vãos abertos sob um
// crânio redondo de mandíbula solta.
//
// O vão entre as costelas é a criatura inteira. Os vãos são transparência de
// verdade, e não tinta escura, porque `sheet.js` vai contorná-los de preto — é
// o único lugar deste arquivo onde o contorno automático trabalha a favor.
// ---------------------------------------------------------------------------

function pintarEsqueleto(kit, look, dir, pose) {
  const { px, cut, volume, contato, coluna } = kit;
  const c = CORES.esqueleto;
  const osso = look.bone ?? look.skin ?? c.osso;
  const orbita = look.eyeSocket ?? c.orbita;
  const chama = look.glow ?? look.eyes ?? null;

  if (pose.kind === 'down') return esqueletoDesabado(kit, osso, orbita);

  const side = dir === 'side';
  const back = dir === 'back';

  // Quem não respira não tem ciclo de respiração: o balanço do idle é o peso
  // mudando de pé, e é por isso que ele mexe a bacia e não o peito.
  const bal = pose.kind === 'idle' && pose.frame === 1 ? -1 : 0;
  const avanco = pose.kind === 'attack' ? (pose.frame === 1 ? 3 : 1) : 0;
  const alto = bal + (pose.kind === 'hurt' ? -2 : 0);
  const golpe = pose.kind === 'attack';
  const tomba = pose.kind === 'hurt' ? 2 : 0;   // cabeça jogada para trás
  // No golpe o crânio SOBE e a mandíbula cai: se a mandíbula só descesse, ela
  // encostaria na clavícula e o grito viraria uma mancha de osso no pescoço.
  const sobe = golpe ? -3 : 0;

  const yPelveB = -26 + alto;
  const yPelveT = -31 + alto;
  const yToraxT = -45 + alto;
  const yOmbro = -45 + alto;
  const yCranioT = -60 + alto + sobe + tomba;
  const yCranioB = yCranioT + 10;               // linha do queixo

  // ---- pernas -------------------------------------------------------------
  // De lado uma perna vai à frente e a outra atrás; de frente elas abrem do
  // quadril ao pé. Dois ossos paralelos é o que fez a pose única do ELENCO.
  const pernas = side
    ? [{ hx: -1, pe: -6 - avanco, tom: -2 }, { hx: 2, pe: 6 + avanco, tom: 0 }]
    : [{ hx: -5, pe: -8, tom: -1 }, { hx: 5, pe: 8, tom: 0 }];

  for (const p of pernas) {
    const cor = ramp(osso, p.tom);
    const joelhoX = p.hx + (p.pe - p.hx) * 0.55;
    // fêmur: afina do quadril ao joelho
    coluna(yPelveB, -17 - yPelveB, (t) => ({ c: p.hx + (joelhoX - p.hx) * t, w: 4 - t }), cor, { topo: 1 });
    volume(r(joelhoX) - 2, -17, 4, 3, ramp(cor, 1), { topo: 1 });          // patela
    contato(r(joelhoX) - 2, -14, 4, cor);
    // tíbia: mais fina que o fêmur, e o pé plantado é a única coisa larga
    coluna(-14, 11, (t) => ({ c: joelhoX + (p.pe - joelhoX) * t, w: 3 - t }), cor, { topo: 0 });
    volume(p.pe - 2, -3, 5, 3, ramp(cor, -1), { topo: 1 });
    px(p.pe - 2, -1, 5, 1, ramp(cor, -4));
  }

  // ---- bacia --------------------------------------------------------------
  // Trapézio de cantos cortados, não caixa: a bacia é a peça que explica por
  // que as duas pernas saem separadas do tronco.
  coluna(yPelveT, yPelveB - yPelveT, (t) => ({ c: side ? 1 : 0, w: (side ? 9 : 12) - 5 * t }), osso, { topo: 1 });
  if (!side) cut(-2, yPelveB - 4, 4, 3);     // o vão da bacia, buraco de verdade

  // ---- caixa torácica -----------------------------------------------------
  if (side) {
    // De perfil a gaiola é vista de aresta: coluna vertebral atrás e as
    // costelas saem dela como ganchos curtos para a frente.
    coluna(yToraxT, yPelveT - yToraxT + 2, (t) => ({ c: -4 + t, w: 4 }), ramp(osso, -1), { topo: 1 });
    for (let i = 0; i < 5; i++) {
      const y = yToraxT + 2 + i * 3;
      const comp = 7 - Math.abs(i - 2);
      coluna(y, 1, () => ({ c: -1 + comp / 2, w: comp }), osso, { topo: 0 });
      px(-1 + r(comp), y + 1, 2, 1, ramp(osso, -2));   // a costela desce na ponta
    }
    // esterno de perfil: a única barra vertical na frente do peito
    volume(5, yToraxT + 3, 2, 9, ramp(osso, 1), { topo: 1 });
  } else if (back) {
    // De costas a leitura é a coluna vertebral: vértebras empilhadas com vão
    // entre elas, e duas omoplatas chatas por cima.
    for (let i = 0; i < 7; i++) {
      const y = yToraxT + 2 + i * 2;
      volume(-2, y, 4, 1, ramp(osso, i % 2 ? 0 : 1), { topo: 0 });
      px(-4, y, 2, 1, ramp(osso, -2));
      px(3, y, 2, 1, ramp(osso, -3));
    }
    for (const s of [-1, 1]) {
      const x = s < 0 ? -9 : 4;
      volume(x, yToraxT + 2, 5, 7, ramp(osso, s < 0 ? 0 : -1), { topo: 1 });
    }
  } else {
    // De frente: cinco barras, com o vão adensando para baixo como num tórax de
    // verdade. O VÃO é o que o jogador lê a 55 px de altura; a barra de osso é
    // só a moldura dele.
    const esterno = ramp(osso, 1);
    for (let i = 0; i < 5; i++) {
      const y = yToraxT + [2, 5, 8, 11, 13][i];
      const w = [10, 13, 13, 11, 8][i];
      coluna(y, 1, () => ({ c: 0, w }), osso, { topo: 0 });
      // as pontas caem um pixel: é o arco da costela, e sem ele a gaiola lê
      // como uma escada de degraus retos
      px(-Math.floor(w / 2), y + 1, 2, 1, ramp(osso, 1));
      px(Math.floor(w / 2) - 2, y + 1, 2, 1, ramp(osso, -2));
    }
    coluna(yToraxT + 2, 12, () => ({ c: 0, w: 3 }), esterno, { topo: 1 });
  }

  // ---- clavícula e ombros -------------------------------------------------
  const ombroW = side ? 7 : 15;
  coluna(yOmbro - 1, 2, (t) => ({ c: 0, w: ombroW - t }), ramp(osso, 1), { topo: 1 });
  contato(-Math.floor(ombroW / 2), yOmbro + 1, ombroW, osso);

  // ---- braços -------------------------------------------------------------
  // No ataque só o braço da frente se ergue, e o de trás fica onde está: dois
  // braços fazendo o mesmo movimento é o que dá a leitura de boneco de papel.
  // No `hurt` os dois antebraços são jogados para fora, como quem perde o eixo.
  const tranco = pose.kind === 'hurt' ? 2 : 0;
  const bracos = side
    ? [{ sx: 2, fora: 1, tom: 0, erguido: golpe }]
    : [
      { sx: -8, fora: -1, tom: -1, erguido: false },
      { sx: 8, fora: 1, tom: 0, erguido: golpe },
    ];

  for (const b of bracos) {
    const cor = ramp(osso, b.tom);
    const ombroY = yOmbro + 1;
    if (b.erguido) {
      // O golpe leva o braço para cima e para a FRENTE, até a altura do crânio
      // — não acima dele. Um braço esticado 12 px além da cabeça estoura os
      // 75 px úteis da célula e sai cortado na folha de sprites.
      const maoY = yCranioB - 2 + (pose.frame === 1 ? -3 : 1);
      const maoX = b.sx + b.fora * (pose.frame === 1 ? 9 : 6);
      ossoDiagonal(kit, b.sx, ombroY, b.sx + b.fora * 4, ombroY - 5, 2, cor);      // úmero
      ossoDiagonal(kit, b.sx + b.fora * 4, ombroY - 5, maoX, maoY, 2, cor);        // antebraço
      // mão de ossos: três dedos abertos, cada um de uma linha só, apontando
      // para baixo como mão que vai agarrar
      for (let d = 0; d < 3; d++) {
        px(maoX + d * b.fora, maoY + d, 1, 3, ramp(cor, d === 0 ? 1 : -1));
      }
    } else {
      const cotoveloY = ombroY + 10;
      const maoY = cotoveloY + 10;
      coluna(ombroY, 10, (t) => ({ c: b.sx + b.fora * t, w: 3 - t }), cor, { topo: 1 });
      volume(b.sx + b.fora - 1, cotoveloY, 3, 3, ramp(cor, 1), { topo: 1 });       // cotovelo
      // o antebraço cai um pouco para fora: osso vertical colado ao tronco lê
      // como palito pregado, que é o defeito 2 do ELENCO
      coluna(cotoveloY + 2, maoY - cotoveloY - 2, (t) => ({ c: b.sx + b.fora * (1 + t * (2 + tranco)), w: 2 }), cor, { topo: 0 });
      for (let d = 0; d < 3; d++) {
        px(b.sx + b.fora * (3 + tranco) + (d - 1) * b.fora, maoY, 1, 2 + (d === 1 ? 1 : 0), ramp(cor, d === 0 ? 1 : -1));
      }
    }
  }

  // ---- pescoço ------------------------------------------------------------
  // Desenhado ANTES do crânio: a mandíbula caída passa por cima das vértebras,
  // que é como a peça se empilha de verdade.
  for (let i = 0; i < 2; i++) {
    px((side ? 1 : 0) - 2, yCranioB + 1 + i * 2, 4, 1, ramp(osso, i % 2 ? -1 : 0));
  }

  // ---- crânio -------------------------------------------------------------
  const cranioW = side ? 11 : 12;
  const cranioX = side ? 1 : 0;
  const cranioY = yCranioT;   // `tomba` já entrou em yCranioT

  // Abóbada larga em cima, maçã do rosto, e o maxilar estreitando: o crânio é
  // a forma menos parecida com caixa de todo o elenco e precisa de `coluna`.
  coluna(cranioY, yCranioB - yCranioT, (t) => {
    const w = t < 0.18 ? cranioW - 3 + t * 16 : t < 0.6 ? cranioW : cranioW - (t - 0.6) * 10;
    return { c: cranioX + (side ? t * 2 : 0), w };
  }, osso, { topo: 2 });

  if (!back) {
    const orbY = cranioY + 4;
    const orbs = side ? [cranioX + 2] : [cranioX - 4, cranioX + 1];
    for (const ox of orbs) {
      // Órbita: fundo escuro, e um pixel mais claro na borda de baixo porque a
      // maçã do rosto recebe a luz de cima. Buraco chapado lê como adesivo.
      px(ox, orbY, 3, 3, orbita);
      px(ox, orbY + 3, 3, 1, ramp(osso, -2));
      px(ox, orbY - 1, 3, 1, ramp(osso, 2));
      if (chama) {
        px(ox + 1, orbY + 1, 1, 1, chama);
        px(ox, orbY + 1, 1, 1, ramp(chama, -2));
      }
    }
    // nariz: dois pixels de vazio, só para a cara não ficar lisa
    if (!side) px(cranioX - 1, orbY + 4, 2, 2, ramp(orbita, 1));
    // mandíbula solta: desce 1 px no idle e 3 no ataque, e é o que diferencia
    // o crânio calado do crânio gritando
    const mandY = yCranioB - 1 + (golpe ? 3 : 1);
    const mandW = side ? 8 : 9;
    coluna(mandY, 3, (t) => ({ c: cranioX + (side ? 2 : 0), w: mandW - t * 3 }), ramp(osso, -1), { topo: 0 });
    contato(cranioX - Math.floor(mandW / 2), mandY - 1, mandW, osso);
    for (let d = 0; d < 4; d++) px(cranioX - 3 + d * 2, mandY, 1, 1, ramp(osso, 3));
  } else {
    // nuca: uma crista e a sombra da base do crânio
    px(cranioX - 1, cranioY + 3, 3, 7, ramp(osso, -1));
    contato(cranioX - 5, yCranioB - 1, 10, osso);
  }
}

/** Esqueleto no chão: a pilha de ossos. Nada aqui lembra um corpo inteiro. */
function esqueletoDesabado({ px, volume, contato, coluna, traco }, osso, orbita) {
  // O esqueleto não cai: ele DESMONTA. É a diferença de leitura contra o zumbi,
  // que cai inteiro e continua parecendo um corpo.
  volume(-14, -5, 28, 5, ramp(osso, -2), { topo: 1, base: 1 });
  contato(-14, -1, 28, osso);
  // costelas soltas, espalhadas em diagonais diferentes
  for (let i = 0; i < 5; i++) {
    const x = -12 + i * 5;
    traco(x, -6 - r(ruido(i) * 3), x + 4 + r(ruido(i + 9) * 3), -5, 2, ramp(osso, i % 2 ? 0 : 1));
  }
  // um fêmur atravessado em cima da pilha é o que diz "isto estava de pé"
  traco(-11, -8, 2, -10, 2, ramp(osso, 1));
  // o crânio rolou para o lado, de perfil, com a órbita virada para o jogador
  coluna(-13, 9, (t) => ({ c: 13, w: t < 0.6 ? 10 : 10 - (t - 0.6) * 10 }), osso, { topo: 2 });
  px(12, -10, 3, 3, orbita);
  px(12, -7, 3, 1, ramp(osso, -2));
  px(9, -5, 7, 2, ramp(osso, -1));
}

// ---------------------------------------------------------------------------
// ZUMBI
//
// SILHUETA: humanoide inteiro mas desalinhado — um ombro bem mais alto que o
// outro, a cabeça pendida sobre o ombro baixo, um braço pendurado até perto do
// joelho e a barra da roupa terminando em dentes irregulares.
//
// A assimetria é a criatura. Se os dois ombros ficarem na mesma linha, isto é
// um plebeu mal pintado.
// ---------------------------------------------------------------------------

function pintarZumbi(kit, look, dir, pose) {
  const { px, cut, volume, contato, coluna } = kit;
  const c = CORES.zumbi;
  const pele = look.skin ?? c.pele;
  const mancha = look.rot ?? c.mancha;
  const pano = look.outfit ?? c.pano;
  const panoEsc = look.outfitDark ?? ramp(pano, -2);
  const olho = look.eyes ?? c.olho;

  if (pose.kind === 'down') return zumbiCaido(kit, pele, mancha, pano);

  const side = dir === 'side';
  const back = dir === 'back';

  // O idle do zumbi não é respiração: é o corpo oscilando sem controlar o peso.
  // Por isso o balanço mexe o tronco TODO e não só o peito.
  const bal = pose.kind === 'idle' && pose.frame === 1 ? -1 : 0;
  const avanco = pose.kind === 'attack' ? (pose.frame === 1 ? 4 : 2) : 0;
  const alto = bal + (pose.kind === 'hurt' ? -3 : 0);
  const golpe = pose.kind === 'attack';

  const yQuadril = -21;
  const yTroncoT = -41 + alto;
  const yOmbroAlto = yTroncoT;            // ombro esquerdo, erguido
  const yOmbroBaixo = yTroncoT + 4;       // ombro direito, caído
  const yCabecaB = -45 + alto;            // linha do queixo
  const yCabecaT = -57 + alto;
  const inclina = 2;                      // a cabeça pende para o lado do ombro baixo

  // ---- pernas -------------------------------------------------------------
  // Uma perna travada reta e a outra meio dobrada: é o que dá o passo arrastado
  // sem precisar de quadro novo.
  const pernas = side
    ? [{ hx: -1, pe: -5 - avanco, tom: -2, arrasta: 1 }, { hx: 2, pe: 5 + avanco, tom: 0, arrasta: 0 }]
    : [{ hx: -5, pe: -7, tom: -1, arrasta: 0 }, { hx: 5, pe: 6, tom: 0, arrasta: 1 }];

  for (const p of pernas) {
    const cor = ramp(panoEsc, p.tom);
    coluna(yQuadril, 18 - p.arrasta, (t) => ({ c: p.hx + (p.pe - p.hx) * t, w: 6 - t * 1.5 }), cor, { topo: 0 });
    contato(p.pe - 3, yQuadril + 17 - p.arrasta, 6, cor);
    // o pé do lado que arrasta fica 1 px mais alto e virado para dentro
    volume(p.pe - 3, -4 + p.arrasta, 7, 4 - p.arrasta, ramp(pele, -2), { topo: 1 });
    px(p.pe - 3, -1, 7, 1, ramp(pele, -4));
  }
  if (!side) px(-2, yQuadril, 4, 8, ramp(panoEsc, -4));   // vão entre as pernas

  // ---- tronco -------------------------------------------------------------
  // Ombro alto à esquerda, cintura torta, e a caixa inclinando: o perfil do
  // tronco é a assimetria. Caixa simétrica aqui mata a criatura.
  const largura = (t) => (side ? 11 : t < 0.2 ? 19 - t * 10 : t < 0.65 ? 17 : 15 + (t - 0.65) * 6);
  coluna(yTroncoT, yQuadril - yTroncoT - 4, (t) => ({ c: (side ? 1 : 0) + t * 1.5, w: largura(t) }), pano, { topo: 1 });

  // O ombro direito desaba: uma cunha recortada no alto da direita. Esse
  // degrau no contorno é a PRIMEIRA coisa que se lê na mancha preta — sem ele
  // isto é um plebeu mal pintado, que é o defeito 1 do ELENCO.
  for (let j = 0; j < 4; j++) {
    const corte = 6 - j;
    cut(r(largura(0) / 2) - corte + (side ? 2 : 0), yTroncoT + j, corte, 1);
  }

  // costelas marcando por baixo do pano: o corpo murchou, a roupa não
  for (let i = 0; i < 3; i++) {
    const y = yTroncoT + 7 + i * 3;
    px(side ? -2 : -6, y, side ? 8 : 10, 1, ramp(pano, -2));
    px(side ? -2 : -6, y + 1, side ? 8 : 10, 1, ramp(pano, 1));
  }

  // Farrapos: a barra é uma fileira de tiras de comprimento desigual, pintada
  // DEPOIS da perna para a perna aparecer entre os rasgos. Recortar a barra com
  // `cut` arrancaria a perna junto — a tira é o caminho certo, e é ela que faz
  // a silhueta terminar em dentes em vez de bainha reta.
  const barraT = yQuadril - 5;
  const tiras = side ? 6 : 9;
  const barraX = side ? -5 : -9;
  for (let i = 0; i < tiras; i++) {
    const x = barraX + i * 2;
    const comp = 3 + r(ruido(i + 3) * 6);
    const tom = i === 0 ? 2 : i >= tiras - 2 ? -2 : i % 3 === 0 ? 1 : 0;
    px(x, barraT, 2, comp, ramp(pano, tom));
    px(x, barraT + comp - 1, 2, 1, ramp(pano, -3));   // a ponta puída do rasgo
  }

  // manchas escuras de podridão, sempre nos mesmos lugares (ruído por índice)
  for (let i = 0; i < 6; i++) {
    const mx = -7 + r(ruido(i) * 14);
    const my = yTroncoT + 3 + r(ruido(i + 11) * 14);
    px(mx, my, 2 + (i % 2), 2, ramp(mancha, i % 2 ? 0 : -1));
  }

  // ---- braços -------------------------------------------------------------
  // O braço do ombro caído pende mais 5 px que o outro. Essa diferença é a
  // segunda coisa que se lê na silhueta, depois do ombro.
  const bracos = side
    ? [{ sx: 4, sy: yOmbroBaixo, fora: 1, tom: 0, extra: 5, erguido: golpe }]
    : [
      { sx: -10, sy: yOmbroAlto, fora: -1, tom: -1, extra: 0, erguido: golpe },
      { sx: 9, sy: yOmbroBaixo, fora: 1, tom: 0, extra: 5, erguido: false },
    ];

  for (const b of bracos) {
    const cor = ramp(pano, b.tom);
    if (b.erguido) {
      // o ataque é o braço jogado para a frente, não para cima: zumbi agarra
      const alcance = golpe && pose.frame === 1 ? 8 : 5;
      coluna(b.sy + 1, 7, (t) => ({ c: b.sx + b.fora * t * 2, w: 5 - t }), cor, { topo: 1 });
      ossoDiagonal(kit, b.sx + b.fora * 2, b.sy + 8, b.sx + b.fora * alcance, b.sy + 6, 3, ramp(pele, -1));
      maoPodre(kit, b.sx + b.fora * alcance, b.sy + 5, b.fora, pele, mancha);
    } else {
      const comp = 13 + b.extra;
      coluna(b.sy + 1, comp, (t) => ({ c: b.sx + b.fora * t * 2, w: 5 - t * 1.5 }), cor, { topo: 1 });
      const maoY = b.sy + comp;
      volume(b.sx + b.fora * 2 - 1, maoY, 4, 4, ramp(pele, -1), { topo: 1 });
      px(b.sx + b.fora * 2 - 1, maoY + 3, 4, 1, ramp(pele, -4));
      px(b.sx + b.fora * 2, maoY + 1, 1, 1, ramp(mancha, 0));
    }
    contato(b.sx - 2, b.sy, 5, pano);
  }

  // ---- pescoço ------------------------------------------------------------
  // Curto, grosso e torto para o lado do ombro caído. É ele que explica a
  // cabeça pendida; sem pescoço a cabeça flutua acima do tronco.
  coluna(yCabecaB, yTroncoT - yCabecaB + 1, (t) => ({ c: inclina - 1 + t * 1.5, w: 7 - t }), ramp(pele, -2), { topo: 1 });

  // ---- cabeça -------------------------------------------------------------
  // Pende para o lado do ombro caído e para a frente. A inclinação é a razão de
  // o zumbi nunca olhar para o jogador.
  const cabW = side ? 12 : 13;
  const cabX = inclina + (side ? 2 : 0);
  coluna(yCabecaT, yCabecaB - yCabecaT, (t) => {
    const w = t < 0.2 ? cabW - 3 + t * 15 : t < 0.7 ? cabW : cabW - (t - 0.7) * 12;
    return { c: cabX - t * 2, w };
  }, pele, { topo: 2 });
  contato(cabX - 4, yCabecaB, 8, pele);

  // couro cabeludo arrancado: uma mancha irregular no alto, do lado da luz
  px(cabX - 5, yCabecaT + 1, 5, 3, ramp(mancha, 1));
  px(cabX - 4, yCabecaT + 2, 2, 2, ramp(mancha, -2));

  if (!back) {
    const olhoY = yCabecaT + 5;
    const olhos = side ? [cabX + 2] : [cabX - 5, cabX + 1];
    for (const ox of olhos) {
      // olho fundo e sem brilho central: o reflexo vai na pálpebra, não na
      // pupila, porque é isso que tira a vida do rosto
      px(ox, olhoY, 4, 3, ramp(pele, -4));
      px(ox, olhoY, 4, 1, ramp(pele, -2));
      px(ox + 1, olhoY + 1, 2, 1, ramp(olho, -1));
    }
    // mandíbula caída: a boca é um vão escuro aberto, mais aberto no ataque
    const bocaY = yCabecaB - 4;
    const abre = golpe ? 4 : 3;
    px(cabX - 4, bocaY, 8, abre, ramp(mancha, -3));
    px(cabX - 4, bocaY, 8, 1, ramp(pele, -3));
    // o dente do zumbi é o MESMO osso do esqueleto, um degrau abaixo: a carne
    // apodrece e o dente não, e é esse contraste que faz a boca ler como boca
    const dente = ramp(CORES.esqueleto.osso, -1);
    for (let d = 0; d < 3; d++) px(cabX - 3 + d * 3, bocaY + 1, 1, 1, dente);
    // o maxilar inferior solto, descolado do rosto
    coluna(bocaY + abre, 2, (t) => ({ c: cabX - 1, w: 8 - t * 2 }), ramp(pele, -1), { topo: 1 });
  } else {
    px(cabX - 2, yCabecaT + 4, 4, 7, ramp(pele, -2));
    px(cabX - 6, yCabecaB - 3, 11, 2, ramp(mancha, 0));   // ferida na nuca
  }
}

/** Mão podre, com unhas: serve ao zumbi de braço estendido. */
function maoPodre({ px, volume }, x, y, fora, pele, mancha) {
  volume(x - 2, y, 5, 4, ramp(pele, -1), { topo: 1 });
  px(x - 2, y + 3, 5, 1, ramp(mancha, -1));
  // as três unhas em comprimentos diferentes: na mesma coluna elas lêem como
  // aresta da mão, e não como dedo
  for (let d = 0; d < 3; d++) {
    px(x + fora * (3 + (d === 1 ? 1 : 0)), y + d, 1, 1, ramp(pele, d === 0 ? 1 : -2));
  }
}

/** Zumbi no chão: cai INTEIRO e continua lendo como um corpo. */
function zumbiCaido({ px, volume, contato, coluna }, pele, mancha, pano) {
  // A diferença contra o esqueleto desabado é essa: aqui a mancha no chão tem
  // comprimento de corpo, com cabeça numa ponta e pé na outra.
  coluna(-8, 8, (t) => ({ c: -1, w: 30 - t * 4 }), pano, { topo: 1, base: 1 });
  contato(-16, -1, 32, pano);
  for (let i = 0; i < 4; i++) px(-13 + i * 7, -7, 3, 5, ramp(mancha, i % 2 ? 0 : -1));
  // cabeça virada de lado, na ponta esquerda
  coluna(-13, 9, (t) => ({ c: -17, w: t < 0.7 ? 11 : 11 - (t - 0.7) * 12 }), pele, { topo: 2 });
  px(-19, -10, 4, 2, ramp(pele, -4));
  px(-20, -6, 7, 2, ramp(mancha, -2));     // a boca aberta contra o chão
  // um braço estirado para fora da mancha do corpo
  volume(10, -9, 9, 3, ramp(pele, -1), { topo: 1 });
  px(18, -8, 3, 1, ramp(pele, -3));
}

// ---------------------------------------------------------------------------
// GHOUL
//
// SILHUETA: corpo dobrado para a frente sobre pernas flexionadas, com as
// escápulas mais altas que a cabeça e dois braços desproporcionais terminando
// em garras abertas que passam abaixo do joelho.
//
// O ghoul é o único do elenco cuja cabeça está mais BAIXA que o ombro. Isso é a
// leitura inteira: um bicho pronto para saltar.
// ---------------------------------------------------------------------------

function pintarGhoul(kit, look, dir, pose) {
  const { px, volume, contato, coluna } = kit;
  const c = CORES.ghoul;
  const pele = look.skin ?? c.pele;
  const garra = look.claw ?? c.garra;
  const boca = look.mouth ?? c.boca;
  const olho = look.eyes ?? c.olho;

  if (pose.kind === 'down') return ghoulCaido(kit, pele, garra, boca);

  const side = dir === 'side';
  const back = dir === 'back';

  // O idle do ghoul é tensão, não balanço: o corpo abaixa e sobe 2 px, como
  // bicho medindo o salto. Por isso o agachamento é que oscila.
  const tensao = pose.kind === 'idle' && pose.frame === 1 ? 2 : 0;
  const salto = pose.kind === 'attack' ? (pose.frame === 1 ? 5 : 2) : 0;
  const recuo = pose.kind === 'hurt' ? -3 : 0;
  const agacha = 4 + tensao - salto;          // quanto o corpo desce
  const golpe = pose.kind === 'attack';

  const yQuadril = -26 + agacha;
  const yTroncoT = -47 + agacha + recuo;
  const yEscapula = yTroncoT - 1;
  const yCabecaT = yTroncoT + 1;              // o alto da cabeça JÁ está abaixo
  const yCabecaB = yTroncoT + 11;             // do ombro: é a postura inteira

  // ---- pernas flexionadas -------------------------------------------------
  // Joelho projetado para fora e para a frente, canela voltando: é o zigue-zague
  // que diz "dobrado", e nenhuma das outras três criaturas tem isso.
  const pernas = side
    ? [{ hx: -2, joelho: -9, pe: -3, tom: -2 }, { hx: 3, joelho: 8 + salto, pe: 3 + salto, tom: 0 }]
    : [{ hx: -6, joelho: -11, pe: -8, tom: -1 }, { hx: 6, joelho: 11, pe: 8, tom: 0 }];

  for (const p of pernas) {
    const cor = ramp(pele, p.tom);
    const yJoelho = -15 + r(agacha * 0.4);
    coluna(yQuadril, yJoelho - yQuadril, (t) => ({ c: p.hx + (p.joelho - p.hx) * t, w: 6 - t * 1.5 }), cor, { topo: 1 });
    volume(p.joelho - 2, yJoelho, 5, 3, ramp(cor, 1), { topo: 1 });
    contato(p.joelho - 2, yJoelho + 2, 5, cor);
    // a canela volta para trás: o zigue-zague quadril-joelho-pé é o que diz
    // "dobrado", e nenhuma das outras três criaturas tem essa quebra
    coluna(yJoelho + 3, -3 - yJoelho - 3, (t) => ({ c: p.joelho + (p.pe - p.joelho) * t, w: 4 - t }), ramp(cor, -1), { topo: 0 });
    // pé comprido e chato, de dedos separados: o ghoul se apoia na planta toda
    volume(p.pe - 3, -3, 8, 3, ramp(cor, -1), { topo: 1 });
    // a unha do pé abre para FORA do corpo: as três na mesma borda deixavam o
    // pé esquerdo com garra virada para dentro
    const dirPe = p.hx < 0 ? -1 : 1;
    for (let d = 0; d < 3; d++) px(p.pe + dirPe * (2 + d), -4, 1, 2, ramp(garra, -1));
    px(p.pe - 3, -1, 8, 1, ramp(cor, -4));
  }

  // ---- tronco inclinado ---------------------------------------------------
  // De perfil o tronco é uma diagonal, não uma caixa em pé: o ombro está à
  // frente do quadril. De frente ele é um V invertido, estreito no quadril.
  coluna(yTroncoT, yQuadril - yTroncoT + 2, (t) => {
    const w = side ? 13 - t * 3 : t < 0.25 ? 17 : 17 - (t - 0.25) * 9;
    return { c: side ? (1 - t) * (4 + salto) : 0, w };
  }, pele, { topo: 1 });

  // costelas aparentes: o ghoul é o único que mostra costela SOB a pele, em
  // relevo, e não barra de osso solta como o esqueleto
  for (let i = 0; i < 4; i++) {
    const y = yTroncoT + 4 + i * 3;
    const w = side ? 9 - i : 12 - i;
    const x = side ? -2 + r((1 - i / 4) * (3 + salto)) : -Math.floor(w / 2);
    px(x, y, w, 1, ramp(pele, -3));
    px(x, y + 1, w, 1, ramp(pele, 1));
  }
  // barriga encovada, logo acima do quadril
  // barriga encovada: a cova precisa do lábio claro embaixo, senão a sombra lê
  // como mancha de tinta em vez de volume afundado
  px(side ? -1 : -5, yQuadril - 5, side ? 8 : 10, 3, ramp(pele, -2));
  px(side ? -1 : -5, yQuadril - 2, side ? 8 : 10, 1, ramp(pele, 1));

  // ---- escápulas erguidas -------------------------------------------------
  // Duas corcovas acima da linha do pescoço. É isso que põe a cabeça no buraco
  // entre os ombros e dá a postura de predador.
  if (!side) {
    for (const lado of [-1, 1]) {
      const x = lado < 0 ? -8 : 7;
      coluna(yEscapula - 3, 7, (t) => ({ c: x, w: 6 - t * 2 }), ramp(pele, lado < 0 ? 1 : -1), { topo: 1 });
    }
  } else {
    coluna(yEscapula - 3, 7, (t) => ({ c: -2 - t, w: 8 - t * 2 }), ramp(pele, 1), { topo: 1 });
  }
  // Trapézio: liga as duas corcovas. Sem ele o alto do ghoul sai como dois
  // vultos soltos no ar, e o vale entre as corcovas — onde a cabeça se enfia —
  // é justamente o que dá a leitura de bicho medindo o salto.
  coluna(yEscapula - 1, 4, (t) => ({ c: side ? -1 : 0, w: 9 - t * 2 }), ramp(pele, -1), { topo: 1 });

  // ---- braços longos ------------------------------------------------------
  // O braço vai do ombro até abaixo do joelho. Essa desproporção é o motivo de
  // o ghoul não poder ser confundido com um humano magro.
  const bracos = side
    ? [{ sx: 3 + salto, fora: 1, tom: 0 }]
    : [{ sx: -9, fora: -1, tom: -1 }, { sx: 9, fora: 1, tom: 0 }];

  for (const b of bracos) {
    const cor = ramp(pele, b.tom);
    const ombroY = yEscapula + 2;
    const cotoveloX = b.sx + b.fora * 4;
    const cotoveloY = ombroY + 12;
    // A célula tem 52 px de largura e a garra aberta avança 9 px além da mão:
    // a mão não pode passar de 11 px do centro, ou a ponta sai cortada na
    // borda da célula — e garra cortada é o pior corte possível nesta criatura.
    const maoX = Math.max(-11, Math.min(11, golpe ? b.sx + b.fora * 3 : b.sx + b.fora * 5));
    const maoY = golpe ? ombroY + 6 : cotoveloY + 12;

    coluna(ombroY, cotoveloY - ombroY, (t) => ({ c: b.sx + (cotoveloX - b.sx) * t, w: 5 - t * 1.5 }), cor, { topo: 1 });
    volume(cotoveloX - 2, cotoveloY, 4, 3, ramp(cor, 1), { topo: 1 });
    contato(cotoveloX - 2, cotoveloY + 2, 4, cor);
    ossoDiagonal(kit, cotoveloX, cotoveloY + 2, maoX, maoY, 3, ramp(cor, -1));
    garras(kit, maoX, maoY, b.fora, garra, cor, golpe);
  }

  // ---- cabeça baixa e projetada -------------------------------------------
  const cabW = 12;
  const cabX = side ? 6 + salto : 0;
  coluna(yCabecaT, yCabecaB - yCabecaT, (t) => {
    // crânio alto atrás, rosto afunilando: cabeça de rato grande, não de humano
    const w = t < 0.25 ? cabW - 2 + t * 8 : cabW - (t - 0.25) * 7;
    return { c: cabX + t * (side ? 2 : 0), w };
  }, pele, { topo: 2 });
  contato(cabX - 5, yCabecaT - 1, 10, pele);
  // De frente a cabeça cai DENTRO do contorno do peito, e o contorno automático
  // de sheet.js não entra no meio da figura. Sem estas duas arestas escuras a
  // cabeça do ghoul desaparece dentro do tronco a 47 px.
  for (const s2 of [-1, 1]) {
    px(cabX + s2 * 6 - (s2 < 0 ? 0 : 1), yCabecaT + 1, 1, yCabecaB - yCabecaT - 2, ramp(pele, -4));
  }

  if (!back) {
    const olhoY = yCabecaT + 3;
    const olhos = side ? [cabX + 2] : [cabX - 5, cabX + 2];
    for (const ox of olhos) {
      px(ox, olhoY, 3, 2, ramp(pele, -4));
      px(ox, olhoY, 3, 1, ramp(olho, -1));
      px(ox + 1, olhoY, 1, 1, olho);
    }
    // boca rasgada: a fenda passa da linha do rosto e sobe nos cantos. É o
    // detalhe que faz o ghoul parecer que não tem bochecha.
    const bocaY = yCabecaB - 4;
    const bw = side ? 10 : 12;
    const bx = side ? cabX - 2 : cabX - 6;
    px(bx, bocaY, bw, 3, ramp(boca, -2));
    px(bx, bocaY, bw, 1, ramp(pele, -3));
    px(bx - 1, bocaY - 1, 2, 2, ramp(boca, -1));          // o rasgo subindo
    px(bx + bw - 1, bocaY - 1, 2, 2, ramp(boca, -2));
    for (let d = 0; d < 5; d++) {
      px(bx + 1 + d * 2, bocaY, 1, golpe ? 2 : 1, ramp(garra, 1));
      px(bx + 2 + d * 2, bocaY + 2, 1, 1, ramp(garra, -1));
    }
  } else {
    coluna(yCabecaT + 2, 7, (t) => ({ c: cabX, w: 7 - t * 2 }), ramp(pele, -1), { topo: 1 });
  }
}

/**
 * Garra do ghoul — o elemento-herói da criatura, e a única peça do arquivo que
 * recebe o pixel mais claro de toda a figura.
 */
function garras({ px, traco }, x, y, fora, garra, pele, aberto) {
  px(x - 2, y, 5, 4, ramp(pele, -1));
  px(x - 2, y, 5, 1, ramp(pele, 1));
  px(x - 2, y + 3, 5, 1, ramp(pele, -3));
  // Três dedos saindo do MESMO nó e abrindo em leque. Dedos paralelos de 2 px
  // de espessura se colam um no outro e a mão sai como uma pá; é a separação
  // nas PONTAS que faz o jogador contar três garras a 47 px de altura.
  const leque = aberto
    ? [[6, 10], [9, 4], [9, -3]]
    : [[4, 10], [7, 8], [9, 4]];
  for (const [dx, dy] of leque) {
    const tx = x + fora * dx;
    const ty = y + dy;
    traco(x + fora * 2, y + 2, tx, ty, 2, ramp(garra, -2));
    px(tx, ty, 2, 2, garra);
    px(tx + fora, ty + (dy > 5 ? 1 : -1), 1, 1, ramp(garra, 1));
  }
}

/** Ghoul no chão: fica dobrado, as garras ainda abertas. */
function ghoulCaido({ px, contato, coluna, traco }, pele, garra, boca) {
  // Não desaba nem estica: o ghoul morre na mesma dobra em que vivia, e é por
  // isso que a mancha no chão dele tem um bico de cada lado.
  coluna(-7, 7, (t) => ({ c: 0, w: 24 - t * 6 }), pele, { topo: 1, base: 1 });
  contato(-12, -1, 24, pele);
  for (let i = 0; i < 3; i++) px(-8 + i * 6, -6, 7, 1, ramp(pele, -3));
  coluna(-12, 7, (t) => ({ c: -13, w: 10 - t * 3 }), pele, { topo: 2 });
  px(-17, -9, 9, 2, ramp(boca, -2));
  // uma garra ainda esticada para fora da pilha
  traco(10, -5, 19, -8, 2, ramp(pele, -1));
  for (let d = 0; d < 3; d++) px(19 + d, -9 - d, 2, 2, ramp(garra, -1));
}

// ---------------------------------------------------------------------------
// ESPECTRO (specter e wraith)
//
// SILHUETA: vulto encapuzado de ombros largos que não tem perna nenhuma e
// termina numa franja irregular de tiras suspensas, sem nada tocando o chão.
//
// O chão vazio embaixo é metade da leitura: nenhuma outra criatura do elenco
// tem ar entre a figura e a linha do chão. A outra metade é o capuz vazio.
// ---------------------------------------------------------------------------

function pintarEspectro(kit, look, dir, pose) {
  const { px } = kit;
  const c = CORES.espectro;
  const manto = look.cloak ?? look.outfit ?? c.manto;
  const brilho = look.glow ?? look.eyes ?? c.brilho;
  const vazio = look.void ?? c.vazio;

  if (pose.kind === 'down') return espectroDissipado(kit, manto, brilho);

  const side = dir === 'side';
  const back = dir === 'back';

  // O espectro flutua MAIS que os outros oscilam: 3 px contra 1 px do zumbi.
  // Esse é o sinal de que ele não tem peso, e dá para ver no tabuleiro.
  const flut = pose.kind === 'idle' ? (pose.frame === 1 ? -5 : -2)
    : pose.kind === 'attack' ? (pose.frame === 1 ? -7 : -4)
      : pose.kind === 'hurt' ? -1 : -3;
  const avanco = pose.kind === 'attack' ? (pose.frame === 1 ? 4 : 2) : 0;
  const golpe = pose.kind === 'attack';

  const yFranjaB = -6 + flut;
  const yFranjaT = -22 + flut;
  const yCorpoT = -42 + flut;
  const yCapuzB = -43 + flut;
  const yCapuzT = -56 + flut;

  // ---- franja que se desfaz ----------------------------------------------
  // Cada tira perde alfa até zero na ponta. É aqui que a figura "não termina":
  // não existe linha de base, e o contorno automático só pega a borda viva.
  const tiras = side ? 6 : 9;
  for (let i = 0; i < tiras; i++) {
    // passo irregular: tira colada na vizinha vira cortina, e cortina lê como
    // saia. O vão entre as tiras é o que faz a franja parecer desfiada.
    const fx = (side ? -9 : -8) + i * 2 + (i % 3 === 0 ? 1 : 0) - r(avanco * 0.3);
    const comp = 7 + r(ruido(i + 1) * 9);
    const topo = yFranjaT + r(ruido(i + 20) * 3);
    for (let k = 0; k < comp; k++) {
      const y = topo + k;
      if (y > yFranjaB + 2) break;
      const alfa = 0.62 * (1 - k / comp);
      const w = k > comp * 0.55 ? 1 : 2;
      px(fx + (k > comp * 0.55 ? 1 : 0), y, w, 1, veu(ramp(manto, -1 - Math.floor(k / 4)), alfa));
    }
  }
  // dois fiapos soltos abaixo da franja: a cauda de névoa que o jogador lê como
  // "está subindo", e não como "está apoiado"
  for (let i = 0; i < 3; i++) {
    px(-5 + i * 5, yFranjaB + 2 + i, 2, 1, veu(ramp(manto, -3), 0.2));
  }

  // ---- corpo --------------------------------------------------------------
  // Alarga do nada para os ombros. Translúcido no meio, mais firme em cima: o
  // olho sobe naturalmente até o capuz.
  const corpoW = (t) => (side ? 9 + t * 5 : 13 + t * 9);
  // De perfil o vulto INCLINA: o capuz vai à frente e os farrapos arrastam
  // atrás, o que dá à vista de lado uma diagonal em vez do mesmo retângulo
  // vertical da vista de frente.
  colunaVeu(kit, yCorpoT, yFranjaT - yCorpoT + 2, (t) => ({
    c: (side ? 1 + (1 - t) * 3 : 0) - (1 - t) * avanco * 0.4,
    w: corpoW(1 - t),
  }), manto, 0.62);

  // Dobras do manto: mais OPACAS que o tecido em volta, nunca menos. Uma dobra
  // mais transparente que o pano lê como vinco em fundo escuro e como mancha
  // clara em fundo claro — e o tabuleiro tem os dois.
  for (let d = -1; d <= 1; d++) {
    const x = (side ? 1 : 0) + d * 5;
    colunaVeu(kit, yCorpoT + 3, 14, (t) => ({ c: x + t * d, w: 2 }), ramp(manto, d < 0 ? 2 : -2), 0.78);
  }

  // ---- ombros ------------------------------------------------------------
  // Barra larga e quase opaca. Dá ao espectro a única silhueta do elenco em que
  // a largura máxima está no alto da figura.
  const ombroW = side ? 13 : 23;
  colunaVeu(kit, yCapuzB - 2, 5, (t) => ({ c: 0, w: ombroW - t * 4 }), manto, 0.82, { topo: 1 });
  px(-Math.floor(ombroW / 2), yCapuzB + 3, ombroW, 1, veu(ramp(manto, -4), 0.7));

  // ---- capuz -------------------------------------------------------------
  // A peça mais opaca da figura, porque é onde está a informação. Abóbada
  // estreitando para cima e bico para a frente.
  const capuzW = side ? 13 : 16;
  const capuzX = side ? 2 + r(avanco * 0.4) : 0;
  colunaVeu(kit, yCapuzT, yCapuzB - yCapuzT + 1, (t) => {
    const w = t < 0.25 ? capuzW - 5 + t * 20 : capuzW;
    return { c: capuzX + (side ? t * 2 : 0), w };
  }, manto, 0.93, { topo: 2 });

  if (!back) {
    // A boca do capuz é OPACA e quase preta: é o contraste máximo da figura, e
    // sem ele os dois pontos de luz não têm onde brilhar.
    const bocaW = side ? 7 : 11;
    const bocaX = capuzX - Math.floor(bocaW / 2) + (side ? 3 : 0);
    const bocaY = yCapuzT + 4;
    px(bocaX, bocaY, bocaW, 7, vazio);
    px(bocaX, bocaY, bocaW, 1, ramp(vazio, -2));
    // o fundo do capuz devolve um resto de luz: vazio chapado lê como adesivo
    // preto colado na frente da figura
    px(bocaX + 1, bocaY + 5, bocaW - 2, 1, ramp(vazio, 2));
    px(bocaX + bocaW - 1, bocaY, 1, 7, ramp(manto, -3));     // a aba do capuz
    px(bocaX, bocaY + 7, bocaW, 1, ramp(manto, -4));

    // dois pontos de luz dentro do vazio, mais abertos no ataque
    const olhos = side ? [bocaX + 3] : [bocaX + 2, bocaX + bocaW - 4];
    for (const ox of olhos) {
      const oy = bocaY + 2;
      px(ox, oy, 2, golpe ? 3 : 2, brilho);
      px(ox - 1, oy, 1, 2, veu(ramp(brilho, -2), 0.7));      // o halo frio
      px(ox + 2, oy, 1, 2, veu(ramp(brilho, -3), 0.5));
      px(ox, oy - 1, 2, 1, veu(ramp(brilho, -2), 0.45));
    }
    if (golpe) {
      // no golpe a luz escapa do capuz: um rastro que some para fora
      for (let i = 0; i < 4; i++) {
        px(bocaX + 1 + i * 3, bocaY + 8 + i, 2, 1, veu(ramp(brilho, -2), 0.3 - i * 0.06));
      }
    }
  } else {
    // De costas o capuz é cheio: nenhuma luz, só a crista do pano. É assim que
    // o jogador sabe que a criatura está virada para longe dele.
    colunaVeu(kit, yCapuzT + 3, 9, (t) => ({ c: capuzX, w: 5 - t * 2 }), ramp(manto, 1), 0.9);
    px(capuzX - 7, yCapuzB - 2, 14, 1, veu(ramp(manto, -4), 0.8));
  }
}

/** Espectro desfeito: quase nada no chão, só a luz apagando. */
function espectroDissipado({ px }, manto, brilho) {
  // Nenhuma outra criatura deixa o quadrado praticamente vazio no `down`. É
  // nisso que o jogador vê que não havia corpo para cair.
  for (let i = 0; i < 7; i++) {
    const x = -14 + i * 4;
    const y = -2 - r(ruido(i + 40) * 4);
    const w = 3 + r(ruido(i + 60) * 3);
    px(x, y, w, 1, veu(ramp(manto, -2), 0.26 - i * 0.02));
    if (i % 2 === 0) px(x + 1, y - 2, 2, 1, veu(ramp(manto, -3), 0.14));
  }
  // o último ponto de luz, já quase sem força
  px(-1, -4, 2, 1, veu(brilho, 0.45));
  px(-2, -4, 1, 1, veu(ramp(brilho, -3), 0.2));
}
