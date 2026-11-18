// Caldeirão de Tudo de Tasha (2020): as subclasses que o jogo joga, em texto nosso — ver NOTICE.md.
//
// O mesmo contrato de `subclasses-xge.js`: a subclasse no formato das feitas à mão, com `chave` ("Classe|Subclasse", em
// inglês) ligando ao texto traduzido (`src/dev/subclasses/tce-pt.json`), e RECURSOS_TCE dizendo, por id, de onde vem o
// texto, quando se usa e em que pé está no motor. O nome e a regra saem de `src/dev/importar-subclasses.mjs tce`, que
// escreve `caracteristicas-tce.js`. O que os recursos fazem numa luta mora em `rules/subclasses-livros.js`.
//
// As subclasses do artífice não entram: o jogo não tem a classe. Os Golpes Abençoados, que o próprio Tasha dá como opção
// ao Golpe Divino e à Conjuração Potente dos domínios, também não: o jogo segue com o recurso de sempre.

import { abilityMod } from '../abilities.js';

const ate = (tabela) => (n) => { let v = tabela[0][1]; for (const [nv, x] of tabela) if (n >= nv) v = x; return v; };
const pb = (n) => Math.ceil(1 + n / 4);

export const SUBCLASSES_TCE = {
  barbaro: {
    fera: {
      chave: 'Barbarian|Path of the Beast',
      fonte: 'tce',
      niveis: { 3: ['formOfTheBeast'], 6: ['bestialSoul'], 10: ['infectiousFury'], 14: ['callTheHunt'] },
      recursos: { infectiousFury: (n) => (n >= 10 ? pb(n) : 0), callTheHunt: (n) => (n >= 14 ? pb(n) : 0) },
    },
    magiaSelvagemBarbaro: {
      chave: 'Barbarian|Path of Wild Magic',
      fonte: 'tce',
      niveis: { 3: ['magicAwareness', 'barbarianWildSurge'], 6: ['bolsteringMagic'], 10: ['unstableBacklash'], 14: ['controlledSurge'] },
      recursos: { bolsteringMagic: (n) => (n >= 6 ? pb(n) : 0), magicAwareness: (n) => pb(n) },
    },
  },
  bardo: {
    criacao: {
      chave: 'Bard|College of Creation',
      fonte: 'tce',
      niveis: { 3: ['moteOfPotential', 'performanceOfCreation'], 6: ['animatingPerformance'], 14: ['creativeCrescendo'] },
      recursos: { animatingPerformance: (n) => (n >= 6 ? 1 : 0) },
    },
    eloquencia: {
      chave: 'Bard|College of Eloquence',
      fonte: 'tce',
      niveis: { 3: ['silverTongue', 'unsettlingWords'], 6: ['unfailingInspiration', 'universalSpeech'], 14: ['infectiousInspiration'] },
      recursos: { infectiousInspiration: (n, c) => (n >= 14 ? Math.max(1, abilityMod(c.abilities.cha)) : 0) },
    },
  },
  druida: {
    esporos: {
      chave: 'Druid|Circle of Spores',
      fonte: 'tce',
      niveis: { 2: ['circleSpellsSpores', 'haloOfSpores', 'symbioticEntity'], 6: ['fungalInfestation'], 10: ['spreadingSpores'], 14: ['fungalBody'] },
      recursos: { fungalInfestation: (n, c) => (n >= 6 ? Math.max(1, abilityMod(c.abilities.wis)) : 0) },
      escalas: { dadoDoHalo: ate([[1, 'd4'], [6, 'd6'], [10, 'd8'], [14, 'd10']]) },
      magiasDoDominio: {
        2: ['toqueArrepiante'], 3: ['cegueiraSurdez', 'repousoTranquilo'], 5: ['animarMortos', 'formaGasosa'],
        7: ['praga', 'confusao'], 9: ['nuvemMortal', 'contagio'],
      },
    },
    estrelas: {
      chave: 'Druid|Circle of Stars',
      fonte: 'tce',
      niveis: { 2: ['starMap', 'starryForm'], 6: ['cosmicOmen'], 10: ['twinklingConstellations'], 14: ['fullOfStars'] },
      recursos: { starMap: (n) => pb(n), cosmicOmen: (n) => (n >= 6 ? pb(n) : 0) },
      escalas: { dadosDaEstrela: (n) => (n >= 10 ? '2d8' : '1d8') },
      magiasDoDominio: { 2: ['orientacao', 'raioGuiado'] },
    },
    fogoSelvagem: {
      chave: 'Druid|Circle of Wildfire',
      fonte: 'tce',
      niveis: { 2: ['circleSpellsWildfire', 'summonWildfireSpirit'], 6: ['enhancedBond'], 10: ['cauterizingFlames'], 14: ['blazingRevival'] },
      recursos: { cauterizingFlames: (n) => (n >= 10 ? pb(n) : 0), blazingRevival: (n) => (n >= 14 ? 1 : 0) },
      magiasDoDominio: {
        2: ['maosFlamejantes', 'curarFerimentos'], 3: ['esferaFlamejante', 'raioArdente'], 5: ['crescimentoDePlantas', 'revivificar'],
        7: ['auraDeVida', 'escudoDeFogo'], 9: ['golpeDeChama', 'curarFerimentosEmMassa'],
      },
    },
  },
  guerreiro: {
    psiGuerreiro: {
      chave: 'Fighter|Psi Warrior',
      fonte: 'tce',
      niveis: { 3: ['psionicPower', 'protectiveField', 'psionicStrike', 'telekineticMovement'], 7: ['telekineticAdept'], 10: ['guardedMind'], 15: ['bulwarkOfForce'], 18: ['telekineticMaster'] },
      recursos: {
        psionicEnergy: (n) => 2 * pb(n), psionicRecover: () => 1, psiPoweredLeap: (n) => (n >= 7 ? 1 : 0),
        bulwarkOfForce: (n) => (n >= 15 ? 1 : 0), telekineticMaster: (n) => (n >= 18 ? 1 : 0),
        telekineticMovement: () => 1,
      },
      voltamNoCurto: ['psionicRecover', 'psiPoweredLeap'],
      escalas: { dadoPsionico: ate([[1, 'd6'], [5, 'd8'], [11, 'd10'], [17, 'd12']]) },
    },
    cavaleiroRunico: {
      chave: 'Fighter|Rune Knight',
      fonte: 'tce',
      niveis: { 3: ['runeKnightProficiencies', 'giantsMight', 'runeCarver'], 7: ['runicShield'], 10: ['greatStature'], 15: ['masterOfRunes'], 18: ['runicJuggernaut'] },
      // AS RUNAS: duas no 3º, uma a mais no 7º, no 10º e no 15º. Cada uma tem os seus usos (um; dois com o Mestre das Runas).
      runas: { 3: 2, 7: 3, 10: 4, 15: 5 },
      opcoesDeRuna: ['runaDoFogo', 'runaDoGelo', 'runaDaColina', 'runaDaPedra', 'runaDaNuvem', 'runaDaTempestade'],
      recursos: {
        giantsMight: (n) => pb(n), runicShield: (n) => (n >= 7 ? pb(n) : 0),
        ...Object.fromEntries(['runaDoFogo', 'runaDoGelo', 'runaDaColina', 'runaDaPedra', 'runaDaNuvem', 'runaDaTempestade']
          .map((r) => [r, (n, c) => (c.features?.includes(r) ? (n >= 15 ? 2 : 1) : 0)])),
      },
      voltamNoCurto: ['runaDoFogo', 'runaDoGelo', 'runaDaColina', 'runaDaPedra', 'runaDaNuvem', 'runaDaTempestade'],
      escalas: { dadoDoGigante: ate([[1, '1d6'], [10, '1d8'], [18, '1d10']]) },
    },
  },
  monge: {
    misericordia: {
      chave: 'Monk|Way of Mercy',
      fonte: 'tce',
      niveis: { 3: ['handOfHarm', 'handOfHealing', 'implementsOfMercy'], 6: ['physiciansTouch'], 11: ['flurryOfHealingAndHarm'], 17: ['handOfUltimateMercy'] },
      periciasDeCaracteristica: { implementsOfMercy: ['intuicao', 'medicina'] },
      recursos: { handOfUltimateMercy: (n) => (n >= 17 ? 1 : 0) },
    },
    euAstral: {
      chave: 'Monk|Way of the Astral Self',
      fonte: 'tce',
      niveis: { 3: ['armsOfTheAstralSelf', 'formsOfYourAstralSelf'], 6: ['visageOfTheAstralSelf'], 11: ['bodyOfTheAstralSelf'], 17: ['awakenedAstralSelf'] },
    },
  },
  clerigo: {
    ordem: {
      chave: 'Cleric|Order Domain',
      fonte: 'tce',
      armaduras: ['pesada'],
      niveis: { 1: ['orderProficiencies', 'voiceOfAuthority'], 2: ['ordersDemand'], 6: ['embodimentOfTheLaw'], 8: ['divineStrikePsychic'], 17: ['ordersWrath'] },
      escolhasDeGanho: { orderProficiencies: { campo: 'skills', lista: true, opcoes: ['intimidacao', 'persuasao'] } },
      recursos: { embodimentOfTheLaw: (n, c) => (n >= 6 ? Math.max(1, abilityMod(c.abilities.wis)) : 0) },
      escalas: { danoDoGolpeDivino: (n) => (n >= 14 ? '2d8' : n >= 8 ? '1d8' : null) },
      magiasDoDominio: {
        1: ['comando', 'heroismo'], 3: ['imobilizarPessoa', 'zonaDaVerdade'], 5: ['palavraCurativaEmMassa', 'lentidao'],
        7: ['compulsao', 'localizarCriatura'], 9: ['comunhao', 'dominarPessoa'],
      },
    },
    paz: {
      chave: 'Cleric|Peace Domain',
      fonte: 'tce',
      niveis: { 1: ['emboldeningBond', 'implementOfPeace'], 2: ['balmOfPeace'], 6: ['protectiveBond'], 8: ['potentSpellcasting'], 17: ['expansiveBond'] },
      escolhasDeGanho: { implementOfPeace: { campo: 'skills', lista: true, opcoes: ['intuicao', 'atuacao', 'persuasao'] } },
      recursos: { emboldeningBond: (n) => pb(n) },
      magiasDoDominio: {
        1: ['heroismo', 'santuario'], 3: ['ajuda', 'eloDeProtecao'], 5: ['farolDeEsperanca', 'enviarMensagem'],
        7: ['auraDePureza', 'esferaResilienteDeOtiluke'], 9: ['restauracaoMaior', 'vinculoTelepaticoDeRary'],
      },
    },
    crepusculo: {
      chave: 'Cleric|Twilight Domain',
      fonte: 'tce',
      armaduras: ['pesada'],
      armas: ['marcial'],
      niveis: { 1: ['twilightProficiencies', 'eyesOfNight', 'vigilantBlessing'], 2: ['twilightSanctuary'], 6: ['stepsOfNight'], 8: ['divineStrike'], 17: ['twilightShroud'] },
      recursos: { stepsOfNight: (n) => (n >= 6 ? pb(n) : 0) },
      escalas: { danoDoGolpeDivino: (n) => (n >= 14 ? '2d8' : n >= 8 ? '1d8' : null) },
      magiasDoDominio: {
        1: ['fogoDasFadas', 'sono'], 3: ['raioLunar', 'verOInvisivel'], 5: ['auraDeVitalidade', 'pequenaCabana'],
        7: ['auraDeVida', 'invisibilidadeMaior'], 9: ['circuloDePoder', 'despistar'],
      },
    },
  },
  paladino: {
    gloria: {
      chave: 'Paladin|Oath of Glory',
      fonte: 'tce',
      niveis: { 3: ['channelDivinity', 'inspiringSmite', 'peerlessAthlete'], 7: ['auraOfAlacrity'], 15: ['gloriousDefense'], 20: ['livingLegend'] },
      recursos: { gloriousDefense: (n, c) => (n >= 15 ? Math.max(1, abilityMod(c.abilities.cha)) : 0), livingLegend: (n) => (n >= 20 ? 1 : 0) },
      escalas: { raioDaAuraDeProntidao: (n) => (n >= 18 ? 10 : 5) },
      magiasDoDominio: {
        3: ['raioGuiado', 'heroismo'], 5: ['aprimorarAtributo', 'armaMagica'], 9: ['velocidade', 'protecaoContraEnergia'],
        13: ['compulsao', 'liberdadeDeMovimento'], 17: ['comunhao', 'golpeDeChama'],
      },
    },
    vigilantes: {
      chave: 'Paladin|Oath of the Watchers',
      fonte: 'tce',
      niveis: { 3: ['channelDivinity', 'abjureTheExtraplanar', 'watchersWill'], 7: ['auraOfTheSentinel'], 15: ['vigilantRebuke'], 20: ['mortalBulwark'] },
      recursos: { mortalBulwark: (n) => (n >= 20 ? 1 : 0) },
      escalas: { raioDaAuraDaSentinela: (n) => (n >= 18 ? 30 : 10) },
      magiasDoDominio: {
        3: ['alarme', 'detectarMagia'], 5: ['raioLunar', 'verOInvisivel'], 9: ['contramagia', 'indetectavel'],
        13: ['auraDePureza', 'banimento'], 17: ['imobilizarMonstro', 'videncia'],
      },
    },
  },
  patrulheiro: {
    andarilhoFeerico: {
      chave: 'Ranger|Fey Wanderer',
      fonte: 'tce',
      niveis: { 3: ['dreadfulStrikes', 'feyWandererMagic', 'otherworldlyGlamour'], 7: ['beguilingTwist'], 11: ['feyReinforcements'], 15: ['mistyWanderer'] },
      escolhasDeGanho: { otherworldlyGlamour: { campo: 'skills', lista: true, opcoes: ['persuasao', 'enganacao', 'atuacao'] } },
      recursos: { feyReinforcements: (n) => (n >= 11 ? 1 : 0), mistyWanderer: (n, c) => (n >= 15 ? Math.max(1, abilityMod(c.abilities.wis)) : 0) },
      escalas: { dadoTerrivel: (n) => (n >= 11 ? '1d6' : '1d4') },
      magiasDoDominio: { 3: ['enfeiticarPessoa'], 5: ['passoNebuloso'], 9: ['dissiparMagia'], 13: ['dimensaoPorta'], 17: ['despistar'] },
    },
    guardiaoDoEnxame: {
      chave: 'Ranger|Swarmkeeper',
      fonte: 'tce',
      niveis: { 3: ['gatheredSwarm', 'swarmkeeperMagic'], 7: ['writhingTide'], 11: ['mightySwarm'], 15: ['swarmingDispersal'] },
      recursos: { writhingTide: (n) => (n >= 7 ? pb(n) : 0), swarmingDispersal: (n) => (n >= 15 ? pb(n) : 0) },
      escalas: { dadoDoEnxame: (n) => (n >= 11 ? '1d8' : '1d6') },
      // as Mãos Mágicas vêm pela característica (`passivas.js MAGIAS_DE_CARACTERISTICA`): truque não se prepara
      magiasDoDominio: { 3: ['fogoDasFadas'], 5: ['teia'], 9: ['formaGasosa'], 13: ['olhoArcano'], 17: ['pragaDeInsetos'] },
    },
  },
  ladino: {
    fantasma: {
      chave: 'Rogue|Phantom',
      fonte: 'tce',
      niveis: { 3: ['whispersOfTheDead', 'wailsFromTheGrave'], 9: ['tokensOfTheDeparted'], 13: ['ghostWalk'], 17: ['deathsFriend'] },
      // SUSSURROS DOS MORTOS: uma perícia que o ladino não tem (a troca no descanso não tem tela no jogo)
      escolhasDeGanho: {
        whispersOfTheDead: {
          campo: 'skills', lista: true,
          opcoes: ['percepcao', 'intuicao', 'atletismo', 'investigacao', 'medicina', 'arcanismo', 'religiao', 'historia', 'sobrevivencia',
            'persuasao', 'enganacao', 'intimidacao', 'atuacao', 'natureza', 'lidarComAnimais', 'acrobacia', 'furtividade', 'prestidigitacao'],
        },
      },
      recursos: { wailsFromTheGrave: (n) => pb(n), ghostWalk: (n) => (n >= 13 ? 1 : 0) },
    },
    laminaDaAlma: {
      chave: 'Rogue|Soulknife',
      fonte: 'tce',
      niveis: { 3: ['psionicPowerSoulknife', 'psiBolsteredKnack', 'psychicWhispers', 'psychicBladesSoulknife'], 9: ['soulBlades'], 13: ['psychicVeil'], 17: ['rendMind'] },
      // os dados são os do Guerreiro Psiônico (`psionicEnergy`, `dadoPsionico`), e o botão de recuperar também
      recursos: { psionicEnergy: (n) => 2 * pb(n), psionicRecover: () => 1, psychicVeil: (n) => (n >= 13 ? 1 : 0), rendMind: (n) => (n >= 17 ? 1 : 0) },
      voltamNoCurto: ['psionicRecover'],
      escalas: { dadoPsionico: ate([[1, 'd6'], [5, 'd8'], [11, 'd10'], [17, 'd12']]) },
      armasDeCaracteristica: { psychicBladesSoulknife: ['laminaDaAlma', 'laminaDaAlmaArremesso'] },
    },
  },
  feiticeiro: {
    menteAberrante: {
      chave: 'Sorcerer|Aberrant Mind',
      fonte: 'tce',
      niveis: { 1: ['psionicSpells', 'telepathicSpeech'], 6: ['psionicSorcery', 'psychicDefenses'], 14: ['revelationInFlesh'], 18: ['warpingImplosion'] },
      // as MAGIAS PSIÔNICAS não contam no limite; a Lasca Mental vem pela característica (`passivas.js`), que truque não se prepara
      magiasDoDominio: {
        1: ['bracosDeHadar', 'sussurrosDissonantes'], 3: ['acalmarEmocoes', 'detectarPensamentos'], 5: ['fomeDeHadar', 'enviarMensagem'],
        7: ['tentaculosNegrosDeEvard', 'invocarAberracao'], 9: ['vinculoTelepaticoDeRary', 'telecinesia'],
      },
      recursos: { warpingImplosion: (n) => (n >= 18 ? 1 : 0) },
    },
    almaMecanica: {
      chave: 'Sorcerer|Clockwork Soul',
      fonte: 'tce',
      niveis: { 1: ['clockworkMagic', 'restoreBalance'], 6: ['bastionOfLaw'], 14: ['tranceOfOrder'], 18: ['clockworkCavalcade'] },
      magiasDoDominio: {
        1: ['alarme', 'protecaoBemMal'], 3: ['ajuda', 'restauracaoMenor'], 5: ['dissiparMagia', 'protecaoContraEnergia'],
        7: ['liberdadeDeMovimento', 'invocarConstructo'], 9: ['restauracaoMaior', 'muralhaDeForca'],
      },
      recursos: { restoreBalance: (n) => pb(n), tranceOfOrder: (n) => (n >= 14 ? 1 : 0), clockworkCavalcade: (n) => (n >= 18 ? 1 : 0) },
    },
  },
  bruxo: {
    insondavel: {
      chave: 'Warlock|The Fathomless',
      fonte: 'tce',
      niveis: { 1: ['tentacleOfTheDeeps', 'giftOfTheSea'], 6: ['oceanicSoul', 'guardianCoil'], 10: ['graspingTentacles'], 14: ['fathomlessPlunge'] },
      recursos: { tentacleOfTheDeeps: (n) => pb(n), graspingTentacles: (n) => (n >= 10 ? 1 : 0) },
      escalas: { dadoDoTentaculo: (n) => (n >= 10 ? '2d8' : '1d8') },
    },
    genio: {
      chave: 'Warlock|The Genie',
      fonte: 'tce',
      niveis: { 1: ['geniesVessel', 'bottledRespite', 'geniesWrath'], 6: ['elementalGift'], 10: ['sanctuaryVessel'], 14: ['limitedWish'] },
      // O RECEPTÁCULO: o tipo do gênio (dao, djinni, efreeti, marid) manda no dano da Ira, na resistência e nas magias da lista.
      escolhasDeGanho: { geniesVessel: { campo: 'tipoDeGenio', opcoes: ['efreeti', 'dao', 'djinni', 'marid'] } },
      recursos: { elementalGift: (n) => (n >= 6 ? pb(n) : 0) },
    },
  },
  mago: {
    laminaCantante: {
      chave: 'Wizard|Bladesinging',
      fonte: 'tce',
      armaduras: ['leve'],
      niveis: { 2: ['bladesingerStyles', 'trainingInWarAndSong', 'bladesong'], 6: ['extraAttack', 'truqueNoAtaque'], 10: ['songOfDefense'], 14: ['songOfVictory'] },
      // TREINAMENTO EM GUERRA E CANÇÃO: uma arma de perto de uma mão, à escolha, e a Atuação
      escolhasDeGanho: {
        trainingInWarAndSong: {
          campo: 'armasDaCancao', lista: true,
          opcoes: ['rapieira', 'espadaCurta', 'espadaLonga', 'cimitarra', 'machadinha', 'picareta', 'chicote', 'marteloDeGuerra', 'maca',
            'machadoDeBatalha', 'mangual', 'estrelaMatinal', 'tridente', 'lancaCurta', 'marteloLeve', 'adaga', 'clava', 'foice'],
        },
      },
      treinoDoCampo: 'armasDaCancao',
      periciasDeCaracteristica: { trainingInWarAndSong: ['atuacao'] },
      recursos: { bladesong: (n) => pb(n) },
      escalas: { ataquesExtras: (n) => (n >= 6 ? 1 : 0) },
    },
    escribas: {
      chave: 'Wizard|Order of Scribes',
      fonte: 'tce',
      niveis: { 2: ['wizardlyQuill', 'awakenedSpellbook'], 6: ['manifestMind'], 10: ['masterScrivener'], 14: ['oneWithTheWord'] },
      recursos: {
        masterScrivener: (n) => (n >= 10 ? 1 : 0),
        // a MENTE MANIFESTA: as magias do lugar dela (o bônus de proficiência) e o pôr (uma vez), por descanso longo
        manifestMind: (n) => (n >= 6 ? pb(n) : 0), invocarMente: (n) => (n >= 6 ? 1 : 0),
      },
    },
  },
};

