// SRD 5.1 (CC-BY-4.0) — ver NOTICE.md
// Clérigo, do 1º ao 20º, com o domínio do SRD (Vida).
//
// O domínio é escolhido no 1º nível — antes do 2º, ao contrário da maioria
// das classes —, e por isso `subclasse.nivel` é 1.

export default {
  id: 'clerigo',
  nome: 'Clérigo',
  dadoDeVida: 8,
  resistencias: ['wis', 'cha'],
  armaduras: ['leve', 'média', 'escudo'],
  armas: ['simples'],
  pericias: { quantas: 2, de: ['historia', 'intuicao', 'medicina', 'persuasao', 'religiao'] },
  atributosPrincipais: ['wis', 'con'],
  conjuracao: {
    tipo: 'plena',
    atributo: 'wis',
    prepara: 'lista',
    truques: { 1: 3, 4: 4, 10: 5 },
  },
  niveis: {
    1: ['spellcasting', 'divineDomain'],
    2: ['channelDivinity', 'turnUndead'],
    4: ['asi'],
    5: ['destroyUndead'],
    8: ['asi'],
    10: ['divineIntervention'],
    12: ['asi'],
    16: ['asi'],
    19: ['asi'],
  },
  escalas: {
    // Destruir Mortos-Vivos: o nível de desafio máximo que some na hora.
    ndDestruirMortosVivos: (n) => (n >= 17 ? 4 : n >= 14 ? 3 : n >= 11 ? 2 : n >= 8 ? 1 : n >= 5 ? 0.5 : 0),
    // Intervenção Divina: a chance (em %) é o nível; no 20º, é certa.
    chanceDeIntervencao: (n) => (n >= 20 ? 100 : n >= 10 ? n : 0),
  },
  recursos: {
    channelDivinity: (n) => (n >= 18 ? 3 : n >= 6 ? 2 : n >= 2 ? 1 : 0),
  },
  subclasse: {
    nivel: 1,
    nome: 'Domínio Divino',
    opcoes: {
      vida: {
        nome: 'Domínio da Vida',
        fonte: 'srd',
        armaduras: ['pesada'],
        niveis: {
          1: ['discipleOfLife'],
          2: ['preserveLife'],
          6: ['blessedHealer'],
          8: ['divineStrike'],
          17: ['supremeHealing'],
        },
        escalas: { danoDoGolpeDivino: (n) => (n >= 14 ? '2d8' : n >= 8 ? '1d8' : null) },
        // Magias do domínio: sempre preparadas, sem contar no limite (ids dos
        // ícones do catálogo; as que o motor ainda não tem ficam de fora da
        // barra até ganharem regra).
        magiasDoDominio: {
          1: ['bencao', 'curarFerimentos'],
          3: ['restauracaoMenor', 'armaEspiritual'],
          5: ['farolDeEsperanca', 'revivificar'],
          7: ['protecaoContraAMorte', 'guardiaoDaFe'],
          9: ['curarFerimentosEmMassa', 'reviverOsMortos'],
        },
      },
    },
  },
};
