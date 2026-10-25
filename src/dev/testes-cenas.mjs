// Testes de FUMAÇA das cenas da campanha. Rode com:
//   node src/dev/testes-cenas.mjs
//
// `testes-regras.mjs` cobre o motor; nada cobria as cenas, e foi por isso que
// cinco defeitos de capítulo chegaram vivos à revisão: a tocha que sumia do
// menu, o saque que apagava a mochila, o resgate que não via prata, o refém que
// morria de um sopro e o canil que virava luta antes de dar escolha.
//
// As cenas (`game/capitulo*.js`) importam CSS e não carregam em Node. Então
// aqui se testa o que elas dependem e que dá para carregar: o elenco e o mapa
// (`game/encounter.js`), as regras que elas chamam, e as PROPRIEDADES de
// geometria em que os gatilhos se apoiam. Se o mapa ou o elenco mudar de um
// jeito que quebre um gatilho, cai aqui.

import assert from 'node:assert/strict';
import { Encounter } from '../rules/combat.js';
import { makeParty } from '../rules/party.js';
import { makeNpc } from '../rules/npcs.js';
import { makeMonster, MONSTERS } from '../rules/monsters.js';
import { averageOf } from '../core/dice.js';
import { garantirInventario } from '../rules/equipment.js';
import { guardar, totalEmCobre, cobrar } from '../game/comercio.js';
import { Battlefield, distanceFt } from '../core/grid.js';
import { visaoNoEscuro } from '../rules/luz.js';
import { hasCondition } from '../rules/conditions.js';
import { skillBonus } from '../rules/abilities.js';
import { makeRng } from '../core/rng.js';
import { mapaDo, buildFoes } from '../game/encounter.js';
import { criarPersonagem } from '../rules/progressao.js';
import { subirUmNivel } from '../game/nivel.js';
import { MAPA_ESCONDERIJO } from '../game/esconderijo.js';

let total = 0;
let falhas = 0;
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

const campo = () => {
  const m = mapaDo('esconderijo');
  return new Battlefield(m.terreno[0].length, m.terreno.length, m.terreno, m.altura, m.objetos, m.paredes);
};
const bando = () => buildFoes('esconderijo');
const andaveis = (f) => {
  const fora = new Set();
  const fila = [[14, 16]];
  while (fila.length) {
    const [x, y] = fila.pop();
    const k = `${x},${y}`;
    if (fora.has(k) || x < 0 || y < 0 || x >= f.w || y >= f.h || f.blocksMove(x, y)) continue;
    fora.add(k);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) fila.push([x + dx, y + dy]);
  }
  return fora;
};

// ---- a mochila preguiçosa --------------------------------------------------

teste('guardar um saque NÃO apaga o que o herói já carregava', () => {
  const [dara] = makeParty({ nivel: 2 });
  assert.equal(dara.bag, undefined, 'a mochila deve nascer preguiçosa; se isso mudar, o teste perde o sentido');
  guardar(dara, 'denteDeOuro', 3);
  const ids = garantirInventario(dara).bag.map((i) => i.id);
  for (const id of ['pocaoDeCura', 'tocha', 'racoes', 'cantil', 'moedaDeOuro', 'denteDeOuro']) {
    assert.ok(ids.includes(id), `${id} sumiu da mochila depois do saque`);
  }
});

teste('o herói pronto tem tocha e ração desde o começo, sem abrir a ficha', () => {
  for (const c of makeParty({ nivel: 2 })) {
    const bag = garantirInventario(c).bag;
    assert.ok(bag.find((i) => i.id === 'tocha')?.qtd >= 1, `${c.name} sem tocha`);
    assert.ok(bag.find((i) => i.id === 'racoes')?.qtd >= 1, `${c.name} sem ração`);
  }
});

teste('dois dos quatro heróis prontos PRECISAM de tocha (é o que a cena promete)', () => {
  const cegos = makeParty({ nivel: 2 }).filter((c) => !visaoNoEscuro(c));
  assert.equal(cegos.length, 2);
});

