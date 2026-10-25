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
//     porte       'grande' para criatura Grande; ausente para Média/Pequena.
//                 É GEOMETRIA, não cor: o plano multiplica altura e
//                 comprimento. Ver a nota de escala no topo daquele arquivo.
//     outfit      corpo, cabeça, cauda
//     outfitDark  patas, orelhas, quarto traseiro
//     hair        cernelha, peitoral e cauda
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
//     coruja-urso      cinza-pardo quase acromático, valor BAIXO, peito claro
//     stirge           carmim, o único vermelho do elenco
//   Nenhuma delas repete a dupla matiz+valor de outra, e nenhuma cai no bege
//   médio dos goblinoides. A coruja-urso e o urso pardo são os dois que mais
//   se aproximam em massa: separam-se por valor e saturação, não por matiz —
//   ver a nota no look dela.

export const FERAS_LOOKS = {

  // -------------------------------------------------------------------------
  // CANÍDEOS — plano `quadrupede`
  // -------------------------------------------------------------------------

  // SILHUETA: tubo horizontal comprido sobre quatro colunas curtas, com a
  // cernelha acima da linha das costas, o crânio afunilando num focinho longo
  // à frente, duas orelhas em triângulo ereto e cauda baixa e farta.
  wolf: {
    plan: 'quadrupede',
    outfit: '#7a7a84', outfitDark: '#454550', hair: '#5c5c68',
    skin: '#c08c88', eyes: '#ffd24a',
    // Mantidos para quando o lobo passar a aceitar coleira de goblin: o plano
    // ainda não os lê, e a cor errada num campo não lido é lixo que confunde
    // quem vier depois.
    trim: '#9a9088', metal: '#9a9088', leather: '#58504a',
  },

  // SILHUETA: o mesmo tubo sobre quatro colunas, meia cabeça mais alto que um
  // humano, com a cernelha dominando o dorso e a cabeça maciça acima da linha
  // das costas em vez de na altura dela.
  //
  // `porte: 'grande'` é o que conserta a colisão desta rodada: até agora os
  // dois lobos saíam pixel a pixel idênticos (IoU 1,000) porque o plano não
  // tinha noção de tamanho e o look só podia mudar cor. Cor sozinha nunca
  // resolveria — no tabuleiro quem diz "Grande" é a altura contra o vizinho.
  //
  // O valor continua dois degraus abaixo do lobo comum, e o olho CLARO em vez
  // de âmbar: a mancha quase preta com dois pontos frios lê como "este não é o
  // lobo de antes" antes de o jogador ler o nome.
  direWolf: {
    plan: 'quadrupede',
    porte: 'grande',
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

  // FAMILIARES (Convocar Familiar): os mesmos planos do rato e do morcego gigantes, recoloridos.
  // Um espírito chamado por magia não tem o pardo morto de bicho de esgoto: o rato é creme e
  // castanho-claro, com o rosa da pele nua mais vivo, e o morcego é um marrom-ouro de membrana
  // clara, com olhos de brasa. A silhueta é a do plano, de propósito: lê como "o rato" e "o
  // morcego" do jogo, só que menores e de cor própria.
  familiarRat: {
    plan: 'feras',
    fera: 'ratoGigante',
    hair: '#c9b48a', outfitDark: '#8e7a58', trim: '#f2ead2',
    leather: '#f0b4b0', metal: '#fff6dc', eyes: '#7ad8ff',
  },
  familiarBat: {
    plan: 'feras',
    fera: 'morcegoGigante',
    hair: '#7a5a3a', outfitDark: '#4a3422', trim: '#c8a070',
    leather: '#b88a54', metal: '#fff0cc', eyes: '#7ad8ff',
  },

  // SILHUETA: quatro lâminas membranosas esticadas em cruz em volta de um
  // corpo minúsculo, com uma agulha reta de ponta virada saindo à frente da
  // cabeça e uma cauda fina encurvada por baixo.
  //
  // Único vermelho do elenco inteiro, e de propósito: o stirge tem 2 PV e 19 px,
  // e sem uma cor que ninguém mais usa ele some entre as pernas das miniaturas
  // grandes. O papo (`trim`) é mais claro que o corpo porque é a bolsa de
  // sangue — o detalhe que diz o que o bicho faz.
  stirge: {
    plan: 'feras',
    fera: 'stirge',
    // `metal` aqui NÃO é marfim. Na referência o stirge é vermelho-tijolo de
    // ponta a ponta, probóscide inclusive — e `metal` é justamente a cor dela.
    // Em creme de osso a agulha lia como bico de passarinho, que é a leitura
    // errada: esta criatura não bica, ela ESPETA.
    hair: '#7a2a32', outfitDark: '#4a1a22', trim: '#c8565c',
    leather: '#9a4a52', metal: '#c87a62', eyes: '#ffe24a',
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

  // REAPROVEITADOS (sem arte nova, so troca de paleta): as feras que o
  // Conjurar Animais pede e o bestiario nao tinha. Cada uma usa o plano da fera
  // mais parecida: urso-negro = urso pardo escurecido; tigre-dente-de-sabre =
  // plano do lobo atroz (grande) em laranja; javali gigante = javali mais
  // escuro; cabra gigante = plano do javali em bege-claro.
  blackBear: {
    plan: 'feras',
    fera: 'urso',
    hair: '#2a2622', outfitDark: '#16130f', trim: '#a8825a',
    leather: '#1c1814', metal: '#e8dcc0', eyes: '#c8782a',
  },
  saberTiger: {
    plan: 'quadrupede',
    porte: 'grande',
    outfit: '#c8782a', outfitDark: '#6a3a14', hair: '#a85a1c',
    skin: '#e8c89a', eyes: '#ffe066',
    trim: '#f4ead0', metal: '#f4ead0', leather: '#3a2414',
  },
  giantBoar: {
    plan: 'feras',
    fera: 'javali',
    hair: '#2a2420', outfitDark: '#1a1612', trim: '#5a4c3a',
    leather: '#6a4a3e', metal: '#f4ead0', eyes: '#e8402a',
  },
  giantGoat: {
    plan: 'feras',
    fera: 'javali',
    hair: '#d8cfba', outfitDark: '#9a907c', trim: '#f4ead0',
    leather: '#c8b89a', metal: '#6a5c4a', eyes: '#e8c030',
  },

  // SILHUETA: massa larga de urso erguida sobre duas pernas, encimada sem
  // pescoço por uma cabeça de coruja mais larga que alta, com dois tufos de
  // pena abrindo em V acima dela e um bico aberto em gancho no meio da cara.
  //
  // PALETA REFEITA NESTA RODADA (REFERENCIAS.md §6). O verde-água de antes era
  // o pior erro do elenco: a criatura lia como gente de pijama. A referência é
  // CINZA-PARDO ESCURO, quase marrom-chumbo, com o peito e a face bem mais
  // claros — nada de verde em lugar nenhum.
  //
  // O argumento antigo (ser a única fria para não repetir o urso pardo) não se
  // perde, só muda de eixo: a separação agora é de VALOR e de SATURAÇÃO, não
  // de matiz. O urso pardo é `#7a4a2a`, marrom quente e saturado, de valor
  // médio; a coruja-urso é quase acromática e dois degraus mais escura. No
  // mesmo encontro são duas manchas distintas sem que nenhuma precise ser
  // verde.
  //
  // Dois elementos-herói, e eles não competem porque ocupam áreas diferentes:
  // `trim` (peito emplumado e disco facial) é a mancha clara de longe, e
  // `metal` (bico) é o único amarelo da figura, concentrado em 9 px. A garra
  // NÃO sai de `metal` — o plano a deriva de `leather` — justamente para não
  // espalhar o amarelo por oito pontos e apagar o bico.
  owlbear: {
    plan: 'feras',
    fera: 'coruja-urso',
    hair: '#4d4740', outfitDark: '#332e29', trim: '#b3ab98',
    leather: '#262220', metal: '#e8b43c', eyes: '#2f231d',
  },

};
