// Provas dos ITENS DO LIVRO DO MESTRE: o herói usando item que conjura (as cargas, o círculo, a CD do item), a sintonia
// (até três; o item que a pede só funciona sintonizado) e as cargas que voltam no descanso longo.
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-itens-dmg.mjs
import assert from 'node:assert/strict';

const P = new URL('../', import.meta.url).href;
const { Encounter } = await import(P + 'rules/combat.js');
const { makeParty } = await import(P + 'rules/party.js');
const { makeMonster } = await import(P + 'rules/monsters.js');
const { Battlefield } = await import(P + 'core/grid.js');
const { makeRng } = await import(P + 'core/rng.js');
const { magiasProntas } = await import(P + 'rules/spells.js');
const { descansoLongo } = await import(P + 'rules/descanso.js');
const I = await import(P + 'rules/itens-que-conjuram.js');
const IP = await import(P + 'rules/itens-passivos.js');
const { conditionEffects } = await import(P + 'rules/conditions.js');
const { skillBonus, spellSaveDc, passivePerception } = await import(P + 'rules/abilities.js');
const { visaoNoEscuro } = await import(P + 'rules/luz.js');
const { transferirItem } = await import(P + 'rules/equipment.js');

let total = 0; let falhas = 0;
async function teste(nome, fn) {
  total += 1;
  try { await fn(); console.log(`ok    ${nome}`); } catch (e) { falhas += 1; console.log(`FALHA ${nome}\n      ${String(e.stack ?? e).split('\n').slice(0, 3).join('\n      ')}`); }
}
function montar(foes = [['goblin', { x: 6, y: 1 }]]) {
  const party = makeParty({ nivel: 5 });
  party.forEach((c, i) => { c.pos = { ...c.pos, x: 1, y: 1 + i * 2 }; });
  const fs = foes.map(([id, p]) => makeMonster(id, p));
  const log = [];
  const enc = new Encounter({ battlefield: new Battlefield(12, 10, Array(10).fill('............')), party, foes: fs, rng: makeRng(3), onLog: (e) => log.push(e) });
  enc.firstSide = 'party'; enc.round = 1; enc.beginSide('party');
  return { enc, party, foes: fs, texto: () => log.map((l) => l.text ?? String(l)).join('\n'), tudo: () => JSON.stringify(log) };
}
const dar = (c, id) => { c.bag = [...(c.bag ?? []), { id, tipo: 'item', qtd: 1 }]; };

await teste('A varinha de mísseis mágicos na mão da guerreira: a magia aparece, sai sem espaço e gasta uma carga por círculo', () => {
  const s = montar();
  const [dara] = s.party;
  assert.ok(!dara.spellcasting, 'a Dara conjurava antes');
  assert.ok(!magiasProntas(dara).includes('misselMagico'));
  dar(dara, 'varinhaDeMisseisMagicos');
  assert.ok(magiasProntas(dara).includes('misselMagico'), 'a magia da varinha não apareceu');
  const r = s.enc.castSpell(dara, 'misselMagico', { target: s.foes[0], circulo: 3 });
  assert.ok(r.ok, r.why);
  assert.equal(I.cargasDe(dara, 'varinhaDeMisseisMagicos'), 4, 'o 3º círculo devia custar três cargas');
  assert.match(s.texto(), /Varinha de mísseis mágicos, 3 cargas/);
  assert.ok(!s.enc.canCast(dara, 'misselMagico', { target: s.foes[0], circulo: 4 }).ok, 'passou do teto da varinha (3º círculo)');
});

await teste('A varinha de bola de fogo pede sintonia por um conjurador e usa a CD 15 dela', () => {
  const s = montar([['ogro', { x: 8, y: 4 }]]);
  const [dara, , brenn] = s.party;
  dar(dara, 'varinhaDeBolaDeFogo');
  assert.ok(!magiasProntas(dara).includes('bolaDeFogo'), 'sem sintonia a varinha conjurou');
  assert.match(I.sintonizar(dara, 'varinhaDeBolaDeFogo'), /conjurador/, 'a guerreira se sintonizou');
  dar(brenn, 'varinhaDeBolaDeFogo');
  assert.equal(I.sintonizar(brenn, 'varinhaDeBolaDeFogo'), null);
  assert.ok(magiasProntas(brenn).includes('bolaDeFogo'), 'sintonizado, o clérigo não tem a bola de fogo');
  const r = s.enc.castSpell(brenn, 'bolaDeFogo', { point: { x: 8, y: 4 } });
  assert.ok(r.ok, r.why);
  assert.match(s.tudo(), /CD 15 = a do item \(Varinha de bola de fogo\)/, 'a CD não foi a da varinha');
});

await teste('Sintonia: até três itens; desfeita, o item para de funcionar', () => {
  const s = montar();
  const brenn = s.party[2];
  for (const id of ['varinhaDeBolaDeFogo', 'varinhaDeTeia', 'varinhaDeRaios', 'anelDeProtecao']) dar(brenn, id);
  for (const id of ['varinhaDeBolaDeFogo', 'varinhaDeTeia', 'varinhaDeRaios']) assert.equal(I.sintonizar(brenn, id), null);
  assert.match(I.sintonizar(brenn, 'anelDeProtecao'), /3/, 'passou de três');
  I.dessintonizar(brenn, 'varinhaDeTeia');
  assert.ok(!magiasProntas(brenn).includes('teia') || brenn.spellcasting?.prepared?.includes('teia'), 'a teia ficou sem sintonia');
  assert.equal(I.sintonizar(brenn, 'anelDeProtecao'), null);
});

await teste('As cargas voltam no descanso longo, sem passar do máximo', () => {
  const s = montar();
  const [dara] = s.party;
  dar(dara, 'varinhaDeMisseisMagicos');
  s.enc.castSpell(dara, 'misselMagico', { target: s.foes[0], circulo: 3 });
  assert.equal(I.cargasDe(dara, 'varinhaDeMisseisMagicos'), 4);
  descansoLongo(dara);
  assert.equal(I.cargasDe(dara, 'varinhaDeMisseisMagicos'), 7, '4 + 1d6+1 (média 4) passa de 7');
});

// ---------------------------------------------------------------- o item que faz algo só por estar com o herói ----
await teste('O anel de proteção: só sintonizado; +1 na CA e em toda resistência; sai com o item', () => {
  const s = montar();
  const [dara, pip] = s.party;
  const ca = dara.ac;
  dar(dara, 'anelDeProtecao');
  IP.atualizarItensPassivos(dara);
  assert.equal(dara.ac, ca, 'sem sintonia o anel já valia');
  assert.equal(I.sintonizar(dara, 'anelDeProtecao'), null);
  assert.equal(dara.ac, ca + 1, 'a CA não subiu');
  assert.equal(conditionEffects(dara).saveFixo.wis, 1, 'a resistência não subiu');
  transferirItem(dara, pip, 'anelDeProtecao');
  assert.equal(dara.ac, ca, 'o anel foi embora e a CA ficou');
  assert.ok(!(dara.sintonizados ?? []).includes('anelDeProtecao'), 'a sintonia ficou com quem deu o anel');
});

await teste('As manoplas de força de ogro: a Força vira 19; o aumento de nível no meio não se perde ao tirar', () => {
  const s = montar();
  const [dara] = s.party;
  dara.abilities.str = 14;
  dar(dara, 'manoplasDeForcaDeOgro');
  I.sintonizar(dara, 'manoplasDeForcaDeOgro');
  assert.equal(dara.abilities.str, 19);
  dara.abilities.str += 1;   // o aumento de atributo, com as manoplas
  I.dessintonizar(dara, 'manoplasDeForcaDeOgro');
  assert.equal(dara.abilities.str, 15, 'o natural devia ser 14 + 1');
});

