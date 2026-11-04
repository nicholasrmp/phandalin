// Despeja, em JSON, a planta de uma cena: terreno e as duas grades de aresta.
// Serve ao `alinhar-mapa-pintado.py`, que casa a planta com um mapa pintado de verdade.
//   node --import ./src/dev/cena-node/register.mjs src/dev/exportar-plantas.mjs [cena ...]
import { mapaDo } from '../game/encounter.js';
import { montarCampo } from '../game/campo.js';

const PADRAO = ['casaDaMorte1', 'casaDaMorte2', 'casaDaMorte3', 'casaDaMorte4', 'casaDaMortePorao1', 'casaDaMortePorao2'];
const CENAS = process.argv.slice(2).length ? process.argv.slice(2) : PADRAO;
const saida = {};
for (const id of CENAS) {
  const m = mapaDo(id);
  // `bloqueia` sai do MOTOR, e não de adivinhar glifo: cada cena tem o seu alfabeto (o Castelo nem usa `R`), e
  // comparar planta com mapa pintado por um conjunto de letras chutado já deu número sem sentido.
  const campo = montarCampo(m);
  const bloqueia = Array.from({ length: m.terreno.length }, (_, y) =>
    Array.from({ length: m.terreno[0].length }, (_, x) => (campo.blocksMove(x, y) ? 1 : 0)).join(''));
  saida[id] = { w: m.terreno[0].length, h: m.terreno.length, terreno: m.terreno, bloqueia, n: m.paredes?.n ?? null, o: m.paredes?.o ?? null };
}
console.log(JSON.stringify(saida));
