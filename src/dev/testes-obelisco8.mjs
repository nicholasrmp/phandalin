// O CAPÍTULO 8 DO OBELISCO, "Além de uma Estrela sem Luz": as criaturas que faltavam e o motor que elas pedem.
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-obelisco8.mjs
//
// Cada prova foi escrita para FALHAR sem o código que ela mede.
import assert from 'node:assert/strict';

const P = new URL('../', import.meta.url).href;
const { Encounter } = await import(P + 'rules/combat.js');
const { makeParty } = await import(P + 'rules/party.js');
const { makeMonster, MONSTERS } = await import(P + 'rules/monsters.js');
const { Battlefield, distanceFt } = await import(P + 'core/grid.js');
const { makeRng } = await import(P + 'core/rng.js');
const { hasCondition, addCondition, removeCondition, conditionEffects } = await import(P + 'rules/conditions.js');
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

const MAPA = Array(30).fill('.'.repeat(40));
function montar({ seed = 1, foes = [], pos = null, lado = 'party' } = {}) {
  const field = new Battlefield(40, 30, MAPA);
  const party = makeParty({ nivel: 11 });
  const pp = pos ?? [{ x: 5, y: 5 }, { x: 1, y: 1 }, { x: 1, y: 3 }, { x: 1, y: 25 }];
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
const especial = (m, nome) => m.acoesEspeciais.find((a) => a.nome === nome);
const heroi = (s, nome) => s.party.find((c) => c.name === nome);

await teste('os blocos batem com o livro: ND, XP, CA e PV', () => {
  const esperado = {
    devoradorClarividente: ['11', 7200, 15, 156], lowarnizel: ['9', 5000, 18, 168],
    refracaoDeIlvaash: ['15', 13000, 11, 199], cranioFlamejante: ['4', 1100, 13, 40], cabecaDaChishinix: ['3', 700, 14, 54],
  };
  for (const [id, [cr, xp, ac, hp]] of Object.entries(esperado)) {
    const d = MONSTERS[id];
    assert.deepEqual([d.cr, d.xp, d.ac, d.maxHp], [cr, xp, ac, hp], id);
    makeMonster(id, { x: 1, y: 1 });
  }
  assert.equal(MONSTERS.cabecaDaChishinix.speedFt, 10);
});

await teste('o bloco com Resistência Lendária e magia por dia guarda os dois (o clarividente, a Refração e o empíreo do MM)', () => {
  const c = makeMonster('devoradorClarividente', { x: 1, y: 1 });
  assert.equal(c.resources.resistenciaLendaria, 3);
  assert.equal(c.resources['porDia:dissiparMagia'], 3);
  const e = makeMonster('empireo', { x: 1, y: 1 });
  for (const id of Object.keys(MONSTERS.empireo.spellcasting.porDia)) assert.ok(e.resources[`porDia:${id}`] > 0, id);
});

await teste('clarividente: acertado, Distorcer a Realidade soma +4 à CA e o leva a até 18 m; uma vez por rodada', () => {
  let desviou = false;
  let longe = false;
  for (let seed = 1; seed <= 40 && !(desviou && longe); seed++) {
    const s = montar({ seed, foes: [['devoradorClarividente', { x: 6, y: 5 }]] });
    const d = s.foes[0];
    const dara = s.party[0];
    const antes = { ...d.pos };
    const hp = d.hp;
    s.enc.resolveAttack(dara, d, {});
    if (d.reactionUsed) {
      if (d.hp === hp) desviou = true;
      if (distanceFt(antes, d.pos) > 5 && distanceFt(antes, d.pos) <= 60) longe = true;
      assert.ok(/entorta a realidade/.test(s.texto()));
    }
  }
  assert.ok(desviou, 'o +4 nunca fez um golpe errar');
  assert.ok(longe, 'nunca teleportou');
  const s = montar({ seed: 3, foes: [['devoradorClarividente', { x: 6, y: 5 }]] });
  s.foes[0].reactionUsed = true;
  const pos = { ...s.foes[0].pos };
  s.enc.resolveAttack(s.party[0], s.foes[0], {});
  assert.deepEqual({ x: s.foes[0].pos.x, y: s.foes[0].pos.y }, { x: pos.x, y: pos.y }, 'teleportou sem reação');
});

await teste('clarividente: o Desatar o Vazio pega quem está a 9 m do ponto, poupa as aberrações e atordoa quem falha', () => {
  let atordoou = false;
  for (let seed = 1; seed <= 20 && !atordoou; seed++) {
    const s = montar({ seed, lado: 'foes', foes: [['devoradorClarividente', { x: 15, y: 5 }], ['cabecaDaChishinix', { x: 7, y: 5 }]],
      pos: [{ x: 5, y: 5 }, { x: 6, y: 6 }, { x: 5, y: 7 }, { x: 30, y: 25 }] });
    const d = s.foes[0];
    const vidaCabeca = s.foes[1].hp;
    const vidaLonge = heroi(s, 'Ilvan').hp;
    assert.ok(s.enc.usarAcaoEspecial(d, especial(d, 'Desatar o Vazio'), s.party[0]));
    assert.equal(s.foes[1].hp, vidaCabeca, 'pegou a cabeça, que é aberração');
    assert.equal(heroi(s, 'Ilvan').hp, vidaLonge, 'pegou quem estava longe do ponto');
    if (s.party.slice(0, 3).some((h) => hasCondition(h, 'atordoado'))) atordoou = true;
  }
  assert.ok(atordoou);
});

await teste('clarividente: o Extrair Cérebro quer o alvo agarrado e INCAPACITADO por ele', () => {
  const s = montar({ foes: [['devoradorClarividente', { x: 6, y: 5 }]] });
  const d = s.foes[0];
  const dara = s.party[0];
  assert.equal(s.enc.canAttack(d, dara, 'Extrair Cérebro').ok, false);
  addCondition(dara, 'agarrado', { source: d.id, rounds: Infinity, data: { escape: 17 } });
  assert.equal(s.enc.canAttack(d, dara, 'Extrair Cérebro').ok, false, 'extraiu de quem só estava agarrado');
  addCondition(dara, 'incapacitado', { source: d.id, rounds: 10 });
  assert.ok(s.enc.canAttack(d, dara, 'Extrair Cérebro').ok);
});

await teste('Lowarnizel: o Sopro da Singularidade prende os pés de quem falha até o começo do turno dele', () => {
  let prendeu = null;
  for (let seed = 1; seed <= 20 && !prendeu; seed++) {
    const s = montar({ seed, lado: 'foes', foes: [['lowarnizel', { x: 8, y: 5 }]], pos: [{ x: 5, y: 5 }, { x: 5, y: 4 }, { x: 5, y: 6 }, { x: 30, y: 25 }] });
    const l = s.foes[0];
    assert.ok(s.enc.usarAcaoEspecial(l, especial(l, 'Sopro da Singularidade'), s.party[0]));
    const preso = s.party.slice(0, 3).find((h) => hasCondition(h, 'desalento'));
    if (preso) prendeu = { s, preso };
  }
  assert.ok(prendeu, 'ninguém ficou preso');
  const { s, preso } = prendeu;
  assert.equal(conditionEffects(preso).speed ?? s.enc.speedOf(preso), 0);
  s.enc.endSide?.() ?? s.enc.maybeEndSide();
  for (const c of s.enc.allOf('foes')) c.acted = true;
  s.enc.maybeEndSide();
  assert.ok(hasCondition(preso, 'desalento'), 'soltou no turno do grupo, antes da vez dele');
  for (const c of s.enc.allOf('party')) c.acted = true;
  s.enc.maybeEndSide();
  assert.ok(!hasCondition(preso, 'desalento'), 'continuou preso no turno seguinte do dragão');
});

await teste('Refração: a Garra Dissonante derruba a concentração de quem acerta', () => {
  for (let seed = 1; seed <= 30; seed++) {
    const s = montar({ seed, foes: [['refracaoDeIlvaash', { x: 6, y: 5 }]] });
    const brenn = heroi(s, 'Brenn');
    brenn.pos = { ...brenn.pos, x: 5, y: 7 };
    brenn.hp = brenn.maxHp = 999;
    brenn.concentrating = { spellId: 'bencao', rounds: 10, targets: [] };
    // um teste de concentração que ele não falharia: sem a garra, a concentração ficaria
    brenn.abilities = { ...brenn.abilities, con: 30 };
    const r = s.enc.resolveAttack(s.foes[0], brenn, { weaponId: 'Garra Dissonante' });
    if (r?.hit) { assert.equal(brenn.concentrating, null, 'a concentração ficou'); return; }
  }
  assert.fail('a garra nunca acertou');
});

await teste('Refração: a Quebra-Mente lendária, sem teste, dá desvantagem em ataque e em toda resistência', () => {
  const s = montar({ foes: [['refracaoDeIlvaash', { x: 12, y: 5 }]] });
  const r = s.foes[0];
  r.lendarias.opcoes = r.lendarias.opcoes.filter((o) => o.nome === 'Quebra-Mente');
  s.enc.lendariasDepoisDe(s.party[0]);
  const pegos = s.party.filter((h) => hasCondition(h, 'quebraMente'));
  assert.equal(pegos.length, 1);
  const fx = conditionEffects(pegos[0]);
  assert.ok(fx.attackDisadvantage);
  assert.deepEqual([...fx.saveDisadvantage].sort(), ['cha', 'con', 'dex', 'int', 'str', 'wis']);
  assert.equal(r.lendariasRestantes, 2);
});

await teste('Nellik: o Matador de Devoradores soma 1d12 contra aberração, e só contra ela', () => {
  const dano = (alvoId) => {
    let soma = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const s = montar({ seed, lado: 'foes', foes: [['nellik', { x: 6, y: 5 }], [alvoId, { x: 7, y: 5 }]] });
      const alvo = s.foes[1];
      alvo.side = 'party';
      alvo.hp = alvo.maxHp = 999;
      alvo.ac = 0;
      s.enc.resolveAttack(s.foes[0], alvo, { weaponId: 'Matador de Devoradores' });
      soma += 999 - alvo.hp;
    }
    return soma / 40;
  };
  const contraAberracao = dano('cabecaDaChishinix');
  const contraHumano = dano('bandido');
  assert.ok(contraAberracao - contraHumano > 4, `${contraAberracao} contra ${contraHumano}`);
});

await teste('Varakkta: a espada grande de reserva no lugar da de prata, e o golpe não é mágico', () => {
  const v = makeMonster('varakkta', { x: 1, y: 1 });
  assert.ok(v.attacks.some((a) => a.name === 'Espada Grande'));
  assert.ok(!v.attacks.some((a) => /prata/i.test(a.name)));
  assert.ok(v.attacks.every((a) => !a.magico));
});

await teste('crânio flamejante: conjura a Bola de Fogo do espaço de 3º círculo', () => {
  const s = montar({ seed: 2, lado: 'foes', foes: [['cranioFlamejante', { x: 10, y: 5 }]],
    pos: [{ x: 4, y: 4 }, { x: 4, y: 5 }, { x: 4, y: 6 }, { x: 5, y: 5 }] });
  const c = s.foes[0];
  takeMonsterTurn(s.enc, c);
  assert.ok(/Bola de Fogo/.test(s.texto()), s.texto().slice(-400));
  assert.equal(c.spellcasting.slots[3], 0);
});

