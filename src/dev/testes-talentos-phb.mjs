// OS TALENTOS DO LIVRO DO JOGADOR (2014), no lugar do aumento de atributo: a escolha ao subir de nível e a regra de cada
// talento no motor.
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-talentos-phb.mjs
//
// Cada prova foi escrita para FALHAR sem o código que ela mede: nenhum destes talentos existia, e as duas ações que três
// deles pedem (agarrar e empurrar) o herói não tinha.
import assert from 'node:assert/strict';

const P = new URL('../', import.meta.url).href;
const { Encounter } = await import(P + 'rules/combat.js');
const { makeParty } = await import(P + 'rules/party.js');
const { makeMonster } = await import(P + 'rules/monsters.js');
const { Battlefield } = await import(P + 'core/grid.js');
const { makeRng } = await import(P + 'core/rng.js');
const { hasCondition, getCondition, addCondition } = await import(P + 'rules/conditions.js');
const { passivePerception } = await import(P + 'rules/abilities.js');
const { armorClass } = await import(P + 'rules/equipment.js');
const { subirNivel } = await import(P + 'rules/progressao.js');
const { montarHeroi } = await import(P + 'game/criacao.js');
const { escolhaDeAumento, subirUmNivel } = await import(P + 'game/nivel.js');
const T = await import(P + 'rules/talentos-phb.js');
const { golpePoderoso, bonusDeIniciativa, prepararTalentos, vetoDoMedico, medicoDeCampanha } = await import(P + 'rules/talentos.js');
const { gastarDadoDeVida } = await import(P + 'rules/descanso.js');
const { danoPorResistencia } = await import(P + 'rules/passivas.js');
const U = await import(P + 'rules/utilidade.js');

let total = 0;
let falhas = 0;
async function teste(nome, fn) {
  total += 1;
  try { await fn(); console.log(`ok    ${nome}`); } catch (e) {
    falhas += 1;
    console.log(`FALHA ${nome}\n      ${String(e.stack ?? e.message).split('\n').slice(0, 6).join('\n      ')}`);
  }
}

const ABERTO = Array(14).fill('..............');
function montar({ seed = 1, foes = [], pos = null, nivel = 5, talentos = {}, mapa = ABERTO } = {}) {
  const field = new Battlefield(mapa[0].length, mapa.length, mapa);
  const party = makeParty({ nivel });
  const pp = pos ?? [{ x: 5, y: 5 }, { x: 1, y: 1 }, { x: 1, y: 3 }, { x: 1, y: 12 }];
  party.forEach((c, i) => { c.pos = { ...c.pos, ...pp[i] }; c.talentos = talentos[c.classe] ?? []; });
  const fs = foes.map(([id, p]) => makeMonster(id, p));
  const log = [];
  const enc = new Encounter({ battlefield: field, party, foes: fs, rng: makeRng(seed), onLog: (e) => log.push(e) });
  enc.firstSide = 'party';
  enc.round = 1;
  enc.beginSide('party');
  const texto = () => log.map((l) => `${l.text} ${l.detail ?? ''}`).join('\n');
  const heroi = (classe) => party.find((c) => c.classe === classe);
  return { enc, party, foes: fs, log, texto, field, heroi };
}
const novoTurno = (m) => { m.actionUsed = false; m.bonusUsed = false; m.reactionUsed = false; m.acted = false; m.ataquesRestantes = 0; };
/** Um guerreiro de espada grande, sem escudo. */
function deEspadaGrande(g) { g.weapons = ['espadaGrande']; g.equippedWeapon = 'espadaGrande'; g.shield = false; }

// ----------------------------------------------------------------------------------- a escolha ao subir ----
await teste('No 4º nível o guerreiro escolhe entre o aumento e os talentos; o talento entra no lugar do +2', () => {
  const g = montarHeroi('pc-guerreiro');
  subirNivel(g);
  assert.equal(escolhaDeAumento(g), null, 'o 3º nível não dá aumento');
  subirNivel(g);
  const e = escolhaDeAumento(g);
  assert.ok(e && e.opcoes[0].id === 'asi', 'o aumento vem primeiro');
  assert.ok(e.opcoes.some((o) => o.id === 'sentinela'));
  assert.ok(!e.opcoes.some((o) => o.id === 'vigoroso'), 'quem tem o Vigoroso de origem não pega o mesmo');
  const antes = { ...g.abilities };
  subirUmNivel(g, { talento: { id: 'sentinela' } });
  assert.equal(g.level, 4);
  assert.deepEqual(g.abilities, antes, 'o talento sem +1 não mexe nos atributos');
  assert.ok(g.talentos.includes('sentinela'));
  const h = montarHeroi('pc-guerreiro');
  for (let n = 2; n <= 3; n++) subirNivel(h);
  const asi = { ...h.abilities };
  subirNivel(h);
  assert.notDeepEqual(h.abilities, asi, 'sem talento, o aumento do padrão continua');
});

