// A VISTA DE CIMA do tabuleiro, em canvas 2D. É o mesmo mapa do jogo (`terreno`, `paredes`, `objetos`) visto de
// cima, numa grade de quadrados de `C` pixels. Serve a duas páginas:
//
//   `/topo.html`  — o protótipo que compara a visão de cima com o isométrico;
//   `/editor.html` — a vista em que se ENQUADRA um mapa pintado e se desenha parede e porta em cima dele, como no
//                    Roll20 e no Foundry. O isométrico não serve para isso: mapa pintado é visto de cima.
//
// Nada aqui sabe de mouse nem de painel: recebe o campo (`Battlefield`), o mapa e o contexto, e pinta.

import { ARESTA } from '../core/grid.js';
import { SUPERFICIE } from './board.js';
import { sorteio } from '../art/chao.js';

const COR_PADRAO = ['#3a3630', '#36322c'];
const corDoChao = (sup) => SUPERFICIE[sup]?.topo ?? COR_PADRAO;

/** Quantos pixels da imagem de fundo valem um pixel da tela, no zoom atual. */
export const escalaDoFundo = (fundo, C) => C / (fundo?.escala || 1);

// Uma `Image` mede por `naturalWidth`, um canvas por `width`. `pintarFundo` recebe os dois: a pintura é uma
// imagem, e a máscara da camada de frente é um canvas desenhado a partir dela.
const largura = (im) => im?.naturalWidth || im?.width || 0;
const altura = (im) => im?.naturalHeight || im?.height || 0;

/**
 * A imagem de fundo deitada na grade: `fundo.escala` pixels da imagem por casa, `fundo.x0/y0` dizendo onde cai,
 * em pixels da imagem (já girada), o canto da casa (0,0), e `fundo.giro` em graus (0, 90, 180 ou 270).
 */
export function pintarFundo(ctx, img, fundo, C) {
  if (!largura(img) || !fundo) return false;
  const k = escalaDoFundo(fundo, C);
  const iw = largura(img) * k;
  const ih = altura(img) * k;
  ctx.save();
  ctx.globalAlpha = fundo.opacidade ?? 1;
  ctx.imageSmoothingEnabled = true;
  ctx.translate(-fundo.x0 * k, -fundo.y0 * k);
  ctx.rotate(((fundo.giro ?? 0) * Math.PI) / 180);
  const canto = { 0: [0, 0], 90: [0, -ih], 180: [-iw, -ih], 270: [-iw, 0] }[fundo.giro ?? 0] ?? [0, 0];
  ctx.drawImage(img, canto[0], canto[1], iw, ih);
  ctx.restore();
  return true;
}

// ------------------------------------------------------------------------------- camada de sobreposição ---

/**
 * AS SOBREPOSIÇÕES: pedaços de arte com nome, deitados num retângulo de casas, que o roteiro ACENDE E APAGA.
 *
 * É o que um mapa do Foundry faz com ladrilho comutável — a fogueira que se acende, a ponte que cede, o baú que
 * abre, o túnel que desaba, a enxurrada que desce. Lá o mestre dá um duplo clique num ladrilho invisível e o
 * Monk's Active Tile Triggers liga a arte etiquetada; aqui não há mestre, então quem liga é o `aoInteragir` da
 * cena, quando o grupo mexe no objeto (`game/interacoes.js`).
 *
 * `frente` escolhe a camada: sem ele, a peça entra logo depois do mapa pintado e as fichas passam POR CIMA dela
 * (chão aceso, destroço, baú aberto); com ele, a peça vai junto da camada de frente e cobre quem está debaixo
 * (a ponte quebrada, que no Foundry vem marcada como ladrilho de teto).
 */
export function pintarSobreposicoes(ctx, imagens, field, C, frente = false) {
  for (const o of field.sobreposicoes ?? []) {
    if (!o.ligada || Boolean(o.frente) !== frente) continue;
    const img = imagens?.get(o.url);
    if (!largura(img)) continue;
    ctx.save();
    if (o.opacidade != null) ctx.globalAlpha = o.opacidade;
    ctx.drawImage(img, o.x * C, o.y * C, o.w * C, o.h * C);
    ctx.restore();
  }
}

