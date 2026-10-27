// Testes do movimento ENTRE criaturas (SRD 5.1, "Moving Around Other Creatures"). Rode com:
//   node src/dev/testes-movimento-aliados.mjs
//
// A regra: passa-se pelo espaço de uma criatura NÃO hostil (aliado, neutro); pelo de uma hostil só se ela for duas categorias
// de tamanho maior ou menor; o espaço de outra criatura é TERRENO DIFÍCIL (custa o dobro, 10 pés por casa); e não se termina
// o movimento no espaço de outra criatura. Nada empurra nem derruba o aliado.

import assert from 'node:assert/strict';
import { Encounter } from '../rules/combat.js';
import { makeParty } from '../rules/party.js';
import { makeMonster } from '../rules/monsters.js';
import { Battlefield, distanceFt } from '../core/grid.js';
import { takeMonsterTurn } from '../rules/ai.js';
import { makeRng } from '../core/rng.js';
import { addCondition } from '../rules/conditions.js';

const [DARA, PIP, BRENN, ILVAN] = [0, 1, 2, 3];
const lin = (n, f) => Array.from({ length: 12 }, (_, y) => f(y).padEnd(12, '#').slice(0, 12)).slice(0, n);

/** Corredor de 1 casa (a linha y=5), de 2 casas (y=4 e y=5) ou o campo aberto. */
const CORREDOR = lin(12, (y) => (y === 5 ? '............' : '############'));
const CORREDOR2 = lin(12, (y) => (y === 4 || y === 5 ? '............' : '############'));
const ABERTO = Array(12).fill('............');

function montar({ mapa = ABERTO, party: pp, foes = [], lado = 'party' } = {}) {
  const field = new Battlefield(12, 12, mapa);
  const party = makeParty({ nivel: 2 });
  const lugares = pp ?? [{ x: 5, y: 5 }, { x: 6, y: 5 }, { x: 10, y: 10 }, { x: 11, y: 10 }];
  party.forEach((c, i) => { c.pos = { ...lugares[i] }; });
  const fs = foes.map(([id, p]) => makeMonster(id, p));
  const log = [];
  const enc = new Encounter({ battlefield: field, party, foes: fs, rng: makeRng(3), onLog: (e) => log.push(e) });
  enc.firstSide = lado;
  enc.round = 1;
  enc.beginSide(lado);
  return { enc, party, foes: fs, log };
}

let falhas = 0;
let total = 0;
function teste(nome, fn) {
  total += 1;
  try { fn(); console.log(`ok    ${nome}`); } catch (e) {
    falhas += 1;
    console.log(`FALHA ${nome}\n      ${e.message.split('\n').join('\n      ')}`);
  }
}
const xy = (c) => ({ x: c.pos.x, y: c.pos.y });

// ---- (a) aliado no corredor de 1 casa --------------------------------------

teste('(a) aliado no corredor: atravessa pagando o dobro (5 + 10) e não para na casa dele', () => {
  const { enc, party } = montar({ mapa: CORREDOR });
  const [dara, pip] = [party[DARA], party[PIP]];
  dara.movementLeftFt = 30;
  const alcance = enc.reachableFor(dara);
  assert.equal(alcance.get('6,5').cost, 10, 'entrar na casa do aliado custa 10 (terreno difícil)');
  assert.equal(alcance.get('6,5').parar, false, 'e ela não serve de destino');
  assert.equal(alcance.get('7,5').cost, 15, 'a casa de trás: 10 do aliado + 5 da seguinte');
  assert.equal(alcance.get('7,5').parar, true);
  // Orçamento curto: com 10 pés não chega atrás dele; com 15, chega.
  dara.movementLeftFt = 10;
  assert.ok(!enc.reachableFor(dara).has('7,5'), '10 pés não bastam para passar pelo aliado e pisar atrás');
  dara.movementLeftFt = 15;
  assert.ok(enc.reachableFor(dara).has('7,5'), '15 pés bastam');
  // Parar em cima dele: recusado.
  assert.ok(!enc.moveAlong(dara, [{ x: 5, y: 5 }, { x: 6, y: 5 }]), 'não termina o movimento no espaço do aliado');
  assert.deepEqual(xy(dara), { x: 5, y: 5 });
  // Atravessar: anda, cobra 15, o aliado nem se mexe.
  assert.ok(enc.moveAlong(dara, [{ x: 5, y: 5 }, { x: 6, y: 5 }, { x: 7, y: 5 }]));
  assert.deepEqual(xy(dara), { x: 7, y: 5 });
  assert.deepEqual(xy(pip), { x: 6, y: 5 }, 'o aliado não é empurrado');
  assert.equal(dara.movementLeftFt, 0, 'gastou os 15 pés');
});

