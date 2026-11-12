// Provas do RESTO DO LIVRO DO MESTRE: os venenos (o de lâmina, o de soprar, a antitoxina), as doenças, as armadilhas do
// livro e o tesouro por ND.
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-dmg-resto.mjs
import assert from 'node:assert/strict';

const P = new URL('../', import.meta.url).href;
const { Encounter } = await import(P + 'rules/combat.js');
const { makeParty } = await import(P + 'rules/party.js');
const { makeMonster } = await import(P + 'rules/monsters.js');
const { Battlefield } = await import(P + 'core/grid.js');
const { makeRng } = await import(P + 'core/rng.js');
const { hasCondition } = await import(P + 'rules/conditions.js');
const EQ = await import(P + 'rules/equipment.js');
const { guardar } = await import(P + 'game/comercio.js');

let total = 0; let falhas = 0;
async function teste(nome, fn) {
  total += 1;
  try { await fn(); console.log(`ok    ${nome}`); } catch (e) { falhas += 1; console.log(`FALHA ${nome}\n      ${String(e.stack ?? e).split('\n').slice(0, 3).join('\n      ')}`); }
}
function montar(foes = [['ogro', { x: 2, y: 1 }]], semente = 3) {
  const party = makeParty({ nivel: 5 });
  party.forEach((c, i) => { c.pos = { ...c.pos, x: 1, y: 1 + i * 2 }; EQ.garantirInventario(c); });
  const fs = foes.map(([id, p]) => makeMonster(id, p));
  const log = [];
  const enc = new Encounter({ battlefield: new Battlefield(12, 10, Array(10).fill('............')), party, foes: fs, rng: makeRng(semente), onLog: (e) => log.push(e) });
  enc.firstSide = 'party'; enc.round = 1; enc.beginSide('party');
  return { enc, party, foes: fs, texto: () => log.map((l) => l.text ?? String(l)).join('\n') };
}
/** O d20 da luta sai sempre `n` (os outros dados seguem o sorteio). */
const d20Fixo = (enc, n) => { const die = enc.rng.die.bind(enc.rng); enc.rng.die = (lados) => (lados === 20 ? n : die(lados)); };

// ------------------------------------------------------------------------------------------------- venenos ----
await teste('O veneno básico, que não fazia nada: untado, o próximo acerto leva Constituição CD 10 ou 1d4', () => {
  const s = montar();
  const [dara] = s.party;
  guardar(dara, 'venenoBasico', 1);
  dara.actionUsed = false;
  const r = s.enc.useItem(dara, 'venenoBasico');
  assert.ok(r.ok, r.why);
  assert.ok(hasCondition(dara, 'armaUntada'));
  const ogro = s.foes[0];
  ogro.hp = ogro.maxHp = 300;
  ogro.abilities.con = 1;
  d20Fixo(s.enc, 12);   // acerta (12 + 7 contra CA 11) e falha (12 − 5 contra CD 10)
  dara.actionUsed = false;
  const at = s.enc.attackAction(dara, ogro, dara.equippedWeapon);
  assert.ok(at.ok, at.why);
  assert.match(s.texto(), /sofre \d+ de veneno \(veneno básico\)/);
  assert.ok(!hasCondition(dara, 'armaUntada'), 'o veneno não saiu da lâmina');
});

await teste('O veneno não pega em arma de concussão', () => {
  const s = montar();
  const brenn = s.party[2];
  guardar(brenn, 'venenoBasico', 1);
  brenn.actionUsed = false;
  const r = s.enc.useItem(brenn, 'venenoBasico');
  assert.ok(!r.ok && /lâmina ou ponta/.test(r.why), 'a maça foi untada');
});

await teste('O veneno drow: envenenado por uma hora, e desmaiado quem falha por 5 ou mais; o dano acorda', () => {
  const s = montar();
  const ogro = s.foes[0];
  ogro.abilities.con = 1;
  d20Fixo(s.enc, 1);
  s.enc.aplicarVeneno(ogro, { cd: 13, condicoes: [{ id: 'envenenado', rodadas: 600 }], desmaiaPor: 5 }, 'Veneno drow', s.party[0]);
  assert.ok(hasCondition(ogro, 'envenenado') && hasCondition(ogro, 'desmaiadoDeVeneno'));
  s.enc.applyDamage(ogro, 1, 'cortante', s.party[0]);
  assert.ok(!hasCondition(ogro, 'desmaiadoDeVeneno'), 'o dano não acordou');
  assert.ok(hasCondition(ogro, 'envenenado'));
});

