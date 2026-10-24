// Os doze heróis prontos da campanha, um por classe, no 1º nível.
//
// O ELENCO foi decidido com o dono do projeto (classe, raça e gênero de cada
// um — ver a memória "elenco de heróis"): heróis pré-definidos em vez de um
// criador de personagem, porque cada um tem arte própria feita à mão no
// PixelLab. O que o jogador escolhe na entrada da aventura é o que o Livro do
// Jogador deixa escolher no 1º nível — magias, talento de origem, subclasse
// quando a classe tem uma no 1º nível, equipamento inicial —, e isso mora em
// `criacao.js`. Aqui fica o que NÃO se escolhe: atributos, raça, perícias,
// antecedente e a pessoa.
//
// REGRAS: as do Livro do Jogador (2014), que é o que o motor segue, mais o
// talento de origem do livro de 2024 no 1º nível, como regra da casa pedida
// pelo dono. Atributos pelo conjunto padrão (15, 14, 13, 12, 10, 8) somado
// aos bônus da raça; perícias da classe mais as duas do antecedente.
//
// TEXTO NOSSO. As histórias foram escritas para este projeto. Nomes de lugar
// (Neverwinter, Phandalin) e de divindade (Berronar) são do cenário e entram
// pela Fan Content Policy; nada aqui é texto de livro publicado, nem
// parafraseado dele. O gancho comum é o mais simples que a estrada permite:
// todos foram contratados, cada um por um motivo, para levar uma carroça de
// mantimentos de Neverwinter até Phandalin.
//
// CAMPOS
//   id, name, classe   `classe` é o id em `rules/classes/`
//   className, raca    como a mesa diz ("Guerreira", "Draconata vermelha")
//   sexo               'F' | 'M'
//   look               a figura (`art/looks`); os oito novos têm figura
//                      provisória pintada por código até o sprite do PixelLab
//   abilities          já com o bônus da raça
//   skills             classe + antecedente
//   speedFt            pela raça
//   racial             o que a raça dá e o motor aplica na montagem:
//                      pvPorNivel, resistencias (tipos de dano), sopro,
//                      truques (de graça), truquesExtras (a escolher)
//   antecedente, origem, historia[2], motivo, traco, ideal, vinculo, defeito

