// AS MAGIAS DO GUIA DE XANATHAR no motor: o que cada mecânica nova faz, sobre o Encounter de verdade.
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-magias-xge.mjs
//
// Cada prova foi escrita para FALHAR sem o código dela: nenhuma destas magias existia, e as peças que elas pediram
// (a ação concedida, a zona que cura, o teleporte que explode, a reação do Absorver Elementos...) também não.
import assert from 'node:assert/strict';

const P = new URL('../', import.meta.url).href;
const { Encounter } = await import(P + 'rules/combat.js');
const { makeParty } = await import(P + 'rules/party.js');
const { makeMonster } = await import(P + 'rules/monsters.js');
const { Battlefield, distanceFt } = await import(P + 'core/grid.js');
const { makeRng } = await import(P + 'core/rng.js');
const { hasCondition, getCondition, addCondition, nivelDeExaustao } = await import(P + 'rules/conditions.js');
const { SPELLS, magiasProntas } = await import(P + 'rules/spells.js');
const { MAGIAS_XGE } = await import(P + 'rules/magias-livro-xge.js');
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

/** Mago do 17º em (6,9), a guerreira colada nele, e os inimigos pedidos. */
function montar({ seed = 1, foes = [['ogro', { x: 7, y: 9 }]], prepara = [] } = {}) {
  const field = new Battlefield(20, 20, Array(20).fill('.'.repeat(20)));
  const party = makeParty({ nivel: 17 });
  party.forEach((c, i) => { c.pos = { x: 1, y: 1 + i * 2, f: 1 }; });
  const mago = party.find((c) => c.classe === 'mago');
  const guerreira = party.find((c) => c.classe === 'guerreiro');
  mago.pos = { x: 6, y: 9, f: 1 };
  guerreira.pos = { x: 6, y: 10, f: 1 };
  mago.spellcasting.prepared.push(...prepara);
  const fs = foes.map(([id, p]) => makeMonster(id, p));
  const log = [];
  const enc = new Encounter({ battlefield: field, party, foes: fs, rng: makeRng(seed), onLog: (e) => log.push(e) });
  enc.firstSide = 'party'; enc.round = 1; enc.beginSide('party');
  const texto = () => log.map((l) => `${l.text} ${l.detail ?? ''}`).join('\n');
  return { enc, party, mago, guerreira, foes: fs, log, texto };
}
const novoTurno = (c) => { c.actionUsed = false; c.bonusUsed = false; c.reactionUsed = false; c.magiasNoTurno = []; };

await teste('o Xanathar entra no catálogo, com fonte, e nas listas das classes pelo livro (truques inclusive)', async () => {
  assert.ok(Object.keys(MAGIAS_XGE).length >= 60);
  for (const s of Object.values(MAGIAS_XGE)) assert.equal(s.fonte, 'xge');
  const mago = listaDaClasse('mago', 9);
  for (const id of ['dobreFunebre', 'queimaduraDeGelo']) assert.ok(mago.truques.includes(id), id);
  for (const id of ['facaDeGelo', 'absorverElementos', 'esferaVitriolica', 'golpeDoVentoDeAco']) assert.ok(mago.magias.includes(id), id);
  assert.ok(listaDaClasse('clerigo', 9).truques.includes('palavraDeRadiancia'));
  assert.ok(!listaDaClasse('mago', 9).magias.includes('meteoroDeMelf'), 'a ação concedida não é magia de lista');
  // e na CRIAÇÃO do herói (que lia só a lista escrita à mão do 1º círculo)
  const { regrasDeMagia } = await import(P + 'game/criacao.js');
  const { heroiPorId } = await import(P + 'game/herois.js');
  assert.ok(regrasDeMagia(heroiPorId('pc-mago')).listaMagias.includes('facaDeGelo'));
});