await teste('A malícia soprada: cego e envenenado; só em quem está encostado', () => {
  const s = montar();
  const [dara] = s.party;
  guardar(dara, 'malicia', 2);
  const ogro = s.foes[0];
  ogro.abilities.con = 1;
  d20Fixo(s.enc, 2);
  dara.actionUsed = false;
  const r = s.enc.useItem(dara, 'malicia', { target: ogro });
  assert.ok(r.ok, r.why);
  assert.ok(hasCondition(ogro, 'cego') && hasCondition(ogro, 'envenenado'));
  ogro.pos = { ...ogro.pos, x: 8 };
  dara.actionUsed = false;
  assert.ok(!s.enc.useItem(dara, 'malicia', { target: ogro }).ok, 'soprou de longe');
});

await teste('A antitoxina, que não fazia nada: vantagem na resistência contra veneno', () => {
  const s = montar();
  const pip = s.party[1];
  guardar(pip, 'antitoxina', 1);
  pip.actionUsed = false;
  assert.ok(s.enc.useItem(pip, 'antitoxina').ok);
  const r = s.enc.resistencia(pip, 'con', 10, { contra: { tipoDano: 'veneno', condicao: 'envenenado' } });
  assert.equal(r.mode, 'vantagem');
});

// ------------------------------------------------------------------------------------------------- doenças ----
const DO = await import(P + 'rules/doencas.js');
const { descansoLongo, gastarDadoDeVida } = await import(P + 'rules/descanso.js');
const { conditionEffects, getCondition } = await import(P + 'rules/conditions.js');

await teste('A peste do esgoto incuba um dia; doente, o descanso não cura e o dado de vida cura a metade', () => {
  const s = montar();
  const [dara] = s.party;
  assert.equal(DO.contrairDoenca(dara, 'pesteDoEsgoto'), null);
  assert.ok(!conditionEffects(dara).desvantagemSoTeste.length, 'incubando, já pesava');
  dara.abilities.con = 1;   // falha sempre
  descansoLongo(dara);
  assert.equal(getCondition(dara, 'pesteDoEsgoto').data.incubando, 0);
  assert.ok(conditionEffects(dara).desvantagemSoTeste.length, 'o 1º degrau não pesou');
  dara.hp = 10;
  const acaso = Math.random;
  Math.random = () => 0;   // o d20 do descanso sai 1: falha
  try { descansoLongo(dara); } finally { Math.random = acaso; }
  assert.equal(dara.hp, 10, 'o descanso curou com a peste');
  assert.equal(getCondition(dara, 'pesteDoEsgoto').data.nivel, 2, 'falhou e não piorou');
  dara.dadosDeVidaRestantes = 5;
  const r = gastarDadoDeVida({ die: () => 10 }, dara);
  assert.equal(r.cura, Math.floor((10 - 5) / 2), 'o dado curou inteiro');
});

await teste('A peste cede: passando no teste, um degrau a menos, e a zero cura', () => {
  const s = montar();
  const [dara] = s.party;
  DO.contrairDoenca(dara, 'pesteDoEsgoto');
  getCondition(dara, 'pesteDoEsgoto').data.incubando = 0;
  dara.abilities.con = 30;
  const linhas = DO.avancarDoencas(dara, () => 20);
  assert.ok(!getCondition(dara, 'pesteDoEsgoto'), linhas.join(' / '));
});

await teste('A febre do riso: quem apanha faz Constituição CD 13 ou cai de rir', () => {
  const s = montar();
  const ogro = s.foes[0];
  ogro.hp = ogro.maxHp = 300;
  ogro.abilities.con = 1;
  DO.contrairDoenca(ogro, 'febreDoRiso');
  d20Fixo(s.enc, 2);
  s.enc.applyDamage(ogro, 3, 'cortante', s.party[0]);
  assert.ok(hasCondition(ogro, 'gargalhando'), 'a febre não fez rir');
  assert.ok(conditionEffects(ogro).incapacitated);
});

