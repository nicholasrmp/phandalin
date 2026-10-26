// QUEM DECIDE NA NARRATIVA (MULTIJOGADOR.md, J-20, D5; regra do autor, como no Baldur's Gate 3).
//
//   - O diálogo ou a cena que um PERSONAGEM começou é decidido pelo JOGADOR que controla esse personagem.
//   - Uma decisão GERAL, que não é de nenhum personagem (a estrada, para onde ir, o que fazer com o prisioneiro), vai a VOTAÇÃO
//     entre os jogadores presentes: vence a maioria; no empate, o voto do líder; sem voto de ninguém, a primeira opção livre.
//   - Sozinho na sala (os outros caíram), decide quem sobrou, sem votação.
//   - Texto sem escolha só se lê: quem o vira é o anfitrião.
//
// Puro (roda em Node): `main.js` guarda a decisão em curso e `view/partida-tela.js` mostra a quem cabe escolher.

import { PILOTO } from './sala.js';

export const TEMPO_DA_VOTACAO_MS = 45_000;

/**
 * Quem decide a narrativa que está abrindo. `ator`: o id do herói que a começou (ou `null`: decisão geral). `visao`: a visão da
 * sala. Devolve `{ modo: 'ator', pub }` ou `{ modo: 'votacao', votantes: [pub…], desempate: pub }`.
 */
export function quemDecide({ ator, visao }) {
  const presentes = (visao?.jogadores ?? []).filter((j) => j.conectado);
  if (presentes.length <= 1) return { modo: 'ator', pub: presentes[0]?.id ?? visao?.anfitriao ?? null };
  const dono = ator ? visao.herois?.[ator] : null;
  if (dono && dono !== PILOTO && presentes.some((j) => j.id === dono)) return { modo: 'ator', pub: dono };
  // O herói que sobrou (posto no piloto no lobby) é do anfitrião: quem o conduz decide por ele.
  if (dono === PILOTO && !(visao.cedidos ?? []).includes(ator) && presentes.some((j) => j.id === visao.anfitriao)) return { modo: 'ator', pub: visao.anfitriao };
  const desempate = presentes.some((j) => j.id === visao.lider) ? visao.lider : presentes[0].id;
  return { modo: 'votacao', votantes: presentes.map((j) => j.id), desempate };
}

/**
 * A apuração. `votos`: Map pub → índice. `bloqueadas`: índices que não valem (escolha cinza). `desempate`: o pub do líder.
 * Empate entre as mais votadas: a que o líder votou; se ele não está entre elas, a de menor índice. Sem nenhum voto válido: a
 * primeira opção livre. `null` se não há opção livre.
 */
export function apurar({ votos, nEscolhas, bloqueadas = new Set(), desempate = null }) {
  const livres = [...Array(nEscolhas).keys()].filter((i) => !bloqueadas.has(i));
  if (!livres.length) return null;
  const conta = new Map();
  for (const indice of votos.values()) if (livres.includes(indice)) conta.set(indice, (conta.get(indice) ?? 0) + 1);
  if (!conta.size) return livres[0];
  const maior = Math.max(...conta.values());
  const empatadas = [...conta].filter(([, n]) => n === maior).map(([i]) => i).sort((a, b) => a - b);
  const doLider = votos.get(desempate);
  return empatadas.length > 1 && empatadas.includes(doLider) ? doLider : empatadas[0];
}

/**
 * A apuração de um destino (a vila e a região, onde o grupo vai JUNTO): `votos` é Map pub → id do lugar. Vence a maioria; no empate, o
 * lugar que o líder votou; se ele não está entre os empatados, o primeiro em ordem alfabética (previsível). `null` sem nenhum voto.
 */
export function apurarLugar({ votos, desempate = null }) {
  const conta = new Map();
  for (const id of votos.values()) conta.set(id, (conta.get(id) ?? 0) + 1);
  if (!conta.size) return null;
  const maior = Math.max(...conta.values());
  const empatados = [...conta].filter(([, n]) => n === maior).map(([id]) => id).sort();
  const doLider = votos.get(desempate);
  return empatados.length > 1 && empatados.includes(doLider) ? doLider : empatados[0];
}

/** Em que lugar da narrativa o jogador `eu` pode escolher? `decide` é o que o anfitrião mandou no pedido. */
export function possoEscolher(decide, eu) {
  if (!decide) return false;
  if (decide.modo === 'ator') return decide.pub === eu;
  if (decide.modo === 'votacao') return decide.votantes?.includes(eu) === true;
  return false;
}
