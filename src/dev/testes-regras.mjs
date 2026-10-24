// Testes de regra do motor (SRD 5.1). Rode com:
//   node src/dev/testes-regras.mjs
//
// Cada teste monta uma situação pequena num campo vazio e confere UM ponto de
// regra. Nasceram dos achados da revisão de regras (revisoes/), um teste por
// defeito corrigido: se algum voltar a falhar, a regra regrediu.

import assert from 'node:assert/strict';
import { Encounter } from '../rules/combat.js';
import { makeParty } from '../rules/party.js';
import { makeMonster, MONSTERS } from '../rules/monsters.js';
import { skillBonus } from '../rules/abilities.js';
import { criarPersonagem } from '../rules/progressao.js';
import { CLASSES } from '../rules/classes/index.js';
import { marcarTreinoDeArmadura } from '../rules/equipment.js';
import { Battlefield, distanceFt } from '../core/grid.js';
import { takeMonsterTurn, contornaZonas } from '../rules/ai.js';
import { makeRng } from '../core/rng.js';
import { addCondition, hasCondition, getCondition, caEfetiva } from '../rules/conditions.js';
import { SPELLS, getSpell, magiasProntas, dadosDaMagia } from '../rules/spells.js';

const MAPA = Array(12).fill('............');
const [DARA, PIP, BRENN, ILVAN] = [0, 1, 2, 3];

/** Grupo e inimigos num campo 12x12 vazio, já no turno do grupo. */
function montar({ seed = 1, foes = [['goblin', { x: 6, y: 5 }]], pos = null, lado = 'party', nivel = 2 } = {}) {
  const field = new Battlefield(12, 12, MAPA);
  const party = makeParty({ nivel });
  const pp = pos ?? [{ x: 5, y: 5 }, { x: 1, y: 1 }, { x: 1, y: 3 }, { x: 1, y: 9 }];
  party.forEach((c, i) => { c.pos = { ...pp[i] }; });
  const fs = foes.map(([id, p]) => makeMonster(id, p));
  const log = [];
  const enc = new Encounter({ battlefield: field, party, foes: fs, rng: makeRng(seed), onLog: (e) => log.push(e) });
  enc.firstSide = lado;
  enc.round = 1;
  enc.beginSide(lado);
  return { enc, party, foes: fs, log };
}

let falhas = 0;
let total = 0;
function teste(nome, fn) {
  total += 1;
  try {
    fn();
    console.log(`ok    ${nome}`);
  } catch (e) {
    falhas += 1;
    console.log(`FALHA ${nome}\n      ${e.message.split('\n').join('\n      ')}`);
  }
}

// ---- turno e reações -------------------------------------------------------

teste('ataque de oportunidade rola de verdade ao sair do alcance', () => {
  const { enc, party, foes, log } = montar();
  const n = log.length;
  enc.moveAlong(party[DARA], [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }]);
  const textos = log.slice(n).map((e) => e.text);
  assert.ok(textos.some((t) => /aproveita a brecha/.test(t)));
  assert.ok(!textos.some((t) => /fora de alcance/.test(t)), textos.join(' | '));
  assert.equal(foes[0].reactionUsed, true);
});

teste('quem perde a iniciativa ainda tem reação no turno do outro lado', () => {
  const { foes } = montar();
  assert.equal(foes[0].reactionUsed, false);
});

teste('Desengajar vale só no turno em que foi usado', () => {
  const { enc, party } = montar();
  enc.disengage(party[DARA]);
  assert.equal(party[DARA].disengaging, true);
  enc.beginSide('foes');
  enc.beginSide('party');
  assert.equal(party[DARA].disengaging, false);
});

teste('Surto de Ação depois da ação normal dá UMA ação a mais', () => {
  const { enc, party, foes } = montar();
  const dara = party[DARA];
  foes[0].maxHp = foes[0].hp = 500;
  let ataques = 0;
  while (enc.attackAction(dara, foes[0]).ok) {
    ataques += 1;
    if (ataques === 1) assert.ok(enc.useFeature(dara, 'actionSurge'));
    if (ataques > 5) break;
  }
  assert.equal(ataques, 2);
});

teste('Ação Ardilosa faz Disparada OU Desengajar, não as duas', () => {
  const { enc, party } = montar();
  const pip = party[PIP];
  const antes = pip.movementLeftFt;
  assert.ok(enc.useFeature(pip, 'cunningAction', { modo: 'disparada' }));
  assert.equal(pip.movementLeftFt, antes * 2);
  assert.ok(!pip.disengaging);
  assert.ok(!enc.useFeature(pip, 'cunningAction', { modo: 'desengajar' }), 'segunda ação bônus no mesmo turno');
});

// ---- morte -----------------------------------------------------------------

teste('dano a 0 PV soma falha no teste de morte (duas no crítico)', () => {
  const { enc, party, foes } = montar();
  const ilvan = party[ILVAN];
  enc.applyDamage(ilvan, ilvan.hp, 'cortante', foes[0]);
  ilvan.deathSaves = { successes: 2, failures: 0 };
  enc.applyDamage(ilvan, 1, 'cortante', foes[0]);
  assert.deepEqual(ilvan.deathSaves, { successes: 2, failures: 1 });
  enc.applyDamage(ilvan, 1, 'cortante', foes[0], { critical: true });
  assert.equal(ilvan.dead, true);
});

teste('estável que sofre dano volta a morrer, com uma falha', () => {
  const { enc, party, foes } = montar();
  const ilvan = party[ILVAN];
  enc.applyDamage(ilvan, ilvan.hp, 'cortante', foes[0]);
  ilvan.stable = true;
  enc.applyDamage(ilvan, 1, 'cortante', foes[0]);
  assert.equal(ilvan.stable, false);
  assert.equal(ilvan.deathSaves.failures, 1);
  assert.equal(ilvan.dead, false);
});

teste('dano maciço mata na hora', () => {
  const { enc, party, foes } = montar();
  const ilvan = party[ILVAN];
  ilvan.hp = 1;
  enc.applyDamage(ilvan, 1 + ilvan.maxHp, 'cortante', foes[0]);
  assert.equal(ilvan.dead, true);
});

teste('concentração cai quando o conjurador cai', () => {
  const { enc, party, foes } = montar();
  const brenn = party[BRENN];
  brenn.pos = { x: 3, y: 3 };
  party[DARA].pos = { x: 3, y: 4 };
  assert.ok(enc.castSpell(brenn, 'bencao').ok);
  assert.ok(hasCondition(party[DARA], 'abencoado'));
  enc.applyDamage(brenn, brenn.hp, 'cortante', foes[0]);
  assert.equal(brenn.concentrating, null);
  assert.ok(!hasCondition(party[DARA], 'abencoado'));
});

teste('20 natural no teste de morte: 1 PV, acordado mas ainda caído', () => {
  const { enc, party, foes } = montar();
  const dara = party[DARA];
  enc.applyDamage(dara, dara.hp, 'cortante', foes[0]);
  enc.heal(dara, 1);
  assert.equal(dara.hp, 1);
  assert.ok(!hasCondition(dara, 'inconsciente'));
  assert.ok(hasCondition(dara, 'caido'));
});

// ---- condições -------------------------------------------------------------

teste('levantar-se custa metade do deslocamento e tira o caído', () => {
  const { enc, party } = montar();
  const dara = party[DARA];
  addCondition(dara, 'caido');
  const antes = dara.movementLeftFt;
  assert.ok(enc.standUp(dara).ok);
  assert.equal(dara.movementLeftFt, antes - Math.ceil(enc.speedOf(dara) / 2));
  assert.ok(!hasCondition(dara, 'caido'));
});

teste('caído rasteja: alcance cai pela metade', () => {
  const { enc, party } = montar();
  const dara = party[DARA];
  const longe = (m) => Math.max(...[...m.values()].map((n) => n.cost));
  const dePe = longe(enc.reachableFor(dara));
  addCondition(dara, 'caido');
  assert.ok(longe(enc.reachableFor(dara)) <= dePe / 2);
});

teste('ataque contra caído: vantagem a 5 pés mesmo de arco, desvantagem de longe', () => {
  const { enc, party, foes } = montar();
  const pip = party[PIP];
  pip.pos = { x: 5, y: 4 };
  addCondition(foes[0], 'caido');
  const perto = enc.attackModifiers(pip, foes[0], { ranged: true });
  assert.ok(perto.vantagens.includes('alvo caído e perto'));
  pip.pos = { x: 6, y: 1 };
  const longe = enc.attackModifiers(pip, foes[0], { ranged: false });
  assert.ok(longe.desvantagens.includes('alvo caído e longe'));
});

teste('Sono: o dano acorda; morto-vivo e elfo não dormem', () => {
  const { enc, party, foes } = montar({
    foes: [['goblin', { x: 8, y: 8 }], ['esqueleto', { x: 9, y: 8 }]],
  });
  const ilvan = party[ILVAN];
  ilvan.pos = { x: 5, y: 8 };
  assert.ok(enc.castSpell(ilvan, 'sono', { point: { x: 8, y: 8 } }).ok);
  const [gob, esq] = foes;
  assert.ok(hasCondition(gob, 'inconsciente'), 'goblin dorme');
  assert.ok(!hasCondition(esq, 'inconsciente'), 'esqueleto não dorme');
  gob.maxHp = gob.hp = 30;
  enc.applyDamage(gob, 1, 'cortante', party[DARA]);
  assert.ok(!hasCondition(gob, 'inconsciente'), 'acorda com o dano');
  assert.ok(hasCondition(gob, 'caido'), 'acorda caído');
});

teste('condição de uma rodada dura o turno inteiro do alvo', () => {
  const { enc, foes } = montar();
  addCondition(foes[0], 'envenenado', { rounds: 1 });
  enc.beginSide('foes');
  assert.ok(hasCondition(foes[0], 'envenenado'), 'ainda envenenado no turno dele');
  enc.fimDoTurnoDoLado('foes');
  assert.ok(!hasCondition(foes[0], 'envenenado'), 'acaba no fim do turno dele');
});

teste('paralisia do ghoul: dura, repete a resistência, não pega elfo', () => {
  const { enc, party, foes } = montar({ foes: [['ghoul', { x: 6, y: 5 }]], lado: 'foes', seed: 3 });
  const ghoul = foes[0];
  const garras = ghoul.attacks.find((a) => a.name === 'Garras');
  ghoul.pos = { x: 1, y: 8 };
  for (let i = 0; i < 20; i++) enc.resolveAttack(ghoul, party[ILVAN], { weaponId: garras.name });
  assert.ok(!hasCondition(party[ILVAN], 'paralisado'), 'elfo imune');
  ghoul.pos = { x: 4, y: 5 };
  let paralisou = false;
  for (let i = 0; i < 30 && !paralisou; i++) {
    party[DARA].hp = party[DARA].maxHp;
    enc.resolveAttack(ghoul, party[DARA], { weaponId: garras.name });
    paralisou = hasCondition(party[DARA], 'paralisado');
  }
  assert.ok(paralisou, 'a humana pode ser paralisada');
  const cond = getCondition(party[DARA], 'paralisado');
  assert.equal(cond.data.repete, true);
  let livre = false;
  for (let i = 0; i < 10 && !livre; i++) {
    enc.fimDoTurnoDoLado('party');
    livre = !hasCondition(party[DARA], 'paralisado');
  }
  assert.ok(livre, 'sai em até 10 turnos');
});

teste('teia: prende sem resistência e solta com Atletismo/Acrobacia', () => {
  const { enc, party, foes } = montar({ foes: [['aranhaGigante', { x: 8, y: 5 }]], seed: 2 });
  const teia = foes[0].attacks.find((a) => a.name === 'Teia');
  let preso = false;
  for (let i = 0; i < 20 && !preso; i++) {
    enc.resolveAttack(foes[0], party[DARA], { weaponId: teia.name });
    preso = hasCondition(party[DARA], 'contido');
  }
  assert.ok(preso);
  assert.equal(enc.speedOf(party[DARA]), 0);
  let solto = false;
  for (let i = 0; i < 20 && !solto; i++) {
    party[DARA].actionUsed = false;
    enc.escapar(party[DARA]);
    solto = !hasCondition(party[DARA], 'contido');
  }
  assert.ok(solto);
});

teste('incapacitado não ataca e não conta para Táticas de Matilha', () => {
  const { enc, party, foes } = montar({ foes: [['lobo', { x: 6, y: 5 }], ['lobo', { x: 6, y: 6 }]], lado: 'foes' });
  addCondition(foes[1], 'atordoado');
  const mods = enc.attackModifiers(foes[0], party[DARA]);
  assert.ok(!mods.vantagens.includes('táticas de matilha'));
  assert.equal(enc.attackAction(foes[1], party[DARA]).ok, false);
});

teste('esquivando dá vantagem na resistência de DES', () => {
  const { enc, party } = montar();
  addCondition(party[DARA], 'esquivando');
  assert.equal(enc.resistencia(party[DARA], 'dex', 10).mode, 'vantagem');
});

teste('armadura pesada sem FOR mínima tira 3 m; sem treino, desvantagem em FOR/DES', () => {
  const { enc, party } = montar();
  const ilvan = party[ILVAN];
  ilvan.armor = 'cotaDeMalha';
  ilvan.armorUntrained = true;
  assert.equal(enc.speedOf(ilvan), ilvan.speedFt - 10);
  assert.equal(enc.resistencia(ilvan, 'str', 10).mode, 'desvantagem');
});

// ---- magias ----------------------------------------------------------------

teste('cone de 4,5 m pega 7 casas, em linha reta e na diagonal; cubo pega 9', () => {
  const field = new Battlefield(12, 12, MAPA);
  assert.equal(field.cone({ x: 5, y: 5 }, { x: 1, y: 0 }, 15).length, 7);
  assert.equal(field.cone({ x: 5, y: 5 }, { x: 1, y: 1 }, 15).length, 7);
  assert.equal(field.cone({ x: 5, y: 5 }, { x: 0, y: 0 }, 15).length, 0);
  assert.equal(field.cube({ x: 5, y: 5 }, { x: 0, y: -1 }, 15).length, 9);
});

teste('truque cresce no 5º, 11º e 17º nível', () => {
  const s = getSpell('raioDeFogo');
  assert.equal(dadosDaMagia(s, { nivel: 4 }), '1d10');
  assert.equal(dadosDaMagia(s, { nivel: 5 }), '2d10');
  assert.equal(dadosDaMagia(s, { nivel: 11 }), '3d10');
  assert.equal(dadosDaMagia(s, { nivel: 17 }), '4d10');
});

