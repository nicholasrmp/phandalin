// AS SUBCLASSES DO GUIA DE XANATHAR no motor: o bárbaro (Guardião Ancestral, Arauto da Tempestade, Fanático), o bardo
// (Glamour, Espadas, Sussurros), o clérigo (Forja, Sepultura), o guerreiro (Arqueiro Arcano, Cavaleiro, Samurai) e o ladino
// (Espadachim, Batedor, Inquisitivo, Mentor), o monge (Mestre Bêbado, Kensei, Alma Solar), o paladino (Conquista, Redenção)
// e o patrulheiro (Perseguidor Sombrio, Andarilho do Horizonte, Matador de Monstros), o druida (Sonhos, Pastor), o
// feiticeiro (Alma Divina, Magia das Sombras, Tempestade), o bruxo (Celestial, Lâmina Maldita) e o mago (Magia de Guerra):
// as 31 do livro, sobre o Encounter de verdade.
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-subclasses-xge.mjs
//
// Cada prova foi escrita para FALHAR sem o código dela: nenhuma destas subclasses existia.
import assert from 'node:assert/strict';

const P = new URL('../', import.meta.url).href;
const { Encounter } = await import(P + 'rules/combat.js');
const { criarPersonagem } = await import(P + 'rules/progressao.js');
const { makeMonster } = await import(P + 'rules/monsters.js');
const { Battlefield, distanceFt } = await import(P + 'core/grid.js');
const { makeRng } = await import(P + 'core/rng.js');
const { hasCondition, getCondition, removeCondition, addCondition, caEfetiva } = await import(P + 'rules/conditions.js');
const { armorClass } = await import(P + 'rules/equipment.js');
const { magiasProntas } = await import(P + 'rules/spells.js');
const { recuperarNoCurto } = await import(P + 'rules/descanso.js');
const { CLASSES, CARACTERISTICAS } = await import(P + 'rules/classes/index.js');
const { estadoDaCaracteristica } = await import(P + 'rules/classes/caracteristicas.js');
const { SUBCLASSES_XGE } = await import(P + 'rules/classes/subclasses-xge.js');
const { SUBCLASSES_1, listaDaClasse } = await import(P + 'game/criacao.js');
const { usoLivreDe } = await import(P + 'rules/passivas.js');
const { descansoLongo } = await import(P + 'rules/descanso.js');
const { weaponAbility } = await import(P + 'rules/equipment.js');
const { WEAPONS } = await import(P + 'rules/items/weapons.js');
const { skillBonus, abilityMod } = await import(P + 'rules/abilities.js');
const { bonusDeIniciativa } = await import(P + 'rules/talentos.js');
const { margemDeCritico } = await import(P + 'rules/passivas.js');
const { visaoNoEscuro, podeVer } = await import(P + 'rules/luz.js');
const { SPELLS } = await import(P + 'rules/spells.js');
const Sub = await import(P + 'rules/subclasses-livros.js');

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
  ladino: { str: 10, dex: 16, con: 14, int: 12, wis: 14, cha: 14 },
  monge: { str: 10, dex: 16, con: 14, int: 10, wis: 16, cha: 10 },
  paladino: { str: 16, dex: 10, con: 14, int: 8, wis: 10, cha: 16 },
  patrulheiro: { str: 12, dex: 16, con: 14, int: 10, wis: 14, cha: 10 },
  druida: { str: 10, dex: 14, con: 14, int: 10, wis: 16, cha: 10 },
  feiticeiro: { str: 8, dex: 14, con: 14, int: 10, wis: 10, cha: 16 },
  bruxo: { str: 10, dex: 14, con: 14, int: 10, wis: 10, cha: 16 },
  mago: { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10 },
};
const ARMADURA = { barbaro: 'nenhuma', bardo: 'couroBatido', clerigo: 'cotaDeMalha', guerreiro: 'cotaDeMalha', ladino: 'couroBatido', monge: 'nenhuma', paladino: 'cotaDeMalha', patrulheiro: 'couroBatido', druida: 'couroBatido', feiticeiro: 'nenhuma', bruxo: 'couro', mago: 'nenhuma' };
const ARMA = { barbaro: 'espadaLonga', bardo: 'cimitarra', clerigo: 'maca', guerreiro: 'espadaLonga', ladino: 'rapieira', monge: 'bordao', paladino: 'espadaLonga', patrulheiro: 'espadaLonga', druida: 'bordao', feiticeiro: 'adaga', bruxo: 'espadaLonga', mago: 'bordao' };

/** Um herói da classe e subclasse, no nível pedido; `esc` são as escolhas do nível da subclasse. */
function heroi(classe, nivel, sub = null, esc = {}, { arma = ARMA[classe], abilities = ATRIBUTOS[classe] } = {}) {
  const nv = CLASSES[classe].subclasse.nivel;
  const c = criarPersonagem({
    id: `h-${classe}-${sub ?? 'x'}`, name: `${classe}-${sub ?? 'x'}`, ancestry: 'Humano', look: 'fighter',
    abilities: { ...abilities }, skills: [], armor: ARMADURA[classe], shield: false, speedFt: 30, weapons: [arma],
  }, { classe, nivel, escolhas: sub ? { [nv]: { subclasse: sub, ...esc } } : {} });
  c.equippedWeapon = c.weapons[0];
  return c;
}

/** O herói em (5,5), a guerreira aliada em (5,6), e os inimigos pedidos (o ogro colado nos dois, por padrão). */
function montar(h, { foes = [['ogro', { x: 6, y: 5 }]], seed = 3 } = {}) {
  const field = new Battlefield(20, 20, Array(20).fill('.'.repeat(20)));
  const aliada = heroi('guerreiro', Math.max(1, h.level));
  aliada.name = 'Dara';
  h.pos = { x: 5, y: 5, f: 1 };
  aliada.pos = { x: 5, y: 6, f: 1 };
  const fs = foes.map(([id, p]) => makeMonster(id, p));
  const log = [];
  const enc = new Encounter({ battlefield: field, party: [h, aliada], foes: fs, rng: makeRng(seed), onLog: (e) => log.push(e) });
  enc.firstSide = 'party'; enc.round = 1; enc.beginSide('party');
  const texto = () => log.map((l) => `${l.text} ${l.detail ?? ''}`).join('\n');
  return { enc, h, aliada, foes: fs, log, texto };
}
/** Os próximos d20 saem destes valores (o resto dos dados segue o sorteio). */
function d20s(enc, valores) {
  const orig = enc.rng.die;
  const fila = [...valores];
  enc.rng.die = (lados) => (lados === 20 && fila.length ? fila.shift() : orig(lados));
}
const novoTurno = (c) => { c.actionUsed = false; c.bonusUsed = false; c.reactionUsed = false; c.magiasNoTurno = []; c.atacouNoTurno = false; };

await teste('as oito subclasses entram nas classes, com nome em pt-br, e todo recurso delas tem texto e estado (nada fica pendente)', () => {
  const ids = Object.entries(SUBCLASSES_XGE).flatMap(([cl, subs]) => Object.keys(subs).map((s) => [cl, s]));
  assert.equal(ids.length, 31);
  for (const [cl, s] of ids) {
    const def = CLASSES[cl].subclasse.opcoes[s];
    assert.ok(def && def.fonte === 'xge' && def.nome && !/[A-Z][a-z]+ of /.test(def.nome), `${cl}.${s}: ${def?.nome}`);
    for (const f of Object.values(def.niveis).flat()) {
      assert.ok(CARACTERISTICAS[f]?.desc, `${cl}.${s}: ${f} sem texto`);
      assert.notEqual(estadoDaCaracteristica(f), 'pendente', `${cl}.${s}: ${f} pendente`);
    }
  }
  assert.equal(CLASSES.barbaro.subclasse.opcoes.fanatico.nome, 'Caminho do Fanático');
  assert.ok(CARACTERISTICAS.windSpeaker.semEfeito, 'o que o jogo não faz diz por quê');
  assert.ok(SUBCLASSES_1.clerigo.opcoes.some((o) => o.motor === 'sepultura') && SUBCLASSES_1.clerigo.opcoes.some((o) => o.motor === 'forja'));
  assert.equal(Object.keys(CLASSES.barbaro.subclasse.opcoes)[0], 'berserker', 'a do SRD continua sendo a primeira (o padrão)');
});

// ------------------------------------------------------------------ bárbaro

await teste('Protetores Ancestrais: o primeiro acerto em Fúria marca o ogro; ele ataca a aliada com desvantagem e ela resiste; o bárbaro, não', () => {
  const { enc, h, aliada, foes: [ogro] } = montar(heroi('barbaro', 3, 'guardiaoAncestral'));
  assert.ok(enc.useFeature(h, 'rage'));
  d20s(enc, [19]);
  assert.ok(enc.resolveAttack(h, ogro).hit);
  assert.ok(hasCondition(ogro, 'protetoresAncestrais'));
  assert.ok(enc.attackModifiers(ogro, aliada).desvantagens.some((d) => /Protetores Ancestrais/.test(d)));
  assert.ok(!enc.attackModifiers(ogro, h).desvantagens.some((d) => /Protetores Ancestrais/.test(d)));
  const hp = aliada.hp;
  enc.applyDamage(aliada, 10, 'concussão', ogro, { deArma: true });
  assert.equal(hp - aliada.hp, 5, 'resistência ao dano do ataque do marcado');
  removeCondition(h, 'furia');
  const hp2 = aliada.hp;
  enc.applyDamage(aliada, 10, 'concussão', ogro, { deArma: true });
  assert.equal(hp2 - aliada.hp, 10, 'a marca acaba com a Fúria');
});

await teste('Escudo Espiritual corta 2d6 do dano da aliada (reação); no 14º, os Ancestrais Vingativos devolvem o evitado ao ogro', () => {
  const a = montar(heroi('barbaro', 6, 'guardiaoAncestral'));
  a.enc.useFeature(a.h, 'rage');
  const hp = a.aliada.hp;
  a.enc.applyDamage(a.aliada, 12, 'cortante', a.foes[0], { deArma: true });
  assert.ok(a.h.reactionUsed && hp - a.aliada.hp < 12 && hp - a.aliada.hp >= 0);
  const b = montar(heroi('barbaro', 14, 'guardiaoAncestral'));
  b.enc.useFeature(b.h, 'rage');
  const [ogro] = b.foes;
  const hpA = b.aliada.hp; const hpO = ogro.hp;
  b.enc.applyDamage(b.aliada, 12, 'cortante', ogro, { deArma: true });
  const evitado = 12 - (hpA - b.aliada.hp);
  assert.equal(b.h.dadosDoEscudoEspiritual, '4d6');
  assert.ok(evitado > 0);
  assert.equal(hpO - ogro.hp, evitado, 'o ogro leva o que o escudo evitou');
});

