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
// a estátua de Palien, o telhado da guarnição — são pistas e ambientação, sem item
// de valor, de propósito: a economia da fase é a do livro.
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

// O QUE SE VÊ DO ALTO DA VELHA GUARNIÇÃO (área 11), depois de abrir o alçapão. É TEXTO, e de propósito: a
// guarnição é casca sem telhado na planta da Forgotten Adventures, e revelar o mapa inteiro de graça tiraria
// da fase o que ela é — escolher o que encarar sem saber tudo. O grupo fica sabendo ONDE estão as coisas, e
// continua sem ver quem está dentro delas.
//
// Os rumos e as distâncias foram MEDIDOS no mapa a partir da casa do alçapão (43,24), e não escritos de
// cabeça: a torre a 29 m a noroeste, a estátua a 18 m a noroeste, a casa de esquina a 11 m a sudeste, a
// estalagem a 17 m a sudeste, o celeiro a 12 m a sudoeste, o armazém a 24 m a sudoeste, a cabana ocidental a
// 41 m a oeste.
export const VISTA_DO_ALTO = [
  'Lá de cima a aldeia deixa de ser rua e vira planta. A cinza que parecia um tapete é um rio: desce a rua principal e contorna as casas, e onde ela some é onde o mato ganhou.',
  'A noroeste, a uns trinta metros, a torre de pedra escura, de pé entre as copas; um fio de fumaça esverdeada escorre dela em vez de subir. No meio do caminho até lá, a estátua no largo, de lança erguida e sem cabeça de quem a olhe.',
  'Perto, a sudeste, a casa de esquina — a única por aqui com a porta entulhada por dentro — e, logo depois dela, o casarão comprido da estalagem. A sudoeste, o celeiro de telhado inteiro, e mais longe um galpão em que a teia sai pelas frestas e brilha quando o vento mexe.',
  'A oeste, no fim de tudo, uma cabana com fumaça fina saindo da chaminé. Alguém mora lá, ou morava hoje de manhã.',
];

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
  // AS DUAS QUE A CENA DA FORGOTTEN ADVENTURES DECLARA e que não tinham objeto nosso: o ladrilho
  // `CottageFireplace` (casa 13,26) e o `FallenDoor` (29,4). A lareira ainda tem fogo — a FA põe uma luz de
  // fogueira e um som de lenha queimando em cima dela —, e é por isso que ela é a única coisa viva da aldeia.
  lareira: 'Uma lareira de pedra do chão ao teto, e nela um fogo pequeno que alguém alimentou há pouco: brasa viva debaixo de três gravetos cruzados. Na cinza ao lado, um prato lascado, limpo.',
  portaCaida: 'A porta do galpão, arrancada das dobradiças e caída de barriga para cima no piso de tábua. A madeira está estalada para FORA, e as dobradiças vieram junto com o batente — não arrombaram a porta para entrar; alguém grande saiu por ela.',
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
  beliche: 'Um beliche de duas camas: tábua, palha e um gancho para o cinto. Feito para quem dorme pouco e acorda de uma vez.',
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
  tesouroDragao: 'Uma pilha de moedas, cálices e uma adaga caída de lado. O dragão dormiu em cima dela por trinta dias e quase não olhou para ela: sabe exatamente quanto tem.',
  tesouroPouco: 'Algumas moedas e um cálice, soltos no chão, onde um corpo pesado se virou. O que vale de verdade está na arca.',
  alcapaoFechado: 'Um alçapão de tábua, com uma argola de ferro. Por baixo da poeira ele abre bem: alguém o usou há pouco, e uma escada leva ao telhado e ao parapeito.',
  placaCaveira: 'Uma tábua pregada num poste, com uma caveira pintada e, embaixo, um aviso em letras tortas: PERIGO — PLANTAS ASSASSINAS E MORTOS DE CINZA — VOLTEM AGORA. Quem o pregou fez questão de ser claro.',
  estatuaPalien: 'Uma estátua de guerreiro com lança e escudo redondo, no meio da praça, inclinada sobre uma base rachada. O rosto está gasto pelas chuvas, e não há nome nem inscrição em lugar nenhum.',
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
  estatuaPalien: {
    chave: 'estatuaPalien', rotulo: 'Reconhecer a estátua', pericia: 'historia', cd: 15,
    sucesso: 'Sem nome para ler, mas o conjunto é conhecido: a lança, o escudo redondo, a postura de quem segura a linha. É Palien, o herói de Neverwinter que fez frente aos monstros da Floresta de Neverwinter, e a vila lhe ergueu isto na praça.',
    falha: 'Um guerreiro de pedra, como mil outros. Sem inscrição, não dá para dizer quem foi.',
    pista: 'A estátua da praça é de Palien, o herói de Neverwinter que enfrentou os monstros da Floresta de Neverwinter.',
  },
  // AS DUAS ARANHAS MORTAS do capim, que a Forgotten Adventures desenha nas margens da trilha que desce da
  // torre. O texto de Examinar já diz "o que a matou não deixou sobra"; o teste dá o nome disso. Natureza,
  // porque a pergunta é sobre o bicho e sobre o que um bicho daquele tamanho come e é comido.
  aranhaMorta: {
    chave: 'aranhaMorta', rotulo: 'Ler o que matou a aranha', pericia: 'natureza', cd: 13,
    sucesso: 'Não foi mordida nem rasgada: a carapaça está inteira e as juntas, abertas de dentro para fora. O que sobrou do corpo é casca seca, e a grama em volta morreu num halo. Isto é veneno, muito veneno de uma vez, e não de aranha — aranha nenhuma mata outra assim. Veio de cima, e veio do lado da torre.',
    falha: 'Uma aranha gigante morta, e já faz tempo. Dá para contar as patas e mais nada.',
    pista: 'As aranhas mortas na trilha da torre não foram mordidas: morreram de veneno em nuvem, vindo da torre. Seja o que for que mora lá, cospe.',
  },
  alcapaoFechado: {
    chave: 'alcapao', rotulo: 'Abrir o alçapão', pericia: 'atletismo', cd: 10,
    sucesso: 'A argola cede e o alçapão sobe num rangido. Por baixo dele, o resto de uma escada de pedra encostada na parede que ainda está de pé — é por onde os guardas subiam para ver quem vinha pela estrada. Dá para subir.',
    falha: 'A madeira inchou e o alçapão não sai do lugar. Mais um empurrão e ele abre.',
    pista: 'A escada da velha guarnição ainda sobe: do alto dela se vê a aldeia quase toda.',
  },
};

