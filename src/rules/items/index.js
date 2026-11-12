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
import { ARMORS as ARMADURAS_DO_LIVRO, SHIELD } from './armors.js';
import { GEAR, TOOLS, MOUNTS } from './gear.js';
import { MAGIC_ITEMS } from './magic.js';
import { PHANDELVER_ITEMS } from './phandelver.js';
// OS ITENS MÁGICOS DOS LIVROS (gerados por `src/dev/importar-itens.mjs`): vêm antes dos feitos à mão, que vencem
import { ITENS_LIVRO_DMG } from './livro-dmg.js';
// as famílias do livro, uma peça por tipo (o anel, a armadura e a poção de resistência; a cota de escamas por dragão)
import { VARIANTES_DE_MOCHILA, VARIANTES_COM_BASE } from './variantes.js';
// os venenos do Livro do Mestre (o de lâmina e o de soprar)
import { VENENOS } from './venenos.js';
// as gemas e os objetos de arte do tesouro por ND, pela faixa de valor (`rules/tesouro.js`)
import { GEMAS_DO_LIVRO, ARTE_DO_LIVRO } from './tesouro-generico.js';

// OS ITENS NOMEADOS QUE SE EQUIPAM. Talon, Lightbringer e Hew sao armas, e a
// Dragonguard e armadura: cada um declara a `base` (a espada longa, a maca, o
// machado de batalha, o peitoral). Aqui eles viram entradas de verdade do
// catalogo de armas e de armaduras -- os numeros da base, mais o que o item
// acrescenta --, porque o inventario so poe num encaixe o que esta nesses
// catalogos, e o combate le a arma de la. Item com base desconhecida (a
// "Arma +1" generica) continua so na mochila: sem base, nao ha dado de dano.
const promovidos = new Set();

// O que o item mágico leva consigo quando vira arma, armadura ou escudo: o que faz só por estar com o herói, o que
// conjura, as cargas do poder dele (`itens-passivos.js`, `itens-que-conjuram.js`).
const DO_ITEM = (item) => Object.fromEntries(['passivo', 'conjura', 'recarregavel', 'nomeOriginal', 'deFamilia', 'poder'].filter((k) => item[k] !== undefined).map((k) => [k, item[k]]));

function armaNomeada(item) {
  const base = ARMAS_DO_LIVRO[item.base];
  promovidos.add(item.id);
  return {
    ...base,
    id: item.id, name: item.name, deBase: item.base, desc: item.desc,
    raridade: item.raridade, sintonia: item.sintonia, fonte: item.fonte,
    campanha: item.campanha, peso: item.peso ?? base.peso,
    bonusAtaque: item.bonusAtaque ?? 0, bonusDano: item.bonusDano ?? 0,
    // a Espada Solar fere com radiante, e não com o corte da espada longa de base
    ...(item.tipoDano ? { type: item.tipoDano } : {}),
    ...(item.propsExtra ? { props: [...new Set([...(base.props ?? []), ...item.propsExtra])], ...(item.propsExtra.includes('acuidade') ? { finesse: true } : {}) } : {}),
    // o ARREMESSO que o item dá e a base não tem (Whelm, o martelo de guerra que se arremessa e volta)
    ...(item.alcance ? { rangeFt: item.alcance[0], longRangeFt: item.alcance[1] } : {}),
    ...DO_ITEM(item),
    // O dano extra no formato que o combate ja le dos monstros. `contra`
    // limita a um tipo de criatura: o de Hew so vale em planta.
    danoExtra: item.danoExtra
      ? { damage: item.danoExtra, type: item.tipoExtra ?? base.type, contra: item.contra ?? null }
      : null,
    // Dano MÁXIMO (todos os dados no lado maior) contra um tipo de criatura: o de Hew, em planta.
    danoMaximoContra: item.danoMaximoContra ?? null,
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
    campanha: item.campanha, peso: item.peso ?? base.peso,
    // O +1 da armadura magica. Vale enquanto ela esta vestida, como a base.
    bonusCA: item.acBonusArmadura ?? 0,
    // a malha élfica não pede treino; a de mithral não pesa na Furtividade nem pede Força
    ...(item.semTreino ? { semTreino: true } : {}),
    ...(item.semDesvantagemFurtividade ? { furtividade: undefined } : {}),
    ...(item.semForcaMinima ? { forcaMinima: undefined } : {}),
    ...DO_ITEM(item),
  };
}

