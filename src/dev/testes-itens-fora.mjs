// Testes: itens, saque e levantar-se FORA do combate, e dar item a um aliado. Rode com:
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-itens-fora.mjs
//
// Nasceram de quatro bugs do dono: "não dá para usar a poção do paladino no clérigo fora do combate", "não dá para
// transferir itens", "o botão direito num corpo não dá nada" e "não dá para levantar o personagem depois de caído".

import assert from 'node:assert/strict';
import { Encounter } from '../rules/combat.js';
import { montarHeroi } from '../game/criacao.js';
import { makeMonster } from '../rules/monsters.js';
import { Battlefield } from '../core/grid.js';
import { makeRng } from '../core/rng.js';
import { hasCondition, addCondition } from '../rules/conditions.js';
import { readFileSync } from 'node:fs';
import { garantirInventario, transferirItem } from '../rules/equipment.js';
import { opcoesDaCasa } from '../game/interacoes.js';
import { saquearCorpo, tesouroDoCorpo, chaveDoTesouro, grupoTem } from '../game/saque.js';
import { makeNpc } from '../rules/npcs.js';

const MAPA = Array(12).fill('............');
let falhas = 0;
let total = 0;
function teste(nome, fn) {
  total += 1;
  try { fn(); console.log(`ok    ${nome}`); } catch (e) {
    falhas += 1;
    console.log(`FALHA ${nome}\n      ${e.message.split('\n').join('\n      ')}`);
  }
}

/** Clérigo (Brenn) e paladino (Torvik) lado a lado, mais os inimigos pedidos, no turno do grupo. */
function montar({ foes = [['goblin', { x: 11, y: 11 }]] } = {}) {
  const cle = montarHeroi('pc-clerigo');
  const pal = montarHeroi('pc-paladino');
  cle.pos = { x: 5, y: 5 };
  pal.pos = { x: 6, y: 5 };
  const fs = foes.map(([id, p]) => makeMonster(id, p));
  const enc = new Encounter({ battlefield: new Battlefield(12, 12, MAPA), party: [cle, pal], foes: fs, rng: makeRng(1), onLog() {} });
  enc.firstSide = 'party';
  enc.round = 1;
  enc.beginSide('party');
  return { enc, cle, pal, foes: fs };
}
/** O que cada capítulo faz em `prepararExploracao`: a luta acaba de ser travada, ninguém tem ação. */
function explorar(enc) {
  enc.over = false;
  enc.outcome = null;
  enc.side = 'party';
  enc.explorando = true;
  for (const c of enc.combatants) {
    c.movementLeftFt = c.side === 'party' ? 60 : 0;
    c.actionUsed = true; c.bonusUsed = true; c.reactionUsed = true; c.acted = false;
  }
}
const qtd = (c, id) => garantirInventario(c).bag.find((e) => e.id === id)?.qtd ?? 0;
const derrubar = (enc, c) => enc.applyDamage(c, c.hp, 'cortante', null);
const eventos = (enc) => {
  const l = [];
  const antes = enc.onEvent;
  enc.onEvent = (e) => { l.push(e.type); antes?.call(enc, e); };
  return l;
};

// ---- poção fora do combate ---------------------------------------------------------------------------------------

teste('exploração: a poção do paladino levanta o clérigo caído (mesmo com a ação "usada" da exploração)', () => {
  const { enc, cle, pal } = montar();
  derrubar(enc, cle);
  assert.ok(hasCondition(cle, 'inconsciente'));
  explorar(enc);
  assert.equal(pal.actionUsed, true);
  const r = enc.useItem(pal, 'pocaoDeCura', { target: cle });
  assert.equal(r.ok, true, r.why);
  assert.ok(cle.hp > 0 && !hasCondition(cle, 'inconsciente'));
  assert.ok(!hasCondition(cle, 'caido'), 'explorando, de pé de graça (com inimigo vivo na cena)');
  assert.equal(qtd(pal, 'pocaoDeCura'), 0);
  assert.equal(pal.actionUsed, true, 'não cobra nem devolve ação');
});

