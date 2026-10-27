// Testes das habilidades de 1º nível que pedem ALVO: Cura pelas Mãos do
// paladino e Inspiração Bárdica da bardo, mais as opções do menu do botão
// direito (`game/interacoes-classe.js`). Rode com:
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-habilidades.mjs

import assert from 'node:assert/strict';
import { montarHeroi } from '../game/criacao.js';
import { opcoesDeClasse } from '../game/interacoes-classe.js';
import { Encounter } from '../rules/combat.js';
import { Battlefield } from '../core/grid.js';
import { makeMonster } from '../rules/monsters.js';
import { makeRng } from '../core/rng.js';
import { hasCondition, addCondition } from '../rules/conditions.js';
import { previsaoDeAtaque } from '../rules/odds.js';

const MAPA = Array(12).fill('............');

/** Heróis do 1º nível lado a lado, e um goblin longe (a luta está valendo). */
function montar(ids, { seed = 7 } = {}) {
  const field = new Battlefield(12, 12, MAPA);
  const party = ids.map((id, i) => {
    const c = montarHeroi(id);
    c.side = 'party';
    c.pos = { x: 3 + i, y: 3 };
    return c;
  });
  const foes = [makeMonster('goblin', { x: 10, y: 10 })];
  const enc = new Encounter({ battlefield: field, party, foes, rng: makeRng(seed), onLog: () => {} });
  enc.firstSide = 'party';
  enc.round = 1;
  enc.beginSide('party');
  return { enc, party };
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

const app = (enc) => ({ usarFeature: (c, id, o) => enc.useFeature(c, id, o) });

// ---- Cura pelas Mãos ---------------------------------------------------------

teste('Cura pelas Mãos: o paladino de 1º nível tem reserva de 5 e cura o aliado ferido', () => {
  const { enc, party: [pal, ali] } = montar(['pc-paladino', 'pc-guerreiro']);
  assert.equal(pal.resources.layOnHands, 5, '5 x nível');
  ali.hp = ali.maxHp - 4;
  assert.ok(enc.useFeature(pal, 'layOnHands', { target: ali }));
  assert.equal(ali.hp, ali.maxHp);
  assert.equal(pal.resources.layOnHands, 1, 'a reserva pagou 4');
  assert.equal(pal.actionUsed, true, 'em combate gasta a ação');
});

teste('Cura pelas Mãos: não gasta além do que falta', () => {
  const { enc, party: [pal, ali] } = montar(['pc-paladino', 'pc-guerreiro']);
  ali.hp = ali.maxHp - 2;
  assert.ok(enc.useFeature(pal, 'layOnHands', { target: ali }));
  assert.equal(pal.resources.layOnHands, 3, 'só 2 saíram da reserva de 5');
});

teste('Cura pelas Mãos: reserva menor que o ferimento cura só o que tem', () => {
  const { enc, party: [pal, ali] } = montar(['pc-paladino', 'pc-guerreiro']);
  ali.hp = ali.maxHp - 8;
  assert.ok(enc.useFeature(pal, 'layOnHands', { target: ali }));
  assert.equal(ali.hp, ali.maxHp - 3, 'curou 5, a reserva toda');
  assert.equal(pal.resources.layOnHands, 0);
});

teste('Cura pelas Mãos: reserva zerada recusa e não gasta a ação', () => {
  const { enc, party: [pal, ali] } = montar(['pc-paladino', 'pc-guerreiro']);
  pal.resources.layOnHands = 0;
  ali.hp = ali.maxHp - 4;
  assert.equal(enc.useFeature(pal, 'layOnHands', { target: ali }), false);
  assert.equal(ali.hp, ali.maxHp - 4);
  assert.equal(pal.actionUsed, false);
});

teste('Cura pelas Mãos: recusa ferida inexistente, alvo longe e, em combate, ação já usada', () => {
  const { enc, party: [pal, ali] } = montar(['pc-paladino', 'pc-guerreiro']);
  assert.equal(enc.useFeature(pal, 'layOnHands', { target: ali }), false, 'ninguém ferido');
  ali.hp = ali.maxHp - 4;
  ali.pos = { x: 8, y: 8 };
  assert.equal(enc.useFeature(pal, 'layOnHands', { target: ali }), false, 'longe: a mão tem de encostar');
  ali.pos = { x: 4, y: 3 };
  pal.actionUsed = true;
  assert.equal(enc.useFeature(pal, 'layOnHands', { target: ali }), false, 'a ação já foi gasta');
  assert.equal(pal.resources.layOnHands, 5);
});

teste('Cura pelas Mãos: o paladino cura a si mesmo', () => {
  const { enc, party: [pal] } = montar(['pc-paladino']);
  pal.hp = pal.maxHp - 3;
  assert.ok(enc.useFeature(pal, 'layOnHands', { target: pal }));
  assert.equal(pal.hp, pal.maxHp);
  assert.equal(pal.resources.layOnHands, 2);
});

teste('Cura pelas Mãos: fora do combate (explorando) só gasta a reserva, não a ação', () => {
  const { enc, party: [pal, ali] } = montar(['pc-paladino', 'pc-guerreiro']);
  enc.explorando = true;
  pal.actionUsed = true; // sobra do turno anterior: fora da luta não importa
  ali.hp = ali.maxHp - 4;
  assert.ok(enc.useFeature(pal, 'layOnHands', { target: ali }));
  assert.equal(ali.hp, ali.maxHp);
  assert.equal(pal.resources.layOnHands, 1);
  assert.equal(pal.actionUsed, true, 'não mexeu na ação');
});

teste('Cura pelas Mãos: com a luta acabada também não cobra a ação', () => {
  const { enc, party: [pal, ali] } = montar(['pc-paladino', 'pc-guerreiro']);
  enc.over = true;
  ali.hp = ali.maxHp - 4;
  assert.ok(enc.useFeature(pal, 'layOnHands', { target: ali }));
  assert.equal(pal.actionUsed, false, 'a ação fica intacta');
  assert.equal(pal.resources.layOnHands, 1);
});

// ---- Inspiração Bárdica ------------------------------------------------------

teste('Inspiração Bárdica: gasta a ação bônus e uma carga, e o aliado fica inspirado', () => {
  const { enc, party: [barda, ali] } = montar(['pc-barda', 'pc-guerreiro']);
  const antes = barda.resources.bardicInspiration;
  assert.ok(antes > 0);
  assert.ok(enc.useFeature(barda, 'bardicInspiration', { target: ali }));
  assert.equal(barda.bonusUsed, true);
  assert.equal(barda.actionUsed, false, 'a ação fica livre');
  assert.equal(barda.resources.bardicInspiration, antes - 1);
  assert.ok(hasCondition(ali, 'inspirado'));
});

teste('Inspiração Bárdica: recusa sem cargas, com o bônus gasto, em si mesmo e de novo no mesmo aliado', () => {
  const { enc, party: [barda, ali] } = montar(['pc-barda', 'pc-guerreiro']);
  assert.equal(enc.useFeature(barda, 'bardicInspiration', { target: barda }), false, 'não em si');
  barda.resources.bardicInspiration = 0;
  assert.equal(enc.useFeature(barda, 'bardicInspiration', { target: ali }), false, 'sem cargas');
  barda.resources.bardicInspiration = 2;
  barda.bonusUsed = true;
  assert.equal(enc.useFeature(barda, 'bardicInspiration', { target: ali }), false, 'bônus gasto');
  barda.bonusUsed = false;
  assert.ok(enc.useFeature(barda, 'bardicInspiration', { target: ali }));
  barda.bonusUsed = false;
  assert.equal(enc.useFeature(barda, 'bardicInspiration', { target: ali }), false, 'já inspirado');
});

// ---- as opções do menu -------------------------------------------------------

const achar = (ops, icone) => ops.find((o) => o.icone === icone);

teste('menu: Cura pelas Mãos aparece com a reserva no rótulo e sem motivo quando dá', () => {
  const { enc, party: [pal, ali] } = montar(['pc-paladino', 'pc-guerreiro']);
  ali.hp = ali.maxHp - 4;
  const ops = opcoesDeClasse(app(enc), pal, ali, { enc, vez: true, explorando: false });
  const o = achar(ops, 'classe-layOnHands');
  assert.ok(o, 'a opção existe');
  assert.ok(o.rotulo.includes('reserva 5'), o.rotulo);
  assert.equal(o.motivo, null);
  assert.equal(o.grupo, 'Socorrer');
  assert.equal(o.alvoPrevia, ali);
  o.fazer();
  assert.equal(ali.hp, ali.maxHp, 'o clique cura de verdade');
});

teste('menu: Cura pelas Mãos diz por que não dá', () => {
  const { enc, party: [pal, ali] } = montar(['pc-paladino', 'pc-guerreiro']);
  const ctx = { enc, vez: true, explorando: false };
  const motivo = () => achar(opcoesDeClasse(app(enc), pal, ali, ctx), 'classe-layOnHands').motivo;
  assert.match(motivo(), /não está ferido/);
  ali.hp = ali.maxHp - 4;
  ali.pos = { x: 8, y: 8 };
  assert.match(motivo(), /encoste/);
  ali.pos = { x: 4, y: 3 };
  pal.actionUsed = true;
  assert.match(motivo(), /ação/);
  pal.actionUsed = false;
  pal.resources.layOnHands = 0;
  assert.match(motivo(), /reserva/);
});

teste('menu: explorando, Cura pelas Mãos fica disponível mesmo com a ação "usada"', () => {
  const { enc, party: [pal, ali] } = montar(['pc-paladino', 'pc-guerreiro']);
  enc.explorando = true;
  pal.actionUsed = true;
  ali.hp = ali.maxHp - 4;
  const o = achar(opcoesDeClasse(app(enc), pal, ali, { enc, vez: false, explorando: true }), 'classe-layOnHands');
  assert.ok(o, 'a opção existe fora da luta');
  assert.equal(o.motivo, null);
  o.fazer();
  assert.equal(ali.hp, ali.maxHp);
});

teste('menu: o paladino também se cura (occ === c), sem a opção de inspirar', () => {
  const { enc, party: [pal] } = montar(['pc-paladino']);
  pal.hp = pal.maxHp - 3;
  const ops = opcoesDeClasse(app(enc), pal, pal, { enc, vez: true, explorando: false });
  const o = achar(ops, 'classe-layOnHands');
  assert.ok(o && o.motivo === null);
  assert.ok(!achar(ops, 'classe-bardicInspiration'));
});

teste('menu: Inspiração Bárdica aparece para o aliado e dá os motivos certos', () => {
  const { enc, party: [barda, ali] } = montar(['pc-barda', 'pc-guerreiro']);
  const ctx = { enc, vez: true, explorando: false };
  const get = () => achar(opcoesDeClasse(app(enc), barda, ali, ctx), 'classe-bardicInspiration');
  assert.equal(get().motivo, null);
  assert.equal(get().grupo, 'Apoiar');
  barda.bonusUsed = true;
  assert.match(get().motivo, /ação bônus/);
  barda.bonusUsed = false;
  barda.resources.bardicInspiration = 0;
  assert.match(get().motivo, /cargas/);
  barda.resources.bardicInspiration = 2;
  ali.pos = { x: 20, y: 3 }; // 17 casas = 85 pés, além dos 18 m
  assert.match(get().motivo, /longe/);
  ali.pos = { x: 4, y: 3 };
  get().fazer();
  assert.ok(hasCondition(ali, 'inspirado'));
  barda.bonusUsed = false;
  assert.match(get().motivo, /já está inspirado/);
});

teste('menu: classes sem esses poderes não ganham opção, nem para inimigo ou morto', () => {
  const { enc, party: [gue, ali] } = montar(['pc-guerreiro', 'pc-paladino']);
  assert.equal(opcoesDeClasse(app(enc), gue, ali, { enc, vez: true }).length, 0);
  const { enc: e2, party: [pal, a2] } = montar(['pc-paladino', 'pc-guerreiro']);
  a2.dead = true;
  assert.equal(opcoesDeClasse(app(e2), pal, a2, { enc: e2, vez: true }).length, 0, 'morto');
  const gob = e2.combatants.find((x) => x.side !== 'party');
  assert.equal(opcoesDeClasse(app(e2), pal, gob, { enc: e2, vez: true }).length, 0, 'inimigo');
});

// ---- Cura pelas Mãos: correções da revisão -----------------------------------

teste('Cura pelas Mãos: morto-vivo, constructo e quem não recupera PV são recusados SEM gastar reserva nem ação', () => {
  for (const marca of ['morto-vivo', 'constructo', 'semCura']) {
    const { enc, party: [pal, ali] } = montar(['pc-paladino', 'pc-guerreiro']);
    ali.hp = ali.maxHp - 4;
    if (marca === 'semCura') addCondition(ali, 'semCura'); else ali.tipo = marca;
    assert.equal(enc.useFeature(pal, 'layOnHands', { target: ali }), false, marca);
    assert.equal(pal.resources.layOnHands, 5, `${marca}: a reserva fica`);
    assert.equal(pal.actionUsed, false, `${marca}: a ação fica`);
    assert.equal(ali.hp, ali.maxHp - 4);
  }
});

teste('Cura pelas Mãos: alvo de outro lado é recusado, e a parede entre os dois também', () => {
  const { enc, party: [pal, ali] } = montar(['pc-paladino', 'pc-guerreiro']);
  ali.hp = ali.maxHp - 4;
  const gob = enc.combatants.find((x) => x.side !== 'party');
  gob.pos = { x: 3, y: 4 };
  gob.hp = 1;
  assert.equal(enc.useFeature(pal, 'layOnHands', { target: gob }), false, 'inimigo colado não é curado');
  assert.equal(gob.hp, 1);
  const vizinhos = enc.field.vizinhos.bind(enc.field);
  enc.field.vizinhos = () => false;      // um muro de borda entre eles
  assert.equal(enc.useFeature(pal, 'layOnHands', { target: ali }), false);
  enc.field.vizinhos = vizinhos;
  assert.equal(pal.resources.layOnHands, 5);
});

teste('Cura pelas Mãos: `valor` gasta só o que se pede (o clássico: levantar com 1 PV)', () => {
  const { enc, party: [pal, ali] } = montar(['pc-paladino', 'pc-guerreiro']);
  ali.hp = 0;
  addCondition(ali, 'inconsciente');
  addCondition(ali, 'caido');
  assert.ok(enc.useFeature(pal, 'layOnHands', { target: ali, valor: 1 }));
  assert.equal(ali.hp, 1);
  assert.equal(pal.resources.layOnHands, 4, 'só 1 ponto saiu da reserva');
  assert.ok(!hasCondition(ali, 'inconsciente'), 'a cura acorda quem estava a 0 PV');
  const { enc: e2, party: [p2, a2] } = montar(['pc-paladino', 'pc-guerreiro']);
  a2.hp = a2.maxHp - 10;
  assert.ok(e2.useFeature(p2, 'layOnHands', { target: a2, valor: 2 }));
  assert.equal(a2.hp, a2.maxHp - 8, 'pediu 2');
  assert.equal(p2.resources.layOnHands, 3);
  const { enc: e3, party: [p3, a3] } = montar(['pc-paladino', 'pc-guerreiro']);
  a3.hp = a3.maxHp - 3;
  assert.ok(e3.useFeature(p3, 'layOnHands', { target: a3, valor: 99 }));
  assert.equal(p3.resources.layOnHands, 2, 'nunca além do que falta');
});

teste('Cura pelas Mãos: 5 pontos tiram o veneno (sem curar); sem veneno ou sem 5 pontos, recusa', () => {
  const { enc, party: [pal, ali] } = montar(['pc-paladino', 'pc-guerreiro']);
  assert.equal(enc.useFeature(pal, 'layOnHands', { target: ali, modo: 'veneno' }), false, 'sem veneno');
  addCondition(ali, 'envenenado');
  ali.hp = ali.maxHp - 3;
  assert.ok(enc.useFeature(pal, 'layOnHands', { target: ali, modo: 'veneno' }));
  assert.ok(!hasCondition(ali, 'envenenado'));
  assert.equal(ali.hp, ali.maxHp - 3, 'não cura');
  assert.equal(pal.resources.layOnHands, 0);
  assert.equal(pal.actionUsed, true);
  const { enc: e2, party: [p2, a2] } = montar(['pc-paladino', 'pc-guerreiro']);
  addCondition(a2, 'envenenado');
  p2.resources.layOnHands = 4;
  assert.equal(e2.useFeature(p2, 'layOnHands', { target: a2, modo: 'veneno' }), false, 'só 4 na reserva');
  assert.ok(hasCondition(a2, 'envenenado'));
});

teste('menu: Levantar com 1 PV para o aliado a 0 PV, e Tirar o veneno para o envenenado', () => {
  const { enc, party: [pal, ali] } = montar(['pc-paladino', 'pc-guerreiro']);
  ali.hp = 0;
  addCondition(ali, 'inconsciente');
  addCondition(ali, 'envenenado');
  const ops = opcoesDeClasse(app(enc), pal, ali, { enc, vez: true, explorando: false });
  const lev = ops.find((o) => o.rotulo.startsWith('Levantar'));
  assert.ok(lev && lev.motivo === null, 'Levantar com 1 PV');
  const ven = ops.find((o) => o.rotulo.startsWith('Tirar o veneno'));
  assert.ok(ven && ven.motivo === null, 'Tirar o veneno');
  lev.fazer();
  assert.equal(ali.hp, 1);
  assert.equal(pal.resources.layOnHands, 4);
});

teste('menu: Cura pelas Mãos fica apagada para morto-vivo, constructo, semCura e alvo atrás de parede', () => {
  for (const marca of ['morto-vivo', 'constructo', 'semCura']) {
    const { enc, party: [pal, ali] } = montar(['pc-paladino', 'pc-guerreiro']);
    ali.hp = ali.maxHp - 4;
    if (marca === 'semCura') addCondition(ali, 'semCura'); else ali.tipo = marca;
    const o = achar(opcoesDeClasse(app(enc), pal, ali, { enc, vez: true }), 'classe-layOnHands');
    assert.ok(o.motivo, `${marca}: apagada`);
  }
  const { enc, party: [pal, ali] } = montar(['pc-paladino', 'pc-guerreiro']);
  ali.hp = ali.maxHp - 4;
  enc.field.vizinhos = () => false;
  assert.match(achar(opcoesDeClasse(app(enc), pal, ali, { enc, vez: true }), 'classe-layOnHands').motivo, /encoste/);
});

// ---- Ataque Furtivo visível --------------------------------------------------

teste('Ataque Furtivo: a previsão (que o HUD agora mostra) traz o dado com aliado colado no alvo', () => {
  const { enc, party: [lad, gue] } = montar(['pc-ladino', 'pc-guerreiro']);
  const g = enc.combatants.find((x) => x.side !== 'party');
  g.pos = { x: 4, y: 4 };
  lad.pos = { x: 3, y: 4 };
  gue.pos = { x: 5, y: 4 };
  const p = previsaoDeAtaque(enc, lad, g, lad.equippedWeapon);
  assert.equal(p.furtivo, lad.sneakAttack);
  assert.equal(lad.sneakAttack, '1d6');
});

console.log(`\n${total - falhas}/${total} passaram`);
process.exit(falhas ? 1 : 0);
