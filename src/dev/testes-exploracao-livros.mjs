// AS MAGIAS DE EXPLORAÇÃO DOS LIVROS (o PHB) no sistema de magia fora da luta, e a viagem por magia na região.
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-exploracao-livros.mjs
//
// Cada prova usa uma magia que, antes desta leva, entrava no catálogo sem efeito: nenhuma passa no código antigo.
import assert from 'node:assert/strict';

const P = new URL('../', import.meta.url).href;
const { makeParty } = await import(P + 'rules/party.js');
const { makeRng } = await import(P + 'core/rng.js');
const { hasCondition } = await import(P + 'rules/conditions.js');
const { SPELLS } = await import(P + 'rules/spells.js');
const U = await import(P + 'rules/utilidade.js');
const V = await import(P + 'game/viagem-magica.js');
const { listaDaClasse } = await import(P + 'game/criacao.js');

let total = 0;
let falhas = 0;
async function teste(nome, fn) {
  total += 1;
  try { await fn(); console.log(`ok    ${nome}`); } catch (e) {
    falhas += 1;
    console.log(`FALHA ${nome}\n      ${String(e.stack ?? e.message).split('\n').slice(0, 6).join('\n      ')}`);
  }
}

/** O grupo de 17º nível, com o mago e o clérigo sabendo as magias pedidas. */
function grupo(...ids) {
  const herois = makeParty({ nivel: 17 });
  for (const h of herois) if (h.spellcasting) h.spellcasting.prepared.push(...ids);
  const mago = herois.find((h) => h.classe === 'mago');
  const clerigo = herois.find((h) => h.classe === 'clerigo');
  return { herois, mago, clerigo, campanha: {}, rng: makeRng(7) };
}

await teste('as de exploração do PHB entram com efeito: fora de combate, nas listas das classes, e a viagem fora do menu da cena', () => {
  for (const id of ['teletransporte', 'labia', 'ressurreicao', 'banqueteDeHerois', 'lendasEHistorias', 'olhoArcano']) {
    assert.ok(SPELLS[id] && !SPELLS[id].semMotor && SPELLS[id].soFora, id);
  }
  assert.ok(listaDaClasse('mago', 7).magias.includes('teletransporte'));
  assert.ok(listaDaClasse('clerigo', 7).magias.includes('ressurreicao'));
  const { mago } = grupo('teletransporte', 'olhoArcano');
  const naCena = U.magiasForaDoHeroi(mago).map((s) => s.id);
  assert.ok(naCena.includes('olhoArcano') && !naCena.includes('teletransporte'), 'o Teletransporte não está na cena');
  assert.ok(U.magiasForaDoHeroi(mago, { regiao: true }).some((s) => s.id === 'teletransporte'), 'e está na região');
});

await teste('Ressurreição traz com toda a vida e a penalidade; a Verdadeira, sem penalidade; o Banquete de Heróis dá PV e imunidade por um dia', () => {
  const g = grupo();
  const estado = U.estadoDe(g.campanha);
  const morto = g.herois[0];
  morto.dead = true; morto.hp = 0;
  g.clerigo.spellcasting.prepared.push('ressurreicao', 'ressurreicaoVerdadeira', 'banqueteDeHerois');
  const r = U.conjurarFora(estado, g.clerigo, 'ressurreicao', { herois: g.herois, rng: g.rng, alvo: morto });
  assert.ok(r.ok, r.why);
  assert.ok(!morto.dead && morto.hp === morto.maxHp && hasCondition(morto, 'revivido'));
  const outro = g.herois[1];
  outro.dead = true; outro.hp = 0;
  assert.ok(U.conjurarFora(estado, g.clerigo, 'ressurreicaoVerdadeira', { herois: g.herois, rng: g.rng, alvo: outro }).ok);
  assert.ok(!outro.dead && !hasCondition(outro, 'revivido'), 'a Verdadeira não deixa marca');
  const max = g.herois[2].maxHp;
  assert.ok(U.conjurarFora(estado, g.clerigo, 'banqueteDeHerois', { herois: g.herois, rng: g.rng }).ok);
  assert.ok(g.herois[2].maxHp > max && hasCondition(g.herois[2], 'banqueteDosHerois'));
  U.avancar(estado, 1441, g.herois);
  assert.equal(g.herois[2].maxHp, max, 'passado o dia, os PV a mais vão embora');
});

