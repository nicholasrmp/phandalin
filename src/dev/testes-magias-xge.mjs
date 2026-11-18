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

// ---- a fila: as magias que pegam na chama do mapa e o Cochilo (2026-11-12, `rules/chamas.js`)
const comChama = (enc, x, y) => { enc.field.luzes = [...(enc.field.luzes ?? []), { pos: { x, y }, tipo: 'fogo', nome: 'o braseiro', claro: 20, penumbra: 20 }]; return enc.field.luzes.at(-1); };

await teste('Controlar Chamas apaga, dobra ou corta a chama do mapa; sem chama na casa, não sai', () => {
  const { enc, mago } = montar({ prepara: [] });
  mago.spellcasting.cantrips.push('controlarChamas');
  const luz = comChama(enc, 12, 9);
  assert.ok(!enc.canCast(mago, 'controlarChamas', { point: { x: 12, y: 12 } }).ok, 'saiu sem chama na casa');
  assert.ok(enc.castSpell(mago, 'controlarChamas', { point: { x: 12, y: 9 }, opcao: 'dobrar' }).ok);
  assert.equal(luz.claro, 40);
  novoTurno(mago);
  assert.ok(enc.castSpell(mago, 'controlarChamas', { point: { x: 12, y: 9 }, opcao: 'apagar' }).ok);
  assert.ok(luz.apagada);
});

await teste('Pirotecnia: a chama vira fogos (CON ou cego, a 3 m) ou uma fumaça de 6 m que tapa a vista', () => {
  const { enc, mago, foes, texto } = montar({ prepara: ['pirotecnia'], foes: [['goblin', { x: 13, y: 9 }]] });
  const luz = comChama(enc, 12, 9);
  const orig = enc.rng.die; enc.rng.die = (l) => (l === 20 ? 1 : orig(l));
  assert.ok(enc.castSpell(mago, 'pirotecnia', { point: { x: 12, y: 9 }, opcao: 'fogos' }).ok, texto());
  enc.rng.die = orig;
  assert.ok(luz.apagada);
  assert.ok(hasCondition(foes[0], 'cego'));
  novoTurno(mago);
  const outra = comChama(enc, 4, 4);
  assert.ok(enc.castSpell(mago, 'pirotecnia', { point: { x: 4, y: 4 }, opcao: 'fumaca' }).ok);
  assert.ok(outra.apagada);
  assert.ok(enc.zonas.some((z) => z.obscuro === 'pesada' && z.casas.has('4,4')), 'sem fumaça');
});

