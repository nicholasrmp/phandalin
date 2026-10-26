// O QUE O GRUPO ACHA EXAMINANDO AS COISAS DE ÁRVORE TROVÃO.
//
// Cada peça de mobília do mapa (`ARVORE_TROVAO.props`, com a variante que o tabuleiro
// desenha) tem uma frase de "Examinar" — texto NOSSO, o livro dá só os fatos — e algumas
// têm mais: um teste que rende uma pista, um achado no corpo de um casulo, um móvel que
// às vezes guarda umas moedas. A cena (`capitulo4-arvoretrovao.js`) lê esta tabela e
// monta o menu de clique; aqui não há regra de jogo, só dados.
//
// O QUE O LIVRO DÁ, e por isso está aqui com número: o casulo do armazém (área 6)
// guarda um elfo morto com uma poção de cura e uma bolsa de 23 po e 35 pp. O resto —
// a escama do altar, o nome no pedestal, o telhado da guarnição — são pistas e
// ambientação, sem item de valor, de propósito: a economia da fase é a do livro.
//
// Uma tentativa por herói em cada ponto (`game/buscas.js`).

/** Variantes onde se pode REVISTAR por moedas: o achado é sorteado por casa, e só em parte delas. */
export const CONTEINERS = new Set(['armario', 'guardaRoupa', 'estante', 'prateleira', 'escrivaninha',
  'cofreVazio', 'mesaFerramentas', 'saco', 'tina', 'cocho']);

/** Quanto vale o que um recipiente guarda, decidido pela casa (determinístico). */
export function achadoDoRecipiente(x, y) {
  const h = (((x * 73856093) ^ (y * 19349663)) >>> 0) % 1000 / 1000;
  if (h >= 0.4) return null;                       // 60% estão vazios
  return h < 0.07 ? { item: 'moedaDePrata', qtd: 2 + Math.floor(h * 40) } : { item: 'moedaDeCobre', qtd: 4 + Math.floor(h * 60) };
}