const M = (en, tipo, extra = {}) => ({ en, tipo, motor: true, ...extra });
/** Recurso de texto ESCRITO À MÃO (as runas, que o livro guarda fora da subclasse). */
const T = (nome, tipo, desc, extra = {}) => ({ texto: { nome, desc }, tipo, motor: true, ...extra });
const S = (en, tipo, semEfeito, extra = {}) => ({ en, tipo, semEfeito, ...extra });

export const RECURSOS_TCE = {
  // ---- Caminho da Fera
  formOfTheBeast: M('Form of the Beast', 'passiva', { nota: 'No jogo a forma se escolhe no botão da Fúria; a arma natural fica na lista de armas enquanto a Fúria dura.' }),
  bestialSoul: M('Bestial Soul', 'passiva', { nota: 'Vale a arma natural mágica; nadar, escalar e o salto maior não existem no jogo.' }),
  infectiousFury: M('Infectious Fury', 'passiva', { nota: 'No jogo sai sozinha, no primeiro acerto de arma natural do turno, e o efeito é o dano psíquico.' }),
  callTheHunt: M('Call the Hunt', 'passiva', { nota: 'No jogo sai sozinho ao entrar em Fúria, com os aliados mais perto.' }),
  // ---- Caminho da Magia Selvagem
  magicAwareness: M('Magic Awareness', 'acao', { nota: 'O registro diz quem mantém que magia (com a escola), quem leva item mágico e que zona de magia está perto.' }),
  barbarianWildSurge: M('Wild Surge', 'passiva', { nota: 'As oito do livro estão no jogo; as que andam com o bárbaro (as flores, as luzes) valem para quem está perto dele no começo de cada turno.' }),
  bolsteringMagic: M('Bolstering Magic', 'acao', { nota: 'Vale nas jogadas de ataque; o +1d3 nos testes de atributo não existe no jogo.' }),
  unstableBacklash: M('Unstable Backlash', 'reacao', { nota: 'No jogo sai sozinho, no golpe de 10 ou mais.' }),
  controlledSurge: M('Controlled Surge', 'passiva', { nota: 'No jogo vale o melhor dos dois, pela ordem da tabela.' }),
  // ---- Colégio da Criação
  moteOfPotential: M('Mote of Potential', 'passiva', { nota: 'O efeito rola o próprio dado de Inspiração.' }),
  performanceOfCreation: S('Performance of Creation', 'acao', 'o jogo não cria objetos'),
  animatingPerformance: M('Animating Performance', 'acao', { nota: 'O item dançante obedece como qualquer criatura invocada; o espaço de 3º círculo no lugar do uso não existe no jogo.' }),
  creativeCrescendo: S('Creative Crescendo', 'passiva', 'o jogo não cria objetos'),
  // ---- Colégio da Eloquência
  silverTongue: M('Silver Tongue', 'passiva'),
  unsettlingWords: M('Unsettling Words', 'bonus'),
  unfailingInspiration: M('Unfailing Inspiration', 'passiva'),
  universalSpeech: S('Universal Speech', 'acao', 'o jogo não tem idiomas'),
  infectiousInspiration: M('Infectious Inspiration', 'reacao', { nota: 'No jogo sai sozinha, para o aliado mais perto sem Inspiração.' }),
  // ---- Círculo dos Esporos
  circleSpellsSpores: M('Circle Spells', 'passiva', { nivel: 2 }),
  haloOfSpores: M('Halo of Spores', 'reacao', { nota: 'No jogo a reação sai sozinha, no começo do turno do inimigo mais perto a até 3 m.' }),
  symbioticEntity: M('Symbiotic Entity', 'acao'),
  fungalInfestation: M('Fungal Infestation', 'reacao', { nota: 'No jogo sai sozinha, no primeiro humanoide ou fera que morre perto.' }),
  spreadingSpores: M('Spreading Spores', 'bonus'),
  fungalBody: M('Fungal Body', 'passiva'),
  // ---- Círculo das Estrelas
  starMap: M('Star Map', 'passiva', { nota: 'O jogo não cobra foco de conjuração: o mapa vale sempre.' }),
  starryForm: M('Starry Form', 'bonus', { junta: ['Archer', 'Chalice', 'Dragon'], nota: 'A luz da forma não muda a luz do mapa.' }),
  cosmicOmen: M('Cosmic Omen', 'reacao', { nota: 'No jogo a reação sai sozinha, quando o dado pode virar o resultado.' }),
  twinklingConstellations: M('Twinkling Constellations', 'passiva', { nota: 'No jogo a constelação se troca pelo botão da forma.' }),
  fullOfStars: M('Full of Stars', 'passiva'),
  // ---- Círculo do Fogo Selvagem
  circleSpellsWildfire: M('Circle Spells', 'passiva', { nivel: 2 }),
  summonWildfireSpirit: M('Summon Wildfire Spirit', 'acao', { nota: 'O espírito obedece como qualquer criatura invocada; o teleporte de fogo dele não existe no jogo.' }),
  enhancedBond: M('Enhanced Bond', 'passiva', { nota: 'A magia sair do espírito não existe no jogo.' }),
  cauterizingFlames: M('Cauterizing Flames', 'reacao', { nota: 'No jogo a reação sai sozinha: cura o aliado e queima o inimigo que entra na chama.' }),
  blazingRevival: M('Blazing Revival', 'passiva'),
  // ---- Guerreiro Psiônico
  psionicPower: M('Psionic Power', 'bonus'),
  protectiveField: M('Protective Field', 'reacao', { nota: 'No jogo a reação sai sozinha, no golpe de 8 ou mais, ou no que derrubaria.' }),
  psionicStrike: M('Psionic Strike', 'livre', { nota: 'No jogo é um interruptor: ligado, o primeiro golpe de arma do turno gasta um dado.' }),
  telekineticMovement: M('Telekinetic Movement', 'acao', { nota: 'Ctrl+clique marca a criatura aliada, e o clique escolhe a casa de chegada. O objeto solto e o objeto Miúdo que vai para a mão não entram: o tabuleiro não tem objeto solto.' }),
  telekineticAdept: M('Telekinetic Adept', 'bonus', { junta: ['Psi-Powered Leap', 'Telekinetic Thrust'], nota: 'O Impulso Telecinético, no jogo, deixa o alvo caído.' }),
  guardedMind: M('Guarded Mind', 'passiva', { nota: 'No jogo o dado se gasta sozinho, no começo do turno enfeitiçado ou amedrontado.' }),
  bulwarkOfForce: M('Bulwark of Force', 'bonus'),
  telekineticMaster: M('Telekinetic Master', 'bonus'),
  // ---- Cavaleiro Rúnico
  runeKnightProficiencies: S('Bonus Proficiencies', 'fora', 'o jogo não tem ferramentas de ferreiro nem idiomas', { nivel: 3 }),
  giantsMight: M("Giant's Might", 'bonus', { nota: 'Virar Grande não existe no jogo: valem a vantagem e o dado.' }),
  runeCarver: M('Rune Carver', 'passiva', { nota: 'As runas valem pelo que fazem na luta; as vantagens fora dela não existem no jogo.' }),
  runaDoFogo: T('Runa do Fogo', 'livre', 'No acerto de arma, armada: +2d6 de fogo, e o alvo testa Força (CD 8 + proficiência + CON) ou fica contido por correntes de fogo por um minuto, testando de novo no fim de cada turno dele. Um uso por descanso curto ou longo.'),
  runaDoGelo: T('Runa do Gelo', 'bonus', 'Ação bônus: +2 nos testes e resistências de Força e Constituição por dez minutos. Um uso por descanso curto ou longo.'),
  runaDaColina: T('Runa da Colina', 'bonus', 'Ação bônus: resistência a dano de concussão, cortante e perfurante por um minuto. Um uso por descanso curto ou longo.'),
  runaDaPedra: T('Runa da Pedra', 'reacao', 'Reação: um inimigo termina o turno a até 9 m; ele testa Sabedoria ou fica enfeitiçado e parado, sem agir, por um minuto, testando de novo no fim de cada turno. No jogo, sai sozinha no primeiro que termina o turno perto. Um uso por descanso curto ou longo.'),
  runaDaNuvem: T('Runa da Nuvem', 'reacao', 'Reação: um aliado a até 9 m é acertado; o golpe passa para outro inimigo a até 9 m do cavaleiro, com a mesma rolagem. No jogo, sai sozinha no golpe que derrubaria o aliado. Um uso por descanso curto ou longo.'),
  runaDaTempestade: T('Runa da Tempestade', 'bonus', 'Ação bônus: um minuto de visão profética; uma vez por rodada, com a reação, um aliado a até 18 m ataca com vantagem. Um uso por descanso curto ou longo.'),
  runicShield: M('Runic Shield', 'reacao', { nota: 'No jogo a reação sai sozinha, no primeiro golpe que acerta um aliado a até 18 m.' }),
  greatStature: M('Great Stature', 'passiva'),
  masterOfRunes: M('Master of Runes', 'passiva'),
  runicJuggernaut: M('Runic Juggernaut', 'passiva', { nota: 'Virar Enorme e o alcance a mais não existem no jogo: vale o 1d10.' }),
  // ---- Caminho da Misericórdia
  handOfHarm: M('Hand of Harm', 'livre', { nota: 'No jogo é um interruptor: ligado, o primeiro golpe desarmado do turno gasta 1 ki.' }),
  handOfHealing: M('Hand of Healing', 'acao', { nota: 'Na Rajada, o botão "Rajada de Cura" troca um golpe por uma cura sem ki.' }),
  implementsOfMercy: M('Implements of Mercy', 'passiva', { nota: 'O kit de herbalismo e a máscara não existem no jogo.' }),
  physiciansTouch: M("Physician's Touch", 'passiva'),
  flurryOfHealingAndHarm: M('Flurry of Healing and Harm', 'passiva'),
  handOfUltimateMercy: M('Hand of Ultimate Mercy', 'acao'),
  // ---- Caminho do Eu Astral
  armsOfTheAstralSelf: M('Arms of the Astral Self', 'bonus'),
  formsOfYourAstralSelf: S('Forms of Your Astral Self', 'fora', 'é só aparência'),
  visageOfTheAstralSelf: M('Visage of the Astral Self', 'bonus', { nota: 'Ver na escuridão mágica e a voz que só um ouve não existem no jogo.' }),
  bodyOfTheAstralSelf: M('Body of the Astral Self', 'reacao', { nota: 'No jogo a reação sai sozinha, no dano elemental de 8 ou mais.' }),
  awakenedAstralSelf: M('Awakened Astral Self', 'bonus'),
  // ---- Domínio da Ordem
  orderProficiencies: M('Bonus Proficiencies', 'passiva'),
  voiceOfAuthority: M('Voice of Authority', 'passiva', { nota: 'No jogo o aliado ataca o inimigo mais perto que alcança.' }),
  ordersDemand: M("Channel Divinity: Order's Demand", 'acao', { nota: 'Largar o que segura não existe no jogo.' }),
  embodimentOfTheLaw: M('Embodiment of the Law', 'livre', { nota: 'No jogo é um interruptor: ligado, a próxima magia de encantamento de 1 ação sai como ação bônus.' }),
  divineStrikePsychic: M('Divine Strike', 'passiva', { nivel: 8 }),
  ordersWrath: M("Order's Wrath", 'passiva'),
  // ---- Domínio da Paz
  emboldeningBond: M('Emboldening Bond', 'acao', { nota: 'No jogo o 1d4 sai sozinho, no primeiro ataque ou resistência de cada turno.' }),
  implementOfPeace: M('Implement of Peace', 'passiva'),
  balmOfPeace: M('Channel Divinity: Balm of Peace', 'acao', { nota: 'No jogo o clérigo fica onde está, e cura cada aliado que alcançaria andando.' }),
  protectiveBond: M('Protective Bond', 'reacao', { nota: 'No jogo sai sozinho, no golpe que derrubaria o vinculado.' }),
  expansiveBond: M('Expansive Bond', 'passiva'),
  // ---- Domínio do Crepúsculo
  twilightProficiencies: M('Bonus Proficiencies', 'passiva'),
  eyesOfNight: M('Eyes of Night', 'passiva', { nota: 'Dar a visão aos aliados não existe no jogo.' }),
  vigilantBlessing: M('Vigilant Blessing', 'acao', { nota: 'O jogo rola uma iniciativa por lado: a vantagem vale para o lado.' }),
  twilightSanctuary: M('Channel Divinity: Twilight Sanctuary', 'acao', { nota: 'A esfera não muda a luz do mapa.' }),
  // a tradução colava dez palavras do livro: texto escrito à mão (`conferir-colagem.py`)
  stepsOfNight: M('Steps of Night', 'bonus', { texto: { nome: 'Passos da Noite', desc: 'Na penumbra ou no escuro, uma ação bônus faz você subir na sombra: por um minuto, você voa tão rápido quanto anda. Usos iguais à proficiência, que voltam no descanso longo.' } }),
  twilightShroud: M('Twilight Shroud', 'passiva'),
  // ---- Juramento da Glória
  inspiringSmite: M('Inspiring Smite', 'bonus', { nota: 'No jogo os PV temporários se repartem por igual entre você e os aliados a até 9 m, os mais feridos primeiro.' }),
  peerlessAthlete: M('Peerless Athlete', 'bonus', { nota: 'Carregar mais e saltar mais longe não existem no jogo: vale a vantagem.' }),
  auraOfAlacrity: M('Aura of Alacrity', 'passiva'),
  gloriousDefense: M('Glorious Defense', 'reacao', { nota: 'No jogo a reação sai sozinha, quando o Carisma faz o golpe errar.' }),
  livingLegend: M('Living Legend', 'bonus', { nota: 'No jogo o erro vira acerto sozinho, uma vez por turno, e a resistência que falha se rola de novo, também sozinha. Gastar o espaço de 5º círculo para usar de novo não existe no jogo.' }),
  // ---- Juramento dos Vigilantes
  abjureTheExtraplanar: M('Abjure the Extraplanar', 'acao', { nota: 'Quem é expulso foge do paladino, como na Expulsão de Mortos-Vivos.' }),
  watchersWill: M("Watcher's Will", 'acao', { nota: 'No jogo valem você e os aliados mais perto, até o Carisma.' }),
  auraOfTheSentinel: M('Aura of the Sentinel', 'passiva', { nota: 'O jogo rola uma iniciativa por lado: o bônus entra na de quem está na aura.' }),
  vigilantRebuke: M('Vigilant Rebuke', 'reacao', { nota: 'No jogo a reação sai sozinha.' }),
  mortalBulwark: M('Mortal Bulwark', 'bonus', { nota: 'No jogo o banimento sai sozinho, no primeiro dano de ataque em cada criatura de outro plano, e a manda para fora da luta. Gastar o espaço de 5º círculo para usar de novo não existe no jogo.' }),
  // ---- Andarilho Feérico
  dreadfulStrikes: M('Dreadful Strikes', 'passiva'),
  feyWandererMagic: M('Fey Wanderer Magic', 'passiva', { nota: 'A dádiva feérica é só aparência.' }),
  otherworldlyGlamour: M('Otherworldly Glamour', 'passiva'),
  beguilingTwist: M('Beguiling Twist', 'reacao', { nota: 'No jogo a reação sai sozinha, quando um aliado passa, e mira o inimigo mais perto: medo, ou encanto se ele não se amedronta.' }),
  feyReinforcements: M('Fey Reinforcements', 'passiva', { nota: 'Dispensar a concentração não existe no jogo.' }),
  mistyWanderer: M('Misty Wanderer', 'passiva', { nota: 'No jogo vai junto o aliado mais ferido que estiver colado.' }),
  // ---- Guardião do Enxame
  gatheredSwarm: M('Gathered Swarm', 'passiva', { nota: 'No jogo o efeito se escolhe por um interruptor (ferir ou empurrar); o enxame deslocar você não existe no jogo.' }),
  swarmkeeperMagic: M('Swarmkeeper Magic', 'passiva'),
  writhingTide: M('Writhing Tide', 'bonus'),
  mightySwarm: M('Mighty Swarm', 'passiva', { nota: 'A meia cobertura de quando o enxame desloca você não existe no jogo.' }),
  swarmingDispersal: M('Swarming Dispersal', 'reacao', { nota: 'No jogo a reação sai sozinha, no dano de 8 ou mais (ou no que derrubaria), para a casa livre mais longe de quem feriu.' }),
  // ---- Fantasma
  whispersOfTheDead: M('Whispers of the Dead', 'passiva', { nota: 'Trocar a perícia no descanso não existe no jogo.' }),
  wailsFromTheGrave: M('Wails from the Grave', 'passiva', { nota: 'No jogo sai sozinho, na criatura mais perto da primeira; gasta um berloque quando não há uso.' }),
  tokensOfTheDeparted: M('Tokens of the Departed', 'reacao', { nota: 'No jogo o berloque nasce sozinho. Perguntar ao espírito não existe no jogo.' }),
  ghostWalk: M('Ghost Walk', 'bonus', { nota: 'Atravessar criaturas e objetos não existe no jogo.' }),
  deathsFriend: M("Death's Friend", 'passiva'),
  // ---- Lâmina da Alma
  psionicPowerSoulknife: M('Psionic Power', 'bonus'),
  psiBolsteredKnack: M('Psi-Bolstered Knack', 'passiva', { nota: 'Só nos testes com CD de fora da luta (a conversa, a exploração): na luta o teste não tem CD sabida.' }),
  psychicWhispers: S('Psychic Whispers', 'acao', 'o jogo não tem idiomas nem conversa à distância'),
  psychicBladesSoulknife: M('Psychic Blades', 'acao', { nota: 'A lâmina fica na lista de armas; a segunda sai pelo menu do alvo, como ação bônus. O jogo não confere a mão livre.' }),
  soulBlades: M('Soul Blades', 'passiva', { junta: ['Homing Strikes', 'Psychic Teleportation'], nota: 'No jogo o Golpe Teleguiado sai sozinho, quando o dado pode virar o erro. No Teletransporte, a casa se escolhe antes do dado: se ele não alcança, a lâmina cai no caminho.' }),
  psychicVeil: M('Psychic Veil', 'acao'),
  rendMind: M('Rend Mind', 'passiva', { nota: 'No jogo sai sozinho no primeiro Ataque Furtivo com as lâminas; sem o uso, gasta três dados quando os tem.' }),
  // ---- Mente Aberrante
  psionicSpells: M('Psionic Spells', 'passiva', { nota: 'Trocar uma delas ao subir de nível não existe no jogo.' }),
  telepathicSpeech: S('Telepathic Speech', 'bonus', 'o jogo não tem conversa à distância'),
  psionicSorcery: M('Psionic Sorcery', 'passiva', { nota: 'No jogo os pontos pagam a magia psiônica quando não há espaço do círculo dela.' }),
  psychicDefenses: M('Psychic Defenses', 'passiva'),
  revelationInFlesh: M('Revelation in Flesh', 'bonus', { nota: 'No jogo valem o voo e ver o invisível (a qualquer distância); nadar e passar por frestas não existem no jogo.' }),
  warpingImplosion: M('Warping Implosion', 'acao'),
  // ---- Alma Mecânica
  clockworkMagic: M('Clockwork Magic', 'passiva', { nota: 'Trocar uma delas ao subir de nível, e o jeito como a ordem aparece, não existem no jogo.' }),
  restoreBalance: M('Restore Balance', 'reacao', { nota: 'No jogo a reação sai sozinha: tira a vantagem do inimigo e a desvantagem do aliado.' }),
  bastionOfLaw: M('Bastion of Law', 'acao', { nota: 'No jogo gasta até 5 pontos, os que tiver, e a reserva sai sozinha quando o golpe é de 5 ou mais (ou derrubaria).' }),
  tranceOfOrder: M('Trance of Order', 'bonus'),
  clockworkCavalcade: M('Clockwork Cavalcade', 'acao', { nota: 'No jogo vale para os aliados a até 9 m: os 100 PV vão primeiro aos mais feridos, e acabam as magias de inimigos de 6º círculo ou menos. Consertar objetos não existe no jogo.' }),
  // ---- O Insondável
  tentacleOfTheDeeps: M('Tentacle of the Deeps', 'bonus', { nota: 'O tentáculo sai pelo botão de magia: o golpe de agora e, com a ação bônus, os dos outros turnos.' }),
  giftOfTheSea: M('Gift of the Sea', 'passiva'),
  oceanicSoul: M('Oceanic Soul', 'passiva', { nota: 'Entender a fala debaixo da água não existe no jogo.' }),
  guardianCoil: M('Guardian Coil', 'reacao', { nota: 'No jogo a reação sai sozinha, no dano de 4 ou mais perto do tentáculo.' }),
  graspingTentacles: M('Grasping Tentacles', 'passiva'),
  fathomlessPlunge: S('Fathomless Plunge', 'acao', 'o jogo não leva o grupo a uma água a mais de um quilômetro dali'),
  // ---- O Gênio
  geniesVessel: M("Genie's Vessel", 'passiva', { nota: 'O receptáculo como objeto não existe no jogo; vale o tipo do gênio, que se escolhe ao criar o herói.' }),
  bottledRespite: S('Bottled Respite', 'acao', 'o jogo não tem o espaço dentro do receptáculo'),
  geniesWrath: M("Genie's Wrath", 'passiva'),
  elementalGift: M('Elemental Gift', 'bonus'),
  sanctuaryVessel: S('Sanctuary Vessel', 'acao', 'o jogo não tem o espaço dentro do receptáculo'),
  limitedWish: S('Limited Wish', 'acao', 'o jogo não tem tela para escolher qualquer magia de qualquer lista'),
  // ---- Lâmina Cantante
  bladesingerStyles: S('Bladesinger Styles', 'fora', 'é só aparência'),
  trainingInWarAndSong: M('Training in War and Song (Bladesinging)', 'passiva', { nivel: 2 }),
  bladesong: M('Bladesong', 'bonus'),
  truqueNoAtaque: M('Extra Attack', 'passiva', { nivel: 6, nota: 'No jogo, depois de um truque de uma ação, o menu do inimigo dá o golpe que sobra do Ataque Extra.' }),
  songOfDefense: M('Song of Defense', 'reacao', { nota: 'No jogo a reação sai sozinha, no golpe que derrubaria ou de 15 ou mais, com o menor espaço que dá conta.' }),
  songOfVictory: M('Song of Victory', 'passiva'),
  // ---- Ordem dos Escribas
  wizardlyQuill: S('Wizardly Quill', 'bonus', 'o jogo não copia magias nem escreve'),
  awakenedSpellbook: M('Awakened Spellbook', 'passiva', { nota: 'No jogo o tipo se escolhe por um interruptor. O ritual sem os 10 minutos e trocar de livro não existem no jogo.' }),
  manifestMind: M('Manifest Mind', 'bonus', { nota: 'A ação bônus concedida põe a mente numa casa a até 18 m (ou a move 9 m), e o interruptor na barra faz a magia de mago do turno sair do lugar dela: o alcance, a vista e a área se contam de lá. A mente some a mais de 90 m. Gastar um espaço para pôr a mente de novo e ver e ouvir por ela fora da luta não entram.' }),
  masterScrivener: M('Master Scrivener', 'passiva', { nota: 'No jogo o pergaminho é a primeira magia de 1º ou 2º círculo de 1 ação do grimório que você conjura depois do descanso: sai sem espaço, um círculo acima. O pergaminho comprado mais barato não existe no jogo.' }),
  oneWithTheWord: M('One with the Word', 'passiva', { nota: 'Vale a vantagem em Arcanismo; anular o dano depende da Mente Manifesta, que não existe no jogo.' }),
};
