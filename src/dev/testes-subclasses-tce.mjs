// AS SUBCLASSES DO CALDEIRÃO DE TASHA no motor, sobre o Encounter de verdade: o bárbaro (Fera, Magia Selvagem), o bardo
// (Criação, Eloquência), o clérigo (Ordem, Paz, Crepúsculo), o druida (Esporos, Estrelas, Fogo Selvagem), o guerreiro
// (Guerreiro Psiônico, Cavaleiro Rúnico), o monge (Misericórdia, Eu Astral), o paladino (Glória, Vigilantes), o patrulheiro
// (Andarilho Feérico, Guardião do Enxame), o ladino (Fantasma, Lâmina da Alma), o feiticeiro (Mente Aberrante, Alma
// Mecânica), o bruxo (Insondável, Gênio) e o mago (Lâmina Cantante, Ordem dos Escribas).
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-subclasses-tce.mjs
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

await teste('as subclasses do Tasha entram nas classes, com nome em pt-br, e todo recurso tem texto e estado', () => {
  const ids = Object.entries(SUBCLASSES_TCE).flatMap(([cl, subs]) => Object.keys(subs).map((s) => [cl, s]));
  assert.ok(ids.length >= 7);
  for (const [cl, s] of ids) {
    const def = CLASSES[cl].subclasse.opcoes[s];
    assert.ok(def && def.fonte === 'tce' && def.nome && !/ of /.test(def.nome), `${cl}.${s}: ${def?.nome}`);
    for (const f of Object.values(def.niveis).flat()) {
      assert.ok(CARACTERISTICAS[f]?.desc, `${cl}.${s}: ${f} sem texto`);
      assert.notEqual(estadoDaCaracteristica(f), 'pendente', `${cl}.${s}: ${f} pendente`);
    }
  }
  for (const d of ['ordem', 'paz', 'crepusculo']) assert.ok(SUBCLASSES_1.clerigo.opcoes.some((o) => o.motor === d), d);
});

// ------------------------------------------------------------------ bárbaro

await teste('Caminho da Fera: a Fúria escolhe a arma natural; a mordida cura abaixo da metade; a arma some quando a Fúria acaba', () => {
  const { enc, h, foes: [ogro], texto } = montar(heroi('barbaro', 3, 'fera'));
  ogro.hp = ogro.maxHp = 300;
  assert.ok(enc.useFeature(h, 'rage', { modo: 'mordida' }));
  assert.equal(h.equippedWeapon, 'mordidaDaFera');
  h.hp = 10;
  d20s(enc, [19]);
  enc.resolveAttack(h, ogro);
  assert.equal(h.hp, 12, 'a mordida devolve a proficiência');
  assert.match(texto(), /Mordida da Fera/);
  removeCondition(h, 'furia');
  Sub.largarFormaDaFera(h);
  assert.ok(!h.weapons.includes('mordidaDaFera') && h.equippedWeapon === 'espadaLonga');
});

await teste('Caminho da Fera: as garras dão um golpe a mais; a cauda soma 1d8 à CA na reação; a Fúria Infecciosa fere a mente', () => {
  const a = montar(heroi('barbaro', 3, 'fera'));
  a.foes[0].hp = a.foes[0].maxHp = 300;
  a.enc.useFeature(a.h, 'rage', { modo: 'garras' });
  a.enc.attackAction(a.h, a.foes[0]);
  assert.equal(golpesDe(a.texto, a.h.name), 2);
  const b = montar(heroi('barbaro', 3, 'fera'));
  b.enc.useFeature(b.h, 'rage', { modo: 'cauda' });
  b.enc.resolveAttack(b.foes[0], b.h);
  assert.ok(b.h.reactionUsed);
  assert.match(b.texto(), /cauda de .* se levanta/);
  const c = montar(heroi('barbaro', 10, 'fera'));
  c.foes[0].hp = c.foes[0].maxHp = 300;
  c.enc.useFeature(c.h, 'rage', { modo: 'mordida' });
  d20s(c.enc, [19, 1]);
  c.enc.resolveAttack(c.h, c.foes[0]);
  assert.match(c.texto(), /Fúria Infecciosa/);
  assert.equal(c.h.resources.infectiousFury, c.h.resourcesMax.infectiousFury - 1);
});

await teste('Caminho da Fera (14º): o Chamado da Caçada dá 1d6 aos aliados e PV temporários ao bárbaro', () => {
  const { enc, h, aliada, foes: [ogro], texto } = montar(heroi('barbaro', 14, 'fera'));
  ogro.hp = ogro.maxHp = 300;
  enc.useFeature(h, 'rage', { modo: 'garras' });
  assert.ok(hasCondition(aliada, 'chamadoDaCaca'));
  assert.ok(h.tempHp >= 5);
  d20s(enc, [19]);
  enc.resolveAttack(aliada, ogro);
  assert.match(texto(), /Chamado da Caçada: \+\d/);
});

await teste('Magia Selvagem do bárbaro: a Fúria solta um surto da tabela; a arma de energia, as luzes, as flores e o raio', () => {
  const a = montar(heroi('barbaro', 3, 'magiaSelvagemBarbaro'));
  dados(a.enc, 8, [4]);
  a.enc.useFeature(a.h, 'rage');
  assert.equal(Sub.efeitoDoSurto(a.h), 'armaDeForca');
  d20s(a.enc, [19]);
  a.enc.resolveAttack(a.h, a.foes[0]);
  assert.match(a.texto(), /de dano energético/);
  const b = montar(heroi('barbaro', 3, 'magiaSelvagemBarbaro'));
  dados(b.enc, 8, [6]);
  b.enc.useFeature(b.h, 'rage');
  assert.ok(hasCondition(b.aliada, 'luzesDoSurto'));
  const c = montar(heroi('barbaro', 3, 'magiaSelvagemBarbaro'));
  dados(c.enc, 8, [7]);
  c.enc.useFeature(c.h, 'rage');
  assert.equal(c.enc.speedOf(c.foes[0]), Math.floor(c.foes[0].speedFt / 2), 'as flores: metade do deslocamento');
  const d = montar(heroi('barbaro', 3, 'magiaSelvagemBarbaro'));
  dados(d.enc, 8, [8]);
  d20s(d.enc, [1]);
  d.enc.useFeature(d.h, 'rage');
  assert.ok(hasCondition(d.foes[0], 'cego'), 'o raio de luz cega');
});

await teste('Magia Selvagem do bárbaro: a Magia Fortalecedora devolve o espaço ou dá +1d3; a Resposta Instável solta outro surto', () => {
  const mago = heroi('mago', 6);
  const { enc, h, aliada } = montar(heroi('barbaro', 10, 'magiaSelvagemBarbaro'), { outros: [mago] });
  mago.spellcasting.slots[1] = 0;
  mago.pos = { x: 5, y: 4, f: 1 };
  dados(enc, 3, [1]);
  assert.ok(enc.useFeature(h, 'bolsteringMagic', { target: mago }));
  assert.equal(mago.spellcasting.slots[1], 1);
  novoTurno(h);
  assert.ok(enc.useFeature(h, 'bolsteringMagic', { target: aliada }));
  assert.ok(hasCondition(aliada, 'magiaFortalecedora'));
  novoTurno(h);
  enc.useFeature(h, 'rage');
  h.reactionUsed = false;
  enc.applyDamage(h, 24, 'psíquico', enc.combatants.find((c) => c.side === 'foes'));
  assert.ok(h.reactionUsed, 'o golpe de 24 soltou outro surto, com a reação');
});

// ------------------------------------------------------------------ bardo

