// Falas por perfil (raça, classe, atributo) para a vila de Phandalin. Formato em `../dialogos-extras.js`.
//
// As chaves são os ID dos NPCs da vila (`rules/npcs.js`), e não os nomes: o Sildar, por exemplo, também é um
// combatente (nome "Sildar Hallwinter") nas conversas do covil goblin, com nós que se chamam `oi` como os da vila,
// e uma chave por nome faria as opções daqui vazarem para lá. O id do combatente é `sildar-3`, o da vila é `sildar`.
//
// Nada aqui dá o que o caminho normal não daria: cada opção chega a um nó, a uma pista ou a um `fim` que a árvore da
// vila (`game/phandalin.js`) já tem, só por outra porta (um atalho, uma CD menor, uma vantagem) ou com outra reação do NPC.

const campanha = (ctx) => ctx.app?.campanha ?? {};
const feitosDe = (ctx) => campanha(ctx).feitos ?? {};
const vilaDe = (ctx) => campanha(ctx).vila ?? {};
const usadasDe = (ctx, npc) => ctx.flags?.[`dialogo:${npc}:usadas`] ?? [];
/** A opção `chave` da árvore deste NPC já foi escolhida (as `uma:` ficam marcadas aqui). */
const jaUsou = (ctx, npc, chave) => usadasDe(ctx, npc).includes(chave);
/** Marca como usada a opção da árvore que este atalho substitui, para ela não aparecer repetida. */
const marcar = (npc, chave) => (ctx) => { const u = ctx.flags[`dialogo:${npc}:usadas`]; if (u && !u.includes(chave)) u.push(chave); };
/** A gangue caiu? (igual ao `gangueCaiu` do chefe da vila em phandalin.js). */
const gangueCaiu = (ctx) => Boolean(feitosDe(ctx).marcarrubra || feitosDe(ctx).cajavidro);
const sabeDaEscada = (ctx) => (vilaDe(ctx).pistas ?? []).some((p) => /escada de pedra/.test(p));

