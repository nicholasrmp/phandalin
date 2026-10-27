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
import { visaoNoEscuro, nivelDeLuz } from '../rules/luz.js';
import { hasCondition } from '../rules/conditions.js';
import { skillBonus, passivePerception } from '../rules/abilities.js';
import { makeRng } from '../core/rng.js';
import { takeMonsterTurn } from '../rules/ai.js';
import { mapaDo, buildFoes } from '../game/encounter.js';
import { criarBuscas } from '../game/buscas.js';
import { criarPersonagem } from '../rules/progressao.js';
import { subirUmNivel } from '../game/nivel.js';
import { MAPA_ESCONDERIJO } from '../game/esconderijo.js';
import { MAPA_ARVORE_TROVAO, ARVORE_TROVAO } from '../game/arvoretrovao.js';

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

// (O parapeito do fosso saiu com a planta de 30 x 20: o corredor tem 2 de largura e o fosso ocupa as duas fileiras; a travessia é a
// Acrobacia ou o salto. As medidas da mansão moram em `testes-sala.mjs`.)

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

teste('a luz do mapa para na parede', () => {
  // Medido nos mapas reais: sem esta regra, 91 casas escuras do castelo e 117
  // da mansão acendiam através de pedra maciça.
  const m = mapaDo('mansao');
  const f = new Battlefield(m.terreno[0].length, m.terreno.length, m.terreno, m.altura, m.objetos, m.paredes);
  f.luz = new Uint8Array(f.w * f.h);
  m.luz.forEach((linha, y) => { for (let x = 0; x < f.w; x++) f.luz[y * f.w + x] = Number(linha[x] ?? 0); });
  const fontes = (m.luzes ?? []).map((l) => ({ ...l }));
  assert.ok(fontes.length >= 4, 'a mansão tem braseiros');
  let vazou = 0;
  for (let y = 0; y < f.h; y++) {
    for (let x = 0; x < f.w; x++) {
      if (f.blocksMove(x, y) || f.luz[y * f.w + x] > 0) continue;
      if (nivelDeLuz(f, x, y, fontes) > 0) vazou += 1;
    }
  }
  assert.equal(vazou, 0, `${vazou} casas escuras da mansão acenderam através da rocha`);
});

teste('uma tentativa por herói em cada ponto, e o registro sobrevive', () => {
  const registro = {};
  const b = criarBuscas(registro);
  const [dara, pip] = makeParty({ nivel: 2 });
  const porta = { x: 7, y: 3 };
  assert.equal(b.ja(dara, 'escuta', porta), null);
  b.marcar(dara, 'escuta', porta);
  assert.ok(b.ja(dara, 'escuta', porta), 'o mesmo herói não tenta duas vezes');
  assert.equal(b.ja(pip, 'escuta', porta), null, 'outro herói tem outros ouvidos');
  assert.equal(b.ja(dara, 'escuta', { x: 9, y: 3 }), null, 'outra porta é outro ponto');
  assert.equal(b.ja(dara, 'espia', porta), null, 'escutar e espiar são tentativas diferentes');
  // Precisa ser JSON puro: as cenas guardam isto em `app.campanha`.
  assert.deepEqual(JSON.parse(JSON.stringify(registro)), registro);
  b.limpar('escuta');
  assert.equal(b.ja(dara, 'escuta', porta), null, 'limpar devolve o ponto');
});

// ---- os defeitos de motor que a fase 4 revelou ---------------------------

teste('Tenacidade Mortoviva: o zumbi fica de pé com 1 PV, menos no radiante', () => {
  const mapa = Array.from({ length: 12 }, () => '.'.repeat(12));
  const deUmLance = (tipo, semente) => {
    const party = makeParty({ nivel: 3 }).slice(0, 1);
    party[0].pos = { x: 1, y: 1 };
    const z = makeMonster('zumbi', { x: 5, y: 5 });
    z.hp = 3;
    const enc = new Encounter({ battlefield: new Battlefield(12, 12, mapa), party, foes: [z], rng: makeRng(semente) });
    enc.applyDamage(z, 4, tipo);
    return z;
  };
  // CD 5 + 4 = 9, Constituição +3: passa em 75% dos lances.
  let vivos = 0;
  for (let i = 0; i < 200; i += 1) if (deUmLance('cortante', i).hp === 1) vivos += 1;
  assert.ok(vivos > 120 && vivos < 180, `sobreviveu ${vivos} de 200, esperado perto de 150`);
  for (let i = 0; i < 20; i += 1) assert.equal(deUmLance('radiante', i).dead, true, 'radiante não deixa levantar');
});

