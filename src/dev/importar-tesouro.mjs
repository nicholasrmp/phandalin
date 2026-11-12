// AS TABELAS DE TESOURO DO LIVRO DO MESTRE (o tesouro individual e o do covil, por ND; as gemas e os objetos de arte;
// as tabelas de item mágico A a I) viram `src/rules/tesouro-tabelas.js`, já com o id do JOGO no lugar do nome do livro.
// O sorteio é `rules/tesouro.js`.
//
//   node src/dev/importar-tesouro.mjs
//
// O dado vem do espelho do 5etools (`_referencias/5etools/outros/loot.json`, fora do repositório). O nome do item do livro
// casa com o do jogo por `itens/ja-temos.json`, pelo `nomeOriginal` dos itens importados e pelas regras abaixo (o livro
// escreve "+1 chain mail" e o jogo tem `cotaDeMalhaMais1`). O que pede sorteio na hora (a arma +1 de base qualquer, a
// poção de resistência de tipo qualquer) vira uma FICHA (`{ ficha: ... }`). O item que o jogo não tem vira `null`, e o
// sorteio rola de novo na mesma tabela; o relatório no fim diz quantas linhas são assim.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ler = (p) => JSON.parse(fs.readFileSync(path.join(RAIZ, p), 'utf8'));
const loot = ler('_referencias/5etools/outros/loot.json');
const ja = ler('src/dev/itens/ja-temos.json');
const { ITEMS, WEAPONS, ARMORS, SHIELDS } = await import(pathToFileURL(path.join(RAIZ, 'src/rules/items/index.js')).href);

const existe = (id) => Boolean(ITEMS[id] || WEAPONS[id] || ARMORS[id] || SHIELDS[id]);
const porMinusculo = new Map(Object.entries(ja).filter(([k]) => k !== '_nota').map(([k, v]) => [k.toLowerCase(), v]));
for (const d of [...Object.values(ITEMS), ...Object.values(WEAPONS), ...Object.values(ARMORS)]) {
  if (d.nomeOriginal) porMinusculo.set(d.nomeOriginal.toLowerCase(), d.id);
}
const ARMADURA_EN = {
  padded: 'acolchoada', 'padded armor': 'acolchoada', leather: 'couro', 'leather armor': 'couro', 'studded leather': 'couroBatido',
  'studded leather armor': 'couroBatido', hide: 'peleDeAnimal', 'hide armor': 'peleDeAnimal', 'chain shirt': 'camisaoDeMalha',
  'scale mail': 'brunea', breastplate: 'peitoral', 'half plate': 'meiaArmadura', 'half plate armor': 'meiaArmadura', 'ring mail': 'malhaDeAneis',
  'chain mail': 'cotaDeMalha', splint: 'brigantina', 'splint armor': 'brigantina', plate: 'placas', 'plate armor': 'placas',
};
const GIGANTE = { Hill: 'DaColina', Stone: 'DePedra', Frost: 'DoGelo', Fire: 'DoFogo', Cloud: 'DasNuvens', Storm: 'DasTempestades' };

