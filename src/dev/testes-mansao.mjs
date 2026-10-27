// Testes da CENA da mansão (esconderijo dos Marcarrubra): o manto vermelho como disfarce, o rato que avisa sempre e a
// fuga jogável do Cajavidro. Roda a cena DE VERDADE (`game/capitulo3-mansao.js`) com a interface trocada por stubs:
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-mansao.mjs
import assert from 'node:assert/strict';

const P = new URL('../', import.meta.url).href;
const { Battlefield } = await import(P + 'core/grid.js');
const { Encounter } = await import(P + 'rules/combat.js');
const { makeParty } = await import(P + 'rules/party.js');
const { makeRng } = await import(P + 'core/rng.js');
const { hasCondition } = await import(P + 'rules/conditions.js');
const { mapaDo, buildFoes } = await import(P + 'game/encounter.js');
const { criarMansao } = await import(P + 'game/capitulo3-mansao.js');
const { MANSAO } = await import(P + 'game/mansao.js');

let total = 0;
let falhas = 0;
async function teste(nome, fn) {
  total += 1;
  try { await fn(); console.log(`ok    ${nome}`); } catch (e) {
    falhas += 1;
    console.log(`FALHA ${nome}\n      ${String(e.message).split('\n').join('\n      ')}`);
  }
}

/** A cena montada como o `main.js` monta: campo com luz, grupo de nível 3 na entrada da cozinha, inimigos escondidos. */
async function nova(seed = 7) {
  const mapa = mapaDo('mansao');
  const field = new Battlefield(mapa.terreno[0].length, mapa.terreno.length, mapa.terreno, mapa.altura, mapa.objetos, mapa.paredes);
  field.luz = new Uint8Array(field.w * field.h);
  mapa.luz.forEach((linha, y) => { for (let x = 0; x < field.w; x++) field.luz[y * field.w + x] = Number(linha[x] ?? 0); });
  field.luzes = (mapa.luzes ?? []).map((f) => ({ ...f }));
  const party = makeParty({ nivel: 3 });
  party.forEach((c, i) => { c.pos = { ...mapa.grupo[i] }; c.facingVec = { ...mapa.olhar }; });
  const foes = buildFoes('mansao');
  const resposta = { fim: 'paz' };
  const chamadas = [];
  const app = {
    root: { classList: { add() {}, remove() {} } }, campanha: {}, selected: null, inimigosEscondidos: foes,
    select(c) { this.selected = c; }, firstActive() { return enc.allOf('party').find((c) => !c.acted && !c.dead && c.hp > 0) ?? null; },
    refresh() {}, encerrarPartida() {}, irParaVila() {},
    conversarCom: async (npc, arvore) => { chamadas.push({ npc, arvore }); return resposta.fim; },
  };
  const enc = new Encounter({ battlefield: field, party, foes: [], rng: makeRng(seed), emboscada: null, reinforcements: () => null, onEvent: (ev) => cena?.evento?.(ev) });
  app.enc = enc;
  enc.aoComecar = () => {};
  enc.protegidoDeSurpresa = () => false;
  const cena = criarMansao(app, {});
  await cena.iniciar();
  return { app, enc, cena, field, party, foes, resposta, chamadas };
}

const poe = (h, x, y) => { h.pos = { x, y }; };
const espalhar = (S, casas) => S.party.forEach((h, i) => poe(h, casas[i].x, casas[i].y));
const vestirTodos = (S) => S.party.forEach((h) => { h.mantoVermelho = true; });
const iarnoDe = (S) => S.foes.find((f) => f.defId === 'cajavidro' || f.name === 'Cajavidro');

await teste('o rato avisa SEMPRE: Iarno sai do quarto, entra no tabuleiro e foge por onde o livro manda', async () => {
  const S = await nova();
  const iarno = iarnoDe(S);
  assert.ok(iarno, 'Iarno existe');
  espalhar(S, [{ x: 3, y: 3 }, { x: 2, y: 2 }, { x: 4, y: 2 }, { x: 4, y: 4 }]);
  await S.cena.depoisDeMover(S.party[0]);
  assert.equal(S.app.campanha.mansao.iarno, 'fugiu');
  assert.ok(S.enc.combatants.includes(iarno), 'ele fica no tabuleiro, fugindo');
  assert.ok(iarno.pos.x > 9 || iarno.pos.y !== 2, `já saiu de (9,2): ${iarno.pos.x},${iarno.pos.y}`);
  assert.ok(S.app.campanha.mansao.secretas.includes('quarto'), 'ele abriu a porta secreta do quarto');
  assert.ok(S.cena.explorando, 'a cena segue em exploração');
});