await teste('Arauto da Tempestade: o deserto queima todo mundo a 3 m ao entrar em Fúria; a tundra dá PV temporários; a Alma resiste ao fogo', () => {
  const a = montar(heroi('barbaro', 3, 'arautoDaTempestade', { stormAura: 'deserto' }));
  const hpO = a.foes[0].hp; const hpA = a.aliada.hp;
  a.enc.useFeature(a.h, 'rage');
  assert.equal(hpO - a.foes[0].hp, 2);
  assert.equal(hpA - a.aliada.hp, 2, 'o deserto não poupa o aliado: o livro diz "cada outra criatura"');
  novoTurno(a.h);
  assert.ok(a.enc.useFeature(a.h, 'stormAura') && a.h.bonusUsed, 'de novo como ação bônus');
  assert.equal(hpO - a.foes[0].hp, 4);
  const t = montar(heroi('barbaro', 6, 'arautoDaTempestade', { stormAura: 'tundra' }));
  t.enc.useFeature(t.h, 'rage');
  assert.equal(t.h.tempHp, 3); assert.equal(t.aliada.tempHp, 3);
  assert.equal(t.enc.danoPorTipo(t.h, 10, 'frio'), 5, 'Alma da Tempestade: a tundra resiste ao frio');
  const d = heroi('barbaro', 6, 'arautoDaTempestade', { stormAura: 'deserto' });
  const m = montar(d);
  assert.equal(m.enc.danoPorTipo(d, 10, 'fogo'), 5);
  assert.equal(m.enc.danoPorTipo(m.aliada, 10, 'fogo'), 10, 'a aliada só resiste com a Tempestade Protetora (10º)');
});

await teste('Arauto: no mar, o raio da aura acerta um inimigo; no 10º, a aliada na aura resiste; no 14º, o golpe na aura derruba', () => {
  const a = montar(heroi('barbaro', 14, 'arautoDaTempestade', { stormAura: 'mar' }));
  const [ogro] = a.foes;
  const hp = ogro.hp;
  d20s(a.enc, [1]);
  a.enc.useFeature(a.h, 'rage');
  assert.ok(ogro.hp < hp, 'o raio do mar');
  assert.equal(a.enc.danoPorTipo(a.aliada, 10, 'elétrico'), 5, 'Tempestade Protetora');
  removeCondition(a.h, 'furia');
  assert.equal(a.enc.danoPorTipo(a.aliada, 10, 'elétrico'), 10, 'só com a aura de pé');
  addCondition(a.h, 'furia', { rounds: 10, quando: 'fim' });
  d20s(a.enc, [19, 1]);
  a.enc.resolveAttack(a.h, ogro);
  assert.ok(hasCondition(ogro, 'caido') && a.h.reactionUsed, 'Tempestade Furiosa do mar');
  const t = montar(heroi('barbaro', 14, 'arautoDaTempestade', { stormAura: 'tundra' }));
  d20s(t.enc, [1]);
  t.enc.useFeature(t.h, 'rage');
  assert.ok(hasCondition(t.foes[0], 'presoPelaTundra'));
  assert.equal(t.enc.speedOf(t.foes[0]), 0, 'Tempestade Furiosa da tundra: deslocamento 0');
});

await teste('Fanático: a Fúria Divina soma 1d6 + metade do nível no primeiro acerto do turno, radiante, e só uma vez', () => {
  const { enc, h, foes: [ogro], texto } = montar(heroi('barbaro', 6, 'fanatico'));
  enc.useFeature(h, 'rage');
  d20s(enc, [19, 19]);
  enc.resolveAttack(h, ogro);
  enc.resolveAttack(h, ogro);
  assert.equal((texto().match(/Fúria Divina: \+\d+ de radiante/g) ?? []).length, 1);
  const n = montar(heroi('barbaro', 3, 'fanatico', { divineFury: 'necrótico' }));
  n.enc.useFeature(n.h, 'rage');
  d20s(n.enc, [19]);
  n.enc.resolveAttack(n.h, n.foes[0]);
  assert.match(n.texto(), /Fúria Divina: \+\d+ de necrótico/);
});

await teste('Foco Fanático: a resistência que falha em Fúria se rola de novo, uma vez por Fúria; a Presença Zelosa dá vantagem aos aliados', () => {
  const { enc, h, aliada, foes: [ogro] } = montar(heroi('barbaro', 10, 'fanatico'));
  enc.useFeature(h, 'rage');
  d20s(enc, [1, 20]);
  assert.ok(enc.resistencia(h, 'wis', 15).success, 'o novo teste vale');
  d20s(enc, [1, 20]);
  assert.ok(!enc.resistencia(h, 'wis', 15).success, 'só uma vez por Fúria');
  novoTurno(h);
  assert.ok(enc.useFeature(h, 'zealousPresence'));
  assert.ok(hasCondition(aliada, 'presencaZelosa') && !hasCondition(h, 'presencaZelosa'));
  assert.ok(enc.attackModifiers(aliada, ogro).vantagens.length > 0);
  assert.equal(h.resources.zealousPresence, 0);
});

await teste('Fúria Além da Morte: a 0 PV em Fúria ele fica de pé e age; as três falhas só matam quando a Fúria acaba', () => {
  const { enc, h, foes: [ogro] } = montar(heroi('barbaro', 14, 'fanatico'));
  enc.useFeature(h, 'rage');
  h.furiaImplacavelCD = 40; // a Fúria Implacável (11º) não o segura a 1 PV
  enc.applyDamage(h, h.hp + (h.tempHp ?? 0), 'psíquico', ogro);
  assert.equal(h.hp, 0);
  assert.ok(!hasCondition(h, 'inconsciente') && !h.dead && h.furiaAlemDaMorte);
  assert.ok(enc.living('party').includes(h), 'conta como de pé: o grupo não perde');
  for (let i = 0; i < 3; i++) enc.applyDamage(h, 2, 'psíquico', ogro);
  assert.ok(h.deathSaves.failures >= 3 && !h.dead, 'três falhas, e a fúria não deixa morrer');
  removeCondition(h, 'furia');
  Sub.conferirFuriaAlemDaMorte(enc);
  assert.ok(h.dead, 'a fúria acabou a 0 PV: morre');
  // curado antes de a fúria acabar, ele vive
  const b = montar(heroi('barbaro', 14, 'fanatico'));
  b.enc.useFeature(b.h, 'rage');
  b.h.furiaImplacavelCD = 40;
  b.enc.applyDamage(b.h, b.h.hp + (b.h.tempHp ?? 0), 'psíquico', b.foes[0]);
  for (let i = 0; i < 3; i++) b.enc.applyDamage(b.h, 2, 'psíquico', b.foes[0]);
  b.enc.heal(b.h, 10, b.aliada);
  removeCondition(b.h, 'furia');
  Sub.conferirFuriaAlemDaMorte(b.enc);
  assert.ok(!b.h.dead && b.h.hp === 10 && b.h.deathSaves.failures === 0);
  // sem a fúria, cai como sempre
  const c = montar(heroi('barbaro', 14, 'fanatico'));
  c.enc.applyDamage(c.h, c.h.hp, 'cortante', c.foes[0]);
  assert.ok(hasCondition(c.h, 'inconsciente'));
});

// ------------------------------------------------------------------ bardo

await teste('Manto de Inspiração: uma Inspiração dá 5 PV temporários a até CAR criaturas a 18 m (8 no 5º)', () => {
  const { enc, h, aliada } = montar(heroi('bardo', 3, 'glamour'));
  const insp = h.resources.bardicInspiration;
  assert.ok(enc.useFeature(h, 'mantleOfInspiration'));
  assert.equal(aliada.tempHp, 5);
  assert.equal(h.resources.bardicInspiration, insp - 1);
  assert.ok(h.bonusUsed);
  assert.equal(heroi('bardo', 5, 'glamour').pvDoMantoDeInspiracao, 8);
});

await teste('Manto de Majestade: Comando sem espaço agora e, com a concentração de pé, de novo como ação bônus no turno seguinte', () => {
  const { enc, h, foes: [ogro] } = montar(heroi('bardo', 6, 'glamour'));
  const espacos = JSON.stringify(h.spellcasting.slots);
  d20s(enc, [1]);
  assert.ok(enc.useFeature(h, 'mantleOfMajesty', { target: ogro }));
  assert.ok(hasCondition(h, 'mantoDeMajestade') && h.concentrating?.spellId === 'mantoDeMajestade');
  assert.ok(hasCondition(ogro, 'comandado'), 'o ogro falhou e obedece');
  assert.equal(JSON.stringify(h.spellcasting.slots), espacos, 'sem espaço de magia');
  assert.ok(h.bonusUsed);
  novoTurno(h);
  assert.ok(magiasProntas(h).includes('comandoDaMajestade'));
  assert.ok(enc.canCast(h, 'comandoDaMajestade', { target: ogro }).ok);
  enc.dropConcentration(h);
  assert.ok(!magiasProntas(h).includes('comandoDaMajestade'), 'acabou a concentração, acabou o comando');
  assert.equal(h.resources.mantleOfMajesty, 0);
});

await teste('Majestade Inquebrável: quem falha no Carisma não ataca o bardo neste turno; quem passa ataca e resiste mal às magias dele', () => {
  const { enc, h, foes: [ogro] } = montar(heroi('bardo', 14, 'glamour'));
  assert.ok(enc.useFeature(h, 'unbreakableMajesty'));
  d20s(enc, [1]);
  assert.equal(enc.resolveAttack(ogro, h), null, 'o ataque se perde');
  assert.equal(enc.resolveAttack(ogro, h), null, 'e o segundo do mesmo turno também, sem novo teste');
  const b = montar(heroi('bardo', 14, 'glamour'));
  b.enc.useFeature(b.h, 'unbreakableMajesty');
  d20s(b.enc, [20]);
  assert.notEqual(b.enc.resolveAttack(b.foes[0], b.h), null);
  assert.ok(hasCondition(b.foes[0], 'abaladoPelaMajestade'));
  assert.ok(Sub.abaladoContra(b.foes[0], b.h));
  // volta no descanso curto
  assert.equal(b.h.resources.unbreakableMajesty, 0);
  recuperarNoCurto(b.h);
  assert.equal(b.h.resources.unbreakableMajesty, 1);
});

await teste('Colégio das Espadas: cimitarra e armadura média, Duelismo ou Duas Armas, e o Ataque Extra no 6º', () => {
  const h = heroi('bardo', 6, 'espadas');
  assert.ok(h.weaponTraining.includes('cimitarra') && h.armorTraining.includes('média'));
  assert.ok(h.features.includes('dueling') || h.features.includes('twoWeaponFighting'));
  assert.equal(h.ataquesExtras, 1);
  assert.throws(() => heroi('bardo', 3, 'espadas', { estiloDeLuta: 'archery' }), /inválida/i);
});

await teste('Floreio Defensivo: o dado vai ao dano e à CA; a ação de Atacar dá +3 m; a Inspiração se gasta', () => {
  const { enc, h, foes: [ogro], texto } = montar(heroi('bardo', 3, 'espadas'));
  enc.useFeature(h, 'bladeFlourish', { modo: 'defensivo' });
  const ca = caEfetiva(h);
  const passo = h.movementLeftFt;
  const insp = h.resources.bardicInspiration;
  d20s(enc, [19]);
  assert.ok(enc.resolveAttack(h, ogro).hit);
  assert.match(texto(), /Floreio Defensivo/);
  const bonus = getCondition(h, 'floreioDefensivo')?.data?.acBonus;
  assert.ok(bonus >= 1 && caEfetiva(h) === ca + bonus);
  assert.equal(h.movementLeftFt, passo + 10);
  assert.equal(h.resources.bardicInspiration, insp - 1);
  d20s(enc, [19]);
  enc.resolveAttack(h, ogro);
  assert.equal(h.resources.bardicInspiration, insp - 1, 'um floreio por turno');
});

