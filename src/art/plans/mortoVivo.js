// PLANO CORPORAL: mortoVivo — esqueleto, zumbi, ghoul, espectro, specter e
// wraith.
//
// POR QUE UM ARQUIVO SÓ PARA SEIS FIGURAS
//   Elas compartilham quase nada de anatomia (uma não tem carne, três não têm
//   pernas), mas compartilham o problema: no tabuleiro aparecem lado a lado, no
//   mesmo encontro, e o jogador precisa saber qual é qual pela mancha. Mantê-las
//   no mesmo arquivo é o que deixa comparar as silhuetas de uma olhada enquanto
//   se desenha — era exactamente o que faltava quando o hobgoblin e o orc
//   saíram com o mesmo retângulo.
//
// O QUE ESCOLHE A LEITURA
//   `look.undead` ∈ 'esqueleto' | 'zumbi' | 'ghoul' | 'espectro' | 'specter' |
//   'wraith'. São seis pintores, não quatro com a cor trocada.
//
//   `specter` e `wraith` já caíram no MESMO pintor, e isso era um bug de
//   jogabilidade, não de arte: quatro figuras do jogo — as duas criaturas, mais
//   a NPC Agatha e o chefe Mormesk — apareciam com uma silhueta só (IoU 1,000,
//   medido). Agatha é alguém com quem se CONVERSA e Mormesk MATA, e o jogador
//   não tinha como saber em qual dos dois vultos falar. A 55 px só a mancha
//   chega a ele, então manto três degraus mais escuro não era diferença
//   nenhuma. Hoje a separação é de MASSA:
//
//     espectro → vulto encapuzado de ombros largos, franja de tiras suspensas
//     specter  → coroa de cabelo larga em cima, sino de névoa largo embaixo
//     wraith   → duas pontas de elmo em cima, fiapos estreitos embaixo, braços
//                compridos abertos para os lados
//
//   Uma cresce para baixo, a outra afina; uma tem a cara à mostra, a outra a
//   cara enterrada num elmo. Pintadas de preto continuam sendo três coisas.
//
// VALOR, NÃO SÓ MATIZ
//   O defeito 4 do ELENCO (paleta de inimigo virou uma lama só) se conserta
//   separando o VALOR, não inventando cor nova. As famílias ficam em faixas
//   distantes: osso claro e quente, zumbi médio esverdeado, ghoul claro-frio
//   quase branco, specter violeta luminoso, wraith fumaça quase preta. De olhos
//   semicerrados dá para contar as manchas.
//
// ELEMENTO-HERÓI (defeito 5: o olho não tem onde pousar)
//   esqueleto → o vão entre as costelas · zumbi → a mandíbula caída e o ombro
//   torto · ghoul → as garras grandes demais e a língua para fora · espectro →
//   os dois pontos de luz dentro do capuz vazio · specter → as órbitas e os
//   dentes acesos · wraith → o elmo de chifres, a única peça sólida da família.
//   O resto do corpo é propositalmente menos detalhado.
//
// Contorno preto é posto depois, em sheet.js, varrendo o alfa: todo pixel
// transparente encostado na figura vira preto opaco. Isso tem duas
// consequências que mandam no desenho das três figuras incorpóreas — peça
// solta ganha moldura preta e vira borrão, e borda reta vira linha dura. Por
// isso toda franja é recortada e nenhum fiapo fica descolado do corpo.
// Nada aqui desenha contorno. Luz vem de cima e da esquerda, sempre.

import { ramp } from '../kit.js';

const r = Math.round;

