// FICHA DE SPRITE — a página que se mostra antes de aceitar uma criatura.
//
// POR QUE ISTO EXISTE
//
// Esta sessão gastou quatro tentativas de arte recusadas descobrindo que
// opinião não decide sprite. O que destrava é medir contra um exemplo bom e
// olhar a figura inteira de uma vez: as oito direções lado a lado, no tamanho
// que o tabuleiro de fato mostra, com a paleta contada e a silhueta testada.
//
// Esta ficha é esse olhar, num arquivo só. Serve para três coisas:
//   - conferir uma criatura ANTES de ela entrar no jogo;
//   - comparar duas (a pintada e a importada) com os mesmos números;
//   - ser o documento que acompanha o pedido da próxima folha.
//
// O ASSET E O DOCUMENTO SÃO COISAS DIFERENTES.
// A ficha tem legenda, nome, paleta e medidas escritas por cima. O arquivo
// que o motor lê não tem uma letra — texto queimado dentro da folha foi
// exatamente o defeito que o `importar-goblin.py` precisou de um algoritmo de
// componentes conexos para desfazer. Esta página desenha a legenda; ela nunca
// grava nada de volta na folha.
//
// TUDO É DESENHADO NA RESOLUÇÃO LÓGICA, não na física.
// A folha guarda 3 px físicos por px lógico, mas `drawSprite` divide por `S`
// antes de pôr no tabuleiro — a criatura chega ao jogador com 40 px de
// altura, não 240. Uma ficha desenhada na resolução física mentiria a favor
// da arte. Então a folha inteira é reduzida UMA vez para o tamanho lógico, e
// daí para frente só há ampliação inteira, que é exata.

import { getSheet, ANIMS, S } from '../art/sheet.js';
import { allLookKeys } from '../art/looks.js';
import { TW, TH } from '../view/board.js';

const FUNDO = '#1b1610';
const PAINEL = '#241d16';
const BORDA = '#3a3024';
const TEXTO = '#ebe2d0';
const FRACO = '#a2957c';
const OURO = '#c9a227';

const el = (t, a = {}, ...f) => {
  const n = document.createElement(t);
  for (const [k, v] of Object.entries(a)) {
    if (k === 'class') n.className = v;
    else if (k === 'style') Object.assign(n.style, v);
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else if (v != null && v !== false) n.setAttribute(k, v);
  }
  for (const x of f.flat()) if (x != null && x !== false) n.append(x instanceof Node ? x : String(x));
  return n;
};

/**
 * A folha inteira reduzida para a resolução lógica, uma vez.
 *
 * Depois disto toda ampliação é por inteiro e portanto exata. Reduzir a cada
 * quadro, com fatores quebrados, é o que devolve o salpicado.
 */
function paraLogico(sheet) {
  const c = document.createElement('canvas');
  c.width = Math.round(sheet.w / S);
  c.height = Math.round(sheet.h / S);
  const x = c.getContext('2d', { willReadFrequently: true });
  x.imageSmoothingEnabled = false;
  x.drawImage(sheet.image, 0, 0, sheet.w, sheet.h, 0, 0, c.width, c.height);
  return c;
}

/** Retângulo lógico de um quadro: animação, direção, índice. */
function recorte(sheet, nome, row, f) {
  const a = sheet.anims[nome];
  const lw = Math.round(a.fw / S);
  const lh = Math.round(a.fh / S);
  return {
    sx: Math.min(f, a.frames - 1) * lw,
    sy: Math.round(a.y / S) + row * lh,
    lw,
    lh,
  };
}

/**
 * A FAIXA ÚTIL.
 *
 * A célula tem 80 px lógicos de altura e a figura ocupa 40. Desenhar a célula
 * inteira na ficha gastaria metade da página em transparência e deixaria a
 * folha alta demais para caber num olhar. Então mede-se a primeira fileira
 * ocupada em TODA a folha e corta-se por ela — igual para todos os quadros,
 * que é o que mantém os pés alinhados entre as colunas.
 */
function faixaUtil(logico) {
  const d = logico.getContext('2d').getImageData(0, 0, logico.width, logico.height).data;
  for (let y = 0; y < logico.height; y++) {
    for (let x = 0; x < logico.width; x++) {
      if (d[(y * logico.width + x) * 4 + 3] > 0) return y;
    }
  }
  return 0;
}

/** Cores distintas da folha, da mais usada para a menos. */
function paleta(logico) {
  const d = logico.getContext('2d').getImageData(0, 0, logico.width, logico.height).data;
  const conta = new Map();
  let total = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 8) continue;
    total++;
    const hex = '#' + [d[i], d[i + 1], d[i + 2]]
      .map((v) => v.toString(16).padStart(2, '0')).join('');
    conta.set(hex, (conta.get(hex) ?? 0) + 1);
  }
  return [...conta.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([hex, n]) => ({ hex, parte: n / total }));
}