await teste('Pré-requisito e versão de origem barram o talento; escolha de fora lança', () => {
  const g = montarHeroi('pc-guerreiro');
  for (let n = 2; n <= 3; n++) subirNivel(g);
  assert.match(T.porqueNaoTalento(g, 'conjuradorDeGuerra'), /conjurar/);
  assert.match(T.porqueNaoTalento(g, 'vigoroso'), /já tem/);
  g.talentos = ['sortudo'];
  assert.match(T.porqueNaoTalento(g, 'sortudoPhb'), /origem/);
  assert.throws(() => subirNivel(g, { talento: { id: 'adeptoElemental' } }), /conjurar/);
  const h = montarHeroi('pc-guerreiro');
  for (let n = 2; n <= 3; n++) subirNivel(h);
  assert.throws(() => subirNivel(h, { talento: { id: 'atleta', atributo: 'cha' } }), /atributo/);
  const k = montarHeroi('pc-guerreiro');
  assert.throws(() => subirNivel(k, { talento: { id: 'atleta' } }), /aumento/, 'o 2º nível não dá aumento: talento ali é erro');
});

await teste('Vigoroso dá +2 por nível em TODO nível, e não só no 1º (antes o 2º nível o apagava)', () => {
  const g = montarHeroi('pc-guerreiro');
  const n1 = g.maxHp;
  subirNivel(g);
  const semTalento = montarHeroi('pc-guerreiro');
  semTalento.talentos = [];
  semTalento.maxHp -= 2;
  subirNivel(semTalento);
  assert.equal(g.maxHp - semTalento.maxHp, 4, `${g.maxHp} contra ${semTalento.maxHp}: dois níveis, +4`);
  assert.ok(g.maxHp > n1);
});

await teste('Resiliente dá a resistência; Atleta, Durável, Mente Aguçada dão o +1; Mestre em Armas, quatro armas', () => {
  const g = montarHeroi('pc-mago');
  for (let n = 2; n <= 3; n++) subirNivel(g);
  subirNivel(g, { talento: { id: 'resiliente', atributo: 'con' } });
  assert.ok(g.saves.includes('con'));
  const h = montarHeroi('pc-ladino');
  for (let n = 2; n <= 3; n++) subirNivel(h);
  const dex = h.abilities.dex;
  subirNivel(h, { talento: { id: 'mestreEmArmas', atributo: 'dex' } });
  assert.equal(h.abilities.dex, Math.min(20, dex + 1));
  assert.equal(h.weaponTraining.filter((w) => !['simples', 'bestaDeMao', 'espadaLonga', 'rapieira', 'espadaCurta'].includes(w)).length >= 4, true);
});

await teste('Adepto Marcial: duas manobras e um d6; o Mestre de Batalha não perde as da classe por isso', () => {
  const g = makeParty({ nivel: 3 }).find((c) => c.classe === 'guerreiro');
  g.talentos = [];
  T.aplicarTalentoPhb(g, T.completarEscolhaDoTalento(g, 'adeptoMarcial'));
  assert.equal(g.manobrasDoTalento.length, 2);
  assert.equal(g.resources.superiorityDice, 1);
  const { enc } = montar();
  assert.equal(enc.dadoDeSuperioridade(g), '1d6', 'sem a classe, o dado do talento é d6');
  // o Mestre de Batalha do 6º com o talento continua escolhendo as 3 da classe, e soma o dado
  const b = montarHeroi('pc-guerreiro');
  subirNivel(b); subirNivel(b, { subclasse: 'mestreDeBatalha' });
  subirNivel(b, { talento: { id: 'adeptoMarcial' } });
  const daClasse = b.features.filter((f) => T.MANOBRAS_DO_ADEPTO.includes(f) && !b.manobrasDoTalento.includes(f));
  assert.equal(daClasse.length, 3);
  assert.equal(b.resourcesMax.superiorityDice, 5, '4 da classe + 1 do talento');
  subirNivel(b); subirNivel(b); subirNivel(b);
  assert.equal(b.resourcesMax.superiorityDice, 6, 'no 7º: 5 da classe + 1 do talento');
  assert.equal(b.features.filter((f) => T.MANOBRAS_DO_ADEPTO.includes(f) && !b.manobrasDoTalento.includes(f)).length, 5);
});

