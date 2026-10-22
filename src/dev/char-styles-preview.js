// Página de decisão do item 6: as quatro direções de design, lado a lado,
// pintando exatamente a mesma ficha de dados.

import { STYLES, CELL_W, CELL_H } from './char-styles.js';

// --- elenco de teste ---------------------------------------------------------
// Os quatro heróis, dois inimigos e um chefe. Mesmos dados para as quatro.

const ELENCO = [
  {
    nome: 'Thora', papel: 'Guerreira',
    look: {
      skin: '#c98d62', hair: '#3b2a1e', hairStyle: 'short', eyes: '#2f6b4f',
      outfit: '#6b5540', pants: '#4a3b2c', leather: '#5a4433',
      metal: '#b9c0c9', trim: '#c9a227', belt: '#3b2c20',
      armorStyle: 'plate', helm: true, shield: true, weapon: 'sword',
    },
  },
  {
    nome: 'Brenn', papel: 'Ladino',
    look: {
      skin: '#d6a579', hair: '#1f1a16', hairStyle: 'short', eyes: '#8a8f3a',
      outfit: '#2f3a44', pants: '#242c34', leather: '#3a3026',
      metal: '#9aa2ac', trim: '#6b7f4a',
      armorStyle: 'leather', cloak: '#2a3038', mask: '#2a2420', weapon: 'dagger',
    },
  },
  {
    nome: 'Sera', papel: 'Clériga',
    look: {
      skin: '#e3bb93', hair: '#8a6a3a', hairStyle: 'long', eyes: '#5a7fb0',
      outfit: '#8a8270', pants: '#6a6356', leather: '#6b5a44',
      metal: '#cfd4da', trim: '#e8d27a', belt: '#4a4034',
      armorStyle: 'scale', cloak: '#d8cfae', weapon: 'mace',
    },
  },
  {
    nome: 'Lira', papel: 'Maga',
    look: {
      skin: '#f0cfa8', hair: '#5a2f6b', hairStyle: 'long', eyes: '#9a6fd0',
      outfit: '#44306b', pants: '#33244f', leather: '#4a3a5a',
      metal: '#a99ad0', trim: '#c8a8f0', ears: true,
      armorStyle: 'robe', cloak: '#3a2a5a', glow: '#b88cf0', weapon: 'staff',
    },
  },
  {
    nome: 'Goblin', papel: 'Inimigo',
    look: {
      skin: '#7a9a4a', hair: '#2a2a1a', hairStyle: 'spiky', eyes: '#d8c23a',
      outfit: '#5a4a2a', pants: '#44381f', leather: '#4a3a22',
      metal: '#8a8276', trim: '#8a3a2a',
      armorStyle: 'leather', weapon: 'dagger',
    },
  },
  {
    nome: 'Hobgoblin', papel: 'Inimigo',
    look: {
      skin: '#b06a3a', hair: '#2a1a14', hairStyle: 'short', eyes: '#d84a3a',
      outfit: '#5a2a2a', pants: '#44201f', leather: '#4a2a22',
      metal: '#9aa0a8', trim: '#c23a2a', belt: '#3a2018',
      armorStyle: 'scale', helm: true, shield: true, weapon: 'sword',
    },
  },
  {
    nome: 'Chefe', papel: 'Inimigo',
    look: {
      skin: '#6a8a3a', hair: '#1a1a10', hairStyle: 'spiky', eyes: '#f0d23a',
      outfit: '#3a2a4a', pants: '#2f2238', leather: '#4a3a22',
      metal: '#c9a227', trim: '#8a2a6a', belt: '#2a1a28',
      armorStyle: 'plate', cloak: '#5a1a3a', weapon: 'sword',
    },
  },
];

// --- o mesmo personagem com equipamentos diferentes --------------------------
// Isto é a segunda metade do pedido: o visual tem de mudar com o que a pessoa
// está usando. A ficha-base é a mesma Thora nas quatro.

const BASE = ELENCO[0].look;
const EQUIPAMENTOS = [
  {
    nome: 'Roupa de viagem',
    detalhe: 'sem armadura, adaga',
    look: { ...BASE, armorStyle: 'none', helm: false, shield: false, weapon: 'dagger', trim: null },
  },
  {
    nome: 'Couro batido',
    detalhe: 'couro, espada longa',
    look: { ...BASE, armorStyle: 'leather', helm: false, shield: false, weapon: 'sword' },
  },
  {
    nome: 'Cota de escamas + escudo',
    detalhe: 'escamas, escudo, maça',
    look: { ...BASE, armorStyle: 'scale', helm: false, shield: true, weapon: 'mace' },
  },
  {
    nome: 'Placas completas',
    detalhe: 'placas, elmo, escudo, espada',
    look: { ...BASE, armorStyle: 'plate', helm: true, shield: true, weapon: 'sword', cloak: '#6b2230' },
  },
  {
    nome: 'Arco longo',
    detalhe: 'couro, arco, sem escudo',
    look: { ...BASE, armorStyle: 'leather', helm: false, shield: false, weapon: 'bow' },
  },
];

// --- desenho ----------------------------------------------------------------

const ESCALA = 3;

/**
 * Contorno automático: dilata a máscara de alfa e pinta a borda por baixo.
 * É o que faz a figura existir contra o chão — e, na opção D, a luz de aresta
 * clara é o que separa uma silhueta quase preta de um mapa escuro.
 */
