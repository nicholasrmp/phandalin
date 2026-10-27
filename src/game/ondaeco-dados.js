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
  suprimentos: 'Provisões de quem pretendia ficar uma temporada: farinha, sal, carne em barril, frascos de óleo, picaretas e pás. O acampamento dos irmãos Buscapedra, deixado de qualquer jeito.',
  lanterna: 'Uma lanterna grande de cobre, apagada e sem óleo, pendurada para dar luz a quem entrasse. Faz séculos que ninguém a acende.',
  ossosAnao: 'Ossos de anão dentro de uma armadura de placas enferrujada, caídos de bruços, a mão ainda fechada. Morreu defendendo alguma coisa.',
  ossosOrc: 'Ossos de orc numa armadura tosca de couro e ferro, os dentes à mostra no crânio largo. Quem o matou não o enterrou.',
  ossos: 'Ossos soltos e um crânio rachado no meio do chão. Faz tanto tempo que nem os ratos mexem mais neles.',
  sacoDeDormir: 'Um colchonete de acampamento enrolado numa trouxa, com uma mochila pequena ao lado. Quem o usou cuidava das próprias coisas.',
  anaoMorto: 'O corpo de um anão deitado de costas, de barba trançada e botas nos pés. Quem o deixou assim não se deu ao trabalho de revistá-lo.',
  cogumeloGigante: 'Um cogumelo pálido da altura de um homem, com a copa larga como um escudo. A carne dele é fria e firme ao toque, e não cheira a nada.',
  braseiroFrio: 'Um braseiro de ferro com carvão apagado há séculos: só cinza fria e uma crosta de ferrugem onde o fogo morava.',
  braseiro: 'Um braseiro de ferro com brasas vivas, o único calor desta parte da mina. Alguém o mantém aceso.',
  fogueira: 'Uma fogueira de pedras soltas, ainda quente, com cinzas frescas: o pouso de quem acampou aqui.',
  bolasBrilhantes: 'Um cacho de bolas de fungo inchadas que brilham num verde-limão fosco. A luz delas dá para ler o rosto de quem está perto.',
  fungoCiano: 'Um cacho de cogumelos de chapéu translúcido, que brilha num azul de gelo. Perto deles o ar tem um cheiro fresco, de chuva.',
  cogumeloTurquesa: 'Um cogumelo alto e magro, de copa fina como um guarda-chuva e brilho turquesa nas nervuras.',
  fungoPrateleira: 'Camadas de fungo roxo brotam da pedra como degraus de prateleira, firmes e úmidas ao toque.',
  cogumeloVermelho: 'Cogumelos vermelhos de pintas brancas. Numa mina, a cor funciona como aviso: ninguém aqui os come.',
  aneloDeCogumelos: 'Cogumelinhos pálidos em roda perfeita, como se alguém tivesse marcado o lugar com giz.',
  bolaRachada: 'Uma bola de fungo velha, rachada ao meio, que solta um fiapo de esporos cinzentos a cada corrente de ar.',
  coralAmarelo: 'Um fungo ramificado, de um verde-amarelo vivo, parecido com coral. Cheira a limão azedo.',
  cogumeloChato: 'Um cogumelo de copa larga e achatada, marrom-acinzentada, plantado como uma mesinha.',
  fungoLaranja: 'Orelhas de fungo cor de brasa crescem em degraus num toco enegrecido, o que sobrou de uma escora de mina.',
  pedraDeLiquen: 'Uma pedra coberta de veios de líquen que brilha de leve, riscando a rocha como rachaduras acesas.',
  hastesVioleta: 'Duas hastes escuras e retorcidas, de pontas roxas que brilham fraco.',
  tapeteAzul: 'Um tapete baixo de cogumelinhos azuis, cada um com o seu pontinho de luz.',
  fungoCerebro: 'Um fungo rosado e cheio de dobras, igualzinho a um cérebro. Parece pulsar de leve, ou foi impressão.',
  fungoEspinhoso: 'Um tufo negro de espinhos de fungo, com pontinhos vermelhos que acendem e apagam como brasas.',
  estalagmiteAzul: 'Uma estalagmite abraçada por prateleiras de fungo azul, que dão ao cone de pedra um brilho de gelo.',
  cogumeloRoxo: 'Um cogumelo grande, de copa roxa e lâminas claras por baixo. Nenhum anão da mina o teria colhido.',
  bolaInflada: 'Uma bola de fungo cinzenta, esticada como bexiga. Tocá-la faz sair uma poeirinha, e nada mais.',
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
    'Quem entra sabe que a mina cobra caro de grupo pequeno e cansado: os primeiros salões são os mais mansos, o depósito é o único canto seguro para dormir, e o templo, no fundo, não perdoa.',
  ],
  ondas: [
    'O estrondo está mais perto agora. Vem de baixo, de muito longe: um jato de água que bate na pedra, fica um instante no ar e desaba. O chão estremece junto, e depois tudo volta ao silêncio.',
  ],
  gas: [
    'O tapete de fungos aperta sob a bota e solta uma baforada que se espalha na altura do joelho: doce, pesada, de fruta passada. A maior parte dos fungos desta caverna não faz mal nenhum. Este faz.',
  ],
  stirges: [
    'A caverna é tão alta que a luz some antes do teto. Nas paredes, gravuras de anões e gnomos com a picareta no ombro; no chão, os ossos de duas dúzias de combatentes, anões e orcs, ainda metidos em ferro velho.',
    'Das vigas pendem lanternas de cobre sem fogo, e quem fica olhando para elas esquece de olhar mais para cima: lá, dez corpos de asa de couro se soltam, famintos.',
  ],
  esqueletos: [
    'A guarita que vigiava a entrada foi tomada à força. Sobraram entulho de teto, bancos de pedra partidos, beliches e armas caídas das prateleiras, e no meio de tudo ossos de anões e de orcs, misturados.',
    'Basta uma bota para o chão responder: os ossos se arrastam uns para os outros, se encaixam, e nove esqueletos se erguem com o que acharam à mão.',
  ],
  ghoulsSul: [
    'Da porta entreaberta vem um ranger de dentes em osso e de couro sendo rasgado. O alojamento tem beliches de pedra em fila e um braseiro de ferro enferrujado, com carvão, no meio; entre os ossos dos mineiros, três vultos cinzentos e curvados roem as armaduras atrás de tutano.',
    'Eles param e viram o rosto para a porta. Sentiram cheiro de carne.',
  ],
  ghoulsGrande: [
    'O salão onde os mineiros bebiam é feito de degraus largos: no fundo, duas mesas enormes e dois braseiros apagados; de cada lado, um patamar alto que se sobe por escadas talhadas na rocha. Pelo chão, os ossos de uma dúzia de guerreiros de tudo quanto é raça, e até de ogros.',
    'No patamar do oeste, no escuro, quatro vultos magros se inclinam e começam a descer sem pressa: sabem que o jantar não foge.',
  ],
  gosma: [
    'O túnel é baixo e as paredes minam água. Atrás do último grupo, uma coisa amarela e lisa se solta do teto e escorre pela rocha: faz dias que acompanha vocês, esperando alguém que se afaste.',
  ],
  bugbearsNorte: [
    'A porta se abre sobre um alojamento quente, iluminado por um braseiro de ferro aceso no centro. Beliches de pedra pelas paredes e, do outro lado, uma mesa quebrada atravessada na outra porta. Cinco bugbears estão de pé, e um deles é maior que os outros e leva uma bolsa pesada na cintura.',
    'Falam goblin entre risadas curtas, e já estão pegando as armas.',
  ],
  zumbis: [
    'Uma fornalha enorme, apagada, domina o salão, com foles de ferro e carrinhos de minério por fundir. Um canal seco e fundo corta o piso. Em volta, anões e orcs ressecados, ainda de armadura, e sobre eles paira uma caveira coroada de fogo verde.',
    'Oito dos mortos se levantam juntos, duros, e vêm em fila. A caveira se vira sem pressa e cumpre a ordem que ninguém cancelou em séculos.',
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
  fimGhoulsGrande: ['O último deles cai da escada lavrada e não se mexe mais. No silêncio, a grande caverna parece outra: duas mesas grandes, dois braseiros velhos e os ossos de uma batalha muito antiga.'],
  fimGosma: ['A coisa amarela perde a forma e escorre pelo chão, deixando uma poça de nada. O túnel volta a ser um túnel.'],
  fimBugbearsNorte: ['O último bugbear cai sobre a mesa que ele mesmo quebrou. O braseiro continua aceso, indiferente, e o alojamento cheira a suor e a ferro.'],
  fimZumbis: ['Os mortos se desfazem em poeira e o fogo verde da caveira se apaga, dobrando-se sobre si mesmo. A fornalha continua fria; o canal continua seco; ninguém mais passa pelo salão sem ser notado.'],
  fimFenda: ['A caverna desmoronada fica em silêncio, só com o fio de água caindo na fenda. Ao longe, bem ao longe, alguma coisa bate na pedra.'],
  fimTemplo: [
    'Nezznar cai de joelhos, o cajado rolando pelo chão. A aranha entalhada olha para o teto, e a estátua de Dumathoin, impassível, olha para todos.',
    'O silêncio que fica no templo é o de quem ainda tem muito a fazer na mina, mas não agora.',
  ],
  despojosDeNezznar: [
    'No cinto de Nezznar: um frasco de poção de cura, o cajado de madeira negra com a aranha entalhada e uma chave de ferro rematada numa bigorninha. Tudo vai para a bolsa do primeiro de vocês que se abaixa para pegar.',
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
  itensForja: 'Na bancada, lado a lado: uma maça de cabeça de bronze, forjada como o sol saindo do horizonte, encomendada por um clérigo de Lathander, e uma couraça de aço com um dragão dourado no peito, feita para um herói de Neverwinter, Tergon. A maça brilha como tocha quando se manda e bate mais forte nos mortos-vivos; a couraça dá vantagem contra o sopro dos dragões. Vão para quem as pegou.',
  mormeskVigia: 'O frio dos aposentos aperta: o espectro está de olho em quem mexe nos livros dele.',
  tomosNada: 'Poeira e histórias de aventureiros e reis. Se há segredo aqui, está bem escondido.',
  mapaMormesk: 'Um dos tomos tem a capa mais grossa que as outras. Descosturada com jeito, solta um mapa fino dobrado em quatro: uma masmorra desenhada à mão, com um nome em letras de mago. Mormesk construiu essa masmorra, e agora alguém a procura.',
  bauMago: 'No baú chamuscado: mil e cem peças de cobre, cento e sessenta de prata, cinquenta de electro — em prata, duzentas e cinquenta —, três diamantes lapidados e um cachimbo de madeira escura com filigrana de platina. É o que um mago acumulou em vida, e que a morte não lhe deixou levar.',
  bauMagoPago: 'No baú chamuscado: mil e cem peças de cobre, cento e sessenta de prata, cinquenta de electro — em prata, duzentas e cinquenta — e três diamantes lapidados. O cachimbo de platina não está: Mormesk o guardou para si.',
  lagoFalha: 'A água escura engole a luz da tocha logo na primeira braçada, e o frio faz o peito apertar. Não dá para descer mais.',
  lagoAcha: 'A uns três metros da margem, no fundo, jaz um esqueleto humano com os restos de uma túnica e pontas de flecha orc cravadas entre as costelas. Duas alianças de platina e uma varinha ainda estão com ele: era um mago da velha Phandalin, e a mina foi a última coisa que defendeu.',
  fendaFalha: 'Entre as pedras e a escuridão, nada que brilhe. Se houver alguma coisa aqui, não se deixa achar agora.',
  fendaAcha: 'Debaixo de um bloco enorme, o esqueleto esmagado de uma anã ainda leva nas mãos um par de manoplas de ferro escurecido, de dedos grossos. É o que a fenda guardava.',
  // O fecho da aventura depende do que o grupo fez de Nezznar (caído, preso e vigiado, ou preso e solto por Halia) e de ter ou
  // não achado o mapa de Mormesk.
  conclusao: ({ capturado = false, fugiu = false, mapa = false } = {}) => [
    capturado
      ? (fugiu
        ? 'Na manhã seguinte a cela do salão está vazia, a fechadura aberta por dentro e por fora, e Halia Thornton, quando perguntada, só ergue as sobrancelhas. O Aranha Negra está nas mãos dos Zhentarim, e o que ele sabe da mina foi junto com ele.'
        : 'Nezznar não vai a lugar nenhum: a Aliança dos Lordes manda recado a Neverwinter, e o drow espera na cela do salão, sob guarda, para ser interrogado e julgado. A Forja das Magias que ele procurou até o fim continua onde estava, em silêncio.')
      : 'Nezznar caiu, e com ele o plano do Aranha Negra. A Forja das Magias, que ele procurou até o fim, continua onde estava, silenciosa, esperando quem a acorde com mais cuidado.',
    'Gundren e Nundro vão tocar a mina restaurada e repartir com quem a libertou dez por cento dos lucros, e Phandalin, enfim sem os Marcarrubra, respira.'
      + (mapa ? ' O mapa que saiu dos tomos de Mormesk aponta para lugares que a região ainda não viu.' : '')
      + ' Há muita coisa por fazer, mas isso é outra aventura.',
  ],
  vhalakChega: 'Do fundo do templo chega, atrasado e de adaga na mão, o drow franzino que fugiu da caverna desmoronada.',
  vhalakRecua: 'Vhalak, o drow franzino, vê os bugbears caírem, dá meia-volta e some pelo corredor, depressa, na direção do templo.',
  refemNarra: 'Junto da mesa, sentado no chão, está um anão de barba curta, lisa e castanha, amarrado e amordaçado, olhando para vocês com olhos grandes.',
  refemRevela: 'O anão sorri, e os dentes não são de anão. A barba escorre como cera, o rosto afina, e em dois segundos o prisioneiro é um drow de olhar vazio, que se levanta com as cordas soltas nas mãos.',
  nezznarPreso: 'Nezznar está no chão, desacordado, com a respiração curta e as mãos já presas atrás das costas. Vivo. Vale mais assim: o Aranha Negra tem muito a dizer a quem souber perguntar.',
  nezznarEntrega: [
    'A Aliança dos Lordes não perdoaria o Aranha Negra enterrado na própria mina: o drow tem de chegar vivo a Phandalin, ao salão do chefe da vila, onde ela cuida do resto.',
    'Só que o salão tem uma cela e muitas portas. Quem deixar o prisioneiro sozinho de noite não garante quem aparece com a chave.',
  ],
  nezznarGuarda: 'Vocês levam Nezznar ao salão do chefe da vila, e dois de vocês se sentam à porta da cela até alguém da Aliança chegar com o selo de Neverwinter. Passa a noite inteira sem uma sombra no corredor.',
  nezznarSolto: 'Vocês o deixam na cela, trancam a porta e vão dormir. Quem ouve falar da prisão, de manhã, ouve também que a fechadura estava aberta.',
  ondaLonge: 'De muito longe, pela pedra, chega o estrondo de uma onda que bate e recua. O chão estremece um instante e depois assenta.',
  ondaPerto: 'O estrondo vem de perto agora, tão alto que a poeira se solta do teto. A água em algum lugar adiante bate na rocha, fica no ar e desaba.',
  vagando: (nome) => ['O barulho chegou antes: passos, arrastar de pedra, respiração.', `Pela escuridão, ${nome} vêm direto para o grupo.`],
  fimVagando: 'O que vagava pela mina fica no chão. Ela, no entanto, é grande, e não está vazia.',
  bolsaDoBugbear: 'Na bolsa do bugbear maior: quinze peças de cobre, treze de electro (em prata, sessenta e cinco) e um frasco de poção da vitalidade.',
  entrada: {
    5: 'Aqui se pesava o pagamento dos mineiros. Um balcão de laje corta a sala, e as três balanças de ferro estão cegas de poeira. O que foi o arquivo, nos nichos do norte, virou farelo ao menor vento; pelo chão, gnomos e orcs caídos juntos, como se tivessem brigado pelo troco. No fundo, um cofre de ferro.',
    7: 'Poucas salas da mina aguentaram tanto. Falta um pedaço da parede leste, que virou monte de pedra, mas a porta do norte está sã e se tranca por dentro. Os barris, secos e rachados, ficaram encostados onde estavam. Não é um quarto, é um buraco com porta; mesmo assim, nada ronda por aqui.',
    8: 'Do chão ao teto, tudo aqui está vivo e quieto: um tapete de fungos engole o piso, crostas pálidas sobem pelas estalagmites, e cogumelos da altura de uma pessoa se curvam sobre o caminho. As bolas inchadas brilham num verde fosco, e o lugar ganha luz de graça.',
    10: 'O lago ocupa a caverna quase inteira, preto e calado, e a beira é cascalho de conchas partidas de um mexilhão pálido. Cheira a peixe velho. No meio a água é fundíssima, uns seis metros, e dela escapa uma corrente fraca para o nordeste, por uma fresta baixa.',
    13: 'Alguma coisa no teto devolve a luz como estrelas miúdas, e por baixo o chão é um cemitério: ossos aos montes, muitos sob blocos caídos. Duas construções de pedra escura ficam uma de cada lado, na escala de gente, com as portas duplas rachadas e chamuscadas.',
    17: 'Uma passagem baixa, de pouco mais de um metro de teto, entulhada de pedras redondas: o leito de um córrego que secou. Dá para seguir agachado, e é um caminho que contorna os mortos da fundição.',
    20: 'Cortinas empoeiradas nas paredes, uma cama, um braseiro frio e chão de pedra: o quarto do sacerdote do templo, servindo agora de cela.',
  },
  paredaoNaoSobe: 'A pedra é lisa de baixo a cima, e as mãos não acham onde agarrar. Não é por aqui que se sobe: a escada fica ali ao lado.',
  paredaoCai: (nome, dano) => `${nome} perde a mão no meio da subida e cai de costas no pé do paredão: ${dano} de pedra no corpo, e o ar some do peito.`,
  portaResiste: 'A porta de pedra aguenta, e o ombro dói.',
  portaAvisa: 'O ferro range alto demais. Lá atrás, na escuridão do templo, algo de muitas patas se mexe sobre a pedra, e depois fica quieto, à espera.',
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
  const jaResolvido = ['dispensado', 'morto'].includes(salvo.espectador);
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
        ao: () => { if (jaResolvido) salvo.mormesk = 'pago'; },
        fala: jaResolvido
          ? 'Gostei do jeito. E melhor ainda: ouvi o silêncio da forja daqui, e quem a guardava já não guarda. Então o baú é de vocês, menos o cachimbo, e os livros são de quem souber ler.'
          : 'Gostei do jeito. Há uma coisa na forja, ao norte do salão estrelado, que cuida do que não deve mais ser cuidado. Livrem-me dela, não me perguntem como, e o baú abre, e os livros também. O cachimbo não.',
        narra: jaResolvido ? undefined : 'Ele aponta, sem mexer o braço, para o rumo da forja.',
        opcoes: [{ texto: jaResolvido ? 'Combinado.' : 'Combinado.', fim: jaResolvido ? 'sai' : 'acordo' }],
      },
      raiva: {
        fala: 'Insolentes. Cada um que pisa aqui vira mais um para me guardar o tesouro.',
        opcoes: [{ texto: '…', fim: 'luta' }],
      },
    },
  };
}

