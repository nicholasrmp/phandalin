// AS RAÇAS DOS OUTROS LIVROS no motor, sobre o Encounter de verdade (`rules/racas-livros.js`, `rules/racas-motor.js`):
// Volo, Mordenkainen, Costa da Espada, Fizban, Tasha e Acquisitions Inc.
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-racas-livros.mjs
//
// Cada prova foi escrita para FALHAR sem o código dela: nenhuma destas raças existia.
import assert from 'node:assert/strict';

const P = new URL('../', import.meta.url).href;
const { Encounter } = await import(P + 'rules/combat.js');
const { criarPersonagem } = await import(P + 'rules/progressao.js');
const { makeMonster } = await import(P + 'rules/monsters.js');
const { Battlefield } = await import(P + 'core/grid.js');
const { makeRng } = await import(P + 'core/rng.js');
const { hasCondition, addCondition } = await import(P + 'rules/conditions.js');
const { CARACTERISTICAS } = await import(P + 'rules/classes/index.js');
const { estadoDaCaracteristica } = await import(P + 'rules/classes/caracteristicas.js');
const { RACAS_DOS_LIVROS, TRACOS_DOS_LIVROS } = await import(P + 'rules/racas-livros.js');
const { RACAS } = await import(P + 'rules/racas.js');
const { vantagemPorTraco } = await import(P + 'rules/passivas.js');
const { recuperarNoCurto } = await import(P + 'rules/descanso.js');
const { magiasProntas, SPELLS } = await import(P + 'rules/spells.js');
const { usoLivreDe } = await import(P + 'rules/passivas.js');
const { categoriaDeTamanho } = await import(P + 'rules/tamanho.js');

let total = 0;
let falhas = 0;
async function teste(nome, fn) {
  total += 1;
  try { await fn(); console.log(`ok    ${nome}`); } catch (e) {
    falhas += 1;
    console.log(`FALHA ${nome}\n      ${String(e.stack ?? e.message).split('\n').slice(0, 6).join('\n      ')}`);
  }
}

const BASE = { str: 16, dex: 14, con: 14, int: 10, wis: 12, cha: 14 };
/** Um guerreiro (ou outra classe) da raça, no nível pedido. */
function heroi(racaId, nivel = 1, { classe = 'guerreiro', extra = {}, arma = 'espadaLonga' } = {}) {
  const r = RACAS[racaId];
  const c = criarPersonagem({
    id: `h-${racaId}-${Math.random()}`, name: r.nome, ancestry: r.grupo, raca: r.nome, racaId, look: 'fighter',
    abilities: { ...BASE }, skills: [], armor: 'nenhuma', shield: false, speedFt: r.deslocamento, weapons: [arma], ...extra,
  }, { classe, nivel, escolhas: classe === 'guerreiro' ? { 1: { estiloDeLuta: 'defense' } } : {} });
  c.equippedWeapon = arma;
  return c;
}
/** O herói em (5,5), a aliada em (5,6) e os inimigos pedidos (um ogro colado, por padrão). */
function montar(h, { foes = [['ogro', { x: 6, y: 5 }]], seed = 3, aliada = true } = {}) {
  const field = new Battlefield(20, 20, Array(20).fill('.'.repeat(20)));
  const amiga = heroi('humano', Math.max(1, h.level));
  amiga.name = 'Dara';
  h.pos = { x: 5, y: 5, f: 1 };
  amiga.pos = { x: 5, y: 6, f: 1 };
  const fs = foes.map(([id, p]) => makeMonster(id, p));
  const log = [];
  const party = aliada ? [h, amiga] : [h];
  const enc = new Encounter({ battlefield: field, party, foes: fs, rng: makeRng(seed), onLog: (e) => log.push(e) });
  enc.firstSide = 'party'; enc.round = 1; enc.beginSide('party');
  const texto = () => log.map((l) => `${l.text} ${l.detail ?? ''}`).join('\n');
  return { enc, h, amiga, foes: fs, log, texto };
}
function d20s(enc, valores) {
  const orig = enc.rng.die;
  const fila = [...valores];
  enc.rng.die = (lados) => (lados === 20 && fila.length ? fila.shift() : orig(lados));
}
const novoTurno = (c) => { c.actionUsed = false; c.bonusUsed = false; c.reactionUsed = false; c.magiasNoTurno = []; c.atacouNoTurno = false; c.ataquesRestantes = 0; };

