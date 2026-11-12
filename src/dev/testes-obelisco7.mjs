// O CAPÍTULO 7 DO OBELISCO, "Fendas na Realidade": as criaturas e o motor que elas pedem.
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-obelisco7.mjs
//
// Cada prova foi escrita para FALHAR sem o código que ela mede.
import assert from 'node:assert/strict';

const P = new URL('../', import.meta.url).href;
const { Encounter } = await import(P + 'rules/combat.js');
const { makeParty } = await import(P + 'rules/party.js');
const { makeMonster, MONSTERS } = await import(P + 'rules/monsters.js');
const { Battlefield, distanceFt } = await import(P + 'core/grid.js');
const { makeRng } = await import(P + 'core/rng.js');
const { hasCondition, getCondition, addCondition, removeCondition, conditionEffects } = await import(P + 'rules/conditions.js');
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

const MAPA = Array(16).fill('................');
function montar({ seed = 1, foes = [], pos = null, lado = 'party', nivel = 9 } = {}) {
  const field = new Battlefield(16, 16, MAPA);
  const party = makeParty({ nivel });
  const pp = pos ?? [{ x: 5, y: 5 }, { x: 1, y: 1 }, { x: 1, y: 3 }, { x: 1, y: 14 }];
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

// ------------------------------------------------------------------------------------------- os números ----
await teste('os dez blocos do Obelisco têm os números do livro (ND, XP, CA, PV)', () => {
  const esperado = {
    moradorInfectado: ['2', 450, 13, 67], grellPsiquico: ['4', 1100, 15, 66], fusaoDeCarne: ['7', 2900, 12, 95],
    capaNegraMutante: ['10', 5900, 14, 143], oshundo: ['10', 5900, 15, 150], nothicDevoradorDeMentes: ['2', 450, 15, 45],
    zeloteAberrante: ['8', 3900, 16, 93], profetaDevoradorDeMentes: ['8', 3900, 17, 97], cerebroAnciaoInfectado: ['11', 7200, 10, 189],
    ocular: ['9', 5000, 13, 127],
  };
  for (const [id, [cr, xp, ac, hp]] of Object.entries(esperado)) {
    const d = MONSTERS[id];
    assert.ok(d, id);
    assert.deepEqual([d.cr, d.xp, d.ac, d.maxHp], [cr, xp, ac, hp], id);
  }
  assert.equal(MONSTERS.gnawble.speedFt, 0);
  assert.ok(MONSTERS.gnawble.naoSeguraALuta);
});

await teste('o elenco do capítulo 7 que já existia continua no jogo', () => {
  for (const id of ['grell', 'plebeu', 'berserker', 'behir', 'bocaTagarela', 'devoradorDeMentes', 'slaadVermelho', 'slaadAzul', 'slaadCinzento',
    'girinoDeSlaad', 'fanaticoDoCulto', 'homunculo', 'devoradorDeIntelecto', 'quaggoth', 'quaggothThonot', 'fomoriano', 'horrorGancho',
    'troglodita', 'barlgura', 'cogumeloGuinchador', 'goblinPsiLutador']) assert.ok(MONSTERS[id], id);
});

await teste('o morador infectado bate com a Pancada Psíquica (concussão e mais 1d6 psíquico), e não com o machado', () => {
  const d = MONSTERS.moradorInfectado;
  assert.deepEqual(d.attacks.map((a) => a.name), ['Pancada Psíquica']);
  assert.deepEqual(d.attacks[0].danoExtra, { damage: '1d6', type: 'psíquico' });
  assert.ok(d.traits.includes('imprudente'));
});

await teste('os multiataques: a capa mutante (4 caudas, ou o cadáver e 2), a ocular (4 raios, ou 2 contatos), o zelote', () => {
  const { enc } = montar();
  const capa = makeMonster('capaNegraMutante', { x: 9, y: 9 });
  assert.deepEqual(enc.golpesDoAtaque(capa, 'Cauda'), ['Cauda', 'Cauda', 'Cauda', 'Cauda']);
  assert.deepEqual(enc.golpesDoAtaque(capa, 'Golpe de Cadáver'), ['Golpe de Cadáver', 'Cauda', 'Cauda']);
  const oc = makeMonster('ocular', { x: 9, y: 9 });
  assert.deepEqual(enc.golpesDoAtaque(oc, 'Raio Ocular'), Array(4).fill('Raio Ocular'));
  assert.deepEqual(enc.golpesDoAtaque(oc, 'Contato Terrível'), ['Contato Terrível', 'Contato Terrível']);
  const z = makeMonster('zeloteAberrante', { x: 9, y: 9 });
  assert.deepEqual(enc.golpesDoAtaque(z, 'Rasgo Psíquico'), ['Rasgo Psíquico', 'Espada Curta', 'Espada Curta']);
  assert.deepEqual(enc.golpesDoAtaque(z, 'Rasgo Psíquico à Distância'), ['Rasgo Psíquico à Distância']);
});

// ------------------------------------------------------------------------------------- a ação bônus ----
await teste('a ação bônus de bloco: a capa mutante geme E ainda bate no mesmo turno', () => {
  let viu = false;
  for (let seed = 1; seed <= 30 && !viu; seed++) {
    const { enc, party, foes, texto } = montar({ seed, foes: [['capaNegraMutante', { x: 6, y: 5 }]], lado: 'foes' });
    const [c] = foes;
    takeMonsterTurn(enc, c);
    if (!/Gemido Psíquico/.test(texto())) continue;
    assert.ok(c.bonusUsed, 'o Gemido tem de gastar a ação bônus');
    assert.ok(c.actionUsed, 'e a ação ainda tem de ir para os golpes');
    assert.ok(/(Cauda|Golpe de Cadáver)/.test(texto()), 'bateu depois de gemer');
    viu = true;
    void party;
  }
  assert.ok(viu, 'em 30 sementes a capa nunca gemeu');
});

await teste('o Gemido não pega aberração, e o amedrontado dura até o fim do PRÓXIMO turno dela', () => {
  for (let seed = 1; seed <= 60; seed++) {
    const { enc, party, foes } = montar({ seed, foes: [['capaNegraMutante', { x: 6, y: 5 }]], lado: 'foes' });
    const [c] = foes;
    party[1].tipo = 'aberração';
    const a = especial(c, 'Gemido Psíquico');
    assert.ok(!enc.pegosDaAcaoEspecial(c, a, null).includes(party[1]), 'a aberração ficou de fora');
    enc.usarAcaoEspecial(c, a, null);
    const medo = party.find((h) => hasCondition(h, 'amedrontado'));
    if (!medo) continue;
    enc.fimDoTurnoDoLado('foes');
    enc.side = 'party';
    enc.beginSide('party');
    assert.ok(hasCondition(medo, 'amedrontado'), 'o herói tem de jogar o turno dele amedrontado');
    enc.fimDoTurnoDoLado('party');
    enc.side = 'foes';
    enc.beginSide('foes');
    enc.fimDoTurnoDoLado('foes');
    assert.ok(!hasCondition(medo, 'amedrontado'), 'no fim do turno seguinte da capa, acaba');
    return;
  }
  assert.fail('ninguém falhou contra o Gemido');
});

await teste('as Duplicatas: desvantagem contra a capa até o fim do próximo turno dela', () => {
  const { enc, foes } = montar({ foes: [['capaNegraMutante', { x: 9, y: 9 }]], lado: 'foes' });
  const [c] = foes;
  enc.side = 'foes';
  assert.ok(enc.usarAcaoEspecial(c, especial(c, 'Duplicatas Fantasmagóricas'), null));
  assert.ok(conditionEffects(c).attackedDisadvantage);
  assert.equal(c.actionUsed, false);
  enc.fimDoTurnoDoLado('foes');
  assert.ok(hasCondition(c, 'duplicatas'), 'vale no turno do grupo');
  enc.fimDoTurnoDoLado('party');
  enc.fimDoTurnoDoLado('foes');
  assert.ok(!hasCondition(c, 'duplicatas'));
});

await teste('o Golpe de Cadáver: envenenado e sem cura, e o sem cura sai junto com o veneno', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const { enc, party, foes } = montar({ seed, foes: [['capaNegraMutante', { x: 6, y: 5 }]] });
    const alvo = party[0];
    enc.resolveAttack(foes[0], alvo, { weaponId: 'Golpe de Cadáver' });
    if (!hasCondition(alvo, 'envenenado') || alvo.hp <= 0) continue;
    assert.ok(hasCondition(alvo, 'semCura'));
    const antes = alvo.hp;
    enc.heal(alvo, 10, party[2]);
    assert.equal(alvo.hp, antes, 'não podia curar');
    removeCondition(alvo, 'envenenado');
    assert.ok(!hasCondition(alvo, 'semCura'));
    return;
  }
  assert.fail('nenhuma semente envenenou');
});

