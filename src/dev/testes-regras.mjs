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
import { marcarTreinoDeArmadura, quantosNaMochila, WEAPONS, garantirInventario, itemDeId } from '../rules/equipment.js';
import { Battlefield, distanceFt, SUPERFICIES } from '../core/grid.js';
import { takeMonsterTurn, contornaZonas, runAutoSummons, encerrarTurnoComInvocados } from '../rules/ai.js';
import { makeRng } from '../core/rng.js';
import { addCondition, hasCondition, getCondition, caEfetiva, conditionEffects } from '../rules/conditions.js';
import { SPELLS, getSpell, magiasProntas, dadosDaMagia } from '../rules/spells.js';
import { comoVe, visaoNoEscuro, fontesDeLuz, nivelDeLuz, PENUMBRA, ESCURO } from '../rules/luz.js';
import { listaDaClasse } from '../game/criacao.js';
import { oracaoDeCura, bomFrutoNoDescanso, descansoLongo } from '../rules/descanso.js';
import { nivelDeExaustao, mudarExaustao, maxHpEfetivo, exaustaoFatal } from '../rules/conditions.js';
import {
  diaDeViagem, forragear, melhorForrageador, despensaDoGrupo, limiteSemComida,
  racoesDe, darRacoes, aguaDe, encherAgua, beberAgua,
  despensaMagica, guardarMagico, limparMagicoVencido,
} from '../rules/mantimentos.js';

/** Um dado que sempre cai no mesmo numero, para medir a CD e nao a sorte. */
const dadoFixo = (n, faces = 20) => {
  const f = () => (n - 0.5) / faces;
  // So o d20 cai no numero pedido: um d6 que devolvesse 20 faria o teste
  // passar com um valor impossivel.
  f.die = (lados) => (lados === faces ? n : Math.max(1, Math.ceil(lados / 2)));
  f.int = (k) => Math.floor(f() * k);
  f.pick = (a) => a[0];
  f.chance = () => false;
  f.shuffle = (a) => a.slice();
  return f;
};

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
  h.equippedWeapon = 'arcoLongo';   // só se atira com o arco na mão
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

// ---- lote: Duelo, Constritor, Névoa, Escuridão, Lufada, Hadar, Relâmpagos, Flecha, Dissipar ----

/** Um mago de 5º nível que conhece a magia, num campo vazio com os inimigos dados. */
function magoCom(magia, { foes = [['goblin', { x: 6, y: 5 }]], nivel = 5 } = {}) {
  const r = montar({ nivel, foes });
  const ilvan = r.party[ILVAN];
  ilvan.spellcasting.prepared.push(magia);
  ilvan.spellcasting.livro.push(magia);
  return { ...r, ilvan };
}

teste('Duelo Compelido: desvantagem contra os outros, preso ao raio de 9 m e fixado no conjurador', () => {
  const dara = makeParty({ nivel: 2 })[DARA];
  dara.pos = { x: 3, y: 6 };
  const { enc, h, foes } = comHeroi('paladino', 5, {
    magias: ['dueloCompelido'], aliados: [dara], foes: [['goblin', { x: 3, y: 5 }]],
  });
  foes[0].hp = foes[0].maxHp = 60;
  resistenciasDao(enc, false);
  assert.ok(enc.castSpell(h, 'dueloCompelido', { targets: [foes[0]] }).ok);
  assert.ok(hasCondition(foes[0], 'duelo'));
  assert.ok(enc.attackModifiers(foes[0], dara).desvantagens.includes('duelo compelido'));
  assert.ok(!enc.attackModifiers(foes[0], h).desvantagens.includes('duelo compelido'));
  // Não se afasta além de 9 m (30 pés) do paladino, mesmo com 30 pés de passo.
  enc.fimDoTurnoDoLado('party');
  enc.beginSide('foes');
  const alcance = enc.reachableFor(foes[0]);
  assert.ok([...alcance.values()].every((n) => distanceFt(h.pos, n) <= 30), 'não sai do raio');
  assert.ok([...alcance.values()].some((n) => distanceFt(h.pos, n) >= 25), 'mas anda dentro dele');
  // A IA ataca o conjurador, não o aliado que estava ali ao lado.
  const alvos = [];
  const atacar = enc.attackAction.bind(enc);
  enc.attackAction = (a, t, w) => { alvos.push(t); return atacar(a, t, w); };
  takeMonsterTurn(enc, foes[0]);
  assert.equal(alvos[0], h);
});

teste('Duelo Compelido acaba quando o conjurador ataca outro, ou um aliado fere o duelado', () => {
  const dara = makeParty({ nivel: 2 })[DARA];
  dara.pos = { x: 4, y: 6 };
  const { enc, h, foes } = comHeroi('paladino', 5, {
    magias: ['dueloCompelido'], aliados: [dara], foes: [['goblin', { x: 3, y: 5 }], ['goblin', { x: 2, y: 6 }]],
  });
  foes.forEach((f) => { f.hp = f.maxHp = 80; });
  resistenciasDao(enc, false);
  assert.ok(enc.castSpell(h, 'dueloCompelido', { targets: [foes[0]] }).ok);
  assert.equal(h.concentrating?.spellId, 'dueloCompelido');
  // Atacar o duelado não acaba.
  d20Fixo(enc, 18);
  enc.resolveAttack(h, foes[0], { weaponId: 'adaga' });
  assert.equal(h.concentrating?.spellId, 'dueloCompelido');
  // Aliado ferindo o duelado: acaba.
  enc.applyDamage(foes[0], 1, 'cortante', dara);
  assert.equal(h.concentrating, null);
  assert.ok(!hasCondition(foes[0], 'duelo'));
  // De novo, e agora o conjurador ataca o OUTRO goblin.
  h.bonusUsed = false;
  h.magiasNoTurno = [];
  h.spellcasting.slots[1] = 2;
  assert.ok(enc.castSpell(h, 'dueloCompelido', { targets: [foes[0]] }).ok);
  enc.resolveAttack(h, foes[1], { weaponId: 'adaga' });
  assert.equal(h.concentrating, null);
  assert.ok(!hasCondition(foes[0], 'duelo'));
});

teste('Duelo Compelido acaba se o conjurador termina o turno a mais de 9 m do duelado', () => {
  const { enc, h, foes } = comHeroi('paladino', 5, { magias: ['dueloCompelido'], foes: [['goblin', { x: 3, y: 5 }]] });
  resistenciasDao(enc, false);
  assert.ok(enc.castSpell(h, 'dueloCompelido', { targets: [foes[0]] }).ok);
  h.pos = { x: 11, y: 11 };
  enc.fimDoTurnoDoLado('party');
  assert.equal(h.concentrating, null);
});

teste('Golpe Constritor: vinhas prendem, ferem no começo do turno e somem quando ele se solta', () => {
  const { enc, h, foes } = comHeroi('patrulheiro', 5, { magias: ['golpeConstritor'], foes: [['goblin', { x: 3, y: 5 }]] });
  foes[0].hp = foes[0].maxHp = 80;
  resistenciasDao(enc, false);
  d20Fixo(enc, 18);
  assert.ok(enc.castSpell(h, 'golpeConstritor').ok);
  assert.ok(hasCondition(h, 'golpeConstritor'));
  enc.resolveAttack(h, foes[0], { weaponId: 'adaga' });
  const contido = getCondition(foes[0], 'presoPorVinhas');
  assert.ok(contido?.data?.vinhas, 'as vinhas prenderam');
  assert.ok(!hasCondition(foes[0], 'contido'), 'não usa a condição da Teia');
  assert.ok(!hasCondition(h, 'golpeConstritor'), 'o golpe preparado se gasta');
  assert.equal(h.concentrating?.condition, 'presoPorVinhas');
  enc.fimDoTurnoDoLado('party');
  const antes = foes[0].hp;
  enc.beginSide('foes');
  assert.ok(foes[0].hp < antes, 'as vinhas apertam no começo do turno');
  // Soltar-se é uma ação de Atletismo (FOR) e desfaz a magia.
  d20Fixo(enc, 20);
  assert.ok(enc.escapar(foes[0]).ok);
  assert.ok(!hasCondition(foes[0], 'presoPorVinhas'));
  assert.equal(h.concentrating, null);
});

teste('Golpe Constritor sobre quem já está na Teia: as duas prisões valem, e soltar uma não solta a outra', () => {
  const ilvan = makeParty({ nivel: 5 })[ILVAN];
  ilvan.spellcasting.prepared.push('teia');
  ilvan.spellcasting.livro.push('teia');
  ilvan.pos = { x: 1, y: 3 };
  const { enc, h, foes } = comHeroi('patrulheiro', 5, {
    magias: ['golpeConstritor'], aliados: [ilvan], foes: [['goblin', { x: 3, y: 5 }]],
  });
  foes[0].hp = foes[0].maxHp = 80;
  resistenciasDao(enc, false);
  d20Fixo(enc, 18);
  assert.ok(enc.castSpell(ilvan, 'teia', { point: { x: 3, y: 5 } }).ok);
  assert.ok(hasCondition(foes[0], 'contido'), 'presa pela Teia');
  assert.ok(enc.castSpell(h, 'golpeConstritor').ok);
  enc.resolveAttack(h, foes[0], { weaponId: 'adaga' });
  assert.ok(hasCondition(foes[0], 'contido'), 'a Teia continua');
  assert.ok(hasCondition(foes[0], 'presoPorVinhas'), 'e as vinhas também');
  assert.equal(getCondition(foes[0], 'contido').source, `zona:${enc.zonas[0].id}`, 'a Teia não foi sobrescrita');
  // Derrubar a concentração do Constritor solta só as vinhas.
  enc.dropConcentration(h);
  assert.ok(!hasCondition(foes[0], 'presoPorVinhas'));
  assert.ok(hasCondition(foes[0], 'contido'), 'a Teia segura');
});

teste('Golpe Constritor no 2º círculo fere 2d6; resistir à vinha não prende', () => {
  const { enc, h, foes } = comHeroi('patrulheiro', 5, { magias: ['golpeConstritor'], foes: [['goblin', { x: 3, y: 5 }]] });
  foes[0].hp = foes[0].maxHp = 80;
  resistenciasDao(enc, false);
  d20Fixo(enc, 18);
  assert.ok(enc.castSpell(h, 'golpeConstritor', { circulo: 2 }).ok);
  enc.resolveAttack(h, foes[0], { weaponId: 'adaga' });
  assert.equal(getCondition(foes[0], 'presoPorVinhas').data.vinhas.dados, '2d6');
  const o = comHeroi('patrulheiro', 5, { magias: ['golpeConstritor'], foes: [['goblin', { x: 3, y: 5 }]] });
  o.foes[0].hp = o.foes[0].maxHp = 80;
  resistenciasDao(o.enc, true);
  d20Fixo(o.enc, 18);
  assert.ok(o.enc.castSpell(o.h, 'golpeConstritor').ok);
  o.enc.resolveAttack(o.h, o.foes[0], { weaponId: 'adaga' });
  assert.ok(!hasCondition(o.foes[0], 'presoPorVinhas'));
  assert.equal(o.h.concentrating, null);
});

teste('Névoa Obscurecente: ninguém vê dentro nem através, e não atrapalha o andar', () => {
  const { enc, party, foes, ilvan } = magoCom('nevoaObscurecente', { foes: [['goblin', { x: 5, y: 5 }]] });
  const dara = party[DARA];
  dara.pos = { x: 1, y: 5 };
  foes[0].pos = { x: 9, y: 5 };
  assert.equal(comoVe(enc, dara, foes[0].pos) > 0, true, 'sem névoa, vê');
  assert.ok(enc.castSpell(ilvan, 'nevoaObscurecente', { point: { x: 5, y: 5 } }).ok);
  assert.equal(enc.zonas[0].obscuro, 'pesada');
  assert.equal(comoVe(enc, dara, foes[0].pos), 0, 'a névoa está no meio da linha');
  const longe = party[PIP];
  longe.pos = { x: 11, y: 11 };
  assert.equal(comoVe(enc, longe, { x: 11, y: 6 }) > 0, true, 'fora da linha da névoa, vê');
  // Quem está dentro não vê nada, e o atacante às cegas fica com desvantagem.
  foes[0].pos = { x: 5, y: 5 };
  const mods = enc.attackModifiers(dara, foes[0], { ranged: true });
  assert.ok(mods.desvantagens.includes('alvo oculto no escuro'));
  assert.ok(mods.vantagens.includes('atacante oculto no escuro'));
  assert.equal(enc.field.dificeis.size, 0, 'não é terreno difícil');
  // A concentração cai e a névoa some.
  enc.dropConcentration(ilvan);
  assert.equal(comoVe(enc, dara, foes[0].pos) > 0, true);
});

teste('Névoa Obscurecente cresce com o círculo (+6 m de raio)', () => {
  const { enc, ilvan } = magoCom('nevoaObscurecente');
  const normal = enc.areaDaMagia(ilvan, getSpell('nevoaObscurecente'), { x: 6, y: 5 }, 1).length;
  const maior = enc.areaDaMagia(ilvan, getSpell('nevoaObscurecente'), { x: 6, y: 5 }, 2).length;
  assert.ok(maior > normal);
});

teste('Névoa Obscurecente: a área (e a prévia) pega o círculo escolhido: 81, 289 e 625 casas', () => {
  const ilvan = makeParty({ nivel: 5 })[ILVAN];
  ilvan.pos = { x: 2, y: 15 };
  const enc = new Encounter({
    battlefield: new Battlefield(30, 30, Array(30).fill('.'.repeat(30))), party: [ilvan],
    foes: [makeMonster('goblin', { x: 28, y: 28 })], rng: makeRng(1), onLog: () => {},
  });
  const nevoa = getSpell('nevoaObscurecente');
  const ponto = { x: 15, y: 15 };
  assert.equal(enc.areaDaMagia(ilvan, nevoa, ponto).length, 81);
  assert.equal(enc.areaDaMagia(ilvan, nevoa, ponto, 1).length, 81);
  assert.equal(enc.areaDaMagia(ilvan, nevoa, ponto, 2).length, 289);
  assert.equal(enc.areaDaMagia(ilvan, nevoa, ponto, 3).length, 625);
});

teste('Escuridão contorna esquinas: uma parede segura a esfera', () => {
  assert.equal(getSpell('escuridao').contornaEsquinas, true);
  const mapa = Array(12).fill('............');
  mapa[5] = '.....#......';
  mapa[4] = '.....#......';
  mapa[6] = '.....#......';
  const ilvan = makeParty({ nivel: 5 })[ILVAN];
  ilvan.pos = { x: 1, y: 1 };
  const enc = new Encounter({ battlefield: new Battlefield(12, 12, mapa), party: [ilvan], foes: [makeMonster('goblin', { x: 11, y: 11 })], rng: makeRng(1), onLog: () => {} });
  const casas = enc.areaDaMagia(ilvan, getSpell('escuridao'), { x: 4, y: 5 });
  assert.ok(casas.length > 0);
  const livre = new Encounter({ battlefield: new Battlefield(12, 12, MAPA), party: [ilvan], foes: [makeMonster('goblin', { x: 11, y: 11 })], rng: makeRng(1), onLog: () => {} });
  assert.ok(casas.length < livre.areaDaMagia(ilvan, getSpell('escuridao'), { x: 4, y: 5 }).length, 'a parede corta parte da esfera');
});

teste('Escuridão: a visão no escuro não enxerga dentro, mas quem está dentro vê fora', () => {
  const { enc, party, foes, ilvan } = magoCom('escuridao', { foes: [['goblin', { x: 6, y: 5 }]] });
  const dara = party[DARA];
  dara.pos = { x: 2, y: 5 };
  dara.visaoNoEscuro = 60;
  foes[0].pos = { x: 6, y: 5 };
  assert.equal(comoVe(enc, dara, foes[0].pos) > 0, true, 'sem a magia, vê');
  ilvan.pos = { x: 2, y: 8 };
  assert.ok(enc.castSpell(ilvan, 'escuridao', { point: { x: 6, y: 5 } }).ok);
  assert.equal(enc.zonas[0].obscuro, 'magica');
  assert.equal(comoVe(enc, dara, foes[0].pos), 0, 'nem a visão no escuro');
  assert.equal(comoVe(enc, foes[0], dara.pos) > 0, true, 'de dentro, vê quem está fora na luz');
  assert.ok(enc.attackModifiers(dara, foes[0]).desvantagens.includes('alvo oculto no escuro'));
  assert.equal(enc.field.dificeis.size, 0);
});

teste('Lufada de Vento (regra da casa): empurra 4,5 m ao longo da linha ao conjurar e de novo a cada ação bônus gasta', () => {
  const { enc, h, foes } = comHeroi('druida', 5, {
    magias: ['lufadaDeVento'], foes: [['goblin', { x: 5, y: 5 }], ['goblin', { x: 6, y: 6 }], ['goblin', { x: 5, y: 9 }]],
  });
  foes.forEach((f) => { f.hp = f.maxHp = 60; });
  resistenciasDao(enc, false);
  assert.ok(enc.castSpell(h, 'lufadaDeVento', { point: { x: 9, y: 5 } }).ok);
  assert.equal(foes[0].pos.x, 8, 'na linha: 3 casas para o leste');
  assert.equal(foes[1].pos.x, 9, 'na casa ao lado da linha também');
  assert.equal(foes[2].pos.x, 5, 'fora da linha, fica');
  assert.equal(h.concentrating?.spellId, 'lufadaDeVento', 'a concentração segura sem ninguém preso');
  // Regra da casa (o livro empurra só quem começa o turno na linha): cada ação
  // bônus gasta na magia empurra de novo, sem espaço.
  const espacos = h.spellcasting.slots[2];
  assert.ok(enc.castSpell(h, 'lufadaDeVento', { point: { x: 9, y: 5 } }).ok);
  assert.ok(foes[0].pos.x > 8);
  assert.equal(h.spellcasting.slots[2], espacos);
  assert.equal(h.bonusUsed, true);
  assert.equal(enc.canCast(h, 'lufadaDeVento', { point: { x: 9, y: 5 } }).ok, false, 'só uma ação bônus por turno');
});

teste('Lufada de Vento: quem passa na resistência de FOR fica onde está', () => {
  const { enc, h, foes } = comHeroi('druida', 5, { magias: ['lufadaDeVento'], foes: [['goblin', { x: 5, y: 5 }]] });
  resistenciasDao(enc, true);
  assert.ok(enc.castSpell(h, 'lufadaDeVento', { point: { x: 9, y: 5 } }).ok);
  assert.equal(foes[0].pos.x, 5);
});

teste('Fome de Hadar: frio no começo do turno, ácido no fim, escuridão mágica e terreno difícil', () => {
  const { enc, h, foes, log } = comHeroi('bruxo', 5, { magias: ['fomeDeHadar'], foes: [['goblin', { x: 8, y: 5 }]] });
  foes[0].hp = foes[0].maxHp = 200;
  assert.ok(enc.castSpell(h, 'fomeDeHadar', { point: { x: 8, y: 5 } }).ok);
  const z = enc.zonas[0];
  assert.equal(z.obscuro, 'magica');
  assert.ok(enc.field.dificeis.has('8,5'), 'terreno difícil');
  assert.equal(comoVe(enc, h, foes[0].pos), 0, 'escuridão mágica');
  enc.fimDoTurnoDoLado('party');
  const inicio = foes[0].hp;
  enc.beginSide('foes');
  assert.ok(foes[0].hp < inicio, 'frio no começo do turno');
  assert.ok(log.some((e) => /sofre \d+ de frio\./.test(e.text) && /Fome de Hadar/.test(e.text)));
  resistenciasDao(enc, false);
  const meio = foes[0].hp;
  enc.fimDoTurnoDoLado('foes');
  assert.ok(foes[0].hp < meio, 'ácido no fim do turno');
  assert.ok(log.some((e) => /termina o turno na Fome de Hadar e sofre \d+ de ácido/.test(e.text)));
});

teste('Fome de Hadar: passar na resistência de DES livra do ácido; círculo maior não soma dados (o livro não tem)', () => {
  const { enc, h, foes } = comHeroi('bruxo', 5, { magias: ['fomeDeHadar'], foes: [['goblin', { x: 8, y: 5 }]] });
  foes[0].hp = foes[0].maxHp = 200;
  assert.ok(enc.castSpell(h, 'fomeDeHadar', { point: { x: 8, y: 5 } }).ok);
  resistenciasDao(enc, true);
  const antes = foes[0].hp;
  enc.fimDoTurnoDoLado('foes');
  assert.equal(foes[0].hp, antes);
  const alto = comHeroi('bruxo', 7, { magias: ['fomeDeHadar'], foes: [['goblin', { x: 8, y: 5 }]] });
  assert.ok(alto.enc.castSpell(alto.h, 'fomeDeHadar', { point: { x: 8, y: 5 }, circulo: 4 }).ok);
  assert.equal(getSpell('fomeDeHadar').upcast, undefined);
  assert.equal(alto.enc.zonas[0].dano.dados, '2d6');
  assert.equal(alto.enc.zonas[0].fimDano.dados, '2d6');
});

teste('Convocar Relâmpagos: raio de 1,5 m e, nos turnos seguintes, outro raio com a ação, sem espaço', () => {
  const { enc, h, foes } = comHeroi('druida', 5, {
    magias: ['convocarRelampagos'], foes: [['goblin', { x: 7, y: 5 }], ['goblin', { x: 7, y: 6 }], ['goblin', { x: 10, y: 10 }]],
  });
  foes.forEach((f) => { f.hp = f.maxHp = 100; });
  resistenciasDao(enc, false);
  assert.ok(enc.castSpell(h, 'convocarRelampagos', { point: { x: 7, y: 5 } }).ok);
  assert.ok(foes[0].hp < 100 && foes[1].hp < 100, 'os dois no raio de 1,5 m');
  assert.equal(foes[2].hp, 100, 'fora do raio');
  assert.equal(h.concentrating?.spellId, 'convocarRelampagos');
  assert.equal(enc.canCast(h, 'convocarRelampagos', { point: { x: 7, y: 5 } }).ok, false, 'a ação já foi usada');
  const espacos = h.spellcasting.slots[3];
  enc.fimDoTurnoDoLado('party');
  enc.beginSide('foes');
  enc.fimDoTurnoDoLado('foes');
  enc.beginSide('party');
  const antes = foes[2].hp;
  assert.ok(enc.castSpell(h, 'convocarRelampagos', { point: { x: 10, y: 10 } }).ok);
  assert.ok(foes[2].hp < antes, 'um raio novo, noutro ponto');
  assert.equal(h.spellcasting.slots[3], espacos, 'sem gastar espaço');
  // Alcance de 36 m: 120 pés.
  enc.beginSide('foes');
  enc.beginSide('party');
  assert.equal(enc.canCast(h, 'convocarRelampagos', { point: { x: 11, y: 11 } }).ok, true);
});

teste('Convocar Relâmpagos: alcance de 36 m (120 pés) vale, 125 pés é recusado', () => {
  const h = criarPersonagem({
    ...BASE(), id: 'h', name: 'Herói', abilities: { str: 14, dex: 14, con: 14, int: 16, wis: 16, cha: 16 },
  }, { classe: 'druida', nivel: 5 });
  h.pos = { x: 2, y: 5 };
  h.spellcasting.prepared = [...(h.spellcasting.prepared ?? []), 'convocarRelampagos'];
  const enc = new Encounter({
    battlefield: new Battlefield(40, 12, Array(12).fill('.'.repeat(40))), party: [h],
    foes: [makeMonster('goblin', { x: 30, y: 10 })], rng: makeRng(1), onLog: () => {},
  });
  enc.firstSide = 'party';
  enc.round = 1;
  enc.beginSide('party');
  assert.equal(enc.canCast(h, 'convocarRelampagos', { point: { x: 26, y: 5 } }).ok, true, '24 casas = 120 pés');
  const longe = enc.canCast(h, 'convocarRelampagos', { point: { x: 27, y: 5 } });
  assert.equal(longe.ok, false, '25 casas = 125 pés');
  assert.match(longe.why, /alcance/);
});

teste('Convocar Relâmpagos no 4º círculo rola 4d10', () => {
  assert.equal(dadosDaMagia(getSpell('convocarRelampagos'), { circulo: 4 }), '4d10');
});

teste('Flecha Relampejante: o ataque vira raio no alvo e explode em quem está a 3 m', () => {
  const { enc, h, foes, log } = comHeroi('patrulheiro', 9, {
    magias: ['flechaRelampago'],
    foes: [['ogro', { x: 6, y: 5 }], ['goblin', { x: 8, y: 5 }], ['goblin', { x: 11, y: 11 }]],
  });
  foes.forEach((f) => { f.hp = f.maxHp = 300; });
  resistenciasDao(enc, false);
  d20Fixo(enc, 18);
  assert.ok(enc.castSpell(h, 'flechaRelampago').ok);
  assert.ok(hasCondition(h, 'flechaRelampago'));
  h.equippedWeapon = 'arcoLongo';   // só se atira com o arco na mão
  enc.resolveAttack(h, foes[0], { weaponId: 'arcoLongo' });
  assert.ok(log.some((e) => /acerta .* com .*: \d+ de dano elétrico/.test(e.text)), log.slice(-6).map((e) => e.text).join(' | '));
  assert.ok(foes[0].hp <= 300 - 4, '4d8 no alvo');
  assert.ok(foes[1].hp < 300, 'o goblin a 3 m levou a explosão');
  assert.equal(foes[2].hp, 300, 'o longe não');
  assert.ok(!hasCondition(h, 'flechaRelampago'));
  assert.equal(h.concentrating, null);
});

teste('Flecha Relampejante: 4d8 puro no alvo (sem modificador), que não entra na explosão', () => {
  const { enc, h, foes } = comHeroi('patrulheiro', 9, {
    magias: ['flechaRelampago'], foes: [['ogro', { x: 6, y: 5 }], ['goblin', { x: 8, y: 5 }]],
  });
  foes.forEach((f) => { f.hp = f.maxHp = 300; });
  resistenciasDao(enc, false);
  d20Fixo(enc, 18);
  const die = enc.rng.die.bind(enc.rng);
  enc.rng.die = (lados) => (lados === 8 ? 5 : die(lados));
  const golpes = [];
  const aplicar = enc.applyDamage.bind(enc);
  enc.applyDamage = (c, n, tipo, ...r) => { golpes.push([c, n, tipo]); return aplicar(c, n, tipo, ...r); };
  assert.ok(enc.castSpell(h, 'flechaRelampago').ok);
  h.equippedWeapon = 'arcoLongo';   // só se atira com o arco na mão
  enc.resolveAttack(h, foes[0], { weaponId: 'arcoLongo' });
  const noAlvo = golpes.filter(([c]) => c === foes[0]);
  assert.equal(noAlvo.length, 1, 'o alvo leva um dano só: não entra na explosão');
  assert.equal(noAlvo[0][1], 20, '4d8 (5 em cada) e nenhum modificador somado');
  assert.equal(noAlvo[0][2], 'elétrico');
  assert.equal(foes[0].hp, 280);
  assert.equal(foes[1].hp, 290, 'o goblin a 3 m leva 2d8 cheios na explosão (falhou)');
});

teste('Flecha Relampejante: errando, o alvo leva exatamente metade de 4d8', () => {
  const { enc, h, foes } = comHeroi('patrulheiro', 9, { magias: ['flechaRelampago'], foes: [['ogro', { x: 6, y: 5 }]] });
  foes[0].hp = foes[0].maxHp = 300;
  resistenciasDao(enc, false);
  d20Fixo(enc, 1);
  const die = enc.rng.die.bind(enc.rng);
  enc.rng.die = (lados) => (lados === 8 ? 5 : die(lados));
  assert.ok(enc.castSpell(h, 'flechaRelampago').ok);
  h.equippedWeapon = 'arcoLongo';   // só se atira com o arco na mão
  enc.resolveAttack(h, foes[0], { weaponId: 'arcoLongo' });
  assert.equal(foes[0].hp, 290, 'metade de 20');
});