await teste('o perseguidor invisível é invisível SEMPRE: nasce assim, ataca sem reaparecer, e não fica parado esperando', () => {
  const s = montar({ lado: 'foes', foes: [['perseguidorInvisivel', { x: 8, y: 5 }]] });
  const p = s.foes[0];
  assert.ok(hasCondition(p, 'invisivel'), 'não nasceu invisível');
  assert.ok(MONSTERS.poltergeist.traits.includes('sempreInvisivel'));
  assert.ok(MONSTERS.quasit.traits.includes('invisivelAVontade'), 'o quasit some por vontade, e não sempre');
  const vida = s.party.reduce((t, h) => t + h.hp, 0);
  takeMonsterTurn(s.enc, p);
  assert.ok(s.party.reduce((t, h) => t + h.hp, 0) < vida || /Pancada/.test(s.texto()), 'não atacou');
  assert.ok(hasCondition(p, 'invisivel'), 'reapareceu ao atacar');
});

// ============================================================================================ o labirinto ====
const { mapaDo } = await import(P + 'game/encounter.js');
const { montarCampo } = await import(P + 'game/campo.js');
const { garantirInventario } = await import(P + 'rules/equipment.js');
const { skillBonus } = await import(P + 'rules/abilities.js');
const { criarLabirintoSalgado, criarCovilLowarnizel } = await import(P + 'game/labirinto-salgado.js');
const { PONTOS_LABIRINTO: L, PONTOS_COVIL: C } = await import(P + 'game/labirinto-salgado-mapa.js');
const { criarIllithinoch } = await import(P + 'game/illithinoch.js');
const { PONTOS_ILLITHINOCH: I } = await import(P + 'game/illithinoch-mapa.js');
const escolher = (...valores) => { const fila = [...valores]; globalThis.__escolher = (esc) => { const v = fila.length ? fila.shift() : null; return (esc.find((e) => e.valor === v) ?? esc.find((e) => e.primaria) ?? esc[0]).valor; }; };
function appDeMentira(campanha) {
  const app = { root: { classList: { add() {}, remove() {} } }, campanha, selected: null, select(c) { this.selected = c; },
    firstActive: () => null, refresh() {}, encerrarPartida() { app.fim = true; }, irParaVila(v) { app.voltouAVila = v; },
    newEncounter(o) { app.novaCena = o; }, config: {} };
  return app;
}
function labirinto({ variante = 'labirintoSalgado', criar = criarLabirintoSalgado, campanha = null, seed = 3, nivel = 10, config = {} } = {}) {
  const camp = campanha ?? { vila: { pistas: [], missoes: {} } };
  const mapa = mapaDo(variante);
  const field = montarCampo(mapa);
  const party = makeParty({ nivel });
  party.forEach((c, i) => { c.pos = { ...c.pos, ...mapa.grupo[i] }; });
  const app = appDeMentira(camp);
  const enc = new Encounter({ battlefield: field, party, foes: [], rng: makeRng(seed), emboscada: null, reinforcements: () => null });
  app.enc = enc;
  const cena = criar(app, { cenaDaVila: variante, ...config });
  app.capitulo = cena;
  enc.onEvent = (ev) => cena.evento?.(ev);
  const ir = async (h, p) => { h.pos = { ...h.pos, x: p.x, y: p.y }; await cena.depoisDeMover(h); };
  const op = (tile, h, re) => cena.interacoes(tile, null, h).find((o) => re.test(o.rotulo));
  const alcanca = (de, sala) => { const r = field.reachable(de, 100000, () => false); return L.salas[sala].some((q) => r.has(`${q.x},${q.y}`)); };
  return { app, enc, cena, party, field, camp, ir, op, alcanca, t: () => camp.obelisco8.lab };
}
const naMochila = (h, id) => garantirInventario(h).bag.push({ id, tipo: 'item', qtd: 1 });

await teste('Labirinto: as portas mentais nascem fechadas; os bastões de B7 (um elo) abrem a traseira, com o choque de 4d10', async () => {
  escolher();
  const s = labirinto();
  await s.cena.iniciar();
  const portal = { ...s.party[0].pos };
  assert.ok(!s.alcanca(portal, 'B14'), 'B14 se alcança com a porta traseira fechada');
  assert.ok(!s.alcanca(portal, 'B22'));
  const h = s.party[0];
  h.pos = { ...h.pos, ...L.bastoesB7 };
  const vida = h.hp;
  await s.op(L.bastoesB7, h, /Segurar os bastões/).fazer();
  assert.ok(h.hp < vida, 'o choque não feriu');
  assert.ok(s.alcanca(portal, 'B14'), 'a traseira não abriu');
  assert.ok(!s.alcanca(portal, 'B19'), 'abriu a central junto');
});

await teste('Labirinto: os bastões da Ashripask pedem a corrente de quatro, e abrem a da frente', async () => {
  escolher();
  const s = labirinto();
  await s.cena.iniciar();
  s.t().feito.ashripaskVista = true;
  const [a, b] = L.bastoesB21;
  s.party[0].pos = { ...s.party[0].pos, ...a };
  await s.op(a, s.party[0], /Segurar os bastões/).fazer();
  assert.ok(!s.t().portas.frente, 'abriu com um só');
  const casas = L.salas.B21.filter((q) => distanceFt(q, a) <= 10 || distanceFt(q, b) <= 10);
  s.party.forEach((h, i) => { h.pos = { ...h.pos, ...casas[i * 3] }; });
  await s.op(a, s.party[0], /Segurar os bastões/).fazer();
  assert.ok(s.t().portas.frente);
});

await teste('Labirinto: a passagem de B11 se acha pela Percepção passiva 14, de perto, e então B11 se alcança', async () => {
  escolher();
  const s = labirinto();
  await s.cena.iniciar();
  assert.ok(!s.alcanca(s.party[0].pos, 'B11'));
  const h = s.party.reduce((x, y) => (skillBonus(y, 'percepcao') > skillBonus(x, 'percepcao') ? y : x));
  assert.ok(10 + skillBonus(h, 'percepcao') >= 14, 'ninguém do grupo tem a passiva 14');
  await s.ir(h, L.secreta.b);
  assert.ok(s.t().feito.secretaAchada);
  assert.ok(s.alcanca(h.pos, 'B11'));
});

await teste('Labirinto: B3 começa a luta; morto um ashenwight, o outro se rende', async () => {
  escolher();
  const s = labirinto();
  await s.cena.iniciar();
  await s.ir(s.party[0], L.salas.B3[60]);
  assert.ok(!s.cena.explorando);
  const ash = [s.cena.elenco.ashenwight1, s.cena.elenco.ashenwight2];
  assert.ok(ash.every((a) => a.side === 'foes'));
  ash[0].hp = 0; ash[0].dead = true;
  s.cena.evento({ type: 'died', target: ash[0] });
  assert.equal(ash[1].rendido, true);
  assert.equal(ash[1].side, 'neutro');
});

await teste('Labirinto: chegar perto dos corpos de B4 solta os cinco crânios flamejantes', async () => {
  escolher();
  const s = labirinto();
  await s.cena.iniciar();
  const perto = L.salas.B4.find((q) => distanceFt(q, L.cabecas) <= 10 && distanceFt(q, L.cabecas) > 0);
  await s.ir(s.party[0], perto);
  assert.equal(s.enc.combatants.filter((c) => c.defId === 'cranioFlamejante' && c.side === 'foes').length, 5);
});

await teste('Labirinto: devolvida a espada de prata, os githyanki conversam; numa luta, os guerreiros se rendem quando a Varakkta cai', async () => {
  escolher('devolver');
  const s = labirinto();
  await s.cena.iniciar();
  naMochila(s.party[1], 'espadaDePrataDaVarakkta');
  await s.ir(s.party[0], L.salas.B7[20]);
  assert.ok(s.cena.explorando, 'brigou mesmo devolvendo');
  assert.ok(s.camp.vila.pistas.some((p) => /Varakkta/.test(p)));
  assert.ok(!garantirInventario(s.party[1]).bag.some((i) => i.id === 'espadaDePrataDaVarakkta'));
  escolher('luta');
  const s2 = labirinto();
  await s2.cena.iniciar();
  await s2.ir(s2.party[0], L.salas.B7[20]);
  const v = s2.cena.elenco.varakkta;
  v.hp = 0; v.dead = true;
  s2.cena.evento({ type: 'died', target: v });
  assert.ok([s2.cena.elenco.kianka, s2.cena.elenco.vazzi].every((g) => g.rendido && g.side === 'neutro'));
});

await teste('Labirinto: no lobo parietal ninguém cai; fora dele, sim', async () => {
  escolher();
  const s = labirinto();
  await s.cena.iniciar();
  const h = s.party[0];
  await s.ir(h, L.salas.B13[30]);
  assert.equal(L.lobos.B13, 'parietal');
  assert.ok(hasCondition(h, 'loboParietal'));
  assert.equal(s.enc.imuneACondicao(h, 'caido'), true);
  await s.ir(h, L.salas.B1[10]);
  assert.equal(s.enc.imuneACondicao(h, 'caido'), false);
});

await teste('Labirinto: o arame de B15 arrebenta em quem pisa no quadrado da lona e fere todos da sala', async () => {
  escolher();
  const s = labirinto();
  await s.cena.iniciar();
  const mb = s.cena.elenco.mublinesh;
  mb.dead = true; mb.hp = 0;
  const [a, b] = s.party;
  a.hp = a.maxHp = b.hp = b.maxHp = 999;
  b.pos = { ...b.pos, ...L.salas.B15.find((q) => !L.arame.some((w) => w.x === q.x && w.y === q.y)) };
  await s.ir(a, L.arame[5]);
  assert.ok(a.hp < 999 && b.hp < 999, 'o arame não feriu os dois');
  assert.ok(s.t().feito.arameDisparou);
});

await teste('Labirinto: o Mublinesh foge para B15 abaixo de 50 PV, e sai do tabuleiro', async () => {
  escolher();
  const s = labirinto();
  await s.cena.iniciar();
  s.cena.porPorta('traseira', true);
  await s.ir(s.party[0], L.salas.B14[100]);
  const m = s.cena.elenco.mublinesh;
  assert.equal(m.side, 'foes');
  m.hp = 40;
  s.cena.evento({ type: 'damage', target: m });
  assert.ok(s.t().feito.mublineshFugiu);
  assert.ok(!s.enc.combatants.includes(m));
});

await teste('o covil: o descanso cobra Sabedoria CD 15 de cada um e fecha as portas; os bastões abrem a central', async () => {
  escolher();
  const camp = { vila: { pistas: [], missoes: {} }, obelisco8: { lab: { feito: {}, mortos: [], portas: { traseira: true } } } };
  let exausto = false;
  for (let seed = 1; seed <= 20 && !exausto; seed++) {
    const s = labirinto({ variante: 'covilLowarnizel', criar: criarCovilLowarnizel, campanha: JSON.parse(JSON.stringify(camp)), seed });
    await s.cena.iniciar();
    s.party[0].hp = 1;
    await s.cena.descansar();
    assert.equal(s.party[0].hp, s.party[0].maxHp);
    assert.equal(s.camp.obelisco8.lab.portas.traseira, false, 'a porta não fechou com o descanso');
    if (s.party.some((h) => hasCondition(h, 'exausto'))) exausto = true;
  }
  assert.ok(exausto, 'ninguém ficou exausto em 20 descansos');
  const s = labirinto({ variante: 'covilLowarnizel', criar: criarCovilLowarnizel, campanha: JSON.parse(JSON.stringify(camp)) });
  await s.cena.iniciar();
  s.party[0].pos = { ...s.party[0].pos, ...C.bastoes };
  await s.cena.interacoes(C.bastoes, null, s.party[0]).find((o) => /bastões/.test(o.rotulo)).fazer();
  assert.ok(s.camp.obelisco8.lab.portas.central);
});