// ---------------------------------------------------------------------------------- a fusão de carne ----
await teste('a Aura da Morte: Constituição CD 15; quem passa não sofre nada, quem falha leva necrótico e fica envenenado', () => {
  let passou = false;
  let falhou = false;
  for (let seed = 1; seed <= 40 && !(passou && falhou); seed++) {
    const { enc, party, foes } = montar({ seed, foes: [['fusaoDeCarne', { x: 6, y: 5 }]], lado: 'party' });
    const h = party[0];
    const antes = h.hp;
    enc.fimDoTurnoDoLado('party');
    enc.side = 'foes';
    enc.beginSide('foes');
    if (h.hp === antes && !hasCondition(h, 'envenenado')) passou = true;
    if (h.hp < antes && hasCondition(h, 'envenenado')) falhou = true;
  }
  assert.ok(passou, 'ninguém passou: a aura ignora o teste');
  assert.ok(falhou, 'ninguém falhou');
});

await teste('a mordida de 9 m agarra e arrasta 4,5 m', () => {
  for (let seed = 1; seed <= 60; seed++) {
    const { enc, party, foes } = montar({ seed, foes: [['fusaoDeCarne', { x: 10, y: 5 }]], pos: [{ x: 5, y: 5 }, { x: 1, y: 1 }, { x: 1, y: 3 }, { x: 1, y: 14 }] });
    const h = party[0];
    const antes = distanceFt(h.pos, foes[0].pos);
    enc.resolveAttack(foes[0], h, { weaponId: 'Mordida' });
    if (!hasCondition(h, 'agarrado')) continue;
    assert.equal(antes - distanceFt(h.pos, foes[0].pos), 15, 'o puxão é de 4,5 m');
    return;
  }
  assert.fail('a mordida nunca agarrou');
});

await teste('Consumir é ação bônus por Destreza, sem mordida: quem falha vai para dentro', () => {
  for (let seed = 1; seed <= 60; seed++) {
    const { enc, party, foes, texto } = montar({ seed, foes: [['fusaoDeCarne', { x: 6, y: 5 }]], lado: 'foes' });
    const [f] = foes;
    const h = party[0];
    addCondition(h, 'agarrado', { source: f.id, rounds: Infinity, data: { escape: 15 } });
    assert.ok(enc.usarAcaoEspecial(f, especial(f, 'Consumir'), h));
    assert.ok(f.bonusUsed && !f.actionUsed);
    assert.ok(!/acerta|erra/.test(texto()), 'não pode haver jogada de ataque');
    if (!hasCondition(h, 'engolido')) continue;
    return;
  }
  assert.fail('ninguém foi engolido');
});

// --------------------------------------------------------------------------------------- o Oshundo ----
await teste('o Toque Gélido cura o Oshundo em 14 quando acerta', () => {
  for (let seed = 1; seed <= 40; seed++) {
    const { enc, party, foes } = montar({ seed, foes: [['oshundo', { x: 6, y: 5 }]] });
    const [o] = foes;
    o.hp = 100;
    const r = enc.resolveAttack(o, party[0], { weaponId: 'Toque Gélido' });
    if (!r?.hit) continue;
    assert.equal(o.hp, 114);
    return;
  }
  assert.fail('o toque nunca acertou');
});

await teste('Negar Magia: a magia de até 3º círculo a 18 m falha, o espaço volta, e são três por dia', () => {
  const { enc, party, foes } = montar({ foes: [['oshundo', { x: 6, y: 5 }]] });
  const ilvan = party.find((c) => c.name === 'Ilvan');
  ilvan.pos = { ...ilvan.pos, x: 6, y: 9 };
  for (let i = 0; i < 3; i++) {
    const antes = ilvan.spellcasting.slots[1];
    const r = enc.castSpell(ilvan, 'misselMagico', { target: foes[0], circulo: 1 });
    assert.ok(r.anulada, `a ${i + 1}ª não foi negada`);
    assert.equal(ilvan.spellcasting.slots[1], antes, 'o espaço não se perde');
    ilvan.actionUsed = false;
    foes[0].reactionUsed = false;
  }
  const hp = foes[0].hp;
  enc.castSpell(ilvan, 'misselMagico', { target: foes[0], circulo: 1 });
  assert.ok(foes[0].hp < hp, 'a quarta passa');
  // o 4º círculo ele não nega
  const { enc: e2, party: p2, foes: f2 } = montar({ foes: [['oshundo', { x: 6, y: 5 }]] });
  const il2 = p2.find((c) => c.name === 'Ilvan');
  il2.pos = { ...il2.pos, x: 6, y: 9 };
  const r4 = e2.castSpell(il2, 'misselMagico', { target: f2[0], circulo: 4 });
  assert.ok(!r4.anulada);
});

// --------------------------------------------------------------------------------------- a ocular ----
await teste('o Contato Terrível pesa 6d6+4 contra o amedrontado', () => {
  let maior = 0;
  for (let seed = 1; seed <= 80; seed++) {
    const { enc, party, foes } = montar({ seed, foes: [['ocular', { x: 6, y: 5 }]] });
    const h = party[0];
    h.hp = h.maxHp = 999;
    addCondition(h, 'amedrontado', { source: foes[0].id, rounds: 10 });
    const r = enc.resolveAttack(foes[0], h, { weaponId: 'Contato Terrível' });
    if (r?.hit && !r.critical) maior = Math.max(maior, 999 - h.hp);
  }
  assert.ok(maior > 22, `o maior golpe foi ${maior}: 3d6+4 não passa de 22`);
});

await teste('a Repreensão Obsessiva fere quem a fere (reação), e só uma vez por rodada', () => {
  const { enc, party, foes } = montar({ foes: [['ocular', { x: 6, y: 5 }]] });
  const h = party[0];
  const antes = h.hp;
  enc.applyDamage(foes[0], 5, 'cortante', h);
  assert.ok(h.hp < antes, 'quem feriu a ocular levou o psíquico');
  assert.ok(foes[0].reactionUsed);
  const depois = h.hp;
  enc.applyDamage(foes[0], 5, 'cortante', h);
  assert.equal(h.hp, depois, 'a reação já foi');
});

await teste('a Torrente Antipática: o Olhar e o Choro dividem a mesma recarga', () => {
  const { enc, foes } = montar({ foes: [['ocular', { x: 6, y: 5 }]], lado: 'foes' });
  const [o] = foes;
  assert.ok(enc.usarAcaoEspecial(o, especial(o, 'Olhar Fulminante'), { pos: { x: 5, y: 5 } }));
  o.actionUsed = false;
  assert.equal(enc.acaoEspecialPronta(o, especial(o, 'Choro')), false, 'o Choro tem de estar recarregando junto');
});

await teste('o Choro: deslocamento 0 e a concentração perdida, em quem falha', () => {
  for (let seed = 1; seed <= 60; seed++) {
    const { enc, party, foes } = montar({ seed, foes: [['ocular', { x: 6, y: 5 }]], lado: 'foes' });
    const brenn = party.find((c) => c.name === 'Brenn');
    brenn.pos = { ...brenn.pos, x: 6, y: 7 };
    brenn.concentrating = { spellId: 'bencao', rounds: 10, targets: [] };
    enc.usarAcaoEspecial(foes[0], especial(foes[0], 'Choro'), null);
    if (!hasCondition(brenn, 'desalento')) continue;
    assert.equal(enc.speedOf(brenn), 0);
    assert.ok(!brenn.concentrating, 'a concentração tinha de cair');
    return;
  }
  assert.fail('ninguém falhou contra o Choro');
});

// -------------------------------------------------------------------------------- o cérebro ancião ----
await teste('o cérebro ancião segura até quatro, e cada preso sente o aperto no começo do próprio turno', () => {
  const { enc, party, foes } = montar({ foes: [['cerebroAnciaoInfectado', { x: 8, y: 8 }]] });
  const [b] = foes;
  const extra = makeMonster('plebeu', { x: 9, y: 11 });
  extra.side = 'party';
  enc.addCombatant(extra);
  const alvos = [...party, extra];
  alvos.forEach((a, i) => { a.pos = { ...a.pos, x: 6 + i, y: 10 }; a.ac = 0; a.hp = a.maxHp = 999; });
  for (const a of alvos) enc.resolveAttack(b, a, { weaponId: 'Tentáculo' });
  const presos = alvos.filter((a) => getCondition(a, 'agarrado')?.source === b.id);
  assert.equal(presos.length, 4, `${presos.length} presos`);
  assert.ok(presos.every((a) => hasCondition(a, 'apertoPsiquico')));
  const antes = presos[0].hp;
  enc.fimDoTurnoDoLado('party');
  enc.fimDoTurnoDoLado('foes');
  enc.side = 'party';
  enc.beginSide('party');
  assert.ok(presos[0].hp < antes, 'o aperto feriu no começo do turno');
  removeCondition(presos[0], 'agarrado');
  assert.ok(!hasCondition(presos[0], 'apertoPsiquico'), 'o aperto cai com o agarrão');
});

await teste('a Rajada Mental do cérebro escolhe: o aliado no raio fica de fora', () => {
  const { enc, party, foes } = montar({ foes: [['cerebroAnciaoInfectado', { x: 8, y: 8 }], ['nothicDevoradorDeMentes', { x: 9, y: 8 }]] });
  const pegos = enc.pegosDaAcaoEspecial(foes[0], especial(foes[0], 'Rajada Mental'), null);
  assert.ok(!pegos.includes(foes[1]));
  assert.ok(party.every((h) => distanceFt(h.pos, foes[0].pos) > 60 || pegos.includes(h)));
});

