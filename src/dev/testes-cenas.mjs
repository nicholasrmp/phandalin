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
import { guardar, totalEmCobre, cobrar, LOJAS } from '../game/comercio.js';
import { Battlefield, distanceFt, ARESTA } from '../core/grid.js';
import { visaoNoEscuro, nivelDeLuz } from '../rules/luz.js';
import { hasCondition } from '../rules/conditions.js';
import { skillBonus, passivePerception } from '../rules/abilities.js';
import { makeRng } from '../core/rng.js';
import { takeMonsterTurn } from '../rules/ai.js';
import { mapaDo, buildFoes } from '../game/encounter.js';
import { criarBuscas } from '../game/buscas.js';
import { criarPersonagem } from '../rules/progressao.js';
import { subirUmNivel } from '../game/nivel.js';
import { MAPA_ESCONDERIJO, PONTOS_DO_ESCONDERIJO as PE } from '../game/esconderijo.js';
import { montarCampo } from '../game/campo.js';
import { existsSync } from 'node:fs';
import { CRIATURAS_COM_FICHA, fichaDe } from '../art/fichas-de-criatura.js';
import { MAPA_ARVORE_TROVAO, ARVORE_TROVAO } from '../game/arvoretrovao.js';
import { mudarExaustao, nivelDeExaustao } from '../rules/conditions.js';
import { podeMarchar } from '../rules/marcha.js';
import { descansoLongo } from '../rules/descanso.js';
import { despensaDoGrupo, diaDeViagem } from '../rules/mantimentos.js';
import { ENCONTROS, perigoDoBando, escalarBando } from '../rules/encontros-estrada.js';
import { MOMENTOS_POR_DIA, nomeDoMomento, deNoite, gastarHoras } from '../game/relogio.js';

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

// As invariantes abaixo são as da planta, e não números soltos: as casas vêm de `PONTOS_DO_ESCONDERIJO`, o mesmo
// lugar de onde o capítulo 2 as lê. A planta é a do battlemap da FA (`src/dev/mapa-esconderijo-fa.mjs`).
const salaDoEsconderijo = () => montarCampo(mapaDo('esconderijo'));
const casasDaSala = (f, nome) => [...f.sala].filter(([, n]) => n === nome).map(([c]) => c.split(',').map(Number))
  .filter(([x, y]) => !f.blocksMove(x, y));

teste('o túnel e os degraus do canil ficam FORA do alcance da corrente dos lobos', () => {
  // É disso que depende o gatilho próprio do canil: passar pelo túnel não pode
  // acender a briga, senão "Acalmar os lobos" volta a ser letra morta. E o livro: eles não alcançam os degraus.
  const f = salaDoEsconderijo();
  const degraus = casasDaSala(f, 'canil').filter(([x, y]) => f.heightAt(x, y) <= 1);
  assert.ok(degraus.length >= 2, 'o canil perdeu os degraus da entrada');
  for (const [x, y] of [...casasDaSala(f, 'passagem'), ...degraus]) {
    assert.ok(distanceFt(PE.corrente, { x, y }) > PE.corrente.raioFt + 5,
      `a casa (${x},${y}) está dentro do alcance da corrente`);
  }
});

teste('os lobos acorrentados são três, presos ao mesmo espeto', () => {
  const presos = bando().filter((c) => c.corrente);
  assert.equal(presos.length, 3);
  for (const l of presos) {
    assert.deepEqual(l.corrente, PE.corrente);
    assert.ok(distanceFt(l.pos, PE.corrente) <= PE.corrente.raioFt, `${l.name} nasce fora da corrente`);
  }
});

teste('não se vê o bando de Klarg do lado dos tanques', () => {
  // A luta de Klarg começa na SOLEIRA, não de dentro dos tanques: senão ver um goblin dele lá do fundo já abria a
  // caverna inteira — medido na primeira versão desta planta, um goblin em (24,15) se via da coluna x 24 toda.
  const f = salaDoEsconderijo();
  const chefe = bando().filter((c) => c.grupo === 'chefe');
  const veem = casasDaSala(f, 'pocos').filter(([x, y]) => chefe.some((k) => f.hasLineOfSight({ x, y }, k.pos)));
  assert.equal(veem.length, 0, `${veem.length} casas dos tanques enxergam o bando de Klarg: ${veem.map((p) => p.join(',')).join(' ')}`);
});

teste('toda criatura tem a ficha da galeria no disco, menos as que a galeria não tem', () => {
  // `art/fichas-de-criatura.js` diz quem tem ficha; `src/dev/baixar-fichas.py` as põe em `public/fichas`.
  const SEM_FICHA = new Set();   // a vassoura veio do 5etools: agora toda criatura tem
  for (const id of CRIATURAS_COM_FICHA) assert.ok(existsSync(`public/fichas/${id}.webp`), `falta public/fichas/${id}.webp`);
  const faltam = Object.keys(MONSTERS).filter((id) => !SEM_FICHA.has(id) && !CRIATURAS_COM_FICHA.includes(id));
  assert.deepEqual(faltam, [], `criatura sem ficha: ${faltam.join(', ')}`);
  // o herói e o morador com retrato próprio ficam com o retrato
  assert.equal(fichaDe({ side: 'party', defId: 'goblin' }), null);
  assert.equal(fichaDe({ side: 'neutro', defId: 'cavaleiro', npcId: 'sildar' }), null);
  assert.equal(fichaDe({ side: 'foes', defId: 'bugbear', npcId: 'klarg' }), '/fichas/klarg.webp');
  // Rose e Thorn são o mesmo bloco com nomes diferentes: o nome escolhe a ficha
  assert.equal(fichaDe({ side: 'foes', defId: 'fantasmaDeCrianca', name: 'Thorn' }), '/fichas/thorn.webp');
  assert.equal(fichaDe({ side: 'foes', defId: 'fantasmaDeCrianca', name: 'Rose' }), '/fichas/rose.webp');
});

teste('pela chaminé não se vê a caverna de Klarg: a fenda sobe nove metros', () => {
  // A FA desenha a fenda aberta (o Foundry não tem altura); com a visão pelo traço, do canil se via o bando de Klarg.
  // A rocha da chaminé é alta no mapa (`mapa-esconderijo-fa.mjs`, ROCHA_DA_CHAMINE) e corta a reta.
  const f = salaDoEsconderijo();
  const caverna = casasDaSala(f, 'chefe');
  for (const sala of ['canil', 'passagem']) {
    const veem = casasDaSala(f, sala).filter(([x, y]) => caverna.some(([a, b]) => f.hasLineOfSight({ x, y }, { x: a, y: b })));
    assert.equal(veem.length, 0, `do ${sala} se vê a caverna de Klarg: ${veem.map((p) => p.join(',')).join(' ')}`);
  }
});

teste('Klarg espera fora da vista de quem pisa na soleira', () => {
  // Medido: nesta caverna não há casa com meia cobertura da soleira — ou se vê tudo, ou nada. Então o "atrás de
  // uma estalagmite" que a cena narra é a casa que a soleira não enxerga, encostada na estalagmite desenhada.
  const f = salaDoEsconderijo();
  const klarg = bando().find((c) => c.defId === 'klarg');
  assert.ok(klarg, 'Klarg sumiu do elenco');
  const pocos = new Set(casasDaSala(f, 'pocos').map((p) => p.join(',')));
  const soleira = casasDaSala(f, 'chefe').filter(([x, y]) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => pocos.has(`${x + dx},${y + dy}`)));
  assert.ok(soleira.length >= 1, 'a caverna de Klarg perdeu a soleira');
  for (const [x, y] of soleira) assert.ok(!f.hasLineOfSight({ x, y }, klarg.pos), `da soleira (${x},${y}) se vê Klarg`);
  assert.ok(distanceFt(klarg.pos, PE.chamineTopo) >= 15, 'Klarg nasce colado na chaminé: fugiria sem gastar turno');
});

teste('a ponte está alta e o canal embaixo dela é baixo', () => {
  // A ponte é 6 m acima da água (livro, área 5): quem está no canal não sobe nela, e é por isso que dá para cortar
  // as cordas. O canal passa por baixo dela na diagonal, de (15,5) para (16,4).
  const f = salaDoEsconderijo();
  for (const p of PE.ponte) {
    assert.equal(MAPA_ESCONDERIJO.terreno[p.y][p.x], '=');
    assert.equal(f.heightAt(p.x, p.y), 4);
  }
  assert.equal(f.heightAt(PE.sobAPonte.x, PE.sobAPonte.y), 1, 'o canal sob a ponte saiu do nível 1');
  for (const p of PE.ponte) {
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const q = { x: p.x + dx, y: p.y + dy };
      if (f.blocksMove(q.x, q.y) || f.heightAt(q.x, q.y) > 2) continue;
      assert.ok(f.stepBlocked(p.x, p.y, q.x, q.y), `do canal (${q.x},${q.y}) se sobe na ponte (${p.x},${p.y})`);
    }
  }
});