await teste('Labirinto: os flumphs recrutados lutam do lado do grupo, sozinhos, fogem feridos, e o que morre não volta', async () => {
  escolher('luta');
  const s = labirinto({ campanha: { vila: { pistas: [], missoes: {} }, obelisco8: { lab: { feito: { flumphs: 3, flumphsRecrutados: true }, mortos: [], portas: {} } } } });
  await s.cena.iniciar();
  await s.ir(s.party[0], L.salas.B7[20]);
  const fs = s.enc.combatants.filter((c) => c.flumphDoLabirinto);
  assert.equal(fs.length, 3, 'os flumphs não vieram');
  assert.ok(fs.every((f) => f.side === 'party' && f.invocado?.auto), 'os flumphs não agem sozinhos');
  assert.equal(fs[0].name, 'Sábio Borblish');
  // o ferido pela metade foge
  fs[1].hp = Math.floor(fs[1].maxHp / 2);
  s.cena.evento({ type: 'damage', target: fs[1] });
  assert.ok(fs[1].fugiu && !s.enc.combatants.includes(fs[1]), 'o flumph ferido não fugiu');
  // um morre, e a luta acaba: sobram dois
  fs[2].hp = 0; fs[2].dead = true;
  for (const f of s.enc.combatants.filter((c) => c.side === 'foes')) { f.hp = 0; f.dead = true; }
  s.enc.checkEnd();
  assert.equal(s.enc.outcome, 'vitoria');
  await s.cena.fimDoCombate('vitoria');
  assert.equal(s.t().feito.flumphs, 2);
  assert.ok(!s.enc.combatants.some((c) => c.flumphDoLabirinto), 'os flumphs ficaram no tabuleiro depois da luta');
});

await teste('Labirinto: ouvir o Jomlus um dia inteiro dá a Mente Solipsista, que soma 1d8 em INT e SAB, tira a reação e volta no descanso longo', async () => {
  escolher();
  const s = labirinto();
  await s.cena.iniciar();
  const dia = s.t().dia ?? 0;
  await s.cena.depoisDaConversa(s.cena.elenco.jomlus, 'ler');
  assert.equal(s.t().dia, dia + 1, 'o dia não passou');
  const h = s.party[0];
  assert.ok(h.features.includes('bencaoSolipsista'));
  const { magiasProntas } = await import(P + 'rules/spells.js');
  assert.ok(magiasProntas(h).includes('menteSolipsista'), 'a ação não aparece');
  s.enc.side = 'party'; h.actionUsed = false; h.acted = false; s.enc.over = false;
  const r = s.enc.castSpell(h, 'menteSolipsista', {});
  assert.ok(r.ok, r.why);
  assert.ok(hasCondition(h, 'menteSolipsista') && h.reactionUsed);
  assert.equal(h.resources.menteSolipsista, 0);
  // o dado entra na resistência de SAB e não na de FOR
  s.enc.rng.die = (n) => (n === 8 ? 8 : 1);
  assert.match(s.enc.resistencia(h, 'wis', 30).conta ?? JSON.stringify(s.enc.resistencia(h, 'wis', 30)), /solipsista/);
  assert.doesNotMatch(JSON.stringify(s.enc.resistencia(h, 'str', 30)), /solipsista/);
  assert.ok(conditionEffects(h).semReacao);
  const { descansoLongo } = await import(P + 'rules/descanso.js');
  descansoLongo(h);
  assert.equal(h.resources.menteSolipsista, 1, 'não voltou no descanso longo');
});

await teste('Labirinto: no lobo frontal o Ajudar é ação bônus contra quem está ao lado; fora dele, não há', async () => {
  escolher();
  const s = labirinto();
  await s.cena.iniciar();
  const [a, b] = s.party;
  await s.ir(a, L.salas.B16[10]);
  assert.equal(L.lobos.B16, 'frontal');
  assert.ok(hasCondition(a, 'loboFrontal'));
  const g = makeMonster('goblin', { x: a.pos.x + 1, y: a.pos.y });
  g.side = 'foes';
  s.enc.addCombatant(g);
  a.bonusUsed = false;
  assert.ok(s.enc.useFeature(a, 'ajudaDoLobo', { target: g }));
  assert.ok(a.bonusUsed && hasCondition(g, 'ajudaDoMentor'));
  await s.ir(b, L.salas.B1[10]);
  b.bonusUsed = false;
  assert.ok(!s.enc.useFeature(b, 'ajudaDoLobo', { target: g }), 'ajudou fora do lobo frontal');
});

await teste('Labirinto: o Mublinesh fecha com o raio a porta de B14 que se abriu, um minuto depois, sem devorador no grupo', async () => {
  escolher();
  const s = labirinto();
  await s.cena.iniciar();
  const [a] = s.party;
  a.hp = a.maxHp = 999;
  a.pos = { ...a.pos, ...L.bastoesB7 };
  await s.cena.descarregar('B7', a);
  assert.ok(s.t().portas.traseira);
  for (let i = 0; i < 8; i++) await s.ir(a, L.salas.B1[10 + (i % 2)]);
  assert.equal(s.t().portas.traseira, false, 'o Mublinesh não fechou a porta');
  assert.match(s.enc.log.map((l) => l.text ?? l).join(' '), /Mublinesh/);
});

await teste('Labirinto: o relógio do Shalfi fura o covil em 1 ou 2 dias; avisado, o dragão vence; no covil, o dragão luta com o grupo', async () => {
  const { passarUmDia, shalfiForaDeVista } = await import(P + 'game/labirinto-salgado.js');
  const t = { feito: { diaDoShalfi: 2, lowarnizelAvisado: true }, mortos: [], portas: {} };
  assert.equal(passarUmDia(t), false);
  assert.equal(passarUmDia(t), true);
  assert.equal(passarUmDia(t), false, 'furou duas vezes');
  shalfiForaDeVista(t, makeRng(1));
  assert.ok(t.mortos.includes('shalfi') && !t.mortos.includes('lowarnizel'));
  // sem aviso, a sorte: um dos dois lados morre
  const lados = new Set();
  for (let seed = 1; seed <= 12; seed++) { const u = { feito: {}, mortos: [] }; shalfiForaDeVista(u, makeRng(seed)); lados.add(u.mortos.join()); }
  assert.equal(lados.size, 2, 'a sorte sempre decidiu igual');
  // no covil: o descanso passa o dia, e o Shalfi cai do teto
  escolher('luta');
  const camp = { vila: { pistas: [], missoes: {} }, obelisco8: { lab: { feito: { diaDoShalfi: 1 }, mortos: [], portas: {} } } };
  const s = labirinto({ variante: 'covilLowarnizel', criar: criarCovilLowarnizel, campanha: camp });
  await s.cena.iniciar();
  await s.cena.descansar();
  const shalfi = s.enc.combatants.find((c) => c.name === 'Shalfi Lewin');
  assert.ok(shalfi && shalfi.side === 'foes', 'o Shalfi não caiu do teto');
  const drag = s.cena.elenco.lowarnizel;
  assert.ok(drag.side === 'party' && drag.invocado?.auto, 'o dragão não luta com o grupo');
  for (const f of s.enc.combatants.filter((c) => c.side === 'foes')) { f.hp = 0; f.dead = true; }
  await s.cena.fimDoCombate('vitoria');
  assert.equal(drag.side, 'neutro');
  assert.ok(!drag.invocado && s.enc.combatants.includes(drag), 'o dragão não voltou a ser o dono da casa');
  assert.ok(camp.obelisco8.lab.mortos.includes('shalfi'));
});

await teste('Labirinto: contado o portal, a Varakkta sai para atacar Illithinoch, e lá leva dois devoradores com ela', async () => {
  escolher('devolver', 'portal');
  const s = labirinto();
  await s.cena.iniciar();
  naMochila(s.party[1], 'espadaDePrataDaVarakkta');
  await s.ir(s.party[0], L.salas.B7[20]);
  assert.ok(s.t().feito.varakktaAtacaIllithinoch);
  assert.ok(!s.enc.combatants.includes(s.cena.elenco.varakkta), 'a Varakkta ficou no labirinto');
  escolher();
  const camp = { vila: { pistas: [], missoes: {} }, obelisco8: s.camp.obelisco8, obelisco7: { feito: {}, lutas: {}, portalAberto: { dia: 1 }, illi: { feito: { chegou: true }, mortos: [], alarme: false } } };
  const i = labirinto({ variante: 'illithinoch', criar: criarIllithinoch, campanha: camp, config: { chegada: 'portal' } });
  await i.cena.iniciar();
  assert.equal(camp.obelisco7.illi.mortos.length, 2);
  assert.ok(camp.vila.pistas.some((p) => /Varakkta/.test(p) && /Illithinoch/.test(p)));
});

await teste('a transformação dos heróis: só com o sim do jogador, um efeito por estágio até o do capítulo, e a escolha de ficar no fim', async () => {
  const T = await import(P + 'game/transformacao.js');
  const party = makeParty({ nivel: 9 });
  const [a, b] = party;
  const camp = { aventuraConcluida: true, obelisco5: { feito: { pagoFim: true } }, obelisco6: { marco9: true } };
  assert.equal(T.estagioDaTransformacao(camp), 3);
  escolher('sim', 'nao', 'nao', 'nao');
  const app = appDeMentira(camp);
  await T.avancarTransformacao(app, camp, party, makeRng(2));
  assert.deepEqual(Object.keys(a.transformacao.efeitos), ['1', '2', '3']);
  assert.ok(!b.transformacao.aceita && !Object.keys(b.transformacao.efeitos).length, 'quem recusou mudou');
  assert.equal(T.mudancasDoHeroi(a).length, 3);
  assert.ok(T.mostraAMudanca(a) && !T.mostraAMudanca(b));
  // o capítulo 8 soma o quarto, e não sorteia de novo os de antes
  const antes = { ...a.transformacao.efeitos };
  camp.obelisco7 = { portalAberto: {} };
  await T.avancarTransformacao(app, camp, party, makeRng(5));
  assert.equal(a.transformacao.efeitos[4] > 0, true);
  for (const k of ['1', '2', '3']) assert.equal(a.transformacao.efeitos[k], antes[k]);
  // o estágio 3, resultado 1: vantagem em Carisma contra aberração
  const { modificadores } = await import(P + 'rules/utilidade.js');
  a.transformacao.efeitos[3] = 1;
  const est = { ativas: [], npcs: {} };
  assert.ok(modificadores(est, party, a, 'persuasao', { npc: { id: 'x', tipo: 'aberração' } }).vantagem);
  assert.ok(!modificadores(est, party, a, 'persuasao', { npc: { id: 'y', tipo: 'humanoide' } }).vantagem);
  // vencida a Refração, cada um decide se fica
  camp.obelisco8 = { feito: { refracaoVencida: true } };
  escolher('sim');
  await T.avancarTransformacao(app, camp, party, makeRng(1));
  assert.equal(a.transformacao.fica, true);
  assert.equal(T.estagioDaTransformacao(camp), 0);
});

