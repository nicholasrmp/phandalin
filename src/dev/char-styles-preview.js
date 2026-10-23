// FOLHA DE REVISÃO DO ELENCO.
//
// Desenha com o MESMO pintor do jogo — o que aparecer aqui é o que aparece no
// tabuleiro. Cada figura tem um número para ser citada por ele.
//
// As medidas não são declaradas: a altura e a largura saem do alfa do canvas
// depois de pintado, antes do contorno. É assim que dá para pegar uma criatura
// Grande que saiu do tamanho de uma Média, ou um sprite que escreve fora da
// célula e vai sujar o quadro vizinho na folha de sprites.

import { paint } from '../art/draw.js';
import { metrics } from '../art/body.js';
import { CELL_W, CELL_H, OUTLINE } from '../art/sheet.js';
import { PARTY_LOOKS } from '../art/looks/party.js';
import { BESTIARIO_LOOKS } from '../art/looks/bestiario.js';
import { HUMANOIDES_LOOKS } from '../art/looks/humanoides.js';
import { FERAS_LOOKS } from '../art/looks/feras.js';
import { MORTOS_VIVOS_LOOKS } from '../art/looks/mortosvivos.js';
import { ABERRACOES_LOOKS } from '../art/looks/aberracoes.js';
import { NPC_LOOKS } from '../art/looks/npcs.js';
import { DRAGAO_LOOKS } from '../art/looks/dragao.js';
import { MONSTERS } from '../rules/monsters.js';
import { NPCS } from '../rules/npcs.js';

const ESCALA = 3;

const FAMILIAS = [
  ['Grupo jogável', PARTY_LOOKS],
  ['Goblinoides', BESTIARIO_LOOKS],
  ['Humanoides', HUMANOIDES_LOOKS],
  ['Feras', FERAS_LOOKS],
  ['Mortos-vivos', MORTOS_VIVOS_LOOKS],
  ['Aberrações e limo', ABERRACOES_LOOKS],
  ['Dragão', DRAGAO_LOOKS],
  ['NPCs da campanha', NPC_LOOKS],
];

// Nomes do grupo: eles nascem em rules/party.js já instanciados, então aqui
// ficam à mão mesmo.
const NOMES_GRUPO = {
  fighter: 'Dara, guerreira',
  rogue: 'Pip, ladino',
  cleric: 'Brenn, clérigo',
  wizard: 'Ilvan, mago',
};

// Faixas de ELENCO.md §3, em pixels de figura. Valem para quem tem plano
// corporal próprio — aranha, gosma, dragão —, porque aí não há anatomia
// paramétrica para consultar.
const FAIXAS = {
  miúdo: [14, 24],
  miudo: [14, 24],
  pequeno: [38, 45],
  médio: [52, 66],
  medio: [52, 66],
  grande: [66, 75],
};

/**
 * Quanto a figura DEVERIA medir.
 *
 * Para humanoide a resposta não é a categoria de tamanho do D&D: anão e
 * halfling são Médio e Pequeno nas regras, mas quem manda no desenho é a
 * espécie em `body.js`. Comparar contra a categoria acusaria o anão de baixo
 * demais, que é exatamente o que ele tem de ser. O que importa medir é outra
 * coisa: se a marca de silhueta — cimeira, chifre, capuz — foi paga com
 * altura e empurrou a figura para além do corpo que a anatomia pediu.
 */
function esperado(look, size) {
  if (!look.plan && !look.quadruped) {
    try {
      const alvo = metrics(look).total;
      // A folga é assimétrica de propósito. Encolher é postura: o ladino e o
      // goblin agacham, e agachar tira uns 4 px — é o desenho funcionando.
      // Crescer é o defeito: quando a figura passa da anatomia, foi a cimeira,
      // o chifre ou o capuz que comeu altura, e aí o hobgoblin Médio sai mais
      // alto que o ogro Grande.
      return { min: alvo - 7, max: alvo + 4, base: `anatomia pede ${alvo}` };
    } catch {
      /* look sem espécie válida: cai na faixa por categoria */
    }
  }
  const faixa = FAIXAS[size];
  return faixa ? { min: faixa[0], max: faixa[1], base: `${size} pede ${faixa[0]}–${faixa[1]}` } : null;
}

// --- índices: do look para quem o usa ---------------------------------------
const porLook = new Map();
for (const def of Object.values(MONSTERS)) {
  if (def.look) porLook.set(def.look, { nome: def.name, size: def.size ?? 'médio', fonte: def.fonte, tipo: 'monstro' });
}
for (const def of Object.values(NPCS)) {
  const bloco = MONSTERS[def.bloco] ?? MONSTERS[def.blocoSubstituto];
  if (def.look && !porLook.has(def.look)) {
    porLook.set(def.look, {
      nome: def.nome, size: bloco?.size ?? 'médio', fonte: def.fonte, tipo: 'npc', papel: def.papel,
    });
  }
}

// --- desenho e medição -------------------------------------------------------

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
}

