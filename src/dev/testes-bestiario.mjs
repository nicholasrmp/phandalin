// O BESTIÁRIO QUE SÓ ERA TEXTO: os traços de monstro que o bloco prometia e o motor não fazia, cada um agora no motor.
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-bestiario.mjs
//
// Cada prova foi escrita para FALHAR sem o código que ela mede. O levantamento do que faltava (71 traços que nenhum
// código lia pelo nome, separados entre "o motor já faz por campo" e "só texto") está em
// `revisoes/obelisco-5a8-plano-2026-11-08.md`, na seção da cripta e do que tinha ficado de fora.
import assert from 'node:assert/strict';

const P = new URL('../', import.meta.url).href;
const { Encounter } = await import(P + 'rules/combat.js');
const { makeParty } = await import(P + 'rules/party.js');
const { makeMonster } = await import(P + 'rules/monsters.js');
const { Battlefield, distanceFt } = await import(P + 'core/grid.js');
const { makeRng } = await import(P + 'core/rng.js');
const { hasCondition, getCondition, addCondition } = await import(P + 'rules/conditions.js');
const { vantagemPorTraco } = await import(P + 'rules/passivas.js');
const { passivePerception } = await import(P + 'rules/abilities.js');
const { takeMonsterTurn } = await import(P + 'rules/ai.js');
const { SPELLS } = await import(P + 'rules/spells.js');

let total = 0;
let falhas = 0;
async function teste(nome, fn) {
  total += 1;
  try { await fn(); console.log(`ok    ${nome}`); } catch (e) {
    falhas += 1;
    console.log(`FALHA ${nome}\n      ${String(e.stack ?? e.message).split('\n').slice(0, 6).join('\n      ')}`);
  }
}

const ABERTO = Array(14).fill('..............');
function montar({ seed = 1, foes = [], pos = null, lado = 'party', nivel = 6, mapa = ABERTO } = {}) {
  const field = new Battlefield(mapa[0].length, mapa.length, mapa);
  const party = makeParty({ nivel });
  const pp = pos ?? [{ x: 5, y: 5 }, { x: 1, y: 1 }, { x: 1, y: 3 }, { x: 1, y: 12 }];
  party.forEach((c, i) => { c.pos = { ...c.pos, ...pp[i] }; });
  const fs = foes.map(([id, p]) => makeMonster(id, p));
  const log = [];
  const enc = new Encounter({ battlefield: field, party, foes: fs, rng: makeRng(seed), onLog: (e) => log.push(e) });
  enc.firstSide = lado;
  enc.round = 1;
  enc.beginSide(lado);
  const texto = () => log.map((l) => l.text ?? l.msg ?? String(l)).join('\n');
  return { enc, party, foes: fs, log, texto, field };
}
const novoTurno = (m) => { m.actionUsed = false; m.bonusUsed = false; m.reactionUsed = false; m.acted = false; };

// ------------------------------------------------------------------------------------- resistências e sentidos ----
await teste('Bravura, Devoção Sombria, Ascendência Feérica, Astúcia Gnômica e Pés Firmes dão a vantagem do livro', () => {
  const m = (traits) => ({ traits, features: [] });
  assert.deepEqual(vantagemPorTraco(m(['bravura']), 'wis', { condicao: 'amedrontado' }), ['Bravura']);
  assert.deepEqual(vantagemPorTraco(m(['devocaoSombria']), 'wis', { condicao: 'enfeiticado' }), ['Devoção Sombria']);
  assert.deepEqual(vantagemPorTraco(m(['ascendenciaFeerica']), 'wis', { condicao: 'enfeiticado' }), ['Ascendência Feérica']);
  assert.deepEqual(vantagemPorTraco(m(['astuciaGnomica']), 'int', { magico: true }), ['Astúcia Gnômica']);
  assert.deepEqual(vantagemPorTraco(m(['pesFirmes']), 'str', { condicao: 'caido' }), ['Pés Firmes']);
  assert.deepEqual(vantagemPorTraco(m(['pesFirmes']), 'wis', { condicao: 'caido' }), [], 'Pés Firmes é só Força e Destreza');
  const { enc } = montar({ foes: [['drow', { x: 9, y: 9 }]] });
  assert.ok(enc.imuneASonoMagico(enc.combatants.find((c) => c.defId === 'drow')), 'o drow não dorme por magia');
});

await teste('Audição e Visão Apuradas (o batedor) somam 5 na Percepção passiva', () => {
  const b = makeMonster('batedor', { x: 0, y: 0 });
  const semTraco = { ...b, traits: [] };
  assert.equal(passivePerception(b) - passivePerception(semTraco), 5);
});

await teste('Visão às cegas: enxerga no escuro e vê o invisível no alcance dela', async () => {
  const { visaoNoEscuro } = await import(P + 'rules/luz.js');
  const morcego = makeMonster('morcegoGigante', { x: 0, y: 0 });
  assert.ok(visaoNoEscuro(morcego) >= 60, 'a ecolocalização é visão no escuro');
  const { enc, party } = montar({ foes: [['morcegoGigante', { x: 6, y: 5 }]] });
  const m = enc.combatants.find((c) => c.defId === 'morcegoGigante');
  addCondition(party[0], 'invisivel', { rounds: 10 });
  const mods = enc.attackModifiers(party[0], m, {});
  assert.ok(!JSON.stringify(mods).includes('atacante invisível'), 'colado, a visão às cegas vê o invisível');
});

await teste('Sensibilidade à Luz Solar: ao ar livre de dia o drow ataca com desvantagem; na caverna (grade de luz), não', () => {
  const { enc, party } = montar({ foes: [['drow', { x: 6, y: 5 }]] });
  const d = enc.combatants.find((c) => c.defId === 'drow');
  assert.match(JSON.stringify(enc.attackModifiers(d, party[0], {})), /luz do sol/);
  enc.field.luz = new Uint8Array(enc.field.w * enc.field.h).fill(1);
  assert.doesNotMatch(JSON.stringify(enc.attackModifiers(d, party[0], {})), /luz do sol/);
});

// ------------------------------------------------------------------------------------------------- movimento ----
const PAREDE = ['..........', '..........', '##########', '..........', '..........', '..........', '..........', '..........'];
await teste('Movimento Incorpóreo: o espectro atravessa a parede, não para dentro dela, e quem termina na pedra leva 1d10', () => {
  const { enc } = montar({ mapa: PAREDE, pos: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }], foes: [['espectro', { x: 2, y: 5 }], ['goblin', { x: 7, y: 5 }]], lado: 'foes' });
  const [e, g] = enc.combatants.filter((c) => c.side === 'foes');
  const re = enc.reachableFor(e);
  assert.ok(re.get('2,1')?.parar, 'do outro lado da parede');
  assert.equal(re.get('2,2')?.parar, false, 'dentro da parede não para');
  assert.ok(!enc.reachableFor(g).has('7,1'), 'o goblin não passa');
  e.pos = { ...e.pos, x: 4, y: 2 };
  const antes = e.hp;
  enc.fimDoTurnoDoLado('foes');
  assert.ok(e.hp < antes, 'terminou o turno dentro da pedra');
});

const ROCHA = ['..........', '..........', 'RRRRRRRRRR', '..........', '..........', '..........'];
await teste('Deslizar na Terra atravessa rocha natural (não alvenaria) sem parar; a broca abre túnel e o túnel fica', () => {
  const { enc } = montar({ mapa: ROCHA, pos: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }], foes: [['elementalDaTerra', { x: 2, y: 4 }]], lado: 'foes' });
  const el = enc.combatants.find((c) => c.defId === 'elementalDaTerra');
  const r = enc.reachableFor(el);
  assert.ok([...r.values()].some((n) => n.y <= 1 && n.parar), 'chega do outro lado da rocha');
  assert.ok(![...r.values()].some((n) => n.y === 2 && n.parar), 'não para dentro da rocha');
  const ALV = ROCHA.map((l) => l.replace(/R/g, 'M'));
  const { enc: e2 } = montar({ mapa: ALV, pos: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }], foes: [['elementalDaTerra', { x: 2, y: 4 }]], lado: 'foes' });
  const el2 = e2.combatants.find((c) => c.defId === 'elementalDaTerra');
  assert.ok(![...e2.reachableFor(el2).values()].some((n) => n.y <= 1), 'alvenaria é pedra trabalhada');
  // a broca
  const BIG = ['RRRRRRRRRRRRRR', 'RRRRRRRRRRRRRR', 'RRRRRRRRRRRRRR', '..............', '..............', '..............', '..............', '..............'];
  const { enc: e3 } = montar({ mapa: BIG, pos: [{ x: 0, y: 7 }, { x: 1, y: 7 }, { x: 2, y: 7 }, { x: 3, y: 7 }], foes: [['brocaInfernal', { x: 5, y: 3 }]], lado: 'foes' });
  const b = e3.combatants.find((c) => c.defId === 'brocaInfernal');
  const rb = e3.reachableFor(b);
  const destino = [...rb.values()].find((n) => n.y === 0 && n.parar);
  assert.ok(destino, 'a broca entra na rocha');
  e3.moveAlong(b, Battlefield.pathFrom(rb, destino));
  assert.ok(!e3.field.blocksMove(b.pos.x, b.pos.y), 'onde ela está virou túnel');
  assert.equal(e3.field.surfaceAt(b.pos.x, b.pos.y), 'caverna');
});

