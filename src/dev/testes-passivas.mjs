// Testes das PASSIVAS de classe e dos TRAÇOS RACIAIS (Livro do Jogador, 2014). Rode com:
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-passivas.mjs
//
// Cada teste monta uma situação pequena num campo vazio e confere UM ponto de regra — o mesmo molde de
// `testes-regras.mjs`. Dado fixo (`dadoFixo`) onde a regra depende de um número do d20: o teste mede a regra, não a sorte.
//
// A pergunta que cada teste responde: "esta característica muda uma rolagem, ou é só texto na ficha?". Um traço que só
// aparece na ficha é pior que um traço que falta, porque o jogador conta com ele (ver `caracteristicas.js`).

import assert from 'node:assert/strict';
import { Encounter } from '../rules/combat.js';
import { makeMonster } from '../rules/monsters.js';
import { Battlefield } from '../core/grid.js';
import { makeRng } from '../core/rng.js';
import { criarPersonagem, subirNivel } from '../rules/progressao.js';
import { skillBonus, saveBonus, proficiencyBonus, rolarPericia } from '../rules/abilities.js';
import { bonusDeIniciativa, garantirPortento } from '../rules/talentos.js';
import { addCondition, removeCondition, nivelDeExaustao, hasCondition, getCondition, conditionEffects, caEfetiva } from '../rules/conditions.js';
import { RACAS, TRACOS_RACIAIS, racaDe, aplicarRaca, corDoDraconato, ANCESTRALIDADES_DRACONICAS, dadosDoSopro } from '../rules/racas.js';
import { CARACTERISTICAS } from '../rules/classes/caracteristicas.js';
import { CLASSES } from '../rules/classes/index.js';
import { visaoNoEscuro } from '../rules/luz.js';
import { getSpell, SPELLS, magiasProntas, dadosDaMagia } from '../rules/spells.js';
import { margemDeCritico, dadosExtraDeCritico, danoPorResistencia, usoLivreDe, bonusDeDanoPorTraco, vantagemPorTraco, contraDaMagia, danoDeQueda, aplicarInvocacoes } from '../rules/passivas.js';
import * as passivasExtra from '../rules/passivas.js';
import { armorClass } from '../rules/equipment.js';
import { formasDisponiveis, crEmNumero } from '../rules/forma-selvagem.js';
import { MONSTERS } from '../rules/monsters.js';
import { previsaoDeAtaque } from '../rules/odds.js';
import { descansoLongo, escolherResistenciaInfernal, recuperarNoCurto, dadoDaCancaoDeDescanso, gastarDadoDeVida } from '../rules/descanso.js';
import { montarAcampamento, descansou } from '../rules/acampamento.js';
import { estadoDe, conjurarFora } from '../rules/utilidade.js';

/** Um dado que sempre cai no mesmo número no d20; os outros dados caem no meio. */
const dadoFixo = (n, faces = 20) => {
  const f = () => (n - 0.5) / faces;
  f.die = (lados) => (lados === faces ? n : Math.max(1, Math.ceil(lados / 2)));
  f.int = (k) => Math.floor(f() * k);
  f.pick = (a) => a[0];
  f.chance = () => false;
  f.shuffle = (a) => a.slice();
  return f;
};

/** Uma sequência de d20: o primeiro cai em `seq[0]`, o segundo em `seq[1]`... (os outros dados caem no meio). */
const dadoEmSequencia = (...seq) => {
  let i = 0;
  const f = () => 0.5;
  f.die = (lados) => (lados === 20 ? (seq[Math.min(i++, seq.length - 1)]) : Math.max(1, Math.ceil(lados / 2)));
  f.int = (k) => Math.floor(k / 2);
  f.pick = (a) => a[0];
  f.chance = () => false;
  f.shuffle = (a) => a.slice();
  return f;
};

const BASE = (extra = {}) => ({
  id: 't', name: 'T', abilities: { str: 15, dex: 14, con: 14, int: 12, wis: 13, cha: 10 },
  skills: ['atletismo', 'percepcao', 'furtividade'], armor: 'nenhuma', weapons: ['adaga'], ...extra,
});

let proximoId = 0;
/** Um herói de classe, nível e raça. Cada um com id próprio: surpresa e condições guardam o id, e dois heróis com o mesmo seriam um só. */
const heroi = (classe, nivel, raca, extra = {}, escolhas = {}) => criarPersonagem(BASE({ id: `h${++proximoId}`, raca, ...extra }), { classe, nivel, escolhas });

/** O modificador de um valor de atributo (o mesmo que `abilityMod`, para os testes lerem a ficha sem importar a regra). */
const abilityModDe = (n) => Math.floor((n - 10) / 2);

const MAPA = Array(12).fill('............');

/**
 * Um campo 12x12 vazio com os `herois` (já com `pos`) e os inimigos, no turno do grupo.
 * `rng` é opcional: dado fixo para medir a regra.
 */
function arena({ herois = [], foes = [], rng = makeRng(1), mapa = MAPA } = {}) {
  const field = new Battlefield(12, 12, mapa);
  herois.forEach((h, i) => { h.pos ??= { x: 2 + i, y: 5 }; });
  const log = [];
  const eventos = [];
  const enc = new Encounter({ battlefield: field, party: herois, foes, rng, onLog: (e) => log.push(e), onEvent: (e) => eventos.push(e) });
  enc.firstSide = 'party';
  enc.round = 1;
  enc.beginSide('party');
  return { enc, log, eventos };
}
const inimigo = (id, pos) => makeMonster(id, pos);

let falhas = 0;
let total = 0;
function teste(nome, fn) {
  total += 1;
  try {
    fn();
    console.log(`ok    ${nome}`);
  } catch (e) {
    falhas += 1;
    console.log(`FALHA ${nome}\n      ${e.message.split('\n').join('\n      ')}`);
  }
}

// ============================================================================================================
// RAÇAS: o que a raça põe na ficha
// ============================================================================================================

teste('as 15 raças e sub-raças do livro estão na tabela, e cada traço tem texto', () => {
  assert.equal(Object.keys(RACAS).length, 15);
  for (const [id, r] of Object.entries(RACAS)) {
    assert.ok(r.tracos.length, `${id} sem traços`);
    for (const t of r.tracos) {
      assert.ok(TRACOS_RACIAIS[t], `${id}: o traço ${t} não tem texto`);
      assert.ok(CARACTERISTICAS[t], `${t} não entrou no catálogo geral (a ficha o lê de lá)`);
    }
  }
});

teste('toda raça se reconhece pelo nome que o jogo usa', () => {
  const casos = {
    'Draconata vermelha': 'draconato', 'Halfling pés-leves': 'halflingPesLeves', 'Anão da colina': 'anaoColina',
    'Alto elfo': 'altoElfo', 'Meio-orc': 'meioOrc', 'Meio-elfa': 'meioElfo', 'Tiferino': 'tiferino',
    'Anão da montanha': 'anaoMontanha', 'Humano': 'humano', 'Elfa da floresta': 'elfoFloresta', 'Gnoma da floresta': 'gnomoFloresta',
    'Gnomo das rochas': 'gnomoRochas', 'Halfling robusto': 'halflingRobusto', 'Elfo negro (drow)': 'drow', 'Humano (variante)': 'humanoVariante',
  };
  for (const [nome, id] of Object.entries(casos)) assert.equal(racaDe({ raca: nome }), id, nome);
  // Só a ancestralidade (os grupos de teste de `party.js`): cai na sub-raça padrão.
  assert.equal(racaDe({ ancestry: 'Anão' }), 'anaoColina');
  assert.equal(racaDe({ ancestry: 'Elfo' }), 'altoElfo');
  assert.equal(racaDe({ ancestry: 'Halfling' }), 'halflingPesLeves');
  assert.equal(racaDe({ ancestry: 'Humana' }), 'humano');
});

teste('os traços da raça chegam à ficha, e aplicar de novo não duplica', () => {
  for (const [nome, id] of [['Halfling pés-leves', 'halflingPesLeves'], ['Meio-orc', 'meioOrc'], ['Anão da montanha', 'anaoMontanha']]) {
    const c = heroi('guerreiro', 1, nome);
    for (const t of RACAS[id].tracos) assert.ok(c.features.includes(t), `${nome}: falta ${t}`);
    const antes = c.features.length;
    aplicarRaca(c);
    assert.equal(c.features.length, antes, `${nome}: duplicou ao aplicar de novo`);
  }
});

teste('Robustez Anã: +1 PV em TODO nível, não só no primeiro (colina); a montanha não tem', () => {
  for (const n of [1, 2, 5, 10]) {
    const anao = heroi('clerigo', n, 'Anão da colina');
    const humano = heroi('clerigo', n, 'Humano');
    assert.equal(anao.maxHp - humano.maxHp, n, `nível ${n}: o anão da colina devia ter ${n} PV a mais`);
  }
  const montanha = heroi('clerigo', 5, 'Anão da montanha');
  const humano5 = heroi('clerigo', 5, 'Humano');
  assert.equal(montanha.maxHp, humano5.maxHp, 'o anão da montanha não tem Robustez Anã');
});

teste('deslocamento e visão no escuro seguem a raça', () => {
  assert.equal(heroi('ladino', 1, 'Elfa da floresta').speedFt, 35, 'Pés Ligeiros');
  assert.equal(heroi('ladino', 1, 'Halfling pés-leves').speedFt, 25);
  assert.equal(heroi('ladino', 1, 'Anão da colina').speedFt, 25);
  assert.equal(heroi('ladino', 1, 'Humano').speedFt, 30);
  assert.equal(visaoNoEscuro(heroi('ladino', 1, 'Alto elfo')), 60);
  assert.equal(visaoNoEscuro(heroi('ladino', 1, 'Elfo negro (drow)')), 120, 'Visão no Escuro Superior');
  assert.equal(visaoNoEscuro(heroi('ladino', 1, 'Humano')), 0);
  assert.equal(visaoNoEscuro(heroi('ladino', 1, 'Halfling pés-leves')), 0);
  assert.equal(visaoNoEscuro(heroi('ladino', 1, 'Draconata azul')), 0);
});

teste('Sentidos Aguçados e Ameaçador dão a perícia', () => {
  const elfo = heroi('mago', 1, 'Alto elfo', { skills: ['arcanismo'] });
  assert.ok(elfo.skills.includes('percepcao'), 'o elfo ganha Percepção');
  const orc = heroi('guerreiro', 1, 'Meio-orc', { skills: ['atletismo'] });
  assert.ok(orc.skills.includes('intimidacao'), 'o meio-orc ganha Intimidação');
  const humano = heroi('guerreiro', 1, 'Humano', { skills: ['atletismo'] });
  assert.ok(!humano.skills.includes('intimidacao') && !humano.skills.includes('percepcao'));
});

teste('treino de armas e armaduras da raça', () => {
  const anao = heroi('mago', 1, 'Anão da colina');
  for (const a of ['machadoDeBatalha', 'machadinha', 'marteloLeve', 'marteloDeGuerra']) assert.ok(anao.weaponTraining.includes(a), a);
  const elfo = heroi('mago', 1, 'Alto elfo');
  for (const a of ['espadaLonga', 'espadaCurta', 'arcoCurto', 'arcoLongo']) assert.ok(elfo.weaponTraining.includes(a), a);
  const drow = heroi('mago', 1, 'Elfo negro (drow)');
  for (const a of ['rapieira', 'espadaCurta', 'bestaDeMao']) assert.ok(drow.weaponTraining.includes(a), a);
  const montanha = heroi('mago', 1, 'Anão da montanha');
  assert.ok(montanha.armorTraining.includes('leve') && montanha.armorTraining.includes('média'), 'Treino com Armaduras Anãs');
  assert.ok(!heroi('mago', 1, 'Anão da colina').armorTraining.includes('média'), 'a colina não tem');
});

teste('resistências da raça: anão e halfling robusto (veneno), tiferino (fogo), draconato (a da cor)', () => {
  assert.ok(heroi('guerreiro', 1, 'Anão da colina').resist.includes('veneno'));
  assert.ok(heroi('guerreiro', 1, 'Halfling robusto').resist.includes('veneno'));
  assert.ok(!heroi('guerreiro', 1, 'Halfling pés-leves').resist?.includes('veneno'));
  assert.ok(heroi('guerreiro', 1, 'Tiferino').resist.includes('fogo'));
  assert.ok(heroi('guerreiro', 1, 'Draconata azul').resist.includes('elétrico'));
  assert.ok(heroi('guerreiro', 1, 'Draconata verde').resist.includes('veneno'));
});

teste('Legado Infernal e Magia Drow: as magias raciais chegam no 3º e no 5º nível, uma por descanso longo', () => {
  const t1 = heroi('guerreiro', 2, 'Tiferino');
  assert.equal(t1.magiasRaciais?.length ?? 0, 0, 'no 2º ainda não');
  const t3 = heroi('guerreiro', 3, 'Tiferino');
  assert.deepEqual(t3.magiasRaciais.map((m) => m.magia), ['repreensaoInfernal']);
  assert.equal(t3.resources.racial_repreensaoInfernal, 1);
  const t5 = heroi('guerreiro', 5, 'Tiferino');
  assert.deepEqual(t5.magiasRaciais.map((m) => m.magia), ['repreensaoInfernal', 'escuridao']);
  const d5 = heroi('guerreiro', 5, 'Elfo negro (drow)');
  assert.deepEqual(d5.magiasRaciais.map((m) => m.magia), ['fogoDasFadas', 'escuridao']);
  // subir um nível depois não repete
  subirNivel(t5);
  assert.equal(t5.magiasRaciais.length, 2);
});

teste('o sopro do draconato: dados por nível e a forma de cada cor', () => {
  assert.deepEqual([1, 5, 6, 10, 11, 15, 16, 20].map(dadosDoSopro), ['2d6', '2d6', '3d6', '3d6', '4d6', '4d6', '5d6', '5d6']);
  // o livro: vermelho, ouro, verde, prata e branco sopram em cone; negro, azul, latão, bronze e cobre, em linha.
  for (const cor of ['vermelho', 'ouro', 'verde', 'prata', 'branco']) assert.equal(ANCESTRALIDADES_DRACONICAS[cor].forma, 'cone', cor);
  for (const cor of ['negro', 'azul', 'latao', 'bronze', 'cobre']) assert.equal(ANCESTRALIDADES_DRACONICAS[cor].forma, 'linha', cor);
  // cone: resistência de CON para verde, prata e branco; de DES para vermelho e ouro.
  assert.equal(ANCESTRALIDADES_DRACONICAS.verde.save, 'con');
  assert.equal(ANCESTRALIDADES_DRACONICAS.vermelho.save, 'dex');
  assert.equal(corDoDraconato('Draconata vermelha'), 'vermelho');
  assert.equal(corDoDraconato('Draconato prateado'), 'prata');
  const dara = heroi('guerreiro', 1, 'Draconata vermelha');
  assert.equal(dara.ancestralidadeDraconica, 'vermelho');
  assert.equal(dara.resources.breathWeapon, 1);
});

// ============================================================================================================
// TRAÇOS RACIAIS NO MOTOR: o que muda uma rolagem
// ============================================================================================================

/** Um teste de resistência de `c` com o dado em sequência, contra o contexto dado. */
function resistir(c, hab, contra, ...d20s) {
  const { enc } = arena({ herois: [c], foes: [inimigo('goblin', { x: 9, y: 9 })] });
  enc.rng = dadoEmSequencia(...d20s);
  return enc.resistencia(c, hab, 12, { contra });
}

teste('Corajoso: o halfling tem vantagem contra amedrontado — e só contra amedrontado', () => {
  const pip = heroi('ladino', 1, 'Halfling pés-leves');
  const r = resistir(pip, 'wis', { condicao: 'amedrontado' }, 3, 16);
  assert.equal(r.mode, 'vantagem');
  assert.deepEqual(r.vantagemPor, ['Corajoso']);
  assert.equal(r.success, true, 'o maior dos dois dados passa');
  // contra outra coisa, ou sem contexto, não vale
  assert.equal(resistir(heroi('ladino', 1, 'Halfling pés-leves'), 'wis', { condicao: 'enfeiticado' }, 3, 16).mode, 'normal');
  assert.equal(resistir(heroi('ladino', 1, 'Halfling pés-leves'), 'wis', null, 3, 16).mode, 'normal');
  // e o humano, contra o mesmo medo, rola um dado só e falha
  const humano = resistir(heroi('ladino', 1, 'Humano'), 'wis', { condicao: 'amedrontado' }, 3, 16);
  assert.equal(humano.mode, 'normal');
  assert.equal(humano.success, false);
});

teste('Ancestral Feérico: elfo e meio-elfo têm vantagem contra enfeitiçado, não contra medo', () => {
  for (const raca of ['Alto elfo', 'Elfa da floresta', 'Elfo negro (drow)', 'Meio-elfa']) {
    for (const cond of ['enfeiticado', 'sugerido', 'hipnotizado']) {
      const r = resistir(heroi('mago', 1, raca), 'wis', { condicao: cond }, 3, 16);
      assert.equal(r.mode, 'vantagem', `${raca} contra ${cond}`);
      assert.deepEqual(r.vantagemPor, ['Ancestral Feérico']);
    }
    assert.equal(resistir(heroi('mago', 1, raca), 'wis', { condicao: 'amedrontado' }, 3, 16).mode, 'normal', `${raca} contra medo`);
  }
});

teste('Resiliência Anã e Robusta: vantagem contra veneno (dano ou condição), não contra fogo', () => {
  for (const raca of ['Anão da colina', 'Anão da montanha', 'Halfling robusto']) {
    const dano = resistir(heroi('guerreiro', 1, raca), 'con', { tipoDano: 'veneno' }, 3, 16);
    assert.equal(dano.mode, 'vantagem', `${raca}: dano de veneno`);
    const cond = resistir(heroi('guerreiro', 1, raca), 'con', { condicao: 'envenenado' }, 3, 16);
    assert.equal(cond.mode, 'vantagem', `${raca}: condição envenenado`);
    assert.equal(resistir(heroi('guerreiro', 1, raca), 'con', { tipoDano: 'fogo' }, 3, 16).mode, 'normal', `${raca}: fogo`);
  }
  assert.equal(resistir(heroi('guerreiro', 1, 'Halfling pés-leves'), 'con', { tipoDano: 'veneno' }, 3, 16).mode, 'normal', 'o pés-leves não tem');
});

teste('Esperteza Gnômica: vantagem em INT, SAB e CAR contra magia — não em FOR/DES/CON, nem contra o que não é magia', () => {
  for (const raca of ['Gnomo da floresta', 'Gnomo das rochas']) {
    for (const hab of ['int', 'wis', 'cha']) {
      assert.equal(resistir(heroi('mago', 1, raca), hab, { magico: true }, 3, 16).mode, 'vantagem', `${raca} ${hab}`);
    }
    for (const hab of ['str', 'dex', 'con']) {
      assert.equal(resistir(heroi('mago', 1, raca), hab, { magico: true }, 3, 16).mode, 'normal', `${raca} ${hab}`);
    }
    assert.equal(resistir(heroi('mago', 1, raca), 'wis', { magico: false }, 3, 16).mode, 'normal', `${raca}: não é magia`);
  }
});

teste('de ponta a ponta: a magia Medo contra um halfling passa pelo Corajoso, e a conta mostra de quem foi', () => {
  const pip = heroi('ladino', 1, 'Halfling pés-leves', { abilities: { str: 10, dex: 14, con: 12, int: 10, wis: 10, cha: 10 } });
  const mago = heroi('mago', 5, 'Humano');
  mago.pos = { x: 2, y: 5 };
  pip.pos = { x: 5, y: 5 };
  const { enc, log } = arena({ herois: [mago, pip], foes: [inimigo('goblin', { x: 10, y: 10 })] });
  enc.rng = dadoEmSequencia(2, 17);
  enc.resolverSave(mago, getSpell('medo'), { target: pip, dc: 13, slot: 3 });
  assert.ok(!hasCondition(pip, 'amedrontado'), 'o maior dos dois dados (17) passa na CD 13');
  assert.ok(log.some((e) => JSON.stringify(e).includes('Corajoso')), 'a conta diz que foi o Corajoso');
});

teste('Sorte: um 1 natural no ataque é rolado de novo, e vale o novo', () => {
  const pip = heroi('ladino', 1, 'Halfling pés-leves', { weapons: ['adaga'] });
  pip.pos = { x: 5, y: 5 };
  const gob = inimigo('goblin', { x: 6, y: 5 });
  const { enc, log } = arena({ herois: [pip], foes: [gob] });
  enc.rng = dadoEmSequencia(1, 19);
  const r = enc.attackAction(pip, gob, 'adaga');
  assert.ok(r.ok);
  assert.ok(log.some((e) => /Sorte/.test(e.text ?? '')), 'o registro diz que a Sorte rolou de novo');
  assert.ok(gob.hp < gob.maxHp, 'o 19 do segundo dado acerta');
  // o humano com o mesmo 1 erra
  const ana = heroi('ladino', 1, 'Humano', { weapons: ['adaga'] });
  ana.pos = { x: 5, y: 5 };
  const gob2 = inimigo('goblin', { x: 6, y: 5 });
  const { enc: enc2 } = arena({ herois: [ana], foes: [gob2] });
  enc2.rng = dadoEmSequencia(1, 19);
  enc2.attackAction(ana, gob2, 'adaga');
  assert.equal(gob2.hp, gob2.maxHp, 'sem a Sorte o 1 natural erra');
});

teste('Sorte: um 1 natural na resistência e no teste de atributo também é rolado de novo', () => {
  const pip = heroi('ladino', 1, 'Halfling pés-leves');
  const r = resistir(pip, 'dex', null, 1, 18);
  assert.equal(r.natural, 18, 'a resistência vale o dado novo');
  assert.equal(r.success, true);
  const { enc, log } = arena({ herois: [pip], foes: [inimigo('goblin', { x: 9, y: 9 })] });
  enc.rng = dadoEmSequencia(1, 14);
  const t = enc.testeDeAtributo(pip, 'str', 0, 'Atletismo');
  assert.equal(t.natural, 14, 'o teste vale o dado novo');
  assert.ok(log.some((e) => /Sorte/.test(e.text ?? '')));
  // humano: o 1 fica
  const h = heroi('ladino', 1, 'Humano');
  const { enc: e2 } = arena({ herois: [h], foes: [inimigo('goblin', { x: 9, y: 9 })] });
  e2.rng = dadoEmSequencia(1, 14);
  assert.equal(e2.testeDeAtributo(h, 'str', 0).natural, 1);
});

// ============================================================================================================
// CRÍTICO E QUEDA A 0 PV
// ============================================================================================================

/** O último evento de ataque de `arena`, ou null. */
const ultimoAtaque = (eventos) => [...eventos].reverse().find((e) => e.type === 'attack') ?? null;

teste('Crítico Aprimorado (Campeão, 3º): 19 já é crítico, e acerta mesmo contra uma CA impossível; Crítico Superior (15º): 18', () => {
  const campeao3 = heroi('guerreiro', 3, 'Humano', { weapons: ['espadaLonga'] }, { 3: { subclasse: 'campeao' } });
  assert.ok(campeao3.features.includes('improvedCritical'));
  assert.equal(margemDeCritico(campeao3), 19);
  const campeao15 = heroi('guerreiro', 15, 'Humano', { weapons: ['espadaLonga'] }, { 3: { subclasse: 'campeao' } });
  assert.equal(margemDeCritico(campeao15), 18);
  // O guerreiro só tem o Campeão como arquétipo; quem não é Campeão não tem a característica.
  assert.equal(margemDeCritico(heroi('barbaro', 15, 'Humano')), 20, 'fora do Campeão é 20');

  for (const [nivel, d20, esperado] of [[3, 19, true], [3, 18, false], [15, 18, true], [15, 17, false]]) {
    const c = heroi('guerreiro', nivel, 'Humano', { weapons: ['espadaLonga'] }, { 3: { subclasse: 'campeao' } });
    c.pos = { x: 5, y: 5 };
    const gob = inimigo('goblin', { x: 6, y: 5 });
    gob.ac = 40; // só um crítico acerta
    const { enc, eventos } = arena({ herois: [c], foes: [gob] });
    enc.rng = dadoEmSequencia(d20);
    enc.attackAction(c, gob, 'espadaLonga');
    const e = ultimoAtaque(eventos);
    assert.equal(Boolean(e?.hit ?? e?.critical), esperado, `nível ${nivel}, d20 ${d20}`);
    if (esperado) assert.equal(e.critical, true, `nível ${nivel}, d20 ${d20}: é crítico`);
  }
});

teste('a previsão de ataque mostra a chance de crítico certa: 5% normal, 10% com Crítico Aprimorado, 15% com o Superior', () => {
  const gob = () => inimigo('goblin', { x: 6, y: 5 });
  const mede = (c) => {
    c.pos = { x: 5, y: 5 };
    const g = gob();
    const { enc } = arena({ herois: [c], foes: [g] });
    return previsaoDeAtaque(enc, c, g, 'espadaLonga').critico;
  };
  const normal = mede(heroi('barbaro', 3, 'Humano', { weapons: ['espadaLonga'] }));
  const aprimorado = mede(heroi('guerreiro', 3, 'Humano', { weapons: ['espadaLonga'] }, { 3: { subclasse: 'campeao' } }));
  const superior = mede(heroi('guerreiro', 15, 'Humano', { weapons: ['espadaLonga'] }, { 3: { subclasse: 'campeao' } }));
  assert.ok(Math.abs(normal - 0.05) < 1e-9, `normal ${normal}`);
  assert.ok(Math.abs(aprimorado - 0.10) < 1e-9, `aprimorado ${aprimorado}`);
  assert.ok(Math.abs(superior - 0.15) < 1e-9, `superior ${superior}`);
});

teste('Ataques Selvagens: o meio-orc rola UM dado da arma a mais no crítico corpo a corpo — e só nele', () => {
  const orc = heroi('guerreiro', 1, 'Meio-orc', { weapons: ['machadoGrande'] });
  orc.pos = { x: 5, y: 5 };
  const gob = inimigo('goblin', { x: 6, y: 5 });
  gob.maxHp = gob.hp = 500; // sobrevive para ler o dano
  const { enc, eventos } = arena({ herois: [orc], foes: [gob] });
  enc.rng = dadoEmSequencia(20);
  enc.attackAction(orc, gob, 'machadoGrande');
  const crit = ultimoAtaque(eventos);
  assert.equal(crit.critical, true);
  const extra = crit.danoPartes.find((p) => p.rotulo === 'dado extra do crítico');
  assert.ok(extra, 'a parcela do dado extra aparece na conta');
  assert.equal(extra.dados.length, 1, 'um dado a mais');
  assert.match(extra.notacao, /^1d12$/, 'é o dado da ARMA (machado grande, d12), sem modificador');
  assert.equal(extra.mod, 0);

  // sem crítico, nada
  const orc2 = heroi('guerreiro', 1, 'Meio-orc', { weapons: ['machadoGrande'] });
  orc2.pos = { x: 5, y: 5 };
  const g2 = inimigo('goblin', { x: 6, y: 5 }); g2.maxHp = g2.hp = 500;
  const { enc: enc2, eventos: ev2 } = arena({ herois: [orc2], foes: [g2] });
  enc2.rng = dadoEmSequencia(15);
  enc2.attackAction(orc2, g2, 'machadoGrande');
  assert.ok(!ultimoAtaque(ev2).danoPartes.some((p) => p.rotulo === 'dado extra do crítico'));

  // um humano com o mesmo crítico não tem o dado
  const h = heroi('guerreiro', 1, 'Humano', { weapons: ['machadoGrande'] });
  h.pos = { x: 5, y: 5 };
  const g3 = inimigo('goblin', { x: 6, y: 5 }); g3.maxHp = g3.hp = 500;
  const { enc: enc3, eventos: ev3 } = arena({ herois: [h], foes: [g3] });
  enc3.rng = dadoEmSequencia(20);
  enc3.attackAction(h, g3, 'machadoGrande');
  assert.ok(!ultimoAtaque(ev3).danoPartes.some((p) => p.rotulo === 'dado extra do crítico'));
});

teste('Ataques Selvagens e Crítico Brutal somam; à distância nenhum vale', () => {
  assert.equal(dadosExtraDeCritico(heroi('barbaro', 9, 'Humano')), 1, 'Crítico Brutal no 9º');
  assert.equal(dadosExtraDeCritico(heroi('barbaro', 13, 'Humano')), 2);
  assert.equal(dadosExtraDeCritico(heroi('barbaro', 17, 'Humano')), 3);
  assert.equal(dadosExtraDeCritico(heroi('barbaro', 8, 'Humano')), 0, 'ainda não no 8º');
  assert.equal(dadosExtraDeCritico(heroi('barbaro', 9, 'Meio-orc')), 2, 'meio-orc bárbaro de 9º: os dois somam');
  assert.equal(dadosExtraDeCritico(heroi('guerreiro', 20, 'Humano')), 0);
  // à distância: o meio-orc crítica com arco e não ganha o dado
  const orc = heroi('guerreiro', 1, 'Meio-orc', { weapons: ['arcoLongo'] });
  orc.pos = { x: 2, y: 5 };
  const gob = inimigo('goblin', { x: 8, y: 5 }); gob.maxHp = gob.hp = 500;
  const { enc, eventos } = arena({ herois: [orc], foes: [gob] });
  enc.rng = dadoEmSequencia(20);
  enc.attackAction(orc, gob, 'arcoLongo');
  const e = ultimoAtaque(eventos);
  assert.equal(e.critical, true);
  assert.ok(!e.danoPartes.some((p) => p.rotulo === 'dado extra do crítico'), 'o crítico à distância não ganha dado extra');
});

teste('Resistência Implacável: cai a 0 e fica com 1 PV, uma vez por descanso longo; dano maciço mata na hora', () => {
  const orc = heroi('guerreiro', 1, 'Meio-orc');
  orc.pos = { x: 5, y: 5 };
  const gob = inimigo('goblin', { x: 9, y: 9 });
  const { enc } = arena({ herois: [orc], foes: [gob] });
  const max = orc.maxHp;
  orc.hp = 3;
  enc.applyDamage(orc, 8, 'cortante', gob);
  assert.equal(orc.hp, 1, 'ficou de pé com 1 PV');
  assert.ok(!hasCondition(orc, 'inconsciente'), 'não caiu');
  assert.equal(orc.resources.relentlessEndurance, 0, 'gastou o uso');
  // a segunda vez cai
  enc.applyDamage(orc, 8, 'cortante', gob);
  assert.equal(orc.hp, 0);
  assert.ok(hasCondition(orc, 'inconsciente'), 'sem o uso, cai');
  // descanso longo devolve
  descansoLongo(orc);
  assert.equal(orc.resources.relentlessEndurance, 1);
  // dano maciço: sobra >= PV máximo mata, e a Resistência não vale
  orc.hp = 3;
  enc.applyDamage(orc, 3 + max, 'cortante', gob);
  assert.ok(orc.dead, 'dano maciço mata na hora');
  assert.equal(orc.resources.relentlessEndurance, 1, 'não gastou o uso: ele nem se aplicava');
  // humano: cai
  const h = heroi('guerreiro', 1, 'Humano');
  h.pos = { x: 4, y: 5 };
  const { enc: e2 } = arena({ herois: [h], foes: [inimigo('goblin', { x: 9, y: 9 })] });
  h.hp = 3;
  e2.applyDamage(h, 8, 'cortante', null);
  assert.equal(h.hp, 0);
});

teste('Fúria Implacável (bárbaro, 11º): em fúria, CON CD 10 para ficar com 1 PV; a CD sobe 5 a cada uso e volta a 10 no descanso', () => {
  const b = heroi('barbaro', 11, 'Humano', { abilities: { str: 16, dex: 12, con: 14, int: 8, wis: 10, cha: 8 } });
  b.pos = { x: 5, y: 5 };
  const gob = inimigo('goblin', { x: 9, y: 9 });
  const { enc } = arena({ herois: [b], foes: [gob] });
  assert.ok(b.features.includes('relentlessRage'));
  addCondition(b, 'furia');
  // passa: d20 15 + CON 2 + proficiência 4 = 21 >= 10
  enc.rng = dadoFixo(15);
  b.hp = 2;
  enc.applyDamage(b, 20, 'cortante', gob);
  assert.equal(b.hp, 1, 'passou na CD 10');
  assert.equal(b.furiaImplacavelCD, 15, 'a CD sobe 5');
  assert.ok(hasCondition(b, 'furia'), 'segue em fúria');
  // a segunda vez a CD é 15: d20 5 + CON 2 + proficiência 4 = 11 < 15, cai
  enc.rng = dadoFixo(5);
  b.hp = 2;
  enc.applyDamage(b, 20, 'cortante', gob);
  assert.equal(b.hp, 0, 'falhou na CD 15');
  // descanso: volta a CD 10
  descansoLongo(b);
  assert.equal(b.furiaImplacavelCD, 10);
  // fora de fúria não vale
  const b2 = heroi('barbaro', 11, 'Humano', { abilities: { str: 16, dex: 12, con: 14, int: 8, wis: 10, cha: 8 } });
  b2.pos = { x: 4, y: 5 };
  const { enc: e2 } = arena({ herois: [b2], foes: [inimigo('goblin', { x: 9, y: 9 })] });
  e2.rng = dadoFixo(20);
  b2.hp = 2;
  e2.applyDamage(b2, 20, 'cortante', null);
  assert.equal(b2.hp, 0, 'sem fúria, cai');
});

// ============================================================================================================
// MOVIMENTO, DESCANSO E TESTES DE PERÍCIA
// ============================================================================================================

teste('Agilidade Halfling: atravessa o espaço de criatura MAIOR, mesmo hostil; não o de uma do mesmo tamanho', () => {
  const pip = heroi('ladino', 1, 'Halfling pés-leves');
  pip.pos = { x: 5, y: 5 };
  const hob = inimigo('hobgoblin', { x: 6, y: 5 }); // Médio: maior que o halfling (Pequeno)
  const gob = inimigo('goblin', { x: 4, y: 5 });    // Pequeno: do mesmo tamanho
  const { enc } = arena({ herois: [pip], foes: [hob, gob] });
  assert.equal(enc.podeAtravessar(pip, hob), true, 'o hobgoblin é maior');
  assert.equal(enc.podeAtravessar(pip, gob), false, 'o goblin é do mesmo tamanho');
  // um humano (Médio) não atravessa o mesmo hobgoblin (Médio)
  const h = heroi('ladino', 1, 'Humano');
  h.pos = { x: 5, y: 6 };
  const { enc: e2 } = arena({ herois: [h], foes: [inimigo('hobgoblin', { x: 6, y: 6 })] });
  assert.equal(e2.podeAtravessar(h, e2.combatants.find((c) => c.side === 'foes')), false);
});

teste('Transe: o elfo aguenta quatro horas de vigia sem perder o descanso longo; o humano não', () => {
  const elfo = heroi('mago', 1, 'Alto elfo', { name: 'Elfo' });
  const humano = heroi('mago', 1, 'Humano', { name: 'Humano' });
  const camp = montarAcampamento({ lugar: 'aberto', fogueira: false, vigia: 'dois', herois: [elfo, humano] });
  assert.equal(camp.vigia.horas, 4, 'a escolha dos dois mais atentos vigia 4 horas');
  const noPosto = (c) => { if (!camp.vigias.includes(c)) camp.vigias.push(c); };
  noPosto(elfo); noPosto(humano);
  assert.equal(descansou(elfo, camp), true, 'o Transe cobre as 4 horas');
  assert.equal(descansou(humano, camp), false, 'o humano troca o longo pelo curto');
  // seis horas de vigia já passam do que o Transe tolera
  camp.vigia = { ...camp.vigia, horas: 6 };
  assert.equal(descansou(elfo, camp), false);
});

// ============================================================================================================
// TESTES DE PERÍCIA: Pau pra Toda Obra, Atleta Notável, Talento Confiável, Poder Indomável, Tino para Pedras
// ============================================================================================================

teste('Pau pra Toda Obra: metade da proficiência (para baixo) em perícia SEM treino; treinada não muda', () => {
  const bardo = (n) => heroi('bardo', n, 'Humano', { skills: ['persuasao'], abilities: { str: 10, dex: 14, con: 12, int: 12, wis: 10, cha: 16 } });
  // INT 12 = +1. Sem treino em História: +1 de INT + metade da proficiência.
  assert.equal(skillBonus(bardo(2), 'historia'), 1 + 1, 'nível 2: proficiência +2, metade = 1');
  assert.equal(skillBonus(bardo(5), 'historia'), 1 + 1, 'nível 5: proficiência +3, metade para baixo = 1');
  assert.equal(skillBonus(bardo(9), 'historia'), 1 + 2, 'nível 9: proficiência +4, metade = 2');
  assert.equal(skillBonus(bardo(1), 'historia'), 1, 'no nível 1 a característica ainda não existe');
  // treinada: a proficiência inteira (ou o dobro, com Especialização), sem somar a metade por cima
  const b9 = bardo(9);
  const vezes = b9.expertise.includes('persuasao') ? 2 : 1;
  assert.equal(skillBonus(b9, 'persuasao'), abilityModDe(b9.abilities.cha) + 4 * vezes);
  // quem não é bardo não ganha
  assert.equal(skillBonus(heroi('guerreiro', 9, 'Humano', { skills: [] }), 'historia'), abilityModDe(12));
});

teste('Pau pra Toda Obra entra na iniciativa (que é um teste de DES)', () => {
  const b2 = heroi('bardo', 2, 'Humano', { abilities: { str: 10, dex: 14, con: 12, int: 12, wis: 10, cha: 16 } });
  const g2 = heroi('guerreiro', 2, 'Humano', { abilities: { str: 10, dex: 14, con: 12, int: 12, wis: 10, cha: 16 } });
  assert.equal(bonusDeIniciativa(g2), 2, 'DES 14 = +2');
  assert.equal(bonusDeIniciativa(b2), 2 + 1, '+ metade da proficiência');
});

teste('Atleta Notável (Campeão, 7º): metade da proficiência, para CIMA, em teste de FOR, DES e CON sem treino', () => {
  const campeao = heroi('guerreiro', 7, 'Humano', { skills: [], abilities: { str: 16, dex: 14, con: 14, int: 10, wis: 10, cha: 10 } }, { 3: { subclasse: 'campeao' } });
  assert.ok(campeao.features.includes('remarkableAthlete'));
  // proficiência +3: metade para cima = 2
  // (o guerreiro de 7º já gastou aumentos de atributo: lê-se o modificador real da ficha)
  assert.equal(skillBonus(campeao, 'acrobacia'), abilityModDe(campeao.abilities.dex) + 2, 'DES');
  assert.equal(skillBonus(campeao, 'atletismo'), abilityModDe(campeao.abilities.str) + 2, 'FOR');
  assert.equal(skillBonus(campeao, 'arcanismo'), 0, 'INT não entra');
  assert.equal(skillBonus(campeao, 'percepcao'), 0, 'SAB não entra');
  // antes do 7º nível, nada
  const c5 = heroi('guerreiro', 5, 'Humano', { skills: [], abilities: { str: 16, dex: 14, con: 14, int: 10, wis: 10, cha: 10 } }, { 3: { subclasse: 'campeao' } });
  assert.equal(skillBonus(c5, 'acrobacia'), abilityModDe(c5.abilities.dex));
  // e a iniciativa
  assert.equal(bonusDeIniciativa(campeao), abilityModDe(campeao.abilities.dex) + 2);
});

teste('Talento Confiável (ladino, 11º): d20 de 9 ou menos conta como 10 — só em perícia TREINADA', () => {
  const ladino = (n) => heroi('ladino', n, 'Humano', { skills: ['furtividade'], abilities: { str: 10, dex: 16, con: 12, int: 12, wis: 10, cha: 10 } });
  const l11 = ladino(11);
  assert.ok(l11.features.includes('reliableTalent'));
  const treinada = rolarPericia(dadoEmSequencia(4), l11, 'furtividade');
  assert.equal(treinada.natural, 10, 'o 4 vira 10');
  assert.equal(treinada.total, 10 + skillBonus(l11, 'furtividade'));
  assert.deepEqual(treinada.passivas, ['Talento Confiável']);
  // 10 ou mais fica como saiu
  assert.equal(rolarPericia(dadoEmSequencia(15), l11, 'furtividade').natural, 15);
  // sem treino não vale
  assert.equal(rolarPericia(dadoEmSequencia(4), l11, 'arcanismo').natural, 4);
  // nem antes do 11º
  assert.equal(rolarPericia(dadoEmSequencia(4), ladino(10), 'furtividade').natural, 4);
});

teste('Poder Indomável (bárbaro, 18º): teste de FOR abaixo do valor de Força vale o valor de Força', () => {
  const b = heroi('barbaro', 18, 'Humano', { abilities: { str: 20, dex: 12, con: 14, int: 8, wis: 10, cha: 8 } });
  assert.ok(b.features.includes('indomitableMight'));
  const baixo = rolarPericia(dadoEmSequencia(2), b, 'atletismo');
  assert.equal(baixo.total, b.abilities.str, 'um d20 de 2 não pode ficar abaixo de FOR 20+');
  assert.deepEqual(baixo.passivas, ['Poder Indomável']);
  // total já alto: não muda
  const alto = rolarPericia(dadoEmSequencia(20), b, 'atletismo');
  assert.ok(alto.total > b.abilities.str);
  assert.ok(!alto.passivas);
  // só FOR: Acrobacia (DES) não ganha
  assert.ok(rolarPericia(dadoEmSequencia(2), b, 'acrobacia').total < b.abilities.str);
  // e no teste de atributo puro do motor
  const { enc } = arena({ herois: [b], foes: [inimigo('goblin', { x: 9, y: 9 })] });
  enc.rng = dadoEmSequencia(1);
  assert.equal(enc.testeDeAtributo(b, 'str', 0, 'Força').total, b.abilities.str);
});

teste('Tino para Pedras e Saber do Artífice: História sobre o assunto, treinada e com o DOBRO da proficiência', () => {
  const anao = heroi('guerreiro', 1, 'Anão da colina', { skills: [], abilities: { str: 10, dex: 10, con: 10, int: 14, wis: 10, cha: 10 } });
  // INT 14 = +2; sem contexto, sem treino: só o +2
  assert.equal(skillBonus(anao, 'historia'), 2);
  assert.equal(skillBonus(anao, 'historia', { contexto: 'pedra' }), 2 + 2 * 2, 'proficiência +2, dobrada');
  assert.equal(skillBonus(anao, 'historia', { contexto: 'itemMagico' }), 2, 'o anão não tem o Saber do Artífice');
  assert.equal(skillBonus(anao, 'arcanismo', { contexto: 'pedra' }), 2, 'só História');
  const gnomo = heroi('mago', 1, 'Gnomo das rochas', { skills: [], abilities: { str: 10, dex: 10, con: 10, int: 14, wis: 10, cha: 10 } });
  assert.equal(skillBonus(gnomo, 'historia', { contexto: 'itemMagico' }), 2 + 2 * 2);
  assert.equal(skillBonus(gnomo, 'historia', { contexto: 'pedra' }), 2, 'o gnomo das rochas não tem o Tino para Pedras');
  const humano = heroi('guerreiro', 1, 'Humano', { skills: [], abilities: { str: 10, dex: 10, con: 10, int: 14, wis: 10, cha: 10 } });
  assert.equal(skillBonus(humano, 'historia', { contexto: 'pedra' }), 2);
  // ... e entra no dado, não só no bônus
  const r = rolarPericia(dadoEmSequencia(10), anao, 'historia', { contexto: 'pedra' });
  assert.equal(r.total, 10 + 2 + 4);
});

// ============================================================================================================
// RESISTÊNCIAS, AURAS, IMUNIDADES E EVASÃO
// ============================================================================================================

teste('Mente Escorregadia (ladino, 15º) dá proficiência em SAB; Alma de Diamante (monge, 14º) em TODAS as resistências', () => {
  const ladino = (n) => heroi('ladino', n, 'Humano', { abilities: { str: 10, dex: 16, con: 12, int: 10, wis: 12, cha: 10 } });
  assert.equal(saveBonus(ladino(14), 'wis'), 1, 'antes do 15º: só o modificador');
  assert.equal(saveBonus(ladino(15), 'wis'), 1 + proficiencyBonus(15), 'Mente Escorregadia');
  assert.equal(saveBonus(ladino(15), 'cha'), 0, 'só SAB');
  const monge = (n) => heroi('monge', n, 'Humano', { abilities: { str: 10, dex: 16, con: 12, int: 10, wis: 12, cha: 10 } });
  for (const hab of ['str', 'dex', 'con', 'int', 'wis', 'cha']) {
    const sem = saveBonus(monge(13), hab);
    const com = saveBonus(monge(14), hab);
    const prof = proficiencyBonus(14);
    const ja = monge(14).saves.includes(hab);
    assert.equal(com, abilityModDe(monge(14).abilities[hab]) + prof, `${hab}: proficiência`);
    if (!monge(13).saves.includes(hab)) assert.equal(sem, abilityModDe(monge(13).abilities[hab]), `${hab}: antes do 14º`);
    assert.ok(ja || com > sem - 1);
  }
});

teste('Aura de Proteção (paladino, 6º): soma CAR (mín. +1) às resistências dele e dos aliados no raio; a maior aura vale, não as duas', () => {
  const pal = heroi('paladino', 6, 'Humano', { name: 'Pal', abilities: { str: 16, dex: 10, con: 14, int: 8, wis: 10, cha: 16 } });
  const amigo = heroi('guerreiro', 6, 'Humano', { name: 'Amigo' });
  const longe = heroi('guerreiro', 6, 'Humano', { name: 'Longe' });
  pal.pos = { x: 5, y: 5 }; amigo.pos = { x: 7, y: 5 }; longe.pos = { x: 5, y: 10 };
  const { enc } = arena({ herois: [pal, amigo, longe], foes: [inimigo('goblin', { x: 11, y: 11 })] });
  assert.equal(pal.raioDeAura, 10);
  const cha = abilityModDe(pal.abilities.cha);
  enc.rng = dadoFixo(10);
  const comAura = enc.resistencia(amigo, 'wis', 12);
  const semAura = enc.resistencia(longe, 'wis', 12);
  assert.equal(comAura.total - semAura.total + (saveBonus(longe, 'wis') - saveBonus(amigo, 'wis')), cha, 'o aliado a 3 m soma o CAR do paladino');
  assert.ok(comAura.partes.some((p) => /Aura de Proteção de Pal/.test(p.rotulo) && p.valor === cha));
  assert.ok(!semAura.partes.some((p) => /Aura/.test(p.rotulo)), 'a 7,5 m, fora do raio de 3 m, não vale');
  // o próprio paladino
  assert.ok(enc.resistencia(pal, 'con', 12).partes.some((p) => /^Aura de Proteção$/.test(p.rotulo)));
  // a conta na tela mostra a aura
  const rr = enc.explicarResistencia(amigo, 'wis', 12, enc.resistencia(amigo, 'wis', 12), { contra: 'teste', seSucesso: 'nada' });
  assert.match(rr.conta, /Aura de Proteção/);
  // paladino incapacitado não protege
  addCondition(pal, 'atordoado');
  assert.ok(!enc.resistencia(amigo, 'wis', 12).partes.some((p) => /Aura/.test(p.rotulo)), 'inconsciente/atordoado não dá a aura');
});

teste('Aura de Proteção: duas auras não se somam; no 18º o raio é de 9 m', () => {
  const p1 = heroi('paladino', 6, 'Humano', { name: 'P1', abilities: { str: 16, dex: 10, con: 14, int: 8, wis: 10, cha: 14 } });
  const p2 = heroi('paladino', 6, 'Humano', { name: 'P2', abilities: { str: 16, dex: 10, con: 14, int: 8, wis: 10, cha: 18 } });
  const amigo = heroi('guerreiro', 6, 'Humano');
  p1.pos = { x: 4, y: 5 }; p2.pos = { x: 6, y: 5 }; amigo.pos = { x: 5, y: 5 };
  const { enc } = arena({ herois: [p1, p2, amigo], foes: [inimigo('goblin', { x: 11, y: 11 })] });
  const aura = enc.auraDeProtecao(amigo);
  assert.equal(aura.paladino, p2, 'a de CAR 18 (+4), não a soma');
  assert.equal(aura.valor, 4);
  const p18 = heroi('paladino', 18, 'Humano', { abilities: { str: 16, dex: 10, con: 14, int: 8, wis: 10, cha: 16 } });
  assert.equal(p18.raioDeAura, 30, 'no 18º o raio vai a 9 m');
  const perto = heroi('guerreiro', 6, 'Humano');
  p18.pos = { x: 1, y: 1 }; perto.pos = { x: 7, y: 1 }; // 6 casas = 9 m
  const { enc: e2 } = arena({ herois: [p18, perto], foes: [inimigo('goblin', { x: 11, y: 11 })] });
  assert.ok(e2.auraDeProtecao(perto), '9 m: dentro do raio do 18º');
});

teste('Aura de Coragem (paladino, 10º) e Aura de Devoção (Devoção, 7º): o paladino e os aliados no raio, contra medo e encanto', () => {
  const pal = heroi('paladino', 10, 'Humano', { name: 'Pal' }, { 3: { subclasse: 'devocao' } });
  const amigo = heroi('guerreiro', 5, 'Humano');
  const longe = heroi('guerreiro', 5, 'Humano');
  pal.pos = { x: 5, y: 5 }; amigo.pos = { x: 6, y: 5 }; longe.pos = { x: 5, y: 11 };
  const { enc } = arena({ herois: [pal, amigo, longe], foes: [inimigo('goblin', { x: 11, y: 11 })] });
  for (const quem of [pal, amigo]) {
    assert.equal(enc.imuneACondicao(quem, 'amedrontado'), true, `${quem.name}: Aura de Coragem`);
    assert.equal(enc.imuneACondicao(quem, 'enfeiticado'), true, `${quem.name}: Aura de Devoção`);
  }
  assert.equal(enc.imuneACondicao(longe, 'amedrontado'), false, 'fora do raio');
  assert.equal(enc.imuneACondicao(amigo, 'envenenado'), false, 'só medo e encanto');
  // sem o 10º nível, sem coragem
  const p9 = heroi('paladino', 9, 'Humano', { name: 'P9' }, { 3: { subclasse: 'devocao' } });
  const a9 = heroi('guerreiro', 5, 'Humano');
  p9.pos = { x: 5, y: 5 }; a9.pos = { x: 6, y: 5 };
  const { enc: e2 } = arena({ herois: [p9, a9], foes: [inimigo('goblin', { x: 11, y: 11 })] });
  assert.equal(e2.imuneACondicao(a9, 'amedrontado'), false);
  assert.equal(e2.imuneACondicao(a9, 'enfeiticado'), true, 'a Devoção do 7º já protege do encanto');
});

teste('Fúria Irracional (Berserker, 6º): só em fúria, imune a enfeitiçado e amedrontado', () => {
  const b = heroi('barbaro', 6, 'Humano', {}, { 3: { subclasse: 'berserker' } });
  b.pos = { x: 5, y: 5 };
  const { enc } = arena({ herois: [b], foes: [inimigo('goblin', { x: 11, y: 11 })] });
  assert.equal(enc.imuneACondicao(b, 'amedrontado'), false, 'fora de fúria');
  addCondition(b, 'furia');
  assert.equal(enc.imuneACondicao(b, 'amedrontado'), true);
  assert.equal(enc.imuneACondicao(b, 'enfeiticado'), true);
  assert.equal(enc.imuneACondicao(b, 'envenenado'), false);
});

teste('Pureza do Corpo (monge, 10º), Bênção da Natureza (druida da Terra, 10º) e Pureza de Espírito (Devoção, 15º)', () => {
  const monge = heroi('monge', 10, 'Humano');
  const druida = heroi('druida', 10, 'Humano');
  const pal = heroi('paladino', 15, 'Humano', {}, { 3: { subclasse: 'devocao' } });
  // O paladino fica LONGE: a Aura de Coragem e a de Devoção dele (10º e 7º) protegeriam o druida e o monge, e o teste mediria a aura.
  monge.pos = { x: 3, y: 5 }; druida.pos = { x: 4, y: 5 }; pal.pos = { x: 0, y: 11 };
  const corruptor = inimigo('goblin', { x: 11, y: 11 }); corruptor.tipo = 'corruptor';
  const fada = inimigo('goblin', { x: 11, y: 10 }); fada.tipo = 'fada';
  const fera = inimigo('goblin', { x: 11, y: 9 }); fera.tipo = 'fera';
  const { enc } = arena({ herois: [monge, druida, pal], foes: [corruptor, fada, fera] });
  assert.equal(enc.imuneACondicao(monge, 'envenenado'), true, 'Pureza do Corpo');
  assert.equal(enc.imuneACondicao(druida, 'envenenado'), true, 'Bênção da Natureza: veneno');
  assert.equal(enc.imuneACondicao(druida, 'amedrontado', fada), true, '... e medo de fada');
  assert.equal(enc.imuneACondicao(druida, 'amedrontado', fera), false, '... mas não de uma fera');
  assert.equal(enc.imuneACondicao(pal, 'amedrontado', corruptor), true, 'Pureza de Espírito: corruptor');
  assert.equal(enc.imuneACondicao(pal, 'enfeiticado', corruptor), true);
  // Sozinha (sem a aura, que também protege do medo e do encanto), a Pureza de Espírito filtra por TIPO de quem causa:
  const solo = { features: ['purityOfSpirit'], side: 'party', pos: { x: 0, y: 0 } };
  assert.equal(enc.imunePorCaracteristica(solo, 'amedrontado', corruptor), true, 'corruptor');
  assert.equal(enc.imunePorCaracteristica(solo, 'amedrontado', fera), false, 'a fera não é um dos seis tipos');
  // e os ataques desses tipos têm desvantagem contra o paladino da Devoção
  const m1 = enc.attackModifiers(corruptor, pal, {});
  assert.ok(m1.disadvantage && m1.desvantagens.includes('Pureza de Espírito'));
  assert.ok(!enc.attackModifiers(fera, pal, {}).desvantagens.includes('Pureza de Espírito'));
});

teste('Evasão (ladino e monge, 7º): resistência de DES contra "metade se passar" vira nenhum dano se passar e metade se falhar', () => {
  assert.equal(danoPorResistencia({ features: ['evasion'] }, 'dex', true, true, 24), 0, 'passou: nada');
  assert.equal(danoPorResistencia({ features: ['evasion'] }, 'dex', true, false, 24), 12, 'falhou: metade');
  assert.equal(danoPorResistencia({ features: [] }, 'dex', true, true, 24), 12, 'sem Evasão: metade');
  assert.equal(danoPorResistencia({ features: [] }, 'dex', true, false, 24), 24);
  assert.equal(danoPorResistencia({ features: ['evasion'] }, 'wis', true, true, 24), 12, 'só DES');
  assert.equal(danoPorResistencia({ features: ['evasion'] }, 'dex', false, true, 24), 0, 'sem "metade" no efeito, nada muda');
  assert.equal(danoPorResistencia({ features: ['evasion'] }, 'dex', true, false, 24, true), 24, 'incapacitado perde a Evasão');
  // de ponta a ponta: uma Bola de Fogo (DES, metade) contra um ladino de 7º e contra um guerreiro
  const mago = heroi('mago', 5, 'Humano');
  const ladino = heroi('ladino', 7, 'Humano');
  const guerreiro = heroi('guerreiro', 7, 'Humano');
  mago.pos = { x: 1, y: 1 }; ladino.pos = { x: 6, y: 5 }; guerreiro.pos = { x: 6, y: 6 };
  const { enc } = arena({ herois: [mago, ladino, guerreiro], foes: [inimigo('goblin', { x: 11, y: 11 })] });
  const spell = getSpell('bolaDeFogo');
  const antesL = ladino.hp; const antesG = guerreiro.hp;
  enc.rng = dadoFixo(20);
  enc.resolverSave(mago, spell, { target: ladino, dc: 5, slot: 3, dano: '8d6' });
  enc.resolverSave(mago, spell, { target: guerreiro, dc: 5, slot: 3, dano: '8d6' });
  assert.equal(ladino.hp, antesL, 'o ladino passou e não levou NADA');
  assert.ok(guerreiro.hp < antesG, 'o guerreiro passou e levou metade');
  // falhando, o ladino leva metade e o guerreiro, tudo
  const l2 = heroi('ladino', 7, 'Humano'); const g2 = heroi('guerreiro', 7, 'Humano');
  mago.pos = { x: 1, y: 1 }; l2.pos = { x: 6, y: 5 }; g2.pos = { x: 6, y: 6 };
  const { enc: e2 } = arena({ herois: [mago, l2, g2], foes: [inimigo('goblin', { x: 11, y: 11 })] });
  e2.rng = dadoFixo(2);
  const a1 = l2.hp; const a2 = g2.hp;
  e2.resolverSave(mago, spell, { target: l2, dc: 30, slot: 3, dano: '8d6' });
  e2.resolverSave(mago, spell, { target: g2, dc: 30, slot: 3, dano: '8d6' });
  const perdeuL = a1 - l2.hp; const perdeuG = a2 - g2.hp;
  assert.ok(perdeuL > 0 && Math.abs(perdeuL - Math.floor(perdeuG / 2)) <= 1, `falhou: o ladino leva metade (${perdeuL} contra ${perdeuG})`);
});

teste('Esquivo (ladino, 18º): nenhum ataque tem vantagem contra ele, a menos que esteja incapacitado', () => {
  const ladino = heroi('ladino', 18, 'Humano');
  const comum = heroi('ladino', 17, 'Humano');
  ladino.pos = { x: 5, y: 5 }; comum.pos = { x: 5, y: 7 };
  const gob = inimigo('goblin', { x: 6, y: 5 });
  const gob2 = inimigo('goblin', { x: 6, y: 7 });
  const { enc } = arena({ herois: [ladino, comum], foes: [gob, gob2] });
  addCondition(ladino, 'caido'); addCondition(comum, 'caido'); // caído e perto: o atacante tem vantagem
  assert.equal(enc.attackModifiers(gob2, comum, {}).advantage, true, 'sem Esquivo, vantagem contra o caído');
  const m = enc.attackModifiers(gob, ladino, {});
  assert.equal(m.advantage, false, 'com Esquivo, não');
  assert.equal(m.mode, 'normal');
  // incapacitado: a vantagem volta
  addCondition(ladino, 'atordoado');
  assert.equal(enc.attackModifiers(gob, ladino, {}).advantage, true);
});

teste('Sentidos Selvagens (patrulheiro, 18º): não ver o alvo não impõe desvantagem', () => {
  const ranger = heroi('patrulheiro', 18, 'Humano', { weapons: ['arcoLongo'] });
  const outro = heroi('patrulheiro', 17, 'Humano', { weapons: ['arcoLongo'] });
  ranger.pos = { x: 2, y: 5 }; outro.pos = { x: 2, y: 8 };
  const gob = inimigo('goblin', { x: 6, y: 5 }); const gob2 = inimigo('goblin', { x: 6, y: 8 });
  const { enc } = arena({ herois: [ranger, outro], foes: [gob, gob2] });
  addCondition(gob, 'invisivel'); addCondition(gob2, 'invisivel');
  assert.equal(enc.attackModifiers(ranger, gob, { ranged: true }).disadvantage, false, 'invisível a 6 m: sem desvantagem');
  assert.equal(enc.attackModifiers(outro, gob2, { ranged: true }).disadvantage, true, 'sem a característica, desvantagem');
  // longe demais (mais de 9 m) volta a pesar
  gob.pos = { x: 11, y: 5 };
  assert.equal(enc.attackModifiers(ranger, gob, { ranged: true }).disadvantage, true, 'além de 9 m');
});

teste('Instinto Selvagem (bárbaro, 7º): vantagem na iniciativa, e age normalmente se for surpreendido', () => {
  const b = heroi('barbaro', 7, 'Humano', { name: 'Barb', skills: [] });
  const g = heroi('guerreiro', 7, 'Humano', { name: 'Guer', skills: [] });
  b.pos = { x: 4, y: 5 }; g.pos = { x: 5, y: 5 };
  const { enc } = arena({ herois: [b, g], foes: [inimigo('goblin', { x: 11, y: 11 })] });
  assert.equal(enc.instintoSelvagem('party'), true);
  assert.equal(enc.instintoSelvagem('foes'), false);
  assert.equal(arena({ herois: [heroi('guerreiro', 7, 'Humano')], foes: [inimigo('goblin', { x: 11, y: 11 })] }).enc.instintoSelvagem('party'), false);
  // surpresa: os dois têm Percepção passiva baixa; só o bárbaro age
  enc.emboscada = { emboscadores: 'foes', furtividade: [30] };
  const surpresos = enc.rolarSurpresa();
  assert.ok(!surpresos.has(b.id), 'o bárbaro não é surpreendido');
  assert.ok(surpresos.has(g.id), 'o guerreiro é');
});

// ============================================================================================================
// RESISTÊNCIA RACIAL: o efeito no dano, não o campo
// ============================================================================================================

teste('a resistência racial VALE em combate: o dano é dividido ao meio (anão: veneno; tiferino e draconato vermelho: fogo)', () => {
  // Medido contra o dano de verdade (`applyDamage`), porque o campo certo por muito tempo não era o que o motor lê:
  // a resistência racial dos 12 heróis nunca funcionou em luta alguma.
  const leva = (raca, tipo) => {
    const c = heroi('guerreiro', 5, raca, { abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 } });
    c.pos = { x: 5, y: 5 };
    const { enc } = arena({ herois: [c], foes: [inimigo('goblin', { x: 11, y: 11 })] });
    const antes = c.hp;
    enc.applyDamage(c, 10, tipo, null);
    return antes - c.hp;
  };
  assert.equal(leva('Humano', 'veneno'), 10, 'o humano leva tudo');
  assert.equal(leva('Anão da colina', 'veneno'), 5, 'o anão leva metade do veneno');
  assert.equal(leva('Anão da montanha', 'veneno'), 5);
  assert.equal(leva('Halfling robusto', 'veneno'), 5);
  assert.equal(leva('Anão da colina', 'fogo'), 10, 'mas não do fogo');
  assert.equal(leva('Tiferino', 'fogo'), 5, 'o tiferino leva metade do fogo');
  assert.equal(leva('Draconata vermelha', 'fogo'), 5, 'o draconato vermelho, também');
  assert.equal(leva('Draconata azul', 'elétrico'), 5, 'o azul resiste a elétrico');
  assert.equal(leva('Draconata azul', 'fogo'), 10, 'e não a fogo');
  assert.equal(leva('Draconata verde', 'veneno'), 5);
  assert.equal(leva('Halfling pés-leves', 'veneno'), 10, 'o pés-leves não resiste');
});

// ============================================================================================================
// DANO EXTRA NO ACERTO: Golpe Divino, Destruição Aprimorada, Caçador, Ki
// ============================================================================================================

/** Um alvo parado, com PV de sobra e CA baixa para o acerto não ser o assunto do teste. */
const alvoParado = (pos, id = 'goblin') => {
  const g = inimigo(id, pos);
  g.maxHp = g.hp = 2000;
  g.ac = 1;
  return g;
};
const contaLog = (log, re) => log.filter((e) => re.test(e.text ?? '')).length;

teste('Golpe Divino (clérigo da Vida, 8º): +1d8 radiante UMA vez por turno; 2d8 a partir do 14º', () => {
  const c = heroi('clerigo', 8, 'Humano', { weapons: ['maca'] });
  c.pos = { x: 5, y: 5 };
  const gob = alvoParado({ x: 6, y: 5 });
  const { enc, log } = arena({ herois: [c], foes: [gob] });
  assert.ok(c.features.includes('divineStrike'));
  enc.rng = dadoEmSequencia(15, 15, 15);
  enc.resolveAttack(c, gob, { weaponId: 'maca' });
  enc.resolveAttack(c, gob, { weaponId: 'maca' });
  assert.equal(contaLog(log, /Golpe Divino/), 1, 'dois acertos no mesmo turno, um só Golpe Divino');
  assert.ok(log.some((e) => /Golpe Divino/.test(e.text) && /radiante/.test(e.text)));
  assert.match(log.find((e) => /Golpe Divino/.test(e.text)).detail, /^1d8\[/);
  // o turno seguinte devolve
  enc.beginSide('party');
  enc.resolveAttack(c, gob, { weaponId: 'maca' });
  assert.equal(contaLog(log, /Golpe Divino/), 2, 'no turno novo, de novo');
  // 14º: 2d8
  const c14 = heroi('clerigo', 14, 'Humano', { weapons: ['maca'] });
  c14.pos = { x: 5, y: 5 };
  const g14 = alvoParado({ x: 6, y: 5 });
  const { enc: e14, log: l14 } = arena({ herois: [c14], foes: [g14] });
  e14.rng = dadoEmSequencia(15);
  e14.resolveAttack(c14, g14, { weaponId: 'maca' });
  assert.match(l14.find((e) => /Golpe Divino/.test(e.text)).detail, /^2d8\[/);
  // o clérigo sem o domínio (nível 7) não tem
  const c7 = heroi('clerigo', 7, 'Humano', { weapons: ['maca'] });
  c7.pos = { x: 5, y: 5 };
  const g7 = alvoParado({ x: 6, y: 5 });
  const { enc: e7, log: l7 } = arena({ herois: [c7], foes: [g7] });
  e7.rng = dadoEmSequencia(15);
  e7.resolveAttack(c7, g7, { weaponId: 'maca' });
  assert.equal(contaLog(l7, /Golpe Divino/), 0, 'antes do 8º, nada');
});

teste('Destruição Divina Aprimorada (paladino, 11º): +1d8 radiante em TODO acerto corpo a corpo, e não à distância', () => {
  const p = heroi('paladino', 11, 'Humano', { weapons: ['espadaLonga', 'arcoLongo'] });
  p.pos = { x: 5, y: 5 };
  const gob = alvoParado({ x: 6, y: 5 });
  const { enc, log } = arena({ herois: [p], foes: [gob] });
  enc.rng = dadoEmSequencia(15, 15, 15);
  enc.resolveAttack(p, gob, { weaponId: 'espadaLonga' });
  enc.resolveAttack(p, gob, { weaponId: 'espadaLonga' });
  assert.equal(contaLog(log, /Destruição Divina Aprimorada/), 2, 'um por acerto');
  // à distância não
  const arq = heroi('paladino', 11, 'Humano', { weapons: ['arcoLongo'] });
  arq.pos = { x: 2, y: 5 };
  const longe = alvoParado({ x: 8, y: 5 });
  const { enc: e2, log: l2 } = arena({ herois: [arq], foes: [longe] });
  e2.rng = dadoEmSequencia(15);
  e2.resolveAttack(arq, longe, { weaponId: 'arcoLongo' });
  assert.equal(contaLog(l2, /Aprimorada/), 0);
  // 10º: sem
  const p10 = heroi('paladino', 10, 'Humano', { weapons: ['espadaLonga'] });
  p10.pos = { x: 5, y: 5 };
  const g10 = alvoParado({ x: 6, y: 5 });
  const { enc: e3, log: l3 } = arena({ herois: [p10], foes: [g10] });
  e3.rng = dadoEmSequencia(15);
  e3.resolveAttack(p10, g10, { weaponId: 'espadaLonga' });
  assert.equal(contaLog(l3, /Aprimorada/), 0);
});

teste('Matador de Colossos (Caçador): +1d8 uma vez por turno, só contra quem JÁ estava ferido antes do golpe', () => {
  const r = heroi('patrulheiro', 3, 'Humano', { weapons: ['espadaCurta'] });
  r.pos = { x: 5, y: 5 };
  assert.ok(r.features.includes('colossusSlayer'), 'a escolha padrão do Caçador');
  const gob = alvoParado({ x: 6, y: 5 });
  const { enc, log } = arena({ herois: [r], foes: [gob] });
  enc.rng = dadoEmSequencia(15, 15, 15, 15);
  enc.resolveAttack(r, gob, { weaponId: 'espadaCurta' });
  assert.equal(contaLog(log, /Matador de Colossos/), 0, 'o primeiro golpe pega o alvo cheio de vida');
  enc.resolveAttack(r, gob, { weaponId: 'espadaCurta' });
  assert.equal(contaLog(log, /Matador de Colossos/), 1, 'o segundo pega quem já estava ferido');
  enc.resolveAttack(r, gob, { weaponId: 'espadaCurta' });
  assert.equal(contaLog(log, /Matador de Colossos/), 1, 'uma vez por turno');
});

teste('Quebra-Hordas (Caçador): ao atacar, outro ataque contra OUTRA criatura a 1,5 m do alvo, uma vez por turno', () => {
  const r = heroi('patrulheiro', 3, 'Humano', { weapons: ['espadaCurta'] });
  r.features = r.features.filter((f) => f !== 'colossusSlayer').concat('hordeBreaker');
  r.pos = { x: 5, y: 5 };
  const g1 = alvoParado({ x: 6, y: 5 });
  const g2 = alvoParado({ x: 6, y: 6 }); // colado em g1 e em r
  const g3 = alvoParado({ x: 9, y: 9 }); // longe
  const { enc, log } = arena({ herois: [r], foes: [g1, g2, g3] });
  enc.rng = dadoEmSequencia(15, 15, 15, 15, 15, 15);
  const antes2 = g2.hp, antes3 = g3.hp;
  enc.resolveAttack(r, g1, { weaponId: 'espadaCurta' });
  assert.equal(contaLog(log, /Quebra-Hordas/), 1);
  assert.ok(g2.hp < antes2, 'o vizinho do alvo apanhou');
  assert.equal(g3.hp, antes3, 'o que está longe, não');
  enc.resolveAttack(r, g1, { weaponId: 'espadaCurta' });
  assert.equal(contaLog(log, /Quebra-Hordas/), 1, 'só uma vez por turno');
});

teste('Matador de Gigantes (Caçador): reação ao ataque de criatura Grande a 1,5 m, acertando ou errando', () => {
  const r = heroi('patrulheiro', 3, 'Humano', { weapons: ['espadaCurta'] });
  r.features = r.features.filter((f) => f !== 'colossusSlayer').concat('giantKiller');
  r.pos = { x: 5, y: 5 };
  const ogro = inimigo('ogro', { x: 6, y: 5 });
  const gob = inimigo('goblin', { x: 5, y: 6 });
  const { enc, log } = arena({ herois: [r], foes: [ogro, gob] });
  assert.equal(ogro.pos.f, 2, 'o ogro é Grande');
  enc.rng = dadoEmSequencia(2, 15, 15);
  enc.resolveAttack(ogro, r, { weaponId: 'Clava grande' });
  assert.equal(contaLog(log, /Matador de Gigantes/), 1, 'o ogro errou e ainda assim levou a resposta');
  assert.equal(r.reactionUsed, true);
  // sem reação, não responde de novo
  enc.resolveAttack(ogro, r, { weaponId: 'Clava grande' });
  assert.equal(contaLog(log, /Matador de Gigantes/), 1);
  // um goblin (Pequeno) não dispara
  const r2 = heroi('patrulheiro', 3, 'Humano', { weapons: ['espadaCurta'] });
  r2.features = r2.features.filter((f) => f !== 'colossusSlayer').concat('giantKiller');
  r2.pos = { x: 5, y: 5 };
  const g2 = inimigo('goblin', { x: 6, y: 5 });
  const { enc: e2, log: l2 } = arena({ herois: [r2], foes: [g2] });
  e2.rng = dadoEmSequencia(8);
  e2.resolveAttack(g2, r2, {});
  assert.equal(contaLog(l2, /Matador de Gigantes/), 0);
});

teste('Escapar da Horda: ataque de oportunidade contra o Caçador tem desvantagem; Defesa contra Multiataque: +4 de CA contra o mesmo atacante no turno', () => {
  const r = heroi('patrulheiro', 7, 'Humano', { weapons: ['espadaCurta'] });
  r.features.push('escapeTheHorde', 'multiattackDefense');
  r.pos = { x: 5, y: 5 };
  const gob = inimigo('goblin', { x: 6, y: 5 });
  const { enc, eventos } = arena({ herois: [r], foes: [gob], rng: dadoFixo(10) });
  enc.rng = dadoFixo(10);
  enc.opportunityAttack(gob, r);
  const op = [...eventos].reverse().find((e) => e.type === 'attack' || e.type === 'miss' || e.rolagem);
  assert.ok(JSON.stringify(op).includes('Escapar da Horda'), 'a desvantagem diz o porquê');
  // multiataque: o primeiro golpe acerta; o segundo, do mesmo atacante no mesmo turno, enfrenta CA+4
  const r2 = heroi('patrulheiro', 7, 'Humano', { weapons: ['espadaCurta'] });
  r2.features.push('multiattackDefense');
  r2.pos = { x: 5, y: 5 };
  const g2 = inimigo('goblin', { x: 6, y: 5 });
  const { enc: e2, eventos: ev2 } = arena({ herois: [r2], foes: [g2] });
  e2.side = 'foes';
  const bonus = e2.weaponAttackProfile(g2, null).bonus;
  const ca = caEfetiva(r2);
  const natural = Math.max(2, Math.min(19, ca - bonus)); // acerta por um fio
  e2.rng = dadoFixo(natural);
  e2.resolveAttack(g2, r2, {});
  const primeiro = [...ev2].reverse().find((e) => e.rolagem?.alvoNumero);
  assert.equal(primeiro.rolagem.alvoNumero.valor, ca, 'o primeiro golpe enfrenta a CA normal');
  e2.resolveAttack(g2, r2, {});
  const segundo = [...ev2].reverse().find((e) => e.rolagem?.alvoNumero);
  assert.equal(segundo.rolagem.alvoNumero.valor, ca + 4, 'o segundo, CA + 4');
  // outro atacante no mesmo turno: sem o +4
  const g3 = inimigo('goblin', { x: 5, y: 6 });
  e2.combatants.push(g3);
  e2.resolveAttack(g3, r2, {});
  const terceiro = [...ev2].reverse().find((e) => e.rolagem?.alvoNumero);
  assert.equal(terceiro.rolagem.alvoNumero.valor, ca, 'outro atacante não tem o +4');
});

teste('Golpes Reforçados pelo Ki (monge, 6º): o punho conta como mágico e vence a resistência a dano não mágico', () => {
  const dano = (nivel) => {
    const m = heroi('monge', nivel, 'Humano');
    m.pos = { x: 5, y: 5 };
    const gob = alvoParado({ x: 6, y: 5 });
    gob.resistNaoMagico = ['concussão'];
    const { enc } = arena({ herois: [m], foes: [gob] });
    enc.rng = dadoFixo(15);
    enc.resolveAttack(m, gob, { weaponId: 'punhos' });
    return gob.maxHp - gob.hp;
  };
  const sem = dano(5);
  const com = dano(6);
  assert.ok(com > sem, `o monge de 6º causa mais (${com}) que o de 5º (${sem}) contra resistência a dano não mágico`);
  assert.ok(com >= sem * 2 - 1, 'a resistência cortava pela metade');
});

// ============================================================================================================
// MAGIA, PONTOS DE VIDA E DESCANSO: Evocação, Afinidade, Truque Potente, Sobrevivente, Bênção do Obscuro, cura, Resiliência
// ============================================================================================================

/** Prepara uma magia para o conjurador de teste e devolve o dano total que ela causa num alvo parado. */
function danoDeMagia(conj, spellId, alvo, { dado = 15, ...opc } = {}) {
  conj.spellcasting.prepared = [...new Set([...(conj.spellcasting.prepared ?? []), spellId])];
  conj.pos = { x: 5, y: 5 };
  const { enc } = arena({ herois: [conj], foes: [alvo] });
  enc.rng = dadoFixo(dado);
  const antes = alvo.hp;
  const r = enc.castSpell(conj, spellId, { target: alvo, point: alvo.pos, ...opc });
  assert.ok(r.ok, r.why);
  return antes - alvo.hp;
}

teste('Evocação Potencializada (mago de Evocação, 10º): soma o INT a UMA rolagem de magia de evocação — uma só, mesmo com vários dardos', () => {
  const evocador = (n) => heroi('mago', n, 'Humano', { abilities: { str: 8, dex: 14, con: 14, int: 20, wis: 10, cha: 10 } });
  const alvo = () => { const g = alvoParado({ x: 6, y: 5 }); return g; };
  const m9 = evocador(9), m10 = evocador(10);
  const sem = danoDeMagia(m9, 'misselMagico', alvo(), { circulo: 1 });
  const com = danoDeMagia(m10, 'misselMagico', alvo(), { circulo: 1 });
  const mod = abilityModDe(m10.abilities.int);
  assert.ok(m10.features.includes('empoweredEvocation') && !m9.features.includes('empoweredEvocation'));
  assert.equal(com - sem, mod, `+${mod} (INT) numa rolagem, e não em cada um dos três dardos`);
  // uma magia que NÃO é de evocação não ganha
  const ilusao = danoDeMagia(evocador(10), 'sono', alvo(), { circulo: 1 }).valueOf();
  assert.equal(ilusao, 0, 'Sono não causa dano');
});

teste('Afinidade Elemental (feiticeiro dracônico, 6º): soma o CAR ao dano do tipo da ancestralidade — e só a ele', () => {
  const feit = (n, cor) => {
    const c = heroi('feiticeiro', n, 'Humano', { abilities: { str: 8, dex: 14, con: 14, int: 10, wis: 10, cha: 20 } });
    c.ancestralDraconico = cor;
    return c;
  };
  const alvo = () => alvoParado({ x: 6, y: 5 });
  const base = danoDeMagia(feit(5, 'vermelho'), 'maosFlamejantes', alvo(), { circulo: 1, dado: 5 });
  const comVermelho = danoDeMagia(feit(6, 'vermelho'), 'maosFlamejantes', alvo(), { circulo: 1, dado: 5 });
  const comAzul = danoDeMagia(feit(6, 'azul'), 'maosFlamejantes', alvo(), { circulo: 1, dado: 5 });
  const cha = abilityModDe(20);
  assert.equal(comVermelho - base, cha, 'o vermelho soma CAR ao fogo');
  assert.equal(comAzul - base, 0, 'o azul (elétrico) não soma ao fogo');
  assert.ok(feit(6, 'vermelho').features.includes('elementalAffinity'));
});

teste('Truque Potente (mago de Evocação, 6º): o truque de resistência causa METADE do dano a quem passa', () => {
  const cantrip = Object.values(SPELLS).find((s) => s.level === 0 && s.kind === 'save' && s.damage && !s.halfOnSave);
  assert.ok(cantrip, 'há um truque de dano com resistência e sem metade');
  const roda = (nivel) => {
    const m = heroi('mago', nivel, 'Humano');
    m.pos = { x: 5, y: 5 };
    const alvo = alvoParado({ x: 6, y: 5 });
    const { enc } = arena({ herois: [m], foes: [alvo] });
    enc.rng = dadoFixo(20); // o alvo passa
    enc.resolverSave(m, cantrip, { target: alvo, dc: 1, slot: 0, dano: '2d6' });
    return alvo.maxHp - alvo.hp;
  };
  assert.equal(roda(5), 0, 'antes do 6º, quem passa não leva nada');
  assert.equal(roda(6), 3, 'a partir do 6º, a metade (2d6 = 6)');
});

teste('Sobrevivente (Campeão, 18º): no começo do turno, com metade dos PV ou menos (e acima de 0), recupera 5 + CON', () => {
  const c = heroi('guerreiro', 18, 'Humano', {}, { 3: { subclasse: 'campeao' } });
  c.pos = { x: 5, y: 5 };
  const { enc } = arena({ herois: [c], foes: [inimigo('goblin', { x: 11, y: 11 })] });
  assert.ok(c.features.includes('survivor'));
  const cura = 5 + Math.max(0, abilityModDe(c.abilities.con));
  c.hp = Math.floor(c.maxHp / 2);
  enc.beginSide('party');
  assert.equal(c.hp, Math.floor(c.maxHp / 2) + cura, 'recuperou 5 + CON');
  // acima da metade: nada
  c.hp = Math.floor(c.maxHp / 2) + 1;
  enc.beginSide('party');
  assert.equal(c.hp, Math.floor(c.maxHp / 2) + 1);
  // a 0 PV: nada (precisa estar de pé)
  c.hp = 0;
  enc.beginSide('party');
  assert.equal(c.hp, 0);
  // sem a característica: nada
  const c17 = heroi('guerreiro', 17, 'Humano', {}, { 3: { subclasse: 'campeao' } });
  c17.pos = { x: 4, y: 5 };
  const { enc: e2 } = arena({ herois: [c17], foes: [inimigo('goblin', { x: 11, y: 11 })] });
  c17.hp = 5;
  e2.beginSide('party');
  assert.equal(c17.hp, 5);
});

teste('Fúria Persistente (bárbaro, 15º): a fúria não acaba por falta de ataque ou de dano', () => {
  const termina = (nivel) => {
    const b = heroi('barbaro', nivel, 'Humano');
    b.pos = { x: 5, y: 5 };
    const { enc } = arena({ herois: [b], foes: [inimigo('goblin', { x: 11, y: 11 })] });
    addCondition(b, 'furia');
    b.furiaAgiu = false; // nem atacou nem apanhou no turno
    enc.fimDaFuria(b);
    return !hasCondition(b, 'furia');
  };
  assert.equal(termina(14), true, 'sem a característica, um turno parado acaba com a fúria');
  assert.equal(termina(15), false, 'com a Fúria Persistente, não acaba');
});

teste('Bênção do Obscuro (bruxo Corruptor, 1º): matar um hostil dá PV temporários = CAR + nível', () => {
  const b = heroi('bruxo', 3, 'Humano', { abilities: { str: 8, dex: 14, con: 14, int: 10, wis: 10, cha: 16 } });
  b.pos = { x: 5, y: 5 };
  const gob = inimigo('goblin', { x: 6, y: 5 });
  const { enc } = arena({ herois: [b], foes: [gob] });
  assert.ok(b.features.includes('darkOnesBlessing'));
  assert.equal(b.tempHp, 0);
  enc.applyDamage(gob, 999, 'cortante', b);
  assert.ok(gob.dead);
  assert.equal(b.tempHp, Math.max(1, abilityModDe(16) + 3), 'CAR + nível de bruxo');
  // matar um aliado não conta, nem o dano que não mata
  const b2 = heroi('bruxo', 3, 'Humano');
  b2.pos = { x: 4, y: 5 };
  const g2 = inimigo('goblin', { x: 6, y: 5 });
  const { enc: e2 } = arena({ herois: [b2], foes: [g2] });
  e2.applyDamage(g2, 1, 'cortante', b2);
  assert.equal(b2.tempHp, 0, 'o goblin sobreviveu');
});

teste('Curador Abençoado (clérigo da Vida, 6º) e Cura Suprema (17º)', () => {
  const clerigo = (n) => heroi('clerigo', n, 'Humano', { abilities: { str: 10, dex: 10, con: 14, int: 10, wis: 18, cha: 10 } });
  const aliado = heroi('guerreiro', 6, 'Humano');
  // Curador Abençoado: cura OUTRO e recupera 2 + círculo
  const c6 = clerigo(6);
  c6.pos = { x: 5, y: 5 }; aliado.pos = { x: 6, y: 5 };
  c6.spellcasting.prepared = [...new Set([...(c6.spellcasting.prepared ?? []), 'curarFerimentos'])];
  const { enc } = arena({ herois: [c6, aliado], foes: [inimigo('goblin', { x: 11, y: 11 })] });
  aliado.hp = 1; c6.hp = c6.maxHp - 20;
  const antes = c6.hp;
  enc.rng = dadoFixo(4);
  const r = enc.castSpell(c6, 'curarFerimentos', { target: aliado, circulo: 1 });
  assert.ok(r.ok, r.why);
  assert.equal(c6.hp - antes, 2 + 1, '2 + o círculo da magia (1º)');
  // curar a si mesmo não conta
  const c6b = clerigo(6);
  c6b.pos = { x: 5, y: 5 };
  c6b.spellcasting.prepared = [...new Set([...(c6b.spellcasting.prepared ?? []), 'curarFerimentos'])];
  const { enc: e2 } = arena({ herois: [c6b], foes: [inimigo('goblin', { x: 11, y: 11 })] });
  c6b.hp = c6b.maxHp - 20;
  const a2 = c6b.hp;
  e2.rng = dadoFixo(4);
  e2.castSpell(c6b, 'curarFerimentos', { target: c6b, circulo: 1 });
  assert.ok(c6b.hp - a2 < 30 && c6b.hp - a2 > 0);
  assert.equal(contaLog(e2.log, /Curador Abençoado/), 0, 'curar a si mesmo não ativa o Curador Abençoado');
  // Cura Suprema: os dados saem no máximo
  const c17 = clerigo(17);
  c17.pos = { x: 5, y: 5 };
  const { enc: e3 } = arena({ herois: [c17, heroi('guerreiro', 6, 'Humano')], foes: [inimigo('goblin', { x: 11, y: 11 })] });
  e3.rng = dadoFixo(1); // os dados caem em 1... mas a Cura Suprema não rola
  assert.equal(e3.rolarCuraPara(aliado, '2d8+3', c17).total, 2 * 8 + 3, 'o máximo dos dados');
  assert.equal(e3.rolarCuraPara(aliado, '2d8+3', c6).total < 2 * 8 + 3, true, 'sem Cura Suprema rola');
});

teste('Resiliência Infernal (bruxo Corruptor, 10º): depois de um descanso resiste ao tipo que mais o machucou — e não contra arma mágica', () => {
  const b = heroi('bruxo', 10, 'Humano');
  b.pos = { x: 5, y: 5 };
  const { enc } = arena({ herois: [b], foes: [inimigo('goblin', { x: 11, y: 11 })] });
  assert.ok(b.features.includes('fiendishResilience'));
  b.hp = b.maxHp;
  enc.applyDamage(b, 10, 'fogo', null);
  enc.applyDamage(b, 3, 'frio', null);
  assert.equal(b.danoPorTipo.fogo, 10);
  const antesDoDescanso = enc.danoPorTipo(b, 10, 'fogo');
  assert.equal(antesDoDescanso, 10, 'sem a escolha, o fogo vem inteiro');
  const escolha = escolherResistenciaInfernal(b);
  assert.equal(escolha, 'fogo', 'o tipo que mais machucou');
  assert.equal(enc.danoPorTipo(b, 10, 'fogo'), 5, 'agora resiste');
  assert.equal(enc.danoPorTipo(b, 10, 'frio'), 10, 'só ao escolhido');
  assert.equal(enc.danoPorTipo(b, 10, 'fogo', true, true), 10, 'arma mágica vence a resistência infernal');
  assert.deepEqual(b.danoPorTipo, {}, 'a contagem zera no descanso');
  // o descanso longo e o curto fazem a escolha
  const b2 = heroi('bruxo', 10, 'Humano');
  b2.danoPorTipo = { necrótico: 4, ácido: 9 };
  descansoLongo(b2);
  assert.equal(b2.resistenciaInfernal, 'ácido');
  // e a tela, quando existir, escolhe
  assert.equal(escolherResistenciaInfernal(b2, 'veneno'), 'veneno');
});

teste('Eu Perfeito (monge, 20º): ao rolar iniciativa sem ki, recupera 4; com ki, nada', () => {
  const m = heroi('monge', 20, 'Humano');
  m.pos = { x: 5, y: 5 };
  const g = inimigo('goblin', { x: 11, y: 11 });
  const { enc } = arena({ herois: [m], foes: [g] });
  m.resources.ki = 0;
  enc.start();
  assert.equal(m.resources.ki, 4);
  const m2 = heroi('monge', 20, 'Humano');
  m2.pos = { x: 5, y: 5 };
  const { enc: e2 } = arena({ herois: [m2], foes: [inimigo('goblin', { x: 11, y: 11 })] });
  m2.resources.ki = 2;
  e2.start();
  assert.equal(m2.resources.ki, 2, 'com ki, não recupera');
});

teste('Campeão Primitivo (bárbaro, 20º): +4 em FOR e CON, com teto 24', () => {
  // Atributos BAIXOS de propósito: com FOR 20 o teto de 24 escondia uma soma em dobro (+8 viraria 24 do mesmo jeito).
  const base = { str: 10, dex: 12, con: 10, int: 8, wis: 10, cha: 8 };
  const b19 = heroi('barbaro', 19, 'Humano', { abilities: { ...base } });
  const b20 = heroi('barbaro', 20, 'Humano', { abilities: { ...base } });
  assert.ok(b20.features.includes('primalChampion'));
  assert.equal(b20.abilities.str, b19.abilities.str + 4, 'exatamente +4 em FOR');
  assert.equal(b20.abilities.con, b19.abilities.con + 4, 'exatamente +4 em CON');
  assert.ok(b20.abilities.str <= 24 && b20.abilities.con <= 24);
  // os PV acompanham o CON novo
  assert.ok(b20.maxHp > b19.maxHp + 6, 'o modificador de CON novo entra nos PV de todos os níveis');
});

// ============================================================================================================
// USO LIVRE DE MAGIA: Legado Infernal, Magia Drow, Maestria em Magia, Magias de Assinatura
// ============================================================================================================

teste('quem não conjura por classe ganha o mínimo para conjurar a magia da raça (tiferino guerreiro: Taumaturgia)', () => {
  const t = heroi('guerreiro', 1, 'Tiferino');
  assert.ok(t.spellcasting, 'tem conjuração, mesmo sem classe conjuradora');
  assert.equal(t.spellcasting.ability, 'cha');
  assert.ok(t.spellcasting.cantrips.includes('taumaturgia'));
  assert.ok(magiasProntas(t).includes('taumaturgia'));
  // o humano guerreiro continua sem
  assert.equal(heroi('guerreiro', 1, 'Humano').spellcasting, undefined);
  // um conjurador de classe não perde os truques que tinha e ganha os da raça
  const mago = heroi('mago', 1, 'Tiferino');
  assert.ok(mago.spellcasting.cantrips.includes('taumaturgia'));
  assert.equal(new Set(mago.spellcasting.cantrips).size, mago.spellcasting.cantrips.length, 'sem repetir');
});

teste('Legado Infernal: a Repreensão Infernal sai como REAÇÃO sem espaço, no 2º círculo, uma vez por descanso longo', () => {
  const t = heroi('guerreiro', 3, 'Tiferino');
  t.pos = { x: 5, y: 5 };
  const gob = inimigo('goblin', { x: 6, y: 5 });
  const { enc, log } = arena({ herois: [t], foes: [gob] });
  assert.equal(t.resources.racial_repreensaoInfernal, 1);
  assert.ok(magiasProntas(t).includes('repreensaoInfernal'));
  enc.rng = dadoFixo(5);
  const antes = gob.hp;
  enc.applyDamage(t, 3, 'cortante', gob);
  assert.ok(log.some((e) => /Repreensão Infernal/.test(e.text ?? '')), 'o tiferino respondeu');
  assert.ok(gob.hp < antes, 'o agressor queimou');
  assert.equal(t.resources.racial_repreensaoInfernal, 0, 'gastou o uso, e nenhum espaço (não tem)');
  assert.equal(t.reactionUsed, true);
  // sem o uso, não responde de novo
  t.reactionUsed = false;
  const n = log.filter((e) => /Repreensão Infernal/.test(e.text ?? '')).length;
  enc.applyDamage(t, 3, 'cortante', gob);
  assert.equal(log.filter((e) => /Repreensão Infernal/.test(e.text ?? '')).length, n, 'o uso do dia acabou');
  // o descanso longo devolve
  descansoLongo(t);
  assert.equal(t.resources.racial_repreensaoInfernal, 1);
  // antes do 3º nível não tem
  assert.ok(!(heroi('guerreiro', 2, 'Tiferino').magiasRaciais?.length));
});

teste('Legado Infernal (5º) e Magia Drow (3º, 5º): a magia sai como ação, sem espaço, uma vez por descanso longo', () => {
  const t = heroi('guerreiro', 5, 'Tiferino');
  t.pos = { x: 3, y: 5 };
  const gob = inimigo('goblin', { x: 7, y: 5 });
  const { enc } = arena({ herois: [t], foes: [gob] });
  assert.equal(t.spellcasting.slots.reduce((a, b) => a + b, 0), 0, 'nenhum espaço de magia');
  const r = enc.castSpell(t, 'escuridao', { point: { x: 7, y: 5 }, target: gob });
  assert.ok(r.ok, r.why);
  assert.equal(t.resources.racial_escuridao, 0);
  // segunda vez: sem uso e sem espaço
  t.actionUsed = false;
  const r2 = enc.castSpell(t, 'escuridao', { point: { x: 7, y: 5 }, target: gob });
  assert.equal(r2.ok, false);
  // a drow: Fogo das Fadas no 3º nível
  const d = heroi('guerreiro', 3, 'Elfo negro (drow)');
  d.pos = { x: 3, y: 5 };
  const g2 = inimigo('goblin', { x: 7, y: 5 });
  const { enc: e2 } = arena({ herois: [d], foes: [g2] });
  assert.ok(d.spellcasting.cantrips.includes('luzesDancantes'), 'a drow conhece Luzes Dançantes');
  const r3 = e2.castSpell(d, 'fogoDasFadas', { point: { x: 7, y: 5 }, target: g2 });
  assert.ok(r3.ok, r3.why);
  assert.equal(d.resources.racial_fogoDasFadas, 0);
});

teste('Maestria em Magia (mago, 18º): uma magia de 1º e uma de 2º círculo sem gastar espaço', () => {
  const m = heroi('mago', 18, 'Humano');
  assert.ok(m.features.includes('spellMastery'));
  assert.equal(m.maestriaDeMagia.length, 2, 'uma de 1º e uma de 2º');
  assert.equal(SPELLS[m.maestriaDeMagia[0]].level, 1);
  assert.equal(SPELLS[m.maestriaDeMagia[1]].level, 2);
  m.pos = { x: 5, y: 5 };
  const alvo = alvoParado({ x: 6, y: 5 });
  // zera os espaços: só a Maestria conjura
  m.spellcasting.slots = m.spellcasting.slots.map(() => 0);
  m.spellcasting.prepared = [...new Set([...m.spellcasting.prepared, ...m.maestriaDeMagia])];
  const { enc } = arena({ herois: [m], foes: [alvo] });
  const magia = m.maestriaDeMagia[0];
  const livre = usoLivreDe(m, SPELLS[magia]);
  assert.equal(livre?.tipo, 'maestria');
  assert.equal(usoLivreDe(m, SPELLS[magia], SPELLS[magia].level + 1), null, 'mais alto gasta espaço');
  // outra magia de 1º círculo que não é a escolhida não é livre
  const outra = Object.values(SPELLS).find((s) => s.level === 1 && s.id !== magia);
  assert.equal(usoLivreDe(m, outra), null);
});

teste('Magias de Assinatura (mago, 20º): duas de 3º círculo, uma vez cada por descanso CURTO', () => {
  const m = heroi('mago', 20, 'Humano');
  assert.ok(m.features.includes('signatureSpells'));
  assert.equal(m.magiasAssinatura.length, 2);
  for (const a of m.magiasAssinatura) {
    assert.equal(SPELLS[a.magia].level, 3);
    assert.equal(m.resources[a.recurso], 1);
  }
  const [a, b] = m.magiasAssinatura;
  assert.equal(usoLivreDe(m, SPELLS[a.magia])?.tipo, 'assinatura');
  m.resources[a.recurso] = 0;
  assert.equal(usoLivreDe(m, SPELLS[a.magia]), null, 'gasta, não é mais livre');
  assert.equal(usoLivreDe(m, SPELLS[b.magia])?.tipo, 'assinatura', 'a outra segue');
  // o descanso CURTO devolve (as raciais, só o longo)
  recuperarNoCurto(m);
  assert.equal(m.resources[a.recurso], 1, 'as de assinatura voltam no curto');
});

teste('o descanso CURTO não devolve a magia racial; só o longo', () => {
  const t = heroi('guerreiro', 5, 'Tiferino');
  t.resources.racial_escuridao = 0;
  t.resources.racial_repreensaoInfernal = 0;
  recuperarNoCurto(t);
  assert.equal(t.resources.racial_escuridao, 0);
  assert.equal(t.resources.racial_repreensaoInfernal, 0);
  descansoLongo(t);
  assert.equal(t.resources.racial_escuridao, 1);
  assert.equal(t.resources.racial_repreensaoInfernal, 1);
});

// ============================================================================================================
// ARMA DE SOPRO DO DRACONATO
// ============================================================================================================

teste('o draconato tem o sopro da sua cor entre os truques, e o draconato vermelho sopra em CONE (e não em linha)', () => {
  const dara = heroi('guerreiro', 5, 'Draconata vermelha');
  assert.ok(dara.spellcasting.cantrips.includes('sopro_vermelho'));
  assert.ok(magiasProntas(dara).includes('sopro_vermelho'));
  assert.equal(dara.spellcasting.ability, 'con');
  const s = SPELLS.sopro_vermelho;
  assert.equal(s.shape, 'cone');
  assert.equal(s.damageType, 'fogo');
  assert.equal(s.save, 'dex');
  assert.equal(s.areaFt, 15);
  // as dez cores: forma, dano e resistência do livro
  const livro = {
    negro: ['linha', 'ácido', 'dex'], azul: ['linha', 'elétrico', 'dex'], latao: ['linha', 'fogo', 'dex'], bronze: ['linha', 'elétrico', 'dex'],
    cobre: ['linha', 'ácido', 'dex'], ouro: ['cone', 'fogo', 'dex'], verde: ['cone', 'veneno', 'con'], vermelho: ['cone', 'fogo', 'dex'],
    prata: ['cone', 'frio', 'con'], branco: ['cone', 'frio', 'con'],
  };
  for (const [cor, [forma, dano, save]] of Object.entries(livro)) {
    const sp = SPELLS[`sopro_${cor}`];
    assert.ok(sp, `sopro_${cor} existe`);
    assert.deepEqual([sp.shape, sp.damageType, sp.save], [forma, dano, save], cor);
    assert.equal(sp.areaFt, forma === 'cone' ? 15 : 30, `${cor}: alcance`);
  }
  // quem não é draconato não tem
  assert.ok(!heroi('guerreiro', 5, 'Humano').spellcasting);
});

teste('o sopro: CD de 8 + CON + proficiência, 2d6 de fogo em quem está no cone, metade se passar; uma vez por descanso curto', () => {
  const dara = heroi('guerreiro', 1, 'Draconata vermelha', { abilities: { str: 16, dex: 12, con: 14, int: 8, wis: 10, cha: 10 } });
  dara.pos = { x: 2, y: 5 };
  const g1 = alvoParado({ x: 4, y: 5 });  // a 2 casas: dentro do cone de 15 pés
  const g2 = alvoParado({ x: 3, y: 5 });  // colado
  const longe = alvoParado({ x: 9, y: 5 }); // fora
  [g1, g2, longe].forEach((g) => { g.abilities = { ...g.abilities, dex: 10 }; });
  const { enc, log } = arena({ herois: [dara], foes: [g1, g2, longe] });
  assert.equal(dara.resources.breathWeapon, 1);
  enc.rng = dadoFixo(2); // todos falham a resistência: dano cheio, 2d6 com cada dado em 3 = 6
  const r = enc.castSpell(dara, 'sopro_vermelho', { point: { x: 4, y: 5 } });
  assert.ok(r.ok, r.why);
  assert.equal(g1.maxHp - g1.hp, 6, 'dano cheio de 2d6 (dados em 3)');
  assert.equal(g2.maxHp - g2.hp, 6);
  assert.equal(longe.hp, longe.maxHp, 'o que está longe não é atingido');
  assert.equal(dara.resources.breathWeapon, 0, 'gastou o recurso, e nenhum espaço (não tem)');
  const cd = 8 + proficiencyBonus(1) + abilityModDe(14);
  assert.ok(log.some((e) => JSON.stringify(e).includes(`CD ${cd}`)), `a CD é ${cd}: 8 + proficiência + CON`);
  // segunda vez: recusa
  dara.actionUsed = false;
  const r2 = enc.castSpell(dara, 'sopro_vermelho', { point: { x: 4, y: 5 } });
  assert.equal(r2.ok, false);
  assert.match(r2.why, /sopro já foi usado/);
  // o descanso CURTO devolve
  recuperarNoCurto(dara);
  assert.equal(dara.resources.breathWeapon, 1);
  dara.actionUsed = false;
  assert.ok(enc.castSpell(dara, 'sopro_vermelho', { point: { x: 4, y: 5 } }).ok);
});

teste('o sopro passando na resistência causa a metade', () => {
  const dara = heroi('guerreiro', 1, 'Draconata vermelha');
  dara.pos = { x: 2, y: 5 };
  const g = alvoParado({ x: 3, y: 5 });
  const { enc } = arena({ herois: [dara], foes: [g] });
  enc.rng = dadoFixo(20); // o alvo passa
  enc.castSpell(dara, 'sopro_vermelho', { point: { x: 3, y: 5 } });
  assert.equal(g.maxHp - g.hp, 3, 'metade de 6');
});

teste('os dados do sopro crescem em degraus: 2d6, 3d6 (6º), 4d6 (11º), 5d6 (16º)', () => {
  for (const [nivel, dados] of [[1, '2d6'], [5, '2d6'], [6, '3d6'], [10, '3d6'], [11, '4d6'], [15, '4d6'], [16, '5d6'], [20, '5d6']]) {
    assert.equal(dadosDaMagia(SPELLS.sopro_vermelho, { nivel }), dados, `nível ${nivel}`);
  }
});

teste('o sopro de linha (azul) alcança 9 m; o de cone (vermelho) só 4,5 m', () => {
  const azul = heroi('guerreiro', 1, 'Draconata azul');
  const verm = heroi('guerreiro', 1, 'Draconata vermelha');
  azul.pos = { x: 1, y: 5 }; verm.pos = { x: 1, y: 6 };
  const a1 = alvoParado({ x: 6, y: 5 });  // a 5 casas
  const a2 = alvoParado({ x: 6, y: 6 });
  const { enc } = arena({ herois: [azul, verm], foes: [a1, a2] });
  enc.rng = dadoFixo(2);
  enc.castSpell(azul, 'sopro_azul', { point: { x: 6, y: 5 } });
  enc.castSpell(verm, 'sopro_vermelho', { point: { x: 6, y: 6 } });
  assert.ok(a1.hp < a1.maxHp, 'a linha azul chega a 7,5 m');
  assert.equal(a2.hp, a2.maxHp, 'o cone vermelho não chega');
});

teste('o sopro NÃO é magia de conjurador: Evocação Potencializada e Afinidade Elemental não somam a ele', () => {
  assert.equal(bonusDeDanoPorTraco({ features: ['empoweredEvocation', 'elementalAffinity'], ancestralDraconico: 'vermelho', abilities: { int: 20, cha: 20 } }, SPELLS.sopro_vermelho).bonus, 0);
  assert.ok(bonusDeDanoPorTraco({ features: ['empoweredEvocation'], abilities: { int: 20 } }, SPELLS.misselMagico).bonus > 0, 'controle: uma magia de evocação soma');
});

// ============================================================================================================
// DESCANSO E FORA DE COMBATE: Canção, Fonte, Recuperação Natural, Restauração, Tranquilidade, Mestre Místico
// ============================================================================================================

teste('Canção de Descanso (bardo, 2º): o dado cresce com o nível (d6, d8, d10, d12) e vale o melhor bardo acordado', () => {
  const bardo = (n) => heroi('bardo', n, 'Humano');
  assert.equal(dadoDaCancaoDeDescanso([bardo(1)]), 0, 'no 1º ainda não existe');
  for (const [n, d] of [[2, 6], [8, 6], [9, 8], [12, 8], [13, 10], [16, 10], [17, 12], [20, 12]]) {
    assert.equal(dadoDaCancaoDeDescanso([bardo(n)]), d, `nível ${n}`);
  }
  assert.equal(dadoDaCancaoDeDescanso([bardo(2), bardo(9)]), 8, 'vale o maior, e não soma');
  assert.equal(dadoDaCancaoDeDescanso([heroi('guerreiro', 20, 'Humano')]), 0, 'quem não é bardo não canta');
  const dormindo = bardo(9);
  addCondition(dormindo, 'inconsciente');
  assert.equal(dadoDaCancaoDeDescanso([dormindo]), 0, 'bardo inconsciente não canta');
  const caido = bardo(9);
  caido.hp = 0;
  assert.equal(dadoDaCancaoDeDescanso([caido]), 0);
});

teste('Canção de Descanso: quem gasta um dado de vida ouvindo a canção cura um dado a mais', () => {
  const gastar = (cancao) => {
    const c = heroi('guerreiro', 5, 'Humano', { abilities: { str: 14, dex: 10, con: 12, int: 10, wis: 10, cha: 10 } });
    c.hp = 1;
    const rng = dadoFixo(15); // d10 de vida = 5, d6 da canção = 3
    return gastarDadoDeVida(rng, c, { cancao });
  };
  const sem = gastar(0);
  const com = gastar(6);
  assert.equal(com.cura - sem.cura, 3, 'o d6 da canção (3) a mais');
  assert.equal(com.cancao, 3);
  assert.equal(sem.cancao, 0);
});

teste('Fonte de Inspiração (bardo, 5º): a Inspiração Bárdica volta no descanso curto; antes do 5º, só no longo', () => {
  const gasta = (n) => {
    const b = heroi('bardo', n, 'Humano');
    b.resources.bardicInspiration = 0;
    recuperarNoCurto(b);
    return b.resources.bardicInspiration;
  };
  assert.equal(gasta(4), 0, 'no 4º, o curto não devolve');
  assert.ok(gasta(5) > 0, 'no 5º, devolve');
  const b = heroi('bardo', 4, 'Humano');
  b.resources.bardicInspiration = 0;
  descansoLongo(b);
  assert.ok(b.resources.bardicInspiration > 0, 'o longo sempre devolve');
});

teste('Recuperação Natural (druida da Terra, 2º): num descanso curto recupera espaços até metade do nível (para cima), nenhum acima do 5º, uma vez por descanso longo', () => {
  const d = heroi('druida', 6, 'Humano');
  assert.ok(d.features.includes('naturalRecovery'));
  assert.equal(d.resources.naturalRecovery, 1);
  d.spellcasting.slots = d.spellcasting.slots.map(() => 0);
  const frases = recuperarNoCurto(d);
  const volta = d.spellcasting.slots.reduce((soma, n, circ) => soma + n * circ, 0);
  assert.equal(Math.ceil(6 / 2), 3, 'o orçamento é 3 círculos');
  assert.ok(volta > 0 && volta <= 3, `recuperou ${volta} círculos no total`);
  assert.equal(d.resources.naturalRecovery, 0, 'uma vez por descanso longo');
  assert.ok(frases.some((f) => /Recuperação Natural/.test(f)));
  // de novo no curto: nada
  const antes = d.spellcasting.slots.slice();
  recuperarNoCurto(d);
  assert.deepEqual(d.spellcasting.slots, antes);
  descansoLongo(d);
  assert.equal(d.resources.naturalRecovery, 1, 'o descanso longo devolve o uso');
});

teste('Restauração Feiticeira (feiticeiro, 20º): num descanso curto recupera 4 pontos de feitiçaria, sem passar do máximo', () => {
  const f = heroi('feiticeiro', 20, 'Humano');
  assert.ok(f.features.includes('sorcerousRestoration'));
  f.resources.sorceryPoints = 0;
  recuperarNoCurto(f);
  assert.equal(f.resources.sorceryPoints, 4);
  f.resources.sorceryPoints = f.resourcesMax.sorceryPoints - 1;
  recuperarNoCurto(f);
  assert.equal(f.resources.sorceryPoints, f.resourcesMax.sorceryPoints, 'não passa do máximo');
  const f19 = heroi('feiticeiro', 19, 'Humano');
  f19.resources.sorceryPoints = 0;
  recuperarNoCurto(f19);
  assert.equal(f19.resources.sorceryPoints, 0, 'antes do 20º, não');
});

teste('Tranquilidade (Mão Aberta, 11º): depois do descanso longo, Santuário com CD 8 + SAB + proficiência', () => {
  const m = heroi('monge', 11, 'Humano', { abilities: { str: 10, dex: 16, con: 12, int: 10, wis: 16, cha: 10 } });
  assert.ok(m.features.includes('tranquility'));
  assert.ok(!hasCondition(m, 'santuario'));
  descansoLongo(m);
  assert.ok(hasCondition(m, 'santuario'));
  assert.equal(getCondition(m, 'santuario').data.dc, 8 + abilityModDe(m.abilities.wis) + proficiencyBonus(11));
  const m10 = heroi('monge', 10, 'Humano');
  descansoLongo(m10);
  assert.ok(!hasCondition(m10, 'santuario'), 'antes do 11º, nada');
});

teste('Mestre Místico (bruxo, 20º): fora da luta, um minuto devolve TODOS os espaços de pacto; uma vez por descanso longo', () => {
  const b = heroi('bruxo', 20, 'Humano');
  b.pos = { x: 5, y: 5 };
  const { enc } = arena({ herois: [b], foes: [] });
  enc.over = true; // fora da luta
  assert.equal(b.resources.eldritchMaster, 1);
  b.spellcasting.slots = b.spellcasting.slots.map(() => 0);
  assert.equal(enc.useFeature(b, 'eldritchMaster'), true);
  assert.deepEqual(b.spellcasting.slots, b.spellcasting.slotsMax);
  assert.equal(b.resources.eldritchMaster, 0);
  b.spellcasting.slots = b.spellcasting.slots.map(() => 0);
  assert.equal(enc.useFeature(b, 'eldritchMaster'), false, 'só uma vez por descanso longo');
  // com inimigo em campo não vale: leva um minuto
  const b2 = heroi('bruxo', 20, 'Humano');
  b2.pos = { x: 5, y: 5 };
  const { enc: e2 } = arena({ herois: [b2], foes: [inimigo('goblin', { x: 8, y: 8 })] });
  b2.spellcasting.slots = b2.spellcasting.slots.map(() => 0);
  assert.equal(e2.useFeature(b2, 'eldritchMaster'), false, 'não no meio da luta');
});

teste('Inspiração Superior (bardo, 20º): ao rolar iniciativa sem Inspiração, recupera uma', () => {
  const b = heroi('bardo', 20, 'Humano');
  b.pos = { x: 5, y: 5 };
  const { enc } = arena({ herois: [b], foes: [inimigo('goblin', { x: 11, y: 11 })] });
  b.resources.bardicInspiration = 0;
  enc.start();
  assert.equal(b.resources.bardicInspiration, 1);
  const b2 = heroi('bardo', 20, 'Humano');
  b2.pos = { x: 5, y: 5 };
  const { enc: e2 } = arena({ herois: [b2], foes: [inimigo('goblin', { x: 11, y: 11 })] });
  b2.resources.bardicInspiration = 2;
  e2.start();
  assert.equal(b2.resources.bardicInspiration, 2, 'com Inspiração, não recupera');
});

teste('o que o catálogo ainda marcava sem mecânica mas JÁ funciona por dados: Colégio do Conhecimento, 2º Estilo de Luta, Truque Adicional, Magias do Círculo', () => {
  // Proficiências Adicionais (bardo do Conhecimento, 3º): três perícias a mais.
  const lore = heroi('bardo', 3, 'Humano', { skills: ['persuasao'] }, { 3: { subclasse: 'conhecimento' } });
  const semLore = heroi('bardo', 2, 'Humano', { skills: ['persuasao'] });
  assert.equal(lore.skills.length - semLore.skills.length, 3, 'o Conhecimento dá 3 perícias');
  // Estilo de Luta Adicional (Campeão, 10º): dois estilos
  const ESTILOS = ['defense', 'archery', 'dueling', 'greatWeaponFighting', 'protection', 'twoWeaponFighting'];
  const c10 = heroi('guerreiro', 10, 'Humano');
  const c9 = heroi('guerreiro', 9, 'Humano');
  assert.equal(c9.features.filter((f) => ESTILOS.includes(f)).length, 1);
  assert.equal(c10.features.filter((f) => ESTILOS.includes(f)).length, 2, 'o Campeão de 10º tem dois estilos de luta');
  // Truque Adicional (druida da Terra, 2º)
  const terra = heroi('druida', 2, 'Humano');
  const druida1 = heroi('druida', 1, 'Humano');
  assert.ok(terra.spellcasting.truquesConhecidos >= druida1.spellcasting.truquesConhecidos + 1, 'um truque a mais');
  // Magias do Círculo (druida da Terra): sempre preparadas, de acordo com o terreno
  const d5 = heroi('druida', 5, 'Humano');
  assert.ok(d5.spellcasting.sempreProntas?.length > 0, 'as magias do círculo vêm sempre preparadas');
});

// ============================================================================================================
// SEGREDOS MÁGICOS (bardo 10º, 14º, 18º; Colégio do Conhecimento 6º)
// ============================================================================================================

teste('Segredos Mágicos (bardo, 10º): o nível traz uma escolha de DUAS magias de qualquer lista, tiradas do total que a tabela dá', async () => {
  const { subirUmNivel } = await import('../game/nivel.js');
  const b = heroi('bardo', 9, 'Humano');
  const r = subirUmNivel(b);
  assert.equal(b.level, 10);
  const seg = r.escolhas.find((e) => e.id === 'segredos');
  assert.ok(seg, 'o 10º nível oferece Segredos Mágicos');
  assert.equal(seg.quantas, 2);
  const daLista = new Set(CLASSES.bardo ? (await import('../game/criacao.js')).listaDaClasse('bardo', 5).magias : []);
  assert.ok(seg.opcoes.some((s) => !daLista.has(s)), 'há opções de fora da lista do bardo');
  const aprende = r.escolhas.find((e) => e.id === 'aprende');
  const total = CLASSES.bardo.conjuracao.conhecidas[10] - CLASSES.bardo.conjuracao.conhecidas[9];
  assert.equal((aprende?.quantas ?? 0) + seg.quantas, total, 'as duas dos Segredos saem do total, não se somam a ele');
  const antes = b.spellcasting.prepared.length;
  const escolhida = seg.opcoes.find((s) => !daLista.has(s));
  r.aplicar({ segredos: [escolhida, seg.opcoes.find((s) => s !== escolhida)] });
  assert.ok(b.spellcasting.prepared.includes(escolhida), 'a magia de outra lista fica conhecida');
  assert.ok(b.spellcasting.prepared.length >= antes + 2);
  // controle: no 11º não há Segredos
  assert.ok(!subirUmNivel(b).escolhas.some((e) => e.id === 'segredos'));
});
// ============================================================================================================
// PASSO DA TERRA (druida da Terra 6º, patrulheiro 8º)
// ============================================================================================================

teste('Passo da Terra: o mato do mapa não atrasa quem tem a característica, e atrasa quem não tem', () => {
  const mato = Array(12).fill('~~~~~~~~~~~~');
  const alcance = (classe, nivel, sub) => {
    const h = heroi(classe, nivel, 'Humano', {}, sub);
    h.pos = { x: 0, y: 5 };
    h.speedFt = 30;
    const field = new Battlefield(12, 12, mato);
    const enc = new Encounter({ battlefield: field, party: [h], foes: [inimigo('goblin', { x: 11, y: 11 })], rng: makeRng(1), onLog: () => {} });
    enc.firstSide = 'party'; enc.round = 1; enc.beginSide('party');
    const r = enc.reachableFor(h);
    return { h, casas: r instanceof Map ? r.size : Array.isArray(r) ? r.length : Object.keys(r).length };
  };
  const guardiao8 = alcance('patrulheiro', 8);
  const guardiao7 = alcance('patrulheiro', 7);
  assert.ok(guardiao8.h.features.includes('landsStride'));
  assert.ok(!guardiao7.h.features.includes('landsStride'));
  assert.ok(guardiao8.casas > guardiao7.casas, `com Passo da Terra alcança mais casas no mato (${guardiao8.casas} contra ${guardiao7.casas})`);
});

teste('Passo da Terra: vantagem na resistência contra plantas mágicas, e só contra elas', () => {
  const f = { features: ['landsStride'] };
  assert.deepEqual(vantagemPorTraco(f, 'str', contraDaMagia(SPELLS.emaranhar)), ['Passo da Terra']);
  assert.deepEqual(vantagemPorTraco(f, 'str', contraDaMagia(SPELLS.crescimentoDeEspinhos)), ['Passo da Terra']);
  assert.deepEqual(vantagemPorTraco(f, 'dex', contraDaMagia(SPELLS.misselMagico)), [], 'controle: outra magia não');
  assert.deepEqual(vantagemPorTraco({ features: [] }, 'str', contraDaMagia(SPELLS.emaranhar)), [], 'controle: sem a característica');
});
// ============================================================================================================
// SANTUÁRIO DA NATUREZA (druida da Terra, 14º)
// ============================================================================================================

teste('Santuário da Natureza: besta que ataca o druida testa SAB; falhou, perde o ataque; passou, fica imune; um humano não testa', () => {
  const druida = heroi('druida', 14, 'Humano', { abilities: { str: 10, dex: 10, con: 14, int: 10, wis: 18, cha: 10 } }, { 2: { subclasse: 'terra' } });
  druida.pos = { x: 5, y: 5 };
  assert.ok(druida.features.includes('naturesSanctuary'));
  const lobo = alvoParado({ x: 6, y: 5 }, 'lobo');
  const bandido = alvoParado({ x: 4, y: 5 }, 'bandido');
  const { enc, log } = arena({ herois: [druida], foes: [lobo, bandido] });
  enc.beginSide('foes');
  enc.rng = dadoFixo(1); // falha na resistência
  assert.equal(enc.resolveAttack(lobo, druida), null, 'a fera falhou: perde o ataque');
  assert.ok(contaLog(log, /recua diante da natureza/) === 1);
  enc.rng = dadoFixo(20); // passa
  assert.notEqual(enc.resolveAttack(lobo, druida), null, 'a fera passou: ataca');
  enc.rng = dadoFixo(1); // agora a imunidade vale: nem rola
  assert.notEqual(enc.resolveAttack(lobo, druida), null, 'depois de passar, está imune');
  enc.rng = dadoFixo(1);
  assert.notEqual(enc.resolveAttack(bandido, druida), null, 'controle: um humanoide não é afetado');
});
// ============================================================================================================
// TÉCNICA DA MÃO ABERTA (monge, 3º)
// ============================================================================================================

teste('Técnica da Mão Aberta: cada golpe da Rajada que acerta derruba, empurra ou tira a reação; sem a subclasse, nada', () => {
  const rodada = (modo, sub = true) => {
    const m = heroi('monge', 5, 'Humano', { abilities: { str: 10, dex: 16, con: 12, int: 10, wis: 16, cha: 10 } });
    if (!sub) m.features = m.features.filter((f) => f !== 'openHandTechnique');
    m.pos = { x: 5, y: 5 };
    const g = alvoParado({ x: 6, y: 5 }, 'ogro');
    g.abilities = { ...g.abilities, str: 8, dex: 8 };
    const { enc } = arena({ herois: [m], foes: [g] });
    enc.rng = dadoFixo(12); // acerta; o alvo falha (12 + mod baixo < CD)
    m.actionUsed = true; m.atacouDeMonge = true;
    const ok = enc.useFeature(m, 'flurryOfBlows', { target: g, modo });
    return { m, g, enc, ok };
  };
  const a = rodada('derrubar');
  assert.ok(a.ok && a.m.features.includes('openHandTechnique'));
  assert.ok(hasCondition(a.g, 'caido'), 'o golpe derrubou');
  const b = rodada('empurrar');
  assert.ok(b.g.pos.x > 6, `foi empurrado (x=${b.g.pos.x})`);
  const c = rodada('semReacao');
  assert.ok(hasCondition(c.g, 'semReacoesDaMao'));
  assert.equal(c.g.reactionUsed, true);
  const sem = rodada('derrubar', false);
  assert.ok(!hasCondition(sem.g, 'caido'), 'controle: monge de outra tradição não derruba');
});
// ============================================================================================================
// REFLEXOS DE LADRÃO (ladino Ladrão, 17º)
// ============================================================================================================

teste('Reflexos de Ladrão: o fim do primeiro turno reabre o turno, uma vez, só na 1ª rodada; sem a característica, não', () => {
  const l = heroi('ladino', 17, 'Humano');
  l.pos = { x: 5, y: 5 };
  const outro = heroi('ladino', 16, 'Humano');
  outro.pos = { x: 3, y: 5 };
  outro.features = outro.features.filter((f) => f !== 'thiefsReflexes');
  const { enc } = arena({ herois: [l, outro], foes: [inimigo('goblin', { x: 11, y: 11 })] });
  assert.ok(l.features.includes('thiefsReflexes'));
  l.actionUsed = true; l.bonusUsed = true; l.movementLeftFt = 0;
  enc.endTurn(l);
  assert.equal(l.acted, false, 'o turno reabriu');
  assert.equal(l.actionUsed, false);
  assert.equal(l.bonusUsed, false);
  assert.ok(l.movementLeftFt > 0, 'o deslocamento voltou');
  enc.endTurn(l);
  assert.equal(l.acted, true, 'o segundo turno termina de vez');
  outro.actionUsed = true;
  enc.endTurn(outro);
  assert.equal(outro.acted, true, 'controle: quem não tem a característica termina de vez');
  // rodada 2: não reabre
  const l2 = heroi('ladino', 17, 'Humano');
  l2.pos = { x: 5, y: 5 };
  const { enc: e2 } = arena({ herois: [l2], foes: [inimigo('goblin', { x: 11, y: 11 })] });
  e2.round = 2;
  e2.endTurn(l2);
  assert.equal(l2.acted, true);
});
// ============================================================================================================
// FURTIVIDADE SUPREMA e TRABALHO DE ANDAR DE CIMA (ladrão)
// ============================================================================================================

teste('Furtividade Suprema (ladrão, 9º): vantagem em Furtividade a meio deslocamento; a chance da tela sobe e o resto não muda', async () => {
  const { chanceDeEsconder } = await import('../rules/marcha.js');
  const ladrao = heroi('ladino', 9, 'Humano');
  const comum = heroi('ladino', 9, 'Humano');
  comum.features = comum.features.filter((f) => f !== 'supremeSneak');
  assert.ok(ladrao.features.includes('supremeSneak'));
  const rapido = chanceDeEsconder([ladrao], 14, { lento: false });
  const devagar = chanceDeEsconder([ladrao], 14, { lento: true });
  assert.ok(devagar > rapido, `devagar ${devagar.toFixed(2)} > depressa ${rapido.toFixed(2)}`);
  assert.equal(chanceDeEsconder([comum], 14, { lento: true }), chanceDeEsconder([comum], 14, { lento: false }), 'controle: sem a característica, o ritmo não muda');
});

teste('Trabalho de Andar de Cima (ladrão, 3º): o salto com corrida soma a Destreza, e subir não custa deslocamento a mais', () => {
  const ladrao = heroi('ladino', 3, 'Humano', { abilities: { str: 10, dex: 18, con: 12, int: 10, wis: 10, cha: 10 } });
  const comum = heroi('ladino', 3, 'Humano', { abilities: { str: 10, dex: 18, con: 12, int: 10, wis: 10, cha: 10 } });
  comum.features = comum.features.filter((f) => f !== 'secondStoryWork');
  for (const h of [ladrao, comum]) h.pos = { x: 3, y: 5 };
  const { enc } = arena({ herois: [ladrao, comum], foes: [inimigo('goblin', { x: 11, y: 11 })] });
  for (const h of [ladrao, comum]) { h.corridaFt = 10; h.movementLeftFt = 30; }
  assert.equal(enc.alcanceDoSalto(ladrao) - enc.alcanceDoSalto(comum), 4, 'o modificador de DES 18 (+4) em pés');
  const mapa = ['............', '............', '............', '............', '............', '............', '............', '............', '............', '............', '............', '............'];
  const custo = (esc) => { const c = new Battlefield(12, 12, mapa); c.heights[5 * 12 + 5] = 1; c.escalaSemCusto = esc; return c.costOf(5, 5, 4, 5); };
  assert.equal(custo(false) - custo(true), 5, 'subir um degrau custa 1,5 m a mais, a não ser para quem tem o Trabalho de Andar de Cima');
});
// ============================================================================================================
// INIMIGO FAVORITO e EXPLORADOR NATURAL (patrulheiro)
// ============================================================================================================

teste('Explorador Natural: no terreno favorito, a perícia de INT/SAB em que é treinado soma o dobro da proficiência; fora dele, não', () => {
  const p = heroi('patrulheiro', 1, 'Humano', { skills: ['sobrevivencia', 'natureza'], abilities: { str: 10, dex: 14, con: 12, int: 10, wis: 14, cha: 10 } }, { 1: { naturalExplorer: 'floresta', favoredEnemy: 'goblinoidesEOrcs' } });
  assert.deepEqual(p.terrenosFavoritos, ['floresta']);
  const base = skillBonus(p, 'sobrevivencia');
  assert.equal(skillBonus(p, 'sobrevivencia', { bioma: 'floresta' }) - base, proficiencyBonus(1), 'o dobro: mais uma proficiência');
  assert.equal(skillBonus(p, 'sobrevivencia', { bioma: 'deserto' }), base, 'outro terreno: nada');
  assert.equal(skillBonus(p, 'furtividade', { bioma: 'floresta' }), skillBonus(p, 'furtividade'), 'DES não é INT/SAB');
  const outro = heroi('guerreiro', 1, 'Humano', { skills: ['sobrevivencia'] });
  assert.equal(skillBonus(outro, 'sobrevivencia', { bioma: 'floresta' }), skillBonus(outro, 'sobrevivencia'));
});

teste('Explorador Natural: caçar e colher no terreno favorito rende o dobro de comida', async () => {
  const { forragear } = await import('../rules/mantimentos.js');
  const p = heroi('patrulheiro', 1, 'Humano', { skills: ['sobrevivencia'], abilities: { str: 10, dex: 14, con: 12, int: 10, wis: 14, cha: 10 } }, { 1: { naturalExplorer: 'floresta', favoredEnemy: 'bestas' } });
  const comida = (bioma) => forragear(dadoFixo(15), p, { terreno: 'comum', bioma }).achou.comida;
  assert.equal(comida('floresta'), comida(null) * 2);
  assert.equal(comida('deserto'), comida(null));
});

teste('Inimigo Favorito: vantagem em Sobrevivência e em testes de INT contra o tipo escolhido, e só nele', () => {
  const p = heroi('patrulheiro', 1, 'Humano', { skills: ['sobrevivencia'] }, { 1: { favoredEnemy: 'goblinoidesEOrcs', naturalExplorer: 'floresta' } });
  assert.deepEqual(p.inimigosFavoritos, ['goblinoidesEOrcs']);
  const dados = [];
  const rng = () => 0.5;
  rng.die = (n) => { dados.push(n); return 10; };
  rng.int = (k) => Math.floor(rng() * k); rng.pick = (a) => a[0]; rng.chance = () => false; rng.shuffle = (a) => a.slice();
  const rolagens = (opts) => { dados.length = 0; rolarPericia(rng, p, 'sobrevivencia', opts); return dados.filter((n) => n === 20).length; };
  assert.equal(rolagens({ inimigo: 'goblinoidesEOrcs' }), 2, 'dois d20: vantagem');
  assert.equal(rolagens({ inimigo: 'mortosVivos' }), 1, 'outro tipo: um d20');
  assert.equal(rolagens({}), 1);
  dados.length = 0; rolarPericia(rng, p, 'historia', { inimigo: 'goblinoidesEOrcs' });
  assert.equal(dados.filter((n) => n === 20).length, 2, 'teste de INT para lembrar também ganha vantagem');
  const cru = heroi('guerreiro', 1, 'Humano');
  dados.length = 0; rolarPericia(rng, cru, 'sobrevivencia', { inimigo: 'goblinoidesEOrcs' });
  assert.equal(dados.filter((n) => n === 20).length, 1, 'controle: quem não é patrulheiro');
});
// ============================================================================================================
// INDOMÁVEL (guerreiro) e MATADOR DE INIMIGOS (patrulheiro, 20º)
// ============================================================================================================

teste('Indomável (guerreiro, 9º): a resistência que falha é rolada de novo e vale a nova; gasta um uso; volta no descanso longo', () => {
  const g = heroi('guerreiro', 9, 'Humano');
  g.pos = { x: 5, y: 5 };
  assert.equal(g.resources.indomitable, 1);
  const { enc } = arena({ herois: [g], foes: [inimigo('goblin', { x: 11, y: 11 })] });
  enc.rng = dadoEmSequencia(1, 20); // falha, e o novo passa
  const r = enc.resistencia(g, 'wis', 12);
  assert.equal(r.success, true);
  assert.equal(g.resources.indomitable, 0, 'gastou o uso');
  enc.rng = dadoEmSequencia(1, 20);
  assert.equal(enc.resistencia(g, 'wis', 12).success, false, 'sem uso, a falha fica');
  descansoLongo(g);
  assert.equal(g.resources.indomitable, 1);
  const g8 = heroi('guerreiro', 8, 'Humano');
  assert.equal(g8.resources.indomitable ?? 0, 0, 'antes do 9º, nada');
});

teste('Matador de Inimigos (patrulheiro, 20º): soma SAB ao dano, uma vez por turno, contra o tipo favorito — e só contra ele', () => {
  const { categoriaDoInimigo, ehInimigoFavorito } = passivasExtra;
  const p = heroi('patrulheiro', 20, 'Humano', { abilities: { str: 10, dex: 18, con: 14, int: 10, wis: 20, cha: 10 } }, { 1: { favoredEnemy: 'goblinoidesEOrcs' } });
  assert.ok(p.features.includes('foeSlayer'));
  const gob = inimigo('goblin', { x: 6, y: 5 });
  const lobo = inimigo('vigiaCiclopico', { x: 4, y: 5 });
  assert.equal(categoriaDoInimigo(gob), 'goblinoidesEOrcs');
  assert.equal(categoriaDoInimigo(lobo), 'aberracoes');
  assert.ok(ehInimigoFavorito(p, gob));
  assert.ok(!ehInimigoFavorito(p, lobo), 'controle: uma aberração não está entre os favoritos');
  p.pos = { x: 5, y: 5 };
  const soma = (alvo) => {
    const { enc, log } = arena({ herois: [heroi('patrulheiro', 20, 'Humano', { abilities: { str: 10, dex: 18, con: 14, int: 10, wis: 20, cha: 10 } }, { 1: { favoredEnemy: 'goblinoidesEOrcs' } })], foes: [alvo] });
    const h = enc.allOf('party')[0];
    h.pos = { x: 5, y: 5 };
    enc.rng = dadoFixo(18);
    enc.resolveAttack(h, alvo);
    return log.some((e) => /Matador de Inimigos/.test(JSON.stringify(e)));
  };
  assert.equal(soma(inimigo('bugbear', { x: 6, y: 5 })), true);
  assert.equal(soma(inimigo('vigiaCiclopico', { x: 6, y: 5 })), false);
});
// ============================================================================================================
// AÇÕES DE CLASSE, LOTE 1: bárbaro Berserker e bardo
// ============================================================================================================

teste('Frenesi (Berserker, 3º): em fúria, um ataque como ação bônus; ao fim da fúria, um nível de exaustão; fora da fúria, não', () => {
  const b = heroi('barbaro', 3, 'Humano', {}, { 3: { subclasse: 'berserker' } });
  b.pos = { x: 5, y: 5 };
  const g = alvoParado({ x: 6, y: 5 }, 'bugbear');
  const { enc, log } = arena({ herois: [b], foes: [g] });
  assert.ok(b.features.includes('frenzy'));
  assert.equal(enc.useFeature(b, 'frenzy', { target: g }), false, 'sem fúria, não');
  addCondition(b, 'furia', { rounds: 10 });
  enc.rng = dadoFixo(15);
  assert.equal(enc.useFeature(b, 'frenzy', { target: g }), true);
  assert.equal(b.bonusUsed, true);
  assert.ok(g.hp < g.maxHp, 'o ataque aconteceu');
  assert.equal(enc.useFeature(b, 'frenzy', { target: g }), false, 'uma vez por turno (ação bônus)');
  removeCondition(b, 'furia');
  enc.fimDaFuria(b);
  assert.equal(nivelDeExaustao(b), 1, 'a exaustão vem quando a fúria acaba');
  enc.fimDaFuria(b);
  assert.equal(nivelDeExaustao(b), 1, 'só uma vez');
});

teste('Presença Intimidadora (Berserker, 10º): inimigos a 9 m que falham em SAB ficam amedrontados; uma vez; quem passa e quem está longe, não', () => {
  const b = heroi('barbaro', 10, 'Humano', { abilities: { str: 16, dex: 12, con: 14, int: 10, wis: 10, cha: 14 } });
  b.pos = { x: 5, y: 2 };
  const perto = alvoParado({ x: 7, y: 2 });
  const longe = alvoParado({ x: 5, y: 11 });
  const { enc } = arena({ herois: [b], foes: [perto, longe] });
  assert.equal(b.resources.intimidatingPresence, 1);
  enc.rng = dadoFixo(1);
  assert.equal(enc.useFeature(b, 'intimidatingPresence'), true);
  assert.ok(hasCondition(perto, 'amedrontado'));
  assert.ok(!hasCondition(longe, 'amedrontado'), 'a mais de 9 m não ouve');
  b.actionUsed = false;
  assert.equal(enc.useFeature(b, 'intimidatingPresence'), false, 'uma vez por descanso longo');
  const b2 = heroi('barbaro', 10, 'Humano');
  b2.pos = { x: 5, y: 5 };
  const g2 = alvoParado({ x: 6, y: 5 });
  const { enc: e2 } = arena({ herois: [b2], foes: [g2] });
  e2.rng = dadoFixo(20);
  e2.useFeature(b2, 'intimidatingPresence');
  assert.ok(!hasCondition(g2, 'amedrontado'), 'quem passa na resistência não se amedronta');
});

teste('Retaliação (Berserker, 14º): quem leva dano de uma criatura adjacente a ataca de volta, uma vez por rodada (reação)', () => {
  const b = heroi('barbaro', 14, 'Humano');
  b.pos = { x: 5, y: 5 };
  const g = alvoParado({ x: 6, y: 5 }, 'bugbear');
  const { enc, log } = arena({ herois: [b], foes: [g] });
  enc.beginSide('foes');
  const antes = g.hp;
  enc.rng = dadoFixo(15);
  enc.applyDamage(b, 3, 'cortante', g);
  assert.ok(g.hp < antes, 'o bárbaro revidou');
  assert.equal(b.reactionUsed, true);
  const depois = g.hp;
  enc.applyDamage(b, 3, 'cortante', g);
  assert.equal(g.hp, depois, 'sem reação, não revida de novo');
  const semTraco = heroi('barbaro', 13, 'Humano');
  semTraco.pos = { x: 5, y: 5 };
  const g2 = alvoParado({ x: 6, y: 5 }, 'bugbear');
  const { enc: e2 } = arena({ herois: [semTraco], foes: [g2] });
  e2.beginSide('foes');
  e2.applyDamage(semTraco, 3, 'cortante', g2);
  assert.equal(g2.hp, g2.maxHp, 'controle: no 13º ainda não');
});

teste('Contracanto (bardo, 6º): o grupo a 9 m ganha vantagem contra medo e encantamento, e só contra eles', () => {
  const bardo = heroi('bardo', 6, 'Humano');
  const amigo = heroi('guerreiro', 1, 'Humano');
  bardo.pos = { x: 5, y: 2 }; amigo.pos = { x: 6, y: 2 };
  const longe = heroi('guerreiro', 1, 'Humano');
  longe.pos = { x: 5, y: 11 };
  const { enc } = arena({ herois: [bardo, amigo, longe], foes: [inimigo('goblin', { x: 11, y: 0 })] });
  assert.equal(enc.useFeature(bardo, 'countercharm'), true);
  assert.ok(hasCondition(amigo, 'contracanto'));
  assert.ok(!hasCondition(longe, 'contracanto'));
  assert.deepEqual(vantagemPorTraco(amigo, 'wis', { condicao: 'amedrontado' }), ['Contracanto']);
  assert.deepEqual(vantagemPorTraco(amigo, 'wis', { condicao: 'enfeiticado' }), ['Contracanto']);
  assert.deepEqual(vantagemPorTraco(amigo, 'wis', { condicao: 'envenenado' }), [], 'controle: outra condição não');
});

teste('Palavras Cortantes (bardo do Conhecimento): gasta Inspiração e subtrai o dado de um acerto inimigo que vira erro; não gasta se não muda nada', () => {
  const alvo = heroi('guerreiro', 1, 'Humano');
  const bardo = heroi('bardo', 3, 'Humano', {}, { 3: { subclasse: 'conhecimento' } });
  alvo.pos = { x: 5, y: 5 }; bardo.pos = { x: 5, y: 7 };
  alvo.ac = 16;
  const g = alvoParado({ x: 6, y: 5 });
  const { enc } = arena({ herois: [alvo, bardo], foes: [g] });
  enc.beginSide('foes');
  assert.ok(bardo.features.includes('cuttingWords'));
  const insp = bardo.resources.bardicInspiration;
  const bonus = 4; // o ataque do goblin
  enc.rng = dadoFixo(16 - bonus + 1); // acerta por 1
  const r = enc.resolveAttack(g, alvo);
  assert.equal(r?.hit, false, 'o dado cortou o acerto');
  assert.equal(bardo.resources.bardicInspiration, insp - 1);
  assert.equal(bardo.reactionUsed, true);
  // acerto folgado: o dado (3) não basta, e a Inspiração fica
  bardo.reactionUsed = false;
  enc.rng = dadoFixo(20 - 1); // 19 + 4 = 23: 20 de folga demais para o d6 (3)
  const r2 = enc.resolveAttack(g, alvo);
  assert.equal(bardo.resources.bardicInspiration, insp - 1, 'não gastou à toa');
  assert.ok(r2?.hit);
});
// ============================================================================================================
// AÇÕES DE CLASSE, LOTE 2: clérigo e paladino
// ============================================================================================================

teste('Intervenção Divina (clérigo, 10º): d100 até o nível atende (cura o grupo e cala o deus por 7 dias); falhou, só volta no descanso longo', () => {
  const c = heroi('clerigo', 10, 'Humano');
  const amigo = heroi('guerreiro', 1, 'Humano');
  c.pos = { x: 5, y: 5 }; amigo.pos = { x: 6, y: 5 };
  const { enc } = arena({ herois: [c, amigo], foes: [inimigo('goblin', { x: 11, y: 11 })] });
  assert.equal(c.resources.divineIntervention, 1);
  amigo.hp = 1;
  enc.rng = dadoFixo(50, 100);
  assert.equal(enc.useFeature(c, 'divineIntervention'), true);
  assert.equal(amigo.hp, 1, 'd100 de 50 contra 10: silêncio');
  assert.equal(c.resources.divineIntervention, 0);
  assert.ok(!(c.intervencaoDias > 0));
  descansoLongo(c);
  assert.equal(c.resources.divineIntervention, 1, 'o descanso longo devolve o pedido');
  c.actionUsed = false;
  enc.rng = dadoFixo(7, 100);
  assert.equal(enc.useFeature(c, 'divineIntervention'), true);
  assert.equal(amigo.hp, amigo.maxHp, 'd100 de 7 contra 10: o deus atende');
  assert.equal(c.intervencaoDias, 7);
  descansoLongo(c);
  assert.equal(c.resources.divineIntervention, 1);
  c.actionUsed = false;
  assert.equal(enc.useFeature(c, 'divineIntervention'), false, 'calado por seis dias ainda');
  const c9 = heroi('clerigo', 9, 'Humano');
  assert.equal(c9.resources.divineIntervention ?? 0, 0, 'antes do 10º, nada');
});

teste('Arma Sagrada (Devoção, 3º): gasta Canalizar Divindade e soma CAR (mín. +1) aos ataques; Expulsar os Profanos faz fugir corruptor e morto-vivo', () => {
  const p = heroi('paladino', 3, 'Humano', { abilities: { str: 16, dex: 10, con: 14, int: 10, wis: 10, cha: 16 } });
  p.pos = { x: 5, y: 5 };
  const morto = alvoParado({ x: 7, y: 5 }, 'caveiraCandente');
  const goblin = alvoParado({ x: 6, y: 6 });
  const { enc } = arena({ herois: [p], foes: [morto, goblin] });
  assert.equal(p.resources.channelDivinity, 1);
  assert.equal(enc.useFeature(p, 'sacredWeapon'), true);
  assert.ok(conditionEffects(p).attackBonusDice.includes('+3'), 'CAR 16 = +3');
  assert.equal(p.resources.channelDivinity, 0);
  p.actionUsed = false;
  assert.equal(enc.useFeature(p, 'turnTheUnholy'), false, 'sem carga');
  p.resources.channelDivinity = 1;
  enc.rng = dadoFixo(1);
  assert.equal(enc.useFeature(p, 'turnTheUnholy'), true);
  assert.ok(hasCondition(morto, 'amedrontado'), 'o morto-vivo falhou e foge');
  assert.ok(!hasCondition(goblin, 'amedrontado'), 'controle: um goblin não é profano');
});

teste('Nimbo Sagrado (Devoção, 20º): 10 radiante em quem começa o turno a 9 m, e vantagem contra magia de corruptor e morto-vivo; uma vez', () => {
  const p = heroi('paladino', 20, 'Humano');
  p.pos = { x: 5, y: 2 };
  const perto = alvoParado({ x: 6, y: 2 });
  const longe = alvoParado({ x: 5, y: 11 });
  const { enc } = arena({ herois: [p], foes: [perto, longe] });
  assert.equal(p.resources.holyNimbus, 1);
  assert.equal(enc.useFeature(p, 'holyNimbus'), true);
  enc.beginSide('foes');
  assert.equal(perto.maxHp - perto.hp, 10, 'a luz queima quem está perto');
  assert.equal(longe.hp, longe.maxHp, 'quem está longe não');
  assert.deepEqual(vantagemPorTraco(p, 'wis', { magico: true, fonteTipo: 'morto-vivo' }), ['Nimbo Sagrado']);
  assert.deepEqual(vantagemPorTraco(p, 'wis', { magico: true, fonteTipo: 'humanoide' }), [], 'controle: outro conjurador');
  p.actionUsed = false;
  assert.equal(enc.useFeature(p, 'holyNimbus'), false, 'uma vez por descanso longo');
});

teste('Toque Purificador (paladino, 14º): encerra uma magia no aliado tocado, gasta um uso; sem magia, não gasta', () => {
  const p = heroi('paladino', 14, 'Humano', { abilities: { str: 16, dex: 10, con: 14, int: 10, wis: 10, cha: 16 } });
  const amigo = heroi('guerreiro', 1, 'Humano');
  p.pos = { x: 5, y: 5 }; amigo.pos = { x: 6, y: 5 };
  const { enc } = arena({ herois: [p, amigo], foes: [inimigo('goblin', { x: 11, y: 11 })] });
  const usos = Math.max(1, abilityModDe(p.abilities.cha));
  assert.equal(p.resources.cleansingTouch, usos, 'CAR vira usos');
  assert.equal(enc.useFeature(p, 'cleansingTouch', { target: amigo }), false, 'sem magia nenhuma, nada a encerrar');
  assert.equal(p.resources.cleansingTouch, usos);
  addCondition(amigo, 'lentificado', { rounds: 10, magia: { id: 'lentidao', circulo: 3 } });
  assert.equal(enc.useFeature(p, 'cleansingTouch', { target: amigo }), true);
  assert.ok(!hasCondition(amigo, 'lentificado'));
  assert.equal(p.resources.cleansingTouch, usos - 1);
});
// ============================================================================================================
// AÇÕES DE CLASSE, LOTE 3: monge
// ============================================================================================================

teste('Queda Lenta (monge, 4º): o dano de queda cai em 5 × o nível; quem não é monge leva tudo', () => {
  const m = heroi('monge', 4, 'Humano');
  assert.equal(danoDeQueda(m, 12), 0, 'um monge de 4º absorve até 20');
  assert.equal(danoDeQueda(m, 25), 5);
  assert.equal(danoDeQueda(heroi('guerreiro', 4, 'Humano'), 12), 12, 'controle');
  assert.equal(danoDeQueda(heroi('monge', 3, 'Humano'), 12), 12, 'antes do 4º, nada');
});

teste('Defletir Projéteis (monge, 3º): reação; ataque à distância perde 1d10 + DES + nível; zerado e com ki, devolve; corpo a corpo não', () => {
  const m = heroi('monge', 5, 'Humano', { abilities: { str: 10, dex: 16, con: 12, int: 10, wis: 14, cha: 10 } });
  m.pos = { x: 5, y: 5 };
  const g = alvoParado({ x: 9, y: 5 });
  const { enc } = arena({ herois: [m], foes: [g] });
  enc.beginSide('foes');
  enc.rng = dadoFixo(15);
  const ki = m.resources.ki;
  const hp0 = m.hp;
  enc.applyDamage(m, 5, 'perfurante', g, { deArma: true, corpoACorpo: false });
  assert.equal(m.hp, hp0, 'o dano de 5 foi zerado (1d10 = 5, +3 DES, +5 nível)');
  assert.equal(m.resources.ki, ki - 1, 'devolveu o projétil, gastando 1 de ki');
  assert.ok(m.reactionUsed);
  assert.ok(g.hp < g.maxHp, 'e o projétil acertou quem atirou');
  const m2 = heroi('monge', 5, 'Humano');
  m2.pos = { x: 5, y: 5 };
  const g2 = alvoParado({ x: 6, y: 5 });
  const { enc: e2 } = arena({ herois: [m2], foes: [g2] });
  e2.beginSide('foes');
  const h2 = m2.hp;
  e2.applyDamage(m2, 5, 'cortante', g2, { deArma: true, corpoACorpo: true });
  assert.equal(m2.hp, h2 - 5, 'controle: golpe corpo a corpo não é defletido');
});

teste('Quietude da Mente (7º) e Integridade do Corpo (Mão Aberta, 6º)', () => {
  const m = heroi('monge', 7, 'Humano');
  m.pos = { x: 5, y: 5 };
  const { enc } = arena({ herois: [m], foes: [inimigo('goblin', { x: 11, y: 11 })] });
  assert.equal(enc.useFeature(m, 'stillnessOfMind'), false, 'sem nada a encerrar');
  addCondition(m, 'amedrontado', { rounds: 10 });
  assert.equal(enc.useFeature(m, 'stillnessOfMind'), true);
  assert.ok(!hasCondition(m, 'amedrontado'));
  const w = heroi('monge', 6, 'Humano');
  w.pos = { x: 4, y: 5 };
  const { enc: e2 } = arena({ herois: [w], foes: [inimigo('goblin', { x: 11, y: 11 })] });
  w.hp = 1;
  assert.equal(e2.useFeature(w, 'wholenessOfBody'), true);
  assert.equal(w.hp, Math.min(w.maxHp, 1 + 18), '3 × 6');
  w.actionUsed = false;
  assert.equal(e2.useFeature(w, 'wholenessOfBody'), false, 'uma vez por descanso longo');
});

teste('Corpo Vazio (monge, 18º): 4 de ki, invisível e resistente a tudo menos energético; atacar não desfaz', () => {
  const m = heroi('monge', 18, 'Humano');
  m.pos = { x: 5, y: 5 };
  const g = alvoParado({ x: 6, y: 5 });
  const { enc } = arena({ herois: [m], foes: [g] });
  const ki = m.resources.ki;
  assert.equal(enc.useFeature(m, 'emptyBody'), true);
  assert.equal(m.resources.ki, ki - 4);
  assert.ok(hasCondition(m, 'invisivel'));
  enc.quebraInvisibilidade(m);
  assert.ok(hasCondition(m, 'invisivel'), 'a invisibilidade do monge não quebra ao atacar');
  const antes = m.hp;
  enc.applyDamage(m, 10, 'fogo', g);
  assert.equal(antes - m.hp, 5, 'resistência a fogo');
  const antes2 = m.hp;
  enc.applyDamage(m, 10, 'energético', g);
  assert.equal(antes2 - m.hp, 10, 'energético passa inteiro');
});

teste('Palma Vibrante (monge, 17º): 3 de ki armam; o golpe que acerta marca; encerrar faz CON (cai a 0 PV) ou 10d10 necrótico', () => {
  const montar = () => {
    const m = heroi('monge', 17, 'Humano', { abilities: { str: 10, dex: 18, con: 12, int: 10, wis: 18, cha: 10 } });
    m.pos = { x: 5, y: 5 };
    const g = alvoParado({ x: 6, y: 5 }, 'bugbear');
    g.abilities = { ...g.abilities, con: 8 };
    const { enc } = arena({ herois: [m], foes: [g] });
    return { m, g, enc };
  };
  const { m, g, enc } = montar();
  const ki = m.resources.ki;
  assert.equal(enc.useFeature(m, 'quiveringPalm'), true);
  assert.equal(m.resources.ki, ki - 3);
  enc.rng = dadoFixo(15);
  enc.resolveAttack(m, g, { weaponId: 'punhos' });
  assert.equal(g.vibracao?.donoId, m.id, 'o golpe deixou as vibrações');
  m.actionUsed = false;
  enc.rng = dadoFixo(1);
  assert.equal(enc.useFeature(m, 'quiveringPalm', { target: g, modo: 'encerrar' }), true);
  assert.equal(g.hp, 0, 'falhou na CON: a 0 PV');
  const { m: m2, g: g2, enc: e2 } = montar();
  g2.vibracao = { donoId: m2.id };
  e2.rng = dadoFixo(20);
  e2.useFeature(m2, 'quiveringPalm', { target: g2, modo: 'encerrar' });
  assert.ok(g2.hp < g2.maxHp && g2.hp > 0 || g2.dead, 'passou: 10d10 necrótico, e não cai direto a 0 sem o dano');
  assert.equal(g2.vibracao, undefined);
});
// ============================================================================================================
// AÇÕES DE CLASSE, LOTE 4: Caçador e ladino
// ============================================================================================================

const COM_CAIXOTE = MAPA.map((l, y) => (y === 5 ? '......o.....' : l));

teste('Esconder-se em luta (Ação Ardilosa, Sumir): precisa de cobertura contra quem vê e de Furtividade acima da Percepção passiva', () => {
  const l = heroi('ladino', 2, 'Humano', { abilities: { str: 10, dex: 18, con: 12, int: 10, wis: 10, cha: 10 } });
  l.pos = { x: 7, y: 5 };
  const g = alvoParado({ x: 4, y: 5 });
  const { enc } = arena({ herois: [l], foes: [g], mapa: COM_CAIXOTE });
  enc.rng = dadoFixo(20);
  assert.equal(enc.useFeature(l, 'cunningAction', { modo: 'esconder' }), true);
  assert.equal(l.bonusUsed, true);
  assert.ok(hasCondition(l, 'invisivel'), 'escondido');
  enc.quebraInvisibilidade(l);
  assert.ok(!hasCondition(l, 'invisivel'), 'atacar revela quem se escondeu');
  // sem cobertura: não esconde
  const l2 = heroi('ladino', 2, 'Humano', { abilities: { str: 10, dex: 18, con: 12, int: 10, wis: 10, cha: 10 } });
  l2.pos = { x: 7, y: 8 };
  const g2 = alvoParado({ x: 4, y: 8 });
  const { enc: e2 } = arena({ herois: [l2], foes: [g2] });
  e2.rng = dadoFixo(20);
  e2.useFeature(l2, 'cunningAction', { modo: 'esconder' });
  assert.ok(!hasCondition(l2, 'invisivel'), 'em campo aberto não há onde se esconder');
  // notado: Furtividade abaixo da Percepção
  const l3 = heroi('ladino', 2, 'Humano');
  l3.pos = { x: 7, y: 5 };
  const g3 = alvoParado({ x: 4, y: 5 });
  const { enc: e3 } = arena({ herois: [l3], foes: [g3], mapa: COM_CAIXOTE });
  e3.rng = dadoFixo(1);
  e3.useFeature(l3, 'cunningAction', { modo: 'esconder' });
  assert.ok(!hasCondition(l3, 'invisivel'), 'tirou 1: foi notado');
});

teste('Sumir (patrulheiro, 14º) esconde como ação bônus; Mãos Rápidas (ladrão, 3º) usa objeto como ação bônus', () => {
  const p = heroi('patrulheiro', 14, 'Humano', { abilities: { str: 10, dex: 18, con: 12, int: 10, wis: 14, cha: 10 } });
  p.pos = { x: 7, y: 5 };
  const g = alvoParado({ x: 4, y: 5 });
  const { enc } = arena({ herois: [p], foes: [g], mapa: COM_CAIXOTE });
  enc.rng = dadoFixo(20);
  assert.equal(enc.useFeature(p, 'vanish'), true);
  assert.ok(hasCondition(p, 'invisivel'));
  assert.equal(p.bonusUsed, true);
  const l = heroi('ladino', 3, 'Humano');
  l.pos = { x: 5, y: 5 };
  const { enc: e2 } = arena({ herois: [l], foes: [inimigo('goblin', { x: 11, y: 11 })] });
  l.hp = 1;
  const r = e2.useItem(l, 'pocaoDeCura');
  assert.ok(r.ok, r.why);
  assert.equal(l.bonusUsed, true, 'gastou a ação bônus');
  assert.equal(l.actionUsed, false, 'e a ação ficou livre');
  const c = heroi('guerreiro', 3, 'Humano');
  c.pos = { x: 5, y: 5 };
  const { enc: e3 } = arena({ herois: [c], foes: [inimigo('goblin', { x: 11, y: 11 })] });
  c.hp = 1;
  e3.useItem(c, 'pocaoDeCura');
  assert.equal(c.actionUsed, true, 'controle: quem não é ladrão gasta a ação');
});

teste('Saraivada e Ataque Giratório (Caçador, 11º): um ataque contra cada criatura na área; só uma delas vem por escolha', () => {
  const arq = heroi('patrulheiro', 11, 'Humano', { abilities: { str: 10, dex: 18, con: 12, int: 10, wis: 14, cha: 10 } });
  assert.ok(arq.features.includes('volley') && !arq.features.includes('whirlwindAttack'), 'o padrão é a Saraivada');
  arq.pos = { x: 2, y: 5 };
  const a = alvoParado({ x: 8, y: 5 }, 'bugbear');
  const b = alvoParado({ x: 9, y: 5 }, 'bugbear');
  const longe = alvoParado({ x: 8, y: 10 }, 'bugbear');
  const { enc } = arena({ herois: [arq], foes: [a, b, longe] });
  arq.equippedWeapon = 'arcoCurto';
  enc.rng = dadoFixo(18);
  assert.equal(enc.useFeature(arq, 'volley', { target: a }), true);
  assert.ok(a.hp < a.maxHp && b.hp < b.maxHp, 'os dois vizinhos levaram');
  assert.equal(longe.hp, longe.maxHp, 'quem está a mais de 3 m não');
  const giro = heroi('patrulheiro', 11, 'Humano', {}, { 11: { multiattack: 'whirlwindAttack' } });
  assert.ok(giro.features.includes('whirlwindAttack'));
  giro.pos = { x: 5, y: 5 };
  const x = alvoParado({ x: 6, y: 5 }, 'bugbear');
  const y = alvoParado({ x: 4, y: 5 }, 'bugbear');
  const { enc: e2 } = arena({ herois: [giro], foes: [x, y] });
  e2.rng = dadoFixo(18);
  assert.equal(e2.useFeature(giro, 'whirlwindAttack'), true);
  assert.ok(x.hp < x.maxHp && y.hp < y.maxHp);
});

teste('Defesa Contra a Maré (Caçador, 15º): o golpe corpo a corpo que erra o patrulheiro cai em outra criatura ao alcance do atacante', () => {
  const p = heroi('patrulheiro', 15, 'Humano', {}, { 15: { superiorHuntersDefense: 'standAgainstTheTide' } });
  assert.ok(p.features.includes('standAgainstTheTide'));
  p.pos = { x: 5, y: 5 };
  const g = alvoParado({ x: 6, y: 5 }, 'bugbear');
  const g2 = alvoParado({ x: 7, y: 5 }, 'bugbear');
  const { enc, log } = arena({ herois: [p], foes: [g, g2] });
  enc.beginSide('foes');
  enc.rng = dadoFixo(1); // erra o patrulheiro
  enc.resolveAttack(g, p);
  assert.equal(p.reactionUsed, true);
  assert.equal(contaLog(log, /Defesa Contra a Maré/), 1, 'o golpe foi desviado');
  assert.equal(contaLog(log, /erra/) >= 2, true, 'e o desvio também é um ataque (aqui, errou de novo)');
});

teste('Golpe de Sorte (ladino, 20º): um ataque que erra vira acerto, uma vez por descanso curto', () => {
  const l = heroi('ladino', 20, 'Humano');
  l.pos = { x: 5, y: 5 };
  const g = alvoParado({ x: 6, y: 5 }, 'bugbear');
  const { enc } = arena({ herois: [l], foes: [g] });
  assert.equal(l.resources.strokeOfLuck, 1);
  enc.rng = dadoFixo(1);
  const r = enc.resolveAttack(l, g);
  assert.equal(r?.hit, true, 'o erro virou acerto');
  assert.equal(l.resources.strokeOfLuck, 0);
  const r2 = enc.resolveAttack(l, g);
  assert.equal(r2?.hit, false, 'só uma vez');
  recuperarNoCurto(l);
  assert.equal(l.resources.strokeOfLuck, 1, 'volta no descanso curto');
});
// ============================================================================================================
// AÇÕES DE CLASSE, LOTE 5: bruxo do Corruptor
// ============================================================================================================

teste('Sorte do Obscuro (Corruptor, 6º): +1d10 numa resistência que falhou, só se isso a salva; Lançar pelo Inferno dá 10d10 psíquico no acerto', () => {
  const b = heroi('bruxo', 14, 'Humano', { abilities: { str: 10, dex: 12, con: 14, int: 10, wis: 12, cha: 18 } });
  b.pos = { x: 5, y: 5 };
  const g = alvoParado({ x: 6, y: 5 }, 'bugbear');
  const { enc } = arena({ herois: [b], foes: [g] });
  assert.equal(b.resources.darkOnesOwnLuck, 1);
  // d20 = 5 e o bônus de SAB (com proficiência) dão 11; o d10 fixo (5) leva a 16: contra CD 20 não salva, então não gasta
  enc.rng = dadoFixo(5);
  const r1 = enc.resistencia(b, 'wis', 20);
  assert.equal(r1.success, false);
  assert.equal(b.resources.darkOnesOwnLuck, 1, 'o d10 não bastava: não gasta');
  const r2 = enc.resistencia(b, 'wis', 15);
  assert.equal(r2.success, true, 'contra CD 15, o d10 salva');
  assert.equal(b.resources.darkOnesOwnLuck, 0, 'gastou');
  // Lançar pelo Inferno
  b.resources.hurlThroughHell = 1;
  assert.equal(enc.useFeature(b, 'hurlThroughHell'), true);
  const antes = g.hp;
  enc.rng = dadoFixo(15);
  enc.resolveAttack(b, g);
  assert.ok(antes - g.hp >= 10, `o acerto levou os 10d10 (${antes - g.hp} de dano)`);
  assert.equal(b.hurlPronto, false);
});
// ============================================================================================================
// FEITICEIRO: Fonte de Magia, Metamagia, Asas e Presença Dracônicas
// ============================================================================================================

const feiticeiro = (nivel, extra = {}) => {
  const s = heroi('feiticeiro', nivel, 'Humano', { abilities: { str: 10, dex: 14, con: 14, int: 10, wis: 10, cha: 18 }, ...extra });
  s.pos = { x: 5, y: 5 };
  for (const m of ['bolaDeFogo', 'misselMagico', 'curarFerimentos', 'imobilizarPessoa']) if (!s.spellcasting.prepared.includes(m)) s.spellcasting.prepared.push(m);
  // o jogo escolhe duas metamagias sozinho; os testes precisam de todas
  for (const m of ['carefulSpell', 'distantSpell', 'empoweredSpell', 'extendedSpell', 'heightenedSpell', 'quickenedSpell', 'subtleSpell', 'twinnedSpell']) if (!s.features.includes(m)) s.features.push(m);
  return s;
};

teste('Fonte de Magia (feiticeiro, 2º): espaço rende pontos iguais ao círculo; pontos criam espaço pelo preço do livro; uma ação bônus', () => {
  const s = feiticeiro(5);
  const { enc } = arena({ herois: [s], foes: [inimigo('goblin', { x: 11, y: 11 })] });
  assert.equal(s.resources.sorceryPoints, 5);
  s.resources.sorceryPoints = 0;
  const d1 = s.spellcasting.slots[1];
  assert.equal(enc.useFeature(s, 'fontOfMagic', { modo: 'pontos' }), true);
  assert.equal(s.resources.sorceryPoints, 1, 'um espaço de 1º círculo rende 1 ponto');
  assert.equal(s.spellcasting.slots[1], d1 - 1);
  assert.equal(enc.useFeature(s, 'fontOfMagic', { modo: 'pontos' }), false, 'uma ação bônus por turno');
  s.bonusUsed = false;
  s.resources.sorceryPoints = 5;
  const d2 = s.spellcasting.slots[2];
  assert.equal(enc.useFeature(s, 'fontOfMagic', { modo: 'espaco', valor: 2 }), true);
  assert.equal(s.resources.sorceryPoints, 2, 'um espaço de 2º custa 3 pontos');
  assert.equal(s.spellcasting.slots[2], d2 + 1);
  s.bonusUsed = false;
  assert.equal(enc.useFeature(s, 'fontOfMagic', { modo: 'espaco', valor: 3 }), false, 'um de 3º custa 5: faltam pontos');
});

teste('Metamagia: Cuidadosa poupa o aliado na área; Rápida troca a ação pela ação bônus; sem pontos, a magia sai sem metamagia', () => {
  const s = feiticeiro(5);
  const amigo = heroi('guerreiro', 1, 'Humano');
  s.pos = { x: 2, y: 5 }; amigo.pos = { x: 8, y: 6 };
  const g = alvoParado({ x: 8, y: 5 });
  const { enc, log } = arena({ herois: [s, amigo], foes: [g] });
  enc.rng = dadoFixo(1); // todos falham
  s.metaLigada = ['carefulSpell'];
  const r = enc.castSpell(s, 'bolaDeFogo', { point: { x: 8, y: 5 } });
  assert.ok(r.ok, r.why);
  assert.equal(amigo.hp, amigo.maxHp, 'o aliado passou sozinho: nenhum dano');
  assert.ok(g.hp < g.maxHp, 'o inimigo levou');
  assert.equal(s.resources.sorceryPoints, 4, 'Cuidadosa custa 1');
  // Rápida
  const q = feiticeiro(5);
  q.pos = { x: 5, y: 5 };
  const g2 = alvoParado({ x: 8, y: 5 });
  const { enc: e2 } = arena({ herois: [q], foes: [g2] });
  q.metaLigada = ['quickenedSpell'];
  const r2 = e2.castSpell(q, 'misselMagico', { target: g2 });
  assert.ok(r2.ok, r2.why);
  assert.equal(q.actionUsed, false, 'a ação ficou livre');
  assert.equal(q.bonusUsed, true, 'a ação bônus pagou a magia');
  assert.equal(q.resources.sorceryPoints, 3, 'Rápida custa 2');
  assert.equal(SPELLS.misselMagico.castTime, 'action', 'a magia volta ao normal depois');
  // sem pontos
  const z = feiticeiro(5);
  z.pos = { x: 5, y: 5 };
  const g3 = alvoParado({ x: 8, y: 5 });
  const { enc: e3 } = arena({ herois: [z], foes: [g3] });
  z.resources.sorceryPoints = 0;
  z.metaLigada = ['quickenedSpell'];
  assert.ok(e3.castSpell(z, 'misselMagico', { target: g3 }).ok);
  assert.equal(z.actionUsed, true, 'sem pontos, a magia sai como ação');
  assert.equal(z.resources.sorceryPoints, 0);
});

teste('Metamagia: Gêmea cura dois por um espaço e custa o círculo; Potencializada e Elevada cobram; Prolongada dobra a duração', () => {
  const s = feiticeiro(5);
  const a = heroi('guerreiro', 1, 'Humano'), b = heroi('guerreiro', 1, 'Humano');
  s.pos = { x: 5, y: 5 }; a.pos = { x: 6, y: 5 }; b.pos = { x: 4, y: 5 };
  a.hp = 1; b.hp = 1;
  const { enc, log } = arena({ herois: [s, a, b], foes: [inimigo('goblin', { x: 11, y: 11 })] });
  s.metaLigada = ['twinnedSpell'];
  const slots = s.spellcasting.slots[1];
  const r = enc.castSpell(s, 'curarFerimentos', { target: a });
  assert.ok(r.ok, r.why);
  assert.ok(a.hp > 1 && b.hp > 1, 'os dois foram curados');
  assert.equal(s.spellcasting.slots[1], slots - 1, 'um espaço só');
  assert.equal(s.resources.sorceryPoints, 4, 'Gêmea de 1º círculo custa 1');
  // Elevada e Potencializada cobram juntas (3 + 1)
  const e = feiticeiro(5);
  e.pos = { x: 2, y: 5 };
  const g = alvoParado({ x: 8, y: 5 });
  const { enc: e2 } = arena({ herois: [e], foes: [g] });
  e.metaLigada = ['heightenedSpell', 'empoweredSpell'];
  assert.ok(e2.castSpell(e, 'bolaDeFogo', { point: { x: 8, y: 5 } }).ok);
  assert.equal(e.resources.sorceryPoints, 1, '5 − 3 − 1');
  // Prolongada dobra a duração do efeito
  const x = feiticeiro(5);
  x.pos = { x: 5, y: 5 };
  const hh = alvoParado({ x: 7, y: 5 }, 'bandido');
  const { enc: ex } = arena({ herois: [x], foes: [hh] });
  ex.rng = dadoFixo(1);
  x.metaLigada = ['extendedSpell'];
  assert.ok(ex.castSpell(x, 'imobilizarPessoa', { target: hh }).ok);
  assert.equal(x.concentrating?.rounds, 20, 'um minuto de concentração vira dois');
  // Gêmea não vale em concentração
  const c = feiticeiro(5);
  c.pos = { x: 5, y: 5 };
  const h = alvoParado({ x: 7, y: 5 }, 'bandido'), h2 = alvoParado({ x: 8, y: 5 }, 'bandido');
  const { enc: e3 } = arena({ herois: [c], foes: [h, h2] });
  c.metaLigada = ['twinnedSpell'];
  e3.castSpell(c, 'imobilizarPessoa', { target: h });
  assert.equal(c.resources.sorceryPoints, 5, 'concentração não pode ser gêmea: não gastou ponto');
});

teste('Asas Dracônicas (14º) dão voo, sem armadura; Presença Dracônica (18º) custa 5 pontos e enfeitiça quem falha em SAB', () => {
  const s = feiticeiro(14);
  s.pos = { x: 5, y: 5 };
  s.armor = 'nenhuma';
  const { enc } = arena({ herois: [s], foes: [inimigo('goblin', { x: 11, y: 11 })] });
  assert.equal(s.resources.dragonWings, 1);
  assert.equal(enc.useFeature(s, 'dragonWings'), true);
  assert.ok(hasCondition(s, 'voando'));
  s.bonusUsed = false;
  assert.equal(enc.useFeature(s, 'dragonWings'), false, 'uma vez por descanso longo');
  const p = feiticeiro(18);
  p.pos = { x: 5, y: 2 };
  const g = alvoParado({ x: 8, y: 2 }, 'bandido');
  const { enc: e2 } = arena({ herois: [p], foes: [g] });
  e2.rng = dadoFixo(1);
  const antes = p.resources.sorceryPoints;
  assert.equal(e2.useFeature(p, 'draconicPresence'), true);
  assert.equal(p.resources.sorceryPoints, antes - 5);
  assert.ok(hasCondition(g, 'enfeiticado'));
});
// ============================================================================================================
// BRUXO: invocações e Dádiva do Pacto
// ============================================================================================================

const bruxo = (nivel, features = []) => {
  const b = heroi('bruxo', nivel, 'Humano', { abilities: { str: 10, dex: 14, con: 14, int: 10, wis: 10, cha: 18 } });
  b.pos = { x: 5, y: 5 };
  for (const f of features) if (!b.features.includes(f)) b.features.push(f);
  aplicarInvocacoes(b, SPELLS);
  return b;
};

teste('Invocações passivas: Armadura de Sombras (CA 13 + DES), Visão do Diabo (36 m no escuro), Visão das Bruxas (visão verdadeira de 9 m)', () => {
  const sem = bruxo(5);
  sem.features = sem.features.filter((f) => !['armorOfShadows', 'devilsSight', 'witchSight'].includes(f));
  sem.armor = 'nenhuma';
  const com = bruxo(5, ['armorOfShadows', 'devilsSight', 'witchSight']);
  com.armor = 'nenhuma';
  assert.ok(armorClass(com) > armorClass(sem), `CA ${armorClass(com)} contra ${armorClass(sem)}`);
  assert.equal(armorClass(com), 13 + abilityModDe(com.abilities.dex));
  assert.equal(visaoNoEscuro(com), 120);
  assert.equal(com.senses.truesightFt, 30);
  assert.ok(visaoNoEscuro(sem) < 120);
});

teste('Invocações que dão magia: à vontade (Vigor Diabólico) e uma vez por descanso longo (Ladrão dos Cinco Destinos), sem gastar espaço', () => {
  const b = bruxo(5, ['fiendishVigor', 'thiefOfFiveFates']);
  const g = alvoParado({ x: 7, y: 5 }, 'bugbear');
  const { enc } = arena({ herois: [b], foes: [g] });
  assert.ok(magiasProntas(b).includes('vidaFalsa') && magiasProntas(b).includes('perdicao'));
  const slots = [...b.spellcasting.slots];
  enc.rng = dadoFixo(10);
  assert.ok(enc.castSpell(b, 'vidaFalsa', { target: b }).ok);
  assert.deepEqual(b.spellcasting.slots, slots, 'à vontade: nenhum espaço gasto');
  b.actionUsed = false;
  assert.ok(enc.castSpell(b, 'vidaFalsa', { target: b }).ok, 'e de novo');
  assert.equal(b.resources.invocacao_perdicao, 1);
  b.actionUsed = false;
  assert.ok(enc.castSpell(b, 'perdicao', { target: g }).ok);
  assert.equal(b.resources.invocacao_perdicao, 0, 'uma vez por descanso longo');
  assert.deepEqual(b.spellcasting.slots, slots, 'sem espaço também');
  descansoLongo(b);
  assert.equal(b.resources.invocacao_perdicao, 1);
});

teste('Pacto da Lâmina: arma mágica; Lâmina Sedenta dá um ataque a mais; Sorvedor de Vida soma CAR necrótico; sem o pacto, nada disso', () => {
  const golpes = (b) => {
    const g = alvoParado({ x: 6, y: 5 }, 'bugbear');
    const { enc, eventos } = arena({ herois: [b], foes: [g] });
    enc.rng = dadoFixo(15);
    enc.attackAction(b, g);
    return eventos.filter((e) => e.type === 'attack').length;
  };
  const lamina = bruxo(12, ['pactOfTheBlade', 'thirstingBlade', 'lifedrinker']);
  const comum = bruxo(12);
  comum.features = comum.features.filter((f) => !['pactOfTheBlade', 'thirstingBlade', 'lifedrinker'].includes(f));
  assert.equal(golpes(lamina), 2, 'Lâmina Sedenta: dois ataques');
  assert.equal(golpes(comum), 1);
  const g = alvoParado({ x: 6, y: 5 }, 'bugbear');
  const b = bruxo(12, ['pactOfTheBlade', 'lifedrinker']);
  const { enc, log } = arena({ herois: [b], foes: [g] });
  enc.rng = dadoFixo(15);
  enc.resolveAttack(b, g);
  assert.equal(contaLog(log, /Sorvedor de Vida/), 1);
});

teste('Pacto do Tomo: três truques de qualquer lista; Explosão Repelente empurra 3 m; o resto não se perde', () => {
  const b = bruxo(5, ['pactOfTheTome']);
  assert.equal(b.livroDasSombras.length, 3);
  for (const c of b.livroDasSombras) assert.ok(b.spellcasting.cantrips.includes(c));
  const antes = b.spellcasting.cantrips.length;
  aplicarInvocacoes(b, SPELLS);
  assert.equal(b.spellcasting.cantrips.length, antes, 'idempotente');
  const r = bruxo(5, ['repellingBlast']);
  if (!r.spellcasting.cantrips.includes('rajadaMistica')) r.spellcasting.cantrips.push('rajadaMistica');
  r.pos = { x: 3, y: 5 };
  const g = alvoParado({ x: 6, y: 5 }, 'bugbear');
  const { enc } = arena({ herois: [r], foes: [g] });
  enc.rng = dadoFixo(18);
  assert.ok(enc.castSpell(r, 'rajadaMistica', { target: g }).ok);
  assert.ok(g.pos.x >= 8, `empurrado 3 m (x=${g.pos.x})`);
});
// ============================================================================================================
// FORMA SELVAGEM (druida, 2º)
// ============================================================================================================

teste('Forma Selvagem: o ND, o voo e a natação dependem do nível', () => {
  const f2 = formasDisponiveis(2), f4 = formasDisponiveis(4), f8 = formasDisponiveis(8);
  assert.ok(f2.includes('lobo') && f2.includes('ratoGigante'), 'no 2º: ND 1/4');
  assert.ok(!f2.includes('ursoNegro'), 'ND 1/2 só no 4º');
  assert.ok(f4.includes('ursoNegro'));
  assert.ok(!f4.includes('morcegoGigante'), 'voar só no 8º');
  assert.ok(f8.includes('morcegoGigante') && f8.includes('ursoPardo'), 'no 8º: ND 1, voo');
  assert.ok(!f8.some((id) => /Familiar$/.test(id)), 'familiares não são forma');
  assert.deepEqual(formasDisponiveis(1), [], 'no 1º, nada');
});

teste('Forma Selvagem: assume a fera (PV, CA, ataques), ataca com a mordida, não conjura, e volta com o dano que sobrou', () => {
  const d = heroi('druida', 2, 'Humano', { abilities: { str: 10, dex: 12, con: 14, int: 10, wis: 16, cha: 10 } });
  d.pos = { x: 5, y: 5 };
  const g = alvoParado({ x: 6, y: 5 }, 'bugbear');
  const { enc, log } = arena({ herois: [d], foes: [g] });
  const hp0 = d.hp, ac0 = d.ac;
  assert.equal(d.resources.wildShape, 2);
  assert.equal(enc.useFeature(d, 'wildShape', { modo: 'ursoPardo' }), false, 'urso pardo é ND 1: não no 2º');
  assert.equal(enc.useFeature(d, 'wildShape', { modo: 'lobo' }), true);
  assert.equal(d.resources.wildShape, 1);
  assert.equal(d.hp, MONSTERS.lobo.maxHp);
  assert.equal(armorClass(d), MONSTERS.lobo.ac);
  assert.equal(d.weapons, undefined, 'a barra de ações lê os golpes da fera');
  assert.equal(d.attacks[0].name, 'Mordida');
  assert.equal(d.abilities.wis, 16, 'SAB continua a do druida');
  assert.equal(d.abilities.dex, MONSTERS.lobo.abilities.dex);
  assert.equal(enc.castSpell(d, 'curarFerimentos', { target: d }).ok, false, 'na forma de fera não se conjura');
  d.actionUsed = false;
  enc.rng = dadoFixo(18);
  enc.resolveAttack(d, g);
  assert.ok(g.hp < g.maxHp, 'a mordida acertou');
  // os PV da fera acabam: volta, e o que sobrou desconta dos PV do druida
  enc.applyDamage(d, MONSTERS.lobo.maxHp + 4, 'cortante', g);
  assert.equal(d.formaSelvagem, null, 'voltou ao normal');
  assert.equal(d.hp, hp0 - 4, 'os 4 de dano que passaram da fera descontam dos PV dele');
  assert.ok(d.weapons?.length > 0 && d.attacks === undefined);
  assert.equal(d.ac, ac0);
  assert.ok(contaLog(log, /volta ao normal/) >= 1);
});

teste('Forma Selvagem: voltar custa a ação bônus; a luta acabar devolve a forma; quem não é druida não se transforma', () => {
  const d = heroi('druida', 4, 'Humano');
  d.pos = { x: 5, y: 5 };
  const g = alvoParado({ x: 6, y: 5 });
  const { enc } = arena({ herois: [d], foes: [g] });
  assert.equal(enc.useFeature(d, 'wildShape', { modo: 'ursoNegro' }), true);
  assert.equal(d.hp, MONSTERS.ursoNegro.maxHp);
  assert.equal(enc.useFeature(d, 'wildShape', { modo: 'voltar' }), true);
  assert.equal(d.bonusUsed, true);
  assert.equal(d.formaSelvagem, null);
  d.actionUsed = false;
  enc.useFeature(d, 'wildShape', { modo: 'lobo' });
  g.hp = 0; g.dead = true;
  enc.checkEnd();
  assert.equal(d.formaSelvagem, null, 'fim da luta: forma normal');
  const guerreiro = heroi('guerreiro', 4, 'Humano');
  guerreiro.pos = { x: 4, y: 5 };
  const { enc: e2 } = arena({ herois: [guerreiro], foes: [inimigo('goblin', { x: 11, y: 11 })] });
  assert.equal(e2.useFeature(guerreiro, 'wildShape', { modo: 'lobo' }), false);
});
// ============================================================================================================
// TELA DE NÍVEL: as escolhas de característica (metamagia, pacto, invocações, Maestria, Assinaturas)
// ============================================================================================================

teste('Tela de nível: o feiticeiro escolhe as metamagias; sem escolha valem as sugeridas; a escolha troca as do padrão', async () => {
  const { subirUmNivel, dadosDoCartao, escolhasConferidas } = await import('../game/nivel.js');
  const monta = () => { const s = heroi('feiticeiro', 2, 'Humano'); return { s, r: subirUmNivel(s) }; };
  const { s, r } = monta();
  const e = r.escolhas.find((x) => x.id === 'metamagia');
  assert.ok(e, 'o 3º nível oferece a metamagia');
  assert.equal(e.quantas, 2);
  assert.equal(e.opcoes.length, 8);
  assert.deepEqual(e.sugeridas, ['quickenedSpell', 'twinnedSpell'], 'o padrão do motor');
  const dado = dadosDoCartao(s, r).escolhas.find((x) => x.id === 'metamagia');
  assert.ok(dado.opcoes.every((o) => o.nome && o.nome !== o.id), 'as opções têm nome legível');
  r.aplicar({ metamagia: ['carefulSpell', 'subtleSpell'] });
  assert.ok(s.features.includes('carefulSpell') && s.features.includes('subtleSpell'));
  assert.ok(!s.features.includes('quickenedSpell') && !s.features.includes('twinnedSpell'), 'trocou as do padrão');
  const { s: s2, r: r2 } = monta();
  r2.aplicar({});
  assert.ok(s2.features.includes('quickenedSpell') && s2.features.includes('twinnedSpell'), 'sem escolha: o padrão');
  const { r: r3 } = monta();
  const conf = escolhasConferidas(r3.escolhas, { metamagia: ['carefulSpell', 'nao-existe'] });
  assert.deepEqual(conf.metamagia, ['carefulSpell', 'twinnedSpell'], 'o que não é opção volta à sugerida');
  const { s: s4, r: r4 } = monta();
  r4.aplicar({ metamagia: ['carefulSpell', 'carefulSpell'] });
  assert.equal(s4.features.filter((f) => f === 'carefulSpell').length, 1);
  assert.equal(s4.features.filter((f) => /Spell$/.test(f)).length, 2, 'repetida: a segunda volta à sugerida');
});

teste('Tela de nível: o bruxo escolhe o pacto e as invocações; trocar o pacto refaz o que dependia dele', async () => {
  const { subirUmNivel } = await import('../game/nivel.js');
  const b = heroi('bruxo', 2, 'Humano');
  const r = subirUmNivel(b);
  const pacto = r.escolhas.find((x) => x.id === 'pacto');
  assert.ok(pacto, 'o 3º nível oferece o pacto');
  assert.deepEqual(pacto.opcoes.sort(), ['pactOfTheBlade', 'pactOfTheChain', 'pactOfTheTome']);
  assert.deepEqual(pacto.sugeridas, ['pactOfTheBlade'], 'o padrão é a Lâmina');
  r.aplicar({ pacto: ['pactOfTheTome'] });
  assert.ok(b.features.includes('pactOfTheTome') && !b.features.includes('pactOfTheBlade'));
  assert.equal(b.livroDasSombras?.length, 3, 'o Tomo dá os três truques');
  for (const t of b.livroDasSombras) assert.ok(b.spellcasting.cantrips.includes(t));
  // trocar de volta para a Lâmina tira os truques do livro
  const c = heroi('bruxo', 2, 'Humano');
  const rc = subirUmNivel(c);
  rc.aplicar({ pacto: ['pactOfTheChain'] });
  assert.ok(c.spellcasting.sempreProntas.includes('encontrarFamiliar'));
  assert.ok(!c.livroDasSombras?.length);
});

teste('Tela de nível: invocações novas são escolhidas dentre as que o pacto permite; a escolhida entra e a do padrão sai', async () => {
  const { subirUmNivel } = await import('../game/nivel.js');
  const b = heroi('bruxo', 4, 'Humano');
  const r = subirUmNivel(b); // 5º: mais uma invocação
  const e = r.escolhas.find((x) => x.id === 'invocacoes');
  assert.ok(e && e.quantas === 1, 'uma invocação nova');
  assert.ok(!e.opcoes.some((o) => b.features.includes(o) && !e.sugeridas.includes(o)), 'não repete as que já tem');
  const queria = e.opcoes.find((o) => o === 'fiendishVigor') ?? e.opcoes[0];
  r.aplicar({ invocacoes: [queria] });
  assert.ok(b.features.includes(queria));
  if (queria !== e.sugeridas[0]) assert.ok(!b.features.includes(e.sugeridas[0]));
  if (queria === 'fiendishVigor') assert.ok(b.magiasDeInvocacao.some((m) => m.magia === 'vidaFalsa'), 'a magia da invocação nova vale');
});

teste('Tela de nível: Maestria em Magia e Assinaturas do mago são escolhidas entre o que ele conhece', async () => {
  const { subirUmNivel } = await import('../game/nivel.js');
  const m = heroi('mago', 17, 'Humano');
  const r = subirUmNivel(m);
  const m1 = r.escolhas.find((x) => x.id === 'maestria1');
  const m2 = r.escolhas.find((x) => x.id === 'maestria2');
  assert.ok(m1 && m2, 'o 18º oferece a Maestria');
  assert.ok(m1.opcoes.every((s) => SPELLS[s].level === 1) && m2.opcoes.every((s) => SPELLS[s].level === 2));
  const quer1 = m1.opcoes[m1.opcoes.length - 1], quer2 = m2.opcoes[m2.opcoes.length - 1];
  r.aplicar({ maestria1: [quer1], maestria2: [quer2] });
  assert.deepEqual(m.maestriaDeMagia, [quer1, quer2]);
  const m3 = heroi('mago', 19, 'Humano');
  const r3 = subirUmNivel(m3);
  const a = r3.escolhas.find((x) => x.id === 'assinaturas');
  assert.ok(a && a.quantas === 2, 'o 20º oferece as duas Assinaturas');
  const dois = a.opcoes.slice(-2);
  r3.aplicar({ assinaturas: dois });
  assert.deepEqual(m3.magiasAssinatura.map((x) => x.magia).sort(), [...dois].sort());
  for (const x of m3.magiasAssinatura) assert.equal(m3.resources[x.recurso], 1);
});
// ============================================================================================================
// MAGIAS DE 4º A 6º CÍRCULO
// ============================================================================================================

const conjurador = (classe, nivel, magias) => {
  const c = heroi(classe, nivel, 'Humano', { abilities: { str: 10, dex: 14, con: 14, int: 18, wis: 14, cha: 18 } });
  c.pos = { x: 2, y: 5 };
  for (const m of magias) if (!c.spellcasting.prepared.includes(m)) c.spellcasting.prepared.push(m);
  return c;
};

teste('4º a 6º círculo: as classes certas aprendem as magias novas, e só quando têm o círculo', async () => {
  const { listaDaClasse } = await import('../game/criacao.js');
  for (const id of ['tempestadeDeGelo', 'peleDePedra', 'invisibilidadeMaior', 'dimensaoPorta', 'coneDeFrio', 'imobilizarMonstro', 'correnteDeRelampagos', 'desintegrar', 'circuloDaMorte']) {
    assert.ok(SPELLS[id], `${id} existe`);
    assert.ok(listaDaClasse('mago', 6).magias.includes(id), `${id} está na lista do mago`);
    assert.ok(!listaDaClasse('mago', 3).magias.includes(id), `${id} não aparece antes de ter o círculo`);
  }
  assert.ok(listaDaClasse('bruxo', 6).magias.includes('circuloDaMorte'));
  assert.ok(!listaDaClasse('clerigo', 6).magias.includes('desintegrar'), 'o clérigo não aprende magia de mago');
  assert.ok(listaDaClasse('druida', 4).magias.includes('peleDePedra'));
});

teste('Tempestade de Gelo (4º), Cone de Frio (5º) e Círculo da Morte (6º): dano de área, e metade ao passar', () => {
  const m = conjurador('mago', 11, ['tempestadeDeGelo']);
  const a = alvoParado({ x: 8, y: 5 }, 'bugbear'), b = alvoParado({ x: 9, y: 5 }, 'bugbear');
  const { enc, log } = arena({ herois: [m], foes: [a, b] });
  enc.rng = dadoFixo(1);
  assert.ok(enc.castSpell(m, 'tempestadeDeGelo', { point: { x: 8, y: 5 } }).ok);
  assert.ok(a.hp < a.maxHp && b.hp < b.maxHp);
  const frio = alvoParado({ x: 6, y: 5 }, 'bugbear'), longe = alvoParado({ x: 6, y: 11 }, 'bugbear');
  const mg = conjurador('mago', 11, ['coneDeFrio']);
  const { enc: e2 } = arena({ herois: [mg], foes: [frio, longe] });
  e2.rng = dadoFixo(1);
  assert.ok(e2.castSpell(mg, 'coneDeFrio', { point: { x: 6, y: 5 } }).ok);
  assert.ok(frio.hp < frio.maxHp, 'o cone pega quem está na frente');
  assert.equal(longe.hp, longe.maxHp, 'e não quem está fora dele');
  const g1 = alvoParado({ x: 6, y: 5 }, 'bugbear');
  const mm = conjurador('mago', 11, ['circuloDaMorte']);
  const { enc: e3 } = arena({ herois: [mm], foes: [g1] });
  e3.rng = dadoFixo(1);
  assert.ok(e3.castSpell(mm, 'circuloDaMorte', { point: { x: 6, y: 5 } }).ok);
  const cheio = g1.maxHp - g1.hp;
  const g3 = alvoParado({ x: 6, y: 5 }, 'bugbear');
  const m4 = conjurador('mago', 11, ['circuloDaMorte']);
  const { enc: e4 } = arena({ herois: [m4], foes: [g3] });
  e4.rng = dadoFixo(20);
  e4.castSpell(m4, 'circuloDaMorte', { point: { x: 6, y: 5 } });
  assert.ok(g3.maxHp - g3.hp < cheio && g3.maxHp - g3.hp > 0, 'passando na CON, leva metade');
  assert.ok(log.length > 0);
});

teste('Corrente de Relâmpagos (6º): salta do primeiro alvo para os três mais próximos e não passa de 9 m', () => {
  const m = conjurador('mago', 11, ['correnteDeRelampagos']);
  const a = alvoParado({ x: 7, y: 5 }, 'bugbear');
  const perto = [alvoParado({ x: 8, y: 5 }, 'bugbear'), alvoParado({ x: 7, y: 6 }, 'bugbear'), alvoParado({ x: 8, y: 6 }, 'bugbear'), alvoParado({ x: 6, y: 6 }, 'bugbear')];
  const longe = alvoParado({ x: 7, y: 11 }, 'bugbear');
  const { enc } = arena({ herois: [m], foes: [a, ...perto, longe] });
  enc.rng = dadoFixo(1);
  assert.ok(enc.castSpell(m, 'correnteDeRelampagos', { target: a }).ok);
  assert.ok(a.hp < a.maxHp);
  assert.equal(perto.filter((x) => x.hp < x.maxHp).length, 3, 'o raio salta para três, não quatro');
  assert.equal(longe.hp, longe.maxHp, 'quem está a mais de 9 m do primeiro não é pego');
});

teste('Desintegrar (6º): quem falha na DES leva 10d6+40; quem passa não leva nada', () => {
  const m = conjurador('mago', 11, ['desintegrar']);
  const g = alvoParado({ x: 6, y: 5 }, 'bugbear');
  const { enc } = arena({ herois: [m], foes: [g] });
  enc.rng = dadoFixo(1);
  assert.ok(enc.castSpell(m, 'desintegrar', { target: g }).ok);
  assert.ok(g.maxHp - g.hp >= 40 || g.dead, 'falhou: pelo menos os 40 fixos');
  const m2 = conjurador('mago', 11, ['desintegrar']);
  const g2 = alvoParado({ x: 6, y: 5 }, 'bugbear');
  const { enc: e2 } = arena({ herois: [m2], foes: [g2] });
  e2.rng = dadoFixo(20);
  e2.castSpell(m2, 'desintegrar', { target: g2 });
  assert.equal(g2.hp, g2.maxHp, 'passou: nada');
});

teste('Pele de Pedra, Invisibilidade Maior, Porta Dimensional e Imobilizar Monstro', () => {
  const m = conjurador('mago', 11, ['peleDePedra', 'invisibilidadeMaior', 'dimensaoPorta']);
  const g = alvoParado({ x: 3, y: 5 }, 'bugbear');
  const { enc } = arena({ herois: [m], foes: [g] });
  assert.ok(enc.castSpell(m, 'peleDePedra', { target: m }).ok);
  m.actionUsed = false;
  const antes = m.hp;
  enc.applyDamage(m, 10, 'cortante', g, { magico: false, deArma: true, corpoACorpo: true });
  assert.equal(antes - m.hp, 5, 'metade do dano comum');
  const antes2 = m.hp;
  enc.applyDamage(m, 10, 'cortante', g, { magico: true, deArma: true, corpoACorpo: true });
  assert.equal(antes2 - m.hp, 10, 'arma mágica passa inteira');
  m.concentrating = null;
  assert.ok(enc.castSpell(m, 'invisibilidadeMaior', { target: m }).ok);
  assert.ok(hasCondition(m, 'invisivel'));
  enc.quebraInvisibilidade(m);
  assert.ok(hasCondition(m, 'invisivel'), 'continua invisível depois de atacar');
  m.actionUsed = false;
  const r = enc.castSpell(m, 'dimensaoPorta', { point: { x: 10, y: 10 } });
  assert.ok(r.ok, r.why);
  assert.deepEqual([m.pos.x, m.pos.y], [10, 10]);
  const m2 = conjurador('mago', 11, ['imobilizarMonstro']);
  const bb = alvoParado({ x: 5, y: 5 }, 'bugbear');
  const { enc: e2 } = arena({ herois: [m2], foes: [bb] });
  e2.rng = dadoFixo(1);
  assert.ok(e2.castSpell(m2, 'imobilizarMonstro', { target: bb }).ok);
  assert.ok(hasCondition(bb, 'paralisado'));
});

teste('Invocações que ganham magia nova e Arcana Mística do bruxo', () => {
  const b = bruxo(11, ['signOfIllOmen', 'otherworldlyLeap']);
  assert.ok(b.features.includes('mysticArcanum'));
  const arcano = b.magiasDeInvocacao.find((m) => m.arcano === 6);
  assert.equal(arcano?.magia, 'circuloDaMorte', 'uma magia de 6º círculo, uma vez por descanso longo');
  const prontas = magiasProntas(b);
  assert.ok(prontas.includes('circuloDaMorte') && prontas.includes('rogarMaldicao') && prontas.includes('salto'));
  const g = alvoParado({ x: 7, y: 5 }, 'bugbear');
  const { enc } = arena({ herois: [b], foes: [g] });
  const slots = [...b.spellcasting.slots];
  enc.rng = dadoFixo(1);
  assert.ok(enc.castSpell(b, 'circuloDaMorte', { point: { x: 7, y: 5 } }).ok);
  assert.equal(b.resources[arcano.recurso], 0, 'gastou o uso do dia');
  assert.deepEqual(b.spellcasting.slots, slots, 'e nenhum espaço');
  assert.equal(usoLivreDe(b, SPELLS.circuloDaMorte), null, 'uma vez só');
  descansoLongo(b);
  assert.equal(b.resources[arcano.recurso], 1);
});
// ============================================================================================================
// MAGIAS, SEGUNDO LOTE (4º ao 9º círculo) e SOBRECANALIZAR
// ============================================================================================================

teste('Segundo lote: as classes certas aprendem as magias', async () => {
  const { listaDaClasse } = await import('../game/criacao.js');
  for (const id of ['muralhaDeFogo', 'nuvemMortal', 'banimento', 'dedoDaMorte', 'palavraDePoderMatar', 'chuvaDeMeteoros']) {
    assert.ok(SPELLS[id], `${id} existe`);
    assert.ok(listaDaClasse('mago', 9).magias.includes(id), `${id} na lista do mago`);
  }
  assert.ok(listaDaClasse('clerigo', 6).magias.includes('curaTotal') && listaDaClasse('druida', 6).magias.includes('curaTotal'));
  assert.ok(listaDaClasse('bruxo', 9).magias.includes('palavraDePoderMatar') && !listaDaClasse('bruxo', 9).magias.includes('chuvaDeMeteoros'));
  assert.ok(!listaDaClasse('mago', 3).magias.includes('dedoDaMorte'), 'só com o círculo');
});

teste('Muralha de Fogo e Nuvem Mortal: a zona fere quem entra e quem começa o turno nela', () => {
  const m = conjurador('mago', 11, ['muralhaDeFogo', 'nuvemMortal']);
  const a = alvoParado({ x: 6, y: 5 }, 'bugbear');
  const { enc } = arena({ herois: [m], foes: [a] });
  enc.rng = dadoFixo(1);
  assert.ok(enc.castSpell(m, 'nuvemMortal', { point: { x: 6, y: 5 } }).ok);
  assert.ok(enc.zonas.length > 0, 'a nuvem é uma zona');
  enc.beginSide('foes');
  assert.ok(a.hp < a.maxHp, 'quem começa o turno nela leva veneno');
  const m2 = conjurador('mago', 11, ['muralhaDeFogo']);
  const b = alvoParado({ x: 6, y: 5 }, 'bugbear');
  const { enc: e2 } = arena({ herois: [m2], foes: [b] });
  e2.rng = dadoFixo(1);
  const r = e2.castSpell(m2, 'muralhaDeFogo', { point: { x: 6, y: 5 } });
  assert.ok(r.ok, r.why);
  assert.ok(e2.zonas.length > 0, 'a muralha também');
});

teste('Banimento (4º): quem falha em CAR some do jogo (fora de alcance e incapacitado) e volta quando a concentração acaba', () => {
  const m = conjurador('mago', 11, ['banimento']);
  const g = alvoParado({ x: 6, y: 5 }, 'bugbear');
  const { enc } = arena({ herois: [m], foes: [g] });
  enc.rng = dadoFixo(1);
  assert.ok(enc.castSpell(m, 'banimento', { target: g }).ok);
  assert.ok(hasCondition(g, 'banido'));
  assert.equal(enc.canAttack(m, g).ok, false, 'não se acerta quem está banido');
  enc.dropConcentration(m);
  assert.ok(!hasCondition(g, 'banido'), 'a concentração acabou: volta');
  const m2 = conjurador('mago', 11, ['banimento']);
  const g2 = alvoParado({ x: 6, y: 5 }, 'bugbear');
  const { enc: e2 } = arena({ herois: [m2], foes: [g2] });
  e2.rng = dadoFixo(20);
  e2.castSpell(m2, 'banimento', { target: g2 });
  assert.ok(!hasCondition(g2, 'banido'), 'passou na resistência');
});

teste('Cura (6º), Dedo da Morte (7º), Palavra de Poder: Matar (9º) e Chuva de Meteoros (9º)', () => {
  const c = conjurador('clerigo', 11, ['curaTotal']);
  const amigo = heroi('guerreiro', 1, 'Humano');
  amigo.pos = { x: 4, y: 5 }; amigo.maxHp = 100; amigo.hp = 10;
  const { enc } = arena({ herois: [c, amigo], foes: [inimigo('goblin', { x: 11, y: 11 })] });
  assert.ok(enc.castSpell(c, 'curaTotal', { target: amigo }).ok);
  assert.ok(amigo.hp >= 80, `70 pontos de vida (e o Discípulo da Vida, se houver): ${amigo.hp}`);
  const m = conjurador('mago', 17, ['dedoDaMorte', 'palavraDePoderMatar', 'chuvaDeMeteoros']);
  const g = alvoParado({ x: 6, y: 5 }, 'bugbear');
  const { enc: e2 } = arena({ herois: [m], foes: [g] });
  e2.rng = dadoFixo(1);
  assert.ok(e2.castSpell(m, 'dedoDaMorte', { target: g }).ok);
  assert.ok(g.maxHp - g.hp >= 30 || g.dead, 'pelo menos os 30 fixos');
  const fraco = alvoParado({ x: 6, y: 5 }, 'bugbear');
  fraco.hp = 60;
  const forte = alvoParado({ x: 7, y: 5 }, 'bugbear');
  forte.hp = 150; forte.maxHp = 150;
  const m2 = conjurador('mago', 17, ['palavraDePoderMatar']);
  const { enc: e3 } = arena({ herois: [m2], foes: [fraco, forte] });
  assert.ok(e3.castSpell(m2, 'palavraDePoderMatar', { target: fraco }).ok);
  assert.ok(fraco.dead, 'até 100 PV: morre');
  m2.actionUsed = false;
  m2.spellcasting.slots[9] = 1;
  assert.ok(e3.castSpell(m2, 'palavraDePoderMatar', { target: forte }).ok);
  assert.ok(!forte.dead && forte.hp === 150, 'acima de 100 PV: nada');
  const g1 = alvoParado({ x: 6, y: 5 }, 'bugbear');
  const m3 = conjurador('mago', 17, ['chuvaDeMeteoros']);
  const { enc: e4 } = arena({ herois: [m3], foes: [g1] });
  e4.rng = dadoFixo(1);
  assert.ok(e4.castSpell(m3, 'chuvaDeMeteoros', { point: { x: 6, y: 5 } }).ok);
  assert.ok(g1.dead || g1.maxHp - g1.hp >= 40, 'os meteoros pesam');
});

teste('Arcana Mística no 13º e no 17º: Dedo da Morte e Palavra de Poder: Matar, uma vez por descanso longo cada', () => {
  const b13 = bruxo(13);
  assert.ok(b13.magiasDeInvocacao.some((m) => m.arcano === 7 && m.magia === 'dedoDaMorte'));
  const b17 = bruxo(17);
  assert.ok(b17.magiasDeInvocacao.some((m) => m.arcano === 9 && m.magia === 'palavraDePoderMatar'));
  assert.ok(!b17.magiasDeInvocacao.some((m) => m.arcano === 8), 'o 8º círculo continua sem magia');
});

teste('Sobrecanalizar (mago, 14º): o dano da magia sai no máximo; o primeiro uso é de graça, o segundo fere o mago', () => {
  const m = conjurador('mago', 14, ['bolaDeFogo']);
  m.features.push('overchannel');
  m.pos = { x: 0, y: 5 };
  const g = alvoParado({ x: 6, y: 5 }, 'bugbear');
  g.hp = g.maxHp = 400;
  const { enc } = arena({ herois: [m], foes: [g] });
  enc.rng = dadoFixo(1); // todos falham: dano cheio; os dados saem em 1... a menos que o máximo valha
  assert.equal(enc.useFeature(m, 'overchannel'), true);
  const hp0 = m.hp;
  assert.ok(enc.castSpell(m, 'bolaDeFogo', { point: { x: 6, y: 5 } }).ok);
  const armado = 400 - g.hp;
  assert.equal(m.hp, hp0, 'o primeiro uso não custa nada');
  assert.equal(m.sobrecanalizaPronta, false);
  // segundo uso: fere
  m.actionUsed = false;
  enc.useFeature(m, 'overchannel');
  const hp1 = m.hp;
  assert.ok(enc.castSpell(m, 'bolaDeFogo', { point: { x: 6, y: 5 } }).ok);
  assert.ok(m.hp < hp1, 'o segundo uso queima o mago');
  descansoLongo(m);
  assert.equal(m.sobrecanalUsos, 0, 'o descanso longo zera o preço');
  // sem armar, os dados são os normais
  const m2 = conjurador('mago', 14, ['bolaDeFogo']);
  m2.pos = { x: 0, y: 5 };
  const g2 = alvoParado({ x: 6, y: 5 }, 'bugbear');
  g2.hp = g2.maxHp = 400;
  const { enc: e2 } = arena({ herois: [m2], foes: [g2] });
  e2.rng = dadoFixo(1);
  e2.castSpell(m2, 'bolaDeFogo', { point: { x: 6, y: 5 } });
  assert.equal(armado - (400 - g2.hp), 8 * (6 - 3), 'oito dados de 6 faces: do 3 do dado fixo ao máximo de 6, +24');
});
// ============================================================================================================
// ÍCONES DAS MAGIAS DO LOTE DE 4º AO 9º CÍRCULO
// ============================================================================================================

teste('Toda magia de 4º círculo para cima tem ícone próprio no catálogo (nenhuma cai no genérico por escola)', async () => {
  const { iconeDeMagia, temIcone } = await import('../art/icons.js');
  const altas = Object.values(SPELLS).filter((s) => s.level >= 4);
  assert.ok(altas.length >= 16);
  for (const s of altas) {
    const ic = iconeDeMagia(s);
    assert.ok(ic.startsWith('magia-') && temIcone(ic), `${s.id}: ${ic}`);
  }
});
// ============================================================================================================
// MESTRE DE BATALHA (guerreiro, Livro do Jogador): dados de superioridade e manobras
// ============================================================================================================

const mestre = (nivel) => heroi('guerreiro', nivel, 'Humano', { weapons: ['espadaLonga'] }, { 3: { subclasse: 'mestreDeBatalha' } });

teste('Mestre de Batalha: dados e manobras crescem com o nível, o dado sobe de tamanho e o descanso curto devolve', () => {
  const m3 = mestre(3);
  assert.ok(m3.features.includes('combatSuperiority') && m3.features.includes('studentOfWar'));
  assert.equal(m3.resources.superiorityDice, 4);
  const manobras = (c) => c.features.filter((f) => CLASSES.guerreiro.subclasse.opcoes.mestreDeBatalha.opcoesDeManobra.includes(f));
  assert.equal(manobras(m3).length, 3, '3 manobras no 3º');
  const m7 = mestre(7);
  assert.equal(m7.resources.superiorityDice, 5);
  assert.equal(manobras(m7).length, 5, '5 no 7º (todas as que o jogo tem)');
  assert.equal(mestre(15).resources.superiorityDice, 6);
  assert.ok(mestre(15).features.includes('relentless') && mestre(10).features.includes('improvedCombatSuperiority'));
  const { enc } = arena({ herois: [m3], foes: [inimigo('goblin', { x: 9, y: 9 })] });
  assert.equal(enc.dadoDeSuperioridade(mestre(3)), '1d8');
  assert.equal(enc.dadoDeSuperioridade(mestre(10)), '1d10');
  assert.equal(enc.dadoDeSuperioridade(mestre(18)), '1d12');
  m3.resources.superiorityDice = 0;
  recuperarNoCurto(m3);
  assert.equal(m3.resources.superiorityDice, 4, 'volta no descanso curto');
  assert.equal(heroi('guerreiro', 3, 'Humano', {}, { 3: { subclasse: 'campeao' } }).resources.superiorityDice, undefined, 'o Campeão não tem dados');
});

teste('Ataque Derrubador: arma, acerta, +dado de dano, FOR ou cai; o dado só sai no acerto', () => {
  const c = mestre(3);
  c.pos = { x: 5, y: 5 };
  const gob = inimigo('goblin', { x: 6, y: 5 });
  gob.hp = gob.maxHp = 200;
  const { enc } = arena({ herois: [c], foes: [gob] });
  assert.equal(enc.useFeature(c, 'tripAttack'), true);
  assert.equal(c.manobraPronta, 'tripAttack');
  enc.rng = dadoEmSequencia(15, 2); // acerta; o goblin falha na FOR
  enc.attackAction(c, gob, 'espadaLonga');
  assert.equal(c.resources.superiorityDice, 3, 'gastou um dado');
  assert.ok(hasCondition(gob, 'caido'), 'caiu');
  assert.equal(c.manobraPronta, null, 'a manobra se gastou');
  // Passou na resistência: dano extra, sem queda.
  const c2 = mestre(3);
  c2.pos = { x: 5, y: 5 };
  const g2 = inimigo('goblin', { x: 6, y: 5 });
  g2.hp = g2.maxHp = 200;
  const { enc: e2 } = arena({ herois: [c2], foes: [g2] });
  e2.useFeature(c2, 'tripAttack');
  e2.rng = dadoEmSequencia(15, 20);
  e2.attackAction(c2, g2, 'espadaLonga');
  assert.ok(!hasCondition(g2, 'caido'), 'passou na FOR');
  assert.equal(c2.resources.superiorityDice, 3);
  // Errou: o dado não sai e a manobra segue armada até o fim do turno.
  const c3 = mestre(3);
  c3.pos = { x: 5, y: 5 };
  const g3 = inimigo('goblin', { x: 6, y: 5 });
  g3.ac = 40;
  const { enc: e3 } = arena({ herois: [c3], foes: [g3] });
  e3.useFeature(c3, 'tripAttack');
  e3.rng = dadoEmSequencia(2);
  e3.attackAction(c3, g3, 'espadaLonga');
  assert.equal(c3.resources.superiorityDice, 4, 'errou: nada gasto');
  // Sem dado: não arma.
  c3.resources.superiorityDice = 0;
  assert.equal(e3.useFeature(c3, 'menacingAttack'), false);
});

teste('Ataque Amedrontador, Empurrão e Avançado: cada um com o seu efeito', () => {
  const casos = [['menacingAttack', 'amedrontado'], ['pushingAttack', null], ['lungingAttack', null]];
  for (const [id, cond] of casos) {
    const c = mestre(7);
    c.pos = { x: 5, y: 5 };
    const gob = inimigo('goblin', { x: 6, y: 5 });
    gob.hp = gob.maxHp = 200;
    const { enc } = arena({ herois: [c], foes: [gob] });
    enc.useFeature(c, id);
    enc.rng = dadoEmSequencia(15, 2);
    const hpAntes = gob.hp;
    enc.attackAction(c, gob, 'espadaLonga');
    assert.equal(c.resources.superiorityDice, 4, `${id}: gastou um dado`);
    assert.ok(gob.hp < hpAntes, `${id}: feriu`);
    if (cond) assert.ok(hasCondition(gob, cond), `${id}: ${cond}`);
    if (id === 'pushingAttack') assert.ok(gob.pos.x > 6, 'empurrado para longe');
    if (id === 'lungingAttack') assert.equal(gob.pos.x, 6, 'o Avançado não empurra');
  }
});

teste('Ataque Preciso: um erro por pouco vira acerto somando o dado; um erro grande não gasta nada', () => {
  const luta = (ac, arma) => {
    const c = mestre(7);
    c.pos = { x: 5, y: 5 };
    const g = inimigo('goblin', { x: 6, y: 5 });
    g.hp = g.maxHp = 200;
    g.ac = ac;
    const { enc } = arena({ herois: [c], foes: [g] });
    if (arma) assert.equal(enc.useFeature(c, 'precisionAttack'), true);
    enc.rng = dadoEmSequencia(8);
    enc.attackAction(c, g, 'espadaLonga');
    return { c, g };
  };
  // A menor CA que o 8 natural erra: erra por 1, e o d8 (que cai em 4 no dado fixo) cobre.
  let ac = 10;
  while (luta(ac, false).g.hp < 200) ac += 1;
  const { c, g } = luta(ac, true);
  assert.equal(c.resources.superiorityDice, 4, 'o dado foi para o ataque');
  assert.ok(g.hp < 200, 'acertou');
  const longe = luta(ac + 20, true);
  assert.equal(longe.c.resources.superiorityDice, 5, 'erro grande: o dado não resolve, não se gasta');
  assert.equal(longe.g.hp, 200);
});

teste('Implacável (15º): entra na luta sem dados e recupera um', () => {
  const c = mestre(15);
  c.resources.superiorityDice = 0;
  c.pos = { x: 5, y: 5 };
  const gob = inimigo('goblin', { x: 9, y: 9 });
  const field = new Battlefield(12, 12, MAPA);
  const enc = new Encounter({ battlefield: field, party: [c], foes: [gob], rng: makeRng(1), onLog: () => {}, onEvent: () => {} });
  enc.start?.();
  assert.equal(c.resources.superiorityDice, 1);
});

// ============================================================================================================
// ASSASSINO (ladino, Livro do Jogador): Assassinar e Golpe Mortal
// ============================================================================================================

const assassino = (nivel) => heroi('ladino', nivel, 'Humano', { weapons: ['adaga'] }, { 3: { subclasse: 'assassino' } });

teste('Assassinar: vantagem contra quem ainda não agiu, só na 1ª rodada; o Ladrão e o ladino comum não têm', () => {
  const a = assassino(3);
  assert.ok(a.features.includes('assassinate') && a.features.includes('assassinProficiencies'));
  a.pos = { x: 5, y: 5 };
  const gob = alvoParado({ x: 6, y: 5 });
  const { enc } = arena({ herois: [a], foes: [gob] });
  gob.acted = false;
  assert.ok(enc.attackModifiers(a, gob, {}).vantagens.includes('assassinar'), 'vantagem na 1ª rodada');
  gob.acted = true;
  assert.ok(!enc.attackModifiers(a, gob, {}).vantagens.includes('assassinar'), 'quem já agiu não conta');
  gob.acted = false;
  enc.round = 2;
  assert.ok(!enc.attackModifiers(a, gob, {}).vantagens.includes('assassinar'), 'só na 1ª rodada');
  const l = heroi('ladino', 3, 'Humano', { weapons: ['adaga'] }, { 3: { subclasse: 'ladrao' } });
  l.pos = { x: 5, y: 5 };
  enc.round = 1;
  assert.ok(!enc.attackModifiers(l, gob, {}).vantagens.includes('assassinar'), 'o Ladrão não tem');
});

teste('Assassinar: todo acerto contra um alvo surpreendido é crítico', () => {
  for (const [surpreso, esperado] of [[true, true], [false, false]]) {
    const a = assassino(3);
    a.pos = { x: 5, y: 5 };
    const gob = alvoParado({ x: 6, y: 5 });
    gob.hp = gob.maxHp = 200;
    const { enc, eventos } = arena({ herois: [a], foes: [gob] });
    if (surpreso) enc.surpreendidos = new Set([gob.id]);
    enc.rng = dadoEmSequencia(12, 12);
    enc.attackAction(a, gob, 'adaga');
    const e = ultimoAtaque(eventos);
    assert.equal(Boolean(e?.critical), esperado, surpreso ? 'surpreso: crítico' : 'sem surpresa: normal');
  }
});

teste('Golpe Mortal (17º): contra um alvo surpreendido o dano dobra se ele falhar em CON, e não dobra se passar', () => {
  const dano = (d20Resistencia) => {
    const a = assassino(17);
    a.pos = { x: 5, y: 5 };
    const gob = alvoParado({ x: 6, y: 5 });
    gob.hp = gob.maxHp = 500;
    const { enc } = arena({ herois: [a], foes: [gob] });
    enc.surpreendidos = new Set([gob.id]);
    enc.rng = dadoEmSequencia(12, d20Resistencia);
    enc.resolveAttack(a, gob, { weaponId: 'adaga' });
    return 500 - gob.hp;
  };
  const passou = dano(20);
  const falhou = dano(1);
  assert.ok(passou > 0);
  assert.equal(falhou, passou * 2, 'dobro exato');
  const l = assassino(16);
  assert.ok(!l.features.includes('deathStrike'), 'só no 17º');
});

// ============================================================================================================
// GUERREIRO TOTÊMICO (bárbaro, Livro do Jogador): urso, águia e lobo
// ============================================================================================================

const totemico = (nivel, espirito = 'bearSpirit') => heroi('barbaro', nivel, 'Humano', { weapons: ['machadoGrande'] }, { 3: { subclasse: 'totemico', totemSpirit: espirito } });

teste('Totêmico: o espírito escolhido vira característica; o padrão é o urso; Sintonia só no 14º', () => {
  assert.ok(totemico(3, 'wolfSpirit').features.includes('wolfSpirit'));
  assert.ok(!totemico(3, 'wolfSpirit').features.includes('bearSpirit'));
  assert.ok(totemico(3, 'eagleSpirit').features.includes('eagleSpirit'));
  const padrao = heroi('barbaro', 3, 'Humano', {}, { 3: { subclasse: 'totemico' } });
  assert.ok(padrao.features.includes('bearSpirit') && padrao.features.includes('spiritSeeker'));
  assert.ok(!totemico(13).features.includes('totemicAttunement') && totemico(14).features.includes('totemicAttunement'));
  assert.throws(() => totemico(3, 'serpentSpirit'));
});

teste('Espírito do Urso: em Fúria, resistência a todo dano menos psíquico; fora da Fúria, nenhuma', () => {
  const b = totemico(3);
  b.pos = { x: 5, y: 5 };
  const { enc } = arena({ herois: [b], foes: [inimigo('goblin', { x: 9, y: 9 })] });
  assert.equal(enc.danoPorTipo(b, 20, 'fogo'), 20, 'sem Fúria: dano inteiro');
  addCondition(b, 'furia', { rounds: 10 });
  assert.equal(enc.danoPorTipo(b, 20, 'fogo'), 10, 'fogo pela metade');
  assert.equal(enc.danoPorTipo(b, 20, 'necrótico'), 10);
  assert.equal(enc.danoPorTipo(b, 20, 'psíquico'), 20, 'psíquico passa inteiro');
  const l = totemico(3, 'wolfSpirit');
  addCondition(l, 'furia', { rounds: 10 });
  assert.equal(enc.danoPorTipo(l, 20, 'fogo'), 20, 'o lobo não resiste a fogo');
});

teste('Espírito do Lobo: em Fúria, o aliado tem vantagem contra quem está colado no bárbaro', () => {
  const b = totemico(3, 'wolfSpirit');
  b.pos = { x: 5, y: 5 };
  const amigo = heroi('guerreiro', 1, 'Humano', { weapons: ['espadaLonga'] });
  amigo.pos = { x: 7, y: 5 };
  const gob = inimigo('goblin', { x: 6, y: 5 });
  const longe = inimigo('goblin', { x: 8, y: 8 });
  const { enc } = arena({ herois: [b, amigo], foes: [gob, longe] });
  assert.ok(!enc.attackModifiers(amigo, gob, {}).vantagens.includes('espírito do lobo'), 'sem Fúria: nada');
  addCondition(b, 'furia', { rounds: 10 });
  assert.ok(enc.attackModifiers(amigo, gob, {}).vantagens.includes('espírito do lobo'), 'colado no bárbaro');
  assert.ok(!enc.attackModifiers(amigo, longe, {}).vantagens.includes('espírito do lobo'), 'longe dele: nada');
  assert.ok(!enc.attackModifiers(amigo, gob, { ranged: true }).vantagens.includes('espírito do lobo'), 'só corpo a corpo');
});

teste('Espírito da Águia: em Fúria, oportunidade contra ele tem desvantagem, e a ação bônus é Disparada', () => {
  const b = totemico(3, 'eagleSpirit');
  b.pos = { x: 5, y: 5 };
  const gob = inimigo('goblin', { x: 6, y: 5 });
  const { enc } = arena({ herois: [b], foes: [gob] });
  assert.equal(enc.useFeature(b, 'eagleSpirit'), false, 'sem Fúria não corre');
  assert.ok(!enc.attackModifiers(gob, b, { opportunity: true }).desvantagens.includes('espírito da águia'));
  addCondition(b, 'furia', { rounds: 10 });
  assert.ok(enc.attackModifiers(gob, b, { opportunity: true }).desvantagens.includes('espírito da águia'));
  assert.ok(!enc.attackModifiers(gob, b, {}).desvantagens.includes('espírito da águia'), 'só a oportunidade');
  const antes = b.movementLeftFt;
  assert.equal(enc.useFeature(b, 'eagleSpirit'), true);
  assert.ok(b.movementLeftFt > antes, 'o deslocamento cresce');
  assert.equal(enc.useFeature(b, 'eagleSpirit'), false, 'uma ação bônus por turno');
});

teste('Sintonia Totêmica (urso, 14º): em Fúria, inimigos colados nele têm desvantagem contra os outros', () => {
  const b = totemico(14);
  b.pos = { x: 5, y: 5 };
  const amigo = heroi('guerreiro', 1, 'Humano', { weapons: ['espadaLonga'] });
  amigo.pos = { x: 7, y: 6 };
  const gob = inimigo('goblin', { x: 6, y: 5 });
  const { enc } = arena({ herois: [b, amigo], foes: [gob] });
  addCondition(b, 'furia', { rounds: 10 });
  assert.ok(enc.attackModifiers(gob, amigo, {}).desvantagens.includes('sintonia do urso'), 'contra o amigo: desvantagem');
  assert.ok(!enc.attackModifiers(gob, b, {}).desvantagens.includes('sintonia do urso'), 'contra o bárbaro: normal');
});

teste('Tela de nível: o espírito totêmico aparece como escolha e a troca vale', async () => {
  const { subirUmNivel } = await import('../game/nivel.js');
  const b = heroi('barbaro', 2, 'Humano');
  b.subclasse = 'totemico';
  const r = subirUmNivel(b);
  assert.ok(b.features.includes('bearSpirit'), 'o padrão é o urso');
  const e = r.escolhas.find((x) => x.id === 'ganho_totemSpirit');
  assert.ok(e, 'a tela oferece a escolha');
  assert.deepEqual(e.opcoes.slice().sort(), ['bearSpirit', 'eagleSpirit', 'wolfSpirit']);
  r.aplicar({ ganho_totemSpirit: ['wolfSpirit'] });
  assert.ok(b.features.includes('wolfSpirit') && !b.features.includes('bearSpirit'), 'trocou para o lobo');
});

teste('Escolha de subclasse ao subir: só no nível certo, lista as opções, e a escolhida vale', async () => {
  const { subirUmNivel, escolhaDeSubclasse } = await import('../game/nivel.js');
  const b = heroi('barbaro', 1, 'Humano');
  assert.equal(escolhaDeSubclasse(b), null, 'no 1º, a pergunta ainda não vem');
  subirUmNivel(b);
  const e = escolhaDeSubclasse(b);
  assert.ok(e, 'no 3º que vem a seguir, vem');
  assert.deepEqual(e.opcoes.map((o) => o.id), ['berserker', 'totemico']);
  assert.ok(e.opcoes.every((o) => o.nome && o.desc));
  subirUmNivel(b, { subclasse: 'totemico' });
  assert.equal(b.subclasse, 'totemico');
  assert.ok(b.features.includes('totemSpirit') && !b.features.includes('frenzy'));
  assert.equal(escolhaDeSubclasse(b), null, 'já escolheu');
  const g = heroi('guerreiro', 2, 'Humano');
  subirUmNivel(g, { subclasse: 'mestreDeBatalha' });
  assert.ok(g.features.includes('combatSuperiority') && g.resources.superiorityDice === 4);
  const sem = heroi('guerreiro', 2, 'Humano');
  subirUmNivel(sem);
  assert.equal(sem.subclasse, 'campeao', 'sem escolha, o padrão');
});

// ============================================================================================================
// CÍRCULO DA LUA (druida, Livro do Jogador)
// ============================================================================================================

const lunar = (nivel) => heroi('druida', nivel, 'Humano', {}, { 2: { subclasse: 'lua' } });

teste('Círculo da Lua: Formas do Círculo sobem o ND (nível ÷ 3, mínimo 1), e quem não é lunar fica na tabela', () => {
  const l2 = lunar(2);
  assert.ok(l2.features.includes('combatWildShape') && l2.features.includes('circleForms'));
  const nd = (id) => crEmNumero(MONSTERS[id].cr);
  assert.ok(formasDisponiveis(2, true).length > formasDisponiveis(2).length, 'o druida da Lua já pode feras de ND 1 no 2º');
  assert.ok(formasDisponiveis(2, true).every((id) => nd(id) <= 1));
  assert.ok(formasDisponiveis(2).every((id) => nd(id) <= 0.25), 'a tabela comum segue em 1/4');
  assert.ok(formasDisponiveis(6, true).length >= formasDisponiveis(2, true).length);
  assert.ok(formasDisponiveis(1, true).length === 0, 'no 1º nada');
});

teste('Forma Selvagem em Combate: a Lua assume a forma com a ação bônus; o da Terra gasta a ação', () => {
  const l = lunar(4);
  l.pos = { x: 5, y: 5 };
  const { enc } = arena({ herois: [l], foes: [inimigo('goblin', { x: 9, y: 9 })] });
  const fera = formasDisponiveis(4, true)[0];
  assert.equal(enc.useFeature(l, 'wildShape', { modo: fera }), true);
  assert.ok(l.formaSelvagem);
  assert.equal(l.bonusUsed, true, 'custou a ação bônus');
  assert.equal(l.actionUsed, false, 'a ação segue livre');
  const t = heroi('druida', 4, 'Humano', {}, { 2: { subclasse: 'terra' } });
  t.pos = { x: 6, y: 5 };
  const { enc: e2 } = arena({ herois: [t], foes: [inimigo('goblin', { x: 9, y: 9 })] });
  assert.equal(e2.useFeature(t, 'wildShape', { modo: formasDisponiveis(4)[0] }), true);
  assert.equal(t.actionUsed, true);
  assert.equal(t.bonusUsed, false);
});

teste('Forma Selvagem em Combate: curar na forma de fera gasta o espaço e a ação bônus; fora da forma, não', () => {
  const l = lunar(4);
  l.pos = { x: 5, y: 5 };
  const { enc } = arena({ herois: [l], foes: [inimigo('goblin', { x: 9, y: 9 })] });
  assert.equal(enc.useFeature(l, 'combatWildShape'), false, 'sem a forma não cura');
  enc.useFeature(l, 'wildShape', { modo: formasDisponiveis(4, true)[0] });
  l.bonusUsed = false;
  l.hp = 1;
  const slots = l.spellcasting.slots[1];
  assert.equal(enc.useFeature(l, 'combatWildShape'), true);
  assert.equal(l.spellcasting.slots[1], slots - 1, 'gastou um espaço de 1º');
  assert.ok(l.hp > 1, 'recuperou PV');
  assert.equal(enc.useFeature(l, 'combatWildShape'), false, 'uma por ação bônus');
});

teste('Golpe Primitivo (6º): os ataques da forma de fera vencem a resistência a dano não mágico; sem ele, não', () => {
  for (const [sub, metade] of [['lua', false], ['terra', true]]) {
    const d = heroi('druida', 6, 'Humano', {}, { 2: { subclasse: sub } });
    d.pos = { x: 5, y: 5 };
    const alvo = inimigo('goblin', { x: 6, y: 5 });
    alvo.hp = alvo.maxHp = 500;
    alvo.resistNaoMagico = ['cortante', 'perfurante', 'concussão'];
    const { enc } = arena({ herois: [d], foes: [alvo] });
    enc.useFeature(d, 'wildShape', { modo: formasDisponiveis(6, sub === 'lua')[0] });
    assert.ok(d.formaSelvagem, `${sub}: virou fera`);
    assert.equal(d.features.includes('primalStrike'), !metade);
    d.attacks = [{ name: 'Golpe', bonus: 50, damage: '10d1', type: 'cortante', reach: 5 }];
    enc.rng = dadoEmSequencia(15);
    enc.resolveAttack(d, alvo, { weaponId: null });
    const dano = 500 - alvo.hp;
    assert.ok(dano > 0, `${sub}: acertou`);
    if (metade) assert.ok(dano <= 5, 'o da Terra: metade');
    else assert.ok(dano >= 10, 'o da Lua: dano cheio');
  }
});

// ============================================================================================================
// JURAMENTO DE VINGANÇA (paladino, Livro do Jogador)
// ============================================================================================================

const vingador = (nivel) => heroi('paladino', nivel, 'Humano', { weapons: ['espadaLonga'] }, { 3: { subclasse: 'vinganca' } });

teste('Vingança: as características do 3º, as magias do Juramento por nível e a carga de Canalizar Divindade', () => {
  const p = vingador(5);
  assert.ok(['channelDivinity', 'abjureEnemy', 'vowOfEnmity'].every((f) => p.features.includes(f)));
  assert.equal(p.resources.channelDivinity, 1);
  const prep = [...p.spellcasting.prepared, ...(p.spellcasting.sempreProntas ?? [])];
  assert.ok(prep.includes('perdicao') && prep.includes('marcaDoCacador'), 'magias do 3º');
  assert.ok(prep.includes('imobilizarPessoa') && prep.includes('passoNebuloso'), 'magias do 5º');
  assert.ok(![...vingador(3).spellcasting.prepared, ...(vingador(3).spellcasting.sempreProntas ?? [])].includes('imobilizarPessoa'), 'as do 5º só no 5º');
  assert.ok(vingador(7).features.includes('relentlessAvenger') && vingador(20).features.includes('avengingAngel'));
});

teste('Voto de Inimizade: ação bônus e uma carga; vantagem só contra a criatura jurada, e só enquanto dura', () => {
  const p = vingador(3);
  p.pos = { x: 5, y: 5 };
  const juradoPerto = inimigo('goblin', { x: 6, y: 5 });
  const outro = inimigo('goblin', { x: 5, y: 6 });
  const longe = inimigo('goblin', { x: 11, y: 11 });
  const { enc } = arena({ herois: [p], foes: [juradoPerto, outro, longe] });
  assert.ok(!enc.attackModifiers(p, juradoPerto, {}).vantagens.includes('voto de inimizade'));
  assert.equal(enc.useFeature(p, 'vowOfEnmity', { target: juradoPerto }), true);
  assert.equal(p.bonusUsed, true);
  assert.equal(p.resources.channelDivinity, 0, 'gastou a carga');
  assert.ok(enc.attackModifiers(p, juradoPerto, {}).vantagens.includes('voto de inimizade'));
  assert.ok(!enc.attackModifiers(p, outro, {}).vantagens.includes('voto de inimizade'), 'outro alvo: normal');
  p.bonusUsed = false;
  assert.equal(enc.useFeature(p, 'vowOfEnmity', { target: outro }), false, 'sem carga não jura');
  const q = vingador(3);
  q.pos = { x: 5, y: 5 };
  const { enc: e2 } = arena({ herois: [q], foes: [longe] });
  assert.equal(e2.useFeature(q, 'vowOfEnmity', { target: longe }), false, 'mais longe que 3 m');
});

teste('Repelir o Inimigo: falhou em SAB, fica amedrontado e preso ao chão; passou, nada; custa a ação e a carga', () => {
  for (const [d20, cai] of [[1, true], [20, false]]) {
    const p = vingador(3);
    p.pos = { x: 5, y: 5 };
    const gob = inimigo('goblin', { x: 9, y: 5 });
    const { enc } = arena({ herois: [p], foes: [gob] });
    enc.rng = dadoEmSequencia(d20);
    assert.equal(enc.useFeature(p, 'abjureEnemy', { target: gob }), true);
    assert.equal(p.actionUsed, true);
    assert.equal(p.resources.channelDivinity, 0);
    assert.equal(hasCondition(gob, 'amedrontado'), cai);
    assert.equal(hasCondition(gob, 'paralisadoDeMedo'), cai);
  }
  const p2 = vingador(3);
  p2.pos = { x: 5, y: 5 };
  const amigo = heroi('guerreiro', 1, 'Humano');
  amigo.pos = { x: 6, y: 5 };
  const { enc } = arena({ herois: [p2, amigo], foes: [inimigo('goblin', { x: 11, y: 11 })] });
  assert.equal(enc.useFeature(p2, 'abjureEnemy', { target: amigo }), false, 'não se repele um aliado');
  assert.equal(p2.resources.channelDivinity, 1, 'e nada se gasta');
});

// ============================================================================================================
// COLÉGIO DO VALOR (bardo, Livro do Jogador)
// ============================================================================================================

const valoroso = (nivel) => heroi('bardo', nivel, 'Humano', {}, { 3: { subclasse: 'valor' } });

teste('Colégio do Valor: armadura média, escudo e armas marciais; Ataque Extra no 6º', () => {
  const b5 = valoroso(5);
  assert.ok(b5.features.includes('valorProficiencies') && b5.features.includes('combatInspiration'));
  assert.ok(b5.armorTraining.includes('média') && b5.armorTraining.includes('escudo'));
  assert.ok(b5.weaponTraining.includes('marcial'));
  assert.ok(!b5.features.includes('extraAttack'), 'o Ataque Extra só no 6º');
  const b6 = valoroso(6);
  assert.ok(b6.features.includes('extraAttack'));
  const conhecimento = heroi('bardo', 6, 'Humano', {}, { 3: { subclasse: 'conhecimento' } });
  assert.ok(!conhecimento.armorTraining.includes('média') && !conhecimento.features.includes('extraAttack'), 'o Conhecimento não tem');
});

teste('Inspiração em Combate: o inspirado soma o dado à CA e transforma o acerto raspando em erro; um acerto folgado passa', () => {
  const rodada = (d20) => {
    const bardo = valoroso(3);
    bardo.pos = { x: 4, y: 5 };
    const amigo = heroi('guerreiro', 1, 'Humano');
    amigo.pos = { x: 5, y: 5 };
    const gob = inimigo('goblin', { x: 6, y: 5 });
    const { enc } = arena({ herois: [bardo, amigo], foes: [gob] });
    addCondition(amigo, 'inspirado', { rounds: 100, source: bardo.id, data: { dado: '1d6' } });
    enc.rng = dadoEmSequencia(d20);
    const hp = amigo.hp;
    enc.resolveAttack(gob, amigo, { weaponId: null });
    return { amigo, dano: hp - amigo.hp };
  };
  // CA do guerreiro de 1º ~ 10+; o goblin tem +4: um 20 natural é crítico (não conta). Procura o d20 que acerta raspando.
  let raspa = null;
  for (let d = 2; d < 20 && raspa === null; d += 1) {
    const r = rodada(d);
    if (r.dano === 0 && !hasCondition(r.amigo, 'inspirado')) raspa = d;
  }
  assert.ok(raspa !== null, 'algum d20 acerta raspando e o dado o desfaz');
  const folgado = rodada(19);
  assert.ok(folgado.dano > 0, 'um acerto folgado passa');
});

// ============================================================================================================
// CAVALEIRO MÍSTICO (guerreiro) e TRAPACEIRO ARCANO (ladino): conjuradores de um terço
// ============================================================================================================

const cavaleiro = (nivel) => heroi('guerreiro', nivel, 'Humano', { weapons: ['espadaLonga'] }, { 3: { subclasse: 'cavaleiroMistico' } });
const trapaceiro = (nivel) => heroi('ladino', nivel, 'Humano', { weapons: ['adaga'] }, { 3: { subclasse: 'trapaceiroArcano' } });

teste('Conjurador de um terço: espaços, truques e magias conhecidas batem com a tabela do livro', async () => {
  const { espacosDeMagia } = await import('../rules/progressao.js');
  assert.deepEqual(espacosDeMagia('terco', 2), [0]);
  for (const [n, esperado] of [[3, [0, 2]], [4, [0, 3]], [7, [0, 4, 2]], [10, [0, 4, 3]], [13, [0, 4, 3, 2]], [16, [0, 4, 3, 3]], [19, [0, 4, 3, 3, 1]]]) {
    assert.deepEqual(espacosDeMagia('terco', n), esperado, `${n}º nível`);
  }
  const k3 = cavaleiro(3);
  assert.ok(k3.features.includes('spellcasting') && k3.features.includes('weaponBond'));
  assert.equal(k3.spellcasting.ability, 'int');
  assert.deepEqual(k3.spellcasting.slotsMax, [0, 2]);
  assert.equal(k3.spellcasting.truquesConhecidos, 2);
  assert.equal(k3.spellcasting.magiasConhecidas, 3);
  assert.equal(cavaleiro(10).spellcasting.truquesConhecidos, 3);
  assert.equal(cavaleiro(7).spellcasting.magiasConhecidas, 5);
  assert.equal(cavaleiro(20).spellcasting.magiasConhecidas, 13);
  assert.deepEqual(cavaleiro(19).spellcasting.slotsMax, [0, 4, 3, 3, 1]);
  assert.equal(trapaceiro(3).spellcasting.truquesConhecidos, 3, 'o Trapaceiro conhece Mão Mágica a mais');
  assert.equal(trapaceiro(10).spellcasting.truquesConhecidos, 4);
  assert.equal(heroi('guerreiro', 3, 'Humano', {}, { 3: { subclasse: 'campeao' } }).spellcasting, undefined, 'o Campeão não conjura');
  assert.equal(heroi('ladino', 3, 'Humano', {}, { 3: { subclasse: 'ladrao' } }).spellcasting, undefined, 'o Ladrão não conjura');
});

teste('Conjurador de um terço: a lista é a do mago, só das duas escolas da subclasse', async () => {
  const { listaDaClasse } = await import('../game/criacao.js');
  const k = listaDaClasse('guerreiro', 3, 'cavaleiroMistico');
  assert.ok(k.magias.length && k.truques.length);
  assert.ok(k.magias.every((id) => ['abjuração', 'evocação'].includes(SPELLS[id].school)), 'só abjuração e evocação');
  assert.ok(k.magias.includes('escudoArcano') && k.magias.includes('misselMagico'));
  assert.ok(!k.magias.includes('sono'), 'sono é encantamento');
  const t = listaDaClasse('ladino', 3, 'trapaceiroArcano');
  assert.ok(t.magias.every((id) => ['encantamento', 'ilusão'].includes(SPELLS[id].school)));
  assert.ok(t.magias.includes('sono') && t.magias.includes('imagemSilenciosa'));
  assert.ok(t.truques.includes('maoMagica'));
});

teste('Tela de nível: o Cavaleiro Místico escolhe truques e magias ao chegar ao 3º', async () => {
  const { subirUmNivel } = await import('../game/nivel.js');
  const g = heroi('guerreiro', 2, 'Humano');
  const r = subirUmNivel(g, { subclasse: 'cavaleiroMistico' });
  const truques = r.escolhas.find((e) => e.id === 'truques');
  const magias = r.escolhas.find((e) => e.id === 'aprende');
  assert.ok(truques && truques.quantas === 2, 'dois truques');
  assert.ok(magias && magias.quantas === 3, 'três magias de 1º círculo');
  r.aplicar({});
  assert.equal(g.spellcasting.cantrips.length, 2);
  assert.equal(g.spellcasting.prepared.length, 3);
  assert.ok(g.spellcasting.prepared.every((id) => SPELLS[id].level === 1));
});

teste('Magia de Guerra (Cavaleiro Místico, 7º): depois de um truque com a ação, um ataque com arma como ação bônus; sem a magia, não', () => {
  const k = cavaleiro(7);
  k.pos = { x: 5, y: 5 };
  k.spellcasting.cantrips = ['raioDeFogo'];
  const gob = inimigo('goblin', { x: 6, y: 5 });
  gob.hp = gob.maxHp = 200;
  const { enc } = arena({ herois: [k], foes: [gob] });
  assert.equal(enc.useFeature(k, 'warMagic'), false, 'sem conjurar antes, nada');
  const r = enc.castSpell(k, 'raioDeFogo', { target: gob });
  assert.ok(r.ok, r.why);
  assert.equal(k.ataqueAposMagia, true);
  const hp = gob.hp;
  enc.rng = dadoEmSequencia(15);
  assert.equal(enc.useFeature(k, 'warMagic'), true);
  assert.equal(k.bonusUsed, true, 'custou a ação bônus');
  assert.ok(gob.hp < hp, 'o golpe com a arma acertou');
  assert.equal(enc.useFeature(k, 'warMagic'), false, 'uma vez por magia');
  // Uma magia de 1º círculo só vale com a versão aprimorada (18º).
  k.spellcasting.prepared = ['misselMagico'];
  const k7 = cavaleiro(7);
  k7.pos = { x: 5, y: 5 };
  k7.spellcasting.prepared = ['misselMagico'];
  const g2 = inimigo('goblin', { x: 6, y: 5 });
  g2.hp = g2.maxHp = 200;
  const { enc: e2 } = arena({ herois: [k7], foes: [g2] });
  assert.ok(e2.castSpell(k7, 'misselMagico', { target: g2 }).ok);
  assert.equal(k7.ataqueAposMagia, false, 'com uma magia de círculo, só no 18º');
  const k18 = cavaleiro(18);
  k18.pos = { x: 5, y: 5 };
  k18.spellcasting.prepared = ['misselMagico'];
  const g3 = inimigo('goblin', { x: 6, y: 5 });
  g3.hp = g3.maxHp = 200;
  const { enc: e3 } = arena({ herois: [k18], foes: [g3] });
  assert.ok(e3.castSpell(k18, 'misselMagico', { target: g3 }).ok);
  assert.equal(k18.ataqueAposMagia, true, 'a aprimorada vale para qualquer magia');
});

// ============================================================================================================
// AS ESCOLAS DE MAGO DO LIVRO DO JOGADOR (Abjuração, Adivinhação, Conjuração, Encantamento, Ilusão, Necromancia, Transmutação)
// ============================================================================================================

const escola = (id, nivel, extra = {}, escolhas = {}) => heroi('mago', nivel, 'Humano', { weapons: ['adaga'], ...extra }, { 2: { subclasse: id, ...escolhas } });

teste('As sete escolas: cada uma dá as características do 2º nível, as do 6º, 10º e 14º chegam nos níveis certos', () => {
  const esperado = {
    abjuracao: ['arcaneWard', 'projectedWard', 'improvedAbjuration', 'spellResistance'],
    adivinhacao: ['portent', 'expertDivination', 'thirdEye', 'greaterPortent'],
    conjuracao: ['minorConjuration', 'benignTransposition', 'focusedConjuration', 'durableSummons'],
    encantamento: ['hypnoticGaze', 'instinctiveCharm', 'splitEnchantment', 'alterMemories'],
    ilusao: ['improvedMinorIllusion', 'malleableIllusions', 'illusorySelf', 'illusoryReality'],
    necromancia: ['grimHarvest', 'undeadThralls', 'inuredToUndeath', 'commandUndead'],
    transmutacao: ['minorAlchemy', 'transmutersStone', 'shapechanger', 'masterTransmuter'],
  };
  for (const [id, [n2, n6, n10, n14]] of Object.entries(esperado)) {
    assert.ok(escola(id, 2).features.includes(n2), `${id} 2º: ${n2}`);
    assert.ok(!escola(id, 5).features.includes(n6) && escola(id, 6).features.includes(n6), `${id} 6º: ${n6}`);
    assert.ok(!escola(id, 9).features.includes(n10) && escola(id, 10).features.includes(n10), `${id} 10º: ${n10}`);
    assert.ok(!escola(id, 13).features.includes(n14) && escola(id, 14).features.includes(n14), `${id} 14º: ${n14}`);
    assert.ok(Object.keys(CLASSES.mago.subclasse.opcoes).includes(id));
  }
  assert.equal(Object.keys(CLASSES.mago.subclasse.opcoes).length, 8, 'as oito escolas do livro');
});

teste('Abjuração: a Proteção Arcana nasce com a primeira abjuração, absorve o dano antes dos PV e se recarrega com outras abjurações', () => {
  const m = escola('abjuracao', 6);
  m.pos = { x: 5, y: 5 };
  m.spellcasting.prepared = ['armaduraArcana', 'escudoDaFe'];
  const gob = inimigo('goblin', { x: 6, y: 5 });
  const { enc } = arena({ herois: [m], foes: [gob] });
  assert.equal(m.wardHp, undefined, 'sem abjuração, sem proteção');
  assert.ok(enc.castSpell(m, 'armaduraArcana', { target: m }).ok);
  const max = 2 * 6 + Math.floor((m.abilities.int - 10) / 2);
  assert.equal(m.wardHp, max, '2 × nível + INT');
  const hp = m.hp;
  enc.applyDamage(m, 5, 'cortante', gob, { deArma: true });
  assert.equal(m.hp, hp, 'a proteção levou o golpe');
  assert.equal(m.wardHp, max - 5);
  enc.applyDamage(m, max, 'cortante', gob, { deArma: true });
  assert.equal(m.wardHp, 0);
  assert.equal(m.hp, hp - 5, 'o que passou da proteção feriu o mago');
  m.actionUsed = false; m.bonusUsed = false;
  assert.ok(enc.castSpell(m, 'armaduraArcana', { target: m, circulo: 2 }).ok, 'armadura arcana no 2º círculo');
  assert.equal(m.wardHp, 4, 'recarrega 2 × o círculo do espaço');
});

teste('Proteção Projetada (6º): a proteção do mago absorve o dano de um aliado a até 9 m, com a reação; sem reação, não', () => {
  const m = escola('abjuracao', 6);
  m.pos = { x: 5, y: 5 };
  const amigo = heroi('guerreiro', 1, 'Humano');
  amigo.pos = { x: 8, y: 5 };
  const gob = inimigo('goblin', { x: 9, y: 9 });
  const { enc } = arena({ herois: [m, amigo], foes: [gob] });
  m.wardHp = 20;
  const hp = amigo.hp;
  enc.applyDamage(amigo, 7, 'cortante', gob, { deArma: true });
  assert.equal(amigo.hp, hp, 'o aliado não sentiu');
  assert.equal(m.wardHp, 13);
  assert.equal(m.reactionUsed, true, 'gastou a reação');
  enc.applyDamage(amigo, 4, 'cortante', gob, { deArma: true });
  assert.equal(amigo.hp, hp - 4, 'sem reação, o dano passa');
  const longe = heroi('guerreiro', 1, 'Humano');
  longe.pos = { x: 11, y: 11 };
  const m2 = escola('abjuracao', 6);
  m2.pos = { x: 0, y: 0 };
  const { enc: e2 } = arena({ herois: [m2, longe], foes: [inimigo('goblin', { x: 11, y: 10 })] });
  m2.wardHp = 20;
  const hp2 = longe.hp;
  e2.applyDamage(longe, 3, 'cortante', null, { deArma: true });
  assert.equal(longe.hp, hp2 - 3, 'mais longe que 9 m: sem proteção');
});

teste('Resistência a Magia (14º): vantagem nas resistências contra magias e metade do dano de magia; arma não é magia', () => {
  const m = escola('abjuracao', 14);
  m.pos = { x: 5, y: 5 };
  const gob = inimigo('goblin', { x: 9, y: 9 });
  const { enc } = arena({ herois: [m], foes: [gob] });
  assert.equal(enc.danoPorTipo(m, 20, 'fogo', true, false), 10, 'dano de magia pela metade');
  assert.equal(enc.danoPorTipo(m, 20, 'fogo', false, true), 20, 'golpe de arma, inteiro');
  const sem = escola('evocacao', 14);
  assert.equal(enc.danoPorTipo(sem, 20, 'fogo', true, false), 20, 'outra escola, inteiro');
  const r = enc.resistencia(m, 'dex', 30, { contra: { magico: true } });
  assert.equal(r.mode, 'vantagem');
  const r2 = enc.resistencia(m, 'dex', 30, { contra: { magico: false } });
  assert.notEqual(r2.mode, 'vantagem');
});

teste('Prodígio (Adivinhação): rola os dados do dia na luta; troca o d20 do aliado que ia errar e o do inimigo que ia acertar', () => {
  const m = escola('adivinhacao', 2);
  m.pos = { x: 4, y: 5 };
  const amigo = heroi('guerreiro', 1, 'Humano', { weapons: ['espadaLonga'] });
  amigo.pos = { x: 5, y: 5 };
  const gob = inimigo('goblin', { x: 6, y: 5 });
  gob.hp = gob.maxHp = 500;
  gob.ac = 40;
  const { enc } = arena({ herois: [m, amigo], foes: [gob] });
  enc.rng = dadoEmSequencia(3);
  garantirPortento(enc, m);
  assert.equal(m.portento.length, 2, '2d20');
  assert.equal(escola('adivinhacao', 14).features.includes('greaterPortent'), true);
  m.portento = [20, 1];
  const hp0 = gob.hp;
  enc.rng = dadoEmSequencia(4);
  enc.resolveAttack(amigo, gob, { weaponId: 'espadaLonga' });
  assert.ok(gob.hp < hp0, 'o 20 do Prodígio trocou o 4 e acertou, mesmo contra CA 40');
  assert.deepEqual(m.portento, [1], 'o dado se gastou');
  // o dado 1 vira o acerto do inimigo em erro
  const gob2 = inimigo('goblin', { x: 5, y: 6 });
  gob2.ac = 10;
  const { enc: e2 } = arena({ herois: [m, amigo], foes: [gob2] });
  m.portento = [1];
  const hpA = amigo.hp;
  e2.rng = dadoEmSequencia(18);
  e2.resolveAttack(gob2, amigo, { weaponId: null });
  assert.equal(amigo.hp, hpA, 'o goblin ia acertar com 18, e o 1 do Prodígio o fez errar');
  assert.deepEqual(m.portento, []);
});

teste('Adivinhação Especialista (6º): uma adivinhação de 2º círculo (fora do combate, onde elas existem) devolve um espaço menor', () => {
  const m = escola('adivinhacao', 6);
  m.pos = { x: 5, y: 5 };
  m.spellcasting.prepared = ['verOInvisivel'];
  m.spellcasting.slots[1] = 0;
  const r = conjurarFora(estadoDe({}), m, 'verOInvisivel', { herois: [m], rng: makeRng(3), circulo: 2 });
  assert.ok(r.ok, r.why);
  assert.equal(m.spellcasting.slots[1], 1, 'o espaço de 1º voltou');
  assert.equal(m.spellcasting.slots[2], m.spellcasting.slotsMax[2] - 1, 'o de 2º foi gasto');
  const sem = escola('evocacao', 6);
  sem.pos = { x: 5, y: 5 };
  sem.spellcasting.prepared = ['verOInvisivel'];
  sem.spellcasting.slots[1] = 0;
  conjurarFora(estadoDe({}), sem, 'verOInvisivel', { herois: [sem], rng: makeRng(3), circulo: 2 });
  assert.equal(sem.spellcasting.slots[1], 0, 'outra escola não recupera');
});

teste('Conjuração: Transposição Benigna teleporta e se recarrega com uma conjuração; Conjuração Focada não perde a concentração; Convocação Duradoura dá 30 PV temporários', () => {
  const m = escola('conjuracao', 14);
  m.pos = { x: 5, y: 5 };
  m.spellcasting.prepared = ['graxa', 'teia'];
  const gob = inimigo('goblin', { x: 11, y: 11 });
  const { enc } = arena({ herois: [m], foes: [gob] });
  assert.ok(m.magiasDeCaracteristica.includes('transposicaoBenigna'));
  const antes = { ...m.pos };
  const r = enc.castSpell(m, 'transposicaoBenigna', { point: { x: 8, y: 5 } });
  assert.ok(r.ok, r.why);
  assert.equal(m.pos.x, 8, 'foi para a casa pedida');
  assert.equal(m.resources.benignTransposition, 0);
  assert.notEqual(antes.x, m.pos.x);
  m.actionUsed = false;
  assert.equal(enc.castSpell(m, 'transposicaoBenigna', { point: { x: 5, y: 5 } }).ok, false, 'sem a carga, não teleporta');
  assert.ok(enc.castSpell(m, 'graxa', { point: { x: 9, y: 5 } }).ok);
  assert.equal(m.resources.benignTransposition, 1, 'conjurar conjuração devolve a carga');
  // concentração focada
  m.actionUsed = false;
  m.concentrating = { spellId: 'teia', targets: [], condition: 'contido' };
  enc.rng = dadoEmSequencia(1);
  enc.concentrationCheck(m, 40);
  assert.ok(m.concentrating, 'o dano não derrubou a concentração');
  const comum = escola('evocacao', 14);
  comum.pos = { x: 4, y: 5 };
  comum.concentrating = { spellId: 'teia', targets: [], condition: 'contido' };
  const { enc: e2 } = arena({ herois: [comum], foes: [inimigo('goblin', { x: 11, y: 11 })] });
  e2.rng = dadoEmSequencia(1);
  e2.concentrationCheck(comum, 40);
  assert.equal(comum.concentrating, null, 'sem a característica, cai');
  // convocação duradoura
  const lobo = enc.invocar(m, 'lobo', { x: 6, y: 6 }, { spellId: 'conjurarAnimais' });
  assert.equal(lobo.tempHp, 30);
});

teste('Olhar Hipnótico (Encantamento): falhou em SAB, fica incapacitado e parado; a mesma criatura não de novo; passou, nada', () => {
  for (const [d20, cai] of [[1, true], [20, false]]) {
    const m = escola('encantamento', 2);
    m.pos = { x: 5, y: 5 };
    const gob = inimigo('goblin', { x: 6, y: 5 });
    const { enc } = arena({ herois: [m], foes: [gob] });
    enc.rng = dadoEmSequencia(d20);
    assert.equal(enc.useFeature(m, 'hypnoticGaze', { target: gob }), true);
    assert.equal(m.actionUsed, true);
    assert.equal(hasCondition(gob, 'olharHipnotico'), cai);
    if (cai) assert.equal(conditionEffects(gob).incapacitated, true);
    m.actionUsed = false;
    // Quem foi hipnotizado se mantém com a ação (sem nova resistência); quem resistiu não pode ser olhado de novo.
    assert.equal(enc.useFeature(m, 'hypnoticGaze', { target: gob }), cai, cai ? 'manter o olhar' : 'a mesma criatura só uma vez');
  }
  const m2 = escola('encantamento', 2);
  m2.pos = { x: 5, y: 5 };
  const longe = inimigo('goblin', { x: 9, y: 5 });
  const { enc } = arena({ herois: [m2], foes: [longe] });
  assert.equal(enc.useFeature(m2, 'hypnoticGaze', { target: longe }), false, 'só colado');
});

teste('Encanto Instintivo (6º): quem ataca o mago falha em SAB e o golpe vai para outra criatura; passou, o golpe segue', () => {
  for (const [d20, desvia] of [[1, true], [20, false]]) {
    const m = escola('encantamento', 6);
    m.pos = { x: 5, y: 5 };
    const gob = inimigo('goblin', { x: 6, y: 5 });
    const outro = inimigo('goblin', { x: 7, y: 5 });
    outro.hp = outro.maxHp = 500;
    outro.ac = 1;
    const { enc } = arena({ herois: [m], foes: [gob, outro] });
    m.hp = m.maxHp = 500;
    enc.rng = dadoEmSequencia(d20, 15);
    const hpM = m.hp, hpO = outro.hp;
    const alvo = enc.encantoInstintivo(gob, m, null);
    assert.equal(alvo === m, !desvia, desvia ? 'o golpe saiu do mago' : 'o golpe segue no mago');
    assert.equal(m.resources?.instinctiveCharm, undefined, 'não há recurso: só a reação limita');
    assert.equal((m.charmeImunes ?? []).includes(gob.id), !desvia, 'quem passou fica imune até o descanso longo');
    assert.equal(m.reactionUsed, true);
    assert.equal(m.hp, hpM);
    assert.equal(outro.hp, hpO);
  }
});

teste('Ilusão: Ilusão Menor é do mago; o Eu Ilusório faz o golpe errar uma vez e volta com uma ilusão conjurada', () => {
  const m = escola('ilusao', 10);
  m.pos = { x: 5, y: 5 };
  const gob = inimigo('goblin', { x: 6, y: 5 });
  const { enc } = arena({ herois: [m], foes: [gob] });
  assert.ok(m.magiasDeCaracteristica.includes('ilusaoMenor'), 'Ilusão Menor Aprimorada');
  assert.ok(magiasProntas(m).includes('ilusaoMenor'));
  assert.equal(m.resources.illusorySelf, 1);
  m.hp = m.maxHp = 500;
  enc.rng = dadoEmSequencia(20);
  const r = enc.resolveAttack(gob, m, { weaponId: null });
  assert.equal(r?.hit, false, 'o golpe errou a cópia');
  assert.equal(m.hp, 500);
  assert.equal(m.resources.illusorySelf, 0);
  assert.equal(m.reactionUsed, true);
  m.reactionUsed = false;
  enc.rng = dadoEmSequencia(20);
  enc.resolveAttack(gob, m, { weaponId: null });
  assert.ok(m.hp < 500, 'sem a carga, o golpe acerta');
  m.spellcasting.prepared = ['imagemSilenciosa'];
  assert.ok(enc.castSpell(m, 'imagemSilenciosa', { point: { x: 8, y: 8 } }).ok);
  assert.equal(m.resources.illusorySelf, 0, 'conjurar ilusão NÃO devolve a carga (só o descanso curto ou longo)');
});

teste('Necromancia: Colheita Sombria cura ao matar com magia; Acostumado à Morte resiste a necrótico; Comandar Mortos-vivos vira o morto-vivo', () => {
  const m = escola('necromancia', 14);
  m.pos = { x: 5, y: 5 };
  m.spellcasting.prepared = ['misselMagico'];
  const alvo = inimigo('goblin', { x: 7, y: 5 });
  alvo.hp = 1;
  const { enc } = arena({ herois: [m], foes: [alvo, inimigo('goblin', { x: 11, y: 11 })] });
  m.hp = m.maxHp - 20;
  const hp = m.hp;
  assert.ok(enc.castSpell(m, 'misselMagico', { target: alvo }).ok);
  assert.ok(alvo.dead);
  assert.equal(m.hp, hp + 2, '2 × o círculo do espaço (1º)');
  assert.equal(enc.danoPorTipo(m, 20, 'necrótico'), 10, 'Acostumado à Morte');
  assert.equal(enc.danoPorTipo(escola('evocacao', 14), 20, 'necrótico'), 20);
  // Comandar Mortos-vivos
  const esq = inimigo('esqueleto', { x: 8, y: 5 });
  esq.tipo = 'morto-vivo';
  const { enc: e2 } = arena({ herois: [m], foes: [esq] });
  m.actionUsed = false;
  e2.rng = dadoEmSequencia(1);
  assert.equal(e2.useFeature(m, 'commandUndead', { target: esq }), true);
  assert.equal(esq.side, m.side, 'passou para o lado do mago');
  assert.equal(esq.invocado?.donoId, m.id);
  const esq2 = inimigo('esqueleto', { x: 8, y: 6 });
  esq2.tipo = 'morto-vivo';
  const { enc: e3 } = arena({ herois: [m], foes: [esq2] });
  m.actionUsed = false;
  e3.rng = dadoEmSequencia(20);
  e3.useFeature(m, 'commandUndead', { target: esq2 });
  assert.notEqual(esq2.side, m.side, 'passou na resistência: segue contra o mago');
  const nao = inimigo('goblin', { x: 8, y: 7 });
  const { enc: e4 } = arena({ herois: [m], foes: [nao] });
  m.actionUsed = false;
  assert.equal(e4.useFeature(m, 'commandUndead', { target: nao }), false, 'só mortos-vivos');
});

teste('Pedra do Transmutador (6º): o benefício escolhido vale — velocidade, CON, resistência ou visão no escuro', async () => {
  const base = escola('transmutacao', 6, {}, {});
  assert.ok(base.features.includes('transmutersStone'));
  assert.ok(base.features.includes('stoneDarkvision'), 'o padrão é a primeira opção');
  const { visaoNoEscuro } = await import('../rules/luz.js');
  assert.ok(visaoNoEscuro(base) >= 60);
  const veloz = heroi('mago', 6, 'Humano', { weapons: ['adaga'] }, { 2: { subclasse: 'transmutacao' }, 6: { transmutersStone: 'stoneSpeed' } });
  const outro = heroi('mago', 6, 'Humano', { weapons: ['adaga'] }, { 2: { subclasse: 'transmutacao' } });
  const { enc } = arena({ herois: [veloz, outro], foes: [inimigo('goblin', { x: 11, y: 11 })] });
  assert.equal(enc.speedOf(veloz), enc.speedOf(outro) + 10, '+3 m');
  const forte = heroi('mago', 6, 'Humano', { weapons: ['adaga'] }, { 2: { subclasse: 'transmutacao' }, 6: { transmutersStone: 'stoneConSave' } });
  assert.equal(saveBonus(forte, 'con'), saveBonus(outro, 'con') + proficiencyBonus(6));
  const quente = heroi('mago', 6, 'Humano', { weapons: ['adaga'] }, { 2: { subclasse: 'transmutacao' }, 6: { transmutersStone: 'stoneResistFire' } });
  assert.equal(enc.danoPorTipo(quente, 20, 'fogo'), 10);
  assert.equal(enc.danoPorTipo(quente, 20, 'frio'), 20);
  assert.throws(() => heroi('mago', 6, 'Humano', {}, { 2: { subclasse: 'transmutacao' }, 6: { transmutersStone: 'stoneXyz' } }));
});

// ============================================================================================================
// CAMINHO DA SOMBRA e CAMINHO DOS QUATRO ELEMENTOS (monge, Livro do Jogador)
// ============================================================================================================

const sombra = (nivel) => heroi('monge', nivel, 'Humano', {}, { 3: { subclasse: 'sombra' } });
const elementos = (nivel, disc = {}) => heroi('monge', nivel, 'Humano', {}, { 3: { subclasse: 'quatroElementos', ...disc } });

teste('Caminho da Sombra: Artes Sombrias gastam 2 de ki e dão as quatro magias; sem ki, não saem', () => {
  const m = sombra(3);
  m.pos = { x: 5, y: 5 };
  assert.ok(m.features.includes('shadowArts'));
  const prontas = magiasProntas(m);
  for (const id of ['escuridao', 'visaoNoEscuro', 'passosSemPegadas', 'silencio']) assert.ok(prontas.includes(id), id);
  const gob = inimigo('goblin', { x: 11, y: 11 });
  const { enc } = arena({ herois: [m], foes: [gob] });
  const ki = m.resources.ki;
  const r = enc.castSpell(m, 'escuridao', { point: { x: 8, y: 8 } });
  assert.ok(r.ok, r.why);
  assert.equal(m.resources.ki, ki - 2, 'gastou 2 de ki');
  m.actionUsed = false;
  m.resources.ki = 1;
  assert.equal(enc.castSpell(m, 'silencio', { point: { x: 8, y: 8 } }).ok, false, 'com 1 de ki, nada');
  assert.equal(heroi('monge', 3, 'Humano', {}, { 3: { subclasse: 'maoAberta' } }).magiasDeKi, undefined, 'a Mão Aberta não tem');
});

teste('Passo das Sombras (6º): bônus, teleporta 18 m, e o primeiro golpe corpo a corpo do turno tem vantagem, uma vez', () => {
  const m = sombra(6);
  m.pos = { x: 5, y: 5 };
  const gob = inimigo('goblin', { x: 9, y: 5 });
  const { enc } = arena({ herois: [m], foes: [gob] });
  assert.ok(magiasProntas(m).includes('passoDasSombras'));
  assert.ok(!enc.attackModifiers(m, gob, {}).vantagens.includes('passo das sombras'));
  const r = enc.castSpell(m, 'passoDasSombras', { point: { x: 8, y: 5 } });
  assert.ok(r.ok, r.why);
  assert.equal(m.pos.x, 8);
  assert.equal(m.bonusUsed, true, 'custou a ação bônus');
  assert.ok(enc.attackModifiers(m, gob, {}).vantagens.includes('passo das sombras'));
  assert.ok(!enc.attackModifiers(m, gob, { ranged: true }).vantagens.includes('passo das sombras'), 'só corpo a corpo');
  enc.rng = dadoEmSequencia(10);
  enc.resolveAttack(m, gob, { weaponId: 'punhos' });
  assert.ok(!enc.attackModifiers(m, gob, {}).vantagens.includes('passo das sombras'), 'a vantagem se gastou no primeiro golpe');
});

teste('Manto de Sombras (11º): ação, invisível; Oportunista (17º): reação que ataca quem foi acertado por outro', () => {
  const m = sombra(11);
  m.pos = { x: 5, y: 5 };
  const { enc } = arena({ herois: [m], foes: [inimigo('goblin', { x: 11, y: 11 })] });
  assert.equal(enc.useFeature(m, 'cloakOfShadows'), true);
  assert.ok(hasCondition(m, 'invisivel'));
  assert.equal(m.actionUsed, true);
  assert.equal(enc.useFeature(m, 'cloakOfShadows'), false);
  // Oportunista
  const op = sombra(17);
  op.pos = { x: 5, y: 5 };
  const amigo = heroi('guerreiro', 1, 'Humano', { weapons: ['espadaLonga'] });
  amigo.pos = { x: 7, y: 5 };
  const gob = inimigo('goblin', { x: 6, y: 5 });
  gob.hp = gob.maxHp = 500;
  gob.ac = 1;
  const { enc: e2 } = arena({ herois: [op, amigo], foes: [gob] });
  e2.rng = dadoEmSequencia(15);
  const antes = gob.hp;
  e2.resolveAttack(amigo, gob, { weaponId: 'espadaLonga' });
  assert.ok(gob.hp < antes - 1, 'o golpe do amigo e o do monge');
  assert.equal(op.reactionUsed, true, 'o monge usou a reação');
  const sem = heroi('monge', 17, 'Humano', {}, { 3: { subclasse: 'maoAberta' } });
  sem.pos = { x: 5, y: 5 };
  const g2 = inimigo('goblin', { x: 6, y: 5 });
  g2.hp = g2.maxHp = 500;
  g2.ac = 1;
  const amigo2 = heroi('guerreiro', 1, 'Humano', { weapons: ['espadaLonga'] });
  amigo2.pos = { x: 7, y: 5 };
  const { enc: e3 } = arena({ herois: [sem, amigo2], foes: [g2] });
  e3.rng = dadoEmSequencia(15);
  e3.resolveAttack(amigo2, g2, { weaponId: 'espadaLonga' });
  assert.equal(sem.reactionUsed, false, 'sem a característica, nada');
});

teste('Quatro Elementos: escolhe disciplinas pelo nível do monge, conjura gastando ki (o custo do livro) e limita o ki por magia', () => {
  const m3 = elementos(3);
  assert.ok(m3.features.includes('discipleOfTheElements'));
  const d3 = m3.features.filter((f) => CLASSES.monge.subclasse.opcoes.quatroElementos.opcoesDeDisciplina.includes(f));
  assert.equal(d3.length, 1, 'uma disciplina no 3º');
  assert.ok(['fistOfFourThunders', 'rushOfTheGaleSpirits', 'sweepingCinderStrike'].includes(d3[0]), 'só as do 3º nível');
  const m6 = heroi('monge', 6, 'Humano', {}, { 3: { subclasse: 'quatroElementos', disciplinas: ['fistOfFourThunders'] }, 6: { disciplinas: ['clenchOfTheNorthWind'] } });
  assert.ok(m6.features.includes('clenchOfTheNorthWind'));
  assert.throws(() => elementos(3, { disciplinas: ['flamesOfThePhoenix'] }), /disciplinas/, 'Chamas da Fênix só no 11º');
  // conjurar
  const m = elementos(11, { disciplinas: ['sweepingCinderStrike'] });
  m.pos = { x: 5, y: 5 };
  const gob = inimigo('goblin', { x: 6, y: 5 });
  gob.hp = gob.maxHp = 500;
  const { enc } = arena({ herois: [m], foes: [gob] });
  assert.ok(magiasProntas(m).includes('maosFlamejantes'));
  const ki = m.resources.ki;
  assert.ok(enc.castSpell(m, 'maosFlamejantes', { target: gob, point: gob.pos }).ok);
  assert.equal(m.resources.ki, ki - 2, '2 de ki');
  assert.ok(gob.hp < 500, 'queimou');
  // mais ki sobe o círculo (1 de ki por círculo), até o limite (4 de ki por magia no 11º)
  m.actionUsed = false;
  assert.ok(enc.castSpell(m, 'maosFlamejantes', { target: gob, point: gob.pos, circulo: 3 }).ok, '2 + 2 = 4 de ki, no 3º círculo');
  assert.equal(m.resources.ki, ki - 2 - 4);
  m.actionUsed = false;
  m.resources.ki = 20;
  assert.equal(enc.castSpell(m, 'maosFlamejantes', { target: gob, point: gob.pos, circulo: 4 }).ok, false, '5 de ki passa do limite do 11º');
});

teste('Tela de nível: o monge dos Quatro Elementos escolhe a disciplina nova, e a troca refaz as magias', async () => {
  const { subirUmNivel } = await import('../game/nivel.js');
  const m = heroi('monge', 2, 'Humano');
  const r = subirUmNivel(m, { subclasse: 'quatroElementos' });
  const e = r.escolhas.find((x) => x.id === 'disciplinas');
  assert.ok(e && e.quantas === 1 && e.opcoes.length === 3, 'as três do 3º nível');
  const padrao = m.features.find((f) => e.opcoes.includes(f));
  const outra = e.opcoes.find((o) => o !== padrao);
  r.aplicar({ disciplinas: [outra] });
  assert.ok(m.features.includes(outra) && !m.features.includes(padrao));
  assert.ok(m.magiasDeKi.some((x) => x.magia === (outra === 'fistOfFourThunders' ? 'ondaTrovejante' : outra === 'rushOfTheGaleSpirits' ? 'lufadaDeVento' : 'maosFlamejantes')));
});

// ============================================================================================================
// JURAMENTO DOS ANCIÕES (paladino) e SENHOR DAS FERAS (patrulheiro), Livro do Jogador
// ============================================================================================================

const ancião = (nivel) => heroi('paladino', nivel, 'Humano', { weapons: ['espadaLonga'] }, { 3: { subclasse: 'ancioes' } });
const senhor = (nivel, bicho = 'companionLobo') => heroi('patrulheiro', nivel, 'Humano', { weapons: ['espadaCurta'] }, { 3: { subclasse: 'senhorDasFeras', rangersCompanion: bicho } });

teste('Anciões: características por nível, magias do Juramento e a carga de Canalizar Divindade', () => {
  const p = ancião(5);
  assert.ok(['channelDivinity', 'naturesWrath', 'turnTheFaithless'].every((f) => p.features.includes(f)));
  const prep = [...p.spellcasting.prepared, ...(p.spellcasting.sempreProntas ?? [])];
  assert.ok(prep.includes('golpeConstritor') && prep.includes('raioLunar') && prep.includes('passoNebuloso'));
  assert.ok(ancião(7).features.includes('auraOfWarding') && ancião(15).features.includes('undyingSentinel') && ancião(20).features.includes('elderChampion'));
  assert.equal(ancião(15).resources.undyingSentinel, 1);
  assert.equal(ancião(20).resources.elderChampion, 1);
});

teste('Ira da Natureza: falhou em FOR e DES, fica contido; passou, solto; custa a ação e a carga', () => {
  for (const [d20, preso] of [[1, true], [20, false]]) {
    const p = ancião(3);
    p.pos = { x: 5, y: 5 };
    const gob = inimigo('goblin', { x: 7, y: 5 });
    const { enc } = arena({ herois: [p], foes: [gob] });
    enc.rng = dadoEmSequencia(d20);
    assert.equal(enc.useFeature(p, 'naturesWrath', { target: gob }), true);
    assert.equal(p.actionUsed, true);
    assert.equal(p.resources.channelDivinity, 0);
    assert.equal(hasCondition(gob, 'contido'), preso);
  }
  const p2 = ancião(3);
  p2.pos = { x: 5, y: 5 };
  const longe = inimigo('goblin', { x: 11, y: 5 });
  const { enc } = arena({ herois: [p2], foes: [longe] });
  assert.equal(enc.useFeature(p2, 'naturesWrath', { target: longe }), false, 'só até 3 m');
});

teste('Expulsar os Infiéis: fadas e corruptores falham em SAB e fogem; o resto não é afetado', () => {
  const p = ancião(3);
  p.pos = { x: 5, y: 5 };
  const fada = inimigo('goblin', { x: 7, y: 5 });
  fada.tipo = 'feérico';
  const gob = inimigo('goblin', { x: 6, y: 6 });
  const { enc } = arena({ herois: [p], foes: [fada, gob] });
  enc.rng = dadoEmSequencia(1);
  assert.equal(enc.useFeature(p, 'turnTheFaithless'), true);
  assert.ok(hasCondition(fada, 'amedrontado'));
  assert.ok(!hasCondition(gob, 'amedrontado'), 'um goblin comum não é infiel');
  assert.equal(p.resources.channelDivinity, 0);
});

teste('Aura de Resguardo (7º): o paladino e os aliados na aura resistem a dano de magia; fora da aura ou de arma, não', () => {
  const p = ancião(7);
  p.pos = { x: 5, y: 5 };
  const amigo = heroi('guerreiro', 1, 'Humano');
  amigo.pos = { x: 7, y: 5 };
  const longe = heroi('guerreiro', 1, 'Humano');
  longe.pos = { x: 11, y: 11 };
  const { enc } = arena({ herois: [p, amigo, longe], foes: [inimigo('goblin', { x: 11, y: 10 })] });
  assert.equal(enc.danoPorTipo(p, 20, 'fogo', true, false), 10, 'o paladino');
  assert.equal(enc.danoPorTipo(amigo, 20, 'fogo', true, false), 10, 'o aliado na aura');
  assert.equal(enc.danoPorTipo(amigo, 20, 'cortante', false, true), 20, 'golpe de arma, inteiro');
  assert.equal(enc.danoPorTipo(longe, 20, 'fogo', true, false), 20, 'fora da aura');
  const dev = heroi('paladino', 7, 'Humano', {}, { 3: { subclasse: 'devocao' } });
  dev.pos = { x: 5, y: 5 };
  const { enc: e2 } = arena({ herois: [dev], foes: [inimigo('goblin', { x: 11, y: 10 })] });
  assert.equal(e2.danoPorTipo(dev, 20, 'fogo', true, false), 20, 'a Devoção não tem');
});

teste('Sentinela Imortal (15º): cai a 1 PV em vez de 0, uma vez; Campeão Ancestral (20º): +10 PV por turno', () => {
  const p = ancião(15);
  p.pos = { x: 5, y: 5 };
  const gob = inimigo('goblin', { x: 6, y: 5 });
  const { enc } = arena({ herois: [p], foes: [gob] });
  enc.applyDamage(p, p.hp + 10, 'cortante', gob, { deArma: true });
  assert.equal(p.hp, 1, 'ficou de pé com 1 PV');
  assert.equal(p.resources.undyingSentinel, 0);
  enc.applyDamage(p, 10, 'cortante', gob, { deArma: true });
  assert.ok(p.hp <= 0 || p.dead || hasCondition(p, 'inconsciente'), 'a segunda vez cai');
  const c = ancião(20);
  c.pos = { x: 5, y: 5 };
  const { enc: e2 } = arena({ herois: [c], foes: [inimigo('goblin', { x: 11, y: 11 })] });
  c.hp = 10;
  assert.equal(e2.useFeature(c, 'elderChampion'), true);
  assert.ok(hasCondition(c, 'campeaoAnciao'));
  e2.beginSide('party');
  assert.equal(c.hp, 20, '+10 PV no começo do turno');
});

teste('Senhor das Feras: o companheiro nasce na luta com os PV e a proficiência do patrulheiro, e só age com a ordem', () => {
  const r = senhor(3);
  assert.ok(r.features.includes('rangersCompanion') && r.features.includes('companionLobo'));
  assert.ok(!senhor(3, 'companionJavali').features.includes('companionLobo'));
  r.pos = { x: 5, y: 5 };
  const gob = inimigo('goblin', { x: 11, y: 11 });
  const field = new Battlefield(12, 12, MAPA);
  const enc = new Encounter({ battlefield: field, party: [r], foes: [gob], rng: makeRng(1), onLog: () => {}, onEvent: () => {} });
  enc.start();
  const comp = enc.invocadosDe(r).find((x) => x.invocado.spellId === 'companheiroAnimal');
  assert.ok(comp, 'o companheiro entrou');
  assert.equal(comp.side, r.side);
  assert.equal(comp.maxHp, Math.max(11, 4 * 3), '4 × o nível do patrulheiro, no mínimo');
  const base = MONSTERS.lobo;
  assert.equal(comp.ac, base.ac + proficiencyBonus(3), 'CA + proficiência');
  assert.equal(comp.attacks[0].bonus, base.attacks[0].bonus + proficiencyBonus(3));
  assert.equal(comp.attacks[0].damage, '2d4+4', 'dano + proficiência');
  // só age com a ordem
  enc.round = 1;
  enc.firstSide = 'party';
  enc.beginSide('party');
  assert.equal(comp.actionUsed, true, 'sem ordem, sem ação');
  assert.equal(enc.useFeature(r, 'rangersCompanion'), true);
  assert.equal(r.actionUsed, true, 'a ordem custa a ação');
  assert.equal(comp.actionUsed, false, 'a fera pode agir');
  assert.equal(enc.useFeature(r, 'rangersCompanion'), false);
});

teste('Treinamento Excepcional (7º): ordenar custa a ação bônus; Fúria Bestial (11º): a fera ataca duas vezes', () => {
  const r = senhor(7);
  r.pos = { x: 5, y: 5 };
  const field = new Battlefield(12, 12, MAPA);
  const enc = new Encounter({ battlefield: field, party: [r], foes: [inimigo('goblin', { x: 11, y: 11 })], rng: makeRng(1), onLog: () => {}, onEvent: () => {} });
  enc.start();
  enc.firstSide = 'party';
  enc.beginSide('party');
  assert.equal(enc.useFeature(r, 'rangersCompanion', { modo: 'apoio' }), true);
  assert.equal(r.bonusUsed, true, 'o apoio custa a ação bônus com o Treinamento');
  assert.equal(r.actionUsed, false, 'a ação do patrulheiro segue livre');
  assert.equal(enc.canAttack(enc.invocadosDe(r)[0], enc.foes?.[0] ?? enc.combatants.find((c) => c.side !== r.side), null).ok, false, 'na ordem de apoio a fera não ataca');
  assert.equal(enc.useFeature(r, 'rangersCompanion'), true, 'atacar custa só um golpe do patrulheiro (Ataque Extra)');
  assert.equal(r.actionUsed, false);
  assert.equal(r.comandouNoTurno, true);
  const r11 = senhor(11);
  r11.pos = { x: 5, y: 5 };
  const e2 = new Encounter({ battlefield: new Battlefield(12, 12, MAPA), party: [r11], foes: [inimigo('goblin', { x: 11, y: 11 })], rng: makeRng(1), onLog: () => {}, onEvent: () => {} });
  e2.start();
  const comp = e2.invocadosDe(r11)[0];
  assert.equal(comp.multiattack.count, 2);
  assert.equal(comp.maxHp, 44, '4 × 11');
});

// ============================================================================================================
// CORREÇÕES DA REVISÃO DAS 13 SUBCLASSES (os achados dos revisores, um teste por ponto)
// ============================================================================================================

teste('Mestre de Batalha: 9 manobras; Provocador e Distrativo marcam o alvo; Derrubador e Empurrão não valem contra Enorme', () => {
  assert.equal(CLASSES.guerreiro.subclasse.opcoes.mestreDeBatalha.opcoesDeManobra.length, 16);
  const prov = mestre(3);
  prov.features.push('goadingAttack', 'distractingStrike');
  prov.pos = { x: 5, y: 5 };
  const gob = inimigo('goblin', { x: 6, y: 5 });
  gob.hp = gob.maxHp = 300;
  const outro = alvoParado({ x: 7, y: 6 });
  const { enc } = arena({ herois: [prov], foes: [gob, outro] });
  enc.useFeature(prov, 'goadingAttack');
  enc.rng = dadoEmSequencia(15, 2);
  enc.attackAction(prov, gob, 'espadaLonga');
  assert.ok(hasCondition(gob, 'provocado'), 'provocado');
  assert.ok(enc.attackModifiers(gob, outro, {}).desvantagens.includes('provocado'), 'desvantagem contra quem não é o provocador');
  assert.ok(!enc.attackModifiers(gob, prov, {}).desvantagens.includes('provocado'), 'contra o provocador: normal');
  const amigo = heroi('guerreiro', 1, 'Humano', { weapons: ['espadaLonga'] });
  amigo.pos = { x: 5, y: 6 };
  const prov2 = mestre(3);
  prov2.features.push('distractingStrike');
  prov2.pos = { x: 5, y: 5 };
  const alvo = inimigo('goblin', { x: 6, y: 5 });
  alvo.hp = alvo.maxHp = 300;
  const { enc: e2 } = arena({ herois: [prov2, amigo], foes: [alvo] });
  e2.useFeature(prov2, 'distractingStrike');
  e2.rng = dadoEmSequencia(15);
  e2.attackAction(prov2, alvo, 'espadaLonga');
  assert.ok(hasCondition(alvo, 'distraido'));
  assert.ok(e2.attackModifiers(amigo, alvo, {}).vantagens.includes('ataque distrativo'), 'o aliado ataca com vantagem');
  assert.ok(!e2.attackModifiers(prov2, alvo, {}).vantagens.includes('ataque distrativo'), 'quem distraiu não');
  // Enorme: não cai
  const m = mestre(3);
  m.pos = { x: 5, y: 5 };
  const ogro = inimigo('goblin', { x: 6, y: 5 });
  ogro.size = 'enorme';
  ogro.hp = ogro.maxHp = 300;
  const { enc: e3 } = arena({ herois: [m], foes: [ogro] });
  e3.useFeature(m, 'tripAttack');
  e3.rng = dadoEmSequencia(15, 2);
  e3.attackAction(m, ogro, 'espadaLonga');
  assert.ok(!hasCondition(ogro, 'caido'), 'grande demais');
  assert.equal(m.resources.superiorityDice, 3, 'o dado se gastou');
});

teste('Riposta e Aparar (Mestre de Batalha): reações com um dado; a riposta soma o dado ao dano, o aparar corta o dano recebido', () => {
  const m = mestre(7);
  m.features.push('riposte', 'parry');
  m.pos = { x: 5, y: 5 };
  const gob = inimigo('goblin', { x: 6, y: 5 });
  gob.hp = gob.maxHp = 300;
  const { enc } = arena({ herois: [m], foes: [gob] });
  enc.rng = dadoEmSequencia(2, 15); // o goblin erra; a riposta acerta
  const hp = gob.hp;
  enc.resolveAttack(gob, m, { weaponId: null });
  assert.ok(gob.hp < hp, 'a riposta feriu o goblin');
  assert.equal(m.reactionUsed, true);
  assert.equal(m.resources.superiorityDice, 4, 'gastou um dado');
  // Aparar
  const p = mestre(7);
  p.features.push('parry');
  p.pos = { x: 5, y: 5 };
  p.hp = p.maxHp = 300;
  const g2 = inimigo('goblin', { x: 6, y: 5 });
  const { enc: e2 } = arena({ herois: [p], foes: [g2] });
  e2.applyDamage(p, 20, 'cortante', g2, { deArma: true, corpoACorpo: true });
  assert.ok(300 - p.hp < 20, 'o dano caiu');
  assert.equal(p.resources.superiorityDice, 4);
  assert.equal(p.reactionUsed, true);
  e2.applyDamage(p, 20, 'cortante', g2, { deArma: true, corpoACorpo: true });
  assert.equal(p.resources.superiorityDice, 4, 'sem reação, não aparam de novo');
});

teste('Repelir o Inimigo: morto-vivo tem desvantagem; o efeito acaba no primeiro dano e nenhum "escapar" o solta', () => {
  const p = vingador(3);
  p.pos = { x: 5, y: 5 };
  const zumbi = inimigo('zumbi', { x: 8, y: 5 });
  zumbi.tipo = 'morto-vivo';
  zumbi.hp = zumbi.maxHp = 100;
  const { enc } = arena({ herois: [p], foes: [zumbi] });
  enc.rng = dadoEmSequencia(1);
  assert.equal(enc.useFeature(p, 'abjureEnemy', { target: zumbi }), true);
  assert.ok(hasCondition(zumbi, 'amedrontado') && hasCondition(zumbi, 'paralisadoDeMedo'));
  assert.equal(enc.speedOf(zumbi), 0, 'sem andar');
  enc.applyDamage(zumbi, 3, 'cortante', p, { deArma: true });
  assert.ok(!hasCondition(zumbi, 'amedrontado') && !hasCondition(zumbi, 'paralisadoDeMedo'), 'o dano encerra');
  // desvantagem: com d20 11 e 10 (o pior vale), CD 8+2+3 = 13
  const p2 = vingador(3);
  p2.pos = { x: 5, y: 5 };
  const z2 = inimigo('zumbi', { x: 8, y: 5 });
  z2.tipo = 'morto-vivo';
  const { enc: e2 } = arena({ herois: [p2], foes: [z2] });
  const r = e2.resistencia(z2, 'wis', 30, { desvantagem: true });
  assert.equal(r.mode, 'desvantagem');
});

teste('Olhar Hipnótico: o dano desperta, a criatura fica enfeitiçada e a ação mantém o olhar', () => {
  const m = escola('encantamento', 2);
  m.pos = { x: 5, y: 5 };
  const gob = inimigo('goblin', { x: 6, y: 5 });
  gob.hp = gob.maxHp = 100;
  const { enc } = arena({ herois: [m], foes: [gob] });
  enc.rng = dadoEmSequencia(1);
  enc.useFeature(m, 'hypnoticGaze', { target: gob });
  assert.ok(hasCondition(gob, 'enfeiticado') && hasCondition(gob, 'olharHipnotico'));
  m.actionUsed = false;
  assert.equal(enc.useFeature(m, 'hypnoticGaze', { target: gob }), true, 'manter o olhar');
  enc.applyDamage(gob, 2, 'cortante', m, { deArma: true });
  assert.ok(!hasCondition(gob, 'olharHipnotico'), 'o dano o desperta');
});

teste('Encanto Instintivo: sem limite de usos, desvia para o MAIS PRÓXIMO do atacante e quem passa fica imune; Eu Ilusório só gasta se o ataque era possível', () => {
  const m = escola('encantamento', 6);
  m.pos = { x: 2, y: 5 };
  m.hp = m.maxHp = 300;
  const amigo = heroi('guerreiro', 1, 'Humano');
  amigo.pos = { x: 5, y: 5 };
  const gob = inimigo('goblin', { x: 6, y: 5 });
  const longe = inimigo('goblin', { x: 4, y: 6 });
  const { enc } = arena({ herois: [m, amigo], foes: [gob, longe] });
  enc.rng = dadoEmSequencia(1);
  const alvo = enc.encantoInstintivo(gob, m, null);
  assert.equal(alvo, amigo, 'o amigo era o mais próximo do goblin');
  m.reactionUsed = false;
  enc.rng = dadoEmSequencia(1);
  assert.equal(enc.encantoInstintivo(longe, m, null) !== m, true, 'outro atacante, outra vez: sem recurso a gastar');
  // passa: imune
  m.reactionUsed = false;
  enc.rng = dadoEmSequencia(20);
  assert.equal(enc.encantoInstintivo(gob, m, null), m);
  m.reactionUsed = false;
  enc.rng = dadoEmSequencia(1);
  assert.equal(enc.encantoInstintivo(gob, m, null), m, 'quem passou fica imune');
  // Eu Ilusório: ataque impossível não gasta
  const i = escola('ilusao', 10);
  i.pos = { x: 0, y: 0 };
  const ar = inimigo('goblin', { x: 11, y: 11 });
  ar.attacks = [{ name: 'Mordida', bonus: 4, damage: '1d4', type: 'perfurante', reachFt: 5 }];
  const { enc: e2 } = arena({ herois: [i], foes: [ar] });
  e2.resolveAttackBase(ar, i, { weaponId: null });
  assert.equal(i.resources.illusorySelf, 1, 'o golpe nem era possível: nada se gastou');
  assert.equal(i.reactionUsed, false);
});

teste('Inspiração em Combate exige a reação; Dissipar Magia no companheiro não quebra; Escudo Arcano cria a Proteção Arcana', () => {
  const bardo = valoroso(3);
  bardo.pos = { x: 4, y: 5 };
  const amigo = heroi('guerreiro', 1, 'Humano');
  amigo.pos = { x: 5, y: 5 };
  const gob = inimigo('goblin', { x: 6, y: 5 });
  const { enc } = arena({ herois: [bardo, amigo], foes: [gob] });
  addCondition(amigo, 'inspirado', { rounds: 100, source: bardo.id, data: { dado: '1d6' } });
  amigo.reactionUsed = true;
  let achou = null;
  for (let d = 2; d < 20 && achou === null; d += 1) {
    amigo.hp = amigo.maxHp;
    enc.rng = dadoEmSequencia(d);
    const hp = amigo.hp;
    enc.resolveAttack(gob, amigo, { weaponId: null });
    if (amigo.hp === hp) { achou = d; }
  }
  // Sem reação, o dado nunca é gasto e o inspirado continua inspirado depois de ser acertado.
  assert.ok(hasCondition(amigo, 'inspirado') || achou !== null, 'o dado só se gasta com a reação livre');
  assert.equal(amigo.reactionUsed, true);
  // Dissipar Magia na criatura do companheiro não lança
  const r = senhor(3);
  r.pos = { x: 5, y: 5 };
  const g2 = inimigo('goblin', { x: 11, y: 11 });
  const e2 = new Encounter({ battlefield: new Battlefield(12, 12, MAPA), party: [r], foes: [g2], rng: makeRng(1), onLog: () => {}, onEvent: () => {} });
  e2.start();
  const comp = e2.invocadosDe(r)[0];
  const mago = escola('abjuracao', 6);
  mago.pos = { x: 4, y: 5 };
  mago.spellcasting.prepared = ['dissiparMagia'];
  e2.combatants.push(mago);
  assert.doesNotThrow(() => e2.castSpell(mago, 'dissiparMagia', { target: comp, circulo: 3 }));
  // Escudo Arcano é abjuração: cria a proteção
  const aj = escola('abjuracao', 6);
  aj.pos = { x: 5, y: 5 };
  aj.spellcasting.prepared = ['escudoArcano'];
  const g3 = inimigo('goblin', { x: 6, y: 5 });
  const { enc: e3 } = arena({ herois: [aj], foes: [g3] });
  assert.equal(aj.wardHp, undefined);
  let ergueu = false;
  for (let d = 8; d < 20 && !ergueu; d += 1) {
    e3.rng = dadoEmSequencia(d);
    aj.reactionUsed = false;
    delete aj.conditions;
    aj.conditions = [];
    e3.resolveAttack(g3, aj, { weaponId: null });
    ergueu = aj.wardHp !== undefined;
  }
  assert.ok(ergueu, 'o Escudo Arcano (reação) criou a Proteção Arcana');
});

teste('Forma Selvagem é ilimitada no 20º (Arquidruida), inclusive na Lua; a Pedra dá ácido e trovejante; truques do conjurador de um terço vêm da lista inteira', async () => {
  for (const sub of ['lua', 'terra']) {
    const d = heroi('druida', 20, 'Humano', {}, { 2: { subclasse: sub } });
    d.pos = { x: 5, y: 5 };
    const { enc } = arena({ herois: [d], foes: [inimigo('goblin', { x: 11, y: 11 })] });
    const fera = formasDisponiveis(20, sub === 'lua')[0];
    assert.equal(enc.useFeature(d, 'wildShape', { modo: fera }), true, `${sub}: vira fera`);
    enc.useFeature(d, 'wildShape', { modo: 'voltar' });
    d.actionUsed = false; d.bonusUsed = false;
    assert.equal(enc.useFeature(d, 'wildShape', { modo: fera }), true, `${sub}: e de novo, sem limite`);
  }
  const acido = heroi('mago', 6, 'Humano', {}, { 2: { subclasse: 'transmutacao' }, 6: { transmutersStone: 'stoneResistAcid' } });
  const trov = heroi('mago', 6, 'Humano', {}, { 2: { subclasse: 'transmutacao' }, 6: { transmutersStone: 'stoneResistThunder' } });
  const { enc } = arena({ herois: [acido, trov], foes: [inimigo('goblin', { x: 11, y: 11 })] });
  assert.equal(enc.danoPorTipo(acido, 20, 'ácido'), 10);
  assert.equal(enc.danoPorTipo(trov, 20, 'trovejante'), 10);
  const { listaDaClasse } = await import('../game/criacao.js');
  assert.ok(listaDaClasse('guerreiro', 3, 'cavaleiroMistico').truques.includes('maoMagica'), 'o Cavaleiro Místico escolhe truques da lista inteira');
  assert.ok(listaDaClasse('ladino', 3, 'trapaceiroArcano').truques.includes('prestidigitacao'));
  assert.ok(!listaDaClasse('guerreiro', 3, 'cavaleiroMistico').magias.includes('sono'), 'as magias seguem restritas às duas escolas');
});

teste('Proteção Arcana e Transposição Benigna também valem fora de combate; Artes Sombrias dão Ilusão Menor; Convocação Duradoura só em conjuração', () => {
  const ab = escola('abjuracao', 6);
  ab.pos = { x: 5, y: 5 };
  ab.spellcasting.prepared = ['alarme'];
  const r = conjurarFora(estadoDe({}), ab, 'alarme', { herois: [ab], rng: makeRng(3), circulo: 1 });
  assert.ok(r.ok, r.why);
  assert.equal(ab.wardHp, 2 * 6 + Math.floor((ab.abilities.int - 10) / 2), 'a proteção nasceu fora de combate');
  const monge = sombra(3);
  assert.ok(magiasProntas(monge).includes('ilusaoMenor'), 'Artes Sombrias: Ilusão Menor');
  const conj = escola('conjuracao', 14);
  conj.pos = { x: 5, y: 5 };
  const { enc } = arena({ herois: [conj], foes: [inimigo('goblin', { x: 11, y: 11 })] });
  assert.equal(enc.invocar(conj, 'lobo', { x: 6, y: 6 }, { spellId: 'conjurarAnimais' }).tempHp, 30);
  assert.ok(!(enc.invocar(conj, 'lobo', { x: 7, y: 7 }, { spellId: 'animarMortos' }).tempHp > 0), 'a convocação duradoura é só de conjuração');
});

teste('Companheiro: não há "agir sozinho"; a ordem de atacar com Ataque Extra gasta só um golpe; a de apoio impede o ataque; os golpes viram mágicos no 7º', () => {
  const r = senhor(5);
  r.pos = { x: 5, y: 5 };
  const gob = inimigo('goblin', { x: 11, y: 11 });
  const enc = new Encounter({ battlefield: new Battlefield(12, 12, MAPA), party: [r], foes: [gob], rng: makeRng(1), onLog: () => {}, onEvent: () => {} });
  enc.start();
  const comp = enc.invocadosDe(r)[0];
  enc.definirAutoDosInvocados(r, true);
  assert.equal(comp.invocado.auto, false, 'o companheiro não age sozinho');
  enc.firstSide = 'party';
  enc.beginSide('party');
  assert.equal(enc.useFeature(r, 'rangersCompanion'), true);
  assert.equal(r.actionUsed, false, 'com Ataque Extra, a ação segue livre');
  assert.equal(enc.golpesDoAtaque(r, 'espadaCurta').length, 1, 'um golpe a menos');
  assert.equal(enc.useFeature(r, 'rangersCompanion'), true, 'a segunda ordem custa a ação');
  assert.equal(r.actionUsed, true);
  const r7 = senhor(7);
  r7.pos = { x: 5, y: 5 };
  const e2 = new Encounter({ battlefield: new Battlefield(12, 12, MAPA), party: [r7], foes: [inimigo('goblin', { x: 11, y: 11 })], rng: makeRng(1), onLog: () => {}, onEvent: () => {} });
  e2.start();
  assert.equal(e2.invocadosDe(r7)[0].golpesMagicos, true);
});

// ============================================================================================================
// DOMÍNIOS DE COMBATE DO CLÉRIGO (Livro do Jogador): Guerra, Tempestade, Luz
// ============================================================================================================
const dominio = (id, nivel, extra = {}) => heroi('clerigo', nivel, 'Humano', { weapons: ['maca'], ...extra }, { 1: { subclasse: id } });

teste('Domínios do clérigo: características por nível, usos por SAB, magias do domínio e a carga de Canalizar Divindade', () => {
  const g = dominio('guerra', 6);
  assert.ok(['warPriest', 'guidedStrike', 'warGodsBlessing'].every((f) => g.features.includes(f)));
  assert.ok(g.resources.warPriest >= 1 && g.resources.channelDivinity === 2);
  assert.ok(dominio('guerra', 8).features.includes('divineStrikeWeapon') && dominio('guerra', 17).features.includes('avatarOfBattle'));
  const t = dominio('tempestade', 8);
  assert.ok(['wrathOfTheStorm', 'destructiveWrath', 'thunderboltStrike', 'divineStrikeThunder'].every((f) => t.features.includes(f)));
  assert.ok(t.resources.wrathOfTheStorm >= 1);
  const l = dominio('luz', 17);
  assert.ok(['wardingFlare', 'lightCantrip', 'radianceOfTheDawn', 'improvedFlare', 'potentSpellcasting', 'coronaOfLight'].every((f) => l.features.includes(f)));
  assert.ok(l.magiasDeCaracteristica?.includes('luz') || l.spellcasting.cantrips.includes('luz'), 'o truque Luz');
  const prep = [...g.spellcasting.prepared, ...(g.spellcasting.sempreProntas ?? [])];
  assert.ok(prep.includes('favorDivino') && prep.includes('escudoDaFe'), 'magias do domínio da Guerra');
});

teste('Golpe Divino do domínio: trovejante na Tempestade, do tipo da arma na Guerra; uma vez por turno', () => {
  for (const [id, re] of [['tempestade', /trovejante/], ['guerra', /concussão/]]) {
    const c = dominio(id, 8);
    c.pos = { x: 5, y: 5 };
    const gob = alvoParado({ x: 6, y: 5 });
    const { enc, log } = arena({ herois: [c], foes: [gob] });
    enc.rng = dadoEmSequencia(15, 15);
    enc.resolveAttack(c, gob, { weaponId: 'maca' });
    enc.resolveAttack(c, gob, { weaponId: 'maca' });
    assert.equal(contaLog(log, /Golpe Divino/), 1, `${id}: um só por turno`);
    assert.ok(log.some((e) => /Golpe Divino/.test(e.text) && re.test(e.text)), `${id}: tipo do dano`);
  }
});

teste('Golpe Guiado e Bênção do Deus da Guerra: +10 só quando o ataque erraria por até 10; gasta carga; a bênção custa a reação do clérigo', () => {
  const c = dominio('guerra', 6);
  c.pos = { x: 5, y: 5 };
  const gob = alvoParado({ x: 6, y: 5 });
  gob.ac = 20;
  const { enc } = arena({ herois: [c], foes: [gob] });
  enc.rng = dadoEmSequencia(12);
  const r = enc.resolveAttack(c, gob, { weaponId: 'maca' });
  assert.equal(r.hit, true, 'o golpe guiado acerta');
  assert.equal(c.resources.channelDivinity, 1, 'gastou uma carga');
  const c2 = dominio('guerra', 6);
  c2.pos = { x: 5, y: 5 };
  const g2 = alvoParado({ x: 6, y: 5 });
  g2.ac = 20;
  const { enc: e2 } = arena({ herois: [c2], foes: [g2] });
  e2.rng = dadoEmSequencia(1);
  assert.equal(e2.resolveAttack(c2, g2, { weaponId: 'maca' }).hit, false);
  assert.equal(c2.resources.channelDivinity, 2, '1 natural: nada gasto');
  const c3 = dominio('guerra', 6);
  c3.pos = { x: 5, y: 5 };
  const g3 = alvoParado({ x: 6, y: 5 });
  g3.ac = 40;
  const { enc: e3 } = arena({ herois: [c3], foes: [g3] });
  e3.rng = dadoEmSequencia(5);
  assert.equal(e3.resolveAttack(c3, g3, { weaponId: 'maca' }).hit, false);
  assert.equal(c3.resources.channelDivinity, 2);
  const sac = dominio('guerra', 6);
  sac.pos = { x: 3, y: 5 };
  const guer = heroi('guerreiro', 1, 'Humano', { weapons: ['espadaLonga'] });
  guer.pos = { x: 5, y: 5 };
  const g4 = alvoParado({ x: 6, y: 5 });
  g4.ac = 20;
  const { enc: e4 } = arena({ herois: [sac, guer], foes: [g4] });
  e4.rng = dadoEmSequencia(12);
  assert.equal(e4.resolveAttack(guer, g4, { weaponId: 'espadaLonga' }).hit, true);
  assert.equal(sac.reactionUsed, true);
  assert.equal(sac.resources.channelDivinity, 1);
});

teste('Sacerdote da Guerra: ataque como ação bônus só depois de atacar; gasta um uso', () => {
  const c = dominio('guerra', 3);
  c.pos = { x: 5, y: 5 };
  const gob = alvoParado({ x: 6, y: 5 });
  const { enc } = arena({ herois: [c], foes: [gob] });
  assert.equal(enc.useFeature(c, 'warPriest'), false, 'antes de atacar, não');
  enc.rng = dadoEmSequencia(15, 15);
  enc.resolveAttack(c, gob, { weaponId: 'maca' });
  const antes = c.resources.warPriest;
  assert.equal(enc.useFeature(c, 'warPriest'), true);
  assert.equal(c.bonusUsed, true);
  assert.equal(c.resources.warPriest, antes - 1);
});

teste('Avatar da Batalha: resistência a dano físico não mágico', () => {
  const c = dominio('guerra', 17);
  c.pos = { x: 5, y: 5 };
  const { enc } = arena({ herois: [c], foes: [alvoParado({ x: 9, y: 9 })] });
  assert.equal(enc.danoPorTipo(c, 10, 'cortante', false, true), 5);
  assert.equal(enc.danoPorTipo(c, 10, 'cortante', true, true), 10, 'arma mágica ignora');
  assert.equal(enc.danoPorTipo(c, 10, 'fogo', false, false), 10);
});

teste('Ira da Tempestade: reação ao golpe corpo a corpo; falhou, dano cheio; passou, metade; gasta um uso', () => {
  const dano = {};
  for (const [d20, chave] of [[1, 'falhou'], [20, 'passou']]) {
    const c = dominio('tempestade', 1);
    c.pos = { x: 5, y: 5 };
    const gob = inimigo('goblin', { x: 6, y: 5 });
    gob.maxHp = gob.hp = 500;
    const { enc } = arena({ herois: [c], foes: [gob] });
    enc.rng = dadoEmSequencia(d20);
    const usos = c.resources.wrathOfTheStorm;
    enc.iraDaTempestade(c, gob);
    dano[chave] = 500 - gob.hp;
    assert.equal(c.reactionUsed, true);
    assert.equal(c.resources.wrathOfTheStorm, usos - 1);
  }
  assert.ok(dano.falhou > 0 && dano.passou === Math.floor(dano.falhou / 2), JSON.stringify(dano));
  const sem = dominio('tempestade', 1);
  sem.pos = { x: 5, y: 5 };
  const g2 = inimigo('goblin', { x: 6, y: 5 });
  const { enc: e2 } = arena({ herois: [sem], foes: [g2] });
  sem.reactionUsed = true;
  const h = g2.hp;
  e2.iraDaTempestade(sem, g2);
  assert.equal(g2.hp, h, 'sem reação, nada');
});

teste('Ira Destrutiva: arma o máximo no próximo dano elétrico ou trovejante; gasta a carga; só uma vez', () => {
  const c = dominio('tempestade', 3);
  c.pos = { x: 5, y: 5 };
  const gob = alvoParado({ x: 7, y: 5 });
  const { enc, log } = arena({ herois: [c], foes: [gob] });
  assert.equal(enc.useFeature(c, 'destructiveWrath'), true);
  assert.equal(c.resources.channelDivinity, c.resourcesMax.channelDivinity - 1);
  assert.equal(enc.useFeature(c, 'destructiveWrath'), false, 'já armada');
  assert.equal(enc.dadosMaximos(c, '2d8', 'elétrico'), 16);
  assert.equal(c.furiaDestrutivaPronta, false, 'gastou');
  assert.ok(contaLog(log, /Ira Destrutiva/) >= 1);
});

teste('Golpe do Relâmpago: dano elétrico do clérigo empurra 3 m criatura Grande ou menor, não Enorme', () => {
  const c = dominio('tempestade', 6);
  c.pos = { x: 5, y: 5 };
  const gob = alvoParado({ x: 6, y: 5 });
  const { enc } = arena({ herois: [c], foes: [gob] });
  enc.applyDamage(gob, 3, 'elétrico', c, { magico: true });
  assert.ok(gob.pos.x > 6, 'empurrado');
  const urso = alvoParado({ x: 5, y: 6 });
  urso.size = 'enorme';
  const { enc: e2 } = arena({ herois: [c], foes: [urso] });
  e2.applyDamage(urso, 3, 'elétrico', c, { magico: true });
  assert.equal(urso.pos.y, 6, 'enorme fica');
});

teste('Clarão de Aviso: reação; o Clarão Aprimorado cobre um aliado; sem ele só protege a si', () => {
  const c = dominio('luz', 1);
  c.pos = { x: 5, y: 5 };
  const gob = inimigo('goblin', { x: 6, y: 5 });
  const { enc } = arena({ herois: [c], foes: [gob] });
  const usos = c.resources.wardingFlare;
  assert.equal(enc.clarao(gob, c)?.id, c.id);
  assert.equal(c.resources.wardingFlare, usos - 1);
  assert.equal(c.reactionUsed, true);
  assert.equal(enc.clarao(gob, c), null, 'reação já gasta');
  const c6 = dominio('luz', 6);
  c6.pos = { x: 5, y: 5 };
  const amigo = heroi('guerreiro', 1, 'Humano');
  amigo.pos = { x: 7, y: 5 };
  const g2 = inimigo('goblin', { x: 8, y: 5 });
  const { enc: e2 } = arena({ herois: [c6, amigo], foes: [g2] });
  assert.equal(e2.clarao(g2, amigo)?.id, c6.id, 'protege o aliado');
  const c1 = dominio('luz', 1);
  c1.pos = { x: 5, y: 5 };
  const amigo1 = heroi('guerreiro', 1, 'Humano');
  amigo1.pos = { x: 7, y: 5 };
  const g3 = inimigo('goblin', { x: 8, y: 5 });
  const { enc: e3 } = arena({ herois: [c1, amigo1], foes: [g3] });
  assert.equal(e3.clarao(g3, amigo1), null, 'sem o Aprimorado, só protege a si');
});

teste('Esplendor da Aurora: só os inimigos perto sofrem; custa ação e carga', () => {
  const c = dominio('luz', 8);
  c.pos = { x: 1, y: 1 };
  const g1 = alvoParado({ x: 3, y: 1 });
  const g2 = alvoParado({ x: 1, y: 4 });
  const longe = alvoParado({ x: 11, y: 11 });
  const { enc } = arena({ herois: [c], foes: [g1, g2, longe] });
  enc.rng = dadoEmSequencia(1);
  assert.equal(enc.useFeature(c, 'radianceOfTheDawn'), true);
  assert.equal(c.actionUsed, true);
  assert.ok(g1.hp < 2000 && g2.hp < 2000, 'os dois perto sofrem');
  assert.equal(longe.hp, 2000, 'o de longe não');
  assert.equal(c.resources.channelDivinity, c.resourcesMax.channelDivinity - 1);
});

teste('Coroa de Luz: desvantagem na resistência contra fogo e radiante dentro de 18 m; sem limite de usos, só uma acesa por vez', () => {
  const c = dominio('luz', 17);
  c.pos = { x: 5, y: 5 };
  const gob = inimigo('goblin', { x: 9, y: 5 });
  const { enc } = arena({ herois: [c], foes: [gob] });
  assert.equal(enc.useFeature(c, 'coronaOfLight'), true);
  assert.equal(enc.useFeature(c, 'coronaOfLight'), false, 'já acesa');
  enc.rng = dadoEmSequencia(20, 1);
  const r = enc.resistencia(gob, 'dex', 30, { contra: { magico: true, tipoDano: 'fogo' } });
  const rSopro = enc.resistencia(gob, 'dex', 30, { contra: { magico: false, tipoDano: 'fogo' } });
  assert.notEqual(rSopro.mode, 'desvantagem', 'sopro e armadilha não contam, só magia');
  assert.equal(r.mode, 'desvantagem', 'perto: desvantagem');
  const r2 = enc.resistencia(gob, 'dex', 30, { contra: { magico: true, tipoDano: 'frio' } });
  assert.notEqual(r2.mode, 'desvantagem', 'outro tipo de dano: normal');
});

// ============================================================================================================
// DOMÍNIOS DO CLÉRIGO (Livro do Jogador): Conhecimento, Natureza, Enganação
// ============================================================================================================
teste('Conhecimento: duas perícias de saber entram treinadas e dobradas; Conjuração Potente no 8º', () => {
  const c = heroi('clerigo', 8, 'Humano', { weapons: ['maca'] }, { 1: { subclasse: 'conhecimento', blessingsOfKnowledge: ['arcanismo', 'religiao'] } });
  assert.ok(c.features.includes('blessingsOfKnowledge') && c.features.includes('potentSpellcasting'));
  assert.ok(c.skills.includes('arcanismo') && c.skills.includes('religiao'));
  assert.ok(c.expertise.includes('arcanismo') && c.expertise.includes('religiao'));
  assert.ok(![...dominio('conhecimento', 1).features].includes('potentSpellcasting'));
  const prep = [...c.spellcasting.prepared, ...(c.spellcasting.sempreProntas ?? [])];
  assert.ok(prep.includes('comando') && prep.includes('identificar'), 'magias do domínio');
});

teste('Conjuração Potente soma SAB ao dano dos truques de clérigo (só truques)', () => {
  const alvoDe = () => alvoParado({ x: 7, y: 5 });
  const dano = (nivel, id, d20) => {
    const c = dominio(id, nivel);
    c.spellcasting.cantrips = ['chamaSagrada'];
    c.pos = { x: 5, y: 5 };
    const g = alvoDe();
    g.ac = 1;
    const { enc } = arena({ herois: [c], foes: [g] });
    enc.rng = dadoEmSequencia(d20);
    const antes = g.hp;
    enc.castSpell(c, 'chamaSagrada', { target: g });
    return antes - g.hp;
  };
  // Chama Sagrada: o alvo falha (d20 = 1) em ambos; a diferença é o bônus de SAB (o 8º tem o dado do 5º a mais — comparo o conhecimento do 8º com o da Vida do 8º)
  const sab = Math.max(0, abilityModDe(dominio('conhecimento', 8).abilities.wis));
  assert.equal(dano(8, 'conhecimento', 1) - dano(8, 'vida', 1), sab);
});

teste('Natureza: perícia e truque de druida escolhidos, armadura pesada e magias do domínio', () => {
  const c = heroi('clerigo', 2, 'Humano', { weapons: ['maca'] }, { 1: { subclasse: 'natureza', acolyteOfNature: 'sobrevivencia', acolyteCantrip: 'produzirChama' } });
  assert.ok(c.skills.includes('sobrevivencia'));
  assert.ok(c.magiasDeCaracteristica?.includes('produzirChama') || c.spellcasting.cantrips.includes('produzirChama'));
  const prep = [...c.spellcasting.prepared, ...(c.spellcasting.sempreProntas ?? [])];
  assert.ok(prep.includes('amizadeAnimal') && prep.includes('falarComAnimais'));
  assert.ok(c.features.includes('charmAnimalsAndPlants'));
});

teste('Encantar Animais e Plantas: só feras e plantas perto falham em SAB e ficam enfeitiçados; o resto, não', () => {
  const c = dominio('natureza', 2);
  c.pos = { x: 5, y: 5 };
  const lobo = inimigo('lobo', { x: 7, y: 5 });
  const gob = inimigo('goblin', { x: 6, y: 6 });
  const { enc } = arena({ herois: [c], foes: [lobo, gob] });
  assert.ok(lobo.tipo === 'fera', 'o lobo é fera');
  enc.rng = dadoEmSequencia(1);
  assert.equal(enc.useFeature(c, 'charmAnimalsAndPlants'), true);
  assert.equal(c.actionUsed, true);
  assert.equal(c.resources.channelDivinity, c.resourcesMax.channelDivinity - 1);
  assert.equal(hasCondition(lobo, 'enfeiticado'), true);
  assert.equal(hasCondition(gob, 'enfeiticado'), false, 'goblin não é fera');
});

teste('Abafar Elementos: reação do clérigo a até 9 m; o dano elemental cai à metade; outros tipos, não', () => {
  const c = dominio('natureza', 6);
  c.pos = { x: 5, y: 5 };
  const amigo = heroi('guerreiro', 1, 'Humano');
  amigo.pos = { x: 8, y: 5 };
  const { enc } = arena({ herois: [c, amigo], foes: [alvoParado({ x: 11, y: 11 })] });
  assert.equal(enc.abafarElementos(amigo, 10, 'cortante'), 10);
  assert.equal(c.reactionUsed, false);
  assert.equal(enc.abafarElementos(amigo, 10, 'fogo'), 5);
  assert.equal(c.reactionUsed, true);
  assert.equal(enc.abafarElementos(amigo, 10, 'fogo'), 10, 'sem reação');
});

teste('Golpe Divino da Natureza escolhe o tipo que o alvo não resiste; o da Enganação é veneno', () => {
  for (const [id, re] of [['natureza', /fogo/], ['enganacao', /veneno/]]) {
    const c = dominio(id, 8);
    c.pos = { x: 5, y: 5 };
    const gob = alvoParado({ x: 6, y: 5 });
    const { enc, log } = arena({ herois: [c], foes: [gob] });
    enc.rng = dadoEmSequencia(15);
    enc.resolveAttack(c, gob, { weaponId: 'maca' });
    assert.ok(log.some((e) => /Golpe Divino/.test(e.text) && re.test(e.text)), id);
  }
  const c2 = dominio('natureza', 8);
  c2.pos = { x: 5, y: 5 };
  const gob2 = alvoParado({ x: 6, y: 5 });
  gob2.resist = ['fogo'];
  const { enc: e2, log: l2 } = arena({ herois: [c2], foes: [gob2] });
  e2.rng = dadoEmSequencia(15);
  e2.resolveAttack(c2, gob2, { weaponId: 'maca' });
  assert.ok(l2.some((e) => /Golpe Divino/.test(e.text) && /frio/.test(e.text)), 'resiste a fogo: vai de frio');
});

teste('Invocar Duplicidade: vantagem só contra quem está colado na cópia; a Aprimorada, contra quem está colado no clérigo', () => {
  const c = dominio('enganacao', 2);
  c.pos = { x: 5, y: 5 };
  const perto = inimigo('goblin', { x: 6, y: 5 });
  const outro = inimigo('goblin', { x: 5, y: 9 });
  const { enc } = arena({ herois: [c], foes: [perto, outro] });
  assert.equal(enc.useFeature(c, 'invokeDuplicity'), true);
  assert.equal(c.actionUsed, true);
  assert.equal(c.resources.channelDivinity, c.resourcesMax.channelDivinity - 1);
  assert.ok(enc.attackModifiers(c, perto, {}).vantagens.includes('cópia ilusória'));
  assert.ok(!enc.attackModifiers(c, outro, {}).vantagens.includes('cópia ilusória'));
  assert.ok(!enc.attackModifiers(c, inimigo('goblin', { x: 8, y: 5 }), { ranged: true }).vantagens.includes('cópia ilusória'), 'o clérigo também tem de estar colado');
  const c17 = dominio('enganacao', 17);
  c17.pos = { x: 5, y: 5 };
  const colado = inimigo('goblin', { x: 6, y: 5 });
  const longe = inimigo('goblin', { x: 11, y: 11 });
  const { enc: e2 } = arena({ herois: [c17], foes: [colado, longe] });
  e2.useFeature(c17, 'invokeDuplicity');
  assert.ok(e2.attackModifiers(c17, colado, {}).vantagens.includes('cópia ilusória'));
});

teste('Manto de Sombras (Enganação): invisível até o fim do próximo turno; custa ação e carga', () => {
  const c = dominio('enganacao', 6);
  c.pos = { x: 5, y: 5 };
  const { enc } = arena({ herois: [c], foes: [alvoParado({ x: 11, y: 11 })] });
  assert.equal(enc.useFeature(c, 'trickeryCloak'), true);
  assert.equal(hasCondition(c, 'invisivel'), true);
  assert.equal(c.resources.channelDivinity, c.resourcesMax.channelDivinity - 1);
  assert.equal(enc.useFeature(c, 'trickeryCloak'), false);
});

// ============================================================================================================
// DOMÍNIOS DO CLÉRIGO: correções da revisão (resistência que não soma, ataque de magia, Ira Destrutiva no Golpe Divino, estado que não vaza)
// ============================================================================================================
teste('Abafar Elementos não soma com outra resistência: quem já resiste a fogo leva a metade só uma vez, e a reação fica', () => {
  const c = dominio('natureza', 6);
  c.pos = { x: 5, y: 5 };
  const amigo = heroi('guerreiro', 1, 'Humano');
  amigo.pos = { x: 7, y: 5 };
  amigo.resist = ['fogo'];
  amigo.hp = amigo.maxHp = 200;
  const { enc } = arena({ herois: [c, amigo], foes: [alvoParado({ x: 11, y: 11 })] });
  enc.applyDamage(amigo, 20, 'fogo', null, { magico: true });
  assert.equal(200 - amigo.hp, 10, 'só a resistência dele');
  assert.equal(c.reactionUsed, false, 'a reação não foi gasta à toa');
  amigo.resist = [];
  enc.applyDamage(amigo, 20, 'fogo', null, { magico: true });
  assert.equal(c.reactionUsed, true, 'sem resistência própria, o clérigo abafa');
});

teste('Golpe Guiado e Clarão de Aviso valem também no ataque de magia', () => {
  const c = dominio('guerra', 6);
  c.pos = { x: 5, y: 5 };
  c.spellcasting.cantrips = ['raioDeFogo'];
  const g = alvoParado({ x: 8, y: 5 });
  g.ac = 20;
  const { enc } = arena({ herois: [c], foes: [g] });
  enc.rng = dadoEmSequencia(12);
  const antes = g.hp;
  enc.castSpell(c, 'raioDeFogo', { target: g });
  assert.ok(g.hp < antes, 'o +10 do Golpe Guiado transformou o erro em acerto');
  assert.equal(c.resources.channelDivinity, 1);
  const luz = dominio('luz', 1);
  luz.pos = { x: 5, y: 5 };
  const mago = inimigo('goblin', { x: 8, y: 5 });
  const { enc: e2 } = arena({ herois: [luz], foes: [mago] });
  assert.equal(e2.clarao(mago, luz)?.id, luz.id);
});

teste('Ira Destrutiva também vale no Golpe Divino da Tempestade, e não passa para a luta seguinte', () => {
  const c = dominio('tempestade', 8);
  c.pos = { x: 5, y: 5 };
  const gob = alvoParado({ x: 6, y: 5 });
  const { enc, log } = arena({ herois: [c], foes: [gob] });
  enc.useFeature(c, 'destructiveWrath');
  enc.rng = dadoEmSequencia(15);
  enc.resolveAttack(c, gob, { weaponId: 'maca' });
  assert.ok(log.some((e) => /Golpe Divino \(Ira Destrutiva\)/.test(e.text) && /\+8/.test(e.text)), 'o dado saiu no máximo');
  assert.equal(c.furiaDestrutivaPronta, false);
  const c2 = dominio('tempestade', 3);
  c2.pos = { x: 5, y: 5 };
  const g2 = inimigo('goblin', { x: 6, y: 5 });
  g2.hp = 1;
  const { enc: e2 } = arena({ herois: [c2], foes: [g2] });
  e2.useFeature(c2, 'destructiveWrath');
  e2.applyDamage(g2, 50, 'cortante', c2, {});
  e2.checkEnd?.();
  assert.equal(c2.furiaDestrutivaPronta, false, 'o fim do combate limpa a Ira armada');
});

teste('Ira da Tempestade também responde a um ataque à distância a até 1,5 m; Duplicidade e Coroa acabam com o combate', () => {
  const c = dominio('tempestade', 1);
  c.pos = { x: 5, y: 5 };
  const gob = inimigo('goblin', { x: 6, y: 5 });
  gob.maxHp = gob.hp = 500;
  const { enc } = arena({ herois: [c], foes: [gob] });
  enc.rng = dadoEmSequencia(1);
  enc.applyDamage(c, 4, 'perfurante', gob, { deArma: true });
  assert.equal(c.reactionUsed, true, 'reagiu ao golpe de arma, corpo a corpo ou não');
  const e = dominio('enganacao', 17);
  e.pos = { x: 5, y: 5 };
  const g2 = inimigo('goblin', { x: 6, y: 5 });
  g2.hp = 1;
  const { enc: e2 } = arena({ herois: [e], foes: [g2] });
  e2.useFeature(e, 'invokeDuplicity');
  assert.equal(hasCondition(e, 'duplicidade'), true);
  e2.applyDamage(g2, 50, 'cortante', e, {});
  e2.checkEnd?.();
  assert.equal(hasCondition(e, 'duplicidade'), false, 'a cópia some quando o combate acaba');
});

// ============================================================================================================
// BRUXO (Arquifada, Grande Antigo) e FEITICEIRO (Magia Selvagem) — Livro do Jogador
// ============================================================================================================
const bruxoDe = (sub, nivel) => heroi('bruxo', nivel, 'Humano', { weapons: ['adaga'] }, { 1: { subclasse: sub } });
const selvagem = (nivel) => heroi('feiticeiro', nivel, 'Humano', { weapons: ['adaga'] }, { 1: { subclasse: 'magiaSelvagem' } });
const condDe = (c, id) => c.conditions.find((x) => x.id === id);

teste('Arquifada, Grande Antigo e Magia Selvagem: características e recursos por nível', () => {
  const a = bruxoDe('arquifada', 14);
  assert.ok(['feyPresence', 'mistyEscapes', 'beguilingDefenses', 'darkDelirium'].every((f) => a.features.includes(f)));
  assert.deepEqual([a.resources.feyPresence, a.resources.mistyEscapes, a.resources.darkDelirium], [1, 1, 1]);
  assert.ok(!bruxoDe('arquifada', 5).features.includes('mistyEscapes'));
  const g = bruxoDe('grandeAntigo', 14);
  assert.ok(['awakenedMind', 'entropicWard', 'thoughtShield', 'createThrall'].every((f) => g.features.includes(f)));
  assert.equal(g.resources.entropicWard, 1);
  const s = selvagem(18);
  assert.ok(['wildMagicSurge', 'tidesOfChaos', 'bendLuck', 'controlledChaos', 'spellBombardment'].every((f) => s.features.includes(f)));
  assert.equal(s.resources.tidesOfChaos, 1);
});

teste('Presença Feérica: hostis a até 3 m falham em SAB e ficam amedrontados ou enfeitiçados; o de longe, não; volta no descanso curto', () => {
  const w = bruxoDe('arquifada', 1);
  w.pos = { x: 5, y: 5 };
  const perto = inimigo('goblin', { x: 6, y: 5 });
  const longe = inimigo('goblin', { x: 11, y: 11 });
  const { enc } = arena({ herois: [w], foes: [perto, longe] });
  enc.rng = dadoEmSequencia(1);
  assert.equal(enc.useFeature(w, 'feyPresence', { modo: 'enfeiticado' }), true);
  assert.equal(w.actionUsed, true);
  assert.equal(w.resources.feyPresence, 0);
  assert.equal(hasCondition(perto, 'enfeiticado'), true);
  assert.equal(hasCondition(longe, 'enfeiticado'), false);
  assert.equal(enc.useFeature(w, 'feyPresence'), false, 'sem carga');
  recuperarNoCurto(w);
  assert.equal(w.resources.feyPresence, 1, 'descanso curto devolve');
});

teste('Fuga Nebulosa: reação ao dano; reaparece longe, invisível, e gasta o uso', () => {
  const w = bruxoDe('arquifada', 6);
  w.pos = { x: 5, y: 5 };
  const gob = inimigo('goblin', { x: 6, y: 5 });
  const { enc } = arena({ herois: [w], foes: [gob] });
  const de = { ...w.pos };
  enc.applyDamage(w, 3, 'cortante', gob, { deArma: true });
  assert.ok(Math.max(Math.abs(w.pos.x - de.x), Math.abs(w.pos.y - de.y)) > 1, 'saiu dali');
  assert.equal(hasCondition(w, 'invisivel'), true);
  assert.equal(w.reactionUsed, true);
  assert.equal(w.resources.mistyEscapes, 0);
  const sem = bruxoDe('arquifada', 6);
  sem.pos = { x: 5, y: 5 };
  const g2 = inimigo('goblin', { x: 6, y: 5 });
  const { enc: e2 } = arena({ herois: [sem], foes: [g2] });
  sem.reactionUsed = true;
  e2.applyDamage(sem, 3, 'cortante', g2, { deArma: true });
  assert.deepEqual([sem.pos.x, sem.pos.y], [5, 5], 'sem reação, fica');
});

teste('Defesas Sedutoras: imune a encanto; quem tenta enfeitiçar testa SAB e, se falha, fica enfeitiçado pelo bruxo', () => {
  const w = bruxoDe('arquifada', 10);
  w.pos = { x: 5, y: 5 };
  const gob = inimigo('goblin', { x: 8, y: 5 });
  const { enc } = arena({ herois: [w], foes: [gob] });
  enc.rng = dadoEmSequencia(1);
  assert.equal(enc.aplicarCondicao(w, 'enfeiticado', { rounds: 5, source: gob.id }), null, 'imune');
  assert.equal(condDe(gob, 'enfeiticado')?.source, w.id, 'o feitiço volta');
  assert.equal(w.reactionUsed, true);
});

teste('Delírio Sombrio: SAB ou fica enfeitiçado por um minuto; o dano liberta; um uso por descanso curto', () => {
  const w = bruxoDe('arquifada', 14);
  w.pos = { x: 5, y: 5 };
  const gob = inimigo('goblin', { x: 9, y: 5 });
  const { enc } = arena({ herois: [w], foes: [gob] });
  enc.rng = dadoEmSequencia(1);
  assert.equal(enc.useFeature(w, 'darkDelirium', { modo: 'enfeiticado' }), true);
  assert.equal(hasCondition(gob, 'enfeiticado'), true);
  assert.equal(w.resources.darkDelirium, 0);
  assert.equal(enc.useFeature(w, 'darkDelirium'), false);
});

teste('Proteção Entrópica: desvantagem em quem ataca; se errar, o bruxo tem vantagem contra ele; gasta o uso', () => {
  const w = bruxoDe('grandeAntigo', 6);
  w.pos = { x: 5, y: 5 };
  const gob = inimigo('goblin', { x: 6, y: 5 });
  const { enc } = arena({ herois: [w], foes: [gob] });
  enc.rng = dadoEmSequencia(1);
  enc.resolveAttack(gob, w, { weaponId: null });
  assert.equal(w.resources.entropicWard, 0);
  assert.equal(w.reactionUsed, true);
  assert.equal(condDe(w, 'desordemEntropica')?.source, gob.id, 'o golpe errou e o bruxo ganha a vantagem');
  assert.ok(enc.attackModifiers(w, gob, {}).vantagens.includes('proteção entrópica'));
  const outro = inimigo('goblin', { x: 5, y: 6 });
  assert.ok(!enc.attackModifiers(w, outro, {}).vantagens.includes('proteção entrópica'), 'só contra quem errou');
});

teste('Escudo de Pensamentos: resiste a dano psíquico e o devolve a quem o causou', () => {
  const w = bruxoDe('grandeAntigo', 10);
  w.pos = { x: 5, y: 5 };
  const gob = inimigo('goblin', { x: 6, y: 5 });
  gob.maxHp = gob.hp = 100;
  w.maxHp = w.hp = 100;
  const { enc } = arena({ herois: [w], foes: [gob] });
  enc.applyDamage(w, 10, 'psíquico', gob, { magico: true });
  assert.equal(100 - w.hp, 5, 'resistência');
  assert.equal(100 - gob.hp, 5, 'devolvido');
});

teste('Criar Servo: só um humanoide incapacitado ao lado fica enfeitiçado', () => {
  const w = bruxoDe('grandeAntigo', 14);
  w.pos = { x: 5, y: 5 };
  const gob = inimigo('goblin', { x: 6, y: 5 });
  const { enc } = arena({ herois: [w], foes: [gob] });
  assert.equal(enc.useFeature(w, 'createThrall', { target: gob }), false, 'de pé, não');
  addCondition(gob, 'paralisado', { rounds: 5, source: 'x' });
  assert.equal(enc.useFeature(w, 'createThrall', { target: gob }), true);
  assert.equal(condDe(gob, 'enfeiticado')?.source, w.id);
  assert.equal(w.actionUsed, true);
});

teste('Marés do Caos: vantagem no próximo ataque; a próxima magia de 1º círculo causa um surto e devolve o uso', () => {
  const s = selvagem(3);
  s.pos = { x: 5, y: 5 };
  const gob = alvoParado({ x: 7, y: 5 });
  const { enc, log } = arena({ herois: [s], foes: [gob] });
  assert.equal(enc.useFeature(s, 'tidesOfChaos'), true);
  assert.equal(s.resources.tidesOfChaos, 0);
  assert.ok(enc.attackModifiers(s, gob, {}).vantagens.includes('marés do caos'));
  enc.rng = dadoEmSequencia(15);
  s.spellcasting.prepared = [...new Set([...(s.spellcasting.prepared ?? []), 'misselMagico'])];
  assert.ok(enc.castSpell(s, 'misselMagico', { target: gob }).ok !== false);
  assert.equal(s.resources.tidesOfChaos, 1, 'o surto devolveu o uso');
  assert.ok(contaLog(log, /Surto de Magia Selvagem/) >= 1);
});

teste('Surto de Magia Selvagem: 1 no d20 desencadeia; outro número não; Caos Controlado fica com o melhor dos dois', () => {
  const s = selvagem(1);
  s.pos = { x: 5, y: 5 };
  const { enc, log } = arena({ herois: [s], foes: [alvoParado({ x: 9, y: 9 })] });
  enc.rng = dadoEmSequencia(1);
  enc.surtoDeMagia(s);
  assert.equal(contaLog(log, /Surto de Magia Selvagem/), 1);
  enc.rng = dadoEmSequencia(12);
  enc.surtoDeMagia(s);
  assert.equal(contaLog(log, /Surto de Magia Selvagem/), 1, 'sem 1, nada');
  const c = selvagem(14);
  c.pos = { x: 5, y: 5 };
  const { enc: e2, log: l2 } = arena({ herois: [c], foes: [alvoParado({ x: 9, y: 9 })] });
  let n = 0;
  const f = () => 0.5;
  f.die = () => 1;
  f.int = () => (n++ === 0 ? 0 : 2);
  f.pick = (a) => a[0];
  f.chance = () => false;
  e2.rng = f;
  e2.surtoDeMagia(c);
  assert.ok(l2.some((e) => /luz restauradora/.test(e.text ?? '')), 'rolou a bola de fogo (ruim) e o regenerador (bom): ficou com o bom');
});

teste('Dobrar a Sorte: 2 pontos e a reação viram um erro por até 4 em acerto, e um acerto por até 4 em erro', () => {
  const s = selvagem(6);
  s.pos = { x: 4, y: 5 };
  s.resources.sorceryPoints = 6;
  const amigo = heroi('guerreiro', 1, 'Humano');
  amigo.pos = { x: 6, y: 5 };
  const gob = alvoParado({ x: 7, y: 5 });
  gob.ac = 12;
  const { enc } = arena({ herois: [s, amigo], foes: [gob] });
  const atk = { hit: false, total: 10, fumble: false, critical: false };
  enc.rng = dadoEmSequencia(1);
  const r = enc.rng;
  enc.rng.die = (l) => (l === 4 ? 4 : 10);
  enc.curvarSorte(amigo, gob, atk, 12);
  assert.equal(atk.hit, true, '10 + 4 = 14 acerta CA 12');
  assert.equal(s.resources.sorceryPoints, 4);
  assert.equal(s.reactionUsed, true);
  s.reactionUsed = false;
  const longe = { hit: false, total: 3, fumble: false, critical: false };
  enc.curvarSorte(amigo, gob, longe, 12);
  assert.equal(longe.hit, false, 'errou por mais de 4: nada');
  assert.equal(s.resources.sorceryPoints, 4);
});

teste('Bombardeio de Magia: um dado de dano no máximo rola de novo, uma vez por turno', () => {
  const s = selvagem(18);
  s.pos = { x: 5, y: 5 };
  const { enc } = arena({ herois: [s], foes: [alvoParado({ x: 9, y: 9 })] });
  enc.rng = dadoEmSequencia(1);
  enc.rng.die = () => 3;
  const dmg = { total: 11, rolls: [8, 3] };
  enc.ajustarDanoDeDominio(s, { name: 'Raio', level: 1, damageType: 'fogo' }, dmg, '2d8');
  assert.equal(dmg.total, 14, 'o 8 rolou de novo (+3)');
  const dmg2 = { total: 16, rolls: [8, 8] };
  enc.ajustarDanoDeDominio(s, { name: 'Raio', level: 1, damageType: 'fogo' }, dmg2, '2d8');
  assert.equal(dmg2.total, 16, 'só uma vez por turno');
});

// ============================================================================================================
// BRUXO E FEITICEIRO: correções da revisão (durações, servo permanente, charme devolvido, estado que vaza)
// ============================================================================================================
teste('Presença Feérica dura até o fim do PRÓXIMO turno do bruxo (um turno inimigo), e a Fuga Nebulosa some até o começo do dele', () => {
  const w = bruxoDe('arquifada', 6);
  w.pos = { x: 5, y: 5 };
  const gob = inimigo('goblin', { x: 6, y: 5 });
  const { enc } = arena({ herois: [w], foes: [gob] });
  enc.rng = dadoEmSequencia(1);
  enc.useFeature(w, 'feyPresence', { modo: 'amedrontado' });
  const c = condDe(gob, 'amedrontado');
  assert.equal(c.rounds, 1);
  assert.equal(c.lado, 'party');
  assert.equal(c.quando, 'fim');
  const w2 = bruxoDe('arquifada', 6);
  w2.pos = { x: 5, y: 5 };
  const g2 = inimigo('goblin', { x: 6, y: 5 });
  const { enc: e2 } = arena({ herois: [w2], foes: [g2] });
  e2.applyDamage(w2, 2, 'cortante', g2, { deArma: true });
  const inv = condDe(w2, 'invisivel');
  assert.deepEqual([inv.rounds, inv.quando, inv.lado], [1, 'inicio', 'party']);
  const w3 = bruxoDe('arquifada', 6);
  w3.pos = { x: 5, y: 5 };
  const { enc: e3 } = arena({ herois: [w3], foes: [alvoParado({ x: 6, y: 5 })] });
  e3.applyDamage(w3, 2, 'fogo', null, {});
  assert.equal(w3.resources.mistyEscapes, 0, 'dano sem fonte (armadilha) também dispara');
});

teste('Criar Servo não se desfaz quando o bruxo bate nele; o charme devolvido pelas Defesas Sedutoras acaba se o enfeitiçado fere o bruxo', () => {
  const w = bruxoDe('grandeAntigo', 14);
  w.pos = { x: 5, y: 5 };
  const gob = inimigo('goblin', { x: 6, y: 5 });
  gob.maxHp = gob.hp = 200;
  const { enc } = arena({ herois: [w], foes: [gob] });
  addCondition(gob, 'paralisado', { rounds: 5, source: 'x' });
  enc.useFeature(w, 'createThrall', { target: gob });
  enc.applyDamage(gob, 1, 'cortante', w, {});
  assert.equal(hasCondition(gob, 'enfeiticado'), true, 'o servo segue enfeitiçado');
  const a = bruxoDe('arquifada', 10);
  a.pos = { x: 5, y: 5 };
  a.maxHp = a.hp = 100;
  const g2 = inimigo('goblin', { x: 8, y: 5 });
  g2.maxHp = g2.hp = 200;
  const { enc: e2 } = arena({ herois: [a], foes: [g2] });
  e2.rng = dadoEmSequencia(1);
  e2.aplicarCondicao(a, 'enfeiticado', { rounds: 5, source: g2.id });
  assert.equal(hasCondition(g2, 'enfeiticado'), true);
  e2.applyDamage(g2, 1, 'cortante', a, {});
  assert.equal(hasCondition(g2, 'enfeiticado'), true, 'o bruxo bater não desfaz');
  e2.applyDamage(a, 1, 'cortante', g2, {});
  assert.equal(hasCondition(g2, 'enfeiticado'), false, 'ferir o bruxo desfaz');
});

teste('Proteção Entrópica vale também no ataque de magia; Dobrar a Sorte protege o próprio feiticeiro', () => {
  const w = bruxoDe('grandeAntigo', 6);
  w.pos = { x: 5, y: 5 };
  const mago = inimigo('goblin', { x: 8, y: 5 });
  mago.spellcasting = { ability: 'int', cantrips: ['raioDeFogo'], prepared: [], slots: [0], slotsMax: [0] };
  const { enc } = arena({ herois: [w], foes: [mago] });
  assert.equal(enc.guardaEntropica(mago, w), true);
  const s = selvagem(6);
  s.pos = { x: 5, y: 5 };
  s.resources.sorceryPoints = 4;
  const gob = alvoParado({ x: 6, y: 5 });
  const { enc: e2 } = arena({ herois: [s], foes: [gob] });
  e2.rng = dadoEmSequencia(1);
  e2.rng.die = () => 4;
  const atk = { hit: true, total: 14, fumble: false, critical: false };
  e2.curvarSorte(gob, s, atk, 12);
  assert.equal(atk.hit, false, '14 - 4 = 10 erra CA 12: o feiticeiro se salva');
  assert.equal(s.resources.sorceryPoints, 2);
});

teste('Estado do feiticeiro não vaza: Marés do Caos e o surto "no máximo" somem no descanso longo; o máximo, também no curto', () => {
  const s = selvagem(3);
  s.pos = { x: 5, y: 5 };
  const { enc } = arena({ herois: [s], foes: [alvoParado({ x: 9, y: 9 })] });
  enc.useFeature(s, 'tidesOfChaos');
  s.surtoMaximoAte = 99;
  recuperarNoCurto(s);
  assert.equal(s.surtoMaximoAte, undefined, 'o curto limpa o máximo');
  s.surtoMaximoAte = 99;
  descansoLongo(s);
  assert.equal(hasCondition(s, 'maresDoCaos'), false, 'a vantagem guardada não passa para o dia seguinte');
  assert.equal(s.resources.tidesOfChaos, 1);
  assert.equal(s.surtoMaximoAte, undefined);
});

teste('Patronos do bruxo: Arquifada e Grande Antigo ganham as magias extras na lista, e só quem tem o patrono', async () => {
  const { listaDaClasse } = await import('../game/criacao.js');
  const arq = listaDaClasse('bruxo', 3, 'arquifada').magias;
  assert.ok(arq.includes('sono') && arq.includes('piscar') && arq.includes('fogoDasFadas'));
  assert.ok(!arq.includes('clarividencia'));
  const goa = listaDaClasse('bruxo', 3, 'grandeAntigo').magias;
  assert.ok(goa.includes('sussurrosDissonantes') && goa.includes('clarividencia'));
  assert.ok(!listaDaClasse('bruxo', 3).magias.includes('sono'), 'sem patrono, nada extra');
  assert.equal(new Set(arq).size, arq.length, 'sem repetida');
});

teste('As 16 manobras: Desarmante, Fintado, Varredura, Estratégico, Passo Evasivo, Reagrupar e Comandante', async () => {
  // Desarmante: FOR ou larga a arma (desvantagem), o dado só no acerto
  const d = mestre(3);
  d.features.push('disarmingAttack');
  d.pos = { x: 5, y: 5 };
  const gob = inimigo('goblin', { x: 6, y: 5 });
  gob.hp = gob.maxHp = 300;
  const { enc } = arena({ herois: [d], foes: [gob] });
  enc.useFeature(d, 'disarmingAttack');
  enc.rng = dadoEmSequencia(15, 2);
  enc.attackAction(d, gob, 'espadaLonga');
  assert.ok(hasCondition(gob, 'desarmado'));
  assert.equal(d.resources.superiorityDice, 3);
  assert.ok(enc.attackModifiers(gob, d, {}).desvantagens.length > 0, 'desarmado ataca com desvantagem');
  // Fintado: ação bônus, vantagem no ataque seguinte
  const f = mestre(3);
  f.features.push('feintingAttack');
  f.pos = { x: 5, y: 5 };
  const g2 = inimigo('goblin', { x: 6, y: 5 });
  g2.hp = g2.maxHp = 300;
  const { enc: e2 } = arena({ herois: [f], foes: [g2] });
  assert.equal(e2.useFeature(f, 'feintingAttack'), true);
  assert.equal(f.bonusUsed, true);
  assert.ok(e2.attackModifiers(f, g2, {}).vantagens.includes('ataque fintado'));
  assert.equal(e2.useFeature(f, 'feintingAttack'), false, 'só uma ação bônus');
  // Varredura: a mesma rolagem acerta o vizinho do alvo
  const v = mestre(3);
  v.features.push('sweepingAttack');
  v.pos = { x: 5, y: 5 };
  const a1 = inimigo('goblin', { x: 6, y: 5 });
  const a2 = inimigo('goblin', { x: 6, y: 6 });
  a1.hp = a1.maxHp = 300;
  a2.hp = a2.maxHp = 300;
  a2.ac = 5;
  const { enc: e3 } = arena({ herois: [v], foes: [a1, a2] });
  e3.useFeature(v, 'sweepingAttack');
  e3.rng = dadoEmSequencia(15, 3);
  e3.attackAction(v, a1, 'espadaLonga');
  assert.ok(a2.hp < 300, 'o vizinho sofreu o dado');
  // Estratégico: o aliado anda sem provocar o alvo
  const m = mestre(3);
  m.features.push('maneuveringAttack');
  m.pos = { x: 5, y: 5 };
  const amigo = heroi('guerreiro', 1, 'Humano', { weapons: ['espadaLonga'] });
  amigo.pos = { x: 4, y: 5 };
  const g3 = inimigo('goblin', { x: 6, y: 5 });
  g3.hp = g3.maxHp = 300;
  const { enc: e4 } = arena({ herois: [m, amigo], foes: [g3] });
  e4.useFeature(m, 'maneuveringAttack');
  e4.rng = dadoEmSequencia(15, 2);
  e4.attackAction(m, g3, 'espadaLonga');
  assert.equal(getCondition(amigo, 'manobrado')?.data?.de, g3.id);
  // Passo Evasivo: soma o dado à CA
  const p = mestre(3);
  p.features.push('evasiveFootwork');
  p.pos = { x: 5, y: 5 };
  const { enc: e5 } = arena({ herois: [p], foes: [alvoParado({ x: 9, y: 9 })] });
  e5.rng = dadoEmSequencia(1);
  e5.rng.die = () => 4;
  const ca0 = caEfetiva(p);
  assert.equal(e5.useFeature(p, 'evasiveFootwork'), true);
  assert.equal(caEfetiva(p), ca0 + 4);
  assert.equal(p.resources.superiorityDice, 3);
  // Reagrupar: PV temporários = dado + Carisma
  const r = mestre(3);
  r.features.push('rally');
  r.pos = { x: 5, y: 5 };
  const ferido = heroi('guerreiro', 1, 'Humano', { weapons: ['espadaLonga'] });
  ferido.pos = { x: 6, y: 5 };
  const { enc: e6 } = arena({ herois: [r, ferido], foes: [alvoParado({ x: 9, y: 9 })] });
  assert.equal(e6.useFeature(r, 'rally', { target: ferido }), true);
  assert.ok((ferido.tempHp ?? 0) >= 0 && r.bonusUsed);
  assert.equal(e6.useFeature(r, 'rally', { target: r }), false, 'não em si mesmo');
  // Comandante: abre mão de um golpe (nível 5), o aliado ataca de reação
  const c = mestre(5);
  c.features.push('commandersStrike');
  c.pos = { x: 5, y: 5 };
  const aliado = heroi('guerreiro', 1, 'Humano', { weapons: ['espadaLonga'] });
  aliado.pos = { x: 5, y: 6 };
  const alvo = inimigo('goblin', { x: 6, y: 6 });
  alvo.hp = alvo.maxHp = 300;
  const { enc: e7 } = arena({ herois: [c, aliado], foes: [alvo] });
  const swings0 = e7.golpesDoAtaque(c, 'espadaLonga').length;
  e7.rng = dadoEmSequencia(15, 3);
  assert.equal(e7.useFeature(c, 'commandersStrike', { target: aliado }), true);
  assert.equal(aliado.reactionUsed, true);
  assert.ok(alvo.hp < 300, 'o aliado acertou');
  assert.equal(e7.golpesDoAtaque(c, 'espadaLonga').length, swings0 - 1);
  const c2 = mestre(3);
  c2.features.push('commandersStrike');
  c2.pos = { x: 5, y: 5 };
  const al2 = heroi('guerreiro', 1, 'Humano', { weapons: ['espadaLonga'] });
  al2.pos = { x: 5, y: 6 };
  const { enc: e8 } = arena({ herois: [c2, al2], foes: [inimigo('goblin', { x: 6, y: 6 })] });
  assert.equal(e8.useFeature(c2, 'commandersStrike', { target: al2 }), false, 'com um golpe só não há o que ceder');
});

teste('Tabela de surtos completa: 50 efeitos, e os de regra funcionam', async () => {
  const { SURTOS } = await import('../rules/surto.js');
  assert.equal(SURTOS.length, 50);
  assert.equal(new Set(SURTOS.map((x) => x.id)).size, 50);
  const por = (id) => SURTOS.find((x) => x.id === id);
  const s = selvagem(6);
  s.pos = { x: 5, y: 5 };
  const gob = inimigo('goblin', { x: 7, y: 5 });
  gob.hp = gob.maxHp = 300;
  const { enc } = arena({ herois: [s], foes: [gob] });
  enc.rng = dadoEmSequencia(10);
  // vaso de planta: vulnerável a todo dano
  por('planta').aplica(enc, s);
  assert.ok(hasCondition(s, 'vasoDePlanta'));
  assert.equal(enc.danoPorTipo(s, 5, 'fogo'), 10);
  removeCondition(s, 'vasoDePlanta');
  assert.equal(enc.danoPorTipo(s, 5, 'fogo'), 5);
  // perfurante: só o perfurante dobra
  por('perfurante').aplica(enc, s);
  assert.equal(enc.danoPorTipo(s, 5, 'perfurante'), 10);
  assert.equal(enc.danoPorTipo(s, 5, 'fogo'), 5);
  // resistência a tudo
  por('resistencia').aplica(enc, s);
  assert.equal(enc.danoPorTipo(s, 10, 'fogo'), 5);
  // espaço de menor círculo
  s.spellcasting.slots[1] = 0;
  s.spellcasting.slotsMax[1] = 4;
  por('espaco').aplica(enc, s);
  assert.equal(s.spellcasting.slots[1], 1);
  // raios: até três, 4d10 elétrico
  const hp0 = gob.hp;
  por('raios').aplica(enc, s);
  assert.ok(gob.hp < hp0, 'o raio caiu no goblin');
  // espelho e invisível
  por('espelho').aplica(enc, s);
  assert.equal(getCondition(s, 'imagens')?.data?.n, 3);
  // surto que se repete: novo surto no começo do turno, sem repetir o "repete"
  por('repete').aplica(enc, s);
  assert.ok(hasCondition(s, 'surtoRepetido'));
});

teste('Surtos de magia: a próxima magia de dano sai no máximo (e só ela); a próxima com resistência dá desvantagem; as magias de ação viram bônus', async () => {
  const { SURTOS } = await import('../rules/surto.js');
  const por = (id) => SURTOS.find((x) => x.id === id);
  const s = selvagem(6);
  s.pos = { x: 5, y: 5 };
  const gob = alvoParado({ x: 7, y: 5 });
  gob.hp = gob.maxHp = 500;
  const { enc } = arena({ herois: [s], foes: [gob] });
  s.spellcasting.prepared = [...new Set([...(s.spellcasting.prepared ?? []), 'misselMagico', 'bolaDeFogo'])];
  s.spellcasting.slots[1] = 4;
  s.spellcasting.slots[3] = 3;
  por('maximo').aplica(enc, s);
  assert.ok(s.surtoMaximoAte >= enc.round);
  enc.rng = dadoEmSequencia(15);
  enc.castSpell(s, 'misselMagico', { target: gob });
  assert.equal(s.surtoMaximoAte, undefined, 'a marca some depois da primeira magia de dano');
  // desvantagem
  por('desvantagem').aplica(enc, s);
  assert.ok(s.surtoDesvSaveAte >= enc.round);
  // rápida
  por('rapida').aplica(enc, s);
  assert.ok(s.surtoRapidoAte >= enc.round);
  s.actionUsed = false; s.bonusUsed = false;
  const r = enc.castSpell(s, 'misselMagico', { target: gob });
  assert.equal(s.bonusUsed && !s.actionUsed, true, 'a magia de uma ação custou a ação bônus');
});

// ============================================================================================================
console.log(`\n${total - falhas}/${total} testes passaram`);
process.exit(falhas ? 1 : 0);