function contornar(cv, { color, width }) {
  const w = cv.width, h = cv.height;
  const src = cv.getContext('2d').getImageData(0, 0, w, h);
  const out = document.createElement('canvas');
  out.width = w; out.height = h;
  const octx = out.getContext('2d');
  const borda = octx.createImageData(w, h);
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));

  const solido = (x, y) => x >= 0 && y >= 0 && x < w && y < h && src.data[(y * w + x) * 4 + 3] > 24;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (solido(x, y)) continue;
      let vizinho = false;
      for (let dy = -width; dy <= width && !vizinho; dy++) {
        for (let dx = -width; dx <= width; dx++) {
          if (solido(x + dx, y + dy)) { vizinho = true; break; }
        }
      }
      if (!vizinho) continue;
      const i = (y * w + x) * 4;
      borda.data[i] = r; borda.data[i + 1] = g; borda.data[i + 2] = b; borda.data[i + 3] = 255;
    }
  }
  octx.putImageData(borda, 0, 0);
  octx.drawImage(cv, 0, 0);
  return out;
}

function figura(style, look, { escala = ESCALA, chao = true } = {}) {
  // A figura é pintada sozinha, contornada, e só então pousada sobre o chão:
  // assim o contorno segue o corpo e não o losango do piso.
  const corpo = document.createElement('canvas');
  corpo.width = CELL_W;
  corpo.height = CELL_H;
  style.paint(corpo.getContext('2d'), 0, 0, look);
  const pronto = style.outline ? contornar(corpo, style.outline) : corpo;

  const cv = document.createElement('canvas');
  cv.width = CELL_W;
  cv.height = CELL_H;
  const ctx = cv.getContext('2d');

  if (chao) {
    // Losango do piso, só para dar a mesma referência de escala às quatro.
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.moveTo(CELL_W / 2, CELL_H - 10);
    ctx.lineTo(CELL_W - 3, CELL_H - 6);
    ctx.lineTo(CELL_W / 2, CELL_H - 2);
    ctx.lineTo(3, CELL_H - 6);
    ctx.closePath();
    ctx.fill();
  }

  ctx.drawImage(pronto, 0, 0);

  const out = document.createElement('canvas');
  out.width = CELL_W * escala;
  out.height = CELL_H * escala;
  const octx = out.getContext('2d');
  octx.imageSmoothingEnabled = false;
  octx.drawImage(cv, 0, 0, out.width, out.height);
  out.className = 'fig';
  return out;
}

function montar() {
  const raiz = document.getElementById('opcoes');

  for (const style of STYLES) {
    const card = document.createElement('section');
    card.className = 'card';

    const head = document.createElement('header');
    head.innerHTML = `
      <div class="tag">Opção ${style.id}</div>
      <h2>${style.name}</h2>
      <p class="pitch">${style.pitch}</p>
    `;
    card.appendChild(head);

    // elenco
    const elenco = document.createElement('div');
    elenco.className = 'elenco';
    for (const p of ELENCO) {
      const cel = document.createElement('figure');
      cel.className = `cel ${p.papel === 'Inimigo' ? 'inimigo' : 'heroi'}`;
      cel.appendChild(figura(style, p.look));
      cel.insertAdjacentHTML('beforeend', `<figcaption><b>${p.nome}</b><span>${p.papel}</span></figcaption>`);
      elenco.appendChild(cel);
    }
    card.appendChild(elenco);

    // equipamento
    const eq = document.createElement('div');
    eq.className = 'equip';
    eq.innerHTML = '<h3>A mesma Thora, equipamento diferente</h3>';
    const fila = document.createElement('div');
    fila.className = 'fila';
    for (const e of EQUIPAMENTOS) {
      const cel = document.createElement('figure');
      cel.className = 'cel heroi';
      cel.appendChild(figura(style, e.look));
      cel.insertAdjacentHTML('beforeend', `<figcaption><b>${e.nome}</b><span>${e.detalhe}</span></figcaption>`);
      fila.appendChild(cel);
    }
    eq.appendChild(fila);
    card.appendChild(eq);

    // tamanho real, para checar leitura com a câmera afastada
    const real = document.createElement('div');
    real.className = 'real';
    real.innerHTML = '<h3>No tamanho em que aparece no tabuleiro</h3>';
    const filaReal = document.createElement('div');
    filaReal.className = 'fila-real';
    for (const z of [1, 1.5, 2]) {
      const grupo = document.createElement('div');
      grupo.className = 'grupo-real';
      const amostra = ['Thora', 'Lira', 'Goblin', 'Hobgoblin'].map((n) => ELENCO.find((p) => p.nome === n));
      for (const p of amostra) {
        grupo.appendChild(figura(style, p.look, { escala: z }));
      }
      grupo.insertAdjacentHTML('beforeend', `<span class="lab">${z}×</span>`);
      filaReal.appendChild(grupo);
    }
    real.appendChild(filaReal);
    card.appendChild(real);

    // prós e contras
    const juizo = document.createElement('div');
    juizo.className = 'juizo';
    juizo.innerHTML = `
      <ul class="pros">${style.pros.map((s) => `<li>${s}</li>`).join('')}</ul>
      <ul class="cons">${style.cons.map((s) => `<li>${s}</li>`).join('')}</ul>
    `;
    card.appendChild(juizo);

    raiz.appendChild(card);
  }
}

montar();

// Fundo claro/escuro: o tabuleiro tem pedra clara e sombra, então vale ver as
// quatro nos dois.
document.getElementById('tema').addEventListener('click', (e) => {
  document.body.classList.toggle('claro');
  e.target.textContent = document.body.classList.contains('claro') ? 'Fundo escuro' : 'Fundo claro';
});
