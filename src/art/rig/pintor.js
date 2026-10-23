// O PINTOR DO ESQUELETO: carne sobre os ossos.
//
// COMO ELE SOMBREIA, E POR QUE ASSIM
//
// O pintor antigo escolhia o tom à mão: `ramp(cor, 2)` aqui, `ramp(cor, -3)`
// ali. Funciona para um retângulo e desmonta num membro que gira, porque o
// lado iluminado de um braço depende de para onde o braço aponta — e o antigo
// não sabia para onde o braço apontava.
//
// Aqui cada parte é um VOLUME: uma cápsula entre duas juntas, com raio em cada
// ponta. Para cada pixel calcula-se a que distância do eixo ele está e de que
// lado, e esse número escolhe o tom. O resultado é que o braço levantado
// continua iluminado por cima e sombreado por baixo sem ninguém decidir nada.
//
// Quatro tons por material, que é o que a referência usa:
//   0 luz    a aresta virada para a fonte
//   1 corpo  a maior parte
//   2 sombra o lado oposto
//   3 borda  a luz refletida na quina de fora — sem ela a peça lê como caixa
//
// A luz vem do alto e da esquerda, como no resto do jogo.

// AS CORES, COM MATIZ DESLOCADO E ORÇAMENTO FECHADO.
//
// A primeira versão tinha 30 cores numa figura e rampas RETAS — mesmo matiz,
// só mais claro ou mais escuro. A skill `pixel-art` chama isso de "muddy,
// dull, lifeless", e tem nome para o resto: o limite é 8-16 cores por
// personagem, e cada degrau precisa de 20% de diferença de luminosidade,
// senão "details disappear".
//
// Então cada rampa aqui DESLOCA O MATIZ ao longo dela: a sombra puxa para o
// vermelho e o realce para o amarelo, que é o que dá vida a uma paleta curta.
// Os passos de luminosidade são todos de 20 ou mais, medidos.
//
//   PELE    matiz 26 -> 56, luminosidade 22/42/62/82
//   COURO   matiz 18 -> 40  (serve de MADEIRA também: reusar cor é a regra)
//   METAL   matiz 220 -> 204, frio contra a pele quente
//
// Total: 15 cores com o contorno. O teto é 16.
export const PELE = ['#e3e1bf', '#d6c066', '#b07d27', '#5a3416'];
export const CABELO = ['#4f4c61', '#1a1a23', '#1a1a23', '#1a1a23'];
export const COURO = ['#bfa97d', '#936639', '#42261a', '#42261a'];
export const METAL = ['#bcc3c7', '#717f8e', '#393f4c', '#393f4c'];
export const MADEIRA = COURO;
export const OSSO = ['#e2e0d5', '#b5ab87', '#b5ab87', '#b5ab87'];
export const CONTORNO = '#12101a';
/**
 * O ÚNICO ACENTO. O olho é o lugar onde uma cor própria se paga: é ele que
 * diz que há alguém ali. Todo o resto do rosto reusa a paleta.
 */
const BRASA = '#ff8c14';
/**
 * Contorno do lado da luz — reusa o tom mais escuro da PELE em vez de ganhar
 * cor própria. A skill pede um "medium shade" do material, e esse é.
 */
const CONTORNO_LUZ = PELE[3];

// CONTAGEM FECHADA: 4 pele + 2 cabelo + 3 couro + 3 metal + 2 osso
// + contorno + brasa = 16. O teto da skill é 16, e as rampas repetem a última
// entrada de propósito — quem chama pede o índice 3 e recebe o tom escuro,
// sem precisar saber quantos degraus o material tem.

const LUZ = { x: -0.62, y: -0.78 };    // alto-esquerda, normalizada

/** Buffer de índices de cor. 0 é vazio; o resto indexa `cores`. */
function novoBuffer(w, h) {
  // `p` guarda de QUE PARTE cada pixel é. Sem isso o contorno só circunda a
  // silhueta externa, e um braço encostado no tronco — mesma cor, sem linha
  // entre os dois — simplesmente some. A linha interna é metade do que faz
  // pixel art ler; a outra metade é o sombreado.
  return { w, h, d: new Int16Array(w * h), p: new Int16Array(w * h), cores: [null] };
}

/** Qual parte está sendo pintada agora. Lido por `por`. */
let PARTE = 1;
export function comParte(id, fn) { const antes = PARTE; PARTE = id; fn(); PARTE = antes; }