// ------------------------------------------------------------------------------------- camada de frente ---

/**
 * A MÁSCARA DA FOLHAGEM, tirada da própria pintura: um canvas do tamanho da imagem em que só a folha fica
 * opaca, pronto para ser deitado na grade pelo mesmo `pintarFundo`.
 *
 * O teste é o de `src/dev/mapa-ermo.py`, que já separa copa de grama por cor: excesso de verde acima de
 * `verde`, brilho abaixo de `escuro`. Por isso a camada de frente não custa arte nenhuma — a copa já está
 * desenhada no mapa, e o que faltava era desenhá-la DUAS vezes, a segunda por cima das fichas.
 *
 * Devolve `null` quando não dá: imagem de outro domínio suja o canvas e `getImageData` lança (é o caso do mapa
 * do Esconderijo, que vem do `files.d20.io`). Aí só valem as casas marcadas à mão.
 */
export function mascaraDaFrente(img, cor = {}) {
  const w = largura(img);
  const h = altura(img);
  if (!w || !h) return null;
  const verdeMin = cor.verde ?? 12;
  const escuroMax = cor.escuro ?? 92;
  const lona = document.createElement('canvas');
  lona.width = w;
  lona.height = h;
  const c = lona.getContext('2d', { willReadFrequently: true });
  c.drawImage(img, 0, 0);
  let quadro;
  try { quadro = c.getImageData(0, 0, w, h); } catch { return null; }
  const p = quadro.data;
  let opacos = 0;
  for (let i = 0; i < p.length; i += 4) {
    const r = p[i];
    const g = p[i + 1];
    const b = p[i + 2];
    if (g - (r + b) / 2 > verdeMin && (r + g + b) / 3 < escuroMax) { opacos += 1; continue; }
    p[i + 3] = 0;
  }
  if (!opacos) return null;
  c.putImageData(quadro, 0, 0);
  return lona;
}

/**
 * A CAMADA DE FRENTE, desenhada DEPOIS das fichas: a folhagem derivada da cor (`mascara`) e, por cima dela, a
 * pintura recortada nas casas que alguém marcou à mão (`frente.casas`, para o beiral que a cor não acha).
 *
 * Quem chama desenha isto antes do véu da escuridão, para a folha escurecer junto com o chão que ela cobre.
 */
export function pintarFrente(ctx, img, mascara, field, C) {
  const fundo = field.fundo;
  if (!fundo) return;
  if (mascara) pintarFundo(ctx, mascara, fundo, C);
  const casas = field.frente?.casas;
  if (!casas || !largura(img)) return;
  ctx.save();
  ctx.beginPath();
  let alguma = false;
  for (let y = 0; y < field.h; y++) {
    for (let x = 0; x < field.w; x++) {
      if (casas[y]?.[x] !== '#') continue;
      ctx.rect(x * C, y * C, C, C);
      alguma = true;
    }
  }
  if (alguma) {
    ctx.clip();
    pintarFundo(ctx, img, fundo, C);
  }
  ctx.restore();
}

/** O chão: a cor que o jogo já usa para cada superfície, variada por casa para não virar um lençol liso. */
export function pintarChao(ctx, field, C) {
  for (let y = 0; y < field.h; y++) {
    for (let x = 0; x < field.w; x++) {
      const cores = corDoChao(field.surfaceAt(x, y));
      ctx.fillStyle = cores[sorteio(x, y, cores.length)];
      ctx.fillRect(x * C, y * C, C, C);
      // pedra maciça (parede de casa inteira, rocha): escurece e põe um chanfro, que é o que dá relevo visto de cima
      if (field.tileAt(x, y) === 1) {
        ctx.fillStyle = 'rgba(0,0,0,.45)';
        ctx.fillRect(x * C, y * C, C, C);
        ctx.strokeStyle = 'rgba(255,255,255,.07)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x * C + 2, y * C + 2, C - 4, C - 4);
      }
    }
  }
}

