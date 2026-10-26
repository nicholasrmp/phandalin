// OS TEXTOS E AS ÁRVORES DE CONVERSA DA CAVERNA ONDA ECO (`capitulo5-ondaeco.js`).
//
// Tudo aqui é NOSSO: o livro dá os fatos (quem está onde, quantos são, as CDs), e a prosa é escrita para
// este jogo. Nenhuma frase foi copiada nem parafraseada de perto.

import { EXAMES as EXAMES_DA_VILA } from './arvoretrovao-exames.js';

// ---------------------------------------------------------------- as peças ----
export const EXAMES = {
  ...EXAMES_DA_VILA,
  camaDePedra: 'Um beliche talhado direto na rocha, duas camas de pedra uma sobre a outra, com um resto de palha podre por colchão. Quem dormia aqui sabia que ia acordar no mesmo lugar.',
  balcaoAvaliador: 'Um balcão comprido de pedra com três balanças de ferro, os pratos ainda equilibrados à espera de um peso. A poeira desenha o contorno de cada moeda que já passou por aqui.',
  mesaDePedra: 'Uma mesa de pedra maciça, pesada demais para qualquer saqueador levar, com um banco do mesmo bloco. Marcas de caneca e de faca nas bordas: muita refeição boa já passou por ela.',
  cofreDeFerro: 'Um cofre de ferro com tranca de anão: o cofre de pagamento, esquecido no fim de uma batalha que ninguém contou direito.',
  barricada: 'Uma mesa de madeira quebrada e tábuas empilhadas contra a porta, a obra recente de quem não quer visita. A madeira ainda cheira a serragem fresca.',
  carrinhoMinerio: 'Um carrinho de mina de rodas de ferro, cheio de pedaços de minério cinzento riscado de prata. Ninguém o empurrou para fora naquele dia.',
  carrinhoVazio: 'Um carrinho de mina vazio, o fundo ainda sujo de pó de minério. Os trilhos dele correm até onde a luz alcança.',
  montinhoMinerio: 'Um monte de minério bruto e de carvão preto, do jeito que saiu da rocha. A prata ainda não foi tirada dele.',
  ferramentas: 'Um suporte de ferramentas de mineiro: picaretas, pás e uma marreta, o cabo escurecido pelas mãos. Estão ali como se alguém fosse voltar do turno.',
  suprimentos: 'Sacos de farinha, bolsas de sal, barris de carne salgada, lanternas e frascos de óleo. É o estoque de um acampamento que contava ficar semanas.',
  lanterna: 'Uma lanterna de cobre grande, apagada, pendurada ou pousada, com o óleo seco no fundo. Alguém quis que a mina desse boas-vindas a quem chegasse.',
  ossosAnao: 'Ossos de anão dentro de uma armadura de placas enferrujada, caídos de bruços, a mão ainda fechada. Morreu defendendo alguma coisa.',
  ossosOrc: 'Ossos de orc numa armadura tosca de couro e ferro, os dentes à mostra no crânio largo. Quem o matou não o enterrou.',
  ossos: 'Ossos soltos e um crânio rachado no meio do chão. Faz tanto tempo que nem os ratos mexem mais neles.',
  sacoDeDormir: 'Um colchonete de acampamento enrolado numa trouxa, com uma mochila pequena ao lado. Quem o usou cuidava das próprias coisas.',
  anaoMorto: 'O corpo de um anão deitado de costas, a barba endurecida e as botas ainda nos pés. Morreu há pouco: nada de osso aparente, só a cara de cera.',
  cogumeloGigante: 'Um cogumelo pálido da altura de um homem, com a copa larga como um escudo. A carne dele é fria e firme ao toque, e não cheira a nada.',
  bolasBrilhantes: 'Um cacho de bolas de fungo inchadas que brilham num verde-limão fosco. A luz delas dá para ler o rosto de quem está perto.',
  bolaInflada: 'Uma bola de fungo cinzenta, esticada como bexiga. Toca-la faz sair uma poeirinha, e nada mais.',
  estalagmiteFungo: 'Uma estalagmite alta, forrada de crostas pálidas de fungo que sobem como degraus. A pedra por baixo está mole de umidade.',
  tapeteLaranja: 'Um tapete baixo de fungo cor de ferrugem, salpicado de chapeuzinhos amarelos. Cede um pouco ao pisar, como musgo molhado.',
  estalagmiteAlta: 'Uma estalagmite clara e pontuda, mais alta que um homem. Dá boa cobertura a quem se abaixa atrás dela.',
  estalagmitePar: 'Duas estalagmites que cresceram juntas, uma mais alta que a outra. Entre elas cabe um corpo agachado.',
  entulhoMina: 'Um monte de pedra caída do teto, com poeira fina em cima. O que a mina perdeu aqui ela não vai devolver.',
  blocoCaido: 'Um bloco de pedra quadrado caído de uma parede, as arestas ainda vivas. Foi talhado por quem sabia, e desabou por quem não pôde evitar.',
  colunaNatural: 'Uma coluna de rocha onde uma estalactite e uma estalagmite se encontraram depois de séculos. Fria, úmida e sólida.',
  pilarAnao: 'Um pilar de pedra lavrada de capitel liso, rachado de alto a baixo. As juntas ainda são perfeitas, e o resto é que se desfaz.',
  pilarQuebrado: 'Um pilar partido ao meio, a metade de cima caída de lado sobre os próprios cacos. O teto aqui já cedeu uma vez.',
  estalagmiteCorda: 'Uma estalagmite grossa com uma corda de cânhamo amarrada na base, a ponta caindo pela borda do fosso. A corda é nova e aguenta peso.',
  cristais: 'Um punhado de cristais verdes brotando da rocha. São bonitos e só: nada neles é mágico nem vale um tostão.',
  cogumelosFinos: 'Um buquê de cogumelos finos e altos, claros como osso. Crescem em lugares onde ninguém nunca viu o sol.',
  conchasPedra: 'Conchas quebradas de mexilhão, pálidas, empilhadas junto de uma pedra. O ar aqui cheira a peixe.',
  estatuaDumathoin: 'Um anão de pedra, sentado num trono, de barba trançada até o colo e um martelo de guerra de pedra sobre as pernas. A cabeça tem a feição calma de quem guarda segredos debaixo da terra, e os olhos são duas pedras verdes.',
  fornalha: 'Uma fornalha fria e escura, com a chaminé subindo até o teto da caverna. Ao lado, um monte de carvão e os foles mecânicos que o fogo já não alimenta.',
  rodaDagua: 'Uma roda de madeira com aro de ferro, deitada num canal de pedra que já não tem água. Parou no meio de uma volta, trinta gerações atrás.',
  braseiroVerde: 'Um braseiro de ferro sobre um pedestal de pedra, e nele uma chama verde que não consome nada, estalando como se tivesse fôlego. Não esquenta: arrepia.',
  altarDumathoin: 'Um altar baixo de pedra, as faces cobertas de relevos de mineiros e de montanhas, e no topo uma bacia de ferro para as oferendas. Faz tempo que ninguém oferece nada.',
  bancadaRunas: 'Uma bancada de encantador com uma bigorna, ferramentas finas e runas azuis que acendem de leve quando se chega perto. É de onde saíam as armas dos anões, antes de a magia enfraquecer.',
  mesaDeGuerra: 'Uma mesa de madeira pesada coberta de mapas desenrolados, com velas derretidas e uma aranha negra entalhada na ponta. O dono dela anda a explorar a mina palmo a palmo.',
  guinchoPoco: 'Um guincho de madeira armado sobre uma abertura escura no chão, com corda e balde de ferro. A corda ainda aguenta o balde.',
  bau: 'Um baú de ferro chamuscado, aberto, perto da cama. Alguém acumulou muito aqui, e não pôde levar.',
};

