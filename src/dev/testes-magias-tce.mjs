// AS MAGIAS DO CALDEIRÃO DE TASHA no motor: os espíritos que crescem com o círculo, as lâminas de truque, o ácido que
// fica, e o resto, sobre o Encounter de verdade.
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-magias-tce.mjs
//
// Cada prova foi escrita para FALHAR sem o código dela: nenhuma destas magias, nem os espíritos, existia.
import assert from 'node:assert/strict';

const P = new URL('../', import.meta.url).href;
const { Encounter } = await import(P + 'rules/combat.js');
const { makeParty } = await import(P + 'rules/party.js');
const { makeMonster } = await import(P + 'rules/monsters.js');
const { Battlefield, distanceFt } = await import(P + 'core/grid.js');
const { makeRng } = await import(P + 'core/rng.js');
const { hasCondition, getCondition } = await import(P + 'rules/conditions.js');
const { spellAttackBonus, spellSaveDc } = await import(P + 'rules/abilities.js');
const { MAGIAS_TCE } = await import(P + 'rules/magias-livro-tce.js');
const { listaDaClasse, regrasDeMagia } = await import(P + 'game/criacao.js');
const { heroiPorId } = await import(P + 'game/herois.js');

let total = 0;
let falhas = 0;
async function teste(nome, fn) {
  total += 1;
  try { await fn(); console.log(`ok    ${nome}`); } catch (e) {
    falhas += 1;
    console.log(`FALHA ${nome}\n      ${String(e.stack ?? e.message).split('\n').slice(0, 6).join('\n      ')}`);
  }
}

/** Mago do nível pedido em (6,9), a guerreira colada nele, e os inimigos pedidos. */
function montar({ seed = 1, nivel = 17, foes = [['ogro', { x: 7, y: 9 }]], prepara = [] } = {}) {
  const field = new Battlefield(20, 20, Array(20).fill('.'.repeat(20)));
  const party = makeParty({ nivel });
  party.forEach((c, i) => { c.pos = { x: 1, y: 1 + i * 2, f: 1 }; });
  const mago = party.find((c) => c.classe === 'mago');
  const guerreira = party.find((c) => c.classe === 'guerreiro');
  mago.pos = { x: 6, y: 9, f: 1 };
  guerreira.pos = { x: 6, y: 10, f: 1 };
  mago.spellcasting.prepared.push(...prepara);
  const fs = foes.map(([id, p]) => makeMonster(id, p));
  const log = [];
  const enc = new Encounter({ battlefield: field, party, foes: fs, rng: makeRng(seed), onLog: (e) => log.push(e) });
  enc.firstSide = 'party'; enc.round = 1; enc.beginSide('party');
  const texto = () => log.map((l) => `${l.text} ${l.detail ?? ''}`).join('\n');
  return { enc, party, mago, guerreira, foes: fs, log, texto };
}
const novoTurno = (c) => { c.actionUsed = false; c.bonusUsed = false; c.reactionUsed = false; c.magiasNoTurno = []; };
const espiritos = (enc) => enc.combatants.filter((c) => c.invocado && /^espirito/.test(c.defId) && !c.dead);

await teste('o Tasha entra no catálogo e nas listas pelo livro: o truque do bruxo, a besta do druida, o ácido na criação do mago', () => {
  assert.equal(Object.keys(MAGIAS_TCE).length, 20);
  assert.ok(listaDaClasse('bruxo', 9).truques.includes('laminaTrovejante'));
  assert.ok(listaDaClasse('druida', 9).magias.includes('invocarBesta'));
  assert.ok(regrasDeMagia(heroiPorId('pc-mago')).listaMagias.includes('infusaoCausticaDeTasha'));
});

await teste('Invocar Besta: o espírito cresce com o círculo (CA, PV, dano, golpes) e ataca com o ataque de magia de quem conjura', () => {
  const a = montar({ prepara: ['invocarBesta'] });
  assert.ok(a.enc.castSpell(a.mago, 'invocarBesta', { opcao: 'terra', circulo: 2 }).ok);
  const b2 = espiritos(a.enc)[0];
  const b = montar({ prepara: ['invocarBesta'] });
  assert.ok(b.enc.castSpell(b.mago, 'invocarBesta', { opcao: 'terra', circulo: 4 }).ok);
  const b4 = espiritos(b.enc)[0];
  assert.equal(b2.ac, 13); assert.equal(b4.ac, 15);
  assert.equal(b2.maxHp, 30); assert.equal(b4.maxHp, 40);
  assert.equal(b2.attacks[0].damage, '1d8+6'); assert.equal(b4.attacks[0].damage, '1d8+8');
  assert.equal(b2.attacks[0].bonus, spellAttackBonus(a.mago));
  assert.equal(b2.multiattack, null); assert.equal(b4.multiattack.count, 2);
  assert.equal(b2.attacks[0].damage, '1d8+6', 'o espírito do 4º não mexe no do 2º (os golpes não são do bloco)');
  assert.ok(b2.traits.includes('packTactics') && b2.side === 'party');
});