teste('círculo maior: sem espaço de 1º, Míssil Mágico sai no 2º com 4 dardos', () => {
  const { enc, party, foes, log } = montar();
  const ilvan = party[ILVAN];
  ilvan.spellcasting.slots = [0, 0, 1];
  const n = log.length;
  assert.ok(enc.castSpell(ilvan, 'misselMagico', { target: foes[0] }).ok);
  assert.equal(ilvan.spellcasting.slots[2], 0);
  assert.ok(log.slice(n).some((e) => /^4 dardos/.test(e.text)), log.slice(n).map((e) => e.text).join(' | '));
});

teste('só conjura o que está pronto; magia de domínio está sempre pronta', () => {
  const { enc, party, foes } = montar();
  const brenn = party[BRENN];
  assert.equal(enc.canCast(brenn, 'misselMagico', { target: foes[0] }).ok, false);
  assert.ok(magiasProntas(brenn).includes('bencao'));
  assert.ok(!brenn.spellcasting.prepared.includes('bencao'), 'domínio não ocupa vaga');
  assert.equal(brenn.spellcasting.cantrips.length, 3);
});

teste('Infligir Ferimentos é de toque: sem desvantagem colado; crítico em quem dorme', () => {
  const { enc, party, foes } = montar();
  const brenn = party[BRENN];
  brenn.spellcasting.prepared.push('infligirFerimentos');
  brenn.pos = { x: 6, y: 4 };
  const mods = enc.attackModifiers(brenn, foes[0], { ranged: false });
  assert.ok(!mods.desvantagens.includes('inimigo adjacente'));
  foes[0].maxHp = foes[0].hp = 500;
  addCondition(foes[0], 'inconsciente');
  let criticos = 0;
  for (let i = 0; i < 20; i++) {
    brenn.actionUsed = false;
    brenn.spellcasting.slots[1] = 5;
    const antes = enc.log.length;
    enc.castSpell(brenn, 'infligirFerimentos', { target: foes[0] });
    if (enc.log.slice(antes).some((e) => /CRÍTICO/.test(e.text))) criticos += 1;
  }
  assert.ok(criticos >= 15, `${criticos} críticos em 20`);
});

teste('Bênção soma 1d4 no ataque de magia', () => {
  const { enc, party, foes, log } = montar();
  const ilvan = party[ILVAN];
  addCondition(ilvan, 'abencoado');
  const n = log.length;
  enc.castSpell(ilvan, 'raioDeFogo', { target: foes[0] });
  const r = log.slice(n).find((e) => e.rolagem?.categoria === 'ataqueDeMagia');
  assert.ok(r.rolagem.bonusPartes.some((p) => /bênção/.test(p.rotulo)));
});

teste('magia de área rola o dano uma vez para todos', () => {
  const { enc, party, log } = montar({
    foes: [['goblin', { x: 6, y: 9 }], ['goblin', { x: 7, y: 9 }], ['goblin', { x: 7, y: 8 }]],
  });
  const ilvan = party[ILVAN];
  ilvan.pos = { x: 5, y: 9 };
  const n = log.length;
  enc.castSpell(ilvan, 'maosFlamejantes', { point: { x: 6, y: 9 } });
  const dados = log.slice(n).filter((e) => e.rolagem?.danoPartes).map((e) => e.rolagem.danoPartes[0].dados.join('+'));
  assert.ok(dados.length >= 2);
  assert.equal(new Set(dados).size, 1, dados.join(' | '));
});

teste('Onda Trovejante empurra 3 m quem falha', () => {
  const { enc, party, foes } = montar({ foes: [['goblin', { x: 6, y: 9 }]], seed: 4 });
  const ilvan = party[ILVAN];
  ilvan.pos = { x: 5, y: 9 };
  ilvan.spellcasting.slots[1] = 9;
  const g = foes[0];
  g.maxHp = g.hp = 500;
  let empurrou = false;
  for (let i = 0; i < 10 && !empurrou; i++) {
    ilvan.actionUsed = false;
    g.pos = { ...g.pos, x: 6, y: 9 };
    enc.castSpell(ilvan, 'ondaTrovejante', { point: { x: 6, y: 9 } });
    empurrou = g.pos.x === 8;
  }
  assert.ok(empurrou);
});

teste('Raio Guiado: vantagem no próximo ataque, que consome a marca', () => {
  const { enc, party, foes } = montar();
  addCondition(foes[0], 'iluminado', { rounds: 2, lado: 'party' });
  const mods = enc.attackModifiers(party[DARA], foes[0]);
  assert.ok(mods.advantage);
  enc.resolveAttack(party[DARA], foes[0]);
  assert.ok(!hasCondition(foes[0], 'iluminado'));
});

teste('efeito "até o fim do seu próximo turno" conta no turno do conjurador', () => {
  const { enc, foes } = montar();
  addCondition(foes[0], 'iluminado', { rounds: 2, lado: 'party' });
  enc.fimDoTurnoDoLado('party');
  enc.fimDoTurnoDoLado('foes');
  assert.ok(hasCondition(foes[0], 'iluminado'), 'vale no próximo turno do grupo');
  enc.fimDoTurnoDoLado('party');
  assert.ok(!hasCondition(foes[0], 'iluminado'));
});

teste('Toque Arrepiante: o alvo não recupera PV', () => {
  const { enc, party } = montar();
  const dara = party[DARA];
  dara.hp = 5;
  addCondition(dara, 'semCura', { rounds: 1, lado: 'foes', quando: 'inicio' });
  assert.equal(enc.heal(dara, 10), 0);
  enc.beginSide('foes');
  assert.ok(enc.heal(dara, 10) > 0);
});

teste('Bênção acaba depois de 1 minuto (10 rodadas)', () => {
  const { enc, party } = montar();
  const brenn = party[BRENN];
  brenn.pos = { x: 1, y: 2 };
  assert.ok(enc.castSpell(brenn, 'bencao').ok);
  for (let i = 0; i < 10; i++) enc.fimDoTurnoDoLado('party');
  assert.equal(brenn.concentrating, null);
});

teste('Resistência vale um teste só', () => {
  const { enc, party } = montar();
  const brenn = party[BRENN];
  brenn.pos = { x: 4, y: 5 };
  assert.ok(enc.castSpell(brenn, 'resistencia').ok);
  const alvo = party.find((c) => hasCondition(c, 'resistente'));
  assert.ok(alvo);
  const r = enc.resistencia(alvo, 'con', 10);
  assert.ok(r.partes.some((p) => /bênção|1d4/.test(p.rotulo)));
  assert.ok(!hasCondition(alvo, 'resistente'));
  assert.equal(brenn.concentrating, null);
});

teste('Míssil Mágico divide os dardos entre alvos escolhidos', () => {
  const { enc, party, foes, log } = montar({ foes: [['goblin', { x: 6, y: 5 }], ['goblin', { x: 7, y: 5 }]] });
  const n = log.length;
  enc.castSpell(party[ILVAN], 'misselMagico', { target: foes[0], targets: foes });
  const atingidos = log.slice(n).filter((e) => e.rolagem?.categoria === 'automatica').map((e) => e.rolagem.target);
  assert.equal(new Set(atingidos).size, 2);
});

teste('Armadura Arcana: CA 13 + DES; Vida Falsa: PV temporários', () => {
  const { enc, party } = montar();
  const ilvan = party[ILVAN];
  assert.ok(enc.castSpell(ilvan, 'armaduraArcana', { target: ilvan }).ok);
  assert.equal(ilvan.ac, 15);
  ilvan.actionUsed = false;
  ilvan.spellcasting.prepared.push('vidaFalsa');
  assert.ok(enc.castSpell(ilvan, 'vidaFalsa').ok);
  assert.ok(ilvan.tempHp >= 5);
});

teste('Poupar os Moribundos estabiliza sem teste', () => {
  const { enc, party, foes } = montar();
  const dara = party[DARA];
  const brenn = party[BRENN];
  brenn.pos = { x: 4, y: 5 };
  enc.applyDamage(dara, dara.hp, 'cortante', foes[0]);
  assert.ok(enc.castSpell(brenn, 'pouparOsMoribundos', { target: dara }).ok);
  assert.equal(dara.stable, true);
});

teste('grimório do mago: 6 no 1º nível, 8 no 2º, só magia de mago', () => {
  const ilvan1 = makeParty({ nivel: 1 })[ILVAN];
  const ilvan2 = makeParty({ nivel: 2 })[ILVAN];
  assert.equal(ilvan1.spellcasting.livro.length, 6);
  assert.equal(ilvan2.spellcasting.livro.length, 8);
  assert.ok(!ilvan2.spellcasting.livro.includes('infligirFerimentos'));
});

teste('toda magia declara a fonte', () => {
  for (const s of Object.values(SPELLS)) assert.ok(['srd', 'propria'].includes(s.fonte), s.id);
});

teste('mira: quantos alvos a magia escolhe, com o círculo', () => {
  const { enc } = montar();
  assert.equal(enc.alvosDaMagia(getSpell('bencao')), 3);
  assert.equal(enc.alvosDaMagia(getSpell('bencao'), 2), 4);
  assert.equal(enc.alvosDaMagia(getSpell('misselMagico'), 3), 5);
  assert.equal(enc.alvosDaMagia(getSpell('raioDeFogo')), 1);
});

teste('mira: cura e Bênção só aceitam aliado; ataque só inimigo; alcance conta', () => {
  const { enc, party, foes } = montar();
  const brenn = party[BRENN];
  brenn.pos = { x: 5, y: 4 };
  assert.equal(enc.porqueNaoAlvo(brenn, getSpell('curarFerimentos'), party[DARA]), null);
  assert.ok(enc.porqueNaoAlvo(brenn, getSpell('curarFerimentos'), foes[0]));
  assert.ok(enc.porqueNaoAlvo(brenn, getSpell('bencao'), foes[0]));
  assert.ok(enc.porqueNaoAlvo(party[ILVAN], getSpell('raioDeFogo'), party[DARA]));
  assert.match(enc.porqueNaoAlvo(brenn, getSpell('curarFerimentos'), party[ILVAN]), /fora de alcance/);
});

teste('Bênção nos alvos escolhidos, não nos mais próximos', () => {
  const { enc, party } = montar();
  const brenn = party[BRENN];
  brenn.pos = { x: 4, y: 4 };
  party[DARA].pos = { x: 5, y: 4 };
  party[PIP].pos = { x: 4, y: 6 };
  assert.ok(enc.castSpell(brenn, 'bencao', { targets: [party[PIP]] }).ok);
  assert.ok(hasCondition(party[PIP], 'abencoado'));
  assert.ok(!hasCondition(party[DARA], 'abencoado'));
});

teste('dardo mandado para alvo inválido (aliado) é descartado', () => {
  const { enc, party, foes } = montar();
  const ilvan = party[ILVAN];
  foes[0].maxHp = foes[0].hp = 500;
  const pv = party[DARA].hp;
  enc.castSpell(ilvan, 'misselMagico', { target: foes[0], targets: [foes[0], party[DARA], foes[0]] });
  assert.equal(party[DARA].hp, pv);
  assert.ok(foes[0].hp < 500);
});

// ---- monstros --------------------------------------------------------------

teste('resistência, imunidade e vulnerabilidade a dano', () => {
  const { enc } = montar({ foes: [['esqueleto', { x: 6, y: 5 }], ['espinheiroRastejante', { x: 8, y: 5 }]] });
  const [esq, esp] = enc.combatants.filter((c) => c.side === 'foes');
  assert.equal(enc.danoPorTipo(esq, 10, 'veneno'), 0);
  assert.equal(enc.danoPorTipo(esq, 10, 'concussão'), 20);
  assert.equal(enc.danoPorTipo(esp, 7, 'fogo'), 14);
});

teste('resistência física "não mágica" não vale contra magia', () => {
  const { enc } = montar({ foes: [['espectro', { x: 6, y: 5 }]] });
  const esp = enc.combatants.find((c) => c.side === 'foes');
  assert.equal(enc.danoPorTipo(esp, 10, 'cortante'), 5);
  assert.equal(enc.danoPorTipo(esp, 10, 'cortante', true), 10);
  assert.equal(enc.danoPorTipo(esp, 10, 'necrótico'), 0);
});

teste('goblin rola Furtividade +6 (especialização do bloco)', async () => {
  const g = makeMonster('goblin', { x: 1, y: 1 });
  assert.equal(skillBonus(g, 'furtividade'), 6);
});

teste('multiataque segue a sequência do bloco (urso: mordida e garras)', () => {
  const { enc, party, foes, log } = montar({ foes: [['ursoPardo', { x: 6, y: 5 }]], lado: 'foes' });
  party[DARA].maxHp = party[DARA].hp = 500;
  const n = log.length;
  assert.ok(enc.attackAction(foes[0], party[DARA], 'Mordida').ok);
  const golpes = log.slice(n).filter((e) => e.rolagem?.categoria === 'ataque').map((e) => e.rolagem.rotulo);
  assert.deepEqual(golpes, ['Mordida', 'Garras']);
});

teste('multiataque de perto não vale para a besta: um tiro só', () => {
  const { enc, party, foes, log } = montar({ foes: [['veterano', { x: 9, y: 5 }]], lado: 'foes' });
  party[DARA].maxHp = party[DARA].hp = 500;
  const n = log.length;
  enc.attackAction(foes[0], party[DARA], 'Besta pesada');
  assert.equal(log.slice(n).filter((e) => e.rolagem?.categoria === 'ataque').length, 1);
});

teste('dano extra do golpe (veneno da aranha) tem resistência e tipo próprios', () => {
  const { enc, party, foes, log } = montar({ foes: [['aranhaGigante', { x: 6, y: 5 }]], lado: 'foes', seed: 5 });
  party[DARA].maxHp = party[DARA].hp = 500;
  let viu = false;
  for (let i = 0; i < 20 && !viu; i++) {
    const n = log.length;
    enc.resolveAttack(foes[0], party[DARA], { weaponId: 'Mordida' });
    viu = log.slice(n).some((e) => /de veneno de Mordida/.test(e.text));
  }
  assert.ok(viu);
});

teste('recarga: a teia gasta só volta com 5 ou 6 no d6', () => {
  const { enc, party, foes } = montar({ foes: [['aranhaGigante', { x: 8, y: 5 }]], lado: 'foes' });
  enc.resolveAttack(foes[0], party[DARA], { weaponId: 'Teia' });
  assert.equal(enc.canAttack(foes[0], party[DARA], 'Teia').ok, false);
  let voltou = false;
  for (let i = 0; i < 40 && !voltou; i++) {
    enc.rolarRecarga(foes[0]);
    voltou = enc.canAttack(foes[0], party[DARA], 'Teia').ok;
  }
  assert.ok(voltou);
});

