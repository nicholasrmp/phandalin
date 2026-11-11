// A Glória dos Gigantes de Bigby (2022): o bárbaro do Caminho do Gigante, em texto nosso — ver NOTICE.md. O mesmo contrato de
// `subclasses-xge.js`; o texto sai de `src/dev/subclasses/bgg-pt.json` por `src/dev/importar-subclasses.mjs bgg`, e o que
// faz na luta mora em `rules/subclasses-livros.js`.

export const SUBCLASSES_BGG = {
  barbaro: {
    caminhoDoGigante: {
      chave: 'Barbarian|Path of the Giant',
      fonte: 'bgg',
      niveis: { 3: ['giantPower', 'giantsHavoc'], 6: ['elementalCleaver'], 10: ['mightyImpel'], 14: ['demiurgicColossus'] },
      // PODER DO GIGANTE: Taumaturgia ou Druidismo (a Taumaturgia, no jogo)
      escalas: { dadoDoCutelo: (n) => (n >= 14 ? '2d6' : '1d6'), alcanceDoGigante: (n) => (n >= 14 ? 10 : 5) },
    },
  },
};

const M = (en, tipo, extra = {}) => ({ en, tipo, motor: true, ...extra });

export const RECURSOS_BGG = {
  giantPower: M('Giant Power', 'passiva', { nota: 'No jogo o truque é a Taumaturgia; o idioma não existe no jogo.' }),
  giantsHavoc: M("Giant's Havoc", 'passiva', { nota: 'Virar Grande não existe no jogo: vale o alcance a mais. A arma arremessada é a do Cutelo Elemental.' }),
  elementalCleaver: M('Elemental Cleaver', 'passiva', { nota: 'O tipo se escolhe por um interruptor; a arma arremessada aparece na lista de armas enquanto a Fúria dura, e volta à mão.' }),
  mightyImpel: M('Mighty Impel', 'bonus', { nota: 'No jogo o inimigo é arremessado para longe de você, até 9 m, e o aliado não se arremessa.' }),
  demiurgicColossus: M('Demiurgic Colossus', 'passiva', { nota: 'Virar Grande ou Enorme não existe no jogo: valem o alcance, o arremesso de Grande e o 2d6.' }),
};