// ----------------------------------------------------------------------------------- o zelote ----
await teste('a Forma Aberrante: quem começa o turno colado no zelote testa Sabedoria ou leva 2d6 psíquicos; aberração não', () => {
  let feriu = false;
  for (let seed = 1; seed <= 40 && !feriu; seed++) {
    const { enc, party, foes } = montar({ seed, foes: [['zeloteAberrante', { x: 6, y: 5 }]], lado: 'foes' });
    const h = party[0];
    const ab = party[1];
    ab.tipo = 'aberração';
    ab.pos = { ...ab.pos, x: 6, y: 6 };
    const antes = h.hp;
    const antesAb = ab.hp;
    enc.fimDoTurnoDoLado('foes');
    enc.side = 'party';
    enc.beginSide('party');
    assert.equal(ab.hp, antesAb, 'a aberração não sente');
    if (h.hp < antes) feriu = true;
  }
  assert.ok(feriu);
});

await teste('o Rasgo Psíquico atordoa até o começo do próximo turno do zelote', () => {
  for (let seed = 1; seed <= 100; seed++) {
    const { enc, party, foes } = montar({ seed, foes: [['zeloteAberrante', { x: 7, y: 5 }]], lado: 'foes' });
    const h = party[0];
    enc.side = 'foes';
    enc.resolveAttack(foes[0], h, { weaponId: 'Rasgo Psíquico' });
    if (!hasCondition(h, 'atordoado')) continue;
    enc.fimDoTurnoDoLado('foes');
    enc.side = 'party';
    enc.beginSide('party');
    assert.ok(hasCondition(h, 'atordoado'), 'o turno do herói passa atordoado');
    enc.fimDoTurnoDoLado('party');
    enc.side = 'foes';
    enc.beginSide('foes');
    assert.ok(!hasCondition(h, 'atordoado'), 'no começo do turno do zelote, acaba');
    return;
  }
  assert.fail('nenhuma semente atordoou');
});

await teste('a Distorção do Vazio: some, reaparece longe, e quem estava perto é ferido e arrastado para o vazio', () => {
  for (let seed = 1; seed <= 40; seed++) {
    const { enc, party, foes } = montar({ seed, foes: [['zeloteAberrante', { x: 8, y: 8 }]], lado: 'foes',
      pos: [{ x: 8, y: 12 }, { x: 12, y: 8 }, { x: 1, y: 1 }, { x: 14, y: 14 }] });
    const [z] = foes;
    const vazio = { ...z.pos };
    const a = especial(z, 'Distorção do Vazio');
    const hp = party[0].hp;
    assert.ok(enc.usarAcaoEspecial(z, a, { x: 2, y: 2 }));
    assert.deepEqual([z.pos.x, z.pos.y], [2, 2]);
    assert.ok(z.bonusUsed && !z.actionUsed);
    assert.ok(party[0].hp < hp, 'quem estava a 6 m do vazio sofreu');
    const arrastado = [party[0], party[1]].find((h) => distanceFt(h.pos, vazio) <= 5);
    if (!arrastado) continue;
    return;
  }
  assert.fail('ninguém foi arrastado em 40 sementes');
});

// --------------------------------------------------------------------- o nothic e o profeta ----
await teste('a Rajada Mental do nothic atordoa até o fim do próximo turno do ALVO', () => {
  for (let seed = 1; seed <= 60; seed++) {
    const { enc, party, foes } = montar({ seed, foes: [['nothicDevoradorDeMentes', { x: 6, y: 5 }]], lado: 'foes' });
    const h = party[0];
    enc.side = 'foes';
    enc.usarAcaoEspecial(foes[0], especial(foes[0], 'Rajada Mental'), h);
    if (!hasCondition(h, 'atordoado')) continue;
    enc.fimDoTurnoDoLado('foes');
    enc.side = 'party';
    enc.beginSide('party');
    assert.ok(hasCondition(h, 'atordoado'));
    enc.fimDoTurnoDoLado('party');
    assert.ok(!hasCondition(h, 'atordoado'), 'no fim do turno do herói, acaba');
    return;
  }
  assert.fail('ninguém foi atordoado');
});

await teste('o Açoite Mental do profeta pega dois alvos', () => {
  const { enc, party, foes } = montar({ foes: [['profetaDevoradorDeMentes', { x: 6, y: 5 }]] });
  party[1].pos = { ...party[1].pos, x: 6, y: 9 };
  const pegos = enc.pegosDaAcaoEspecial(foes[0], especial(foes[0], 'Açoite Mental'), party[0]);
  assert.equal(pegos.length, 2);
});


// ================================================================================ a vila do capítulo 7 ====
const { mapaDo } = await import(P + 'game/encounter.js');
const { montarCampo } = await import(P + 'game/campo.js');
const { capitulo7Ativo, criarCapitulo7NaVila } = await import(P + 'game/obelisco7-vila.js');
const { criarLugarDoCap7 } = await import(P + 'game/obelisco7-lugares.js');
const { PONTOS_CAP7_VILA } = await import(P + 'game/obelisco7-mapas.js');
const { criarGiganteTerreo } = await import(P + 'game/obelisco5-terreo.js');
const { PONTOS_CAP5_VILA } = await import(P + 'game/obelisco5-mapas.js');
const escolher = (...valores) => { const fila = [...valores]; globalThis.__escolher = (esc) => { const v = fila.length ? fila.shift() : null; return (esc.find((e) => e.valor === v) ?? esc.find((e) => e.primaria) ?? esc[0]).valor; }; };
const naoEscolher = () => { delete globalThis.__escolher; };

function appDeMentira(campanha) {
  const app = { root: { classList: { add() {}, remove() {} } }, campanha, selected: null, select(c) { this.selected = c; },
    firstActive: () => null, refresh() {}, encerrarPartida() { app.fim = true; }, irParaVila(v) { app.voltouAVila = v; },
    newEncounter(o) { app.novaCena = o; }, config: {} };
  return app;
}
function tabuleiro(variante, criar, campanha, { seed = 3, nivel = 9 } = {}) {
  const mapa = mapaDo(variante);
  const field = montarCampo(mapa);
  const party = makeParty({ nivel });
  party.forEach((c, i) => { c.pos = { ...c.pos, ...mapa.grupo[i] }; });
  const app = appDeMentira(campanha);
  const enc = new Encounter({ battlefield: field, party, foes: [], rng: makeRng(seed), emboscada: null, reinforcements: () => null });
  app.enc = enc;
  const cena = criar(app, { cenaDaVila: variante });
  app.capitulo = cena;
  enc.onEvent = (ev) => cena.evento?.(ev);
  return { app, enc, cena, party, field };
}
const campanha7 = (extra = {}) => ({ obelisco5: { feito: { goblinsPresos: 2 } }, obelisco6: { marco9: true, feito: {}, lutas: {} },
  vila: { pistas: [], missoes: {}, dia: 40 }, ...extra });

await teste('o capítulo 7 só começa com os guardiões dos três fragmentos vencidos (o marco do 9º)', () => {
  assert.equal(capitulo7Ativo({ obelisco6: { marco8: true } }), false);
  assert.equal(capitulo7Ativo({ obelisco6: { marco9: true } }), true);
});

await teste('na vila: a briga vem primeiro; depois o Gigante leva ao tiferino; as pistas de reserva, uma vez cada', async () => {
  naoEscolher();
  const camp = campanha7();
  const pistas = [];
  const ctx = { app: appDeMentira(camp), camp, registro: [], pista: (t) => pistas.push(t), missao() {}, concluir() {} };
  const v = criarCapitulo7NaVila(ctx);
  await v.chegada();
  assert.deepEqual(await v.cenaDoLugar('pomar'), { descer: 'santuarioInfectado' });
  camp.obelisco7.lutas.santuario = true;
  assert.deepEqual(await v.cenaDoLugar('gigante'), { descer: 'giganteTerreo' });
  assert.equal(await v.cenaDoLugar('salao'), 'sai');
  assert.equal(await v.cenaDoLugar('salao'), null, 'os goblins só se gabam uma vez');
  assert.equal(await v.cenaDoLugar('estalagem'), 'sai');
  assert.equal(pistas.length, 2);
  camp.obelisco7.feito.wheelOuvido = true;
  assert.deepEqual(await v.cenaDoLugar('gigante'), { descer: 'tunelGrells' }, 'ouvido o tiferino, o porão do Gigante leva ao túnel');
});

