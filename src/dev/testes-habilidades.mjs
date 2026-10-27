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
import { KINDS_REMOTOS, acaoRemotaValida, mandaNaHora } from '../game/acoes.js';
import { WEAPONS } from '../rules/equipment.js';
import {
  HABILIDADES_DE_ALVO, descritorDaHabilidade, alvosDaHabilidade, vetoDaHabilidade, previaDaHabilidade, estadoDoFurtivo, textoDeVantagem, vetoGeral,
} from '../rules/habilidades-alvo.js';

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

// ---- o azulejo da barra (Cura pelas Mãos / Inspiração Bárdica) -----------------

const goblin = (enc) => enc.combatants.find((x) => x.side !== 'party');

teste('azulejo: Cura pelas Mãos do paladino de 1º nível, com a reserva no selo, entra no modo de mira', () => {
  const { enc, party: [pal, ali] } = montar(['pc-paladino', 'pc-guerreiro']);
  ali.hp = ali.maxHp - 4;
  const d = descritorDaHabilidade(enc, pal, 'layOnHands');
  assert.equal(d.icone, 'classe-layOnHands');
  assert.equal(d.nome, 'Cura pelas Mãos');
  assert.equal(d.restam, 5, 'o selo mostra a reserva restante');
  assert.equal(d.total, 5);
  assert.equal(d.carga, 'layOnHands');
  assert.equal(d.custo, 'Ação');
  assert.equal(d.desabilitado, false);
  assert.deepEqual(d.acao, { kind: 'featureAlvo', featureId: 'layOnHands' }, 'entra na mira, não age direto');
});

teste('azulejo: apagado, com o motivo, sem ferido ao alcance, sem reserva ou sem ação', () => {
  const { enc, party: [pal, ali] } = montar(['pc-paladino', 'pc-guerreiro']);
  assert.match(descritorDaHabilidade(enc, pal, 'layOnHands').motivo, /ninguém ferido/);
  ali.hp = ali.maxHp - 4;
  ali.pos = { x: 9, y: 9 }; // longe: a mão tem de encostar
  assert.match(descritorDaHabilidade(enc, pal, 'layOnHands').motivo, /ninguém ferido/);
  ali.pos = { x: 4, y: 3 };
  assert.equal(descritorDaHabilidade(enc, pal, 'layOnHands').desabilitado, false);
  pal.actionUsed = true;
  assert.match(descritorDaHabilidade(enc, pal, 'layOnHands').motivo, /ação/);
  pal.actionUsed = false;
  pal.resources.layOnHands = 0;
  const d = descritorDaHabilidade(enc, pal, 'layOnHands');
  assert.equal(d.desabilitado, true);
  assert.match(d.motivo, /reserva/);
  assert.equal(d.restam, 0);
});

teste('azulejo: o próprio paladino ferido basta para acender (Torvik 1/15 sozinho)', () => {
  const { enc, party: [pal] } = montar(['pc-paladino']);
  pal.hp = 1;
  const d = descritorDaHabilidade(enc, pal, 'layOnHands');
  assert.equal(d.desabilitado, false);
  assert.deepEqual(alvosDaHabilidade(enc, pal, 'layOnHands'), [pal]);
});

teste('mira: acendem só os aliados feridos e encostados (o morto-vivo e o longe não)', () => {
  const { enc, party: [pal, ali, longe] } = montar(['pc-paladino', 'pc-guerreiro', 'pc-ladino']);
  pal.hp = pal.maxHp - 1; ali.hp = ali.maxHp - 3; longe.hp = longe.maxHp - 3;
  longe.pos = { x: 10, y: 10 };
  assert.deepEqual(alvosDaHabilidade(enc, pal, 'layOnHands').map((x) => x.id).sort(), [pal.id, ali.id].sort());
  ali.tipo = 'morto-vivo';
  assert.ok(!alvosDaHabilidade(enc, pal, 'layOnHands').includes(ali), 'a cura não funciona em morto-vivo');
});

teste('mira: a prévia diz quanto cura e como fica a reserva', () => {
  const { enc, party: [pal, ali] } = montar(['pc-paladino', 'pc-guerreiro']);
  ali.hp = ali.maxHp - 2;
  const p1 = previaDaHabilidade(enc, pal, 'layOnHands', ali);
  assert.deepEqual([p1.cura, p1.restaria], [2, 3]);
  ali.hp = ali.maxHp - 9;
  const p = previaDaHabilidade(enc, pal, 'layOnHands', ali);
  assert.equal(p.cura, 5, 'a reserva é o teto');
  assert.equal(p.restaria, 0);
  assert.match(p.texto, /cura 5 de 9 PV · reserva 5 → 0/);
});

