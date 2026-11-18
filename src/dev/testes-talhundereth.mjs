// TALHUNDERETH (o Obelisco, capítulo 6): as criaturas novas no motor, e depois a cena.
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-talhundereth.mjs
//
// Cada prova foi escrita para FALHAR sem o código que ela mede: o olhar da medusa, a carga do galeb (e a investida da
// broca, que morria no perfil do golpe), os pedregulhos, a imunidade do horror de elmo, o sopro e a explosão do mefit,
// o voo defensivo do mutante, a cacofonia e o sugar da armadilha, e a fome, o consumir e as crias do aglomerado.
import assert from 'node:assert/strict';

const P = new URL('../', import.meta.url).href;
const { Encounter } = await import(P + 'rules/combat.js');
const { makeParty } = await import(P + 'rules/party.js');
const { makeMonster, MONSTERS } = await import(P + 'rules/monsters.js');
const { Battlefield, distanceFt } = await import(P + 'core/grid.js');
const { makeRng } = await import(P + 'core/rng.js');
const { hasCondition, getCondition, addCondition } = await import(P + 'rules/conditions.js');
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

const MAPA = Array(14).fill('..............');
function montar({ seed = 1, foes = [], pos = null, lado = 'party', nivel = 7 } = {}) {
  const field = new Battlefield(14, 14, MAPA);
  const party = makeParty({ nivel });
  const pp = pos ?? [{ x: 5, y: 5 }, { x: 1, y: 1 }, { x: 1, y: 3 }, { x: 1, y: 12 }];
  party.forEach((c, i) => { c.pos = { ...c.pos, ...pp[i] }; });
  const fs = foes.map(([id, p]) => makeMonster(id, p));
  const log = [];
  const enc = new Encounter({ battlefield: field, party, foes: fs, rng: makeRng(seed), onLog: (e) => log.push(e) });
  enc.firstSide = lado;
  enc.round = 1;
  enc.beginSide(lado);
  const texto = () => log.map((l) => l.text ?? l.msg ?? String(l)).join('\n');
  return { enc, party, foes: fs, log, texto };
}

await teste('os dez blocos de Talhundereth têm os números do livro (ND, XP, CA, PV)', () => {
  const linha = (id) => { const d = MONSTERS[id]; return [d.cr, d.xp, d.ac, d.maxHp]; };
  assert.deepEqual(linha('galebDuhr'), ['6', 2300, 16, 85]);
  assert.deepEqual(linha('medusa'), ['6', 2300, 15, 127]);
  assert.deepEqual(linha('horrorDeElmo'), ['4', 1100, 20, 60]);
  assert.deepEqual(linha('mefitDePoeira'), ['1/2', 100, 12, 17]);
  assert.deepEqual(linha('wight'), ['3', 700, 14, 45]);
  assert.deepEqual(linha('mutanteHumanoide'), ['4', 1100, 14, 65]);
  assert.deepEqual(linha('armadilhaDeIntelecto'), ['8', 3900, 14, 99]);
  assert.deepEqual(linha('drowGuerreiroDeElite'), ['5', 1800, 18, 71]);
  assert.deepEqual(linha('elementalDaTerra'), ['5', 1800, 17, 126]);
  assert.deepEqual(linha('aglomeradoEncefalico'), ['10', 5900, 13, 110]);
  assert.equal(makeMonster('aglomeradoEncefalico', { x: 0, y: 0 }).pos.f, 2, 'Grande');
  assert.equal(makeMonster('aglomeradoEncefalico', { x: 0, y: 0 }).resources.resistenciaLendaria, 3);
});

