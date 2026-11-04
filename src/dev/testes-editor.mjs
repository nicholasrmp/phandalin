// Testes do editor de cenário (`game/mapa-editor.js`). Rode com:
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-editor.mjs
import assert from 'node:assert/strict';
import * as M from '../game/mapa-editor.js';
import { mapaDo } from '../game/encounter.js';
import { montarCampo } from '../game/campo.js';

let total = 0; let falhas = 0;
// A FILA é o que deixa teste `async` valer. Sem ela, `teste()` imprimia "ok" antes de a asserção rodar — a função
// devolvia uma promessa e o `try` já tinha acabado —, e uma asserção quebrada só apareceria como erro solto do Node.
const fila = [];
function teste(nome, fn) {
  total += 1;
  fila.push(async () => {
    try { await fn(); console.log(`ok    ${nome}`); } catch (e) { falhas += 1; console.log(`FALHA ${nome}\n      ${e.message.split('\n').join('\n      ')}`); }
  });
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

// --------------------------------------------------------------------------------- a parede livre (traço) ---

teste('traço: uma linha reta entre duas casas vira a aresta que ela separa', () => {
  const m = M.novoMapa(10, 10);
  // uma linha vertical em x = 4, de y 2 a y 6: separa a coluna 3 da coluna 4
  assert.equal(M.tracarParede(m, [[4, 2], [4, 6]]), true);
  assert.equal(m.tracos.length, 1);
  for (let y = 2; y < 6; y++) assert.equal(M.estiloDaAresta(m, 4, y, 'O'), 'parede', `y=${y}`);
  assert.equal(M.estiloDaAresta(m, 4, 1, 'O'), 'nada', 'não passa do fim do traço');
  assert.equal(M.estiloDaAresta(m, 5, 3, 'O'), 'nada', 'não pega a coluna de lado');
  // e o motor enxerga: não dá para atravessar
  const f = montarCampo(M.limpar(m));
  assert.equal(f.passa(3, 3, 4, 3), false, 'a parede barra o passo de lado');
  assert.equal(f.passa(4, 3, 5, 3), true, 'e so ela');
});

teste('traço: apagar devolve a aresta, mas não leva a parede pintada à mão junto', () => {
  const m = M.novoMapa(10, 10);
  M.pintarAresta(m, 2, 2, 'N', 'parede');            // esta é da mão, e tem de sobreviver
  M.tracarParede(m, [[4, 2], [4, 6]]);
  assert.equal(M.estiloDaAresta(m, 4, 3, 'O'), 'parede');
  assert.equal(M.apagarTraco(m, 4, 4), true);
  assert.equal(m.tracos, undefined, 'sem traço nenhum, o campo some');
  assert.equal(M.estiloDaAresta(m, 4, 3, 'O'), 'nada', 'a aresta derivada saiu junto');
  assert.equal(M.estiloDaAresta(m, 2, 2, 'N'), 'parede', 'a pintada à mão ficou');
  assert.equal(M.apagarTraco(m, 4, 4), false, 'não há mais o que apagar');
});

teste('traço: a porta posta em cima dele não vira parede de volta', () => {
  const m = M.novoMapa(10, 10);
  M.tracarParede(m, [[4, 2], [4, 6]]);
  M.pintarAresta(m, 4, 4, 'O', 'porta');
  M.tracarParede(m, [[7, 2], [7, 6]]);               // outro traço: recalcula as derivadas
  assert.equal(M.estiloDaAresta(m, 4, 4, 'O'), 'porta', 'a porta continua porta');
  assert.equal(M.estiloDaAresta(m, 7, 3, 'O'), 'parede');
});

teste('traço: a diagonal vira escada de arestas, e não se corta a quina dela', () => {
  const m = M.novoMapa(12, 12);
  M.tracarParede(m, [[2, 2], [8, 8]]);
  const f = montarCampo(M.limpar(m));
  // o passo EM DIAGONAL por cima do traço é barrado: `passa` exige livres as quatro arestas do contorno
  assert.equal(f.passa(3, 3, 4, 4), false, 'não se corta a quina de uma parede diagonal');
  assert.equal(f.passa(3, 4, 4, 5), false);
  assert.equal(f.passa(2, 6, 3, 7), true, 'longe do traço, a diagonal passa');
  // atravessando o mapa de ponta a ponta, a diagonal separa de verdade
  const cheio = M.novoMapa(12, 12);
  M.tracarParede(cheio, [[-1, -1], [13, 13]]);
  const g = montarCampo(M.limpar(cheio));
  const deUmLado = g.reachable({ x: 1, y: 8 }, 400);
  assert.equal(deUmLado.has('8,1'), false, 'a diagonal de ponta a ponta separa os dois lados');
  assert.equal(deUmLado.has('2,9'), true, 'e o lado de baixo continua ligado');
});

teste('traço: anda junto quando o mapa cresce pelo norte', () => {
  const m = M.novoMapa(10, 10);
  M.tracarParede(m, [[4, 2], [4, 6]]);
  M.redimensionar(m, 'N', 2);
  assert.deepEqual(m.tracos[0], [[4, 4], [4, 8]]);
  assert.equal(M.estiloDaAresta(m, 4, 5, 'O'), 'parede', 'a derivada acompanhou');
});

teste('visão pelo traço: a parede livre corta a reta dos olhos', () => {
  const m = M.novoMapa(14, 10);
  M.tracarParede(m, [[7, 1], [7, 9]]);
  const f = montarCampo(M.limpar(m));
  assert.equal(f.hasLineOfSight({ x: 3, y: 5 }, { x: 10, y: 5 }), false, 'a parede corta');
  assert.equal(f.hasLineOfSight({ x: 3, y: 5 }, { x: 5, y: 5 }), true, 'do mesmo lado, vê');
});

teste('visão pelo traço: porta aberta em cima do traço deixa ver', () => {
  const m = M.novoMapa(14, 10);
  M.tracarParede(m, [[7, 1], [7, 9]]);
  const f0 = montarCampo(M.limpar(m));
  assert.equal(f0.hasLineOfSight({ x: 3, y: 5 }, { x: 10, y: 5 }), false);
  // o vão de porta é traçado por cima; abrindo a aresta, o olho passa por ele
  M.pintarAresta(m, 7, 5, 'O', 'arco');
  const f = montarCampo(M.limpar(m));
  assert.equal(f.hasLineOfSight({ x: 3, y: 5 }, { x: 10, y: 5 }), true, 'o arco deixa ver através do traço');
  assert.equal(f.hasLineOfSight({ x: 3, y: 2 }, { x: 10, y: 2 }), false, 'e só na altura do arco');
});

teste('visão pelo traço: a diagonal barra o que o degrau da grade deixava passar', () => {
  // um traço na diagonal dentro de UMA casa: a grade não tem aresta para isso, a geometria tem
  const m = M.novoMapa(9, 9);
  M.tracarParede(m, [[4.1, 3.9], [4.9, 4.1]]);
  const f = montarCampo(M.limpar(m));
  assert.equal(f.tracos.length, 1);
  assert.equal(f.tracoCortaVisao({ x: 4, y: 2 }, { x: 4, y: 6 }), true, 'a reta de cima para baixo cruza o traço');
  assert.equal(f.tracoCortaVisao({ x: 1, y: 1 }, { x: 2, y: 2 }), false, 'longe dele, não');
});

teste('visão pelo traço: é simétrica', () => {
  const m = M.novoMapa(12, 12);
  M.tracarParede(m, [[3.2, 2.1], [8.7, 9.4]]);
  const f = montarCampo(M.limpar(m));
  let pares = 0;
  for (let y = 0; y < 12; y += 1) {
    for (let x = 0; x < 12; x += 1) {
      const a = { x, y };
      const b = { x: 11 - x, y: 11 - y };
      if (f.hasLineOfSight(a, b) !== f.hasLineOfSight(b, a)) pares += 1;
    }
  }
  assert.equal(pares, 0, 'nenhum par enxerga só de um lado');
});

teste('visão pelo traço: mapa sem traço nenhum não muda de comportamento', () => {
  const m = M.novoMapa(10, 10);
  M.pintarAresta(m, 5, 4, 'O', 'parede');
  const f = montarCampo(M.limpar(m));
  assert.equal(f.tracos, undefined);
  assert.equal(f.tracoCortaVisao({ x: 2, y: 4 }, { x: 8, y: 4 }), false, 'sem traço, nada a cortar');
  assert.equal(f.hasLineOfSight({ x: 2, y: 4 }, { x: 8, y: 4 }), false, 'a aresta continua cortando');
});

teste('cobertura pelos cantos: o degradê em volta da ponta de uma parede', () => {
  const m = M.novoMapa(14, 10);
  M.tracarParede(m, [[7, 0], [7, 5]]);           // parede do topo até y=5; de y=5 para baixo é passagem
  const f = montarCampo(M.limpar(m));
  // fundo atrás da parede: três ou quatro cantos barrados, três quartos de cobertura
  assert.equal(f.coverBetween({ x: 4, y: 2 }, { x: 9, y: 2 }), 5, 'atrás da parede, +5');
  // espiando por cima da ponta: um ou dois cantos barrados, meia cobertura
  assert.equal(f.coverBetween({ x: 4, y: 3 }, { x: 9, y: 6 }), 2, 'na diagonal da ponta, +2');
  assert.equal(f.coverBetween({ x: 4, y: 4 }, { x: 9, y: 4 }), 2);
  // dobrada a quina, nada cobre
  assert.equal(f.coverBetween({ x: 4, y: 6 }, { x: 9, y: 6 }), 0, 'passada a ponta, nenhuma');
  assert.equal(f.coverBetween({ x: 4, y: 6 }, { x: 9, y: 4 }), 0);
});

teste('cobertura pelos cantos: quem ataca escolhe o melhor canto', () => {
  const m = M.novoMapa(14, 10);
  M.tracarParede(m, [[7, 0], [7, 4]]);
  const f = montarCampo(M.limpar(m));
  // de uma casa bem aberta, dá para achar um canto que vê tudo: nenhuma cobertura
  assert.equal(f.coverBetween({ x: 2, y: 8 }, { x: 11, y: 8 }), 0);
});

teste('cobertura pelos cantos: mapa sem traço mantém a regra antiga', () => {
  const m = M.novoMapa(12, 10);
  M.pintarAltura(m, 6, 5, 2);                       // um platô no meio da linha
  const f = montarCampo(M.limpar(m));
  assert.equal(f.tracos, undefined);
  assert.equal(f.coberturaPorTracos({ x: 3, y: 5 }, { x: 9, y: 5 }), 0, 'sem traço, nada a medir');
  assert.equal(f.coverBetween({ x: 3, y: 5 }, { x: 9, y: 5 }), 2, 'o degrau continua dando meia cobertura');
});

teste('cobertura pelos cantos: pelo arco se vê e não se cobre, porque o vão é largo o bastante', () => {
  const m = M.novoMapa(14, 10);
  M.tracarParede(m, [[7, 0], [7, 10]]);
  M.pintarAresta(m, 7, 5, 'O', 'arco');
  const f = montarCampo(M.limpar(m));
  // de frente para o arco, na mesma fileira: as quatro linhas de canto cabem no vão de 1,5 m
  assert.equal(f.hasLineOfSight({ x: 4, y: 5 }, { x: 9, y: 5 }), true, 'pelo arco se vê');
  assert.equal(f.coverBetween({ x: 4, y: 5 }, { x: 9, y: 5 }), 0, 'e de frente não há o que cobrir');
  // de viés, o batente do arco entra na frente
  assert.equal(f.coverBetween({ x: 4, y: 3 }, { x: 9, y: 6 }) > 0, true, 'de viés, o batente cobre');
});

teste('área de magia: a esfera não atravessa a parede livre', async () => {
  const m = M.novoMapa(16, 12);
  M.tracarParede(m, [[8, 0], [8, 12]]);
  const { Encounter } = await import('../rules/combat.js');
  const { makeParty } = await import('../rules/party.js');
  const { makeRng } = await import('../core/rng.js');
  const f = montarCampo(M.limpar(m));
  const party = makeParty({ nivel: 5 });
  party.forEach((c, i) => { c.pos = { x: 3, y: 4 + i }; });
  const enc = new Encounter({ battlefield: f, party, foes: [], rng: makeRng(1), onLog: () => {}, onEvent: () => {} });
  const bola = { shape: 'esfera', areaFt: 20, level: 3 };
  const casas = enc.areaDaMagia(party[0], bola, { x: 6, y: 5 }) ?? [];
  assert.equal(casas.length > 0, true, 'a esfera pega alguma coisa');
  assert.equal(casas.some((c) => c.x > 8), false, 'nenhuma casa do outro lado da parede');
  assert.equal(casas.some((c) => c.x >= 6 && c.x <= 7), true, 'e pega do lado de cá');
});

teste('área de magia: o relâmpago para na parede livre', async () => {
  const m = M.novoMapa(20, 10);
  M.tracarParede(m, [[9, 0], [9, 10]]);
  const { Encounter } = await import('../rules/combat.js');
  const { makeParty } = await import('../rules/party.js');
  const { makeRng } = await import('../core/rng.js');
  const f = montarCampo(M.limpar(m));
  const party = makeParty({ nivel: 5 });
  party.forEach((c, i) => { c.pos = { x: 2, y: 4 + i }; });
  const enc = new Encounter({ battlefield: f, party, foes: [], rng: makeRng(1), onLog: () => {}, onEvent: () => {} });
  const raio = { shape: 'linha', areaFt: 100, larguraFt: 5, level: 3 };
  const linha = enc.areaDaMagia(party[0], raio, { x: 18, y: 4 }) ?? [];
  assert.equal(linha.length > 0, true, 'o raio sai');
  assert.equal(Math.max(...linha.map((c) => c.x)) < 9, true, `o raio parou antes da parede, foi até ${Math.max(...linha.map((c) => c.x))}`);
});

teste('sem traço, `passaVisao` é exatamente o `passa` de antes', () => {
  // a invariante que garante que mapa sem parede livre não mudou de comportamento em lugar nenhum
  const m = M.limpar(mapaDo('casaDaMorte1'));
  const f = montarCampo(m);
  assert.equal(f.tracos, undefined);
  let pares = 0;
  let divergiu = 0;
  for (let y = 0; y < f.h; y++) {
    for (let x = 0; x < f.w; x++) {
      for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
        const nx = x + dx;
        const ny = y + dy;
        if (!f.inside(nx, ny)) continue;
        pares += 1;
        if (f.passaVisao(x, y, nx, ny) !== f.passa(x, y, nx, ny, 'visao')) divergiu += 1;
      }
    }
  }
  assert.equal(pares > 500, true, 'mediu o mapa inteiro');
  assert.equal(divergiu, 0, 'sem traço, nenhuma divergência');
});

