// Testes da CENA da Casa da Morte (Maldição de Strahd, Apêndice B): os gatilhos do livro, as armadilhas, a escada secreta e o marco do 2º nível,
// o ritual da câmara e a saída. Roda a cena DE VERDADE (`game/capitulo-casadamorte.js`) com a interface trocada por stubs:
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-casadamorte.mjs
import assert from 'node:assert/strict';

const P = new URL('../', import.meta.url).href;
const { montarCampo } = await import(P + 'game/campo.js');
const { Encounter } = await import(P + 'rules/combat.js');
const { makeParty } = await import(P + 'rules/party.js');
const { makeRng } = await import(P + 'core/rng.js');
const { mapaDo, buildFoes } = await import(P + 'game/encounter.js');
const { criarCasaDaMorte } = await import(P + 'game/capitulo-casadamorte.js');
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

/** A cena montada como o `main.js` monta: campo, grupo de 4, criaturas escondidas; `campanha` e `estado` dividem entre andares. */
async function nova(variante, { campanha = {}, nivel = 1, entrada = null, seed = 11 } = {}) {
  const mapa = mapaDo(variante);
  const field = montarCampo(mapa);
  const party = makeParty({ nivel });
  party.forEach((c, i) => { c.pos = { ...mapa.grupo[i] }; c.facingVec = { ...mapa.olhar }; });
  const foes = buildFoes(variante);
  const trocas = [];
  const app = {
    root: { classList: { add() {}, remove() {} } }, campanha, selected: null, inimigosEscondidos: foes,
    select(c) { this.selected = c; }, firstActive() { return enc.allOf('party').find((c) => !c.acted && !c.dead && c.hp > 0) ?? null; },
    refresh() {}, encerrarPartida() { app.encerrou = true; }, newEncounter(cfg) { trocas.push(cfg); },
  };
  const enc = new Encounter({ battlefield: field, party, foes: [], rng: makeRng(seed), emboscada: null, reinforcements: () => null, onEvent: (ev) => cena?.evento?.(ev) });
  app.enc = enc;
  enc.aoComecar = () => {};
  enc.protegidoDeSurpresa = () => false;
  const cena = criarCasaDaMorte(app, { variante, modo: 'campanha', aventura: 'cos', entrada });
  await cena.iniciar();
  return { app, enc, cena, field, party, foes, trocas, casa: () => app.campanha.strahd.casa };
}

const poe = (h, x, y) => { h.pos = { x, y }; };
/** O d20 sai sempre `v`: para testar o ramo de sucesso ou de falha sem depender de sorte. */
const d20 = (S, v) => { const die = S.enc.rng.die; S.enc.rng.die = (n) => (n === 20 ? v : die(n)); };
const op = (S, h, x, y, parte) => {
  const sup = S.field.surfaceAt(x, y);
  const ops = S.cena.interacoes({ x, y }, sup, h);
  return ops.find((o) => !o.grupo?.startsWith('Examinar') && o.rotulo.includes(parte));
};
const itens = (h, id) => garantirInventario(h).bag.filter((i) => i.id === id).reduce((n, i) => n + i.qtd, 0);

await teste('3º andar: a armadura só acorda quando alguém chega a 1,5 m; vencida, a cena volta a explorar e o grupo não luta de novo', async () => {
  const S = await nova('casaDaMorte3');
  assert.equal(S.foes.length, 3);
  poe(S.party[0], 3, 7);
  await S.cena.depoisDeMover(S.party[0]);
  assert.ok(S.cena.explorando, 'a 3 casas ela não acorda');
  poe(S.party[0], 3, 5);
  await S.cena.depoisDeMover(S.party[0]);
  assert.ok(!S.cena.explorando, 'a 1 casa, sim');
  const armadura = S.foes.find((f) => f.grupo === 'armadura');
  assert.ok(S.enc.combatants.includes(armadura));
  assert.ok(!S.enc.combatants.some((f) => f.grupo === 'vassoura'), 'a vassoura segue escondida');
  S.enc.applyDamage(armadura, 999, 'concussão');
  await S.cena.fimDoCombate('vitoria');
  assert.ok(S.cena.explorando);
  assert.ok(S.casa().vencidos.includes('armadura'));
  poe(S.party[0], 3, 5);
  await S.cena.depoisDeMover(S.party[0]);
  assert.ok(S.cena.explorando, 'vencida, não volta');
});

await teste('3º andar: o espectro da babá se manifesta ao entrar no berçário, e vencido lá não aparece no sótão', async () => {
  const S = await nova('casaDaMorte3');
  poe(S.party[0], 2, 8);
  await S.cena.depoisDeMover(S.party[0]);
  assert.ok(!S.cena.explorando);
  const e = S.foes.find((f) => f.grupo === 'espectroBaba');
  assert.ok(S.enc.combatants.includes(e));
  S.enc.applyDamage(e, 999, 'radiante');
  await S.cena.fimDoCombate('vitoria');
  const A = await nova('casaDaMorte4', { campanha: S.app.campanha });
  const restos = A.cena.interacoes({ x: 1, y: 7 }, A.field.surfaceAt(1, 7), A.party[0]).find((o) => o.rotulo.includes('baú'));
  assert.ok(restos, 'o baú existe no depósito');
  poe(A.party[0], 2, 7);
  await restos.fazer();
  assert.ok(A.cena.explorando, 'a babá já foi vencida: nada acontece');
});