teste('Flecha Relampejante: errando, o alvo leva metade e a explosão sai igual; cada dano é uma fonte', () => {
  const { enc, h, foes } = comHeroi('patrulheiro', 9, {
    magias: ['flechaRelampago'], foes: [['ogro', { x: 6, y: 5 }], ['goblin', { x: 8, y: 5 }]],
  });
  foes.forEach((f) => { f.hp = f.maxHp = 300; });
  foes[1].concentrating = { spellId: 'raioDeBruxa', condition: null, targets: [], rounds: 10 };
  const testes = [];
  enc.concentrationCheck = (c, dano) => { if (c === foes[1]) testes.push(dano); };
  resistenciasDao(enc, false);
  d20Fixo(enc, 1);
  assert.ok(enc.castSpell(h, 'flechaRelampago').ok);
  h.equippedWeapon = 'arcoLongo';   // só se atira com o arco na mão
  enc.resolveAttack(h, foes[0], { weaponId: 'arcoLongo' });
  assert.ok(foes[0].hp < 300, 'metade do raio mesmo errando');
  assert.ok(foes[0].hp >= 300 - 16, 'só metade de 4d8');
  assert.ok(foes[1].hp < 300, 'explosão sai errando também');
  assert.equal(testes.length, 1);
  assert.equal(enc.dadosDaFlecha({ data: { circulo: 4 } }).alvo, '5d8');
  assert.equal(enc.dadosDaFlecha({ data: { circulo: 4 } }).explosao, '3d8');
});

teste('Flecha Relampejante só se gasta num ataque à distância', () => {
  const { enc, h, foes } = comHeroi('patrulheiro', 9, { magias: ['flechaRelampago'], foes: [['goblin', { x: 3, y: 5 }]] });
  foes[0].hp = foes[0].maxHp = 300;
  d20Fixo(enc, 18);
  assert.ok(enc.castSpell(h, 'flechaRelampago').ok);
  enc.resolveAttack(h, foes[0], { weaponId: 'adaga' });
  assert.ok(hasCondition(h, 'flechaRelampago'), 'a adaga não gasta');
});

teste('Dissipar Magia: acaba com a magia da criatura e solta a concentração de quem a mantinha', () => {
  const { enc, party, foes } = montar({ nivel: 5, foes: [['goblin', { x: 6, y: 5 }]] });
  const [brenn, ilvan] = [party[BRENN], party[ILVAN]];
  ilvan.spellcasting.prepared.push('imobilizarPessoa');
  ilvan.spellcasting.livro.push('imobilizarPessoa');
  brenn.spellcasting.prepared.push('dissiparMagia');
  resistenciasDao(enc, false);
  assert.ok(enc.castSpell(ilvan, 'imobilizarPessoa', { targets: [foes[0]] }).ok);
  assert.ok(hasCondition(foes[0], 'paralisado'));
  assert.ok(enc.castSpell(brenn, 'dissiparMagia', { target: foes[0] }).ok);
  assert.ok(!hasCondition(foes[0], 'paralisado'));
  assert.equal(ilvan.concentrating, null);
});

teste('Dissipar Magia em aliado: tira a Armadura Arcana (círculo 1) e devolve a CA', () => {
  const { enc, party } = montar({ nivel: 5, foes: [['goblin', { x: 10, y: 10 }]] });
  const [brenn, ilvan] = [party[BRENN], party[ILVAN]];
  brenn.spellcasting.prepared.push('dissiparMagia');
  const caSem = ilvan.ac;
  assert.ok(enc.castSpell(ilvan, 'armaduraArcana', { target: ilvan }).ok);
  assert.ok(ilvan.armaduraArcana);
  assert.ok(ilvan.ac > caSem, 'a armadura subiu a CA');
  const r = enc.castSpell(brenn, 'dissiparMagia', { target: ilvan });
  assert.ok(r.ok, r.why);
  assert.ok(!ilvan.armaduraArcana);
  assert.equal(ilvan.ac, caSem);
});

teste('Dissipar Magia: Sono, Borrifo de Cores e Ataque Certeiro carregam o círculo do espaço usado', () => {
  const { enc, party, foes } = montar({ nivel: 5, foes: [['goblin', { x: 6, y: 5 }]] });
  const [brenn, ilvan] = [party[BRENN], party[ILVAN]];
  brenn.spellcasting.prepared.push('dissiparMagia');
  resistenciasDao(enc, false);
  foes[0].hp = foes[0].maxHp = 1;
  assert.ok(enc.castSpell(ilvan, 'sono', { point: { x: 6, y: 5 }, circulo: 3 }).ok);
  const dorme = getCondition(foes[0], 'inconsciente');
  assert.equal(dorme?.magia?.id, 'sono');
  assert.equal(dorme.magia.circulo, 3, 'o espaço usado, não o círculo da magia');
  assert.ok(enc.castSpell(brenn, 'dissiparMagia', { target: foes[0] }).ok);
  assert.ok(!hasCondition(foes[0], 'inconsciente'), 'Dissipar acorda quem o Sono derrubou');
});

teste('Dissipar Magia numa zona: ela se desfaz e solta quem prendia', () => {
  const { enc, party, foes } = montar({ nivel: 5, foes: [['goblin', { x: 8, y: 8 }]] });
  const [brenn, ilvan] = [party[BRENN], party[ILVAN]];
  ilvan.spellcasting.prepared.push('teia');
  ilvan.spellcasting.livro.push('teia');
  brenn.spellcasting.prepared.push('dissiparMagia');
  resistenciasDao(enc, false);
  assert.ok(enc.castSpell(ilvan, 'teia', { point: { x: 8, y: 8 } }).ok);
  assert.ok(hasCondition(foes[0], 'contido'));
  assert.equal(enc.canCast(brenn, 'dissiparMagia', { point: { x: 1, y: 1 } }).ok, false, 'casa sem zona');
  assert.ok(enc.castSpell(brenn, 'dissiparMagia', { point: { x: 8, y: 8 } }).ok);
  assert.equal(enc.zonas.length, 0);
  assert.ok(!hasCondition(foes[0], 'contido'));
  assert.equal(ilvan.concentrating, null);
});

teste('Dissipar Magia de círculo maior que o espaço pede teste de atributo', () => {
  const alta = () => {
    const r = montar({ nivel: 5, foes: [['goblin', { x: 6, y: 5 }]] });
    r.party[BRENN].spellcasting.prepared.push('dissiparMagia');
    addCondition(r.foes[0], 'rogado', { source: r.party[ILVAN].id, magia: { id: 'rogarMaldicao', circulo: 5 } });
    return r;
  };
  const falha = alta();
  d20Fixo(falha.enc, 1);
  assert.ok(falha.enc.castSpell(falha.party[BRENN], 'dissiparMagia', { target: falha.foes[0] }).ok);
  assert.ok(hasCondition(falha.foes[0], 'rogado'), 'd20 baixo: a magia de 5º círculo resiste');
  const passa = alta();
  d20Fixo(passa.enc, 20);
  assert.ok(passa.enc.castSpell(passa.party[BRENN], 'dissiparMagia', { target: passa.foes[0] }).ok);
  assert.ok(!hasCondition(passa.foes[0], 'rogado'));
});

teste('as 9 magias novas estão na lista das classes certas', () => {
  const ids = {
    dueloCompelido: 'paladino', golpeConstritor: 'patrulheiro', nevoaObscurecente: 'druida', escuridao: 'feiticeiro',
    lufadaDeVento: 'druida', fomeDeHadar: 'bruxo', convocarRelampagos: 'druida', flechaRelampago: 'patrulheiro',
    dissiparMagia: 'clerigo',
  };
  for (const [id, classe] of Object.entries(ids)) {
    assert.ok(SPELLS[id], id);
    assert.ok(listaDaClasse(classe, 3).magias.includes(id), `${id} em ${classe}`);
  }
  assert.ok(!listaDaClasse('druida', 1).magias.includes('convocarRelampagos'), 'o 1º nível não vê o 3º círculo');
});

// ---- lote 10: Luz, Orientação, Silêncio, Aumentar/Reduzir, Elo, Coroa, Calma, Oração, Muralha ----

const daraEm = (x, y) => {
  const d = makeParty({ nivel: 2 })[DARA];
  d.pos = { x, y };
  return d;
};

teste('Luz: o aliado vira fonte de luz e a escuridão recua; conjurar noutro passa a luz', () => {
  const dara = daraEm(2, 6);
  const pip = makeParty({ nivel: 2 })[PIP];
  pip.pos = { x: 1, y: 5 };
  const { enc, h } = comHeroi('clerigo', 3, { truques: ['luz'], aliados: [dara, pip], foes: [['goblin', { x: 10, y: 10 }]] });
  enc.field.luz = new Array(144).fill(0);
  const longe = { x: 2, y: 9 };
  assert.equal(comoVe(enc, h, longe), 0, 'no breu, sem luz, não se vê');
  assert.ok(enc.castSpell(h, 'luz', { targets: [dara] }).ok);
  assert.ok(hasCondition(dara, 'luzMagica'));
  assert.ok(comoVe(enc, h, longe) > 0, 'a 4,5 m da Dara acesa, a casa está iluminada');
  h.actionUsed = false;
  assert.ok(enc.castSpell(h, 'luz', { targets: [pip] }).ok);
  assert.ok(hasCondition(pip, 'luzMagica') && !hasCondition(dara, 'luzMagica'), 'a luz mudou de dono');
  assert.equal(h.spellcasting.slots[1], h.spellcasting.slotsMax[1], 'truque não gasta espaço');
});

teste('Orientação: soma 1d4 no próximo teste de atributo e acaba', () => {
  const tenta = (comMagia) => {
    const dara = daraEm(2, 6);
    const { enc, h } = comHeroi('clerigo', 3, { truques: ['orientacao'], aliados: [dara], foes: [['goblin', { x: 10, y: 10 }]] });
    const bonus = skillBonus(dara, 'atletismo');
    addCondition(dara, 'agarrado', { data: { escape: 10 + bonus + 2 } });
    const die = enc.rng.die.bind(enc.rng);
    enc.rng.die = (l) => (l === 20 ? 10 : l === 4 ? 4 : die(l));
    if (comMagia) assert.ok(enc.castSpell(h, 'orientacao', { targets: [dara] }).ok);
    enc.escapar(dara);
    return { dara, h };
  };
  const sem = tenta(false);
  assert.ok(hasCondition(sem.dara, 'agarrado'), 'sem Orientação: 10 + bônus não chega à CD');
  const com = tenta(true);
  assert.ok(!hasCondition(com.dara, 'agarrado'), 'com Orientação: o 1d4 (4) chega');
  assert.ok(!hasCondition(com.dara, 'orientado'), 'o dado vale um teste só');
  assert.equal(com.h.concentrating, null, 'a magia acaba e solta a concentração');
});

teste('Silêncio: quem está na zona não conjura e é imune a trovejante; fora, nada muda', () => {
  const { enc, h, foes } = comHeroi('clerigo', 3, { truques: ['chamaSagrada'], magias: ['silencio'], foes: [['goblin', { x: 3, y: 5 }]] });
  const fora = { x: 11, y: 11 };
  assert.ok(enc.castSpell(h, 'silencio', { point: { x: 2, y: 5 } }).ok);
  assert.ok(enc.zonasEm(h.pos).some((z) => z.silencio));
  assert.ok(enc.zonasEm(foes[0].pos).some((z) => z.silencio));
  h.actionUsed = false;
  const c = enc.canCast(h, 'chamaSagrada', { target: foes[0] });
  assert.equal(c.ok, false);
  assert.match(c.why, /Silêncio/);
  const antes = h.hp;
  enc.applyDamage(h, 6, 'trovejante', foes[0], { magico: true });
  assert.equal(h.hp, antes, 'trovejante não faz nada dentro do Silêncio');
  enc.applyDamage(h, 3, 'cortante', foes[0]);
  assert.equal(h.hp, antes - 3, 'outro dano segue normal');
  assert.equal(enc.zonasEm(fora).length, 0);
  enc.dropConcentration(h);
  assert.equal(enc.zonasEm(h.pos).length, 0, 'sem a concentração, o Silêncio se desfaz');
  assert.equal(enc.canCast(h, 'chamaSagrada', { target: foes[0] }).ok, true);
});

teste('Aumentar: +1d4 no dano de arma e vantagem em Força; Reduzir tira 1d4 (nunca abaixo de 1) e dá desvantagem', () => {
  const dara = daraEm(3, 6);
  const { enc, h, foes } = comHeroi('mago', 5, { magias: ['aumentarReduzir'], aliados: [dara], foes: [['goblin', { x: 3, y: 5 }]] });
  const goblin = foes[0];
  goblin.maxHp = goblin.hp = 200;
  d20Fixo(enc, 20);
  const sem = enc.resolveAttack(dara, goblin);
  assert.ok(!sem.danoPartes.some((p) => p.rotulo === 'aumentar'));
  assert.ok(enc.castSpell(h, 'aumentarReduzir', { target: dara }).ok);
  assert.ok(hasCondition(dara, 'aumentado'));
  const com = enc.resolveAttack(dara, goblin);
  const extra = com.danoPartes.find((p) => p.rotulo === 'aumentar');
  assert.ok(extra && extra.total >= 2, 'crítico: 2d4 a mais');
  assert.equal(com.damage, com.danoPartes.reduce((a, p) => a + p.total, 0));
  assert.equal(enc.resistencia(dara, 'str', 5).rolls.length, 2, 'vantagem em resistência de Força');
  assert.equal(enc.resistencia(dara, 'dex', 5).rolls.length, 1, 'só Força');
  // Reduzir: o goblin falha na CON e encolhe.
  h.actionUsed = false;
  resistenciasDao(enc, false);
  assert.ok(enc.castSpell(h, 'aumentarReduzir', { target: goblin }).ok, 'conjurar de novo troca o alvo da concentração');
  assert.ok(hasCondition(goblin, 'reduzido') && !hasCondition(dara, 'aumentado'));
  assert.equal(enc.resistencia(goblin, 'str', 5).rolls.length, 2, 'desvantagem também rola dois dados');
  const dano = enc.resolveAttack(goblin, dara, { weaponId: 'Cimitarra' });
  const menos = dano.danoPartes.find((p) => p.rotulo === 'reduzir');
  assert.ok(menos && menos.total < 0);
  assert.ok(dano.damage >= 1, 'o golpe nunca fica abaixo de 1');
});

teste('Reduzir: quem passa na CON não encolhe e a concentração não fica de pé', () => {
  const { enc, h, foes } = comHeroi('mago', 5, { magias: ['aumentarReduzir'], foes: [['goblin', { x: 3, y: 5 }]] });
  resistenciasDao(enc, true);
  assert.ok(enc.castSpell(h, 'aumentarReduzir', { target: foes[0] }).ok);
  assert.ok(!hasCondition(foes[0], 'reduzido'));
  assert.equal(h.concentrating, null);
});

teste('Elo de Proteção: +1 de CA, resistência a todo dano e o conjurador sofre o mesmo; acaba se ele cai', () => {
  const dara = daraEm(2, 6);
  const { enc, h, foes } = comHeroi('clerigo', 5, { magias: ['eloDeProtecao'], aliados: [dara], foes: [['goblin', { x: 3, y: 5 }]] });
  const ca = caEfetiva(dara);
  assert.equal(enc.castSpell(h, 'eloDeProtecao', { target: h }).ok, false, 'não vale em si mesmo');
  assert.ok(enc.castSpell(h, 'eloDeProtecao', { targets: [dara] }).ok);
  assert.equal(caEfetiva(dara), ca + 1);
  assert.equal(h.concentrating, null, 'sem concentração');
  const [hd, hh] = [dara.hp, h.hp];
  enc.applyDamage(dara, 10, 'cortante', foes[0]);
  assert.equal(dara.hp, hd - 5, 'resistência a todo dano: metade');
  assert.equal(h.hp, hh - 5, 'o conjurador sofre o mesmo');
  // Conjurador a 0 PV: o elo se desfaz e o protegido apanha sozinho (com a resistência que sobra: nenhuma).
  h.hp = 0;
  enc.applyDamage(dara, 4, 'cortante', foes[0]);
  assert.ok(!hasCondition(dara, 'eloDeProtecao'));
  assert.equal(dara.hp, hd - 9, 'o dano de agora vem inteiro depois de o elo cair');
});

teste('Elo de Proteção: acaba quando os dois ficam a mais de 18 m', () => {
  const dara = daraEm(2, 6);
  const { enc, h, foes } = comHeroi('clerigo', 5, { magias: ['eloDeProtecao'], aliados: [dara], foes: [['goblin', { x: 3, y: 5 }]] });
  enc.field = new Battlefield(20, 12, Array(12).fill('.'.repeat(20)));
  assert.ok(enc.castSpell(h, 'eloDeProtecao', { targets: [dara] }).ok);
  dara.pos = { x: 18, y: 6 };
  const hh = h.hp;
  enc.applyDamage(dara, 8, 'cortante', foes[0]);
  assert.ok(!hasCondition(dara, 'eloDeProtecao'));
  assert.equal(h.hp, hh, 'longe demais, o conjurador não sente');
});

teste('Coroa da Loucura: o enfeitiçado ataca o aliado dele, e a ação do conjurador a mantém', () => {
  const { enc, h, foes } = comHeroi('mago', 5, {
    magias: ['coroaDaLoucura'], foes: [['goblin', { x: 6, y: 5 }], ['goblin', { x: 7, y: 5 }]],
  });
  const [a, b] = foes;
  const controle = comHeroi('mago', 5, { foes: [['goblin', { x: 6, y: 5 }], ['goblin', { x: 7, y: 5 }]] });
  d20Fixo(controle.enc, 20);
  controle.enc.beginSide('foes');
  takeMonsterTurn(controle.enc, controle.foes[0]);
  assert.equal(controle.foes[1].hp, controle.foes[1].maxHp, 'sem a coroa, o goblin não bate no amigo');

  d20Fixo(enc, 20);
  resistenciasDao(enc, false);
  assert.ok(enc.castSpell(h, 'coroaDaLoucura', { targets: [a] }).ok);
  assert.ok(hasCondition(a, 'coroaDaLoucura'));
  // A coroa pede a ação a cada turno: sem ela, cai no fim do turno.
  enc.fimDoTurnoDoLado('party');
  assert.ok(h.concentrating, 'no turno em que foi conjurada, a ação já foi gasta');
  enc.beginSide('foes');
  const hpH = h.hp;
  takeMonsterTurn(enc, a);
  assert.ok(b.hp < b.maxHp, 'bateu no aliado');
  assert.equal(h.hp, hpH, 'o herói não foi tocado');
  enc.beginSide('party');
  assert.ok(enc.castSpell(h, 'coroaDaLoucura', { target: a }).ok, 'mantida com a ação, sem espaço');
  assert.equal(h.spellcasting.slots[2], h.spellcasting.slotsMax[2] - 1, 'só o espaço da primeira vez');
  enc.fimDoTurnoDoLado('party');
  assert.ok(h.concentrating && hasCondition(a, 'coroaDaLoucura'));
  enc.beginSide('foes');
  enc.beginSide('party');
  enc.fimDoTurnoDoLado('party');
  assert.equal(h.concentrating, null, 'sem a ação, a coroa cai');
  assert.ok(!hasCondition(a, 'coroaDaLoucura'));
});

teste('Coroa da Loucura: sem aliado perto o enfeitiçado age normal', () => {
  const { enc, h, foes } = comHeroi('mago', 5, { magias: ['coroaDaLoucura'], foes: [['goblin', { x: 3, y: 5 }]] });
  d20Fixo(enc, 20);
  resistenciasDao(enc, false);
  assert.ok(enc.castSpell(h, 'coroaDaLoucura', { targets: [foes[0]] }).ok);
  enc.fimDoTurnoDoLado('party');
  enc.beginSide('foes');
  const antes = h.hp;
  takeMonsterTurn(enc, foes[0]);
  assert.ok(h.hp < antes, 'o único alvo possível é o herói');
});

teste('Acalmar Emoções: suprime medo e encanto, ou deixa o inimigo indiferente até o perigo ser real', () => {
  const { enc, h, foes } = comHeroi('clerigo', 5, {
    magias: ['acalmarEmocoes'], foes: [['goblin', { x: 5, y: 5 }], ['goblin', { x: 6, y: 5 }]],
  });
  const [medroso, quieto] = foes;
  addCondition(medroso, 'amedrontado', { source: h.id });
  resistenciasDao(enc, false);
  assert.ok(enc.castSpell(h, 'acalmarEmocoes', { point: { x: 5, y: 5 } }).ok);
  assert.ok(!hasCondition(medroso, 'amedrontado'), 'o medo passa');
  assert.equal(getCondition(medroso, 'calmo').data.modo, 'suprime');
  assert.equal(enc.imuneACondicao(medroso, 'amedrontado'), true, 'e não volta enquanto durar');
  assert.equal(getCondition(quieto, 'calmo').data.modo, 'indiferente');
  d20Fixo(enc, 20);
  enc.beginSide('foes');
  const hp = h.hp;
  takeMonsterTurn(enc, quieto);
  assert.equal(h.hp, hp, 'o indiferente não ataca');
  // Um inimigo fere o amigo dele: a indiferença acaba.
  enc.applyDamage(medroso, 1, 'cortante', h);
  assert.ok(!hasCondition(quieto, 'calmo'), 'ver o amigo ferido acorda a indiferença');
});

teste('Acalmar Emoções: quem passa na CAR segue como estava', () => {
  const { enc, h, foes } = comHeroi('clerigo', 5, { magias: ['acalmarEmocoes'], foes: [['goblin', { x: 5, y: 5 }]] });
  resistenciasDao(enc, true);
  assert.ok(enc.castSpell(h, 'acalmarEmocoes', { point: { x: 5, y: 5 } }).ok);
  assert.ok(!hasCondition(foes[0], 'calmo'));
  assert.equal(h.concentrating, null);
});

teste('Oração de Cura: o combate recusa; no descanso cura até 6 com 2d8 + modificador e gasta um espaço', () => {
  const aliados = [daraEm(2, 6), daraEm(2, 7)];
  const { enc, h } = comHeroi('clerigo', 5, { magias: ['oracaoDeCura'], aliados, foes: [['goblin', { x: 10, y: 10 }]] });
  const c = enc.canCast(h, 'oracaoDeCura');
  assert.equal(c.ok, false);
  assert.match(c.why, /10 minutos/);
  for (const a of aliados) a.hp = 1;
  h.hp = 1;
  const espacos = h.spellcasting.slots[2];
  const r = oracaoDeCura(makeRng(7), h, [h, ...aliados]);
  assert.ok(r.ok);
  assert.equal(h.spellcasting.slots[2], espacos - 1);
  assert.ok(r.curas.every((x) => x.cura >= 1), 'cada um cura pelo menos 1');
  assert.ok(aliados.every((a) => a.hp > 1));
  assert.equal(oracaoDeCura(makeRng(7), h, Array(7).fill(aliados[0])).ok, true, 'o mesmo alvo repetido conta uma vez');
  const sete = [h, ...aliados, ...[1, 2, 3, 4].map((i) => daraEm(i, 0))];
  assert.equal(oracaoDeCura(makeRng(7), h, sete).ok, false, 'até 6 criaturas');
});

teste('Muralha de Vento: dano ao surgir, e o projétil de arma que a cruza erra sozinho', () => {
  const { enc, h, foes } = comHeroi('druida', 5, {
    magias: ['muralhaDeVento'], pos: { x: 2, y: 5 },
    foes: [['goblin', { x: 4, y: 6 }], ['goblinArqueiro', { x: 8, y: 5 }]],
  });
  const [no_muro, arqueiro] = foes;
  no_muro.maxHp = no_muro.hp = 200;
  const casas = enc.areaDaMagia(h, getSpell('muralhaDeVento'), { x: 4, y: 5 });
  assert.equal(casas.length, 10, 'dez casas, 15 m');
  assert.ok(casas.every((q) => q.x === 4), 'de través para o conjurador');
  d20Fixo(enc, 20);
  const livre = enc.resolveAttack(arqueiro, h, { weaponId: 'Arco curto' });
  assert.equal(livre.hit, true, 'sem muralha o 20 natural acerta');
  const hp = no_muro.hp;
  resistenciasDao(enc, false);
  assert.ok(enc.castSpell(h, 'muralhaDeVento', { point: { x: 4, y: 5 } }).ok);
  assert.ok(no_muro.hp < hp, 'quem estava na muralha faz FOR e apanha 3d8');
  assert.ok(enc.zonasEm({ x: 4, y: 2 }).some((z) => z.barraProjetil));
  const hpH = h.hp;
  const bloqueado = enc.resolveAttack(arqueiro, h, { weaponId: 'Arco curto' });
  assert.equal(bloqueado.hit, false);
  assert.equal(bloqueado.muralha, true);
  assert.equal(h.hp, hpH);
  // Corpo a corpo e magia passam: a muralha só barra projétil de arma.
  no_muro.pos = { x: 3, y: 5 };
  const fora = enc.resolveAttack(no_muro, h, { weaponId: 'Cimitarra' });
  assert.ok(fora, 'ataque de perto não é barrado');
  assert.notEqual(fora.muralha, true);
});

teste('as 9 magias do lote 10 estão nas listas de classe certas', () => {
  const onde = {
    luz: ['clerigo', 'bardo', 'feiticeiro'], orientacao: ['clerigo', 'druida'],
    silencio: ['bardo', 'clerigo', 'patrulheiro'], aumentarReduzir: ['feiticeiro', 'mago'],
    eloDeProtecao: ['clerigo', 'paladino'], coroaDaLoucura: ['bardo', 'bruxo', 'feiticeiro', 'mago'],
    acalmarEmocoes: ['bardo', 'clerigo'], oracaoDeCura: ['clerigo', 'paladino'],
    muralhaDeVento: ['druida', 'patrulheiro'],
  };
  for (const [id, classes] of Object.entries(onde)) {
    const s = SPELLS[id];
    assert.ok(s && s.fonte === 'srd' && s.desc, id);
    for (const classe of classes) {
      const l = listaDaClasse(classe, 3);
      assert.ok(l.magias.includes(id) || l.truques.includes(id), `${id} em ${classe}`);
    }
  }
  assert.ok(!listaDaClasse('clerigo', 1).magias.includes('silencio'), 'o 1º nível não vê o 2º círculo');
  assert.ok(!listaDaClasse('mago', 2).magias.includes('muralhaDeVento'));
});


teste('Silêncio: a magia já em pé repete o golpe e Ataque Certeiro (sem verbal) passa; conjurar nova é recusado', () => {
  const { enc, h, foes } = comHeroi('clerigo', 5, {
    truques: ['ataqueCerteiro'], magias: ['silencio', 'armaEspiritual'], foes: [['goblin', { x: 3, y: 5 }]],
  });
  const alvo = foes[0];
  assert.ok(enc.castSpell(h, 'armaEspiritual', { target: alvo, point: alvo.pos }).ok, 'em pé antes do Silêncio');
  h.magiasNoTurno = []; // (o turno seguinte)
  h.bonusUsed = false;
  assert.ok(enc.castSpell(h, 'silencio', { point: { x: 2, y: 5 } }).ok);
  h.actionUsed = false;
  h.bonusUsed = false;
  h.magiasNoTurno = [];
  const reuso = enc.canCast(h, 'armaEspiritual', { target: alvo, point: alvo.pos });
  assert.ok(!/Silêncio/.test(reuso.why ?? ''), 'reusar a magia já em pé não é barrado pelo Silêncio');
  const certeiro = enc.canCast(h, 'ataqueCerteiro', { target: alvo });
  assert.ok(!/Silêncio/.test(certeiro.why ?? ''), 'Ataque Certeiro não tem verbal');
  delete h.magiasAtivas.armaEspiritual;
  const nova = enc.canCast(h, 'armaEspiritual', { target: alvo, point: alvo.pos });
  assert.equal(nova.ok, false);
  assert.match(nova.why, /Silêncio/, 'conjurar de novo dentro do Silêncio é recusado');
});

