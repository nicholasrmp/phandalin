// O REPOUSO DE ZORZULA (capítulo 5 do Obelisco): o posto e o Santuário Índigo, com a interface trocada por stubs.
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-zorzula.mjs
//
// A planta (salas, lava, seteiras, secretas, o túnel), a fumaça, o portão (conversa, suborno, briga com reforço), o
// refeitório que subjuga (o golpe não letal contra herói, e a derrota que leva ao Santuário), o dormitório, a forja,
// as runas do cofre, o jarro do Hjoldak, e no Santuário a conversa, a luta, o marco do 7º e o pagamento na volta.
import assert from 'node:assert/strict';

const P = new URL('../', import.meta.url).href;
const { makeParty } = await import(P + 'rules/party.js');
const { makeRng } = await import(P + 'core/rng.js');
const { makeMonster } = await import(P + 'rules/monsters.js');
const { Encounter } = await import(P + 'rules/combat.js');
const { hasCondition } = await import(P + 'rules/conditions.js');
const { montarCampo } = await import(P + 'game/campo.js');
const { mapaDo } = await import(P + 'game/encounter.js');
const { ARESTA } = await import(P + 'core/grid.js');
const { PONTOS_ZORZULA } = await import(P + 'game/zorzula-mapas.js');
const { criarZorzulaPosto, salaDoPosto, ORDEM_DAS_RUNAS } = await import(P + 'game/zorzula-posto.js');
const { criarZorzulaSantuario, salaDoSantuario } = await import(P + 'game/zorzula-santuario.js');
const { criarZorzulaMinas, salaDasMinas, FECHADURA } = await import(P + 'game/zorzula-minas.js');
const { XP_POR_NIVEL } = await import(P + 'rules/progressao.js');
const { garantirInventario } = await import(P + 'rules/equipment.js');
const ouro = (h) => garantirInventario(h).bag.find((i) => i.id === 'moedaDeOuro')?.qtd ?? 0;

let total = 0;
let falhas = 0;
async function teste(nome, fn) {
  total += 1;
  try { await fn(); console.log(`ok    ${nome}`); } catch (e) {
    falhas += 1;
    console.log(`FALHA ${nome}\n      ${String(e.stack ?? e.message).split('\n').slice(0, 6).join('\n      ')}`);
  }
}
const PT = PONTOS_ZORZULA.ZORZULA_POSTO;
const ST = PONTOS_ZORZULA.ZORZULA_SANTUARIO;
const MN = PONTOS_ZORZULA.ZORZULA_MINAS;

function montar(variante, { seed = 7, nivel = 6, campanha = null, config = {} } = {}) {
  const mapa = mapaDo(variante);
  const field = montarCampo(mapa);
  const party = makeParty({ nivel });
  party.forEach((c, i) => { c.pos = { ...mapa.grupo[i] }; });
  const app = {
    root: { classList: { add() {}, remove() {} } },
    campanha: campanha ?? { obelisco5: { iniciado: true, cenas: {}, pistas: [], feito: {} }, vila: { pistas: [], missoes: {} } },
    selected: null, select(c) { this.selected = c; }, firstActive: () => null, refresh() {}, encerrarPartida() { app.fim = true; },
    newEncounter(cfg) { app.foiPara = cfg; }, mostrarTexto() {}, config: {},
  };
  let cena = null;
  const enc = new Encounter({ battlefield: field, party, foes: [], rng: makeRng(seed), emboscada: null, reinforcements: () => null, onEvent: (ev) => cena?.evento?.(ev) });
  app.enc = enc;
  enc.aoComecar = () => {};
  cena = ({ zorzulaPosto: criarZorzulaPosto, zorzulaMinas: criarZorzulaMinas, santuarioIndigo: criarZorzulaSantuario })[variante](app, config);
  app.capitulo = cena;
  return { app, enc, cena, party, field, mapa, z: () => app.campanha.obelisco5.zorzula };
}
const escolher = (valor) => { globalThis.__escolher = (esc) => (esc.find((e) => e.valor === valor) ?? esc.find((e) => e.primaria) ?? esc[0]).valor; };
const naoEscolher = () => { delete globalThis.__escolher; };

// ------------------------------------------------------------------------------------------ a planta ----
await teste('a planta do posto: as salas do livro, a lava, as seteiras, as duas secretas e o túnel', () => {
  const mapa = mapaDo('zorzulaPosto');
  const f = montarCampo(mapa);
  const n = (id) => PT.salas[id].length;
  // os tamanhos do livro, em casas (o de-para: Z4 ~4x7, Z5 ~2,7x4,7, Z6 ~4x4, Z7 ~15x5, Z10 ~3,8x4,8, Z11 ~3x1)
  assert.ok(n('Z4') >= 24 && n('Z4') <= 32, `dormitório ${n('Z4')}`);
  assert.ok(n('Z5') >= 12 && n('Z5') <= 16, `latrinas ${n('Z5')}`);
  assert.ok(n('Z6') >= 12 && n('Z6') <= 18, `fonte ${n('Z6')}`);
  assert.ok(n('Z7') >= 50 && n('Z7') <= 75, `forja ${n('Z7')}`);
  assert.equal(n('Z11'), 3, 'o cofre, 3 x 1');
  assert.ok(n('Z10') >= 16 && n('Z10') <= 24, `suíte ${n('Z10')}`);
  // o mar de lava: não se anda nele, e se vê pelos janelões
  assert.equal(f.surfaceAt(15, 19), 'lava');
  assert.ok(f.blocksMove(15, 19));
  assert.ok(!f.passa(15, 17, 15, 18, 'passo') && f.passa(15, 17, 15, 18, 'visao'), 'os janelões: vê-se, não se passa');
  // as seteiras: barram o passo, deixam ver e atirar
  assert.ok(!f.passa(13, 3, 13, 4, 'passo') && f.passa(13, 3, 13, 4, 'visao'));
  // as secretas nascem parede
  for (const s of Object.values(PT.secretas)) assert.ok(!f.passa(s.a.x, s.a.y, s.b.x, s.b.y, 'passo'), 'secreta fechada');
  // a fonte é funda e o poço do elevador é buraco
  assert.equal(f.surfaceAt(6, 6), 'poco');
  assert.equal(f.surfaceAt(PT.elevador.x, PT.elevador.y), 'fosso');
});

