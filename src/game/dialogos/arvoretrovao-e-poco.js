// Falas por perfil (raça, classe, atributo). Formato em `../dialogos-extras.js`.
//
// Árvore Trovão (Presa Peçonhenta, Favric, Reidoth), Poço da Coruja Velha (Hamun Kost) e Castelo Dentefino (Gundren).
// Nada aqui dá o que o caminho normal não daria: os destinos são nós que as árvores já têm, e o que uma fala revela já
// está em outro nó ou na tela de "Tem certeza?" do dragão. Os `fim` são os que cada árvore já usa, com o mesmo sentido.
//
// Cuidados com árvores que se repetem sob o mesmo nome:
//   - Favric tem a árvore da primeira visita e a de quem já aceitou a aliança (as duas com nó `oi`): as opções de `oi`
//     só valem enquanto o culto ainda não foi decidido (`campanha.arvoreTrovao.culto` vazio).
//   - Hamun Kost tem a árvore da conversa e a de "segurar os mortos" no meio da luta (as duas com nó `oi`): as opções
//     de `oi` só valem com ele neutro (fora da luta).
//   - Reidoth tem a árvore de quem fechou acordo com o dragão (`oi`, `naoVamos`, `pessoal`): as opções vão só em nós que
//     existem apenas na árvore normal (`dragao`, `avisos`).

const campanha = (ctx) => ctx.app?.campanha ?? {};

/** Marca uma opção da árvore como já escolhida, para o atalho do perfil substituir a pergunta comum (a mesma lista de `uma`). */
const gastar = (ctx, chave) => {
  const k = `dialogo:${ctx.npc?.defId ?? ctx.npc?.id ?? ctx.npc?.name}:usadas`;
  const usadas = (ctx.flags[k] ??= []);
  if (!usadas.includes(chave)) usadas.push(chave);
};

/** Favric: só antes de o culto ser decidido (depois da aliança a árvore é outra, sem os nós `duvida`, `passagem`, `raiva`). */
const antesDaAlianca = (ctx) => (campanha(ctx).arvoreTrovao?.culto ? 'já combinado' : null);

/** Hamun Kost: só fora da luta (no meio dela a árvore é a de segurar os mortos, sem os nós da conversa). */
const kostEmPaz = (ctx) => (ctx.npc?.side === 'neutro' ? null : 'só fora da luta');
/** O "favor" some depois do acordo (a pergunta comum também some). */
const kostSemAcordo = (ctx) => kostEmPaz(ctx) ?? (campanha(ctx).poco?.kost === 'acordo' ? 'já combinado' : null);