teste('Acalmar Emoções: atacar (acerto ou erro) ou lançar magia hostil acorda a indiferença; só humanoide acordado entra na área', () => {
  const { enc, h, foes } = comHeroi('clerigo', 5, {
    magias: ['acalmarEmocoes'], truques: ['chamaSagrada'], foes: [['goblin', { x: 5, y: 5 }], ['goblin', { x: 6, y: 5 }]],
  });
  const [a, b] = foes;
  resistenciasDao(enc, false);
  assert.ok(enc.castSpell(h, 'acalmarEmocoes', { point: { x: 5, y: 5 } }).ok);
  assert.ok(hasCondition(a, 'calmo') && hasCondition(b, 'calmo'));
  h.pos = { x: 4, y: 5 };
  d20Fixo(enc, 1);
  enc.resolveAttack(h, a);
  assert.ok(!hasCondition(a, 'calmo'), 'atacar acorda o alvo, acerte ou erre');
  const { enc: e2, h: h2, foes: f2 } = comHeroi('clerigo', 5, {
    magias: ['acalmarEmocoes'], truques: ['chamaSagrada'], foes: [['goblin', { x: 5, y: 5 }]],
  });
  resistenciasDao(e2, false);
  assert.ok(e2.castSpell(h2, 'acalmarEmocoes', { point: { x: 5, y: 5 } }).ok);
  assert.ok(hasCondition(f2[0], 'calmo'));
  h2.actionUsed = false;
  h2.concentrating = null;
  resistenciasDao(e2, true);
  e2.castSpell(h2, 'chamaSagrada', { target: f2[0] });
  assert.ok(!hasCondition(f2[0], 'calmo'), 'a magia hostil acorda a indiferença');
  const { enc: e3, h: h3, foes: f3 } = comHeroi('clerigo', 5, {
    magias: ['acalmarEmocoes'], foes: [['goblin', { x: 5, y: 5 }], ['ogro', { x: 6, y: 5 }], ['goblin', { x: 5, y: 6 }]],
  });
  addCondition(f3[2], 'inconsciente');
  const area = e3.areaDaMagia(h3, getSpell('acalmarEmocoes'), { x: 5, y: 5 });
  const pegos = e3.afetadosPelaArea(h3, getSpell('acalmarEmocoes'), area).map((x) => x.c);
  assert.ok(pegos.includes(f3[0]));
  assert.ok(!pegos.includes(f3[2]), 'inconsciente fora');
  assert.equal(pegos.includes(f3[1]), (f3[1].tipo ?? 'humanoide') === 'humanoide', 'só humanoide entra na prévia');
});

teste('Elo de Proteção: o teste de resistência mostra "Elo de Proteção" (+1), não "lentidão"', () => {
  const { enc, h } = comHeroi('clerigo', 5, { foes: [['goblin', { x: 10, y: 10 }]] });
  addCondition(h, 'eloDeProtecao', { source: 'x' });
  const rotulos = JSON.stringify(enc.resistencia(h, 'dex', 10));
  assert.ok(!/lentid/i.test(rotulos), 'sem o rótulo de lentidão');
  assert.match(rotulos, /Elo de Proteção/);
});


// ---- lote 11: Ilusão Menor, Visão no Escuro, Aprimorar Atributo, Força Fantasmagórica, Sugestão,
//      Luz do Dia, Remover Maldição, Crescer Plantas, Voo ----

/** Mago de 5º nível com as magias dadas, ao lado da Dara, para magias de toque. */
function magoDoLote({ magias = [], truques = [], foes = [['bandidoMachadeiro', { x: 10, y: 10 }]] } = {}) {
  const r = montar({ nivel: 5, foes });
  const ilvan = r.party[ILVAN];
  ilvan.spellcasting.prepared.push(...magias);
  ilvan.spellcasting.cantrips.push(...truques);
  ilvan.pos = { x: 6, y: 6 };
  return { ...r, ilvan, dara: r.party[DARA] };
}
const liberarAcao = (c) => { c.actionUsed = false; c.bonusUsed = false; c.magiasNoTurno = []; };
const tirarCondicao = (c, id) => { c.conditions = c.conditions.filter((x) => x.id !== id); };

teste('Ilusão Menor: tira a visão do outro lado, não do seu; examinar com sucesso a desfaz; atravessar também', () => {
  const { enc, ilvan, dara, foes } = magoDoLote({ truques: ['ilusaoMenor'], foes: [['bandidoMachadeiro', { x: 8, y: 5 }]] });
  ilvan.pos = { x: 2, y: 5 };
  dara.pos = { x: 4, y: 6 };
  const foe = foes[0];
  assert.ok(comoVe(enc, foe, ilvan.pos) > 0, 'sem a imagem, ele vê');
  assert.equal(enc.castSpell(ilvan, 'ilusaoMenor', { point: { x: 4, y: 6 } }).ok, false, 'a casa tem de estar vazia');
  assert.ok(enc.castSpell(ilvan, 'ilusaoMenor', { point: { x: 5, y: 5 } }).ok);
  const z = enc.zonas.find((q) => q.ilusao);
  assert.ok(z && z.casas.size === 1, 'uma casa só');
  assert.equal(comoVe(enc, foe, ilvan.pos), 0, 'a imagem tapa a linha para o inimigo');
  assert.ok(comoVe(enc, ilvan, foe.pos) > 0, 'o conjurador enxerga através da própria imagem');
  assert.equal(enc.field.dificeis.size, 0, 'não é terreno difícil nem parede');
  // Um aliado passa por cima dela sem desfazê-la.
  dara.pos = { x: 4, y: 5 };
  dara.movementLeftFt = 30;
  enc.moveAlong(dara, [{ x: 4, y: 5 }, { x: 5, y: 5 }, { x: 6, y: 5 }]);
  assert.ok(enc.zonas.includes(z), 'o lado do conjurador sabe que é imagem');
  // Examinar: falha mantém, sucesso desfaz.
  foe.pos = { x: 6, y: 4 };
  foe.actionUsed = false;
  d20Fixo(enc, 1);
  assert.ok(enc.examinarIlusao(foe).ok);
  assert.ok(enc.zonas.includes(z), 'falhou no teste: a imagem fica');
  foe.actionUsed = false;
  d20Fixo(enc, 20);
  assert.ok(enc.examinarIlusao(foe).ok);
  assert.ok(!enc.zonas.includes(z), 'passou: some');
  assert.ok(comoVe(enc, foe, ilvan.pos) > 0);
  // Atravessar: o inimigo que pisa na casa desfaz.
  liberarAcao(ilvan);
  const nova = enc.castSpell(ilvan, 'ilusaoMenor', { point: { x: 5, y: 5 } });
  assert.ok(nova.ok, nova.why);
  const z2 = enc.zonas.find((q) => q.ilusao);
  foe.pos = { x: 6, y: 5 };
  foe.movementLeftFt = 30;
  enc.moveAlong(foe, [{ x: 6, y: 5 }, { x: 5, y: 5 }, { x: 4, y: 5 }]);
  assert.ok(!enc.zonas.includes(z2), 'atravessar desfaz');
});

teste('Ilusão Menor: o inimigo colado nela, sem nada para atacar, gasta o turno examinando', () => {
  const { enc, ilvan, foes } = magoDoLote({ truques: ['ilusaoMenor'], foes: [['bandidoMachadeiro', { x: 9, y: 5 }]] });
  const foe = foes[0];
  const z = enc.criarZona(ilvan, getSpell('ilusaoMenor'), [{ x: 8, y: 5 }], 14, { centro: { x: 8, y: 5 }, circulo: 0 });
  // O grupo todo longe, onde o bandido não alcança neste turno.
  enc.combatants.filter((c) => c !== foe).forEach((c, i) => { c.pos = { x: 0, y: i }; });
  foe.pos = { x: 11, y: 11 };
  foe.pos = { x: 9, y: 5 };
  enc.beginSide('foes');
  d20Fixo(enc, 20);
  foe.speedFt = 0;
  takeMonsterTurn(enc, foe);
  assert.ok(foe.actionUsed, 'gastou a ação');
  assert.ok(!enc.zonas.includes(z), 'examinou e desfez');
});

teste('Visão no Escuro: o aliado vê 18 m no breu; a Escuridão mágica continua opaca', () => {
  const { enc, ilvan, dara } = magoDoLote({ magias: ['visaoNoEscuro', 'escuridao'] });
  enc.field.luz = new Array(144).fill(0);
  dara.pos = { x: 5, y: 5 };
  const longe = { x: 5, y: 9 }; // 6 m
  assert.equal(comoVe(enc, dara, longe), 0, 'sem a magia, no breu, não vê');
  assert.ok(enc.castSpell(ilvan, 'visaoNoEscuro', { target: dara, targets: [dara] }).ok);
  assert.ok(hasCondition(dara, 'visaoNoEscuro'));
  assert.ok(comoVe(enc, dara, longe) > 0, 'com a magia, vê a 6 m');
  assert.ok(comoVe(enc, dara, { x: 11, y: 5 }) > 0, 'a 9 m ainda vê');
  assert.equal(visaoNoEscuro(dara), 60, '18 m');
  enc.criarZona(ilvan, getSpell('escuridao'), [{ x: 5, y: 9 }], 14, { centro: { x: 5, y: 9 }, circulo: 2 });
  assert.equal(comoVe(enc, dara, longe), 0, 'a escuridão mágica barra até a visão no escuro');
});

teste('Aprimorar Atributo: Urso dá 2d6 PV temporários e vantagem em CON, e eles somem com a magia; Gato nega a queda', () => {
  const { enc, ilvan, dara } = magoDoLote({ magias: ['aprimorarAtributo'] });
  assert.ok(enc.castSpell(ilvan, 'aprimorarAtributo', { target: dara, targets: [dara] }).ok);
  const c = getCondition(dara, 'aprimorado');
  assert.equal(c.data.opcao, 'urso', 'sem pedido e sem estar preso, o Urso');
  assert.ok(dara.tempHp >= 2 && dara.tempHp <= 12);
  assert.ok(conditionEffects(dara).vantagemSoTeste.includes('con'));
  assert.ok(!conditionEffects(dara).vantagemTeste.includes('con'), 'só testes, não resistências');
  enc.dropConcentration(ilvan);
  assert.ok(!hasCondition(dara, 'aprimorado'));
  assert.equal(dara.tempHp, 0, 'os PV temporários vão embora com a magia');
  // Pedido explícito: Gato, e a queda não fere.
  liberarAcao(ilvan);
  assert.ok(enc.castSpell(ilvan, 'aprimorarAtributo', { target: dara, targets: [dara], opcao: 'gato' }).ok);
  assert.equal(getCondition(dara, 'aprimorado').data.hab, 'dex');
  const hp = dara.hp;
  enc.cair(dara);
  assert.equal(dara.hp, hp, 'Graça do Gato: sem dano de queda');
  // Preso numa teia: o jogo escolhe o atributo do escape (Touro, pois a Teia pede Força).
  addCondition(dara, 'contido', { source: 'zona:1' });
  assert.equal(enc.opcaoDeAprimorar(dara), 'touro');
  // O teste de atributo rola com vantagem de verdade.
  tirarCondicao(dara, 'contido');
  const rolagens = [];
  const die = enc.rng.die.bind(enc.rng);
  enc.rng.die = (l) => { const v = die(l); if (l === 20) rolagens.push(v); return v; };
  enc.testeDeAtributo(dara, 'dex', 0);
  assert.equal(rolagens.length, 2, 'dois d20: vantagem em DES');
  rolagens.length = 0;
  enc.testeDeAtributo(dara, 'str', 0);
  assert.equal(rolagens.length, 1, 'sem vantagem em FOR');
});

teste('Força Fantasmagórica: falha em INT leva 1d6 psíquico no início do turno; examinar com sucesso a desfaz', () => {
  const { enc, ilvan, foes } = magoDoLote({ magias: ['forcaFantasmagorica'], foes: [['bandidoMachadeiro', { x: 8, y: 6 }]] });
  const foe = foes[0];
  resistenciasDao(enc, false);
  assert.ok(enc.castSpell(ilvan, 'forcaFantasmagorica', { target: foe }).ok);
  assert.ok(hasCondition(foe, 'iludido'));
  assert.ok(getCondition(foe, 'iludido').data.dc > 8);
  const hp = foe.hp;
  enc.beginSide('foes');
  assert.ok(foe.hp < hp && hp - foe.hp <= 6, 'a ilusão feriu no início do turno');
  foe.actionUsed = false;
  d20Fixo(enc, 20);
  assert.ok(enc.investigarIlusao(foe).ok);
  assert.ok(!hasCondition(foe, 'iludido'));
  assert.equal(ilvan.concentrating, null, 'sem ninguém iludido, a concentração cai');
  // Resistindo, nada acontece.
  const { enc: e2, ilvan: i2, foes: f2 } = magoDoLote({ magias: ['forcaFantasmagorica'], foes: [['bandidoMachadeiro', { x: 8, y: 6 }]] });
  resistenciasDao(e2, true);
  e2.castSpell(i2, 'forcaFantasmagorica', { target: f2[0] });
  assert.ok(!hasCondition(f2[0], 'iludido'));
});

teste('Sugestão: o humanoide que falha larga a luta e se afasta; ferido por aliado do conjurador, volta', () => {
  const { enc, ilvan, dara, foes } = magoDoLote({ magias: ['sugestao'], foes: [['bandidoMachadeiro', { x: 6, y: 8 }]] });
  const foe = foes[0];
  resistenciasDao(enc, false);
  assert.ok(enc.castSpell(ilvan, 'sugestao', { target: foe }).ok);
  assert.ok(hasCondition(foe, 'sugerido'));
  enc.beginSide('foes');
  const antes = distanceFt(foe.pos, ilvan.pos);
  const hpIlvan = ilvan.hp;
  takeMonsterTurn(enc, foe);
  assert.ok(distanceFt(foe.pos, ilvan.pos) > antes, 'se afastou');
  assert.equal(ilvan.hp, hpIlvan, 'não atacou');
  // O golpe da Dara quebra a sugestão.
  enc.applyDamage(foe, 1, 'cortante', dara);
  assert.ok(!hasCondition(foe, 'sugerido'));
  assert.equal(ilvan.concentrating, null);
  // Qualquer criatura que ouça serve: o lobo também aceita.
  const { enc: e2, ilvan: i2, foes: f2 } = magoDoLote({ magias: ['sugestao'], foes: [['lobo', { x: 6, y: 8 }]] });
  assert.equal(e2.canCast(i2, 'sugestao', { target: f2[0] }).ok, true);
});

teste('Luz do Dia: ilumina o breu num raio de 18 m e dissipa a Escuridão (círculo ≤ 3) que toca', () => {
  const { enc, ilvan, dara } = magoDoLote({ magias: ['luzDoDia', 'escuridao'] });
  enc.field.luz = new Array(144).fill(0);
  dara.pos = { x: 2, y: 2 };
  const alvo = { x: 11, y: 11 };
  assert.equal(comoVe(enc, dara, alvo), 0, 'no breu');
  assert.ok(enc.castSpell(ilvan, 'escuridao', { point: { x: 9, y: 9 } }).ok);
  assert.ok(enc.zonas.some((z) => z.obscuro === 'magica'));
  liberarAcao(ilvan);
  assert.ok(enc.castSpell(ilvan, 'luzDoDia', { point: { x: 8, y: 8 } }).ok);
  assert.ok(!enc.zonas.some((z) => z.obscuro === 'magica'), 'a luz do dia dissipou a escuridão');
  assert.equal(comoVe(enc, dara, alvo), 2, 'em plena luz');
  assert.ok(enc.zonas.find((z) => z.luz).luz.claro === 60);
});

teste('Remover Maldição: tira Rogar Maldição e Bruxaria de uma vez, e solta quem as mantinha', () => {
  const { enc, ilvan, dara, foes } = magoDoLote({ magias: ['removerMaldicao'] });
  const foe = foes[0];
  addCondition(dara, 'rogado', { source: foe.id });
  addCondition(dara, 'bruxaria', { source: foe.id });
  foe.concentrating = { spellId: 'rogarMaldicao', condition: 'rogado', targets: [dara], rounds: 10 };
  assert.equal(enc.canCast(ilvan, 'removerMaldicao', { target: foe }).ok, false, 'só aliado');
  assert.ok(enc.castSpell(ilvan, 'removerMaldicao', { target: dara }).ok);
  assert.ok(!hasCondition(dara, 'rogado') && !hasCondition(dara, 'bruxaria'));
  assert.equal(foe.concentrating, null, 'sem maldição, a concentração do inimigo cai');
  liberarAcao(ilvan);
  const r = enc.canCast(ilvan, 'removerMaldicao', { target: dara });
  assert.equal(r.ok, false, 'sem maldição, não há o que tirar');
  assert.match(r.why, /amaldiçoado/);
});

teste('Crescer Plantas: o terreno custa 4×, poupa as casas dos aliados e o chão que não é natural', () => {
  const { enc, ilvan, foes } = magoDoLote({ magias: ['crescerPlantas'], foes: [['bandidoMachadeiro', { x: 9, y: 9 }]] });
  enc.field.surfaces[5 * 12 + 3] = SUPERFICIES.indexOf('estrada'); // (3,5) é estrada
  assert.ok(enc.castSpell(ilvan, 'crescerPlantas', { point: { x: 5, y: 5 } }).ok);
  const z = enc.zonas.find((q) => q.dificil4);
  assert.ok(z && z.casas.size > 100, 'o raio de 30 m cobre o mapa');
  assert.ok(!z.casas.has('3,5'), 'estrada não vira mato');
  assert.ok(!z.casas.has('5,5') && !z.casas.has('6,6'), 'quem está lá fica de fora');
  assert.equal(enc.field.costOf(8, 8), 20, 'cada 1,5 m custa 6 m');
  assert.equal(enc.field.costOf(3, 5), 5, 'na estrada anda-se normal');
  const foe = foes[0];
  foe.movementLeftFt = 30;
  const alcance = enc.reachableFor(foe);
  const longe = [...alcance.values()].filter((n) => distanceFt(foe.pos, n) > 5);
  assert.equal(longe.length, 0, '30 pés dão uma casa só no mato cerrado');
  enc.desfazerZona(z);
  assert.equal(enc.field.costOf(8, 8), 5, 'ao acabar, o custo volta');
});

teste('Voo: 18 m, ignora terreno difícil e degraus, e as zonas do chão; ao cair da concentração, cai 1d6 e fica caído', () => {
  const { enc, ilvan, dara } = magoDoLote({ magias: ['voo'] });
  for (const x of [2, 3, 4]) for (let y = 0; y < 12; y++) enc.field.tiles[y * 12 + x] = 2; // três colunas de entulho no caminho
  dara.pos = { x: 5, y: 5 };
  dara.movementLeftFt = 30;
  assert.ok(!enc.reachableFor(dara).has('1,5'), 'a pé, o entulho segura');
  assert.ok(enc.castSpell(ilvan, 'voo', { target: dara, targets: [dara] }).ok);
  assert.ok(hasCondition(dara, 'voando'));
  assert.equal(dara.movementLeftFt, 60, 'o voo já vale neste turno: 18 m');
  assert.ok(enc.reachableFor(dara).has('1,5'), 'voando, passa por cima');
  assert.equal(enc.field.voando, false, 'o campo volta ao normal');
  // Zona do chão (Graxa) não pega quem voa.
  const graxa = enc.criarZona(ilvan, getSpell('graxa'), [{ x: 5, y: 5 }], 15, { centro: { x: 5, y: 5 }, circulo: 1 });
  resistenciasDao(enc, false);
  assert.equal(enc.resistirAZona(dara, graxa, 'começa o turno'), true, 'voando, a graxa não o derruba');
  // A concentração cai: ele cai.
  const hp = dara.hp;
  enc.dropConcentration(ilvan);
  assert.ok(!hasCondition(dara, 'voando'));
  assert.ok(dara.hp < hp && hp - dara.hp <= 6, '1d6 de queda');
  assert.ok(hasCondition(dara, 'caido'));
  tirarCondicao(dara, 'caido');
  assert.equal(enc.resistirAZona(dara, graxa, 'começa o turno'), false, 'no chão, a graxa pega');
});



teste('Lote 11 (revisão): prévia de zona inofensiva vazia; prévia do Crescer Plantas sem as casas dos aliados', () => {
  const { enc, ilvan, dara, foes } = magoDoLote({ magias: ['luzDoDia', 'crescerPlantas'], foes: [['bandidoMachadeiro', { x: 8, y: 8 }]] });
  const area = enc.areaDaMagia(ilvan, getSpell('luzDoDia'), { x: 8, y: 8 }) ?? [];
  assert.ok(area.length > 0);
  assert.deepEqual(enc.afetadosPelaArea(ilvan, getSpell('luzDoDia'), area, 3), [], 'luz não "afeta" ninguém');
  const cp = getSpell('crescerPlantas');
  const casas = enc.casasDaZona(ilvan, cp, enc.areaDaMagia(ilvan, cp, { x: 5, y: 5 }) ?? []);
  assert.ok(casas.length > 50);
  const tem = (x, y) => casas.some((t) => t.x === x && t.y === y);
  assert.ok(!tem(ilvan.pos.x, ilvan.pos.y) && !tem(dara.pos.x, dara.pos.y), 'a prévia poupa os aliados');
  assert.ok(tem(foes[0].pos.x, foes[0].pos.y), 'o inimigo fica dentro');
});

teste('Ilusão Menor: o inimigo colado nela anda até o alvo antes de examinar', () => {
  const { enc, ilvan, dara, foes } = magoDoLote({ truques: ['ilusaoMenor'], foes: [['bandidoMachadeiro', { x: 9, y: 5 }]] });
  const foe = foes[0];
  const z = enc.criarZona(ilvan, getSpell('ilusaoMenor'), [{ x: 8, y: 5 }], 14, { centro: { x: 8, y: 5 }, circulo: 0 });
  enc.combatants.filter((c) => c !== foe).forEach((c, i) => { c.pos = { x: 0, y: i + 6 }; });
  dara.pos = { x: 11, y: 5 };
  foe.pos = { x: 9, y: 5 };
  enc.beginSide('foes');
  takeMonsterTurn(enc, foe);
  assert.ok(Math.abs(foe.pos.x - 11) + Math.abs(foe.pos.y - 5) <= 2, 'foi até a Dara');
  assert.ok(enc.zonas.includes(z), 'não gastou o turno examinando');
});

teste('Dissipar Magia em Aprimorar Atributo (Urso) tira os PV temporários', () => {
  const { enc, ilvan, dara } = magoDoLote({ magias: ['aprimorarAtributo', 'dissiparMagia'] });
  assert.ok(enc.castSpell(ilvan, 'aprimorarAtributo', { target: dara, targets: [dara] }).ok);
  assert.ok(dara.tempHp > 0);
  liberarAcao(ilvan);
  assert.ok(enc.castSpell(ilvan, 'dissiparMagia', { target: dara }).ok);
  assert.ok(!hasCondition(dara, 'aprimorado'));
  assert.equal(dara.tempHp, 0, 'os PV temporários vão junto');
});

// ---- lote 12: Queda Suave, Bom Fruto, Imagem Silenciosa/Maior, Cordão de Flechas, Passo sem Rastro,
//      Patas de Aranha, Contramágica, Glifo de Proteção ----

teste('Queda Suave: quando o Voo acaba, a reação de um aliado faz o voador descer sem dano e de pé', () => {
  const { enc, ilvan, dara } = magoDoLote({ magias: ['voo', 'quedaSuave'] });
  assert.ok(enc.castSpell(ilvan, 'voo', { target: dara, targets: [dara] }).ok);
  const hp = dara.hp;
  const slots = ilvan.spellcasting.slots[1];
  enc.dropConcentration(ilvan);
  assert.ok(!hasCondition(dara, 'voando'));
  assert.equal(dara.hp, hp, 'sem dano de queda');
  assert.ok(!hasCondition(dara, 'caido'), 'pousa de pé');
  assert.equal(ilvan.reactionUsed, true, 'gastou a reação');
  assert.equal(ilvan.spellcasting.slots[1], slots - 1, 'e um espaço de 1º círculo');
});

teste('Queda Suave: sem reação livre (ou sem a magia), a queda dói como sempre; até 5 criaturas, 18 m', () => {
  const { enc, ilvan, dara } = magoDoLote({ magias: ['voo', 'quedaSuave'] });
  assert.ok(enc.castSpell(ilvan, 'voo', { target: dara, targets: [dara] }).ok);
  ilvan.reactionUsed = true;
  const hp = dara.hp;
  enc.dropConcentration(ilvan);
  assert.ok(dara.hp < hp && hasCondition(dara, 'caido'), 'sem reação, cai');
  // Fora do alcance de 18 m: a reação não vale.
  const m = magoDoLote({ magias: ['voo', 'quedaSuave'] });
  assert.ok(m.enc.castSpell(m.ilvan, 'voo', { target: m.dara, targets: [m.dara] }).ok);
  m.ilvan.pos = { x: 0, y: 0 };
  m.dara.pos = { x: 11, y: 11 };
  m.enc.field.tiles[5 * 12 + 5] = 1; // uma parede no meio: Ilvan não vê Dara cair
  m.enc.dropConcentration(m.ilvan);
  assert.ok(hasCondition(m.dara, 'caido'), 'sem linha de visão a magia não alcança');
  // Cinco criaturas de uma vez.
  const g = magoDoLote({ magias: ['quedaSuave'] });
  const seis = [g.dara, g.party[PIP], g.party[BRENN], g.ilvan];
  const antes = seis.map((c) => c.hp);
  g.enc.quedaDe(seis);
  assert.deepEqual(seis.map((c) => c.hp), antes, 'quatro caindo, todos amortecidos por uma reação só');
  assert.ok(seis.every((c) => !hasCondition(c, 'caido')));
});

teste('Bom Fruto: dez frutinhas na mochila, cada uma cura 1 PV com uma ação; fora de combate o descanso as reparte', () => {
  const { enc, ilvan, dara } = magoDoLote({ magias: ['bomFruto'] });
  assert.ok(enc.castSpell(ilvan, 'bomFruto').ok);
  assert.equal(quantosNaMochila(ilvan, 'bomFruto'), 10);
  dara.hp = dara.maxHp - 5;
  dara.pos = { x: 6, y: 5 };
  ilvan.pos = { x: 6, y: 6 };
  liberarAcao(ilvan);
  const r = enc.useItem(ilvan, 'bomFruto', { target: dara });
  assert.ok(r.ok, r.why);
  assert.equal(dara.hp, dara.maxHp - 4);
  assert.equal(quantosNaMochila(ilvan, 'bomFruto'), 9);
  // Descanso: até 10 PV distribuídos, a quem está mais ferido.
  const d = montar({ nivel: 5 });
  const mago = d.party[ILVAN];
  mago.spellcasting.prepared.push('bomFruto');
  d.party[DARA].hp = d.party[DARA].maxHp - 3;
  d.party[PIP].hp = d.party[PIP].maxHp - 20;
  const ant = [d.party[DARA].hp, d.party[PIP].hp];
  const rr = bomFrutoNoDescanso(mago, d.party);
  assert.ok(rr.ok, rr.why);
  assert.equal(rr.curas.reduce((t, c) => t + c.cura, 0), 10);
  assert.equal(d.party[DARA].hp - ant[0] + d.party[PIP].hp - ant[1], 10);
});

