// SRD 5.1 (CC-BY-4.0) — ver NOTICE.md
// Guerreiro, do 1º ao 20º, com o arquétipo do SRD (Campeão).

export default {
  id: 'guerreiro',
  nome: 'Guerreiro',
  dadoDeVida: 10,
  resistencias: ['str', 'con'],
  armaduras: ['leve', 'média', 'pesada', 'escudo'],
  armas: ['simples', 'marcial'],
  pericias: { quantas: 2, de: ['acrobacia', 'lidarComAnimais', 'atletismo', 'historia', 'intuicao', 'intimidacao', 'percepcao', 'sobrevivencia'] },
  atributosPrincipais: ['str', 'con'],
  estilosDeLuta: ['defense', 'archery', 'dueling', 'greatWeaponFighting', 'protection', 'twoWeaponFighting'],
  niveis: {
    1: ['fightingStyle', 'secondWind'],
    2: ['actionSurge'],
    3: ['martialArchetype'],
    4: ['asi'],
    5: ['extraAttack'],
    6: ['asi'],
    8: ['asi'],
    9: ['indomitable'],
    12: ['asi'],
    14: ['asi'],
    16: ['asi'],
    19: ['asi'],
  },
  escalas: {
    // Ataques extras na ação de Atacar: 1 no 5º, 2 no 11º, 3 no 20º.
    ataquesExtras: (n) => (n >= 20 ? 3 : n >= 11 ? 2 : n >= 5 ? 1 : 0),
  },
  recursos: {
    secondWind: () => 1,
    actionSurge: (n) => (n >= 17 ? 2 : n >= 2 ? 1 : 0),
    indomitable: (n) => (n >= 17 ? 3 : n >= 13 ? 2 : n >= 9 ? 1 : 0),
  },
  subclasse: {
    nivel: 3,
    nome: 'Arquétipo Marcial',
    opcoes: {
      campeao: {
        nome: 'Campeão',
        fonte: 'srd',
        niveis: {
          3: ['improvedCritical'],
          7: ['remarkableAthlete'],
          10: ['additionalFightingStyle'],
          15: ['superiorCritical'],
          18: ['survivor'],
        },
        escalas: { margemDeCritico: (n) => (n >= 15 ? 18 : 19) },
      },
    },
  },
};