await teste('Floreio Cortante alcança o outro inimigo colado no bardo; o Móvel empurra; o Floreio do Mestre não gasta Inspiração', () => {
  const a = montar(heroi('bardo', 3, 'espadas'), { foes: [['ogro', { x: 6, y: 5 }], ['goblin', { x: 4, y: 5 }]] });
  a.enc.useFeature(a.h, 'bladeFlourish', { modo: 'cortante' });
  const hpG = a.foes[1].hp;
  d20s(a.enc, [19]);
  a.enc.resolveAttack(a.h, a.foes[0]);
  assert.ok(a.foes[1].hp < hpG || a.foes[1].dead, 'o goblin leva o dado');
  const b = montar(heroi('bardo', 3, 'espadas'));
  b.enc.useFeature(b.h, 'bladeFlourish', { modo: 'movel' });
  d20s(b.enc, [19]);
  b.enc.resolveAttack(b.h, b.foes[0]);
  assert.ok(b.foes[0].pos.x > 6, 'o ogro foi empurrado para longe');
  const c = montar(heroi('bardo', 14, 'espadas'));
  c.enc.useFeature(c.h, 'bladeFlourish', { modo: 'defensivo' });
  const insp = c.h.resources.bardicInspiration;
  d20s(c.enc, [19]);
  c.enc.resolveAttack(c.h, c.foes[0]);
  assert.ok(hasCondition(c.h, 'floreioDefensivo'));
  assert.equal(c.h.resources.bardicInspiration, insp, 'o d6 do mestre é de graça');
});

await teste('Lâminas Psíquicas: ligadas, o acerto de arma gasta uma Inspiração e soma 2d6 psíquico, uma vez por rodada', () => {
  const { enc, h, foes: [ogro], texto } = montar(heroi('bardo', 3, 'sussurros'));
  const insp = h.resources.bardicInspiration;
  d20s(enc, [19]);
  enc.resolveAttack(h, ogro);
  assert.doesNotMatch(texto(), /Lâminas Psíquicas/, 'desligadas, nada');
  enc.useFeature(h, 'psychicBlades', { modo: 'ligar' });
  d20s(enc, [19, 19]);
  enc.resolveAttack(h, ogro);
  enc.resolveAttack(h, ogro);
  assert.equal((texto().match(/Lâminas Psíquicas: \+\d+ de psíquico/g) ?? []).length, 1);
  assert.equal(h.resources.bardicInspiration, insp - 1);
  assert.equal(heroi('bardo', 15, 'sussurros').dadosDasLaminasPsiquicas, '8d6');
});

// ------------------------------------------------------------------ clérigo

await teste('Domínio da Forja: +1 na armadura abençoada, +1 de armadura pesada no 6º, fogo resistido e depois imune, e o Golpe Divino de fogo', () => {
  const sem = heroi('clerigo', 6);
  const f1 = heroi('clerigo', 1, 'forja');
  const f6 = heroi('clerigo', 6, 'forja');
  assert.equal(armorClass(f1), armorClass(heroi('clerigo', 1)) + 1);
  assert.equal(armorClass(f6), armorClass(sem) + 2);
  assert.ok(f1.armorTraining.includes('pesada'));
  const { enc } = montar(f6);
  assert.equal(enc.danoPorTipo(f6, 10, 'fogo'), 5);
  const f17 = heroi('clerigo', 17, 'forja');
  const m = montar(f17);
  assert.equal(m.enc.danoPorTipo(f17, 10, 'fogo'), 0);
  assert.equal(m.enc.danoPorTipo(f17, 10, 'cortante', false), 5, 'Santo da Forja: golpe não mágico, de armadura pesada');
  assert.equal(m.enc.danoPorTipo(f17, 10, 'cortante', true), 10, 'o golpe mágico passa');
  d20s(m.enc, [19]);
  m.enc.resolveAttack(f17, m.foes[0]);
  assert.match(m.texto(), /Golpe Divino: \+\d+ de fogo/);
});

await teste('Bênção da Forja na arma: +1 no ataque e no dano, e o golpe conta como mágico', () => {
  const a = heroi('clerigo', 1, 'forja', { blessingOfTheForge: 'arma' });
  const b = heroi('clerigo', 1);
  const { enc, foes: [ogro] } = montar(a);
  const pa = enc.canAttack(a, ogro).profile;
  const pb = new Encounter({ battlefield: new Battlefield(20, 20, Array(20).fill('.'.repeat(20))), party: [Object.assign(b, { pos: { x: 5, y: 5, f: 1 } })], foes: [makeMonster('ogro', { x: 6, y: 5 })], rng: makeRng(1) })
    .canAttack(b, ogro).profile;
  assert.equal(pa.bonus, pb.bonus + 1);
  assert.ok(pa.weapon.raridade);
  assert.equal(armorClass(a), armorClass(b), 'a bênção foi para a arma, não para a armadura');
});

await teste('Círculo da Mortalidade: a cura em quem está a 0 PV sai no máximo, e Poupar os Moribundos vai a 9 m como ação bônus', () => {
  const h = heroi('clerigo', 1, 'sepultura');
  h.spellcasting.prepared.push('curarFerimentos');
  const { enc, aliada } = montar(h);
  aliada.hp = 0;
  addCondition(aliada, 'inconsciente');
  assert.ok(enc.castSpell(h, 'curarFerimentos', { target: aliada }).ok);
  assert.equal(aliada.hp, 8 + 3, '1d8 no máximo + SAB');
  assert.ok(magiasProntas(h).includes('pouparOsMoribundosDaSepultura'));
  const b = montar(heroi('clerigo', 1, 'sepultura'));
  b.aliada.hp = 0; addCondition(b.aliada, 'inconsciente');
  b.aliada.pos = { x: 5, y: 11, f: 1 };
  const r = b.enc.castSpell(b.h, 'pouparOsMoribundosDaSepultura', { target: b.aliada });
  assert.ok(r.ok, r.why);
  assert.ok(b.aliada.stable && b.h.bonusUsed && !b.h.actionUsed);
});

await teste('Caminho para a Sepultura: o próximo golpe do grupo no amaldiçoado fere em dobro, e a maldição acaba', () => {
  const { enc, h, aliada, foes: [ogro] } = montar(heroi('clerigo', 2, 'sepultura'));
  assert.ok(enc.useFeature(h, 'pathToTheGrave', { target: ogro }));
  assert.equal(h.resources.channelDivinity, 0);
  const hp = ogro.hp;
  d20s(enc, [19]);
  const r = enc.resolveAttack(aliada, ogro);
  assert.ok(r.hit);
  assert.equal(hp - ogro.hp, Math.min(hp, r.damage * 2));
  assert.ok(!hasCondition(ogro, 'caminhoDaSepultura'));
  const hp2 = ogro.hp;
  d20s(enc, [19]);
  const r2 = enc.resolveAttack(aliada, ogro);
  assert.equal(hp2 - ogro.hp, Math.min(hp2, r2.damage), 'o segundo golpe é normal');
});

await teste('Sentinela na Porta da Morte desfaz o crítico contra a aliada; o Guardião das Almas cura quem está ferido quando o inimigo morre', () => {
  const { enc, h, aliada, foes: [ogro] } = montar(heroi('clerigo', 6, 'sepultura'));
  const usos = h.resources.sentinelAtDeathsDoor;
  d20s(enc, [20]);
  const r = enc.resolveAttack(ogro, aliada);
  assert.ok(r.hit && !r.critical, 'acerto comum');
  assert.equal(h.resources.sentinelAtDeathsDoor, usos - 1);
  const g = montar(heroi('clerigo', 17, 'sepultura'), { foes: [['goblin', { x: 6, y: 5 }]] });
  g.aliada.hp -= 10;
  const hp = g.aliada.hp;
  g.enc.applyDamage(g.foes[0], 99, 'cortante', g.aliada);
  assert.ok(g.foes[0].dead);
  assert.equal(g.aliada.hp - hp, 2, 'o goblin tem 2 dados de vida');
});


// ------------------------------------------------------------------ guerreiro

const ARQUEIRO = { arma: 'arcoLongo', abilities: { str: 12, dex: 16, con: 14, int: 14, wis: 10, cha: 10 } };
const neutro = { advantage: false, disadvantage: false };

await teste('Arqueiro Arcano: o Disparo Banidor arma, sai no acerto de arco da ação de Atacar, gasta um uso e manda o ogro embora', () => {
  const { enc, h, foes: [ogro] } = montar(heroi('guerreiro', 3, 'arqueiroArcano', {}, ARQUEIRO), { foes: [['ogro', { x: 10, y: 5 }]] });
  assert.ok(h.features.includes('disparoBanidor') && h.features.includes('disparoEncantador'), 'conhece duas opções no 3º');
  assert.ok(h.skills.includes('natureza') || h.skills.includes('arcanismo'));
  assert.ok(enc.useFeature(h, 'arcaneShot', { modo: 'disparoBanidor' }));
  d20s(enc, [19, 1]);
  enc.attackAction(h, ogro, 'arcoLongo');
  assert.ok(hasCondition(ogro, 'banido'));
  assert.equal(h.resources.arcaneShot, 1);
  assert.equal(h.disparoPronto, null, 'desarma depois de sair');
  recuperarNoCurto(h);
  assert.equal(h.resources.arcaneShot, 2, 'volta no descanso curto');
});

await teste('Disparo Explosivo fere quem está a 3 m do alvo; no 7º, a flecha é mágica e o erro faz a curva para outro inimigo', () => {
  const a = montar(heroi('guerreiro', 3, 'arqueiroArcano', {}, ARQUEIRO), { foes: [['ogro', { x: 10, y: 5 }], ['goblin', { x: 11, y: 6 }]] });
  a.h.features.push('disparoExplosivo');
  a.enc.useFeature(a.h, 'arcaneShot', { modo: 'disparoExplosivo' });
  const hpG = a.foes[1].hp;
  d20s(a.enc, [19]);
  a.enc.attackAction(a.h, a.foes[0], 'arcoLongo');
  assert.ok(a.foes[1].hp < hpG || a.foes[1].dead, 'o goblin ao lado leva a explosão');
  const b = montar(heroi('guerreiro', 7, 'arqueiroArcano', {}, ARQUEIRO), { foes: [['ogro', { x: 10, y: 5 }], ['goblin', { x: 12, y: 5 }]] });
  b.foes[0].resistNaoMagico = ['perfurante'];
  const hp = b.foes[0].hp;
  d20s(b.enc, [19]);
  const r = b.enc.resolveAttack(b.h, b.foes[0], { weaponId: 'arcoLongo' });
  assert.equal(hp - b.foes[0].hp, Math.min(hp, r.damage), 'a resistência a golpe não mágico não vale contra a Flecha Mágica');
  novoTurno(b.h);
  d20s(b.enc, [2]);
  b.enc.resolveAttack(b.h, b.foes[0], { weaponId: 'arcoLongo' });
  assert.ok(b.h.bonusUsed, 'Disparo Curvo: a ação bônus foi gasta');
  assert.match(b.texto(), /Disparo Curvo/);
});

