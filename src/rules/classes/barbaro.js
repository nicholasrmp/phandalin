// SRD 5.1 (CC-BY-4.0) — ver NOTICE.md
// Bárbaro, do 1º ao 20º, com o caminho do SRD (Berserker).

export default {
  id: 'barbaro',
  nome: 'Bárbaro',
  dadoDeVida: 12,
  resistencias: ['str', 'con'],
  armaduras: ['leve', 'média', 'escudo'],
  armas: ['simples', 'marcial'],
  pericias: { quantas: 2, de: ['lidarComAnimais', 'atletismo', 'intimidacao', 'natureza', 'percepcao', 'sobrevivencia'] },
  atributosPrincipais: ['str', 'con'],
  niveis: {
    1: ['rage', 'unarmoredDefense'],
    2: ['recklessAttack', 'dangerSense'],
    3: ['primalPath'],
    4: ['asi'],
    5: ['extraAttack', 'fastMovement'],
    7: ['feralInstinct'],
    8: ['asi'],
    9: ['brutalCritical'],
    11: ['relentlessRage'],
    12: ['asi'],
    15: ['persistentRage'],
    16: ['asi'],
    18: ['indomitableMight'],
    19: ['asi'],
    20: ['primalChampion'],
  },
  escalas: {
    ataquesExtras: (n) => (n >= 5 ? 1 : 0),
    danoDeFuria: (n) => (n >= 16 ? 4 : n >= 9 ? 3 : 2),
    dadosDeCriticoBrutal: (n) => (n >= 17 ? 3 : n >= 13 ? 2 : n >= 9 ? 1 : 0),
    // Defesa sem Armadura: 10 + DES + CON.
    defesaSemArmadura: () => 'con',
    bonusDeDeslocamento: (n) => (n >= 5 ? 10 : 0),
  },
  recursos: {
    // Fúrias por descanso longo; no 20º, ilimitadas.
    rage: (n) => (n >= 20 ? Infinity : n >= 17 ? 6 : n >= 12 ? 5 : n >= 6 ? 4 : n >= 3 ? 3 : 2),
  },
  subclasse: {
    nivel: 3,
    nome: 'Caminho Primitivo',
    opcoes: {
      berserker: {
        nome: 'Caminho do Berserker',
        fonte: 'srd',
        niveis: {
          3: ['frenzy'],
          6: ['mindlessRage'],
          10: ['intimidatingPresence'],
          14: ['retaliation'],
        },
      },
    },
  },
};