await teste('Dobre Fúnebre: 1d8 em quem está inteiro, 1d12 em quem já está ferido', () => {
  const { enc, mago, foes, log } = montar({ prepara: ['dobreFunebre'] });
  const conta = () => log.filter((l) => l.rolagem?.danoPartes).at(-1)?.rolagem.danoPartes[0];
  enc.castSpell(mago, 'dobreFunebre', { target: foes[0] });
  const inteiro = log.find((l) => /Dobre/.test(l.text ?? '') && /\dd8/.test(l.detail ?? ''));
  foes[0].hp -= 5; novoTurno(mago);
  enc.castSpell(mago, 'dobreFunebre', { target: foes[0] });
  const ferido = log.filter((l) => /d12/.test(l.detail ?? '')).length;
  assert.ok(inteiro || conta(), 'contra o inteiro, d8');
  assert.ok(ferido > 0, 'contra o ferido, d12');
});

await teste('Prisão Mental fere quem passa; Enervação devolve a quem conjura metade do que causou', () => {
  let feriuNoSucesso = false;
  for (let seed = 1; seed <= 30 && !feriuNoSucesso; seed++) {
    const { enc, mago, foes, texto } = montar({ seed, prepara: ['prisaoMental'] });
    foes[0].abilities.int = 30;
    const hp = foes[0].hp;
    enc.castSpell(mago, 'prisaoMental', { target: foes[0] });
    if (/resiste contra Prisão Mental/.test(texto()) && foes[0].hp < hp) feriuNoSucesso = true;
  }
  assert.ok(feriuNoSucesso, 'quem resiste à Prisão Mental leva os 5d10 mesmo assim');
  const { enc, mago, foes } = montar({ prepara: ['enervacao'] });
  mago.hp = 20;
  enc.castSpell(mago, 'enervacao', { target: foes[0] });
  assert.ok(mago.hp > 20, `o mago bebeu da vida tirada (${mago.hp})`);
});

await teste('Esfera Vitriólica: quem falha fica com o ácido que volta no fim do próximo turno', () => {
  let ficou = false;
  for (let seed = 1; seed <= 20 && !ficou; seed++) {
    const { enc, mago, foes } = montar({ seed, prepara: ['esferaVitriolica'], foes: [['ogro', { x: 12, y: 9 }]] });
    foes[0].abilities.dex = 1;
    enc.castSpell(mago, 'esferaVitriolica', { point: { ...foes[0].pos } });
    ficou = getCondition(foes[0], 'acidoAtrasado')?.data?.dano === '5d4';
  }
  assert.ok(ficou);
});

await teste('Espírito Curador: o aliado que entra na casa do espírito se cura, até acabarem os usos', () => {
  const { enc, mago, guerreira } = montar({ prepara: ['espiritoCurador'] });
  guerreira.hp = 10;
  const r = enc.castSpell(mago, 'espiritoCurador', { point: { x: 6, y: 11 } });
  assert.ok(r.ok, r.why);
  guerreira.movementLeftFt = 30;
  enc.moveAlong(guerreira, [{ x: 6, y: 10 }, { x: 6, y: 11 }]);
  assert.ok(guerreira.hp > 10, `curou (${guerreira.hp})`);
});

await teste('Radiância Nauseante: quem falha leva também um nível de exaustão', () => {
  let cansou = false;
  for (let seed = 1; seed <= 20 && !cansou; seed++) {
    const { enc, mago, foes } = montar({ seed, prepara: ['radianciaNauseante'], foes: [['ogro', { x: 8, y: 2 }]] });
    foes[0].abilities.con = 1;
    enc.castSpell(mago, 'radianciaNauseante', { point: { x: 16, y: 9 } });
    foes[0].movementLeftFt = 40;
    enc.side = 'foes';
    enc.moveAlong(foes[0], [{ x: 8, y: 2 }, { x: 9, y: 3 }, { x: 10, y: 4 }, { x: 11, y: 5 }, { x: 12, y: 6 }]);
    cansou = nivelDeExaustao(foes[0]) >= 1;
  }
  assert.ok(cansou);
});