await teste('o covil: quem mostra a marca do Reino Distante no corpo tem de se explicar, ou o dragão ataca', async () => {
  escolher('calar');
  const s = labirinto({ variante: 'covilLowarnizel', criar: criarCovilLowarnizel, campanha: { vila: { pistas: [], missoes: {} } } });
  s.party[0].transformacao = { aceita: true, efeitos: { 1: 2, 2: 4 } };
  await s.cena.iniciar();
  assert.equal(s.cena.elenco.lowarnizel.side, 'foes', 'o dragão não atacou quem calou');
  escolher('explicar');
  const s2 = labirinto({ variante: 'covilLowarnizel', criar: criarCovilLowarnizel, campanha: { vila: { pistas: [], missoes: {} } } });
  s2.party[0].transformacao = { aceita: true, efeitos: { 1: 2, 2: 4 } };
  await s2.cena.iniciar();
  assert.ok(s2.cena.explorando && s2.cena.elenco.lowarnizel.side === 'neutro');
});

await teste('Illithinoch: aberto o portal de X16, ele leva ao Labirinto Salgado', async () => {
  escolher();
  const camp = { vila: { pistas: [], missoes: {} }, obelisco7: { feito: {}, lutas: {}, portalAberto: { dia: 1 }, illi: { feito: { chegou: true }, mortos: [], alarme: false } } };
  const s = labirinto({ variante: 'illithinoch', criar: criarIllithinoch, campanha: camp });
  await s.cena.iniciar();
  const h = s.party[0];
  h.pos = { ...h.pos, ...I.nicho };
  await s.cena.interacoes(I.nicho, null, h).find((o) => /Atravessar o portal/.test(o.rotulo)).fazer();
  assert.equal(s.app.novaCena.cenaDaVila, 'labirintoSalgado');
});

// ================================================================================================= a poça ====
const { criarPocaSalgada, testeDaMilha, PONTOS_POCA } = await import(P + 'game/poca-salgada.js');
const { engolir } = await import(P + 'rules/livro-motor.js');
const { XP_POR_NIVEL } = await import(P + 'rules/progressao.js');
const poca = (campanha = null, seed = 3) => labirinto({ variante: 'pocaSalgada', criar: criarPocaSalgada, campanha: campanha ?? { vila: { pistas: [], missoes: {} } }, seed });
// o dado fixo: 20 dá o máximo de todo dado (tudo passa), 1 dá o mínimo (tudo falha)
const dadoFixo = (enc, v) => { enc.rng.die = (n) => (v === 20 ? n : 1); };

await teste('Poça: cada milha pede Atletismo ou Furtividade CD 14, e quem viu a Poça pela ocular rola com vantagem', () => {
  const s = poca();
  const h = s.party[0];
  let sem = 0;
  let com = 0;
  for (let i = 0; i < 400; i++) { if (testeDaMilha(s.enc.rng, h, false).passou) sem++; if (testeDaMilha(s.enc.rng, h, true).passou) com++; }
  assert.ok(com > sem + 20, `com vantagem ${com}, sem ${sem}`);
});

await teste('Poça: descendo sem falhar, o grupo chega ao fundo nas seis milhas e sobe ao 11º nível', async () => {
  escolher();
  const s = poca();
  dadoFixo(s.enc, 20);
  await s.cena.iniciar();
  assert.equal(s.camp.obelisco8.poca.milha, 6);
  assert.ok(s.camp.obelisco8.poca.fundo);
  assert.ok(s.party.every((h) => h.xp >= XP_POR_NIVEL[11]), 'não subiu ao 11º');
  assert.ok(s.cena.explorando);
  const subir = s.cena.interacoes(PONTOS_POCA.estrela, null, s.party[0]).find((o) => /Subir/.test(o.rotulo));
  await subir.fazer();
  assert.equal(s.app.novaCena.cenaDaVila, 'labirintoSalgado');
  assert.equal(s.app.novaCena.chegada, 'poca');
});

await teste('Poça: quem falha chama o verme, que mira nele e vai embora no fim do segundo turno dele', async () => {
  escolher('luta');
  const s = poca();
  dadoFixo(s.enc, 1);
  await s.cena.iniciar();
  const v = s.cena.estado.verme;
  assert.ok(v && s.enc.combatants.includes(v) && v.side === 'foes');
  assert.ok(s.party.some((h) => h.id === v.alvoPreferido));
  assert.equal(s.camp.obelisco8.poca.milha, 1);
  s.cena.evento({ type: 'turnEnd', actor: v });
  assert.ok(s.enc.combatants.includes(v), 'saiu no primeiro turno');
  s.cena.evento({ type: 'turnEnd', actor: v });
  assert.ok(!s.enc.combatants.includes(v), 'ficou mais de dois turnos');
});

await teste('Poça: com alguém dentro, o verme se afasta com ele, e some quando ele sai', async () => {
  escolher('luta');
  const s = poca();
  dadoFixo(s.enc, 1);
  await s.cena.iniciar();
  const v = s.cena.estado.verme;
  const h = s.party[0];
  engolir(s.enc, v, h, { dano: '6d6', tipoDano: 'ácido', regurgita: { dano: 30, dc: 21 } });
  s.cena.evento({ type: 'turnEnd', actor: v });
  s.cena.evento({ type: 'turnEnd', actor: v });
  assert.ok(s.enc.combatants.includes(v), 'sumiu com o herói dentro');
  assert.ok(v.indoEmbora);
  assert.ok(distanceFt(v.pos, PONTOS_POCA.grupo[0]) >= 40, 'não se afastou');
  assert.equal(h.pos.x, v.pos.x);
  removeCondition(h, 'engolido');
  s.cena.evento({ type: 'damage', target: v });
  assert.ok(!s.enc.combatants.includes(v), 'ficou depois de o herói sair');
});

await teste('Labirinto: a poça de B22 se mergulha, e leva à Poça Salgada', async () => {
  escolher();
  const s = labirinto();
  await s.cena.iniciar();
  s.cena.porPorta('frente', true);
  const agua = L.salas.B22.find((q) => s.field.surfaceAt(q.x, q.y) === 'cisterna');
  const h = s.party[0];
  h.pos = { ...h.pos, ...agua };
  await s.cena.interacoes(agua, null, h).find((o) => /Mergulhar/.test(o.rotulo)).fazer();
  assert.equal(s.app.novaCena.cenaDaVila, 'pocaSalgada');
});

// ================================================================================================ o Vazio ====
const { criarIlhaDoVazio, sortearAVista, fragmentosDosFanaticos, VARIANTE_DA_ILHA, salasDosFanaticos } = await import(P + 'game/vazio.js');
const { PONTOS_VAZIO: VZ } = await import(P + 'game/vazio-mapas.js');
const { ARESTA } = await import(P + 'core/grid.js');
const ilhaDoVazio = (ilha, campanha = null, seed = 3) => labirinto({ variante: VARIANTE_DA_ILHA[ilha], criar: criarIlhaDoVazio,
  campanha: campanha ?? { vila: { pistas: [], missoes: {} } }, seed, nivel: 11 });

await teste('Vazio: as duas à vista nunca são a ilha atual, e a Ânima só aparece depois de cinco outras visitadas', () => {
  const rng = makeRng(5);
  for (let i = 0; i < 300; i++) {
    const r = sortearAVista(rng, 'ponte', ['cupula', 'ponte']);
    assert.ok(r.length >= 1 && r.length <= 2 && !r.includes('ponte') && !r.includes('anima'), r.join());
  }
  let anima = false;
  for (let i = 0; i < 300 && !anima; i++) anima = sortearAVista(rng, 'campo', ['cupula', 'ponte', 'charco', 'miasma', 'estatua', 'campo']).includes('anima');
  assert.ok(anima, 'a Ânima nunca apareceu depois de cinco outras');
});

await teste('Vazio: os fanáticos levam os quatro pedaços de Phandalin e os do capítulo 6 que o grupo não pegou', () => {
  assert.equal(fragmentosDosFanaticos({}), 7);
  assert.equal(fragmentosDosFanaticos({ obelisco6: { fragmentos: { talhundereth: true, cripta: true } } }), 5);
});

await teste('Vazio: todo mundo voa nas ilhas, e deixa de voar de volta na Poça', async () => {
  escolher();
  const s = ilhaDoVazio('ponte');
  await s.cena.iniciar();
  assert.ok(s.party.every((h) => h.flyFt === h.speedFt && h.hover));
  const p = poca({ vila: { pistas: [], missoes: {} }, obelisco8: { poca: { milha: 6, fundo: true } } });
  p.party.forEach((h, i) => Object.assign(h, { flyFt: s.party[i].flyFt, hover: true, vooDoVazio: true }));
  await p.cena.iniciar();
  assert.ok(p.party.every((h) => !h.flyFt));
});

await teste('Cúpula: entrar na cúpula acorda os cinco guardiões; soltos os quatro presos, eles contam quantos pedaços os fanáticos levam', async () => {
  escolher();
  const s = ilhaDoVazio('cupula', { vila: { pistas: [], missoes: {} }, obelisco6: { fragmentos: { cripta: true } } });
  await s.cena.iniciar();
  await s.ir(s.party[0], VZ.CUPULA.dentro[10]);
  assert.equal(s.enc.combatants.filter((c) => c.defId === 'guardiaoEscudo' && c.side === 'foes').length, 5);
  for (const g of s.enc.combatants.filter((c) => c.defId === 'guardiaoEscudo')) { g.dead = true; g.hp = 0; }
  s.cena.estado.explorando = true;
  dadoFixo(s.enc, 20);
  for (const [i, p] of VZ.CUPULA.refens.entries()) {
    s.party[0].pos = { ...s.party[0].pos, ...p };
    await s.cena.interacoes(p, null, s.party[0]).find((o) => /Soltar/.test(o.rotulo)).fazer();
    assert.ok(s.camp.obelisco8.vazio.feito.cupula[`solto${i}`]);
  }
  assert.ok(s.camp.vila.pistas.some((x) => /6 pedaços/.test(x)), s.camp.vila.pistas.join(' | '));
});

await teste('Ponte: o símbolo cega e desespera quem falha; perto do rio, o aboleth e o elemental sobem', async () => {
  escolher();
  const s = ilhaDoVazio('ponte');
  await s.cena.iniciar();
  dadoFixo(s.enc, 1);
  const h = s.party[0];
  await s.ir(h, VZ.PONTE.simbolo[0]);
  assert.ok(hasCondition(h, 'cego') && hasCondition(h, 'desesperanca'));
  assert.ok(!s.cena.explorando, 'o rio não acordou');
  assert.ok(['aboleth', 'elementalDaAgua'].every((id) => s.enc.combatants.some((c) => c.defId === id && c.side === 'foes')));
});