teste('imunidade a condição do bloco: espectro não fica caído', () => {
  const { enc } = montar({ foes: [['espectro', { x: 6, y: 5 }]] });
  const esp = enc.combatants.find((c) => c.side === 'foes');
  enc.aplicarCondicao(esp, 'caido');
  assert.ok(!hasCondition(esp, 'caido'));
});

teste('Chefe Goblin e Raio de Doença marcados como conteúdo próprio', () => {
  assert.equal(MONSTERS.goblinChefe.fonte, 'propria');
  assert.equal(SPELLS.raioDeDoenca.fonte, 'propria');
});

// ---- progressão --------------------------------------------------------------

const BASE = () => ({
  id: 't', name: 'T', abilities: { str: 15, dex: 14, con: 14, int: 12, wis: 13, cha: 10 },
  skills: ['atletismo', 'percepcao', 'furtividade'], armor: 'nenhuma', weapons: ['adaga'],
});

teste('a party pronta continua com os mesmos números no 2º nível', () => {
  const [d, p, b, i] = makeParty();
  assert.deepEqual([d.maxHp, p.maxHp, b.maxHp, i.maxHp], [20, 17, 17, 14]);
  assert.deepEqual([d.ac, p.ac, b.ac, i.ac], [19, 15, 16, 12]);
});

teste('todas as classes sobem do 1 ao 20 sem erro', () => {
  for (const id of Object.keys(CLASSES)) {
    const c = criarPersonagem(BASE(), { classe: id, nivel: 20 });
    assert.equal(c.level, 20, id);
    assert.equal(c.proficiency, 6, id);
  }
});

teste('nível fora de 1–20 é recusado', () => {
  assert.throws(() => criarPersonagem(BASE(), { classe: 'mago', nivel: 0 }));
  assert.throws(() => criarPersonagem(BASE(), { classe: 'mago', nivel: 21 }));
});

teste('escolhas inválidas são recusadas', () => {
  assert.throws(() => criarPersonagem(BASE(), { classe: 'guerreiro', nivel: 3, escolhas: { 3: { subclasse: 'mestreDeBatalha' } } }));
  assert.throws(() => criarPersonagem(BASE(), { classe: 'guerreiro', nivel: 4, escolhas: { 4: { asi: { str: 8 } } } }));
  assert.throws(() => criarPersonagem(BASE(), { classe: 'ladino', nivel: 1, escolhas: { 1: { expertise: ['arcanismo'] } } }));
  assert.throws(() => criarPersonagem(BASE(), { classe: 'bruxo', nivel: 2, escolhas: { 2: { invocacoes: ['lifedrinker', 'xyz'] } } }));
  assert.throws(() => criarPersonagem(BASE(), { classe: 'paladino', nivel: 2, escolhas: { 2: { estiloDeLuta: 'archery' } } }));
});

teste('Inimigo Favorito e Explorador Natural não repetem', () => {
  const c = criarPersonagem(BASE(), { classe: 'patrulheiro', nivel: 14 });
  assert.equal(new Set(c.inimigosFavoritos).size, 3);
  assert.equal(new Set(c.terrenosFavoritos).size, 3);
  assert.ok(!c.inimigosFavoritos.includes('humanoides'));
});

teste('dois personagens da mesma base não dividem espaços de magia', () => {
  const base = { ...BASE(), spellcasting: { ability: 'int', cantrips: [], prepared: [] } };
  const a = criarPersonagem(base, { classe: 'mago', nivel: 1 });
  const b = criarPersonagem(base, { classe: 'mago', nivel: 5 });
  assert.notEqual(a.spellcasting, b.spellcasting);
  assert.deepEqual(a.spellcasting.slotsMax, [0, 2]);
});

teste('ASI padrão não desperdiça ponto', () => {
  const base = BASE();
  base.abilities.str = 20;
  base.abilities.con = 20;
  const c = criarPersonagem(base, { classe: 'barbaro', nivel: 4 });
  const asi = c.escolhasFeitas.find((e) => e.tipo === 'asi').valor;
  assert.equal(Object.values(asi).reduce((a, v) => a + v, 0), 2);
});

teste('paladino e patrulheiro só conjuram do 2º nível', () => {
  assert.equal(criarPersonagem(BASE(), { classe: 'paladino', nivel: 1 }).spellcasting, undefined);
  assert.ok(criarPersonagem(BASE(), { classe: 'paladino', nivel: 2 }).spellcasting);
});

teste('treino de escudo: guerreiro tem, mago não; proficiência só com arma treinada', () => {
  assert.ok(criarPersonagem(BASE(), { classe: 'guerreiro', nivel: 1 }).armorTraining.includes('escudo'));
  const mago = criarPersonagem({ ...BASE(), shield: true, weapons: ['espadaLonga'] }, { classe: 'mago', nivel: 1 });
  assert.equal(marcarTreinoDeArmadura(mago), true);
  const { enc } = montar();
  const perfil = enc.weaponAttackProfile(mago, 'espadaLonga');
  assert.ok(!perfil.bonusPartes.some((p) => p.rotulo === 'proficiência'));
});

teste('subclasse soma: truque extra do druida da Terra, 2 magias do bardo do Conhecimento', () => {
  const dru = criarPersonagem(BASE(), { classe: 'druida', nivel: 2 });
  assert.equal(dru.spellcasting.truquesConhecidos, 3);
  const bardo = criarPersonagem(BASE(), { classe: 'bardo', nivel: 6 });
  assert.equal(bardo.spellcasting.magiasConhecidas, 11);
  assert.equal(bardo.skills.length, 6, 'três perícias do Conhecimento');
});

teste('invocações de Rajada Mística pedem o truque', () => {
  const c = criarPersonagem(BASE(), { classe: 'bruxo', nivel: 12 });
  assert.ok(!c.features.includes('agonizingBlast'));
  const com = criarPersonagem({ ...BASE(), spellcasting: { ability: 'cha', cantrips: ['rajadaMistica'], prepared: [] } }, { classe: 'bruxo', nivel: 2 });
  assert.ok(com.features.includes('agonizingBlast'));
});

teste('Fúria ilimitada no 20º não vira Infinity', () => {
  const c = criarPersonagem(BASE(), { classe: 'barbaro', nivel: 20 });
  assert.ok(c.resourcesIlimitados.includes('rage'));
  assert.ok(!JSON.stringify(c.resourcesMax).includes('null'));
});

// ---- revisão das magias (revisoes/magias-2026-10-24.json) -------------------

teste('magia de ação bônus: no mesmo turno, só um truque de 1 ação', () => {
  const { enc, party, foes } = montar();
  const brenn = party[BRENN];
  assert.ok(enc.castSpell(brenn, 'palavraCurativa', { target: party[DARA] }).ok);
  const nivel1 = enc.canCast(brenn, 'raioGuiado', { target: foes[0] });
  assert.equal(nivel1.ok, false);
  assert.match(nivel1.why, /ação bônus/);
  assert.ok(enc.canCast(brenn, 'chamaSagrada', { target: foes[0] }).ok, 'truque de 1 ação continua valendo');
  // E ao contrário: depois de uma magia de 1º círculo, nada de ação bônus.
  enc.beginSide('foes');
  enc.beginSide('party');
  assert.ok(enc.castSpell(brenn, 'raioGuiado', { target: foes[0] }).ok);
  assert.equal(enc.canCast(brenn, 'palavraCurativa', { target: party[DARA] }).ok, false);
});

teste('Sono: meio-elfo também não dorme', () => {
  const { enc } = montar();
  assert.equal(enc.imuneASonoMagico({ ancestry: 'Meio-elfo', conditionImmunities: [] }), true);
  assert.equal(enc.imuneASonoMagico({ ancestry: 'Elfo', conditionImmunities: [] }), true);
  assert.equal(enc.imuneASonoMagico({ ancestry: 'Humana', conditionImmunities: [] }), false);
});

teste('Toque Arrepiante: morto-vivo atingido ataca o conjurador com desvantagem', () => {
  for (let seed = 1; seed < 40; seed++) {
    const { enc, party, foes } = montar({ seed, foes: [['esqueleto', { x: 6, y: 9 }]] });
    const ilvan = party[ILVAN];
    enc.castSpell(ilvan, 'toqueArrepiante', { target: foes[0] });
    if (!getCondition(foes[0], 'arrepiado')) continue;
    assert.ok(enc.attackModifiers(foes[0], ilvan).desvantagens.includes('toque arrepiante'));
    assert.ok(!enc.attackModifiers(foes[0], party[DARA]).desvantagens.includes('toque arrepiante'));
    // Dura até o fim do próximo turno do conjurador.
    enc.fimDoTurnoDoLado('party');
    enc.beginSide('foes');
    assert.ok(getCondition(foes[0], 'arrepiado'), 'vale no turno dos inimigos');
    enc.fimDoTurnoDoLado('foes');
    enc.beginSide('party');
    enc.fimDoTurnoDoLado('party');
    assert.ok(!getCondition(foes[0], 'arrepiado'), 'some no fim do próximo turno do conjurador');
    return;
  }
  assert.fail('o toque nunca acertou');
});

teste('Raio de Gelo: lento até o começo do próximo turno do conjurador', () => {
  for (let seed = 1; seed < 40; seed++) {
    const { enc, party, foes } = montar({ seed });
    enc.castSpell(party[ILVAN], 'raioDeGelo', { target: foes[0] });
    if (!hasCondition(foes[0], 'lento')) continue;
    enc.fimDoTurnoDoLado('party');
    enc.beginSide('foes');
    assert.ok(hasCondition(foes[0], 'lento'), 'o goblin anda devagar no turno dele');
    enc.fimDoTurnoDoLado('foes');
    enc.beginSide('party');
    assert.ok(!hasCondition(foes[0], 'lento'));
    return;
  }
  assert.fail('o raio nunca acertou');
});

teste('Graxa fica no chão: terreno difícil, teste ao entrar, some em 1 minuto', () => {
  const { enc, party, foes, log } = montar({ foes: [['goblin', { x: 10, y: 1 }]] });
  const ilvan = party[ILVAN];
  ilvan.spellcasting.prepared.push('graxa');
  assert.ok(enc.castSpell(ilvan, 'graxa', { point: { x: 6, y: 1 } }).ok);
  assert.equal(enc.zonas.length, 1);
  assert.equal(enc.field.costOf(6, 1), 10, 'terreno difícil');
  enc.fimDoTurnoDoLado('party');
  enc.beginSide('foes');
  const gob = foes[0];
  const n = log.length;
  enc.moveAlong(gob, [{ x: 10, y: 1 }, { x: 9, y: 1 }, { x: 8, y: 1 }, { x: 7, y: 1 }]);
  assert.ok(log.slice(n).some((e) => /Graxa/.test(e.text)), 'entrou e testou');
  for (let i = 0; i < 10; i++) enc.fimDoTurnoDoLado('party');
  assert.equal(enc.zonas.length, 0);
  assert.equal(enc.field.costOf(6, 1), 5);
});

teste('área: o cone segue o ângulo do cursor e não atravessa parede', () => {
  const { enc, party } = montar();
  const ilvan = party[ILVAN];
  ilvan.pos = { x: 1, y: 6 };
  const maos = getSpell('maosFlamejantes');
  // Cursor 3 para a direita e 1 para baixo: direção leste, não diagonal.
  const casas = enc.areaDaMagia(ilvan, maos, { x: 4, y: 7 });
  assert.ok(casas.some((t) => t.x === 2 && t.y === 6), 'a casa da frente está no cone');
  assert.ok(casas.every((t) => t.x > 1));
  // Parede na frente: nada atrás dela.
  const mapa = MAPA.slice();
  mapa[6] = '..#.........';
  const enc2 = new Encounter({ battlefield: new Battlefield(12, 12, mapa), party: [ilvan], foes: [], rng: makeRng(1) });
  const atras = enc2.areaDaMagia(ilvan, maos, { x: 4, y: 6 });
  assert.ok(!atras.some((t) => t.x === 3 && t.y === 6), 'a parede segura a chama');
});

teste('IA: goblin (INT 0 ou mais) contorna a Graxa; lobo (INT negativa) passa reto', () => {
  const faixa = [3, 4, 5, 6, 7].map((y) => ({ x: 6, y }));
  const rodar = (id) => {
    const { enc, party, foes, log } = montar({
      foes: [[id, { x: 8, y: 5 }]],
      pos: [{ x: 3, y: 5 }, { x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 11 }],
      lado: 'foes',
    });
    enc.criarZona(party[ILVAN], { id: 'graxa', name: 'Graxa', save: 'dex', onFail: { condition: 'caido' }, zona: { rodadas: 10 } }, faixa, 30);
    const passos = [];
    const evento = enc.onEvent;
    enc.onEvent = (e) => { if (e.type === 'moved') passos.push(...e.path); evento(e); };
    takeMonsterTurn(enc, foes[0]);
    return { pisou: passos.some((p) => p.x === 6 && p.y >= 3 && p.y <= 7), log, gob: foes[0], dara: party[DARA] };
  };
  const esperto = rodar('goblin');
  assert.equal(contornaZonas(esperto.gob), true);
  assert.equal(esperto.pisou, false, 'o goblin dá a volta');
  assert.ok(distanceFt(esperto.gob.pos, esperto.dara.pos) <= 5, 'e ainda chega na Dara');
  const burro = rodar('lobo');
  assert.equal(contornaZonas(burro.gob), false);
  assert.equal(burro.pisou, true, 'o lobo vai reto pela graxa');
});

teste('IA: sem outra passagem, até o esperto atravessa a Graxa', () => {
  const { enc, party, foes } = montar({
    foes: [['goblin', { x: 8, y: 5 }]],
    pos: [{ x: 3, y: 5 }, { x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 11 }],
    lado: 'foes',
  });
  const parede = Array.from({ length: 12 }, (_, y) => ({ x: 6, y }));
  enc.criarZona(party[ILVAN], { id: 'graxa', name: 'Graxa', save: 'dex', onFail: { condition: 'caido' }, zona: { rodadas: 10 } }, parede, 30);
  takeMonsterTurn(enc, foes[0]);
  assert.ok(foes[0].pos.x <= 6, 'não fica parado do outro lado');
});

teste('andar cobra o caminho andado, não o mais curto', () => {
  const { enc, party } = montar({ foes: [['goblin', { x: 10, y: 10 }]] });
  const dara = party[DARA];
  const antes = dara.movementLeftFt;
  // Volta de 3 passos até a casa vizinha (o caminho curto seria 1).
  assert.ok(enc.moveAlong(dara, [{ x: 5, y: 5 }, { x: 5, y: 4 }, { x: 6, y: 4 }, { x: 6, y: 5 }]));
  assert.equal(antes - dara.movementLeftFt, 15);
});

