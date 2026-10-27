// Falas por perfil (raça, classe, atributo). Formato em `../dialogos-extras.js`.
//
// Esta leva cobre a Mansão Tresendar (capitulo3-mansao.js), a briga de rua (capitulo3-rua.js), o covil dos Garras de Pedra
// (capitulo1.js / capitulo2.js), a Trilha Triboar (capitulo4-estrada.js), as ruínas de Conyberry (conyberry.js) e a caverna
// escura de teste (cena-caverna.js).
//
// Onde duas cenas dividem o mesmo NPC (o goblin capturado do capítulo 1 e o da estrada; o Droop da mansão e o da caverna de
// teste), as opções só apontam para nós que existem nas duas árvores (`oi`, `conta`) ou para nós novos (`x:`); o que é de uma
// cena só fica atrás de um `requer` oculto.
//
// Nada aqui dá XP, item ou pista que a árvore não tenha por outro caminho: as opções abreviam o caminho, mudam a chance ou
// dão a reação do NPC ao perfil, e todo `fim` e todo destino de teste é um que a própria árvore já usa.

/** O Droop da mansão (grupo `guardas`) e o da caverna de teste dividem a chave `droop`. */
const naMansao = (ctx) => ctx.npc?.grupo === 'guardas';
const soNaMansao = (ctx) => (naMansao(ctx) ? null : 'só na mansão');
const soNaCaverna = (ctx) => (naMansao(ctx) ? 'só na caverna' : ctx.flags.droopContou ? 'ele já contou tudo' : null);

/** Os Marcarrubra da briga de rua se chamam A, B, C e D: o capturado pode ser qualquer um. */
const MARCARRUBRA_DA_RUA = {
  nos: {
    // O herói conclui o que viu; o preso só confirma uma parte (os presos), sem a flag do `conta`. O resto continua atrás de
    // uma Intimidação, com a vantagem de quem já sabe onde apertar.
    'x:rua-deduz': {
      narra: (ctx) => `${ctx.quem.name} junta o que viu: cada vez que o assunto resvala em "lá embaixo", os olhos dele vão para o chão, e o suor aparece quando se fala de túmulos velhos.`,
      fala: '— Eu não disse nada. Tá, tem gente presa lá embaixo, perto dos túmulos. É só isso que eu falo.',
      opcoes: [
        {
          texto: 'Agora eu sei onde apertar. Fala o resto.',
          teste: { pericia: 'intimidacao', cd: 10, vantagem: true }, sucesso: 'conta', falha: 'cala', uma: true,
        },
        { texto: 'Entregar ao chefe da vila.', fim: 'preso' },
      ],
    },
    'x:rua-assusta': {
      narra: (ctx) => `O manto vermelho treme no pescoço do preso. Ele tenta sustentar o olhar de ${ctx.quem.name} e não consegue.`,
      fala: '— Tá… tem gente presa lá embaixo, perto dos túmulos. É só isso que… é só isso.',
      opcoes: [
        {
          texto: 'Mais. Agora.',
          teste: { pericia: 'intimidacao', cd: 10, vantagem: true }, sucesso: 'conta', falha: 'cala', uma: true,
        },
        { texto: 'Entregar ao chefe da vila.', fim: 'preso' },
      ],
    },
  },
  porNo: {
    oi: [
      {
        texto: 'Chegar o rosto bem perto, até ele ver os olhos sem pupila: "Fala, ou eu te mostro de onde venho."',
        perfil: { raca: 'tiferino' },
        teste: { pericia: 'intimidacao', cd: 10, vantagem: true }, sucesso: 'x:rua-assusta', falha: 'cala', uma: true,
      },
      {
        texto: 'Em vez de ameaçar, esperar em silêncio e ver para onde ele desvia os olhos quando o assunto é o covil.',
        perfil: { atributo: { sab: 15 } },
        teste: { pericia: 'intuicao', cd: 10 }, sucesso: 'x:rua-deduz', falha: 'cala', uma: true,
      },
    ],
  },
};