await teste('a investida sai do GOLPE de verdade: a broca e o galeb embalados somam o dano extra (antes, só chamada à mão)', () => {
  for (const id of ['brocaInfernal', 'galebDuhr']) {
    let embalou = false;
    for (let seed = 1; seed <= 30 && !embalou; seed++) {
      const { enc, party, foes, texto } = montar({ seed, foes: [[id, { x: 6, y: 5 }]], lado: 'foes' });
      const m = foes[0];
      m.movementLeftFt = Math.max(0, enc.speedOf(m) - 25);
      // a última reta andada, na direção do alvo (o livro: 6 m EM LINHA RETA)
      m.retaAndada = { pes: 25, dx: Math.sign(party[0].pos.x - m.pos.x), dy: Math.sign(party[0].pos.y - m.pos.y) };
      const r = enc.resolveAttack(m, party[0], { weaponId: m.attacks[0].name });
      if (r?.hit && /embalado/.test(texto())) embalou = true;
    }
    assert.ok(embalou, `${id}: andou 7,5 m em linha reta e acertou, e a investida não somou nada`);
    // os mesmos 7,5 m, mas a reta do fim tem só 1,5 m (dobrou a esquina): não embala
    for (let seed = 1; seed <= 30; seed++) {
      const { enc, party, foes, texto } = montar({ seed, foes: [[id, { x: 6, y: 5 }]], lado: 'foes' });
      const m = foes[0];
      m.movementLeftFt = Math.max(0, enc.speedOf(m) - 25);
      m.retaAndada = { pes: 5, dx: -1, dy: 0 };
      enc.resolveAttack(m, party[0], { weaponId: m.attacks[0].name });
      assert.ok(!/embalado/.test(texto()), `${id}: dobrou a esquina e embalou assim mesmo`);
    }
  }
});

await teste('o olhar da medusa: no começo do turno, a 9 m e à vista, Constituição CD 14 — pedra, ou virando pedra', () => {
  let pedra = 0;
  let virando = 0;
  for (let seed = 1; seed <= 60; seed++) {
    const { party } = montar({ seed, foes: [['medusa', { x: 8, y: 5 }]], lado: 'party' });
    if (hasCondition(party[0], 'petrificado')) pedra++;
    if (hasCondition(party[0], 'petrificando')) virando++;
    assert.ok(!hasCondition(party[3], 'petrificado') && !hasCondition(party[3], 'petrificando'), 'longe dela (a mais de 9 m), nada');
  }
  assert.ok(pedra > 0 && virando > 0, `pedra ${pedra}, virando ${virando}`);
});

await teste('desviar os olhos: não testa, ataca a medusa com desvantagem e ela o ataca com vantagem', () => {
  const { enc, party, foes } = montar({ foes: [['medusa', { x: 6, y: 5 }]], lado: 'foes' });
  const h = party[0];
  assert.ok(enc.useFeature(h, 'desviarOlhar', { modo: 'ligar' }));
  for (let i = 0; i < 20; i++) {
    h.conditions = h.conditions.filter((c) => c.id !== 'olhosDesviados');
    enc.olharPetrificante(h);
    assert.ok(!hasCondition(h, 'petrificado') && !hasCondition(h, 'petrificando'));
  }
  assert.ok(hasCondition(h, 'olhosDesviados'));
  assert.ok(enc.attackModifiers(h, foes[0]).disadvantage, 'ataca às cegas');
  assert.ok(enc.attackModifiers(foes[0], h).advantage, 'ela o ataca com vantagem');
});

await teste('quem está virando pedra testa de novo no fim do próximo turno: falhou, petrificado (resistência a tudo)', () => {
  let virou = false;
  for (let seed = 1; seed <= 40 && !virou; seed++) {
    const { enc, party, foes } = montar({ seed, foes: [['medusa', { x: 8, y: 5 }]], lado: 'foes' });
    const h = party[0];
    addCondition(h, 'petrificando', { source: foes[0].id, data: { cd: 14 } });
    enc.fimDaPetrificacao(h);
    if (hasCondition(h, 'petrificado')) {
      virou = true;
      const antes = h.hp;
      enc.applyDamage(h, 10, 'cortante', foes[0]);
      assert.equal(antes - h.hp, 5, 'pedra resiste a todo dano');
    }
  }
  assert.ok(virou);
});

await teste('a medusa: três golpes de perto, ou DOIS tiros de arco (o multiataque tem as duas formas)', () => {
  const { enc, foes } = montar({ foes: [['medusa', { x: 8, y: 5 }]] });
  assert.equal(enc.golpesDoAtaque(foes[0], 'Arco Longo').length, 2);
  assert.equal(enc.golpesDoAtaque(foes[0], 'Cabeleira de Serpentes').length, 3);
});