// A ESTÁTUA DE PALIEN pode ser derrubada: Atletismo CD 20, um herói por vez, uma tentativa por
// herói. Cai num monte de pedra (`desabamento`), que barra o passo e não a visão; o que ela
// escondia, o livro não diz: nada.
export const EMPURRAR_ESTATUA = {
  chave: 'estatuaEmpurrar', rotulo: 'Empurrar a estátua', pericia: 'atletismo', cd: 20,
  sucesso: 'O ombro de um e o peso de todos: a estátua balança, resiste, e vai. Cai de lado com um estrondo que corre a praça e as ruas, e a lança parte em três. Onde ela estava sobra um monte de pedra e madeira velha. Não havia nada por baixo.',
  falha: 'A base não cede: a estátua balança um dedo e volta. É mais pesada do que parece, e mais bem plantada.',
};

export const ACHADO_DO_CASULO = {
  chave: 'casuloElfo',
  rotulo: 'Cortar o casulo e revistar',
  itens: [['pocaoDeCura', 1], ['moedaDeOuro', 23], ['moedaDePrata', 35]],
  texto: 'A seda cede ao corte como corda velha. O elfo era um viajante de couro batido; ainda leva uma poção de cura no cinto e uma bolsa pesada nas costas: vinte e três peças de ouro e trinta e cinco de prata. A teia estava seca, mas o corpo não: as aranhas o guardavam para depois.',
};