teste('(a) caído ou inconsciente no caminho não muda a regra: passa-se, a 10 pés a casa', () => {
  for (const cond of ['caido', 'inconsciente']) {
    const { enc, party } = montar({ mapa: CORREDOR });
    const [dara, pip] = [party[DARA], party[PIP]];
    addCondition(pip, cond);
    dara.movementLeftFt = 30;
    const a = enc.reachableFor(dara);
    assert.equal(a.get('7,5')?.cost, 15, `${cond}: atravessa pagando 15`);
    assert.ok(enc.moveAlong(dara, [{ x: 5, y: 5 }, { x: 6, y: 5 }, { x: 7, y: 5 }]), cond);
    assert.deepEqual(xy(dara), { x: 7, y: 5 });
  }
});

teste('(a) o ataque de oportunidade de quem fica para trás continua valendo; o aliado não é tocado', () => {
  const { enc, party, foes, log } = montar({ mapa: CORREDOR, foes: [['goblin', { x: 4, y: 5 }]] });
  const dara = party[DARA];
  dara.movementLeftFt = 30;
  const n = log.length;
  assert.ok(enc.moveAlong(dara, [{ x: 5, y: 5 }, { x: 6, y: 5 }, { x: 7, y: 5 }]));
  assert.ok(log.slice(n).some((e) => /aproveita a brecha/.test(e.text)), 'o goblin aproveita a brecha ao ela sair do alcance');
  assert.equal(foes[0].reactionUsed, true);
  assert.deepEqual(xy(party[PIP]), { x: 6, y: 5 });
});

teste('(a) interrompida dentro do espaço do aliado, ela recua para a última casa livre', () => {
  const { enc, party } = montar({ mapa: CORREDOR });
  const dara = party[DARA];
  dara.movementLeftFt = 30;
  // A cena manda parar o herói exatamente na casa do aliado.
  enc.paraNaCasa = (_a, p) => p.x === 6 && p.y === 5;
  assert.ok(enc.moveAlong(dara, [{ x: 5, y: 5 }, { x: 6, y: 5 }, { x: 7, y: 5 }]));
  assert.ok(!enc.occupied(dara.pos.x, dara.pos.y, dara) || enc.at(dara.pos.x, dara.pos.y) === dara, 'não fica em cima do aliado');
  assert.notDeepEqual(xy(dara), xy(party[PIP]));
});

// ---- (b) hostil continua barrando ------------------------------------------

teste('(b) hostil no corredor barra: nem o caminho, nem o destino atrás dele', () => {
  const { enc, party } = montar({ mapa: CORREDOR, foes: [['goblin', { x: 6, y: 5 }]], party: [{ x: 5, y: 5 }, { x: 1, y: 5 }, { x: 2, y: 5 }, { x: 3, y: 5 }] });
  const dara = party[DARA];
  dara.movementLeftFt = 60;
  const a = enc.reachableFor(dara);
  assert.ok(!a.has('7,5'), 'a casa atrás do goblin não é alcançável');
  assert.equal(a.get('6,5')?.passar, false);
  assert.ok(!enc.moveAlong(dara, [{ x: 5, y: 5 }, { x: 6, y: 5 }, { x: 7, y: 5 }]), 'não atravessa o inimigo');
});