export default {
  // ------------------------------------------------------------------ a mansão ----
  // O Cajavidro rendido (`arvoreIarno`: oi, aranha, bugbears, alianca). A chave é o bloco da ficha dele, para não valer
  // para o Iarno preso da vila, que tem outras árvores.
  Cajavidro: {
    nos: {
      'x:iarno-pacto': {
        narra: 'O sorriso do Cajavidro muda de lugar: sai da cortesia e vai para a vaidade de quem sabe uma coisa que o outro quer saber.',
        fala: [
          'Ah. Gente de forja e de oficina ouve esse nome e levanta a cabeça. Pois sim: a Forja das Magias, o velho pacto dos anões, dos gnomos e dos magos.',
          'O Aranha Negra a procura, e prometeu dividir comigo. Prometeu.',
        ],
        opcoes: [{ texto: '…', vai: 'oi' }],
      },
      'x:iarno-rachadura': {
        narra: 'Por um instante o sorriso escorrega, e o que aparece por baixo é cansaço.',
        fala: [
          'O Aranha Negra é um drow, e procura a Forja das Magias. Prometeu dividir comigo. Mandou três bugbears para me "ajudar", que sabem o caminho da mina, e eu não.',
          'Ninguém mais na Aliança sabe de nada disso. Pronto, falei.',
        ],
        opcoes: [{ texto: '…', vai: 'oi' }],
      },
      'x:iarno-sorri': {
        fala: 'Está tentando me ler? Um cavalheiro não se deixa ler por quem ainda tem lama na bota.',
        opcoes: [{ texto: '…', vai: 'oi' }],
      },
    },
    porNo: {
      aranha: [
        {
          texto: 'A Forja das Magias era trabalho de gente como eu. Conte o que sabe do pacto.',
          perfil: { raca: ['anao', 'gnomo'] },
          vai: 'x:iarno-pacto', uma: true,
        },
        {
          texto: 'Ele falou desse drow com cuidado demais. Deixar o silêncio trabalhar, sem desviar os olhos.',
          perfil: { raca: ['elfo', 'meioElfo'] },
          teste: { pericia: 'intuicao', cd: 12 }, sucesso: 'x:iarno-rachadura', falha: 'x:iarno-sorri', uma: true,
        },
      ],
    },
  },

  // O goblin de serviço. Na mansão (`arvoreDroop`: oi, portas, senha, castelo) e na caverna de teste (`droopArvore`: oi, quem,
  // conta, desconfia, grita, tunel, murmura). Cada opção só vale na sua cena.
  Droop: {
    nos: {
      'x:droop-pequeno': {
        narra: 'O goblin olha o herói de baixo para cima e, pela primeira vez desde que vocês entraram, a testa dele relaxa.',
        fala: 'Pequeno! Pequeno também apanha dos grandes, Droop sabe. Droop conta, conta tudo. Pergunta, pergunta.',
        opcoes: [
          { texto: 'Onde ficam as portas escondidas?', vai: 'portas' },
          { texto: 'Como passar pelos ossos da cripta?', vai: 'senha' },
          { texto: 'E o Castelo Dentefino?', vai: 'castelo' },
          { texto: 'Obrigado, Droop.', vai: 'oi' },
        ],
      },
      'x:droop-pedra': {
        narra: 'Droop olha o anão, depois a parede, depois o anão de novo.',
        fala: 'Anão sabe de pedra, anão sabe! Droop quase acha as portas, anão acha de verdade. Droop mostra onde Droop quase achou, sim? Sim?',
        opcoes: [
          { texto: 'Mostre: onde ficam as portas escondidas?', vai: 'portas' },
          { texto: 'Depois. Outra coisa…', vai: 'oi' },
        ],
      },
    },
    porNo: {
      oi: [
        {
          texto: 'Também sou pequeno, Droop. Também já levei pontapé de grande. Me conta o que você sabe.',
          perfil: { raca: ['halfling', 'gnomo'] },
          vai: 'x:droop-pequeno', uma: true, requer: soNaMansao, oculta: true,
        },
        {
          texto: 'Sou anão, Droop, e entendo de pedra. Onde as juntas soam ocas?',
          perfil: { raca: 'anao' },
          vai: 'x:droop-pedra', uma: true, requer: soNaMansao, oculta: true,
        },
        // Só na caverna de teste: a mesma conversa de "conta tudo", com a voz baixa de quem sabe lidar com bicho acuado.
        {
          texto: 'Agachar à altura dele e falar baixo, de mãos abertas, como se faz com bicho acuado: "Ninguém aqui quer te machucar."',
          perfil: { classe: ['patrulheiro', 'druida'] },
          teste: { pericia: 'persuasao', cd: 8 }, sucesso: 'conta', falha: 'desconfia', requer: soNaCaverna, oculta: true,
        },
      ],
    },
  },

  // Os bugbears da sala 9, com todo o grupo de manto. A conversa é com Mosk (`arvoreDosBugbears`: oi, servos, sabem,
  // confessa, desconfiam). Falhar uma conversa de ameaça aqui acaba em luta ('desconfiam'), como já acabava.
  Mosk: {
    nos: {
      // A leitura (SAB) só mostra o gesto: a chave no cinto. A informação continua atrás da Intimidação, mas agora com onde apertar.
      'x:mosk-nervoso': {
        narra: (ctx) => `${ctx.quem.name} fica de olho nas mãos do de tapa-olho, e não nas palavras: toda vez que a conversa resvala no fundo da sala, a mão dele vai ao cinto, onde pesa uma chave grossa.`,
        fala: '— Tá olhando o quê? Pergunta logo e vai.',
        opcoes: [
          {
            texto: 'Apertar o de tapa-olho, já sabendo onde dói: "A chave. Fala tudo, agora."',
            teste: { pericia: 'intimidacao', cd: 15, vantagem: true }, sucesso: 'confessa', falha: 'desconfiam', uma: true,
          },
          { texto: 'Deixar para lá.', vai: 'servos' },
        ],
      },
      'x:mosk-seca': {
        fala: '— Conversa demais para quem veio só de recado. Pergunta logo.',
        opcoes: [{ texto: '…', vai: 'servos' }],
      },
      // Quem ameaçou e passou não é tratado como servo: o bugbear cede, de má vontade, ao que pesa mais.
      'x:mosk-cede': {
        narra: 'O de tapa-olho mede o ombro largo do outro de cima a baixo, rosna baixo e dá meio passo para trás.',
        fala: '— Tá, tá. Bruto do mago, então. Não precisa empurrar.',
        opcoes: [{ texto: '…', vai: 'servos' }],
      },
    },
    porNo: {
      oi: [
        {
          texto: 'Dizer "o Cajavidro nos mandou" no tom cansado de quem já repetiu essa ordem mil vezes.',
          perfil: { atributo: { car: 15 } },
          teste: { pericia: 'enganacao', cd: 15, vantagem: true }, sucesso: 'servos', falha: 'desconfiam',
        },
        {
          texto: 'Falar de bruto para bruto, sem rodeio: "O mago mandou. Sai da frente."',
          perfil: { raca: 'meioOrc' },
          teste: { pericia: 'intimidacao', cd: 12 }, sucesso: 'x:mosk-cede', falha: 'desconfiam',
        },
      ],
      servos: [
        {
          texto: 'Apertar um deles com a mão no ombro e o peso todo do corpo: "Fala tudo, agora."',
          perfil: { atributo: { for: 17 } },
          teste: { pericia: 'intimidacao', cd: 15, vantagem: true }, sucesso: 'confessa', falha: 'desconfiam', uma: true,
        },
        {
          texto: 'Puxar conversa sobre o mago e ficar de olho no que o de tapa-olho evita dizer.',
          perfil: { atributo: { sab: 15 } },
          teste: { pericia: 'intuicao', cd: 13 }, sucesso: 'x:mosk-nervoso', falha: 'x:mosk-seca', uma: true,
        },
      ],
    },
  },

  // Os quatro da sala de estar, com todo o grupo de manto (`arvoreDosBebados`: oi, aceitam, chefe, desconfiam).
  'Marcarrubra da mesa A': {
    nos: {},
    porNo: {
      oi: [
        {
          texto: 'Erguer um copo vazio: "Anão não deixa mesa sem rodada. Quem paga a próxima?"',
          perfil: { raca: 'anao' },
          teste: { pericia: 'enganacao', cd: 10, vantagem: true }, sucesso: 'aceitam', falha: 'desconfiam',
        },
        {
          texto: 'Puxar uma cantiga de taverna e deixar a mesa inteira cantar junto.',
          perfil: { atributo: { car: 15 } },
          teste: { pericia: 'atuacao', cd: 10, vantagem: true }, sucesso: 'aceitam', falha: 'desconfiam',
        },
      ],
    },
  },

  // O vigia de um olho só (`arvoreDoVigia`: oi, intuicao, desconfia, medo, trato). Intimidar e falhar acaba em luta.
  vigiaCiclopico: {
    nos: {},
    porNo: {
      oi: [
        {
          texto: 'Encarar o olho sem recuar: "Já divido a cabeça com coisa pior que você. Passa."',
          perfil: { classe: 'bruxo' },
          teste: { pericia: 'intimidacao', cd: 13, vantagem: true }, sucesso: 'medo', falha: 'luta',
        },
        {
          texto: 'Erguer o símbolo sagrado diante do olho e falar baixo, sem ameaça: "Isto não é seu para comer."',
          perfil: { classe: ['clerigo', 'paladino'] },
          teste: { pericia: 'religiao', cd: 12 }, sucesso: 'medo', falha: 'desconfia',
        },
        {
          texto: 'Mostrar que sei de onde a carne vem: "Tem bicho na mata e eu sei onde ele dorme. Deixa passar."',
          perfil: { classe: ['patrulheiro', 'druida'] },
          teste: { pericia: 'sobrevivencia', cd: 11 }, sucesso: 'trato', falha: 'desconfia',
        },
      ],
    },
  },

  // ------------------------------------------------------------- a briga de rua ----
  'Marcarrubra A': MARCARRUBRA_DA_RUA,
  'Marcarrubra B': MARCARRUBRA_DA_RUA,
  'Marcarrubra C': MARCARRUBRA_DA_RUA,
  'Marcarrubra D': MARCARRUBRA_DA_RUA,

  // ------------------------------------------------------ o covil dos Garras de Pedra ----
  // Yeemik, a faca no pescoço de Sildar (`arvoreYeemik`: tregua, acordo, jura, nao, solta, furia, volta, teima...).
  yeemik: {
    nos: {},
    porNo: {
      tregua: [
        {
          texto: 'Erguer os olhos para o ressalto, sem mexer a arma e sem desviar: "Solte ele. Agora."',
          perfil: { atributo: { for: 17 } },
          teste: { pericia: 'intimidacao', cd: 15, vantagem: true }, sucesso: 'solta', falha: 'furia',
        },
        {
          texto: 'Falar baixo, de ofício para ofício: "Se a faca descer, você perde a única coisa que te protege aqui. Solta ele e a gente conversa."',
          perfil: { classe: 'ladino' },
          teste: { pericia: 'persuasao', cd: 12 }, sucesso: 'solta', falha: 'nao',
        },
      ],
      volta: [
        {
          texto: 'Falar de chefe para chefe: "Quem matou Klarg por você pode virar amigo ou problema. Escolhe."',
          perfil: { atributo: { car: 15 } },
          teste: { pericia: 'persuasao', cd: 15, vantagem: true }, sucesso: 'cede', falha: 'teima',
        },
      ],
    },
  },

  // O goblin capturado: o da emboscada do capítulo 1 (oi, cala, conta) e o da Trilha Triboar (oi, enrola, conta). Só `oi` e
  // `conta` existem nas duas; a falha de uma opção por perfil fecha a conversa (só se pode deixá-lo amarrado), para os extras não
  // virarem tentativas grátis.
  goblin: {
    nos: {
      'x:goblin-treme': {
        fala: 'Goblin tem medo! Se goblin fala, o chefe fica sabendo, e o chefe morde! Goblin não fala mais!',
        opcoes: [{ texto: 'Deixar ele amarrado e seguir.', fim: 'larga' }],
      },
    },
    porNo: {
      oi: [
        {
          texto: 'Deixar o goblin ver de perto o que somos: "Gente como eu não costuma fazer a mesma pergunta duas vezes."',
          perfil: { raca: ['draconato', 'tiferino', 'meioOrc'] },
          teste: { pericia: 'intimidacao', cd: 10, vantagem: true }, sucesso: 'conta', falha: 'x:goblin-treme', uma: true,
        },
        {
          texto: 'Falar em voz calma, de cabeça baixa, como num consolo: "Ninguém aqui quer mais sangue. Diga o que sabe e acaba."',
          perfil: { classe: ['clerigo', 'paladino'] },
          teste: { pericia: 'persuasao', cd: 8 }, sucesso: 'conta', falha: 'x:goblin-treme', uma: true,
        },
      ],
    },
  },

  // ----------------------------------------------------------------- Conyberry ----
  // A banshee (`conyberry.js`: oi, pente, recusa, aceita). Falhar a conversa respeitosa a manda embora até o dia seguinte,
  // como já mandava.
  Agatha: {
    nos: {},
    porNo: {
      oi: [
        {
          texto: 'Cumprimentar à moda antiga dos elfos e pedir licença para ficar.',
          perfil: { raca: ['elfo', 'meioElfo'] },
          teste: { pericia: 'persuasao', cd: 12 }, sucesso: 'aceita', falha: 'recusa',
        },
        {
          texto: 'Erguer o símbolo sagrado, sem ameaça, e pedir respeito pelo descanso dela: "Viemos sem ordem nenhuma, senhora."',
          perfil: { classe: ['clerigo', 'paladino'] },
          teste: { pericia: 'religiao', cd: 12 }, sucesso: 'aceita', falha: 'recusa',
        },
        {
          texto: 'Cantar baixinho uma cantiga de ninar da estrada, tão baixo que mal enche a sala.',
          perfil: { classe: 'bardo' },
          teste: { pericia: 'atuacao', cd: 12 }, sucesso: 'aceita', falha: 'recusa',
        },
      ],
    },
  },
};