await teste('O amuleto de saúde mexe nos PV máximos pela Constituição', () => {
  const s = montar();
  const brenn = s.party[2];
  brenn.abilities.con = 12;
  const max = brenn.maxHp;
  dar(brenn, 'amuletoDeSaude');
  I.sintonizar(brenn, 'amuletoDeSaude');
  assert.equal(brenn.abilities.con, 19);
  assert.equal(brenn.maxHp, max + 3 * brenn.level, '+3 de modificador por nível');
  I.dessintonizar(brenn, 'amuletoDeSaude');
  assert.equal(brenn.maxHp, max);
});

await teste('Braceletes de defesa: só sem armadura e sem escudo; manto do arquimago: base 15 + Destreza e +2 na CD', () => {
  const s = montar();
  const ilvan = s.party.find((c) => (c.armor ?? 'nenhuma') === 'nenhuma' && !c.shield);
  assert.ok(ilvan, 'ninguém do grupo anda sem armadura');
  const ca = ilvan.ac;
  dar(ilvan, 'braceletesDeDefesa');
  I.sintonizar(ilvan, 'braceletesDeDefesa');
  assert.equal(ilvan.ac, ca + 2);
  I.dessintonizar(ilvan, 'braceletesDeDefesa');
  const dara = s.party[0];
  const caDara = dara.ac;
  dar(dara, 'braceletesDeDefesa');
  I.sintonizar(dara, 'braceletesDeDefesa');
  assert.equal(dara.ac, caDara, 'de armadura, os braceletes valeram');
  dar(ilvan, 'mantoDoArquimago');
  const cd = spellSaveDc(ilvan);
  I.sintonizar(ilvan, 'mantoDoArquimago');
  const dex = Math.floor((ilvan.abilities.dex - 10) / 2);
  assert.ok(ilvan.ac >= 15 + dex, `a base 15 não valeu: ${ilvan.ac}`);
  if (cd != null) assert.equal(spellSaveDc(ilvan), cd + 2, 'a CD não subiu 2');
});

await teste('Perícia, visão, resistência e imunidade pelo item', () => {
  const s = montar();
  const [dara] = s.party;
  for (const id of ['luvasDeLadrao', 'oculosDeNoite', 'olhosDaAguia']) dar(dara, id);
  const prest = skillBonus(dara, 'prestidigitacao');
  const pp = passivePerception(dara);
  I.sintonizar(dara, 'luvasDeLadrao'); I.sintonizar(dara, 'olhosDaAguia');
  assert.equal(skillBonus(dara, 'prestidigitacao'), prest + 5);
  assert.equal(passivePerception(dara), pp + 5, 'a vantagem em Percepção não deu +5 na passiva');
  assert.ok(visaoNoEscuro(dara) >= 60, 'os óculos (sem sintonia) não deram visão no escuro');
  // o amuleto contra veneno: o dano de veneno zera, e o envenenado não pega
  dar(dara, 'amuletoContraVeneno');
  I.dessintonizar(dara, 'luvasDeLadrao');
  I.sintonizar(dara, 'amuletoContraVeneno');
  assert.equal(s.enc.danoPorTipo(dara, 10, 'veneno'), 0);
  assert.ok(s.enc.imuneACondicao(dara, 'envenenado'));
  dar(dara, 'anelDeCalor');
  I.dessintonizar(dara, 'olhosDaAguia');
  I.sintonizar(dara, 'anelDeCalor');
  assert.equal(s.enc.danoPorTipo(dara, 10, 'frio'), 5);
});

await teste('Dois itens iguais não somam, e a luta nova confere a soma', () => {
  const s = montar();
  const [dara] = s.party;
  dar(dara, 'oculosDeNoite'); dar(dara, 'oculosDeNoite');
  delete dara.doItem;
  new Encounter({ battlefield: new Battlefield(12, 10, Array(10).fill('............')), party: s.party, foes: [makeMonster('goblin', { x: 8, y: 1 })], rng: makeRng(4) });
  assert.equal(dara.doItem?.visao, 60, 'a luta não conferiu os itens');
  assert.equal(dara.doItem.itens.filter((x) => x === 'oculosDeNoite').length, 1);
});

// ------------------------------------------------------------------------ os itens novos do livro e os cajados ----
const { ITEMS } = await import(P + 'rules/items/index.js');
const { hasCondition, addCondition } = await import(P + 'rules/conditions.js');
const Livro = await import(P + 'rules/livro-motor.js');

await teste('Os itens novos do livro estão no catálogo, com a fonte e o que o jogo faz deles', () => {
  for (const id of ['cintoDoGiganteDaColina', 'cintoDoGiganteDasTempestades', 'anelDeEvasao', 'elixirDaSaude', 'pocaoDeVoo', 'diademaDaExplosao']) {
    assert.ok(ITEMS[id], `${id} não entrou`);
    assert.equal(ITEMS[id].fonte, 'livro-dmg');
    assert.match(ITEMS[id].desc, /No jogo:/);
  }
});

await teste('Cinto da força do gigante: a Força vira a do gigante; o cinturão dos anões soma 2 até 20', () => {
  const s = montar();
  const [dara] = s.party;
  dar(dara, 'cintoDoGiganteDoFogo');
  I.sintonizar(dara, 'cintoDoGiganteDoFogo');
  assert.equal(dara.abilities.str, 25);
  const brenn = s.party[2];
  brenn.abilities.con = 19;
  dar(brenn, 'cinturaoDosAnoes');
  I.sintonizar(brenn, 'cinturaoDosAnoes');
  assert.equal(brenn.abilities.con, 20, 'o cinturão passou de 20');
  assert.equal(s.enc.danoPorTipo(brenn, 10, 'veneno'), 5);
  I.dessintonizar(brenn, 'cinturaoDosAnoes');
  assert.equal(brenn.abilities.con, 19);
});

await teste('O anel de evasão passa o teste de Destreza que falhou, com a reação e uma carga', () => {
  const s = montar();
  const [dara] = s.party;
  dara.abilities.dex = 1;
  dar(dara, 'anelDeEvasao');
  I.sintonizar(dara, 'anelDeEvasao');
  dara.reactionUsed = false;
  const r = s.enc.resistencia(dara, 'dex', 30);
  assert.ok(r.success && r.evasaoDoItem, 'o anel não salvou');
  assert.equal(I.cargasDe(dara, 'anelDeEvasao'), 2);
  assert.ok(dara.reactionUsed);
  const r2 = s.enc.resistencia(dara, 'dex', 30);
  assert.ok(!r2.success, 'sem reação o anel salvou de novo');
});

await teste('A armadura da vulnerabilidade: resiste a um tipo e dobra os outros dois', () => {
  const s = montar();
  const [dara] = s.party;
  dar(dara, 'armaduraDaVulnerabilidadeCortante');
  I.sintonizar(dara, 'armaduraDaVulnerabilidadeCortante');
  assert.equal(s.enc.danoPorTipo(dara, 10, 'cortante'), 5);
  assert.equal(s.enc.danoPorTipo(dara, 10, 'perfurante'), 20);
});

await teste('As poções que viram condição: velocidade, voo; e o elixir da saúde tira o veneno', () => {
  const s = montar();
  const [dara] = s.party;
  dara.actionUsed = false;
  dar(dara, 'pocaoDeVelocidade');
  assert.ok(s.enc.useItem(dara, 'pocaoDeVelocidade').ok);
  assert.ok(hasCondition(dara, 'acelerado'), 'a poção de velocidade não acelerou');
  const pip = s.party[1];
  pip.actionUsed = false;
  dar(pip, 'pocaoDeVoo');
  assert.ok(s.enc.useItem(pip, 'pocaoDeVoo').ok);
  assert.ok(hasCondition(pip, 'voando'));
  const brenn = s.party[2];
  brenn.actionUsed = false;
  addCondition(brenn, 'envenenado', { rounds: 10 });
  dar(brenn, 'elixirDaSaude');
  assert.ok(s.enc.useItem(brenn, 'elixirDaSaude').ok);
  assert.ok(!hasCondition(brenn, 'envenenado'), 'o elixir não tirou o veneno');
});