await teste('Absorver Elementos: o mago corta o fogo pela metade com a reação e um espaço, e o próximo golpe de perto leva o fogo', () => {
  const { enc, mago } = montar({ prepara: ['absorverElementos'] });
  const espacos = mago.spellcasting.slots.reduce((a, b) => a + b, 0);
  mago.hp = 100; mago.maxHp = 100; mago.tempHp = 0;
  enc.applyDamage(mago, 20, 'fogo', null, { magico: true });
  assert.equal(mago.hp, 90, 'metade de 20');
  assert.ok(mago.reactionUsed);
  assert.equal(mago.spellcasting.slots.reduce((a, b) => a + b, 0), espacos - 1);
  assert.ok(hasCondition(mago, 'cargaElemental'));
});

await teste('Sopro do Dragão: a guerreira tocada ganha o sopro na lista, do tipo escolhido, com a CD de quem conjurou', () => {
  const { enc, mago, guerreira, foes, texto } = montar({ prepara: ['soproDoDragao'] });
  assert.ok(!magiasProntas(guerreira).includes('soproDraconicoSopro'));
  const r = enc.castSpell(mago, 'soproDoDragao', { target: guerreira, opcao: 'frio' });
  assert.ok(r.ok, r.why);
  assert.ok(magiasProntas(guerreira).includes('soproDraconicoSopro'), 'a ação aparece para quem não conjura');
  guerreira.actionUsed = false;
  const s = enc.castSpell(guerreira, 'soproDraconicoSopro', { point: { ...foes[0].pos } });
  assert.ok(s.ok, s.why);
  assert.match(texto(), /frio/);
});

await teste('Meteoros de Melf: três usos de dois meteoros; no fim a ação some', () => {
  const { enc, mago, foes } = montar({ prepara: ['meteorosDiminutosDeMelf'], foes: [['ogro', { x: 14, y: 9 }]] });
  foes[0].hp = foes[0].maxHp = 999;
  assert.ok(enc.castSpell(mago, 'meteorosDiminutosDeMelf', {}).ok);
  for (let i = 0; i < 3; i++) {
    novoTurno(mago);
    const r = enc.castSpell(mago, 'meteoroDeMelf', { point: { ...foes[0].pos } });
    assert.ok(r.ok, `uso ${i + 1}: ${r.why}`);
  }
  novoTurno(mago);
  assert.ok(!magiasProntas(mago).includes('meteoroDeMelf'), 'acabaram');
  assert.ok(!enc.castSpell(mago, 'meteoroDeMelf', { point: { ...foes[0].pos } }).ok);
});

await teste('Passo Trovejante: vai à casa escolhida com o aliado colado, e o estrondo fere quem ficou perto da saída', () => {
  const { enc, mago, guerreira, foes } = montar({ prepara: ['passoTrovejante'] });
  const hp = foes[0].hp;
  const r = enc.castSpell(mago, 'passoTrovejante', { point: { x: 15, y: 3 } });
  assert.ok(r.ok, r.why);
  assert.deepEqual([mago.pos.x, mago.pos.y], [15, 3]);
  assert.ok(distanceFt(guerreira.pos, mago.pos) <= 5, 'a guerreira foi junto');
  assert.ok(foes[0].hp < hp, 'o ogro levou o trovão');
});

await teste('Passo Distante: o mago se teleporta de novo no turno seguinte com a ação bônus, sem espaço', () => {
  const { enc, mago } = montar({ prepara: ['passoDistante'] });
  assert.ok(enc.castSpell(mago, 'passoDistante', { point: { x: 12, y: 9 } }).ok);
  const espacos = mago.spellcasting.slots.reduce((a, b) => a + b, 0);
  novoTurno(mago);
  const r = enc.castSpell(mago, 'passoDistante', { point: { x: 16, y: 9 } });
  assert.ok(r.ok, r.why);
  assert.equal(mago.pos.x, 16);
  assert.equal(mago.spellcasting.slots.reduce((a, b) => a + b, 0), espacos, 'a repetição não gasta espaço');
  assert.ok(mago.bonusUsed);
});