// OS ESCUDOS MÁGICOS: o escudo de sempre mais o bônus (`acBonus`), e o que o item faz. `actor.shield` guarda o id
// do escudo mágico (ou `true`, o comum), e `equipment.js armorClass` soma o bônus dele.
function escudoNomeado(item) {
  promovidos.add(item.id);
  return {
    ...SHIELD, id: item.id, name: item.name, desc: item.desc, raridade: item.raridade, sintonia: item.sintonia,
    fonte: item.fonte, peso: item.peso ?? SHIELD.peso, deBase: SHIELD.id, bonusCA: item.acBonus ?? 0, ...DO_ITEM(item),
  };
}

// AS ARMAS E ARMADURAS +1, +2 E +3 DO LIVRO valem para qualquer arma e armadura: aqui saem uma por base (a espada
// longa +1, o couro +1), com o nome e a raridade do livro. A "Arma +1" genérica do catálogo segue na mochila, sem base.
const RARIDADE_DO_MAIS = { arma: ['incomum', 'raro', 'muito raro'], armadura: ['raro', 'muito raro', 'lendário'] };
const variantesMais = (catalogo, tipo) => Object.values(catalogo)
  .filter((b) => b.fonte === 'srd' && b.id !== 'nenhuma')
  .flatMap((b) => [1, 2, 3].map((n) => ({
    id: `${b.id}Mais${n}`, name: `${b.name} +${n}`, base: b.id, raridade: RARIDADE_DO_MAIS[tipo][n - 1], sintonia: false,
    fonte: 'srd', peso: b.peso, variante: true,
    desc: tipo === 'arma' ? `+${n} de ataque e de dano, e o golpe é mágico.` : `+${n} de CA.`,
    ...(tipo === 'arma' ? { bonusAtaque: n, bonusDano: n } : { acBonusArmadura: n }),
  })));

const nomeados = [
  ...variantesMais(ARMAS_DO_LIVRO, 'arma'), ...variantesMais(ARMADURAS_DO_LIVRO, 'armadura'), ...VARIANTES_COM_BASE,
  ...Object.values(ITENS_LIVRO_DMG), ...Object.values(MAGIC_ITEMS), ...Object.values(PHANDELVER_ITEMS),
].filter((i) => i.base);

export const WEAPONS = {
  ...ARMAS_DO_LIVRO,
  ...Object.fromEntries(nomeados.filter((i) => ARMAS_DO_LIVRO[i.base]).map((i) => [i.id, armaNomeada(i)])),
};

export const ARMORS = {
  ...ARMADURAS_DO_LIVRO,
  ...Object.fromEntries(nomeados.filter((i) => ARMADURAS_DO_LIVRO[i.base]).map((i) => [i.id, armaduraNomeada(i)])),
};

/** Os escudos que se embraçam: o comum e os mágicos (`base: 'escudo'`). */
export const SHIELDS = {
  [SHIELD.id]: SHIELD,
  ...Object.fromEntries(nomeados.filter((i) => i.base === SHIELD.id).map((i) => [i.id, escudoNomeado(i)])),
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
  ...VARIANTES_DE_MOCHILA,
  ...VENENOS,
  ...GEMAS_DO_LIVRO,
  ...ARTE_DO_LIVRO,
  ...ITENS_LIVRO_DMG,
  ...MAGIC_ITEMS,
  ...PHANDELVER_ITEMS,
}).filter(([id]) => !promovidos.has(id)));
