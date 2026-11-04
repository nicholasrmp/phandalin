// PROVA QUE A CONFERÊNCIA DE PAREDE E PORTA PEGA DEFEITO.
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/testes-paredes.mjs
//
// Uma conferência que nunca acusa nada não vale nada: ela passaria em todos os mapas estando quebrada. Aqui se
// monta um mapinha de propósito torto para cada pergunta que `conferir-paredes.mjs` faz, e se exige que ela
// acuse — e um mapinha certo, para exigir que ela cale.
import { conferirMapa } from './conferir-paredes.mjs';

let total = 0;
let falhas = 0;
function teste(nome, fn) {
  total += 1;
  try { fn(); console.log(`ok    ${nome}`); }
  catch (e) { falhas += 1; console.log(`FALHA ${nome}\n      ${e.message}`); }
}
const igual = (a, b, oque) => { if (a !== b) throw new Error(`${oque}: esperava ${b}, veio ${a}`); };
const tipos = (r) => r.achados.map((a) => a.tipo);
const tem = (r, tipo) => {
  if (!tipos(r).includes(tipo)) throw new Error(`esperava um achado "${tipo}", vieram: [${tipos(r).join(', ')}]`);
};

/** Um mapinha de sala quadrada: chão de laje cercado de rocha, com o grupo no meio. */
const base = (extra = {}) => ({
  terreno: [
    'RRRRRRRR',
    'RLLLRLLR',
    'RLLLRLLR',
    'RLLLRLLR',
    'RRRRRRRR',
  ],
  grupo: [{ x: 2, y: 2 }],
  ...extra,
});
const arestas = (n, o) => ({ n, o });

teste('a sala da direita sem porta nenhuma é acusada de ilhada', () => {
  const r = conferirMapa(base());
  tem(r, 'bolsão murado');
  igual(r.achados.length, 1, 'quantos achados');
});

teste('com uma porta ligando as duas salas, cala', () => {
  // a porta vai na aresta oeste de (5,2), que separa (4,2) de (5,2) — mas (4,2) é rocha, então abre-se ela
  const m = base({
    terreno: ['RRRRRRRR', 'RLLLRLLR', 'RLLLLLLR', 'RLLLRLLR', 'RRRRRRRR'],
    paredes: arestas(['........', '........', '........', '........', '........'],
      ['........', '........', '....+...', '........', '........']),
  });
  const r = conferirMapa(m);
  igual(r.achados.length, 0, `quantos achados (vieram: ${tipos(r).join(', ')})`);
});

teste('porta com rocha de um lado é acusada', () => {
  const m = base({
    terreno: ['RRRRRRRR', 'RLLLRLLR', 'RLLLLLLR', 'RLLLRLLR', 'RRRRRRRR'],
    paredes: arestas(['........', '........', '........', '........', '........'],
      ['........', '....+...', '....+...', '........', '........']),
  });
  const r = conferirMapa(m);
  tem(r, 'porta no maciço');
});

teste('porta no meio da sala, que se contorna em três passos, é acusada', () => {
  const m = {
    terreno: ['RRRRRR', 'RLLLLR', 'RLLLLR', 'RLLLLR', 'RRRRRR'],
    grupo: [{ x: 1, y: 2 }],
    paredes: arestas(['......', '......', '......', '......', '......'],
      ['......', '......', '...+..', '......', '......']),
  };
  const r = conferirMapa(m);
  tem(r, 'porta que não separa');
});

teste('a mesma porta num corredor de uma casa de largura NÃO é acusada', () => {
  const m = {
    terreno: ['RRRRRR', 'RRRRRR', 'RLLLLR', 'RRRRRR', 'RRRRRR'],
    grupo: [{ x: 1, y: 2 }],
    paredes: arestas(['......', '......', '......', '......', '......'],
      ['......', '......', '...+..', '......', '......']),
  };
  const r = conferirMapa(m);
  igual(r.achados.length, 0, `quantos achados (vieram: ${tipos(r).join(', ')})`);
});

teste('`folhas` apontando uma aresta que não é porta é acusada', () => {
  const m = {
    terreno: ['RRRRRR', 'RLLLLR', 'RRRRRR'],
    grupo: [{ x: 1, y: 1 }],
    paredes: arestas(['......', '......', '......'], ['......', '...#..', '......']),
    folhas: [[{ x: 2, y: 1 }, { x: 3, y: 1 }]],
  };
  const r = conferirMapa(m);
  tem(r, 'folha sem porta');
});

teste('`grades` apontando uma aresta que não é barra é acusada', () => {
  const m = {
    terreno: ['RRRRRR', 'RLLLLR', 'RRRRRR'],
    grupo: [{ x: 1, y: 1 }],
    paredes: arestas(['......', '......', '......'], ['......', '...+..', '......']),
    grades: ['3,1,O'],
  };
  const r = conferirMapa(m);
  tem(r, 'grade sem barra');
});

teste('grupo nascendo dentro da rocha é acusado', () => {
  const r = conferirMapa({ terreno: ['RRR', 'RLR', 'RRR'], grupo: [{ x: 0, y: 0 }] });
  tem(r, 'partida no maciço');
});

console.log(`\n${total - falhas}/${total} testes passaram`);
if (falhas) process.exitCode = 1;