await teste('O diadema da explosão: o Raio Ardente na mão da guerreira, com +5, uma vez por dia', () => {
  const s = montar();
  const [dara] = s.party;
  dar(dara, 'diademaDaExplosao');
  assert.ok(magiasProntas(dara).includes('raioArdente'));
  const r = s.enc.castSpell(dara, 'raioArdente', { target: s.foes[0] });
  assert.ok(r.ok, r.why);
  assert.equal(I.cargasDe(dara, 'diademaDaExplosao'), 0);
  assert.ok(!s.enc.canCast(dara, 'raioArdente', { target: s.foes[0] }).ok, 'conjurou duas vezes no dia');
});

await teste('O cajado de fogo: Bola de Fogo por três cargas, com a CD de quem o usa', () => {
  const s = montar([['ogro', { x: 8, y: 4 }]]);
  const brenn = s.party[2];
  dar(brenn, 'cajadoDeFogo');
  I.sintonizar(brenn, 'cajadoDeFogo');
  assert.ok(magiasProntas(brenn).includes('bolaDeFogo'));
  const r = s.enc.castSpell(brenn, 'bolaDeFogo', { point: { x: 8, y: 4 } });
  assert.ok(r.ok, r.why);
  assert.equal(I.cargasDe(brenn, 'cajadoDeFogo'), 7);
  assert.equal(s.enc.danoPorTipo(brenn, 10, 'fogo'), 5, 'o cajado não deu resistência a fogo');
});

// ------------------------------------------------------------- a arma, a armadura e o escudo mágicos se equipam ----
const EQ = await import(P + 'rules/equipment.js');
const { guardar } = await import(P + 'game/comercio.js');

await teste('A espada longa +1 vai para a mão e soma +1 no ataque e no dano', () => {
  const s = montar();
  const [dara] = s.party;
  const antes = s.enc.weaponAttackProfile(dara, 'espadaLonga');
  guardar(dara, 'espadaLongaMais1', 1);
  EQ.garantirInventario(dara);
  assert.ok(dara.weapons.includes('espadaLongaMais1'), 'o saque ficou na mochila');
  assert.ok(EQ.equipar(dara, 'maoPrincipal', 'espadaLongaMais1').ok);
  const depois = s.enc.weaponAttackProfile(dara, 'espadaLongaMais1');
  assert.equal(depois.bonus, antes.bonus + 1);
  assert.equal(EQ.WEAPONS.espadaLongaMais1.raridade, 'incomum');
});

await teste('O saque de arma achado na mochila vai para a mão (a adaga de veneno de Zorzula)', () => {
  const s = montar();
  const pip = s.party[1];
  guardar(pip, 'adagaDeVeneno', 1);
  EQ.garantirInventario(pip);
  assert.ok(pip.weapons.includes('adagaDeVeneno'));
  assert.ok(!pip.bag.some((b) => b.id === 'adagaDeVeneno'));
  assert.ok(EQ.equipar(pip, 'maoPrincipal', 'adagaDeVeneno').ok);
});

await teste('A vingadora sagrada fere com +2d10 de radiante o morto-vivo, e só ele', () => {
  const s = montar([['zumbi', { x: 2, y: 1 }]]);
  const [dara] = s.party;
  guardar(dara, 'vingadoraSagrada', 1);
  EQ.garantirInventario(dara);
  EQ.equipar(dara, 'maoPrincipal', 'vingadoraSagrada');
  assert.ok(dara.sintonizados?.includes('vingadoraSagrada') || I.sintonizar(dara, 'vingadoraSagrada') === null);
  const z = s.foes[0];
  z.ac = -20; z.hp = z.maxHp = 500;
  dara.actionUsed = false;
  s.enc.attackAction(dara, z, 'vingadoraSagrada');
  assert.match(s.texto() + s.tudo(), /radiante/, 'o dano radiante não veio');
});

await teste('A espada solar fere com radiante; a língua de fogo soma fogo', () => {
  assert.equal(EQ.WEAPONS.espadaSolar.type, 'radiante');
  assert.equal(EQ.WEAPONS.espadaSolar.bonusAtaque, 2);
  assert.equal(EQ.WEAPONS.linguaDeFogo.danoExtra.type, 'fogo');
});

await teste('Armadura +1 e escudo +2: a CA sobe vestida; o escudo comum volta à mochila', () => {
  const s = montar();
  const [dara, pip] = s.party;
  const caPip = pip.ac;
  guardar(pip, 'couroBatidoMais1', 1);
  EQ.garantirInventario(pip);
  assert.ok(EQ.equipar(pip, 'armadura', 'couroBatidoMais1').ok);
  assert.equal(pip.ac, caPip + 1);
  const caDara = dara.ac;
  guardar(dara, 'escudoMais2', 1);
  EQ.garantirInventario(dara);
  assert.ok(EQ.candidatosPara(dara, 'escudo').includes('escudoMais2'), 'o escudo +2 não aparece no encaixe');
  const r = EQ.equipar(dara, 'escudo', 'escudoMais2');
  assert.ok(r.ok, r.why);
  assert.equal(dara.ac, caDara + 2);
  assert.equal(EQ.noEncaixe(dara, 'escudo'), 'escudoMais2');
  assert.ok(dara.bag.some((b) => b.id === 'escudo'), 'o escudo comum sumiu');
  EQ.equipar(dara, 'escudo', null);
  assert.equal(dara.ac, caDara - 2, 'sem escudo nenhum, a CA devia cair os 2 do comum');
});

await teste('A malha élfica não pede treino; a adamantina desfaz o crítico só vestida', () => {
  const s = montar();
  const ilvan = s.party[3];
  assert.equal(EQ.avisoDeArmadura(ilvan, 'malhaElfica'), null);
  const [dara] = s.party;
  guardar(dara, 'armaduraAdamantina', 1);
  EQ.garantirInventario(dara);
  IP.atualizarItensPassivos(dara);
  assert.ok(!dara.doItem?.semCritico, 'guardada, a adamantina já valia');
  EQ.equipar(dara, 'armadura', 'armaduraAdamantina');
  assert.ok(dara.doItem?.semCritico);
});

await teste('O cajado de fogo na mão continua conjurando (a arma também é item que conjura)', () => {
  const s = montar([['ogro', { x: 8, y: 4 }]]);
  const brenn = s.party[2];
  guardar(brenn, 'cajadoDeFogo', 1);
  EQ.garantirInventario(brenn);
  assert.ok(brenn.weapons.includes('cajadoDeFogo'));
  EQ.equipar(brenn, 'maoPrincipal', 'cajadoDeFogo');
  I.sintonizar(brenn, 'cajadoDeFogo');
  assert.ok(magiasProntas(brenn).includes('bolaDeFogo'));
  assert.equal(s.enc.danoPorTipo(brenn, 10, 'fogo'), 5);
});

await teste('A arma que pede sintonia, sem ela, é só a arma de base', () => {
  const s = montar();
  const [dara] = s.party;
  guardar(dara, 'espadaSolar', 1);
  EQ.garantirInventario(dara);
  const base = s.enc.weaponAttackProfile(dara, 'espadaLonga');
  const sem = s.enc.weaponAttackProfile(dara, 'espadaSolar');
  assert.equal(sem.bonus, base.bonus, 'sem sintonia o +2 valeu');
  assert.equal(sem.danoExtra, null);
  I.sintonizar(dara, 'espadaSolar');
  assert.equal(s.enc.weaponAttackProfile(dara, 'espadaSolar').bonus, base.bonus + 2);
});