teste('o dinheiro do grupo conta prata e cobre, não só ouro', () => {
  const grupo = makeParty({ nivel: 2 });
  guardar(grupo[0], 'moedaDeCobre', 600);
  guardar(grupo[0], 'moedaDePrata', 110);
  const emPo = Math.floor(totalEmCobre(grupo) / 100);
  const soOuro = grupo.reduce((s, h) => s + (garantirInventario(h).bag.find((i) => i.id === 'moedaDeOuro')?.qtd ?? 0), 0);
  assert.ok(emPo > soOuro, 'o baú de Klarg tem de contar para o resgate do Yeemik');
  assert.ok(cobrar(grupo, 50 * 100), 'o grupo devia conseguir pagar as 50 po do resgate');
});

// ---- o refém ---------------------------------------------------------------

teste('refém a 0 PV cai desacordado, não morto', () => {
  const mapa = Array.from({ length: 12 }, () => '.'.repeat(12));
  const party = makeParty({ nivel: 2 }).slice(0, 1);
  party[0].pos = { x: 1, y: 1 };
  const sildar = makeNpc('sildar', { x: 5, y: 5 }, { side: 'neutro' });
  sildar.hp = 1;
  sildar.refem = true;
  const enc = new Encounter({ battlefield: new Battlefield(12, 12, mapa), party, foes: [sildar], rng: makeRng(1) });
  enc.applyDamage(sildar, 6, 'fogo');
  assert.equal(sildar.dead, false);
  assert.equal(hasCondition(sildar, 'inconsciente'), true);
  assert.equal(sildar.stable, true);
});

teste('NPC comum continua morrendo a 0 PV (o refém é a exceção, não a regra)', () => {
  const mapa = Array.from({ length: 12 }, () => '.'.repeat(12));
  const party = makeParty({ nivel: 2 }).slice(0, 1);
  party[0].pos = { x: 1, y: 1 };
  const npc = makeNpc('sildar', { x: 5, y: 5 }, { side: 'neutro' });
  npc.hp = 1;
  const enc = new Encounter({ battlefield: new Battlefield(12, 12, mapa), party, foes: [npc], rng: makeRng(1) });
  enc.applyDamage(npc, 6, 'fogo');
  assert.equal(npc.dead, true);
});

// ---- o esconderijo: elenco e mapa ------------------------------------------

teste('o esconderijo não tem casa de chão isolada', () => {
  const f = campo();
  let chao = 0;
  for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) if (!f.blocksMove(x, y)) chao += 1;
  assert.equal(andaveis(f).size, chao, 'há casa de chão que não se alcança da boca da caverna');
});

teste('toda criatura do esconderijo nasce em casa livre e alcançável', () => {
  const f = campo();
  const fora = andaveis(f);
  for (const c of bando()) {
    assert.ok(!f.blocksMove(c.pos.x, c.pos.y), `${c.name} nasce em casa bloqueada (${c.pos.x},${c.pos.y})`);
    assert.ok(fora.has(`${c.pos.x},${c.pos.y}`), `${c.name} nasce onde não se chega (${c.pos.x},${c.pos.y})`);
  }
});

teste('o túnel fica FORA do alcance da corrente dos lobos', () => {
  // É disso que depende o gatilho próprio do canil: passar pelo túnel não pode
  // acender a briga, senão "Acalmar os lobos" volta a ser letra morta.
  const f = campo();
  const corrente = { x: 23, y: 12, raioFt: 10 };
  for (let y = 5; y <= 17; y++) {
    for (let x = 13; x <= 19; x++) {
      if (f.blocksMove(x, y)) continue;
      assert.ok(distanceFt(corrente, { x, y }) > corrente.raioFt + 5,
        `a casa do túnel (${x},${y}) está dentro do alcance da corrente`);
    }
  }
});

teste('os lobos acorrentados não alcançam os degraus da entrada', () => {
  const presos = bando().filter((c) => c.corrente);
  assert.equal(presos.length, 3);
  for (const l of presos) assert.deepEqual(l.corrente, { x: 23, y: 12, raioFt: 10 });
});

teste('não se vê o bando de Klarg do lado dos poços, só da soleira', () => {
  const f = campo();
  const chefe = bando().filter((c) => c.grupo === 'chefe');
  const veem = [];
  for (let y = 1; y <= 14; y++) {
    for (let x = 20; x <= 38; x++) {
      if (f.blocksMove(x, y)) continue;
      if (chefe.some((k) => f.hasLineOfSight({ x, y }, k.pos))) veem.push(`${x},${y}`);
    }
  }
  assert.ok(veem.length <= 5, `${veem.length} casas enxergam a caverna do chefe: ${veem.join(' ')}`);
});