await teste('a planta do Santuário: as cascatas e o lago de lava, as duas alas e o elevador', () => {
  const f = montarCampo(mapaDo('santuarioIndigo'));
  for (const [x, y] of [[6, 8], [14, 8], [6, 16], [14, 16], [10, 21]]) assert.equal(f.surfaceAt(x, y), 'lava', `${x},${y}`);
  assert.equal(salaDoSantuario({ x: 3, y: 14 }), 'oeste');
  assert.equal(salaDoSantuario({ x: 18, y: 14 }), 'leste');
  assert.equal(salaDoSantuario({ x: 10, y: 18 }), 'elevador');
  const alc = f.reachable(ST.grupo[0], 100000, () => false);
  for (const p of [...ST.presos, ...ST.refens, { x: ST.mapaDeGuerra.x - 1, y: ST.mapaDeGuerra.y }]) assert.ok(alc.has(`${p.x},${p.y}`), `${p.x},${p.y} se alcança do elevador`);
});

// --------------------------------------------------------------------------------------- a chegada ----
await teste('a chegada: o elenco rolado do livro, a fumaça na entrada, e o túnel fechado até alguém achá-lo', async () => {
  naoEscolher();
  const s = montar('zorzulaPosto', { seed: 11 });
  await s.cena.iniciar();
  const { elenco } = s.z();
  assert.ok(elenco.goblins >= 2 && elenco.goblins <= 8 && elenco.lutadores >= 1 && elenco.lutadores <= 6 && elenco.comandantes >= 1 && elenco.comandantes <= 4);
  assert.equal(s.cena.elenco.refeitorio.length, elenco.goblins + elenco.lutadores + elenco.comandantes);
  assert.ok(s.cena.elenco.refeitorio.every((g) => g.naoLetal), 'o refeitório bate para derrubar');
  assert.equal(s.cena.elenco.vigias.length, 2);
  assert.ok(s.cena.explorando);
  // o túnel: aberto só se a Percepção achou
  const t = PT.tunel;
  assert.equal(s.field.passa(t.x, t.y - 1, t.x, t.y, 'passo'), Boolean(s.z().tunelAchado));
  // a fumaça: quem entra faz o teste; o resultado fica guardado por herói
  const dara = s.party[0];
  dara.pos = { x: 15, y: 5 };
  await s.cena.depoisDeMover(dara);
  assert.ok(['imune', 'envenenado'].includes(s.z().fumaca[dara.id]));
  assert.equal(hasCondition(dara, 'envenenado'), s.z().fumaca[dara.id] === 'envenenado');
  // quem resiste a veneno passa sem teste
  const anao = s.party.find((h) => h.resist?.includes('veneno'));
  if (anao) { anao.pos = { x: 16, y: 5 }; await s.cena.depoisDeMover(anao); assert.equal(s.z().fumaca[anao.id], 'imune'); }
});

await teste('o portão: o suborno de 25 po abre; a ameaça traz os vigias e, três rodadas depois, o refeitório', async () => {
  const s = montar('zorzulaPosto', { seed: 4 });
  await s.cena.iniciar();
  const dara = s.party[0];
  garantirInventario(dara).bag.push({ id: 'moedaDeOuro', qtd: 30 });
  const { totalEmCobre } = await import(P + 'game/comercio.js');
  const soma = () => totalEmCobre(s.party);
  const antes = soma();
  escolher('suborno');
  const fala = s.cena.interacoes(PT.portao[0], 'laje', dara).find((o) => /vigias/.test(o.rotulo));
  assert.ok(fala);
  await fala.fazer();
  assert.equal(s.z().portao, 'aberto');
  assert.ok(s.field.passa(PT.portao[0].x, PT.portao[0].y - 1, PT.portao[0].x, PT.portao[0].y, 'passo'), 'a porta de pedra abriu');
  assert.equal(soma(), antes - 2500, 'o grupo pagou 25 po');

  const s2 = montar('zorzulaPosto', { seed: 4 });
  await s2.cena.iniciar();
  escolher('ameaca');
  await s2.cena.interacoes(PT.portao[0], 'laje', s2.party[0]).find((o) => /vigias/.test(o.rotulo)).fazer();
  assert.ok(!s2.cena.explorando && s2.cena.elenco.vigias.every((v) => v.side === 'foes'), 'os vigias atacam');
  assert.equal(s2.z().portao, 'aberto', 'e abrem a porta para sair: senão ninguém alcança ninguém');
  assert.equal(s2.enc.reinforcements(2), null, 'na rodada 2 ainda não');
  const r = s2.enc.reinforcements(4);
  assert.ok(r && r.units.length === s2.cena.elenco.refeitorio.length, 'na 4ª rodada (três depois da primeira), o refeitório inteiro');
  naoEscolher();
});

// ---------------------------------------------------------------------------- o refeitório ----
await teste('o golpe NÃO LETAL contra herói: quem cai pelo goblin do refeitório fica desacordado e ESTÁVEL', () => {
  const s = montar('zorzulaPosto', { seed: 2 });
  const g = makeMonster('goblinPsiLutador', { x: 15, y: 9 });
  g.naoLetal = true;
  const h = s.party[1];
  h.hp = 3;
  s.enc.applyDamage(h, 10, 'concussão', g, { deArma: true, corpoACorpo: true });
  assert.ok(hasCondition(h, 'inconsciente') && h.stable && !h.dead, 'desacordado, estável, vivo');
  // sem o naoLetal, o mesmo golpe deixa o herói morrendo (instável)
  const h2 = s.party[2];
  h2.hp = 3;
  s.enc.applyDamage(h2, 10, 'concussão', makeMonster('goblinPsiLutador', { x: 1, y: 1 }), { deArma: true, corpoACorpo: true });
  assert.ok(hasCondition(h2, 'inconsciente') && !h2.stable);
});