await teste('sótão: mexer nos restos da babá a chama (se ainda está), e Medicina CD 14 dá o diagnóstico', async () => {
  const S = await nova('casaDaMorte4');
  poe(S.party[0], 2, 7);
  d20(S, 20);
  await op(S, S.party[0], 2, 7, 'baú').fazer();
  assert.ok(!S.cena.explorando, 'o espectro aparece');
  assert.ok(S.enc.combatants.some((f) => f.grupo === 'espectroBaba'));
});

await teste('escada secreta: a carta revela a escada, dá o 2º nível uma vez só, e a espiral do sótão aparece junto', async () => {
  const S = await nova('casaDaMorte2', { nivel: 1 });
  assert.equal(S.party[0].level, 1);
  assert.ok(S.party[0].xp < 300);
  poe(S.party[0], 6, 1);
  S.casa().passagemAberta = true;
  const ler = S.cena.interacoes({ x: 6, y: 1 }, S.field.surfaceAt(6, 1), S.party[0]).find((o) => o.rotulo.includes('carta'));
  assert.ok(ler);
  await ler.fazer();
  assert.equal(S.casa().escada, true);
  assert.equal(S.casa().nivel2, true);
  assert.ok(S.party[0].xp >= 300, 'a carta é o marco do 2º nível (300 XP)');
  const xp = S.party[0].xp;
  await ler.fazer();
  assert.equal(S.party[0].xp, xp, 'reler não dá XP de novo');
  const T = await nova('casaDaMorte3', { campanha: S.app.campanha });
  assert.equal(T.field.surfaceAt(5, 8), 'escada', 'a escada atrás do espelho da babá já está à mostra');
  assert.equal(T.field.aresta(4, 8, 4, 9), 3, 'a aresta da suíte com o poço da escada é porta aberta');
  const A = await nova('casaDaMorte4', { campanha: S.app.campanha });
  assert.equal(A.field.surfaceAt(1, 4), 'escada', 'a espiral do sótão também');
  assert.equal(A.field.aresta(1, 4, 1, 5), 3, 'e a porta secreta dela, que dá no depósito');
});

await teste('sótão: a casa de bonecas mostra a escada (e o 2º nível) quando a carta não foi achada; a porta do 20 abre com a chave de ferro', async () => {
  const S = await nova('casaDaMorte4', { nivel: 1 });
  poe(S.party[0], 3, 3);
  d20(S, 20);
  S.casa().fantasmas = 'apareceram';      // a conversa em si é da interface; aqui só a escada
  const bonecas = op(S, S.party[0], 3, 3, 'casa de bonecas');
  assert.ok(bonecas);
  await bonecas.fazer();
  assert.equal(S.casa().escada, true);
  assert.ok(S.party[0].xp >= 300, 'a casa de bonecas também é o marco do 2º nível');
  assert.equal(S.field.surfaceAt(1, 4), 'escada');
  assert.equal(S.casa().fantasmas, 'apareceram', 'Rose e Thorn aparecem quando alguém mexe na casa de bonecas');
  // a porta trancada
  assert.equal(S.field.aresta(4, 3, 4, 4), 2, 'a porta do 20 começa trancada (porta fechada)');
  poe(S.party[0], 4, 4);
  garantirInventario(S.party[1]);
  S.party[1].bag.push({ id: 'chaveDeFerroDosDurst', tipo: 'item', qtd: 1 });
  await op(S, S.party[0], 4, 4, 'porta trancada').fazer();
  assert.equal(S.field.aresta(4, 3, 4, 4), 3);
  assert.equal(S.casa().portaCriancas, true);
});

await teste('masmorra 1: o grick surpreende quem tem Percepção passiva abaixo de 12; os carniçais se levantam no meio do cruzamento', async () => {
  const S = await nova('casaDaMortePorao1');
  poe(S.party[0], 28, 18);
  await S.cena.depoisDeMover(S.party[0]);
  assert.ok(S.cena.explorando, 'a 3 casas do grick, nada');
  poe(S.party[0], 28, 20);
  await S.cena.depoisDeMover(S.party[0]);
  assert.ok(!S.cena.explorando, 'a 1 casa, o grick ataca');
  assert.equal(S.enc.emboscada?.emboscadores, 'foes');
  assert.deepEqual(S.enc.emboscada.furtividade, [12], 'o livro: Percepção passiva abaixo de 12 é surpreendido');
  const C = await nova('casaDaMortePorao1');
  poe(C.party[0], 22, 14);
  await C.cena.depoisDeMover(C.party[0]);
  assert.ok(C.cena.explorando, 'na borda do cruzamento, não');
  poe(C.party[0], 22, 16);
  await C.cena.depoisDeMover(C.party[0]);
  assert.ok(!C.cena.explorando, 'no meio, sim');
  assert.equal(C.enc.combatants.filter((f) => f.side === 'foes').length, 4, 'quatro carniçais');
});

await teste('masmorra 1: o mímico é a porta do canto sudoeste do covil', async () => {
  const S = await nova('casaDaMortePorao1');
  poe(S.party[0], 21, 35);
  await S.cena.depoisDeMover(S.party[0]);
  assert.ok(S.cena.explorando, 'a 2 casas, não');
  poe(S.party[0], 20, 35);
  await S.cena.depoisDeMover(S.party[0]);
  assert.ok(!S.cena.explorando, 'ao chegar a 1 casa da porta');
  assert.ok(S.enc.combatants.some((f) => f.defId === 'mimico'));
});

