// QUATRO PROPOSTAS PARA O GOBLIN.
//
// Desenhadas com o PINTOR DO JOGO, não como maquete. A diferença importa: uma
// proposta bonita que não anima é uma promessa que alguém vai ter de pagar
// depois. Tudo aqui sai de `paint`, o mesmo que monta a folha de sprites, com
// as mesmas poses — então a que for escolhida já nasce com os vinte e um
// quadros funcionando.
//
// A escala é a da folha (S), porque é exatamente o ponto em discussão: estas
// figuras têm nove vezes mais pixels que as de antes, e o que as separa é o
// que cada uma faz com esse espaço.

import { paint } from '../art/draw.js';
import { CELL_W, CELL_H, CELL_PW, CELL_PH, S, OUTLINE } from '../art/sheet.js';
import { BESTIARIO_LOOKS } from '../art/looks/bestiario.js';

const el = (tag, attrs = {}, ...filhos) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v;
    else if (k === 'style') Object.assign(n.style, v);
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined && v !== false) n.setAttribute(k, v);
  }
  for (const f of filhos.flat()) {
    if (f === null || f === undefined || f === false) continue;
    n.append(f instanceof Node ? f : document.createTextNode(String(f)));
  }
  return n;
};

// O goblin de hoje, para a comparação ficar honesta: a proposta tem de ganhar
// de alguma coisa, e o que ela tem de ganhar é do que está no jogo agora.
const ATUAL = BESTIARIO_LOOKS.goblin;

export const PROPOSTAS = [
  {
    id: 1,
    nome: 'Fiel à referência',
    nota: 'Pele mostarda, juba preta com osso e chifre, uma ombreira cravada, '
      + 'saiote de tiras, pé descalço. É a leitura mais direta da imagem.',
    look: {
      species: 'goblin', build: 'magro',
      stance: 'agachado', marca: ['corcunda', 'ombreira', 'saiote'],
      skin: '#c0a046', hair: '#21201b', hairStyle: 'juba', ossos: true,
      outfit: '#4a4036', outfitDark: '#2e2822', trim: '#8a7a52',
      metal: '#9aa2ab', leather: '#4a3726', eyes: '#e8720f',
      armorStyle: 'leather', helm: false, shield: true, weapon: 'scimitar',
      descalco: true,
      face: { arcada: 2, boca: 'dentuca', nariz: 'chata', narizW: 1.2 },
    },
  },
  {
    id: 2,
    nome: 'Seco e rasteiro',
    nota: 'Mais magro, corcunda mais funda, pele amarelada doente e quase nenhum '
      + 'equipamento — tranças em vez de ombreira. Silhueta muito leve.',
    look: {
      species: 'goblin', build: 'magro', heightMul: 0.94,
      stance: 'agachado', marca: ['corcunda', 'trancas'],
      skin: '#b8ad63', hair: '#2a2720', hairStyle: 'juba', ossos: true,
      outfit: '#564a3a', outfitDark: '#342c22', trim: '#7d6f4c',
      metal: '#8d949c', leather: '#55402b', eyes: '#f0871a',
      armorStyle: 'leather', helm: false, shield: false, weapon: 'scimitar',
      descalco: true, faixas: true,
      face: { arcada: 1, boca: 'dentuca', queixo: 'recuado', olhoH: 1 },
    },
  },
  {
    id: 3,
    nome: 'Limpo para o tabuleiro',
    nota: 'Contraste alto e pouco material: pele mais clara contra pano quase '
      + 'preto, ombreira e corcunda como únicas quebras. Pensado para 52 px.',
    look: {
      species: 'goblin', build: 'normal',
      stance: 'agachado', marca: ['corcunda', 'ombreira'],
      skin: '#d4b254', hair: '#17171a', hairStyle: 'juba',
      outfit: '#3a332c', outfitDark: '#1f1b18', trim: '#c2a765',
      metal: '#b3bcc6', leather: '#3d2f22', eyes: '#ff7a10',
      armorStyle: 'leather', helm: false, shield: true, weapon: 'scimitar',
      shieldFace: '#4f3b27',
      face: { arcada: 2, boca: 'dentuca', macas: 1 },
    },
  },
  {
    id: 4,
    nome: 'Carregado de troféus',
    nota: 'Tudo que a referência tem e mais: ombreira, saiote, fardo nas costas, '
      + 'ossos no cabelo e faixas na canela. A mais rica e a mais cheia.',
    look: {
      species: 'goblin', build: 'normal',
      stance: 'agachado', marca: ['corcunda', 'ombreira', 'saiote', 'mochila'],
      skin: '#c69a42', hair: '#241f1a', hairStyle: 'juba', ossos: true,
      outfit: '#4f4232', outfitDark: '#2b2419', trim: '#9c8450',
      metal: '#a7aeb6', leather: '#513a24', eyes: '#ef6f0c',
      armorStyle: 'leather', helm: false, shield: true, weapon: 'scimitar',
      descalco: true, faixas: true,
      face: { arcada: 3, boca: 'dentuca', nariz: 'chata', narizW: 1.25 },
    },
  },
];