await teste('Lâmina Sombria: a espada entra na mão e sai quando a magia acaba', () => {
  const { enc, mago } = montar({ prepara: ['laminaSombria'] });
  assert.ok(enc.castSpell(mago, 'laminaSombria', {}).ok);
  assert.equal(mago.equippedWeapon, 'laminaSombria');
  enc.dropConcentration(mago);
  enc.beginSide('party');
  assert.ok(!mago.weapons.includes('laminaSombria'));
  assert.notEqual(mago.equippedWeapon, 'laminaSombria');
});

await teste('Transformação de Tenser: 50 PV temporários, um golpe a mais, e não conjura', () => {
  const { enc, mago } = montar({ prepara: ['transformacaoDeTenser', 'raioDeFogo'] });
  const golpes = enc.golpesDoAtaque(mago, mago.equippedWeapon).length;
  assert.ok(enc.castSpell(mago, 'transformacaoDeTenser', {}).ok);
  assert.equal(mago.tempHp, 50);
  assert.equal(enc.golpesDoAtaque(mago, mago.equippedWeapon).length, golpes + 1);
  novoTurno(mago);
  assert.match(enc.canCast(mago, 'raioDeFogo', { target: mago }).why, /Tenser/);
});

await teste('Raio do Caos: os dois d8 iguais fazem o raio saltar para outra criatura', () => {
  let saltou = false;
  for (let seed = 1; seed <= 200 && !saltou; seed++) {
    const { enc, mago, foes, texto } = montar({ seed, prepara: ['raioDoCaos'], foes: [['ogro', { x: 9, y: 9 }], ['ogro', { x: 11, y: 9 }]] });
    for (const f of foes) f.ac = 1;
    enc.castSpell(mago, 'raioDoCaos', { target: foes[0] });
    saltou = /salta para/.test(texto());
  }
  assert.ok(saltou);
});

await teste('Faca de Gelo: acertando ou não, o gelo explode no alvo e em quem está colado nele', () => {
  const { enc, mago, foes, texto } = montar({ prepara: ['facaDeGelo'], foes: [['goblin', { x: 10, y: 9 }], ['goblin', { x: 11, y: 9 }]] });
  for (const f of foes) { f.abilities.dex = 1; f.hp = f.maxHp = 200; }
  enc.castSpell(mago, 'facaDeGelo', { target: foes[0] });
  assert.ok(foes[1].hp < 200, `o vizinho levou o frio\n${texto()}`);
});

await teste('Ruína Elemental: o resistente a fogo passa a sofrer o fogo inteiro, e mais 2d6 uma vez por turno', () => {
  let pegou = false;
  for (let seed = 1; seed <= 20 && !pegou; seed++) {
    const { enc, mago, foes } = montar({ seed, prepara: ['ruinaElemental'] });
    foes[0].abilities.con = 1; foes[0].resist = ['fogo']; foes[0].hp = foes[0].maxHp = 300;
    enc.castSpell(mago, 'ruinaElemental', { target: foes[0], opcao: 'fogo' });
    if (!hasCondition(foes[0], 'ruinaElemental')) continue;
    enc.applyDamage(foes[0], 10, 'fogo', mago, { magico: true });
    pegou = foes[0].hp <= 300 - 12;
  }
  assert.ok(pegou);
});

await teste('Golpe de Zéfiro: andar não provoca ataque de oportunidade', () => {
  const { enc, mago, foes } = montar({ prepara: ['golpeDeZefiro'] });
  assert.ok(enc.ameacasNoPasso(mago, mago.pos, { x: 4, y: 9 }).length > 0, 'sem a magia, o ogro aproveita');
  assert.ok(enc.castSpell(mago, 'golpeDeZefiro', {}).ok);
  assert.deepEqual(enc.ameacasNoPasso(mago, mago.pos, { x: 4, y: 9 }), []);
  void foes;
});

