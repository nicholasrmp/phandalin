// A SEGUNDA FILA DOS BESTIÁRIOS no motor (`livro-motor.js`, lidos por `importar-bestiario.mjs`): o que os blocos do Volo,
// do Mordenkainen, do Bigby e do Acquisitions Inc. pediam e o motor não fazia.
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-fila-bestiario.mjs
//
// Cada prova foi escrita para FALHAR sem o código dela: todas estas mecânicas estavam na fila `bestiario/<livro>-pendente.json`.
import assert from 'node:assert/strict';
import fs from 'node:fs';

const P = new URL('../', import.meta.url).href;
const { Encounter } = await import(P + 'rules/combat.js');
const { criarPersonagem } = await import(P + 'rules/progressao.js');
const { makeMonster, MONSTERS } = await import(P + 'rules/monsters.js');
const { Battlefield, distanceFt } = await import(P + 'core/grid.js');
const { makeRng } = await import(P + 'core/rng.js');
const { hasCondition, caEfetiva } = await import(P + 'rules/conditions.js');
const { takeMonsterTurn } = await import(P + 'rules/ai.js');

let total = 0;
let falhas = 0;
async function teste(nome, fn) {
  total += 1;
  try { await fn(); console.log(`ok    ${nome}`); } catch (e) {
    falhas += 1;
    console.log(`FALHA ${nome}\n      ${String(e.stack ?? e.message).split('\n').slice(0, 6).join('\n      ')}`);
  }
}

const heroi = (nome = 'Dara', nivel = 5) => {
  const c = criarPersonagem({ id: `h-${nome}-${Math.random()}`, name: nome, ancestry: 'Humano', raca: 'Humano', look: 'fighter',
    abilities: { str: 16, dex: 14, con: 15, int: 10, wis: 12, cha: 10 }, skills: ['atletismo'], armor: 'cotaDeMalha', shield: false, speedFt: 30, weapons: ['espadaLonga'] },
  { classe: 'guerreiro', nivel, escolhas: { 1: { estiloDeLuta: 'defense' } } });
  c.equippedWeapon = 'espadaLonga';
  return c;
};
/** O herói em (5,5) e os monstros pedidos (por id), com o lado do grupo jogando. */
function montar(foes, { herois = [heroi()], seed = 3 } = {}) {
  const field = new Battlefield(24, 24, Array(24).fill('.'.repeat(24)));
  herois.forEach((h, i) => { h.pos = { x: 5, y: 5 + i, f: 1 }; });
  const fs = foes.map(([id, p]) => makeMonster(id, p));
  const log = [];
  const enc = new Encounter({ battlefield: field, party: herois, foes: fs, rng: makeRng(seed), onLog: (e) => log.push(e) });
  enc.firstSide = 'party'; enc.round = 1; enc.beginSide('party');
  return { enc, herois, foes: fs, texto: () => log.map((l) => `${l.text} ${l.detail ?? ''}`).join('\n') };
}
const vezDosMonstros = (enc) => { enc.fimDoTurnoDoLado('party'); enc.beginSide('foes'); };
const d20s = (enc, valores) => { const orig = enc.rng.die; const fila = [...valores]; enc.rng.die = (l) => (l === 20 && fila.length ? fila.shift() : orig(l)); };

await teste('O Passo Feérico do eladrin: ação bônus, e ele salta para o lado do herói que estava longe', () => {
  const { enc, herois, foes, texto } = montar([['eladrinDoOutono', { x: 12, y: 5 }]]);
  const e = foes[0];
  assert.ok(e.acoesEspeciais.some((a) => a.tipo === 'teleporte' && a.bonus && a.alcanceFt === 30));
  vezDosMonstros(enc);
  takeMonsterTurn(enc, e);
  assert.match(texto(), /Passo Feérico/);
  assert.ok(distanceFt(e.pos, herois[0].pos) <= 5, `parou a ${distanceFt(e.pos, herois[0].pos)} pés`);
});

await teste('O campeão: o Segundo Fôlego cura 20 com metade da vida; o Indomável rola de novo a resistência que falhou', () => {
  const { enc, foes, texto } = montar([['campeao', { x: 6, y: 5 }]]);
  const c = foes[0];
  c.hp = Math.floor(c.maxHp / 3);
  const antes = c.hp;
  vezDosMonstros(enc);
  takeMonsterTurn(enc, c);
  assert.equal(c.hp, Math.min(c.maxHp, antes + 20), texto());
  d20s(enc, [1, 20]);
  const s = enc.resistencia(c, 'wis', 15);
  assert.ok(s.success, 'o Indomável não rolou de novo');
  assert.match(texto(), /Indomável/);
});

await teste('O oblex: o fogo o deixa com desvantagem nos ataques até o fim do próximo turno dele', () => {
  const { enc, herois, foes } = montar([['oblexAdulto', { x: 6, y: 5 }]]);
  const o = foes[0];
  enc.applyDamage(o, 3, 'fogo', herois[0]);
  assert.ok(hasCondition(o, 'aversaoAoFogo'));
  const mods = enc.attackModifiers(o, herois[0]);
  assert.ok(JSON.stringify(mods).includes('desvantagem') || mods.disadvantage, JSON.stringify(mods));
});