await teste('Escalada do bloco: a aranha gigante sobe o degrau que trava quem anda', () => {
  const { enc } = montar({ foes: [['aranhaGigante', { x: 8, y: 8 }]] });
  const a = enc.combatants.find((c) => c.defId === 'aranhaGigante');
  assert.ok(enc.escalaAgora(a));
});

await teste('Amorfo: a gelatina ocre passa pela grade, o goblin não', () => {
  const { enc } = montar({ foes: [['gelatinaOcre', { x: 6, y: 6 }], ['goblin', { x: 6, y: 8 }]], lado: 'foes' });
  enc.field.vaos = new Set(['6,7']);
  enc.field.tiles[7 * enc.field.w + 6] = 1;
  const [o, g] = enc.combatants.filter((c) => c.side === 'foes');
  assert.ok(enc.reachableFor(o).has('6,7'), 'a gelatina atravessa a fresta');
  assert.ok(!enc.reachableFor(g).has('6,7'));
});

await teste('Andar na Teia: a aranha não testa contra a teia nem paga o terreno dela', () => {
  const { enc } = montar({ foes: [['aranhaGigante', { x: 8, y: 8 }]] });
  const a = enc.combatants.find((c) => c.defId === 'aranhaGigante');
  assert.equal(enc.resistirAZona(a, { spellId: 'teia', condition: 'contido', save: 'dex', cd: 30, casas: new Set() }, 'entra'), true);
  assert.ok(!hasCondition(a, 'contido'));
  enc.field.dificeis = new Set(['9,8']);
  enc.field.dificeisDeTeia = new Set(['9,8']);
  enc.field.andaNaTeia = true;
  assert.equal(enc.field.costOf(9, 8, 8, 8), 5);
  enc.field.andaNaTeia = false;
  assert.equal(enc.field.costOf(9, 8, 8, 8), 10);
});

// ----------------------------------------------------------------------------------------------- golpes ----
await teste('Investida em LINHA RETA: o javali que corre 6 m reto embala; dobrando a esquina, não; o tigre que derruba morde', () => {
  let embalou = 0;
  let mordeu = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const { enc, party, texto } = montar({ seed, foes: [['javali', { x: 11, y: 5 }]], lado: 'foes' });
    const j = enc.combatants.find((c) => c.defId === 'javali');
    const caminho = [{ x: 11, y: 5 }, { x: 10, y: 5 }, { x: 9, y: 5 }, { x: 8, y: 5 }, { x: 7, y: 5 }, { x: 6, y: 5 }];
    enc.moveAlong(j, caminho);
    enc.resolveAttack(j, party[0], { weaponId: 'Presas' });
    if (/embalado/.test(texto())) embalou++;
    const t = montar({ seed, foes: [['tigreDenteDeSabre', { x: 11, y: 5 }]], lado: 'foes' });
    const tg = t.enc.combatants.find((c) => c.defId === 'tigreDenteDeSabre');
    t.enc.moveAlong(tg, caminho);
    t.enc.resolveAttack(tg, t.party[0], { weaponId: 'Garras' });
    if (hasCondition(t.party[0], 'caido') && /Mordida/.test(t.texto())) mordeu++;
  }
  assert.ok(embalou > 0, 'o javali nunca embalou');
  assert.ok(mordeu > 0, 'o tigre derrubou e não mordeu');
  // dobrando a esquina no fim
  const { enc, party, texto } = montar({ foes: [['javali', { x: 9, y: 2 }]], lado: 'foes' });
  const j = enc.combatants.find((c) => c.defId === 'javali');
  enc.moveAlong(j, [{ x: 9, y: 2 }, { x: 9, y: 3 }, { x: 9, y: 4 }, { x: 8, y: 4 }, { x: 7, y: 4 }, { x: 6, y: 5 }]);
  for (let i = 0; i < 20; i++) enc.resolveAttack(j, party[0], { weaponId: 'Presas' });
  assert.doesNotMatch(texto(), /embalado/);
});

await teste('Implacável: o javali que levaria 7 ou menos fica com 1 PV, uma vez', () => {
  const { enc } = montar({ foes: [['javali', { x: 9, y: 9 }]] });
  const j = enc.combatants.find((c) => c.defId === 'javali');
  j.hp = 3;
  enc.applyDamage(j, 6, 'cortante');
  assert.equal(j.hp, 1);
  assert.ok(!j.dead);
  enc.applyDamage(j, 6, 'cortante');
  assert.ok(j.dead, 'só uma vez');
});

await teste('Ataque Furtivo do espião: o bloco leva o traço para o combate e o golpe com vantagem soma 2d6', () => {
  const { enc, party, texto } = montar({ foes: [['espiao', { x: 6, y: 5 }]], lado: 'foes' });
  const e = enc.combatants.find((c) => c.defId === 'espiao');
  assert.equal(e.sneakAttack, '2d6');
  addCondition(party[0], 'cego', { rounds: 5 });
  let somou = false;
  for (let i = 0; i < 20 && !somou; i++) {
    e.sneakUsedThisTurn = false;
    const r = enc.resolveAttack(e, party[0], { weaponId: 'Espada curta' });
    if (r?.hit && e.sneakUsedThisTurn) somou = true;
  }
  assert.ok(somou, texto().slice(-300));
});

await teste('Aparar: o drow de elite soma 2 na CA contra o golpe de perto que ia acertar por pouco', () => {
  let aparou = false;
  for (let seed = 1; seed <= 80 && !aparou; seed++) {
    const { enc, party, texto } = montar({ seed, foes: [['drowGuerreiroDeElite', { x: 6, y: 5 }]] });
    const d = enc.combatants.find((c) => c.defId === 'drowGuerreiroDeElite');
    enc.resolveAttack(party[0], d, {});
    if (/apara o golpe/.test(texto())) { aparou = true; assert.ok(d.reactionUsed); }
  }
  assert.ok(aparou);
});

await teste('Armas Mágicas: o golpe do golem de argila passa pela resistência a arma comum', () => {
  const { enc } = montar({ foes: [['golemDeArgila', { x: 6, y: 5 }]] });
  const g = enc.combatants.find((c) => c.defId === 'golemDeArgila');
  assert.equal(enc.weaponAttackProfile(g, 'Pancada').magico, true);
});

await teste('Absorção de Raios: o raio cura o monte errante', () => {
  const { enc } = montar({ foes: [['arbustoErrante', { x: 9, y: 9 }]] });
  const m = enc.combatants.find((c) => c.defId === 'arbustoErrante');
  m.hp = 10;
  enc.applyDamage(m, 7, 'elétrico', null, { magico: true });
  assert.equal(m.hp, 17);
});

// ------------------------------------------------------------------------------------------- ações e magia ----
await teste('O grell leva quem agarra quando voa', () => {
  const { enc, party } = montar({ foes: [['grell', { x: 6, y: 5 }]], lado: 'foes' });
  const g = enc.combatants.find((c) => c.defId === 'grell');
  addCondition(party[0], 'contido', { source: g.id });
  enc.moveAlong(g, [{ x: 6, y: 5 }, { x: 7, y: 5 }, { x: 8, y: 5 }, { x: 9, y: 5 }]);
  assert.ok(distanceFt(party[0].pos, g.pos) <= 5, 'o agarrado devia ter ido junto');
});

await teste('O quasit assusta (Sabedoria CD 10, uma vez por dia; a nova resistência tem desvantagem à vista dele) e vira morcego', () => {
  let assustou = false;
  for (let seed = 1; seed <= 40 && !assustou; seed++) {
    const { enc, party } = montar({ seed, foes: [['quasit', { x: 7, y: 5 }]], lado: 'foes' });
    const q = enc.combatants.find((c) => c.defId === 'quasit');
    party[0].abilities = { ...party[0].abilities, wis: 1 };
    assert.ok(enc.sustoDoQuasit(q, party[0]));
    novoTurno(q);
    assert.equal(enc.sustoDoQuasit(q, party[0]), false, 'uma vez por dia');
    const c = getCondition(party[0], 'amedrontado');
    if (c) { assustou = true; assert.ok(c.data.desvantagemSeVe); }
  }
  assert.ok(assustou);
  const { enc } = montar({ foes: [['quasit', { x: 7, y: 5 }]], lado: 'foes' });
  const q = enc.combatants.find((c) => c.defId === 'quasit');
  assert.ok(enc.mudarDeForma(q, 'morcego'));
  assert.equal(q.flyFt, 40);
  novoTurno(q);
  enc.mudarDeForma(q, 'verdadeira');
  assert.equal(q.speedFt, 40);
  assert.ok(!q.flyFt);
});

await teste('O polvo solta a tinta na água (escuridão pesada) e dispara; fora dela, não; e tem vantagem para se esconder na água', () => {
  const AGUA = ['..............', '..||||||||....', '..||||||||....', '..||||||||....', '..||||||||....', '..............'];
  const { enc } = montar({ mapa: AGUA, pos: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 12, y: 0 }, { x: 13, y: 0 }], foes: [['polvoGigante', { x: 4, y: 2 }]], lado: 'foes' });
  const p = enc.combatants.find((c) => c.defId === 'polvoGigante');
  const mov = p.movementLeftFt;
  assert.ok(enc.nuvemDeTinta(p));
  const z = enc.zonas.find((x) => x.spellId === 'nuvemDeTinta');
  assert.ok(z && z.obscuro === 'pesada');
  assert.ok([...z.casas].every((k) => enc.field.aguas.has(k)), 'a tinta fica na água');
  assert.ok(p.movementLeftFt > mov, 'disparou');
  assert.equal(enc.nuvemDeTinta(p), false, 'uma vez por descanso');
  assert.deepEqual(enc.furtividadeDoTerreno(p), { advantage: true });
  p.pos = { ...p.pos, x: 12, y: 5 };
  assert.deepEqual(enc.furtividadeDoTerreno(p), {});
});

