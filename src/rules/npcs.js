// NPCS: as pessoas da campanha. Quem fala, negocia, contrata, mente e trai.
//
// SRD 5.1 (CC-BY-4.0) para os blocos de combate — ver NOTICE.md e ELENCO.md.
//
// ---------------------------------------------------------------------------
// TRÊS CAMADAS DE LICENÇA, E ELAS NÃO SE MISTURAM
//
// Cada entrada daqui é feita de três coisas com origens diferentes, e é por isso
// que o campo `fonte` existe em vez de uma linha solta de crédito no topo:
//
//   1. O NOME e o PAPEL (estalajadeiro, mestre da vila, irmã do santuário) são
//      fan content da Fan Content Policy. Pode, porque o jogo é gratuito.
//   2. O BLOCO DE COMBATE sai inteiro de um bloco do SRD — `bloco` aponta um id
//      de `rules/monsters.js`. Nada aqui inventa números de ficha.
//   3. A PERSONALIDADE, as atitudes e a frase de cada um são NOSSAS, escritas
//      para este projeto. Nenhuma linha é texto do módulo publicado, nem
//      parafraseada de perto. Se uma soa familiar, é coincidência de arquétipo
//      (o burocrata covarde, o velho de armazém), não cópia.
//
// A consequência prática: um NPC não tem ficha própria. Ele tem um PONTEIRO
// para um bloco do SRD mais a pessoa em cima. Isso também é o que impede a
// tentação de "ajustar" PV e CA de um NPC do módulo até chegar nos números
// publicados — que seria exatamente a cópia que a licença proíbe.
// ---------------------------------------------------------------------------
//
// CAMPOS
//   id            chave do registro
//   nome          o nome na mesa
//   look          chave em `art/looks/npcs.js`
//   papel         o que ele é na vila, em três palavras
//   bloco         id em `rules/monsters.js` usado SE ele entrar em combate
//   blocoSubstituto  bloco a usar enquanto `bloco` não existir ou não estiver
//                 verificado — presente só onde a licença está em aberto
//   fonte         'SRD' | 'propria' | 'verificar' — atribuição do BLOCO
//   fonteNota     por que, quando `fonte` não é 'SRD'
//   atitude       como ele começa com o grupo (ver ATITUDES)
//   personalidade { quer, esconde, fala } — três linhas nossas
//   frase         uma fala de exemplo, nossa, para o mestre pegar o tom
//   blurb         o que ele FAZ em combate, numa linha
//
// Nada de `Math.random()` aqui: tudo que rola dado passa por `core/rng.js`,
// e quem rola é `makeMonster`, logo abaixo.

import { MONSTERS, makeMonster } from './monsters.js';

/**
 * ATITUDES — como o NPC começa em relação ao grupo.
 *
 * `lado` existe porque `rules/combat.js` só conhece dois lados, 'party' e
 * 'foes', e alterna o turno entre os dois. Então um NPC neutro que é arrastado
 * para a briga precisa escolher um: o padrão é 'foes', porque o caso comum de
 * um neutro entrar em combate é o grupo ter atacado primeiro. Quem quiser o
 * contrário passa `side` em `makeNpc`.
 *
 * Um terceiro lado de verdade (neutros que atacam os dois) precisaria de
 * `combat.js`, que não é meu arquivo — está no relatório.
 */
export const ATITUDES = {
  aliado: { lado: 'party', desc: 'Luta ao lado do grupo se a briga começar.' },
  cordial: { lado: 'foes', desc: 'Atende bem, não luta por ninguém.' },
  interesseiro: { lado: 'foes', desc: 'Ajuda enquanto lucrar com isso.' },
  arredio: { lado: 'foes', desc: 'Quer o grupo longe; só fala sob pressão.' },
  medroso: { lado: 'foes', desc: 'Foge na primeira rodada se puder.' },
  barganha: { lado: 'foes', desc: 'Prefere negociar a rolar iniciativa.' },
  hostil: { lado: 'foes', desc: 'Já está na lista de iniciativa.' },
};

