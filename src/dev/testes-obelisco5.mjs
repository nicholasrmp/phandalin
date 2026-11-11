// O CAPÍTULO 5 DO OBELISCO NA VILA (`game/obelisco5-vila.js`), com a interface trocada por stubs:
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-obelisco5.mjs
//
// A chegada (o contrato do Harbin), as cenas de crime (uma vez cada), as pistas, a Gwyn e o MARCO do 6º nível.
import assert from 'node:assert/strict';

const P = new URL('../', import.meta.url).href;
const { criarCapitulo5NaVila, capitulo5Ativo, darMarco, PISTAS_DO_CAP5 } = await import(P + 'game/obelisco5-vila.js');
const { makeParty } = await import(P + 'rules/party.js');
const { makeRng } = await import(P + 'core/rng.js');
const { XP_POR_NIVEL } = await import(P + 'rules/progressao.js');

let total = 0;
let falhas = 0;
async function teste(nome, fn) {
  total += 1;
  try { await fn(); console.log(`ok    ${nome}`); } catch (e) {
    falhas += 1;
    console.log(`FALHA ${nome}\n      ${String(e.stack ?? e.message).split('\n').slice(0, 5).join('\n      ')}`);
  }
}

/** A vila de mentira: as conversas devolvem `fimDaConversa` e registram quem falou. */
function vila({ seed = 3, nivel = 5, fimDaConversa = 'simples' } = {}) {
  const grupo = makeParty({ nivel });
  const camp = { aventuraConcluida: true, vila: { dia: 1, tempo: 0, missoes: {}, pistas: [], feito: {} } };
  const registro = [];
  const conversas = [];
  const ctx = {
    app: { root: null }, camp, v: camp.vila, vivos: () => grupo.filter((h) => !h.dead), rng: makeRng(seed), registro,
    missao: (id) => { camp.vila.missoes[id] = 'ativa'; },
    pista: (t) => { if (!camp.vila.pistas.includes(t)) camp.vila.pistas.push(t); },
    falar: async (id, arvore) => {
      conversas.push(id);
      // corre o nó de início e os `ao` dos nós por onde passa a primeira opção sem teste que vai para outro nó
      const no = arvore.nos[arvore.inicio];
      no.ao?.();
      return fimDaConversa;
    },
  };
  return { grupo, camp, ctx, registro, conversas, cap5: criarCapitulo5NaVila(ctx) };
}

await teste('o capítulo 5 só começa depois da Mina Perdida', () => {
  assert.equal(capitulo5Ativo({}), false);
  assert.equal(capitulo5Ativo({ aventuraConcluida: true }), true);
});

await teste('a chegada: o Harbin contrata (50 po agora, 150 no fim; 100 e 300 se o grupo apertar) e abre a missão', async () => {
  const s = vila({ fimDaConversa: 'simples' });
  await s.cap5.chegada();
  assert.equal(s.camp.obelisco5.iniciado, true);
  assert.deepEqual(s.camp.obelisco5.pagamento, { agora: 50, fim: 150 });
  assert.equal(s.camp.vila.missoes.sawplee, 'ativa');
  const ouro = s.grupo[0].bag.find((i) => i.id === 'moedaDeOuro')?.qtd ?? 0;
  await s.cap5.chegada();                                   // a segunda chegada não paga de novo
  assert.equal(s.grupo[0].bag.find((i) => i.id === 'moedaDeOuro')?.qtd ?? 0, ouro);
  const d = vila({ fimDaConversa: 'dobro' });
  await d.cap5.chegada();
  assert.deepEqual(d.camp.obelisco5.pagamento, { agora: 100, fim: 300 });
});

await teste('as cenas de crime: cada uma uma vez, e o Ander e o balcão do Gigante dão a pista do nome', async () => {
  const s = vila();
  await s.cap5.chegada();
  assert.deepEqual(await s.cap5.cenaDoLugar('barthen'), { descer: 'cavernaDoPoco' }, 'a cena acaba oferecendo descer o poço');
  assert.ok(s.camp.obelisco5.pistas.includes('nome'), 'o Ander conta do "Repouso"');
  assert.deepEqual(await s.cap5.cenaDoLugar('barthen'), { descer: 'cavernaDoPoco' }, 'sem a luta feita, a segunda visita oferece de novo');
  s.camp.obelisco5.lutas.poco = true;
  assert.equal(await s.cap5.cenaDoLugar('barthen'), null, 'feita a luta, é a Barthen de sempre');
  assert.deepEqual(await s.cap5.cenaDoLugar('gigante'), { descer: 'giganteTerreo' }, 'e a do Gigante, entrar no salão revirado');
  assert.equal(await s.cap5.cenaDoLugar('pomar'), null, 'o pomar não é cena de crime');
  assert.ok(s.camp.obelisco5.feito.gwyn, 'depois da primeira cena a Gwyn aparece');
});