teste('mira: o clique executa pelo motor e a reserva fica como a prévia disse', () => {
  const { enc, party: [pal, ali] } = montar(['pc-paladino', 'pc-guerreiro']);
  ali.hp = ali.maxHp - 3;
  assert.equal(vetoDaHabilidade(enc, pal, 'layOnHands', ali), null);
  const restaria = previaDaHabilidade(enc, pal, 'layOnHands', ali).restaria;
  assert.ok(enc.useFeature(pal, 'layOnHands', { target: ali }));
  assert.equal(ali.hp, ali.maxHp);
  assert.equal(pal.resources.layOnHands, restaria);
});

teste('exploração: o azulejo aparece mesmo com a ação "usada" e a Inspiração Bárdica não', () => {
  const { enc, party: [pal, ali] } = montar(['pc-paladino', 'pc-guerreiro']);
  enc.explorando = true;
  pal.actionUsed = true;
  ali.hp = ali.maxHp - 4;
  assert.equal(vetoGeral(enc, pal, 'layOnHands'), null);
  assert.equal(descritorDaHabilidade(enc, pal, 'layOnHands').desabilitado, false);
  assert.ok(enc.useFeature(pal, 'layOnHands', { target: ali }));
  assert.equal(pal.actionUsed, true, 'fora da luta a ação não é cobrada nem devolvida');
  const { enc: e2, party: [barda] } = montar(['pc-barda', 'pc-guerreiro']);
  e2.explorando = true;
  const d = descritorDaHabilidade(e2, barda, 'bardicInspiration');
  assert.equal(d.desabilitado, true);
  assert.equal(d.motivo, 'só em combate');
});

teste('azulejo: Inspiração Bárdica mostra as cargas e entra na mira de aliado', () => {
  const { enc, party: [barda, ali] } = montar(['pc-barda', 'pc-guerreiro']);
  const d = descritorDaHabilidade(enc, barda, 'bardicInspiration');
  assert.equal(d.icone, 'classe-bardicInspiration');
  assert.equal(d.restam, barda.resources.bardicInspiration);
  assert.equal(d.custo, 'Ação bônus');
  assert.equal(d.desabilitado, false);
  assert.deepEqual(d.acao, { kind: 'featureAlvo', featureId: 'bardicInspiration' });
  assert.deepEqual(alvosDaHabilidade(enc, barda, 'bardicInspiration'), [ali], 'não em si mesma');
  barda.resources.bardicInspiration = 0;
  assert.match(descritorDaHabilidade(enc, barda, 'bardicInspiration').motivo, /cargas/);
});

teste('azulejo: só as habilidades de alvo aliado têm descritor (o guerreiro não)', () => {
  const { enc, party: [gue] } = montar(['pc-guerreiro']);
  assert.equal(descritorDaHabilidade(enc, gue, 'secondWind'), null);
});

// ---- Ataque Furtivo e vantagem visíveis (cartão do alvo e dica da arma) --------

/** Pip ladino colado no goblin; o guerreiro do outro lado do goblin, ou longe. */
function furtivoEm({ aliadoColado }) {
  const { enc, party: [lad, gue] } = montar(['pc-ladino', 'pc-guerreiro']);
  const g = goblin(enc);
  g.pos = { x: 6, y: 6 };
  lad.pos = { x: 5, y: 6 };
  gue.pos = aliadoColado ? { x: 7, y: 6 } : { x: 1, y: 1 };
  return { enc, lad, gue, g };
}

teste('furtivo: com aliado colado no alvo, a previsão e o estado dizem "+1d6 neste golpe" e o dano médio o inclui', () => {
  const { enc, lad, g } = furtivoEm({ aliadoColado: true });
  const p = previsaoDeAtaque(enc, lad, g, 'espadaCurta');
  const e = estadoDoFurtivo(enc, lad, p);
  assert.equal(e.aplica, true);
  assert.equal(e.dado, '1d6');
  assert.equal(e.texto, 'Ataque Furtivo +1d6 neste golpe');
  const { enc: e2, lad: l2, g: g2 } = furtivoEm({ aliadoColado: false });
  const p2 = previsaoDeAtaque(e2, l2, g2, 'espadaCurta');
  assert.ok(Math.abs(p.danoMedio - p2.danoMedio - 3.5) < 1e-9, `o furtivo soma 3,5 ao dano médio (${p.danoMedio} vs ${p2.danoMedio})`);
  assert.ok(p.esperado > p2.esperado);
});

