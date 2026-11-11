// AS PÁGINAS DE ÍCONES para o OpenArt: agrupa as chaves de 8 em 8 (grade 4×2, 16:9) e escreve o pedido de cada página
// com as regras de estilo que o teste validou (revisoes/interface-2026-11-09.md: a segunda página de teste, 6 de 8
// dentro dos limites da coleção e 5 indistinguíveis dela no teste cego).
//
//   node src/dev/paginas-icones-openart.mjs <assuntos.json> <saida.json> [--so chave1,chave2,...]
//
// `assuntos.json` = { chave: "o que o ícone mostra, em inglês" }; a saída é [{ n, chaves, prompt }], na ordem. O modelo
// é o Nano Banana 2 Lite (15 créditos a página) com a folha de referência de traço médio (`referencia-2.png`).

import fs from 'node:fs';

const [arqAssuntos, saida] = process.argv.slice(2);
const so = process.argv.includes('--so') ? new Set(process.argv[process.argv.indexOf('--so') + 1].split(',')) : null;
const assuntos = JSON.parse(fs.readFileSync(arqAssuntos, 'utf8'));
const chaves = Object.keys(assuntos).filter((k) => !so || so.has(k));

const ESTILO = 'A game icon sheet in EXACTLY the same style and layout as the reference image: 8 icons in a grid of 4 columns by 2 rows on a pure white background, each icon centered in its own invisible cell, all the same size (about two thirds of the cell), generous white space between cells. STYLE RULES, same as the reference: every icon is a SOLID FILLED BLACK SILHOUETTE made of thick bold shapes; minimum line or limb thickness about 6% of the icon width, no thin lines anywhere; flat orthographic view (straight front or straight side), no 3D tilt, no perspective, no ellipses; no concentric rings, no ripple lines, no spirals with more than two turns; at most two small secondary parts per icon and each one chunky, no motion lines, no droplets, no sparkle dust; white is used only as a few bold cut-out details inside the black shapes; no gray, no shading, no gradients, no outline-only drawings, no text, no letters, no numbers, no frames, nothing crossing into another cell. Must read clearly at 20 pixels. The 8 icons, left to right, top row then bottom row: ';

const paginas = [];
for (let i = 0; i < chaves.length; i += 8) {
  const grupo = chaves.slice(i, i + 8);
  // a última página incompleta repete as primeiras chaves dela para fechar a grade de 8 (a repetição é descartada)
  while (grupo.length < 8) grupo.push(grupo[grupo.length % Math.max(1, grupo.length)]);
  const lista = grupo.map((k, j) => `${j + 1}) ${String(assuntos[k]).replace(/\s+/g, ' ').replace(/\.$/, '')}`).join('; ');
  paginas.push({ n: paginas.length + 1, chaves: grupo, prompt: `${ESTILO}${lista}.` });
}
fs.writeFileSync(saida, JSON.stringify(paginas, null, 1));
console.log(`${chaves.length} chaves em ${paginas.length} páginas (${paginas.length * 15} créditos) -> ${saida}`);