export default {
  // ------------------------------------------------------------------------------------------ o dragão da torre ----
  'Presa Peçonhenta': {
    nos: {
      'x:parente': {
        narra: 'O olho que estava aberto desce do teto até o rosto de quem se curvou, e demora. A respiração muda de compasso, de leve.',
        fala: 'Escama de outro tom, mas a postura de quem sabe onde pisa. — A cauda arrasta um tanto de moeda. — Faz tempo que ninguém me cumprimenta como se eu fosse alguém. Vou guardar isso, por enquanto. Ao que importa.',
        opcoes: [{ texto: '…', vai: 'paga' }],
      },
      'x:cancao': {
        narra: 'A voz sobe até o teto aberto e volta curta, pedra contra pedra. O dragão fecha o olho de vez, mas a ponta da cauda acompanha o compasso no meio das moedas.',
        fala: 'Mais. — Um instante. — Não, chega, antes que eu me acostume. Cantam bem, cantam depressa, e eu estou de bom humor, que é a única razão de vocês ainda estarem em pé.',
        opcoes: [{ texto: '…', vai: 'paga' }],
      },
      'x:erudito': {
        narra: 'Ele ouve até o fim, com a atenção torta de quem raramente é lembrado em voz alta.',
        fala: 'Errou duas coisas, e vou deixar passar, porque faz muito tempo que ninguém erra sobre mim com tanto cuidado. Vamos ao que importa.',
        opcoes: [{ texto: '…', vai: 'paga' }],
      },
      'x:elfo-pergunta': {
        fala: 'Não perguntei casa nem língua. Falavam baixo e andavam com a pressa de quem não gosta de sol. O resto vocês tiram do buraco, se acharem o buraco.',
        narra: 'Ele diz "buraco" como quem fala de uma mosca que o incomodou e já passou.',
        opcoes: [{ texto: 'E o senhor chegou a achar esse buraco?', vai: 'tinha' }],
      },
    },
    porNo: {
      oi: [
        // Quem tem escama sabe como se curva diante de um dragão, e cortesia sem medo é coisa rara naquele salão: a lisonja de sempre, com vantagem.
        {
          texto: '(Abaixar a cabeça devagar, com a cortesia de quem sabe diante de quem está)',
          perfil: { raca: 'draconato' },
          teste: { pericia: 'persuasao', cd: 14, vantagem: true }, sucesso: 'x:parente', falha: 'impaciente',
        },
        // Uma canção de improviso: a vaidade ouve melhor com melodia.
        {
          texto: '(Cantar de improviso a história do senhor desta torre, com todos os floreios que a sala aguenta)',
          perfil: { classe: 'bardo' },
          teste: { pericia: 'atuacao', cd: 12 }, sucesso: 'x:cancao', falha: 'impaciente',
        },
        // Mostrar que se sabe do assunto: o outro lado da mesma lisonja.
        {
          texto: '(Falar do que se conta de dragões da mata, sem errar o tom e sem pedir nada)',
          perfil: { classe: 'mago' },
          teste: { pericia: 'historia', cd: 12 }, sucesso: 'x:erudito', falha: 'impaciente',
        },
      ],
      acordo: [
        // A mesma recusa de "O velho não fez nada a nós.", dita por quem vive do mesmo mato.
        {
          texto: 'Esse velho cuida do mesmo mato que eu. Não vou arrancar o chão debaixo dos meus próprios pés.',
          perfil: { classe: 'druida' }, vai: 'recusou',
        },
      ],
      paga: [
        // O que um elfo repara: a casa, a língua, o andar.
        {
          texto: 'Um elfo do fundo da terra… (Perguntar pelo que só outro elfo repararia: a casa, a língua, o jeito de andar)',
          perfil: { raca: ['elfo', 'meioElfo'] }, uma: true, vai: 'x:elfo-pergunta',
        },
      ],
    },
  },

  // ------------------------------------------------------------------------------------------ o culto do dragão ----
  Favric: {
    nos: {
      // Mesmos dois destinos de `duvida`: os cultistas vacilam; ir embora (e valer o XP inteiro) ou lutar.
      'x:medo': {
        narra: 'Um dos de trás solta o ar pela boca. Favric não se mexe, mas a mão dele, em cima da mesa, abre e fecha.',
        fala: 'Essa não é a conta que eu fiz de manhã. — Ele engole. — Talvez a gente não precise terminar assim.',
        opcoes: [
          { texto: 'Então vão embora enquanto dá tempo.', fim: 'desiste' },
          { texto: 'Tarde demais.', fim: 'luta' },
        ],
      },
      // O olhar dos dois de trás, lido de perto: a mesma pista da cena (o olhar curto, de quem guarda um segredo).
      'x:leitura': {
        narra: 'O sorriso de Favric é decorado, de quem ensaiou o gesto. Os dois ao fundo evitam o grupo, e quando olham para alguma coisa, é para a porta. Aquela pressa não é a de quem ganhou um aliado.',
        fala: 'Algum problema? Parecem desconfiados, e eu só ofereci uma cama e uma apresentação.',
        opcoes: [
          { texto: 'Mesmo assim: combinado.', fim: 'aliado' },
          { texto: 'Pensando melhor, não.', fim: 'luta' },
        ],
      },
      'x:sem-leitura': {
        narra: 'Um sorriso de comerciante em dia de feira. Se há outra coisa por trás, está bem guardada.',
        fala: 'Então? Não costumo oferecer duas vezes.',
        opcoes: [
          { texto: 'Combinado.', fim: 'aliado' },
          { texto: 'Pensando melhor, não.', fim: 'luta' },
        ],
      },
    },
    porNo: {
      oi: [
        // Fé de verdade contra fé de fachada: o mesmo "ele vai comer vocês", dito por quem entende de fé.
        {
          texto: 'Fé de verdade protege quem reza. O que ele dá a vocês é um prazo, e vocês sabem disso.',
          perfil: { classe: ['clerigo', 'paladino'] }, requer: antesDaAlianca, oculta: true,
          teste: { pericia: 'persuasao', cd: 13, vantagem: true }, sucesso: 'duvida', falha: 'raiva',
        },
        // Força que se mostra: seis de manto contra quem não tem medo de dizer quantos cairiam primeiro.
        {
          texto: (ctx) => `(${ctx.quem.name} pousa a mão no cabo da arma e conta em voz alta, devagar, quantos deles caem primeiro)`,
          perfil: { atributo: { for: 17 } }, requer: antesDaAlianca, oculta: true,
          teste: { pericia: 'intimidacao', cd: 13 }, sucesso: 'x:medo', falha: 'raiva',
        },
        // Chifres de verdade entre máscaras de couro.
        {
          texto: '(Deixar a luz do fogareiro cair nos chifres de verdade, entre as máscaras de couro)',
          perfil: { raca: 'tiferino' }, requer: antesDaAlianca, oculta: true,
          teste: { pericia: 'intimidacao', cd: 13, vantagem: true }, sucesso: 'x:medo', falha: 'raiva',
        },
      ],
      alianca: [
        // Ler os dois que se entreolharam, e não o que sorri.
        {
          texto: '(Olhar com calma os dois que se entreolharam, e não o que sorri)',
          perfil: { atributo: { sab: 15 } }, uma: true,
          teste: { pericia: 'intuicao', cd: 12 }, sucesso: 'x:leitura', falha: 'x:sem-leitura',
        },
      ],
    },
  },

  // ------------------------------------------------------------------------------------------------- Reidoth ----
  Reidoth: {
    nos: {
      // O que o grupo vê na tela de "Tem certeza?" antes de entrar: o sopro em cone, o fôlego que volta, a fuga quando ferido.
      'x:sopro': {
        narra: 'Ele pensa um instante, e a resposta vem sem enfeite.',
        fala: [
          'Uma nuvem em cone, de gás verde, que cobre uma porta inteira e um pedaço do corredor depois dela. Quem respira não precisa ser pego pela garra para cair. E ele guarda fôlego para mais de uma.',
          'Não fiquem juntos na frente dele. E lembrem que é um dragão novo: quando está ferido de verdade, ele prefere ir embora a morrer. O difícil é chegar lá em pé.',
        ],
        opcoes: [{ texto: '…', vai: 'oi' }],
      },
      'x:escama': {
        narra: 'Ele olha a escama de quem perguntou com mais atenção do que olhou para qualquer outra coisa desde que vocês chegaram.',
        fala: 'Dois avisos, nenhum bom. Ele vai notar a escama e sentir curiosidade, e curiosidade de dragão vira cortesia ou apetite sem aviso. E não contem com parentesco: a escama de vocês não é a dele. Cortesia, porém, ele raramente recebe, e isso pode pesar a favor.',
        opcoes: [{ texto: '…', vai: 'oi' }],
      },
      'x:cinza': {
        narra: 'Ele olha para o símbolo, e não para a mão que o segura.',
        fala: 'Pouco. Não sei de onde vêm, nem o que os mantém de pé. Quem leva isso no pescoço devia entender melhor do que eu.',
        opcoes: [{ texto: '…', vai: 'oi' }],
      },
    },
    porNo: {
      dragao: [
        {
          texto: 'Todo mundo diz que dragão verde sopra veneno. Como é, de verdade, estar na frente de um?',
          perfil: { classe: ['mago', 'feiticeiro', 'bruxo'] }, uma: true, vai: 'x:sopro',
        },
        {
          texto: 'Há sangue de dragão em mim. O senhor tem algum conselho para quem se parece com aquilo?',
          perfil: { raca: 'draconato' }, uma: true, vai: 'x:escama',
        },
      ],
      avisos: [
        {
          texto: '(Erguer o símbolo sagrado) Esses mortos de cinza: há mais alguma coisa que o senhor saiba deles?',
          perfil: { classe: ['clerigo', 'paladino'] }, uma: true, vai: 'x:cinza',
        },
      ],
    },
  },

  // ----------------------------------------------------------------------------------- o Poço da Coruja Velha ----
  'Hamun Kost': {
    nos: {
      // Dito o que a pedra diz a um anão, ele passa direto à conversa que já existe: o "favor".
      'x:pedra': {
        narra: 'A pena dele para no ar. Pela primeira vez desde que saiu da tenda, ele olha para quem fala, e não para o que a pessoa interrompeu.',
        fala: 'Reparou. Melhor que a maioria. — Os olhos dele fazem uma conta. — Alvenaria de mago, feita para durar menos do que o orgulho de quem mandou levantar. E é justamente sobre esse alguém que eu tenho uma pergunta.',
        opcoes: [{ texto: 'Qual pergunta?', vai: 'favor' }],
      },
      // Pontes para os nós comuns: só aqui a pergunta comum é gasta, e só quando o teste do perfil passou.
      'x:selo-lido': {
        ao: (ctx) => gastar(ctx, 'oi:1'),
        fala: 'Conhece o desenho. Ótimo: poupa a nós dois a conversa de escola.',
        opcoes: [{ texto: '…', vai: 'tatuagem' }],
      },
      'x:manto-lido': {
        ao: (ctx) => gastar(ctx, 'oi:2'),
        fala: 'Já viajou, então, ou ouviu quem viajou. Poupa-me de explicar.',
        opcoes: [{ texto: '…', vai: 'manto' }],
      },
      'x:leitura': {
        narra: 'A pena dele para no ar toda vez que o olhar passa pela torre rachada, e só volta a andar quando ele desvia os olhos.',
        fala: 'Terminaram de me olhar? Tenho um capítulo para fechar.',
        opcoes: [{ texto: '…', vai: 'oi' }],
      },
      'x:sem-leitura': {
        narra: 'Rosto de quem passou a vida lendo em silêncio. Nada ali se mexe sem ele querer.',
        fala: 'Se acharam alguma coisa em mim, digam. Se não, a conversa continua de onde parou.',
        opcoes: [{ texto: '…', vai: 'oi' }],
      },
    },
    porNo: {
      oi: [
        // O selo da testa, para quem entende de magia: o mesmo Arcanismo, com vantagem. Só gasta a pergunta comum se acertar.
        {
          texto: (ctx) => `(${ctx.quem.name} examina o selo da testa dele, que um mago aprende a ler desde cedo)`,
          perfil: { classe: 'mago' }, requer: kostEmPaz, oculta: true, uma: true,
          teste: { pericia: 'arcanismo', cd: 10, vantagem: true }, sucesso: 'x:selo-lido', falha: 'nadaTatuagem',
        },
        // O que a fé sente nos mortos parados atrás dele.
        {
          texto: '(Sentir o que há de errado nos mortos parados atrás dele, e no desenho da testa)',
          perfil: { classe: ['clerigo', 'paladino'] }, requer: kostEmPaz, oculta: true, uma: true,
          teste: { pericia: 'religiao', cd: 8 }, sucesso: 'x:selo-lido', falha: 'nadaTatuagem',
        },
        // A história de viajante: o manto é justamente o tipo de coisa que se conta em estalagem.
        {
          texto: '(Puxar da memória uma canção ou uma história de viajante sobre aquele corte de manto)',
          perfil: { classe: 'bardo' }, requer: kostEmPaz, oculta: true, uma: true,
          teste: { pericia: 'historia', cd: 10, vantagem: true }, sucesso: 'x:manto-lido', falha: 'nadaManto',
        },
        // A pedra, para um anão: um jeito de chegar à mesma conversa do "favor".
        {
          texto: '(Olhar a pedra lavrada espalhada pelo capim, como quem sabe de pedra) Isto aqui não foi levantado por mão de anão. De quem foi?',
          perfil: { raca: 'anao' }, requer: kostSemAcordo, oculta: true, uma: true,
          efeito: (ctx) => gastar(ctx, 'oi:3'), vai: 'x:pedra',
        },
        // Ouvir o que ele evita dizer.
        {
          texto: '(Ouvir menos o que ele diz, e mais o que ele evita dizer)',
          perfil: { atributo: { sab: 15 } }, requer: kostEmPaz, oculta: true, uma: true,
          teste: { pericia: 'intuicao', cd: 12 }, sucesso: 'x:leitura', falha: 'x:sem-leitura',
        },
      ],
    },
  },

  // ----------------------------------------------------------------------------------- o Castelo Dentefino ----
  'Gundren Rockseeker': {
    nos: {
      'x:anao': {
        narra: 'Ele ri uma vez, curto, e a risada dói.',
        fala: 'Isso. Isso! Alguém que sabe o que uma mina vale para um anão.',
        opcoes: [{ texto: '…', vai: 'irmaos' }],
      },
      'x:firme': {
        narra: 'A cor volta ao rosto aos poucos, e a respiração deixa de ser picada para virar compasso.',
        fala: 'Melhor. Muito melhor. Agora eu consigo falar.',
        opcoes: [{ texto: '…', vai: 'irmaos' }],
      },
      'x:fraco': {
        narra: 'Ele tosse, bebe um gole, e quase derruba o que sobrou da água. Não é urgente, mas é lento.',
        fala: 'Calma… me deem um instante.',
        opcoes: [{ texto: '…', vai: 'x:de-novo' }],
      },
      'x:de-novo': {
        fala: 'Pronto. Podem perguntar.',
        opcoes: [
          { texto: 'Seus irmãos?', vai: 'irmaos' },
          { texto: 'Vamos levar você para casa.', fim: 'paz' },
        ],
      },
    },
    porNo: {
      oi: [
        // Anão fala com anão: o mesmo "Seus irmãos?", dito de outro jeito.
        {
          texto: 'Mina de família se defende em família. Onde estão os seus?',
          perfil: { raca: 'anao' }, uma: true,
          efeito: (ctx) => gastar(ctx, 'oi:0'), vai: 'x:anao',
        },
        // Cuidar antes de perguntar.
        {
          texto: (ctx) => `(${ctx.quem.name} ajoelha, examina os ferimentos e dá água a ele, devagar, antes de qualquer pergunta)`,
          perfil: { classe: ['clerigo', 'druida', 'patrulheiro'] }, uma: true,
          efeito: (ctx) => gastar(ctx, 'oi:0'),
          teste: { pericia: 'medicina', cd: 8 }, sucesso: 'x:firme', falha: 'x:fraco',
        },
      ],
    },
  },
};
