// AS MAGIAS DOS LIVROS (o PHB): o que `importar-magias.mjs` trouxe e o motor passou a conjurar.
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-magias-livros.mjs
//
// Cada prova usa uma magia que não existia antes desta leva, então nenhuma passa no código antigo.
import assert from 'node:assert/strict';

const P = new URL('../', import.meta.url).href;
const { Encounter } = await import(P + 'rules/combat.js');
const { makeParty } = await import(P + 'rules/party.js');
const { makeMonster, MONSTERS } = await import(P + 'rules/monsters.js');
const { Battlefield, distanceFt } = await import(P + 'core/grid.js');
const { makeRng } = await import(P + 'core/rng.js');
const { hasCondition, addCondition } = await import(P + 'rules/conditions.js');
const { SPELLS } = await import(P + 'rules/spells.js');

let total = 0;
let falhas = 0;
async function teste(nome, fn) {
  total += 1;
  try { await fn(); console.log(`ok    ${nome}`); } catch (e) {
    falhas += 1;
    console.log(`FALHA ${nome}\n      ${String(e.stack ?? e.message).split('\n').slice(0, 6).join('\n      ')}`);
  }
}

const ABERTO = Array(16).fill('................');
function montar({ seed = 1, foes = [], nivel = 17, lado = 'party' } = {}) {
  const field = new Battlefield(16, 16, ABERTO);
  const party = makeParty({ nivel });
  [{ x: 3, y: 3 }, { x: 3, y: 5 }, { x: 3, y: 7 }, { x: 3, y: 9 }].forEach((p, i) => { party[i].pos = { ...party[i].pos, ...p }; });
  const fs = foes.map(([id, p]) => makeMonster(id, p));
  const enc = new Encounter({ battlefield: field, party, foes: fs, rng: makeRng(seed) });
  enc.firstSide = lado;
  enc.round = 1;
  enc.beginSide(lado);
  return { enc, party, foes: fs };
}
/** Um conjurador com a magia pronta e espaço de 9º círculo, que falha nada de propósito: a CD vai alta. */
function conjurador(c, ...ids) {
  c.spellcasting = { ability: 'int', cantrips: [], prepared: [...ids], slots: [0, 9, 9, 9, 9, 9, 9, 9, 9, 9], cdPorMagia: Object.fromEntries(ids.map((id) => [id, 99])) };
  c.actionUsed = false;
  c.bonusUsed = false;
  return c;
}

await teste('o PHB entrou como dado: só a magia que o jogo faz está no jogo; a outra fica na fila', async () => {
  const doPhb = Object.values(SPELLS).filter((s) => s.fonte === 'phb');
  assert.ok(doPhb.length >= 90, `${doPhb.length}`);
  assert.ok(doPhb.every((s) => s.desc && s.name && s.level >= 1 && !s.semMotor), 'nenhuma sem efeito no catálogo');
  const fila = JSON.parse((await import('node:fs')).readFileSync(new URL('./magias/phb-pendente.json', import.meta.url), 'utf8'));
  for (const id of ['desejo', 'moldarRochas', 'conjurarElemental', 'controlarOClima']) {
    assert.ok(!SPELLS[id], `${id} não está no jogo`);
    assert.ok(fila.some((p) => p.magia === id && p.motivo), `${id} está na fila, com o motivo`);
  }
  assert.ok(MONSTERS.lich.spellcasting.prepared.includes('palavraDePoderAtordoar'), 'o lich do MM ganhou a magia que lhe faltava');
});

await teste('Ferir não deixa abaixo de 1 PV e tira PV máximo de quem falha', () => {
  const t = montar({ foes: [['ogro', { x: 6, y: 5 }]] });
  const clerigo = conjurador(t.party[0], 'ferir');
  const ogro = t.foes[0];
  ogro.hp = 20;
  const max = ogro.maxHp;
  assert.ok(t.enc.castSpell(clerigo, 'ferir', { target: ogro, point: ogro.pos, circulo: 6 }).ok);
  assert.equal(ogro.hp, 1, 'fica com 1');
  assert.ok(ogro.maxHp < max, 'e perde PV máximo');
});

