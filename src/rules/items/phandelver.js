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
    { tipo: 'cajado', art: 'cajado', peso: 5, sintonia: true, base: 'bordao', danoExtra: '1d6', tipoExtra: 'veneno', cargas: 10,
      conjura: { cargas: 10, recarga: '1d6+4', cd: 15, magias: { patasDeAranha: { custo: 1 }, teia: { custo: 2 } } } }),

  // O CAJADO QUE DÁ O NOME AO CAJAVIDRO, e por um tempo o nome não batia com a peça: o item era um "bordão de
  // ponta recurvada" de SEIS cargas, enquanto o bloco do Cajavidro (`monsters/humanoides.js`) já falava de
  // cajado de VIDRO com DEZ. O livro é o do bloco: cajado de vidro, dez cargas, 1d6 + 4 ao amanhecer, Armadura
  // Arcana por uma e Escudo Arcano por duas. Quem acha a peça na Mansão lê a descrição dela, não o bloco.
  cajadoDeDefesa: nomeado('cajadoDeDefesa', 'Cajado de Defesa', 'incomum',
    'Cajado de vidro fosco, fino, pouco mais de um metro, que não parece aguentar uma pancada e aguenta. Dez cargas: uma para Armadura Arcana, duas para Escudo Arcano. Recupera 1d6 + 4 cargas ao amanhecer.',
    { tipo: 'cajado', art: 'cajado', peso: 4, sintonia: true, base: 'bordao', cargas: 10,
      conjura: { cargas: 10, recarga: '1d6+4', magias: { armaduraArcana: { custo: 1 }, escudoArcano: { custo: 2 } } } }),

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
  // O Obelisco: TRÊS anéis de ouro com pedras, de 150 po cada (a Mina dava dois de platina). O id ficou, pelo save.
  anelDePlatinaDoMago: nomeado('anelDePlatinaDoMago', 'Anel de ouro do mago', 'incomum',
    'Um aro de ouro com pedrinhas engastadas: o anel de um mago que morreu defendendo as minas, e que a água do lago não escureceu.',
    { tipo: 'tesouro', pilha: true, peso: 0, valor: 150 }),
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
  // O do baú do Cajavidro, no Obelisco (a Mina dava Enfeitiçar Pessoa).
  pergaminhoDeImobilizar: nomeado('pergaminhoDeImobilizar', 'Pergaminho de Imobilizar Pessoa', 'incomum',
    'Imobilizar Pessoa, escrito para uma leitura só. Por ora, vale o que um mago pagar.',
    { tipo: 'pergaminho', art: 'arcano', pilha: true, peso: 0, valor: 50, magia: 'imobilizarPessoa' }),
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
    'Um livro de couro preto, de páginas limpas. Papel bom e caro, e cheira a tinta que nunca chegou.',
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
    'Um grimório de couro amarelo, de um aventureiro que o culto matou. 1º círculo: armadura arcana, disfarçar-se, identificação, mísseis mágicos, proteção contra o bem e o mal. 2º círculo: arma mágica, imobilizar pessoa, invisibilidade, visão no escuro.',
    { tipo: 'tesouro', art: 'arcano', peso: 3, valor: 50 }),
  ossosDeRose: nomeado('ossosDeRose', 'Os ossos de Rose', 'comum',
    'Um embrulho de ossinhos de criança, no vestido esfarrapado. Um enterro digno é o que Rose nunca teve.',
    { tipo: 'chave', peso: 2, valor: 0 }),
  ossosDeThorn: nomeado('ossosDeThorn', 'Os ossos de Thorn', 'comum',
    'Um embrulho de ossinhos de menino, ainda abraçados ao boneco de pano. Um enterro digno é o que Thorn nunca teve.',
    { tipo: 'chave', peso: 2, valor: 0 }),

  // ------------------------------------------- o Repouso de Zorzula (Obelisco, capítulo 5) ----
  chaveDaSuite: nomeado('chaveDaSuite', 'Chave de bronze com runas', 'comum',
    'Uma chave anã de bronze, comprida, com runas gastas no anel. O Ruxithid a trazia no pescoço. Abre a suíte do capitão.',
    { tipo: 'chave', peso: 0, valor: 0 }),
  pocaoDeFortitudePsionica: nomeado('pocaoDeFortitudePsionica', 'Poção de fortitude psiônica', 'incomum',
    'Um líquido violeta que zumbe baixinho no frasco. Bebida (uma ação), dá vantagem nos testes de resistência de '
    + 'Inteligência, Sabedoria e Carisma por uma hora.',
    { tipo: 'poção', art: 'pocao', peso: 0.5, valor: 150, pilha: true }),
  adagaDeVeneno: nomeado('adagaDeVeneno', 'Adaga de veneno', 'raro',
    'Adaga +1 de lâmina negra. Uma vez por dia, a lâmina se cobre de veneno: o próximo golpe faz 2d10 de veneno a '
    + 'mais e envenena por um minuto quem falhar num teste de Constituição CD 15.',
    { tipo: 'arma mágica', art: 'espada', peso: 1, bonusAtaque: 1, bonusDano: 1, base: 'adaga' }),
  espadaDeFiligrana: nomeado('espadaDeFiligrana', 'Espada longa com filigrana', 'comum',
    'Uma espada longa anã sem fio, inacabada, com filigrana de prata no copo. Uma peça de colecionador.',
    { tipo: 'tesouro', art: 'espada', peso: 3, valor: 200 }),
  peitoralDeQuartzo: nomeado('peitoralDeQuartzo', 'Peitoral de bronze cravejado de quartzo', 'comum',
    'Um peitoral de bronze trabalhado, com pedras de quartzo em volta da gola. Feito para um capitão que nunca o vestiu.',
    { tipo: 'tesouro', peso: 20, valor: 500 }),
  jade: nomeado('jade', 'Jade', 'comum', 'Uma pedra verde-leitosa, polida em gota.',
    { tipo: 'tesouro', art: 'item-gemaElemental', peso: 0, valor: 100, pilha: true }),
  peridotoGrande: nomeado('peridotoGrande', 'Peridoto grande', 'comum', 'Um peridoto do tamanho de um ovo de codorna, verde-oliva e limpo.',
    { tipo: 'tesouro', art: 'item-gemaElemental', peso: 0, valor: 500 }),
  tapecariaDuergar: nomeado('tapecariaDuergar', 'Tapeçaria duergar', 'comum',
    'Uma tapeçaria escura com anões cavando e forjando, tecida com fio de metal. Pesada e bem-feita.',
    { tipo: 'tesouro', peso: 10, valor: 75, pilha: true }),
  brocadoDeVeludo: nomeado('brocadoDeVeludo', 'Brocado de veludo', 'comum', 'Um corte de veludo vinho bordado a ouro, dobrado com cuidado.',
    { tipo: 'tesouro', peso: 3, valor: 145 }),
  // as minas do Repouso de Zorzula
  braceletesDeCeleridade: nomeado('braceletesDeCeleridade', 'Braceletes de celeridade', 'incomum',
    'Braceletes de couro com placas de bronze, tirados do braço de um anão morto. Quem os usa (sintonia) ganha 3 m de '
    + 'deslocamento e pode Disparar como ação bônus uma vez por descanso curto.',
    { tipo: 'maravilhoso', art: 'arcano', peso: 1, sintonia: true, valor: 500 }),
  picaretaLuminosa: nomeado('picaretaLuminosa', 'Picareta de guerra luminosa', 'incomum',
    'Picareta de guerra +1 de cabeça de cristal pálido. Com uma palavra, a cabeça acende e ilumina 6 m em volta (e 6 m '
    + 'de penumbra além); com outra, apaga.',
    { tipo: 'arma mágica', art: 'espada', peso: 2, bonusAtaque: 1, bonusDano: 1, base: 'picareta' }),
  lascaDeCristal: nomeado('lascaDeCristal', 'Lasca de cristal', 'comum',
    'Uma lasca de cristal roxo que zumbe na mão. Serve de foco de conjuração e põe para andar as máquinas a cristal do '
    + 'Repouso de Zorzula sem gastar magia. Um conjurador paga 15 po por uma.',
    { tipo: 'tesouro', art: 'item-gemaElemental', peso: 0, valor: 15, pilha: true }),
  quartzoAzul: nomeado('quartzoAzul', 'Quartzo azul', 'comum', 'Uma pedra azul-clara, transparente, do tamanho de uma noz.',
    { tipo: 'tesouro', art: 'item-gemaElemental', peso: 0, valor: 30, pilha: true }),
  ametistaGrande: nomeado('ametistaGrande', 'Ametista grande', 'comum', 'Uma ametista funda, cor de vinho, do tamanho de um polegar.',
    { tipo: 'tesouro', art: 'item-gemaElemental', peso: 0, valor: 250 }),
  minerioDeFerro: nomeado('minerioDeFerro', 'Minério de ferro', 'comum',
    'Uns quinze quilos de minério bom. O ferreiro de Phandalin tira dele sete lingotes de 25 po cada.',
    { tipo: 'tesouro', peso: 30, valor: 175 }),
  // Talhundereth (o Obelisco, capítulo 6)
  simboloDeDumathoin: nomeado('simboloDeDumathoin', 'Símbolo sagrado de Dumathoin', 'comum',
    'Uma montanha de platina do tamanho de uma palma, com uma gema lapidada no coração. Vale 150 po, e os guardiões de '
    + 'pedra do templo não atacam quem o usa à vista.',
    { tipo: 'tesouro', art: 'bencao', peso: 1, valor: 150 }),
  estatuetaDeGuerreiroAnao: nomeado('estatuetaDeGuerreiroAnao', 'Estatueta de guerreiro anão', 'comum',
    'Um guerreiro anão de ouro maciço, de machado no ombro, do tamanho de um antebraço.',
    { tipo: 'tesouro', peso: 2, valor: 400, pilha: true }),
  gemaPequena: nomeado('gemaPequena', 'Gema pequena', 'comum', 'Uma gema lapidada do tamanho de uma ervilha, das que os anões '
    + 'guardavam aos punhados.', { tipo: 'tesouro', art: 'item-gemaElemental', peso: 0, valor: 100, pilha: true }),
  medalhaoDeLagarto: nomeado('medalhaoDeLagarto', 'Medalhão de prata', 'comum',
    'Um medalhão de prata com uma cabeça de lagarto na frente e uma pena gravada atrás. Coisa de drow.',
    { tipo: 'tesouro', peso: 0, valor: 15 }),
  pocaoDeInvulnerabilidade: nomeado('pocaoDeInvulnerabilidade', 'Poção de invulnerabilidade', 'raro',
    'Um líquido que parece ferro derretido e frio. Quem bebe tem resistência a todo dano por 1 minuto.',
    { tipo: 'poção', art: 'cura', peso: 0.5, valor: 500, pilha: true, consumivel: 'condicao', condicao: 'resistenciaTotal', rodadas: 10 }),
  jarraAlquimica: nomeado('jarraAlquimica', 'Jarra alquímica', 'incomum',
    'Uma jarra de cerâmica que, com uma palavra, se enche de um líquido à escolha: água doce ou salgada, cerveja, vinho, '
    + 'vinagre, mel, maionese, óleo, ácido ou veneno básico. Uma vez por dia cada.',
    { tipo: 'maravilhoso', peso: 12, valor: 300 }),
  periaptoDaSaude: nomeado('periaptoDaSaude', 'Periapto da saúde', 'incomum',
    'Um pingente de pedra vermelha numa corrente de prata. Quem o usa não pega doença nenhuma.',
    { tipo: 'maravilhoso', peso: 0, valor: 500 }),
  // a Cripta dos Talhund
  contasDeForca: nomeado('contasDeForca', 'Conta de força', 'raro',
    'Uma esfera de vidro escuro do tamanho de uma uva. Arremessada (ação, 18 m), explode: quem está a 3 m faz Destreza CD 15 '
    + 'ou leva 5d4 de energia e fica preso numa esfera de força por 1 minuto.', { tipo: 'maravilhoso', art: 'item-gemaElemental', peso: 0, valor: 960, pilha: true }),
  anelDoOrador: nomeado('anelDoOrador', 'Anel do orador', 'incomum',
    'Um anel grande de ouro com uma gema lapidada em montanha, da fundadora do templo. Quem o usa fala e entende a língua de '
    + 'quem o escuta.', { tipo: 'maravilhoso', peso: 0, valor: 500, sintonia: true }),
  coroaGuardaMente: nomeado('coroaGuardaMente', 'Coroa guarda-mente', 'incomum',
    'Um aro de ferro com um fio de mitral em volta, da general Brelta Gemblade. Quem a usa (sintonia) tem vantagem nas '
    + 'resistências de Inteligência e não pode ter a mente lida.', { tipo: 'maravilhoso', peso: 1, valor: 500, sintonia: true }),
  gemaDe500: nomeado('gemaDe500', 'Gema lapidada', 'comum', 'Uma gema do tamanho de um polegar, lapidada em montanha, que estava '
    + 'escondida no peito do arquiteto.', { tipo: 'tesouro', art: 'item-gemaElemental', peso: 0, valor: 500 }),
  lascaDaEsmeralda: nomeado('lascaDaEsmeralda', 'Lasca da grande gema', 'comum', 'Uma lasca verde e morna da gema do santuário '
    + 'giratório. Não vale nada no mercado, e vale tudo para um fiel de Dumathoin.', { tipo: 'tesouro', art: 'item-gemaElemental', peso: 0, valor: 0, missao: true }),
  // a Encruzilhada da Forca
  gaiolaDeEspinhos: nomeado('gaiolaDeEspinhos', 'Gaiola de espinhos', 'comum',
    'Uma gaiola duergar de ferro com os espinhos para dentro e dobradiças de mitral. Dobrada, é um cubo do tamanho de um baú; '
    + 'armá-la ou desarmá-la leva um minuto. Não tem fechadura.', { tipo: 'tesouro', peso: 50, valor: 200 }),
  livroDosEnroladores: nomeado('livroDosEnroladores', 'Livro ilustrado sobre enroladores', 'comum',
    'Um livro de couro com desenhos à pena de enroladores: como dormem, como comem, onde ficam as pedras que não digerem.',
    { tipo: 'tesouro', peso: 2, valor: 25 }),
  esmeralda: nomeado('esmeralda', 'Esmeralda', 'comum', 'Uma esmeralda funda, do tamanho de uma unha, lapidada em degraus.',
    { tipo: 'tesouro', art: 'item-gemaElemental', peso: 0, valor: 250 }),
  ametistaDoEnrolador: nomeado('ametistaDoEnrolador', 'Ametista pequena', 'comum',
    'Uma ametista do tamanho de uma ervilha, polida por dentro de uma barriga de enrolador.',
    { tipo: 'tesouro', art: 'item-gemaElemental', peso: 0, valor: 30, pilha: true }),
  jacinto: nomeado('jacinto', 'Jacinto', 'comum', 'Uma pedra laranja-avermelhada, transparente, do tamanho de uma lentilha.',
    { tipo: 'tesouro', art: 'item-gemaElemental', peso: 0, valor: 90, pilha: true }),
  adagaCravejada: nomeado('adagaCravejada', 'Adaga cravejada', 'comum',
    'Uma adaga drow de lâmina fina, com o cabo cravejado de pedras pequenas. Mais joia que arma.',
    { tipo: 'tesouro', peso: 1, valor: 200 }),
  varinhaDeDeteccaoDeMagia: nomeado('varinhaDeDeteccaoDeMagia', 'Varinha de detectar magia', 'incomum',
    'Uma varinha de madeira clara com três cargas. Com uma delas, quem a segura sente a magia em volta como se tivesse '
    + 'conjurado Detectar Magia.', { tipo: 'varinha', art: 'arcano', peso: 1, valor: 150 }),
  mochilaPraticaDeHeward: nomeado('mochilaPraticaDeHeward', 'Mochila prática de Heward', 'raro',
    'Uma mochila de couro com dois bolsos e um compartimento que cabem muito mais do que deviam. O que se quer sai sempre por '
    + 'cima.', { tipo: 'maravilhoso', peso: 5, valor: 2000 }),
  pergaminhoDeLiberdadeDeMovimento: nomeado('pergaminhoDeLiberdadeDeMovimento', 'Pergaminho de Liberdade de Movimento', 'raro',
    'Liberdade de Movimento, escrito para uma leitura só. Por ora, vale o que um mago pagar.',
    { tipo: 'pergaminho', art: 'arcano', pilha: true, peso: 0, valor: 500, magia: 'liberdadeDeMovimento' }),
  torreLamacenta: nomeado('torreLamacenta', 'Torre Lamacenta', 'muito raro',
    'Uma esfera de granito do tamanho de uma noz. Com a palavra de comando, cresce numa torre de pedra de dois andares, com '
    + 'ameias, seteiras e uma porta que só abre ao dono. A palavra é "petrificação", em terrano.',
    { tipo: 'maravilhoso', art: 'item-gemaElemental', peso: 0, valor: 5000 }),
  cascalhoPetrificado: nomeado('cascalhoPetrificado', 'Cascalho de estátua', 'comum',
    'Um punhado de cascalho dos rostos quebrados das estátuas do salão dos Triestoroth. Era gente, antes do basilisco.',
    { tipo: 'tesouro', peso: 1, valor: 0, missao: true }),
  // o túnel do capítulo 7 (o Obelisco)
  diarioDeThorgran: nomeado('diarioDeThorgran', 'Diário de Thorgran Ironquill', 'comum',
    'O que restou do diário de um historiador anão: poucas páginas inchadas de água, numa capa com um ex-libris de prata. '
    + 'Fala de devoradores de mentes debaixo das Montanhas da Espada, de espionar Illithinoch e de avisar os anões de '
    + 'Talhundereth. A placa sozinha vale 450 po; com as páginas, um colecionador paga o dobro.',
    { tipo: 'tesouro', art: 'item-livroDosEnroladores', peso: 2, valor: 450 }),
  penaDeOuro: nomeado('penaDeOuro', 'Pena de ouro', 'comum',
    'Uma pena de escrever toda de ouro, tirada de algum viajante que o behir comeu.',
    { tipo: 'tesouro', peso: 0, valor: 100, pilha: true }),
  pomadaDeKeoghtom: nomeado('pomadaDeKeoghtom', 'Pomada de Keoghtom (dose)', 'incomum',
    'Uma dose de pomada grossa, com cheiro de aloé. Uma ação para passá-la: recupera 2d8+2 pontos de vida.',
    { tipo: 'poção', art: 'cura', peso: 0, valor: 120, pilha: true, consumivel: 'curar', cura: '2d8+2', acao: 'acao' }),
  cristalMentalCuidadoso: nomeado('cristalMentalCuidadoso', 'Cristal mental (cuidadoso)', 'incomum',
    'Um cristal claro, morno ao toque, em que os devoradores de mentes guardaram um pedaço de magia. Quem o segura ao conjurar uma magia de uma ação pode moldá-la, uma vez: '
    + 'até três criaturas escolhidas passam sozinhas no teste de resistência contra ela. Não se soma à metamagia do feiticeiro, e depois de usado vira uma pedra comum de 50 po. Arma-se na barra de ações.',
    { tipo: 'maravilhoso', art: 'item-gemaElemental', peso: 0, valor: 300, metamagia: 'carefulSpell' }),
  cristalMentalSutil: nomeado('cristalMentalSutil', 'Cristal mental (sutil)', 'comum',
    'Um cristal claro, morno ao toque, em que os devoradores de mentes guardaram um pedaço de magia. Quem o segura ao conjurar uma magia de uma ação pode moldá-la, uma vez: '
    + 'ela sai sem gesto e sem palavra, e ninguém a vê ser conjurada para contrariá-la. Não se soma à metamagia do feiticeiro, e depois de usado vira uma pedra comum de 50 po. Arma-se na barra de ações.',
    { tipo: 'maravilhoso', art: 'item-gemaElemental', peso: 0, valor: 100, metamagia: 'subtleSpell' }),
  cristalMentalElevado: nomeado('cristalMentalElevado', 'Cristal mental (elevado)', 'raro',
    'Um cristal claro, morno ao toque, em que os devoradores de mentes guardaram um pedaço de magia. Quem o segura ao conjurar uma magia de uma ação pode moldá-la, uma vez: '
    + 'uma criatura tem desvantagem no primeiro teste de resistência contra ela. Não se soma à metamagia do feiticeiro, e depois de usado vira uma pedra comum de 50 po. Arma-se na barra de ações.',
    { tipo: 'maravilhoso', art: 'item-gemaElemental', peso: 0, valor: 1500, metamagia: 'heightenedSpell' }),
  cristalMentalPotencializado: nomeado('cristalMentalPotencializado', 'Cristal mental (potencializado)', 'incomum',
    'Um cristal claro, morno ao toque, em que os devoradores de mentes guardaram um pedaço de magia. Quem o segura ao conjurar uma magia de uma ação pode moldá-la, uma vez: '
    + 'até três dados de dano dela, dos que saíram baixos, rolam de novo. Não se soma à metamagia do feiticeiro, e depois de usado vira uma pedra comum de 50 po. Arma-se na barra de ações.',
    { tipo: 'maravilhoso', art: 'item-gemaElemental', peso: 0, valor: 300, metamagia: 'empoweredSpell' }),
  cristalMentalDistante: nomeado('cristalMentalDistante', 'Cristal mental (distante)', 'incomum',
    'Um cristal claro, morno ao toque, em que os devoradores de mentes guardaram um pedaço de magia. Quem o segura ao conjurar uma magia de uma ação pode moldá-la, uma vez: '
    + 'o alcance dela cresce 30 metros, e a de toque passa a alcançar 9 metros. Não se soma à metamagia do feiticeiro, e depois de usado vira uma pedra comum de 50 po. Arma-se na barra de ações.',
    { tipo: 'maravilhoso', art: 'item-gemaElemental', peso: 0, valor: 300, metamagia: 'distantSpell' }),
  cristalMentalAcelerado: nomeado('cristalMentalAcelerado', 'Cristal mental (acelerado)', 'raro',
    'Um cristal claro, morno ao toque, em que os devoradores de mentes guardaram um pedaço de magia. Quem o segura ao conjurar uma magia de uma ação pode moldá-la, uma vez: '
    + 'ela sai como ação bônus. Não se soma à metamagia do feiticeiro, e depois de usado vira uma pedra comum de 50 po. Arma-se na barra de ações.',
    { tipo: 'maravilhoso', art: 'item-gemaElemental', peso: 0, valor: 1500, metamagia: 'quickenedSpell' }),
  cristalMentalProlongado: nomeado('cristalMentalProlongado', 'Cristal mental (prolongado)', 'incomum',
    'Um cristal claro, morno ao toque, em que os devoradores de mentes guardaram um pedaço de magia. Quem o segura ao conjurar uma magia de uma ação pode moldá-la, uma vez: '
    + 'a duração dela dobra, até 24 horas. Não se soma à metamagia do feiticeiro, e depois de usado vira uma pedra comum de 50 po. Arma-se na barra de ações.',
    { tipo: 'maravilhoso', art: 'item-gemaElemental', peso: 0, valor: 300, metamagia: 'extendedSpell' }),
  cristalApagado: nomeado('cristalApagado', 'Cristal mental apagado', 'comum',
    'Um cristal mental já usado: frio, opaco, sem magia nenhuma. Ainda vale como pedra.',
    { tipo: 'tesouro', art: 'item-gemaElemental', peso: 0, valor: 50, pilha: true }),
  // Illithinoch (o Obelisco, capítulo 7)
  frascoDeMuco: nomeado('frascoDeMuco', 'Frasco de muco da estátua', 'comum',
    'Um frasco do muco verde que pinga das mãos da estátua de Illithinoch. Bebido, dá resistência a dano psíquico por dez '
    + 'minutos.', { tipo: 'poção', art: 'cura', peso: 0.5, valor: 0, pilha: true, consumivel: 'condicao', condicao: 'mucoDaEstatua', rodadas: 100 }),
  perfumeRaro: nomeado('perfumeRaro', 'Frasco de perfume raro', 'comum',
    'Um frasco de cristal lapidado com um perfume que muda de cheiro conforme o frasco gira: flor, chuva, cobre.',
    { tipo: 'tesouro', peso: 0.5, valor: 500, pilha: true }),
  jarraDeCristal: nomeado('jarraDeCristal', 'Jarra de cristal', 'comum', 'Uma jarra fina de cristal, frágil como casca de ovo.',
    { tipo: 'tesouro', peso: 1, valor: 25, pilha: true }),
  mapasDoSubterraneo: nomeado('mapasDoSubterraneo', 'Mapas antigos do Subterrâneo', 'comum',
    'Mapas desenhados pelo Oshundo de memória, de um Subterrâneo de séculos atrás: túneis, cidades e nomes que ninguém mais '
    + 'usa. Um historiador pagaria uma fortuna.', { tipo: 'tesouro', peso: 2, valor: 4000 }),
  tinteiroDeAmbar: nomeado('tinteiroDeAmbar', 'Tinteiro de âmbar', 'comum', 'Um tinteiro esculpido num bloco de âmbar, com um inseto preso dentro.',
    { tipo: 'tesouro', peso: 1, valor: 280 }),
  livroDeGulguush: nomeado('livroDeGulguush', 'Prostrado diante da Psique Dissonante', 'comum',
    'O livro inacabado do Gulguush, em Subcomum: de onde veio Ilvaash, onde ele toma corpo (no Vazio Sem Fim, debaixo de uma '
    + 'piscina de salmoura no coração do Labirinto Salobro) e o que flutua em volta dele.', { tipo: 'tesouro', peso: 3, valor: 0, missao: true }),
  gnawbleTrincheiras: nomeado('gnawbleTrincheiras', 'Gnawble (das Trincheiras)', 'comum',
    'Uma bola de pelo cinzento do tamanho de um punho, com uma boca cheia de dentes, colhida da runa de uma fenda. Morde quem a '
    + 'segura, ou se aninha no colo dele. Não come, não bebe, não dorme.', { tipo: 'tesouro', peso: 1, valor: 0, missao: true }),
  gnawbleOco: nomeado('gnawbleOco', 'Gnawble (do Oco da Desova)', 'comum',
    'Uma bola de pelo rosado do tamanho de um punho, com uma boca cheia de dentes, colhida da runa de uma fenda. Morde quem a '
    + 'segura, ou se aninha no colo dele. Não come, não bebe, não dorme.', { tipo: 'tesouro', peso: 1, valor: 0, missao: true }),
  gnawbleLabirinto: nomeado('gnawbleLabirinto', 'Gnawble (do Labirinto dos Olhos)', 'comum',
    'Uma bola de pelo roxo do tamanho de um punho, com uma boca cheia de dentes, colhida da runa de uma fenda. Morde quem a '
    + 'segura, ou se aninha no colo dele. Não come, não bebe, não dorme.', { tipo: 'tesouro', peso: 1, valor: 0, missao: true }),
  // as fendas de Illithinoch
  tiaraDePrata: nomeado('tiaraDePrata', 'Tiara de prata', 'comum', 'Uma tiara de prata fina, com uma pedra leitosa no meio. Paga a um grell por alguma coisa.',
    { tipo: 'tesouro', peso: 0.5, valor: 1200 }),
  adagaDeCristal: nomeado('adagaDeCristal', 'Adaga ornamental de cristal', 'comum', 'Uma adaga de cristal lapidado, linda e inútil numa luta.',
    { tipo: 'tesouro', peso: 1, valor: 600, pilha: true }),
  rubiOlho: nomeado('rubiOlho', 'Rubi talhado como olho', 'comum', 'Um rubi talhado com pupila e íris, como um olho de sangue.',
    { tipo: 'tesouro', art: 'item-gemaElemental', peso: 0, valor: 300, pilha: true }),
  // O Labirinto Salgado (o Obelisco, capítulo 8)
  espadaDePrataDaVarakkta: nomeado('espadaDePrataDaVarakkta', 'Espada de prata githyanki', 'lendário',
    'Uma espada grande de lâmina prateada e serrilhada, das que os cavaleiros githyanki passam de mão em mão por séculos. '
    + 'Só quem tem o dom psiônico a sintoniza. Uma cavaleira githyanki do labirinto quer esta de volta.',
    { tipo: 'tesouro', peso: 6, valor: 0 }),
  capaDeAumento: nomeado('capaDeAumento', 'Capa de aumento', 'muito raro',
    'Uma capa cinza-arroxeada com runas de prata na barra, manchada de sangue velho. Tem três cargas: com uma ação bônus, '
    + 'quem a veste cresce por dez minutos, com vantagem em Força e o bônus de proficiência somado ao dano de arma. Volta '
    + '1d3 cargas a cada amanhecer. No jogo: sintonizada, a ação aparece na barra; as cargas voltam no descanso longo, e a '
    + 'pegada não cresce.',
    { tipo: 'maravilhoso', peso: 1, valor: 0, sintonia: true, conjura: { cargas: 3, recarga: '1d3', magias: { aumentoDaCapa: { custo: 1 } } } }),
  // AS TRÊS ARMAS FINAS DO ARSENAL DA MANSÃO (R6): comuns no golpe, o dobro no preço. Sem raridade, de propósito: arma
  // com raridade conta como MÁGICA no combate (`combat.js`, `p.weapon?.raridade`), e estas não são.
  espadaCurtaCravejada: nomeado('espadaCurtaCravejada', 'Espada curta cravejada', null,
    'Uma espada curta bem forjada, com pedras semipreciosas no pomo e na guarda. Golpeia como qualquer espada curta; vendida, vale o dobro.',
    { tipo: 'arma', art: 'espada', peso: 2, base: 'espadaCurta', valor: 20 }),
  bestaLeveDePrata: nomeado('bestaLeveDePrata', 'Besta leve marchetada', null,
    'Uma de um par de bestas leves com a madeira marchetada de prata. Atira como qualquer besta leve; vendida, vale o dobro.',
    { tipo: 'arma', art: 'arco', peso: 5, base: 'bestaLeve', valor: 50, pilha: true }),
  // os olhos da estátua de Dumathoin na Onda Eco: o Obelisco os faz verdadeiros (a Mina dizia vidro)
  olhoDeDumathoin: nomeado('olhoDeDumathoin', 'Esmeralda do olho de Dumathoin', 'comum', 'Uma esmeralda do tamanho de um ovo de galinha, lapidada em cúpula para servir de olho a uma estátua.',
    { tipo: 'tesouro', art: 'item-gemaElemental', peso: 0, valor: 5000, pilha: true }),
  esmeraldaDosGithyanki: nomeado('esmeraldaDosGithyanki', 'Esmeralda grande', 'comum', 'Uma esmeralda do tamanho de um polegar, sem lapidar.',
    { tipo: 'tesouro', art: 'item-gemaElemental', peso: 0, valor: 900, pilha: true }),
  caixaDeMusicaDePlatina: nomeado('caixaDeMusicaDePlatina', 'Caixa de música de platina', 'comum',
    'Uma caixinha de platina que toca uma melodia triste ao abrir. Um anão não ouve som nenhum dela.', { tipo: 'tesouro', peso: 1, valor: 1500 }),
  garfosDePrata: nomeado('garfosDePrata', 'Caixa de garfos de prata', 'comum', 'Doze garfos de prata de seis dentes, numa caixa forrada.',
    { tipo: 'tesouro', peso: 3, valor: 1800 }),
  rolhaDeOuro: nomeado('rolhaDeOuro', 'Rolha de ouro', 'comum', 'A rolha de um barrilete de cerveja fraca, toda de ouro.',
    { tipo: 'tesouro', peso: 0, valor: 850 }),
  flautaDePaDeMarfim: nomeado('flautaDePaDeMarfim', 'Flauta de pã de marfim', 'comum', 'Uma flauta de pã de marfim entalhado, com o tom limpo.',
    { tipo: 'tesouro', peso: 1, valor: 3600 }),
  oculosDoKlaudel: nomeado('oculosDoKlaudel', 'Óculos de aro de ouro', 'comum', 'Os óculos de um sábio que o labirinto engoliu.',
    { tipo: 'tesouro', peso: 0, valor: 100 }),
  pergaminhoDeCompreenderIdiomas: nomeado('pergaminhoDeCompreenderIdiomas', 'Pergaminho de Compreender Idiomas', 'comum',
    'Compreender Idiomas, escrito para uma leitura só. Por ora, vale o que um mago pagar.',
    { tipo: 'pergaminho', art: 'arcano', pilha: true, peso: 0, valor: 25, magia: 'compreenderIdiomas' }),
  pergaminhoDeLinguas: nomeado('pergaminhoDeLinguas', 'Pergaminho de Línguas', 'incomum',
    'Línguas, escrito para uma leitura só. Por ora, vale o que um mago pagar.',
    { tipo: 'pergaminho', art: 'arcano', pilha: true, peso: 0, valor: 150, magia: 'linguas' }),
  tomoDaMenteVoltadaParaDentro: nomeado('tomoDaMenteVoltadaParaDentro', 'Verdades da Mente Voltada para Dentro', 'comum',
    'Um tomo enorme, de letras que parecem se mexer e que ninguém consegue pronunciar. Um colecionador pagaria bem.',
    { tipo: 'tesouro', peso: 5, valor: 2000 }),
  boneDaExplosaoMental: nomeado('boneDaExplosaoMental', 'Boné da explosão mental', 'muito raro',
    'Um boné macio, violeta, costurado no desenho das dobras de um cérebro. Uma vez por dia, com uma ação bônus, solta um cone '
    + 'de 18 m que fere a mente: Inteligência CD 15, 5d8 psíquicos e atordoado (metade e sem atordoar para quem passa). No '
    + 'jogo: sintonizado, a ação aparece na barra, e volta no descanso longo.',
    { tipo: 'maravilhoso', peso: 0, valor: 0, sintonia: true, conjura: { cargas: 1, recarga: null, cd: 15, magias: { explosaoDoBone: { custo: 1 } } } }),
  // O Vazio Sem Fim (o Obelisco, capítulo 8)
  linguaDeMetal: nomeado('linguaDeMetal', 'Língua de metal', 'comum',
    'Uma fita de metal de um palmo, áspera de um lado e quebrada na ponta. Tem cheiro de magia de proteção. Encaixa em alguma coisa.',
    { tipo: 'tesouro', peso: 1, valor: 0 }),
  amuletoContraDeteccao: nomeado('amuletoContraDeteccao', 'Amuleto contra detecção e localização', 'incomum',
    'Esconde quem o usa da magia de adivinhação. O dono dele jurava que o tornava invisível a Ilvaash; a cabeça dele discordou.',
    { tipo: 'maravilhoso', peso: 0, valor: 0, sintonia: true }),
  globoDeNeve: nomeado('globoDeNeve', 'Globo de neve com uma feira', 'comum', 'Um globo de vidro com uma feira em miniatura dentro, que neva quando se sacode.',
    { tipo: 'tesouro', peso: 1, valor: 1500 }),
  estatuetaDeBasilisco: nomeado('estatuetaDeBasilisco', 'Estatueta de basilisco de platina', 'comum', 'Um basilisco de platina do tamanho de um gato, de olhos de vidro.',
    { tipo: 'tesouro', peso: 3, valor: 4000 }),
  aliancaDeOuro: nomeado('aliancaDeOuro', 'Aliança de ouro', 'comum', 'Uma aliança de ouro lisa, sem nome gravado.',
    { tipo: 'tesouro', art: 'item-anelDeSinete', peso: 0, valor: 100, pilha: true }),
  diamanteDaEstatua: nomeado('diamanteDaEstatua', 'Diamante grande', 'raro', 'Um diamante do tamanho de uma noz, arrancado da estátua de um cérebro.',
    { tipo: 'tesouro', art: 'item-gemaElemental', peso: 0, valor: 5000, pilha: true }),
  opalaDoCharco: nomeado('opalaDoCharco', 'Opala', 'comum', 'Uma opala leitosa do tamanho de um ovo de pomba, tirada de um arbusto esculpido.',
    { tipo: 'tesouro', art: 'item-gemaElemental', peso: 0, valor: 1000, pilha: true }),
  pergaminhoDeConeDeFrio: nomeado('pergaminhoDeConeDeFrio', 'Pergaminho de Cone de Frio', 'raro',
    'Cone de Frio, escrito para uma leitura só, salvo seco entre as páginas de um livro encharcado. Por ora, vale o que um mago pagar.',
    { tipo: 'pergaminho', art: 'arcano', pilha: true, peso: 0, valor: 500, magia: 'coneDeFrio' }),
  matadorDeDevoradores: nomeado('matadorDeDevoradores', 'Matador de Devoradores', 'raro',
    'Machado grande +1 com devoradores de mentes decapitados entalhados na lâmina. Contra aberração, 1d12 cortante a mais.',
    { tipo: 'arma mágica', art: 'machado', peso: 7, bonusAtaque: 1, bonusDano: 1, base: 'machadoGrande', danoExtra: '1d12', tipoExtra: 'cortante', contra: 'aberração', sintonia: true }),
  estatuetaDeObservador: nomeado('estatuetaDeObservador', 'Estatueta de observador', 'comum',
    'Um observador de ouro do tamanho de uma mão, com esmeraldas nas pontas dos pedúnculos e um diamante enorme no olho do meio.',
    { tipo: 'tesouro', peso: 2, valor: 5500 }),
  livroDeGranito: nomeado('livroDeGranito', 'O Livro de Granito', 'comum',
    'Páginas de metal entre capas de granito fino. Os segredos do templo, a lista dos que dormem na cripta e, em anão, '
    + 'como abrir a porta dela: girar o disco do entalhe menos lapidado ao mais lapidado e pôr uma gema no centro.',
    { tipo: 'tesouro', peso: 8, valor: 0, missao: true }),
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
  // As bolsas do esconderijo pelo Obelisco: o Yeemik leva três gemas de 10 po e uma poção de cura (a Mina lhe dava
  // dentes de ouro e prata); o Errk, 21 pc; o chefe do posto dos vigias, 16 pp. O baú de Klarg está entre os
  // suprimentos e sai de "Revirar os suprimentos" (`capitulo2.js`).
  yeemik: [{ id: 'gemaPequena', qtd: 3 }, 'pocaoDeCura'],
  errk: [{ id: 'moedaDeCobre', qtd: 21 }],
  chefeDoPosto: [{ id: 'moedaDePrata', qtd: 16 }],
  // O Obelisco: o Ruxithid carrega a chave da suíte do capitão (Z10).
  ruxithid: ['chaveDaSuite'],
};