teste('o monstro de corpo a corpo fecha a distância em vez de arremessar', () => {
  const mapa = Array.from({ length: 30 }, () => '.'.repeat(30));
  const turno = (id, casas) => {
    const party = makeParty({ nivel: 3 });
    party.forEach((c, i) => { c.pos = { x: 2 + i, y: 2 }; });
    const m = makeMonster(id, { x: 2, y: 2 + casas });
    const enc = new Encounter({ battlefield: new Battlefield(30, 30, mapa), party, foes: [m], rng: makeRng(7) });
    enc.start();
    enc.side = 'foes';
    Object.assign(m, { acted: false, actionUsed: false, movementLeftFt: enc.speedOf(m) });
    const antes = { ...m.pos };
    takeMonsterTurn(enc, m);
    return Math.max(Math.abs(antes.x - m.pos.x), Math.abs(antes.y - m.pos.y));
  };
  // A azagaia do bugbear alcança 120 pés: a 60 ele tem de andar, não atirar.
  assert.ok(turno('bugbear', 12) > 0, 'o bugbear ficou parado jogando azagaia');
  assert.ok(turno('ogro', 12) > 0, 'o ogro ficou parado jogando azagaia');
  // Quem é atirador de verdade, ou está em alcance normal, continua atirando.
  assert.equal(turno('goblinArqueiro', 12), 0, 'o arqueiro não devia sair do lugar');
});

teste('o monstro contorna a quina em vez de travar na parede de borda', () => {
  // Parede no norte E no oeste de (2,2): (1,1) fica na diagonal, sem contato.
  const linhas = Array.from({ length: 6 }, () => '.'.repeat(6));
  const quina = ['......', '......', '..#...', '......', '......', '......'];
  const f = new Battlefield(6, 6, linhas, null, null, { n: quina, o: quina });
  assert.equal(f.contato({ x: 1, y: 1 }, { x: 2, y: 2 }), false, 'a quina corta o contato');
  const party = makeParty({ nivel: 3 }).slice(0, 1);
  party[0].pos = { x: 1, y: 1 };
  const m = makeMonster('hobgoblin', { x: 2, y: 2 });
  const enc = new Encounter({ battlefield: f, party, foes: [m], rng: makeRng(3) });
  enc.start();
  enc.side = 'foes';
  Object.assign(m, { acted: false, actionUsed: false, movementLeftFt: enc.speedOf(m) });
  takeMonsterTurn(enc, m);
  assert.ok(m.pos.x !== 2 || m.pos.y !== 2, 'ficou parado na quina');
  assert.equal(m.actionUsed, true, 'contornou mas não atacou');
});

teste('o Gundren não morre do dano de área do próprio grupo', () => {
  // O capítulo inteiro é resgatá-lo, e ele fica deitado ao lado do Grol.
  // `refem` faz um NPC a 0 PV cair desacordado em vez de morrer.
  const mapa = Array.from({ length: 12 }, () => '.'.repeat(12));
  const party = makeParty({ nivel: 5 }).slice(0, 1);
  party[0].pos = { x: 1, y: 1 };
  const anao = makeNpc('gundren', { x: 5, y: 5 }, {});
  Object.assign(anao, { side: 'neutro', hp: 0, stable: true, preso: true, refem: true, attacks: [] });
  const enc = new Encounter({ battlefield: new Battlefield(12, 12, mapa), party, foes: [anao], rng: makeRng(1) });
  enc.applyDamage(anao, 24, 'fogo');
  assert.equal(anao.dead, false);
  assert.equal(hasCondition(anao, 'inconsciente'), true);
});