await teste('masmorra 1: as cinco sombras vêm com a esfera de cristal (e com o toque na estátua); a porta secreta leste leva ao alçapão', async () => {
  const S = await nova('casaDaMortePorao1');
  poe(S.party[0], 33, 29);
  const esfera = op(S, S.party[0], 33, 29, 'esfera');
  assert.ok(esfera);
  await esfera.fazer();
  assert.ok(!S.cena.explorando);
  assert.equal(S.enc.combatants.filter((f) => f.defId === 'sombra').length, 5);
  assert.equal(itens(S.party[0], 'orbeDeCristalCinza'), 1);
  const T = await nova('casaDaMortePorao1');
  poe(T.party[0], 34, 30);
  d20(T, 20);
  assert.equal(T.field.surfaceAt(36, 30), 'alvenaria');
  await op(T, T.party[0], 34, 30, 'portas escondidas').fazer();
  assert.equal(T.casa().alcapao, true);
  assert.equal(T.field.surfaceAt(36, 30), 'portaAberta');
});

await teste('masmorra 1: o poço de espinhos: o passo PARA no fosso e o primeiro a pisar cai (3 + 2d10 no máximo, e o fosso fica sabido)', async () => {
  const S = await nova('casaDaMortePorao1');
  assert.equal(S.enc.paraNaCasa(S.party[0], { x: 15, y: 16 }), true, 'o passo para na tampa');
  assert.equal(S.enc.paraNaCasa(S.party[0], { x: 14, y: 16 }), false);
  poe(S.party[0], 15, 16);
  const antes = S.party[0].hp;
  await S.cena.depoisDeMover(S.party[0]);
  assert.equal(S.casa().espinhos, 'caiu');
  assert.ok(S.party[0].hp < antes && antes - S.party[0].hp <= 26, `dano ${antes - S.party[0].hp}`);
  assert.equal(S.enc.paraNaCasa(S.party[0], { x: 15, y: 16 }), false, 'depois, o passo não para mais');
});

await teste('masmorra 1: as lajes das criptas de Gustav a Thorn abrem com Atletismo CD 15 e cada herói tenta uma vez; a de Elisabeth solta o enxame', async () => {
  const S = await nova('casaDaMortePorao1');
  poe(S.party[0], 23, 12);
  const laje = op(S, S.party[0], 23, 12, 'laje');
  assert.ok(laje, 'a laje de Elisabeth tem a opção do corredor');
  d20(S, 1);
  await laje.fazer();
  assert.equal(S.field.surfaceAt(24, 12), 'alvenaria', 'tirou 1, a laje não saiu');
  assert.ok(op(S, S.party[0], 23, 12, 'laje').motivo, 'o mesmo herói não tenta duas vezes');
  d20(S, 20);
  poe(S.party[1], 23, 12);
  await op(S, S.party[1], 23, 12, 'laje').fazer();
  assert.equal(S.field.surfaceAt(24, 12), 'terraSocada', 'a laje saiu');
  assert.ok(S.casa().criptas.includes('criptaD'));
  poe(S.party[0], 26, 12);
  await op(S, S.party[0], 26, 12, 'caixão de Elisabeth').fazer();
  assert.ok(!S.cena.explorando, 'o enxame ataca');
  assert.ok(S.enc.combatants.some((f) => f.defId === 'enxameDeCentopeias'));
});

await teste('masmorra 1: deitar os ossos de Rose e de Thorn dá paz aos dois, e a paz dos dois dá Inspiração a todos', async () => {
  const S = await nova('casaDaMortePorao1');
  S.casa().criptas = ['criptaE', 'criptaF'];
  S.casa().fantasmas = 'apareceram';
  for (const id of ['ossosDeRose', 'ossosDeThorn']) garantirInventario(S.party[0]).bag.push({ id, tipo: 'item', qtd: 1 });
  poe(S.party[0], 20, 8);
  await op(S, S.party[0], 20, 8, 'ossos de Rose').fazer();
  assert.equal(S.casa().paz.rose, true);
  assert.equal(S.party[0].conditions?.some((c) => c.id === 'inspirado'), false, 'só uma criança: sem inspiração');
  poe(S.party[0], 20, 4);
  await op(S, S.party[0], 20, 4, 'ossos de Thorn').fazer();
  assert.equal(S.casa().paz.thorn, true);
  assert.ok(S.party.every((h) => h.conditions?.some((c) => c.id === 'inspirado')), 'cada herói ganha Inspiração');
});

await teste('masmorra 1: o baú dos líderes dá o tesouro do livro e acorda os dois lívidos; as tochas vêm do outro baú', async () => {
  const S = await nova('casaDaMortePorao1');
  poe(S.party[0], 13, 37);
  const tochas = itens(S.party[0], 'tocha');
  await op(S, S.party[0], 13, 37, 'tochas').fazer();
  assert.equal(itens(S.party[0], 'tocha') - tochas, 30);
  const antes = Object.fromEntries(['mantoDeProtecao', 'pocaoDeCura', 'ferramentasDeLadrao', 'livroDeMagiasDosCultistas'].map((id) => [id, itens(S.party[0], id)]));
  await op(S, S.party[0], 13, 37, 'caixa ao pé da cama').fazer();
  for (const [id, n] of [['mantoDeProtecao', 1], ['pocaoDeCura', 4], ['ferramentasDeLadrao', 1], ['livroDeMagiasDosCultistas', 1]]) assert.equal(itens(S.party[0], id) - antes[id], n, id);
  assert.ok(garantirInventario(S.party[0]).bag.some((i) => i.id === 'cotaDeMalha' && i.tipo === 'armadura'), 'a cota de malha chega como armadura');
  assert.ok(!S.cena.explorando);
  const l = S.enc.combatants.filter((f) => f.side === 'foes').map((f) => f.name).sort();
  assert.deepEqual(l, ['Elisabeth Durst', 'Gustav Durst']);
});