await teste('quem o alcança o vê beber o frasco: luta com Iarno invisível, e sem os guarda-costas', async () => {
  const S = await nova();
  const iarno = iarnoDe(S);
  espalhar(S, [{ x: 3, y: 3 }, { x: 2, y: 2 }, { x: 4, y: 2 }, { x: 4, y: 4 }]);
  await S.cena.depoisDeMover(S.party[0]);                         // o rato avisa
  espalhar(S, [{ x: 11, y: 4 }, { x: 12, y: 3 }, { x: 12, y: 4 }, { x: 13, y: 4 }]);   // o grupo o alcança na escadinha
  await S.cena.depoisDeMover(S.party[0]);
  assert.ok(!S.cena.explorando, 'a luta começou');
  assert.ok(hasCondition(iarno, 'invisivel'), 'ele bebeu o frasco');
  const inimigos = S.enc.combatants.filter((c) => c.side === 'foes' && !c.dead);
  assert.ok(inimigos.includes(iarno));
  assert.ok(!inimigos.some((c) => c.grupo === 'guardaCostas'), 'os guarda-costas ficaram no quarto');
  assert.equal(S.app.campanha.mansao.iarno, null, 'a fuga acabou: ele não "fugiu" mais');
});

await teste('quem não o persegue o perde: ele cruza o depósito e a caverna e sai pela cisterna, levando a bolsa', async () => {
  const S = await nova();
  const iarno = iarnoDe(S);
  espalhar(S, [{ x: 3, y: 3 }, { x: 2, y: 2 }, { x: 4, y: 2 }, { x: 4, y: 4 }]);
  await S.cena.depoisDeMover(S.party[0]);
  for (let i = 0; i < 12 && !iarno.fugiu; i += 1) await S.cena.depoisDeMover(S.party[0]);
  assert.ok(iarno.fugiu, 'escapou');
  assert.ok(!S.enc.combatants.includes(iarno), 'saiu do tabuleiro');
  const salvo = S.app.campanha.mansao;
  assert.equal(salvo.iarno, 'fugiu');
  assert.ok(salvo.bolsa, 'levou a bolsa de fuga do fundo da cisterna');
  for (const n of ['quarto', 'passagem', 'cisterna']) assert.ok(salvo.secretas.includes(n), `abriu a secreta ${n}`);
  assert.ok(S.cena.explorando);
});

await teste('os guarda-costas ficam no quarto e lutam sem XP próprio; Iarno não conta mais na luta deles', async () => {
  const S = await nova();
  espalhar(S, [{ x: 3, y: 3 }, { x: 2, y: 2 }, { x: 4, y: 2 }, { x: 4, y: 4 }]);
  await S.cena.depoisDeMover(S.party[0]);
  const guardas = S.foes.filter((f) => f.grupo === 'guardaCostas');
  assert.equal(guardas.length, 2, 'dois guarda-costas separados do chefe');
  for (let i = 0; i < 2; i += 1) await S.cena.depoisDeMover(S.party[0]);   // ele se afasta, longe do quarto
  espalhar(S, [{ x: 8, y: 4 }, { x: 6, y: 4 }, { x: 9, y: 3 }, { x: 6, y: 3 }]);
  await S.cena.depoisDeMover(S.party[0]);
  assert.ok(!S.cena.explorando, 'entrar no quarto abre a luta com eles');
  assert.ok(guardas.every((g) => S.enc.combatants.includes(g)));
});

