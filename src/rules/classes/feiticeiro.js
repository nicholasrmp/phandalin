// SRD 5.1 (CC-BY-4.0) — ver NOTICE.md
// Feiticeiro, do 1º ao 20º, com a origem do SRD (Linhagem Dracônica).

const METAMAGIAS = ['quickenedSpell', 'twinnedSpell', 'carefulSpell', 'empoweredSpell', 'distantSpell', 'extendedSpell', 'heightenedSpell', 'subtleSpell'];

export default {
  id: 'feiticeiro',
  nome: 'Feiticeiro',
  dadoDeVida: 6,
  resistencias: ['con', 'cha'],
  armaduras: [],
  armas: ['adaga', 'dardo', 'funda', 'bordao', 'bestaLeve'],
  pericias: { quantas: 2, de: ['arcanismo', 'enganacao', 'intuicao', 'intimidacao', 'persuasao', 'religiao'] },
  atributosPrincipais: ['cha', 'con'],
  conjuracao: {
    tipo: 'plena',
    atributo: 'cha',
    prepara: 'conhecidas',
    truques: { 1: 4, 4: 5, 10: 6 },
    conhecidas: [null, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 13, 14, 14, 15, 15, 15, 15],
  },
  niveis: {
    1: ['spellcasting', 'sorcerousOrigin'],
    2: ['fontOfMagic', 'sorceryPoints'],
    3: ['metamagic'],
    4: ['asi'],
    8: ['asi'],
    12: ['asi'],
    16: ['asi'],
    19: ['asi'],
    20: ['sorcerousRestoration'],
  },
  // Metamagias conhecidas: 2 no 3º, 3 no 10º, 4 no 17º.
  metamagias: { 3: 2, 10: 3, 17: 4 },
  opcoesDeMetamagia: METAMAGIAS,
  recursos: {
    sorceryPoints: (n) => (n >= 2 ? n : 0),
  },
  subclasse: {
    nivel: 1,
    nome: 'Origem Feiticeira',
    opcoes: {
      draconica: {
        nome: 'Linhagem Dracônica',
        fonte: 'srd',
        niveis: {
          1: ['dragonAncestor', 'draconicResilience'],
          6: ['elementalAffinity'],
          14: ['dragonWings'],
          18: ['draconicPresence'],
        },
        escalas: { defesaSemArmadura: () => 'draconica' },
        escolhasDeGanho: {
          // O dragão ancestral define o tipo de dano da Afinidade Elemental.
          dragonAncestor: {
            campo: 'ancestralDraconico',
            opcoes: ['vermelho', 'azul', 'branco', 'preto', 'verde', 'ouro', 'prata', 'bronze', 'latao', 'cobre'],
          },
        },
      },
    },
  },
};