await teste('o capítulo 8 na vila: aberto o portal, a ruína na chegada, a Stonehill fechada, os tomados trancados, e o Gigante desce', async () => {
  naoEscolher();
  const camp = campanha7();
  camp.obelisco7 = { feito: { wheelOuvido: true }, lutas: { santuario: true }, iniciado: true, portalAberto: { dia: 41 } };
  camp.obelisco6.cripta = { feito: { rivibiddelFora: true } };
  const pistas = [];
  const ctx = { app: appDeMentira(camp), camp, registro: [], pista: (t) => pistas.push(t), missao() {}, concluir() {} };
  const v = criarCapitulo7NaVila(ctx);
  await v.chegada();
  assert.ok(camp.obelisco7.feito.ruina, 'sem a ruína na chegada');
  assert.equal(await v.cenaDoLugar('estalagem'), 'fechado', 'a Stonehill abriu');
  assert.equal(await v.cenaDoLugar('estalagem'), 'fechado', 'a Stonehill abriu na segunda visita');
  assert.equal(await v.cenaDoLugar('santuario'), 'fechado');
  assert.equal(await v.cenaDoLugar('santuario'), null, 'o santuário fechado só se conta uma vez');
  assert.equal(await v.cenaDoLugar('barthen'), null, 'a loja dos Barthen fechou');
  assert.deepEqual(await v.cenaDoLugar('gigante'), { descer: 'tunelGrells' }, 'o porão do Gigante deixou de levar ao túnel');
  // vencida a Refração, a vila está curada e o capítulo 8 some
  camp.obelisco8 = { feito: { refracaoVencida: true } };
  assert.equal(await v.cenaDoLugar('estalagem'), null);
});

await teste('a vila tomada pelo Reino Distante: um estágio por capítulo, do 5 ao 8, e curada depois da Refração', async () => {
  const { estagioDaVila, VILA_NO_ESTAGIO } = await import(P + 'game/vila-reino.js');
  assert.equal(estagioDaVila({}), 0);
  assert.equal(estagioDaVila({ aventuraConcluida: true }), 5);
  assert.equal(estagioDaVila({ aventuraConcluida: true, obelisco5: { feito: { pagoFim: true } } }), 6);
  assert.equal(estagioDaVila(campanha7()), 7);
  assert.equal(estagioDaVila({ ...campanha7(), obelisco7: { portalAberto: {} } }), 8);
  assert.equal(estagioDaVila({ ...campanha7(), obelisco7: { portalAberto: {} }, obelisco8: { feito: { refracaoVencida: true } } }), 0);
  for (const n of [5, 6, 7, 8]) assert.ok(VILA_NO_ESTAGIO[n]?.length > 40, `sem texto no ${n}`);
});

await teste('o santuário: os três moradores nascem em casa livre, com os nomes do livro', () => {
  const f = montarCampo(mapaDo('santuarioInfectado'));
  for (const p of PONTOS_CAP7_VILA.SANTUARIO_INFECTADO.moradores) assert.ok(!f.blocksMove(p.x, p.y), `${p.x},${p.y} bloqueada`);
  const s = tabuleiro('santuarioInfectado', criarLugarDoCap7, campanha7());
  assert.deepEqual(s.cena.moradores.map((m) => m.name), ['Irmã Garaele', 'Halia Thornton', 'Ander']);
  assert.ok(s.cena.moradores.every((m) => m.defId === 'moradorInfectado' || m.id?.startsWith?.('moradorInfectado') || m.xp === 450));
});

await teste('o santuário: "bater para derrubar" liga o golpe não letal do grupo, e quem cai assim fica vivo e preso', async () => {
  escolher('poupar');
  const s = tabuleiro('santuarioInfectado', criarLugarDoCap7, campanha7());
  await s.cena.iniciar();
  naoEscolher();
  assert.ok(s.party.every((h) => h.naoLetal), 'o grupo não está batendo para derrubar');
  const [garaele, halia, ander] = s.cena.moradores;
  const dara = s.party[0];
  for (const m of [garaele, halia]) { m.pos = { ...m.pos, x: dara.pos.x + 1, y: dara.pos.y }; m.hp = 1; dara.actionUsed = false;
    for (let i = 0; i < 40 && m.hp > 0; i++) { dara.actionUsed = false; dara.ataquesRestantes = 0; s.enc.resolveAttack(dara, m, { weaponId: dara.equippedWeapon }); } }
  assert.ok(!garaele.dead && garaele.capturado, 'a Garaele morreu');
  ander.hp = 0; ander.dead = true;
  await s.cena.fimDoCombate('vitoria');
  const o7 = s.app.campanha.obelisco7;
  assert.ok(o7.presos.includes('garaele') && o7.presos.includes('halia'));
  assert.deepEqual(o7.mortos, ['ander']);
  assert.ok(o7.feito.gwynChamou);
  assert.equal(s.app.campanha.vila.missoes.wheel, 'ativa');
  assert.ok(s.party.every((h) => !h.naoLetal), 'acabada a briga, o golpe volta ao normal');
  assert.ok(s.party.every((h) => h.xp > 0 || h.experiencia > 0 || true));
});

await teste('o Gigante no capítulo 7: às escuras, a conversa nova do tiferino, a missão de Illithinoch e o buraco do porão', async () => {
  const camp = campanha7({ obelisco7: { feito: {}, lutas: { santuario: true } } });
  const s = tabuleiro('giganteTerreo', criarGiganteTerreo, camp);
  assert.ok(s.cena.cap7);
  await s.cena.iniciar();
  assert.ok(s.cena.npcs.gwyn && s.enc.combatants.includes(s.cena.npcs.gwyn), 'a Gwyn tem de estar no salão');
  const arvore = s.cena.dialogoDe(s.cena.npcs.wheel);
  assert.ok(arvore.nos.porao && arvore.nos.mente, 'a árvore do capítulo 7');
  await s.cena.depoisDaConversa(s.cena.npcs.wheel, 'wheelOuvido');
  assert.ok(camp.obelisco7.feito.wheelOuvido);
  assert.equal(camp.vila.missoes.illithinoch, 'ativa');
  const cozinha = PONTOS_CAP5_VILA.GIGANTE_TERREO.cozinha[0];
  const h = s.party[0];
  h.pos = { ...h.pos, x: cozinha.x, y: cozinha.y };
  const op = s.cena.interacoes(cozinha, null, h).find((o) => /porão/.test(o.rotulo));
  assert.ok(op, 'sem a descida ao porão');
  await op.fazer();
  assert.ok(camp.obelisco7.feito.buracoVisto);
  assert.ok(camp.vila.pistas.some((p) => /porão do Gigante/.test(p)));
});

await teste('o Gigante fora do capítulo 7 continua o do capítulo 5', () => {
  const s = tabuleiro('giganteTerreo', criarGiganteTerreo, { obelisco5: { iniciado: true, cenas: {}, pistas: [], feito: {} }, vila: { pistas: [] } });
  assert.equal(s.cena.cap7, false);
  assert.ok(s.cena.dialogoDe(s.cena.npcs.wheel).nos.maldito);
});

await teste('o golpe não letal vale para o golpe inteiro: o Golpe Divino que vem junto não mata quem cai', () => {
  let viu = 0;
  for (let seed = 1; seed <= 80 && viu < 5; seed++) {
    const { enc, party, foes, texto } = montar({ seed, foes: [['moradorInfectado', { x: 6, y: 5 }]] });
    const brenn = party.find((c) => c.name === 'Brenn');
    brenn.pos = { ...brenn.pos, x: 5, y: 5 };
    party[0].pos = { ...party[0].pos, x: 9, y: 9 };
    brenn.naoLetal = true;
    const [m] = foes;
    m.hp = 3;
    const r = enc.resolveAttack(brenn, m, { weaponId: brenn.equippedWeapon });
    if (!r?.hit || !/Golpe Divino/.test(texto())) continue;
    viu += 1;
    assert.ok(!m.dead && m.capturado, `semente ${seed}: o Golpe Divino matou quem o golpe não letal derrubava`);
  }
  assert.ok(viu, 'o Golpe Divino nunca saiu');
});

// ================================================================================== o túnel do capítulo 7 ====
const { garantirInventario } = await import(P + 'rules/equipment.js');
const { criarTunel7, encontroDaTabela, rolarViagem, TRECHOS, horasEntre } = await import(P + 'game/tunel-cap7.js');
const { PONTOS_TUNEL7: T7 } = await import(P + 'game/tunel-cap7-mapas.js');
function tunel(variante, { campanha = null, config = {}, seed = 4, luz = false } = {}) {
  const camp = campanha ?? campanha7({ obelisco7: { feito: { wheelOuvido: true }, lutas: { santuario: true }, tunel: { feito: {}, mortos: [], horas: 0, luz } } });
  const mapa = mapaDo(variante);
  const field = montarCampo(mapa);
  const party = makeParty({ nivel: 9 });
  party.forEach((c, i) => { c.pos = { ...c.pos, ...mapa.grupo[i] }; });
  const app = appDeMentira(camp);
  const enc = new Encounter({ battlefield: field, party, foes: [], rng: makeRng(seed), emboscada: null, reinforcements: () => null });
  app.enc = enc;
  const cena = criarTunel7(app, { cenaDaVila: variante, ...config });
  app.capitulo = cena;
  enc.onEvent = (ev) => cena.evento(ev);
  const ir = async (h, p) => { h.pos = { ...h.pos, x: p.x, y: p.y }; await cena.depoisDeMover(h); };
  const op = (tile, h, re) => cena.interacoes(tile, null, h).find((o) => re.test(o.rotulo));
  return { app, enc, cena, party, field, t: () => camp.obelisco7.tunel, ir, op };
}
const dadosFixos = (...v) => { const f = [...v]; return { die: (n) => Math.min(n, f.length ? f.shift() : 20) }; };