/** O espectador da Forja das Magias: um guardião enlouquecido, que acha que a mina ainda funciona. */
export function arvoreDoEspectador({ salvo = {} } = {}) {
  return {
    inicio: 'oi',
    nos: {
      oi: {
        narra: 'Atrás do braseiro de chama verde flutua uma esfera do tamanho de uma cabeça grande, com um olho enorme no centro e quatro menores na ponta de hastes curtas. Os cinco se voltam para vocês, e uma voz educada soa dentro da cabeça de cada um: Bom dia.',
        fala: 'Que bom ter gente! A forja está em dia, os mineiros devem voltar do turno logo, e eu estou aqui, guardando. Ninguém leva nada daqui sem a ordem de quem me chamou.',
        opcoes: [
          { texto: 'Viemos em nome dos donos da mina, para dispensá-lo.',
            teste: { pericia: 'enganacao', cd: 15 }, sucesso: 'dispensado', falha: 'desconfia', oculta: false,
            requer: () => (salvo.espectadorEnganou ? 'ele já desconfia de vocês' : null) },
          { texto: 'Só estamos olhando.', fim: 'sai' },
          { texto: 'Sai da frente.', fim: 'luta' },
        ],
      },
      dispensado: { fala: 'Ordem do dono? Então hoje a forja descansa. Boa tarde, e cuidado com as brasas!', opcoes: [{ texto: 'Pode ir.', fim: 'dispensado' }] },
      desconfia: {
        ao: () => { salvo.espectadorEnganou = true; },
        fala: 'Hum. Vocês não têm cara de donos de coisa nenhuma. Fiquem onde estão, e não mexam em nada.',
        opcoes: [{ texto: 'Sem problema.', fim: 'sai' }, { texto: 'Então vai ser na força.', fim: 'luta' }],
      },
    },
  };
}