await teste('manto vermelho na sala 10: a conversa abre antes da luta; paz deixa os bêbados neutros e a cena segue', async () => {
  const S = await nova();
  vestirTodos(S);
  S.resposta.fim = 'paz';
  espalhar(S, [{ x: 4, y: 11 }, { x: 5, y: 11 }, { x: 6, y: 11 }, { x: 4, y: 10 }]);
  await S.cena.depoisDeMover(S.party[0]);
  assert.equal(S.chamadas.length, 1, 'uma conversa');
  assert.ok(S.cena.explorando, 'sem luta');
  const bebados = S.foes.filter((f) => f.grupo === 'estar');
  assert.ok(bebados.length >= 4 && bebados.every((b) => b.side === 'neutro' && S.enc.combatants.includes(b)), 'neutros, no tabuleiro');
  await S.cena.depoisDeMover(S.party[0]);
  assert.equal(S.chamadas.length, 1, 'não repete a conversa');
});

await teste('manto vermelho na sala 10: atacar durante a conversa dá surpresa automática (sem teste de Furtividade)', async () => {
  const S = await nova();
  vestirTodos(S);
  S.resposta.fim = 'surpresa';
  espalhar(S, [{ x: 4, y: 11 }, { x: 5, y: 11 }, { x: 6, y: 11 }, { x: 4, y: 10 }]);
  await S.cena.depoisDeMover(S.party[0]);
  assert.ok(!S.cena.explorando, 'luta');
  assert.equal(S.enc.emboscada?.emboscadores, 'party');
  assert.ok(S.enc.emboscada.furtividade.every((v) => v >= 30), 'surpresa sem depender do dado');
});

await teste('sala 10 sem manto: entra como antes, de surpresa e sem conversa', async () => {
  const S = await nova();
  espalhar(S, [{ x: 4, y: 11 }, { x: 5, y: 11 }, { x: 6, y: 11 }, { x: 4, y: 10 }]);
  await S.cena.depoisDeMover(S.party[0]);
  assert.equal(S.chamadas.length, 0);
  assert.ok(!S.cena.explorando);
});

await teste('um herói sem manto estraga o disfarce dos outros: luta, sem conversa', async () => {
  const S = await nova();
  vestirTodos(S);
  S.party[3].mantoVermelho = false;
  espalhar(S, [{ x: 4, y: 11 }, { x: 5, y: 11 }, { x: 6, y: 11 }, { x: 4, y: 10 }]);
  await S.cena.depoisDeMover(S.party[0]);
  assert.equal(S.chamadas.length, 0);
  assert.ok(!S.cena.explorando);
});

await teste('sala 9, de manto: conversa com Mosk; paz deixa os bugbears neutros e põe o Droop no tabuleiro para falar', async () => {
  const S = await nova();
  vestirTodos(S);
  S.resposta.fim = 'paz';
  espalhar(S, [{ x: 3, y: 15 }, { x: 2, y: 15 }, { x: 4, y: 15 }, { x: 3, y: 14 }]);
  await S.cena.depoisDeMover(S.party[0]);
  assert.equal(S.chamadas.length, 1, 'uma conversa');
  assert.equal(S.chamadas[0].npc.name, 'Mosk');
  assert.ok(S.cena.explorando);
  const droop = S.foes.find((f) => f.defId === 'droop');
  assert.ok(S.enc.combatants.includes(droop), 'Droop acordado e no tabuleiro');
  assert.ok(S.cena.dialogoDe(droop), 'dá para falar com o Droop');
  const bugbears = S.foes.filter((f) => f.grupo === 'guardas' && f.defId === 'bugbear');
  assert.ok(bugbears.every((b) => b.side === 'neutro'));
});

await teste('sala 9, de manto, conversa que acaba em luta: sem surpresa para quem foi descoberto', async () => {
  const S = await nova();
  vestirTodos(S);
  S.resposta.fim = 'luta';
  espalhar(S, [{ x: 3, y: 15 }, { x: 2, y: 15 }, { x: 4, y: 15 }, { x: 3, y: 14 }]);
  await S.cena.depoisDeMover(S.party[0]);
  assert.equal(S.chamadas.length, 1);
  assert.ok(!S.cena.explorando);
  assert.ok(!S.enc.emboscada, 'sem emboscada para ninguém');
});

