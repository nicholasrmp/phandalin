// Escreve `src/rules/talentos-phb-texto.js`: o nome e a descrição de cada talento do Livro do Jogador, da tradução
// (`src/dev/talentos/phb-pt.json`, escrita por `traduzir-talentos.mjs`), casados pelo nome em inglês com a tabela feita à
// mão (`rules/talentos-phb.js`). O talento que a tabela não tem não entra (o Combatente Montado); o que a tabela tem e a
// tradução não tem é erro.
//
//   node src/dev/importar-talentos.mjs
import fs from 'node:fs';

const RAIZ = new URL('../../', import.meta.url);
const pt = JSON.parse(fs.readFileSync(new URL('src/dev/talentos/phb-pt.json', RAIZ), 'utf8'));
// A tabela importa o texto que este script escreve: na primeira vez ele ainda não existe.
const destino = new URL('src/rules/talentos-phb-texto.js', RAIZ);
if (!fs.existsSync(destino)) fs.writeFileSync(destino, 'export const TEXTO_DOS_TALENTOS_PHB = {};\n');
const { TALENTOS_PHB } = await import(new URL('src/rules/talentos-phb.js', RAIZ).href);

const saida = {};
const faltam = [];
for (const [id, t] of Object.entries(TALENTOS_PHB)) {
  const tx = pt[t.en];
  if (!tx) { faltam.push(t.en); continue; }
  saida[id] = { nome: tx.nome, desc: tx.desc };
}
if (faltam.length) throw new Error(`sem tradução: ${faltam.join(', ')}`);
const fora = Object.keys(pt).filter((en) => !Object.values(TALENTOS_PHB).some((t) => t.en === en));
const nomes = new Map();
for (const [id, t] of Object.entries(saida)) {
  if (nomes.has(t.nome)) throw new Error(`dois talentos com o nome "${t.nome}": ${nomes.get(t.nome)} e ${id}`);
  nomes.set(t.nome, id);
}
fs.writeFileSync(destino, `// GERADO por src/dev/importar-talentos.mjs a partir de src/dev/talentos/phb-pt.json. Não edite à mão.\n`
  + `// O nome e a descrição dos talentos do Livro do Jogador (2014), com as nossas palavras. A regra é a de \`talentos-phb.js\`.\n`
  + `export const TEXTO_DOS_TALENTOS_PHB = ${JSON.stringify(saida, null, 2)};\n`);
console.log(`${Object.keys(saida).length} talentos escritos; fora do jogo: ${fora.join(', ') || 'nenhum'}`);

// o que entrou sem ícone de traço (tema Obsidiana): `inventario-icones.mjs`
(await import('./icones-faltando.mjs')).avisarIconesFaltando('talento');