await teste('Camuflagem de Pedra: o grick tem vantagem para se esconder na rocha', () => {
  const MAPA = ['RRRR......', '__________', '..........'];
  const { enc } = montar({ mapa: MAPA, pos: [{ x: 9, y: 2 }, { x: 8, y: 2 }, { x: 7, y: 2 }, { x: 6, y: 2 }], foes: [['grick', { x: 1, y: 1 }]] });
  const g = enc.combatants.find((c) => c.defId === 'grick');
  assert.deepEqual(enc.furtividadeDoTerreno(g), { advantage: true });
  g.pos = { ...g.pos, x: 6, y: 1 };
  assert.deepEqual(enc.furtividadeDoTerreno(g), { advantage: true }, 'caverna é chão de pedra');
});

await teste('O revenant não se expulsa; o spectator não é pego de surpresa; a hidra não é pega dormindo', () => {
  const { enc, party } = montar({ foes: [['revenant', { x: 6, y: 5 }], ['zumbi', { x: 5, y: 6 }]] });
  const clerigo = party.find((c) => c.features?.includes('channelDivinity') || c.resources?.channelDivinity);
  clerigo.pos = { ...clerigo.pos, x: 6, y: 7 };
  clerigo.resources.channelDivinity = 1;
  clerigo.actionUsed = false;
  enc.useFeature(clerigo, 'turnUndead');
  const r = enc.combatants.find((c) => c.defId === 'revenant');
  assert.ok(!hasCondition(r, 'amedrontado'));
  // o spectator
  const s = montar({ foes: [['spectator', { x: 9, y: 9 }]], lado: 'party' });
  s.enc.emboscada = { emboscadores: 'party', furtividade: [99] };
  const surpresos = s.enc.rolarSurpresa();
  assert.equal(surpresos.size, 0);
  // a hidra
  const h = montar({ foes: [['hidra', { x: 9, y: 9 }]], lado: 'party' });
  h.enc.emboscada = { emboscadores: 'party', furtividade: [1] };
  h.enc.dormindo = () => true;
  assert.equal(h.enc.rolarSurpresa().size, 0);
});

await teste('O Furor do golem: a 60 PV ou menos, num 6, ele bate no mais perto, aliado ou não', () => {
  let furioso = false;
  for (let seed = 1; seed <= 40 && !furioso; seed++) {
    const { enc } = montar({ seed, foes: [['golemDeArgila', { x: 9, y: 9 }]], lado: 'foes' });
    const g = enc.combatants.find((c) => c.defId === 'golemDeArgila');
    g.hp = 50;
    enc.inicioDoTurnoDoBloco(g);
    if (g.furioso) furioso = true;
  }
  assert.ok(furioso);
  const { enc } = montar({ foes: [['golemDeArgila', { x: 9, y: 9 }], ['goblin', { x: 11, y: 9 }]], lado: 'foes' });
  const [g, gob] = enc.combatants.filter((c) => c.side === 'foes');
  g.furioso = true;
  const antes = gob.hp;
  for (let i = 0; i < 4 && !gob.dead && gob.hp === antes; i++) { novoTurno(g); takeMonsterTurn(enc, g); }
  assert.ok(gob.hp < antes || gob.dead, 'o golem furioso devia bater no goblin colado');
});

await teste('Criar Espectro: a aparição ergue o herói recém-morto a 3 m como espectro do lado dela', () => {
  const { enc, party } = montar({ foes: [['wraith', { x: 6, y: 5 }]], lado: 'foes' });
  const w = enc.combatants.find((c) => c.defId === 'wraith');
  enc.morrer(party[0]);
  assert.ok(party[0].dead);
  takeMonsterTurn(enc, w);
  const e = enc.combatants.find((c) => c.defId === 'espectro');
  assert.ok(e && e.side === 'foes' && e.criadoPor === w.id, 'o espectro devia ter levantado');
  assert.ok(party[0].espectroErguido);
});

await teste('Suscetibilidade Antimágica: Dissipar Magia na armadura animada a derruba se ela falhar em Constituição', () => {
  let caiu = false;
  for (let seed = 1; seed <= 40 && !caiu; seed++) {
    const { enc, party } = montar({ seed, foes: [['armaduraAnimada', { x: 7, y: 5 }]] });
    const mago = party.find((c) => c.spellcasting && ['int', 'wis', 'cha'].includes(c.spellcasting.ability));
    mago.spellcasting.prepared = [...(mago.spellcasting.prepared ?? []), 'dissiparMagia'];
    mago.spellcasting.slots = [0, 4, 3, 3];
    mago.pos = { ...mago.pos, x: 6, y: 5 };
    mago.actionUsed = false;
    const a = enc.combatants.find((c) => c.defId === 'armaduraAnimada');
    const r = enc.castSpell(mago, 'dissiparMagia', { target: a, point: a.pos, circulo: 3 });
    assert.ok(r.ok, r.why);
    if (hasCondition(a, 'inconsciente')) caiu = true;
  }
  assert.ok(caiu);
});

await teste('A água viva fica invisível na água e não sai dela', () => {
  const AGUA = ['..............', '..||||||||....', '..||||||||....', '..............'];
  const { enc } = montar({ mapa: AGUA, pos: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 12, y: 0 }, { x: 13, y: 0 }], foes: [['aguaViva', { x: 4, y: 1 }]], lado: 'foes' });
  const w = enc.combatants.find((c) => c.defId === 'aguaViva');
  assert.ok(hasCondition(w, 'invisivel'));
  const r = enc.reachableFor(w);
  assert.ok([...r.values()].every((n) => enc.field.aguas.has(`${n.x},${n.y}`)), 'presa à água');
});

await teste('O conjurador do SRD conjura no turno: o acólito cura o aliado ferido; o sacerdote abre com a Bênção', () => {
  const { enc } = montar({ foes: [['acolito', { x: 10, y: 10 }], ['goblin', { x: 11, y: 10 }]], lado: 'foes' });
  const [a, g] = enc.combatants.filter((c) => c.side === 'foes');
  g.hp = 2;
  takeMonsterTurn(enc, a);
  assert.ok(g.hp > 2, 'o acólito devia ter curado o goblin');
  const s = montar({ foes: [['sacerdote', { x: 10, y: 10 }], ['goblin', { x: 11, y: 10 }], ['goblin', { x: 10, y: 11 }]], lado: 'foes' });
  const sac = s.enc.combatants.find((c) => c.defId === 'sacerdote');
  takeMonsterTurn(s.enc, sac);
  assert.ok(s.enc.combatants.some((c) => c.defId === 'goblin' && hasCondition(c, 'abencoado')), 'a Bênção');
});

await teste('Eminência Divina: o sacerdote colado gasta um espaço e o golpe soma radiante', () => {
  const { enc, party, texto } = montar({ foes: [['sacerdote', { x: 6, y: 5 }]], lado: 'foes' });
  const s = enc.combatants.find((c) => c.defId === 'sacerdote');
  s.spellcasting.prepared = [];
  for (let i = 0; i < 6 && !/Eminência Divina/.test(texto()); i++) { novoTurno(s); takeMonsterTurn(enc, s); }
  assert.match(texto(), /Eminência Divina/);
});

await teste('O drow ferido e cercado some na Escuridão; o Nezznar manda o mais forte embora com a Sugestão', () => {
  const { enc } = montar({ foes: [['drow', { x: 6, y: 5 }]], lado: 'foes' });
  const d = enc.combatants.find((c) => c.defId === 'drow');
  d.hp = 3;
  takeMonsterTurn(enc, d);
  assert.ok(enc.zonas.some((z) => z.spellId === 'escuridao'), 'a Escuridão');
  const n = montar({ foes: [['nezznar', { x: 8, y: 5 }]], lado: 'foes' });
  const nz = n.enc.combatants.find((c) => c.defId === 'nezznar');
  takeMonsterTurn(n.enc, nz);
  assert.ok(nz.tentouSugerir?.size || nz.concentrating, 'a Sugestão (ou outra magia de concentração) devia sair');
});

await teste('O comandante goblin psíquico ferido arremessa quem o cerca (Telecinese) e enfeitiça na primeira chance', () => {
  let jogou = false;
  for (let seed = 1; seed <= 40 && !jogou; seed++) {
    const { enc, party } = montar({ seed, foes: [['goblinPsiComandante', { x: 6, y: 5 }]], lado: 'foes' });
    const g = enc.combatants.find((c) => c.defId === 'goblinPsiComandante');
    g.recarregando = { 'Rasgo Sináptico': true };
    g.hp = 5;
    const de = { ...party[0].pos };
    takeMonsterTurn(enc, g);
    if (g.telecineseUsada && distanceFt(de, party[0].pos) > 0) { jogou = true; assert.ok(hasCondition(party[0], 'contido')); }
  }
  assert.ok(jogou);
  const { enc } = montar({ foes: [['goblinPsiComandante', { x: 8, y: 5 }]], lado: 'foes' });
  const g = enc.combatants.find((c) => c.defId === 'goblinPsiComandante');
  g.recarregando = { 'Rasgo Sináptico': true };
  takeMonsterTurn(enc, g);
  assert.ok(g.tentouEnfeiticar, 'o Enfeitiçar Pessoa');
});