await teste('o refeitório: a Intimidação CD 13 faz o trato da forja; a derrota leva o grupo PRESO ao Santuário', async () => {
  const s = montar('zorzulaPosto', { seed: 5 });
  await s.cena.iniciar();
  s.party[0].skills = [...(s.party[0].skills ?? []), 'intimidacao'];
  s.party[0].abilities.cha = 30;                     // passa na CD 13 com certeza
  escolher('intimidacao');
  s.party.forEach((h, i) => { h.pos = { x: 13 + i, y: 7 }; });
  await s.cena.depoisDeMover(s.party[0]);
  assert.equal(s.z().refeitorio, 'trato');
  assert.ok(s.z().trato && s.cena.explorando, 'trato feito, ninguém brigou');
  assert.ok(s.cena.elenco.refeitorio.every((g) => g.side === 'neutro'));

  // a outra metade: a briga, e a derrota
  const s2 = montar('zorzulaPosto', { seed: 5 });
  await s2.cena.iniciar();
  escolher('luta');
  s2.party.forEach((h, i) => { h.pos = { x: 13 + i, y: 7 }; });
  await s2.cena.depoisDeMover(s2.party[0]);
  assert.ok(!s2.cena.explorando, 'a briga começou');
  for (const h of s2.party) { h.hp = 0; h.stable = true; }
  await s2.cena.fimDoCombate('derrota');
  assert.ok(s2.z().capturados, 'subjugados');
  assert.equal(s2.app.foiPara?.cenaDaVila, 'santuarioIndigo');
  assert.ok(s2.app.foiPara.comoPresos && !s2.app.fim, 'não é o fim do jogo');
  assert.ok(s2.party.every((h) => h.hp >= 1));
  naoEscolher();
});

// ------------------------------------------------------------------- o dormitório e a forja ----
await teste('o dormitório: quem falha na Furtividade CD 17 acorda os goblins; a Persuasão CD 16 os cala e dá a pista', async () => {
  const s = montar('zorzulaPosto', { seed: 9 });
  await s.cena.iniciar();
  const ladino = s.party[0];
  ladino.abilities.dex = 1;                          // falha na furtividade com certeza
  s.party[1].abilities.cha = 30;
  s.party[1].skills = [...(s.party[1].skills ?? []), 'persuasao'];
  escolher('persuasao');
  // quem fala é o primeiro do grupo: põe o carismático na frente
  s.enc.combatants.splice(s.enc.combatants.indexOf(s.party[1]), 1);
  s.enc.combatants.unshift(s.party[1]);
  ladino.pos = { x: 6, y: 11 };
  await s.cena.depoisDeMover(ladino);
  assert.equal(s.z().dormitorio, 'quietos');
  assert.ok(s.app.campanha.vila.pistas.some((p) => /sala azul/.test(p)));
  naoEscolher();
});

await teste('a forja: barricada (Atletismo CD 12), os três ferais, e a pilha que dá a azagaia', async () => {
  const s = montar('zorzulaPosto', { seed: 3 });
  await s.cena.iniciar();
  const forte = s.party[0];
  forte.abilities.str = 30;
  forte.pos = { x: 10, y: 12 };
  assert.ok(!s.field.passa(10, 12, 10, 13, 'passo'), 'a porta da forja está fechada');
  const tirar = s.cena.interacoes({ x: 10, y: 13 }, 'laje', forte).find((o) => /barricada/.test(o.rotulo));
  assert.ok(tirar);
  await tirar.fazer();
  assert.equal(s.z().barricada, 'tirada');
  assert.ok(!s.field.trancas?.has('10,13,N'), 'a barricada saiu');
  forte.pos = { x: 10, y: 14 };
  await s.cena.depoisDeMover(forte);
  assert.ok(!s.cena.explorando && s.cena.elenco.ferais.every((f) => f.side === 'foes'), 'os ferais atacam');
  for (const f of s.cena.elenco.ferais) f.dead = true;
  await s.cena.fimDoCombate('vitoria');
  assert.equal(s.z().forja, 'limpa');
  forte.abilities.int = 30;
  const revirar = s.cena.interacoes({ x: 15, y: 15 }, 'laje', forte).find((o) => /peças/.test(o.rotulo));
  await revirar.fazer();
  assert.ok(garantirInventario(forte).bag.some((i) => i.id === 'azagaiaDoRaio'));
});

// --------------------------------------------------------------------- a suíte e o cofre ----
await teste('as runas do cofre: a ordem certa abre; a errada fere com o tipo da última runa', async () => {
  assert.deepEqual(ORDEM_DAS_RUNAS, ['tempestade', 'morte', 'luz', 'vento']);
  const s = montar('zorzulaPosto', { seed: 6 });
  await s.cena.iniciar();
  const c = s.party[0];
  c.pos = { x: PT.runas.x, y: PT.runas.y + 1 };
  s.z().runasVistas = true;
  // errada: luz primeiro
  let passo = 0;
  globalThis.__escolher = (esc) => (passo++ === 0 ? 'luz' : esc[0].valor);
  c.abilities.dex = 1;
  const antes = c.hp;
  await s.cena.interacoes(PT.runas, 'laje', c).find((o) => /runas/.test(o.rotulo)).fazer();
  assert.ok(!s.z().secretas?.includes('cofre'));
  assert.ok(c.hp < antes, 'a runa errada feriu');
  // certa
  const fila = [...ORDEM_DAS_RUNAS];
  globalThis.__escolher = () => fila.shift();
  await s.cena.interacoes(PT.runas, 'laje', c).find((o) => /runas/.test(o.rotulo)).fazer();
  assert.ok(s.z().secretas.includes('cofre'));
  const sec = PT.secretas.cofre;
  assert.ok(s.field.passa(sec.a.x, sec.a.y, sec.b.x, sec.b.y, 'passo'), 'a parede girou');
  c.pos = { x: 25, y: 8 };
  await s.cena.interacoes(PT.cofre[1], 'laje', c).find((o) => /cofre/.test(o.rotulo)).fazer();
  assert.ok(garantirInventario(c).bag.some((i) => i.id === 'moedaDePlatina' && i.qtd >= 56) && garantirInventario(c).bag.some((i) => i.id === 'peridotoGrande'));
  naoEscolher();
});