export const NPCS = {

  // -------------------------------------------------------------------------
  // A ESTRADA E O CONTRATO
  // -------------------------------------------------------------------------

  sildar: {
    id: 'sildar',
    nome: 'Sildar Hallwinter',
    look: 'sildar',
    papel: 'Oficial aposentado da Aliança',
    bloco: 'cavaleiro',
    fonte: 'SRD',
    atitude: 'aliado',
    personalidade: {
      quer: 'Ver uma estrada em que mercador ande sem escolta, e o nome dele numa ordem de serviço outra vez.',
      esconde: 'Que cedeu nomes durante o interrogatório e não sabe quais ainda valem alguma coisa.',
      fala: 'Frases curtas, voz baixa, chama todo mundo pelo ofício antes do nome. Nunca levanta o tom; quando discorda, repete a frase igual.',
    },
    frase: 'Põe o escudo à minha esquerda. Eu não enxergo mais bem desse lado.',
    blurb: 'Segura corredor na frente do grupo e divide o dano que ia para o mago.',
  },

  gundren: {
    id: 'gundren',
    nome: 'Gundren Rockseeker',
    look: 'gundren',
    papel: 'Prospector, irmão do meio',
    bloco: 'plebeu',
    fonte: 'SRD',
    atitude: 'aliado',
    personalidade: {
      quer: 'Reabrir a mina antes dos irmãos para poder dizer, pelo resto da vida, que foi ele.',
      esconde: 'O mapa inteiro. Contou um pedaço para cada pessoa de quem precisava, e já perdeu a conta de quem sabe o quê.',
      fala: 'Rápido, interrompe, promete alto e barganha baixo. Trata o grupo como sócio na frente dos outros e como empregado quando estão sozinhos.',
    },
    frase: 'Metade agora, metade quando a roda do moinho girar. Aperta aqui.',
    blurb: 'Não luta: corre para a saída e grita onde é, o que vale mais que o ataque dele.',
  },

  // -------------------------------------------------------------------------
  // PHANDALIN — os que atendem o balcão
  // -------------------------------------------------------------------------

  toblen: {
    id: 'toblen',
    nome: 'Toblen Stonehill',
    look: 'toblen',
    papel: 'Estalajadeiro',
    bloco: 'plebeu',
    fonte: 'SRD',
    atitude: 'cordial',
    personalidade: {
      quer: 'Que a vila fique grande o suficiente para ele não ser o único a decidir nada.',
      esconde: 'Que tem um quarto sempre vago e reservado para quem possa um dia precisar sair rápido — ele inclusive.',
      fala: 'Hospitaleiro e tagarela, muda de assunto quando a conversa chega em bandido. Oferece comida no meio de qualquer pergunta difícil.',
    },
    frase: 'Comida a dois por dia, cama a cinco. Pergunta a mais sai por sua conta e risco.',
    blurb: 'Não luta: tranca o salão por dentro e vira a mesa na porta, o que barra a primeira onda.',
  },

  elmar: {
    id: 'elmar',
    nome: 'Elmar Barthen',
    look: 'elmar',
    papel: 'Dono do armazém',
    bloco: 'plebeu',
    fonte: 'SRD',
    atitude: 'cordial',
    personalidade: {
      quer: 'Que os dois moços que ele contratou cheguem à primavera sem virar caravaneiro morto na estrada.',
      esconde: 'Que vende a crédito para metade da vila e que o livro não fecha há dois anos.',
      fala: 'Devagar, com muito detalhe irrelevante antes do detalhe que importa. Chama os jovens de rapaz e as armas de ferragem.',
    },
    frase: 'Picareta eu tenho. Vontade de explicar para onde foram as três últimas, não.',
    blurb: 'Não luta: abre o depósito e entrega corda, óleo e lampião, que ganham a cena seguinte.',
  },

  linene: {
    id: 'linene',
    nome: 'Linene Graywind',
    look: 'linene',
    papel: 'Encarregada do posto de armas',
    bloco: 'plebeu',
    fonte: 'SRD',
    atitude: 'barganha',
    personalidade: {
      quer: 'Uma escolta de verdade para a próxima remessa, paga pela companhia e não pelo bolso dela.',
      esconde: 'Que compra de volta, sem perguntar, mercadoria que já foi dela — é mais barato que relatar o roubo.',
      fala: 'Seca, conta no dedo, corta elogio pelo meio. Fala de arma como quem fala de ferramenta, nunca de glória.',
    },
    frase: 'Essa lâmina já voltou para cá duas vezes. Na terceira eu quero saber o nome de quem segurou.',
    blurb: 'Luta se o posto for atacado: fica na porta com a lâmina cravada e não cede a soleira.',
  },

  halia: {
    id: 'halia',
    nome: 'Halia Thornton',
    look: 'halia',
    papel: 'Mestra do entreposto de mineração',
    bloco: 'espiao',
    fonte: 'SRD',
    atitude: 'interesseiro',
    personalidade: {
      quer: 'Ser a pessoa a quem a vila pede favor quando o mestre da vila não resolve — e já está a meio caminho.',
      esconde: 'De quem ela recebe ordem. O entreposto é fachada honesta de um negócio que não é.',
      fala: 'Educada ao ponto de incomodar, sempre uma pergunta à frente. Nunca pede nada: descreve um problema e espera.',
    },
    frase: 'Eu não contrato ninguém. Só comento, em voz alta, o que me atrapalha.',
    blurb: 'Abre escondida, ataca pelas costas com vantagem e sai de perto antes do troco.',
  },

  harbin: {
    id: 'harbin',
    nome: 'Harbin Wester',
    look: 'harbin',
    papel: 'Mestre da vila',
    bloco: 'nobre',
    fonte: 'SRD',
    atitude: 'medroso',
    personalidade: {
      quer: 'Terminar o mandato sem um único incidente escrito no próprio nome.',
      esconde: 'Que já sabia dos ataques antes das primeiras reclamações e decidiu esperar para ver se paravam sozinhos.',
      fala: 'Formal, prolixo, usa o cargo como terceira pessoa. Promete recompensa com números vagos e some quando é hora de pagar.',
    },
    frase: 'O mestre da vila agradece a iniciativa dos senhores. O mestre da vila não a autorizou.',
    blurb: 'Não luta: gasta a ação gritando por guardas e some de cena na rodada dois.',
  },

  daran: {
    id: 'daran',
    nome: 'Daran Edermath',
    look: 'daran',
    papel: 'Pomicultor, antigo batedor',
    bloco: 'veterano',
    fonte: 'SRD',
    atitude: 'aliado',
    personalidade: {
      quer: 'Morrer de velho entre as macieiras, depois de fechar uma última conta que ficou aberta.',
      esconde: 'Que ainda guarda a insígnia da ordem numa caixa e que sai de casa armado para colher fruta.',
      fala: 'Pausado, pergunta mais do que responde, mede o grupo antes de oferecer qualquer coisa. Chama o perigo de trabalho.',
    },
    frase: 'Eu plantei essas árvores para não precisar mais disso. Mas eu ainda sei onde está.',
    blurb: 'Atira de longe na rodada um e passa para a espada quando a linha encosta nele.',
  },

  // -------------------------------------------------------------------------
  // A FAZENDA ALDERLEAF
  // -------------------------------------------------------------------------

  qelline: {
    id: 'qelline',
    nome: 'Qelline Alderleaf',
    look: 'qelline',
    papel: 'Fazendeira',
    bloco: 'plebeu',
    fonte: 'SRD',
    atitude: 'cordial',
    personalidade: {
      quer: 'Que o filho tenha mais escolha do que ela teve, de preferência longe de porão nenhum.',
      esconde: 'Nada. É o único NPC do elenco que responde a pergunta direta com resposta direta, e isso é a característica dela.',
      fala: 'Prática e calma, faz as mãos continuarem trabalhando enquanto conversa. Diz o que sabe e para de falar quando acaba.',
    },
    frase: 'Dorme no palheiro, come com a gente, e amanhã me conta se eu devia me preocupar.',
    blurb: 'Não luta: tira a criança da casa e aponta a trilha dos fundos, que evita o encontro.',
  },

  carp: {
    id: 'carp',
    nome: 'Carp Alderleaf',
    look: 'carp',
    papel: 'Criança da fazenda',
    bloco: 'plebeu',
    fonte: 'SRD',
    // O bloco é o de plebeu sem desconto: no SRD não existe bloco de criança, e
    // inventar um "plebeu menor" seria número nosso dentro de um bloco do SRD,
    // que é o tipo de mistura que o ELENCO proíbe. A criança não devia estar na
    // lista de iniciativa; se estiver, a mesa errou antes do bloco.
    atitude: 'cordial',
    personalidade: {
      quer: 'Mostrar a alguém grande a passagem que ele achou, e ser levado a sério uma vez na vida.',
      esconde: 'Que já entrou. Vai dizer que só olhou de fora, e vai mudar a história três vezes.',
      fala: 'Atropelado, pergunta em cima de pergunta, inventa detalhe quando a memória falha. Nunca diz que tem medo.',
    },
    frase: 'Tem uma porta no morro e eu sei onde. Me leva que eu mostro, mas não conta para a minha mãe.',
    blurb: 'Nunca entra em iniciativa: se entrar, ele é objetivo de proteção e não combatente.',
  },

  // -------------------------------------------------------------------------
  // OS QUE GUARDAM SEGREDO
  // -------------------------------------------------------------------------

  irmaGaraele: {
    id: 'irmaGaraele',
    nome: 'Irmã Garaele',
    look: 'irmaGaraele',
    papel: 'Acólita do santuário da sorte',
    bloco: 'acolito',
    fonte: 'SRD',
    atitude: 'barganha',
    personalidade: {
      quer: 'Uma resposta que só um morto sabe, e está disposta a pagar o preço de perguntar.',
      esconde: 'Que já tentou duas vezes sozinha, voltou ferida das duas, e não contou a ninguém do santuário.',
      fala: 'Formal e impaciente ao mesmo tempo. Explica rito com precisão e corta pergunta pessoal com uma bênção.',
    },
    frase: 'A sorte não é bondade. É só a parte do futuro que ainda não foi decidida.',
    blurb: 'Fica atrás: cura quem caiu e desfaz veneno, e isso vale mais que o ataque dela.',
  },

  reidoth: {
    id: 'reidoth',
    nome: 'Reidoth',
    look: 'reidoth',
    papel: 'Druida errante das ruínas',
    bloco: 'druida',
    // O Druida está no apêndice de PdMs do SRD 5.1. O bloco ainda não existe
    // aqui porque as magias dele (Produzir Chama, Constrição, Pele de Árvore)
    // não estão em `spells.js`; até lá, o acólito faz o papel de suporte.
    fonte: 'SRD',
    blocoSubstituto: 'acolito',
    notaDoSubstituto: 'o bloco de druida espera as magias dele em spells.js',
    atitude: 'arredio',
    personalidade: {
      quer: 'Que a ruína volte a ser mato e que ninguém mais suba aquela colina, incluindo o grupo.',
      esconde: 'Que fica ali por culpa: viu o que se instalou nas pedras e demorou anos para agir.',
      fala: 'Áspero no primeiro minuto, exato no segundo. Mede ajuda como quem mede remédio e sempre pede algo em troca.',
    },
    frase: 'Eu não guio ninguém. Eu digo por onde não ir, e o resto é problema de quem anda.',
    blurb: 'Prende o alvo no mato e cura à distância; nunca troca golpe na linha da frente.',
  },

  agatha: {
    id: 'agatha',
    nome: 'Agatha',
    look: 'agatha',
    papel: 'Morta que ainda recebe visita',
    bloco: 'espectro',
    fonte: 'SRD',
    atitude: 'barganha',
    personalidade: {
      quer: 'Ser tratada como a pessoa que foi, e não como a coisa em que virou. Um presente serve; respeito serve mais.',
      esconde: 'Que lembra muito menos do que finge, e mente para não perder a única visita que ainda tem.',
      fala: 'Antiquada e cortês, com pausas longas no lugar errado. Responde uma pergunta por visita e cobra por cada uma.',
    },
    frase: 'Pergunte. Mas pergunte como se eu ainda pudesse recusar, porque eu ainda posso.',
    blurb: 'Atravessa parede, drena vida ao toque e não pode ser agarrada — ela escolhe quando lutar.',
  },

  // -------------------------------------------------------------------------
  // OS QUE TRAEM
  // -------------------------------------------------------------------------

  iarno: {
    id: 'iarno',
    nome: 'Iarno Albrek',
    look: 'iarno',
    papel: 'Mago contratado que virou chefe de bando',
    bloco: 'cajavidro',
    fonte: 'propria',
    atitude: 'hostil',
    personalidade: {
      quer: 'Mandar em algo pequeno o suficiente para ninguém de fora vir conferir.',
      esconde: 'Que ainda responde a alguém e que o posto de chefe foi concessão, não conquista.',
      fala: 'Cortês e condescendente, usa o título antigo. Oferece acordo primeiro, porque gosta mais de ser aceito que de vencer.',
    },
    frase: 'Eu fui enviado para trazer a lei. Eu trouxe. A lei agora é minha.',
    blurb: 'Luta de longe atrás da armadura arcana, com raio de gelo; com 8 PV ou menos e encurralado, se rende.',
  },

  nezznar: {
    id: 'nezznar',
    nome: 'Nezznar',
    look: 'nezznar',
    papel: 'Drow que caça a forja perdida',
    bloco: 'mago',
    fonte: 'SRD',
    atitude: 'hostil',
    personalidade: {
      quer: 'A forja inteira e sozinho, para não ter de dividir o crédito com quem o financiou.',
      esconde: 'Que os aliados dele são alugados e que nenhum deles morreria por ele.',
      fala: 'Baixo, paciente, explica o plano enquanto ele acontece. Chama os capangas de recurso e o grupo de atraso.',
    },
    frase: 'Vocês chegaram longe. Isso me poupou mandar alguém medir a distância.',
    blurb: 'Fica atrás dos capangas, prende o grupo com teia e enfeitiça o mais forte contra os outros.',
  },

  hamunKost: {
    id: 'hamunKost',
    nome: 'Hamun Kost',
    look: 'hamunKost',
    papel: 'Necromante de manto vermelho',
    bloco: 'mago',
    fonte: 'SRD',
    // O bloco é o de mago do SRD. A escola de necromancia aqui é sabor de
    // descrição e de escolha de magia na mesa, não número novo: um "mago
    // necromante" com PV e CA inventados seria bloco nosso vestido de SRD.
    atitude: 'barganha',
    personalidade: {
      quer: 'Terminar a leitura que começou nos ossos daquele lugar, e ir embora sem briga se der.',
      esconde: 'Para quem ele faz a leitura, e que a resposta não é para ele.',
      fala: 'Seco, técnico, sem insulto nenhum. Trata o grupo como variável: se não atrapalha, nem olha.',
    },
    frase: 'Eu não disputo este corredor. Eu só preciso de mais uma hora com o que está nele.',
    blurb: 'Deixa os mortos-vivos segurarem a linha e lança de longe; troca trégua por passagem se perder metade.',
  },

  mormesk: {
    id: 'mormesk',
    nome: 'Mormesk',
    look: 'mormesk',
    papel: 'O que ficou guardando o próprio tesouro',
    bloco: 'wraith',
    fonte: 'SRD',
    atitude: 'hostil',
    personalidade: {
      quer: 'Que nada saia daquele cofre, inclusive ele. A posse é a única coisa que sobrou da pessoa.',
      esconde: 'Que o cofre está quase vazio há séculos e que ele continua contando moeda que não existe.',
      fala: 'Em frases de dono: o que é meu, quem autorizou. Não negocia preço, só posse.',
    },
    frase: 'Isso é meu. Vocês, enquanto estiverem aqui, também.',
    blurb: 'Atravessa parede e abate quem já está ferido: reduz o PV máximo, dano que a cura não desfaz.',
  },

  // -------------------------------------------------------------------------
  // GOBLINOIDES COM NOME
  // -------------------------------------------------------------------------

  droop: {
    id: 'droop',
    nome: 'Droop',
    look: 'droop',
    papel: 'Goblin de serviço, último da fila',
    // Bloco NOMEADO de `monsters/goblinoides.js`, não o goblin genérico: ele já
    // tem ficha e look próprios lá, e apontar para o bloco com nome é o que
    // evita duas versões de Droop no jogo.
    bloco: 'droop',
    fonte: 'SRD',
    atitude: 'medroso',
    personalidade: {
      quer: 'Alguém mais forte para seguir, qualquer um, de preferência quem bater menos nele.',
      esconde: 'Nada por escolha: entrega tudo que sabe na primeira pergunta e inventa o resto para agradar.',
      fala: 'Baixinho, repete a última palavra de quem falou antes, chama todo mundo de chefe. Concorda com as duas partes de uma discussão.',
    },
    frase: 'Droop mostra o caminho, chefe. Droop sempre mostrou, só ninguém perguntou.',
    blurb: 'Não ataca: se rendido, aponta armadilha e rota de fuga, o que troca um encontro por uma emboscada sua.',
  },

  yeemik: {
    id: 'yeemik',
    nome: 'Yeemik',
    look: 'yeemik',
    papel: 'Segundo em comando que quer ser o primeiro',
    // Bloco nomeado de `monsters/goblinoides.js`. O ELENCO lista Yeemik como
    // goblin e não como chefe goblin, e isso é o personagem: ele comanda com um
    // elmo roubado e números de goblin comum.
    bloco: 'yeemik',
    fonte: 'SRD',
    atitude: 'barganha',
    personalidade: {
      quer: 'O lugar do chefe, hoje, e que o grupo faça o trabalho sujo por ele.',
      esconde: 'Que metade do bando não o obedece e que ele perde a cadeira na hora em que o chefe cair.',
      fala: 'Alto e empolado, imita ordem de oficial. Começa oferecendo troca e muda os termos no meio da frase.',
    },
    frase: 'Vocês sobem, matam o grandão, e eu devolvo o refém. Quase inteiro.',
    blurb: 'Negocia com refém na borda do penhasco: faz o grupo gastar turno antes do primeiro ataque.',
  },

  klarg: {
    id: 'klarg',
    nome: 'Klarg',
    look: 'klarg',
    papel: 'Bugbear que manda na caverna',
    bloco: 'klarg',
    fonte: 'SRD',
    atitude: 'hostil',
    personalidade: {
      quer: 'Que a parte dele do saque seja visivelmente maior que a dos outros, para não precisar explicar quem manda.',
      esconde: 'Que recebe ordem de fora e repete essa ordem como se fosse ideia dele.',
      fala: 'Grita em terceira pessoa, pergunta e responde sozinho. Ameaça com detalhe demais, como quem ensaiou.',
    },
    frase: 'Klarg ouviu vocês desde a ponte. Klarg deixou vocês chegarem.',
    blurb: 'Surpreende da sombra com maça e +2d6: se acertar na primeira rodada, derruba um personagem de uma vez.',
  },

  reiGrol: {
    id: 'reiGrol',
    nome: 'Rei Grol',
    look: 'reiGrol',
    papel: 'Bugbear que se declarou rei',
    bloco: 'reiGrol',
    // CRIATURA NOSSA, e a atribuição vem do bloco: `monsters/goblinoides.js`
    // marca `reiGrol` como `fonte: 'propria'` porque o bugbear do SRD é ND 1 e
    // cairia na primeira rodada contra o grupo de 3º nível. Eu repito a marca
    // aqui em vez de escrever 'SRD' por herança — a atribuição segue o bloco.
    fonte: 'propria',
    atitude: 'hostil',
    personalidade: {
      quer: 'Vender o que capturou pelo maior preço, antes que quem o contratou descubra que ele tem escolha.',
      esconde: 'Que o título é dele mesmo, dado por ele mesmo, e que o bando sabe.',
      fala: 'Sentencia em vez de responder. Fala de refém como mercadoria e de aliado como súdito atrasado.',
    },
    frase: 'O anão é meu até alguém pagar mais. Vocês trouxeram ouro ou só espada?',
    blurb: 'Luta com o prisioneiro à vista para forçar o grupo a dividir a atenção, e ataca quem se separar.',
  },

};

