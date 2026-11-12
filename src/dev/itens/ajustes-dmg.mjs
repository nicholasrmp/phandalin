// A REGRA DE CADA ITEM NOVO DO LIVRO DO MESTRE, escrita à mão e conferida contra o livro (o espelho do 5etools em
// `_referencias/5etools/itens/items.json`). O texto (nome e descrição em pt-br) vem de `itens/dmg-pt.json`; o que o jogo
// já tinha fica de fora por `itens/ja-temos.json`. `importar-itens.mjs dmg` junta tudo em `rules/items/livro-dmg.js`.
//
// Cada entrada é UMA destas:
//   { id, tipo, art?, passivo?, conjura?, recarregavel?, consumivel?..., noJogo }   o item entra no jogo
//   { fora: 'o motivo' }                                                            o item fica na fila (`dmg-pendente.json`)
// `noJogo` diz em uma frase o que o motor faz dele, e vai ao fim da descrição: a descrição é a do livro, e o jogador
// precisa saber o que dela vale aqui. `nome` troca o da tradução quando a família tem de sair com um nome só (o livro tem
// seis cintos de força de gigante, e a tradução deu "cinto" a uns e "cinturão" a outros). O nome oficial brasileiro não
// foi conferido contra o Livro do Mestre em português, que não está no disco. A raridade, a sintonia e o peso vêm do dado do livro.
//
// O formato de `passivo` está em `rules/itens-passivos.js`; o de `conjura` e `recarregavel`, em `rules/itens-que-conjuram.js`.

const CINTO = (gigante, forca) => ({
  nome: `Cinto de força do gigante ${gigante}`, tipo: 'maravilhoso', art: 'arcano', passivo: { atributos: { str: forca } },
  noJogo: `sintonizado, a Força vira ${forca}.`,
});
const VULNERAVEL = (resiste, vulneravel) => ({
  nome: `Armadura de vulnerabilidade (${resiste})`, tipo: 'armadura mágica', art: 'escudo', passivo: { resiste: [resiste], vulneravel },
  noJogo: `sintonizada, resistência a ${resiste} e vulnerabilidade a ${vulneravel.join(' e ')}. No livro a maldição fica mesmo sem a armadura; aqui, ela sai quando se desfaz a sintonia.`,
});

const ARMA = 'arma mágica do livro com poder que o motor ainda não faz (as runas da lâmina lunar, os relâmpagos e o gigante do martelo)';
// AS NOVE ESPADAS DA RESPOSTA: o mesmo revide, um nome e uma gema cada (o livro pede um alinhamento para a sintonia; o jogo não
// tem alinhamento, e qualquer um se sintoniza)
const RESPOSTA = (en, id, nome) => [`Sword of Answering (${en})`, {
  id, nome: `Espada da resposta (${nome})`, tipo: 'arma mágica', art: 'espada', base: 'espadaLonga', bonusAtaque: 3, bonusDano: 3, poder: 'resposta',
  noJogo: 'sintonizada e na mão, +3 de ataque e dano; quem a fere a até o alcance dela leva um golpe de reação, com vantagem, que passa por cima de resistência e imunidade. O alinhamento da sintonia não entra: o jogo não tem alinhamento.',
}];
const RESPOSTAS = Object.fromEntries([
  RESPOSTA('Answerer', 'espadaDaRespostaRespondedora', 'Respondedora'), RESPOSTA('Back Talker', 'espadaDaRespostaReplica', 'Réplica'),
  RESPOSTA('Concluder', 'espadaDaRespostaConclusora', 'Conclusora'), RESPOSTA('Last Quip', 'espadaDaRespostaUltimaTirada', 'Última Tirada'),
  RESPOSTA('Rebutter', 'espadaDaRespostaRefutadora', 'Refutadora'), RESPOSTA('Replier', 'espadaDaRespostaReplicante', 'Replicante'),
  RESPOSTA('Retorter', 'espadaDaRespostaRetrucadora', 'Retrucadora'), RESPOSTA('Scather', 'espadaDaRespostaDevastadora', 'Devastadora'),
  RESPOSTA('Squelcher', 'espadaDaRespostaSilenciadora', 'Silenciadora'),
]);
const ARTEFATO = 'artefato: fica de fora, como os outros oito do livro';
const CONVOCA = 'convoca criatura (sorteada ou elemental): o herói ainda não convoca por item';
const MONTARIA = 'é de montaria, e o jogo não tem montaria';
const NARRA = 'o efeito só se narra (viagem, vidência, recado, construção): não há o que fazer dele numa luta nem na exploração';
const PROTECAO = 'pergaminho de proteção: a barreira que um tipo de criatura não atravessa ainda não existe no motor';

