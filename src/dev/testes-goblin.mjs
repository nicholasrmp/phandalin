// Testes do GOBLIN ÚNICO (espada e escudo ou arco). Rode com:
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-goblin.mjs
//
// O goblin guerreiro e o goblin arqueiro foram unidos: um bloco do SRD só, a
// figura troca de folha com a arma do golpe, e trocar de arma é a interação
// gratuita do turno (uma por turno). Aqui se conferem as quatro regras novas.

import assert from 'node:assert/strict';
import { Encounter } from '../rules/combat.js';
import { makeParty } from '../rules/party.js';
import { makeMonster } from '../rules/monsters.js';
import { Battlefield } from '../core/grid.js';
import { makeRng } from '../core/rng.js';

let total = 0;
let falhas = 0;
function teste(nome, fn) {
  total += 1;
  try { fn(); console.log(`ok    ${nome}`); } catch (e) {
    falhas += 1;
    console.log(`FALHA ${nome}\n      ${e.message.split('\n').join('\n      ')}`);
  }
}

const MAPA = Array.from({ length: 14 }, () => '.'.repeat(14));
const ARCO = 'goblin@couro-arcoCurto';

/** Um goblin e um herói; o goblin age (turno dos inimigos). */
function cena(opcoes = {}, distancia = 6) {
  const party = makeParty({ nivel: 3 });
  party.forEach((c, i) => { c.pos = { x: 2, y: 2 + i }; c.hp = c.maxHp = 200; });
  const g = makeMonster('goblin', { x: 2 + distancia, y: 2 }, opcoes);
  const enc = new Encounter({ battlefield: new Battlefield(14, 14, MAPA), party, foes: [g], rng: makeRng(5) });
  enc.firstSide = 'foes';
  enc.round = 1;
  enc.beginSide('foes');
  return { enc, g, alvo: party[0], party };
}

teste('o look do goblin vai ao arco ao atirar e volta à espada e escudo ao bater', () => {
  const { enc, g, alvo } = cena({}, 4);
  assert.equal(g.look, 'goblin', 'nasce com espada e escudo');
  assert.ok(enc.attackAction(g, alvo, 'Arco curto').ok);
  assert.equal(g.look, ARCO);
  assert.equal(g.armaNaMao, 'Arco curto');
  // Outro turno: encosta no herói e puxa a cimitarra.
  enc.beginSide('foes');
  g.pos = { x: 3, y: 2 };
  assert.ok(enc.attackAction(g, alvo, 'Cimitarra').ok);
  assert.equal(g.look, 'goblin');
  assert.equal(g.armaNaMao, 'Cimitarra');
});

teste('nascer com `arma` põe o arco na mão e o `lookBase` no look padrão', () => {
  const { enc, g, alvo } = cena({ tatica: 'atirador', arma: 'Arco curto' }, 4);
  assert.equal(g.look, ARCO);
  assert.equal(g.lookBase, 'goblin', 'sem o lookBase o 1º golpe de espada voltaria ao arco');
  assert.equal(g.armaNaMao, 'Arco curto');
  assert.equal(g.tatica, 'atirador');
  assert.equal(g.ac, 15);
  // Atirar com o arco que já está na mão não gasta a interação.
  assert.ok(enc.attackAction(g, alvo, 'Arco curto').ok);
  assert.equal(g.interacaoUsada, false);
  // Bater de perto na rodada seguinte: a espada é a troca (gratuita) e a figura volta.
  enc.beginSide('foes');
  g.pos = { x: 3, y: 2 };
  assert.ok(enc.attackAction(g, alvo, 'Cimitarra').ok);
  assert.equal(g.look, 'goblin');
  assert.equal(g.interacaoUsada, true);
  // Um nome de arma que o bloco não tem na `aparencias` é ignorado.
  assert.equal(makeMonster('goblin', { x: 0, y: 0 }, { arma: 'Cimitarra' }).look, 'goblin');
});

teste('a segunda troca de arma no mesmo turno é recusada (a interação gratuita é uma só)', () => {
  const { enc, g, alvo } = cena({}, 1);
  // Cimitarra na mão: atirar com o arco é a troca (gratuita) do turno.
  assert.ok(enc.canAttack(g, alvo, 'Arco curto').ok);
  assert.ok(enc.attackAction(g, alvo, 'Arco curto').ok);
  assert.equal(g.interacaoUsada, true);
  // Mesmo turno (ação extra de teste): voltar à cimitarra seria a 2ª troca.
  g.actionUsed = false;
  const volta = enc.canAttack(g, alvo, 'Cimitarra');
  assert.equal(volta.ok, false);
  assert.match(volta.why, /já trocou de arma/);
  assert.equal(enc.attackAction(g, alvo, 'Cimitarra').ok, false);
  assert.equal(g.armaNaMao, 'Arco curto');
  // A mesma arma continua valendo, e o turno seguinte devolve a interação.
  assert.ok(enc.canAttack(g, alvo, 'Arco curto').ok);
  enc.beginSide('foes');
  assert.ok(enc.canAttack(g, alvo, 'Cimitarra').ok);
});

teste('com o arco na mão o goblin não dá ataque de oportunidade; com a espada, dá', () => {
  const { enc, g } = cena({ arma: 'Arco curto' }, 1);
  assert.equal(enc.armaDeOportunidade(g), undefined, 'cimitarra embainhada: sem brecha');
  g.armaNaMao = 'Cimitarra';
  assert.equal(enc.armaDeOportunidade(g), 'Cimitarra');
  // Quem não troca de arma (o bugbear, o hobgoblin) segue como antes.
  const hob = makeMonster('hobgoblin', { x: 0, y: 0 });
  assert.equal(enc.armaDeOportunidade(hob), 'Espada longa');
});

console.log(`\n${total - falhas}/${total} passaram`);
if (falhas) process.exit(1);
