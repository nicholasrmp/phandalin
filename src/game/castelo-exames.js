// O QUE O GRUPO ACHA EXAMINANDO A MOBÍLIA DO CASTELO DENTEFINO.
//
// Cada peça de móvel do mapa tem uma frase de "Examinar" — texto NOSSO, o livro dá só os fatos. Não há regra
// de jogo aqui, só dados; quem monta o menu é `capitulo4-castelo.js`.
//
// A CHAVE É A SUPERFÍCIE, e não uma variante à parte como na Árvore Trovão: a mobília do Castelo é terreno
// (`core/grid.js GLIFOS`), porque é ela que barra passo e dá cobertura. A lista abaixo cobre toda superfície
// que `MOBILIA` (em `src/dev/mapa-castelo-fa.py`) sabe pôr no chão.
//
// E A MOBÍLIA SÓ EXISTE ONDE A FORGOTTEN ADVENTURES A DESENHA. O gerador a põe nas casas em que a versão
// mobiliada do battlemap difere da sem mobília — então toda peça que ganha um destes textos é uma coisa que
// o jogador está vendo na tela, e não uma barreira invisível. Medido: 38 casas de móvel, todas em cima de
// móvel pintado.
//
// As seis superfícies que o capítulo já trata com teste próprio (caixotes na despensa, armeiro, braseiro
// frio, altar, arca do urso, cama do rei) continuam com o que tinham: o Examinar entra ao lado, não no lugar.

export const EXAMES_DO_CASTELO = {
  mesa: 'Uma mesa de tábua grossa, com o tampo cheio de marcas de faca. Alguém comeu aqui há pouco e não limpou: osso roído, uma caneca virada, cera de vela endurecida na beirada.',
  mesaBanquete: 'A mesa comprida do salão, posta para quem não usa prato. Travessas de estanho amassadas, canecas tortas, e no meio um assado que já foi assado — agora é só o osso e a gordura seca.',
  arca: 'Uma arca de madeira escura com cantoneiras de ferro, a tampa arranhada de alto a baixo. As garras que fizeram isso não eram de goblin.',
  // A MESMA PEÇA, OUTRA COISA: na torre assombrada a `arca` não é arca nenhuma, é o toco do segundo andar, onde o
  // grell fez o ninho. O Obelisco deixa SUBIR (Atletismo CD 15), e por isso o texto não diz mais que não dá.
  // O livro a descreve como um silo: o piso de cima desabou e deixou um poço vazio de uns nove metros, com
  // um resto de laje ainda preso à parede lá no alto. Em cima dessa laje há um baú velho, que de baixo não
  // se enxerga sem procurar — Percepção CD 15.
  //
  // O texto do chão não pode entregar o baú: é exatamente isso que a CD 15 cobra. Ele descreve o que se vê
  // de baixo — a viga e a laje penduradas — e deixa a pista de olhar para cima, sem dizer o que há lá.
  'arca@torreUrso': 'O andar de cima caiu quase todo e deixou a torre oca como um silo, nove metros até onde a sombra começa. Do segundo piso sobrou uma língua de laje presa numa viga, bem alta, e as pedras soltas da parede são o único caminho até ela. Lá em cima não dá para ver nada daqui — nem se há o que ver.',
  camaRei: 'Uma cama que não nasceu cama: é um estrado de porta velha sobre caixotes, coberto de peles mal curtidas que ainda cheiram ao bicho. Para um rei goblin, é trono deitado.',
  banheira: 'Uma banheira de cobre, verde de azinhavre, com dois dedos de água parada e uma película por cima. Ninguém se lavou nela neste século.',
  // O ARMEIRO ESTÁ CHEIO, e não vazio. Este texto dizia "sobraram quatro, e nenhuma delas combina com as
  // outras", o que contradizia o próprio roteiro quatro linhas adiante — "tudo pendurado, tudo em ordem,
  // nada no chão" — e contradizia o livro, que conta as armas uma a uma: cinco lanças, quatro espadas
  // longas, três maças estrela, duas espadas largas e um bordão. Quinze, em suportes de parede. A sala é
  // dos hobgoblins, que são tropa; quem tem armeiro vazio é a torre sul, dos goblins.
  armeiro: 'Suportes de parede com quinze hastes, e quinze armas nelas: lanças, espadas longas, maças estrela, duas espadas largas de cabo gasto. Tudo pendurado pela ordem do tamanho, nada no chão. Isto aqui é arsenal de tropa, não despojo de bando.',
  caixotes: 'Caixotes empilhados até a altura do peito, de madeira clara e tampa pregada. A marca queimada na lateral é de um comerciante de Neverwinter, e a pilha está mais vazia embaixo que em cima.',
  braseiro: 'Um braseiro de ferro de três pés, com brasa viva no fundo e um bafo que chega de longe. Alguém o alimentou hoje.',
  braseiroFrio: 'Um braseiro de ferro de três pés, apagado. A cinza dentro está compactada pela chuva que entra pelo teto, e no fundo há um resto que não é lenha.',
  altar: 'Uma laje de pedra sobre dois blocos, com um sulco cavado em volta que leva a uma pia rasa no canto. Fosse altar de templo, o sulco levaria ao centro.',
  desabamento: 'Um monte de pedra e viga, do tamanho de um cavalo deitado. A parte de cima ainda está solta: puxar a peça errada daqui traz o resto do teto junto.',
  portaoCaido: 'Uma folha de portão arrancada das dobradiças, deitada no chão com as ferragens para cima. Precisou de mais de um goblin para pôr isto no lugar, e de mais do que isso para o tirar.',

  // o chão: não é móvel, não barra passo, e mesmo assim conta uma coisa
  palha: 'Palha velha espalhada em camada grossa, o cheiro azedo de quem dorme onde come. Dá para ver as covas que os corpos deixaram.',
  entulho: 'Entulho até a canela — argamassa, telha e pedaço de viga. Anda-se nele devagar e com barulho.',
  cacos: 'Cacos de louça e de vidro, varridos para o canto por alguém que não tinha vassoura. Pisar aqui avisa a sala inteira.',
  ossos: 'Ossos no chão, limpos e quebrados ao meio no sentido do comprimento. O que os quebrou queria o tutano.',
  musgoChao: 'Musgo grosso cobrindo a laje, úmido o ano inteiro por causa da goteira. Guarda a marca da bota por um tempo bom.',
  mancha: 'Uma mancha escura na pedra, larga e com borda nítida. Secou de uma vez só, e ninguém se deu ao trabalho de lavar.',
};
