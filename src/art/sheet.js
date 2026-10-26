// Monta a folha de sprites em runtime e põe o contorno automático.
// Cache por look: a folha é construída uma vez e reusada por todos os
// combatentes do mesmo tipo, entre encontros.

import { paint, DIRECTIONS } from './draw.js';
import { resolveLook } from './looks.js';
import { folhaImportada, carregarFolhas } from './folhas/index.js';
import { retratoPintado } from './retratos/index.js';

const cache = new Map();

// Carregar cedo, e uma vez. Quando um PNG chega, saem do cache TODAS as chaves
// da figura -- o look base e cada combinacao de equipamento dela --, porque a
// folha nova pode ser a resposta certa para qualquer uma. As caixas do
// retrato tambem: foram medidas na folha velha.
const daFigura = (key, base) => {
  const k = key.split('~')[0];            // o estado (`~furia`) e da mesma figura
  return k === base || k.startsWith(`${base}@`);
};
carregarFolhas((base) => {
  for (const key of [...cache.keys()]) if (daFigura(key, base)) cache.delete(key);
  for (const key of [...caixas.keys()]) if (daFigura(key, base)) caixas.delete(key);
});

export const CELL_W = 52;
export const CELL_H = 80;
export const OUTLINE = [13, 11, 17];

/**
 * PIXELS FÍSICOS POR PIXEL LÓGICO.
 *
 * A célula continua sendo 52x80 para todo mundo que pensa em posição — a
 * câmera, a ficha, o retrato, as sete famílias de plano corporal. O que muda é
 * quantos pixels de verdade cada um desses 52x80 recebe na folha.
 *
 * O tabuleiro desenha o sprite 1:1 e deixa o zoom do navegador ampliar. Com
 * S = 1 isso significava que uma criatura inteira tinha 52x80 pixels de
 * informação e a tela esticava cada um deles — daí o ar de "quadradão". Com
 * S = 3 a mesma figura chega com nove vezes mais pixels no mesmo tamanho de
 * tela, e o desenho pode carregar o que não cabia: o espigão da ombreira, o
 * osso no cabelo, a escama do saiote, o pelo da perneira.
 *
 * A escala não vira desenho sozinha. Ela abre espaço; quem preenche o espaço é
 * o pintor. Uma figura escalada sem detalhe novo é a mesma figura maior.
 */
export const S = 3;
export const CELL_PW = CELL_W * S;
export const CELL_PH = CELL_H * S;

// AS POSES NOVAS NÃO INVENTAM UM `kind` NOVO.
//
// `pose.kind` é lido em vinte lugares entre `draw.js` e os sete arquivos de
// plano. Um `kind: 'dead'` obrigaria cada um deles a ganhar um ramo, e o que
// esquecesse de ganhar desenharia... nada — porque todo pintor termina num
// `else` que assume "em pé". Setenta figuras com um buraco dependendo do
// estado é o tipo de defeito que só aparece no encontro em que fez falta.
//
// Então cada pose nova chega como um `kind` QUE JÁ EXISTE, mais uma bandeira
// própria: andar é um `idle` com `andando`, dormir e morrer são `down` com
// `dormindo` e `morto`. Pintor que ignora a bandeira continua certo — desenha
// a pose vizinha, que é parecida. Pintor que a lê melhora. A migração fica
// opcional por figura em vez de obrigatória por arquivo.
export const ANIMS = [
  { name: 'idle', frames: 2, hold: [40, 40], pose: (i) => ({ kind: 'idle', frame: i }) },
  // Quatro quadros: com dois, a perna vai e volta e lê como tremor. O ciclo
  // é contato-passagem-contato-passagem, que é o mínimo que lê como passo.
  { name: 'walk', frames: 4, hold: [9, 9, 9, 9], pose: (i) => ({ kind: 'idle', frame: i % 2, andando: i }) },
  { name: 'attack', frames: 2, hold: [8, 14], pose: (i) => ({ kind: 'attack', frame: i }) },
  { name: 'hurt', frames: 1, hold: [18], pose: () => ({ kind: 'hurt', frame: 0 }) },
  { name: 'down', frames: 1, hold: [60], pose: () => ({ kind: 'down', frame: 0 }) },
  { name: 'sleep', frames: 2, hold: [50, 50], pose: (i) => ({ kind: 'down', frame: 0, dormindo: i }) },
  { name: 'dead', frames: 1, hold: [60], pose: () => ({ kind: 'down', frame: 0, morto: true }) },
];