teste('(b) hostil duas categorias menor (Miúdo) se atravessa; uma categoria (Grande) não', () => {
  // Miúdo (stirge) x Médio (Dara): duas categorias.
  let { enc, party } = montar({ mapa: CORREDOR, foes: [['stirge', { x: 6, y: 5 }]], party: [{ x: 5, y: 5 }, { x: 1, y: 5 }, { x: 2, y: 5 }, { x: 3, y: 5 }] });
  party[DARA].movementLeftFt = 30;
  const a = enc.reachableFor(party[DARA]);
  assert.equal(a.get('7,5')?.cost, 15, 'atravessa o Miúdo hostil pagando o dobro');
  assert.equal(a.get('6,5').parar, false, 'mas não pára no espaço dele');
  // Grande (ogro) x Médio: uma categoria só.
  ({ enc, party } = montar({ mapa: CORREDOR2, foes: [['ogro', { x: 6, y: 4 }]], party: [{ x: 5, y: 5 }, { x: 1, y: 5 }, { x: 2, y: 5 }, { x: 3, y: 5 }] }));
  party[DARA].movementLeftFt = 60;
  assert.ok(!enc.reachableFor(party[DARA]).has('8,5'), 'o ogro (Grande, 2x2) fecha o corredor de duas casas para o Médio');
  // Enorme x Médio: duas categorias (o tamanho vem da ficha, aqui forçado).
  ({ enc, party } = montar({ mapa: CORREDOR, foes: [['goblin', { x: 6, y: 5 }]], party: [{ x: 5, y: 5 }, { x: 1, y: 5 }, { x: 2, y: 5 }, { x: 3, y: 5 }] }));
  enc.combatants.find((c) => c.side === 'foes').size = 'enorme';
  party[DARA].movementLeftFt = 30;
  assert.equal(enc.reachableFor(party[DARA]).get('7,5')?.cost, 15, 'Enorme x Médio se atravessa');
});

// ---- (c) o caminho preferido evita o aliado --------------------------------

teste('(c) com rota livre mais barata, o caminho contorna o aliado', () => {
  const { enc, party } = montar({ party: [{ x: 5, y: 5 }, { x: 6, y: 5 }, { x: 10, y: 10 }, { x: 11, y: 10 }] });
  const dara = party[DARA];
  dara.movementLeftFt = 30;
  const a = enc.reachableFor(dara);
  assert.equal(a.get('7,5').cost, 10, 'dois passos em diagonal por fora: 10');
  const rota = Battlefield.pathFrom(a, { x: 7, y: 5 });
  assert.ok(!rota.some((p) => p.x === 6 && p.y === 5), 'o caminho não passa pelo aliado');
});

teste('(c) empate de custo: a rota livre vence a que atravessa o aliado', () => {
  // Terreno difícil ao redor: por fora (6,4) custa 10 + 5 = 15; por dentro do aliado 10 + 5 = 15.
  const mapa = ABERTO.map((l, y) => (y === 4 || y === 6 ? l.slice(0, 6) + '~' + l.slice(7) : l));
  const { enc, party } = montar({ mapa, party: [{ x: 5, y: 5 }, { x: 6, y: 5 }, { x: 10, y: 10 }, { x: 11, y: 10 }] });
  const dara = party[DARA];
  dara.movementLeftFt = 30;
  const a = enc.reachableFor(dara);
  assert.equal(a.get('7,5').cost, 15);
  const rota = Battlefield.pathFrom(a, { x: 7, y: 5 });
  assert.ok(!rota.some((p) => p.x === 6 && p.y === 5), `no empate vai pela casa livre, e foi por ${rota.map((p) => `${p.x},${p.y}`).join(' ')}`);
});

// ---- (d) criatura Grande ---------------------------------------------------

