// O que as fichas de `npc-saber*.js` dividem. Um teste social vencido na conversa grava `apertado:<ficha>` nas flags (`game/dialogo.js`).
export const flagDeApertado = (id) => `apertado:${id}`;
export const apertado = (id) => (e) => e[flagDeApertado(id)] === true;
