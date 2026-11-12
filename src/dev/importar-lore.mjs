// O IMPORTADOR DA LORE: `src/dev/lore/lore-pt.json` (de `traduzir-lore.mjs`, os fatos com as nossas palavras) vira
// `src/rules/lore-livros.js`, que `rules/lore.js` lê. Confere as CDs (10, 15, 20, 25) e diz quais ligações de criatura
// (`lore.js POVOS`) apontam para chave ou grupo que não existe — a ligação errada não pode passar calada.
//
//   node src/dev/importar-lore.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const pt = JSON.parse(fs.readFileSync(path.join(RAIZ, 'src/dev/lore/lore-pt.json'), 'utf8'));
const CDS = [10, 15, 20, 25];
const saida = {};
let fatos = 0;
for (const [chave, e] of Object.entries(pt).sort(([a], [b]) => a.localeCompare(b))) {
  const fs2 = (e.fatos ?? []).map((f) => ({ cd: CDS.reduce((m, c) => (Math.abs(c - f.cd) < Math.abs(m - f.cd) ? c : m), 10), texto: String(f.texto).trim() }))
    .filter((f) => f.texto);
  fatos += fs2.length;
  saida[chave] = { chave, tipo: e.tipo, fonte: e.fonte, grupo: e.grupo ?? null, nomeEn: e.nomeEn, nome: e.nome, resumo: e.resumo, fatos: fs2, palavras: e.palavras ?? [] };
}
const js = `// GERADO por src/dev/importar-lore.mjs — não editar à mão. A lore dos livros (o SCAG, o VGM, o MTF, o FTD e o BGG, e os
// deuses do PHB) em FATOS com as nossas palavras, em camadas de CD; o texto vem de src/dev/lore/lore-pt.json.
export const LORE_DOS_LIVROS = ${JSON.stringify(saida, null, 1)};
`;
fs.writeFileSync(path.join(RAIZ, 'src/rules/lore-livros.js'), js);
const porTipo = {};
for (const e of Object.values(saida)) porTipo[e.tipo] = (porTipo[e.tipo] ?? 0) + 1;
console.log(`${Object.keys(saida).length} entradas (${Object.entries(porTipo).map(([k, v]) => `${k} ${v}`).join(', ')}), ${fatos} fatos.`);

const { POVOS, entradas } = await import(pathToFileURL(path.join(RAIZ, 'src/rules/lore.js')).href);
const quebradas = POVOS.flatMap((p) => p.lore).filter((k) => !entradas(k).length);
if (quebradas.length) { console.log(`LIGAÇÃO SEM ENTRADA (${quebradas.length}): ${quebradas.join(', ')}`); process.exitCode = 1; }