await teste('O Cajado Aranha do Phandelver conjura a Teia (duas cargas, CD 15)', () => {
  const s = montar([['ogro', { x: 8, y: 4 }]]);
  const brenn = s.party[2];
  guardar(brenn, 'cajadoAranha', 1);
  EQ.garantirInventario(brenn);
  I.sintonizar(brenn, 'cajadoAranha');
  assert.ok(magiasProntas(brenn).includes('teia'));
  const r = s.enc.castSpell(brenn, 'teia', { point: { x: 8, y: 4 } });
  assert.ok(r.ok, r.why);
  assert.equal(I.cargasDe(brenn, 'cajadoAranha'), 8);
});

// ------------------------------------------------- as famílias por tipo, os poderes das armas e a munição +N ----
/** O d20 da luta sai sempre `n` (os outros dados seguem o sorteio). */
const d20Fixo = (enc, n) => { const die = enc.rng.die.bind(enc.rng); enc.rng.die = (lados) => (lados === 20 ? n : die(lados)); };

await teste('As famílias por tipo: o anel e a poção de resistência sabem o tipo; a cota de escamas também', () => {
  const s = montar();
  const [dara, pip, brenn] = s.party;
  guardar(dara, 'anelDeResistenciaFogo', 1);
  EQ.garantirInventario(dara);
  I.sintonizar(dara, 'anelDeResistenciaFogo');
  assert.equal(s.enc.danoPorTipo(dara, 10, 'fogo'), 5);
  assert.equal(s.enc.danoPorTipo(dara, 10, 'frio'), 10);
  guardar(pip, 'pocaoDeResistenciaPsiquico', 1);
  EQ.garantirInventario(pip);
  pip.actionUsed = false;
  assert.ok(s.enc.useItem(pip, 'pocaoDeResistenciaPsiquico').ok);
  assert.equal(s.enc.danoPorTipo(pip, 10, 'psíquico'), 5);
  guardar(brenn, 'cotaDeEscamasDeDragaoVermelho', 1);
  EQ.garantirInventario(brenn);
  assert.ok(EQ.equipar(brenn, 'armadura', 'cotaDeEscamasDeDragaoVermelho').ok);
  I.sintonizar(brenn, 'cotaDeEscamasDeDragaoVermelho');
  assert.equal(s.enc.danoPorTipo(brenn, 10, 'fogo'), 5);
  assert.equal(EQ.ARMORS.cotaDeEscamasDeDragaoVermelho.bonusCA, 1);
  assert.equal(EQ.ARMORS.couroDeResistenciaAcido.passivo.resiste[0], 'ácido');
});

await teste('A vorpal no 20 decapita; sem sintonia, nada', () => {
  const s = montar([['ogro', { x: 2, y: 1 }]]);
  const [dara] = s.party;
  guardar(dara, 'espadaVorpal', 1);
  EQ.garantirInventario(dara);
  EQ.equipar(dara, 'maoPrincipal', 'espadaVorpal');
  d20Fixo(s.enc, 20);
  const ogro = s.foes[0];
  ogro.hp = ogro.maxHp = 300;
  dara.actionUsed = false;
  s.enc.attackAction(dara, ogro, 'espadaVorpal');
  assert.ok(ogro.hp > 0, 'sem sintonia a vorpal decapitou');
  I.sintonizar(dara, 'espadaVorpal');
  dara.actionUsed = false; dara.ataquesRestantes = 0;
  s.enc.attackAction(dara, ogro, 'espadaVorpal');
  assert.ok(ogro.dead || ogro.hp <= 0, 'sintonizada, a vorpal não decapitou no 20');
});

await teste('A espada ladra de vida no 20: +3d6 necrótico e PV temporários', () => {
  const s = montar([['ogro', { x: 2, y: 1 }]]);
  const [dara] = s.party;
  guardar(dara, 'espadaDeRoubarVida', 1);
  EQ.garantirInventario(dara);
  EQ.equipar(dara, 'maoPrincipal', 'espadaDeRoubarVida');
  I.sintonizar(dara, 'espadaDeRoubarVida');
  d20Fixo(s.enc, 20);
  const ogro = s.foes[0];
  ogro.hp = ogro.maxHp = 300;
  dara.actionUsed = false; dara.tempHp = 0;
  s.enc.attackAction(dara, ogro, 'espadaDeRoubarVida');
  assert.match(s.texto(), /necrótico a mais/);
  assert.ok(dara.tempHp > 0, 'os PV temporários não vieram');
});

await teste('A munição +1: o arco atira a melhor, com +1, e a que acerta some', () => {
  const s = montar([['goblin', { x: 8, y: 3 }]]);
  const pip = s.party[1];
  EQ.garantirInventario(pip);
  const sem = s.enc.weaponAttackProfile(pip, 'arcoCurto');
  guardar(pip, 'municaoMais1', 3);
  guardar(pip, 'municaoMais2', 1);
  const com = s.enc.weaponAttackProfile(pip, 'arcoCurto');
  assert.equal(com.bonus, sem.bonus + 2, 'não pegou a +2');
  assert.equal(com.municao, 'municaoMais2');
  d20Fixo(s.enc, 19);
  const g = s.foes[0];
  g.hp = g.maxHp = 300;
  assert.ok(EQ.equipar(pip, 'maoPrincipal', 'arcoCurto').ok);
  pip.actionUsed = false;
  const r = s.enc.attackAction(pip, g, 'arcoCurto');
  assert.ok(r.ok, r.why);
  assert.equal(EQ.quantosNaMochila(pip, 'municaoMais2'), 0, 'a +2 que acertou não sumiu');
  assert.equal(s.enc.weaponAttackProfile(pip, 'arcoCurto').municao, 'municaoMais1');
});

// ------------------------------------------------- as armas e armaduras com nome que entraram em 2026-11-12 ----
const empunhar = (c, id) => { guardar(c, id, 1); EQ.garantirInventario(c); const r = id in EQ.ARMORS ? EQ.equipar(c, 'armadura', id) : EQ.equipar(c, 'maoPrincipal', id); I.sintonizar(c, id); return r; };

await teste('A espada da resposta revida quem fere a dona, com vantagem e passando por cima da resistência', () => {
  const s = montar([['esqueleto', { x: 2, y: 1 }]]);
  const [dara] = s.party;
  assert.ok(empunhar(dara, 'espadaDaRespostaRespondedora').ok);
  assert.equal(EQ.WEAPONS.espadaDaRespostaRespondedora.bonusAtaque, 3);
  const esq = s.foes[0];
  esq.hp = esq.maxHp = 200;
  esq.resist = ['cortante'];
  d20Fixo(s.enc, 15);
  s.enc.applyDamage(dara, 3, 'perfurante', esq, { deArma: true });
  assert.match(s.texto(), /responde ao golpe/);
  assert.ok(dara.reactionUsed);
  assert.ok(!/resistente a cortante/.test(s.texto()), 'a resistência valeu no golpe da resposta');
  assert.ok(esq.hp < 200, s.texto());
});