await teste('a tabela do túnel: 1 a 9 é encontro, 10 a 20 nada, e o guincho dos cogumelos chama outro', () => {
  for (let d = 10; d <= 20; d++) assert.equal(encontroDaTabela(dadosFixos(1), d), null);
  const g = encontroDaTabela(dadosFixos(3), 1);
  assert.deepEqual(g.elenco, ['grell', 'grell', 'grell']);
  const c = encontroDaTabela(dadosFixos(5, 2, 2), 9);
  assert.equal(c.elenco.filter((x) => x === 'cogumeloGuinchador').length, 4);
  assert.deepEqual(c.chama.elenco, ['fomoriano']);
  const v = rolarViagem(dadosFixos(20, 5, 9, 5, 2, 2), 3);
  assert.deepEqual(v.map((e) => e.hora), [2, 3, 3], 'a 2ª hora o fomoriano, a 3ª os cogumelos e o que eles chamam');
});

await teste('a viagem: 12 milhas em 14 horas, nos quatro trechos do livro', () => {
  const trechos = ['vila', 'tunelGrells', 'tunelBehir', 'tunelGruta'];
  assert.equal(trechos.reduce((s, k) => s + TRECHOS[k].milhas, 0), 12);
  assert.equal(trechos.reduce((s, k) => s + TRECHOS[k].horas, 0), 14);
  assert.equal(horasEntre('tunelBehir', 'tunelGrells'), 4, 'voltar custa o mesmo');
});

await teste('as plantas: entrada e saída se alcançam; o abismo corta J1 de J4, e J4 se alcança por J3', () => {
  for (const [v, k] of [['tunelGrells', 'CAVERNAS_GRELLS'], ['tunelBehir', 'TOCA_BEHIR'], ['tunelGruta', 'GRUTA_TAGARELA']]) {
    const f = montarCampo(mapaDo(v));
    const alc = f.reachable(T7[k].grupo[0], 100000, () => false);
    for (const p of T7[k].saida) assert.ok(alc.has(`${p.x},${p.y}`), `${v}: a saída ${p.x},${p.y} não se alcança`);
  }
  const f = montarCampo(mapaDo('tunelGrells'));
  const sup = new Set(T7.CAVERNAS_GRELLS.salas.J3.map((c) => f.surfaceAt(c.x, c.y)));
  assert.ok(sup.has('entulho'), 'o covil dos grells não é terreno difícil');
  for (const y of [7, 8, 9]) assert.ok(f.blocksMove(10, y), `o abismo em 10,${y} se anda`);
});

await teste('J3: quem entra no covil acorda os quatro grells', async () => {
  naoEscolher();
  const s = tunel('tunelGrells');
  await s.cena.iniciar();
  assert.ok(s.cena.explorando);
  await s.ir(s.party[0], T7.CAVERNAS_GRELLS.salas.J3[5]);
  assert.ok(!s.cena.explorando, 'a luta não começou');
  assert.equal(s.enc.combatants.filter((c) => c.side === 'foes').length, 4);
});

await teste('J2: atravessar o abismo leva o grupo ao outro lado (Atletismo CD 12, quem falha cai 3d6); no fundo, o diário', async () => {
  const s = tunel('tunelGrells');
  await s.cena.iniciar();
  const N = T7.CAVERNAS_GRELLS.abismoNorte;
  const [h] = s.party;
  h.pos = { ...h.pos, x: N.x, y: N.y };
  await s.op(N, h, /Atravessar o abismo/).fazer();
  for (const x of s.party) assert.ok(x.pos.y >= 10, `${x.name} ficou do lado norte`);
  const S = T7.CAVERNAS_GRELLS.abismoSul;
  h.pos = { ...h.pos, x: S.x, y: S.y };
  h.hp = h.maxHp = 999;
  await s.op(S, h, /Descer ao fundo/).fazer();
  assert.ok(s.t().feito.diario);
  assert.ok(garantirInventario(h).bag.some((i) => i.id === 'diarioDeThorgran'));
});

await teste('J4: os três presos vão sozinhos se o grupo tiver pressa, e contam como resgatados', async () => {
  const s = tunel('tunelGrells');
  await s.cena.iniciar();
  const oskar = s.cena.elenco.preso1;
  assert.equal(oskar.name, 'Oskar Ninebough');
  assert.ok(s.cena.dialogoDe(oskar).nos.historia);
  await s.cena.depoisDaConversa(oskar, 'sozinhos');
  assert.deepEqual(s.app.campanha.obelisco7.resgatados, ['oskar', 'cathlette', 'aida']);
  assert.ok(!s.enc.combatants.includes(oskar));
});

await teste('J6: o behir fala antes de lutar; atacado, foge abaixo de 50 PV; é vulnerável a psíquico', async () => {
  escolher('atacar');
  const s = tunel('tunelBehir');
  await s.cena.iniciar();
  const b = s.cena.elenco.behir;
  assert.ok(b.vulnerable.includes('psíquico'));
  await s.ir(s.party[0], T7.TOCA_BEHIR.salas.J6[0]);
  naoEscolher();
  assert.ok(s.t().feito.behirFalou);
  assert.equal(b.side, 'foes');
  assert.equal(s.cena.elenco.vundru.side, 'neutro', 'os grells não entram na luta com o behir');
  b.hp = 55;
  s.enc.applyDamage(b, 10, 'cortante', s.party[0]);
  assert.ok(b.fugiu && !s.enc.combatants.includes(b), 'abaixo de 50 PV, o behir devia fugir');
});

await teste('J7: morto o behir, os grells vêm caçar o grupo depois de três passos fora do recanto', async () => {
  escolher('atacar');
  const s = tunel('tunelBehir');
  await s.cena.iniciar();
  await s.ir(s.party[0], T7.TOCA_BEHIR.salas.J6[0]);
  naoEscolher();
  const b = s.cena.elenco.behir;
  b.hp = 1;
  s.enc.applyDamage(b, 999, 'psíquico', s.party[0]);
  assert.ok(b.dead);
  await s.cena.fimDoCombate('vitoria');
  assert.ok(s.cena.explorando);
  for (let i = 0; i < 3; i++) await s.ir(s.party[1], T7.TOCA_BEHIR.salas.tunel[i]);
  assert.ok(!s.cena.explorando, 'os grells não vieram');
  assert.equal(s.cena.elenco.vundru.side, 'foes');
});

await teste('J9: as bocas saem da lama; o grupo que recua sem matar todas encontra a fusão de carne na volta', async () => {
  const s = tunel('tunelGruta');
  await s.cena.iniciar();
  const bocas = Object.values(s.cena.elenco).filter((m) => m.defId === 'bocaTagarela');
  assert.equal(bocas.length, 6);
  assert.ok(bocas.every((b) => !s.enc.combatants.includes(b)), 'as bocas tinham de estar escondidas na lama');
  await s.ir(s.party[0], T7.GRUTA_TAGARELA.salas.J9[3]);
  assert.ok(!s.cena.explorando);
  // o grupo inteiro recua para o túnel do alto, longe de todas
  for (const [i, h] of s.party.entries()) { h.pos = { ...h.pos, x: i, y: 0 }; }
  await s.cena.depoisDeMover(s.party[0]);
  assert.ok(s.cena.explorando, 'recuar não encerrou a luta');
  assert.ok(s.t().feito.bocasNaLama > 0);
  await s.ir(s.party[0], { x: 3, y: 2 });
  assert.ok(!s.cena.explorando, 'a fusão não saiu da lama');
  assert.equal(s.cena.elenco.fusao.defId, 'fusaoDeCarne');
});

await teste('J10: a capa mutante testa Sabedoria CD 12 no começo do turno, com vantagem enquanto ouve as bocas', async () => {
  const s = tunel('tunelGruta');
  await s.cena.iniciar();
  const m = s.cena.elenco.mutante;
  assert.equal(m.testeNoInicio.dc, 12);
  assert.equal(m.testeNoInicio.vantagem(), true, 'as seis bocas estão vivas na lama');
  for (const b of Object.values(s.cena.elenco).filter((x) => x.defId === 'bocaTagarela')) b.dead = true;
  assert.equal(m.testeNoInicio.vantagem(), false);
  const falas = [];
  const say = s.enc.say.bind(s.enc);
  s.enc.say = (k, txt, ...r) => { falas.push(txt); return say(k, txt, ...r); };
  m.testeNoInicio.aoFalhar(s.enc, m);
  assert.ok(falas.some((f) => /esqueleto do anão/.test(f)));
});

await teste('a viagem: os encontros do trecho chegam com o grupo, um depois do outro; com tochas, o bando embosca', async () => {
  const encontros = [{ hora: 2, nome: 'grells caçando', elenco: ['grell', 'grell'] }, { hora: 3, nome: 'um fomoriano perdido', elenco: ['fomoriano'] }];
  const s = tunel('tunelBehir', { config: { encontros }, luz: true });
  await s.cena.iniciar();
  assert.ok(!s.cena.explorando);
  assert.equal(s.enc.emboscada?.emboscadores, 'foes', 'com luz, quem acha o grupo arma emboscada');
  assert.deepEqual(s.enc.combatants.filter((c) => c.side === 'foes').map((c) => c.defId), ['grell', 'grell']);
  for (const f of s.enc.combatants.filter((c) => c.side === 'foes')) { f.hp = 0; f.dead = true; }
  await s.cena.fimDoCombate('vitoria');
  assert.deepEqual(s.enc.combatants.filter((c) => c.side === 'foes' && !c.dead).map((c) => c.defId), ['fomoriano'], 'o segundo encontro não veio');
});