// ---- magias de 2º e 3º círculo -------------------------------------------------

/** Força o resultado das resistências (para testar o efeito, não o dado). */
function resistenciasDao(enc, sucesso) {
  const original = enc.resistencia.bind(enc);
  enc.resistencia = (...args) => ({ ...original(...args), success: sucesso });
}
/** Força o resultado dos ataques mágicos trocando o d20 por 20 ou 1. */
function d20Fixo(enc, valor) {
  const die = enc.rng.die.bind(enc.rng);
  enc.rng.die = (lados) => (lados === 20 ? valor : die(lados));
}

teste('nível 5: o mago prepara Bola de Fogo e tem espaço de 3º círculo', () => {
  const { party } = montar({ nivel: 5 });
  const ilvan = party[ILVAN];
  assert.ok(ilvan.spellcasting.prepared.includes('bolaDeFogo'));
  assert.equal(ilvan.spellcasting.slotsMax[3], 2);
  const { party: p2 } = montar();
  assert.ok(!p2[ILVAN].spellcasting.prepared.includes('bolaDeFogo'), 'no 2º nível, não');
});

teste('Bola de Fogo: esfera de 6 m, dano rolado uma vez, metade para quem passa', () => {
  const { enc, party, foes } = montar({ nivel: 5, foes: [['goblin', { x: 8, y: 8 }], ['goblin', { x: 9, y: 9 }]] });
  const ilvan = party[ILVAN];
  resistenciasDao(enc, false);
  const antes = foes.map((f) => f.hp);
  assert.ok(enc.castSpell(ilvan, 'bolaDeFogo', { point: { x: 8, y: 8 } }).ok);
  assert.equal(ilvan.spellcasting.slots[3], 1);
  assert.ok(foes.every((f, i) => f.dead || f.hp < antes[i]));
});

teste('Raio Ardente: um ataque por raio, +1 raio no 3º círculo', () => {
  for (const [circulo, raios] of [[2, 3], [3, 4]]) {
    const { enc, party, foes, log } = montar({ nivel: 5, foes: [['ogro', { x: 6, y: 9 }]] });
    const n = log.length;
    assert.ok(enc.castSpell(party[ILVAN], 'raioArdente', { target: foes[0], targets: [foes[0]], circulo }).ok);
    const ataques = log.slice(n).filter((e) => /Raio Ardente (acerta|erra)/.test(e.text)).length;
    assert.equal(ataques, raios);
  }
});

teste('Relâmpago: linha reta de 30 m que para na parede', () => {
  const mapa = MAPA.slice();
  mapa[5] = '.......#....';
  const { party } = montar({ nivel: 5 });
  const ilvan = party[ILVAN];
  ilvan.pos = { x: 1, y: 5 };
  const enc = new Encounter({ battlefield: new Battlefield(12, 12, mapa), party: [ilvan], foes: [], rng: makeRng(1) });
  const casas = enc.areaDaMagia(ilvan, getSpell('relampago'), { x: 4, y: 5 });
  assert.deepEqual(casas.map((t) => t.x), [2, 3, 4, 5, 6]);
  assert.ok(casas.every((t) => t.y === 5));
});

teste('Imobilizar Pessoa: humanoide paralisado repete o teste; esqueleto não serve', () => {
  const { enc, party, foes } = montar({ nivel: 3, foes: [['goblin', { x: 4, y: 3 }], ['esqueleto', { x: 4, y: 4 }]] });
  const brenn = party[BRENN];
  assert.match(enc.porqueNaoAlvo(brenn, getSpell('imobilizarPessoa'), foes[1]), /humanoide/);
  resistenciasDao(enc, false);
  assert.ok(enc.castSpell(brenn, 'imobilizarPessoa', { target: foes[0], targets: [foes[0]] }).ok);
  const cond = getCondition(foes[0], 'paralisado');
  assert.ok(cond?.data?.repete, 'repete no fim do turno');
  assert.equal(brenn.concentrating.spellId, 'imobilizarPessoa');
  enc.dropConcentration(brenn);
  assert.ok(!hasCondition(foes[0], 'paralisado'), 'cai junto com a concentração');
});

teste('Teia: zona de concentração; quem falha fica contido e solta quando a concentração cai', () => {
  const { enc, party, foes } = montar({ nivel: 3, foes: [['goblin', { x: 8, y: 8 }]] });
  const ilvan = party[ILVAN];
  ilvan.spellcasting.prepared.push('teia');
  resistenciasDao(enc, false);
  assert.ok(enc.castSpell(ilvan, 'teia', { point: { x: 8, y: 8 } }).ok);
  assert.equal(enc.zonas.length, 1);
  assert.ok(hasCondition(foes[0], 'contido'));
  assert.equal(getCondition(foes[0], 'contido').data.escape, enc.zonas[0].cd);
  enc.dropConcentration(ilvan);
  assert.equal(enc.zonas.length, 0);
  assert.ok(!hasCondition(foes[0], 'contido'));
});

teste('Espíritos Guardiões: inimigo que começa o turno na aura sofre, e anda pela metade nela', () => {
  const { enc, party, foes, log } = montar({ nivel: 5, foes: [['goblin', { x: 3, y: 3 }]] });
  const brenn = party[BRENN];
  assert.ok(enc.castSpell(brenn, 'espiritosGuardioes').ok);
  assert.equal(enc.auras.length, 1);
  enc.fimDoTurnoDoLado('party');
  const n = log.length;
  enc.beginSide('foes');
  assert.ok(log.slice(n).some((e) => /Espíritos Guardiões/.test(e.text)), 'teste no começo do turno');
  const alcance = enc.reachableFor(foes[0]);
  assert.equal(alcance.get('4,3')?.cost, 10, 'casa da aura custa o dobro');
  enc.dropConcentration(brenn);
  assert.equal(enc.auras.length, 0);
});

teste('Arma Espiritual: golpeia de novo com a ação bônus, sem espaço e sem contar como conjuração', () => {
  const { enc, party, foes } = montar({ nivel: 3, foes: [['ogro', { x: 4, y: 3 }]] });
  const brenn = party[BRENN];
  assert.ok(enc.castSpell(brenn, 'armaEspiritual', { target: foes[0] }).ok);
  const espacos = brenn.spellcasting.slots[2];
  enc.fimDoTurnoDoLado('party');
  enc.beginSide('foes');
  enc.beginSide('party');
  assert.ok(enc.castSpell(brenn, 'armaEspiritual', { target: foes[0] }).ok);
  assert.equal(brenn.spellcasting.slots[2], espacos, 'não gasta espaço');
  assert.equal(brenn.bonusUsed, true);
  assert.ok(enc.canCast(brenn, 'raioGuiado', { target: foes[0] }).ok, 'ainda pode conjurar com a ação');
});

teste('Revivificar: volta com 1 PV quem morreu há até 1 minuto', () => {
  const { enc, party } = montar({ nivel: 5 });
  const [dara, brenn] = [party[DARA], party[BRENN]];
  brenn.pos = { x: 4, y: 5 };
  enc.morrer(dara);
  assert.ok(enc.castSpell(brenn, 'revivificar', { target: dara }).ok);
  assert.equal(dara.dead, false);
  assert.equal(dara.hp, 1);
  const outra = montar({ nivel: 5 });
  outra.party[BRENN].pos = { x: 4, y: 5 };
  outra.enc.morrer(outra.party[DARA]);
  outra.enc.round += 11;
  assert.match(outra.enc.canCast(outra.party[BRENN], 'revivificar', { target: outra.party[DARA] }).why, /mais de 1 minuto/);
});

teste('Lentidão: −2 de CA, metade do deslocamento, sem reação', () => {
  const { enc, party, foes } = montar({ nivel: 5, foes: [['goblin', { x: 8, y: 8 }]] });
  const ilvan = party[ILVAN];
  ilvan.spellcasting.prepared.push('lentidao');
  resistenciasDao(enc, false);
  const ca = foes[0].ac;
  assert.ok(enc.castSpell(ilvan, 'lentidao', { target: foes[0], targets: [foes[0]] }).ok);
  assert.equal(caEfetiva(foes[0]), ca - 2);
  assert.equal(enc.speedOf(foes[0]), 15);
  assert.equal(foes[0].reactionUsed, true);
});

teste('Palavra Curativa em Massa: cura vários de uma vez, com a ação bônus', () => {
  const { enc, party } = montar({ nivel: 5 });
  const brenn = party[BRENN];
  party[DARA].hp = 5;
  party[PIP].hp = 3;
  assert.ok(enc.castSpell(brenn, 'palavraCurativaEmMassa', { targets: [party[DARA], party[PIP]] }).ok);
  assert.ok(party[DARA].hp > 5 && party[PIP].hp > 3);
  assert.equal(brenn.bonusUsed, true);
  assert.equal(brenn.actionUsed, false);
});

teste('Passo Nebuloso: some e aparece, sem ataque de oportunidade', () => {
  const { enc, party, foes, log } = montar({ nivel: 3, foes: [['goblin', { x: 2, y: 9 }]] });
  const ilvan = party[ILVAN];
  const n = log.length;
  assert.ok(enc.castSpell(ilvan, 'passoNebuloso', { point: { x: 5, y: 9 } }).ok);
  assert.deepEqual([ilvan.pos.x, ilvan.pos.y], [5, 9]);
  assert.ok(!log.slice(n).some((e) => /aproveita a brecha/.test(e.text)));
  assert.equal(enc.canCast(ilvan, 'passoNebuloso', { point: { x: 5, y: 5 } }).ok, false, 'casa ocupada pela Dara ou ação bônus gasta');
});

teste('Ajuda: +5 PV máximos e atuais, sem empilhar', () => {
  const { enc, party } = montar({ nivel: 3 });
  const brenn = party[BRENN];
  const dara = party[DARA];
  dara.pos = { x: 2, y: 3 };
  const [max, pv] = [dara.maxHp, dara.hp];
  assert.ok(enc.castSpell(brenn, 'ajuda', { targets: [dara] }).ok);
  assert.equal(dara.maxHp, max + 5);
  assert.equal(dara.hp, pv + 5);
  enc.beginSide('foes');
  enc.beginSide('party');
  assert.ok(enc.castSpell(brenn, 'ajuda', { targets: [dara] }).ok);
  assert.equal(dara.maxHp, max + 5, 'não empilha');
});

teste('Padrão Hipnótico: hipnotizado fica parado e o dano desperta', () => {
  const { enc, party, foes } = montar({ nivel: 5, foes: [['goblin', { x: 8, y: 8 }]] });
  const ilvan = party[ILVAN];
  ilvan.spellcasting.prepared.push('padraoHipnotico');
  ilvan.spellcasting.livro.push('padraoHipnotico');
  resistenciasDao(enc, false);
  assert.ok(enc.castSpell(ilvan, 'padraoHipnotico', { point: { x: 8, y: 8 } }).ok);
  assert.ok(hasCondition(foes[0], 'hipnotizado'));
  assert.equal(enc.speedOf(foes[0]), 0);
  enc.applyDamage(foes[0], 1, 'cortante', party[DARA]);
  assert.ok(!hasCondition(foes[0], 'hipnotizado'));
});

teste('Medo: o inimigo amedrontado foge em disparada', () => {
  const { enc, party, foes } = montar({ nivel: 5, foes: [['goblin', { x: 3, y: 9 }]] });
  const ilvan = party[ILVAN];
  ilvan.spellcasting.prepared.push('medo');
  ilvan.spellcasting.livro.push('medo');
  resistenciasDao(enc, false);
  assert.ok(enc.castSpell(ilvan, 'medo', { point: { x: 3, y: 9 } }).ok);
  assert.ok(hasCondition(foes[0], 'amedrontado'));
  const antes = distanceFt(foes[0].pos, ilvan.pos);
  enc.fimDoTurnoDoLado('party');
  enc.beginSide('foes');
  takeMonsterTurn(enc, foes[0]);
  assert.ok(distanceFt(foes[0].pos, ilvan.pos) > antes + 20, 'correu mais que o passo normal');
});

teste('Toque Vampírico: cura metade do dano e repete com a ação sem espaço', () => {
  const { enc, party, foes } = montar({ nivel: 5, foes: [['ogro', { x: 2, y: 9 }]] });
  const ilvan = party[ILVAN];
  ilvan.spellcasting.prepared.push('toqueVampirico');
  ilvan.spellcasting.livro.push('toqueVampirico');
  ilvan.hp = 5;
  d20Fixo(enc, 19);
  assert.ok(enc.castSpell(ilvan, 'toqueVampirico', { target: foes[0] }).ok);
  assert.ok(ilvan.hp > 5, 'drenou');
  const espacos = ilvan.spellcasting.slots[3];
  enc.beginSide('foes');
  enc.beginSide('party');
  assert.ok(enc.castSpell(ilvan, 'toqueVampirico', { target: foes[0] }).ok);
  assert.equal(ilvan.spellcasting.slots[3], espacos);
});

teste('Restauração Menor: tira a cegueira', () => {
  const { enc, party } = montar({ nivel: 3 });
  const brenn = party[BRENN];
  const pip = party[PIP];
  pip.pos = { x: 1, y: 2 };
  addCondition(pip, 'cego');
  assert.ok(enc.castSpell(brenn, 'restauracaoMenor', { target: pip }).ok);
  assert.ok(!hasCondition(pip, 'cego'));
  assert.match(enc.porqueNaoAlvo(brenn, getSpell('restauracaoMenor'), pip), /não está cego/);
});

// ---- truques e 1º círculo de combate dos heróis -----------------------------------

/** Um herói de qualquer classe, criado pelo motor de progressão, num campo vazio. */
function comHeroi(classe, nivel, { magias = [], truques = [], pos = { x: 2, y: 5 }, foes = [['goblin', { x: 3, y: 5 }]], aliados = [], seed = 1 } = {}) {
  const h = criarPersonagem({
    ...BASE(), id: 'h', name: 'Herói',
    abilities: { str: 14, dex: 14, con: 14, int: 16, wis: 16, cha: 16 },
  }, { classe, nivel });
  h.pos = { ...pos };
  h.spellcasting.cantrips = [...(h.spellcasting.cantrips ?? []), ...truques];
  h.spellcasting.prepared = [...(h.spellcasting.prepared ?? []), ...magias];
  const fs = foes.map(([id, p]) => makeMonster(id, p));
  const log = [];
  const enc = new Encounter({ battlefield: new Battlefield(12, 12, MAPA), party: [h, ...aliados], foes: fs, rng: makeRng(seed), onLog: (e) => log.push(e) });
  enc.firstSide = 'party';
  enc.round = 1;
  enc.beginSide('party');
  return { enc, h, foes: fs, log };
}
const golpeCorpoACorpo = (m) => m.attacks.find((a) => !a.ranged).name;