await teste('A cimitarra da velocidade dá o golpe de ação bônus no menu do alvo; a cruel soma 7 no 20', () => {
  const s = montar([['ogro', { x: 2, y: 1 }]]);
  const [dara] = s.party;
  empunhar(dara, 'cimitarraDaVelocidade');
  const ogro = s.foes[0];
  ogro.hp = ogro.maxHp = 300;
  const op = s.enc.golpesDeTalento(dara, ogro).find((o) => o.id === 'golpeDaVelocidade');
  assert.ok(op && !op.motivo, JSON.stringify(op));
  assert.ok(s.enc.useFeature(dara, 'golpeDaVelocidade', { target: ogro }));
  assert.ok(dara.bonusUsed);
  assert.ok(!/Investida/.test(s.texto()), 'o golpe da cimitarra foi narrado como Investida');
  const s2 = montar([['ogro', { x: 2, y: 1 }]]);
  const d2 = s2.party[0];
  empunhar(d2, 'espadaCruel');
  s2.foes[0].hp = s2.foes[0].maxHp = 300;
  d20Fixo(s2.enc, 20);
  s2.enc.attackAction(d2, s2.foes[0], 'espadaCruel');
  assert.match(s2.texto(), /\+7/);
});

await teste('A Blackrazor devora a alma: PV temporários do máximo do morto e a fome dura enquanto eles; a Onda leva metade no crítico', () => {
  const s = montar([['goblin', { x: 2, y: 1 }], ['ogro', { x: 2, y: 4 }]]);
  const [dara] = s.party;
  dara.shield = false; // a Blackrazor é espada grande, de duas mãos
  assert.ok(empunhar(dara, 'blackrazor').ok);
  const [gob] = s.foes;
  gob.hp = 1;
  d20Fixo(s.enc, 15);
  s.enc.attackAction(dara, gob, 'blackrazor');
  assert.ok(gob.dead, s.texto());
  assert.equal(dara.tempHp, gob.maxHp);
  assert.ok(dara.conditions.some((c) => c.id === 'almaDevorada'));
  assert.ok(s.enc.imuneACondicao(dara, 'amedrontado'), 'a Blackrazor não protege do medo');
  s.enc.applyDamage(dara, dara.tempHp, 'perfurante', s.foes[1]);
  assert.ok(!dara.conditions.some((c) => c.id === 'almaDevorada'), 'a fome não acabou com os PV temporários');
  const s2 = montar([['ogro', { x: 2, y: 1 }]]);
  const d2 = s2.party[0];
  empunhar(d2, 'onda');
  const ogro = s2.foes[0];
  ogro.hp = ogro.maxHp = 200;
  d20Fixo(s2.enc, 20);
  s2.enc.attackAction(d2, ogro, 'onda');
  assert.match(s2.texto(), /\+100 de necrótico/);
  assert.ok(d2.doItem?.respiraNaAgua);
});

await teste('A cota de malha efreeti dá +3 na CA e imunidade a fogo; o couro do marinheiro nada', () => {
  const s = montar();
  const brenn = s.party[2];
  assert.ok(empunhar(brenn, 'cotaDeMalhaEfreeti').ok);
  assert.equal(s.enc.danoPorTipo(brenn, 10, 'fogo'), 0);
  assert.equal(EQ.ARMORS.cotaDeMalhaEfreeti.bonusCA, 3);
  const pip = s.party[1];
  assert.ok(empunhar(pip, 'armaduraDoMarinheiro').ok);
  assert.ok(pip.doItem?.nado);
});

await teste('A espada da vingança: ferida, a dona falha a Sabedoria e só tem olhos para quem feriu; outra arma tem desvantagem', () => {
  const s = montar([['goblin', { x: 2, y: 1 }], ['goblin', { x: 2, y: 2 }]]);
  const [dara] = s.party;
  assert.ok(empunhar(dara, 'espadaDaVinganca').ok);
  d20Fixo(s.enc, 1);
  s.enc.applyDamage(dara, 2, 'cortante', s.foes[0], { deArma: true });
  const prov = dara.conditions.find((c) => c.id === 'provocado');
  assert.equal(prov?.source, s.foes[0].id);
  dara.armaDoGolpeAgora = 'adaga';
  assert.match(JSON.stringify(s.enc.attackModifiers(dara, s.foes[1])), /vingança/);
});

await teste('Quem tem nado não paga a água funda como terreno difícil', () => {
  const s = montar();
  const pip = s.party[1];
  pip.movementLeftFt = 30;
  // três casas de água funda logo à frente do Pip
  for (let dx = 1; dx <= 3; dx++) {
    const x = pip.pos.x + dx; const y = pip.pos.y;
    s.enc.field.tiles[y * s.enc.field.w + x] = 2;
    s.enc.field.aguas.add(`${x},${y}`);
  }
  const alvo = `${pip.pos.x + 3},${pip.pos.y}`;
  const custo = () => { const m = s.enc.reachableFor(pip); const v = m.get(alvo); return typeof v === 'object' ? v?.cost ?? v?.custo : v; };
  const seco = custo();
  empunhar(pip, 'armaduraDoMarinheiro');
  const nadando = custo();
  assert.ok(nadando < seco, `${seco} -> ${nadando}`);
});

await teste('A capa de aumento e o boné da explosão mental do Labirinto Salgado: a ação na barra, as cargas e o efeito', () => {
  const s = montar([['ogro', { x: 2, y: 1 }], ['goblin', { x: 4, y: 1 }]]);
  const [dara] = s.party;
  dar(dara, 'capaDeAumento');
  assert.ok(!magiasProntas(dara).includes('aumentoDaCapa'), 'sem sintonia a capa funcionou');
  assert.equal(I.sintonizar(dara, 'capaDeAumento'), null);
  assert.ok(magiasProntas(dara).includes('aumentoDaCapa'));
  assert.ok(s.enc.castSpell(dara, 'aumentoDaCapa', {}).ok);
  assert.equal(I.cargasDe(dara, 'capaDeAumento'), 2);
  const capa = dara.conditions.find((c) => c.id === 'aumentadoPelaCapa');
  assert.equal(capa?.data?.dadosNoAcerto, '+3', 'a proficiência do 5º nível é +3');
  assert.ok(dara.bonusUsed);
  const brenn = s.party[2];
  dar(brenn, 'boneDaExplosaoMental');
  I.sintonizar(brenn, 'boneDaExplosaoMental');
  brenn.pos = { ...brenn.pos, x: 1, y: 1 };
  dara.pos = { ...dara.pos, x: 1, y: 3 };
  d20Fixo(s.enc, 1);
  const r = s.enc.castSpell(brenn, 'explosaoDoBone', { point: { x: 4, y: 1 } });
  assert.ok(r.ok, r.why);
  assert.ok(s.foes.some((f) => f.conditions.some((c) => c.id === 'atordoado')), 'ninguém ficou atordoado');
  assert.match(s.tudo(), /CD 15/);
  assert.equal(I.cargasDe(brenn, 'boneDaExplosaoMental'), 0);
  assert.ok(!s.enc.canCast(brenn, 'explosaoDoBone', { point: { x: 4, y: 1 } }).ok, 'o boné saiu duas vezes no dia');
});

// ---------------------------------------------------------------- a fila dos itens: dezenove que entraram (2026-11-16)
const comItem = (c, id) => { dar(c, id); if (ITEMS[id]?.dados?.sintonia || ITEMS[id]?.sintonia) I.sintonizar(c, id); IP.atualizarItensPassivos?.(c); };

