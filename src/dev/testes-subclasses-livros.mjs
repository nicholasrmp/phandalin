// AS SUBCLASSES DOS OUTROS LIVROS no motor, sobre o Encounter de verdade: a Costa da Espada (Furioso de Batalha, Domínio
// Arcano, Cavaleiro do Dragão Púrpura, Longa Morte, Coroa, Imortal), o Livro do Mestre (Domínio da Morte, Quebrador de
// Juramento), o Fizban (Dragão Ascendente, Guardião Dracônico) e o Bigby (Caminho do Gigante).
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-subclasses-livros.mjs
//
// Cada prova foi escrita para FALHAR sem o código dela: nenhuma destas subclasses existia.
import assert from 'node:assert/strict';

const P = new URL('../', import.meta.url).href;
const { Encounter } = await import(P + 'rules/combat.js');
const { criarPersonagem } = await import(P + 'rules/progressao.js');
const { makeMonster } = await import(P + 'rules/monsters.js');
const { Battlefield } = await import(P + 'core/grid.js');
const { makeRng } = await import(P + 'core/rng.js');
const { hasCondition, getCondition, removeCondition, addCondition } = await import(P + 'rules/conditions.js');
const { CLASSES, CARACTERISTICAS } = await import(P + 'rules/classes/index.js');
const { estadoDaCaracteristica } = await import(P + 'rules/classes/caracteristicas.js');
const { SUBCLASSES_TCE } = await import(P + 'rules/classes/subclasses-tce.js');
const { SUBCLASSES_1, listaDaClasse } = await import(P + 'game/criacao.js');
const { visaoNoEscuro } = await import(P + 'rules/luz.js');
const Sub = await import(P + 'rules/subclasses-livros.js');
const { usoLivreDe } = await import(P + 'rules/passivas.js');
const { SPELLS } = await import(P + 'rules/spells.js');
const { caEfetiva, conditionEffects } = await import(P + 'rules/conditions.js');
const { skillBonus, abilityMod } = await import(P + 'rules/abilities.js');
const { descansoLongo } = await import(P + 'rules/descanso.js');

let total = 0;
let falhas = 0;
async function teste(nome, fn) {
  total += 1;
  try { await fn(); console.log(`ok    ${nome}`); } catch (e) {
    falhas += 1;
    console.log(`FALHA ${nome}\n      ${String(e.stack ?? e.message).split('\n').slice(0, 6).join('\n      ')}`);
  }
}

const ATRIBUTOS = {
  barbaro: { str: 16, dex: 14, con: 16, int: 8, wis: 12, cha: 10 },
  bardo: { str: 10, dex: 16, con: 14, int: 10, wis: 10, cha: 16 },
  clerigo: { str: 14, dex: 10, con: 14, int: 10, wis: 16, cha: 10 },
  guerreiro: { str: 16, dex: 14, con: 15, int: 10, wis: 12, cha: 10 },
  mago: { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10 },
  druida: { str: 10, dex: 14, con: 14, int: 10, wis: 16, cha: 10 },
  monge: { str: 10, dex: 16, con: 14, int: 10, wis: 16, cha: 10 },
  paladino: { str: 16, dex: 10, con: 14, int: 8, wis: 10, cha: 16 },
  patrulheiro: { str: 12, dex: 16, con: 14, int: 10, wis: 14, cha: 10 },
  ladino: { str: 10, dex: 16, con: 14, int: 12, wis: 12, cha: 10 },
  feiticeiro: { str: 8, dex: 14, con: 14, int: 10, wis: 12, cha: 16 },
  bruxo: { str: 10, dex: 14, con: 14, int: 10, wis: 12, cha: 16 },
};
const ARMADURA = { barbaro: 'nenhuma', bardo: 'couroBatido', clerigo: 'cotaDeMalha', guerreiro: 'cotaDeMalha', mago: 'nenhuma', druida: 'couroBatido', monge: 'nenhuma', paladino: 'cotaDeMalha', patrulheiro: 'couroBatido', ladino: 'couroBatido', feiticeiro: 'nenhuma', bruxo: 'couroBatido' };
const ARMA = { barbaro: 'espadaLonga', bardo: 'rapieira', clerigo: 'maca', guerreiro: 'espadaLonga', mago: 'bordao', druida: 'bordao', monge: 'bordao', paladino: 'espadaLonga', patrulheiro: 'espadaCurta', ladino: 'rapieira', feiticeiro: 'adaga', bruxo: 'adaga' };

