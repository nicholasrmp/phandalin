// O Tesouro dos Dragões de Fizban (2021): o monge do Dragão Ascendente e o patrulheiro Guardião do Draco, em texto nosso —
// ver NOTICE.md. O mesmo contrato de `subclasses-xge.js`; o texto sai de `src/dev/subclasses/ftd-pt.json` por
// `src/dev/importar-subclasses.mjs ftd`, e o que fazem na luta mora em `rules/subclasses-livros.js`. O draco é o bloco do
// livro (`monsters/espiritos-tce.js dracoCompanheiro`), que a proficiência e o nível do patrulheiro ajustam.

const pb = (n) => Math.ceil(1 + n / 4);

export const SUBCLASSES_FTD = {
  monge: {
    dragaoAscendente: {
      chave: 'Monk|Way of the Ascendant Dragon',
      fonte: 'ftd',
      niveis: { 3: ['breathOfTheDragon', 'draconicDisciple'], 6: ['wingsUnfurled'], 11: ['aspectOfTheWyrm'], 17: ['ascendantAspect'] },
      recursos: {
        breathOfTheDragon: (n) => pb(n), wingsUnfurled: (n) => (n >= 6 ? pb(n) : 0), aspectOfTheWyrm: (n) => (n >= 11 ? 1 : 0),
      },
      escalas: { dadosDoSoproDoMonge: (n) => (n >= 17 ? 4 : n >= 11 ? 3 : 2) },
    },
  },
  patrulheiro: {
    guardiaoDoDraco: {
      chave: 'Ranger|Drakewarden',
      fonte: 'ftd',
      niveis: { 3: ['draconicGift', 'drakeCompanion'], 7: ['bondOfFangAndScale'], 11: ['drakesBreath'], 15: ['perfectedBond'] },
      recursos: { drakeCompanion: () => 1, drakesBreath: (n) => (n >= 11 ? 1 : 0), perfectedBond: (n) => (n >= 15 ? pb(n) : 0) },
      escalas: { dadosDoSoproDoDraco: (n) => (n >= 15 ? '10d6' : '8d6') },
    },
  },
};

const M = (en, tipo, extra = {}) => ({ en, tipo, motor: true, ...extra });

export const RECURSOS_FTD = {
  // ---- Caminho do Dragão Ascendente
  breathOfTheDragon: M('Breath of the Dragon', 'acao', { nota: 'O sopro sai pelo botão de magia (cone ou linha), no lugar de um golpe da ação de Atacar; o tipo é o do interruptor do dragão.' }),
  draconicDisciple: M('Draconic Disciple', 'passiva', { nota: 'No jogo vale o tipo do golpe desarmado, pelo interruptor do dragão; rolar de novo a Intimidação ou a Persuasão e o idioma não existem no jogo.' }),
  wingsUnfurled: M('Wings Unfurled', 'passiva', { nota: 'No jogo as asas abrem sozinhas no Passo do Vento, enquanto há uso.' }),
  aspectOfTheWyrm: M('Aspect of the Wyrm', 'bonus', { nota: 'O medo sai no inimigo mais perto ao ativar e, depois, pelo menu do inimigo; a resistência é do tipo do interruptor do dragão.' }),
  ascendantAspect: M('Ascendant Aspect', 'passiva', { nota: 'O sopro aumentado é a forma maior no botão de magia. A fúria explosiva sai sozinha ao ativar o Aspecto da Serpe, em todos os inimigos da aura.' }),
  // ---- Guardião do Draco
  draconicGift: M('Draconic Gift', 'passiva', { nota: 'O idioma não existe no jogo.' }),
  drakeCompanion: M('Drake Companion', 'acao', { nota: 'O draco só age com a ordem do patrulheiro, pela ação bônus; senão, esquiva. Fica até cair ou ser chamado de novo, e entra nas lutas seguintes com os PV que tinha; o descanso longo o cura.' }),
  bondOfFangAndScale: M('Bond of Fang and Scale', 'passiva', { nota: 'Montar no draco não existe no jogo.' }),
  drakesBreath: M("Drake's Breath", 'acao', { nota: 'Sai de você, pelo botão de magia; gastar um espaço de 3º círculo para repetir não existe no jogo.' }),
  perfectedBond: M('Perfected Bond', 'reacao', { nota: 'No jogo a reação sai sozinha, no dano de 8 ou mais.' }),
};