// ---- as sobras da fase 4 --------------------------------------------------

teste('os blocos da fase 4 batem com o SRD nos números que estavam tortos', () => {
  const dop = makeMonster('doppelganger', { x: 0, y: 0 });
  assert.equal(skillBonus(dop, 'enganacao'), 6, 'Enganação em dobro, como no SRD');
  const gr = makeMonster('grick', { x: 0, y: 0 });
  assert.equal(skillBonus(gr, 'furtividade'), 2, 'o grick do SRD não tem perícia');
  assert.equal(passivePerception(gr), 12);
  for (const [id, dado] of [['orc', '2d8+6'], ['ogro', '7d10+21'], ['zumbi', '3d8+9']]) {
    assert.equal(MONSTERS[id].hpDice, dado);
    assert.equal(Math.floor(averageOf(dado)), MONSTERS[id].maxHp, `${id}: ${dado} não dá ${MONSTERS[id].maxHp}`);
  }
});

teste('Sentidos Aguçados somam 5 na passiva de quem os tem', () => {
  // Vantagem em passiva são +5. Sem isto o traço era só texto, e o blurb do
  // lobo prometia que "Furtividade não esconde o grupo dela".
  const lobo = makeMonster('lobo', { x: 0, y: 0 });
  assert.ok(lobo.traits.includes('keenHearingSmell'));
  assert.equal(passivePerception(lobo), 18);
  assert.equal(passivePerception(makeMonster('corujaUrso', { x: 0, y: 0 })), 18);
  // Quem não tem o traço continua como estava.
  assert.equal(passivePerception(makeMonster('goblin', { x: 0, y: 0 })), 9);
});

teste('o Rei Grol não se diz do SRD: tem 45 PV e machado cortante', () => {
  assert.equal(MONSTERS.reiGrol.fonte, 'propria');
  assert.equal(MONSTERS.bugbear.fonte, 'SRD');
  assert.notEqual(MONSTERS.reiGrol.maxHp, MONSTERS.bugbear.maxHp);
  assert.equal(MONSTERS.reiGrol.hpDice, undefined, '45 PV não fecham com dado nenhum');
});

teste('o Cume não desenha chão que ninguém alcança', () => {
  const m = mapaDo('cume');
  const f = new Battlefield(m.terreno[0].length, m.terreno.length, m.terreno, m.altura, m.objetos, m.paredes);
  const vistas = new Set();
  const fila = [[25, 18]];
  while (fila.length) {
    const [x, y] = fila.pop();
    const k = `${x},${y}`;
    if (vistas.has(k) || x < 0 || y < 0 || x >= f.w || y >= f.h || f.blocksMove(x, y)) continue;
    vistas.add(k);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= f.w || ny >= f.h || f.stepBlocked(x, y, nx, ny)) continue;
      // A parede de BORDA: o passo não cruza aresta. É a pergunta do motor
      // (`passa`), e não uma lista nossa de casas.
      if (!f.passa(x, y, nx, ny)) continue;
      // Regra de quina, como em `reachable`: o `stepBlocked` não a tem.
      if (dx !== 0 && dy !== 0 && f.blocksMove(x + dx, y) && f.blocksMove(x, y + dy)) continue;
      fila.push([nx, ny]);
    }
  }
  let chao = 0;
  for (let y = 0; y < f.h; y += 1) for (let x = 0; x < f.w; x += 1) if (!f.blocksMove(x, y)) chao += 1;
  assert.equal(chao, vistas.size, `${chao - vistas.size} casas de chão fora de alcance`);
});

// ------------------------------------------------- Árvore Trovão ----

const campoDeArvoreTrovao = () => {
  const m = MAPA_ARVORE_TROVAO;
  return new Battlefield(m.terreno[0].length, m.terreno.length, m.terreno, m.altura, null, m.paredes);
};