// ------------------------------------------------- o que o editor ganhou para o mapa pintado ---

const mapinha = () => M.novoMapa(6, 6);

teste('passagem secreta: é parede no desenho e entra em `secretas`, e volta a ser lida como secreta', () => {
  const m = mapinha();
  M.pintarAresta(m, 3, 2, 'N', 'secreta');
  assert.equal(m.paredes.n[2][3], '#', 'no desenho é parede');
  assert.equal(M.estiloDaAresta(m, 3, 2, 'N'), 'secreta', 'mas a lista a separa da parede comum');
  assert.deepEqual(m.secretas, [[{ x: 3, y: 1 }, { x: 3, y: 2 }]]);
  // virar parede comum tira da lista
  M.pintarAresta(m, 3, 2, 'N', 'parede');
  assert.equal(M.estiloDaAresta(m, 3, 2, 'N'), 'parede');
  assert.deepEqual(m.secretas, []);
});

teste('parede comum não vira secreta por engano', () => {
  const m = mapinha();
  M.pintarAresta(m, 2, 2, 'O', 'parede');
  assert.equal(M.estiloDaAresta(m, 2, 2, 'O'), 'parede');
  assert.deepEqual(m.secretas, []);
});

teste('iluminação: acende, troca de tipo e o mesmo clique apaga', () => {
  const m = mapinha();
  M.porLuz(m, 2, 3, { tipo: 'tocha', claro: 20, penumbra: 20 });
  assert.deepEqual(m.luzes, [{ pos: { x: 2, y: 3 }, claro: 20, penumbra: 20, tipo: 'tocha' }]);
  M.porLuz(m, 2, 3, { tipo: 'vela', claro: 5, penumbra: 5 });       // outra luz na mesma casa: troca
  assert.equal(m.luzes.length, 1);
  assert.equal(m.luzes[0].tipo, 'vela');
  M.porLuz(m, 2, 3, { tipo: 'vela', claro: 5, penumbra: 5 });       // a mesma de novo: apaga
  assert.deepEqual(m.luzes, []);
});