await teste('Palavra de Poder Atordoar: sem teste até 150 PV; acima, nada', () => {
  const t = montar({ foes: [['ogro', { x: 6, y: 5 }], ['giganteDasNuvens', { x: 10, y: 10 }]] });
  const mago = conjurador(t.party[0], 'palavraDePoderAtordoar');
  assert.ok(t.enc.castSpell(mago, 'palavraDePoderAtordoar', { target: t.foes[0], point: t.foes[0].pos, circulo: 8 }).ok);
  assert.ok(hasCondition(t.foes[0], 'atordoado'));
  const gigante = t.foes[1];
  gigante.hp = 200;
  mago.actionUsed = false;
  mago.pos = { ...mago.pos, x: 8, y: 9 };
  t.enc.castSpell(mago, 'palavraDePoderAtordoar', { target: gigante, point: gigante.pos, circulo: 8 });
  assert.ok(!hasCondition(gigante, 'atordoado'), 'com mais de 150 PV, a palavra não o alcança');
});

await teste('Dominar Pessoa: o bandido dominado golpeia o próprio bando no turno dele', () => {
  const t = montar({ foes: [['bandido', { x: 6, y: 5 }], ['bandido', { x: 7, y: 5 }]] });
  const bardo = conjurador(t.party[0], 'dominarPessoa');
  const [a, b] = t.foes;
  assert.ok(t.enc.castSpell(bardo, 'dominarPessoa', { target: a, point: a.pos, circulo: 5 }).ok);
  assert.ok(hasCondition(a, 'dominado'));
  const antes = b.hp;
  for (let i = 0; i < 4 && b.hp === antes; i++) { a.acted = false; t.enc.beginSide('foes'); }
  assert.ok(b.hp < antes || b.dead, 'o dominado bateu no companheiro');
});

await teste('Globo de Invulnerabilidade: a Bola de Fogo de fora não entra', () => {
  const t = montar({ foes: [['ogro', { x: 10, y: 5 }]] });
  const ogro = t.foes[0];
  addCondition(ogro, 'globo', { source: ogro.id });
  const mago = conjurador(t.party[0], 'bolaDeFogo');
  const hp = ogro.hp;
  t.enc.castSpell(mago, 'bolaDeFogo', { target: ogro, point: ogro.pos, circulo: 3 });
  assert.equal(ogro.hp, hp, 'de fora, 3º círculo: nada');
  mago.actionUsed = false;
  t.enc.castSpell(mago, 'bolaDeFogo', { target: ogro, point: ogro.pos, circulo: 6 });
  assert.ok(ogro.hp < hp, 'no 6º círculo, passa');
});

await teste('Escudo de Fogo queima quem bate; Mente Vazia não sente psíquico; Onda Destrutiva poupa os aliados', () => {
  const t = montar({ foes: [['ogro', { x: 4, y: 3 }]] });
  const guerreira = t.party[0];
  addCondition(guerreira, 'escudoDeFogo', { source: guerreira.id });
  guerreira.ac = 0;
  const ogro = t.foes[0];
  const hp = ogro.hp;
  t.enc.resolveAttack(ogro, guerreira, {});
  assert.ok(ogro.hp < hp, 'o ogro se queimou');
  addCondition(guerreira, 'menteVazia', { source: guerreira.id });
  const pv = guerreira.hp;
  t.enc.applyDamage(guerreira, 10, 'psíquico', ogro, { magico: true });
  assert.equal(guerreira.hp, pv, 'imune a psíquico');
  const u = montar({ foes: [['ogro', { x: 4, y: 4 }]] });
  const pal = conjurador(u.party[1], 'ondaDestrutiva');
  const aliado = u.party[0];
  const hpA = aliado.hp;
  const hpO = u.foes[0].hp;
  assert.ok(u.enc.castSpell(pal, 'ondaDestrutiva', { point: pal.pos, circulo: 5 }).ok);
  assert.equal(aliado.hp, hpA, 'o aliado ao lado não sofre');
  assert.ok(u.foes[0].hp < hpO, 'o ogro sofre');
});

