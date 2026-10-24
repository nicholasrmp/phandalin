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

export { AMMO } from './weapons.js';
export { SHIELD, SHIELD_AC } from './armors.js';
export { GEAR, TOOLS, MOUNTS } from './gear.js';
export {
  MAGIC_ITEMS, POTIONS, MAGIC_WEAPONS, MAGIC_ARMORS,
  RINGS, WANDS, STAVES, RODS, WONDROUS, RARIDADE,
} from './magic.js';
export { PHANDELVER_ITEMS, TESOURO_POR_INIMIGO } from './phandelver.js';

import { AMMO, WEAPONS as ARMAS_DO_LIVRO } from './weapons.js';
import { ARMORS as ARMADURAS_DO_LIVRO } from './armors.js';
import { GEAR, TOOLS, MOUNTS } from './gear.js';
import { MAGIC_ITEMS } from './magic.js';
import { PHANDELVER_ITEMS } from './phandelver.js';

// OS ITENS NOMEADOS QUE SE EQUIPAM. Talon, Lightbringer e Hew sao armas, e a
// Dragonguard e armadura: cada um declara a `base` (a espada longa, a maca, o
// machado de batalha, o peitoral). Aqui eles viram entradas de verdade do
// catalogo de armas e de armaduras -- os numeros da base, mais o que o item
// acrescenta --, porque o inventario so poe num encaixe o que esta nesses
// catalogos, e o combate le a arma de la. Item com base desconhecida (a
// "Arma +1" generica) continua so na mochila: sem base, nao ha dado de dano.
const promovidos = new Set();

function armaNomeada(item) {
  const base = ARMAS_DO_LIVRO[item.base];
  promovidos.add(item.id);
  return {
    ...base,
    id: item.id, name: item.name, deBase: item.base, desc: item.desc,
    raridade: item.raridade, sintonia: item.sintonia, fonte: item.fonte,
    campanha: item.campanha, peso: item.peso ?? base.peso,
    bonusAtaque: item.bonusAtaque ?? 0, bonusDano: item.bonusDano ?? 0,
    // O dano extra no formato que o combate ja le dos monstros. `contra`
    // limita a um tipo de criatura: o de Hew so vale em planta.
    danoExtra: item.danoExtra
      ? { damage: item.danoExtra, type: item.tipoExtra ?? base.type, contra: item.contra ?? null }
      : null,
  };
}

function armaduraNomeada(item) {
  const base = ARMADURAS_DO_LIVRO[item.base];
  promovidos.add(item.id);
  return {
    ...base,
    // `base` numa armadura e a CA base (14 no peitoral); o id da armadura de
    // origem vai em `deBase` para nao pisar nele.
    id: item.id, name: item.name, deBase: item.base, desc: item.desc,
    raridade: item.raridade, sintonia: item.sintonia, fonte: item.fonte,
    campanha: item.campanha,
    // O +1 da armadura magica. Vale enquanto ela esta vestida, como a base.
    bonusCA: item.acBonusArmadura ?? 0,
  };
}

const nomeados = Object.values(PHANDELVER_ITEMS).filter((i) => i.base);

export const WEAPONS = {
  ...ARMAS_DO_LIVRO,
  ...Object.fromEntries(nomeados.filter((i) => ARMAS_DO_LIVRO[i.base]).map((i) => [i.id, armaNomeada(i)])),
};

export const ARMORS = {
  ...ARMADURAS_DO_LIVRO,
  ...Object.fromEntries(nomeados.filter((i) => ARMADURAS_DO_LIVRO[i.base]).map((i) => [i.id, armaduraNomeada(i)])),
};

/**
 * Tudo que não é arma, armadura nem escudo — ou seja, tudo que mora na
 * mochila e não tem encaixe próprio. Os nomeados que viraram arma ou
 * armadura saem daqui: um id em dois catalogos seria duas verdades.
 */
export const ITEMS = Object.fromEntries(Object.entries({
  ...AMMO,
  ...GEAR,
  ...TOOLS,
  ...MOUNTS,
  ...MAGIC_ITEMS,
  ...PHANDELVER_ITEMS,
}).filter(([id]) => !promovidos.has(id)));
