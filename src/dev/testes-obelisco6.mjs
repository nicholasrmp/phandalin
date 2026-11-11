// O CAPÍTULO 6 DO OBELISCO NA VILA (`game/obelisco6-vila.js`, `game/obelisco6-lugares.js`), com a interface trocada por stubs:
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-obelisco6.mjs
//
// A Gwyn e as missões, a vaca que vem até o grupo, o rastro do Pip, a Halia e a renda do veio de prata, e os três
// tabuleiros: a casa de Marthungrim (atacar de cima espalha as gêmulas), o largo (a vaca vomita as gosmas) e a Mina
// Hardyhammer (o monte não cabe na passagem dos mineiros).
import assert from 'node:assert/strict';

const P = new URL('../', import.meta.url).href;
const { criarCapitulo6NaVila, capitulo6Ativo, rendaDevida } = await import(P + 'game/obelisco6-vila.js');
const { criarLugarDoCap6 } = await import(P + 'game/obelisco6-lugares.js');
const { PONTOS_CAP6_VILA } = await import(P + 'game/obelisco6-mapas.js');
const { makeParty } = await import(P + 'rules/party.js');
const { makeRng } = await import(P + 'core/rng.js');
const { Encounter } = await import(P + 'rules/combat.js');
const { montarCampo } = await import(P + 'game/campo.js');
const { mapaDo } = await import(P + 'game/encounter.js');
const { garantirInventario } = await import(P + 'rules/equipment.js');

let total = 0;
let falhas = 0;
async function teste(nome, fn) {
  total += 1;
  try { await fn(); console.log(`ok    ${nome}`); } catch (e) {
    falhas += 1;
    console.log(`FALHA ${nome}\n      ${String(e.stack ?? e.message).split('\n').slice(0, 6).join('\n      ')}`);
  }
}
const escolher = (valor) => { globalThis.__escolher = (esc) => (esc.find((e) => e.valor === valor) ?? esc.find((e) => e.primaria) ?? esc[0]).valor; };
const naoEscolher = () => { delete globalThis.__escolher; };

function vila({ seed = 3, nivel = 7 } = {}) {
  const grupo = makeParty({ nivel });
  const camp = { obelisco5: { feito: { pagoFim: true } }, vila: { dia: 1, tempo: 0, missoes: {}, pistas: [], feito: {} } };
  const registro = [];
  const missoes = [];
  const concluidas = [];
  const ctx = { app: { root: {} }, camp, v: camp.vila, vivos: () => grupo, rng: makeRng(seed), registro,
    missao: (id) => missoes.push(id), concluir: (id) => concluidas.push(id), pista: (t) => camp.vila.pistas.push(t), falar: async () => 'fim' };
  return { grupo, camp, ctx, registro, missoes, concluidas, cap6: criarCapitulo6NaVila(ctx) };
}

await teste('o capítulo 6 começa quando o Harbin paga o resto; a Gwyn traduz o mapa e abre as três missões', async () => {
  assert.equal(capitulo6Ativo({ obelisco5: { feito: {} } }), false);
  const s = vila();
  assert.equal(capitulo6Ativo(s.camp), true);
  await s.cap6.chegada();
  assert.deepEqual(s.missoes.sort(), ['fragmentos', 'mineiros', 'pip']);
  assert.ok(s.camp.vila.pistas.some((p) => /Talhundereth/.test(p)));
  await s.cap6.chegada();
  assert.equal(s.missoes.length, 3, 'uma vez só');
});

await teste('a vaca vem até o grupo na primeira volta pela vila; depois, a Stonehill leva ao Pip pelo rastro (Sobrevivência 14)', async () => {
  naoEscolher();
  const s = vila();
  await s.cap6.chegada();
  assert.deepEqual(await s.cap6.cenaDoLugar('barthen'), { descer: 'largoDaVaca' });
  s.camp.obelisco6.lutas.vaca = true;
  assert.equal(await s.cap6.cenaDoLugar('barthen'), null, 'resolvida a vaca, a vila volta ao normal');
  // o rastro: com Sobrevivência alta, acha; senão, o Carp aponta
  for (const h of s.grupo) h.abilities.wis = 30;
  escolher('rastro');
  assert.deepEqual(await s.cap6.cenaDoLugar('estalagem'), { descer: 'casaMarthungrim' });
  assert.ok(s.camp.obelisco6.feito.pipAchado);
  const s2 = vila();
  await s2.cap6.chegada();
  s2.camp.obelisco6.feito.vacaVista = true;
  escolher('carp');
  assert.deepEqual(await s2.cap6.cenaDoLugar('estalagem'), { descer: 'casaMarthungrim' }, 'o Carp aponta sem teste');
  // depois da casa, a volta do Pip: cama e comida de graça
  s2.camp.obelisco6.lutas.casa = true;
  assert.equal(await s2.cap6.cenaDoLugar('estalagem'), 'sai');
  assert.ok(s2.camp.vila.feito.estalagemGratis && s2.concluidas.includes('pip'));
  naoEscolher();
});

