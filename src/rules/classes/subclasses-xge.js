// Guia de Xanathar para Todas as Coisas (2017): as subclasses que o jogo joga, em texto nosso — ver NOTICE.md.
//
// Cada subclasse aqui tem o mesmo formato das de `barbaro.js`, `clerigo.js`... e entra em `subclasse.opcoes` da classe
// por `classes/index.js`. `chave` é o nome do livro ("Classe|Subclasse", em inglês), que liga a subclasse ao texto
// traduzido (`src/dev/subclasses/xge-pt.json`). O NOME e a DESCRIÇÃO de cada recurso não moram aqui: saem do texto
// traduzido por `src/dev/importar-subclasses.mjs xge`, que escreve `caracteristicas-xge.js`.
//
// RECURSOS_XGE diz, por id, de onde vem o texto (`en`, o nome do recurso no livro; `nivel` quando o mesmo nome se repete
// na subclasse; `junta`, os pedaços do livro que são opções do recurso), quando se usa (`tipo`) e em que pé está no motor: `motor` (o combate faz) ou `semEfeito` (o motivo de o
// jogo não fazer). Uma subclasse só entra aqui quando o que ela faz numa luta funciona; `nota` diz o pedaço do recurso que
// fica de fora ou que o jogo decide sozinho.
//
// Os recursos que o Caldeirão de Tasha acrescenta como OPCIONAIS a estas subclasses (os Golpes Abençoados do clérigo)
// não entram: são regra opcional de outro livro.

import { abilityMod } from '../abilities.js';
import { WEAPONS } from '../items/weapons.js';

/** As ARMAS KENSEI possíveis: simples ou marciais, nem pesadas nem especiais, e o arco longo. A espada longa e o arco longo
 * vão na frente, que é o par que se escolhe sem pensar (uma de perto, uma de longe). */
const ARMAS_KENSEI = ['espadaLonga', 'arcoLongo', ...Object.values(WEAPONS)
  .filter((w) => ['simples', 'marcial'].includes(w.categoria) && !['punhos', 'laminaSombria', 'raioSolar', 'espadaLonga', 'arcoLongo'].includes(w.id)
    && !(w.props ?? []).includes('pesada') && !(w.props ?? []).includes('especial'))
  .map((w) => w.id)];

const ate = (tabela) => (n) => { let v = tabela[0][1]; for (const [nv, x] of tabela) if (n >= nv) v = x; return v; };