teste('Klarg espera atrás da estalagmite, com cobertura da porta', () => {
  const f = campo();
  const klarg = bando().find((c) => c.defId === 'klarg' || /klarg/i.test(c.name));
  assert.ok(klarg, 'Klarg sumiu do elenco');
  for (const porta of [{ x: 30, y: 13 }, { x: 30, y: 14 }, { x: 31, y: 14 }, { x: 31, y: 15 }]) {
    assert.equal(f.coverBetween(porta, klarg.pos), 2,
      `sem cobertura de (${porta.x},${porta.y}): a cena narra que ele está atrás de uma estalagmite`);
  }
});

teste('a ponte está alta e o canal embaixo dela é baixo', () => {
  // A ponte é o cruzamento do anel com a passagem dos poços, 6 m acima da água:
  // quem está no canal não sobe nela, e é por isso que dá para cortar as cordas.
  for (const [x, y] of [[20, 5], [21, 5], [20, 6], [21, 6]]) {
    assert.equal(MAPA_ESCONDERIJO.terreno[y][x], '=');
    assert.equal(Number(MAPA_ESCONDERIJO.altura[y][x]), 4);
  }
  for (const [x, y] of [[19, 5], [19, 6]]) assert.equal(Number(MAPA_ESCONDERIJO.altura[y][x]), 0);
});

teste('o dique dos poços continua sendo entulho, onde a cena o procura', () => {
  for (let x = 32; x <= 37; x++) assert.equal(MAPA_ESCONDERIJO.terreno[4][x], 'x');
});

teste('a chaminé liga o canil à caverna do chefe pelas duas pontas', () => {
  assert.equal(MAPA_ESCONDERIJO.terreno[13][25], 'x');
  assert.equal(MAPA_ESCONDERIJO.terreno[16][28], 'x');
});

// ---- o elenco do esconderijo -----------------------------------------------

teste('o covil tem quatro goblins e Yeemik, e Sildar amarrado com 1 PV', () => {
  const covil = bando().filter((c) => c.grupo === 'covil');
  assert.equal(covil.filter((c) => c.defId === 'goblin').length, 4);
  const yeemik = covil.find((c) => c.defId === 'yeemik');
  assert.equal(yeemik.maxHp, 12);
  const sildar = covil.find((c) => c.npcId === 'sildar');
  assert.equal(sildar.hp, 1);
  assert.equal(sildar.refem, true);
  assert.equal(sildar.side, 'neutro');
});

teste('o goblin arqueiro esconde-se tão bem quanto o goblin do SRD', () => {
  const g = makeMonster('goblin', { x: 0, y: 0 });
  const a = makeMonster('goblinArqueiro', { x: 0, y: 0 });
  assert.equal(skillBonus(a, 'furtividade'), skillBonus(g, 'furtividade'));
  assert.ok(a.ac < g.ac, 'o arqueiro é o goblin sem escudo: só a CA muda');
});

teste('a visão no escuro dos goblinoides vem do bloco, não do nome', () => {
  for (const id of ['goblin', 'goblinArqueiro', 'goblinChefe', 'yeemik', 'klarg', 'bugbear', 'hobgoblin']) {
    assert.equal(MONSTERS[id].senses?.darkvisionFt, 60, `${id} sem senses.darkvisionFt`);
  }
  // E um nome inventado não ganha visão no escuro de brinde.
  const falso = { kind: 'monster', id: 'porcoDoMato', name: 'Porco do Mato' };
  assert.equal(visaoNoEscuro(falso), 0);
});

teste('os dados de vida dos goblinoides batem com os PV do bloco', () => {
  for (const id of ['goblin', 'goblinArqueiro', 'goblinChefe', 'hobgoblin', 'bugbear', 'klarg', 'yeemik', 'droop']) {
    const m = MONSTERS[id];
    assert.ok(m.hpDice, `${id} sem hpDice`);
    assert.equal(Math.floor(averageOf(m.hpDice)), m.maxHp, `${id}: ${m.hpDice} não dá ${m.maxHp}`);
  }
  // O Rei Grol fica de fora de propósito: 45 PV não fecham com dado nenhum.
  assert.equal(MONSTERS.reiGrol.hpDice, undefined);
});