await teste('Colégio da Criação: a Partícula de Potencial estoura em trovão no ataque e dá PV temporários na resistência', () => {
  const { enc, h, aliada, foes: [ogro], texto } = montar(heroi('bardo', 3, 'criacao'));
  ogro.hp = ogro.maxHp = 300;
  inspirar(h, aliada);
  const hp = ogro.hp;
  d20s(enc, [19, 1]);
  const r = enc.resolveAttack(aliada, ogro);
  assert.match(texto(), /Partícula de Potencial/);
  assert.ok(hp - ogro.hp > r.damage, 'o trovão somou');
  inspirar(h, aliada);
  aliada.tempHp = 0;
  enc.resistencia(aliada, 'wis', 10);
  assert.ok(aliada.tempHp >= 2);
});

await teste('Colégio da Criação (6º): a Apresentação Animada põe um item dançante com 10 + 5 × nível PV ao lado do bardo', () => {
  const { enc, h } = montar(heroi('bardo', 6, 'criacao'));
  assert.ok(enc.useFeature(h, 'animatingPerformance'));
  const item = enc.combatants.find((c) => c.defId === 'itemDancante');
  assert.ok(item && item.side === 'party' && item.maxHp === 40);
  assert.equal(h.resources.animatingPerformance, 0);
});

await teste('Colégio da Eloquência: a Língua de Prata, as Palavras Perturbadoras, a Inspiração Infalível e a Infecciosa', () => {
  const terceiro = heroi('guerreiro', 14);
  const { enc, h, aliada, foes: [ogro], texto } = montar(heroi('bardo', 14, 'eloquencia'), { outros: [terceiro] });
  ogro.hp = ogro.maxHp = 300;
  d20s(enc, [2]);
  assert.ok(enc.testeDeAtributo(h, 'cha', 0, 'Persuasão', { pericia: 'persuasao' }).total >= 10);
  assert.ok(enc.useFeature(h, 'unsettlingWords', { target: ogro }));
  const sv = enc.resistencia(ogro, 'wis', 10);
  assert.ok(sv.partes.some((x) => x.rotulo === 'Palavras Perturbadoras'));
  inspirar(h, aliada);
  d20s(enc, [1]);
  enc.resolveAttack(aliada, ogro);
  assert.ok(hasCondition(aliada, 'inspirado'), 'errou e não perdeu o dado');
  d20s(enc, [19]);
  enc.resolveAttack(aliada, ogro);
  assert.ok(hasCondition(terceiro, 'inspirado'), 'acertou e passou um dado adiante');
  assert.match(texto(), /Inspiração Infecciosa/);
});

// ------------------------------------------------------------------ clérigo

await teste('Domínio da Ordem: a Voz da Autoridade (o aliado da magia ataca), a Exigência da Ordem e a Encarnação da Lei', () => {
  const h = heroi('clerigo', 6, 'ordem');
  const { enc, aliada, foes: [ogro], texto } = montar(h);
  ogro.hp = ogro.maxHp = 300;
  assert.ok(h.armorTraining.includes('pesada'));
  assert.ok(enc.castSpell(h, 'heroismo', { target: aliada }).ok);
  assert.match(texto(), /Voz da Autoridade/);
  assert.ok(aliada.reactionUsed);
  novoTurno(h);
  d20s(enc, [1]);
  assert.ok(enc.useFeature(h, 'ordersDemand'));
  assert.ok(getCondition(ogro, 'enfeiticado')?.source === h.id);
  novoTurno(h);
  removeCondition(ogro, 'enfeiticado');
  enc.useFeature(h, 'embodimentOfTheLaw', { modo: 'ligar' });
  assert.ok(enc.castSpell(h, 'comando', { target: ogro }).ok);
  assert.ok(h.bonusUsed && !h.actionUsed, 'o Comando saiu como ação bônus');
});

await teste('Domínio da Ordem: o Golpe Divino psíquico, e no 17º a Ira da Ordem soma 2d8 no golpe do aliado', () => {
  const { enc, h, aliada, foes: [ogro], texto } = montar(heroi('clerigo', 17, 'ordem'));
  ogro.hp = ogro.maxHp = 300;
  d20s(enc, [19]);
  enc.resolveAttack(h, ogro);
  assert.match(texto(), /Golpe Divino: \+\d+ de psíquico/);
  assert.ok(hasCondition(ogro, 'iraDaOrdem'));
  d20s(enc, [19]);
  enc.resolveAttack(aliada, ogro);
  assert.match(texto(), /Ira da Ordem: \+\d/);
});

await teste('Domínio da Paz: o Vínculo dá 1d4 por turno; o Bálsamo cura quem ele alcança; o Vínculo Protetor toma o golpe', () => {
  const { enc, h, aliada, foes: [ogro] } = montar(heroi('clerigo', 6, 'paz'));
  assert.ok(enc.useFeature(h, 'emboldeningBond'));
  assert.ok(hasCondition(h, 'vinculoEncorajador') && hasCondition(aliada, 'vinculoEncorajador'));
  const sv = enc.resistencia(aliada, 'wis', 10);
  assert.ok(sv.partes.some((x) => x.rotulo === 'Vínculo Encorajador'));
  assert.ok(!enc.resistencia(aliada, 'wis', 10).partes.some((x) => x.rotulo === 'Vínculo Encorajador'), 'uma vez por turno');
  novoTurno(h);
  aliada.hp -= 10;
  const hp = aliada.hp;
  assert.ok(enc.useFeature(h, 'balmOfPeace'));
  assert.ok(aliada.hp > hp);
  aliada.hp = 5;
  const hpH = h.hp;
  enc.applyDamage(aliada, 10, 'concussão', ogro, { deArma: true });
  assert.equal(aliada.hp, 5);
  assert.equal(hpH - h.hp, 10);
  const e = montar(heroi('clerigo', 17, 'paz'));
  e.enc.useFeature(e.h, 'emboldeningBond');
  e.aliada.hp = 5;
  const hpE = e.h.hp;
  e.enc.applyDamage(e.aliada, 10, 'concussão', e.foes[0], { deArma: true });
  assert.equal(hpE - e.h.hp, 5, 'no 17º, o golpe tomado é resistido');
});

await teste('Domínio do Crepúsculo: visão de 90 m, a Bênção Vigilante, o Santuário, os Passos da Noite e a Mortalha', () => {
  const h = heroi('clerigo', 17, 'crepusculo');
  assert.equal(visaoNoEscuro(h), 300);
  const { enc, aliada } = montar(h);
  assert.ok(enc.useFeature(h, 'vigilantBlessing', { target: aliada }));
  assert.ok(Sub.vantagemDaBencaoVigilante(enc, 'party') && !hasCondition(aliada, 'vigilantBlessing'));
  novoTurno(h);
  assert.ok(enc.useFeature(h, 'twilightSanctuary'));
  addCondition(aliada, 'amedrontado', { rounds: 10 });
  Sub.fimDoLadoDosLivros(enc, 'party');
  assert.ok(!hasCondition(aliada, 'amedrontado'));
  aliada.tempHp = 0;
  Sub.fimDoLadoDosLivros(enc, 'party');
  assert.ok(aliada.tempHp >= 18);
  assert.ok(enc.resistencia(aliada, 'dex', 10).partes.some((x) => x.rotulo === 'Mortalha do Crepúsculo'));
  enc.field.luz = new Array(enc.field.w * enc.field.h).fill(0);
  novoTurno(h);
  assert.ok(enc.useFeature(h, 'stepsOfNight'));
  assert.ok(enc.voaAgora(h));
});