// ------------------------------------------------------------- os textos ----
export const TEXTOS = {
  chegada: [
    'A trilha acaba num túnel estreito, escondido nos pés da montanha, e do túnel sobe um vento frio que cheira a pedra molhada. Mais adiante, a escuridão é completa.',
    'É a Caverna Onda Eco: a mina perdida do Pacto de Phandelver. Em algum lugar lá dentro, longe, alguma coisa bate na rocha em intervalos regulares, como o mar.',
  ],
  ondas: [
    'O estrondo está mais perto agora. Vem de baixo, de muito longe: um jato de água que bate na pedra, fica um instante no ar e desaba. O chão estremece junto, e depois tudo volta ao silêncio.',
  ],
  gas: [
    'O tapete de fungos aperta sob a bota e solta uma baforada que se espalha na altura do joelho: doce, pesada, de fruta passada. A maior parte dos fungos desta caverna não faz mal nenhum. Este faz.',
  ],
  stirges: [
    'A caverna é larga, de teto alto, com relevos de anões e gnomos trabalhando na rocha. Embaixo deles, esqueletos de anões e de orcs deitados em pedaços de armadura enferrujada. Seis lanternas de cobre grandes pendem dos cantos, todas apagadas.',
    'Um farfalhar seco, vindo de cima. Dez corpinhos de asa de couro se soltam do teto ao mesmo tempo, famintos, com o bico em riste.',
  ],
  esqueletos: [
    'A guarita que guardava a entrada foi tomada na invasão: bancos de pedra em cacos, beliches, prateleiras de armas caídas, e o teto meio desabado sobre tudo. No chão, ossos de anões e de orcs, misturados.',
    'No instante seguinte ao da primeira bota, os ossos começam a se arrastar uns para os outros. Nove esqueletos se levantam, armados com o que acharam no chão.',
  ],
  ghoulsSul: [
    'Pela porta entreaberta chega um som de mastigação e de couro rasgando. Dentro, beliches de pedra em fila, um braseiro de ferro cheio de carvão, e três figuras cinzentas e arqueadas entre os ossos, quebrando-os para chupar o tutano que não existe.',
    'Eles levantam a cabeça ao mesmo tempo. Sentiram carne viva.',
  ],
  ghoulsGrande: [
    'Esta caverna foi salão de banquetes dos mineiros: um nível baixo no meio, com duas mesas grandes e um par de braseiros velhos, e dois patamares mais altos, de cada lado, ligados por escadas lavradas na pedra. Uma dúzia de guerreiros mortos — anões, gnomos, orcs, ogros — jazem onde caíram.',
    'Do patamar do oeste, na sombra, sete vultos magros se debruçam e descem sem pressa, como quem sabe que o jantar não foge.',
  ],
  gosma: [
    'O túnel é baixo e as paredes minam água. Atrás do último grupo, uma coisa amarela e lisa se solta do teto e escorre pela rocha: faz dias que acompanha vocês, esperando alguém que se afaste.',
  ],
  bugbearsNorte: [
    'A porta se abre sobre um alojamento aquecido e iluminado por um braseiro de ferro no meio. Beliches de pedra pelas paredes, uma barricada de mesa quebrada do outro lado, e cinco bugbears de pé, todos de olhos em vocês. Um é maior que os outros e leva uma bolsa na cintura.',
    'Eles falam em goblin, rindo baixinho, e já estão pegando as armas.',
  ],
  zumbis: [
    'Uma fornalha enorme domina a sala, fria e escura, com o fole de ferro e o canal seco da roda d\'água cortando o chão. Corpos secos de anões e de orcs, com restos de armadura, espalhados em volta. Acima deles flutua uma caveira envolta em chama verde.',
    'Oito dos anões caídos se levantam, rígidos, e vêm em linha. A caveira inclina-se, sem pressa, como quem cumpre uma ordem que ninguém lhe tirou em séculos.',
  ],
  fenda: [
    'Uma fenda enorme parte ao meio esta caverna. Um fio de água escorre da parede do oeste e cai nela, e de dentro vêm o raspar de pedra e vozes de gente cansada. Dois vultos grandes remexem os escombros lá embaixo, e um terceiro está de guarda na beira, ao lado de um drow de manto escuro.',
    'O drow ergue os olhos e dá um passo. As cordas rangem: os dois do fundo já começam a subir.',
  ],
  espectadorSome: [
    'A esfera pisca todos os olhos, um de cada vez, e se encolhe como quem recebe uma boa notícia. — Dispensado — diz, dentro da cabeça de vocês. — Que bom. Eu estava tão cansado. — E desaparece, sem um som, voltando para onde veio.',
  ],
  fimMormesk: ['A sombra se desfaz em fios, e o frio sai dos aposentos como água que escoa. O baú está lá, aberto, e agora ninguém mais o guarda.'],
  fimEspectador: ['A esfera de olhos cai no chão com um som mole e fica imóvel. A chama verde do braseiro continua estalando, intocada, e a sala parece de repente muito grande.'],
  fimStirges: ['O último stirge cai de lado e fica de asa aberta. Uma goteira antiga bate no chão, e a caverna volta a ser só pedra e osso.'],
  fimEsqueletos: ['Os ossos caem de vez, sem se juntar mais. A guarita volta ao que era: cacos de pedra e entulho.'],
  fimGhoulsSul: ['Os três ficam entre os ossos que mastigavam. O braseiro de ferro, frio, continua no meio, e o alojamento parece só um quarto velho.'],
  fimGhoulsGrande: ['O último deles cai da escada lavrada e não se mexe mais. No silêncio, a grande caverna parece outra: só uma mesa comprida, dois braseiros velhos e os ossos de uma batalha muito antiga.'],
  fimGosma: ['A coisa amarela perde a forma e escorre pelo chão, deixando uma poça de nada. O túnel volta a ser um túnel.'],
  fimBugbearsNorte: ['O último bugbear cai sobre a mesa que ele mesmo quebrou. O braseiro continua aceso, indiferente, e o alojamento cheira a suor e a ferro.'],
  fimZumbis: ['Os mortos se desfazem em poeira e o fogo verde da caveira se apaga, dobrando-se sobre si mesmo. A fornalha continua fria; o canal continua seco; ninguém mais passa pelo salão sem ser notado.'],
  fimFenda: ['A caverna desmoronada fica em silêncio, só com o fio de água caindo na fenda. Ao longe, bem ao longe, alguma coisa bate na pedra.'],
  fimTemplo: [
    'Nezznar cai de joelhos, o cajado rolando pelo chão. A aranha entalhada olha para o teto, e a estátua de Dumathoin, impassível, olha para todos.',
    'O silêncio que fica no templo é de gente que sabe que ainda tem muito para contar, mas não agora.',
  ],
  despojosDeNezznar: [
    'No cinto de Nezznar: um frasco de poção de cura, o cajado de madeira negra com a aranha entalhada e uma chave de ferro cuja ponta tem a forma de uma bigorna. Cada coisa vai para as mãos de quem estiver mais perto.',
    'Atrás, na porta dos aposentos do sacerdote, a fechadura espera por essa chave.',
  ],
  derrota: 'A mina engole o grupo sem pressa. As ondas continuam batendo ao longe, em intervalos regulares, e ninguém as escuta.',
  nundroLivre: ['Nundro se apoia no cotovelo, tonto, e deixa que o ajudem a sentar. Está vivo, e vai ficar. Ele pergunta pelo irmão, e a pergunta fica sem resposta por um instante longo demais.'],
  tharden: ['O anão está de botas boas, e elas valem mais que todo o resto do corpo dele: leves, de cano alto, com uma sola que parece não gastar. O Aranha Negra passou direto por ele e nunca olhou os pés. Servem a quem for.'],
  cofreResiste: 'A tranca de anão não se rende: o ferro é bom, e o ladrão não foi melhor.',
  cofreAvaliadores: 'Cede com um clique fundo. Dentro, num pano de couro, o pagamento esquecido dos mineiros: seiscentas peças de cobre, cento e oitenta de prata, noventa de electro e sessenta de ouro. O electro vai em prata, que é como se troca hoje.',
  estatuaReconhece: 'Uma estátua assim, de anão de barba trançada e martelo no colo, só pode ser de Dumathoin, o Guardião dos Segredos Debaixo da Montanha. O templo é dele, e dele é esta mina, no fim das contas.',
  estatuaNada: 'Não dá para tirar mais nada dali. É pedra, e pedra guarda segredo melhor que ninguém.',
  estatuaVidro: 'De perto, as pedras verdes não têm a profundidade de uma esmeralda: são vidro lapidado, bom, mas vidro. Quem quer que tenha posto aqui os olhos verdadeiros já os levou há séculos.',
  estatuaEscorrega: 'A pedra é lisa e a bota escorrega. Ninguém sobe hoje.',
  primeiroOlho: 'Subir é fácil: o martelo de pedra dá apoio, e o joelho dá outro. O olho verde sai com um estalo e cai na mão, e é vidro, sem nenhum valor. Nada acontece. Por enquanto.',
  segundoOlho: 'O segundo olho sai, e o templo inteiro faz um som seco, de rachadura longa. Os pilares, alinhados com as paredes, rangem juntos. O teto cede.',
  sacoNezznar: 'O saco de couro preto está pesado: moedas de electro e de ouro, platina em barrinhas, nove pedrinhas lapidadas e uma caneca anã de electro batido, com martelos cruzados. O drow não viajava com pouco.',
  notasNezznar: 'Mapas riscados a carvão, com cruzes onde a exploração parou. Nas margens, a letra miúda de quem não confia em ninguém: monstros demais, o fogo verde na fundição, a esfera que ninguém passa. Ele estava perdendo a paciência.',
  braseiroRevela: 'Uma chama assim só nasce de magia velha: o braseiro é a fonte da energia que ainda corre pelas cavernas em volta. Enfraqueceu com os anos, e já não encanta nada para sempre, mas ainda dá para banhar uma arma por um tempo.',
  braseiroNada: 'A chama verde estala e nada mais. Se há ciência por trás, ela não se mostra.',
  braseiroBanho: (nome, horas) => `${nome} segura a arma nas chamas por um minuto inteiro, sem se queimar. Quando a tira, o metal brilha de leve, e continua assim por ${horas} ${horas === 1 ? 'hora' : 'horas'}: mais uma pontinha de gume.`,
  espectadorAtaca: 'O braseiro estala, e a esfera de olhos muda de cor, todos de uma vez. — Isso não é de vocês — diz, dentro de cada cabeça. Os olhos em haste se erguem.',
  itensForja: 'Sobre a mesa de trabalho do canto, uma maça de cabeça de bronze maciço esculpida como o sol nascente, e um peitoral de aço com um dragão de ouro trabalhado. A maça brilha como tocha a quem ordenar; o peitoral foi feito para um herói humano chamado Tergon, e protege contra sopro de dragão. Vão para quem os pegou.',
  mormeskVigia: 'O frio dos aposentos aperta: o espectro está de olho em quem mexe nos livros dele.',
  tomosNada: 'Poeira e histórias de aventureiros e reis. Se há segredo aqui, está bem escondido.',
  mapaMormesk: 'Um dos tomos tem a capa mais grossa que as outras. Descosturada com jeito, solta um mapa fino dobrado em quatro: uma masmorra desenhada à mão, com um nome em letras de mago. Mormesk construiu essa masmorra, e agora alguém a procura.',
  bauMago: 'No baú chamuscado: mil e cem peças de cobre, cento e sessenta de prata, cinquenta de electro — em prata, duzentas e cinquenta —, três diamantes lapidados e um cachimbo de madeira escura com filigrana de platina. É o que um mago acumulou em vida, e que a morte não lhe deixou levar.',
  bauMagoPago: 'No baú chamuscado: mil e cem peças de cobre, cento e sessenta de prata, cinquenta de electro — em prata, duzentas e cinquenta — e três diamantes lapidados. O cachimbo de platina não está: Mormesk o guardou para si.',
  lagoFalha: 'A água escura engole a luz da tocha logo na primeira braçada, e o frio faz o peito apertar. Não dá para descer mais.',
  lagoAcha: 'No fundo do lago, três metros longe da margem e três abaixo da água, deitado de lado, há um esqueleto humano com flechas de orc presas entre as costelas. No dedo dele, dois anéis de platina; entre os ossos da mão, uma varinha fina. Um mago que morreu defendendo as minas.',
  fendaFalha: 'Entre as pedras e a escuridão, nada que brilhe. Se houver alguma coisa aqui, não se deixa achar agora.',
  fendaAcha: 'Debaixo de um bloco enorme, o esqueleto esmagado de uma anã ainda leva nas mãos um par de manoplas de ferro escurecido, de dedos grossos. É o que a fenda guardava.',
  conclusao: [
    'Nezznar caiu, e com ele o plano do Aranha Negra. A Forja das Magias, que ele procurou até o fim, continua no mesmo lugar, silenciosa, esperando quem a acorde com mais cuidado.',
    'Gundren e Nundro vão administrar a nova mina e dividir os lucros com quem a libertou, e Phandalin, enfim sem os Marcarrubra, respira. Há uma casa vazia na colina, um mapa costurado na capa de um livro e muita coisa por fazer. Mas isso é outra aventura.',
  ],
  portaResiste: 'A porta de pedra aguenta, e o ombro dói.',
  chaveAbre: 'A chave entra na fechadura de primeira, como se tivesse nascido para ela. A porta se abre.',
  escutaNada: 'Pedra grossa, e só. Se há alguém do outro lado, está quieto.',
  escuta: {
    alojNorteLeste: 'Vozes graves, em goblin, reclamando de fome entre risadas curtas. Mais de uma, e nenhuma com pressa.',
    sacerdote: 'Silêncio, e mais atrás, uma respiração fraca, irregular, de quem está ferido.',
    forjaNorte: 'Um estalar baixo e rítmico, como o de brasas, e mais nada.',
    magos: 'Poeira caindo de algum lugar, e um frio que sobe pelo vão da porta.',
  },
};

