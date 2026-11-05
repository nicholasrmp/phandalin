// Testes das RESTRIÇÕES SEPARADAS da parede (`core/grid.js RESTRICOES`) e das PORTAS TRANCADAS (`game/portas.js`).
// Rode com:
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-arestas.mjs
//
// Cada tipo de aresta barra uma parte: o passo, a visão, a luz, o som. Mede-se rodando o motor de verdade: o
// alcance do passo, a linha de visão, o nível de luz e o menu das portas.

import assert from 'node:assert/strict';
import { Battlefield, ARESTA, RESTRICOES } from '../core/grid.js';
import { nivelDeLuz } from '../rules/luz.js';
import { Encounter } from '../rules/combat.js';
import { makeParty } from '../rules/party.js';
import { makeRng } from '../core/rng.js';
import { opcoesDePorta, chaveDaAresta } from '../game/portas.js';
import { montarCampo } from '../game/campo.js';
import { novoMapa, pintarAresta, estiloDaAresta, trancaDaAresta, redimensionar, ESTILOS_DE_ARESTA, limpar } from '../game/mapa-editor.js';
import { garantirInventario } from '../rules/equipment.js';

let total = 0;
let falhas = 0;
function teste(nome, fn) {
  total += 1;
  try { fn(); console.log(`ok    ${nome}`); } catch (e) {
    falhas += 1;
    console.log(`FALHA ${nome}\n      ${e.message.split('\n').join('\n      ')}`);
  }
}

const ABERTO = Array(9).fill('.........');
/** Um campo 9x9 com uma coluna de arestas `car` no oeste da coluna x=4 (entre x=3 e x=4), de cima a baixo. */
function comColuna(car, xs = [4]) {
  const o = ABERTO.map((l) => [...l].map((_, x) => (xs.includes(x) ? car : '.')).join(''));
  return new Battlefield(9, 9, ABERTO, null, null, { n: ABERTO, o });
}
const alcanca = (f, de, ate, pes = 60) => f.reachable(de, pes).has(`${ate.x},${ate.y}`);

teste('a tabela: os cinco tipos antigos barram o que barravam', () => {
  assert.deepEqual(RESTRICOES[ARESTA.parede], { passo: 2, visao: 2, luz: 2, som: 2 });
  assert.deepEqual(RESTRICOES[ARESTA.porta], { passo: 2, visao: 2, luz: 2, som: 2 });
  assert.deepEqual(RESTRICOES[ARESTA.aberta], { passo: 0, visao: 0, luz: 0, som: 0 });
  assert.equal(RESTRICOES[ARESTA.seteira].passo, 2);
  assert.equal(RESTRICOES[ARESTA.seteira].visao, 0);
});

teste('etérea: parece parede — barra a visão e a luz — e se atravessa', () => {
  const f = comColuna('E');
  assert.ok(alcanca(f, { x: 1, y: 4 }, { x: 6, y: 4 }), 'passa');
  assert.equal(f.hasLineOfSight({ x: 1, y: 4 }, { x: 6, y: 4 }), false, 'não deixa ver');
  assert.equal(f.passa(3, 4, 4, 4, 'luz'), false);
  assert.equal(f.passa(3, 4, 4, 4, 'som'), true);
});

teste('invisível: barra só o passo', () => {
  const f = comColuna('I');
  assert.equal(alcanca(f, { x: 1, y: 4 }, { x: 6, y: 4 }), false, 'não passa');
  assert.equal(f.hasLineOfSight({ x: 1, y: 4 }, { x: 6, y: 4 }), true, 'vê através');
});

teste('janela: vê e a luz entra, mas não se passa e o som não atravessa', () => {
  const f = comColuna('W');
  assert.equal(alcanca(f, { x: 1, y: 4 }, { x: 6, y: 4 }), false);
  assert.equal(f.hasLineOfSight({ x: 1, y: 4 }, { x: 6, y: 4 }), true);
  assert.equal(f.passa(3, 4, 4, 4, 'luz'), true);
  assert.equal(f.passa(3, 4, 4, 4, 'som'), false);
});

teste('limitada (a moita): a primeira não barra a visão, a segunda sim; e não barra o passo', () => {
  const f = comColuna('T', [3, 5]);   // a moita é a coluna x=3 e x=4: arestas no oeste de 3 e no oeste de 5
  assert.equal(f.hasLineOfSight({ x: 1, y: 4 }, { x: 3, y: 4 }), true, 'de fora, vê-se dentro da moita');
  assert.equal(f.hasLineOfSight({ x: 1, y: 4 }, { x: 7, y: 4 }), false, 'através dela, não');
  assert.equal(f.hasLineOfSight({ x: 7, y: 4 }, { x: 1, y: 4 }), false, 'nem do outro lado (simétrica)');
  assert.ok(alcanca(f, { x: 1, y: 4 }, { x: 7, y: 4 }), 'anda-se por ela');
});

