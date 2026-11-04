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

teste('peça de várias casas: ocupa as de trás, bloqueia, e sai inteira por qualquer casa', () => {
  const m = M.novoMapa(10, 10);
  assert.deepEqual(M.pegadaDe(2, 2), [[-1, 0], [0, -1], [-1, -1]]);
  assert.equal(M.colocarProp(m, 5, 5, 'casa-mesaJantar:+x', { pega: M.pegadaDe(2, 1) }), true);
  assert.equal(M.propEm(m, 4, 5).variante, M.NADA);
  assert.equal(m.terreno[5][4], '^');
  assert.equal(montarCampo(m).blocksMove(4, 5), true, 'a casa de trás bloqueia o passo');
  assert.equal(M.colocarProp(m, 1, 1, 'casa-mesaJantar:+x', { pega: M.pegadaDe(3, 1) }), false, 'não cabe: a casa de trás cai na parede de fora');
  assert.equal(M.colocarProp(m, 7, 7, 'casa-cama:+x', { pega: M.pegadaDe(1, 2) }), true);
  // por cima de uma peça grande: a peça velha sai inteira
  assert.equal(M.colocarProp(m, 4, 5, 'casa-barril:+y'), true);
  assert.equal(M.propEm(m, 5, 5), null, 'a mesa saiu inteira');
  assert.equal(m.terreno[5][5], 'U', 'o piso volta');
  // tirar pela casa de trás leva a peça
  assert.equal(M.removerProp(m, 7, 6), true);
  assert.equal(M.propEm(m, 7, 7), null);
  assert.equal(M.propEm(m, 7, 6), null);
  assert.equal(M.removerProp(m, 7, 6), false);
  assert.deepEqual(M.diagnostico(m), []);
});

teste('peça grande: acompanha o mapa quando ele cresce pelo oeste', () => {
  const m = M.novoMapa(10, 10);
  M.colocarProp(m, 5, 5, 'casa-mesaJantar:+x', { pega: M.pegadaDe(2, 1) });
  M.redimensionar(m, 'O', 2);
  assert.equal(M.propEm(m, 7, 5).pega.length, 1);
  assert.equal(M.propEm(m, 6, 5).variante, M.NADA);
});

teste('altura: pinta de 0 a 6, cria a grade, e o motor enxerga o degrau', () => {
  const m = M.novoMapa(8, 8);
  assert.equal(m.altura, undefined);
  assert.equal(M.pintarAltura(m, 3, 3, 2), true);
  assert.equal(M.alturaDe(m, 3, 3), 2);
  assert.equal(M.pintarAltura(m, 3, 3, 2), false);
  assert.equal(M.pintarAltura(m, 4, 3, 99), true);
  assert.equal(M.alturaDe(m, 4, 3), M.ALTURA_MAXIMA);
  assert.equal(M.pintarAltura(m, -1, 0, 1), false);
  assert.equal(montarCampo(m).heightAt(3, 3), 2);
  M.redimensionar(m, 'N', 1);
  assert.equal(M.alturaDe(m, 3, 4), 2, 'a altura acompanha o terreno');
});

teste('exploração livre: liga e desliga, vai no JSON, e o jogo só aceita a cena "editor"', () => {
  const m = M.novoMapa(8, 8);
  assert.equal(M.definirExploracao(m, false), false);
  assert.equal(M.definirExploracao(m, true), true);
  assert.equal(M.limpar(m).cena, 'editor');
  assert.equal(M.definirExploracao(m, true), false);
  // a cena de aventura de um mapa do jogo não vai para o editor
  assert.equal(M.limpar(mapaDo('casaDaMortePorao1')).cena, undefined);
  const guardado = memoria();
  globalThis.localStorage = guardado;
  try {
    M.guardar(m, guardado);
    assert.equal(mapaDo('editor').cena, 'editor');
    const falso = M.novoMapa(8, 8); falso.cena = 'casaDaMorte';
    M.guardar(falso, guardado);
    assert.equal(mapaDo('editor').cena, undefined, 'um JSON não escolhe a cena de uma aventura');
  } finally { delete globalThis.localStorage; }
});

