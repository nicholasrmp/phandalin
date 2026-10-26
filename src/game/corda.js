// A CORDA DO GRUPO (MULTIJOGADOR.md, J-03, D4).
//
// Cada jogador move os seus heróis ao mesmo tempo que os outros, e sem limite um herói atravessaria o mapa e a
// luta começaria com ele longe do grupo. A corda diz: um herói só vai para uma casa a até `LIMITE_DA_CORDA`
// casas de ALGUM outro herói do grupo (então o grupo pode esticar em fila, mas não se parte em dois).
// O anfitrião escolhe: `unido` (o padrão) ou `livre`. Só vale em partida de sala; no solo ninguém se afasta de si.
//
// Puro (sem janela nem motor): `game/sala.js` guarda a escolha e `main.js` aplica.

export const LIMITE_DA_CORDA = 12;
export const MODOS_DA_CORDA = ['unido', 'livre'];
export const PADRAO_DA_CORDA = 'unido';

/** Distância em casas na grade (a diagonal conta como uma casa, como o passo de um herói). */
const casas = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

/**
 * Pode `heroi` ir para `destino`? `grupo` são todos os heróis em campo (inclusive ele; os caídos e mortos já saem
 * antes). Devolve `{ ok: true }` ou `{ ok: false, why }`.
 */
export function cordaPermite({ heroi, destino, grupo, modo = PADRAO_DA_CORDA, limite = LIMITE_DA_CORDA }) {
  if (modo !== 'unido') return { ok: true };
  const outros = grupo.filter((c) => c !== heroi && c.id !== heroi.id);
  if (!outros.length) return { ok: true };
  if (outros.some((c) => casas(c.pos, destino) <= limite)) return { ok: true };
  return { ok: false, why: `o grupo se separaria demais (a corda é de ${limite} casas)` };
}