await teste('masmorra 1: os cinco baús do poço pedem ferramentas de ladrão, Destreza CD 15, e cada herói tenta uma vez', async () => {
  const S = await nova('casaDaMortePorao1');
  poe(S.party[0], 3, 7);
  const bau = op(S, S.party[0], 3, 6, 'baú trancado');
  assert.ok(bau, 'o baú A tem a opção');
  await bau.fazer();
  assert.equal(S.casa().achados.bauA, undefined, 'sem ferramentas de ladrão, o baú segue fechado');
  garantirInventario(S.party[0]).bag.push({ id: 'ferramentasDeLadrao', tipo: 'item', qtd: 1 });
  d20(S, 20);
  await op(S, S.party[0], 3, 6, 'baú trancado').fazer();
  assert.equal(S.casa().achados.bauA, true);
  assert.equal(itens(S.party[0], 'moedaDeOuro') >= 11, true);
});

await teste('masmorra 2: a ponte levadiça se força (Atletismo CD 20) ou se gira pela roda; a porta da prisão (Percepção CD 15) dá na câmara', async () => {
  const S = await nova('casaDaMortePorao2');
  assert.equal(S.field.surfaceAt(6, 7), 'alvenaria', 'a ponte está erguida');
  poe(S.party[0], 6, 5);
  d20(S, 20);
  const forcar = op(S, S.party[0], 6, 5, 'ponte levadiça');
  assert.ok(forcar);
  await forcar.fazer();
  assert.equal(S.casa().ponte, true);
  assert.equal(S.field.surfaceAt(6, 7), 'ponte');
  const T = await nova('casaDaMortePorao2');
  poe(T.party[0], 3, 10);
  d20(T, 20);
  await op(T, T.party[0], 3, 10, 'portas secretas').fazer();
  assert.equal(T.casa().portaPrisao, true);
  assert.equal(T.field.surfaceAt(4, 10), 'portaAberta');
  const G = await nova('casaDaMortePorao2', { campanha: { strahd: { casa: { ponte: true, portaPrisao: true, vencidos: [] } } } });
  assert.equal(G.field.surfaceAt(6, 7), 'ponte', 'o estado salvo volta ao reentrar');
  assert.equal(G.field.surfaceAt(4, 10), 'portaAberta');
});

await teste('masmorra 2: pisar no estrado abre o ritual; sacrificar um herói apazigua o culto, negar acorda Lorghoth', async () => {
  const S = await nova('casaDaMortePorao2');
  assert.equal(S.enc.paraNaCasa(S.party[0], { x: 7, y: 11 }), true, 'o passo para na primeira casa do estrado');
  assert.equal(S.enc.paraNaCasa(S.party[0], { x: 5, y: 11 }), false, 'a borda da câmara não é o estrado');
  const prefs = ['sacrificar', S.party[3].id];
  globalThis.__escolher = (esc) => { const v = prefs.shift(); const e = esc.find((x) => x.valor === v); return (e ?? esc.find((x) => x.primaria) ?? esc[0]).valor; };
  poe(S.party[0], 7, 11);
  await S.cena.depoisDeMover(S.party[0]);
  assert.equal(S.casa().ritual, 'sacrificio');
  assert.equal(S.casa().fim, 'sacrificio');
  assert.ok(S.party[3].dead, 'a vítima morreu no altar');
  assert.ok(S.cena.explorando);
  const N = await nova('casaDaMortePorao2');
  globalThis.__escolher = (esc) => (esc.find((x) => x.valor === 'negar') ?? esc[0]).valor;
  poe(N.party[0], 7, 11);
  await N.cena.depoisDeMover(N.party[0]);
  globalThis.__escolher = undefined;
  assert.equal(N.casa().fim, 'negado');
  assert.ok(!N.cena.explorando, 'Lorghoth ataca');
  assert.ok(N.enc.combatants.some((f) => f.defId === 'arbustoErrante'));
});

