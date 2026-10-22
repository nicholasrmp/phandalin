// Oficina de personagens: desenha com o MESMO pintor do jogo (`art/draw.js`),
// não com um protótipo à parte. O que aparecer aqui é o que aparece no
// tabuleiro.

import { paint, DIRECTIONS } from '../art/draw.js';
import { CELL_W, CELL_H, OUTLINE } from '../art/sheet.js';
import { LOOKS } from '../art/looks.js';
import { SPECIES, BUILDS, metrics } from '../art/body.js';

const ESCALA = 3;

function contornar(cv) {
  const { width: w, height: h } = cv;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  const img = ctx.getImageData(0, 0, w, h);
  const src = new Uint8ClampedArray(img.data);
  const dst = img.data;
  const op = (x, y) => x >= 0 && y >= 0 && x < w && y < h && src[(y * w + x) * 4 + 3] > 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (src[i + 3] > 0) continue;
      if (!(op(x - 1, y) || op(x + 1, y) || op(x, y - 1) || op(x, y + 1))) continue;
      dst[i] = OUTLINE[0]; dst[i + 1] = OUTLINE[1]; dst[i + 2] = OUTLINE[2]; dst[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return cv;
}

function figura(look, { dir = 'front', pose = { kind: 'idle', frame: 0 }, escala = ESCALA } = {}) {
  const cv = document.createElement('canvas');
  cv.width = CELL_W;
  cv.height = CELL_H;
  paint(cv.getContext('2d', { willReadFrequently: true }), 0, 0, CELL_W, CELL_H, look, dir, pose);
  contornar(cv);

  const out = document.createElement('canvas');
  out.width = CELL_W * escala;
  out.height = CELL_H * escala;
  const octx = out.getContext('2d');
  octx.imageSmoothingEnabled = false;
  octx.drawImage(cv, 0, 0, out.width, out.height);
  out.className = 'fig';
  return out;
}

/** Uma célula com legenda. As figuras pousam todas na mesma linha de chão. */
function cel(look, nome, detalhe, opts = {}) {
  const f = document.createElement('figure');
  f.className = `cel ${opts.inimigo ? 'inimigo' : 'heroi'}`;
  f.appendChild(figura(look, opts));
  const m = metrics(look);
  f.insertAdjacentHTML(
    'beforeend',
    `<figcaption><b>${nome}</b><span>${detalhe}</span>${
      opts.semAltura ? '' : `<span class="alt">${m.total} px</span>`
    }</figcaption>`,
  );
  return f;
}

function secao(titulo, nota) {
  const s = document.createElement('section');
  s.className = 'card';
  s.innerHTML = `<h2>${titulo}</h2>${nota ? `<p class="pitch">${nota}</p>` : ''}`;
  return s;
}

function fila(parent) {
  const d = document.createElement('div');
  d.className = 'fila';
  parent.appendChild(d);
  return d;
}

const raiz = document.getElementById('opcoes');

// --- 1. o elenco do jogo ----------------------------------------------------
{
  const s = secao(
    'O elenco, como está no jogo agora',
    'Quatro alturas diferentes no grupo de propósito: anão baixo e largo, halfling leve, '
    + 'humana média, elfo alto e magro. Dá para saber quem é quem pela silhueta, sem ler o nome. '
    + 'O número embaixo é a altura real da figura em pixels.',
  );
  const f = fila(s);
  const nomes = {
    fighter: ['Dara', 'Guerreira'], rogue: ['Pip', 'Ladino'], cleric: ['Brenn', 'Clérigo'],
    wizard: ['Ilvan', 'Mago'], goblin: ['Goblin', 'inimigo'], goblinBoss: ['Chefe goblin', 'inimigo'],
    hobgoblin: ['Hobgoblin', 'inimigo'], bugbear: ['Bugbear', 'inimigo'], orc: ['Orc', 'inimigo'],
    wolf: ['Lobo', 'inimigo'],
  };
  for (const [key, look] of Object.entries(LOOKS)) {
    const [nome, papel] = nomes[key] ?? [key, ''];
    // Quadrúpede se lê de perfil: de frente é um vulto.
    f.appendChild(cel(look, nome, papel, {
      inimigo: papel === 'inimigo',
      semAltura: !!look.quadruped,
      dir: look.quadruped ? 'side' : 'front',
    }));
  }
  raiz.appendChild(s);
}

// --- 2. espécie ------------------------------------------------------------
{
  const s = secao(
    'A espécie muda o corpo, não só a cor',
    'Todos abaixo vestem exatamente a mesma coisa — couro, espada, sem elmo — e têm a mesma '
    + 'compleição. O que muda é altura, comprimento de perna, largura de ombro, tamanho de cabeça, '
    + 'orelha, focinho, testa e queixo.',
  );
  const f = fila(s);
  const base = {
    build: 'normal',
    skin: '#d2a070', hair: '#4a3524', hairStyle: 'short',
    outfit: '#6a5a46', outfitDark: '#473c2e', trim: '#8a6a3a',
    metal: '#b4bcc6', leather: '#5a4630', eyes: '#3a4a6a',
    armorStyle: 'leather', weapon: 'sword',
  };
  const peles = {
    goblin: '#7fa05a', hobgoblin: '#c08a4a', bugbear: '#9a7a4a', orc: '#6f8a52',
  };
  for (const nome of Object.keys(SPECIES)) {
    const look = { ...base, species: nome, skin: peles[nome] ?? base.skin };
    f.appendChild(cel(look, nome, SPECIES[nome].ear === 'wide' ? 'orelha larga' : SPECIES[nome].ear === 'long' ? 'orelha longa' : '—'));
  }
  raiz.appendChild(s);
}

// --- 3. compleição ---------------------------------------------------------
{
  const s = secao(
    'A compleição é independente da espécie',
    'Mesma espécie, mesmo equipamento, quatro corpos. Existe goblin gordo e hobgoblin magro — '
    + 'é um campo separado no look, não uma variante desenhada à mão.',
  );
  const base = {
    species: 'humano',
    skin: '#d2a070', hair: '#4a3524', hairStyle: 'short',
    outfit: '#6a5a46', outfitDark: '#473c2e', trim: '#8a6a3a',
    metal: '#b4bcc6', leather: '#5a4630', eyes: '#3a4a6a',
    armorStyle: 'leather', weapon: 'sword',
  };
  for (const especie of ['humano', 'goblin', 'hobgoblin']) {
    const f = fila(s);
    for (const b of Object.keys(BUILDS)) {
      f.appendChild(cel({ ...base, species: especie, build: b, skin: especie === 'goblin' ? '#7fa05a' : especie === 'hobgoblin' ? '#c08a4a' : base.skin }, `${especie} ${b}`, `ombro ×${BUILDS[b].bulk}`));
    }
  }
  raiz.appendChild(s);
}

// --- 4. equipamento --------------------------------------------------------
{
  const s = secao(
    'O equipamento muda a figura',
    'A mesma Dara. Trocar de armadura, de arma, pôr elmo ou escudo é mudar um campo do look — '
    + 'nenhuma arte nova precisa ser desenhada. É isto que vai ligar o inventário ao boneco.',
  );
  const f = fila(s);
  const base = LOOKS.fighter;
  const kits = [
    ['Roupa de viagem', 'sem armadura, adaga', { armorStyle: 'robe', helm: false, shield: false, weapon: 'dagger', cloak: null }],
    ['Couro batido', 'couro, espada', { armorStyle: 'leather', helm: false, shield: false, weapon: 'sword' }],
    ['Escamas e escudo', 'escamas, escudo, maça', { armorStyle: 'scale', helm: false, shield: true, weapon: 'mace' }],
    ['Placas completas', 'placas, elmo, escudo', { armorStyle: 'plate', helm: true, shield: true, weapon: 'sword', cloak: '#6b2230' }],
    ['Arco longo', 'couro, arco', { armorStyle: 'leather', helm: false, shield: false, weapon: 'bow' }],
    ['Machado grande', 'placas, elmo, machado', { armorStyle: 'plate', helm: true, shield: false, weapon: 'axe' }],
  ];
  for (const [nome, det, mod] of kits) {
    f.appendChild(cel({ ...base, ...mod }, nome, det, { semAltura: true }));
  }
  raiz.appendChild(s);
}

// --- 5. vistas e poses -----------------------------------------------------
{
  const s = secao(
    'As três vistas e as quatro poses',
    'É o que a folha de sprites guarda para cada look. As três vistas, espelhadas, cobrem as '
    + 'oito orientações da grade — e as quatro diagonais que a câmera isométrica usa.',
  );
  const poses = [
    ['parado', { kind: 'idle', frame: 0 }],
    ['parado 2', { kind: 'idle', frame: 1 }],
    ['ataque', { kind: 'attack', frame: 1 }],
    ['ferido', { kind: 'hurt', frame: 0 }],
    ['caído', { kind: 'down', frame: 0 }],
  ];
  for (const dir of DIRECTIONS) {
    const f = fila(s);
    for (const [nome, pose] of poses) {
      f.appendChild(cel(LOOKS.fighter, `${dir} · ${nome}`, '', { dir, pose, semAltura: true }));
    }
  }
  raiz.appendChild(s);
}

document.getElementById('tema').addEventListener('click', (e) => {
  document.body.classList.toggle('claro');
  e.target.textContent = document.body.classList.contains('claro') ? 'Fundo escuro' : 'Fundo claro';
});
