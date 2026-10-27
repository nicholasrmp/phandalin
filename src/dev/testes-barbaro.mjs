// Testes do BÁRBARO: a Fúria (regras e figura) e o Ataque Descuidado como
// INTERRUPTOR da barra. Rode com:
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-barbaro.mjs

import assert from 'node:assert/strict';
import { montarHeroi } from '../game/criacao.js';
import { subirUmNivel } from '../game/nivel.js';
import { Encounter } from '../rules/combat.js';
import { Battlefield } from '../core/grid.js';
import { makeMonster } from '../rules/monsters.js';
import { makeRng } from '../core/rng.js';
import { hasCondition, addCondition, removeCondition } from '../rules/conditions.js';
import { previsaoDeAtaque } from '../rules/odds.js';
import { acaoRemotaValida, mandaNaHora } from '../game/acoes.js';
import { aparenciaDaFigura, comEstado, estadoVisualDe, tintaDaAura } from '../art/estado-visual.js';

const MAPA = Array(12).fill('............');

/** Grask no nível pedido, um goblin colado nele, a luta valendo e a vez do grupo. */
function montar(nivel = 1, { seed = 11 } = {}) {
  const field = new Battlefield(12, 12, MAPA);
  const grask = montarHeroi('pc-barbaro');
  while (grask.level < nivel) subirUmNivel(grask);
  grask.side = 'party';
  grask.pos = { x: 4, y: 4 };
  const foes = [makeMonster('goblin', { x: 5, y: 4 })];
  const enc = new Encounter({ battlefield: field, party: [grask], foes, rng: makeRng(seed), onLog: () => {} });
  enc.firstSide = 'party';
  enc.round = 1;
  enc.beginSide('party');
  // dano e vida de sobra para o goblin não morrer no meio do teste
  foes[0].hp = foes[0].maxHp = 500;
  return { enc, grask, gob: foes[0] };
}

let falhas = 0;
let total = 0;
function teste(nome, fn) {
  total += 1;
  try { fn(); console.log(`ok    ${nome}`); } catch (e) {
    falhas += 1;
    console.log(`FALHA ${nome}\n      ${e.message.split('\n').join('\n      ')}`);
  }
}

/** O grupo termina o turno, os inimigos também, e começa o turno do grupo outra vez (as condições "até o próximo turno" caem aqui). */
function proximoTurnoDoGrupo(enc) {
  const [heroi] = enc.allOf('party');
  const [inimigo] = enc.allOf('foes');
  enc.endTurn(heroi);
  assert.equal(enc.side, 'foes');
  enc.endTurn(inimigo);
  assert.equal(enc.side, 'party');
}

// ---- Fúria ------------------------------------------------------------------

teste('Fúria: ação bônus, uma carga, e a condição liga', () => {
  const { enc, grask } = montar(1);
  assert.equal(grask.resources.rage, 2);
  assert.ok(enc.useFeature(grask, 'rage'));
  assert.ok(hasCondition(grask, 'furia'));
  assert.equal(grask.resources.rage, 1);
  assert.equal(grask.bonusUsed, true);
});

teste('Fúria: vantagem em Força (resistência), não em Sabedoria', () => {
  const { enc, grask } = montar(1);
  assert.notEqual(enc.resistencia(grask, 'str', 30).mode, 'vantagem', 'sem fúria, normal');
  enc.useFeature(grask, 'rage');
  assert.equal(enc.resistencia(grask, 'str', 30).mode, 'vantagem');
  assert.notEqual(enc.resistencia(grask, 'wis', 30).mode, 'vantagem');
});

teste('Fúria: resistência a cortante, perfurante e concussão — não a fogo', () => {
  const { enc, grask, gob } = montar(1);
  enc.useFeature(grask, 'rage');
  grask.hp = grask.maxHp = 100;
  enc.applyDamage(grask, 10, 'cortante', gob, { deArma: true });
  assert.equal(grask.hp, 95, 'cortante pela metade');
  enc.applyDamage(grask, 10, 'perfurante', gob, { deArma: true });
  assert.equal(grask.hp, 90);
  enc.applyDamage(grask, 10, 'fogo', gob);
  assert.equal(grask.hp, 80, 'fogo inteiro');
});

