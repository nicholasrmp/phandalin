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
const { hasCondition, caEfetiva, addCondition, getCondition } = await import(P + 'rules/conditions.js');
const Livro = await import(P + 'rules/livro-motor.js');
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

// ============================================================ a terceira fila (2026-11-12) ==================
const rodadaInteira = (enc) => { enc.fimDoTurnoDoLado('foes'); enc.beginSide('party'); enc.fimDoTurnoDoLado('party'); enc.beginSide('foes'); };
const contar = (texto, re) => (texto().match(re) ?? []).length;

await teste('As Presas Mentais do yuan-ti: o primeiro golpe do turno soma 3d10 psíquico, uma vez só; a Bênção de Sseth dá 9 PV temporários a quem derruba', () => {
  const { enc, herois, foes, texto } = montar([['yuanTiSussurradorDaMente', { x: 6, y: 5 }]]);
  const y = foes[0];
  herois[0].hp = herois[0].maxHp = 300;
  vezDosMonstros(enc);
  d20s(enc, Array(10).fill(19));
  // os golpes de perto dele, direto (a IA dele prefere a Sugestão): dois acertos no mesmo turno, as presas uma vez só
  const golpe = y.attacks.find((g) => !g.ranged).name;
  enc.resolveAttack(y, herois[0], { weaponId: golpe });
  enc.resolveAttack(y, herois[0], { weaponId: golpe });
  assert.equal(contar(texto, /de psíquico de Presas Mentais/g), 1, texto());
  herois[0].hp = 1;
  herois[0].deathSaves = { successes: 0, failures: 0 };
  enc.applyDamage(herois[0], 5, 'perfurante', y);
  assert.equal(y.tempHp, 9, texto());
});

await teste('O Comando de Ilneval: três orcs aliados gastam a reação num golpe cada; quem não é orc não obedece', () => {
  const { enc, herois, foes, texto } = montar([['laminaDeIlnevalOrc', { x: 12, y: 12 }], ['orc', { x: 6, y: 5 }], ['orc', { x: 4, y: 5 }], ['goblin', { x: 5, y: 4 }]]);
  herois[0].hp = herois[0].maxHp = 300;
  const a = foes[0].acoesEspeciais.find((x) => x.tipo === 'comandar');
  assert.ok(a && a.max === 3 && a.aliado === 'orc');
  vezDosMonstros(enc);
  assert.ok(enc.usarAcaoEspecial(foes[0], a, null), texto());
  assert.ok(foes[1].reactionUsed && foes[2].reactionUsed, 'os orcs não atacaram');
  assert.ok(!foes[3].reactionUsed, 'o goblin obedeceu a um comando de orcs');
  assert.equal(contar(texto, /ao comando de/g), 2, texto());
});

await teste('O Comandar Aliado lendário do senhor da guerra: o aliado golpeia com a reação, com vantagem', () => {
  const { enc, foes, texto } = montar([['senhorDaGuerra', { x: 9, y: 7 }], ['bandido', { x: 6, y: 5 }]]);
  const o = foes[0].lendarias.opcoes.find((x) => x.tipo === 'comandar');
  assert.ok(o?.vantagem);
  assert.ok(Livro.comandarAliados(enc, foes[0], o));
  assert.ok(foes[1].reactionUsed);
  assert.match(texto(), /ao comando de/);
});

await teste('O Golpe Relâmpago do mirmidão: um golpe de mangual que soma 4d8 elétrico e atordoa quem falha; os Golpes Ardentes somam 1d10 de fogo a cada golpe do multiataque', () => {
  const { enc, herois, foes, texto } = montar([['mirmidaoElementalDoAr', { x: 6, y: 5 }]]);
  herois[0].hp = herois[0].maxHp = 300;
  const a = foes[0].acoesEspeciais.find((x) => x.tipo === 'golpeReforcado');
  vezDosMonstros(enc);
  d20s(enc, [19, 1]);
  assert.ok(enc.usarAcaoEspecial(foes[0], a, herois[0]), texto());
  assert.match(texto(), /de elétrico de Golpe Relâmpago/);
  assert.ok(hasCondition(herois[0], 'atordoado'), texto());
  const f = montar([['mirmidaoElementalDoFogo', { x: 6, y: 5 }]]);
  f.herois[0].hp = f.herois[0].maxHp = 300;
  vezDosMonstros(f.enc);
  d20s(f.enc, Array(10).fill(19));
  takeMonsterTurn(f.enc, f.foes[0]);
  assert.ok(contar(f.texto, /de fogo de Golpes Ardentes/g) >= 2, f.texto());
});

await teste('O armadilheiro sufoca: agarrado, contido e cego, e o aperto fere no começo de cada turno de quem está preso', () => {
  const { enc, herois, foes, texto } = montar([['armadilheiro', { x: 6, y: 5 }]]);
  herois[0].hp = herois[0].maxHp = 300;
  vezDosMonstros(enc);
  d20s(enc, [1]);
  takeMonsterTurn(enc, foes[0]);
  const h = herois[0];
  for (const c of ['agarrado', 'contido', 'cego', 'apertoQueFere']) assert.ok(hasCondition(h, c), `${c}\n${texto()}`);
  const antes = h.hp;
  enc.fimDoTurnoDoLado('foes'); enc.beginSide('party');
  assert.ok(h.hp < antes, texto());
  assert.match(texto(), /de concussão/);
  assert.match(texto(), /de ácido/);
});

await teste('O Fardo do Tempo do tecelão sombrio: o humanoide a 3 m resiste com desvantagem; longe, não', () => {
  const { enc, herois } = montar([['tecelaoSombrio', { x: 6, y: 5 }]]);
  const h = herois[0];
  // o d20 que sai primeiro é 20 e o segundo é 1: sem desvantagem passa, com desvantagem falha
  h.pos = { x: 20, y: 20, f: 1 };
  d20s(enc, [20, 1]);
  const longe = enc.resistencia(h, 'wis', 10);
  assert.ok(longe.success, 'longe ainda resistiu com desvantagem');
  h.pos = { x: 5, y: 5, f: 1 };
  d20s(enc, [20, 1]);
  const perto = enc.resistencia(h, 'wis', 10);
  assert.ok(!perto.success, 'perto resistiu sem desvantagem');
});

await teste('O Movimento Borrado do velocino: ataques contra ele com desvantagem, menos quando ele está contido', () => {
  const { enc, herois, foes } = montar([['velocino', { x: 6, y: 5 }]]);
  const mods = enc.attackModifiers(herois[0], foes[0]);
  assert.ok(mods.disadvantage, JSON.stringify(mods));
  addCondition(foes[0], 'contido', { rounds: 5 });
  assert.ok(!enc.attackModifiers(herois[0], foes[0]).disadvantage);
});

await teste('O troll apodrecido: a podridão fere quem está colado no fim do turno dele, menos se ele levou fogo', () => {
  const { enc, herois, foes, texto } = montar([['trollApodrecido', { x: 6, y: 5 }]]);
  const h = herois[0];
  h.hp = h.maxHp = 300;
  vezDosMonstros(enc);
  foes[0].actionUsed = true;
  let antes = h.hp;
  enc.fimDoTurnoDoLado('foes');
  assert.ok(h.hp < antes, texto());
  enc.beginSide('party'); enc.fimDoTurnoDoLado('party'); enc.beginSide('foes');
  enc.applyDamage(foes[0], 3, 'fogo', h);
  antes = h.hp;
  enc.fimDoTurnoDoLado('foes');
  assert.equal(h.hp, antes, texto());
});

await teste('O bodak: quem termina o turno a 9 m dele sofre 5 necrótico; o morto-vivo não', () => {
  const { enc, herois, foes, texto } = montar([['bodak', { x: 9, y: 5 }], ['zumbi', { x: 8, y: 5 }]]);
  const h = herois[0];
  const antes = h.hp;
  const z = foes[1].hp;
  enc.fimDoTurnoDoLado('party');
  assert.equal(h.hp, antes - 5, texto());
  enc.beginSide('foes'); enc.fimDoTurnoDoLado('foes');
  assert.equal(foes[1].hp, z);
});

await teste('O troll venenoso respinga veneno em quem está colado quando o ferem; o psíquico não', () => {
  const { enc, herois, foes, texto } = montar([['trollVenenoso', { x: 6, y: 5 }]]);
  const h = herois[0];
  h.hp = h.maxHp = 300;
  enc.applyDamage(foes[0], 4, 'psíquico', h);
  assert.equal(h.hp, 300);
  enc.applyDamage(foes[0], 4, 'cortante', h);
  assert.ok(h.hp < 300, texto());
  assert.match(texto(), /Respingo Venenoso/);
});

await teste('O beijo da morte: quem o corta de perto leva 1d10 elétrico; quem o esmaga, não', () => {
  const { enc, herois, foes } = montar([['beijoDaMorte', { x: 7, y: 5 }]]);
  const h = herois[0];
  h.hp = h.maxHp = 300;
  foes[0].hp = foes[0].maxHp = 1000;
  h.pos = { x: 6, y: 5, f: 1 };
  d20s(enc, [19]);
  enc.resolveAttack(h, foes[0], { weaponId: 'espadaLonga' });
  assert.ok(h.hp < 300, 'a espada longa (cortante) não sentiu o sangue');
});

await teste('O desvio de projétil do adepto de artes marciais tira 1d10+3 do dano à distância', () => {
  const { enc, herois, foes, texto } = montar([['adeptoDeArtesMarciais', { x: 9, y: 5 }]]);
  const a = foes[0];
  a.hp = a.maxHp = 200;
  enc.applyDamage(a, 20, 'perfurante', herois[0], { deArma: true, corpoACorpo: false });
  assert.ok(a.hp > 180 && a.hp <= 196, `${a.hp}\n${texto()}`);
  assert.ok(a.reactionUsed);
});

await teste('O Sobrevivente do senhor da guerra se refaz 10 abaixo da metade; o pescador das cavernas ferido é vulnerável a fogo; o orc de Yurtrus resiste a veneno com vantagem', () => {
  const { enc, herois, foes } = montar([['senhorDaGuerra', { x: 12, y: 12 }], ['pescadorDasCavernas', { x: 14, y: 14 }], ['orcNutridoDeYurtrus', { x: 16, y: 16 }]]);
  const [s, p, o] = foes;
  s.hp = 20;
  enc.inicioDoTurnoDoBloco(s);
  assert.equal(s.hp, 30);
  p.hp = Math.floor(p.maxHp / 2);
  const hp = p.hp;
  enc.applyDamage(p, 4, 'fogo', herois[0]);
  assert.equal(p.hp, hp - 8);
  d20s(enc, [1, 20]);
  assert.ok(enc.resistencia(o, 'con', 15, { contra: { tipoDano: 'veneno' } }).success);
});

await teste('A Investida Súbita do gnoll: +18 m e nenhum ataque de oportunidade; o Virote Explosivo pega a esfera num ponto a 36 m', () => {
  const { enc, herois, foes } = montar([['gnollRoedorDeCarne', { x: 5, y: 20 }]]);
  vezDosMonstros(enc);
  const g = foes[0];
  takeMonsterTurn(enc, g);
  assert.ok(distanceFt(g.pos, herois[0].pos) <= 5, `parou a ${distanceFt(g.pos, herois[0].pos)} pés`);
  const b = montar([['besteiroDeCarvalho', { x: 5, y: 20 }]]);
  const a = b.foes[0].acoesEspeciais.find((x) => x.shape === 'sphere');
  const pegos = b.enc.pegosDaAcaoEspecial(b.foes[0], a, b.herois[0]);
  assert.deepEqual(pegos.map((c) => c.name), [b.herois[0].name]);
});

await teste('A escuridão sem componentes do ancião sombrio é a magia, uma vez por luta; a Tempestade de Raios só atordoa quem falha por 5', () => {
  const m = makeMonster('anciaoSombrio', { x: 1, y: 1 });
  assert.equal(m.resources?.['porDia:escuridao'], 1);
  assert.equal(MONSTERS.tempestadeAncia.acoesEspeciais.find((x) => x.soFalhandoPor)?.soFalhandoPor, 5);
});

// ------------------------------------------------- a terceira fila, segunda leva (2026-11-12) ----
await teste('O mastim das sombras some com a ação bônus no escuro, e reaparece ao atacar; o orthon reaparece ao ser acertado', () => {
  const { enc, herois, foes, texto } = montar([['mastimDasSombras', { x: 6, y: 5 }]]);
  const m = foes[0];
  herois[0].hp = herois[0].maxHp = 300;
  enc.field.luz = new Uint8Array(24 * 24);
  vezDosMonstros(enc);
  const a = m.acoesEspeciais.find((x) => x.tipo === 'sumir');
  assert.ok(enc.usarAcaoEspecial(m, a, null), texto());
  assert.ok(hasCondition(m, 'invisivel'));
  enc.resolveAttack(m, herois[0], { weaponId: m.attacks[0].name });
  assert.ok(!hasCondition(m, 'invisivel'), 'atacou e continuou invisível');
  const o = montar([['orthon', { x: 6, y: 5 }]]);
  addCondition(o.foes[0], 'invisivel', { rounds: 600, source: o.foes[0].id, data: { acabaAoSerAtingido: true } });
  o.foes[0].hp = o.foes[0].maxHp = 500;
  d20s(o.enc, [19]);
  o.enc.resolveAttack(o.herois[0], o.foes[0], { weaponId: 'espadaLonga' });
  assert.ok(!hasCondition(o.foes[0], 'invisivel'), o.texto());
});

await teste('O defensor de pedra intercepta: o aliado colado ganha +5 de CA contra o golpe que ia acertar', () => {
  const { enc, herois, foes, texto } = montar([['defensorDePedra', { x: 7, y: 5 }], ['bandido', { x: 6, y: 5 }]]);
  const b = foes[1];
  b.hp = b.maxHp = 300;
  const ac = enc.combatants.length && b.ac;
  // o d20 que, somado, empata com a CA: acertaria, e os +5 viram o erro
  const bonus = 3 + 3;
  d20s(enc, [Math.max(2, ac - bonus)]);
  const r = enc.resolveAttack(herois[0], b, { weaponId: 'espadaLonga' });
  assert.ok(foes[0].reactionUsed, texto());
  assert.match(texto(), /Interceptar Ataque/);
  assert.equal(r?.hit, false, texto());
});

await teste('O sacerdote da guerra guia o golpe do aliado que ia errar: +10', () => {
  const { enc, herois, foes, texto } = montar([['sacerdoteDeGuerra', { x: 9, y: 9 }], ['bandido', { x: 6, y: 5 }]]);
  herois[0].hp = herois[0].maxHp = 300;
  vezDosMonstros(enc);
  d20s(enc, [8]);
  const r = enc.resolveAttack(foes[1], herois[0], { weaponId: foes[1].attacks[0].name });
  assert.ok(foes[0].reactionUsed, texto());
  assert.match(texto(), /Golpe Guiado/);
  assert.ok(r?.hit, texto());
});

await teste('O merregon toma o golpe do corruptor colado; o vidente cria estelar troca de lugar com outra cria, que leva o golpe', () => {
  const { enc, herois, foes, texto } = montar([['merregon', { x: 7, y: 5 }], ['merregon', { x: 6, y: 5 }]]);
  const [guarda, alvo] = foes;
  guarda.hp = guarda.maxHp = alvo.hp = alvo.maxHp = 300;
  d20s(enc, [19]);
  enc.resolveAttack(herois[0], alvo, { weaponId: 'espadaLonga' });
  assert.equal(alvo.hp, 300, texto());
  assert.ok(guarda.hp < 300, texto());
  const v = montar([['videnteCriaEstelar', { x: 6, y: 5 }], ['grueCriaEstelar', { x: 12, y: 12 }]]);
  const [vid, grue] = v.foes;
  vid.hp = vid.maxHp = grue.hp = grue.maxHp = 300;
  d20s(v.enc, [19]);
  v.enc.resolveAttack(v.herois[0], vid, { weaponId: 'espadaLonga' });
  assert.equal(vid.hp, 300, v.texto());
  assert.ok(grue.hp < 300, v.texto());
  assert.deepEqual([vid.pos.x, vid.pos.y], [12, 12]);
});

await teste('A Incitar o Fanatismo dá vantagem nos ataques e tira o medo; a Reunir as Tropas acaba com o medo e o encanto', () => {
  const { enc, foes, texto } = montar([['abishaiVermelho', { x: 12, y: 12 }], ['bandido', { x: 13, y: 12 }], ['bandido', { x: 12, y: 13 }]]);
  const a = foes[0].acoesEspeciais.find((x) => x.tipo === 'animarAliados');
  vezDosMonstros(enc);
  assert.ok(enc.usarAcaoEspecial(foes[0], a, null), texto());
  assert.ok(hasCondition(foes[1], 'fanatizado') && hasCondition(foes[2], 'fanatizado'));
  assert.ok(enc.imuneACondicao(foes[1], 'amedrontado'));
  const k = montar([['kithRakGithyanki', { x: 12, y: 12 }], ['bandido', { x: 13, y: 12 }]]);
  addCondition(k.foes[1], 'amedrontado', { rounds: 10 });
  vezDosMonstros(k.enc);
  const r = k.foes[0].acoesEspeciais.find((x) => x.tipo === 'animarAliados');
  assert.ok(k.enc.usarAcaoEspecial(k.foes[0], r, null));
  assert.ok(!hasCondition(k.foes[1], 'amedrontado'));
});

await teste('O Solitário ataca com desvantagem sozinho e com vantagem em companhia; o Oportunista Astuto tem vantagem no ataque de oportunidade', () => {
  const s = montar([['oSolitario', { x: 6, y: 5 }]]);
  assert.ok(s.enc.attackModifiers(s.foes[0], s.herois[0]).disadvantage);
  const c = montar([['oSolitario', { x: 6, y: 5 }], ['bandido', { x: 7, y: 5 }]]);
  assert.ok(c.enc.attackModifiers(c.foes[0], c.herois[0]).advantage);
  const o = montar([['amaldicoadoDePedra', { x: 6, y: 5 }]]);
  assert.ok(o.enc.attackModifiers(o.foes[0], o.herois[0], { opportunity: true }).advantage);
  assert.ok(!o.enc.attackModifiers(o.foes[0], o.herois[0]).advantage);
});