// ---------------------------------------------------------- as conversas ----
/** Mormesk, a aparição dos aposentos dos magos: só aceita pagamento em coisa de mago. */
export function arvoreDeMormesk({ salvo, tem }) {
  if (salvo.mormesk === 'pago') {
    return { inicio: 'oi', nos: { oi: {
      fala: 'Vocês têm o que pedi. Não me peçam o cachimbo, nunca vão ter. Os livros estão à vontade.',
      opcoes: [{ texto: '…', fim: 'sai' }],
    } } };
  }
  if (salvo.mormesk === 'acordo') {
    const resolvido = ['dispensado', 'morto'].includes(salvo.espectador);
    return { inicio: 'oi', nos: {
      oi: {
        ao: () => { if (resolvido) salvo.mormesk = 'pago'; },
        fala: resolvido
          ? 'Ouvi o silêncio da forja daqui. Pago o que prometi: o baú é de vocês, menos o cachimbo, e os livros são de quem souber ler.'
          : 'O olho ainda vive na forja. Eu o ouço, mesmo daqui. Voltem quando não ouvir mais.',
        opcoes: [{ texto: '…', fim: 'sai' }],
      },
    } };
  }
  return {
    inicio: 'oi',
    nos: {
      oi: {
        narra: 'O frio sobe do chão em colunas finas. Uma forma de fumo e de dentes se levanta no meio da sala, e a voz vem de dentro da cabeça, e de fora dela ao mesmo tempo.',
        fala: 'Saiam. O que está neste quarto é meu, e eu mesmo o tenho guardado desde antes de vocês nascerem.',
        opcoes: [
          { texto: 'Queremos conversar.', vai: 'conversa' },
          { texto: 'Então teremos de tirar de você.', fim: 'luta' },
          { texto: 'Já vamos.', fim: 'sai' },
        ],
      },
      conversa: {
        fala: 'Conversar. Faz tempo que ninguém tenta. O que vocês têm que um mago antigo valorizaria? Pergaminho, grimório, coisa de saber. Moeda não, que o baú já está cheio.',
        opcoes: [
          { texto: 'Temos coisas de saber para oferecer.', teste: { pericia: 'persuasao', cd: 10 }, sucesso: 'acordo', falha: 'raiva',
            requer: () => (tem() ? null : 'o grupo não tem nada que ele valorize'), oculta: false },
          { texto: 'Temos coisa de valor, e nada que o interesse.', fim: 'sai' },
          { texto: 'Então teremos de tirar de você.', fim: 'luta' },
        ],
      },
      acordo: {
        fala: 'Gostei do jeito. Há uma esfera de olhos na forja, ao norte do salão estrelado, que cuida do que não deve mais ser cuidado. Tirem-na de lá — não me perguntem como — e o baú abre, e os livros também. O cachimbo não.',
        narra: 'Ele aponta, sem mexer o braço, para o rumo da forja.',
        opcoes: [{ texto: 'Combinado.', fim: 'acordo' }],
      },
      raiva: {
        fala: 'Insolentes. Cada um que pisa aqui vira mais um para me guardar o tesouro.',
        opcoes: [{ texto: '…', fim: 'luta' }],
      },
    },
  };
}