teste('Fúria: +2 de dano no corpo a corpo com Força (e só nele)', () => {
  const { enc, grask, gob } = montar(1);
  enc.useFeature(grask, 'rage');
  assert.equal(grask.danoDeFuria, 2);
  let achou = null;
  for (let i = 0; i < 40 && !achou; i++) {
    const r = enc.resolveAttack(grask, gob);
    if (r?.hit) achou = r;
  }
  assert.ok(achou, 'acertou alguma vez em 40 golpes');
  const parcela = achou.danoPartes.find((p) => p.rotulo === 'fúria');
  assert.ok(parcela, 'o dano traz a parcela da fúria');
  assert.equal(parcela.total, 2);
});

teste('Fúria: atacar sem fúria não tem a parcela', () => {
  const { enc, grask, gob } = montar(1);
  let achou = null;
  for (let i = 0; i < 40 && !achou; i++) {
    const r = enc.resolveAttack(grask, gob);
    if (r?.hit) achou = r;
  }
  assert.ok(achou);
  assert.ok(!achou.danoPartes.some((p) => p.rotulo === 'fúria'));
});

// ---- a figura em Fúria ---------------------------------------------------------

const comFolha = (look, estado) => String(look).startsWith('barbarian') && estado === 'furia';
const semFolha = () => false;

teste('Figura: enfurecido pede a folha do estado; a Fúria acabando devolve a normal', () => {
  const { grask } = montar(1);
  grask.look = 'barbarian@peleDeAnimal-machadoGrande';
  assert.equal(estadoVisualDe(grask), null);
  assert.deepEqual(aparenciaDaFigura(grask, comFolha), { look: 'barbarian@peleDeAnimal-machadoGrande', estado: null, aura: null });
  addCondition(grask, 'furia', { rounds: 10 });
  const f = aparenciaDaFigura(grask, comFolha);
  assert.equal(f.look, 'barbarian@peleDeAnimal-machadoGrande~furia');
  assert.equal(f.estado, 'furia');
  assert.equal(f.aura, 'folha');
  assert.equal(tintaDaAura(f, 1), null, 'a aura está na arte: sem tinta por cima');
  removeCondition(grask, 'furia');
  assert.equal(aparenciaDaFigura(grask, comFolha).look, 'barbarian@peleDeAnimal-machadoGrande', 'voltou ao normal');
});

teste('Figura: sem folha do estado, a aura é procedural (tinta vermelha que pulsa)', () => {
  const { grask } = montar(1);
  grask.look = 'barbarian@nenhuma-machadoGrande';
  addCondition(grask, 'furia', { rounds: 10 });
  const f = aparenciaDaFigura(grask, semFolha);
  assert.equal(f.look, 'barbarian@nenhuma-machadoGrande', 'a chave não ganha um estado sem arte');
  assert.equal(f.aura, 'procedural');
  const a = tintaDaAura(f, 0);
  const b = tintaDaAura(f, 0.16);
  assert.equal(a.color, '#d62820');
  assert.ok(a.strength > 0.1 && a.strength < 0.35);
  assert.notEqual(a.strength, b.strength, 'pulsa');
});

teste('Figura: morto não brilha, e a chave com estado não acumula "~"', () => {
  const { grask } = montar(1);
  addCondition(grask, 'furia', { rounds: 10 });
  grask.dead = true;
  assert.equal(estadoVisualDe(grask), null);
  assert.equal(comEstado('a@b~furia', 'furia', true), 'a@b~furia');
  assert.equal(comEstado('a@b~furia', 'furia', false), 'a@b');
});

// ---- Ataque Descuidado ----------------------------------------------------------