function tom(buf, paleta, i) {
  const hex = paleta[i];
  let k = buf.cores.indexOf(hex);
  if (k < 0) { buf.cores.push(hex); k = buf.cores.length - 1; }
  return k;
}

const por = (buf, x, y, k) => {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= buf.w || y >= buf.h) return;
  buf.d[y * buf.w + x] = k;
  buf.p[y * buf.w + x] = PARTE;
};

/**
 * CÁPSULA: o volume entre duas juntas, com raio variável.
 *
 * `vira` gira a leitura da luz em torno do eixo do próprio membro. Serve para
 * o tronco, que não é um cilindro solto no espaço: ele tem frente e costas, e
 * quando a criatura vira, a parte iluminada tem de virar junto.
 */
function capsula(buf, paleta, ax, ay, bx, by, ra, rb, { vira = 0, escuro = 0 } = {}) {
  const dx = bx - ax; const dy = by - ay;
  const comp2 = dx * dx + dy * dy || 1e-6;
  // A normal do eixo, girada por `vira`: é contra ela que a luz é medida.
  const c = Math.cos(vira); const s = Math.sin(vira);
  const nx0 = -dy / Math.sqrt(comp2); const ny0 = dx / Math.sqrt(comp2);
  const nx = nx0 * c - ny0 * s; const ny = nx0 * s + ny0 * c;
  const lado = Math.sign(nx * LUZ.x + ny * LUZ.y) || 1;

  const x0 = Math.floor(Math.min(ax, bx) - Math.max(ra, rb) - 1);
  const x1 = Math.ceil(Math.max(ax, bx) + Math.max(ra, rb) + 1);
  const y0 = Math.floor(Math.min(ay, by) - Math.max(ra, rb) - 1);
  const y1 = Math.ceil(Math.max(ay, by) + Math.max(ra, rb) + 1);
  const ks = [0, 1, 2, 3].map((i) => tom(buf, paleta, Math.min(3, i + escuro)));

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const px = x - ax; const py = y - ay;
      let t = (px * dx + py * dy) / comp2;
      t = Math.max(0, Math.min(1, t));
      const cx = ax + dx * t; const cy = ay + dy * t;
      const r = ra + (rb - ra) * t;
      const ex = x - cx; const ey = y - cy;
      const d = Math.hypot(ex, ey);
      if (d > r) continue;
      // `u` é a posição na seção: -1 no lado da luz, +1 no lado oposto.
      const u = r < 0.6 ? 0 : ((ex * nx + ey * ny) / r) * lado;
      // BANDING — a skill dá nome ao defeito: "parallel bands of color
      // following the same path". Com limiares fixos, cada membro saía com
      // quatro tiras retas e paralelas ao osso, e o olho lê tira, não volume.
      // O conserto que ela pede é "vary the length of color runs": o limiar
      // ondula ao longo do comprimento, então a fronteira entre os tons deixa
      // de ser uma reta.
      const onda = Math.sin(t * 9.0) * 0.085;
      const i = u < -0.42 + onda ? 0 : u < 0.3 + onda ? 1 : u < 0.82 ? 2 : 3;
      por(buf, x, y, ks[i]);
    }
  }
}

/** Massa arredondada — crânio, maçã do rosto, umbo do escudo. */
function bolha(buf, paleta, cx, cy, rx, ry, { escuro = 0, achata = 0 } = {}) {
  const ks = [0, 1, 2, 3].map((i) => tom(buf, paleta, Math.min(3, i + escuro)));
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const ex = (x - cx) / rx; const ey = (y - cy) / ry;
      const d = Math.hypot(ex, ey);
      if (d > 1) continue;
      const u = (ex * -LUZ.x + ey * -LUZ.y) * (1 - achata) + achata * 0.1;
      const i = u > 0.44 ? 0 : u > -0.22 ? 1 : u > -0.76 ? 2 : 3;
      por(buf, x, y, ks[i]);
    }
  }
}

/** Retângulo cru, para detalhe fino: dente, osso, rebite. */
function marca(buf, paleta, x, y, w, h, i) {
  const k = tom(buf, paleta, i);
  for (let b = 0; b < h; b++) for (let a = 0; a < w; a++) por(buf, x + a, y + b, k);
}