teste('depois da luta (enc.over): a poção funciona e levanta', () => {
  const { enc, cle, pal, foes } = montar();
  derrubar(enc, cle);
  foes[0].dead = true; foes[0].hp = 0;
  enc.checkEnd();
  assert.equal(enc.over, true);
  pal.actionUsed = true;                       // sobra do último turno
  const r = enc.useItem(pal, 'pocaoDeCura', { target: cle });
  assert.equal(r.ok, true, r.why);
  assert.ok(cle.hp > 0 && !hasCondition(cle, 'caido'));
});

teste('exploração com TODOS os inimigos mortos: useItem não reencerra a cena', () => {
  const { enc, cle, pal, foes } = montar();
  derrubar(enc, cle);
  foes[0].dead = true; foes[0].hp = 0;
  explorar(enc);
  const ev = eventos(enc);
  const r = enc.useItem(pal, 'pocaoDeCura', { target: cle });
  assert.equal(r.ok, true, r.why);
  assert.equal(enc.over, false, 'a exploração continua');
  assert.ok(!ev.includes('end'), 'nenhum evento end');
});

teste('na luta a poção continua custando a ação; explorando, Estabilizar é de graça', () => {
  const { enc, cle, pal } = montar();
  derrubar(enc, cle);
  assert.equal(enc.useItem(pal, 'pocaoDeCura', { target: cle }).ok, true);
  assert.equal(pal.actionUsed, true, 'na luta gasta a ação');
  const { enc: e2, cle: c2, pal: p2 } = montar();
  derrubar(e2, c2);
  explorar(e2);
  assert.equal(e2.stabilize(p2, c2), true, 'explorando, Medicina sem gastar ação');
  assert.equal(p2.actionUsed, true);
});

// ---- levantar-se depois de curado a 0 PV ------------------------------------------------------------------------

teste('combate: cai na vez dos inimigos, curado no começo da vez do grupo, e consegue se levantar', () => {
  const { enc, cle, pal, foes } = montar();
  enc.endTurn(cle); enc.endTurn(pal);
  assert.equal(enc.side, 'foes');
  derrubar(enc, cle);
  enc.endTurn(foes[0]);
  assert.equal(enc.side, 'party');
  assert.equal(cle.movementLeftFt, 0, 'inconsciente começa a vez sem deslocamento');
  assert.equal(enc.useItem(pal, 'pocaoDeCura', { target: cle }).ok, true);
  assert.ok(hasCondition(cle, 'caido') && !hasCondition(cle, 'inconsciente'));
  assert.ok(cle.movementLeftFt > 0, 'o deslocamento voltou');
  const r = enc.standUp(cle);
  assert.equal(r.ok, true, r.why);
  assert.ok(!hasCondition(cle, 'caido'));
  const v = enc.speedOf(cle);
  assert.equal(cle.movementLeftFt, v - Math.ceil(v / 2), 'custou metade do deslocamento');
});

teste('combate: quem caiu na própria vez (já agiu) não ganha deslocamento extra ao ser curado', () => {
  const { enc, cle, pal } = montar();
  derrubar(enc, cle);
  assert.equal(cle.acted, true);
  const antes = cle.movementLeftFt;
  enc.useItem(pal, 'pocaoDeCura', { target: cle });
  assert.equal(cle.movementLeftFt, antes);
  assert.ok(hasCondition(cle, 'caido'));
});

teste('exploração: curado a 0 PV fica de pé (há inimigo vivo na cena)', () => {
  const { enc, cle } = montar();
  derrubar(enc, cle);
  explorar(enc);
  enc.heal(cle, 5);
  assert.ok(!hasCondition(cle, 'caido') && !hasCondition(cle, 'inconsciente'));
});

// ---- dar item -----------------------------------------------------------------------------------------------------