// ------------------------------------------------------------------ druida

await teste('Círculo dos Esporos: o Halo fere quem começa o turno perto; a Entidade dá PV temporários e necrótico no golpe', () => {
  const { enc, h, foes: [ogro], texto } = montar(heroi('druida', 6, 'esporos'));
  ogro.hp = ogro.maxHp = 300;
  assert.ok(h.spellcasting.sempreProntas.includes('toqueArrepiante'));
  const hp = ogro.hp;
  d20s(enc, [1]);
  Sub.comecoDoLadoTce2(enc, 'foes');
  assert.ok(ogro.hp < hp && h.reactionUsed);
  assert.match(texto(), /Halo de Esporos/);
  novoTurno(h);
  const forma = h.resources.wildShape;
  assert.ok(enc.useFeature(h, 'symbioticEntity'));
  assert.equal(h.tempHp, 24);
  assert.equal(h.resources.wildShape, forma - 1);
  d20s(enc, [19]);
  enc.resolveAttack(h, ogro);
  assert.match(texto(), /Entidade Simbiótica: \+\d+ de necrótico/);
});

await teste('Esporos: a Infestação Fúngica levanta o goblin morto; os Esporos que se Espalham; o Corpo Fúngico', () => {
  const { enc, h, foes: [, gob] } = montar(heroi('druida', 14, 'esporos'), { foes: [['ogro', { x: 6, y: 5 }], ['goblin', { x: 4, y: 5 }]] });
  enc.applyDamage(gob, 99, 'cortante', enc.combatants.find((c) => c.name === 'Dara'));
  const z = enc.combatants.find((c) => c.invocado?.spellId === 'infestacaoFungica');
  assert.ok(z && z.hp === 1 && z.side === 'party');
  novoTurno(h);
  enc.useFeature(h, 'symbioticEntity');
  novoTurno(h);
  assert.ok(enc.castSpell(h, 'esporosQueSeEspalham', { point: { x: 8, y: 8 } }).ok);
  const zona = enc.zonas.find((x) => x.spellId === 'esporosQueSeEspalham');
  assert.ok(zona && zona.dano?.dados === '2d10', `o dado do halo em dobro: ${zona?.dano?.dados}`);
  assert.equal(SPELLS.esporosQueSeEspalham.zona.dano.dados, '1d8', 'a magia volta ao normal');
  assert.ok(enc.imuneACondicao(h, 'envenenado') && enc.imuneACondicao(h, 'amedrontado'));
  d20s(enc, [20]);
  assert.ok(!enc.resolveAttack(enc.combatants.find((c) => c.defId === 'ogro'), h).critical);
});

await teste('Círculo das Estrelas: o Raio Guiado do mapa sem espaço; o Arqueiro, o Cálice e o Dragão da Forma Estrelada', () => {
  const { enc, h, aliada, foes: [ogro], texto } = montar(heroi('druida', 2, 'estrelas'), { foes: [['ogro', { x: 9, y: 5 }]] });
  ogro.hp = ogro.maxHp = 300;
  const espacos = JSON.stringify(h.spellcasting.slots);
  assert.ok(usoLivreDe(h, SPELLS.raioGuiado));
  assert.ok(enc.castSpell(h, 'raioGuiado', { target: ogro }).ok);
  assert.equal(JSON.stringify(h.spellcasting.slots), espacos);
  assert.equal(h.resources.starMap, h.resourcesMax.starMap - 1);
  novoTurno(h);
  d20s(enc, [19]);
  assert.ok(enc.useFeature(h, 'starryForm', { modo: 'arqueiro', target: ogro }));
  assert.match(texto(), /Flecha Estelar acerta/);
  const c = montar(heroi('druida', 2, 'estrelas'));
  c.h.spellcasting.prepared.push('curarFerimentos');
  c.enc.useFeature(c.h, 'starryForm', { modo: 'calice' });
  novoTurno(c.h);
  c.h.hp -= 8;
  const hpH = c.h.hp;
  c.aliada.hp -= 1;
  assert.ok(c.enc.castSpell(c.h, 'curarFerimentos', { target: c.aliada }).ok);
  assert.ok(c.h.hp > hpH, 'o Cálice cura o mais ferido');
  const d = montar(heroi('druida', 2, 'estrelas'));
  d.enc.useFeature(d.h, 'starryForm', { modo: 'dragao' });
  d20s(d.enc, [2]);
  assert.ok(d.enc.testeDeAtributo(d.h, 'wis', 0, 'Percepção', { pericia: 'percepcao' }).total >= 10);
  assert.ok(aliada);
});

await teste('Estrelas: o Presságio Cósmico vira a resistência do aliado; no 10º troca a constelação; no 14º resiste ao golpe físico', () => {
  const { enc, h, aliada } = montar(heroi('druida', 14, 'estrelas'));
  h.pressagio = 'bem';
  aliada.features = aliada.features.filter((f) => f !== 'indomitable'); // o Indomável rolaria de novo antes
  d20s(enc, [8]);
  dados(enc, 6, [6]);
  const r = enc.resistencia(aliada, 'wis', 13);
  assert.ok(r.success && h.reactionUsed);
  novoTurno(h);
  enc.useFeature(h, 'starryForm', { modo: 'arqueiro' });
  assert.ok(enc.useFeature(h, 'starryForm', { modo: 'dragao' }), 'troca de constelação');
  assert.ok(enc.voaAgora(h), 'o Dragão voa no 10º');
  assert.equal(enc.danoPorTipo(h, 10, 'cortante'), 5);
});

await teste('Círculo do Fogo Selvagem: o espírito chega queimando; o Laço Reforçado; as Chamas Cauterizantes; o Renascer em Chamas', () => {
  const { enc, h, aliada, foes: [ogro, gob] } = montar(heroi('druida', 14, 'fogoSelvagem'), { foes: [['ogro', { x: 6, y: 5 }], ['goblin', { x: 8, y: 8 }]] });
  ogro.hp = ogro.maxHp = 300;
  const hp = ogro.hp;
  d20s(enc, [1, 1, 1]);
  assert.ok(enc.useFeature(h, 'summonWildfireSpirit'));
  const esp = enc.combatants.find((c) => c.defId === 'espiritoDoFogoSelvagem');
  assert.ok(esp && esp.maxHp === 75);
  assert.ok(ogro.hp < hp, 'o espírito chega queimando');
  assert.ok(Sub.lacoReforcado(enc, h, { damageType: 'fogo' }) > 0);
  gob.pos = { x: 5, y: 8, f: 1 };
  enc.applyDamage(gob, 99, 'cortante', aliada);
  assert.ok(enc.chamasCauterizantes?.length);
  aliada.hp -= 10;
  const hpA = aliada.hp;
  aliada.movementLeftFt = 30;
  enc.moveAlong(aliada, [{ x: 5, y: 6 }, { x: 5, y: 7 }, { x: 5, y: 8 }]);
  assert.ok(aliada.hp > hpA, 'a chama curou a aliada');
  esp.pos = { x: 4, y: 5, f: 1 };
  enc.applyDamage(h, h.hp + 5, 'psíquico', ogro);
  assert.equal(h.hp, Math.floor(h.maxHp / 2));
  assert.ok(esp.dead && !hasCondition(h, 'inconsciente'));
});

// ------------------------------------------------------------------ guerreiro

