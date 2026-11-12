// OS ANTECEDENTES DOS OUTROS LIVROS: as variantes do Livro do Jogador, o Guia da Costa da Espada, o Acquisitions Incorporated e
// o Bigby (o plano em `revisoes/racas-plano-2026-11-12.md`). Mesmo formato de `criador.js ANTECEDENTES`, que os soma.
//
// O antecedente do jogo é o que ele faz na ficha: as duas perícias do livro e a sugestão de um talento de origem (o do
// livro de 2024 que mais se parece, regra da casa, como nos treze do PHB). A característica de cada um (o abrigo dos
// fiéis, a rede de informantes) é de mesa, e o jogo não a modela, como nos do PHB. Os textos são nossos.
//
//   pericias  as fixas do livro
//   escolhe   { quantas, de }: as que o livro deixa escolher de uma lista (o erudito enclausurado, o caçador de recompensas)
//   livro     a sigla do livro, para o criador agrupar

export const ANTECEDENTES_DOS_LIVROS = {
  // ---- as variantes do Livro do Jogador ----------------------------------
  espiao: { nome: 'Espião', nomeF: 'Espiã', pericias: ['enganacao', 'furtividade'], talento: 'alerta', livro: 'PHB',
    resumo: 'Vendia segredos em vez de bolsas: tem contatos dos dois lados da lei e sabe sumir numa multidão.' },
  gladiador: { nome: 'Gladiador', nomeF: 'Gladiadora', pericias: ['acrobacia', 'atuacao'], talento: 'atacanteSelvagem', livro: 'PHB',
    resumo: 'Lutou na arena para uma plateia que gritava: sabe fazer da briga um espetáculo.' },
  mercadorDeGuilda: { nome: 'Mercador de Guilda', nomeF: 'Mercadora de Guilda', pericias: ['intuicao', 'persuasao'], talento: 'sortudo', livro: 'PHB',
    resumo: 'Comprava e vendia em nome de uma guilda: conhece preço, rota e quem paga a dívida.' },
  cavaleiro: { nome: 'Cavaleiro', nomeF: 'Cavaleira', pericias: ['historia', 'persuasao'], talento: 'habilidoso', livro: 'PHB',
    resumo: 'Nobre que jurou servir: tem título, escudeiro e uma honra a zelar.' },
  pirata: { nome: 'Pirata', nomeF: 'Pirata', pericias: ['atletismo', 'percepcao'], talento: 'brigaoDeTaverna', livro: 'PHB',
    resumo: 'Viveu de abordagem e saque no mar: o nome dele ainda dá medo em alguns portos.' },

  // ---- Guia da Costa da Espada -------------------------------------------
  guardaDaCidade: { nome: 'Guarda da Cidade', nomeF: 'Guarda da Cidade', pericias: ['atletismo', 'intuicao'], talento: 'alerta', livro: 'SCAG',
    resumo: 'Fez ronda nas ruas de uma cidade grande: reconhece encrenca antes de ela começar.' },
  investigador: { nome: 'Investigador', nomeF: 'Investigadora', pericias: ['intuicao', 'investigacao'], talento: 'alerta', livro: 'SCAG',
    resumo: 'A guarda o pôs atrás dos crimes que ninguém resolvia: segue pista, interroga e liga os fatos.' },
  artesaoDeCla: { nome: 'Artesão de Clã', nomeF: 'Artesã de Clã', pericias: ['historia', 'intuicao'], talento: 'artesao', livro: 'SCAG',
    resumo: 'Aprendeu o ofício na oficina de um clã anão: o nome do clã abre portas onde há pedra e forja.' },
  eruditoEnclausurado: { nome: 'Erudito Enclausurado', nomeF: 'Erudita Enclausurada', pericias: ['historia'], escolhe: { quantas: 1, de: ['arcanismo', 'natureza', 'religiao'] },
    talento: 'iniciadoEmMagia', iniciado: 'mago', livro: 'SCAG',
    resumo: 'Cresceu entre as estantes de uma grande biblioteca: sabe onde procurar o que os livros guardam.' },
  cortesao: { nome: 'Cortesão', nomeF: 'Cortesã', pericias: ['intuicao', 'persuasao'], talento: 'habilidoso', livro: 'SCAG',
    resumo: 'Andou pelos salões de quem governa: lê a etiqueta e as intrigas de uma corte.' },
  agenteDeFaccao: { nome: 'Agente de Facção', nomeF: 'Agente de Facção', pericias: ['intuicao'],
    escolhe: { quantas: 1, de: ['arcanismo', 'lidarComAnimais', 'enganacao', 'historia', 'intimidacao', 'investigacao', 'medicina', 'natureza', 'percepcao', 'atuacao', 'persuasao', 'religiao', 'sobrevivencia'] },
    talento: 'habilidoso', livro: 'SCAG',
    resumo: 'Trabalha para uma das grandes facções do Norte: tem sinais secretos e aliados em toda cidade.' },
  viajanteDistante: { nome: 'Viajante de Terras Distantes', nomeF: 'Viajante de Terras Distantes', pericias: ['intuicao', 'percepcao'], talento: 'sortudo', livro: 'SCAG',
    resumo: 'Veio de muito longe, e tudo nele mostra isso: o sotaque, a roupa, o olhar de quem estranha a terra.' },
  herdeiro: { nome: 'Herdeiro', nomeF: 'Herdeira', pericias: ['sobrevivencia'], escolhe: { quantas: 1, de: ['arcanismo', 'historia', 'religiao'] },
    talento: 'sortudo', livro: 'SCAG',
    resumo: 'Recebeu uma herança que outros cobiçam: um objeto, um título ou um segredo, e quem quer tomá-lo.' },
  cavaleiroDaOrdem: { nome: 'Cavaleiro da Ordem', nomeF: 'Cavaleira da Ordem', pericias: ['persuasao'], escolhe: { quantas: 1, de: ['arcanismo', 'historia', 'natureza', 'religiao'] },
    talento: 'vigoroso', livro: 'SCAG',
    resumo: 'Jurou a uma ordem de cavalaria: a ordem o abriga onde houver uma casa dela, e cobra o juramento.' },
  veteranoMercenario: { nome: 'Veterano Mercenário', nomeF: 'Veterana Mercenária', pericias: ['atletismo', 'persuasao'], talento: 'atacanteSelvagem', livro: 'SCAG',
    resumo: 'Lutou por pagamento numa companhia: conhece as outras companhias e o preço de uma espada.' },
  cacadorDeRecompensas: { nome: 'Caçador de Recompensas Urbano', nomeF: 'Caçadora de Recompensas Urbana', pericias: [],
    escolhe: { quantas: 2, de: ['enganacao', 'intuicao', 'persuasao', 'furtividade'] }, talento: 'alerta', livro: 'SCAG',
    resumo: 'Caçava gente procurada pelas ruas: tem informantes nos becos e nas tavernas.' },
  membroUthgardt: { nome: 'Membro de Tribo Uthgardt', nomeF: 'Membro de Tribo Uthgardt', pericias: ['atletismo', 'sobrevivencia'], talento: 'vigoroso', livro: 'SCAG',
    resumo: 'Cresceu numa tribo do Norte selvagem: conhece os montes sagrados e caça para comer.' },
  nobreDeAguasProfundas: { nome: 'Nobre de Águas Profundas', nomeF: 'Nobre de Águas Profundas', pericias: ['historia', 'persuasao'], talento: 'habilidoso', livro: 'SCAG',
    resumo: 'Filho de uma casa nobre da Cidade dos Esplendores: o nome da família pesa, para o bem e para o mal.' },

  // ---- Acquisitions Incorporated -----------------------------------------
  herdeiroDeCelebridade: { nome: 'Herdeiro de Celebridade', nomeF: 'Herdeira de Celebridade', pericias: ['percepcao', 'atuacao'], talento: 'musico', livro: 'AI',
    resumo: 'Filho de um aventureiro famoso: todo mundo conhece o nome, e espera que esteja à altura dele.' },
  mercadorFalido: { nome: 'Mercador Falido', nomeF: 'Mercadora Falida', pericias: ['investigacao', 'persuasao'], talento: 'sortudo', livro: 'AI',
    resumo: 'Teve uma loja, e a loja quebrou: sabe o valor das coisas, e aprendeu o que não fazer.' },
  apostador: { nome: 'Apostador', nomeF: 'Apostadora', pericias: ['enganacao', 'intuicao'], talento: 'sortudo', livro: 'AI',
    resumo: 'Vive do jogo e da sorte: lê um blefe à mesa, e conhece todas as casas de aposta da região.' },
  querelante: { nome: 'Querelante', nomeF: 'Querelante', pericias: ['medicina', 'persuasao'], talento: 'curandeiro', livro: 'AI',
    resumo: 'Foi lesado por alguém poderoso e quer justiça: segue o processo, e o processo o segue.' },
  estagiarioRival: { nome: 'Estagiário Rival', nomeF: 'Estagiária Rival', pericias: ['historia', 'investigacao'], talento: 'habilidoso', livro: 'AI',
    resumo: 'Trabalhou para uma companhia de aventureiros concorrente: sabe como ela funciona por dentro.' },

  // ---- Bigby ------------------------------------------------------------
  // O livro dá um talento próprio a cada um (o Golpe dos Gigantes, o Moldador de Runas), que o jogo não tem: a sugestão é a
  // do talento de origem mais perto.
  enjeitadoDosGigantes: { nome: 'Enjeitado dos Gigantes', nomeF: 'Enjeitada dos Gigantes', pericias: ['intimidacao', 'sobrevivencia'], talento: 'vigoroso', livro: 'BGG',
    resumo: 'Foi criado por gigantes: cresceu entre coisas grandes demais, e nada mais o assusta pelo tamanho.' },
  entalhadorDeRunas: { nome: 'Entalhador de Runas', nomeF: 'Entalhadora de Runas', pericias: ['historia', 'percepcao'], talento: 'artesao', livro: 'BGG',
    resumo: 'Aprendeu a talhar as runas dos gigantes: lê a magia antiga escrita na pedra.' },
};

