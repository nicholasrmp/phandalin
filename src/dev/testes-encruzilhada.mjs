// A ENCRUZILHADA DA FORCA (o Obelisco, capítulo 6): as criaturas e o motor que elas pedem, e depois a cena.
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-encruzilhada.mjs
//
// Cada prova foi escrita para FALHAR sem o código que ela mede.
import assert from 'node:assert/strict';

const P = new URL('../', import.meta.url).href;
const { Encounter } = await import(P + 'rules/combat.js');
const { makeParty } = await import(P + 'rules/party.js');
const { makeMonster, MONSTERS } = await import(P + 'rules/monsters.js');
const { Battlefield, distanceFt } = await import(P + 'core/grid.js');
const { makeRng } = await import(P + 'core/rng.js');
const { hasCondition, getCondition, addCondition, removeCondition } = await import(P + 'rules/conditions.js');

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
function montar({ seed = 1, foes = [], pos = null, lado = 'party', nivel = 8 } = {}) {
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

// ------------------------------------------------------------------------------------------- as criaturas ----
await teste('o Qunbraxel tem os números do bloco do Obelisco (ND 9, 5.000 XP, CA 15 com a Armadura Arcana, 112 PV)', () => {
  const d = MONSTERS.qunbraxel;
  assert.deepEqual([d.cr, d.xp, d.ac, d.maxHp], ['9', 5000, 15, 112]);
  assert.ok(d.traits.includes('resistenciaAMagia'));
  assert.equal(d.acoesEspeciais[0].dc, 16);
});

await teste('o elenco inteiro da Encruzilhada existe no jogo', () => {
  for (const id of ['ashenwightFeral', 'diaboAcorrentado', 'grickAlfa', 'grick', 'enrolador', 'chuul', 'xorn', 'elementalDaTerra',
    'yochlol', 'grimlock', 'basilisco', 'qunbraxel']) assert.ok(MONSTERS[id], id);
});

await teste('o tentáculo agarra e, falhada a Inteligência, atordoa ENQUANTO o agarrão dura', () => {
  // procura uma semente em que o tentáculo acerta e o alvo falha a Inteligência
  for (let seed = 1; seed < 200; seed++) {
    const { enc, party, foes } = montar({ seed, foes: [['qunbraxel', { x: 6, y: 5 }]] });
    const [q] = foes;
    const alvo = party[0];
    enc.resolveAttack(q, alvo, { weaponId: 'Tentáculo' });
    if (!hasCondition(alvo, 'atordoado')) continue;
    assert.equal(getCondition(alvo, 'agarrado').source, q.id);
    assert.equal(getCondition(alvo, 'atordoado').data.comOAgarrao, q.id);
    removeCondition(alvo, 'agarrado');
    assert.ok(!hasCondition(alvo, 'atordoado'), 'o atordoado cai junto com o agarrão');
    return;
  }
  assert.fail('nenhuma semente deu agarrão com atordoado');
});

await teste('o atordoado do tentáculo cai quando o Qunbraxel morre (o agarrão de quem morre se solta)', () => {
  for (let seed = 1; seed < 200; seed++) {
    const { enc, party, foes } = montar({ seed, foes: [['qunbraxel', { x: 6, y: 5 }]] });
    const [q] = foes;
    const alvo = party[0];
    enc.resolveAttack(q, alvo, { weaponId: 'Tentáculo' });
    if (!hasCondition(alvo, 'atordoado')) continue;
    enc.applyDamage(q, 999, 'cortante', alvo);
    assert.ok(!hasCondition(alvo, 'agarrado') && !hasCondition(alvo, 'atordoado'));
    return;
  }
  assert.fail('nenhuma semente');
});

await teste('quem passa na Inteligência fica só agarrado; quem não foi agarrado (Grande) nem testa', () => {
  let soAgarrado = false;
  for (let seed = 1; seed < 200 && !soAgarrado; seed++) {
    const { enc, party, foes } = montar({ seed, foes: [['qunbraxel', { x: 6, y: 5 }]] });
    enc.resolveAttack(foes[0], party[0], { weaponId: 'Tentáculo' });
    if (hasCondition(party[0], 'agarrado') && !hasCondition(party[0], 'atordoado')) soAgarrado = true;
  }
  assert.ok(soAgarrado);
  const { enc, foes } = montar({ foes: [['qunbraxel', { x: 6, y: 5 }], ['elementalDaTerra', { x: 7, y: 5 }]] });
  for (let i = 0; i < 20; i++) enc.resolveAttack(foes[0], foes[1], { weaponId: 'Tentáculo' });
  assert.ok(!hasCondition(foes[1], 'agarrado') && !hasCondition(foes[1], 'atordoado'), 'Grande não cabe nos tentáculos');
});

await teste('o Extrair Cérebro só vale contra humanoide atordoado E agarrado por ele, e mata quem zera', () => {
  const { enc, party, foes } = montar({ foes: [['qunbraxel', { x: 6, y: 5 }]] });
  const [q] = foes;
  const alvo = party[0];
  assert.equal(enc.canAttack(q, alvo, 'Extrair Cérebro').ok, false, 'livre, não');
  addCondition(alvo, 'atordoado', { source: 'outro', rounds: 10 });
  assert.equal(enc.canAttack(q, alvo, 'Extrair Cérebro').ok, false, 'só atordoado, não');
  addCondition(alvo, 'agarrado', { source: q.id, rounds: Infinity, data: { escape: 16 } });
  assert.equal(enc.canAttack(q, alvo, 'Extrair Cérebro').ok, true, 'atordoado e agarrado por ele, sim');
  assert.equal(MONSTERS.qunbraxel.attacks.find((a) => a.name === 'Extrair Cérebro').consome, true);
});

await teste('o multiataque: duas Rajadas Místicas, ou o Tentáculo e uma Rajada', () => {
  const { enc, foes } = montar({ foes: [['qunbraxel', { x: 6, y: 5 }]] });
  assert.deepEqual(enc.golpesDoAtaque(foes[0], 'Rajada Mística'), ['Rajada Mística', 'Rajada Mística']);
  assert.deepEqual(enc.golpesDoAtaque(foes[0], 'Tentáculo'), ['Tentáculo', 'Rajada Mística']);
  assert.deepEqual(enc.golpesDoAtaque(foes[0], 'Extrair Cérebro'), ['Extrair Cérebro']);
});


// =============================================================================== a cena, sala a sala ====
const { criarEncruzilhada, salaNaEncruzilhada } = await import(P + 'game/encruzilhada.js');
const { PONTOS_ENCRUZILHADA: G } = await import(P + 'game/encruzilhada-mapa.js');
const { mapaDo } = await import(P + 'game/encounter.js');
const { montarCampo } = await import(P + 'game/campo.js');
const { garantirInventario } = await import(P + 'rules/equipment.js');
const { guardar } = await import(P + 'game/comercio.js');
const { marcosDoCapitulo6 } = await import(P + 'game/obelisco6-marcos.js');
const escolher = (...valores) => { const fila = [...valores]; globalThis.__escolher = (esc) => { const v = fila.length ? fila.shift() : null; return (esc.find((e) => e.valor === v) ?? esc.find((e) => e.primaria) ?? esc[0]).valor; }; };
const naoEscolher = () => { delete globalThis.__escolher; };

function entreposto({ seed = 5, nivel = 8, campanha = null, config = {} } = {}) {
  const mapa = mapaDo('encruzilhada');
  const field = montarCampo(mapa);
  const party = makeParty({ nivel });
  party.forEach((c, i) => { c.pos = { ...c.pos, ...mapa.grupo[i] }; });
  const app = { root: { classList: { add() {}, remove() {} } }, campanha: campanha ?? { obelisco6: { feito: {}, lutas: {} }, vila: { pistas: [], dia: 5 } },
    selected: null, select(c) { this.selected = c; }, firstActive: () => null, refresh() {}, encerrarPartida() { app.fim = true; },
    newEncounter(o) { app.novaCena = o; }, config: {}, abrirRegiao(_a, o) { app.foiParaRegiao = o.onde; } };
  const enc = new Encounter({ battlefield: field, party, foes: [], rng: makeRng(seed), emboscada: null, reinforcements: () => null });
  app.enc = enc;
  const cena = criarEncruzilhada(app, config);
  app.capitulo = cena;
  enc.onEvent = (ev) => cena.evento(ev);
  const ir = async (h, p) => { h.pos = { ...h.pos, ...p }; await cena.depoisDeMover(h); };
  const op = (tile, h, re) => cena.interacoes(tile, enc.field.surfaceAt(tile.x, tile.y), h).find((o) => re.test(o.rotulo));
  return { app, enc, cena, party, field, t: () => app.campanha.obelisco6.encruzilhada, o6: () => app.campanha.obelisco6, ir, op };
}

await teste('a planta: as 25 salas do livro, e o que o roteiro abre nasce fechado (a secreta, a torre, o armário, a barra)', async () => {
  for (let i = 1; i <= 25; i++) assert.ok(G.salas[`G${i}`]?.length, `sem a sala G${i}`);
  const f = montarCampo(mapaDo('encruzilhada'));
  for (const [nome, s] of Object.entries(G.secretas)) assert.ok(!f.passa(s.a.x, s.a.y, s.b.x, s.b.y), `${nome} já nasce aberta`);
  for (const c of G.torreCorredor) assert.ok(f.blocksMove(c.x, c.y), `a torre não tampa ${c.x},${c.y}`);
  for (const c of G.armarioCasas) assert.ok(f.blocksMove(c.x, c.y), `o armário não tampa ${c.x},${c.y}`);
  assert.ok(f.trancas.get(G.portaBarrada.aresta), 'a porta de G11 nasce barrada');
  assert.equal(salaNaEncruzilhada(G.qunbraxel), 'G24');
  assert.equal(salaNaEncruzilhada(G.fragmento), 'G25');
  assert.equal(salaNaEncruzilhada(G.zuluthl), 'G20');
});

await teste('a água: a passagem de G7 é funda; G16, G17 e G22 são rasos (terreno difícil, não se nada)', async () => {
  const f = montarCampo(mapaDo('encruzilhada'));
  const sups = (sala) => new Set(G.salas[sala].map((c) => f.surfaceAt(c.x, c.y)));
  assert.ok(sups('G16').has('aguaRasa') && sups('G17').has('aguaRasa') && sups('G22').has('aguaRasa'));
  assert.ok(sups('G7').has('poco'), 'a passagem submersa');
  const c = G.salas.G16.find((q) => f.surfaceAt(q.x, q.y) === 'aguaRasa');
  assert.equal(f.tiles[c.y * f.w + c.x], 2, 'água rasa é terreno difícil');
});

await teste('a chegada: o que está à vista fica no tabuleiro; o grick alfa, os gricks e os enroladores se escondem', async () => {
  naoEscolher();
  const s = entreposto();
  await s.cena.iniciar();
  assert.ok(s.cena.explorando);
  const no = (k) => s.enc.combatants.includes(s.cena.elenco[k]);
  for (const k of ['ashenwight1', 'vakketar', 'zoklork', 'chuul1', 'zuluthl', 'qunbraxel']) assert.ok(no(k), `${k} devia estar no tabuleiro`);
  for (const k of ['grickAlfa', 'grick1', 'enrolador1']) assert.ok(!no(k), `${k} devia estar escondido`);
});

await teste('G12: o ataque contra quem está na sala embaçada tem desvantagem; percepção às cegas vê através', async () => {
  const s = entreposto();
  await s.cena.iniciar();
  const dentro = G.salas.G12.find((c) => !s.field.blocksMove(c.x, c.y) && !s.field.blocksMove(c.x, c.y + 1));
  const [h] = s.party;
  const alvo = s.cena.elenco.zoklork;
  alvo.pos = { ...alvo.pos, x: dentro.x, y: dentro.y };
  h.pos = { ...h.pos, x: dentro.x, y: dentro.y + 1 };
  const motivos = () => JSON.stringify(s.enc.attackModifiers(h, alvo));
  assert.match(motivos(), /embaçada/, 'sem a desvantagem da sala');
  h.senses = { ...(h.senses ?? {}), blindsightFt: 30 };
  assert.doesNotMatch(motivos(), /embaçada/);
});

await teste('G8: o grick alfa ataca; ferido pela primeira vez, chama os seis gricks de G9', async () => {
  naoEscolher();
  const s = entreposto();
  await s.cena.iniciar();
  await s.ir(s.party[0], { x: G.grickAlfa.x - 3, y: G.grickAlfa.y });
  assert.ok(!s.cena.explorando, 'a luta não começou');
  assert.equal(s.cena.elenco.grickAlfa.side, 'foes');
  assert.equal(s.enc.reinforcements(2), null, 'sem ferida, ninguém vem');
  s.cena.elenco.grickAlfa.hp -= 5;
  const r = s.enc.reinforcements(2);
  assert.equal(r.units.length, 6);
  assert.equal(s.enc.reinforcements(3), null, 'chama uma vez só');
});

await teste('G10: morto um enrolador, o outro recua para dentro da sala embaçada', async () => {
  const s = entreposto();
  await s.cena.iniciar();
  await s.ir(s.party[0], { x: 46, y: 14 });
  assert.ok(!s.cena.explorando);
  const [a, b] = [s.cena.elenco.enrolador1, s.cena.elenco.enrolador2];
  s.enc.applyDamage(a, 999, 'cortante', s.party[0]);
  assert.equal(salaNaEncruzilhada(b.pos), 'G12');
});

await teste('G11: do lado de dentro, a barra sai com a mão; de fora, não', async () => {
  const s = entreposto();
  await s.cena.iniciar();
  const [h] = s.party;
  h.pos = { ...h.pos, ...G.portaBarrada.deDentro };
  assert.ok(!s.op(G.portaBarrada.deFora, h, /barra/), 'de fora não se tira a barra com a mão');
  s.op(G.portaBarrada.deDentro, h, /barra/).fazer();
  assert.ok(!s.field.trancas.get(G.portaBarrada.aresta));
});

await teste('G14: as ametistas compram a palavra; dita, a torre encolhe, o corredor do cofre abre e o Qunbraxel se muda', async () => {
  escolher('dar');
  const s = entreposto();
  await s.cena.iniciar();
  guardar(s.party[0], 'ametistaDoEnrolador', 8);
  await s.ir(s.party[0], { x: G.zoklork.x, y: G.zoklork.y + 2 });
  assert.ok(s.t().feito.sabeAPalavra, 'o Zoklork não contou');
  assert.ok(!garantirInventario(s.party[0]).bag.some((i) => i.id === 'ametistaDoEnrolador'), 'as ametistas ficaram');
  naoEscolher();
  await s.op(G.torre, s.party[0], /palavra/).fazer();
  for (const c of G.torreCorredor) assert.ok(!s.field.blocksMove(c.x, c.y));
  assert.ok(s.t().feito.qunbraxelNoCofre);
  assert.equal(salaNaEncruzilhada(s.cena.elenco.qunbraxel.pos), 'G25');
  assert.ok(garantirInventario(s.party[0]).bag.some((i) => i.id === 'torreLamacenta'));
});

await teste('G14: sem a palavra, o cascalho das estátuas de G21 também encolhe a torre', async () => {
  const s = entreposto();
  await s.cena.iniciar();
  s.party[0].pos = { ...s.party[0].pos, ...G.estatuas[0] };
  s.op(G.estatuas[0], s.party[0], /cascalho/).fazer();
  const o = s.op(G.torre, s.party[0], /cascalho/);
  assert.ok(o, 'sem a opção do cascalho');
  await o.fazer();
  assert.ok(s.t().feito.torreEncolhida);
});

await teste('G19 e G16: o armário sai da frente da porta, e a secreta da câmara alagada se abre', async () => {
  const s = entreposto({ seed: 3 });
  await s.cena.iniciar();
  const [h] = s.party;
  h.pos = { ...h.pos, x: G.armario.x + 2, y: G.armario.y };
  await s.op(G.armario, h, /armário/).fazer();
  for (const c of G.armarioCasas) assert.ok(!s.field.blocksMove(c.x, c.y));
  const sec = G.secretas.escadaDoSantuario;
  h.pos = { ...h.pos, ...sec.b };
  s.op(sec.b, h, /painel/).fazer();
  assert.ok(s.field.passa(sec.a.x, sec.a.y, sec.b.x, sec.b.y));
});

await teste('G22: o mofo marrom é região que fere; o fogo o faz crescer e o frio o mata', async () => {
  const s = entreposto();
  await s.cena.iniciar();
  const r = s.field.regioes.find((x) => x.id === 'mofoMarrom');
  assert.ok(r && r.casas.size > 4);
  const antes = r.casas.size;
  s.cena.evento({ type: 'spell', spell: { damageType: 'fogo' }, areaTiles: [G.mofo[0]] });
  assert.ok(r.casas.size > antes, 'o fogo não fez crescer');
  s.cena.evento({ type: 'spell', spell: { damageType: 'frio' }, areaTiles: [G.mofo[0]] });
  assert.ok(r.desligada, 'o frio não matou');
});

await teste('G25: o fragmento vai para o grupo; deixado para trás com o Qunbraxel vivo, ele o leva', async () => {
  const s = entreposto();
  await s.cena.iniciar();
  s.t().feito.viuFragmento = true;
  s.op(G.saida[1], { ...s.party[0], pos: G.saida[1] }, /Subir/).fazer();
  assert.ok(s.t().feito.fragmentoLevado, 'com o Qunbraxel vivo, o fragmento devia ir embora');
  const s2 = entreposto();
  await s2.cena.iniciar();
  const h = s2.party[0];
  h.pos = { ...h.pos, ...G.fragmento };
  await s2.op(G.fragmento, h, /fragmento/).fazer();
  assert.ok(s2.o6().fragmentos.encruzilhada);
});

await teste('os marcos do capítulo 6: o 8º no primeiro guardião (Talhundereth ou Encruzilhada), o 9º com os três', async () => {
  const o6 = {};
  assert.deepEqual(marcosDoCapitulo6(o6, 'cripta'), [], 'a cripta sozinha não dá o 8º');
  assert.deepEqual(marcosDoCapitulo6(o6, 'encruzilhada'), [8]);
  assert.deepEqual(marcosDoCapitulo6(o6, 'talhundereth'), [9]);
  assert.deepEqual(marcosDoCapitulo6(o6, 'talhundereth'), [], 'cada marco uma vez só');
});

await teste('a passagem: a fenda de G11 sobe a Talhundereth, e quem desce de lá chega por ela', async () => {
  const s = entreposto({ config: { chegada: 'talhundereth' } });
  await s.cena.iniciar();
  assert.ok(G.fendaDeTalhundereth.some((p) => Math.abs(p.x - s.party[0].pos.x) <= 2 && Math.abs(p.y - s.party[0].pos.y) <= 2), 'quem desce de Talhundereth chega pela fenda');
  s.op(G.fendaDeTalhundereth[0], { ...s.party[0], pos: G.fendaDeTalhundereth[0] }, /Talhundereth/).fazer();
  assert.equal(s.app.novaCena.cenaDaVila, 'talhundereth');
  assert.equal(s.app.novaCena.chegada, 'encruzilhada');
});


// ========================================================== as correções da revisão (revisoes/encruzilhada-2026-11-11) ====
const { takeMonsterTurn } = await import(P + 'rules/ai.js');

await teste('a Rajada Mental não pega o aliado neutro que espera a vez (a guarda do Qunbraxel)', async () => {
  let usou = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const { enc, party, foes } = montar({ seed, foes: [['qunbraxel', { x: 5, y: 2 }]], lado: 'foes', pos: [{ x: 5, y: 9 }, { x: 13, y: 13 }, { x: 0, y: 13 }, { x: 13, y: 0 }] });
    // sem a conjuração, que ele usaria primeiro (o Dominar Monstro): o que se mede é a escolha da área
    foes[0].spellcasting = null;
    const guarda = [makeMonster('grimlock', { x: 5, y: 5 }), makeMonster('grimlock', { x: 4, y: 6 }), makeMonster('grimlock', { x: 6, y: 6 })];
    for (const g of guarda) { g.side = 'neutro'; enc.addCombatant(g); }
    const antes = guarda.map((g) => g.hp);
    const especial = enc.usarAcaoEspecial.bind(enc);
    enc.usarAcaoEspecial = (m, a, alvo) => { if (a.nome === 'Rajada Mental') usou += 1; return especial(m, a, alvo); };
    takeMonsterTurn(enc, foes[0]);
    guarda.forEach((g, i) => assert.equal(g.hp, antes[i], `semente ${seed}: a Rajada pegou a própria guarda`));
  }
  assert.equal(usou, 0, 'com três da guarda e um herói no cone, o Qunbraxel não devia soltar a Rajada');
});

