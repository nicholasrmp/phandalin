// A LISTA EXPANDIDA DO CALDEIRÃO DE TASHA: as magias que o Tasha acrescenta à lista de cada classe (a "Additional Spells"
// de cada uma), venham elas do PHB, do Xanathar ou do próprio Tasha. No dado do 5etools (`spells/sources.json`) elas são as
// entradas `classVariant` com `definedInSource: 'TCE'`. Escreve `src/rules/magias-por-classe-tce-expandida.js`
// (magia -> classes), que `game/criacao.js` soma às listas. O id de cada magia sai do de-para inglês -> id
// (`bestiario/magias-en.json`); a magia que o jogo não tem (as que ficaram na fila) fica de fora, e o script diz quais.
//
//   node src/dev/lista-expandida-tce.mjs
import fs from 'node:fs';

const RAIZ = new URL('../../', import.meta.url);
const ler = (p) => JSON.parse(fs.readFileSync(new URL(p, RAIZ), 'utf8'));
const fontes = ler('_referencias/5etools/spells/sources.json');
const dePara = ler('src/dev/bestiario/magias-en.json');
const CLASSE = { Bard: 'bardo', Cleric: 'clerigo', Druid: 'druida', Paladin: 'paladino', Ranger: 'patrulheiro', Sorcerer: 'feiticeiro', Warlock: 'bruxo', Wizard: 'mago' };

const porMagia = {};
const fora = new Set();
for (const magias of Object.values(fontes)) {
  for (const [nome, f] of Object.entries(magias)) {
    for (const c of f.classVariant ?? []) {
      if (c.definedInSource !== 'TCE' || c.source !== 'PHB' || !CLASSE[c.name]) continue;
      const id = dePara[nome.toLowerCase()];
      if (!id) { fora.add(nome); continue; }
      porMagia[id] = [...new Set([...(porMagia[id] ?? []), CLASSE[c.name]])];
    }
  }
}
const ordenado = Object.fromEntries(Object.entries(porMagia).sort(([a], [b]) => a.localeCompare(b)));
fs.writeFileSync(new URL('src/rules/magias-por-classe-tce-expandida.js', RAIZ),
  '// GERADO por src/dev/lista-expandida-tce.mjs: a lista expandida do Caldeirão de Tasha (magia -> classes que a ganham).\n'
  + `export const LISTA_EXPANDIDA_TCE = ${JSON.stringify(ordenado, null, 1)};\n`);
const n = Object.values(ordenado).reduce((s, v) => s + v.length, 0);
console.log(`${Object.keys(ordenado).length} magias, ${n} entradas de classe; fora do jogo: ${[...fora].join(', ') || 'nenhuma'}`);