await teste('a Halia conta dos mineiros; vencido o monte, a prata do veio sai na Bolsa: 250 po por mês, por doze meses', async () => {
  const s = vila();
  await s.cap6.chegada();
  s.camp.obelisco6.feito.vacaVista = true;
  assert.equal(await s.cap6.cenaDoLugar('cambio'), 'sai');
  assert.ok(s.camp.obelisco6.feito.sabeHardyhammer);
  assert.equal(rendaDevida({ desde: 1, pagos: 0 }, 29), 0);
  assert.equal(rendaDevida({ desde: 1, pagos: 0 }, 31), 1);
  assert.equal(rendaDevida({ desde: 1, pagos: 0 }, 500), 12, 'no máximo doze meses');
  assert.equal(rendaDevida({ desde: 1, pagos: 3 }, 100), 0);
  s.camp.obelisco6.lutas.mina = true;
  s.camp.obelisco6.renda = { desde: 1, pagos: 0 };
  s.camp.vila.dia = 65;
  const ouro = () => s.grupo.reduce((t, h) => t + (garantirInventario(h).bag.find((i) => i.id === 'moedaDeOuro')?.qtd ?? 0), 0);
  const antes = ouro();
  await s.cap6.cenaDoLugar('cambio');
  assert.equal(ouro() - antes, 500, 'dois meses');
  assert.equal(s.camp.obelisco6.renda.pagos, 2);
});

// ------------------------------------------------------------------------------- os três tabuleiros ----
function lugar(variante, { seed = 4, nivel = 7, campanha = null } = {}) {
  const mapa = mapaDo(variante);
  const field = montarCampo(mapa);
  const party = makeParty({ nivel });
  party.forEach((c, i) => { c.pos = { ...mapa.grupo[i] }; });
  const app = { root: { classList: { add() {}, remove() {} } }, campanha: campanha ?? { obelisco6: { feito: {}, lutas: {} }, vila: { pistas: [], dia: 1 } },
    selected: null, select(c) { this.selected = c; }, firstActive: () => null, refresh() {}, encerrarPartida() { app.fim = true; },
    irParaVila() { app.voltou = true; }, newEncounter() {}, config: {} };
  const enc = new Encounter({ battlefield: field, party, foes: [], rng: makeRng(seed), emboscada: null, reinforcements: () => null });
  app.enc = enc;
  enc.aoComecar = () => {};
  const cena = criarLugarDoCap6(app, { cenaDaVila: variante });
  app.capitulo = cena;
  return { app, enc, cena, party, field, o6: () => app.campanha.obelisco6 };
}

await teste('a casa de Marthungrim: descer pela corda é luta na hora; atacar de cima espalha as gêmulas, uma por cômodo', async () => {
  escolher('descer');
  const a = lugar('casaMarthungrim');
  await a.cena.iniciar();
  assert.ok(!a.cena.explorando && a.cena.elenco.length === 3 && a.cena.elenco.every((g) => g.side === 'foes'));
  escolher('cima');
  const b = lugar('casaMarthungrim');
  await b.cena.iniciar();
  assert.ok(b.cena.explorando, 'ninguém embaixo: explora');
  const C = PONTOS_CAP6_VILA.CASA_MARTHUNGRIM;
  assert.deepEqual(b.cena.elenco.map((g) => `${g.pos.x},${g.pos.y}`), C.refugios.map((p) => `${p.x},${p.y}`));
  assert.ok(b.cena.elenco.every((g) => !b.enc.combatants.includes(g)), 'recuadas, ficam fora do tabuleiro (fora da vista)');
  // quem entra no quarto acha a do quarto, e só ela
  const h = b.party[0];
  h.pos = { x: 6, y: 3 };
  await b.cena.depoisDeMover(h);
  assert.equal(b.cena.elenco.filter((g) => g.side === 'foes').length, 1, 'uma de cada vez');
  assert.equal(b.cena.elenco.filter((g) => b.enc.combatants.includes(g)).length, 1, 'só a que pulou volta ao tabuleiro');
  naoEscolher();
});