teste('Rajada Mística: dois raios no 5º nível, cada um com CAR (Explosão Agonizante)', () => {
  const { enc, h, foes, log } = comHeroi('bruxo', 5, { truques: ['rajadaMistica'], foes: [['ogro', { x: 6, y: 5 }]] });
  h.features.push('agonizingBlast');
  foes[0].hp = foes[0].maxHp = 200;
  d20Fixo(enc, 15);
  assert.equal(enc.alvosDaMagia(getSpell('rajadaMistica'), 0, h), 2);
  const n = log.length;
  assert.ok(enc.castSpell(h, 'rajadaMistica', { target: foes[0], targets: [foes[0]] }).ok);
  const acertos = log.slice(n).filter((e) => /Rajada Mística acerta/.test(e.text));
  assert.equal(acertos.length, 2);
  assert.ok(acertos.every((e) => Number(e.text.match(/: (\d+) de/)[1]) >= 4), '1d10 + 3 de CAR');
});

teste('Zombaria Viciosa: desvantagem no próximo ataque, e só nele', () => {
  const { enc, h, foes } = comHeroi('bardo', 1, { truques: ['zombariaViciosa'] });
  resistenciasDao(enc, false);
  assert.ok(enc.castSpell(h, 'zombariaViciosa', { target: foes[0] }).ok);
  assert.ok(hasCondition(foes[0], 'zombado'));
  assert.ok(enc.attackModifiers(foes[0], h).desvantagens.length > 0);
  enc.resolveAttack(foes[0], h, { weaponId: golpeCorpoACorpo(foes[0]) });
  assert.ok(!hasCondition(foes[0], 'zombado'), 'gasta no primeiro ataque');
});

teste('Chicote de Espinhos: puxa 3 m para perto', () => {
  const { enc, h, foes } = comHeroi('druida', 1, { truques: ['chicoteDeEspinhos'], foes: [['goblin', { x: 7, y: 5 }]] });
  foes[0].hp = foes[0].maxHp = 50;
  d20Fixo(enc, 18);
  assert.ok(enc.castSpell(h, 'chicoteDeEspinhos', { target: foes[0] }).ok);
  assert.equal(foes[0].pos.x, 5);
});

teste('Shillelagh: o bordão usa SAB e rola 1d8', () => {
  const { enc, h } = comHeroi('druida', 1, { truques: ['shillelagh'] });
  h.weapons = ['bordao'];
  h.equippedWeapon = 'bordao';
  const antes = enc.weaponAttackProfile(h, 'bordao');
  assert.ok(enc.castSpell(h, 'shillelagh').ok);
  const depois = enc.weaponAttackProfile(h, 'bordao');
  assert.match(depois.damage, /^1d8/);
  assert.equal(depois.bonus, antes.bonus + 1, 'SAB 16 no lugar de FOR 14');
  assert.equal(h.bonusUsed, true);
});

teste('Toque Chocante: o alvo atingido fica sem reação', () => {
  const { enc, h, foes } = comHeroi('feiticeiro', 1, { truques: ['toqueChocante'] });
  foes[0].hp = foes[0].maxHp = 50;
  d20Fixo(enc, 18);
  assert.ok(enc.castSpell(h, 'toqueChocante', { target: foes[0] }).ok);
  assert.equal(foes[0].reactionUsed, true);
});

teste('Respingo Ácido: duas criaturas juntas, não uma longe', () => {
  const { enc, h, foes } = comHeroi('mago', 1, { truques: ['respingoAcido'], foes: [['goblin', { x: 5, y: 5 }], ['goblin', { x: 5, y: 6 }], ['goblin', { x: 9, y: 9 }]] });
  for (const f of foes) f.hp = f.maxHp = 50;
  resistenciasDao(enc, false);
  assert.ok(enc.castSpell(h, 'respingoAcido', { target: foes[0], targets: foes }).ok);
  assert.ok(foes[0].hp < 50 && foes[1].hp < 50);
  assert.equal(foes[2].hp, 50);
});

teste('Proteção contra Lâminas: metade do dano de arma cortante, inteiro de magia', () => {
  const { enc, h, foes } = comHeroi('mago', 3, { truques: ['protecaoContraLaminas'] });
  assert.ok(enc.castSpell(h, 'protecaoContraLaminas').ok);
  const pv = h.hp;
  enc.applyDamage(h, 6, 'cortante', foes[0], { deArma: true });
  assert.equal(pv - h.hp, 3);
});

teste('Bruxaria: +1d6 necrótico nos acertos; só passa para outro quando o marcado cai', () => {
  const { enc, h, foes, log } = comHeroi('bruxo', 1, {
    magias: ['bruxaria'], truques: ['rajadaMistica'],
    foes: [['ogro', { x: 6, y: 5 }], ['goblin', { x: 6, y: 8 }]],
  });
  foes[0].hp = foes[0].maxHp = 200;
  d20Fixo(enc, 15);
  assert.ok(enc.castSpell(h, 'bruxaria', { target: foes[0] }).ok);
  const n = log.length;
  assert.ok(enc.castSpell(h, 'rajadaMistica', { target: foes[0], targets: [foes[0]] }).ok, 'truque de ação depois da bônus');
  assert.ok(log.slice(n).some((e) => /Bruxaria: \+\d+ de necrótico/.test(e.text)));
  enc.beginSide('foes');
  enc.beginSide('party');
  assert.match(enc.canCast(h, 'bruxaria', { target: foes[1] }).why, /só passa para outro quando ele cair/);
  enc.applyDamage(foes[0], 500, 'contundente', h);
  const espacos = h.spellcasting.slots.slice();
  assert.ok(enc.castSpell(h, 'bruxaria', { target: foes[1] }).ok);
  assert.deepEqual(h.spellcasting.slots, espacos, 'sem gastar espaço');
  assert.ok(getCondition(foes[1], 'bruxaria'));
});

teste('Escudo Arcano: sai sozinho quando +5 de CA faz o golpe errar', () => {
  const { enc, h, foes } = comHeroi('mago', 1, { magias: ['escudoArcano'] });
  const golpe = enc.weaponAttackProfile(foes[0], golpeCorpoACorpo(foes[0]));
  const d20 = h.ac + 2 - golpe.bonus;
  d20Fixo(enc, d20);
  const espacos = h.spellcasting.slots[1];
  const r = enc.resolveAttack(foes[0], h, { weaponId: golpe.name });
  assert.equal(r.hit, false);
  assert.equal(h.reactionUsed, true);
  assert.equal(h.spellcasting.slots[1], espacos - 1);
  assert.ok(hasCondition(h, 'escudoArcano'));
});

teste('Escudo Arcano não é gasto num golpe que acertaria de qualquer jeito', () => {
  const { enc, h, foes } = comHeroi('mago', 1, { magias: ['escudoArcano'] });
  d20Fixo(enc, 19);
  enc.resolveAttack(foes[0], h, { weaponId: golpeCorpoACorpo(foes[0]) });
  assert.equal(h.reactionUsed, false);
});

teste('Repreensão Infernal: quem fere o bruxo leva fogo, na reação', () => {
  const { enc, h, foes, log } = comHeroi('bruxo', 1, { magias: ['repreensaoInfernal'] });
  foes[0].hp = foes[0].maxHp = 50;
  enc.applyDamage(h, 2, 'cortante', foes[0]);
  assert.equal(h.reactionUsed, true);
  assert.ok(foes[0].hp < 50, 'o goblin queimou');
  assert.ok(log.some((e) => /Repreensão Infernal/.test(e.text)));
});

teste('Braços de Hadar: pega em volta, não o bruxo, e tira a reação', () => {
  const { enc, h, foes } = comHeroi('bruxo', 1, { magias: ['bracosDeHadar'] });
  foes[0].hp = foes[0].maxHp = 50;
  resistenciasDao(enc, false);
  const pv = h.hp;
  assert.ok(enc.castSpell(h, 'bracosDeHadar').ok);
  assert.equal(h.hp, pv);
  assert.ok(foes[0].hp < 50);
  assert.equal(foes[0].reactionUsed, true);
});

teste('Armadura de Agathys: quem acerta corpo a corpo sofre 5 de frio', () => {
  const { enc, h, foes } = comHeroi('bruxo', 1, { magias: ['armaduraDeAgathys'] });
  foes[0].hp = foes[0].maxHp = 50;
  assert.ok(enc.castSpell(h, 'armaduraDeAgathys').ok);
  assert.equal(h.tempHp, 5);
  d20Fixo(enc, 18);
  enc.resolveAttack(foes[0], h, { weaponId: golpeCorpoACorpo(foes[0]) });
  assert.equal(foes[0].hp, 45);
});

teste('Riso Histérico: cai rindo; o dano dá novo teste', () => {
  const { enc, h, foes } = comHeroi('bardo', 1, { magias: ['risoHisterico'] });
  foes[0].hp = foes[0].maxHp = 50;
  resistenciasDao(enc, false);
  assert.ok(enc.castSpell(h, 'risoHisterico', { target: foes[0], targets: [foes[0]] }).ok);
  assert.ok(hasCondition(foes[0], 'gargalhando') && hasCondition(foes[0], 'caido'));
  resistenciasDao(enc, true);
  enc.applyDamage(foes[0], 1, 'cortante', h);
  assert.ok(!hasCondition(foes[0], 'gargalhando'));
});

teste('Heroísmo: imune a medo e PV temporários no começo do turno', () => {
  const [dara] = makeParty();
  dara.pos = { x: 2, y: 6 };
  const { enc, h } = comHeroi('bardo', 1, { magias: ['heroismo'], aliados: [dara] });
  assert.ok(enc.castSpell(h, 'heroismo', { targets: [dara] }).ok);
  assert.equal(enc.aplicarCondicao(dara, 'amedrontado', {}), null);
  enc.beginSide('foes');
  enc.beginSide('party');
  assert.equal(dara.tempHp, 3);
});

teste('Fogo das Fadas e Emaranhar: condição na área, e Emaranhar não testa quem entra', () => {
  const { enc, h, foes } = comHeroi('druida', 1, { magias: ['fogoDasFadas', 'emaranhar'], foes: [['goblin', { x: 6, y: 5 }]] });
  resistenciasDao(enc, false);
  assert.ok(enc.castSpell(h, 'fogoDasFadas', { point: { x: 6, y: 5 } }).ok);
  assert.ok(hasCondition(foes[0], 'feerico'));
  enc.beginSide('foes');
  enc.beginSide('party');
  assert.ok(enc.castSpell(h, 'emaranhar', { point: { x: 6, y: 5 } }).ok);
  assert.ok(hasCondition(foes[0], 'contido'));
  assert.equal(enc.zonas[0].aoEntrar, false);
});

teste('Orbe Cromático: escolhe o tipo que o alvo não resiste', () => {
  const { enc, h, foes, log } = comHeroi('mago', 1, { magias: ['orbeCromatico'], foes: [['ogro', { x: 6, y: 5 }]] });
  foes[0].hp = foes[0].maxHp = 200;
  foes[0].resist = ['ácido', 'frio', 'fogo', 'veneno', 'trovejante'];
  d20Fixo(enc, 18);
  const n = log.length;
  assert.ok(enc.castSpell(h, 'orbeCromatico', { target: foes[0] }).ok);
  assert.ok(log.slice(n).some((e) => /de elétrico/.test(e.text)));
});

teste('Comando: o inimigo ajoelha e perde o turno; morto-vivo não obedece', () => {
  const { enc, h, foes } = comHeroi('clerigo', 1, { magias: ['comando'], foes: [['goblin', { x: 5, y: 5 }], ['esqueleto', { x: 6, y: 6 }]] });
  assert.match(enc.porqueNaoAlvo(h, getSpell('comando'), foes[1]), /morto-vivo/);
  resistenciasDao(enc, false);
  assert.ok(enc.castSpell(h, 'comando', { target: foes[0], targets: [foes[0]] }).ok);
  const pos = { ...foes[0].pos };
  enc.fimDoTurnoDoLado('party');
  enc.beginSide('foes');
  takeMonsterTurn(enc, foes[0]);
  assert.ok(hasCondition(foes[0], 'caido'));
  assert.deepEqual([foes[0].pos.x, foes[0].pos.y], [pos.x, pos.y]);
});

teste('Santuário: quem falha na SAB perde o ataque contra o protegido', () => {
  const [dara] = makeParty();
  dara.pos = { x: 4, y: 5 };
  const { enc, h, foes, log } = comHeroi('clerigo', 1, { magias: ['santuario'], aliados: [dara], foes: [['goblin', { x: 5, y: 5 }]] });
  assert.ok(enc.castSpell(h, 'santuario', { targets: [dara] }).ok);
  resistenciasDao(enc, false);
  const r = enc.resolveAttack(foes[0], dara, { weaponId: golpeCorpoACorpo(foes[0]) });
  assert.equal(r, null);
  assert.ok(log.some((e) => /hesita diante do Santuário/.test(e.text)));
});

teste('Golpe Trovejante: o próximo acerto soma 2d6 e derruba quem falha', () => {
  const { enc, h, foes, log } = comHeroi('paladino', 2, { magias: ['golpeTrovejante'] });
  foes[0].hp = foes[0].maxHp = 80;
  assert.ok(enc.castSpell(h, 'golpeTrovejante').ok);
  resistenciasDao(enc, false);
  d20Fixo(enc, 18);
  assert.ok(enc.attackAction(h, foes[0], 'adaga').ok);
  assert.ok(log.some((e) => /Golpe Trovejante: \+\d+ de trovejante/.test(e.text)));
  assert.ok(hasCondition(foes[0], 'caido'));
  assert.ok(!hasCondition(h, 'golpeTrovejante'), 'gasta no acerto');
});

teste('Raio de Bruxa: depois do acerto, a ação dá 1d12 sem espaço', () => {
  const { enc, h, foes, log } = comHeroi('bruxo', 1, { magias: ['raioDeBruxa'], foes: [['ogro', { x: 5, y: 5 }]] });
  foes[0].hp = foes[0].maxHp = 200;
  d20Fixo(enc, 18);
  assert.ok(enc.castSpell(h, 'raioDeBruxa', { target: foes[0] }).ok);
  assert.ok(h.magiasAtivas?.raioDeBruxa, 'o arco prendeu');
  enc.beginSide('foes');
  enc.beginSide('party');
  const espacos = h.spellcasting.slots.slice();
  assert.ok(enc.castSpell(h, 'raioDeBruxa', { target: foes[0] }).ok);
  assert.deepEqual(h.spellcasting.slots, espacos);
  assert.ok(log.some((e) => /O arco de Raio de Bruxa/.test(e.text)));
});