await teste('Pergaminho de proteção: o tipo barrado não entra no cilindro nem ataca quem está nele; a barreira anda com quem leu', () => {
  const s = montar([['zumbi', { x: 6, y: 1 }]]);
  const dara = s.party[0];
  dar(dara, 'pergaminhoDeProtecaoContraMortosVivos');
  assert.ok(s.enc.useItem(dara, 'pergaminhoDeProtecaoContraMortosVivos').ok);
  const z = s.foes[0];
  z.pos = { ...z.pos, x: 4, y: 1 };
  assert.equal(s.enc.canAttack(z, dara).ok, false, 'o zumbi não afeta quem está dentro');
  const alcance = s.enc.reachableFor(z, { orcamentoFt: 30 });
  assert.ok(!alcance.has('2,1') && !alcance.has('2,2'), 'nem entra no cilindro');
  // a barreira anda com quem leu
  dara.movementLeftFt = 30;
  s.enc.moveAlong(dara, [{ x: 1, y: 1 }, { x: 2, y: 1 }]);
  assert.ok(s.enc.zonas.find((x) => x.pergaminho).casas.has('3,2'), 'a barreira andou junto');
  // andar até pôr o zumbi dentro desfaz a barreira
  s.enc.moveAlong(dara, [{ x: 2, y: 1 }, { x: 3, y: 1 }]);
  assert.ok(!s.enc.zonas.some((x) => x.pergaminho), 'o zumbi ficou dentro, e ela acabou');
  // quem já estava colado quando ele leu (o urso da bolsa) não desfaz a barreira: fica dispensado dela
  const b = montar([['zumbi', { x: 2, y: 1 }]]);
  dar(b.party[0], 'pergaminhoDeProtecaoContraMortosVivos');
  assert.ok(b.enc.useItem(b.party[0], 'pergaminhoDeProtecaoContraMortosVivos').ok);
  const zb = b.enc.zonas.find((x) => x.pergaminho);
  assert.ok(zb && zb.pergaminho.vencidos.has(b.foes[0].id), 'a barreira ficou, e o zumbi de dentro passa');
});

await teste('Bolsa de truques: três feras por dia, do d8 da cor da bolsa, do lado de quem a jogou', () => {
  const s = montar();
  const pip = s.party[1];
  comItem(pip, 'bolsaDeTruquesCastanha');
  assert.ok(magiasProntas(pip).includes('bolsaDeTruquesCastanha'), 'a bolsa aparece na barra até de quem não conjura');
  const r = s.enc.castSpell(pip, 'bolsaDeTruquesCastanha', { point: { x: 3, y: 3 } });
  assert.ok(r.ok, r.why);
  const fera = s.enc.combatants.find((c) => c.invocado?.spellId === 'bolsaDeTruquesCastanha');
  assert.ok(fera && fera.side === 'party' && ['chacal', 'macaco', 'babuino', 'bicoDeMachado', 'ursoNegro', 'doninhaGigante', 'hienaGigante', 'tigre'].includes(fera.defId), fera?.defId);
  assert.equal(I.cargasDe(pip, 'bolsaDeTruquesCastanha'), 2);
});

await teste('Vaso de elemental: o elemental obedece enquanto dura a concentração; se ela cai, ele fica, hostil a todos', () => {
  const s = montar();
  const ilvan = s.party.find((c) => c.classe === 'mago');
  comItem(ilvan, 'braseiroDeComandoDoFogo');
  const r = s.enc.castSpell(ilvan, 'elementalDoBraseiro', { point: { x: 4, y: 4 } });
  assert.ok(r.ok, r.why);
  const el = s.enc.combatants.find((c) => c.invocado?.spellId === 'elementalDoBraseiro');
  assert.ok(el && !el.hostilATodos);
  s.enc.dropConcentration(ilvan);
  assert.ok(s.enc.combatants.includes(el) && el.hostilATodos, 'ficou, e hostil');
  assert.ok(s.enc.enemiesOf(el).includes(ilvan));
});

await teste('Manto da invisibilidade: o capuz erguido deixa invisível mesmo atacando; baixá-lo é outra ação', () => {
  const s = montar();
  const dara = s.party[0];
  comItem(dara, 'mantoDaInvisibilidade');
  assert.ok(s.enc.castSpell(dara, 'capuzDoManto', {}).ok);
  assert.ok(hasCondition(dara, 'invisivel'));
  s.enc.quebraInvisibilidade(dara);
  assert.ok(hasCondition(dara, 'invisivel'), 'atacar não desfaz');
  assert.ok(magiasProntas(dara).includes('baixarOCapuz'));
  dara.actionUsed = false;
  assert.ok(s.enc.castSpell(dara, 'baixarOCapuz', {}).ok);
  assert.ok(!hasCondition(dara, 'invisivel'));
});

await teste('Globo flutuante: a luz da Luz anda com quem o leva; de novo, apaga', async () => {
  const { fontesDeLuz } = await import(P + 'rules/luz.js');
  const s = montar();
  const brenn = s.party[2];
  comItem(brenn, 'globoFlutuante');
  assert.ok(s.enc.castSpell(brenn, 'luzDoGlobo', {}).ok);
  assert.ok(fontesDeLuz(s.enc).some((f) => f.pos === brenn.pos || (f.pos.x === brenn.pos.x && f.pos.y === brenn.pos.y)));
  brenn.actionUsed = false;
  s.enc.castSpell(brenn, 'luzDoGlobo', {});
  assert.ok(!hasCondition(brenn, 'luzMagica'));
});

await teste('Bastão de tentáculos: três golpes de +9 a até 4,5 m; os três acertando, Constituição ou apertado', () => {
  const s = montar([['ogro', { x: 4, y: 1 }]]);
  const dara = s.party[0];
  comItem(dara, 'bastaoDeTentaculos');
  s.foes[0].hp = s.foes[0].maxHp = 200;
  d20Fixo(s.enc, 18);
  const r = s.enc.castSpell(dara, 'tentaculosDoBastao', { target: s.foes[0] });
  assert.ok(r.ok, r.why);
  assert.ok(s.foes[0].hp < 200);
  d20Fixo(s.enc, 1);
  // (o d20 fixo em 18 valeu também para a Constituição do ogro: refaz com 1 para ver a condição)
  s.foes[0].conditions = s.foes[0].conditions.filter((c) => c.id !== 'apertadoPeloBastao');
  dara.actionUsed = false;
  d20Fixo(s.enc, 19);
  const die = s.enc.rng.die; let n = 0;
  s.enc.rng.die = (l) => (l === 20 ? (++n <= 3 ? 19 : 1) : die(l));
  s.enc.castSpell(dara, 'tentaculosDoBastao', { target: s.foes[0] });
  assert.ok(hasCondition(s.foes[0], 'apertadoPeloBastao'), s.texto());
});

await teste('Cajado da víbora: o bordão morde, e quem falha na Constituição CD 15 sofre 3d6 de veneno a mais', () => {
  const s = montar([['ogro', { x: 2, y: 1 }]]);
  const dara = s.party[0];
  s.foes[0].hp = s.foes[0].maxHp = 200;
  empunhar(dara, 'cajadoDaVibora');
  d20Fixo(s.enc, 15);
  const die = s.enc.rng.die; let n = 0;
  s.enc.rng.die = (l) => (l === 20 ? (++n === 1 ? 19 : 1) : die(l));
  s.enc.resolveAttack(dara, s.foes[0], { weaponId: 'cajadoDaVibora' });
  assert.match(s.texto(), /veneno da víbora/);
});

await teste('Sino da abertura: no menu da porta trancada, de longe, uma carga; dez e racha', async () => {
  const { opcoesDePorta } = await import(P + 'game/portas.js');
  const { ARESTA } = await import(P + 'core/grid.js');
  const s = montar();
  const pip = s.party[1];
  comItem(pip, 'sinoDaAbertura');
  s.enc.field.porAresta(8, 3, 9, 3, ARESTA.porta);
  s.enc.field.trancas = new Map([['9,3,O', { cd: 30 }]]);
  const ops = opcoesDePorta({ enc: s.enc }, pip, { x: 8, y: 3 });
  const sino = ops.find((o) => o.rotulo === 'Tocar o sino da abertura');
  assert.ok(sino && !sino.motivo, JSON.stringify(ops.map((o) => [o.rotulo, o.motivo])));
  sino.fazer();
  assert.equal(s.enc.field.aresta(8, 3, 9, 3), ARESTA.aberta);
  assert.equal(I.cargasDe(pip, 'sinoDaAbertura'), 9);
});