export function pintarGrade(ctx, field, C, cor = 'rgba(0,0,0,.28)') {
  ctx.strokeStyle = cor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= field.w; x++) { ctx.moveTo(x * C + 0.5, 0); ctx.lineTo(x * C + 0.5, field.h * C); }
  for (let y = 0; y <= field.h; y++) { ctx.moveTo(0, y * C + 0.5); ctx.lineTo(field.w * C, y * C + 0.5); }
  ctx.stroke();
}

const COR_DA_ARESTA = {
  [ARESTA.parede]: '#9ad7ff', [ARESTA.porta]: '#ffb347', [ARESTA.aberta]: '#7bd88f', [ARESTA.seteira]: '#c49cff',
};

/** Uma aresta. `aMostra` desenha como o editor do Foundry: linha fina e colorida, para ver o mapa pintado por baixo. */
export function traco(ctx, x0, y0, x1, y1, codigo, C, aMostra) {
  if (!codigo) return;
  if (aMostra) {
    const cor = COR_DA_ARESTA[codigo] ?? '#fff';
    ctx.strokeStyle = cor; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.fillStyle = cor;
    for (const [px, py] of [[x0, y0], [x1, y1]]) { ctx.beginPath(); ctx.arc(px, py, 3.5, 0, 7); ctx.fill(); }
    return;
  }
  if (codigo === ARESTA.parede || codigo === ARESTA.seteira) {
    ctx.strokeStyle = '#17141a'; ctx.lineWidth = Math.max(5, C * 0.1);
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.strokeStyle = 'rgba(190,180,165,.35)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    if (codigo === ARESTA.seteira) {   // a fresta: um corte claro no meio da parede
      const mx = (x0 + x1) / 2; const my = (y0 + y1) / 2;
      ctx.strokeStyle = '#c9d6e4'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(mx - (y1 - y0) * 0.14, my - (x1 - x0) * 0.14);
      ctx.lineTo(mx + (y1 - y0) * 0.14, my + (x1 - x0) * 0.14);
      ctx.stroke();
    }
    return;
  }
  // porta: a madeira no vão, clara quando aberta
  const aberta = codigo === ARESTA.aberta;
  ctx.strokeStyle = '#17141a'; ctx.lineWidth = Math.max(5, C * 0.1);
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.strokeStyle = aberta ? '#6f5a3a' : '#9a6b35'; ctx.lineWidth = Math.max(3, C * 0.07);
  const t = aberta ? 0.3 : 0.86;   // aberta: só os batentes
  const mx = (x0 + x1) / 2; const my = (y0 + y1) / 2;
  ctx.beginPath();
  ctx.moveTo(mx - (x1 - x0) * t / 2, my - (y1 - y0) * t / 2);
  ctx.lineTo(mx + (x1 - x0) * t / 2, my + (y1 - y0) * t / 2);
  ctx.stroke();
}

export function pintarArestas(ctx, field, C, aMostra = false, soPortas = false) {
  ctx.save();
  ctx.lineCap = 'round';
  // `soPortas`: sobre mapa pintado, a parede já está no desenho; só a porta (que abre e fecha) precisa de traço
  const vale = (codigo) => (soPortas && codigo !== ARESTA.porta && codigo !== ARESTA.aberta ? 0 : codigo);
  for (let y = 0; y < field.h; y++) {
    for (let x = 0; x < field.w; x++) {
      const i = y * field.w + x;
      traco(ctx, x * C, y * C, (x + 1) * C, y * C, vale(field.paredeN[i]), C, aMostra);     // a de cima
      traco(ctx, x * C, y * C, x * C, (y + 1) * C, vale(field.paredeO[i]), C, aMostra);     // a da esquerda
    }
  }
  ctx.restore();
}