await teste('a Gwyn: com as quatro pistas acha o posto sem teste, e o marco leva ao 6º nível', async () => {
  const s = vila();
  await s.cap5.chegada();
  s.camp.obelisco5.feito.gwyn = true;
  s.camp.obelisco5.pistas.push(...Object.keys(PISTAS_DO_CAP5));
  assert.equal(await s.cap5.cenaDoLugar('estalagem'), 'sai');
  assert.ok(s.camp.obelisco5.feito.zorzula, 'o Repouso de Zorzula foi achado');
  assert.equal(s.camp.vila.missoes.zorzula, 'ativa');
  for (const h of s.grupo) assert.ok(h.xp >= XP_POR_NIVEL[6], `${h.name} chegou ao piso do 6º`);
  assert.equal(await s.cap5.cenaDoLugar('estalagem'), null, 'depois, a estalagem é a de sempre');
});

await teste('o marco não tira XP de quem já passou do piso', () => {
  const [a, b] = makeParty({ nivel: 5 });
  b.xp = XP_POR_NIVEL[6] + 500;
  darMarco([a, b], 6);
  assert.equal(a.xp, XP_POR_NIVEL[6]);
  assert.equal(b.xp, XP_POR_NIVEL[6] + 500);
});

// AS TRÊS LUTAS PEQUENAS (`obelisco5-lutas.js`), com a cena de verdade sobre os mapas da FA.
const { Encounter } = await import(P + 'rules/combat.js');
const { montarCampo } = await import(P + 'game/campo.js');
const { mapaDo } = await import(P + 'game/encounter.js');
const { criarLutaDaVila5 } = await import(P + 'game/obelisco5-lutas.js');

async function luta(variante, { seed = 5 } = {}) {
  const mapa = mapaDo(variante);
  const field = montarCampo(mapa);
  const party = makeParty({ nivel: 5 });
  party.forEach((c, i) => { c.pos = { ...mapa.grupo[i] }; });
  const app = { root: { classList: { add() {}, remove() {} } }, campanha: { obelisco5: { iniciado: true, cenas: {}, pistas: [], feito: {} }, vila: { pistas: [] } },
    selected: null, select(c) { this.selected = c; }, firstActive: () => null, refresh() {}, encerrarPartida() {}, irParaVila() { app.voltou = true; },
    newEncounter(cfg) { app.foiPara = cfg.cenaDaVila; }, mostrarTexto(t, x) { app.texto = [t, x]; } };
  let cena = null;
  const enc = new Encounter({ battlefield: field, party, foes: [], rng: makeRng(seed), emboscada: null, reinforcements: () => null, onEvent: (ev) => cena?.evento?.(ev) });
  app.enc = enc;
  enc.aoComecar = () => {};
  cena = criarLutaDaVila5(app, { cenaDaVila: variante });
  await cena.iniciar();
  return { app, enc, cena, party, o5: app.campanha.obelisco5 };
}

await teste('a caverna do poço: o otyugh no mapa da FA, e a descida pela corda decide a surpresa', async () => {
  const { enc, cena } = await luta('cavernaDoPoco');
  assert.equal(cena.inimigos.length, 1);
  assert.equal(cena.inimigos[0].defId, 'otyugh');
  assert.ok(enc.combatants.includes(cena.inimigos[0]), 'o otyugh entrou na luta');
});

await teste('o acampamento: três goblins FERIDOS, a pista do nome do chefe, e morto um os outros se rendem', async () => {
  const { enc, cena, o5, app } = await luta('acampamentoSawplee');
  assert.equal(cena.inimigos.length, 3);
  for (const g of cena.inimigos) assert.equal(g.hp, Math.ceil(g.maxHp / 2), 'feridos: metade dos PV');
  assert.ok(o5.pistas.includes('chefe'), 'ouvem o nome do Ruxithid ao chegar');
  enc.applyDamage(cena.inimigos[0], 999, 'cortante', null, { magico: true });
  assert.ok(cena.inimigos.slice(1).every((g) => g.capturado && g.side === 'neutro'), 'os outros dois se rendem');
  assert.equal(enc.outcome, 'vitoria');
  await cena.fimDoCombate('vitoria');
  assert.ok(o5.lutas.acampamento);
  assert.ok(o5.pistas.includes('duergar'), 'os rendidos contam do posto duergar');
  // depois da vitória o acampamento se anda, e volta-se pela trilha
  assert.ok(cena.explorando && !app.voltou, 'a vitória não leva de volta na hora: o mapa fica aberto');
  const dara = enc.combatants.find((c) => c.side === 'party' && !c.dead);
  const trilha = mapaDo('acampamentoSawplee').interativos.find((o) => o.id === 'trilha');
  dara.pos = { x: trilha.x + 1, y: trilha.y };
  const volta = cena.interacoes(trilha, 'chao', dara).find((o) => /Phandalin/.test(o.rotulo));
  assert.ok(volta && !volta.motivo, 'a trilha volta a Phandalin');
  volta.fazer();
  assert.ok(app.voltou && cena.encerrado && !cena.explorando);
});