await teste('As 43 raças novas: todo traço tem texto em pt-br, está no catálogo e diz se o motor faz ou por que não', () => {
  assert.equal(Object.keys(RACAS_DOS_LIVROS).length, 43);
  for (const [id, r] of Object.entries(RACAS_DOS_LIVROS)) {
    assert.ok(r.nome && r.nomeF && r.livro, id);
    for (const t of [...r.tracos, ...(r.escolhaDeTraco ?? [])]) {
      assert.ok(CARACTERISTICAS[t]?.desc, `${id}: ${t} sem texto`);
      const def = CARACTERISTICAS[t];
      assert.ok(def.motor || def.semEfeito, `${id}: ${t} não diz se o motor faz`);
      assert.notEqual(estadoDaCaracteristica(t), 'pendente', `${id}: ${t} pendente`);
    }
  }
  for (const t of Object.values(TRACOS_DOS_LIVROS)) assert.ok(!/ the | of the /i.test(t.nome + t.desc), t.nome);
});

await teste('Cada raça monta um herói no 1º e no 5º nível, com o tamanho, o deslocamento e a visão do livro', () => {
  for (const id of Object.keys(RACAS_DOS_LIVROS)) {
    for (const n of [1, 5]) {
      const c = heroi(id, n);
      assert.equal(c.racaId, id);
      assert.ok(c.maxHp > 0 && c.ac >= 10, `${id}/${n}`);
    }
  }
  assert.equal(categoriaDeTamanho(heroi('goblin')), categoriaDeTamanho(heroi('halflingPesLeves')));
  assert.ok(categoriaDeTamanho(heroi('kobold')) < categoriaDeTamanho(heroi('orc')));
  assert.equal(heroi('tritao').speeds.swimFt, 30);
  assert.equal(heroi('tabaxi').speeds.climbFt, 20);
  assert.equal(heroi('tiferinoAlado').flyFt, 30);
  assert.equal(heroi('duergar').visaoNoEscuro, 120);
  assert.equal(heroi('meioElfoFloresta', 1, { extra: { tracoDaRaca: 'fleetOfFoot' } }).speedFt, 35);
});

await teste('Aasimar: as Mãos Curativas curam o nível; a Alma Radiante dá voo e soma o nível em radiante uma vez por turno', () => {
  const h = heroi('aasimarProtetor', 3);
  const { enc, amiga, foes, texto } = montar(h);
  amiga.hp = 1;
  assert.ok(magiasProntas(h).includes('maosCurativas'));
  assert.ok(enc.castSpell(h, 'maosCurativas', { target: amiga }).ok);
  assert.equal(amiga.hp, 4);
  assert.equal(h.resources.healingHands, 0);
  novoTurno(h);
  assert.ok(enc.castSpell(h, 'almaRadianteAasimar', {}).ok);
  assert.ok(hasCondition(h, 'almaRadiante'));
  assert.ok(enc.voaAgora(h), 'a Alma Radiante não deu voo');
  novoTurno(h);
  d20s(enc, [18, 18]);
  enc.attackAction(h, foes[0]);
  assert.equal((texto().match(/Alma Radiante: \+3 de radiante/g) ?? []).length, 1, texto());
  // no 1º e 2º nível a transformação não existe
  assert.ok(!magiasProntas(heroi('aasimarProtetor', 2)).includes('almaRadianteAasimar'));
});

await teste('Aasimar flagelo: o Consumo Radiante queima ele e quem está a 3 m no fim do turno', () => {
  const h = heroi('aasimarFlagelo', 4);
  const { enc, foes } = montar(h, { aliada: false });
  assert.ok(enc.castSpell(h, 'consumoRadiante', {}).ok);
  const antes = [h.hp, foes[0].hp];
  enc.fimDoTurnoDoLado('party');
  // a Resistência Celestial corta a metade do que a própria luz faz nele
  assert.equal(h.hp, antes[0] - 1);
  assert.equal(foes[0].hp, antes[1] - 2);
});

await teste('Golias: a Resistência da Pedra tira 1d12 + CON do golpe que dói, uma vez por descanso curto', () => {
  const h = heroi('golias', 1);
  const { enc, foes } = montar(h);
  const hp = h.hp;
  enc.applyDamage(h, 8, 'concussão', foes[0]);
  assert.ok(h.hp > hp - 8, `${hp} → ${h.hp}`);
  assert.equal(h.resources.stonesEndurance, 0);
  recuperarNoCurto(h);
  assert.equal(h.resources.stonesEndurance, 1);
});

await teste('Goblin: a Fúria dos Pequenos soma o nível contra o ogro (Grande), uma vez; Pequeno, sai do lugar com Fuga Ágil', () => {
  const h = heroi('goblin', 4, { arma: 'cimitarra' });
  const { enc, foes, texto } = montar(h);
  d20s(enc, [18]);
  enc.attackAction(h, foes[0]);
  assert.match(texto(), /Fúria dos Pequenos: \+4/);
  assert.equal(h.resources.furyOfTheSmall, 0);
  assert.ok(enc.castSpell(h, 'fugaAgilRacial', {}).ok);
  assert.ok(h.disengaging && h.bonusUsed);
});

