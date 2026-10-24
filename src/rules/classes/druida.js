// SRD 5.1 (CC-BY-4.0) — ver NOTICE.md
// Druida, do 1º ao 20º, com o círculo do SRD (Terra).

export default {
  id: 'druida',
  nome: 'Druida',
  dadoDeVida: 8,
  resistencias: ['int', 'wis'],
  // Sem armadura nem escudo de metal: é um juramento, não falta de treino.
  armaduras: ['leve', 'média', 'escudo'],
  armas: ['clava', 'adaga', 'dardo', 'azagaia', 'maca', 'bordao', 'cimitarra', 'foice', 'funda', 'lancaCurta'],
  pericias: { quantas: 2, de: ['arcanismo', 'lidarComAnimais', 'intuicao', 'medicina', 'natureza', 'percepcao', 'religiao', 'sobrevivencia'] },
  atributosPrincipais: ['wis', 'con'],
  conjuracao: {
    tipo: 'plena',
    atributo: 'wis',
    prepara: 'lista',
    truques: { 1: 2, 4: 3, 10: 4 },
  },
  niveis: {
    1: ['druidic', 'spellcasting'],
    2: ['wildShape', 'druidCircle'],
    4: ['asi'],
    8: ['asi'],
    12: ['asi'],
    16: ['asi'],
    18: ['timelessBody', 'beastSpells'],
    19: ['asi'],
    20: ['archdruid'],
  },
  escalas: {
    // Forma Selvagem: ND máximo, e se a forma pode nadar ou voar.
    ndFormaSelvagem: (n) => (n >= 8 ? 1 : n >= 4 ? 0.5 : n >= 2 ? 0.25 : 0),
    formaSelvagemNada: (n) => n >= 4,
    formaSelvagemVoa: (n) => n >= 8,
  },
  recursos: {
    wildShape: (n) => (n >= 20 ? Infinity : n >= 2 ? 2 : 0),
  },
  subclasse: {
    nivel: 2,
    nome: 'Círculo Druídico',
    opcoes: {
      terra: {
        nome: 'Círculo da Terra',
        fonte: 'srd',
        niveis: {
          2: ['bonusCantrip', 'naturalRecovery', 'circleSpells'],
          6: ['landsStride'],
          10: ['naturesWard'],
          14: ['naturesSanctuary'],
        },
        // Truque Adicional: um truque de druida a mais.
        truquesExtra: { 2: 1 },
        escolhasDeGanho: {
          // O terreno define as magias do círculo.
          circleSpells: {
            campo: 'terrenoDoCirculo',
            opcoes: ['floresta', 'artico', 'costa', 'deserto', 'pantano', 'montanha', 'planicie', 'subterraneo'],
          },
        },
        // Sempre preparadas, por terreno e nível de druida.
        magiasDoCirculo: {
          artico: { 3: ['imobilizarPessoa', 'crescimentoDeEspinhos'], 5: ['tempestadeDeGranizo', 'lentidao'], 7: ['liberdadeDeMovimento', 'tempestadeDeGelo'], 9: ['comunhaoComANatureza', 'coneDeFrio'] },
          costa: { 3: ['imagemEspelhada', 'passoNebuloso'], 5: ['respirarNaAgua', 'andarNaAgua'], 7: ['controlarAgua', 'liberdadeDeMovimento'], 9: ['conjurarElemental', 'videncia'] },
          deserto: { 3: ['borrao', 'silencio'], 5: ['criarAlimentoAgua', 'protecaoContraEnergia'], 7: ['praga', 'terrenoAlucinatorio'], 9: ['pragaDeInsetos', 'muralhaDePedra'] },
          floresta: { 3: ['peleDeArvore', 'patasDeAranha'], 5: ['convocarRelampagos', 'crescimentoDePlantas'], 7: ['adivinhacao', 'liberdadeDeMovimento'], 9: ['comunhaoComANatureza', 'caminharEntreArvores'] },
          planicie: { 3: ['invisibilidade', 'passosSemPegadas'], 5: ['luzDoDia', 'velocidade'], 7: ['adivinhacao', 'liberdadeDeMovimento'], 9: ['sonho', 'pragaDeInsetos'] },
          montanha: { 3: ['patasDeAranha', 'crescimentoDeEspinhos'], 5: ['relampago', 'fundirSeComPedra'], 7: ['moldarRocha', 'peleDePedra'], 9: ['atravessarParedes', 'muralhaDePedra'] },
          pantano: { 3: ['flechaAcida', 'escuridao'], 5: ['andarNaAgua', 'nuvemFetida'], 7: ['liberdadeDeMovimento', 'localizarCriatura'], 9: ['pragaDeInsetos', 'videncia'] },
          // Névoa Mortal (Cloudkill) está no catálogo, mas ainda sem ícone desenhado.
          subterraneo: { 3: ['patasDeAranha', 'teia'], 5: ['formaGasosa', 'nuvemFetida'], 7: ['invisibilidadeMaior', 'moldarRocha'], 9: ['nevoaMortal', 'pragaDeInsetos'] },
        },
      },
    },
  },
};