teste('dar item: encostado funciona, a poção muda de mochila e gasta só a interação gratuita', () => {
  const { enc, cle, pal } = montar();
  const antes = [qtd(pal, 'pocaoDeCura'), qtd(cle, 'pocaoDeCura')];
  const r = enc.darItem(pal, cle, 'pocaoDeCura');
  assert.equal(r.ok, true, r.why);
  assert.deepEqual([qtd(pal, 'pocaoDeCura'), qtd(cle, 'pocaoDeCura')], [antes[0] - 1, antes[1] + 1]);
  assert.equal(pal.interacaoUsada, true);
  assert.equal(pal.actionUsed, false);
});

teste('dar item: longe recusa e não mexe nas mochilas', () => {
  const { enc, cle, pal } = montar();
  pal.pos = { x: 9, y: 9 };
  const r = enc.darItem(pal, cle, 'pocaoDeCura');
  assert.equal(r.ok, false);
  assert.match(r.why, /longe/);
  assert.equal(qtd(pal, 'pocaoDeCura'), 1);
  assert.equal(qtd(cle, 'pocaoDeCura'), 1);
});

teste('dar item: na luta, a 2ª interação do turno gasta a ação e a 3ª é recusada', () => {
  const { enc, cle, pal } = montar();
  garantirInventario(pal).bag.push({ id: 'cordaCanhamo', tipo: 'item', qtd: 1 }, { id: 'tocha', tipo: 'item', qtd: 1 });
  assert.equal(enc.darItem(pal, cle, 'pocaoDeCura').ok, true);
  assert.equal(pal.actionUsed, false);
  assert.equal(enc.darItem(pal, cle, 'cordaCanhamo').ok, true, 'a segunda gasta a ação');
  assert.equal(pal.actionUsed, true);
  const r = enc.darItem(pal, cle, 'tocha');
  assert.equal(r.ok, false);
  assert.match(r.why, /interação gratuita/);
});

teste('dar item: fora da luta é livre quantas vezes quiser', () => {
  const { enc, cle, pal } = montar();
  garantirInventario(pal).bag.push({ id: 'tocha', tipo: 'item', qtd: 3 });
  explorar(enc);
  for (let i = 0; i < 3; i += 1) assert.equal(enc.darItem(pal, cle, 'tocha').ok, true);
  assert.ok(qtd(cle, 'tocha') >= 3);
  assert.equal(enc.darItem(pal, cle, 'pocaoDeCura').ok, true);
});

teste('dar item: inimigo, si mesmo e item que não tem são recusados; arma guardada passa, empunhada não', () => {
  const { enc, cle, pal, foes } = montar();
  foes[0].pos = { x: 7, y: 5 };
  assert.equal(enc.darItem(pal, foes[0], 'pocaoDeCura').ok, false);
  assert.equal(enc.darItem(pal, pal, 'pocaoDeCura').ok, false);
  assert.equal(enc.darItem(pal, cle, 'kitDeCura').ok, false);
  assert.equal(transferirItem(pal, cle, pal.equippedWeapon).ok, false, 'a que está na mão não passa');
  pal.weapons.push('adaga');
  const r = transferirItem(pal, cle, 'adaga');
  assert.equal(r.ok, true, r.why);
  assert.ok(cle.weapons.includes('adaga') && !pal.weapons.includes('adaga'));
});

teste('dar item: a entrada inteira leva os usos do kit de cura', () => {
  const { enc, cle, pal } = montar();
  garantirInventario(cle).bag.find((e) => e.id === 'kitDeCura').usosRestantes = 4;
  assert.equal(enc.darItem(cle, pal, 'kitDeCura').ok, true);
  assert.equal(garantirInventario(pal).bag.find((e) => e.id === 'kitDeCura').usosRestantes, 4);
  assert.equal(qtd(cle, 'kitDeCura'), 0);
});

// ---- o menu do botão direito -------------------------------------------------------------------------------------

const rotulos = (m) => m?.opcoes.map((o) => `${o.grupo ? `${o.grupo}: ` : ''}${o.rotulo}${o.motivo ? ` [${o.motivo}]` : ''}`) ?? [];
const appDe = (enc, c, extra = {}) => ({
  enc, selected: c, capitulo: null, busy: false, mostrarTexto() {}, refresh() {}, refuse() {},
  usarItem: (a, id, alvo, o) => enc.useItem(a, id, { target: alvo, ...o }),
  saquear: (a, corpo) => saquearCorpo(enc, a, corpo, enc.combatants.filter((x) => x.side === 'party')),
  ...extra,
});