/**
 * A PAREDE LIVRE, desenhada como foi traçada: polilinhas em casas (com fração), e não degraus da grade.
 *
 * É a diferença entre parecer uma caverna e parecer uma escada de quadrados. Pedra, caverna e destroço são
 * irregulares, e forçá-los na aresta de casa destrói justamente o que os faz parecer o que são. A aresta de casa
 * continua existindo (`paredes`), mas como DERIVADA, para a regra de movimento; quem manda no desenho é o traço.
 */
export function pintarTracos(ctx, tracos, C, aMostra = false) {
  if (!tracos?.length) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const pts of tracos) {
    if (!pts || pts.length < 2) continue;
    ctx.beginPath();
    ctx.moveTo(pts[0][0] * C, pts[0][1] * C);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0] * C, pts[i][1] * C);
    if (aMostra) {
      // sobre um mapa pintado a parede já está desenhada: basta a linha fina, como na camada do editor do Foundry
      ctx.strokeStyle = '#9ad7ff'; ctx.lineWidth = 2.5; ctx.stroke();
      continue;
    }
    ctx.strokeStyle = '#17141a'; ctx.lineWidth = Math.max(5, C * 0.11); ctx.stroke();
    ctx.strokeStyle = 'rgba(190,180,165,.32)'; ctx.lineWidth = 1.5; ctx.stroke();
  }
  ctx.restore();
}

/**
 * Os móveis: o sprite ISOMÉTRICO centrado na casa. É provisório — arte de cima não existe no projeto.
 *
 * `soMarcados` é para quando há MAPA PINTADO por baixo: aí o desenho já mostra a mobília, e repetir o sprite em
 * cima dela desenha tudo duas vezes (a carroça da emboscada é o caso). Só passam os objetos que a cena marcou
 * com `sobreOFundo`, que é como ela diz "este aqui o desenho NÃO tem" — a fogueira do acampamento do Ermo de
 * noite, por exemplo, que é a única luz da cena e some se ninguém a desenhar.
 */
export function pintarMoveis(ctx, mapa, C, atlas, imgAtlas, soMarcados = false) {
  if (!imgAtlas?.complete || !imgAtlas.naturalWidth) return;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = 0.95;
  for (const o of mapa.objetos ?? []) {
    if (o.tipo !== 'prop' || o.variante === 'taverna-nada') continue;
    if (soMarcados && !o.sobreOFundo) continue;
    const f = atlas[`prop-${o.variante}`]?.todas?.[0];
    if (!f) continue;
    const k = Math.min((C * 0.92) / f.w, (C * 0.92) / f.h);
    const w = f.w * k; const h = f.h * k;
    ctx.drawImage(imgAtlas, f.x, f.y, f.w, f.h, o.x * C + (C - w) / 2, o.y * C + (C - h) / 2, w, h);
  }
  ctx.restore();
}

/**
 * A MARCA DO OBJETO INTERAGÍVEL: um anel fino na casa em que o grupo pode mexer (baú, alavanca, poço).
 *
 * Sem ela o objeto existe no menu do botão direito e em lugar nenhum na tela, e ninguém clica no que não vê.
 * Quem é `oculto` não ganha marca — a alavanca atrás da estante existe, mas não se anuncia.
 */
