// SRD 5.1 (CC-BY-4.0) — ver NOTICE.md
// Ladino, do 1º ao 20º, com o arquétipo do SRD (Ladrão).

export default {
  id: 'ladino',
  nome: 'Ladino',
  dadoDeVida: 8,
  resistencias: ['dex', 'int'],
  armaduras: ['leve'],
  armas: ['simples', 'bestaDeMao', 'espadaLonga', 'rapieira', 'espadaCurta'],
  pericias: {
    quantas: 4,
    de: ['acrobacia', 'atletismo', 'enganacao', 'intuicao', 'intimidacao', 'investigacao', 'percepcao', 'atuacao', 'persuasao', 'prestidigitacao', 'furtividade'],
  },
  atributosPrincipais: ['dex', 'con'],
  niveis: {
    1: ['expertise', 'sneakAttack', 'thievesCant'],
    2: ['cunningAction'],
    3: ['roguishArchetype'],
    4: ['asi'],
    5: ['uncannyDodge'],
    6: ['expertise'],
    7: ['evasion'],
    8: ['asi'],
    10: ['asi'],
    11: ['reliableTalent'],
    12: ['asi'],
    14: ['blindsense'],
    15: ['slipperyMind'],
    16: ['asi'],
    18: ['elusive'],
    19: ['asi'],
    20: ['strokeOfLuck'],
  },
  escalas: {
    // O nome do campo é o que o motor de combate já lê (`sneakAttack`).
    sneakAttack: (n) => `${Math.ceil(n / 2)}d6`,
    // Mente Escorregadia dá proficiência em resistência de SAB.
    saves: (n, c) => (n >= 15 && !c.saves.includes('wis') ? [...c.saves, 'wis'] : c.saves),
  },
  recursos: {
    strokeOfLuck: (n) => (n >= 20 ? 1 : 0),
  },
  subclasse: {
    nivel: 3,
    nome: 'Arquétipo de Ladino',
    opcoes: {
      ladrao: {
        nome: 'Ladrão',
        fonte: 'srd',
        niveis: {
          3: ['fastHands', 'secondStoryWork'],
          9: ['supremeSneak'],
          13: ['useMagicDevice'],
          17: ['thiefsReflexes'],
        },
      },
    },
  },
};