await teste('Bugbear: no próprio turno a espada alcança 3 m; o Ataque Surpresa soma 2d6 no surpreso', () => {
  const h = heroi('bugbear', 1);
  const { enc, foes, texto } = montar(h, { foes: [['ogro', { x: 7, y: 5 }]] });
  assert.equal(enc.weaponAttackProfile(h).reachFt, 10);
  assert.ok(enc.canAttack(h, foes[0]).ok);
  enc.surpreendidos = new Set([foes[0].id]);
  d20s(enc, [18]);
  enc.attackAction(h, foes[0]);
  assert.match(texto(), /Ataque Surpresa/);
});

await teste('Hobgoblin: Salvar as Aparências vira o erro por pouco em acerto, com a aliada à vista', () => {
  const h = heroi('hobgoblin', 1);
  const { enc, foes, texto } = montar(h);
  const ca = foes[0].ac;
  // o total fica um abaixo da CA: o +1 da aliada à vista salva o golpe
  const bonus = enc.weaponAttackProfile(h).bonus;
  d20s(enc, [ca - 1 - bonus]);
  enc.attackAction(h, foes[0]);
  assert.match(texto(), /Salvar as Aparências/);
  assert.equal(h.resources.savingFace, 0);
});

await teste('Kobold: Táticas de Matilha dão vantagem; Rastejar dá vantagem à aliada contra quem está perto', () => {
  const h = heroi('kobold', 1, { arma: 'adaga' });
  const { enc, amiga, foes } = montar(h, { foes: [['goblin', { x: 6, y: 6 }]] });
  const mods = enc.attackModifiers(h, foes[0]);
  if (mods) assert.ok(JSON.stringify(mods).includes('matilha'), JSON.stringify(mods));
  assert.ok(enc.castSpell(h, 'rastejarImplorar', {}).ok);
  assert.ok(hasCondition(h, 'rastejando'));
  amiga.pos = { x: 8, y: 8, f: 1 };
  const m2 = enc.attackModifiers(amiga, foes[0]);
  if (m2) assert.ok(JSON.stringify(m2).includes('rastejando'), JSON.stringify(m2));
});

await teste('Povo-lagarto: CA 13 + DES sem armadura, a mordida na mão, nado e as Mandíbulas Famintas dão PV temporários', () => {
  const h = heroi('povoLagarto', 1);
  assert.equal(h.ac, 13 + 2); // a Defesa do guerreiro só vale vestindo armadura
  assert.ok(h.weapons.includes('mordidaRacial'));
  const { enc, foes } = montar(h);
  d20s(enc, [19]);
  assert.ok(enc.castSpell(h, 'mandibulasFamintas', { target: foes[0] }).ok);
  assert.equal(h.tempHp, 2);
});

await teste('Tabaxi: a Agilidade Felina dobra o deslocamento e só volta depois de um turno parado', () => {
  const h = heroi('tabaxi', 1);
  const { enc } = montar(h);
  const antes = h.movementLeftFt;
  assert.ok(enc.castSpell(h, 'agilidadeFelina', {}).ok);
  assert.equal(h.movementLeftFt, antes + 30);
  assert.ok(!h.actionUsed && !h.bonusUsed, 'a agilidade não gasta ação');
  assert.equal(h.resources.felineAgility, 0);
  assert.ok(!enc.castSpell(h, 'agilidadeFelina', {}).ok);
});

await teste('Yuan-ti: imune a veneno e a envenenado, vantagem contra magia; githzerai contra medo; verdan nas de SAB', () => {
  const y = heroi('yuantiPuroSangue', 1);
  const { enc } = montar(y);
  assert.equal(enc.danoPorTipo(y, 10, 'veneno'), 0);
  assert.ok(enc.imuneACondicao(y, 'envenenado'));
  assert.ok(vantagemPorTraco(y, 'wis', { magico: true }).includes('Resistência a Magia'));
  assert.ok(vantagemPorTraco(heroi('githzerai'), 'wis', { condicao: 'amedrontado' }).includes('Disciplina Mental'));
  assert.ok(vantagemPorTraco(heroi('verdan'), 'wis', { magico: false }).includes('Intuição Telepática'));
  assert.ok(!vantagemPorTraco(heroi('verdan'), 'dex', { magico: false }).length);
});