teste('menu do aliado caído: poção, Estabilizar e Dar item aparecem explorando e depois da luta', () => {
  for (const modo of ['explorando', 'over']) {
    const { enc, cle, pal, foes } = montar();
    derrubar(enc, cle);
    if (modo === 'explorando') explorar(enc);
    else { foes[0].dead = true; foes[0].hp = 0; enc.checkEnd(); }
    const app = appDe(enc, pal, { capitulo: modo === 'explorando' ? { explorando: true } : null });
    const m = opcoesDaCasa(app, cle.pos);
    const r = rotulos(m);
    assert.ok(r.some((x) => x.startsWith('Usar item: Poção de cura em Brenn') && !x.includes('[')), `${modo}: ${r.join(' | ')}`);
    assert.ok(r.some((x) => x.startsWith('Socorrer: Estabilizar') && !x.includes('[')), `${modo}: estabilizar`);
    assert.ok(r.some((x) => x.startsWith('Dar item: Poção de cura a Brenn') && !x.includes('[')), `${modo}: dar item`);
    const dar = m.opcoes.find((o) => o.rotulo === 'Poção de cura a Brenn');
    const antes = qtd(cle, 'pocaoDeCura');
    dar.fazer();
    assert.equal(qtd(cle, 'pocaoDeCura'), antes + 1);
  }
});

teste('menu: Dar item longe vem com o motivo, e não existe em si mesmo', () => {
  const { enc, cle, pal } = montar();
  pal.pos = { x: 9, y: 5 };
  const r = rotulos(opcoesDaCasa(appDe(enc, pal), cle.pos));
  assert.ok(r.some((x) => x.startsWith('Dar item: ') && x.includes('encoste nele primeiro')));
  assert.ok(!rotulos(opcoesDaCasa(appDe(enc, pal), pal.pos)).some((x) => x.startsWith('Dar item')));
});

// ---- saque --------------------------------------------------------------------------------------------------------

function cenaDoSaque({ npc = 'iarno', pos = { x: 7, y: 5 } } = {}) {
  const { enc, cle, pal } = montar({ foes: [['goblin', { x: 11, y: 11 }]] });
  const corpo = makeNpc(npc, pos, { rng: enc.rng });
  enc.addCombatant(corpo);
  corpo.dead = true; corpo.hp = 0;
  return { enc, cle, pal, corpo };
}

teste('saque: o corpo de Iarno larga o da tabela, uma vez só, de graça fora da luta', () => {
  const { enc, cle, pal, corpo } = cenaDoSaque();
  assert.equal(chaveDoTesouro(corpo), 'iarno');
  explorar(enc);
  const grupo = [cle, pal];
  const r = saquearCorpo(enc, pal, corpo, grupo);
  assert.equal(r.ok, true, r.why);
  assert.deepEqual(r.achados, ['cajadoDeDefesa', 'pocaoDeCura']);
  assert.ok(pal.weapons.includes('cajadoDeDefesa'));
  assert.equal(qtd(pal, 'pocaoDeCura'), 2);
  assert.equal(pal.actionUsed, true, 'explorando não mexe na ação');
  const deNovo = saquearCorpo(enc, pal, corpo, grupo);
  assert.equal(deNovo.ok, false);
  assert.match(deNovo.why, /já revistado/);
  assert.equal(qtd(pal, 'pocaoDeCura'), 2);
});