await teste('Cavaleiro: a Marca Inabalável dá desvantagem ao marcado contra a aliada e, quando ele a fere, o golpe de ação bônus', () => {
  const { enc, h, aliada, foes: [ogro], texto } = montar(heroi('guerreiro', 3, 'cavaleiro'));
  d20s(enc, [19]);
  enc.resolveAttack(h, ogro);
  assert.ok(hasCondition(ogro, 'marcaInabalavel'));
  assert.ok(enc.attackModifiers(ogro, aliada).desvantagens.some((d) => /Marca Inabalável/.test(d)));
  assert.ok(!enc.attackModifiers(ogro, h).desvantagens.some((d) => /Marca Inabalável/.test(d)));
  enc.applyDamage(aliada, 5, 'concussão', ogro, { deArma: true });
  assert.ok(!enc.useFeature(h, 'unwaveringMark', { target: ogro }), 'só no próximo turno do cavaleiro');
  Sub.inicioDoLado(enc, 'party');
  novoTurno(h);
  const usos = h.resources.unwaveringMark;
  d20s(enc, [19, 19]);
  assert.ok(enc.useFeature(h, 'unwaveringMark', { target: ogro }));
  assert.ok(h.bonusUsed && h.resources.unwaveringMark === usos - 1);
  assert.match(texto(), /Marca Inabalável: \+1 de/);
});

await teste('Manobra de Proteção: +1d8 na CA da aliada contra o golpe; o que ainda acerta é resistido', () => {
  const { enc, h, aliada, foes: [ogro], texto } = montar(heroi('guerreiro', 7, 'cavaleiro'));
  const usos = h.resources.wardingManeuver;
  const hp = aliada.hp;
  d20s(enc, [19]);
  const r = enc.resolveAttack(ogro, aliada);
  assert.ok(h.reactionUsed && h.resources.wardingManeuver === usos - 1);
  assert.match(texto(), /Manobra de Proteção/);
  if (r.hit) assert.equal(hp - aliada.hp, Math.floor(r.damage / 2), 'o golpe que acertou foi resistido');
});

await teste('Manter a Linha: andar dentro do alcance do cavaleiro provoca, e o golpe que acerta o para; no 18º, o Defensor Vigilante pega outro', () => {
  const a = montar(heroi('guerreiro', 10, 'cavaleiro'), { foes: [['goblin', { x: 6, y: 5 }]] });
  const [g] = a.foes;
  a.enc.side = 'foes';
  g.movementLeftFt = 30;
  d20s(a.enc, [19]);
  a.enc.moveAlong(g, [{ x: 6, y: 5 }, { x: 6, y: 4 }]);
  assert.ok(a.h.reactionUsed, 'o passo dentro do alcance provocou');
  assert.ok(g.dead || g.movementLeftFt === 0, 'e o acerto o parou');
  const b = montar(heroi('guerreiro', 18, 'cavaleiro'), { foes: [['ogro', { x: 6, y: 5 }], ['ogro', { x: 4, y: 5 }]] });
  b.enc.side = 'foes';
  for (const o of b.foes) { o.movementLeftFt = 30; o.hp = o.maxHp = 300; }
  b.enc.moveAlong(b.foes[0], [{ x: 6, y: 5 }, { x: 7, y: 5 }]);
  b.enc.moveAlong(b.foes[1], [{ x: 4, y: 5 }, { x: 3, y: 5 }]);
  assert.match(b.texto(), /Defensor Vigilante/);
});

await teste('Investida Feroz: 3 m em linha reta antes do acerto, e o alvo testa Força ou cai', () => {
  const { enc, h, foes: [ogro] } = montar(heroi('guerreiro', 15, 'cavaleiro'), { foes: [['ogro', { x: 6, y: 5 }]] });
  h.pos = { x: 3, y: 5, f: 1 };
  h.movementLeftFt = 30;
  ogro.hp = ogro.maxHp = 300;
  assert.ok(enc.moveAlong(h, [{ x: 3, y: 5 }, { x: 4, y: 5 }, { x: 5, y: 5 }]));
  d20s(enc, [19, 1]);
  enc.resolveAttack(h, ogro);
  assert.ok(hasCondition(ogro, 'caido'));
});

await teste('Samurai: o Espírito de Luta dá vantagem e PV temporários; o Cortesão Elegante, a resistência de SAB e a Persuasão', () => {
  const { enc, h, foes: [ogro] } = montar(heroi('guerreiro', 7, 'samurai'));
  assert.ok(enc.useFeature(h, 'fightingSpirit'));
  assert.equal(h.tempHp, 5);
  assert.equal(h.resources.fightingSpirit, 2);
  assert.ok(enc.attackModifiers(h, ogro).vantagens.some((v) => /espírito de luta/.test(v)));
  assert.ok(h.saves.includes('wis'));
  const sem = heroi('guerreiro', 7, 'campeao');
  assert.equal(skillBonus(h, 'persuasao') - skillBonus(sem, 'persuasao'), abilityMod(h.abilities.wis));
  h.resources.fightingSpirit = 0;
  Sub.aoRolarIniciativa(enc);
  assert.equal(h.resources.fightingSpirit, 0, 'o Espírito Incansável é do 10º');
  const d = heroi('guerreiro', 10, 'samurai');
  const m = montar(d);
  d.resources.fightingSpirit = 0;
  Sub.aoRolarIniciativa(m.enc);
  assert.equal(d.resources.fightingSpirit, 1);
});

await teste('Golpe Rápido: na ação de Atacar com vantagem, um ataque troca a vantagem por um ataque a mais', () => {
  const { enc, h, foes: [ogro], texto } = montar(heroi('guerreiro', 15, 'samurai'));
  ogro.hp = ogro.maxHp = 500;
  enc.useFeature(h, 'fightingSpirit');
  enc.attackAction(h, ogro);
  const golpes = (texto().match(new RegExp(`${h.name} (acerta|erra) Ogro`, 'g')) ?? []).length;
  assert.equal(golpes, 1 + h.ataquesExtras + 1, 'os do Ataque Extra e mais um');
  assert.match(texto(), /Golpe Rápido/);
});

// ------------------------------------------------------------------ ladino

await teste('Espadachim: o Furtivo sem vantagem nem aliado, colado e sozinho; o Carisma na iniciativa; o Gingado tira a oportunidade', () => {
  const { enc, h, aliada, foes: [ogro] } = montar(heroi('ladino', 3, 'espadachim'));
  aliada.pos = { x: 15, y: 15, f: 1 };
  assert.ok(enc.sneakApplies(h, ogro, WEAPONS.rapieira, neutro));
  aliada.pos = { x: 4, y: 5, f: 1 };
  assert.ok(!enc.sneakApplies(h, { ...ogro, pos: { x: 6, y: 4, f: 1 } }, WEAPONS.rapieira, neutro), 'com outro colado no ladino, não');
  assert.equal(bonusDeIniciativa(h), abilityMod(h.abilities.dex) + abilityMod(h.abilities.cha));
  d20s(enc, [19]);
  enc.resolveAttack(h, ogro);
  assert.ok(!enc.ameacasNoPasso(h, h.pos, { x: 3, y: 5 }).includes(ogro), 'Gingado');
});

await teste('Panache: o provocado ataca outro com desvantagem; o ataque de um aliado quebra a provocação', () => {
  const { enc, h, aliada, foes: [ogro] } = montar(heroi('ladino', 9, 'espadachim'));
  d20s(enc, [20, 1]);
  assert.ok(enc.useFeature(h, 'panache', { target: ogro }));
  assert.ok(hasCondition(ogro, 'panache'));
  assert.ok(enc.attackModifiers(ogro, aliada).desvantagens.some((d) => /Panache/.test(d)));
  enc.resolveAttack(aliada, ogro);
  assert.ok(!hasCondition(ogro, 'panache'));
});

await teste('Manobra Elegante dá vantagem na próxima Acrobacia; o Mestre Duelista rola de novo o erro, com vantagem, uma vez', () => {
  const { enc, h, foes: [ogro] } = montar(heroi('ladino', 17, 'espadachim'));
  assert.ok(enc.useFeature(h, 'elegantManeuver'));
  d20s(enc, [1, 18]);
  const t = enc.testeDeAtributo(h, 'dex', 0, 'Acrobacia', { pericia: 'acrobacia' });
  assert.ok(t.total >= 18 && !hasCondition(h, 'manobraElegante'));
  d20s(enc, [1, 19, 3]);
  const r = enc.resolveAttack(h, ogro);
  assert.ok(r.hit && h.resources.masterDuelist === 0);
  recuperarNoCurto(h);
  assert.equal(h.resources.masterDuelist, 1);
});

await teste('Batedor: Natureza e Sobrevivência dobradas, +3 m no 9º, e no 13º a vantagem na iniciativa e o alvo exposto da 1ª rodada', () => {
  const h9 = heroi('ladino', 9, 'batedor');
  assert.ok(h9.expertise.includes('natureza') && h9.expertise.includes('sobrevivencia'));
  const { enc, h, aliada, foes: [ogro] } = montar(heroi('ladino', 13, 'batedor'));
  assert.equal(enc.speedOf(h), 40);
  assert.ok(Sub.vantagemNaIniciativa(enc, 'party'));
  d20s(enc, [19]);
  enc.resolveAttack(h, ogro);
  assert.ok(hasCondition(ogro, 'expostoNaEmboscada'));
  assert.ok(enc.attackModifiers(aliada, ogro).vantagens.includes('Mestre da Emboscada'));
});

await teste('Golpe Súbito: depois de atacar, um ataque de ação bônus, e o Furtivo vale de novo contra outro alvo', () => {
  const { enc, h, foes: [ogro, gob] } = montar(heroi('ladino', 17, 'batedor'), { foes: [['ogro', { x: 6, y: 5 }], ['goblin', { x: 4, y: 5 }]] });
  h.sneakUsedThisTurn = true; h.furtivoEm = ogro.id; h.golpeSubito = true;
  assert.ok(enc.sneakApplies(h, gob, WEAPONS.rapieira, { advantage: true, disadvantage: false }));
  assert.ok(!enc.sneakApplies(h, ogro, WEAPONS.rapieira, { advantage: true, disadvantage: false }), 'no mesmo alvo, não');
  h.golpeSubito = false; h.sneakUsedThisTurn = false;
  enc.attackAction(h, ogro);
  assert.ok(enc.useFeature(h, 'suddenStrike', { target: gob }));
  assert.ok(h.bonusUsed);
});

await teste('Inquisitivo: o Combate Perspicaz libera o Furtivo contra quem ele leu; no 17º, o Olho para Fraquezas soma 3d6', () => {
  const { enc, h, aliada, foes: [ogro] } = montar(heroi('ladino', 17, 'inquisitivo'));
  aliada.pos = { x: 15, y: 15, f: 1 };
  assert.ok(!enc.sneakApplies(h, ogro, WEAPONS.rapieira, neutro));
  d20s(enc, [20, 1]);
  assert.ok(enc.useFeature(h, 'insightfulFighting', { target: ogro }));
  assert.ok(enc.sneakApplies(h, ogro, WEAPONS.rapieira, neutro));
  assert.equal(Sub.dadosDoFurtivo(h, ogro, '9d6'), '12d6');
});