/** O porquê de ir a Phandalin de cada um, como `criador.js MOTIVO_DO_ANTECEDENTE`. Texto nosso. */
export const MOTIVO_DOS_LIVROS = {
  espiao: 'Alguém em Neverwinter paga bem para saber quem anda comprando as terras em volta de Phandalin.',
  gladiador: 'A arena fechou, e a estrada da fronteira paga a quem sabe lutar.',
  mercadorDeGuilda: 'A guilda quer abrir uma rota de comércio até as minas reabertas, e alguém precisa ver o caminho.',
  cavaleiro: 'A casa dele deve proteção às vilas da fronteira, e os goblins da estrada são uma desonra a lavar.',
  pirata: 'Desembarcou em Neverwinter com o nome sujo nos portos; terra adentro, ninguém o conhece.',
  guardaDaCidade: 'Dispensado da guarda de Neverwinter, ouviu que Phandalin não tem guarda nenhuma.',
  investigador: 'Uma pista de um caso antigo, que a guarda arquivou, leva até Phandalin.',
  artesaoDeCla: 'O clã quer saber se a mina perdida dos anões, a de Phandelver, é verdade, e mandou alguém do ofício.',
  eruditoEnclausurado: 'A biblioteca guarda um mapa velho da Forja dos Feitiços, e alguém precisa conferir o terreno.',
  cortesao: 'Um senhor de Neverwinter quer olhos de confiança na vila que volta a crescer.',
  agenteDeFaccao: 'A facção mandou ver o que se passa na fronteira, e não disse tudo o que sabe.',
  viajanteDistante: 'Chegou de terras distantes atrás de uma lenda de mina e magia, e Phandalin é onde ela aponta.',
  herdeiro: 'O que herdou aponta para as colinas de Phandalin, e há quem chegue lá primeiro se ele demorar.',
  cavaleiroDaOrdem: 'A ordem mandou servir onde a lei não chega, e a estrada de Phandalin é esse lugar.',
  veteranoMercenario: 'Uma escolta de carroça é trabalho honesto para quem perdeu a companhia.',
  cacadorDeRecompensas: 'Há um procurado escondido na fronteira, e a recompensa por ele é boa.',
  membroUthgardt: 'Os sinais dos ancestrais apontaram para o sul, para as colinas em volta de Phandalin.',
  nobreDeAguasProfundas: 'A família comprou terras na fronteira e quer saber se valeram o preço.',
  herdeiroDeCelebridade: 'O pai famoso passou por Phandalin anos atrás, e deixou uma história mal contada.',
  mercadorFalido: 'Uma vila de garimpo que renasce é onde se recomeça um negócio.',
  apostador: 'Apostou que chegava a Phandalin antes do fim do mês, e pretende ganhar.',
  querelante: 'Quem lhe deve justiça fugiu para a fronteira, e ele foi atrás.',
  estagiarioRival: 'A antiga companhia está de olho na mina perdida, e ele quer chegar antes.',
  enjeitadoDosGigantes: 'Os gigantes que o criaram falavam de ruínas nas colinas ao sul, e ele quer vê-las.',
  entalhadorDeRunas: 'Há runas de gigante numa pedra perto de Phandalin, e ninguém sabe lê-las.',
};

/** Os livros dos antecedentes, na ordem do criador. */
export const LIVROS_DOS_ANTECEDENTES = [['PHB', 'Livro do Jogador'], ['SCAG', 'Costa da Espada'], ['AI', 'Acquisitions Inc.'], ['BGG', 'Bigby']];