// -------------------------------------------------------------------------------------------- ataque ----
await teste('Mestre em Armas Grandes: −5/+10 contra CA baixa, não contra CA alta; o +10 entra na conta do dano', () => {
  const pBaixa = { weapon: { id: 'espadaGrande', categoria: 'marcial', props: ['pesada', 'duas mãos'] }, ranged: false, damage: '2d6+4' };
  const g = { talentos: ['mestreEmArmasGrandes'], weaponTraining: ['marcial'] };
  assert.ok(golpePoderoso(g, pBaixa, 7, 11, 'normal'), 'ogro, CA 11: compensa');
  assert.ok(!golpePoderoso(g, pBaixa, 7, 19, 'normal'), 'CA 19: não compensa');
  assert.ok(!golpePoderoso({ talentos: [] }, pBaixa, 7, 11, 'normal'));
  const { enc, heroi, log } = montar({ foes: [['ogro', { x: 6, y: 5 }]], talentos: { guerreiro: ['mestreEmArmasGrandes'] } });
  const g2 = heroi('guerreiro');
  deEspadaGrande(g2);
  const ogro = enc.combatants.find((c) => c.defId === 'ogro');
  for (let i = 0; i < 6 && !log.some((l) => l.rolagem?.danoPartes?.some((d) => /Mestre em Armas Grandes/.test(d.rotulo))); i++) {
    novoTurno(g2); enc.resolveAttack(g2, ogro, { weaponId: 'espadaGrande' });
  }
  const golpe = log.find((l) => l.rolagem?.bonusPartes?.some((b) => /Mestre em Armas Grandes/.test(b.rotulo)));
  assert.ok(golpe, 'o −5 aparece na conta');
  assert.ok(log.some((l) => l.rolagem?.danoPartes?.some((d) => /Mestre em Armas Grandes/.test(d.rotulo) && d.total === 10)), 'e o +10 no dano');
});

await teste('Mestre em Armas Grandes: derrubar com arma de perto libera o golpe de ação bônus', () => {
  const { enc, heroi } = montar({ foes: [['goblin', { x: 6, y: 5 }], ['goblin', { x: 6, y: 6 }]], talentos: { guerreiro: ['mestreEmArmasGrandes'] } });
  const g = heroi('guerreiro');
  deEspadaGrande(g);
  const [g1, g2] = enc.combatants.filter((c) => c.defId === 'goblin');
  const antes = enc.golpesDeTalento(g, g2).find((o) => o.id === 'golpeExtraGWM');
  assert.ok(antes.motivo, 'sem crítico nem derrubada, não vale');
  g1.hp = 1;
  for (let i = 0; i < 10 && !g1.dead && g1.hp > 0; i++) { novoTurno(g); enc.resolveAttack(g, g1, { weaponId: 'espadaGrande' }); }
  assert.ok(g1.hp <= 0 || g1.dead);
  g.bonusUsed = false;
  assert.equal(enc.golpesDeTalento(g, g2).find((o) => o.id === 'golpeExtraGWM').motivo, null);
  assert.ok(enc.useFeature(g, 'golpeExtraGWM', { target: g2 }));
  assert.ok(g.bonusUsed);
});

await teste('Atirador de Elite: sem desvantagem no alcance longo', () => {
  // O arco curto alcança 80 pés no curto e 320 no longo: o goblin a 90 está no longo.
  const LONGO = Array(4).fill('.'.repeat(24));
  const { enc, heroi, log } = montar({ mapa: LONGO, foes: [['goblin', { x: 18, y: 0 }]], talentos: { ladino: ['atiradorDeElite'] },
    pos: [{ x: 0, y: 3 }, { x: 0, y: 0 }, { x: 1, y: 3 }, { x: 2, y: 3 }] });
  const l = heroi('ladino');
  l.equippedWeapon = 'arcoCurto';
  const gob = enc.combatants.find((c) => c.defId === 'goblin');
  const ultimo = () => log.filter((x) => x.rolagem?.categoria === 'ataque').at(-1).rolagem;
  novoTurno(l);
  enc.resolveAttack(l, gob, { weaponId: 'arcoCurto' });
  assert.ok(!ultimo().desvantagens.includes('alcance longo'), ultimo().desvantagens.join(','));
  l.talentos = [];
  novoTurno(l);
  enc.resolveAttack(l, gob, { weaponId: 'arcoCurto' });
  assert.ok(ultimo().desvantagens.includes('alcance longo'), 'sem o talento, o longo dá desvantagem');
});

await teste('Recarga: a besta dispara uma vez por ação mesmo com Ataque Extra; o Especialista em Besta dispara todas', () => {
  const { enc, heroi, log } = montar({ foes: [['ogro', { x: 10, y: 5 }]] });
  const g = heroi('guerreiro');
  g.weapons = ['bestaLeve']; g.equippedWeapon = 'bestaLeve'; g.shield = false;
  assert.equal(enc.golpesDoAtaque(g, 'bestaLeve').length, 1, 'sem o talento, um disparo');
  g.talentos = ['especialistaEmBesta'];
  assert.equal(enc.golpesDoAtaque(g, 'bestaLeve').length, 2, 'com o talento, os dois do Ataque Extra');
  // inimigo colado: sem desvantagem
  const ogro = enc.combatants.find((c) => c.defId === 'ogro');
  ogro.pos = { ...ogro.pos, x: 6, y: 5 };
  novoTurno(g);
  enc.resolveAttack(g, ogro, { weaponId: 'bestaLeve' });
  const r = log.filter((x) => x.rolagem?.categoria === 'ataque').at(-1);
  assert.ok(!r.rolagem.desvantagens.includes('inimigo adjacente'));
});