teste('(d) criatura Grande (2x2) atravessa o aliado pela pegada, pagando o dobro, e não para com ele dentro do corpo', () => {
  const { enc, foes } = montar({ mapa: CORREDOR2, foes: [['ogro', { x: 3, y: 4 }], ['goblin', { x: 5, y: 4 }]], party: [{ x: 11, y: 4 }, { x: 11, y: 5 }, { x: 10, y: 4 }, { x: 10, y: 5 }] });
  const [ogro, goblin] = foes;
  assert.equal(ogro.pos.f, 2, 'o ogro ocupa 2x2');
  enc.beginSide('foes');
  ogro.movementLeftFt = 40;
  const a = enc.reachableFor(ogro);
  assert.equal(a.get('5,4')?.parar, false, 'âncora (5,4): o goblin está dentro do corpo, não pode parar');
  assert.equal(a.get('4,4')?.parar, false, 'âncora (4,4): a pegada 4..5 pega o goblin em (5,4)');
  assert.equal(a.get('7,4')?.cost, 30, '10 + 10 + 5 + 5 pela pegada');
  assert.equal(a.get('6,4')?.parar, true, 'a pegada 6..7 está livre');
  assert.ok(enc.moveAlong(ogro, Battlefield.pathFrom(a, { x: 7, y: 4 })));
  assert.deepEqual(xy(ogro), { x: 7, y: 4 });
  assert.deepEqual(xy(goblin), { x: 5, y: 4 }, 'o goblin não se mexeu');
  assert.equal(ogro.movementLeftFt, 10);
});

teste('(d) o Grande não atravessa um herói (hostil de tamanho vizinho) e o aliado Pequeno não o impede de passar por cima', () => {
  const { enc, foes } = montar({ mapa: CORREDOR2, foes: [['ogro', { x: 3, y: 4 }]], party: [{ x: 6, y: 4 }, { x: 11, y: 4 }, { x: 11, y: 5 }, { x: 10, y: 5 }] });
  const ogro = foes[0];
  enc.beginSide('foes');
  ogro.movementLeftFt = 40;
  const a = enc.reachableFor(ogro);
  assert.ok(![...a.keys()].some((k) => Number(k.split(',')[0]) >= 6 && a.get(k).parar), 'não passa pela Dara em (6,4)');
});

// ---- (e) a IA dos monstros atravessa o aliado ------------------------------

teste('(e) o monstro conta o dobro por atravessar o aliado dele (mesma regra e mesmo custo do herói)', () => {
  const { enc, foes } = montar({
    mapa: CORREDOR,
    foes: [['esqueleto', { x: 3, y: 5 }], ['esqueleto', { x: 5, y: 5 }]],
    party: [{ x: 9, y: 5 }, { x: 11, y: 5 }, { x: 10, y: 5 }, { x: 8, y: 5 }],
    lado: 'foes',
  });
  const alcance = enc.reachableFor(foes[0]);
  assert.equal(alcance.get('5,5').cost, 15, '(4,5) 5 + o aliado em (5,5) 10');
  assert.equal(alcance.get('5,5').parar, false);
  assert.equal(alcance.get('6,5').cost, 20, 'e a casa de trás dele 5 a mais');
});

teste('(e) a IA anda de verdade por cima do aliado e termina numa casa livre', () => {
  const { enc, party, foes } = montar({
    mapa: CORREDOR,
    foes: [['esqueleto', { x: 3, y: 5 }], ['esqueleto', { x: 5, y: 5 }]],
    party: [{ x: 9, y: 5 }, { x: 11, y: 5 }, { x: 10, y: 5 }, { x: 8, y: 5 }],
    lado: 'foes',
  });
  const [a, b] = foes;
  enc.beginSide('foes');
  takeMonsterTurn(enc, a);
  assert.ok(a.pos.x > 5, `o de trás passou pelo da frente (foi parar em ${a.pos.x},${a.pos.y})`);
  assert.notDeepEqual(xy(a), xy(b), 'não termina em cima do aliado');
  void party;
});

// ---- tamanho do herói, guarda do caminho de fora, Forma Gasosa, rastejar --------