const POSES = [
  { rotulo: 'frente', dir: 'front', pose: { kind: 'idle', frame: 0 } },
  { rotulo: 'lateral', dir: 'side', pose: { kind: 'idle', frame: 0 } },
  { rotulo: 'costas', dir: 'back', pose: { kind: 'idle', frame: 0 } },
  { rotulo: 'ataque', dir: 'side', pose: { kind: 'attack', frame: 1 } },
  { rotulo: 'andando', dir: 'side', pose: { kind: 'idle', frame: 1, andando: 1 } },
  { rotulo: 'caído', dir: 'front', pose: { kind: 'down', frame: 0 } },
];

/**
 * Uma célula pintada e contornada.
 *
 * O contorno é refeito aqui porque `paint` sozinho não o põe — quem põe é
 * `buildSheet`, depois de pintar a folha inteira. Sem ele a figura perde a
 * linha preta que a separa do piso, e a comparação sairia injusta contra o
 * que o jogador vê de verdade.
 */
function celula(look, dir, pose, zoom) {
  const c = document.createElement('canvas');
  c.width = CELL_PW;
  c.height = CELL_PH;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  paint(ctx, 0, 0, CELL_W, CELL_H, look, dir, pose, S);
  contornar(ctx, CELL_PW, CELL_PH, S);

  const fora = document.createElement('canvas');
  fora.width = CELL_PW;
  fora.height = CELL_PH;
  const fx = fora.getContext('2d');
  fx.imageSmoothingEnabled = false;
  fx.drawImage(c, 0, 0);
  fora.style.width = `${Math.round(CELL_W * zoom)}px`;
  fora.style.imageRendering = 'pixelated';
  return fora;
}

function contornar(ctx, w, h, s) {
  const img = ctx.getImageData(0, 0, w, h);
  const src = new Uint8ClampedArray(img.data);
  const dst = img.data;
  const lw = Math.floor(w / s);
  const lh = Math.floor(h / s);
  const op = (lx, ly) => lx >= 0 && ly >= 0 && lx < lw && ly < lh
    && src[(ly * s * w + lx * s) * 4 + 3] > 0;
  for (let ly = 0; ly < lh; ly++) {
    for (let lx = 0; lx < lw; lx++) {
      if (op(lx, ly)) continue;
      if (!(op(lx - 1, ly) || op(lx + 1, ly) || op(lx, ly - 1) || op(lx, ly + 1))) continue;
      for (let dy = 0; dy < s; dy++) {
        for (let dx = 0; dx < s; dx++) {
          const i = ((ly * s + dy) * w + lx * s + dx) * 4;
          dst[i] = OUTLINE[0]; dst[i + 1] = OUTLINE[1]; dst[i + 2] = OUTLINE[2]; dst[i + 3] = 255;
        }
      }
    }
  }
  ctx.putImageData(img, 0, 0);
}

/** Mede a figura do alfa — altura, largura e massa — para a tabela. */
function medir(look) {
  const c = document.createElement('canvas');
  c.width = CELL_PW; c.height = CELL_PH;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  paint(ctx, 0, 0, CELL_W, CELL_H, look, 'front', { kind: 'idle', frame: 0 }, S);
  const d = ctx.getImageData(0, 0, CELL_PW, CELL_PH).data;
  let x0 = 1e9; let y0 = 1e9; let x1 = -1; let y1 = -1; let n = 0;
  for (let y = 0; y < CELL_PH; y++) {
    for (let x = 0; x < CELL_PW; x++) {
      if (d[(y * CELL_PW + x) * 4 + 3] === 0) continue;
      n++;
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }
  return n ? { larg: x1 - x0 + 1, alt: y1 - y0 + 1, pixels: n } : { larg: 0, alt: 0, pixels: 0 };
}

function cartao(p, zoom) {
  const m = medir(p.look);
  return el('section', { class: 'proposta' },
    el('header', {},
      el('h2', {}, `${p.id}. ${p.nome}`),
      el('p', {}, p.nota),
      el('p', { class: 'medida' },
        `${m.larg}x${m.alt} px · ${m.pixels.toLocaleString('pt-BR')} pixels acesos`)),
    el('div', { class: 'tira' },
      POSES.map((q) => el('figure', {},
        celula(p.look, q.dir, q.pose, zoom),
        el('figcaption', {}, q.rotulo)))));
}

function montar(zoom) {
  const alvo = document.getElementById('propostas');
  alvo.innerHTML = '';
  // `append` não achata array — passar a lista direto imprime
  // "[object HTMLElement]" como texto. O espalhamento é obrigatório aqui.
  alvo.append(
    cartao({ id: 0, nome: 'Como está hoje', nota: 'O goblin que está no jogo agora, para a comparação ficar honesta.', look: ATUAL }, zoom),
    ...PROPOSTAS.map((p) => cartao(p, zoom)),
  );
}

let zoom = 4;
montar(zoom);
document.getElementById('mais').addEventListener('click', () => { zoom = Math.min(9, zoom + 1); montar(zoom); });
document.getElementById('menos').addEventListener('click', () => { zoom = Math.max(1, zoom - 1); montar(zoom); });