await teste('Liderança do cavaleiro: os aliados a 9 m somam 1d4, uma vez', () => {
  const { enc } = montar({ foes: [['cavaleiro', { x: 10, y: 10 }], ['goblin', { x: 11, y: 10 }], ['goblin', { x: 10, y: 11 }]], lado: 'foes' });
  const k = enc.combatants.find((c) => c.defId === 'cavaleiro');
  takeMonsterTurn(enc, k);
  assert.ok(enc.combatants.filter((c) => c.defId === 'goblin').every((g) => hasCondition(g, 'lideranca')));
  novoTurno(k);
  assert.equal(enc.lideranca(k), false);
});

await teste('Ação Astuta do espião: ferido e colado, desengaja de bônus e recua', () => {
  const { enc, party } = montar({ foes: [['espiao', { x: 6, y: 5 }]], lado: 'foes' });
  const e = enc.combatants.find((c) => c.defId === 'espiao');
  e.hp = 5;
  takeMonsterTurn(enc, e);
  assert.ok(e.bonusUsed && distanceFt(e.pos, party[0].pos) > 5);
});

await teste('A Visagem da banshee envelhece quem falha por 5', () => {
  let velho = false;
  for (let seed = 1; seed <= 60 && !velho; seed++) {
    const { enc, party } = montar({ seed, foes: [['banshee', { x: 8, y: 5 }]], lado: 'foes' });
    party[0].abilities = { ...party[0].abilities, wis: 1 };
    party[0].saves = [];
    enc.visagemHorripilante(enc.combatants.find((c) => c.defId === 'banshee'));
    if (party[0].anosEnvelhecidos) velho = true;
  }
  assert.ok(velho);
});

await teste('A estátua do Santuário guarda o Assassino Fantasmagórico para quem ela não alcança: com alguém perto, soca', () => {
  const { enc, party } = montar({ foes: [['ruxithid', { x: 11, y: 5 }], ['guardiaoEscudo', { x: 6, y: 4 }]], lado: 'foes' });
  const [r, g] = enc.combatants.filter((c) => c.side === 'foes');
  g.comandadoPor = r.id;
  g.magiaGuardada = 'assassinoFantasmagorico';
  g.spellcasting = { ability: 'int', cantrips: [], prepared: ['assassinoFantasmagorico'], slots: [0, 0, 0, 0, 1], cdPorMagia: { assassinoFantasmagorico: 15 } };
  takeMonsterTurn(enc, g);
  assert.equal(g.spellcasting.slots[4], 1, 'colado no herói, ele devia socar e guardar a magia');
  // longe de todos e sem caminho: solta
  const longe = montar({ mapa: ['..............', '..............', '##############', '..............', '..............'],
    pos: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }], foes: [['ruxithid', { x: 11, y: 4 }], ['guardiaoEscudo', { x: 2, y: 3 }]], lado: 'foes' });
  const [r2, g2] = longe.enc.combatants.filter((c) => c.side === 'foes');
  Object.assign(g2, { comandadoPor: r2.id, magiaGuardada: 'assassinoFantasmagorico', spellcasting: { ...g.spellcasting, slots: [0, 0, 0, 0, 1] } });
  longe.enc.field.hasLineOfSight = () => true;
  takeMonsterTurn(longe.enc, g2);
  assert.equal(g2.spellcasting.slots[4], 0, 'sem alcançar ninguém, ele solta a magia guardada');
});

await teste('Ações lendárias: depois do turno de um herói o dragão gasta uma; no começo do lado dele, voltam as três', () => {
  const { enc, party, texto } = montar({ foes: [['dragaoDeLataoAnciao', { x: 7, y: 5 }]], pos: [{ x: 6, y: 5 }, { x: 6, y: 6 }, { x: 1, y: 12 }, { x: 0, y: 12 }], lado: 'party' });
  const d = enc.combatants.find((c) => c.defId === 'dragaoDeLataoAnciao');
  assert.equal(d.lendariasRestantes, 3);
  enc.endTurn(party[3]);
  assert.ok(d.lendariasRestantes < 3, 'devia ter gastado uma ação lendária');
  assert.match(texto(), /ação lendária/);
  const restam = d.lendariasRestantes;
  enc.endTurn(d);
  assert.equal(d.lendariasRestantes, restam, 'o próprio turno não dá ação lendária a ele');
  enc.beginSide('foes');
  assert.equal(d.lendariasRestantes, 3);
});

await teste('Presença Aterradora: quem falha fica amedrontado; quem passa não teme mais esta criatura', () => {
  let passou = false; let falhou = false;
  for (let seed = 1; seed <= 30 && !(passou && falhou); seed++) {
    const { enc, party } = montar({ seed, foes: [['dragaoDeLataoAnciao', { x: 9, y: 5 }]], lado: 'foes' });
    const d = enc.combatants.find((c) => c.defId === 'dragaoDeLataoAnciao');
    enc.presencaAterradoraDe(d);
    for (const h of party) {
      if (hasCondition(h, 'amedrontado')) falhou = true;
      else if (h.imuneAPresenca?.includes(d.id)) { passou = true; removeAndAgain(enc, d, h); }
    }
  }
  assert.ok(passou && falhou);
});
function removeAndAgain(enc, d, h) {
  enc.presencaAterradoraDe(d);
  assert.ok(!hasCondition(h, 'amedrontado'), 'quem já resistiu não testa de novo');
}

// ============================================================ a fila do motor do Monster Manual ====
const traz = (enc, id) => enc.combatants.find((c) => c.defId === id);

await teste('Troll: regenera 10; fogo ou ácido suspendem; a 0 PV cai e só morre se começar o turno sem regenerar', () => {
  const { enc, party } = montar({ foes: [['troll', { x: 8, y: 5 }]], lado: 'party' });
  const t = traz(enc, 'troll');
  t.hp = 50;
  enc.inicioDoTurnoDoBloco(t);
  assert.equal(t.hp, 60);
  enc.applyDamage(t, 5, 'fogo', party[0], { magico: true });
  enc.inicioDoTurnoDoBloco(t);
  assert.equal(t.hp, 55, 'o fogo suspendeu');
  enc.applyDamage(t, 999, 'cortante', party[0]);
  assert.ok(!t.dead && t.caidoRegenerando && !enc.checkEnd(), 'a 0 PV ele cai, e a luta continua');
  enc.inicioDoTurnoDoBloco(t);
  assert.ok(!t.dead && t.hp === 10, 'sem fogo, levanta');
  enc.applyDamage(t, 999, 'cortante', party[0]);
  enc.applyDamage(t, 3, 'ácido', party[0], { magico: true });
  enc.inicioDoTurnoDoBloco(t);
  assert.ok(t.dead, 'caído e queimado de ácido, morre');
});

await teste('Enxame: com metade dos PV ou menos, o golpe é o dado menor', () => {
  const { enc } = montar({ foes: [['enxameDeMorcegos', { x: 8, y: 5 }]] });
  const e = traz(enc, 'enxameDeMorcegos');
  const cheio = enc.weaponAttackProfile(e, e.attacks[0].name).damage;
  e.hp = Math.floor(e.maxHp / 2);
  assert.notEqual(enc.weaponAttackProfile(e, e.attacks[0].name).damage, cheio);
});

await teste('Frenesi de Sangue, Imprudente e Sensibilidade à Luz mudam a jogada como o livro diz', () => {
  const { enc, party } = montar({ foes: [['tubaraoGigante', { x: 6, y: 5 }], ['minotauro', { x: 6, y: 6 }], ['grimlock', { x: 4, y: 5 }]] });
  const [tub, min, gri] = ['tubaraoGigante', 'minotauro', 'grimlock'].map((id) => traz(enc, id));
  const h = party[0];
  assert.doesNotMatch(JSON.stringify(enc.attackModifiers(tub, h, {})), /frenesi/);
  h.hp -= 1;
  assert.match(JSON.stringify(enc.attackModifiers(tub, h, {})), /frenesi/);
  assert.match(JSON.stringify(enc.attackModifiers(min, h, {})), /imprudente/);
  assert.match(JSON.stringify(enc.attackModifiers(h, min, {})), /alvo imprudente/);
  if (gri.traits.includes('sensibilidadeALuz')) assert.match(JSON.stringify(enc.attackModifiers(gri, h, {})), /luz plena/);
});

await teste('Voo Rasante: o peryton sai voando de perto sem provocar', () => {
  const { enc, party } = montar({ foes: [['peryton', { x: 6, y: 5 }]], lado: 'foes' });
  const p = traz(enc, 'peryton');
  assert.deepEqual(enc.ameacasNoPasso(p, p.pos, { x: 9, y: 5 }), []);
  void party;
});

await teste('Rampage: a hiena que derruba alguém de perto anda e morde de ação bônus', () => {
  let mordeu = false;
  for (let seed = 1; seed <= 40 && !mordeu; seed++) {
    const { enc, party, texto } = montar({ seed, foes: [['hienaGigante', { x: 6, y: 5 }]], pos: [{ x: 5, y: 5 }, { x: 8, y: 6 }, { x: 1, y: 1 }, { x: 1, y: 12 }], lado: 'foes' });
    const h = traz(enc, 'hienaGigante');
    party[0].hp = 1;
    enc.resolveAttack(h, party[0], { weaponId: h.attacks[0].name });
    if (/Rampage/.test(texto())) { mordeu = true; assert.ok(h.bonusUsed); }
  }
  assert.ok(mordeu);
});