/**
 * A LINHA ENTRE AS PARTES.
 *
 * Roda ANTES do contorno externo e escurece o pixel do lado de TRÁS da
 * fronteira — a parte com id menor, que é a desenhada antes e portanto a mais
 * distante. Assim o braço da frente fica inteiro e é o tronco que cede o
 * pixel, que é como se desenha à mão.
 */
function separar(buf) {
  const k = tom(buf, ['#1d1718'], 0);
  const copia = Int16Array.from(buf.p);
  const em = (x, y) => (x < 0 || y < 0 || x >= buf.w || y >= buf.h ? -1 : copia[y * buf.w + x]);
  for (let y = 0; y < buf.h; y++) {
    for (let x = 0; x < buf.w; x++) {
      const a = em(x, y);
      if (a <= 0) continue;
      let vizinhoMaior = false;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const b = em(x + dx, y + dy);
        if (b > a) { vizinhoMaior = true; break; }
      }
      if (vizinhoMaior) buf.d[y * buf.w + x] = k;
    }
  }
}

/** Contorno de um pixel ao redor de tudo que foi pintado. */
function contornar(buf) {
  // SELOUT — contorno seletivo.
  //
  // Preto uniforme em volta de tudo transforma o contorno numa GAIOLA: a
  // figura fica recortada e chapada. A skill descreve o conserto: a aresta
  // virada para a luz recebe um tom médio, a aresta na sombra fica preta.
  // "The outline becomes part of the shading system rather than a separate
  // cage around the sprite."
  const escuro = tom(buf, [CONTORNO], 0);
  const claro = tom(buf, [CONTORNO_LUZ], 0);
  const copia = Int16Array.from(buf.d);
  const cheio = (x, y) => x >= 0 && y >= 0 && x < buf.w && y < buf.h && copia[y * buf.w + x] > 0;
  for (let y = 0; y < buf.h; y++) {
    for (let x = 0; x < buf.w; x++) {
      if (cheio(x, y)) continue;
      // De que lado está o corpo? O vetor que aponta PARA FORA dele é o
      // oposto, e é ele que se compara com a luz.
      let fx = 0; let fy = 0;
      if (cheio(x - 1, y)) fx += 1;
      if (cheio(x + 1, y)) fx -= 1;
      if (cheio(x, y - 1)) fy += 1;
      if (cheio(x, y + 1)) fy -= 1;
      if (!fx && !fy) continue;
      const n = Math.hypot(fx, fy) || 1;
      const viradaParaALuz = ((fx / n) * LUZ.x + (fy / n) * LUZ.y) > 0.3;
      buf.d[y * buf.w + x] = viradaParaALuz ? claro : escuro;
    }
  }
}

function despejar(buf, ctx, ox, oy, escala) {
  ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < buf.h; y++) {
    for (let x = 0; x < buf.w; x++) {
      const k = buf.d[y * buf.w + x];
      if (!k) continue;
      ctx.fillStyle = buf.cores[k];
      ctx.fillRect(ox + x * escala, oy + y * escala, escala, escala);
    }
  }
}

// ---------------------------------------------------------------------------
/**
 * Pinta a figura inteira.
 *
 * @param ctx      onde despejar
 * @param juntas   já projetadas: { x, y, prof } em pixels lógicos
 * @param opcoes   { ox, oy, escala, alt } — `alt` é a altura da figura, de que
 *                 saem todas as grossuras, para o mesmo pintor servir ao
 *                 goblin de 41 px e ao bugbear de 73.
 */