await teste('o jarro: com a passiva 15 se ouve; aberto, o Hjoldak vira guia e mostra o fundo falso da cama', async () => {
  const s = montar('zorzulaPosto', { seed: 8 });
  await s.cena.iniciar();
  const c = s.party[0];
  c.abilities.wis = 30;
  c.abilities.int = 30;
  c.pos = { x: 24, y: 9 };
  await s.cena.depoisDeMover(c);
  assert.ok(s.z().jarroOuvido);
  c.pos = { x: PT.jarro.x - 1, y: PT.jarro.y };
  await s.cena.interacoes(PT.jarro, 'laje', c).find((o) => /Abrir o jarro/.test(o.rotulo)).fazer();
  assert.equal(s.z().hjoldak, 'livre');
  assert.ok(s.enc.combatants.includes(s.cena.hjoldak) && s.cena.hjoldak.side === 'neutro');
  c.pos = { x: PT.cama.x - 1, y: PT.cama.y };
  const cama = s.cena.interacoes(PT.cama, 'camaRei', c).find((o) => /cama/.test(o.rotulo));
  assert.match(cama.detalhe, /Hjoldak/);
  await cama.fazer();
  assert.ok(garantirInventario(c).bag.some((i) => i.id === 'adagaDeVeneno') && garantirInventario(c).bag.some((i) => i.id === 'gemaElemental'));
});

await teste('as latrinas: a passiva 13 acha a secreta para a fonte, e a fonte cura 1d6 a cada dez minutos', async () => {
  const s = montar('zorzulaPosto', { seed: 1 });
  await s.cena.iniciar();
  const c = s.party[0];
  c.abilities.wis = 20;
  c.pos = { x: 10, y: 8 };
  await s.cena.depoisDeMover(c);
  assert.ok(s.z().secretas?.includes('fonte'));
  c.pos = { x: 6, y: 7 };
  c.hp = 1;
  await s.cena.interacoes({ x: 6, y: 7 }, 'poco', c).find((o) => /molho/.test(o.rotulo)).fazer();
  assert.ok(c.hp >= 2 && c.hp <= 7);
});

// --------------------------------------------------------------------------- o Santuário ----
await teste('o Santuário: a conversa leva à luta; morto o Ruxithid, a estátua para, as vozes falam e o marco dá o 7º', async () => {
  naoEscolher();
  const s = montar('santuarioIndigo', { seed: 3, nivel: 6 });
  await s.cena.iniciar();
  const { ruxithid, guardiao, refens } = s.cena.elenco;
  assert.equal(refens.length, 3);
  assert.equal(guardiao.comandadoPor, ruxithid.id);
  s.party[0].pos = { x: 10, y: 14 };
  await s.cena.depoisDeMover(s.party[0]);
  assert.ok(!s.cena.explorando && ruxithid.side === 'foes' && guardiao.side === 'foes', 'a luta começou');
  s.enc.applyDamage(ruxithid, 9999, 'psíquico', s.party[0], { magico: true });
  assert.ok(ruxithid.dead && hasCondition(guardiao, 'inerte'), 'morto ele, a estátua para');
  await s.cena.fimDoCombate('vitoria');
  assert.ok(s.party.every((h) => h.xp >= XP_POR_NIVEL[7]), 'o marco do 7º');
  assert.ok(s.app.campanha.vila.pistas.some((p) => /Talhundereth/.test(p)));
  // soltar os reféns e sair
  const c = s.party[0];
  c.pos = { x: 3, y: 13 };
  await s.cena.interacoes({ x: 3, y: 14 }, 'laje', c).find((o) => /reféns/.test(o.rotulo)).fazer();
  assert.ok(s.z().refensSoltos);
});

await teste('preso: quem foi subjugado acorda na ala oeste, ao lado dos reféns', async () => {
  const s = montar('santuarioIndigo', { seed: 3, config: { comoPresos: true } });
  await s.cena.iniciar();
  assert.ok(s.party.every((h) => salaDoSantuario(h.pos) === 'oeste'));
  assert.ok(s.cena.explorando && s.z().foiPreso);
});

await teste('a volta: o Harbin paga o resto do contrato a cada um', async () => {
  const { criarCapitulo5NaVila } = await import(P + 'game/obelisco5-vila.js');
  const grupo = makeParty({ nivel: 7 });
  const camp = { aventuraConcluida: true, obelisco5: { iniciado: true, cenas: {}, pistas: [], feito: {}, pagamento: { agora: 100, fim: 300 }, zorzula: { refensSalvos: true } },
    vila: { dia: 1, tempo: 0, missoes: { zorzula: 'ativa', sawplee: 'ativa' }, pistas: [], feito: {} } };
  const registro = [];
  const feitas = [];
  const ctx = { app: { root: {} }, camp, v: camp.vila, vivos: () => grupo, rng: makeRng(1), registro, missao() {}, concluir: (id) => feitas.push(id), pista() {}, falar: async () => 'simples' };
  const antes = grupo.map(ouro);
  await criarCapitulo5NaVila(ctx).chegada();
  assert.ok(grupo.every((h, i) => ouro(h) === antes[i] + 300), 'trezentas a cada um');
  assert.deepEqual(feitas.sort(), ['sawplee', 'zorzula']);
  await criarCapitulo5NaVila(ctx).chegada();
  assert.ok(grupo.every((h, i) => ouro(h) === antes[i] + 300), 'uma vez só');
});