await teste('Mentor: ajudar como ação bônus dá vantagem ao próximo ataque de um aliado; a Desorientação passa o ataque para quem está na frente', () => {
  const { enc, h, aliada, foes: [ogro] } = montar(heroi('ladino', 3, 'mentor'));
  assert.ok(enc.useFeature(h, 'masterOfTactics', { target: ogro }));
  assert.ok(enc.attackModifiers(aliada, ogro).vantagens.some((v) => /ajuda/.test(v)));
  assert.ok(hasCondition(ogro, 'ajudaDoMentor'), 'a prévia não gasta a ajuda');
  enc.resolveAttack(aliada, ogro);
  assert.ok(!hasCondition(ogro, 'ajudaDoMentor'), 'o ataque de verdade gasta');
  const m = montar(heroi('ladino', 13, 'mentor'), { foes: [['ogro', { x: 6, y: 5 }], ['goblin', { x: 8, y: 5 }]] });
  m.foes[0].hp = m.foes[0].maxHp = 300;
  m.enc.resolveAttack(m.foes[1], m.h, { weaponId: m.foes[1].attacks.find((a) => a.ranged)?.name });
  assert.match(m.texto(), /Desorientação/);
});

// ------------------------------------------------------------------ monge

const golpesDe = (texto, nome) => (texto().match(new RegExp(`${nome} (acerta|erra) [A-ZÁÉÍÓÚ]`, 'g')) ?? []).length;

await teste('Mestre Bêbado: a Rajada dá Desengajar e +3 m; levantar custa 1,5 m; o golpe que erra o monge acerta o goblin colado nele', () => {
  const { enc, h, foes: [ogro] } = montar(heroi('monge', 6, 'mestreBebado'), { foes: [['ogro', { x: 6, y: 5 }], ['goblin', { x: 4, y: 5 }]] });
  ogro.hp = ogro.maxHp = 300;
  assert.ok(h.skills.includes('atuacao'));
  enc.attackAction(h, ogro, 'punhos');
  const passo = h.movementLeftFt;
  assert.ok(enc.useFeature(h, 'flurryOfBlows', { target: ogro }));
  assert.ok(h.disengaging && h.movementLeftFt === passo + 10);
  addCondition(h, 'caido');
  h.movementLeftFt = 30;
  assert.ok(enc.standUp(h).ok !== false && h.movementLeftFt === 25, 'levantar custou 1,5 m');
  const b = montar(heroi('monge', 6, 'mestreBebado'), { foes: [['ogro', { x: 6, y: 5 }], ['goblin', { x: 4, y: 5 }]] });
  const gob = b.foes[1];
  const hpG = gob.hp; const ki = b.h.resources.ki;
  d20s(b.enc, [1]);
  b.enc.resolveAttack(b.foes[0], b.h);
  assert.ok(gob.hp < hpG || gob.dead, 'o goblin levou o golpe');
  assert.equal(b.h.resources.ki, ki - 1);
});

await teste('Mestre Bêbado: a Sorte do Bêbado tira a desvantagem por 2 de ki; no 17º, a Rajada bate em cada inimigo colado', () => {
  const { enc, h, texto } = montar(heroi('monge', 11, 'mestreBebado'));
  const ki = h.resources.ki;
  enc.resistencia(h, 'dex', 15, { desvantagem: true });
  assert.equal(h.resources.ki, ki - 2);
  assert.match(texto(), /Sorte do Bêbado/);
  const b = montar(heroi('monge', 17, 'mestreBebado'), { foes: [['ogro', { x: 6, y: 5 }], ['ogro', { x: 4, y: 5 }], ['ogro', { x: 5, y: 4 }]] });
  for (const o of b.foes) o.hp = o.maxHp = 300;
  b.enc.attackAction(b.h, b.foes[0], 'punhos');
  const antes = golpesDe(b.texto, b.h.name);
  b.enc.useFeature(b.h, 'flurryOfBlows', { target: b.foes[0] });
  assert.equal(golpesDe(b.texto, b.h.name) - antes, 3, 'um golpe em cada um dos três');
});

await teste('Kensei: as armas kensei são de monge e treinadas; o Aparo Ágil dá +2 de CA; o Tiro do Kensei soma 1d4 à distância', () => {
  // criado com o arco, para vir com as flechas; a espada longa vai para a mão
  const h = heroi('monge', 3, 'kensei', {}, { arma: 'arcoLongo' });
  h.weapons.push('espadaLonga');
  h.equippedWeapon = 'espadaLonga';
  assert.deepEqual(h.armasKensei, ['espadaLonga', 'arcoLongo']);
  assert.ok(h.weaponTraining.includes('espadaLonga') && h.weaponTraining.includes('arcoLongo'));
  const { enc, foes: [ogro], texto } = montar(h);
  assert.ok(enc.artesMarciais(h, 'espadaLonga', WEAPONS.espadaLonga) && enc.artesMarciais(h, 'arcoLongo', WEAPONS.arcoLongo));
  const ca = caEfetiva(h);
  d20s(enc, [19]);
  enc.resolveAttack(h, ogro, { weaponId: 'punhos' });
  assert.equal(caEfetiva(h), ca + 2);
  novoTurno(h);
  h.equippedWeapon = 'arcoLongo';
  assert.ok(enc.useFeature(h, 'kenseisShot'));
  d20s(enc, [19, 19]); // o arco colado no ogro atira com desvantagem
  enc.resolveAttack(h, ogro, { weaponId: 'arcoLongo' });
  assert.match(texto(), /Tiro do Kensei: \+\d/);
});

await teste('Kensei: a arma kensei é mágica no 6º, o Golpe Hábil gasta ki; no 11º, Afiar a Lâmina; no 17º, a Precisão Infalível', () => {
  const { enc, h, foes: [ogro], texto } = montar(heroi('monge', 11, 'kensei', {}, { arma: 'espadaLonga' }));
  ogro.resistNaoMagico = ['cortante'];
  ogro.hp = ogro.maxHp = 300;
  enc.useFeature(h, 'oneWithTheBlade', { modo: 'ligar' });
  const ki = h.resources.ki;
  const hp = ogro.hp;
  d20s(enc, [19]);
  const r = enc.resolveAttack(h, ogro);
  assert.match(texto(), /Golpe Hábil/);
  assert.equal(h.resources.ki, ki - 1);
  assert.ok(hp - ogro.hp >= r.damage, 'a resistência a golpe não mágico não valeu');
  const antes = enc.canAttack(h, ogro).profile.bonus;
  novoTurno(h);
  assert.ok(enc.useFeature(h, 'sharpenTheBlade', { modo: '2' }));
  assert.equal(enc.canAttack(h, ogro).profile.bonus, antes + 2);
  const m = montar(heroi('monge', 17, 'kensei', {}, { arma: 'espadaLonga' }));
  d20s(m.enc, [1, 19]);
  assert.ok(m.enc.resolveAttack(m.h, m.foes[0]).hit);
  assert.match(m.texto(), /Precisão Infalível/);
});

await teste('Alma Solar: o Raio de Sol é radiante, de Destreza, e depois dele 1 ki solta mais dois; o Arco Abrasador sai depois de atacar', () => {
  const { enc, h, foes: [ogro], texto } = montar(heroi('monge', 6, 'almaSolar'), { foes: [['ogro', { x: 9, y: 5 }]] });
  ogro.hp = ogro.maxHp = 300;
  assert.ok(h.weapons.includes('raioSolar'));
  const perfil = enc.canAttack(h, ogro, 'raioSolar').profile;
  assert.equal(perfil.type, 'radiante');
  assert.ok(!enc.canCast(h, 'arcoAbrasador', { point: ogro.pos }).ok, 'antes de atacar, não');
  enc.attackAction(h, ogro, 'raioSolar');
  const ki = h.resources.ki;
  const antes = golpesDe(texto, h.name);
  assert.ok(enc.useFeature(h, 'radiantSunBolt', { target: ogro }));
  assert.equal(golpesDe(texto, h.name) - antes, 2);
  assert.equal(h.resources.ki, ki - 1);
  const b = montar(heroi('monge', 6, 'almaSolar'));
  b.enc.attackAction(b.h, b.foes[0]);
  const ki2 = b.h.resources.ki;
  assert.ok(b.enc.castSpell(b.h, 'arcoAbrasador', { point: b.foes[0].pos }).ok);
  assert.equal(b.h.resources.ki, ki2 - 2);
});

await teste('Alma Solar: a Explosão Solar Abrasadora soma 2d6 por ki; no 17º, a luz acesa queima quem acerta de perto', () => {
  const { enc, h, foes: [ogro] } = montar(heroi('monge', 11, 'almaSolar'), { foes: [['ogro', { x: 12, y: 5 }]] });
  assert.ok(magiasProntas(h).includes('explosaoSolarAbrasadora'));
  const ki = h.resources.ki;
  assert.ok(enc.castSpell(h, 'explosaoSolarAbrasadora', { point: ogro.pos, opcao: '2' }).ok);
  assert.equal(h.resources.ki, ki - 2);
  assert.equal(SPELLS.explosaoSolarAbrasadora.damage, '2d6', 'a magia volta ao normal');
  const s = montar(heroi('monge', 17, 'almaSolar'));
  assert.ok(s.h.luzPropria);
  const hp = s.foes[0].hp;
  d20s(s.enc, [19]);
  s.enc.resolveAttack(s.foes[0], s.h);
  assert.equal(hp - s.foes[0].hp, 5 + abilityMod(s.h.abilities.wis));
});

// ------------------------------------------------------------------ paladino

await teste('Conquista: a Presença Conquistadora amedronta; na Aura de Conquista, o amedrontado fica parado e leva psíquico', () => {
  const { enc, h, foes: [ogro] } = montar(heroi('paladino', 7, 'conquista'));
  assert.ok(h.features.includes('guidedStrike'));
  d20s(enc, [1]);
  assert.ok(enc.useFeature(h, 'conqueringPresence'));
  assert.ok(getCondition(ogro, 'amedrontado')?.source === h.id);
  assert.equal(h.resources.channelDivinity, 0);
  assert.equal(enc.speedOf(ogro), 0);
  const hp = ogro.hp;
  Sub.auraDeConquistaNoInicio(enc, 'foes');
  assert.equal(hp - ogro.hp, 3);
  assert.ok(h.spellcasting.sempreProntas.includes('armaduraDeAgathys'));
});

await teste('Conquista: a Repreensão Desdenhosa fere quem acerta; o Conquistador Invencível resiste, ataca uma vez mais e critica com 19', () => {
  const { enc, h, foes: [ogro] } = montar(heroi('paladino', 20, 'conquista'));
  ogro.hp = ogro.maxHp = 300;
  const hp = ogro.hp;
  d20s(enc, [19]);
  enc.resolveAttack(ogro, h);
  assert.equal(hp - ogro.hp, abilityMod(h.abilities.cha));
  novoTurno(h);
  assert.ok(enc.useFeature(h, 'invincibleConqueror'));
  assert.equal(enc.golpesDoAtaque(h, h.equippedWeapon).length, 1 + h.ataquesExtras + 1);
  assert.equal(margemDeCritico(h), 19);
  assert.equal(enc.danoPorTipo(h, 10, 'psíquico'), 5);
});