teste('furtivo: sem vantagem nem aliado colado, diz o que falta', () => {
  const { enc, lad, g } = furtivoEm({ aliadoColado: false });
  const e = estadoDoFurtivo(enc, lad, previsaoDeAtaque(enc, lad, g, 'espadaCurta'));
  assert.equal(e.aplica, false);
  assert.match(e.texto, /precisa de vantagem ou de um aliado colado/);
  assert.equal(e.vantagem, false);
});

teste('furtivo: vantagem (alvo caído) liga o furtivo e a vantagem aparece com o motivo', () => {
  const { enc, lad, g } = furtivoEm({ aliadoColado: false });
  addCondition(g, 'caido', { rounds: 3 });
  const p = previsaoDeAtaque(enc, lad, g, 'espadaCurta');
  const e = estadoDoFurtivo(enc, lad, p);
  assert.equal(e.vantagem, true);
  assert.equal(e.aplica, true);
  const v = textoDeVantagem(p);
  assert.equal(v.tipo, 'vantagem');
  assert.match(v.texto, /^vantagem — /);
  assert.ok(e.motivos.length > 0);
});

teste('furtivo: atirar colado no inimigo dá desvantagem e o furtivo não vale (mesmo com aliado)', () => {
  const { enc, lad, g } = furtivoEm({ aliadoColado: true });
  const p = previsaoDeAtaque(enc, lad, g, 'arcoCurto');
  const v = textoDeVantagem(p);
  assert.equal(v.tipo, 'desvantagem');
  assert.match(v.texto, /^desvantagem — .*adjacente/);
  const e = estadoDoFurtivo(enc, lad, p);
  assert.equal(e.aplica, false);
  assert.equal(e.desvantagem, true);
  assert.equal(e.texto, 'Furtivo não vale com desvantagem');
});

teste('furtivo: uma vez por turno — depois de usado o estado diz "já usado" e o selo apaga', () => {
  const { enc, lad, g } = furtivoEm({ aliadoColado: true });
  assert.equal(estadoDoFurtivo(enc, lad).usado, false);
  assert.match(estadoDoFurtivo(enc, lad).texto, /pronto: \+1d6/);
  lad.sneakUsedThisTurn = true; // o motor marca ao acertar com furtivo (testes-regras cobre o dado)
  const e = estadoDoFurtivo(enc, lad, previsaoDeAtaque(enc, lad, g, 'espadaCurta'));
  assert.equal(e.usado, true);
  assert.equal(e.aplica, false);
  assert.equal(e.texto, 'Furtivo já usado neste turno');
  assert.equal(estadoDoFurtivo(enc, lad).texto, 'Furtivo já usado neste turno');
});

teste('furtivo: quem não é ladino não tem estado de furtivo', () => {
  const { enc: e2, party: [gue] } = montar(['pc-guerreiro']);
  assert.equal(estadoDoFurtivo(e2, gue), null);
});

teste('vantagem e desvantagem juntas se anulam e o cartão diz isso', () => {
  assert.equal(textoDeVantagem({ mods: { advantage: true, disadvantage: true }, motivos: ['a', 'b'] }).tipo, 'anulado');
  assert.equal(textoDeVantagem({ mods: { advantage: false, disadvantage: false }, motivos: [] }), null);
});


// ---- correções da revisão 2: furtivo, incapacitado, proteção ------------------

teste('furtivo: aliado incapacitado (atordoado, não só inconsciente) colado no alvo NÃO vale', () => {
  const { enc, lad, gue, g } = furtivoEm({ aliadoColado: true });
  assert.ok(previsaoDeAtaque(enc, lad, g, 'espadaCurta').furtivo, 'com o aliado de pé vale');
  addCondition(gue, 'atordoado', { rounds: 3 });
  assert.ok(!previsaoDeAtaque(enc, lad, g, 'espadaCurta').furtivo, 'atordoado é incapacitado');
});