function heroi(classe, nivel, sub = null, esc = {}) {
  const nv = CLASSES[classe].subclasse.nivel;
  const c = criarPersonagem({
    id: `h-${classe}-${sub ?? 'x'}-${Math.random()}`, name: `${classe}-${sub ?? 'x'}`, ancestry: 'Humano', look: 'fighter',
    abilities: { ...ATRIBUTOS[classe] }, skills: [], armor: ARMADURA[classe], shield: false, speedFt: 30, weapons: [ARMA[classe]],
  }, { classe, nivel, escolhas: sub ? { [nv]: { subclasse: sub, ...esc } } : {} });
  c.equippedWeapon = c.weapons[0];
  return c;
}
/** O herói em (5,5), a guerreira aliada em (5,6), e os inimigos pedidos (o ogro colado nos dois, por padrão). */
function montar(h, { foes = [['ogro', { x: 6, y: 5 }]], seed = 3, outros = [] } = {}) {
  const field = new Battlefield(20, 20, Array(20).fill('.'.repeat(20)));
  const aliada = heroi('guerreiro', Math.max(1, h.level));
  aliada.name = 'Dara';
  h.pos = { x: 5, y: 5, f: 1 };
  aliada.pos = { x: 5, y: 6, f: 1 };
  outros.forEach((o, i) => { o.pos = { x: 4, y: 6 + i, f: 1 }; });
  const fs = foes.map(([id, p]) => makeMonster(id, p));
  const log = [];
  const enc = new Encounter({ battlefield: field, party: [h, aliada, ...outros], foes: fs, rng: makeRng(seed), onLog: (e) => log.push(e) });
  enc.firstSide = 'party'; enc.round = 1; enc.beginSide('party');
  const texto = () => log.map((l) => `${l.text} ${l.detail ?? ''}`).join('\n');
  return { enc, h, aliada, foes: fs, log, texto };
}
function d20s(enc, valores) {
  const orig = enc.rng.die;
  const fila = [...valores];
  enc.rng.die = (lados) => (lados === 20 && fila.length ? fila.shift() : orig(lados));
}
function dados(enc, lados, valores) {
  const orig = enc.rng.die;
  const fila = [...valores];
  enc.rng.die = (l) => (l === lados && fila.length ? fila.shift() : orig(l));
}
const novoTurno = (c) => { c.actionUsed = false; c.bonusUsed = false; c.reactionUsed = false; c.magiasNoTurno = []; c.atacouNoTurno = false; };
const golpesDe = (texto, nome) => (texto().match(new RegExp(`${nome} (acerta|erra) [A-ZÁÉÍÓÚ]`, 'g')) ?? []).length;
const inspirar = (bardo, alvo) => addCondition(alvo, 'inspirado', { rounds: 100, source: bardo.id, data: { dado: '1d6' } });

const { SUBCLASSES_SCAG } = await import(P + 'rules/classes/subclasses-scag.js');
const { SUBCLASSES_DMG } = await import(P + 'rules/classes/subclasses-dmg.js');
const { SUBCLASSES_FTD } = await import(P + 'rules/classes/subclasses-ftd.js');
const { SUBCLASSES_BGG } = await import(P + 'rules/classes/subclasses-bgg.js');

