// O que as fichas de `npc-saber*.js` dividem. Um teste social vencido na conversa grava `apertado:<ficha>` nas flags (`game/dialogo.js`).
export const flagDeApertado = (id) => `apertado:${id}`;
export const apertado = (id) => (e) => e[flagDeApertado(id)] === true;

/**
 * Em que ponto do Obelisco a vila está: 0 (antes do capítulo 5, ou curada), 5, 6, 7 ou 8. Os marcos são os de cada capítulo: a Mina
 * Perdida concluída, o contrato do Harbin pago, os três guardiões vencidos e o portal de Illithinoch aberto. Mora aqui, e não em
 * `vila-reino.js`, porque a ficha de saber (que roda em Node e no servidor) precisa dele e aquele arquivo puxa a interface.
 */
export function estagioDoObelisco(camp) {
  if (!camp || camp.obelisco8?.feito?.refracaoVencida) return 0;
  if (camp.obelisco7?.portalAberto) return 8;
  if (camp.obelisco6?.marco9) return 7;
  if (camp.obelisco5?.feito?.pagoFim) return 6;
  if (camp.aventuraConcluida) return 5;
  return 0;
}