await teste('O gnoll definhado golpeia quando um gnoll cai perto dele; o orthon explode a 15 PV ou menos', () => {
  const { enc, herois, foes, texto } = montar([['gnollDefinhado', { x: 5, y: 6 }], ['gnoll', { x: 6, y: 5 }]]);
  herois[0].hp = herois[0].maxHp = 300;
  enc.applyDamage(foes[1], 999, 'cortante', herois[0]);
  assert.ok(foes[0].reactionUsed, texto());
  assert.match(texto(), /Golpe Vingativo/);
  const o = montar([['orthon', { x: 8, y: 5 }]]);
  o.herois[0].hp = o.herois[0].maxHp = 300;
  o.enc.applyDamage(o.foes[0], o.foes[0].hp - 10, 'energético', o.herois[0]);
  assert.ok(o.foes[0].dead, o.texto());
  assert.ok(o.herois[0].hp < 300, o.texto());
});

await teste('O déspota duergar: o Motor Psíquico estoura em quem está colado quando ele cai', () => {
  const { enc, herois, foes, texto } = montar([['despotaDuergar', { x: 6, y: 5 }]]);
  herois[0].hp = herois[0].maxHp = 300;
  enc.applyDamage(foes[0], 9999, 'cortante', herois[0]);
  assert.match(texto(), /Motor Psíquico/);
  assert.ok(herois[0].hp < 300);
});

// ------------------------------------------------------------------------- a quarta leva (2026-11-16) ----
await teste('O nilbog: a Reviravolta da Sorte zera o golpe e o cura, uma vez por rodada (a reação)', () => {
  const { enc, herois, foes, texto } = montar([['nilbog', { x: 6, y: 5 }]]);
  const n = foes[0];
  n.hp = n.maxHp - 3;
  const antes = n.hp;
  enc.applyDamage(n, 5, 'cortante', herois[0], { deArma: true });
  assert.ok(n.hp > antes && n.hp <= n.maxHp, `${antes} -> ${n.hp}`);
  assert.match(texto(), /Reviravolta da Sorte/);
  const depois = n.hp;
  enc.applyDamage(n, 5, 'cortante', herois[0], { deArma: true });
  assert.equal(n.hp, depois - 5, 'sem reação, o segundo golpe entra');
});

await teste('O caçador de ovos se adapta: o primeiro fogo já entra pela metade, e ele passa a resistir', () => {
  const { enc, herois, foes } = montar([['cacadorDeOvosAdulto', { x: 6, y: 5 }]]);
  const c = foes[0];
  const antes = c.hp;
  enc.applyDamage(c, 10, 'fogo', herois[0], { magico: true });
  assert.equal(antes - c.hp, 5);
  assert.ok(c.resist.includes('fogo'));
});

await teste('O lamento gélido: acertado por ataque, metade do dano e some numa nevasca para longe de quem bateu', () => {
  const { enc, herois, foes, texto } = montar([['lamentoGelido', { x: 6, y: 5 }]]);
  const l = foes[0];
  const antes = { hp: l.hp, d: distanceFt(l.pos, herois[0].pos) };
  enc.applyDamage(l, 10, 'cortante', herois[0], { deArma: true });
  assert.equal(antes.hp - l.hp, 5);
  assert.ok(distanceFt(l.pos, herois[0].pos) > antes.d, 'reapareceu mais longe');
  assert.match(texto(), /Fuga na Nevasca/);
});

await teste('O espreitador de gemas toma para si 3d6 do dano do aliado a até 9 m; o orador dracônico tira 1d6 do golpe do inimigo', () => {
  const { enc, herois, foes, texto } = montar([['espreitadorDeGemas', { x: 10, y: 5 }], ['goblin', { x: 9, y: 9 }]]);
  const [gema, gob] = foes;
  gob.hp = gob.maxHp = 40;
  const g0 = gema.hp;
  enc.applyDamage(gob, 30, 'cortante', herois[0], { deArma: true });
  const tirou = g0 - gema.hp;
  assert.ok(tirou >= 3 && tirou <= 18, `o espreitador tomou ${tirou}`);
  assert.equal(40 - gob.hp, 30 - tirou);
  assert.match(texto(), /Elo Protetor/);
  const o = montar([['oradorDraconico', { x: 12, y: 5 }], ['goblin', { x: 6, y: 5 }]]);
  const [, g2] = o.foes;
  g2.hp = g2.maxHp = 40;
  o.enc.applyDamage(g2, 20, 'cortante', o.herois[0], { deArma: true });
  assert.ok(40 - g2.hp >= 14 && 40 - g2.hp <= 19, `levou ${40 - g2.hp}`);
  assert.match(o.texto(), /Palavras Desarmantes/);
});

await teste('O mago-larva ganha 10 PV temporários quando alguém a até 6 m dele falha um teste', () => {
  const { enc, herois, foes } = montar([['magoLarvaCriaEstelar', { x: 8, y: 5 }]]);
  enc.resistencia(herois[0], 'wis', 99);
  assert.equal(foes[0].tempHp, 10);
  const longe = montar([['magoLarvaCriaEstelar', { x: 20, y: 5 }]]);
  longe.enc.resistencia(longe.herois[0], 'wis', 99);
  assert.ok(!longe.foes[0].tempHp, 'a 75 pés, nada');
});

await teste('A salamandra glacial: o dano de fogo recarrega o Sopro Congelante na hora', () => {
  const { enc, herois, foes, texto } = montar([['salamandraGlacial', { x: 8, y: 5 }]]);
  const s = foes[0];
  const chave = s.breath.chaveRecarga ?? s.breath.name;
  s.recarregando = { [chave]: true };
  enc.applyDamage(s, 5, 'fogo', herois[0], { magico: true });
  assert.equal(s.recarregando[chave], false);
  assert.match(texto(), /Fúria Ardente/);
});

await teste('O arqueiro gasta a ação bônus no Olho do Arqueiro só quando o d10 pode virar o erro em acerto', () => {
  const { enc, herois, foes, texto } = montar([['arqueiro', { x: 12, y: 5 }]]);
  const a = foes[0];
  vezDosMonstros(enc);
  herois[0].hp = herois[0].maxHp = 300;
  d20s(enc, [4]);
  enc.resolveAttack(a, herois[0], { weaponId: 'Arco Longo' });
  assert.match(texto(), /Olho do Arqueiro/);
  assert.ok(a.bonusUsed);
  assert.equal(a.usosDoLivro.olhoDoArqueiro, 1);
});

await teste('A leucrota: depois do golpe de cascos, desengaja com a ação bônus', () => {
  const { enc, herois, foes, texto } = montar([['leucrota', { x: 6, y: 5 }]]);
  vezDosMonstros(enc);
  herois[0].hp = herois[0].maxHp = 300;
  enc.resolveAttack(foes[0], herois[0], { weaponId: 'Cascos' });
  assert.ok(foes[0].bonusUsed);
  assert.match(texto(), /Retirada aos Coices/);
});

await teste('O evocador esculpe a magia: o aliado dentro das Mãos Flamejantes passa e não leva nada; o devastador poupa todos', () => {
  for (const id of ['evocador', 'devastadorHobgoblin']) {
    const { enc, herois, foes } = montar([[id, { x: 9, y: 5 }], ['goblin', { x: 7, y: 5 }]], { seed: 4 });
    const [mago, gob] = foes;
    herois[0].pos = { x: 6, y: 5, f: 1 };
    herois[0].hp = herois[0].maxHp = 300;
    gob.hp = gob.maxHp = 40;
    vezDosMonstros(enc);
    mago.spellcasting.slots = [0, 4, 3, 3, 3, 2];
    const magia = id === 'evocador' ? 'maosFlamejantes' : 'ondaTrovejante';
    const r = enc.castSpell(mago, magia, { target: herois[0], point: herois[0].pos });
    assert.ok(r.ok, `${id}: ${r.why}`);
    assert.equal(gob.hp, 40, `${id}: o goblin aliado não levou nada`);
    assert.ok(herois[0].hp < 300, `${id}: o herói levou`);
  }
});

// ------------------------------------------------------------------------- a quinta leva (2026-11-16) ----
await teste('O sapomoth em choque com relâmpago (lento até o fim do próximo turno); o leviatã congela em parte com 50 de frio num turno', () => {
  const { enc, herois, foes } = montar([['sapomoth', { x: 9, y: 5 }], ['leviata', { x: 15, y: 15 }]]);
  const [sapo, lev] = foes;
  enc.applyDamage(sapo, 8, 'elétrico', herois[0], { magico: true });
  assert.ok(hasCondition(sapo, 'emChoque'));
  lev.hp = lev.maxHp = 500;
  enc.applyDamage(lev, 30, 'frio', herois[0], { magico: true });
  assert.ok(!hasCondition(lev, 'congeladoEmParte'), '30 não basta');
  enc.applyDamage(lev, 25, 'frio', herois[0], { magico: true });
  assert.ok(hasCondition(lev, 'congeladoEmParte'), '55 no mesmo turno congela');
});

await teste('O Raivoso: sem ninguém o ferir ataca com desvantagem; ferido, com vantagem, e o primeiro gancho fere mais 3d12', () => {
  const { enc, herois, foes, texto } = montar([['oRaivoso', { x: 6, y: 5 }]]);
  const r = foes[0];
  assert.equal(Livro.vantagemNoAtaque(enc, r, herois[0])?.modo, 'desvantagem');
  enc.applyDamage(r, 5, 'cortante', herois[0], { deArma: true });
  assert.equal(Livro.vantagemNoAtaque(enc, r, herois[0])?.modo, 'vantagem');
  vezDosMonstros(enc);
  herois[0].hp = herois[0].maxHp = 500;
  d20s(enc, [20, 20]);
  enc.resolveAttack(r, herois[0], { weaponId: 'Gancho' });
  assert.match(texto(), /Fúria Crescente/);
  assert.equal(r.raivaGolpeExtra, false, 'o dano a mais sai uma vez');
});

await teste('O Faminto: vê alguém se curar, ganha vantagem e a mordida fere mais 4d10 necrótico', () => {
  const { enc, herois, foes } = montar([['oFaminto', { x: 8, y: 5 }]]);
  const f = foes[0];
  herois[0].hp = 5;
  enc.heal(herois[0], 5);
  assert.ok(hasCondition(f, 'fomeDeVida'));
  assert.equal(Livro.vantagemNoAtaque(enc, f, herois[0])?.modo, 'vantagem');
  vezDosMonstros(enc);
  const extra = Livro.danoExtraDoEstado(enc, f, herois[0], { name: 'Mordida' });
  assert.deepEqual([extra?.damage, extra?.type], ['4d10', 'necrótico']);
});

await teste('A Colheita Sinistra do necromante: matar com magia de 1º círculo de necromancia devolve 3 PV', async () => {
  const { SPELLS } = await import(P + 'rules/spells.js');
  const { enc, herois, foes } = montar([['necromante', { x: 9, y: 5 }], ['goblin', { x: 6, y: 5 }]]);
  const [n, gob] = foes;
  // o necromante do lado do grupo, para a vítima ser inimiga dele
  gob.side = 'party';
  n.hp = 10;
  enc.magiaEmCurso = SPELLS.raioDeDoenca;
  enc.conjuradorEmCurso = n;
  enc.applyDamage(gob, 99, 'veneno', n, { magico: true });
  assert.equal(n.hp, 10 + 1 * 3);
});

await teste('O andarilho noturno: quem ele leva a 0 PV morre, sem teste contra a morte', () => {
  const { enc, herois, foes } = montar([['andarilhoNoturno', { x: 6, y: 5 }]]);
  enc.applyDamage(herois[0], 999, 'necrótico', foes[0], { magico: true });
  assert.ok(herois[0].dead);
});

await teste('O estrangulador age duas vezes no primeiro turno (Rapidez Aberrante), e só uma vez por luta', () => {
  const { enc, herois, foes, texto } = montar([['estrangulador', { x: 6, y: 5 }]]);
  herois[0].hp = herois[0].maxHp = 500;
  vezDosMonstros(enc);
  takeMonsterTurn(enc, foes[0]);
  assert.match(texto(), /Rapidez Aberrante/);
  assert.ok(foes[0].rapidezUsada);
});

await teste('A dracohidra: cada cabeça a mais é um ataque de oportunidade a mais na rodada', () => {
  const { enc, foes } = montar([['dracohidra', { x: 9, y: 5 }]]);
  const d = foes[0];
  d.reactionUsed = true;
  assert.ok(Livro.temCabecaReativa(enc, d));
  for (let i = 0; i < 4; i++) assert.ok(Livro.gastarCabecaReativa(enc, d), `cabeça ${i + 2}`);
  assert.ok(!Livro.temCabecaReativa(enc, d), 'as cinco cabeças já reagiram');
});

await teste('O gigante inabalável: o empurrão não o move, e a reação o mantém de pé', () => {
  const { enc, herois, foes } = montar([['giganteDePedraDaTerraMaligna', { x: 7, y: 5 }]]);
  const g = foes[0];
  const antes = { ...g.pos };
  enc.empurrar(g, herois[0].pos, 15);
  assert.deepEqual([g.pos.x, g.pos.y], [antes.x, antes.y]);
  assert.ok(g.reactionUsed);
});

await teste('A profetisa Dran tem a Eminência Divina do sacerdote, que a IA já usa', () => {
  assert.ok(MONSTERS.profetisaDran.traits.includes('eminenciaDivina'));
});

// ------------------------------------------------------------------------- a sexta leva (2026-11-16) ----
await teste('O Perdido aperta quem agarra quando é ferido (4d8 psíquico), e o rebento de Grolantor fere quem engoliu e se cura 10', () => {
  const { enc, herois, foes } = montar([['oPerdido', { x: 6, y: 5 }], ['rebentoDeGrolantor', { x: 12, y: 12 }]]);
  const [perdido, rebento] = foes;
  herois[0].hp = herois[0].maxHp = 300;
  addCondition(herois[0], 'agarrado', { source: perdido.id, rounds: 99 });
  enc.applyDamage(perdido, 5, 'cortante', herois[0], { deArma: true });
  assert.ok(herois[0].hp <= 300 - 4 && herois[0].hp >= 300 - 32, `levou ${300 - herois[0].hp}`);
  const outro = heroi('Pip');
  outro.pos = { x: 12, y: 12, f: 1 };
  outro.hp = outro.maxHp = 300;
  enc.addCombatant(outro);
  addCondition(outro, 'engolido', { source: rebento.id, rounds: 99 });
  rebento.hp = rebento.maxHp - 30;
  const r0 = rebento.hp;
  enc.applyDamage(rebento, 5, 'cortante', herois[0], { deArma: true });
  assert.ok(outro.hp < 300, 'quem foi engolido levou');
  assert.ok(rebento.hp > r0, `curou 10 e levou o golpe: ${r0} -> ${rebento.hp}`);
});

await teste('O brutamontes cria estelar devolve o dano psíquico a quem está a 3 m; dois deles não se devolvem para sempre', () => {
  const { enc, herois, foes } = montar([['brutamontesCriaEstelar', { x: 6, y: 5 }], ['brutamontesCriaEstelar', { x: 7, y: 5 }]]);
  const [a, b] = foes;
  herois[0].hp = herois[0].maxHp = 300;
  const pa = a.hp;
  enc.applyDamage(a, 12, 'psíquico', herois[0], { magico: true });
  assert.equal(a.hp, pa, 'ele não leva nada');
  assert.equal(herois[0].hp, 288, 'o herói a 1,5 m leva no lugar');
  assert.equal(b.hp, b.maxHp - 12, 'o outro, espelhando, leva (não devolve de novo)');
});

await teste('O dado depois da jogada: a sorte do bruxo do corruptor (uma vez) e a instrução do senhor da guerra ao aliado', () => {
  const { enc, foes, texto } = montar([['bruxoDoCorruptor', { x: 9, y: 5 }]]);
  const b = foes[0];
  d20s(enc, [8]);
  enc.resistencia(b, 'wis', 30);
  assert.ok(!b.sorteUsada, 'longe demais da CD: não gasta');
  d20s(enc, [8]);
  const r = enc.resistencia(b, 'wis', 8 + 5 + (b.saveBonus?.wis ?? 0));
  assert.ok(b.sorteUsada);
  assert.match(texto(), /Sorte do Próprio Sombrio/);
  const s = montar([['senhorDaGuerraDuergar', { x: 9, y: 5 }], ['goblin', { x: 10, y: 6 }]]);
  const gob = s.foes[1];
  gob.hp = gob.maxHp = 40;
  d20s(s.enc, [10]);
  s.enc.resistencia(gob, 'wis', 13);
  assert.match(s.texto(), /Instrução Flageladora/);
  assert.ok(gob.hp < 40, 'o aliado pagou o psíquico');
  assert.ok(r);
});

await teste('A Fúria de Vaprak: no começo do turno, resistência ao golpe físico e +4 no dano de perto', () => {
  const { enc, herois, foes } = montar([['giganteDoGeloEterno', { x: 6, y: 5 }]]);
  const g = foes[0];
  vezDosMonstros(enc);
  enc.inicioDoTurnoDoBloco(g);
  assert.ok(hasCondition(g, 'furiaDeVaprak'));
  const antes = g.hp;
  enc.applyDamage(g, 20, 'cortante', herois[0], { deArma: true });
  assert.equal(antes - g.hp, 10);
  assert.equal(Livro.danoExtraDoEstado(enc, g, herois[0], { name: 'Machado Grande' })?.damage, '4');
});