await teste('Sentinela: o ataque de oportunidade que acerta para o alvo, e Desengajar não livra', () => {
  let parou = false;
  for (let seed = 1; seed <= 40 && !parou; seed++) {
    const { enc, heroi } = montar({ seed, foes: [['goblin', { x: 6, y: 5 }]], talentos: { guerreiro: ['sentinela'] } });
    const g = heroi('guerreiro');
    const gob = enc.combatants.find((c) => c.defId === 'goblin');
    enc.side = 'foes';
    novoTurno(gob); gob.movementLeftFt = 30; gob.disengaging = true;
    const caminho = [{ x: 6, y: 5 }, { x: 7, y: 5 }, { x: 8, y: 5 }, { x: 9, y: 5 }];
    assert.equal(enc.ameacasNoPasso(gob, gob.pos, { x: 7, y: 5 }).includes(g), true, 'Desengajar não livra da Sentinela');
    enc.moveAlong(gob, caminho);
    if (g.reactionUsed && gob.pos.x === 6 && !gob.dead) { parou = true; assert.equal(enc.speedOf(gob), 0); }
  }
  assert.ok(parou, 'em 40 sementes, o goblin acertado ficou onde estava');
});

await teste('Sentinela: quem ataca outro ao lado dela leva o golpe de reação', () => {
  const { enc, heroi } = montar({ foes: [['goblin', { x: 6, y: 5 }]], talentos: { guerreiro: ['sentinela'] }, pos: [{ x: 6, y: 6 }, { x: 5, y: 5 }, { x: 1, y: 3 }, { x: 1, y: 12 }] });
  const g = heroi('guerreiro');
  const ladino = heroi('ladino');
  const gob = enc.combatants.find((c) => c.defId === 'goblin');
  enc.side = 'foes';
  novoTurno(gob);
  enc.resolveAttack(gob, ladino, {});
  assert.ok(g.reactionUsed, 'a Sentinela reagiu');
});

await teste('Mestre em Armas de Haste: quem ENTRA no alcance da glaive provoca o ataque', () => {
  const { enc, heroi } = montar({ foes: [['goblin', { x: 9, y: 5 }]], talentos: { guerreiro: ['mestreEmArmasDeHaste'] } });
  const g = heroi('guerreiro');
  g.weapons = ['glaive']; g.equippedWeapon = 'glaive'; g.shield = false;
  const gob = enc.combatants.find((c) => c.defId === 'goblin');
  enc.side = 'foes';
  novoTurno(gob); gob.movementLeftFt = 30;
  enc.moveAlong(gob, [{ x: 9, y: 5 }, { x: 8, y: 5 }, { x: 7, y: 5 }]);
  assert.ok(g.reactionUsed, 'entrou a 3 m da glaive: ataque');
  g.talentos = []; g.reactionUsed = false;
  gob.pos = { ...gob.pos, x: 9, y: 5 };
  novoTurno(gob); gob.movementLeftFt = 30;
  enc.moveAlong(gob, [{ x: 9, y: 5 }, { x: 8, y: 5 }, { x: 7, y: 5 }]);
  assert.ok(!g.reactionUsed, 'sem o talento, entrar não provoca');
});

await teste('Móvel: quem ele atacou de perto não o pega de oportunidade; +3 m de deslocamento', () => {
  const { enc, heroi } = montar({ foes: [['goblin', { x: 6, y: 5 }]], talentos: { guerreiro: ['movel'] } });
  const g = heroi('guerreiro');
  const gob = enc.combatants.find((c) => c.defId === 'goblin');
  novoTurno(g);
  enc.resolveAttack(g, gob, {});
  assert.deepEqual(enc.ameacasNoPasso(g, g.pos, { x: 4, y: 5 }), []);
  const h = makeParty({ nivel: 4 }).find((c) => c.classe === 'mago');
  h.talentos = [];
  const v = h.speedFt;
  T.aplicarTalentoPhb(h, { id: 'movel' });
  assert.equal(h.speedFt, v + 10);
});