teste('objeto interagível: põe, tira, e chega ao campo pela casa', () => {
  const m = mapinha();
  M.porInterativo(m, 4, 1, { id: 'bau', rotulo: 'Abrir o baú', texto: 'Carvalho e ferro.' });
  assert.equal(m.interativos.length, 1);
  const campo = montarCampo(m);
  assert.equal(campo.interativos.get('4,1').id, 'bau');
  assert.equal(campo.interativos.get('4,1').rotulo, 'Abrir o baú');
  M.porInterativo(m, 4, 1, null);
  assert.deepEqual(m.interativos, []);
  assert.equal(montarCampo(m).interativos, undefined, 'sem objeto, o campo nem monta o mapa');
});

teste('o que o editor marca sobrevive ao vai e volta de JSON', () => {
  const m = mapinha();
  M.pintarAresta(m, 3, 3, 'N', 'secreta');
  M.porLuz(m, 1, 1, { tipo: 'fogueira', claro: 20, penumbra: 20 });
  M.porInterativo(m, 2, 2, { id: 'alavanca', rotulo: 'Puxar', texto: 'Range.', oculto: true });
  const ida = M.limpar(m);
  const volta = M.limpar(JSON.parse(JSON.stringify(ida)));
  assert.deepEqual(volta.secretas, ida.secretas);
  assert.deepEqual(volta.luzes, ida.luzes);
  assert.deepEqual(volta.interativos, ida.interativos);
  assert.equal(volta.interativos[0].oculto, true);
});

