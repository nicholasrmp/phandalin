// Registro de LOOKS. Não existe arquivo de arte neste repositório: `draw.js`
// pinta cada figura pixel a pixel a partir destes dados.
//
// Num RPG isso rende mais do que num jogo de ação: equipamento é um traço do
// look, então vestir um item muda o boneco na hora, sem pipeline de asset.
//
// CORES      skin, hair, outfit, outfitDark, trim, metal, leather, eyes, glow
// ESTRUTURA  hairStyle: spiky|long|short|bald|hood
//            armorStyle: robe|leather|scale|plate
//            weapon: sword|dagger|mace|staff|bow|axe
//            helm, shield, cloak, beard, horns, snout, quadruped: boolean

export const LOOKS = {
  // ---- grupo --------------------------------------------------------------
  fighter: {
    skin: '#e8b98c', hair: '#6b4a2a', hairStyle: 'short', beard: false,
    outfit: '#6d7686', outfitDark: '#4a515e', trim: '#b8452f',
    metal: '#b9c3cf', leather: '#6a4a30', eyes: '#2a2f3a',
    armorStyle: 'plate', helm: true, shield: true, weapon: 'sword',
  },
  rogue: {
    skin: '#f0c9a0', hair: '#2e2a26', hairStyle: 'short',
    outfit: '#3f4a3a', outfitDark: '#2a3228', trim: '#8a6a3a',
    metal: '#9aa4b0', leather: '#51402e', eyes: '#3a7a52',
    armorStyle: 'leather', helm: false, shield: false, weapon: 'dagger', cloak: '#2b3328',
  },
  cleric: {
    skin: '#dca97c', hair: '#8a7a5a', hairStyle: 'short', beard: true,
    outfit: '#8a8270', outfitDark: '#5a5240', trim: '#e0c24a',
    metal: '#c3ccd6', leather: '#5d4a33', eyes: '#4a5a7a', glow: '#ffe9a8',
    armorStyle: 'scale', helm: false, shield: true, weapon: 'mace',
  },
  wizard: {
    skin: '#f2d2b0', hair: '#cfd6de', hairStyle: 'long',
    outfit: '#3a3f7a', outfitDark: '#262a52', trim: '#7f86d8',
    metal: '#a8b0c0', leather: '#4a3f2e', eyes: '#6fa8e0', glow: '#9fb6ff',
    armorStyle: 'robe', helm: false, shield: false, weapon: 'staff',
  },

  // ---- inimigos (SRD) -----------------------------------------------------
  goblin: {
    skin: '#7fa05a', hair: '#3f4a2a', hairStyle: 'bald',
    outfit: '#6a5a42', outfitDark: '#473c2c', trim: '#8a3a2a',
    metal: '#9aa0a8', leather: '#5a4630', eyes: '#f2d24a',
    armorStyle: 'leather', helm: false, shield: true, weapon: 'sword',
    small: true, ears: true,
  },
  goblinBoss: {
    skin: '#8fae62', hair: '#2f3a20', hairStyle: 'spiky',
    outfit: '#7a3030', outfitDark: '#4a1e1e', trim: '#e0b84a',
    metal: '#c0c8d2', leather: '#5a4630', eyes: '#ff6a2a',
    armorStyle: 'scale', helm: true, shield: true, weapon: 'sword',
    small: true, ears: true, cloak: '#5a2222',
  },
  wolf: {
    quadruped: true, snout: true,
    skin: '#7a7068', hair: '#58504a', outfit: '#6a6058', outfitDark: '#413a35',
    trim: '#9a9088', metal: '#9a9088', leather: '#58504a', eyes: '#ffd24a',
  },
};

export function resolveLook(key) {
  const look = LOOKS[key];
  if (!look) throw new Error(`Look desconhecido: "${key}"`);
  return look;
}

export const allLookKeys = () => Object.keys(LOOKS);