teste('limitada também na luz: a tocha de um lado da moita não acende o outro', () => {
  const f = comColuna('T', [3, 5]);
  f.luz = new Uint8Array(81);   // breu
  const tocha = [{ pos: { x: 1, y: 4 }, claro: 30, penumbra: 0 }];
  assert.equal(nivelDeLuz(f, 3, 4, tocha), 2, 'dentro da moita, claro');
  assert.equal(nivelDeLuz(f, 7, 4, tocha), 0, 'atrás dela, escuro');
});

teste('mão única: o barranco que se desce e não se sobe', () => {
  const f = comColuna('>');
  assert.ok(alcanca(f, { x: 1, y: 4 }, { x: 6, y: 4 }), 'indo para leste, passa');
  assert.equal(alcanca(f, { x: 6, y: 4 }, { x: 1, y: 4 }), false, 'voltando para oeste, não');
  assert.equal(f.hasLineOfSight({ x: 6, y: 4 }, { x: 1, y: 4 }), true, 'a visão não tem mão');
  const g = comColuna('<');
  assert.equal(alcanca(g, { x: 1, y: 4 }, { x: 6, y: 4 }), false);
  assert.ok(alcanca(g, { x: 6, y: 4 }, { x: 1, y: 4 }));
});

teste('mão única na diagonal: não se escorrega pela quina no sentido barrado', () => {
  const f = comColuna('>');
  assert.equal(f.passa(4, 4, 3, 5), false);
  assert.equal(f.passa(3, 5, 4, 4), true);
});

teste('num mapa de traço livre, a etérea continua barrando a visão', () => {
  const f = comColuna('E');
  f.tracos = [[[0.2, 0.2], [0.8, 0.2]]];   // um traço qualquer longe: liga o caminho de traço da linha de visão
  assert.equal(f.hasLineOfSight({ x: 1, y: 4 }, { x: 6, y: 4 }), false);
  const g = comColuna('T', [3, 5]);
  g.tracos = [[[0.2, 0.2], [0.8, 0.2]]];
  assert.equal(g.hasLineOfSight({ x: 1, y: 4 }, { x: 7, y: 4 }), false, 'e a moita dupla também');
});

// ---- o editor -------------------------------------------------------------------------------------------

teste('editor: cada estilo novo vai e volta pela aresta', () => {
  const m = novoMapa(8, 8);
  for (const estilo of ['eterea', 'invisivel', 'limitada', 'janela', 'unicaMais', 'unicaMenos', 'comTranca']) {
    assert.ok(pintarAresta(m, 3, 3, 'O', estilo), estilo);
    assert.equal(estiloDaAresta(m, 3, 3, 'O'), estilo);
  }
  assert.ok(ESTILOS_DE_ARESTA.comTranca.tranca);
});

teste('editor: a porta trancada guarda a CD, troca a CD, e some ao virar outra coisa', () => {
  const m = novoMapa(8, 8);
  pintarAresta(m, 3, 3, 'N', 'comTranca', { cd: 14 });
  assert.deepEqual(trancaDaAresta(m, 3, 3, 'N'), { aresta: '3,3,N', cd: 14 });
  assert.ok(pintarAresta(m, 3, 3, 'N', 'comTranca', { cd: 18 }), 'outra CD muda');
  assert.equal(trancaDaAresta(m, 3, 3, 'N').cd, 18);
  pintarAresta(m, 3, 3, 'N', 'trancada');
  assert.equal(trancaDaAresta(m, 3, 3, 'N'), null, 'porta fechada sem tranca');
  assert.equal(m.trancas, undefined);
});

teste('editor: crescer o mapa leva a tranca; o JSON a guarda; o campo leva uma cópia', () => {
  const m = novoMapa(8, 8);
  pintarAresta(m, 3, 3, 'O', 'comTranca', { cd: 12 });
  redimensionar(m, 'O', 2);
  assert.equal(m.trancas[0].aresta, '5,3,O');
  const volta = JSON.parse(JSON.stringify(limpar(m)));
  assert.deepEqual(volta.trancas, m.trancas);
  const campo = montarCampo(m);
  assert.equal(campo.trancas.get('5,3,O').cd, 12);
  campo.trancas.delete('5,3,O');
  assert.equal(m.trancas.length, 1, 'destrancar numa partida não mexe no mapa');
});