await teste('o horror de elmo é imune à Bola de Fogo: o goblin ao lado queima, ele não', () => {
  const { enc, party, foes } = montar({ nivel: 7, foes: [['horrorDeElmo', { x: 8, y: 8 }], ['goblin', { x: 9, y: 8 }]] });
  const ilvan = party[3];
  const [h, g] = foes;
  assert.ok(enc.castSpell(ilvan, 'bolaDeFogo', { point: { x: 8, y: 8 } }).ok);
  assert.equal(h.hp, h.maxHp, 'o horror não sente nada');
  assert.ok(g.dead || g.hp < g.maxHp, 'o goblin sente');
});

await teste('o mefit de poeira: o sopro (sem dano) cega quem falha, e a morte estoura poeira que cega quem está colado', () => {
  let cegouSopro = false;
  let cegouMorte = false;
  for (let seed = 1; seed <= 40 && !(cegouSopro && cegouMorte); seed++) {
    const { enc, party, foes } = montar({ seed, foes: [['mefitDePoeira', { x: 6, y: 5 }]], pos: [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 1, y: 3 }, { x: 1, y: 12 }], lado: 'foes' });
    const m = foes[0];
    const antes = party[0].hp;
    enc.sopro(m, party[0].pos);
    assert.equal(party[0].hp, antes, 'o sopro não fere');
    if (hasCondition(party[0], 'cego')) cegouSopro = true;
    party[0].conditions = [];
    enc.applyDamage(m, 99, 'cortante', party[0]);
    assert.ok(m.dead);
    if (hasCondition(party[0], 'cego')) cegouMorte = true;
  }
  assert.ok(cegouSopro, 'o sopro nunca cegou');
  assert.ok(cegouMorte, 'a explosão nunca cegou');
});

await teste('o mutante humanoide: ferido, voa para longe de quem o feriu (Voo Defensivo), uma vez por rodada', () => {
  const { enc, party, foes } = montar({ foes: [['mutanteHumanoide', { x: 6, y: 5 }]] });
  const m = foes[0];
  const d0 = distanceFt(m.pos, party[0].pos);
  enc.applyDamage(m, 5, 'cortante', party[0]);
  assert.ok(distanceFt(m.pos, party[0].pos) > d0, 'não saiu do lugar');
  assert.ok(m.reactionUsed);
  const ali = { ...m.pos };
  enc.applyDamage(m, 5, 'cortante', party[0]);
  assert.deepEqual({ x: m.pos.x, y: m.pos.y }, { x: ali.x, y: ali.y }, 'a reação já foi');
});

await teste('a armadilha de intelecto: a cacofonia prende quem começa o turno a 9 m; quem passa fica imune a ela', () => {
  let preso = false;
  let imune = false;
  for (let seed = 1; seed <= 30 && !(preso && imune); seed++) {
    const { party } = montar({ seed, foes: [['armadilhaDeIntelecto', { x: 8, y: 5 }]], lado: 'party' });
    const h = party[0];
    if ((h.conditions ?? []).some((k) => k.id === 'incapacitado' && k.data?.cacofonia)) preso = true;
    if (h.imuneACacofonia?.length) imune = true;
    assert.ok(!party[3].imuneACacofonia?.length && !hasCondition(party[3], 'incapacitado'), 'longe, nada');
  }
  assert.ok(preso && imune, `preso ${preso}, imune ${imune}`);
});

await teste('a armadilha de intelecto agarra com o tentáculo e suga quem prende, e se cura do que tirou', () => {
  const { enc, party, foes } = montar({ foes: [['armadilhaDeIntelecto', { x: 8, y: 5 }]], lado: 'foes' });
  const m = foes[0];
  const h = party[0];
  addCondition(h, 'agarrado', { source: m.id, data: { escape: 17 } });
  m.hp = 50;
  const antes = h.hp;
  assert.ok(enc.sugarPensamentos(m));
  assert.ok(h.hp < antes);
  assert.ok(m.hp > 50, 'cura o que tirou');
  // e o tentáculo não laça quem é Grande
  const ogro = makeMonster('ogro', { x: 9, y: 5 });
  ogro.side = 'party';
  enc.addCombatant(ogro);
  for (let i = 0; i < 30; i++) enc.efeitoDoGolpe(m, ogro, { ...m.attacks[0], onHit: m.attacks[0].onHit });
  assert.ok(!hasCondition(ogro, 'agarrado'));
});