/** O nome do livro → o id do jogo, uma ficha de sorteio, ou null. */
function resolver(nome) {
  const n = nome.trim();
  const baixo = n.toLowerCase();
  let m;
  if ((m = n.match(/^\+(\d) Weapon$/i))) return { ficha: 'arma', n: Number(m[1]) };
  if ((m = n.match(/^\+(\d) Ammunition$/i))) return `municaoMais${m[1]}`;
  if ((m = n.match(/^\+(\d) Shield$/i))) return `escudoMais${m[1]}`;
  if ((m = n.match(/^\+(\d) (.+?)$/)) && ARMADURA_EN[m[2].toLowerCase()]) return `${ARMADURA_EN[m[2].toLowerCase()]}Mais${m[1]}`;
  if ((m = n.match(/^\+(\d) Armor$/i))) return { ficha: 'armadura', n: Number(m[1]) };
  if ((m = n.match(/^(.+) of Resistance$/)) && ARMADURA_EN[m[1].toLowerCase()]) return { ficha: 'armaduraDeResistencia', base: ARMADURA_EN[m[1].toLowerCase()] };
  if (/^Armor of Resistance$/i.test(n)) return { ficha: 'armaduraDeResistencia' };
  if (/^Potion of Resistance$/i.test(n)) return { ficha: 'pocaoDeResistencia' };
  if (/^Ring of Resistance$/i.test(n)) return { ficha: 'anelDeResistencia' };
  if (/^Dragon Scale Mail$/i.test(n)) return { ficha: 'escamas' };
  if (/^Armor of Vulnerability$/i.test(n)) return { ficha: 'vulnerabilidade' };
  if (/^Adamantine /i.test(n)) return 'armaduraAdamantina';
  if (/^Mithral Armor$/i.test(n)) return 'armaduraDeMithral';
  if (/rod of the pact keeper/i.test(n)) return 'cetroDoGuardiaoDoPacto';
  if (/wand of the war mage/i.test(n)) return 'varinhaDoMagoDeGuerra';
  if (/^Spell Scroll/i.test(n)) return 'pergaminhoDeMagia';
  if (/^Horn of Valhalla/i.test(n)) return 'trompaDeValhalla';
  if (/^Figurine of Wondrous Power/i.test(n)) return 'figuraDePoderMaravilhoso';
  if (/^Potion of Giant Strength$/i.test(n)) return 'pocaoDeForcaDeGigante';
  // as famílias que o jogo tem como peça genérica
  for (const [re, id] of [[/^Carpet of Flying/i, 'tapeteVoador'], [/^Elemental Gem/i, 'gemaElemental'], [/^Quaal's Feather Token/i, 'fichaDePenaDeQuaal'],
    [/^Manual of Golems/i, 'manualDoGolemDeCarne'], [/^Arrow of Slaying/i, 'flechaAssassina']]) if (re.test(n)) return id;
  if (/Giant Strength/.test(n) && /Belt/.test(n)) {
    const quais = Object.keys(GIGANTE).filter((g) => n.includes(g)).map((g) => `cintoDoGigante${GIGANTE[g]}`);
    return quais.length === 1 ? quais[0] : { ficha: 'umDe', ids: quais };
  }
  const id = porMinusculo.get(baixo);
  return id && existe(id) ? id : null;
}
const tirar = (s) => String(s ?? '').replace(/\{@item ([^}|]*)[^}]*\}/g, '$1');

const semCasa = new Set();
const MAGICOS = {};
for (const t of loot.magicItems) {
  MAGICOS[t.type] = t.table.map((r) => {
    const nome = r.choose?.fromGroup?.[0] ?? r.choose?.fromGeneric?.[0] ?? tirar(r.item);
    // `fromItems`: o livro lista as escolhas (as duas trompas, os dois cintos); as que o jogo tem viram sorteio
    const escolhas = (r.choose?.fromItems ?? []).map(resolver).filter((x) => typeof x === 'string');
    const id = escolhas.length > 1 ? { ficha: 'umDe', ids: escolhas } : resolver(nome);
    if (!id) semCasa.add(nome);
    return { min: r.min, max: r.max ?? r.min, id, ...(r.spellLevel != null ? { circulo: r.spellLevel } : {}) };
  });
}
const INDIVIDUAL = loot.individual.filter((t) => t.source === 'DMG').map((t) => ({
  ndMin: t.crMin, ndMax: t.crMax, linhas: t.table.map((r) => ({ min: r.min, max: r.max, moedas: r.coins })),
}));
const COVIL = loot.hoard.filter((t) => t.source === 'DMG').map((t) => ({
  ndMin: t.crMin, ndMax: t.crMax, moedas: t.coins,
  linhas: t.table.map((r) => ({
    min: r.min, max: r.max,
    ...(r.gems ? { gemas: { valor: r.gems.type, qtd: r.gems.amount } } : {}),
    ...(r.artObjects ? { arte: { valor: r.artObjects.type, qtd: r.artObjects.amount } } : {}),
    ...(r.magicItems ? { magicos: r.magicItems.map((m) => ({ tabela: m.type, qtd: m.amount })) } : {}),
  })),
}));

const js = `// GERADO por src/dev/importar-tesouro.mjs — não editar à mão. As tabelas de tesouro do Livro do Mestre (o número é do
// livro), com o id do jogo no lugar do nome do item; \`null\` é o item que o jogo não tem (o sorteio rola de novo), e
// \`{ ficha }\` é o que se sorteia na hora (\`rules/tesouro.js\`).
export const TESOURO_INDIVIDUAL = ${JSON.stringify(INDIVIDUAL)};
export const TESOURO_DO_COVIL = ${JSON.stringify(COVIL)};
export const ITENS_MAGICOS_POR_TABELA = ${JSON.stringify(MAGICOS, null, 1)};
`;
fs.writeFileSync(path.join(RAIZ, 'src/rules/tesouro-tabelas.js'), js);
const linhas = Object.values(MAGICOS).flat();
console.log(`tabelas de item mágico: ${linhas.length} linhas, ${linhas.filter((l) => l.id).length} com item do jogo, ${linhas.filter((l) => !l.id).length} sem (rolam de novo).`);
console.log(`sem casa (${semCasa.size}): ${[...semCasa].sort().join('; ')}`);
