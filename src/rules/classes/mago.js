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
    },
  },
};