await teste('o aglomerado encefálico: acertado, vai atrás de quem o acertou e bate (Fome Agressiva)', () => {
  const { enc, party, foes, texto } = montar({ foes: [['aglomeradoEncefalico', { x: 9, y: 5 }]], pos: [{ x: 5, y: 5 }, { x: 1, y: 1 }, { x: 1, y: 3 }, { x: 1, y: 12 }] });
  const a = foes[0];
  const d0 = distanceFt(a.pos, party[0].pos);
  enc.fomeAgressiva(a, party[0]);
  assert.ok(distanceFt(a.pos, party[0].pos) < d0);
  assert.ok(/Fome Agressiva/.test(texto()));
  assert.ok(a.reactionUsed);
});

await teste('o aglomerado consome quem a pancada zera (morre na hora, sem teste de morte), e cospe 1d4 gêmulas', () => {
  let comeu = false;
  for (let seed = 1; seed <= 40 && !comeu; seed++) {
    const { enc, party, foes } = montar({ seed, foes: [['aglomeradoEncefalico', { x: 6, y: 5 }]], lado: 'foes' });
    const h = party[0];
    h.hp = 1;
    const r = enc.resolveAttack(foes[0], h, { weaponId: 'Pancada' });
    if (r?.hit) { assert.ok(h.dead, 'zerado e não morto'); comeu = true; }
  }
  assert.ok(comeu);
  const { enc, foes } = montar({ foes: [['aglomeradoEncefalico', { x: 6, y: 5 }]], lado: 'foes' });
  const crias = enc.gerarCrias(foes[0]);
  assert.ok(crias.length >= 1 && crias.length <= 4);
  assert.ok(crias.every((g) => g.defId === 'gemulaEncefalica' && g.side === 'foes' && distanceFt(g.pos, foes[0].pos) <= 30));
  assert.equal(enc.gerarCrias(foes[0]).length, 0, 'uma vez por descanso');
});

await teste('o galeb duhr anima dois pedregulhos; ele caindo, eles voltam a ser pedra', () => {
  const { enc, party, foes } = montar({ foes: [['galebDuhr', { x: 8, y: 5 }]], lado: 'foes' });
  const g = foes[0];
  const pedras = enc.animarPedregulhos(g);
  assert.equal(pedras.length, 2);
  assert.ok(pedras.every((p) => p.side === 'foes' && !p.dead && p.xp === 0));
  enc.applyDamage(g, 999, 'energético', party[0], { magico: true });
  assert.ok(g.dead);
  assert.ok(pedras.every((p) => p.dead), 'os pedregulhos seguem rolando sem ele');
});

await teste('a IA: o galeb anima no primeiro turno, e o aglomerado troca uma pancada pelas crias', () => {
  const { enc, foes } = montar({ foes: [['galebDuhr', { x: 9, y: 5 }], ['aglomeradoEncefalico', { x: 6, y: 6 }]], lado: 'foes' });
  takeMonsterTurn(enc, foes[0]);
  assert.equal(foes[0].resources.animarPedregulhos, 0);
  takeMonsterTurn(enc, foes[1]);
  assert.equal(foes[1].resources.gerarCrias, 0);
  assert.ok(enc.combatants.some((c) => c.defId === 'gemulaEncefalica'));
});