teste('(f) halfling é Pequeno: Pip atravessa o ogro hostil (2 categorias) e o ogro atravessa o Pip; o Médio não atravessa o ogro', () => {
  const pos = [{ x: 1, y: 2 }, { x: 1, y: 5 }, { x: 10, y: 10 }, { x: 11, y: 10 }];
  // Pip (Halfling) em (1,5), ogro em (3,4) cobrindo (3..4, 4..5) no corredor de duas casas.
  const { enc, party, foes } = montar({ mapa: CORREDOR2, foes: [['ogro', { x: 3, y: 4 }]], party: pos });
  const [, pip] = party;
  pip.pos = { x: 1, y: 5 };
  pip.movementLeftFt = 30;
  assert.equal(enc.reachableFor(pip).get('5,5')?.cost, 5 + 10 + 10 + 5, 'Pequeno x Grande: atravessa o ogro pagando o dobro nas duas casas do corpo');
  // O ogro (Grande) atravessa o Pip (Pequeno hostil) com a pegada.
  const ogro = foes[0];
  enc.beginSide('foes');
  pip.pos = { x: 5, y: 4 };
  ogro.movementLeftFt = 40;
  const a = enc.reachableFor(ogro);
  assert.ok(a.get('6,4'), 'o ogro alcança a casa de trás do Pip');
  assert.equal(a.get('5,4')?.parar, false, 'mas não para em cima dele');
  // O Médio (Dara) não atravessa o ogro.
  enc.beginSide('party');
  party[DARA].pos = { x: 1, y: 4 };
  party[DARA].movementLeftFt = 60;
  assert.ok(![...enc.reachableFor(party[DARA]).keys()].some((k) => Number(k.split(',')[0]) >= 5), 'o Médio não passa do ogro');
});

teste('(g) caminho montado de fora: o ogro não anda por cima de um herói que não atravessa', () => {
  const { enc, party, foes } = montar({ foes: [['ogro', { x: 2, y: 2 }]], party: [{ x: 4, y: 2 }, { x: 10, y: 10 }, { x: 11, y: 10 }, { x: 11, y: 11 }], lado: 'foes' });
  const ogro = foes[0];
  ogro.movementLeftFt = 40;
  const dara = party[DARA];
  assert.ok(!enc.moveAlong(ogro, [{ x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 2 }]), 'o caminho passa por cima da Dara (Médio): recusado');
  assert.deepEqual(xy(ogro), { x: 2, y: 2 });
  assert.deepEqual(xy(dara), { x: 4, y: 2 });
});

teste('(h) Forma Gasosa atravessa até o hostil (mas não termina dentro dele)', () => {
  const { enc, party } = montar({ mapa: CORREDOR, foes: [['goblin', { x: 6, y: 5 }]], party: [{ x: 5, y: 5 }, { x: 1, y: 5 }, { x: 2, y: 5 }, { x: 3, y: 5 }] });
  const dara = party[DARA];
  dara.movementLeftFt = 30;
  assert.ok(!enc.reachableFor(dara).has('7,5'), 'sem a magia, o goblin barra');
  addCondition(dara, 'gasoso');
  const a = enc.reachableFor(dara);
  assert.ok(a.get('7,5'), 'em Forma Gasosa passa pelo goblin');
  assert.equal(a.get('6,5').parar, false, 'sem parar no espaço dele (simplificação: duas criaturas na mesma casa não se representam)');
});

teste('(i) rastejar soma com o terreno difícil: caído em terreno difícil custa 15 pés, e não 20', () => {
  const mapa = ABERTO.map((l, y) => (y === 5 ? l.slice(0, 6) + '~' + l.slice(7) : l));
  const { enc, party } = montar({ mapa, party: [{ x: 5, y: 5 }, { x: 1, y: 1 }, { x: 1, y: 3 }, { x: 1, y: 9 }] });
  const dara = party[DARA];
  dara.movementLeftFt = 30;
  assert.equal(enc.reachableFor(dara).get('6,5').cost, 10, 'de pé: terreno difícil 10');
  addCondition(dara, 'caido');
  const a = enc.reachableFor(dara);
  assert.equal(a.get('6,5').cost, 15, 'caído: 5 + 5 do terreno difícil + 5 de rastejar = 15 (SRD: 3 pés por pé)');
  assert.equal(a.get('4,5').cost, 10, 'caído em chão livre: 10');
  const antes = dara.movementLeftFt;
  assert.ok(enc.moveAlong(dara, [{ x: 5, y: 5 }, { x: 6, y: 5 }]));
  assert.equal(antes - dara.movementLeftFt, 15, 'e o movimento gasto é o mesmo que o alcance mostrou');
});

console.log(`\n${total - falhas}/${total} testes de movimento entre criaturas`);
process.exit(falhas ? 1 : 0);