await teste('Aura de Medo do diabo das profundezas: quem começa o turno perto testa; quem passa não testa mais', () => {
  let medo = false; let imune = false;
  for (let seed = 1; seed <= 30 && !(medo && imune); seed++) {
    const { enc, party } = montar({ seed, foes: [['diaboDasProfundezas', { x: 8, y: 5 }]], pos: [{ x: 5, y: 5 }, { x: 5, y: 7 }, { x: 1, y: 1 }, { x: 1, y: 12 }], lado: 'foes' });
    const d = traz(enc, 'diaboDasProfundezas');
    party[1].abilities = { ...party[1].abilities, wis: 30 };
    enc.beginSide('party');
    // quem passou não testa de novo na rodada seguinte
    if (party[1].imuneAAura?.includes(d.id)) { enc.beginSide('foes'); enc.beginSide('party'); assert.ok(!hasCondition(party[1], 'amedrontado')); }
    for (const h of party) { if (hasCondition(h, 'amedrontado')) medo = true; if (h.imuneAAura?.includes(d.id)) imune = true; }
  }
  assert.ok(medo && imune);
});

await teste('Aura de Fogo do balor e Corpo Quente do azer: quem está perto, ou acerta de perto, queima', () => {
  const { enc, party } = montar({ foes: [['balor', { x: 6, y: 5 }]], lado: 'foes' });
  const b = traz(enc, 'balor');
  const antes = party[0].hp;
  enc.inicioDoTurnoDoBloco(b);
  assert.ok(party[0].hp < antes, 'a aura no começo do turno dele');
  let queimou = false;
  for (let seed = 1; seed <= 30 && !queimou; seed++) {
    const a = montar({ seed, foes: [['azer', { x: 6, y: 5 }]] });
    const h = a.party[0]; const v = h.hp;
    const r = a.enc.resolveAttack(h, traz(a.enc, 'azer'), {});
    if (r?.hit && h.hp < v) queimou = true;
  }
  assert.ok(queimou);
});

await teste('Explosão ao Morrer que fere (o mefite de gelo) e os dois sopros do dragão de latão com uma recarga só', () => {
  const { enc, party } = montar({ foes: [['mefiteDeGelo', { x: 6, y: 5 }]] });
  const m = traz(enc, 'mefiteDeGelo');
  const antes = party[0].hp;
  enc.applyDamage(m, 999, 'cortante', party[0]);
  assert.ok(m.dead);
  assert.ok(party[0].hp <= antes);
  const d = montar({ foes: [['dragaoDeLataoAnciao', { x: 9, y: 5 }]], lado: 'foes' });
  const dr = traz(d.enc, 'dragaoDeLataoAnciao');
  assert.equal(dr.sopros?.length, 2);
  const primeiro = dr.breath.name;
  assert.ok(d.enc.sopro(dr, d.party[0].pos));
  assert.notEqual(dr.breath.name, primeiro, 'o próximo sai do outro sopro');
  dr.actionUsed = false;
  assert.equal(d.enc.sopro(dr, d.party[0].pos), false, 'a recarga é uma só');
});

await teste('Evitar (o semilich) e a Evasão de monstro (o assassino): passar não fere, falhar dá metade', async () => {
  const { danoPorResistencia } = await import(P + 'rules/passivas.js');
  const s = makeMonster('semilich', { x: 0, y: 0 });
  assert.equal(danoPorResistencia(s, 'con', true, true, 20), 0);
  assert.equal(danoPorResistencia(s, 'con', true, false, 20), 10);
  const a = makeMonster('assassino', { x: 0, y: 0 });
  assert.ok(a.features?.includes('evasion') && a.features.includes('sneakAttack'));
  assert.equal(danoPorResistencia(a, 'dex', true, true, 20), 0);
});

await teste('Ações especiais: o olhar do yeti paralisa um; a rajada do devorador de mentes pega o cone; o deva cura; o arcanaloth some', () => {
  let paralisou = false;
  for (let seed = 1; seed <= 30 && !paralisou; seed++) {
    const { enc, party } = montar({ seed, foes: [['yeti', { x: 8, y: 5 }]], lado: 'foes' });
    const y = traz(enc, 'yeti');
    party[0].abilities = { ...party[0].abilities, con: 1 };
    party[0].saves = [];
    takeMonsterTurn(enc, y);
    if (hasCondition(party[0], 'paralisado')) paralisou = true;
  }
  assert.ok(paralisou, 'o Olhar Congelante');
  const d = montar({ foes: [['devoradorDeMentes', { x: 9, y: 5 }]], pos: [{ x: 6, y: 5 }, { x: 6, y: 6 }, { x: 1, y: 12 }, { x: 0, y: 12 }], lado: 'foes' });
  const df = traz(d.enc, 'devoradorDeMentes');
  const a = df.acoesEspeciais.find((x) => x.tipo === 'area');
  assert.ok(d.enc.usarAcaoEspecial(df, a, d.party[0]));
  assert.ok(df.recarregando[a.nome], 'a Rajada Mental recarrega');
  const v = montar({ foes: [['deva', { x: 9, y: 9 }], ['goblin', { x: 10, y: 9 }]], lado: 'foes' });
  const dv = traz(v.enc, 'deva'); const g = traz(v.enc, 'goblin');
  g.hp = 1;
  takeMonsterTurn(v.enc, dv);
  assert.ok(g.hp > 1, 'o Toque Curativo');
  assert.equal(dv.usosEspeciais[dv.acoesEspeciais.find((x) => x.tipo === 'cura').nome], 2, 'três por dia, gastou um');
  const t = montar({ foes: [['arcanaloth', { x: 6, y: 5 }]], lado: 'foes' });
  const ar = traz(t.enc, 'arcanaloth');
  ar.hp = 10;
  ar.spellcasting = null;
  const de = { ...ar.pos };
  takeMonsterTurn(t.enc, ar);
  assert.ok(distanceFt(de, ar.pos) > 5, 'ferido e cercado, se teleporta');
});

await teste('Luz própria (o azer), mergulho (o aarakocra), fúria ferida (o quaggoth), deslocamento, absorção de fogo', async () => {
  const { fontesDeLuz } = await import(P + 'rules/luz.js');
  const { enc, party } = montar({ foes: [['azer', { x: 8, y: 5 }], ['quaggoth', { x: 6, y: 5 }], ['bestaDeslocadora', { x: 6, y: 6 }], ['golemDeFerro', { x: 10, y: 10 }]] });
  assert.ok(fontesDeLuz(enc).some((f) => f.pos === traz(enc, 'azer').pos), 'o azer acende');
  const q = traz(enc, 'quaggoth');
  q.hp = q.furiaFerida.limiar;
  assert.match(JSON.stringify(enc.attackModifiers(q, party[0], {})), /fúria ferida/);
  const b = traz(enc, 'bestaDeslocadora');
  assert.match(JSON.stringify(enc.attackModifiers(party[0], b, {})), /deslocamento/);
  const gf = traz(enc, 'golemDeFerro');
  gf.hp = 50;
  enc.applyDamage(gf, 10, 'fogo', null, { magico: true });
  assert.equal(gf.hp, 60);
  const ak = makeMonster('aarakocra', { x: 0, y: 0 });
  assert.ok(ak.attacks.some((x) => x.investida?.soVoando));
});

// ------------------------------------------------------------------------- a cauda longa do Monster Manual ----
// O que o conversor passou a emitir e o motor passou a fazer (`livro-motor.js`). CD 99 força a falha; CA 0 força o acerto.
const Livro = await import(P + 'rules/livro-motor.js');
const falha = (a) => ({ ...a, dc: 99 });

await teste('Engolir: o sapo agarra na mordida, engole o agarrado, digere no turno dele e solta ao morrer', () => {
  const { enc, party } = montar({ foes: [['sapoGigante', { x: 6, y: 5 }]], lado: 'foes' });
  const sapo = traz(enc, 'sapoGigante');
  const alvo = party[0];
  alvo.ac = 0;
  const mordida = sapo.attacks.find((a) => /mordida/i.test(a.name));
  assert.equal(mordida.onHit?.condition, 'contido', 'a mordida agarra (o dado diz "{@condition grappled} (escape")');
  enc.resolveAttack(sapo, alvo, { weaponId: mordida.name });
  assert.ok(Livro.presoPor(alvo, sapo), 'agarrado pelo sapo');
  novoTurno(sapo);
  assert.ok(enc.usarAcaoEspecial(sapo, sapo.acoesEspeciais.find((a) => a.tipo === 'engolir'), alvo));
  assert.ok(hasCondition(alvo, 'engolido'), 'engolido');
  assert.ok(!Livro.presoPor(alvo, sapo), 'o agarrão acabou');
  assert.ok(!enc.canAttack(party[1], alvo).ok || distanceFt(party[1].pos, alvo.pos) > 5, 'ninguém de fora o mira');
  assert.ok(enc.canAttack(alvo, sapo).ok, 'de dentro, ele golpeia o sapo');
  const antes = alvo.hp;
  Livro.acidoDosEngolidos(enc, sapo);
  assert.ok(alvo.hp < antes, 'o ácido no começo do turno do sapo');
  enc.applyDamage(sapo, 999, 'cortante', party[1]);
  assert.ok(!hasCondition(alvo, 'engolido') && hasCondition(alvo, 'caido'), 'o sapo morto o solta, caído');
});

