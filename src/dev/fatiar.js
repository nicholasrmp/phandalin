// Fatiador de folhas geradas.
//
// POR QUE EXISTE
// Uma folha do OpenArt é uma imagem só com vários desenhos dentro. Para
// virarem ícone ou sprite, cada um precisa sair recortado, com fundo
// transparente e com a caixa medida. Fazer isso à mão num editor é trabalho
// que não sobrevive à próxima folha.
//
// E serve para a pergunta que decide se vale usar folhas de personagem: os
// dezoito quadros saem sendo a MESMA criatura? Isso não se responde olhando.
// Responde-se medindo altura e cor dominante de cada quadro, que é o que a
// tabela aqui embaixo mostra.
//
// O FUNDO É DETECTADO POR COR, NÃO POR VIZINHANÇA.
// A tentação é preencher a partir das bordas e chamar de fundo o que for
// alcançado. Isso quebra no arco: o vão entre a madeira e a corda é fundo e
// está cercado por desenho, então o preenchimento nunca chega lá e sobra um
// losango magenta dentro do ícone. Comparar COR resolve os dois casos, e o
// risco — recortar um pixel magenta que fosse do desenho — não existe aqui,
// porque nenhum item é magenta. É por isso que o fundo é magenta.

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

const FOLHAS = [
  // Itens
  '1-espadas', '2-impacto', '3-hastes', '4-vestir', '5-equipamento',
  // Criaturas. `teste-goblin` tinha 6 poses; as `goblin-*` têm as 12 que o
  // motor passou a conhecer, uma folha por armamento.
  'teste-goblin', 'goblin-maca', 'goblin-completa',
  // Espada e escudo: as 12 poses cortadas em duas folhas de seis colunas,
  // porque seis e a largura que aguentou a sequencia inteira nos dois testes.
  'goblin-espada-a', 'goblin-espada-b',
];

/** Distância de cor ao quadrado, em RGB. Barata e suficiente para chave de cor. */
const dist2 = (r1, g1, b1, r2, g2, b2) => {
  const dr = r1 - r2; const dg = g1 - g2; const db = b1 - b2;
  return dr * dr + dg * dg + db * db;
};

/**
 * As cores do fundo, colhidas na MOLDURA da imagem.
 *
 * A borda inteira é fundo por construção — nenhum desenho encosta nela. Colher
 * dali em vez de assumir um magenta fixo é o que faz funcionar na folha que
 * saiu em xadrez de dois tons: as duas cores entram na lista sozinhas.
 */
function coresDeFundo(dados, w, h) {
  const vistas = [];
  const prova = (x, y) => {
    const i = (y * w + x) * 4;
    const c = [dados[i], dados[i + 1], dados[i + 2]];
    // Agrupa: cor nova só entra se estiver longe de todas as já vistas.
    if (!vistas.some((v) => dist2(...v, ...c) < 900)) vistas.push(c);
  };
  const passo = Math.max(1, Math.floor(w / 200));
  for (let x = 0; x < w; x += passo) { prova(x, 0); prova(x, h - 1); }
  for (let y = 0; y < h; y += passo) { prova(0, y); prova(w - 1, y); }
  return vistas;
}

/**
 * A SOMBRA PROJETADA também é fundo.
 *
 * Pedi ao gerador, com todas as letras, que não desenhasse sombra no chão.
 * Ele desenhou assim mesmo — uma elipse roxa sob cada figura. E ela ENCOSTA
 * na figura, então vem junto no recorte: duas peças da folha da maça saíram
 * com a sombra como cor dominante.
 *
 * Não vale gastar crédito tentando convencer o modelo. A sombra é o magenta
 * do fundo escurecido, então é reconhecível pelo que ela é: mesma MATIZ do
 * fundo, luminosidade menor. Qualquer pixel que caia nessa descrição sai
 * junto com o fundo.
 *
 * O risco seria apagar parte de um desenho roxo — e nenhum item ou criatura
 * deste projeto é roxo-magenta. É por isso que o fundo é magenta.
 */
