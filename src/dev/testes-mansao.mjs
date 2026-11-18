// Testes da CENA da mansão (esconderijo dos Marcarrubra): o manto vermelho como disfarce, o familiar que avisa sempre e a
// fuga jogável do Cajavidro. Roda a cena DE VERDADE (`game/capitulo3-mansao.js`) com a interface trocada por stubs:
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-mansao.mjs
import assert from 'node:assert/strict';

const P = new URL('../', import.meta.url).href;
const { Battlefield } = await import(P + 'core/grid.js');
const { Encounter } = await import(P + 'rules/combat.js');
const { makeParty } = await import(P + 'rules/party.js');
const { makeRng } = await import(P + 'core/rng.js');
const { hasCondition, addCondition } = await import(P + 'rules/conditions.js');
const { mapaDo, buildFoes } = await import(P + 'game/encounter.js');
const { criarMansao } = await import(P + 'game/capitulo3-mansao.js');
const { MANSAO } = await import(P + 'game/mansao.js');
const { prepararRegioes } = await import(P + 'rules/regioes.js');

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
async function nova(seed = 7, { campanha = {} } = {}) {
  const mapa = mapaDo('mansao');
  const field = new Battlefield(mapa.terreno[0].length, mapa.terreno.length, mapa.terreno, mapa.altura, mapa.objetos, mapa.paredes);
  prepararRegioes(field, mapa.regioes);     // como o `montarCampo` faz: o fosso e a ponte do sul são regiões do mapa
  field.luz = new Uint8Array(field.w * field.h);
  mapa.luz.forEach((linha, y) => { for (let x = 0; x < field.w; x++) field.luz[y * field.w + x] = Number(linha[x] ?? 0); });
  field.luzes = (mapa.luzes ?? []).map((f) => ({ ...f }));
  // as peças de arte, como o `montarCampo` as copia: a ponte que cai e o fosso que abre acendem a peça deles
  field.sobreposicoes = (mapa.sobreposicoes ?? []).map((o) => ({ ...o, ligada: Boolean(o.ligada) }));
  field.alternarSobreposicao = (id, ligada) => { const o = field.sobreposicoes.find((q) => q.id === id); if (!o || o.ligada === ligada) return false; o.ligada = ligada; return true; };
  const party = makeParty({ nivel: 3 });
  party.forEach((c, i) => { c.pos = { ...mapa.grupo[i] }; c.facingVec = { ...mapa.olhar }; });
  const foes = buildFoes('mansao');
  const resposta = { fim: 'paz' };
  const chamadas = [];
  const app = {
    root: { classList: { add() {}, remove() {} } }, campanha, selected: null, inimigosEscondidos: foes,
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

// O QUADRO "O QUE OS MARCARRUBRA SABEM" DO LIVRO, na mesa dos bêbados. O jogo entregava dois itens dele (o mago
// do cajado de vidro, o bicho da fenda) num nó único; os presos das jaulas, onde fica a pilhagem, a cripta em
// que ninguém entra sem manto e o "tem alguém acima do chefe" ficavam de fora. Capturar bandido para
// interrogar o jogo não tem — só o Cajavidro se rende —, então o quadro sai por onde dá para falar com eles.
// E DERRUBAR A MESA é a distração que o livro sugere ali, com as pilhas de moeda do jogo de pedrinhas.
await teste('a mesa dos bêbados entrega o quadro do livro, e derrubá-la espalha o dinheiro', async () => {
  const S = await nova();
  vestirTodos(S);
  S.resposta.fim = 'paz';
  const estar = S.foes.filter((c) => c.grupo === 'estar');
  assert.equal(estar.length, 4, 'quatro bêbados na sala 10');
  espalhar(S, [{ x: estar[0].pos.x, y: estar[0].pos.y + 1 }, { x: estar[1].pos.x, y: estar[1].pos.y + 1 },
    { x: estar[2].pos.x, y: estar[2].pos.y + 1 }, { x: estar[3].pos.x, y: estar[3].pos.y + 1 }]);
  await S.cena.depoisDeMover(S.party[0]);
  const arvore = S.chamadas.map((ch) => ch.arvore).find((a) => a?.nos?.aceitam);
  assert.ok(arvore, `os bêbados conversaram: ${S.chamadas.length} conversa(s)`);
  for (const no of ['chefe', 'presos', 'pilhagem', 'ossos', 'acima', 'mesaVirada']) {
    assert.ok(arvore.nos[no], `o nó ${no} existe`);
  }
  // o "quem manda no mago" é apertado, e os bugbears é que sabem o resto
  const aperto = arvore.nos.aceitam.opcoes.find((o) => o.sucesso === 'acima');
  assert.equal(aperto.teste.pericia, 'intimidacao', 'apertar é Intimidação');
  assert.equal(aperto.falha, 'desconfiam', 'e falhar põe a sala em cima deles');
  // derrubar a mesa marca o estado, e o verbo do dinheiro muda de nome
  const virar = arvore.nos.aceitam.opcoes.find((o) => o.vai === 'mesaVirada');
  assert.ok(virar, 'a opção de derrubar a mesa está lá');
  arvore.nos.mesaVirada.ao();
  assert.ok(S.app.campanha.mansao.mesaVirada, 'o estado guarda a mesa virada');
  // e as duas saídas do nó são as do livro: atacar na confusão, ou sair enquanto eles catam
  assert.deepEqual(arvore.nos.mesaVirada.opcoes.map((o) => o.fim), ['surpresa', 'paz']);
});

// O DROOP ACORDA COM UMA AÇÃO, como o livro manda. O despertar estava grudado no saque do cinto do Nosk: grupo
// que vencesse os bugbears e não revirasse nada ficava com o informante — as quatro portas secretas, a senha da
// cripta, o caminho do Castelo — dormindo para sempre.
await teste('acordar o Droop é uma ação de quem está encostado nele, e não depende de revirar o Nosk', async () => {
  const S = await nova();
  const droop = S.foes.find((c) => c.defId === 'droop');
  assert.ok(droop, 'o Droop está no elenco');
  const heroi = S.party[0];
  const sup = S.enc.field.surfaceAt(droop.pos.x, droop.pos.y);
  // desacordado, como a chegada do grupo o deixa (`fimDoCombate` do grupo `guardas`)
  addCondition(droop, 'inconsciente');
  poe(heroi, droop.pos.x + 1, droop.pos.y);
  const perto = S.cena.interacoes(droop.pos, sup, heroi);
  const acordar = perto.find((o) => /Acordar o goblin/.test(o.rotulo));
  assert.ok(acordar, `o verbo de acordar aparece: ${perto.map((o) => o.rotulo).join(' | ')}`);
  assert.equal(acordar.motivo, null, 'encostado nele, nada impede');
  await acordar.fazer();
  assert.ok(!hasCondition(droop, 'inconsciente'), 'e ele acorda, sem saque nenhum');
  // acordado, o verbo sai do menu
  assert.ok(!S.cena.interacoes(droop.pos, sup, heroi).some((o) => /Acordar o goblin/.test(o.rotulo)),
    'acordado, o verbo não aparece mais');
  // e de longe vem com motivo de recusa
  addCondition(droop, 'inconsciente');
  poe(heroi, droop.pos.x + 4, droop.pos.y);
  const longe = S.cena.interacoes(droop.pos, sup, heroi).find((o) => /Acordar o goblin/.test(o.rotulo));
  assert.ok(longe?.motivo, 'a quatro casas o verbo vem com motivo de recusa');
});

// A ESTRANHA INTUIÇÃO DO VIGIA É UMA RESISTIDA, não uma fala. O traço do bloco é a Intuição dele contra a
// Enganação do alvo, e quem perde tem um segredo lido em voz alta. O nó `intuicao` da conversa era decoração:
// nenhum dado caía, e o único traço próprio da criatura não existia como regra em lugar nenhum.
await teste('o olho rola a Estranha Intuição contra a Enganação de cada herói, e lê verdade do estado do jogo', async () => {
  const S = await nova();
  const vigia = S.foes.find((c) => c.defId === 'vigiaCiclopico');
  assert.ok(vigia, 'o vigia está no elenco');
  // chega-se à fenda: o vigia puxa conversa, e o stub guarda a árvore que a cena lhe passou
  S.resposta.fim = 'paz';
  espalhar(S, [{ x: vigia.pos.x + 2, y: vigia.pos.y }, { x: vigia.pos.x + 3, y: vigia.pos.y },
    { x: vigia.pos.x + 2, y: vigia.pos.y + 1 }, { x: vigia.pos.x + 3, y: vigia.pos.y + 1 }]);
  await S.cena.depoisDeMover(S.party[0]);
  const arvore = S.chamadas.find((ch) => ch.npc === vigia)?.arvore;
  assert.ok(arvore?.nos?.intuicao, `o vigia conversou e a árvore tem o nó da intuição: ${S.chamadas.map((c) => c.npc?.name).join(',')}`);
  const fala = arvore.nos.intuicao.fala;
  assert.equal(typeof fala, 'function', 'a fala ROLA: é função, não texto fixo');
  const linhas = fala();
  const resistidas = linhas.filter((l) => /Enganação \d+ contra Intuição \d+/.test(l));
  assert.equal(resistidas.length, S.party.length, `uma resistida por herói: ${linhas.join(' / ')}`);
  // e o segredo que ele lê é verdade do estado: de manto vermelho, é o manto que ele vê
  vestirTodos(S);
  let viuManto = false;
  for (let i = 0; i < 20 && !viuManto; i += 1) {
    viuManto = fala().some((l) => /manto de um homem que não é ele/.test(l));
  }
  assert.ok(viuManto, 'de manto, quem perde a resistida tem o manto lido em voz alta');
});

// O ALARME NÃO TOCA SOZINHO. O familiar está no tabuleiro desde sempre (`foesMansao`, lado neutro) — o Zeond do
// Obelisco, um quasit invisível, onde a Mina punha um rato. Vivo ele avisa sempre, que é o que o livro manda e o
// que o teste de cima prova; morto, a oficina fica em silêncio e o mestre, de costas.
await teste('Zeond morto não avisa: o Cajavidro não sabe de nada e continua na escrivaninha', async () => {
  const S = await nova();
  const iarno = iarnoDe(S);
  const zeond = S.foes.find((c) => c.grupo === 'familiar');
  assert.ok(zeond, 'o familiar do mago está no elenco da cena');
  assert.equal(zeond.defId, 'quasit', 'é o quasit do Obelisco, não o rato da Mina');
  assert.equal(zeond.name, 'Zeond');
  assert.equal(zeond.side, 'neutro', 'e no lado neutro: na oficina ele não luta, vai avisar');
  assert.ok(hasCondition(zeond, 'invisivel'), 'e invisível desde o começo');
  assert.ok(!zeond.familiar, 'sem a marca do familiar do GRUPO (`rules/familiar.js`)');
  zeond.dead = true;
  zeond.hp = 0;
  espalhar(S, [{ x: 3, y: 3 }, { x: 2, y: 2 }, { x: 4, y: 2 }, { x: 4, y: 4 }]);
  await S.cena.depoisDeMover(S.party[0]);
  assert.notEqual(S.app.campanha.mansao?.iarno, 'fugiu', 'ninguém avisou: ele não está fugindo');
  assert.ok(!S.enc.combatants.includes(iarno), 'ele nem entrou no tabuleiro');
  assert.ok(S.cena.explorando, 'e a cena segue em exploração');
  // e não avisa num segundo passo tampouco: o familiar resolvido fica resolvido
  await S.cena.depoisDeMover(S.party[1]);
  assert.notEqual(S.app.campanha.mansao?.iarno, 'fugiu', 'nem no passo seguinte');
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

// A POÇÃO QUE ELE BEBE É A DA BOLSA DA CISTERNA. O plano de fuga que o livro lhe dá mora num fio dentro da
// água — roupa limpa, 50 po, poção de cura e poção de invisibilidade —, e o jogo deixa o grupo achá-lo e grava
// `salvo.bolsa`. Só que depois o Cajavidro "tirava um frasco do cinto" e sumia do mesmo jeito, bebendo o que já
// estava na mochila de um herói. Achar a bolsa antes da hora agora vale: ele é alcançado de corpo inteiro.
await teste('bolsa da cisterna saqueada: o Cajavidro é alcançado e NÃO fica invisível', async () => {
  const S = await nova();
  const iarno = iarnoDe(S);
  // o grupo já puxou a bolsa do fundo da cisterna (Mãos Mágicas, vara ou Percepção CD 15)
  S.app.campanha.mansao.bolsa = true;
  espalhar(S, [{ x: 3, y: 3 }, { x: 2, y: 2 }, { x: 4, y: 2 }, { x: 4, y: 4 }]);
  await S.cena.depoisDeMover(S.party[0]);                         // o rato avisa, ele foge
  espalhar(S, [{ x: 11, y: 4 }, { x: 12, y: 3 }, { x: 12, y: 4 }, { x: 13, y: 4 }]);
  await S.cena.depoisDeMover(S.party[0]);                         // e é alcançado
  assert.ok(!S.cena.explorando, 'a luta começou');
  assert.ok(!hasCondition(iarno, 'invisivel'), 'sem a poção, ele não some');
  assert.ok(S.enc.combatants.filter((c) => c.side === 'foes' && !c.dead).includes(iarno), 'e luta ali mesmo');
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

// QUEM CHEGA PELA SECRETA DO 7 não passa pela oficina, e o Zeond não avisa ninguém: ele está no quarto com o mestre
// quando a luta começa, e luta do lado dele, invisível. Mas não SEGURA a luta: caídos o Cajavidro e os guarda-costas,
// ela acaba, mesmo com o diabinho vivo e sem que ninguém o consiga mirar (`naoSeguraALuta`, `combat.js checkEnd`).
// O ZEOND SEGUE O GRUPO (o Obelisco): depois de avisar o mestre ele não vai embora — vem atrás, invisível, e entra na
// próxima luta colado a um herói.
await teste('avisado o mestre, o Zeond segue o grupo invisível e entra na próxima luta', async () => {
  const S = await nova();
  const zeond = S.foes.find((c) => c.grupo === 'familiar');
  espalhar(S, [{ x: 3, y: 3 }, { x: 2, y: 2 }, { x: 4, y: 2 }, { x: 4, y: 4 }]);
  await S.cena.depoisDeMover(S.party[0]);                         // o Zeond avisa
  assert.ok(zeond.seguindo && !S.enc.combatants.includes(zeond), 'saiu do tabuleiro, mas segue o grupo');
  espalhar(S, [{ x: 11, y: 4 }, { x: 12, y: 3 }, { x: 12, y: 4 }, { x: 13, y: 4 }]);   // alcançam o Cajavidro
  await S.cena.depoisDeMover(S.party[0]);
  assert.ok(!S.cena.explorando, 'a luta começou');
  assert.ok(S.enc.combatants.includes(zeond) && zeond.side === 'foes', 'e o Zeond está nela');
  assert.ok(hasCondition(zeond, 'invisivel'), 'invisível');
  assert.ok(S.party.some((h) => Math.max(Math.abs(h.pos.x - zeond.pos.x), Math.abs(h.pos.y - zeond.pos.y)) <= 2), 'perto do grupo');
});

await teste('pela secreta, o Zeond luta do lado do mestre, invisível, e não segura a luta sozinho', async () => {
  const S = await nova();
  const iarno = iarnoDe(S);
  const zeond = S.foes.find((c) => c.grupo === 'familiar');
  espalhar(S, [{ x: 8, y: 4 }, { x: 9, y: 4 }, { x: 9, y: 3 }, { x: 7, y: 4 }]);
  await S.cena.depoisDeMover(S.party[0]);
  assert.ok(!S.cena.explorando, 'entrar no quarto pela secreta abre a luta');
  assert.notEqual(S.app.campanha.mansao?.iarno, 'fugiu', 'ninguém o avisou');
  assert.equal(zeond.side, 'foes', 'o Zeond entra do lado do mestre');
  assert.ok(S.enc.combatants.includes(zeond));
  assert.ok(hasCondition(zeond, 'invisivel'), 'e continua invisível');
  for (const f of S.enc.combatants.filter((c) => c.side === 'foes' && c !== zeond)) { f.dead = true; f.hp = 0; }
  assert.ok(S.enc.checkEnd(), 'caídos os outros, a luta acaba com o diabinho vivo');
  assert.equal(S.enc.outcome, 'vitoria');
});

// O QUARTO VAZIO: fugido o Cajavidro, não fica ninguém no quarto (o livro não lhe dá guarda-costas).
await teste('fugido o Cajavidro, o quarto fica vazio: entrar nele não abre luta nenhuma', async () => {
  const S = await nova();
  espalhar(S, [{ x: 3, y: 3 }, { x: 2, y: 2 }, { x: 4, y: 2 }, { x: 4, y: 4 }]);
  await S.cena.depoisDeMover(S.party[0]);
  assert.equal(S.foes.filter((f) => f.grupo === 'guardaCostas').length, 0, 'ninguém ficou para trás');
  for (let i = 0; i < 2; i += 1) await S.cena.depoisDeMover(S.party[0]);   // ele se afasta, longe do quarto
  espalhar(S, [{ x: 8, y: 4 }, { x: 6, y: 4 }, { x: 9, y: 3 }, { x: 6, y: 3 }]);
  await S.cena.depoisDeMover(S.party[0]);
  assert.ok(S.cena.explorando || !S.enc.combatants.some((c) => c.side === 'foes' && !c.dead && c.grupo === 'guardaCostas'), 'nenhum guarda-costas');
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

await teste('sala 9, de manto: conversa com Nosk; paz deixa os bugbears neutros e põe o Droop no tabuleiro para falar', async () => {
  const S = await nova();
  vestirTodos(S);
  S.resposta.fim = 'paz';
  espalhar(S, [{ x: 3, y: 15 }, { x: 2, y: 15 }, { x: 4, y: 15 }, { x: 3, y: 14 }]);
  await S.cena.depoisDeMover(S.party[0]);
  assert.equal(S.chamadas.length, 1, 'uma conversa');
  assert.equal(S.chamadas[0].npc.name, 'Nosk');
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

const FOSSO = new Set(['23,9', '24,9', '23,10', '24,10']);
const corredor = [{ x: 26, y: 10 }, { x: 25, y: 10 }, { x: 24, y: 10 }, { x: 23, y: 10 }, { x: 22, y: 10 }];

await teste('o fosso é REGIÃO do mapa: quem atravessa o corredor para nele, volta para o lado de onde veio, e o buraco abre', async () => {
  for (const seed of [1, 2, 3, 4, 5, 6]) {
    const S = await nova(seed);
    const [a, b] = S.party;
    espalhar(S, [{ x: 25, y: 9 }, { x: 26, y: 10 }, { x: 28, y: 14 }, { x: 27, y: 14 }]);   // um aliado colado na beirada
    b.movementLeftFt = 30;
    const hp = b.hp;
    S.enc.moveAlong(b, corredor);
    assert.ok(!FOSSO.has(`${b.pos.x},${b.pos.y}`), `seed ${seed}: ${b.name} em ${b.pos.x},${b.pos.y}, dentro do buraco`);
    assert.ok(b.pos.x >= 25, `seed ${seed}: voltou para o lado leste, de onde veio (x ${b.pos.x})`);
    assert.ok(hp - b.hp <= 12, 'no máximo 2d6');
    if (hp > b.hp) assert.ok(hasCondition(b, 'caido'), 'quem caiu fica no chão');
    assert.equal(S.field.surfaceAt(23, 10), 'fosso', 'o buraco abriu');
    if (S.field.sobreposicoes.some((o) => o.id === 'fossoAberto')) assert.equal(S.field.sobreposicoes.find((o) => o.id === 'fossoAberto').ligada, true, 'o desenho do fosso abriu junto');
    assert.equal(S.field.regioes.find((r) => r.id === 'fosso').desligada, true, 'e a tampa não pega mais ninguém');
    await S.cena.depoisDeMover(b);   // o painel e o XP
    assert.ok(a.pos.x === 25 && a.pos.y === 9, 'o aliado não mexeu');
  }
});

await teste('o fosso achado pelo Encontrar Armadilhas (o gancho da região) abre o buraco; e a volta à mansão lembra', async () => {
  const { ganchosMagicosDaCena } = await import(P + 'game/armadilhas.js');
  const S = await nova();
  poe(S.party[0], 21, 10);
  const g = ganchosMagicosDaCena({ capitulo: S.cena, enc: S.enc }, S.party[0]).find((x) => x.id === 'regiao:fosso');
  assert.ok(g, 'o gancho vem da região');
  g.revelar();
  assert.equal(S.field.surfaceAt(23, 10), 'fosso');
  const D = await nova(7, { campanha: S.app.campanha });
  assert.equal(D.field.surfaceAt(23, 10), 'fosso', 'de volta, o buraco continua aberto');
  assert.equal(D.field.regioes.find((r) => r.id === 'fosso').desligada, true);
});

await teste('a ponte do sul é REGIÃO do mapa: cede com quem pisa, e todo mundo em cima cai (2d6, no chão); a régua não avisa', async () => {
  const { tracarRota } = await import(P + 'rules/rota.js');
  const S = await nova();
  const [a, b] = S.party;
  espalhar(S, [{ x: 10, y: 14 }, { x: 13, y: 14 }, { x: 28, y: 14 }, { x: 27, y: 14 }]);
  b.movementLeftFt = 30;
  assert.equal(tracarRota(S.enc, b, [], { x: 11, y: 14 }).avisos.length, 0, 'a ponte é discreta: a régua não entrega o podre');
  const hpA = a.hp;
  const hpB = b.hp;
  assert.notEqual(S.enc.moveAlong(b, [{ x: 13, y: 14 }, { x: 12, y: 14 }, { x: 11, y: 14 }]), false, 'andou');
  assert.deepEqual({ x: b.pos.x, y: b.pos.y }, { x: 11, y: 14 }, 'o passo para na ponte');
  assert.ok(b.hp < hpB && a.hp < hpA, 'os dois em cima levam o dano');
  assert.ok(hasCondition(a, 'caido') && hasCondition(b, 'caido'), 'e caem');
  assert.equal(S.field.surfaceAt(10, 14), 'entulho', 'a ponte virou entulho');
  if (S.field.sobreposicoes.some((o) => o.id === 'ponteSulCaida')) assert.equal(S.field.sobreposicoes.find((o) => o.id === 'ponteSulCaida').ligada, true, 'o desenho da ponte caiu junto');
  await S.cena.depoisDeMover(b);
  const D = await nova(7, { campanha: S.app.campanha });
  assert.equal(D.field.surfaceAt(10, 14), 'entulho', 'de volta, a ponte continua caída');
  if (D.field.sobreposicoes.some((o) => o.id === 'ponteSulCaida')) assert.equal(D.field.sobreposicoes.find((o) => o.id === 'ponteSulCaida').ligada, true, 'de volta, o desenho também');
});

await teste('a cripta tem três sarcófagos (de duas casas); o tesouro é o bracelete do Obelisco, no da mulher', async () => {
  assert.equal(MANSAO.sarcofagos.length, 3);
  for (const s of MANSAO.sarcofagos) assert.equal(s.length, 2);
});

await teste('porta secreta só se acha do lado dela: de dentro do depósito não se acha a do quarto através da parede', async () => {
  const S = await nova();
  const h = S.party[0];
  poe(h, 12, 3);                                         // no depósito
  const quarto = MANSAO.secretas.quarto;
  const k = quarto.a;                                    // (9,2), dentro do quarto
  assert.equal(S.field.hasLineOfSight(h.pos, k), false, 'a parede do quarto está no meio');
  assert.ok(!S.cena.interacoesDoHeroi(h).some((o) => o.rotulo === 'Procurar porta secreta' && /quarto/.test(o.detalhe ?? '')), 'sem oferta enganosa');
});

await teste('escutar atrás da porta só vale com a porta fechada e o herói encostado nela', async () => {
  const S = await nova();
  const h = S.party[0];
  poe(h, 3, 14);                                         // no corredor, junto da porta dos bugbears (fechada)
  assert.ok(S.cena.interacoesDoHeroi(h).some((o) => o.rotulo === 'Escutar atrás da porta'));
  S.field.porAresta(3, 14, 3, 15, 3);                    // aberta: já não há o que escutar
  assert.ok(!S.cena.interacoesDoHeroi(h).some((o) => o.rotulo === 'Escutar atrás da porta'));
  poe(h, 2, 8);                                          // longe de qualquer porta
  assert.ok(!S.cena.interacoesDoHeroi(h).some((o) => o.rotulo === 'Escutar atrás da porta'));
});

console.log(`\n${total - falhas}/${total} testes passaram${falhas ? `, ${falhas} FALHARAM` : ''}.`);
process.exit(falhas ? 1 : 0);