await teste('Redenção: o Emissário da Paz dá +5 na Persuasão; Repreender os Violentos devolve o golpe; a Aura do Guardião toma o golpe que derrubaria', () => {
  const { enc, h, aliada, foes: [ogro], texto } = montar(heroi('paladino', 7, 'redencao'));
  const p = skillBonus(h, 'persuasao');
  assert.ok(enc.useFeature(h, 'emissaryOfPeace'));
  assert.equal(skillBonus(h, 'persuasao'), p + 5);
  const b = montar(heroi('paladino', 3, 'redencao'));
  b.foes[0].hp = b.foes[0].maxHp = 300;
  const hpO = b.foes[0].hp;
  d20s(b.enc, [1]);
  b.enc.applyDamage(b.aliada, 12, 'concussão', b.foes[0], { deArma: true });
  assert.equal(hpO - b.foes[0].hp, 12, 'a repreensão: o mesmo dano em radiante');
  assert.match(b.texto(), /Repreender os Violentos/);
  aliada.hp = 5;
  const hpP = h.hp;
  enc.applyDamage(aliada, 10, 'concussão', ogro, { deArma: true });
  assert.equal(aliada.hp, 5);
  assert.equal(hpP - h.hp, 10);
  assert.match(texto(), /Aura do Guardião/);
});

await teste('Redenção: o Espírito Protetor cura no fim do turno; o Emissário da Redenção resiste e devolve, menos contra quem ele feriu', () => {
  const { enc, h } = montar(heroi('paladino', 15, 'redencao'));
  h.hp = Math.floor(h.maxHp / 2) - 5;
  const hp = h.hp;
  Sub.fimDoLadoDosLivros(enc, 'party');
  assert.ok(h.hp > hp);
  const e = montar(heroi('paladino', 20, 'redencao'));
  const [ogro] = e.foes;
  ogro.hp = ogro.maxHp = 300;
  const hpH = e.h.hp; const hpO = ogro.hp;
  e.enc.applyDamage(e.h, 10, 'cortante', ogro, { deArma: true });
  assert.equal(hpH - e.h.hp, 5);
  assert.equal(hpO - ogro.hp, 2, 'metade do que ele levou, em radiante');
  e.enc.applyDamage(ogro, 1, 'cortante', e.h, { deArma: true });
  const hp2 = e.h.hp;
  e.enc.applyDamage(e.h, 10, 'cortante', ogro, { deArma: true });
  assert.equal(hp2 - e.h.hp, 10, 'contra quem ele feriu, nada');
});

// ------------------------------------------------------------------ patrulheiro

await teste('Perseguidor Sombrio: SAB na iniciativa, +3 m e um ataque a mais com 1d8 na 1ª rodada, visão no escuro, e some no breu', () => {
  const { enc, h, foes: [ogro], texto } = montar(heroi('patrulheiro', 3, 'perseguidorSombrio'));
  ogro.hp = ogro.maxHp = 300;
  assert.equal(bonusDeIniciativa(h), abilityMod(h.abilities.dex) + abilityMod(h.abilities.wis));
  assert.equal(enc.speedOf(h), 40);
  d20s(enc, [19, 19]);
  enc.attackAction(h, ogro);
  assert.match(texto(), /Emboscador Temível: \+\d/);
  assert.equal(visaoNoEscuro(h), 60);
  enc.field.luz = new Array(enc.field.w * enc.field.h).fill(0);
  ogro.senses = { darkvisionFt: 60 };
  assert.ok(!podeVer(enc, ogro, h), 'no breu, a visão no escuro não o acha');
  assert.ok(podeVer(enc, h, ogro));
  enc.round = 2;
  assert.equal(enc.speedOf(h), 30);
});

await teste('Perseguidor Sombrio: a Mente de Ferro, a Rajada do Perseguidor (o erro vira outro ataque) e a Esquiva Sombria', () => {
  assert.ok(heroi('patrulheiro', 7, 'perseguidorSombrio').saves.includes('wis'));
  const { enc, h, foes: [ogro], texto } = montar(heroi('patrulheiro', 11, 'perseguidorSombrio'));
  ogro.hp = ogro.maxHp = 300;
  enc.round = 2;
  d20s(enc, [1, 19, 19]);
  enc.attackAction(h, ogro);
  assert.equal(golpesDe(texto, h.name), 3, 'os dois do Ataque Extra e o do erro');
  const e = montar(heroi('patrulheiro', 15, 'perseguidorSombrio'));
  const r = e.enc.resolveAttack(e.foes[0], e.h);
  assert.equal(r.modo, 'desvantagem');
  assert.ok(e.h.reactionUsed);
});

await teste('Andarilho do Horizonte: o Guerreiro Planar vira o golpe em energético e soma 1d8; o Passo Etéreo acaba no fim do turno', () => {
  const { enc, h, foes: [ogro], texto } = montar(heroi('patrulheiro', 7, 'andarilhoDoHorizonte'));
  ogro.resist = ['cortante'];
  assert.ok(enc.useFeature(h, 'planarWarrior', { target: ogro }));
  d20s(enc, [19]);
  enc.resolveAttack(h, ogro);
  assert.match(texto(), /Guerreiro Planar: \+\d+ de energético/);
  assert.doesNotMatch(texto(), /resistente a cortante/, 'o golpe virou energético');
  novoTurno(h);
  assert.ok(enc.useFeature(h, 'etherealStep'));
  assert.ok(hasCondition(h, 'etereo'));
  Sub.fimDoLadoDosLivros(enc, 'party');
  assert.ok(!hasCondition(h, 'etereo'));
});

await teste('Andarilho do Horizonte: o Golpe Distante salta para o lado do alvo e, com dois alvos, dá um terceiro ataque; a Defesa Espectral', () => {
  // o ogro é Grande (as casas 7-8 x 5-6): o goblin fica do outro lado, ao alcance do salto
  const { enc, h, foes: [ogro, gob] } = montar(heroi('patrulheiro', 11, 'andarilhoDoHorizonte'), { foes: [['ogro', { x: 7, y: 5 }], ['goblin', { x: 5, y: 2 }]] });
  ogro.hp = ogro.maxHp = 300; gob.hp = gob.maxHp = 300;
  assert.ok(enc.useFeature(h, 'distantStrike', { target: ogro }));
  assert.ok(distanceFt(h.pos, ogro.pos) <= 5);
  const resto = h.ataquesRestantes;
  assert.ok(enc.useFeature(h, 'distantStrike', { target: gob }));
  assert.equal(h.ataquesRestantes, resto - 1 + 1, 'o terceiro ataque entrou');
  const e = montar(heroi('patrulheiro', 15, 'andarilhoDoHorizonte'));
  const hp = e.h.hp;
  d20s(e.enc, [19]);
  const r = e.enc.resolveAttack(e.foes[0], e.h);
  if (r.damage >= 10) assert.equal(hp - e.h.hp, Math.floor(r.damage / 2));
  assert.ok(r.damage < 10 || e.h.reactionUsed);
});

await teste('Matador de Monstros: o Sentido do Caçador, a Presa (1d6 por turno), a Defesa Sobrenatural, o Nêmesis e o Contra-Ataque', () => {
  const { enc, h, foes: [ogro], texto } = montar(heroi('patrulheiro', 15, 'matadorDeMonstros'));
  ogro.hp = ogro.maxHp = 300;
  ogro.resist = ['frio'];
  assert.ok(enc.useFeature(h, 'huntersSense', { target: ogro }));
  assert.match(texto(), /resiste a: frio/);
  assert.ok(enc.useFeature(h, 'slayersPrey', { target: ogro }));
  d20s(enc, [19, 19]);
  enc.resolveAttack(h, ogro);
  enc.resolveAttack(h, ogro);
  assert.equal((texto().match(/Presa do Matador: \+\d/g) ?? []).length, 1);
  const r = enc.resistencia(h, 'wis', 30, { contra: { conjurador: ogro } });
  d20s(enc, []);
  assert.ok(r.success || r.partes.some((x) => x.rotulo === 'Defesa Sobrenatural'));
  const n = montar(heroi('patrulheiro', 11, 'matadorDeMonstros'));
  d20s(n.enc, [1]);
  assert.ok(n.enc.tentarContramagia(n.foes[0], SPELLS.comando, 1), 'o Nêmesis corta a magia');
  assert.equal(n.h.resources.magicUsersNemesis, 0);
  const c = montar(heroi('patrulheiro', 15, 'matadorDeMonstros'));
  c.enc.useFeature(c.h, 'slayersPrey', { target: c.foes[0] });
  c.foes[0].hp = c.foes[0].maxHp = 300;
  d20s(c.enc, [19]);
  assert.ok(c.enc.resistencia(c.h, 'con', 40, { contra: { conjurador: c.foes[0] } }).success, 'acertou a presa antes: passa sozinho');
});

// ------------------------------------------------------------------ druida

/** Os próximos dados de `lados` faces saem destes valores. */
function dados(enc, lados, valores) {
  const orig = enc.rng.die;
  const fila = [...valores];
  enc.rng.die = (l) => (l === lados && fila.length ? fila.shift() : orig(l));
}

await teste('Círculo dos Sonhos: o Bálsamo cura e dá PV temporários, gastando até metade do nível; os Caminhos Ocultos teleportam', () => {
  const { enc, h, aliada, foes: [ogro] } = montar(heroi('druida', 10, 'sonhos'));
  aliada.hp -= 20;
  const hp = aliada.hp; const reserva = h.resources.balmOfTheSummerCourt;
  assert.ok(enc.useFeature(h, 'balmOfTheSummerCourt', { target: aliada }));
  assert.ok(aliada.hp > hp && aliada.tempHp >= 1);
  assert.ok(reserva - h.resources.balmOfTheSummerCourt <= 5 && h.bonusUsed);
  novoTurno(h);
  assert.ok(magiasProntas(h).includes('caminhosOcultos'));
  const usos = h.resources.hiddenPaths;
  assert.ok(enc.castSpell(h, 'caminhosOcultos', { point: { x: 5, y: 15 } }).ok);
  assert.deepEqual([h.pos.x, h.pos.y], [5, 15]);
  assert.equal(h.resources.hiddenPaths, usos - 1);
  assert.ok(ogro);
});

await teste('Círculo do Pastor: o urso dá PV temporários e Força; o falcão, vantagem no ataque do aliado; o unicórnio espalha a cura', () => {
  const a = montar(heroi('druida', 2, 'pastor'));
  assert.ok(a.enc.useFeature(a.h, 'spiritTotem', { modo: 'urso' }));
  assert.equal(a.aliada.tempHp, 5 + 2);
  assert.equal(a.enc.resistencia(a.aliada, 'str', 30).mode, 'vantagem');
  const b = montar(heroi('druida', 2, 'pastor'));
  b.enc.useFeature(b.h, 'spiritTotem', { modo: 'falcao' });
  const r = b.enc.resolveAttack(b.aliada, b.foes[0]);
  assert.equal(r.modo, 'vantagem');
  assert.ok(b.h.reactionUsed);
  const c = montar(heroi('druida', 2, 'pastor'));
  c.h.spellcasting.prepared.push('curarFerimentos');
  c.enc.useFeature(c.h, 'spiritTotem', { modo: 'unicornio' });
  novoTurno(c.h);
  c.h.hp -= 5;
  const hp = c.h.hp;
  assert.ok(c.enc.castSpell(c.h, 'curarFerimentos', { target: c.aliada }).ok);
  assert.equal(c.h.hp, hp + 2, 'o druida, na aura, recupera o nível');
  recuperarNoCurto(c.h);
  assert.equal(c.h.resources.spiritTotem, 1);
});