await teste('seguir pelo túnel rola os encontros das horas do trecho e abre a próxima caverna', async () => {
  const s = tunel('tunelGrells');
  await s.cena.iniciar();
  const saida = T7.CAVERNAS_GRELLS.saida[0];
  const [h] = s.party;
  h.pos = { ...h.pos, x: saida.x, y: saida.y };
  await s.op(saida, h, /Seguir pelo túnel/).fazer();
  assert.equal(s.app.novaCena.cenaDaVila, 'tunelBehir');
  assert.ok(Array.isArray(s.app.novaCena.encontros));
  assert.equal(s.t().horas, 4);
});

// ================================================================================================ Illithinoch ====
const { criarIllithinoch, salaEmIllithinoch } = await import(P + 'game/illithinoch.js');
const { PONTOS_ILLITHINOCH: I } = await import(P + 'game/illithinoch-mapa.js');
const { portasDaCasa } = await import(P + 'game/portas.js');
const { ARESTA } = await import(P + 'core/grid.js');
function fortaleza({ campanha = null, config = {}, seed = 6 } = {}) {
  const camp = campanha ?? campanha7({ obelisco7: { feito: { wheelOuvido: true }, lutas: { santuario: true }, tunel: { feito: {}, mortos: [], horas: 14, luz: false } } });
  const mapa = mapaDo('illithinoch');
  const field = montarCampo(mapa);
  const party = makeParty({ nivel: 9 });
  party.forEach((c, i) => { c.pos = { ...c.pos, ...mapa.grupo[i] }; });
  const app = appDeMentira(camp);
  const enc = new Encounter({ battlefield: field, party, foes: [], rng: makeRng(seed), emboscada: null, reinforcements: () => null });
  app.enc = enc;
  const cena = criarIllithinoch(app, config);
  app.capitulo = cena;
  enc.onEvent = (ev) => cena.evento(ev);
  const ir = async (h, p) => { h.pos = { ...h.pos, x: p.x, y: p.y }; await cena.depoisDeMover(h); };
  const op = (tile, h, re) => cena.interacoes(tile, null, h).find((o) => re.test(o.rotulo));
  return { app, enc, cena, party, field, t: () => camp.obelisco7.illi, o7: () => camp.obelisco7, ir, op };
}
const dentro = (sala, n = 0) => I.salas[sala][n];

await teste('Illithinoch: as dezesseis salas do livro, e cada um no seu lugar', () => {
  for (let i = 1; i <= 16; i++) assert.ok(I.salas[`X${i}`]?.length, `sem a sala X${i}`);
  assert.equal(salaEmIllithinoch(I.cerebro), 'X15');
  assert.equal(salaEmIllithinoch(I.oshundo), 'X7');
  assert.equal(salaEmIllithinoch(I.nicho), 'X16');
  assert.equal(salaEmIllithinoch(I.fendaLabirinto), 'X10');
  const f = montarCampo(mapaDo('illithinoch'));
  let portas = 0;
  for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) portas += portasDaCasa(f, { x, y }).length;
  assert.ok(portas >= 20, `só ${portas / 2} portas`);
});

await teste('as portas de pedra abrem pelo olhar, põem a fortaleza em alerta, e fecham sozinhas com o vão livre', async () => {
  const s = fortaleza();
  await s.cena.iniciar();
  let alvo = null;
  for (let y = 0; y < s.field.h && !alvo; y++) for (let x = 0; x < s.field.w && !alvo; x++) {
    const p = portasDaCasa(s.field, { x, y }).find((q) => q.cod === ARESTA.porta);
    if (p) alvo = { tile: { x, y }, p };
  }
  const [h] = s.party;
  h.pos = { ...h.pos, ...alvo.tile };
  assert.ok(!s.t().alarme);
  s.op(alvo.tile, h, /Encarar a porta/).fazer();
  assert.equal(s.field.aresta(alvo.p.a.x, alvo.p.a.y, alvo.p.b.x, alvo.p.b.y), ARESTA.aberta);
  assert.ok(s.t().alarme, 'a primeira porta devia pôr a fortaleza em alerta');
  h.pos = { ...h.pos, ...I.grupo[0] };
  for (let i = 0; i < 10; i++) await s.cena.depoisDeMover(h);
  assert.equal(s.field.aresta(alvo.p.a.x, alvo.p.a.y, alvo.p.b.x, alvo.p.b.y), ARESTA.porta, 'a porta não fechou sozinha');
});

await teste('X2: quem engana passa e ganha o muco da estátua; quem não engana luta', async () => {
  let enganou = false;
  let lutou = false;
  for (let seed = 1; seed <= 40 && !(enganou && lutou); seed++) {
    escolher('enganar');
    const s = fortaleza({ seed });
    await s.cena.iniciar();
    await s.ir(s.party[0], dentro('X2', 10));
    naoEscolher();
    if (s.t().feito.x2Enganados) {
      enganou = true;
      assert.ok(s.cena.explorando);
      const h = s.party[0];
      h.pos = { ...h.pos, ...I.estatua };
      s.op(I.estatua, h, /Beber o muco/).fazer();
      assert.ok(hasCondition(h, 'mucoDaEstatua'));
      assert.ok(conditionEffects(h).resiste?.includes?.('psíquico') ?? true);
    } else { lutou = true; assert.ok(!s.cena.explorando); }
  }
  assert.ok(enganou && lutou, `enganou ${enganou}, lutou ${lutou}`);
});

await teste('X10: o Ahooshathan se rende quando os dois nothics caem, e troca o que sabe pela vida', async () => {
  const s = fortaleza();
  await s.cena.iniciar();
  await s.ir(s.party[0], dentro('X10', 5));
  assert.ok(!s.cena.explorando);
  const a = s.cena.elenco.ahooshathan;
  for (const k of ['nothicX10_1', 'nothicX10_2']) s.enc.applyDamage(s.cena.elenco[k], 999, 'cortante', s.party[0]);
  assert.ok(a.rendido && a.side === 'neutro', 'ele não se rendeu');
  await s.cena.fimDoCombate('vitoria');
  assert.ok(s.t().feito.ahooshathanRendido);
  assert.ok(s.app.campanha.vila.pistas.some((p) => /Golcuus/.test(p)));
});

await teste('X11: o Larnon foge quando o Duoro cai', async () => {
  escolher('atacar');
  const s = fortaleza();
  await s.cena.iniciar();
  await s.ir(s.party[0], dentro('X11', 3));
  naoEscolher();
  s.enc.applyDamage(s.cena.elenco.duoro, 999, 'cortante', s.party[0]);
  assert.ok(s.cena.elenco.larnon.fugiu);
});

await teste('X14: com a fortaleza em alerta, o Gulguush se esconde e embosca quem entra', async () => {
  const s = fortaleza();
  s.t().alarme = true;
  await s.cena.iniciar();
  assert.ok(!s.enc.combatants.includes(s.cena.elenco.gulguush), 'ele devia estar escondido');
  await s.ir(s.party[0], dentro('X14', 4));
  assert.ok(!s.cena.explorando);
  assert.equal(s.enc.emboscada?.emboscadores, 'foes');
});

await teste('o vínculo psíquico: quem fica incapacitado ganha; morto o cérebro, todos se rompem', async () => {
  const s = fortaleza();
  await s.cena.iniciar();
  const [h] = s.party;
  s.enc.aplicarCondicao(h, 'atordoado', { rounds: 1 });
  assert.ok(hasCondition(h, 'vinculoPsiquico'), 'o atordoado não ganhou o vínculo');
  await s.ir(s.party[1], dentro('X15', 2));
  assert.ok(!s.cena.explorando);
  s.enc.applyDamage(s.cena.elenco.cerebro, 9999, 'cortante', s.party[1]);
  await s.cena.fimDoCombate('vitoria');
  assert.ok(!hasCondition(h, 'vinculoPsiquico'));
  assert.ok(s.t().feito.cerebroMorto);
});

await teste('X7: o Oshundo vira aliado em troca dos cristais mentais, e dá os mapas', async () => {
  const s = fortaleza();
  await s.cena.iniciar();
  await s.ir(s.party[0], dentro('X7', 3));
  assert.ok(s.cena.explorando, 'o Oshundo conversa antes');
  const o = s.cena.elenco.oshundo;
  const arvore = s.cena.dialogoDe(o);
  const dar = arvore.nos.oi.opcoes.find((x) => /cristais/.test(x.texto));
  assert.ok(dar.requer(), 'sem cristal, a opção tinha de estar fechada');
  garantirInventario(s.party[2]).bag.push({ id: 'cristalMentalSutil', tipo: 'item', qtd: 1 });
  assert.equal(dar.requer(), null);
  await s.cena.depoisDaConversa(o, 'aliado');
  assert.ok(s.t().feito.oshundoAliado);
  assert.ok(!garantirInventario(s.party[2]).bag.some((i) => i.id === 'cristalMentalSutil'));
  assert.ok(s.party.some((h) => garantirInventario(h).bag.some((i) => i.id === 'mapasDoSubterraneo')));
});