teste('saque: na luta custa a ação; longe recusa; peça única que o grupo já tem não duplica', () => {
  const { enc, cle, pal, corpo } = cenaDoSaque();
  assert.match(saquearCorpo(enc, pal, Object.assign(Object.create(corpo), { pos: { x: 9, y: 9 } }), [cle, pal]).why, /encoste/);
  pal.weapons.push('cajadoDeDefesa');                 // o capítulo da mansão já entregou
  assert.deepEqual(tesouroDoCorpo(corpo, [cle, pal]), ['pocaoDeCura']);
  pal.actionUsed = true;
  assert.match(saquearCorpo(enc, pal, corpo, [cle, pal]).why, /ação/);
  pal.actionUsed = false;
  const r = saquearCorpo(enc, pal, corpo, [cle, pal]);
  assert.equal(r.ok, true, r.why);
  assert.equal(pal.actionUsed, true, 'na luta o saque custa a ação');
  assert.equal(pal.weapons.filter((w) => w === 'cajadoDeDefesa').length, 1);
});

teste('saque: goblin comum não tem nada na tabela (não se inventa tesouro)', () => {
  const g = makeMonster('goblin', { x: 7, y: 5 });
  assert.equal(chaveDoTesouro(g), null);
  assert.deepEqual(tesouroDoCorpo(g), []);
});

teste('menu do corpo: antes só "Olhar" do chão; agora Olhar do corpo e Revistar (com o motivo certo)', () => {
  const { enc, pal, corpo } = cenaDoSaque();
  const m = opcoesDaCasa(appDe(enc, pal), corpo.pos);
  assert.equal(m.titulo, corpo.name);
  const r = rotulos(m);
  assert.ok(r.includes('Olhar'), r.join(' | '));
  assert.ok(r.some((x) => x.startsWith('Corpo: Revistar o corpo') && !x.includes('[')), r.join(' | '));
  m.opcoes.find((o) => o.rotulo === 'Revistar o corpo').fazer();
  assert.equal(corpo.saqueado, true);
  const depois = rotulos(opcoesDaCasa(appDe(enc, pal), corpo.pos));
  assert.ok(depois.some((x) => x.includes('já revistado')));
  // goblin morto sem tabela: só Olhar
  const { enc: e2, pal: p2 } = montar({ foes: [['goblin', { x: 7, y: 5 }], ['goblin', { x: 11, y: 11 }]] });
  e2.combatants.find((c) => c.pos.x === 7).dead = true;
  assert.deepEqual(rotulos(opcoesDaCasa(appDe(e2, p2), { x: 7, y: 5 })), ['Olhar o corpo', 'Olhar']);
});


// ---- correções da revisão ----------------------------------------------------------------------------------------

teste('cura não acorda quem dorme por Sono (inconsciente com PV), e o teste de morte não rola para ele', () => {
  const { enc, cle, pal } = montar();
  cle.hp = 3;
  addCondition(cle, 'inconsciente');
  enc.heal(cle, 4);
  assert.ok(hasCondition(cle, 'inconsciente'), 'continua dormindo');
  assert.equal(cle.hp, 7);
  const antes = JSON.stringify(cle.deathSaves);
  enc.endTurn(cle); enc.endTurn(pal);
  enc.endTurn(enc.combatants.find((x) => x.side === 'foes'));
  assert.equal(JSON.stringify(cle.deathSaves), antes, 'sem teste de morte com PV');
});

teste('poção de cura não vai a inimigo (beber, dar na mão); arremesso hostil em exploração é recusado', () => {
  const { enc, pal, foes } = montar();
  foes[0].pos = { x: 7, y: 5 };
  foes[0].hp = 1;
  const r = enc.useItem(pal, 'pocaoDeCura', { target: foes[0] });
  assert.equal(r.ok, false);
  assert.match(r.why, /inimigo/);
  assert.equal(qtd(pal, 'pocaoDeCura'), 1, 'a poção não foi gasta');
  garantirInventario(pal).bag.push({ id: 'fogoAlquimico', tipo: 'item', qtd: 1 });
  assert.equal(enc.useItem(pal, 'fogoAlquimico', { target: foes[0] }).ok, true, 'na luta arremessa');
  const { enc: e2, pal: p2, foes: f2 } = montar();
  f2[0].pos = { x: 7, y: 5 };
  garantirInventario(p2).bag.push({ id: 'fogoAlquimico', tipo: 'item', qtd: 1 });
  explorar(e2);
  const r2 = e2.useItem(p2, 'fogoAlquimico', { target: f2[0] });
  assert.equal(r2.ok, false);
  assert.match(r2.why, /ação de combate/);
});