await teste('Pastor: o Invocador Poderoso engorda as feras invocadas; o Espírito Guardião as cura; a Invocação Fiel chega quando ele cai', () => {
  const { enc, h } = montar(heroi('druida', 14, 'pastor'));
  const lobo = enc.invocar(h, 'lobo', { x: 8, y: 8 }, { spellId: 'conjurarAnimais' });
  const base = makeMonster('lobo', { x: 1, y: 1 }).maxHp;
  assert.equal(lobo.maxHp, base + 4, '2 PV por dado de vida (2d8)');
  assert.ok(lobo.golpesMagicos);
  lobo.pos = { x: 5, y: 7, f: 1 };
  enc.useFeature(h, 'spiritTotem', { modo: 'urso' });
  lobo.hp -= 10;
  const hp = lobo.hp;
  Sub.fimDoLadoDosLivros(enc, 'party');
  assert.equal(lobo.hp, hp + 7, 'metade do nível');
  enc.applyDamage(h, h.hp + (h.tempHp ?? 0), 'psíquico', enc.combatants.find((c) => c.side === 'foes'));
  assert.equal(enc.combatants.filter((c) => c.invocado?.spellId === 'invocacaoFiel').length, 4);
});

// ------------------------------------------------------------------ feiticeiro

await teste('Alma Divina: a lista do clérigo entra na escolha, a afinidade dá a magia, e o Favorecido pelos Deuses soma 2d4', () => {
  assert.ok(listaDaClasse('feiticeiro', 1, 'almaDivina').magias.includes('curarFerimentos'));
  assert.ok(!listaDaClasse('feiticeiro', 1).magias.includes('curarFerimentos'));
  const h = heroi('feiticeiro', 1, 'almaDivina', { divineMagic: 'caos' });
  assert.ok(h.spellcasting.sempreProntas.includes('perdicao'));
  const { enc, texto } = montar(h);
  d20s(enc, [5]);
  enc.resistencia(h, 'wis', 12);
  assert.equal(h.resources.favoredByTheGods, 0);
  assert.match(texto(), /Favorecido pelos Deuses/);
});

await teste('Alma Divina: a Cura Fortalecida rola de novo os dados baixos; as Asas dão voo; a Recuperação Sobrenatural cura metade', () => {
  const h = heroi('feiticeiro', 18, 'almaDivina');
  h.spellcasting.prepared.push('curarFerimentos');
  const { enc, aliada } = montar(h);
  aliada.hp = 1;
  const pontos = h.resources.sorceryPoints;
  dados(enc, 8, [1, 8]);
  assert.ok(enc.castSpell(h, 'curarFerimentos', { target: aliada }).ok);
  assert.equal(h.resources.sorceryPoints, pontos - 1);
  assert.equal(aliada.hp, 1 + 8 + abilityMod(h.abilities.cha));
  novoTurno(h);
  assert.ok(enc.useFeature(h, 'otherworldlyWings'));
  assert.ok(enc.voaAgora(h));
  novoTurno(h);
  h.hp = 10;
  assert.ok(enc.useFeature(h, 'unearthlyRecovery'));
  assert.equal(h.hp, 10 + Math.floor(h.maxHp / 2));
});

await teste('Magia das Sombras: visão de 36 m, a Escuridão por pontos, e a Força do Túmulo segura a 1 PV (menos contra radiante)', () => {
  const h = heroi('feiticeiro', 3, 'magiaDasSombras');
  assert.equal(visaoNoEscuro(h), 120);
  assert.ok(h.spellcasting.sempreProntas.includes('escuridao'));
  h.spellcasting.slots = h.spellcasting.slots.map(() => 0);
  assert.equal(usoLivreDe(h, SPELLS.escuridao)?.custo, 2);
  const { enc, foes: [ogro] } = montar(heroi('feiticeiro', 3, 'magiaDasSombras'));
  const t = enc.combatants.find((c) => c.classe === 'feiticeiro');
  t.hp = 3; // a CD é 5 + o dano: com a vida cheia nem um 20 passaria
  d20s(enc, [20]);
  enc.applyDamage(t, t.hp + 2, 'cortante', ogro);
  assert.equal(t.hp, 1);
  assert.equal(t.resources.strengthOfTheGrave, 0);
  const r = montar(heroi('feiticeiro', 3, 'magiaDasSombras'));
  r.enc.applyDamage(r.h, r.h.hp + 2, 'radiante', r.foes[0]);
  assert.ok(hasCondition(r.h, 'inconsciente'));
});

await teste('Magia das Sombras: o Cão do Mau Agouro caça o alvo e o deixa mal contra as magias; a Forma Umbral resiste, menos a radiante', () => {
  // o goblin longe segura a luta aberta: com o ogro morto ela acabaria, e os invocados sairiam junto
  const { enc, h, foes: [ogro] } = montar(heroi('feiticeiro', 18, 'magiaDasSombras'), { foes: [['ogro', { x: 6, y: 5 }], ['goblin', { x: 18, y: 18 }]] });
  const pontos = h.resources.sorceryPoints;
  assert.ok(enc.useFeature(h, 'houndOfIllOmen', { target: ogro }));
  const cao = enc.combatants.find((c) => c.name === 'Cão do Mau Agouro');
  assert.ok(cao && cao.side === 'party' && cao.alvoPreferido === ogro.id);
  assert.equal(h.resources.sorceryPoints, pontos - 3);
  cao.pos = { x: 7, y: 5, f: 1 };
  assert.equal(enc.resistencia(ogro, 'wis', 15, { contra: { magico: true, conjurador: h } }).mode, 'desvantagem');
  enc.applyDamage(ogro, 999, 'psíquico', h);
  assert.ok(cao.dead, 'o cão some com o alvo');
  novoTurno(h);
  assert.ok(enc.useFeature(h, 'umbralForm'));
  assert.equal(enc.danoPorTipo(h, 10, 'cortante'), 5);
  assert.equal(enc.danoPorTipo(h, 10, 'radiante'), 10);
  assert.ok(!enc.canCast(h, 'passoDasSombrasDaFeiticaria', { point: { x: 5, y: 12 } }).ok, 'no claro, não há sombra para o passo');
});

await teste('Feitiçaria da Tempestade: depois da magia, o salto de 3 m; o Coração da Tempestade; a Fúria; a Alma do Vento voa e é imune', () => {
  const h = heroi('feiticeiro', 14, 'tempestade');
  h.spellcasting.prepared.push('ondaTrovejante');
  const { enc, foes: [ogro], texto } = montar(h);
  ogro.hp = ogro.maxHp = 300;
  assert.ok(!enc.canCast(h, 'saltoDaTempestade', { point: { x: 5, y: 3 } }).ok);
  const hp = ogro.hp;
  assert.ok(enc.castSpell(h, 'ondaTrovejante', { point: { x: 6, y: 5 } }).ok);
  assert.match(texto(), /Coração da Tempestade/);
  assert.ok(hp - ogro.hp >= 7);
  assert.ok(enc.canCast(h, 'saltoDaTempestade', { point: { x: 5, y: 3 } }).ok);
  assert.equal(enc.danoPorTipo(h, 10, 'elétrico'), 5);
  // a onda empurrou o ogro: ele volta para o lado; e a reação fica para a Fúria (sem o Escudo Arcano)
  ogro.pos = { ...ogro.pos, x: 6, y: 5 };
  h.reactionUsed = false;
  h.spellcasting.prepared = h.spellcasting.prepared.filter((id) => SPELLS[id]?.kind !== 'reacao');
  const hp2 = ogro.hp;
  d20s(enc, [19, 20]);
  enc.resolveAttack(ogro, h);
  assert.ok(hp2 - ogro.hp >= 14, 'a Fúria da Tempestade');
  const v = heroi('feiticeiro', 18, 'tempestade');
  const m = montar(v);
  assert.equal(m.enc.danoPorTipo(v, 10, 'trovejante'), 0);
  assert.ok(m.enc.voaAgora(v));
});

// ------------------------------------------------------------------ bruxo

await teste('O Celestial: Chama Sagrada e Luz de graça, a Luz Curativa, a Alma Radiante, e a Resiliência Celestial no descanso', () => {
  const h = heroi('bruxo', 10, 'celestial');
  assert.ok(h.spellcasting.sempreProntas.includes('chamaSagrada') && h.spellcasting.sempreProntas.includes('luz'));
  assert.ok(listaDaClasse('bruxo', 1, 'celestial').magias.includes('curarFerimentos'));
  const { enc, aliada } = montar(h);
  aliada.hp -= 15;
  const hp = aliada.hp; const reserva = h.resources.healingLight;
  assert.ok(enc.useFeature(h, 'healingLight', { target: aliada }));
  assert.ok(aliada.hp > hp && h.resources.healingLight < reserva);
  assert.equal(enc.danoPorTipo(h, 10, 'radiante'), 5);
  h.tempHp = 0;
  descansoLongo(h);
  assert.equal(h.tempHp, 10 + abilityMod(h.abilities.cha));
});

await teste('O Celestial: a Vingança Abrasadora levanta o bruxo no lugar do teste contra a morte, e cega e queima quem está perto', () => {
  const { enc, h, foes: [ogro] } = montar(heroi('bruxo', 14, 'celestial'));
  ogro.hp = ogro.maxHp = 300;
  enc.applyDamage(h, h.hp, 'psíquico', ogro);
  assert.ok(hasCondition(h, 'inconsciente'));
  const hp = ogro.hp;
  enc.beginSide('party');
  assert.equal(h.hp, Math.floor(h.maxHp / 2));
  assert.ok(!hasCondition(h, 'inconsciente') && !hasCondition(h, 'caido'));
  assert.ok(ogro.hp < hp && hasCondition(ogro, 'cego'));
});

await teste('O Lâmina Maldita: Carisma na arma, a maldição (dano e crítico com 19), a cura quando o amaldiçoado morre, e o espectro', () => {
  const h = heroi('bruxo', 6, 'laminaMaldita');
  assert.equal(weaponAbility(h, WEAPONS.espadaLonga), 'cha');
  assert.ok(h.armorTraining.includes('média') && h.weaponTraining.includes('marcial'));
  const { enc, foes: [ogro], texto } = montar(h);
  ogro.hp = ogro.maxHp = 300;
  assert.ok(enc.useFeature(h, 'hexbladesCurse', { target: ogro }));
  d20s(enc, [19]);
  const r = enc.resolveAttack(h, ogro);
  assert.ok(r.critical, 'crítico com 19');
  assert.match(texto(), /Maldição do Lâmina Maldita: \+3/);
  h.hp -= 10;
  const hpH = h.hp;
  enc.applyDamage(ogro, 999, 'psíquico', h);
  assert.equal(h.hp, hpH + 6 + abilityMod(h.abilities.cha));
  assert.ok(enc.combatants.some((c) => c.defId === 'espectro' && c.invocado?.donoId === h.id && !c.dead), 'o ogro (humanoide no jogo) levanta como espectro');
});

