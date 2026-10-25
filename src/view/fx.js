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
  'marca-aparencia': { raio: 26, altura: 20, glifo: null },
  'marca-fingido': { raio: 24, altura: 20, glifo: null },
};
const GLIFOS = {
  mais: ['...#...', '...#...', '...#...', '#######', '...#...', '...#...', '...#...'],
  xis: ['#.....#', '.#...#.', '..#.#..', '...#...', '..#.#..', '.#...#.', '#.....#'],
  ponto: ['.......', '..###..', '.#####.', '.#####.', '.#####.', '..###..', '.......'],
  aviso: ['...#...', '..#.#..', '..#.#..', '.#.#.#.', '.#.#.#.', '#.....#', '#######'],
  alvo: ['..###..', '.#...#.', '#..#..#', '#.###.#', '#..#..#', '.#...#.', '..###..'],
  olho: ['.......', '..###..', '.#...#.', '#..#..#', '.#...#.', '..###..', '.......'],
  balanca: ['...#...', '#######', '#..#..#', '#..#..#', '...#...', '...#...', '.#####.'],
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
export const temEfeito = (nome) => EFEITOS[nome]?.quadros.length ?? 0;
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
    color = '#ffe9b0', style = 'arrow', dur = 0.26, arc = 0.5,
    trail = false, spin = false, onDone = null, sprite = null, fps = 14,
  } = {}) {
    return this.add({ kind: 'projectile', from: { ...from }, to: { ...to }, color, style, dur, arc, trail, spin, onDone, sprite, fps });
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
  quadros(tile, nome, { fps = 14, altura = CHEST, sumir = 0, de = null, entrar = 0 } = {}) {
    const n = temEfeito(nome);
    if (!n) return this;
    const anim = n / fps;
    return this.add({ kind: 'quadros', tile: { ...tile }, nome, n, anim, dur: anim + sumir, altura, de: de && { ...de }, entrar });
  }

  /**
   * Domo de proteção (Escudo da Fé, Santuário, Proteção contra o Bem e o
   * Mal): sobe do chão, fica um instante e se apaga.
   */
  // `id`: de quem a bolha protege — ela acompanha a figura se ela andar.
  // `op`: força do véu (esfera grande = véu fraco; ver `domoCamadas`).
  domo(tile, { cor = 'ouro', dur = 1.4, raio = 36, altura = 68, id = null, op = 1 } = {}) {
    return this.add({ kind: 'domo', tile: { ...tile }, cor, dur, raio, altura, id, f: tile.f ?? 1, op });
  }

  impact(tile, { color = '#ffd27a', count = 10, spread = 46, dur = 0.42 } = {}) {
    const parts = [];
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const speed = spread * (0.4 + Math.random() * 0.8);
      parts.push({ vx: Math.cos(a) * speed, vy: Math.sin(a) * speed * 0.55 - 40, size: 2 + Math.random() * 3 });
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
      parts.push({ a, vx: Math.cos(a) * spread * (0.5 + Math.random()), vy: Math.sin(a) * spread * 0.5 - 30, len: 5 + Math.random() * 6, rot: Math.random() * 3 });
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

  drawGround(ctx, board) {
    for (const it of this.items) {
      const k = Math.min(1, it.t / it.dur);


      if (it.kind === 'ring') {
        const r = it.fecha ? it.radius * (1 - EASE_OUT(k) * 0.85) : it.radius * EASE_OUT(k);
        const { sx, sy } = board.centerF(it.tile.x, it.tile.y);
        ctx.save();
        ctx.globalAlpha = it.fecha ? Math.min(1, (1 - k) * 1.6) : 1 - k;
        ctx.strokeStyle = it.color;
        ctx.lineWidth = it.width;
        ctx.beginPath();
        ctx.ellipse(sx, sy, r, r * 0.5, 0, 0, Math.PI * 2);
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
        ctx.ellipse(sx, sy, r, r * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();
        // Brilho em cima da poça: sem ele a mancha lê como buraco.
        ctx.globalAlpha *= 0.5;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(sx - r * 0.3, sy - r * 0.12, r * 0.3, r * 0.1, 0, 0, Math.PI * 2);
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
        ctx.ellipse(0, 0, it.radius, it.radius * 0.3, 0, varre - 0.8, varre + 0.2);
        ctx.stroke();
        ctx.globalAlpha *= 0.5;
        ctx.fillStyle = '#d8c9a8';
        for (let i = 0; i < 5; i++) {
          const a = varre - 0.8 + (i / 5) * 0.9;
          ctx.fillRect(Math.cos(a) * it.radius, Math.sin(a) * it.radius * 0.3 - i, 3, 3);
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
          ctx.lineTo(sx + Math.cos(a) * len, sy + Math.sin(a) * len * 0.5);
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
   * ou a média das casas), raio pela casa mais distante (~45 px por casa) em
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
      let raio = Math.max(16, 8 * Math.round((casas * 45) / 8));
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
    if (it.fixo) {
      // Esfera de zona: sem inflar, sem lampejo, sem fade-out (a zona some e a
      // esfera some com ela); só aparece em 0,5 s na primeira vez.
      const d = it.cilindro ? cilindroCamadas(it.cor, it.raio, it.altura) : domoCamadas(it.cor, it.raio, it.altura, it.op);
      const { sx, sy } = board.centerF(o.x, o.y);
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      const surgir = Math.min(1, (board.time - it.vistoEm) / 0.5);
      // Armadilha pisca a 2 Hz: o perigo chama a atenção sem esconder a casa.
      ctx.globalAlpha = surgir * (it.pisca ? (Math.floor(board.time * 4) % 2 ? 1 : 0.5) : 1);
      ctx.drawImage(d[camada], Math.round(sx - d.ox), Math.round(sy - d.oy));
      if (camada === 'frente' && it.glifo && it.cilindro) {
        const bob = Math.round(Math.sin(board.time * 3 + o.x * 1.7 + o.y) * 2);
        desenharGlifo(ctx, it.glifo, sx, sy - it.altura - 12 + bob, DOMO_CORES[it.cor]?.borda ?? DOMO_CORES[it.cor]?.rgb ?? [255, 255, 255]);
      }
      ctx.restore();
      return;
    }
    const t = it.t;
    let e = 1;
    let extra = 0;
    let alfa = 1;
    if (t < 0.25) e = 1.06 * EASE_OUT(t / 0.25);
    else if (t < 0.35) e = 1.06 - 0.06 * ((t - 0.25) / 0.1);
    const fim = it.dur * 0.65;
    if (t > fim) {
      const k = Math.min(1, (t - fim) / (it.dur - fim));
      alfa = 1 - k;
      extra = k;
    }
    const altura = 4 * Math.round((it.altura * e + 4 * extra) / 4);
    if (altura < 8) return;
    const raio = 2 * Math.round((it.raio * (0.7 + 0.3 * e) + 3 * extra) / 2);
    const d = domoCamadas(it.cor, raio, altura, it.op ?? 1);
    const { sx, sy } = board.centerF(o.x, o.y);
    const x0 = Math.round(sx - d.ox);
    const y0 = Math.round(sy - d.oy);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = alfa;
    ctx.drawImage(d[camada], x0, y0);
    if (camada === 'tras' && t >= 0.3 && t < 0.38) ctx.drawImage(d.brilho, x0, y0);
    ctx.restore();
  }

  drawOver(ctx, board) {
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
          const y = p.sy - CHEST - lift;
          const ang = Math.atan2(it.to.y - it.from.y, it.to.x - it.from.x);

          if (it.trail && it.past) {
            ctx.save();
            for (const q of it.past) {
              const qp = board.centerF(q.x, q.y);
              ctx.globalAlpha = Math.max(0, 1 - q.age / 0.22) * 0.5;
              ctx.fillStyle = it.color;
              const s = 5 * (1 - q.age / 0.22);
              ctx.fillRect(qp.sx - s / 2, qp.sy - CHEST - q.lift - s / 2, s, s);
            }
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

        case 'quadros': {
          const { sx, sy } = at(it.tile);
          const t = k * it.dur;
          const cv = quadro(it.nome, Math.min(it.n - 1, Math.floor((t / it.anim) * it.n)));
          if (!cv) break;
          ctx.save();
          ctx.imageSmoothingEnabled = false;
          if (t > it.anim) ctx.globalAlpha = Math.max(0, 1 - (t - it.anim) / (it.dur - it.anim));
          if (it.entrar && t < it.entrar) ctx.globalAlpha = t / it.entrar;
          if (it.de && at(it.de).sx > sx) { ctx.translate(2 * Math.round(sx), 0); ctx.scale(-1, 1); }
          ctx.drawImage(cv, Math.round(sx - cv.width / 2), Math.round(sy - it.altura - cv.height / 2));
          ctx.restore();
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