teste('furtivo: vantagem e desvantagem que se anulam valem nenhuma — o aliado colado ainda liga o furtivo', () => {
  const { enc, lad, g } = furtivoEm({ aliadoColado: true });
  addCondition(g, 'caido');                                // vantagem a 1,5 m
  const p = previsaoDeAtaque(enc, lad, g, 'arcoCurto');    // e desvantagem por atirar colado
  assert.ok(p.mods.advantage && p.mods.disadvantage, 'as duas estão no cartão');
  assert.ok(p.furtivo, 'anuladas, o aliado colado vale');
  assert.equal(estadoDoFurtivo(enc, lad, p).aplica, true);
  // sem o aliado: anulado não é vantagem, e o motivo NÃO é "desvantagem"
  const { enc: e2, lad: l2, g: g2 } = furtivoEm({ aliadoColado: false });
  addCondition(g2, 'caido');
  const p2 = previsaoDeAtaque(e2, l2, g2, 'arcoCurto');
  assert.ok(!p2.furtivo);
  assert.notEqual(estadoDoFurtivo(e2, l2, p2).motivo, 'desvantagem');
});

teste('furtivo: é UM por turno, e o turno do outro lado devolve o furtivo (ataque de oportunidade)', () => {
  const { enc, lad, gue } = furtivoEm({ aliadoColado: true });
  lad.sneakUsedThisTurn = true;
  gue.martialUsedThisTurn = true;
  enc.endTurn(lad); enc.endTurn(gue);
  assert.equal(enc.side, 'foes');
  assert.equal(lad.sneakUsedThisTurn, false, 'o turno dos inimigos começou: o furtivo voltou');
  assert.equal(gue.martialUsedThisTurn, false);
});

teste('Proteção: o aliado de escudo ao lado do alvo dá desvantagem na previsão do cartão (sem gastar a reação)', () => {
  const { enc, party: [heroi] } = montar(['pc-ladino']);
  const alvo = goblin(enc);
  alvo.pos = { x: 6, y: 6 };
  heroi.pos = { x: 5, y: 6 };
  assert.ok(!previsaoDeAtaque(enc, heroi, alvo, 'espadaCurta').mods.disadvantage, 'sem protetor, nada');
  const escudeiro = makeMonster('goblin', { x: 7, y: 6 });
  escudeiro.features = ['protection'];
  escudeiro.shield = true;
  escudeiro.reactionUsed = false;
  enc.addCombatant(escudeiro);
  escudeiro.reactionUsed = false;
  const p = previsaoDeAtaque(enc, heroi, alvo, 'espadaCurta');
  assert.ok(p.mods.disadvantage, 'a Proteção entra como desvantagem');
  assert.ok(p.motivos.some((m) => m.startsWith('proteção de')));
  assert.equal(escudeiro.reactionUsed, false, 'só olhou: a reação não foi gasta');
});

teste('incapacitado não usa poder nenhum (Retomar o Fôlego, Inspiração); a Inspiração recusa no veto', () => {
  const { enc, party: [gue] } = montar(['pc-guerreiro']);
  addCondition(gue, 'inconsciente', { rounds: 3 });
  const antes = gue.resources.secondWind;
  assert.equal(enc.useFeature(gue, 'secondWind'), false);
  assert.equal(gue.resources.secondWind, antes, 'não gastou a carga');
  assert.equal(gue.bonusUsed, false);
  const { enc: e2, party: [barda, ali] } = montar(['pc-barda', 'pc-guerreiro']);
  assert.equal(vetoGeral(e2, barda, 'bardicInspiration'), null);
  addCondition(barda, 'atordoado', { rounds: 2 });
  assert.match(vetoGeral(e2, barda, 'bardicInspiration'), /incapacitado/);
  assert.equal(e2.useFeature(barda, 'bardicInspiration', { target: ali }), false);
});

teste('Cura pelas Mãos: a ação extra da Velocidade (acaoLimitada) não serve', () => {
  const { enc, party: [pal, ali] } = montar(['pc-paladino', 'pc-guerreiro']);
  ali.hp = ali.maxHp - 3;
  pal.acaoLimitada = true;
  assert.match(vetoGeral(enc, pal, 'layOnHands'), /Velocidade/);
  assert.equal(enc.useFeature(pal, 'layOnHands', { target: ali }), false);
  assert.equal(pal.resources.layOnHands, 5);
  pal.acaoLimitada = false;
  assert.ok(enc.useFeature(pal, 'layOnHands', { target: ali }));
});