await teste('Palavra de Poder Dor: quem tem 100 PV ou menos fica com a dor, e anda no máximo 3 m', () => {
  const { enc, mago, foes } = montar({ prepara: ['palavraDePoderDor'] });
  foes[0].hp = 60;
  assert.ok(enc.castSpell(mago, 'palavraDePoderDor', { target: foes[0] }).ok);
  assert.ok(hasCondition(foes[0], 'dorAtroz'));
  assert.ok(enc.speedOf(foes[0]) <= 10);
});

await teste('Prender à Terra: quem voa pela ficha deixa de voar', () => {
  let preso = false;
  for (let seed = 1; seed <= 20 && !preso; seed++) {
    const { enc, mago, foes } = montar({ seed, prepara: ['prenderATerra'], foes: [['harpia', { x: 9, y: 9 }]] });
    foes[0].abilities.str = 1;
    assert.ok(enc.voaPelaFicha(foes[0]));
    enc.castSpell(mago, 'prenderATerra', { target: foes[0] });
    preso = hasCondition(foes[0], 'presoATerra') && !enc.voaPelaFicha(foes[0]);
  }
  assert.ok(preso);
});

await teste('Dança Macabra: os mortos se erguem e caem quando a concentração acaba', () => {
  // um ogro vivo longe: sem ele a luta acaba e os erguidos vão embora com ela
  const { enc, mago, foes } = montar({ prepara: ['dancaMacabra'], foes: [['goblin', { x: 7, y: 9 }], ['goblin', { x: 8, y: 9 }], ['ogro', { x: 18, y: 18 }]] });
  for (const f of foes.slice(0, 2)) { f.hp = 0; f.dead = true; }
  const r = enc.castSpell(mago, 'dancaMacabra', { target: foes[0], opcao: 'zumbi' });
  assert.ok(r.ok, r.why);
  const erguidos = () => enc.combatants.filter((c) => c.invocado?.spellId === 'dancaMacabra' && !c.dead);
  assert.ok(erguidos().length >= 2);
  enc.dropConcentration(mago);
  assert.equal(erguidos().length, 0);
});

await teste('Grito Psíquico: pega o escolhido e os outros perto dele, e quem falha fica atordoado', () => {
  const { enc, mago, foes } = montar({ prepara: ['gritoPsiquico'], foes: [['ogro', { x: 9, y: 9 }], ['ogro', { x: 11, y: 9 }], ['ogro', { x: 13, y: 9 }]] });
  // Inteligência 3: a menor que o grito pega (2 ou menos, o livro deixa de fora)
  for (const f of foes) { f.abilities.int = 3; f.hp = f.maxHp = 500; }
  enc.castSpell(mago, 'gritoPsiquico', { target: foes[0] });
  assert.ok(foes.every((f) => f.hp < 500), 'os três sofreram');
  assert.ok(foes.some((f) => hasCondition(f, 'atordoado')));
});

await teste('nenhuma condição tem o nome repetido (a Arma Sagrada da magia já apagou a do paladino da Devoção)', async () => {
  const fs = await import('node:fs');
  const fonte = fs.readFileSync(new URL('../rules/conditions.js', import.meta.url), 'utf8');
  const corpo = fonte.slice(fonte.indexOf('export const CONDITIONS = {'));
  const chaves = [...corpo.matchAll(/^ {2}([a-zA-Z0-9_]+): \{/gm)].map((m) => m[1]);
  const repetidas = chaves.filter((k, i) => chaves.indexOf(k) !== i);
  assert.ok(chaves.length > 200, `leu ${chaves.length} condições`);
  assert.deepEqual(repetidas, []);
});

console.log(`\n${total - falhas}/${total} testes passaram.`);
if (falhas) process.exit(1);