export const SUBCLASSES_XGE = {
  barbaro: {
    guardiaoAncestral: {
      chave: 'Barbarian|Path of the Ancestral Guardian',
      fonte: 'xge',
      niveis: { 3: ['ancestralProtectors'], 6: ['spiritShield'], 10: ['consultTheSpirits'], 14: ['vengefulAncestors'] },
      escalas: { dadosDoEscudoEspiritual: ate([[1, '2d6'], [10, '3d6'], [14, '4d6']]) },
    },
    arautoDaTempestade: {
      chave: 'Barbarian|Path of the Storm Herald',
      fonte: 'xge',
      niveis: { 3: ['stormAura'], 6: ['stormSoul'], 10: ['shieldingStorm'], 14: ['ragingStorm'] },
      // A AURA é de deserto, mar ou tundra; escolhe-se no 3º nível (o livro deixa trocar a cada nível, o jogo não).
      escolhasDeGanho: { stormAura: { campo: 'ambienteDaTempestade', opcoes: ['deserto', 'mar', 'tundra'] } },
      escalas: {
        danoDaAuraDoDeserto: ate([[1, 2], [5, 3], [10, 4], [15, 5], [20, 6]]),
        dadosDaAuraDoMar: ate([[1, '1d6'], [10, '2d6'], [15, '3d6'], [20, '4d6']]),
        pvDaAuraDaTundra: ate([[1, 2], [5, 3], [10, 4], [15, 5], [20, 6]]),
      },
    },
    fanatico: {
      chave: 'Barbarian|Path of the Zealot',
      fonte: 'xge',
      niveis: { 3: ['divineFury', 'warriorOfTheGods'], 6: ['fanaticalFocus'], 10: ['zealousPresence'], 14: ['rageBeyondDeath'] },
      escolhasDeGanho: { divineFury: { campo: 'tipoDaFuriaDivina', opcoes: ['radiante', 'necrótico'] } },
      recursos: { zealousPresence: (n) => (n >= 10 ? 1 : 0) },
    },
  },
  bardo: {
    glamour: {
      chave: 'Bard|College of Glamour',
      fonte: 'xge',
      niveis: { 3: ['mantleOfInspiration', 'enthrallingPerformance'], 6: ['mantleOfMajesty'], 14: ['unbreakableMajesty'] },
      recursos: { mantleOfMajesty: (n) => (n >= 6 ? 1 : 0), unbreakableMajesty: (n) => (n >= 14 ? 1 : 0) },
      voltamNoCurto: ['unbreakableMajesty'],
      escalas: { pvDoMantoDeInspiracao: ate([[1, 5], [5, 8], [10, 11], [15, 14]]) },
    },
    espadas: {
      chave: 'Bard|College of Swords',
      fonte: 'xge',
      niveis: { 3: ['swordsProficiencies', 'fightingStyle', 'bladeFlourish'], 6: ['extraAttack'], 14: ['mastersFlourish'] },
      armaduras: ['média'],
      armas: ['cimitarra'],
      // ESTILO DE LUTA: só Duelismo ou Duas Armas.
      estilosDeLuta: ['dueling', 'twoWeaponFighting'],
      escalas: { ataquesExtras: (n) => (n >= 6 ? 1 : 0) },
    },
    sussurros: {
      chave: 'Bard|College of Whispers',
      fonte: 'xge',
      niveis: { 3: ['psychicBlades', 'wordsOfTerror'], 6: ['mantleOfWhispers'], 14: ['shadowLore'] },
      escalas: { dadosDasLaminasPsiquicas: ate([[1, '2d6'], [5, '3d6'], [10, '5d6'], [15, '8d6']]) },
    },
  },
  guerreiro: {
    arqueiroArcano: {
      chave: 'Fighter|Arcane Archer',
      fonte: 'xge',
      niveis: { 3: ['arcaneArcherLore', 'arcaneShot'], 7: ['curvingShot', 'magicArrow'], 15: ['everReadyShot'] },
      // DISPARO ARCANO: dois usos, que voltam no descanso curto ou longo.
      recursos: { arcaneShot: () => 2 },
      voltamNoCurto: ['arcaneShot'],
      escolhasDeGanho: { arcaneArcherLore: { campo: 'skills', lista: true, opcoes: ['arcanismo', 'natureza'] } },
      // As opções conhecidas: duas no 3º, uma a mais no 7º, 10º, 15º e 18º. O jogo tem cinco das oito (as outras três estão
      // em RECURSOS_XGE, com o motivo).
      disparos: { 3: 2, 7: 3, 10: 4, 15: 5, 18: 6 },
      opcoesDeDisparo: ['disparoBanidor', 'disparoEncantador', 'disparoExplosivo', 'disparoDebilitante', 'disparoSombrio'],
      escalas: {
        dadosDoDisparoArcano: (n) => (n >= 18 ? '4d6' : '2d6'),
        dadosDoDisparoBanidor: (n) => (n >= 18 ? '2d6' : null),
      },
    },
    cavaleiro: {
      chave: 'Fighter|Cavalier',
      fonte: 'xge',
      niveis: { 3: ['cavalierProficiency', 'bornToTheSaddle', 'unwaveringMark'], 7: ['wardingManeuver'], 10: ['holdTheLine'], 15: ['ferociousCharger'], 18: ['vigilantDefender'] },
      escolhasDeGanho: { cavalierProficiency: { campo: 'skills', lista: true, opcoes: ['lidarComAnimais', 'historia', 'intuicao', 'atuacao', 'persuasao'] } },
      recursos: {
        unwaveringMark: (n, c) => Math.max(1, abilityMod(c.abilities.str)),
        wardingManeuver: (n, c) => (n >= 7 ? Math.max(1, abilityMod(c.abilities.con)) : 0),
      },
    },
    samurai: {
      chave: 'Fighter|Samurai',
      fonte: 'xge',
      niveis: { 3: ['samuraiProficiency', 'fightingSpirit'], 7: ['elegantCourtier'], 10: ['tirelessSpirit'], 15: ['rapidStrike'], 18: ['strengthBeforeDeath'] },
      escolhasDeGanho: { samuraiProficiency: { campo: 'skills', lista: true, opcoes: ['historia', 'intuicao', 'atuacao', 'persuasao'] } },
      recursos: { fightingSpirit: () => 3 },
      escalas: { pvDoEspiritoDeLuta: ate([[1, 5], [10, 10], [15, 15]]) },
      // CORTESÃO ELEGANTE: resistência de Sabedoria; quem já a tem, a de Inteligência.
      resistenciasDeCaracteristica: { elegantCourtier: ['wis', 'int'] },
    },
  },
  ladino: {
    espadachim: {
      chave: 'Rogue|Swashbuckler',
      fonte: 'xge',
      niveis: { 3: ['fancyFootwork', 'rakishAudacity'], 9: ['panache'], 13: ['elegantManeuver'], 17: ['masterDuelist'] },
      recursos: { masterDuelist: (n) => (n >= 17 ? 1 : 0) },
      voltamNoCurto: ['masterDuelist'],
    },
    batedor: {
      chave: 'Rogue|Scout',
      fonte: 'xge',
      niveis: { 3: ['skirmisher', 'survivalist'], 9: ['superiorMobility'], 13: ['ambushMaster'], 17: ['suddenStrike'] },
      // SOBREVIVENTE: Natureza e Sobrevivência treinadas, e dobradas. MOBILIDADE SUPERIOR: +3 m.
      periciasDeCaracteristica: { survivalist: ['natureza', 'sobrevivencia'] },
      especializacaoDeCaracteristica: { survivalist: ['natureza', 'sobrevivencia'] },
      escalas: { bonusDeDeslocamento: (n) => (n >= 9 ? 10 : 0) },
    },
    inquisitivo: {
      chave: 'Rogue|Inquisitive',
      fonte: 'xge',
      niveis: { 3: ['earForDeceit', 'eyeForDetail', 'insightfulFighting'], 9: ['steadyEye'], 13: ['unerringEye'], 17: ['eyeForWeakness'] },
    },
    mentor: {
      chave: 'Rogue|Mastermind',
      fonte: 'xge',
      niveis: { 3: ['masterOfIntrigue', 'masterOfTactics'], 9: ['insightfulManipulator'], 13: ['misdirection'], 17: ['soulOfDeceit'] },
    },
  },
  monge: {
    mestreBebado: {
      chave: 'Monk|Way of the Drunken Master',
      fonte: 'xge',
      niveis: { 3: ['drunkenProficiencies', 'drunkenTechnique'], 6: ['tipsySway'], 11: ['drunkardsLuck'], 17: ['intoxicatedFrenzy'] },
      periciasDeCaracteristica: { drunkenProficiencies: ['atuacao'] },
    },
    kensei: {
      chave: 'Monk|Way of the Kensei',
      fonte: 'xge',
      niveis: { 3: ['pathOfTheKensei', 'agileParry', 'kenseisShot'], 6: ['oneWithTheBlade', 'kenseiWeaponExtra'], 11: ['sharpenTheBlade', 'kenseiWeaponExtra'], 17: ['unerringAccuracy', 'kenseiWeaponExtra'] },
      // AS ARMAS KENSEI: duas no 3º (uma de perto e uma de longe), mais uma no 6º, no 11º e no 17º. Treinadas e de monge.
      escolhasDeGanho: {
        pathOfTheKensei: { campo: 'armasKensei', lista: true, quantas: 2, opcoes: ARMAS_KENSEI },
        kenseiWeaponExtra: { campo: 'armasKensei', lista: true, opcoes: ARMAS_KENSEI },
      },
      treinoDoCampo: 'armasKensei',
    },
    almaSolar: {
      chave: 'Monk|Way of the Sun Soul',
      fonte: 'xge',
      niveis: { 3: ['radiantSunBolt'], 6: ['searingArcStrike'], 11: ['searingSunburst'], 17: ['sunShield'] },
      // O RAIO DE SOL é a "arma" que o monge escolhe na ação de Atacar.
      armasDeCaracteristica: { radiantSunBolt: 'raioSolar' },
      escalas: { luzPropria: (n) => (n >= 17 ? { claro: 30, penumbra: 30 } : null) },
    },
  },
  paladino: {
    conquista: {
      chave: 'Paladin|Oath of Conquest',
      fonte: 'xge',
      niveis: { 3: ['channelDivinity', 'conqueringPresence', 'guidedStrike'], 7: ['auraOfConquest'], 15: ['scornfulRebuke'], 20: ['invincibleConqueror'] },
      recursos: { invincibleConqueror: (n) => (n >= 20 ? 1 : 0) },
      escalas: { raioDaAuraDeConquista: (n) => (n >= 18 ? 30 : 10) },
      magiasDoDominio: {
        3: ['armaduraDeAgathys', 'comando'],
        5: ['imobilizarPessoa', 'armaEspiritual'],
        9: ['rogarMaldicao', 'medo'],
        13: ['dominarBesta', 'peleDePedra'],
        17: ['nuvemMortal', 'dominarPessoa'],
      },
    },
    redencao: {
      chave: 'Paladin|Oath of Redemption',
      fonte: 'xge',
      niveis: { 3: ['channelDivinity', 'emissaryOfPeace', 'rebukeTheViolent'], 7: ['auraOfTheGuardian'], 15: ['protectiveSpirit'], 20: ['emissaryOfRedemption'] },
      escalas: { raioDaAuraDoGuardiao: (n) => (n >= 18 ? 30 : 10) },
      magiasDoDominio: {
        3: ['santuario', 'sono'],
        5: ['acalmarEmocoes', 'imobilizarPessoa'],
        9: ['contramagia', 'padraoHipnotico'],
        13: ['esferaResilienteDeOtiluke', 'peleDePedra'],
        17: ['imobilizarMonstro', 'muralhaDeForca'],
      },
    },
  },
  patrulheiro: {
    perseguidorSombrio: {
      chave: 'Ranger|Gloom Stalker',
      fonte: 'xge',
      niveis: { 3: ['dreadAmbusher', 'umbralSight'], 7: ['ironMind'], 11: ['stalkersFlurry'], 15: ['shadowyDodge'] },
      // MENTE DE FERRO: a resistência de Sabedoria; quem já a tem, a de Inteligência, depois a de Carisma.
      resistenciasDeCaracteristica: { ironMind: ['wis', 'int', 'cha'] },
      magiasDoDominio: { 3: ['disfarcarSe'], 5: ['truqueDaCorda'], 9: ['medo'], 13: ['invisibilidadeMaior'], 17: ['aparenciaEnganosa'] },
    },
    andarilhoDoHorizonte: {
      chave: 'Ranger|Horizon Walker',
      fonte: 'xge',
      niveis: { 3: ['detectPortal', 'planarWarrior'], 7: ['etherealStep'], 11: ['distantStrike'], 15: ['spectralDefense'] },
      recursos: { etherealStep: (n) => (n >= 7 ? 1 : 0) },
      voltamNoCurto: ['etherealStep'],
      escalas: { dadosDoGuerreiroPlanar: (n) => (n >= 11 ? '2d8' : '1d8') },
      // O Círculo de Teletransporte do 17º não existe no jogo.
      magiasDoDominio: { 3: ['protecaoBemMal'], 5: ['passoNebuloso'], 9: ['velocidade'], 13: ['banimento'] },
    },
    matadorDeMonstros: {
      chave: 'Ranger|Monster Slayer',
      fonte: 'xge',
      niveis: { 3: ['huntersSense', 'slayersPrey'], 7: ['supernaturalDefense'], 11: ['magicUsersNemesis'], 15: ['slayersCounter'] },
      recursos: {
        huntersSense: (n, c) => Math.max(1, abilityMod(c.abilities.wis)),
        magicUsersNemesis: (n) => (n >= 11 ? 1 : 0),
      },
      voltamNoCurto: ['magicUsersNemesis'],
      magiasDoDominio: { 3: ['protecaoBemMal'], 5: ['zonaDaVerdade'], 9: ['circuloMagico'], 13: ['banimento'], 17: ['imobilizarMonstro'] },
    },
  },
  druida: {
    sonhos: {
      chave: 'Druid|Circle of Dreams',
      fonte: 'xge',
      niveis: { 2: ['balmOfTheSummerCourt'], 6: ['hearthOfMoonlightAndShadow'], 10: ['hiddenPaths'], 14: ['walkerInDreams'] },
      recursos: {
        balmOfTheSummerCourt: (n) => n,
        hiddenPaths: (n, c) => (n >= 10 ? Math.max(1, abilityMod(c.abilities.wis)) : 0),
      },
    },
    pastor: {
      chave: 'Druid|Circle of the Shepherd',
      fonte: 'xge',
      niveis: { 2: ['speechOfTheWoods', 'spiritTotem'], 6: ['mightySummoner'], 10: ['guardianSpirit'], 14: ['faithfulSummons'] },
      recursos: { spiritTotem: () => 1, faithfulSummons: (n) => (n >= 14 ? 1 : 0) },
      voltamNoCurto: ['spiritTotem'],
    },
  },
  feiticeiro: {
    almaDivina: {
      chave: 'Sorcerer|Divine Soul',
      fonte: 'xge',
      niveis: { 1: ['divineMagic', 'favoredByTheGods'], 6: ['empoweredHealing'], 14: ['otherworldlyWings'], 18: ['unearthlyRecovery'] },
      // MAGIA DIVINA: a afinidade dá uma magia a mais, que não conta no limite. As da lista do clérigo entram na escolha
      // de magias (`criacao.js listaDaClasse`).
      escolhasDeGanho: { divineMagic: { campo: 'afinidadeDivina', opcoes: ['bem', 'mal', 'ordem', 'caos', 'neutralidade'] } },
      magiasDoDominio: (c) => ({ 1: [{ bem: 'curarFerimentos', mal: 'infligirFerimentos', ordem: 'bencao', caos: 'perdicao', neutralidade: 'protecaoBemMal' }[c.afinidadeDivina ?? 'bem']] }),
      recursos: { favoredByTheGods: () => 1, unearthlyRecovery: (n) => (n >= 18 ? 1 : 0) },
      voltamNoCurto: ['favoredByTheGods'],
    },
    magiaDasSombras: {
      chave: 'Sorcerer|Shadow Magic',
      fonte: 'xge',
      niveis: { 1: ['eyesOfTheDark', 'strengthOfTheGrave'], 6: ['houndOfIllOmen'], 14: ['shadowWalk'], 18: ['umbralForm'] },
      magiasDoDominio: { 3: ['escuridao'] },
      recursos: { strengthOfTheGrave: () => 1 },
    },
    tempestade: {
      chave: 'Sorcerer|Storm Sorcery',
      fonte: 'xge',
      niveis: { 1: ['tempestuousMagic', 'windSpeaker'], 6: ['heartOfTheStorm', 'stormGuide'], 14: ['stormsFury'], 18: ['windSoul'] },
    },
  },
  bruxo: {
    celestial: {
      chave: 'Warlock|The Celestial',
      fonte: 'xge',
      niveis: { 1: ['celestialCantrips', 'healingLight'], 6: ['radiantSoul'], 10: ['celestialResilience'], 14: ['searingVengeance'] },
      // TRUQUES ADICIONAIS: Chama Sagrada e Luz, sempre à mão.
      magiasDoDominio: { 1: ['chamaSagrada', 'luz'] },
      recursos: { healingLight: (n) => 1 + n, searingVengeance: (n) => (n >= 14 ? 1 : 0) },
    },
    laminaMaldita: {
      chave: 'Warlock|The Hexblade',
      fonte: 'xge',
      niveis: { 1: ['hexWarrior', 'hexbladesCurse'], 6: ['accursedSpecter'], 10: ['armorOfHexes'], 14: ['masterOfHexes'] },
      armaduras: ['média', 'escudo'],
      armas: ['marcial'],
      recursos: { hexbladesCurse: () => 1, accursedSpecter: (n) => (n >= 6 ? 1 : 0) },
      voltamNoCurto: ['hexbladesCurse'],
    },
  },
  mago: {
    magiaDeGuerra: {
      chave: 'Wizard|War Magic',
      fonte: 'xge',
      niveis: { 2: ['arcaneDeflection', 'tacticalWit'], 6: ['powerSurge'], 10: ['durableMagic'], 14: ['deflectingShroud'] },
      recursos: { powerSurge: (n, c) => (n >= 6 ? Math.max(1, abilityMod(c.abilities.int)) : 0) },
    },
  },
  clerigo: {
    forja: {
      chave: 'Cleric|Forge Domain',
      fonte: 'xge',
      armaduras: ['pesada'],
      niveis: { 1: ['forgeProficiency', 'blessingOfTheForge'], 2: ['artisansBlessing'], 6: ['soulOfTheForge'], 8: ['divineStrikeFire'], 17: ['saintOfForgeAndFire'] },
      // A BÊNÇÃO DA FORJA vai na armadura ou na arma do próprio clérigo.
      escolhasDeGanho: { blessingOfTheForge: { campo: 'bencaoDaForja', opcoes: ['armadura', 'arma'] } },
      escalas: { danoDoGolpeDivino: (n) => (n >= 14 ? '2d8' : n >= 8 ? '1d8' : null) },
      // Fabricar e Criação não existem no jogo, e ficam de fora.
      magiasDoDominio: {
        1: ['identificar', 'golpeAbrasador'],
        3: ['calorNoMetal', 'armaMagica'],
        5: ['armaElemental', 'protecaoContraEnergia'],
        7: ['muralhaDeFogo'],
        9: ['animarObjetos'],
      },
    },
    sepultura: {
      chave: 'Cleric|Grave Domain',
      fonte: 'xge',
      niveis: { 1: ['circleOfMortality', 'eyesOfTheGrave'], 2: ['pathToTheGrave'], 6: ['sentinelAtDeathsDoor'], 8: ['potentSpellcasting'], 17: ['keeperOfSouls'] },
      recursos: { sentinelAtDeathsDoor: (n, c) => (n >= 6 ? Math.max(1, abilityMod(c.abilities.wis)) : 0) },
      magiasDoDominio: {
        1: ['perdicao', 'vidaFalsa'],
        3: ['repousoTranquilo', 'raioDoEnfraquecimento'],
        5: ['revivificar', 'toqueVampirico'],
        7: ['praga', 'protecaoContraAMorte'],
        9: ['conchaAntivida', 'reviverOsMortos'],
      },
    },
  },
};