// ------------------------------------------------------------------------------------------ as minas ----
await teste('a planta das minas: as oito salas do livro, a lava que barra, a ponte e a pirâmide, tudo alcançável do elevador', () => {
  const mapa = mapaDo('zorzulaMinas');
  const f = montarCampo(mapa);
  for (const id of ['Z12', 'Z13', 'Z14', 'Z15', 'Z16', 'Z17', 'Z18', 'Z19']) assert.ok(MN.salas[id]?.length >= 4, `${id} existe`);
  assert.ok(MN.salas.Z18.length >= 60, 'o depósito é a caverna grande');
  assert.equal(f.surfaceAt(12, 16), 'lava');
  assert.ok(f.blocksMove(12, 16));
  assert.ok(!f.blocksMove(16, 15), 'a ponte se anda');
  assert.ok(f.blocksMove(16, 18), 'a pirâmide é maciça (a porta é a fechadura)');
  const alc = f.reachable(MN.grupo[0], 100000, () => false);
  for (const id of ['Z13', 'Z14', 'Z15', 'Z16', 'Z17', 'Z18', 'Z19']) assert.ok(MN.salas[id].some((q) => alc.has(`${q.x},${q.y}`)), `${id} se alcança do elevador`);
  assert.equal(f.surfaceAt(15, 7), 'riacho', 'a fossa é esgoto raso');
});

await teste('a caverna de cristal: a surpresa é POR HERÓI, pela Percepção ativa de cada um (CD 16)', async () => {
  const s = montar('zorzulaMinas', { seed: 12 });
  await s.cena.iniciar();
  const [a, b] = s.party;
  a.abilities.wis = 1;                               // falha
  b.abilities.wis = 30;                              // passa
  b.skills = [...(b.skills ?? []), 'percepcao'];
  a.pos = { x: 7, y: 12 };
  await s.cena.depoisDeMover(a);
  assert.ok(!s.cena.explorando && s.cena.elenco.gricks.every((g) => g.side === 'foes'));
  assert.ok(s.enc.surpreendidos.has(a.id), 'quem falhou está surpreso');
  assert.ok(!s.enc.surpreendidos.has(b.id), 'quem passou, não — mesmo com a passiva de quem falhou');
});

await teste('a espiral de cristal: CA 15 e 25 PV, revida com Destreza 16 e, quebrada, dá de 1 a 6 lascas', async () => {
  const s = montar('zorzulaMinas', { seed: 5, campanha: { obelisco5: { iniciado: true, cenas: {}, pistas: [], feito: {}, zorzula: { minas: { cristal: 'limpo' } } }, vila: { pistas: [], missoes: {} } } });
  await s.cena.iniciar();
  const c = s.party[0];
  c.abilities.str = 30;
  c.abilities.dex = 1;
  const alvo = MN.cristais[0];
  c.pos = { x: alvo.x + 1, y: alvo.y };
  for (let i = 0; i < 20 && !(s.z().minas.cristais[`${alvo.x},${alvo.y}`]?.pv === 0); i++) {
    const op = s.cena.interacoes(alvo, 'mina', c).find((o) => /espiral/.test(o.rotulo));
    if (!op) break;
    c.hp = c.maxHp;
    await op.fazer();
  }
  assert.equal(s.z().minas.cristais[`${alvo.x},${alvo.y}`].pv, 0);
  const lascas = garantirInventario(c).bag.find((i) => i.id === 'lascaDeCristal')?.qtd ?? 0;
  assert.ok(lascas >= 1 && lascas <= 6, `${lascas} lascas`);
});

await teste('a fechadura psíquica: a magia psíquica a fere até abrir; a arma não; e a plataforma sobe ao Santuário', async () => {
  const s = montar('zorzulaMinas', { seed: 6, campanha: { obelisco5: { iniciado: true, cenas: {}, pistas: [], feito: {}, zorzula: { minas: { cristal: 'limpo', penhasco: 'limpo', fossa: 'limpa', deposito: 'limpo' } } }, vila: { pistas: [], missoes: {} } } });
  await s.cena.iniciar();
  const c = s.party.find((h) => h.spellcasting) ?? s.party[0];
  const f = MN.fechadura;
  c.pos = { x: f.x, y: f.y - 1 };
  // sem magia psíquica, a fechadura não tem como ser ferida (só forçada, com ferramentas)
  c.spellcasting = { ...(c.spellcasting ?? {}), prepared: [], cantrips: [] };
  assert.ok(!s.cena.interacoes(f, 'alvenaria', c).some((o) => /Ferir a fechadura/.test(o.rotulo)));
  c.spellcasting.cantrips = ['zombariaViciosa'];
  for (let i = 0; i < 40 && !s.z().minas.fechaduraAberta; i++) await s.cena.interacoes(f, 'alvenaria', c).find((o) => /Ferir a fechadura/.test(o.rotulo)).fazer();
  assert.ok(s.z().minas.fechaduraAberta, `aberta depois de ${FECHADURA.pv} de dano psíquico`);
  const subir = s.cena.interacoes(f, 'alvenaria', c).find((o) => /plataforma/.test(o.rotulo));
  subir.fazer();
  assert.equal(s.app.foiPara.cenaDaVila, 'santuarioIndigo');
});

await teste('o santuário de Ilsensine: quem examina e falha no Carisma CD 20 fica vulnerável a dano psíquico', async () => {
  const s = montar('zorzulaMinas', { seed: 2 });
  await s.cena.iniciar();
  const c = s.party[0];
  c.abilities.cha = 1;
  c.pos = { x: MN.pedestal.x, y: MN.pedestal.y + 1 };
  await s.cena.interacoes(MN.pedestal, 'altar', c).find((o) => /santuário/.test(o.rotulo)).fazer();
  assert.ok(c.vulnerable?.includes('psíquico'));
  const antes = c.hp;
  s.enc.applyDamage(c, 3, 'psíquico', null, { magico: true });
  assert.equal(antes - c.hp, 6, 'o dano psíquico dobra');
});