teste('Imagem Silenciosa: 3×3 casas, tira a visão do outro lado, anda com a ação; desfaz ao ser examinada', () => {
  const { enc, ilvan, dara, foes } = magoDoLote({ magias: ['imagemSilenciosa'], foes: [['bandidoMachadeiro', { x: 10, y: 5 }]] });
  ilvan.pos = { x: 2, y: 5 };
  dara.pos = { x: 1, y: 5 };
  const foe = foes[0];
  assert.ok(comoVe(enc, ilvan, foe.pos) > 0 && comoVe(enc, foe, ilvan.pos) > 0, 'sem a imagem, todos se veem');
  assert.equal(enc.castSpell(ilvan, 'imagemSilenciosa', { point: { x: 40, y: 5 } }).ok, false);
  assert.ok(enc.castSpell(ilvan, 'imagemSilenciosa', { point: { x: 5, y: 4 } }).ok);
  const z = enc.zonas.find((x) => x.spellId === 'imagemSilenciosa');
  assert.equal(z.casas.size, 9, '3×3');
  assert.equal(comoVe(enc, foe, ilvan.pos), 0, 'o inimigo não vê o que está atrás da imagem');
  assert.ok(comoVe(enc, ilvan, foe.pos) > 0, 'o conjurador vê através dela');
  // Mover com a ação: a imagem sai do caminho e o cache de visão acompanha.
  liberarAcao(ilvan);
  const mover = enc.castSpell(ilvan, 'imagemSilenciosa', { point: { x: 5, y: 8 } });
  assert.ok(mover.ok, mover.why);
  assert.equal(enc.zonas.filter((x) => x.spellId === 'imagemSilenciosa').length, 1);
  assert.ok(z.casas.has('5,8') && !z.casas.has('5,4'), 'a imagem andou');
  assert.ok(comoVe(enc, foe, ilvan.pos) > 0, 'liberou a linha de visão');
  assert.equal(ilvan.spellcasting.slots[1], 3, 'mover não gasta espaço (4 − 1)');
  // Concentração caiu, imagem some.
  enc.dropConcentration(ilvan);
  assert.ok(!enc.zonas.some((x) => x.spellId === 'imagemSilenciosa'));
});

teste('Imagens: a Silenciosa anda até 120 pés por vez e a Maior até 240, ao alcance', () => {
  assert.equal(getSpell('imagemSilenciosa').zona.movel, 120);
  assert.equal(getSpell('imagemMaior').zona.movel, 240);
});

teste('Imagem Maior: 4×4 casas e 36 m; o inimigo que a examina com sucesso a desfaz', () => {
  const { enc, ilvan, foes } = magoDoLote({ magias: ['imagemMaior'], foes: [['bandidoMachadeiro', { x: 9, y: 6 }]] });
  assert.ok(enc.castSpell(ilvan, 'imagemMaior', { point: { x: 5, y: 3 } }).ok);
  const z = enc.zonas.find((x) => x.spellId === 'imagemMaior');
  assert.equal(z.casas.size, 16, '4×4');
  assert.equal(z.ilusao, true);
  // O bandido está colado na imagem: examina e vê que é só uma ilusão.
  const foe = foes[0];
  foe.pos = { x: 8, y: 5 };
  d20Fixo(enc, 20);
  enc.beginSide('foes');
  assert.ok(enc.examinarIlusao(foe, z).ok);
  assert.ok(!enc.zonas.includes(z), 'desfeita');
});

teste('Cordão de Flechas: uma flecha ataca o inimigo que entra a 9 m (1ª vez no turno) ou termina o turno ali; 4 flechas e acaba', () => {
  const { enc, h, foes, log } = comHeroi('patrulheiro', 5, { magias: ['cordaoDeFlechas'], foes: [['bandidoMachadeiro', { x: 10, y: 10 }]] });
  h.pos = { x: 2, y: 2 };
  assert.ok(enc.castSpell(h, 'cordaoDeFlechas', { point: { x: 3, y: 2 } }).ok);
  const z = enc.zonas.find((x) => x.spellId === 'cordaoDeFlechas');
  assert.equal(z.cordao.flechas, 4);
  assert.ok(z.cd > 0, 'a zona leva a CD da magia');
  const foe = foes[0];
  foe.maxHp = foe.hp = 500;
  enc.beginSide('foes');
  foe.pos = { x: 11, y: 2 };
  const n = log.length;
  enc.moveAlong(foe, [{ x: 11, y: 2 }, { x: 10, y: 2 }]);
  assert.equal(z.cordao.flechas, 4, 'a 35 pés ainda não entrou (o alcance é 30 pés a partir de x=3)');
  foe.movementLeftFt = 30;
  enc.moveAlong(foe, [{ x: 10, y: 2 }, { x: 9, y: 2 }, { x: 8, y: 2 }]);
  assert.equal(z.cordao.flechas, 3, 'entrou: uma flecha');
  assert.ok(log.slice(n).some((e) => /Cordão de Flechas/.test(e.text)));
  foe.movementLeftFt = 30;
  enc.moveAlong(foe, [{ x: 8, y: 2 }, { x: 7, y: 2 }]);
  assert.equal(z.cordao.flechas, 3, 'só a primeira entrada vale no turno');
  enc.fimDoTurnoDoLado('foes');
  assert.equal(z.cordao.flechas, 2, 'terminar o turno ali dá mais uma flecha');
  // Aliado não dispara.
  enc.cordaoNoFimDoTurno(h);
  assert.equal(z.cordao.flechas, 2, 'quem é do lado do conjurador não dispara');
  // As flechas acabam.
  enc.cordaoNoFimDoTurno(foe);
  enc.cordaoNoFimDoTurno(foe);
  assert.ok(!enc.zonas.includes(z), 'sem flechas, a magia acaba');
});

teste('Cordão de Flechas: resistência de DES contra a CD; falhou = 1d6 perfurante cheio, passou = nada; gasta a flecha nos dois casos', () => {
  const { enc, h, foes } = comHeroi('patrulheiro', 5, { magias: ['cordaoDeFlechas'], foes: [['bandidoMachadeiro', { x: 10, y: 10 }]] });
  h.pos = { x: 2, y: 2 };
  assert.ok(enc.castSpell(h, 'cordaoDeFlechas', { point: { x: 3, y: 2 } }).ok);
  const z = enc.zonas.find((x) => x.spellId === 'cordaoDeFlechas');
  const foe = foes[0];
  foe.maxHp = foe.hp = 500;
  foe.pos = { x: 5, y: 2 };
  resistenciasDao(enc, true);
  enc.flechaDoCordao(z, foe, 'termina o turno no alcance do');
  assert.equal(foe.hp, 500, 'passou: nada');
  assert.equal(z.cordao.flechas, 3, 'a flecha gasta mesmo assim');
  resistenciasDao(enc, false);
  enc.flechaDoCordao(z, foe, 'termina o turno no alcance do');
  assert.ok(foe.hp < 500 && foe.hp >= 494, 'falhou: 1d6 cheio');
  assert.equal(z.cordao.flechas, 2);
});

teste('Cordão de Flechas: círculo acima do 2º dá +2 flechas', () => {
  const { enc, h } = comHeroi('patrulheiro', 5, { magias: ['cordaoDeFlechas'], foes: [['bandidoMachadeiro', { x: 10, y: 10 }]] });
  h.spellcasting.slots[3] = 1;
  h.spellcasting.slots[2] = 0;
  assert.ok(enc.castSpell(h, 'cordaoDeFlechas', { point: { x: 3, y: 5 }, circulo: 3 }).ok);
  assert.equal(enc.zonas.find((x) => x.spellId === 'cordaoDeFlechas').cordao.flechas, 6);
});

teste('Passo sem Rastro: +10 em Furtividade para quem está a 9 m; ao se afastar, perde', () => {
  const { enc: e2, ilvan, dara, party } = magoDoLote({ magias: ['passoSemRastro'] });
  ilvan.pos = { x: 6, y: 1 };
  dara.pos = { x: 6, y: 4 };
  party[PIP].pos = { x: 6, y: 11 };
  const furt = (c) => skillBonus(c, 'furtividade');
  const [d0, p0, i0] = [furt(dara), furt(party[PIP]), furt(ilvan)];
  assert.ok(e2.castSpell(ilvan, 'passoSemRastro').ok);
  assert.equal(furt(dara), d0 + 10, 'a 6 m');
  assert.equal(furt(ilvan), i0 + 10, 'o conjurador também');
  assert.equal(furt(party[PIP]), p0, 'a 15 m, não');
  // Afastar-se de quem conjurou tira o véu.
  dara.pos = { x: 6, y: 9 };
  e2.renovarRastro();
  assert.equal(furt(dara), d0, 'longe demais');
  dara.pos = { x: 6, y: 5 };
  e2.renovarRastro();
  assert.equal(furt(dara), d0 + 10, 'voltou');
  e2.dropConcentration(ilvan);
  assert.equal(furt(dara), d0, 'sem concentração, acaba');
});

teste('Passo sem Rastro: quem foi dissipado não ganha o véu de volta ao renová-lo', () => {
  const { enc: e2, ilvan, dara } = magoDoLote({ magias: ['passoSemRastro', 'dissiparMagia'] });
  ilvan.pos = { x: 6, y: 1 };
  dara.pos = { x: 6, y: 4 };
  assert.ok(e2.castSpell(ilvan, 'passoSemRastro').ok);
  assert.ok(dara.conditions.some((c) => c.id === 'semRastro'));
  const conc = ilvan.concentrating;
  conc.dissipados = [dara.id];
  dara.conditions = dara.conditions.filter((c) => c.id !== 'semRastro');
  e2.renovarRastro();
  assert.ok(!dara.conditions.some((c) => c.id === 'semRastro'), 'não volta');
  assert.ok(ilvan.conditions.some((c) => c.id === 'semRastro'), 'o conjurador segue com o véu');
});

teste('Passo sem Rastro: a Furtividade de surpresa do combate soma o +10', () => {
  const { enc, ilvan, dara, party } = magoDoLote({ magias: ['passoSemRastro'] });
  assert.ok(enc.castSpell(ilvan, 'passoSemRastro').ok);
  assert.ok(party.every((c) => c.pos && distanceFt(c.pos, ilvan.pos) <= 30 ? hasCondition(c, 'semRastro') : true));
  assert.ok(hasCondition(dara, 'semRastro'));
});

teste('Patas de Aranha: sobe degraus de 2 níveis sem custo, mas terreno difícil continua custando o dobro (o Voo ignora)', () => {
  const { enc, ilvan, dara } = magoDoLote({ magias: ['patasDeAranha', 'voo'] });
  dara.pos = { x: 5, y: 5 };
  // Uma coluna de 2 níveis de altura em x=3 e entulho em x=2.
  for (let y = 0; y < 12; y++) { enc.field.heights[y * 12 + 3] = 2; enc.field.tiles[y * 12 + 2] = 2; }
  dara.movementLeftFt = 20;
  assert.ok(enc.reachableFor(dara).has('4,5'), 'a pé chega ao pé do degrau');
  assert.ok(!enc.reachableFor(dara).has('2,5'), 'a pé, o degrau de 2 níveis é parede');
  assert.ok(enc.castSpell(ilvan, 'patasDeAranha', { target: dara, targets: [dara] }).ok);
  assert.ok(hasCondition(dara, 'escalando'));
  const a = enc.reachableFor(dara);
  assert.ok(a.has('2,5'), 'com patas de aranha, sobe o degrau (5+5+10 = 20)');
  assert.ok(!a.has('1,5'), 'o terreno difícil de x=2 continua dobrando o custo');
  assert.equal(enc.field.escalando, false, 'o campo volta ao normal');
  // O Voo, ao contrário, ignora o terreno difícil.
  tirarCondicao(dara, 'escalando');
  liberarAcao(ilvan);
  assert.ok(enc.castSpell(ilvan, 'voo', { target: dara, targets: [dara] }).ok);
  dara.movementLeftFt = 20;
  assert.ok(enc.reachableFor(dara).has('1,5'), 'voando passa por cima de tudo');
});

teste('Contramágica: o inimigo atento anula a magia (o espaço se perde); sem reação, ela sai', () => {
  const { enc, ilvan, foes } = magoDoLote({ magias: ['misselMagico'], foes: [['mago', { x: 9, y: 6 }]] });
  const mago = foes[0];
  mago.spellcasting.prepared.push('contramagia');
  const hp = mago.hp;
  const s1 = ilvan.spellcasting.slots[1];
  const r = enc.castSpell(ilvan, 'misselMagico', { target: mago });
  assert.ok(r.ok && r.anulada, 'anulada');
  assert.equal(mago.hp, hp, 'nenhum dardo chegou');
  assert.equal(ilvan.spellcasting.slots[1], s1 - 1, 'o espaço de quem conjurou se perde');
  assert.equal(mago.reactionUsed, true);
  assert.equal(mago.spellcasting.slots[3], 2, 'gastou um espaço de 3º círculo');
  // Sem reação livre, a magia sai.
  liberarAcao(ilvan);
  const r2 = enc.castSpell(ilvan, 'misselMagico', { target: mago });
  assert.ok(r2.ok && !r2.anulada);
  assert.ok(mago.hp < hp, 'agora os dardos acertam');
});

teste('Contramágica: quando precisa de teste, gasta o MENOR espaço de 3º círculo ou maior', () => {
  const { enc, ilvan, foes } = magoDoLote({ magias: ['voo'], foes: [['mago', { x: 9, y: 6 }]] });
  const mago = foes[0];
  mago.spellcasting.prepared.push('contramagia');
  mago.spellcasting.slots = [0, 0, 0, 1, 1];
  ilvan.spellcasting.slots[5] = 1;
  const rr = enc.castSpell(ilvan, 'voo', { target: ilvan, targets: [ilvan], circulo: 5 });
  assert.ok(rr.ok);
  assert.equal(mago.spellcasting.slots[3], 0, 'gastou o de 3º, o menor que a Contramágica aceita');
  assert.equal(mago.spellcasting.slots[4], 1, 'o de 4º ficou');
  const m2 = magoDoLote({ magias: ['voo'], foes: [['mago', { x: 9, y: 6 }]] });
  const mg = m2.foes[0];
  mg.spellcasting.prepared.push('contramagia');
  mg.spellcasting.slots = [0, 0, 0, 1, 0, 1];
  m2.ilvan.spellcasting.slots[4] = 1;
  m2.enc.castSpell(m2.ilvan, 'voo', { target: m2.ilvan, targets: [m2.ilvan], circulo: 4 });
  assert.equal(mg.spellcasting.slots[5], 0, 'só o 5º basta sem teste');
  assert.equal(mg.spellcasting.slots[3], 1);
});

teste('Contramágica: truque passa; círculo maior que o espaço pede teste CD 10 + círculo; vale também contra o inimigo conjurador', () => {
  const { enc, ilvan, foes } = magoDoLote({ magias: ['voo'], truques: ['raioDeFogo'], foes: [['mago', { x: 9, y: 6 }]] });
  const mago = foes[0];
  mago.spellcasting.prepared.push('contramagia');
  enc.castSpell(ilvan, 'raioDeFogo', { target: mago });
  assert.equal(mago.reactionUsed, false, 'truque não é contramagiado');
  // Um espaço só de 3º círculo contra uma magia do 4º: teste de atributo.
  mago.spellcasting.slots = [0, 0, 0, 1];
  ilvan.spellcasting.slots[4] = 1;
  liberarAcao(ilvan);
  const rr = enc.castSpell(ilvan, 'voo', { target: ilvan, targets: [ilvan], circulo: 4 });
  assert.ok(rr.ok);
  assert.equal(mago.spellcasting.slots[3], 0, 'gastou o espaço');
  assert.equal(mago.reactionUsed, true);
  // O herói com Contramágica interrompe o mago inimigo.
  const h = magoDoLote({ magias: ['contramagia'], foes: [['mago', { x: 9, y: 6 }]] });
  const inimigo = h.foes[0];
  const hpIlvan = h.ilvan.hp;
  const hpDara = h.dara.hp;
  inimigo.actionUsed = false;
  const rc = h.enc.castSpell(inimigo, 'misselMagico', { target: h.ilvan });
  assert.ok(rc.anulada, 'o herói contramagiou');
  assert.equal(h.ilvan.hp, hpIlvan);
  assert.equal(h.dara.hp, hpDara);
  assert.equal(h.ilvan.reactionUsed, true);
});

teste('Glifo de Proteção: o inimigo que pisa dispara a runa; esfera de 6 m, DES, tipo escolhido, aliados também; a runa some', () => {
  const { enc, ilvan, dara, foes } = magoDoLote({ magias: ['glifoDeProtecao'], foes: [['bandidoMachadeiro', { x: 10, y: 6 }]] });
  ilvan.pos = { x: 2, y: 6 };
  dara.pos = { x: 4, y: 6 };
  const foe = foes[0];
  foe.maxHp = foe.hp = 300;
  assert.ok(enc.castSpell(ilvan, 'glifoDeProtecao', { point: { x: 3, y: 6 }, opcao: 'frio' }).ok);
  const z = enc.zonas.find((x) => x.spellId === 'glifoDeProtecao');
  assert.equal(z.glifo.tipo, 'frio');
  assert.equal(z.glifo.dados, '5d8');
  assert.equal(z.inofensiva, true, 'a IA não desvia (e não a vê)');
  // Aliado pisando não dispara.
  const hpDara = dara.hp;
  dara.movementLeftFt = 30;
  enc.moveAlong(dara, [{ x: 4, y: 6 }, { x: 3, y: 6 }]);
  assert.ok(enc.zonas.includes(z), 'aliado não dispara');
  assert.equal(dara.hp, hpDara);
  dara.pos = { x: 4, y: 7 };
  // O inimigo pisa.
  resistenciasDao(enc, false);
  enc.beginSide('foes');
  foe.pos = { x: 5, y: 6 };
  foe.movementLeftFt = 30;
  const hpFoe = foe.hp;
  const hpIlvan = ilvan.hp;
  enc.moveAlong(foe, [{ x: 5, y: 6 }, { x: 4, y: 6 }, { x: 3, y: 6 }]);
  assert.ok(!enc.zonas.includes(z), 'a runa some ao disparar');
  assert.ok(foe.hp < hpFoe, 'o inimigo levou o dano');
  assert.ok(ilvan.hp < hpIlvan && dara.hp < hpDara, 'aliados na esfera também');
  assert.equal(foe.pos.x, 3, 'parou na casa da runa');
});

teste('Glifo de Proteção: padrão trovejante; círculo acima do 3º dá +1d8; teste de DES passa para metade', () => {
  const { enc, ilvan, dara, foes } = magoDoLote({ magias: ['glifoDeProtecao'], foes: [['bandidoMachadeiro', { x: 10, y: 6 }]] });
  ilvan.spellcasting.slots[4] = 1;
  ilvan.pos = { x: 2, y: 6 };
  assert.ok(enc.castSpell(ilvan, 'glifoDeProtecao', { point: { x: 3, y: 6 }, circulo: 4 }).ok);
  const z = enc.zonas.find((x) => x.spellId === 'glifoDeProtecao');
  assert.equal(z.glifo.tipo, 'trovejante');
  assert.equal(z.glifo.dados, '6d8');
  const foe = foes[0];
  foe.maxHp = foe.hp = 300;
  dara.pos = { x: 11, y: 11 };
  ilvan.pos = { x: 11, y: 0 };
  resistenciasDao(enc, true);
  enc.beginSide('foes');
  foe.pos = { x: 4, y: 6 };
  foe.movementLeftFt = 30;
  enc.moveAlong(foe, [{ x: 4, y: 6 }, { x: 3, y: 6 }]);
  const dano = 300 - foe.hp;
  assert.ok(dano >= 3 && dano <= 24, `metade de 6d8 (${dano})`);
});

// ---- armas na mão, salto e levantar --------------------------------------

teste('Só se ataca com a arma na mão; sacar é a interação gratuita, a segunda gasta a ação', () => {
  const { enc, h, foes } = comHeroi('clerigo', 1);
  h.weapons = ['espadaLonga', 'arcoLongo'];
  h.equippedWeapon = 'espadaLonga';
  h.shield = false;
  assert.ok(!enc.canAttack(h, foes[0], 'arcoLongo').ok, 'o arco está na bainha');
  assert.ok(enc.canAttack(h, foes[0], 'espadaLonga').ok);
  assert.equal(enc.sacarArma(h, 'arcoLongo').custo, 'interacao');
  assert.equal(h.equippedWeapon, 'arcoLongo');
  assert.equal(h.actionUsed, false);
  assert.equal(enc.sacarArma(h, 'espadaLonga').custo, 'acao');
  assert.equal(h.actionUsed, true);
  assert.ok(!enc.sacarArma(h, 'arcoLongo').ok, 'nada sobrou no turno');
});

teste('Sacar gastando a ação não queima a Ação Surpreendente', () => {
  const { enc, h, foes } = comHeroi('clerigo', 1);
  h.weapons = ['espadaLonga', 'adaga'];
  h.equippedWeapon = 'espadaLonga';
  h.extraActions = 1;
  enc.sacarArma(h, 'adaga');
  enc.sacarArma(h, 'espadaLonga');
  assert.equal(h.actionUsed, false, 'a ação extra voltou');
  assert.ok(enc.attackAction(h, foes[0], 'espadaLonga').ok);
});

teste('Mão vazia não trava: o ataque recusa com motivo', () => {
  const { enc, h, foes } = comHeroi('clerigo', 1);
  h.equippedWeapon = undefined;
  assert.equal(enc.canAttack(h, foes[0], null).ok, false);
  assert.equal(enc.attackAction(h, foes[0]).ok, false);
});

teste('Fim do combate: quem está acordado e caído se levanta', () => {
  const { enc, h, foes } = comHeroi('clerigo', 1);
  addCondition(h, 'caido');
  foes[0].dead = true;
  foes[0].hp = 0;
  enc.checkEnd();
  assert.ok(!hasCondition(h, 'caido'));
});

teste('Salto em distância por cima da tocaia: FOR em pés com corrida, metade parado', () => {
  const { enc, h } = comHeroi('clerigo', 1, { foes: [['goblin', { x: 11, y: 11 }]] });
  enc.field = new Battlefield(12, 12, [
    '............', '............', '............', '............', '............',
    '.....P......', '............', '............', '............', '............',
    '............', '............']);
  h.pos = { x: 4, y: 5, f: 1 };
  h.abilities.str = 14;
  h.movementLeftFt = 30;
  h.corridaFt = 0;
  assert.equal(enc.alcanceDoSalto(h), 7, 'parado: metade da Força');
  assert.equal(enc.destinosDoSalto(h).size, 0, 'parado não passa a tocaia');
  h.corridaFt = 10;
  assert.equal(enc.alcanceDoSalto(h), 14);
  assert.ok(enc.destinosDoSalto(h).has('6,5'), 'com corrida pousa do outro lado');
  d20Fixo(enc, 15);
  assert.ok(enc.pular(h, { x: 6, y: 5 }).ok);
  assert.deepEqual([h.pos.x, h.pos.y], [6, 5]);
  assert.equal(h.movementLeftFt, 20);
  assert.ok(!hasCondition(h, 'caido'));
});

teste('Salto: quem falha o Atletismo bate na tocaia e cai antes dela', () => {
  const { enc, h } = comHeroi('clerigo', 1, { foes: [['goblin', { x: 11, y: 11 }]] });
  enc.field = new Battlefield(12, 12, [
    '............', '............', '............', '............', '............',
    '.....P......', '............', '............', '............', '............',
    '............', '............']);
  h.pos = { x: 4, y: 5, f: 1 };
  h.movementLeftFt = 30;
  h.corridaFt = 10;
  d20Fixo(enc, 1);
  enc.pular(h, { x: 6, y: 5 });
  assert.deepEqual([h.pos.x, h.pos.y], [4, 5]);
  assert.ok(hasCondition(h, 'caido'));
});

// ---- magias de utilidade fora do combate (rules/utilidade.js) -------------------

import {
  estadoDe, conjurarFora, avancar, ativaDe, previsaoDeTeste, rolarTeste, melhorParaTeste, sondarMente,
  podeConjurarFora, infoDoItem, auraDe, UTIL_FORA, entendeIdiomas, chaveDoNpc,
} from '../rules/utilidade.js';

/** Grupo de nível 3 com as magias de utilidade que o teste pede (espaços cheios). */
function grupoDeUtilidade({ seed = 3, cantrips = [], prepared = [] } = {}) {
  const party = makeParty({ nivel: 3 });
  const brenn = party[2];
  const ilvan = party[3];
  for (const c of [brenn, ilvan]) {
    c.spellcasting.cantrips.push(...cantrips);
    c.spellcasting.prepared.push(...prepared);
  }
  brenn.pos = { x: 5, y: 5 };
  ilvan.pos = { x: 6, y: 5 };
  party[0].pos = { x: 4, y: 5 };
  party[1].pos = { x: 4, y: 6 };
  const campanha = {};
  const estado = estadoDe(campanha);
  const rng = makeRng(seed);
  const goblin = makeMonster('goblin', { x: 8, y: 5 });
  goblin.side = 'neutro';
  return { party, brenn, ilvan, dara: party[0], pip: party[1], estado, rng, goblin, ctx: { herois: party, rng } };
}

teste('UTIL: toda magia de utilidade existe, é SRD e o combate a recusa', () => {
  const { enc, party } = montar();
  for (const id of UTIL_FORA) {
    const s = SPELLS[id];
    assert.ok(s, id);
    assert.ok(['srd', 'propria'].includes(s.fonte), id);
  }
  const novas = Object.values(SPELLS).filter((s) => s.soFora);
  assert.ok(novas.length >= 17, `magias novas: ${novas.length}`);
  const ilvan = party[ILVAN];
  ilvan.spellcasting.cantrips.push('taumaturgia');
  const r = enc.canCast(ilvan, 'taumaturgia');
  assert.equal(r.ok, false);
  assert.match(r.why, /fora de combate/);
});

teste('conjurar fora: truque não gasta espaço; magia de círculo gasta e respeita o círculo', () => {
  const g = grupoDeUtilidade({ prepared: ['abrir'], cantrips: ['taumaturgia'] });
  const antes = g.ilvan.spellcasting.slots.slice();
  const r1 = conjurarFora(g.estado, g.ilvan, 'taumaturgia', g.ctx);
  assert.ok(r1.ok, r1.why);
  assert.deepEqual(g.ilvan.spellcasting.slots, antes, 'truque é de graça');
  const r2 = conjurarFora(g.estado, g.ilvan, 'abrir', g.ctx);
  assert.ok(r2.ok, r2.why);
  assert.equal(g.ilvan.spellcasting.slots[2], antes[2] - 1, 'gastou um espaço de 2º');
  g.ilvan.spellcasting.slots[2] = 0;
  const r3 = podeConjurarFora(g.ilvan, 'abrir');
  assert.equal(r3.ok, false);
  assert.match(r3.why, /sem espaço/);
});

teste('conjurar fora: o tempo anda — Taumaturgia (1 min) dá vantagem em Intimidação e acaba no relógio', () => {
  const g = grupoDeUtilidade({ cantrips: ['taumaturgia'] });
  const sem = previsaoDeTeste(g.estado, g.party, g.ilvan, 'intimidacao', 12);
  assert.equal(sem.vantagem, false);
  assert.ok(conjurarFora(g.estado, g.ilvan, 'taumaturgia', g.ctx).ok);
  const com = previsaoDeTeste(g.estado, g.party, g.ilvan, 'intimidacao', 12);
  assert.equal(com.vantagem, true);
  assert.ok(com.chance > sem.chance, 'a chance sobe com a vantagem');
  assert.equal(previsaoDeTeste(g.estado, g.party, g.brenn, 'intimidacao', 12).vantagem, false, 'só quem conjurou');
  assert.equal(previsaoDeTeste(g.estado, g.party, g.ilvan, 'persuasao', 12).vantagem, false, 'só Intimidação');
  avancar(g.estado, 0.5, g.party);
  assert.equal(previsaoDeTeste(g.estado, g.party, g.ilvan, 'intimidacao', 12).vantagem, true, 'meio minuto depois ainda vale');
  const fim = avancar(g.estado, 1, g.party);
  assert.equal(previsaoDeTeste(g.estado, g.party, g.ilvan, 'intimidacao', 12).vantagem, false);
  assert.ok(fim.some((t) => /Taumaturgia/.test(t)), fim.join('|'));
});