await teste('Guerreiro Psiônico: o Campo Protetor corta o golpe na aliada; o Golpe Psiônico; o Impulso derruba; o Salto voa', () => {
  const { enc, h, aliada, foes: [ogro], texto } = montar(heroi('guerreiro', 7, 'psiGuerreiro'));
  ogro.hp = ogro.maxHp = 300;
  const dados0 = h.resources.psionicEnergy;
  const hp = aliada.hp;
  enc.applyDamage(aliada, 12, 'concussão', ogro, { deArma: true });
  assert.ok(hp - aliada.hp < 12 && h.reactionUsed && h.resources.psionicEnergy === dados0 - 1);
  enc.useFeature(h, 'psionicStrike', { modo: 'ligar' });
  d20s(enc, [19, 1]);
  enc.resolveAttack(h, ogro);
  assert.match(texto(), /Golpe Psiônico: \+\d+ de energético/);
  assert.ok(hasCondition(ogro, 'caido'), 'Impulso Telecinético');
  assert.ok(enc.useFeature(h, 'telekineticAdept'));
  assert.ok(enc.voaAgora(h));
});

await teste('Guerreiro Psiônico: a Mente Protegida tira o medo e resiste a psíquico; o Baluarte; a Telecinésia do mestre sem espaço', () => {
  const { enc, h, aliada } = montar(heroi('guerreiro', 18, 'psiGuerreiro'));
  addCondition(h, 'amedrontado', { rounds: 10 });
  Sub.comecoDoLadoTce2(enc, 'party');
  assert.ok(!hasCondition(h, 'amedrontado'));
  assert.equal(enc.danoPorTipo(h, 10, 'psíquico'), 5);
  // com INT 10 o baluarte cobre um só: o próprio guerreiro
  const ca = caEfetiva(h);
  assert.ok(enc.useFeature(h, 'bulwarkOfForce'));
  assert.equal(caEfetiva(h), ca + 2);
  assert.ok(!hasCondition(aliada, 'baluarteDeForca'));
  assert.ok(usoLivreDe(h, SPELLS.telecinesia));
});

await teste('Cavaleiro Rúnico: o Poder dos Gigantes soma o dado uma vez por turno; a Runa do Fogo prende; a da Pedra põe em transe', () => {
  const { enc, h, foes: [ogro], texto } = montar(heroi('guerreiro', 7, 'cavaleiroRunico'));
  ogro.hp = ogro.maxHp = 300;
  assert.ok(h.features.includes('runaDoFogo') && h.features.includes('runaDoGelo') && h.features.includes('runaDaColina'));
  assert.ok(enc.useFeature(h, 'giantsMight'));
  enc.useFeature(h, 'runeCarver', { modo: 'runaDoFogo' });
  d20s(enc, [19, 1, 19]);
  enc.resolveAttack(h, ogro);
  enc.resolveAttack(h, ogro);
  assert.equal((texto().match(/Poder dos Gigantes: \+\d/g) ?? []).length, 1, 'uma vez por turno');
  assert.match(texto(), /Runa do Fogo: \+\d+ de fogo/);
  assert.ok(hasCondition(ogro, 'contido'));
  const b = montar(heroi('guerreiro', 15, 'cavaleiroRunico', {}));
  b.h.features.push('runaDaPedra');
  b.h.resources.runaDaPedra = 1;
  d20s(b.enc, [1]);
  Sub.fimDoLadoTce2(b.enc, 'foes');
  assert.ok(hasCondition(b.foes[0], 'transePetrea'));
});

await teste('Cavaleiro Rúnico: a Runa do Gelo e a da Colina; o Escudo Rúnico faz o golpe na aliada ser rolado de novo', () => {
  const { enc, h, aliada, foes: [ogro], texto } = montar(heroi('guerreiro', 7, 'cavaleiroRunico'));
  assert.ok(enc.useFeature(h, 'runeCarver', { modo: 'runaDoGelo' }));
  assert.ok(enc.resistencia(h, 'con', 10).partes.some((x) => /Runa do Gelo/.test(x.rotulo)));
  novoTurno(h);
  assert.ok(enc.useFeature(h, 'runeCarver', { modo: 'runaDaColina' }));
  assert.equal(enc.danoPorTipo(h, 10, 'cortante'), 5);
  d20s(enc, [19, 2]);
  enc.resolveAttack(ogro, aliada);
  assert.match(texto(), /escudo rúnico/);
  assert.equal(h.resources.runicShield, h.resourcesMax.runicShield - 1);
});

// ------------------------------------------------------------------ monge

await teste('Caminho da Misericórdia: a Mão da Cura (e o Toque do Médico); a Mão do Dano; a Rajada de Cura sem ki', () => {
  const { enc, h, aliada, foes: [ogro], texto } = montar(heroi('monge', 6, 'misericordia'));
  ogro.hp = ogro.maxHp = 300;
  assert.ok(h.skills.includes('medicina'));
  aliada.hp -= 10;
  addCondition(aliada, 'envenenado', { rounds: 10 });
  const ki = h.resources.ki;
  assert.ok(enc.useFeature(h, 'handOfHealing', { target: aliada }));
  assert.ok(!hasCondition(aliada, 'envenenado') && h.resources.ki === ki - 1);
  novoTurno(h);
  enc.useFeature(h, 'handOfHarm', { modo: 'ligar' });
  d20s(enc, [19]);
  enc.attackAction(h, ogro, 'punhos');
  assert.match(texto(), /Mão do Dano: \+\d+ de necrótico/);
  const antes = golpesDe(texto, h.name);
  assert.ok(enc.useFeature(h, 'flurryOfBlows', { target: ogro, modo: 'curaUm' }));
  assert.equal(golpesDe(texto, h.name) - antes, 1, 'um golpe só');
  const ki2 = h.resources.ki;
  assert.ok(enc.useFeature(h, 'handOfHealing', { target: aliada }));
  assert.equal(h.resources.ki, ki2, 'a cura da Rajada não gasta ki');
});

await teste('Misericórdia (17º): a Mão da Misericórdia Suprema traz de volta quem morreu', () => {
  const { enc, h, aliada } = montar(heroi('monge', 17, 'misericordia'));
  enc.morrer(aliada, 'teste');
  assert.ok(aliada.dead);
  assert.ok(enc.useFeature(h, 'handOfUltimateMercy', { target: aliada }));
  assert.ok(!aliada.dead && aliada.hp > 0);
});

await teste('Caminho do Eu Astral: os braços ferem em volta e golpeiam a 3 m com Sabedoria e energia; o semblante; o corpo; o despertar', () => {
  const { enc, h, foes: [ogro], texto } = montar(heroi('monge', 17, 'euAstral'), { foes: [['ogro', { x: 7, y: 5 }]] });
  ogro.hp = ogro.maxHp = 300;
  const hp = ogro.hp;
  d20s(enc, [1]);
  assert.ok(enc.useFeature(h, 'armsOfTheAstralSelf'));
  assert.ok(ogro.hp < hp, 'a onda dos braços');
  const p = enc.canAttack(h, ogro, 'punhos');
  assert.ok(p.ok, p.why);
  assert.equal(p.profile.type, 'energético');
  novoTurno(h);
  assert.ok(enc.useFeature(h, 'visageOfTheAstralSelf'));
  assert.equal(visaoNoEscuro(h), 120);
  const hpH = h.hp;
  enc.applyDamage(h, 15, 'fogo', ogro);
  assert.ok(hpH - h.hp < 15, 'o corpo astral desvia');
  novoTurno(h);
  const ca = caEfetiva(h);
  assert.ok(enc.useFeature(h, 'awakenedAstralSelf'));
  assert.equal(caEfetiva(h), ca + 2);
  assert.equal(enc.golpesDoAtaque(h, 'punhos').length, 1 + h.ataquesExtras + 1);
  assert.ok(texto());
});