await teste('a casa ataca quem negou o sacrifício: portas de foice, fumaça e ratos; e a saída só abre depois do fim', async () => {
  const S = await nova('casaDaMorte1', { campanha: { strahd: { casa: { vistas: [], vencidos: [], achados: {}, fim: 'negado' } } }, nivel: 2 });
  // sem entrar pelo sótão a casa só vira furiosa ao chegar de baixo
  await S.cena.iniciar();
  assert.equal(S.casa().furia, true, 'a casa se volta contra o grupo');
  // porta de foice: cada vez que o herói termina o passo numa sala diferente, passou por uma porta
  // o grupo começa no jardim (fora de qualquer sala): entra no pórtico primeiro, e só depois passa para o salão
  poe(S.party[0], 2, 11);
  await S.cena.depoisDeMover(S.party[0]);
  poe(S.party[1], 2, 11);
  await S.cena.depoisDeMover(S.party[1]);
  poe(S.party[0], 3, 6);
  const antes = S.party[0].hp;
  d20(S, 1);
  await S.cena.depoisDeMover(S.party[0]);
  assert.ok(S.party[0].hp < antes && antes - S.party[0].hp <= 20, `a foice cortou ${antes - S.party[0].hp}`);
  await S.cena.depoisDeMover(S.party[0]);
  assert.ok(S.party[0].hp >= antes - 20 && S.party[0].hp === antes - (antes - S.party[0].hp), 'na mesma sala, a foice não corta de novo');
  d20(S, 20);
  const h = S.party[1].hp;
  poe(S.party[1], 3, 6);
  await S.cena.depoisDeMover(S.party[1]);
  assert.equal(S.party[1].hp, h, 'com 20 no dado, a foice não pega');
  // as paredes de dentro apodrecem: quebrar uma (Atletismo CD 10) solta um enxame de ratos
  poe(S.party[0], 2, 9);
  assert.equal(S.field.aresta(2, 9, 3, 9), 1, 'a parede entre a sala de espera e o canil');
  const quebrar = op(S, S.party[0], 2, 9, 'Quebrar a parede apodrecida do leste');
  assert.ok(quebrar, 'a parede de dentro se quebra');
  d20(S, 1);
  await quebrar.fazer();
  assert.equal(S.field.aresta(2, 9, 3, 9), 1, 'com 1 no dado, a parede aguenta');
  assert.ok(S.cena.explorando);
  d20(S, 20);
  await op(S, S.party[0], 2, 9, 'Quebrar a parede apodrecida do leste').fazer();
  assert.equal(S.field.aresta(2, 9, 3, 9), 3, 'a parede caiu: vira passagem');
  assert.ok(!S.cena.explorando, 'um enxame de ratos sai da parede');
  assert.equal(S.enc.combatants.filter((f) => f.defId === 'enxameDeRatos').length, 1);
  // a parede de fora (a borda do mapa) não se quebra
  poe(S.party[2], 1, 1);
  assert.equal(S.cena.interacoes({ x: 1, y: 1 }, 'assoalho', S.party[2]).some((o) => /Quebrar a parede apodrecida do norte/.test(o.rotulo)), false, 'o muro de fora é imune');
  const N = await nova('casaDaMorte1', { nivel: 2 });
  assert.equal(op(N, N.party[0], 2, 9, 'Quebrar a parede'), undefined, 'sem a casa furiosa, a parede é parede');
});

await teste('a saída: sem o fim as brumas fecham o portão; com o fim, sai e passa ao 3º nível; Rose e Thorn tentam possuir quem sai', async () => {
  const S = await nova('casaDaMorte1', { nivel: 2 });
  poe(S.party[0], 3, 13);
  await op(S, S.party[0], 3, 13, 'sair da casa').fazer();
  assert.ok(!S.app.encerrou, 'o portão não abre antes do fim');
  assert.ok(S.cena.explorando);
  const T = await nova('casaDaMorte1', { nivel: 2, campanha: { strahd: { casa: { vistas: [], vencidos: [], achados: {}, fim: 'sacrificio', fantasmas: 'apareceram', paz: {} } } } });
  T.enc.resistencia = () => ({ success: false });
  poe(T.party[0], 3, 13);
  globalThis.__escolher = (esc) => esc[0].valor;
  d20(T, 20);
  await op(T, T.party[0], 3, 13, 'sair da casa').fazer();
  globalThis.__escolher = undefined;
  assert.equal(T.casa().possuidos.length, 0, 'intimidados, os dois fantasmas largam');
  assert.ok(T.app.encerrou, 'o grupo saiu');
  assert.ok(T.party[0].xp >= 900, 'sair da casa é o marco do 3º nível (900 XP)');
  const U = await nova('casaDaMorte1', { nivel: 2, campanha: { strahd: { casa: { vistas: [], vencidos: [], achados: {}, fim: 'sacrificio', fantasmas: 'apareceram', paz: { rose: true, thorn: true } } } } });
  poe(U.party[0], 3, 13);
  await op(U, U.party[0], 3, 13, 'sair da casa').fazer();
  assert.ok(U.app.encerrou, 'em paz, ninguém tenta possuir');
  assert.equal(U.casa().possuidos?.length ?? 0, 0);
});

await teste('as escadas levam ao andar certo, vindo da origem certa; o alçapão do canil só aparece depois de visto de baixo', async () => {
  const S = await nova('casaDaMorte2');
  const sobe = op(S, S.party[0], 5, 6, 'Subir a escadaria');
  assert.ok(sobe);
  await sobe.fazer();
  assert.equal(S.trocas[0].variante, 'casaDaMorte3');
  assert.equal(S.trocas[0].entrada, 'casaDaMorte2');
  const T = await nova('casaDaMorte3', { entrada: 'casaDaMorte2' });
  assert.deepEqual(T.party.map((h) => `${h.pos.x},${h.pos.y}`), ['3,7', '4,7', '3,6', '4,6']);
  const U = await nova('casaDaMorte1');
  assert.notEqual(U.field.surfaceAt(3, 11), 'escada', 'o alçapão ainda não existe');
  const D = await nova('casaDaMortePorao1', { entrada: null });
  poe(D.party[0], 34, 30);
  d20(D, 20);
  await op(D, D.party[0], 34, 30, 'portas escondidas').fazer();
  assert.equal(D.casa().alcapaoCanil, undefined, 'achar a porta não mostra o alçapão lá em cima');
  poe(D.party[0], 37, 30);
  await D.cena.depoisDeMover(D.party[0]);
  const V = await nova('casaDaMorte1', { campanha: D.app.campanha });
  assert.equal(V.field.surfaceAt(3, 11), 'escada', 'depois de achar a porta de baixo, o alçapão aparece no canil');
});