teste('conjurar fora: ritual não gasta espaço, leva 10 minutos a mais e cabe só a quem tem o ritual', () => {
  const g = grupoDeUtilidade();
  const antes = g.ilvan.spellcasting.slots.slice();
  const t0 = g.estado.minutos;
  const r = conjurarFora(g.estado, g.ilvan, 'detectarMagia', { ...g.ctx, ritual: true });
  assert.ok(r.ok, r.why);
  assert.deepEqual(g.ilvan.spellcasting.slots, antes);
  assert.equal(g.estado.minutos - t0, 10, 'ritual: +10 minutos');
  assert.equal(r.ativa.fim - r.ativa.inicio, 10, 'Detectar Magia dura 10 minutos depois');
  assert.equal(podeConjurarFora(g.dara, 'detectarMagia', { ritual: true }).ok, false);
  g.ilvan.spellcasting.cantrips.push('taumaturgia');
  assert.equal(podeConjurarFora(g.ilvan, 'taumaturgia', { ritual: true }).ok, false, 'Taumaturgia não é ritual');
});

teste('conjurar fora: concentração — a nova derruba a velha (Detectar Magia → Amizade)', () => {
  const g = grupoDeUtilidade({ cantrips: ['amizade'] });
  assert.ok(conjurarFora(g.estado, g.ilvan, 'detectarMagia', { ...g.ctx, ritual: true }).ok);
  assert.ok(ativaDe(g.estado, g.party, 'detectarMagia', { por: g.ilvan }));
  assert.equal(g.ilvan.concentrating.spellId, 'detectarMagia');
  const b = conjurarFora(g.estado, g.ilvan, 'amizade', { ...g.ctx, alvo: g.goblin });
  assert.ok(b.ok, b.why);
  assert.equal(ativaDe(g.estado, g.party, 'detectarMagia', { por: g.ilvan }), null, 'a primeira caiu');
  assert.equal(g.ilvan.concentrating.spellId, 'amizade');
  // Quem perde a concentração (dano na luta) perde a magia também.
  g.ilvan.concentrating = null;
  assert.equal(ativaDe(g.estado, g.party, 'amizade', { por: g.ilvan }), null);
});

teste('Luz fora do combate: vira condição do alvo, passa a luz para outro e acaba em 1 hora', () => {
  const g = grupoDeUtilidade({ cantrips: ['luz'] });
  assert.ok(conjurarFora(g.estado, g.ilvan, 'luz', { ...g.ctx, alvo: g.dara }).ok);
  assert.ok(hasCondition(g.dara, 'luzMagica'));
  assert.ok(conjurarFora(g.estado, g.ilvan, 'luz', { ...g.ctx, alvo: g.pip }).ok);
  assert.ok(!hasCondition(g.dara, 'luzMagica'), 'a luz mudou de mãos');
  assert.ok(hasCondition(g.pip, 'luzMagica'));
  avancar(g.estado, 59, g.party);
  assert.ok(hasCondition(g.pip, 'luzMagica'), 'aos 59 minutos ainda brilha');
  avancar(g.estado, 2, g.party);
  assert.ok(!hasCondition(g.pip, 'luzMagica'));
});

teste('Visão no Escuro, Passo sem Rastro e Aprimorar Atributo fora do combate: condições com relógio', () => {
  const g = grupoDeUtilidade({ prepared: ['visaoNoEscuro', 'passoSemRastro', 'aprimorarAtributo'] });
  g.ilvan.spellcasting.slots[2] = 4;
  assert.ok(conjurarFora(g.estado, g.ilvan, 'visaoNoEscuro', { ...g.ctx, alvo: g.dara }).ok);
  assert.ok(visaoNoEscuro(g.dara) >= 60);
  const bonusAntes = skillBonus(g.pip, 'furtividade');
  const rastro = conjurarFora(g.estado, g.ilvan, 'passoSemRastro', g.ctx);
  assert.ok(rastro.ok, rastro.why);
  assert.ok(hasCondition(g.pip, 'semRastro'));
  assert.equal(skillBonus(g.pip, 'furtividade'), bonusAntes + 10);
  // Aprimorar Atributo (Esplendor da Águia) dá vantagem em Persuasão a quem o recebeu.
  g.brenn.spellcasting.slots[2] = 2;
  assert.ok(conjurarFora(g.estado, g.brenn, 'aprimorarAtributo', { ...g.ctx, alvo: g.dara, opcao: 'aguia' }).ok);
  assert.equal(previsaoDeTeste(g.estado, g.party, g.dara, 'persuasao', 12).vantagem, true);
  assert.equal(previsaoDeTeste(g.estado, g.party, g.dara, 'atletismo', 12).vantagem, false);
  avancar(g.estado, 61, g.party);
  assert.ok(!hasCondition(g.dara, 'aprimorado'));
  assert.ok(!hasCondition(g.pip, 'semRastro'));
  assert.ok(hasCondition(g.dara, 'visaoNoEscuro'), 'Visão no Escuro dura 8 horas');
  avancar(g.estado, 8 * 60, g.party);
  assert.ok(!hasCondition(g.dara, 'visaoNoEscuro'));
});

teste('Orientação fora do combate: soma 1d4 no PRÓXIMO teste de perícia e acaba', () => {
  const g = grupoDeUtilidade({ cantrips: ['orientacao'] });
  assert.ok(conjurarFora(g.estado, g.brenn, 'orientacao', { ...g.ctx, alvo: g.dara }).ok);
  const p = previsaoDeTeste(g.estado, g.party, g.dara, 'atletismo', 15);
  assert.deepEqual(p.bonusDado, ['1d4']);
  const r = rolarTeste(g.estado, g.party, g.rng, g.dara, 'atletismo', 15);
  assert.ok(!hasCondition(g.dara, 'orientado'), 'consumida');
  assert.equal(ativaDe(g.estado, g.party, 'orientacao'), null);
  assert.ok(r.total >= 2 + skillBonus(g.dara, 'atletismo'));
  assert.equal(g.brenn.concentrating, null, 'a concentração acabou junto');
});

teste('Amizade: vantagem em Carisma contra ele; quando acaba, ele fica hostil e os testes sociais pioram', () => {
  const g = grupoDeUtilidade({ cantrips: ['amizade'] });
  assert.ok(conjurarFora(g.estado, g.ilvan, 'amizade', { ...g.ctx, alvo: g.goblin }).ok);
  assert.equal(previsaoDeTeste(g.estado, g.party, g.ilvan, 'persuasao', 12, { npc: g.goblin }).vantagem, true);
  const outro = makeMonster('goblin', { x: 9, y: 9 });
  assert.equal(previsaoDeTeste(g.estado, g.party, g.ilvan, 'persuasao', 12, { npc: outro }).vantagem, false);
  assert.equal(previsaoDeTeste(g.estado, g.party, g.ilvan, 'atletismo', 12, { npc: g.goblin }).vantagem, false);
  avancar(g.estado, 2, g.party);
  const depois = previsaoDeTeste(g.estado, g.party, g.ilvan, 'persuasao', 12, { npc: g.goblin });
  assert.equal(depois.desvantagem, true, 'agora ele está hostil');
  assert.equal(g.estado.npcs[chaveDoNpc(g.goblin)].ressentido, 'hostil');
  const inimigo = makeMonster('goblin', { x: 8, y: 6 });
  inimigo.emLuta = true;
  assert.equal(conjurarFora(g.estado, g.ilvan, 'amizade', { ...g.ctx, alvo: inimigo }).ok, false, 'em luta, não');
});

teste('Sugestão e Enfeitiçar Pessoa: a CD de SAB do alvo decide; Sugestão cumpre o próximo teste social', () => {
  const g = grupoDeUtilidade({ prepared: ['sugestao', 'enfeiticarPessoa'] });
  g.ilvan.spellcasting.slots[2] = 9;
  g.ilvan.spellcasting.slots[1] = 9;
  g.goblin.abilities.wis = 1;                      // nunca resiste
  const s = conjurarFora(g.estado, g.ilvan, 'sugestao', { ...g.ctx, alvo: g.goblin });
  assert.ok(s.ok && !s.resultado.resistiu, JSON.stringify(s.resultado));
  const p = previsaoDeTeste(g.estado, g.party, g.dara, 'persuasao', 30, { npc: g.goblin });
  assert.equal(p.chance, 1, 'o teste social é cumprido');
  const r = rolarTeste(g.estado, g.party, g.rng, g.dara, 'persuasao', 30, { npc: g.goblin });
  assert.equal(r.passou, true);
  assert.equal(ativaDe(g.estado, g.party, 'sugestao', { npc: g.goblin }), null, 'a sugestão vale uma vez');
  const forte = makeMonster('goblin', { x: 8, y: 6 });
  forte.abilities.wis = 80;
  const antes = g.ilvan.spellcasting.slots[1];
  const e = conjurarFora(g.estado, g.ilvan, 'enfeiticarPessoa', { ...g.ctx, alvo: forte });
  assert.ok(e.ok && e.resultado.resistiu);
  assert.equal(g.ilvan.spellcasting.slots[1], antes - 1);
  assert.equal(ativaDe(g.estado, g.party, 'enfeiticarPessoa', { npc: forte }), null);
  assert.ok(!g.estado.npcs[chaveDoNpc(forte)]?.ressentido, 'pelo livro, quem resiste não fica marcado');
  const fera = makeMonster('lobo', { x: 8, y: 7 });
  assert.equal(conjurarFora(g.estado, g.ilvan, 'enfeiticarPessoa', { ...g.ctx, alvo: fera }).ok, false, 'só humanoides');
});

teste('Detectar Pensamentos: sondar a mente deixa a conversa mais fácil, e resistir fecha a mente', () => {
  const g = grupoDeUtilidade({ prepared: ['detectarPensamentos'] });
  g.ilvan.spellcasting.slots[2] = 9;
  assert.equal(sondarMente(g.estado, g.party, g.ilvan, g.goblin, g.rng).ok, false, 'sem a magia ativa');
  assert.ok(conjurarFora(g.estado, g.ilvan, 'detectarPensamentos', g.ctx).ok);
  g.goblin.abilities.wis = 1;
  const r = sondarMente(g.estado, g.party, g.ilvan, g.goblin, g.rng);
  assert.ok(r.leu && r.percebeu, 'quem falha também percebe que lhe leram a mente');
  assert.ok(ativaDe(g.estado, g.party, 'detectarPensamentos', { por: g.ilvan }), 'leu: a magia continua');
  assert.equal(previsaoDeTeste(g.estado, g.party, g.dara, 'persuasao', 12, { npc: g.goblin }).vantagem, true, 'sabe o que ele quer ouvir');
  const duro = makeMonster('goblin', { x: 8, y: 6 });
  duro.abilities.wis = 80;
  const f = sondarMente(g.estado, g.party, g.ilvan, duro, g.rng);
  assert.ok(f.percebeu && !f.leu && f.terminou);
  assert.equal(ativaDe(g.estado, g.party, 'detectarPensamentos', { por: g.ilvan }), null, 'passou na SAB: a magia termina');
  assert.ok(conjurarFora(g.estado, g.ilvan, 'detectarPensamentos', g.ctx).ok);
  assert.ok(sondarMente(g.estado, g.party, g.ilvan, duro, g.rng).jaFechada);
  // INT 3 ou menos e quem não fala: não funciona.
  const fera = makeMonster('goblin', { x: 8, y: 7 });
  fera.abilities.int = 2;
  assert.match(sondarMente(g.estado, g.party, g.ilvan, fera, g.rng).why, /Inteligência/);
  const mudo = makeMonster('goblin', { x: 8, y: 8 });
  mudo.semIdioma = true;
  assert.equal(sondarMente(g.estado, g.party, g.ilvan, mudo, g.rng).ok, false);
});

teste('Ritual sem preparar: só o mago; o clérigo só conjura Detectar Magia se a tiver preparada', () => {
  const g = grupoDeUtilidade();
  assert.ok(!g.brenn.spellcasting.rituais, 'sem lista de rituais no clérigo');
  assert.ok(g.brenn.spellcasting.lista.includes('detectarMagia'), 'ele pode prepará-la da lista da classe');
  assert.equal(podeConjurarFora(g.brenn, 'detectarMagia', { ritual: true }).ok, false, 'não preparada: nada de ritual');
  g.brenn.spellcasting.prepared.push('detectarMagia');
  assert.equal(podeConjurarFora(g.brenn, 'detectarMagia', { ritual: true }).ok, true, 'preparada: ritual sem espaço');
  g.brenn.spellcasting.prepared = g.brenn.spellcasting.prepared.filter((i) => i !== 'detectarMagia');
  assert.equal(podeConjurarFora(g.brenn, 'detectarMagia', { ritual: true }).ok, false, 'não preparada: nada de ritual');
  g.brenn.spellcasting.livro = ['detectarMagia'];
  assert.equal(podeConjurarFora(g.brenn, 'detectarMagia', { ritual: true }).ok, false, 'livro não é de clérigo');
  assert.equal(podeConjurarFora(g.ilvan, 'detectarMagia', { ritual: true }).ok, true, 'o mago a conjura do grimório');
});

teste('Concentração do combate não vaza: conjurar Luzes Dançantes fora desfaz a Bênção', () => {
  const { enc, party } = montar();
  const brenn = party[BRENN];
  brenn.pos = { x: 3, y: 3 };
  party[DARA].pos = { x: 3, y: 4 };
  brenn.spellcasting.cantrips.push('luzesDancantes');
  assert.ok(enc.castSpell(brenn, 'bencao').ok);
  assert.ok(hasCondition(party[DARA], 'abencoado'));
  const estado = estadoDe({});
  const r = conjurarFora(estado, brenn, 'luzesDancantes', { herois: party, rng: makeRng(2), enc });
  assert.ok(r.ok, r.why);
  assert.ok(!hasCondition(party[DARA], 'abencoado'), 'a Bênção acabou');
  assert.equal(brenn.concentrating.spellId, 'luzesDancantes');
  // Sem encontro (vila), a condição também sai.
  const g = grupoDeUtilidade({ cantrips: ['luzesDancantes'] });
  g.brenn.spellcasting.slots[1] = 3;
  g.dara.conditions.push({ id: 'abencoado', rounds: 10 });
  g.brenn.concentrating = { spellId: 'bencao', condition: 'abencoado', targets: [g.dara], rounds: 10 };
  assert.ok(conjurarFora(g.estado, g.brenn, 'luzesDancantes', g.ctx).ok);
  assert.ok(!hasCondition(g.dara, 'abencoado'));
});

teste('Amizade recusa quem já está hostil; Falar com os Mortos recusa morto-vivo e passa de 10 dias', () => {
  const g = grupoDeUtilidade({ cantrips: ['amizade'], prepared: ['falarComOsMortos'] });
  g.estado.npcs[chaveDoNpc(g.goblin)] = { ressentido: 'hostil' };
  const a = conjurarFora(g.estado, g.ilvan, 'amizade', { ...g.ctx, alvo: g.goblin });
  assert.equal(a.ok, false);
  assert.match(a.why, /hostil/);
  g.ilvan.spellcasting.slots[3] = 3;
  const zumbi = makeMonster('zumbi', { x: 6, y: 6 });
  zumbi.dead = true;
  const antes = g.ilvan.spellcasting.slots[3];
  const z = conjurarFora(g.estado, g.ilvan, 'falarComOsMortos', { ...g.ctx, alvo: zumbi });
  assert.equal(z.ok, false);
  assert.equal(g.ilvan.spellcasting.slots[3], antes, 'recusou antes de gastar');
  const corpo = makeMonster('goblin', { x: 6, y: 7 });
  corpo.dead = true;
  assert.ok(conjurarFora(g.estado, g.ilvan, 'falarComOsMortos', { ...g.ctx, alvo: corpo }).ok);
  assert.equal(g.estado.mortosFalados[0].id, chaveDoNpc(corpo));
  assert.equal(conjurarFora(g.estado, g.ilvan, 'falarComOsMortos', { ...g.ctx, alvo: corpo }).ok, false);
  g.estado.minutos += 14400;
  assert.ok(conjurarFora(g.estado, g.ilvan, 'falarComOsMortos', { ...g.ctx, alvo: corpo }).ok, 'liberado após 10 dias');
});

teste('Luzes Dançantes: só penumbra em 3 m, sem luz clara', () => {
  const g = grupoDeUtilidade({ cantrips: ['luzesDancantes'] });
  assert.ok(conjurarFora(g.estado, g.ilvan, 'luzesDancantes', g.ctx).ok);
  const enc = { combatants: g.party, field: { w: 12, h: 12, luz: new Uint8Array(144), luzes: [] }, zonas: [] };
  const f = fontesDeLuz(enc).find((x) => x.pos === g.ilvan.pos);
  assert.ok(f, 'emite luz');
  assert.equal(nivelDeLuz(enc.field, g.ilvan.pos.x, g.ilvan.pos.y, [f]), PENUMBRA, 'na própria casa só penumbra');
  assert.equal(nivelDeLuz(enc.field, g.ilvan.pos.x + 2, g.ilvan.pos.y, [f]), PENUMBRA, 'a 3 m (2 casas)');
  assert.equal(nivelDeLuz(enc.field, g.ilvan.pos.x + 3, g.ilvan.pos.y, [f]), ESCURO, 'a 4,5 m já é escuro');
});

teste('Falar com os Mortos: um cadáver só responde uma vez; Compreender Idiomas e Falar com Animais ficam de pé', () => {
  const g = grupoDeUtilidade({ prepared: ['falarComOsMortos'] });
  g.ilvan.spellcasting.slots[3] = 2;
  const corpo = makeMonster('goblin', { x: 6, y: 6 });
  assert.equal(conjurarFora(g.estado, g.ilvan, 'falarComOsMortos', { ...g.ctx, alvo: corpo }).ok, false, 'vivo não fala');
  corpo.dead = true;
  const r = conjurarFora(g.estado, g.ilvan, 'falarComOsMortos', { ...g.ctx, alvo: corpo });
  assert.ok(r.ok, r.why);
  assert.equal(g.ilvan.spellcasting.slots[3], 1);
  const denovo = conjurarFora(g.estado, g.ilvan, 'falarComOsMortos', { ...g.ctx, alvo: corpo });
  assert.equal(denovo.ok, false);
  assert.match(denovo.why, /já falou/);
  assert.ok(conjurarFora(g.estado, g.ilvan, 'compreenderIdiomas', { ...g.ctx, ritual: true }).ok);
  assert.ok(entendeIdiomas(g.estado, g.party));
  avancar(g.estado, 61, g.party);
  assert.ok(!entendeIdiomas(g.estado, g.party));
  g.brenn.spellcasting.prepared.push('falarComAnimais');
  g.brenn.spellcasting.slots[1] = 4;
  assert.ok(conjurarFora(g.estado, g.brenn, 'falarComAnimais', g.ctx).ok);
  assert.equal(previsaoDeTeste(g.estado, g.party, g.brenn, 'lidarComAnimais', 12).vantagem, true);
});

teste('Identificar e Detectar Magia: a mochila responde (poção, pergaminho) e o anel de sinete não é mágico', () => {
  const g = grupoDeUtilidade();
  g.dara.bag = [{ id: 'pocaoDeInvisibilidade', tipo: 'item', qtd: 1 }, { id: 'anelDePlatina', tipo: 'item', qtd: 1 }, { id: 'pergaminhoDeAuguro', tipo: 'item', qtd: 1 }];
  assert.equal(auraDe('anelDePlatina'), null);
  assert.equal(auraDe('pocaoDeInvisibilidade').escola, 'ilusão');
  const dm = conjurarFora(g.estado, g.ilvan, 'detectarMagia', { ...g.ctx, ritual: true });
  assert.ok(dm.ok);
  assert.deepEqual(dm.resultado.mochila.map((m) => m.id).sort(), ['pergaminhoDeAuguro', 'pocaoDeInvisibilidade']);
  const id = conjurarFora(g.estado, g.ilvan, 'identificar', { ...g.ctx, ritual: true, alvo: { id: 'anelDePlatina' } });
  assert.ok(id.ok, id.why);
  assert.equal(id.resultado.info.magico, false);
  assert.ok(g.estado.identificados.includes('anelDePlatina'));
  assert.equal(infoDoItem('pocaoDeInvisibilidade').magico, true);
});

teste('Prestidigitação acende a tocha; Druidismo prevê o tempo; Oração de Cura cura fora do combate em 10 minutos', () => {
  const g = grupoDeUtilidade({ cantrips: ['prestidigitacao', 'arteDruidica'] });
  const t0 = g.estado.minutos;
  assert.ok(!g.dara.tochaAcesa);
  const p = conjurarFora(g.estado, g.ilvan, 'prestidigitacao', { ...g.ctx, opcao: 'tocha', alvo: g.dara });
  assert.ok(p.ok, p.why);
  assert.equal(g.dara.tochaAcesa, true);
  const c = conjurarFora(g.estado, g.ilvan, 'arteDruidica', { ...g.ctx, opcao: 'clima' });
  assert.ok(c.ok && typeof c.resultado.truque.clima === 'string');
  g.brenn.spellcasting.prepared.push('oracaoDeCura');
  g.dara.hp = 1;
  const o = conjurarFora(g.estado, g.brenn, 'oracaoDeCura', g.ctx);
  assert.ok(o.ok, o.why);
  assert.ok(g.dara.hp > 1);
  assert.equal(g.brenn.spellcasting.slots[2], 1);
  assert.ok(g.estado.minutos - t0 >= 10);
});

teste('conjurar fora: caído ou incapacitado não conjura', () => {
  const g = grupoDeUtilidade({ cantrips: ['taumaturgia'] });
  addCondition(g.ilvan, 'paralisado');
  assert.equal(conjurarFora(g.estado, g.ilvan, 'taumaturgia', g.ctx).ok, false);
  const h = grupoDeUtilidade({ cantrips: ['taumaturgia'] });
  h.ilvan.hp = 0;
  assert.equal(conjurarFora(h.estado, h.ilvan, 'taumaturgia', h.ctx).ok, false);
});

teste('melhorParaTeste escolhe quem tem a melhor chance, com a vantagem da magia', () => {
  const g = grupoDeUtilidade({ cantrips: ['taumaturgia'] });
  for (const h of g.party) h.abilities.cha = 8;
  g.brenn.abilities.cha = 10;
  g.ilvan.abilities.cha = 8;
  assert.ok(conjurarFora(g.estado, g.ilvan, 'taumaturgia', g.ctx).ok);
  const m = melhorParaTeste(g.estado, g.party, 'intimidacao', 14);
  assert.equal(m.quem, g.ilvan, 'a vantagem pesa mais que +0/+1 de diferença');
});

// ---- lote 13: criaturas invocadas aliadas, Piscar, Levitação, Círculo Mágico ----

/** Passa a vez do grupo e a dos inimigos (sem eles agirem), voltando ao grupo. */
function passarUmaRodada(enc) {
  for (const c of enc.allOf('party')) if (!c.acted) enc.endTurn(c);
  for (const c of enc.allOf('foes')) if (!c.acted) enc.endTurn(c);
}

teste('Conjurar Animais: as feras entram do lado do grupo, sem XP, e o jogador as comanda no turno seguinte', () => {
  const { enc, ilvan, foes } = magoDoLote({ magias: ['conjurarAnimais'] });
  const r = enc.castSpell(ilvan, 'conjurarAnimais', { opcao: 'nd1' });
  assert.ok(r.ok, r.why);
  const lobos = enc.combatants.filter((c) => c.invocado);
  assert.equal(lobos.length, 2, 'o pacote de ND 1 são 2 feras');
  assert.ok(lobos.every((c) => c.side === 'party' && c.xp === 0 && c.defId === 'loboAtroz'));
  assert.notEqual(lobos[0].name, lobos[1].name, 'nomes numerados para não confundir');
  assert.ok(lobos.every((c) => c.acted && c.actionUsed), 'entram com o turno gasto');
  assert.ok(ilvan.concentrating?.spellId === 'conjurarAnimais');
  // Inimigos as escolhem como alvo.
  assert.ok(enc.enemiesOf(foes[0]).includes(lobos[0]));
  // No turno seguinte, agem como um herói: o jogador as seleciona, move e ataca.
  passarUmaRodada(enc);
  assert.ok(!lobos[0].acted && lobos[0].movementLeftFt > 0 && !lobos[0].actionUsed);
  foes[0].pos = { x: lobos[0].pos.x + 1, y: lobos[0].pos.y };
  const hp = foes[0].hp;
  const golpe = enc.attackAction(lobos[0], foes[0], lobos[0].attacks[0].name);
  assert.ok(golpe.ok, golpe.why);
  assert.ok(lobos[0].actionUsed);
  // A IA aliada (para quem quiser jogá-las sozinhas) usa o mesmo caminho dos monstros.
  takeMonsterTurn(enc, lobos[1]);
  assert.ok(lobos[1].acted);
  assert.ok(foes[0].hp <= hp);
});

teste('Conjurar Animais: pacotes e círculo alto (5º dobra); a concentração que cai leva as feras junto', () => {
  const { enc, ilvan } = magoDoLote({ magias: ['conjurarAnimais'] });
  ilvan.spellcasting.slots[5] = 1;
  assert.ok(enc.castSpell(ilvan, 'conjurarAnimais', { opcao: 'nd14', circulo: 5 }).ok);
  assert.equal(enc.combatants.filter((c) => c.invocado).length, 16, '8 lobos dobram para 16 no 5º círculo');
  enc.dropConcentration(ilvan);
  assert.equal(enc.combatants.filter((c) => c.invocado).length, 0);
  liberarAcao(ilvan);
  assert.ok(enc.castSpell(ilvan, 'conjurarAnimais', { opcao: 'nd2' }).ok);
  const urso = enc.combatants.find((c) => c.invocado);
  assert.equal(urso.defId, 'tigreDenteDeSabre');
  // Dano que derruba o conjurador desfaz a magia.
  enc.applyDamage(ilvan, 999, 'contundente');
  assert.equal(enc.combatants.filter((c) => c.invocado).length, 0);
});

teste('Conjurar Animais: não segura a derrota, não vale XP e some quando o encontro acaba', () => {
  const { enc, party, ilvan } = magoDoLote({ magias: ['conjurarAnimais'] });
  enc.castSpell(ilvan, 'conjurarAnimais', { opcao: 'nd1' });
  const lobos = enc.combatants.filter((c) => c.invocado);
  for (const h of party) { h.hp = 0; addCondition(h, 'inconsciente'); h.deathSaves = { successes: 0, failures: 0 }; }
  enc.checkEnd();
  assert.equal(enc.outcome, 'derrota', 'os lobos em pé não impedem a derrota');
  assert.equal(enc.combatants.filter((c) => c.invocado).length, 0, 'sumiram com o encontro');
  // Vitória: matar o único inimigo basta; as feras não contam para nada.
  const m = magoDoLote({ magias: ['conjurarAnimais'] });
  m.enc.castSpell(m.ilvan, 'conjurarAnimais', { opcao: 'nd1' });
  m.enc.applyDamage(m.foes[0], 999, 'contundente');
  assert.equal(m.enc.outcome, 'vitoria');
  assert.equal(m.enc.combatants.filter((c) => c.invocado).length, 0);
  assert.ok(lobos.every((l) => l.xp === 0));
});

teste('Conjurar Animais: Dissipar Magia numa fera encerra a magia; Revivificar não a traz de volta', () => {
  const { enc, ilvan, dara } = magoDoLote({ magias: ['conjurarAnimais', 'dissiparMagia', 'revivificar'] });
  enc.castSpell(ilvan, 'conjurarAnimais', { opcao: 'nd1' });
  const lobos = enc.combatants.filter((c) => c.invocado);
  lobos[0].hp = 0; lobos[0].dead = true; lobos[0].morreuNaRodada = enc.round;
  dara.pos = { ...lobos[0].pos };
  assert.match(enc.porqueNaoAlvo(dara, getSpell('revivificar'), lobos[0]) ?? '', /invocadas/);
  liberarAcao(ilvan);
  ilvan.pos = { x: lobos[1].pos.x - 1, y: lobos[1].pos.y };
  const r = enc.castSpell(ilvan, 'dissiparMagia', { target: lobos[1] });
  assert.ok(r.ok, r.why);
  assert.equal(enc.combatants.filter((c) => c.invocado).length, 0);
  assert.equal(ilvan.concentrating, null);
});