// ------------------------------------------------------------------ paladino

await teste('Juramento da Glória: o Golpe Inspirador reparte PV temporários depois da Destruição; o Atleta Sem Igual; a Aura de Prontidão', () => {
  const { enc, h, aliada, foes: [ogro], texto } = montar(heroi('paladino', 7, 'gloria'));
  ogro.hp = ogro.maxHp = 300;
  assert.ok(!enc.useFeature(h, 'inspiringSmite'), 'sem Destruição antes, não sai');
  assert.ok(enc.useFeature(h, 'divineSmite', { modo: '1' }));
  d20s(enc, [19]);
  enc.resolveAttack(h, ogro);
  assert.match(texto(), /destruição divina|Destruição/i);
  const cd = h.resources.channelDivinity;
  assert.ok(enc.useFeature(h, 'inspiringSmite'));
  assert.equal(h.resources.channelDivinity, cd - 1);
  assert.ok(h.tempHp > 0 && aliada.tempHp > 0, `${h.tempHp} e ${aliada.tempHp}`);
  assert.ok(h.tempHp + aliada.tempHp >= 2 + 7 && h.tempHp + aliada.tempHp <= 16 + 7);
  // o andar: o paladino +3 m sempre; a aliada colada, +3 m no turno em que começou colada
  assert.equal(enc.speedOf(h), 40);
  assert.equal(enc.speedOf(aliada), 40);
  aliada.pos = { x: 5, y: 12, f: 1 };
  enc.fimDoTurnoDoLado('party'); enc.beginSide('foes'); enc.fimDoTurnoDoLado('foes'); enc.beginSide('party');
  assert.equal(enc.speedOf(aliada), 30, 'longe, sem a aura');
  // o atleta
  const b = montar(heroi('paladino', 3, 'gloria'));
  assert.ok(b.enc.useFeature(b.h, 'peerlessAthlete'));
  const r = b.enc.testeDeAtributo(b.h, 'str', 2, 'Atletismo', { pericia: 'atletismo' });
  assert.equal(r.mode, 'vantagem');
});

await teste('Glória (15º): a Defesa Gloriosa põe o Carisma na CA, e o paladino responde ao golpe que falhou', () => {
  const { enc, h, aliada, foes: [ogro], texto } = montar(heroi('paladino', 15, 'gloria'));
  ogro.hp = ogro.maxHp = 300;
  const usos = h.resources.gloriousDefense;
  d20s(enc, [aliada.ac - 6, 15]);
  enc.resolveAttack(ogro, aliada);
  assert.match(texto(), /Defesa Gloriosa/);
  assert.match(texto(), /Ogro erra Dara/);
  assert.equal(h.resources.gloriousDefense, usos - 1);
  assert.match(texto(), /responde ao golpe/);
  assert.ok(golpesDe(texto, h.name) >= 1, 'o contra-ataque');
});

await teste('Glória (20º): a Lenda Viva faz o erro acertar uma vez por turno e rola de novo a resistência que falha', () => {
  const { enc, h, foes: [ogro], texto } = montar(heroi('paladino', 20, 'gloria'));
  ogro.hp = ogro.maxHp = 300;
  assert.ok(enc.useFeature(h, 'livingLegend'));
  d20s(enc, [1, 1]);
  enc.resolveAttack(h, ogro);
  enc.resolveAttack(h, ogro);
  assert.equal((texto().match(/a lenda o faz acertar/g) ?? []).length, 1, 'uma vez por turno');
  d20s(enc, [1, 20]);
  const sv = enc.resistencia(h, 'dex', 15);
  assert.ok(sv.success && h.reactionUsed);
  assert.equal(enc.testeDeAtributo(h, 'cha', 0, 'Persuasão', { pericia: 'persuasao' }).mode, 'vantagem');
});

await teste('Juramento dos Vigilantes: Abjurar o Extraplanar expulsa quem é de outro plano até o dano; a Vontade do Vigilante; a Aura da Sentinela', () => {
  const { enc, h, aliada, foes: [ogro, lobo] } = montar(heroi('paladino', 7, 'vigilantes'), { foes: [['ogro', { x: 6, y: 5 }], ['lobo', { x: 8, y: 5 }]] });
  ogro.tipo = 'corruptor';
  d20s(enc, [1, 1]);
  assert.ok(enc.useFeature(h, 'abjureTheExtraplanar'));
  assert.ok(getCondition(ogro, 'amedrontado')?.data?.expulso, 'o corruptor é expulso');
  assert.ok(!hasCondition(lobo, 'amedrontado'), 'a fera não');
  enc.applyDamage(ogro, 3, 'cortante', aliada);
  assert.ok(!hasCondition(ogro, 'amedrontado'), 'o dano acaba a expulsão');
  novoTurno(h);
  h.resources.channelDivinity = 1;
  assert.ok(enc.useFeature(h, 'watchersWill'));
  assert.ok(hasCondition(h, 'vontadeDoVigilante') && hasCondition(aliada, 'vontadeDoVigilante'));
  assert.equal(enc.resistencia(aliada, 'wis', 10).mode, 'vantagem');
  const com = enc.bestDex('party');
  h.features = h.features.filter((f) => f !== 'auraOfTheSentinel');
  assert.equal(com - enc.bestDex('party'), 3, 'a proficiência do 7º');
});

await teste('Vigilantes (15º e 20º): a Repreensão Vigilante fere quem forçou o teste; o Baluarte Mortal dá vantagem e bane', () => {
  const { enc, h, aliada, foes: [ogro], texto } = montar(heroi('paladino', 20, 'vigilantes'));
  ogro.hp = ogro.maxHp = 300;
  d20s(enc, [20]);
  const sv = enc.resistencia(aliada, 'wis', 12, { contra: { conjurador: ogro } });
  assert.ok(sv.success);
  assert.ok(ogro.hp < 300 && h.reactionUsed, 'a repreensão');
  assert.match(texto(), /Repreensão Vigilante/);
  ogro.tipo = 'corruptor';
  assert.ok(enc.useFeature(h, 'mortalBulwark'));
  assert.equal(enc.attackModifiers(h, ogro).mode, 'vantagem');
  d20s(enc, [19, 19, 1]);
  enc.resolveAttack(h, ogro);
  assert.ok(hasCondition(ogro, 'banidoDeVez'), 'banido');
});

// ------------------------------------------------------------------ patrulheiro

await teste('Andarilho Feérico: os Golpes Terríveis (uma vez por alvo no turno); o Encanto Sobrenatural; a Reviravolta Sedutora', () => {
  const { enc, h, aliada, foes: [ogro], texto } = montar(heroi('patrulheiro', 7, 'andarilhoFeerico'));
  ogro.hp = ogro.maxHp = 300;
  d20s(enc, [19, 19]);
  enc.attackAction(h, ogro);
  assert.equal((texto().match(/Golpes Terríveis/g) ?? []).length, 1);
  assert.ok(h.skills.includes('persuasao'));
  assert.equal(skillBonus(h, 'persuasao'), abilityMod(h.abilities.cha) + 3 + Math.max(1, abilityMod(h.abilities.wis)));
  assert.equal(enc.resistencia(h, 'wis', 30, { contra: { condicao: 'enfeiticado' } }).mode, 'vantagem');
  d20s(enc, [20, 1]);
  const sv = enc.resistencia(aliada, 'wis', 12, { contra: { condicao: 'amedrontado', conjurador: ogro } });
  assert.ok(sv.success && h.reactionUsed);
  assert.ok(hasCondition(ogro, 'amedrontado'), 'o medo vai para o inimigo');
  assert.match(texto(), /Reviravolta Sedutora/);
});