teste('Recuo Acelerado: corre agora e de novo no turno seguinte', () => {
  const { enc, h } = comHeroi('mago', 1, { magias: ['recuoAcelerado'] });
  const antes = h.movementLeftFt;
  assert.ok(enc.castSpell(h, 'recuoAcelerado').ok);
  assert.equal(h.movementLeftFt, antes * 2);
  enc.beginSide('foes');
  enc.beginSide('party');
  const espacos = h.spellcasting.slots.slice();
  assert.ok(enc.castSpell(h, 'recuoAcelerado').ok);
  assert.equal(h.movementLeftFt, antes * 2);
  assert.deepEqual(h.spellcasting.slots, espacos);
});

teste('magia de condição resistida não derruba a concentração que já existia', () => {
  const { enc, party, foes } = montar({ nivel: 5, foes: [['goblin', { x: 8, y: 8 }]] });
  const ilvan = party[ILVAN];
  ilvan.spellcasting.prepared.push('cegueiraSurdez');
  assert.ok(enc.castSpell(ilvan, 'teia', { point: { x: 9, y: 2 } }).ok);
  enc.beginSide('foes');
  enc.beginSide('party');
  ilvan.pos = { x: 6, y: 8 };
  resistenciasDao(enc, true);
  assert.ok(enc.castSpell(ilvan, 'cegueiraSurdez', { target: foes[0], targets: [foes[0]] }).ok);
  assert.equal(ilvan.concentrating?.spellId, 'teia');
});

teste('Borrifo de Cores: cega pela reserva de PV', () => {
  const { enc, h, foes } = comHeroi('feiticeiro', 1, { magias: ['borrifoDeCores'], foes: [['goblin', { x: 3, y: 5 }], ['goblin', { x: 4, y: 5 }]] });
  assert.ok(enc.castSpell(h, 'borrifoDeCores', { point: { x: 4, y: 5 } }).ok);
  assert.ok(foes.some((f) => hasCondition(f, 'cego')), 'goblins têm 7 PV: 6d10 cega pelo menos um');
});

teste('Ataque Certeiro: vantagem no próximo ataque contra o alvo', () => {
  const { enc, h, foes } = comHeroi('mago', 1, { truques: ['ataqueCerteiro'], foes: [['goblin', { x: 4, y: 5 }]] });
  assert.ok(enc.castSpell(h, 'ataqueCerteiro', { target: foes[0] }).ok);
  assert.ok(enc.attackModifiers(h, foes[0]).vantagens.includes('ataque certeiro'));
});

// ---- Ataque Extra e a terceira leva de magias ----------------------------------

teste('Ataque Extra: o guerreiro do 5º nível golpeia duas vezes; o que sobra fica para outro alvo', () => {
  const { enc, party, foes, log } = montar({ nivel: 5, foes: [['goblin', { x: 6, y: 5 }], ['goblin', { x: 6, y: 6 }]] });
  const dara = party[DARA];
  assert.equal(dara.ataquesExtras, 1);
  foes[0].hp = 1;
  d20Fixo(enc, 18);
  assert.ok(enc.attackAction(dara, foes[0], dara.equippedWeapon).ok);
  assert.ok(foes[0].dead);
  assert.equal(dara.ataquesRestantes, 1, 'o segundo golpe ficou guardado');
  assert.ok(enc.podeAtacar(dara));
  foes[1].hp = foes[1].maxHp = 50;
  const n = log.length;
  assert.ok(enc.attackAction(dara, foes[1], dara.equippedWeapon).ok);
  assert.equal(log.slice(n).filter((e) => /acerta Goblin/.test(e.text)).length, 1);
  assert.equal(enc.podeAtacar(dara), false);
});

teste('Velocidade: +2 CA, dobro do deslocamento, um golpe a mais; letargia ao acabar', () => {
  const { enc, party, foes } = montar({ nivel: 5, foes: [['ogro', { x: 6, y: 5 }]] });
  const [dara, ilvan] = [party[DARA], party[ILVAN]];
  ilvan.spellcasting.prepared.push('velocidade');
  ilvan.spellcasting.livro.push('velocidade');
  ilvan.pos = { x: 4, y: 7 };
  const ca = caEfetiva(dara);
  assert.ok(enc.castSpell(ilvan, 'velocidade', { targets: [dara] }).ok);
  assert.equal(caEfetiva(dara), ca + 2);
  enc.beginSide('foes');
  enc.beginSide('party');
  assert.equal(dara.movementLeftFt, 60);
  foes[0].hp = foes[0].maxHp = 200;
  d20Fixo(enc, 18);
  assert.ok(enc.attackAction(dara, foes[0], dara.equippedWeapon).ok);
  assert.equal(dara.actionUsed, false, 'a ação da Velocidade');
  assert.equal(enc.canCast(dara, 'raioGuiado').ok, false);
  assert.ok(enc.attackAction(dara, foes[0], dara.equippedWeapon).ok);
  enc.dropConcentration(ilvan);
  assert.ok(hasCondition(dara, 'letargico'));
});

teste('Invisibilidade: vantagem para atacar, desvantagem contra; acaba ao atacar', () => {
  const { enc, party, foes } = montar({ nivel: 3, foes: [['goblin', { x: 6, y: 5 }]] });
  const [dara, brenn] = [party[DARA], party[BRENN]];
  brenn.spellcasting.prepared.push('invisibilidade');
  brenn.pos = { x: 4, y: 5 };
  assert.ok(enc.castSpell(brenn, 'invisibilidade', { targets: [dara] }).ok);
  assert.ok(enc.attackModifiers(dara, foes[0]).vantagens.includes('atacante invisível'));
  assert.ok(enc.attackModifiers(foes[0], dara).desvantagens.includes('alvo invisível'));
  enc.attackAction(dara, foes[0], dara.equippedWeapon);
  assert.ok(!hasCondition(dara, 'invisivel'));
});

teste('Imagem Espelhada: três cópias que tomam ataques e somem', () => {
  const { enc, party, foes } = montar({ nivel: 3, foes: [['goblin', { x: 2, y: 9 }]] });
  const ilvan = party[ILVAN];
  ilvan.spellcasting.prepared.push('imagemEspelhada');
  ilvan.spellcasting.livro.push('imagemEspelhada');
  assert.ok(enc.castSpell(ilvan, 'imagemEspelhada').ok);
  assert.equal(getCondition(ilvan, 'imagens').data.n, 3);
  d20Fixo(enc, 18);
  enc.resolveAttack(foes[0], ilvan, { weaponId: golpeCorpoACorpo(foes[0]) });
  assert.equal(getCondition(ilvan, 'imagens').data.n, 2, 'o golpe foi numa cópia');
  assert.equal(ilvan.hp, ilvan.maxHp);
});

teste('Nuvem Fétida: quem começa o turno nela perde a ação', () => {
  const { enc, party, foes } = montar({ nivel: 5, foes: [['goblin', { x: 8, y: 8 }]] });
  const ilvan = party[ILVAN];
  ilvan.spellcasting.prepared.push('nuvemFetida');
  ilvan.spellcasting.livro.push('nuvemFetida');
  assert.ok(enc.castSpell(ilvan, 'nuvemFetida', { point: { x: 8, y: 8 } }).ok);
  resistenciasDao(enc, false);
  enc.fimDoTurnoDoLado('party');
  enc.beginSide('foes');
  assert.equal(foes[0].actionUsed, true);
  assert.ok(hasCondition(foes[0], 'nauseado'));
});

teste('Crescimento de Espinhos: cada casa andada dentro fere', () => {
  const { enc, party, foes } = montar({ nivel: 3, foes: [['goblin', { x: 10, y: 5 }]] });
  const ilvan = party[ILVAN];
  ilvan.spellcasting.prepared.push('crescimentoDeEspinhos');
  ilvan.spellcasting.livro.push('crescimentoDeEspinhos');
  ilvan.pos = { x: 1, y: 2 };
  assert.ok(enc.castSpell(ilvan, 'crescimentoDeEspinhos', { point: { x: 8, y: 5 } }).ok);
  foes[0].hp = foes[0].maxHp = 50;
  enc.fimDoTurnoDoLado('party');
  enc.beginSide('foes');
  enc.moveAlong(foes[0], [{ x: 10, y: 5 }, { x: 9, y: 5 }]);
  assert.ok(foes[0].hp < 50);
});

teste('Flecha Ácida: ácido no fim do próximo turno do alvo; metade se errar', () => {
  const { enc, party, foes, log } = montar({ nivel: 3, foes: [['ogro', { x: 6, y: 9 }]] });
  const ilvan = party[ILVAN];
  ilvan.spellcasting.prepared.push('flechaAcida');
  ilvan.spellcasting.livro.push('flechaAcida');
  foes[0].hp = foes[0].maxHp = 200;
  d20Fixo(enc, 18);
  assert.ok(enc.castSpell(ilvan, 'flechaAcida', { target: foes[0] }).ok);
  assert.ok(hasCondition(foes[0], 'acidoAtrasado'));
  enc.fimDoTurnoDoLado('party');
  enc.beginSide('foes');
  const pv = foes[0].hp;
  enc.fimDoTurnoDoLado('foes');
  assert.ok(foes[0].hp < pv);
  assert.ok(log.some((e) => /O ácido ainda queima/.test(e.text)));
});

teste('Enfeitiçar Pessoa: não ataca quem o enfeitiçou; dano do grupo desfaz', () => {
  const { enc, h, foes } = comHeroi('bardo', 1, { magias: ['enfeiticarPessoa'] });
  resistenciasDao(enc, false);
  assert.ok(enc.castSpell(h, 'enfeiticarPessoa', { target: foes[0], targets: [foes[0]] }).ok);
  assert.ok(hasCondition(foes[0], 'enfeiticado'));
  assert.equal(enc.resolveAttack(foes[0], h, { weaponId: golpeCorpoACorpo(foes[0]) }), null);
  foes[0].hp = foes[0].maxHp = 50;
  enc.applyDamage(foes[0], 1, 'cortante', h);
  assert.ok(!hasCondition(foes[0], 'enfeiticado'));
});

teste('Farol de Esperança: cura no máximo e vantagem no teste de morte', () => {
  const { enc, party } = montar({ nivel: 5 });
  const [dara, brenn] = [party[DARA], party[BRENN]];
  dara.pos = { x: 2, y: 3 };
  assert.ok(enc.castSpell(brenn, 'farolDeEsperanca').ok);
  assert.ok(hasCondition(dara, 'esperanca'));
  dara.hp = 1;
  enc.beginSide('foes');
  enc.beginSide('party');
  brenn.magiasNoTurno = [];
  assert.ok(enc.castSpell(brenn, 'palavraCurativa', { target: dara }).ok);
  const mod = Math.floor((brenn.abilities.wis - 10) / 2);
  // 1d4 no máximo (4) + modificador + Discípulo da Vida (2 + círculo 1).
  assert.equal(dara.hp, 1 + 4 + mod + 3);
});

// ---- quarta leva: zonas que ferem e andam, golpes, armas ------------------------

teste('Raio Lunar: fere quem começa o turno nele, uma vez; anda com a ação', () => {
  const { enc, party, foes, log } = montar({ nivel: 3, foes: [['goblin', { x: 8, y: 8 }]] });
  const brenn = party[BRENN];
  brenn.spellcasting.prepared.push('raioLunar');
  brenn.pos = { x: 4, y: 6 };
  assert.ok(enc.castSpell(brenn, 'raioLunar', { point: { x: 8, y: 8 } }).ok);
  foes[0].hp = foes[0].maxHp = 80;
  enc.fimDoTurnoDoLado('party');
  enc.beginSide('foes');
  assert.ok(foes[0].hp < 80, 'começou o turno no raio');
  assert.equal(enc.field.costOf(8, 8), 5, 'não é terreno difícil');
  enc.fimDoTurnoDoLado('foes');
  enc.beginSide('party');
  const espacos = brenn.spellcasting.slots.slice();
  assert.ok(enc.castSpell(brenn, 'raioLunar', { point: { x: 6, y: 8 } }).ok);
  assert.deepEqual(brenn.spellcasting.slots, espacos, 'mover não gasta espaço');
  assert.ok(enc.zonas[0].casas.has('6,8'));
  assert.equal(brenn.actionUsed, true);
});

teste('Esfera Flamejante: fere quem está encostado no fim do turno de quem conjurou', () => {
  const { enc, party, foes } = montar({ nivel: 3, foes: [['goblin', { x: 8, y: 8 }]] });
  const ilvan = party[ILVAN];
  ilvan.spellcasting.prepared.push('esferaFlamejante');
  ilvan.spellcasting.livro.push('esferaFlamejante');
  foes[0].hp = foes[0].maxHp = 80;
  assert.ok(enc.castSpell(ilvan, 'esferaFlamejante', { point: { x: 7, y: 8 } }).ok);
  enc.fimDoTurnoDoLado('party');
  assert.ok(foes[0].hp < 80);
});

teste('Nuvem de Adagas: 4d4 em quem entra, sem teste', () => {
  const { enc, party, foes } = montar({ nivel: 3, foes: [['goblin', { x: 9, y: 5 }]] });
  const ilvan = party[ILVAN];
  ilvan.spellcasting.prepared.push('nuvemDeAdagas');
  ilvan.spellcasting.livro.push('nuvemDeAdagas');
  ilvan.pos = { x: 5, y: 7 };
  foes[0].hp = foes[0].maxHp = 80;
  assert.ok(enc.castSpell(ilvan, 'nuvemDeAdagas', { point: { x: 8, y: 5 } }).ok);
  enc.fimDoTurnoDoLado('party');
  enc.beginSide('foes');
  enc.moveAlong(foes[0], [{ x: 9, y: 5 }, { x: 8, y: 5 }]);
  assert.ok(foes[0].hp <= 80 - 4);
});

teste('Lâmina Flamejante: acende com a bônus e golpeia com a ação sem espaço', () => {
  const { enc, h, foes } = comHeroi('druida', 3, { magias: ['laminaFlamejante'] });
  foes[0].hp = foes[0].maxHp = 80;
  assert.ok(enc.castSpell(h, 'laminaFlamejante').ok);
  assert.equal(h.bonusUsed, true);
  const espacos = h.spellcasting.slots.slice();
  d20Fixo(enc, 18);
  assert.ok(enc.castSpell(h, 'laminaFlamejante', { target: foes[0] }).ok);
  assert.ok(foes[0].hp < 80);
  assert.deepEqual(h.spellcasting.slots, espacos);
});

