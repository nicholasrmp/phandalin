// SRD 5.1 (CC-BY-4.0) — ver NOTICE.md
// Bruxo, do 1º ao 20º, com o patrono do SRD (o Corruptor).

// As invocações do SRD, com o pré-requisito de nível ou de pacto de cada uma.
// A ordem é a do padrão: as primeiras saem quando a escolha fica para a
// classe decidir.
const INVOCACOES = {
  agonizingBlast: { truque: 'rajadaMistica' },
  armorOfShadows: {},
  devilsSight: {},
  repellingBlast: { truque: 'rajadaMistica' },
  eldritchSight: {},
  eldritchSpear: { truque: 'rajadaMistica' },
  beguilingInfluence: {},
  fiendishVigor: {},
  maskOfManyFaces: {},
  mistyVisions: {},
  beastSpeech: {},
  eyesOfTheRuneKeeper: {},
  gazeOfTwoMinds: {},
  thirstingBlade: { nivel: 5, pacto: 'pactOfTheBlade' },
  mireTheMind: { nivel: 5 },
  oneWithShadows: { nivel: 5 },
  signOfIllOmen: { nivel: 5 },
  thiefOfFiveFates: {},
  bewitchingWhispers: { nivel: 7 },
  dreadfulWord: { nivel: 7 },
  sculptorOfFlesh: { nivel: 7 },
  ascendantStep: { nivel: 9 },
  minionsOfChaos: { nivel: 9 },
  otherworldlyLeap: { nivel: 9 },
  whispersOfTheGrave: { nivel: 9 },
  lifedrinker: { nivel: 12, pacto: 'pactOfTheBlade' },
  chainsOfCarceri: { nivel: 15, pacto: 'pactOfTheChain' },
  masterOfMyriadForms: { nivel: 15 },
  visionsOfDistantRealms: { nivel: 15 },
  witchSight: { nivel: 15 },
  voiceOfTheChainMaster: { pacto: 'pactOfTheChain' },
  bookOfAncientSecrets: { pacto: 'pactOfTheTome' },
};

export default {
  id: 'bruxo',
  nome: 'Bruxo',
  dadoDeVida: 8,
  resistencias: ['wis', 'cha'],
  armaduras: ['leve'],
  armas: ['simples'],
  pericias: { quantas: 2, de: ['arcanismo', 'enganacao', 'historia', 'intimidacao', 'investigacao', 'natureza', 'religiao'] },
  atributosPrincipais: ['cha', 'con'],
  conjuracao: {
    tipo: 'pacto',
    atributo: 'cha',
    prepara: 'conhecidas',
    truques: { 1: 2, 4: 3, 10: 4 },
    conhecidas: [null, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15],
  },
  // Arcano Místico: uma magia de cada círculo alto, uma vez por descanso longo.
  arcanoMistico: { 11: [6], 13: [6, 7], 15: [6, 7, 8], 17: [6, 7, 8, 9] },
  niveis: {
    1: ['otherworldlyPatron', 'pactMagic'],
    2: ['eldritchInvocations'],
    3: ['pactBoon'],
    4: ['asi'],
    8: ['asi'],
    11: ['mysticArcanum'],
    12: ['asi'],
    16: ['asi'],
    19: ['asi'],
    20: ['eldritchMaster'],
  },
  escolhasDeGanho: {
    pactBoon: { opcoes: ['pactOfTheBlade', 'pactOfTheChain', 'pactOfTheTome'] },
  },
  // Invocações conhecidas por nível.
  invocacoes: { 2: 2, 5: 3, 7: 4, 9: 5, 12: 6, 15: 7, 18: 8 },
  opcoesDeInvocacao: Object.keys(INVOCACOES),
  /** Pré-requisito de nível, de pacto e de truque de uma invocação. */
  podeEscolher(id, c) {
    const req = INVOCACOES[id];
    if (!req) return true;
    if (req.nivel && c.level < req.nivel) return false;
    if (req.pacto && !c.features.includes(req.pacto)) return false;
    if (req.truque && !c.spellcasting?.cantrips?.includes(req.truque)) return false;
    return true;
  },
  recursos: {
    eldritchMaster: (n) => (n >= 20 ? 1 : 0),
  },
  // Influência Sedutora dá as duas perícias.
  periciasDeCaracteristica: { beguilingInfluence: ['enganacao', 'persuasao'] },
  subclasse: {
    nivel: 1,
    nome: 'Patrono Transcendental',
    opcoes: {
      corruptor: {
        nome: 'O Corruptor',
        fonte: 'srd',
        niveis: {
          1: ['darkOnesBlessing'],
          6: ['darkOnesOwnLuck'],
          10: ['fiendishResilience'],
          14: ['hurlThroughHell'],
        },
        recursos: {
          darkOnesOwnLuck: (n) => (n >= 6 ? 1 : 0),
          hurlThroughHell: (n) => (n >= 14 ? 1 : 0),
        },
      },
    },
  },
};