teste('stabilize e darItem: morto e incapacitado não agem', () => {
  const { enc, cle, pal } = montar();
  derrubar(enc, cle);
  const { enc: e2, cle: c2, pal: p2 } = montar();
  derrubar(e2, c2);
  addCondition(p2, 'paralisado');
  assert.equal(e2.stabilize(p2, c2), false, 'paralisado não estabiliza');
  assert.equal(e2.darItem(p2, c2, 'pocaoDeCura').ok, false, 'paralisado não dá item');
  pal.dead = true;
  assert.equal(enc.stabilize(pal, cle), false, 'morto não estabiliza');
  assert.equal(enc.darItem(pal, cle, 'pocaoDeCura').ok, false);
});

teste('transferirItem: punhos não se dão, arma que já tem não duplica, a adaga de reserva passa, a empunhada não', () => {
  const { cle, pal } = montar();
  pal.weapons.push('punhos');
  assert.equal(transferirItem(pal, cle, 'punhos').ok, false);
  pal.weapons.push('adaga', 'adaga');
  pal.offhandWeapon = 'adaga';
  assert.equal(transferirItem(pal, cle, 'adaga').ok, true, 'duas adagas, uma na mão: a de reserva passa');
  assert.equal(pal.weapons.filter((w) => w === 'adaga').length, 1);
  assert.equal(transferirItem(pal, cle, 'adaga').ok, false, 'a que resta está na mão');
  pal.offhandWeapon = null;
  const r = transferirItem(pal, cle, 'adaga');
  assert.equal(r.ok, false, 'o clérigo já tem uma adaga');
  assert.match(r.why, /já tem/);
  assert.equal(pal.weapons.filter((w) => w === 'adaga').length, 1);
});

teste('transferirItem: dar a última tocha apaga a tocha acesa de quem dá', () => {
  const { cle, pal } = montar();
  garantirInventario(pal).bag = pal.bag.filter((e) => e.id !== 'tocha');
  pal.bag.push({ id: 'tocha', tipo: 'item', qtd: 1 });
  pal.tochaAcesa = true;
  transferirItem(pal, cle, 'tocha');
  assert.equal(pal.tochaAcesa, false);
  pal.bag.push({ id: 'tocha', tipo: 'item', qtd: 2 });
  pal.tochaAcesa = true;
  transferirItem(pal, cle, 'tocha');
  assert.equal(pal.tochaAcesa, true, 'ainda sobra tocha');
});

teste('menu: Dar item só a aliado vivo e não invocado, sem linhas repetidas e com teto', () => {
  const { enc, cle, pal, foes } = montar();
  foes[0].pos = { x: 7, y: 5 };
  for (let i = 0; i < 30; i += 1) pal.weapons.push('adaga');   // várias cópias do mesmo item: uma linha só
  garantirInventario(pal).bag.push({ id: 'cordaCanhamo', tipo: 'item', qtd: 1 }, { id: 'cordaDeSeda', tipo: 'item', qtd: 1 }, { id: 'pocaoDeCura', tipo: 'item', qtd: 1 });
  const dar = (m) => m.opcoes.filter((o) => o.grupo === 'Dar item').map((o) => o.rotulo);
  const linhas = dar(opcoesDaCasa(appDe(enc, pal), cle.pos));
  assert.equal(new Set(linhas).size, linhas.length, `repetidas: ${linhas.join(' | ')}`);
  assert.ok(linhas.length > 0 && linhas.length <= 16);
  assert.equal(dar(opcoesDaCasa(appDe(enc, pal), foes[0].pos)).length, 0, 'inimigo');
  cle.invocado = { auto: false };
  assert.equal(dar(opcoesDaCasa(appDe(enc, pal), cle.pos)).length, 0, 'invocado');
});

