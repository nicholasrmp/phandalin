// LOOKS do bestiário: tudo que o grupo enfrenta.
//
// Pareia com `rules/monsters.js`: todo monstro de lá aponta um `look` daqui.
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

export const BESTIARIO_LOOKS = {

  // O goblin é baixo, cabeçudo e corcunda; o hobgoblin é mais alto que a
  // guerreira e tem ombro de touro. Não é a mesma figura pintada de verde.
  goblin: {
    species: 'goblin', build: 'magro',
    skin: '#70855a', hair: '#3a4026', hairStyle: 'bald',
    outfit: '#6a5a42', outfitDark: '#473c2c', trim: '#8a3a2a',
    metal: '#9aa0a8', leather: '#5a4630', eyes: '#d8b43a',
    armorStyle: 'leather', helm: false, shield: true, weapon: 'sword',
  },
  goblinBoss: {
    species: 'goblin', build: 'normal', heightMul: 1.08,
    skin: '#7d9460', hair: '#2f3a20', hairStyle: 'spiky',
    outfit: '#7a3030', outfitDark: '#4a1e1e', trim: '#e0b84a',
    metal: '#c0c8d2', leather: '#5a4630', eyes: '#ff6a2a',
    armorStyle: 'scale', helm: true, shield: true, weapon: 'sword',
    cloak: '#5a2222',
  },
  hobgoblin: {
    species: 'hobgoblin', build: 'normal',
    skin: '#c0714a', hair: '#4a1f18', hairStyle: 'spiky', noseTint: '#6a5a86',
    outfit: '#5a2a2a', outfitDark: '#3a1a1a', trim: '#c8a84a',
    metal: '#aeb6c2', leather: '#5a4630', eyes: '#ff8a2a',
    armorStyle: 'plate', helm: true, shield: true, weapon: 'sword',
  },
  bugbear: {
    species: 'bugbear', build: 'normal',
    skin: '#b08a4a', hair: '#8a3a22', hairStyle: 'spiky',
    outfit: '#4a3a2a', outfitDark: '#30241a', trim: '#8a6a2a',
    metal: '#9a9288', leather: '#5a4630', eyes: '#d8a23a',
    armorStyle: 'leather', helm: false, shield: false, weapon: 'mace',
  },
  orc: {
    species: 'orc', build: 'normal',
    skin: '#7d8a74', hair: '#1a1612', hairStyle: 'spiky',
    outfit: '#5a4a38', outfitDark: '#3a2f24', trim: '#8a3a2a',
    metal: '#a0a8b0', leather: '#5a4630', eyes: '#d84a3a',
    armorStyle: 'leather', helm: false, shield: false, weapon: 'axe',
  },

};