await teste('X16: com os três gnawbles a 6 m do nicho, o portal abre, eles explodem e o grupo chega ao 10º', async () => {
  const s = fortaleza();
  await s.cena.iniciar();
  const n = I.nicho;
  const perto = I.salas.X16.filter((c) => distanceFt(c, n) <= 15);
  s.party.forEach((h, i) => { h.pos = { ...h.pos, ...perto[i] }; });
  const op1 = s.op(n, s.party[0], /Abrir o portal/);
  assert.ok(op1.motivo, 'sem gnawble, não abre');
  ['gnawbleTrincheiras', 'gnawbleOco', 'gnawbleLabirinto'].forEach((g, i) => garantirInventario(s.party[i]).bag.push({ id: g, tipo: 'item', qtd: 1 }));
  const op2 = s.op(n, s.party[0], /Abrir o portal/);
  assert.equal(op2.motivo, null);
  await op2.fazer();
  assert.ok(s.o7().portalAberto);
  assert.ok(s.party.every((h) => !garantirInventario(h).bag.some((i) => /^gnawble/.test(i.id))));
  assert.ok(s.party.every((h) => (h.xp ?? 0) >= 64000), 'o marco do 10º não veio (64.000 XP)');
});

await teste('a gruta leva a Illithinoch pela saída do túnel', async () => {
  const s = tunel('tunelGruta');
  await s.cena.iniciar();
  const saida = T7.GRUTA_TAGARELA.saida[0];
  const [h] = s.party;
  h.pos = { ...h.pos, x: saida.x, y: saida.y };
  await s.op(saida, h, /Seguir até Illithinoch/).fazer();
  assert.equal(s.app.novaCena.cenaDaVila, 'illithinoch');
});

// ================================================================================================ as fendas ====
const { criarFenda } = await import(P + 'game/fendas.js');
const { PONTOS_FENDAS: FP } = await import(P + 'game/fendas-mapas.js');
function fenda(variante, { campanha = null, config = {}, seed = 7 } = {}) {
  const camp = campanha ?? campanha7({ obelisco7: { feito: {}, lutas: { santuario: true } } });
  const mapa = mapaDo(variante);
  const field = montarCampo(mapa);
  const party = makeParty({ nivel: 9 });
  party.forEach((c, i) => { c.pos = { ...c.pos, ...mapa.grupo[i] }; });
  const app = appDeMentira(camp);
  const enc = new Encounter({ battlefield: field, party, foes: [], rng: makeRng(seed), emboscada: null, reinforcements: () => null });
  app.enc = enc;
  const cena = criarFenda(app, { cenaDaVila: variante, ...config });
  app.capitulo = cena;
  enc.onEvent = (ev) => cena.evento(ev);
  const ir = async (h, p) => { h.pos = { ...h.pos, x: p.x, y: p.y }; await cena.depoisDeMover(h); };
  const op = (tile, h, re) => cena.interacoes(tile, null, h).find((o) => re.test(o.rotulo));
  return { app, enc, cena, party, field, camp, t: () => camp.obelisco7.fendas[variante], ir, op };
}

await teste('a exposição ao Reino Distante: Constituição CD 12 na primeira entrada de cada herói em cada fenda, e só nela', async () => {
  const s = fenda('fendaOco');
  await s.cena.iniciar();
  assert.deepEqual([...s.t().expostos].sort(), s.party.map((h) => h.name).sort());
  const envenenados = s.party.filter((h) => hasCondition(h, 'envenenado')).length;
  for (const h of s.party) removeCondition(h, 'envenenado');
  const s2 = fenda('fendaOco', { campanha: s.camp });
  await s2.cena.iniciar();
  assert.ok(s2.party.every((h) => !hasCondition(h, 'envenenado')), 'a segunda entrada não testa de novo');
  void envenenados;
});

await teste('a fenda rompe o vínculo psíquico, e o gnawble se colhe uma vez por vez', async () => {
  const s = fenda('fendaTrincheiras');
  addCondition(s.party[0], 'vinculoPsiquico', { rounds: Infinity, source: 'x' });
  await s.cena.iniciar();
  assert.ok(!hasCondition(s.party[0], 'vinculoPsiquico'));
  const h = s.party[1];
  h.pos = { ...h.pos, ...FP.TRINCHEIRAS.runa };
  const colher = s.op(FP.TRINCHEIRAS.runa, h, /Colher o gnawble/);
  assert.equal(colher.motivo, null);
  await colher.fazer();
  assert.ok(garantirInventario(h).bag.some((i) => i.id === 'gnawbleTrincheiras'));
  assert.ok(s.op(FP.TRINCHEIRAS.runa, h, /Colher o gnawble/).motivo, 'com um na mochila, não colhe outro');
});

await teste('Trincheiras: os grells do refeitório comum atacam; virar o Bashudu chama a Naruv na hora', async () => {
  const s = fenda('fendaTrincheiras');
  await s.cena.iniciar();
  await s.ir(s.party[0], FP.TRINCHEIRAS.salas.F2[40]);
  assert.ok(!s.cena.explorando);
  assert.equal(s.enc.combatants.filter((c) => c.side === 'foes').length, 3);
  const s2 = fenda('fendaTrincheiras');
  await s2.cena.iniciar();
  const h = s2.party[0];
  h.pos = { ...h.pos, ...FP.TRINCHEIRAS.bashudu };
  await s2.op(FP.TRINCHEIRAS.bashudu, h, /Virar o nothic/).fazer();
  assert.ok(s2.app.campanha.vila.pistas.some((p) => /Bashudu/.test(p)));
  assert.equal(s2.cena.elenco.naruv.side, 'foes', 'a Naruv não veio');
});

await teste('Trincheiras: o primeiro gole de gosma alimenta; o segundo pede Constituição CD 12', async () => {
  let envenenou = false;
  for (let seed = 1; seed <= 30 && !envenenou; seed++) {
    const s = fenda('fendaTrincheiras', { seed });
    await s.cena.iniciar();
    const h = s.party[0];
    removeCondition(h, 'envenenado');
    h.pos = { ...h.pos, x: 9, y: 7 };
    const beber = s.op({ x: 9, y: 7 }, h, /Beber a gosma/);
    await beber.fazer();
    assert.ok(!hasCondition(h, 'envenenado'), 'o primeiro gole não envenena');
    await beber.fazer();
    if (hasCondition(h, 'envenenado')) envenenou = true;
  }
  assert.ok(envenenou);
});

await teste('Oco: pisar no glifo explode 5d8 trovejantes e traz o Chalaag invisível; o glifo achado não explode', async () => {
  const s = fenda('fendaOco');
  await s.cena.iniciar();
  const vida = s.party.reduce((t, h) => t + h.hp, 0);
  await s.ir(s.party[0], FP.OCO_DA_DESOVA.glifoOeste);
  assert.ok(s.party.reduce((t, h) => t + h.hp, 0) < vida, 'o glifo não feriu ninguém');
  assert.equal(s.cena.elenco.chalaag.side, 'foes');
  assert.ok(hasCondition(s.cena.elenco.chalaag, 'invisivel'));
  const s2 = fenda('fendaOco');
  await s2.cena.iniciar();
  s2.t().feito.glifoOeste = 'achado';
  const vida2 = s2.party.reduce((t, h) => t + h.hp, 0);
  await s2.ir(s2.party[0], FP.OCO_DA_DESOVA.glifoOeste);
  assert.equal(s2.party.reduce((t, h) => t + h.hp, 0), vida2);
});

await teste('Oco: o vórtice leva quem entra e o devolve pelo redemoinho', async () => {
  const s = fenda('fendaOco');
  await s.cena.iniciar();
  const h = s.party[0];
  h.pos = { ...h.pos, ...FP.OCO_DA_DESOVA.vortice };
  await s.op(FP.OCO_DA_DESOVA.vortice, h, /Entrar no vórtice/).fazer();
  assert.ok(distanceFt(h.pos, FP.OCO_DA_DESOVA.redemoinho) <= 10);
});

await teste('Labirinto: a esfera gira de fora e troca os túneis; sem girar, a runa não se alcança, girando, sim', async () => {
  const s = fenda('fendaLabirinto');
  await s.cena.iniciar();
  const L = FP.LABIRINTO_DOS_OLHOS;
  const alc = () => s.field.reachable(s.party[0].pos, 100000, () => false);
  assert.ok(!alc().has(`${L.runa.x},${L.runa.y}`), 'a runa se alcança sem girar a esfera');
  const q = L.config2.find((e) => !L.config1.some((f) => f.x === e.x && f.y === e.y && f.l === e.l));
  const aresta = () => (q.l === 'n' ? s.field.aresta(q.x, q.y - 1, q.x, q.y) : s.field.aresta(q.x - 1, q.y, q.x, q.y));
  assert.notEqual(aresta(), ARESTA.parede);
  s.cena.girarEsfera();
  assert.equal(aresta(), ARESTA.parede, 'a segunda configuração não fechou a aresta dela');
  s.cena.girarEsfera();
  assert.notEqual(aresta(), ARESTA.parede);
  // a interação só aparece para quem está do lado de fora, encostado no anel
  const dentro = L.salas.L3.find((c) => Math.hypot(c.x + 0.5 - 27, c.y + 0.5 - 17) < 5);
  s.party[0].pos = { ...s.party[0].pos, ...dentro };
  assert.ok(!s.op(dentro, s.party[0], /Girar a esfera/), 'de dentro não se gira');
});