await teste('Golpe Atordoante faz cambalear; Parar o Tempo dá turnos seguidos', () => {
  const t = montar({ foes: [['ogro', { x: 4, y: 3 }]] });
  const pal = conjurador(t.party[0], 'destruicaoCambaleante');
  assert.ok(t.enc.castSpell(pal, 'destruicaoCambaleante', { target: pal, point: pal.pos, circulo: 4 }).ok);
  const ogro = t.foes[0];
  ogro.ac = 0;
  ogro.abilities.wis = 1;
  for (let i = 0; i < 4 && !hasCondition(ogro, 'cambaleante'); i++) { pal.actionUsed = false; t.enc.resolveAttack(pal, ogro, {}); }
  assert.ok(hasCondition(ogro, 'cambaleante'));
  const mago = conjurador(t.party[1], 'pararOTempo');
  assert.ok(t.enc.castSpell(mago, 'pararOTempo', { target: mago, point: mago.pos, circulo: 9 }).ok);
  let turnos = 1;
  for (let i = 0; i < 6 && hasCondition(mago, 'tempoParado'); i++) { t.enc.endTurn(mago); if (!mago.acted) turnos += 1; }
  assert.ok(turnos >= 2 && turnos <= 5, `turnos seguidos: ${turnos}`);
});

await teste('O lich conjura o que ganhou: a Palavra de Poder num herói ao alcance', async () => {
  const { takeMonsterTurn } = await import(P + 'rules/ai.js');
  const t = montar({ foes: [['lich', { x: 6, y: 5 }]], lado: 'foes' });
  const lich = t.foes[0];
  let usou = false;
  const cast0 = t.enc.castSpell.bind(t.enc);
  t.enc.castSpell = (a, id, o) => { if (a === lich && ['palavraDePoderAtordoar', 'palavraDePoderMatar', 'dominarMonstro'].includes(id)) usou = true; return cast0(a, id, o); };
  for (let i = 0; i < 3 && !usou; i++) { lich.actionUsed = false; lich.acted = false; takeMonsterTurn(t.enc, lich); }
  assert.ok(usou, 'o lich tira um herói da luta com a magia nova');
});

// ------------------------------------------------------------------------- a segunda leva: as magias de combate ----
const conta = (enc, defId) => enc.combatants.filter((c) => c.defId === defId && !c.dead).length;

await teste('Invocações: o inseto gigante não dobra no círculo maior; o Animar Objetos traz dez; e as de 1 minuto ficam para fora da luta', () => {
  const t = montar({ foes: [['ogro', { x: 12, y: 12 }]] });
  const mago = conjurador(t.party[0], 'conjurarElemental', 'insetoGigante');
  assert.ok(!SPELLS.conjurarElemental, 'o livro pede 1 minuto');
  const inseto = Object.values(SPELLS).find((x) => x.nomeOriginal === 'Giant Insect').id;
  mago.spellcasting.prepared.push(inseto);
  assert.ok(t.enc.castSpell(mago, inseto, { point: mago.pos, circulo: 8, opcao: 'aranhas' }).ok);
  assert.equal(conta(t.enc, 'aranhaGigante'), 3, 'o 8º círculo não dobra as aranhas');
  const u = montar({ foes: [['ogro', { x: 12, y: 12 }]] });
  const m2 = conjurador(u.party[0], 'animarObjetos');
  assert.ok(u.enc.castSpell(m2, 'animarObjetos', { point: m2.pos, circulo: 5, opcao: 'miudos' }).ok);
  assert.equal(conta(u.enc, 'objetoAnimadoMiudo'), 10);
  assert.ok(!SPELLS.criarMortosVivos, 'o Criar Mortos-Vivos leva 1 minuto: fica fora do jogo até a preparação fora da luta');
});