await teste('Andarilho Feérico (11º e 15º): o Invocar Feérico e o Passo Nebuloso sem espaço; o passo leva o aliado colado', () => {
  const { enc, h, aliada } = montar(heroi('patrulheiro', 15, 'andarilhoFeerico'), { foes: [['ogro', { x: 15, y: 15 }]] });
  assert.ok(h.magiasDeCaracteristica.includes('invocarFeerico'));
  assert.equal(usoLivreDe(h, SPELLS.invocarFeerico)?.tipo, 'feerico');
  assert.equal(usoLivreDe(h, SPELLS.passoNebuloso)?.tipo, 'nebuloso');
  const usos = h.resources.mistyWanderer;
  assert.ok(enc.castSpell(h, 'passoNebuloso', { point: { x: 10, y: 5 } }).ok);
  assert.equal(h.resources.mistyWanderer, usos - 1);
  assert.ok(Math.abs(aliada.pos.x - 10) <= 1 && Math.abs(aliada.pos.y - 5) <= 1, `a aliada em ${aliada.pos.x},${aliada.pos.y}`);
});

await teste('Guardião do Enxame: o enxame morde uma vez por turno, ou empurra (e derruba no 11º); a Maré Ondulante voa; a Dispersão', () => {
  const a = montar(heroi('patrulheiro', 3, 'guardiaoDoEnxame'));
  a.foes[0].hp = a.foes[0].maxHp = 300;
  assert.ok(a.h.magiasDeCaracteristica.includes('maoMagica'));
  d20s(a.enc, [19]);
  a.enc.resolveAttack(a.h, a.foes[0]);
  d20s(a.enc, [19]);
  a.enc.resolveAttack(a.h, a.foes[0]);
  assert.equal((a.texto().match(/Enxame Reunido: \+\d+ de perfurante/g) ?? []).length, 1);
  const b = montar(heroi('patrulheiro', 15, 'guardiaoDoEnxame'));
  b.foes[0].hp = b.foes[0].maxHp = 300;
  assert.ok(b.enc.useFeature(b.h, 'gatheredSwarm', { modo: 'empurrar' }));
  d20s(b.enc, [19, 1]);
  b.enc.resolveAttack(b.h, b.foes[0]);
  assert.ok(b.foes[0].pos.x >= 8, `o ogro em ${b.foes[0].pos.x}`);
  assert.ok(hasCondition(b.foes[0], 'caido'));
  assert.ok(b.enc.useFeature(b.h, 'writhingTide'));
  assert.equal(conditionEffects(b.h).vooFt, 10);
  const de = { ...b.h.pos };
  const hp = b.h.hp;
  b.enc.applyDamage(b.h, 20, 'cortante', b.foes[0]);
  assert.equal(hp - b.h.hp, 10, 'a resistência');
  assert.ok(de.x !== b.h.pos.x || de.y !== b.h.pos.y, 'o teleporte');
});

// ------------------------------------------------------------------ ladino

await teste('Fantasma: os Lamentos do Túmulo depois do Furtivo; o berloque de quem morre perto; a vantagem dele; o Caminhar Fantasma', () => {
  const { enc, h, foes: [ogro, gob], texto } = montar(heroi('ladino', 13, 'fantasma'), { foes: [['ogro', { x: 6, y: 5 }], ['goblin', { x: 8, y: 5 }]] });
  ogro.hp = ogro.maxHp = 300;
  gob.hp = gob.maxHp = 300;
  const usos = h.resources.wailsFromTheGrave;
  d20s(enc, [19]);
  enc.resolveAttack(h, ogro);
  assert.match(texto(), /Lamentos do Túmulo/);
  assert.ok(gob.hp < 300 && h.resources.wailsFromTheGrave === usos - 1);
  gob.hp = 1;
  enc.applyDamage(gob, 5, 'cortante', ogro);
  assert.ok(gob.dead);
  assert.equal(h.berloquesDeAlma, 1);
  assert.equal(enc.resistencia(h, 'con', 10).mode, 'vantagem');
  novoTurno(h);
  assert.ok(enc.useFeature(h, 'ghostWalk'));
  assert.equal(conditionEffects(h).vooFt, 10);
  assert.equal(enc.attackModifiers(ogro, h).mode, 'desvantagem');
});

await teste('Fantasma (17º): o Amigo da Morte fere as duas criaturas, e o descanso longo deixa um berloque', () => {
  const { enc, h, foes: [ogro, gob], texto } = montar(heroi('ladino', 17, 'fantasma'), { foes: [['ogro', { x: 6, y: 5 }], ['goblin', { x: 8, y: 5 }]] });
  ogro.hp = ogro.maxHp = 300;
  gob.hp = gob.maxHp = 300;
  d20s(enc, [19]);
  enc.resolveAttack(h, ogro);
  assert.match(texto(), /necrótico em Goblin e Ogro|necrótico em .* e Ogro/);
  h.berloquesDeAlma = 0;
  descansoLongo(h);
  assert.equal(h.berloquesDeAlma, 1);
});

await teste('Lâmina da Alma: a lâmina psíquica na mão, a segunda como ação bônus, e os dados que voltam no descanso', () => {
  const { enc, h, foes: [ogro], texto } = montar(heroi('ladino', 3, 'laminaDaAlma'));
  ogro.hp = ogro.maxHp = 300;
  assert.ok(h.weapons.includes('laminaDaAlma'));
  assert.equal(h.resources.psionicEnergy, 4);
  d20s(enc, [19]);
  enc.attackAction(h, ogro, 'laminaDaAlma');
  assert.match(texto(), /Lâmina Psíquica/);
  assert.ok(enc.useFeature(h, 'segundaLamina', { target: ogro }));
  assert.match(texto(), /Segunda Lâmina Psíquica/);
  // arremessada: 18 m, sem alcance longo
  ogro.pos = { ...ogro.pos, x: 15 };
  assert.ok(!enc.canAttack(h, ogro, 'laminaDaAlma').ok);
  assert.ok(enc.canAttack(h, ogro, 'laminaDaAlmaArremesso').ok, enc.canAttack(h, ogro, 'laminaDaAlmaArremesso').why);
  ogro.pos = { ...ogro.pos, x: 19 };
  assert.ok(!enc.canAttack(h, ogro, 'laminaDaAlmaArremesso').ok, 'além de 18 m, não');
  h.resources.psionicEnergy = 2;
  novoTurno(h);
  assert.ok(enc.useFeature(h, 'psionicPowerSoulknife'));
  assert.equal(h.resources.psionicEnergy, 3);
});

await teste('Lâmina da Alma (9º, 13º e 17º): o Golpe Teleguiado vira o erro; o Teletransporte Psíquico; o Véu; Rasgar a Mente', () => {
  const { enc, h, aliada, foes: [ogro], texto } = montar(heroi('ladino', 17, 'laminaDaAlma'));
  ogro.hp = ogro.maxHp = 300;
  const dadosAntes = h.resources.psionicEnergy;
  // erra por 1: o dado (d12 no 17º) vira o golpe
  const bonus = abilityMod(h.abilities.dex) + 6;
  d20s(enc, [ogro.ac - bonus - 1, 1]);
  enc.resolveAttack(h, ogro, { weaponId: 'laminaDaAlma' });
  assert.match(texto(), /Golpes Teleguiados/);
  assert.equal(h.resources.psionicEnergy, dadosAntes - 1);
  assert.match(texto(), /Rasgar a Mente/);
  assert.ok(hasCondition(ogro, 'atordoado'));
  novoTurno(h);
  dados(enc, 12, [1]);
  const de = { ...h.pos };
  assert.ok(enc.castSpell(h, 'teletransportePsiquico', { point: { x: 5, y: 15 } }).ok);
  assert.ok(h.pos.y > de.y && h.pos.y <= de.y + 2, `o dado 1 leva só 3 m: ${h.pos.y}`);
  novoTurno(h);
  assert.ok(enc.useFeature(h, 'psychicVeil'));
  assert.ok(hasCondition(h, 'invisivel'));
  enc.applyDamage(ogro, 2, 'psíquico', h);
  assert.ok(!hasCondition(h, 'invisivel'), 'ferir rasga o véu');
  assert.ok(aliada);
});