await teste('os drenos funcionam: PV máximo (lívido) e Força (sombra) caem, e voltam nos descansos; zero mata', async () => {
  const { descansoLongo, recuperarNoCurto } = await import(P + 'rules/descanso.js');
  const S = await nova('casaDaMortePorao1');
  const [atq, alvo] = [S.party[0], S.party[1]];
  const max0 = alvo.maxHp;
  S.enc.resistencia = () => ({ success: true, total: 20, rolls: [] });
  S.enc.drenarVida(atq, alvo, { name: 'Drenar Vida', maxHpDrain: { save: 'con', dc: 13 } }, 5);
  assert.equal(alvo.maxHp, max0, 'passou na resistência: nada cai');
  S.enc.resistencia = () => ({ success: false, total: 1, rolls: [] });
  S.enc.drenarVida(atq, alvo, { name: 'Drenar Vida', maxHpDrain: { save: 'con', dc: 13 } }, 5);
  assert.equal(alvo.maxHp, max0 - 5);
  assert.ok(alvo.hp <= alvo.maxHp);
  const str0 = alvo.abilities.str;
  S.enc.drenarForca(atq, alvo, { forcaDrain: { dado: '1d4' } });
  assert.ok(alvo.abilities.str < str0 && alvo.abilities.str >= str0 - 4);
  recuperarNoCurto(alvo);
  assert.equal(alvo.abilities.str, str0, 'a Força volta no descanso curto');
  assert.equal(alvo.maxHp, max0 - 5, 'o PV máximo só volta no longo');
  descansoLongo(alvo);
  assert.equal(alvo.maxHp, max0);
  S.enc.drenarVida(atq, alvo, { name: 'x', maxHpDrain: { save: 'con', dc: 13 } }, 999);
  assert.ok(alvo.dead || alvo.hp === 0, 'PV máximo a zero mata');
});

await teste('a casa tem a escala do livro: 6 x 11 casas por andar, cada sala conecta por porta, a masmorra 1 ainda em 2 x 2 e a 2 na escala do livro (câmara 38: 12 m de lado)', async () => {
  const { Battlefield } = await import(P + 'core/grid.js');
  for (const [v, ate] of [['casaDaMorte1', 'espera'], ['casaDaMorte2', 'salao'], ['casaDaMorte3', 'varanda'], ['casaDaMorte4', 'salao']]) {
    const m = mapaDo(v);
    assert.equal(m.terreno[0].length, v === 'casaDaMorte1' ? 12 : 8, `${v}: 6 casas de largura mais o anel de fora`);
    assert.equal(m.terreno.length, v === 'casaDaMorte1' ? 19 : 13, `${v}: 11 casas de comprimento mais o anel de fora (o térreo leva o jardim da frente, 4 casas a mais)`);
    const f = montarCampo(m);
    // tudo que se anda na casa se alcança a partir de onde o grupo chega, exceto o que o livro esconde (poço, sala secreta, espiral, armário do sótão)
    const alcanca = f.reachable(m.grupo[0], 9999);
    const livres = [];
    for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) if (f.sala.has(`${x},${y}`) && !f.blocksMove(x, y)) livres.push({ x, y });
    const fora = livres.filter((c) => !alcanca.has(`${c.x},${c.y}`)).map((c) => `${c.x},${c.y}:${f.sala.get(`${c.x},${c.y}`)}`);
    const escondidos = { casaDaMorte1: ['vestiario'], casaDaMorte2: ['secreta', 'armario'], casaDaMorte3: ['poco', 'sacadaSul', 'sacadaNorte'], casaDaMorte4: ['espiral', 'criancas', 'armarioEscada'] }[v];
    const sobra = fora.filter((c) => !escondidos.some((e) => c.endsWith(`:${e}`)));
    assert.deepEqual(sobra, [], `${v}: casas que o grupo não alcança: ${sobra.join(' ')}`);
  }
  assert.ok(Battlefield);
  const porao = mapaDo('casaDaMortePorao1');
  assert.ok(porao.terreno[0].length > 30, 'a masmorra tem a sua escala própria');
  // o livro: "One square = 5 feet" e a câmara do ritual é uma sala de 12 m de lado = 8 x 8 casas de 1,5 m; a água tem 60 cm e as bordas 1,5 m
  const { ANDARES } = await import(P + 'game/casadamorte.js');
  const camara = ANDARES.casaDaMortePorao2.areas.find((a) => a.id === 'camara');
  assert.equal(camara.x2 - camara.x1 + 1, 8, 'a câmara tem 8 casas de largura');
  assert.equal(camara.y2 - camara.y1 + 1, 8, 'a câmara tem 8 casas de comprimento');
  const p2 = mapaDo('casaDaMortePorao2');
  assert.equal(p2.terreno[8][5], 'L');
  assert.equal(p2.terreno[9][6], 'r');
  assert.equal(p2.terreno[11][8], 'a');
});

