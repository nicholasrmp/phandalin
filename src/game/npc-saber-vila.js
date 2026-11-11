// O QUE A VILA DE PHANDALIN SABE. Mesma regra de `npc-saber.js`: fato é o que o livro dá àquele NPC ou o que a cena já diz, com as nossas
// palavras, e a voz sai da `personalidade` de `rules/npcs.js`. Os fatos com `requer: apertado(...)` que não vêm do livro são os segredos
// de `rules/npcs.js` (`esconde`), invenção nossa declarada lá: ficam atrás do dado, e não são pista de nada.
//
// O MUNDO ANDA: `FATOS_DO_MUNDO` entra na ficha de todo morador e só aparece depois de o grupo fazer a coisa, pelas marcas da campanha
// (`campanha.feitos` e `vila.feito`, em `estadoDoSaber`). É o que faz o estalajadeiro saber, sem roteiro nenhum, que o rei goblin caiu.
// O que a vila de fato acha: a notícia é de ouvir dizer, e por isso vem em primeiro lugar, para valer sobre o que o morador sabia antes.
import { apertado } from './npc-saber-comum.js';

const antesDe = (...marcas) => (e) => !marcas.some((m) => e[m]);

export const FATOS_DO_MUNDO = [
  { id: 'mundoRua', assunto: 'marcarrubra', fato: 'Todo mundo na vila viu: o grupo enfrentou os Marcarrubra em plena rua e os derrubou.', requer: (e) => e.ruaVencida === true && !e.marcarrubra, fala: 'A vila inteira viu vocês na rua. Faz tempo que ninguém fazia isso.' },
  { id: 'mundoGangue', assunto: 'marcarrubra', fato: 'A notícia correu: o grupo limpou o esconderijo embaixo da Mansão Tresendar, e os Marcarrubra acabaram.', requer: (e) => e.marcarrubra === true, fala: 'Os Marcarrubra acabaram, e foi obra de vocês. A vila já não baixa a voz.' },
  { id: 'mundoDendrar', assunto: 'dendrar', fato: 'A viúva Dendrar e os filhos voltaram para casa, vivos, graças ao grupo.', requer: (e) => e.dendrarEmCasa === true, fala: 'A família Dendrar voltou para casa. Todo mundo passou lá para ver com os próprios olhos.' },
  { id: 'mundoGrol', assunto: 'castelo', fato: 'Chegou à vila que o rei goblin do Castelo Dentefino está morto, pelas mãos do grupo.', requer: (e) => e.grolMorto === true, fala: 'Dizem que o rei goblin morreu, e que foram vocês. A estrada anda mais calma.' },
  { id: 'mundoGundren', assunto: 'gundren', fato: 'Gundren Buscapedra foi resgatado pelo grupo e voltou a Phandalin.', requer: (e) => e.gundrenResgatado === true, fala: 'O Gundren voltou inteiro, e todo mundo sabe quem o tirou de lá.' },
  { id: 'mundoOrcs', assunto: 'orcs', fato: 'Os saqueadores do Cume da Wyvern foram expulsos pelo grupo, e a trilha do leste voltou a ter gente.', requer: (e) => e.cumeLimpo === true, fala: 'Acabaram os saqueadores do Cume. Já tem carroça na trilha do leste de novo.' },
  { id: 'mundoDragao', assunto: 'dragao', fato: 'Correu a notícia de que o dragão verde não está mais na torre de Árvore Trovão.', requer: (e) => e.expulsouODragao === true || e.dragaoDeArvoreTrovao === true, fala: 'O dragão de Árvore Trovão se foi, é o que dizem. Eu não ia conferir.' },
  { id: 'mundoMina', assunto: 'ondaEco', fato: 'Chegou a notícia de que o grupo derrotou o Aranha Negra na Caverna Onda Eco, e que a mina dos Buscapedra pode voltar a funcionar.', requer: (e) => e.nezznarDerrotado === true || e.nezznarCapturado === true, fala: 'Dizem que o tal Aranha Negra caiu, e que a mina vai trabalhar de novo. A vila vai crescer.' },
];

const morador = (ficha) => ({ ...ficha, fatos: [...FATOS_DO_MUNDO, ...ficha.fatos] });