await teste('O abjurador: a Proteção Arcana de 30 PV leva o dano antes dele', () => {
  const { enc, herois, foes } = montar([['abjurador', { x: 6, y: 5 }]]);
  const a = foes[0];
  const hp = a.hp;
  enc.applyDamage(a, 20, 'cortante', herois[0]);
  assert.equal(a.hp, hp);
  enc.applyDamage(a, 15, 'cortante', herois[0]);
  assert.equal(a.hp, hp - 5);
});

await teste('O grung: agarrá-lo é tocar a pele envenenada', () => {
  const { enc, herois, foes, texto } = montar([['grung', { x: 6, y: 5 }]]);
  d20s(enc, [20, 1, 1]);
  const r = enc.agarrar(herois[0], foes[0]);
  assert.ok(r?.ok !== false, JSON.stringify(r));
  assert.ok(hasCondition(herois[0], 'envenenado'), texto());
});

await teste('O tortle se recolhe com pouca vida e dois heróis colados (+4 na CA), fica enquanto o cerco dura e sai quando ele abre', () => {
  const h2 = heroi('Pip');
  const { enc, foes } = montar([['tortle', { x: 6, y: 5 }]], { herois: [heroi(), h2] });
  const t = foes[0];
  h2.pos = { x: 6, y: 6, f: 1 };
  t.hp = 3;
  const ca = caEfetiva(t);
  vezDosMonstros(enc);
  takeMonsterTurn(enc, t);
  assert.ok(hasCondition(t, 'naConcha'));
  assert.equal(caEfetiva(t), ca + 4);
  const rodada = () => { enc.fimDoTurnoDoLado('foes'); enc.beginSide('party'); enc.fimDoTurnoDoLado('party'); enc.beginSide('foes'); };
  rodada();
  takeMonsterTurn(enc, t);
  assert.ok(hasCondition(t, 'naConcha'), 'saiu com o cerco de pé');
  h2.pos = { x: 12, y: 12, f: 1 };
  rodada();
  takeMonsterTurn(enc, t);
  assert.ok(!hasCondition(t, 'naConcha'), 'não saiu da carapaça');
});

await teste('O comandante espectro da espada: a Fúria Marcial bate de novo com 2d8 necrótico, e ele fica exposto', () => {
  const { enc, herois, foes, texto } = montar([['comandanteEspectroDaEspada', { x: 6, y: 5 }]]);
  herois[0].hp = herois[0].maxHp = 200;
  vezDosMonstros(enc);
  d20s(enc, Array(10).fill(19));
  takeMonsterTurn(enc, foes[0]);
  assert.match(texto(), /Fúria Marcial: \+\d+ de necrótico/);
  assert.ok(hasCondition(foes[0], 'exposto'));
});

await teste('O bardo do Volo provoca: o herói fica com desvantagem em ataque e resistência', () => {
  const { enc, herois, foes } = montar([['bardo', { x: 9, y: 5 }]]);
  vezDosMonstros(enc);
  d20s(enc, [1]);
  takeMonsterTurn(enc, foes[0]);
  assert.ok(hasCondition(herois[0], 'escarnecido'));
});

await teste('O berço do Bigby cai e o rebento de Grolantor desperta no lugar dele', () => {
  const { enc, herois, foes, texto } = montar([['bercoDoRebentoDasColinas', { x: 8, y: 5 }]]);
  const b = foes[0];
  enc.applyDamage(b, b.hp + 1, null, herois[0]);
  const r = enc.combatants.find((c) => c.defId === 'rebentoDeGrolantor');
  assert.ok(r && !r.dead, texto());
  assert.deepEqual([r.pos.x, r.pos.y], [8, 5]);
  assert.ok(!enc.over, 'a luta acabou com o berço');
});

await teste('A fila encolheu: nenhuma das mecânicas desta leva segue pendente', () => {
  const fila = ['vgm', 'mtf', 'bgg', 'ai'].flatMap((l) => JSON.parse(fs.readFileSync(new URL(`./bestiario/${l}-pendente.json`, import.meta.url), 'utf8')));
  const nomes = new Set(fila.flatMap((p) => [p.traco, p.acao].filter(Boolean)));
  for (const n of ['Fey Step', 'Second Wind', 'Indomitable', 'Aversion to Fire', 'Arcane Ward', 'Poisonous Skin', 'Shell Defense', 'Martial Fury', 'Taunt', 'Awakening of the Scion']) {
    assert.ok(!nomes.has(n), `${n} ainda na fila`);
  }
  assert.ok(MONSTERS.eladrinDoOutono);
});

console.log(`\n${total - falhas}/${total} testes da fila dos bestiários passaram.`);
if (falhas) process.exit(1);