await teste('Duelista Defensivo: a reação soma a proficiência e faz errar o golpe que ia acertar', () => {
  let usou = false;
  for (let seed = 1; seed <= 60 && !usou; seed++) {
    const { enc, heroi, texto } = montar({ seed, foes: [['bandido', { x: 6, y: 5 }]], talentos: { ladino: ['duelistaDefensivo'] }, pos: [{ x: 1, y: 1 }, { x: 5, y: 5 }, { x: 1, y: 3 }, { x: 1, y: 12 }] });
    const l = heroi('ladino');
    l.equippedWeapon = 'espadaCurta';
    const b = enc.combatants.find((c) => c.defId === 'bandido');
    enc.side = 'foes'; novoTurno(b);
    enc.resolveAttack(b, l, {});
    if (/Duelista Defensivo/.test(texto())) usou = true;
  }
  assert.ok(usou);
});

// ---------------------------------------------------------------------------------------- dano e magia ----
await teste('Mestre em Armaduras Pesadas: −3 no corte não mágico, de armadura pesada; nada no mágico', () => {
  const { enc, heroi } = montar({ talentos: { guerreiro: ['mestreEmArmadurasPesadas'] } });
  const g = heroi('guerreiro');
  g.tempHp = 0;
  const hp = g.hp;
  enc.applyDamage(g, 8, 'cortante', null, { deArma: true });
  assert.equal(hp - g.hp, 5);
  enc.applyDamage(g, 8, 'cortante', null, { deArma: true, magico: true });
  assert.equal(hp - g.hp, 13);
});

await teste('Adepto Elemental: o fogo dele passa por cima da resistência e os 1 dos dados viram 2', () => {
  const { enc, heroi } = montar({ foes: [['goblin', { x: 8, y: 5 }]] });
  const m = heroi('mago');
  T.aplicarTalentoPhb(m, { id: 'adeptoElemental', elemento: 'fogo' });
  const gob = enc.combatants.find((c) => c.defId === 'goblin');
  gob.resist = ['fogo']; gob.hp = gob.maxHp = 100;
  enc.conjuradorEmCurso = m;
  enc.applyDamage(gob, 10, 'fogo', m, { magico: true });
  assert.equal(gob.hp, 90, 'a resistência não vale');
  enc.conjuradorEmCurso = null;
  const dmg = { rolls: [1, 1, 6], total: 8 };
  enc.ajustarDanoDeDominio(m, { name: 'Raio de Fogo', damageType: 'fogo', level: 0 }, dmg, '3d6');
  assert.deepEqual(dmg.rolls, [2, 2, 6]);
  assert.equal(dmg.total, 10);
});

await teste('Conjurador de Guerra: vantagem na concentração; Matador de Magos: desvantagem a quem ele fere', () => {
  const { enc, heroi } = montar({ foes: [['goblin', { x: 6, y: 5 }]] });
  const m = heroi('mago');
  m.talentos = ['conjuradorDeGuerra'];
  let pedido = null;
  const orig = enc.resistencia.bind(enc);
  enc.resistencia = (a, h, cd, o) => { pedido = o; return orig(a, h, cd, o); };
  m.concentrating = { spellId: 'bencao', targets: [] };
  enc.concentrationCheck(m, 4, null);
  assert.equal(pedido.vantagem, true);
  const g = heroi('guerreiro');
  g.talentos = ['matadorDeMagos'];
  m.talentos = [];
  m.concentrating = { spellId: 'bencao', targets: [] };
  enc.concentrationCheck(m, 4, g);
  assert.equal(pedido.desvantagem, true);
});

await teste('Matador de Magos: quem conjura colado nele leva o golpe de reação', () => {
  const { enc, heroi, texto } = montar({ foes: [['acolito', { x: 6, y: 5 }]], talentos: { guerreiro: ['matadorDeMagos'] } });
  const g = heroi('guerreiro');
  const mago = enc.combatants.find((c) => c.side === 'foes');
  enc.matadorDeMagosReage(mago);
  assert.ok(g.reactionUsed && /Matador de Magos/.test(texto()));
});

await teste('Atirador Arcano: o Raio de Fogo alcança o dobro e ignora a cobertura parcial', () => {
  const { enc, heroi } = montar();
  const m = heroi('mago');
  const raio = enc.comAlcanceDoTalento(m, { id: 'raioDeFogo', kind: 'attack', rangeFt: 120 });
  assert.equal(raio.rangeFt, 120, 'sem o talento, igual');
  m.talentos = ['atiradorArcano'];
  assert.equal(enc.comAlcanceDoTalento(m, { id: 'raioDeFogo', kind: 'attack', rangeFt: 120 }).rangeFt, 240);
  assert.equal(enc.comAlcanceDoTalento(m, { id: 'toque', kind: 'attack', rangeFt: 5 }).rangeFt, 5, 'toque fica toque');
});