await teste('as subclasses da Costa da Espada, do Mestre, do Fizban e do Bigby entram, com nome em pt-br, e todo recurso tem texto e estado', () => {
  let n = 0;
  for (const livro of [SUBCLASSES_SCAG, SUBCLASSES_DMG, SUBCLASSES_FTD, SUBCLASSES_BGG]) {
    for (const [cl, subs] of Object.entries(livro)) {
      for (const s of Object.keys(subs)) {
        n += 1;
        const def = CLASSES[cl].subclasse.opcoes[s];
        assert.ok(def?.nome && !/ of /.test(def.nome), `${cl}.${s}: ${def?.nome}`);
        for (const f of Object.values(def.niveis).flat()) {
          assert.ok(CARACTERISTICAS[f]?.desc, `${cl}.${s}: ${f} sem texto`);
          assert.notEqual(estadoDaCaracteristica(f), 'pendente', `${cl}.${s}: ${f} pendente`);
        }
      }
    }
  }
  assert.equal(n, 11);
  for (const d of ['dominioArcano', 'dominioDaMorte']) assert.ok(SUBCLASSES_1.clerigo.opcoes.some((o) => o.motor === d), d);
  assert.ok(SUBCLASSES_1.bruxo.opcoes.some((o) => o.motor === 'imortal'));
});

// ------------------------------------------------------------------ Costa da Espada

await teste('Furioso de Batalha: os espinhos na ação bônus, no agarrão e em quem o acerta; o Abandono Descuidado; a Investida', () => {
  const { enc, h, foes: [ogro], texto } = montar(heroi('barbaro', 14, 'furiaDeBatalha'));
  ogro.hp = ogro.maxHp = 300;
  h.armor = 'armaduraDeEspinhos';
  assert.ok(!enc.canAttack(h, ogro, 'espinhosDaArmadura').ok, 'sem Fúria, não');
  assert.ok(enc.useFeature(h, 'rage'));
  enc.useFeature(h, 'recklessAttack', { modo: 'ligar' });
  d20s(enc, [19, 19]);
  enc.resolveAttack(h, ogro);
  assert.ok(h.tempHp >= 1, 'o abandono');
  h.bonusUsed = false;
  d20s(enc, [19]);
  assert.ok(enc.useFeature(h, 'battleragerArmor', { target: ogro }));
  assert.match(texto(), /com Espinhos da armadura/);
  novoTurno(h);
  const andar = h.movementLeftFt;
  assert.ok(enc.useFeature(h, 'battleragerCharge'));
  assert.ok(h.movementLeftFt > andar);
  const hp = ogro.hp;
  d20s(enc, [19, 2]);
  enc.agarrar(h, ogro);
  if (hasCondition(ogro, 'agarrado')) assert.ok(ogro.hp <= hp - 3, 'os espinhos no agarrão');
  const hp2 = ogro.hp;
  d20s(enc, [19]);
  enc.resolveAttack(ogro, h);
  assert.ok(ogro.hp <= hp2 - 3, 'a retribuição');
  assert.match(texto(), /Retribuição Espinhosa/);
});

await teste('Domínio Arcano: dois truques de mago e o Arcanismo; a Abjuração Arcana expulsa (e bane o fraco); o Quebra-Feitiços', () => {
  const { enc, h, aliada, foes: [ogro, gob], texto } = montar(heroi('clerigo', 6, 'dominioArcano'), { foes: [['ogro', { x: 6, y: 5 }], ['goblin', { x: 8, y: 5 }]] });
  assert.ok(h.skills.includes('arcanismo'));
  assert.equal(h.truquesArcanos.length, 2);
  assert.ok(h.truquesArcanos.every((id) => h.magiasDeCaracteristica.includes(id)));
  ogro.tipo = 'corruptor';
  gob.tipo = 'feérico';
  d20s(enc, [1]);
  assert.ok(enc.useFeature(h, 'arcaneAbjuration', { target: ogro }));
  assert.ok(getCondition(ogro, 'amedrontado')?.data?.expulso, 'o ogro (ND 2) é expulso');
  h.resources.channelDivinity = 1;
  novoTurno(h);
  d20s(enc, [1]);
  assert.ok(enc.useFeature(h, 'arcaneAbjuration', { target: gob }));
  assert.ok(hasCondition(gob, 'banido'), 'o goblin (ND 1/4) é banido');
  novoTurno(h);
  aliada.hp -= 5;
  addCondition(aliada, 'lento', { rounds: 10, source: ogro.id, magia: { id: 'raioDeGelo', circulo: 1 } });
  h.spellcasting.prepared = [...new Set([...(h.spellcasting.prepared ?? []), 'curarFerimentos'])];
  assert.ok(enc.castSpell(h, 'curarFerimentos', { target: aliada }).ok);
  assert.ok(!hasCondition(aliada, 'lento'), 'o quebra-feitiços');
});