await teste('as árvores de conversa do manto não têm beco: todo destino existe e todo nó leva a algum lugar', async () => {
  const S = await nova();
  vestirTodos(S);
  S.resposta.fim = 'paz';
  espalhar(S, [{ x: 4, y: 11 }, { x: 5, y: 11 }, { x: 6, y: 11 }, { x: 4, y: 10 }]);
  await S.cena.depoisDeMover(S.party[0]);
  const S2 = await nova();
  vestirTodos(S2);
  espalhar(S2, [{ x: 3, y: 15 }, { x: 2, y: 15 }, { x: 4, y: 15 }, { x: 3, y: 14 }]);
  await S2.cena.depoisDeMover(S2.party[0]);
  for (const arvore of [S.chamadas[0].arvore, S2.chamadas[0].arvore]) {
    assert.ok(arvore.nos[arvore.inicio], 'o início existe');
    for (const [nome, no] of Object.entries(arvore.nos)) {
      assert.ok(no.opcoes?.length || no.fim, `o nó ${nome} tem saída`);
      for (const o of no.opcoes ?? []) {
        const destinos = [o.vai, o.sucesso, o.falha].filter(Boolean);
        for (const d of destinos) assert.ok(arvore.nos[d], `${nome} → ${d} existe`);
        assert.ok(destinos.length || o.fim !== undefined, `a opção "${o.texto}" leva a algum lugar`);
        if (o.teste) assert.ok(o.sucesso && o.falha, `o teste de "${o.texto}" tem os dois desfechos`);
      }
    }
  }
});

await teste('as portas comuns da planta nascem fechadas, cortam a visão e abrem e fecham de graça; a da escada da cozinha nasce aberta', async () => {
  const S = await nova();
  const cod = (a, b) => S.field.aresta(a.x, a.y, b.x, b.y);
  assert.equal(cod({ x: 5, y: 3 }, { x: 6, y: 3 }), 2, 'a porta da oficina para o quarto nasce fechada');
  assert.equal(cod({ x: 27, y: 14 }, { x: 28, y: 14 }), 3, 'a da escada nasce aberta');
  assert.equal(S.field.hasLineOfSight({ x: 4, y: 3 }, { x: 8, y: 3 }), false, 'fechada, ela corta a visão');
  const h = S.party[0];
  poe(h, 5, 3);
  const abrir = S.cena.interacoes({ x: 5, y: 3 }, 'laje', h).find((o) => o.rotulo === 'Abrir a porta');
  assert.ok(abrir, 'o menu da casa junto da porta oferece abrir');
  await abrir.fazer();
  assert.equal(cod({ x: 5, y: 3 }, { x: 6, y: 3 }), 3);
  assert.equal(S.field.hasLineOfSight({ x: 4, y: 3 }, { x: 8, y: 3 }), true, 'aberta, deixa ver');
  const fechar = S.cena.interacoes({ x: 5, y: 3 }, 'laje', h).find((o) => o.rotulo === 'Fechar a porta');
  assert.ok(fechar, 'e oferece fechar');
  assert.equal(S.app.campanha.mansao.portasComuns['5,3,6,3'], true, 'o estado fica salvo');
});

await teste('as paredes são arestas e não se clicam: junto de uma secreta o menu vem no próprio herói, e achar a secreta abre a aresta', async () => {
  const S = await nova();
  const h = S.party[0];
  poe(h, 9, 3);                                              // no quarto, junto da secreta (9,2)|(10,2)
  const menu = S.cena.interacoesDoHeroi(h);
  const procurar = menu.find((o) => o.rotulo === 'Procurar porta secreta');
  assert.ok(procurar, 'o herói perto da secreta pode procurar');
  assert.equal(S.field.aresta(9, 2, 10, 2), 1, 'a secreta é parede até ser achada');
  poe(h, 2, 3);
  assert.ok(!S.cena.interacoesDoHeroi(h).some((o) => o.rotulo === 'Procurar porta secreta'), 'longe de qualquer secreta o menu não oferece procurar');
});

console.log(`\n${total - falhas}/${total} testes passaram${falhas ? `, ${falhas} FALHARAM` : ''}.`);
process.exit(falhas ? 1 : 0);