// =============================================================================== a cena, sala a sala ====
const { criarTalhundereth, salaEmTalhundereth } = await import(P + 'game/talhundereth.js');
const { PONTOS_TALHUNDERETH: T } = await import(P + 'game/talhundereth-mapa.js');
const { mapaDo } = await import(P + 'game/encounter.js');
const { montarCampo } = await import(P + 'game/campo.js');
const { garantirInventario } = await import(P + 'rules/equipment.js');
const escolher = (...valores) => { const fila = [...valores]; globalThis.__escolher = (esc) => { const v = fila.length ? fila.shift() : null; return (esc.find((e) => e.valor === v) ?? esc.find((e) => e.primaria) ?? esc[0]).valor; }; };
const naoEscolher = () => { delete globalThis.__escolher; };

function templo({ seed = 5, nivel = 8, campanha = null } = {}) {
  const mapa = mapaDo('talhundereth');
  const field = montarCampo(mapa);
  const party = makeParty({ nivel });
  party.forEach((c, i) => { c.pos = { ...c.pos, ...mapa.grupo[i] }; });
  const app = { root: { classList: { add() {}, remove() {} } }, campanha: campanha ?? { obelisco6: { feito: {}, lutas: {} }, vila: { pistas: [], dia: 5 } },
    selected: null, select(c) { this.selected = c; }, firstActive: () => null, refresh() {}, encerrarPartida() { app.fim = true; },
    irParaVila() { app.voltou = true; }, newEncounter() {}, config: {}, abrirRegiao(_a, o) { app.foiParaRegiao = o.onde; } };
  const enc = new Encounter({ battlefield: field, party, foes: [], rng: makeRng(seed), emboscada: null, reinforcements: () => null });
  app.enc = enc;
  const cena = criarTalhundereth(app, {});
  app.capitulo = cena;
  const ir = async (h, p) => { h.pos = { ...h.pos, ...p }; await cena.depoisDeMover(h); };
  const op = (tile, h, re) => cena.interacoes(tile, enc.field.surfaceAt(tile.x, tile.y), h).find((o) => re.test(o.rotulo));
  return { app, enc, cena, party, field, t: () => app.campanha.obelisco6.talh, o6: () => app.campanha.obelisco6, ir, op };
}

await teste('o templo: as 21 salas do livro estão na planta, e as três portas do roteiro nascem fechadas', async () => {
  for (const s of ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10no', 'T11', 'T12', 'T13', 'T14', 'T15', 'T16', 'T17', 'T18', 'T19', 'T20', 'T21']) {
    assert.ok(T.salas[s]?.length, `sem a sala ${s}`);
  }
  const f = montarCampo(mapaDo('talhundereth'));
  for (const [nome, s] of Object.entries(T.secretas)) assert.ok(!f.passa(s.a.x, s.a.y, s.b.x, s.b.y), `${nome} já nasce aberta`);
  assert.equal(salaEmTalhundereth(T.honna), 'T3');
  assert.equal(salaEmTalhundereth(T.aglomerado), 'T21');
});

await teste('a chegada: quem está à vista no livro fica no tabuleiro; os escondidos (galebs, armaduras, mefits, armadilha, elementais) não', async () => {
  naoEscolher();
  const s = templo();
  await s.cena.iniciar();
  assert.ok(s.cena.explorando);
  const no = (k) => s.enc.combatants.includes(s.cena.elenco[k]);
  for (const k of ['honna', 'cameren', 'falfark', 'erdan', 'nythalyn', 'malinia', 'ontharyx', 'aglomerado']) assert.ok(no(k), `${k} devia estar no tabuleiro`);
  for (const k of ['fremine', 'horror', 'mefit1', 'wight', 'armadilha', 'elemental1']) assert.ok(!no(k), `${k} devia estar escondido`);
  assert.ok(Object.values(s.cena.elenco).every((m) => m.side !== 'foes'));
});

await teste('T2: na porta da capela, os galeb duhr mandam embora; atacados, a capela chega na 4ª rodada', async () => {
  escolher('atacar');
  const s = templo();
  await s.cena.iniciar();
  await s.ir(s.party[0], { x: 18, y: 17 });
  assert.ok(!s.cena.explorando, 'não começou a luta');
  assert.ok(s.cena.elenco.fremine.side === 'foes' && s.cena.elenco.frowode.side === 'foes');
  assert.equal(s.enc.reinforcements(3), null, 'a capela ainda não');
  const r = s.enc.reinforcements(4);
  assert.deepEqual(r.units.map((u) => u.name).sort(), ['Cameren', 'Honna']);
  naoEscolher();
});

