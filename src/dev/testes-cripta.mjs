// A CRIPTA DOS TALHUND (o Obelisco, capítulo 6): as criaturas novas no motor, e depois a cena.
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-cripta.mjs
//
// Cada prova foi escrita para FALHAR sem o código que ela mede.
import assert from 'node:assert/strict';

const P = new URL('../', import.meta.url).href;
const { Encounter } = await import(P + 'rules/combat.js');
const { makeParty } = await import(P + 'rules/party.js');
const { makeMonster, MONSTERS } = await import(P + 'rules/monsters.js');
const { Battlefield, distanceFt } = await import(P + 'core/grid.js');
const { makeRng } = await import(P + 'core/rng.js');
const { hasCondition, getCondition, addCondition } = await import(P + 'rules/conditions.js');

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

await teste('os oito blocos da cripta têm os números do livro (ND, XP, CA, PV)', () => {
  const linha = (id) => { const d = MONSTERS[id]; return [d.cr, d.xp, d.ac, d.maxHp]; };
  assert.deepEqual(linha('revenant'), ['5', 1800, 13, 136]);
  assert.deepEqual(linha('hidra'), ['8', 3900, 15, 172]);
  assert.deepEqual(linha('aguaViva'), ['3', 700, 13, 58]);
  assert.deepEqual(linha('golemDeArgila'), ['9', 5000, 14, 133]);
  assert.deepEqual(linha('fantasma'), ['4', 1100, 11, 45]);
  assert.deepEqual(linha('mumia'), ['3', 700, 11, 58]);
  assert.deepEqual(linha('esqueletoAnao'), ['1/2', 100, 13, 26]);
  assert.deepEqual(linha('gnomoDasProfundezas'), ['1/2', 100, 15, 16]);
  assert.equal(makeMonster('hidra', { x: 0, y: 0 }).pos.f, 3, 'a hidra é Enorme');
});

await teste('o revenant se refaz 10 por turno; fogo ou radiante suspendem um turno', () => {
  const { enc, party, foes } = montar({ foes: [['revenant', { x: 8, y: 5 }]], lado: 'foes' });
  const r = foes[0];
  r.hp = 100;
  enc.inicioDoTurnoDoBloco(r);
  assert.equal(r.hp, 110);
  enc.applyDamage(r, 5, 'fogo', party[0], { magico: true });
  enc.inicioDoTurnoDoBloco(r);
  assert.equal(r.hp, 105, 'o fogo suspendeu');
  enc.inicioDoTurnoDoBloco(r);
  assert.equal(r.hp, 115, 'e no turno seguinte volta');
});

await teste('o olhar vingativo paralisa; o golpe do próprio revenant tira a paralisia', () => {
  let paralisou = false;
  for (let seed = 1; seed <= 30 && !paralisou; seed++) {
    const { enc, party, foes } = montar({ seed, foes: [['revenant', { x: 8, y: 5 }]], lado: 'foes' });
    const h = party[0];
    enc.olharVingativo(foes[0], h);
    if (hasCondition(h, 'paralisado')) {
      paralisou = true;
      enc.applyDamage(h, 3, 'concussão', foes[0]);
      assert.ok(!hasCondition(h, 'paralisado'), 'ferido por ele, a paralisia devia acabar');
    }
  }
  assert.ok(paralisou);
});

await teste('a hidra morde uma vez por cabeça; 25 de dano num turno arrancam uma, e duas nascem no fim do turno dela — menos depois de fogo', () => {
  const { enc, party, foes } = montar({ foes: [['hidra', { x: 8, y: 4 }]], lado: 'party' });
  const h = foes[0];
  assert.equal(enc.golpesDoAtaque(h, 'Mordida').length, 5);
  enc.applyDamage(h, 30, 'cortante', party[0]);
  assert.equal(h.cabecas, 4);
  enc.applyDamage(h, 30, 'cortante', party[0]);
  assert.equal(h.cabecas, 4, 'uma cabeça por turno');
  const pv = h.hp;
  enc.endTurn(h);
  assert.equal(h.cabecas, 6);
  assert.equal(h.hp, pv + 20);
  // fogo: não cresce
  enc.beginSide('party');
  enc.applyDamage(h, 26, 'fogo', party[0], { magico: true });
  assert.equal(h.cabecas, 5);
  enc.endTurn(h);
  assert.equal(h.cabecas, 5, 'queimada, não cresce');
});

