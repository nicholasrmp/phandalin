// Testes do TIPO DO TRAÇO (`mapa-editor.js tracosTipo`): a parede livre também é janela, porta, etérea, invisível ou
// moita, e a regra segue — o passo pela aresta derivada, a visão e a luz pela geometria do traço. Rode com:
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-tracos.mjs
//
// Mede-se o motor de verdade: o mapa do editor, o campo montado dele, o alcance, a linha de visão, o nível de luz e o
// polígono que o tabuleiro desenha.

import assert from 'node:assert/strict';
import { ARESTA } from '../core/grid.js';
import { montarCampo } from '../game/campo.js';
import { nivelDeLuz, CLARO, ESCURO } from '../rules/luz.js';
import { poligonoDeVisao } from '../view/raios.js';
import {
  novoMapa, tracarParede, definirTipoDoTraco, tipoDoTracoPerto, apagarTraco, arestasDosTracos, pintarAresta, estiloDaAresta,
} from '../game/mapa-editor.js';

let total = 0;
let falhas = 0;
function teste(nome, fn) {
  total += 1;
  try { fn(); console.log(`ok    ${nome}`); } catch (e) {
    falhas += 1;
    console.log(`FALHA ${nome}\n      ${e.message.split('\n').join('\n      ')}`);
  }
}

/** Um mapa 12x10 com um traço vertical em x=6 (entre as colunas 5 e 6), de cima a baixo, do tipo pedido. */
function comTraco(tipo) {
  const m = novoMapa(12, 10);
  tracarParede(m, [[6, 0], [6, 10]], tipo);
  return m;
}
const oeste = (m, y) => m.paredes.o[y][6];
const anda = (f, de, ate) => f.reachable(de, 60).has(`${ate.x},${ate.y}`);
const A = { x: 3, y: 5 };
const B = { x: 9, y: 5 };

teste('o traço sem tipo é parede, como sempre foi, e o mapa não ganha tracosTipo', () => {
  const m = comTraco('#');
  assert.equal(oeste(m, 5), '#');
  assert.equal('tracosTipo' in m, false);
});

teste('o traço com tipo deriva a aresta com o glifo dele', () => {
  for (const tipo of ['+', 'E', 'W', 'J', 'I', 'T']) {
    const m = comTraco(tipo);
    assert.equal(oeste(m, 5), tipo, `tipo ${tipo}`);
    assert.deepEqual(m.tracosTipo, [tipo]);
    assert.equal(arestasDosTracos(m).get('o,6,5'), tipo);
  }
});

teste('tipo desconhecido vira parede', () => {
  const m = novoMapa(12, 10);
  tracarParede(m, [[6, 1], [6, 9]], '>');
  assert.equal(oeste(m, 5), '#');
});

teste('trocar o tipo troca as arestas derivadas; voltar a parede tira o tracosTipo', () => {
  const m = comTraco('#');
  assert.equal(definirTipoDoTraco(m, 6, 5, 'W'), true);
  assert.equal(oeste(m, 5), 'W');
  assert.equal(tipoDoTracoPerto(m, 6.1, 5), 'W');
  assert.equal(definirTipoDoTraco(m, 6, 5, 'W'), false, 'já era janela');
  assert.equal(definirTipoDoTraco(m, 1, 1, 'E'), false, 'não há traço ali');
  definirTipoDoTraco(m, 6, 5, '#');
  assert.equal(oeste(m, 5), '#');
  assert.equal('tracosTipo' in m, false);
});

teste('apagar um traço mantém os tipos dos outros no lugar', () => {
  const m = novoMapa(12, 10);
  tracarParede(m, [[3, 1], [3, 9]]);
  tracarParede(m, [[6, 1], [6, 9]], 'W');
  tracarParede(m, [[9, 1], [9, 9]], 'E');
  assert.deepEqual(m.tracosTipo, [null, 'W', 'E']);
  apagarTraco(m, 3, 5);
  assert.deepEqual(m.tracosTipo, ['W', 'E']);
  assert.equal(m.paredes.o[5][3], '.', 'a aresta do apagado saiu');
  assert.equal(m.paredes.o[5][9], 'E');
  apagarTraco(m, 6, 5);
  apagarTraco(m, 9, 5);
  assert.equal('tracosTipo' in m, false);
});

teste('dois traços na mesma aresta: vale o que barra mais (a parede ganha da janela)', () => {
  const m = novoMapa(12, 10);
  tracarParede(m, [[6, 1], [6, 9]], 'W');
  tracarParede(m, [[6, 4], [6, 7]]);
  assert.equal(oeste(m, 5), '#');
  assert.equal(oeste(m, 2), 'W');
});