await teste('Engolfar e o vômito: o cubo engolfa quem falha e solta quem vence a Força; o verme vomita depois de 30 de dano de dentro', () => {
  const { enc, party } = montar({ foes: [['cuboGelatinoso', { x: 6, y: 5 }]], lado: 'foes' });
  const cubo = traz(enc, 'cuboGelatinoso');
  const a = falha(cubo.acoesEspeciais.find((x) => x.tipo === 'engolfar'));
  assert.ok(Livro.engolfar(enc, cubo, a));
  const dentro = party[0];
  assert.ok(hasCondition(dentro, 'engolido'));
  assert.equal(getCondition(dentro, 'engolido').data.escape, 99, 'a fuga é a CD do Engolfar');
  getCondition(dentro, 'engolido').data.escape = 12;
  dentro.abilities.str = 30;
  for (let i = 0; i < 6 && hasCondition(dentro, 'engolido'); i++) { dentro.actionUsed = false; enc.escapar(dentro); }
  assert.ok(!hasCondition(dentro, 'engolido') && distanceFt(dentro.pos, cubo.pos) <= 10, 'saiu, perto do cubo');
  const t = montar({ foes: [['vermePurpura', { x: 7, y: 5 }]], lado: 'foes' });
  const verme = traz(t.enc, 'vermePurpura');
  const eng = verme.attacks.find((x) => x.engole).engole;
  Livro.mordidaQueEngole(t.enc, verme, t.party[0], { ...eng, save: null });
  assert.ok(hasCondition(t.party[0], 'engolido'));
  verme.danoDeDentro = 0;
  const reg = getCondition(t.party[0], 'engolido').data.regurgita;
  assert.deepEqual(reg, { dano: 30, dc: 21 });
  getCondition(t.party[0], 'engolido').data.regurgita = { dano: 30, dc: 99 };
  t.enc.applyDamage(verme, 31, 'cortante', t.party[0], { deArma: true });
  Livro.conferirVomito(t.enc);
  assert.ok(!hasCondition(t.party[0], 'engolido') && hasCondition(t.party[0], 'caido'), 'vomitado, caído');
});

await teste('Fora de si: a tagarelice desnorteia (d8) e a euforia (d6); os dois tiram o turno de quem falha', () => {
  const { enc, party } = montar({ foes: [['bocaTagarela', { x: 6, y: 5 }]], lado: 'foes' });
  const boca = traz(enc, 'bocaTagarela');
  assert.equal(boca.aura.condition, 'desnorteado');
  boca.aura.dc = 99;
  enc.beginSide('party');
  assert.ok(hasCondition(party[0], 'desnorteado'), 'a 6 m da boca');
  assert.ok(party[0].actionUsed && party[0].movementLeftFt === 0, 'o d8 tirou a ação');
  assert.ok(party[0].reactionUsed, 'sem reação');
  assert.ok(enc.field.dificeis.has(`${boca.pos.x + 1},${boca.pos.y}`), 'o Chão Aberrante é terreno difícil');
  const t = montar({ foes: [['dragaoFeericoAzul', { x: 6, y: 5 }]], lado: 'foes' });
  const d = traz(t.enc, 'dragaoFeericoAzul');
  assert.ok(t.enc.usarAcaoEspecial(d, falha(d.acoesEspeciais.find((x) => x.condition === 'euforico')), t.party[0]));
  assert.ok(hasCondition(t.party[0], 'euforico'));
  t.enc.beginSide('party');
  assert.ok(t.party[0].actionUsed, 'o d6 tirou a ação');
});

await teste('Couro Farpado, Espetar, Congelar e Cai de Costas', () => {
  const { enc, party } = montar({ foes: [['diaboFarpado', { x: 6, y: 5 }], ['reiHomemLagarto', { x: 4, y: 5 }], ['elementalDaAgua', { x: 9, y: 9 }], ['flumph', { x: 12, y: 12 }]], lado: 'foes' });
  const diabo = traz(enc, 'diaboFarpado');
  addCondition(diabo, 'agarrado', { source: party[0].id, data: { escape: 12 } });
  const antes = party[0].hp;
  Livro.couroFarpado(enc, diabo);
  assert.ok(party[0].hp < antes, 'quem agarra o diabo farpado se fura');
  const rei = traz(enc, 'reiHomemLagarto');
  party[0].ac = 0;
  for (let i = 0; i < 5 && !rei.tempHp; i++) { rei.espetouNoTurno = null; enc.resolveAttack(rei, party[0], { weaponId: rei.attacks.find((a) => /tridente/i.test(a.name)).name }); }
  assert.ok(rei.tempHp > 0, 'o Espetar vira PV temporários');
  const el = traz(enc, 'elementalDaAgua');
  const v = enc.speedOf(el);
  enc.applyDamage(el, 5, 'frio', party[0], { magico: true });
  assert.equal(enc.speedOf(el), v - 20, 'o frio tira 6 m');
  const fl = traz(enc, 'flumph');
  let deCostas = false;
  for (let s = 1; s <= 12 && !deCostas; s++) {
    const tt = montar({ seed: s, foes: [['flumph', { x: 12, y: 12 }]] });
    const f = traz(tt.enc, 'flumph');
    tt.enc.aplicarCondicao(f, 'caido', {});
    deCostas = hasCondition(f, 'deCostas');
  }
  assert.ok(deCostas, 'num ímpar, cai de costas');
  void fl;
});

await teste('Corrosão: a ferrugem tira dano da arma e CA da armadura; o pudim come madeira também', async () => {
  const { armorClass } = await import(P + 'rules/equipment.js');
  const { enc, party } = montar({ foes: [['monstroDaFerrugem', { x: 6, y: 5 }]], lado: 'foes' });
  const mf = traz(enc, 'monstroDaFerrugem');
  const heroi = party.find((c) => c.equippedWeapon && !['clava', 'bordao', 'punhos'].includes(c.equippedWeapon) && !c.attacks);
  const antes = enc.weaponAttackProfile(heroi).damage;
  Livro.corroerArma(enc, heroi, mf, enc.weaponAttackProfile(heroi));
  assert.notEqual(enc.weaponAttackProfile(heroi).damage, antes, 'a arma perde 1 de dano');
  const comMetal = party.find((c) => c.armor && !['nenhuma', 'couro', 'couroBatido', 'acolchoada', 'peleDeAnimal'].includes(c.armor));
  comMetal.pos = { ...comMetal.pos, x: 7, y: 5 };
  const ca = armorClass(comMetal);
  assert.ok(Livro.antenas(enc, mf, { dc: 99 }, comMetal, (await import(P + 'rules/items/index.js')).ARMORS, armorClass, (await import(P + 'rules/equipment.js')).WEAPONS));
  assert.ok(armorClass(comMetal) < ca, 'a armadura de metal perde CA');
  assert.ok(makeMonster('pudimNegro', { x: 0, y: 0 }).features?.includes('corroeMadeira'));
});

await teste('Escudo Pegajoso, Consumir Vida, Salto Etéreo e Reativo', () => {
  const { enc, party } = montar({ foes: [['kuoToa', { x: 6, y: 5 }], ['fogoFatuo', { x: 1, y: 2 }], ['aranhaDefasadora', { x: 4, y: 5 }], ['marilith', { x: 12, y: 12 }]] });
  const kt = traz(enc, 'kuoToa');
  kt.ac = 99;
  const h = party[0];
  const arma = h.equippedWeapon;
  for (let i = 0; i < 5 && !Livro.armaPresa(h); i++) { kt.reactionUsed = false; enc.resolveAttack(h, kt, {}); }
  if (!Livro.armaPresa(h)) { kt.reactionUsed = false; Livro.escudoPegajoso(enc, h, kt, { weapon: { name: 'x' }, ranged: false }); }
  assert.equal(Livro.armaPresa(h), arma);
  assert.ok(!enc.canAttack(h, kt, arma).ok, 'a arma presa não golpeia');
  const ff = traz(enc, 'fogoFatuo');
  const caido = party[1];
  caido.hp = 0;
  addCondition(caido, 'inconsciente', { source: 'teste' });
  ff.bonusUsed = false;
  let morreu = false;
  for (let i = 0; i < 8 && !morreu; i++) { ff.bonusUsed = false; Livro.consumirVida(enc, ff); morreu = caido.dead; }
  assert.ok(morreu, 'o fogo-fátuo consome quem está a 0 PV');
  const ar = traz(enc, 'aranhaDefasadora');
  ar.atacouNoTurno = true;
  ar.bonusUsed = false;
  assert.ok(Livro.saltoEtereo(enc, ar) && hasCondition(ar, 'etereo'));
  enc.beginSide('foes');
  assert.ok(!hasCondition(ar, 'etereo') && ar.bonusUsed, 'volta no turno dela, gastando a ação bônus');
  const mar = traz(enc, 'marilith');
  mar.reactionUsed = true;
  enc.endTurn(party[3]);
  assert.equal(mar.reactionUsed, false, 'a marilith tem reação a cada turno');
});