await teste('T3: quem se ajoelha para a Honna é pego de surpresa (o grupo inteiro surpreendido)', async () => {
  escolher('ajoelhar');
  const s = templo();
  await s.cena.iniciar();
  s.t().feito.galebsAvisaram = true;
  await s.ir(s.party[0], { x: 21, y: 18 });
  assert.ok(!s.cena.explorando);
  assert.equal(s.enc.emboscada?.emboscadores, 'foes');
  assert.ok(s.party.every((h) => s.enc.surpreendidos?.has?.(h.id) || s.enc.surpresos?.has?.(h.id)), 'nem todos surpreendidos');
  naoEscolher();
});

await teste('T5: rendido, o grupo sai e as armaduras voltam; quem volta, apanha — e elas não saem da sala', async () => {
  escolher('render');
  const s = templo();
  await s.cena.iniciar();
  await s.ir(s.party[0], { x: 24, y: 9 });
  assert.ok(s.cena.explorando && s.t().feito.t5Rendidos);
  assert.notEqual(salaEmTalhundereth(s.party[0].pos), 'T5', 'não saiu da sala');
  await s.ir(s.party[0], { x: 24, y: 9 });
  assert.ok(!s.cena.explorando && s.cena.elenco.horror.side === 'foes');
  const alc = s.enc.reachableFor({ ...s.cena.elenco.horror, movementLeftFt: 200, pos: { ...s.cena.elenco.horror.pos } });
  assert.ok([...alc.keys()].every((k) => { const [x, y] = k.split(',').map(Number); return salaEmTalhundereth({ x, y }) === 'T5'; }), 'o horror sai da sala');
  naoEscolher();
});

await teste('T7: a emboscada dos mefits e do wight; com Percepção alta, ninguém é surpreendido', async () => {
  const s = templo();
  await s.cena.iniciar();
  for (const h of s.party) h.abilities.wis = 30;
  await s.ir(s.party[0], { x: 29, y: 15 });
  assert.ok(!s.cena.explorando);
  assert.equal(s.enc.emboscada, null, 'notaram: sem emboscada');
  // sem olho bom, a emboscada sai (quatro heróis ainda podem tirar 20: em dez sementes, alguma tem de cair)
  let emboscou = 0;
  for (let seed = 1; seed <= 10; seed++) {
    const s2 = templo({ seed });
    await s2.cena.iniciar();
    for (const h of s2.party) { h.abilities.wis = 1; h.skills = (h.skills ?? []).filter((k) => k !== 'percepcao'); h.expertise = []; }
    await s2.ir(s2.party[0], { x: 29, y: 15 });
    if (s2.enc.emboscada?.emboscadores === 'foes') emboscou++;
  }
  assert.ok(emboscou >= 5, `só ${emboscou} de 10`);
});

await teste('T8: a poeira dá desvantagem; duas fechaduras abertas, a porta do cofre abre; o tesouro tem o símbolo de Dumathoin', async () => {
  const s = templo({ seed: 9 });
  await s.cena.iniciar();
  const h = s.party[1];
  garantirInventario(h).bag.push({ id: 'ferramentasDeLadrao', qtd: 1 });
  h.abilities.dex = 30;
  h.pos = { ...h.pos, x: 30, y: 20 };
  await s.op(T.portaDoCofre, h, /Examinar as fechaduras/).fazer();
  assert.match(s.op(T.portaDoCofre, h, /Abrir uma fechadura/).detalhe, /desvantagem/);
  s.op(T.portaDoCofre, h, /Limpar a poeira/).fazer();
  assert.doesNotMatch(s.op(T.portaDoCofre, h, /Abrir uma fechadura/).detalhe, /desvantagem/);
  for (let i = 0; i < 10 && !s.t().secretas?.includes('cofre'); i++) s.op(T.portaDoCofre, h, /Abrir uma fechadura/)?.fazer();
  assert.ok(s.t().secretas?.includes('cofre'));
  const sc = T.secretas.cofre;
  assert.ok(s.field.passa(sc.a.x, sc.a.y, sc.b.x, sc.b.y));
  h.pos = { ...h.pos, ...T.tesouro };
  await s.op(T.tesouro, h, /Recolher o tesouro/).fazer();
  const bag = garantirInventario(h).bag;
  assert.ok(bag.some((i) => i.id === 'simboloDeDumathoin') && bag.find((i) => i.id === 'moedaDePlatina')?.qtd >= 510);
});