const M = (en, tipo, extra = {}) => ({ en, tipo, motor: true, ...extra });
/** Recurso de texto ESCRITO À MÃO (as opções do Disparo Arcano, que o livro guarda fora da subclasse), em vez do traduzido. */
const T = (nome, tipo, desc, extra = {}) => ({ texto: { nome, desc }, tipo, motor: true, ...extra });
const S = (en, tipo, semEfeito, extra = {}) => ({ en, tipo, semEfeito, ...extra });

export const RECURSOS_XGE = {
  // ---- Caminho do Guardião Ancestral
  ancestralProtectors: M('Ancestral Protectors', 'passiva'),
  spiritShield: M('Spirit Shield', 'reacao', { nota: 'No jogo a reação sai sozinha, no aliado que leva 5 ou mais de dano (ou que cairia).' }),
  consultTheSpirits: S('Consult the Spirits', 'fora', 'o jogo não tem Clarividência, e o Augúrio é magia de ritual fora da luta'),
  vengefulAncestors: M('Vengeful Ancestors', 'passiva'),
  // ---- Caminho do Arauto da Tempestade
  stormAura: M('Storm Aura', 'bonus', { junta: ['Desert', 'Sea', 'Tundra'], nota: 'O ambiente se escolhe uma vez, no 3º nível.' }),
  stormSoul: M('Storm Soul', 'passiva', { junta: ['Desert', 'Sea', 'Tundra'], nota: 'Vale a resistência; incendiar ou congelar com a mão, e nadar e respirar na água pelo mar, não existem no jogo.' }),
  shieldingStorm: M('Shielding Storm', 'passiva', { nota: 'Vale para todo aliado dentro da aura.' }),
  ragingStorm: M('Raging Storm', 'reacao', { junta: ['Desert', 'Sea', 'Tundra'] }),
  // ---- Caminho do Fanático
  divineFury: M('Divine Fury', 'passiva'),
  warriorOfTheGods: S('Warrior of the Gods', 'fora', 'o jogo não cobra o componente material das magias que trazem de volta à vida'),
  fanaticalFocus: M('Fanatical Focus', 'passiva', { nota: 'No jogo o novo teste sai sozinho, no primeiro que falhar.' }),
  zealousPresence: M('Zealous Presence', 'bonus', { nota: 'Vale para todos os aliados a até 18 m, até dez.' }),
  rageBeyondDeath: M('Rage beyond Death', 'passiva'),
  // ---- Colégio do Glamour
  mantleOfInspiration: M('Mantle of Inspiration', 'bonus', { nota: 'O passo de reação de quem recebe os PV não existe no jogo.' }),
  enthrallingPerformance: S('Enthralling Performance', 'fora', 'o jogo não tem apresentação de um minuto nem plateia fora da luta'),
  mantleOfMajesty: M('Mantle of Majesty', 'bonus'),
  unbreakableMajesty: M('Unbreakable Majesty', 'bonus'),
  // ---- Colégio das Espadas
  swordsProficiencies: M('Bonus Proficiencies', 'passiva', { nota: 'O jogo não cobra foco de conjuração.' }),
  bladeFlourish: M('Blade Flourish', 'livre', { junta: ['Defensive Flourish', 'Slashing Flourish', 'Mobile Flourish'], nota: 'O passo de reação do Floreio Móvel não existe no jogo.' }),
  mastersFlourish: M("Master's Flourish", 'passiva', { nota: 'No jogo o d6 sai no lugar da Inspiração sempre.' }),
  // ---- Colégio dos Sussurros
  psychicBlades: M('Psychic Blades', 'livre'),
  wordsOfTerror: S('Words of Terror', 'fora', 'o jogo não tem conversa a sós de um minuto'),
  mantleOfWhispers: S('Mantle of Whispers', 'fora', 'o jogo não tem disfarce na pele de outra pessoa'),
  shadowLore: S('Shadow Lore', 'fora', 'o jogo não tem criatura enfeitiçada que obedece por horas'),
  // ---- Arqueiro Arcano
  arcaneArcherLore: M('Arcane Archer Lore', 'passiva', { nota: 'Vale a perícia; os truques Prestidigitação e Arte Druídica não existem no jogo.' }),
  arcaneShot: M('Arcane Shot', 'livre', { junta: ['Arcane Shot Options'], nota: 'No jogo, o disparo é um interruptor: armado, sai no próximo acerto de arco do seu turno. O Disparo Perfurante, o Disparo Buscador e a Flecha Agarradora não existem no jogo: os dois primeiros não rolam ataque, e a terceira fere quem anda, coisa que o motor ainda não pergunta.' }),
  disparoBanidor: T('Disparo Banidor', 'livre', 'Abjuração. A flecha que acerta faz o alvo testar Carisma (CD 8 + proficiência + INT); se falhar, some para outro plano até o fim do seu próximo turno: não age nem pode ser alvo. No 18º nível, o alvo leva também 2d6 de dano energético.'),
  disparoEncantador: T('Disparo Encantador', 'livre', 'Encantamento. A flecha soma 2d6 de dano psíquico (4d6 no 18º), e o alvo testa Sabedoria; se falhar, fica enfeitiçado pelo aliado seu mais perto dele, a até 9 m, até o começo do seu próximo turno.'),
  disparoExplosivo: T('Disparo Explosivo', 'livre', 'Evocação. A flecha explode: o alvo e cada criatura a 3 m dele levam 2d6 de dano energético (4d6 no 18º).'),
  disparoDebilitante: T('Disparo Debilitante', 'livre', 'Necromancia. A flecha soma 2d6 de dano necrótico (4d6 no 18º), e o alvo testa Constituição; se falhar, os ataques com arma dele causam metade do dano até o começo do seu próximo turno.'),
  disparoSombrio: T('Disparo Sombrio', 'livre', 'Ilusão. A flecha soma 2d6 de dano psíquico (4d6 no 18º), e o alvo testa Sabedoria; se falhar, não enxerga nada além de 1,5 m até o começo do seu próximo turno (no jogo, fica cego).'),
  curvingShot: M('Curving Shot', 'bonus', { nota: 'No jogo, sai sozinho: errou com o arco e a ação bônus está livre, a flecha vira no ar para o inimigo mais perto do alvo, a até 18 m dele.' }),
  magicArrow: M('Magic Arrow', 'passiva'),
  everReadyShot: M('Ever-Ready Shot', 'passiva'),
  // ---- Cavaleiro
  cavalierProficiency: M('Bonus Proficiency', 'passiva', { nivel: 3, nota: 'O idioma não existe no jogo: vale a perícia.' }),
  bornToTheSaddle: S('Born to the Saddle', 'passiva', 'o jogo não tem montaria'),
  unwaveringMark: M('Unwavering Mark', 'bonus'),
  wardingManeuver: M('Warding Maneuver', 'reacao', { nota: 'No jogo a reação sai sozinha, no primeiro golpe que acerta você ou o aliado colado em você.' }),
  holdTheLine: M('Hold the Line', 'reacao'),
  ferociousCharger: M('Ferocious Charger', 'passiva'),
  vigilantDefender: M('Vigilant Defender', 'reacao'),
  // ---- Samurai
  samuraiProficiency: M('Bonus Proficiency', 'passiva', { nota: 'O idioma não existe no jogo: vale a perícia.' }),
  fightingSpirit: M('Fighting Spirit', 'bonus'),
  elegantCourtier: M('Elegant Courtier', 'passiva'),
  tirelessSpirit: M('Tireless Spirit', 'passiva'),
  rapidStrike: M('Rapid Strike', 'passiva', { nota: 'No jogo sai sozinho, no primeiro ataque com vantagem da ação de Atacar.' }),
  strengthBeforeDeath: S('Strength before Death', 'reacao', 'o jogo não tem turno fora da ordem'),
  // ---- Espadachim
  fancyFootwork: M('Fancy Footwork', 'passiva'),
  rakishAudacity: M('Rakish Audacity', 'passiva'),
  panache: M('Panache', 'acao', { nota: 'O lado de quem não é hostil (o enfeitiçado por um minuto) não existe no jogo.' }),
  elegantManeuver: M('Elegant Maneuver', 'bonus'),
  masterDuelist: M('Master Duelist', 'passiva', { nota: 'No jogo sai sozinho, no primeiro ataque que erra.' }),
  // ---- Batedor
  skirmisher: S('Skirmisher', 'reacao', 'o jogo não tem movimento fora do turno'),
  survivalist: M('Survivalist', 'passiva'),
  superiorMobility: M('Superior Mobility', 'passiva'),
  ambushMaster: M('Ambush Master', 'passiva', { nota: 'O jogo rola uma iniciativa por lado: a vantagem vale para o lado do ladino.' }),
  suddenStrike: M('Sudden Strike', 'bonus'),
  // ---- Inquisitivo
  earForDeceit: S('Ear for Deceit', 'passiva', 'o jogo não tem teste de Intuição contra mentira'),
  eyeForDetail: S('Eye for Detail', 'bonus', 'o jogo não tem ação de procurar dentro da luta'),
  insightfulFighting: M('Insightful Fighting', 'bonus'),
  steadyEye: S('Steady Eye', 'passiva', 'o jogo não tem ação de procurar dentro da luta'),
  unerringEye: S('Unerring Eye', 'acao', 'o jogo não marca ilusão sem desfazê-la'),
  eyeForWeakness: M('Eye for Weakness', 'passiva'),
  // ---- Mentor
  masterOfIntrigue: S('Master of Intrigue', 'fora', 'o jogo não tem kits de disfarce nem idiomas'),
  masterOfTactics: M('Master of Tactics', 'bonus', { nota: 'No jogo, a ajuda é para o ataque: o próximo ataque de um aliado contra o inimigo escolhido tem vantagem.' }),
  insightfulManipulator: S('Insightful Manipulator', 'fora', 'o jogo não compara os atributos de duas criaturas'),
  misdirection: M('Misdirection', 'reacao', { nota: 'No jogo sai sozinho, quando há um inimigo colado em você entre você e quem ataca.' }),
  soulOfDeceit: S('Soul of Deceit', 'fora', 'o jogo não tem telepatia nem magia que obrigue a dizer a verdade'),
  // ---- Caminho do Mestre Bêbado
  drunkenProficiencies: M('Bonus Proficiencies', 'passiva', { nivel: 3, nota: 'Os suprimentos de cervejeiro não existem no jogo.' }),
  drunkenTechnique: M('Drunken Technique', 'passiva'),
  tipsySway: M('Tipsy Sway', 'reacao', { junta: ['Leap to Your Feet', 'Redirect Attack'], nota: 'No jogo o redirecionamento sai sozinho, no primeiro golpe de perto que erra o monge com outro inimigo colado nele.' }),
  drunkardsLuck: M("Drunkard's Luck", 'passiva', { nota: 'No jogo sai sozinho, no ataque ou na resistência com desvantagem, enquanto houver 2 de ki.' }),
  intoxicatedFrenzy: M('Intoxicated Frenzy', 'passiva'),
  // ---- Caminho do Kensei
  pathOfTheKensei: M('Path of the Kensei', 'passiva', { nota: 'Os suprimentos de caligrafia e de pintura não existem no jogo.' }),
  kenseiWeaponExtra: T('Arma Kensei a mais', 'passiva', 'No 6º, no 11º e no 17º nível, mais uma arma kensei: treinada, e de monge para você.'),
  agileParry: M('Agile Parry', 'passiva'),
  kenseisShot: M("Kensei's Shot", 'bonus'),
  oneWithTheBlade: M('One with the Blade', 'livre', { nota: 'No jogo o golpe hábil é um interruptor: ligado, o primeiro acerto com arma kensei do turno gasta 1 de ki.' }),
  sharpenTheBlade: M('Sharpen the Blade', 'bonus'),
  unerringAccuracy: M('Unerring Accuracy', 'passiva', { nota: 'No jogo sai sozinho, no primeiro erro com arma de monge do turno.' }),
  // ---- Caminho da Alma Solar
  radiantSunBolt: M('Radiant Sun Bolt', 'livre', { nota: 'No jogo o raio é uma arma que se escolhe na ação de Atacar, e conta como ataque com arma.' }),
  searingArcStrike: M('Searing Arc Strike', 'bonus'),
  searingSunburst: M('Searing Sunburst', 'acao'),
  sunShield: M('Sun Shield', 'reacao', { nota: 'No jogo a luz fica sempre acesa, e a reação sai sozinha.' }),
  // ---- Juramento de Conquista
  conqueringPresence: M('Conquering Presence', 'acao'),
  auraOfConquest: M('Aura of Conquest', 'passiva'),
  scornfulRebuke: M('Scornful Rebuke', 'passiva'),
  invincibleConqueror: M('Invincible Conqueror', 'acao', { nota: 'O crítico com 19 vale em todo ataque com arma.' }),
  // ---- Juramento da Redenção
  emissaryOfPeace: M('Emissary of Peace', 'bonus'),
  rebukeTheViolent: M('Rebuke the Violent', 'reacao', { nota: 'No jogo a reação sai sozinha, quando o golpe tira 10 ou mais de um aliado, ou o derruba.' }),
  auraOfTheGuardian: M('Aura of the Guardian', 'reacao', { nota: 'No jogo a reação sai sozinha, no aliado que cairia, quando o paladino aguenta o golpe.' }),
  protectiveSpirit: M('Protective Spirit', 'passiva'),
  emissaryOfRedemption: M('Emissary of Redemption', 'passiva'),
  // ---- Perseguidor Sombrio
  dreadAmbusher: M('Dread Ambusher', 'passiva'),
  umbralSight: M('Umbral Sight', 'passiva'),
  ironMind: M('Iron Mind', 'passiva'),
  stalkersFlurry: M("Stalker's Flurry", 'passiva'),
  shadowyDodge: M('Shadowy Dodge', 'reacao', { nota: 'No jogo a reação sai sozinha, no primeiro ataque sem vantagem contra ele na rodada.' }),
  // ---- Andarilho do Horizonte
  detectPortal: S('Detect Portal', 'acao', 'o jogo não tem portais planares'),
  planarWarrior: M('Planar Warrior', 'bonus'),
  etherealStep: M('Ethereal Step', 'bonus', { nota: 'Atravessar parede e objeto no Plano Etéreo não existe no jogo.' }),
  distantStrike: M('Distant Strike', 'livre', { nota: 'No jogo o teleporte é para a casa livre ao lado do alvo, a até 3 m de onde ele está.' }),
  spectralDefense: M('Spectral Defense', 'reacao', { nota: 'No jogo a reação sai sozinha, no golpe de 10 ou mais.' }),
  // ---- Matador de Monstros
  huntersSense: M("Hunter's Sense", 'acao'),
  slayersPrey: M("Slayer's Prey", 'bonus'),
  supernaturalDefense: M('Supernatural Defense', 'passiva', { nota: 'Vale nas resistências; o teste para escapar do agarrão não existe no jogo como teste à parte.' }),
  magicUsersNemesis: M("Magic-User's Nemesis", 'reacao', { nota: 'Vale contra magia; contra teleporte, não existe no jogo.' }),
  slayersCounter: M("Slayer's Counter", 'reacao'),
  // ---- Círculo dos Sonhos
  balmOfTheSummerCourt: M('Balm of the Summer Court', 'bonus'),
  hearthOfMoonlightAndShadow: S('Hearth of Moonlight and Shadow', 'fora', 'o jogo não tem acampamento montado no mapa'),
  hiddenPaths: M('Hidden Paths', 'bonus', { nota: 'No jogo vale o teleporte de si mesmo; levar outra criatura não existe.' }),
  walkerInDreams: S('Walker in Dreams', 'fora', 'o jogo não tem Sonho, Vidência nem Círculo de Teletransporte'),
  // ---- Círculo do Pastor
  speechOfTheWoods: S('Speech of the Woods', 'fora', 'o jogo não tem idiomas nem conversa com animais'),
  spiritTotem: M('Spirit Totem', 'bonus', { nota: 'No jogo o espírito nasce na casa do druida e não muda de lugar.' }),
  mightySummoner: M('Mighty Summoner', 'passiva'),
  guardianSpirit: M('Guardian Spirit', 'passiva'),
  faithfulSummons: M('Faithful Summons', 'passiva', { nota: 'No jogo vêm quatro javalis gigantes.' }),
  // ---- Alma Divina
  divineMagic: M('Divine Magic', 'passiva', { nota: 'A lista do clérigo vale do 2º nível em diante, ao subir de nível.' }),
  favoredByTheGods: M('Favored by the Gods', 'passiva', { nota: 'No jogo sai sozinho, quando os 2d4 podem virar o resultado.' }),
  empoweredHealing: M('Empowered Healing', 'passiva', { nota: 'No jogo sai sozinho, nos dados de cura que saíram baixos.' }),
  otherworldlyWings: M('Otherworldly Wings', 'bonus'),
  unearthlyRecovery: M('Unearthly Recovery', 'bonus'),
  // ---- Magia das Sombras
  eyesOfTheDark: M('Eyes of the Dark', 'passiva', { nota: 'Enxergar através da própria Escuridão não existe no jogo.' }),
  strengthOfTheGrave: M('Strength of the Grave', 'passiva'),
  houndOfIllOmen: M('Hound of Ill Omen', 'bonus', { nota: 'O cão é um lobo atroz que só vai atrás do alvo; atravessar criaturas e objetos não existe no jogo.' }),
  shadowWalk: M('Shadow Walk', 'bonus'),
  umbralForm: M('Umbral Form', 'bonus', { nota: 'Atravessar criaturas e objetos não existe no jogo.' }),
  // ---- Feitiçaria da Tempestade
  tempestuousMagic: M('Tempestuous Magic', 'bonus', { nota: 'No jogo é depois da magia: um salto de até 3 m pelo ar.' }),
  windSpeaker: S('Wind Speaker', 'fora', 'o jogo não tem idiomas'),
  heartOfTheStorm: M('Heart of the Storm', 'passiva', { nota: 'No jogo a descarga vai nos inimigos a até 3 m, em dano elétrico.' }),
  stormGuide: S('Storm Guide', 'acao', 'o jogo não tem chuva nem vento com direção'),
  stormsFury: M("Storm's Fury", 'reacao'),
  windSoul: M('Wind Soul', 'passiva', { nota: 'Dar voo aos aliados não existe no jogo.' }),
  // ---- O Celestial
  celestialCantrips: M('Bonus Cantrips', 'passiva', { nivel: 1 }),
  healingLight: M('Healing Light', 'bonus'),
  radiantSoul: M('Radiant Soul', 'passiva'),
  celestialResilience: M('Celestial Resilience', 'passiva', { nota: 'No jogo os PV temporários vão para o bruxo; os dos aliados não existem.' }),
  searingVengeance: M('Searing Vengeance', 'passiva'),
  // ---- O Lâmina Maldita
  hexWarrior: M('Hex Warrior', 'passiva', { nota: 'No jogo o Carisma vale na arma de uma mão que estiver na mão, se for maior.' }),
  hexbladesCurse: M("Hexblade's Curse", 'bonus', { nota: 'O dano a mais vale nos acertos de ataque.' }),
  accursedSpecter: M('Accursed Specter', 'passiva'),
  armorOfHexes: M('Armor of Hexes', 'reacao'),
  masterOfHexes: M('Master of Hexes', 'passiva', { nota: 'No jogo a maldição passa sozinha quando há outro inimigo perto e o bruxo não está abaixo da metade da vida.' }),
  // ---- Magia de Guerra
  arcaneDeflection: M('Arcane Deflection', 'reacao', { nota: 'No jogo sai sozinha, quando os +2 fazem o golpe errar ou os +4 fazem a resistência passar.' }),
  tacticalWit: M('Tactical Wit', 'passiva'),
  powerSurge: M('Power Surge', 'passiva', { nota: 'No jogo sai sozinho, no primeiro dano de magia do turno. Os surtos ganhos pela Contramágica e pelo Dissipar Magia não existem.' }),
  durableMagic: M('Durable Magic', 'passiva'),
  deflectingShroud: M('Deflecting Shroud', 'passiva'),
  // ---- Domínio da Forja
  forgeProficiency: M('Bonus Proficiency', 'passiva', { nota: 'As ferramentas de ferreiro não existem no jogo.' }),
  blessingOfTheForge: M('Blessing of the Forge', 'passiva', { nota: 'No jogo a bênção vai sempre na armadura ou na arma do próprio clérigo.' }),
  artisansBlessing: S("Channel Divinity: Artisan's Blessing", 'fora', 'o jogo não forja itens'),
  soulOfTheForge: M('Soul of the Forge', 'passiva'),
  divineStrikeFire: M('Divine Strike', 'passiva', { nivel: 8 }),
  saintOfForgeAndFire: M('Saint of Forge and Fire', 'passiva'),
  // ---- Domínio da Sepultura
  circleOfMortality: M('Circle of Mortality', 'passiva'),
  eyesOfTheGrave: S('Eyes of the Grave', 'acao', 'o jogo não tem sentido de mortos-vivos escondidos'),
  pathToTheGrave: M('Channel Divinity: Path to the Grave', 'acao'),
  sentinelAtDeathsDoor: M("Sentinel at Death's Door", 'reacao', { nota: 'No jogo a reação sai sozinha, no primeiro crítico que pode desfazer.' }),
  keeperOfSouls: M('Keeper of Souls', 'passiva', { nota: 'No jogo os PV vão para o aliado mais ferido.' }),
};