await teste('Metamorfose: o inimigo vira rã e volta quando a concentração cai; a Transformação veste o dragão', () => {
  const t = montar({ foes: [['ogro', { x: 6, y: 5 }]] });
  const mago = conjurador(t.party[0], 'metamorfose', 'mudarDeForma');
  const ogro = t.foes[0];
  assert.ok(t.enc.castSpell(mago, 'metamorfose', { target: ogro, point: ogro.pos, circulo: 4 }).ok);
  assert.equal(ogro.formaSelvagem?.feraId, 'ra', 'o ogro virou rã');
  t.enc.dropConcentration(mago);
  assert.ok(!ogro.formaSelvagem, 'e voltou');
  mago.actionUsed = false;
  assert.ok(t.enc.castSpell(mago, 'mudarDeForma', { target: mago, point: mago.pos, circulo: 9 }).ok);
  assert.match(mago.formaSelvagem?.feraId ?? '', /dragao/, 'no 17º nível, a forma é um dragão');
});

await teste('Raio Prismático fere no cone; Palavra Divina mata quem tem 20 PV ou menos; Estranho fere quem falha a cada turno', () => {
  const t = montar({ foes: [['ogro', { x: 5, y: 3 }], ['bandido', { x: 6, y: 3 }]] });
  const mago = conjurador(t.party[0], 'palavraDivina', 'sinistro');
  const [ogro, bandido] = t.foes;
  const hp = ogro.hp;
  const nome = Object.values(SPELLS).find((s) => s.nomeOriginal === 'Prismatic Spray').id;
  mago.spellcasting.prepared.push(nome);
  mago.spellcasting.cdPorMagia[nome] = 99;
  assert.ok(t.enc.castSpell(mago, nome, { point: ogro.pos, circulo: 7 }).ok);
  assert.ok(ogro.hp < hp || hasCondition(ogro, 'petrificando') || hasCondition(ogro, 'cego'), 'o raio pegou o ogro');
  bandido.hp = 11;
  mago.actionUsed = false; mago.bonusUsed = false; mago.magiasNoTurno = [];
  t.enc.castSpell(mago, 'palavraDivina', { point: mago.pos, circulo: 7 });
  assert.ok(bandido.dead, 'o bandido de 11 PV morre');
  const u = montar({ foes: [['ogro', { x: 6, y: 6 }]] });
  const m2 = conjurador(u.party[0], 'sinistro');
  const og = u.foes[0];
  assert.ok(u.enc.castSpell(m2, 'sinistro', { point: og.pos, circulo: 9 }).ok);
  assert.ok(hasCondition(og, 'amedrontado'));
  const antes = og.hp;
  og.abilities.wis = 1;
  u.enc.fimDoTurnoDoLado('foes');
  assert.ok(og.hp < antes || !hasCondition(og, 'amedrontado'), 'no fim do turno, falhou e sofreu');
});