await teste('T4: quem é Pequeno se espreme pelo vão até o cofre; os outros, só tirando as pedras', async () => {
  const s = templo();
  await s.cena.iniciar();
  const { categoriaDeTamanho } = await import(P + 'rules/tamanho.js');
  const pip = s.party.find((h) => categoriaDeTamanho(h) === 1);
  assert.ok(pip, 'o grupo não tem ninguém Pequeno');
  const dara = s.party.find((h) => categoriaDeTamanho(h) === 2);
  dara.pos = { ...dara.pos, ...T.pontaDoVao };
  assert.ok(s.op(T.pontaDoVao, dara, /Espremer/).motivo, 'quem é Médio não cabe');
  pip.pos = { ...pip.pos, ...T.pontaDoVao };
  const o = s.op(T.pontaDoVao, pip, /Espremer/);
  assert.equal(o.motivo, null, `${pip.name} devia caber`);
  o.fazer();
  assert.deepEqual({ x: pip.pos.x, y: pip.pos.y }, T.dentroDoCofre);
  assert.ok(s.field.blocksMove(T.vaoDoCofre.x, T.vaoDoCofre.y), 'o vão já nasce aberto');
  await s.op(T.pontaDoVao, dara, /Tirar as pedras/).fazer();
  assert.ok(!s.field.blocksMove(T.vaoDoCofre.x, T.vaoDoCofre.y) && s.field.passa(T.vaoDoCofre.x, T.vaoDoCofre.y, T.dentroDoCofre.x, T.dentroDoCofre.y));
});

await teste('T16: os elementais não veem quem usa o símbolo de Dumathoin; sozinho com ele na sala, o livro sai sem luta', async () => {
  const s = templo();
  await s.cena.iniciar();
  const h = s.party[2];
  garantirInventario(h).bag.push({ id: 'simboloDeDumathoin', qtd: 1 });
  h.pos = { ...h.pos, ...T.livro };
  await s.op(T.livro, h, /Livro de Granito/).fazer();
  assert.ok(s.cena.explorando, 'brigou sem ninguém para atacar');
  assert.ok(s.t().feito.sabeODisco && garantirInventario(h).bag.some((i) => i.id === 'livroDeGranito'));
  const s2 = templo();
  await s2.cena.iniciar();
  const h2 = s2.party[2];
  garantirInventario(h2).bag.push({ id: 'simboloDeDumathoin', qtd: 1 });
  h2.pos = { ...h2.pos, ...T.livro };
  s2.party[0].pos = { ...s2.party[0].pos, x: 10, y: 39 };
  await s2.op(T.livro, h2, /Livro de Granito/).fazer();
  assert.ok(!s2.cena.explorando);
  assert.ok(s2.cena.elenco.elemental1.ignora?.(h2) && !s2.cena.elenco.elemental1.ignora?.(s2.party[0]));
});

await teste('T20: errar o disco estoura uma vez só; depois de uma hora acerta; com uma gema no centro, a porta da cripta abre', async () => {
  const s = templo({ seed: 3 });
  await s.cena.iniciar();
  const h = s.party[0];
  h.pos = { ...h.pos, ...T.disco };
  const antes = h.hp;
  await s.op(T.disco, h, /Tentar ao acaso/).fazer();
  assert.ok(h.hp < antes, 'o estrondo não feriu');
  const depois = h.hp;
  await s.op(T.disco, h, /Tentar ao acaso/).fazer();
  assert.equal(h.hp, depois, 'estourou duas vezes');
  assert.ok(s.t().feito.discoCerto);
  assert.ok(s.op(T.disco, h, /Pôr uma gema/).motivo, 'sem gema, não dá');
  garantirInventario(h).bag.push({ id: 'gemaPequena', qtd: 1, name: 'Gema pequena' });
  await s.op(T.disco, h, /Pôr uma gema/).fazer();
  const sc = T.secretas.cripta;
  assert.ok(s.field.passa(sc.a.x, sc.a.y, sc.b.x, sc.b.y));
});

