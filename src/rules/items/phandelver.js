// Os itens nomeados da Mina Perdida de Phandelver.
//
// LICENÇA — LEIA ANTES DE MEXER
// Os NOMES (Talon, Lightbringer, Hew, Dragonguard, Cajado Aranha, Cajado de
// Defesa, Forja das Magias) são usados sob a Fan Content Policy da Wizards of
// the Coast, que permite nome e conceito em obra de fã gratuita. É por isso
// que este jogo não pode cobrar nada: o dia em que cobrar, esta pasta vira
// problema.
//
// As MECÂNICAS vêm da aventura. Regra não é texto, e número não é expressão.
//
// As DESCRIÇÕES são escritas aqui, para este projeto. Nenhuma linha abaixo é
// transcrita nem parafraseada de perto do módulo publicado. Se você for
// acrescentar um item, escreva a frase com as suas palavras — copiar a do
// livro é o que transforma fan content em infração.
//
// Por isso `fonte: 'propria'` em tudo: não é SRD, e não dá para conferir num
// documento aberto. Quem auditar este repositório tem de ver isso de longe.

const nomeado = (id, name, raridade, desc, extra = {}) => ({
  id, name, tipo: 'mágico', art: 'arcano', pilha: false,
  raridade, sintonia: false, peso: 2, desc,
  fonte: 'propria', campanha: 'phandelver', ...extra,
});