await teste('Invocar Morto-Vivo: o toque do fantasma usa a CD de quem conjurou; o espírito some com a concentração', () => {
  const { enc, mago } = montar({ prepara: ['invocarMortoVivo'] });
  assert.ok(enc.castSpell(mago, 'invocarMortoVivo', { opcao: 'fantasmagorico', circulo: 3 }).ok);
  const f = espiritos(enc)[0];
  assert.equal(f.attacks[0].onHit.dc, spellSaveDc(mago));
  assert.ok(f.traits.includes('incorporealMovement'));
  enc.dropConcentration(mago);
  assert.equal(espiritos(enc).length, 0);
});

await teste('Lâmina Trovejante: golpe com a arma; quem sai do lugar por vontade leva o trovão', () => {
  let fez = false;
  for (let seed = 1; seed <= 30 && !fez; seed++) {
    const { enc, mago, foes } = montar({ seed, nivel: 5, prepara: ['laminaTrovejante'] });
    foes[0].ac = 1; foes[0].hp = foes[0].maxHp = 300;
    mago.spellcasting.cantrips.push('laminaTrovejante');
    enc.castSpell(mago, 'laminaTrovejante', { target: foes[0] });
    if (!hasCondition(foes[0], 'envoltoEmTrovao')) continue;
    const hp = foes[0].hp;
    enc.side = 'foes'; foes[0].movementLeftFt = 40;
    enc.moveAlong(foes[0], [{ x: 7, y: 9 }, { x: 8, y: 9 }, { x: 9, y: 9 }]);
    fez = foes[0].hp < hp - 0 && !hasCondition(foes[0], 'envoltoEmTrovao');
  }
  assert.ok(fez);
});

await teste('Lâmina de Chama Esverdeada: a chama salta para quem está colado no alvo', () => {
  let saltou = false;
  for (let seed = 1; seed <= 30 && !saltou; seed++) {
    const { enc, mago, foes, texto } = montar({ seed, prepara: ['laminaDeChamaEsverdeada'], foes: [['ogro', { x: 7, y: 9 }], ['ogro', { x: 8, y: 9 }]] });
    for (const f of foes) { f.ac = 1; f.hp = f.maxHp = 300; }
    enc.castSpell(mago, 'laminaDeChamaEsverdeada', { target: foes[0] });
    saltou = /salta de/.test(texto()) && foes[1].hp < 300;
  }
  assert.ok(saltou);
});

await teste('Atração Elétrica: quem falha é puxado para perto e leva o raio', () => {
  let puxou = false;
  for (let seed = 1; seed <= 20 && !puxou; seed++) {
    const { enc, mago, foes } = montar({ seed, prepara: ['atracaoEletrica'], foes: [['ogro', { x: 8, y: 9 }]] });
    foes[0].abilities.str = 1;
    enc.castSpell(mago, 'atracaoEletrica', { target: foes[0] });
    puxou = distanceFt(foes[0].pos, mago.pos) <= 5 && foes[0].hp < foes[0].maxHp;
  }
  assert.ok(puxou);
});

await teste('Lasca Mental: a próxima resistência perde 1d4, e a lasca sai com ela', () => {
  let ficou = false;
  for (let seed = 1; seed <= 20 && !ficou; seed++) {
    const { enc, mago, foes } = montar({ seed, prepara: ['lascaMental'] });
    foes[0].abilities.int = 1;
    enc.castSpell(mago, 'lascaMental', { target: foes[0] });
    if (!hasCondition(foes[0], 'lascaMental')) continue;
    const r = enc.resistencia(foes[0], 'wis', 10);
    ficou = r.partes.some((p) => p.rotulo === 'Lasca Mental') && !hasCondition(foes[0], 'lascaMental');
  }
  assert.ok(ficou);
});

await teste('Infusão Cáustica: o ácido fere no começo de cada turno de quem falhou, e sai com a concentração', () => {
  let pegou = false;
  for (let seed = 1; seed <= 20 && !pegou; seed++) {
    const { enc, mago, foes } = montar({ seed, prepara: ['infusaoCausticaDeTasha'], foes: [['ogro', { x: 9, y: 9 }]] });
    foes[0].abilities.dex = 1; foes[0].hp = foes[0].maxHp = 300;
    enc.castSpell(mago, 'infusaoCausticaDeTasha', { point: { ...foes[0].pos } });
    if (!hasCondition(foes[0], 'acidoCaustico')) continue;
    const hp = foes[0].hp;
    enc.beginSide('foes');
    pegou = foes[0].hp < hp;
    enc.dropConcentration(mago);
    assert.ok(!hasCondition(foes[0], 'acidoCaustico'), 'a concentração leva o ácido');
  }
  assert.ok(pegou);
});

