// LOOKS PROVISÓRIOS dos oito heróis novos da campanha.
//
// Pintados por código até cada um ganhar o seu sprite do PixelLab, como a
// Dara ganhou (a folha importada vence o look pintado, ver `sheet.js`). Por
// isso são simples: o que importa agora é a silhueta e a cor dizerem quem é
// quem no tabuleiro.
//
// Os pares que a memória do elenco manda separar bem:
//   meio-elfas  Maren (druida) em verde-musgo; Selane (feiticeira) em carmim
//   anões       Brenn (clérigo) de escamas e ouro; Torvik (paladino) de placas
//               e azul
// Espécies que o pintor ainda não tem: meio-orc sai como orc, tiferino como
// humano de chifres, gnoma como halfling.

export const HEROIS_LOOKS = {
  barbarian: {
    species: 'orc', build: 'forte',
    skin: '#8fa07a', hair: '#2a2420', hairStyle: 'long', beard: false,
    outfit: '#7a5a3a', outfitDark: '#4e3824', trim: '#b8452f',
    metal: '#a8b0b8', leather: '#5a4030', eyes: '#c9a227',
    armorStyle: 'leather', helm: false, shield: false, weapon: 'axe',
  },
  druid: {
    species: 'meioElfo', build: 'magro',
    skin: '#e6c39a', hair: '#7a4a2a', hairStyle: 'long',
    outfit: '#4f6b3a', outfitDark: '#334628', trim: '#a8c070',
    metal: '#9aa4a0', leather: '#5d4a33', eyes: '#3a7a52', glow: '#b8e08a',
    armorStyle: 'robe', helm: false, shield: false, weapon: 'staff', cloak: '#3b5230',
  },
  warlock: {
    species: 'humano', build: 'magro', horns: true,
    skin: '#b0545a', hair: '#1e1a24', hairStyle: 'short',
    outfit: '#3a2a48', outfitDark: '#241a30', trim: '#9a6ad8',
    metal: '#8a8ea0', leather: '#3a2e2a', eyes: '#f2d24a', glow: '#b48aff',
    armorStyle: 'leather', helm: false, shield: false, weapon: 'dagger', cloak: '#2a1e36',
  },
  sorcerer: {
    species: 'meioElfo', build: 'magro',
    skin: '#f0cfa8', hair: '#d8d2c8', hairStyle: 'long',
    outfit: '#8a2a2e', outfitDark: '#5a1a1e', trim: '#e0a84a',
    metal: '#c8b070', leather: '#4a3424', eyes: '#e07a3a', glow: '#ff9a4a',
    armorStyle: 'robe', helm: false, shield: false, weapon: 'staff',
  },
  paladin: {
    species: 'anao', build: 'forte',
    skin: '#d8a07a', hair: '#3a2a1e', hairStyle: 'short', beard: true,
    outfit: '#3a5a8a', outfitDark: '#24385a', trim: '#e8e2d0',
    metal: '#d2d8e0', leather: '#4a3a2a', eyes: '#3a4a6a', glow: '#fff2b0',
    armorStyle: 'plate', helm: true, shield: true, weapon: 'mace',
  },
  ranger: {
    species: 'humano', build: 'normal',
    skin: '#d9a77c', hair: '#4a3020', hairStyle: 'short', beard: true,
    outfit: '#4a5a3a', outfitDark: '#2e3a24', trim: '#8a6a3a',
    metal: '#9aa4b0', leather: '#5a4430', eyes: '#4a6a3a',
    armorStyle: 'leather', helm: false, shield: false, weapon: 'bow', cloak: '#3a4a2e',
  },
  monk: {
    species: 'elfo', build: 'magro',
    skin: '#e8c49a', hair: '#2a2a2e', hairStyle: 'short',
    outfit: '#c8782a', outfitDark: '#8a4e18', trim: '#f0d07a',
    metal: '#a8a8a8', leather: '#5a4430', eyes: '#5a7a4a',
    armorStyle: 'robe', helm: false, shield: false, weapon: 'staff',
  },
  bard: {
    species: 'halfling', build: 'magro',
    skin: '#f2c9a0', hair: '#c8582a', hairStyle: 'long',
    outfit: '#2a7a8a', outfitDark: '#1a5260', trim: '#f0c24a',
    metal: '#c8b070', leather: '#6a4a30', eyes: '#3a8a6a',
    armorStyle: 'leather', helm: false, shield: false, weapon: 'dagger', cloak: '#7a2a5a',
  },
};