export function pintarFigura(ctx, juntas, { ox = 0, oy = 0, escala = 1, alt = 130, margem = 20 } = {}) {
  const w = Math.ceil(alt * 1.1) + margem * 2;
  const h = alt + margem * 2;
  const buf = novoBuffer(w, h);
  const cx = Math.round(w / 2);
  const chao = h - margem;
  const J = (n) => ({ x: cx + juntas[n].x, y: chao + juntas[n].y, p: juntas[n].prof });
  const u = alt / 130;                      // unidade: tudo escala com a figura

  const perto = (a, b) => (J(a).p + J(b).p) / 2 > 128;

  // ---- as partes, da mais longe para a mais perto -------------------------
  const membros = [
    { de: 'quadrilE', a: 'joelhoE', r: [7, 5.4], p: PELE },
    { de: 'joelhoE', a: 'peE', r: [5.4, 4.4], p: PELE },
    { de: 'quadrilD', a: 'joelhoD', r: [7, 5.4], p: PELE },
    { de: 'joelhoD', a: 'peD', r: [5.4, 4.4], p: PELE },
    { de: 'ombroE', a: 'cotoveloE', r: [5.4, 4.2], p: PELE },
    { de: 'cotoveloE', a: 'maoE', r: [4.2, 3.4], p: PELE },
    { de: 'ombroD', a: 'cotoveloD', r: [5.4, 4.2], p: PELE },
    { de: 'cotoveloD', a: 'maoD', r: [4.2, 3.4], p: PELE },
  ].map((m) => ({ ...m, prof: (juntas[m.de].prof + juntas[m.a].prof) / 2 }));

  const troncoProf = (juntas.pescoco.prof + juntas.quadrilD.prof) / 2;

  const desenhaMembro = (m) => {
    const A = J(m.de); const B = J(m.a);
    capsula(buf, m.p, A.x, A.y, B.x, B.y, m.r[0] * u, m.r[1] * u,
      { escuro: m.prof < 118 ? 1 : 0 });
  };

  const desenhaPonta = (n, r, p) => {
    const A = J(n);
    bolha(buf, p, A.x, A.y, r * u, r * u * 0.92, { escuro: A.p < 118 ? 1 : 0 });
  };

  const desenhaTronco = () => {
    const P = J('pescoco');
    const qD = J('quadrilD'); const qE = J('quadrilE');
    const q = { x: (qD.x + qE.x) / 2, y: (qD.y + qE.y) / 2 };
    const oD = J('ombroD'); const oE = J('ombroE');
    // No perfil os dois ombros projetam no mesmo x e o vão vira zero — o
    // tronco encolhia para 12 px e a figura sumia. O corpo tem PROFUNDIDADE:
    // visto de lado ele mantém a maior parte da espessura.
    const vao = Math.abs(oE.x - oD.x);
    const ombroR = Math.max(9 * u, vao / 2 + 2 * u);
    // O TRONCO AFINA DO OMBRO À CINTURA.
    //
    // Com raio constante ele saía um TUBO, e tubo com cabeça em cima é boneco
    // de palito grosso. A diferença entre ombro e cintura é metade do que faz
    // uma figura ler como corpo; a outra metade é o pescoço existir.
    capsula(buf, PELE, (oD.x + oE.x) / 2, P.y + 1 * u, q.x, q.y + 1 * u,
      ombroR, ombroR * 0.56);
    // o peitoral: duas massas, para o peito não ser uma chapa
    for (const s2 of [-1, 1]) {
      bolha(buf, PELE, (oD.x + oE.x) / 2 + s2 * ombroR * 0.42, P.y + 5 * u,
        ombroR * 0.46, 4 * u, { achata: 0.3 });
    }
    // a sombra sob o peitoral marca onde a barriga começa
    capsula(buf, PELE, (oD.x + oE.x) / 2 - ombroR * 0.6, P.y + 9 * u,
      (oD.x + oE.x) / 2 + ombroR * 0.6, P.y + 9 * u, 1.2 * u, 1.2 * u, { escuro: 2 });
    // PESCOÇO: curto e grosso, mas presente. Sem ele a cara pousa no ombro.
    capsula(buf, PELE, P.x, P.y + 2 * u, P.x, P.y - 4 * u, 4.2 * u, 3.6 * u, { escuro: 1 });
  };

  // Ordem: o que está atrás primeiro.
  const fila = [
    ...membros.filter((m) => m.prof <= troncoProf).sort((a, b) => a.prof - b.prof)
      .map((m) => ({ prof: m.prof, faz: () => desenhaMembro(m) })),
    { prof: troncoProf, faz: desenhaTronco },
    ...membros.filter((m) => m.prof > troncoProf).sort((a, b) => a.prof - b.prof)
      .map((m) => ({ prof: m.prof, faz: () => desenhaMembro(m) })),
  ];
  fila.forEach((parte, i) => comParte(10 + i, parte.faz));
  // MÃO E PÉ. Sem eles o braço termina num toco e a perna num tubo cortado —
  // e é a mão que diz que a criatura SEGURA a arma, em vez de a arma pairar.
  comParte(40, () => {
    desenhaPonta('peE', 5.4, COURO); desenhaPonta('peD', 5.4, COURO);
    desenhaPonta('maoE', 4.2, PELE); desenhaPonta('maoD', 4.2, PELE);
  });

  comParte(50, () => cabeca(buf, J, u, juntas));
  comParte(70, () => equipamento(buf, J, u, perto));
  separar(buf);
  contornar(buf);
  despejar(buf, ctx, ox, oy, escala);
  return { w, h };
}