export const EXAMES = {
  // ------------------------------------------------------------------ casas comuns
  banco: 'Um banco de tábua grossa, rachado no meio, com o assento escuro de tanto uso e de trinta anos de cinza.',
  banquinho: 'Um banquinho de três pés. Um deles foi consertado com um pedaço de corda, e a corda aguentou mais que a madeira.',
  armario: 'As portas do armário pendem em ângulos diferentes. Dentro, prateleiras vazias e um cheiro de roupa que apodreceu devagar.',
  cama: 'Uma cama estreita, o colchão de palha esfarelado até o estrado. Quem dormiu aqui por último deixou a marca do corpo na poeira.',
  fogao: 'Um fogão de ferro de pé baixo, com o cano torto. A chapa ainda guarda a mancha de uma panela que ninguém tirou do fogo.',
  cadeira: 'Uma cadeira de encosto alto, com uma perna quebrada e escorada num tijolo. Alguém pretendia consertar.',
  estante: 'Prateleiras tortas, vazias. Sobrou uma lombada de livro colada à madeira, e o resto virou pó cinza.',
  tina: 'Uma tina de lavar roupa, de aduelas inchadas e arcos de ferro enferrujados. A água secou há tanto tempo que nem mancha deixou.',
  berco: 'Um berço pequeno de balanço. Ainda se mexe quando se encosta nele, e ninguém gosta de ver isso.',
  guardaRoupa: 'Um guarda-roupa alto, as portas entreabertas. Dentro, cabides sem nada e uma única bota de criança.',
  roca: 'Uma roca de fiar com a roda empenada. Uma meada de lã ficou enrolada no fuso, dura como pedra.',
  cocho: 'Um cocho de madeira comprido, ainda com restos de feno que a cinza endureceu.',
  prateleira: 'Uma prateleira inclinada, com potes rachados enfileirados. Nenhum tem mais que pó e uma casca seca no fundo.',
  escrivaninha: 'Uma escrivaninha com o tinteiro seco e uma pena roída. As gavetas emperraram, mas dá para forçá-las.',
  baldeBanco: 'Um balde de madeira sobre um banquinho, com o fundo rachado. Quem o encheu pela última vez foi embora com pressa.',
  trapos: 'Um monte de trapos e cacos de louça. Dá para ver que alguém já remexeu aqui — e achou pouco.',
  mesaPosta: 'Uma mesa posta para quatro, os pratos cobertos de cinza e as canecas viradas. A refeição ficou pela metade, e ninguém voltou para o resto.',
  // ------------------------------------------------------------- cada ofício
  cubaCerveja: 'Uma cuba grande de carvalho com arcos de ferro, onde se fazia a cerveja do Cavalo Pardo. Por baixo da casca de cinza ainda azeda um cheiro de fermento.',
  barrisRack: 'Dois barris deitados num cavalete. Um está furado; o outro, quando se bate, soa cheio de alguma coisa que não se quer provar.',
  tear: 'Um tear de pé, quebrado ao meio, com os fios soltos pendendo do quadro. A lançadeira ficou caída debaixo, ainda enrolada em lã.',
  beliche: 'Um beliche de duas camas, feito para soldados: tábua, palha e um gancho para o cinto. Cinco deles dormiam nesta casa de serviço.',
  bigorna: 'Uma bigorna fincada num toco, o gume lascado de tanto malhar. Trinta anos de ferrugem não tiraram o brilho do topo, onde o martelo batia.',
  fole: 'Um fole de couro rachado, com o bico de ferro enegrecido. Ainda tem um fio de ar quando se aperta.',
  lousa: 'Uma lousa rachada num cavalete, ainda com contas de criança em giz, cobertas de cinza — e uma delas errada, com a correção ao lado.',
  mo: 'Uma mó partida, metade afundada numa farinha que virou pedra de cinza. O moinho parou no meio de uma moagem.',
  camaViuva: 'Uma cama larga com uma colcha de retalhos desbotada, feita à mão. Sobre o travesseiro, as mossas de duas cabeças.',
  machadoTora: 'Um machado cravado num toco de lenha, o cabo escurecido por trinta anos. Foi deixado ali para a manhã seguinte.',
  redes: 'Redes de pesca penduradas num quadro, duras de sal e de cinza. Nelas, o esqueleto de peixe do que seria o último lance.',
  saco: 'Um saco de grão rasgado, o conteúdo virado pedra de cinza.',
  tabuas: 'Uma pilha de tábuas e uma escada de mão. Servem para consertar o que o tempo ainda não derrubou.',
  mesaFerramentas: 'Uma mesa de trabalho com serrote, plaina e pregos enferrujados, cada um no seu lugar. Quem a usava era caprichoso.',
  cofreVazio: 'Um cofre de ferro, a tampa aberta e o fundo vazio. Quem o esvaziou tinha pressa, e os trincos mostram que não foi arrombado: tinha a chave.',
  // ---------------------------------------------------------- o que é do livro
  casuloElfo: 'Um casulo de seda grossa, em pé, com a forma de uma pessoa embrulhada do queixo aos pés. Pelos fios se vê uma orelha pontuda e couro batido. Está muito quieto.',
  casuloCorpo: 'Um casulo deitado, tão cheio de teia que não se vê o que há dentro. Alguém já o cortou e o fechou de novo: está vazio.',
  aranhaMorta: 'Uma aranha gigante de costas, as patas dobradas para dentro. Morreu há tempos, e ninguém a comeu: o que a matou não deixou sobra.',
  camaCampo: 'Uma cama de campo — manta, enxerga e uma trouxa de roupa — arrumada com o capricho de quem dorme em muitos lugares.',
  peles: 'Peles de animal curtidas, empilhadas para dormir. O cheiro é de fumaça de lenha, e a pelagem é recente: o dono da cama ainda passa por aqui.',
  fogueiraPanela: 'Um círculo de pedras com brasa fraca e uma panela de ferro enegrecida. Alguém cozinha aqui, devagar, de um jeito que não se vê mais.',
  secadorErvas: 'Um varal de ervas penduradas para secar, amarradas com barbante em maços que se reconhecem pelo cheiro: trevo, losna, casca de salgueiro.',
  altarEscama: 'Um altar baixo de pedra empilhada, e em cima dele uma escama verde do tamanho de um prato, brilhando de óleo e de devoção. Foi limpa hoje.',
  candelabro: 'Um candelabro de ferro com velas derretidas em camadas. A cera nova cobre a velha, e a velha ainda tem a forma de um dedo.',
  tesouroDragao: 'Uma pilha de moedas, cálices e uma adaga caída de lado. O dragão dormiu em cima dela por trinta dias e quase não olhou para ela: sabe exatamente quanto tem.',
  tesouroPouco: 'Algumas moedas e um cálice, soltos no chão, onde um corpo pesado se virou. O que vale de verdade está na arca.',
  alcapaoFechado: 'Um alçapão de tábua, com uma argola de ferro. Por baixo da poeira ele abre bem: alguém o usou há pouco, e uma escada leva ao telhado e ao parapeito.',
  placaCaveira: 'Uma tábua pregada num poste, com uma caveira pintada e, embaixo, um aviso em letras tortas, de quem escrevia com pressa: VOLTEM.',
  estatuaPalien: 'Uma estátua de guerreiro com lança e escudo redondo, numa base de pedra rachada. O rosto está gasto pelas chuvas; no pedestal, sob a hera, há um nome gravado.',
  // ------------------------------------------------------- cercas e portões
  cerca: 'Uma cerca de estacas, parte em pé, parte caída. Ainda marca onde o campo acabava e a estrada começava.',
  cercaCaida: 'Um trecho de cerca caído, as estacas por cima umas das outras. Dá para passar por cima.',
  portaoAberto: 'Um portão de fazenda aberto de par em par, as dobradiças tortas. A tranca está no chão.',
  portaoFechado: 'Um portão de fazenda com a trave atravessada, afundado de um lado. Aguenta o que aguentava, que era pouco.',
};

