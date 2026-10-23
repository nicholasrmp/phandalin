// O catálogo inteiro, num lugar só.
//
// POR QUE A PASTA EXISTE
// `equipment.js` tem a MECÂNICA do inventário: o que cabe em cada encaixe,
// quanto pesa, como a CA é montada, o que a troca faz com o boneco. O
// catálogo é DADO, e dado cresce. Com as duas coisas no mesmo arquivo, mexer
// numa regra de duas linhas obrigava a rolar por quatrocentas entradas de
// tabela — e foi exatamente assim que `equipment.js` chegou a 454 linhas com
// sete armas.
//
// Aqui só há junção. Nenhuma regra, nenhuma conta.
//
// A ORDEM DO ESPALHAMENTO IMPORTA. `PHANDELVER_ITEMS` vem por último de
// propósito: se um dia um id da campanha colidir com um id do SRD, quem
// vence é a campanha, que é o contexto mais específico. Colisão silenciosa ao
// contrário faria um item nomeado virar o genérico sem aviso.

export { WEAPONS, AMMO } from './weapons.js';
export { ARMORS, SHIELD, SHIELD_AC } from './armors.js';
export { GEAR, TOOLS, MOUNTS } from './gear.js';
export {
  MAGIC_ITEMS, POTIONS, MAGIC_WEAPONS, MAGIC_ARMORS,
  RINGS, WANDS, STAVES, RODS, WONDROUS, RARIDADE,
} from './magic.js';
export { PHANDELVER_ITEMS, TESOURO_POR_INIMIGO } from './phandelver.js';

import { AMMO } from './weapons.js';
import { GEAR, TOOLS, MOUNTS } from './gear.js';
import { MAGIC_ITEMS } from './magic.js';
import { PHANDELVER_ITEMS } from './phandelver.js';

/**
 * Tudo que não é arma, armadura nem escudo — ou seja, tudo que mora na
 * mochila e não tem encaixe próprio.
 */
export const ITEMS = {
  ...AMMO,
  ...GEAR,
  ...TOOLS,
  ...MOUNTS,
  ...MAGIC_ITEMS,
  ...PHANDELVER_ITEMS,
};