// ---------------------------------------------------------------------------
/**
 * A CABEÇA.
 *
 * É a peça mais difícil e a que mais decide se a figura tem alguém dentro. O
 * que a faz ler como goblin, em ordem: a ORELHA, que sai do contorno; a
 * ARCADA, que põe o olho na sombra; o FOCINHO adiantado com a dentuça; e só
 * depois a cor.
 */
function cabeca(buf, J, u, juntas) {
  const N = J('nariz'); const P = J('pescoco');
  const oD = J('orelhaD'); const oE = J('orelhaE');
  const olhD = J('olhoD'); const olhE = J('olhoE');
  // O ROSTO APARECE ATÉ O PERFIL, E SÓ SOME DE COSTAS.
  //
  // O teste era `N.p > 128`, profundidade absoluta. No perfil exato o nariz
  // tem x = 0, logo profundidade 128 — e o rosto caía no ramo "de costas". A
  // cara sumia justo nas duas vistas laterais. O que decide é o nariz estar à
  // frente DO PESCOÇO, não de um número fixo.
  const frente = N.p >= P.p;

  // O TAMANHO DA CABEÇA SAI DO PESCOÇO, NÃO DE UMA CONSTANTE.
  //
  // A primeira versão usava um raio fixo centrado NO NARIZ, e a cabeça saía
  // pequena e enfiada no tronco. Em anatomia o nariz fica a uns 40% da altura
  // da cabeça abaixo do topo — então é a distância pescoço-nariz que diz o
  // tamanho, e o crânio mora ACIMA do nariz, não em volta dele.
  const hh = Math.max(14 * u, Math.hypot(N.x - P.x, N.y - P.y) / 0.42);
  const cranioR = hh * 0.5;
  const cx = N.x + (P.x - N.x) * 0.18;
  const cy = N.y - hh * 0.2;

  // A CABEÇA É UMA COLUNA COM PERFIL, NÃO DUAS BOLHAS EMPILHADAS.
  //
  // Com bolhas, a mandíbula engolia o pescoço e a cara pousava no peito. Aqui
  // a largura é função da altura: estreita no alto do crânio, mais larga na
  // maçã do rosto, e afinando até o queixo. É o perfil que faz uma cabeça ler
  // como cabeça em vez de bola.
  const topo = cy - cranioR;
  const queixo = N.y + hh * 0.42;
  const altura = queixo - topo;
  const perfil = (t) => (
    t < 0.16 ? 0.58 + t * 2.4
    : t < 0.52 ? 1.0
    : t < 0.74 ? 1.0 - (t - 0.52) * 0.5
    : 0.89 - (t - 0.74) * 1.5);
  for (let i = 0; i <= Math.ceil(altura); i++) {
    const t = i / altura;
    const y = topo + i;
    const r = cranioR * perfil(Math.min(1, t));
    if (r <= 0.4) continue;
    // Avança com o focinho na metade de baixo: goblin tem a cara projetada.
    const desl = t > 0.45 ? (t - 0.45) * hh * 0.1 * Math.sign(N.x - P.x || 1) : 0;
    capsula(buf, PELE, cx - r + desl, y, cx + r + desl, y, 0.55, 0.55,
      { vira: Math.PI / 2, escuro: t > 0.82 ? 1 : 0 });
  }

  // O CABELO VEM ANTES DO ROSTO, e para ACIMA da sobrancelha.
  //
  // Desenhado por último, ele cobria os olhos — a cara saía com uma barra
  // preta onde devia estar o olhar, que é o defeito mais caro possível numa
  // figura pequena. Juba cai dos lados e de trás; na testa ela recua.
  comParte(52, () => cabelo(buf, cx, cy, cranioR, u, !frente, N.y - hh * 0.12));

  // ---- orelhas: a assinatura, e saem do contorno --------------------------
  for (const [o, s] of [[oD, -1], [oE, 1]]) {
    if (Math.abs(o.x - cx) < 1.5 * u && o.p < 110) continue;   // a de trás some
    const fora = o.p < 118 ? 1 : 0;
    // A ORELHA É DEITADA, NÃO EM PÉ. Esta é a diferença entre goblin e GATO.
    //
    // Antes ela subia (`py = o.y - comp * 0.78`), e duas pontas triangulares
    // subindo de um crânio redondo são um gato, não importa o que esteja
    // pintado no meio. A da referência é LONGA e quase horizontal, varrida
    // para trás — ela alarga a cabeça em vez de levantá-la.
    // Entre os dois extremos já testados: em pé virou GATO, horizontal e
    // enorme virou CHAPÉU (mais larga que os ombros). O ponto certo é varrida
    // a uns trinta graus, com comprimento perto do raio do crânio.
    const comp = cranioR * 0.98;
    const px = o.x + s * comp * 0.82;
    const py = o.y - comp * 0.46;
    capsula(buf, PELE, o.x, o.y + 1.5 * u, px, py, cranioR * 0.42, 1.2 * u, { escuro: fora });
    // a concha corre ao longo dela, pela borda de baixo
    capsula(buf, PELE, o.x + s * 2 * u, o.y + 2.5 * u,
      px - s * 3 * u, py + 2.5 * u, cranioR * 0.17, 0.8 * u, { escuro: fora + 2 });
  }

  if (!frente) {
    // De costas: só a nuca, mais escura, e o cabelo por cima.
    bolha(buf, PELE, cx, cy, cranioR * 0.92, cranioR * 0.88, { escuro: 2 });
    return;
  }

  // ---- arcada: a sombra que põe o olho dentro de um buraco ----------------
  // A arcada é uma SALIÊNCIA com sombra EMBAIXO dela, não uma barra escura
  // atravessada na cara. Era a barra que apagava o olhar.
  const arcY = olhD.y - 2.6 * u;
  capsula(buf, PELE, cx - cranioR * 0.8, arcY, cx + cranioR * 0.8, arcY,
    2.4 * u, 2.4 * u);
  capsula(buf, PELE, cx - cranioR * 0.72, arcY + 2.2 * u, cx + cranioR * 0.72, arcY + 2.2 * u,
    1.1 * u, 1.1 * u, { escuro: 2 });

  // ---- olhos: laranja em brasa dentro da sombra ---------------------------
  for (const o of [olhD, olhE]) {
    if (o.p < 118) continue;
    // Olho ESTREITO e com pálpebra pesada em cima. Retângulo largo e
    // simétrico lê como óculos de proteção, que foi como saiu antes.
    const ew = Math.max(3, Math.round(cranioR * 0.34));
    const eh = Math.max(2, Math.round(cranioR * 0.2));
    const dentro = o.x < cx ? 1 : -1;
    const ex0 = Math.round(o.x - ew / 2); const ey0 = Math.round(o.y);
    marca(buf, PELE, ex0 - 1, ey0 - 1, ew + 2, eh + 2, 3);     // a órbita
    marca(buf, [BRASA], ex0, ey0, ew, eh, 0);
    marca(buf, OSSO, ex0 + (dentro > 0 ? ew - 1 : 0), ey0, 1, 1, 0);
    marca(buf, PELE, ex0, ey0 - 1, ew, 1, 2);                   // pálpebra
    marca(buf, PELE, ex0 + (dentro > 0 ? 0 : ew - 1), ey0, 1, eh, 3);
  }

  // ---- nariz adunco e focinho ---------------------------------------------
  // O NARIZ É METADE DO ROSTO, e isso não é exagero: na referência ele é um
  // bico que desce do meio dos olhos até abaixo da boca. O nosso tinha três
  // pixels e por isso a cara ficava chata — e cara chata com orelha pontuda é
  // gato. Ele escala com o crânio, não com a unidade da figura.
  // Nariz começa ENTRE OS OLHOS, não na testa, e engrossa para baixo. Saindo
  // da testa ele vira uma barra diagonal atravessada na cara — foi o que
  // apareceu na tentativa anterior.
  const nr = cranioR * 0.2;
  const raiz = { x: cx + (N.x - cx) * 0.5, y: olhD.y + nr * 0.4 };
  const ponta = { x: N.x + cranioR * 0.16, y: N.y + cranioR * 0.26 };
  capsula(buf, PELE, raiz.x, raiz.y, ponta.x, ponta.y, nr * 0.55, nr * 1.25);
  // o bico: um degrau que desce da ponta, curto
  capsula(buf, PELE, ponta.x, ponta.y, ponta.x - nr * 0.5, ponta.y + nr * 0.7,
    nr * 1.15, nr * 0.75, { escuro: 1 });
  // a sombra embaixo é o que separa o nariz da boca
  capsula(buf, PELE, ponta.x - nr * 1.4, ponta.y + nr * 1.1,
    ponta.x + nr * 0.6, ponta.y + nr * 1.1, nr * 0.4, nr * 0.4, { escuro: 3 });

  // ---- boca: dentuça, com o maxilar adiantado -----------------------------
  const bx = N.x - 4.4 * u; const by = N.y + 8 * u;
  const bw = Math.max(5, Math.round(9.5 * u));
  marca(buf, [CONTORNO], Math.round(bx), Math.round(by), bw, Math.max(1, Math.round(1.6 * u)), 0);
  // dentes de baixo subindo por cima do lábio, de alturas desiguais
  const passo = Math.max(1, Math.round(1.6 * u));
  for (let i = 0, n = Math.floor(bw / passo); i < n; i++) {
    const alto = [2, 1, 2, 1, 1, 2][i % 6] * Math.max(1, Math.round(u));
    marca(buf, OSSO, Math.round(bx + i * passo), Math.round(by - alto + 1),
      Math.max(1, passo - 1), alto, i % 2 ? 1 : 0);
  }
  // presa de canto, maior
  marca(buf, OSSO, Math.round(bx + bw - passo), Math.round(by - 3 * u),
    Math.max(1, Math.round(1.4 * u)), Math.max(2, Math.round(3.4 * u)), 0);

}