await teste('a casa de Marthungrim: o diário dá a pista da cripta, e a corda volta à vila', async () => {
  const s = lugar('casaMarthungrim', { campanha: { obelisco6: { feito: { casaVista: true }, lutas: { casa: true } }, vila: { pistas: [] } } });
  await s.cena.iniciar();
  const C = PONTOS_CAP6_VILA.CASA_MARTHUNGRIM;
  const h = s.party[0];
  h.pos = { x: C.diario.x, y: C.diario.y - 1 };
  await s.cena.interacoes(C.diario, 'laje', h).find((o) => /diário/.test(o.rotulo)).fazer();
  assert.ok(s.o6().feito.diario && s.app.campanha.vila.pistas.some((p) => /Cripta dos Talhund/.test(p)));
  h.pos = { x: C.corda.x + 1, y: C.corda.y };
  s.cena.interacoes(C.corda, 'entulho', h).find((o) => /corda/.test(o.rotulo)).fazer();
  assert.ok(s.app.voltou);
  // o entulho da escada é terreno difícil
  assert.equal(s.field.surfaceAt(3, 4), 'entulho');
});

await teste('o largo: quem chega a 1,5 m da Daisy a faz vomitar QUATRO gosmas psíquicas, e ela fica boa depois', async () => {
  const s = lugar('largoDaVaca');
  await s.cena.iniciar();
  assert.ok(s.cena.vaca && s.cena.explorando);
  const h = s.party[0];
  h.pos = { x: s.cena.vaca.pos.x - 2, y: s.cena.vaca.pos.y };
  await s.cena.depoisDeMover(h);
  assert.ok(s.cena.explorando, 'a 3 m, nada');
  h.pos = { x: s.cena.vaca.pos.x - 1, y: s.cena.vaca.pos.y };
  await s.cena.depoisDeMover(h);
  const gosmas = s.enc.combatants.filter((c) => c.defId === 'gosmaCinzentaPsiquica');
  assert.equal(gosmas.length, 4);
  assert.ok(gosmas.every((g) => (g.pos.f ?? 1) === 1), 'a gosma é Média: uma casa, não a pegada da vaca');
  assert.ok(gosmas.every((g) => g.side === 'foes') && s.cena.vaca.side === 'neutro', 'a vaca não luta');
  for (const g of gosmas) g.dead = true;
  await s.cena.fimDoCombate('vitoria');
  assert.ok(s.o6().lutas.vaca && s.cena.explorando);
});

await teste('o largo: se a vaca morre na briga (magia de área não escolhe), o desfecho diz isso, e não que ela foi pastar', async () => {
  const s = lugar('largoDaVaca');
  await s.cena.iniciar();
  const h = s.party[0];
  h.pos = { x: s.cena.vaca.pos.x - 1, y: s.cena.vaca.pos.y };
  await s.cena.depoisDeMover(h);
  for (const g of s.enc.combatants.filter((c) => c.defId === 'gosmaCinzentaPsiquica')) g.dead = true;
  s.cena.vaca.dead = true;
  s.cena.vaca.hp = 0;
  await s.cena.fimDoCombate('vitoria');
  assert.ok(s.o6().lutas.vaca && s.o6().feito.vacaMorta);
});

await teste('a Mina Hardyhammer: o monte não cabe na passagem dos mineiros; vencido, Karthim marca Talhundereth e a renda começa', async () => {
  const s = lugar('minaHardyhammer');
  await s.cena.iniciar();
  const M = PONTOS_CAP6_VILA.MINA_HARDYHAMMER;
  const monte = s.cena.elenco[0];
  assert.equal(monte.size, 'grande');
  // a câmara oeste não se alcança por quem é Grande (a passagem tem uma casa)
  const alcance = s.enc.reachableFor({ ...monte, movementLeftFt: 1000, pos: { ...monte.pos } });
  assert.ok(!M.mineiros.some((p) => alcance.has(`${p.x},${p.y}`)), 'o monte não chega aos mineiros');
  assert.ok(s.cena.mineiros.length === 3 && s.cena.mineiros.every((m) => m.side === 'neutro'));
  // entrar na boca acorda o monte
  const h = s.party[0];
  h.pos = { x: 10, y: 8 };
  await s.cena.depoisDeMover(h);
  assert.ok(!s.cena.explorando && monte.side === 'foes');
  monte.dead = true;
  await s.cena.fimDoCombate('vitoria');
  assert.ok(s.o6().feito.sabeTalhundereth && s.o6().renda?.pagos === 0);
  assert.ok(s.app.campanha.vila.pistas.some((p) => /Karthim/.test(p)));
});

console.log(`\n${total - falhas}/${total} testes passaram.`);
if (falhas) process.exit(1);