await teste('o telhado: o comandante e dois lutadores no alto; caído um, os outros fogem e largam o saco', async () => {
  const { enc, cena, o5, app } = await luta('telhadoGigante');
  assert.deepEqual(cena.inimigos.map((g) => g.defId).sort(), ['goblinPsiComandante', 'goblinPsiLutador', 'goblinPsiLutador']);
  assert.equal(enc.field.heightAt(cena.inimigos[0].pos.x, cena.inimigos[0].pos.y), 4, 'o comandante está no telhado, no alto');
  assert.equal(enc.field.heightAt(0, 0), 0, 'a rua fica embaixo');
  enc.applyDamage(cena.inimigos[1], 999, 'cortante', null, { magico: true });
  assert.ok(cena.inimigos.filter((g) => !g.dead).every((g) => g.fugiu), 'os outros pulam do telhado e somem');
  assert.equal(enc.outcome, 'vitoria');
  await cena.fimDoCombate('vitoria');
  assert.ok(o5.lutas.telhado);
  assert.ok(o5.feito.refeicoesDaGrista, 'o saco volta à dona (a escolha primária)');
  // explorando, a chaminé desce ao salão
  assert.ok(cena.explorando);
  const { PONTOS_CAP5_VILA: PT } = await import(P + 'game/obelisco5-mapas.js');
  const ch = PT.TELHADO_GIGANTE.chamine;
  const quem = enc.combatants.find((c) => c.side === 'party' && !c.dead);
  quem.pos = { x: ch.x + 1, y: ch.y };
  const descer = cena.interacoes(ch, 'chao', quem).find((o) => /chaminé/.test(o.rotulo));
  assert.ok(descer && !descer.motivo);
  descer.fazer();
  assert.equal(app.foiPara, 'giganteTerreo', 'a chaminé leva ao térreo');
  assert.ok(!app.voltou);
});

// O QUE A REVISÃO DOS MAPAS PÔS NA REGRA (2026-11-08): o que a cena do Foundry não trazia.
await teste('os mapas das lutas: pedras que cobrem na caverna, mata e fogueiras no acampamento, prédios e cobertura no telhado', async () => {
  const cav = montarCampo(mapaDo('cavernaDoPoco'));
  for (const [x, y] of [[11, 11], [11, 15], [11, 16], [2, 10]]) {
    assert.ok(cav.blocksMove(x, y), `a pedra (${x},${y}) barra o passo`);
    assert.equal(cav.surfaceAt(x, y), 'pedra');
  }
  assert.ok(cav.coverBetween({ x: 10, y: 11 }, { x: 13, y: 11 }) >= 2, 'a pedra do leito dá cobertura');
  const ac = montarCampo(mapaDo('acampamentoSawplee'));
  assert.equal(ac.surfaceAt(5, 10), 'fogueira');
  assert.equal(ac.surfaceAt(8, 15), 'fogueira');
  assert.equal((ac.luzes ?? []).filter((l) => l.tipo === 'fogueira').length, 2, 'as duas fogueiras acendem');
  const mata = [];
  for (let y = 0; y < ac.h; y++) for (let x = 0; x < ac.w; x++) if (ac.surfaceAt(x, y) === 'mato') mata.push([x, y]);
  assert.ok(mata.length > 60, `a mata fechada da borda é terreno difícil (${mata.length} casas)`);
  assert.ok(mata.every(([x, y]) => x <= 2 || x >= 11 || y <= 6 || y >= 19), 'e fica na borda, não na clareira');
  assert.ok(mapaDo('acampamentoSawplee').frente, 'as copas cobrem quem passa por baixo');
  const te = montarCampo(mapaDo('telhadoGigante'));
  for (const [x, y] of [[10, 3], [14, 13], [9, 19]]) assert.ok(te.blocksMove(x, y), `o prédio em (${x},${y}) barra o passo`);
  assert.equal(te.surfaceAt(14, 9), 'carroca');
  assert.ok((te.luzes ?? []).every((l) => l.soNoEscuro), 'as lanternas da rua só acendem no escuro');
});