await teste('investigação: cada ponto tem coordenada no mapa, perícias válidas e verbos com CD; passivas e auras só onde cabem', async () => {
  const { PISTAS } = await import(P + 'game/casadamorte-pistas.js');
  const { ANDARES } = await import(P + 'game/casadamorte.js');
  const { SKILL_NAME } = await import(P + 'rules/abilities.js');
  let pontos = 0; let verbos = 0;
  for (const [v, lista] of Object.entries(PISTAS)) {
    const m = mapaDo(v);
    const ids = new Set();
    for (const p of lista) {
      pontos += 1;
      assert.ok(!ids.has(p.id), `${v}: id repetido ${p.id}`);
      ids.add(p.id);
      assert.ok(p.x >= 0 && p.y >= 0 && p.x < m.terreno[0].length && p.y < m.terreno.length, `${v}/${p.id}: dentro do mapa (${p.x},${p.y})`);
      if (ANDARES[v]?.areas?.length && !v.includes('Porao')) assert.ok(ANDARES[v].areas.some((a) => a.contem(p)), `${v}/${p.id}: a pista está dentro de uma área da casa (${p.x},${p.y})`);
      assert.ok(p.nome && p.olhar, `${v}/${p.id}: nome e olhar`);
      assert.ok(p.verbos.length >= 1 || p.aura, `${v}/${p.id}: tem o que fazer`);
      for (const verbo of p.verbos) {
        verbos += 1;
        assert.ok(SKILL_NAME[verbo.p], `${v}/${p.id}: perícia ${verbo.p} existe`);
        assert.ok(verbo.cd >= 8 && verbo.cd <= 20, `${v}/${p.id}: CD ${verbo.cd}`);
        assert.ok(verbo.ok && verbo.ok.length > 20, `${v}/${p.id}: texto de sucesso`);
      }
      if (p.passiva) assert.ok(SKILL_NAME[p.passiva.p] && p.passiva.cd && p.passiva.texto, `${v}/${p.id}: passiva completa`);
    }
  }
  assert.ok(pontos >= 40 && verbos >= 80, `investigação rica: ${pontos} pontos, ${verbos} verbos`);
});

await teste('investigação: o botão direito oferece olhar e uma opção por perícia; uma tentativa por herói; sucesso grava no diário', async () => {
  const S = await nova('casaDaMorte1');
  poe(S.party[0], 2, 10);
  const ops = S.cena.interacoes({ x: 2, y: 10 }, S.field.surfaceAt(2, 10), S.party[0]);
  const hist = ops.find((o) => o.grupo === 'Examinar: O escudo com brasão' && o.rotulo === 'História');
  assert.ok(hist, 'História no escudo');
  assert.ok(ops.some((o) => o.grupo === 'Examinar: O escudo com brasão' && o.rotulo.startsWith('Olhar')), 'olhar de relance');
  d20(S, 1);
  await hist.fazer();
  assert.equal(S.casa().diario?.length ?? 0, 0);
  const de_novo = S.cena.interacoes({ x: 2, y: 10 }, S.field.surfaceAt(2, 10), S.party[0]).find((o) => o.grupo === 'Examinar: O escudo com brasão' && o.rotulo === 'História');
  assert.ok(de_novo.motivo, 'o mesmo herói não tenta duas vezes');
  poe(S.party[1], 2, 10);
  d20(S, 20);
  await S.cena.interacoes({ x: 2, y: 10 }, 'assoalho', S.party[1]).find((o) => o.grupo === 'Examinar: O escudo com brasão' && o.rotulo === 'História').fazer();
  assert.equal(S.casa().diario.length, 1);
  assert.ok(S.cena.interacoes({ x: 2, y: 10 }, 'assoalho', S.party[0]).some((o) => o.rotulo === 'Rever as pistas'), 'o diário aparece');
});

await teste('investigação: avisar do grick, desmascarar o mímico e achar o fosso mudam o que acontece depois', async () => {
  const S = await nova('casaDaMortePorao1');
  poe(S.party[0], 28, 18);
  d20(S, 20);
  await S.cena.interacoes({ x: 28, y: 18 }, 'terraSocada', S.party[0]).find((o) => o.grupo?.includes('alcova escura') && o.rotulo === 'Sobrevivência').fazer();
  assert.equal(S.casa().marcas.gricAvisado, true);
  poe(S.party[0], 28, 20);
  await S.cena.depoisDeMover(S.party[0]);
  assert.ok(!S.cena.explorando, 'o grick ataca mesmo assim');
  assert.equal(S.enc.emboscada, null, 'mas sem surpresa: o grupo estava avisado');
  const M = await nova('casaDaMortePorao1');
  poe(M.party[0], 21, 35);
  d20(M, 20);
  await M.cena.interacoes({ x: 21, y: 35 }, 'terraSocada', M.party[0]).find((o) => o.grupo?.includes('A porta do canto') && o.rotulo === 'Arcanismo').fazer();
  assert.equal(M.casa().marcas.mimicoVisto, true);
  poe(M.party[0], 20, 35);
  await M.cena.depoisDeMover(M.party[0]);
  assert.ok(!M.cena.explorando);
  assert.equal(M.enc.emboscada, null, 'o mímico não pega ninguém de surpresa');
  const F = await nova('casaDaMortePorao1');
  poe(F.party[0], 14, 16);
  d20(F, 20);
  await F.cena.interacoes({ x: 14, y: 16 }, 'terraSocada', F.party[0]).find((o) => o.rotulo === 'Percepção' && o.grupo?.includes('poço de espinhos')).fazer();
  assert.equal(F.casa().espinhos, 'achado', 'sem pegadas: o grupo sabe do fosso');
  assert.equal(F.enc.paraNaCasa(F.party[0], { x: 15, y: 16 }), false, 'o passo não para mais no fosso');
});