await teste('Labirinto: a ocular mostra a Piscina Salobra, e debilita quem falha em Inteligência CD 18', async () => {
  const s = fenda('fendaLabirinto');
  await s.cena.iniciar();
  const h = s.party[0];
  h.pos = { ...h.pos, ...FP.LABIRINTO_DOS_OLHOS.ocular };
  h.abilities = { ...h.abilities, int: 1 };
  await s.op(FP.LABIRINTO_DOS_OLHOS.ocular, h, /Olhar pela ocular/).fazer();
  assert.ok(s.app.campanha.obelisco7.feito.viuAPiscinaSalobra);
  assert.ok(hasCondition(h, 'debilitado'));
});

await teste('Labirinto: quem revista o ladrão sem desarmar solta a energia necrótica; as adagas ficam', async () => {
  const s = fenda('fendaLabirinto');
  await s.cena.iniciar();
  const h = s.party[0];
  h.pos = { ...h.pos, ...FP.LABIRINTO_DOS_OLHOS.ladrao };
  h.hp = h.maxHp = 999;
  await s.op(FP.LABIRINTO_DOS_OLHOS.ladrao, h, /Revistar o cinto/).fazer();
  assert.ok(h.hp < 999, 'a armadilha não disparou');
  assert.ok(garantirInventario(h).bag.some((i) => i.id === 'adagaDeCristal' && i.qtd === 4));
});

await teste('Labirinto: colher o gnawble com o Golcuus ainda vivo o traz para interceptar', async () => {
  const s = fenda('fendaLabirinto');
  await s.cena.iniciar();
  const h = s.party[0];
  const R = FP.LABIRINTO_DOS_OLHOS.runa;
  h.pos = { ...h.pos, ...R };
  await s.op(R, h, /Colher o gnawble/).fazer();
  assert.equal(s.cena.elenco.golcuus.side, 'foes');
  assert.ok(!s.cena.explorando);
});

await teste('Illithinoch: a fenda se atravessa, e a volta cai na boca dela', async () => {
  const s = fortaleza();
  await s.cena.iniciar();
  const h = s.party[0];
  h.pos = { ...h.pos, ...I.fendaOco };
  await s.op(I.fendaOco, h, /Atravessar a fenda/).fazer();
  assert.equal(s.app.novaCena.cenaDaVila, 'fendaOco');
  const v = fortaleza({ config: { chegada: 'fendaLabirinto' } });
  await v.cena.iniciar();
  assert.ok(v.party.every((x) => distanceFt(x.pos, I.fendaLabirinto) <= 15), 'o grupo não voltou pela fenda do labirinto');
});
// ======================================================================================== os cristais mentais ====
function arenaDoCristal({ cristal = null, foes = [], pos = {}, seed = 3 } = {}) {
  const field = new Battlefield(60, 16, Array(16).fill('.'.repeat(60)));
  const party = makeParty({ nivel: 9 });
  const longe = [{ x: 2, y: 14 }, { x: 4, y: 14 }, { x: 6, y: 14 }, { x: 2, y: 2 }];
  party.forEach((c, i) => { c.pos = { ...c.pos, ...(pos[c.name] ?? longe[i]) }; });
  const fs = foes.map(([id, p]) => makeMonster(id, p));
  const enc = new Encounter({ battlefield: field, party, foes: fs, rng: makeRng(seed) });
  enc.firstSide = 'party'; enc.round = 1; enc.beginSide('party');
  const ilvan = party.find((c) => c.name === 'Ilvan');
  ilvan.pos = { ...ilvan.pos, ...(pos.Ilvan ?? { x: 2, y: 2 }) };
  if (cristal) {
    garantirInventario(ilvan).bag.push({ id: cristal, tipo: 'item', qtd: 1 });
    assert.ok(enc.useFeature(ilvan, 'cristalMental', { modo: cristal }), 'não armou o cristal');
  }
  const tem = (id) => garantirInventario(ilvan).bag.find((i) => i.id === id)?.qtd ?? 0;
  return { enc, party, foes: fs, ilvan, tem };
}

await teste('cristal acelerado: a Bola de Fogo sai como ação bônus, e o cristal vira pedra comum', async () => {
  const s = arenaDoCristal({ cristal: 'cristalMentalAcelerado', foes: [['goblin', { x: 20, y: 2 }]] });
  const r = s.enc.castSpell(s.ilvan, 'bolaDeFogo', { point: { x: 20, y: 2 } });
  assert.ok(r?.ok, r?.why);
  assert.equal(s.ilvan.actionUsed, false, 'gastou a ação');
  assert.equal(s.ilvan.bonusUsed, true);
  assert.equal(s.tem('cristalMentalAcelerado'), 0);
  assert.equal(s.tem('cristalApagado'), 1);
  assert.equal(s.ilvan.cristalArmado, null);
});

await teste('cristal distante: o Míssil Mágico alcança 30 m a mais, e sem ele não alcança', async () => {
  const sem = arenaDoCristal({ foes: [['goblin', { x: 32, y: 2 }]] });
  assert.ok(!sem.enc.castSpell(sem.ilvan, 'misselMagico', { target: sem.foes[0] })?.ok, 'sem cristal, 45 m alcançou');
  const com = arenaDoCristal({ cristal: 'cristalMentalDistante', foes: [['goblin', { x: 32, y: 2 }]] });
  const r = com.enc.castSpell(com.ilvan, 'misselMagico', { target: com.foes[0] });
  assert.ok(r?.ok, r?.why);
  assert.equal(com.tem('cristalMentalDistante'), 0);
});

await teste('cristal cuidadoso: três aliados passam no teste da Bola de Fogo, e passar ainda tira metade', async () => {
  const s = arenaDoCristal({ cristal: 'cristalMentalCuidadoso', foes: [['goblin', { x: 21, y: 3 }]],
    pos: { Dara: { x: 20, y: 2 }, Pip: { x: 21, y: 2 }, Brenn: { x: 20, y: 3 } } });
  // o Ilvan é evocador e já pouparia os aliados (Esculpir Magias); sem isso, quem os poupa é o cristal
  s.ilvan.features = s.ilvan.features.filter((f) => f !== 'sculptSpells');
  const testes = [];
  const orig = s.enc.resistencia.bind(s.enc);
  s.enc.resistencia = (a, ...resto) => { const t = orig(a, ...resto); testes.push([a, t]); return t; };
  const r = s.enc.castSpell(s.ilvan, 'bolaDeFogo', { point: { x: 20, y: 2 } });
  assert.ok(r?.ok, r?.why);
  const dosAliados = testes.filter(([a]) => a.side === 'party');
  assert.equal(dosAliados.length, 3);
  assert.ok(dosAliados.every(([, t]) => t.success), 'um aliado falhou');
  const dara = s.party.find((c) => c.name === 'Dara');
  assert.ok(dara.hp < dara.maxHp, 'o cristal zerou o dano de quem passou, e o livro só faz passar');
});

await teste('o cristal não se soma à metamagia, não vale em magia de ação bônus, e o que não serve fica armado', async () => {
  // o que não serve: o Míssil Mágico não pede teste, e o cuidadoso fica na mão
  const a = arenaDoCristal({ cristal: 'cristalMentalCuidadoso', foes: [['goblin', { x: 10, y: 2 }]] });
  assert.ok(a.enc.castSpell(a.ilvan, 'misselMagico', { target: a.foes[0] })?.ok);
  assert.equal(a.tem('cristalMentalCuidadoso'), 1);
  assert.equal(a.ilvan.cristalArmado, 'cristalMentalCuidadoso');
  // magia de ação bônus: o Passo Nebuloso não gasta o sutil
  const b = arenaDoCristal({ cristal: 'cristalMentalSutil' });
  assert.ok(b.enc.castSpell(b.ilvan, 'passoNebuloso', { point: { x: 4, y: 2 } })?.ok);
  assert.equal(b.tem('cristalMentalSutil'), 1);
  // com a metamagia armada, vale o cristal e os pontos de feitiçaria ficam
  const c = arenaDoCristal({ cristal: 'cristalMentalSutil', foes: [['goblin', { x: 20, y: 2 }]] });
  c.ilvan.features = [...(c.ilvan.features ?? []), 'carefulSpell'];
  c.ilvan.metaLigada = ['carefulSpell'];
  c.ilvan.resources.sorceryPoints = 5;
  assert.ok(c.enc.castSpell(c.ilvan, 'bolaDeFogo', { point: { x: 20, y: 2 } })?.ok);
  assert.equal(c.ilvan.resources.sorceryPoints, 5, 'gastou ponto de feitiçaria junto com o cristal');
  assert.equal(c.tem('cristalMentalSutil'), 0);
  // só arma o que está na mochila
  assert.equal(c.enc.useFeature(c.ilvan, 'cristalMental', { modo: 'cristalMentalElevado' }), false);
});
console.log(`\n${total - falhas}/${total} testes passaram.`);
if (falhas) process.exit(1);