teste('o goblin da ponte atira do que ele tem: arco, não azagaia', () => {
  const g = makeMonster('goblin', { x: 0, y: 0 });
  const distancia = g.attacks.filter((a) => a.ranged).map((a) => a.name);
  assert.deepEqual(distancia, ['Arco curto']);
});

teste('o bloco do Chefe Goblin está marcado como do Livro dos Monstros', () => {
  assert.equal(MONSTERS.goblinChefe.fonte, 'MM');
  assert.equal(MONSTERS.yeemik.fonte, 'MM');
});

// ---- a mansão (fase 3) ------------------------------------------------------

teste('subir de nível NÃO devolve espaço de magia gasto', () => {
  const base = { name: 'M', raca: 'humano', abilities: { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10 }, skills: ['arcanismo'] };
  const c = criarPersonagem(base, { classe: 'mago', nivel: 2 });
  assert.deepEqual(c.spellcasting.slots, c.spellcasting.slotsMax, 'recém-criado nasce cheio');
  c.spellcasting.slots = [0, 0, 0];
  c.resources.arcaneRecovery = 0;
  subirUmNivel(c);
  // Do 2º para o 3º o mago ganha 1 espaço de 1º e 2 de 2º. Só isso.
  assert.deepEqual(c.spellcasting.slots, [0, 1, 2]);
  assert.equal(c.resources.arcaneRecovery, 0, 'a carga gasta continua gasta');
});

teste('os NPCs indefesos da mansão não morrem de dano de área', () => {
  const neutros = buildFoes('mansao').filter((c) => c.side === 'neutro' && c.maxHp > 1);
  assert.ok(neutros.length >= 4, 'a família Dendrar e o Droop');
  for (const n of neutros) assert.equal(n.refem, true, `${n.name} sem refem`);
});

teste('o parapeito do fosso existe, e cruza o corredor', () => {
  const m = mapaDo('mansao');
  const f = new Battlefield(m.terreno[0].length, m.terreno.length, m.terreno, m.altura, m.objetos, m.paredes);
  for (const [x, y] of [[23, 11], [24, 11]]) assert.ok(!f.blocksMove(x, y), `o parapeito (${x},${y}) devia ser chão`);
  // E não pode virar atalho para o porão: a pilha de (24,12) fecha a descida.
  for (const [x, y] of [[22, 12], [23, 12], [24, 12]]) assert.ok(f.blocksMove(x, y), `(${x},${y}) devia ser cobertura`);
});

teste('o Marcarrubra é bloco nosso, com dados de vida que batem', () => {
  const d = MONSTERS.marcarrubra;
  assert.equal(d.fonte, 'propria');
  assert.equal(Math.floor(averageOf(d.hpDice)), d.maxHp);
});

teste('o Cajavidro não luta sozinho', () => {
  const g = buildFoes('mansao').filter((c) => c.grupo === 'cajavidro');
  assert.ok(g.length >= 3, `o quarto tem ${g.length} criatura(s): o chefe precisa de guarda-costas`);
});

teste('quem o guardião ignora não entra na lista de alvos dele', () => {
  const mapa = Array.from({ length: 12 }, () => '.'.repeat(12));
  const party = makeParty({ nivel: 2 });
  party.forEach((c, i) => { c.pos = { x: 1 + i, y: 1 }; });
  const esq = makeMonster('esqueleto', { x: 5, y: 5 });
  const enc = new Encounter({ battlefield: new Battlefield(12, 12, mapa), party, foes: [esq], rng: makeRng(1) });
  assert.equal(enc.enemiesOf(esq).length, party.length);
  party[0].mantoVermelho = true;
  esq.ignora = (h) => Boolean(h.mantoVermelho);
  const alvos = enc.enemiesOf(esq);
  assert.equal(alvos.length, party.length - 1);
  assert.ok(!alvos.includes(party[0]), 'quem veste o manto não é alvo');
});

console.log(`\n${total - falhas}/${total} passaram`);
if (falhas) process.exit(1);