await teste('Lábia faz do d20 um 15; Missão faz o NPC ceder sem acabar; Modificar Memória apaga a desconfiança', () => {
  const g = grupo('labia', 'missao', 'modificarMemoria');
  const estado = U.estadoDe(g.campanha);
  const bardo = g.mago;
  assert.ok(U.conjurarFora(estado, bardo, 'labia', { herois: g.herois, rng: g.rng }).ok);
  for (let s = 1; s <= 20; s++) {
    const t = U.rolarTeste(estado, g.herois, makeRng(s), bardo, 'persuasao', 99);
    assert.ok(t.total >= 15 + t.bonus, `semente ${s}: ${t.total} com bônus ${t.bonus}`);
  }
  const npc = { id: 'harbin', name: 'Harbin', abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 1, cha: 10 } };
  estado.npcs.harbin = { ressentido: 'desconfiado', sondado: true };
  const m = U.conjurarFora(estado, bardo, 'modificarMemoria', { herois: g.herois, rng: makeRng(3), alvo: npc });
  assert.ok(m.ok, m.why);
  if (!m.resultado.resistiu) assert.ok(!estado.npcs.harbin.ressentido && !estado.npcs.harbin.sondado, 'esqueceu');
  const q = U.conjurarFora(estado, bardo, 'missao', { herois: g.herois, rng: makeRng(4), alvo: npc });
  assert.ok(q.ok, q.why);
  if (!q.resultado.resistiu) {
    assert.ok(U.rolarTeste(estado, g.herois, makeRng(1), bardo, 'persuasao', 99, { npc }).passou, 'cede');
    assert.ok(U.rolarTeste(estado, g.herois, makeRng(2), bardo, 'persuasao', 99, { npc }).passou, 'e cede de novo: a Missão não acaba ao ser cumprida');
  }
});

await teste('Contatar Outro Plano: quem falha a Inteligência enlouquece até o descanso longo', async () => {
  const { descansoLongo } = await import(P + 'rules/descanso.js');
  let louco = null;
  for (let s = 1; s <= 30 && !louco; s++) {
    const g = grupo('contatarOutroPlano');
    g.mago.abilities.int = 1;
    const r = U.conjurarFora(U.estadoDe(g.campanha), g.mago, 'contatarOutroPlano', { herois: g.herois, rng: makeRng(s), dados: { respostas: [] } });
    assert.ok(r.ok, r.why);
    if (r.resultado.risco && !r.resultado.risco.passou) louco = g.mago;
  }
  assert.ok(louco && hasCondition(louco, 'enlouquecido'));
  descansoLongo(louco);
  assert.ok(!hasCondition(louco, 'enlouquecido'));
});

await teste('Viagem: o Teletransporte para Phandalin quase sempre acerta; a Palavra de Recordação só volta a Phandalin; as plantas pedem mata conhecida', () => {
  let noAlvo = 0;
  for (let s = 1; s <= 40; s++) {
    const g = grupo('teletransporte');
    const r = V.viajarPorMagia(g.campanha, g.herois, makeRng(s), { c: g.mago, spellId: 'teletransporte', de: 'castelo', para: 'phandalin', conhecidos: ['phandalin', 'castelo', 'poco'] });
    assert.ok(r.ok, r.why);
    if (r.chegou === 'phandalin') noAlvo += 1;
  }
  assert.ok(noAlvo >= 30, `no alvo ${noAlvo} de 40 (o livro: 76%, mais o fora do alvo, que também chega)`);
  const g = grupo('palavraDeRecordacao', 'transportePelasPlantas', 'teletransporte');
  const ops = (para, feitos = {}) => V.viagensPossiveis(g.herois, 'castelo', para, { feitos }).map((o) => o.spellId);
  assert.ok(ops('phandalin').includes('palavraDeRecordacao'));
  assert.ok(!ops('poco').includes('palavraDeRecordacao'), 'a palavra só leva ao santuário');
  assert.ok(V.temMata('arvoreTrovao'), 'a Árvore-Trovão fica na mata');
  assert.ok(!ops('arvoreTrovao').includes('transportePelasPlantas'), 'sem ter ido lá, não há árvore conhecida');
  assert.ok(ops('arvoreTrovao', { visitou_arvoreTrovao: true }).includes('transportePelasPlantas'));
  assert.equal(V.familiaridade('poco', { visitou_poco: true }), 'visto');
});

console.log(`\n${total - falhas}/${total} testes passaram.`);
if (falhas) process.exit(1);