/** Pinta uma vista e devolve o canvas ampliado mais a caixa que ela ocupa. */
function vista(look, dir) {
  const cv = document.createElement('canvas');
  cv.width = CELL_W;
  cv.height = CELL_H;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  try {
    paint(ctx, 0, 0, CELL_W, CELL_H, look, dir, { kind: 'idle', frame: 0 });
  } catch (e) {
    return { erro: e.message, caixa: null, canvas: cv };
  }

  // Mede ANTES do contorno: o contorno soma 1 px de cada lado e falsearia tudo.
  const d = ctx.getImageData(0, 0, CELL_W, CELL_H).data;
  let x0 = CELL_W; let y0 = CELL_H; let x1 = -1; let y1 = -1;
  for (let y = 0; y < CELL_H; y++) {
    for (let x = 0; x < CELL_W; x++) {
      if (d[(y * CELL_W + x) * 4 + 3] === 0) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  const caixa = x1 < 0 ? null : { x0, y0, x1, y1, alt: y1 - y0 + 1, larg: x1 - x0 + 1 };

  contornar(cv);
  const out = document.createElement('canvas');
  out.width = CELL_W * ESCALA;
  out.height = CELL_H * ESCALA;
  const octx = out.getContext('2d');
  octx.imageSmoothingEnabled = false;
  octx.drawImage(cv, 0, 0, out.width, out.height);
  out.className = 'fig';
  return { canvas: out, caixa, erro: null };
}

// --- montagem ----------------------------------------------------------------

const raiz = document.getElementById('opcoes');
let n = 0;
const problemas = [];

for (const [titulo, grupo] of FAMILIAS) {
  const chaves = Object.keys(grupo);
  if (!chaves.length) continue;

  const sec = document.createElement('section');
  sec.className = 'card';
  sec.innerHTML = `<h2>${titulo} <span class="qtd">${chaves.length}</span></h2>`;
  const fila = document.createElement('div');
  fila.className = 'fila';
  sec.appendChild(fila);

  for (const chave of chaves) {
    const look = grupo[chave];
    const meta = porLook.get(chave) ?? {};
    n += 1;

    const frente = vista(look, 'front');
    const lado = vista(look, 'side');
    const alt = Math.max(frente.caixa?.alt ?? 0, lado.caixa?.alt ?? 0);
    const size = meta.size ?? (titulo === 'Grupo jogável' ? 'médio' : '—');
    const alvo = esperado(look, size);

    const avisos = [];
    if (frente.erro || lado.erro) avisos.push(['erro', frente.erro ?? lado.erro]);
    if (alvo && alt && (alt < alvo.min || alt > alvo.max)) {
      avisos.push(['faixa', `${alvo.base} px, está com ${alt}`]);
    }
    for (const [rot, v] of [['frente', frente.caixa], ['lado', lado.caixa]]) {
      if (!v) continue;
      if (v.x0 <= 0 || v.x1 >= CELL_W - 1 || v.y0 <= 0) {
        avisos.push(['fora', `escreve na borda da célula na vista de ${rot}`]);
      }
    }
    if (avisos.length) problemas.push({ n, chave, nome: meta.nome ?? chave, avisos });

    const cel = document.createElement('figure');
    cel.className = `cel ${meta.tipo === 'npc' ? 'npc' : meta.tipo === 'monstro' ? 'inimigo' : 'heroi'}`;
    cel.id = `fig-${n}`;

    const par = document.createElement('div');
    par.className = 'par';
    par.appendChild(frente.canvas);
    par.appendChild(lado.canvas);
    cel.appendChild(par);

    const nome = meta.nome ?? NOMES_GRUPO[chave] ?? chave;
    cel.insertAdjacentHTML('beforeend', `
      <figcaption>
        <b><span class="num">${n}</span>${nome}</b>
        <span class="chave">${chave}</span>
        <span class="medida">${size !== '—' ? `${size} · ` : ''}${alt || '?'} px de altura</span>
        ${meta.fonte && meta.fonte !== 'SRD' ? `<span class="fonte">${meta.fonte}</span>` : ''}
        ${avisos.map(([t, m]) => `<span class="aviso ${t}">${m}</span>`).join('')}
      </figcaption>`);
    fila.appendChild(cel);
  }
  raiz.appendChild(sec);
}

// --- resumo no topo ----------------------------------------------------------
const resumo = document.createElement('section');
resumo.className = 'card resumo';
resumo.innerHTML = `
  <h2>${n} figuras · ${problemas.length} com aviso</h2>
  <p class="pitch">
    Cada figura aparece de frente e de lado, porque a câmera gira e as duas vistas
    chegam ao jogador. A altura é medida do alfa, não declarada. Para pedir mudança,
    cite o número.
  </p>
  ${problemas.length ? `<ul class="lista-problemas">${problemas.map((p) => `
    <li><a href="#fig-${p.n}"><b>${p.n}</b> ${p.nome}</a> — ${p.avisos.map(([, m]) => m).join('; ')}</li>`).join('')}</ul>` : ''}
`;
raiz.prepend(resumo);

document.getElementById('tema').addEventListener('click', (e) => {
  document.body.classList.toggle('claro');
  e.target.textContent = document.body.classList.contains('claro') ? 'Fundo escuro' : 'Fundo claro';
});