teste('menu dos corpos: uma linha de Olhar por corpo, e o chão e a cena continuam (não são engolidos)', () => {
  const { enc, pal } = montar({ foes: [['goblin', { x: 7, y: 5 }], ['goblin', { x: 7, y: 5 }], ['goblin', { x: 11, y: 11 }]] });
  enc.combatants.filter((x) => x.side === 'foes' && x.pos.x === 7).forEach((g, i) => { g.dead = true; g.name = `Goblin ${i + 1}`; });
  const app = appDe(enc, pal, { capitulo: { interacoes: () => [{ rotulo: 'Gancho da cena' }] } });
  const r = rotulos(opcoesDaCasa(app, { x: 7, y: 5 }));
  assert.ok(r.includes('Olhar o corpo de Goblin 1') && r.includes('Olhar o corpo de Goblin 2'), r.join(' | '));
  assert.ok(r.includes('Olhar'), 'o Olhar do chão continua');
  assert.equal(r.filter((x) => x === 'Gancho da cena').length, 1, 'a cena aparece uma vez');
});

teste('menu do corpo de um herói: Revivificar aparece depois da luta (enc.over)', () => {
  const { enc, cle, pal, foes } = montar();
  derrubar(enc, cle);
  cle.dead = true; cle.hp = 0; cle.pos = { x: 5, y: 6 };
  foes[0].dead = true; foes[0].hp = 0;
  enc.checkEnd();
  assert.equal(enc.over, true);
  pal.spellcasting = { ability: 'cha', cantrips: [], prepared: ['revivificar'], sempreProntas: [], slots: [0, 0, 1], slotsMax: [0, 0, 1] };
  pal.pos = { x: 6, y: 6 };
  const r = rotulos(opcoesDaCasa(appDe(enc, pal), cle.pos));
  assert.ok(r.some((x) => x.startsWith('Conjurar: Revivificar')), r.join(' | '));
});

teste('saque: contato respeita parede (o corpo do outro lado do muro não se revista) e aceita a mesma casa', () => {
  const { enc, cle, pal, corpo } = cenaDoSaque();
  const contato = enc.field.contato.bind(enc.field);
  enc.field.contato = () => false;
  assert.match(saquearCorpo(enc, pal, corpo, [cle, pal]).why, /encoste/);
  enc.field.contato = contato;
  pal.pos = { ...corpo.pos };
  assert.equal(saquearCorpo(enc, pal, corpo, [cle, pal]).ok, true, 'na mesma casa');
  assert.deepEqual(corpo.pecasEntregues, ['cajadoDeDefesa', 'pocaoDeCura']);
  corpo.saqueado = false;
  assert.deepEqual(tesouroDoCorpo(corpo, []), [], 'o que já saiu do corpo não sai de novo');
});

teste('grupoTem enxerga o cajado do herói morto; os capítulos conferem antes de dar a peça única', () => {
  const { cle, pal } = montar();
  pal.dead = true;
  pal.weapons.push('cajadoAranha');
  assert.equal(grupoTem([cle, pal], 'cajadoAranha'), true);
  assert.equal(grupoTem([cle], 'cajadoAranha'), false);
  for (const f of ['capitulo3-mansao.js', 'capitulo5-ondaeco.js']) {
    const t = readFileSync(new URL(`../game/${f}`, import.meta.url), 'utf8');
    assert.match(t, /grupoTem\(enc\.combatants\.filter\(\(x\) => x\.side === 'party'\), 'cajado/, `${f} confere o grupo inteiro`);
  }
});

teste('aplicarIntencao: o menu de contexto de quem já terminou o turno é recusado antes de rodar', () => {
  const t = readFileSync(new URL('../main.js', import.meta.url), 'utf8');
  const i = t.indexOf('if (emCombate && c.acted) { avisar(`${c.name} já terminou o turno`)');
  const j = t.indexOf("if (acao === 'contexto' || acao === 'contexto-escolher') { this.contextoDeFora(");
  assert.ok(i > 0 && j > i, 'a recusa vem antes do contexto');
});

console.log(`\n${total - falhas}/${total} testes passaram`);
if (falhas) process.exit(1);