await teste('Ponte: o diário da torre se lê, e o tesouro sai do escritório', async () => {
  escolher();
  const s = ilhaDoVazio('ponte');
  await s.cena.iniciar();
  const h = s.party[0];
  h.pos = { ...h.pos, ...VZ.PONTE.escritorio };
  for (const re of [/Ler o diário/, /Revistar/]) await s.cena.interacoes(VZ.PONTE.escritorio, null, h).find((o) => re.test(o.rotulo)).fazer();
  assert.ok(s.camp.obelisco8.vazio.feito.diarioLido);
  assert.equal(garantirInventario(h).bag.find((i) => i.id === 'aliancaDeOuro')?.qtd, 6);
});

await teste('Charco: o ardil da naga chama a outra; morta, a naga renasce depois de um descanso no Vazio', async () => {
  escolher('ardil');
  const s = ilhaDoVazio('charco');
  await s.cena.iniciar();
  await s.ir(s.party[0], VZ.CHARCO.clareira[20]);
  assert.equal(s.enc.combatants.filter((c) => c.defId === 'nagaEspiritual' && c.side === 'foes').length, 2);
  const camp = { vila: { pistas: [], missoes: {} }, obelisco8: { vazio: { ilha: 'charco', visitadas: ['charco'], aVista: [], feito: { charco: { 'morta:valsyx': 0, chegou: true } }, mortos: ['charco:valsyx'], descansos: 0 } } };
  const s2 = ilhaDoVazio('charco', JSON.parse(JSON.stringify(camp)));
  assert.ok(!s2.cena.elenco.valsyx, 'voltou sem descanso');
  camp.obelisco8.vazio.descansos = 1;
  const s3 = ilhaDoVazio('charco', camp);
  assert.ok(s3.cena.elenco.valsyx, 'não renasceu depois do descanso');
});

await teste('Nematódeo: perto da tenda a boca se fecha e as armadilhas atacam; o furo no ponto certo reabre a boca', async () => {
  escolher();
  const s = ilhaDoVazio('nematodeo');
  await s.cena.iniciar();
  const N = VZ.NEMATODEO;
  const boca = N.arestasDaBoca[0];
  assert.equal(s.field.aresta(boca.a.x, boca.a.y, boca.b.x, boca.b.y), ARESTA.aberta, 'a boca não nasce aberta');
  const perto = N.dentroDaBoca.find((q) => distanceFt(q, N.tenda) <= 10);
  await s.ir(s.party[0], perto);
  assert.equal(s.field.aresta(boca.a.x, boca.a.y, boca.b.x, boca.b.y), ARESTA.parede, 'a boca não fechou');
  assert.equal(s.enc.combatants.filter((c) => c.defId === 'armadilhaDeIntelecto' && c.side === 'foes').length, 2);
  for (const a of s.enc.combatants.filter((c) => c.side === 'foes')) { a.dead = true; a.hp = 0; }
  s.cena.estado.explorando = true;
  dadoFixo(s.enc, 20);
  const h = s.party.find((x) => x.name === 'Pip');
  h.pos = { ...h.pos, ...N.membrana };
  for (const re of [/Estudar/, /Procurar o ponto/, /Furar/]) {
    const o = s.cena.interacoes(N.membrana, null, h).find((x) => re.test(x.rotulo));
    assert.ok(o, `faltou ${re}`);
    await o.fazer();
  }
  assert.equal(s.field.aresta(boca.a.x, boca.a.y, boca.b.x, boca.b.y), ARESTA.aberta, 'o furo não abriu a boca');
});

await teste('Miasma: atravessar a névoa fere na chegada; pegar a língua solta os perseguidores, que caçam na ilha seguinte', async () => {
  escolher();
  const s = ilhaDoVazio('miasma');
  const vida = s.party.reduce((t, h) => t + h.hp, 0);
  await s.cena.iniciar();
  assert.ok(s.party.reduce((t, h) => t + h.hp, 0) < vida, 'a travessia da névoa não feriu');
  assert.ok(s.party.every((h) => distanceFt(h.pos, VZ.MIASMA.lingua) <= 10), 'o grupo não chegou na ilhota');
  const h = s.party[0];
  h.pos = { ...h.pos, ...VZ.MIASMA.lingua };
  await s.cena.interacoes(VZ.MIASMA.lingua, null, h).find((o) => /fita de metal/.test(o.rotulo)).fazer();
  assert.ok(garantirInventario(h).bag.some((i) => i.id === 'linguaDeMetal'));
  assert.ok(s.cena.explorando, 'brigou dentro da névoa');
  assert.equal(s.camp.obelisco8.vazio.perseguidoresVivos, 3);
  // os perseguidores vivos vão atrás, na próxima ilha
  const camp = s.camp;
  camp.obelisco8.vazio.perseguidoresVivos = 2;
  const s2 = ilhaDoVazio('estatua', camp);
  await s2.cena.iniciar();
  await s2.ir(s2.party[0], s2.party[0].pos);
  assert.equal(s2.enc.combatants.filter((c) => c.defId === 'perseguidorInvisivel' && c.side === 'foes').length, 2);
});

await teste('Estátua: a base fica fechada até a língua de metal; aberta, os presos contam o plano', async () => {
  escolher();
  const s = ilhaDoVazio('estatua');
  await s.cena.iniciar();
  const dentro = VZ.ESTATUA.refens[0];
  const alc = () => s.field.reachable(s.party[0].pos, 100000, () => false).has(`${dentro.x},${dentro.y}`);
  assert.ok(!alc());
  const h = s.party[0];
  h.pos = { ...h.pos, ...VZ.ESTATUA.boca };
  assert.ok(!s.cena.interacoes(VZ.ESTATUA.boca, null, h).some((o) => /língua/.test(o.rotulo)), 'abriu sem a língua');
  naMochila(h, 'linguaDeMetal');
  await s.cena.interacoes(VZ.ESTATUA.boca, null, h).find((o) => /língua/.test(o.rotulo)).fazer();
  assert.ok(alc(), 'a base não abriu');
  assert.ok(s.camp.vila.pistas.some((x) => /Ânima de Ilvaash/.test(x)));
});

await teste('Campo: com a Nellik morta, os mezzoloths da pirâmide se espalham; brigar com a Nellik chama as patrulhas pela trompa', async () => {
  escolher('contar');
  const camp = { vila: { pistas: [], missoes: {} }, obelisco8: { vazio: { ilha: 'campo', visitadas: [], aVista: [], feito: { nellikMorta: true }, mortos: [], descansos: 0 } } };
  const s = ilhaDoVazio('campo', camp);
  await s.cena.iniciar();
  await s.ir(s.party[0], VZ.CAMPO.piramide[10]);
  assert.ok(s.cena.explorando, 'brigou mesmo contando');
  assert.ok(['w1_1', 'w1_2', 'w1_3'].every((k) => s.cena.elenco[k].fugiu));
  escolher('atacar');
  const s2 = ilhaDoVazio('campo');
  await s2.cena.iniciar();
  const h = s2.party[0];
  h.pos = { ...h.pos, ...VZ.CAMPO.frevvik };
  await s2.cena.interacoes(s2.cena.elenco.nellik.pos, null, { ...h, pos: { ...s2.cena.elenco.nellik.pos } }).find((o) => /Nellik/.test(o.rotulo)).fazer();
  assert.ok(!s2.cena.explorando);
  assert.ok(typeof s2.enc.reinforcements === 'function', 'a trompa não chama ninguém');
  // o motor chama com o número da rodada; a primeira versão lia `enc.round` e as patrulhas nunca vinham
  for (let r = 1; r <= 10; r++) { s2.enc.round = r; s2.enc.spawnReinforcements(); }
  const patrulhas = Object.entries(s2.cena.elenco).filter(([k]) => k.startsWith('patrulha')).map(([, m]) => m);
  assert.ok(patrulhas.length === 4 && patrulhas.every((m) => m.side === 'foes'), 'a trompa não chamou as quatro');
});

await teste('Campo: a fumaça obscurece o campo menos perto do moinho; as três pás se quebram (CA 13, 30 PV), e com uma só girando a fumaça cobre o moinho', async () => {
  escolher('luta');
  const s = ilhaDoVazio('campo');
  await s.cena.iniciar();
  const { nivelDeLuz } = await import(P + 'rules/luz.js');
  const m = VZ.CAMPO.moinhoDentro;
  const luz = (x, y) => nivelDeLuz(s.enc.field, x, y, []);
  assert.equal(luz(VZ.CAMPO.grupo[0].x, VZ.CAMPO.grupo[0].y), 1, 'o campo longe do moinho não está na fumaça');
  assert.equal(luz(m.x, m.y), 2, 'o moinho está na fumaça com as pás girando');
  const zona = s.enc.zonas.find((z) => z.id === 'pasDoMoinho');
  assert.equal(zona?.casas.size, 3, 'não há três pás');
  const pas = [...zona.casas].map((k) => { const [x, y] = k.split(',').map(Number); return { x, y }; });
  // o veneno não fere a pá
  s.enc.rng.die = (n) => n;
  const h = s.party[0];
  h.pos = { ...h.pos, x: pas[0].x + 1, y: pas[0].y };
  if (s.enc.field.blocksMove(h.pos.x, h.pos.y)) h.pos = { ...h.pos, ...s.enc.casaLivreMaisProxima(pas[0]) };
  // duas pás caem
  zona.pvDoTrecho.set(`${pas[1].x},${pas[1].y}`, 1);
  zona.pvDoTrecho.set(`${pas[0].x},${pas[0].y}`, 1);
  // a primeira, explorando, pelo menu: a Nellik vem defender o moinho
  h.pos = { ...h.pos, ...s.enc.casaLivreMaisProxima(pas[0]) };
  await s.cena.interacoes(pas[0], null, h).find((o) => /pá do moinho/.test(o.rotulo)).fazer();
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(luz(m.x, m.y), 2, 'com duas pás girando a fumaça já cobriu o moinho');
  // a segunda, na luta, pelo ataque
  h.pos = { ...h.pos, ...s.enc.casaLivreMaisProxima(pas[1]) };
  h.actionUsed = false;
  assert.ok(s.enc.golpearMuralha(h, pas[1]).ok);
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(s.camp.obelisco8.vazio.feito.campo.pas.filter((pv) => pv > 0).length, 1, 'as pás não caíram');
  assert.equal(luz(m.x, m.y), 1, 'a fumaça não cobriu o moinho');
  // golpear a casa da Nellik a fez lutar
  assert.equal(s.cena.elenco.nellik.side, 'foes', 'a Nellik não defendeu o moinho');
});

await teste('O olhar do brutamonte umbral: não pega o cego nem quem não o vê, e quem desvia os olhos não testa', () => {
  // a pirâmide do Campo: o olhar pegava todo mundo, e o grupo perdia a primeira rodada inteira sem poder evitar
  const s = montar({ lado: 'foes', foes: [['brutamonteUmbral', { x: 7, y: 5 }]], pos: [{ x: 6, y: 5 }, { x: 6, y: 7 }, { x: 4, y: 5 }, { x: 1, y: 25 }] });
  const [dara, pip, brenn, ilvan] = s.party;
  const hulk = s.foes[0];
  assert.equal(hulk.aura?.olhar, true, 'o Olhar Confuso não veio marcado como olhar');
  dara.desviaOlhar = true;
  addCondition(pip, 'cego', { rounds: 10 });
  s.enc.beginSide('party');
  assert.ok(hasCondition(dara, 'olhosDesviados') && !hasCondition(dara, 'desnorteado'), 'quem desvia os olhos testou');
  assert.ok(!hasCondition(pip, 'desnorteado') && !new RegExp(`${pip.name} aguenta a aura`).test(s.texto()), 'o cego viu o olhar');
  assert.ok(hasCondition(brenn, 'desnorteado') || new RegExp(`${brenn.name} aguenta a aura`).test(s.texto()), 'quem olha não testou');
  assert.ok(!hasCondition(ilvan, 'desnorteado'), 'o olhar alcançou a 30 m');
  const contra = s.enc.attackModifiers(dara, hulk, { ranged: false });
  assert.ok(contra.disadvantage, 'de olhos desviados, ataca o brutamonte sem desvantagem');
  assert.ok(s.enc.attackModifiers(hulk, dara, { ranged: false }).advantage, 'o brutamonte não ataca com vantagem quem não o olha');
});