await teste('O Lâmina Maldita: a Armadura de Maldições faz o golpe do amaldiçoado errar com 4 ou mais; o Mestre das Maldições passa a maldição', () => {
  const { enc, h, foes: [ogro] } = montar(heroi('bruxo', 14, 'laminaMaldita'), { foes: [['ogro', { x: 6, y: 5 }], ['goblin', { x: 6, y: 7 }]] });
  enc.useFeature(h, 'hexbladesCurse', { target: ogro });
  d20s(enc, [19]);
  dados(enc, 6, [5]);
  const r = enc.resolveAttack(ogro, h);
  assert.ok(!r.hit && h.reactionUsed);
  enc.applyDamage(ogro, 999, 'psíquico', h);
  assert.ok(hasCondition(enc.combatants.find((c) => c.defId === 'goblin'), 'maldicaoDoLamina'));
});

// ------------------------------------------------------------------ mago

await teste('Magia de Guerra: INT na iniciativa; a Deflexão Arcana faz errar o golpe e depois só truques; a Mortalha fere em volta', () => {
  const h = heroi('mago', 14, 'magiaDeGuerra');
  assert.equal(bonusDeIniciativa(h), abilityMod(h.abilities.dex) + abilityMod(h.abilities.int));
  const { enc, foes: [ogro], texto } = montar(h);
  ogro.hp = ogro.maxHp = 300;
  const ca = caEfetiva(h);
  d20s(enc, [ca - 6]);
  const r = enc.resolveAttack(ogro, h);
  assert.ok(!r.hit && h.reactionUsed, 'os +2 fizeram errar');
  assert.ok(hasCondition(h, 'deflexaoArcana'));
  assert.ok(!enc.canCast(h, 'escudoArcano', {}).ok || !enc.canCast(h, 'ondaTrovejante', {}).ok);
  assert.match(texto(), /Mortalha Defletora/);
});

await teste('Magia de Guerra: o Surto de Poder soma energético no dano de magia, uma vez por turno; concentrado, a Magia Durável dá +2', () => {
  const { enc, h, foes: [ogro], texto } = montar(heroi('mago', 10, 'magiaDeGuerra'));
  ogro.hp = ogro.maxHp = 300;
  h.spellcasting.cantrips = ['raioDeFogo'];
  const surtos = h.resources.powerSurge;
  d20s(enc, [19, 19]);
  enc.castSpell(h, 'raioDeFogo', { target: ogro });
  assert.match(texto(), /Surto de Poder/);
  assert.equal(h.resources.powerSurge, surtos - 1);
  descansoLongo(h);
  assert.equal(h.resources.powerSurge, 1, 'o descanso longo deixa um surto');
  const ca = caEfetiva(h);
  h.concentrating = { spellId: 'x', condition: 'x', targets: [], rounds: 10 };
  assert.equal(caEfetiva(h), ca + 2);
});

// ---------------------------------------------------------------- os recursos que estavam sem efeito (2026-11-17)
await teste('Inquisitivo: o Ouvido para Mentiras faz do 7 na Intuição um 8; o Olhar Firme dá vantagem e +5 na passiva; o Olho para Detalhes acha o escondido', async () => {
  const { passivePerception } = await import(P + 'rules/abilities.js');
  const sem = heroi('ladino', 9);
  const h = heroi('ladino', 9, 'inquisitivo');
  assert.equal(passivePerception(h) - passivePerception(sem), 5, 'Olhar Firme: +5 na passiva');
  const { enc, foes: [gob] } = montar(h, { foes: [['goblin', { x: 9, y: 5 }]] });
  const die = enc.rng.die; enc.rng.die = (l) => (l === 20 ? 3 : die(l));
  const t = enc.testeDeAtributo(h, 'wis', skillBonus(h, 'intuicao'), 'Intuição', { pericia: 'intuicao' });
  assert.equal(t.natural, 8, 'o 3 virou 8');
  enc.rng.die = die;
  addCondition(gob, 'invisivel', { rounds: Infinity, data: { escondido: true, furtividade: 5 } });
  assert.ok(enc.useFeature(h, 'eyeForDetail'));
  assert.ok(!hasCondition(gob, 'invisivel'), 'achou o goblin escondido');
  assert.ok(h.bonusUsed);
});

await teste('Batedor: o Escaramuçador sai de perto, com a reação e sem ataque de oportunidade, quando o inimigo termina o turno colado e ele está ferido', () => {
  const h = heroi('ladino', 3, 'batedor');
  const { enc, foes: [ogro], texto } = montar(h);
  h.hp = Math.floor(h.maxHp / 3);
  const antes = { ...h.pos };
  const hpAntes = h.hp;
  enc.fimDoTurnoDoLado('party'); enc.beginSide('foes');
  enc.endTurn(ogro);
  // (a reação volta no começo do turno do grupo, que o fim do turno do ogro já abre: o registro é a prova de que ela saiu)
  assert.ok(/Escaramuçador/.test(texto()) && distanceFt(h.pos, ogro.pos) > 5, `${antes.x},${antes.y} -> ${h.pos.x},${h.pos.y}`);
  assert.equal(h.hp, hpAntes, 'sem ataque de oportunidade');
});

await teste('Sepultura: os Olhos da Sepultura acham os mortos-vivos a 18 m, e o escondido deixa de estar', () => {
  const h = heroi('clerigo', 1, 'sepultura');
  const { enc, foes: [z], texto } = montar(h, { foes: [['zumbi', { x: 12, y: 5 }]] });
  addCondition(z, 'invisivel', { rounds: Infinity, data: { escondido: true, furtividade: 30 } });
  assert.ok(h.resources.eyesOfTheGrave >= 1);
  assert.ok(enc.useFeature(h, 'eyesOfTheGrave'));
  assert.match(texto(), /Zumbi/);
  assert.ok(!hasCondition(z, 'invisivel'));
});

await teste('Guardião Ancestral: Consultar os Espíritos dá o Augúrio e a Clarividência fora da luta, sem espaço, uma vez por descanso', async () => {
  const { podeConjurarFora, magiasForaDoHeroi } = await import(P + 'rules/utilidade.js');
  const h = heroi('barbaro', 10, 'guardiaoAncestral');
  assert.ok(magiasForaDoHeroi(h).some((s) => s.id === 'augurio'));
  const p = podeConjurarFora(h, 'clarividencia');
  assert.ok(p.ok && p.item?.recurso === 'consultTheSpirits', JSON.stringify(p));
  h.resources.consultTheSpirits = 0;
  assert.equal(podeConjurarFora(h, 'augurio').ok, false);
});

await teste('Inquisitivo: o Olhar Infalível, no 13º, diz a 9 m quem engana os olhos, sem desfazer o engano', () => {
  const h = heroi('ladino', 13, 'inquisitivo');
  const { enc, foes: [gob], texto } = montar(h, { foes: [['goblin', { x: 8, y: 5 }]] });
  addCondition(gob, 'borrado', { rounds: 10 });
  assert.ok(h.resources.unerringEye >= 1);
  assert.ok(enc.useFeature(h, 'unerringEye'));
  assert.match(texto(), /engana os olhos/);
  assert.ok(hasCondition(gob, 'borrado'), 'a ilusão continua');
  assert.ok(!heroi('ladino', 12, 'inquisitivo').resources.unerringEye);
});

await teste('Andarilho do Horizonte: o Detectar Portal diz a distância e a direção do portal mais perto, uma vez por descanso curto', () => {
  const h = heroi('patrulheiro', 3, 'andarilhoDoHorizonte');
  const { enc, texto } = montar(h);
  enc.field.portais = [{ x: 5, y: 15, nome: 'o portal de teste' }, { x: 19, y: 19 }];
  assert.equal(h.resources.detectPortal, 1);
  assert.ok(enc.useFeature(h, 'detectPortal'));
  assert.match(texto(), /portal planar a 15 m, para o sul \(o portal de teste\)/, texto());
  novoTurno(h);
  assert.ok(!enc.useFeature(h, 'detectPortal'), 'uma vez por descanso');
});

await teste('Sonhos: o Andarilho dos Sonhos dá a Vidência sem espaço depois de um descanso curto, uma vez até o longo', async () => {
  const { podeConjurarFora, magiasForaDoHeroi } = await import(P + 'rules/utilidade.js');
  const { recuperarNoCurto } = await import(P + 'rules/descanso.js');
  const h = heroi('druida', 14, 'sonhos');
  h.spellcasting.prepared = (h.spellcasting.prepared ?? []).filter((id) => id !== 'videncia');
  assert.ok(!magiasForaDoHeroi(h).some((s) => s.id === 'videncia'), 'antes do descanso curto, não');
  recuperarNoCurto(h);
  assert.ok(magiasForaDoHeroi(h).some((s) => s.id === 'videncia'));
  const r = podeConjurarFora(h, 'videncia');
  assert.ok(r.ok && r.item?.recurso === 'walkerInDreams', JSON.stringify(r));
});

await teste('Pastor: a Fala dos Bosques vale como um Falar com Animais que nunca acaba; Zelote: o Guerreiro dos Deuses não deixa motivo', async () => {
  const { ativaDe, estadoDe } = await import(P + 'rules/utilidade.js');
  const h = heroi('druida', 2, 'pastor');
  const outro = heroi('guerreiro', 2);
  assert.ok(ativaDe(estadoDe({}), [outro, h], 'falarComAnimais'));
  assert.ok(!ativaDe(estadoDe({}), [outro], 'falarComAnimais'));
  assert.ok(!ativaDe(estadoDe({}), [outro, h], 'falarComAnimais', { por: outro }), 'é dele, não do grupo inteiro');
  assert.ok(!CARACTERISTICAS.warriorOfTheGods.semEfeito);
});

await teste('Mentor: o Manipulador Perspicaz mede a mente e a presença de quem conversa, fora da luta, uma vez por criatura', async () => {
  const { opcoesDoManipulador } = await import(P + 'game/investigar.js');
  const h = heroi('ladino', 9, 'mentor');
  const { enc, foes: [gob] } = montar(h, { foes: [['goblin', { x: 8, y: 5 }]] });
  gob.side = 'neutro';
  const app = { enc, root: null, refresh() {} };
  assert.deepEqual(opcoesDoManipulador(app, h, gob, { fora: false }), [], 'na luta, não');
  assert.deepEqual(opcoesDoManipulador(app, heroi('ladino', 9), gob, { fora: true }), [], 'só quem tem a característica');
  const ops = opcoesDoManipulador(app, h, gob, { fora: true });
  assert.equal(ops.length, 2);
  assert.ok(ops.every((o) => !o.motivo), JSON.stringify(ops.map((o) => o.motivo)));
});

console.log(`\n${total - falhas} de ${total} provas passaram`);
if (falhas) process.exit(1);
