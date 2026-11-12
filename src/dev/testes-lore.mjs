// Provas da LORE DO MUNDO (`rules/lore.js`): as entradas dos livros e as facções à mão, as camadas de CD, a ligação de cada
// criatura ao povo dela, o Lembrar sobre a criatura e o que o grupo sabe de um lugar.
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-lore.mjs
import assert from 'node:assert/strict';

const P = new URL('../', import.meta.url).href;
const L = await import(P + 'rules/lore.js');
const { MONSTERS, makeMonster } = await import(P + 'rules/monsters.js');
const { saberDaCriatura } = await import(P + 'game/investigar.js');

let total = 0; let falhas = 0;
async function teste(nome, fn) {
  total += 1;
  try { await fn(); console.log(`ok    ${nome}`); } catch (e) { falhas += 1; console.log(`FALHA ${nome}\n      ${String(e.stack ?? e).split('\n').slice(0, 3).join('\n      ')}`); }
}

await teste('Toda entrada tem nome, resumo e fatos com CD de 10 a 25, e as cinco facções estão lá', () => {
  const entradas = Object.values(L.LORE);
  assert.ok(entradas.length > 200, `só ${entradas.length}`);
  for (const e of entradas) {
    assert.ok(e.nome && e.resumo, e.chave);
    assert.ok(e.fatos.length >= 2, `${e.chave}: ${e.fatos.length} fatos`);
    for (const f of e.fatos) assert.ok([10, 15, 20, 25].includes(f.cd) && f.texto.length > 10, `${e.chave}: ${f.cd}`);
  }
  for (const f of ['harpistas', 'ordemDaManopla', 'enclaveEsmeralda', 'aliancaDosLordes', 'zhentarim']) assert.ok(L.LORE[`faccao:${f}`], f);
  for (const k of ['deus:tymora', 'lugar:neverwinter', 'povo:goblinoidsTheConqueringHost', 'povo:greenDragons']) assert.ok(L.LORE[k], k);
});

await teste('Toda ligação de criatura aponta para lore que existe, e casa com criatura de verdade do bestiário', () => {
  for (const p of L.POVOS) {
    for (const k of p.lore) assert.ok(L.entradas(k).length, `ligação sem entrada: ${k}`);
    const casa = Object.entries(MONSTERS).some(([id, m]) => (p.id && p.id.test(id)) || (p.tipo && m.tipo === p.tipo));
    assert.ok(casa, `nenhuma criatura casa com ${p.lore.join(',')}`);
  }
});

await teste('O goblin, o hobgoblin e o bugbear leem os goblinoides; o orc não pega Orcus; o meio-dragão não é dragão', () => {
  for (const id of ['goblin', 'hobgoblin', 'bugbear']) assert.equal(L.loreDaCriatura({ defId: id })[0]?.grupo, 'goblinoidsTheConqueringHost', id);
  assert.equal(L.loreDaCriatura({ defId: 'orc' })[0]?.grupo, 'orcsTheGodsworn');
  assert.notEqual(L.loreDaCriatura({ defId: 'orcus', tipo: 'corruptor' })[0]?.grupo, 'orcsTheGodsworn');
  assert.equal(L.loreDaCriatura({ defId: 'veteranoMeioDragaoVermelho', tipo: 'humanoide' }).length, 0);
  assert.equal(L.loreDaCriatura({ defId: 'dragaoVerdeJovem', tipo: 'dragão' })[0]?.chave, 'povo:greenDragons');
  assert.equal(L.loreDaCriatura({ defId: 'giganteDoGelo', tipo: 'gigante' })[0]?.tipo, 'povo');
});

await teste('As camadas: quem tira mais sabe mais, e nunca o que passa do total', () => {
  const g = L.loreDaCriatura({ defId: 'goblin' });
  const pouco = L.fatosAte(g, 12);
  const muito = L.fatosAte(g, 25);
  assert.ok(pouco.length >= 1 && pouco.every((f) => f.cd <= 12));
  assert.ok(muito.some((f) => f.cd >= 20), 'quem tirou 25 não soube nada raro');
  assert.equal(L.fatosAte(g, 9).length, 0);
});

