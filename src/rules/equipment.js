// SRD 5.1 (CC-BY-4.0) — ver NOTICE.md
// Armas e armaduras. Só o subconjunto que os personagens iniciais usam.

export const WEAPONS = {
  espadaLonga: {
    id: 'espadaLonga', name: 'Espada longa', damage: '1d8', type: 'cortante',
    ability: 'str', reachFt: 5, props: ['versátil'], art: 'sword',
  },
  espadaCurta: {
    id: 'espadaCurta', name: 'Espada curta', damage: '1d6', type: 'perfurante',
    ability: 'str', finesse: true, reachFt: 5, props: ['acuidade', 'leve'], art: 'sword',
  },
  adaga: {
    id: 'adaga', name: 'Adaga', damage: '1d4', type: 'perfurante',
    ability: 'str', finesse: true, reachFt: 5, rangeFt: 20, props: ['acuidade', 'leve', 'arremesso'], art: 'dagger',
  },
  maca: {
    id: 'maca', name: 'Maça', damage: '1d6', type: 'concussão',
    ability: 'str', reachFt: 5, props: [], art: 'mace',
  },
  bordao: {
    id: 'bordao', name: 'Bordão', damage: '1d6', type: 'concussão',
    ability: 'str', reachFt: 5, props: ['versátil'], art: 'staff',
  },
  arcoCurto: {
    id: 'arcoCurto', name: 'Arco curto', damage: '1d6', type: 'perfurante',
    ability: 'dex', ranged: true, rangeFt: 80, longRangeFt: 320, props: ['munição', 'duas mãos'], art: 'bow',
  },
  bestaLeve: {
    id: 'bestaLeve', name: 'Besta leve', damage: '1d8', type: 'perfurante',
    ability: 'dex', ranged: true, rangeFt: 80, longRangeFt: 320, props: ['munição', 'recarga'], art: 'bow',
  },
};

export const ARMORS = {
  nenhuma: { id: 'nenhuma', name: 'Sem armadura', base: 10, dexCap: Infinity, art: null },
  couro: { id: 'couro', name: 'Couro', base: 11, dexCap: Infinity, art: 'leather' },
  couroBatido: { id: 'couroBatido', name: 'Couro batido', base: 12, dexCap: Infinity, art: 'leather' },
  brunea: { id: 'brunea', name: 'Brunea', base: 14, dexCap: 2, art: 'scale' },
  cotaDeMalha: { id: 'cotaDeMalha', name: 'Cota de malha', base: 16, dexCap: 0, art: 'plate' },
};

export const SHIELD_AC = 2;

/** CA = base da armadura + DEX (limitado) + escudo + bônus diversos. */
export function armorClass(actor) {
  const armor = ARMORS[actor.armor ?? 'nenhuma'] ?? ARMORS.nenhuma;
  const dex = Math.floor((actor.abilities.dex - 10) / 2);
  let ac = armor.base + Math.min(dex, armor.dexCap);
  if (actor.shield) ac += SHIELD_AC;
  ac += actor.acBonus ?? 0;
  return ac;
}

/** Modificador usado por uma arma: acuidade escolhe o melhor entre FOR e DES. */
export function weaponAbility(actor, weapon) {
  if (weapon.ranged) return 'dex';
  if (!weapon.finesse) return weapon.ability;
  const str = actor.abilities.str;
  const dex = actor.abilities.dex;
  return dex > str ? 'dex' : 'str';
}