await teste('a hidra morre sem cabeça nenhuma', () => {
  const { enc, party, foes } = montar({ foes: [['hidra', { x: 8, y: 4 }]] });
  const h = foes[0];
  h.cabecas = 1;
  enc.applyDamage(h, 25, 'cortante', party[0]);
  assert.ok(h.dead);
});

await teste('o golpe de perto alcança o que o bloco diz: a mordida de 3 m do dragão verde e a constrição de 3 m (antes, 1,5 m para todos)', () => {
  const { enc, party, foes } = montar({ foes: [['dragaoVerdeJovem', { x: 8, y: 5 }], ['aguaViva', { x: 8, y: 9 }]], pos: [{ x: 6, y: 5 }, { x: 6, y: 9 }, { x: 1, y: 3 }, { x: 1, y: 12 }], lado: 'foes' });
  assert.ok(enc.canAttack(foes[0], party[0], 'Mordida').ok, 'a mordida de 3 m não alcança 3 m');
  assert.ok(!enc.canAttack(foes[0], party[0], 'Garra').ok, 'a garra é de 1,5 m');
  assert.ok(enc.canAttack(foes[1], party[1], 'Constrição').ok);
});

await teste('a água viva aperta e puxa 1,5 m para ela; quem é Grande não é apertado', () => {
  let puxou = false;
  for (let seed = 1; seed <= 30 && !puxou; seed++) {
    const { enc, party, foes } = montar({ seed, foes: [['aguaViva', { x: 8, y: 5 }]], pos: [{ x: 6, y: 5 }, { x: 1, y: 1 }, { x: 1, y: 3 }, { x: 1, y: 12 }], lado: 'foes' });
    const r = enc.resolveAttack(foes[0], party[0], { weaponId: 'Constrição' });
    if (r?.hit) {
      puxou = true;
      assert.equal(party[0].pos.x, 7, 'não foi puxado');
      assert.ok(hasCondition(party[0], 'contido'));
    }
  }
  assert.ok(puxou);
});

await teste('o golem de argila: o ácido o cura, arma comum não o fere, arma mágica sim; a Pressa dá +2 de CA', () => {
  const { enc, party, foes } = montar({ foes: [['golemDeArgila', { x: 8, y: 5 }]], lado: 'foes' });
  const g = foes[0];
  g.hp = 100;
  enc.applyDamage(g, 10, 'ácido', party[0], { magico: true });
  assert.equal(g.hp, 110);
  enc.applyDamage(g, 10, 'cortante', party[0], { deArma: true });
  assert.equal(g.hp, 110, 'arma comum passou');
  enc.applyDamage(g, 10, 'cortante', party[0], { deArma: true, magico: true });
  assert.equal(g.hp, 100, 'arma mágica não passou');
  party[0].pos = { ...party[0].pos, x: 7, y: 5 };
  enc.inicioDoTurnoDoBloco(g);
  assert.ok(hasCondition(g, 'pressaDoGolem') && g.pancadaDaPressa);
});

await teste('a múmia: o olhar amedronta; a podridão tira a cura', () => {
  let medo = false;
  for (let seed = 1; seed <= 30 && !medo; seed++) {
    const { enc, party, foes } = montar({ seed, foes: [['mumia', { x: 8, y: 5 }]], lado: 'foes' });
    enc.olharTerrivel(foes[0], party[0]);
    if (hasCondition(party[0], 'amedrontado')) medo = true;
  }
  assert.ok(medo);
  const { enc, party } = montar({});
  addCondition(party[0], 'podridaoDaMumia');
  party[0].hp = 10;
  enc.heal(party[0], 10, party[1]);
  assert.equal(party[0].hp, 10, 'curou com a podridão');
});