teste('Animar os Mortos: ergue um esqueleto ou zumbi do cadáver humanoide, uma vez só; herói e invocado não servem', () => {
  const { enc, party, ilvan, foes } = magoDoLote({ magias: ['animarMortos'], foes: [['goblin', { x: 7, y: 6 }], ['bandidoMachadeiro', { x: 11, y: 11 }]] });
  const cadaver = foes[0];
  assert.match(enc.porqueNaoAlvo(ilvan, getSpell('animarMortos'), cadaver) ?? '', /não é um cadáver/);
  enc.applyDamage(cadaver, 999, 'contundente');
  assert.ok(cadaver.dead);
  assert.equal(enc.castSpell(ilvan, 'animarMortos', { target: party[DARA] }).ok, false);
  const r = enc.castSpell(ilvan, 'animarMortos', { target: cadaver, opcao: 'zumbi' });
  assert.ok(r.ok, r.why);
  const zumbi = enc.combatants.find((c) => c.invocado);
  assert.equal(zumbi.defId, 'zumbi');
  assert.equal(zumbi.side, 'party');
  assert.deepEqual({ x: zumbi.pos.x, y: zumbi.pos.y }, { x: cadaver.pos.x, y: cadaver.pos.y }, 'surge onde o corpo estava');
  assert.equal(cadaver.reerguido, true);
  assert.equal(ilvan.concentrating, null, 'não é concentração');
  liberarAcao(ilvan);
  assert.match(enc.castSpell(ilvan, 'animarMortos', { target: cadaver }).why ?? '', /já foi erguido/);
  zumbi.dead = true;
  assert.match(enc.porqueNaoAlvo(ilvan, getSpell('animarMortos'), zumbi) ?? '', /invocada/);
  // Fica até o fim do encontro, mesmo sem o conjurador.
  assert.ok(enc.combatants.includes(zumbi));
});

teste('Animar os Mortos: círculo alto ergue mais mortos dos corpos próximos', () => {
  const { enc, ilvan, foes } = magoDoLote({ magias: ['animarMortos'], foes: [['goblin', { x: 7, y: 6 }], ['goblin', { x: 7, y: 7 }], ['goblin', { x: 6, y: 7 }], ['bandidoMachadeiro', { x: 11, y: 11 }]] });
  for (const f of foes.slice(0, 3)) enc.applyDamage(f, 999, 'contundente');
  ilvan.spellcasting.slots[4] = 1;
  const r = enc.castSpell(ilvan, 'animarMortos', { target: foes[0], opcao: 'esqueleto', circulo: 4 });
  assert.ok(r.ok, r.why);
  assert.equal(enc.combatants.filter((c) => c.invocado).length, 3, '4º círculo: 1 + 2');
});

teste('Piscar: d20 11+ no fim do turno manda para o Plano Etéreo até o começo do turno seguinte', () => {
  const { enc, ilvan, foes } = magoDoLote({ magias: ['piscar'], foes: [['goblin', { x: 8, y: 6 }]] });
  assert.ok(enc.castSpell(ilvan, 'piscar').ok);
  assert.ok(hasCondition(ilvan, 'piscando'));
  d20Fixo(enc, 5);
  passarUmaRodada(enc);
  assert.ok(!hasCondition(ilvan, 'etereo'), '5 não pisca');
  d20Fixo(enc, 15);
  for (const c of enc.allOf('party')) enc.endTurn(c);
  assert.ok(hasCondition(ilvan, 'etereo'), '15 pisca');
  assert.equal(enc.side, 'foes');
  const foe = foes[0];
  assert.ok(!enc.enemiesOf(foe).includes(ilvan), 'não é alvo da IA');
  assert.equal(enc.canAttack(foe, ilvan).ok, false);
  const hp = ilvan.hp;
  enc.applyDamage(ilvan, 10, 'fogo', foe);
  assert.equal(ilvan.hp, hp, 'nada o atinge');
  assert.equal(enc.at(ilvan.pos.x, ilvan.pos.y), undefined, 'não ocupa a casa');
  assert.ok(enc.porqueNaoAlvo(foe, getSpell('raioDeFogo'), ilvan));
  for (const c of enc.allOf('foes')) enc.endTurn(c);
  assert.ok(!hasCondition(ilvan, 'etereo'), 'volta no começo do turno do grupo');
  assert.deepEqual({ x: ilvan.pos.x, y: ilvan.pos.y }, { x: 6, y: 6 });
  assert.ok(ilvan.movementLeftFt > 0 && !ilvan.actionUsed, 'e age normalmente');
});

teste('Piscar: volta para a casa livre mais próxima se a de origem foi ocupada', () => {
  const { enc, ilvan, foes } = magoDoLote({ magias: ['piscar'], foes: [['goblin', { x: 9, y: 6 }]] });
  enc.castSpell(ilvan, 'piscar');
  d20Fixo(enc, 20);
  for (const c of enc.allOf('party')) enc.endTurn(c);
  assert.ok(hasCondition(ilvan, 'etereo'));
  foes[0].pos = { x: 6, y: 6 };
  for (const c of enc.allOf('foes')) enc.endTurn(c);
  assert.ok(!hasCondition(ilvan, 'etereo'));
  assert.ok(distanceFt(ilvan.pos, { x: 6, y: 6 }) <= 10 && distanceFt(ilvan.pos, foes[0].pos) > 0, 'a casa ocupada ficou com o goblin');
});

teste('Levitação: o alvo sobe e não anda; corpo a corpo do chão não o alcança; o conjurador o move 6 m; concentração que cai o derruba', () => {
  const { enc, ilvan, dara, foes } = magoDoLote({ magias: ['levitacao'], foes: [['bandidoMachadeiro', { x: 8, y: 5 }]] });
  dara.pos = { x: 7, y: 6 };
  const foe = foes[0];
  assert.ok(enc.canAttack(foe, dara).ok, 'antes, alcança');
  const r = enc.castSpell(ilvan, 'levitacao', { target: dara });
  assert.ok(r.ok, r.why);
  assert.ok(hasCondition(dara, 'levitando'));
  assert.equal(enc.speedOf(dara), 0, 'não anda sozinho');
  assert.equal(enc.canAttack(foe, dara).ok, false, 'o corpo a corpo não alcança');
  assert.equal(enc.canAttack(dara, foe).ok, false, 'e ele não alcança o chão (arma de perto)');
  // Quem voa também chega lá.
  addCondition(foe, 'voando');
  assert.ok(enc.canAttack(foe, dara).ok);
  tirarCondicao(foe, 'voando');
  // A ação do conjurador o leva até 6 m.
  liberarAcao(ilvan);
  assert.equal(enc.castSpell(ilvan, 'levitacao', { point: { x: 7, y: 11 } }).ok, false, 'mais de 6 m');
  const m = enc.castSpell(ilvan, 'levitacao', { point: { x: 4, y: 7 } });
  assert.ok(m.ok, m.why);
  assert.deepEqual({ x: dara.pos.x, y: dara.pos.y }, { x: 4, y: 7 });
  // A magia cai: ele cai, leva 2d6 e fica caído.
  const hp = dara.hp;
  enc.dropConcentration(ilvan);
  assert.ok(!hasCondition(dara, 'levitando') && hasCondition(dara, 'caido'));
  assert.ok(dara.hp < hp, 'dano de queda');
});

teste('Levitação num inimigo: CON resiste; quem falha fica pendurado e perde o corpo a corpo; Grande pesa demais', () => {
  const { enc, ilvan, dara, foes } = magoDoLote({ magias: ['levitacao'], foes: [['bandidoMachadeiro', { x: 8, y: 6 }], ['ogro', { x: 10, y: 10 }]] });
  const [bandido, ogro] = foes;
  assert.match(enc.porqueNaoAlvo(ilvan, getSpell('levitacao'), ogro) ?? '', /pesado demais/);
  d20Fixo(enc, 20);
  assert.ok(enc.castSpell(ilvan, 'levitacao', { target: bandido }).ok);
  assert.ok(!hasCondition(bandido, 'levitando'), 'passou na CON');
  assert.equal(ilvan.concentrating, null);
  liberarAcao(ilvan);
  d20Fixo(enc, 1);
  assert.ok(enc.castSpell(ilvan, 'levitacao', { target: bandido }).ok);
  assert.ok(hasCondition(bandido, 'levitando'), 'falhou');
  dara.pos = { x: 7, y: 6 };
  assert.equal(enc.canAttack(bandido, dara).ok, false);
  assert.equal(enc.reachableFor(bandido).size <= 1, true, 'preso no ar');
});

teste('Círculo Mágico: o tipo escolhido não entra, ataca com desvantagem e não amedronta quem está dentro', () => {
  const { enc, party, ilvan, dara, foes } = magoDoLote({ magias: ['circuloMagico'], foes: [['esqueleto', { x: 11, y: 6 }], ['goblin', { x: 11, y: 8 }]] });
  const [esq, gob] = foes;
  ilvan.pos = { x: 5, y: 6 };
  dara.pos = { x: 6, y: 6 };
  const r = enc.castSpell(ilvan, 'circuloMagico', { point: { x: 6, y: 6 }, opcao: 'morto-vivo' });
  assert.ok(r.ok, r.why);
  const z = enc.zonas.find((q) => q.circuloMagico);
  assert.equal(z.circuloMagico.tipo, 'morto-vivo');
  assert.ok(z.casas.has('6,6') && z.casas.has('8,6') && !z.casas.has('9,6'), 'raio de 3 m = 2 casas');
  // O esqueleto não entra.
  esq.movementLeftFt = 60;
  const alcance = enc.reachableFor(esq);
  assert.ok(!alcance.has('8,6') && !alcance.has('6,6'), 'casas do círculo fora do alcance');
  assert.ok(alcance.has('10,6'), 'fora dele anda');
  gob.movementLeftFt = 60;
  assert.ok(enc.reachableFor(gob).has('8,7') || enc.reachableFor(gob).has('8,6'), 'goblin entra');
  // Desvantagem contra quem está dentro; fora do círculo, não.
  assert.ok(JSON.stringify(enc.attackModifiers(esq, dara)).includes('círculo mágico'));
  assert.ok(!JSON.stringify(enc.attackModifiers(esq, party[PIP])).includes('círculo mágico'));
  assert.ok(!JSON.stringify(enc.attackModifiers(gob, dara)).includes('círculo mágico'), 'só o tipo escolhido');
  // Medo e encanto de fora não pegam quem está dentro.
  assert.equal(enc.aplicarCondicao(dara, 'amedrontado', { source: esq.id }), null);
  assert.ok(enc.aplicarCondicao(dara, 'amedrontado', { source: gob.id }), 'o goblin amedronta');
  // Quem já estava dentro sai andando.
  esq.pos = { x: 7, y: 6 };
  esq.movementLeftFt = 30;
  assert.ok(enc.reachableFor(esq).has('10,6'));
});

teste('Círculo Mágico: sem tipo escolhido, vale o tipo mais comum entre os inimigos', () => {
  const { enc, ilvan } = magoDoLote({ magias: ['circuloMagico'], foes: [['zumbi', { x: 11, y: 6 }], ['esqueleto', { x: 11, y: 8 }], ['goblin', { x: 11, y: 10 }]] });
  assert.ok(enc.castSpell(ilvan, 'circuloMagico', { point: { x: 6, y: 6 } }).ok);
  assert.equal(enc.zonas.find((q) => q.circuloMagico).circuloMagico.tipo, 'morto-vivo');
});

teste('as cinco magias entram nas listas de classe do Livro do Jogador', () => {
  const tem = (classe, id, nivel) => listaDaClasse(classe, nivel).magias.includes(id);
  assert.ok(tem('druida', 'conjurarAnimais', 3) && tem('patrulheiro', 'conjurarAnimais', 3));
  assert.ok(tem('clerigo', 'animarMortos', 3) && tem('mago', 'animarMortos', 3) && !tem('bruxo', 'animarMortos', 3));
  assert.ok(tem('mago', 'piscar', 3) && tem('feiticeiro', 'piscar', 3));
  assert.ok(tem('mago', 'levitacao', 2) && tem('feiticeiro', 'levitacao', 2) && !tem('mago', 'levitacao', 1));
  for (const c of ['clerigo', 'paladino', 'bruxo', 'mago']) assert.ok(tem(c, 'circuloMagico', 3), c);
  for (const id of ['conjurarAnimais', 'animarMortos', 'piscar', 'levitacao', 'circuloMagico']) assert.equal(SPELLS[id].fonte, 'srd');
});

// ---- fichas de feras de ND 1/2 e 2, e invocados que agem sozinhos ----

teste('Feras de ND 1/2 e 2 (SRD): fichas completas com o ND certo, e cada pacote usa a ficha do ND dele', () => {
  const esperado = { ursoNegro: ['1/2', 19], cabraGigante: ['1/2', 19], javaliGigante: ['2', 42], tigreDenteDeSabre: ['2', 52] };
  for (const [id, [cr, hp]] of Object.entries(esperado)) {
    const m = MONSTERS[id];
    assert.ok(m, id);
    assert.equal(m.cr, cr, id);
    assert.equal(m.maxHp, hp, id);
    assert.equal(m.tipo, 'fera');
    assert.ok(m.attacks.length >= 1 && m.look);
  }
  assert.equal(MONSTERS.tigreDenteDeSabre.multiattack.count, 2);
  const nd = (id) => MONSTERS[SPELLS.conjurarAnimais.pacotes[id].defId].cr;
  assert.equal(nd('nd2'), '2'); assert.equal(nd('nd2b'), '2');
  assert.equal(nd('nd1'), '1');
  assert.equal(nd('nd12'), '1/2'); assert.equal(nd('nd12b'), '1/2');
  assert.equal(nd('nd14'), '1/4');
  assert.deepEqual(['nd2', 'nd1', 'nd12', 'nd14'].map((id) => SPELLS.conjurarAnimais.pacotes[id].n), [1, 2, 4, 8]);
  assert.ok(!/não há ficha/.test(SPELLS.conjurarAnimais.desc));
  const { enc, ilvan } = magoDoLote({ magias: ['conjurarAnimais'] });
  assert.ok(enc.castSpell(ilvan, 'conjurarAnimais', { opcao: 'nd12' }).ok);
  const ursos = enc.combatants.filter((c) => c.invocado);
  assert.equal(ursos.length, 4);
  assert.ok(ursos.every((c) => c.defId === 'ursoNegro'));
  assert.deepEqual(ursos.map((c) => c.name.match(/[0-9]+$/)?.[0]), ['1', '2', '3', '4']);
});

teste('Invocados: "agir sozinho" por criatura, por dono, e Terminar turno do dono encerra os invocados', async () => {
  const { enc, ilvan, foes } = magoDoLote({ magias: ['conjurarAnimais'] });
  enc.castSpell(ilvan, 'conjurarAnimais', { opcao: 'nd12' });
  const feras = enc.combatants.filter((c) => c.invocado);
  assert.ok(feras.every((c) => c.invocado.auto === false), 'começam manuais');
  passarUmaRodada(enc);
  assert.ok(feras.every((c) => !c.acted));
  // Uma fera sozinha; as outras ficam manuais.
  enc.definirAutoDoInvocado(feras[0], true);
  foes[0].hp = foes[0].maxHp = 999;
  foes[0].pos = { x: feras[0].pos.x + 1, y: feras[0].pos.y };
  await runAutoSummons(enc);
  assert.ok(feras[0].acted, 'a fera em auto jogou o turno sem pedir nada');
  assert.ok(feras.slice(1).every((c) => !c.acted), 'as manuais esperam');
  // Terminar o turno do dono encerra as manuais que não agiram.
  await encerrarTurnoComInvocados(enc, ilvan);
  assert.ok(feras.every((c) => c.acted) && ilvan.acted);
  // Por dono: marca todos e vale para as próximas invocações do dono.
  enc.definirAutoDosInvocados(ilvan, true);
  assert.ok(feras.every((c) => c.invocado.auto) && ilvan.invocadosAuto);
  enc.definirAutoDosInvocados(ilvan, false);
  assert.ok(feras.every((c) => !c.invocado.auto));
});

teste('Invocados em "agir sozinho" jogam quando o encontro encerra o turno do dono', async () => {
  const { enc, ilvan, foes } = magoDoLote({ magias: ['conjurarAnimais'] });
  enc.definirAutoDosInvocados(ilvan, true);
  enc.castSpell(ilvan, 'conjurarAnimais', { opcao: 'nd1' });
  const lobos = enc.combatants.filter((c) => c.invocado);
  assert.ok(lobos.every((c) => c.invocado.auto), 'nascem em auto quando o dono está em auto');
  passarUmaRodada(enc);
  foes[0].hp = foes[0].maxHp = 999;
  foes[0].pos = { x: lobos[0].pos.x + 1, y: lobos[0].pos.y };
  await encerrarTurnoComInvocados(enc, ilvan);
  assert.ok(lobos.every((c) => c.acted));
  assert.ok(foes[0].hp < 999, "os lobos em auto atacaram");
});

teste('Conjurar Animais: feras Grandes não se empilham nem cobrem o conjurador; são feéricas', () => {
  for (const op of ['nd1', 'nd2', 'nd12', 'nd14']) {
    const { enc, ilvan } = magoDoLote({ magias: ['conjurarAnimais'], foes: [['goblin', { x: 11, y: 11 }]] });
    assert.ok(enc.castSpell(ilvan, 'conjurarAnimais', { opcao: op }).ok);
    const usadas = new Map();
    for (const c of enc.combatants.filter((q) => !q.dead)) {
      const f = c.pos.f ?? 1;
      for (let dx = 0; dx < f; dx++) for (let dy = 0; dy < f; dy++) {
        const k = `${c.pos.x + dx},${c.pos.y + dy}`;
        assert.ok(!usadas.has(k), `${op}: ${c.name} em cima de ${usadas.get(k)} (${k})`);
        usadas.set(k, c.name);
      }
    }
    assert.ok(enc.combatants.filter((c) => c.invocado).every((c) => c.tipo === 'feérico'), 'feéricas');
  }
});

teste('Fim do encontro: quem piscou volta do Plano Etéreo e Levitação, Piscar e a concentração acabam', () => {
  const a = magoDoLote({ magias: ['piscar'] });
  addCondition(a.ilvan, 'piscando', { source: a.ilvan.id });
  addCondition(a.ilvan, 'etereo', { source: a.ilvan.id, data: { origem: { x: 6, y: 6 } } });
  a.foes[0].hp = 0; a.foes[0].dead = true;
  assert.ok(a.enc.checkEnd());
  assert.ok(!hasCondition(a.ilvan, 'etereo') && !hasCondition(a.ilvan, 'piscando'));
  assert.equal(a.enc.at(a.ilvan.pos.x, a.ilvan.pos.y), a.ilvan);
  const b = magoDoLote({ magias: ['levitacao'] });
  assert.ok(b.enc.castSpell(b.ilvan, 'levitacao', { target: b.dara }).ok);
  assert.ok(hasCondition(b.dara, 'levitando') && b.ilvan.concentrating);
  b.foes[0].hp = 0; b.foes[0].dead = true;
  assert.ok(b.enc.checkEnd());
  assert.ok(!hasCondition(b.dara, 'levitando'), 'volta a andar');
  assert.equal(b.ilvan.concentrating, null);
});

teste('Vigia (nothic): Olhar Apodrecedor sem jogada de ataque, CON CD 12, 3d6 só para quem falha', () => {
  const { enc, h, foes, log } = comHeroi('clerigo', 1, { foes: [['vigiaCiclopico', { x: 6, y: 5 }]] });
  const v = foes[0];
  h.hp = h.maxHp = 200;
  d20Fixo(enc, 2);
  const n = log.length;
  enc.resolveAttack(v, h, { weaponId: 'Olhar Apodrecedor' });
  assert.ok(log.slice(n).some((e) => /Olhar Apodrecedor .*: \d+ de dano necrótico/.test(e.text)), log.slice(n).map((e) => e.text).join(' | '));
  assert.ok(h.hp <= 197 && h.hp >= 182, `3d6 (${200 - h.hp})`);
  d20Fixo(enc, 19);
  const antes = h.hp;
  enc.resolveAttack(v, h, { weaponId: 'Olhar Apodrecedor' });
  assert.equal(h.hp, antes, 'quem passa no teste não leva nada');
});

teste('Vigia (nothic): visão verdadeira vê quem está invisível a até 36 m; o goblin não', () => {
  const { enc, h, foes } = comHeroi('clerigo', 1, { foes: [['vigiaCiclopico', { x: 6, y: 5 }], ['goblin', { x: 7, y: 5 }]] });
  addCondition(h, 'invisivel');
  const [v, g] = foes;
  assert.ok(v.senses?.truesightFt === 120, 'os sentidos do bloco chegam ao combatente');
  assert.ok(!enc.attackModifiers(v, h).reasons.includes('alvo invisível'));
  assert.ok(enc.attackModifiers(g, h).reasons.includes('alvo invisível'));
});

teste('Cajavidro: imobiliza, solta mísseis, foge com Passo Nebuloso e ergue o Escudo pelas cargas do cajado', async () => {
  const { takeMonsterTurn } = await import('../rules/ai.js');
  const { enc, h, foes, log } = comHeroi('clerigo', 1, { foes: [['cajavidro', { x: 8, y: 5 }]] });
  const cj = foes[0];
  h.hp = h.maxHp = 100;
  assert.equal(cj.ac, 16);
  assert.ok(cj.spellcasting?.conjuraNoTurno, 'conjuração no motor');
  enc.beginSide('foes');
  takeMonsterTurn(enc, cj);
  assert.ok(log.some((e) => /Cajavidro conjura Imobilizar Pessoa/.test(e.text)), 'abre com Imobilizar Pessoa');
  h.conditions = [];
  cj.concentrating = null;
  cj.spellcasting.slots[2] = 0;
  enc.beginSide('foes');
  takeMonsterTurn(enc, cj);
  assert.ok(log.some((e) => /Cajavidro conjura Míssil Mágico/.test(e.text)), 'sem 2º círculo, mísseis');
  h.pos = { x: cj.pos.x - 1, y: cj.pos.y };
  cj.hp = 10;
  cj.spellcasting.slots[2] = 1;
  enc.beginSide('foes');
  takeMonsterTurn(enc, cj);
  assert.ok(log.some((e) => /Cajavidro conjura Passo Nebuloso/.test(e.text)), 'encurralado, some');
  const cargas = cj.spellcasting.cajado.cargas;
  assert.ok(enc.escudoArcano(cj, h, 17, 16), 'o escudo faz o golpe errar');
  assert.equal(cj.spellcasting.cajado.cargas, cargas - 2, 'gasta 2 cargas do cajado');
  assert.ok(!enc.escudoArcano(cj, h, 17, 21), 'não ergue um segundo escudo');
});

// Paredes de borda (`core/grid.js`): a parede fina entre duas casas.
function campoComParede() {
  // Uma parede no oeste das casas (5, 2..6): separa a coluna 4 da 5. Uma
  // porta aberta em (5, 4) e uma seteira em (5, 6).
  const o = Array.from({ length: 12 }, (_, y) => '.....' + (y === 4 ? '/' : y === 6 ? 'J' : y >= 2 && y <= 6 ? '#' : '.') + '......');
  return new Battlefield(12, 12, MAPA, null, null, { n: [], o });
}
teste('parede de borda barra o passo e a visão; porta aberta deixa passar', () => {
  const f = campoComParede();
  assert.ok(!f.passa(4, 3, 5, 3), 'não atravessa a parede');
  assert.ok(f.passa(4, 4, 5, 4), 'passa pela porta aberta');
  assert.ok(!f.passa(4, 2, 5, 3), 'não escorrega pela quina da parede');
  assert.ok(!f.hasLineOfSight({ x: 3, y: 3 }, { x: 7, y: 3 }), 'parede corta a visão');
  assert.ok(f.hasLineOfSight({ x: 3, y: 4 }, { x: 7, y: 4 }), 'pela porta se vê');
  // Reto seriam 10 pés até (5, 3); pela porta (5, 4) são 15.
  assert.ok(!f.reachable({ x: 3, y: 3 }, 10).has('5,3'), 'em 10 pés não atravessa a parede');
  assert.ok(f.reachable({ x: 3, y: 3 }, 15).has('5,3'), 'dando a volta pela porta, chega');
});
teste('seteira de borda: barra o passo, deixa ver, e dá três quartos de cobertura a quem está atrás', () => {
  const f = campoComParede();
  assert.ok(!f.passa(4, 6, 5, 6), 'não se passa pela seteira');
  assert.ok(f.hasLineOfSight({ x: 1, y: 6 }, { x: 5, y: 6 }), 'vê-se pela fenda');
  assert.equal(f.coverBetween({ x: 1, y: 6 }, { x: 5, y: 6 }), 5, 'o arqueiro atrás da fenda tem +5');
  f.porAresta(4, 3, 5, 3, 3);
  assert.ok(f.passa(4, 3, 5, 3), 'aresta aberta no meio do jogo');
});
teste('criatura Grande não fica com a parede de borda no meio do corpo', () => {
  const o = Array.from({ length: 12 }, (_, y) => (y === 5 ? '......#.....' : '............'));
  const f = new Battlefield(12, 12, MAPA, null, null, { n: [], o });
  assert.ok(f.paredeNaPegada(5, 4, 2), 'a parede corta a pegada 2x2');
  const r = f.reachable({ x: 2, y: 4 }, 60, () => false, () => true, 2);
  assert.ok(!r.has('5,4') && !r.has('5,5'), 'o ogro não para atravessado na parede');
});

// ---- utilidade 2, lote 14 (rules/utilidade.js, rules/familiar.js, game/magias-fora-nucleo.js) ----

import {
  alarmeCobre, falaIdiomas, temMagia, disfarcado, sobZona, estaCativado, eFeraAmansavel, sentidasPorBemMal, ladoBemMal,
} from '../rules/utilidade.js';
import { noSobMagia } from '../game/dialogo-magia.js';
import { entrarNoEncontro, sairDoEncontro, familiarVirtual } from '../rules/familiar.js';
import { direcaoDe, revelarArmadilhas, marcas as marcasDoMapa, preparar as prepararMagia, plantasPerto, ferasAoAlcance } from '../game/magias-fora-nucleo.js';
import { passivePerception } from '../rules/abilities.js';

/** Dá 3º círculo aos conjuradores do grupo de utilidade (nível 3 só tem até o 2º). */
const com3 = (g) => { for (const c of [g.brenn, g.ilvan]) c.spellcasting.slots[3] = 2; return g; };
/** Põe a criatura nos eixos do campo (cenário vazio, sem pessoas por perto). */
const afastar = (g) => { g.dara.pos = { x: 4, y: 5 }; g.pip.pos = { x: 1, y: 8 }; g.brenn.pos = { x: 1, y: 1 }; g.ilvan.pos = { x: 1, y: 2 }; };