// ------------------------------------------------------ pintar ÁREA, e não casa a casa ---

teste('retângulo: enche a caixa inteira e para na borda do mapa', () => {
  const m = M.novoMapa(8, 8);
  const n = M.pintarRetangulo(m, { x: 2, y: 2 }, { x: 4, y: 5 }, 'R');
  assert.equal(n, 12, '3 colunas por 4 fileiras');
  assert.equal(m.terreno[2][2], 'R');
  assert.equal(m.terreno[5][4], 'R');
  assert.equal(m.terreno[2][5], 'U', 'não passou da caixa');
  // arrastar ao contrário dá o mesmo retângulo
  const m2 = M.novoMapa(8, 8);
  assert.equal(M.pintarRetangulo(m2, { x: 4, y: 5 }, { x: 2, y: 2 }, 'R'), 12);
  assert.deepEqual(m2.terreno, m.terreno);
});

teste('polígono: enche o que está dentro e deixa o que está fora', () => {
  const m = M.novoMapa(10, 10);
  // um losango em volta de (5,5)
  const n = M.pintarPoligono(m, [[5, 2], [8, 5], [5, 8], [2, 5]], 'R');
  assert.equal(m.terreno[5][5], 'R', 'o centro está dentro');
  assert.equal(m.terreno[2][2], 'U', 'o canto está fora');
  assert.equal(n > 8 && n < 40, true, `encheu ${n} casas, uma quantidade plausível`);
});