/** Nezznar, no templo: educado, vaidoso e traiçoeiro. */
export function arvoreDeNezznar({ refem = false } = {}) {
  return {
    inicio: 'oi',
    nos: {
      oi: {
        narra: refem
          ? 'No fundo do templo, ao pé da estátua, alguém montou pouso: esteiras em volta de uma fogueira de pedras soltas e uma mesa onde um drow de capa e couro negro estuda um mapa, com o cajado preto de aranha de ferro no ombro. Junto da mesa, sentado no chão, um anão de barba curta, lisa e castanha, amarrado e amordaçado, olha para vocês com olhos grandes. Dois bugbears erguem os olhos da mesa. O drow franze a testa, depois sorri sem calor.'
          : 'No fundo do templo, ao pé da estátua, alguém montou pouso: esteiras em volta de uma fogueira de pedras soltas e uma mesa onde um drow de capa e couro negro estuda um mapa, com o cajado preto de aranha de ferro no ombro. Dois bugbears erguem os olhos da mesa. O drow franze a testa, depois sorri sem calor.',
        fala: refem
          ? 'Que decepção. Contava que as criaturas da mina os segurassem mais tempo. E já que vieram, olhem: este anão aqui tem família. Armas no chão, e ele fica inteiro; quem os mandou, e o que sabem?'
          : 'Que decepção. Contava que as criaturas da mina os segurassem mais tempo. Mas já que estão aqui: quem os mandou, e o que sabem?',
        opcoes: [
          ...(refem ? [{ texto: 'Observar o anão com atenção.', teste: { pericia: 'intuicao', cd: 15 }, sucesso: 'revela', falha: 'traicao', oculta: false }] : []),
          { texto: 'Você é o Aranha Negra.', vai: 'admite' },
          { texto: 'Viemos buscar Nundro Rubirrocha e o mapa da mina.', vai: 'franqueza' },
          { texto: 'Ninguém nos mandou. Somos aventureiros e nos perdemos.', teste: { pericia: 'enganacao', cd: 15 }, sucesso: 'curioso', falha: 'descoberto' },
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
      franqueza: {
        fala: 'Franqueza. É raro, e eu a respeito. Nundro está vivo, e continua assim enquanto eu achar útil; o mapa e a forja são meus, e eu não divido. Então já sabem como esta conversa termina.',
        opcoes: [{ texto: 'Então vamos tomá-los.', fim: 'luta' }, { texto: 'Pensaremos nisso.', fim: 'sai' }],
      },
      curioso: {
        narra: 'Ele ergue uma sobrancelha, e a mão que alisava o cajado para de se mexer.',
        fala: 'Perdidos, é? Na minha mina, passando por tudo o que passaram? Curioso. Mas deixo a curiosidade para depois: aceito gente com a espada afiada. Querem trabalho?',
        opcoes: [
          { texto: 'Queremos.', vai: 'traicao' },
          { texto: 'Preferimos seguir sozinhos.', fim: 'sai' },
        ],
      },
      descoberto: {
        fala: 'Ninguém se perde assim, de armadura nova e olhos de quem procura alguém. Peguem-nos.',
        opcoes: [{ texto: '…', fim: 'luta' }],
      },
      traicao: {
        narra: 'Ele sorri, e os bugbears, atrás, trocam um olhar de quem já conhece o fim da conversa.',
        fala: 'Deixem as armas aqui, e eu mostro a saída. — A voz é macia como uma lâmina bem oleada. — Ou fiquem com elas, e eu lhes mostro outra coisa.',
        opcoes: [
          { texto: 'Fingir que aceitam e atacar de surpresa.', teste: { pericia: 'enganacao', cd: 18 }, sucesso: 'surpresa', falha: 'desmascarado', oculta: false },
          { texto: 'Recusar.', fim: 'luta' },
        ],
      },
      revela: {
        narra: 'O anão não pisca quando a tocha estala, e a barba dele é lisa demais, sem uma ponta queimada, como a de quem acabou de a vestir.',
        fala: 'Olho bom. Vhalak, acabou o teatro.',
        opcoes: [{ texto: '…', fim: 'luta-revelado' }],
      },
      desmascarado: {
        fala: 'Acharam que eu não via a mão na empunhadura? Peguem-nos.',
        opcoes: [{ texto: '…', fim: 'luta' }],
      },
      surpresa: {
        narra: 'Ele se vira, só um instante, para pegar o mapa na mesa.',
        opcoes: [{ texto: 'Agora.', fim: 'luta-surpresa' }],
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
    return { inicio: 'oi', nos: { oi: { fala: 'Eu fico aqui até as pernas obedecerem. Quando puder andar, vou pelo caminho que vocês abriram, direto para Phandalin.', opcoes: [{ texto: '…', fim: 'sai' }] } } };
  }
  return {
    inicio: 'oi',
    nos: {
      oi: {
        narra: 'Um anão jovem, de barba curta e queimada nas pontas, está deitado no chão frio, de olhos fechados, com os pulsos esfolados e o rosto marcado de pancadas. Respira, mas mal.',
        opcoes: [
          { texto: 'Estancar os ferimentos e despertá-lo.', vai: 'livre' },
          { texto: 'Deixar por enquanto.', fim: 'sai' },
        ],
      },
      livre: {
        narra: 'Os olhos se abrem devagar, procuram o rosto de quem está por cima e encontram.',
        fala: 'Vocês são… de Phandalin? Gundren disse que mandaria ajuda. Tharden… vocês viram o Tharden?',
        opcoes: [
          { texto: 'Tharden morreu na entrada da mina. Sinto muito.', vai: 'luto' },
          { texto: 'Fique calmo. Vamos tirá-lo daqui.', vai: 'luto' },
        ],
      },
      luto: {
        fala: 'Ele me avisou… Disse para desistir do mapa. — Ele engole o resto com um aceno. — Obrigado. Eu devo a vocês mais do que posso pagar.',
        opcoes: [{ texto: '…', fim: 'resgatado' }],
      },
    },
  };
}