// ------------------------------------------------------------------ feiticeiro

await teste('Mente Aberrante: as magias psiônicas e a Lasca Mental; as Defesas Psíquicas; a Feitiçaria Psiônica paga com pontos sem espaço', () => {
  const { enc, h, foes: [ogro] } = montar(heroi('feiticeiro', 6, 'menteAberrante'));
  assert.ok(h.magiasDeCaracteristica.includes('lascaMental'));
  assert.ok(h.spellcasting.sempreProntas.includes('bracosDeHadar') && h.spellcasting.sempreProntas.includes('detectarPensamentos'));
  const hp = h.hp;
  enc.applyDamage(h, 10, 'psíquico', ogro);
  assert.equal(hp - h.hp, 5, 'resistência a psíquico');
  assert.equal(enc.resistencia(h, 'wis', 30, { contra: { condicao: 'enfeiticado' } }).mode, 'vantagem');
  assert.equal(usoLivreDe(h, SPELLS.bracosDeHadar), null, 'com espaço, sai do espaço');
  h.spellcasting.slots = h.spellcasting.slots.map(() => 0);
  const livre = usoLivreDe(h, SPELLS.bracosDeHadar);
  assert.equal(livre?.tipo, 'pontos');
  assert.equal(livre?.custo, 1);
  const pontos = h.resources.sorceryPoints;
  assert.ok(enc.castSpell(h, 'bracosDeHadar', {}).ok);
  assert.equal(h.resources.sorceryPoints, pontos - 1);
});

await teste('Mente Aberrante (14º e 18º): a Revelação na Carne voa e vê o invisível; a Implosão Distorcida fere e puxa', () => {
  const { enc, h, aliada, foes: [ogro], texto } = montar(heroi('feiticeiro', 18, 'menteAberrante'), { foes: [['ogro', { x: 8, y: 5 }]] });
  ogro.hp = ogro.maxHp = 300;
  aliada.pos = { x: 18, y: 18, f: 1 };
  const pontos = h.resources.sorceryPoints;
  assert.ok(enc.useFeature(h, 'revelationInFlesh', { modo: 'ambos' }));
  assert.equal(h.resources.sorceryPoints, pontos - 2);
  assert.equal(conditionEffects(h).vooFt, 30);
  assert.ok(hasCondition(h, 'veInvisiveis'));
  novoTurno(h);
  d20s(enc, [1]);
  assert.ok(enc.castSpell(h, 'implosaoDistorcida', { point: { x: 5, y: 15 } }).ok);
  assert.equal(h.pos.y, 15);
  assert.ok(ogro.hp < 300, 'o ogro leva o dano');
  assert.match(texto(), /puxado/);
  assert.equal(h.resources.warpingImplosion, 0);
  novoTurno(h);
  const p2 = h.resources.sorceryPoints;
  assert.ok(enc.castSpell(h, 'implosaoDistorcida', { point: { x: 5, y: 5 } }).ok, 'de novo, com 5 pontos');
  assert.equal(h.resources.sorceryPoints, p2 - 5);
});

await teste('Alma Mecânica: Restaurar o Equilíbrio tira a vantagem do inimigo; o Bastião da Lei segura o dano; as magias mecânicas', () => {
  const { enc, h, aliada, foes: [ogro], texto } = montar(heroi('feiticeiro', 6, 'almaMecanica'));
  assert.ok(h.spellcasting.sempreProntas.includes('ajuda') && h.spellcasting.sempreProntas.includes('protecaoContraEnergia'));
  addCondition(aliada, 'caido');
  const usos = h.resources.restoreBalance;
  enc.resolveAttack(ogro, aliada);
  assert.match(texto(), /Restaurar o Equilíbrio/);
  assert.equal(h.resources.restoreBalance, usos - 1);
  const pontos = h.resources.sorceryPoints;
  assert.ok(enc.useFeature(h, 'bastionOfLaw', { target: aliada }));
  assert.equal(aliada.bastiao.dados, Math.min(5, pontos));
  const hp = aliada.hp;
  enc.applyDamage(aliada, 12, 'cortante', ogro);
  assert.ok(hp - aliada.hp < 12, 'o bastião segura');
  assert.match(texto(), /Bastião da Lei/);
});

await teste('Alma Mecânica (14º e 18º): o Transe da Ordem (nada abaixo de 10, ninguém com vantagem); a Cavalgada cura e desfaz magia', () => {
  const { enc, h, aliada, foes: [ogro], texto } = montar(heroi('feiticeiro', 18, 'almaMecanica'));
  assert.ok(enc.useFeature(h, 'tranceOfOrder'));
  d20s(enc, [2]);
  const sv = enc.resistencia(h, 'dex', 10);
  assert.equal(sv.natural, 10);
  addCondition(h, 'caido');
  h.reactionUsed = true;
  assert.equal(enc.attackModifiers(ogro, h).mode, 'vantagem', 'antes do golpe, o caído dá vantagem');
  d20s(enc, [15, 15]);
  enc.resolveAttack(ogro, h);
  assert.match(texto(), /Transe da Ordem|d20\[15\] /);
  novoTurno(h);
  aliada.hp = 5;
  addCondition(aliada, 'lento', { rounds: 10, source: ogro.id, magia: { id: 'lentidao', circulo: 3 } });
  assert.ok(enc.useFeature(h, 'clockworkCavalcade'));
  assert.ok(aliada.hp > 5 && !hasCondition(aliada, 'lento'));
});

// ------------------------------------------------------------------ bruxo

await teste('O Insondável: o tentáculo golpeia de frio e prende o passo, e volta pela ação bônus sem gastar uso; a Dádiva do Mar', () => {
  const { enc, h, foes: [ogro], texto } = montar(heroi('bruxo', 6, 'insondavel'), { foes: [['ogro', { x: 9, y: 5 }]] });
  ogro.hp = ogro.maxHp = 300;
  assert.equal(h.speeds.swimFt, 40);
  const usos = h.resources.tentacleOfTheDeeps;
  d20s(enc, [19]);
  assert.ok(enc.castSpell(h, 'tentaculoDasProfundezas', { target: ogro }).ok);
  assert.ok(ogro.hp < 300 && hasCondition(ogro, 'lento'));
  assert.equal(h.resources.tentacleOfTheDeeps, usos - 1);
  novoTurno(h);
  d20s(enc, [19]);
  const hp = ogro.hp;
  assert.ok(enc.castSpell(h, 'tentaculoDasProfundezas', { target: ogro }).ok);
  assert.ok(ogro.hp < hp, 'golpeia de novo');
  assert.equal(h.resources.tentacleOfTheDeeps, usos - 1, 'sem gastar outro uso');
  // a espiral: o dano perto do tentáculo cai; a alma oceânica resiste a frio
  const hpH = h.hp;
  enc.applyDamage(h, 10, 'frio', ogro);
  assert.equal(hpH - h.hp, 5);
  h.magiasAtivas.tentaculoDasProfundezas.pos = { x: 5, y: 6 };
  const hpA = enc.combatants.find((c) => c.name === 'Dara').hp;
  enc.applyDamage(enc.combatants.find((c) => c.name === 'Dara'), 10, 'cortante', ogro);
  assert.ok(hpA - enc.combatants.find((c) => c.name === 'Dara').hp < 10);
  assert.match(texto(), /Espiral Guardiã/);
});