teste('balde: enche a mancha contígua e não pula para a de trás da parede', () => {
  const m = M.novoMapa(9, 5);
  for (let y = 1; y < 4; y++) M.pintarPiso(m, 4, y, 'R');     // uma coluna de rocha divide o chão
  const n = M.balde(m, 1, 2, ',');
  assert.equal(m.terreno[2][1], ',', 'encheu o lado de cá');
  assert.equal(m.terreno[2][6], 'U', 'não atravessou a rocha');
  assert.equal(m.terreno[2][4], 'R', 'e não comeu a rocha');
  assert.equal(n > 0, true);
  assert.equal(M.balde(m, 1, 2, ','), 0, 'encher do mesmo glifo não faz nada');
});

teste('parede por retângulo: fecha o contorno e não risca o miolo', () => {
  const m = M.novoMapa(8, 8);
  M.paredesDoRetangulo(m, { x: 2, y: 2 }, { x: 4, y: 4 }, 'parede');
  assert.equal(M.estiloDaAresta(m, 3, 2, 'N'), 'parede', 'o lado de cima');
  assert.equal(M.estiloDaAresta(m, 3, 5, 'N'), 'parede', 'o de baixo');
  assert.equal(M.estiloDaAresta(m, 2, 3, 'O'), 'parede', 'o esquerdo');
  assert.equal(M.estiloDaAresta(m, 5, 3, 'O'), 'parede', 'o direito');
  assert.equal(M.estiloDaAresta(m, 3, 3, 'N'), 'nada', 'o miolo fica livre');
  assert.equal(M.estiloDaAresta(m, 3, 4, 'O'), 'nada', 'o miolo fica livre');
});