await teste('o fantasma possui: o corpo ataca um aliado no começo do turno dele; o corpo caído, a posse acaba', () => {
  let possuiu = false;
  for (let seed = 1; seed <= 40 && !possuiu; seed++) {
    const { enc, party, foes, texto } = montar({ seed, foes: [['fantasma', { x: 6, y: 5 }]], pos: [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 1, y: 3 }, { x: 1, y: 12 }], lado: 'foes' });
    const f = foes[0];
    const h = party[0];
    enc.possuir(f, h);
    if (!hasCondition(h, 'possuido')) continue;
    possuiu = true;
    assert.ok(f.possuindo === h.id && hasCondition(f, 'etereo'), 'o fantasma devia sumir no corpo');
    enc.inicioDoTurnoDoBloco(h);
    assert.match(texto(), /usa o corpo de/);
    h.hp = 0;
    enc.fimDaPosse(h);
    assert.ok(!hasCondition(h, 'possuido') && !hasCondition(f, 'etereo'));
    assert.ok(h.imuneAPossessao.includes(f.id));
  }
  assert.ok(possuiu);
});

// =============================================================================== a cena, sala a sala ====
const { criarCriptaTalhund, salaNaCripta } = await import(P + 'game/cripta-talhund.js');
const { PONTOS_CRIPTA: C } = await import(P + 'game/cripta-mapa.js');
const { mapaDo } = await import(P + 'game/encounter.js');
const { montarCampo } = await import(P + 'game/campo.js');
const { garantirInventario } = await import(P + 'rules/equipment.js');
const escolher = (...valores) => { const fila = [...valores]; globalThis.__escolher = (esc) => { const v = fila.length ? fila.shift() : null; return (esc.find((e) => e.valor === v) ?? esc.find((e) => e.primaria) ?? esc[0]).valor; }; };
const naoEscolher = () => { delete globalThis.__escolher; };

function cripta({ seed = 5, nivel = 8, campanha = null } = {}) {
  const mapa = mapaDo('criptaTalhund');
  const field = montarCampo(mapa);
  const party = makeParty({ nivel });
  party.forEach((c, i) => { c.pos = { ...c.pos, ...mapa.grupo[i] }; });
  const app = { root: { classList: { add() {}, remove() {} } }, campanha: campanha ?? { obelisco6: { feito: {}, lutas: {} }, vila: { pistas: [], dia: 5 } },
    selected: null, select(c) { this.selected = c; }, firstActive: () => null, refresh() {}, encerrarPartida() { app.fim = true; },
    irParaVila() {}, newEncounter(cfg) { app.foiPara = cfg.cenaDaVila; }, config: {} };
  const enc = new Encounter({ battlefield: field, party, foes: [], rng: makeRng(seed), emboscada: null, reinforcements: () => null });
  app.enc = enc;
  const cena = criarCriptaTalhund(app, {});
  app.capitulo = cena;
  const ir = async (h, p) => { h.pos = { ...h.pos, ...p }; await cena.depoisDeMover(h); };
  const op = (tile, h, re) => cena.interacoes(tile, enc.field.surfaceAt(tile.x, tile.y), h).find((o) => re.test(o.rotulo));
  return { app, enc, cena, party, field, t: () => app.campanha.obelisco6.cripta, o6: () => app.campanha.obelisco6, ir, op };
}