teste('lote 14: as 14 magias existem, são SRD, estão nas listas certas e o combate recusa as de cena', () => {
  const ids = ['salto', 'alarme', 'detectarBemMal', 'encontrarArmadilhas', 'zonaDaVerdade', 'localizarObjeto', 'linguas',
    'alterarAparencia', 'cativar', 'amizadeAnimal', 'sentidosDaFera', 'fingirDeMorto', 'falarComPlantas', 'encontrarFamiliar'];
  for (const id of ids) {
    assert.ok(SPELLS[id], id);
    assert.equal(SPELLS[id].fonte, 'srd', id);
    assert.ok(SPELLS[id].desc.length > 60, `${id}: descrição`);
  }
  const lista = (classe, n) => listaDaClasse(classe, n).magias;
  assert.ok(lista('mago', 3).includes('alterarAparencia') && lista('mago', 3).includes('linguas') && lista('mago', 1).includes('encontrarFamiliar'));
  assert.ok(lista('druida', 3).includes('sentidosDaFera') && lista('druida', 3).includes('falarComPlantas') && lista('druida', 1).includes('amizadeAnimal'));
  assert.ok(lista('bardo', 3).includes('cativar') && lista('bardo', 3).includes('zonaDaVerdade') && lista('bardo', 3).includes('fingirDeMorto'));
  assert.ok(lista('clerigo', 3).includes('encontrarArmadilhas') && lista('clerigo', 1).includes('detectarBemMal'));
  assert.ok(lista('patrulheiro', 3).includes('encontrarArmadilhas') && lista('paladino', 3).includes('zonaDaVerdade'));
  assert.ok(lista('bruxo', 3).includes('cativar') && lista('feiticeiro', 3).includes('alterarAparencia'));
  // As de cena o combate recusa; Salto e Fingir de Morto valem nos dois.
  const { enc, party } = montar({ nivel: 5 });
  const ilvan = party[ILVAN];
  ilvan.spellcasting.prepared.push('cativar', 'salto');
  assert.match(enc.canCast(ilvan, 'cativar').why, /fora de combate/);
  assert.ok(!SPELLS.salto.soFora && !SPELLS.fingirDeMorto.soFora);
});

teste('Salto: com a magia, o salto cruza o fosso que a pé barra e pousa um nível acima', () => {
  const g = grupoDeUtilidade({ prepared: ['salto'] });
  afastar(g);
  const field = new Battlefield(12, 12, MAPA);
  for (const x of [5, 6]) {
    const i = 5 * field.w + x;
    field.tiles[i] = 2; field.surfaces[i] = SUPERFICIES.indexOf('fosso'); field.heights[i] = 2;
  }
  const enc = new Encounter({ battlefield: field, party: g.party, foes: [], rng: g.rng });
  g.dara.movementLeftFt = 30;
  g.dara.corridaFt = 10;
  assert.equal(enc.destinosDoSalto(g.dara).has('7,5'), false, 'a pé o fosso barra o salto');
  const r = conjurarFora(g.estado, g.ilvan, 'salto', { ...g.ctx, alvo: g.dara });
  assert.ok(r.ok, r.why);
  assert.ok(hasCondition(g.dara, 'saltoTriplo'));
  assert.equal(enc.alcanceDoSalto(g.dara), 30, 'o alcance triplica (limitado pelo deslocamento)');
  assert.ok(enc.destinosDoSalto(g.dara).has('7,5'), 'com a magia, cai do outro lado');
  assert.ok(enc.pular(g.dara, { x: 7, y: 5 }).ok);
  assert.deepEqual([g.dara.pos.x, g.dara.pos.y], [7, 5]);
  // Um nível acima: o degrau que a pé não se alcança.
  const f2 = new Battlefield(12, 12, MAPA);
  f2.tiles[5 * f2.w + 5] = 2;
  f2.heights[5 * f2.w + 6] = 1;
  const enc2 = new Encounter({ battlefield: f2, party: [g.pip], foes: [], rng: g.rng });
  g.pip.pos = { x: 4, y: 5 }; g.pip.movementLeftFt = 30; g.pip.corridaFt = 10;
  assert.equal(enc2.destinosDoSalto(g.pip).has('6,5'), false);
  addCondition(g.pip, 'saltoTriplo');
  assert.ok(enc2.destinosDoSalto(g.pip).has('6,5'), 'sobe um nível');
  // Acaba no relógio (1 minuto).
  avancar(g.estado, 2, g.party);
  assert.ok(!hasCondition(g.dara, 'saltoTriplo'));
});

teste('Alarme: ninguém perto da marca é pego de surpresa na emboscada daquela cena — e só ali', () => {
  const g = grupoDeUtilidade({ prepared: ['alarme'] });
  const t0 = g.estado.minutos;
  const r = conjurarFora(g.estado, g.ilvan, 'alarme', { ...g.ctx, ritual: true, dados: { ponto: { x: 5, y: 5 }, cena: 'Esconderijo' } });
  assert.ok(r.ok, r.why);
  assert.equal(g.estado.minutos - t0, 11, '1 minuto + 10 do ritual');
  assert.ok(alarmeCobre(g.estado, g.party, 'Esconderijo', { x: 8, y: 5 }));
  assert.equal(alarmeCobre(g.estado, g.party, 'Outro lugar', { x: 5, y: 5 }), null, 'só na cena do alarme');
  assert.equal(alarmeCobre(g.estado, g.party, 'Esconderijo', { x: 5, y: 40 }), null, 'só perto da marca');
  assert.equal(alarmeCobre(g.estado, g.party, 'Esconderijo', { x: 8, y: 5 }).fim - t0 - 11, 480, 'dura 8 horas');
  const emboscada = (protege) => {
    const { enc, log } = montar({ foes: [['goblin', { x: 10, y: 10 }]] });
    enc.emboscada = { emboscadores: 'foes', furtividade: [30] };
    if (protege) enc.protegidoDeSurpresa = (c) => Boolean(alarmeCobre(g.estado, g.party, 'Esconderijo', c.pos));
    enc.start();
    return log.map((e) => e.text).join('\n');
  };
  const sem = emboscada(false);
  assert.match(sem, /surpreendidos: Dara, Pip, Brenn, Ilvan/, 'sem o alarme todos são surpreendidos');
  const com = emboscada(true);
  assert.match(com, /O Alarme toca: Dara, Pip, Brenn, Ilvan ouvem o aviso/, 'com o alarme, o registro conta');
  assert.match(com, /ninguém foi surpreendido/);
});

teste('Detectar o Bem e o Mal: sente morto-vivo e aberração a 9 m (e o lado da balança), não o goblin nem o que está longe', () => {
  const g = grupoDeUtilidade({ prepared: ['detectarBemMal'] });
  const esq = makeMonster('esqueleto', { x: 8, y: 5 });
  const gob = makeMonster('goblin', { x: 7, y: 5 });
  const longe = makeMonster('esqueleto', { x: 20, y: 5 });
  const todos = [esq, gob, longe];
  assert.equal(sentidasPorBemMal(g.estado, g.party, g.brenn, todos).length, 0, 'sem a magia, nada');
  const r = conjurarFora(g.estado, g.brenn, 'detectarBemMal', g.ctx);
  assert.ok(r.ok, r.why);
  assert.deepEqual(sentidasPorBemMal(g.estado, g.party, g.brenn, todos).map((m) => m.id), [esq.id]);
  assert.equal(ladoBemMal(esq), 'mal');
  assert.equal(ladoBemMal(gob), null);
  assert.equal(g.brenn.concentrating.spellId, 'detectarBemMal', 'concentração');
  // O mapa recebe a coluna de luz (marca) sobre quem a magia sente.
  const app = { capitulo: { explorando: true, lugar: 'X' }, enc: { combatants: [esq, gob, longe, ...g.party] }, inimigosEscondidos: [] };
  const m = marcasDoMapa({ app, estado: g.estado, herois: () => g.party });
  assert.deepEqual(m.map((k) => [k.x, k.y, k.cor]), [[8, 5, 'marca-mal']]);
  avancar(g.estado, 11, g.party);
  assert.equal(sentidasPorBemMal(g.estado, g.party, g.brenn, todos).length, 0, 'acaba em 10 minutos');
});

teste('Encontrar Armadilhas: revela as armadilhas à vista, desarma o que a cena desarma e marca o mapa; fora da vista, não', () => {
  const g = grupoDeUtilidade({ prepared: ['encontrarArmadilhas'] });
  const field = new Battlefield(40, 12, Array(12).fill('.'.repeat(40)));
  let fossoAberto = false;
  const gs = [
    { id: 'fosso', tipo: 'armadilha', x: 9, y: 5, nome: 'O fosso coberto', texto: 'lajes falsas', revelar: () => { fossoAberto = true; return true; } },
    { id: 'longe', tipo: 'armadilha', x: 38, y: 5, nome: 'Uma armadilha longe', texto: 'longe', revelar: () => true },
  ];
  const app = { capitulo: { explorando: true, lugar: 'X', ganchosMagicos: () => gs }, enc: { field, combatants: g.party }, refresh() {} };
  const r = conjurarFora(g.estado, g.brenn, 'encontrarArmadilhas', g.ctx);
  assert.ok(r.ok, r.why);
  assert.equal(fossoAberto, false, 'conjurar na regra não revela sozinho: é a cena que revela');
  const achadas = revelarArmadilhas(app, g.estado, g.brenn);
  assert.deepEqual(achadas.map((a) => a.nome), ['O fosso coberto'], 'só a que está a até 36 m e à vista');
  assert.ok(fossoAberto);
  assert.equal(g.estado.marcas.length, 1);
  assert.deepEqual(marcasDoMapa({ app, estado: g.estado, herois: () => g.party }).map((k) => k.cor), ['marca-armadilha']);
  assert.equal(revelarArmadilhas(app, g.estado, g.brenn)[0].novo, true, 'a cena diz se é nova (aqui o gancho de teste sempre diz que é)');
  assert.equal(g.estado.marcas.length, 1, 'a marca não se repete');
});

teste('Zona da Verdade: quem falha na CAR não mente (o nó troca a mentira pela verdade); quem resiste mente à vontade', () => {
  const g = grupoDeUtilidade({ prepared: ['zonaDaVerdade'] });
  const npc = makeMonster('goblin', { x: 8, y: 5 });
  npc.side = 'neutro';
  npc.abilities.cha = -10;
  assert.equal(sobZona(g.estado, g.party, npc), false);
  const r = conjurarFora(g.estado, g.ilvan, 'zonaDaVerdade', { ...g.ctx, alvo: npc });
  assert.ok(r.ok, r.why);
  assert.equal(r.resultado.resistiu, false);
  assert.ok(sobZona(g.estado, g.party, npc));
  const no = { fala: 'Combinado.', zona: { fala: 'Eu cobro ouro.' }, fim: 'acordo' };
  assert.equal(noSobMagia(no, { zona: true }).fala, 'Eu cobro ouro.');
  assert.equal(noSobMagia(no, { zona: true }).fim, 'acordo', 'o resto do nó fica');
  assert.match(noSobMagia(no, { zona: true }).narra, /Zona da Verdade/);
  assert.equal(noSobMagia(no, { zona: false }).fala, 'Combinado.', 'sem a zona, a mentira fica');
  // Quem resiste (CAR altíssima) segue livre para mentir.
  const forte = makeMonster('goblin', { x: 8, y: 6 });
  forte.side = 'neutro';
  forte.abilities.cha = 100;
  const r2 = conjurarFora(g.estado, g.ilvan, 'zonaDaVerdade', { ...g.ctx, alvo: forte });
  assert.ok(r2.resultado.resistiu);
  assert.equal(sobZona(g.estado, g.party, forte), false);
  assert.ok(sobZona(g.estado, g.party, npc), 'a zona do primeiro segue de pé');
  avancar(g.estado, 11, g.party);
  assert.equal(sobZona(g.estado, g.party, npc), false, 'acaba em 10 minutos');
});

teste('Localizar Objeto: guarda onde está o objeto escolhido, marca o mapa enquanto dura a concentração', () => {
  const g = grupoDeUtilidade({ prepared: ['localizarObjeto'] });
  const app = { capitulo: { explorando: true, lugar: 'X' }, enc: { combatants: g.party }, inimigosEscondidos: [] };
  const lista = () => marcasDoMapa({ app, estado: g.estado, herois: () => g.party });
  assert.equal(lista().length, 0);
  const sem = prepararMagia({ app, estado: g.estado, herois: () => g.party }, g.brenn, 'localizarObjeto', {});
  assert.match(sem.erro, /escolha/);
  const gancho = { id: 'chave', x: 9, y: 2, nome: 'Uma chave de ferro' };
  const { opts } = prepararMagia({ app, estado: g.estado, herois: () => g.party }, g.brenn, 'localizarObjeto', { gancho });
  const r = conjurarFora(g.estado, g.brenn, 'localizarObjeto', { ...g.ctx, ...opts });
  assert.ok(r.ok, r.why);
  assert.deepEqual(r.ativa.data.ponto, { x: 9, y: 2 });
  assert.equal(g.brenn.concentrating.spellId, 'localizarObjeto');
  assert.deepEqual(lista().map((k) => [k.x, k.y, k.cor]), [[9, 2, 'marca-alvo']]);
  g.brenn.concentrating = null;
  assert.equal(lista().length, 0, 'sem concentração, a marca some');
});

teste('Línguas: entende e FALA o idioma (Compreender Idiomas só entende); o diálogo conta Línguas por Compreender', () => {
  const g = com3(grupoDeUtilidade({ prepared: ['linguas', 'compreenderIdiomas'] }));
  assert.equal(falaIdiomas(g.estado, g.party), false);
  assert.equal(temMagia(g.estado, g.party, 'compreenderIdiomas'), false);
  assert.ok(conjurarFora(g.estado, g.ilvan, 'compreenderIdiomas', g.ctx).ok);
  assert.equal(entendeIdiomas(g.estado, g.party), true);
  assert.equal(falaIdiomas(g.estado, g.party), false, 'só entende');
  const h = com3(grupoDeUtilidade({ prepared: ['linguas'] }));
  const r = conjurarFora(h.estado, h.ilvan, 'linguas', h.ctx);
  assert.ok(r.ok, r.why);
  assert.equal(falaIdiomas(h.estado, h.party), true);
  assert.equal(entendeIdiomas(h.estado, h.party), true);
  assert.equal(temMagia(h.estado, h.party, 'compreenderIdiomas'), true, 'a opção de ouvir o murmúrio também abre');
  assert.equal(h.ilvan.spellcasting.slots[3], 1, 'gastou um espaço de 3º');
  avancar(h.estado, 61, h.party);
  assert.equal(falaIdiomas(h.estado, h.party), false, 'acaba em 1 hora');
});

teste('Alterar Aparência: vantagem em Enganação e passa por disfarçado (como Disfarçar-se), com concentração', () => {
  const g = grupoDeUtilidade({ prepared: ['alterarAparencia'] });
  const sem = previsaoDeTeste(g.estado, g.party, g.ilvan, 'enganacao', 12);
  assert.equal(sem.vantagem, false);
  assert.equal(disfarcado(g.estado, g.party, g.ilvan), false);
  const r = conjurarFora(g.estado, g.ilvan, 'alterarAparencia', g.ctx);
  assert.ok(r.ok, r.why);
  const com = previsaoDeTeste(g.estado, g.party, g.ilvan, 'enganacao', 12);
  assert.equal(com.vantagem, true);
  assert.ok(com.chance > sem.chance);
  assert.ok(com.fontes.includes('Alterar Aparência'));
  assert.equal(disfarcado(g.estado, g.party, g.ilvan), true, 'a cena vê quem está vestido de outro');
  assert.equal(disfarcado(g.estado, g.party, g.brenn), false);
  assert.equal(g.ilvan.concentrating.spellId, 'alterarAparencia');
});

teste('Cativar: quem falha na SAB não grita, tem Percepção passiva −5 e é pego de surpresa; acaba em 1 minuto', () => {
  const g = grupoDeUtilidade({ prepared: ['cativar'] });
  const a = makeMonster('goblin', { x: 9, y: 5 });
  const b = makeMonster('goblin', { x: 9, y: 6 });
  a.abilities.wis = -10;
  b.abilities.wis = 100;
  const baseA = passivePerception(a);
  const r = conjurarFora(g.estado, g.ilvan, 'cativar', { ...g.ctx, criaturas: [a, b] });
  assert.ok(r.ok, r.why);
  assert.ok(estaCativado(a) && hasCondition(a, 'cativado'));
  assert.ok(!estaCativado(b), 'quem resiste fica como estava');
  assert.equal(passivePerception(a), baseA - 5);
  // Na emboscada do grupo, a Percepção −5 vira a diferença entre notar e ser surpreendido.
  const { enc, foes } = montar({ foes: [['goblin', { x: 10, y: 10 }]] });
  const alvo = foes[0];
  const passiva = passivePerception(alvo);
  enc.emboscada = { emboscadores: 'party', furtividade: [passiva] };
  enc.start();
  assert.ok(!enc.surpresos.has(alvo.id), 'sem Cativar, empate não surpreende');
  const { enc: enc2, foes: foes2 } = montar({ foes: [['goblin', { x: 10, y: 10 }]] });
  addCondition(foes2[0], 'cativado');
  enc2.emboscada = { emboscadores: 'party', furtividade: [passiva] };
  enc2.start();
  assert.ok(enc2.surpresos.has(foes2[0].id), 'cativado, é surpreendido');
  avancar(g.estado, 2, g.party);
  assert.ok(!hasCondition(a, 'cativado'), 'acaba com a magia');
  // Sem ninguém à vista que ouça, a cena nem deixa conjurar (não gasta o espaço).
  const app = { capitulo: { lugar: 'X' }, enc: { combatants: g.party, field: new Battlefield(12, 12, MAPA) }, inimigosEscondidos: [] };
  assert.match(prepararMagia({ app, estado: g.estado, herois: () => g.party }, g.ilvan, 'cativar', {}).erro, /ninguém/);
});

teste('Amizade Animal: a fera falha na SAB e fica neutra (não é mais inimiga); uma fera por círculo; só feras de INT ≤ 3', () => {
  const g = grupoDeUtilidade({ prepared: ['amizadeAnimal'] });
  const lobos = () => ['a', 'b', 'c'].map((s, i) => { const l = makeMonster('lobo', { x: 9, y: 4 + i }); l.abilities.wis = -10; return l; });
  const um = lobos();
  assert.ok(um.every(eFeraAmansavel));
  const r1 = conjurarFora(g.estado, g.ilvan, 'amizadeAnimal', { ...g.ctx, criaturas: um });
  assert.ok(r1.ok, r1.why);
  assert.deepEqual(um.map((l) => l.side), ['neutro', 'foes', 'foes'], 'espaço de 1º pega uma fera');
  const dois = lobos();
  const r2 = conjurarFora(g.estado, g.ilvan, 'amizadeAnimal', { ...g.ctx, criaturas: dois, circulo: 2 });
  assert.ok(r2.ok, r2.why);
  assert.deepEqual(dois.map((l) => l.side), ['neutro', 'neutro', 'foes'], 'espaço de 2º pega duas');
  assert.equal(g.ilvan.spellcasting.slots[2], 1);
  // O inimigo neutro sai da conta da luta.
  const f = new Battlefield(12, 12, MAPA);
  const enc = new Encounter({ battlefield: f, party: g.party, foes: dois, rng: g.rng });
  assert.equal(enc.enemiesOf(g.dara).length, 1);
  // Resiste quem é forte; goblin e fera esperta não são alvo.
  const forte = makeMonster('lobo', { x: 9, y: 7 });
  forte.abilities.wis = 100;
  const r3 = conjurarFora(g.estado, g.ilvan, 'amizadeAnimal', { ...g.ctx, criaturas: [forte] });
  assert.ok(r3.resultado.resistiu && forte.side === 'foes');
  assert.equal(conjurarFora(g.estado, g.ilvan, 'amizadeAnimal', { ...g.ctx, criaturas: [makeMonster('goblin', { x: 9, y: 8 })] }).ok, false);
  // Acaba em 24 horas: a fera volta ao lado de onde veio.
  avancar(g.estado, 1441, g.party);
  assert.equal(um[0].side, 'foes');
  assert.equal(ferasAoAlcance({ capitulo: null, enc: { combatants: [], field: f }, inimigosEscondidos: [] }, g.ilvan, 30).length, 0);
});

teste('Convocar Familiar: o espírito entra na luta ao lado do dono, não ataca, é alvo, e some se cai', () => {
  const g = grupoDeUtilidade({ prepared: ['encontrarFamiliar'] });
  const t0 = g.estado.minutos;
  assert.equal(familiarVirtual(g.estado, g.ilvan), null, 'sem a magia, não há familiar');
  const r = conjurarFora(g.estado, g.ilvan, 'encontrarFamiliar', { ...g.ctx, ritual: true, opcao: 'morcego' });
  assert.ok(r.ok, r.why);
  assert.equal(g.estado.minutos - t0, 20, 'ritual de 10 minutos (no livro 1 hora) + 10');
  assert.equal(g.estado.familiar.defId, 'morcegoFamiliar');
  assert.equal(familiarVirtual(g.estado, g.ilvan).familiar, true);
  const { enc, party, foes } = montar({ foes: [['goblin', { x: 10, y: 10 }]] });
  enc.aoComecar = (e) => entrarNoEncontro(e, g.estado);
  enc.start();
  const fam = enc.combatants.find((c) => c.familiar);
  assert.ok(fam, 'o familiar entra no tabuleiro quando a luta começa');
  assert.equal(fam.side, 'party');
  assert.deepEqual(fam.attacks, [], 'não ataca');
  assert.equal(fam.hp, 1);
  assert.ok(fam.invocado && fam.invocado.donoId, 'conta como criatura invocada: não segura a vitória nem vale XP');
  assert.equal(fam.xp, 0);
  assert.ok(enc.enemiesOf(foes[0]).includes(fam), 'os inimigos podem escolhê-lo');
  assert.equal(enc.combatants.filter((c) => c.familiar).length, 1);
  entrarNoEncontro(enc, g.estado);
  assert.equal(enc.combatants.filter((c) => c.familiar).length, 1, 'só um por vez');
  // Cai: o registro some.
  fam.hp = 0; fam.dead = true;
  assert.equal(sairDoEncontro(g.estado, fam), true);
  assert.equal(g.estado.familiar, null);
  assert.equal(party.length, 4);
  // Duas formas, um por vez: conjurar de novo troca de bicho.
  conjurarFora(g.estado, g.ilvan, 'encontrarFamiliar', { ...g.ctx, ritual: true, opcao: 'rato' });
  assert.equal(g.estado.familiar.defId, 'ratoFamiliar');
  assert.equal(makeMonster('ratoFamiliar', { x: 1, y: 1 }).attacks.length, 0);
});

teste('Sentidos da Fera: precisa de uma fera disposta — o familiar serve, a fera inimiga não; concentração de 1 hora', () => {
  const g = grupoDeUtilidade({ prepared: ['sentidosDaFera', 'encontrarFamiliar'] });
  const sem = conjurarFora(g.estado, g.brenn, 'sentidosDaFera', g.ctx);
  assert.equal(sem.ok, false, 'sem bicho escolhido não conjura');
  const lobo = makeMonster('lobo', { x: 5, y: 6 });
  const hostil = conjurarFora(g.estado, g.brenn, 'sentidosDaFera', { ...g.ctx, alvo: lobo });
  assert.equal(hostil.ok, false);
  assert.match(hostil.why, /disposta/);
  assert.ok(conjurarFora(g.estado, g.ilvan, 'encontrarFamiliar', { ...g.ctx, ritual: true, opcao: 'rato' }).ok);
  const bicho = familiarVirtual(g.estado, g.brenn);
  const r = conjurarFora(g.estado, g.brenn, 'sentidosDaFera', { ...g.ctx, ritual: true, alvo: bicho });
  assert.ok(r.ok, r.why);
  assert.equal(r.ativa.data.bicho, 'familiar');
  assert.equal(r.ativa.fim - r.ativa.inicio, 60);
  assert.equal(g.brenn.concentrating.spellId, 'sentidosDaFera');
  // Amansada pela Amizade Animal, a fera passa a servir.
  lobo.side = 'neutro';
  assert.ok(conjurarFora(g.estado, g.brenn, 'sentidosDaFera', { ...g.ctx, alvo: lobo }).ok);
});

teste('Fingir de Morto: o alvo parece morto — inimigos o ignoram, ele não age, resiste a tudo menos psíquico; acorda com o toque', () => {
  const { enc, party, foes } = montar({ nivel: 5, foes: [['goblin', { x: 6, y: 5 }]] });
  const dara = party[DARA];
  const ilvan = party[ILVAN];
  ilvan.pos = { x: 4, y: 5 };
  ilvan.spellcasting.prepared.push('fingirDeMorto');
  assert.ok(enc.enemiesOf(foes[0]).includes(dara), 'sem a magia, o goblin a vê');
  const r = enc.castSpell(ilvan, 'fingirDeMorto', { targets: [dara] });
  assert.ok(r.ok, r.why);
  assert.ok(hasCondition(dara, 'fingeMorto'));
  assert.ok(!enc.enemiesOf(foes[0]).includes(dara), 'os inimigos a tratam como morta');
  assert.ok(conditionEffects(dara).incapacitated);
  assert.equal(enc.danoPorTipo(dara, 10, 'cortante'), 5, 'resiste a todo dano');
  assert.equal(enc.danoPorTipo(dara, 10, 'psíquico'), 10, 'menos o psíquico');
  assert.equal(enc.speedOf(dara), 0);
});

teste('Falar com Plantas: dura 10 minutos; só há o que perguntar onde há planta a 9 m', () => {
  const g = com3(grupoDeUtilidade({ prepared: ['falarComPlantas'] }));
  const r = conjurarFora(g.estado, g.ilvan, 'falarComPlantas', g.ctx);
  assert.ok(r.ok, r.why);
  assert.ok(ativaDe(g.estado, g.party, 'falarComPlantas', { por: g.ilvan }));
  const f = new Battlefield(12, 12, MAPA);
  g.ilvan.pos = { x: 2, y: 5 };
  const app = { enc: { field: f } };
  assert.equal(plantasPerto(app, g.ilvan), 0, 'chão limpo: ninguém para conversar');
  f.surfaces[5 * f.w + 8] = SUPERFICIES.indexOf('arbusto');
  f.surfaces[5 * f.w + 11] = SUPERFICIES.indexOf('arbusto');
  assert.equal(plantasPerto(app, g.ilvan), 1, 'só o mato a até 9 m');
  avancar(g.estado, 11, g.party);
  assert.equal(ativaDe(g.estado, g.party, 'falarComPlantas', { por: g.ilvan }), null);
});

teste('a espada não atravessa a parede de borda, mas alcança pela porta', () => {
  const o = Array.from({ length: 12 }, (_, y) => (y === 5 ? '......#.....' : y === 6 ? '....../.....' : '............'));
  const { enc, party, foes } = montar({ foes: [['goblin', { x: 6, y: 5 }]] });
  enc.field = new Battlefield(12, 12, MAPA, null, null, { n: [], o });
  const h = party[0];
  h.pos = { x: 5, y: 5 };
  assert.ok(!enc.canAttack(h, foes[0]).ok, 'há uma parede no meio');
  // Pela porta, de frente. Na diagonal não vale: não se dá a volta na ponta
  // da parede num passo (a mesma regra de quina do movimento).
  h.pos = { x: 5, y: 6 };
  foes[0].pos = { x: 6, y: 6 };
  assert.ok(enc.canAttack(h, foes[0]).ok, 'pela porta aberta alcança');
});
teste('ataque de oportunidade não atravessa a parede de borda', () => {
  const o = Array.from({ length: 12 }, (_, y) => (y === 5 ? '......#.....' : '............'));
  const { enc, party, foes } = montar({ foes: [['goblin', { x: 6, y: 5 }]] });
  enc.field = new Battlefield(12, 12, MAPA, null, null, { n: [], o });
  const h = party[0];
  h.pos = { x: 5, y: 5 };
  foes[0].reactionUsed = false;
  const antes = h.hp;
  enc.moveAlong(h, [{ x: 5, y: 5 }, { x: 4, y: 5 }]);
  assert.equal(h.hp, antes, 'o goblin do outro lado do muro não alcança');
});