/**
 * As medidas do placar, por animação.
 *
 * Identidade mede-se por ALTURA e não por massa: a massa cai legitimamente
 * uns 40% no perfil, porque a figura é mais estreita, e um limite de massa
 * reprovaria folhas corretas — já reprovou, nesta mesma sessão.
 */
function medir(logico, sheet, nome) {
  const ctx = logico.getContext('2d');
  const alturas = [];
  const larguras = [];
  let perim = 0;
  let area = 0;
  for (let row = 0; row < sheet.dirs.length; row++) {
    const { sx, sy, lw, lh } = recorte(sheet, nome, row, 0);
    const d = ctx.getImageData(sx, sy, lw, lh).data;
    const op = (x, y) => x >= 0 && y >= 0 && x < lw && y < lh && d[(y * lw + x) * 4 + 3] > 0;
    let x0 = Infinity; let y0 = Infinity; let x1 = -1; let y1 = -1;
    for (let y = 0; y < lh; y++) {
      for (let x = 0; x < lw; x++) {
        if (!op(x, y)) continue;
        area++;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
        if (!op(x - 1, y)) perim++;
        if (!op(x + 1, y)) perim++;
        if (!op(x, y - 1)) perim++;
        if (!op(x, y + 1)) perim++;
      }
    }
    if (x1 >= 0) { alturas.push(y1 - y0 + 1); larguras.push(x1 - x0 + 1); }
  }
  const media = (v) => v.reduce((a, b) => a + b, 0) / v.length;
  const h = media(alturas);
  return {
    altura: h,
    dispersao: (Math.max(...alturas) - Math.min(...alturas)) / h,
    proporcao: media(larguras) / h,
    contorno: perim / Math.sqrt(area),
  };
}

// ---------------------------------------------------------------------------

function texto(ctx, s, x, y, { cor = TEXTO, tam = 12, peso = 400, alinha = 'left' } = {}) {
  ctx.font = `${peso} ${tam}px ui-monospace, "SFMono-Regular", Consolas, monospace`;
  ctx.fillStyle = cor;
  ctx.textAlign = alinha;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(s, x, y);
  ctx.textAlign = 'left';
}

/** Desenha um quadro ampliado por um inteiro — nunca por um fator quebrado. */
function quadro(ctx, logico, r, x, y, z, topo) {
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(logico, r.sx, r.sy + topo, r.lw, r.lh - topo,
                x, y, r.lw * z, (r.lh - topo) * z);
}

/**
 * O TESTE DA SILHUETA, que é o que decide.
 *
 * Preencha a figura de uma cor só. Se ela não lê como a criatura, nada do que
 * for pintado dentro salva. Faz-se ANTES de discutir cor, sombra ou detalhe.
 */
function silhueta(ctx, logico, r, x, y, z, topo, cor) {
  const c = document.createElement('canvas');
  c.width = r.lw; c.height = r.lh - topo;
  const k = c.getContext('2d');
  k.imageSmoothingEnabled = false;
  k.drawImage(logico, r.sx, r.sy + topo, r.lw, c.height, 0, 0, r.lw, c.height);
  k.globalCompositeOperation = 'source-in';
  k.fillStyle = cor;
  k.fillRect(0, 0, c.width, c.height);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(c, 0, 0, c.width, c.height, x, y, c.width * z, c.height * z);
}