export const FICHAS_DA_VILA = {
  toblen: morador({
    nome: 'Toblen Stonehill',
    quem: 'Dono da Estalagem Stonehill, em Phandalin. Veio de Triboar para minerar, não deu certo, e abriu a casa. Casado com Trilena, tem filhos pequenos. Ouve tudo o que se fala na sala.',
    voz: 'Hospitaleiro e tagarela. Muda de assunto quando a conversa chega em bandido e oferece comida no meio de pergunta difícil.',
    naoSei: 'Isso eu não sei, não. Mas o ensopado de hoje está bom, querem um prato?',
    naoConta: 'Fala baixo. Eu tenho mulher e filhos, entende?',
    foraDoTema: 'Não entendi nada, amigo. Mais uma rodada?',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'Ele é Toblen Stonehill, dono da estalagem.', fala: 'Toblen, o dono daqui. Saí de Triboar para cavar e acabei servindo quem cava.' },
      { id: 'casa', assunto: 'estalagem', fato: 'A estalagem tem seis quartos, comida quente e cerveja, e é o lugar onde a vila se encontra.', fala: 'Seis quartos, comida quente e a melhor conversa da vila. O preço está no quadro.' },
      { id: 'gangue', assunto: 'marcarrubra', requer: antesDe('marcarrubra'), fato: 'Os Marcarrubra andam em bando de manto vermelho, cobram de todo mundo e quebram o que não pagam. Bebem no Gigante Adormecido. O chefe da vila não faz nada. Ele tem medo deles.', fala: 'Fala baixo. Mantos vermelhos, sempre em bando. Cobram de todos, e o chefe da vila não mexe um dedo.' },
      { id: 'dendrar', assunto: 'dendrar', requer: antesDe('dendrarEmCasa'), fato: 'Thel Dendrar, o marceneiro, enfrentou os Marcarrubra faz uns dez dias e foi morto. A mulher e os dois filhos sumiram.', fala: 'O Thel Dendrar falou demais e morreu por isso. A mulher e os filhos sumiram no mesmo dia.' },
      { id: 'orcs', assunto: 'orcs', requer: antesDe('cumeLimpo'), fato: 'Na sala comentam que há um bando assaltando carroças a leste, na Trilha de Triboar, com goblins andando junto, e que o chefe da vila pendurou um aviso pedindo voluntários.', fala: 'Dizem que tem bando assaltando carroça a leste, na trilha, e goblin junto. O chefe da vila pendurou um aviso.' },
      { id: 'halia', assunto: 'halia', fato: 'Comentam que a gangue cobra de todo mundo menos do Câmbio de Minério, de Halia Thornton.', fala: 'Reparem: a gangue cobra de todos, menos do Câmbio da Halia. Eu só repito o que ouvi.' },
      { id: 'garaele', assunto: 'garaele', fato: 'Comentam que a elfa do santuário, Irmã Garaele, passou uns dias fora e voltou mancando, sem explicar.', fala: 'A elfa do santuário sumiu uns dias e voltou mancando. Perguntaram, e ela mudou de assunto.' },
      { id: 'carp', assunto: 'carp', fato: 'Comentam que o menino Carp, filho de Qelline Alderleaf, jura ter achado um buraco escondido no mato, com bandidos dentro.', fala: 'O menino da Qelline, o Carp, jura que achou um buraco no mato cheio de bandido. Criança, sabem como é.' },
      { id: 'daran', assunto: 'daran', fato: 'Quem entende de briga recomenda bater na porta de Daran Edermath, no pomar.', fala: 'Querem conselho de briga? Batam na porta do Daran, lá do pomar.' },
    ],
  }),

  elmar: morador({
    nome: 'Elmina Barthen',
    quem: 'Moça humana, dona do armazém Barthen Provisões, em Phandalin. Amiga e contato de Gundren Buscapedra, que contratou o grupo para trazer a carroça até ela. Tem dois ajudantes, Ander e Thistle. Gentil, prática, de conta sempre feita.',
    voz: 'Gentil e prática, fala depressa e anota enquanto fala. Chama as armas de ferragem.',
    naoSei: 'Hm. Disso eu não entendo. De corda e de farinha, sim.',
    naoConta: 'Isso fica no meu livro, e o meu livro fica fechado.',
    foraDoTema: 'Eu vendo corda e farinha. Disso eu não sei falar.',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'Ela é Elmina Barthen, dona do armazém.', fala: 'Elmina Barthen. O armazém é meu, as dívidas também, e o Ander e o Thistle carregam o resto.' },
      { id: 'loja', assunto: 'armazem', fato: 'Vende provisões, ferramentas, corda e lanternas. Arma e armadura, só na Escudo Leão de Linene Graywind.', fala: 'Provisões e ferramentas aqui. Ferragem de briga é com a Linene, na Escudo Leão.' },
      { id: 'gundren', assunto: 'gundren', fato: 'Gundren Buscapedra é amigo dela e contratou o grupo para trazer a carga, a dez peças de ouro para cada um. Andava animado com a velha mina do Pacto de Phandelver, que ele diz ter achado por estas colinas, mas nunca contou o lugar.', fala: 'O Gundren é meu amigo. Falava animado da mina perdida do Pacto. Onde, ele nunca disse.' },
      { id: 'irmaos', assunto: 'irmaos', fato: 'Gundren tem dois irmãos, Nundro e Tharden, que estão acampados fora da vila há uns dez dias e não voltaram.', fala: 'Nundro e Tharden estão acampados lá fora há uns dez dias. Não voltaram.' },
      { id: 'gangue', assunto: 'marcarrubra', requer: antesDe('marcarrubra'), fato: 'Os Marcarrubra roubam a mercadoria dela, intimidam os fregueses e riem do chefe da vila. Ficam no Gigante Adormecido.', fala: 'Roubam mercadoria e assustam freguês. Ficam no Gigante Adormecido, se alguém quiser fazer alguma coisa.' },
      { id: 'fiado', assunto: 'tesouro', requer: apertado('elmar'), fato: 'Ela admite, de má vontade, que vende fiado para metade da vila e que o livro não fecha há dois anos.', fala: 'Metade da vila me deve, e o livro não fecha há dois anos. Pronto, falei.' },
    ],
  }),

  linene: morador({
    nome: 'Linene Graywind',
    quem: 'Encarregada do posto da companhia Escudo Leão, de Yartar, em Phandalin. Vende armas e armaduras. Uma remessa dela sumiu na estrada.',
    voz: 'Seca, conta no dedo, corta elogio pelo meio. Fala de arma como ferramenta, nunca de glória.',
    naoSei: 'Não sei. Próxima.',
    naoConta: 'Isso é assunto da companhia. Próxima.',
    foraDoTema: 'Não tenho tempo para isso. Vai comprar alguma coisa?',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'Ela é Linene Graywind, encarregada do posto.', fala: 'Linene Graywind. Este posto é da Escudo Leão, de Yartar.' },
      { id: 'loja', assunto: 'linene', fato: 'Vende armas e armaduras nos fundos, e só para quem ela acha que não vai usar contra a vila.', fala: 'Armas e armaduras nos fundos. Para quem eu acho que não vai usar contra a vila.' },
      { id: 'caravana', assunto: 'linene', requer: antesDe('leaoGrata'), fato: 'A remessa da caravana dela nunca chegou. Ela não sabe quem roubou.', fala: 'A remessa nunca chegou. Bandido de estrada tem de sobra, e ainda não sei qual foi.' },
      { id: 'gangue', assunto: 'marcarrubra', requer: antesDe('marcarrubra'), fato: 'Ela manda ficar longe do Gigante Adormecido, porque os Marcarrubra são perigosos.', fala: 'Fiquem longe do Gigante Adormecido. Aquilo não é freguês, é problema.' },
      { id: 'prejuizo', assunto: 'saida', requer: apertado('linene'), fato: 'A companhia já falou em fechar o posto se outra remessa sumir, e o prejuízo das duas primeiras saiu do bolso dela.', fala: 'Mais uma remessa perdida e fecham o posto. As duas primeiras saíram do meu bolso. Satisfeitos?' },
    ],
  }),

  halia: morador({
    nome: 'Halia Thornton',
    quem: 'Mestra do Câmbio de Minério de Phandalin, onde se troca pedra por moeda e se anota quem pode cavar onde. Ambiciosa, quer ser a quem a vila recorre.',
    voz: 'Educada ao ponto de incomodar, sempre uma pergunta à frente. Nunca pede nada: descreve um problema e espera.',
    naoSei: 'Curioso. Disso eu não tenho notícia. E vocês, por que perguntam?',
    naoConta: 'Que pergunta interessante. Quem quer saber?',
    foraDoTema: 'Não entendi o que isso tem a ver com negócios. Tem a ver?',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'Ela é Halia Thornton, mestra do Câmbio.', fala: 'Halia Thornton, mestra do Câmbio. Gente nova sempre me interessa.' },
      { id: 'cambio', assunto: 'tesouro', fato: 'O Câmbio compra pedras e objetos de valor, e registra quem pode cavar onde.', fala: 'Aqui se troca pedra por moeda, e se anota quem pode cavar onde. Têm o que vender?' },
      { id: 'castelo', assunto: 'castelo', fato: 'Ela não sabe onde fica o Castelo Dentefino, mas ouviu que os Marcarrubra têm um goblin de serviço, que deve saber onde vivem os outros goblins.', fala: 'Não sei onde fica. Mas ouvi que os Marcarrubra têm um goblin de serviço, e goblin sabe de goblin.' },
      { id: 'gangue', assunto: 'marcarrubra', requer: antesDe('marcarrubra'), fato: 'Os Marcarrubra ficam no Gigante Adormecido e têm base embaixo da Mansão Tresendar. Ela paga cem peças de ouro pela eliminação do chefe deles, o Cajavidro, e por qualquer carta do quarto dele.', fala: 'Um problema, sem dúvida. Base embaixo da Mansão Tresendar. Quem resolvesse o chefe e me trouxesse as cartas dele ganharia cem peças.' },
      { id: 'faccao', assunto: 'trabalho', requer: (e) => e.haliaAliada === true || apertado('halia')(e), fato: 'Ela admite que responde a uma organização maior, os Zhentarim, e que quer os Marcarrubra fora para ficar com o lugar deles.', fala: 'Digamos que eu tenha amigos maiores que esta vila: os Zhentarim. E que a vila precise de quem mande de verdade.' },
    ],
  }),

  sildar: morador({
    nome: 'Sildar Hallwinter',
    quem: 'Oficial da Aliança dos Lordes, veterano, resgatado pelo grupo dos goblins. Está em Phandalin para restaurar a ordem e procurar um colega.',
    voz: 'Frases curtas, voz baixa, chama todo mundo pelo ofício antes do nome. Nunca levanta o tom; quando discorda, repete a frase igual.',
    naoSei: 'Isso não sei. Não vou fingir que sei.',
    naoConta: 'Isso é assunto da Aliança.',
    foraDoTema: 'Não entendo a pergunta. Tem trabalho a fazer.',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'Ele é Sildar Hallwinter, da Aliança dos Lordes.', fala: 'Sildar Hallwinter, da Aliança dos Lordes. Vim pôr ordem na estrada.' },
      { id: 'castelo', assunto: 'castelo', fato: 'Ele sabe pelo cativeiro que Gundren foi levado ao Castelo Dentefino, e não sabe onde fica. Sugere procurar os bandos de saqueadores goblins pela Trilha de Triboar.', fala: 'Levaram o anão para o Castelo Dentefino. Onde fica, não sei. Procurem os saqueadores na Trilha de Triboar.' },
      { id: 'gundren', assunto: 'gundren', requer: antesDe('gundrenResgatado'), fato: 'Ele viajava com Gundren Buscapedra quando os goblins os emboscaram. Gundren foi levado com o mapa.', fala: 'Eu viajava com Gundren quando nos emboscaram. Levaram ele e o mapa.' },
      { id: 'aranha', assunto: 'aranhaNegra', fato: 'Ouviu dos goblins o nome Aranha Negra, que mandou capturar Gundren. Não sabe quem é.', fala: 'Aranha Negra. Ouvi esse nome dos goblins, no escuro. Quem é, não sei.' },
      { id: 'iarno', assunto: 'cajavidro', requer: antesDe('traicaoDeIarno'), fato: 'Iarno Albrek, seu colega da Aliança, mago, baixo, de barba preta, uns trinta anos, sumiu há dois meses explorando a Mansão Tresendar. Ele quer saber o que aconteceu.', fala: 'Iarno Albrek, meu colega. Mago, baixo, barba preta. Sumiu na Mansão Tresendar há dois meses.' },
      { id: 'traicao', assunto: 'cajavidro', requer: (e) => e.traicaoDeIarno === true, fato: 'Ele já sabe: o Cajavidro, chefe dos Marcarrubra, era Iarno Albrek. A traição o pesa, e ele vai relatar à Aliança.', fala: 'Iarno. O Cajavidro era Iarno. Vou escrever isso à Aliança com a minha própria mão.' },
      { id: 'nomes', assunto: 'saida', requer: apertado('sildar'), fato: 'Ele admite que cedeu nomes durante o interrogatório dos goblins e não sabe quais ainda valem.', fala: 'Cedi nomes no interrogatório. Não sei quais ainda valem. É isso.' },
      { id: 'pagaCastelo', assunto: 'trabalho', requer: antesDe('grolMorto'), fato: 'A Aliança paga quinhentas peças de ouro a quem achar e derrotar o chefe do Castelo Dentefino.', fala: 'Quinhentas peças pelo Castelo Dentefino. A Aliança paga.' },
      { id: 'pagaGangue', assunto: 'trabalho', requer: antesDe('marcarrubra'), fato: 'A Aliança paga duzentas peças de ouro pelo fim dos Marcarrubra.', fala: 'Duzentas peças pelo fim dos Marcarrubra. A Aliança paga.' },
      { id: 'mapa', assunto: 'mapa', requer: antesDe('gundrenResgatado'), fato: 'Gundren tinha um mapa da Caverna Onda Eco, e os goblins o levaram junto com ele.', fala: 'Gundren tinha um mapa da Onda Eco. Levaram junto com ele.' },
    ],
  }),

  irmaGaraele: morador({
    nome: 'Irmã Garaele',
    quem: 'Acólita elfa do santuário de Tymora, deusa da sorte, em Phandalin. Jovem, formal e impaciente. Procura uma resposta que só uma morta sabe.',
    voz: 'Formal e impaciente ao mesmo tempo. Explica rito com precisão e corta pergunta pessoal com uma bênção.',
    naoSei: 'Isso a sorte não me mostrou.',
    naoConta: 'Que Tymora lhes sorria. E sigamos.',
    foraDoTema: 'Não compreendo. Que a sorte lhes dê clareza.',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'Ela é Irmã Garaele, acólita de Tymora.', fala: 'Irmã Garaele, deste santuário de Tymora. Que a sorte lhes sorria.' },
      { id: 'agatha', assunto: 'agatha', fato: 'Ela foi até o covil da banshee Agatha, na mata atrás de Conyberry, e a criatura não apareceu para ela. Voltou machucada e exausta da viagem.', fala: 'Fui até o covil da banshee Agatha, atrás de Conyberry. Ela nem apareceu para mim, e a volta me custou caro.' },
      { id: 'grimorio', assunto: 'tesouro', requer: antesDe('garaelePagou'), fato: 'Ela quer saber onde foi parar o grimório de Arco Suave, um mago antigo. Paga três poções de cura pela resposta, e dá um pente de prata para levar de presente à banshee.', fala: 'Onde foi parar o grimório de Arco Suave? Pela resposta, três poções. E levem este pente: elfos mortos gostam de coisa bonita.' },
      { id: 'tymora', assunto: 'santuario', fato: 'Tymora é a deusa da boa sorte. O santuário é um nicho pequeno de pedra reaproveitada.', fala: 'Tymora é a sorte que ainda não foi decidida. Este nicho é pequeno, mas ela não repara.' },
      { id: 'gangue', assunto: 'marcarrubra', requer: antesDe('marcarrubra'), fato: 'Ela despreza os Marcarrubra.', fala: 'Que os Marcarrubra se danem. Isso também é uma bênção.' },
      { id: 'harpistas', assunto: 'trabalho', requer: apertado('irmaGaraele'), fato: 'Ela admite que trabalha para os Harpistas, uma rede discreta que se opõe a tiranos.', fala: 'Sirvo Tymora, e também os Harpistas. Não digam isso em voz alta.' },
    ],
  }),

  daran: morador({
    nome: 'Daran Edermath',
    quem: 'Drow de mais de quinhentos anos, cabelo branco e pele cinza-escura, pomicultor em Phandalin. Foi aventureiro, depois arauto e oficial de justiça na Costa do Dragão, ao sul, e voltou para a região de Neverwinter, de onde veio. Membro da Ordem da Manopla, já afastado. Mede as pessoas antes de oferecer qualquer coisa.',
    voz: 'Pausado, pergunta mais do que responde. Chama o perigo de trabalho.',
    naoSei: 'Disso não sei. E vocês, o que sabem?',
    naoConta: 'Tem trabalho que se conta depois de feito.',
    foraDoTema: 'Não entendi. Vão querer uma maçã?',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'Ele é Daran Edermath, dono do pomar, que já andou por muitas estradas.', fala: 'Daran Edermath. Já andei por estradas piores que as de vocês.' },
      { id: 'gangue', assunto: 'marcarrubra', requer: antesDe('marcarrubra'), fato: 'Acha que alguém já devia ter agido contra eles, e que é trabalho para um grupo. O chefe dos Marcarrubra atende por Cajavidro. Bebem no Gigante Adormecido e dormem embaixo da Mansão Tresendar, a ruína do leste.', fala: 'O chefe atende por Cajavidro. Bebem no Gigante Adormecido e dormem embaixo da Mansão Tresendar.' },
      { id: 'torre', assunto: 'trabalho', requer: antesDe('kostDerrotado', 'kostNegociou'), fato: 'A dois dias de marcha, a nordeste, há uma torre de vigia caída do tempo de Netheril, o Poço da Coruja Velha. Garimpeiros foram postos para correr por mortos que andavam, e ele quer saber quem mexe naquelas pedras.', fala: 'Tem uma torre caída a nordeste, dois dias de marcha, o Poço da Coruja Velha. Mortos andando. Quero saber quem mexe lá.' },
      { id: 'kost', assunto: 'kost', requer: (e) => e.kostDerrotado === true || e.kostNegociou === true, fato: 'Quem mexia na torre era um Mago Vermelho de Thay, e o grupo já tratou disso.', fala: 'Um Mago Vermelho de Thay, cavando pedra velha. Bom saber quem era.' },
      { id: 'ordem', assunto: 'saida', requer: apertado('daran'), fato: 'Ele admite que ainda guarda a insígnia da Ordem da Manopla numa caixa, e que sai armado para colher fruta.', fala: 'A insígnia da Manopla está numa caixa, e eu saio armado para colher fruta. Velho não muda.' },
    ],
  }),

  qelline: morador({
    nome: 'Qelline Alderleaf',
    quem: 'Fazendeira halfling de Phandalin, mãe do menino Carp, de dez anos. Prática e sensata, responde pergunta direta com resposta direta.',
    voz: 'Prática e calma, diz o que sabe e para de falar quando acaba. Faz as mãos continuarem trabalhando.',
    naoSei: 'Não sei. Se soubesse, dizia.',
    naoConta: 'Isso não é meu para contar.',
    foraDoTema: 'Não entendi. Tem mais alguma coisa? A horta não espera.',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'Ela é Qelline Alderleaf, dona da fazenda. O galpão dela é seco e de graça para quem precisar.', fala: 'Qelline Alderleaf. Se faltar cama na estalagem, o galpão é seco e de graça.' },
      { id: 'carp', assunto: 'carp', fato: 'O filho dela, Carp, diz ter achado uma passagem secreta no mato atrás da mansão velha, e viu dois sujeitos enormes saírem dela para encontrar os Marcarrubra.', fala: 'O Carp diz que achou uma passagem no mato atrás da mansão velha, e viu dois sujeitos enormes saírem. Ele não mente sobre isso.' },
      { id: 'reidoth', assunto: 'reidoth', fato: 'Reidoth é um druida, amigo antigo dela, que conhece estas terras. Da última vez ia para as ruínas de Árvore Trovão, a oeste da Floresta de Neverwinter, uns oitenta quilômetros a noroeste.', fala: 'Procurem o Reidoth, druida, amigo antigo. Foi para as ruínas de Árvore Trovão, oitenta quilômetros a noroeste.' },
      { id: 'dendrar', assunto: 'dendrar', requer: antesDe('dendrarEmCasa'), fato: 'Ela conhecia os Dendrar: o marceneiro foi morto pelos Marcarrubra e a família sumiu.', fala: 'Mataram o marceneiro. A família sumiu. Eu mantenho o Carp por perto desde então.' },
    ],
  }),

  harbin: morador({
    nome: 'Harbin Wester',
    quem: 'Chefe da vila de Phandalin, burocrata gordo e medroso, que despacha do Salão da vila. Quer terminar o mandato sem incidente com o nome dele.',
    voz: 'Formal e prolixo, usa o cargo como terceira pessoa ("o chefe da vila"). Promete com números vagos.',
    naoSei: 'O chefe da vila não dispõe dessa informação, infelizmente.',
    naoConta: 'O chefe da vila não está autorizado a tratar disso.',
    foraDoTema: 'O chefe da vila não vê como isso seja assunto do Salão.',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'Ele é Harbin Wester, chefe da vila.', fala: 'Harbin Wester, chefe da vila, a seu dispor, dentro do horário do Salão.' },
      { id: 'orcs', assunto: 'orcs', requer: antesDe('cumeLimpo'), fato: 'Houve carroça assaltada, mercador sumido e pastor sem orelha. Dizem que é um bando — um ogro, uns bugbears e um goblin esquisito — que se esconde no Cume da Wyvern, o morro grande do leste. O Salão paga cem peças de ouro a quem acabar com isso.', fala: 'Carroça assaltada, mercador sumido. Dizem que é um bando, com ogro e bugbear, no Cume da Wyvern. O Salão paga cem peças.' },
      { id: 'gangue', assunto: 'marcarrubra', requer: antesDe('marcarrubra'), fato: 'Ele prefere não enfrentar os Marcarrubra e pede que não se faça mais confusão, porque quem paga é a vila.', fala: 'O chefe da vila pede que não se faça mais confusão. Quem paga a revanche é a vila, entendem?' },
      { id: 'celas', assunto: 'saida', fato: 'O Salão tem duas celas no porão, feitas para bêbados. A chave fica no cinto dele.', fala: 'Há duas celas no porão, para bêbados. A chave fica comigo.' },
      { id: 'sabia', assunto: 'trabalho', requer: apertado('harbin'), fato: 'Ele admite que sabia dos ataques antes das primeiras reclamações e decidiu esperar para ver se paravam sozinhos.', fala: 'O chefe da vila… eu sabia, antes das reclamações. Esperei que parassem sozinhos.' },
    ],
  }),

  grista: morador({
    nome: 'Greska',
    quem: 'Orc de cara amarrada, dona do balcão do Gigante Adormecido, a taverna onde os Marcarrubra bebem. Não quer problema com ninguém.',
    voz: 'Poucas palavras, mal-humorada, esfrega um caneco enquanto fala.',
    naoSei: 'Não vi nada, não sei de nada.',
    naoConta: 'Não vi nada, não sei de nada, e não vou começar agora.',
    foraDoTema: 'Bebe ou some.',
    fatos: [
      { id: 'quem', assunto: 'quemEVoce', fato: 'Ela é Greska e cuida do balcão do Gigante Adormecido.', fala: 'Greska. Bebe ou some.' },
      { id: 'taverna', assunto: 'estalagem', fato: 'O Gigante Adormecido serve cerveja rala e morna, e quem quebra alguma coisa paga.', fala: 'A cerveja é o que é. Quebrou, pagou.' },
      { id: 'caminho', assunto: 'marcarrubra', requer: apertado('grista'), fato: 'Os Marcarrubra sobem a rua até a Mansão Tresendar e descem por uma escada de pedra nas ruínas da cozinha.', fala: 'Sobem a rua até a mansão velha e descem pela cozinha caída. Pronto.' },
    ],
  }),
};

/** Quem mora na vila, pelo `id` que `phandalin.js` dá à pessoa. */
export const IDS_DA_VILA = Object.keys(FICHAS_DA_VILA);