await teste('Raios oculares e o cone antimágico do observador; o cone negativo do tirano não deixa curar', () => {
  const { enc, party } = montar({ foes: [['observador', { x: 10, y: 5 }]], lado: 'foes' });
  const ob = traz(enc, 'observador');
  assert.ok(!ob.breath, 'os raios não são mais um sopro em cubo');
  assert.equal(ob.raiosOculares.raios.length, 10);
  Livro.apontarCone(enc, ob);
  const noCone = party.find((c) => ob.coneAntimagia?.casas.has(`${c.pos.x},${c.pos.y}`) && c.spellcasting);
  if (noCone) assert.match(enc.canCast(noCone, noCone.spellcasting.cantrips?.[0] ?? 'raioDeFogo', { target: ob, point: ob.pos }).why ?? '', /antimágico/);
  ob.coneAntimagia = null;
  for (const r of ob.raiosOculares.raios) r.dc = 99;
  assert.ok(Livro.raiosOculares(enc, ob));
  assert.ok(party.some((c) => c.conditions?.length || c.hp < c.maxHp), 'os raios pegaram alguém');
  const t = montar({ foes: [['tiranoDaMorte', { x: 10, y: 5 }]], lado: 'foes' });
  const tir = traz(t.enc, 'tiranoDaMorte');
  Livro.apontarCone(t.enc, tir);
  const pego = t.party.find((c) => tir.coneNegativo?.casas.has(`${c.pos.x},${c.pos.y}`));
  assert.ok(pego, 'o cone aponta para o grupo');
  pego.hp = 1;
  assert.equal(t.enc.heal(pego, 10), 0, 'no cone negativo, ninguém cura');
});

await teste('Ações lendárias novas: o vampiro anda, o unicórnio se cura, o lich olha, o semilich drena o PV máximo', () => {
  const { enc, party } = montar({ foes: [['vampiro', { x: 12, y: 12 }], ['unicornio', { x: 12, y: 1 }], ['lich', { x: 6, y: 6 }], ['semilich', { x: 4, y: 4 }]], lado: 'party' });
  const vp = traz(enc, 'vampiro');
  const de = { ...vp.pos };
  const ctx = { casaLonge: () => null, magia: () => false, tinta: () => false };
  assert.equal(Livro.escolherLendaria(enc, vp, vp.lendarias.opcoes, ctx)?.tipo, 'mover');
  assert.ok(distanceFt(de, vp.pos) > 0, 'o vampiro andou');
  const un = traz(enc, 'unicornio');
  un.hp = 10;
  assert.equal(Livro.escolherLendaria(enc, un, un.lendarias.opcoes, ctx)?.tipo, 'curaPropria');
  assert.ok(un.hp > 10);
  const li = traz(enc, 'lich');
  const olhar = li.lendarias.opcoes.find((o) => o.condition === 'amedrontado');
  assert.equal(olhar.tipo, 'alvo', 'o Olhar Aterrorizante é de um alvo');
  party[0].pos = { ...party[0].pos, x: 7, y: 6 };
  Livro.escolherLendaria(enc, li, [falha(olhar)], ctx);
  assert.ok(hasCondition(party[0], 'amedrontado'));
  const se = traz(enc, 'semilich');
  const dreno = se.lendarias.opcoes.find((o) => o.reduzMaximoDados);
  const max = party[0].maxHp;
  enc.lendariaDeArea(se, falha(dreno), [party[0]]);
  assert.ok(party[0].maxHp < max, 'o Drenar Energia tira PV máximo');
});

await teste('Imunidade à magia: o rakshasa não sente a Bola de Fogo; a tarrasca não sente o Míssil Mágico', () => {
  const { enc, foes } = montar({ foes: [['rakshasa', { x: 10, y: 5 }], ['tarrasque', { x: 2, y: 9 }]] });
  const [rk, ta] = foes;
  enc.magiaEmCurso = SPELLS.bolaDeFogo;
  assert.ok(enc.imuneAMagiaEmCurso(rk));
  enc.magiaEmCurso = SPELLS.misselMagico;
  assert.ok(enc.imuneAMagiaEmCurso(ta));
  enc.magiaEmCurso = null;
  assert.deepEqual(vantagemPorTraco(rk, 'wis', { magico: true }), ['Imunidade à Magia Limitada']);
});

await teste('Ações especiais novas: aumentar, grito de guerra, invocar com demora, puxar, salto mortal, maldição, toque inebriante', () => {
  const { enc, party } = montar({ foes: [['duergar', { x: 6, y: 5 }], ['chefeDeGuerraOrc', { x: 8, y: 8 }], ['orc', { x: 9, y: 8 }], ['orc', { x: 8, y: 9 }]], lado: 'foes' });
  const du = traz(enc, 'duergar');
  const dado = du.attacks.find((a) => !a.ranged);
  const antes = enc.weaponAttackProfile(du, dado.name).damage;
  enc.usarAcaoEspecial(du, du.acoesEspeciais.find((a) => a.tipo === 'aumentar'), null);
  assert.notEqual(enc.weaponAttackProfile(du, dado.name).damage, antes, 'o dobro dos dados');
  assert.equal(du.size, 'grande');
  const ch = traz(enc, 'chefeDeGuerraOrc');
  enc.usarAcaoEspecial(ch, ch.acoesEspeciais.find((a) => a.tipo === 'gritoDeGuerra'), null);
  const orc = enc.combatants.find((c) => c.defId === 'orc');
  assert.ok(hasCondition(orc, 'gritoDeGuerra'));
  assert.match(JSON.stringify(enc.attackModifiers(orc, party[0], {})), /grito de guerra/);
  const t = montar({ foes: [['vampiro', { x: 10, y: 5 }]], lado: 'foes' });
  const vp = traz(t.enc, 'vampiro');
  t.enc.usarAcaoEspecial(vp, vp.acoesEspeciais.find((a) => a.tipo === 'invocar'), null);
  assert.equal(t.enc.invocacoesPendentes.length, 1, 'os Filhos da Noite demoram');
  t.enc.round += 5;
  t.enc.beginSide('foes');
  assert.ok(t.enc.combatants.filter((c) => c.invocado?.donoId === vp.id).length >= 2, 'e chegam');
  const u = montar({ foes: [['bulette', { x: 9, y: 5 }]], lado: 'foes' });
  const bu = traz(u.enc, 'bulette');
  bu.pos = { ...bu.pos, x: 11, y: 5 };
  u.party[0].pos = { ...u.party[0].pos, x: 6, y: 5 };
  const salto = falha(bu.acoesEspeciais.find((a) => a.soDepoisDeSaltar));
  const hp = u.party[0].hp;
  assert.ok(u.enc.usarAcaoEspecial(bu, salto, u.party[0]));
  assert.ok(u.party[0].hp < hp && hasCondition(u.party[0], 'caido'), 'o salto mortal esmaga e derruba');
  const f = montar({ foes: [['fomoriano', { x: 9, y: 5 }], ['lamia', { x: 6, y: 6 }]], lado: 'foes' });
  const fo = traz(f.enc, 'fomoriano');
  const vel = f.enc.speedOf(f.party[0]);
  f.enc.usarAcaoEspecial(fo, falha(fo.acoesEspeciais.find((a) => a.condition === 'deformado')), f.party[0]);
  assert.equal(f.enc.speedOf(f.party[0]), Math.floor(vel / 10) * 5, 'deformado: metade do deslocamento');
  const la = traz(f.enc, 'lamia');
  f.party[1].ac = 0;
  f.party[1].pos = { ...f.party[1].pos, x: 7, y: 6 };
  f.enc.resolveAttack(la, f.party[1], { weaponId: la.attacks.find((a) => a.onHit?.condition === 'amaldicoadoLamia').name });
  assert.ok(hasCondition(f.party[1], 'amaldicoadoLamia'), 'o Toque Inebriante amaldiçoa');
});


// ------------------------------------------------- o multiataque de golpes diferentes (o importador do MM) ----
await teste('o multiataque do grick alfa: cauda, tentáculos e o bico SÓ quando os tentáculos acertam', async () => {
  let comBico = 0;
  let semTentaculo = 0;
  for (let seed = 1; seed <= 120; seed++) {
    const { enc, party, foes } = montar({ seed, foes: [['grickAlfa', { x: 6, y: 5 }]], lado: 'foes' });
    const golpes = [];
    const resolve = enc.resolveAttack.bind(enc);
    enc.resolveAttack = (a, t, o) => { const r = resolve(a, t, o); golpes.push([o.weaponId, !!r?.hit]); return r; };
    enc.attackAction(foes[0], party[0], 'Cauda');
    const nomes = golpes.map((g) => g[0]);
    assert.deepEqual(nomes.slice(0, 2), ['Cauda', 'Tentáculos'], `semente ${seed}: ${nomes}`);
    const tentaculos = golpes.find((g) => g[0] === 'Tentáculos');
    if (nomes.includes('Bico')) { comBico += 1; assert.ok(tentaculos[1], 'o bico mordeu sem os tentáculos acertarem'); }
    if (!tentaculos[1]) { semTentaculo += 1; assert.ok(!nomes.includes('Bico')); }
  }
  assert.ok(comBico > 0 && semTentaculo > 0, `amostra fraca: ${comBico} com bico, ${semTentaculo} sem tentáculo`);
});

