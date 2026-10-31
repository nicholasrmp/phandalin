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
      cavaleiroMistico: {
        nome: 'Cavaleiro Místico',
        fonte: 'phb',
        niveis: {
          3: ['spellcasting', 'weaponBond'],
          7: ['warMagic'],
          10: ['eldritchStrike'],
          15: ['arcaneCharge'],
          18: ['improvedWarMagic'],
        },
        // Conjura com um TERÇO do nível, por Inteligência, da lista do mago (só abjuração e evocação, fora uma magia livre).
        conjuracao: {
          tipo: 'terco',
          atributo: 'int',
          prepara: 'conhecidas',
          truques: { 3: 2, 10: 3 },
          conhecidas: [null, 0, 0, 3, 4, 4, 4, 5, 6, 6, 7, 8, 8, 9, 10, 10, 11, 11, 11, 12, 13],
        },
      },
      mestreDeBatalha: {
        nome: 'Mestre de Batalha',
        fonte: 'phb',
        niveis: {
          3: ['combatSuperiority', 'studentOfWar'],
          7: ['knowYourEnemy'],
          10: ['improvedCombatSuperiority'],
          15: ['relentless'],
        },
        // Dados de superioridade: 4 no 3º, 5 no 7º, 6 no 15º (o tamanho do dado sai do nível, em combat.js).
        recursos: { superiorityDice: (n) => (n >= 15 ? 6 : n >= 7 ? 5 : 4) },
        // Manobras conhecidas: 3 no 3º, 5 no 7º, 7 no 10º, 9 no 15º. Entram as 16 do livro.
        manobras: { 3: 3, 7: 5, 10: 7, 15: 9 },
        opcoesDeManobra: ['tripAttack', 'menacingAttack', 'pushingAttack', 'lungingAttack', 'precisionAttack', 'goadingAttack', 'distractingStrike', 'riposte', 'parry',
          'commandersStrike', 'disarmingAttack', 'evasiveFootwork', 'feintingAttack', 'maneuveringAttack', 'rally', 'sweepingAttack'],
      },
    },
  },
};
