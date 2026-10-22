// LOOKS do grupo jogável.
//
// CAMPOS DO LOOK
//   CORPO     species  humano|elfo|anao|halfling|goblin|hobgoblin|bugbear|orc|...
//             build    magro|normal|forte|gordo
//             heightMul  ajuste fino de altura dentro da espécie (1 = padrão)
//             plan     nome de um plano corporal de `art/plans/` para quem não
//                      é humanoide (aracnideo, gosma, mortoVivo, dragao, ...)
//   CORES     skin, hair, outfit, outfitDark, trim, metal, leather, eyes,
//             glow, cloak, noseTint
//   ESTRUTURA hairStyle  spiky|long|short|bald|hood
//             armorStyle robe|leather|scale|plate
//             weapon     sword|dagger|mace|staff|bow|axe
//             helm, shield, beard, horns: boolean
//
// A anatomia sai de `body.js` e o traço de `draw.js`. Aqui só entram dados.

export const PARTY_LOOKS = {

  // De propósito, quatro alturas diferentes: anão baixo e largo, halfling
  // baixo e leve, humana média, elfo alto e magro. Num tabuleiro isométrico
  // dá para saber quem é quem pela silhueta, sem ler o nome.
  fighter: {
    species: 'humano', build: 'normal',
    skin: '#e8b98c', hair: '#6b4a2a', hairStyle: 'short', beard: false,
    outfit: '#6d7686', outfitDark: '#4a515e', trim: '#b8452f',
    metal: '#b9c3cf', leather: '#6a4a30', eyes: '#2a2f3a',
    armorStyle: 'plate', helm: true, shield: true, weapon: 'sword',
  },
  rogue: {
    species: 'halfling', build: 'normal',
    skin: '#f0c9a0', hair: '#2e2a26', hairStyle: 'short',
    outfit: '#3f4a3a', outfitDark: '#2a3228', trim: '#8a6a3a',
    metal: '#9aa4b0', leather: '#51402e', eyes: '#3a7a52',
    armorStyle: 'leather', helm: false, shield: false, weapon: 'dagger', cloak: '#2b3328',
  },
  cleric: {
    species: 'anao', build: 'forte',
    skin: '#dca97c', hair: '#8a7a5a', hairStyle: 'short', beard: true,
    outfit: '#8a8270', outfitDark: '#5a5240', trim: '#e0c24a',
    metal: '#c3ccd6', leather: '#5d4a33', eyes: '#4a5a7a', glow: '#ffe9a8',
    armorStyle: 'scale', helm: false, shield: true, weapon: 'mace',
  },
  wizard: {
    species: 'elfo', build: 'magro',
    skin: '#f2d2b0', hair: '#cfd6de', hairStyle: 'long',
    outfit: '#3a3f7a', outfitDark: '#262a52', trim: '#7f86d8',
    metal: '#a8b0c0', leather: '#4a3f2e', eyes: '#6fa8e0', glow: '#9fb6ff',
    armorStyle: 'robe', helm: false, shield: false, weapon: 'staff',
  },
};
