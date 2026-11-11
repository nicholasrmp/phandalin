// Guia do Aventureiro da Costa da Espada (2015): as subclasses que o jogo joga, em texto nosso — ver NOTICE.md.
//
// O mesmo contrato de `subclasses-xge.js`: a subclasse no formato das feitas à mão, com `chave` ("Classe|Subclasse", em
// inglês) ligando ao texto traduzido (`src/dev/subclasses/scag-pt.json`), e RECURSOS_SCAG dizendo, por id, de onde vem o
// texto, quando se usa e em que pé está no motor. O nome e a regra saem de `src/dev/importar-subclasses.mjs scag`. O que
// os recursos fazem numa luta mora em `rules/subclasses-livros.js`. O Espadachim, o Mentor e a Lâmina Cantante, que o
// Guia também traz, entram pelas versões revistas do Xanathar e do Tasha.


export const SUBCLASSES_SCAG = {
  barbaro: {
    furiaDeBatalha: {
      chave: 'Barbarian|Path of the Battlerager',
      fonte: 'scag',
      niveis: { 3: ['battleragerArmor', 'battleragerRestriction'], 6: ['recklessAbandon'], 10: ['battleragerCharge'], 14: ['spikedRetribution'] },
    },
  },
  clerigo: {
    dominioArcano: {
      chave: 'Cleric|Arcana Domain',
      fonte: 'scag',
      niveis: { 1: ['arcaneInitiate'], 2: ['arcaneAbjuration'], 6: ['spellBreaker'], 8: ['potentSpellcasting'], 17: ['arcaneMastery'] },
      periciasDeCaracteristica: { arcaneInitiate: ['arcanismo'] },
      // INICIADO ARCANO: dois truques do mago, que contam como de clérigo (`passivas.js`)
      escolhasDeGanho: {
        arcaneInitiate: {
          campo: 'truquesArcanos', lista: true, quantas: 2,
          opcoes: ['raioDeFogo', 'raioDeGelo', 'toqueChocante', 'respingoAcido', 'toqueArrepiante', 'borrifoVenenoso', 'protecaoContraLaminas', 'maoMagica',
            'luzesDancantes', 'luz', 'ilusaoMenor', 'mensagem', 'prestidigitacao', 'consertar', 'amizade', 'queimaduraDeGelo', 'lascaMental', 'trovao',
            'laminaTrovejante', 'laminaDeChamaEsverdeada', 'atracaoEletrica', 'criarFogueira', 'dobreFunebre', 'infestacao', 'explosaoDeLaminas'],
        },
      },
      // MAESTRIA ARCANA (17º): uma magia do mago de cada círculo, do 6º ao 9º; no jogo, as quatro já vêm escolhidas
      magiasDoDominio: {
        1: ['detectarMagia', 'misselMagico'], 3: ['armaMagica'], 5: ['dissiparMagia', 'circuloMagico'], 7: ['olhoArcano'],
        17: ['desintegrar', 'dedoDaMorte', 'palavraDePoderAtordoar', 'chuvaDeMeteoros'],
      },
    },
  },
  guerreiro: {
    cavaleiroDragaoPurpura: {
      chave: 'Fighter|Purple Dragon Knight (Banneret)',
      fonte: 'scag',
      niveis: { 3: ['rallyingCry', 'knighthoodRestriction'], 7: ['royalEnvoy'], 10: ['inspiringSurge'], 15: ['bulwarkPdk'] },
      // ENVIADO REAL: a Persuasão treinada, e dobrada
      periciasDeCaracteristica: { royalEnvoy: ['persuasao'] },
      especializacaoDeCaracteristica: { royalEnvoy: ['persuasao'] },
      escalas: { aliadosDoSurto: (n) => (n >= 18 ? 2 : 1) },
    },
  },
  monge: {
    longaMorte: {
      chave: 'Monk|Way of the Long Death',
      fonte: 'scag',
      niveis: { 3: ['touchOfDeath'], 6: ['hourOfReaping'], 11: ['masteryOfDeath'], 17: ['touchOfTheLongDeath'] },
    },
  },
  paladino: {
    juramentoDaCoroa: {
      chave: 'Paladin|Oath of the Crown',
      fonte: 'scag',
      niveis: { 3: ['channelDivinity', 'championChallenge', 'turnTheTide'], 7: ['divineAllegiance'], 15: ['unyieldingSpirit'], 20: ['exaltedChampion'] },
      recursos: { exaltedChampion: (n) => (n >= 20 ? 1 : 0) },
      magiasDoDominio: {
        3: ['comando', 'dueloCompelido'], 5: ['eloDeProtecao', 'armaEspiritual'], 9: ['mantoDoCruzado', 'espiritosGuardioes'],
        13: ['liberdadeDeMovimento', 'guardiaoDaFe'], 17: ['circuloDePoder', 'missao'],
      },
    },
  },
  bruxo: {
    imortal: {
      chave: 'Warlock|The Undying',
      fonte: 'scag',
      niveis: { 1: ['amongTheDead'], 6: ['defyDeath'], 10: ['undyingNature'], 14: ['indestructibleLife'] },
      recursos: { defyDeath: (n) => (n >= 6 ? 1 : 0), indestructibleLife: (n) => (n >= 14 ? 1 : 0) },
      voltamNoCurto: ['indestructibleLife'],
    },
  },
};