await teste('a cripta: as salas do livro estão na planta; as três secretas, o anel do santuário e a parede que desliza nascem fechados', async () => {
  for (const s of ['P1', 'P2', 'P3', 'P4o', 'P4s', 'P4l', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10', 'P11', 'P11a', 'P12', 'P13', 'P14', 'P15', 'P16', 'P17', 'P18']) {
    assert.ok(C.salas[s]?.length, `sem a sala ${s}`);
  }
  const f = montarCampo(mapaDo('criptaTalhund'));
  for (const [nome, s] of Object.entries(C.secretas)) assert.ok(!f.passa(s.a.x, s.a.y, s.b.x, s.b.y), `${nome} nasce aberta`);
  for (const c of Object.values(C.anel).flat()) assert.ok(f.blocksMove(c.x, c.y), 'o anel nasce aberto');
  for (const c of C.paredeQueDesliza) assert.ok(f.blocksMove(c.x, c.y), 'a parede nasce aberta');
  assert.equal(salaNaCripta(C.fragmento) ?? salaNaCripta({ x: C.fragmento.x, y: C.fragmento.y + 1 }), 'P18');
  assert.ok(C.agua.length >= 20, 'a água de P5');
});

await teste('a chegada: o que o livro põe à vista fica no tabuleiro; o que dorme (nos sarcófagos, nas lajes, nos entalhes) não', async () => {
  naoEscolher();
  const s = cripta();
  await s.cena.iniciar();
  const no = (k) => s.enc.combatants.includes(s.cena.elenco[k]);
  for (const k of ['hidra', 'golem', 'revP15_0', 'guardiao']) assert.ok(no(k), `${k} devia estar à vista`);
  for (const k of ['revP1_0', 'fundadora', 'valente0', 'fantasma0', 'wraith0', 'mumia', 'espectro0']) assert.ok(!no(k), `${k} devia estar escondido`);
  assert.ok(s.enc.combatants.includes(s.cena.rivibiddel) && s.cena.rivibiddel.side === 'neutro');
  assert.equal(s.cena.elenco.guardiao.amuletoCom, s.cena.elenco.mumia.id, 'o guardião protege o arquiteto');
});

await teste('P1: quem tenta sair pela passagem oeste solta os quatro guardiões; destruídos, voltam um dia depois — menos com a cripta em paz', async () => {
  const s = cripta();
  await s.cena.iniciar();
  await s.ir(s.party[0], C.saidaOesteP1[0]);
  assert.ok(!s.cena.explorando);
  const revs = s.enc.combatants.filter((c) => c.defId === 'revenant' && c.side === 'foes');
  assert.equal(revs.length, 4);
  for (const r of revs) r.dead = true;
  await s.cena.fimDoCombate('vitoria');
  const camp = s.app.campanha;
  assert.equal(camp.obelisco6.cripta.mortos.filter((k) => k.startsWith('revP1')).length, 4);
  // no mesmo dia, mortos; no dia seguinte, de volta
  const mesmoDia = cripta({ campanha: camp });
  assert.ok(!mesmoDia.cena.elenco.revP1_0, 'voltou no mesmo dia');
  camp.vila.dia = 6;
  const outroDia = cripta({ campanha: camp });
  assert.ok(outroDia.cena.elenco.revP1_0, 'não voltou um dia depois');
  // em paz, não voltam
  const camp2 = { obelisco6: { feito: {}, lutas: {}, cripta: { feito: { chegou: true }, mortos: ['revP1_0'], renascem: { revP1_0: 1 }, apagadas: ['P2', 'P6', 'P7', 'P11', 'P16'], ajudaram: [], ladroes: [], vistas: [] } }, vila: { pistas: [], dia: 9 } };
  assert.ok(!cripta({ campanha: camp2 }).cena.elenco.revP1_0, 'em paz, voltou');
});

await teste('P11: quatro valentes ao entrar, e mais dois a cada rodada até os catorze', async () => {
  const s = cripta();
  await s.cena.iniciar();
  await s.ir(s.party[0], { x: 17, y: 11 });
  assert.equal(s.enc.combatants.filter((c) => c.defId === 'esqueletoAnao' && c.side === 'foes').length, 4);
  let entraram = 4;
  for (let r = 2; r <= 10; r++) entraram += s.enc.reinforcements(r)?.units.length ?? 0;
  assert.equal(entraram, 14);
});

await teste('as duas alavancas: sozinha, não se move; juntas, o santuário gira e a parede sobe — e os abençoados saem caçando', async () => {
  const s = cripta();
  await s.cena.iniciar();
  const [a, b] = s.party;
  a.pos = { ...a.pos, x: C.alavancaP9.x - 1, y: C.alavancaP9.y };
  await s.op(C.alavancaP9, a, /Puxar a alavanca/).fazer();
  assert.ok(!s.t().feito.girou);
  b.pos = { ...b.pos, x: C.alavancaP13.x, y: C.alavancaP13.y + 1 };
  await s.op(C.alavancaP13, b, /Puxar a alavanca/).fazer();
  assert.ok(s.t().feito.girou);
  for (const c of Object.values(C.anel).flat()) assert.ok(!s.field.blocksMove(c.x, c.y), 'o anel não abriu');
  for (const c of C.paredeQueDesliza) assert.ok(!s.field.blocksMove(c.x, c.y), 'a parede não subiu');
  const [p, q] = C.arestasDoGiro[0];
  assert.ok(s.field.passa(p.x, p.y, q.x, q.y));
  assert.ok(!s.cena.explorando && s.enc.combatants.filter((c) => c.defId === 'revenant' && c.side === 'foes').length === 6);
});

await teste('o Rivibiddel, ajudado, puxa a alavanca de P9 enquanto um herói puxa a de P13', async () => {
  escolher('ajudar');
  const s = cripta();
  await s.cena.iniciar();
  const g = s.cena.rivibiddel;
  s.party[0].pos = { ...s.party[0].pos, x: g.pos.x, y: g.pos.y - 1 };
  await s.op(g.pos, s.party[0], /Falar com o gnomo/).fazer();
  assert.ok(s.t().feito.rivibiddelAjudado);
  const b = s.party[1];
  b.pos = { ...b.pos, x: C.alavancaP13.x, y: C.alavancaP13.y + 1 };
  await s.op(C.alavancaP13, b, /Puxar a alavanca/).fazer();
  assert.ok(s.t().feito.girou);
  naoEscolher();
});

await teste('Invocar Dumathoin (Religião 14) em P13 para os três fantasmas de uma vez', async () => {
  const s = cripta();
  await s.cena.iniciar();
  await s.ir(s.party[0], { x: 17, y: 6 });
  assert.ok(!s.cena.explorando);
  const h = s.party[0];
  h.abilities.wis = 30; h.abilities.int = 30;
  h.actionUsed = false;
  const o = s.cena.interacoesDoHeroi(h).find((x) => /Invocar Dumathoin/.test(x.rotulo));
  assert.ok(o, 'sem a opção');
  for (let i = 0; i < 6 && s.enc.combatants.some((c) => c.defId === 'fantasma' && c.side === 'foes'); i++) { h.actionUsed = false; await o.fazer(); }
  assert.ok(s.enc.combatants.filter((c) => c.defId === 'fantasma').every((c) => c.parado && c.side === 'neutro'));
});

await teste('a purificação: as cinco assombrações apagadas e os fantasmas vencidos; a bênção vai para quem ajudou e não roubou', async () => {
  const s = cripta();
  await s.cena.iniciar();
  const [a, b] = s.party;
  // b tira as gemas dos mortos de P8
  b.pos = { ...b.pos, x: C.corposP8[0].x, y: C.corposP8[0].y + 1 };
  await s.op(C.corposP8[0], b, /Tirar as gemas/).fazer();
  const t = s.t();
  t.ajudaram.push(a.id, b.id);
  t.apagadas.push('P2', 'P6', 'P7', 'P11');
  t.feito.fantasmasVencidos = true;
  // a última: P7 já, então P16 pela múmia — direto
  t.apagadas.push('P16');
  // conferir pela via de uma assombração apagada de novo: destruir o esqueleto de P7 não faz nada (já apagada), então chamamos a P6 pelo crânio e pela porta
  t.apagadas.splice(t.apagadas.indexOf('P6'), 1);
  a.pos = { ...a.pos, x: C.cranio.x + 1, y: C.cranio.y };
  t.feito.portaConsertada = true;
  await s.op(C.cranio, a, /Tirar o crânio/).fazer();
  assert.ok(t.feito.purificada, 'não purificou');
  assert.ok(a.bencaoDeDumathoin && !b.bencaoDeDumathoin, 'a bênção foi para o ladrão');
});

await teste('P18: tocar o fragmento solta quatro espectros, e mais um por rodada até sete; purificada, o fragmento vem direto', async () => {
  const s = cripta();
  await s.cena.iniciar();
  const h = s.party[0];
  h.pos = { ...h.pos, x: C.fragmento.x - 1, y: C.fragmento.y };
  await s.op(C.fragmento, h, /fragmento/).fazer();
  assert.equal(s.enc.combatants.filter((c) => c.defId === 'espectro' && c.side === 'foes').length, 4);
  let mais = 0;
  for (let r = 2; r <= 8; r++) mais += s.enc.reinforcements(r)?.units.length ?? 0;
  assert.equal(mais, 3);
  const camp = { obelisco6: { feito: {}, lutas: {}, cripta: { feito: { chegou: true }, mortos: [], apagadas: ['P2', 'P6', 'P7', 'P11', 'P16'], ajudaram: [], ladroes: [], vistas: [] } }, vila: { pistas: [] } };
  const s2 = cripta({ campanha: camp });
  await s2.cena.iniciar();
  const h2 = s2.party[0];
  h2.pos = { ...h2.pos, x: C.fragmento.x - 1, y: C.fragmento.y };
  await s2.op(C.fragmento, h2, /fragmento/).fazer();
  assert.ok(s2.o6().fragmentos.cripta && s2.cena.explorando);
});

await teste('P6: a assombração pede as duas coisas — a porta consertada E o crânio tirado', async () => {
  const s = cripta();
  await s.cena.iniciar();
  const h = s.party[0];
  h.pos = { ...h.pos, x: C.cranio.x + 1, y: C.cranio.y };
  await s.op(C.cranio, h, /Tirar o crânio/).fazer();
  assert.ok(!s.t().apagadas.includes('P6'), 'só o crânio não basta');
  assert.ok(s.op(C.portaTorta, h, /Consertar a porta/).motivo, 'sem ferramentas de pedreiro, não');
});

await teste('a escada sobe de volta a Talhundereth, e o "Descer à Cripta" de lá abre esta cena', async () => {
  const s = cripta();
  await s.cena.iniciar();
  const h = s.party[0];
  h.pos = { ...h.pos, ...C.escada[2] };
  s.op(C.escada[2], h, /Subir a Talhundereth/).fazer();
  assert.equal(s.app.foiPara, 'talhundereth');
  const fonte = (await import('node:fs')).readFileSync(new URL('game/talhundereth.js', P), 'utf8');
  assert.match(fonte, /cenaDaVila: 'criptaTalhund'/);
});


// ===================================================== o que tinha ficado de fora, agora no jogo ====
const { paineis } = await import(P + 'dev/cena-node/stub-narrativa.mjs');
const { descansoLongo } = await import(P + 'rules/descanso.js');
const { SPELLS } = await import(P + 'rules/spells.js');
const { textoDaAssombracao } = await import(P + 'game/cripta-talhund.js');

await teste('as assombrações são o d6 do livro, e a quinta põe um herói sorteado no chão', () => {
  const vistos = new Set();
  const rng = makeRng(3);
  const herois = makeParty({ nivel: 8 });
  for (let i = 0; i < 300; i++) vistos.add(textoDaAssombracao(rng, herois));
  assert.equal(vistos.size >= 6, true, `só ${vistos.size} textos — a tabela é de seis`);
  const quinta = [...vistos].find((t) => /alto da cabeça aberto/.test(t));
  assert.ok(quinta && herois.some((h) => quinta.includes(h.name)) && !quinta.includes('{quem}'));
});

await teste('o descanso longo na cripta traz uma assombração que não se apaga; purificada, não traz nada', async () => {
  const s = cripta();
  await s.cena.iniciar();
  const antes = paineis.length;
  await s.cena.depoisDoDescanso('longo');
  assert.equal(paineis.length, antes + 1, 'devia aparecer uma assombração no descanso');
  assert.equal(s.t().apagadas.length, 0, 'a espontânea não conta para a paz');
  await s.cena.depoisDoDescanso('curto');
  assert.equal(paineis.length, antes + 1, 'o descanso curto não chama assombração');
  s.t().feito.purificada = true;
  await s.cena.depoisDoDescanso('longo');
  assert.equal(paineis.length, antes + 1, 'purificada, nenhuma assombração');
});

await teste('quem é fiel de Dumathoin sabe apagar a assombração sem rolar', async () => {
  const s = cripta({ seed: 1 });
  await s.cena.iniciar();
  for (const h of s.party) h.skills = [];
  s.party[2].divindade = 'Dumathoin';
  const P2 = C.salas.P2[3];
  await s.ir(s.party[0], P2);
  const ultimo = JSON.stringify(paineis.at(-1));
  assert.match(ultimo, /reza a Dumathoin, sabe o que o lugar pede/);
  assert.ok(s.app.campanha.vila.pistas.some((p) => /Assombração em/.test(p)));
});

await teste('a bênção: em cores só para quem JÁ via no escuro, e a visão verdadeira de 36 m como ação, uma vez por descanso', async () => {
  const s = cripta();
  await s.cena.iniciar();
  const [a] = s.party;
  const t = s.t();
  const viaAntes = (a.senses?.darkvisionFt ?? 0) > 0;
  t.ajudaram.push(a.id);
  t.apagadas.push('P2', 'P7', 'P11', 'P16');
  t.feito.fantasmasVencidos = true;
  t.feito.portaConsertada = true;
  a.pos = { ...a.pos, x: C.cranio.x + 1, y: C.cranio.y };
  await s.op(C.cranio, a, /Tirar o crânio/).fazer();
  assert.ok(a.bencaoDeDumathoin);
  assert.equal(a.visaoNoEscuroEmCores, viaAntes, 'em cores é para quem já via no escuro');
  // a visão verdadeira: um invisível a 30 pés deixa de ter vantagem contra ela
  const { enc, party, foes } = montar({ foes: [['goblin', { x: 11, y: 5 }]] });
  const h = party[0];
  Object.assign(h, { bencaoDeDumathoin: true, resources: { ...h.resources, visaoDeDumathoin: 1 }, resourcesMax: { ...h.resourcesMax, visaoDeDumathoin: 1 } });
  addCondition(foes[0], 'invisivel', { rounds: 10 });
  const sem = enc.attackModifiers(foes[0], h, {});
  assert.ok(JSON.stringify(sem).includes('atacante invisível'));
  assert.equal(enc.useFeature(h, 'visaoDeDumathoin'), true);
  assert.ok(hasCondition(h, 'visaoVerdadeira') && h.actionUsed && h.resources.visaoDeDumathoin === 0);
  const com = enc.attackModifiers(foes[0], h, {});
  assert.ok(!JSON.stringify(com).includes('atacante invisível'), 'com visão verdadeira o invisível não esconde');
  h.actionUsed = false;
  assert.equal(enc.useFeature(h, 'visaoDeDumathoin'), false, 'só uma vez por descanso');
  descansoLongo(h);
  assert.equal(h.resources.visaoDeDumathoin, 1, 'o descanso longo devolve');
  assert.ok(!hasCondition(h, 'visaoVerdadeira'));
});

await teste('a podridão da múmia: cada descanso longo tira 3d6 de PV máximo e não cura; Remover Maldição tira e devolve', () => {
  const { enc, party } = montar();
  const h = party[0];
  const max = h.maxHp;
  addCondition(h, 'podridaoDaMumia', {});
  h.hp = 20;
  descansoLongo(h);
  const perdeu = max - h.maxHp;
  assert.ok(perdeu >= 3 && perdeu <= 18, `perdeu ${perdeu}`);
  assert.equal(h.hp, 20, 'a podridão não deixa o descanso curar');
  assert.ok(SPELLS.removerMaldicao.remove.includes('podridaoDaMumia'));
  const clerigo = party.find((c) => c.spellcasting);
  clerigo.spellcasting.prepared = [...(clerigo.spellcasting.prepared ?? []), 'removerMaldicao'];
  clerigo.spellcasting.slots = [0, 4, 3, 3, 3, 2];
  clerigo.pos = { ...clerigo.pos, x: h.pos.x + 1, y: h.pos.y };
  const rc = enc.castSpell(clerigo, 'removerMaldicao', { target: h });
  assert.ok(rc.ok, rc.why);
  assert.ok(!hasCondition(h, 'podridaoDaMumia'), 'a maldição devia sair');
  assert.equal(h.maxHp, max, 'o PV máximo devia voltar');
  // a zero de máximo, morre e vira pó
  const v = party[1];
  addCondition(v, 'podridaoDaMumia', {});
  v.maxHp = 3;
  descansoLongo(v);
  assert.ok(v.dead && v.viraPo);
});

await teste('Talhundereth: uma semana depois, a gêmula viva do Falfark vira aglomerado e o come', async () => {
  const { criarTalhundereth } = await import(P + 'game/talhundereth.js');
  const campanha = { obelisco6: { feito: {}, lutas: {}, talh: { feito: { falfarkFalou: true, falfarkVistoNoDia: 3 }, mortos: [] } }, vila: { pistas: [], dia: 9 } };
  const tal = (dia) => {
    campanha.vila.dia = dia;
    const mapa = mapaDo('talhundereth');
    const field = montarCampo(mapa);
    const party = makeParty({ nivel: 8 });
    const enc = new Encounter({ battlefield: field, party, foes: [], rng: makeRng(2), emboscada: null, reinforcements: () => null });
    const app = { root: { classList: { add() {}, remove() {} } }, campanha, enc, refresh() {}, select() {}, firstActive: () => null, config: {} };
    return criarTalhundereth(app, {});
  };
  let cena = tal(9);
  assert.ok(cena.elenco.falfark && cena.elenco.gemulaDoFalfark && !cena.elenco.aglomeradoDoFalfark, 'seis dias ainda não basta');
  cena = tal(10);
  assert.ok(!cena.elenco.falfark && !cena.elenco.gemulaDoFalfark, 'o Falfark devia ter sido comido');
  assert.equal(cena.elenco.aglomeradoDoFalfark?.defId ?? cena.elenco.aglomeradoDoFalfark?.id?.replace(/[-_]\d+$/, ''), 'aglomeradoEncefalico');
  // com a gêmula morta antes, nada cresce
  const c2 = { obelisco6: { feito: {}, lutas: {}, talh: { feito: { falfarkFalou: true, falfarkVistoNoDia: 1 }, mortos: ['gemulaDoFalfark'] } }, vila: { pistas: [], dia: 30 } };
  campanha.obelisco6 = c2.obelisco6;
  cena = tal(30);
  assert.ok(cena.elenco.falfark && !cena.elenco.aglomeradoDoFalfark);
});

await teste('Talhundereth: o encaixe do disco estoura com 20 de dano psíquico; Arcanismo 14 percebe', async () => {
  const { criarTalhundereth } = await import(P + 'game/talhundereth.js');
  const { PONTOS_TALHUNDERETH: T } = await import(P + 'game/talhundereth-mapa.js');
  const campanha = { obelisco6: { feito: {}, lutas: {} }, vila: { pistas: [], dia: 2 } };
  const mapa = mapaDo('talhundereth');
  const field = montarCampo(mapa);
  const party = makeParty({ nivel: 8 });
  const enc = new Encounter({ battlefield: field, party, foes: [], rng: makeRng(4), emboscada: null, reinforcements: () => null });
  const app = { root: { classList: { add() {}, remove() {} } }, campanha, enc, refresh() {}, select() {}, firstActive: () => null, config: {} };
  const cena = criarTalhundereth(app, {});
  await cena.iniciar();
  const mago = party.find((c) => c.spellcasting);
  mago.pos = { ...mago.pos, x: T.disco.x, y: T.disco.y + 1 };
  mago.spellcasting.cantrips = [...(mago.spellcasting.cantrips ?? []), 'zombariaViciosa'];
  mago.spellcasting.slots = [0, 9, 9, 9, 9, 9];
  const ops = () => cena.interacoes(T.disco, field.surfaceAt(T.disco.x, T.disco.y), mago);
  assert.ok(!ops().some((o) => /Sobrecarregar/.test(o.rotulo)), 'sem saber, não devia aparecer');
  assert.ok(ops().some((o) => /Estudar o encaixe/.test(o.rotulo)));
  campanha.obelisco6.talh.feito.sabeOPsiquico = true;
  let n = 0;
  while (!campanha.obelisco6.talh.feito.criptaAberta && n++ < 30) {
    const o = ops().find((x) => /Sobrecarregar/.test(x.rotulo));
    assert.ok(o, 'a opção psíquica devia aparecer');
    await o.fazer();
  }
  assert.ok(campanha.obelisco6.talh.feito.criptaAberta && campanha.obelisco6.talh.feito.encaixePsiquico >= 20);
  assert.ok(campanha.obelisco6.talh.feito.discoEstilhacado);
});


console.log(`\n${total - falhas}/${total} testes passaram.`);
if (falhas) process.exit(1);