export const HEROIS = [
  {
    id: 'pc-guerreiro', name: 'Dara', classe: 'guerreiro', className: 'Guerreira',
    raca: 'Draconata vermelha', ancestry: 'Draconata', sexo: 'F', look: 'fighter',
    abilities: { str: 17, dex: 13, con: 14, int: 8, wis: 12, cha: 11 },
    skills: ['atletismo', 'percepcao', 'lidarComAnimais', 'sobrevivencia'],
    speedFt: 30,
    racial: { resistencias: ['fogo'], sopro: { tipo: 'fogo', forma: 'linha' } },
    antecedente: 'Heroína do povo',
    origem: 'Filha de estalajadeiros draconatos da beira da Estrada Alta, ao sul de Neverwinter.',
    historia: [
      'Dara cresceu servindo cerveja a carroceiros e ouvindo as histórias deles sobre o que espreita entre uma cidade e outra. Aos dezesseis anos trocou o avental por uma cota de malha emprestada e entrou para a guarda de uma companhia de caravanas.',
      'Foram seis anos de estrada, até descobrir que o próprio capitão vendia aos salteadores o caminho das carroças que ela protegia. Denunciou-o diante dos mercadores, perdeu o emprego e ganhou, nas estalagens da estrada, fama de quem não se vende. A estalagem da família, enquanto isso, afundou em dívidas.',
    ],
    motivo: 'O pagamento cobre um ano de juros da estalagem. E escoltar carroça é a única coisa que ela sabe fazer melhor do que ninguém.',
    traco: 'Conta as saídas de todo lugar em que entra antes de se sentar.',
    ideal: 'Quem anda atrás do meu escudo chega em casa.',
    vinculo: 'A estalagem dos pais, que ela jurou não deixar ir a leilão.',
    defeito: 'Não confia em quem nunca segurou uma arma em fileira.',
  },

  {
    id: 'pc-ladino', name: 'Pip', classe: 'ladino', className: 'Ladino',
    raca: 'Halfling pés-leves', ancestry: 'Halfling', sexo: 'M', look: 'rogue',
    abilities: { str: 8, dex: 17, con: 14, int: 12, wis: 13, cha: 11 },
    skills: ['furtividade', 'prestidigitacao', 'percepcao', 'acrobacia', 'enganacao', 'investigacao'],
    speedFt: 25,
    racial: {},
    antecedente: 'Criminoso',
    origem: 'Halfling criado nos becos do porto de Neverwinter.',
    historia: [
      'Pip fazia entregas entre as casas de penhor do porto: pacotes sem nome, para gente sem nome, por caminhos que só ele conhecia. Aprendeu cedo que uma porta trancada é uma pergunta, e que quase toda pergunta tem resposta.',
      'Há um mês um pacote sumiu das mãos dele no meio de uma entrega, e o dono quer de volta o pacote ou o valor dele. Pip não tem nem um nem outro. Tem uma irmã aprendiz de padeira que acha que ele trabalha num armazém, e a firme intenção de que ela continue achando.',
    ],
    motivo: 'Uma viagem longe da cidade, paga adiantado, bem na hora em que a cidade ficou pequena demais para ele.',
    traco: 'Trata qualquer estranho como um velho amigo, e às vezes convence o estranho disso.',
    ideal: 'Dívida paga é porta que se abre de novo.',
    vinculo: 'A irmã mais nova, que não sabe do que ele vive.',
    defeito: 'Não consegue passar por uma fechadura sem testá-la.',
  },

  {
    id: 'pc-clerigo', name: 'Brenn', classe: 'clerigo', className: 'Clérigo',
    raca: 'Anão da colina', ancestry: 'Anão', sexo: 'M', look: 'cleric',
    abilities: { str: 13, dex: 10, con: 16, int: 8, wis: 16, cha: 12 },
    skills: ['medicina', 'persuasao', 'intuicao', 'religiao'],
    speedFt: 25,
    racial: { pvPorNivel: 1, resistencias: ['veneno'] },
    antecedente: 'Acólito',
    origem: 'Anão de um clã mineiro das montanhas, curandeiro do santuário de Berronar.',
    historia: [
      'Brenn passou a juventude na enfermaria do clã, entre ossos quebrados e pulmões cheios de pó de pedra. Aprendeu as orações de cura de Berronar junto com o jeito certo de imobilizar uma perna, e não sabe dizer qual das duas coisas salvou mais gente.',
      'Quando uma galeria desabou, ele tirou onze mineiros dos escombros e chegou tarde para outros três. Os anciões chamaram aquilo de milagre; ele chamou de três nomes. Saiu das montanhas para levar cura a quem não tem um santuário por perto.',
    ],
    motivo: 'A fronteira está cheia de vilas sem curandeiro, e Phandalin é uma delas. A carroça vai para lá; ele vai junto.',
    traco: 'Cantarola hinos de trabalho dos mineiros quando está nervoso.',
    ideal: 'Ninguém fica para trás num desabamento.',
    vinculo: 'Um cinto de couro com os três nomes que ele não conseguiu salvar.',
    defeito: 'Teimoso como pedra: discute até com quem tem razão.',
  },

  {
    id: 'pc-mago', name: 'Ilvan', classe: 'mago', className: 'Mago',
    raca: 'Alto elfo', ancestry: 'Elfo', sexo: 'M', look: 'wizard',
    abilities: { str: 8, dex: 16, con: 13, int: 16, wis: 12, cha: 10 },
    skills: ['arcanismo', 'investigacao', 'historia', 'percepcao'],
    speedFt: 30,
    racial: { truquesExtras: 1 },   // alto elfo: um truque de mago a mais
    antecedente: 'Sábio',
    origem: 'Elfo, aprendiz de arquivista numa biblioteca de Neverwinter.',
    historia: [
      'Ilvan passou quase um século copiando mapas que ninguém mais lia. Num deles, desenhado à mão e meio apagado, encontrou a anotação de uma mina nas colinas a leste da cidade, onde anões e gnomos teriam trabalhado lado a lado com magia, antes de tudo ruir e o lugar sumir dos registros.',
      'O mestre dele chamou aquilo de lenda de taverna e morreu sem mudar de ideia. Deixou a Ilvan um caderno de mapas com metade das páginas arrancadas e uma pergunta que não sai da cabeça dele: quem arrancou as páginas, e por quê.',
    ],
    motivo: 'Phandalin é a vila mais próxima das colinas do mapa. Uma carroça que vai para lá é o jeito mais barato de chegar.',
    traco: 'Anota tudo, inclusive o que os outros falam dormindo.',
    ideal: 'Conhecimento perdido é uma ferida no mundo.',
    vinculo: 'O caderno de mapas do mestre, que ele nunca deixa longe.',
    defeito: 'Esquece que os outros não vivem trezentos anos, e fala como se tivessem tempo.',
  },

  {
    id: 'pc-barbaro', name: 'Grask', classe: 'barbaro', className: 'Bárbaro',
    raca: 'Meio-orc', ancestry: 'Meio-orc', sexo: 'M', look: 'barbarian',
    abilities: { str: 17, dex: 13, con: 15, int: 8, wis: 12, cha: 10 },
    skills: ['atletismo', 'percepcao', 'sobrevivencia', 'intimidacao', 'natureza'],
    speedFt: 30,
    racial: {},
    antecedente: 'Forasteiro',
    origem: 'Meio-orc criado por uma tribo de caçadores das colinas do norte.',
    historia: [
      'Grask aprendeu a seguir um alce por três dias sem perder o rastro e a dormir na neve sem fogueira. Na tribo, força era a única língua que todos entendiam, e ele a falava melhor do que quase todos.',
      'Numa guerra de fronteira com outra tribo, derrubou um rapaz inimigo e se recusou a terminar o serviço. O chefe chamou aquilo de fraqueza e o expulsou. Grask desceu das colinas sem saber se tinha feito a coisa certa, só com a certeza de que faria de novo.',
    ],
    motivo: 'Precisa de comida, de prata e de um lugar onde ninguém o conheça. Guardar uma carroça resolve as três coisas.',
    traco: 'Fala pouco e sempre olha primeiro para as mãos de quem chega.',
    ideal: 'Força serve para proteger quem não a tem.',
    vinculo: 'O rapaz que ele poupou, e que ele espera um dia encontrar de novo.',
    defeito: 'Quando a raiva sobe, esquece que existe outra saída além de bater.',
  },

  {
    id: 'pc-druida', name: 'Maren', classe: 'druida', className: 'Druida',
    raca: 'Meio-elfa', ancestry: 'Meio-elfa', sexo: 'F', look: 'druid',
    abilities: { str: 8, dex: 13, con: 15, int: 12, wis: 16, cha: 12 },
    skills: ['natureza', 'lidarComAnimais', 'medicina', 'religiao', 'percepcao', 'sobrevivencia'],
    speedFt: 30,
    racial: {},
    antecedente: 'Eremita',
    origem: 'Meio-elfa, guardiã de um bosque antigo a leste de Neverwinter.',
    historia: [
      'Maren foi deixada ainda bebê aos cuidados de um círculo de druidas e cresceu entre carvalhos que já eram velhos quando a cidade foi fundada. Fala com os bichos do bosque do jeito que outros falam com vizinhos.',
      'Neste último ano as folhas começaram a cair no meio do verão, sempre do lado do bosque que dá para as colinas. Os druidas mais velhos acham que é coisa da terra. Maren acha que é coisa de gente, e saiu para descobrir de quem.',
    ],
    motivo: 'A estrada para Phandalin passa pelas colinas de onde vem a doença do bosque. Ela vai com a carroça para olhar de perto.',
    traco: 'Cheira cada folha que encontra antes de dizer qualquer coisa sobre um lugar.',
    ideal: 'O que a terra guarda, alguém tem de guardar também.',
    vinculo: 'O carvalho mais velho do bosque, que foi o primeiro a adoecer.',
    defeito: 'Confia mais num lobo do que numa pessoa, e às vezes deixa isso claro demais.',
  },

  {
    id: 'pc-bruxo', name: 'Vesh', classe: 'bruxo', className: 'Bruxo',
    raca: 'Tiferino', ancestry: 'Tiferino', sexo: 'M', look: 'warlock',
    abilities: { str: 8, dex: 13, con: 14, int: 13, wis: 10, cha: 17 },
    skills: ['enganacao', 'arcanismo', 'investigacao', 'prestidigitacao'],
    speedFt: 30,
    racial: { resistencias: ['fogo'], truques: ['taumaturgia'] },
    antecedente: 'Charlatão',
    origem: 'Tiferino nascido dentro de um culto escondido nos porões de Neverwinter.',
    historia: [
      'Vesh foi criado para ser o recipiente de alguma coisa que o culto chamava de "o convidado". Na noite do ritual, a coisa veio, mas não para o altar: veio para ele, ofereceu um acordo, e ele aceitou antes de entender o que estava aceitando.',
      'Fugiu naquela mesma noite, com uma voz nova no fundo da cabeça e o culto inteiro atrás dele. Desde então vive de pequenos golpes e de nunca dormir duas vezes no mesmo lugar. A voz às vezes ajuda. Ele ainda não sabe o que ela vai cobrar.',
    ],
    motivo: 'Uma carroça cheia de gente armada é o lugar mais seguro em que ele dorme há meses.',
    traco: 'Sorri demais quando está com medo.',
    ideal: 'Nenhum acordo é para sempre, se você ler as letras miúdas.',
    vinculo: 'O culto que o criou, que ele pretende desmontar um dia.',
    defeito: 'Mente por hábito, mesmo quando a verdade serviria melhor.',
  },

  {
    id: 'pc-feiticeira', name: 'Selane', classe: 'feiticeiro', className: 'Feiticeira',
    raca: 'Meio-elfa', ancestry: 'Meio-elfa', sexo: 'F', look: 'sorcerer',
    abilities: { str: 8, dex: 14, con: 15, int: 10, wis: 12, cha: 17 },
    skills: ['arcanismo', 'persuasao', 'historia', 'intuicao', 'enganacao', 'percepcao'],
    speedFt: 30,
    racial: {},
    antecedente: 'Nobre',
    origem: 'Meio-elfa de uma família nobre e decadente de Neverwinter.',
    historia: [
      'Na família de Selane ninguém fala da bisavó: o retrato dela foi tirado da galeria e o nome, riscado da árvore genealógica. Aos quinze anos Selane descobriu por quê, no dia em que uma discussão terminou com a cortina da sala pegando fogo sem que ninguém tivesse tocado numa vela.',
      'Desde então a magia vem quando quer, quente e com cheiro de enxofre, e às vezes deixa nas costas das mãos dela umas marcas que lembram escamas. A família a mandou para longe "para estudar". Ela foi, mas atrás de respostas sobre a bisavó, não de livros.',
    ],
    motivo: 'Uma carta da bisavó, escondida num livro da família, fala de um amigo em Phandalin que guardaria "o resto da história".',
    traco: 'Fala com a calma de quem foi ensinada a nunca levantar a voz, até a magia levantar por ela.',
    ideal: 'O nome de uma família vale o que ela faz, não o que ela esconde.',
    vinculo: 'A carta da bisavó, que ela relê toda noite.',
    defeito: 'Morre de medo do que tem no sangue, e esconde isso fingindo não ter medo de nada.',
  },

  {
    id: 'pc-paladino', name: 'Torvik', classe: 'paladino', className: 'Paladino',
    raca: 'Anão da montanha', ancestry: 'Anão', sexo: 'M', look: 'paladin',
    abilities: { str: 17, dex: 10, con: 16, int: 8, wis: 12, cha: 13 },
    skills: ['atletismo', 'persuasao', 'intimidacao', 'religiao'],
    speedFt: 25,
    racial: { resistencias: ['veneno'] },
    antecedente: 'Soldado',
    origem: 'Anão da montanha, escudeiro de uma ordem de cavalaria anã.',
    historia: [
      'Torvik serviu dez anos como escudeiro na Ordem do Martelo Claro, polindo armaduras e decorando juramentos. Na véspera de ser sagrado cavaleiro, a ordem foi acusada de entregar uma fortaleza aliada aos orcs, e foi dissolvida em desonra.',
      'Ele não acredita na acusação. Acredita menos ainda que alguém tenha se dado ao trabalho de procurar a verdade. Fez os juramentos sozinho, diante do altar vazio, e saiu para provar com os próprios atos que o nome da ordem ainda vale alguma coisa.',
    ],
    motivo: 'Proteger quem viaja pela fronteira é exatamente o que a ordem faria. E ele precisa começar por algum lugar.',
    traco: 'Cumprimenta todo mundo pelo nome e pelo ofício, como um arauto.',
    ideal: 'Um juramento só vale se for cumprido quando ninguém está olhando.',
    vinculo: 'O martelo da ordem, que ele levou da capela antes de fecharem as portas.',
    defeito: 'Não sabe recuar, nem quando recuar é a coisa certa.',
  },

  {
    id: 'pc-guardiao', name: 'Corin', classe: 'patrulheiro', className: 'Guardião',
    raca: 'Humano', ancestry: 'Humano', sexo: 'M', look: 'ranger',
    abilities: { str: 13, dex: 16, con: 14, int: 11, wis: 15, cha: 9 },
    skills: ['furtividade', 'percepcao', 'natureza', 'atletismo', 'sobrevivencia'],
    speedFt: 30,
    racial: {},
    antecedente: 'Forasteiro',
    origem: 'Humano, batedor das matas entre Neverwinter e as colinas.',
    historia: [
      'Corin cresceu numa vila de lenhadores que os goblins da região saquearam duas vezes antes de ele fazer doze anos. Na terceira, ele estava na mata, seguiu os rastros sozinho até o acampamento deles e voltou com a localização. Desde então é ele quem segue os rastros.',
      'Neste outono os rastros mudaram: mais goblins, mais organizados, e andando todos na mesma direção, para a estrada de Phandalin. Ninguém nas vilas acreditou nele. Então ele resolveu ir aonde os rastros vão.',
    ],
    motivo: 'A carroça vai exatamente para onde os goblins estão indo. Melhor estar lá quando eles chegarem.',
    traco: 'Lê o chão antes de ler as pessoas.',
    ideal: 'Quem vê o perigo primeiro tem a obrigação de avisar.',
    vinculo: 'A vila de lenhadores onde nasceu, que ainda não tem muralha.',
    defeito: 'Odeia goblins de um jeito que às vezes o deixa cego para todo o resto.',
  },

  {
    id: 'pc-monja', name: 'Sylwen', classe: 'monge', className: 'Monja',
    raca: 'Elfa da floresta', ancestry: 'Elfa', sexo: 'F', look: 'monk',
    abilities: { str: 12, dex: 17, con: 13, int: 10, wis: 15, cha: 8 },
    skills: ['acrobacia', 'intuicao', 'religiao', 'furtividade', 'percepcao'],
    speedFt: 35,
    racial: {},
    antecedente: 'Acólito',
    origem: 'Elfa da floresta, criada num mosteiro nas montanhas a norte de Neverwinter.',
    historia: [
      'Sylwen chegou ao mosteiro ainda criança, trazida por uma caravana que a encontrou sozinha na estrada, e cresceu entre monges que acreditavam que o corpo é a primeira oração. Aprendeu a quebrar uma tábua com a mão e a ficar um dia inteiro sentada sem se mexer, e acha a segunda coisa muito mais difícil.',
      'Ao completar sua formação, a mestra lhe deu a tarefa de todo discípulo: sair pelo mundo por um ano e voltar contando o que aprendeu. Sylwen ainda não sabe o que deveria aprender. Suspeita que a resposta está em quem ela encontrar pelo caminho.',
    ],
    motivo: 'Na estrada há gente que precisa de ajuda, e a regra da peregrinação é não recusar nenhum pedido honesto.',
    traco: 'Faz os exercícios do mosteiro todo amanhecer, onde quer que esteja.',
    ideal: 'A disciplina é o que sobra quando a coragem acaba.',
    vinculo: 'A mestra que a mandou em peregrinação, e a quem ela deve uma boa história.',
    defeito: 'Curiosa demais: quer entender tudo, até o que seria melhor deixar quieto.',
  },

  {
    id: 'pc-barda', name: 'Lirra', classe: 'bardo', className: 'Barda',
    raca: 'Gnoma da floresta', ancestry: 'Gnoma', sexo: 'F', look: 'bard',
    abilities: { str: 8, dex: 15, con: 13, int: 14, wis: 10, cha: 15 },
    skills: ['atuacao', 'persuasao', 'historia', 'acrobacia', 'enganacao'],
    speedFt: 25,
    racial: { truques: ['ilusaoMenor'] },   // gnomo da floresta
    antecedente: 'Artista',
    origem: 'Gnoma da floresta, menestrel das tavernas da Costa da Espada.',
    historia: [
      'Lirra coleciona canções do jeito que outros colecionam moedas: uma de cada lugar, e as mais raras guardadas para ocasiões especiais. Toca alaúde em taverna desde os quarenta anos, o que para uma gnoma é praticamente a infância.',
      'Num porão de Neverwinter ouviu de um velho minerador um pedaço de canção sobre uma caverna onde "a pedra canta de volta". Ninguém conhecia o resto. Lirra decidiu que não descansa enquanto não ouvir o fim, e de preferência na própria caverna.',
    ],
    motivo: 'O velho minerador era de Phandalin. Se a canção tem fim, alguém de lá sabe.',
    traco: 'Transforma tudo o que acontece em rima, inclusive o que não deveria.',
    ideal: 'Uma história bem contada vale mais que um tesouro mal guardado.',
    vinculo: 'O alaúde que ganhou do avô, remendado em sete lugares.',
    defeito: 'Não resiste a aumentar uma história, mesmo quando a verdade importa.',
  },
];

export const heroiPorId = (id) => HEROIS.find((h) => h.id === id) ?? null;