const M = (en, tipo, extra = {}) => ({ en, tipo, motor: true, ...extra });
const S = (en, tipo, semEfeito, extra = {}) => ({ en, tipo, semEfeito, ...extra });

export const RECURSOS_SCAG = {
  // ---- Caminho do Furioso de Batalha
  battleragerArmor: M('Battlerager Armor', 'bonus', { nota: 'A armadura de espinhos está na loja e no catálogo; o golpe dos espinhos sai pelo menu do inimigo.' }),
  battleragerRestriction: S('Restriction—Dwarves Only', 'fora', 'o livro deixa o mestre tirar a restrição, e o jogo a tira'),
  recklessAbandon: M('Reckless Abandon', 'passiva'),
  battleragerCharge: M('Battlerager Charge', 'bonus'),
  spikedRetribution: M('Spiked Retribution', 'passiva'),
  // ---- Domínio do Arcano
  arcaneInitiate: M('Arcane Initiate', 'passiva'),
  arcaneAbjuration: M('Channel Divinity: Arcane Abjuration', 'acao', { nota: 'No jogo vale a criatura de outro plano mais perto.' }),
  spellBreaker: M('Spell Breaker', 'passiva', { nota: 'No jogo sai sozinho: acaba a magia mais alta que o espaço alcança, das que os inimigos puseram no curado.' }),
  arcaneMastery: M('Arcane Mastery', 'passiva', { nota: 'No jogo as quatro são a Desintegração, o Dedo da Morte, a Palavra de Poder: Atordoar e a Chuva de Meteoros.' }),
  // ---- Cavaleiro do Dragão Púrpura
  rallyingCry: M('Rallying Cry', 'passiva', { nota: 'No jogo vão os três aliados mais feridos a 18 m.' }),
  knighthoodRestriction: S('Restriction: Knighthood', 'fora', 'é só o nome da ordem'),
  royalEnvoy: M('Royal Envoy', 'passiva'),
  inspiringSurge: M('Inspiring Surge', 'passiva', { nota: 'No jogo ataca o aliado a 18 m que tem um inimigo ao alcance.' }),
  bulwarkPdk: M('Bulwark', 'passiva', { nota: 'No jogo rola de novo o aliado que falhou contra o mesmo efeito depois de você, no mesmo turno.' }),
  // ---- Caminho da Longa Morte
  touchOfDeath: M('Touch of Death', 'passiva'),
  hourOfReaping: M('Hour of Reaping', 'acao'),
  masteryOfDeath: M('Mastery of Death', 'passiva'),
  touchOfTheLongDeath: M('Touch of the Long Death', 'acao', { nota: 'O ki se escolhe no menu do inimigo.' }),
  // ---- Juramento da Coroa
  championChallenge: M('Champion Challenge', 'bonus', { nota: 'Quem falha não consegue andar para mais de 9 m do paladino.' }),
  turnTheTide: M('Turn the Tide', 'bonus'),
  divineAllegiance: M('Divine Allegiance', 'reacao', { nota: 'No jogo a reação sai sozinha, no golpe que derrubaria o aliado colado, se o paladino aguenta.' }),
  unyieldingSpirit: M('Unyielding Spirit', 'passiva'),
  exaltedChampion: M('Exalted Champion', 'acao'),
  // ---- O Imortal
  amongTheDead: M('Among the Dead', 'passiva', { nota: 'A vantagem contra doença não existe no jogo (não há doença).' }),
  defyDeath: M('Defy Death', 'passiva'),
  undyingNature: M('Undying Nature', 'passiva', { nota: 'No jogo vale o fôlego sem fim debaixo da água; comida, sono e idade não existem na luta.' }),
  indestructibleLife: M('Indestructible Life', 'bonus'),
};