/** O espectador da Forja das Magias: um guardião enlouquecido, que acha que a mina ainda funciona. */
export function arvoreDoEspectador() {
  return {
    inicio: 'oi',
    nos: {
      oi: {
        narra: 'Uma esfera de uns três palmos de largura flutua atrás do braseiro de chama verde, e dela saem quatro olhos em hastes finas e um olho grande no centro. Todos olham para vocês, e na cabeça de cada um uma voz diz, muito cortês: Olá.',
        fala: 'Que bom ter gente. Os mineiros sumiram faz tempo, e eu continuo aqui, guardando. Ninguém leva nada da forja sem a ordem de quem me chamou.',
        opcoes: [
          { texto: 'Viemos em nome dos donos da mina, para dispensá-lo.',
            teste: { pericia: 'enganacao', cd: 15 }, sucesso: 'dispensado', falha: 'desconfia' },
          { texto: 'Só estamos olhando.', fim: 'sai' },
          { texto: 'Sai da frente.', fim: 'luta' },
        ],
      },
      dispensado: { fala: 'É mesmo? Então posso ir?', opcoes: [{ texto: 'Pode ir.', fim: 'dispensado' }] },
      desconfia: {
        fala: 'Hum. Vocês não têm cara de donos de coisa nenhuma. Fiquem onde estão, e não mexam em nada.',
        opcoes: [{ texto: 'Sem problema.', fim: 'sai' }, { texto: 'Então vai ser na força.', fim: 'luta' }],
      },
    },
  };
}