const alcancaveisDe = (f, inicio) => {
  const vistas = new Set();
  const fila = [inicio];
  while (fila.length) {
    const [x, y] = fila.pop();
    const k = `${x},${y}`;
    if (vistas.has(k) || x < 0 || y < 0 || x >= f.w || y >= f.h || f.blocksMove(x, y)) continue;
    vistas.add(k);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= f.w || ny >= f.h || f.stepBlocked(x, y, nx, ny)) continue;
      // A parede de BORDA: o passo não cruza aresta. É a pergunta do motor
      // (`passa`), e não uma lista nossa de casas.
      if (!f.passa(x, y, nx, ny)) continue;
      // REGRA DE QUINA, como `reachable` faz (`core/grid.js`: "Não corta quina
      // entre duas paredes"). O `stepBlocked` NÃO a tem — só mede o degrau —,
      // e sem ela esta busca achava casas que o jogador não alcança: duas
      // casas de cinza cercadas de mata passaram por aqui e pelo selo do
      // gerador, as duas com a mesma cegueira.
      if (dx !== 0 && dy !== 0 && f.blocksMove(x + dx, y) && f.blocksMove(x, y + dy)) continue;
      fila.push([nx, ny]);
    }
  }
  return vistas;
};

teste('Árvore Trovão não desenha chão que ninguém alcança', () => {
  const f = campoDeArvoreTrovao();
  const vistas = alcancaveisDe(f, [ARVORE_TROVAO.chegada.x, ARVORE_TROVAO.chegada.y]);
  let chao = 0;
  for (let y = 0; y < f.h; y += 1) for (let x = 0; x < f.w; x += 1) if (!f.blocksMove(x, y)) chao += 1;
  assert.equal(chao, vistas.size, `${chao - vistas.size} casas de chão fora de alcance`);
});

teste('cada criatura de Árvore Trovão nasce em casa livre e alcançável', () => {
  const f = campoDeArvoreTrovao();
  const vistas = alcancaveisDe(f, [ARVORE_TROVAO.chegada.x, ARVORE_TROVAO.chegada.y]);
  // OS POSTOS VÊM DO MAPA. Esta lista já esteve escrita aqui, à mão, com um
  // comentário dizendo que eram "as mesmas casas que a cena usa" — e eram, até
  // o dia em que o mapa mudou de tamanho. Aí passaram a existir TRÊS cópias da
  // mesma lista: a do gerador, a da cena e esta. O teste então comparava a sua
  // cópia com o mapa novo e acusava casas que a cena nem usava mais, enquanto
  // as casas que ela de fato usava ninguém conferia.
  //
  // Lendo do mapa, o teste volta a perguntar o que importa: TODO bando que o
  // jogo vai pôr no tabuleiro nasce em chão livre, alcançável, e com as quatro
  // casas que um Grande precisa.
  const DE_CADA = {
    // Os bandos do livro, nas quantidades dele: zumbis das cinzas 4 / 2 / 5 (áreas
    // 3, 8, 11) e ramos secos 2 / 6 / 8 / 6 (áreas 1, 2, 5, 12).
    zumbis: Array(5).fill('zumbiDasCinzas'),
    zumbisCavalo: Array(4).fill('zumbiDasCinzas'),
    zumbisFerraria: Array(2).fill('zumbiDasCinzas'),
    ramos1: Array(2).fill('galhoInfectado'),
    ramos2: Array(6).fill('galhoInfectado'),
    ramos5: Array(8).fill('galhoInfectado'),
    ramos12: Array(6).fill('galhoInfectado'),
    aranhas: ['aranhaGigante', 'aranhaGigante'],
    culto: Array(6).fill('cultista'),
    dragao: ['dragaoVerdeJovem'],
  };
  const postos = [];
  for (const [bando, ids] of Object.entries(DE_CADA)) {
    const vagas = ARVORE_TROVAO.ninhos[bando] ?? [];
    assert.equal(vagas.length, ids.length,
      `o mapa dá ${vagas.length} vaga(s) para "${bando}" e a cena põe ${ids.length} criatura(s)`);
    vagas.forEach((p, i) => postos.push([ids[i], [p.x, p.y]]));
  }
  for (const [id, [x, y]] of postos) {
    assert.ok(!f.blocksMove(x, y), `${id} nasce em casa bloqueada (${x},${y})`);
    assert.ok(vistas.has(`${x},${y}`), `${id} nasce onde não se chega (${x},${y})`);
    // As criaturas Grandes ocupam 2 x 2: as quatro casas têm de estar livres.
    const m = MONSTERS[id];
    if (m.size === 'grande' || m.tamanho === 'grande') {
      for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
        assert.ok(!f.blocksMove(x + dx, y + dy),
          `${id} é Grande e (${x + dx},${y + dy}) não está livre`);
      }
    }
  }
});