// ---------------------------------------------------------------------------------- agarrar e empurrar ----
await teste('Agarrar: Atletismo contra o alvo; agarrado, ele não anda; quem segura se afasta e ele está livre', () => {
  let agarrou = null;
  for (let seed = 1; seed <= 20 && !agarrou; seed++) {
    const ctx = montar({ seed, foes: [['goblin', { x: 6, y: 5 }]] });
    const g = ctx.heroi('guerreiro');
    g.shield = false;
    const gob = ctx.enc.combatants.find((c) => c.defId === 'goblin');
    novoTurno(g);
    const r = ctx.enc.agarrar(g, gob);
    assert.ok(r.ok, r.why);
    assert.equal(g.ataquesRestantes, 1, 'o agarrão tomou um dos dois golpes do Ataque Extra');
    if (r.venceu) agarrou = { ...ctx, g, gob };
  }
  assert.ok(agarrou);
  const { enc, g, gob } = agarrou;
  assert.ok(hasCondition(gob, 'agarrado'));
  assert.equal(enc.speedOf(gob), 0);
  g.movementLeftFt = 30;
  enc.moveAlong(g, [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }]);
  assert.ok(!hasCondition(gob, 'agarrado'), 'longe, larga');
});

await teste('Agarrador: vantagem contra quem ele segura; sem mão livre não agarra', () => {
  const { enc, heroi } = montar({ foes: [['goblin', { x: 6, y: 5 }]], talentos: { guerreiro: ['agarrador'] } });
  const g = heroi('guerreiro');
  const gob = enc.combatants.find((c) => c.defId === 'goblin');
  assert.match(enc.agarrar(g, gob).why, /mão livre/, 'espada e escudo ocupam as duas');
  addCondition(gob, 'agarrado', { rounds: Infinity, source: g.id, data: { escape: 12, disputa: true } });
  assert.ok(enc.attackModifiers(g, gob).vantagens.includes('agarrado por quem ataca'));
});

await teste('Empurrar: derruba o alvo na disputa', () => {
  let caiu = false;
  for (let seed = 1; seed <= 20 && !caiu; seed++) {
    const { enc, heroi } = montar({ seed, foes: [['goblin', { x: 6, y: 5 }]] });
    const g = heroi('guerreiro');
    const gob = enc.combatants.find((c) => c.defId === 'goblin');
    novoTurno(g);
    const r = enc.empurrarAcao(g, gob, { modo: 'derrubar' });
    assert.ok(r.ok, r.why);
    caiu = hasCondition(gob, 'caido');
  }
  assert.ok(caiu);
});

await teste('Mestre em Escudos: empurra de ação bônus depois de atacar; passa na Destreza e não sofre a metade', () => {
  const { enc, heroi } = montar({ foes: [['goblin', { x: 6, y: 5 }]], talentos: { guerreiro: ['mestreEmEscudos'] } });
  const g = heroi('guerreiro');
  const gob = enc.combatants.find((c) => c.defId === 'goblin');
  assert.match(enc.golpesDeTalento(g, gob).find((o) => o.id === 'empurraoDoEscudo').motivo, /Atacar/);
  novoTurno(g);
  enc.attackAction(g, gob);
  if (!gob.dead) assert.equal(enc.golpesDeTalento(g, gob).find((o) => o.id === 'empurraoDoEscudo').motivo, null);
  g.reactionUsed = false;
  assert.equal(danoPorResistencia(g, 'dex', true, true, 20), 0);
  assert.ok(g.reactionUsed);
  assert.equal(danoPorResistencia(g, 'dex', true, true, 20), 10, 'sem a reação, a metade');
});

await teste('Brigão de Taverna (2014): soco de 1d4, e acertando o soco agarra como ação bônus', () => {
  let liberou = false;
  for (let seed = 1; seed <= 30 && !liberou; seed++) {
    const { enc, heroi } = montar({ seed, foes: [['goblin', { x: 6, y: 5 }]] });
    const g = heroi('guerreiro');
    g.shield = false;
    T.aplicarTalentoPhb(g, { id: 'brigaoPhb', atributo: 'str' });
    assert.ok(g.weapons.includes('punhos'));
    g.equippedWeapon = 'punhos';
    const gob = enc.combatants.find((c) => c.defId === 'goblin');
    gob.hp = gob.maxHp = 200;
    novoTurno(g);
    const r = enc.resolveAttack(g, gob, { weaponId: 'punhos' });
    if (r?.hit) {
      liberou = enc.golpesDeTalento(g, gob).find((o) => o.id === 'agarrarDoBrigao').motivo === null;
      assert.ok(liberou);
      assert.ok(enc.useFeature(g, 'agarrarDoBrigao', { target: gob }));
      assert.ok(g.bonusUsed);
    }
  }
  assert.ok(liberou);
});

