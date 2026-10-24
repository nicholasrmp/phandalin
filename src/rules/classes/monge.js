// SRD 5.1 (CC-BY-4.0) — ver NOTICE.md
// Monge, do 1º ao 20º, com a tradição do SRD (Caminho da Mão Aberta).

export default {
  id: 'monge',
  nome: 'Monge',
  dadoDeVida: 8,
  resistencias: ['str', 'dex'],
  armaduras: [],
  armas: ['simples', 'espadaCurta'],
  pericias: { quantas: 2, de: ['acrobacia', 'atletismo', 'historia', 'intuicao', 'religiao', 'furtividade'] },
  atributosPrincipais: ['dex', 'wis'],
  niveis: {
    1: ['unarmoredDefense', 'martialArts'],
    2: ['ki', 'flurryOfBlows', 'patientDefense', 'stepOfTheWind', 'unarmoredMovement'],
    3: ['monasticTradition', 'deflectMissiles'],
    4: ['asi', 'slowFall'],
    5: ['extraAttack', 'stunningStrike'],
    6: ['kiEmpoweredStrikes'],
    7: ['evasion', 'stillnessOfMind'],
    8: ['asi'],
    10: ['purityOfBody'],
    12: ['asi'],
    13: ['tongueOfSunAndMoon'],
    14: ['diamondSoul'],
    15: ['timelessBody'],
    16: ['asi'],
    18: ['emptyBody'],
    19: ['asi'],
    20: ['perfectSelf'],
  },
  escalas: {
    ataquesExtras: (n) => (n >= 5 ? 1 : 0),
    dadoDeArtesMarciais: (n) => (n >= 17 ? 'd10' : n >= 11 ? 'd8' : n >= 5 ? 'd6' : 'd4'),
    // Movimento sem Armadura: pés a mais de deslocamento.
    bonusDeDeslocamento: (n) => (n >= 18 ? 30 : n >= 14 ? 25 : n >= 10 ? 20 : n >= 6 ? 15 : n >= 2 ? 10 : 0),
    // Defesa sem Armadura: 10 + DES + SAB.
    defesaSemArmadura: () => 'wis',
    // Alma de Diamante: proficiência em todas as resistências.
    saves: (n, c) => (n >= 14 ? ['str', 'dex', 'con', 'int', 'wis', 'cha'] : c.saves),
  },
  recursos: {
    ki: (n) => (n >= 2 ? n : 0),
    wholenessOfBody: (n, c) => (c.subclasse === 'maoAberta' && n >= 6 ? 1 : 0),
  },
  subclasse: {
    nivel: 3,
    nome: 'Tradição Monástica',
    opcoes: {
      maoAberta: {
        nome: 'Caminho da Mão Aberta',
        fonte: 'srd',
        niveis: {
          3: ['openHandTechnique'],
          6: ['wholenessOfBody'],
          11: ['tranquility'],
          17: ['quiveringPalm'],
        },
      },
    },
  },
};