await teste('T21: o fragmento vai para o grupo; deixado com o aglomerado vivo, um dia depois os fanáticos o levaram', async () => {
  const s = templo();
  await s.cena.iniciar();
  const h = s.party[0];
  h.pos = { ...h.pos, x: T.fragmento.x, y: T.fragmento.y + 1 };
  await s.op(T.fragmento, h, /fragmento/).fazer();
  assert.ok(s.o6().fragmentos.talhundereth);
  const camp = { obelisco6: { feito: {}, lutas: {}, talh: { feito: { viuFragmento: true, chegou: true }, mortos: [] } }, vila: { pistas: [], dia: 5 } };
  const s2 = templo({ campanha: camp });
  await s2.cena.iniciar();
  const h2 = s2.party[0];
  h2.pos = { ...h2.pos, ...T.saida[1] };
  s2.op(T.saida[1], h2, /Sair/).fazer();
  assert.equal(camp.obelisco6.talh.feito.fragmentoEmRiscoDesde, 5);
  camp.vila.dia = 7;
  const s3 = templo({ campanha: camp });
  await s3.cena.iniciar();
  assert.ok(camp.obelisco6.talh.feito.fragmentoLevado);
  const h3 = s3.party[0];
  h3.pos = { ...h3.pos, x: T.fragmento.x, y: T.fragmento.y + 1 };
  assert.ok(!s3.op(T.fragmento, h3, /fragmento/), 'o fragmento continua no altar');
});

await teste('T15/T18: o Ontharyx subjugado vale o periapto da saúde; morto depois de uma conversa, também', async () => {
  const s = templo();
  await s.cena.iniciar();
  s.t().feito.ontharyxPreso = true;
  const h = s.party[0];
  h.pos = { ...h.pos, x: T.irmaos[0].x, y: T.irmaos[0].y - 1 };
  await s.op(T.irmaos[0], h, /Entregar o Ontharyx/).fazer();
  assert.ok(garantirInventario(h).bag.some((i) => i.id === 'periaptoDaSaude'));
  const s2 = templo();
  await s2.cena.iniciar();
  s2.t().feito.ontharyxMorto = true;
  const h2 = s2.party[0];
  h2.pos = { ...h2.pos, x: T.irmaos[0].x, y: T.irmaos[0].y - 1 };
  assert.ok(!s2.op(T.irmaos[0], h2, /Contar aos filhos/), 'sem ter tentado conversar, não');
  s2.t().feito.falouComOntharyx = true;
  assert.ok(s2.op(T.irmaos[0], h2, /Contar aos filhos/));
});


await teste('o forno: a brasa fica na chama pintada, e apagá-la acende a arte do forno frio (sobreposicaoApagada)', async () => {
  const { MAPA_TALHUNDERETH } = await import(P + 'game/talhundereth-mapa.js');
  const { montarCampo } = await import(P + 'game/campo.js');
  const { mudarFogo, luzNaCasa } = await import(P + 'game/fogo.js');
  const f = montarCampo(MAPA_TALHUNDERETH);
  const luz = luzNaCasa(f, { x: 7, y: 32 });
  assert.ok(luz, 'a brasa saiu do forno');
  const frio = () => f.sobreposicoes.find((o) => o.id === 'fornoApagado').ligada;
  assert.equal(frio(), false);
  assert.ok(mudarFogo(f, luz, false));
  assert.equal(frio(), true, 'apagou a brasa e o desenho seguiu aceso');
  mudarFogo(f, luz, true);
  assert.equal(frio(), false);
});

console.log(`\n${total - falhas}/${total} testes passaram.`);
if (falhas) process.exit(1);