/** A juba: topo irregular, com osso e chifre espetados. */
function cabelo(buf, cx, cy, R, u, atras, limiteFrente = null) {
  const topo = cy - R * 0.98;
  for (let i = -Math.round(R); i <= Math.round(R); i++) {
    const t = i / R;
    const borda = Math.sqrt(Math.max(0, 1 - t * t));
    const altura = (R * 0.62 + R * 0.3 * [0.2, 0.9, 0.4, 1, 0.55, 0.85, 0.3][(i + 99) % 7]) * borda;
    const x = cx + i;
    const yTopo = topo + R * (1 - borda) * 0.9 - altura * 0.55;
    // No miolo da testa a juba recua; nas têmporas e atrás ela desce.
    const meio = Math.abs(t) < 0.62;
    let fim = cy + R * (atras ? 0.75 : 0.5);
    if (!atras && meio && limiteFrente != null) fim = Math.min(fim, limiteFrente);
    capsula(buf, CABELO, x, yTopo, x, fim, 1.1 * u, 1.1 * u,
      { escuro: i > R * 0.35 ? 1 : 0 });
  }
  // chifre curvo e um osso atravessado
  const hx = cx + R * 0.52; const hy = topo + R * 0.1;
  capsula(buf, OSSO, hx, hy, hx + 3.4 * u, hy - 7 * u, 2.2 * u, 0.7 * u);
  capsula(buf, OSSO, cx - R * 0.72, topo + R * 0.42, cx - R * 0.18, topo + R * 0.2,
    1.4 * u, 1.4 * u, { escuro: 1 });
}