// O TÉRREO DO GIGANTE ADORMECIDO (`obelisco5-terreo.js`): o salão revirado como tabuleiro de exploração.
const { criarGiganteTerreo } = await import(P + 'game/obelisco5-terreo.js');
await teste('o térreo do Gigante: o balcão dá a pista do nome, a cozinha se alcança, a lareira sobe ao telhado, e há com quem falar', async () => {
  const mapa = mapaDo('giganteTerreo');
  const field = montarCampo(mapa);
  const party = makeParty({ nivel: 5 });
  party.forEach((c, i) => { c.pos = { ...mapa.grupo[i] }; });
  const app = { root: { classList: { add() {}, remove() {} } }, campanha: { obelisco5: { iniciado: true, cenas: {}, pistas: [], feito: {} }, vila: { pistas: [], tempo: 0 } },
    selected: null, select(c) { this.selected = c; }, refresh() {}, newEncounter(cfg) { app.foiPara = cfg.cenaDaVila; }, irParaVila() { app.voltou = true; } };
  const enc = new Encounter({ battlefield: field, party, foes: [], rng: makeRng(4), emboscada: null, reinforcements: () => null });
  app.enc = enc;
  const cena = criarGiganteTerreo(app);
  app.capitulo = cena;
  await cena.iniciar();
  assert.ok(cena.explorando);
  const { PONTOS_CAP5_VILA: PT } = await import(P + 'game/obelisco5-mapas.js');
  const T = PT.GIGANTE_TERREO;
  // o balcão: a pista do nome
  const dara = party[0];
  dara.pos = { x: T.balcao[1].x - 1, y: T.balcao[1].y };
  const ex = cena.interacoes(T.balcao[1], 'entulho', dara).find((o) => /balcão/.test(o.rotulo));
  assert.ok(ex && !ex.motivo, 'perto do balcão dá para examiná-lo');
  await ex.fazer();
  assert.ok(app.campanha.obelisco5.pistas.includes('nome'), '"Zorz isteve aki": a pista do nome');
  // a cozinha se alcança andando (a passagem do bar foi aberta), e a lareira tem a chaminé
  const alc = field.reachable(mapa.grupo[0], 100000, () => false);
  for (const q of T.cozinha) assert.ok(alc.has(`${q.x},${q.y}`), `a cozinha (${q.x},${q.y}) se alcança`);
  dara.pos = { x: T.lareira.x + 1, y: T.lareira.y };
  const subir = cena.interacoes(T.lareira, 'chao', dara).find((o) => /chaminé/.test(o.rotulo));
  assert.ok(subir, 'a lareira sobe ao telhado');
  // a Greska e o Wheel estão no salão, e cada um tem a sua conversa
  const { greska, wheel } = cena.npcs;
  assert.ok(enc.combatants.includes(greska) && enc.combatants.includes(wheel));
  assert.equal(greska.side, 'neutro');
  assert.ok(cena.dialogoDe(wheel)?.nos?.maldito, 'o Wheel esconde as bebidas erradas');
  assert.ok(cena.dialogoDe(greska)?.nos?.oi);
  // as quatro portas da FA têm folha (abrem e fecham)
  assert.equal(mapa.folhas.length, 4);
  // OS TELHADOS dos vizinhos cobrem o que há dentro e somem quando um herói entra
  const telhados = T.telhados;
  for (const [id, objId] of [['telhadoGalpao', 'cocho'], ['telhadoSudeste', 'camaSE'], ['telhadoSul', 'bau']]) {
    const o = mapa.interativos.find((i) => i.id === objId);
    assert.ok(telhados[id].some((q) => q.x === o.x && q.y === o.y), `${objId} fica debaixo do ${id}`);
    const peca = () => field.sobreposicoes.find((q) => q.id === id);
    cena.atualizarTelhados();
    assert.equal(peca().ligada, true, `${id} nasce coberto`);
    const antes = { ...dara.pos };
    dara.pos = { x: o.x, y: o.y };
    cena.depoisDeMover(dara);
    assert.equal(peca().ligada, false, `com a Dara dentro, o ${id} some`);
    dara.pos = antes;
    cena.depoisDeMover(dara);
    assert.equal(peca().ligada, true, `ela sai, o ${id} volta`);
  }
  // a chaminé leva ao tabuleiro do telhado
  await subir.fazer();
  assert.equal(app.foiPara, 'telhadoGigante');
});

