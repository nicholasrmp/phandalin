// SRD 5.1 (CC-BY-4.0) — ver NOTICE.md
// Mago, do 1º ao 20º, com a tradição do SRD (Escola de Evocação).

export default {
  id: 'mago',
  nome: 'Mago',
  dadoDeVida: 6,
  resistencias: ['int', 'wis'],
  armaduras: [],
  armas: ['adaga', 'dardo', 'funda', 'bordao', 'bestaLeve'],
  pericias: { quantas: 2, de: ['arcanismo', 'historia', 'intuicao', 'investigacao', 'medicina', 'religiao'] },
  atributosPrincipais: ['int', 'con'],
  conjuracao: {
    tipo: 'plena',
    atributo: 'int',
    prepara: 'livro',
    truques: { 1: 3, 4: 4, 10: 5 },
    // O livro começa com seis magias de 1º círculo e ganha duas por nível.
    magiasNoLivroPorNivel: 2,
  },
  niveis: {
    1: ['spellcasting', 'arcaneRecovery'],
    2: ['arcaneTradition'],
    4: ['asi'],
    8: ['asi'],
    12: ['asi'],
    16: ['asi'],
    18: ['spellMastery'],
    19: ['asi'],
    20: ['signatureSpells'],
  },
  recursos: {
    arcaneRecovery: () => 1,
  },
  subclasse: {
    nivel: 2,
    nome: 'Tradição Arcana',
    opcoes: {
      evocacao: {
        nome: 'Escola de Evocação',
        fonte: 'srd',
        niveis: {
          2: ['evocationSavant', 'sculptSpells'],
          6: ['potentCantrip'],
          10: ['empoweredEvocation'],
          14: ['overchannel'],
        },
      },
      abjuracao: {
        nome: 'Escola de Abjuração',
        fonte: 'phb',
        niveis: {
          2: ['abjurationSavant', 'arcaneWard'],
          6: ['projectedWard'],
          10: ['improvedAbjuration'],
          14: ['spellResistance'],
        },
      },
      adivinhacao: {
        nome: 'Escola de Adivinhação',
        fonte: 'phb',
        niveis: {
          2: ['divinationSavant', 'portent'],
          6: ['expertDivination'],
          10: ['thirdEye'],
          14: ['greaterPortent'],
        },
      },
      conjuracao: {
        nome: 'Escola de Conjuração',
        fonte: 'phb',
        niveis: {
          2: ['conjurationSavant', 'minorConjuration'],
          6: ['benignTransposition'],
          10: ['focusedConjuration'],
          14: ['durableSummons'],
        },
        // Transposição Benigna: uma vez, e de novo depois de um descanso longo ou de conjurar uma magia de conjuração de 1º círculo ou mais.
        recursos: { benignTransposition: (n) => (n >= 6 ? 1 : 0) },
      },
      encantamento: {
        nome: 'Escola de Encantamento',
        fonte: 'phb',
        niveis: {
          2: ['enchantmentSavant', 'hypnoticGaze'],
          6: ['instinctiveCharm'],
          10: ['splitEnchantment'],
          14: ['alterMemories'],
        },
        // Encanto Instintivo: uma vez por descanso longo, ou depois de conjurar uma magia de encantamento de 1º círculo ou mais.
        recursos: { instinctiveCharm: (n) => (n >= 6 ? 1 : 0) },
      },
      ilusao: {
        nome: 'Escola de Ilusão',
        fonte: 'phb',
        niveis: {
          2: ['illusionSavant', 'improvedMinorIllusion'],
          6: ['malleableIllusions'],
          10: ['illusorySelf'],
          14: ['illusoryReality'],
        },
        // Eu Ilusório: volta num descanso curto ou longo, ou ao conjurar uma magia de ilusão de 1º círculo ou mais.
        recursos: { illusorySelf: (n) => (n >= 10 ? 1 : 0) },
      },
      necromancia: {
        nome: 'Escola de Necromancia',
        fonte: 'phb',
        niveis: {
          2: ['necromancySavant', 'grimHarvest'],
          6: ['undeadThralls'],
          10: ['inuredToUndeath'],
          14: ['commandUndead'],
        },
      },
      transmutacao: {
        nome: 'Escola de Transmutação',
        fonte: 'phb',
        niveis: {
          2: ['transmutationSavant', 'minorAlchemy'],
          6: ['transmutersStone'],
          10: ['shapechanger'],
          14: ['masterTransmuter'],
        },
        // A Pedra do Transmutador dá UM benefício à escolha.
        escolhasDeGanho: {
          transmutersStone: { opcoes: ['stoneDarkvision', 'stoneSpeed', 'stoneConSave', 'stoneResistFire', 'stoneResistCold', 'stoneResistLightning'] },
        },
      },
    },
  },
};
