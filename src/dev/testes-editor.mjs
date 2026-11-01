// Testes do editor de cenário (`game/mapa-editor.js`). Rode com:
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-editor.mjs
import assert from 'node:assert/strict';
import * as M from '../game/mapa-editor.js';
import { mapaDo } from '../game/encounter.js';
import { montarCampo } from '../game/campo.js';

let total = 0; let falhas = 0;
function teste(nome, fn) {
  total += 1;
  try { fn(); console.log(`ok    ${nome}`); } catch (e) { falhas += 1; console.log(`FALHA ${nome}\n      ${e.message.split('\n').join('\n      ')}`); }
}
const memoria = () => { const d = {}; return { setItem: (k, v) => { d[k] = v; }, getItem: (k) => d[k] ?? null }; };

teste('limpar: todo mapa do jogo vira JSON puro e volta igual, e o campo monta', () => {
  for (const v of ['casaDaMorte1', 'casaDaMorte2', 'casaDaMorte3', 'casaDaMorte4', 'casaDaMortePorao1', 'casaDaMortePorao2', 'rua', 'castelo']) {
    const m = M.limpar(mapaDo(v));
    assert.deepEqual(JSON.parse(JSON.stringify(m)), m, v);
    const f = montarCampo(m);
    assert.equal(f.w, m.terreno[0].length, v);
  }
});

teste('mapa vazio: nasce são, e o JSON dele monta um campo', () => {
  const m = M.novoMapa(10, 8);
  assert.deepEqual(M.diagnostico(m), []);
  assert.equal(montarCampo(m).h, 8);
});

teste('piso: pinta, não pinta fora do mapa nem casa com móvel', () => {
  const m = M.novoMapa(8, 8);
  assert.equal(M.pintarPiso(m, 3, 3, '*'), true);
  assert.equal(m.terreno[3][3], '*');
  assert.equal(M.pintarPiso(m, 3, 3, '*'), false);   // já era
  assert.equal(M.pintarPiso(m, 99, 3, 'U'), false);
  M.colocarProp(m, 4, 4, 'casa-lareira:+y');
  assert.equal(M.pintarPiso(m, 4, 4, 'L'), false);
});

teste('aresta: parede, porta com folha, arco, grade e apagar; as listas acompanham', () => {
  const m = M.novoMapa(8, 8);
  assert.equal(M.pintarAresta(m, 3, 3, 'N', 'parede'), true);
  assert.equal(M.estiloDaAresta(m, 3, 3, 'N'), 'parede');
  assert.equal(M.pintarAresta(m, 3, 3, 'N', 'parede'), false);
  assert.equal(M.pintarAresta(m, 3, 3, 'N', 'porta'), true);
  assert.equal(M.estiloDaAresta(m, 3, 3, 'N'), 'porta');
  assert.equal(m.folhas.length, 1);
  M.pintarAresta(m, 3, 3, 'N', 'arco');
  assert.equal(m.folhas.length, 0);
  assert.equal(M.estiloDaAresta(m, 3, 3, 'N'), 'arco');
  M.pintarAresta(m, 4, 3, 'O', 'grade');
  assert.equal(M.estiloDaAresta(m, 4, 3, 'O'), 'grade');
  assert.deepEqual(m.grades, ['4,3,O']);
  M.pintarAresta(m, 4, 3, 'O', 'nada');
  assert.deepEqual(m.grades, []);
  assert.equal(M.pintarAresta(m, 0, 2, 'O', 'parede'), false);   // o contorno de fora não leva parede
});

teste('parede e porta mudam o que o motor deixa passar', () => {
  const m = M.novoMapa(8, 8);
  m.grupo = [{ x: 2, y: 3 }, { x: 2, y: 4 }, { x: 1, y: 3 }, { x: 1, y: 4 }];
  for (let y = 0; y <= 7; y++) M.pintarAresta(m, 4, y, 'O', 'parede');
  let f = montarCampo(m);
  assert.equal(f.passa(3, 3, 4, 3), false);
  assert.ok(M.diagnostico(m).length > 0, 'a metade leste ficou isolada: tem de avisar');
  M.pintarAresta(m, 4, 3, 'O', 'arco');
  f = montarCampo(m);
  assert.equal(f.passa(3, 3, 4, 3), true);
  assert.deepEqual(M.diagnostico(m), []);
});

teste('objeto: põe, troca, tira, e o terreno acompanha o móvel baixo e o alto', () => {
  const m = M.novoMapa(8, 8);
  M.pintarPiso(m, 3, 3, 'L');
  assert.equal(M.colocarProp(m, 3, 3, 'casa-cadeira:+x', { baixo: true }), true);
  assert.equal(m.terreno[3][3], '&');
  assert.equal(M.propEm(m, 3, 3).piso, 'laje');
  M.colocarProp(m, 3, 3, 'casa-estante:+y');
  assert.equal(m.terreno[3][3], '^');
  assert.equal(m.objetos.length, 1);
  assert.equal(M.propEm(m, 3, 3).piso, 'laje');
  assert.equal(M.removerProp(m, 3, 3), true);
  assert.equal(m.terreno[3][3], 'L');
  assert.equal(M.removerProp(m, 3, 3), false);
  const f = montarCampo(m);
  assert.equal(f.blocksMove(3, 3), false);
});

teste('sala e partida', () => {
  const m = M.novoMapa(8, 8);
  assert.equal(M.definirSala(m, 2, 2, 'quarto'), true);
  assert.equal(M.salaDe(m, 2, 2), 'quarto');
  assert.equal(M.definirSala(m, 2, 2, 'sala'), true);
  assert.equal(M.salaDe(m, 2, 2), 'sala');
  assert.equal(M.definirSala(m, 2, 2, ''), true);
  assert.deepEqual(m.salas, {});
  assert.equal(M.definirInicio(m, 1, 5, 5), true);
  assert.deepEqual(m.grupo[1], { x: 5, y: 5 });
});

teste('redimensionar: cresce pelo norte e pelo oeste e leva tudo junto', () => {
  const m = M.novoMapa(8, 8);
  M.colocarProp(m, 3, 3, 'casa-estante:+y');
  M.pintarAresta(m, 4, 4, 'N', 'parede');
  M.definirSala(m, 2, 2, 'x');
  assert.equal(M.redimensionar(m, 'N', 2), true);
  assert.equal(M.redimensionar(m, 'O', 3), true);
  assert.equal(m.terreno.length, 10); assert.equal(m.terreno[0].length, 11);
  assert.deepEqual([m.objetos[0].x, m.objetos[0].y], [6, 5]);
  assert.equal(M.estiloDaAresta(m, 7, 6, 'N'), 'parede');
  assert.equal(M.salaDe(m, 5, 4), 'x');
  assert.equal(m.terreno[5][6], '^');
  assert.equal(m.terreno[0][0], 'Z');
  assert.equal(M.redimensionar(m, 'S', -9), false);   // não encolhe a nada
  montarCampo(m);
});

teste('guardar e ler: volta igual; JSON quebrado vira null', () => {
  const a = memoria();
  const m = M.novoMapa(9, 9);
  assert.equal(M.ler(a), null);
  M.guardar(m, a);
  assert.deepEqual(M.ler(a), m);
  a.setItem(M.CHAVE, '{nao e json');
  assert.equal(M.ler(a), null);
});

teste('mapaDo("editor") lê o que o editor guardou (sem armazém, devolve um mapa vazio que monta)', () => {
  const f = montarCampo(mapaDo('editor'));
  assert.ok(f.w >= 5);
});

console.log(`\n${total - falhas}/${total} testes passaram`);
process.exit(falhas ? 1 : 0);