await teste('A fila dos itens do Livro do Mestre: os dezenove saíram dela', async () => {
  const fila = JSON.parse((await import('node:fs')).readFileSync(new URL('./itens/dmg-pendente.json', import.meta.url), 'utf8'));
  for (const en of ['Bag of Tricks, Gray', 'Bowl of Commanding Water Elementals', 'Cloak of Invisibility', 'Chime of Opening', 'Driftglobe', 'Tentacle Rod', 'Staff of the Adder', 'Scroll of Protection from Undead']) {
    assert.ok(!fila[en], `${en} ainda na fila`);
  }
});

// ---------------------------------------------------------------- a segunda leva da fila dos itens (2026-11-17)
const naoD20 = (enc, valores) => { const die = enc.rng.die.bind(enc.rng); const fila = [...valores]; enc.rng.die = (l) => (l === 100 && fila.length ? fila.shift() : die(l)); };

await teste('Garrafa do efreeti: o d100 decide (ataca, serve ou deve três desejos sem o desgaste)', () => {
  const casos = [[5, 'ataca'], [50, 'serve'], [95, 'desejos']];
  for (const [d, o] of casos) {
    const s = montar();
    const dara = s.party[0];
    comItem(dara, 'garrafaDoEfreeti');
    naoD20(s.enc, [d]);
    const r = s.enc.castSpell(dara, 'garrafaDoEfreeti', { point: { x: 3, y: 1 } });
    assert.ok(r.ok, `${d}: ${r.why}`);
    const ef = s.enc.combatants.find((c) => c.defId === 'efreeti');
    if (o === 'ataca') assert.ok(ef && ef.side === 'foes' && dara.garrafaSemMagia);
    if (o === 'serve') assert.ok(ef && ef.side === 'party' && ef.invocado);
    if (o === 'desejos') {
      assert.ok(!ef && hasCondition(dara, 'tresDesejos'));
      assert.ok(magiasProntas(dara).includes('desejoDoGenio'));
      dara.actionUsed = false;
      for (const h of s.party) h.hp = 1;
      assert.ok(s.enc.castSpell(dara, 'desejoDoGenio', { opcao: 'cura' }).ok);
      assert.ok(s.party.every((h) => h.hp === h.maxHp) && !dara.estresseDoDesejo, 'curou, sem o desgaste');
    }
  }
});

await teste('Anel de convocação do djinni: obedece com a concentração e volta ao anel quando ela cai (não fica hostil)', () => {
  const s = montar();
  const dara = s.party[0];
  comItem(dara, 'anelDeConvocacaoDoDjinni');
  assert.ok(s.enc.castSpell(dara, 'djinniDoAnel', { point: { x: 4, y: 3 } }).ok);
  const dj = s.enc.combatants.find((c) => c.defId === 'djinni');
  assert.ok(dj && dj.side === 'party');
  s.enc.dropConcentration(dara);
  assert.ok(!s.enc.combatants.includes(dj), 'voltou ao anel');
});

await teste('Frasco de ferro: a criatura de outro plano que falha em Sabedoria sai da luta, e solta, obedece', () => {
  const s = montar([['quasit', { x: 4, y: 1 }], ['goblin', { x: 9, y: 9 }]]);
  const ilvan = s.party.find((c) => c.classe === 'mago');
  comItem(ilvan, 'frascoDeFerro');
  assert.match(s.enc.canCast(ilvan, 'prenderNoFrasco', { target: s.foes[1] }).why ?? '', /outro plano/);
  d20Fixo(s.enc, 1);
  assert.ok(s.enc.castSpell(ilvan, 'prenderNoFrasco', { target: s.foes[0] }).ok);
  assert.ok(hasCondition(s.foes[0], 'presoNoFrasco') && ilvan.frascoDeFerro?.defId === 'quasit');
  ilvan.actionUsed = false;
  assert.ok(s.enc.castSpell(ilvan, 'soltarDoFrasco', { point: { x: 2, y: 3 } }).ok);
  const q = s.enc.combatants.find((c) => c.defId === 'quasit' && c.side === 'party');
  assert.ok(q && !ilvan.frascoDeFerro, 'saiu do lado de quem o soltou');
});

await teste('Conta de força: quem falha na Destreza sofre 5d4 e fica preso na esfera, onde nada o alcança', () => {
  const s = montar([['ogro', { x: 8, y: 5 }]]);
  const pip = s.party[1];
  comItem(pip, 'contaDeForca');
  s.foes[0].hp = s.foes[0].maxHp = 200;
  d20Fixo(s.enc, 1);
  assert.ok(s.enc.castSpell(pip, 'contaDeForca', { point: { x: 8, y: 5 } }).ok);
  assert.ok(s.foes[0].hp < 200 && hasCondition(s.foes[0], 'presoNaEsferaDeForca'));
  assert.equal(s.enc.canAttack(s.party[0], s.foes[0]).ok, false, 'ninguém o alcança');
  assert.equal(I.cargasDe(pip, 'contaDeForca'), 0);
});

await teste('Garrafa da fumaça eterna: aberta, a fumaça de 18 m tapa a vista e cresce 3 m por minuto; tampada, para', () => {
  const s = montar();
  const brenn = s.party[2];
  comItem(brenn, 'garrafaDaFumacaEterna');
  assert.ok(s.enc.castSpell(brenn, 'garrafaDaFumaca', {}).ok);
  const z = s.enc.zonas.find((x) => x.fumacaEterna);
  assert.ok(z && z.obscuro === 'pesada');
  const antes = z.casas.size;
  s.enc.round += 10;
  Livro.crescerFumaca(s.enc, brenn);
  assert.equal(z.fumacaEterna.raio, 70, 'cresceu 3 m');
  void antes;
  brenn.actionUsed = false;
  s.enc.castSpell(brenn, 'garrafaDaFumaca', {});
  assert.equal(z.fumacaEterna.aberta, false);
});

await teste('Anéis de comando: vantagem contra o elemental do plano do anel, e ele com desvantagem; o do ar cai sem dano, o da água anda sobre ela', () => {
  const s = montar([['elementalDoAr', { x: 3, y: 1 }]]);
  const dara = s.party[0];
  comItem(dara, 'anelDeComandoDoAr');
  IP.atualizarItensPassivos(dara);
  assert.ok(JSON.stringify(s.enc.attackModifiers(dara, s.foes[0])).includes('anel de comando'));
  assert.ok(JSON.stringify(s.enc.attackModifiers(s.foes[0], dara)).includes('anel de comando'));
  const hp = dara.hp;
  s.enc.cair(dara, '4d6');
  assert.equal(dara.hp, hp, 'caiu sem dano');
  const pip = s.party[1];
  comItem(pip, 'anelDeComandoDaAgua');
  IP.atualizarItensPassivos(pip);
  assert.ok(pip.doItem?.sobreAgua);
});

await teste('Anel de influência animal: o Medo do anel só pega fera de Inteligência 3 ou menos', () => {
  const s = montar([['lobo', { x: 3, y: 1 }], ['goblin', { x: 3, y: 2 }]]);
  const dara = s.party[0];
  comItem(dara, 'anelDeInfluenciaAnimal');
  d20Fixo(s.enc, 1);
  const r = s.enc.castSpell(dara, 'medoDoAnel', { point: { x: 3, y: 1 } });
  assert.ok(r.ok, r.why);
  assert.ok(hasCondition(s.foes[0], 'amedrontado') && !hasCondition(s.foes[1], 'amedrontado'), 'o lobo sim, o goblin não');
});

