// Testes da RÉGUA COM ESCALAS (`rules/rota.js`): o caminho pelas escalas, o custo de verdade, o que não alcança e os
// avisos (ataque de oportunidade, região que fere). Rode com:
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-rota.mjs
//
// Mede-se o motor de verdade: a rota é andada com `moveAlong`, e o que ela avisou tem de acontecer.

import assert from 'node:assert/strict';
import { Encounter } from '../rules/combat.js';
import { makeParty } from '../rules/party.js';
import { makeMonster } from '../rules/monsters.js';
import { Battlefield, key } from '../core/grid.js';
import { makeRng } from '../core/rng.js';
import { prepararRegioes } from '../rules/regioes.js';
import { tracarRota, escalasValidas, MAX_ESCALAS } from '../rules/rota.js';

let total = 0;
let falhas = 0;
function teste(nome, fn) {
  total += 1;
  try { fn(); console.log(`ok    ${nome}`); } catch (e) {
    falhas += 1;
    console.log(`FALHA ${nome}\n      ${e.message.split('\n').join('\n      ')}`);
  }
}

const ABERTO = Array(12).fill('............');

/** Dara em (2, 5), o resto do grupo longe; inimigos onde o teste pede. */
function montar({ foes = [], regioes = [], linhas = ABERTO } = {}) {
  const field = new Battlefield(12, 12, linhas);
  prepararRegioes(field, regioes);
  const party = makeParty({ nivel: 2 });
  party.forEach((c, i) => { c.pos = { x: 11, y: 8 + i }; });
  const dara = party[0];
  dara.pos = { x: 2, y: 5 };
  const fs = foes.map(([id, p]) => makeMonster(id, p));
  const enc = new Encounter({ battlefield: field, party, foes: fs, rng: makeRng(5), onLog: () => {}, onEvent: () => {} });
  enc.firstSide = 'party';
  enc.round = 1;
  enc.beginSide('party');
  return { enc, dara, foes: fs, field };
}
const passaPor = (caminho, p) => caminho.some((q) => q.x === p.x && q.y === p.y);

teste('sem escalas, a rota é o caminho mais curto e custa o mesmo que o alcance', () => {
  const { enc, dara } = montar();
  const r = tracarRota(enc, dara, [], { x: 6, y: 5 });
  assert.equal(r.ok, true);
  assert.equal(r.custo, enc.reachableFor(dara).get(key(6, 5)).cost);
  assert.equal(r.custo, 20);
  assert.deepEqual(r.caminho.at(-1), { x: 6, y: 5 });
  assert.equal(r.restante, dara.movementLeftFt - 20);
});

teste('com uma escala, o caminho passa por ela e custa o desvio', () => {
  const { enc, dara } = montar();
  const r = tracarRota(enc, dara, [{ x: 4, y: 2 }], { x: 6, y: 5 });
  assert.equal(r.ok, true);
  assert.ok(passaPor(r.caminho, { x: 4, y: 2 }), 'passa pela escala');
  assert.equal(r.custo, 15 + 15, 'três diagonais até a escala, três de volta');
  assert.deepEqual(r.escalas, [{ x: 4, y: 2 }]);
});

teste('andar a rota com moveAlong cobra o custo da rota, e o herói chega', () => {
  const { enc, dara } = montar();
  const antes = dara.movementLeftFt;
  const r = tracarRota(enc, dara, [{ x: 4, y: 2 }], { x: 6, y: 5 });
  assert.notEqual(enc.moveAlong(dara, r.caminho), false);
  assert.deepEqual({ x: dara.pos.x, y: dara.pos.y }, { x: 6, y: 5 });
  assert.equal(antes - dara.movementLeftFt, r.custo);
});

teste('a escala longe demais não fecha: ok falso, e diz onde parou', () => {
  const { enc, dara } = montar();
  const r = tracarRota(enc, dara, [{ x: 2, y: 0 }, { x: 2, y: 11 }], { x: 3, y: 11 });
  assert.equal(r.ok, false);
  assert.equal(r.motivo, 'longe');
  assert.deepEqual(r.ate, { x: 2, y: 11 });
  assert.deepEqual(r.caminho.at(-1), { x: 2, y: 0 }, 'o caminho vai até a última escala alcançada');
});

teste('o desvio que passa do deslocamento falha mesmo com o destino perto', () => {
  const { enc, dara } = montar();
  dara.movementLeftFt = 20;
  assert.equal(tracarRota(enc, dara, [], { x: 4, y: 5 }).ok, true);
  assert.equal(tracarRota(enc, dara, [{ x: 2, y: 1 }], { x: 4, y: 5 }).ok, false);
});

teste('parede: a escala dentro dela é recusada como bloqueada', () => {
  const linhas = [...ABERTO];
  linhas[3] = '....#.......';
  const { enc, dara } = montar({ linhas });
  const r = tracarRota(enc, dara, [{ x: 4, y: 3 }], { x: 6, y: 5 });
  assert.equal(r.ok, false);
  assert.equal(r.motivo, 'bloqueada');
});

teste('a escala em cima de um aliado vale (de passagem); o destino em cima dele, não', () => {
  const { enc, dara } = montar();
  const pip = enc.combatants.find((c) => c.side === 'party' && c !== dara);
  pip.pos = { x: 4, y: 5 };
  assert.equal(tracarRota(enc, dara, [{ x: 4, y: 5 }], { x: 6, y: 5 }).ok, true);
  const r = tracarRota(enc, dara, [], { x: 4, y: 5 });
  assert.equal(r.ok, false);
  assert.equal(r.motivo, 'ocupada');
});