export const AJUSTES = {
  // ------------------------------------------------------------------------------------------- entram ----
  'Belt of Hill Giant Strength': { id: 'cintoDoGiganteDaColina', ...CINTO('da colina', 21) },
  'Belt of Stone Giant Strength': { id: 'cintoDoGiganteDePedra', ...CINTO('de pedra', 23) },
  'Belt of Frost Giant Strength': { id: 'cintoDoGiganteDoGelo', ...CINTO('do gelo', 23) },
  'Belt of Fire Giant Strength': { id: 'cintoDoGiganteDoFogo', ...CINTO('do fogo', 25) },
  'Belt of Cloud Giant Strength': { id: 'cintoDoGiganteDasNuvens', ...CINTO('das nuvens', 27) },
  'Belt of Storm Giant Strength': { id: 'cintoDoGiganteDasTempestades', ...CINTO('das tempestades', 29) },
  'Belt of Dwarvenkind': {
    id: 'cinturaoDosAnoes', tipo: 'maravilhoso', art: 'arcano',
    passivo: { somaAtributo: { con: 2 }, resiste: ['veneno'], vantagemContraVeneno: true, visao: 60 },
    nome: 'Cinto dos anões',
    noJogo: 'sintonizado, +2 de Constituição (até 20), resistência e vantagem contra veneno e visão no escuro de 18 m; a vantagem na Persuasão com anões, não.',
  },
  'Mantle of Spell Resistance': {
    id: 'mantoDeResistenciaAMagia', tipo: 'maravilhoso', art: 'arcano', passivo: { vantagemContraMagia: true },
    noJogo: 'sintonizado, vantagem em toda resistência contra magia.',
  },
  'Boots of the Winterlands': {
    id: 'botasDasTerrasInvernais', tipo: 'maravilhoso', art: 'arcano', passivo: { resiste: ['frio'] },
    noJogo: 'sintonizadas, resistência a frio; o terreno de gelo e neve ainda não existe no jogo.',
  },
  'Cap of Water Breathing': {
    id: 'capuzDaRespiracaoAquatica', tipo: 'maravilhoso', art: 'arcano', passivo: { respiraNaAgua: true },
    nome: 'Capuz de respiração aquática',
    noJogo: 'quem o leva respira debaixo da água; a bolha se forma sozinha, sem gastar a ação.',
  },
  'Cloak of Arachnida': {
    id: 'mantoDaAracnidea', tipo: 'maravilhoso', art: 'arcano', passivo: { resiste: ['veneno'] },
    conjura: { cargas: 1, recarga: null, cd: 13, magias: { teia: { custo: 1 } } },
    nome: 'Manto do aracnídeo',
    noJogo: 'sintonizado, resistência a veneno e a Teia uma vez por dia, CD 13, na área normal; a escalada e a imunidade às teias ainda não.',
  },
  'Circlet of Blasting': {
    id: 'diademaDaExplosao', tipo: 'maravilhoso', art: 'arcano',
    conjura: { cargas: 1, recarga: null, ataque: 5, magias: { raioArdente: { custo: 1 } } },
    noJogo: 'conjura o Raio Ardente uma vez por dia, com +5 de ataque, mesmo na mão de quem não é conjurador.',
  },
  'Ring of Fire Elemental Command': {
    id: 'anelDeComandoDoFogo', tipo: 'anel', art: 'arcano', passivo: { resiste: ['fogo'] },
    nome: 'Anel de comando dos elementais do fogo',
    noJogo: 'sintonizado, resistência a fogo; o domínio sobre os elementais e as magias que vêm depois de matar um ainda não.',
  },
  'Ring of Evasion': {
    id: 'anelDeEvasao', tipo: 'anel', art: 'arcano', recarregavel: { cargas: 3, recarga: '1d3' }, passivo: { evasao: true },
    noJogo: 'sintonizado, quando você falha num teste de resistência de Destreza, o anel gasta a reação e uma carga e o transforma em sucesso, sem perguntar.',
  },
  'Armor of Vulnerability (Bludgeoning)': { id: 'armaduraDaVulnerabilidadeConcussao', ...VULNERAVEL('concussão', ['cortante', 'perfurante']) },
  'Armor of Vulnerability (Slashing)': { id: 'armaduraDaVulnerabilidadeCortante', ...VULNERAVEL('cortante', ['concussão', 'perfurante']) },
  'Armor of Vulnerability (Piercing)': { id: 'armaduraDaVulnerabilidadePerfurante', ...VULNERAVEL('perfurante', ['concussão', 'cortante']) },
  'Potion of Flying': {
    id: 'pocaoDeVoo', tipo: 'poção', art: 'cura', pilha: true, consumivel: 'condicao', condicao: 'voando', rodadas: 600, acao: 'acao',
    noJogo: 'beber gasta uma ação, e o voo dura uma hora (600 rodadas).',
  },
  'Elixir of Health': {
    id: 'elixirDaSaude', tipo: 'poção', art: 'cura', pilha: true, consumivel: 'limpar', remove: ['cego', 'surdo', 'paralisado', 'envenenado'], curaDoenca: true, acao: 'acao',
    noJogo: 'beber gasta uma ação, e tira as condições cego, surdo, paralisado e envenenado, e qualquer doença.',
  },

  // ------------------------------------------- as armas e armaduras com nome (2026-11-12, `combat.js poderDaArma`) ----
  // Estavam de fora porque a arma do catálogo de itens não se equipava; hoje ela se equipa pela `base` (`items/index.js`).
  ...RESPOSTAS,
  'Vicious Weapon': {
    id: 'espadaCruel', nome: 'Espada longa cruel', tipo: 'arma mágica', art: 'espada', base: 'espadaLonga', poder: 'cruel',
    noJogo: 'o livro diz "qualquer arma", e aqui é uma espada longa; no 20 natural, +7 de dano do tipo dela.',
  },
  'Scimitar of Speed': {
    id: 'cimitarraDaVelocidade', tipo: 'arma mágica', art: 'espada', base: 'cimitarra', bonusAtaque: 2, bonusDano: 2, poder: 'velocidade',
    noJogo: 'sintonizada e na mão, +2 de ataque e dano e um golpe a mais com ela como ação bônus em cada turno (no menu do alvo).',
  },
  'Sword of Vengeance': {
    id: 'espadaDaVinganca', tipo: 'arma mágica', art: 'espada', base: 'espadaLonga', bonusAtaque: 1, bonusDano: 1, poder: 'vinganca',
    noJogo: 'sintonizada, +1 de ataque e dano; desvantagem nos ataques com outra arma; e a cada dano sofrido numa luta, Sabedoria CD 15 ou desvantagem contra quem não seja quem feriu, por 1 minuto. Desfazer a maldição pede magia que o jogo não tem.',
  },
  'Blackrazor': {
    id: 'blackrazor', tipo: 'arma mágica', art: 'espada', base: 'espadaGrande', bonusAtaque: 3, bonusDano: 3, poder: 'devoraAlma',
    passivo: { imuneCondicao: ['enfeiticado', 'amedrontado'] },
    noJogo: 'sintonizada, +3 de ataque e dano; quem ela derruba a 0 PV (fora constructo e morto-vivo) morre, e o dono ganha PV temporários iguais ao máximo dele e, enquanto eles durarem, vantagem nos ataques, testes e resistências; acertar morto-vivo fere o dono em 1d10 necrótico e cura o morto-vivo em 1d10; não se fica enfeitiçado nem amedrontado. A Velocidade que ela conjura sozinha e a consciência da espada não entram.',
  },
  'Wave': {
    id: 'onda', tipo: 'arma mágica', art: 'lanca', base: 'tridente', bonusAtaque: 3, bonusDano: 3, poder: 'onda',
    passivo: { respiraNaAgua: true },
    noJogo: 'sintonizado, +3 de ataque e dano; no crítico, o alvo sofre necrótico a mais igual à metade dos PV máximos dele; respira debaixo da água. O comando de peixes, o aviso, o cubo de força e a consciência do tridente não entram.',
  },
  'Whelm': {
    id: 'whelm', tipo: 'arma mágica', art: 'martelo', base: 'marteloDeGuerra', bonusAtaque: 3, bonusDano: 3, poder: 'whelm',
    propsExtra: ['arremesso'], alcance: [20, 60],
    noJogo: 'sintonizado, +3 de ataque e dano; arremessa a 6/18 m e volta à mão, e o golpe arremessado soma 1d8 de concussão (2d8 contra gigante). A onda de choque, o medo do céu aberto e a consciência do martelo não entram.',
  },
  'Efreeti Chain': {
    id: 'cotaDeMalhaEfreeti', tipo: 'armadura mágica', art: 'escudo', base: 'cotaDeMalha', acBonusArmadura: 3, passivo: { imune: ['fogo'] },
    nome: 'Cota de malha efreeti',
    noJogo: 'vestida e sintonizada, +3 na CA e imunidade a fogo; o andar sobre lava e o primordial não entram.',
  },
  "Mariner's Armor": {
    id: 'armaduraDoMarinheiro', tipo: 'armadura mágica', art: 'escudo', base: 'couroBatido', passivo: { nado: true },
    nome: 'Couro batido do marinheiro',
    noJogo: 'o livro diz "qualquer armadura", e aqui é couro batido; vestida, nada com o mesmo deslocamento de andar. A subida de 18 m de quem cai a 0 PV debaixo da água não entra.',
  },

  // ------------------------------------------------------------------------------------- ficam de fora ----
  'Moonblade': { fora: ARMA }, 'Hammer of Thunderbolts': { fora: ARMA },
  'Sword of Kas': { fora: ARTEFATO }, 'Book of Exalted Deeds': { fora: ARTEFATO }, 'Book of Vile Darkness': { fora: ARTEFATO },
  'Axe of the Dwarvish Lords': { fora: ARTEFATO }, 'Hand of Vecna': { fora: ARTEFATO }, 'Eye of Vecna': { fora: ARTEFATO },
  'Wand of Orcus': { fora: ARTEFATO }, 'Orb of Dragonkind': { fora: ARTEFATO },
  'Scroll of Protection from Aberrations': { fora: PROTECAO }, 'Scroll of Protection from Beasts': { fora: PROTECAO },
  'Scroll of Protection from Celestials': { fora: PROTECAO }, 'Scroll of Protection from Elementals': { fora: PROTECAO },
  'Scroll of Protection from Fey': { fora: PROTECAO }, 'Scroll of Protection from Fiends': { fora: PROTECAO },
  'Scroll of Protection from Plants': { fora: PROTECAO }, 'Scroll of Protection from Undead': { fora: PROTECAO },
  'Bag of Tricks, Rust': { fora: CONVOCA }, 'Bag of Tricks, Tan': { fora: CONVOCA }, 'Bag of Tricks, Gray': { fora: CONVOCA },
  'Bowl of Commanding Water Elementals': { fora: CONVOCA }, 'Censer of Controlling Air Elementals': { fora: CONVOCA },
  'Brazier of Commanding Fire Elementals': { fora: CONVOCA }, 'Efreeti Bottle': { fora: CONVOCA }, 'Ring of Djinni Summoning': { fora: CONVOCA },
  'Candle of Invocation': { fora: CONVOCA }, 'Iron Flask': { fora: 'prende uma criatura de outro plano num frasco: o motor não guarda criatura em item' },
  'Horseshoes of Speed': { fora: MONTARIA }, 'Horseshoes of a Zephyr': { fora: MONTARIA }, 'Saddle of the Cavalier': { fora: MONTARIA },
  'Crystal Ball': { fora: NARRA }, 'Crystal Ball of True Seeing': { fora: NARRA }, 'Crystal Ball of Telepathy': { fora: NARRA },
  'Crystal Ball of Mind Reading': { fora: NARRA }, 'Amulet of the Planes': { fora: NARRA }, 'Cubic Gate': { fora: NARRA },
  'Sending Stones': { fora: NARRA }, 'Folding Boat': { fora: NARRA }, "Daern's Instant Fortress": { fora: NARRA },
  "Nolzur's Marvelous Pigments": { fora: NARRA }, 'Apparatus of Kwalish': { fora: NARRA }, 'Tome of the Stilled Tongue': { fora: NARRA },
  'Helm of Teleportation': { fora: 'o Teletransporte não existe como magia no jogo' },
  'Ring of Air Elemental Command': { fora: 'o que vale antes de matar um elemental (cair devagar, falar auran) não tem efeito na luta, e as magias vêm só depois' },
  'Ring of Earth Elemental Command': { fora: 'o que vale antes de matar um elemental (o terreno de pedra, falar terran) não tem efeito na luta, e as magias vêm só depois' },
  'Ring of Water Elemental Command': { fora: 'andar sobre a água e falar aquan, antes de matar um elemental; as magias vêm só depois' },
  'Ring of Animal Influence': { fora: 'o Medo do anel só pega fera de Inteligência 3 ou menos, e a magia do jogo não tem esse filtro' },
  'Cloak of Invisibility': { fora: 'a invisibilidade de duas horas que se gasta por minuto e se liga com uma ação ainda não tem interruptor' },
  'Cube of Force': { fora: 'as seis faces e as cargas gastas pelo que atravessa a barreira não existem no motor' },
  'Tentacle Rod': { fora: 'os três tentáculos que atacam com a ação e prendem pedem um ataque de item que o herói ainda não tem' },
  'Staff of the Adder': { fora: 'o cajado que vira cobra e morde pede um ataque de item que o herói ainda não tem' },
  'Talisman of the Sphere': { fora: 'controla a Esfera da Aniquilação, que fica de fora' },
  'Sphere of Annihilation': { fora: 'a esfera que se move pela vontade e apaga o que toca não existe no motor' },
  'Bag of Devouring': { fora: 'a bolsa que engole o que se põe nela não tem efeito numa luta' },
  'Bead of Force': { fora: 'a esfera de força que prende quem a conta pega não existe no motor' },
  'Chime of Opening': { fora: 'abrir fechadura de longe: o menu de porta (`portas.js`) ainda não tem a magia de abrir' },
  'Eversmoking Bottle': { fora: 'a fumaça que cresce por minuto e esconde uma área grande pede uma zona que não para de crescer' },
  'Driftglobe': { fora: 'a luz que segue o dono: a luz que anda com o herói é a tocha, e o globo não tem a peça' },
  'Bag of Beans': { fora: 'o feijão plantado dá um efeito sorteado numa tabela que se narra' },
  'Deck of Many Things': { fora: 'o baralho é uma tabela de destinos que se narra' },
};