await teste('Cochilo: até três dormem dez minutos e acordam com o descanso curto', async () => {
  const { conjurarFora, estadoDe } = await import(P + 'rules/utilidade.js');
  const { makeRng: rng } = await import(P + 'core/rng.js');
  const party = makeParty({ nivel: 5 });
  const bardo = party.find((c) => c.classe === 'bardo') ?? party.find((c) => c.spellcasting);
  bardo.spellcasting.prepared.push('cochilo');
  bardo.spellcasting.slots[3] = Math.max(1, bardo.spellcasting.slots[3] ?? 0);
  for (const h of party) h.hp = Math.max(1, Math.floor(h.maxHp / 3));
  const guerreira = party.find((c) => c.classe === 'guerreiro');
  if (guerreira) guerreira.resources.secondWind = 0;
  const r = conjurarFora(estadoDe({}), bardo, 'cochilo', { herois: party, rng: rng(5), circulo: 3 });
  assert.ok(r.ok, r.why ?? JSON.stringify(r));
  assert.equal(r.resultado.cochilo.length, 3);
  assert.ok(r.resultado.cochilo.some((x) => x.curou > 0), 'ninguém gastou dado de vida');
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

// ---------------------------------------------------------------- a segunda leva da fila (2026-11-12)
const d20s = (enc, valores) => { const orig = enc.rng.die; const fila = [...valores]; enc.rng.die = (l) => (l === 20 && fila.length ? fila.shift() : orig(l)); };

await teste('Esfera Aquosa: quem está nela e falha Força fica contido; com a ação, ela anda 9 m', () => {
  const { enc, mago, foes, texto } = montar({ prepara: ['esferaAquosa'], foes: [['ogro', { x: 12, y: 9 }]] });
  d20s(enc, [1]);
  const r = enc.castSpell(mago, 'esferaAquosa', { point: { x: 12, y: 9 }, circulo: 4 });
  assert.ok(r.ok, r.why);
  assert.ok(hasCondition(foes[0], 'contido'), texto());
  const z = enc.zonas.find((q) => q.spellId === 'esferaAquosa');
  assert.ok(z?.casas.has('12,9'));
  novoTurno(mago);
  const r2 = enc.castSpell(mago, 'esferaAquosa', { point: { x: 14, y: 12 } });
  assert.ok(r2.ok, r2.why);
  assert.ok(enc.zonas.find((q) => q.spellId === 'esferaAquosa')?.casas.has('14,12'));
});

await teste('Redemoinho: 10d6 de concussão em quem está nele (metade no sucesso), e a zona fica ferindo', () => {
  const { enc, mago, foes, texto } = montar({ prepara: ['redemoinho'], foes: [['ogro', { x: 14, y: 9 }]] });
  foes[0].hp = foes[0].maxHp = 400;
  d20s(enc, [1]);
  const r = enc.castSpell(mago, 'redemoinho', { point: { x: 14, y: 9 }, circulo: 7 });
  assert.ok(r.ok, r.why);
  assert.ok(foes[0].hp <= 400 - 10, texto());
  assert.ok(enc.zonas.find((q) => q.spellId === 'redemoinho' && q.dano));
});

await teste('Transmutar Rocha: o chão vira lama (cada passo custa quatro), e quem estava nele afunda se falhar Força', () => {
  const { enc, mago, foes, texto } = montar({ prepara: ['transmutarRocha'], foes: [['ogro', { x: 14, y: 9 }]] });
  d20s(enc, [1]);
  const r = enc.castSpell(mago, 'transmutarRocha', { point: { x: 14, y: 9 }, circulo: 5 });
  assert.ok(r.ok, r.why);
  assert.ok(hasCondition(foes[0], 'contido'), texto());
  assert.equal(enc.field.costOf(15, 10), 20, 'cada 1,5 m custa 6 m');
});

await teste('Moldar Terra: o truque deixa um quadrado de 1,5 m de terreno difícil', () => {
  const { enc, mago } = montar({ prepara: [] });
  mago.spellcasting.cantrips.push('moldarTerra');
  const r = enc.castSpell(mago, 'moldarTerra', { point: { x: 8, y: 9 } });
  assert.ok(r.ok, r.why);
  assert.equal(enc.field.costOf(8, 9), 10);
});

await teste('Dragão Ilusório: quem vê a sombra testa Sabedoria ou fica amedrontado, e quem conjurou sopra o cone de 18 m com a ação bônus', () => {
  const { enc, mago, foes, texto } = montar({ prepara: ['dragaoIlusorio'], foes: [['ogro', { x: 12, y: 9 }], ['ogro', { x: 13, y: 10 }]] });
  for (const f of foes) f.hp = f.maxHp = 400;
  d20s(enc, [1, 1]);
  const r = enc.castSpell(mago, 'dragaoIlusorio', { point: { x: 10, y: 9 }, circulo: 8, opcao: 'frio' });
  assert.ok(r.ok, r.why);
  assert.ok(foes.every((f) => hasCondition(f, 'amedrontado')), texto());
  assert.ok(magiasProntas(mago).includes('soproDoDragaoIlusorio'), 'o sopro não apareceu na lista');
  novoTurno(mago);
  const hp = foes[0].hp;
  const r2 = enc.castSpell(mago, 'soproDoDragaoIlusorio', { point: foes[0].pos });
  assert.ok(r2.ok, r2.why);
  assert.ok(mago.bonusUsed && !mago.actionUsed, 'o sopro é ação bônus');
  assert.ok(foes[0].hp < hp, texto());
  assert.match(texto(), /de frio/);
});

// ---------------------------------------------------------------- a fila do Xanathar (2026-11-16)

await teste('Vínculo com Besta: a fera aliada ataca com vantagem quem está a 1,5 m de quem conjurou, e só ela', () => {
  const { enc, mago, foes } = montar({ prepara: ['vinculoComBesta'] });
  // (o lobo do Conjurar Animais é feérico no livro de 2014: este vem de outra porta, como fera)
  const lobo = enc.invocar(mago, 'lobo', { x: 7, y: 8 }, { spellId: 'teste' });
  assert.match(enc.canCast(mago, 'vinculoComBesta', { target: enc.combatants.find((c) => c.classe === 'guerreiro') }).why ?? '', /fera/);
  const r = enc.castSpell(mago, 'vinculoComBesta', { target: lobo });
  assert.ok(r.ok, r.why);
  assert.ok(hasCondition(lobo, 'vinculoBestial'));
  assert.equal(enc.attackModifiers(lobo, foes[0]).advantage ?? JSON.stringify(enc.attackModifiers(lobo, foes[0])).includes('Vínculo'), true);
  foes[0].pos = { ...foes[0].pos, x: 15, y: 15 };
  assert.ok(!JSON.stringify(enc.attackModifiers(lobo, foes[0])).includes('Vínculo'), 'longe de quem conjurou, sem vantagem');
});

await teste('Metamorfose em Massa: até dez de um lado só; os inimigos viram rã, e a concentração que cai devolve todos', () => {
  const { enc, mago, foes } = montar({ prepara: ['metamorfoseEmMassa'], foes: [['ogro', { x: 9, y: 9 }], ['ogro', { x: 9, y: 12 }], ['goblin', { x: 10, y: 6 }]] });
  d20s(enc, [1, 1, 1]);
  const r = enc.castSpell(mago, 'metamorfoseEmMassa', { opcao: 'inimigos' });
  assert.ok(r.ok, r.why);
  assert.ok(foes.every((f) => f.formaSelvagem), foes.map((f) => f.name).join(' '));
  enc.dropConcentration(mago);
  assert.ok(foes.every((f) => !f.formaSelvagem));
});

await teste('Dispersar: os inimigos que falham somem para longe do grupo; os aliados, para longe dos inimigos', () => {
  const { enc, party, mago, foes } = montar({ prepara: ['dispersar'], foes: [['ogro', { x: 8, y: 9 }], ['goblin', { x: 7, y: 11 }]] });
  d20s(enc, [1, 1]);
  const r = enc.castSpell(mago, 'dispersar', { opcao: 'inimigos' });
  assert.ok(r.ok, r.why);
  const perto = (c) => Math.min(...party.map((h) => distanceFt(h.pos, c.pos)));
  assert.ok(foes.every((f) => perto(f) >= 40), foes.map((f) => perto(f)).join(' '));
  assert.ok(foes.every((f) => distanceFt(f.pos, mago.pos) <= 120));
  const b = montar({ prepara: ['dispersar'], foes: [['ogro', { x: 7, y: 9 }]] });
  novoTurno(b.mago);
  assert.ok(b.enc.castSpell(b.mago, 'dispersar', { opcao: 'aliados' }).ok);
  assert.ok(distanceFt(b.mago.pos, b.foes[0].pos) >= 40, 'quem conjurou também saiu de perto');
});

await teste('Ossos da Terra: os pilares (as dobras e a casa clicada) viram rocha; nunca em cima de ninguém', () => {
  const { enc, mago, foes } = montar({ prepara: ['ossosDaTerra'] });
  assert.match(enc.canCast(mago, 'ossosDaTerra', { point: foes[0].pos }).why ?? '', /embaixo de ninguém/);
  const escalas = [{ x: 10, y: 4 }, { x: 11, y: 4 }];
  const r = enc.castSpell(mago, 'ossosDaTerra', { point: { x: 12, y: 4 }, escalas });
  assert.ok(r.ok, r.why);
  for (const p of [...escalas, { x: 12, y: 4 }]) assert.ok(enc.field.blocksMove(p.x, p.y) && enc.field.blocksSight(p.x, p.y), `${p.x},${p.y}`);
});

await teste('Invocar Demônios Menores: eles atacam qualquer um que não seja demônio, de qualquer lado, e o grupo pode atacá-los', async () => {
  const { enc, party, mago } = montar({ prepara: ['invocarDemoniosMenores'], foes: [['ogro', { x: 18, y: 18 }]] });
  const r = enc.castSpell(mago, 'invocarDemoniosMenores', { point: { x: 8, y: 9 } });
  assert.ok(r.ok, r.why);
  const demonios = enc.combatants.filter((c) => c.invocado?.spellId === 'invocarDemoniosMenores');
  assert.ok([2, 4, 8].includes(demonios.length), `${demonios.length}`);
  assert.ok(demonios.every((d) => d.hostilATodos && d.invocado.auto));
  const d = demonios[0];
  assert.ok(enc.enemiesOf(d).some((c) => c.side === 'party' && !c.invocado), 'o demônio mira o grupo');
  assert.ok(!enc.enemiesOf(d).some((c) => demonios.includes(c)), 'e não os outros demônios');
  assert.ok(enc.enemiesOf(party[0]).includes(d), 'o grupo pode atacá-lo');
  enc.definirAutoDoInvocado(d, false);
  assert.ok(d.invocado.auto, 'ninguém o comanda');
  enc.dropConcentration(mago);
  assert.ok(demonios.every((x) => x.dead || !enc.combatants.includes(x) || x.dispensado), 'somem com a concentração');
});

await teste('Invocar Demônio Maior: o mais forte que o círculo deixa obedece até passar no Carisma do fim de um turno dele', () => {
  const { enc, mago } = montar({ prepara: ['invocarDemonioMaior'], foes: [['ogro', { x: 18, y: 18 }]] });
  const r = enc.castSpell(mago, 'invocarDemonioMaior', { point: { x: 8, y: 9 }, circulo: 4 });
  assert.ok(r.ok, r.why);
  const dm = enc.combatants.find((c) => c.invocado?.spellId === 'invocarDemonioMaior');
  assert.equal(dm.defId ?? dm.id.replace(/-.*/, ''), 'barlgura');
  assert.ok(!dm.hostilATodos);
  d20s(enc, [20]);
  const L = enc.combatants && dm;
  enc.endTurn(L);
  assert.ok(dm.hostilATodos, 'passou no Carisma e se soltou');
});

await teste('Fúria da Natureza: a Pedra da Fúria (ação bônus) só mira quem está na área; as raízes prendem no fim do turno; as árvores açoitam', () => {
  const field = new Battlefield(20, 20, Array(20).fill('.'.repeat(20)).map((l, y) => (y === 11 ? `${l.slice(0, 13)}T${l.slice(14)}` : l)));
  const party = makeParty({ nivel: 17 });
  party.forEach((c, i) => { c.pos = { x: 1, y: 1 + i * 2, f: 1 }; });
  const mago = party.find((c) => c.classe === 'mago');
  mago.pos = { x: 6, y: 9, f: 1 };
  mago.spellcasting.prepared.push('furiaDaNatureza');
  const fs = [makeMonster('goblin', { x: 12, y: 10 }), makeMonster('goblin', { x: 19, y: 19 })];
  for (const f of fs) f.hp = f.maxHp = 200;
  const enc = new Encounter({ battlefield: field, party, foes: fs, rng: makeRng(2) });
  enc.firstSide = 'party'; enc.round = 1; enc.beginSide('party');
  // (o quadrado mirado parte do canto clicado: de 8,6 a 19,17)
  const r = enc.castSpell(mago, 'furiaDaNatureza', { point: { x: 8, y: 6 } });
  assert.ok(r.ok, r.why);
  assert.ok(magiasProntas(mago).includes('pedraDaIra'));
  assert.match(enc.canCast(mago, 'pedraDaIra', { target: fs[1] }).why ?? '', /dentro da área/);
  { const q = enc.canCast(mago, 'pedraDaIra', { target: fs[0] }); assert.ok(q.ok, q.why); }
  d20s(enc, [1]);
  enc.endTurn(mago);
  assert.ok(hasCondition(fs[0], 'contido'), 'as raízes prenderam');
  const hp = fs[0].hp;
  d20s(enc, [1]);
  enc.fimDoTurnoDoLado('party'); enc.beginSide('foes'); enc.fimDoTurnoDoLado('foes'); enc.beginSide('party');
  assert.ok(fs[0].hp < hp, 'a árvore ao lado açoitou');
  enc.dropConcentration(mago);
  assert.ok(!hasCondition(fs[0], 'contido'), 'a concentração que cai solta as raízes');
});

// ---------------------------------------------------------------- as quatro que sobravam (2026-11-16)
const { skillBonus } = await import(P + 'rules/abilities.js');

await teste('Aprimorar Perícia: o dobro da proficiência na perícia treinada escolhida; a não treinada é recusada', () => {
  const { enc, mago, guerreira } = montar({ prepara: ['aprimorarPericia'] });
  const treinada = guerreira.skills[0];
  const nao = ['arcanismo', 'religiao', 'historia', 'atuacao'].find((k) => !guerreira.skills.includes(k));
  assert.match(enc.canCast(mago, 'aprimorarPericia', { target: guerreira, opcao: nao }).why ?? '', /não é treinado/);
  const antes = skillBonus(guerreira, treinada);
  const r = enc.castSpell(mago, 'aprimorarPericia', { target: guerreira, opcao: treinada });
  assert.ok(r.ok, r.why);
  assert.equal(skillBonus(guerreira, treinada) - antes, 2 + Math.floor(((guerreira.level ?? 1) - 1) / 4), 'mais uma proficiência');
  enc.dropConcentration(mago);
  assert.equal(skillBonus(guerreira, treinada), antes);
});

await teste('Aprimorar Perícia fora da luta: a tabela de exploração a tem, e a perícia escolhida vai na condição', async () => {
  const { UTIL, conjurarFora, estadoDe } = await import(P + 'rules/utilidade.js');
  assert.ok(UTIL.aprimorarPericia);
  const party = makeParty({ nivel: 17 });
  const mago = party.find((c) => c.classe === 'mago');
  const g = party.find((c) => c.classe === 'guerreiro');
  mago.spellcasting.prepared.push('aprimorarPericia');
  const estado = estadoDe({});
  const r = conjurarFora(estado, mago, 'aprimorarPericia', { herois: party, rng: makeRng(1), alvo: g, opcao: g.skills[0] });
  assert.ok(r.ok, r.why);
  assert.equal(getCondition(g, 'periciaAprimorada')?.data?.pericia, g.skills[0]);
});

await teste('Controlar Ventos: a flecha que passa pelo vento tem desvantagem, a magia não; a corrente descendente derruba quem voa; a ascendente corta a queda', () => {
  const { enc, mago, foes, guerreira } = montar({ prepara: ['controlarVentos'], foes: [['goblin', { x: 16, y: 9 }]] });
  const r = enc.castSpell(mago, 'controlarVentos', { point: { x: 10, y: 4 }, opcao: 'rajadas' });
  assert.ok(r.ok, r.why);
  assert.ok(JSON.stringify(enc.attackModifiers(foes[0], guerreira, { ranged: true })).includes('o vento'), 'a flecha que cruza o vento');
  assert.ok(!JSON.stringify(enc.attackModifiers(foes[0], guerreira, { ranged: true, deMagia: true })).includes('o vento'), 'a magia não');
  assert.ok(!JSON.stringify(enc.attackModifiers(foes[0], guerreira, { ranged: false })).includes('o vento'), 'o golpe de perto não');
  assert.ok(magiasProntas(mago).includes('mudarOVento'));
  novoTurno(mago);
  assert.ok(enc.castSpell(mago, 'mudarOVento', { opcao: 'descendente' }).ok);
  const z = enc.zonas.find((x) => x.vento);
  assert.equal(z.vento.modo, 'descendente');
  const L = enc.combatants;
  addCondition(foes[0], 'voando', { rounds: 10 });
  foes[0].voa = true;
  foes[0].pos = { ...foes[0].pos, x: 12, y: 8 };
  d20s(enc, [1]);
  const caiu = !(enc.resistirAZona(foes[0], z, 'entra'));
  assert.ok(!enc.voaAgora(foes[0]) || caiu || hasCondition(foes[0], 'caido'), 'a corrente derrubou o voador');
  novoTurno(mago);
  enc.castSpell(mago, 'mudarOVento', { opcao: 'ascendente' });
  guerreira.pos = { ...guerreira.pos, x: 12, y: 8 };
  guerreira.hp = guerreira.maxHp = 500;
  enc.rng.die = () => 6;
  enc.cair(guerreira, '10d6');
  assert.equal(500 - guerreira.hp, 30, 'a metade dos 60');
  void L;
});

await teste('Gaiola de Almas: o herói é PERGUNTADO (a oferta), e aceitando a alma fica presa; Roubar Vida cura 2d8 e gasta um dos seis usos; o morto não volta', async () => {
  const Livro = await import(P + 'rules/livro-motor.js');
  const { enc, mago, foes } = montar({ prepara: ['gaiolaDeAlmas', 'revivificar'], foes: [['bandido', { x: 9, y: 9 }]] });
  const eventos = [];
  const ouvir = enc.onEvent;
  enc.onEvent = (ev) => { eventos.push(ev); ouvir?.(ev); };
  assert.match(enc.canCast(mago, 'gaiolaDeAlmas', {}).why ?? '', /reação/);
  const altos = () => mago.spellcasting.slots.slice(6).reduce((a, b) => a + b, 0);
  const slots6 = altos();
  enc.applyDamage(foes[0], 999, 'cortante', mago);
  assert.ok(foes[0].dead);
  // nada foi gasto ainda: a tela pergunta
  assert.ok(!hasCondition(mago, 'almaNaGaiola') && !mago.reactionUsed && altos() === slots6, 'não reagiu sozinho');
  const ev = eventos.find((e) => e.type === 'ofertaDaGaiola');
  assert.ok(ev && ev.reator === mago && ev.morto === foes[0], 'a oferta foi feita');
  assert.ok(Livro.aceitarGaiola(enc, ev.oferta));
  assert.equal(altos(), slots6 - 1, 'gastou um espaço de 6º círculo ou maior');
  const g = getCondition(mago, 'almaNaGaiola');
  assert.ok(g && g.data.usos === 6, 'a alma ficou presa');
  assert.ok(mago.reactionUsed, 'gastou a reação');
  assert.equal(foes[0].almaNaGaiola, mago.id);
  // (o morto não volta: o Revivificar, que só mira aliado, recusa pela alma presa)
  foes[0].side = mago.side;
  assert.match(enc.porqueNaoAlvo(mago, SPELLS.revivificar, foes[0]) ?? '', /Gaiola de Almas/);
  foes[0].side = 'foes';
  mago.hp = 10;
  assert.ok(enc.castSpell(mago, 'roubarVidaDaAlma', {}).ok);
  assert.ok(mago.hp > 10);
  assert.equal(getCondition(mago, 'almaNaGaiola').data.usos, 5);
  novoTurno(mago);
  assert.ok(enc.castSpell(mago, 'experienciaDaAlma', {}).ok);
  assert.ok(hasCondition(mago, 'experienciaEmprestada'));
  enc.resistencia(mago, 'wis', 10);
  assert.ok(!hasCondition(mago, 'experienciaEmprestada'), 'gasta-se na próxima resistência');
});

await teste('Gaiola de Almas: recusada, nada se gasta; a oferta não vale na rodada seguinte; o monstro que a tem reage sozinho', async () => {
  const Livro = await import(P + 'rules/livro-motor.js');
  const a = montar({ prepara: ['gaiolaDeAlmas'], foes: [['bandido', { x: 9, y: 9 }], ['bandido', { x: 10, y: 10 }]] });
  a.enc.applyDamage(a.foes[0], 999, 'cortante', a.mago);
  const oferta = a.enc.ofertasDaGaiola[0];
  Livro.recusarGaiola(a.enc, oferta);
  assert.ok(!hasCondition(a.mago, 'almaNaGaiola') && !a.mago.reactionUsed);
  a.enc.applyDamage(a.foes[1], 999, 'cortante', a.mago);
  const outra = a.enc.ofertasDaGaiola[0];
  a.enc.round += 1;
  assert.equal(Livro.aceitarGaiola(a.enc, outra), false, 'a alma já se foi');
  // o monstro com a magia: reage sozinho, sem pergunta
  const b = montar({ prepara: [], foes: [['bandido', { x: 9, y: 9 }]] });
  const bruxo = b.foes[0];
  bruxo.spellcasting = { ability: 'int', cantrips: [], prepared: ['gaiolaDeAlmas'], slots: [0, 0, 0, 0, 0, 0, 1] };
  const vitima = b.party.find((c) => c.classe === 'guerreiro');
  vitima.pos = { ...vitima.pos, x: 9, y: 10 };
  b.enc.morrer(vitima);
  assert.ok(hasCondition(bruxo, 'almaNaGaiola'), 'o monstro prendeu a alma');
});

await teste('Míssil Mágico de Jim: um ataque por dardo, o crítico é 5d4, e um 1 natural estoura todos em quem conjurou', () => {
  const { enc, mago, foes } = montar({ prepara: ['missilMagicoDeJim'], foes: [['ogro', { x: 10, y: 9 }]] });
  foes[0].hp = foes[0].maxHp = 300;
  d20s(enc, [15, 20, 15]);
  enc.rng.die = ((o) => (l) => (l === 4 ? 4 : o(l)))(enc.rng.die);
  assert.ok(enc.castSpell(mago, 'missilMagicoDeJim', { target: foes[0], targets: [foes[0], foes[0], foes[0]] }).ok);
  assert.equal(300 - foes[0].hp, 8 + 20 + 8, 'dois de 2d4 e um crítico de 5d4');
  const b = montar({ prepara: ['missilMagicoDeJim'], foes: [['ogro', { x: 10, y: 9 }]] });
  const hp = b.mago.hp;
  d20s(b.enc, [15, 1, 15]);
  assert.ok(b.enc.castSpell(b.mago, 'missilMagicoDeJim', { target: b.foes[0], targets: [b.foes[0], b.foes[0], b.foes[0]] }).ok);
  assert.equal(b.foes[0].hp, b.foes[0].maxHp, 'todos erram');
  assert.equal(hp - b.mago.hp, 3, '1 por dardo em quem conjurou');
});

await teste('As filas de magia não têm mais "o motor ainda não faz" em livro nenhum', async () => {
  const fs = await import('node:fs');
  for (const l of ['phb', 'xge', 'tce', 'ai']) {
    const fila = JSON.parse(fs.readFileSync(new URL(`./magias/${l}-pendente.json`, import.meta.url), 'utf8'));
    assert.deepEqual(fila.filter((p) => /motor ainda não faz/.test(p.motivo)).map((p) => p.en), [], l);
  }
});

console.log(`\n${total - falhas}/${total} testes passaram.`);
if (falhas) process.exit(1);