teste('a porta posta à mão (ferramenta 2) não é apagada pelo traço', () => {
  const m = novoMapa(12, 10);
  pintarAresta(m, 6, 5, 'o', 'porta');
  tracarParede(m, [[6, 1], [6, 9]], 'W');
  assert.equal(estiloDaAresta(m, 6, 5, 'o'), 'porta');
  apagarTraco(m, 6, 5);
  assert.equal(estiloDaAresta(m, 6, 5, 'o'), 'porta', 'e fica depois de apagar o traço');
});

teste('JANELA traçada: não se passa, vê-se e a luz atravessa', () => {
  const f = montarCampo(comTraco('W'));
  assert.equal(anda(f, A, B), false);
  assert.equal(f.hasLineOfSight(A, B), true);
  f.luz = new Uint8Array(f.w * f.h);
  assert.equal(nivelDeLuz(f, 9, 5, [{ pos: A, claro: 40, penumbra: 0 }]), CLARO);
});

teste('PAREDE traçada: nem passo, nem visão, nem luz', () => {
  const f = montarCampo(comTraco('#'));
  assert.equal(anda(f, A, B), false);
  assert.equal(f.hasLineOfSight(A, B), false);
  f.luz = new Uint8Array(f.w * f.h);
  assert.equal(nivelDeLuz(f, 9, 5, [{ pos: A, claro: 40, penumbra: 0 }]), ESCURO);
});

teste('ETÉREA traçada: atravessa-se, mas não se vê nem a luz passa', () => {
  const f = montarCampo(comTraco('E'));
  assert.equal(anda(f, A, B), true);
  assert.equal(f.hasLineOfSight(A, B), false);
  f.luz = new Uint8Array(f.w * f.h);
  assert.equal(nivelDeLuz(f, 9, 5, [{ pos: A, claro: 40, penumbra: 0 }]), ESCURO);
});

teste('INVISÍVEL traçada: só barra o passo', () => {
  const f = montarCampo(comTraco('I'));
  assert.equal(anda(f, A, B), false);
  assert.equal(f.hasLineOfSight(A, B), true);
});

teste('MOITA traçada: uma deixa ver, duas não; e se atravessa', () => {
  const um = montarCampo(comTraco('T'));
  assert.equal(anda(um, A, B), true);
  assert.equal(um.hasLineOfSight(A, B), true, 'a primeira moita deixa ver');
  const m = comTraco('T');
  tracarParede(m, [[8, 1], [8, 9]], 'T');
  assert.equal(montarCampo(m).hasLineOfSight(A, B), false, 'a segunda para a vista');
});

teste('PORTA traçada: fechada barra tudo; aberta no campo, vê-se e passa — e o desenho sabe que está aberta', () => {
  const f = montarCampo(comTraco('+'));
  assert.equal(anda(f, A, B), false);
  assert.equal(f.hasLineOfSight(A, B), false);
  assert.equal(f.portaDoTracoAberta(0), false);
  // abre a porta: as arestas derivadas viram porta aberta (é o que o menu de porta faz, aresta a aresta)
  for (let y = 0; y < 10; y++) {
    const i = y * f.w + 6;
    if (f.paredeO[i] === ARESTA.porta) f.paredeO[i] = ARESTA.aberta;
  }
  f.versao = (f.versao ?? 0) + 1;
  assert.equal(f.portaDoTracoAberta(0), true);
  assert.equal(anda(f, A, B), true);
  assert.equal(f.hasLineOfSight(A, B), true);
});

teste('JANELA em diagonal: a geometria deixa ver mesmo cruzando o meio da casa', () => {
  const m = novoMapa(12, 10);
  tracarParede(m, [[4.3, 1], [7.7, 9]], 'W');
  const f = montarCampo(m);
  assert.equal(f.hasLineOfSight({ x: 2, y: 5 }, { x: 9, y: 5 }), true);
  const p = novoMapa(12, 10);
  tracarParede(p, [[4.3, 1], [7.7, 9]]);
  assert.equal(montarCampo(p).hasLineOfSight({ x: 2, y: 5 }, { x: 9, y: 5 }), false, 'a mesma linha de parede barra');
});

teste('o polígono que o tabuleiro desenha atravessa a janela e para na parede', () => {
  const alcance = (tipo) => {
    const f = montarCampo(comTraco(tipo));
    const pts = poligonoDeVisao(f, 3.5, 5.5, 8, 4);   // 4 raios: o primeiro aponta para leste
    return pts[0] - 3.5;
  };
  assert.ok(alcance('#') < 3, `parede: ${alcance('#')}`);
  assert.ok(alcance('W') > 5, `janela: ${alcance('W')}`);
  assert.ok(alcance('E') < 3, `etérea: ${alcance('E')}`);
});

console.log(`\n${total - falhas}/${total} testes passaram`);
if (falhas) process.exit(1);
