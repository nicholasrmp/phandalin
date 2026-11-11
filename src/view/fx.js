// Camada de animação do combate.
//
// O motor de regras resolve tudo de uma vez: quando um ataque acontece, o dano
// já foi aplicado. Esta camada existe para CONTAR esse resultado ao longo de
// alguns décimos de segundo — investida, projétil, impacto — e para atrasar o
// número de dano até o momento em que ele faz sentido visualmente.
//
// Nada aqui altera estado de jogo. Se um efeito for descartado, a partida
// continua idêntica.
//
// Cada primitiva é uma peça de vocabulário. As "frases" — o que cada arma e
// cada magia mostram — ficam em `visuals.js`.

import { ANIMADAS } from '../art/efeitos-animados.js';
import { EFEITOS } from '../art/efeitos.js';
import '../art/efeitos-variantes.js';
import { PALETA } from '../art/icons.js';

const EASE_OUT = (k) => 1 - (1 - k) * (1 - k);

// Quadros de efeito (folhas do OpenArt convertidas em grade): um canvas por
// quadro, feito uma vez. O desenho é 1:1, como as figuras do tabuleiro.
const quadrosCache = new Map();
export function quadro(nome, i) {
  const ef = EFEITOS[nome];
  if (!ef) return null;
  const k = `${nome}|${i}`;
  let cv = quadrosCache.get(k);
  if (!cv) {
    const grade = ef.quadros[i];
    cv = document.createElement('canvas');
    // Quadro pode ser mais largo que alto (a onda de choque, a névoa).
    cv.width = grade[0].length;
    cv.height = grade.length;
    const c = cv.getContext('2d');
    for (let y = 0; y < grade.length; y++) {
      for (let x = 0; x < grade[y].length; x++) {
        const cor = PALETA[grade[y][x]];
        if (!cor) continue;
        c.fillStyle = cor;
        c.fillRect(x, y, 1, 1);
      }
    }
    quadrosCache.set(k, cv);
  }
  return cv;
}

/**
 * Domo de proteção em 2.5D, desenhado ponto a ponto em pixel art: uma BOLHA
 * de luz, não uma gaiola nem uma redoma. Nada de barras cruzando a figura — o
 * volume vem do véu translúcido em cascas (mais denso na borda, como vidro
 * visto de lado), da elipse no chão, da luz na beira esquerda e de um reflexo.
 * Sai em camadas que o tabuleiro intercala na ordem de profundidade:
 *   tras   — a borda densa de cima, o contorno e a metade de trás do chão;
 *   frente — o miolo do véu, tudo abaixo do centro, o arco da frente do chão
 *            e o reflexo;
 *   brilho — o contorno em branco, para o lampejo quando a bolha fecha.
 *   raio: meia largura no chão (a casa tem 32); altura: até o topo, em px.
 */
// `rgb`: o véu; `borda`: o contorno claro (sem ela, é o véu clareado 45%). As
// esferas `escuro` das zonas que escondem usam véu de miolo fraco (nunca opaco)
// e a borda forte: o que importa é a silhueta.
const DOMO_CORES = {
  ouro: { rgb: [232, 195, 90] },
  violeta: { rgb: [165, 121, 216] },
  gelo: { rgb: [155, 183, 216], borda: [205, 225, 245] }, // Silêncio
  vento: { rgb: [223, 243, 255], borda: [255, 255, 255] },
  agua: { rgb: [120, 196, 232] }, // Acalmar Emoções
  breu: { rgb: [20, 12, 32], borda: [138, 100, 196], escuro: true }, // Escuridão
  vazio: { rgb: [10, 8, 26], borda: [130, 200, 240], escuro: true }, // Fome de Hadar
  sol: { rgb: [255, 236, 160], borda: [255, 250, 214] }, // Luz do Dia
  // Círculo Mágico: uma cor por tipo de criatura que ele barra.
  'circ-celestial': { rgb: [255, 226, 130], borda: [255, 246, 200] },
  'circ-elemental': { rgb: [242, 142, 72], borda: [255, 214, 170] },
  'circ-feérico': { rgb: [140, 230, 150], borda: [210, 250, 214] },
  'circ-corruptor': { rgb: [232, 72, 72], borda: [255, 186, 170] },
  'circ-morto-vivo': { rgb: [176, 134, 232], borda: [226, 208, 250] },
  // Marcas das magias de utilidade (colunas de luz sobre quem a magia revela): o bem é azul-claro, o mal
  // vermelho, o que não é nem um nem outro verde; armadilha laranja; o objeto de Localizar ciano; o que o bicho viu verde-água.
  'marca-bem': { rgb: [120, 190, 255], borda: [210, 236, 255] },
  'marca-mal': { rgb: [240, 60, 70], borda: [255, 170, 170] },
  'marca-neutro': { rgb: [214, 220, 232], borda: [250, 252, 255] }, // prata: nem bem nem mal
  'marca-armadilha': { rgb: [255, 150, 40], borda: [255, 220, 150] },
  'marca-alvo': { rgb: [40, 230, 200], borda: [190, 255, 244] }, // Localizar Objeto: verde-turquesa
  'marca-espia': { rgb: [205, 235, 70], borda: [240, 255, 160] }, // o que o bicho viu: verde-lima
  'marca-verdade': { rgb: [255, 206, 70], borda: [255, 236, 150] }, // Zona da Verdade: o cilindro dourado em volta de quem não mente
  'marca-alarme': { rgb: [255, 200, 90], borda: [255, 240, 190] }, // Alarme: o anel baixo no chão
  'marca-aparencia': { rgb: [190, 150, 255], borda: [226, 208, 255] }, // Alterar Aparência: o halo lilás de quem está transformado
  'marca-fingido': { rgb: [170, 172, 184], borda: [214, 216, 226] }, // Fingir de Morto: a figura apagada, cinza
  // Clarividência: azul-gelo. Não pode parecer o turquesa do Localizar
  // Objeto (a mesma cor, o mesmo glifo e a mesma dica confundiam as duas).
  'marca-olho': { rgb: [140, 170, 255], borda: [212, 226, 255] },
};
// Cada marca tem forma própria (raio, altura) e um glifo no topo: a cor sozinha não distinguia as colunas.
const MARCA_FORMA = {
  'marca-bem': { raio: 16, altura: 76, glifo: 'mais' },
  'marca-mal': { raio: 16, altura: 76, glifo: 'xis' },
  'marca-neutro': { raio: 14, altura: 60, glifo: 'ponto' },
  'marca-armadilha': { raio: 24, altura: 26, glifo: 'aviso', pisca: true },
  'marca-alvo': { raio: 10, altura: 84, glifo: 'alvo' },
  'marca-espia': { raio: 14, altura: 46, glifo: 'olho' },
  'marca-verdade': { raio: 18, altura: 58, glifo: 'balanca' },
  'marca-alarme': { raio: 40, altura: 14, glifo: 'aviso' },
  // Aparência e Fingir de Morto moram os dois sob um herói: as duas formas têm de ser
  // opostas (halo alto com máscara × poça rasa e larga), ou uma vira a outra na tela.
  'marca-aparencia': { raio: 22, altura: 40, glifo: 'mascara' },
  'marca-fingido': { raio: 26, altura: 8, glifo: null },
  // Coluna alta e fina com o olho no topo: o glifo é o mesmo do Sentidos da
  // Fera, e o que separa as duas é a altura (46 contra 70) e a cor.
  'marca-olho': { raio: 12, altura: 70, glifo: 'olho' },
};
const GLIFOS = {
  mais: ['...#...', '...#...', '...#...', '#######', '...#...', '...#...', '...#...'],
  xis: ['#.....#', '.#...#.', '..#.#..', '...#...', '..#.#..', '.#...#.', '#.....#'],
  ponto: ['.......', '..###..', '.#####.', '.#####.', '.#####.', '..###..', '.......'],
  aviso: ['...#...', '..#.#..', '..#.#..', '.#.#.#.', '.#.#.#.', '#.....#', '#######'],
  alvo: ['..###..', '.#...#.', '#..#..#', '#.###.#', '#..#..#', '.#...#.', '..###..'],
  olho: ['.......', '..###..', '.#...#.', '#..#..#', '.#...#.', '..###..', '.......'],
  balanca: ['...#...', '#######', '#..#..#', '#..#..#', '...#...', '...#...', '.#####.'],
  // Máscara de rosto: a face cheia com dois buracos de olho.
  mascara: ['.#####.', '#######', '##.#.##', '#######', '#.###.#', '.#...#.', '..###..'],
};
/** Desenha um glifo de 7x7 em pixels grandes, com contorno escuro, centrado em (cx, cy). */
function desenharGlifo(ctx, nome, cx, cy, cor, escala = 2) {
  const g = GLIFOS[nome];
  if (!g) return;
  const x0 = Math.round(cx - (3.5 * escala));
  const y0 = Math.round(cy - (3.5 * escala));
  const [r, gg, b] = cor;
  for (const [dx, dy, fill] of [[-1, 0, '#1a1426'], [1, 0, '#1a1426'], [0, -1, '#1a1426'], [0, 1, '#1a1426'], [0, 0, `rgb(${r},${gg},${b})`]]) {
    ctx.fillStyle = fill;
    for (let j = 0; j < 7; j++) for (let i = 0; i < 7; i++) if (g[j][i] === '#') ctx.fillRect(x0 + i * escala + dx, y0 + j * escala + dy, escala, escala);
  }
}
const DOMO_BRANCO = [244, 240, 228];
// Meio elipsoide: topo redondo de cúpula, e o `m` do véu fica exato na silhueta.
const PERFIL = (s) => Math.sqrt(Math.max(0, 1 - s ** 2));
// O véu em degraus (pixel art: nada de degradê contínuo). `m` é quão perto da
// borda o pixel está, de 0 (meio) a 1 (borda).
const VEU = (m) => (m > 0.95 ? 0.36 : m > 0.86 ? 0.2 : m > 0.7 ? 0.09 : 0.03);
// Esfera escura: a casca forte, o miolo nunca passa de .35.
const VEU_ESCURO = (m) => (m > 0.95 ? 0.5 : m > 0.86 ? 0.35 : m > 0.7 ? 0.26 : 0.18);
const domosCache = new Map();
/**
 * `op` (0,35 a 1) escala o véu: uma esfera de zona cobre muitas casas e não
 * pode esconder as figuras dentro; a borda clara perde força acima de 48 px de raio.
 */
export function domoCamadas(cor, raio, altura, op = 1) {
  op = Math.round(op * 20) / 20;
  const chave = `${cor}|${raio}|${altura}|${op}`;
  if (domosCache.has(chave)) return domosCache.get(chave);
  const def = DOMO_CORES[cor] ?? DOMO_CORES.ouro;
  const [r, g, b] = def.rgb;
  const veu = def.escuro ? VEU_ESCURO : (m) => VEU(m) * op;
  // (Só as esferas de zona, com `op` < 1, têm a borda mais fraca; o domo de proteção segue igual.)
  const aBorda = raio <= 48 || op >= 1 || cor === 'gelo' || cor === 'vazio' ? 0.9 : 0.6;
  const claro = def.borda ?? [r, g, b].map((v) => Math.round(v + (255 - v) * 0.45));
  const larg = raio * 2 + 5;
  const alt = altura + Math.ceil(raio / 2) + 5;
  const ox = raio + 2; // o centro do chão dentro do quadro
  const oy = altura + 2;
  const novo = () => new Uint8ClampedArray(larg * alt * 4);
  const tras = novo();
  const frente = novo();
  const brilho = novo();
  const px = (buf, x, y, [cr, cg, cb], a) => {
    if (x < 0 || y < 0 || x >= larg || y >= alt) return;
    const i = (y * larg + x) * 4;
    buf[i] = cr; buf[i + 1] = cg; buf[i + 2] = cb; buf[i + 3] = Math.round(a * 255);
  };
  // O véu, em cascas. A borda densa de cima vai atrás da figura; tudo abaixo
  // do centro fica na frente (senão o chão da casa da frente o apagaria).
  for (let y = 0; y < alt; y++) {
    for (let x = 0; x < larg; x++) {
      const dx = x - ox;
      const dy = y - oy; // < 0 acima do chão
      let m = -1;
      if (dy <= 0) {
        const sv = -dy / altura;
        if (sv <= 1 && Math.abs(dx) <= raio * PERFIL(sv)) m = Math.sqrt((dx / raio) ** 2 + sv ** 2);
      } else {
        const e = (dx / raio) ** 2 + (dy / (raio / 2)) ** 2;
        if (e <= 1) m = Math.sqrt(e);
      }
      if (m >= 0) px(dy > 0 || m <= 0.86 ? frente : tras, x, y, [r, g, b], veu(m));
    }
  }
  // O contorno, traçado linha a linha (sem buracos no topo) e limpo dos
  // degraus em L (comparando com o último ponto MANTIDO).
  const lado = [];
  let xa = Math.round(raio);
  for (let k = 0; k <= altura; k++) {
    const xb = Math.round(raio * PERFIL(k / altura));
    for (let x = xa; x >= xb; x--) lado.push([x, -k]);
    xa = xb;
  }
  const unicos = lado.filter((p, i) => i === 0 || p[0] !== lado[i - 1][0] || p[1] !== lado[i - 1][1]);
  const caminho = [];
  for (let i = 0; i < unicos.length; i++) {
    const p = unicos[i];
    const c = unicos[i + 1];
    const a = caminho[caminho.length - 1];
    if (a && c && a[0] !== c[0] && a[1] !== c[1] && (a[0] === p[0] || a[1] === p[1]) && (c[0] === p[0] || c[1] === p[1])) continue;
    caminho.push(p);
  }
  // Luz na beira esquerda e no topo; o lado direito, na sombra, mais fraco.
  for (const [x, y] of caminho) {
    for (const s of [-1, 1]) {
      if (s === -1 && x === 0) continue;
      const sv = -y / altura;
      const [c, a] = s < 0 || sv > 0.8 ? [claro, sv > 0.12 ? aBorda : 0.6] : [def.borda ? claro : [r, g, b], def.borda ? aBorda * (op < 1 ? 0.95 : 0.55) : 0.45];
      px(tras, ox + s * x, oy + y, c, a);
      px(brilho, ox + s * x, oy + y, DOMO_BRANCO, 0.9);
      // Esfera de zona (grande): o contorno em 2 px, senão some na escala do mapa.
      if (op < 1) {
        px(tras, ox + s * (x - 1), oy + y + 1, c, a * 0.85);
        px(tras, ox + s * x, oy + y + 1, c, a * 0.85);
        px(tras, ox + s * (x - 1), oy + y, c, a * 0.85);
      }
    }
  }
  // A elipse do chão: a metade de trás fraca, a da frente mais forte.
  const vistos = new Set();
  for (let i = 0; i < 720; i++) {
    const t = (i / 720) * Math.PI * 2;
    const qx = Math.round(ox + raio * Math.cos(t));
    const qy = Math.round(oy + (raio / 2) * Math.sin(t));
    const k = `${qx},${qy}`;
    if (vistos.has(k)) continue;
    vistos.add(k);
    if (qy > oy) px(frente, qx, qy, [r, g, b], 0.55);
    else px(tras, qx, qy, [r, g, b], 0.25);
  }
  // O reflexo: um risco curvo, branco, no alto à esquerda — é ele que diz "bolha".
  for (let i = 0; i <= 60; i++) {
    const sv = 0.55 + (i / 60) * 0.3;
    px(frente, Math.round(ox - raio * PERFIL(sv) + 4), Math.round(oy - altura * sv), DOMO_BRANCO, 0.85);
  }
  const tela = (buf) => {
    const cv = document.createElement('canvas');
    cv.width = larg;
    cv.height = alt;
    cv.getContext('2d').putImageData(new ImageData(buf, larg, alt), 0, 0);
    return cv;
  };
  const camadas = { tras: tela(tras), frente: tela(frente), brilho: tela(brilho), ox, oy };
  domosCache.set(chave, camadas);
  return camadas;
}

/**
 * O CILINDRO do Círculo Mágico, em pixel art: a mesma ideia do domo (véu em
 * degraus, nada de gaiola), mas com paredes retas e tampa plana.
 *   - o véu das paredes é quase nulo no miolo e forte só nas bordas laterais e
 *     no alto, como vidro visto de lado: nenhuma figura dentro fica escondida;
 *   - a elipse do chão leva um anel de runas (traços radiais), que é o que diz
 *     "círculo" e não "tubo";
 *   - sai em duas camadas como o domo: `tras` (paredes de trás, tampa de trás,
 *     chão de trás) e `frente` (paredes da frente, chão da frente, tampa da frente).
 *   raio: meia largura no chão; altura: da base à tampa, em px.
 */