await teste('o depósito: a broca ataca quem entra; vencida, os três caixotes (Atletismo 12) dão a gema, os quartzos e a ametista', async () => {
  const s = montar('zorzulaMinas', { seed: 3 });
  await s.cena.iniciar();
  const c = s.party[0];
  c.pos = { x: 25, y: 9 };
  await s.cena.depoisDeMover(c);
  assert.ok(!s.cena.explorando && s.cena.elenco.broca.side === 'foes');
  s.cena.elenco.broca.dead = true;
  await s.cena.fimDoCombate('vitoria');
  c.abilities.str = 30;
  for (const q of MN.caixotes) {
    c.pos = { x: q.x - 1, y: q.y };
    await s.cena.interacoes(q, 'caixotes', c).find((o) => /caixote/.test(o.rotulo)).fazer();
  }
  const bag = garantirInventario(c).bag;
  assert.ok(bag.some((i) => i.id === 'gemaDeBrilho') && bag.some((i) => i.id === 'quartzoAzul' && i.qtd >= 4) && bag.some((i) => i.id === 'ametistaGrande'));
});

await teste('a fossa: Furtividade CD 12 passa; quem falha acorda o otyugh; com a passiva 14, a picareta sai da barriga', async () => {
  const s = montar('zorzulaMinas', { seed: 4 });
  await s.cena.iniciar();
  const c = s.party[0];
  c.abilities.dex = 1;
  c.skills = (c.skills ?? []).filter((k) => k !== 'furtividade');
  c.expertise = [];
  c.abilities.wis = 30;
  c.pos = { x: 12, y: 8 };
  const rng = s.enc.rng;
  s.enc.rng = Object.assign(() => 0, { die: () => 1 });   // o d20 da Furtividade dá 1
  await s.cena.depoisDeMover(c);
  s.enc.rng = rng;
  assert.equal(s.z().minas.fossa, 'luta');
  assert.ok(s.z().minas.picaretaVista);
  const o = s.cena.elenco.otyugh;
  o.dead = true;
  await s.cena.fimDoCombate('vitoria');
  c.pos = { x: o.pos.x - 1, y: o.pos.y };
  await s.cena.interacoes(o.pos, 'riacho', c).find((x) => /picareta/.test(x.rotulo)).fazer();
  assert.ok(garantirInventario(c).bag.some((i) => i.id === 'picaretaLuminosa'));
});

await teste('as passagens: o elevador consertado desce às minas e sobe ao dormitório; a esteira consertada liga a forja ao depósito', async () => {
  const s = montar('zorzulaPosto', { seed: 3, campanha: { obelisco5: { iniciado: true, cenas: {}, pistas: [], feito: {}, zorzula: { chegou: true, elevador: true, forja: 'limpa', esteira: true, cristalEsteira: true } }, vila: { pistas: [], missoes: {} } } });
  await s.cena.iniciar();
  const c = s.party[0];
  c.pos = { x: PT.elevador.x + 1, y: PT.elevador.y };
  await s.cena.interacoes(PT.elevador, 'fosso', c).find((o) => /Descer pelo elevador/.test(o.rotulo)).fazer();
  assert.deepEqual([s.app.foiPara.cenaDaVila, s.app.foiPara.chegada], ['zorzulaMinas', 'elevador']);
  // a esteira
  const s2 = montar('zorzulaPosto', { seed: 3, campanha: { obelisco5: { iniciado: true, cenas: {}, pistas: [], feito: {}, zorzula: { chegou: true, forja: 'limpa', esteira: true, cristalEsteira: true } }, vila: { pistas: [], missoes: {} } } });
  await s2.cena.iniciar();
  const d = s2.party[0];
  d.abilities.dex = 30;
  d.pos = { x: PT.esteira.x - 1, y: PT.esteira.y };
  await s2.cena.interacoes(PT.esteira, 'laje', d).find((o) => /baldes/.test(o.rotulo)).fazer();
  assert.deepEqual([s2.app.foiPara.cenaDaVila, s2.app.foiPara.chegada], ['zorzulaMinas', 'esteira']);
  // nas minas, a chegada pela esteira é no depósito, e pela plataforma, na ponte
  const s3 = montar('zorzulaMinas', { seed: 3, config: { chegada: 'esteira' }, campanha: { obelisco5: { iniciado: true, cenas: {}, pistas: [], feito: {}, zorzula: { minas: { deposito: 'limpo' } } }, vila: { pistas: [], missoes: {} } } });
  await s3.cena.iniciar();
  assert.ok(s3.party.every((h) => salaDasMinas(h.pos) === 'Z18'));
  const s4 = montar('zorzulaMinas', { seed: 3, config: { chegada: 'plataforma' } });
  await s4.cena.iniciar();
  assert.ok(s4.party.some((h) => salaDasMinas(h.pos) === 'Z19'));
  // e o elevador das minas sobe ao dormitório
  const s5 = montar('zorzulaPosto', { seed: 3, config: { chegada: 'elevador' }, campanha: { obelisco5: { iniciado: true, cenas: {}, pistas: [], feito: {}, zorzula: { chegou: true } }, vila: { pistas: [], missoes: {} } } });
  await s5.cena.iniciar();
  assert.ok(s5.party.every((h) => salaDoPosto(h.pos) === 'Z4'));
});