teste('a rota não mexe no herói: a posição volta igual depois de traçar', () => {
  const { enc, dara } = montar();
  const antes = JSON.stringify(dara.pos);
  tracarRota(enc, dara, [{ x: 4, y: 2 }, { x: 8, y: 2 }], { x: 6, y: 5 });
  assert.equal(JSON.stringify(dara.pos), antes);
});

teste('ataque de oportunidade: avisa na casa de onde se sai do alcance, e acontece', () => {
  const { enc, dara, foes } = montar({ foes: [['goblin', { x: 3, y: 5 }]] });
  const [g] = foes;
  const r = tracarRota(enc, dara, [], { x: 0, y: 5 });
  const op = r.avisos.filter((a) => a.tipo === 'oportunidade');
  assert.equal(op.length, 1);
  assert.equal(op[0].quem, g.id);
  assert.deepEqual({ x: op[0].x, y: op[0].y }, { x: 2, y: 5 });
  assert.match(op[0].texto, /oportunidade/);
  enc.moveAlong(dara, r.caminho);
  assert.equal(g.reactionUsed, true, 'o goblin reagiu, como a régua disse');
});

teste('a escala que fica no alcance não provoca: a rota em volta do goblin não avisa até sair', () => {
  const { enc, dara } = montar({ foes: [['goblin', { x: 3, y: 5 }]] });
  // de (2,5) para (3,4) e (4,4): continua colado no goblin; só o último passo sai do alcance
  const r = tracarRota(enc, dara, [{ x: 3, y: 4 }], { x: 5, y: 4 });
  const op = r.avisos.filter((a) => a.tipo === 'oportunidade');
  assert.equal(op.length, 1);
  assert.deepEqual({ x: op[0].x, y: op[0].y }, { x: 4, y: 4 });
});

teste('Desengajar: nenhum aviso de oportunidade', () => {
  const { enc, dara } = montar({ foes: [['goblin', { x: 3, y: 5 }]] });
  dara.disengaging = true;
  assert.equal(tracarRota(enc, dara, [], { x: 0, y: 5 }).avisos.length, 0);
});

teste('inimigo que o jogador não vê não entra no aviso', () => {
  const { enc, dara } = montar({ foes: [['goblin', { x: 3, y: 5 }]] });
  const r = tracarRota(enc, dara, [], { x: 0, y: 5 }, { visivel: () => false });
  assert.equal(r.avisos.length, 0);
});

teste('cada inimigo avisa uma vez só (a reação é uma por rodada)', () => {
  const { enc, dara } = montar({ foes: [['goblin', { x: 3, y: 5 }]] });
  // sai do alcance, volta, sai de novo
  const r = tracarRota(enc, dara, [{ x: 0, y: 5 }, { x: 2, y: 4 }], { x: 0, y: 3 });
  assert.equal(r.avisos.filter((a) => a.tipo === 'oportunidade').length, 1);
});

const fosso = (extra = {}) => ({
  id: 'fosso', nome: 'o fosso', casas: ['4,5', '4,4', '4,6'], quando: ['entrar'],
  efeitos: [{ tipo: 'dano', dados: '1d6', dano: 'concussão' }], ...extra,
});

teste('região à vista que fere: avisa na casa em que se entra nela', () => {
  const { enc, dara } = montar({ regioes: [fosso()] });
  const r = tracarRota(enc, dara, [], { x: 6, y: 5 });
  const av = r.avisos.filter((a) => a.tipo === 'regiao');
  assert.equal(av.length, 1);
  assert.deepEqual({ x: av[0].x, y: av[0].y }, { x: 4, y: 5 });
  assert.match(av[0].texto, /o fosso/);
});

teste('a escala que contorna a região tira o aviso', () => {
  const { enc, dara } = montar({ regioes: [fosso()] });
  const r = tracarRota(enc, dara, [{ x: 4, y: 2 }], { x: 6, y: 5 });
  assert.equal(r.avisos.filter((a) => a.tipo === 'regiao').length, 0);
});

teste('região escondida, só de texto ou de outro lado não avisa', () => {
  for (const extra of [
    { escondida: { cd: 12, achado: 'um fosso' } },
    { efeitos: [{ tipo: 'texto', texto: 'o chão range' }] },
    { efeitos: [{ tipo: 'terrenoDificil' }] },
    { quem: 'inimigos' },
    { desligada: true },
  ]) {
    const { enc, dara } = montar({ regioes: [fosso(extra)] });
    const r = tracarRota(enc, dara, [], { x: 6, y: 5 });
    assert.equal(r.avisos.length, 0, JSON.stringify(extra));
  }
});

teste('escalas da rede: a forma é conferida', () => {
  assert.equal(escalasValidas(undefined), true);
  assert.equal(escalasValidas([[1, 2], [3, 4]]), true);
  assert.equal(escalasValidas(Array(MAX_ESCALAS + 1).fill([1, 1])), false, 'demais');
  for (const ruim of ['1,2', [[1]], [[1, 2, 3]], [[1.5, 2]], [[-1, 2]], [[1, 401]], [{ x: 1, y: 2 }], null]) {
    assert.equal(escalasValidas(ruim), false, JSON.stringify(ruim));
  }
});

console.log(`\n${total - falhas}/${total} testes passaram`);
if (falhas) process.exit(1);