await teste('A podridão da vista piora a cada dia, cega no −5, e a Restauração Menor cura tudo', () => {
  const s = montar();
  const [dara, , brenn] = s.party;
  DO.contrairDoenca(dara, 'podridaoDaVista');
  for (let i = 0; i < 5; i += 1) DO.avancarDoencas(dara);
  assert.ok(hasCondition(dara, 'cego'), 'em −5 não cegou');
  assert.equal(conditionEffects(dara).ataqueFixo, -5);
  brenn.spellcasting.prepared = [...new Set([...(brenn.spellcasting.prepared ?? []), 'restauracaoMenor'])];
  brenn.pos = { x: 1, y: 2 };
  const r = s.enc.castSpell(brenn, 'restauracaoMenor', { target: dara });
  assert.ok(r.ok, r.why);
  // a restauração tira a primeira da lista que ela tem: a cegueira vem antes; um segundo toque leva a doença
  brenn.actionUsed = false;
  if (hasCondition(dara, 'podridaoDaVista')) s.enc.castSpell(brenn, 'restauracaoMenor', { target: dara });
  assert.ok(!hasCondition(dara, 'podridaoDaVista') && !hasCondition(dara, 'cego'));
});

await teste('Quem tem Saúde Divina não adoece; o elixir da saúde cura a doença', () => {
  const s = montar();
  const [dara, pip] = s.party;
  dara.features = [...(dara.features ?? []), 'divineHealth'];
  assert.match(DO.contrairDoenca(dara, 'febreDoRiso'), /não adoece/);
  DO.contrairDoenca(pip, 'febreDoRiso');
  guardar(pip, 'elixirDaSaude', 1);
  pip.actionUsed = false;
  assert.ok(s.enc.useItem(pip, 'elixirDaSaude').ok);
  assert.ok(!hasCondition(pip, 'febreDoRiso'));
});

// ---------------------------------------------------------------------------------------------- armadilhas ----
const RG = await import(P + 'rules/regioes.js');
const AL = await import(P + 'rules/armadilhas-livro.js');

/** Põe as regiões do modelo no campo da luta e dispara a de `id` em `c`. */
function armar(s, modelo, casas, opcoes) {
  const regioes = AL.regioesDoModelo(modelo, 'arm', casas, opcoes);
  RG.prepararRegioes(s.enc.field, regioes);
  return (c) => RG.disparar(s.enc, s.enc.field.regioes.find((r) => r.id === 'arm'), c, 'entrar');
}

await teste('Todo modelo do livro monta regiões que o motor aceita (efeito conhecido, casas, id)', () => {
  for (const [k, m] of Object.entries(AL.MODELOS_DO_LIVRO)) {
    const rs = AL.regioesDoModelo(k, 'x', ['3,3', '4,3']);
    assert.ok(rs.length >= 1 && rs[0].id === 'x', k);
    for (const r of rs) for (const e of r.efeitos) assert.ok(RG.EFEITOS.includes(e.tipo), `${k}: efeito ${e.tipo}`);
    assert.ok(m.nome);
  }
});

await teste('O teto que desaba: 4d10 em todos embaixo (Destreza CD 15, metade) e o entulho vira terreno difícil', () => {
  const s = montar([['ogro', { x: 2, y: 1 }]]);
  const [dara] = s.party;
  const ogro = s.foes[0];
  ogro.hp = ogro.maxHp = 300;
  const pisa = armar(s, 'tetoQueDesaba', ['1,1', '2,1']);
  const antes = { dara: dara.hp, ogro: ogro.hp };
  pisa(dara);
  assert.ok(dara.hp < antes.dara && ogro.hp < antes.ogro, 'não pegou os dois');
  assert.ok(s.enc.field.regioes.find((r) => r.id === 'armEntulho').desligada === false, 'o entulho não ligou');
});