await teste('G23: a boca sul do corredor não dispara a luta; ver o Qunbraxel pelas seteiras, sim', async () => {
  const s = entreposto();
  await s.cena.iniciar();
  await s.ir(s.party[0], { x: 54, y: 56 });
  assert.ok(s.cena.explorando, 'a luta começou na boca sul, sem ninguém ver ninguém');
  const janela = G.salas.G23.find((c) => c.x === 60 && c.y === 48);
  await s.ir(s.party[0], janela);
  assert.ok(!s.cena.explorando, 'vendo o Qunbraxel pelas seteiras, a luta devia começar');
  assert.equal(s.cena.elenco.qunbraxel.side, 'foes');
  // a guarda sai pela porta da sala, e não do meio dela
  const r = s.enc.reinforcements(3);
  assert.ok(r?.units?.length === 4);
  for (const g of r.units) assert.ok(distanceFt(g.pos, G.portaDaGuarda) <= 15, `${g.name} apareceu longe da porta`);
});

await teste('G14: atacar é atacar o Zoklork; os elementais não entram na briga dele', async () => {
  escolher('atacar');
  const s = entreposto();
  await s.cena.iniciar();
  await s.ir(s.party[0], { x: G.zoklork.x, y: G.zoklork.y + 2 });
  naoEscolher();
  assert.ok(!s.cena.explorando);
  assert.equal(s.cena.elenco.zoklork.side, 'foes');
  assert.ok(s.cena.elenco.elemental1.side !== 'foes' && s.cena.elenco.elemental2.side !== 'foes');
});

await teste('G10: a surpresa dos enroladores sai das rolagens de Furtividade deles, herói a herói', async () => {
  const s = entreposto();
  await s.cena.iniciar();
  await s.ir(s.party[0], { x: 46, y: 14 });
  const f = s.enc.emboscada?.furtividade ?? [];
  assert.equal(f.length, 2, 'devia levar a Furtividade dos dois');
  assert.ok(f.every((v) => v < 99), 'não pode ser a surpresa de todos ou ninguém');
});

console.log(`\n${total - falhas}/${total} passaram`);
if (falhas) process.exit(1);
