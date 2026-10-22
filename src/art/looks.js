// Registro de LOOKS. Não existe arquivo de arte neste repositório: `draw.js`
// pinta cada figura pixel a pixel a partir destes dados.
//
// Num RPG isso rende mais do que num jogo de ação: equipamento é um traço do
// look, então vestir um item muda o boneco na hora, sem pipeline de asset.
//
// CORPO      species: humano|elfo|anao|halfling|goblin|hobgoblin|bugbear|orc
//            build:   magro|normal|forte|gordo
//            heightMul: ajuste fino de altura dentro da espécie (1 = padrão)
//            A anatomia sai de `body.js`: altura, largura de ombro, tamanho de
//            cabeça, orelha, focinho, presas e queixo vêm da espécie, não daqui.
//
// CORES      skin, hair, outfit, outfitDark, trim, metal, leather, eyes, glow
// ESTRUTURA  hairStyle: spiky|long|short|bald|hood
//            armorStyle: robe|leather|scale|plate
//            weapon: sword|dagger|mace|staff|bow|axe
//            helm, shield, cloak, beard, horns, quadruped: boolean

export const LOOKS = {
  // ---- grupo --------------------------------------------------------------
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

  // ---- inimigos (SRD) -----------------------------------------------------
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