teste('o hobgoblin mostra o arco quando atira e a espada quando golpeia', () => {
  const { enc, party, foes } = montar({ foes: [['hobgoblin', { x: 9, y: 5 }]] });
  const hob = foes[0];
  const h = party[0];
  assert.equal(hob.look, 'hobgoblin');
  h.pos = { x: 2, y: 5 };
  hob.actionUsed = false;
  assert.ok(enc.attackAction(hob, h, 'Arco longo').ok);
  assert.equal(hob.look, 'hobgoblin@cotaDeMalha-arcoLongo', 'arco na mão');
  h.pos = { x: 8, y: 5 };
  hob.actionUsed = false;
  assert.ok(enc.attackAction(hob, h, 'Espada longa').ok);
  assert.equal(hob.look, 'hobgoblin', 'de volta à espada e ao escudo');
});

// ---- revisão do lote 14: tipos das aberrações, Cativar, Fingir de Morto, Amizade Animal ----

teste('tipos das aberrações: cada bloco tem o do livro, e o Detectar o Bem e o Mal só acende as certas', () => {
  const tipos = { gelatinaOcre: 'gosma', grick: 'monstruosidade', doppelganger: 'monstruosidade', dragaoVerdeJovem: 'dragão',
    caveiraCandente: 'morto-vivo', espinheiroRastejante: 'planta', vigiaCiclopico: 'aberração', spectator: 'aberração' };
  for (const [id, t] of Object.entries(tipos)) assert.equal(makeMonster(id, { x: 1, y: 1 }).tipo, t, id);
  assert.equal(ladoBemMal(makeMonster('grick', { x: 1, y: 1 })), null, 'grick não é aberração');
  assert.equal(ladoBemMal(makeMonster('dragaoVerdeJovem', { x: 1, y: 1 })), null);
  assert.equal(ladoBemMal(makeMonster('caveiraCandente', { x: 1, y: 1 })), 'mal');
  assert.equal(ladoBemMal(makeMonster('vigiaCiclopico', { x: 1, y: 1 })), 'mal');
  // Imobilizar Pessoa só pega humanoide: o doppelganger (monstruosidade) fica de fora.
  const { enc, party, foes } = montar({ nivel: 5, foes: [['doppelganger', { x: 6, y: 5 }], ['goblin', { x: 6, y: 6 }]] });
  party[ILVAN].spellcasting.prepared.push('imobilizarPessoa');
  assert.match(enc.porqueNaoAlvo(party[ILVAN], getSpell('imobilizarPessoa'), foes[0]), /humanoide/, 'doppelganger não é humanoide');
  assert.equal(enc.porqueNaoAlvo(party[ILVAN], getSpell('imobilizarPessoa'), foes[1]), null);
});

teste('Cativar: 60 pés, sem concentração; imune a enfeitiçado passa; longe demais não pega', () => {
  assert.equal(SPELLS.cativar.rangeFt, 60);
  assert.ok(!SPELLS.cativar.concentration);
  const g = grupoDeUtilidade({ prepared: ['cativar'] });
  afastar(g);
  const perto = makeMonster('goblin', { x: 5, y: 2 });
  const imune = makeMonster('ghoul', { x: 5, y: 3 });
  const longe = makeMonster('goblin', { x: 20, y: 2 });
  for (const m of [perto, imune, longe]) m.abilities.wis = -10;
  const r = conjurarFora(g.estado, g.ilvan, 'cativar', { ...g.ctx, criaturas: [perto, imune, longe] });
  assert.ok(r.ok, r.why);
  assert.ok(hasCondition(perto, 'cativado'));
  assert.ok(!hasCondition(imune, 'cativado'), 'imune a enfeitiçado passa direto');
  assert.ok(!hasCondition(longe, 'cativado'), 'a 95 pés está fora do alcance');
  assert.equal(g.ilvan.concentrating ?? null, null, 'sem concentração');
});

teste('Amizade Animal: imune a enfeitiçado não é amansada; ferir a fera desfaz a amizade', () => {
  const g = grupoDeUtilidade({ prepared: ['amizadeAnimal'] });
  afastar(g);
  const l = makeMonster('lobo', { x: 5, y: 2 });
  l.abilities.wis = -10;
  l.conditionImmunities = [...(l.conditionImmunities ?? []), 'enfeitiçado'];
  conjurarFora(g.estado, g.ilvan, 'amizadeAnimal', { ...g.ctx, criaturas: [l] });
  assert.equal(l.side, 'foes', 'imune: nada muda');
  const { enc, party, foes } = montar({ foes: [['lobo', { x: 10, y: 10 }]] });
  foes[0].side = 'neutro'; foes[0].amizadeAnimal = 'x';
  enc.applyDamage(foes[0], 1, 'cortante', party[0]);
  assert.equal(foes[0].side, 'foes', 'o grupo feriu a fera: a amizade acaba');
});

teste('Fingir de Morto: com o grupo todo fingindo a luta não trava; só o conjurador desfaz, ao lado, com ação', () => {
  const { enc, party, foes } = montar({ nivel: 5, foes: [['goblin', { x: 6, y: 5 }]] });
  const dara = party[DARA];
  const ilvan = party[ILVAN];
  ilvan.pos = { x: 4, y: 5 };
  ilvan.spellcasting.prepared.push('fingirDeMorto');
  assert.ok(enc.castSpell(ilvan, 'fingirDeMorto', { targets: [dara] }).ok);
  assert.ok(!enc.enemiesOf(foes[0]).includes(dara), 'havendo outro alvo, ela é ignorada');
  for (const c of party) if (c !== dara) addCondition(c, 'fingeMorto', { source: ilvan.id });
  assert.ok(enc.enemiesOf(foes[0]).length > 0, 'todos fingindo: ainda há alvo (a luta não trava)');
  const pip = party[1];
  assert.ok(!enc.despertarFingido(pip, dara), 'outro aliado não desfaz');
  ilvan.pos = { x: 9, y: 9 };
  assert.ok(!enc.despertarFingido(ilvan, dara), 'longe não desfaz');
  ilvan.pos = { x: 4, y: 6 };
  ilvan.actionUsed = false;
  assert.ok(enc.despertarFingido(ilvan, dara));
  assert.ok(!hasCondition(dara, 'fingeMorto') && ilvan.actionUsed, 'desfeita, e gastou a ação');
});

teste('Alarme só cobre uma cena nomeada; Localizar Objeto dá a direção em oito pontos', () => {
  const g = grupoDeUtilidade({ prepared: ['alarme'] });
  conjurarFora(g.estado, g.ilvan, 'alarme', { ...g.ctx, dados: { ponto: { x: 5, y: 5 }, cena: undefined } });
  assert.equal(alarmeCobre(g.estado, g.party, undefined, { x: 5, y: 5 }), null, 'sem cena, não cobre qualquer lugar');
  assert.equal(direcaoDe({ x: 5, y: 5 }, { x: 5, y: 1 }), 'ao nordeste');
  assert.equal(direcaoDe({ x: 5, y: 5 }, { x: 5, y: 9 }), 'ao sudoeste');
  assert.equal(direcaoDe({ x: 5, y: 5 }, { x: 9, y: 9 }), 'ao sul');
});

// ---- mantimentos de viagem -------------------------------------------------

teste('exaustao sobe em degraus e cada um cobra o que o livro manda', () => {
  const { party } = montar();
  const c = party[DARA];
  assert.equal(nivelDeExaustao(c), 0);
  mudarExaustao(c, 1);
  assert.ok(conditionEffects(c).desvantagemSoTeste.includes('str'), '1: desvantagem em teste de atributo');
  assert.equal(conditionEffects(c).desvantagemTeste.includes('con'), false, '1 nao toca em resistencia');
  assert.equal(conditionEffects(c).speedHalf, false, '1 ainda nao corta o deslocamento');
  mudarExaustao(c, 1);
  assert.equal(conditionEffects(c).speedHalf, true, '2: deslocamento pela metade');
  assert.equal(conditionEffects(c).attackDisadvantage, false, '2 ainda nao atrapalha o ataque');
  assert.equal(conditionEffects(c).saveDisadvantage.includes('con'), false, '2 ainda nao toca em resistencia');
  mudarExaustao(c, 1);
  assert.equal(conditionEffects(c).attackDisadvantage, true, '3: desvantagem em ataque');
  assert.ok(conditionEffects(c).saveDisadvantage.includes('con'), '3: desvantagem em resistencia');
  assert.equal(maxHpEfetivo(c), c.maxHp, '3 nao mexe no PV maximo');
  mudarExaustao(c, 1);
  assert.equal(maxHpEfetivo(c), Math.floor(c.maxHp / 2), '4: PV maximo pela metade');
  mudarExaustao(c, 1);
  assert.equal(conditionEffects(c).speedOverride, 0, '5: deslocamento 0');
  assert.equal(mudarExaustao(c, 1), 6, '6: o ultimo degrau');
  assert.equal(mudarExaustao(c, -6), 0, 'zerou: a condicao sai');
  assert.equal(hasCondition(c, 'exausto'), false);
});

teste('o 4o degrau de exaustao corta o PV maximo na cura e no dano macico', () => {
  const { enc, party } = montar();
  const c = party[DARA];
  mudarExaustao(c, 4);
  const metade = Math.floor(c.maxHp / 2);
  c.hp = 1;
  enc.heal(c, 999, c);
  assert.equal(c.hp, metade, 'a cura para na metade');
  c.hp = metade;
  enc.applyDamage(c, metade * 2 + 1, 'cortante');
  assert.ok(c.dead, 'dano macico mede pela metade nova');
});

teste('um dia de viagem come uma racao e bebe quatro litros por pessoa', () => {
  const { party } = montar();
  const rng = makeRng(7);
  const antes = despensaDoGrupo(party);
  assert.equal(antes.racoes, party.length * 3, 'cada um comeca com tres racoes');
  assert.equal(antes.agua, party.length * 4, 'e um cantil cheio');
  diaDeViagem(rng, party, {});
  const depois = despensaDoGrupo(party);
  assert.equal(depois.racoes, antes.racoes - party.length, 'uma racao por boca');
  assert.equal(depois.agua, 0, 'o cantil de um dia secou');
  for (const c of party) assert.equal(nivelDeExaustao(c), 0, 'ninguem passou mal no primeiro dia');
});

teste('a agua no caminho enche os cantis e nao cobra nada', () => {
  const { party } = montar();
  const rng = makeRng(7);
  diaDeViagem(rng, party, {});
  assert.equal(despensaDoGrupo(party).agua, 0);
  diaDeViagem(rng, party, { agua: true });
  assert.equal(despensaDoGrupo(party).agua, party.length * 4, 'o riacho encheu tudo de novo');
  for (const c of party) assert.equal(nivelDeExaustao(c), 0);
});

teste('o dia sem agua cobra exaustao, e o dobro em quem ja esta exausto', () => {
  const { party } = montar();
  const rng = makeRng(3);
  const c = garantirInventario(party[DARA]);
  beberAgua(c, 99);
  diaDeViagem(rng, [c], {});
  assert.equal(nivelDeExaustao(c), 1, 'dia sem agua nenhuma: um degrau, sem teste');
  diaDeViagem(rng, [c], {});
  assert.equal(nivelDeExaustao(c), 3, 'ja exausto: dois degraus de uma vez');
});

teste('a fome so cobra depois de 3 + CON dias, e a conta zera ao comer', () => {
  const { party } = montar();
  const rng = makeRng(5);
  const c = party[DARA];
  for (const h of party) if (h !== c) h.dead = true;
  garantirInventario(c);
  c.bag = c.bag.filter((i) => i.id !== 'racoes');
  const limite = limiteSemComida(c);
  for (let i = 0; i < limite; i++) {
    diaDeViagem(rng, [c], { agua: true });
    assert.equal(nivelDeExaustao(c), 0, 'dia ' + (i + 1) + ' de ' + limite + ': ainda aguenta');
  }
  diaDeViagem(rng, [c], { agua: true });
  assert.equal(nivelDeExaustao(c), 1, 'passou do limite: um degrau');
  darRacoes(c, 1);
  diaDeViagem(rng, [c], { agua: true });
  assert.equal(c.diasSemComida, 0, 'um dia de comida de verdade zera a conta');
});

teste('forragear rende comida e agua so quando passa na CD do terreno', () => {
  const { party } = montar();
  for (const h of party) garantirInventario(h);
  const c = melhorForrageador(party);
  assert.ok(c, 'alguem forrageia');
  const sab = Math.floor((c.abilities.wis - 10) / 2);
  const antes = racoesDe(c);
  for (const c2 of party) beberAgua(c2, 99);
  const facil = forragear(dadoFixo(20), c, { terreno: 'farto', grupo: party });
  assert.equal(facil.ok, true, '20 passa na CD 10');
  const achou = facil.achou.comida;
  assert.ok(achou >= 1 + sab && achou <= 6 + sab, '1d6 + Sabedoria de comida, nao o d20');
  assert.equal(racoesDe(c), antes + achou, 'a comida entrou na mochila');
  // O livro conta GALOES de agua: aqui um galao sao quatro litros.
  assert.equal(facil.achou.liquido % 4, 0, 'a agua vem em galoes de quatro litros');
  assert.ok(facil.achou.liquido >= (1 + sab) * 4, 'e bem mais que 1d6 litros');
  // E a agua e do grupo, nao so de quem achou.
  assert.ok(party.filter((h) => aguaDe(h) > 0).length > 1, 'a agua foi repartida entre os cantis');
  assert.equal(facil.litros + facil.perdidos, facil.achou.liquido, 'o que nao coube foi contado como perdido');
  const dificil = forragear(dadoFixo(1), c, { terreno: 'ermo', grupo: party });
  assert.equal(dificil.ok, false, '1 nao passa na CD 20');
  assert.equal(dificil.racoes, 0);
  assert.equal(dificil.litros, 0);
});

teste('o 1o degrau de exaustao atrapalha quem caca e colhe', () => {
  const { party } = montar();
  const c = garantirInventario(melhorForrageador(party));
  const quase = dadoFixo(11);
  const cd = 15;
  assert.equal(forragear(quase, c, { terreno: 'comum', grupo: party }).ok,
    11 + skillBonus(c, 'sobrevivencia') >= cd, 'sem exaustao: so o bonus decide');
  mudarExaustao(c, 1);
  // Com desvantagem o dado fixo rola duas vezes o mesmo numero, entao o teste
  // mede a intencao: a chamada pede desvantagem.
  const fx = conditionEffects(c);
  assert.ok(fx.desvantagemSoTeste.includes('wis'), 'Sobrevivencia e teste de Sabedoria');
});

teste('o cantil so guarda quatro litros: o que se acha alem disso se perde', () => {
  const { party } = montar();
  const c = garantirInventario(party[DARA]);
  assert.equal(aguaDe(c), 4, 'comeca cheio');
  assert.equal(encherAgua(c, 50), 0, 'cheio nao cabe mais nada');
  beberAgua(c, 4);
  assert.equal(encherAgua(c, 50), 4, 'vazio cabe exatamente um dia');
});

teste('a sede tambem segura o descanso: quem nao bebeu nao melhora', () => {
  const { party } = montar();
  const rng = makeRng(11);
  const c = garantirInventario(party[DARA]);
  mudarExaustao(c, 2);
  beberAgua(c, 99);
  diaDeViagem(rng, [c], {});
  assert.equal(c.semAgua, true, 'o dia marcou que ele nao bebeu');
  assert.equal(c.diasSemComida, 0, 'mas comeu');
  // A mesma regra que `game/regiao.js` passa ao descanso do acampamento.
  const alimentado = (h) => (h.diasSemComida ?? 0) === 0 && !h.semAgua;
  const antes = nivelDeExaustao(c);
  descansoLongo(c, { alimentado: alimentado(c) });
  assert.equal(nivelDeExaustao(c), antes, 'dormir com sede nao desfaz degrau');
  c.semAgua = false;
  descansoLongo(c, { alimentado: alimentado(c) });
  assert.equal(nivelDeExaustao(c), antes - 1, 'comeu e bebeu: desfaz um');
});

teste('fome e sede no mesmo dia nao se empilham', () => {
  const { party } = montar();
  const rng = makeRng(13);
  const c = garantirInventario(party[DARA]);
  c.bag = c.bag.filter((i) => i.id !== 'racoes');
  c.diasSemComida = limiteSemComida(c);
  beberAgua(c, 99);
  diaDeViagem(rng, [c], {});
  // Um degrau de fome e um de sede: dois. Se a sede lesse o degrau que a fome
  // acabou de dar, ela cobraria o dobro e o dia custaria tres.
  assert.equal(nivelDeExaustao(c), 2, 'um degrau de cada, nao tres');
});

teste('o descanso longo so tira exaustao de quem comeu', () => {
  const { party } = montar();
  const [faminto, comido] = party;
  mudarExaustao(faminto, 2);
  mudarExaustao(comido, 2);
  descansoLongo(faminto, { alimentado: false });
  descansoLongo(comido, { alimentado: true });
  assert.equal(nivelDeExaustao(faminto), 2, 'quem dormiu de barriga vazia nao melhora');
  assert.equal(nivelDeExaustao(comido), 1, 'quem comeu tira um degrau');
});

teste('Criar Comida e Agua conjurada de verdade alimenta no mesmo dia', () => {
  const { party } = montar({ nivel: 5 });
  const brenn = garantirInventario(party[BRENN]);
  brenn.spellcasting.prepared.push('criarComidaEAgua');
  brenn.spellcasting.slots = [0, 4, 3, 2];
  for (const c of party) beberAgua(garantirInventario(c), 99);
  // A campanha de verdade: o dia vem de `vila.dia`, e e dele que a despensa
  // magica sabe o que foi feito HOJE.
  const campanha = { vila: { dia: 4 } };
  const estado = estadoDe(campanha);
  assert.equal(estado.dia, 4, 'o estado pega o dia da campanha');
  const r = conjurarFora(estado, brenn, 'criarComidaEAgua', { herois: party, rng: makeRng(2) });
  assert.ok(r.ok, r.why);
  const m = r.resultado.mantimentos;
  assert.equal(m.racoes, 15, 'comida para quinze');
  assert.equal(m.litros, 120, '120 litros');
  assert.equal(m.nosCantis, party.length * 4, 'os cantis do grupo enchem primeiro');
  // No dia em que foi conjurada, nada vence e a comida alimenta.
  assert.equal(limparMagicoVencido(estado, 4).length, 0, 'no mesmo dia nada estraga');
  const fontes = despensaMagica(estado);
  assert.equal(fontes[0].racoes, 15);
  diaDeViagem(makeRng(3), party, { fontes });
  assert.equal(fontes[0].racoes, 15 - party.length, 'o grupo comeu da magia, nao da mochila');
  for (const c of party) assert.equal(c.diasSemComida, 0, 'ninguem passou fome');
  assert.equal(limparMagicoVencido(estado, 5).length, 1, 'no dia seguinte estraga');
});

teste('as cinco magias de mantimento existem, com circulo e classes do livro', () => {
  const esperado = [['criarDestruirAgua', 1], ['purificarAlimentos', 1], ['detectarVenenoDoenca', 1],
    ['localizarAnimaisPlantas', 2], ['criarComidaEAgua', 3]];
  for (const [id, nivel] of esperado) {
    const s = getSpell(id);
    assert.ok(s, id + ' existe');
    assert.equal(s.level, nivel, id + ' e de ' + nivel + 'o circulo');
    assert.equal(s.soFora, true, id + ' so vale fora de combate');
    assert.equal(s.fonte, 'srd', id + ' e do SRD');
  }
  assert.ok(getSpell('purificarAlimentos').ritual, 'Purificar Alimentos e ritual');
  assert.ok(getSpell('detectarVenenoDoenca').ritual, 'Detectar Veneno e Doenca e ritual');
  assert.ok(getSpell('localizarAnimaisPlantas').ritual, 'Localizar Animais ou Plantas e ritual');
  assert.equal(getSpell('criarComidaEAgua').ritual, undefined, 'Criar Comida e Agua nao e ritual');
  assert.ok(listaDaClasse('clerigo', 3).magias.includes('criarComidaEAgua'), 'clerigo tem Criar Comida e Agua');
  assert.ok(listaDaClasse('paladino', 3).magias.includes('criarComidaEAgua'), 'paladino tambem');
  assert.ok(listaDaClasse('druida', 2).magias.includes('localizarAnimaisPlantas'), 'druida tem Localizar Animais ou Plantas');
  assert.ok(listaDaClasse('patrulheiro', 2).magias.includes('localizarAnimaisPlantas'), 'patrulheiro tambem');
  assert.ok(listaDaClasse('bardo', 2).magias.includes('localizarAnimaisPlantas'), 'bardo tambem');
  assert.ok(!listaDaClasse('mago', 3).magias.includes('criarComidaEAgua'), 'o mago nao tem');
  assert.ok(!listaDaClasse('bardo', 1).magias.includes('criarDestruirAgua'), 'o bardo nao tem Criar ou Destruir Agua');
  assert.ok(!listaDaClasse('clerigo', 3).magias.includes('localizarAnimaisPlantas'), 'o clerigo nao tem Localizar');
  // Quantidades, alcance e duracao.
  assert.equal(getSpell('criarDestruirAgua').agua, 40, '40 litros no 1o circulo');
  assert.equal(getSpell('criarDestruirAgua').upcast.agua, 40, '+40 por circulo acima');
  assert.equal(getSpell('criarComidaEAgua').racoes, 15);
  assert.equal(getSpell('criarComidaEAgua').agua, 120);
  assert.equal(getSpell('detectarVenenoDoenca').rangeFt, 30, '9 m de raio');
  assert.equal(getSpell('detectarVenenoDoenca').duracaoMin, 10);
  assert.equal(getSpell('detectarVenenoDoenca').concentration, true);
  assert.equal(getSpell('purificarAlimentos').concentration, undefined, 'Purificar nao e concentracao');
  // Cada simplificacao e regra da casa declarada no proprio texto.
  for (const id of ['criarDestruirAgua', 'purificarAlimentos', 'detectarVenenoDoenca',
    'localizarAnimaisPlantas', 'criarComidaEAgua']) {
    const d = getSpell(id).desc;
    assert.ok(/Simplifica|Regra da casa|regra da casa/.test(d), id + ' declara o que muda do livro');
  }
});

teste('Purificar limpa a agua e o mal dela, mas nao veneno de mordida', () => {
  const { party } = montar({ nivel: 5 });
  const brenn = garantirInventario(party[BRENN]);
  brenn.spellcasting.prepared.push('purificarAlimentos');
  brenn.spellcasting.slots = [0, 4, 3, 2];
  const dara = garantirInventario(party[DARA]);
  const pip = garantirInventario(party[PIP]);
  // Dara passou mal da agua; Pip levou uma mordida de aranha.
  addCondition(dara, 'envenenado', { rounds: Infinity });
  dara.maldaAgua = true;
  addCondition(pip, 'envenenado', { rounds: 10 });
  const estado = estadoDe({ vila: { dia: 1 } });
  const r = conjurarFora(estado, brenn, 'purificarAlimentos', { herois: party, rng: makeRng(4), ritual: true });
  assert.ok(r.ok, r.why);
  assert.equal(hasCondition(dara, 'envenenado'), false, 'o mal da agua sai');
  assert.equal(hasCondition(pip, 'envenenado'), true, 'o veneno da mordida fica');
});

teste('Localizar Animais ou Plantas da vantagem so no dia em que foi conjurada', () => {
  const { party } = montar({ nivel: 5 });
  const brenn = garantirInventario(party[BRENN]);
  brenn.spellcasting.prepared.push('localizarAnimaisPlantas');
  brenn.spellcasting.slots = [0, 4, 3, 2];
  const campanha = { vila: { dia: 3 } };
  const estado = estadoDe(campanha);
  const r = conjurarFora(estado, brenn, 'localizarAnimaisPlantas', { herois: party, rng: makeRng(6), ritual: true });
  assert.ok(r.ok, r.why);
  assert.equal(estado.cacaNoDia, 3, 'marcou o dia');
  campanha.vila.dia = 4;
  assert.equal(estadoDe(campanha).cacaNoDia === 4, false, 'no dia seguinte ja nao vale');
});

teste('a Pocao de vitalidade tira a exaustao inteira e o veneno', () => {
  const { enc, party } = montar();
  const c = garantirInventario(party[DARA]);
  mudarExaustao(c, 4);
  addCondition(c, 'envenenado', { rounds: 10 });
  const pocao = itemDeId('pocaoDeVitalidade')?.dados;
  assert.ok(pocao, 'a pocao existe no catalogo');
  assert.equal(pocao.consumivel, 'restaurar', 'e usavel de verdade');
  assert.equal(enc.vetoDeItem(c, pocao, c), null, 'quem esta exausto pode beber');
  enc.executarItem(c, pocao, c);
  assert.equal(nivelDeExaustao(c), 0, 'a exaustao inteira vai embora');
  assert.equal(hasCondition(c, 'envenenado'), false, 'o veneno tambem');
  descansoLongo(c, { alimentado: true });
  assert.equal(c.dadosDeVidaRestantes, c.level, 'os dados de vida voltam todos');
  assert.ok(enc.vetoDeItem(c, pocao, c), 'quem esta inteiro nao bebe a toa');
});

teste('a agua parada do brejo envenena ate o grupo dormir, e Purificar evita', () => {
  const { party } = montar();
  const c = garantirInventario(party[DARA]);
  const baixo = { ...makeRng(1), die: () => 1 };
  baixo.int = (n) => 0;
  baixo.pick = (a) => a[0];
  diaDeViagem(baixo, [c], { agua: 'suja' });
  assert.ok(hasCondition(c, 'envenenado'), 'falhou no CON 11: passou mal');
  descansoLongo(c, { alimentado: true });
  assert.equal(hasCondition(c, 'envenenado'), false, 'dormir cura o mal da agua');
  const outro = garantirInventario(party[PIP]);
  diaDeViagem(baixo, [outro], { agua: 'suja', purificada: true });
  assert.equal(hasCondition(outro, 'envenenado'), false, 'purificada nao cobra nada');
});

teste('o 1o e o 2o degraus nao atrapalham a resistencia; o 3o atrapalha', () => {
  const { enc, party } = montar();
  const c = party[DARA];
  assert.equal(enc.resistencia(c, 'con', 10).mode, 'normal', 'sem exaustao: normal');
  mudarExaustao(c, 1);
  assert.equal(enc.resistencia(c, 'con', 10).mode, 'normal', '1o degrau: resistencia normal');
  mudarExaustao(c, 1);
  assert.equal(enc.resistencia(c, 'con', 10).mode, 'normal', '2o degrau: resistencia normal');
  assert.equal(enc.testeDeAtributo(c, 'str', 0).mode, 'desvantagem', 'mas o teste de atributo e com desvantagem');
  mudarExaustao(c, 1);
  assert.equal(enc.resistencia(c, 'con', 10).mode, 'desvantagem', '3o degrau: ai sim');
});

teste('o 4o degrau nao deixa a cura tirar vida de quem ja estava acima do teto', () => {
  const { enc, party } = montar();
  const c = party[DARA];
  c.hp = c.maxHp;
  const metade = Math.floor(c.maxHp / 2);
  mudarExaustao(c, 4);
  assert.equal(c.hp, metade, 'o teto novo puxa o PV atual junto');
  const antes = c.hp;
  enc.heal(c, 5, c);
  assert.ok(c.hp >= antes, 'curar nunca baixa a vida');
});

teste('o 6o degrau mata, e morto-vivo nao cansa', () => {
  const { party, foes } = montar({ foes: [['esqueleto', { x: 6, y: 5 }]] });
  const c = party[DARA];
  mudarExaustao(c, 5);
  assert.equal(exaustaoFatal(c), false, 'no 5o ainda esta vivo');
  mudarExaustao(c, 1);
  assert.equal(exaustaoFatal(c), true, 'o 6o mata');
  assert.ok(c.dead);
  assert.equal(c.hp, 0);
  const osso = foes[0];
  if (osso?.conditionImmunities?.includes('exausto')) {
    assert.equal(mudarExaustao(osso, 3), 0, 'quem e imune a exaustao nao ganha degrau');
  }
});

console.log(`\n${total - falhas}/${total} passaram`);
if (falhas) process.exit(1);