/** Nezznar, no templo: educado, vaidoso e traiçoeiro. */
export function arvoreDeNezznar() {
  return {
    inicio: 'oi',
    nos: {
      oi: {
        narra: 'No meio do templo, em frente à estátua do anão sentado, há uma fogueira rústica cercada de colchonetes, e na ponta de uma mesa de madeira um drow de armadura de couro negra e manto, com um cajado preto cuja ponta é uma aranha entalhada. Dois bugbears se levantam. O drow sorri sem pressa.',
        fala: 'Que decepção. Contava que as criaturas da mina os segurassem mais tempo. Mas já que estão aqui: quem os mandou, e o que sabem?',
        opcoes: [
          { texto: 'Você é o Aranha Negra.', vai: 'admite' },
          { texto: 'Entregue Nundro e renda-se.', vai: 'recusa' },
          { texto: 'Ainda não. Vamos embora.', fim: 'sai' },
        ],
      },
      admite: {
        fala: 'Sou. Os goblins de Dentefino e os bandidos dos Marcarrubra me serviram para manter este lugar escondido, e funcionaram até hoje. Vocês podem me servir também: há monstros demais nesta mina para um homem só, e eu pago bem.',
        opcoes: [
          { texto: 'Nunca.', fim: 'luta' },
          { texto: 'Talvez. Qual é a oferta?', vai: 'traicao' },
        ],
      },
      traicao: {
        narra: 'Ele sorri, e os bugbears, atrás, trocam um olhar de quem já conhece o fim da conversa.',
        fala: 'Deixem as armas aqui, e eu mostro a saída. — A voz é macia como uma lâmina bem oleada. — Ou fiquem com elas, e eu lhes mostro outra coisa.',
        opcoes: [{ texto: '…', fim: 'luta' }],
      },
      recusa: {
        fala: 'Nundro está vivo, por enquanto, e vai continuar assim só enquanto eu achar útil. Mas já que preferem a outra conversa…',
        opcoes: [{ texto: '…', fim: 'luta' }],
      },
    },
  };
}

