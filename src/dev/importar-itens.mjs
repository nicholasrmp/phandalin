// O IMPORTADOR DOS ITENS MÁGICOS DE UM LIVRO. Junta três coisas e escreve duas:
//   o TEXTO   `src/dev/itens/<livro>-pt.json` (nome oficial brasileiro e a descrição com as nossas palavras, de
//             `traduzir-itens.mjs`);
//   o que o jogo JÁ TEM  `src/dev/itens/ja-temos.json` (de `casar-itens.mjs`), que fica de fora;
//   a REGRA   `src/dev/itens/ajustes-<livro>.mjs`, a tabela escrita à mão: o item entra com a mecânica dela, ou vai para
//             a fila com o motivo.
// e escreve `src/rules/items/livro-<livro>.js` (que entra em `ITEMS` antes dos itens feitos à mão: o feito à mão vence)
// e `src/dev/itens/<livro>-pendente.json` (a fila do motor). A raridade, a sintonia e o peso vêm do dado do livro.
//
//   node src/dev/importar-itens.mjs dmg
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const livro = (process.argv[2] ?? 'dmg').toLowerCase();
const FONTE = livro.toUpperCase();
const ler = (p) => JSON.parse(fs.readFileSync(path.join(RAIZ, p), 'utf8'));

const pt = ler(`src/dev/itens/${livro}-pt.json`);
const ja = ler('src/dev/itens/ja-temos.json');
const { AJUSTES } = await import(pathToFileURL(path.join(RAIZ, `src/dev/itens/ajustes-${livro}.mjs`)).href);
const dado = ler('_referencias/5etools/itens/items.json').item.filter((x) => x.source === FONTE);
const variantes = fs.existsSync(path.join(RAIZ, '_referencias/5etools/itens/magicvariants.json'))
  ? ler('_referencias/5etools/itens/magicvariants.json').magicvariant ?? [] : [];
const doLivro = (en) => dado.find((x) => x.name === en) ?? variantes.find((x) => x.name === en && x.inherits?.source === FONTE)?.inherits ?? {};

const RARIDADE = { common: 'comum', uncommon: 'incomum', rare: 'raro', 'very rare': 'muito raro', legendary: 'lendário', artifact: 'artefato' };
const { ITEMS } = await import(pathToFileURL(path.join(RAIZ, 'src/rules/items/index.js')).href);

// O NOME NA CAIXA DO CATÁLOGO: o jogo escreve "Anel de proteção", "Manto élfico" (só a primeira letra em maiúscula,
// fora nome próprio); a tradução vem em caixa de título ("Anel de Evasão"). O `nome` da tabela vale por cima.
const PROPRIOS = new Set(['Kas', 'Vecna', 'Orcus', 'Daern', 'Kwalish', 'Nolzur', 'Quaal', 'Bilarro', 'Keoghtom', 'Ehlonna', 'Valhalla', 'Netheril']);
const casoDeFrase = (nome) => nome.split(' ').map((p, i) => {
  if (i === 0) return p.charAt(0).toUpperCase() + p.slice(1);
  const limpo = p.replace(/[(),]/g, '');
  return PROPRIOS.has(limpo) ? p : p.toLowerCase();
}).join(' ');

const saida = {};
const pendente = { _nota: `Os itens do ${FONTE} que não entraram no jogo, e por quê. Gerado por src/dev/importar-itens.mjs; a regra é src/dev/itens/ajustes-${livro}.mjs.` };
const semTabela = [];
const MECANICA = ['passivo', 'conjura', 'recarregavel', 'consumivel', 'condicao', 'rodadas', 'remove', 'curaDoenca', 'acao', 'cura', 'pilha',
  // a arma e a armadura que se equipam pela `base` (`items/index.js armaNomeada`), com o poder delas (`combat.js poderDaArma`)
  'base', 'bonusAtaque', 'bonusDano', 'poder', 'propsExtra', 'alcance', 'acBonusArmadura'];
for (const en of Object.keys(pt).sort()) {
  if (ja[en]) continue;
  const aj = AJUSTES[en];
  if (!aj) { semTabela.push(en); continue; }
  if (aj.fora) { pendente[en] = { nome: pt[en].nome, motivo: aj.fora }; continue; }
  if (ITEMS[aj.id] && !String(ITEMS[aj.id].fonte ?? '').startsWith('livro')) throw new Error(`${en}: o id ${aj.id} já é de um item feito à mão`);
  const x = doLivro(en);
  const item = {
    id: aj.id, name: aj.nome ?? casoDeFrase(pt[en].nome), tipo: aj.tipo ?? 'maravilhoso', art: aj.art ?? 'arcano', pilha: false,
    raridade: RARIDADE[x.rarity] ?? 'raro', sintonia: Boolean(x.reqAttune), peso: x.weight ?? (aj.tipo === 'poção' ? 0.5 : 1),
    desc: `${pt[en].desc.trim()} No jogo: ${aj.noJogo}`, fonte: `livro-${livro}`, nomeOriginal: en,
  };
  for (const k of MECANICA) if (aj[k] !== undefined) item[k] = aj[k];
  saida[aj.id] = item;
}
// a entrada da tabela sem tradução (nome errado na tabela) não pode passar calada
const sobra = Object.keys(AJUSTES).filter((en) => !pt[en]);
if (sobra.length) throw new Error(`na tabela e sem tradução: ${sobra.join('; ')}`);

const js = `// GERADO por src/dev/importar-itens.mjs ${livro} — não editar à mão. A regra de cada item mora em
// src/dev/itens/ajustes-${livro}.mjs, o texto em src/dev/itens/${livro}-pt.json (as nossas palavras, nunca a prosa do livro).
// O que ficou de fora, e por quê, está em src/dev/itens/${livro}-pendente.json.
export const ITENS_LIVRO_${FONTE} = ${JSON.stringify(saida, null, 2)};
`;
fs.writeFileSync(path.join(RAIZ, `src/rules/items/livro-${livro}.js`), js);
fs.writeFileSync(path.join(RAIZ, `src/dev/itens/${livro}-pendente.json`), JSON.stringify(pendente, null, 1) + '\n');
const total = Object.keys(pt).length;
console.log(`${FONTE}: ${total} itens; ${Object.keys(ja).length - 1} o jogo já tinha; entraram ${Object.keys(saida).length}; na fila ${Object.keys(pendente).length - 1}.`);
if (semTabela.length) console.log(`SEM ENTRADA NA TABELA (${semTabela.length}): ${semTabela.join('; ')}`);