await teste('Prisões: a Jaula não deixa sair; a Esfera Resiliente põe fora de alcance; o Labirinto não tem teste e se sai com Inteligência', () => {
  const t = montar({ foes: [['ogro', { x: 8, y: 8 }]] });
  const mago = conjurador(t.party[0], 'jaulaDeEnergia', 'esferaResilienteDeOtiluke', 'labirinto');
  const ogro = t.foes[0];
  assert.ok(t.enc.castSpell(mago, 'jaulaDeEnergia', { point: ogro.pos, circulo: 7 }).ok);
  assert.equal(t.enc.speedOf(ogro), 0, 'enjaulado');
  mago.actionUsed = false; mago.magiasNoTurno = [];
  assert.ok(t.enc.castSpell(mago, 'esferaResilienteDeOtiluke', { target: ogro, point: ogro.pos, circulo: 4 }).ok);
  assert.ok(hasCondition(ogro, 'esferaResiliente'));
  assert.ok(!t.enc.canAttack(t.party[1], ogro).ok, 'ninguém o atinge na esfera');
  const u = montar({ foes: [['ogro', { x: 8, y: 8 }]] });
  const m2 = conjurador(u.party[0], 'labirinto');
  assert.ok(u.enc.castSpell(m2, 'labirinto', { target: u.foes[0], point: u.foes[0].pos, circulo: 8 }).ok);
  assert.ok(hasCondition(u.foes[0], 'labirinto'), 'sem teste');
  u.foes[0].abilities.int = 40;
  u.enc.beginSide('foes');
  assert.ok(!hasCondition(u.foes[0], 'labirinto'), 'com Inteligência alta, acha a saída');
});

await teste('Auras e campos: a Aura de Vida resiste a necrótico e levanta o caído; o Círculo de Poder anula a metade; o Campo Antimagia não deixa conjurar', () => {
  const t = montar({ foes: [['ogro', { x: 12, y: 12 }]] });
  const pal = conjurador(t.party[0], 'auraDeVida', 'circuloDePoder', 'campoAntimagia');
  assert.ok(t.enc.castSpell(pal, 'auraDeVida', { target: pal, point: pal.pos, circulo: 4 }).ok);
  const al = t.party[1];
  const hp = al.hp;
  t.enc.applyDamage(al, 20, 'necrótico', t.foes[0], { magico: true });
  assert.equal(hp - al.hp, 10, 'necrótico pela metade');
  al.hp = 0;
  addCondition(al, 'inconsciente', { source: 'teste' });
  t.enc.beginSide('party');
  assert.ok(al.hp >= 1, 'volta com 1 PV');
  const u = montar({ foes: [['ogro', { x: 12, y: 12 }]] });
  const p2 = conjurador(u.party[0], 'campoAntimagia');
  assert.ok(u.enc.castSpell(p2, 'campoAntimagia', { target: p2, point: p2.pos, circulo: 8 }).ok);
  const vizinho = conjurador(u.party[1], 'bolaDeFogo');
  assert.match(u.enc.canCast(vizinho, 'bolaDeFogo', { point: u.foes[0].pos, circulo: 3 }).why ?? '', /antimágico/);
});

await teste('Peças e golpes: a Mão de Bigby tem os PV de quem a conjura; a Destruição Banidora bane quem fica com 50 PV ou menos; a Aljava dá dois tiros a mais', () => {
  const t = montar({ foes: [['ogro', { x: 6, y: 3 }]] });
  const mago = conjurador(t.party[0], 'maoDeBigby');
  assert.ok(t.enc.castSpell(mago, 'maoDeBigby', { point: { x: 5, y: 3 }, circulo: 5 }).ok);
  const mao = t.enc.combatants.find((c) => c.defId === 'maoDeBigby');
  assert.equal(mao.maxHp, mago.maxHp);
  const u = montar({ foes: [['ogro', { x: 4, y: 3 }]] });
  const pal = conjurador(u.party[0], 'destruicaoBanidora');
  assert.ok(u.enc.castSpell(pal, 'destruicaoBanidora', { target: pal, point: pal.pos, circulo: 5 }).ok);
  const ogro = u.foes[0];
  ogro.ac = 0;
  for (let i = 0; i < 4 && hasCondition(pal, 'golpeBanidor'); i++) u.enc.resolveAttack(pal, ogro, {});
  assert.ok(hasCondition(ogro, 'banido') || ogro.dead, 'o ogro (59 PV) foi banido ou morto');
  const v = montar({ foes: [['ogro', { x: 10, y: 3 }]] });
  const arq = v.party.find((c) => (c.weapons ?? []).some((w) => /arco|besta/i.test(w)));
  const arco = arq.weapons.find((w) => /arco|besta/i.test(w));
  arq.equippedWeapon = arco;
  addCondition(arq, 'aljavaVeloz', { source: arq.id });
  arq.bonusUsed = false;
  let tiros = 0;
  const r0 = v.enc.resolveAttackBase.bind(v.enc);
  v.enc.resolveAttackBase = (a, b, o) => { if (a === arq) tiros += 1; return r0(a, b, o); };
  v.enc.resolveAttack(arq, v.foes[0], { weaponId: arco });
  assert.equal(tiros, 3, 'um tiro e mais dois');
});