function ehSombra(r, g, b, fundos) {
  const h = matiz(r, g, b);
  const luz = r * 0.299 + g * 0.587 + b * 0.114;
  return fundos.some((c) => {
    const luzFundo = c[0] * 0.299 + c[1] * 0.587 + c[2] * 0.114;
    // Mesma matiz (±18°), mais escura que o fundo, e não escura DEMAIS — o
    // contorno preto da figura também é escuro e tem de ficar.
    const dh = Math.abs(((matiz(...c) - h + 540) % 360) - 180);
    return dh < 18 && luz < luzFundo - 6 && luz > luzFundo * 0.45;
  });
}

function matiz(r, g, b) {
  const max = Math.max(r, g, b); const min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

/**
 * Componentes conexos de desenho, com caixa e cor dominante.
 *
 * A varredura é iterativa com pilha própria, e não recursiva: uma espada de
 * 500 px de altura tem dezenas de milhares de pixels conexos e a recursão
 * estoura a pilha do navegador antes de terminar o primeiro ícone.
 */
function componentes(fundo, w, h, areaMinima) {
  const visto = new Uint8Array(w * h);
  const achados = [];
  const pilha = new Int32Array(w * h);

  for (let p0 = 0; p0 < w * h; p0++) {
    if (visto[p0] || fundo[p0]) continue;
    let topo = 0;
    pilha[topo++] = p0;
    visto[p0] = 1;

    let x0 = w; let y0 = h; let x1 = -1; let y1 = -1; let n = 0;
    const pixels = [];

    while (topo > 0) {
      const p = pilha[--topo];
      const x = p % w; const y = (p / w) | 0;
      n++;
      pixels.push(p);
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx; const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const q = ny * w + nx;
          if (visto[q] || fundo[q]) continue;
          visto[q] = 1;
          pilha[topo++] = q;
        }
      }
    }

    if (n >= areaMinima) achados.push({ x0, y0, x1, y1, n, pixels });
  }
  // Da esquerda para a direita, de cima para baixo — a ordem de leitura, que é
  // a ordem em que a folha foi pedida.
  achados.sort((a, b) => (a.y0 - b.y0 > 60 ? 1 : b.y0 - a.y0 > 60 ? -1 : a.x0 - b.x0));
  return achados;
}