// ------------------------------------------------------- o que se pode FAZER além de olhar
// `acao`: um teste por herói em cada ponto; o sucesso rende uma pista (texto que a
// campanha guarda) e o fracasso só o texto. `achado`: o que o casulo entrega, uma vez.
export const ACOES = {
  altarEscama: {
    chave: 'altarEscama', rotulo: 'Estudar a escama', pericia: 'arcanismo', cd: 10,
    sucesso: 'A escama é de dragão verde, e é nova: a borda ainda tem a luz de quem a perdeu há semanas, não há anos. O animal que a trocou está vivo, e perto.',
    falha: 'É uma escama enorme, e só isso. Nada que se tire dela além do medo.',
    pista: 'O altar dos cultistas guarda uma escama fresca de dragão verde: o dragão da torre troca de pele aqui perto.',
  },
  estatuaPalien: {
    chave: 'estatuaPalien', rotulo: 'Ler o pedestal', pericia: 'historia', cd: 15,
    sucesso: 'O nome gravado sob a hera é Palien. Quem ele foi, as letras já não contam; mas a estátua foi feita para ser vista da praça inteira, e ainda é.',
    falha: 'Há um nome sob a hera, mas o musgo comeu as letras. Podia ser qualquer um.',
    pista: 'A estátua da praça é de alguém chamado Palien.',
  },
  alcapaoFechado: {
    chave: 'alcapao', rotulo: 'Abrir o alçapão', pericia: 'atletismo', cd: 10,
    sucesso: 'A argola cede e o alçapão sobe. Uma escada de mão leva ao parapeito: de lá se vê a rua inteira, a praça e, no fim dela, a torre. É de onde os guardas viam quem vinha.',
    falha: 'A madeira inchou e o alçapão não sai do lugar. Mais um empurrão e ele abre.',
    pista: 'O telhado da guarnição dá vista para a rua inteira, da praça até a torre do dragão.',
  },
};

export const ACHADO_DO_CASULO = {
  chave: 'casuloElfo',
  rotulo: 'Cortar o casulo e revistar',
  itens: [['pocaoDeCura', 1], ['moedaDeOuro', 23], ['moedaDePrata', 35]],
  texto: 'A seda cede ao corte como corda velha. O elfo era um viajante de couro batido; ainda leva uma poção de cura no cinto e uma bolsa pesada nas costas: vinte e três peças de ouro e trinta e cinco de prata. A teia estava seca, mas o corpo não: as aranhas o guardavam para depois.',
};
