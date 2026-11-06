// ESPREMER (SRD 5.1): a criatura entra num espaço grande o bastante para uma criatura UMA CATEGORIA menor.
// Cada 1,5 m custa 1,5 m a mais, ela ataca e faz testes de Destreza com desvantagem, e quem a ataca tem vantagem.
//
//   node src/dev/testes-espremer.mjs
//
// POR QUE ISTO EXISTE. O motor exigia a pegada 2x2 INTEIRA livre, sempre — e com isso nenhuma criatura Grande
// passava por porta de uma casa. Num battlemap de verdade isso é a regra, não a exceção: o dragão da Árvore
// Trovão não saía da torre, e quatro testes de cena quebravam por causa disso. Espremer é do livro; a falta
// dela era nossa.
import assert from 'node:assert/strict';

const P = new URL('../', import.meta.url).href;
const { Battlefield } = await import(P + 'core/grid.js');
const { Encounter } = await import(P + 'rules/combat.js');
const { makeMonster } = await import(P + 'rules/monsters.js');
const { makeParty } = await import(P + 'rules/party.js');
const { makeRng } = await import(P + 'core/rng.js');
const { hasCondition, CONDITIONS } = await import(P + 'rules/conditions.js');

let total = 0;
let falhas = 0;
function teste(nome, fn) {
  total += 1;
  try { fn(); console.log(`ok    ${nome}`); } catch (e) {
    falhas += 1;
    console.log(`FALHA ${nome}\n      ${String(e.message).split('\n').join('\n      ')}`);
  }
}

/**
 * Um corredor de 9x5 com uma parede no meio e um vão de UMA casa em (4,2), mais uma alcova de uma casa no
 * canto. O ogro (Grande, 2x2) entra pelo oeste.
 */
function arena() {
  const terreno = ['LLLLLLLLL', 'LLLLLLLLL', 'LLLLLLLLL', 'LLLLLLLLL', 'LLLLLLLLL'];
  const f = new Battlefield(9, 5, terreno);
  for (const y of [0, 1, 3, 4]) f.porAresta(3, y, 4, y, 1);   // a parede, menos na fileira do vão
  // A ALCOVA: (8,0) tem parede a oeste e o leste é a borda do mapa, então a pegada 2x2 nunca cabe lá. Entra-se
  // por (8,1), espremendo. O grupo fica longe dessa coluna, senão um herói tapa a única entrada.
  f.porAresta(7, 0, 8, 0, 1);
  const ogro = makeMonster('ogro', { x: 1, y: 2 });
  const party = makeParty({ nivel: 3 });
  // o grupo encostado no canto oeste, fora do corredor e da alcova
  [[0, 0], [1, 0], [0, 4], [1, 4]].forEach(([x, y], i) => { if (party[i]) party[i].pos = { x, y }; });
  const enc = new Encounter({ battlefield: f, party, foes: [ogro], rng: makeRng(1), emboscada: null, reinforcements: () => null, onEvent: () => {} });
  return { f, enc, ogro };
}

teste('o Grande ATRAVESSA um vão de uma casa, que antes o barrava', () => {
  const { enc, ogro } = arena();
  ogro.movementLeftFt = 60;
  const alc = enc.reachableFor(ogro);
  assert.ok(alc.get('4,2'), 'o vão de uma casa continua fora do alcance do ogro');
  assert.ok(alc.get('6,2'), 'o outro lado da parede continua inalcançável');
  assert.equal(alc.get('4,2').apertado, true, 'o vão tinha de estar marcado como apertado');
  assert.equal(alc.get('2,2').apertado, false, 'o corredor largo não é aperto nenhum');
});

teste('espremer custa 1,5 m a mais por quadrado, e a conta andada bate com a da busca', () => {
  const { enc, ogro } = arena();
  ogro.movementLeftFt = 60;
  const alc = enc.reachableFor(ogro);
  // (1,2) -> (4,2): três quadrados, DOIS deles apertados (em (3,2) a pegada já pega a parede)
  const previsto = alc.get('4,2').cost;
  assert.equal(previsto, 25, `a busca previu ${previsto} pés, e três quadrados com dois apertos são 25`);
  enc.moveAlong(ogro, Battlefield.pathFrom(alc, { x: 4, y: 2 }));
  const gasto = 60 - ogro.movementLeftFt;
  assert.equal(gasto, previsto, `andou cobrando ${gasto} e a busca tinha previsto ${previsto}: o cartão mentiria`);
});

teste('a condição ESPREMIDO entra ao parar no aperto e sai ao soltar-se', () => {
  const { enc, ogro } = arena();
  ogro.movementLeftFt = 90;
  const alc = enc.reachableFor(ogro);
  assert.ok(alc.get('8,0'), 'a alcova de uma casa tinha de estar no alcance, espremendo');
  enc.moveAlong(ogro, Battlefield.pathFrom(alc, { x: 8, y: 0 }));
  assert.deepEqual({ x: ogro.pos.x, y: ogro.pos.y }, { x: 8, y: 0 }, 'não chegou à alcova');
  assert.ok(hasCondition(ogro, 'espremido'), 'parou numa casa onde não cabe inteiro e não ficou espremido');
  // e ao sair para o aberto, solta
  ogro.movementLeftFt = 60;
  const alc2 = enc.reachableFor(ogro);
  enc.moveAlong(ogro, Battlefield.pathFrom(alc2, { x: 6, y: 2 }));
  assert.ok(!hasCondition(ogro, 'espremido'), 'saiu do aperto e continuou espremido');
});

teste('espremido: desvantagem no ataque dele, vantagem em quem o ataca, desvantagem em Destreza', () => {
  const c = CONDITIONS.espremido;
  assert.ok(c, 'a condição espremido não existe');
  assert.equal(c.attackDisadvantage, true, 'espremido ataca com desvantagem');
  assert.equal(c.attackedAdvantage, true, 'quem ataca o espremido tem vantagem');
  assert.ok((c.desvantagemTeste ?? []).includes('dex'), 'espremido tem desvantagem em Destreza');
});

teste('quem é Médio não espreme: a regra só vale para quem ocupa mais de um quadrado', () => {
  const { enc } = arena();
  const heroi = enc.allOf('party')[0];
  heroi.movementLeftFt = 60;
  const alc = enc.reachableFor(heroi);
  for (const no of alc.values()) assert.ok(!no.apertado, `o Médio foi marcado como apertado em (${no.x},${no.y})`);
});

console.log(`\n${total - falhas}/${total} testes passaram`);
process.exit(falhas ? 1 : 0);
