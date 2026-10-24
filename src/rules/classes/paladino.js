// SRD 5.1 (CC-BY-4.0) — ver NOTICE.md
// Paladino, do 1º ao 20º, com o juramento do SRD (Devoção).

export default {
  id: 'paladino',
  nome: 'Paladino',
  dadoDeVida: 10,
  resistencias: ['wis', 'cha'],
  armaduras: ['leve', 'média', 'pesada', 'escudo'],
  armas: ['simples', 'marcial'],
  pericias: { quantas: 2, de: ['atletismo', 'intuicao', 'intimidacao', 'medicina', 'persuasao', 'religiao'] },
  atributosPrincipais: ['str', 'cha'],
  estilosDeLuta: ['defense', 'dueling', 'greatWeaponFighting', 'protection'],
  conjuracao: {
    tipo: 'meia',
    atributo: 'cha',
    prepara: 'lista',
    // Prepara CAR + metade do nível (ver `limiteDePreparacao`).
    preparaMetadeDoNivel: true,
  },
  niveis: {
    1: ['divineSense', 'layOnHands'],
    2: ['fightingStyle', 'spellcasting', 'divineSmite'],
    3: ['divineHealth', 'sacredOath'],
    4: ['asi'],
    5: ['extraAttack'],
    6: ['auraOfProtection'],
    8: ['asi'],
    10: ['auraOfCourage'],
    11: ['improvedDivineSmite'],
    12: ['asi'],
    14: ['cleansingTouch'],
    16: ['asi'],
    19: ['asi'],
  },
  escalas: {
    ataquesExtras: (n) => (n >= 5 ? 1 : 0),
    // As auras alcançam 10 pés; 30 no 18º.
    raioDeAura: (n) => (n >= 18 ? 30 : n >= 6 ? 10 : 0),
  },
  recursos: {
    // Cura pelas Mãos: reserva de 5 × nível de PV.
    layOnHands: (n) => 5 * n,
    // Sentido Divino: 1 + CAR por descanso longo.
    divineSense: (n, c) => 1 + Math.max(0, Math.floor((c.abilities.cha - 10) / 2)),
    cleansingTouch: (n, c) => (n >= 14 ? Math.max(1, Math.floor((c.abilities.cha - 10) / 2)) : 0),
    channelDivinity: (n) => (n >= 3 ? 1 : 0),
  },
  subclasse: {
    nivel: 3,
    nome: 'Juramento Sagrado',
    opcoes: {
      devocao: {
        nome: 'Juramento de Devoção',
        fonte: 'srd',
        niveis: {
          3: ['channelDivinity', 'sacredWeapon', 'turnTheUnholy'],
          7: ['auraOfDevotion'],
          15: ['purityOfSpirit'],
          20: ['holyNimbus'],
        },
        recursos: { holyNimbus: (n) => (n >= 20 ? 1 : 0) },
        magiasDoDominio: {
          3: ['protecaoBemMal', 'santuario'],
          5: ['restauracaoMenor', 'zonaDaVerdade'],
          9: ['farolDeEsperanca', 'dissiparMagia'],
          13: ['liberdadeDeMovimento', 'guardiaoDaFe'],
          17: ['comunhao', 'golpeDeChama'],
        },
      },
    },
  },
};