// ---- as portas no jogo ----------------------------------------------------------------------------------

function comPorta({ trancada = false, cd = 12 } = {}) {
  const m = novoMapa(9, 9);
  pintarAresta(m, 4, 4, 'O', trancada ? 'comTranca' : 'trancada', { cd });
  const field = montarCampo(m);
  const party = makeParty({ nivel: 2 });
  party.forEach((c, i) => { c.pos = { x: 3, y: 2 + i }; });
  const enc = new Encounter({ battlefield: field, party, foes: [], rng: makeRng(5), onLog: () => {} });
  const ladino = party.find((c) => c.id === 'pc-ladino') ?? party[1];
  ladino.pos = { x: 3, y: 4 };
  return { enc, field, ladino, app: { enc, refresh() {} } };
}

teste('porta destrancada: abrir, e depois fechar', () => {
  const { enc, field, ladino, app } = comPorta();
  const ops = opcoesDePorta(app, ladino, { x: 3, y: 4 });
  assert.deepEqual(ops.map((o) => o.rotulo), ['Abrir a porta']);
  ops[0].fazer();
  assert.equal(field.aresta(3, 4, 4, 4), ARESTA.aberta);
  assert.deepEqual(opcoesDePorta(app, ladino, { x: 3, y: 4 }).map((o) => o.rotulo), ['Fechar a porta']);
  assert.ok(enc);
});

teste('porta trancada: fechadura, arrombar, e a chave quando alguém a tem', () => {
  const { field, ladino, app } = comPorta({ trancada: true, cd: 12 });
  assert.equal(chaveDaAresta({ x: 3, y: 4 }, { x: 4, y: 4 }), '4,4,O');
  let ops = opcoesDePorta(app, ladino, { x: 3, y: 4 });
  assert.deepEqual(ops.map((o) => o.rotulo), ['Abrir a fechadura', 'Arrombar a porta']);
  assert.match(ops[1].detalhe, /CD 17/, 'arrombar é CD + 5');
  garantirInventario(ladino).bag.push({ id: 'chave', tipo: 'item', qtd: 1 });
  ops = opcoesDePorta(app, ladino, { x: 3, y: 4 });
  assert.equal(ops[0].rotulo, 'Destrancar com a chave');
  ops[0].fazer();
  assert.equal(field.aresta(3, 4, 4, 4), ARESTA.aberta);
  assert.equal(field.trancas.has('4,4,O'), false);
});

teste('porta trancada: quem não tem ferramentas de ladrão não mexe na fechadura; longe, ninguém mexe', () => {
  const { ladino, app } = comPorta({ trancada: true });
  garantirInventario(ladino).bag = garantirInventario(ladino).bag.filter((i) => i.id !== 'ferramentasDeLadrao');
  const ops = opcoesDePorta(app, ladino, { x: 3, y: 4 });
  assert.match(ops[0].motivo, /ferramentas de ladrão/);
  ladino.pos = { x: 0, y: 0 };
  assert.match(opcoesDePorta(app, ladino, { x: 3, y: 4 })[0].motivo, /longe/);
});

teste('porta trancada: forçar até abrir — a fechadura com ferramentas, uma hora cede', () => {
  const { field, ladino, app } = comPorta({ trancada: true, cd: 10 });
  garantirInventario(ladino).bag.push({ id: 'ferramentasDeLadrao', tipo: 'item', qtd: 1 });
  for (let i = 0; i < 40 && field.aresta(3, 4, 4, 4) !== ARESTA.aberta; i++) {
    opcoesDePorta(app, ladino, { x: 3, y: 4 }).find((o) => o.rotulo === 'Abrir a fechadura').fazer();
  }
  assert.equal(field.aresta(3, 4, 4, 4), ARESTA.aberta);
});

teste('na luta, mexer na fechadura gasta a ação', () => {
  const { ladino, app } = comPorta({ trancada: true });
  garantirInventario(ladino).bag.push({ id: 'ferramentasDeLadrao', tipo: 'item', qtd: 1 });
  ladino.actionUsed = false;
  opcoesDePorta(app, ladino, { x: 3, y: 4 }, { fora: false }).find((o) => o.rotulo === 'Abrir a fechadura').fazer();
  assert.equal(ladino.actionUsed, true);
  assert.match(opcoesDePorta(app, ladino, { x: 3, y: 4 }, { fora: false }).find((o) => o.rotulo === 'Arrombar a porta')?.motivo ?? 'aberta', /sem ação|aberta/);
});

console.log(`\n${total - falhas}/${total} testes das arestas passaram.`);
if (falhas) process.exit(1);
