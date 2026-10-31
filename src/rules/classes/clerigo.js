// SRD 5.1 (CC-BY-4.0) — ver NOTICE.md
// Clérigo, do 1º ao 20º, com o domínio do SRD (Vida) e os domínios de combate do Livro do Jogador (Guerra, Tempestade, Luz), de truque e saber (Conhecimento, Natureza, Enganacao).
//
// O domínio é escolhido no 1º nível — antes do 2º, ao contrário da maioria
// das classes —, e por isso `subclasse.nivel` é 1.

import { abilityMod } from '../abilities.js';

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
    // Intervenção Divina: um pedido por descanso longo (e, se o deus atende, uma semana de silêncio).
    divineIntervention: (n) => (n >= 10 ? 1 : 0),
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
      // ---- Livro do Jogador (não é SRD): conteúdo próprio, ver NOTICE.md ----
      guerra: {
        nome: 'Domínio da Guerra',
        fonte: 'phb',
        armaduras: ['pesada'],
        armas: ['marcial'],
        niveis: {
          1: ['warPriest'],
          2: ['guidedStrike'],
          6: ['warGodsBlessing'],
          8: ['divineStrikeWeapon'],
          17: ['avatarOfBattle'],
        },
        // Sacerdote da Guerra: SAB usos por descanso longo (mínimo 1).
        recursos: { warPriest: (n, c) => Math.max(1, abilityMod(c.abilities.wis)) },
        escalas: { danoDoGolpeDivino: (n) => (n >= 14 ? '2d8' : n >= 8 ? '1d8' : null) },
        magiasDoDominio: {
          1: ['favorDivino', 'escudoDaFe'],
          3: ['armaMagica', 'armaEspiritual'],
          5: ['mantoDoCruzado', 'espiritosGuardioes'],
          7: ['liberdadeDeMovimento', 'peleDePedra'],
          9: ['golpeDeChama', 'imobilizarMonstro'],
        },
      },
      tempestade: {
        nome: 'Domínio da Tempestade',
        fonte: 'phb',
        armaduras: ['pesada'],
        armas: ['marcial'],
        niveis: {
          1: ['wrathOfTheStorm'],
          2: ['destructiveWrath'],
          6: ['thunderboltStrike'],
          8: ['divineStrikeThunder'],
          17: ['stormborn'],
        },
        recursos: { wrathOfTheStorm: (n, c) => Math.max(1, abilityMod(c.abilities.wis)) },
        escalas: { danoDoGolpeDivino: (n) => (n >= 14 ? '2d8' : n >= 8 ? '1d8' : null) },
        magiasDoDominio: {
          1: ['nevoaObscurecente', 'ondaTrovejante'],
          3: ['lufadaDeVento', 'despedacar'],
          5: ['convocarRelampagos', 'tempestadeDeGranizo'],
          7: ['controlarAgua', 'tempestadeDeGelo'],
          9: ['ondaDestrutiva', 'pragaDeInsetos'],
        },
      },
      conhecimento: {
        nome: 'Domínio do Conhecimento',
        fonte: 'phb',
        niveis: {
          1: ['blessingsOfKnowledge'],
          2: ['knowledgeOfTheAges'],
          6: ['readThoughts'],
          8: ['potentSpellcasting'],
          17: ['visionsOfThePast'],
        },
        // Duas perícias de saber: ganha a proficiência e a dobra.
        escolhasDeGanho: {
          blessingsOfKnowledge: { campo: 'bencaoDoSaber', quantas: 2, opcoes: ['arcanismo', 'historia', 'natureza', 'religiao'] },
        },
        magiasDoDominio: {
          1: ['comando', 'identificar'],
          3: ['augurio', 'sugestao'],
          5: ['indetectavel', 'falarComOsMortos'],
          7: ['olhoArcano', 'confusao'],
          9: ['lendaETradicao', 'videncia'],
        },
      },
      natureza: {
        nome: 'Domínio da Natureza',
        fonte: 'phb',
        armaduras: ['pesada'],
        niveis: {
          1: ['acolyteOfNature', 'acolyteCantrip'],
          2: ['charmAnimalsAndPlants'],
          6: ['dampenElements'],
          8: ['divineStrikeNature'],
          17: ['masterOfNature'],
        },
        escalas: { danoDoGolpeDivino: (n) => (n >= 14 ? '2d8' : n >= 8 ? '1d8' : null) },
        escolhasDeGanho: {
          acolyteOfNature: { campo: 'acolitoPericia', opcoes: ['lidarComAnimais', 'natureza', 'sobrevivencia'] },
          acolyteCantrip: { campo: 'truqueDaNatureza', opcoes: ['arteDruidica', 'consertar', 'chicoteDeEspinhos', 'produzirChama', 'shillelagh', 'orientacao', 'borrifoVenenoso', 'resistencia'] },
        },
        magiasDoDominio: {
          1: ['amizadeAnimal', 'falarComAnimais'],
          3: ['peleDeArvore', 'crescimentoDeEspinhos'],
          5: ['crescimentoDePlantas', 'muralhaDeVento'],
          7: ['dominarBesta', 'vinhaAgradora'],
          9: ['pragaDeInsetos', 'caminharEntreArvores'],
        },
      },
      enganacao: {
        nome: 'Domínio da Enganação',
        fonte: 'phb',
        niveis: {
          1: ['blessingOfTheTrickster'],
          2: ['invokeDuplicity'],
          6: ['trickeryCloak'],
          8: ['divineStrikePoison'],
          17: ['improvedDuplicity'],
        },
        escalas: { danoDoGolpeDivino: (n) => (n >= 14 ? '2d8' : n >= 8 ? '1d8' : null) },
        magiasDoDominio: {
          1: ['enfeiticarPessoa', 'disfarcarSe'],
          3: ['imagemEspelhada', 'passosSemPegadas'],
          5: ['piscar', 'dissiparMagia'],
          7: ['dimensaoPorta', 'metamorfose'],
          9: ['dominarPessoa', 'modificarMemoria'],
        },
      },
      luz: {
        nome: 'Domínio da Luz',
        fonte: 'phb',
        niveis: {
          1: ['wardingFlare', 'lightCantrip'],
          2: ['radianceOfTheDawn'],
          6: ['improvedFlare'],
          8: ['potentSpellcasting'],
          17: ['coronaOfLight'],
        },
        recursos: { wardingFlare: (n, c) => Math.max(1, abilityMod(c.abilities.wis)) },
        magiasDoDominio: {
          1: ['maosFlamejantes', 'fogoDasFadas'],
          3: ['raioArdente', 'esferaFlamejante'],
          5: ['bolaDeFogo', 'luzDoDia'],
          7: ['guardiaoDaFe', 'muralhaDeFogo'],
          9: ['golpeDeChama', 'videncia'],
        },
      },
    },
  },
};