teste('Ataque Descuidado: o 1º nível NÃO tem; o 2º tem (subirUmNivel)', () => {
  const { enc, grask } = montar(1);
  assert.ok(!grask.features.includes('recklessAttack'));
  assert.equal(enc.useFeature(grask, 'recklessAttack'), false, 'sem a característica o interruptor não liga');
  assert.ok(!grask.descuidadoLigado);
  const dois = montar(2);
  assert.ok(dois.grask.features.includes('recklessAttack'), 'no 2º nível aparece');
  assert.ok(dois.enc.useFeature(dois.grask, 'recklessAttack'));
  assert.equal(dois.grask.descuidadoLigado, true);
});

teste('Ataque Descuidado: subir de 1º para 2º nível dá a característica ao mesmo Grask', () => {
  const grask = montarHeroi('pc-barbaro');
  assert.equal(grask.level, 1);
  assert.ok(!grask.features.includes('recklessAttack'));
  subirUmNivel(grask);
  assert.equal(grask.level, 2);
  assert.ok(grask.features.includes('recklessAttack'));
});

teste('Ataque Descuidado: desligado não dá vantagem a ninguém', () => {
  const { enc, grask, gob } = montar(2);
  assert.equal(enc.attackModifiers(grask, gob, { ranged: false }).advantage, false);
  assert.equal(enc.attackModifiers(gob, grask, { ranged: false }).advantage, false);
  const r = enc.resolveAttack(grask, gob);
  assert.ok(r);
  assert.ok(!hasCondition(grask, 'descuidado'), 'ataque comum não cria a condição');
  assert.equal(enc.attackModifiers(gob, grask, { ranged: false }).advantage, false);
});

teste('Ataque Descuidado: ligado, a previsão já mostra a vantagem do herói (a condição só nasce no golpe)', () => {
  const { enc, grask, gob } = montar(2);
  enc.useFeature(grask, 'recklessAttack');
  const prev = previsaoDeAtaque(enc, grask, gob, grask.equippedWeapon);
  assert.ok(prev.mods.advantage, 'a previsão do cartão do alvo mostra a vantagem');
  assert.ok(prev.motivos.includes('ataque descuidado'));
  const mods = enc.attackModifiers(grask, gob, { ranged: false });
  assert.ok(mods.advantage);
  assert.ok(mods.reasons.includes('ataque descuidado'));
  assert.ok(!hasCondition(grask, 'descuidado'), 'ainda não atacou: ninguém tem vantagem contra ele');
  assert.equal(enc.attackModifiers(gob, grask, { ranged: false }).advantage, false);
});

teste('Ataque Descuidado: o 1º golpe cria a condição; o goblin passa a atacar com vantagem, com o motivo certo', () => {
  const { enc, grask, gob } = montar(2);
  enc.useFeature(grask, 'recklessAttack');
  const r = enc.resolveAttack(grask, gob);
  assert.ok(r);
  assert.equal(r.modo, 'vantagem', 'o golpe saiu com vantagem');
  assert.ok(hasCondition(grask, 'descuidado'));
  const contra = enc.attackModifiers(gob, grask, { ranged: false });
  assert.ok(contra.advantage, 'quem ataca o bárbaro tem vantagem');
  assert.ok(contra.reasons.includes('alvo descuidado'), `motivo: ${contra.reasons}`);
});

teste('Ataque Descuidado: o preço vale até o começo do próximo turno, e o interruptor PERSISTE', () => {
  const { enc, grask, gob } = montar(2);
  enc.useFeature(grask, 'recklessAttack');
  enc.resolveAttack(grask, gob);
  assert.ok(hasCondition(grask, 'descuidado'));
  proximoTurnoDoGrupo(enc);
  assert.ok(!hasCondition(grask, 'descuidado'), 'a condição caiu no começo do turno dele');
  assert.equal(grask.descuidadoLigado, true, 'o interruptor continua ligado');
  assert.ok(enc.attackModifiers(grask, gob, { ranged: false }).advantage, 'e o próximo ataque já sai descuidado');
  assert.equal(enc.attackModifiers(gob, grask, { ranged: false }).advantage, false, 'sem ter atacado, sem preço');
  enc.resolveAttack(grask, gob);
  assert.ok(hasCondition(grask, 'descuidado'), 'no turno novo o 1º golpe cobra de novo');
});