teste('o dique dos tanques continua sendo entulho, onde a cena o procura', () => {
  const f = salaDoEsconderijo();
  for (const p of PE.dique) {
    assert.equal(MAPA_ESCONDERIJO.terreno[p.y][p.x], 'x');
    assert.equal(f.sala.get(`${p.x},${p.y}`), 'pocos');
  }
  for (const p of [...PE.poco1, ...PE.poco2]) assert.equal(MAPA_ESCONDERIJO.terreno[p.y][p.x], 'W');
});

teste('a chaminé liga o canil à caverna do chefe pelas duas pontas', () => {
  const f = salaDoEsconderijo();
  assert.equal(MAPA_ESCONDERIJO.terreno[PE.chamineBase.y][PE.chamineBase.x], 'x');
  assert.equal(MAPA_ESCONDERIJO.terreno[PE.chamineTopo.y][PE.chamineTopo.x], 'x');
  assert.equal(f.sala.get(`${PE.chamineBase.x},${PE.chamineBase.y}`), 'canil');
  assert.equal(f.sala.get(`${PE.chamineTopo.x},${PE.chamineTopo.y}`), 'chefe');
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

teste('o goblin atirador é o goblin do SRD: mesma CA 15 e mesma Furtividade, só a arma na mão muda', () => {
  const g = makeMonster('goblin', { x: 0, y: 0 });
  const a = makeMonster('goblin', { x: 0, y: 0 }, { tatica: 'atirador', arma: 'Arco curto' });
  assert.equal(skillBonus(a, 'furtividade'), skillBonus(g, 'furtividade'));
  assert.equal(a.ac, 15, 'o bloco do SRD não muda a CA com a arma');
  assert.equal(a.tatica, 'atirador');
  assert.equal(MONSTERS.goblinArqueiro, undefined, 'o arqueiro é o goblin: não há mais bloco próprio');
  assert.equal(MONSTERS.goblin.fonte, 'SRD');
});

teste('a visão no escuro dos goblinoides vem do bloco, não do nome', () => {
  for (const id of ['goblin', 'goblinChefe', 'yeemik', 'klarg', 'bugbear', 'hobgoblin']) {
    assert.equal(MONSTERS[id].senses?.darkvisionFt, 60, `${id} sem senses.darkvisionFt`);
  }
  // E um nome inventado não ganha visão no escuro de brinde.
  const falso = { kind: 'monster', id: 'porcoDoMato', name: 'Porco do Mato' };
  assert.equal(visaoNoEscuro(falso), 0);
});

teste('os dados de vida dos goblinoides batem com os PV do bloco', () => {
  for (const id of ['goblin', 'goblinChefe', 'hobgoblin', 'bugbear', 'klarg', 'yeemik', 'droop']) {
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
  // Medido nos mapas reais: sem esta regra, 91 casas escuras do castelo e 117 da mansão acendiam através de pedra
  // maciça — pondo braseiros nos cômodos da Mansão, o vigia da caverna passava a ser visto de 106 casas em vez de 1.
  //
  // A PROVA MUDOU. Ela dizia "casa que a grade põe no escuro não acende", e passava na mansão só porque as salas
  // nasciam CLARAS na grade: as onze luzes não acendiam nada, e apagar uma não mudava nada (medido: 9 das 11 com
  // efeito zero). Com as salas no breu, acender a sala É o trabalho da luz, e casa escura que acende deixou de ser
  // defeito. Por isso a prova agora é a INUNDAÇÃO, e não a reta: a luz só pode acender casa onde ela CHEGA andando
  // de casa em casa, perguntando a cada aresta `passa(..., 'luz')`. É uma conta diferente da que `nivelDeLuz` faz
  // (que traça a reta), então vale como prova: luz que atravessou pedra aparece aqui, e vale em toda cena com luz
  // de mapa, não só na mansão. A grade de cada uma continua sendo o piso — só o que passa dela é que se confere.
  for (const cena of ['mansao', 'castelo', 'esconderijo', 'ondaEco']) {
    const m = mapaDo(cena);
    if (!m?.luz || !(m.luzes ?? []).length) continue;
    const f = new Battlefield(m.terreno[0].length, m.terreno.length, m.terreno, m.altura, m.objetos, m.paredes);
    f.luz = new Uint8Array(f.w * f.h);
    m.luz.forEach((linha, y) => { for (let x = 0; x < f.w; x++) f.luz[y * f.w + x] = Number(linha[x] ?? 0); });
    const fontes = m.luzes.map((l) => ({ ...l }));
    // onde a luz CHEGA: inundação a partir de cada fonte, dentro do alcance dela e só por aresta que deixa a luz passar
    const alcance = new Set();
    for (const l of fontes) {
      const raio = l.claro + l.penumbra;
      const fila = [l.pos];
      const vistos = new Set([`${l.pos.x},${l.pos.y}`]);
      while (fila.length) {
        const p = fila.shift();
        alcance.add(`${p.x},${p.y}`);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
          const q = { x: p.x + dx, y: p.y + dy };
          if (q.x < 0 || q.y < 0 || q.x >= f.w || q.y >= f.h) continue;
          if (vistos.has(`${q.x},${q.y}`) || distanceFt(l.pos, q) > raio) continue;
          if (!f.passa(p.x, p.y, q.x, q.y, 'luz')) continue;
          vistos.add(`${q.x},${q.y}`);
          fila.push(q);
        }
      }
    }
    const vazou = [];
    for (let y = 0; y < f.h; y++) {
      for (let x = 0; x < f.w; x++) {
        if (nivelDeLuz(f, x, y, fontes) <= f.luz[y * f.w + x]) continue;
        if (!alcance.has(`${x},${y}`)) vazou.push(`${x},${y}`);
      }
    }
    assert.equal(vazou.length, 0, `${cena}: ${vazou.length} casas acenderam sem a luz chegar lá (${vazou.slice(0, 8).join(' ')})`);
  }
});

teste('a mansão nasce no breu, e cada tocha acende a sala dela', async () => {
  // O PONTO DA GRADE NO BREU: a luz do mapa tem de FAZER algo. Antes nove salas nasciam CLARAS na grade e a tocha
  // dentro delas era enfeite — medido apagando uma a uma, 9 das 11 não mudavam casa nenhuma, e o "Apagar a tocha"
  // do botão direito (`game/fogo.js`) era um botão sem consequência. Esta prova guarda as duas metades.
  const { MANSAO } = await import('../game/mansao.js');
  const m = mapaDo('mansao');
  assert.ok(!m.luz.some((linha) => linha.includes('2')), 'nenhuma casa da mansão nasce clara: quem acende é a luz');
  const f = new Battlefield(m.terreno[0].length, m.terreno.length, m.terreno, m.altura, m.objetos, m.paredes);
  f.luz = new Uint8Array(f.w * f.h);
  m.luz.forEach((linha, y) => { for (let x = 0; x < f.w; x++) f.luz[y * f.w + x] = Number(linha[x] ?? 0); });
  const todas = m.luzes.map((l) => ({ ...l }));
  assert.equal(todas.length, 11, 'as onze luzes da cena do Foundry');
  const grade = (fontes) => {
    const g = new Array(f.w * f.h);
    for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) g[y * f.w + x] = nivelDeLuz(f, x, y, fontes);
    return g;
  };
  const base = grade(todas);
  // Com as onze acesas, a sala que tem luz dentro fica ACESA: nenhuma casa dela no breu. A única exceção medida é
  // uma casa do porão (22,17), o canto da cisterna que as duas tochas do patamar não alcançam.
  for (const [nome, casas] of Object.entries(MANSAO.salas)) {
    if (!todas.some((l) => casas.some((c) => c.x === l.pos.x && c.y === l.pos.y))) continue;
    const escuras = casas.filter((c) => base[c.y * f.w + c.x] === 0).map((c) => `${c.x},${c.y}`);
    assert.ok(escuras.length <= 1, `${nome} tem tocha e ${escuras.length} casas no breu (${escuras.join(' ')})`);
  }
  // E apagar tem consequência. Quatro das onze não jogam casa no breu, e cada uma por um motivo medido: a fogueira
  // da cripta e a tocha do depósito de armas moram em salas que a grade ainda põe em PENUMBRA, então apagar as
  // deixa na penumbra; a vela da escrivaninha e a tocha do quarto do mago dividem cômodo e se cobrem uma à outra.
  const mudam = [];
  const aoBreu = [];
  for (const l of todas) {
    const semEla = grade(todas.filter((o) => o !== l));
    let caiu = 0;
    let breu = 0;
    for (let i = 0; i < base.length; i++) if (semEla[i] < base[i]) { caiu += 1; if (semEla[i] === 0) breu += 1; }
    if (caiu) mudam.push(`${l.tipo} ${l.pos.x},${l.pos.y}`);
    if (breu) aoBreu.push(`${l.tipo} ${l.pos.x},${l.pos.y}`);
  }
  assert.equal(mudam.length, 10, `só ${mudam.length} das 11 luzes mudam alguma casa ao apagar (${mudam.join(' | ')})`);
  assert.equal(aoBreu.length, 7, `só ${aoBreu.length} das 11 jogam casa no breu ao apagar (${aoBreu.join(' | ')})`);
});

teste('o que o mapa declara se pode usar: inimigo, luz, objeto e tranca', () => {
  // A varredura das dezoito cenas, do dia em que se perguntou "não passou nada sobre objeto interativo, luz,
  // inimigo e porta?". Quatro coisas baratas de conferir e caras de achar jogando:
  //   - inimigo nascendo em casa que o passo não admite (ele trava ali, e a luta não acaba);
  //   - dois inimigos na mesma casa (o segundo some debaixo do primeiro);
  //   - luz ou objeto interativo sem nenhuma casa vizinha de onde mexer nele — o menu pede 1,5 m;
  //   - tranca apontando para aresta que não é porta, ou sem CD (o menu de `game/portas.js` não teria o que rolar).
  // A CONECTIVIDADE do chão não entra aqui: quem a mede é `conferir-paredes.mjs`, que sabe o que o roteiro abre.
  const achados = [];
  for (const cena of ['emboscada', 'ermo', 'ermoNoite', 'rua', 'esconderijo', 'mansao', 'mansaoTunel',
    'poco', 'cume', 'castelo', 'arvoreTrovao', 'ondaEco',
    'casaDaMorte1', 'casaDaMorte2', 'casaDaMorte3', 'casaDaMorte4', 'casaDaMortePorao1', 'casaDaMortePorao2']) {
    const m = mapaDo(cena);
    const f = new Battlefield(m.terreno[0].length, m.terreno.length, m.terreno, m.altura, m.objetos, m.paredes);
    const aoLado = (p) => [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]
      .some(([dx, dy]) => f.inside(p.x + dx, p.y + dy) && !f.blocksMove(p.x + dx, p.y + dy)
        && f.passa(p.x + dx, p.y + dy, p.x, p.y, 'visao'));
    const ocupadas = new Map();
    for (const foe of buildFoes(cena) ?? []) {
      const p = foe.pos;
      if (!p || !f.inside(p.x, p.y)) { achados.push(`${cena}: ${foe.name} sem casa válida`); continue; }
      if (f.blocksMove(p.x, p.y)) achados.push(`${cena}: ${foe.name} nasce em casa bloqueada (${p.x},${p.y}, ${f.surfaceAt(p.x, p.y)})`);
      const k = `${p.x},${p.y}`;
      if (ocupadas.has(k)) achados.push(`${cena}: ${foe.name} e ${ocupadas.get(k)} nascem na mesma casa (${k})`);
      else ocupadas.set(k, foe.name);
    }
    for (const l of m.luzes ?? []) if (!aoLado(l.pos)) achados.push(`${cena}: ${l.tipo} em (${l.pos.x},${l.pos.y}) sem casa de onde apagar ou acender`);
    for (const o of m.interativos ?? []) {
      if (!f.inside(o.x, o.y)) achados.push(`${cena}: interativo ${o.id ?? ''} em (${o.x},${o.y}) fora do mapa`);
      else if (!aoLado(o)) achados.push(`${cena}: interativo ${o.id ?? '(sem id)'} em (${o.x},${o.y}) sem casa de onde mexer nele`);
    }
    for (const t of m.trancas ?? []) {
      const [tx, ty, lado] = String(t.aresta).split(',');
      const cod = (lado === 'N' ? f.paredeN : f.paredeO)[Number(ty) * f.w + Number(tx)];
      if (cod !== 2) achados.push(`${cena}: tranca em ${t.aresta} não está numa porta (aresta=${cod})`);
      if (t.cd == null) achados.push(`${cena}: tranca em ${t.aresta} sem CD`);
    }
  }
  assert.deepEqual(achados, [], achados.join(' | '));
});

teste('nenhuma luz de mapa é inerte: apagar qualquer uma muda alguma casa', () => {
  // O DEFEITO DA LUZ INERTE, achado na Mansão e depois medido em todas as cenas: uma chama dentro de um cômodo
  // que a GRADE já põe claro não acende nada. O desenho mostra fogo, a regra não vê diferença, e o "Apagar" do
  // botão direito (`game/fogo.js`) é um botão sem consequência. Pegou três mapas: a Mansão (9 de 11 inertes), a
  // Onda Eco (o braseiro do acampamento) e o Cume (a fogueira do bando, que a planta da FA deixou SEM luz
  // nenhuma, contra a decisão do próprio capítulo). A prova é a mesma conta que achou os três: apaga uma de cada
  // vez e conta o que cai. Mapa novo que nasça com sala clara e chama dentro cai aqui.
  const DESCULPAS = {
    // Cômodo pequeno com DUAS luzes: a de menor alcance não acrescenta nada à outra, e isso é física, não defeito.
    'mansao 8,2': 'a vela da escrivaninha, dentro do alcance da tocha do quarto do mago',
    'mansaoTunel 8,2': 'a vela da escrivaninha, dentro do alcance da tocha do quarto do mago',
    // As velas de 9 pés em cone do Castelo, que vieram da cena da FA. Medido uma a uma: acendem 4, 2 e 3 casas
    // sozinhas, e TODAS elas já estão cobertas por outra luz do mesmo cômodo. É vela em cima de mesa, ao lado do
    // fogo grande — some no brilho dele, como some no desenho.
    'castelo 27,4': 'vela de 9 pés dentro do alcance da luz grande do mesmo cômodo',
    'castelo 23,10': 'vela de 9 pés dentro do alcance da luz grande do mesmo cômodo',
    'castelo 21,11': 'vela de 9 pés dentro do alcance da luz grande do mesmo cômodo',
    'castelo 23,13': 'vela de 9 pés dentro do alcance da luz grande do mesmo cômodo',
  };
  const inertes = [];
  for (const cena of ['emboscada', 'ermo', 'ermoNoite', 'rua', 'esconderijo', 'mansao', 'mansaoTunel',
    'poco', 'cume', 'castelo', 'arvoreTrovao', 'ondaEco',
    'casaDaMorte1', 'casaDaMorte2', 'casaDaMorte3', 'casaDaMorte4', 'casaDaMortePorao1', 'casaDaMortePorao2']) {
    const m = mapaDo(cena);
    const luzes = (m?.luzes ?? []).map((l) => ({ ...l }));
    if (!luzes.length) continue;
    const f = new Battlefield(m.terreno[0].length, m.terreno.length, m.terreno, m.altura, m.objetos, m.paredes);
    f.luz = new Uint8Array(f.w * f.h);
    if (Array.isArray(m.luz)) m.luz.forEach((linha, y) => { for (let x = 0; x < f.w; x++) f.luz[y * f.w + x] = Number(linha[x] ?? 0); });
    else if (!m.luz) f.luz.fill(2);                 // cena sem grade é clara: a luz do mapa ali espera a noite
    const grade = (fontes) => {
      const g = new Array(f.w * f.h);
      for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) g[y * f.w + x] = nivelDeLuz(f, x, y, fontes);
      return g;
    };
    const base = grade(luzes);
    for (const l of luzes) {
      // A luz que SÓ ACENDE NO ESCURO (`soNoEscuro`) não acende nada enquanto a cena está clara, e isso é o
      // trabalho dela: é o lampião do pátio, que espera a noite. Inerte de dia não é defeito; seria defeito a
      // luz de dentro, no breu, não mudar nada.
      if (l.soNoEscuro && f.luz[l.pos.y * f.w + l.pos.x] === 2) continue;
      const sem = grade(luzes.filter((o) => o !== l));
      if (base.some((v, i) => sem[i] < v)) continue;
      const chave = `${cena} ${l.pos.x},${l.pos.y}`;
      if (!DESCULPAS[chave]) inertes.push(`${chave} (${l.tipo}, grade=${f.luz[l.pos.y * f.w + l.pos.x]})`);
    }
  }
  assert.deepEqual(inertes, [], `luz que não acende nada: ${inertes.join(' | ')}`);
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
  const turno = (id, casas, opcoes = {}) => {
    const party = makeParty({ nivel: 3 });
    party.forEach((c, i) => { c.pos = { x: 2 + i, y: 2 }; });
    const m = makeMonster(id, { x: 2, y: 2 + casas }, opcoes);
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
  assert.equal(turno('goblin', 12, { tatica: 'atirador', arma: 'Arco curto' }), 0, 'o arqueiro não devia sair do lugar');
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
  // de onde o grupo chega, e não de uma casa fixa: a planta mudou de 30x21 para 18x24 com o battlemap da FA
  const fila = [[m.grupo[0].x, m.grupo[0].y]];
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

// ---------------------------------------------------------- a estrada ----
// A fase da estrada (`game/regiao.js`) não carrega em Node: ela importa a
// pintura da região. Então aqui se testa o que ela depende, como no resto
// deste arquivo — e são justamente as premissas das correções da revisão.

teste('o relógio da vila conta momentos, e as horas entram por uma porta só', () => {
  assert.equal(MOMENTOS_POR_DIA, 6);
  assert.ok(!deNoite(5), 'o último momento do dia ainda é dia');
  assert.ok(deNoite(6), 'passado o último, é noite');
  assert.equal(nomeDoMomento(6), 'noite');

  // Duas horas gastam um momento, e qualquer coisa gasta pelo menos um.
  const vila = { dia: 1, tempo: 0 };
  gastarHoras(vila, 1);
  assert.equal(vila.tempo, 1);
  gastarHoras(vila, 4);
  assert.equal(vila.tempo, 3);

  // Era aqui que o Cume quebrava: ele somava HORAS no contador, então oito
  // horas de busca punham `tempo` em 8 e a vila ficava em noite permanente,
  // porque a volta do contador dele era em 24.
  const cume = { dia: 1, tempo: 0 };
  gastarHoras(cume, 8);
  assert.ok(cume.tempo <= MOMENTOS_POR_DIA, `oito horas puseram o relógio em ${cume.tempo}`);
  assert.equal(cume.dia, 1, 'gastar horas não vira o dia: isso é de dormir');

  // E não há como estourar: o relógio para na noite.
  for (let i = 0; i < 20; i += 1) gastarHoras(cume, 8);
  assert.equal(cume.tempo, MOMENTOS_POR_DIA);
});

teste('a exaustão tem saída na estrada: comer e dormir devolve o passo', () => {
  const [c] = makeParty({ nivel: 3 });
  mudarExaustao(c, 5);
  assert.equal(nivelDeExaustao(c), 5);
  assert.ok(!podeMarchar(c), 'no 5º degrau o deslocamento é 0: ninguém marcha');
  // É o que `acamparAqui` faz: um descanso longo com comida e bebida.
  descansoLongo(c, { alimentado: true });
  assert.equal(nivelDeExaustao(c), 4, 'o descanso longo tira um degrau');
  assert.ok(podeMarchar(c), 'e com isso o grupo volta a poder partir');
});

teste('sem comida o descanso não tira degrau — o acampar não é de graça', () => {
  const [c] = makeParty({ nivel: 3 });
  mudarExaustao(c, 5);
  descansoLongo(c, { alimentado: false });
  assert.equal(nivelDeExaustao(c), 5, 'o livro pede "alguma comida e bebida"');
});

// "Alguma comida e bebida" é do DIA; a fome e a sede são do acumulado. Era
// isso que estava embaralhado: o jogo oferece a meia ração como a escolha em
// destaque quando a comida aperta, e quem a aceitava parava de recuperar
// exaustão do segundo dia em diante — o contrário do que o código dizia fazer.
const alimentado = (c) => (c.comeuHoje ?? true) && (c.bebeuHoje ?? true);
const naEstrada = (racoes, litros) => {
  const [c] = makeParty({ nivel: 3 });
  c.bag = [{ id: 'racoes', tipo: 'item', qtd: racoes }, { id: 'cantil', tipo: 'item', qtd: 1, litros }];
  return c;
};

teste('meia ração todo dia NÃO impede a recuperação de exaustão', () => {
  const rng = makeRng(7);
  const c = naEstrada(30, 4);
  for (let dia = 1; dia <= 4; dia += 1) {
    c.bag.find((i) => i.id === 'cantil').litros = 4;
    diaDeViagem(rng, [c], { agua: true, meiaRacao: true });
    assert.ok(alimentado(c), `${dia}º dia de meia ração: o descanso devia contar`);
  }
  // E a fome acumulada continua correndo: meia ração é meio dia sem comer.
  assert.equal(c.diasSemComida, 2, 'quatro dias de meia ração são dois dias de fome');
});

teste('um gole conta como bebida, e a sede ainda cobra o degrau dela', () => {
  // Três dos quatro litros: o descanso conta, e o dia ainda é de água curta.
  // Quanto a sede cobra aí depende de um teste de CON 15, então não se mede o
  // degrau neste ramo — mede-se no de baixo, que é automático.
  const c = naEstrada(30, 3);
  diaDeViagem(makeRng(11), [c], {});
  assert.ok(alimentado(c), 'bebeu três dos quatro litros: o descanso conta');
  assert.ok(c.semAgua, 'e ainda assim o dia foi de água curta');

  // Menos da metade da água é degrau automático, sem teste. Um litro ainda é
  // "alguma bebida": o descanso conta E a sede cobra. Os dois ao mesmo tempo é
  // o ponto — antes, a água curta tirava as duas coisas.
  const seco = naEstrada(30, 1);
  const antes = nivelDeExaustao(seco);
  diaDeViagem(makeRng(13), [seco], {});
  assert.ok(alimentado(seco), 'um litro é alguma bebida');
  assert.ok(nivelDeExaustao(seco) > antes, 'e a sede cobrou o degrau dela');
});

teste('um dia inteiro sem nada continua travando o descanso', () => {
  const rng = makeRng(13);
  const semComida = naEstrada(0, 4);
  diaDeViagem(rng, [semComida], { agua: true });
  assert.ok(!alimentado(semComida), 'sem comer nada, o descanso não tira degrau');
  const semAgua = naEstrada(30, 0);
  diaDeViagem(rng, [semAgua], {});
  assert.ok(!alimentado(semAgua), 'sem beber nada, o descanso não tira degrau');
});

teste('a viagem mais longa é abastecível: a Barthen vende ração', () => {
  // Conyberry é a rota mais longa do mapa (114 km, quatro dias no passo
  // normal), e o grupo pronto sai de casa com comida para três. A diferença
  // existe de propósito — o painel da viagem diz quantas rações ela pede —,
  // mas só funciona porque há onde comprar. Se a prateleira da Barthen deixasse
  // de ter ração, Conyberry ficaria inalcançável sem forragear.
  const grupo = makeParty({ nivel: 3 });
  assert.equal(despensaDoGrupo(grupo).dias, 3, 'o grupo pronto leva três dias de comida');
  assert.ok(LOJAS.barthen.estoque().some((l) => l.id === 'racoes'),
    'a Barthen tem de vender ração, senão a estrada longa não se abastece');
});

// O que o SIMULADOR mediu na cena real da estrada, n=300 lutas por célula, com
// o grupo pronto de quatro heróis (`dev/balance.js` jogando os dois lados).
// `derrota` é a porcentagem de lutas em que o grupo foi derrotado — e derrota
// na estrada encerra a partida (`game/capitulo4-estrada.js`).
//
// Serve de oráculo: o rótulo que o jogo mostra ao jogador tem de concordar com
// o que a luta realmente faz. Era aqui que o rótulo antigo falhava.
// MEDIDO com a luz de verdade. A primeira versão desta tabela veio de um
// arranjo que deixava a grade de luz zerada — combate no breu —, e todos os
// números estavam errados.
const MEDIDO = [
  { nivel: 3, id: 'goblin', qtd: 9, derrota: 1.0 },
  { nivel: 3, id: 'hobgoblin', qtd: 6, derrota: 4.0 },
  { nivel: 3, id: 'orc', qtd: 5, derrota: 18.0 },
  { nivel: 3, id: 'lobo', qtd: 8, derrota: 11.7 },
  { nivel: 3, id: 'lobo', qtd: 9, derrota: 33.7 },
  { nivel: 3, id: 'ghoul', qtd: 5, derrota: 14.7 },
  { nivel: 4, id: 'orc', qtd: 6, derrota: 2.7 },
  { nivel: 4, id: 'orc', qtd: 8, derrota: 23.7 },
  { nivel: 4, id: 'orc', qtd: 9, derrota: 56.3 },
  { nivel: 4, id: 'hobgoblin', qtd: 8, derrota: 15.3 },
  { nivel: 4, id: 'hobgoblin', qtd: 9, derrota: 31.3 },
  { nivel: 4, id: 'lobo', qtd: 9, derrota: 11.7 },
  { nivel: 5, id: 'orc', qtd: 9, derrota: 0.0 },
  { nivel: 5, id: 'hobgoblin', qtd: 9, derrota: 0.0 },
];

teste('o rótulo de perigo concorda com o que o simulador mediu', () => {
  // Os cortes do jogo são 5% e 20% de derrota. Cem ou trezentas lutas não
  // medem isso com precisão de um ponto: numa célula de 4% o erro padrão já é
  // de um ponto, e as duas rodadas de medição discordaram em 6 hobgoblins no
  // 3º nível (4% com n=300, 5% com n=100). Então uma célula a menos de dois
  // pontos de um corte aceita os dois rótulos vizinhos — o teste cobra onde a
  // medição é firme, que é onde o rótulo antigo errava feio.
  const FOLGA = 2;
  const faixa = (d) => (d >= 20 ? 'mortal' : d >= 5 ? 'dificil' : 'facil');
  for (const m of MEDIDO) {
    const um = makeMonster(m.id, { x: 0, y: 0 });
    const p = perigoDoBando(m.qtd * um.xp, makeParty({ nivel: m.nivel }), { id: m.id, qtd: m.qtd });
    const aceitos = new Set([faixa(m.derrota), faixa(m.derrota - FOLGA), faixa(m.derrota + FOLGA)]);
    assert.ok(aceitos.has(p),
      `${m.qtd} ${m.id} no ${m.nivel}º nível mede ${m.derrota}% de derrota: o rótulo devia ser ${[...aceitos].join(' ou ')}, e o jogo diz ${p}`);
  }
});

teste('escalarBando nunca entrega um bando que ele mesmo chama de mortal', () => {
  for (const e of ENCONTROS) {
    const um = makeMonster(e.id, { x: 0, y: 0 });
    if (!(um.xp > 0)) continue;
    const [dados, faces, bonus] = e.qtd;
    for (let qtd = dados + bonus; qtd <= dados * faces + bonus; qtd += 1) {
      for (const nivel of [2, 3, 4, 5]) {
        const grupo = makeParty({ nivel });
        const { qtd: n } = escalarBando(qtd, um.xp, grupo, { id: e.id });
        assert.ok(n >= 1, `${e.id}: sobrou um bando de ${n}`);
        assert.notEqual(perigoDoBando(n * um.xp, grupo, { id: e.id, qtd: n }), 'mortal',
          `${qtd} ${e.id} no nível ${nivel} virou ${n}, que é mortal`);
      }
    }
  }
});

// ------------------------------------------------- Árvore Trovão ----

const campoDeArvoreTrovao = () => {
  const m = MAPA_ARVORE_TROVAO;
  return new Battlefield(m.terreno[0].length, m.terreno.length, m.terreno, m.altura, null, m.paredes);
};

const alcancaveisDe = (f, inicio) => {
  // COM AS PORTAS ABERTAS. A Árvore Trovão não tinha porta nenhuma enquanto a planta era a nossa; com a da
  // Forgotten Adventures ela ganhou 17, e aí "casa atrás de porta fechada" passou a contar como inalcançável —
  // 168 delas, que são os interiores das casas. Porta fechada não é parede: é o que o grupo abre.
  for (let y = 0; y < f.h; y += 1) for (let x = 0; x < f.w; x += 1) {
    const i = y * f.w + x;
    if (f.paredeN[i] === ARESTA.porta) f.porAresta(x, y - 1, x, y, ARESTA.aberta);
    if (f.paredeO[i] === ARESTA.porta) f.porAresta(x - 1, y, x, y, ARESTA.aberta);
  }
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
  // 16 é o tamanho do anel de pedra que a Forgotten Adventures desenha, e é o que a torre tem desde que a
  // planta passou a ser a deles. O número era 20 quando a torre era nossa, desenhada à mão. O que o teste
  // guarda de verdade está abaixo: a torre fecha a vista por todos os lados menos o vão.
  assert.ok(salao.length >= 16, `a torre tem ${salao.length} casa(s) de salão`);
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
  // A TORRE DA FA É UM PRÉDIO, NÃO UM ANEL COM UM VÃO. Isto aqui exigia duas arestas abertas lado a lado
  // (por onde um Grande passasse sem espremer) mais uma porta interna para o Salão do Prefeito, na parede
  // que os dois dividiam. Era a planta ANTIGA, desenhada à mão. Medido na da FA: a torre tem TRÊS portas de
  // uma folha, todas fechadas, e o Salão do Prefeito fica do outro lado da aldeia — não encosta nela. O mapa
  // manda, então o teste mudou: conta-se PORTA, e o Grande passa espremendo, que é o que o livro dá.
  const nome = Object.fromEntries(Object.entries(ARESTA).map(([k, v]) => [v, k]));
  const portas = [];
  for (const c of salao) {
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const v = { x: c.x + dx, y: c.y + dy };
      if (dentro.has(`${v.x},${v.y}`) || !f.inside(v.x, v.y)) continue;
      const a = f.aresta(c.x, c.y, v.x, v.y);
      if (a === ARESTA.porta || a === ARESTA.aberta) portas.push({ de: c, para: v });
      else assert.equal(nome[a], 'parede', `a borda da torre em (${c.x},${c.y}) é ${nome[a] ?? a}, nem parede nem porta`);
    }
  }
  assert.ok(portas.length >= 1, 'a torre não tem porta nenhuma: o dragão não sai e o grupo não entra');
  assert.ok(portas.some((v) => v.de.x === porta.x && v.de.y === porta.y),
    `a porta publicada (${porta.x},${porta.y}) não é uma das ${portas.length} portas da torre`);
  // E a porta serve ao dragão: aberta, a casa de fora está livre e o Grande passa por ela espremendo.
  const minha = portas.find((v) => v.de.x === porta.x && v.de.y === porta.y);
  f.porAresta(minha.de.x, minha.de.y, minha.para.x, minha.para.y, ARESTA.aberta);
  assert.ok(f.passa(minha.de.x, minha.de.y, minha.para.x, minha.para.y), 'a porta da torre não abre');
  assert.ok(!f.blocksMove(minha.para.x, minha.para.y),
    `a casa logo fora da porta da torre (${minha.para.x},${minha.para.y}) está bloqueada`);
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
  // ESPREMENDO onde precisar (SRD): a porta da FA tem uma casa de largura, e pelo livro o Grande passa por ela
  // pagando o dobro. Antes desta regra existir no motor, este teste exigia porta de duas casas — e era por isso
  // que ele reprovava a planta da Forgotten Adventures, que não tem porta larga em lugar nenhum.
  const apertado = (x, y) => f.inside(x, y) && !f.blocksMove(x, y);
  const alcance = f.reachable({ x: ini.x, y: ini.y }, 5000, () => false, cabe, 2, () => false, apertado);
  let fora = 0;
  for (const n of alcance.values()) if (![0, 1].some((j) => [0, 1].some((i) => salao.has(`${n.x + i},${n.y + j}`)))) fora += 1;
  // Antes da correção eram 0, e depois do pátio da porta eram 22, numa bolsa
  // fechada por três árvores: o dragão seguia sendo uma torre de tiro. Agora o
  // gerador abre, pelo menor número de casas de mata, um caminho de 2 x 2 da
  // chegada até a porta da torre, e o dragão alcança a vila inteira.
  assert.ok(fora >= 1000, `o dragão alcança só ${fora} âncora(s) fora da torre (o mínimo é 1000)`);
  // E a rede de Grande que PARTE DA CHEGADA toca a porta da torre: é o que
  // garante que quem foge dele pela vila é perseguido.
  //
  // ESPREMENDO, como a de cima. A porta da torre fica DENTRO do galpão que lhe serve de antessala (medido:
  // o anel de pedra tem 25 arestas de parede e uma porta só, entre 30,5 e 31,5), e o galpão abre para a rua
  // por uma porta de uma casa. Nenhuma das duas é larga, e pelo livro o Grande passa pagando o dobro. Sem
  // esta ressalva o teste exigia porta dupla, que esta planta não tem em lugar nenhum.
  const rede = f.reachable({ x: ARVORE_TROVAO.chegada.x, y: ARVORE_TROVAO.chegada.y }, 5000, () => false, cabe, 2, () => false, apertado);
  const p = ARVORE_TROVAO.portaDaTorre;
  assert.ok([...rede.keys()].some((k) => { const [x, y] = k.split(',').map(Number); return Math.abs(x - p.x) <= 1 && Math.abs(y - p.y) <= 1; }),
    'um 2 x 2 que sai da chegada não alcança a porta da torre');
});

teste('toda construção admite uma criatura Grande no pátio da porta', () => {
  const f = campoDeArvoreTrovao();
  const cabe = (x, y) => [0, 1].every((j) => [0, 1].every((i) => f.inside(x + i, y + j) && !f.blocksMove(x + i, y + j)));
  // O avental da porta (3 de fundo, 4 de largura) existe para isto: 9 das 22
  // construções tinham o pátio da porta vedado a Grande.
  //
  // A PORTA FECHADA TAMBÉM É SAÍDA. Na planta antiga a construção abria por um vão, e `passa` bastava. A da
  // FA tem PORTA, e porta fechada não passa — então quatro construções (torre, estalagem, casa7, ervas), que
  // só têm porta, saíam como se não tivessem saída nenhuma. A pergunta deste teste é sobre o PÁTIO, não
  // sobre a porta estar aberta, então a aresta de porta conta como saída.
  const semPatio = [];
  for (const [id, cs] of Object.entries(ARVORE_TROVAO.celulas)) {
    const dentro = new Set(cs.map((c) => `${c.x},${c.y}`));
    let achou = false;
    for (const c of cs) {
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const v = { x: c.x + dx, y: c.y + dy };
        if (dentro.has(`${v.x},${v.y}`)) continue;
        const saida = f.passa(c.x, c.y, v.x, v.y) || f.aresta(c.x, c.y, v.x, v.y) === ARESTA.porta;
        if (!saida) continue;
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

// ------------------------------------------------------------------- o Poço da Coruja Velha -----
// A planta vem da cena do Foundry (`src/dev/mapa-poco-fa.py`), e os pontos que o capítulo 4 usa foram medidos
// nela. O gerador se recusa a escrever se algum sair do lugar; isto aqui guarda o arquivo depois de gerado,
// que é quando a mão humana pode mexer.
teste('o Poço: a torre cabe os zumbis, e o grupo alcança boca, tenda, poço e saída', async () => {
  const { POCO } = await import('../game/poco.js');
  const mapa = mapaDo('poco');
  const f = montarCampo(mapa);
  const anda = (p) => !f.blocksMove(p.x, p.y);
  assert.ok(anda(POCO.porta), 'a boca da torre é casa de chão');
  // os três primeiros zumbis saem em (porta.x - 1, porta.y - 1 + i): as três casas têm de ser chão
  for (let i = 0; i < 3; i++) {
    assert.ok(anda({ x: POCO.porta.x - 1, y: POCO.porta.y - 1 + i }), `a casa de onde o zumbi ${i + 1} sai`);
  }
  // o poço BARRA passo, e é a superfície que acende "Encher os cantis"
  assert.equal(f.surfaceAt(POCO.poco.x, POCO.poco.y), 'pocoVelho', 'o poço tem a superfície que a cena escuta');
  assert.ok(!anda(POCO.poco), 'e barra passo: fica-se ao lado dele');
  for (const s of POCO.saida) assert.ok(anda(s), `a saída ${s.x},${s.y}`);
  for (const t of POCO.tenda) assert.ok(anda(t), `a tenda ${t.x},${t.y}`);
  // os zumbis esperam dentro da torre, e TÊM de alcançar o pátio — senão a cena trava com eles presos
  const dentro = [];
  for (let y = POCO.torre.y0; y <= POCO.torre.y1; y++) {
    for (let x = POCO.torre.x0; x <= POCO.torre.x1; x++) if (anda({ x, y })) dentro.push({ x, y });
  }
  // a cena põe um zumbi em CADA casa do retângulo: nenhuma pode ser parede
  const todas = (POCO.torre.x1 - POCO.torre.x0 + 1) * (POCO.torre.y1 - POCO.torre.y0 + 1);
  assert.equal(dentro.length, todas, 'toda casa da torre é chão');
  const doGrupo = f.reachable(mapa.grupo[0], 4000);
  for (const p of [...mapa.grupo, POCO.porta, ...POCO.saida, ...POCO.tenda, ...dentro]) {
    assert.ok(doGrupo.has(`${p.x},${p.y}`), `o grupo alcança ${p.x},${p.y}`);
  }
  // o poço não se pisa; o que se precisa é chegar ao lado dele
  assert.ok([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => doGrupo.has(`${POCO.poco.x + dx},${POCO.poco.y + dy}`)),
    'o grupo chega ao lado do poço');
  // o caminho mais curto até o fundo da torre entra pela boca — é de lá que a cena faz os mortos saírem.
  // (O anel está QUEBRADO, como manda a ruína: há outra brecha no sudeste. A cena não depende de haver uma só.)
  const fundo = Battlefield.pathFrom(doGrupo, { x: 13, y: 4 }).map((p) => `${p.x},${p.y}`);
  assert.ok(fundo.includes(`${POCO.porta.x},${POCO.porta.y}`), `entra pela boca: ${fundo.join(' ')}`);
  // Hamun Kost espera encostado na aba da tenda: a casa existe, anda-se nela e ela toca a barraca
  const kost = { x: 6, y: 11 };
  assert.ok(anda(kost) && doGrupo.has(`${kost.x},${kost.y}`), 'a casa de Kost é chão e se alcança');
  assert.ok(POCO.tenda.some((q) => Math.abs(q.x - kost.x) <= 1 && Math.abs(q.y - kost.y) <= 1), 'e encosta na tenda');
});

// ------------------------------------------------------------------ o Cume da Wyvern -----
// O acampamento orc mudou de lugar: era um desfiladeiro com platô, e agora é a caverna do battlemap da FA
// (`src/dev/mapa-cume-fa.py`). O elenco inteiro e a boca são dados do mapa; isto guarda o arquivo gerado.
teste('o Cume: o bando cabe dentro da caverna, a boca liga os dois lados e o grupo chega a tudo', async () => {
  const { CUME } = await import('../game/cume.js');
  const mapa = mapaDo('cume');
  const f = montarCampo(mapa);
  const anda = (p) => !f.blocksMove(p.x, p.y);
  const naCaverna = new Set(CUME.casasDaCaverna.map((p) => `${p.x},${p.y}`));
  // todo mundo do bando tem de caber, e DENTRO da caverna: é lá que a cena os esconde
  const bando = [CUME.brughor, CUME.gog, ...CUME.orcs];
  for (const p of bando) {
    assert.ok(anda(p), `o posto ${p.x},${p.y} é chão`);
    assert.ok(naCaverna.has(`${p.x},${p.y}`), `o posto ${p.x},${p.y} está dentro da caverna`);
  }
  assert.equal(new Set(bando.map((p) => `${p.x},${p.y}`)).size, bando.length, 'ninguém nasce em cima de outro');
  // a boca: uma casa dentro, uma fora, e a de fora NÃO é da caverna (é lá que o vigia fica)
  assert.ok(naCaverna.has(`${CUME.dentroDaBoca.x},${CUME.dentroDaBoca.y}`), 'dentroDaBoca está dentro');
  assert.ok(!naCaverna.has(`${CUME.foraDaBoca.x},${CUME.foraDaBoca.y}`), 'foraDaBoca está fora');
  assert.ok(anda(CUME.foraDaBoca) && anda(CUME.dentroDaBoca) && anda(CUME.entrada), 'as três são chão');
  // o grupo chega a tudo: senão a cena trava com alguém preso do outro lado
  const doGrupo = f.reachable(mapa.grupo[0], 6000);
  for (const p of [...bando, CUME.entrada, CUME.foraDaBoca, CUME.dentroDaBoca, CUME.vigia, CUME.fogueira, ...CUME.saida]) {
    assert.ok(doGrupo.has(`${p.x},${p.y}`), `o grupo alcança ${p.x},${p.y}`);
  }
  // o caixote barra passo (fica-se ao lado), e tem a superfície que a cena escuta
  assert.equal(f.surfaceAt(CUME.bau.x, CUME.bau.y), 'bau', 'o caixote tem a superfície bau');
  assert.ok(!anda(CUME.bau), 'e barra passo');
  // a caverna está no breu e o lado de fora à luz do dia: é disso que vive a furtividade da cena
  for (const k of naCaverna) {
    const [x, y] = k.split(',').map(Number);
    if (!f.blocksMove(x, y)) assert.equal(f.luz[y * f.w + x], 0, `a caverna está no breu em ${k}`);
  }
  assert.equal(f.luz[CUME.saida[0].y * f.w + CUME.saida[0].x], 2, 'e o lado de fora, claro');
});

// ------------------------------------------------------------------ o Castelo Dentefino -----
// O PARECER DE FIDELIDADE DE 2026-11-06 achou quatro defeitos graves, e estes testes são o que impede que
// voltem. Todos nasceram de uma medida, e a medida está em `revisoes/castelo-fidelidade-2026-11-06.md`.
teste('o Castelo: a lona é a entrada NORTE da ruína, e se procura por fora', async () => {
  const { CASTELO } = await import('../game/castelo.js');
  const f = montarCampo(mapaDo('castelo'));
  // A lona era a aresta (18,8)|(18,9), a CORTINA do sul da ruína — uma porta interna, de modo que ninguém
  // podia "procurar por fora do castelo" como o livro manda. E a guarda do menu pedia y <= 5 para casas de
  // y 8 e 9, então a opção nunca aparecia. São DUAS portas, as do norte, e o `Canvas.webp` da FA fica nelas.
  assert.equal((CASTELO.arestas.lona ?? []).length, 2, 'a lona são as duas portas norte da ruína');
  const naRuina = (p) => CASTELO.celulas.ruina.some((c) => c.x === p.x && c.y === p.y);
  const doTerraco = f.reachable(CASTELO.celulas.terraco[0], 5000);
  for (const [a, b] of CASTELO.arestas.lona) {
    const dentro = naRuina(a) ? a : b;
    const fora = naRuina(a) ? b : a;
    assert.ok(naRuina(dentro) && !naRuina(fora), `a lona tem um lado dentro da ruína e um fora (${a.x},${a.y})`);
    assert.ok(fora.y < dentro.y, 'e a de fora fica ao NORTE, como no livro');
    // é isto que torna a procura possível: a casa de fora se alcança do terraço com a porta FECHADA
    assert.ok(doTerraco.has(`${fora.x},${fora.y}`), `o grupo alcança a casa de fora ${fora.x},${fora.y}`);
    assert.ok(!doTerraco.has(`${dentro.x},${dentro.y}`), 'e não a de dentro, senão não havia o que procurar');
  }
  // o PONTO da lona é a casa de DENTRO: quem o usa é a fuga da Vyerith, que corre até ela e passa
  assert.ok(naRuina(CASTELO.lona), 'o ponto `lona` é a casa de dentro da ruína');
  assert.ok(!f.blocksMove(CASTELO.lona.x, CASTELO.lona.y), 'e é chão livre');
});

teste('o Castelo: o Salão Escuro (8) é a capela dos dois arcos, com o braseiro entre eles', async () => {
  const { CASTELO } = await import('../game/castelo.js');
  const f = montarCampo(mapaDo('castelo'));
  // `salaoEscuro` era a passagem central do castelo, com QUATRO portas, e a área 8 do livro ficava sem nome.
  // Agora é o ladrilho `Shrine.webp` da FA: "um salão alto e estreito... parte de uma capela ou templo", com
  // os dois arcos de cortina ao norte e o santuário (9) do outro lado deles.
  const cs = CASTELO.celulas.salaoEscuro;
  assert.ok(cs.length >= 16, `a capela tem ${cs.length} casas (eram 11 na passagem)`);
  const norte = Math.min(...cs.map((q) => q.y));
  const arcos = cs.filter((c) => c.y === norte);
  assert.equal(arcos.length, 2, 'a fileira do norte são os DOIS arcos, e não uma parede corrida');
  assert.ok(Math.abs(arcos[0].x - arcos[1].x) >= 2, 'com pedra entre eles: é lá que o braseiro fica');
  // cada arco dá no santuário, e a passagem é uma CORTINA e não uma porta: o livro diz "grossas cortinas
  // tapam a passagem por um par de arcos", e cortina se atravessa sem abrir nada e não se vê através. A
  // aresta etérea é essa tradução — passo livre, visão barrada —, e era porta no import da FA, que não tem
  // aresta de cortina. Com porta, os goblins do santuário "saíam das cortinas do norte" por uma porta
  // fechada, e dava para ver a capela inteira do outro lado assim que alguém a abrisse.
  for (const a of arcos) {
    assert.ok(CASTELO.celulas.santuario.some((q) => q.x === a.x && q.y === a.y - 1),
      `o arco (${a.x},${a.y}) dá no santuário`);
    assert.equal(f.paredeN[a.y * f.w + a.x], ARESTA.eterea, 'e a passagem é uma cortina, não uma porta');
    assert.ok(f.passa(a.x, a.y, a.x, a.y - 1, 'passo'), 'atravessa-se sem abrir nada');
    assert.ok(!f.hasLineOfSight(a, { x: a.x, y: a.y - 1 }), 'e não se vê o santuário através dela');
  }
  // o braseiro de pedra com a estatueta: ENTRE os arcos, onde o livro o põe e a FA o pinta
  const braseiro = cs.find((c) => f.surfaceAt(c.x, c.y) === 'braseiroFrio');
  assert.ok(braseiro, 'a capela tem o braseiro frio (é o gatilho da estatueta no capítulo)');
  assert.ok(braseiro.x > Math.min(arcos[0].x, arcos[1].x) && braseiro.x < Math.max(arcos[0].x, arcos[1].x),
    `o braseiro (${braseiro.x},${braseiro.y}) fica entre os dois arcos`);
  // e o grick mora nela: era na passagem, e na capela nasciam dois arqueiros que o livro não põe lá
  const grick = CASTELO.postos.grick[0];
  assert.ok(cs.some((c) => c.x === grick.x && c.y === grick.y), 'o grick nasce dentro da capela');
  assert.ok(!CASTELO.celulas.passagem.some((c) => c.x === grick.x && c.y === grick.y), 'e não na passagem');
});

teste('o Castelo: os postos de arqueiro flanqueiam a entrada, e não são a capela nem o capim', async () => {
  const { CASTELO } = await import('../game/castelo.js');
  const f = montarCampo(mapaDo('castelo'));
  const naSalaDo = (sala, p) => CASTELO.celulas[sala].some((c) => c.x === p.x && c.y === p.y);
  for (const posto of ['postoNorte', 'postoSul']) {
    const cs = CASTELO.celulas[posto];
    // "esta pequena sala está cheia com detritos": pequena mesmo, e colada no salão da armadilha (área 2)
    assert.ok(cs.length <= 6, `${posto} tem ${cs.length} casas: é a sala pequena do livro`);
    assert.ok(cs.some((c) => CASTELO.celulas.salaoArmadilha.some((q) =>
      Math.abs(q.x - c.x) <= 1 && Math.abs(q.y - c.y) <= 1)), `${posto} encosta no salão da armadilha`);
    for (const p of CASTELO.postos[posto]) {
      assert.ok(naSalaDo(posto, p), `o arqueiro (${p.x},${p.y}) nasce dentro do ${posto}`);
      assert.ok(!naSalaDo('salaoEscuro', p), 'e não dentro da capela, onde o livro não põe ninguém');
      assert.ok(!naSalaDo('terraco', p), 'e não no terraço');
      assert.ok(!f.blocksMove(p.x, p.y), 'e em casa livre');
    }
  }
  // E O CAMPO DE TIRO PARA O TERRAÇO NÃO EXISTE NESTA PLANTA. Isto não é defeito escondido: é a medida que
  // decidiu onde os postos ficam, e fica travada aqui para ninguém voltar a prometer o que o mapa não dá.
  // Das seteiras do mapa da FA, nenhuma tem um lado no terraço — cada uma dá na espessura da parede.
  let paraOTerraco = 0;
  for (let y = 0; y < f.h; y += 1) for (let x = 0; x < f.w; x += 1) {
    const i = y * f.w + x;
    for (const [c, a, b] of [[f.paredeN[i], { x, y: y - 1 }, { x, y }], [f.paredeO[i], { x: x - 1, y }, { x, y }]]) {
      if (c === ARESTA.seteira && (naSalaDo('terraco', a) || naSalaDo('terraco', b))) paraOTerraco += 1;
    }
  }
  assert.equal(paraOTerraco, 0, 'nenhuma seteira desta planta dá no terraço (medido; ver o parecer)');
});

teste('o Castelo: a porta escorada É a do urso, e o quarto do rei põe a Vyerith na porta', async () => {
  const { CASTELO } = await import('../game/castelo.js');
  const f = montarCampo(mapaDo('castelo'));
  // UMA PORTA, UMA BARRA: a área 12 do livro tem "uma porta de madeira bloqueada" ao sul, e a 13, do outro
  // lado dela, "uma barra grossa de madeira". O teste de Força estava na porta OESTE do alojamento.
  assert.deepEqual(CASTELO.arestas.portaEscorada, CASTELO.arestas.portaUrso,
    'a porta escorada e a do urso são a mesma aresta');
  const [a, b] = CASTELO.arestas.portaUrso[0];
  const em = (sala) => CASTELO.celulas[sala].some((c) => (c.x === a.x && c.y === a.y) || (c.x === b.x && c.y === b.y));
  assert.ok(em('guarda') && em('torreUrso'), 'e liga o alojamento dos guardas à torre do urso');
  // A BANHEIRA SAIU DO QUARTO DO REI. O livro a põe na Sala Noroeste, "uma câmara parcialmente derrubada que
  // foi um confortável banheiro"; ela estava solta no meio do quarto, em duas casas.
  const banheiras = (sala) => CASTELO.celulas[sala].filter((c) => f.surfaceAt(c.x, c.y) === 'banheira').length;
  assert.equal(banheiras('rei'), 0, 'o quarto do rei não tem banheira');
  assert.ok(banheiras('banheiro') >= 1, 'a Sala Noroeste tem');
  // A VYERITH EMBOSCA ATRÁS DA PORTA, e o Gundren fica no fundo da sala: o livro diz os dois.
  const naSalaDoRei = (p) => CASTELO.celulas.rei.some((q) => q.x === p.x && q.y === p.y);
  const porta = CASTELO.folhas.map(([p, q]) => (naSalaDoRei(p) ? p : (naSalaDoRei(q) ? q : null))).find(Boolean);
  assert.ok(porta, 'o quarto do rei tem porta com folha');
  const dist = (p) => Math.max(Math.abs(p.x - porta.x), Math.abs(p.y - porta.y));
  const ordem = [...CASTELO.postos.rei].sort((p, q) => dist(p) - dist(q));
  assert.ok(dist(ordem[0]) <= 1, `a casa da Vyerith (${ordem[0].x},${ordem[0].y}) encosta na porta`);
  assert.ok(dist(ordem[ordem.length - 1]) >= 3, 'e a do Gundren fica no fundo, longe dela');
});

teste('o Castelo: móvel de várias casas sai INTEIRO, e cada sala tem o que o livro lhe dá', async () => {
  const { CASTELO } = await import('../game/castelo.js');
  const f = montarCampo(mapaDo('castelo'));
  const encosta = (a, b) => Math.abs(a.x - b.x) <= 1 && Math.abs(a.y - b.y) <= 1;
  /** Em quantos pedaços SOLTOS esta superfície aparece nesta sala? */
  const pedacos = (sala, sup) => {
    const ps = CASTELO.celulas[sala].filter((c) => f.surfaceAt(c.x, c.y) === sup);
    const vistos = new Set();
    let n = 0;
    for (const p of ps) {
      if (vistos.has(`${p.x},${p.y}`)) continue;
      n += 1;
      const fila = [p];
      vistos.add(`${p.x},${p.y}`);
      while (fila.length) {
        const q = fila.pop();
        for (const r of ps) {
          if (!vistos.has(`${r.x},${r.y}`) && encosta(q, r)) { vistos.add(`${r.x},${r.y}`); fila.push(r); }
        }
      }
    }
    return { n, casas: ps.length };
  };
  // A CAMA DO REI era QUATRO camas de uma casa nos quatro cantos do quarto, e as duas mesas ficavam em
  // metades opostas: a receita punha cada cópia do glifo por conta própria. O livro tem "uma grande cama" e
  // "uma mesa redonda". Agora cada PALAVRA da receita é uma peça, e as casas de uma peça se colam.
  const cama = pedacos('rei', 'camaRei');
  assert.ok(cama.casas >= 3, `a cama do rei tem ${cama.casas} casas`);
  assert.equal(cama.n, 1, 'e sai num pedaço só, não espalhada pelo quarto');
  assert.equal(pedacos('rei', 'mesa').n, 1, 'a mesa redonda do rei também é uma só');
  assert.equal(pedacos('banquete', 'mesaBanquete').n, 1, 'as mesas do banquete saem encostadas, como a FA as pinta');
  // E O QUE CADA SALA TEM vem do livro, não da planta antiga:
  const temSup = (sala, sup) => CASTELO.celulas[sala].filter((c) => f.surfaceAt(c.x, c.y) === sup).length;
  // área 6: "suportes na parede mantêm várias armas... o CHÃO É LIMPO DE ENTULHO"
  assert.ok(temSup('alojamentoHob', 'armeiro') >= 1, 'o alojamento hobgoblin tem o armeiro');
  assert.equal(temSup('alojamentoHob', 'entulho'), 0, 'e o chão dele é limpo de entulho, como o livro diz');
  assert.ok(temSup('alojamentoHob', 'palha') >= 1, 'e tem as pilhas de palha');
  // área 4: "vários SACOS DE DORMIR esfarrapados espalhados pelo que sobrou de espaço no chão" — faltavam
  assert.ok(temSup('torreSul', 'palha') >= 1, 'a torre sul tem os sacos de dormir dos três goblins');
  // área 12: "um braseiro de pedra cheio de carvão brilha no meio... quatro pilhas de palha ao leste"
  assert.ok(temSup('guarda', 'braseiro') >= 1, 'o alojamento dos guardas tem o braseiro aceso');
  assert.ok(temSup('guarda', 'palha') >= 3, 'e as pilhas de palha');
  // área 13: "uma velha MESA DE TRABALHO e estantes de livros ficam ao sul", mais a arca do tesouro
  assert.ok(temSup('torreUrso', 'mesa') >= 1, 'a torre do urso tem a mesa de trabalho');
  assert.ok(temSup('torreUrso', 'arca') >= 1, 'e a arca do tesouro, que o capítulo usa');
});

teste('o Castelo: cortina não é porta, a folha caída está nos portões, e a seteira dá penumbra', async () => {
  const { CASTELO } = await import('../game/castelo.js');
  const mapa = mapaDo('castelo');
  const f = montarCampo(mapa);
  const cels = CASTELO.celulas;
  const salaDe = (x, y) => Object.keys(cels).find((k) => cels[k].some((c) => c.x === x && c.y === y));

  // AS QUATRO CORTINAS DO LIVRO (áreas 8, 11 e 12) eram porta no import da FA, que não tem aresta de
  // cortina. Etérea é a tradução: atravessa-se sem abrir, não se vê através.
  let cortinas = 0;
  for (let y = 0; y < f.h; y += 1) for (let x = 0; x < f.w; x += 1) {
    if (f.paredeN[y * f.w + x] === ARESTA.eterea) cortinas += 1;
    if (f.paredeO[y * f.w + x] === ARESTA.eterea) cortinas += 1;
  }
  assert.equal(cortinas, 4, 'as quatro cortinas do livro são aresta etérea');
  // e nenhuma delas ganhou folha: folha é coisa de porta, e cortina não abre nem fecha
  const emFolha = new Set(CASTELO.folhas.flat().map((p2) => `${p2.x},${p2.y}`));
  for (const c of CASTELO.cortinas) {
    assert.ok(f.passa(c.x, c.y, c.x, c.y - 1, 'passo'), `a cortina (${c.x},${c.y}) deixa passar`);
    assert.ok(!emFolha.has(`${c.x},${c.y - 1}`) || salaDe(c.x, c.y - 1) !== 'santuario'
      || !emFolha.has(`${c.x},${c.y}`), 'a cortina não tem folha de porta');
  }

  // A FOLHA DE PORTÃO CAÍDA: a chegada ao terraço diz "duas folhas podres... uma delas caída", e não havia
  // um `portaoCaido` no mapa inteiro. Ela fica DIANTE DOS PORTÕES, e não na beira oeste do terraço.
  const folha = [];
  for (let y = 0; y < f.h; y += 1) for (let x = 0; x < f.w; x += 1) {
    if (f.surfaceAt(x, y) === 'portaoCaido') folha.push({ x, y });
  }
  assert.equal(folha.length, 1, 'há uma folha de portão caída, e uma só');
  assert.equal(salaDe(folha[0].x, folha[0].y), 'terraco', 'e ela está no terraço');
  assert.ok(cels.salaoArmadilha.some((c) => Math.abs(c.x - folha[0].x) <= 2 && Math.abs(c.y - folha[0].y) <= 2),
    `a folha (${folha[0].x},${folha[0].y}) está junto dos portões, não na beira do terraço`);

  // A SALA COM SETEIRA E SEM CHAMA NASCE EM PENUMBRA. O livro dá a regra pelo avesso na área 13 ("as
  // aberturas para arqueiro AQUI ESTÃO FECHADAS, deixando a sala escura") e a exceção na 8 ("mesmo de dia
  // esta área não tem luz exterior"). A sala COM chama segue no breu, senão a tocha dela não muda nada —
  // é a lição já medida na Mansão, e a prova "nenhuma luz de mapa é inerte" continua valendo.
  const luzDa = (sala) => cels[sala].map((c) => f.luz[c.y * f.w + c.x]);
  for (const sala of ['passagem', 'corredor', 'banheiro']) {
    assert.ok(luzDa(sala).every((l) => l >= 1), `${sala} tem seteira e nenhuma chama: nasce em penumbra`);
  }
  for (const sala of ['salaoEscuro', 'torreUrso']) {
    assert.ok(luzDa(sala).every((l) => l === 0), `${sala} fica no breu, que é o que o livro diz dela`);
  }
  for (const sala of ['banquete', 'guarda', 'santuario', 'rei']) {
    assert.ok(luzDa(sala).every((l) => l === 0),
      `${sala} tem chama dentro e nasce no breu, senão apagá-la não mudaria casa nenhuma`);
    assert.ok((mapa.luzes ?? []).some((l) => cels[sala].some((c) => c.x === l.pos.x && c.y === l.pos.y)),
      `${sala} de fato tem chama dentro`);
  }
});

teste('o Castelo: o bando do Targor fecha a conta de 500 XP, e o baú do urso fica no alto', async () => {
  const { MONSTERS } = await import('../rules/monsters.js');
  const { EXAMES_DO_CASTELO } = await import('../game/castelo-exames.js');
  // O LIVRO DEIXA O BANDO AMBÍGUO ("três hobgoblins liderados por Targor") e a conta de XP resolve: ele
  // manda dividir 500, e hobgoblin é ND 1/2 (100 XP) e lobo ND 1/4 (50). Targor mais três hobgoblins dá
  // 400, e os dois lobos fecham em 500. Três ao todo daria 400, e aí o número do livro não bateria.
  const hob = MONSTERS.hobgoblin;
  const lobo = MONSTERS.lobo;
  assert.equal(hob.xp, 100, 'hobgoblin vale 100 XP');
  assert.equal(lobo.xp, 50, 'lobo vale 50 XP');
  assert.equal(hob.xp * 4 + lobo.xp * 2, 500, 'Targor + 3 hobgoblins + 2 lobos dão os 500 XP do livro');
  assert.notEqual(hob.xp * 3 + lobo.xp * 2, 500, 'e três hobgoblins ao todo NÃO dariam');

  // O BAÚ DO URSO ESTÁ NUMA BORDA ALTA, e o texto do chão não pode entregá-lo: é isso que a Percepção
  // CD 15 do livro cobra ("o baú é difícil de ser visto do chão"). A `arca` da torre do urso ganhou texto
  // próprio, que descreve a laje pendurada e não um baú ao alcance da mão.
  const noChao = EXAMES_DO_CASTELO['arca@torreUrso'];
  assert.ok(noChao, 'a torre do urso tem o Examinar próprio da borda alta');
  assert.notEqual(noChao, EXAMES_DO_CASTELO.arca, 'e ele não é o texto da arca comum');
  assert.ok(!/ba[úu]|arca|tesouro|moeda|ouro/i.test(noChao),
    'e não entrega o baú de graça: quem o acha é o teste de Percepção');
  assert.ok(/arca/i.test(EXAMES_DO_CASTELO.arca), 'a arca do quarto do rei continua sendo uma arca');
});

console.log(`\n${total - falhas}/${total} passaram`);
if (falhas) process.exit(1);