await teste('Os banimentos: o cão yeth sob o sol vai para o Etéreo; o barghest numa muralha de fogo vai para a Geena', () => {
  const { enc, foes } = montar([['caoYeth', { x: 9, y: 5 }], ['barghest', { x: 12, y: 8 }]]);
  const [yeth, barg] = foes;
  enc.inicioDoTurnoDoBloco(yeth);
  assert.ok(hasCondition(yeth, 'banidoDoPlano') && yeth.naoSeguraALuta);
  enc.zonas.push({ id: 'fogo1', nome: 'muralha de fogo', casas: new Set(['12,8', '13,8', '14,8']), dano: { dados: '1d4', tipo: 'fogo' } });
  d20s(enc, [1]);
  enc.inicioDoTurnoDoBloco(barg);
  assert.ok(hasCondition(barg, 'banidoDoPlano'));
});

// ------------------------------------------------------------------------- a sétima leva (2026-11-16) ----
await teste('A Pata Pegajosa do steeder: o golpe sem dano agarra (escape 12), um de cada vez', () => {
  const g = MONSTERS.steederFemea.attacks.find((x) => x.name === 'Pata Pegajosa');
  assert.deepEqual([g.damage, g.onHit.condition, g.onHit.escape, g.onHit.maxAgarrados], [0, 'agarrado', 12, 1]);
  const { enc, herois, foes } = montar([['steederFemea', { x: 6, y: 5 }]]);
  vezDosMonstros(enc);
  d20s(enc, [19]);
  enc.resolveAttack(foes[0], herois[0], { weaponId: 'Pata Pegajosa' });
  assert.ok(hasCondition(herois[0], 'agarrado'));
});

await teste('O eladrin do outono faz errar o golpe de quem ele enfeitiçou, contra um aliado dele', () => {
  // o enfeitiçado não ataca quem o enfeitiçou; a paz vale para o golpe em OUTRA criatura, a até 18 m do eladrin
  const { enc, herois, foes, texto } = montar([['eladrinDoOutono', { x: 9, y: 5 }], ['goblin', { x: 6, y: 6 }], ['goblin', { x: 7, y: 6 }]]);
  const [eladrin, gob, aliado] = foes;
  gob.side = 'party';
  addCondition(gob, 'enfeiticado', { source: eladrin.id, rounds: 10 });
  const vida = aliado.hp;
  d20s(enc, [19]);
  enc.resolveAttack(gob, aliado, { weaponId: gob.attacks[0].name });
  assert.equal(aliado.hp, vida);
  assert.match(texto(), /Promover a Paz/);
});

await teste('O Encanto Instintivo: quem ataca o amnizu e falha a Sabedoria acerta a criatura mais perto dele', () => {
  const { enc, herois, foes, texto } = montar([['amnizu', { x: 6, y: 5 }], ['goblin', { x: 4, y: 5 }]]);
  const [amn, gob] = foes;
  gob.hp = gob.maxHp = 60;
  const vida = amn.hp;
  herois[0].abilities.wis = 1;
  d20s(enc, [19, 1]);
  enc.resolveAttack(herois[0], amn, { weaponId: 'espadaLonga' });
  assert.match(texto(), /Encanto Instintivo/);
  assert.equal(amn.hp, vida, 'o amnizu não levou');
  assert.ok(gob.hp < 60, 'o goblin, o mais perto do herói, levou');
});

await teste('A aparência Medonha do Bael: quem começa o turno a 3 m dele testa Sabedoria CD 22 ou fica amedrontado', () => {
  assert.deepEqual([MONSTERS.bael.aura.raioFt, MONSTERS.bael.aura.dc, MONSTERS.bael.aura.condition], [10, 22, 'amedrontado']);
});

await teste('O Passo Sombrio só sai de uma sombra para outra; no claro, não', () => {
  const { enc, foes } = montar([['laminaSombriaDrow', { x: 9, y: 5 }]]);
  const d = foes[0];
  const a = d.acoesEspeciais.find((x) => x.tipo === 'teleporte');
  vezDosMonstros(enc);
  assert.equal(enc.usarAcaoEspecial(d, a, { x: 14, y: 5 }), false, 'no claro do campo aberto');
  enc.field.luz = new Uint8Array(enc.field.w * enc.field.h);
  assert.ok(enc.usarAcaoEspecial(d, a, { x: 14, y: 5 }), 'no breu, salta');
  assert.deepEqual([d.pos.x, d.pos.y], [14, 5]);
});

await teste('A Vingança Corrompida: o orc de Yurtrus se leva a 0 PV e explode em quem está a 3 m', () => {
  const { enc, herois, foes, texto } = montar([['orcNutridoDeYurtrus', { x: 6, y: 5 }]]);
  const o = foes[0];
  herois[0].hp = herois[0].maxHp = 300;
  vezDosMonstros(enc);
  const a = o.acoesEspeciais.find((x) => x.tipo === 'sacrificio');
  assert.ok(enc.usarAcaoEspecial(o, a, null));
  assert.ok(o.dead);
  assert.ok(herois[0].hp < 300, texto());
});

// ------------------------------------------------------------------------- a oitava leva (2026-11-16) ----
await teste('O chão difícil em volta: a lama do brutamontes (4,5 m), a contaminação do sibriex (9 m), a correnteza do wastrilith (só a água)', () => {
  const { enc, foes } = montar([['brutamontesDeLama', { x: 10, y: 10 }]]);
  enc.atualizarTerrenoDasZonas();
  assert.ok(enc.field.dificeis.has('13,10') && !enc.field.dificeis.has('14,10'), 'a 15 pés sim, a 20 não');
  foes[0].pos = { ...foes[0].pos, x: 18, y: 18 };
  enc.atualizarTerrenoDasZonas();
  assert.ok(!enc.field.dificeis.has('13,10'), 'o chão anda com ele');
  assert.deepEqual([MONSTERS.sibriex.aura.dc, MONSTERS.sibriex.aura.damage, MONSTERS.sibriex.motorDoLivro.chaoDificil.raioFt], [20, '4d6', 30]);
  const w = montar([['wastrilith', { x: 10, y: 10 }]]);
  w.enc.field.aguas = new Set(['11,10']);
  w.enc.atualizarTerrenoDasZonas();
  assert.ok(w.enc.field.dificeis.has('11,10') && !w.enc.field.dificeis.has('10,11'), 'só a casa de água');
});

await teste('O Alcance Mortal da garra de osso: quem ENTRA no alcance dela provoca, e o acerto dá um segundo golpe', () => {
  const { enc, herois, foes, texto } = montar([['garraDeOsso', { x: 12, y: 5 }]]);
  const g = foes[0];
  herois[0].hp = herois[0].maxHp = 500;
  const ameacas = enc.ameacasNoPasso(herois[0], { x: 8, y: 5 }, { x: 9, y: 5 });
  assert.ok(ameacas.includes(g), 'de 20 para 15 pés: entra no alcance de 15');
  herois[0].pos = { x: 9, y: 5, f: 1 };
  d20s(enc, [19, 19]);
  enc.opportunityAttack(g, herois[0]);
  assert.match(texto(), /Alcance Mortal/);
});

await teste('O fomoriano rastejador: caído, rasteja sem custo a mais e não dá vantagem a quem o ataca de perto', () => {
  const { enc, herois, foes } = montar([['fomorianoRastejadorDasProfundezas', { x: 6, y: 5 }]]);
  const f = foes[0];
  addCondition(f, 'caido');
  assert.equal(enc.rastejando(f), false);
  const mods = enc.attackModifiers(herois[0], f);
  assert.ok(!(mods.reasons ?? []).some((r) => /alvo caído/.test(r)), JSON.stringify(mods.reasons));
});

await teste('A Língua do sapomoth: o alvo até Médio que falha a Força é puxado para junto dele, e vem a mordida', () => {
  const { enc, herois, foes, texto } = montar([['sapomoth', { x: 9, y: 5 }]]);
  const s = foes[0];
  herois[0].hp = herois[0].maxHp = 500;
  herois[0].abilities.str = 1;
  vezDosMonstros(enc);
  const a = s.acoesEspeciais.find((x) => x.tipo === 'puxarAlvo');
  d20s(enc, [1]);
  assert.ok(enc.usarAcaoEspecial(s, a, herois[0]));
  assert.ok(enc.field.vizinhos(herois[0].pos, s.pos) || distanceFt(herois[0].pos, s.pos) <= 10, `ficou a ${distanceFt(herois[0].pos, s.pos)}`);
  assert.match(texto(), /Língua/);
  assert.ok(s.bonusUsed, 'a mordida com a ação bônus');
});

// --------------------------------------------------------------------------- a nona leva (2026-11-16) ----
await teste('O Coração do Dragão: o kobold amedrontado repete o teste no começo do turno, e passando livra os kobolds por perto', () => {
  const { enc, foes, texto } = montar([['koboldEscudoDraconico', { x: 9, y: 5 }], ['kobold', { x: 10, y: 5 }]]);
  const [escudo, outro] = foes;
  for (const k of [escudo, outro]) addCondition(k, 'amedrontado', { rounds: 10, source: 'x', data: { save: 'wis', dc: 1 } });
  enc.inicioDoTurnoDoBloco(escudo);
  assert.ok(!hasCondition(escudo, 'amedrontado') && !hasCondition(outro, 'amedrontado'), texto());
  assert.match(texto(), /Coração do Dragão/);
});

await teste('A Vantagem Arcana do devastador: o ataque de magia em quem está colado num aliado dele soma 2d6, uma vez por turno', () => {
  const { enc, herois, foes, texto } = montar([['devastadorHobgoblin', { x: 10, y: 5 }], ['goblin', { x: 6, y: 5 }]]);
  const dev = foes[0];
  herois[0].hp = herois[0].maxHp = 500;
  vezDosMonstros(enc);
  dev.spellcasting.slots = [0, 4, 3, 3, 3];
  d20s(enc, [19]);
  const r = enc.castSpell(dev, 'flechaAcida', { target: herois[0] });
  assert.ok(r.ok, r.why);
  assert.match(texto(), /Vantagem Arcana/);
});

await teste('O andarilho dos sonhos: a aura enfeitiça quem começa o turno a 9 m (Carisma 13), e o Toque Petrificante só pega o enfeitiçado', () => {
  const { enc, herois, foes } = montar([['giganteDasPedrasAndarilhoDosSonhos', { x: 7, y: 5 }]]);
  const g = foes[0];
  assert.deepEqual([g.aura.save, g.aura.dc, g.aura.condition], ['cha', 13, 'enfeiticado']);
  const a = g.acoesEspeciais.find((x) => x.nome === 'Toque Petrificante');
  vezDosMonstros(enc);
  assert.equal(enc.usarAcaoEspecial(g, a, herois[0]), false, 'sem o encanto, não');
  addCondition(herois[0], 'enfeiticado', { source: g.id, rounds: 10 });
  herois[0].abilities.con = 1;
  d20s(enc, [1]);
  assert.ok(enc.usarAcaoEspecial(g, a, herois[0]));
  assert.ok(hasCondition(herois[0], 'petrificado'));
});

await teste('O Dardo de Vento acerta sem errar a até 180 m; a Perseguição Férrea anda até o alvo e chuta', () => {
  const { enc, herois, foes } = montar([['quintessenteGiganteDasTempestades', { x: 20, y: 20 }]]);
  const g = foes[0];
  herois[0].hp = herois[0].maxHp = 500;
  vezDosMonstros(enc);
  assert.ok(enc.usarAcaoEspecial(g, g.acoesEspeciais.find((x) => x.nome === 'Dardo de Vento'), herois[0]));
  assert.ok(herois[0].hp < 500 && herois[0].hp <= 500 - 12, `levou ${500 - herois[0].hp}`);
  const r = montar([['barreteVermelho', { x: 9, y: 5 }]]);
  const b = r.foes[0];
  r.herois[0].hp = r.herois[0].maxHp = 500;
  r.herois[0].abilities.dex = 1;
  vezDosMonstros(r.enc);
  d20s(r.enc, [1]);
  assert.ok(r.enc.usarAcaoEspecial(b, b.acoesEspeciais.find((x) => x.anda), r.herois[0]));
  assert.ok(r.enc.field.vizinhos(b.pos, r.herois[0].pos), 'andou até ele');
  assert.ok(hasCondition(r.herois[0], 'caido') && r.herois[0].hp < 500);
});

// --------------------------------------------------------------------------- a décima leva (2026-11-16) ----
await teste('O Sopro Prismático da dracohidra escolhe o tipo que o alvo não resiste', () => {
  const { enc, herois, foes, texto } = montar([['dracohidra', { x: 8, y: 5 }]]);
  const d = foes[0];
  assert.deepEqual(d.breath.tiposAEscolher, ['ácido', 'frio', 'fogo', 'elétrico', 'veneno']);
  herois[0].hp = herois[0].maxHp = 500;
  herois[0].resist = ['ácido', 'frio', 'fogo', 'elétrico'];
  vezDosMonstros(enc);
  assert.notEqual(enc.sopro(d, herois[0].pos), false);
  assert.match(texto(), /\(veneno\)/);
  assert.match(texto(), /de veneno/);
});