let serie = 0;

/**
 * Instancia um NPC como combatente, no espírito de `makeMonster`.
 *
 * O NPC não tem ficha própria: a ficha É o bloco do SRD que ele aponta. Então o
 * caminho é construir o bloco e trocar o que é da PESSOA — nome, look, lado e a
 * identidade. Fazer o contrário (copiar campo por campo para um objeto novo)
 * significaria repetir aqui a lista de campos de `makeMonster`, e ela mudaria
 * sem este arquivo saber.
 *
 * `side` pode ser forçado porque a atitude inicial não decide a briga: um aliado
 * enfeitiçado luta do outro lado, e um neutro atacado pelo grupo também.
 */
export function makeNpc(id, pos, { rng = null, nameSuffix = '', side = null } = {}) {
  const def = NPCS[id];
  if (!def) throw new Error(`NPC desconhecido: "${id}"`);
  // Substituto declarado: usado quando o bloco pretendido ainda não existe ou
  // está com a atribuição em aberto. Fica registrado no combatente (`blocoNota`)
  // para a troca não virar uma decisão silenciosa de licença.
  const bloco = MONSTERS[def.bloco] ? def.bloco : (def.blocoSubstituto ?? def.bloco);
  if (!MONSTERS[bloco]) {
    // Erro explícito e com o nome do bloco: os blocos de NPC do SRD vivem em
    // `rules/monsters/humanoides.js` e `mortosvivos.js`, que não são deste
    // arquivo. Falhar com a mensagem certa é melhor que devolver um combatente
    // meio montado e descobrir isso no meio do combate.
    throw new Error(
      `NPC "${id}" (${def.nome}) usa o bloco "${def.bloco}", que não existe em rules/monsters.js. `
      + 'Blocos de NPC moram em rules/monsters/humanoides.js e mortosvivos.js.',
    );
  }

  const c = makeMonster(bloco, pos, { rng });
  c.id = `${id}-${++serie}`;
  c.defId = bloco;          // de onde saiu a ficha
  if (bloco !== def.bloco) c.blocoNota = `substituto de "${def.bloco}": ${def.notaDoSubstituto ?? def.fonteNota ?? 'bloco ausente'}`;
  c.npcId = id;             // quem é a pessoa
  c.name = def.nome + (nameSuffix ? ` ${nameSuffix}` : '');
  c.look = def.look;
  c.papel = def.papel;
  c.atitude = def.atitude;
  c.side = side ?? (ATITUDES[def.atitude]?.lado ?? 'foes');
  // O blurb do NPC fala do que ELE faz, não do bloco genérico — é o que o HUD
  // mostra, então ganha do blurb do monstro.
  c.blurb = def.blurb;
  return c;
}

/** Os blocos do SRD que este arquivo depende de encontrar em `monsters.js`. */
export const blocosNecessarios = () =>
  [...new Set(Object.values(NPCS).map((n) => n.bloco))].sort();

/**
 * Quais blocos ainda faltam. Serve de checagem rápida na inicialização — e é
 * por isso que ela ignora o substituto: o que interessa saber é qual bloco
 * ainda não chegou, não qual NPC conseguiu se virar sem ele.
 */
export const blocosFaltando = () =>
  blocosNecessarios().filter((b) => !MONSTERS[b]);

/** NPCs cuja atribuição de licença ainda não está fechada. */
export const npcsAVerificar = () =>
  Object.values(NPCS).filter((n) => n.fonte === 'verificar');

export const allNpcIds = () => Object.keys(NPCS);

export function resolveNpc(id) {
  const def = NPCS[id];
  if (!def) throw new Error(`NPC desconhecido: "${id}"`);
  return def;
}