// ---------------------------------------------------------- o que a cena do Foundry traz (2026-11-08) ----
await teste('as luzes da FA: os três mapas acendem pela luz da cena, a lava não se apaga e o fogão da cozinha sim', async () => {
  const { nivelDeLuz } = await import(P + 'rules/luz.js');
  const minimo = { zorzulaPosto: 16, zorzulaMinas: 15, santuarioIndigo: 15 };
  for (const [v, n] of Object.entries(minimo)) {
    const m = mapaDo(v);
    assert.ok((m.luzes ?? []).length >= n, `${v}: ${(m.luzes ?? []).length} luzes, a cena do Foundry tem ${n} ou mais`);
    assert.ok(m.luzes.every((l) => l.semChama || ['fogueira', 'tocha', 'braseiro', 'lanterna'].includes(l.tipo)), `${v}: só a chama de verdade se apaga`);
  }
  const posto = mapaDo('zorzulaPosto');
  const fogao = posto.luzes.find((l) => l.pos.x === 20 && l.pos.y === 7);
  assert.ok(fogao && !fogao.semChama, 'o fogão da cozinha é fogo: apaga-se');
  // dentro do posto, quem acende é a luz da FA: sem ela, a sala do refeitório cai no breu
  const f = montarCampo(posto);
  const z3 = PT.salas.Z3;
  const acesas = z3.filter((c) => nivelDeLuz(f, c.x, c.y, f.luzes) > 0).length;
  const semLuz = z3.filter((c) => nivelDeLuz(f, c.x, c.y, []) > 0).length;
  assert.equal(acesas, z3.length, 'o refeitório inteiro tem luz');
  assert.equal(semLuz, 0, 'e ela vem toda das luzes da cena, não da grade');
  // os túneis das minas no breu (o livro), a caverna de cristal acesa
  const fm = montarCampo(mapaDo('zorzulaMinas'));
  assert.ok(MN.salas.Z13.every((c) => nivelDeLuz(fm, c.x, c.y, fm.luzes) === 0), 'a câmara dos vagonetes no escuro');
  assert.ok(MN.salas.Z14.every((c) => nivelDeLuz(fm, c.x, c.y, fm.luzes) > 0), 'a caverna de cristal acesa pelo roxo');
});

await teste('as peças do pacote da FA: o tesouro tirado esvazia o desenho, e a estátua que desce deixa o pedestal vazio', async () => {
  const s = montar('zorzulaPosto', { seed: 3, campanha: { obelisco5: { iniciado: true, cenas: {}, pistas: [], feito: {}, zorzula: { chegou: true, forja: 'limpa', secretas: ['cofre'] } }, vila: { pistas: [], missoes: {} } } });
  await s.cena.iniciar();
  const peca = (id) => s.field.sobreposicoes.find((o) => o.id === id);
  assert.ok(['semLanca', 'semArmadura', 'semEspada', 'semTesouro'].every((id) => peca(id) && !peca(id).ligada), 'nascem apagadas');
  const c = s.party[0];
  c.abilities.int = 30;
  c.pos = { x: 15, y: 14 };
  await s.cena.interacoes({ x: 15, y: 15 }, 'laje', c).find((o) => /peças/.test(o.rotulo)).fazer();
  assert.ok(peca('semLanca').ligada && peca('semArmadura').ligada, 'a lança e o peitoral saem do desenho');
  c.pos = { x: 25, y: 8 };
  await s.cena.interacoes(PT.cofre[1], 'laje', c).find((o) => /cofre/.test(o.rotulo)).fazer();
  assert.ok(peca('semTesouro').ligada, 'o cofre fica vazio no desenho');
  // numa visita seguinte, continua vazio
  const s2 = montar('zorzulaPosto', { seed: 3, campanha: s.app.campanha });
  await s2.cena.iniciar();
  assert.ok(s2.field.sobreposicoes.find((o) => o.id === 'semTesouro').ligada);
  // o pedestal
  const st = montar('santuarioIndigo', { seed: 3 });
  await st.cena.iniciar();
  const peca2 = (id) => st.field.sobreposicoes.find((o) => o.id === id);
  assert.ok(!peca2('pedestalVazio').ligada && !peca2('pedestalEnergia').ligada);
  st.party[0].pos = { x: 10, y: 14 };
  await st.cena.depoisDeMover(st.party[0]);
  assert.ok(peca2('pedestalEnergia').ligada, 'a estátua desceu para lutar, e o pedestal tem a energia do cristal');
  st.enc.applyDamage(st.cena.elenco.ruxithid, 9999, 'psíquico', st.party[0], { magico: true });
  await st.cena.fimDoCombate('vitoria');
  assert.ok(peca2('pedestalVazio').ligada && !peca2('pedestalEnergia').ligada, 'morto o Ruxithid, a energia apaga');
});

await teste('o cenário vivo do Zorzula: o que a arte desenha se olha nos três mapas', () => {
  const minimo = { zorzulaPosto: 23, zorzulaMinas: 14, santuarioIndigo: 8 };
  for (const [v, n] of Object.entries(minimo)) {
    const objs = mapaDo(v).interativos ?? [];
    assert.ok(objs.length >= n, `${v}: ${objs.length} objetos`);
    assert.equal(new Set(objs.map((o) => `${o.x},${o.y}`)).size, objs.length, `${v}: dois objetos na mesma casa`);
    assert.equal(new Set(objs.map((o) => o.id)).size, objs.length, `${v}: ids repetidos`);
  }
});

await teste('o refeitório SENTADO à mesa (o livro): todos nos bancos, de frente para a mesa; e os ferais cada um numa bigorna', async () => {
  const s = montar('zorzulaPosto', { seed: 9 });
  await s.cena.iniciar();
  const bancos = new Set([7, 8, 10, 11]);
  for (const g of s.cena.elenco.refeitorio) {
    assert.ok(bancos.has(g.pos.y) && g.pos.x >= 13 && g.pos.x <= 19, `${g.name} em (${g.pos.x},${g.pos.y}) está num banco`);
    assert.ok(!s.field.blocksMove(g.pos.x, g.pos.y), `${g.name} não está em cima da mesa`);
    const olhaPara = g.pos.y + g.facingVec.dy;
    assert.ok([7, 8].includes(g.pos.y) ? [7, 8].includes(olhaPara) : [10, 11].includes(olhaPara), `${g.name} olha para a mesa`);
  }
  // a mesa entre as fileiras barra o passo e não a vista, e dá cobertura
  assert.ok(!s.field.passa(15, 7, 15, 8, 'passo') && s.field.passa(15, 7, 15, 8, 'visao'));
  for (const f of s.cena.elenco.ferais) assert.ok(s.field.blocksMove(f.pos.x, f.pos.y + 1), `${f.name} está numa bigorna`);
  // o parapeito aceso, por baixo das fichas
  const parapeito = s.field.sobreposicoes.find((o) => o.id === 'parapeito');
  assert.ok(parapeito.ligada && !parapeito.frente);
});