await teste('O Insondável (10º): os Tentáculos Negros de Evard sem espaço, com PV temporários, e o dano não quebra a concentração', () => {
  const { enc, h, foes: [ogro] } = montar(heroi('bruxo', 10, 'insondavel'), { foes: [['ogro', { x: 9, y: 5 }]] });
  assert.ok(h.magiasDeCaracteristica.includes('tentaculosNegrosDeEvard'));
  assert.equal(usoLivreDe(h, SPELLS.tentaculosNegrosDeEvard)?.tipo, 'agarradores');
  const slots = JSON.stringify(h.spellcasting.slots);
  assert.ok(enc.castSpell(h, 'tentaculosNegrosDeEvard', { point: ogro.pos }).ok);
  assert.equal(JSON.stringify(h.spellcasting.slots), slots);
  assert.equal(h.tempHp, 10);
  enc.applyDamage(h, 40, 'cortante', ogro);
  assert.equal(h.concentrating?.spellId, 'tentaculosNegrosDeEvard');
});

await teste('O Gênio: o tipo escolhido manda na Ira do Gênio (uma vez por turno), na resistência e na lista; a Dádiva Elemental voa', () => {
  assert.ok(['genioEfreeti', 'genioDao', 'genioDjinni', 'genioMarid'].every((id) => SUBCLASSES_1.bruxo.opcoes.some((o) => o.id === id)));
  const { enc, h, foes: [ogro], texto } = montar(heroi('bruxo', 6, 'genio', { geniesVessel: 'dao' }));
  ogro.hp = ogro.maxHp = 300;
  assert.equal(h.tipoDeGenio, 'dao');
  d20s(enc, [19, 19]);
  enc.resolveAttack(h, ogro);
  enc.resolveAttack(h, ogro);
  assert.equal((texto().match(/Ira do Gênio: \+3 de concussão/g) ?? []).length, 1);
  const hp = h.hp;
  enc.applyDamage(h, 10, 'concussão', ogro);
  assert.equal(hp - h.hp, 5);
  assert.ok(enc.useFeature(h, 'elementalGift'));
  assert.equal(conditionEffects(h).vooFt, 30);
  assert.ok(listaDaClasse('bruxo', 5, 'genio', h).magias.includes('muralhaDePedra'));
  assert.ok(!listaDaClasse('bruxo', 5, 'genio', { tipoDeGenio: 'efreeti' }).magias.includes('muralhaDePedra'));
});

// ------------------------------------------------------------------ mago

await teste('Lâmina Cantante: o treino; a canção soma INT na CA e na concentração, +3 m, Acrobacia; para de escudo', () => {
  const { enc, h } = montar(heroi('mago', 2, 'laminaCantante'));
  assert.ok(h.skills.includes('atuacao') && h.weaponTraining.includes('rapieira') && h.armorTraining?.includes?.('leve') !== false);
  const ca = caEfetiva(h);
  const andar = enc.speedOf(h);
  assert.ok(enc.useFeature(h, 'bladesong'));
  assert.equal(caEfetiva(h), ca + 3);
  assert.equal(enc.speedOf(h), andar + 10);
  assert.equal(enc.testeDeAtributo(h, 'dex', 0, 'Acrobacia', { pericia: 'acrobacia' }).mode, 'vantagem');
  assert.ok(enc.resistencia(h, 'con', 10, { contra: { concentracao: true } }).partes.some((p) => p.rotulo === 'Canção da Lâmina'));
  h.shield = true;
  enc.fimDoTurnoDoLado('party'); enc.beginSide('foes'); enc.fimDoTurnoDoLado('foes'); enc.beginSide('party');
  assert.ok(!hasCondition(h, 'cancaoDaLamina'), 'o escudo para a canção');
});

await teste('Lâmina Cantante (6º, 10º e 14º): o truque e o golpe; a Canção da Defesa gasta espaço; a Canção da Vitória soma INT', () => {
  const { enc, h, foes: [ogro], texto } = montar(heroi('mago', 14, 'laminaCantante'));
  ogro.hp = ogro.maxHp = 300;
  h.equippedWeapon = h.weapons[0];
  h.spellcasting.cantrips = [...new Set([...(h.spellcasting.cantrips ?? []), 'raioDeGelo'])];
  const truque = 'raioDeGelo';
  assert.ok(enc.castSpell(h, truque, { target: ogro, point: ogro.pos }).ok, truque);
  assert.ok(enc.useFeature(h, 'golpeDoTruque', { target: ogro }), 'o golpe que sobra');
  novoTurno(h);
  assert.ok(enc.useFeature(h, 'bladesong'));
  d20s(enc, [19]);
  enc.resolveAttack(h, ogro);
  assert.match(texto(), /Canção da Vitória: \+\d+/);
  const espacos = h.spellcasting.slots.reduce((a, b) => a + b, 0);
  const hp = h.hp;
  enc.applyDamage(h, 20, 'cortante', ogro);
  assert.equal(h.spellcasting.slots.reduce((a, b) => a + b, 0), espacos - 1);
  assert.equal(hp - h.hp, 20 - 20, 'o espaço de 4º tira os 20');
});

await teste('Ordem dos Escribas: o Grimório Desperto troca o tipo; o pergaminho do Escrivão Mestre; Um com a Palavra', () => {
  const { enc, h, foes: [ogro], texto } = montar(heroi('mago', 14, 'escribas'), { foes: [['ogro', { x: 7, y: 5 }]] });
  ogro.hp = ogro.maxHp = 300;
  h.spellcasting.livro = [...new Set([...(h.spellcasting.livro ?? []), 'maosFlamejantes'])];
  const frio1 = Object.values(SPELLS).find((s) => s.level === 1 && s.damageType === 'frio' && !s.interna);
  h.spellcasting.livro.push(frio1.id);
  h.spellcasting.prepared = [...new Set([...(h.spellcasting.prepared ?? []), 'maosFlamejantes'])];
  assert.ok(Sub.tiposDoGrimorio(h, SPELLS).includes('frio'));
  assert.ok(enc.useFeature(h, 'awakenedSpellbook', { modo: 'frio' }));
  // o pergaminho sai primeiro (um círculo acima, 2º): o grimório troca pelo frio só se houver frio de 2º no livro
  assert.equal(usoLivreDe(h, SPELLS.maosFlamejantes)?.tipo, 'pergaminho');
  h.resources.masterScrivener = 0;
  ogro.immune = ['frio'];
  assert.ok(enc.castSpell(h, 'maosFlamejantes', { point: ogro.pos, circulo: 1 }).ok);
  assert.equal(ogro.hp, 300, 'o fogo virou frio, e o ogro desta prova é imune a frio');
  assert.ok(texto());
  assert.equal(enc.testeDeAtributo(h, 'int', 0, 'Arcanismo', { pericia: 'arcanismo' }).mode, 'vantagem');
});

console.log(`\n${total - falhas} de ${total} provas passaram`);
if (falhas) process.exit(1);