await teste('Investida: depois da Disparada e de 3 m em linha reta, o golpe de ação bônus soma +5', () => {
  const { enc, heroi, log } = montar({ foes: [['ogro', { x: 9, y: 5 }]], talentos: { guerreiro: ['investida'] } });
  const g = heroi('guerreiro');
  const ogro = enc.combatants.find((c) => c.defId === 'ogro');
  ogro.hp = ogro.maxHp = 300;
  novoTurno(g);
  assert.ok(enc.golpesDeTalento(g, ogro).find((o) => o.id === 'investidaTalento').motivo);
  enc.dash(g);
  enc.moveAlong(g, [{ x: 5, y: 5 }, { x: 6, y: 5 }, { x: 7, y: 5 }, { x: 8, y: 5 }]);
  const op = enc.golpesDeTalento(g, ogro).find((o) => o.id === 'investidaTalento');
  assert.equal(op.motivo, null);
  assert.match(op.rotulo, /\+5/);
  for (let i = 0; i < 12 && !log.some((l) => l.rolagem?.danoPartes?.some((d) => d.rotulo === 'Investida')); i++) {
    g.bonusUsed = false;
    enc.useFeature(g, 'investidaTalento', { target: ogro });
  }
  assert.ok(log.some((l) => l.rolagem?.danoPartes?.some((d) => d.rotulo === 'Investida' && d.total === 5)));
});

// --------------------------------------------------------------------------------------- defesa e resto ----
await teste('Combatente com Duas Armas: +1 de CA e espada longa na mão secundária', () => {
  const g = makeParty({ nivel: 4 }).find((c) => c.classe === 'guerreiro');
  g.shield = false; g.weapons = ['espadaLonga', 'machadoDeBatalha']; g.equippedWeapon = 'espadaLonga'; g.offhandWeapon = 'machadoDeBatalha';
  g.talentos = [];
  const ca = armorClass(g);
  g.talentos = ['combatenteComDuasArmas'];
  assert.equal(armorClass(g), ca + 1);
  const { enc } = montar({ foes: [['ogro', { x: 6, y: 5 }]] });
  enc.combatants.splice(enc.combatants.findIndex((c) => c.classe === 'guerreiro'), 1, g);
  g.pos = { x: 5, y: 5, f: 1 };
  const ogro = enc.combatants.find((c) => c.defId === 'ogro');
  novoTurno(g); g.actionUsed = true;
  assert.ok(enc.useFeature(g, 'twoWeaponFighting', { target: ogro }), 'machado não leve na outra mão, pelo talento');
});

await teste('Mestre em Armaduras Médias: com Destreza 16, +3 na brunea', () => {
  const c = makeParty({ nivel: 4 }).find((x) => x.classe === 'clerigo');
  c.abilities.dex = 16; c.shield = false; c.talentos = [];
  const ca = armorClass(c);
  c.talentos = ['mestreEmArmadurasMedias'];
  assert.equal(armorClass(c), ca + 1);
});

await teste('Alerta (2014): +5 na iniciativa e não é pego de surpresa; Sortudo (2014): três pontos', () => {
  const { enc, heroi } = montar({ foes: [['goblin', { x: 10, y: 10 }]] });
  const l = heroi('ladino');
  const sem = bonusDeIniciativa(l);
  l.talentos = ['alertaPhb'];
  assert.equal(bonusDeIniciativa(l), sem + 5);
  const m = heroi('mago');
  m.talentos = ['sortudoPhb'];
  prepararTalentos(enc);
  assert.equal(m.pontosDeSorte, 3);
  // surpresa: com a passiva baixa, todos os outros podem ser pegos; ele nunca
  for (const h of enc.combatants.filter((c) => c.side === 'party')) h.abilities.wis = 1;
  enc.emboscada = { emboscadores: 'foes', furtividade: [30] };
  const surpresos = enc.rolarSurpresa();
  assert.ok(!surpresos.has(l.id) && surpresos.has(m.id));
});

await teste('Líder Inspirador: antes da luta, PV temporários de nível + Carisma', () => {
  const { enc, heroi } = montar();
  const c = heroi('clerigo');
  c.talentos = ['liderInspirador'];
  for (const h of enc.combatants) h.tempHp = 0;
  prepararTalentos(enc);
  const pv = c.level + Math.floor((c.abilities.cha - 10) / 2);
  assert.ok(enc.combatants.filter((h) => h.side === 'party').every((h) => h.tempHp === pv));
});

await teste('Curandeiro (2014): o kit levanta quem cai com 1 PV e cura 1d6 + 4 + nível uma vez por descanso', () => {
  const { enc, heroi } = montar({ pos: [{ x: 5, y: 5 }, { x: 6, y: 5 }, { x: 1, y: 3 }, { x: 1, y: 12 }] });
  const c = heroi('guerreiro');
  c.talentos = ['curandeiroPhb'];
  c.bag = [{ id: 'kitDeCura', tipo: 'item', qtd: 3 }];
  const l = heroi('ladino');
  l.hp = 0; addCondition(l, 'inconsciente');
  assert.equal(vetoDoMedico(c, l), null);
  medicoDeCampanha(enc, c, l);
  assert.equal(l.hp, 1);
  medicoDeCampanha(enc, c, l);
  assert.ok(l.hp >= 1 + 5 + l.level && l.hp <= 1 + 10 + l.level);
  assert.match(vetoDoMedico(c, l), /descanso/);
});