teste('área bloqueada: a casa marcada não se atravessa, e sem aresta de parede nenhuma', () => {
  const m = M.novoMapa(10, 10);
  M.pintarRetangulo(m, { x: 3, y: 3 }, { x: 6, y: 6 }, 'R');
  const campo = montarCampo(m);
  assert.equal(campo.blocksMove(4, 4), true, 'não se pisa dentro');
  assert.equal(campo.blocksMove(2, 4), false, 'fora, sim');
  const arestas = (m.paredes?.n ?? []).join('') + (m.paredes?.o ?? []).join('');
  assert.equal(/[#+/J]/.test(arestas), false, 'e não criou parede nenhuma');
});

teste('parede livre: onde ela barra o passo sai da LINHA, e não do quadrado mais perto', () => {
  // Uma diagonal rasa de (2,5; 1,5) a (5,5; 6,5): anda 3 casas em x enquanto anda 5 em y, então em cada
  // fileira ela cruza num x diferente. Se o motor arredondasse a parede para o quadrado, o corte ficaria no
  // mesmo lugar nas duas fileiras testadas aqui — ele não fica.
  const m = M.novoMapa(8, 8);
  M.tracarParede(m, [[2.5, 1.5], [5.5, 6.5]]);
  const campo = montarCampo(m);

  // na fileira y=3 a linha passa em x = 3,7 → o corte cai entre as casas 3 e 4
  assert.equal(campo.passa(3, 3, 4, 3), false, 'y=3: barra entre 3 e 4');
  assert.equal(campo.passa(2, 3, 3, 3), true, 'y=3: uma casa antes dela, não barra');
  // na fileira y=5 a linha já passa em x = 4,9 → o corte ANDOU, e cai entre as casas 4 e 5
  assert.equal(campo.passa(4, 5, 5, 5), false, 'y=5: barra entre 4 e 5');
  assert.equal(campo.passa(3, 5, 4, 5), true, 'y=5: e não barra mais onde barrava em y=3');

  // a visão olha o SEGMENTO cru, sem passar pela aresta, e tem de concordar
  assert.equal(campo.passaVisao(3, 3, 4, 3), false, 'a visão barra na mesma linha');
  const sem = montarCampo({ ...m, tracos: [], paredes: { n: m.paredes.n.map(() => '........'), o: m.paredes.o.map(() => '........') } });
  assert.equal(sem.passa(3, 3, 4, 3), true, 'e sem a parede, passa');
});

teste('passo pelo traço: um contorno fechado isola o que está dentro dele', () => {
  const m = M.novoMapa(12, 12);
  // Pelo caminho de verdade (`tracarParede`, que é o que o editor e o `derivar-paredes.mjs` chamam): o traço
  // fica E a aresta de casa é derivada dele. São as DUAS que fecham o contorno, e cada uma pega um caso —
  // a aresta pega o cruzamento que cai na borda da casa, o traço pega o que corta pelo meio dela.
  M.tracarParede(m, [[6, 2.5], [9.5, 6], [6, 9.5], [2.5, 6], [6, 2.5]]);
  const campo = montarCampo(m);
  const alcanca = (sx, sy) => {
    const vis = new Set([`${sx},${sy}`]);
    const pilha = [[sx, sy]];
    while (pilha.length) {
      const [x, y] = pilha.pop();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx; const ny = y + dy; const k = `${nx},${ny}`;
        if (nx < 0 || ny < 0 || nx >= 12 || ny >= 12 || vis.has(k)) continue;
        if (campo.blocksMove(nx, ny) || !campo.passa(x, y, nx, ny)) continue;
        vis.add(k); pilha.push([nx, ny]);
      }
    }
    return vis;
  };
  const dentro = alcanca(6, 6);
  assert.equal(dentro.has('6,6'), true);
  assert.equal(dentro.has('1,1'), false, 'de dentro não se sai do losango');
  assert.equal(dentro.size < 40, true, `o miolo é pequeno (deu ${dentro.size})`);
  assert.equal(alcanca(1, 1).has('6,6'), false, 'e de fora não se entra');
});

// ------------------------------------------------------------------------------------- sobreposições ---

teste('sobreposição: põe, troca, acha pela casa e tira', () => {
  const m = M.novoMapa(20, 20);
  const peca = { id: 'fogo', url: '/mapas/fa/LightDen.webp', x: 1, y: 3, w: 8, h: 6 };
  assert.equal(M.porSobreposicao(m, peca), true);
  assert.equal(M.porSobreposicao(m, peca), false, 'pôr a mesma de novo não é mudança');
  assert.equal(M.porSobreposicao(m, { ...peca, w: 9 }), true, 'mudar o tamanho é');
  assert.equal(m.sobreposicoes.length, 1, 'e troca a de mesmo id, não duplica');

  assert.deepEqual(M.sobreposicoesEm(m, 2, 4).map((o) => o.id), ['fogo'], 'acha pela casa de dentro');
  assert.deepEqual(M.sobreposicoesEm(m, 15, 4), [], 'e não pela de fora');

  assert.equal(M.porSobreposicao(m, { ...peca, id: 'ponte', frente: true }), true);
  assert.equal(m.sobreposicoes[1].frente, true, 'guarda `frente`');
  assert.equal('ligada' in m.sobreposicoes[1], false, 'e não guarda `ligada` quando é falso');

  assert.equal(M.tirarSobreposicao(m, 'fogo'), true);
  assert.equal(M.tirarSobreposicao(m, 'fogo'), false);
  assert.equal(M.tirarSobreposicao(m, 'ponte'), true);
  assert.equal(m.sobreposicoes, undefined, 'sem nenhuma, o campo some do mapa');
});

teste('sobreposição: acende e apaga, no mapa e na partida — e uma não contamina a outra', () => {
  const m = M.novoMapa(20, 20);
  M.porSobreposicao(m, { id: 'fogo', url: '/x.webp', x: 1, y: 3, w: 8, h: 6 });
  assert.equal(M.alternarSobreposicao(m, 'fogo', true), true);
  assert.equal(m.sobreposicoes[0].ligada, true);
  assert.equal(M.alternarSobreposicao(m, 'fogo', true), false, 'acender a acesa não é mudança');
  assert.equal(M.alternarSobreposicao(m, 'fogo'), true, 'sem argumento, inverte');
  assert.equal(M.alternarSobreposicao(m, 'nao-existe', true), false);

  // A PARTIDA MEXE NUMA CÓPIA. Sem isso, acender a fogueira numa partida a deixava acesa na próxima, porque o
  // mapa da cena é o mesmo objeto para todas.
  const campo = montarCampo(m);
  assert.equal(campo.sobreposicoes[0].ligada, false);
  assert.equal(campo.alternarSobreposicao('fogo', true), true);
  assert.equal(campo.sobreposicoes[0].ligada, true, 'acendeu na partida');
  assert.equal(m.sobreposicoes[0].ligada, undefined, 'e o mapa da cena ficou como estava');
  assert.equal(montarCampo(m).sobreposicoes[0].ligada, false, 'a próxima partida nasce apagada');
});

teste('sobreposição: não mexe em regra nenhuma, e sobrevive ao JSON', () => {
  const m = M.novoMapa(20, 20);
  M.porSobreposicao(m, { id: 'desabamento', url: '/x.webp', x: 4, y: 4, w: 4, h: 3, ligada: true });
  const campo = montarCampo(m);
  assert.equal(campo.blocksMove(5, 5), false, 'a peça acesa não barra passo');
  assert.equal(m.terreno[5][4], 'U', 'nem toca no terreno');
  const volta = JSON.parse(JSON.stringify(M.limpar(m)));
  assert.deepEqual(volta.sobreposicoes, m.sobreposicoes, 'vai e volta inteira no JSON');
});

// ------------------------------------------------------------------------------------ camada de frente ---

teste('camada de frente: marca, apaga, e o campo a recebe', () => {
  const m = M.novoMapa(8, 8);
  assert.equal(M.frenteEm(m, 3, 3), false, 'nasce sem camada nenhuma');
  assert.equal(M.pintarFrente(m, 3, 3, true), true);
  assert.equal(M.frenteEm(m, 3, 3), true);
  assert.equal(M.pintarFrente(m, 3, 3, true), false, 'marcar de novo não é mudança');
  assert.equal(M.pintarFrente(m, 3, 3, false), true, 'e dá para apagar');
  assert.equal(M.frenteEm(m, 3, 3), false);
  M.pintarFrente(m, 2, 5, true);
  assert.equal(montarCampo(m).frente.casas[5][2], '#', 'o campo lê a mesma grade');
});

teste('camada de frente: não mexe em regra nenhuma', () => {
  const m = M.novoMapa(8, 8);
  M.frenteNoRetangulo(m, { x: 2, y: 2 }, { x: 5, y: 5 }, true);
  const campo = montarCampo(m);
  assert.equal(campo.blocksMove(3, 3), false, 'marcar a frente não barra passo');
  assert.equal(campo.blocksSight?.(3, 3) ?? false, false, 'nem visão');
  assert.equal(m.terreno[3][3], 'U', 'e não tocou no terreno');
});

teste('camada de frente por área: retângulo, polígono e balde', () => {
  const m = M.novoMapa(10, 10);
  assert.equal(M.frenteNoRetangulo(m, { x: 1, y: 1 }, { x: 3, y: 2 }, true), 6, 'a caixa inteira');
  assert.equal(M.frenteEm(m, 3, 2), true);
  assert.equal(M.frenteEm(m, 4, 2), false, 'e para na borda da caixa');

  const n = M.frenteNoPoligono(m, [[5, 5], [8, 5], [8, 8], [5, 8]], true);
  assert.equal(n > 0, true);
  assert.equal(M.frenteEm(m, 6, 6), true, 'dentro do polígono');
  assert.equal(M.frenteEm(m, 9, 9), false, 'fora dele');

  // o balde segue a mancha de TERRENO igual: é assim que se marca a pegada inteira de um prédio
  const t = M.novoMapa(10, 10);
  M.pintarRetangulo(t, { x: 2, y: 2 }, { x: 4, y: 4 }, 'H');
  assert.equal(M.frenteNoBalde(t, 3, 3, true), 9, 'o telhado inteiro de uma vez');
  assert.equal(M.frenteEm(t, 2, 2), true);
  assert.equal(M.frenteEm(t, 5, 5), false, 'e não vaza para o chão em volta');
});

teste('camada de frente: a máscara de cor liga, desliga e some quando não sobra nada', () => {
  const m = M.novoMapa(6, 6);
  assert.equal(M.definirFrentePorCor(m, M.FRENTE_PADRAO), true);
  assert.deepEqual(m.frente.cor, { verde: 12, escuro: 92 });
  assert.equal(M.definirFrentePorCor(m, M.FRENTE_PADRAO), false, 'pôr a mesma de novo não é mudança');
  assert.equal(M.definirFrentePorCor(m, null), true);
  assert.equal(m.frente, undefined, 'sem cor e sem casa marcada, o campo some do mapa');
});

teste('camada de frente: sobrevive ao vai e volta de JSON e acompanha o mapa quando ele cresce', () => {
  const m = M.novoMapa(8, 8);
  M.definirFrentePorCor(m, { verde: 10, escuro: 80 });
  M.pintarFrente(m, 3, 3, true);
  const volta = JSON.parse(JSON.stringify(M.limpar(m)));
  assert.deepEqual(volta.frente.cor, { verde: 10, escuro: 80 }, 'a cor vai no JSON');
  assert.equal(M.frenteEm(volta, 3, 3), true, 'e a casa marcada também');

  // crescer pelo norte empurra tudo para baixo: a marca tem de andar junto com a casa dela
  M.redimensionar(m, 'N', 2);
  assert.equal(M.frenteEm(m, 3, 5), true, 'a marca desceu duas casas');
  assert.equal(M.frenteEm(m, 3, 3), false, 'e não ficou para trás');
  assert.equal(m.frente.casas.length, m.terreno.length, 'a grade tem a altura do mapa');
  assert.equal(m.frente.casas[0].length, m.terreno[0].length, 'e a largura');
});

teste('as cenas pintadas pedem a camada de frente, e ela vai e volta inteira', () => {
  for (const v of ['emboscada', 'ermo', 'ermoNoite']) {
    const m = M.limpar(mapaDo(v));
    assert.equal(typeof m.frente?.cor?.verde, 'number', `${v}: tem a máscara de cor`);
    assert.deepEqual(JSON.parse(JSON.stringify(m.frente)), m.frente, v);
    assert.equal(montarCampo(m).frente.cor.escuro, m.frente.cor.escuro, `${v}: o campo recebe`);
  }
});

for (const rodar of fila) await rodar();

console.log(`\n${total - falhas}/${total} testes passaram`);
process.exit(falhas ? 1 : 0);