await teste('Cavaleiro do Dragão Púrpura: o Grito de Reunião, o Surto Inspirador, a Persuasão dobrada e o Baluarte', () => {
  const { enc, h, aliada, foes: [ogro], texto } = montar(heroi('guerreiro', 15, 'cavaleiroDragaoPurpura'));
  ogro.hp = ogro.maxHp = 300;
  assert.ok(h.expertise?.includes('persuasao'));
  aliada.hp -= 20;
  const hpA = aliada.hp;
  h.hp -= 10;
  assert.ok(enc.useFeature(h, 'secondWind'));
  assert.equal(aliada.hp, hpA + 15);
  d20s(enc, [19]);
  assert.ok(enc.useFeature(h, 'actionSurge'));
  assert.match(texto(), /Surto Inspirador/);
  assert.ok(aliada.reactionUsed);
  aliada.reactionUsed = false;
  const indom = h.resources.indomitable;
  d20s(enc, [1, 1, 1, 20]);
  enc.resistencia(h, 'wis', 30, { contra: { conjurador: ogro } });
  assert.equal(h.resources.indomitable, indom - 1);
  enc.resistencia(aliada, 'wis', 30, { contra: { conjurador: ogro } });
  assert.match(texto(), /\(Baluarte\)/);
});

await teste('Caminho da Longa Morte: o Toque da Morte, a Hora da Colheita, a Maestria da Morte e o Toque da Longa Morte', () => {
  const { enc, h, foes: [ogro, gob] } = montar(heroi('monge', 17, 'longaMorte'), { foes: [['ogro', { x: 7, y: 5 }], ['goblin', { x: 6, y: 5 }]] });
  ogro.hp = ogro.maxHp = 300;
  gob.hp = 1;
  d20s(enc, [19]);
  enc.resolveAttack(h, gob);
  assert.ok(gob.dead && h.tempHp >= 1, 'o toque da morte');
  d20s(enc, [1]);
  assert.ok(enc.useFeature(h, 'hourOfReaping'));
  assert.ok(hasCondition(ogro, 'amedrontado') || enc.combatants.some((c) => hasCondition(c, 'amedrontado')));
  novoTurno(h);
  const ki = h.resources.ki;
  ogro.pos = { ...ogro.pos, x: 6 };
  d20s(enc, [1]);
  assert.ok(enc.useFeature(h, 'touchOfTheLongDeath', { target: ogro, modo: 3 }));
  assert.equal(h.resources.ki, ki - 3);
  assert.ok(ogro.hp < 300);
  h.tempHp = 0;
  enc.applyDamage(h, h.hp + 5, 'cortante', ogro);
  assert.equal(h.hp, 1, 'a maestria da morte');
});