await teste('as minas: o túnel lateral se anda do túnel de cima ao penhasco, e a visão segue o traço da caverna', () => {
  const m = mapaDo('zorzulaMinas');
  const f = montarCampo(m);
  const caminho = f.reachable({ x: 22, y: 5 }, 100000, () => false);
  assert.ok(caminho.has('22,11') && caminho.has('22,8'), 'do túnel de cima, pelo lateral, até a passarela');
  assert.ok(m.tracos.length >= 9 && f.tracos?.length, 'o traço da FA está no campo');
  assert.ok(!m.tracosTipo.includes('+'), 'a porta de dentro da pirâmide virou parede');
  assert.ok(m.sobreposicoes.find((o) => o.id === 'tunelLateral').ligada);
});

await teste('o Santuário com os presos: a plataforma está lá embaixo, e sobe quando alguém chega à boca do poço', async () => {
  const s = montar('santuarioIndigo', { seed: 3, config: { comoPresos: true } });
  await s.cena.iniciar();
  const poco = () => s.field.sobreposicoes.find((o) => o.id === 'pocoVazio');
  assert.ok(poco().ligada, 'o poço vazio');
  s.party[0].pos = { x: 10, y: 18 };
  s.cena.depoisDeMover(s.party[0]);
  assert.ok(!poco().ligada, 'a plataforma subiu');
});

// ------------------------------------------------- o Santuário: o que tinha ficado de fora ----
const { addCondition: addCond, getCondition: getCond } = await import(P + 'rules/conditions.js');
const { SPELLS: MAGIAS } = await import(P + 'rules/spells.js');

await teste('Assassino Fantasmagórico: amedronta; no fim do turno, falhar fere 4d10 psíquicos e passar acaba a magia', async () => {
  let feriu = false;
  let acabou = false;
  for (let seed = 1; seed <= 40 && !(feriu && acabou); seed++) {
    const s = montar('santuarioIndigo', { seed, nivel: 6 });
    await s.cena.iniciar();
    const { guardiao } = s.cena.elenco;
    const h = s.party[0];
    h.abilities = { ...h.abilities, wis: 1 };
    h.pos = { x: guardiao.pos.x + 3, y: guardiao.pos.y };
    guardiao.side = 'foes';
    guardiao.actionUsed = false;
    s.enc.side = 'foes';
    const r = s.enc.castSpell(guardiao, 'assassinoFantasmagorico', { target: h, circulo: 4 });
    assert.ok(r.ok, r.why);
    const c = getCond(h, 'amedrontado');
    if (!c) continue;
    assert.equal(c.data.dc, 15, 'a CD do Ruxithid');
    assert.equal(c.data.danoAoFalhar.dano, '4d10');
    const antes = h.hp;
    s.enc.fimDoTurnoDoLado('party');
    if (hasCondition(h, 'amedrontado')) { if (h.hp < antes) feriu = true; }
    else { acabou = true; assert.equal(guardiao.concentrating, null, 'sem alvo, a concentração cai'); }
  }
  assert.ok(feriu, 'quem falha devia levar o dano');
  assert.ok(acabou, 'quem passa devia se livrar');
  assert.equal(MAGIAS.assassinoFantasmagorico.level, 4);
});

await teste('a estátua solta o Assassino Fantasmagórico guardado UMA vez, a mando do Ruxithid', async () => {
  naoEscolher();
  const s = montar('santuarioIndigo', { seed: 3, nivel: 6 });
  await s.cena.iniciar();
  const { ruxithid, guardiao } = s.cena.elenco;
  s.party[0].pos = { x: 10, y: 14 };
  await s.cena.depoisDeMover(s.party[0]);
  assert.equal(guardiao.magiaGuardada, 'assassinoFantasmagorico');
  // roda os turnos do lado inimigo até ela soltar
  const { takeMonsterTurn } = await import(P + 'rules/ai.js');
  for (let i = 0; i < 3; i++) {
    guardiao.actionUsed = false; guardiao.acted = false;
    s.enc.side = 'foes';
    takeMonsterTurn(s.enc, guardiao);
  }
  const amedrontados = s.party.filter((h) => getCond(h, 'amedrontado')?.source === guardiao.id).length;
  const usou = (guardiao.spellcasting.slots[4] ?? 0) === 0;
  assert.ok(usou, 'a estátua devia ter gastado a magia guardada');
  assert.ok(amedrontados <= 1, 'uma vez só');
  assert.ok(ruxithid);
});

await teste('luta fácil: dois goblins psíquicos sobem na quarta rodada, e se rendem quando o Ruxithid cai', async () => {
  naoEscolher();
  const s = montar('santuarioIndigo', { seed: 3, nivel: 6 });
  await s.cena.iniciar();
  const { ruxithid } = s.cena.elenco;
  s.party[0].pos = { x: 10, y: 14 };
  await s.cena.depoisDeMover(s.party[0]);
  assert.equal(s.enc.reinforcements(3), null, 'antes da quarta rodada, não');
  const r = s.enc.reinforcements(4);
  assert.equal(r?.units?.length, 2, 'com o grupo inteiro e de pé, a luta está fácil');
  for (const g of r.units) { g.side = 'foes'; s.enc.addCombatant(g); }
  assert.equal(s.enc.reinforcements(5), null, 'chegam uma vez só');
  s.enc.applyDamage(ruxithid, 9999, 'psíquico', s.party[0], { magico: true });
  assert.ok(r.units.every((g) => g.rendido && g.side === 'neutro'), 'sem o Ruxithid, os goblins se rendem');
  // com alguém no chão, a luta não está fácil
  const s2 = montar('santuarioIndigo', { seed: 3, nivel: 6 });
  await s2.cena.iniciar();
  s2.party[0].pos = { x: 10, y: 14 };
  await s2.cena.depoisDeMover(s2.party[0]);
  s2.party[1].hp = 0;
  assert.equal(s2.enc.reinforcements(4), null, 'com um herói no chão, não vem reforço');
});


console.log(`\n${total - falhas}/${total} testes passaram.`);
if (falhas) process.exit(1);
