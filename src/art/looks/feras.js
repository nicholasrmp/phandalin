// LOOKS das bestas.
//
// Ver ELENCO.md para o contrato completo do look e a escala em pixels.
// Pareia com o arquivo de mesma família em `rules/monsters/`: todo monstro de
// lá aponta um `look` daqui.
//
// TRÊS PLANOS CORPORAIS, TRÊS CONJUNTOS DE CAMPOS. Nome de campo de look é de
// origem humanoide (`outfit`, `leather`, `metal`) e numa besta não quer dizer
// nada — cada plano traduz os mesmos campos para PAPÉIS diferentes. Preencher
// pelo papel errado não quebra nada: só pinta o bicho de cor trocada, que é
// pior, porque passa na verificação e some na revisão.
//
//   plan: 'quadrupede'  (`plans/quadrupede.js`) — lobo, lobo atroz
//     outfit      corpo, cabeça, cauda
//     outfitDark  patas, orelhas, quarto traseiro
//     hair        cupim e tufo da cauda
//     skin        parte interna da orelha e tromba (entra em ramp(), por isso
//                 precisa ser uma cor de pele nua, não de pelo)
//     eyes        olho
//
//   plan: 'aracnideo'   (`plans/aracnideo.js`) — as duas aranhas
//     aracnideo   'gigante' | 'lobo'   perfil de proporção
//     sizeMul     afina o tamanho dentro do perfil (teto de 1,05 no plano)
//     eyeCount    2..8, quantos olhos do aglomerado aparecem
//     outfit      carapaça do cefalotórax
//     outfitDark  dorso do abdome
//     trim        galões do abdome — o ELEMENTO-HERÓI da figura
//     leather     quitina das hastes
//     skin        ventre (aparece na pose `down`, de barriga para o ar)
//     hair        cerdas
//     metal       presas
//     eyes        olhos
//
//   plan: 'feras'       (`plans/feras.js`) — as outras seis
//     fera        'coruja-urso' | 'urso' | 'javali' | 'ratoGigante' |
//                 'morcegoGigante' | 'stirge'
//     hair        dorso: a cor que domina a figura
//     outfitDark  membro, pata, orelha de trás
//     trim        peito e barriga, mais claros
//     leather     pele nua: cauda, membrana, disco do focinho
//     metal       queratina: bico, presa, garra, incisivo
//     eyes        olho
//
// PALETA — ELENCO.md §2, defeito 4
//   O defeito que esta família tinha de resolver é "todos no mesmo
//   marrom-verde-bege, no mesmo valor médio". As dez bestas estão em dez faixas
//   diferentes de matiz E de valor, e a lista abaixo é para ser lida de uma vez,
//   como um grupo:
//     lobo             cinza frio, valor médio
//     lobo atroz       quase preto azulado, valor baixo
//     aranha gigante   roxo escuro com galão dourado
//     aranha-lobo      ocre quente, valor médio-alto
//     rato gigante     cinza-pardo morto com pele rosada
//     morcego gigante  violeta com membrana rosa-poeira
//     urso pardo       marrom-vermelho quente
//     javali           umbre escuro com presa de marfim
//     coruja-urso      verde-acinzentado FRIO com disco facial creme
//     stirge           carmim, o único vermelho do elenco
//   Nenhuma delas repete a dupla matiz+valor de outra, e nenhuma cai no bege
//   médio dos goblinoides.