await teste('Juramento da Coroa: o Desafio do Campeão prende; Virar a Maré; a Lealdade Divina; o Espírito Indomável; o Campeão Exaltado', () => {
  const { enc, h, aliada, foes: [ogro] } = montar(heroi('paladino', 20, 'juramentoDaCoroa'));
  d20s(enc, [1]);
  assert.ok(enc.useFeature(h, 'championChallenge'));
  assert.equal(enc.duelistaDe(ogro), h);
  novoTurno(h);
  aliada.hp = Math.floor(aliada.maxHp / 2) - 1;
  const hpA = aliada.hp;
  h.resources.channelDivinity = 1;
  assert.ok(enc.useFeature(h, 'turnTheTide'));
  assert.ok(aliada.hp > hpA);
  const hpH = h.hp;
  enc.applyDamage(aliada, aliada.hp + 3, 'cortante', ogro);
  assert.ok(aliada.hp > 0 && h.hp < hpH, 'o paladino toma o golpe');
  assert.equal(enc.resistencia(h, 'con', 30, { contra: { condicao: 'atordoado' } }).mode, 'vantagem');
  novoTurno(h);
  assert.ok(enc.useFeature(h, 'exaltedChampion'));
  assert.equal(enc.resistencia(aliada, 'wis', 30).mode, 'vantagem');
});

await teste('O Imortal: o morto-vivo desiste do golpe; Poupar os Moribundos; Desafiar a Morte; a Vida Indestrutível', () => {
  const { enc, h, foes: [zumbi], texto } = montar(heroi('bruxo', 14, 'imortal'), { foes: [['zumbi', { x: 6, y: 5 }]] });
  assert.ok(h.magiasDeCaracteristica.includes('pouparOsMoribundos'));
  zumbi.pos = { x: 6, y: 4, f: 1 };
  d20s(enc, [1]);
  enc.resolveAttack(zumbi, h);
  assert.match(texto(), /Entre os Mortos/);
  h.hp = 10;
  assert.ok(enc.useFeature(h, 'indestructibleLife'));
  assert.ok(h.hp > 10);
  h.hp = 0;
  addCondition(h, 'inconsciente');
  h.deathSaves = { successes: 0, failures: 0 };
  d20s(enc, [15]);
  enc.deathSave(h);
  assert.match(texto(), /Desafiar a Morte/);
});

// ------------------------------------------------------------------ Livro do Mestre

await teste('Destruir Mortos-Vivos (clérigo, 5º) lê o ND do bloco: o zumbi (ND 1/4) vira pó', () => {
  const { enc, h, foes: [zumbi] } = montar(heroi('clerigo', 5), { foes: [['zumbi', { x: 7, y: 5 }]] });
  d20s(enc, [1]);
  assert.ok(enc.useFeature(h, 'turnUndead'));
  assert.ok(zumbi.dead, 'o zumbi vira pó');
});

await teste('Domínio da Morte: o Ceifador pega dois; o Toque da Morte; a Destruição Inescapável; o Ceifador Aprimorado', () => {
  const { enc, h, foes: [g1, g2], texto } = montar(heroi('clerigo', 17, 'dominioDaMorte'), { foes: [['goblin', { x: 8, y: 5 }], ['goblin', { x: 9, y: 5 }]] });
  g1.hp = g1.maxHp = 200; g2.hp = g2.maxHp = 200;
  g1.resist = ['necrótico'];
  assert.ok(h.magiasDeCaracteristica.includes(h.truqueDoCeifador));
  h.truqueDoCeifador = 'toqueArrepiante';
  if (!h.magiasDeCaracteristica.includes('toqueArrepiante')) h.magiasDeCaracteristica.push('toqueArrepiante');
  d20s(enc, [19, 19]);
  assert.ok(enc.castSpell(h, 'toqueArrepiante', { target: g1 }).ok);
  assert.ok(g2.hp < 200, 'o segundo alvo');
  assert.match(texto(), /Ceifador/);
  novoTurno(h);
  enc.useFeature(h, 'touchOfDeathCleric', { modo: 'ligar' });
  g1.pos = { ...g1.pos, x: 6 };
  const cd = h.resources.channelDivinity;
  const antes = g1.hp;
  d20s(enc, [19]);
  enc.resolveAttack(h, g1);
  assert.equal(h.resources.channelDivinity, cd - 1);
  assert.ok(antes - g1.hp >= 5 + 34, 'o toque da morte, sem resistência');
  novoTurno(h);
  const espacos = h.spellcasting.slots.reduce((a, b) => a + b, 0);
  g2.pos = { ...g2.pos, x: 7 };
  d20s(enc, [19, 19]);
  const hp2 = g2.hp;
  assert.ok(enc.castSpell(h, 'raioDeDoenca', { target: g1 }).ok);
  assert.ok(g2.hp < hp2, 'o aprimorado pega o segundo');
  assert.equal(h.spellcasting.slots.reduce((a, b) => a + b, 0), espacos - 1, 'um espaço só');
});