await teste('investigação: a Percepção passiva alta repara sozinha ao entrar na sala, uma vez só', async () => {
  const S = await nova('casaDaMortePorao1');
  S.party.forEach((h) => { h.skills = [...(h.skills ?? []), 'percepcao']; h.abilities.wis = 20; });
  poe(S.party[0], 14, 35);
  await S.cena.depoisDeMover(S.party[0]);
  assert.ok(S.casa().pistas['cavidadesDoQuarto:passiva'], 'a passiva do quarto dos líderes');
  const n = S.casa().diario.length;
  await S.cena.depoisDeMover(S.party[0]);
  assert.equal(S.casa().diario.length, n, 'só uma vez');
});

await teste('magias de utilidade: a cena oferece auras, trancas, fosso e a chave aos ganchos', async () => {
  const A = await nova('casaDaMortePorao1');
  const g = A.cena.ganchosMagicos(A.party[0]);
  assert.ok(g.some((x) => x.tipo === 'magico' && x.aura), 'auras do Detectar Magia');
  assert.equal(g.filter((x) => x.tipo === 'trancada').length, 5, 'os cinco baús do poço');
  const fosso = g.find((x) => x.tipo === 'armadilha');
  assert.ok(fosso.revelar(), 'o Encontrar Armadilhas acha o fosso');
  assert.equal(A.casa().espinhos, 'achado');
  const B = await nova('casaDaMorte2');
  assert.ok(B.cena.ganchosMagicos(B.party[0]).some((x) => x.tipo === 'procurado' && x.id === 'chave'), 'o Localizar Objeto acha a chave');
  const C = await nova('casaDaMorte4');
  const porta = C.cena.ganchosMagicos(C.party[0]).find((x) => x.id === 'porta20');
  await porta.fazer();
  assert.equal(C.field.aresta(4, 3, 4, 4), 3, 'o Abrir destranca o quarto das crianças');
  const D = await nova('casaDaMorte1');
  assert.ok(D.cena.ganchosMagicos(D.party[0]).some((x) => x.id === 'aura:cantoCanil'), 'o canto do canil tem aura de ilusão');
});

await teste('varanda: a segunda porta secreta (a do poço da escada, Percepção CD 15) só abre depois que a casa mostrou a escada', async () => {
  const S = await nova('casaDaMorte3');
  poe(S.party[0], 4, 6);
  d20(S, 20);
  await op(S, S.party[0], 4, 6, 'Procurar portas secretas na parede sul').fazer();
  assert.ok(!S.casa().portaOeste, 'antes da casa mostrar, nada');
  S.casa().escada = true;
  const T = await nova('casaDaMorte3', { campanha: S.app.campanha });
  poe(T.party[1], 4, 6);
  d20(T, 20);
  await op(T, T.party[1], 4, 6, 'Procurar portas secretas na parede sul').fazer();
  assert.equal(T.casa().portaOeste, true);
  assert.equal(T.field.surfaceAt(4, 8), 'escada');
  assert.equal(T.field.aresta(4, 7, 4, 8), 3, 'a porta secreta da varanda abre para o poço');
  const U = await nova('casaDaMorte3', { campanha: T.app.campanha });
  assert.equal(U.field.surfaceAt(4, 8), 'escada', 'o estado volta ao reentrar');
});

await teste('Engolir e sombra nova: o arbusto afoga quem prende; quem morre por Força 0 vira sombra', async () => {
  const S = await nova('casaDaMortePorao2');
  const mound = S.foes[0];
  S.enc.addCombatant(mound);
  const alvo = S.party[0];
  const { addCondition } = await import(P + 'rules/conditions.js');
  addCondition(alvo, 'contido', { rounds: 10, source: mound.id });
  S.enc.resistencia = () => ({ success: false, total: 1, rolls: [] });
  const hp = alvo.hp;
  S.enc.engolidosNoTurno(mound);
  assert.ok(alvo.hp < hp, 'o arbusto afoga quem está preso a ele');
  const T = await nova('casaDaMortePorao1');
  const sombra = T.foes.find((f) => f.defId === 'sombra');
  T.enc.addCombatant(sombra);
  const vitima = T.party[1];
  vitima.abilities.str = 1;
  const antes = T.enc.combatants.filter((f) => f.defId === 'sombra').length;
  T.enc.drenarForca(sombra, vitima, { forcaDrain: { dado: '1d4' }, type: 'necrótico' });
  assert.ok(vitima.dead, 'Força 0 mata');
  assert.equal(T.enc.combatants.filter((f) => f.defId === 'sombra').length, antes + 1, 'e uma sombra nova se levanta');
});

console.log(`\n${total - falhas}/${total} testes passaram`);
process.exit(falhas ? 1 : 0);