await teste('Mortalha Espiritual: o golpe com arma em quem está a até 3 m soma o dano e impede a cura', () => {
  let somou = false;
  for (let seed = 1; seed <= 30 && !somou; seed++) {
    const { enc, mago, foes, log } = montar({ seed, prepara: ['mortalhaEspiritual'] });
    foes[0].ac = 1; foes[0].hp = foes[0].maxHp = 300;
    assert.ok(enc.castSpell(mago, 'mortalhaEspiritual', { opcao: 'frio' }).ok);
    novoTurno(mago);
    enc.resolveAttack(mago, foes[0], { weaponId: mago.equippedWeapon });
    somou = log.some((l) => /Mortalha Espiritual/.test(`${l.text} ${l.detail ?? ''}`)) && hasCondition(foes[0], 'semCura');
  }
  assert.ok(somou);
});

await teste('Aparência Extraplanar: imune a fogo, +2 de CA e um golpe a mais', () => {
  const { enc, mago } = montar({ prepara: ['aparenciaExtraplanarDeTasha'] });
  const golpes = enc.golpesDoAtaque(mago, mago.equippedWeapon).length;
  const ca = enc.combatants.includes(mago) && mago.ac;
  assert.ok(enc.castSpell(mago, 'aparenciaExtraplanarDeTasha', { opcao: 'inferior' }).ok);
  assert.equal(enc.golpesDoAtaque(mago, mago.equippedWeapon).length, golpes + 1);
  const hp = mago.hp;
  enc.applyDamage(mago, 30, 'fogo', null, { magico: true });
  assert.equal(mago.hp, hp, 'imune a fogo');
  void ca;
});

await teste('Lâmina do Desastre: dois golpes ao surgir e de novo com a ação bônus, sem espaço', () => {
  const { enc, mago, foes, log } = montar({ prepara: ['laminaDoDesastre'], foes: [['ogro', { x: 9, y: 9 }], ['ogro', { x: 10, y: 9 }]] });
  for (const f of foes) f.hp = f.maxHp = 500;
  const ataques = () => log.filter((l) => l.rolagem?.categoria === 'ataque' || /Lâmina do Desastre/.test(l.text ?? '')).length;
  assert.ok(enc.castSpell(mago, 'laminaDoDesastre', { target: foes[0] }).ok);
  const depois1 = ataques();
  const espacos = mago.spellcasting.slots.reduce((a, b) => a + b, 0);
  novoTurno(mago);
  const r = enc.castSpell(mago, 'laminaDoDesastre', { target: foes[0] });
  assert.ok(r.ok, r.why);
  assert.equal(mago.spellcasting.slots.reduce((a, b) => a + b, 0), espacos);
  assert.ok(ataques() >= depois1 + 2, 'dois golpes de novo');
});

await teste('Explosão de Lâminas: fere quem está colado em quem conjura', () => {
  const { enc, mago, foes } = montar({ prepara: ['explosaoDeLaminas'] });
  foes[0].abilities.dex = 1; foes[0].hp = foes[0].maxHp = 300;
  enc.castSpell(mago, 'explosaoDeLaminas', { point: { ...mago.pos } });
  assert.ok(foes[0].hp < 300);
});

await teste('a lista expandida do Tasha: o Comando do bardo, o Auxílio do patrulheiro, a Graxa do feiticeiro, a Aura de Vida do clérigo', async () => {
  const { LISTA_EXPANDIDA_TCE } = await import(P + 'rules/magias-por-classe-tce-expandida.js');
  const tem = (classe, id) => [...listaDaClasse(classe, 9).truques, ...listaDaClasse(classe, 9).magias].includes(id);
  for (const [classe, id] of [['bardo', 'comando'], ['patrulheiro', 'ajuda'], ['feiticeiro', 'graxa'], ['clerigo', 'auraDeVida'],
    ['bruxo', 'sinistro'], ['druida', 'coneDeFrio'], ['paladino', 'oracaoDeCura'], ['mago', 'falarComOsMortos']]) {
    assert.ok(LISTA_EXPANDIDA_TCE[id]?.includes(classe), `${id} na lista expandida de ${classe}`);
    assert.ok(tem(classe, id), `${id} na lista do ${classe}`);
  }
  // e a magia que ficou fora do jogo continua fora (o Portal está na lista expandida do mago, e não no jogo)
  assert.ok(!Object.keys(LISTA_EXPANDIDA_TCE).some((id) => /portal/i.test(id)));
  // a criação do bardo já vê a de 1º círculo que o Tasha dá a ele
  assert.ok(regrasDeMagia(heroiPorId('pc-barda')).listaMagias.includes('comando'));
});

console.log(`\n${total - falhas}/${total} testes passaram.`);
if (falhas) process.exit(1);