const { PONTOS_CAP5_VILA: PT5 } = await import(P + 'game/obelisco5-mapas.js');
// O CENÁRIO VIVO (pedido do dono, 2026-11-08): os objetos que a arte desenha nos quatro mapas se olham, e alguns têm
// teste. Nem todo dá prêmio: o ponto é o lugar parecer habitado.
const { opcoesDaCasa } = await import(P + 'game/interacoes.js');
await teste('o cenário vivo: cada mapa novo tem o que olhar, o texto vem de graça e o teste é a mais', async () => {
  const minimo = { cavernaDoPoco: 10, acampamentoSawplee: 14, telhadoGigante: 8, giganteTerreo: 35 };
  for (const [variante, n] of Object.entries(minimo)) {
    const mapa = mapaDo(variante);
    const objs = mapa.interativos ?? [];
    assert.ok(objs.length >= n, `${variante}: ${objs.length} objetos, esperava ${n} ou mais`);
    assert.equal(new Set(objs.map((o) => o.id)).size, objs.length, `${variante}: ids repetidos`);
    assert.equal(new Set(objs.map((o) => `${o.x},${o.y}`)).size, objs.length, `${variante}: dois objetos na mesma casa`);
    const field = montarCampo(mapa);
    for (const o of objs) {
      assert.ok(o.texto && o.texto.length > 40, `${variante}/${o.id}: tem o que dizer`);
      assert.ok(o.x >= 0 && o.y >= 0 && o.y < mapa.terreno.length && o.x < mapa.terreno[0].length, `${variante}/${o.id} dentro do mapa`);
      if (o.pista) assert.ok(o.olhar && ['investigar', 'rastrear', 'procurar', 'lembrar', 'examinar'].includes(o.pista.verbo), `${variante}/${o.id}: verbo do menu`);
      // alguém chega perto o bastante: uma casa livre ao alcance do objeto
      const alcance = o.alcance ?? 5;
      let perto = false;
      for (let dy = -8; dy <= 8 && !perto; dy++) for (let dx = -8; dx <= 8 && !perto; dx++) {
        const x = o.x + dx; const y = o.y + dy;
        if (!field.inside(x, y) || field.blocksMove(x, y)) continue;
        if (Math.max(Math.abs(dx), Math.abs(dy)) * 5 <= alcance) perto = true;
      }
      assert.ok(perto, `${variante}/${o.id}: nenhuma casa livre a ${alcance} pés`);
    }
  }
  // no jogo: depois da luta da caverna, a pilha de lixo mostra o texto e a represa tem o teste e a escavação
  const { app, enc, cena, o5 } = await luta('cavernaDoPoco');
  app.capitulo = cena;
  enc.applyDamage(cena.inimigos[0], 999, 'cortante', null, { magico: true });
  await cena.fimDoCombate('vitoria');
  assert.ok(cena.explorando);
  const objs = enc.field.interativos;
  const heroi = enc.combatants.find((c) => c.side === 'party' && !c.dead);
  app.selected = heroi;
  const lixo = [...objs.values()].find((o) => o.id === 'lixo');
  heroi.pos = { x: lixo.x + 1, y: lixo.y };
  app._visao = null;
  const menu = opcoesDaCasa(app, lixo);
  const rot = menu.opcoes.map((o) => o.rotulo);
  assert.ok(rot.includes('Revirar o lixo'), `o texto de graça: ${rot.join(' | ')}`);
  assert.ok(rot.some((r) => /Investigar/.test(r)), 'e o teste por cima');
  await menu.opcoes.find((o) => o.rotulo === 'Revirar o lixo').fazer();
  assert.match(app.texto[1], /colher/);
  const rep = PT5.CAVERNA_DO_POCO.desmoronamento;
  heroi.pos = { x: rep.x, y: rep.y + 1 };
  const cavar = cena.interacoes(rep, 'entulho', heroi).find((o) => /Cavar/.test(o.rotulo));
  assert.ok(cavar && !cavar.motivo, 'cava-se o túnel na represa');
  await cavar.fazer();
  assert.ok(o5.feito.tunelDoPoco);
  assert.ok(!cena.interacoes(rep, 'entulho', heroi).some((o) => /Cavar/.test(o.rotulo)), 'cavado, não se cava de novo');
  const luz = PT5.CAVERNA_DO_POCO.luzDoPoco;
  heroi.pos = { x: luz.x + 1, y: luz.y };
  const subir = cena.interacoes(luz, 'chao', heroi).find((o) => /corda/.test(o.rotulo));
  subir.fazer();
  assert.ok(app.voltou, 'a corda volta à vila');
});

console.log(`\n${total - falhas}/${total} testes passaram.`);
if (falhas) process.exit(1);