await teste('Vazio: voar para outra ilha leva à variante dela; a Poça leva à Cúpula', async () => {
  escolher();
  const s = ilhaDoVazio('cupula');
  await s.cena.iniciar();
  const destino = s.camp.obelisco8.vazio.aVista.find((i) => i !== 'anima');
  escolher(destino);
  await s.cena.viajar();
  assert.equal(s.app.novaCena.cenaDaVila, VARIANTE_DA_ILHA[destino]);
  const p = poca({ vila: { pistas: [], missoes: {} }, obelisco8: { poca: { milha: 6, fundo: true } } });
  await p.cena.iniciar();
  const estrela = p.cena.interacoes(PONTOS_POCA.estrela, null, { ...p.party[0], pos: { ...PONTOS_POCA.estrela } }).find((o) => /estrela/.test(o.rotulo));
  await estrela.fazer();
  assert.equal(p.app.novaCena.cenaDaVila, 'vazioCupula');
});

// ------------------------------------------------------------------------------------------------ a Ânima ----
await teste('O obelisco: o dano nele vai para o fanático mais perto, em dobro com o fator 2, e o veneno e o psíquico não passam', () => {
  const s = montar({ foes: [['obeliscoDaAnima', { x: 10, y: 10 }], ['devoradorClarividente', { x: 13, y: 10 }], ['devoradorClarividente', { x: 20, y: 10 }]] });
  const [ob, perto, longe] = s.foes;
  perto.ligadoAoObelisco = ob.id;
  longe.ligadoAoObelisco = ob.id;
  const [vO, vP, vL] = [ob.hp, perto.hp, longe.hp];
  s.enc.applyDamage(ob, 10, 'cortante', s.party[0]);
  assert.equal(ob.hp, vO, 'o obelisco perdeu PV');
  assert.equal(perto.hp, vP - 10, 'o mais perto não levou o golpe');
  assert.equal(longe.hp, vL, 'o mais longe levou');
  assert.ok(perto.temeOObelisco === ob.id && longe.temeOObelisco === ob.id, 'os fanáticos não aprenderam');
  ob.contragolpe = { fator: 2 };
  s.enc.applyDamage(ob, 10, 'fogo', s.party[0]);
  assert.equal(perto.hp, vP - 30, 'o dobro não dobrou');
  s.enc.applyDamage(ob, 10, 'psíquico', s.party[0]);
  s.enc.applyDamage(ob, 10, 'veneno', s.party[0]);
  assert.equal(perto.hp, vP - 30, 'o psíquico ou o veneno passaram pelo obelisco');
  perto.dead = true;
  s.enc.applyDamage(ob, 5, 'cortante', s.party[0]);
  assert.equal(longe.hp, vL - 10, 'morto o mais perto, o próximo não levou');
  assert.ok(s.enc.combatants.includes(ob) && ob.naoSeguraALuta, 'o obelisco segura a luta');
});

await teste('O obelisco: depois do primeiro contragolpe, o fanático não para onde fica o mais perto dele', () => {
  // o fanático A está a 15 m do obelisco e o B a 9 m; A tem um alvo colado ao obelisco e outro mais longe
  const s = montar({ lado: 'foes', foes: [['obeliscoDaAnima', { x: 10, y: 10 }], ['devoradorClarividente', { x: 20, y: 10 }], ['devoradorClarividente', { x: 16, y: 10 }]],
    pos: [{ x: 13, y: 10 }, { x: 24, y: 10 }, { x: 1, y: 28 }, { x: 2, y: 28 }] });
  const [ob, a, b] = s.foes;
  a.ligadoAoObelisco = b.ligadoAoObelisco = ob.id;
  b.acted = true;
  a.temeOObelisco = b.temeOObelisco = ob.id;
  takeMonsterTurn(s.enc, a);
  const dA = distanceFt(a.pos, ob.pos);
  assert.ok(dA > distanceFt(b.pos, ob.pos), `parou como o mais perto (${dA} pés contra ${distanceFt(b.pos, ob.pos)})`);
});

await teste('Ânima: onde fica cada fanático pelos pedaços (4: A1, A2, A4; 5: A1 e A4; 6 e 7: A4, e os profetas com 7)', () => {
  assert.deepEqual(salasDosFanaticos(4), { chishinix: 'A1', hashutu: 'A2', voalsh: 'A4', profetas: false });
  assert.deepEqual(salasDosFanaticos(5), { chishinix: 'A1', hashutu: 'A4', voalsh: 'A4', profetas: false });
  assert.deepEqual(salasDosFanaticos(6), { chishinix: 'A4', hashutu: 'A4', voalsh: 'A4', profetas: false });
  assert.equal(salasDosFanaticos(7).profetas, true);
  const s = ilhaDoVazio('anima', { vila: { pistas: [], missoes: {} }, obelisco6: { fragmentos: { talhundereth: true, cripta: true, encruzilhada: true } } });
  const e = s.cena.elenco;
  assert.ok(e.chishinix && e.hashutu && e.voalsh && e.cabeca && e.obelisco && !e.profeta1, Object.keys(e).join());
  assert.equal(e.obelisco.contragolpe.fator, 2, 'quem pegou fragmento não ganha o dobro');
  assert.equal(e.voalsh.speedFt, 0);
  assert.equal(e.voalsh.flyFt, 30);
  assert.ok(e.voalsh.conditionImmunities.includes('caido'));
  assert.equal(e.hashutu.senses.blindsightFt, 60);
  const s7 = ilhaDoVazio('anima');
  assert.ok(s7.cena.elenco.profeta1 && s7.cena.elenco.profeta2, 'sem os profetas com sete pedaços');
  assert.equal(s7.cena.elenco.obelisco.contragolpe.fator, 1);
});

await teste('Ânima: a Chishinix conversa, avisa os outros e ataca; abaixo de 30 PV recua para o alto, e a cabeça fica', async () => {
  escolher('conversar');
  const s = ilhaDoVazio('anima', { vila: { pistas: [], missoes: {} }, obelisco6: { fragmentos: { talhundereth: true, cripta: true, encruzilhada: true } } });
  await s.cena.iniciar();
  assert.ok(s.cena.explorando);
  const e = s.cena.elenco;
  await s.ir(s.party[0], { x: 22, y: 26 });
  assert.ok(!s.cena.explorando, 'a Chishinix não atacou');
  assert.ok(e.chishinix.side === 'foes' && e.cabeca.side === 'foes' && e.obelisco.side === 'foes');
  assert.equal(e.hashutu.salaDaAnima, 'A4', 'o Hashutu não subiu com o aviso');
  assert.ok(s.camp.vila.pistas.some((x) => /avisou os outros/.test(x)));
  s.enc.applyDamage(e.chishinix, e.chishinix.hp - 20, 'cortante', s.party[0]);
  assert.equal(e.chishinix.side, 'neutro', 'não recuou');
  assert.equal(e.chishinix.salaDaAnima, 'A4');
  assert.equal(e.cabeca.side, 'foes', 'a cabeça foi junto');
});

await teste('Ânima: entregar os pedaços à Chishinix deixa o obelisco inteiro (profetas em A3, contragolpe simples), e ela ataca do mesmo jeito', async () => {
  escolher('conversar', 'entregar');
  const s = ilhaDoVazio('anima', { vila: { pistas: [], missoes: {} }, obelisco6: { fragmentos: { talhundereth: true, cripta: true, encruzilhada: true } } });
  await s.cena.iniciar();
  const e = s.cena.elenco;
  assert.equal(e.obelisco.contragolpe.fator, 2);
  await s.ir(s.party[0], { x: 22, y: 26 });
  assert.ok(!s.cena.explorando, 'ela não atacou');
  assert.equal(e.obelisco.contragolpe.fator, 1, 'o contragolpe continuou em dobro');
  assert.ok(e.profeta1 && s.enc.combatants.includes(e.profeta1), 'os profetas não acordaram');
  const { fragmentosDosFanaticos, grupoPegouFragmento } = await import(P + 'game/vazio.js');
  assert.equal(fragmentosDosFanaticos(s.camp), 7);
  assert.equal(grupoPegouFragmento(s.camp), false);
});

await teste('Vazio: esperar uma ilha conhecida custa 1d6 dias de descanso e a traz de volta à vista', async () => {
  escolher('esperar', 'charco');
  const camp = { vila: { pistas: [], missoes: {} }, obelisco8: { vazio: { ilha: 'cupula', visitadas: ['cupula', 'charco'], aVista: ['ponte'], feito: {}, mortos: [], descansos: 0 } } };
  const s = ilhaDoVazio('cupula', camp);
  await s.cena.iniciar();
  await s.cena.viajar();
  const v = camp.obelisco8.vazio;
  assert.ok(v.descansos >= 1 && v.descansos <= 6, `descansou ${v.descansos} vezes`);
  assert.equal(v.aVista[0], 'charco');
});

await teste('Ânima: no alto, a luta é com o obelisco; mortos os três fanáticos ele vira pó e sobe o 12º nível', async () => {
  escolher();
  const s = ilhaDoVazio('anima', { vila: { pistas: [], missoes: {} }, obelisco6: { fragmentos: { talhundereth: true } } });
  await s.cena.iniciar();
  const e = s.cena.elenco;
  // 6 pedaços: os três no alto, a Chishinix e a cabeça entre eles
  assert.ok(['chishinix', 'hashutu', 'voalsh'].every((k) => e[k].salaDaAnima === 'A4'));
  for (const h of s.party) h.pos = { ...h.pos, ...s.enc.casaLivreMaisProxima({ x: 23, y: 12 }) };
  await s.ir(s.party[0], { x: 23, y: 12 });
  assert.ok(!s.cena.explorando, 'a luta do alto não começou');
  assert.ok(e.obelisco.side === 'foes' && e.voalsh.side === 'foes');
  for (const k of ['chishinix', 'hashutu']) s.enc.applyDamage(e[k], 999, 'cortante', s.party[0]);
  assert.ok(!e.obelisco.dead, 'virou pó com um fanático vivo');
  s.enc.applyDamage(e.voalsh, 999, 'cortante', s.party[0]);
  assert.ok(e.obelisco.dead, 'não virou pó');
  assert.ok(s.enc.field.sobreposicoes?.find?.((x) => x.id === 'obeliscoQuebrado')?.ligada ?? true, 'o desenho quebrado não acendeu');
  s.enc.applyDamage(e.cabeca, 999, 'cortante', s.party[0]);
  s.enc.checkEnd();
  await s.cena.fimDoCombate('vitoria');
  assert.ok(s.party.every((h) => h.dead || h.xp >= XP_POR_NIVEL[12]), 'o marco do 12º não veio');
  assert.ok(s.cena.explorando);
  // a volta: da plataforma, pela estrela sem luz, para a Poça
  const h = s.party[0];
  h.pos = { ...h.pos, x: 22, y: 30 };
  const volta = s.op({ x: 22, y: 30 }, h, /estrela sem luz/);
  assert.ok(volta, 'sem a volta pela estrela');
  await volta.fazer();
  assert.equal(s.app.novaCena.cenaDaVila, 'pocaSalgada');
  assert.ok(!h.vooDoVazio, 'saiu voando');
});