teste('Calor no Metal: fere sem teste e repete com a bônus', () => {
  const { enc, party, foes } = montar({ nivel: 3, foes: [['hobgoblin', { x: 4, y: 3 }]] });
  const brenn = party[BRENN];
  brenn.spellcasting.prepared.push('calorNoMetal');
  foes[0].hp = foes[0].maxHp = 80;
  assert.ok(enc.castSpell(brenn, 'calorNoMetal', { target: foes[0] }).ok);
  const pv = foes[0].hp;
  assert.ok(pv < 80);
  enc.beginSide('foes');
  enc.beginSide('party');
  assert.ok(enc.castSpell(brenn, 'calorNoMetal', { target: foes[0] }).ok);
  assert.ok(foes[0].hp < pv);
});

teste('Pele de Árvore, Arma Mágica e Golpe Marcante', () => {
  const { enc, party, foes, log } = montar({ nivel: 5, foes: [['ogro', { x: 6, y: 5 }]] });
  const [dara, brenn] = [party[DARA], party[BRENN]];
  brenn.spellcasting.prepared.push('armaMagica');
  brenn.pos = { x: 4, y: 5 };
  const antes = enc.weaponAttackProfile(dara, dara.equippedWeapon).bonus;
  assert.ok(enc.castSpell(brenn, 'armaMagica', { targets: [dara] }).ok);
  assert.equal(enc.weaponAttackProfile(dara, dara.equippedWeapon).bonus, antes + 1);
  addCondition(party[ILVAN], 'casca');
  assert.equal(caEfetiva(party[ILVAN]), 16);
});

teste('Raio do Enfraquecimento: golpe de Força sai pela metade', () => {
  const { enc, party, foes, log } = montar({ nivel: 3, foes: [['ogro', { x: 2, y: 8 }]] });
  const ilvan = party[ILVAN];
  ilvan.spellcasting.prepared.push('raioDoEnfraquecimento');
  ilvan.spellcasting.livro.push('raioDoEnfraquecimento');
  d20Fixo(enc, 18);
  assert.ok(enc.castSpell(ilvan, 'raioDoEnfraquecimento', { target: foes[0] }).ok);
  assert.ok(hasCondition(foes[0], 'enfraquecido'));
  assert.equal(ilvan.concentrating?.spellId, 'raioDoEnfraquecimento');
  enc.resolveAttack(foes[0], ilvan, { weaponId: golpeCorpoACorpo(foes[0]) });
  assert.ok(log.some((e) => /enfraquecido: o golpe sai pela metade/.test(e.text)));
});

teste('Proteção contra Energia: resiste ao tipo que os inimigos mais causam', () => {
  const { enc, party } = montar({ nivel: 5 });
  const [dara, brenn] = [party[DARA], party[BRENN]];
  brenn.spellcasting.prepared.push('protecaoContraEnergia');
  dara.pos = { x: 2, y: 3 };
  assert.ok(enc.castSpell(brenn, 'protecaoContraEnergia', { targets: [dara] }).ok);
  const tipo = getCondition(dara, 'protegidoEnergia').data.tipo;
  const pv = dara.hp;
  enc.applyDamage(dara, 10, tipo, null);
  assert.equal(pv - dara.hp, 5);
});

teste('Manto do Cruzado: aliados perto do paladino somam 1d4 radiante', () => {
  const { enc, h, foes, log } = comHeroi('paladino', 9, { magias: ['mantoDoCruzado'] });
  foes[0].hp = foes[0].maxHp = 200;
  assert.ok(enc.castSpell(h, 'mantoDoCruzado').ok);
  enc.beginSide('foes');
  enc.beginSide('party');
  d20Fixo(enc, 18);
  enc.attackAction(h, foes[0], 'adaga');
  assert.ok(log.some((e) => /Manto do Cruzado: \+\d+ de radiante/.test(e.text)));
});

teste('Aura de Vitalidade: cura 2d6 com a bônus, sem espaço', () => {
  const { enc, party } = montar({ nivel: 5 });
  const [dara, brenn] = [party[DARA], party[BRENN]];
  brenn.spellcasting.prepared.push('auraDeVitalidade');
  dara.pos = { x: 2, y: 3 };
  assert.ok(enc.castSpell(brenn, 'auraDeVitalidade').ok);
  dara.hp = 5;
  const espacos = brenn.spellcasting.slots.slice();
  assert.ok(enc.castSpell(brenn, 'auraDeVitalidade', { target: dara }).ok);
  assert.ok(dara.hp >= 7);
  assert.deepEqual(brenn.spellcasting.slots, espacos);
});

// ---- revisão 2 das magias (revisoes: chefe da rodada 2) ------------------------------

teste('Relâmpago nunca pega o conjurador e tem 20 casas em qualquer direção', () => {
  const { party } = montar({ nivel: 5 });
  const ilvan = party[ILVAN];
  const mapa = Array(45).fill('.'.repeat(45));
  const enc = new Encounter({ battlefield: new Battlefield(45, 45, mapa), party: [ilvan], foes: [], rng: makeRng(1) });
  ilvan.pos = { x: 22, y: 22 };
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, -1], [1, -1], [-1, -1], [2, 1], [-2, -1], [-2, 1]]) {
    const casas = enc.areaDaMagia(ilvan, getSpell('relampago'), { x: 22 + dx, y: 22 + dy });
    assert.equal(casas.length, 20, `direção ${dx},${dy}`);
    assert.ok(!casas.some((t) => t.x === 22 && t.y === 22), `direção ${dx},${dy} pegou o conjurador`);
  }
});

teste('Bola de Fogo com centro dentro da parede é recusada', () => {
  const mapa = Array(12).fill('............');
  mapa[5] = '.....#......';
  const { party } = montar({ nivel: 5 });
  const ilvan = party[ILVAN];
  ilvan.pos = { x: 1, y: 5 };
  const enc = new Encounter({ battlefield: new Battlefield(12, 12, mapa), party: [ilvan], foes: [], rng: makeRng(1) });
  enc.firstSide = 'party'; enc.round = 1; enc.beginSide('party');
  assert.match(enc.canCast(ilvan, 'bolaDeFogo', { point: { x: 5, y: 5 } }).why, /dentro da parede/);
});

teste('Espíritos Guardiões não atravessam parede', () => {
  const mapa = Array(12).fill('............');
  mapa[3] = '...#........';
  const brenn = makeParty({ nivel: 5 })[BRENN];
  brenn.pos = { x: 1, y: 3 };
  const g = makeMonster('goblin', { x: 4, y: 3 });
  const enc = new Encounter({ battlefield: new Battlefield(12, 12, mapa), party: [brenn], foes: [g], rng: makeRng(1) });
  enc.firstSide = 'party'; enc.round = 1; enc.beginSide('party');
  assert.ok(enc.castSpell(brenn, 'espiritosGuardioes').ok);
  assert.equal(enc.aurasHostisEm(g, g.pos).length, 0, 'atrás da parede');
});

teste('Zonas sobrepostas: o Raio Lunar fere quem está também na Teia', () => {
  const { enc, party, foes } = montar({ nivel: 5, foes: [['ogro', { x: 8, y: 8 }]] });
  const [brenn, ilvan] = [party[BRENN], party[ILVAN]];
  brenn.spellcasting.prepared.push('raioLunar');
  brenn.pos = { x: 4, y: 6 };
  foes[0].hp = foes[0].maxHp = 300;
  resistenciasDao(enc, true);
  assert.ok(enc.castSpell(ilvan, 'teia', { point: { x: 8, y: 8 } }).ok);
  assert.ok(enc.castSpell(brenn, 'raioLunar', { point: { x: 8, y: 8 } }).ok);
  enc.fimDoTurnoDoLado('party');
  enc.beginSide('foes');
  assert.ok(foes[0].hp < 300, 'o raio também valeu');
});

teste('atacante morto pela Repreensão para o Multiataque', () => {
  const { enc, h, foes, log } = comHeroi('bruxo', 3, { magias: ['repreensaoInfernal'], foes: [['ogro', { x: 3, y: 5 }]] });
  foes[0].hp = 1;
  foes[0].multiattack = { count: 2 };
  h.hp = h.maxHp = 200;
  d20Fixo(enc, 18);
  enc.beginSide('foes');
  enc.attackAction(foes[0], h, golpeCorpoACorpo(foes[0]));
  assert.ok(foes[0].dead);
  assert.equal(log.filter((e) => /^Ogro acerta/.test(e.text)).length, 1, 'um golpe só');
});

teste('Surto de Ação não engole o golpe guardado do Ataque Extra', () => {
  const { enc, party, foes } = montar({ nivel: 5, foes: [['goblin', { x: 6, y: 5 }], ['ogro', { x: 6, y: 6 }]] });
  const dara = party[DARA];
  foes[0].hp = 1;
  foes[1].hp = foes[1].maxHp = 300;
  d20Fixo(enc, 18);
  dara.extraActions = 1;
  enc.attackAction(dara, foes[0], dara.equippedWeapon);
  assert.equal(dara.ataquesRestantes, 1);
  enc.attackAction(dara, foes[1], dara.equippedWeapon);
  assert.equal(dara.actionUsed, false, 'agora sim o Surto devolve a ação');
});

teste('Velocidade: Disparada primeiro gasta a ação veloz e deixa o Ataque Extra', () => {
  const { enc, party } = montar({ nivel: 5 });
  const [dara, ilvan] = [party[DARA], party[ILVAN]];
  ilvan.spellcasting.prepared.push('velocidade');
  ilvan.spellcasting.livro.push('velocidade');
  ilvan.pos = { x: 4, y: 7 };
  assert.ok(enc.castSpell(ilvan, 'velocidade', { targets: [dara] }).ok);
  assert.ok(enc.dash(dara));
  assert.equal(dara.actionUsed, false);
  assert.equal(dara.acaoVelozDisponivel, false);
});

teste('Velocidade acabando no turno do grupo: a letargia ainda vale no próximo', () => {
  const { enc, party } = montar({ nivel: 5 });
  const [dara, ilvan] = [party[DARA], party[ILVAN]];
  ilvan.spellcasting.prepared.push('velocidade');
  ilvan.spellcasting.livro.push('velocidade');
  ilvan.pos = { x: 4, y: 7 };
  assert.ok(enc.castSpell(ilvan, 'velocidade', { targets: [dara] }).ok);
  // A Dara já agiu neste turno: perde o próximo (e não este, que já passou).
  dara.acted = true;
  enc.dropConcentration(ilvan);
  enc.fimDoTurnoDoLado('party');
  enc.beginSide('foes');
  enc.fimDoTurnoDoLado('foes');
  enc.beginSide('party');
  assert.ok(hasCondition(dara, 'letargico'), 'perde o próximo turno');
  assert.equal(enc.speedOf(dara), 0);
});

teste('Velocidade acabando antes de o alvo agir: ele perde este turno, não dois', () => {
  const { enc, party } = montar({ nivel: 5 });
  const [dara, ilvan] = [party[DARA], party[ILVAN]];
  ilvan.spellcasting.prepared.push('velocidade');
  ilvan.spellcasting.livro.push('velocidade');
  ilvan.pos = { x: 4, y: 7 };
  assert.ok(enc.castSpell(ilvan, 'velocidade', { targets: [dara] }).ok);
  enc.dropConcentration(ilvan);
  assert.ok(hasCondition(dara, 'letargico'), 'perde este');
  enc.fimDoTurnoDoLado('party');
  enc.beginSide('foes');
  enc.fimDoTurnoDoLado('foes');
  enc.beginSide('party');
  assert.ok(!hasCondition(dara, 'letargico'), 'e não o seguinte');
});

teste('a ação da Velocidade não repete magia', () => {
  const { enc, h, foes } = comHeroi('druida', 5, { magias: ['laminaFlamejante'] });
  foes[0].hp = foes[0].maxHp = 80;
  assert.ok(enc.castSpell(h, 'laminaFlamejante').ok);
  h.actionUsed = false;
  h.acaoLimitada = true;
  assert.match(enc.canCast(h, 'laminaFlamejante', { target: foes[0] }).why, /Velocidade/);
});

teste('Tempestade de Granizo acabando: quem caiu continua caído', () => {
  const { enc, party, foes } = montar({ nivel: 5, foes: [['goblin', { x: 8, y: 8 }]] });
  const ilvan = party[ILVAN];
  ilvan.spellcasting.prepared.push('tempestadeDeGranizo');
  ilvan.spellcasting.livro.push('tempestadeDeGranizo');
  assert.ok(enc.castSpell(ilvan, 'tempestadeDeGranizo', { point: { x: 8, y: 8 } }).ok);
  resistenciasDao(enc, false);
  enc.fimDoTurnoDoLado('party');
  enc.beginSide('foes');
  assert.ok(hasCondition(foes[0], 'caido'));
  enc.dropConcentration(ilvan);
  assert.ok(hasCondition(foes[0], 'caido'), 'cair não se desfaz');
});

teste('Padrão Hipnótico respeita imunidade a enfeitiçado', () => {
  const { enc } = montar();
  assert.equal(enc.imuneACondicao({ conditionImmunities: ['enfeitiçado'] }, 'hipnotizado'), true);
  assert.equal(enc.imuneACondicao({ conditionImmunities: ['enfeitiçado'] }, 'enfeiticado'), true);
});

teste('Toque Vampírico não drena de quem é imune a necrótico', () => {
  const { enc, party, foes } = montar({ nivel: 5, foes: [['ogro', { x: 2, y: 9 }]] });
  const ilvan = party[ILVAN];
  ilvan.spellcasting.prepared.push('toqueVampirico');
  ilvan.spellcasting.livro.push('toqueVampirico');
  foes[0].immune = ['necrótico'];
  ilvan.hp = 5;
  d20Fixo(enc, 18);
  assert.ok(enc.castSpell(ilvan, 'toqueVampirico', { target: foes[0] }).ok);
  assert.equal(ilvan.hp, 5);
});

teste('Ajuda levanta quem está caído a 0 PV', () => {
  const { enc, party } = montar({ nivel: 3 });
  const [dara, brenn] = [party[DARA], party[BRENN]];
  dara.pos = { x: 2, y: 3 };
  enc.applyDamage(dara, dara.hp, 'cortante', null);
  assert.ok(hasCondition(dara, 'inconsciente'));
  assert.ok(enc.castSpell(brenn, 'ajuda', { targets: [dara] }).ok);
  assert.equal(dara.hp, 5);
  assert.ok(!hasCondition(dara, 'inconsciente'));
});