export const PHANDELVER_ITEMS = {
  // ------------------------------------------- saídas da Forja das Magias ----
  talon: nomeado('talon', 'Talon', 'incomum',
    'Espada longa +1, de copo em forma de falcão. Foi de um cavaleiro Tresendar, há muito tempo.',
    { tipo: 'arma mágica', art: 'espada', peso: 3, bonusAtaque: 1, bonusDano: 1, base: 'espadaLonga' }),

  lightbringer: nomeado('lightbringer', 'Lightbringer', 'incomum',
    'Maça +1 consagrada ao deus da aurora. Uma palavra e a cabeça brilha como tocha; brilhando, bate com mais 1d6 de radiante, mas só em morto-vivo.',
    { tipo: 'arma mágica', art: 'maca', peso: 4, bonusAtaque: 1, bonusDano: 1, base: 'maca', danoExtra: '1d6', tipoExtra: 'radiante', contra: 'morto-vivo' }),

  hew: nomeado('hew', 'Hew', 'incomum',
    'Machado de batalha +1 que corta madeira como quem corta pão. Contra criatura vegetal ou coisa de madeira, cada dado de dano sai no valor máximo.',
    { tipo: 'arma mágica', art: 'machado', peso: 4, bonusAtaque: 1, bonusDano: 1, base: 'machadoDeBatalha', danoMaximoContra: 'planta' }),

  dragonguard: nomeado('dragonguard', 'Dragonguard', 'raro',
    'Peitoral de aço +1 com um dragão dourado lavrado no peito. Quem o veste tem vantagem nas resistências contra o sopro de dragão. Não pede sintonia.',
    { tipo: 'armadura mágica', art: 'escudo', peso: 20, acBonusArmadura: 1, base: 'peitoral' }),

  cajadoAranha: nomeado('cajadoAranha', 'Cajado Aranha', 'raro',
    'Bordão de adamante negro com uma aranha esculpida na ponta. Bate com mais 1d6 de veneno. Dez cargas gastam Patas de Aranha (1) e Teia (2, CD 15); recupera 1d6 + 4 ao anoitecer, e se a última carga acaba, um 1 no d20 o desfaz em pó.',
    { tipo: 'cajado', art: 'cajado', peso: 5, sintonia: true, base: 'bordao', danoExtra: '1d6', tipoExtra: 'veneno', cargas: 10 }),

  cajadoDeDefesa: nomeado('cajadoDeDefesa', 'Cajado de Defesa', 'incomum',
    'Bordão de ponta recurvada com seis cargas. Gasta uma para Armadura Arcana, uma para Escudo. Recarrega ao amanhecer.',
    { tipo: 'cajado', art: 'cajado', peso: 4, sintonia: true, base: 'bordao', cargas: 6 }),

  // ------------------------------------------------ tesouro com nome próprio ----
  penteDeAgatha: nomeado('penteDeAgatha', 'Pente de prata de Agatha', 'incomum',
    'Pente de prata trabalhada, com pedrinhas. A Irmã Garaele o manda de presente para a banshee de Conyberry.',
    { tipo: 'maravilhoso', peso: 0.5, valor: 25 }),

  esmeraldaDoAranhaNegra: nomeado('esmeraldaDoAranhaNegra', 'Pingente de esmeralda', 'incomum',
    'Esmeralda num fio de prata, do tipo que um drow usa para pagar favores que não quer dever.',
    { tipo: 'maravilhoso', peso: 0, valor: 100 }),

  estatuetaDeSapo: nomeado('estatuetaDeSapo', 'Sapo de jade', 'comum',
    'Estatueta de jade do tamanho de um punho, com olhos de pedra dourada. Vale mais pelo lapidário que pelo peso.',
    { tipo: 'maravilhoso', peso: 1, valor: 40 }),

  // ---------------------------------------- tesouro de Árvore Trovão ----
  // O colar que a família Dendrar escondeu na loja de ervas (200 po). Devolvê-lo
  // à Mirna fecha a missão e rende o XP; ficar com ele rende o preço dele.
  colarDeMirna: nomeado('colarDeMirna', 'Colar de esmeralda', 'incomum',
    'Colar de ouro fino com um pingente de esmeralda. Foi da família Dendrar, e a Mirna o escondeu numa caixa quando a vila morreu.',
    { tipo: 'maravilhoso', peso: 0, valor: 200 }),
  // O cofre dos cultistas (área 13 do livro): três diamantes (100 po cada) e uma poção de voo.
  diamante: nomeado('diamante', 'Diamante', 'incomum',
    'Pedra clara e dura, lapidada com capricho. Quem a deixou no cofre sabia o que valia.',
    { tipo: 'tesouro', pilha: true, peso: 0, valor: 100 }),
  // CAVERNA ONDA ECO: o tesouro que a mina guarda (valores em po; o electro do livro entra em prata, 1 pe = 5 pp).
  anelDePlatinaDoMago: nomeado('anelDePlatinaDoMago', 'Anel de platina do mago', 'incomum',
    'Um aro de platina liso, gasto por dentro: o anel de um mago que morreu defendendo as minas, e que a água do lago não enferrujou.',
    { tipo: 'tesouro', pilha: true, peso: 0, valor: 75 }),
  cachimboDePlatina: nomeado('cachimboDePlatina', 'Cachimbo de madeira e platina', 'incomum',
    'Um cachimbo de madeira escura com filigrana de platina no bojo. Quem o fumava gostava de coisa bem-feita, e ficou sem ele.',
    { tipo: 'tesouro', peso: 0, valor: 150 }),
  gemaPequena: nomeado('gemaPequena', 'Gema pequena', 'comum',
    'Uma pedra lapidada do tamanho de uma semente, de cor boa. Vale pouco cada uma, e muito junto.',
    { tipo: 'tesouro', pilha: true, peso: 0, valor: 10 }),
  canecaDeEletro: nomeado('canecaDeEletro', 'Caneca de cerveja de electro', 'incomum',
    'Uma caneca anã de electro batido, com um desenho de martelos cruzados. Foi feita para encher e passar adiante.',
    { tipo: 'tesouro', peso: 1, valor: 100 }),
  chaveDoAranhaNegra: nomeado('chaveDoAranhaNegra', 'Chave de ferro da bigorninha', 'comum',
    'Uma chave pesada, de ferro, rematada numa bigorninha. Abre a porta dos aposentos do sacerdote, no templo.',
    { tipo: 'chave', peso: 0, valor: 0 }),
  mapaDeMormesk: nomeado('mapaDeMormesk', 'Mapa costurado na capa de um tomo', 'incomum',
    'Um mapa fino, costurado por dentro da capa de um livro: mostra onde fica uma masmorra feita por Mormesk, o espectro da mina.',
    { tipo: 'mapa', peso: 0, valor: 0 }),
  // Os cálices do mago morto, no baú da torre (60 po cada).
  caliceDeSelenita: nomeado('caliceDeSelenita', 'Cálice de prata com selenita', 'comum',
    'Cálice de prata com uma pedra leitosa engastada na base. O mago que morreu na torre colecionava.',
    { tipo: 'tesouro', pilha: true, peso: 0.5, valor: 60 }),

  // ----------------------------------------------------- pergaminhos de magia ----
  // A aventura espalha vários. Entram como um item por magia, porque é assim
  // que um pergaminho funciona: ele é a magia, e some ao ser lido.
  pergaminhoDeMagia: nomeado('pergaminhoDeMagia', 'Pergaminho de magia', 'comum',
    'Uma única magia escrita para ser lida uma vez só. O pergaminho vira cinza junto com a conjuração.',
    { tipo: 'pergaminho', art: 'arcano', pilha: true, peso: 0, consumivel: 'magia', acao: 'acao' }),
  // Os três do esconderijo dos Marcarrubra. Ainda não se leem em combate (o
  // motor não conjura de pergaminho): por ora são tesouro, e o Câmbio de
  // Minério paga o preço de tabela.
  pergaminhoDePassoNebuloso: nomeado('pergaminhoDePassoNebuloso', 'Pergaminho de Passo Nebuloso', 'incomum',
    'Passo Nebuloso, escrito para uma leitura só. Por ora, vale o que um mago pagar.',
    { tipo: 'pergaminho', art: 'arcano', pilha: true, peso: 0, valor: 100, magia: 'passoNebuloso' }),
  pergaminhoDeRelampago: nomeado('pergaminhoDeRelampago', 'Pergaminho de Relâmpago', 'incomum',
    'Relâmpago, escrito para uma leitura só. Por ora, vale o que um mago pagar.',
    { tipo: 'pergaminho', art: 'arcano', pilha: true, peso: 0, valor: 150, magia: 'relampago' }),
  pergaminhoDeAuguro: nomeado('pergaminhoDeAuguro', 'Pergaminho de Augúrio', 'incomum',
    'Augúrio, escrito para uma leitura só. Por ora, vale o que um mago pagar.',
    { tipo: 'pergaminho', art: 'arcano', pilha: true, peso: 0, valor: 50, magia: 'augurio' }),
  pergaminhoDeEnfeiticar: nomeado('pergaminhoDeEnfeiticar', 'Pergaminho de Enfeitiçar Pessoa', 'comum',
    'Enfeitiçar Pessoa, escrito para uma leitura só. Por ora, vale o que um mago pagar.',
    { tipo: 'pergaminho', art: 'arcano', pilha: true, peso: 0, valor: 25, magia: 'enfeiticarPessoa' }),
  // O do Poço da Coruja Velha, num tubo de osso.
  pergaminhoDeEscuridao: nomeado('pergaminhoDeEscuridao', 'Pergaminho de Escuridão', 'incomum',
    'Escuridão, escrita para uma leitura só, guardada num tubo de osso. Por ora, vale o que um mago pagar.',
    { tipo: 'pergaminho', art: 'arcano', pilha: true, peso: 0, valor: 50, magia: 'escuridao' }),
  pergaminhoDeSilencio: nomeado('pergaminhoDeSilencio', 'Pergaminho de Silêncio', 'incomum',
    'Silêncio, escrito para uma leitura só. Por ora, vale o que um mago pagar.',
    { tipo: 'pergaminho', art: 'arcano', pilha: true, peso: 0, valor: 50, magia: 'silencio' }),
  pergaminhoDeReviver: nomeado('pergaminhoDeReviver', 'Pergaminho de Revivificar', 'raro',
    'Revivificar, escrito para uma leitura só. Por ora, vale o que um clérigo pagar.',
    { tipo: 'pergaminho', art: 'arcano', pilha: true, peso: 0, valor: 150, magia: 'revivificar' }),
  pergaminhoDeBolaDeFogo: nomeado('pergaminhoDeBolaDeFogo', 'Pergaminho de Bola de Fogo', 'incomum',
    'Bola de Fogo, escrita para uma leitura só. Por ora, vale o que um mago pagar.',
    { tipo: 'pergaminho', art: 'arcano', pilha: true, peso: 0, valor: 150, magia: 'bolaDeFogo' }),

  // ------------------------------------------------------------ a Casa da Morte (Maldição de Strahd) ----
  // Itens da sala secreta da biblioteca. Os papéis envelhecem se saírem da casa (o livro), mas continuam inteiros.
  chaveDeFerroDosDurst: nomeado('chaveDeFerroDosDurst', 'Chave de ferro dos Durst', 'comum',
    'Uma chave de ferro comprida, achada na gaveta da escrivaninha. Abre a porta trancada do quarto das crianças, no último andar.',
    { tipo: 'chave', peso: 0, valor: 0 }),
  livroEmBrancoPreto: nomeado('livroEmBrancoPreto', 'Livro em branco de capa preta', 'comum',
    'Um livro de couro preto, de páginas limpas. Papel bom, caro, e cheira a tinta que nunca chegou.',
    { tipo: 'tesouro', pilha: true, peso: 1, valor: 25 }),
  pergaminhoDeBencao: nomeado('pergaminhoDeBencao', 'Pergaminho de Bênção', 'comum',
    'Bênção, escrita para uma leitura só. Por ora, vale o que um clérigo pagar.',
    { tipo: 'pergaminho', art: 'arcano', pilha: true, peso: 0, valor: 50, magia: 'bencao' }),
  pergaminhoDeProtecaoContraVeneno: nomeado('pergaminhoDeProtecaoContraVeneno', 'Pergaminho de Proteção contra Veneno', 'incomum',
    'Proteção contra Veneno, escrita para uma leitura só. Por ora, vale o que um clérigo pagar.',
    { tipo: 'pergaminho', art: 'arcano', pilha: true, peso: 0, valor: 100, magia: 'protecaoContraVeneno' }),
  pergaminhoDeArmaEspiritual: nomeado('pergaminhoDeArmaEspiritual', 'Pergaminho de Arma Espiritual', 'incomum',
    'Arma Espiritual, escrita para uma leitura só. Por ora, vale o que um clérigo pagar.',
    { tipo: 'pergaminho', art: 'arcano', pilha: true, peso: 0, valor: 100, magia: 'armaEspiritual' }),
  escrituraDaCasaDosDurst: nomeado('escrituraDaCasaDosDurst', 'Escritura da Casa da Morte', 'comum',
    'A escritura da casa de Baróvia, em nome dos Durst. O papel amarelece se sair da casa.',
    { tipo: 'documento', peso: 0, valor: 0 }),
  escrituraDoMoinho: nomeado('escrituraDoMoinho', 'Escritura de um moinho de vento', 'comum',
    'A escritura de um moinho nas montanhas a leste de Vallaki, com o moinho dourado dos Durst no selo.',
    { tipo: 'documento', peso: 0, valor: 0 }),
  testamentoDosDurst: nomeado('testamentoDosDurst', 'Testamento de Gustav e Elisabeth Durst', 'comum',
    'Deixa a casa, o moinho e o resto dos bens a Rosavalda e Thornboldt Durst, quando os pais morrerem.',
    { tipo: 'documento', peso: 0, valor: 0 }),
  // O 3º andar e as masmorras: os tesouros que o livro dá (valores em peças de ouro).
  caixaDeJoiasDosDurst: nomeado('caixaDeJoiasDosDurst', 'Caixa de joias de prata', 'comum',
    'Prata com filigrana de ouro, sobre a penteadeira da suíte principal. Vazia, ainda vale uma boa soma.',
    { tipo: 'tesouro', peso: 1, valor: 75 }),
  anelDeOuro: nomeado('anelDeOuro', 'Anel de ouro', 'comum',
    'Um aro de ouro liso, de dedo fino.',
    { tipo: 'tesouro', pilha: true, peso: 0, valor: 25 }),
  colarDeTopazio: nomeado('colarDeTopazio', 'Colar de platina com topázio', 'comum',
    'Um fio fino de platina e um pingente de topázio do tamanho de uma unha. Das coisas mais caras desta casa.',
    { tipo: 'tesouro', peso: 0, valor: 750 }),
  agataMusgo: nomeado('agataMusgo', 'Ágata-musgo', 'comum',
    'Uma pedrinha verde-clara, de fiapos escuros dentro, como musgo debaixo da água.',
    { tipo: 'tesouro', pilha: true, peso: 0, valor: 10 }),
  escovaDeMarfim: nomeado('escovaDeMarfim', 'Escova de cabelo de marfim', 'comum',
    'Cabo de marfim e cerdas de prata. Gasta, mas de dono rico.',
    { tipo: 'tesouro', peso: 0, valor: 25 }),
  espadaCurtaPrateada: nomeado('espadaCurtaPrateada', 'Espada curta prateada', 'comum',
    'Lâmina banhada de prata. Boa para o que as armas comuns não ferem, mas a regra da prata ainda não está no jogo: por ora vale pelo preço.',
    { tipo: 'tesouro', peso: 2, valor: 110 }),
  orbeDeCristalCinza: nomeado('orbeDeCristalCinza', 'Orbe de cristal cinza', 'comum',
    'A esfera esfumaçada que a estátua de Strahd segurava. Serve de foco arcano, mas não é mágica.',
    { tipo: 'tesouro', peso: 1, valor: 25 }),
  livroDeMagiasDosCultistas: nomeado('livroDeMagiasDosCultistas', 'Livro de magias de capa amarela', 'comum',
    'Um grimório de couro amarelo, de um aventureiro que o culto matou. 1º círculo: armadura arcana, disfarçar, identificação, mísseis mágicos, proteção contra o bem e mal. 2º círculo: arma mágica, imobilizar pessoa, invisibilidade, visão no escuro.',
    { tipo: 'tesouro', art: 'arcano', peso: 3, valor: 50 }),
  ossosDeRose: nomeado('ossosDeRose', 'Os ossos de Rose', 'comum',
    'Um embrulho de ossinhos de criança, no vestido esfarrapado. Um enterro digno é o que Rose nunca teve.',
    { tipo: 'chave', peso: 2, valor: 0 }),
  ossosDeThorn: nomeado('ossosDeThorn', 'Os ossos de Thorn', 'comum',
    'Um embrulho de ossinhos de menino, ainda abraçados ao boneco de pano. Um enterro digno é o que Thorn nunca teve.',
    { tipo: 'chave', peso: 2, valor: 0 }),
};

/**
 * O que cada encontro da campanha pode largar.
 *
 * Fica aqui, e não em `encounter.js`, porque é tabela de TESOURO e não de
 * monstro: quem mexe no que o Aranha Negra carrega não devia ter de abrir o
 * arquivo que monta o tabuleiro. As chaves são ids de criatura.
 */
export const TESOURO_POR_INIMIGO = {
  nezznar: ['cajadoAranha', 'esmeraldaDoAranhaNegra'],
  iarno: ['cajadoDeDefesa', 'pocaoDeCura'],
  // (Sem entrada para o chefe goblin: as duas poções de Klarg estão no BAÚ do covil, não no corpo — `capitulo2.js` as
  // entrega. A chave antiga `chefeGoblin` não casava com id de monstro nenhum, e ligá-la a Klarg as daria em dobro.)
  hobgoblin: ['moedaDeOuro'],
};