// ------------------------------------------------------------------------------- o mapa pintado de fundo ---

teste('fundo: o enquadramento entra e sai do JSON, e mudar o giro zera a origem', () => {
  const m = M.novoMapa(10, 10);
  assert.equal(M.definirFundo(m, { nome: 'mapa.jpg', escala: 100, x0: 20, y0: 30 }), true);
  assert.deepEqual(M.limpar(m).fundo, m.fundo, 'o enquadramento vai no JSON');
  assert.equal(M.definirFundo(m, { giro: 90 }), true);
  assert.deepEqual([m.fundo.x0, m.fundo.y0], [0, 0], 'girar a imagem invalida a origem medida nela');
  M.definirFundo(m, { giro: 450 });
  assert.equal(m.fundo.giro, 90, 'o giro é sempre 0, 90, 180 ou 270');
  assert.equal(M.definirFundo(m, null), true);
  assert.equal(m.fundo, undefined);
  assert.equal(M.definirFundo(m, null), false, 'tirar o que não tem não é mudança');
});

teste('fundo: calibrar com a verdade não muda nada; errar a contagem muda a escala na proporção', () => {
  const m = M.novoMapa(10, 10);
  M.definirFundo(m, { nome: 'x.jpg', escala: 76.8, x0: 42, y0: 3.8 });
  const antes = JSON.stringify(m.fundo);
  // um arrasto que cobre 5 x 5 casas da grade de agora, declarado como 5 x 5: a grade já estava certa
  M.calibrarFundo(m, { x: 5, y: 5 }, { x: 10, y: 10 }, 5, 5);
  assert.equal(JSON.stringify(m.fundo), antes);
  // o mesmo arrasto, declarado como 4 x 4: cada casa passa a valer 25% mais pixels
  M.calibrarFundo(m, { x: 5, y: 5 }, { x: 10, y: 10 }, 4, 4);
  assert.equal(m.fundo.escala, 96);
  // e o canto do arrasto continua em cima da casa (5,5)
  assert.equal(m.fundo.x0 + 5 * 96, 42 + 5 * 76.8);
  assert.equal(M.calibrarFundo(m, { x: 2, y: 2 }, { x: 2, y: 2 }, 1, 1), false, 'arrasto sem tamanho não calibra');
});

teste('fundo: arrastar a imagem anda em casas, e crescer o mapa pelo norte não a desloca', () => {
  const m = M.novoMapa(10, 10);
  M.definirFundo(m, { nome: 'x.jpg', escala: 50, x0: 0, y0: 0 });
  M.moverFundo(m, 1, -2);
  assert.deepEqual([m.fundo.x0, m.fundo.y0], [-50, 100], 'arrastar a imagem uma casa para a direita tira 50 px da origem');
  // a casa (3,3) cai no mesmo pixel da imagem antes e depois de o mapa crescer duas linhas ao norte
  const px = (x, y) => [m.fundo.x0 + x * m.fundo.escala, m.fundo.y0 + y * m.fundo.escala];
  const antes = px(3, 3);
  M.redimensionar(m, 'N', 2);
  assert.deepEqual(px(3, 5), antes, 'a casa andou duas para baixo; a imagem ficou parada');
});

teste('fundo: casasDoFundo diz o retângulo de casas que a imagem cobre', () => {
  const m = M.novoMapa(10, 10);
  M.definirFundo(m, { nome: 'x.jpg', escala: 100, x0: 0, y0: 0 });
  assert.deepEqual(M.casasDoFundo(m, 500, 300), { x1: 0, y1: 0, x2: 5, y2: 3 });
  M.definirFundo(m, { x0: 250, y0: 0 });
  assert.equal(M.casasDoFundo(m, 500, 300).x1, -3, 'a imagem deslocada começa antes da casa (0,0)');
  M.definirFundo(m, { giro: 90 });
  assert.deepEqual(M.casasDoFundo(m, 500, 300), { x1: 0, y1: 0, x2: 3, y2: 5 }, 'girada, troca largura por altura');
});

console.log(`\n${total - falhas}/${total} testes passaram`);
process.exit(falhas ? 1 : 0);