// Paletas de partida. O look manda e sobrepõe campo por campo; estes valores
// existem para o plano já sair legível antes de `looks/mortosvivos.js` existir.
const CORES = {
  esqueleto: { osso: '#ded2ae', orbita: '#191520' },
  zumbi: { pele: '#8d9a7a', mancha: '#474f3c', pano: '#6b5f49', olho: '#c9c7a8' },
  ghoul: {
    pele: '#c2cdd5', garra: '#f4eee2', boca: '#5c2731',
    lingua: '#ad555f', olho: '#241f2b', pano: '#bcb09a',
  },
  espectro: { manto: '#58708f', brilho: '#a8ecff', vazio: '#131726' },
  // O specter é LUMINOSO e violeta; o wraith é fumaça preta com um metal frio
  // no elmo. Os dois nunca compartilham valor nem matiz, de propósito.
  specter: { bruma: '#8d5cc6', brilho: '#f4ecff', vazio: '#2a1442' },
  wraith: { fumaca: '#2a2e36', brilho: '#ffcf3d', vazio: '#090b0f', elmo: '#5a636f' },
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

/**
 * Diagonal translúcida — o `traco` do kit, mas emitindo alfa, e com alfa que
 * pode CAIR do começo para a ponta.
 *
 * Existe porque `traco` chama `ramp` por dentro para clarear o primeiro pixel,
 * e `ramp` só entende hexadecimal: passar um rgba para ele devolve NaN e o
 * traço some. A queda de alfa é o que faz um fio de cabelo do specter e um
 * dedo do wraith se desfazerem no ar em vez de terminarem em ponta seca.
 */
function tracoVeu({ px }, x0, y0, x1, y1, esp, cor, alfa, alfaFim = alfa) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const passos = Math.max(Math.abs(dx), Math.abs(dy), 1);
  for (let i = 0; i <= passos; i++) {
    const t = i / passos;
    px(r(x0 + dx * t), r(y0 + dy * t), esp, esp, veu(cor, alfa + (alfaFim - alfa) * t));
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
    // Três leituras separadas, e não uma com a cor trocada. Specter e wraith
    // eram o MESMO desenho (IoU 1,000 medido): quatro figuras do jogo — as duas
    // criaturas mais Agatha e Mormesk — apareciam com uma silhueta só, e uma
    // delas é uma NPC com quem se CONVERSA enquanto a outra mata. Cor não
    // resolve isso: a 55 px só a mancha chega ao jogador.
    case 'specter': return pintarSpecter(kit, look, dir, pose);
    case 'wraith': return pintarWraith(kit, look, dir, pose);
    // `espectro` é o vulto encapuzado genérico, e hoje só Agatha o usa.
    case 'espectro': return pintarEspectro(kit, look, dir, pose);
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
// SILHUETA: figura magra e esticada em meia passada de corrida, com um pé no ar
// e o outro plantado atrás, cabeça erguida acima do ombro e uma língua
// pendurada por fora do queixo, mãos em leque maiores que a própria cabeça e
// faixas de pano enroladas nos antebraços e nas canelas.
//
// POR QUE ELE MUDOU DE POSTURA
//   A figura antiga era um vulto agachado, de cabeça enfiada entre as
//   escápulas. A referência é o oposto: o ghoul CORRE, de tronco esticado e
//   queixo no alto. Agachado ele disputava a mancha com o zumbi (tronco pesado
//   e inclinado, ombro caído); correndo, não disputa com ninguém — é a única
//   criatura do elenco com um pé fora do chão, e um pé no ar sobrevive em preto.
//
// A LÍNGUA É A ASSINATURA, E TEM DE ENTRAR NA SILHUETA
//   Língua pintada por cima do peito é invisível a 55 px: fica dentro do
//   contorno da figura, e o contorno automático de `sheet.js` não entra no meio
//   da mancha. Por isso ela sai pelo canto da boca e cai POR FORA da linha do
//   queixo, no vão aberto entre a cabeça e o ombro — ali são oito linhas de
//   gancho contra o fundo.
//
// A pele é branco-azulada e FRIA, quase sem matiz: é o que impede o ghoul de
// ser lido como "zumbi magro". A garra continua sendo o pixel mais claro.
// ---------------------------------------------------------------------------

function pintarGhoul(kit, look, dir, pose) {
  const { px, volume, contato, coluna, traco } = kit;
  const c = CORES.ghoul;
  const pele = look.skin ?? c.pele;
  const garra = look.claw ?? c.garra;
  const boca = look.mouth ?? c.boca;
  const lingua = look.tongue ?? c.lingua;
  const olho = look.eyes ?? c.olho;
  const pano = look.wrap ?? c.pano;
  // O trapo da cintura sai do MESMO pano das faixas, dois degraus mais escuro:
  // no bicho é o mesmo material, só que o da cintura é o mais velho e o mais
  // sujo. Uma cor só evita inventar mais um campo de look para dois retângulos.
  const trapo = ramp(pano, -2);

  if (pose.kind === 'down') return ghoulCaido(kit, pele, garra, boca, lingua, pano);

  const side = dir === 'side';
  const back = dir === 'back';

  // O idle do ghoul é a passada, não a respiração: ele não respira. No quadro 1
  // o corpo sobe 2 px e o joelho livre sobe junto — é o alto da corrida.
  const alto = pose.kind === 'idle' && pose.frame === 1;
  const sobe = alto ? -2 : 0;
  const lance = pose.kind === 'attack' ? (pose.frame === 1 ? 5 : 2) : 0;
  const recuo = pose.kind === 'hurt' ? 3 : 0;
  const golpe = pose.kind === 'attack';

  // 63 px de pé no chão e 65 no alto da passada: o ghoul é Médio e o teto da
  // faixa é 66. Subir mais 1 px o poria fora da escala do tabuleiro, que é o
  // que dá sentido de tamanho entre as criaturas.
  const yQuadril = -29 + sobe;
  const yOmbro = -46 + sobe + recuo;
  const yQueixo = -51 + sobe + recuo;
  const yCranio = -63 + sobe + recuo;
  const inclina = side ? 3 + lance : 0;    // de perfil o tronco é uma diagonal

  // ---- pernas em passada --------------------------------------------------
  // Um pé plantado e o outro no ar, em alturas diferentes. É o único par de pés
  // desencontrados do elenco e resolve a leitura quase sozinho.
  const perna = (qx, jx, pex, yJoelho, yPe, tom) => {
    const cor = ramp(pele, tom);
    coluna(yQuadril, yJoelho - yQuadril, (t) => ({ c: qx + (jx - qx) * t, w: 6 - t * 1.5 }), cor, { topo: 1 });
    volume(jx - 2, yJoelho, 5, 3, ramp(cor, 1), { topo: 1 });
    contato(jx - 2, yJoelho + 2, 5, cor);
    coluna(yJoelho + 3, yPe - 3 - (yJoelho + 3), (t) => ({ c: jx + (pex - jx) * t, w: 4.5 - t * 1.5 }), ramp(cor, -1), { topo: 0 });
    // faixa de pano na canela: duas voltas e uma ponta solta. Ela quebra a
    // perna em dois valores e impede que o par de canelas leia como dois
    // palitos iguais.
    px(pex - 3, yPe - 9, 6, 2, pano);
    px(pex - 3, yPe - 9, 6, 1, ramp(pano, 2));
    px(pex - 3, yPe - 6, 6, 2, ramp(pano, -1));
    px(pex - 3, yPe - 5, 6, 1, ramp(pano, -3));
    px(pex + (pex < 0 ? -4 : 3), yPe - 5, 2, 1, ramp(pano, -1));
    // pé comprido e chato, de dedos separados, com a unha virada para FORA
    const dirPe = pex < 0 ? -1 : 1;
    volume(pex - 3, yPe - 3, 8, 3, ramp(cor, -1), { topo: 1 });
    for (let d = 0; d < 3; d++) px(pex + dirPe * (2 + d), yPe - 4, 1, 2, ramp(garra, -1));
    px(pex - 3, yPe - 1, 8, 1, ramp(cor, -4));
  };

  // O pé plantado fica no chão mesmo quando o quadril sobe: é a perna que
  // estica, e é dessa diferença que nasce a sensação de impulso.
  const yPeNoAr = -9 + (alto ? -3 : 0);
  if (side) {
    perna(1, -5 - lance, -8 - lance, -16 + sobe, 0, -2);
    perna(2 + lance, 8 + lance, 10 + lance, -22 + sobe, yPeNoAr, 0);
  } else {
    perna(5, 7, 8, -16 + sobe, 0, -2);
    perna(-5, -11, -9, -22 + sobe, yPeNoAr, 0);
  }

  // ---- tronco esticado ----------------------------------------------------
  // Tórax largo e cintura muito fina: um V invertido. Esticado, não dobrado —
  // o contrário exato do zumbi, que é pesado e torto.
  coluna(yOmbro, yQuadril - yOmbro + 2, (t) => {
    const w = side ? 12 - t * 3 : t < 0.3 ? 16 - t * 2 : 15.4 - (t - 0.3) * 7;
    return { c: side ? (1 - t) * inclina : 0, w };
  }, pele, { topo: 1 });

  // costelas em RELEVO sob a pele, não barra de osso solta como no esqueleto:
  // a sombra funda com o lábio claro logo abaixo é o que diz "sob a pele"
  for (let i = 0; i < 5; i++) {
    const y = yOmbro + 3 + i * 3;
    // A costela NÃO atravessa o tronco de borda a borda: sobra pele limpa dos
    // dois lados. Barra de ponta a ponta lê como listra de camiseta, não como
    // osso empurrando por dentro.
    const w = r(side ? 8 - i * 0.8 : 10 - i * 1.2);
    const x = side ? -3 + r((1 - i / 5) * inclina) : -Math.floor(w / 2);
    px(x, y, w, 1, ramp(pele, -3));
    px(x, y + 1, w, 1, ramp(pele, 1));
  }
  // barriga encovada: a cova precisa do lábio claro embaixo, senão a sombra lê
  // como mancha de tinta em vez de volume afundado
  px(side ? -2 : -5, yQuadril - 6, side ? 9 : 10, 3, ramp(pele, -2));
  px(side ? -2 : -5, yQuadril - 3, side ? 9 : 10, 1, ramp(pele, 1));

  // ---- trapo na cintura ---------------------------------------------------
  // Tiras de comprimento desigual descendo até o meio da coxa. Em preto elas
  // tapam o vão entre as duas pernas e impedem que a passada leia como um U.
  const cintoW = side ? 11 : 15;
  const cintoX = -Math.floor(cintoW / 2) + (side ? 1 : 0);
  px(cintoX, yQuadril - 1, cintoW, 3, trapo);
  px(cintoX, yQuadril - 1, cintoW, 1, ramp(trapo, 2));
  px(cintoX, yQuadril + 1, cintoW, 1, ramp(trapo, -3));
  for (let i = 0; i < (side ? 4 : 6); i++) {
    const tx = r(cintoX + i * (side ? 3 : 2.6));
    const tw = 2 + (ruido(i + 7) > 0.55 ? 1 : 0);
    const th = 4 + r(ruido(i + 3) * 8);
    px(tx, yQuadril + 2, tw, th, ramp(trapo, -1 - (i % 2)));
    px(tx, yQuadril + 2, tw, 1, trapo);
    px(tx, yQuadril + 1 + th, tw, 1, ramp(trapo, -4));
  }

  // ---- braços longos ------------------------------------------------------
  // Do ombro até abaixo do joelho, abertos para fora. A mão é maior que a
  // cabeça: é o elemento-herói e leva o pixel mais claro de toda a figura.
  const bracos = side
    ? [{ sx: 2 + lance, fora: 1, tom: 0 }]
    : [{ sx: -8, fora: -1, tom: -1 }, { sx: 8, fora: 1, tom: 0 }];

  for (const b of bracos) {
    const cor = ramp(pele, b.tom);
    const ombroY = yOmbro + 2;
    const cotoveloX = b.sx + b.fora * 5;
    const cotoveloY = ombroY + 11;
    // A célula tem 52 px de largura e a garra aberta avança 11 px além da mão:
    // a mão não pode passar de 12 px do centro, ou a ponta sai cortada na borda
    // — e garra cortada é o pior corte possível nesta criatura.
    //
    // A mão também tem de ficar FORA da perna. Encostada na coxa, os dedos e a
    // canela viram uma mancha só e o jogador perde as duas coisas de uma vez.
    const maoX = Math.max(-12, Math.min(12, golpe ? b.sx + b.fora * 3 : b.sx + b.fora * 7));
    const maoY = golpe ? ombroY + 4 : cotoveloY + 9;

    coluna(ombroY, cotoveloY - ombroY, (t) => ({ c: b.sx + (cotoveloX - b.sx) * t, w: 5 - t * 1.5 }), cor, { topo: 1 });
    volume(cotoveloX - 2, cotoveloY, 4, 3, ramp(cor, 1), { topo: 1 });
    contato(cotoveloX - 2, cotoveloY + 2, 4, cor);
    ossoDiagonal(kit, cotoveloX, cotoveloY + 2, maoX, maoY, 3, ramp(cor, -1));
    // faixa no antebraço, no meio do caminho entre cotovelo e punho
    const fx = r((cotoveloX + maoX) / 2);
    const fy = r((cotoveloY + maoY) / 2);
    px(fx - 2, fy - 1, 5, 2, pano);
    px(fx - 2, fy - 1, 5, 1, ramp(pano, 2));
    px(fx - 2, fy + 1, 5, 1, ramp(pano, -3));
    px(fx + b.fora * 3, fy + 2, 2, 1, ramp(pano, -1));   // a ponta esvoaçando
    garras(kit, maoX, maoY, b.fora, garra, cor, golpe);
  }

  // ---- pescoço e cabeça ERGUIDA ------------------------------------------
  // A cabeça está acima do ombro, de queixo no alto. Era exatamente ela que
  // estava enfiada entre as escápulas na versão antiga, e é ela que abre o vão
  // onde a língua aparece.
  coluna(yQueixo, yOmbro - yQueixo + 1, (t) => ({ c: side ? inclina - 1 + t * 2 : 0, w: 5 + t * 2 }), ramp(pele, -1), { topo: 0 });

  const cabX = side ? inclina + 2 : 0;
  coluna(yCranio, yQueixo - yCranio, (t) => {
    // crânio alto e estreito, maxilar afunilando: cabeça de cadáver seco
    const w = t < 0.35 ? 9 + t * 6 : 11.1 - (t - 0.35) * 5;
    return { c: cabX + (side ? t * 1.5 : 0), w };
  }, pele, { topo: 2 });
  // Orelha pontuda, varrida para TRÁS e para cima. De perfil ela vai para o
  // lado oposto ao do focinho: orelha apontando para a frente viraria chifre.
  for (const lado of (side ? [-1] : [-1, 1])) {
    const ex = cabX + lado * 4;
    traco(ex, yCranio + 7, ex + lado * 4, yCranio + 3, 2, ramp(pele, lado < 0 ? 1 : -2));
  }

  if (!back) {
    // olhos fundos e APAGADOS: a luz dentro do crânio é marca exclusiva do
    // espectro e do wraith. O ghoul é cego de fome, não aceso.
    const olhoY = yCranio + 4;
    const olhos = side ? [cabX + 1] : [cabX - 4, cabX + 2];
    for (const ox of olhos) {
      px(ox - 1, olhoY - 1, 5, 1, ramp(pele, -3));        // a arcada funda
      px(ox, olhoY, 3, 2, ramp(olho, 1));
      px(ox + 1, olhoY, 1, 1, olho);
    }
    // boca escancarada ocupando o terço de baixo da cara
    const bw = side ? 7 : 10;
    const bx = side ? cabX - 1 : cabX - 5;
    // Uma linha de maçã do rosto entre o olho e a boca. Sem ela a cara vira
    // olho-colado-em-boca e some a 55 px.
    const by = yQueixo - 5;
    px(bx, by, bw, 5, ramp(boca, -2));
    px(bx, by, bw, 1, ramp(pele, -4));
    px(bx + 1, by + 4, bw - 2, 1, ramp(boca, 1));
    for (let d = 0; d < 4; d++) {
      px(bx + 1 + d * 2, by, 1, 2, ramp(garra, 1));
      px(bx + 2 + d * 2, by + 4, 1, 1, ramp(garra, -1));
    }

    // ---- a língua ---------------------------------------------------------
    // Sai pelo canto da boca, abre para o lado e CAI por fora do queixo. O seno
    // é só o gancho: reta ela lê como baba, curvada lê como língua.
    const lx = side ? cabX + 5 : cabX - 5;
    const ldir = side ? 1 : -1;
    const comp = golpe ? 12 : 9;
    for (let k = 0; k < comp; k++) {
      const t = k / (comp - 1);
      const x = lx + r(ldir * Math.sin(t * 2.2) * 3);
      const lw = t > 0.78 ? 1 : 2;
      px(x, by + 2 + k, lw, 1, ramp(lingua, t < 0.25 ? -2 : t > 0.72 ? -1 : 0));
      if (lw === 2) px(x, by + 2 + k, 1, 1, ramp(lingua, 2));
    }
  } else {
    // De costas: a nuca e as duas orelhas, sem rosto e sem língua. É assim que
    // o jogador sabe que a criatura corre para longe dele.
    coluna(yCranio + 3, 8, (t) => ({ c: cabX, w: 7 - t * 2 }), ramp(pele, -1), { topo: 1 });
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
  // Quatro dedos saindo do MESMO nó e abrindo em leque. Dedos paralelos de 2 px
  // se colam um no outro e a mão sai como uma pá; é a separação nas PONTAS que
  // faz o jogador contar os dedos a 47 px de altura.
  const leque = aberto
    ? [[7, 11], [10, 5], [10, -2], [6, -6]]
    : [[5, 12], [8, 10], [10, 5], [9, -1]];
  for (const [dx, dy] of leque) {
    const tx = x + fora * dx;
    const ty = y + dy;
    traco(x + fora * 2, y + 2, tx, ty, 2, ramp(garra, -2));
    px(tx, ty, 2, 2, garra);
    px(tx + fora, ty + (dy > 5 ? 1 : -1), 1, 1, ramp(garra, 1));
  }
}

/** Ghoul no chão: a corrida interrompida, a língua ainda para fora. */
function ghoulCaido({ px, contato, coluna, traco }, pele, garra, boca, lingua, pano) {
  // Ele não desaba em pilha: cai esticado, porque morreu correndo. A mancha no
  // chão é longa e baixa, e tem um bico de garra numa das pontas.
  coluna(-8, 8, (t) => ({ c: 1, w: 26 - t * 8 }), pele, { topo: 1, base: 1 });
  contato(-12, 0, 26, pele);
  for (let i = 0; i < 3; i++) px(-7 + i * 6, -7, 7, 1, ramp(pele, -3));
  px(-4, -4, 7, 3, ramp(pano, -2));                 // o trapo amontoado
  coluna(-13, 8, (t) => ({ c: -14, w: 10 - t * 3 }), pele, { topo: 2 });
  px(-18, -10, 9, 2, ramp(boca, -2));
  px(-16, -8, 2, 4, ramp(lingua, -1));              // a língua caída de lado
  px(-16, -8, 1, 1, ramp(lingua, 2));
  // uma garra ainda esticada para fora da pilha
  traco(11, -6, 20, -9, 2, ramp(pele, -1));
  for (let d = 0; d < 3; d++) px(20 + d, -10 - d, 2, 2, ramp(garra, -1));
}

// ---------------------------------------------------------------------------
// ESPECTRO — o vulto encapuzado genérico
//
// SILHUETA: vulto encapuzado de ombros largos que não tem perna nenhuma e
// termina numa franja irregular de tiras suspensas, sem nada tocando o chão.
//
// O chão vazio embaixo é metade da leitura: nenhuma outra criatura do elenco
// tem ar entre a figura e a linha do chão. A outra metade é o capuz vazio.
//
// QUEM USA: só Agatha, a NPC espectral (`looks/npcs.js`). O specter e o wraith
// tinham caído aqui também, e era disso que vinha a colisão de silhueta: os
// três eram o mesmo capuz. Agora cada um tem o seu pintor, e esta leitura ficou
// sendo a assinatura dela — a única do trio com capuz e ombro largo, e a única
// com quem se conversa.
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
  const tiras = side ? 5 : 7;
  for (let i = 0; i < tiras; i++) {
    // passo irregular: tira colada na vizinha vira cortina, e cortina lê como
    // saia. O vão entre as tiras é o que faz a franja parecer desfiada.
    const fx = (side ? -7 : -6) + i * 2 + (i % 3 === 0 ? 1 : 0) - r(avanco * 0.3);
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
  //
  // O corpo e o ombro encolheram 6 px nesta rodada, e não é capricho. Larga, a
  // figura encavalava no wraith — a mesma barra de ombro, a mesma coluna
  // afunilando — e esses dois são justamente Agatha e Mormesk, a NPC com quem
  // se conversa e o chefe que mata. Estreita, ela vira uma vela de cabeça
  // grande contra um morcego de ombro largo: IoU 0,52 em vez de 1,000.
  const corpoW = (t) => (side ? 8 + t * 4 : 10 + t * 7);
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
  // Barra quase opaca, agora pouco mais larga que o capuz: a largura máxima
  // desta figura está no ALTO, e o pico é o capuz, não o ombro. É o contrário
  // do wraith, cujo ponto mais largo são os braços no meio do corpo.
  const ombroW = side ? 11 : 17;
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

/**
 * Espectro desfeito: quase nada no chão, só a luz apagando.
 *
 * `espalha` existe para que as três leituras incorpóreas não terminem na mesma
 * mancha: o specter se abre (1,3), o vulto encapuzado fica no meio (1,0) e o
 * wraith se fecha num borrão apertado (0,7). Se o `down` for igual para os
 * três, o jogador deixa de saber qual caiu — e é justamente no turno em que
 * algo cai que ele precisa saber.
 */
function espectroDissipado({ px }, manto, brilho, espalha = 1) {
  // Nenhuma outra criatura deixa o quadrado praticamente vazio no `down`. É
  // nisso que o jogador vê que não havia corpo para cair.
  for (let i = 0; i < 7; i++) {
    const x = r((-14 + i * 4) * espalha);
    const y = -2 - r(ruido(i + 40) * 4);
    const w = 3 + r(ruido(i + 60) * 3);
    px(x, y, w, 1, veu(ramp(manto, -2), 0.26 - i * 0.02));
    if (i % 2 === 0) px(x + 1, y - 2, 2, 1, veu(ramp(manto, -3), 0.14));
  }
  // o último ponto de luz, já quase sem força
  px(-1, -4, 2, 1, veu(brilho, 0.45));
  px(-2, -4, 1, 1, veu(ramp(brilho, -3), 0.2));
}

// ---------------------------------------------------------------------------
// SPECTER
//
// SILHUETA: caveira de cabelo em filamentos abertos em coroa para cima e para
// os lados, tronco descarnado com os dois braços dobrados longe do corpo, e da
// cintura para baixo um sino de névoa que ALARGA até quase o chão sem encostar
// nele.
//
// POR QUE ELE DEIXOU DE SER O MESMO DESENHO DO WRAITH
//   Os dois eram o mesmo vulto encapuzado com o manto em cores diferentes —
//   IoU 1,000, medido. A 55 px o detalhe some e só a mancha chega ao jogador,
//   então "um pouco mais escuro" não era diferença nenhuma. Pior: Agatha, que
//   é uma NPC com quem se CONVERSA, e Mormesk, que mata, apareciam como a
//   mesma figura. Isso é um bug de jogabilidade, não de arte.
//
//   A separação agora é de MASSA, e sobrevive pintada de preto:
//     specter → LARGO em cima (a coroa de cabelo) e LARGO embaixo (o sino),
//               estreito no meio. É uma ampulheta invertida, uma água-viva.
//     wraith  → ESTREITO em cima (duas pontas de elmo) e ESTREITO embaixo
//               (fiapos), com a maior largura no meio, nos braços abertos.
//   Uma cresce para baixo, a outra afina. Cor é o reforço, não a diferença.
//
// Translúcido: o tabuleiro aparece por dentro. O alfa cai para fora e para
// baixo, e é por isso que a figura não tem onde terminar.
// ---------------------------------------------------------------------------

function pintarSpecter(kit, look, dir, pose) {
  const { px } = kit;
  const c = CORES.specter;
  const bruma = look.cloak ?? look.outfit ?? c.bruma;
  const brilho = look.glow ?? look.eyes ?? c.brilho;
  const vazio = look.void ?? c.vazio;

  // O specter se desfaz num borrão LARGO; o wraith num borrão apertado. A
  // diferença entre os dois continua valendo no quadro de derrubado.
  if (pose.kind === 'down') return espectroDissipado(kit, bruma, brilho, 1.3);

  const side = dir === 'side';
  const back = dir === 'back';

  // Ele flutua MAIS do que os outros oscilam: 4 px contra 1 px do zumbi. É o
  // sinal de que não tem peso, e dá para ver no tabuleiro.
  const flut = pose.kind === 'idle' ? (pose.frame === 1 ? -4 : -1)
    : pose.kind === 'attack' ? (pose.frame === 1 ? -6 : -3)
      : pose.kind === 'hurt' ? 0 : -2;
  const golpe = pose.kind === 'attack';
  const eixo = side ? 2 : 0;

  const yCranioT = -56 + flut;
  const yCranioB = -45 + flut;
  const yOmbro = -42 + flut;
  const yCintura = -31 + flut;
  const yNevoaT = -32 + flut;
  const yNevoaB = -3 + flut;

  // ---- o sino de névoa ----------------------------------------------------
  // Desenhado COLUNA a coluna, e não linha a linha: cada coluna começa mais
  // embaixo quanto mais longe do eixo, e é essa curva que dá sino em vez de
  // triângulo. A base de cada coluna é irregular, senão a figura ganha uma
  // linha de corte reta e passa a parecer apoiada em alguma coisa.
  //
  // A base é MUITO irregular de propósito. `sheet.js` contorna de preto todo
  // pixel transparente encostado na figura, e uma base reta sairia como um
  // triângulo de borda preta — fica parecendo uma saia de pano. Recortada, o
  // contorno entra e sai e volta a ler como vapor.
  const meia = side ? 11 : 15;
  for (let x = -meia; x <= meia; x++) {
    const u = Math.abs(x) / meia;
    const topo = yNevoaT + r(u * u * 20);
    const fundo = yNevoaB - r(ruido(x + 31) * 8) - r(u * 4);
    for (let y = topo; y <= fundo; y++) {
      const t = (y - yNevoaT) / (yNevoaB - yNevoaT);
      const alfa = 0.6 - t * 0.26 - u * 0.14;
      const tom = u > 0.62 ? -2 : t < 0.3 ? 1 : 0;
      px(x + eixo, y, 1, 1, veu(ramp(bruma, tom), alfa));
    }
  }
  // Redemoinhos: quatro fios mais opacos descendo dentro do sino. Névoa chapada
  // lê como saia de pano; é o giro que diz que aquilo é vapor.
  for (let i = 0; i < 4; i++) {
    const sx = (side ? -6 : -10) + i * (side ? 5 : 7);
    const comp = 8 + r(ruido(i + 11) * 7);
    for (let k = 0; k < comp; k++) {
      const t = k / comp;
      px(sx + eixo + r(Math.sin(t * 3.1 + i) * 2), yNevoaT + 5 + k + i * 2, 1, 1, veu(ramp(bruma, 2), 0.32 - t * 0.16));
    }
  }

  // ---- tronco descarnado --------------------------------------------------
  // Mais opaco que a névoa: é onde está o corpo que sobrou, e o olho precisa
  // subir dali até a caveira.
  colunaVeu(kit, yOmbro, yCintura - yOmbro + 2, (t) => ({
    c: eixo, w: side ? 9 - t * 2 : 15 - t * 4,
  }), bruma, 0.86, { topo: 1 });
  for (let i = 0; i < 4; i++) {
    const w = r(side ? 7 - i : 10 - i * 1.3);
    px(eixo - Math.floor(w / 2), yOmbro + 3 + i * 2, w, 1, veu(ramp(bruma, -3), 0.82));
    px(eixo - Math.floor(w / 2), yOmbro + 4 + i * 2, w, 1, veu(ramp(bruma, 2), 0.5));
  }
  // pescoço: três linhas entre o queixo e o ombro. Sem ele a caveira senta em
  // cima do peito e o rosto deixa de ter para onde olhar.
  colunaVeu(kit, yCranioB, yOmbro - yCranioB + 1, () => ({ c: eixo, w: 5 }), ramp(bruma, -1), 0.9);

  // ---- braços dobrados LONGE do corpo -------------------------------------
  // Um erguido e um caído: a assimetria é o que impede o tronco de ler como
  // tubo. Os dois ficam fora da névoa, para existirem na silhueta.
  //
  // Eles ficam DOBRADOS e perto do corpo. O wraith é quem estica os braços
  // para longe; se o specter esticasse também, a maior largura das duas
  // figuras voltaria para o mesmo lugar e a distinção se perderia de novo.
  const bracos = side
    ? [{ ox: 5, oy: 1, ex: 12, ey: 6, mx: 13, my: -3, fora: 1, sobe: -1 }]
    : [
      { ox: 7, oy: 1, ex: 12, ey: 5, mx: 12, my: -5, fora: 1, sobe: -1 },
      { ox: -7, oy: 2, ex: -13, ey: 6, mx: -15, my: 9, fora: -1, sobe: 1 },
    ];
  for (const b of bracos) {
    tracoVeu(kit, eixo + b.ox, yOmbro + b.oy, eixo + b.ex, yOmbro + b.ey, 2, ramp(bruma, 1), 0.88);
    tracoVeu(kit, eixo + b.ex, yOmbro + b.ey, eixo + b.mx, yOmbro + b.my, 2, bruma, 0.88);
    dedosLongos(kit, eixo + b.mx, yOmbro + b.my, b.fora, b.sobe, bruma, golpe);
  }

  // ---- cabelo em coroa ----------------------------------------------------
  // Erguido como se flutuasse na água. É a peça que faz o ALTO desta figura ser
  // largo — o wraith tem duas pontas de elmo finas no mesmo lugar, e largo
  // contra estreito é a primeira coisa que separa os dois em preto.
  //
  // A coroa é uma MASSA ligada com a borda recortada, e não onze fios soltos.
  // Fio solto de 1 px vira uma linha preta depois do contorno automático, e o
  // violeta do meio some: onze fios soltos dariam um pente preto. Ligados, o
  // contorno fecha só a borda de fora e os fios acesos vivem por dentro.
  // Desenhada antes da caveira para que a raiz fique por baixo dela.
  //
  // Colunas longas e curtas ALTERNADAS: a borda de cima sai como um pente, e
  // não como uma cúpula lisa. Cúpula vira cabelo de capacete; o pente é o que
  // lê como fio solto depois que o contorno automático fecha a borda.
  const meiaC = side ? 9 : 14;
  const altura = (u) => r((1 - u * u) * 8);
  for (let x = -meiaC; x <= meiaC; x++) {
    const u = Math.abs(x) / meiaC;
    const alt = r(altura(u) * (x % 2 ? 0.55 : 1.3)) + r(ruido(x + 80) * 3);
    for (let k = 0; k < alt; k++) {
      px(x + eixo, yCranioT + 2 - k, 1, 1, veu(ramp(bruma, 2), 0.52 - k * 0.028 - u * 0.12));
    }
  }
  // fios acesos por dentro da coroa, cada um parando na borda dela
  const fios = side ? 5 : 9;
  for (let i = 0; i < fios; i++) {
    const a = (side ? -1.3 : -1.45) + i * (side ? 0.65 : 0.36);
    const x1 = r(Math.sin(a) * meiaC * 0.88);
    const u = Math.abs(x1) / meiaC;
    tracoVeu(kit, eixo + r(x1 * 0.25), yCranioT + 2, eixo + x1, yCranioT + 2 - altura(u) + 1, 1, ramp(bruma, 3), 0.78, 0.25);
  }

  // ---- caveira ------------------------------------------------------------
  // Rosto À MOSTRA, e não capuz vazio: o capuz ficou com Agatha e o elmo com o
  // wraith. Três mortos-vivos com a cara escondida seriam o mesmo bicho.
  colunaVeu(kit, yCranioT, yCranioB - yCranioT, (t) => {
    const w = t < 0.3 ? 9 + t * 5 : 10.5 - (t - 0.3) * 4;
    return { c: eixo + (side ? 1 : 0), w };
  }, ramp(bruma, 1), 0.95, { topo: 2 });

  if (!back) {
    // órbitas acesas: dois pontos de luz quase brancos dentro de um poço escuro
    const olhoY = yCranioT + 3;
    const olhos = side ? [eixo + 1] : [eixo - 4, eixo + 2];
    for (const ox of olhos) {
      px(ox - 1, olhoY - 1, 5, 3, veu(vazio, 0.92));
      px(ox, olhoY, 3, 2, brilho);
      px(ox, olhoY + 2, 3, 1, veu(ramp(brilho, -3), 0.45));
    }
    // sorriso largo: os dentes são o SEGUNDO ponto de luz da figura, e é a
    // única boca acesa do elenco — o ghoul tem a boca escura e a língua fora.
    const bw = side ? 7 : 11;
    const bx = eixo - Math.floor(bw / 2) + (side ? 2 : 0);
    const by = yCranioB - 4;
    px(bx, by, bw, 4, veu(vazio, 0.92));
    for (let d = 0; d < (side ? 3 : 5); d++) {
      px(bx + 1 + d * 2, by, 1, golpe ? 4 : 3, veu(brilho, 0.95));
    }
    px(bx, by + 4, bw, 1, veu(ramp(bruma, -3), 0.7));
  } else {
    // De costas, só a calota e a raiz do cabelo: nenhuma luz. É assim que o
    // jogador sabe que a criatura está virada para longe dele.
    colunaVeu(kit, yCranioT + 3, 7, (t) => ({ c: eixo, w: 7 - t * 2 }), ramp(bruma, -1), 0.9);
  }
}

/**
 * Mão de dedos longos e finos. `sobe` manda para onde os dedos apontam: -1 é a
 * mão erguida, 1 é a mão caída. Dedos de 1 px com alfa caindo para a ponta —
 * dedo de 2 px vira pá, e dedo que termina em ponta seca vira garfo.
 */
function dedosLongos(kit, x, y, fora, sobe, cor, aberto) {
  const { px } = kit;
  px(x - 1, y - 1, 3, 3, veu(ramp(cor, 1), 0.9));
  const leque = aberto ? [[1, 7], [4, 6], [6, 3], [6, -1]] : [[0, 6], [3, 6], [5, 4], [6, 1]];
  for (const [dx, dy] of leque) {
    tracoVeu(kit, x, y, x + fora * dx, y + sobe * dy, 1, ramp(cor, 1), 0.9, 0.5);
  }
}

// ---------------------------------------------------------------------------
// WRAITH
//
// SILHUETA: duas pontas de elmo no alto de uma cabeça pequena e afundada entre
// ombros corcundas, dois braços longos demais abertos para os lados e para
// baixo com os dedos se desfazendo em fiapos, e um corpo que AFINA até virar
// um feixe de tiras suspensas.
//
// É a leitura OPOSTA à do specter, de propósito (ver o comentário dele): esta
// figura é estreita em cima, estreita embaixo e larga no meio. Pintadas de
// preto, uma é água-viva e a outra é morcego.
//
// ELEMENTO-HERÓI: o elmo de chifres. É a única peça SÓLIDA e de metal em toda a
// família dos mortos-vivos, e é o que diz ao jogador que esta coisa já foi
// alguém com uma coroa — Mormesk. Os olhos são AMARELOS: matiz quente dentro do
// preto, contra o branco-violeta frio do specter.
// ---------------------------------------------------------------------------

function pintarWraith(kit, look, dir, pose) {
  const { px } = kit;
  const c = CORES.wraith;
  const fumaca = look.cloak ?? look.outfit ?? c.fumaca;
  const brilho = look.glow ?? look.eyes ?? c.brilho;
  const vazio = look.void ?? c.vazio;
  // `metal` já existe nos looks de NPC e é exatamente o que o elmo pede; ler
  // dele evita um campo novo só para esta peça.
  const elmo = look.helm ?? look.metal ?? c.elmo;

  if (pose.kind === 'down') return espectroDissipado(kit, fumaca, brilho, 0.7);

  const side = dir === 'side';
  const back = dir === 'back';

  const flut = pose.kind === 'idle' ? (pose.frame === 1 ? -3 : -1)
    : pose.kind === 'attack' ? (pose.frame === 1 ? -5 : -2)
      : pose.kind === 'hurt' ? 1 : -2;
  const golpe = pose.kind === 'attack';
  // Ele AVANÇA: inclinado para a frente, como quem vem pegar. O specter paira.
  const frente = (side ? 3 : 0) + (golpe ? (pose.frame === 1 ? 4 : 2) : 0);

  // A cabeça fica ACIMA da linha dos ombros, e não dentro dela. Afundada no
  // meio das corcovas, o elmo somia na barra escura do ombro e a figura virava
  // um bloco chato com duas antenas — e o elmo é justamente onde o olho tem de
  // pousar. Seis linhas de pescoço estreito entre a cara e a corcova resolvem.
  const yElmoT = -58 + flut;
  const yElmoB = -50 + flut;
  const yRostoB = -44 + flut;
  const yOmbro = -42 + flut;
  const yNucleoB = -20 + flut;
  const yFiosB = -4 + flut;

  // ---- o feixe de fiapos --------------------------------------------------
  // O corpo não termina: AFINA. Seis tiras estreitas, de comprimento desigual,
  // dentro de 9 px do eixo. É o contrário do sino do specter e é metade da
  // diferença entre os dois em preto.
  const tiras = side ? 4 : 6;
  for (let i = 0; i < tiras; i++) {
    const fx = (side ? -4 : -7) + i * (side ? 3 : 3) - r(frente * 0.4);
    const comp = 10 + r(ruido(i + 51) * 8);
    for (let k = 0; k < comp; k++) {
      const y = yNucleoB + k;
      if (y > yFiosB + 4) break;
      const t = k / comp;
      // a tira serpenteia enquanto cai: reta ela lê como franja de tapete
      const x = fx + r(Math.sin(t * 2.6 + i * 1.7) * 2);
      px(x, y, t > 0.6 ? 1 : 2, 1, veu(ramp(fumaca, -1 - r(t * 2)), 0.72 - t * 0.5));
    }
  }

  // ---- núcleo sólido ------------------------------------------------------
  // Mais opaco que o specter inteiro: o wraith é denso no meio e só se desfaz
  // nas bordas. É isso que o faz ler como um buraco no tabuleiro.
  colunaVeu(kit, yOmbro, yNucleoB - yOmbro, (t) => ({
    c: (side ? 1 : 0) + (1 - t) * frente * 0.3,
    w: side ? 10 - t * 3 : 14 - t * 6,
  }), fumaca, 0.9, { topo: 1 });
  // Fumaça solta em volta do núcleo: borda macia, sem linha de corte.
  //
  // Cada bafo é calculado a partir da largura do núcleo NAQUELA altura e
  // encosta nele por 1 px. Posição fixa não serve: de perfil o corpo é 5 px
  // mais estreito, os bafos descolavam, e `sheet.js` contornaria cada um de
  // preto — nove retângulos pretos flutuando ao lado da figura.
  for (let i = 0; i < 9; i++) {
    const lado = i % 2 ? 1 : -1;
    const y = yOmbro + 2 + i * 2;
    const t = (y - yOmbro) / Math.max(1, yNucleoB - yOmbro);
    const meio = (side ? 10 - t * 3 : 14 - t * 6) / 2;
    const w = 3 + r(ruido(i + 61) * 3);
    const base = (side ? 1 : 0) + (1 - t) * frente * 0.3;
    const x = lado < 0 ? r(base - meio) - w + 1 : r(base + meio) - 1;
    px(x, y, w, 2, veu(ramp(fumaca, -2), 0.3));
  }

  // ---- ombros corcundas ---------------------------------------------------
  // Duas corcovas acima da linha do ombro, com a cabeça afundada no vale entre
  // elas. É a postura de quem avança baixo, e é o que dá os 2 px de largura
  // máxima no MEIO da figura.
  if (!side) {
    for (const lado of [-1, 1]) {
      colunaVeu(kit, yOmbro - 2, 7, (t) => ({ c: lado * 8, w: 9 - t * 3 }), ramp(fumaca, lado < 0 ? 1 : -1), 0.88, { topo: 1 });
    }
  } else {
    colunaVeu(kit, yOmbro - 2, 7, (t) => ({ c: -2 + t * 2, w: 11 - t * 3 }), ramp(fumaca, 1), 0.88, { topo: 1 });
  }

  // ---- braços longos demais ----------------------------------------------
  // Ombro, cotovelo, punho e DEPOIS os dedos, que continuam por mais 8 px se
  // desfazendo. O braço inteiro é mais comprido que o tronco; nenhuma outra
  // criatura do elenco chega tão longe para os lados.
  //
  // O punho para em 19 px do centro e os dedos avançam mais 4: 23 px, com
  // 2 px de folga até a borda da célula. O contorno automático precisa de um
  // pixel vazio em volta, e dedo cortado rente à borda lê como linha reta.
  const bracos = side
    ? [{ ox: 6, ex: 15, ey: 10, mx: 19, my: 20, fora: 1 }]
    : [
      { ox: -9, ex: -16, ey: 9, mx: -19, my: 19, fora: -1 },
      { ox: 9, ex: 16, ey: 8, mx: 19, my: 17, fora: 1 },
    ];
  for (const b of bracos) {
    const ox = b.ox + r(frente * 0.3);
    tracoVeu(kit, ox, yOmbro + 1, b.ex + r(frente * 0.5), yOmbro + b.ey, 2, ramp(fumaca, 1), 0.9);
    tracoVeu(kit, b.ex + r(frente * 0.5), yOmbro + b.ey, b.mx, yOmbro + b.my, 2, fumaca, 0.88);
    // os dedos: quatro fiapos que começam finos e terminam em nada
    const leque = golpe ? [[4, -3], [4, 2], [3, 7], [1, 9]] : [[2, 5], [4, 7], [4, 3], [2, 9]];
    for (const [dx, dy] of leque) {
      tracoVeu(kit, b.mx, yOmbro + b.my, b.mx + b.fora * dx, yOmbro + b.my + dy, 1, ramp(fumaca, 1), 0.85, 0.1);
    }
  }

  // ---- rosto no escuro ----------------------------------------------------
  // Poço preto sob a aba do elmo. É o contraste máximo da figura e é onde os
  // dois pontos amarelos têm de brilhar.
  const rx = r(frente * 0.5);
  colunaVeu(kit, yElmoB, yRostoB - yElmoB + 1, (t) => ({ c: rx + (side ? 1 : 0), w: 9 - t * 2 }), vazio, 0.95);
  if (!back) {
    const olhoY = yElmoB + 2;
    const olhos = side ? [rx + 1] : [rx - 3, rx + 2];
    for (const ox of olhos) {
      px(ox, olhoY, 2, 2, brilho);
      px(ox - 1, olhoY, 1, 2, veu(ramp(brilho, -2), 0.6));      // o halo quente
      px(ox + 2, olhoY, 1, 2, veu(ramp(brilho, -3), 0.4));
      px(ox, olhoY + 2, 2, 1, veu(ramp(brilho, -3), 0.35));
    }
    if (golpe) {
      // no golpe a luz escapa do elmo e desce pelo peito
      for (let i = 0; i < 4; i++) {
        px(rx - 2 + i * 2, yRostoB + 1 + i, 2, 1, veu(ramp(brilho, -2), 0.26 - i * 0.05));
      }
    }
  }

  // ---- elmo de chifres ----------------------------------------------------
  // A calota é sólida e tem luz, núcleo e sombra como metal de verdade: é a
  // única peça desta figura que não é fumaça, e é por isso que o olho pousa
  // nela. A aba avança sobre o rosto e projeta a sombra onde ficam os olhos.
  const hx = rx + (side ? 1 : 0);
  colunaVeu(kit, yElmoT, yElmoB - yElmoT + 2, (t) => {
    const w = t < 0.3 ? 9 + t * 10 : 12 - (t - 0.3) * 1.5;
    return { c: hx, w };
  }, elmo, 0.96, { topo: 2 });
  px(hx - 6, yElmoB, 12, 1, ramp(elmo, -4));            // a aba, contra o rosto
  px(hx - 1, yElmoT + 2, 2, 6, ramp(elmo, 2));          // a crista central

  // Os chifres: saem da lateral da calota, abrem e sobem. Afinam de 3 px na
  // base para 1 px na ponta — chifre de espessura constante lê como antena.
  for (const lado of [-1, 1]) {
    for (let k = 0; k <= 8; k++) {
      const t = k / 8;
      const cx = hx + lado * r(3 + Math.sin(t * 1.45) * 4.5);
      const cw = t > 0.72 ? 1 : t > 0.35 ? 2 : 3;
      px(lado < 0 ? cx - cw + 1 : cx, yElmoT + 1 - k, cw, 1, ramp(elmo, t > 0.5 ? 1 : -2));
    }
  }
  if (side) {
    // De perfil os dois chifres se sobrepõem; uma sombra no de trás separa os
    // dois em vez de deixar um borrão de 2 px.
    px(hx - 7, yElmoT - 6, 3, 2, ramp(elmo, -3));
  }
}
