// Livro do Mestre (2014): as duas subclasses de vilão que o livro dá (o Domínio da Morte e o Quebrador de Juramento), em texto
// nosso — ver NOTICE.md. O mesmo contrato de `subclasses-xge.js`; o texto sai de `src/dev/subclasses/dmg-pt.json` por
// `src/dev/importar-subclasses.mjs dmg`, e o que fazem na luta mora em `rules/subclasses-livros.js`.

export const SUBCLASSES_DMG = {
  clerigo: {
    dominioDaMorte: {
      chave: 'Cleric|Death Domain',
      fonte: 'dmg',
      armas: ['marcial'],
      niveis: { 1: ['deathProficiency', 'reaper'], 2: ['touchOfDeathCleric'], 6: ['inescapableDestruction'], 8: ['divineStrikeNecrotic'], 17: ['improvedReaper'] },
      // CEIFADOR: um truque de necromancia, de qualquer lista
      escolhasDeGanho: { reaper: { campo: 'truqueDoCeifador', opcoes: ['dobreFunebre', 'toqueArrepiante', 'pouparOsMoribundos'] } },
      escalas: { danoDoGolpeDivino: (n) => (n >= 14 ? '2d8' : n >= 8 ? '1d8' : null) },
      magiasDoDominio: {
        1: ['vidaFalsa', 'raioDeDoenca'], 3: ['cegueiraSurdez', 'raioDoEnfraquecimento'], 5: ['animarMortos', 'toqueVampirico'],
        7: ['praga', 'protecaoContraAMorte'], 9: ['conchaAntivida', 'nuvemMortal'],
      },
    },
  },
  paladino: {
    quebraJuramento: {
      chave: 'Paladin|Oathbreaker',
      fonte: 'dmg',
      niveis: { 3: ['channelDivinity', 'controlUndead', 'dreadfulAspect'], 7: ['auraOfHate'], 15: ['supernaturalResistance'], 20: ['dreadLord'] },
      recursos: { dreadLord: (n) => (n >= 20 ? 1 : 0) },
      escalas: { raioDaAuraDeOdio: (n) => (n >= 18 ? 30 : 10) },
      magiasDoDominio: {
        3: ['repreensaoInfernal', 'infligirFerimentos'], 5: ['coroaDaLoucura', 'escuridao'], 9: ['animarMortos', 'rogarMaldicao'],
        13: ['praga', 'confusao'], 17: ['contagio', 'dominarPessoa'],
      },
    },
  },
};

const M = (en, tipo, extra = {}) => ({ en, tipo, motor: true, ...extra });

export const RECURSOS_DMG = {
  // ---- Domínio da Morte
  deathProficiency: M('Bonus Proficiency', 'passiva', { nivel: 1 }),
  reaper: M('Reaper', 'passiva', { nota: 'No jogo o segundo alvo é o inimigo mais perto do primeiro, a 1,5 m dele.' }),
  touchOfDeathCleric: M('Channel Divinity: Touch of Death', 'livre', { nota: 'No jogo é um interruptor: ligado, o próximo acerto corpo a corpo gasta o Canalizar Divindade.' }),
  inescapableDestruction: M('Inescapable Destruction', 'passiva'),
  divineStrikeNecrotic: M('Divine Strike', 'passiva', { nivel: 8 }),
  improvedReaper: M('Improved Reaper', 'passiva', { nota: 'No jogo o segundo alvo é o inimigo mais perto do primeiro, a 1,5 m dele, sem outro espaço.' }),
  // ---- Quebrador de Juramento
  controlUndead: M('Control Undead', 'acao', { nota: 'O morto-vivo controlado luta do lado do paladino até o fim da luta.' }),
  dreadfulAspect: M('Dreadful Aspect', 'acao'),
  auraOfHate: M('Aura of Hate', 'passiva'),
  supernaturalResistance: M('Supernatural Resistance', 'passiva'),
  dreadLord: M('Dread Lord', 'acao', { nota: 'A luz forte que vira penumbra não muda a luz do mapa. O golpe das sombras é magia concedida, pela ação bônus.' }),
};