teste('cada bando do livro nasce DENTRO do prédio que o livro lhe dá, ou na franja dele', () => {
  const dentroDe = (id) => new Set(ARVORE_TROVAO.celulas[id].map((c) => `${c.x},${c.y}`));
  const cada = (chave, ids) => {
    const cels = ids.map(dentroDe);
    for (const p of ARVORE_TROVAO.ninhos[chave]) {
      assert.ok(cels.some((s) => s.has(`${p.x},${p.y}`)), `${chave} nasce fora de ${ids.join('/')}: (${p.x},${p.y})`);
    }
  };
  cada('zumbis', ['guarda']);
  cada('zumbisCavalo', ['estalagem']);
  cada('zumbisFerraria', ['ferraria']);
  cada('culto', ['casa9']);
  cada('ramos1', ['casa7']);
  cada('ramos2', ['fazenda', 'celeiro']);
  // O mato (áreas 5 e 12) nasce na franja de fora, não dentro da casa: o livro os
  // põe "no mato a leste" e "nos arbustos ao sul".
  const z5 = ARVORE_TROVAO.zonas.matoLeste;
  for (const p of ARVORE_TROVAO.ninhos.ramos5) {
    assert.ok(p.x >= z5.x0 && p.x <= z5.x1 && p.y >= z5.y0 && p.y <= z5.y1, `ramos5 fora do mato leste (${p.x},${p.y})`);
  }
  const z12 = ARVORE_TROVAO.zonas.tecelagemSul;
  for (const p of ARVORE_TROVAO.ninhos.ramos12) {
    assert.ok(p.x >= z12.x0 && p.x <= z12.x1 && p.y >= z12.y0 && p.y <= z12.y1, `ramos12 fora dos arbustos do tecelão (${p.x},${p.y})`);
  }
});

teste('os dois objetos escondidos (baú da cabana, caixa da herborista) têm casa de piso livre e não dividem com bando', () => {
  const f = campoDeArvoreTrovao();
  const O = ARVORE_TROVAO.objetos;
  const ocupadas = new Set(Object.values(ARVORE_TROVAO.ninhos).flat().map((p) => `${p.x},${p.y}`));
  const noPredio = (pos, id) => ARVORE_TROVAO.celulas[id].some((c) => c.x === pos.x && c.y === pos.y);
  assert.ok(noPredio(O.bauMercador, 'casa7'), 'o baú do comerciante fica na cabana ocidental');
  assert.ok(noPredio(O.caixaMirna, 'ervas'), 'a caixa da Mirna fica na loja do herborista');
  for (const pos of [O.bauMercador, O.caixaMirna]) {
    assert.ok(!f.blocksMove(pos.x, pos.y), `casa escondida bloqueada (${pos.x},${pos.y})`);
    assert.ok(!ocupadas.has(`${pos.x},${pos.y}`), `um bando nasce em cima do objeto escondido (${pos.x},${pos.y})`);
  }
  // O cofre dos cultistas é o ÚNICO baú desenhado: a cena abre qualquer `bau` pela coordenada.
  const baus = [];
  for (let y = 0; y < f.h; y += 1) for (let x = 0; x < f.w; x += 1) if (f.surfaceAt(x, y) === 'bau') baus.push(`${x},${y}`);
  assert.deepEqual(baus, [`${O.bauCulto.x},${O.bauCulto.y}`], 'só o cofre dos cultistas está desenhado no começo');
  assert.ok(noPredio(O.bauCulto, 'casa9'), 'o cofre fica na casa de esquina, com os cultistas');
});