await teste('Eladrin do verão: o Passo Feérico teleporta e, do 3º nível, queima quem está colado na chegada', () => {
  const h = heroi('eladrin', 3, { extra: { tracoDaRaca: 'estacaoVerao' } });
  assert.ok(h.features.includes('estacaoVerao'));
  const { enc, foes, texto } = montar(h, { foes: [['goblin', { x: 9, y: 6 }]] });
  assert.ok(enc.castSpell(h, 'passoFeerico', { point: { x: 9, y: 5 } }).ok, texto());
  assert.deepEqual([h.pos.x, h.pos.y], [9, 5]);
  assert.match(texto(), /Verão/);
  assert.equal(h.resources.feyStep, 0);
});

await teste('Shadar-kai: a Bênção da Rainha Corvo, do 3º nível, dá resistência a todo dano até o próximo turno', () => {
  const h = heroi('shadarKai', 3);
  const { enc } = montar(h);
  assert.ok(enc.castSpell(h, 'bencaoDaRainhaCorvo', { point: { x: 7, y: 7 } }).ok);
  assert.ok(hasCondition(h, 'protecaoDoCorvo'));
  assert.equal(enc.danoPorTipo(h, 10, 'cortante'), 5);
});

await teste('Draconato do Fizban: o sopro em linha toma o lugar de um ataque, 1d10 no 1º e 2d10 no 5º, usos pelo bônus de proficiência', () => {
  const h = heroi('draconatoCromatico', 5, { extra: { ancestralidade: 'azul' } });
  assert.equal(h.danoDoFizban, 'elétrico');
  assert.ok(h.resist.includes('elétrico'));
  assert.equal(h.resourcesMax.soproDoFizban, 3);
  const id = magiasProntas(h).find((s) => s.startsWith('soproFizban_'));
  assert.equal(id, 'soproFizban_eletrico_linha');
  const { enc, foes } = montar(h, { foes: [['goblin', { x: 7, y: 5 }]] });
  assert.ok(enc.castSpell(h, id, { point: { x: 9, y: 5 } }).ok);
  assert.ok(h.actionUsed && h.ataquesRestantes === 1, `o guerreiro do 5º tem um golpe guardado (${h.ataquesRestantes})`);
  assert.equal(h.resources.soproDoFizban, 2);
  // a Proteção Cromática: imune ao tipo
  novoTurno(h);
  assert.ok(enc.castSpell(h, 'protecaoCromatica', {}).ok);
  assert.equal(enc.danoPorTipo(h, 10, 'elétrico'), 0);
  void foes;
});

await teste('Draconato metálico e de gema: o sopro Enervante incapacita; o Voo de Gema dá asas', () => {
  const m = heroi('draconatoMetalico', 5, { extra: { ancestralidade: 'ouro' } });
  const { enc, foes } = montar(m, { foes: [['goblin', { x: 6, y: 5 }]] });
  d20s(enc, [1]);
  assert.ok(enc.castSpell(m, 'soproEnervante', { point: { x: 7, y: 5 } }).ok);
  assert.ok(hasCondition(foes[0], 'incapacitadoPeloSopro'));
  const g = heroi('draconatoGema', 5, { extra: { ancestralidade: 'safira' } });
  assert.equal(g.danoDoFizban, 'trovejante');
  const m2 = montar(g);
  assert.ok(m2.enc.castSpell(g, 'vooDeGema', {}).ok);
  assert.ok(hasCondition(g, 'vooDeGema'));
});

await teste('Magias raciais: a Magia Firbolg volta no descanso curto; o tiferino de Zariel conjura o Golpe Abrasador de 2º círculo', () => {
  const f = heroi('firbolg', 1);
  assert.ok(f.magiasRaciais.some((m) => m.recurso === 'racialCurto_disfarcarSe'));
  f.resources.racialCurto_disfarcarSe = 0;
  recuperarNoCurto(f);
  assert.equal(f.resources.racialCurto_disfarcarSe, 1);
  const z = heroi('tiferinoZariel', 3);
  const uso = usoLivreDe(z, SPELLS.golpeAbrasador);
  assert.equal(uso?.circulo, 2);
  assert.ok(z.truquesRaciais.includes('taumaturgia'));
});

await teste('Verdan: o 1 e o 2 no dado de vida rolam de novo no descanso curto', async () => {
  const { gastarDadoDeVida } = await import(P + 'rules/descanso.js');
  const v = heroi('verdan', 3);
  v.hp = 1;
  const fila = [1, 7];
  const rng = { die: () => fila.shift() ?? 4 };
  const r = gastarDadoDeVida(rng, v);
  assert.equal(r.rolagem, 7);
});

console.log(`\n${total - falhas}/${total} testes das raças dos livros passaram.`);
if (falhas) process.exit(1);
