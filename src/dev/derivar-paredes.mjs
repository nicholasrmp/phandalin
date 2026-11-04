// DERIVA a camada de REGRA de um mapa que chegou só com traço livre, e tapa os bolsões que a importação deixa.
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/derivar-paredes.mjs <mapa.json>
//
// Duas passadas, nesta ordem:
//
//   1. ARESTA DE CASA a partir do traço (`mapa-editor.js arestasDosTracos`). O traço é o desenho — a polilinha
//      livre, que é como o Foundry e o Roll20 guardam parede; a aresta é o que o nosso motor consulta para
//      barrar movimento. Uma não substitui a outra: sem este passo o mapa DESENHA parede e deixa andar por cima.
//
//   2. BOLSÃO FECHADO VIRA ROCHA. É o mesmo passe de `mapa-ermo.py` e `mapa-rua.py`, pela mesma razão: todo
//      recorte automático deixa casas de chão que ninguém alcança — aqui, a casa de borda que é meio caverna
//      meio vazio, que a cor chama de chão e o traço fecha logo em seguida. Some-se o maior pedaço andável a
//      partir da partida e tudo que ficou de fora vira `R`. Sem este passe, `conferir-paredes.mjs` acusa 38
//      achados na importação do Cragmaw, todos de uma casa só; com ele, zero.
//
// Escreve o arquivo de volta e imprime o que mudou.
import fs from 'node:fs';
import { arestasDosTracos } from '../game/mapa-editor.js';
import { montarCampo } from '../game/campo.js';

const arquivo = process.argv[2];
if (!arquivo) {
  console.error('uso: derivar-paredes.mjs <mapa.json>');
  process.exit(1);
}
const m = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
const h = m.terreno.length;
const w = m.terreno[0].length;

// 1 ---- as arestas
m.paredes ??= { n: Array.from({ length: h }, () => '.'.repeat(w)), o: Array.from({ length: h }, () => '.'.repeat(w)) };
const fora = arestasDosTracos(m);
for (const chave of fora) {
  const [lado, x, y] = chave.split(',');
  const grade = m.paredes[lado === 'n' ? 'n' : 'o'];
  grade[+y] = grade[+y].slice(0, +x) + '#' + grade[+y].slice(+x + 1);
}

// 2 ---- o bolsão
const campo = montarCampo(m);
const chao = [];
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!campo.blocksMove(x, y)) chao.push([x, y]);
const alcanca = (semente) => {
  const visto = new Set([semente.join(',')]);
  const pilha = [semente];
  while (pilha.length) {
    const [x, y] = pilha.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      const k = `${nx},${ny}`;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h || visto.has(k)) continue;
      if (campo.blocksMove(nx, ny) || !campo.passa(x, y, nx, ny)) continue;
      visto.add(k);
      pilha.push([nx, ny]);
    }
  }
  return visto;
};
// DE ONDE SEMEAR. Se o mapa chegou todo de chão — que é a tradução fiel do Foundry, onde só a parede decide —,
// o maior pedaço é o LADO DE FORA, e inundar por ele viraria a masmorra inteira em rocha. As LUZES resolvem:
// elas estão onde a cena acontece, que é dentro. Sem luzes, vale o maior pedaço mesmo.
let maior = new Set();
const sementes = (m.luzes ?? []).map((l) => [l.pos?.x ?? l.x, l.pos?.y ?? l.y])
  .filter(([x, y]) => x >= 0 && y >= 0 && x < w && y < h && !campo.blocksMove(x, y));
if (sementes.length) {
  for (const s of sementes) for (const k of alcanca(s)) maior.add(k);
} else {
  const vistos = new Set();
  for (const c of chao) {
    if (vistos.has(c.join(','))) continue;
    const g = alcanca(c);
    for (const k of g) vistos.add(k);
    if (g.size > maior.size) maior = g;
  }
}
let tapadas = 0;
for (const [x, y] of chao) {
  if (maior.has(`${x},${y}`)) continue;
  m.terreno[y] = m.terreno[y].slice(0, x) + 'R' + m.terreno[y].slice(x + 1);
  tapadas += 1;
}
// a partida tem de cair no pedaço grande
if (m.grupo?.length && !maior.has(`${m.grupo[0].x},${m.grupo[0].y}`)) {
  const livres = [...maior].map((k) => k.split(',').map(Number)).slice(0, m.grupo.length);
  m.grupo = livres.map(([x, y]) => ({ x, y }));
}

fs.writeFileSync(arquivo, JSON.stringify(m));
console.log(`${fora.size} aresta(s) de casa derivadas do traço; ${tapadas} casa(s) de bolsão viraram rocha; `
  + `${maior.size} casa(s) de chão alcançável`);