await teste('Quebrador de Juramento: Controlar Mortos-Vivos; o Aspecto Terrível; a Aura de Ódio; a Resistência Sobrenatural; o Senhor do Terror', () => {
  const { enc, h, foes: [zumbi, ogro], texto } = montar(heroi('paladino', 20, 'quebraJuramento'), { foes: [['zumbi', { x: 8, y: 5 }], ['ogro', { x: 6, y: 5 }]] });
  ogro.hp = ogro.maxHp = 300;
  d20s(enc, [1]);
  assert.ok(enc.useFeature(h, 'controlUndead', { target: zumbi }));
  assert.equal(zumbi.side, h.side);
  novoTurno(h);
  h.resources.channelDivinity = 1;
  d20s(enc, [1]);
  assert.ok(enc.useFeature(h, 'dreadfulAspect'));
  assert.equal(getCondition(ogro, 'amedrontado')?.data?.repete, 'longe');
  d20s(enc, [19]);
  enc.resolveAttack(h, ogro);
  assert.match(texto(), /Aura de Ódio: \+\d+/);
  const hp = h.hp;
  enc.applyDamage(h, 20, 'cortante', ogro);
  assert.equal(hp - h.hp, 10, 'resistência ao golpe não mágico');
  novoTurno(h);
  assert.ok(enc.useFeature(h, 'dreadLord'));
  assert.equal(enc.attackModifiers(ogro, h).mode, 'desvantagem');
  const hpO = ogro.hp;
  d20s(enc, [19]);
  assert.ok(enc.useFeature(h, 'sombrasDoSenhor', { target: ogro }));
  assert.ok(ogro.hp < hpO);
  enc.fimDoTurnoDoLado('party'); enc.beginSide('foes');
  assert.match(texto(), /Senhor do Terror\)/);
});

// ------------------------------------------------------------------ Fizban

await teste('Dragão Ascendente: o sopro troca um golpe; o tipo do dragão; as asas; o Aspecto da Serpe e a fúria; a forma maior', () => {
  const { enc, h, foes: [ogro], texto } = montar(heroi('monge', 17, 'dragaoAscendente'), { foes: [['ogro', { x: 7, y: 5 }]] });
  ogro.hp = ogro.maxHp = 300;
  assert.equal(h.senses?.blindsightFt, 10);
  assert.ok(enc.useFeature(h, 'draconicDisciple', { modo: 'frio' }));
  const usos = h.resources.breathOfTheDragon;
  d20s(enc, [1]);
  assert.ok(enc.castSpell(h, 'soproDoMongeLinha', { point: ogro.pos }).ok);
  assert.equal(h.resources.breathOfTheDragon, usos - 1);
  assert.ok(ogro.hp < 300);
  assert.ok(enc.useFeature(h, 'golpeDoTruque', { target: ogro }) || ogro.pos.x > 6, 'o golpe que sobra');
  novoTurno(h);
  const ki = h.resources.ki;
  assert.ok(enc.castSpell(h, 'soproDoMongeConeMaior', { point: ogro.pos }).ok);
  assert.equal(h.resources.ki, ki - 1, 'a forma maior custa 1 ki a mais');
  novoTurno(h);
  assert.ok(enc.useFeature(h, 'stepOfTheWind', { modo: 'disparada' }));
  assert.ok(conditionEffects(h).vooFt > 0, 'as asas');
  novoTurno(h);
  ogro.pos = { ...ogro.pos, x: 6 };
  d20s(enc, [1, 1]);
  assert.ok(enc.useFeature(h, 'aspectOfTheWyrm', { modo: 'medo' }));
  assert.match(texto(), /Aspecto Ascendente/);
  assert.ok(hasCondition(ogro, 'amedrontado'));
});