teste('Golpe Marcante no 3º círculo soma 3d6', () => {
  const { enc, h, foes, log } = comHeroi('paladino', 9, { magias: ['golpeMarcante'] });
  foes[0].hp = foes[0].maxHp = 300;
  assert.ok(enc.castSpell(h, 'golpeMarcante', { circulo: 3 }).ok);
  d20Fixo(enc, 18);
  enc.attackAction(h, foes[0], 'adaga');
  assert.ok(log.some((e) => /Golpe Marcante: \+\d+ de radiante/.test(e.text) && /3d6/.test(e.detail ?? e.conta ?? '')) || log.some((e) => (e.detail ?? '').includes('3d6')));
});

teste('Golpe Colérico assusta mas não faz o inimigo fugir', () => {
  const { enc, h, foes } = comHeroi('paladino', 2, { magias: ['golpeColerico'] });
  foes[0].hp = foes[0].maxHp = 80;
  assert.ok(enc.castSpell(h, 'golpeColerico').ok);
  resistenciasDao(enc, false);
  d20Fixo(enc, 18);
  enc.attackAction(h, foes[0], 'adaga');
  assert.ok(hasCondition(foes[0], 'amedrontado'));
  const pos = { ...foes[0].pos };
  enc.fimDoTurnoDoLado('party');
  enc.beginSide('foes');
  takeMonsterTurn(enc, foes[0]);
  assert.ok(distanceFt(foes[0].pos, h.pos) <= distanceFt(pos, h.pos), 'não correu para longe');
});

teste('Calor no Metal fica preso ao primeiro alvo', () => {
  const { enc, party, foes } = montar({ nivel: 3, foes: [['hobgoblin', { x: 4, y: 3 }], ['hobgoblin', { x: 4, y: 4 }]] });
  const brenn = party[BRENN];
  brenn.spellcasting.prepared.push('calorNoMetal');
  assert.ok(enc.castSpell(brenn, 'calorNoMetal', { target: foes[0] }).ok);
  enc.beginSide('foes');
  enc.beginSide('party');
  assert.match(enc.canCast(brenn, 'calorNoMetal', { target: foes[1] }).why, /outro alvo/);
});

teste('golpear com a Lâmina desfaz a Invisibilidade', () => {
  const { enc, h, foes } = comHeroi('druida', 3, { magias: ['laminaFlamejante'] });
  foes[0].hp = foes[0].maxHp = 80;
  assert.ok(enc.castSpell(h, 'laminaFlamejante').ok);
  addCondition(h, 'invisivel');
  assert.ok(enc.castSpell(h, 'laminaFlamejante', { target: foes[0] }).ok);
  assert.ok(!hasCondition(h, 'invisivel'));
});

teste('Esfera Flamejante não aparece em casa ocupada e queima o dono encostado', () => {
  const { enc, party, foes } = montar({ nivel: 3, foes: [['goblin', { x: 8, y: 8 }]] });
  const ilvan = party[ILVAN];
  ilvan.spellcasting.prepared.push('esferaFlamejante');
  ilvan.spellcasting.livro.push('esferaFlamejante');
  assert.match(enc.canCast(ilvan, 'esferaFlamejante', { point: { x: 8, y: 8 } }).why, /casa vazia/);
  ilvan.hp = ilvan.maxHp = 100;
  resistenciasDao(enc, false);
  assert.ok(enc.castSpell(ilvan, 'esferaFlamejante', { point: { x: 2, y: 9 } }).ok);
  enc.fimDoTurnoDoLado('party');
  assert.ok(ilvan.hp < 100, 'quem conjurou encostado também queima');
});

// ---- pendências da rodada 2 (R30, A18) ----------------------------------------

teste('golpe com dano extra pede UM teste de concentração, pela soma', () => {
  const { enc, h, foes, log } = comHeroi('paladino', 5, { magias: ['golpeMarcante'] });
  foes[0].hp = foes[0].maxHp = 300;
  foes[0].concentrating = { spellId: 'raioDeBruxa', condition: null, targets: [], rounds: 10 };
  assert.ok(enc.castSpell(h, 'golpeMarcante').ok);
  d20Fixo(enc, 18);
  enc.attackAction(h, foes[0], 'adaga');
  const testes = log.filter((e) => /(mantém|perde) a concentração/.test(e.text) && e.text.startsWith(foes[0].name));
  // O paladino de 5º ataca duas vezes: um teste por golpe, não por parcela.
  const golpes = log.filter((e) => /^Herói acerta/.test(e.text));
  assert.equal(testes.length, golpes.length, 'um teste por golpe');
  // O primeiro golpe leva a arma e o Golpe Marcante: a CD sai da soma.
  const arma = Number(golpes[0].text.match(/(\d+) de dano/)[1]);
  const marcante = Number(log.find((e) => /Golpe Marcante: \+\d+/.test(e.text)).text.match(/\+(\d+)/)[1]);
  assert.ok(JSON.stringify(testes[0]).includes(`${arma + marcante} de dano`), 'a CD sai da soma do golpe');
});

teste('Esculpir Magias poupa os aliados com menos PV, não a primeira casa', () => {
  const { enc, party } = montar({ nivel: 3 });
  const ilvan = party[ILVAN];
  if (!ilvan.features.includes('sculptSpells')) ilvan.features.push('sculptSpells');
  const [forte, medio, fraco] = [party[DARA], party[BRENN], party[PIP]];
  forte.hp = 40; medio.hp = 20; fraco.hp = 5;
  const casas = [forte, medio, fraco].map((c) => ({ ...c.pos }));
  const papel = new Map(enc.afetadosPelaArea(ilvan, getSpell('maosFlamejantes'), casas, 1).map((r) => [r.c, r.papel]));
  assert.equal(papel.get(fraco), 'poupado');
  assert.equal(papel.get(medio), 'poupado');
  assert.equal(papel.get(forte), 'aliado');
});

// ---- uma fonte de dano, Esculpir Magias (chefe da folha K) ----------------------

const testesDeConcentracao = (log, nome) => log.filter((e) => /(mantém|perde) a concentração/.test(e.text) && e.text.startsWith(nome));

teste('quem cai na mordida não leva falha de morte pelo veneno do mesmo golpe', () => {
  const { enc, party, foes, log } = montar({ lado: 'foes', foes: [['aranhaGigante', { x: 3, y: 5 }]] });
  const pip = party[PIP];
  pip.pos = { x: 2, y: 5 };
  pip.hp = 1;
  resistenciasDao(enc, false);
  d20Fixo(enc, 18);
  const res = enc.attackAction(foes[0], pip, 'Mordida');
  assert.ok(hasCondition(pip, 'inconsciente') || pip.dead, JSON.stringify(res) + ' ' + log.slice(-6).map((e) => e.text).join(' | '));
  if (!pip.dead) assert.equal(pip.deathSaves.failures, 0, 'o veneno é o mesmo golpe');
});

teste('Míssil Mágico: um teste de concentração por dardo', () => {
  const { enc, party, foes, log } = montar({ nivel: 3 });
  foes[0].hp = foes[0].maxHp = 100;
  foes[0].concentrating = { spellId: 'raioDeBruxa', condition: null, targets: [], rounds: 10 };
  resistenciasDao(enc, true);
  assert.ok(enc.castSpell(party[ILVAN], 'misselMagico', { target: foes[0] }).ok);
  assert.equal(testesDeConcentracao(log, foes[0].name).length, 3);
});

teste('Saraivada de Espinhos: a chuva é outra fonte e aparece no registro', () => {
  const { enc, h, foes, log } = comHeroi('patrulheiro', 5, { magias: ['saraivadaDeEspinhos'], foes: [['ogro', { x: 6, y: 5 }]] });
  foes[0].hp = foes[0].maxHp = 300;
  foes[0].concentrating = { spellId: 'raioDeBruxa', condition: null, targets: [], rounds: 10 };
  // Conta os testes de concentração sem deixar a concentração cair no meio.
  const testes = [];
  enc.concentrationCheck = (c, dano) => { if (c === foes[0]) testes.push(dano); };
  assert.ok(enc.castSpell(h, 'saraivadaDeEspinhos').ok);
  resistenciasDao(enc, false);
  d20Fixo(enc, 18);
  const n = log.length;
  enc.attackAction(h, foes[0], 'arcoLongo');
  const depois = log.slice(n);
  assert.ok(depois.some((e) => /sofre \d+ de perfurante \(Saraivada de Espinhos\)/.test(e.text)), depois.map((e) => e.text).join(' | '));
  const golpes = depois.filter((e) => /^Herói acerta/.test(e.text)).length;
  assert.equal(testes.length, golpes + 1, 'o golpe e a chuva, cada um com o seu');
});

teste('Riso Histérico: um teste por golpe, não por parcela', () => {
  const { enc, h, foes, log } = comHeroi('paladino', 5, { magias: ['golpeMarcante'] });
  foes[0].hp = foes[0].maxHp = 300;
  addCondition(foes[0], 'gargalhando', { source: 'x', data: { save: 'wis', dc: 30 } });
  let testes = 0;
  const original = enc.resistencia.bind(enc);
  enc.resistencia = (c, save, dc, o) => { if (c === foes[0] && save === 'wis') testes += 1; return { ...original(c, save, dc, o), success: false }; };
  assert.ok(enc.castSpell(h, 'golpeMarcante').ok);
  d20Fixo(enc, 18);
  enc.attackAction(h, foes[0], 'adaga');
  const golpes = log.filter((e) => /^Herói acerta/.test(e.text)).length;
  assert.equal(testes, golpes);
});

teste('Esculpir Magias não poupa o próprio mago', () => {
  const { enc, party } = montar({ nivel: 5 });
  const ilvan = party[ILVAN];
  if (!ilvan.features.includes('sculptSpells')) ilvan.features.push('sculptSpells');
  const papeis = enc.afetadosPelaArea(ilvan, getSpell('bolaDeFogo'), [{ ...ilvan.pos }, { ...party[DARA].pos }], 3);
  assert.equal(papeis.find((r) => r.c === ilvan)?.papel, 'aliado');
  assert.equal(papeis.find((r) => r.c === party[DARA])?.papel, 'poupado');
});

teste('herói já caído: a mordida com veneno conta falhas uma vez só', () => {
  const { enc, party, foes } = montar({ lado: 'foes', foes: [['aranhaGigante', { x: 3, y: 5 }]] });
  const pip = party[PIP];
  pip.pos = { x: 2, y: 5 };
  pip.maxHp = 200;
  pip.hp = 0;
  addCondition(pip, 'inconsciente');
  addCondition(pip, 'caido');
  pip.deathSaves = { successes: 0, failures: 0 };
  resistenciasDao(enc, false);
  // Crítico: a mordida dá duas falhas; o veneno do mesmo golpe não soma mais duas.
  d20Fixo(enc, 20);
  enc.attackAction(foes[0], pip, 'Mordida');
  assert.ok(!pip.dead, 'o veneno não é um segundo golpe');
  assert.equal(pip.deathSaves.failures, 2);
});

teste('arrastado pelos espinhos: cada 1,5 m é um teste à parte do golpe', () => {
  const { enc, h, foes } = comHeroi('paladino', 5, { magias: ['golpeTrovejante'], foes: [['ogro', { x: 3, y: 5 }]] });
  foes[0].hp = foes[0].maxHp = 300;
  foes[0].concentrating = { spellId: 'raioDeBruxa', condition: null, targets: [], rounds: 10 };
  const testes = [];
  enc.concentrationCheck = (c, dano) => { if (c === foes[0]) testes.push(dano); };
  // Espinhos em toda a fileira atrás do ogro.
  enc.zonas.push({ nome: 'Crescimento de Espinhos', danoPorPasso: '2d4', casas: new Set(['4,5', '5,5', '6,5', '7,5']), dono: h });
  assert.ok(enc.castSpell(h, 'golpeTrovejante').ok);
  resistenciasDao(enc, false);
  d20Fixo(enc, 18);
  const antes = foes[0].pos.x;
  enc.attackAction(h, foes[0], 'adaga');
  const passos = foes[0].pos.x - antes;
  assert.ok(passos > 0, 'foi empurrado');
  // O golpe (com o trovão) num teste, cada passo nos espinhos no seu; o
  // segundo ataque do Ataque Extra, se acertou, no dele.
  assert.ok(testes.length >= 1 + passos, `testes ${testes.join(',')} · passos ${passos}`);
});

teste('o mago dentro da própria Bola de Fogo sofre o dano', () => {
  const { enc, party } = montar({ nivel: 5 });
  const ilvan = party[ILVAN];
  if (!ilvan.features.includes('sculptSpells')) ilvan.features.push('sculptSpells');
  ilvan.hp = ilvan.maxHp = 200;
  resistenciasDao(enc, false);
  assert.ok(enc.castSpell(ilvan, 'bolaDeFogo', { point: { ...ilvan.pos } }).ok);
  assert.ok(ilvan.hp < 200, 'Esculpir Magias poupa os outros, não ele');
});

teste('mover o Raio Lunar conta 60 pés do feixe, não do conjurador', () => {
  // Campo comprido: o feixe longe do Brenn, para as duas medidas divergirem.
  const field = new Battlefield(40, 3, Array(3).fill('.'.repeat(40)));
  const party = makeParty({ nivel: 3 });
  party.forEach((c, i) => { c.pos = { x: i, y: 0 }; });
  const brenn = party[BRENN];
  const enc = new Encounter({ battlefield: field, party, foes: [makeMonster('goblin', { x: 39, y: 2 })], rng: makeRng(1), onLog: () => {} });
  enc.firstSide = 'party';
  enc.round = 1;
  enc.beginSide('party');
  brenn.spellcasting.prepared.push('raioLunar');
  assert.ok(enc.castSpell(brenn, 'raioLunar', { point: { x: 25, y: 1 } }).ok);
  enc.beginSide('foes');
  enc.beginSide('party');
  // A 60 pés do feixe e a 175 do Brenn (além dos 120 da magia): pode.
  assert.ok(enc.canCast(brenn, 'raioLunar', { point: { x: 37, y: 1 } }).ok, enc.canCast(brenn, 'raioLunar', { point: { x: 37, y: 1 } }).why);
  // A 65 pés do feixe: não.
  assert.equal(enc.canCast(brenn, 'raioLunar', { point: { x: 38, y: 1 } }).ok, false);
});

console.log(`\n${total - falhas}/${total} passaram`);
if (falhas) process.exit(1);