export function getSheet(lookKey) {
  let sheet = cache.get(lookKey);
  if (!sheet) {
    // A folha importada vence a pintada, quando existe e ja carregou. Fora
    // isso nada muda: quem chama recebe o mesmo formato dos dois jeitos.
    sheet = folhaImportada(lookKey) ?? buildSheet(lookKey);
    cache.set(lookKey, sheet);
  }
  return sheet;
}

export function buildSheet(lookKey) {
  // a chave com estado (`~furia`) ou de folha (`@...`) sem look proprio: o
  // pintor desenha a figura base (`resolveLook`)
  const look = resolveLook(lookKey);
  const maxFrames = ANIMS.reduce((m, a) => Math.max(m, a.frames), 0);
  const width = CELL_PW * maxFrames;
  const height = CELL_PH * DIRECTIONS.length * ANIMS.length;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  const anims = {};
  ANIMS.forEach((anim, block) => {
    const blockY = block * DIRECTIONS.length * CELL_PH;
    anims[anim.name] = {
      y: blockY, fw: CELL_PW, fh: CELL_PH, frames: anim.frames,
      hold: anim.hold, total: anim.hold.reduce((a, b) => a + b, 0),
    };
    DIRECTIONS.forEach((dir, row) => {
      for (let f = 0; f < anim.frames; f++) {
        // O canto da célula vai em pixels FÍSICOS; o tamanho dela, em lógicos.
        // É essa assimetria que deixa o pintor inteiro intocado.
        paint(ctx, f * CELL_PW, blockY + row * CELL_PH, CELL_W, CELL_H, look, dir, anim.pose(f), S);
      }
    });
  });

  outline(ctx, width, height, S);
  // A folha DECLARA o seu eixo de direcoes. Quem desenha pergunta a ela em
  // vez de assumir tres, e e isso que permite uma folha importada de oito
  // direcoes conviver com as desenhadas em codigo.
  return { key: lookKey, image: canvas, w: width, h: height, anims, dirs: DIRECTIONS };
}

function outline(ctx, width, height, s = 1) {
  // O CONTORNO TEM UM PIXEL LÓGICO, NÃO UM FÍSICO.
  //
  // Rodando no grid físico, a 3x a linha preta sairia três vezes mais fina em
  // relação à figura e a 55 px no tabuleiro sumiria — justo a linha que existe
  // para a figura não se dissolver no piso. Tudo que o kit desenha sai em
  // blocos de s x s alinhados, então dá para varrer o grid lógico e provar
  // cada bloco pelo seu canto.
  const img = ctx.getImageData(0, 0, width, height);
  const src = new Uint8ClampedArray(img.data);
  const dst = img.data;
  const lw = Math.floor(width / s);
  const lh = Math.floor(height / s);
  const opaco = (lx, ly) => lx >= 0 && ly >= 0 && lx < lw && ly < lh
    && src[(ly * s * width + lx * s) * 4 + 3] > 0;
  for (let ly = 0; ly < lh; ly++) {
    for (let lx = 0; lx < lw; lx++) {
      if (opaco(lx, ly)) continue;
      if (!(opaco(lx - 1, ly) || opaco(lx + 1, ly) || opaco(lx, ly - 1) || opaco(lx, ly + 1))) continue;
      for (let dy = 0; dy < s; dy++) {
        for (let dx = 0; dx < s; dx++) {
          const i = ((ly * s + dy) * width + lx * s + dx) * 4;
          dst[i] = OUTLINE[0]; dst[i + 1] = OUTLINE[1]; dst[i + 2] = OUTLINE[2]; dst[i + 3] = 255;
        }
      }
    }
  }
  ctx.putImageData(img, 0, 0);
}