await teste('Guardião Dracônico: o draco do livro (CA, PV, mordida), a ordem pela ação bônus, os golpes infundidos, o sopro e o elo', () => {
  const { enc, h, aliada, foes: [ogro], texto } = montar(heroi('patrulheiro', 15, 'guardiaoDoDraco'), { foes: [['ogro', { x: 7, y: 5 }]] });
  ogro.hp = ogro.maxHp = 300;
  assert.ok(enc.useFeature(h, 'essenciaDoDraco', { modo: 'frio' }));
  assert.ok(enc.useFeature(h, 'drakeCompanion'));
  const d = enc.invocadosDe(h).find((x) => x.invocado.spellId === 'dracoCompanheiro');
  assert.ok(d);
  assert.equal(d.ac, 14 + 5);
  assert.equal(d.maxHp, 5 + 5 * 15);
  assert.equal(d.attacks[0].bonus, 8);
  assert.equal(d.attacks[0].danoExtra?.damage, '2d6');
  assert.ok(d.immune.includes('frio'));
  assert.ok(enc.useFeature(h, 'comandarDraco'));
  assert.ok(!d.actionUsed);
  aliada.pos = { x: 6, y: 6, f: 1 };
  d20s(enc, [19]);
  enc.resolveAttack(aliada, ogro);
  assert.match(texto(), /Golpes Infundidos/, texto());
  const hp = h.hp;
  enc.applyDamage(h, 10, 'frio', ogro);
  assert.equal(hp - h.hp, 5, 'resiste à essência do draco');
  novoTurno(h);
  assert.ok(enc.castSpell(h, 'soproDoDraco', { point: ogro.pos }).ok);
  const hp2 = h.hp;
  enc.applyDamage(h, 12, 'cortante', ogro);
  assert.equal(hp2 - h.hp, 6, 'o elo aperfeiçoado');
});

// ------------------------------------------------------------------ Bigby

await teste('Caminho do Gigante: em Fúria, alcance de 4,5 m; o Cutelo Elemental muda o tipo, soma 2d6 e se arremessa; o Impulso Poderoso', () => {
  const { enc, h, foes: [ogro, gob], texto } = montar(heroi('barbaro', 14, 'caminhoDoGigante'), { foes: [['ogro', { x: 15, y: 5 }], ['goblin', { x: 8, y: 5 }]] });
  ogro.hp = ogro.maxHp = 300;
  gob.hp = gob.maxHp = 300;
  assert.ok(h.magiasDeCaracteristica.includes('taumaturgia'));
  assert.ok(!enc.canAttack(h, gob, h.equippedWeapon).ok, 'sem Fúria, 4,5 m é longe');
  assert.ok(enc.useFeature(h, 'elementalCleaver', { modo: 'elétrico' }));
  assert.ok(enc.useFeature(h, 'rage'));
  assert.ok(enc.canAttack(h, gob, h.equippedWeapon).ok, 'em Fúria, alcança');
  d20s(enc, [19]);
  enc.resolveAttack(h, gob);
  assert.match(texto(), /Cutelo Elemental: \+\d+ de elétrico/);
  assert.ok(h.weapons.includes('arremessoDoCutelo'));
  const r = enc.canAttack(h, ogro, 'arremessoDoCutelo');
  assert.ok(r.ok, r.why);
  novoTurno(h);
  d20s(enc, [1]);
  assert.ok(enc.useFeature(h, 'mightyImpel', { target: gob }));
  assert.ok(gob.pos.x !== 8 || gob.pos.y !== 5, 'arremessado');
});

console.log(`
${total - falhas} de ${total} provas passaram`);
if (falhas) process.exit(1);