teste('Ataque Descuidado: ligar sem atacar não cobra preço (só o golpe cobra)', () => {
  const { enc, grask, gob } = montar(2);
  enc.useFeature(grask, 'recklessAttack');
  proximoTurnoDoGrupo(enc);
  assert.ok(!hasCondition(grask, 'descuidado'));
  assert.equal(enc.attackModifiers(gob, grask, { ranged: false }).advantage, false);
});

teste('Ataque Descuidado: desligar o interruptor volta ao normal nos golpes seguintes', () => {
  const { enc, grask, gob } = montar(2);
  enc.useFeature(grask, 'recklessAttack', { modo: 'ligar' });
  enc.useFeature(grask, 'recklessAttack', { modo: 'desligar' });
  assert.equal(grask.descuidadoLigado, false);
  assert.equal(enc.attackModifiers(grask, gob, { ranged: false }).advantage, false);
  enc.resolveAttack(grask, gob);
  assert.ok(!hasCondition(grask, 'descuidado'));
  // sem modo: inverte
  enc.useFeature(grask, 'recklessAttack');
  assert.equal(grask.descuidadoLigado, true);
  enc.useFeature(grask, 'recklessAttack');
  assert.equal(grask.descuidadoLigado, false);
});

teste('Ataque Descuidado: ligar duas vezes com "ligar" (a rede repete) não desliga', () => {
  const { enc, grask } = montar(2);
  enc.useFeature(grask, 'recklessAttack', { modo: 'ligar' });
  enc.useFeature(grask, 'recklessAttack', { modo: 'ligar' });
  assert.equal(grask.descuidadoLigado, true);
});

teste('Ataque Descuidado: só corpo a corpo com Força — ataque à distância e golpe de oportunidade não gastam o interruptor', () => {
  const { enc, grask, gob } = montar(2);
  enc.useFeature(grask, 'recklessAttack');
  assert.equal(enc.attackModifiers(grask, gob, { ranged: true }).advantage, false, 'à distância não ganha vantagem');
  assert.equal(enc.attackModifiers(grask, gob, { ranged: false, opportunity: true }).advantage, false, 'reação não é "no seu turno"');
  assert.equal(enc.aplicarDescuidado(grask, { ranged: true }), false);
  assert.ok(!hasCondition(grask, 'descuidado'));
});

teste('Ataque Descuidado: com o interruptor ligado e a fúria juntos, as duas coisas valem', () => {
  const { enc, grask, gob } = montar(2);
  enc.useFeature(grask, 'rage');
  enc.useFeature(grask, 'recklessAttack');
  let achou = null;
  for (let i = 0; i < 40 && !achou; i++) {
    const r = enc.resolveAttack(grask, gob);
    if (r?.hit) achou = r;
  }
  assert.ok(achou);
  assert.equal(achou.modo, 'vantagem');
  assert.ok(achou.danoPartes.some((p) => p.rotulo === 'fúria'));
});

teste('Ataque Descuidado: a luta acabar limpa a condição, o interruptor fica para a próxima', () => {
  const { enc, grask, gob } = montar(2);
  enc.useFeature(grask, 'recklessAttack');
  enc.resolveAttack(grask, gob);
  assert.ok(hasCondition(grask, 'descuidado'));
  gob.hp = 0; gob.dead = true;
  enc.checkEnd();
  assert.ok(!hasCondition(grask, 'descuidado'));
  assert.equal(grask.descuidadoLigado, true);
});