await teste('as sequências alternativas: a mantícora morde e arranha de perto, ou atira três espinhos', async () => {
  const { enc, foes } = montar({ foes: [['manticora', { x: 6, y: 5 }]] });
  assert.deepEqual(enc.golpesDoAtaque(foes[0], 'Mordida'), ['Mordida', 'Garra', 'Garra']);
  assert.deepEqual(enc.golpesDoAtaque(foes[0], 'Espinho da Cauda'), ['Espinho da Cauda', 'Espinho da Cauda', 'Espinho da Cauda']);
  const xorn = montar({ foes: [['xorn', { x: 6, y: 5 }]] });
  assert.deepEqual(xorn.enc.golpesDoAtaque(xorn.foes[0], 'Mordida'), ['Garra', 'Garra', 'Garra', 'Mordida']);
});

// ------------------------------------------------------------------- as lendárias dos outros bestiários ----
const { magiaLendaria } = await import(P + 'rules/ai.js');
const { MONSTERS } = await import(P + 'rules/monsters.js');
const lendaria = (enc, m, nome) => Livro.escolherLendaria(enc, m, m.lendarias.opcoes.filter((o) => o.nome === nome), {
  magia: (q, soTruque, maxCirculo, magias) => magiaLendaria(enc, q, soTruque, maxCirculo, magias), casaLonge: () => null, tinta: () => false });

await teste('Lendárias dos outros bestiários: o custo escrito de três jeitos, o golpe que só existe como lendária, a magia pelo nome', () => {
  assert.equal(MONSTERS.bael.lendarias.opcoes.find((o) => o.tipo === 'golpe').custo, 2, '"Cost 2 Actions" virou 1');
  const cauda = MONSTERS.demogorgon.lendarias.opcoes.find((o) => o.ataque);
  assert.ok(cauda && cauda.ataque.reachFt === 15, 'a cauda do Demogorgon não veio dentro da opção');
  assert.ok(!MONSTERS.demogorgon.lendarias.opcoes.some((o) => /\(Custa/i.test(o.nome)), 'o custo ficou no nome');
  assert.deepEqual(MONSTERS.juiblex.lendarias.opcoes.find((o) => o.tipo === 'magia').magias, ['respingoAcido']);
  assert.deepEqual(MONSTERS.matriarcaDrow.lendarias.opcoes.filter((o) => o.tipo === 'magia').map((o) => [o.custo, o.maxCirculo]), [[1, 1], [2, 2], [3, 3]]);
  // a cauda: o golpe entra no bloco só durante a ação lendária
  const d = montar({ foes: [['demogorgon', { x: 7, y: 5 }]], pos: [{ x: 6, y: 5 }, { x: 1, y: 1 }, { x: 1, y: 3 }, { x: 1, y: 12 }], nivel: 18 });
  const dem = d.foes[0];
  const golpes = dem.attacks.length;
  assert.ok(lendaria(d.enc, dem, cauda.nome), 'a cauda não golpeou');
  assert.match(d.texto(), new RegExp(cauda.nome));
  assert.equal(dem.attacks.length, golpes, 'a cauda ficou no bloco');
  // o respingo ácido do Juiblex
  const j = montar({ foes: [['juiblex', { x: 8, y: 5 }]], nivel: 18 });
  const jb = j.foes[0];
  const antes = JSON.stringify(jb.spellcasting);
  assert.ok(lendaria(j.enc, jb, 'Respingo Ácido'), 'o Juiblex não conjurou');
  assert.match(j.texto(), /Respingo Ácido/);
  assert.equal(JSON.stringify(jb.spellcasting), antes, 'a lista de magias não voltou');
});

await teste('Lendárias dos outros bestiários: a linha pega quem está nela, e as lanças acertam sem teste', () => {
  // dois heróis na mesma fileira do grande wyrm
  const l = montar({ foes: [['grandeWyrmDeAmetista', { x: 1, y: 5 }]], pos: [{ x: 7, y: 6 }, { x: 9, y: 6 }, { x: 13, y: 0 }, { x: 13, y: 13 }], nivel: 20 });
  const wyrm = l.foes[0];
  const [a, b] = l.party;
  const [va, vb] = [a.hp, b.hp];
  assert.ok(lendaria(l.enc, wyrm, 'Raio Psíquico'), 'a linha não saiu');
  assert.ok(a.hp < va && b.hp < vb, 'a linha não pegou os dois da fileira');
  const n = montar({ foes: [['grandeSerpeNegra', { x: 1, y: 5 }]], nivel: 20 });
  const serpe = n.foes[0];
  const vida = n.party.reduce((s, c) => s + c.hp, 0);
  assert.ok(lendaria(n.enc, serpe, 'Lança Arcana'), 'as lanças não saíram');
  assert.equal((n.texto().match(/Uma lança acerta/g) ?? []).length, 4, 'não foram quatro lanças');
  assert.ok(n.party.reduce((s, c) => s + c.hp, 0) < vida);
});

await teste('Os outros bestiários: o grande wyrm DESPERTA uma vez em vez de cair, com o sopro e as resistências de volta', () => {
  const s = montar({ foes: [['grandeSerpeNegra', { x: 8, y: 5 }]], nivel: 20 });
  const w = s.foes[0];
  assert.equal(w.despertar?.pv, 425);
  w.recarregando = { Sopro: true };
  if (w.resources) w.resources.resistenciaLendaria = 0;
  s.enc.applyDamage(w, w.hp + 10, 'cortante', s.party[0]);
  assert.ok(!w.dead && w.hp === 425, `não despertou: ${w.hp}`);
  assert.deepEqual(w.recarregando, {}, 'o sopro não recarregou');
  assert.match(s.texto(), /Despertar/);
  s.enc.applyDamage(w, w.hp + 10, 'cortante', s.party[0]);
  assert.ok(w.dead || w.hp <= 0, 'despertou duas vezes');
});

await teste('Os outros bestiários: a aura lida pela frase (o olhar atordoante do gauth), e as reações de revide e de CA a mais', () => {
  // o gauth: quem começa o turno a 9 m e o vê, Sabedoria 14 ou atordoado
  const g = montar({ lado: 'foes', foes: [['gauth', { x: 7, y: 5 }]], pos: [{ x: 6, y: 5 }, { x: 1, y: 1 }, { x: 1, y: 3 }, { x: 13, y: 13 }], nivel: 6 });
  assert.equal(g.foes[0].aura?.olhar, true);
  g.enc.beginSide('party');
  assert.match(g.texto(), /aura de Gauth|aguenta a aura/i, 'o olhar não pediu teste');
  // o tanarukk revida quem o fere, com vantagem
  const t = montar({ foes: [['tanarukk', { x: 6, y: 5 }]], pos: [{ x: 5, y: 5 }, { x: 1, y: 1 }, { x: 1, y: 3 }, { x: 13, y: 13 }] });
  const tk = t.foes[0];
  t.enc.applyDamage(tk, 3, 'cortante', t.party[0]);
  t.enc.reacaoAoDano(tk, t.party[0]);
  assert.ok(tk.reactionUsed, 'o tanarukk não revidou');
  assert.match(t.texto(), /revida/);
  // o draconiano mentor: +5 de CA contra um ataque que ia acertar
  const d = montar({ foes: [['draconianoMentor', { x: 6, y: 5 }]], pos: [{ x: 5, y: 5 }, { x: 1, y: 1 }, { x: 1, y: 3 }, { x: 13, y: 13 }] });
  assert.equal(d.foes[0].apararBonus, 5);
  assert.equal(d.foes[0].apararTudo, true);
  // o berço da nuvem: o trovão pega todos a 9 m quando ele é ferido
  const b = montar({ foes: [['bercoDoRebentoDasNuvens', { x: 6, y: 5 }]], pos: [{ x: 5, y: 5 }, { x: 6, y: 7 }, { x: 1, y: 3 }, { x: 13, y: 13 }], nivel: 15 });
  const berco = b.foes[0];
  const [v0, v1] = [b.party[0].hp, b.party[1].hp];
  b.enc.repreensaoObsessiva(berco, b.party[0]);
  assert.ok(b.party[0].hp <= v0 && b.party[1].hp <= v1 && /Trovoada/.test(b.texto()), 'o trovão não pegou a área');
});

await teste('Os outros bestiários: as ações escritas de outros jeitos (a linha, "cada inimigo", "um ou dois", o tipo escolhido)', () => {
  const lanca = MONSTERS.armanita.sopros?.[0] ?? MONSTERS.armanita.breath;
  assert.equal(lanca.shape, 'linha');
  assert.deepEqual([lanca.areaFt, lanca.larguraFt], [60, 10], 'a linha de 18 m por 3 m da armanita');
  const aspecto = MONSTERS.cavaleiroNegro.acoesEspeciais.find((a) => a.condition === 'amedrontado');
  assert.ok(aspecto && aspecto.shape === 'raio' && aspecto.areaFt === 30, '"cada inimigo a até 9 m" não virou área');
  const mente = MONSTERS.amnizu.acoesEspeciais.find((a) => a.damageType === 'necrótico');
  assert.equal(mente.alvos, 2, '"um ou dois" não virou dois alvos');
  const grito = MONSTERS.rebentoDasProfundezas.acoesEspeciais.find((a) => a.condition === 'atordoado');
  assert.equal(grito.rounds, 1, '"até o fim do próximo turno do rebento das profundezas" durou mais de uma rodada');
  const mordida = MONSTERS.dracohidra.attacks.find((a) => a.reachFt === 10);
  assert.ok(mordida && mordida.damage === '1d10+5', 'a mordida de tipo escolhido da draco-hidra não virou golpe');
});

console.log(`\n${total - falhas}/${total} testes passaram.`);
if (falhas) process.exit(1);