/** A cor que mais aparece, ignorando o contorno escuro e o quase-preto. */
function corDominante(dados, pixels) {
  const conta = new Map();
  for (const p of pixels) {
    const i = p * 4;
    const r = dados[i]; const g = dados[i + 1]; const b = dados[i + 2];
    if (r + g + b < 180) continue; // contorno
    // Quantiza em degraus de 16 para agrupar o anti-aliasing que escapou.
    const k = `${r >> 4},${g >> 4},${b >> 4}`;
    conta.set(k, (conta.get(k) ?? 0) + 1);
  }
  let melhor = null; let max = 0;
  for (const [k, v] of conta) if (v > max) { max = v; melhor = k; }
  if (!melhor) return '#000000';
  const [r, g, b] = melhor.split(',').map((v) => (Number(v) << 4) + 8);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

// ---------------------------------------------------------------- página ----

const raiz = document.getElementById('app');
const barra = document.getElementById('barra');

let folhaAtual = FOLHAS[0];
let tolerancia = 40;
let tirarSombra = true;
let areaMinima = 400;

async function carregar(nome) {
  const img = new Image();
  img.src = `/_referencias/folhas/${nome}.png`;
  await img.decode();
  return img;
}

async function analisar() {
  raiz.replaceChildren(el('p', { class: 'carregando' }, 'Lendo a folha…'));

  const img = await carregar(folhaAtual);
  const w = img.naturalWidth; const h = img.naturalHeight;
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const img2 = ctx.getImageData(0, 0, w, h);
  const d = img2.data;

  const fundos = coresDeFundo(d, w, h);
  const lim = tolerancia * tolerancia;
  const ehFundo = new Uint8Array(w * h);
  let sombras = 0;
  for (let p = 0; p < w * h; p++) {
    const i = p * 4;
    const r = d[i]; const g = d[i + 1]; const b = d[i + 2];
    if (fundos.some((c) => dist2(r, g, b, c[0], c[1], c[2]) < lim)) { ehFundo[p] = 1; continue; }
    if (tirarSombra && ehSombra(r, g, b, fundos)) { ehFundo[p] = 1; sombras++; }
  }

  const partes = componentes(ehFundo, w, h, areaMinima);

  const alturas = partes.map((p) => p.y1 - p.y0 + 1);
  const medAlt = alturas.reduce((a, b) => a + b, 0) / (alturas.length || 1);

  const cartoes = partes.map((p, i) => {
    const pw = p.x1 - p.x0 + 1; const ph = p.y1 - p.y0 + 1;
    // Recorte com fundo removido: só os pixels DESTE componente entram, então
    // um vizinho que invada a caixa não vem junto.
    const corte = document.createElement('canvas');
    corte.width = pw; corte.height = ph;
    const cctx = corte.getContext('2d');
    const saida = cctx.createImageData(pw, ph);
    for (const q of p.pixels) {
      const x = q % w; const y = (q / w) | 0;
      const dst = ((y - p.y0) * pw + (x - p.x0)) * 4;
      const src = q * 4;
      saida.data[dst] = d[src];
      saida.data[dst + 1] = d[src + 1];
      saida.data[dst + 2] = d[src + 2];
      saida.data[dst + 3] = 255;
    }
    cctx.putImageData(saida, 0, 0);

    const alt = ph;
    const desvio = Math.round(((alt - medAlt) / medAlt) * 100);
    const cor = corDominante(d, p.pixels);

    const vista = el('canvas', { class: 'vista', width: 150, height: 150 });
    const vctx = vista.getContext('2d');
    vctx.imageSmoothingEnabled = false;
    const esc = Math.min(150 / pw, 150 / ph);
    vctx.drawImage(corte, (150 - pw * esc) / 2, (150 - ph * esc) / 2, pw * esc, ph * esc);

    return el('div', { class: 'peca' },
      vista,
      el('b', {}, `#${i + 1}`),
      el('span', {}, `${pw} × ${ph}`),
      el('span', { class: Math.abs(desvio) > 12 ? 'fora' : '' },
        `altura ${desvio >= 0 ? '+' : ''}${desvio}% da média`),
      el('span', { class: 'cor' },
        el('i', { style: { background: cor } }), cor),
      el('button', {
        onclick: () => {
          const a = document.createElement('a');
          a.download = `${folhaAtual}-${String(i + 1).padStart(2, '0')}.png`;
          a.href = corte.toDataURL('image/png');
          a.click();
        },
      }, 'baixar'));
  });

  // As cores dominantes agrupadas: é a medida de "é a mesma criatura".
  const cores = partes.map((p) => corDominante(d, p.pixels));
  const grupos = new Map();
  for (const c of cores) grupos.set(c, (grupos.get(c) ?? 0) + 1);

  raiz.replaceChildren(
    el('div', { class: 'resumo' },
      el('p', {},
        `${partes.length} peça(s) · imagem ${w}×${h} · `,
        sombras ? `${sombras} px de sombra removidos · ` : '',
        `${fundos.length} cor(es) de fundo detectada(s) · `,
        `altura média ${Math.round(medAlt)} px`),
      el('p', {},
        'Cores dominantes: ',
        [...grupos].sort((a, b) => b[1] - a[1]).map(([c, n]) => el('span', { class: 'cor' },
          el('i', { style: { background: c } }), `${c} ×${n}`)))),
    el('div', { class: 'grade' }, cartoes));
}

// ---- controles ----
const selFolha = el('select', { onchange: (e) => { folhaAtual = e.target.value; analisar(); } },
  FOLHAS.map((f) => el('option', { value: f }, f)));

const campo = (rot, valor, onInput) => el('label', {}, rot,
  el('input', { type: 'number', value: valor, min: 1, oninput: onInput }));

barra.append(
  selFolha,
  campo('tolerância de fundo', tolerancia, (e) => { tolerancia = Number(e.target.value) || 40; }),
  campo('área mínima', areaMinima, (e) => { areaMinima = Number(e.target.value) || 400; }),
  el('label', {},
    el('input', {
      type: 'checkbox', checked: tirarSombra ? 'checked' : null,
      onchange: (e) => { tirarSombra = e.target.checked; },
    }),
    'tirar sombra projetada'),
  el('button', { onclick: () => analisar() }, 'Reanalisar'));

analisar();