teste('Ataque Descuidado: o estado é JSON puro (vai no save e na vista da sala)', () => {
  const { enc, grask } = montar(2);
  enc.useFeature(grask, 'recklessAttack');
  const volta = JSON.parse(JSON.stringify({ descuidadoLigado: grask.descuidadoLigado }));
  assert.equal(volta.descuidadoLigado, true);
});

teste('Ataque Descuidado: o golpe de oportunidade (fora do turno) NÃO ganha a vantagem, mesmo com a condição de pé; o preço contra ele fica', () => {
  const { enc, grask, gob } = montar(2);
  enc.useFeature(grask, 'recklessAttack');
  enc.resolveAttack(grask, gob);
  assert.ok(hasCondition(grask, 'descuidado'));
  assert.equal(enc.attackModifiers(grask, gob, { ranged: false, opportunity: true }).advantage, false, 'sem vantagem fora do turno');
  assert.ok(enc.attackModifiers(gob, grask, { ranged: false }).advantage, 'mas quem o ataca segue com vantagem');
  assert.ok(enc.attackModifiers(grask, gob, { ranged: false }).advantage, 'e no turno dele a vantagem vale');
});

teste('Ataque Descuidado: ligar DEPOIS do 1º ataque do turno (Ataque Extra, tiro) só vale no turno seguinte', () => {
  const { enc, grask, gob } = montar(2);
  enc.resolveAttack(grask, gob);                  // 1º ataque do turno, ainda desligado
  assert.equal(grask.atacouNoTurno, true);
  enc.useFeature(grask, 'recklessAttack');
  assert.equal(enc.attackModifiers(grask, gob, { ranged: false }).advantage, false, 'o 2º golpe não é descuidado');
  enc.resolveAttack(grask, gob);
  assert.ok(!hasCondition(grask, 'descuidado'), 'e não cobra o preço');
  proximoTurnoDoGrupo(enc);
  assert.equal(grask.atacouNoTurno, false);
  assert.ok(enc.attackModifiers(grask, gob, { ranged: false }).advantage, 'no turno seguinte vale (o interruptor persiste)');
});

teste('Ataque Descuidado: um 1º ataque à distância gasta a decisão do turno', () => {
  const { enc, grask, gob } = montar(2);
  enc.useFeature(grask, 'recklessAttack');
  grask.atacouNoTurno = true;                    // o que `resolveAttack` marca depois de um tiro
  assert.equal(enc.attackModifiers(grask, gob, { ranged: false }).advantage, false);
});

teste('Ataque de oportunidade não conta como o 1º ataque do turno', () => {
  const { enc, grask, gob } = montar(2);
  enc.useFeature(grask, 'recklessAttack');
  enc.resolveAttack(grask, gob, { opportunity: true });
  assert.ok(!grask.atacouNoTurno);
  assert.ok(!hasCondition(grask, 'descuidado'));
});

teste('Incapacitado não liga a Fúria, mas o interruptor do Ataque Descuidado é de graça', () => {
  const { enc, grask } = montar(2);
  addCondition(grask, 'atordoado', { rounds: 2 });
  assert.equal(enc.useFeature(grask, 'rage'), false);
  assert.equal(grask.resources.rage, 2);
  assert.equal(enc.useFeature(grask, 'recklessAttack', { modo: 'ligar' }), true);
  assert.equal(grask.descuidadoLigado, true);
});

// ---- multijogador (paridade) -----------------------------------------------------

teste('Multijogador: o interruptor passa pela mesma intenção `feature` das outras ações', () => {
  const acao = { kind: 'feature', featureId: 'recklessAttack', modo: 'ligar' };
  assert.ok(acaoRemotaValida(acao), 'o servidor aceita a forma');
  assert.ok(mandaNaHora(acao), 'sai na hora, sem pedir alvo');
});

console.log(`\n${total - falhas}/${total} passaram`);
process.exit(falhas ? 1 : 0);