await teste('A rede: contido com CD 10 de escape; e caído quem falha em Força', () => {
  const s = montar([['ogro', { x: 2, y: 1 }]]);
  const [dara] = s.party;
  dara.abilities.str = 1;
  d20Fixo(s.enc, 2);
  armar(s, 'redeQueCai', ['1,1', '2,1'])(dara);
  const contido = dara.conditions.find((c) => c.id === 'contido');
  assert.ok(contido && contido.data?.escape === 10, 'sem a CD 10 de escape');
  const caido = dara.conditions.find((c) => c.id === 'caido');
  assert.ok(caido && !caido.data?.escape, 'o caído ganhou CD de escape');
});

await teste('Os dardos envenenados: quatro ataques +8, e quem leva o dardo faz Constituição CD 15 contra 3d10', () => {
  const s = montar([['ogro', { x: 8, y: 8 }]]);
  const [dara] = s.party;
  dara.hp = dara.maxHp = 500;
  d20Fixo(s.enc, 18);
  armar(s, 'dardosEnvenenados', ['1,1'])(dara);
  assert.equal((s.texto().match(/um dardo acerta/g) ?? []).length, 4, s.texto());
  assert.match(s.texto(), /veneno do dardo/);
});

await teste('A agulha da fechadura: mexer errado solta 1 + 2d10 e Constituição CD 15 ou envenenado', async () => {
  const { agulhaEnvenenada } = await import(P + 'game/portas.js');
  const s = montar();
  const pip = s.party[1];
  pip.hp = pip.maxHp = 200;
  pip.abilities.con = 1;
  d20Fixo(s.enc, 3);
  const tranca = { cd: 15, agulha: true };
  agulhaEnvenenada(s.enc, pip, tranca);
  assert.ok(pip.hp < 200 && hasCondition(pip, 'envenenado'));
  assert.ok(tranca.agulhaDisparada);
});

// ---------------------------------------------------------------------------------------------- tesouro ----
const TE = await import(P + 'rules/tesouro.js');
const TT = await import(P + 'rules/tesouro-tabelas.js');
const { ITEMS, WEAPONS, ARMORS, SHIELDS } = await import(P + 'rules/items/index.js');
const existe = (id) => Boolean(ITEMS[id] || WEAPONS[id] || ARMORS[id] || SHIELDS[id]);

await teste('As tabelas mágicas A a I só apontam para item que o jogo tem (ou ficha, ou null que rola de novo)', () => {
  for (const [letra, linhas] of Object.entries(TT.ITENS_MAGICOS_POR_TABELA)) {
    let ultimo = 0;
    for (const l of linhas) {
      assert.ok(l.min === ultimo + 1, `${letra}: buraco no d100 em ${l.min}`);
      ultimo = l.max;
      if (typeof l.id === 'string') assert.ok(existe(l.id), `${letra}: ${l.id} não existe`);
    }
    assert.equal(ultimo, 100, `${letra} não fecha o d100`);
  }
});

await teste('Mil sorteios do covil em todo ND só dão coisa que existe no catálogo', () => {
  const rng = makeRng(11);
  for (const nd of [0, 3, 5, 9, 11, 16, 17, 25]) {
    for (let i = 0; i < 125; i += 1) {
      for (const { id, qtd } of TE.tesouroDoCovil(rng, nd)) {
        assert.ok(id && existe(id), `ND ${nd}: ${id}`);
        assert.ok(qtd > 0);
      }
    }
  }
});

await teste('O tesouro individual pelo ND: o de ND baixo leva cobre e prata; o ND 17, ouro e platina, e nada de cobre', () => {
  const rng = makeRng(5);
  const baixo = new Set(); const alto = new Set();
  for (let i = 0; i < 300; i += 1) {
    for (const m of TE.tesouroIndividual(rng, 0.25)) baixo.add(m.id);
    for (const m of TE.tesouroIndividual(rng, 17)) alto.add(m.id);
  }
  assert.ok(baixo.has('moedaDeCobre') && baixo.has('moedaDePrata'), [...baixo].join(','));
  assert.ok(!alto.has('moedaDeCobre') && alto.has('moedaDeOuro'), [...alto].join(','));
  assert.equal(TE.ndDe(makeMonster('hobgoblin', { x: 0, y: 0 })), 0.5);
  assert.equal(TE.ndDe(makeMonster('ogro', { x: 0, y: 0 })), 2);
});

console.log(`\n${total - falhas}/${total} testes passaram.`);
if (falhas) process.exit(1);
