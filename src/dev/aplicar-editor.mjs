// FECHA A VOLTA do editor para o jogo: pega o JSON que o `/editor.html` exporta e imprime o bloco de JavaScript
// pronto para colar em `game/encounter.js`, já com as aspas, a vírgula e a indentação do arquivo.
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/aplicar-editor.mjs ~/Downloads/rua.json
//   node --import ./src/dev/cena-node/register.mjs src/dev/aplicar-editor.mjs ~/Downloads/rua.json --tudo
//
// Por que IMPRIMIR e não reescrever o arquivo sozinho: os mapas do jogo moram em formas diferentes — a Rua e o
// Ermo são vetores de texto em `encounter.js`, a Casa da Morte sai de `casadamorte-plantas.js`, a Onda Eco é
// gerada por um script Python a partir da imagem. Um "escreva de volta" genérico teria de entender as quatro, e
// erraria calado na quinta. Imprimir o bloco deixa a decisão de onde colar com quem sabe.
//
// Por padrão sai só o que MUDOU em relação à cena que o arquivo diz ser (o editor guarda `fundo.nome`, e o nome
// do arquivo costuma ser o da cena): não adianta reimprimir 14 linhas de terreno idênticas quando a edição foi
// desenhar três paredes. Com `--tudo`, sai tudo.
import fs from 'node:fs';
import path from 'node:path';
import { mapaDo } from '../game/encounter.js';

const args = process.argv.slice(2);
const tudo = args.includes('--tudo');
const arquivo = args.find((a) => !a.startsWith('--'));
if (!arquivo) {
  console.error('uso: aplicar-editor.mjs <arquivo.json> [--tudo]');
  process.exit(1);
}

const novo = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
const cena = path.basename(arquivo).replace(/\.json$/i, '');
let velho = null;
try { velho = mapaDo(cena); } catch { velho = null; }
if (!velho) console.log(`// (não achei a cena "${cena}" — sai tudo, porque não há com o que comparar)`);

const iguais = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
// `limpar` devolve lista vazia onde a cena não tinha nada (`grades: []`, `vaoUnido: []`): isso não é mudança,
// é o formato do editor, e imprimi-lo só suja o bloco que alguém vai colar.
const vazio = (v) => v == null || (Array.isArray(v) && !v.length) || (typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length);
const mudou = (k) => (tudo || !velho || !iguais(novo[k], velho[k])) && !(vazio(novo[k]) && vazio(velho?.[k]));

const linhasDeTexto = (nome, v) => `${nome}: [\n${v.map((l) => `  '${l}',`).join('\n')}\n],`;

if (mudou('terreno')) {
  console.log(linhasDeTexto('terreno', novo.terreno));
  console.log();
}
if (mudou('paredes') && novo.paredes) {
  console.log('paredes: {');
  for (const lado of ['n', 'o']) {
    if (!novo.paredes[lado]) continue;
    console.log(`  ${lado}: [`);
    for (const l of novo.paredes[lado]) console.log(`    '${l}',`);
    console.log('  ],');
  }
  console.log('},\n');
}
if (mudou('tracos') && novo.tracos?.length) {
  console.log('tracos: [');
  for (const pts of novo.tracos) console.log(`  [${pts.map(([x, y]) => `[${x}, ${y}]`).join(', ')}],`);
  console.log('],\n');
}
for (const k of ['objetos', 'salas', 'folhas', 'grades', 'vaoUnido', 'degraus', 'decor', 'altura', 'grupo', 'fundo', 'frente']) {
  if (!mudou(k) || novo[k] === undefined) continue;
  console.log(`${k}: ${JSON.stringify(novo[k])},\n`);
}
// as regiões (`rules/regioes.js`), uma por linha
if (mudou('regioes') && novo.regioes?.length) {
  console.log('regioes: [');
  for (const r of novo.regioes) console.log(`  ${JSON.stringify(r)},`);
  console.log('],\n');
}

const nada = ['terreno', 'paredes', 'tracos', 'objetos', 'salas', 'folhas', 'grades', 'vaoUnido', 'degraus', 'decor', 'altura', 'grupo', 'fundo', 'frente', 'regioes']
  .every((k) => !mudou(k) || novo[k] === undefined);
if (nada) console.log(`// nada mudou em relação à cena "${cena}".`);