export const FERAS_LOOKS = {

  // -------------------------------------------------------------------------
  // CANÍDEOS — plano `quadrupede`
  // -------------------------------------------------------------------------

  // SILHUETA: tubo horizontal comprido sobre quatro colunas curtas, com cupim
  // acima da linha das costas, cabeça à frente na altura do dorso e cauda baixa.
  //
  // O lobo e o lobo atroz dividem a MESMA geometria: `quadrupede.js` não tem
  // multiplicador de tamanho, então aqui os dois só podem ser separados por cor
  // e valor. Está no relatório desta rodada como pedido ao dono daquele arquivo
  // — um lobo atroz Grande pintado com 35 px viola a escala de ELENCO.md §3, e
  // não é coisa que um look conserte.
  wolf: {
    plan: 'quadrupede',
    outfit: '#7a7a84', outfitDark: '#454550', hair: '#5c5c68',
    skin: '#c08c88', eyes: '#ffd24a',
    // Mantidos para quando o lobo passar a aceitar coleira de goblin: o plano
    // ainda não os lê, e a cor errada num campo não lido é lixo que confunde
    // quem vier depois.
    trim: '#9a9088', metal: '#9a9088', leather: '#58504a',
  },

  // O atroz é o mesmo molde dois valores mais escuro e com olho CLARO em vez de
  // âmbar: no tabuleiro a mancha quase preta com dois pontos frios lê como
  // "este não é o lobo de antes" antes de o jogador ler o nome.
  direWolf: {
    plan: 'quadrupede',
    outfit: '#3e4452', outfitDark: '#23272f', hair: '#2c313c',
    skin: '#8a6a72', eyes: '#e8f0ff',
    trim: '#5a6270', metal: '#8e96a4', leather: '#2a2e36',
  },

  // -------------------------------------------------------------------------
  // ARANHAS — plano `aracnideo`
  // -------------------------------------------------------------------------

  // SILHUETA: dois bulbos presos por uma cintura fina, pendurados no alto de
  // oito hastes compridas em ziguezague cujos joelhos passam acima do dorso.
  giantSpider: {
    plan: 'aracnideo',
    aracnideo: 'gigante',
    sizeMul: 1,
    eyeCount: 8,
    outfit: '#43324f', outfitDark: '#2b1f36', trim: '#e8d06a',
    leather: '#352a42', skin: '#8f7aa0', hair: '#1b1422',
    metal: '#d9c79a', eyes: '#f2e45c',
  },

  // SILHUETA: massa atarracada quase encostada no chão, mais larga do que alta,
  // de oito hastes curtas e grossas abertas em leque.
  //
  // `eyeCount: 4` de propósito: o perfil `lobo` engorda os dois olhos da frente
  // (`olhosExtra`), e com quatro olhos o que o jogador vê é um par grande e
  // saliente — a cara da aranha-lobo — em vez do aglomerado de oito da outra.
  //
  // `sizeMul: 1.15` compensa o `mul: 0.82` do perfil. Medido, dá 33 px de altura
  // contra os 46 da aranha gigante: a aranha-lobo é Média e a outra é Grande, e
  // a ALTURA é o eixo que carrega essa diferença no tabuleiro — a largura das
  // duas é parecida porque a esparramada é justamente a silhueta desta aqui.
  giantWolfSpider: {
    plan: 'aracnideo',
    aracnideo: 'lobo',
    sizeMul: 1.15,
    eyeCount: 4,
    outfit: '#6e5533', outfitDark: '#4a3620', trim: '#f0e2c2',
    leather: '#564026', skin: '#b79a6a', hair: '#2e2316',
    metal: '#cfbf9c', eyes: '#9ad84a',
  },

  // -------------------------------------------------------------------------
  // VERMES E VOADORES — plano `feras`
  // -------------------------------------------------------------------------

  // SILHUETA: fuso rasteiro pequeno cujo nariz afunila até uma ponta, com duas
  // orelhas em disco maiores que a própria cabeça e uma cauda mais longa que o
  // corpo.
  //
  // O pelo é de valor morto e a PELE NUA é a cor saturada: orelha, cauda e
  // vibrissa em rosa sobre pardo é o que faz um bicho de 24 px ser legível.
  giantRat: {
    plan: 'feras',
    fera: 'ratoGigante',
    hair: '#6b6058', outfitDark: '#453d37', trim: '#b5a894',
    leather: '#d59a9a', metal: '#f2ead2', eyes: '#e04a3a',
  },

  // SILHUETA: duas asas em leque de dedos abertas de uma borda da célula à
  // outra, com um corpo minúsculo suspenso entre elas e nada tocando o chão.
  //
  // A membrana (`leather`) é quase toda a área da figura, então é ELA que define
  // a cor do morcego — o pelo do corpo aparece em 10 px de largura. Rosa-poeira
  // e não preto: morcego preto contra sala escura desaparece do tabuleiro.
  giantBat: {
    plan: 'feras',
    fera: 'morcegoGigante',
    hair: '#4a3a44', outfitDark: '#2e2430', trim: '#6a5560',
    leather: '#8f5f66', metal: '#efe6cc', eyes: '#ffc24a',
  },

  // SILHUETA: corpo de pássaro gordo flutuando, com uma agulha reta saindo à
  // frente tão longa quanto ele e quatro palhetas curtas nos flancos.
  //
  // Único vermelho do elenco inteiro, e de propósito: o stirge tem 2 PV e 19 px,
  // e sem uma cor que ninguém mais usa ele some entre as pernas das miniaturas
  // grandes. O papo (`trim`) é mais claro que o corpo porque é a bolsa de
  // sangue — o detalhe que diz o que o bicho faz.
  stirge: {
    plan: 'feras',
    fera: 'stirge',
    hair: '#7a2a32', outfitDark: '#4a1a22', trim: '#c8565c',
    leather: '#9a4a52', metal: '#efe0c4', eyes: '#ffe24a',
  },

  // -------------------------------------------------------------------------
  // BESTAS GRANDES — plano `feras`
  // -------------------------------------------------------------------------

  // SILHUETA: cunha rasteira e comprida, lombo em arco com crista de cerdas,
  // cabeça quase encostada no chão e duas presas curvando para cima.
  //
  // Corpo no valor mais baixo do grupo e presa no mais alto: o contraste entre
  // os dois é o que faz a presa ser o elemento-herói em vez de mais um pixel
  // marrom. O javali é o único bicho aqui com uma peça de marfim puro.
  boar: {
    plan: 'feras',
    fera: 'javali',
    hair: '#3f372f', outfitDark: '#2a241e', trim: '#6a5c4a',
    leather: '#9a7a6a', metal: '#f4ead0', eyes: '#d8503a',
  },

  // SILHUETA: massa de quatro patas curtas com a cernelha corcunda mais alta que
  // o quadril, a cabeça curta pendurada à frente e abaixo dela, e nenhuma cauda.
  brownBear: {
    plan: 'feras',
    fera: 'urso',
    hair: '#7a4a2a', outfitDark: '#4a2a16', trim: '#c89a62',
    leather: '#3a2418', metal: '#e8dcc0', eyes: '#c8782a',
  },

  // SILHUETA: massa de urso erguida sobre duas pernas, encimada sem pescoço por
  // uma cabeça redonda de onde saem um bico em cunha e dois tufos em diagonal.
  //
  // A ÚNICA criatura FRIA entre as bestas grandes. O urso pardo é marrom quente
  // e tem quase a mesma massa; posto o verde-acinzentado aqui, as duas deixam de
  // ser a mesma mancha quando aparecem no mesmo encontro. O disco facial creme
  // (`trim`) é o elemento-herói e o que impede a coruja-urso de ler como urso.
  owlbear: {
    plan: 'feras',
    fera: 'coruja-urso',
    hair: '#5a6a62', outfitDark: '#3a4642', trim: '#efe3c2',
    leather: '#2e3834', metal: '#e8c86a', eyes: '#ffb02a',
  },

};
