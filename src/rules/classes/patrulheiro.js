// SRD 5.1 (CC-BY-4.0) — ver NOTICE.md
// Patrulheiro, do 1º ao 20º, com o arquétipo do SRD (Caçador).

// Humanoide não entra como tipo inteiro: a regra dá DUAS raças de humanoide
// no lugar de um tipo. Goblinoides e orcs é o par que a região pede.
const INIMIGOS = ['bestas', 'goblinoidesEOrcs', 'mortosVivos', 'monstruosidades', 'gigantes', 'corruptores', 'dragoes', 'elementais', 'fadas', 'gosmas', 'plantas', 'aberracoes', 'celestiais', 'constructos'];
const TERRENOS = ['floresta', 'artico', 'costa', 'deserto', 'pantano', 'montanha', 'planicie', 'subterraneo'];

export default {
  id: 'patrulheiro',
  nome: 'Patrulheiro',
  dadoDeVida: 10,
  resistencias: ['str', 'dex'],
  armaduras: ['leve', 'média', 'escudo'],
  armas: ['simples', 'marcial'],
  pericias: { quantas: 3, de: ['lidarComAnimais', 'atletismo', 'intuicao', 'investigacao', 'natureza', 'percepcao', 'furtividade', 'sobrevivencia'] },
  atributosPrincipais: ['dex', 'wis'],
  estilosDeLuta: ['archery', 'defense', 'dueling', 'twoWeaponFighting'],
  conjuracao: {
    tipo: 'meia',
    atributo: 'wis',
    prepara: 'conhecidas',
    conhecidas: [null, 0, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11],
  },
  niveis: {
    1: ['favoredEnemy', 'naturalExplorer'],
    2: ['fightingStyle', 'spellcasting'],
    3: ['rangerArchetype', 'primevalAwareness'],
    4: ['asi'],
    5: ['extraAttack'],
    6: ['favoredEnemy', 'naturalExplorer'],
    8: ['asi', 'landsStride'],
    10: ['naturalExplorer', 'hideInPlainSight'],
    12: ['asi'],
    14: ['favoredEnemy', 'vanish'],
    16: ['asi'],
    18: ['feralSenses'],
    19: ['asi'],
    20: ['foeSlayer'],
  },
  // Inimigo Favorito e Explorador Natural acumulam: cada nível que os dá
  // acrescenta um tipo de criatura ou terreno.
  escolhasDeGanho: {
    favoredEnemy: { campo: 'inimigosFavoritos', lista: true, opcoes: INIMIGOS },
    naturalExplorer: { campo: 'terrenosFavoritos', lista: true, opcoes: TERRENOS },
  },
  escalas: {
    ataquesExtras: (n) => (n >= 5 ? 1 : 0),
  },
  subclasse: {
    nivel: 3,
    nome: 'Arquétipo de Patrulheiro',
    opcoes: {
      cacador: {
        nome: 'Caçador',
        fonte: 'srd',
        niveis: {
          3: ['huntersPrey'],
          7: ['defensiveTactics'],
          11: ['multiattack'],
          15: ['superiorHuntersDefense'],
        },
        escolhasDeGanho: {
          huntersPrey: { opcoes: ['colossusSlayer', 'giantKiller', 'hordeBreaker'] },
          defensiveTactics: { opcoes: ['escapeTheHorde', 'multiattackDefense', 'steelWill'] },
          multiattack: { opcoes: ['volley', 'whirlwindAttack'] },
          superiorHuntersDefense: { opcoes: ['evasion', 'standAgainstTheTide', 'uncannyDodge'] },
        },
      },
    },
  },
};