/** Nundro Buscapedra, o irmão caçula, preso e ferido nos aposentos do sacerdote. */
export function arvoreDeNundro({ salvo }) {
  if (salvo.nundro === 'livre') {
    return { inicio: 'oi', nos: { oi: { fala: 'Eu ainda estou inteiro. Vão na frente: eu sigo, devagar.', opcoes: [{ texto: '…', fim: 'sai' }] } } };
  }
  return {
    inicio: 'oi',
    nos: {
      oi: {
        narra: 'Um anão jovem, de barba curta e queimada nas pontas, está deitado no chão frio, de olhos fechados, com os pulsos esfolados e o rosto marcado de pancadas. Respira, mas mal.',
        opcoes: [
          { texto: 'Estancar os ferimentos e despertá-lo.', teste: { pericia: 'medicina', cd: 10 }, sucesso: 'livre', falha: 'falha' },
          { texto: 'Deixar por enquanto.', fim: 'sai' },
        ],
      },
      livre: {
        ao: () => { salvo.nundro = 'livre'; },
        narra: 'Os olhos se abrem devagar, procuram o rosto de quem está por cima e encontram.',
        fala: 'Vocês são… de Phandalin? Gundren disse que mandaria ajuda. Tharden… vocês viram o Tharden?',
        opcoes: [{ texto: 'Sinto muito.', fim: 'resgatado' }],
      },
      falha: { narra: 'Ele geme e vira o rosto, mas não acorda. Falta jeito, ou falta tempo.', opcoes: [{ texto: '…', fim: 'sai' }] },
    },
  };
}