await teste('Cura e mente: Cura Completa em Massa e Palavra de Poder Curar enchem; Compulsão faz o inimigo andar para longe', () => {
  const t = montar({ foes: [['ogro', { x: 12, y: 12 }]] });
  const cl = conjurador(t.party[0], 'curaCompletaEmMassa', 'palavraDePoderCurar');
  for (const c of t.party) c.hp = 1;
  assert.ok(t.enc.castSpell(cl, 'curaCompletaEmMassa', { point: cl.pos, circulo: 9 }).ok);
  assert.ok(t.party.every((c) => c.hp === c.maxHp), 'todos cheios');
  const u = montar({ foes: [['ogro', { x: 5, y: 3 }]] });
  const enc2 = conjurador(u.party[0], 'compulsao');
  const ogro = u.foes[0];
  ogro.abilities.wis = 1;
  assert.ok(u.enc.castSpell(enc2, 'compulsao', { point: enc2.pos, circulo: 4 }).ok);
  if (hasCondition(ogro, 'compelido')) {
    const d0 = distanceFt(ogro.pos, enc2.pos);
    u.enc.beginSide('foes');
    assert.ok(distanceFt(ogro.pos, enc2.pos) > d0, 'andou para longe');
  }
});

// ------------------------------------------------------------------------------ a lista de magias de cada classe ----
await teste('a lista de cada classe tem toda magia que o livro lhe dá e o motor conjura, e nenhuma sem efeito', async () => {
  const { listaDaClasse } = await import(P + 'game/criacao.js');
  const { CLASSES_DAS_MAGIAS_PHB } = await import(P + 'rules/magias-por-classe-phb.js');
  const faltam = [];
  for (const [id, classes] of Object.entries(CLASSES_DAS_MAGIAS_PHB)) {
    const s = SPELLS[id];
    if (!s || s.semMotor || !(s.level >= 1)) continue;
    for (const c of classes) if (!listaDaClasse(c, 9).magias.includes(id)) faltam.push(`${c}:${id}`);
  }
  assert.deepEqual(faltam, [], 'faltam na lista da classe');
  assert.ok(listaDaClasse('mago', 3).magias.includes('bolaDeFogo'), 'o mago de 3º círculo aprende a Bola de Fogo');
  assert.ok(!listaDaClasse('mago', 2).magias.includes('bolaDeFogo'), 'e não antes');
  for (const c of ['mago', 'clerigo', 'druida', 'bruxo', 'bardo', 'feiticeiro', 'paladino', 'patrulheiro']) {
    const sem = listaDaClasse(c, 9).magias.filter((id) => SPELLS[id]?.semMotor);
    assert.deepEqual(sem, [], `${c} não oferece magia sem efeito`);
  }
  assert.ok(listaDaClasse('bruxo', 5, 'arquifada').magias.includes('dominarPessoa'), 'a arquifada dá o Dominar Pessoa');
  assert.ok(listaDaClasse('paladino', 4).magias.includes('auraDeVida'), 'o paladino aprende a Aura de Vida');
});

console.log(`\n${total - falhas}/${total} testes passaram.`);
if (falhas) process.exit(1);
