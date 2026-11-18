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

// os ANÉIS DE COMANDO: os elementais do plano de cada um, contra os quais o anel dá vantagem (e eles têm desvantagem)
const FLAGELO = {
  ar: ['elementalDoAr', 'djinni', 'perseguidorInvisivel'], terra: ['elementalDaTerra', 'dao', 'xorn'],
  fogo: ['elementalDoFogo', 'efreeti', 'salamandra'], agua: ['elementalDaAgua', 'marid'],
};
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
// OS PERGAMINHOS DE PROTEÇÃO: a barreira do Círculo Mágico contra o tipo, em volta de quem leu, por 5 minutos (`livro-motor.js
// lerPergaminhoDeProtecao`)
const PERGAMINHO = (en, id, tipo, nome) => [`Scroll of Protection from ${en}`, {
  id, tipo: 'pergaminho', art: 'arcano', pilha: true, consumivel: 'pergaminhoDeProtecao', tipoBarrado: tipo, acao: 'acao',
  noJogo: `ler gasta a ação: por 5 minutos, um cilindro de 1,5 m em volta de quem leu, que anda com ele, onde ${nome} não entra nem ataca ou mira quem está dentro. Se o leitor andar até pôr um deles dentro, a barreira acaba; e cada um pode gastar a ação num Carisma CD 15 para passar a atravessá-la.`,
}];
const PERGAMINHOS = Object.fromEntries([
  PERGAMINHO('Aberrations', 'pergaminhoDeProtecaoContraAberracoes', 'aberração', 'aberração'),
  PERGAMINHO('Beasts', 'pergaminhoDeProtecaoContraFeras', 'fera', 'fera'),
  PERGAMINHO('Celestials', 'pergaminhoDeProtecaoContraCelestiais', 'celestial', 'celestial'),
  PERGAMINHO('Elementals', 'pergaminhoDeProtecaoContraElementais', 'elemental', 'elemental'),
  PERGAMINHO('Fey', 'pergaminhoDeProtecaoContraFadas', 'feérico', 'fada'),
  PERGAMINHO('Fiends', 'pergaminhoDeProtecaoContraCorruptores', 'corruptor', 'corruptor'),
  PERGAMINHO('Plants', 'pergaminhoDeProtecaoContraPlantas', 'planta', 'planta'),
  PERGAMINHO('Undead', 'pergaminhoDeProtecaoContraMortosVivos', 'morto-vivo', 'morto-vivo'),
]);
// AS BOLSAS DE TRUQUES e OS VASOS DE ELEMENTAL: conjuram as magias internas de `rules/magias-de-itens.js`
const BOLSA = (magia, cor) => ({
  id: magia, tipo: 'maravilhoso', art: 'arcano', conjura: { cargas: 3, recarga: null, magias: { [magia]: { custo: 1 } } },
  noJogo: `com a ação, três vezes por dia: a bolinha jogada a até 6 m vira a fera do d8 da bolsa ${cor}, que luta do seu lado (age sozinha ou com as suas ordens, como as outras invocações) e some no fim da luta.`,
});
const VASO = (id, magia, elemental, falta) => ({
  id, tipo: 'maravilhoso', art: 'arcano', conjura: { cargas: 1, recarga: null, magias: { [magia]: { custo: 1 } } },
  noJogo: `com a ação, uma vez por dia: um elemental ${elemental} obedece enquanto durar a concentração (até 1 hora); se ela cair antes, ele fica, hostil a todos. ${falta.charAt(0).toUpperCase() + falta.slice(1)} não entra.`,
});

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
    id: 'anelDeComandoDoFogo', tipo: 'anel', art: 'arcano', passivo: { resiste: ['fogo'], flagelo: FLAGELO.fogo },
    nome: 'Anel de comando dos elementais do fogo',
    noJogo: 'sintonizado, resistência a fogo, e vantagem contra os elementais do fogo (o elemental do fogo, o efreeti, a salamandra), que atacam você com desvantagem. Falar ignan e as magias que vêm depois de matar um não entram.',
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
  'Moonblade': {
    id: 'laminaLunar', tipo: 'arma mágica', art: 'espada', base: 'espadaLonga', bonusAtaque: 2, bonusDano: 2, poder: 'laminaLunar', sintoniaElfo: true,
    noJogo: 'só um elfo ou meio-elfo se sintoniza (o alinhamento não entra: o jogo não tem). O livro deixa o mestre escolher as runas, e esta tem três: +2 de ataque e dano, crítico com 19 ou 20, e 1d6 cortante a mais em todo acerto. Recusar o portador com desvantagem por um dia não entra.',
  },
  'Hammer of Thunderbolts': {
    id: 'marteloDosRaios', tipo: 'arma mágica', art: 'martelo', base: 'malho', bonusAtaque: 1, bonusDano: 1, poder: 'martelo',
    noJogo: 'um malho +1; levando também um cinto de força de gigante e as manoplas de força de ogro, o gigante acertado faz Constituição CD 17 ou morre. A Força +4, o arremesso com trovão e as cargas não entram.',
  },
  'Sword of Kas': { fora: ARTEFATO }, 'Book of Exalted Deeds': { fora: ARTEFATO }, 'Book of Vile Darkness': { fora: ARTEFATO },
  'Axe of the Dwarvish Lords': { fora: ARTEFATO }, 'Hand of Vecna': { fora: ARTEFATO }, 'Eye of Vecna': { fora: ARTEFATO },
  'Wand of Orcus': { fora: ARTEFATO }, 'Orb of Dragonkind': { fora: ARTEFATO },
  ...PERGAMINHOS,
  'Bag of Tricks, Rust': BOLSA('bolsaDeTruquesFerrugem', 'ferrugem'), 'Bag of Tricks, Tan': BOLSA('bolsaDeTruquesCastanha', 'castanha'),
  'Bag of Tricks, Gray': BOLSA('bolsaDeTruquesCinza', 'cinza'),
  'Bowl of Commanding Water Elementals': VASO('tigelaDeComandoDaAgua', 'elementalDaTigela', 'da água', 'a fonte de água que o livro pede'),
  'Censer of Controlling Air Elementals': VASO('incensarioDeControleDoAr', 'elementalDoIncensario', 'do ar', 'o incenso aceso que o livro pede'),
  'Brazier of Commanding Fire Elementals': VASO('braseiroDeComandoDoFogo', 'elementalDoBraseiro', 'do fogo', 'o braseiro aceso e o fogo que ele conjura'),
  'Efreeti Bottle': {
    id: 'garrafaDoEfreeti', tipo: 'maravilhoso', art: 'arcano', conjura: { cargas: 1, recarga: null, magias: { garrafaDoEfreeti: { custo: 1 } } },
    noJogo: 'com a ação, uma vez por dia, o efreeti sai e o d100 decide: 1 a 10 ele ataca (e a garrafa perde a magia), 11 a 90 serve por uma hora, 91 a 100 deve três desejos (o Desejo do jogo, sem o desgaste). A conta das três vezes que serve antes de fugir não entra.',
  },
  'Ring of Djinni Summoning': {
    id: 'anelDeConvocacaoDoDjinni', tipo: 'anel', art: 'arcano', conjura: { cargas: 1, recarga: null, magias: { djinniDoAnel: { custo: 1 } } },
    nome: 'Anel de convocação do djinni',
    noJogo: 'sintonizado, com a ação e uma vez por dia: o djinni obedece enquanto durar a concentração (até 1 hora) e volta ao anel quando ela acaba.',
  },
  'Candle of Invocation': { fora: 'tudo nela depende de alinhamento (quem ganha vantagem, quem conjura de graça, quem o portal traz), e o jogo não tem alinhamento' },
  'Iron Flask': {
    id: 'frascoDeFerro', tipo: 'maravilhoso', art: 'arcano', conjura: { cargas: null, recarga: null, magias: { prenderNoFrasco: { custo: 0 }, soltarDoFrasco: { custo: 0 } } },
    noJogo: 'com a ação, uma criatura de outro plano (celestial, corruptor, elemental, fada) a até 18 m faz Sabedoria CD 17 ou vai para dentro do frasco; com outra ação, ela sai a até 9 m e obedece por uma hora. A criatura que o livro diz já estar no frasco, e as perguntas que ela responde, não entram.',
  },
  'Horseshoes of Speed': { fora: MONTARIA }, 'Horseshoes of a Zephyr': { fora: MONTARIA }, 'Saddle of the Cavalier': { fora: MONTARIA },
  // AS BOLAS DE CRISTAL: a Vidência (que entrou com o Livro do Jogador) à vontade, no menu de magia fora da luta
  'Crystal Ball': {
    id: 'bolaDeCristal', tipo: 'maravilhoso', art: 'arcano', conjura: { cargas: null, recarga: null, cd: 17, magias: { videncia: { custo: 0 } } },
    noJogo: 'sintonizada, conjura a Vidência à vontade, fora da luta, com CD 17, mesmo para quem não é conjurador.',
  },
  'Crystal Ball of True Seeing': {
    id: 'bolaDeCristalDaVisaoDaVerdade', tipo: 'maravilhoso', art: 'arcano', conjura: { cargas: null, recarga: null, cd: 17, magias: { videncia: { custo: 0 } } },
    noJogo: 'sintonizada, conjura a Vidência à vontade, fora da luta, com CD 17. A visão verdadeira em volta do sensor não entra: a Vidência do jogo não tem sensor no mapa.',
  },
  'Crystal Ball of Mind Reading': {
    id: 'bolaDeCristalDaLeituraMental', tipo: 'maravilhoso', art: 'arcano', conjura: { cargas: null, recarga: null, cd: 17, magias: { videncia: { custo: 0 }, detectarPensamentos: { custo: 0 } } },
    noJogo: 'sintonizada, conjura a Vidência e o Detectar Pensamentos à vontade, fora da luta, com CD 17. O livro só deixa ler a mente de quem está perto do sensor da vidência; aqui o Detectar Pensamentos é o de sempre, em quem está perto do herói.',
  },
  'Crystal Ball of Telepathy': {
    id: 'bolaDeCristalDaTelepatia', tipo: 'maravilhoso', art: 'arcano', conjura: { cargas: 1, recarga: null, cd: 17, magias: { videncia: { custo: 0 }, sugestao: { custo: 1 } } },
    noJogo: 'sintonizada, conjura a Vidência à vontade, fora da luta, com CD 17, e a Sugestão uma vez por dia. A conversa telepática pelo sensor não entra; a Sugestão vale em quem está perto do herói.',
  },
  'Amulet of the Planes': { fora: NARRA }, 'Cubic Gate': { fora: NARRA },
  'Sending Stones': { fora: NARRA }, 'Folding Boat': { fora: NARRA }, "Daern's Instant Fortress": { fora: NARRA },
  "Nolzur's Marvelous Pigments": { fora: NARRA }, 'Apparatus of Kwalish': { fora: NARRA }, 'Tome of the Stilled Tongue': { fora: NARRA },
  'Helm of Teleportation': {
    id: 'elmoDoTeletransporte', tipo: 'maravilhoso', art: 'arcano', conjura: { cargas: 3, recarga: '1d3', magias: { teletransporte: { custo: 1 } } },
    noJogo: 'sintonizado, conjura o Teletransporte na tela da região, uma carga cada (1d3 voltam ao amanhecer), mesmo para quem não é conjurador.',
  },
  'Ring of Air Elemental Command': {
    id: 'anelDeComandoDoAr', tipo: 'anel', art: 'arcano', passivo: { flagelo: FLAGELO.ar, semDanoDeQueda: true }, nome: 'Anel de comando dos elementais do ar',
    noJogo: 'sintonizado, vantagem contra os elementais do ar (o elemental do ar, o djinni, o perseguidor invisível), que atacam você com desvantagem; e você cai sem sofrer dano. Falar auran e as magias que vêm depois de matar um elemental do ar não entram.',
  },
  'Ring of Earth Elemental Command': {
    id: 'anelDeComandoDaTerra', tipo: 'anel', art: 'arcano', passivo: { flagelo: FLAGELO.terra }, nome: 'Anel de comando dos elementais da terra',
    noJogo: 'sintonizado, vantagem contra os elementais da terra (o elemental da terra, o dao, o xorn), que atacam você com desvantagem. O terreno de pedra que não custa, falar terran e as magias que vêm depois não entram.',
  },
  'Ring of Water Elemental Command': {
    id: 'anelDeComandoDaAgua', tipo: 'anel', art: 'arcano', passivo: { flagelo: FLAGELO.agua, sobreAgua: true }, nome: 'Anel de comando dos elementais da água',
    noJogo: 'sintonizado, vantagem contra os elementais da água (o elemental da água, o marid), que atacam você com desvantagem; e você anda sobre a água como sobre o chão. Falar aquan e as magias que vêm depois não entram.',
  },
  'Ring of Animal Influence': {
    id: 'anelDeInfluenciaAnimal', tipo: 'anel', art: 'arcano',
    conjura: { cargas: 3, recarga: '1d3', cd: 13, magias: { amizadeAnimal: { custo: 1 }, medoDoAnel: { custo: 1 }, falarComAnimais: { custo: 1 } } },
    noJogo: 'três cargas (1d3 voltam ao amanhecer), CD 13: Amizade Animal, Falar com Animais e o Medo que só pega fera de Inteligência 3 ou menos.',
  },
  'Cloak of Invisibility': {
    id: 'mantoDaInvisibilidade', tipo: 'maravilhoso', art: 'arcano', conjura: { cargas: 1, recarga: null, magias: { capuzDoManto: { custo: 1 } } },
    noJogo: 'sintonizado, Erguer o capuz (a ação) deixa invisível até Baixar o capuz (outra ação), uma vez por dia e por até 2 horas; atacar não desfaz. O livro gasta as duas horas aos minutos, em vários usos.',
  },
  'Cube of Force': {
    id: 'cuboDeForca', tipo: 'maravilhoso', art: 'arcano', conjura: { cargas: 36, recarga: '1d20', magias: { cuboDeForca: { custo: 0 } } },
    noJogo: 'sintonizado, apertar uma face gasta a ação e as cargas dela: a barreira de 4,5 m em volta de você, que anda com você, por 1 minuto. 1 barra gás e névoa; 2, o projétil; 3, a criatura (quem não estava dentro) e o golpe de perto; 4, a magia; 5, tudo; 6 desliga. As cargas que as magias e o chifre arrancam da barreira, e o "não chego mais perto da parede", não entram.',
  },
  'Tentacle Rod': {
    id: 'bastaoDeTentaculos', tipo: 'bastão', art: 'arcano', conjura: { cargas: null, recarga: null, magias: { tentaculosDoBastao: { custo: 0 } } },
    noJogo: 'sintonizado, com a ação: três golpes de +9 a até 4,5 m, 1d6 de concussão cada; acertando os três, Constituição CD 15 ou fica apertado por 1 minuto (metade do deslocamento, desvantagem em Destreza, sem reações, a ação ou a ação bônus).',
  },
  'Staff of the Adder': {
    id: 'cajadoDaVibora', tipo: 'arma mágica', art: 'lanca', base: 'bordao', poder: 'vibora',
    noJogo: 'sintonizado, é um bordão cuja ponta morde como víbora: cada acerto pede Constituição CD 15, ou 3d6 de veneno a mais. Virar a cabeça em cobra com a ação bônus e a cabeça que se fere e se desfaz não entram: a mordida vale sempre.',
  },
  'Talisman of the Sphere': {
    id: 'talismaDaEsfera', tipo: 'maravilhoso', art: 'arcano', conjura: { cargas: null, recarga: null, magias: { controlarAEsfera: { custo: 0 } } },
    noJogo: 'sintonizado, dobra a proficiência no Arcanismo de controlar a esfera da aniquilação, e deixa tentar mesmo sem carregá-la. O voo maior de quem começa o turno no controle não entra.',
  },
  'Sphere of Annihilation': {
    id: 'esferaDaAniquilacao', tipo: 'maravilhoso', art: 'arcano', conjura: { cargas: null, recarga: null, magias: { soltarAEsfera: { custo: 0 }, controlarAEsfera: { custo: 0 } } },
    noJogo: 'no jogo ela se carrega: com a ação, sai numa casa ao lado e fica parada; quem a toca faz Destreza CD 13 ou sofre 4d10 de energia. Controlá-la, a até 18 m, é Inteligência (Arcanismo) CD 25, e ela vai até 5 × o modificador de Inteligência; falhando, anda 3 m na direção de quem tentou. A disputa pelo controle e o portal que ela atravessa não entram.',
  },
  'Bag of Devouring': { fora: 'a bolsa que engole o que se põe nela não tem efeito numa luta' },
  'Bead of Force': {
    id: 'contaDeForca', nome: 'Conta de força', tipo: 'maravilhoso', art: 'arcano', conjura: { cargas: 1, recarga: 0, magias: { contaDeForca: { custo: 1 } } },
    noJogo: 'jogada com a ação a até 18 m, uma vez: quem está a 3 m faz Destreza CD 15; quem falha sofre 5d4 de energia e fica preso numa esfera de força por 1 minuto, onde nada entra nem sai. Empurrar a esfera e empurrar para fora quem passou não entram.',
  },
  'Chime of Opening': {
    id: 'sinoDaAbertura', tipo: 'maravilhoso', art: 'arcano', recarregavel: { cargas: 10, recarga: 0 },
    noJogo: 'no menu de qualquer porta trancada a até 36 m que se vê: tocar o sino destranca e abre, uma das dez cargas (que não voltam). Vale também contra a Tranca Arcana, que o livro só suprime por 10 minutos.',
  },
  'Eversmoking Bottle': {
    id: 'garrafaDaFumacaEterna', tipo: 'maravilhoso', art: 'arcano', conjura: { cargas: null, recarga: null, magias: { garrafaDaFumaca: { custo: 0 } } },
    noJogo: 'aberta com a ação, uma fumaça que tapa a vista enche 18 m em volta e cresce 3 m por minuto, até 36 m; tampada com outra ação, para de crescer e se desfaz em 10 minutos. O vento que a dispersa não entra.',
  },
  'Driftglobe': {
    id: 'globoFlutuante', tipo: 'maravilhoso', art: 'arcano', conjura: { cargas: null, recarga: null, magias: { luzDoGlobo: { custo: 0 } } },
    noJogo: 'com a ação, acende como a magia Luz e flutua junto de quem o leva, por uma hora; de novo, apaga. A Luz do Dia uma vez por dia não entra.',
  },
  'Bag of Beans': { fora: 'o feijão plantado dá um efeito sorteado numa tabela que se narra' },
  'Deck of Many Things': { fora: 'o baralho é uma tabela de destinos que se narra' },
};