await teste('Os Raios Prismáticos do falarrocha: um d6 por criatura escolhe o raio, e o raio dá o dano e a condição dele', () => {
  const { enc, herois, foes, texto } = montar([['giganteDePedraFalarrocha', { x: 9, y: 5 }]], { herois: [heroi('Dara'), heroi('Brenn'), heroi('Pip')] });
  const g = foes[0];
  const a = g.acoesEspeciais.find((x) => x.sorteio);
  assert.deepEqual(a.sorteio.map((r) => r.condition), ['cego', 'amedrontado', 'incapacitado']);
  // cada raio sorteado (o d6 anunciado) vale para quem vem logo depois dele, e em algumas lutas saem os três
  const DO_RAIO = Object.fromEntries(a.sorteio.map((r) => [r.nome, r.condition]));
  const vistas = new Set();
  for (let seed = 1; seed <= 12; seed++) {
    const r = montar([['giganteDePedraFalarrocha', { x: 9, y: 5 }]], { herois: [heroi('Dara'), heroi('Brenn'), heroi('Pip')], seed });
    for (const h of r.herois) { h.hp = h.maxHp = 500; h.abilities.dex = 1; }
    vezDosMonstros(r.enc);
    d20s(r.enc, [1, 1, 1]);
    r.enc.efeitoGeralDoEspecial(r.foes[0], a, r.herois);
    const sorteados = [...r.texto().matchAll(/Raios Prismáticos: ([^(]+) \(d6/g)].map((x) => x[1].trim());
    r.herois.forEach((h, i) => { assert.ok(hasCondition(h, DO_RAIO[sorteados[i]]), `${h.name}: ${sorteados[i]}`); vistas.add(DO_RAIO[sorteados[i]]); });
  }
  assert.equal(vistas.size, 3, [...vistas].join(','));
  void enc; void herois; void texto; void g;
  // e o Geodo Explosivo é uma esfera de 6 m num ponto, não um raio de 18 m em volta do gigante
  const geo = g.acoesEspeciais.find((x) => x.nome === 'Geodo Explosivo');
  assert.deepEqual([geo.shape, geo.areaFt, geo.alcanceFt], ['sphere', 20, 60]);
});

await teste('A Sanguessuga Vital do yagnoloth: só no incapacitado, o dano entra sempre, PV temporários da metade, e o máximo cai só em quem falha', () => {
  const { enc, herois, foes } = montar([['yagnoloth', { x: 6, y: 5 }]]);
  const y = foes[0];
  const a = y.acoesEspeciais.find((x) => x.soIncapacitado);
  herois[0].hp = herois[0].maxHp = 500;
  vezDosMonstros(enc);
  assert.equal(enc.usarAcaoEspecial(y, a, herois[0]), false, 'de pé e livre, não');
  addCondition(herois[0], 'atordoado', { rounds: 10, source: 'x' });
  herois[0].abilities.con = 30;
  d20s(enc, [20]);
  assert.ok(enc.usarAcaoEspecial(y, a, herois[0]));
  const tirou = 500 - herois[0].hp;
  assert.ok(tirou >= 11, `tirou ${tirou}`);
  assert.equal(herois[0].maxHp, 500, 'passou: o máximo fica');
  assert.equal(y.tempHp, Math.floor(tirou / 2));
  y.acted = false; y.acaoUsada = false; enc.beginSide('foes');
  herois[0].abilities.con = 1;
  d20s(enc, [1]);
  const antes = herois[0].maxHp;
  assert.ok(enc.usarAcaoEspecial(y, a, herois[0]));
  assert.ok(herois[0].maxHp < antes, 'falhou: o máximo cai');
});

await teste('A Rajada de Garras do mutilador: seis golpes no mesmo alvo colado', () => {
  const { enc, herois, foes, texto } = montar([['mutiladorCriaEstelar', { x: 6, y: 5 }]]);
  const m = foes[0];
  herois[0].hp = herois[0].maxHp = 500;
  vezDosMonstros(enc);
  const a = m.acoesEspeciais.find((x) => x.tipo === 'golpes');
  let golpes = 0; const orig = enc.resolveAttack.bind(enc);
  enc.resolveAttack = (...x) => { golpes += 1; return orig(...x); };
  assert.ok(enc.usarAcaoEspecial(m, a, herois[0]), texto());
  assert.equal(golpes, 6);
});

await teste('O Erguer Carniçal do maurezhi: o carniçal morto a 9 m volta com toda a vida', () => {
  const { enc, foes, texto } = montar([['maurezhi', { x: 12, y: 5 }], ['ghoul', { x: 13, y: 5 }], ['livido', { x: 12, y: 6 }]]);
  const [mz, gh, lv] = foes;
  for (const c of [gh, lv]) { c.hp = 0; c.dead = true; }
  vezDosMonstros(enc);
  const a = mz.acoesEspeciais.find((x) => x.tipo === 'reviver');
  assert.ok(enc.usarAcaoEspecial(mz, a, null), texto());
  const vivos = [gh, lv].filter((c) => !c.dead && c.hp === c.maxHp);
  assert.equal(vivos.length, 1);
  assert.match(texto(), /Erguer Carniçal/);
});

// --------------------------------------------------------------------------- a décima primeira leva (2026-11-16) ----
await teste('O Dreno de Sangue do beijo da morte: só no agarrado por ele, a 6 m, e cura metade do que tirou', () => {
  const { enc, herois, foes } = montar([['beijoDaMorte', { x: 8, y: 5 }]]);
  const b = foes[0];
  const a = b.acoesEspeciais.find((x) => x.drenaMetade);
  herois[0].hp = herois[0].maxHp = 500;
  b.hp = 10;
  vezDosMonstros(enc);
  assert.equal(enc.usarAcaoEspecial(b, a, herois[0]), false, 'sem o agarrão, não');
  addCondition(herois[0], 'agarrado', { rounds: Infinity, source: b.id, data: { escape: 14 } });
  herois[0].abilities.con = 1;
  d20s(enc, [1]);
  assert.ok(enc.usarAcaoEspecial(b, a, herois[0]));
  const tirou = 500 - herois[0].hp;
  assert.ok(tirou >= 4);
  assert.equal(b.hp, 10 + Math.floor(tirou / 2));
});

await teste('O Olhar Rouba-Alma do nabassu: quem falha perde o máximo pelos dados, e ele ganha o mesmo em PV temporários; o morto-vivo não', () => {
  const { enc, herois, foes } = montar([['nabassu', { x: 9, y: 5 }], ['garraRastejante', { x: 4, y: 9 }]]);
  const [n, z] = foes;
  const a = n.acoesEspeciais.find((x) => x.reduzMaximoDados);
  herois[0].abilities.cha = 1;
  vezDosMonstros(enc);
  z.side = 'party';
  assert.ok(!Livro.alvoServe(enc, n, a, z), 'o morto-vivo não');
  d20s(enc, [1]);
  const antes = herois[0].maxHp;
  assert.ok(enc.usarAcaoEspecial(n, a, herois[0]));
  const perdeu = antes - herois[0].maxHp;
  assert.ok(perdeu >= 2 && perdeu <= 24, `perdeu ${perdeu}`);
  assert.equal(n.tempHp, perdeu);
});

await teste('A Cura Corrompida do oinoloth: o aliado volta com toda a vida, sem o veneno, exausto e com o máximo menor', () => {
  const { enc, foes, texto } = montar([['oinoloth', { x: 9, y: 5 }], ['goblin', { x: 10, y: 5 }]]);
  const [o, g] = foes;
  g.hp = 1;
  addCondition(g, 'envenenado', { rounds: 10, source: 'x' });
  const max = g.maxHp;
  vezDosMonstros(enc);
  assert.ok(enc.usarAcaoEspecial(o, o.acoesEspeciais.find((x) => x.tipo === 'curaCorrompida'), g));
  assert.match(texto(), /Cura Corrompida/);
  assert.ok(g.maxHp < max && g.hp === g.maxHp, `${g.hp}/${g.maxHp}`);
  assert.ok(!hasCondition(g, 'envenenado'));
  assert.ok(texto().includes('exaustão'));
});

await teste('O Chamado à Honra do comandante: ileso não chama; ferido, chama 2 a 5 guerreiros e ataca com vantagem', () => {
  const { enc, foes, texto } = montar([['comandanteEspectroDaEspada', { x: 12, y: 5 }]]);
  const c = foes[0];
  const a = c.acoesEspeciais.find((x) => x.tipo === 'invocar');
  vezDosMonstros(enc);
  assert.equal(enc.usarAcaoEspecial(c, a, null), false, 'ileso, não');
  c.hp -= 5;
  assert.ok(enc.usarAcaoEspecial(c, a, null), texto());
  const guerreiros = enc.combatants.filter((x) => x.defId === 'guerreiroEspectroDaEspada' && !x.dead);
  assert.ok(guerreiros.length >= 2 && guerreiros.length <= 5, `${guerreiros.length}`);
  assert.equal(Livro.vantagemNoAtaque(enc, c, null)?.modo, 'vantagem');
});

await teste('A Investida de Cabeça do giff: 6 m em linha reta até o lado do herói, Força 14 ou 2d6 e caído', () => {
  const { enc, herois, foes, texto } = montar([['giff', { x: 5, y: 12 }]]);
  const g = foes[0];
  herois[0].hp = herois[0].maxHp = 500;
  herois[0].abilities.str = 1;
  vezDosMonstros(enc);
  d20s(enc, [1]);
  enc.moveAlong(g, [12, 11, 10, 9, 8, 7, 6].map((y) => ({ x: 5, y })));
  assert.ok(hasCondition(herois[0], 'caido'), texto());
  assert.ok(herois[0].hp < 500);
  assert.match(texto(), /Investida de Cabeça/);
});

await teste('A Sede de Sangue do flind: o gnoll a 3 m dele morde com a ação bônus no fim do turno; longe, não', () => {
  const { enc, herois, foes, texto } = montar([['gnollCacador', { x: 6, y: 5 }], ['flind', { x: 7, y: 6 }]]);
  const g = foes[0];
  herois[0].hp = herois[0].maxHp = 500;
  vezDosMonstros(enc);
  enc.endTurn(g);
  assert.ok(g.bonusUsed);
  assert.match(texto(), /Aura de Sede de Sangue/);
  const r = montar([['gnollCacador', { x: 6, y: 5 }], ['flind', { x: 15, y: 15 }]]);
  vezDosMonstros(r.enc);
  r.enc.endTurn(r.foes[0]);
  assert.ok(!r.foes[0].bonusUsed);
});

await teste('Atropelar: o colosso de geada passa por cima de dois heróis em fila (Con 15, 4d10 e lento); a bocarra agarra o último', () => {
  const { enc, herois, foes, texto } = montar([['colossoDeGeada', { x: 5, y: 12 }]], { herois: [heroi('Dara'), heroi('Brenn')] });
  const c = foes[0];
  // os dois em fila na frente dele (o colosso é Grande: 2x2)
  herois[0].pos = { x: 5, y: 10, f: 1 }; herois[1].pos = { x: 5, y: 8, f: 1 };
  for (const h of herois) { h.hp = h.maxHp = 500; h.abilities.con = 1; }
  vezDosMonstros(enc);
  d20s(enc, [1, 1]);
  const a = c.acoesEspeciais.find((x) => x.tipo === 'atropelar');
  const t = Livro.trajetoDoAtropelo(enc, c, a, { x: 5, y: 0 });
  assert.equal(t.vitimas.length, 2);
  assert.ok(enc.usarAcaoEspecial(c, a, { x: 5, y: 0 }), texto());
  for (const h of herois) { assert.ok(h.hp < 500 && hasCondition(h, 'lento'), texto()); assert.ok(!(c.pos.x <= h.pos.x && h.pos.x < c.pos.x + 2 && c.pos.y <= h.pos.y && h.pos.y < c.pos.y + 2), 'terminou fora dele'); }
  // a bocarra: Força 18 ou 3d12+6 e agarrado, um só, e só quem ficou ao lado
  const r = montar([['bocarraDeYeenoghu', { x: 4, y: 12 }]], { herois: [heroi('Dara')] });
  const b = r.foes[0];
  r.herois[0].hp = r.herois[0].maxHp = 500; r.herois[0].abilities.str = 1; r.herois[0].pos = { x: 5, y: 9, f: 1 };
  vezDosMonstros(r.enc);
  d20s(r.enc, [1]);
  assert.ok(r.enc.usarAcaoEspecial(b, b.acoesEspeciais[0], { x: 5, y: 7 }), r.texto());
  assert.ok(r.herois[0].hp < 500);
  assert.ok(r.enc.field.vizinhos(b.pos, r.herois[0].pos), 'parou logo depois dele');
  assert.ok(hasCondition(r.herois[0], 'agarrado') && hasCondition(r.herois[0], 'contido'), r.texto());
});

// --------------------------------------------------------------------------- a décima segunda leva (2026-11-16) ----
await teste('As invocações: o coletor chama 1d6 espectros com a ação bônus, a matriarca o yochlol, o moldador 1d4 lobos de gelo', () => {
  for (const [id, quem, min, max] of [['coletorDeCadaveres', 'espectro', 1, 6], ['matriarcaDrow', 'yochlol', 1, 1], ['moldadorDeGeloGiganteDoGelo', 'loboDoInverno', 1, 4]]) {
    const { enc, foes, texto } = montar([[id, { x: 12, y: 5 }]]);
    const m = foes[0];
    const a = m.acoesEspeciais.find((x) => x.tipo === 'invocar');
    assert.equal(a.opcoes[0].id, quem);
    if (id === 'coletorDeCadaveres') assert.ok(a.bonus, 'ação bônus');
    vezDosMonstros(enc);
    assert.ok(enc.usarAcaoEspecial(m, a, null), texto());
    const n = enc.combatants.filter((c) => c.defId === quem && !c.dead).length;
    assert.ok(n >= min && n <= max, `${id}: ${n}`);
  }
});

await teste('O Aperto Sepulcral do rebento de Skoraeus: Destreza 24 ou 8d6 e agarrado; preso no começo do turno dele, vira pedra', () => {
  const { enc, herois, foes } = montar([['rebentoDeSkoraeus', { x: 9, y: 5 }]]);
  const r = foes[0];
  const a = r.acoesEspeciais.find((x) => x.prende?.petrificaNoInicio);
  herois[0].hp = herois[0].maxHp = 500;
  vezDosMonstros(enc);
  d20s(enc, [1]);
  assert.ok(enc.usarAcaoEspecial(r, a, herois[0]));
  assert.ok(hasCondition(herois[0], 'agarrado') && herois[0].hp < 500);
  enc.inicioDoTurnoDoBloco(r);
  assert.ok(hasCondition(herois[0], 'petrificado') && !hasCondition(herois[0], 'agarrado'));
});

await teste('A Corda de Cabelo do korred: ação bônus, a até 15 m, Destreza 13 ou agarrado e contido; não prende de novo quem segura', () => {
  const { enc, herois, foes } = montar([['korred', { x: 13, y: 5 }]]);
  const k = foes[0];
  const a = k.acoesEspeciais.find((x) => x.prende);
  assert.ok(a.bonus && a.alcanceFt === 50);
  vezDosMonstros(enc);
  d20s(enc, [1]);
  assert.ok(enc.usarAcaoEspecial(k, a, herois[0]));
  assert.ok(hasCondition(herois[0], 'agarrado') && hasCondition(herois[0], 'contido'));
  assert.ok(!Livro.alvoServe(enc, k, a, herois[0]));
});

await teste('O Velo Absorvente do carneiro gigante: a magia que erra volta nele como Disparo de Energia, com a reação', () => {
  const mago = criarPersonagem({ id: 'h-mago', name: 'Ilvan', raca: 'humano', abilities: { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10 }, skills: ['arcanismo'] }, { classe: 'mago', nivel: 5 });
  mago.hp = mago.maxHp = 500;
  mago.spellcasting.cantrips.push('raioDeFogo');
  const { enc, foes, texto } = montar([['carneiroGigante', { x: 9, y: 5 }]], { herois: [mago] });
  const c = foes[0];
  d20s(enc, [1, 15]);
  const r = enc.castSpell(mago, 'raioDeFogo', { target: c });
  assert.ok(r.ok, r.why);
  assert.match(texto(), /Velo Absorvente/);
  assert.ok(c.reactionUsed);
});

await teste('Bloquear o Caminho do ogro aríete: quem tenta sair do alcance faz Força 14 ou para; o golpe de oportunidade vem com vantagem e 3d10', () => {
  const { enc, herois, foes, texto } = montar([['ogroAriete', { x: 6, y: 5 }]]);
  const o = foes[0];
  herois[0].hp = herois[0].maxHp = 500;
  enc.beginSide('foes');
  assert.ok(enc.usarAcaoEspecial(o, o.acoesEspeciais.find((x) => x.tipo === 'postura'), null));
  assert.ok(hasCondition(o, 'bloqueandoOCaminho'));
  enc.fimDoTurnoDoLado('foes'); enc.beginSide('party');
  assert.ok(hasCondition(o, 'bloqueandoOCaminho'), 'dura até o começo do próximo turno dele');
  herois[0].abilities.str = 1;
  d20s(enc, [1]);
  enc.moveAlong(herois[0], [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }]);
  assert.deepEqual([herois[0].pos.x, herois[0].pos.y], [5, 5], texto());
  assert.match(texto(), /fecha o caminho/);
});

await teste('O carrapato gigante: o Probóscide gruda, e o grudado perde 2d6+3 necrótico que o carrapato cura; o Miserável drena 1d10+1 necrótico', () => {
  const { enc, herois, foes, texto } = montar([['carrapatoGigante', { x: 6, y: 5 }]]);
  const t = foes[0];
  herois[0].hp = herois[0].maxHp = 500;
  assert.ok(t.attacks.find((g) => g.name === 'Probóscide').gruda);
  vezDosMonstros(enc);
  enc.grudar(t, herois[0]);
  t.hp = 3;
  enc.drenarSangue(t);
  const tirou = 500 - herois[0].hp;
  assert.ok(tirou >= 5 && tirou <= 15, `${tirou}`);
  assert.equal(t.hp, Math.min(t.maxHp, 3 + tirou));
  assert.match(texto(), /necrótico|incha/);
  assert.equal(MONSTERS.manto?.motorDoLivro?.grude, undefined);
  const mis = Object.values(MONSTERS).find((x) => x.nomeOriginal === 'The Wretched');
  assert.deepEqual([mis.motorDoLivro.grude.dano, mis.motorDoLivro.grude.tipo], ['1d10+1', 'necrótico']);
  assert.ok(!Object.values(MONSTERS).find((x) => x.nomeOriginal === 'Darkmantle')?.attacks.some((g) => g.gruda), 'o manto escuro não drena');
});

// --------------------------------------------------------------------------- a décima terceira leva (2026-11-16) ----
await teste('A lista de ações bônus do Fizban e do Bigby é lida: cada uma vira ação, texto ou fila, e nenhuma some', () => {
  const dado = (l) => new URL(`../../_referencias/5etools/bestiary/bestiary-${l}.json`, import.meta.url);
  if (!fs.existsSync(dado('ftd'))) { console.log('      (sem o dado do 5etools: só a parte do jogo)'); }
  const SUB = new Set(['Amethyst', 'Crystal', 'Emerald', 'Sapphire', 'Topaz', 'Acid Rain', 'Freezing Storm', 'Lightning Bolts']);
  let lidas = 0; let naFila = 0; let total = 0;
  for (const l of ['ftd', 'bgg']) {
    if (!fs.existsSync(dado(l))) continue;
    const fila = JSON.parse(fs.readFileSync(new URL(`./bestiario/${l}-pendente.json`, import.meta.url), 'utf8'));
    for (const m of JSON.parse(fs.readFileSync(dado(l), 'utf8')).monster) {
      for (const b of m.bonus ?? []) {
        const en = b.name.replace(/ \{@.*$/, '').replace(/ \(.*$/, '');
        if (SUB.has(en)) continue;
        total += 1;
        const bloco = Object.values(MONSTERS).find((x) => x.nomeOriginal === m.name);
        if (!bloco) continue;
        if (fila.some((p) => p.criatura === bloco.id && p.bonus === en)) { naFila += 1; continue; }
        const temAcao = (bloco.acoesEspeciais ?? []).some((a) => a.bonus);
        const temTexto = en === 'Change Shape' && (bloco.traits ?? []).some((t) => /mudarDeForma/.test(t));
        assert.ok(temAcao || temTexto, `${m.name}: ${en} sumiu`);
        lidas += 1;
      }
    }
  }
  if (total) assert.ok(lidas >= 45 && lidas + naFila === total, `${lidas} lidas, ${naFila} na fila, de ${total}`);
});

await teste('O Teleporte Aterrador do ceifador: quem estava a 3 m de onde ele saiu faz Sabedoria 16 ou fica amedrontado', () => {
  const { enc, herois, foes, texto } = montar([['giganteDaMorteCeifador', { x: 6, y: 5 }]]);
  const g = foes[0];
  const a = g.acoesEspeciais.find((x) => x.medoAoSair);
  assert.ok(a.bonus);
  herois[0].abilities.wis = 1;
  vezDosMonstros(enc);
  d20s(enc, [1]);
  assert.ok(enc.usarAcaoEspecial(g, a, { x: 6, y: 12 }), texto());
  assert.ok(hasCondition(herois[0], 'amedrontado'), texto());
  assert.ok(g.bonusUsed && !g.actionUsed, 'é ação bônus');
});

await teste('O Gêiser de Lava do berço e a Tempestade de Granizo: o cilindro num ponto a até 36 m, e não um raio em volta do dono', () => {
  const { foes } = montar([['bercoDoRebentoDeFogo', { x: 2, y: 2 }], ['espiritoDaTempestade', { x: 20, y: 20 }]]);
  for (const m of foes) {
    const a = m.acoesEspeciais.find((x) => x.bonus && x.tipo === 'area');
    assert.deepEqual([a.shape, a.areaFt, a.alcanceFt], ['sphere', 20, 120], m.name);
  }
  assert.equal(foes[1].acoesEspeciais.find((x) => x.bonus).damageType2, 'frio');
});

await teste('O Arremessar Membro do amálgama de troll: golpe de ação bônus à distância, que não entra na lista de golpes da ação', () => {
  const { enc, herois, foes, texto } = montar([['amalgamaDeTrolls', { x: 5, y: 13 }]]);
  const t = foes[0];
  const a = t.acoesEspeciais.find((x) => x.golpe);
  assert.ok(a.golpe.ranged && a.porDia === 3);
  assert.ok(!t.attacks.some((g) => g.name === a.golpe.name), 'fora da lista de golpes');
  herois[0].hp = herois[0].maxHp = 500;
  vezDosMonstros(enc);
  d20s(enc, [20]);
  assert.ok(enc.usarAcaoEspecial(t, a, herois[0]), texto());
  assert.ok(herois[0].hp < 500 && t.bonusUsed && !t.actionUsed);
  assert.ok(!t.attacks.some((g) => g.name === a.golpe.name), 'e volta a sair dela');
});

await teste('A Explosão de Relâmpago do sopro animado: teleporta e fere quem fica a 1,5 m de onde chega', () => {
  const { enc, herois, foes, texto } = montar([['soproAnimado', { x: 12, y: 5 }]]);
  const s = foes[0];
  const a = s.acoesEspeciais.find((x) => x.danoAoChegar);
  herois[0].hp = herois[0].maxHp = 500;
  vezDosMonstros(enc);
  assert.ok(enc.usarAcaoEspecial(s, a, { x: 6, y: 5 }), texto());
  assert.ok(herois[0].hp < 500, texto());
});

// --------------------------------------------------------------------------- a décima quarta leva (2026-11-16) ----
const concentrado = (h) => { h.concentrating = { spellId: 'bencao', targets: [] }; };

await teste('O Movimento Sísmico do rebento de Surtur: anda até o herói, de graça, e quem se concentra no chão faz Con 26 ou perde', () => {
  const { enc, herois, foes, texto } = montar([['rebentoDeSurtur', { x: 5, y: 14 }]]);
  const r = foes[0];
  const a = r.acoesEspeciais.find((x) => x.tipo === 'tremor');
  assert.deepEqual([a.bonus, a.raioFt, a.dc], [true, 60, 26]);
  concentrado(herois[0]);
  herois[0].abilities.con = 1;
  vezDosMonstros(enc);
  d20s(enc, [1]);
  assert.ok(enc.usarAcaoEspecial(r, a, herois[0]), texto());
  assert.ok(enc.field.vizinhos(r.pos, herois[0].pos) || distanceFt(r.pos, herois[0].pos) <= 10, 'andou');
  assert.ok(!herois[0].concentrating, texto());
  assert.ok(r.bonusUsed && !r.actionUsed);
});

await teste('O tremor do zaratan: no fim do turno, se andou 3 m e alguém a 36 m se concentra', () => {
  for (const andou of [false, true]) {
    const { enc, herois, foes } = montar([['zaratan', { x: 14, y: 14 }]]);
    const z = foes[0];
    concentrado(herois[0]);
    herois[0].abilities.con = 1;
    vezDosMonstros(enc);
    if (andou) z.movementLeftFt = enc.speedOf(z) - 10;
    d20s(enc, [1]);
    enc.endTurn(z);
    assert.equal(!herois[0].concentrating, andou, andou ? 'andou 3 m: quebra' : 'parado, não');
  }
});

await teste('O Engolir do regissauro (ação bônus): o golpe dele no agarrado engole, até dois de uma vez', () => {
  const { enc, herois, foes, texto } = montar([['regissauro', { x: 6, y: 5 }]], { herois: [heroi('Dara'), heroi('Brenn')] });
  const r = foes[0];
  const a = r.acoesEspeciais.find((x) => x.tipo === 'engolir' && x.bonus);
  assert.equal(a.max, 2);
  vezDosMonstros(enc);
  for (const h of herois) { h.hp = h.maxHp = 500; addCondition(h, 'agarrado', { rounds: Infinity, source: r.id, data: { escape: 17 } }); }
  herois[1].pos = { x: 6, y: 6, f: 1 };
  d20s(enc, [20]);
  assert.ok(enc.usarAcaoEspecial(r, a, herois[0]), texto());
  assert.ok(hasCondition(herois[0], 'engolido'), texto());
  assert.ok(!r.attacks.some((g) => g === a.golpe), 'o golpe sai da lista');
  r.bonusUsed = false;
  d20s(enc, [20]);
  assert.ok(enc.usarAcaoEspecial(r, a, herois[1]));
  assert.ok(hasCondition(herois[1], 'engolido'), 'o segundo também');
});

await teste('Os Golpes de Gigante do golias: até o fim do turno, o golpe de perto soma 2d6', () => {
  const { enc, herois, foes, texto } = montar([['goliasParenteDosGigantes', { x: 6, y: 5 }]]);
  const g = foes[0];
  herois[0].hp = herois[0].maxHp = 500;
  vezDosMonstros(enc);
  assert.ok(enc.usarAcaoEspecial(g, g.acoesEspeciais.find((x) => x.condicao === 'golpesDeGigante'), null));
  d20s(enc, [20]);
  enc.resolveAttack(g, herois[0], { weaponId: g.attacks.find((x) => !x.ranged).name });
  assert.match(texto(), /Golpes de Gigante/);
  enc.fimDoTurnoDoLado('foes');
  assert.ok(!hasCondition(g, 'golpesDeGigante'), 'acaba no fim do turno');
});

await teste('A Investida da fúria (mais o deslocamento, sem livrar do ataque de oportunidade), os Gritos Dissonantes e o Recolher o Arpão', () => {
  const f = montar([['furiaDeKostchtchie', { x: 18, y: 18 }]]);
  vezDosMonstros(f.enc);
  const antes = f.foes[0].movementLeftFt;
  assert.ok(f.enc.usarAcaoEspecial(f.foes[0], f.foes[0].acoesEspeciais.find((x) => x.tipo === 'disparada'), null));
  assert.ok(f.foes[0].movementLeftFt > antes && !f.foes[0].disengaging);
  const e = montar([['ecoDeDemogorgon', { x: 12, y: 5 }]]);
  e.herois[0].hp = e.herois[0].maxHp = 500; e.herois[0].abilities.wis = 1;
  vezDosMonstros(e.enc);
  d20s(e.enc, [1]);
  assert.ok(e.enc.usarAcaoEspecial(e.foes[0], e.foes[0].acoesEspeciais.find((x) => x.nome === 'Gritos Dissonantes'), e.herois[0]));
  assert.ok(e.herois[0].hp < 500);
  const g = montar([['giganteDoGeloDaAguaMaligna', { x: 5, y: 10 }]]);
  addCondition(g.herois[0], 'agarrado', { rounds: Infinity, source: g.foes[0].id, data: { escape: 17 } });
  vezDosMonstros(g.enc);
  const longe = distanceFt(g.foes[0].pos, g.herois[0].pos);
  assert.ok(g.enc.usarAcaoEspecial(g.foes[0], g.foes[0].acoesEspeciais.find((x) => x.tipo === 'puxarAgarrados' && x.bonus), null), g.texto());
  assert.ok(distanceFt(g.foes[0].pos, g.herois[0].pos) < longe);
});

// --------------------------------------------------------------------------- a décima quinta leva (2026-11-16) ----
await teste('A Mortalha de Almas e a Fumaça Incendiária: a ação bônus liga a aura, e quem começa o turno perto faz o teste', () => {
  const { enc, herois, foes, texto } = montar([['giganteDaMorteAmortalhado', { x: 6, y: 5 }], ['rebentoDeSurtur', { x: 3, y: 5 }]]);
  const [g, r] = foes;
  herois[0].hp = herois[0].maxHp = 500;
  herois[0].abilities.wis = 1; herois[0].abilities.con = 1;
  vezDosMonstros(enc);
  assert.ok(enc.usarAcaoEspecial(g, g.acoesEspeciais.find((x) => x.condicao === 'mortalhaDeAlmas'), null));
  assert.ok(enc.usarAcaoEspecial(r, r.acoesEspeciais.find((x) => x.condicao === 'fumacaIncendiaria'), null));
  assert.ok(hasCondition(r, 'fumacaIncendiaria') && hasCondition(g, 'mortalhaDeAlmas'));
  d20s(enc, [1, 1]);
  Livro.inicioDoTurnoPerto(enc, herois[0]);
  assert.ok(hasCondition(herois[0], 'almasNaMortalha'), texto());
  assert.ok(herois[0].hp < 500, 'a fumaça queima');
});

await teste('O Fomentar a Loucura do alkilith: quem começa o turno a 9 m faz Sabedoria 18; falha, o zumbido; falha por 5, a confusão', () => {
  for (const [dado, espera] of [[15, 'zumbidoNaCabeca'], [1, 'confuso']]) {
    const { enc, herois } = montar([['alkilith', { x: 8, y: 5 }]]);
    herois[0].abilities.wis = 10;
    d20s(enc, [dado]);
    Livro.inicioDoTurnoPerto(enc, herois[0]);
    assert.ok(hasCondition(herois[0], espera), espera);
  }
});

await teste('O Nilbogismo: quem tenta ferir o nilbog faz Carisma 12 ou passa o turno a louvá-lo; e o nilbog não se cura', () => {
  const { enc, herois, foes, texto } = montar([['nilbog', { x: 6, y: 5 }]]);
  const n = foes[0];
  herois[0].abilities.cha = 1;
  d20s(enc, [1]);
  const hp = n.hp;
  const r = enc.resolveAttack(herois[0], n, { weaponId: 'espadaLonga' });
  assert.ok(r?.cancelado && n.hp === hp, texto());
  assert.ok(hasCondition(herois[0], 'enfeiticado'));
  n.hp = 1;
  assert.equal(enc.heal(n, 5, n), 0);
});

await teste('As larvas putrefatas: o acerto infesta, cada larva fere 1d6 no começo do turno, e o fogo as mata', () => {
  const { enc, herois, foes } = montar([['enxameDeLarvasPutrefatas', { x: 6, y: 5 }]]);
  const e = foes[0];
  herois[0].hp = herois[0].maxHp = 500;
  vezDosMonstros(enc);
  d20s(enc, [20]);
  enc.resolveAttack(e, herois[0], { weaponId: e.attacks[0].name });
  const c = getCondition(herois[0], 'infestadoDeLarvas');
  assert.ok(c && c.data.larvas >= 1 && c.data.dano === `${c.data.larvas}d6`);
  enc.danoDaCondicaoNoInicio(herois[0]);
  assert.ok(herois[0].hp < 500);
  enc.applyDamage(herois[0], 1, 'fogo');
  assert.ok(!hasCondition(herois[0], 'infestadoDeLarvas'));
});

await teste('O mago-larva que cai vira um enxame de vermes na mesma casa; a cria do mar tem os três golpes da Anatomia Pisciana', () => {
  const { enc, herois, foes, texto } = montar([['magoLarvaCriaEstelar', { x: 8, y: 5 }]]);
  const m = foes[0];
  enc.applyDamage(m, 9999, 'energético', herois[0]);
  const enxame = enc.combatants.find((c) => c.defId === 'enxameDeCentopeias');
  assert.ok(enxame && enxame.pos.x === 8 && enxame.side === m.side, texto());
  assert.deepEqual(MONSTERS.criaDoMar.attacks.map((g) => g.name).slice(1), ['Mordida', 'Espinhos Venenosos', 'Tentáculo']);
});

// --------------------------------------------------------------------------- a décima sexta leva (2026-11-16) ----
const CTX = { circuloDe: () => 2, casaLonge: () => null, magia: () => false, tinta: () => false };
const lendaria = (m, tipo) => m.lendarias.opcoes.find((o) => o.tipo === tipo);

await teste('As lendárias do cérebro ancião: quebrar a concentração (1d4 por círculo), o pulso nos inimigos a 3 m, e cortar o elo', () => {
  const { enc, herois, foes, texto } = montar([['cerebroAnciao', { x: 14, y: 5 }]], { herois: [heroi('Dara'), heroi('Brenn')] });
  const c = foes[0];
  for (const h of herois) h.hp = h.maxHp = 500;
  concentrado(herois[0]);
  assert.ok(Livro.escolherLendaria(enc, c, [lendaria(c, 'quebrarConcentracao')], CTX));
  assert.ok(!herois[0].concentrating && herois[0].hp < 500 && herois[0].hp >= 500 - 8, texto());
  const hp1 = herois[1].hp;
  assert.ok(Livro.escolherLendaria(enc, c, [lendaria(c, 'pulso')], CTX));
  assert.ok(herois[1].hp < hp1, 'os dois estão a 1,5 m um do outro');
  assert.ok(Livro.escolherLendaria(enc, c, [c.lendarias.opcoes.find((o) => o.tipo === 'alvo' && o.semTeste)], CTX));
  assert.ok(herois.some((h) => hasCondition(h, 'zumbidoNaCabeca')));
});

await teste('A Morte Rastejante do Orcus deixa vulnerável a necrótico; a Aura Fervente da tartaruga-dragão queima quem começa o turno perto', () => {
  const o = montar([['orcus', { x: 12, y: 5 }]]);
  assert.ok(Livro.escolherLendaria(o.enc, o.foes[0], [lendaria(o.foes[0], 'vulnerar')], CTX));
  assert.ok(hasCondition(o.herois[0], 'morteRastejante'));
  assert.equal(o.enc.danoPorTipo(o.herois[0], 10, 'necrótico', true), 20);
  const t = montar([['tartarugaDragaoAncia', { x: 7, y: 5 }]]);
  t.herois[0].hp = t.herois[0].maxHp = 500; t.herois[0].abilities.con = 1;
  assert.ok(Livro.escolherLendaria(t.enc, t.foes[0], [lendaria(t.foes[0], 'postura')], CTX));
  d20s(t.enc, [1]);
  Livro.inicioDoTurnoPerto(t.enc, t.herois[0]);
  assert.ok(t.herois[0].hp < 500, t.texto());
});

await teste('O senhor das caveiras chama até cinco esqueletos (nunca mais de cinco), e a Zuggtmoy faz o enfeitiçado golpear o aliado', () => {
  const s = montar([['senhorDasCaveiras', { x: 12, y: 5 }]]);
  const sl = s.foes[0];
  assert.ok(Livro.escolherLendaria(s.enc, sl, [lendaria(sl, 'invocar')], CTX));
  const n = () => s.enc.combatants.filter((c) => c.defId === 'esqueleto' && !c.dead).length;
  assert.equal(n(), 5);
  assert.ok(!Livro.escolherLendaria(s.enc, sl, [lendaria(sl, 'invocar')], CTX), 'já são cinco');
  const z = montar([['zuggtmoy', { x: 14, y: 5 }]], { herois: [heroi('Dara'), heroi('Brenn')] });
  addCondition(z.herois[0], 'enfeiticado', { rounds: 10, source: z.foes[0].id });
  z.herois[1].hp = z.herois[1].maxHp = 500;
  d20s(z.enc, [20]);
  assert.ok(Livro.escolherLendaria(z.enc, z.foes[0], [lendaria(z.foes[0], 'marionete')], CTX), z.texto());
  assert.ok(z.herois[1].hp < 500 && z.herois[0].reactionUsed);
});

await teste('O Alimentar do mago-larva fere quem a Praga de Vermes pegou e dá 6 PV temporários; o dragão cérebro ancião quebra a concentração de quem agarra', () => {
  const { enc, herois, foes } = montar([['magoLarvaCriaEstelar', { x: 8, y: 5 }]]);
  const m = foes[0];
  herois[0].hp = herois[0].maxHp = 500;
  assert.ok(!Livro.escolherLendaria(enc, m, [lendaria(m, 'alimentar')], CTX), 'ninguém preso, não');
  addCondition(herois[0], 'cego', { rounds: 10, source: m.id });
  assert.ok(Livro.escolherLendaria(enc, m, [lendaria(m, 'alimentar')], CTX));
  assert.ok(herois[0].hp < 500 && m.tempHp === 6);
  const d = montar([['dragaoCerebroAnciao', { x: 6, y: 5 }]]);
  concentrado(d.herois[0]);
  d.herois[0].hp = d.herois[0].maxHp = 500;
  assert.ok(!Livro.escolherLendaria(d.enc, d.foes[0], [lendaria(d.foes[0], 'quebrarConcentracao')], CTX), 'sem o agarrão, não');
  addCondition(d.herois[0], 'agarrado', { rounds: Infinity, source: d.foes[0].id, data: { escape: 18 } });
  assert.ok(Livro.escolherLendaria(d.enc, d.foes[0], [lendaria(d.foes[0], 'quebrarConcentracao')], CTX));
  assert.ok(!d.herois[0].concentrating && d.herois[0].hp < 500);
});

// --------------------------------------------------------------------------- a décima sétima leva (2026-11-16) ----
await teste('O pescador das cavernas: o filamento prende a até 18 m, e o Filamento puxa o preso para junto dele e dá a garra', () => {
  const { enc, herois, foes, texto } = montar([['pescadorDasCavernas', { x: 5, y: 14 }]]);
  const p = foes[0];
  herois[0].hp = herois[0].maxHp = 500;
  herois[0].abilities.dex = 1; herois[0].abilities.str = 1;
  vezDosMonstros(enc);
  const lanca = p.acoesEspeciais.find((x) => x.prende);
  const puxa = p.acoesEspeciais.find((x) => x.tipo === 'puxarAlvo');
  assert.equal(enc.usarAcaoEspecial(p, puxa, herois[0]), false, 'sem o fio, não puxa');
  d20s(enc, [1]);
  assert.ok(enc.usarAcaoEspecial(p, lanca, herois[0]));
  assert.ok(hasCondition(herois[0], 'agarrado'));
  p.actionUsed = false;
  d20s(enc, [1, 20]);
  assert.ok(enc.usarAcaoEspecial(p, puxa, herois[0]), texto());
  assert.ok(enc.field.vizinhos(p.pos, herois[0].pos) && herois[0].hp < 500, texto());
});

await teste('O zaratan na carapaça: ferido, recolhe-se (resistência a tudo), revitaliza lá dentro, e só então emerge cuspindo pedra', () => {
  const { enc, herois, foes, texto } = montar([['zaratan', { x: 10, y: 10 }]]);
  const z = foes[0];
  herois[0].hp = herois[0].maxHp = 900;
  const op = z.lendarias.opcoes;
  assert.ok(!Livro.escolherLendaria(enc, z, op.filter((o) => o.tipo === 'recolher'), CTX), 'inteiro, não');
  z.hp = Math.floor(z.maxHp / 4);
  assert.equal(Livro.escolherLendaria(enc, z, op, CTX)?.tipo, 'recolher', texto());
  assert.ok(hasCondition(z, 'naConchaDoZaratan'));
  assert.equal(enc.danoPorTipo(z, 10, 'concussão'), 5);
  const antes = z.hp;
  assert.equal(Livro.escolherLendaria(enc, z, op, CTX)?.tipo, 'revitalizar');
  assert.ok(z.hp > antes);
  assert.equal(Livro.escolherLendaria(enc, z, op, CTX)?.tipo, 'emergir');
  assert.ok(!hasCondition(z, 'naConchaDoZaratan'));
});

await teste('O Dance, Meu Boneco do Graz’zt: o enfeitiçado anda até ele com a reação', () => {
  const { enc, herois, foes, texto } = montar([['grazZt', { x: 14, y: 5 }]]);
  const g = foes[0];
  addCondition(herois[0], 'enfeiticado', { rounds: 10, source: g.id });
  const o = g.lendarias.opcoes.find((x) => x.tipo === 'marionete' && x.soMove);
  const antes = distanceFt(herois[0].pos, g.pos);
  assert.ok(Livro.escolherLendaria(enc, g, [o], CTX), texto());
  assert.ok(antes - distanceFt(herois[0].pos, g.pos) >= 25 && herois[0].reactionUsed, `${JSON.stringify(herois[0].pos)}`);
});

await teste('O Pó Ferrão do colosso de poeira, a Praga do oinoloth (imune quem passa) e o Absorver Golpe do Splugoth', () => {
  const d = montar([['colossoDePoeira', { x: 6, y: 5 }]]);
  d.herois[0].hp = d.herois[0].maxHp = 500; d.herois[0].abilities.con = 1;
  vezDosMonstros(d.enc); d20s(d.enc, [1]);
  assert.ok(d.enc.usarAcaoEspecial(d.foes[0], d.foes[0].acoesEspeciais.find((x) => x.condition === 'cego'), d.herois[0]));
  assert.ok(hasCondition(d.herois[0], 'cego') && d.herois[0].hp < 500);
  const o = montar([['oinoloth', { x: 7, y: 5 }]]);
  o.herois[0].hp = o.herois[0].maxHp = 500;
  vezDosMonstros(o.enc);
  assert.ok(o.enc.usarAcaoEspecial(o.foes[0], o.foes[0].acoesEspeciais.find((x) => x.condicao === 'pragaDoOinoloth'), null));
  o.herois[0].abilities.con = 30; d20s(o.enc, [20]);
  Livro.inicioDoTurnoPerto(o.enc, o.herois[0]);
  assert.equal(o.herois[0].hp, 500, 'passou');
  o.herois[0].abilities.con = 1; d20s(o.enc, [1]);
  Livro.inicioDoTurnoPerto(o.enc, o.herois[0]);
  assert.equal(o.herois[0].hp, 500, 'quem passou fica imune');
  const s = montar([['splugothORetornado', { x: 6, y: 5 }]]);
  const sp = s.foes[0];
  const hp = sp.hp;
  d20s(s.enc, [20]);
  s.enc.resolveAttack(s.herois[0], sp, { weaponId: 'espadaLonga' });
  assert.ok(sp.hp === hp && sp.reactionUsed, s.texto());
});

// --------------------------------------------------------------------------- a décima oitava leva (2026-11-16) ----
await teste('As invenções do kobold: cada uma uma vez por dia, os golpes e os bichos soltos', () => {
  const { enc, herois, foes, texto } = montar([['koboldInventor', { x: 8, y: 5 }]]);
  const k = foes[0];
  herois[0].hp = herois[0].maxHp = 500;
  vezDosMonstros(enc);
  const acido = k.acoesEspeciais.find((x) => x.nome === 'Frasco de Ácido');
  d20s(enc, [20]);
  assert.ok(enc.usarAcaoEspecial(k, acido, herois[0]), texto());
  assert.ok(herois[0].hp < 500 && k.actionUsed && !k.attacks.some((g) => g === acido.golpe));
  k.actionUsed = false;
  assert.equal(enc.usarAcaoEspecial(k, acido, herois[0]), false, 'uma vez por dia');
  assert.ok(enc.usarAcaoEspecial(k, k.acoesEspeciais.find((x) => x.nome === 'Ninho de Vespas'), null));
  assert.ok(enc.combatants.some((c) => c.defId === 'enxameDeVespas' && c.side === k.side));
});

await teste('A Tranca Dimensional do canoloth: o teleporte perto dele se perde', () => {
  const { enc, herois, foes, texto } = montar([['canoloth', { x: 9, y: 5 }], ['eladrinDoOutono', { x: 12, y: 5 }]]);
  const e = foes[1];
  vezDosMonstros(enc);
  const antes = { ...e.pos };
  assert.ok(enc.usarAcaoEspecial(e, e.acoesEspeciais.find((x) => x.tipo === 'teleporte'), { x: 6, y: 6 }));
  assert.deepEqual([e.pos.x, e.pos.y], [antes.x, antes.y], texto());
  assert.match(texto(), /se perde/);
});

await teste('As Sombras Demoníacas do nabassu: em volta dele, só penumbra, e a tocha não acende', async () => {
  const { enc, foes } = montar([['nabassu', { x: 10, y: 10 }]]);
  const { nivelDeLuz, fontesDeLuz, CLARO, PENUMBRA } = await import(P + 'rules/luz.js');
  assert.equal(nivelDeLuz(enc.field, 10, 11, fontesDeLuz(enc)), PENUMBRA);
  assert.equal(nivelDeLuz(enc.field, 20, 20, fontesDeLuz(enc)), CLARO);
  void foes;
});

await teste('A Forma de Relâmpago do colosso relâmpago: quem o acerta de perto leva o choque', () => {
  const { enc, herois, foes, texto } = montar([['colossoRelampago', { x: 6, y: 5 }]]);
  herois[0].hp = herois[0].maxHp = 500;
  d20s(enc, [20]);
  enc.resolveAttack(herois[0], foes[0], { weaponId: 'espadaLonga' });
  assert.ok(herois[0].hp < 500, texto());
  assert.deepEqual(MONSTERS.elementalDoFogo?.traits?.includes('formaFluida') ?? true, true, 'o elemental do fogo segue com a Forma Fluida');
});

await teste('A Duplicata Espectral do berbalang: o corpo dorme, ela golpeia psíquico ao lado do herói; cai ela, ele acorda', () => {
  const { enc, herois, foes, texto } = montar([['berbalang', { x: 5, y: 14 }]]);
  const b = foes[0];
  herois[0].hp = herois[0].maxHp = 500;
  vezDosMonstros(enc);
  assert.ok(enc.usarAcaoEspecial(b, b.acoesEspeciais.find((x) => x.tipo === 'duplicata'), null), texto());
  const d = enc.combatants.find((c) => c.duplicataDe === b.id);
  assert.ok(d && hasCondition(b, 'inconsciente') && enc.field.vizinhos(d.pos, herois[0].pos) || distanceFt(d.pos, herois[0].pos) <= 10);
  assert.ok(d.attacks.every((g) => g.type === 'psíquico'));
  assert.ok(b.bonusUsed && !b.actionUsed);
  enc.applyDamage(d, 9999, 'energético', herois[0]);
  assert.ok(!hasCondition(b, 'inconsciente'), texto());
});

// --------------------------------------------------------------------------- a décima nona leva (2026-11-16) ----
await teste('A Boca da Loucura: o gigante vai atrás de quem está mais perto, até do aliado, e o d10 manda no turno', () => {
  const { enc, herois, foes, texto } = montar([['bocaDeGrolantor', { x: 14, y: 5 }], ['goblin', { x: 16, y: 5 }]]);
  const b = foes[0];
  herois[0].hp = herois[0].maxHp = 500;
  vezDosMonstros(enc);
  takeMonsterTurn(enc, b);
  assert.match(texto(), /rola a fome \(d10 = \d+\)/);
  assert.ok(b.actionUsed);
});

await teste('Os Tentáculos-Mangual: um morre no turno em que o caracol leva 10, o multiataque encolhe junto, e sem nenhum ele se recolhe', () => {
  const { enc, herois, foes, texto } = montar([['caracolMangual', { x: 6, y: 5 }]]);
  const c = foes[0];
  c.hp = c.maxHp = 500;
  enc.applyDamage(c, 6, 'cortante', herois[0]);
  enc.applyDamage(c, 6, 'cortante', herois[0]);
  assert.equal(c.tentaculos, 4, texto());
  enc.applyDamage(c, 20, 'cortante', herois[0]);
  assert.equal(c.tentaculos, 4, 'um por turno');
  assert.equal(c.multiattack.count, 4);
  for (let i = 0; i < 4; i++) { c.danoDoTurno = null; enc.applyDamage(c, 10, 'cortante', herois[0]); }
  assert.ok(hasCondition(c, 'caracolRecolhido') && c.naoSeguraALuta);
});

await teste('A Investida de Escudo do couraçado: o golpe do escudo em quem ele atravessa, e quem falha a Força vai empurrado à frente', () => {
  const { enc, herois, foes, texto } = montar([['couracadoGiganteDoFogo', { x: 5, y: 14 }]]);
  const g = foes[0];
  herois[0].hp = herois[0].maxHp = 500; herois[0].abilities.str = 1;
  herois[0].pos = { x: 5, y: 11, f: 1 };
  vezDosMonstros(enc);
  const a = g.acoesEspeciais.find((x) => x.empurra);
  d20s(enc, [20, 1]);
  assert.ok(enc.usarAcaoEspecial(g, a, { x: 5, y: 2 }), texto());
  assert.ok(herois[0].hp < 500, texto());
  assert.match(texto(), /empurra/);
  assert.ok(hasCondition(herois[0], 'caido'), 'falhou por 5: cai');
});

await teste('Os Esporos da Zuggtmoy só pegam humanoide e fera; o Vendaval Uivante arremessa quem falha', () => {
  const { enc, herois, foes } = montar([['zuggtmoy', { x: 8, y: 5 }], ['garraRastejante', { x: 9, y: 7 }]]);
  const z = foes[0];
  const a = z.acoesEspeciais.find((x) => x.soTipos);
  foes[1].side = 'party';
  const pegos = enc.pegosDaAcaoEspecial(z, a, null);
  assert.ok(pegos.includes(herois[0]) && !pegos.includes(foes[1]));
  const v = montar([['tempestadeAncia', { x: 5, y: 14 }]]);
  const o = v.foes[0].lendarias.opcoes.find((x) => x.arremessaFt);
  assert.deepEqual([o.tipo, o.larguraFt, o.arremessaFt], ['linha', 20, 60]);
  v.herois[0].hp = v.herois[0].maxHp = 500; v.herois[0].abilities.dex = 1;
  const antes = { ...v.herois[0].pos };
  d20s(v.enc, [1]);
  v.enc.lendariaDeArea(v.foes[0], o, [v.herois[0]]);
  assert.ok(v.herois[0].hp < 500 && (v.herois[0].pos.x !== antes.x || v.herois[0].pos.y !== antes.y), v.texto());
});

// --------------------------------------------------------------------------- a vigésima leva (2026-11-16) ----
await teste('O Presságio do adivinho: a resistência do inimigo que passaria vira a dele que falha; a do aliado que falharia, a que passa', () => {
  const { enc, herois, foes, texto } = montar([['adivinho', { x: 12, y: 5 }], ['goblin', { x: 13, y: 5 }]]);
  const [a, g] = foes;
  a.pressagios = [2, 19];
  herois[0].abilities.wis = 10;
  d20s(enc, [18]);
  const r = enc.resistencia(herois[0], 'wis', 15);
  assert.ok(!r.success && r.natural === 2, texto());
  g.abilities.dex = 10;
  d20s(enc, [3]);
  const r2 = enc.resistencia(g, 'dex', 15);
  assert.ok(r2.success && r2.natural === 19);
  assert.equal(a.pressagios.length, 0);
});

await teste('A Magia Elevada do feiticeiro escamado kobold: a primeira resistência contra a magia dele vem com desvantagem, uma vez', () => {
  const { enc, herois, foes } = montar([['feiticeiroEscamadoKobold', { x: 9, y: 5 }]]);
  const k = foes[0];
  enc.magiaEmCurso = { id: 'x' }; enc.conjuradorEmCurso = k;
  assert.ok(Livro.magiaElevada(enc, herois[0]));
  assert.equal(k.pontosDeFeiticaria, 0);
  enc.magiaEmCurso = { id: 'y' };
  assert.ok(!Livro.magiaElevada(enc, herois[0]), 'sem pontos');
  enc.magiaEmCurso = null; enc.conjuradorEmCurso = null;
});

await teste('O Pó de Escamas deixa contornado de luz, e quem brilha não fica invisível; o Poder da Rainha Dragão só pega dragão', () => {
  const { enc, herois, foes } = montar([['escaravelhoDoTesouro', { x: 6, y: 5 }]]);
  const e = foes[0];
  herois[0].abilities.dex = 1;
  addCondition(herois[0], 'invisivel', { rounds: 10 });
  vezDosMonstros(enc);
  d20s(enc, [1]);
  assert.ok(enc.usarAcaoEspecial(e, e.acoesEspeciais.find((x) => x.condition === 'contornadoDeLuz'), null));
  assert.ok(hasCondition(herois[0], 'contornadoDeLuz') && !hasCondition(herois[0], 'invisivel'));
  addCondition(herois[0], 'invisivel', { rounds: 10 });
  assert.ok(!hasCondition(herois[0], 'invisivel'), 'não fica invisível');
  const r = montar([['abishaiVermelho', { x: 6, y: 5 }], ['dragaoNegroAdulto', { x: 12, y: 12 }]]);
  const ab = r.foes[0]; const dr = r.foes[1];
  dr.side = 'party';
  const a = ab.acoesEspeciais.find((x) => x.soTipos?.includes('dragão'));
  assert.ok(Livro.alvoServe(r.enc, ab, a, dr) && !Livro.alvoServe(r.enc, ab, a, r.herois[0]));
});

// --------------------------------------------------------------------------- a vigésima primeira leva (2026-11-16) ----
await teste('A flor-cadáver: colhe o humanoide morto a 3 m, digere um corpo para se curar e ergue outro como zumbi', () => {
  const { enc, herois, foes, texto } = montar([['florCadaver', { x: 12, y: 5 }], ['goblin', { x: 14, y: 5 }]]);
  const f = foes[0];
  vezDosMonstros(enc);
  foes[1].hp = 0; foes[1].dead = true; foes[1].tipo = 'humanoide';
  const n0 = Livro.colherMorto(enc, f, f.acoesEspeciais.find((x) => x.tipo === 'colherMorto')) ? f.nCadaveres : -1;
  assert.ok(n0 >= 5 && n0 <= 10, `${n0} cadáveres`);
  f.hp = 1;
  assert.ok(enc.usarAcaoEspecial(f, f.acoesEspeciais.find((x) => x.tipo === 'digerir'), null), texto());
  assert.ok(f.hp > 1 && f.nCadaveres === n0 - 1);
  f.bonusUsed = false;
  assert.ok(enc.usarAcaoEspecial(f, f.acoesEspeciais.find((x) => x.tipo === 'animarCadaver'), null));
  assert.ok(enc.combatants.some((c) => c.defId === 'zumbi' && c.side === f.side));
  void herois;
});

await teste('O Reduzir do mestre mental duergar: +5 de CA e o golpe de arma fere só 1', () => {
  const { enc, herois, foes } = montar([['mestreMentalDuergar', { x: 6, y: 5 }]]);
  const d = foes[0];
  herois[0].hp = herois[0].maxHp = 500;
  const ca = caEfetiva(d);
  vezDosMonstros(enc);
  assert.ok(enc.usarAcaoEspecial(d, d.acoesEspeciais.find((x) => x.condicao === 'reduzidoDuergar'), null));
  assert.equal(caEfetiva(d), ca + 5);
  d20s(enc, [20]);
  enc.resolveAttack(d, herois[0], { weaponId: d.attacks.find((g) => !g.ranged).name });
  assert.ok(500 - herois[0].hp <= 2, `levou ${500 - herois[0].hp}`);
});

await teste('A Maldição Mortal do fensir: quem está a 9 m quando ele morre fica sem descanso por 24 horas; o Beijo da vargouille só no incapacitado', async () => {
  const { enc, herois, foes } = montar([['fensirDevorador', { x: 8, y: 5 }]]);
  herois[0].abilities.cha = 1;
  d20s(enc, [1]);
  Livro.maldicaoMortal(enc, foes[0]);
  assert.ok(hasCondition(herois[0], 'maldicaoDoFensir'));
  const { descansoLongo } = await import(P + 'rules/descanso.js');
  herois[0].hp = 1;
  descansoLongo(herois[0]);
  assert.equal(herois[0].hp, 1, 'o descanso não vale');
  descansoLongo(herois[0]); descansoLongo(herois[0]);
  assert.ok(!hasCondition(herois[0], 'maldicaoDoFensir'), '24 horas passaram');
  const v = montar([['vargouille', { x: 6, y: 5 }]]);
  const a = v.foes[0].acoesEspeciais.find((x) => x.condition === 'beijoDaVargouille');
  assert.ok(!Livro.alvoServe(v.enc, v.foes[0], a, v.herois[0]), 'de pé, não');
  addCondition(v.herois[0], 'atordoado', { rounds: 10, source: 'x' });
  assert.ok(Livro.alvoServe(v.enc, v.foes[0], a, v.herois[0]));
});

// --------------------------------------------------------------------------- a vigésima segunda leva (2026-11-16) ----
await teste('Aprisionar a Alma do devorador: o caído a 0 PV vai para dentro dele; morrendo lá, ele se cura e o cospe zumbi', () => {
  const { enc, herois, foes, texto } = montar([['devorador', { x: 10, y: 5 }]], { herois: [heroi('Dara'), heroi('Brenn')] });
  const d = foes[0];
  d.hp = 10;
  herois[0].hp = 0;
  vezDosMonstros(enc);
  assert.ok(enc.usarAcaoEspecial(d, d.acoesEspeciais.find((x) => x.tipo === 'aprisionarAlma'), null), texto());
  assert.ok(hasCondition(herois[0], 'engolido'));
  enc.morrer(herois[0], 'teste');
  assert.ok(d.hp >= 35, `${d.hp}`);
  assert.ok(enc.combatants.some((c) => c.defId === 'zumbi' && c.side === d.side), texto());
});

await teste('A Reflexão de Magia do morkoth: o Raio de Fogo que erra vai para o aliado de quem conjurou', () => {
  const mago = criarPersonagem({ id: 'h-mago2', name: 'Ilvan', raca: 'humano', abilities: { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10 }, skills: [] }, { classe: 'mago', nivel: 5 });
  mago.spellcasting.cantrips.push('raioDeFogo');
  const { enc, herois, foes, texto } = montar([['morkoth', { x: 9, y: 5 }]], { herois: [mago, heroi('Brenn')] });
  herois[1].hp = herois[1].maxHp = 500;
  d20s(enc, [1, 20]);
  assert.ok(enc.castSpell(mago, 'raioDeFogo', { target: foes[0] }).ok);
  assert.match(texto(), /devolve a magia/);
  assert.ok(herois[1].hp < 500 || mago.hp < mago.maxHp, texto());
});

await teste('A Reflexão de Magia do colosso rúnico: o tiro em quem conjura e, falhando a Inteligência, a magia se desfaz', () => {
  const mago = criarPersonagem({ id: 'h-mago3', name: 'Ilvan', raca: 'humano', abilities: { str: 8, dex: 14, con: 14, int: 1, wis: 12, cha: 10 }, skills: [] }, { classe: 'mago', nivel: 5 });
  mago.hp = mago.maxHp = 500;
  const { enc, foes, texto } = montar([['colossoRunico', { x: 12, y: 5 }]], { herois: [mago] });
  d20s(enc, [19, 1]);
  assert.ok(Livro.reflexaoRunica(enc, mago, { name: 'Bola de Fogo', level: 3 }, 3), texto());
  assert.ok(mago.hp < 500 && foes[0].reactionUsed);
});

await teste('Os Espinhos de Pedra do berço ferem a cada passo; o Movimento Dúplice do firbolg é o passo de 9 m', () => {
  const { enc, herois, foes, texto } = montar([['bercoDoRebentoDePedra', { x: 14, y: 5 }]]);
  const b = foes[0];
  herois[0].hp = herois[0].maxHp = 500;
  vezDosMonstros(enc);
  assert.ok(enc.usarAcaoEspecial(b, b.acoesEspeciais.find((x) => x.tipo === 'espinhosDoChao'), herois[0]), texto());
  enc.fimDoTurnoDoLado('foes'); enc.beginSide('party');
  enc.moveAlong(herois[0], [{ x: 5, y: 5 }, { x: 6, y: 5 }]);
  assert.ok(herois[0].hp < 500, texto());
  assert.equal(MONSTERS.firbolgAndarilho.acoesEspeciais.find((x) => x.bonus && x.tipo === 'teleporte')?.alcanceFt, 30);
});

// --------------------------------------------------------------------------- a vigésima terceira leva (2026-11-16) ----
await teste('O Desafio do Campeão do Donaar: quem falha a Sabedoria não se afasta mais de 9 m dele; com o Donaar caído, solta', () => {
  const { enc, herois, foes, texto } = montar([['donaarBlitZen', { x: 8, y: 5 }]]);
  const d = foes[0];
  herois[0].abilities.wis = 1;
  vezDosMonstros(enc);
  d20s(enc, [1]);
  assert.ok(enc.usarAcaoEspecial(d, d.acoesEspeciais.find((x) => x.condition === 'desafioDoCampeao'), null), texto());
  assert.ok(hasCondition(herois[0], 'desafioDoCampeao') && d.bonusUsed);
  enc.fimDoTurnoDoLado('foes'); enc.beginSide('party');
  enc.moveAlong(herois[0], [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }, { x: 2, y: 5 }, { x: 1, y: 5 }, { x: 0, y: 5 }]);
  assert.ok(distanceFt(herois[0].pos, d.pos) <= 30, `parou a ${distanceFt(herois[0].pos, d.pos)} pés`);
  assert.match(texto(), /o desafio o segura/);
});

await teste('A Forma Selvagem da Walnut: vira lobo atroz com a ação bônus; os Esporos de Infestação são a doença que mata em três dias', async () => {
  const { enc, foes, texto } = montar([['walnutDankgrass', { x: 12, y: 5 }]]);
  const w = foes[0];
  vezDosMonstros(enc);
  assert.ok(enc.usarAcaoEspecial(w, w.acoesEspeciais.find((x) => x.tipo === 'formaSelvagem'), null), texto());
  assert.ok(w.formaSelvagem && /lobo/i.test(w.formaSelvagem.nome));
  const z = montar([['zuggtmoy', { x: 7, y: 5 }]]);
  z.herois[0].abilities.con = 1;
  vezDosMonstros(z.enc); d20s(z.enc, [1]);
  assert.ok(z.enc.usarAcaoEspecial(z.foes[0], z.foes[0].acoesEspeciais.find((x) => x.condition === 'esporosDeZuggtmoy'), null));
  assert.ok(hasCondition(z.herois[0], 'esporosDeZuggtmoy'));
  const { avancarDoencas } = await import(P + 'rules/doencas.js');
  for (let i = 0; i < 3; i++) avancarDoencas(z.herois[0], () => 1);
  assert.ok(z.herois[0].dead, 'três falhas');
});

// --------------------------------------------------------------------------- a vigésima quarta leva (2026-11-16) ----
await teste('O Motor da Dor do martelador: com o interruptor ligado, o golpe mira o preso, fere a mais e acorda a máquina', () => {
  const { enc, herois, foes, texto } = montar([['marteladorDuergar', { x: 6, y: 5 }]]);
  const m = foes[0];
  m.hp = m.maxHp = 500;
  herois[0].hp = herois[0].maxHp = 500;
  assert.ok(enc.useFeature(herois[0], 'mirarPreso', { modo: 'ligar' }));
  d20s(enc, [20, 20, 20, 20, 20]);
  enc.resolveAttack(herois[0], m, { weaponId: 'espadaLonga' });
  assert.match(texto(), /O duergar preso/);
  assert.ok(m.reactionUsed && herois[0].hp < 500, texto());
  const hp = m.hp;
  enc.resolveAttack(herois[0], m, { weaponId: 'espadaLonga' });
  assert.equal((texto().match(/O duergar preso/g) ?? []).length, 1, 'uma vez por turno');
  void hp;
});

await teste('O dybbuk possui o cadáver a 1,5 m: veste o corpo, e perder o corpo o devolve', () => {
  const { enc, herois, foes, texto } = montar([['dybbuk', { x: 10, y: 5 }], ['ogro', { x: 11, y: 5 }]]);
  const [d, o] = foes;
  o.hp = 0; o.dead = true;
  vezDosMonstros(enc);
  assert.ok(enc.usarAcaoEspecial(d, d.acoesEspeciais.find((x) => x.tipo === 'possuirCadaver'), null), texto());
  assert.ok(d.formaSelvagem && d.pos.x === 11);
  enc.applyDamage(d, 9999, 'energético', herois[0]);
  assert.ok(!d.formaSelvagem, 'o corpo se perde');
});

// --------------------------------------------------------------------------- a vigésima quinta leva (2026-11-16) ----
await teste('A fila de magias do bestiário não cobra magia de 1 minuto ou mais de conjuração (o monstro não a conjura numa luta)', () => {
  const pasta = new URL('../../_referencias/5etools/spells/', import.meta.url);
  if (!fs.existsSync(pasta)) { console.log('      (sem o dado de magias do 5etools)'); return; }
  const tempo = new Map();
  for (const f of fs.readdirSync(pasta).filter((x) => /^spells-.*\.json$/.test(x))) {
    for (const sp of JSON.parse(fs.readFileSync(new URL(f, pasta), 'utf8')).spell ?? []) tempo.set(sp.name.toLowerCase(), sp.time?.[0]?.unit);
  }
  const fila = ['mm', 'vgm', 'mtf', 'bgg', 'ftd', 'ai'].flatMap((l) => JSON.parse(fs.readFileSync(new URL(`./bestiario/${l}-pendente.json`, import.meta.url), 'utf8')));
  const longas = fila.flatMap((p) => p.magias ?? []).filter((n) => ['minute', 'hour', 'day'].includes(tempo.get(n)));
  assert.deepEqual(longas, [], longas.join(', '));
  // a última de uma ação que a fila cobrava (a Criar Passagem do dao) entrou no jogo (2026-11-16): o dao a conjura
  assert.ok(JSON.stringify(makeMonster('dao', { x: 1, y: 1 }).spellcasting ?? {}).includes('criarPassagem'), 'o dao conjura a Criar Passagem');
});

// --------------------------------------------------------------------------- a vigésima sexta leva (2026-11-16) ----
await teste('A Magia Ecoada da Pendragon: no turno seguinte, a magia do turno passado outra vez, com a ação bônus', () => {
  const { enc, herois, foes, texto } = montar([['pendragonBeestinger', { x: 10, y: 5 }]]);
  const p = foes[0];
  herois[0].hp = herois[0].maxHp = 500;
  vezDosMonstros(enc);
  assert.ok(enc.castSpell(p, 'misselMagico', { target: herois[0], circulo: 1 }).ok, texto());
  assert.equal(p.ultimaMagia?.spellId, 'misselMagico');
  enc.round = 2;
  const hp = herois[0].hp;
  p.bonusUsed = false; p.actionUsed = true;
  assert.ok(enc.usarAcaoEspecial(p, p.acoesEspeciais.find((x) => x.tipo === 'magiaEcoada'), null), texto());
  assert.ok(herois[0].hp < hp && p.bonusUsed);
});

await teste('O Mimetismo de Magia do gargantua: quem conjura perto dele faz Car 19, e falhando ele conjura a mesma magia em quem conjurou', () => {
  const mago = criarPersonagem({ id: 'h-mago4', name: 'Ilvan', raca: 'humano', abilities: { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 1 }, skills: [] }, { classe: 'mago', nivel: 5 });
  mago.hp = mago.maxHp = 500;
  mago.spellcasting.prepared.push('misselMagico');
  const { enc, foes, texto } = montar([['gargantua', { x: 12, y: 5 }]], { herois: [mago] });
  const g = foes[0];
  g.hp = g.maxHp = 9999;
  d20s(enc, [1]);
  assert.ok(enc.castSpell(mago, 'misselMagico', { target: g, circulo: 1 }).ok);
  assert.match(texto(), /copia a magia/);
  assert.ok(mago.hp < 500 && g.reactionUsed, texto());
  assert.ok(!g.spellcasting?.prepared?.includes('misselMagico'), 'a conjuração emprestada sai');
});

await teste('A Tempestade Vingativa do rebento de Stronmaus: a nuvem, e um efeito por vez, nunca o mesmo duas vezes seguidas', () => {
  const { enc, herois, foes, texto } = montar([['rebentoDeStronmaus', { x: 14, y: 5 }]]);
  const r = foes[0];
  herois[0].hp = herois[0].maxHp = 900;
  herois[0].abilities.con = 1; herois[0].abilities.dex = 1;
  vezDosMonstros(enc);
  const a = r.acoesEspeciais.find((x) => x.tipo === 'tempestadeVingativa');
  const vistos = [];
  for (let i = 0; i < 4; i++) {
    d20s(enc, [1]);
    assert.ok(Livro.tempestadeVingativa(enc, r, a, herois[0]), texto());
    vistos.push(r.tempestade.ultimo);
  }
  for (let i = 1; i < vistos.length; i++) assert.notEqual(vistos[i], vistos[i - 1], vistos.join(','));
  assert.ok(herois[0].hp < 900);
});

await teste('A Onda de Maré do leviatã fere e empurra quem está em volta; o Óleo do boggle dá vantagem para escapar', () => {
  const { enc, herois, foes } = montar([['leviata', { x: 7, y: 7 }]]);
  const a = foes[0].acoesEspeciais.find((x) => x.arremessaFt);
  assert.deepEqual([a.shape, a.areaFt, a.save, a.dc], ['raio', 25, 'str', 24]);
  const b = montar([['boggle', { x: 6, y: 5 }]]);
  const bo = b.foes[0];
  const rolagens = [];
  const orig = b.enc.rng.die;
  b.enc.rng.die = (l) => { const x = orig(l); if (l === 20) rolagens.push(x); return x; };
  b.enc.testeDeAtributo(bo, 'dex', 0, 'Acrobacia', { pericia: 'acrobacia' });
  assert.equal(rolagens.length, 2, 'dois d20: vantagem');
  void enc; void herois;
});

// --------------------------------------------------------------------------- as lutas sem fim (2026-11-16) ----
await teste('O marut: a Pancada Infalível acerta sempre, e o Édito Flamejante fere 45 fixo antes do teste do atordoado', () => {
  const { enc, herois, foes, texto } = montar([['marut', { x: 6, y: 5 }]]);
  const m = foes[0];
  herois[0].hp = herois[0].maxHp = 900;
  d20s(enc, [1, 1, 1]);
  enc.resolveAttack(m, herois[0], { weaponId: 'Pancada Infalível' });
  assert.equal(900 - herois[0].hp, 60, texto());
  vezDosMonstros(enc);
  herois[0].hp = 900;
  herois[0].abilities.wis = 30;
  d20s(enc, [20]);
  assert.ok(enc.usarAcaoEspecial(m, m.acoesEspeciais.find((x) => x.nome === 'Édito Flamejante'), herois[0].pos), texto());
  assert.equal(900 - herois[0].hp, 45, 'passou, e o dano entra igual');
  assert.ok(!m.acoesEspeciais.some((x) => /Justificar/.test(x.nome)), 'o Justificar leva a luta para Sigil: só texto');
});

await teste('A ação que só põe uma condição não mira quem já a tem (o titivilus não enfeitiça de novo o enfeitiçado)', () => {
  const { enc, herois, foes } = montar([['titivilus', { x: 9, y: 5 }]]);
  const t = foes[0];
  const a = t.acoesEspeciais.find((x) => x.condition === 'enfeiticado');
  assert.ok(Livro.alvoServe(enc, t, a, herois[0]));
  addCondition(herois[0], 'enfeiticado', { rounds: 10, source: t.id });
  assert.ok(!Livro.alvoServe(enc, t, a, herois[0]));
});

// --------------------------------------------------------------------------- as magias de uma ação (2026-11-16) ----
await teste('As magias que só se narrariam saem da fila do bestiário; a Forma Etérea do monstro é a fuga para o etéreo', () => {
  const fila = ['mm', 'vgm', 'mtf', 'bgg', 'ftd', 'ai'].flatMap((l) => JSON.parse(fs.readFileSync(new URL(`./bestiario/${l}-pendente.json`, import.meta.url), 'utf8')));
  const magias = new Set(fila.flatMap((p) => p.magias ?? []));
  for (const n of ['stone shape', 'move earth', 'control water', 'project image', 'programmed illusion', 'etherealness', 'fast friends', 'gift of gab', "jim's magic missile"]) {
    assert.ok(!magias.has(n), `${n} ainda na fila`);
  }
  const phb = JSON.parse(fs.readFileSync(new URL('./magias/phb-pendente.json', import.meta.url), 'utf8'));
  assert.ok(phb.filter((p) => /^só se narraria/.test(p.motivo)).length >= 8, 'a fila das magias diz quais se narrariam');
  assert.ok(MONSTERS.zuggtmoy.acoesEspeciais.some((x) => x.tipo === 'etereo'));
  // (o Míssil Mágico do Jim era o de sempre; desde 2026-11-16 é o dele, com a jogada de ataque de cada dardo)
  assert.ok(MONSTERS.jimDarkmagic.spellcasting.prepared.includes('missilMagicoDeJim'), 'o Míssil Mágico do Jim é o dele');
  const { enc, foes, texto } = montar([['nagpa', { x: 6, y: 5 }]]);
  vezDosMonstros(enc);
  assert.ok(enc.usarAcaoEspecial(foes[0], foes[0].acoesEspeciais.find((x) => x.tipo === 'etereo'), null));
  assert.ok(foes[0].naoSeguraALuta && /some da luta/.test(texto()), texto());
});

await teste('A fila encolheu: nenhuma das mecânicas desta leva segue pendente', () => {
  const fila = ['vgm', 'mtf', 'bgg', 'ftd', 'ai'].flatMap((l) => JSON.parse(fs.readFileSync(new URL(`./bestiario/${l}-pendente.json`, import.meta.url), 'utf8')));
  const nomes = new Set(fila.flatMap((p) => [p.traco, p.acao, p.reacao, p.bonus].filter(Boolean)));
  const lendariasQueFaltam = new Set(fila.flatMap((p) => p.lendarias ?? []));
  for (const n of ['Break Concentration', 'Psychic Pulse', 'Sever Psychic Link', 'Shatter Concentration', 'Boiling Aura', 'Creeping Death', 'Summon Undead', 'Feed', 'Exert Will', 'Retract', 'Revitalize', 'Dance, My Puppet', 'Screaming Gale', 'One with the Storm']) {
    assert.ok(!lendariasQueFaltam.has(n), `${n} ainda na fila das lendárias`);
  }
  for (const n of ['Fey Step', 'Second Wind', 'Indomitable', 'Aversion to Fire', 'Arcane Ward', 'Poisonous Skin', 'Shell Defense', 'Martial Fury', 'Taunt', 'Awakening of the Scion',
    // a terceira leva
    'Mind Fangs', 'Death Fangs', "Poison's Disciple", "Imix's Blessing", "Sseth's Blessing", 'Soul Thirst', "Ilneval's Command", 'Call to Attack',
    'Battlefield Cunning', 'Battle Command', 'Lightning Strike', 'Thunderous Strike', 'Fiery Strikes', 'Freezing Strikes', 'Smother',
    'Burden of Time', 'Infernal Despair', 'Blurred Movement', 'Blurred Form', 'Defensive Advantage', 'Lightning Blood', 'Fire Blood', 'Poison Splash',
    'Rancid Degeneration', 'Aura of Annihilation', 'Rotting Presence', 'Weight of Ages', 'Master of the Grave', 'Thorny Body', 'Survivor',
    'Flammable Blood', 'Six Heads', 'Nurtured One of Yurtrus', 'War Magic', 'Sudden Rush', 'Healing Touch', 'Explosive Bolt', 'Mud to Stone',
    'Thunderous Honk', 'Darkness', 'Shadow Blend', 'Invisibility Field', 'Fade Away', 'Shared Invisibility', 'Fallible Invisibility', 'Rally the Troops', 'Infernal Command', 'Incite Fanaticism', "Lolth's Fickle Favor", 'Phalanx Formation', 'Watery Advantage', 'Thrives on Company', 'Slayer', 'Cunning Opportunist', 'Psychic Engine', 'Intercept Attack', 'Guided Strike', "War God's Blessing", 'Loyal Bodyguard', 'Protective Thrall', 'Bend Space', 'Vengeful Strike', 'Explosive Retribution', 'Veil of Shargaas', 'Creeping Darkness', 'Deflect Missile', 'Deflect Missiles', 'Uncanny Dodge', 'Bloody Rampage',
    'Noxious Wound', 'Fearful Voice', 'Negate Spell', 'Weakening Gaze', 'Sapping Presence', 'Voice of the Kraken', 'Song of Domination', 'Tempest Call',
    // a quarta leva
    'Reversal of Fortune', 'Rapid Adaptation', 'Blizzard Escape', 'Protective Link', 'Disarming Words', 'Feed on Weakness', 'Burning Fury',
    "Archer's Eye", 'Kicking Retreat', 'Sculpt Spells', 'Army Arcana',
    // a quinta leva
    'Shock Susceptibility', 'Partial Freeze', 'Rising Anger', 'Life Hunger', 'Grim Harvest', 'Life Eater', 'Aberrant Quickness',
    'Reactive Heads', 'Unyielding', 'Divine Eminence',
    // a sexta leva
    'Tightening Embrace', 'Feed', 'Psychic Mirror', "Dark One's Own Luck", 'Scouring Instruction', "Vaprak's Rage", 'Sunlight Banishment',
    'Fire Banishment', 'Outsize Strength',
    // a sétima leva
    'Sticky Leg', 'Foster Peace', 'Instinctive Charm', 'Dreadful', 'Shadow Step', 'Corrupted Vengeance', 'Shape Theft', 'Create Soulblade',
    // a oitava leva
    'Sticky Mud', 'Contamination', 'Undertow', 'Deadly Reach', 'Crawling Stance', 'Tongue',
    // a nona leva
    'Heart of the Dragon', 'Arcane Advantage', "Dreamwalker's Charm", 'Petrifying Touch', 'Windjavelin', 'Ironbound Pursuit',
    // a décima leva
    'Prismatic Breath', 'Prismatic Rays', 'Life Leech', 'Flurry of Claws', 'Raise Ghoul', 'Cavalry Training',
    // a décima primeira leva
    'Soul-Stealing Gaze', 'Corrupted Healing', 'Call to Honor', 'Headfirst Charge', 'Aura of Blood Thirst', 'Trail of Frost', 'Gorging Charge',
    // a décima segunda leva
    'Summon Specters', 'Summon Servant', 'Ice Wolves', 'Entombing Grasp', 'Command Hair', 'Absorbent Fleece', 'Block the Path', 'Blood Drain',
    // a décima quarta leva
    'Earth-Shaking Movement', 'Rapid Movement', 'Charge', "Giant's Strikes", 'Furnace Armor', 'Reel In', 'Discordant Screams', 'Swallow', 'Fade Back',
    // a décima quinta leva
    'Shroud of Souls', 'Incendiary Smoke', 'Foment Madness', 'Return to Worms', 'Nilbogism', 'Bites', 'Piscine Anatomy',
    // a décima sétima leva
    'Adhesive Filament', 'Stinging Dust', 'Bringer of Plagues', 'Absorb Attack',
    // a décima oitava leva
    'Weapon Invention', 'Dimensional Lock', 'Demonic Shadows', 'Lightning Form', 'Spectral Duplicate',
    // a décima nona leva
    'Mouth of Madness', 'Flail Tentacles', 'Shield Charge', 'Mind Control Spores',
    // a vigésima leva
    'Portent', 'Sorcery Points', 'Scale Dust', 'Power of the Dragon Queen',
    // a vigésima primeira leva
    'Harvest the Dead', 'Corpses', 'Reduce', 'Kiss', 'Death Curse',
    // a vigésima segunda leva
    'Imprison Soul', 'Psychic Link', 'Sense Thoughts', 'Duplicitous Movement', 'Stone Spikes',
    // a vigésima terceira leva
    'Champion Challenge', 'Wild Shape', 'Minor Conjuration', 'Infestation Spores',
    // a vigésima quarta leva
    'Engine of Pain', 'Possess Corpse', 'Reconstruction', 'Sacred Animation', 'Inhabit Object', 'Rend', 'Infused Strikes',
    // a vigésima sexta leva: as últimas mecânicas
    'Echo Spell', 'Spell Mimicry', 'Vengeful Storm', 'Tidal Wave', 'Boggle Oil']) {
    assert.ok(!nomes.has(n), `${n} ainda na fila`);
  }
  assert.ok(MONSTERS.eladrinDoOutono);
});

// ---------------------------------------------------------------- as seis magias que a fila ainda cobrava (2026-11-16)
const { SPELLS } = await import(P + 'rules/spells.js');
const { ARESTA } = await import(P + 'core/grid.js');
const { portasDaCasa, opcoesDePorta } = await import(P + 'game/portas.js');
const { concedidasDe } = await import(P + 'rules/magias-concedidas.js');
const { fontesDeLuz } = await import(P + 'rules/luz.js');
const { passivePerception } = await import(P + 'rules/abilities.js');
/** O mago do 11º com as seis prontas e espaço em todo círculo, num campo desenhado à mão. */
function comMago(linhas, { pos = { x: 2, y: 2 }, foes = [] } = {}) {
  const w = linhas[0].length;
  const field = new Battlefield(w, linhas.length, linhas);
  const mago = criarPersonagem({ id: `h-mago-${Math.random()}`, name: 'Ilvan', raca: 'humano', abilities: { str: 8, dex: 14, con: 14, int: 18, wis: 12, cha: 10 }, skills: ['arcanismo'] }, { classe: 'mago', nivel: 11 });
  mago.spellcasting.prepared.push('criarPassagem', 'trancaArcana', 'portalArcano', 'caminharEmArvores', 'moedaBrilhanteDeJim', 'incitarCobica');
  mago.spellcasting.slots = [0, 4, 3, 3, 3, 2, 1];
  mago.pos = { ...pos, f: 1 };
  const fs = foes.map(([id, p]) => makeMonster(id, p));
  const log = [];
  const enc = new Encounter({ battlefield: field, party: [mago], foes: fs, rng: makeRng(5), onLog: (e) => log.push(e) });
  enc.firstSide = 'party'; enc.round = 1; enc.beginSide('party');
  return { enc, mago, foes: fs, field, texto: () => log.map((l) => `${l.text} ${l.detail ?? ''}`).join('\n') };
}

await teste('Criar Passagem: a parede de aresta e a rocha atrás dela viram passagem, até 6 m de pedra, e o passo atravessa', () => {
  const { enc, mago, field } = comMago([
    '..........',
    '..........',
    '...##.....',
    '..........',
  ], { pos: { x: 1, y: 2 } });
  // a aresta de parede entre (2,2) e (3,2), e duas casas de rocha (3,2) e (4,2) logo atrás dela
  field.porAresta(2, 2, 3, 2, ARESTA.parede);
  assert.ok(!field.passa(2, 2, 3, 2), 'a aresta barrava');
  const s = SPELLS.criarPassagem;
  assert.equal(s.kind, 'livro'); assert.equal(s.level, 5);
  assert.equal(enc.canCast(mago, 'criarPassagem', { point: { x: 8, y: 0 } }).ok, false, 'longe da parede não sai');
  const r = enc.castSpell(mago, 'criarPassagem', { point: { x: 2, y: 2 } });
  assert.ok(r.ok, r.why);
  assert.ok(field.passa(2, 2, 3, 2), 'a aresta abriu');
  assert.ok(!field.blocksMove(3, 2) && !field.blocksMove(4, 2), 'a rocha virou chão');
  assert.ok(field.hasLineOfSight({ x: 1, y: 2 }, { x: 7, y: 2 }), 'a vista passa pela passagem');
  // mirando a própria rocha também vale; a árvore e o móvel não são parede
  const b = comMago(['......', '..#...', '......'], { pos: { x: 0, y: 1 } });
  assert.ok(b.enc.castSpell(b.mago, 'criarPassagem', { point: { x: 2, y: 1 } }).ok);
  assert.ok(!b.field.blocksMove(2, 1));
  const c = comMago(['......', '..T...', '..o...'], { pos: { x: 0, y: 1 } });
  assert.equal(c.enc.canCast(c.mago, 'criarPassagem', { point: { x: 2, y: 1 } }).ok, false, 'a árvore não abre');
  assert.equal(c.enc.canCast(c.mago, 'criarPassagem', { point: { x: 2, y: 2 } }).ok, false, 'o caixote não abre');
});

await teste('Tranca Arcana: a porta fechada fica trancada com a CD 10 acima; o lado de quem conjurou abre normalmente, o outro não', () => {
  const { enc, mago, field } = comMago(['......', '......', '......'], { pos: { x: 2, y: 1 } });
  field.porAresta(2, 1, 3, 1, ARESTA.porta);
  assert.equal(enc.canCast(mago, 'trancaArcana', { point: { x: 0, y: 0 } }).ok, false, 'sem porta ao alcance');
  const r = enc.castSpell(mago, 'trancaArcana', { point: { x: 2, y: 1 } });
  assert.ok(r.ok, r.why);
  const t = portasDaCasa(field, { x: 2, y: 1 })[0].tranca;
  assert.ok(t?.arcana && t.cd === 25 && t.semFechadura, JSON.stringify(t));
  // a porta que já tinha fechadura de CD 15 sobe para 25, e o arrombar para 30
  const b = comMago(['......', '......'], { pos: { x: 2, y: 1 } });
  b.field.porAresta(2, 1, 3, 1, ARESTA.porta);
  b.field.trancas = new Map([['3,1,O', { cd: 15 }]]);
  assert.ok(b.enc.castSpell(b.mago, 'trancaArcana', { point: { x: 2, y: 1 } }).ok);
  assert.deepEqual([b.field.trancas.get('3,1,O').cd, b.field.trancas.get('3,1,O').forca], [25, 30]);
  assert.equal(b.enc.canCast(b.mago, 'trancaArcana', { point: { x: 2, y: 1 } }).ok, false, 'não tranca duas vezes');
  // o menu da porta: o grupo abre de graça; quem é do outro lado não tem a fechadura para abrir
  const app = { enc };
  const ops = opcoesDePorta(app, mago, { x: 2, y: 1 });
  assert.ok(ops.some((o) => o.rotulo === 'Abrir a porta' && /Tranca Arcana/.test(o.detalhe) && !o.motivo), JSON.stringify(ops.map((o) => o.rotulo)));
  const intruso = { ...mago, side: 'foes', id: 'x' };
  const deles = opcoesDePorta(app, intruso, { x: 2, y: 1 });
  assert.ok(!deles.some((o) => o.rotulo === 'Abrir a porta'));
  assert.match(deles.find((o) => o.rotulo === 'Abrir a fechadura').motivo ?? '', /não tem fechadura/);
});

await teste('Portal Arcano: dois anéis ligados; quem pisa num sai pelo outro, e a concentração que cai fecha os dois', () => {
  const { enc, mago, field } = comMago(Array(12).fill('.'.repeat(30)), { pos: { x: 2, y: 5 } });
  const r = enc.castSpell(mago, 'portalArcano', { point: { x: 25, y: 5 } });
  assert.ok(r.ok, r.why);
  assert.equal(field.regioes.filter((x) => x.portalArcano).length, 2);
  const perto = enc.portais[0].casas[0];
  assert.ok(distanceFt(perto, mago.pos) <= 10, 'o primeiro anel fica a até 3 m');
  // a luz do anel acende a penumbra (é o que o tabuleiro desenha)
  assert.ok(fontesDeLuz(enc).some((f) => f.pos.x === 25 && f.pos.y === 5));
  // o mago anda para o anel de perto e sai do outro lado
  const reach = enc.reachableFor(mago);
  enc.moveAlong(mago, Battlefield.pathFrom(reach, reach.get(`${perto.x},${perto.y}`)));
  assert.ok(distanceFt(mago.pos, { x: 25, y: 5 }) <= 5, `parou em ${mago.pos.x},${mago.pos.y}`);
  enc.dropConcentration(mago);
  assert.equal(field.regioes.filter((x) => x.portalArcano).length, 0, 'os anéis se fecharam');
  assert.equal(enc.portais.length, 0);
});

await teste('Caminhar em Árvores: a travessia de árvore em árvore, uma vez por rodada, com o deslocamento', () => {
  const { enc, mago } = comMago([
    '..............................',
    '.T..........................T.',
    '..............................',
  ], { pos: { x: 2, y: 1 } });
  assert.ok(enc.castSpell(mago, 'caminharEmArvores', {}).ok);
  assert.ok(hasCondition(mago, 'caminhandoEmArvores'));
  assert.ok(concedidasDe(mago).includes('atravessarArvore'));
  assert.equal(enc.canCast(mago, 'atravessarArvore', { point: { x: 15, y: 1 } }).ok, false, 'longe de árvore não sai');
  const r = enc.castSpell(mago, 'atravessarArvore', { point: { x: 27, y: 1 } });
  assert.ok(r.ok, r.why);
  assert.deepEqual([mago.pos.x, mago.pos.y], [27, 1]);
  assert.equal(mago.movementLeftFt, 20, 'gastou 3 m de deslocamento');
  assert.match(enc.canCast(mago, 'atravessarArvore', { point: { x: 2, y: 1 } }).why ?? '', /uma travessia por rodada/);
  enc.dropConcentration(mago);
  assert.ok(!concedidasDe(mago).includes('atravessarArvore'));
});

await teste('A Moeda Brilhante de Jim acende onde cai e distrai: desvantagem em Percepção e a passiva 5 abaixo', () => {
  const { enc, mago, foes } = comMago(Array(12).fill('.'.repeat(20)), { pos: { x: 2, y: 5 }, foes: [['goblin', { x: 12, y: 5 }], ['goblin', { x: 13, y: 6 }]] });
  const passivaAntes = passivePerception(foes[0]);
  d20s(enc, [1, 1]);
  const r = enc.castSpell(mago, 'moedaBrilhanteDeJim', { point: { x: 12, y: 6 } });
  assert.ok(r.ok, r.why);
  assert.ok(foes.every((g) => hasCondition(g, 'distraidoPelaMoeda')));
  assert.equal(passivePerception(foes[0]), passivaAntes - 5);
  assert.ok(fontesDeLuz(enc).some((f) => f.pos.x === 12 && f.pos.y === 6 && f.claro === 20), 'a moeda acende');
  enc.round += 11;
  assert.ok(!fontesDeLuz(enc).some((f) => f.spellId === 'moedaBrilhanteDeJim'), 'a luz apaga com a magia');
});

await teste('Incitar Cobiça: quem falha só anda até a gema; o golpe do lado de quem conjurou quebra o encanto', () => {
  const { enc, mago, foes, texto } = comMago(Array(12).fill('.'.repeat(20)), { pos: { x: 2, y: 5 }, foes: [['goblin', { x: 6, y: 5 }], ['goblin', { x: 7, y: 7 }]] });
  d20s(enc, [1, 1]);
  const r = enc.castSpell(mago, 'incitarCobica', {});
  assert.ok(r.ok, r.why);
  assert.ok(foes.every((g) => hasCondition(g, 'cobicaIncitada')), texto());
  assert.equal(mago.concentrating?.spellId, 'incitarCobica');
  vezDosMonstros(enc);
  d20s(enc, [1, 1, 1, 1]);
  const hpAntes = mago.hp;
  for (const g of foes) takeMonsterTurn(enc, g);
  assert.equal(mago.hp, hpAntes, 'ninguém atacou');
  assert.ok(foes.every((g) => distanceFt(g.pos, mago.pos) <= 5), foes.map((g) => `${g.pos.x},${g.pos.y}`).join(' '));
  enc.applyDamage(foes[0], 1, 'cortante', mago);
  assert.ok(!hasCondition(foes[0], 'cobicaIncitada'), 'o golpe quebrou o encanto');
  assert.ok(hasCondition(foes[1], 'cobicaIncitada'));
});

await teste('A fila do bestiário não cobra mais magia nenhuma; o Jim Darkmagic conjura a moeda e a cobiça', () => {
  for (const l of ['mm', 'vgm', 'mtf', 'ftd', 'bgg', 'ai']) {
    const f = JSON.parse(fs.readFileSync(new URL(`./bestiario/${l}-pendente.json`, import.meta.url), 'utf8'));
    const lista = Array.isArray(f) ? f : Object.values(f).flat();
    assert.equal(lista.length, 0, `${l}: ${JSON.stringify(lista).slice(0, 200)}`);
  }
  const jim = makeMonster('jimDarkmagic', { x: 1, y: 1 });
  const dele = [...(jim.spellcasting?.prepared ?? []), ...Object.keys(jim.spellcasting?.porDia ?? {})];
  assert.ok(dele.includes('moedaBrilhanteDeJim') && dele.includes('incitarCobica'), JSON.stringify(jim.spellcasting));
});

console.log(`\n${total - falhas}/${total} testes da fila dos bestiários passaram.`);
if (falhas) process.exit(1);