export function pintarInterativos(ctx, field, C, tempo = 0) {
  if (!field.interativos?.size) return;
  const pulso = 0.72 + Math.sin(tempo * 2.2) * 0.16;
  const r = C * 0.33;
  ctx.save();
  for (const o of field.interativos.values()) {
    if (o.oculto) continue;
    const cx = (o.x + 0.5) * C;
    const cy = (o.y + 0.5) * C;
    // o contorno escuro PRIMEIRO: pintado por cima, ele apagava metade do anel quente e a marca sumia no mapa
    ctx.lineWidth = Math.max(4, C * 0.11);
    ctx.strokeStyle = 'rgba(0, 0, 0, .55)';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = Math.max(2, C * 0.055);
    ctx.strokeStyle = `rgba(255, 214, 120, ${pulso.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = `rgba(255, 228, 160, ${(pulso * 0.9).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(1.5, C * 0.055), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * OS BRILHOS DO QUE A ATENÇÃO ACHOU (`app.pontosDoTabuleiro`). Discretos de propósito: o mapa pintado é o que se
 * olha, e o brilho só diz "aqui". Dois desenhos:
 * - o notado (a Percepção passiva viu algo, ou o ponto de exame da cena): uma faísca dourada que respira, sem anel —
 *   o anel é do objeto interagível, e confundir os dois diria que dá para MEXER onde só dá para olhar;
 * - a armadilha descoberta: um losango vermelho tracejado na casa, que é o aviso "não pise".
 * Vão por baixo do véu: o que o grupo não enxerga não brilha.
 */
export function pintarPontos(ctx, pontos, C, tempo = 0) {
  if (!pontos?.length) return;
  ctx.save();
  for (const p of pontos) {
    const cx = (p.x + 0.5) * C;
    const cy = (p.y + 0.5) * C;
    if (p.tipo === 'armadilha') {
      const r = C * 0.36;
      ctx.setLineDash([C * 0.09, C * 0.07]);
      ctx.lineDashOffset = -tempo * C * 0.3;
      ctx.lineWidth = Math.max(2, C * 0.05);
      ctx.strokeStyle = 'rgba(0, 0, 0, .5)';
      ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r, cy); ctx.closePath(); ctx.stroke();
      ctx.lineWidth = Math.max(1.5, C * 0.03);
      ctx.strokeStyle = 'rgba(235, 90, 70, .9)';
      ctx.stroke();
      ctx.setLineDash([]);
      continue;
    }
    const fase = (p.x * 1.7 + p.y * 2.3) % 6.28;
    const a = 0.35 + 0.3 * Math.sin(tempo * 2.4 + fase);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, C * 0.32);
    g.addColorStop(0, `rgba(255, 236, 170, ${(a * 0.9).toFixed(3)})`);
    g.addColorStop(0.35, `rgba(255, 210, 120, ${(a * 0.35).toFixed(3)})`);
    g.addColorStop(1, 'rgba(255, 200, 100, 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, C * 0.32, 0, Math.PI * 2); ctx.fill();
    // a faísca: quatro pontas finas
    ctx.strokeStyle = `rgba(255, 246, 210, ${Math.min(1, a + 0.25).toFixed(3)})`;
    ctx.lineWidth = Math.max(1, C * 0.018);
    const k = C * (0.1 + 0.03 * Math.sin(tempo * 3.1 + fase));
    ctx.beginPath(); ctx.moveTo(cx - k, cy); ctx.lineTo(cx + k, cy); ctx.moveTo(cx, cy - k); ctx.lineTo(cx, cy + k); ctx.stroke();
  }
  ctx.restore();
}

// ------------------------------------------------------------------------------------------------- pontaria ---

/** A casa sob o ponto (em pixels da tela), ou null fora do mapa. */
export function casaNoPonto(field, C, px, py) {
  const x = Math.floor(px / C);
  const y = Math.floor(py / C);
  return x >= 0 && y >= 0 && x < field.w && y < field.h ? { x, y } : null;
}

/**
 * A aresta mais perto do ponto, entre as quatro da casa apontada. Devolve `{ x, y, lado }` no mesmo formato do
 * editor: 'N' é a borda de cima da casa (x,y) e 'O' a da esquerda.
 */
export function arestaNoPonto(w, h, C, px, py) {
  const cx = px / C; const cy = py / C;
  const x = Math.floor(cx); const y = Math.floor(cy);
  if (x < 0 || y < 0 || x >= w || y >= h) return null;
  const fx = cx - x; const fy = cy - y;
  const perto = [
    { x, y, lado: 'N', d: fy },
    { x, y: y + 1, lado: 'N', d: 1 - fy },
    { x, y, lado: 'O', d: fx },
    { x: x + 1, y, lado: 'O', d: 1 - fx },
  ].filter((a) => a.x < w && a.y < h && !(a.lado === 'N' && a.y === 0) && !(a.lado === 'O' && a.x === 0));
  perto.sort((a, b) => a.d - b.d);
  return perto[0] ?? null;
}