await teste('O Lembrar sobre a criatura: o bloco e, com o total, a lore do povo', async () => {
  const { opcaoDeLembrarCriatura } = await import(P + 'game/investigar.js');
  const m = makeMonster('hobgoblin', { x: 3, y: 3 });
  const linhasBloco = saberDaCriatura(m);
  // a opção monta o achado com o total da rolagem: aqui, a função dela direto
  let achado = null;
  const app = { enc: { investigados: {}, combatants: [], rng: { die: () => 20 }, say() {}, diario: [] }, refresh() {} };
  const heroi = { name: 'Sábia', pos: { x: 1, y: 1 }, abilities: { int: 18, wis: 10, cha: 10, str: 10, dex: 10, con: 10 }, level: 5, skills: ['historia'], conditions: [] };
  const op = opcaoDeLembrarCriatura(app, heroi, m, { fora: true });
  assert.ok(op, 'sem opção de Lembrar');
  achado = (await import(P + 'rules/lore.js')).fatosAte(L.loreDaCriatura(m), 22, { ate: 4 });
  assert.ok(linhasBloco.length >= 2 && achado.length >= 2, 'o povo não somou nada');
});

await teste('Neverwinter: o grupo sabe mais com História melhor', () => {
  const lore = L.LORE['lugar:neverwinter'];
  const fraco = L.fatosAte(lore, L.saberDoGrupo([{ h: 0 }], 'historia', () => 0));
  const forte = L.fatosAte(lore, L.saberDoGrupo([{ h: 0 }], 'historia', () => 9));
  assert.ok(forte.length > fraco.length, `${fraco.length} contra ${forte.length}`);
});

// ------------------------------------------------------------------------------------------ a divindade ----
const CR = await import(P + 'game/criador.js');
const { montarHeroi } = await import(P + 'game/criacao.js');
const { HEROIS } = await import(P + 'game/herois.js');

await teste('Os deuses de quem cria: Faerûn para todos, o panteão do povo para o anão, o elfo e o drow', () => {
  const humano = L.deusesPara('Humano').map((d) => d.chave);
  const anao = L.deusesPara('Anão').map((d) => d.chave);
  const drow = L.deusesPara('Elfo', { drow: true }).map((d) => d.chave);
  assert.ok(humano.includes('deus:tymora') && !humano.includes('deus:dumathoin'));
  assert.ok(anao.includes('deus:dumathoin') && anao.includes('deus:moradin') && anao.includes('deus:tymora'));
  assert.ok(drow.some((k) => L.LORE[k].grupo === 'drow') && drow.some((k) => L.LORE[k].grupo === 'elven'));
});

await teste('O herói criado leva a divindade até a ficha; chave que não é deus não passa', () => {
  const r = CR.novoRascunho('clerigo');
  r.nome = 'Thora'; r.raca = 'anaoColina'; r.divindade = 'deus:dumathoin';
  const def = CR.definicaoDoRascunho(r, 'pc-criado-thora1');
  assert.equal(def.divindade, 'Dumathoin');
  assert.ok(CR.definicaoValida(def), 'a definição com deus não passou');
  assert.ok(!CR.definicaoValida({ ...def, divindadeId: 'lugar:neverwinter', divindade: 'Neverwinter' }), 'passou um lugar como deus');
  assert.ok(!CR.definicaoValida({ ...def, divindade: 'Outro nome' }), 'passou nome que não é o da chave');
  const sem = CR.definicaoDoRascunho({ ...r, divindade: null }, 'pc-criado-thora2');
  assert.equal(sem.divindade, undefined);
});

await teste('O Brenn, clérigo de Berronar pela própria história, chega à luta com a divindade', () => {
  const brenn = HEROIS.find((h) => h.name === 'Brenn');
  assert.equal(brenn.divindadeId, 'deus:berronarTruesilver');
  assert.equal(L.LORE[brenn.divindadeId].nome, brenn.divindade);
  const c = montarHeroi(brenn.id);
  assert.equal(c.divindade, 'Berronar Truesilver');
});

console.log(`\n${total - falhas}/${total} testes passaram.`);
if (falhas) process.exit(1);