/** Retrato estático para as fichas da UI. */
const caixas = new Map();

/** Onde a figura começa e termina dentro da célula, no quadro parado. */
function caixaDo(lookKey) {
  const pronta = caixas.get(lookKey);
  if (pronta) return pronta;
  const sheet = getSheet(lookKey);
  // A célula é a DA FOLHA: a pintada tem 156x240, a importada do PixelLab
  // 288x288. Medir a importada pela célula pintada cortava a figura.
  const { fw, fh } = sheet.anims.idle;
  const d = pixelsDaFolha(sheet, sheet.anims.idle, fw, fh);
  let x0 = fw; let y0 = fh; let x1 = -1; let y1 = -1;
  for (let y = 0; y < fh; y++) {
    for (let x = 0; x < fw; x++) {
      if (d[(y * fw + x) * 4 + 3] === 0) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  const caixa = x1 < 0
    ? { x0: 0, y0: 0, x1: fw - 1, y1: fh - 1, cx: fw / 2 }
    : { x0, y0, x1, y1, cx: (x0 + x1) / 2 };
  caixas.set(lookKey, caixa);
  return caixa;
}

/**
 * Os pixels de uma faixa da folha. A pintada é um canvas e responde direto; a
 * importada é um `Image`, que não tem `getContext` -- passa por um canvas de
 * rascunho do tamanho da faixa.
 */
function pixelsDaFolha(sheet, anim, w, h) {
  const { y } = anim;
  const x = anim.x ?? 0;
  const image = imagemDa(sheet, anim);
  if (image.getContext) {
    return image.getContext('2d', { willReadFrequently: true }).getImageData(x, y, w, h).data;
  }
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(image, x, y, w, h, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h).data;
}

/**
 * A imagem de onde sai esta animacao. Numa FOLHA PARCIAL (a garra e o voo do
 * dragao) cada animacao pode morar num PNG diferente: a folha so traz o que
 * muda, e o resto vem da base (`folhas/index.js`, `juntarComABase`).
 *
 * E na folha ENXUGADA (`enxugar_folha` no importador) cada animacao tem a sua
 * celula e a sua coluna de partida (`x`): elas vao lado a lado na folha.
 */
function imagemDa(sheet, anim) {
  return anim.image ?? sheet.image;
}

/**
 * Retrato quadrado, mirando na CABEÇA.
 *
 * Antes isto devolvia a célula inteira de 52x80 e o corte ficava a cargo de um
 * `margin-top` fixo no CSS. Não funciona: a célula tem o chão na base, e a
 * cabeça de um goblin de 41 px fica trinta pixels abaixo da de um bugbear de
 * 73 px. Com um corte só, metade do elenco aparecia decapitado.
 *
 * Aqui a caixa real da figura é medida do alfa e a janela desce a partir do
 * alto dela. Sem reescalar: o pixel continua pixel, e uma criatura pequena
 * aparecer menor dentro do quadro é informação, não defeito.
 */
export function makePortrait(lookKey, lado = 40) {
  const sheet = getSheet(lookKey);
  const b = caixaDo(lookKey);
  // `lado` é LÓGICO: é o tamanho que a HUD quer na tela. A janela recortada e
  // o canvas são físicos, e o CSS devolve o canvas ao tamanho pedido — assim a
  // ficha ganha a resolução sem que nenhum layout se mexa.
  const p = lado * S;
  const { fw, fh } = sheet.anims.idle;
  const w = Math.min(p, fw);
  const h = Math.min(p, fh);
  const sx = Math.max(0, Math.min(Math.round(b.cx - w / 2), fw - w));
  const sy = Math.max(0, Math.min(b.y0 - S, fh - h));

  const canvas = document.createElement('canvas');
  canvas.width = p;
  canvas.height = p;
  canvas.style.width = `${lado}px`;
  canvas.style.height = `${lado}px`;
  canvas.style.imageRendering = 'pixelated';
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    imagemDa(sheet, sheet.anims.idle),
    (sheet.anims.idle.x ?? 0) + sx, sheet.anims.idle.y + sy, w, h,
    Math.floor((p - w) / 2), Math.floor((p - h) / 2), w, h,
  );

  // Herói com retrato pintado: ele por cima do recorte, assim que carregar.
  // Pintura não é pixel art -- reduzida, pede suavização, não vizinho.
  const pintado = retratoPintado(lookKey);
  if (pintado) {
    const pintar = () => {
      canvas.style.imageRendering = 'auto';
      ctx.clearRect(0, 0, p, p);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(pintado, 0, 0, p, p);
    };
    if (pintado.complete && pintado.naturalWidth) pintar();
    else pintado.addEventListener('load', pintar, { once: true });
  }
  return canvas;
}

/**
 * A figura INTEIRA, de pé e de frente, para o boneco do inventário.
 *
 * `makePortrait` mira na cabeça e descarta o corpo; aqui é o contrário — o
 * inventário existe para mostrar o que está VESTIDO, e isso mora do pescoço
 * para baixo. Recorta pela caixa real do alfa, não pela célula de 52x80: a
 * célula tem ar de sobra dos dois lados, e um halfling centrado nela ficaria
 * do tamanho de um selo ao lado de um meio-orc.
 *
 * Consequência de propósito: duas figuras na mesma escala saem com ALTURAS
 * diferentes na tela, porque têm alturas diferentes. É informação.
 *
 * A escala é inteira porque meio pixel esticado estraga a única coisa que esta
 * arte tem a oferecer.
 */
export function makeFigure(lookKey, escala = 3) {
  const sheet = getSheet(lookKey);
  const b = caixaDo(lookKey);
  const w = b.x1 - b.x0 + 1;        // físico
  const h = b.y1 - b.y0 + 1;
  const e = Math.max(1, Math.round(escala));

  // O canvas fica na resolução NATIVA da folha e o CSS o põe no tamanho que o
  // inventário pediu. Reamostrar aqui jogaria fora justamente os pixels que a
  // folha de 3x existe para entregar.
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.style.width = `${Math.round((w / S) * e)}px`;
  canvas.style.height = `${Math.round((h / S) * e)}px`;
  canvas.style.imageRendering = 'pixelated';
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const idle = sheet.anims.idle;
  ctx.drawImage(imagemDa(sheet, idle), (idle.x ?? 0) + b.x0, idle.y + b.y0, w, h, 0, 0, w, h);
  return canvas;
}

export function frameAt(anim, t, loop = true) {
  let k = Math.floor(t * 60);
  k = loop ? ((k % anim.total) + anim.total) % anim.total : Math.min(k, anim.total - 1);
  for (let i = 0; i < anim.hold.length; i++) {
    if (k < anim.hold[i]) return i;
    k -= anim.hold[i];
  }
  return anim.hold.length - 1;
}

/**
 * Desenha um combatente no canvas do tabuleiro.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} sheet
 * @param {string} animName
 * @param {number} frame
 * @param {boolean} flip espelha horizontalmente (direção "side" ao contrário)
 * @param {number} row 0 = front, 1 = side
 */
// Um buffer só, reaproveitado: tingir acontece em vários combatentes por
// quadro, e criar um canvas por desenho custaria coletas de lixo no meio da
// animação. Ele só cresce, nunca encolhe.
let tintaCanvas = null;
function bufferDeTinta(w, h) {
  if (!tintaCanvas) tintaCanvas = document.createElement('canvas');
  if (tintaCanvas.width < w) tintaCanvas.width = w;
  if (tintaCanvas.height < h) tintaCanvas.height = h;
  return tintaCanvas;
}

/**
 * A animacao `nome` da folha, ou a vizinha que a substitui. CONJURAR so existe
 * nas folhas de quem tem o gesto de magia desenhado (o Ilvan); quem nao tem
 * conjura com o golpe, como sempre fez. O que faltar de vez cai no parado.
 */
export function animDaFolha(sheet, nome) {
  return sheet.anims[nome] ?? (nome === 'conjurar' ? sheet.anims.attack : null) ?? sheet.anims.idle;
}

const CHAO_PADRAO = 5;

export function drawSprite(ctx, sheet, animName, frame, { x, y, scale = 1, flip = false, row = 0, alpha = 1, tint = null }) {
  const anim = animDaFolha(sheet, animName);
  const sx = (anim.x ?? 0) + Math.min(frame, anim.frames - 1) * anim.fw;
  const sy = anim.y + row * anim.fh;
  // `fw/fh` são físicos; o tabuleiro raciocina em lógicos. Dividir por S é o
  // que mantém a criatura do mesmo TAMANHO na tela e só muda a densidade.
  const w = (anim.fw / S) * scale;
  // A folha importada com MARGEM tem o chao mais alto na celula (`ground`,
  // em px logicos acima da base; o padrao e 5): a figura desce o tanto que
  // ele subiu, e o pe continua no mesmo lugar do tabuleiro.
  const h = (anim.fh / S) * scale;
  // Na folha enxugada o chao e da animacao: cada uma foi aparada no seu tamanho.
  const topo = -h + ((anim.ground ?? sheet.ground ?? CHAO_PADRAO) - CHAO_PADRAO) * scale;
  const image = imagemDa(sheet, anim);

  ctx.save();
  // Multiplica o alfa de quem chamou em vez de substituí-lo: a silhueta de quem
  // está atrás de uma parede liga um alfa de 0,66 por fora, e a atribuição
  // direta o apagava (o sprite saía opaco).
  ctx.globalAlpha *= alpha;
  ctx.imageSmoothingEnabled = false;
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);
  if (tint) {
    // A TINTA PRECISA DE UM BUFFER, e isto é um conserto.
    //
    // Antes a cor era pintada direto no canvas do tabuleiro com
    // `source-atop` e um `fillRect` da célula inteira. `source-atop` compõe
    // sobre TUDO que já está desenhado ali — e o piso é desenhado antes da
    // figura. O resultado era um retângulo colorido do tamanho da célula
    // atrás da criatura. O flash branco sempre teve o defeito; ele passava
    // porque dura três quadros. A tinta vermelha da dor, que fica 220 ms,
    // deixou de passar.
    //
    // Pintando num buffer que só tem a figura, o `source-atop` encosta
    // apenas nos pixels dela, e aí o buffer vai para o tabuleiro por cima.
    const buf = bufferDeTinta(anim.fw, anim.fh);
    const b = buf.getContext('2d');
    b.clearRect(0, 0, anim.fw, anim.fh);
    b.imageSmoothingEnabled = false;
    b.drawImage(image, sx, sy, anim.fw, anim.fh, 0, 0, anim.fw, anim.fh);
    b.globalCompositeOperation = 'source-atop';
    b.globalAlpha = tint.strength;
    b.fillStyle = tint.color;
    b.fillRect(0, 0, anim.fw, anim.fh);
    b.globalCompositeOperation = 'source-over';
    b.globalAlpha = 1;
    ctx.drawImage(buf, 0, 0, anim.fw, anim.fh, -w / 2, topo, w, h);
  } else {
    ctx.drawImage(image, sx, sy, anim.fw, anim.fh, -w / 2, topo, w, h);
  }
  ctx.restore();
}