// ---------------------------------------------------------------------------
/**
 * O EQUIPAMENTO, PENDURADO NAS JUNTAS.
 *
 * É aqui que o esqueleto se paga. O pintor antigo calculava a empunhadura à
 * mão, com um ramo por tipo de apoio — e foi de lá que saíram a espada que era
 * uma régua, o goblin com duas maças e a lojista armada sem saber. Aqui a
 * cimitarra nasce na junta `maoD` e o escudo na `cotoveloE`: nas oito direções
 * e nos treze quadros, sem nenhum caso especial.
 */
function equipamento(buf, J, u, perto) {
  const mD = J('maoD'); const cD = J('cotoveloD');
  const mE = J('maoE'); const cE = J('cotoveloE');
  const qD = J('quadrilD'); const qE = J('quadrilE');

  // ---- saiote de escamas, pendurado no quadril ----------------------------
  const qx = (qD.x + qE.x) / 2; const qy = (qD.y + qE.y) / 2;
  const sw = Math.max(Math.abs(qE.x - qD.x) + 7 * u, 11 * u);
  capsula(buf, COURO, qx - sw / 2, qy - 1.5 * u, qx + sw / 2, qy - 1.5 * u, 2.6 * u, 2.6 * u);
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    const x = qx - sw / 2 + sw * t;
    const alt = (9 + [0, 2, 1, 3, 1, 2][i]) * u;
    capsula(buf, METAL, x, qy + 1 * u, x, qy + alt, 1.9 * u, 1.5 * u,
      { escuro: i % 2 ? 2 : 1 });
  }

  // ---- perneiras de pelo --------------------------------------------------
  for (const [j, k] of [['joelhoD', 'peD'], ['joelhoE', 'peE']]) {
    const A = J(j); const B = J(k);
    const t = 0.52;
    const mx = A.x + (B.x - A.x) * t; const my = A.y + (B.y - A.y) * t;
    capsula(buf, COURO, mx, my - 3 * u, mx, my + 3 * u, 6 * u, 5.4 * u, { escuro: 1 });
    for (let i = -2; i <= 2; i++) {
      capsula(buf, COURO, mx + i * 2.2 * u, my + 2.6 * u, mx + i * 2.6 * u, my + 6 * u,
        1.2 * u, 0.5 * u, { escuro: 2 });
    }
  }

  // ---- ombreira cravada, só de um lado ------------------------------------
  const oD = J('ombroD');
  bolha(buf, METAL, oD.x - 1.5 * u, oD.y - 1 * u, 7 * u, 5.6 * u);
  for (let i = 0; i < 3; i++) {
    const a = -2.5 + i * 1.1;
    capsula(buf, METAL, oD.x - 1.5 * u + Math.cos(a) * 5 * u, oD.y - 1 * u + Math.sin(a) * 4 * u,
      oD.x - 1.5 * u + Math.cos(a) * 9.5 * u, oD.y - 1 * u + Math.sin(a) * 8 * u,
      1.6 * u, 0.5 * u);
  }

  // ---- escudo redondo no antebraço esquerdo -------------------------------
  const ex = mE.x + (cE.x - mE.x) * 0.32;
  const ey = mE.y + (cE.y - mE.y) * 0.32;
  const er = 13 * u;
  bolha(buf, METAL, ex, ey, er, er, { achata: 0.55 });
  bolha(buf, MADEIRA, ex, ey, er - 1.8 * u, er - 1.8 * u, { achata: 0.4 });
  for (let i = -2; i <= 2; i++) {
    capsula(buf, MADEIRA, ex + i * 4 * u, ey - er * 0.82, ex + i * 4 * u, ey + er * 0.82,
      0.5 * u, 0.5 * u, { escuro: 2 });
  }
  bolha(buf, METAL, ex, ey, 4 * u, 4 * u);

  // ---- cimitarra na mão direita -------------------------------------------
  // A direção do antebraço define para onde a lâmina aponta: é o que faz a
  // arma acompanhar a pose sem nenhuma tabela.
  const dx = mD.x - cD.x; const dy = mD.y - cD.y;
  const n = Math.hypot(dx, dy) || 1;
  const ux = dx / n; const uy = dy / n;
  const px = -uy; const py = ux;                  // perpendicular, para a curva
  const punho = { x: mD.x + ux * 1.5 * u, y: mD.y + uy * 1.5 * u };
  // cabo e guarda
  capsula(buf, COURO, mD.x - ux * 4 * u, mD.y - uy * 4 * u, punho.x, punho.y, 1.8 * u, 1.8 * u);
  capsula(buf, METAL, mD.x + px * 3.4 * u, mD.y + py * 3.4 * u,
    mD.x - px * 3.4 * u, mD.y - py * 3.4 * u, 1.3 * u, 1.3 * u);
  // a folha, curvando: cada passo se afasta um pouco mais da reta
  let ax = punho.x; let ay = punho.y;
  const passos = 9;
  for (let i = 1; i <= passos; i++) {
    const t = i / passos;
    const comp = 30 * u * t;
    const curva = 11 * u * t * t;
    const bx2 = punho.x + ux * comp + px * curva;
    const by2 = punho.y + uy * comp + py * curva;
    const esp = (t < 0.72 ? 2.6 : 2.6 * (1 - (t - 0.72) * 3.2)) * u;
    capsula(buf, METAL, ax, ay, bx2, by2, Math.max(0.5, esp), Math.max(0.4, esp * 0.92));
    ax = bx2; ay = by2;
  }
}