/** Um pedaço de tabuleiro com a criatura em cima, na geometria real do jogo. */
function exemploNoJogo(ctx, logico, sheet, ox, oy, z, topo) {
  const w = TW * z / 2;
  const h = TH * z / 2;
  for (let ty = 0; ty < 3; ty++) {
    for (let tx = 0; tx < 3; tx++) {
      const cx = ox + (tx - ty) * w;
      const cy = oy + (tx + ty) * h;
      ctx.beginPath();
      ctx.moveTo(cx, cy - h);
      ctx.lineTo(cx + w, cy);
      ctx.lineTo(cx, cy + h);
      ctx.lineTo(cx - w, cy);
      ctx.closePath();
      ctx.fillStyle = (tx + ty) % 2 ? '#45516a' : '#4d5a74';
      ctx.fill();
      ctx.strokeStyle = '#2f3950';
      ctx.stroke();
    }
  }
  // Duas criaturas, em direções diferentes, para a ficha mostrar que elas
  // ficam no próprio ladrilho e não flutuam entre eles.
  for (const [tx, ty, dir] of [[1, 1, 0], [2, 0, Math.min(4, sheet.dirs.length - 1)]]) {
    const cx = ox + (tx - ty) * w;
    const cy = oy + (tx + ty) * h;
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(cx, cy, w * 0.36, h * 0.36, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    const r = recorte(sheet, 'idle', dir, 0);
    // A base do sprite encosta no ladrilho, igual ao `drawSprite`.
    quadro(ctx, logico, r, cx - r.lw * z / 2, cy - (r.lh - topo) * z, z, topo);
  }
}

// ---------------------------------------------------------------------------

function desenharFicha(key) {
  const sheet = getSheet(key);
  const logico = paraLogico(sheet);
  const topo = Math.max(0, faixaUtil(logico) - 1);
  const cores = paleta(logico);
  const banda = Math.round(sheet.anims.idle.fh / S) - topo;
  const celW = Math.round(sheet.anims.idle.fw / S);

  const Z = 2;              // as grades de animação
  const ZG = 5;             // o retrato grande
  const MARG = 24;
  const COLS = sheet.dirs.length;
  const passoX = celW * Z + 8;
  const passoY = banda * Z + 20;

  const larguraGrade = COLS * passoX;
  const W = Math.max(960, MARG * 2 + larguraGrade);
  const linhas = ANIMS.reduce((n, a) => n + Math.min(a.frames, sheet.anims[a.name]?.frames ?? 0), 0);
  const H = 150 + banda * ZG + 70 + Math.ceil(cores.length / 12) * 46
          + ANIMS.length * 30 + linhas * passoY + banda * 4 + TH * 3 + 120 + MARG;

  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  ctx.fillStyle = FUNDO;
  ctx.fillRect(0, 0, W, H);

  let y = MARG + 22;

  // ---- cabeçalho ---------------------------------------------------------
  texto(ctx, key.toUpperCase(), MARG, y, { cor: TEXTO, tam: 26, peso: 700 });
  const importada = sheet.image instanceof HTMLImageElement;
  texto(ctx, importada ? 'folha importada (PNG)' : 'pintada em runtime (draw.js)',
        MARG, y + 20, { cor: OURO, tam: 12 });
  y += 44;

  const retratoY = y;
  ctx.fillStyle = PAINEL;
  ctx.fillRect(MARG, y, celW * ZG + 24, banda * ZG + 24);
  ctx.strokeStyle = BORDA;
  ctx.strokeRect(MARG + 0.5, y + 0.5, celW * ZG + 24, banda * ZG + 24);
  quadro(ctx, logico, recorte(sheet, 'idle', 0, 0), MARG + 12, y + 12, ZG, topo);

  const m = medir(logico, sheet, 'idle');
  const infoX = MARG + celW * ZG + 48;
  const dados = [
    ['célula lógica', `${celW} x ${Math.round(sheet.anims.idle.fh / S)} px`],
    ['célula física', `${sheet.anims.idle.fw} x ${sheet.anims.idle.fh} px  (S = ${S})`],
    ['figura parada', `${Math.round(m.altura)} px de altura`],
    ['proporção larg÷alt', m.proporcao.toFixed(2)],
    ['dispersão de altura', `${(m.dispersao * 100).toFixed(1)}%  entre as direções`],
    ['perímetro ÷ √área', m.contorno.toFixed(2)],
    ['cores distintas', String(cores.length)],
    ['direções', `${sheet.dirs.length} — ${sheet.dirs.join(', ')}`],
    ['animações', ANIMS.map((a) => a.name).join(', ')],
    ['projeção', `dimétrica 2:1 — ladrilho ${TW} x ${TH}`],
  ];
  let dy = y + 18;
  for (const [rot, val] of dados) {
    texto(ctx, rot, infoX, dy, { cor: FRACO, tam: 11 });
    texto(ctx, val, infoX + 150, dy, { cor: TEXTO, tam: 11 });
    dy += 17;
  }
  y = Math.max(retratoY + banda * ZG + 24, dy) + 34;

  // ---- paleta -------------------------------------------------------------
  texto(ctx, 'PALETA', MARG, y, { cor: OURO, tam: 12, peso: 700 });
  y += 12;
  cores.forEach((cor, i) => {
    const cx = MARG + (i % 12) * 74;
    const cy = y + Math.floor(i / 12) * 46;
    ctx.fillStyle = cor.hex;
    ctx.fillRect(cx, cy, 30, 30);
    ctx.strokeStyle = BORDA;
    ctx.strokeRect(cx + 0.5, cy + 0.5, 30, 30);
    texto(ctx, cor.hex, cx + 36, cy + 13, { cor: TEXTO, tam: 10 });
    texto(ctx, `${(cor.parte * 100).toFixed(1)}%`, cx + 36, cy + 26, { cor: FRACO, tam: 10 });
  });
  y += Math.ceil(cores.length / 12) * 46 + 22;

  // ---- animações ----------------------------------------------------------
  for (const anim of ANIMS) {
    const a = sheet.anims[anim.name];
    if (!a) continue;
    texto(ctx, anim.name.toUpperCase(), MARG, y, { cor: OURO, tam: 12, peso: 700 });
    texto(ctx, `${a.frames} quadro${a.frames > 1 ? 's' : ''} · ${a.hold.join(' / ')} tiques`,
          MARG + 90, y, { cor: FRACO, tam: 10 });
    y += 10;
    // Os rótulos de direção saem UMA vez, no topo do primeiro bloco: repetir
    // em cada animação encheria a ficha de texto e tiraria o olho da figura.
    if (anim === ANIMS[0]) {
      sheet.dirs.forEach((d, i) => texto(ctx, d, MARG + i * passoX, y + 8, { cor: FRACO, tam: 9 }));
      y += 12;
    }
    for (let f = 0; f < a.frames; f++) {
      sheet.dirs.forEach((_, row) => {
        const x = MARG + row * passoX;
        ctx.fillStyle = PAINEL;
        ctx.fillRect(x, y, celW * Z, banda * Z);
        quadro(ctx, logico, recorte(sheet, anim.name, row, f), x, y, Z, topo);
      });
      texto(ctx, String(f), MARG + larguraGrade + 6, y + banda * Z - 2, { cor: FRACO, tam: 9 });
      y += passoY;
    }
    y += 8;
  }

  // ---- silhueta + exemplo no jogo ----------------------------------------
  texto(ctx, 'TESTE DA SILHUETA', MARG, y, { cor: OURO, tam: 12, peso: 700 });
  texto(ctx, 'se não lê como a criatura aqui, nada do que for pintado dentro salva',
        MARG + 150, y, { cor: FRACO, tam: 10 });
  y += 14;
  sheet.dirs.forEach((_, row) => {
    const x = MARG + row * passoX;
    ctx.fillStyle = PAINEL;
    ctx.fillRect(x, y, celW * Z, banda * Z);
    silhueta(ctx, logico, recorte(sheet, 'idle', row, 0), x, y, Z, topo, '#e8dcc0');
  });
  y += passoY + 16;

  texto(ctx, 'EXEMPLO NO JOGO', MARG, y, { cor: OURO, tam: 12, peso: 700 });
  y += 16;
  // O PAINEL SAI DA GEOMETRIA DO LOSANGO, não de um número escolhido a olho.
  //
  // Numa grade 3x3 isométrica cada ladrilho tem MEIA largura `lw`, e a grade
  // vai de `-3lw` a `+3lw` — seis meias larguras, não três ladrilhos. Foi o
  // erro da primeira tentativa, e o losango vazou pela esquerda.
  const zEx = 2;
  const lw = TW * zEx / 2;
  const lh = TH * zEx / 2;
  const pw = lw * 6 + 24;
  const ph = banda * zEx + lh * 5 + 24;
  ctx.fillStyle = '#2a2740';
  ctx.fillRect(MARG, y, pw, ph);
  // A figura sobe acima do ladrilho em que está, então a grade começa uma
  // altura de figura abaixo do topo do painel.
  exemploNoJogo(ctx, logico, sheet, MARG + pw / 2, y + banda * zEx + 12, zEx, topo);

  return c;
}

// ---------------------------------------------------------------------------

const palco = document.getElementById('palco');
const controles = document.getElementById('controles');
const chaves = allLookKeys().sort();
let atual = chaves.includes('goblin') ? 'goblin' : chaves[0];

function render() {
  palco.replaceChildren();
  let c;
  try {
    c = desenharFicha(atual);
  } catch (e) {
    palco.append(el('p', { style: { color: '#e08a6a' } }, `Falhou em "${atual}": ${e.message}`));
    return;
  }
  c.style.cssText = 'display:block;max-width:100%;border-radius:8px';
  palco.append(c);
  palco.append(el('p', { style: { marginTop: '10px' } },
    el('button', {
      style: {
        background: OURO, color: '#1b1610', border: 'none', borderRadius: '6px',
        padding: '7px 14px', font: 'inherit', fontSize: '13px', cursor: 'pointer',
      },
      onclick: () => c.toBlob((b) => {
        const a = el('a', { href: URL.createObjectURL(b), download: `ficha-${atual}.png` });
        a.click();
        URL.revokeObjectURL(a.href);
      }),
    }, 'Baixar a ficha em PNG')));
}

controles.append(
  el('label', {}, 'criatura',
    el('select', {
      onchange: (e) => { atual = e.target.value; render(); },
    }, chaves.map((k) => el('option', { value: k, selected: k === atual }, k)))),
);

render();
// A folha importada chega por `Image`, que é assíncrono: na primeira volta a
// chave ainda devolve a folha pintada. Uma segunda passada pega a importada.
setTimeout(render, 700);