teste('o grupo de Árvore Trovão nasce em casa livre, alcançável, e longe da saída', () => {
  const f = campoDeArvoreTrovao();
  const vistas = alcancaveisDe(f, [ARVORE_TROVAO.chegada.x, ARVORE_TROVAO.chegada.y]);
  // `encounter.js` já teve estas casas escritas à mão, na escala do mapa
  // antigo: quando o mapa cresceu, o grupo passou a nascer dentro de uma casa.
  assert.equal(ARVORE_TROVAO.grupo.length, 4, 'a cena espera quatro heróis');
  for (const p of ARVORE_TROVAO.grupo) {
    assert.ok(!f.blocksMove(p.x, p.y), `um herói nasce em casa bloqueada (${p.x},${p.y})`);
    assert.ok(vistas.has(`${p.x},${p.y}`), `um herói nasce onde não se chega (${p.x},${p.y})`);
    assert.ok(!ARVORE_TROVAO.saida.some((s) => s.x === p.x && s.y === p.y),
      `um herói nasce em cima da saída (${p.x},${p.y})`);
  }
});

teste('a torre só se vê pela porta, e a porta cabe o dragão', () => {
  const f = campoDeArvoreTrovao();
  const { torre, portaDaTorre: porta } = ARVORE_TROVAO;
  const salao = ARVORE_TROVAO.celulas.torre;
  assert.ok(salao.length >= 20, `a torre tem ${salao.length} casa(s) de salão`);
  const dentro = new Set(salao.map((c) => `${c.x},${c.y}`));
  // A PAREDE É DE BORDA (castelo): a torre fecha a vista pelas arestas, e o vão
  // é uma aresta aberta. O teste pergunta ao MOTOR (`passa`, `hasLineOfSight`)
  // e não a uma lista de casas: foi a lista de casas de parede que ficou velha
  // quando a parede deixou de ser casa.
  //
  // O FUNDO É A CASA DO SALÃO MAIS LONGE DA PORTA: de fora, por qualquer lado
  // que não seja o vão, não pode ser visto.
  const longe = (p) => (p.x - porta.x) ** 2 + (p.y - porta.y) ** 2;
  const fundo = salao.reduce((a, b) => (longe(b) > longe(a) ? b : a));
  const fora = [
    { x: torre.x0 - 2, y: fundo.y }, { x: torre.x1 + 2, y: fundo.y },
    { x: fundo.x, y: torre.y0 - 2 }, { x: torre.x1 + 2, y: torre.y0 - 2 },
  ];
  for (const p of fora) {
    if (!f.inside(p.x, p.y)) continue;
    assert.ok(!f.hasLineOfSight(p, fundo),
      `de (${p.x},${p.y}) dá para ver o fundo da torre sem passar pela porta`);
  }
  // O vão: as arestas da borda da torre que o motor deixa passar. Duas, lado a
  // lado, porque o bicho é Grande e sai por ele se quiser.
  const vaos = [];
  for (const c of salao) {
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const v = { x: c.x + dx, y: c.y + dy };
      if (dentro.has(`${v.x},${v.y}`)) continue;
      if (f.passa(c.x, c.y, v.x, v.y)) vaos.push({ de: c, para: v });
    }
  }
  // A torre tem DUAS saídas: a porta de fora (duas casas, onde o dragão passa) e
  // a porta interna para o Salão do Prefeito, na parede que os dois dividem —
  // como na referência. A de fora é a que o teste mede.
  const noSalao = new Set(ARVORE_TROVAO.celulas.prefeito.map((c) => `${c.x},${c.y}`));
  const deFora = vaos.filter((v) => !noSalao.has(`${v.para.x},${v.para.y}`));
  const paraOSalao = vaos.filter((v) => noSalao.has(`${v.para.x},${v.para.y}`));
  assert.equal(paraOSalao.length, 1, `a porta interna da torre para o Salão tem ${paraOSalao.length} aresta(s)`);
  assert.equal(deFora.length, 2, `a torre tem ${deFora.length} vão(s) para fora, e o dragão precisa de 2`);
  assert.ok(deFora.some((v) => v.para.x === porta.x && v.para.y === porta.y),
    'a porta publicada não é um dos vãos da torre');
  const [a, b] = deFora;
  assert.ok(Math.abs(a.para.x - b.para.x) + Math.abs(a.para.y - b.para.y) === 1,
    'os dois vãos da torre não são vizinhos');
});