export function cilindroCamadas(cor, raio, altura) {
  const chave = `cil|${cor}|${raio}|${altura}`;
  if (domosCache.has(chave)) return domosCache.get(chave);
  const def = DOMO_CORES[cor] ?? DOMO_CORES['circ-morto-vivo'];
  const rgb = def.rgb;
  const claro = def.borda ?? rgb;
  const meio = Math.round(raio / 2);
  const larg = raio * 2 + 5;
  const alt = altura + raio + 6;
  const ox = raio + 2;
  const oy = altura + meio + 3;
  const novo = () => new Uint8ClampedArray(larg * alt * 4);
  const tras = novo();
  const frente = novo();
  const px = (buf, x, y, [cr, cg, cb], a) => {
    if (x < 0 || y < 0 || x >= larg || y >= alt) return;
    const i = (y * larg + x) * 4;
    // Não apaga um pixel mais forte já pintado.
    if (buf[i + 3] >= Math.round(a * 255)) return;
    buf[i] = cr; buf[i + 1] = cg; buf[i + 2] = cb; buf[i + 3] = Math.round(a * 255);
  };
  // As paredes: para cada coluna, o trecho de trás e o da frente.
  for (let dx = -raio; dx <= raio; dx++) {
    const e = Math.round(meio * Math.sqrt(Math.max(0, 1 - (dx / raio) ** 2)));
    const lado = Math.abs(dx) / raio;
    for (const [buf, base] of [[tras, oy - e], [frente, oy + e]]) {
      for (let v = 0; v <= altura; v++) {
        const t = v / altura;
        let a = 0.045;
        if (lado > 0.93) a += 0.15;
        if (t > 0.92) a += 0.1;
        // Em degraus: a faixa de baixo é a mais fraca (o pé da parede).
        if (t < 0.12) a *= 0.6;
        px(buf, ox + dx, base - v, rgb, a);
      }
    }
  }
  // As arestas verticais, na silhueta (a esquerda recebe a luz).
  for (let v = 0; v <= altura; v++) {
    px(tras, ox - raio, oy - v, claro, 0.7);
    px(tras, ox + raio, oy - v, rgb, 0.5);
  }
  // As elipses: a do chão (e o anel de runas dentro dela) e a da tampa.
  const vistos = new Set();
  const elipse = (cy, rx, ry, aTras, aFrente, cc) => {
    for (let i = 0; i < 900; i++) {
      const t = (i / 900) * Math.PI * 2;
      const qx = Math.round(ox + rx * Math.cos(t));
      const qy = Math.round(cy + ry * Math.sin(t));
      const k = `${qx},${qy},${cy},${rx}`;
      if (vistos.has(k)) continue;
      vistos.add(k);
      if (Math.sin(t) > 0) px(frente, qx, qy, cc, aFrente); else px(tras, qx, qy, cc, aTras);
    }
  };
  elipse(oy, raio, meio, 0.4, 0.75, claro);
  elipse(oy - altura, raio, meio, 0.65, 0.4, claro);
  elipse(oy, raio * 0.86, meio * 0.86, 0.3, 0.55, rgb);
  // As runas: um traço radial a cada 22,5 graus, entre o anel de dentro e a borda.
  for (let k = 0; k < 16; k++) {
    const t = (k / 16) * Math.PI * 2 + 0.1;
    for (let s = 0.86; s <= 0.98; s += 0.02) {
      const qx = Math.round(ox + raio * s * Math.cos(t));
      const qy = Math.round(oy + meio * s * Math.sin(t));
      if (Math.sin(t) > 0) px(frente, qx, qy, claro, 0.7); else px(tras, qx, qy, claro, 0.4);
    }
  }
  // Um brilho no alto à esquerda, o que diz "vidro".
  for (let v = Math.round(altura * 0.55); v < Math.round(altura * 0.9); v++) px(frente, ox - raio + 5, oy - v + meio, [255, 255, 255], 0.5);
  const tela = (buf) => {
    const cv = document.createElement('canvas');
    cv.width = larg;
    cv.height = alt;
    cv.getContext('2d').putImageData(new ImageData(buf, larg, alt), 0, 0);
    return cv;
  };
  const camadas = { tras: tela(tras), frente: tela(frente), brilho: tela(novo()), ox, oy };
  domosCache.set(chave, camadas);
  return camadas;
}

/** Quantos quadros tem um efeito (0 se ele não existe). */
/**
 * A bolha de proteção, a esfera de zona e o círculo mágico, vistos de cima: um disco com borda. As camadas de `domoCamadas` eram o hemisfério
 * de perfil do isométrico. O anel tracejado é o do cilindro de runas, o que diz "círculo" e não "esfera".
 */