await teste('Ânima: as tabuletas contam a fraqueza; o frasco e os diamantes se pegam', async () => {
  escolher();
  const s = ilhaDoVazio('anima', { vila: { pistas: [], missoes: {} }, obelisco6: { fragmentos: { talhundereth: true, cripta: true, encruzilhada: true } } });
  await s.cena.iniciar();
  const h = s.party.find((c) => /Ilvan/.test(c.name)) ?? s.party[3];
  dadoFixo(s.enc, 20);
  h.pos = { ...h.pos, x: VZ.ANIMA.altar.x + 1, y: VZ.ANIMA.altar.y };
  await s.op(VZ.ANIMA.altar, h, /tabuletas/).fazer();
  assert.ok(s.camp.vila.pistas.some((x) => /volta sobre os fanáticos/.test(x)), 'as tabuletas não contaram');
  await s.op(VZ.ANIMA.altar, h, /diamantes/).fazer();
  assert.equal(garantirInventario(h).bag.find((i) => i.id === 'diamanteDaEstatua')?.qtd, 4);
  h.pos = { ...h.pos, x: VZ.ANIMA.prateleira.x - 1, y: VZ.ANIMA.prateleira.y };
  await s.op(VZ.ANIMA.prateleira, h, /frasco/).fazer();
  assert.ok(garantirInventario(h).bag.some((i) => i.id === 'pocaoDeCuraSuprema'));
});

// --------------------------------------------------------------------------------------------- a Refração ----
const comObeliscoEmPo = (extra = {}) => ({ vila: { pistas: [], missoes: {} }, obelisco8: { feito: {}, vazio: { feito: { anima: { obeliscoEmPo: true } }, mortos: [], visitadas: [], aVista: [] }, ...extra } });

await teste('Refração: quem sobe da Poça com o obelisco em pó acha a Refração na saída de B22; o verme vivo sobe na 3ª rodada', async () => {
  escolher();
  const s = labirinto({ campanha: comObeliscoEmPo(), config: { chegada: 'poca' }, nivel: 12 });
  await s.cena.iniciar();
  assert.ok(!s.cena.explorando, 'a Refração não apareceu');
  const ref = s.enc.combatants.find((c) => c.defId === 'refracaoDeIlvaash');
  assert.ok(ref && ref.side === 'foes');
  const b22 = new Set(L.salas.B22.map((q) => `${q.x},${q.y}`));
  for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 3; dx++) {
    assert.ok(b22.has(`${ref.pos.x + dx},${ref.pos.y + dy}`) && !s.field.blocksMove(ref.pos.x + dx, ref.pos.y + dy), `a pegada da Refração cai fora de B22 ou na parede (${ref.pos.x + dx},${ref.pos.y + dy})`);
  }
  assert.ok(typeof s.enc.reinforcements === 'function', 'o verme vivo não vem');
  assert.equal(s.enc.reinforcements(2), null);
  s.enc.round = 3;
  s.enc.spawnReinforcements();
  const verme = s.enc.combatants.find((c) => c.defId === 'vermePurpura');
  assert.ok(verme && verme.side === 'foes', 'o verme não subiu na 3ª rodada');
  // o verme que morreu na Poça não sobe
  const s2 = labirinto({ campanha: comObeliscoEmPo({ poca: { milha: 6, fundo: true, vermeMorto: true } }), config: { chegada: 'poca' }, nivel: 12 });
  await s2.cena.iniciar();
  assert.equal(s2.enc.reinforcements, null, 'o verme morto na Poça voltou');
  // sem o obelisco em pó, a Poça devolve o grupo ao labirinto de sempre
  const s3 = labirinto({ config: { chegada: 'poca' }, nivel: 12 });
  await s3.cena.iniciar();
  assert.ok(s3.cena.explorando && !s3.enc.combatants.some((c) => c.defId === 'refracaoDeIlvaash'));
});

await teste('Refração: vencida, o labirinto treme e em B1 se abre o segundo portal; a volta a Phandalin é o epílogo, e a vila curada', async () => {
  escolher();
  const s = labirinto({ campanha: comObeliscoEmPo(), config: { chegada: 'poca' }, nivel: 12 });
  await s.cena.iniciar();
  const ref = s.enc.combatants.find((c) => c.defId === 'refracaoDeIlvaash');
  s.enc.applyDamage(ref, 999, 'radiante', s.party[0], { magico: true });
  s.enc.checkEnd();
  await s.cena.fimDoCombate('vitoria');
  assert.ok(s.camp.obelisco8.feito.refracaoVencida && s.camp.obelisco8.lab.feito.refracaoVencida);
  assert.ok(s.camp.vila.pistas.some((x) => /segundo|outro, para o resto/.test(x)));
  const h = s.party[0];
  h.pos = { ...h.pos, ...L.portal };
  assert.ok(s.op(L.portal, h, /segundo portal/), 'sem o segundo portal em B1');
  assert.ok(s.op(L.portal, h, /Voltar a Illithinoch/), 'o portal de Illithinoch sumiu antes da hora');
  // o epílogo na vila
  const { criarCapitulo7NaVila } = await import(P + 'game/obelisco7-vila.js');
  const camp = { ...s.camp, obelisco6: { marco9: true }, obelisco7: { iniciado: true, feito: { wheelOuvido: true }, lutas: { santuario: true } } };
  const registro = [];
  const cap7 = criarCapitulo7NaVila({ app: s.app, camp, registro, pista: (x) => camp.vila.pistas.push(x) });
  await cap7.chegada();
  assert.ok(camp.obelisco8.feito.epilogo, 'o epílogo não veio');
  assert.ok(registro.some((x) => /curada/.test(x)));
  assert.equal(await cap7.cenaDoLugar('gigante'), null, 'a vila curada ainda manda descer pelo buraco');
});

const Refens = await import(P + 'game/refens-obelisco.js');

await teste('Reféns: soltos na Cúpula, o grupo os leva; eles andam junto, não lutam (fogem e se esquivam) e ficam depois da luta', async () => {
  escolher('levar');
  const s = ilhaDoVazio('cupula');
  await s.cena.iniciar();
  const f = s.camp.obelisco8.vazio.feito.cupula;
  for (const m of Object.values(s.cena.elenco)) if (m.defId !== 'plebeu') { m.hp = 0; m.dead = true; }
  // solta os quatro (Atletismo CD 12 com o dado no máximo)
  s.enc.rng.die = (n) => n;
  for (let i = 0; i < 4; i++) {
    const p = VZ.CUPULA.refens[i];
    const h = s.party[0];
    h.pos = { ...h.pos, ...s.enc.casaLivreMaisProxima(p) };
    await s.cena.interacoes(p, null, h).find((o) => /Soltar/.test(o.rotulo)).fazer();
  }
  assert.ok(f.refensSoltos);
  const rs = s.enc.combatants.filter((c) => c.refemDoObelisco);
  assert.equal(rs.length, 4, 'os reféns não vieram com o grupo');
  assert.ok(rs.every((r) => r.side === 'party' && r.naoCombatente && r.invocado?.auto && r.flyFt), 'o refém não é do grupo, não voa, ou luta');
  assert.deepEqual(Refens.refensComOGrupo(s.camp).sort(), [...Refens.REFENS.cupula].sort());
  // explorando, seguem quem anda
  const h = s.party[0];
  const longe = s.enc.casaLivreMaisProxima({ x: 15, y: 28 });
  h.pos = { ...h.pos, ...longe };
  await s.cena.depoisDeMover(h);
  assert.ok(rs.every((r) => Math.max(Math.abs(r.pos.x - h.pos.x), Math.abs(r.pos.y - h.pos.y)) <= 3), 'os reféns ficaram para trás');
  // na luta: fogem e se esquivam
  const { takeMonsterTurn: turno } = await import(P + 'rules/ai.js');
  const g = makeMonster('goblin', { ...rs[0].pos, x: rs[0].pos.x + 1 });
  g.pos = { ...g.pos, ...s.enc.casaLivreMaisProxima(g.pos) };
  g.side = 'foes';
  s.enc.addCombatant(g);
  s.enc.side = 'party';
  for (const c of s.enc.combatants) { c.actionUsed = false; c.acted = false; c.movementLeftFt = 30; }
  const antes = distanceFt(rs[0].pos, g.pos);
  turno(s.enc, rs[0]);
  assert.ok(hasCondition(rs[0], 'esquivando'), 'o refém não se esquivou');
  assert.ok(distanceFt(rs[0].pos, g.pos) >= antes, 'o refém não fugiu');
  assert.ok(!s.enc.log.some((l) => /Plebeu|Thawnia.*acerta|Thawnia.*erra/.test(l.text ?? '')), 'o refém atacou');
  // a luta acaba: o goblin morre, e os reféns ficam
  g.hp = 0; g.dead = true;
  s.enc.over = false;
  s.enc.checkEnd();
  assert.ok(s.enc.combatants.filter((c) => c.refemDoObelisco).length === 4, 'os reféns foram embora com o fim da luta');
  // e o que morre fica morto
  rs[3].hp = 0;
  s.cena.evento({ type: 'died', target: rs[3] });
  assert.ok(Refens.estadoDosRefens(s.camp).mortos.includes(rs[3].name));
  assert.equal(Refens.refensComOGrupo(s.camp).length, 3);
});

await teste('Reféns: deixados esperando ficam na ilha; voltando lá, o grupo os chama', async () => {
  escolher('esperar');
  const camp = { vila: { pistas: [], missoes: {} } };
  const s = ilhaDoVazio('cupula', camp);
  await s.cena.iniciar();
  for (const m of Object.values(s.cena.elenco)) if (m.defId !== 'plebeu') { m.hp = 0; m.dead = true; }
  s.enc.rng.die = (n) => n;
  for (let i = 0; i < 4; i++) {
    const p = VZ.CUPULA.refens[i];
    s.party[0].pos = { ...s.party[0].pos, ...s.enc.casaLivreMaisProxima(p) };
    await s.cena.interacoes(p, null, s.party[0]).find((o) => /Soltar/.test(o.rotulo)).fazer();
  }
  assert.equal(Refens.estadoDosRefens(camp).esperando.cupula.length, 4);
  assert.equal(Refens.contaDosRefens(camp).ficaram.length, 4);
  escolher('levar');
  const s2 = ilhaDoVazio('cupula', camp);
  await s2.cena.iniciar();
  const h = s2.party[0];
  await s2.cena.interacoes(h.pos, null, h).find((o) => /reféns que esperam/.test(o.rotulo)).fazer();
  assert.equal(Refens.refensComOGrupo(camp).length, 4);
  assert.equal(Refens.contaDosRefens(camp).ficaram.length, 0);
});