// ---- teclas, rede e furtivo sem golpe possível ---------------------------------

teste('teclas: a Inspiração Bárdica não usa `i` (inventário) nem `p` (ficha); as teclas das habilidades de alvo são distintas e livres', () => {
  const usadas = new Set(['f', 'g', 'h', 'r', 'x', 'c', 't', 'z', 'y', 'j', 'v', 'b', 'n', 'k', 'm', 'i', 'p', 'q', 'e']);
  const teclas = Object.values(HABILIDADES_DE_ALVO).map((h) => h.tecla);
  assert.equal(new Set(teclas).size, teclas.length, 'sem repetir');
  for (const t of teclas) assert.ok(t && !usadas.has(t), `a tecla ${t} está livre`);
  const { enc, party: [barda] } = montar(['pc-barda', 'pc-guerreiro']);
  assert.equal(descritorDaHabilidade(enc, barda, 'bardicInspiration').tecla, 'u');
  assert.equal(descritorDaHabilidade(enc, barda, 'layOnHands')?.tecla ?? 'l', 'l');
});

teste('rede: featureAlvo é ação remota válida, mas NÃO sai na hora (precisa do clique no alvo)', () => {
  assert.ok(KINDS_REMOTOS.includes('featureAlvo'));
  assert.ok(acaoRemotaValida({ kind: 'featureAlvo', featureId: 'layOnHands' }));
  assert.ok(!acaoRemotaValida({ kind: 'featureAlvo', featureId: 'x'.repeat(50) }));
  assert.equal(mandaNaHora({ kind: 'featureAlvo', featureId: 'layOnHands' }), false, 'o convidado entra na mira e clica no aliado');
});

teste('furtivo: sem linha de visão ou à distância e fora de alcance não promete furtivo', () => {
  const { enc, lad, g } = furtivoEm({ aliadoColado: true });
  const p = previsaoDeAtaque(enc, lad, g, 'espadaCurta');
  assert.equal(estadoDoFurtivo(enc, lad, p).aplica, true, 'base: vale');
  const semVisao = { ...p, semVisao: true };
  const e1 = estadoDoFurtivo(enc, lad, semVisao);
  assert.equal(e1.aplica, false);
  assert.equal(e1.texto, 'Furtivo: sem linha de visão');
  // arco longe demais: fora de alcance
  g.pos = { x: 6, y: 6 };
  lad.pos = { x: 5, y: 6 };
  const pa = previsaoDeAtaque(enc, lad, g, 'arcoCurto');
  const longe = { ...pa, foraDeAlcance: true, furtivo: '1d6' };
  const e2 = estadoDoFurtivo(enc, lad, longe);
  assert.equal(e2.aplica, false);
  assert.equal(e2.texto, 'Furtivo: fora de alcance');
});

teste('furtivo: o corpo a corpo longe, que anda até o alvo, continua valendo', () => {
  const { enc, lad, g } = furtivoEm({ aliadoColado: true });
  const p = previsaoDeAtaque(enc, lad, g, 'espadaCurta');
  const longe = { ...p, foraDeAlcance: true, furtivo: '1d6' };
  assert.equal(estadoDoFurtivo(enc, lad, longe).aplica, true);
});

teste('furtivo: sem alvo, só se promete para arma de acuidade ou à distância', () => {
  const { enc, party: [lad] } = montar(['pc-ladino']);
  assert.match(estadoDoFurtivo(enc, lad, null, WEAPONS.espadaCurta).texto, /pronto: \+1d6/, 'acuidade');
  assert.match(estadoDoFurtivo(enc, lad, null, WEAPONS.arcoCurto).texto, /pronto: \+1d6/, 'distância');
  const m = estadoDoFurtivo(enc, lad, null, WEAPONS.maca);
  assert.equal(m.texto, 'Furtivo: só com acuidade ou à distância');
  assert.equal(m.detalhe, 'só com acuidade ou à distância');
  assert.match(estadoDoFurtivo(enc, lad, null).texto, /pronto/, 'sem arma informada: a promessa geral');
  lad.sneakUsedThisTurn = true;
  assert.equal(estadoDoFurtivo(enc, lad, null, WEAPONS.maca).texto, 'Furtivo já usado neste turno', 'o uso vence');
});


console.log(`\n${total - falhas}/${total} passaram`);
process.exit(falhas ? 1 : 0);