function discoDeCima(ctx, sx, sy, raio, cor, alfa, op, tracejado) {
  const arte = imagemDeArte(tracejado ? 'circulo' : BOLHAS[cor]);
  if (arte) {
    const lado = (raio * 2) / FOLGA_DA_ARTE;
    ctx.save();
    ctx.globalAlpha = alfa;
    ctx.translate(sx, sy);
    // O círculo de runas roda devagar: é o que diz que ele está ativo.
    if (tracejado) ctx.rotate(performance.now() / 9000);
    ctx.drawImage(arte, -lado / 2, -lado / 2, lado, lado);
    ctx.restore();
    return;
  }
  const def = DOMO_CORES[cor] ?? (cor === 'brilho' ? { rgb: [255, 255, 255] } : DOMO_CORES.ouro);
  const [r, g, b] = def.rgb;
  const borda = def.borda ?? [r, g, b].map((v) => Math.round(v + (255 - v) * 0.45));
  ctx.save();
  ctx.globalAlpha = alfa;
  ctx.fillStyle = `rgba(${r},${g},${b},${(def.escuro ? 0.55 : 0.2) * op})`;
  ctx.beginPath();
  ctx.arc(sx, sy, raio, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = `rgb(${borda[0]},${borda[1]},${borda[2]})`;
  ctx.lineWidth = 2;
  if (tracejado) ctx.setLineDash([8, 5]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = alfa * 0.45;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(sx, sy, Math.max(1, raio - 5), 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export const temEfeito = (nome) => EFEITOS[nome]?.quadros.length ?? 0;

// AS ARTES VISTAS DE CIMA (`public/efeitos/`, geradas no OpenArt, `dev/importar-arte-efeito.py`): uma imagem só, com transparência, que o
// código faz nascer, girar e sumir (`Fx.arte`). Têm o tamanho real da magia, em casas, o que a folha de pixels de 84 px não conseguia.
const ARTES = ['bola-de-fogo', 'bolha-ouro', 'bolha-violeta', 'chamas', 'choque', 'circulo', 'escuridao', 'graxa', 'luz', 'nevoa', 'nuvem-mortal',
  'silencio', 'sono', 'teia', 'tempestade', 'tentaculos', 'vento', 'vinhas', 'cometa-fogo', 'raio-fogo', 'raio-gelo', 'conjuracao', 'estouro-gelo',
  'dardo-arcano', 'lanca-luz', 'bolota-veneno', 'flecha-acido', 'relampago', 'estouro-arcano', 'estouro-veneno', 'estouro-acido', 'cone-gelo', 'cone-fogo', 'cone-veneno', 'cone-sombra', 'cone-flechas', 'cone-cores',
  'faixa-fogo', 'faixa-acido', 'faixa-eletrico', 'faixa-vento', 'pedra',
  'cura', 'bencao', 'maldicao', 'protecao', 'psiquico', 'necrotico', 'eletrico', 'portal', 'nevoa-prata', 'correntes', 'terror', 'hipnose', 'espinhos',
  'meteoro', 'poder', 'ar', 'morte', 'gelo-aura', 'adagas', 'luar', 'sigilo'];
const imagensDeArte = new Map();
function imagemDeArte(nome) {
  let im = imagensDeArte.get(nome);
  if (!im && typeof Image !== 'undefined') {
    im = new Image();
    im.src = `/efeitos/${nome}.webp`;
    imagensDeArte.set(nome, im);
  }
  return im?.complete && im.naturalWidth ? im : null;
}
/** A cor do domo que tem arte. As imagens enchem 90% do quadrado, daí o raio dividido. */
const BOLHAS = { ouro: 'bolha-ouro', violeta: 'bolha-violeta' };
const FOLGA_DA_ARTE = 0.9;

// AS ARTES QUE MEXEM (`public/efeitos/anim/`, `dev/importar-video-efeito.py`): vídeo do OpenArt virado em folha de quadros com transparência. A tabela
// mora em `art/efeitos-animados.js`, que o importador ajuda a preencher. Quem não está nela, ou cuja folha não chegou, usa a imagem parada.
const folhasAnimadas = new Map();
function folhaAnimada(nome) {
  if (!ANIMADAS[nome]) return null;
  let im = folhasAnimadas.get(nome);
  if (!im && typeof Image !== 'undefined') {
    im = new Image();
    im.src = `/efeitos/anim/${nome}.webp`;
    folhasAnimadas.set(nome, im);
  }
  return im?.complete && im.naturalWidth ? im : null;
}

// Tudo junto são 16 MB: uma por vez, depois da abertura, para o jogo não esperar por magia que talvez nem saia. A imagem parada vem antes da folha, e
// é ela que aparece se a magia sair antes de a folha chegar.
if (typeof Image !== 'undefined' && typeof setTimeout !== 'undefined') {
  const fila = [...ARTES.map((n) => () => { imagemDeArte(n); return imagensDeArte.get(n); }), ...Object.keys(ANIMADAS).map((n) => () => { folhaAnimada(n); return folhasAnimadas.get(n); })];
  const proxima = () => {
    const carregar = fila.shift();
    if (!carregar) return;
    const im = carregar();
    if (!im || im.complete) { setTimeout(proxima, 0); return; }
    im.addEventListener('load', proxima, { once: true });
    im.addEventListener('error', proxima, { once: true });
  };
  setTimeout(proxima, 1500);
}

/** Uma folha tingida, uma vez por cor: a mesma conta de `arteTingida`. */
const folhasTingidas = new Map();
function folhaTingida(nome, cor) {
  const im = folhaAnimada(nome);
  if (!im) return null;
  const chave = `${nome}|${cor}`;
  let cv = folhasTingidas.get(chave);
  if (!cv) {
    cv = document.createElement('canvas');
    cv.width = im.naturalWidth;
    cv.height = im.naturalHeight;
    const c = cv.getContext('2d');
    c.drawImage(im, 0, 0);
    c.globalCompositeOperation = 'source-atop';
    c.globalAlpha = 0.7;
    c.fillStyle = cor;
    c.fillRect(0, 0, cv.width, cv.height);
    folhasTingidas.set(chave, cv);
  }
  return cv;
}

/**
 * Desenha uma arte centrada na origem do contexto. `k` (0 a 1) leva a folha do começo ao fim, para o que acontece uma vez; `t`, em segundos, faz ela
 * girar em laço, para o que dura. Sem folha, vale a imagem parada, e aí devolve `false` para quem quiser mexer nela de outro jeito.
 */
function desenharArteEm(ctx, nome, x, y, w, h, { k = null, t = 0, tinta = null } = {}) {
  const anim = ANIMADAS[nome];
  const folha = anim && (tinta ? folhaTingida(nome, tinta) : folhaAnimada(nome));
  if (folha) {
    const { n, colunas, fps = 8 } = anim;
    // No laço, vai e volta: o último quadro não salta de volta para o primeiro.
    const passo = Math.floor(t * fps) % Math.max(1, 2 * n - 2);
    const i = k != null ? Math.min(n - 1, Math.floor(k * n)) : (passo < n ? passo : 2 * n - 2 - passo);
    const q = folha.width / colunas;
    ctx.drawImage(folha, (i % colunas) * q, Math.floor(i / colunas) * q, q, q, x, y, w, h);
    return true;
  }
  const im = tinta ? arteTingida(nome, tinta) : imagemDeArte(nome);
  if (im) ctx.drawImage(im, x, y, w, h);
  return false;
}

function desenharArteCentrada(ctx, nome, lado, opcoes = {}) {
  return desenharArteEm(ctx, nome, -lado / 2, -lado / 2, lado, lado, opcoes);
}
const temArte = (nome) => Boolean(folhaAnimada(nome) || imagemDeArte(nome));

/** O impacto em pixels de cada natureza e a arte vista de cima que o substitui, em toda receita que o pede. Sem a imagem, valem os quadros. */
const ARTE_DO_IMPACTO = {
  'fogo-impacto': { nome: 'chamas', raio: 0.75, gira: 0.3 },
  'gelo-impacto': { nome: 'estouro-gelo', raio: 0.8 },
  'veneno-impacto': { nome: 'estouro-veneno', raio: 0.8 },
  'acido-impacto': { nome: 'estouro-acido', raio: 0.8 },
  'arcano-impacto': { nome: 'estouro-arcano', raio: 0.7 },
  'luz-impacto': { nome: 'luz', raio: 0.85 },
  // Tudo o que aparece sobre uma figura, por família. `dur` mais longo: é um efeito que se lê, não um estouro.
  cura: { nome: 'cura', raio: 0.9, dur: 1 },
  estabilizar: { nome: 'cura', raio: 0.7, dur: 0.9 },
  'bom-fruto': { nome: 'cura', raio: 0.6, dur: 0.9 },
  'necrotico-mao': { nome: 'necrotico', raio: 0.85, dur: 0.7 },
  'vida-falsa': { nome: 'necrotico', raio: 0.8, dur: 0.9 },
  'eletrico-faisca': { nome: 'eletrico', raio: 0.7, dur: 0.45 },
  'corrente-de-relampagos': { nome: 'eletrico', raio: 0.9, dur: 0.5 },
  'raio-queda': { nome: 'eletrico', raio: 1, dur: 0.55 },
  bencao: { nome: 'bencao', raio: 0.85, dur: 1 },
  maldicao: { nome: 'maldicao', raio: 0.85, dur: 1 },
  'armadura-arcana': { nome: 'protecao', raio: 0.85, dur: 0.9, tinta: '#a579d8' },
  resistencia: { nome: 'protecao', raio: 0.85, dur: 0.9 },
  'resistencia-verde': { nome: 'protecao', raio: 0.85, dur: 0.9, tinta: '#6ee89a' },
  'resistencia-fogo': { nome: 'protecao', raio: 0.85, dur: 0.9, tinta: '#ff9a4a' },
  'resistencia-acido': { nome: 'protecao', raio: 0.85, dur: 0.9, tinta: '#d4e04a' },
  'resistencia-trovao': { nome: 'protecao', raio: 0.85, dur: 0.9, tinta: '#c9d4ff' },
  'pele-de-pedra': { nome: 'protecao', raio: 0.85, dur: 0.9, tinta: '#8f8678' },
  psiquico: { nome: 'psiquico', raio: 0.85, dur: 0.8 },
  'coroa-loucura': { nome: 'psiquico', raio: 0.85, dur: 1 },
  'sugestao-espiral': { nome: 'psiquico', raio: 0.85, dur: 1 },
  acalmar: { nome: 'psiquico', raio: 1.2, dur: 1.1, tinta: '#8fb8e8' },
  'nevoa-prateada': { nome: 'nevoa-prata', raio: 0.9, dur: 0.9 },
  fantasma: { nome: 'nevoa-prata', raio: 0.9, dur: 1 },
  'porta-dimensional': { nome: 'portal', raio: 0.8, dur: 0.7 },
  'banimento-vortice': { nome: 'portal', raio: 0.95, dur: 1.1, tinta: '#8f6ad0' },
  meteoros: { nome: 'meteoro', raio: 1.6, dur: 0.9 },
  'luz-orbe': { nome: 'luar', raio: 0.7, dur: 0.9 },
  'plantas-brotar': { nome: 'vinhas', raio: 1, dur: 1 },
  'chicote-espinhos': { nome: 'vinhas', raio: 0.7, dur: 0.5 },
  'asas-voo': { nome: 'ar', raio: 0.85, dur: 1 },
  'penas-queda': { nome: 'ar', raio: 0.85, dur: 1 },
  'egide-escudo': { nome: 'bolha-ouro', raio: 0.9, dur: 0.8 },
  'golpe-divino': { nome: 'luz', raio: 0.9, dur: 0.8 },
  'sol-clarao': { nome: 'luz', raio: 1.3, dur: 1 },
  'espinhos-chao': { nome: 'espinhos', raio: 0.8, dur: 0.9 },
  'corrente-aco': { nome: 'correntes', raio: 0.8, dur: 1 },
  'correntes-prender': { nome: 'correntes', raio: 0.9, dur: 1 },
  'elo-aneis': { nome: 'correntes', raio: 0.8, dur: 1, tinta: '#ffe9a8' },
  'nevoa-escura': { nome: 'escuridao', raio: 0.85, dur: 1 },
  'nevoa-cinza': { nome: 'nevoa', raio: 1, dur: 1 },
  'rastro-nevoa': { nome: 'nevoa', raio: 0.7, dur: 0.8 },
  'sono-nevoa': { nome: 'sono', raio: 0.9, dur: 1 },
  'medo-espectro': { nome: 'terror', raio: 0.9, dur: 0.9 },
  hipnose: { nome: 'hipnose', raio: 1.5, dur: 1.2 },
  lufada: { nome: 'vento', raio: 1, dur: 0.8 },
  'duelo-sigilo': { nome: 'sigilo', raio: 0.85, dur: 0.9, tinta: '#ffc83a' },
  'contramagica-x': { nome: 'sigilo', raio: 0.9, dur: 0.7, tinta: '#ff8a7a' },
  'dissipar-sigilo': { nome: 'sigilo', raio: 0.9, dur: 0.8 },
  'maldicao-quebra': { nome: 'sigilo', raio: 0.85, dur: 0.8, tinta: '#ffe9a8' },
  'arma-ataque': { nome: 'poder', raio: 0.75, dur: 0.6 },
  'orientacao-estrela': { nome: 'poder', raio: 0.75, dur: 0.9 },
  aumentar: { nome: 'poder', raio: 1, dur: 0.9, cresce: [0.4, 1.3] },
  reduzir: { nome: 'poder', raio: 1, dur: 0.9, cresce: [1.3, 0.4] },
  aprimorar: { nome: 'poder', raio: 0.85, dur: 0.9 },
  'flechas-saraivada': { nome: 'adagas', raio: 0.8, dur: 0.6 },
};

/** A arte da graxa saiu âmbar, e o preto virar alfa ainda a clareia: sem isto, a poça é laranja. */
export const TINTA_DA_GRAXA = '#3a2a14';

/** O que cada zona que dura mostra no chão. A cor de `COR_DA_ZONA` fica por baixo, e a arte fica recortada nas casas dela: o que se vê é o que a regra pega. */
const ARTE_DA_ZONA = {
  graxa: [{ nome: 'graxa', alfa: 0.9, tinta: TINTA_DA_GRAXA }],
  teia: [{ nome: 'teia', alfa: 0.95 }],
  emaranhar: [{ nome: 'vinhas', alfa: 0.9 }],
  plantasConstritoras: [{ nome: 'vinhas', alfa: 0.9 }],
  crescimentoDeEspinhos: [{ nome: 'espinhos', alfa: 1 }],
  nuvemDeAdagas: [{ nome: 'adagas', alfa: 0.95 }],
  nuvemFetida: [{ nome: 'nuvem-mortal', alfa: 0.8, gira: 0.01, respira: 0.1 }],
  raioLunar: [{ nome: 'luar', alfa: 0.85, respira: 0.1 }],
  esferaFlamejante: [{ nome: 'chamas', alfa: 0.9, gira: 0.04, respira: 0.1 }],
  // A arte `tempestade` é de raios; o granizo é gelo no chão.
  tempestadeDeGranizo: [{ nome: 'estouro-gelo', alfa: 0.65, gira: 0.01 }],
  silencio: [{ nome: 'silencio', alfa: 0.7 }],
  muralhaDeVento: [{ nome: 'vento', alfa: 0.7, gira: 0.06 }],
  circuloMagico: [{ nome: 'circulo', alfa: 0.85, gira: 0.01 }],
  muralhaDeFogo: [{ nome: 'chamas', alfa: 0.9, gira: 0.03, respira: 0.1 }],
  muralhaDeEspinhos: [{ nome: 'espinhos', alfa: 1 }],
  muralhaDeGelo: [{ nome: 'gelo-aura', alfa: 0.9, respira: 0.06 }],
  // A Muralha de Força é INVISÍVEL no livro, e invisível no tabuleiro seria injogável: o jogador
  // precisa ver onde ela está para contornar. Fica um brilho fraco, que é o mínimo para ela existir
  // na tela sem virar parede opaca — a `desc` da magia diz que no livro não se vê.
  muralhaDeForca: [{ nome: 'protecao', alfa: 0.3, gira: 0.012 }],
  // A de PEDRA é a única em LADRILHO (`porCasa`), e não figura: alvenaria esticada por vinte casas
  // daria blocos de 3 m, e a mesma figura repetida em cada casa daria papel de parede. Em ladrilho
  // a textura se ancora na GRADE e corre por cima da muralha inteira, então a junta continua de uma
  // casa para a outra. `escala` é quantas casas a textura cobre antes de repetir: em 2 dá cerca de
  // quatro blocos por casa, que é pedra de parede e não paralelepípedo de rua.
  muralhaDePedra: [{ nome: 'pedra', alfa: 0.97, respira: 0.03, porCasa: true, escala: 2 }],
  nuvemMortal: [{ nome: 'nuvem-mortal', alfa: 0.85, gira: 0.01, respira: 0.08 }],
  guardiaoDaFe: [{ nome: 'bencao', alfa: 0.7, respira: 0.1 }],
  nevoaObscurecente: [{ nome: 'nevoa', alfa: 0.85, gira: 0.008, respira: 0.08 }],
  escuridao: [{ nome: 'escuridao', alfa: 0.95, gira: 0.01 }],
  fomeDeHadar: [{ nome: 'escuridao', alfa: 0.95, gira: 0.01 }, { nome: 'tentaculos', alfa: 0.9, gira: -0.015 }],
};

/**
 * Pinta a arte de uma zona, recortada nas casas dela. Devolve `false` se a zona não tem arte, ou se a imagem ainda não chegou, para quem chamou
 * cair no desenho antigo. Sem tempo de vida: o tabuleiro chama a cada quadro enquanto a zona existir.
 */
export const zonaTemArte = (z) => Boolean(ARTE_DA_ZONA[z.spellId]);

/**
 * A zona pintada como LADRILHO: a textura se repete ancorada na GRADE DO MAPA, e não na zona, então
 * ela corre contínua por cima de todas as casas da muralha — a junta de uma casa encaixa na da
 * vizinha, e andar a câmera não desliza a pedra. A âncora é o canto da casa (0,0), que é a mesma em
 * todo quadro.
 */
function pintarZonaEmLadrilho(ctx, board, z, camadas, casas) {
  let pintou = false;
  const t = board.time ?? 0;
  ctx.save();
  ctx.beginPath();
  for (const [x, y] of casas) {
    const c = board.center(x, y);
    ctx.rect(c.sx - board.casa / 2, c.sy - board.casa / 2, board.casa, board.casa);
  }
  ctx.clip();
  const o = board.centerF(0, 0);
  for (const { nome, alfa = 1, respira = 0, escala = 2 } of camadas) {
    const im = imagemDeArte(nome);
    if (!im?.naturalWidth) continue;
    const padrao = ctx.createPattern(im, 'repeat');
    if (!padrao) continue;
    pintou = true;
    const k = (board.casa * escala) / im.naturalWidth;
    // `setTransform` pode não existir em navegador antigo; sem ela o ladrilho fica preso ao canvas,
    // que é pior mas não quebra.
    padrao.setTransform?.(new DOMMatrix().translate(o.sx - board.casa / 2, o.sy - board.casa / 2).scale(k));
    ctx.globalAlpha = Math.max(0, Math.min(1, alfa + Math.sin(t * 1.4) * respira));
    ctx.fillStyle = padrao;
    for (const [x, y] of casas) {
      const c = board.center(x, y);
      ctx.fillRect(c.sx - board.casa / 2, c.sy - board.casa / 2, board.casa, board.casa);
    }
  }
  ctx.restore();
  return pintou;
}

export function pintarZonaComArte(ctx, board, z) {
  const camadas = ARTE_DA_ZONA[z.spellId];
  if (!camadas || !z.casas?.size) return false;
  const casas = [...z.casas].map((k) => k.split(',').map(Number));
  // O LADRILHO sai por outra porta: ele não tem centro nem raio, ele tem a grade.
  if (camadas[0]?.porCasa) return pintarZonaEmLadrilho(ctx, board, z, camadas, casas);
  const mx = casas.reduce((a, [x]) => a + x, 0) / casas.length;
  const my = casas.reduce((a, [, y]) => a + y, 0) / casas.length;
  const xs = casas.map(([x]) => x);
  const ys = casas.map(([, y]) => y);
  const largura = Math.max(...xs) - Math.min(...xs) + 1;
  const altura = Math.max(...ys) - Math.min(...ys) + 1;
  // A zona redonda ou quadrada mostra a arte inteira: quem diz onde a regra pega é o contorno. Só a que é uma tira (muralha) ou uma forma rala é que recorta, senão a arte redonda sairia da linha.
  const compacta = casas.length >= largura * altura * 0.5 && Math.min(largura, altura) * 2 >= Math.max(largura, altura);
  const raio = compacta ? Math.max(largura, altura) / 2 : Math.max(...casas.map(([x, y]) => Math.hypot(x - mx, y - my))) + 0.71;
  const { sx, sy } = compacta ? board.centerF((Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2) : board.centerF(mx, my);
  const lado = (raio * board.casa * 2) / FOLGA_DA_ARTE;
  const t = board.time ?? 0;
  let pintou = false;
  ctx.save();
  if (!compacta) {
    ctx.beginPath();
    for (const [x, y] of casas) {
      const c = board.center(x, y);
      ctx.rect(c.sx - board.casa / 2, c.sy - board.casa / 2, board.casa, board.casa);
    }
    ctx.clip();
  }
  for (const { nome, alfa = 1, gira = 0, respira = 0, tinta = null } of camadas) {
    if (!temArte(nome)) continue;
    pintou = true;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alfa + Math.sin(t * 1.4) * respira));
    ctx.translate(sx, sy);
    ctx.rotate(gira * t * Math.PI * 2);
    desenharArteCentrada(ctx, nome, lado, { t, tinta });
    ctx.restore();
  }
  ctx.restore();
  return pintou;
}

/** Uma arte branca tingida, uma vez por cor. */
const artesTingidas = new Map();
function arteTingida(nome, cor) {
  const im = imagemDeArte(nome);
  if (!im) return null;
  const chave = `${nome}|${cor}`;
  let cv = artesTingidas.get(chave);
  if (!cv) {
    cv = document.createElement('canvas');
    cv.width = im.naturalWidth;
    cv.height = im.naturalHeight;
    const c = cv.getContext('2d');
    c.drawImage(im, 0, 0);
    c.globalCompositeOperation = 'source-atop';
    c.globalAlpha = 0.7;
    c.fillStyle = cor;
    c.fillRect(0, 0, cv.width, cv.height);
    artesTingidas.set(chave, cv);
  }
  return cv;
}

/** A velocidade de um voo, em casas por segundo: a duração vem da distância, e um tiro longo não atravessa o mapa num piscar. */
const CASAS_POR_SEGUNDO = 13;
export const duracaoDoVoo = (de, para) => Math.max(0.28, Math.min(0.95, Math.hypot(para.x - de.x, para.y - de.y) / CASAS_POR_SEGUNDO));
const EASE_IN_OUT = (k) => (k < 0.5 ? 2 * k * k : 1 - ((-2 * k + 2) ** 2) / 2);
const TAU = Math.PI * 2;

/** Altura, em pixels, do "peito" de uma figura acima do centro do quadrado. */
export const CHEST = 32;

/**
 * Jeitos de atravessar um quadrado.
 *
 * O caminho é o mesmo para todo mundo; o que diferencia um espectro de um
 * zumbi e de uma aranha é o RITMO. Separar o ritmo do caminho é o que permite
 * reaproveitar a mesma interpolação em seis criaturas sem copiar código.
 *
 * - `tempo(k)`    remapeia o tempo global: aceleração, parada seca.
 * - `passoFrac(frac, idx)` remapeia DENTRO de um quadrado: arrasto, surto.
 * - `lift(f, t)`  altura em pixels (f = posição contínua em quadrados).
 * - `lateral(f, t)` desvio perpendicular ao avanço, em quadrados.
 * - `squash(f, t)` escala vertical pedida ao tabuleiro (ver relatório).
 */
const ANDARES = {
  // Passo normal: o balancinho por quadrado é o que faz ler como passo e não
  // como deslize. É o andar herdado, não mexa nos números.
  passo: { tps: 6.5, lift: (f) => Math.abs(Math.sin(f * Math.PI)) * 3 },

  // Gosma: avança em surtos, achatando no empurrão e esticando ao escorrer.
  // Sem balanço nenhum — qualquer sobe-e-desce devolveria pernas à criatura.
  rastejar: {
    tps: 3,
    lift: () => 0,
    passoFrac: (frac) => EASE_OUT(frac),
    squash: (f) => 1 - 0.22 * Math.sin((f % 1) * Math.PI),
  },

  // Aranha: três toques de pata por quadrado e tremor lateral que nunca para.
  // O tremor é o que dá o nojo; a velocidade sozinha só parece pressa.
  aranha: {
    tps: 9,
    lift: (f) => Math.abs(Math.sin(f * Math.PI * 3)) * 2,
    lateral: (_f, t) => Math.sin(t * 38) * 0.03,
  },

  // Stirge: voa alto e nunca em linha reta. Duas frequências somadas porque
  // uma só lê como pêndulo, e pêndulo não é nervoso.
  voo: {
    tps: 7,
    lift: (_f, t) => 16 + Math.sin(t * 17) * 5,
    lateral: (_f, t) => Math.sin(t * 26) * 0.09 + Math.sin(t * 11) * 0.04,
  },

  // Criatura Grande: sai do zero acelerando e chega no último instante. Os
  // 14% finais são a parada seca — é a pausa que comunica o peso, não a velocidade.
  investida: {
    tps: 5,
    tempo: (k) => Math.min(1, (k / 0.86) ** 2.1),
    lift: (f) => Math.abs(Math.sin(f * Math.PI)) * 1.5,
  },

  // Zumbi: uma perna sustenta pior que a outra, então um passo em cada dois
  // arrasta e afunda. O desequilíbrio é sempre para o mesmo lado.
  cambalear: {
    tps: 3.4,
    passoFrac: (frac, idx) => (idx % 2 === 0 ? EASE_IN_OUT(frac) : EASE_OUT(frac ** 1.7)),
    lift: (f) => Math.abs(Math.sin(f * Math.PI)) * (Math.floor(f) % 2 === 0 ? 1.5 : 4.5),
    lateral: (f) => Math.abs(Math.sin(f * Math.PI)) * 0.07,
  },
};

/**
 * Perfis de investida: como o corpo vai e volta ao longo do golpe.
 * `arco` é o golpe de arma; `bote` é o predador — sai disparado e recolhe devagar.
 */
const PERFIS = {
  arco: (k) => Math.sin(k * Math.PI),
  bote: (k) => (k < 0.26 ? EASE_OUT(k / 0.26) : 1 - EASE_IN_OUT((k - 0.26) / 0.74)),
};

export class Fx {
  constructor() {
    this.items = [];
    this.offsets = new Map();
    this.positions = new Map();   // id → posição CONTÍNUA em quadrados
    this.camera = { dx: 0, dy: 0 }; // tremor da tela, recalculado todo quadro
    this.tremorSink = null;        // ver ligarTremor()
  }

  clear() {
    this.items.length = 0;
    this.offsets.clear();
    this.positions.clear();
    this.camera.dx = 0;
    this.camera.dy = 0;
  }

  /**
   * Cancela efeitos presos a uma figura. Existe por causa dos efeitos em laço
   * (flutuar), que por definição não terminam sozinhos: quem liga, desliga.
   */
  cancel(id, kind = null) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      if (it.id === id && (kind === null || it.kind === kind)) this.items.splice(i, 1);
    }
    return this;
  }

  /**
   * Liga o tremor da tela a quem sabe sacudir a câmera (`board.bump`).
   * Sem isso o tremor fica guardado em `fx.camera` e cabe a quem desenha usá-lo.
   */
  ligarTremor(fn) {
    this.tremorSink = fn;
    return this;
  }

  /**
   * Soma um deslocamento ao que a figura já tem neste quadro.
   *
   * Sobrescrever seria mais curto, mas os efeitos se acumulam de verdade: a
   * maça dispara salto E investida no mesmo quadro, e um morto-vivo pode estar
   * flutuando enquanto recua. Quem sobrescreve perde um dos dois sem avisar.
   */
  _somaOffset(id, patch) {
    const cur = this.offsets.get(id);
    if (!cur) {
      this.offsets.set(id, {
        dx: 0, dy: 0, lift: 0, tilt: 0, squash: 1, alpha: 1, flash: 0, ...patch,
      });
      return;
    }
    cur.dx += patch.dx ?? 0;
    cur.dy += patch.dy ?? 0;
    cur.lift += patch.lift ?? 0;
    cur.tilt += patch.tilt ?? 0;
    cur.squash *= patch.squash ?? 1;
    cur.alpha *= patch.alpha ?? 1;
    cur.flash = Math.max(cur.flash, patch.flash ?? 0);
  }

  /** Posição interpolada de quem está andando, ou null. */
  positionFor(id) {
    return this.positions.get(id) ?? null;
  }

  /** Quanto falta, em segundos, para as caminhadas em curso terminarem. */
  get walkTimeLeft() {
    let left = 0;
    for (const it of this.items) {
      if (it.kind === 'walk') left = Math.max(left, it.dur - it.t);
    }
    return left;
  }

  add(item) {
    this.items.push({ t: 0, ...item });
    return this;
  }

  update(dt) {
    this.offsets.clear();
    this.positions.clear();
    this.camera.dx = 0;
    this.camera.dy = 0;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.t += dt;
      // Efeito em laço (flutuar) não tem fim: o tempo volta ao começo do ciclo.
      if (it.loop && it.t >= it.dur) it.t -= it.dur;
      const k = Math.min(1, it.t / it.dur);

      if (it.kind === 'walk' && it.path.length < 2) {
        // CAMINHO DE UM PONTO SÓ — e isto travava o jogo inteiro.
        //
        // Acontece quando o motor manda andar para o quadrado onde a criatura
        // já está. Aí `segs` é 0, o índice do segmento vira -1, e `path[-1]`
        // é `undefined`: a linha seguinte lia `.x` dele e lançava. Como isso
        // é dentro de `render`, que é dentro do `requestAnimationFrame`, a
        // exceção não derrubava só o quadro — derrubava o laço, e o tabuleiro
        // congelava de vez.
        //
        // Sem segmento não há o que interpolar: a figura fica onde está.
        const p = it.path[0];
        this.positions.set(it.id, { x: p.x, y: p.y, lift: 0, squash: 1, dx: 0, dy: 0 });
      } else if (it.kind === 'walk') {
        const modo = ANDARES[it.andar] ?? ANDARES.passo;
        const segs = it.path.length - 1;
        const kk = modo.tempo ? modo.tempo(k) : k;
        const bruto = Math.min(segs, kk * segs);
        const idx = Math.min(segs - 1, Math.floor(bruto));
        const frac = modo.passoFrac ? modo.passoFrac(bruto - idx, idx) : bruto - idx;
        const f = idx + frac;
        const a = it.path[idx];
        const b = it.path[idx + 1];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        // Desvio perpendicular ao avanço: é o que faz a aranha tremer e o
        // stirge zigue-zaguear sem sair do caminho que o motor autorizou.
        const lat = modo.lateral ? modo.lateral(f, it.t) : 0;
        this.positions.set(it.id, {
          x: a.x + dx * frac - dy * lat,
          y: a.y + dy * frac + dx * lat,
          lift: modo.lift(f, it.t),
          squash: modo.squash ? modo.squash(f, it.t) : 1,
          dx,
          dy,
        });
        if (idx !== it.lastStep) {
          it.lastStep = idx;
          it.onStep?.(idx);
        }
      }

      if (it.kind === 'lunge') {
        const push = (PERFIS[it.perfil] ?? PERFIS.arco)(k) * (it.reach ?? 0.38);
        this._somaOffset(it.id, { dx: it.vec.dx * push, dy: it.vec.dy * push });
      }
      if (it.kind === 'hop') {
        // Pulo curto para o golpe de cima para baixo: sobe e desce.
        this._somaOffset(it.id, { lift: Math.sin(k * Math.PI) * (it.height ?? 16) });
      }

      // Oscilação vertical contínua, sem passo: a figura não toca o chão.
      if (it.kind === 'flutuar') {
        this._somaOffset(it.id, { lift: it.altura + Math.sin(k * TAU) * it.amplitude });
      }

      // Stirge grudado: deixa o próprio quadrado e fica pousado na vítima.
      if (it.kind === 'grudar') {
        const chega = 0.18;
        const sai = 0.85;
        const avanco = k < chega ? EASE_OUT(k / chega) : k > sai ? 1 - EASE_IN_OUT((k - sai) / (1 - sai)) : 1;
        this.positions.set(it.id, {
          x: it.de.x + (it.sobre.x - it.de.x) * avanco,
          y: it.de.y + (it.sobre.y - it.de.y) * avanco,
          // Sobe para o peito da vítima e pulsa junto com a sucção.
          lift: 16 * avanco + Math.sin(it.t * 14) * 2 * avanco,
          dx: it.sobre.x - it.de.x,
          dy: it.sobre.y - it.de.y,
        });
      }

      // Recuo: o alvo é empurrado para longe de quem bateu e volta frouxo.
      if (it.kind === 'recuo') {
        const push = (k < 0.3 ? EASE_OUT(k / 0.3) : 1 - EASE_IN_OUT((k - 0.3) / 0.7)) * it.dist;
        this._somaOffset(it.id, { dx: it.vec.dx * push, dy: it.vec.dy * push });
      }

      if (it.kind === 'piscar') {
        // Dois clarões em vez de um: um só se confunde com o clarão de dano.
        this._somaOffset(it.id, { flash: Math.abs(Math.sin(k * Math.PI * 2)) * (1 - k * 0.4) });
      }

      // Derreter: a figura afunda e achata ao mesmo tempo que esmaece.
      if (it.kind === 'derreter') {
        this._somaOffset(it.id, { squash: 1 - 0.85 * EASE_IN_OUT(k), lift: -4 * k, alpha: 1 - k * 0.7 });
      }

      // Dissipar: nada de queda — some no ar subindo um pouco.
      if (it.kind === 'dissipar') {
        this._somaOffset(it.id, { lift: 14 * EASE_OUT(k), alpha: 1 - k, squash: 1 + 0.2 * k });
      }

      // Desabar: o corpo cede de uma vez, sem voltar.
      if (it.kind === 'ossos') {
        this._somaOffset(it.id, { squash: Math.max(0, 1 - EASE_IN_OUT(Math.min(1, k * 3))), alpha: Math.max(0, 1 - k * 3) });
      }

      if (it.kind === 'tremor') {
        // Duas frequências primas entre si para o tremor não parecer vibração
        // de motor; o quadrado da sobra do tempo é o que faz assentar rápido.
        const sobra = (1 - k) ** 2;
        this.camera.dx += Math.sin(it.t * 94) * it.forca * 9 * sobra;
        this.camera.dy += Math.cos(it.t * 71) * it.forca * 6 * sobra;
      }
      if (it.kind === 'projectile' && it.trail) {
        it.past ??= [];
        const e = EASE_IN_OUT(k);
        it.past.push({ x: it.from.x + (it.to.x - it.from.x) * e, y: it.from.y + (it.to.y - it.from.y) * e, lift: Math.sin(e * Math.PI) * 40 * it.arc, age: 0 });
        for (const p of it.past) p.age += dt;
        while (it.past.length && it.past[0].age > 0.22) it.past.shift();
      }

      if (it.t >= it.dur && !it.loop) {
        it.onDone?.();
        this.items.splice(i, 1);
      }
    }
  }

  offsetFor(id) {
    return this.offsets.get(id) ?? null;
  }

  // ---- movimento do corpo -------------------------------------------------

  /** Investida: o atacante avança na direção do alvo e volta. */
  lunge(actor, target, dur = 0.26, reach = 0.38) {
    const dx = target.x - actor.pos.x;
    const dy = target.y - actor.pos.y;
    const len = Math.hypot(dx, dy) || 1;
    return this.add({ kind: 'lunge', id: actor.id, dur, reach, vec: { dx: dx / len, dy: dy / len } });
  }

  /** Salto curto, para golpes de cima para baixo. */
  hop(actor, { dur = 0.3, height = 18 } = {}) {
    return this.add({ kind: 'hop', id: actor.id, dur, height });
  }

  /**
   * Caminhada: a figura percorre o caminho quadrado a quadrado.
   *
   * O motor já moveu a peça — isto só conta a viagem. Enquanto dura, o
   * tabuleiro desenha a figura na posição interpolada em vez do destino.
   */
  walk(actor, path, { tilesPerSecond = null, andar = 'passo', onStep = null, onDone = null } = {}) {
    if (!path || path.length < 2) return this;
    const modo = ANDARES[andar] ?? ANDARES.passo;
    const dur = Math.max(0.14, (path.length - 1) / (tilesPerSecond ?? modo.tps));
    return this.add({
      kind: 'walk', id: actor.id, andar, path: path.map((p) => ({ ...p })),
      dur, lastStep: -1, onStep, onDone,
    });
  }

  // ---- deslocamento por criatura ------------------------------------------
  //
  // Todos são `walk` com outro ritmo, então `walkTimeLeft` continua valendo e
  // `main.js` segue esperando a viagem terminar sem saber qual criatura é.

  /** Gosma escorrendo: comunica que a coisa não tem pernas — ela se derrama. */
  rastejar(actor, path, opts = {}) {
    return this.walk(actor, path, { ...opts, andar: 'rastejar' });
  }

  /** Aranha: comunica pressa de bicho — muitas patas e nenhum peso. */
  correrAranha(actor, path, opts = {}) {
    return this.walk(actor, path, { ...opts, andar: 'aranha' });
  }

  /** Stirge: comunica voo de inseto — alto, torto e impossível de prever. */
  voar(actor, path, opts = {}) {
    return this.walk(actor, path, { ...opts, andar: 'voo' });
  }

  /** Criatura Grande: comunica massa — custa para sair e custa para parar. */
  investir(actor, path, opts = {}) {
    return this.walk(actor, path, { ...opts, andar: 'investida' });
  }

  /** Zumbi: comunica corpo quebrado — anda, mas um lado não obedece. */
  cambalear(actor, path, opts = {}) {
    return this.walk(actor, path, { ...opts, andar: 'cambalear' });
  }

  /**
   * Espectro e crânio flamejante: comunica que não há pés no chão.
   *
   * É um efeito em LAÇO — fica até alguém chamar `cancel(id, 'flutuar')`.
   * Serve para o estado parado da criatura, não para uma ação.
   */
  flutuar(actor, { altura = 7, amplitude = 4, periodo = 2.2 } = {}) {
    this.cancel(actor.id, 'flutuar');   // nunca dois laços somando altura
    return this.add({ kind: 'flutuar', id: actor.id, dur: periodo, loop: true, altura, amplitude });
  }

  // ---- ataques de criatura -------------------------------------------------

  /**
   * Bote da aranha: comunica predador — o corpo sai disparado e recolhe devagar,
   * ao contrário do golpe de arma, que vai e volta no mesmo tempo.
   */
  bote(actor, target, { dur = 0.34, reach = 0.6, color = '#dff0c0' } = {}) {
    const dx = target.x - actor.pos.x;
    const dy = target.y - actor.pos.y;
    const len = Math.hypot(dx, dy) || 1;
    this.add({ kind: 'lunge', id: actor.id, dur, reach, perfil: 'bote', vec: { dx: dx / len, dy: dy / len } });
    this.fangs(target, { color, dur: 0.2 });
    return this;
  }

  /**
   * Sugada do stirge: comunica que o bicho não bate e vai embora — ele pousa
   * na vítima e fica lá bebendo, que é o que torna o dano por turno plausível.
   */
  sugar(actor, target, { dur = 1.1, color = '#b4262a' } = {}) {
    const sobre = {
      // Pousa um pouco antes do centro do alvo, senão a figura do stirge
      // desaparece dentro da figura da vítima.
      x: target.x + (actor.pos.x - target.x) * 0.26,
      y: target.y + (actor.pos.y - target.y) * 0.26,
    };
    return this.add({ kind: 'grudar', id: actor.id, de: { ...actor.pos }, sobre, tile: { ...target }, dur, color });
  }

  /**
   * Sopro do dragão em cone: comunica que o perigo não é o alvo, é a área —
   * quem estava no caminho se explica depois.
   */
  sopro(from, to, { color = '#8ed46a', dur = 0.65, spread = 0.5, tiles = null } = {}) {
    if (tiles) this.area(tiles, { color, dur: dur * 1.2 });
    const faiscas = [];
    for (let i = 0; i < 26; i++) {
      faiscas.push({ off: (Math.random() - 0.5) * 2, atraso: Math.random() * 0.45, vel: 0.7 + Math.random() * 0.6, size: 2 + Math.random() * 4 });
    }
    return this.add({ kind: 'sopro', from: { ...from }, to: { ...to }, color, dur, spread, faiscas });
  }

  /**
   * Batida de cauda: comunica golpe que vem de baixo e de lado — varre as
   * pernas em vez de descer sobre a cabeça, por isso o arco é rente ao chão.
   */
  cauda(tile, { color = '#cbb891', dur = 0.3, angle = 0, radius = 42 } = {}) {
    this.ring(tile, { color, radius: radius * 0.8, dur: 0.35, width: 2 });
    return this.add({ kind: 'cauda', tile: { ...tile }, color, dur, angle, radius });
  }

  /**
   * Agarrão: comunica contenção, não dano — duas garras fecham e o alvo é
   * puxado para dentro, que é o que o jogador precisa entender antes de fugir.
   */
  agarrao(tile, { color = '#e8d6a8', dur = 0.38 } = {}) {
    return this.add({ kind: 'agarrao', tile: { ...tile }, color, dur });
  }

  // ---- morte ---------------------------------------------------------------

  /**
   * Desabar em ossos: comunica que aquilo nunca foi vivo — não cai, desmonta.
   * Esqueleto e crânio flamejante.
   */
  ossos(actor, { color = '#ded2b4', dur = 0.95, count = 14 } = {}) {
    const tile = actor.pos ?? actor;
    const parts = [];
    for (let i = 0; i < count; i++) {
      const a = Math.random() * TAU;
      parts.push({
        vx: Math.cos(a) * (14 + Math.random() * 26),
        vy: -30 - Math.random() * 40,
        y0: 10 + Math.random() * 34,
        len: 4 + Math.random() * 7,
        rot: (Math.random() - 0.5) * 9,
        ang: a,
      });
    }
    this.add({ kind: 'ossos-pilha', tile: { ...tile }, color, dur, parts });
    if (actor.id !== undefined) this.add({ kind: 'ossos', id: actor.id, dur: dur * 0.45 });
    return this;
  }

  /**
   * Derreter: comunica que o corpo é só matéria — perde a forma e fica a poça.
   * Gelatina ocre e limos.
   */
  derreter(actor, { color = '#c8a84a', dur = 0.85 } = {}) {
    const tile = actor.pos ?? actor;
    this.add({ kind: 'poca', tile: { ...tile }, color, dur: dur * 1.3 });
    if (actor.id !== undefined) this.add({ kind: 'derreter', id: actor.id, dur });
    return this;
  }

  /**
   * Dissipar: comunica que não havia corpo para cair — o que existia se desfaz
   * subindo. Espectro, wraith, aparição.
   */
  dissipar(actor, { color = '#9fc6ff', dur = 0.8 } = {}) {
    const tile = actor.pos ?? actor;
    this.motes(tile, { color, count: 12, dur: dur * 1.1, rise: 62, spread: 22 });
    if (actor.id !== undefined) {
      this.cancel(actor.id, 'flutuar');   // quem dissipa para de flutuar
      this.add({ kind: 'dissipar', id: actor.id, dur });
    }
    return this;
  }

  // ---- reação --------------------------------------------------------------

  /**
   * Tremor da tela: comunica peso de impacto. É a única primitiva que fala do
   * jogo todo e não de uma figura, por isso sacode a câmera, não o alvo.
   */
  tremor(forca = 0.5, { dur = 0.34 } = {}) {
    if (this.tremorSink) this.tremorSink(forca);
    return this.add({ kind: 'tremor', forca, dur });
  }

  /**
   * Recuo do alvo: comunica para onde a força foi. Sem isso o golpe acontece
   * no atacante e o alvo só perde número.
   */
  recuo(target, from, { dur = 0.26, dist = 0.3 } = {}) {
    const alvo = target.pos ?? target;
    const dx = alvo.x - from.x;
    const dy = alvo.y - from.y;
    const len = Math.hypot(dx, dy) || 1;
    return this.add({ kind: 'recuo', id: target.id, dur, dist, vec: { dx: dx / len, dy: dy / len } });
  }

  /**
   * Piscar: comunica "foi este aqui" quando nada se move — resistiu, falhou no
   * salvamento, recebeu condição. Dois clarões, para não virar clarão de dano.
   */
  piscar(target, { dur = 0.34, color = '#ffffff' } = {}) {
    const tile = target.pos ?? target;
    this.add({ kind: 'clarao', tile: { ...tile }, color, dur });
    if (target.id !== undefined) this.add({ kind: 'piscar', id: target.id, dur });
    return this;
  }

  // ---- projéteis ----------------------------------------------------------

  projectile(from, to, {
    color = '#ffe9b0', style = 'arrow', dur = 0.26, arc = 0.5, fio = false,
    trail = false, spin = false, onDone = null, sprite = null, fps = 14,
  } = {}) {
    return this.add({ kind: 'projectile', from: { ...from }, to: { ...to }, color, style, dur, arc, trail, spin, onDone, sprite, fps, fio });
  }

  // `pulso`: o fio pulsa (Coroa da Loucura) em vez de só esmaecer.
  beam(from, to, { color = '#bfe6ff', dur = 0.22, width = 3, jagged = true, pulso = false } = {}) {
    return this.add({ kind: 'beam', from: { ...from }, to: { ...to }, color, dur, width, jagged, pulso });
  }

  // ---- impactos -----------------------------------------------------------

  /**
   * Efeito de quadros tocado uma vez sobre um quadrado (a explosão do Raio de
   * Fogo, o estouro de gelo). `altura` é quanto acima do chão o centro fica.
   * `sumir` (segundos): segura o último quadro e esmaece, para efeito que
   * termina cheio (a poça de graxa) não sumir de estalo.
   */
  // `de`: a casa de quem lançou. O desenho que vem da esquerda (o chicote)
  // vira de lado quando quem lançou está à direita na tela.
  // `entrar`: segundos para aparecer (lampejo), em vez de surgir de estalo.
  // `cresce: [de, ate]`: a figura se estica de uma escala à outra ao longo do efeito (a onda necrótica que se abre). É a única
  // exceção ao 1:1 dos quadros, e só para anéis que se expandem.
  // `chao: true`: desenha na camada do chão, por BAIXO das figuras (anéis e manchas que se deitam no tabuleiro).
  quadros(tile, nome, { fps = 14, sumir = 0, de = null, entrar = 0, cresce = null, chao = false } = {}) {
    const arte = ARTE_DO_IMPACTO[nome];
    if (arte && temArte(arte.nome)) {
      return this.arte(tile, arte.nome, { raio: arte.raio, dur: arte.dur ?? 0.5, entra: 0.05, sai: 0.3, gira: arte.gira ?? 0, tinta: arte.tinta ?? null, cresce: arte.cresce ?? [0.5, 1.05], laco: Boolean(arte.dur) });
    }
    const n = temEfeito(nome);
    if (!n) return this;
    const anim = n / fps;
    return this.add({ kind: 'quadros', tile: { ...tile }, nome, n, anim, dur: anim + sumir, de: de && { ...de }, entrar, cresce, chao });
  }

  /**
   * Domo de proteção (Escudo da Fé, Santuário, Proteção contra o Bem e o
   * Mal): sobe do chão, fica um instante e se apaga.
   */
  // `id`: de quem a bolha protege — ela acompanha a figura se ela andar.
  // `op`: força do véu (esfera grande = véu fraco; ver `domoCamadas`).
  /**
   * O que voa de quem lança até o alvo, visto de cima: reto, acelerando, com a cabeça na frente e fagulhas que ficam para trás no caminho.
   * `tamanho` é o comprimento da arte em casas; `fagulha` a cor do rastro. Devolve a duração, para quem chama marcar o impacto.
   */
  voo(de, para, nome, { tamanho = 2.4, fagulha = '#ffb35a', curva = 0 } = {}) {
    const dur = duracaoDoVoo(de, para);
    const sementes = Array.from({ length: 26 }, () => ({ em: Math.random(), lado: (Math.random() - 0.5) * 22, vida: 0.18 + Math.random() * 0.3, s: 1.5 + Math.random() * 2.5 }));
    this.add({ kind: 'voo', de: { ...de }, para: { ...para }, nome, tamanho, fagulha, curva, sementes, dur: dur + 0.45, voa: dur });
    return dur;
  }

  desenharVoo(ctx, board, it) {
    const a = board.centerF(it.de.x, it.de.y);
    const b = board.centerF(it.para.x, it.para.y);
    const ang = Math.atan2(b.sy - a.sy, b.sx - a.sx);
    // `curva`, em casas: o quanto o caminho abre para o lado no meio, para os dardos de uma salva não voarem um em cima do outro.
    const abre = (it.curva ?? 0) * board.casa;
    const pos = (e) => {
      const lado = Math.sin(Math.PI * e) * abre;
      return { x: a.sx + (b.sx - a.sx) * e - Math.sin(ang) * lado, y: a.sy + (b.sy - a.sy) * e + Math.cos(ang) * lado };
    };
    const rumo = (e) => {
      const p = pos(Math.max(0, e - 0.02));
      const q = pos(Math.min(1, e + 0.02));
      return Math.atan2(q.y - p.y, q.x - p.x);
    };
    const prog = Math.min(1, it.t / it.voa);
    const anda = (k) => k * k * (1.6 - 0.6 * k);   // sai devagar da mão e chega com força
    // O rastro fica parado no caminho e se apaga, depois de a cabeça passar.
    ctx.save();
    ctx.fillStyle = it.fagulha;
    for (const f of it.sementes) {
      const quando = f.em * it.voa;
      const idade = it.t - quando;
      if (idade < 0 || idade > f.vida) continue;
      const p = pos(anda(f.em));
      const k = idade / f.vida;
      ctx.globalAlpha = 1 - k;
      const nx = -Math.sin(ang); const ny = Math.cos(ang);
      ctx.beginPath();
      ctx.arc(p.x + nx * f.lado * (0.4 + k), p.y + ny * f.lado * (0.4 + k), f.s * (1 - k * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    if (it.t >= it.voa) return;
    const im = imagemDeArte(it.nome);
    if (!im) return;
    const p = pos(anda(prog));
    const lado = it.tamanho * board.casa;
    ctx.save();
    ctx.globalAlpha = Math.min(1, it.t / 0.06);
    ctx.translate(p.x, p.y);
    ctx.rotate(rumo(anda(prog)));
    // A cabeça da arte está na direita: ela vai à frente do ponto, e a cauda aponta para quem lançou.
    ctx.drawImage(im, -lado * 0.72, -lado / 2, lado, lado);
    ctx.restore();
  }

  /**
   * O CONE de uma magia, visto de cima. A arte tem a ponta no meio da borda ESQUERDA e abre para a direita, então ela nasce em quem conjura,
   * gira para onde ele aponta e cresce até o alcance. `casas` é o comprimento do cone — e, num cone do livro, também a largura da boca.
   */
  cone(de, para, nome, { casas = 3, dur = 0.8, abre = 0.22, sai = 0.3, tinta = null, recorte = null, semVideo = false } = {}) {
    return this.add({ kind: 'cone', de: { ...de }, para: { ...para }, nome, casas, dur, abre, sai, tinta, semVideo, recorte: recorte?.map((t) => ({ x: t.x, y: t.y })) ?? null });
  }

  desenharCone(ctx, board, it, k) {
    if (!temArte(it.nome)) return;
    const a = board.centerF(it.de.x, it.de.y);
    const b = board.centerF(it.para.x, it.para.y);
    if (a.sx === b.sx && a.sy === b.sy) return;
    const t = k * it.dur;
    // A língua sai da mão e alcança a ponta: o cone cresce em comprimento, não aparece inteiro de uma vez.
    const cresce = 0.3 + 0.7 * EASE_OUT(Math.min(1, t / it.abre));
    const lado = it.casas * board.casa * cresce;
    const alfa = Math.min(1, t / 0.05) * Math.min(1, it.sai ? (it.dur - t) / it.sai : 1);
    const ang = Math.atan2(b.sy - a.sy, b.sx - a.sx);
    // ANIMAR POR CÓDIGO, de graça: um JATO é material correndo da ponta para a boca, e a arte do cone é uma cunha com a ponta na origem.
    // Então escalar a arte a partir da ponta dá uma cunha menor ENCAIXADA na maior: três cópias crescendo de 0,45 até 1 e sumindo ao
    // chegar, defasadas em um terço de ciclo, viram pulsos que viajam para fora. A cópia inteira fica por baixo, para o cone não piscar.
    const PULSOS = 3;
    const CICLO = 0.42;
    const jato = (ctx2) => {
      const base = ctx2.globalAlpha || 1;
      if (!it.semVideo) { desenharArteEm(ctx2, it.nome, 0, -lado / 2, lado, lado, { k, tinta: it.tinta }); return; }
      ctx2.save();
      ctx2.globalAlpha = base;
      desenharArteEm(ctx2, it.nome, 0, -lado / 2, lado, lado, { k, tinta: it.tinta });
      ctx2.restore();
      for (let i = 0; i < PULSOS; i += 1) {
        const e = ((t / CICLO) + i / PULSOS) % 1;         // 0 na ponta, 1 na boca
        const l2 = lado * (0.45 + 0.55 * e);
        ctx2.save();
        ctx2.globalAlpha = base * 0.3 * Math.min(1, e * 4) * (1 - e);   // nasce e some ao chegar
        desenharArteEm(ctx2, it.nome, 0, -l2 / 2, l2, l2, { k, tinta: it.tinta });
        ctx2.restore();
      }
    };
    // Sem parede no caminho, o cone desenha direto: é o caso comum e não paga canvas auxiliar.
    if (!it.recorte?.length) {
      ctx.save();
      ctx.globalAlpha = alfa;
      ctx.translate(a.sx, a.sy);
      ctx.rotate(ang);
      jato(ctx);
      ctx.restore();
      return;
    }
    // Com parede, a arte passa pela máscara das casas que a magia REALMENTE pega: o cone para onde a regra para.
    const R = Math.ceil(lado) + board.casa;
    const aux = (this._auxCone ??= document.createElement('canvas'));
    if (aux.width < 2 * R) { aux.width = 2 * R; aux.height = 2 * R; }
    const c = aux.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, aux.width, aux.height);
    c.globalCompositeOperation = 'source-over';
    c.save();
    c.translate(R, R);
    c.rotate(ang);
    jato(c);
    c.restore();
    // A máscara tem um pixel por casa e sobe ampliada e suavizada: a borda sai em degradê, não em escada.
    const xs = it.recorte.map((t) => t.x); const ys = it.recorte.map((t) => t.y);
    const x0 = Math.min(...xs); const y0 = Math.min(...ys);
    const nx = Math.max(...xs) - x0 + 1; const ny = Math.max(...ys) - y0 + 1;
    const m = (it._mask ??= document.createElement('canvas'));
    if (m.width !== nx || m.height !== ny) {
      m.width = nx; m.height = ny;
      const mc = m.getContext('2d');
      mc.fillStyle = '#fff';
      for (const t of it.recorte) mc.fillRect(t.x - x0, t.y - y0, 1, 1);
    }
    c.globalCompositeOperation = 'destination-in';
    c.imageSmoothingEnabled = true;
    const p0 = board.center(x0, y0);
    c.drawImage(m, p0.sx - board.casa / 2 - a.sx + R, p0.sy - board.casa / 2 - a.sy + R, nx * board.casa, ny * board.casa);
    ctx.save();
    ctx.globalAlpha = alfa;
    ctx.drawImage(aux, 0, 0, 2 * R, 2 * R, a.sx - R, a.sy - R, 2 * R, 2 * R);
    ctx.restore();
  }

  /** Um traço que liga dois pontos na hora (o relâmpago): a arte esticada de ponta a ponta, tremendo, sem voar. `largura` em casas. */
  /**
   * Uma FAIXA de magia esticada de um ponto ao outro: o relâmpago, a muralha, a lufada, o sopro de dragão em linha. `largura` em casas.
   * `pisca` é o relâmpago, que vira e some a cada 60 ms. Sem ele a faixa fica firme e ganha movimento de graça (abaixo).
   */
  feixe(de, para, nome, { largura = 1.2, dur = 0.4, pisca = true, entra = 0 } = {}) {
    return this.add({ kind: 'feixe', de: { ...de }, para: { ...para }, nome, largura, dur, pisca, entra });
  }

  desenharFeixe(ctx, board, it, k) {
    const im = imagemDeArte(it.nome);
    if (!im) return;
    const a = board.centerF(it.de.x, it.de.y);
    const b = board.centerF(it.para.x, it.para.y);
    const larg = it.largura * board.casa;
    const comp = Math.hypot(b.sx - a.sx, b.sy - a.sy) * (it.entra ? Math.min(1, it.t / it.entra) : 1);
    ctx.save();
    ctx.translate(a.sx, a.sy);
    ctx.rotate(Math.atan2(b.sy - a.sy, b.sx - a.sx));
    if (it.pisca) {
      // Vira a cada 60 ms: é o que faz a mesma imagem parecer um raio vivo, e não um risco parado.
      const passo = Math.floor(it.t / 0.06);
      ctx.globalAlpha = Math.min(1, (1 - k) * 2.5) * (passo % 3 === 2 ? 0.7 : 1);
      ctx.scale(1, passo % 2 ? -1 : 1);
      ctx.drawImage(im, 0, -larg / 2, comp, larg);
      ctx.restore();
      return;
    }
    // A FAIXA SE REPETE, NÃO SE ESTICA. Uma muralha de 12 casas por 1,1 esticaria uma arte quase quadrada onze vezes, e o que era labareda
    // vira barra. Então a arte entra no tamanho natural dela e se repete ao longo do comprimento, espelhada a cada passo para a emenda não
    // virar padrão. E as duas PONTAS e as duas bordas saem em degradê: sem isso a faixa é um retângulo colado no mapa.
    const passo = Math.max(larg * 0.9, larg * (im.naturalWidth / im.naturalHeight));
    const quantos = Math.max(1, Math.ceil(comp / passo));
    const aux = (this._auxFaixa ??= document.createElement('canvas'));
    const W = Math.max(1, Math.ceil(comp));
    const H = Math.max(1, Math.ceil(larg));
    if (aux.width < W || aux.height < H) { aux.width = Math.max(aux.width, W); aux.height = Math.max(aux.height, H); }
    const c = aux.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, aux.width, aux.height);
    c.globalCompositeOperation = 'source-over';
    // Duas camadas: a de baixo firme, a de cima espelhada e pulsando. É o movimento de graça, sem vídeo.
    const onda = 0.5 + 0.5 * Math.sin(it.t * 4.4);
    for (const [espelha, alfa] of [[false, 1], [true, onda * 0.75]]) {
      c.save();
      c.globalAlpha = alfa;
      for (let i = 0; i < quantos; i += 1) {
        c.save();
        c.translate(i * passo, H / 2);
        if ((i % 2 === 1) !== espelha) c.scale(-1, 1);
        if (espelha) c.scale(1, -1);
        c.drawImage(im, (i % 2 === 1) !== espelha ? -passo : 0, -H / 2, passo, H);
        c.restore();
      }
      c.restore();
    }
    // O degradê das pontas e das bordas, que tira o corte reto.
    c.globalCompositeOperation = 'destination-in';
    const pontas = c.createLinearGradient(0, 0, W, 0);
    const d = Math.min(0.22, (larg * 0.8) / Math.max(1, comp));
    pontas.addColorStop(0, 'rgba(0,0,0,0)');
    pontas.addColorStop(d, 'rgba(0,0,0,1)');
    pontas.addColorStop(1 - d, 'rgba(0,0,0,1)');
    pontas.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = pontas;
    c.fillRect(0, 0, W, H);
    const bordas = c.createLinearGradient(0, 0, 0, H);
    // A borda longa esfuma pouco: a muralha tem extensão definida, e comer 16% de cada lado a deixava fina. O corte reto que incomodava
    // estava nas PONTAS, e é lá que o degradê precisa ser largo.
    bordas.addColorStop(0, 'rgba(0,0,0,0)');
    bordas.addColorStop(0.07, 'rgba(0,0,0,1)');
    bordas.addColorStop(0.93, 'rgba(0,0,0,1)');
    bordas.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = bordas;
    c.fillRect(0, 0, W, H);
    const fim = Math.min(1, (it.dur - it.t) / 0.35);
    ctx.globalAlpha = Math.max(0, fim) * Math.min(1, it.t / 0.08);
    ctx.drawImage(aux, 0, 0, W, H, 0, -larg / 2, comp, larg);
    ctx.restore();
  }

  /** O brilho em volta de quem conjura, na cor da magia, girando para dentro. */
  conjuracao(tile, { cor = '#c7b4ff', dur = 0.55, raio = 0.9, id = null } = {}) {
    return this.add({ kind: 'conjuracao', tile: { ...tile }, cor, dur, raio, id, fase: Math.random() * 6.28 });
  }

  desenharConjuracao(ctx, board, it, k) {
    const im = arteTingida('conjuracao', it.cor);
    if (!im) return;
    const w = it.id != null ? this.positionFor(it.id) : null;
    const { sx, sy } = board.centerF(w ? w.x : it.tile.x, w ? w.y : it.tile.y);
    const lado = (it.raio * board.casa * 2 * (1.25 - 0.35 * k)) / FOLGA_DA_ARTE;
    ctx.save();
    ctx.globalAlpha = 0.8 * Math.min(1, k * 6) * Math.min(1, (1 - k) * 2.5);
    ctx.translate(sx, sy);
    ctx.rotate(it.fase + k * 2.4);
    ctx.drawImage(im, -lado / 2, -lado / 2, lado, lado);
    ctx.restore();
  }

  /**
   * Uma arte vista de cima. `raio` em casas é o tamanho da magia; `cresce` o de onde até onde ela escala; `gira` em voltas por segundo;
   * `sombra` escurece o chão debaixo (a imagem é só luz, então o breu precisa disto); `ganho` a desenha mais vezes, para arte muito fina;
   * `noChao` a põe por baixo das fichas.
   */
  arte(tile, nome, { raio = 1, dur = 0.9, entra = 0.12, sai = 0.4, gira = 0, cresce = null, sombra = 0, ganho = 1, noChao = false, tinta = null, laco = false, recorte = null } = {}) {
    return this.add({ kind: 'arte', tile: { ...tile }, nome, tinta, laco, recorte, raio, dur, entra, sai, gira, cresce, sombra, ganho, noChao, fase: Math.random() * Math.PI * 2 });
  }

  desenharArte(ctx, board, it, k) {
    if (!temArte(it.nome)) return;
    const { sx, sy } = board.centerF(it.tile.x, it.tile.y);
    const escala = it.cresce ? it.cresce[0] + (it.cresce[1] - it.cresce[0]) * EASE_OUT(Math.min(1, k * 1.5)) : 1;
    const r = it.raio * board.casa * escala;
    const lado = (r * 2) / FOLGA_DA_ARTE;
    const t = k * it.dur;
    const alfa = Math.min(1, it.entra ? t / it.entra : 1) * Math.min(1, it.sai ? (it.dur - t) / it.sai : 1);
    ctx.save();
    if (it.sombra) {
      const g = ctx.createRadialGradient(sx, sy, r * 0.5, sx, sy, r);
      g.addColorStop(0, `rgba(8,4,16,${it.sombra * alfa})`);
      g.addColorStop(1, 'rgba(8,4,16,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    // `recorte`: as casas que a magia pega. A arte é redonda e a área pode ser cone ou ter parede no meio, então ela passa por uma máscara dessas casas.
    // A máscara tem um pixel por casa e é ampliada com suavização: a borda some em degradê, em vez de escada.
    if (it.recorte?.length) {
      const lado2 = Math.ceil(lado);
      const aux = (this._auxArte ??= document.createElement('canvas'));
      if (aux.width < lado2) { aux.width = lado2; aux.height = lado2; }
      const a = aux.getContext('2d');
      a.setTransform(1, 0, 0, 1, 0, 0);
      a.clearRect(0, 0, aux.width, aux.height);
      a.globalCompositeOperation = 'source-over';
      a.translate(lado2 / 2, lado2 / 2);
      a.rotate(it.fase + it.gira * t * Math.PI * 2);
      desenharArteCentrada(a, it.nome, lado, it.laco ? { t, tinta: it.tinta } : { k, tinta: it.tinta });
      a.setTransform(1, 0, 0, 1, 0, 0);
      a.globalCompositeOperation = 'destination-in';
      a.imageSmoothingEnabled = true;
      const casas = lado2 / board.casa;
      const n = 2 * Math.ceil(casas / 2 + 1);
      const mascara = (it._mascara ??= document.createElement('canvas'));
      if (mascara.width !== n) {
        mascara.width = n;
        mascara.height = n;
        const m = mascara.getContext('2d');
        m.fillStyle = '#fff';
        for (const c of it.recorte) m.fillRect(c.x - Math.floor(it.tile.x) + Math.floor(n / 2), c.y - Math.floor(it.tile.y) + Math.floor(n / 2), 1, 1);
      }
      // A casa (tile.x, tile.y) arredondada para baixo está no pixel n/2 da máscara; o centro da arte é o centro fracionário de tile.
      const ox = lado2 / 2 - (n / 2 + 0.5 + (it.tile.x - Math.floor(it.tile.x))) * board.casa;
      const oy = lado2 / 2 - (n / 2 + 0.5 + (it.tile.y - Math.floor(it.tile.y))) * board.casa;
      a.drawImage(mascara, ox, oy, n * board.casa, n * board.casa);
      ctx.globalAlpha = alfa;
      ctx.drawImage(aux, 0, 0, lado2, lado2, sx - lado2 / 2, sy - lado2 / 2, lado2, lado2);
      ctx.restore();
      return;
    }
    ctx.globalAlpha = alfa;
    ctx.translate(sx, sy);
    ctx.rotate(it.fase + it.gira * t * Math.PI * 2);
    for (let i = 0; i < it.ganho; i += 1) desenharArteCentrada(ctx, it.nome, lado, it.laco ? { t, tinta: it.tinta } : { k, tinta: it.tinta });
    ctx.restore();
  }

  domo(tile, { cor = 'ouro', dur = 1.4, raio = 36, altura = 68, id = null, op = 1 } = {}) {
    return this.add({ kind: 'domo', tile: { ...tile }, cor, dur, raio, altura, id, f: tile.f ?? 1, op });
  }

  impact(tile, { color = '#ffd27a', count = 10, spread = 46, dur = 0.42 } = {}) {
    const parts = [];
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const speed = spread * (0.4 + Math.random() * 0.8);
      parts.push({ vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, size: 2 + Math.random() * 3 });
    }
    return this.add({ kind: 'impact', tile: { ...tile }, color, parts, dur });
  }

  /** Arco de corte. `sweep` controla a abertura; `angle`, a inclinação. */
  slash(tile, { color = '#ffffff', dur = 0.22, angle = -0.6, sweep = 0.9, radius = 24, width = 4 } = {}) {
    return this.add({ kind: 'slash', tile: { ...tile }, color, dur, angle, sweep, radius, width });
  }

  /** Estocada: um traço curto e rápido na direção do golpe. */
  stab(tile, { color = '#ffffff', dur = 0.16, angle = 0, length = 26 } = {}) {
    return this.add({ kind: 'stab', tile: { ...tile }, color, dur, angle, length });
  }

  /** Pancada: onda no chão e poeira. Para maça, bordão e coice. */
  smash(tile, { color = '#e8d6a8', dur = 0.4 } = {}) {
    this.ring(tile, { color, radius: 42, dur: 0.45, width: 4 });
    return this.add({ kind: 'smash', tile: { ...tile }, color, dur });
  }

  /** Mordida: duas marcas convergindo. */
  fangs(tile, { color = '#ffffff', dur = 0.24 } = {}) {
    return this.add({ kind: 'fangs', tile: { ...tile }, color, dur });
  }

  /** Três riscos paralelos. */
  claw(tile, { color = '#ffd7d0', dur = 0.26, angle = -0.5 } = {}) {
    return this.add({ kind: 'claw', tile: { ...tile }, color, dur, angle });
  }

  // ---- magia --------------------------------------------------------------

  /** Coluna de luz descendo do alto sobre o quadrado. */
  pillar(tile, { color = '#ffe9a8', dur = 0.5, width = 18, height = 190, alpha = 1 } = {}) {
    return this.add({ kind: 'pillar', tile: { ...tile }, color, dur, width, height, alpha });
  }

  /** Línguas de fogo subindo. Serve para magia de fogo e para queimadura. */
  flames(tile, { color = '#ff7a3a', count = 5, dur = 0.5, scale = 1 } = {}) {
    const seeds = [];
    for (let i = 0; i < count; i++) seeds.push({ phase: Math.random() * 6.28, off: (Math.random() - 0.5) * 16 * scale });
    return this.add({ kind: 'flames', tile: { ...tile }, color, dur, seeds, scale });
  }

  /** Pontos leves subindo. Cura, bênção, encantamento. */
  motes(tile, { color = '#6ee89a', count = 10, dur = 0.7, rise = 46, spread = 20 } = {}) {
    const parts = [];
    for (let i = 0; i < count; i++) {
      parts.push({ x: (Math.random() - 0.5) * spread, delay: Math.random() * 0.3, size: 2 + Math.random() * 2, wob: Math.random() * 6.28 });
    }
    return this.add({ kind: 'motes', tile: { ...tile }, color, dur, parts, rise });
  }

  /** Lascas angulares — gelo, pedra, vidro. */
  shards(tile, { color = '#bfe9ff', count = 8, dur = 0.45, spread = 40 } = {}) {
    const parts = [];
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      parts.push({ a, vx: Math.cos(a) * spread * (0.5 + Math.random()), vy: Math.sin(a) * spread, len: 5 + Math.random() * 6, rot: Math.random() * 3 });
    }
    return this.add({ kind: 'shards', tile: { ...tile }, color, dur, parts });
  }

  /** Argola girando acima da cabeça. Bênção, consagração. */
  halo(tile, { color = '#ffe9a8', dur = 0.8, radius = 16 } = {}) {
    return this.add({ kind: 'halo', tile: { ...tile }, color, dur, radius });
  }

  /** Símbolo que sobe e some. Sono, confusão, marcação. */
  glyph(tile, { text = 'z', color = '#c7b4ff', dur = 0.9, rise = 40, size = 20 } = {}) {
    return this.add({ kind: 'glyph', tile: { ...tile }, text, color, dur, rise, size });
  }

  // `fecha`: o anel nasce grande e se fecha sobre o alvo (Reduzir), em vez de abrir.
  ring(tile, { color = '#9fe8ff', radius = 46, dur = 0.5, width = 3, fecha = false } = {}) {
    return this.add({ kind: 'ring', tile: { ...tile }, color, radius, dur, width, fecha });
  }

  area(tiles, { color = '#ff8a4a', dur = 0.5 } = {}) {
    return this.add({ kind: 'area', tiles: tiles.map((t) => ({ ...t })), color, dur });
  }

  // ---- desenho: rente ao chão ---------------------------------------------

  /**
   * Efeitos de CHÃO (`quadros` com `chao`) vão para uma tela à parte e entram casa a casa no laço de profundidade do tabuleiro
   * (`chaoNaCasa`): o chão é desenhado DEPOIS de `drawGround`, e um efeito pintado antes ficaria por baixo do terreno.
   */
  prepararChao(ctx, board) {
    const lista = this.items.filter((i) => (i.kind === 'quadros' || i.kind === 'onda') && i.chao);
    if (!lista.length) { this._chao = null; return; }
    // O plano do efeito é o da altura da casa onde ele nasce; cada casa mostra a sua fatia nesse plano (`chaoNaCasa`).
    this._chaoAltura = board.field.heightAt(Math.round(lista[0].tile.x), Math.round(lista[0].tile.y));
    const cv = (this._chaoCv ??= document.createElement('canvas'));
    if (cv.width !== ctx.canvas.width || cv.height !== ctx.canvas.height) { cv.width = ctx.canvas.width; cv.height = ctx.canvas.height; }
    // `willReadFrequently`: o laço de profundidade lê esta tela casa a casa; em GPU, cada leitura trazia a tela inteira de volta.
    const c = (this._chaoCtx ??= cv.getContext('2d', { willReadFrequently: true }));
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, cv.width, cv.height);
    c.setTransform(ctx.getTransform());
    for (const it of lista) {
      const k = Math.min(1, it.t / it.dur);
      if (it.kind === 'onda') this.desenharOnda(c, board, it, k);
      else this.desenharQuadros(c, board, it, k);
    }
    this._chao = cv;
  }

  /**
   * O pedaço do efeito de chão que cai sobre a casa (x, y): logo depois do ladrilho dela, antes de parede e figuras. Só o retângulo da
   * casa é copiado (copiar a tela inteira por casa custava ~11 ms por quadro), da fatia do plano do efeito para o topo da casa, que pode
   * estar mais alto ou mais baixo. Parede fica de fora: o efeito não pinta o topo dela.
   */
  chaoNaCasa(ctx, board, x, y) {
    if (!this._chao || board.field.tileAt(x, y) === 1) return;
    const dst = board.iso(x, y);
    const src = board.iso(x, y, this._chaoAltura);
    const m = ctx.getTransform();
    ctx.save();
    // O losango da casa, um pouco inflado: o recorte suavizado deixava uma costura clara nas emendas.
    const g = 0.75;
    ctx.beginPath();
    ctx.moveTo(dst.sx, dst.sy - g);
    ctx.lineTo(dst.sx + 32 + g, dst.sy + 16);
    ctx.lineTo(dst.sx, dst.sy + 32 + g);
    ctx.lineTo(dst.sx - 32 - g, dst.sy + 16);
    ctx.closePath();
    ctx.clip();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const w = m.a * 68;
    const h = m.d * 36;
    ctx.drawImage(this._chao, m.a * (src.sx - 34) + m.e, m.d * (src.sy - 2) + m.f, w, h, m.a * (dst.sx - 34) + m.e, m.d * (dst.sy - 2) + m.f, w, h);
    ctx.restore();
  }

  drawGround(ctx, board) {
    this.prepararChao(ctx, board);
    // Sem o laço de profundidade do isométrico, a tela de chão entra inteira, por baixo das fichas.
    if (this._chao) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(this._chao, 0, 0);
      ctx.restore();
    }
    for (const it of this.items) {
      const k = Math.min(1, it.t / it.dur);
      if (it.kind === 'arte' && it.noChao) this.desenharArte(ctx, board, it, k);
      if (it.kind === 'conjuracao') this.desenharConjuracao(ctx, board, it, k);

      if (it.kind === 'ring') {
        const r = it.fecha ? it.radius * (1 - EASE_OUT(k) * 0.85) : it.radius * EASE_OUT(k);
        const { sx, sy } = board.centerF(it.tile.x, it.tile.y);
        ctx.save();
        ctx.globalAlpha = it.fecha ? Math.min(1, (1 - k) * 1.6) : 1 - k;
        ctx.strokeStyle = it.color;
        ctx.lineWidth = it.width;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      if (it.kind === 'area') {
        ctx.save();
        ctx.globalAlpha = (1 - k) * 0.5;
        ctx.fillStyle = it.color;
        for (const t of it.tiles) {
          const { sx, sy } = board.centerF(t.x, t.y);
          board.diamond(ctx, sx, sy - board.tileHalf);
          ctx.fill();
        }
        ctx.restore();
      }

      if (it.kind === 'poca') {
        // A poça cresce enquanto a figura afunda e só então começa a secar:
        // é a sequência que conta "isto aqui era a criatura".
        const { sx, sy } = board.centerF(it.tile.x, it.tile.y);
        const r = 10 + 16 * EASE_OUT(Math.min(1, k / 0.45));
        ctx.save();
        ctx.globalAlpha = k < 0.55 ? 0.8 : 0.8 * (1 - (k - 0.55) / 0.45);
        ctx.fillStyle = it.color;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
        // Brilho em cima da poça: sem ele a mancha lê como buraco.
        ctx.globalAlpha *= 0.5;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(sx - r * 0.3, sy - r * 0.3, r * 0.3, r * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (it.kind === 'cauda') {
        // Arco longo e achatado passando rente ao chão, com poeira atrás.
        const { sx, sy } = board.centerF(it.tile.x, it.tile.y);
        const varre = -0.9 + 1.8 * EASE_OUT(k);
        ctx.save();
        ctx.globalAlpha = Math.sin(Math.min(1, k * 1.2) * Math.PI);
        ctx.translate(sx, sy - 6);
        ctx.rotate(it.angle);
        ctx.strokeStyle = it.color;
        ctx.lineWidth = 5 * (1 - k * 0.6);
        ctx.beginPath();
        ctx.arc(0, 0, it.radius, varre - 0.8, varre + 0.2);
        ctx.stroke();
        ctx.globalAlpha *= 0.5;
        ctx.fillStyle = '#d8c9a8';
        for (let i = 0; i < 5; i++) {
          const a = varre - 0.8 + (i / 5) * 0.9;
          ctx.fillRect(Math.cos(a) * it.radius, Math.sin(a) * it.radius, 3, 3);
        }
        ctx.restore();
      }

      if (it.kind === 'smash') {
        const { sx, sy } = board.centerF(it.tile.x, it.tile.y);
        ctx.save();
        ctx.globalAlpha = (1 - k) * 0.85;
        // Rachaduras saindo do ponto de impacto.
        ctx.strokeStyle = it.color;
        ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 + 0.3;
          const len = 10 + 26 * EASE_OUT(k);
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + Math.cos(a) * len, sy + Math.sin(a) * len);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
  }

  // ---- desenho: acima das figuras -----------------------------------------

  /**
   * Os domos em cena, com a casa em que estão AGORA (quem anda leva a bolha)
   * e as duas diagonais de profundidade: a de trás (a casa) e a da frente (a
   * mais perto da câmera que a pegada ocupa). Lista vazia quase sempre.
   */
  domosAtivos(board) {
    const out = [];
    for (const it of this.items) {
      if (it.kind !== 'domo') continue;
      const c = it.id != null ? board.enc.combatants.find((q) => q.id === it.id) : null;
      if (c && !board.figuraVisivel(c)) continue; // a bolha no escuro não entrega ninguém
      const w = it.id != null ? this.positionFor(it.id) : null;
      const ax = w ? w.x : c ? c.pos.x : it.tile.x;
      const ay = w ? w.y : c ? c.pos.y : it.tile.y;
      const rx = Math.round(ax);
      const ry = Math.round(ay);
      const v = board.toView(rx, ry);
      let dFrente = v.vx + v.vy;
      for (const [i, j] of [[it.f - 1, 0], [0, it.f - 1], [it.f - 1, it.f - 1]]) {
        const q = board.toView(rx + i, ry + j);
        dFrente = Math.max(dFrente, q.vx + q.vy);
      }
      const meio = (it.f - 1) / 2;
      out.push({ it, x: ax + meio, y: ay + meio, dTras: v.vx + v.vy, dFrente });
    }
    // As colunas de luz das magias de utilidade (`overlay.marcas`, de `game/magias-fora-extra.js`).
    for (const m of board.overlay?.marcas ?? []) out.push(this.domoDaMarca(board, m));
    // O Silêncio é uma esfera de gelo enquanto a zona existir: nenhuma vida
    // própria, o tabuleiro lê `enc.zonas` a cada quadro.
    for (const z of board.enc.zonas ?? []) {
      if (z.silencio && !z.obscuro) out.push(this.domoDaZona(board, z, 'gelo'));
      // Luz do Dia: a esfera de luz plena, clara e fraca, que não esconde ninguém.
      else if (z.luz) out.push(this.domoDaZona(board, z, 'sol'));
      // Círculo Mágico: o cilindro de runas, na cor do tipo que ele barra.
      else if (z.circuloMagico) out.push(this.domoDaZona(board, z, `circ-${z.circuloMagico.tipo}`));
    }
    return out;
  }

  /**
   * Uma coluna de luz translúcida (cilindro, como o Círculo Mágico) sobre uma casa marcada por uma
   * magia de utilidade. Fica em volta da figura sem escondê-la (o véu é quase nulo no miolo).
   */
  domoDaMarca(board, m) {
    const chave = `${m.x},${m.y},${m.cor},${m.f ?? 1},${board.rot}`;
    this._marcaDomos ??= new Map();
    let o = this._marcaDomos.get(chave);
    if (!o) {
      if (this._marcaDomos.size > 60) this._marcaDomos.clear();
      const f = m.f ?? 1;
      const forma = MARCA_FORMA[m.cor] ?? {};
      const meio = (f - 1) / 2;
      const v = board.toView(m.x, m.y);
      let dFrente = v.vx + v.vy;
      for (const [i, j] of [[f - 1, 0], [0, f - 1], [f - 1, f - 1]]) {
        const q = board.toView(m.x + i, m.y + j);
        dFrente = Math.max(dFrente, q.vx + q.vy);
      }
      o = {
        it: {
          cor: m.cor, raio: (forma.raio ?? 16) + 12 * (f - 1), altura: (forma.altura ?? 56) + 16 * (f - 1), cilindro: true, f: 1, fixo: true, id: null, op: 1,
          vistoEm: board.time, glifo: forma.glifo ?? null, pisca: Boolean(forma.pisca),
        },
        x: m.x + meio, y: m.y + meio, dTras: v.vx + v.vy, dFrente,
      };
      this._marcaDomos.set(chave, o);
    }
    return o;
  }

  /**
   * A esfera fixa de uma zona, no formato de `domosAtivos`: centro (o da zona,
   * ou a média das casas), raio pela casa mais distante em
   * degraus de 8 px, e as duas diagonais pelas casas de trás e da frente.
   * Cacheada por zona e rotação; só o fade-in (0,5 s) depende do tempo.
   */
  domoDaZona(board, z, cor) {
    const chave = `${z.id}|${board.rot}|${cor}|${z.casas.size}`;
    this._zonaDomos ??= new Map();
    let o = this._zonaDomos.get(chave);
    if (!o) {
      if (this._zonaDomos.size > 24) this._zonaDomos.clear();
      const cs = [...z.casas].map((k) => k.split(',').map(Number));
      const cx = z.centro ? z.centro.x : cs.reduce((n, c) => n + c[0], 0) / cs.length;
      const cy = z.centro ? z.centro.y : cs.reduce((n, c) => n + c[1], 0) / cs.length;
      let casas = Math.max(...cs.map(([x, y]) => Math.hypot(x - cx, y - cy))) + 0.5;
      if (cor === 'sol') casas = Math.min(casas, 6.5);
      let raio = Math.max(16, 8 * Math.round((casas * board.casa) / 8));
      if (cor === 'sol') raio = Math.min(raio, 288);
      let altura = 4 * Math.round(Math.min(170, Math.max(40, raio * 0.8)) / 4);
      if (cor === 'sol') altura = 4 * Math.round(raio * 0.55 / 4);
      const cilindro = cor.startsWith('circ-');
      if (cilindro) altura = 4 * Math.round(Math.min(120, raio * 0.8) / 4);
      const ds = cs.map(([x, y]) => { const v = board.toView(x, y); return v.vx + v.vy; });
      // Uma esfera grande cobre o chão de várias diagonais: as costas só podem
      // vir depois do chão que elas cobrem (o centro), senão o contorno de cima
      // fica debaixo das casas de trás.
      const vc = board.toView(cx, cy);
      o = {
        it: { cor, raio, altura, cilindro, f: 1, fixo: true, id: null, op: cor === 'sol' ? Math.min(0.55, Math.min(1, Math.max(0.85, 48 / raio))) : Math.min(1, Math.max(0.85, 48 / raio)), vistoEm: board.time },
        x: cx, y: cy, dTras: Math.round(vc.vx + vc.vy), dFrente: Math.max(...ds),
      };
      this._zonaDomos.set(chave, o);
    }
    return o;
  }

  /** As camadas dos domos de uma diagonal (o tabuleiro chama no laço de profundidade). */
  domosNaDiagonal(ctx, board, domos, d, camada) {
    for (const o of domos) {
      if ((camada === 'tras' ? o.dTras : o.dFrente) === d) this.desenharDomo(ctx, board, o, camada);
    }
  }

  /**
   * Uma camada do domo. A bolha INFLA (passa um pouco do tamanho e assenta aos
   * 0,35 s), lampeja em branco quando fecha, fica, e no fim se abre e some.
   * O tamanho anda em passos de 4 px: poucas entradas no cache.
   */
  desenharDomo(ctx, board, o, camada) {
    const { it } = o;
    const { sx, sy } = board.centerF(o.x, o.y);
    // De cima, a esfera é um disco: quem o desenha é a camada de trás, e a de frente só leva o glifo que paira.
    if (it.fixo) {
      const surgir = Math.min(1, (board.time - it.vistoEm) / 0.5);
      // Armadilha pisca a 2 Hz: o perigo chama a atenção sem esconder a casa.
      const alfa = surgir * (it.pisca ? (Math.floor(board.time * 4) % 2 ? 1 : 0.5) : 1);
      if (camada === 'tras') discoDeCima(ctx, sx, sy, it.raio, it.cor, alfa, it.op ?? 1, it.cilindro);
      if (camada === 'frente' && it.glifo && it.cilindro) {
        const bob = Math.round(Math.sin(board.time * 3 + o.x * 1.7 + o.y) * 2);
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.globalAlpha = alfa;
        desenharGlifo(ctx, it.glifo, sx, sy - 12 + bob, DOMO_CORES[it.cor]?.borda ?? DOMO_CORES[it.cor]?.rgb ?? [255, 255, 255]);
        ctx.restore();
      }
      return;
    }
    if (camada !== 'tras') return;
    const t = it.t;
    let e = 1;
    let alfa = 1;
    if (t < 0.25) e = 1.06 * EASE_OUT(t / 0.25);
    else if (t < 0.35) e = 1.06 - 0.06 * ((t - 0.25) / 0.1);
    const fim = it.dur * 0.65;
    if (t > fim) alfa = 1 - Math.min(1, (t - fim) / (it.dur - fim));
    discoDeCima(ctx, sx, sy, it.raio * e, it.cor, alfa, it.op ?? 1, false);
    // O lampejo de quando a bolha fecha.
    if (t >= 0.3 && t < 0.38) discoDeCima(ctx, sx, sy, it.raio * e, 'brilho', 0.6, 1, false);
  }

  /**
   * ONDA DE CHÃO (onda necrótica, 9 m): desenhada por código, em pixels duros (varredura por linhas, sem suavização), porque o raio é de
   * muitas casas e um sprite esticado lê como um anel vazio. `raio` está em casas; no isométrico 2:1 o círculo da grade vira uma elipse de
   * semi-eixos 45 e 22,6 px por casa. Camadas: poça escura que se abre e some, borda violeta grossa com fio de luz, rastro escuro mais
   * atrás e fagulhas ossudas que sobem da faixa da onda. Vai para a tela de chão (`prepararChao`) e entra casa a casa, sobre o terreno.
   */
  onda(tile, { raio = 6, dur = 1.2, cor = '#a579d8', escuro = '#3a2760', osso = '#e8eef5', fagulhas = 80 } = {}) {
    const sem = [];
    for (let i = 0; i < fagulhas; i += 1) sem.push({ a: Math.random() * Math.PI * 2, r: 0.3 + Math.random() * 0.7, h: 40 + Math.random() * 60, w: Math.random() < 0.4 ? 6 : 5 });
    return this.add({ kind: 'onda', tile: { ...tile }, raio, dur, cor, escuro, osso, sem, chao: true });
  }

  /** Elipse cheia, em linhas de 1 px (bordas duras). */
  elipseDura(ctx, cx, cy, rx, ry) {
    if (rx < 1 || ry < 1) return;
    for (let y = -Math.floor(ry); y <= Math.floor(ry); y += 1) {
      const meia = rx * Math.sqrt(Math.max(0, 1 - (y / ry) * (y / ry)));
      ctx.fillRect(Math.round(cx - meia), Math.round(cy + y), Math.max(1, Math.round(2 * meia)), 1);
    }
  }

  /**
   * Elipse em trama de blocos de 2x2 px: a poça que se desfaz em pontilhado, sem meio-tom. `ralo` 1 deixa metade dos blocos (xadrez),
   * 2 deixa um em cada quatro.
   */
  elipseTramada(ctx, cx, cy, rx, ry, ralo = 1) {
    if (rx < 1 || ry < 1) return;
    for (let y = -Math.floor(ry); y <= Math.floor(ry); y += 1) {
      const meia = rx * Math.sqrt(Math.max(0, 1 - (y / ry) * (y / ry)));
      const x0 = Math.round(cx - meia);
      const x1 = Math.round(cx + meia);
      const bloco = Math.floor((Math.round(cy + y)) / 2);
      for (let x = x0 - (x0 % 2); x < x1; x += 2) {
        const bx = x / 2;
        const vivo = ralo === 1 ? (bx + bloco) % 2 === 0 : (ralo === 2 ? bx % 2 === 0 && bloco % 2 === 0 : true);
        if (vivo && x >= x0 - 1) ctx.fillRect(x, Math.round(cy + y), 2, 1);
      }
    }
  }

  /** Anel de `grosso` px (e metade disso na vertical), em linhas de 1 px. */
  anelDuro(ctx, cx, cy, rx, ry, grosso) {
    if (rx < 2 || ry < 1) return;
    const gy = Math.max(1, Math.round(grosso / 2));
    const rxi = rx - grosso;
    const ryi = ry - gy;
    for (let y = -Math.floor(ry); y <= Math.floor(ry); y += 1) {
      const fora = rx * Math.sqrt(Math.max(0, 1 - (y / ry) * (y / ry)));
      const dentro = ryi > 0 && Math.abs(y) < ryi && rxi > 0 ? rxi * Math.sqrt(Math.max(0, 1 - (y / ryi) * (y / ryi))) : 0;
      if (dentro <= 0) {
        ctx.fillRect(Math.round(cx - fora), Math.round(cy + y), Math.max(1, Math.round(2 * fora)), 1);
      } else {
        ctx.fillRect(Math.round(cx - fora), Math.round(cy + y), Math.max(1, Math.round(fora - dentro)), 1);
        ctx.fillRect(Math.round(cx + dentro), Math.round(cy + y), Math.max(1, Math.round(fora - dentro)), 1);
      }
    }
  }

  desenharOnda(ctx, board, it, k) {
    const { sx, sy } = board.centerF(it.tile.x, it.tile.y);
    const kk = EASE_OUT(Math.min(1, k));
    // De cima, o raio em casas é o mesmo para os dois lados.
    const rx = it.raio * board.casa;
    const ry = rx;
    // Alfa em degraus (sem contínuo): o pixel art não tem meio-tom.
    // O alfa é 0 ou 1 (nada de meio-tom): o que apaga vira trama, e o que some vira ausência.
    const degrau = (v) => (v > 0.45 ? 1 : 0);
    ctx.save();
    // A poça escura: opaca no começo, desfeita no fim, que ainda dura um instante depois do anel.
    ctx.fillStyle = it.escuro;
    ctx.globalAlpha = 1;
    if (k < 0.45) this.elipseDura(ctx, sx, sy, rx * kk, ry * kk);
    else if (k < 0.7) this.elipseTramada(ctx, sx, sy, rx * kk, ry * kk, 1);
    else if (k < 0.92) this.elipseTramada(ctx, sx, sy, rx * kk, ry * kk, 2);
    // Rastro escuro, atrás da borda.
    ctx.globalAlpha = degrau(0.9 * (1 - k));
    ctx.fillStyle = '#251a42';
    this.anelDuro(ctx, sx, sy, rx * kk * 0.74, ry * kk * 0.74, 5);
    // Borda violeta grossa e o fio de luz por dentro.
    ctx.globalAlpha = degrau(1 - k * k * 0.9);
    ctx.fillStyle = it.cor;
    this.anelDuro(ctx, sx, sy, rx * kk, ry * kk, Math.max(3, Math.round(8 * (1 - k * 0.5))));
    ctx.globalAlpha = degrau(0.95 * (1 - k));
    ctx.fillStyle = it.osso;
    this.anelDuro(ctx, sx, sy, rx * kk - 6 * (1 - k * 0.5), ry * kk - 3 * (1 - k * 0.5), 2);
    // Fagulhas: quadradinhos que sobem da faixa da onda.
    for (const p of it.sem) {
      const rho = kk * p.r;
      const x = sx + Math.cos(p.a) * rx * rho;
      const y = sy + Math.sin(p.a) * ry * rho - p.h * k;
      ctx.globalAlpha = degrau(1 - k * 1.05);
      ctx.fillStyle = p.w === 6 ? it.cor : it.osso;
      ctx.fillRect(Math.round(x), Math.round(y), p.w, p.w);
      ctx.fillStyle = '#2a2430';
      ctx.fillRect(Math.round(x), Math.round(y) + p.w, p.w, 1);
    }
    ctx.restore();
  }

  /**
   * NUVEM DE TRANSFORMAÇÃO (vaso de planta, ovelha): nasce numa elipse achatada sob os pés, sobe em bolas de fumaça cinza e branca com
   * contorno escuro, solta folhinhas verdes que giram e caem, e se desfaz em trama. Por código: o sprite branco chapado pairava no
   * peito e escondia as pernas.
   */
  poof(tile, { dur = 1.3 } = {}) {
    const bolas = [];
    for (let i = 0; i < 7; i += 1) bolas.push({ dx: (Math.random() - 0.5) * 26, atraso: Math.random() * 0.2, r: 6 + Math.random() * 6, sobe: 10 + Math.random() * 20 });
    const folhas = [];
    for (let i = 0; i < 6; i += 1) folhas.push({ dx: (Math.random() - 0.5) * 36, h: 24 + Math.random() * 20, fase: Math.random() * 6 });
    return this.add({ kind: 'poof', tile: { ...tile }, dur, bolas, folhas });
  }

  desenharPoof(ctx, board, it, k) {
    const { sx, sy } = board.centerF(it.tile.x, it.tile.y);
    ctx.save();
    // A base: elipse de fumaça achatada no chão, que se abre e se desfaz.
    ctx.fillStyle = '#aab6c6';
    ctx.globalAlpha = 1;
    if (k < 0.65) this.elipseDura(ctx, sx, sy, 10 + 20 * EASE_OUT(Math.min(1, k * 2)), 4 + 8 * EASE_OUT(Math.min(1, k * 2)));
    else this.elipseTramada(ctx, sx, sy, 30, 12);
    // As bolas de fumaça: contorno escuro, corpo claro, sobem e encolhem no fim.
    for (const b of it.bolas) {
      const t = Math.min(1, Math.max(0, (k - b.atraso) / 0.8));
      if (t <= 0) continue;
      const r = Math.round(b.r * (t < 0.5 ? 0.5 + t : 1 - (t - 0.5) * 0.8));
      const x = Math.round(sx + b.dx);
      const y = Math.round(sy - 4 - b.sobe * EASE_OUT(t));
      ctx.globalAlpha = 1;
      if (t > 0.88 && Math.floor(t * 20) % 2 === 0) continue;
      ctx.fillStyle = '#2a2430';
      this.elipseDura(ctx, x, y, r + 1, r + 1);
      ctx.fillStyle = '#e8eef5';
      this.elipseDura(ctx, x, y - 1, r, r);
      ctx.fillStyle = '#aab6c6';
      this.elipseDura(ctx, x + 1, y + Math.round(r / 2), Math.max(1, r - 2), Math.max(1, Math.round(r / 2)));
    }
    // Folhas verdes que sobem e caem girando.
    ctx.fillStyle = '#6fc07a';
    for (const f of it.folhas) {
      const t = Math.min(1, k / 0.9);
      const alto = Math.sin(t * Math.PI) * f.h;
      const x = Math.round(sx + f.dx + Math.sin(f.fase + t * 7) * 5);
      const y = Math.round(sy - 6 - alto);
      ctx.globalAlpha = 1;
      if (t > 0.9) continue;
      ctx.fillRect(x, y, 4, 3);
      ctx.fillStyle = '#2a2430';
      ctx.fillRect(x, y + 3, 4, 1);
      ctx.fillStyle = '#6fc07a';
    }
    ctx.restore();
  }

  /**
   * ESTRELAS EM ÓRBITA sobre a cabeça (confusão): três faíscas de pixels com contorno escuro que giram numa elipse acima da figura.
   * Por código e sem sprite, porque o anel em sprite empilhava um por criatura e escondia o grupo inteiro.
   */
  orbita(tile, { altura = 68, dur = 1.4, cor = '#e8c35a', miolo = '#f4f0e4', n = 3 } = {}) {
    return this.add({ kind: 'orbita', tile: { ...tile }, altura, dur, cor, miolo, n, fase: Math.random() * Math.PI * 2 });
  }

  desenharOrbita(ctx, board, it, k) {
    const { sx, sy } = board.centerF(it.tile.x, it.tile.y);
    const aparece = Math.min(1, k / 0.15);
    const some = Math.min(1, (1 - k) / 0.2);
    ctx.save();
    ctx.globalAlpha = 1;
    if (Math.min(aparece, some) < 0.5) { ctx.restore(); return; }
    // A sombra no chão: uma elipse achatada de trama, para a órbita não flutuar solta.
    ctx.fillStyle = '#2a2430';
    this.elipseTramada(ctx, sx, sy, 16, 6);
    // ESTRELAS de losango (não cruzes: a cruz dourada já é a cura do jogo): 9 px, contorno escuro, centro claro.
    const LOSANGO = [[0, 0, 1], [-1, 1, 3], [-2, 2, 5], [-3, 3, 7], [-4, 4, 9]];
    for (let i = 0; i < it.n; i += 1) {
      const a = it.fase + k * Math.PI * 5 + (i * Math.PI * 2) / it.n;
      const x = Math.round(sx + Math.cos(a) * 20);
      const y = Math.round(sy - it.altura + Math.sin(a) * 7);
      const desenha = (raio, cor) => {
        ctx.fillStyle = cor;
        for (let r = -raio; r <= raio; r += 1) {
          const meia = raio - Math.abs(r);
          ctx.fillRect(x - meia, y + r, 2 * meia + 1, 1);
        }
      };
      void LOSANGO;
      desenha(6, '#2a2430');
      desenha(5, it.cor);
      desenha(2, it.miolo);
    }
    ctx.restore();
  }

  /**
   * ALMAS que sobem dos atingidos pela onda necrótica: fantasminhas de pixels (corpo oval, dois olhos, cauda em ponta) que sobem uns
   * 50 px balançando de lado e somem. Uma a quatro por alvo, em tempos escalonados.
   */
  almas(tile, { altura = 20, dur = 1.5, n = 3 } = {}) {
    const almas = [];
    for (let i = 0; i < n; i += 1) almas.push({ atraso: i * 0.13 + Math.random() * 0.05, dx: (Math.random() - 0.5) * 22, ond: Math.random() * Math.PI * 2 });
    return this.add({ kind: 'almas', tile: { ...tile }, altura, dur, almas });
  }

  desenharAlmas(ctx, board, it, k) {
    const { sx, sy } = board.centerF(it.tile.x, it.tile.y);
    // Corpo 7x9: '#' corpo claro, 'o' contorno violeta, 'e' olho.
    const FORMA = [
      '..ooo..',
      '.o###o.',
      'o#####o',
      'o#e#e#o',
      'o#####o',
      'o#####o',
      'o#####o',
      'o#o#o#o',
      '.o.o.o.',
    ];
    const COR = { '#': '#e8eef5', o: '#a579d8', e: '#2a2430' };
    ctx.save();
    for (const a of it.almas) {
      const t = (k * it.dur - a.atraso) / (it.dur - 0.5);
      if (t < 0 || t > 1) continue;
      const x = Math.round(sx + a.dx + Math.sin(a.ond + t * 6) * 5 - 7);
      const y = Math.round(sy - it.altura - t * 54 - 9);
      ctx.globalAlpha = 1;
      // Sem translúcido: no fim a alma pisca (aparece e some) antes de ir embora.
      if (t > 0.78 && Math.floor(t * 24) % 2 === 0) continue;
      for (let j = 0; j < FORMA.length; j += 1) {
        for (let i = 0; i < FORMA[j].length; i += 1) {
          const c = COR[FORMA[j][i]];
          if (!c) continue;
          ctx.fillStyle = c;
          ctx.fillRect(x + i * 2, y + j * 2, 2, 2);
        }
      }
    }
    ctx.restore();
  }

  /**
   * ESTOURO DE MAGIA SELVAGEM: um clarão dourado que vira uma chuva radial de faíscas, estrelas e fitas em violeta, dourado, azul e
   * branco. Por código, no tom dourado e violeta dos outros efeitos de surto, e baixo (nos pés), para não apagar quem está lá.
   */
  caos(tile, { dur = 1.0, n = 30 } = {}) {
    const cores = ['#e8c35a', '#a579d8', '#e8eef5', '#6ea8e8', '#e8c35a', '#a579d8'];
    const faiscas = [];
    for (let i = 0; i < n; i += 1) {
      faiscas.push({ a: (i / n) * Math.PI * 2 + Math.random() * 0.4, v: 0.5 + Math.random() * 0.5, h: 50 + Math.random() * 34, w: Math.random() < 0.4 ? 6 : 5, cor: cores[i % cores.length], estrela: Math.random() < 0.3 });
    }
    return this.add({ kind: 'caos', tile: { ...tile }, dur, faiscas });
  }

  desenharCaos(ctx, board, it, k) {
    const { sx, sy } = board.centerF(it.tile.x, it.tile.y);
    ctx.save();
    // O estouro no chão: um anel dourado que se abre com um segundo anel violeta atrás, e a poça de luz se desfazendo em trama.
    if (k < 0.55) {
      const e0 = EASE_OUT(k / 0.55);
      ctx.fillStyle = '#e8c35a';
      ctx.globalAlpha = 1;
      this.elipseTramada(ctx, sx, sy, 8 + 34 * e0, 4 + 17 * e0, k < 0.3 ? 1 : 2);
      this.anelDuro(ctx, sx, sy, 10 + 40 * e0, 5 + 20 * e0, 4);
      ctx.fillStyle = '#a579d8';
      this.anelDuro(ctx, sx, sy, 6 + 28 * e0, 3 + 14 * e0, 3);
    }
    // A chuva de faíscas, saindo em elipse isométrica, com um arco para cima.
    const e = EASE_OUT(Math.min(1, k * 1.15));
    for (const p of it.faiscas) {
      const x = sx + Math.cos(p.a) * 52 * p.v * e;
      const y = sy + Math.sin(p.a) * 26 * p.v * e - Math.sin(Math.min(1, k * 1.4) * Math.PI) * p.h;
      ctx.globalAlpha = 1;
      if (k > 0.8 && Math.floor((k + p.a) * 18) % 2 === 0) continue;
      ctx.fillStyle = p.cor;
      if (p.estrela) {
        ctx.fillRect(Math.round(x) - 1, Math.round(y) - 4, 2, 8);
        ctx.fillRect(Math.round(x) - 4, Math.round(y) - 1, 8, 2);
      } else {
        ctx.fillRect(Math.round(x), Math.round(y), p.w, p.w);
      }
    }
    ctx.restore();
  }

  /** Um efeito de quadros (sprite animado), no chão ou por cima das figuras. */
  desenharQuadros(ctx, board, it, k) {
    const { sx, sy } = board.centerF(it.tile.x, it.tile.y);
    const at = (tile) => board.centerF(tile.x, tile.y);
    const t = k * it.dur;
    const cv = quadro(it.nome, Math.min(it.n - 1, Math.floor((t / it.anim) * it.n)));
    if (!cv) return;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (t > it.anim) ctx.globalAlpha = Math.max(0, 1 - (t - it.anim) / (it.dur - it.anim));
    if (it.entrar && t < it.entrar) ctx.globalAlpha = t / it.entrar;
    if (it.de && at(it.de).sx > sx) { ctx.translate(2 * Math.round(sx), 0); ctx.scale(-1, 1); }
    if (it.cresce) {
      const s = it.cresce[0] + (it.cresce[1] - it.cresce[0]) * Math.min(1, k);
      const w = Math.round(cv.width * s);
      const h = Math.round(cv.height * s);
      ctx.drawImage(cv, Math.round(sx - w / 2), Math.round(sy - h / 2), w, h);
    } else {
      ctx.drawImage(cv, Math.round(sx - cv.width / 2), Math.round(sy - cv.height / 2));
    }
    ctx.restore();
  }

  drawOver(ctx, board) {
    // O tabuleiro de cima não tem o laço de profundidade que chamava as camadas: os domos entram aqui, por cima das fichas.
    for (const o of this.domosAtivos(board)) this.desenharDomo(ctx, board, o, 'tras');
    for (const it of this.items) {
      if (it.kind === 'arte' && !it.noChao) this.desenharArte(ctx, board, it, Math.min(1, it.t / it.dur));
      if (it.kind === 'voo') this.desenharVoo(ctx, board, it);
      if (it.kind === 'feixe') this.desenharFeixe(ctx, board, it, Math.min(1, it.t / it.dur));
      if (it.kind === 'cone') this.desenharCone(ctx, board, it, Math.min(1, it.t / it.dur));
    }
    for (const it of this.items) {
      const k = Math.min(1, it.t / it.dur);
      const at = (tile) => board.centerF(tile.x, tile.y);

      switch (it.kind) {
        case 'projectile': {
          const e = EASE_IN_OUT(k);
          const p = board.centerF(
            it.from.x + (it.to.x - it.from.x) * e,
            it.from.y + (it.to.y - it.from.y) * e,
          );
          const lift = Math.sin(e * Math.PI) * 40 * it.arc;
          let y = p.sy - lift;
          const ang = Math.atan2(it.to.y - it.from.y, it.to.x - it.from.x);

          if (it.trail && it.past) {
            ctx.save();
            for (const q of it.past) {
              const qp = board.centerF(q.x, q.y);
              ctx.globalAlpha = Math.max(0, 1 - q.age / 0.22) * 0.5;
              ctx.fillStyle = it.color;
              const s = 5 * (1 - q.age / 0.22);
              ctx.fillRect(qp.sx - s / 2, qp.sy - q.lift - s / 2, s, s);
            }
            ctx.restore();
          }

          // Teia: o fio de seda fica preso a quem atirou e se estende pelo
          // arco até a bola de teia, que voa na ponta.
          if (it.style === 'teia' || it.fio) {
            ctx.save();
            ctx.strokeStyle = it.color;
            ctx.globalAlpha = 0.85;
            ctx.lineWidth = 1;
            // Reta na TELA entre as duas pontas: amostrar `centerF` no meio do
            // caminho pega a altura de cada casa e o fio sai em degraus.
            const a0 = board.centerF(it.from.x, it.from.y);
            const a1 = board.centerF(it.to.x, it.to.y);
            ctx.beginPath();
            for (let i = 0; i <= 12; i++) {
              const ee = (e * i) / 12;
              const qx = a0.sx + (a1.sx - a0.sx) * ee;
              const qy = a0.sy + (a1.sy - a0.sy) * ee - CHEST - Math.sin(ee * Math.PI) * 40 * it.arc;
              if (i === 0) ctx.moveTo(Math.round(qx) + 0.5, Math.round(qy) + 0.5);
              else ctx.lineTo(Math.round(qx) + 0.5, Math.round(qy) + 0.5);
            }
            ctx.stroke();
            p.sx = a0.sx + (a1.sx - a0.sx) * e;
            p.sy = a0.sy + (a1.sy - a0.sy) * e;
            y = p.sy - CHEST - lift;
            ctx.restore();
          }

          ctx.save();
          ctx.translate(p.sx, y);
          if (it.spin) ctx.rotate(it.t * 18);
          if (it.style === 'sprite' && temEfeito(it.sprite)) {
            // O projétil desenhado aponta para a direita: gira para o ângulo
            // NA TELA, inclinando com o arco de subida e descida.
            const naTela = (ee) => {
              const q = board.centerF(it.from.x + (it.to.x - it.from.x) * ee, it.from.y + (it.to.y - it.from.y) * ee);
              return { x: q.sx, y: q.sy - CHEST - Math.sin(ee * Math.PI) * 40 * it.arc };
            };
            const p1 = naTela(Math.min(e, 0.98));
            const p2 = naTela(Math.min(e, 0.98) + 0.02);
            const angTela = Math.atan2(p2.y - p1.y, p2.x - p1.x);
            const n = temEfeito(it.sprite);
            const cv = quadro(it.sprite, Math.floor(it.t * (it.fps ?? 14)) % n);
            ctx.rotate(angTela);
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(cv, -Math.round(cv.width * 0.75), -Math.round(cv.height / 2));
          } else if (it.style === 'arrow') {
            ctx.rotate(ang * 0.5);
            ctx.fillStyle = it.color;
            ctx.fillRect(-9, -1.5, 18, 3);
            ctx.beginPath();
            ctx.moveTo(9, 0); ctx.lineTo(3, -4); ctx.lineTo(3, 4);
            ctx.closePath(); ctx.fill();
          } else if (it.style === 'teia') {
            // A bola de seda: um tufo de pixels que gira, sem brilho de magia.
            ctx.rotate(it.t * 9);
            ctx.fillStyle = it.color;
            ctx.fillRect(-3, -3, 6, 6);
            ctx.fillRect(-6, -1, 12, 2);
            ctx.fillRect(-1, -6, 2, 12);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-1, -1, 2, 2);
          } else if (it.style === 'orb') {
            const grd = ctx.createRadialGradient(0, 0, 1, 0, 0, 11);
            grd.addColorStop(0, '#ffffff');
            grd.addColorStop(0.4, it.color);
            grd.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grd;
            ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill();
          } else if (it.style === 'shard') {
            ctx.rotate(ang * 0.5);
            ctx.fillStyle = it.color;
            ctx.beginPath();
            ctx.moveTo(10, 0); ctx.lineTo(-4, -5); ctx.lineTo(-7, 0); ctx.lineTo(-4, 5);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-2, -1, 7, 2);
          } else if (it.style === 'javelin') {
            ctx.rotate(ang * 0.5);
            ctx.fillStyle = '#6a4a30';
            ctx.fillRect(-12, -1, 22, 2);
            ctx.fillStyle = it.color;
            ctx.beginPath();
            ctx.moveTo(12, 0); ctx.lineTo(4, -3); ctx.lineTo(4, 3);
            ctx.closePath(); ctx.fill();
          } else { // bolt
            ctx.strokeStyle = it.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-10, 0); ctx.lineTo(-3, -4); ctx.lineTo(2, 3); ctx.lineTo(10, -1);
            ctx.stroke();
          }
          ctx.restore();
          break;
        }

        case 'poof': {
          this.desenharPoof(ctx, board, it, k);
          break;
        }

        case 'almas': {
          this.desenharAlmas(ctx, board, it, k);
          break;
        }

        case 'caos': {
          this.desenharCaos(ctx, board, it, k);
          break;
        }

        case 'orbita': {
          this.desenharOrbita(ctx, board, it, k);
          break;
        }

        case 'quadros': {
          if (it.chao) break;
          this.desenharQuadros(ctx, board, it, k);
          break;
        }

        case 'beam': {
          const a = at(it.from);
          const b = at(it.to);
          ctx.save();
          ctx.globalAlpha = (1 - k) * (it.pulso ? 0.55 + 0.45 * Math.sin(it.t * 18) ** 2 : 1);
          ctx.strokeStyle = it.color;
          ctx.lineWidth = it.width * (1 - k * 0.5);
          ctx.shadowColor = it.color;
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.moveTo(a.sx, a.sy - CHEST);
          const segs = it.jagged ? 6 : 1;
          for (let i = 1; i <= segs; i++) {
            const t = i / segs;
            const j = i === segs || !it.jagged ? 0 : (Math.random() - 0.5) * 12;
            ctx.lineTo(a.sx + (b.sx - a.sx) * t + j, a.sy - CHEST + (b.sy - a.sy) * t + j * 0.4);
          }
          ctx.stroke();
          ctx.restore();
          break;
        }

        case 'impact': {
          const { sx, sy } = at(it.tile);
          ctx.save();
          ctx.globalAlpha = 1 - k;
          ctx.fillStyle = it.color;
          for (const p of it.parts) {
            ctx.fillRect(sx + p.vx * it.t, sy - 26 + p.vy * it.t + 150 * it.t * it.t, p.size, p.size);
          }
          ctx.restore();
          break;
        }

        case 'shards': {
          const { sx, sy } = at(it.tile);
          ctx.save();
          ctx.globalAlpha = 1 - k;
          ctx.fillStyle = it.color;
          for (const p of it.parts) {
            const px = sx + p.vx * it.t;
            const py = sy - 26 + p.vy * it.t + 130 * it.t * it.t;
            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(p.a + it.t * p.rot);
            ctx.beginPath();
            ctx.moveTo(p.len, 0); ctx.lineTo(-p.len * 0.4, -3); ctx.lineTo(-p.len * 0.4, 3);
            ctx.closePath(); ctx.fill();
            ctx.restore();
          }
          ctx.restore();
          break;
        }

        case 'slash': {
          const { sx, sy } = at(it.tile);
          ctx.save();
          ctx.translate(sx, sy - 30);
          ctx.rotate(it.angle);
          ctx.globalAlpha = 1 - k;
          ctx.strokeStyle = it.color;
          ctx.lineWidth = it.width * (1 - k);
          ctx.beginPath();
          ctx.arc(0, 0, it.radius + k * 10, -it.sweep, it.sweep);
          ctx.stroke();
          ctx.restore();
          break;
        }

        case 'stab': {
          const { sx, sy } = at(it.tile);
          const reach = it.length * EASE_OUT(k);
          ctx.save();
          ctx.translate(sx, sy - 30);
          ctx.rotate(it.angle);
          ctx.globalAlpha = 1 - k;
          ctx.strokeStyle = it.color;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(-reach * 0.5, 0);
          ctx.lineTo(reach * 0.5, 0);
          ctx.stroke();
          ctx.restore();
          break;
        }

        case 'fangs': {
          const { sx, sy } = at(it.tile);
          const close = 1 - k;          // as presas fecham
          ctx.save();
          ctx.globalAlpha = 1 - k * 0.7;
          ctx.strokeStyle = it.color;
          ctx.lineWidth = 3;
          for (const side of [-1, 1]) {
            ctx.beginPath();
            ctx.moveTo(sx + side * (6 + close * 14), sy - 42);
            ctx.lineTo(sx + side * (3 + close * 6), sy - 22);
            ctx.stroke();
          }
          ctx.restore();
          break;
        }

        case 'claw': {
          const { sx, sy } = at(it.tile);
          ctx.save();
          ctx.translate(sx, sy - 30);
          ctx.rotate(it.angle);
          ctx.globalAlpha = 1 - k;
          ctx.strokeStyle = it.color;
          ctx.lineWidth = 2.5;
          for (let i = -1; i <= 1; i++) {
            ctx.beginPath();
            ctx.arc(i * 7, 0, 18 + k * 8, -0.7, 0.7);
            ctx.stroke();
          }
          ctx.restore();
          break;
        }

        case 'sopro': {
          // O cone abre a partir do peito de quem sopra e avança até o alvo;
          // o jogador tem de ver a FORMA antes de ver o dano.
          const a = at(it.from);
          const b = at(it.to);
          const ang = Math.atan2(b.sy - a.sy, b.sx - a.sx);
          const dist = Math.hypot(b.sx - a.sx, b.sy - a.sy) * 1.15;
          const abre = EASE_OUT(Math.min(1, k / 0.3));
          const fade = k < 0.5 ? 1 : 1 - (k - 0.5) / 0.5;
          const alc = dist * abre;
          ctx.save();
          ctx.translate(a.sx, a.sy - CHEST * 0.8);
          ctx.rotate(ang);
          ctx.globalAlpha = fade * 0.75;
          const grd = ctx.createLinearGradient(0, 0, alc, 0);
          grd.addColorStop(0, '#ffffff');
          grd.addColorStop(0.35, it.color);
          grd.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(alc, -alc * it.spread);
          ctx.lineTo(alc, alc * it.spread);
          ctx.closePath();
          ctx.fill();
          // Faíscas dentro do cone: o gradiente sozinho lê como vidro fosco.
          ctx.globalAlpha = fade;
          ctx.fillStyle = '#ffffff';
          for (const s of it.faiscas) {
            const pk = (k - s.atraso) * s.vel * 2.4;
            if (pk < 0 || pk > 1) continue;
            const d = alc * pk;
            ctx.globalAlpha = fade * (1 - pk) * 0.9;
            ctx.fillRect(d, s.off * d * it.spread, s.size, s.size);
          }
          ctx.restore();
          break;
        }

        case 'agarrao': {
          // Duas garras fecham na altura do peito e dão um tranco para dentro.
          const { sx, sy } = at(it.tile);
          const fecha = EASE_OUT(Math.min(1, k / 0.55));
          const aberto = 30 * (1 - fecha) + 7;
          const puxa = k > 0.55 ? Math.sin(((k - 0.55) / 0.45) * Math.PI) * 4 : 0;
          ctx.save();
          ctx.globalAlpha = 1 - Math.max(0, (k - 0.6) / 0.4);
          ctx.strokeStyle = it.color;
          ctx.lineWidth = 3.5;
          for (const lado of [-1, 1]) {
            const x = sx + lado * (aberto - puxa);
            ctx.beginPath();
            ctx.moveTo(x + lado * 9, sy - 44);
            ctx.lineTo(x, sy - 30);
            ctx.lineTo(x + lado * 9, sy - 16);
            ctx.stroke();
          }
          ctx.restore();
          break;
        }

        case 'ossos-pilha': {
          // Os ossos sobem pouco, caem e param no chão; o resto do tempo é só
          // o monte esmaecendo. Parar no chão é o que separa morte de explosão.
          const { sx, sy } = at(it.tile);
          const g = 260;
          ctx.save();
          ctx.fillStyle = it.color;
          ctx.globalAlpha = k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4;
          for (const p of it.parts) {
            const tq = it.t;
            const x = sx + p.vx * tq;
            let y = sy - p.y0 + p.vy * tq + g * tq * tq;
            let rot = p.ang + tq * p.rot;
            if (y > sy) { y = sy; rot = p.ang + p.rot; }   // assentou
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rot);
            ctx.fillRect(-p.len / 2, -1.5, p.len, 3);
            ctx.fillRect(-p.len / 2 - 1, -2.5, 2, 5);      // epífise
            ctx.fillRect(p.len / 2 - 1, -2.5, 2, 5);
            ctx.restore();
          }
          ctx.restore();
          break;
        }

        case 'clarao': {
          // Clarão branco sobre a figura: marca QUEM, quando nada se move.
          const { sx, sy } = at(it.tile);
          const pulso = Math.abs(Math.sin(k * Math.PI * 2)) * (1 - k * 0.4);
          ctx.save();
          ctx.globalAlpha = pulso * 0.55;
          const grd = ctx.createRadialGradient(sx, sy - 26, 2, sx, sy - 26, 30);
          grd.addColorStop(0, it.color);
          grd.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.ellipse(sx, sy - 26, 30, 34, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          break;
        }

        case 'grudar': {
          // Gotas subindo da vítima para o bicho: é o que mostra que o dano
          // continua enquanto ele está lá, e não um golpe que já passou.
          const { sx, sy } = at(it.tile);
          ctx.save();
          ctx.fillStyle = it.color;
          // Só enquanto está pousado: na aproximação e na saída não há sucção.
          for (let i = 0; k > 0.2 && k < 0.9 && i < 4; i++) {
            const pk = (it.t * 1.6 + i * 0.25) % 1;
            ctx.globalAlpha = Math.sin(pk * Math.PI) * 0.9;
            ctx.fillRect(sx - 3 + i * 2, sy - 20 - pk * 16, 2, 3);
          }
          ctx.restore();
          break;
        }

        case 'pillar': {
          const { sx, sy } = at(it.tile);
          // Desce rápido, depois dissolve.
          const drop = Math.min(1, k / 0.35);
          const fade = k < 0.35 ? 1 : 1 - (k - 0.35) / 0.65;
          const top = sy - it.height;
          const bottom = top + it.height * drop;
          const w = it.width * (0.6 + 0.4 * fade);
          ctx.save();
          ctx.globalAlpha = fade * (it.alpha ?? 1);
          const grd = ctx.createLinearGradient(sx, top, sx, bottom);
          grd.addColorStop(0, 'rgba(255,255,255,0)');
          grd.addColorStop(0.3, it.color);
          grd.addColorStop(1, '#ffffff');
          ctx.fillStyle = grd;
          ctx.fillRect(sx - w / 2, top, w, bottom - top);
          if (drop >= 1) {
            ctx.globalAlpha = fade * 0.8;
            ctx.fillStyle = it.color;
            ctx.beginPath();
            ctx.ellipse(sx, sy, w * 1.6, w * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
          break;
        }

        case 'flames': {
          const { sx, sy } = at(it.tile);
          const fade = 1 - k;
          ctx.save();
          ctx.globalAlpha = fade;
          for (const s of it.seeds) {
            const ph = it.t * 9 + s.phase;
            const h = (12 + Math.sin(ph) * 6) * it.scale * (0.5 + fade * 0.5);
            const x = sx + s.off + Math.sin(ph * 0.7) * 3;
            const y = sy - 6;
            ctx.fillStyle = it.color;
            ctx.beginPath();
            ctx.moveTo(x, y - h);
            ctx.lineTo(x + 4 * it.scale, y);
            ctx.lineTo(x - 4 * it.scale, y);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#ffe9a8';
            ctx.beginPath();
            ctx.moveTo(x, y - h * 0.55);
            ctx.lineTo(x + 2 * it.scale, y);
            ctx.lineTo(x - 2 * it.scale, y);
            ctx.closePath();
            ctx.fill();
          }
          ctx.restore();
          break;
        }

        case 'motes': {
          const { sx, sy } = at(it.tile);
          ctx.save();
          ctx.fillStyle = it.color;
          for (const p of it.parts) {
            const pk = (it.t - p.delay) / (it.dur - p.delay);
            if (pk < 0 || pk > 1) continue;
            ctx.globalAlpha = Math.sin(pk * Math.PI);
            const x = sx + p.x + Math.sin(pk * 6 + p.wob) * 4;
            const y = sy - 6 - it.rise * pk;
            ctx.fillRect(x, y, p.size, p.size);
          }
          ctx.restore();
          break;
        }

        case 'halo': {
          const { sx, sy } = at(it.tile);
          const y = sy - 56;
          ctx.save();
          ctx.globalAlpha = Math.sin(Math.min(1, k * 1.3) * Math.PI) * 0.9;
          ctx.strokeStyle = it.color;
          ctx.lineWidth = 3;
          ctx.shadowColor = it.color;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.ellipse(sx, y, it.radius, it.radius * 0.38, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          break;
        }

        case 'glyph': {
          const { sx, sy } = at(it.tile);
          ctx.save();
          ctx.globalAlpha = Math.sin(Math.min(1, k * 1.2) * Math.PI);
          ctx.fillStyle = it.color;
          ctx.font = `700 ${it.size}px Georgia, serif`;
          ctx.textAlign = 'center';
          ctx.fillText(it.text, sx, sy - 40 - it.rise * k);
          ctx.restore();
          break;
        }

        default:
          break;
      }
    }
  }
}