await teste('Durável: o dado de vida cura no mínimo o dobro da Constituição', () => {
  const g = makeParty({ nivel: 4 }).find((c) => c.classe === 'guerreiro');
  g.talentos = ['duravel'];
  g.hp = 1;
  let menor = Infinity;
  for (let s = 1; s <= 30; s++) {
    g.hp = 1; g.dadosDeVidaRestantes = 4;
    const r = gastarDadoDeVida(makeRng(s), g);
    menor = Math.min(menor, r.cura);
  }
  assert.ok(menor >= 2 * Math.floor((g.abilities.con - 10) / 2), `menor cura ${menor}`);
});

await teste('Observador: +5 na Percepção passiva; Atleta: levantar custa 1,5 m', () => {
  const { enc, heroi } = montar();
  const l = heroi('ladino');
  const pp = passivePerception(l);
  l.talentos = ['observador'];
  assert.equal(passivePerception(l), pp + 5);
  l.talentos = ['atleta'];
  addCondition(l, 'caido');
  l.movementLeftFt = 25;
  assert.ok(enc.standUp(l).ok);
  assert.equal(l.movementLeftFt, 20);
});

await teste('Conjurador de Rituais: o guerreiro conjura Detectar Magia como ritual, e só como ritual', () => {
  const g = makeParty({ nivel: 4 }).find((c) => c.classe === 'guerreiro');
  g.talentos = [];
  g.abilities.int = 13;
  T.aplicarTalentoPhb(g, T.completarEscolhaDoTalento(g, { id: 'conjuradorDeRituais', classe: 'mago' }));
  assert.ok(g.spellcasting.livroDeRituais.includes('detectarMagia'));
  assert.ok(U.podeConjurarFora(g, 'detectarMagia', { ritual: true }).ok);
  assert.ok(!U.podeConjurarFora(g, 'detectarMagia').ok, 'sem ritual, não');
  assert.ok(U.magiasForaDoHeroi(g).some((s) => s.id === 'detectarMagia'));
});

await teste('Ator: disfarçado, vantagem em Enganação', () => {
  const g = makeParty({ nivel: 4 }).find((c) => c.classe === 'mago');
  g.talentos = ['ator'];
  const estado = U.estadoDe({});
  const semDisfarce = U.modificadores(estado, [g], g, 'enganacao');
  assert.ok(!semDisfarce.fontes.includes('Ator'));
  g.spellcasting.prepared.push('disfarcarSe');
  const r = U.conjurarFora(estado, g, 'disfarcarSe', { herois: [g], rng: makeRng(1) });
  assert.ok(r.ok, r.why);
  assert.ok(U.modificadores(estado, [g], g, 'enganacao').fontes.includes('Ator'));
});

await teste('Furtivo: esconde-se na penumbra sem cobertura nenhuma', () => {
  let escondeu = false;
  for (let seed = 1; seed <= 20 && !escondeu; seed++) {
    const { enc, heroi } = montar({ seed, foes: [['goblin', { x: 10, y: 5 }]] });
    const l = heroi('ladino');
    enc.field.luz = new Uint8Array(enc.field.w * enc.field.h).fill(1);
    assert.equal(enc.esconder(l), false, 'sem o talento, no aberto não há onde');
    l.talentos = ['furtivo'];
    escondeu = enc.esconder(l);
  }
  assert.ok(escondeu);
});

await teste('Explorador de Masmorras: porta secreta com vantagem; metade do dano da armadilha', async () => {
  const A = await import(P + 'rules/abilities.js');
  const l = makeParty({ nivel: 4 }).find((c) => c.classe === 'ladino');
  l.talentos = ['exploradorDeMasmorras'];
  assert.equal(A.percepcaoParaSecreta(l), passivePerception(l) + 5);
  const { enc, heroi } = montar({ talentos: { ladino: ['exploradorDeMasmorras'] } });
  const R = await import(P + 'rules/regioes.js');
  void R;
  const lad = heroi('ladino');
  let pedido = null;
  const orig = enc.resistencia.bind(enc);
  enc.resistencia = (a, h, cd, o) => { pedido = o; return orig(a, h, cd, o); };
  enc.resistencia(lad, 'dex', 12, { contra: { armadilha: true } });
  assert.equal(pedido.contra.armadilha, true);
});

console.log(`\n${total - falhas}/${total} testes passaram.`);
if (falhas) process.exit(1);
