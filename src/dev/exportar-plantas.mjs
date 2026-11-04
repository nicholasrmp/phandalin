// Despeja, em JSON, a planta de cada cena da Casa da Morte: terreno e as duas grades de aresta.
// Serve ao `alinhar-mapa-pintado.py`, que casa a planta com um mapa pintado de verdade.
//   node --import ./src/dev/cena-node/register.mjs src/dev/exportar-plantas.mjs
import { mapaDo } from '../game/encounter.js';

const CENAS = ['casaDaMorte1', 'casaDaMorte2', 'casaDaMorte3', 'casaDaMorte4', 'casaDaMortePorao1', 'casaDaMortePorao2'];
const saida = {};
for (const id of CENAS) {
  const m = mapaDo(id);
  saida[id] = { w: m.terreno[0].length, h: m.terreno.length, terreno: m.terreno, n: m.paredes?.n ?? null, o: m.paredes?.o ?? null };
}
console.log(JSON.stringify(saida));