await teste('Martelo dos raios: com o cinto de gigante e as manoplas, o gigante acertado faz Constituição CD 17 ou morre', () => {
  const s = montar([['giganteDaColina', { x: 2, y: 1 }]]);
  const dara = s.party[0];
  // (o malho é de duas mãos: o escudo sai antes)
  dara.shield = null; EQ.garantirInventario(dara); if (dara.equipamento) dara.equipamento.maoSecundaria = null;
  const eq = empunhar(dara, 'marteloDosRaios');
  assert.ok(eq?.ok !== false, JSON.stringify(eq));
  dar(dara, 'cintoDoGiganteDaColina'); dar(dara, 'manoplasDeForcaDeOgro');
  const die = s.enc.rng.die; let n = 0;
  s.enc.rng.die = (l) => (l === 20 ? (++n === 1 ? 19 : 1) : die(l));
  s.enc.resolveAttack(dara, s.foes[0], { weaponId: 'marteloDosRaios' });
  assert.ok(s.foes[0].dead, s.texto());
});

// ---------------------------------------------------------------- os cinco que sobravam (2026-11-17)
await teste('Cubo de força: a face 5 barra tudo (o golpe, a magia, quem chega); as cargas saem da face; a 6 desliga', () => {
  const s = montar([['goblin', { x: 4, y: 1 }]]);
  const ilvan = s.party.find((c) => c.classe === 'mago');
  ilvan.pos = { ...ilvan.pos, x: 1, y: 1 };
  s.party.filter((c) => c !== ilvan).forEach((c, i) => { c.pos = { ...c.pos, x: 1, y: 6 + i }; });
  comItem(ilvan, 'cuboDeForca');
  assert.ok(s.enc.castSpell(ilvan, 'cuboDeForca', { opcao: '5' }).ok);
  assert.equal(I.cargasDe(ilvan, 'cuboDeForca'), 31);
  const g = s.foes[0];
  assert.equal(s.enc.canAttack(g, ilvan).ok, false, 'o arco do goblin não passa');
  const r = s.enc.reachableFor(g, { orcamentoFt: 30 });
  assert.ok(!r.has('2,1') && !r.has('2,2'), 'nem ele entra');
  assert.ok(s.enc.porqueNaoAlvo(g, { kind: 'save', name: 'x' }, ilvan), 'nem magia');
  ilvan.actionUsed = false;
  assert.ok(s.enc.castSpell(ilvan, 'cuboDeForca', { opcao: '6' }).ok);
  assert.ok(!s.enc.zonas.some((z) => z.cubo));
  ilvan.resources['cargas:cuboDeForca'] = 2;
  ilvan.actionUsed = false;
  assert.match(s.enc.canCast(ilvan, 'cuboDeForca', { opcao: '5' }).why ?? '', /pede 5 cargas/);
});

await teste('Esfera da aniquilação: solta, ela fica numa casa; controlada, ela anda (ou vem 3 m para quem falhou)', () => {
  const s = montar([['ogro', { x: 8, y: 3 }]]);
  const ilvan = s.party.find((c) => c.classe === 'mago');
  ilvan.pos = { ...ilvan.pos, x: 2, y: 3 };
  s.party.filter((c) => c !== ilvan).forEach((c, i) => { c.pos = { ...c.pos, x: 0, y: 6 + i }; });
  ilvan.abilities.int = 20;
  comItem(ilvan, 'esferaDaAniquilacao');
  assert.ok(s.enc.castSpell(ilvan, 'soltarAEsfera', { point: { x: 3, y: 3 } }).ok);
  const z = s.enc.zonas.find((x) => x.esferaDaAniquilacao);
  assert.ok(z && z.casas.has('3,3'));
  ilvan.actionUsed = false;
  d20Fixo(s.enc, 20);
  assert.ok(s.enc.castSpell(ilvan, 'controlarAEsfera', { point: { x: 6, y: 3 } }).ok);
  assert.ok(!z.casas.has('3,3'), 'a esfera andou');
  // quem a esfera toca faz Destreza CD 13 ou sofre 4d10 de energia
  const o = s.foes[0];
  o.hp = o.maxHp = 300;
  d20Fixo(s.enc, 1);
  s.enc.resistirAZona(o, z, 'é tocado');
  assert.ok(o.hp < 300);
});

await teste('Lâmina lunar: só um elfo ou meio-elfo se sintoniza; crítico com 19 e 1d6 cortante a mais', () => {
  const s = montar([['ogro', { x: 2, y: 1 }]]);
  const dara = s.party[0];
  dar(dara, 'laminaLunar');
  dara.raca = 'Humana'; dara.racaId = 'humano'; dara.ancestry = 'Humana';
  assert.match(I.sintonizar(dara, 'laminaLunar') ?? '', /elfo/);
  dara.raca = 'Elfa'; dara.racaId = 'elfoDaFloresta';
  assert.equal(I.sintonizar(dara, 'laminaLunar'), null);
  dara.shield = null; EQ.garantirInventario(dara);
  EQ.equipar(dara, 'maoPrincipal', 'laminaLunar');
  s.foes[0].hp = s.foes[0].maxHp = 300;
  const die = s.enc.rng.die; let n = 0;
  s.enc.rng.die = (l) => (l === 20 ? (++n === 1 ? 19 : 10) : die(l));
  s.enc.resolveAttack(dara, s.foes[0], { weaponId: 'laminaLunar' });
  assert.match(s.texto(), /CRÍTICO/);
  assert.match(s.texto(), /runa da lâmina lunar/i);
});

await teste('Elmo do teletransporte: o Teletransporte sai fora da luta pelas cargas do elmo, mesmo de quem não conjura', async () => {
  const { podeConjurarFora } = await import(P + 'rules/utilidade.js');
  const party = makeParty({ nivel: 5 });
  const dara = party.find((c) => c.classe === 'guerreiro');
  dar(dara, 'elmoDoTeletransporte');
  I.sintonizar(dara, 'elmoDoTeletransporte');
  const p = podeConjurarFora(dara, 'teletransporte');
  assert.ok(p.ok && p.item, JSON.stringify(p));
});

await teste('Bolas de cristal: a Vidência à vontade fora da luta; a da leitura mental soma o Detectar Pensamentos, e a da telepatia a Sugestão uma vez por dia', async () => {
  const { podeConjurarFora, conjurarFora, magiasForaDoHeroi } = await import(P + 'rules/utilidade.js');
  const party = makeParty({ nivel: 9 });
  const dara = party.find((c) => c.classe === 'guerreiro');
  dar(dara, 'bolaDeCristalDaTelepatia');
  I.sintonizar(dara, 'bolaDeCristalDaTelepatia');
  const v = podeConjurarFora(dara, 'videncia');
  assert.ok(v.ok && v.item?.custo === 0, JSON.stringify(v));
  const s1 = podeConjurarFora(dara, 'sugestao');
  assert.ok(s1.ok && s1.item?.custo === 1, JSON.stringify(s1));
  assert.ok(magiasForaDoHeroi(dara).some((x) => x.id === 'videncia'));
  const ilvan = party.find((c) => c.classe !== 'guerreiro' && c !== dara);
  dar(ilvan, 'bolaDeCristalDaLeituraMental');
  I.sintonizar(ilvan, 'bolaDeCristalDaLeituraMental');
  assert.ok(podeConjurarFora(ilvan, 'detectarPensamentos').ok);
});

await teste('A fila dos itens: nenhum item que peça motor ficou nela', async () => {
  const fila = JSON.parse((await import('node:fs')).readFileSync(new URL('./itens/dmg-pendente.json', import.meta.url), 'utf8'));
  for (const en of ['Cube of Force', 'Sphere of Annihilation', 'Talisman of the Sphere', 'Moonblade', 'Helm of Teleportation', 'Crystal Ball', 'Crystal Ball of Mind Reading']) assert.ok(!fila[en], `${en} ainda na fila`);
});

console.log(`\n${total - falhas}/${total} testes passaram.`);
if (falhas) process.exit(1);