export default {
  // ------------------------------------------------------------ estalagem ----
  toblen: {
    nos: {
      'x:toblen-canta': {
        narra: (ctx) => `${ctx.quem.name} sobe numa cadeira e puxa uma canção de taverna. Em duas estrofes metade da sala bate o caneco no tempo; entre um refrão e outro, as mesas vão soltando a conversa.`,
        fala: 'Faz meses que esta sala não canta junto. Mas cantem mais baixo, por favor: a rua tem ouvido. Se querem saber o que anda se dizendo, ouçam; eu só encho caneco.',
        opcoes: [{ texto: 'Descer da cadeira e prestar atenção na sala.', vai: 'rumores' }],
      },
      'x:toblen-mineiro': {
        narra: (ctx) => `${ctx.quem.name} se senta ao lado do homem de pó de pedra na barba, pede dois canecos e fala de picareta, de veio e de chuva no túnel. Em pouco tempo a mesa inteira está falando junto.`,
        fala: 'O Lanar não abre a boca assim nem para mim. Fiquem à vontade: a mesa é de vocês.',
        opcoes: [{ texto: 'Ouvir o que a mesa tem a dizer.', vai: 'rumores' }],
      },
      'x:toblen-medo': {
        narra: 'Ele limpa a mesma tábua do balcão três vezes. O medo não é só dos mantos vermelhos: é de ser visto falando deles.',
        fala: 'Falem baixo, por favor. A sala inteira escuta, e o que ela não escuta ela adivinha. Se querem saber o que anda se dizendo por aí, sentem e ouçam; eu só encho caneco.',
        opcoes: [{ texto: 'Ouvir as conversas da sala.', vai: 'rumores' }],
      },
      'x:toblen-nada': {
        narra: 'Ele mexe no avental, olha para a porta e muda de assunto. Não dá para ler mais nada no rosto dele.',
        fala: 'Hã? Não ouvi nada, não. O ensopado, aceitam?',
        opcoes: [{ texto: '…', vai: 'oi' }],
      },
    },
    porNo: {
      oi: [
        { texto: 'Subo numa cadeira e puxo uma canção para soltar as línguas da sala.',
          perfil: { classe: 'bardo' }, uma: true, vai: 'x:toblen-canta',
          requer: (ctx) => (jaUsou(ctx, 'toblen', 'oi:0') ? 'já ouviram a sala' : null), oculta: true,
          efeito: marcar('toblen', 'oi:0') },
        { texto: 'Vou até o homem de pó de pedra na barba e falo de pedra e de picareta, de igual para igual.',
          perfil: { raca: 'anao' }, uma: true, vai: 'x:toblen-mineiro',
          requer: (ctx) => (jaUsou(ctx, 'toblen', 'oi:0') ? 'já ouviram a sala' : null), oculta: true,
          efeito: marcar('toblen', 'oi:0') },
      ],
      marcarrubra: [
        { texto: 'Observo como ele fala: o medo é dos Marcarrubra, ou de alguém ouvir?',
          perfil: { atributo: { sab: 15 } }, uma: true,
          teste: { pericia: 'intuicao', cd: 10 }, sucesso: 'x:toblen-medo', falha: 'x:toblen-nada' },
      ],
    },
  },

  // -------------------------------------------------------------- armazém ----
  elmar: {
    porNo: {
      gundren: [
        { texto: 'Mina perdida de Phandelver… Nas forjas do meu povo essa história ainda é contada, e eu a conheço.',
          perfil: { raca: 'anao' }, mostrar: true, uma: true,
          teste: { pericia: 'historia', cd: 15, vantagem: true }, sucesso: 'mina', falha: 'naoSabe' },
        { texto: 'Phandelver… isso mexe com uma lembrança de histórias de família. Deixe-me pensar.',
          perfil: { raca: 'gnomo' }, uma: true,
          teste: { pericia: 'historia', cd: 12 }, sucesso: 'mina', falha: 'naoSabe' },
        { texto: 'O Pacto de Phandelver… isso cheira a magia antiga. Deixe-me lembrar.',
          perfil: { classe: 'mago' }, uma: true,
          teste: { pericia: 'arcanismo', cd: 12 }, sucesso: 'mina', falha: 'naoSabe' },
      ],
    },
  },

  // ---------------------------------------------------------- Escudo Leão ----
  linene: {
    nos: {
      'x:linene-anao': {
        narra: (ctx) => `${ctx.quem.name} pede para ver uma lâmina, pesa na mão e comenta o fio e a têmpera, sem perguntar preço nenhum. Linene levanta os olhos das contas pela primeira vez.`,
        fala: 'Não vou fingir que isso muda o que está na etiqueta. Mas é bom ver alguém que olha o fio antes do rótulo. Os fundos estão ali.',
        opcoes: [
          { texto: 'Ver as armas e armaduras dos fundos.', fim: 'loja' },
          { texto: 'Voltar.', vai: 'oi' },
        ],
      },
      'x:linene-nada': {
        narra: 'Ela fecha o caderno de contas sem levantar os olhos. Se há mais do que a perda ali, não vai ser lido hoje.',
        fala: 'Mais alguma coisa? Tenho contas para fechar.',
        opcoes: [{ texto: '…', vai: 'oi' }],
      },
      'x:linene-le': {
        narra: 'Ela fala do roubo em números, sem levantar a voz. A raiva é de contabilidade, e não tem pressa em ser dita em público.',
        fala: 'Perda é perda. Eu conto o que falta e sigo adiante; o resto não é assunto de balcão.',
        opcoes: [{ texto: '…', vai: 'oi' }],
      },
    },
    porNo: {
      oi: [
        { texto: 'Peço para ver uma lâmina, peso na mão e comento a têmpera. Entre quem entende de aço, dispensa explicação.',
          perfil: { raca: 'anao' }, uma: true, vai: 'x:linene-anao' },
      ],
      caravana: [
        { texto: 'Presto atenção em como ela fala da perda: o que pesa mais para ela?',
          perfil: { atributo: { sab: 15 } }, uma: true,
          teste: { pericia: 'intuicao', cd: 10 }, sucesso: 'x:linene-le', falha: 'x:linene-nada' },
      ],
    },
  },

  // --------------------------------------------------------------- Câmbio ----
  halia: {
    porNo: {
      oferta: [
        { texto: 'Ela fala em "problema" e "proposta", mas quer algo. Que cartas são essas, afinal?',
          perfil: { atributo: { sab: 16 } }, uma: true,
          teste: { pericia: 'intuicao', cd: 12 }, sucesso: 'motivo', falha: 'semMotivo' },
        { texto: 'Esse jeito de falar em "problema" sem pedir nada é de quem ganha com o resultado. Por que as cartas?',
          perfil: { classe: 'ladino' }, uma: true,
          teste: { pericia: 'intuicao', cd: 15, vantagem: true }, sucesso: 'motivo', falha: 'semMotivo' },
        { texto: 'Cem peças e um homem morto por papéis cujo fim eu não conheço? Quero ouvir o motivo, olhando para mim.',
          perfil: { atributo: { for: 17 } }, uma: true,
          teste: { pericia: 'intimidacao', cd: 14 }, sucesso: 'motivo', falha: 'semMotivo' },
      ],
    },
  },

  // ---------------------------------------------------------------- Sildar ----
  sildar: {
    nos: {
      'x:sildar-cuidado': {
        narra: (ctx) => `${ctx.quem.name} pede licença, limpa o resto do inchaço do rosto de Sildar e fecha a mão sobre o pior da dor, em silêncio.`,
        fala: 'Obrigado. Faz tempo que ninguém põe a mão nesta cara com cuidado. Agora, ao trabalho.',
        opcoes: [{ texto: '…', vai: 'oi' }],
      },
      'x:sildar-soldado': {
        fala: 'Gosto de quem pergunta o ofício antes do preço. Sem rodeio, então: é isto o que preciso.',
        opcoes: [{ texto: 'Ouvir o que ele precisa.', vai: 'sildar' }],
      },
    },
    porNo: {
      oi: [
        { texto: 'Antes do trabalho, ofereço tratar o rosto machucado dele.',
          perfil: { classe: ['clerigo', 'druida'] }, uma: true, vai: 'x:sildar-cuidado' },
        { texto: 'Falo como soldado: peço a ordem de serviço sem rodeio.',
          perfil: { classe: ['guerreiro', 'paladino', 'patrulheiro'] }, uma: true, vai: 'x:sildar-soldado',
          requer: (ctx) => (jaUsou(ctx, 'sildar', 'oi:0') ? 'já falou do trabalho' : null), oculta: true,
          efeito: marcar('sildar', 'oi:0') },
      ],
    },
  },

  // ------------------------------------------------------------ santuário ----
  irmaGaraele: {
    nos: {
      'x:garaele-elfo': {
        narra: 'A postura rígida da acólita cede um pouco. Pela primeira vez desde que vocês entraram, ela olha para alguém sem estar medindo a distância.',
        fala: 'Fazia tempo que eu não ouvia essa língua sem sotaque de balcão. Obrigada. Sentem; eu conto sem enfeite.',
        opcoes: [{ texto: 'Ouvir a história dela.', vai: 'agatha' }],
      },
      'x:garaele-bencao': {
        fala: 'Que Tymora sorria a vocês. O pente é um presente, e presente se entrega com a mão aberta e sem pressa. Tratem a banshee com respeito.',
        opcoes: [
          { texto: 'Aceitamos.', fim: 'agatha' },
          { texto: 'Vamos pensar.', vai: 'oi' },
        ],
      },
      'x:garaele-reza': {
        narra: (ctx) => `${ctx.quem.name} e Garaele rezam em voz baixa, lado a lado, diante da moeda de prata entalhada. A chama das velas se firma, e ela guarda o papel dobrado com mais cuidado.`,
        fala: 'Que a sorte sorria a ela, onde estiver. E a vocês, por onde forem.',
        opcoes: [{ texto: '…', vai: 'oi' }],
      },
    },
    porNo: {
      oi: [
        { texto: 'Cumprimento a irmã na língua do nosso povo e pergunto, baixinho, como foi a viagem.',
          perfil: { raca: ['elfo', 'meioElfo'] }, uma: true, vai: 'x:garaele-elfo',
          requer: (ctx) => (vilaDe(ctx).missoes?.agatha ? 'a missão já está de pé' : null), oculta: true },
      ],
      agatha: [
        { texto: 'Digo que levo o pente de prata e que o entrego com respeito.',
          perfil: { classe: ['clerigo', 'paladino'] }, uma: true, vai: 'x:garaele-bencao' },
      ],
      agathaFeita: [
        { texto: 'Proponho uma oração conjunta à deusa, pelo nome que a banshee deu.',
          perfil: { classe: ['clerigo', 'paladino'] }, uma: true, vai: 'x:garaele-reza' },
      ],
    },
  },

  // ----------------------------------------------------------------- pomar ----
  daran: {
    nos: {
      'x:daran-oficio': {
        fala: 'Quem diz o ofício primeiro não vem vender nada. Sentem. Se querem saber o que me incomoda, é isto.',
        opcoes: [{ texto: 'Ouvir o que o incomoda.', vai: 'coruja' }],
      },
      'x:daran-meio': {
        fala: 'Hm. Não é todo dia que alguém enxerga as duas margens como eu enxergo. Sentem, sentem. O que querem saber?',
        opcoes: [
          { texto: 'Perguntar o que ele acha dos Marcarrubra.', vai: 'marcarrubra' },
          { texto: 'Perguntar se ele precisa de alguma coisa.', vai: 'coruja' },
          { texto: '…', vai: 'oi' },
        ],
      },
      'x:daran-magos': {
        fala: 'Quem lida com o que vocês lidam lê nessas coisas o que eu só vejo de fora. A magia me falta; a desconfiança não. Obrigado por contar.',
        opcoes: [{ texto: '…', vai: 'oi' }],
      },
    },
    porNo: {
      oi: [
        { texto: 'Digo meu ofício e peço licença para sentar, de soldado para soldado.',
          perfil: { classe: ['guerreiro', 'paladino', 'patrulheiro', 'barbaro'] }, uma: true, vai: 'x:daran-oficio',
          requer: (ctx) => (jaUsou(ctx, 'daran', 'oi:1') ? 'já falou do que o incomoda' : null), oculta: true,
          efeito: marcar('daran', 'oi:1') },
        { texto: 'Digo a ele que também sei o que é viver com um pé em cada margem.',
          perfil: { raca: 'meioElfo' }, uma: true, vai: 'x:daran-meio' },
      ],
      relatoCoruja: [
        { texto: 'Comento o que sei de quem cava ruínas antigas atrás de magia.',
          perfil: { classe: ['mago', 'feiticeiro', 'bruxo'] }, uma: true, vai: 'x:daran-magos' },
      ],
    },
  },

  // --------------------------------------------------------------- fazenda ----
  qelline: {
    nos: {
      'x:qelline-halfling': {
        fala: 'Ora, gente do meu tamanho! Então o galpão é de vocês, sem pedir nada. E se tiverem pergunta, eu respondo enquanto limpo o feijão.',
        opcoes: [
          { texto: 'Dormir no galpão esta noite.', fim: 'palheiro' },
          { texto: 'Falar com o menino, Carp.', vai: 'carp' },
          { texto: '…', vai: 'oi' },
        ],
      },
      'x:qelline-carp-devagar': {
        narra: (ctx) => `${ctx.quem.name} se agacha na altura do menino e pede a história outra vez, sem pressa. Contada devagar, a história perde o exagero de tamanho e fica com o que importa: dois homens grandes, uma passagem no mato atrás da mansão velha, escondida nas moitas.`,
        fala: 'Viu? É só pedir com calma. Ele é bom menino, só tem pressa de crescer.',
        opcoes: [{ texto: '…', vai: 'oi' }],
      },
      'x:qelline-carp-enrola': {
        narra: 'Cada vez que o menino conta, os dois homens crescem mais um palmo. Na terceira versão, ele mesmo já se enrolou.',
        fala: 'Carp, já chega. Vá tirar o feijão e deixe os visitantes em paz.',
        opcoes: [{ texto: '…', vai: 'oi' }],
      },
    },
    porNo: {
      oi: [
        { texto: 'Digo a ela, de halfling para halfling, que só queremos um canto seco para os pés.',
          perfil: { raca: 'halfling' }, uma: true, vai: 'x:qelline-halfling' },
        { texto: 'Procuro alguém que conheça bem estas terras: um druida, de preferência.',
          perfil: { classe: ['druida', 'patrulheiro'] }, uma: true, vai: 'reidoth',
          requer: (ctx) => (jaUsou(ctx, 'qelline', 'oi:1') ? 'já perguntou' : null), oculta: true,
          efeito: marcar('qelline', 'oi:1') },
      ],
      carp: [
        { texto: 'Peço ao menino que conte tudo de novo, devagar, e separo o que ele viu do exagero.',
          perfil: { atributo: { sab: 15 } }, uma: true,
          teste: { pericia: 'intuicao', cd: 8 }, sucesso: 'x:qelline-carp-devagar', falha: 'x:qelline-carp-enrola' },
      ],
    },
  },

  // ------------------------------------------------- salão do chefe da vila ----
  harbin: {
    porNo: {
      // Só quando a gangue AINDA não caiu: é quando as duas tentativas da árvore existem. Duas extras, não mais: o pedido tem limite.
      preso: [
        { texto: 'Dou um passo à frente, devagar, e digo que o preso fica. Sem discussão.',
          perfil: { atributo: { for: 17 } }, uma: true,
          teste: { pericia: 'intimidacao', cd: 8 }, sucesso: 'aceitaComMedo', falha: 'recusa',
          requer: (ctx) => (gangueCaiu(ctx) ? 'x' : null), oculta: true },
        { texto: 'Falo da lei e do dever do cargo, em tom de quem espera ser ouvido.',
          perfil: { classe: ['paladino', 'clerigo'] }, uma: true,
          teste: { pericia: 'persuasao', cd: 10, vantagem: true }, sucesso: 'aceita', falha: 'recusa',
          requer: (ctx) => (gangueCaiu(ctx) ? 'x' : null), oculta: true },
      ],
    },
  },

  // --------------------------------------------------- O Gigante Adormecido ----
  grista: {
    porNo: {
      oi: [
        { texto: 'Falo com ela como se fala entre anões, sem rodeio e em voz baixa: os mantos vermelhos ainda aparecem aqui?',
          perfil: { raca: 'anao' }, uma: true,
          teste: { pericia: 'persuasao', cd: 10 }, sucesso: 'conta', falha: 'nada',
          requer: (ctx) => (sabeDaEscada(ctx) ? 'ela já falou' : null), oculta: true },
        { texto: 'Apoio as duas mãos no balcão e espero a resposta.',
          perfil: { atributo: { for: 17 } }, uma: true,
          teste: { pericia: 'intimidacao', cd: 12, vantagem: true }, sucesso: 'conta', falha: 'nada',
          requer: (ctx) => (sabeDaEscada(ctx) ? 'ela já falou' : null), oculta: true },
      ],
    },
  },
};
