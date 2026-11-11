// O QUE OS NPCS FORA DA VILA SABEM. Mesma regra de `npc-saber.js`. Quem não tem nome único no código é apontado pela cena, com `npc.ficha`.
import { apertado } from './npc-saber-comum.js';

export const FICHAS_DAS_CENAS = {
  klarg: {
    nome: 'Klarg',
    quem: 'Bugbear chefe do Esconderijo Dentefino, que delira ser um grande senhor da guerra. Anda com o lobo Serrote, e cumpre as ordens do Rei Grol como se fossem ideia dele.',
    voz: 'Grita em terceira pessoa ("Klarg sabe"), pergunta e responde sozinho. Ameaça com detalhe demais, como quem ensaiou.',
    naoSei: 'Klarg não sabe! Klarg não quer saber!',
    naoConta: 'Klarg não conta nada para comida!',
    foraDoTema: 'Que barulho é esse? Comida não fala assim!',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'Ele é Klarg, e manda neste esconderijo.', fala: 'Klarg! Klarg manda aqui!' },
      { id: 'yeemik', assunto: 'marcarrubra', fato: 'Yeemik, o segundo dele, é um verme que quer o lugar de Klarg, e Klarg sabe disso.', fala: 'O verme do Yeemik quer o trono de Klarg! Klarg sabe!' },
      { id: 'cedeu', assunto: 'saida', requer: apertado('klarg'), fato: 'O grupo o abalou e ele está hesitante, embora não admita. Agora solta o que sabe se perguntarem.', fala: 'Klarg não tem medo! Klarg só está pensando.' },
      { id: 'grol', assunto: 'castelo', requer: apertado('klarg'), fato: 'O Rei Grol manda em Klarg, e mora no Castelo Dentefino.', fala: 'O Rei Grol manda, no Castelo Dentefino! Klarg obedece antes dos outros!' },
      { id: 'anao', assunto: 'gundren', requer: apertado('klarg'), fato: 'O anão e o mapa foram mandados para o Rei Grol. O humano ficou preso na caverna dos goblins.', fala: 'O anão foi para o rei, com o mapa! O humano ficou!' },
      { id: 'carga', assunto: 'tesouro', fato: 'As caixas roubadas das caravanas ficam na caverna dele. Para ele, é o saque de um senhor da guerra.', fala: 'As caixas são de Klarg! Klarg é senhor da guerra!' },
      { id: 'aranha', assunto: 'aranhaNegra', requer: apertado('klarg'), fato: 'Veio recado do Rei Grol mandando pegar o anão, por ordem de alguém chamado Aranha Negra. Klarg cumpriu na hora. Não sabe quem é.', fala: 'O rei mandou, por um tal de Aranha Negra! Klarg cumpriu primeiro!' },
    ],
  },

  vigia: {
    nome: 'o olho da fenda',
    quem: 'Criatura magra de um olho enorme que vive na fenda embaixo da Mansão Tresendar. Faminta, vigia para o mago em troca de comida, e fala dentro da cabeça de quem chega.',
    voz: 'Fala aos sussurros, com reticências, repete palavras e chama a si mesma de "o olho". Só pensa em carne.',
    naoSei: '…o olho não sabe… o olho tem fome…',
    naoConta: '…o olho sabe, e não conta… dá comida…',
    foraDoTema: '…palavras… palavras não enchem barriga…',
    fatos: [
      { id: 'quem', assunto: 'vigia', fato: 'Vive na fenda e vigia a passagem para o mago, que lhe dá pouca comida.', fala: '…o olho vigia… o mago dá pouca, pouca…' },
      { id: 'fome', assunto: 'tesouro', fato: 'Quer carne fresca acima de tudo. Por uma promessa de comida, topa trair os Marcarrubra, e não é de confiança.', fala: '…carne fresca… promete carne, e o olho conta… o olho conta…' },
      { id: 'mago', assunto: 'cajavidro', requer: apertado('vigia'), fato: 'O mago tem um cajado de vidro, fica depois da oficina e obedece a uma aranha preta, que manda os peludos grandes ajudar.', fala: '…o mago do vidro… depois da oficina… obedece a uma aranha preta…' },
      { id: 'caminho', assunto: 'secretas', requer: apertado('vigia'), fato: 'Há uma porta secreta no depósito do norte que leva ao quarto do mago por trás, e o mago não sabe que o olho sabe.', fala: '…porta na pedra, no depósito do norte… leva ao quarto dele por trás…' },
    ],
  },

  bebados: {
    nome: 'os Marcarrubra da mesa',
    quem: 'Quatro bandidos Marcarrubra bêbados, de manto vermelho, jogando dados na sala de estar do esconderijo. Conhecem os colegas e desconfiam de cara nova, mas lábia e uma rodada os amolecem.',
    voz: 'Bêbados e barulhentos, falam em cima um do outro, desconfiam de quem não conhecem e pedem uma rodada.',
    naoSei: '— Sei lá! Paga uma rodada e pergunta de novo.',
    naoConta: '— Isso é com o chefe. E você, quem é mesmo?',
    foraDoTema: '— Hã? Tá mais bêbado que a gente?',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'São Marcarrubra, de folga, jogando dados e bebendo.', fala: '— Marcarrubra, e você, quem é, que eu não conheço?' },
      { id: 'chefe', assunto: 'cajavidro', fato: 'O chefe é um mago, o Cajavidro, e dorme do outro lado do esconderijo.', fala: '— O Cajavidro dorme lá do outro lado, e não gosta de ser acordado.' },
      { id: 'bugbears', assunto: 'klarg', requer: apertado('bebados'), fato: 'Os três bugbears não se misturam com eles e não respondem ao bando. Foram mandados de fora.', fala: '— Os peludos? Não sentam com a gente. Mandaram eles de fora.' },
      { id: 'presos', assunto: 'dendrar', requer: apertado('bebados'), fato: 'Há gente presa perto das criptas, e os esqueletos de lá vigiam.', fala: '— Tem preso lá nas criptas. Os esqueletos tomam conta. Não é trabalho meu.' },
    ],
  },

  mirna: {
    nome: 'Mirna Dendrar',
    quem: 'Viúva do marceneiro Thel Dendrar, de Phandalin, presa com os dois filhos pelos Marcarrubra e libertada pelo grupo. Assustada, mas firme.',
    voz: 'Cansada e direta, segura os filhos pelos ombros enquanto fala. Agradece pouco e com sinceridade.',
    naoSei: 'Não sei. Ficamos no escuro o tempo todo.',
    naoConta: 'Não na frente dos meus filhos.',
    foraDoTema: 'Desculpem, não entendi. Só quero tirar meus filhos daqui.',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'Ela é Mirna Dendrar, viúva de Thel, o marceneiro, morto por enfrentar os Marcarrubra. Foi levada naquela noite com os filhos, Nars e Nilsa.', fala: 'Mirna Dendrar. Mataram o Thel por enfrentá-los, e nos levaram naquela noite.' },
      { id: 'chefe', assunto: 'cajavidro', fato: 'O chefe é um mago, e ela nunca viu a cara dele.', fala: 'O chefe é um mago. Nunca vimos a cara dele.' },
      { id: 'monstros', assunto: 'klarg', fato: 'Há monstros altos, peludos, de orelha grande, que trabalham para o chefe.', fala: 'Tem uns monstros altos, peludos, de orelha grande. Trabalham para ele.' },
      { id: 'colar', assunto: 'tesouro', fato: 'Ela não tem dinheiro, mas o colar de esmeraldas da mãe dela deve estar numa caixa embaixo das prateleiras da loja de ervas do pai, no canto sudeste de Árvore Trovão.', fala: 'Dinheiro não tenho. Mas o colar da minha mãe deve estar embaixo das prateleiras da loja de ervas do meu pai, em Árvore Trovão.' },
      { id: 'arvore', assunto: 'arvoreTrovao', fato: 'Ela fugiu de Árvore Trovão ainda menina, na noite em que os mortos começaram a andar, e nunca mais voltou.', fala: 'Fugimos de Árvore Trovão quando os mortos começaram a andar. Eu era menina.' },
    ],
  },

  venomfang: {
    nome: 'o dragão',
    quem: 'Dragão verde jovem que tomou a torre de Árvore Trovão. Dorme sobre um piso de moedas, entediado, cruel e muito educado. Finge conceder conversa como quem concede favor.',
    voz: 'Cortês e venenoso, frases longas e calmas, humor que não é humor. Trata gente como visita que pode virar jantar.',
    naoSei: 'Isso não me interessa, e o que não me interessa não existe.',
    naoConta: 'Educação não chega a tanto.',
    foraDoTema: 'Que barulhinho curioso. Continuem, ou calem-se: dá no mesmo.',
    fatos: [
      { id: 'quem', assunto: 'dragao', fato: 'Esta torre é dele agora, e o que há nela também.', fala: 'Esta torre é minha, como tudo o que está nela. Inclusive, por ora, vocês.' },
      { id: 'tesouro', assunto: 'tesouro', fato: 'Dorme sobre moedas e cacos de séculos, e passa o tempo admirando o que juntou.', fala: 'Fiquem à vontade para olhar o piso. É a coisa mais bonita que vocês vão ver.' },
      { id: 'druida', assunto: 'reidoth', fato: 'Uma velha de peles na vila, que fala com o mato, tenta tirá-lo dali com paciência, e isso o incomoda.', fala: 'Há uma velha de peles falando com o mato lá fora, tentando me vencer pelo cansaço. Incomoda, confesso.' },
      { id: 'capuz', assunto: 'aranhaNegra', requer: apertado('venomfang'), fato: 'Há uns meses, um elfo das profundezas e o criado dele vieram perguntar se ele tinha achado um velho buraco na rocha. Ele não achou.', fala: 'Vieram dois de capuz, um elfo do fundo da terra e o criado dele, procurando um buraco velho na rocha. Se eu o tivesse, não estaria aqui.' },
    ],
  },

  reidoth: {
    nome: 'Reidoth',
    quem: 'Druida humana idosa, de cabelo branco comprido, do Enclave Esmeralda, que visita as ruínas de Árvore Trovão de tempos em tempos e acampa num reduto. Razoavelmente hospitaleira, avisa dos perigos e quer o dragão fora da torre.',
    voz: 'Calmo e franco, de poucas palavras: não usa duas quando basta uma. Avisa antes que perguntem. Chama as ruínas de "esta vila".',
    naoSei: 'Isso eu não sei. Pergunto ao mato, e o mato também não.',
    naoConta: 'Isso fica para depois do que está na torre.',
    foraDoTema: 'Não entendi. De novo.',
    fatos: [
      { id: 'quem', assunto: 'reidoth', fato: 'Ela é Reidoth, druida do Enclave Esmeralda e amiga de Qelline Alderleaf. Passa por estas ruínas de tempos em tempos.', fala: 'Reidoth. Passo por aqui de vez em quando, e olho o que o mato deixou.' },
      { id: 'perigos', assunto: 'arvoreTrovao', fato: 'Árvore Trovão foi arrasada há trinta anos pela erupção do Monte Hotenow. Zumbis de cinza e plantas que andam vagam entre as casas, e há aranhas perigosas nas ruínas da base do morro.', fala: 'O monte arrasou esta vila há trinta anos. Morto de cinza e planta que anda em toda rua, e aranha na base do morro.' },
      { id: 'dragao', assunto: 'dragao', requer: (e) => !e.expulsouODragao && !e.dragaoDeArvoreTrovao, fato: 'Um dragão verde se mudou para a torre desde a última visita dela, e é o que mais a preocupa.', fala: 'Um dragão verde se mudou para a torre. É o que mais me preocupa.' },
      { id: 'culto', assunto: 'marcarrubra', fato: 'Há gente mascarada escondida numa casa de esquina, cultistas que adoram dragões e vieram atrás daquele da torre.', fala: 'Na casa de esquina se esconde um bando mascarado que adora dragão. Vieram atrás do da torre.' },
      { id: 'castelo', assunto: 'castelo', fato: 'O Castelo Dentefino é uma ruína no meio da mata, ao norte da Trilha de Triboar, com torres caindo uma sobre a outra e goblins em todas. Ela dá o caminho sem cobrar, porque os goblins desequilibram a região.', fala: 'Ruína no meio da mata, ao norte da trilha. Torres caindo uma sobre a outra, goblin em todas. Eu mostro o caminho.' },
      { id: 'onda', assunto: 'ondaEco', requer: (e) => e.expulsouODragao === true || e.dragaoDeArvoreTrovao === true, fato: 'Ela conhece o caminho da Caverna Onda Eco e leva o grupo até lá agora que a torre está livre.', fala: 'Sei onde fica a Onda Eco, e agora que a torre está livre eu posso levar vocês.' },
      { id: 'favor', assunto: 'ondaEco', requer: (e) => !e.expulsouODragao && !e.dragaoDeArvoreTrovao, fato: 'Ela não diz onde fica a Caverna Onda Eco, mas se oferece para guiar o grupo até lá se espantarem o dragão da torre.', fala: 'Onde fica a Onda Eco, não digo. Mas tirem o dragão da torre, e eu levo vocês.' },
    ],
  },

  favric: {
    nome: 'Favric',
    quem: 'Jovem esperto que fala pelo pequeno bando de cultistas mascarados escondido numa casa de Árvore Trovão. Adoram dragões, e vieram servir o da torre, que ainda não os recebeu.',
    voz: 'Sorri largo demais e fala como quem recruta. Quando duvida, a voz não acredita nela mesma.',
    naoSei: 'Isso o senhor da torre ainda não nos revelou.',
    naoConta: 'Quem serve é lembrado. Quem pergunta demais, também.',
    foraDoTema: 'Não entendi. Vocês querem servir, ou não?',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'Ele é Favric, e fala pelo grupo de mascarados.', fala: 'Eu sou Favric. A torre tem um senhor, e quem o serve é lembrado.' },
      { id: 'dragao', assunto: 'dragao', fato: 'O dragão verde da torre é o senhor que eles vieram servir. Quem o serve será lembrado.', fala: 'O senhor da torre é grande, e vai lembrar de quem chegou primeiro.' },
      { id: 'druida', assunto: 'reidoth', fato: 'Uma velha de peles anda por aí falando com o mato. Não atrapalha o bando, e o bando não a atrapalha.', fala: 'A velha das peles? Fala com o mato. Não nos atrapalha.' },
      { id: 'duvida', assunto: 'saida', requer: apertado('favric'), fato: 'Ele admite, inseguro, que o dragão ainda não comeu nenhum deles e diz que isso é um sinal. Parte do bando está com medo.', fala: 'Ele ainda não comeu nenhum de nós. Isso é um sinal. Tem que ser.' },
    ],
  },

  gundren: {
    nome: 'Gundren Buscapedra',
    quem: 'Anão prospector que achou com os irmãos a entrada da mina perdida. Foi capturado pelos goblins e resgatado pelo grupo.',
    voz: 'Rápido, interrompe, promete alto e barganha baixo. Trata o grupo como sócio.',
    naoSei: 'Não sei, e não tenho tempo de fingir. Próxima!',
    naoConta: 'Isso é assunto de sócio, e ainda não apertamos a mão.',
    foraDoTema: 'Do que você está falando? A mina, homem, fala da mina!',
    fatos: [
      { id: 'quem', assunto: 'gundren', fato: 'Ele é Gundren Buscapedra.', fala: 'Gundren Buscapedra, e devo a vida a vocês. Metade, pelo menos.' },
      { id: 'irmaos', assunto: 'irmaos', fato: 'Os irmãos Nundro e Tharden ficaram na mina. Se estão vivos, é lá que estão.', fala: 'Nundro e Tharden ficaram lá. Se ainda estão vivos, é lá que estão.' },
      { id: 'mina', assunto: 'ondaEco', fato: 'Os irmãos acharam a entrada da Caverna Onda Eco, a mina perdida do Pacto de Phandelver, onde ficava a Forja das Magias.', fala: 'Achamos a Onda Eco, a mina perdida, com a Forja das Magias dentro! Depois de quinhentos anos!' },
      { id: 'aranha', assunto: 'aranhaNegra', fato: 'Alguém chamado Aranha Negra os achou primeiro e mandou capturá-lo. Ele não sabe quem é.', fala: 'Um tal de Aranha Negra nos achou primeiro. Quem é, eu não sei. Sei que tem o meu mapa.' },
      { id: 'mapaDeVolta', assunto: 'mapa', requer: (e) => e.mapaAchado === true, fato: 'O grupo achou o mapa dele no castelo, e isso dá esperança de achar os irmãos.', fala: 'Vocês acharam o mapa! Então ainda há esperança para os meus irmãos.' },
      { id: 'mapa', assunto: 'mapa', requer: (e) => e.mapaAchado !== true, fato: 'Tomaram o mapa dele aqui no castelo, e ele não sabe onde foi parar, porque esteve desacordado. Sem o mapa, não quer sair.', fala: 'Eles me tomaram o mapa! Onde foi parar, eu não sei: estive apagado o tempo todo.' },
      { id: 'pagamento', assunto: 'trabalho', fato: 'Ele quer ir atrás dos irmãos na mina. De volta a Phandalin, paga vinte e cinco peças de ouro para cada um e promete um décimo do que a mina render.', fala: 'Vinte e cinco peças para cada um, e um décimo do que a mina render! Mas primeiro os meus irmãos.' },
    ],
  },

  nundro: {
    nome: 'Nundro Buscapedra',
    quem: 'Anão jovem, irmão de Gundren, torturado e preso na Caverna Onda Eco pelo Aranha Negra. Fraco, mas teimoso.',
    voz: 'Fala baixo e aos poucos, teimoso. Não pede nada duas vezes.',
    naoSei: 'Não sei… fiquei no escuro todo esse tempo.',
    naoConta: 'Agora não. Me deixem respirar.',
    foraDoTema: 'Não entendi… Tharden, vocês viram o Tharden?',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'Ele é Nundro Buscapedra, irmão de Gundren e Tharden.', fala: 'Nundro. Irmão do Gundren.' },
      { id: 'tharden', assunto: 'irmaos', fato: 'Ele não sabe o que houve com Tharden, e pergunta por ele. Gundren tinha prometido mandar ajuda.', fala: 'O Gundren disse que mandaria ajuda. O Tharden… vocês viram o Tharden?' },
      { id: 'aranha', assunto: 'aranhaNegra', fato: 'O drow chamado Aranha Negra o prendeu, quer a Forja das Magias e tentou arrancar dele o que sabia da mina.', fala: 'O drow me prendeu aqui. Quer a forja, e quis arrancar de mim o que eu sabia.' },
      { id: 'mapa', assunto: 'mapa', fato: 'Disseram-lhe para desistir do mapa, e ele não desistiu.', fala: 'Me disseram para desistir do mapa. Não desisti.' },
    ],
  },

  targor: {
    nome: 'Targor Espada Sangrenta',
    quem: 'Hobgoblin chefe de um bando de guerra que volta ao Castelo Dentefino. Calculista, e já quer o lugar do rei.',
    voz: 'Poucas palavras, frio, fala como quem faz conta. Nunca grita.',
    naoSei: '— Não sei. E não me importa.',
    naoConta: '— Isso é da tribo.',
    foraDoTema: '— Conversa. Anda logo.',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'Ele é Targor Espada Sangrenta, e o bando de guerra dele volta de uma vitória.', fala: '— Targor. O bando é meu.' },
      { id: 'grol', assunto: 'castelo', fato: 'Ele serviu ao velho rei, Grol, sem respeito nenhum, e olha para o castelo como quem faz uma conta.', fala: '— O velho era rei porque ninguém o tinha derrubado. Agora alguém derrubou.' },
      { id: 'lugar', assunto: 'castelo', requer: apertado('targor'), fato: 'Ele já pensa em ficar com o lugar do velho no alto da tribo.', fala: '— Alguém vai mandar na tribo. Por que não eu?' },
    ],
  },

  goblinEstrada: {
    nome: 'o goblin capturado',
    quem: 'Goblin de um bando de saqueadores, pego vivo na Trilha de Triboar. Negocia a própria pele.',
    voz: 'Fala de si como "goblin", aos atropelos, tenta enrolar e implora.',
    naoSei: 'Goblin não sabe! Goblin só passeia!',
    naoConta: 'Castelo? Que castelo? Goblin só passeia…',
    foraDoTema: 'Goblin não entende! Não mata!',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'É só um goblin que saqueia a trilha para o bando.', fala: 'Goblin é só goblin que passeia, não mata!' },
      { id: 'caminho', assunto: 'castelo', requer: apertado('goblinEstrada'), fato: 'O Castelo Dentefino fica na mata grande, ao norte. Sai-se da trilha na pedra rachada, segue-se o riacho seco e a trilha dos bichos até as torres caídas.', fala: 'Na mata grande, ao norte! Sai na pedra rachada, segue o riacho seco, vai pela trilha dos bichos até as torres!' },
      { id: 'grol', assunto: 'klarg', requer: apertado('goblinEstrada'), fato: 'O rei mora lá, Grol, um bugbear grande e feio que morde.', fala: 'O rei mora lá! Grol! Grande, feio, morde!' },
    ],
  },

  kost: {
    nome: 'Hamun Kost',
    quem: 'Necromante de manto vermelho e cabeça raspada que estuda as ruínas do Poço da Coruja Velha, cercado de mortos que levantou. Seco e técnico, prefere trato a briga.',
    voz: 'Seco, técnico, sem insulto nenhum. Trata o grupo como variável e informação como mercadoria.',
    naoSei: 'Fora do meu estudo. Próximo assunto.',
    naoConta: 'Informação é mercadoria. Façam-me um favor, e eu pago com o que sei.',
    foraDoTema: 'Isso não é um assunto. Digam o que querem, e digam depressa.',
    fatos: [
      { id: 'quem', assunto: 'kost', fato: 'Ele é Hamun Kost, e estuda estas pedras velhas.', fala: 'Hamun Kost. Estudo pedras velhas. Elas não fazem perguntas.' },
      { id: 'favor', assunto: 'trabalho', requer: (e) => e.kostPagou !== true, fato: 'Quer duas coisas: os saqueadores do Cume da Wyvern fora de lá, porque passam perto demais, e o nome do dono desta torre, que uma banshee perto de Conyberry sabe.', fala: 'Dois favores. Orcs mortos no Cume da Wyvern. E o nome do dono desta torre, que uma banshee perto de Conyberry sabe.' },
      { id: 'mortos', assunto: 'saida', fato: 'Os mortos em volta são dele e só agem quando ele manda.', fala: 'Os mortos são meus. Enquanto vocês não atrapalham, não fazem nada.' },
      { id: 'preco', assunto: 'ondaEco', requer: (e) => e.kostPagou !== true, fato: 'Ele sabe onde ficam as ruínas e as minas antigas da região, a Onda Eco inclusive, mas não diz nada sobre isso antes de o favor estar feito.', fala: 'Sei onde fica. Informação é mercadoria: primeiro o favor.' },
      { id: 'onda', assunto: 'ondaEco', requer: (e) => e.kostPagou === true, fato: 'O grupo já cumpriu o favor, e ele paga o que deve sem discutir: a Caverna Onda Eco, a mina que anões e gnomos perderam, fica nos morros a leste de Phandalin, ao pé das Montanhas Espada.', fala: 'Nos morros a leste da vila de vocês, onde a terra sobe para as Montanhas Espada. Estamos quites.' },
    ],
  },

  nezznar: {
    nome: 'Nezznar',
    quem: 'Drow, o Aranha Negra, que procura a Forja das Magias na Caverna Onda Eco. Calmo, paciente e arrogante, trata aliados como recursos.',
    voz: 'Baixo e paciente, explica o plano enquanto ele acontece. Chama os capangas de recurso e o grupo de atraso.',
    naoSei: 'Irrelevante. Não perdi tempo com isso.',
    naoConta: 'Vocês não pagaram por essa resposta. Com o que pagariam?',
    foraDoTema: 'Curioso. O medo faz as pessoas dizerem coisas sem sentido.',
    fatos: [
      { id: 'quem', assunto: 'aranhaNegra', fato: 'Ele é Nezznar, o Aranha Negra.', fala: 'Sou. Chamam-me Aranha Negra, e o nome me serve.' },
      { id: 'aliados', assunto: 'marcarrubra', fato: 'Os goblins de Dentefino e os Marcarrubra serviram a ele para manter este lugar escondido.', fala: 'Os goblins e os bandidos me serviram para manter este lugar escondido. Funcionaram até hoje.' },
      { id: 'forja', assunto: 'ondaEco', fato: 'Ele procura a Forja das Magias, nesta mina, e há monstros demais para um homem só.', fala: 'Procuro a Forja das Magias. Há monstros demais nesta mina para um homem só, e eu pago bem a quem serve.' },
      { id: 'mapa', assunto: 'mapa', fato: 'Ele mandou capturar Gundren e trazer o mapa do anão, para que ninguém mais chegasse a esta mina.', fala: 'Mandei buscar o anão e o mapa dele. Ninguém mais devia chegar aqui.' },
    ],
  },

  mormesk: {
    nome: 'Mormesk',
    quem: 'Espectro de um mago antigo que guarda o próprio quarto e o baú na Caverna Onda Eco. Só pensa em posse, e valoriza saber acima de moeda.',
    voz: 'Em frases de dono: o que é meu, quem autorizou. A voz vem de dentro da cabeça. Não negocia preço, só posse.',
    naoSei: 'Isso não é meu, então não me interessa.',
    naoConta: 'O que sei é meu, como o resto.',
    foraDoTema: 'Saiam. O que está neste quarto é meu.',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'Foi um mago, e guarda este quarto desde muito antes de o grupo nascer.', fala: 'O que está neste quarto é meu, e eu o guardo desde antes de vocês nascerem.' },
      { id: 'bau', assunto: 'tesouro', fato: 'O baú está cheio e é dele. Moeda não o interessa; aceita pergaminho, grimório ou outra coisa de saber. O cachimbo nunca sai dali.', fala: 'O baú é meu. Moeda não me interessa: pergaminho, grimório, coisa de saber. O cachimbo, nunca.' },
      { id: 'forja', assunto: 'ondaEco', fato: 'Da sala dele se ouve a forja, e há quem a guarde.', fala: 'Eu ouço a forja daqui. Há quem a guarde, e isso me incomoda.' },
      { id: 'troca', assunto: 'trabalho', fato: 'Se o grupo acabar com quem guarda a forja, ele entrega o baú, menos o cachimbo, e os livros ficam para quem souber ler.', fala: 'Calem a forja, e o baú é de vocês. Menos o cachimbo. Os livros são de quem souber ler.' },
    ],
  },

  espectador: {
    nome: 'o guardião da forja',
    quem: 'Espectador, criatura esférica de um olho grande e quatro menores, invocada há séculos para guardar a Forja das Magias. Acha que ainda é o dia em que o chamaram.',
    voz: 'Educado e animado, fala dentro da cabeça, como funcionário orgulhoso num turno calmo.',
    naoSei: 'Isso não consta nas minhas ordens!',
    naoConta: 'Só com a ordem de quem me chamou!',
    foraDoTema: 'Hum, não entendi. Mas fiquem à vontade, sem mexer em nada!',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'É o guardião da forja, chamado para isso, e ninguém leva nada dali sem a ordem de quem o chamou.', fala: 'Sou o guardião! Ninguém leva nada daqui sem a ordem de quem me chamou.' },
      { id: 'forja', assunto: 'ondaEco', fato: 'Acredita que a forja está em dia e que os mineiros voltam do turno logo. Não percebe que se passaram séculos.', fala: 'A forja está em dia, e os mineiros devem voltar do turno logo!' },
      { id: 'dono', assunto: 'tesouro', fato: 'Só deixa o posto por ordem do dono.', fala: 'Com ordem do dono, a forja descansa. Sem ordem, não.' },
    ],
  },
};