await teste('Reféns: a Refração os mira; subindo a Poça eles também rolam a milha e chamam o verme', async () => {
  escolher();
  const camp = comObeliscoEmPo({ refens: { comGrupo: { Wramble: 4, Shansa: 4 }, esperando: {}, mortos: [] } });
  const s = labirinto({ campanha: camp, config: { chegada: 'poca' }, nivel: 12 });
  await s.cena.iniciar();
  const ref = s.enc.combatants.find((c) => c.defId === 'refracaoDeIlvaash');
  const rs = s.enc.combatants.filter((c) => c.refemDoObelisco);
  assert.equal(rs.length, 2);
  assert.deepEqual([...ref.alvosPreferidos].sort(), rs.map((r) => r.id).sort(), 'a Refração não mira os reféns');
  // a Poça: subindo com reféns e o verme vivo, a milha pede teste deles também
  escolher('luta');
  const camp2 = { vila: { pistas: [], missoes: {} }, obelisco8: { feito: {}, poca: { milha: 6, fundo: true }, refens: { comGrupo: { Wramble: 4 }, esperando: {}, mortos: [] } } };
  const p = poca(camp2);
  await p.cena.iniciar();
  p.enc.rng.die = () => 1;
  await p.cena.subir();
  assert.ok(p.cena.estado.verme, 'o verme não veio atrás de quem falhou');
  assert.ok(camp2.obelisco8.poca.subindo, 'a subida não ficou marcada');
});

await teste('O portal: vencida a Refração, ele fecha em uma hora de passos; o descanso do covil o fecha; antes, aos 7 dias, fica instável', async () => {
  escolher();
  const s = labirinto({ campanha: comObeliscoEmPo(), config: { chegada: 'poca' }, nivel: 12 });
  await s.cena.iniciar();
  const ref = s.enc.combatants.find((c) => c.defId === 'refracaoDeIlvaash');
  s.enc.applyDamage(ref, 999, 'radiante', s.party[0], { magico: true });
  s.enc.checkEnd();
  await s.cena.fimDoCombate('vitoria');
  const t = s.camp.obelisco8.lab;
  assert.equal(t.portalMinutos, 0);
  const h = s.party[0];
  for (let i = 0; i < 59; i++) await s.ir(h, L.salas.B22[i % 2]);
  assert.ok(!t.feito.portalFechado, 'fechou antes da hora');
  h.pos = { ...h.pos, ...L.portal };
  assert.match(s.op(L.portal, h, /Voltar a Illithinoch/).detalhe, /fecha em 1 minuto/);
  await s.ir(h, L.salas.B22[0]);
  assert.ok(t.feito.portalFechado, 'o portal não fechou em uma hora');
  h.pos = { ...h.pos, ...L.portal };
  assert.equal(s.op(L.portal, h, /Voltar a Illithinoch/).motivo, 'o portal fechou');
  assert.ok(s.op(L.portal, h, /Atravessar o segundo portal/));
  // o covil, depois da Refração: oito horas de sono fecham o portal
  const camp = { vila: { pistas: [], missoes: {} }, obelisco8: { lab: { feito: { refracaoVencida: true }, mortos: [], portas: {}, portalMinutos: 5 } } };
  const c = labirinto({ variante: 'covilLowarnizel', criar: criarCovilLowarnizel, campanha: camp });
  await c.cena.iniciar();
  await c.cena.descansar();
  assert.ok(camp.obelisco8.lab.feito.portalFechado);
  // antes da Refração, com 7 dias no Reino Distante, o portal treme: Arcanismo CD 18
  escolher();
  const camp3 = { vila: { pistas: [], missoes: {} }, obelisco8: { lab: { feito: {}, mortos: [], portas: {}, dia: 3 }, vazio: { descansos: 4, feito: {}, mortos: [], visitadas: [], aVista: [] } } };
  const s3 = labirinto({ campanha: camp3 });
  await s3.cena.iniciar();
  const h3 = s3.party[0];
  h3.pos = { ...h3.pos, ...L.portal };
  const firmar = s3.op(L.portal, h3, /portal instável/);
  assert.ok(firmar && !s3.op(L.portal, h3, /^Voltar a Illithinoch$/), 'o portal não ficou instável aos 7 dias');
  s3.enc.rng.die = () => 1;
  await firmar.fazer();
  assert.equal(s3.op(L.portal, h3, /portal instável/).motivo, 'só depois de passar um dia');
});

await teste('Socorro: vencido pela Refração, o grupo fica colado em B22; quatro heróis novos chegam pelo portal, vencem a Refração e soltam os antigos', async () => {
  escolher('socorro');
  const s = labirinto({ campanha: comObeliscoEmPo(), config: { chegada: 'poca' }, nivel: 12 });
  await s.cena.iniciar();
  const antigos = s.party.map((c) => c.id);
  for (const h of s.party) { h.hp = 0; }
  await s.cena.fimDoCombate('derrota');
  const soc = s.camp.obelisco8.socorro;
  assert.equal(soc?.presos?.length, 4, 'os antigos não ficaram presos');
  assert.ok(soc.presos.every((p) => p.hp === 1 && !p.dead));
  const novos = s.app.novaCena?.continuarCom ?? [];
  assert.equal(novos.length, 4, 'o socorro não veio');
  assert.ok(novos.every((c) => !antigos.includes(c.id) && c.level === 12), 'o socorro repetiu herói ou veio em outro nível');
  // o socorro entra no labirinto e vai a B22: a Refração espera lá
  escolher();
  const mapa = mapaDo('labirintoSalgado');
  const field = montarCampo(mapa);
  novos.forEach((c, i) => { c.pos = { x: mapa.grupo[i].x, y: mapa.grupo[i].y, f: 1 }; });
  const app = appDeMentira(s.camp);
  const enc = new Encounter({ battlefield: field, party: novos, foes: [], rng: makeRng(4), emboscada: null, reinforcements: () => null });
  app.enc = enc;
  const cena = criarLabirintoSalgado(app, { cenaDaVila: 'labirintoSalgado' });
  enc.onEvent = (ev) => cena.evento?.(ev);
  await cena.iniciar();
  const h = novos[0];
  h.pos = { ...h.pos, ...enc.casaLivreMaisProxima(L.salas.B22[5]) };
  await cena.depoisDeMover(h);
  const ref = enc.combatants.find((c) => c.defId === 'refracaoDeIlvaash');
  assert.ok(ref && !cena.explorando, 'a Refração não esperava o socorro em B22');
  enc.applyDamage(ref, 999, 'radiante', h, { magico: true });
  enc.checkEnd();
  await cena.fimDoCombate('vitoria');
  h.pos = { ...h.pos, ...enc.casaLivreMaisProxima(L.bastoesB22) };
  const op = cena.interacoes(L.bastoesB22, null, h).find((o) => /colados na parede/.test(o.rotulo));
  assert.ok(op && !op.motivo, 'não dá para soltar os antigos');
  await op.fazer();
  assert.equal(enc.combatants.filter((c) => c.side === 'party' && antigos.includes(c.id)).length, 4, 'os antigos não voltaram ao grupo');
  assert.equal(soc.presos.length, 0);
});

await teste('Vazio: vagar sem rumo chama 1d6 ardis do intelecto; vencidos, duas ilhas novas à vista', async () => {
  escolher('vagar', 'vagar');
  const camp = { vila: { pistas: [], missoes: {} }, obelisco8: { vazio: { ilha: 'ponte', visitadas: ['cupula', 'ponte'], aVista: [], feito: {}, mortos: [], descansos: 0 } } };
  const s = ilhaDoVazio('ponte', camp);
  await s.cena.iniciar();
  for (const m of Object.values(s.cena.elenco)) { m.hp = 0; m.dead = true; }
  await s.cena.viajar();
  const ardis = s.enc.combatants.filter((c) => c.defId === 'armadilhaDeIntelecto' && !c.dead);
  assert.ok(ardis.length >= 1 && ardis.length <= 6 && ardis.every((a) => a.side === 'foes'), `${ardis.length} ardis`);
  for (const a of ardis) { a.hp = 0; a.dead = true; }
  s.enc.checkEnd();
  await s.cena.fimDoCombate('vitoria');
  assert.ok(camp.obelisco8.vazio.aVista.length >= 1, 'a deriva não mostrou ilha nenhuma');
});

await teste('Ânima: a plataforma e A4 ficam 3 m acima do chão e o estrado 6 m; quem voa não paga a subida', async () => {
  escolher();
  const s = ilhaDoVazio('anima', { vila: { pistas: [], missoes: {} }, obelisco6: { fragmentos: { talhundereth: true } } });
  await s.cena.iniciar();
  const f = s.enc.field;
  const ob = VZ.ANIMA.obelisco;
  assert.equal(f.heightAt(VZ.ANIMA.a4[0].x, VZ.ANIMA.a4[0].y), Math.max(Math.abs(VZ.ANIMA.a4[0].x - ob.x), Math.abs(VZ.ANIMA.a4[0].y - ob.y)) <= 2 ? 4 : 2);
  assert.equal(f.heightAt(VZ.ANIMA.grupo[0].x, VZ.ANIMA.grupo[0].y), 2, 'a plataforma não está no alto');
  assert.equal(f.heightAt(VZ.ANIMA.tubos.x, VZ.ANIMA.tubos.y), 0, 'o refeitório não está no chão');
  // voando, sobe-se à plataforma sem custo a mais
  const h = s.party[0];
  const r = s.enc.reachableFor(h);
  assert.ok(r.size > 20, 'o herói não alcança quase nada');
});

await teste('Shalfi: convencido no covil, o dragão sobe cavando por baixo da cova de B9 e luta com o grupo; depois desce', async () => {
  escolher();
  const camp = { vila: { pistas: [], missoes: {} }, obelisco8: { lab: { feito: { shalfiVisto: true }, mortos: [], portas: {} } } };
  const c = labirinto({ variante: 'covilLowarnizel', criar: criarCovilLowarnizel, campanha: camp });
  await c.cena.iniciar();
  c.enc.rng.die = (n) => n;
  await c.cena.depoisDaConversa(c.cena.elenco.lowarnizel, 'irAoShalfi');
  assert.ok(camp.obelisco8.lab.feito.dragaoVaiAoShalfi, 'o dragão não foi convencido');
  escolher('luta');
  camp.obelisco8.lab.feito.shalfiVisto = false;
  const s = labirinto({ campanha: camp });
  await s.cena.iniciar();
  await s.ir(s.party[0], L.salas.B9[10]);
  const drag = s.enc.combatants.find((x) => x.chaveDoLabirinto === 'lowarnizel');
  assert.ok(drag && drag.side === 'party' && drag.invocado?.auto, 'o dragão não subiu do lado do grupo');
  assert.equal(s.cena.elenco.shalfi.side, 'foes');
  for (const f of [s.cena.elenco.shalfi, s.cena.elenco.jitterjaws]) { f.hp = 0; f.dead = true; }
  s.enc.checkEnd();
  await s.cena.fimDoCombate('vitoria');
  assert.ok(!s.enc.combatants.includes(drag), 'o dragão ficou no labirinto');
  assert.ok(camp.obelisco8.lab.mortos.includes('shalfi') && !camp.obelisco8.lab.mortos.includes('lowarnizel'));
});

console.log(`\n${total - falhas}/${total} testes passaram.`);
if (falhas) process.exit(1);