teste('o dragão (Grande, 2 x 2) sai da torre pela porta e alcança a rua', () => {
  const f = campoDeArvoreTrovao();
  const salao = new Set(ARVORE_TROVAO.celulas.torre.map((c) => `${c.x},${c.y}`));
  const cabe = (x, y) => [0, 1].every((j) => [0, 1].every((i) => f.inside(x + i, y + j) && !f.blocksMove(x + i, y + j)));
  const ini = ARVORE_TROVAO.ninhos.dragao[0];
  // 5000 pés: a pergunta é se HÁ caminho, não quanto custa. A porta de duas
  // casas deixava passar, mas a mata a uma casa dela fechava o pátio: o
  // dragão alcançava 13 âncoras, todas dentro, e a luta do cume virava uma
  // torre de tiro fixa. O teste anterior só olhava as arestas da porta.
  const alcance = f.reachable({ x: ini.x, y: ini.y }, 5000, () => false, cabe, 2);
  let fora = 0;
  for (const n of alcance.values()) if (![0, 1].some((j) => [0, 1].some((i) => salao.has(`${n.x + i},${n.y + j}`)))) fora += 1;
  // Antes da correção eram 0, e depois do pátio da porta eram 22, numa bolsa
  // fechada por três árvores: o dragão seguia sendo uma torre de tiro. Agora o
  // gerador abre, pelo menor número de casas de mata, um caminho de 2 x 2 da
  // chegada até a porta da torre, e o dragão alcança a vila inteira.
  assert.ok(fora >= 1000, `o dragão alcança só ${fora} âncora(s) fora da torre (o mínimo é 1000)`);
  // E a rede de Grande que PARTE DA CHEGADA toca a porta da torre: é o que
  // garante que quem foge dele pela vila é perseguido.
  const rede = f.reachable({ x: ARVORE_TROVAO.chegada.x, y: ARVORE_TROVAO.chegada.y }, 5000, () => false, cabe, 2);
  const p = ARVORE_TROVAO.portaDaTorre;
  assert.ok([...rede.keys()].some((k) => { const [x, y] = k.split(',').map(Number); return Math.abs(x - p.x) <= 1 && Math.abs(y - p.y) <= 1; }),
    'um 2 x 2 que sai da chegada não alcança a porta da torre');
});

teste('toda construção admite uma criatura Grande no pátio da porta', () => {
  const f = campoDeArvoreTrovao();
  const cabe = (x, y) => [0, 1].every((j) => [0, 1].every((i) => f.inside(x + i, y + j) && !f.blocksMove(x + i, y + j)));
  // O avental da porta (3 de fundo, 4 de largura) existe para isto: 9 das 22
  // construções tinham o pátio da porta vedado a Grande.
  const semPatio = [];
  for (const [id, cs] of Object.entries(ARVORE_TROVAO.celulas)) {
    const dentro = new Set(cs.map((c) => `${c.x},${c.y}`));
    let achou = false;
    for (const c of cs) {
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const v = { x: c.x + dx, y: c.y + dy };
        if (dentro.has(`${v.x},${v.y}`) || !f.passa(c.x, c.y, v.x, v.y)) continue;
        for (let ax = v.x - 1; ax <= v.x + 1; ax += 1) {
          for (let ay = v.y - 1; ay <= v.y + 1; ay += 1) {
            if (cabe(ax, ay) && ![0, 1].some((j) => [0, 1].some((i) => dentro.has(`${ax + i},${ay + j}`)))) achou = true;
          }
        }
      }
    }
    if (!achou) semPatio.push(id);
  }
  assert.deepEqual(semPatio, [], `sem pátio para Grande na porta: ${semPatio.join(', ')}`);
});

console.log(`\n${total - falhas}/${total} passaram`);
if (falhas) process.exit(1);
