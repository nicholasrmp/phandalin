// Humanoides com bloco do SRD: bandido, capitão bandido, rufião, batedor,
// veterano, mago, acólito, sacerdote, espião, plebeu, guarda, nobre, cavaleiro,
// drow e ogro.
// SRD 5.1 (CC-BY-4.0) — ver NOTICE.md e ELENCO.md.
//
// Regra dura: nada aqui pode ser bloco de monstro que não esteja no SRD. Se a
// criatura é do módulo publicado e não está no SRD, ela vira criatura NOSSA,
// com nome e números nossos, marcada `fonte: 'propria'`. Chutar atribuição de
// SRD num bloco que não é SRD é o pior erro possível neste projeto.
//
// `fonte` é documentação de licença, não dado de jogo: `makeMonster` não a
// copia para o combatente. Ela existe para auditoria do contrato do elenco.
//
// RUFIÃO, VETERANO E DROW
//   Rufião (Thug), Veterano (Veteran) e Drow estão no SRD 5.1 (os dois
//   primeiros no apêndice de PdMs, o drow na entrada de elfos), que é o que o
//   projeto atribui no NOTICE.
//
// VARIANTES DE BANDIDO
//   Três ids com o MESMO bloco do SRD e looks diferentes. `makeMonster` fixa um
//   look por id, e um bando de cinco bandidos saindo com a mesma figura cinco
//   vezes é exatamente o defeito que o contrato do elenco manda consertar.
//
// CAMPOS QUE O MOTOR AINDA NÃO LÊ
//   `saves`, `spellcasting`, `features` e `sneakAttack` estão escritos porque
//   fazem parte do bloco, mas hoje `makeMonster` não os copia para o
//   combatente — está no relatório como pedido ao dono de `rules/monsters.js`.
//
// `TRAITS` deste arquivo é somado ao dicionário de traços em `../monsters.js`.

export const HUMANOIDES = {

  // --- bandidos -------------------------------------------------------------

  // Batedores do bando do Cume da Wyvern (Parte 3): andam pela Trilha
  // Triboar atrás de viajantes. Bloco do SRD 5.1; a Agressividade (ação
  // bônus para avançar até o inimigo) é a regra 2 da IA (`rules/ai.js`).
  orc: {
    id: 'orc',
    name: 'Orc',
    look: 'orc',
    fonte: 'SRD',
    size: 'médio',
    level: 2,
    cr: '1/2',
    xp: 100,
    abilities: { str: 16, dex: 12, con: 16, int: 7, wis: 11, cha: 10 },
    ac: 13,
    acNote: 'armadura de couro cru',
    maxHp: 15,
    hpDice: '2d8+6',
    speedFt: 30,
    senses: { darkvisionFt: 60 },
    skills: ['intimidacao'],
    attacks: [
      { name: 'Machado grande', bonus: 5, damage: '1d12+3', type: 'cortante', reachFt: 5, art: 'axe' },
      { name: 'Azagaia', bonus: 5, damage: '1d6+3', type: 'perfurante', ranged: true, rangeFt: 30, longRangeFt: 120, art: 'javelin' },
    ],
    traits: ['agressivo'],
    blurb: 'Agressivo: corre até o grupo como ação bônus e ainda bate com o machado grande (1d12+3). Pouca CA, muitos PV.',
  },

  bandido: {
    id: 'bandido',
    name: 'Bandido',
    look: 'bandido',
    fonte: 'SRD',
    size: 'médio',
    level: 1,
    cr: '1/8',
    xp: 25,
    abilities: { str: 11, dex: 12, con: 12, int: 10, wis: 10, cha: 10 },
    ac: 12,
    acNote: 'armadura de couro',
    maxHp: 11,
    speedFt: 30,
    attacks: [
      { name: 'Cimitarra', bonus: 3, damage: '1d6+1', type: 'cortante', reachFt: 5, art: 'sword' },
      { name: 'Besta leve', bonus: 3, damage: '1d8+1', type: 'perfurante', ranged: true, rangeFt: 80, longRangeFt: 320, art: 'bow' },
    ],
    blurb: 'Avança em bando e troca de arma conforme a distância: 11 PV e CA 12 fazem dele o inimigo que morre de um golpe, mas seis deles somam 6d8 por rodada à distância.',
  },

  bandidoBesteiro: {
    id: 'bandidoBesteiro',
    name: 'Bandido',
    look: 'bandidoBesteiro',
    fonte: 'SRD',               // mesmo bloco do bandido; só o look muda
    size: 'médio',
    level: 1,
    cr: '1/8',
    xp: 25,
    abilities: { str: 11, dex: 12, con: 12, int: 10, wis: 10, cha: 10 },
    ac: 12,
    acNote: 'armadura de couro',
    maxHp: 11,
    speedFt: 30,
    attacks: [
      // Mesma besta do bloco, listada primeiro: a IA prefere o primeiro ataque
      // à distância quando está em terreno alto, e este é o que fica no platô.
      { name: 'Besta leve', bonus: 3, damage: '1d8+1', type: 'perfurante', ranged: true, rangeFt: 80, longRangeFt: 320, art: 'bow' },
      { name: 'Cimitarra', bonus: 3, damage: '1d6+1', type: 'cortante', reachFt: 5, art: 'sword' },
    ],
    blurb: 'Fica no alto e atira enquanto os outros fecham o corpo a corpo: tire-o do terreno alto ou o grupo leva 1d8 por rodada sem conseguir revidar.',
  },

  bandidoMachadeiro: {
    id: 'bandidoMachadeiro',
    name: 'Bandido',
    look: 'bandidoMachadeiro',
    fonte: 'SRD',               // mesmo bloco do bandido; só o look muda
    size: 'médio',
    level: 1,
    cr: '1/8',
    xp: 25,
    abilities: { str: 11, dex: 12, con: 12, int: 10, wis: 10, cha: 10 },
    ac: 12,
    acNote: 'armadura de couro',
    maxHp: 11,
    speedFt: 30,
    attacks: [
      { name: 'Machado de mão', bonus: 3, damage: '1d6+1', type: 'cortante', reachFt: 5, art: 'axe' },
    ],
    blurb: 'Só corpo a corpo: corre direto para o alvo mais machucado e não tem resposta nenhuma contra quem o mantém a 9 m.',
  },

  capitaoBandido: {
    id: 'capitaoBandido',
    name: 'Capitão Bandido',
    look: 'capitaoBandido',
    fonte: 'SRD',
    size: 'médio',
    level: 3,
    cr: '2',
    xp: 450,
    abilities: { str: 15, dex: 16, con: 14, int: 14, wis: 11, cha: 14 },
    ac: 15,
    acNote: 'armadura de couro batido',
    maxHp: 65,
    speedFt: 30,
    saves: ['str', 'dex', 'wis'],
    skills: ['atletismo', 'enganacao'],
    attacks: [
      { name: 'Cimitarra', bonus: 5, damage: '1d6+3', type: 'cortante', reachFt: 5, art: 'sword' },
      { name: 'Adaga', bonus: 5, damage: '1d4+3', type: 'perfurante', reachFt: 5, art: 'dagger' },
      { name: 'Adaga arremessada', bonus: 5, damage: '1d4+3', type: 'perfurante', ranged: true, rangeFt: 20, longRangeFt: 60, art: 'dagger' },
    ],
    // Três golpes, como no SRD: duas cimitarras e uma adaga. É um inimigo de
    // ND 2 — contra um grupo de 1º ou 2º nível, quem escala o encontro é que
    // decide se ele entra.
    multiattack: { count: 3, sequence: ['Cimitarra', 'Cimitarra', 'Adaga'] },
    traits: ['aparar'],
    blurb: 'Dois golpes por turno e, de reação, apara o primeiro ataque que o acertaria: 65 PV é a luta mais longa desta linha da campanha, e vale cercá-lo para gastar a reação dele antes do golpe grande.',
  },

  // --- brutos e batedores ---------------------------------------------------

  rufiao: {
    id: 'rufiao',
    name: 'Rufião',
    look: 'rufiao',
    fonte: 'SRD',
    size: 'médio',
    level: 2,
    cr: '1/2',
    xp: 100,
    abilities: { str: 15, dex: 11, con: 14, int: 10, wis: 10, cha: 11 },
    ac: 11,
    acNote: 'armadura de couro',
    maxHp: 32,
    speedFt: 30,
    attacks: [
      { name: 'Maça', bonus: 4, damage: '1d6+2', type: 'concussão', reachFt: 5, art: 'mace' },
      { name: 'Besta pesada', bonus: 2, damage: '1d10', type: 'perfurante', ranged: true, rangeFt: 100, longRangeFt: 400, art: 'bow' },
    ],
    // Dois golpes de perto (SRD); a besta é um tiro só.
    multiattack: { count: 2, sequence: ['Maça', 'Maça'] },
    traits: ['packTactics'],
    blurb: 'Nunca luta sozinho: com um aliado colado no alvo ataca com vantagem duas vezes por turno, e 32 PV o mantêm de pé tempo suficiente para isso. Quebre a dupla e ele perde metade da ameaça.',
  },

  // O bandido da gangue que domina Phandalin (A Mina Perdida de Phandelver).
  // Números do bloco da aventura; o manto vermelho sujo é o uniforme deles.
  marcarrubra: {
    id: 'marcarrubra',
    name: 'Bandido Marcarrubra',
    look: 'marcarrubra',
    // NOSSO, derivado do Bandido do SRD (CA 12 de couro, 11 PV, Cimitarra +3
    // de 1d6+1, ND 1/8). O que mudamos: couro batido no lugar do couro (CA
    // 13), mais vida (3d8+3) e uma segunda cimitarra, que é o que faz o papel
    // deles no módulo — valentão que anda em bando e bate dois por turno.
    // Estava marcado 'aventura', que não é um dos rótulos do projeto e
    // escondia um bloco de livro. Medido: com estes números a briga da rua
    // mantém a mesma faixa de antes.
    fonte: 'propria',
    size: 'médio',
    level: 1,
    cr: '1/2',
    xp: 100,
    abilities: { str: 11, dex: 14, con: 12, int: 10, wis: 10, cha: 11 },
    ac: 13,
    acNote: 'couro batido',
    maxHp: 16,
    hpDice: '3d8+3',
    speedFt: 30,
    skills: ['intimidacao'],
    attacks: [
      { name: 'Cimitarra', bonus: 3, damage: '1d6+1', type: 'cortante', reachFt: 5, art: 'sword' },
    ],
    multiattack: { count: 2, sequence: ['Cimitarra', 'Cimitarra'] },
    traits: [],
    blurb: 'Ladrão mesquinho de manto vermelho encardido. Dois golpes de cimitarra por turno; vive de intimidar quem não revida.',
  },

  batedor: {
    id: 'batedor',
    name: 'Batedor',
    look: 'batedor',
    fonte: 'SRD',
    size: 'médio',
    level: 2,
    cr: '1/2',
    xp: 100,
    abilities: { str: 11, dex: 14, con: 12, int: 11, wis: 13, cha: 11 },
    ac: 13,
    acNote: 'armadura de couro',
    maxHp: 16,
    speedFt: 30,
    skills: ['natureza', 'percepcao', 'furtividade', 'sobrevivencia'],
    expertise: ['natureza', 'percepcao', 'furtividade', 'sobrevivencia'],
    attacks: [
      { name: 'Arco longo', bonus: 4, damage: '1d8+2', type: 'perfurante', ranged: true, rangeFt: 150, longRangeFt: 600, art: 'bow' },
      { name: 'Espada curta', bonus: 4, damage: '1d6+2', type: 'perfurante', reachFt: 5, art: 'sword' },
    ],
    multiattack: { count: 2 },
    traits: ['audicaoEVisaoApuradas'],
    blurb: 'Abre o combate de 45 m com dois tiros de 1d8+2 e some: percepção alta significa que ele vê o grupo primeiro, e quem não fecha a distância luta a rodada toda sob flecha.',
  },

  veterano: {
    id: 'veterano',
    name: 'Veterano',
    look: 'veterano',
    fonte: 'SRD',
    size: 'médio',
    level: 4,
    cr: '3',
    xp: 700,
    abilities: { str: 16, dex: 13, con: 14, int: 10, wis: 11, cha: 10 },
    ac: 17,
    acNote: 'armadura de talas',
    maxHp: 58,
    speedFt: 30,
    skills: ['atletismo', 'percepcao'],
    attacks: [
      { name: 'Espada longa', bonus: 5, damage: '1d8+3', type: 'cortante', reachFt: 5, art: 'sword' },
      { name: 'Besta pesada', bonus: 3, damage: '1d10+1', type: 'perfurante', ranged: true, rangeFt: 100, longRangeFt: 400, art: 'bow' },
    ],
    // Dois golpes de perto (SRD); a besta é um tiro só.
    multiattack: { count: 2, sequence: ['Espada longa', 'Espada longa'] },
    blurb: 'CA 17 e 58 PV sem traço nenhum: é o muro do elenco humano, dá dois golpes por turno e obriga o grupo a gastar magia em vez de esperar a sorte dos dados.',
  },

  // --- conjuradores ---------------------------------------------------------

  mago: {
    id: 'mago',
    name: 'Mago',
    look: 'mago',
    fonte: 'SRD',
    size: 'médio',
    level: 6,
    cr: '6',
    xp: 2300,
    abilities: { str: 9, dex: 14, con: 11, int: 17, wis: 12, cha: 11 },
    ac: 12,
    acNote: 'sem armadura; 15 com armadura arcana',
    maxHp: 40,
    speedFt: 30,
    saves: ['int', 'wis'],
    skills: ['arcanismo', 'historia'],
    attacks: [
      { name: 'Adaga', bonus: 5, damage: '1d4+2', type: 'perfurante', reachFt: 5, art: 'dagger' },
    ],
    // `level: 6` não é a idade dele: é o número que faz `proficiencyBonus` sair
    // +3, e com INT 17 isso dá CD 14 e +6 de ataque mágico — os valores do
    // bloco. Mexer no nível muda a CD do encontro inteiro.
    spellcasting: {
      ability: 'int',
      cantrips: ['raioDeFogo', 'raioDeGelo'],
      // Só as magias que `rules/spells.js` tem. O bloco do SRD traz mais;
      // inventar id de magia aqui quebra `getSpell`, que lança erro.
      prepared: ['misselMagico', 'maosFlamejantes', 'sono', 'contramagia'],
      slots: [0, 4, 3, 3, 3, 1],
      // Entra no motor de magias: o Mago reage com Contramágica (a IA ainda não o faz conjurar no turno dele).
      noMotor: true,
    },
    traits: ['conjuracao'],
    blurb: 'Abre com Sono para tirar dois personagens da luta sem rolar ataque, depois Mãos Flamejantes em quem se amontoar; 40 PV e CA 12 significam que o grupo tem uma rodada para alcançá-lo.',
  },

  // O CAJAVIDRO (Iarno Albrek), chefe dos Marcarrubra. Os números são os do
  // livro da aventura (A Mina Perdida de Phandelver): o bloco de mago maligno
  // que ela traz, mais o Cajado de Defesa que dá o nome a ele (+1 na CA, 10
  // cargas: Armadura Arcana por 1, Escudo Arcano por 2). Conteúdo de fã, com
  // as regras escritas por nós; nenhum texto do livro copiado.
  cajavidro: {
    id: 'cajavidro',
    name: 'Cajavidro',
    look: 'iarno',
    fonte: 'aventura',
    size: 'médio',
    // Conjurador de 4º nível: +2 de proficiência, CD 13 e +5 com INT 17.
    level: 4,
    cr: '1',
    xp: 200,
    abilities: { str: 9, dex: 14, con: 11, int: 17, wis: 12, cha: 11 },
    // Chega já sob a Armadura Arcana do cajado (13 + DES 2) e com o +1 do
    // próprio cajado; sem a armadura seria 13 (12 + 1).
    ac: 16,
    acNote: 'Armadura Arcana do cajado, +1 do Cajado de Defesa',
    maxHp: 22,
    hpDice: '5d8',
    speedFt: 30,
    saves: ['int', 'wis'],
    skills: ['arcanismo', 'historia'],
    attacks: [
      { name: 'Cajado de vidro', bonus: 1, damage: '1d6-1', type: 'concussão', reachFt: 5, art: 'staff' },
    ],
    spellcasting: {
      ability: 'int',
      cantrips: ['luz', 'maoMagica', 'toqueChocante'],
      // Escudo Arcano sai do cajado (2 cargas), não de espaço: `cajado`.
      prepared: ['enfeiticarPessoa', 'misselMagico', 'imobilizarPessoa', 'passoNebuloso', 'escudoArcano'],
      slots: [0, 4, 3],
      cajado: { cargas: 10, magias: { armaduraArcana: 1, escudoArcano: 2 } },
      noMotor: true,
      // A IA conjura no turno dele (`conjurarNoTurno` em `rules/ai.js`).
      conjuraNoTurno: true,
    },
    traits: ['conjuracao', 'cajadoDeDefesa'],
    blurb: 'Prende o mais forte com Imobilizar Pessoa, solta Mísseis Mágicos de longe, some com Passo Nebuloso quando encurralado e ergue o Escudo Arcano pelo cajado. Sem fuga e com 8 PV ou menos, se rende.',
  },

  // NEZZNAR, A ARANHA NEGRA (Parte 4: a Caverna do Eco das Ondas). O bloco e
  // o MAGO do SRD inteiro -- os mesmos numeros, nenhum inventado -- com o que
  // o faz DROW por cima, e nada mais:
  //   . visao no escuro de 36 m (a do drow, nao a de 18 m do mago);
  //   . Ascendencia Feerica e Sensibilidade a Luz Solar;
  //   . Fogo das Fadas entre as magias preparadas, que e a conjuracao inata
  //     do drow e a unica dela que o motor executa (a IA abre com ela,
  //     `fogoDasFadasNoTurno` em `rules/ai.js`). Luzes Dancantes e Escuridao
  //     ficam de fora porque o motor nao as tem.
  // O ND continua 6 (2.300 PX): os tracos de drow nao mudam os numeros da
  // luta, so o lado em que ela e travada -- no escuro ele enxerga 36 m, e sob
  // o sol ataca com desvantagem.
  nezznar: {
    id: 'nezznar',
    name: 'Nezznar',
    look: 'nezznar',
    // OS NÚMEROS SÃO OS DO LIVRO (A Mina Perdida de Phandelver, apêndice B): ND 2, 450 XP, 27 PV. Já foi o mago do
    // SRD com os traços de drow por cima (ND 6): era o que a ficha de monstro mais parecia, e não o que a
    // aventura diz. O que faz da luta final um desafio é a companhia (dois bugbears e quatro aranhas gigantes),
    // não ele.
    fonte: 'propria',
    size: 'médio',
    level: 4,
    cr: '2',
    xp: 450,
    abilities: { str: 9, dex: 13, con: 10, int: 16, wis: 14, cha: 13 },
    // A CA do bloco já conta a Armadura Arcana (11 + DES 1 = 14 com ela): a magia dura 8 horas, então um mago entra na
    // luta com ela de pé; o espaço gasto nela sai dos de 1º (quatro no bloco, três aqui).
    ac: 14,
    acNote: 'Armadura Arcana (11 sem ela)',
    maxHp: 27,
    speedFt: 30,
    saves: ['int', 'wis'],
    skills: ['arcanismo', 'furtividade', 'percepcao'],
    senses: { darkvisionFt: 120, passivePerception: 14 },
    attacks: [
      // O Cajado da Aranha: o bordão que ele carrega, com mais 1d6 de veneno em cada acerto.
      { name: 'Cajado da Aranha', bonus: 1, damage: '1d6-1', type: 'concussão', reachFt: 5, art: 'staff',
        danoExtra: { damage: '1d6', type: 'veneno' } },
    ],
    spellcasting: {
      ability: 'int',
      cantrips: ['raioDeGelo', 'toqueChocante'],
      // Armadura Arcana, Escudo Arcano e Mísseis Mágicos (1º); Invisibilidade e Sugestão (2º); e o Fogo das Fadas, da
      // conjuração inata do drow (uma vez por dia).
      prepared: ['armaduraArcana', 'escudoArcano', 'misselMagico', 'invisibilidade', 'sugestao', 'fogoDasFadas'],
      slots: [0, 3, 3],
      noMotor: true,
      conjuraNoTurno: true,
    },
    traits: ['conjuracao', 'ascendenciaFeerica', 'sensibilidadeALuzSolar'],
    blurb: 'Drow mago de CA 14: abre com Fogo das Fadas para acender o grupo, e some com Invisibilidade para atacar de onde ninguém vê. Bate com o Cajado da Aranha (1d6 de veneno a mais). Enxerga 36 m no escuro, mas sob luz do sol ataca com desvantagem.',
  },

  // BRUGHOR MACHADO-MORDEDOR, chefe do bando orc do Cume da Wyvern (Parte 3).
  // Bloco NOSSO (`fonte: 'propria'`): um orc maior, mais duro e mais bruto
  // que os outros, que bate duas vezes com o machado. Os orcs dele lutam até
  // ele cair; aí fogem (a cena cuida disso).
  brughor: {
    id: 'brughor',
    name: 'Brughor Machado-Mordedor',
    look: 'brughor',
    fonte: 'propria',
    size: 'médio',
    level: 4,
    cr: '2',
    xp: 450,
    abilities: { str: 18, dex: 12, con: 16, int: 8, wis: 11, cha: 12 },
    ac: 14,
    acNote: 'peles e um escudo velho',
    maxHp: 38,
    speedFt: 30,
    senses: { darkvisionFt: 60 },
    skills: ['intimidacao'],
    attacks: [
      { name: 'Machado grande', bonus: 6, damage: '1d12+4', type: 'cortante', reachFt: 5, art: 'axe' },
      { name: 'Azagaia', bonus: 6, damage: '1d6+4', type: 'perfurante', ranged: true, rangeFt: 30, longRangeFt: 120, art: 'javelin' },
    ],
    multiattack: { count: 2, sequence: ['Machado grande', 'Machado grande'] },
    traits: ['agressivo'],
    blurb: 'Agressivo como os orcs dele, e dois golpes de machado por turno. Enquanto ele estiver de pé, os orcs não correm.',
  },

  // O MAGO VERMELHO DO POÇO DA CORUJA VELHA (Parte 3). O livro da aventura dá
  // a ele a ficha do MAGO MALIGNO do apêndice (a mesma do Cajavidro, sem o
  // cajado de vidro): conjurador de 4º nível, +2 de proficiência, CD 13 e +5
  // com INT 17. O bordão é o cetro dourado do desenho. A pedido do dono, ele
  // chega já sob ARMADURA ARCANA (8 horas): CA 13 + DES, e um espaço de 1º a
  // menos.
  hamunKost: {
    id: 'hamunKost',
    name: 'Hamun Kost',
    look: 'hamunKost',
    fonte: 'aventura',
    size: 'médio',
    level: 4,
    cr: '1',
    xp: 200,
    abilities: { str: 9, dex: 14, con: 11, int: 17, wis: 12, cha: 11 },
    ac: 15,
    acNote: 'Armadura Arcana (13 + DES)',
    maxHp: 22,
    hpDice: '5d8',
    speedFt: 30,
    saves: ['int', 'wis'],
    skills: ['arcanismo', 'historia'],
    attacks: [
      { name: 'Cetro', bonus: 1, damage: '1d6-1', type: 'concussão', reachFt: 5, art: 'staff' },
    ],
    spellcasting: {
      ability: 'int',
      cantrips: ['luz', 'maoMagica', 'toqueChocante'],
      prepared: ['armaduraArcana', 'enfeiticarPessoa', 'misselMagico', 'imobilizarPessoa', 'passoNebuloso'],
      // Um dos quatro espaços de 1º já foi na Armadura Arcana.
      slots: [0, 3, 3],
      noMotor: true,
      // A IA conjura no turno dele (`conjurarNoTurno` em `rules/ai.js`).
      conjuraNoTurno: true,
    },
    traits: ['conjuracao'],
    blurb: 'Prefere conversar: basta alguém responder e ele segura os mortos. Se a conversa falha, prende o mais forte com Imobilizar Pessoa, solta Mísseis Mágicos de longe e some com Passo Nebuloso quando encurralado.',
  },

  acolito: {
    id: 'acolito',
    name: 'Acólito',
    look: 'acolito',
    fonte: 'SRD',
    size: 'médio',
    level: 1,
    cr: '1/4',
    xp: 50,
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 14, cha: 11 },
    ac: 10,
    acNote: 'sem armadura',
    maxHp: 9,
    speedFt: 30,
    skills: ['medicina', 'religiao'],
    attacks: [
      { name: 'Clava', bonus: 2, damage: '1d4', type: 'concussão', reachFt: 5, art: 'mace' },
    ],
    spellcasting: {
      ability: 'wis',
      cantrips: ['chamaSagrada'],
      prepared: ['curarFerimentos'],
      slots: [0, 3],
    },
    traits: ['conjuracao'],
    blurb: 'Cura 1d8+2 num aliado em vez de atacar: enquanto estiver de pé, o inimigo ao lado dele volta de 1 PV duas vezes. Nove PV — derrube-o primeiro.',
  },

  // O CULTISTA do SRD (CR 1/8, 25 XP): o de Árvore Trovão (área 13). Desenho do acólito com o manto preto do livro.
  cultista: {
    id: 'cultista',
    name: 'Cultista',
    look: 'cultista',
    fonte: 'SRD',
    size: 'médio',
    level: 1,
    cr: '1/8',
    xp: 25,
    abilities: { str: 11, dex: 12, con: 10, int: 10, wis: 11, cha: 10 },
    ac: 12,
    acNote: 'armadura de couro',
    maxHp: 9,
    hpDice: '2d8',
    speedFt: 30,
    skills: ['enganacao', 'religiao'],
    attacks: [
      { name: 'Cimitarra', bonus: 3, damage: '1d6+1', type: 'cortante', reachFt: 5, art: 'sword' },
    ],
    traits: ['devocaoSombria'],
    blurb: 'Nove PV, CA 12 e uma cimitarra: cai de um golpe ou dois, mas fanático (vantagem contra medo e encanto) e sempre em bando.',
  },

  sacerdote: {
    id: 'sacerdote',
    name: 'Sacerdote',
    look: 'sacerdote',
    fonte: 'SRD',
    size: 'médio',
    level: 3,
    cr: '2',
    xp: 450,
    abilities: { str: 10, dex: 10, con: 12, int: 13, wis: 16, cha: 13 },
    ac: 13,
    acNote: 'camisão de malha',
    maxHp: 27,
    speedFt: 30,
    skills: ['medicina', 'persuasao', 'religiao'],
    attacks: [
      { name: 'Maça', bonus: 2, damage: '1d6', type: 'concussão', reachFt: 5, art: 'mace' },
    ],
    spellcasting: {
      ability: 'wis',
      cantrips: ['chamaSagrada'],
      prepared: ['bencao', 'curarFerimentos', 'palavraCurativa'],
      slots: [0, 4, 3, 2],
    },
    traits: ['conjuracao', 'eminenciaDivina'],
    blurb: 'Gasta o primeiro turno em Bênção e transforma o bando todo: +1d4 em cada ataque e cada resistência dos aliados dele enquanto mantiver concentração. Dano nele quebra a concentração — é o alvo mais rentável do encontro.',
  },

  // --- cidade: espião, plebeu, guarda, nobre, cavaleiro ---------------------

  espiao: {
    id: 'espiao',
    name: 'Espião',
    look: 'espiao',
    fonte: 'SRD',
    size: 'médio',
    level: 3,
    cr: '1',
    xp: 200,
    abilities: { str: 10, dex: 15, con: 10, int: 12, wis: 14, cha: 16 },
    ac: 12,
    acNote: 'sem armadura',
    maxHp: 27,
    speedFt: 30,
    skills: ['enganacao', 'intuicao', 'investigacao', 'percepcao', 'persuasao', 'prestidigitacao', 'furtividade'],
    attacks: [
      { name: 'Espada curta', bonus: 4, damage: '1d6+2', type: 'perfurante', reachFt: 5, art: 'sword' },
      { name: 'Besta de mão', bonus: 4, damage: '1d6+2', type: 'perfurante', ranged: true, rangeFt: 30, longRangeFt: 120, art: 'bow' },
    ],
    // Dois golpes de perto (SRD); a besta é um tiro só.
    multiattack: { count: 2, sequence: ['Espada curta', 'Espada curta'] },
    // `features` + `sneakAttack` é o formato que `combat.js` já lê para o
    // ladino do grupo. Hoje `makeMonster` não copia os dois, então o furtivo do
    // espião está desligado no motor — pedido no relatório.
    features: ['sneakAttack'],
    sneakAttack: '2d6',
    traits: ['acaoAstuta', 'ataqueFurtivo'],
    blurb: 'Soma 2d6 ao primeiro acerto da rodada quando tem vantagem ou um aliado colado no alvo, e usa a ação bônus para se esconder outra vez: deixe-o escolher o alvo e ele tira 15 de dano do mago.',
  },

  plebeu: {
    id: 'plebeu',
    name: 'Plebeu',
    look: 'plebeu',
    fonte: 'SRD',
    size: 'médio',
    level: 1,
    cr: '0',
    xp: 10,
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    ac: 10,
    acNote: 'sem armadura',
    maxHp: 4,
    speedFt: 30,
    attacks: [
      { name: 'Clava', bonus: 2, damage: '1d4', type: 'concussão', reachFt: 5, art: 'mace' },
    ],
    // Quatro PV e 1d4 de dano: ele não é um desafio, é uma peça que o jogador
    // tem de proteger. Serve de refém, de testemunha e de aldeão no meio do
    // tiroteio — e o motor trata isso sem nenhuma regra nova, porque um
    // plebeu morre com qualquer coisa que o acerte.
    blurb: 'Não ameaça ninguém e morre com um acerto qualquer: existe para estar no caminho, e o encontro mede se o grupo luta com ele por perto ou em cima dele.',
  },

  guarda: {
    id: 'guarda',
    name: 'Guarda',
    look: 'guarda',
    fonte: 'SRD',
    size: 'médio',
    level: 1,
    cr: '1/8',
    xp: 25,
    abilities: { str: 13, dex: 12, con: 12, int: 10, wis: 11, cha: 10 },
    ac: 16,
    acNote: 'camisão de malha, escudo',
    maxHp: 11,
    speedFt: 30,
    skills: ['percepcao'],
    attacks: [
      { name: 'Lança', bonus: 3, damage: '1d6+1', type: 'perfurante', reachFt: 5, art: 'javelin' },
    ],
    blurb: 'CA 16 com 11 PV: segura a porta e erra pouco, mas cai no primeiro acerto que passar. Em par, os dois bloqueiam um corredor sem matar ninguém.',
  },

  nobre: {
    id: 'nobre',
    name: 'Nobre',
    look: 'nobre',
    fonte: 'SRD',
    size: 'médio',
    level: 1,
    cr: '1/8',
    xp: 25,
    abilities: { str: 11, dex: 12, con: 11, int: 12, wis: 14, cha: 16 },
    ac: 15,
    acNote: 'peitoral',
    maxHp: 9,
    speedFt: 30,
    skills: ['enganacao', 'intuicao', 'persuasao'],
    attacks: [
      { name: 'Rapieira', bonus: 3, damage: '1d8+1', type: 'perfurante', reachFt: 5, art: 'sword' },
    ],
    traits: ['aparar'],
    blurb: 'Nove PV atrás de CA 15 e uma reação que apara o golpe que o mataria: não vence luta nenhuma, só sobrevive a uma rodada mais do que o jogador espera.',
  },

  cavaleiro: {
    id: 'cavaleiro',
    name: 'Cavaleiro',
    look: 'cavaleiro',
    fonte: 'SRD',
    size: 'médio',
    level: 4,
    cr: '3',
    xp: 700,
    abilities: { str: 16, dex: 11, con: 14, int: 11, wis: 11, cha: 15 },
    ac: 18,
    acNote: 'armadura de placas',
    maxHp: 52,
    speedFt: 30,
    saves: ['con', 'wis'],
    attacks: [
      { name: 'Espada grande', bonus: 5, damage: '2d6+3', type: 'cortante', reachFt: 5, art: 'sword' },
      { name: 'Besta pesada', bonus: 2, damage: '1d10', type: 'perfurante', ranged: true, rangeFt: 100, longRangeFt: 400, art: 'bow' },
    ],
    // Dois golpes de perto (SRD); a besta é um tiro só.
    multiattack: { count: 2, sequence: ['Espada grande', 'Espada grande'] },
    traits: ['bravura', 'lideranca', 'aparar'],
    blurb: 'CA 18 e 2d6+3 duas vezes por turno, firme contra o medo: é o único humano do elenco que ganha a troca de golpes contra a guerreira, e o aliado ao lado dele rola melhor por causa da Liderança.',
  },

  // --- drow e ogro ----------------------------------------------------------

  drow: {
    id: 'drow',
    name: 'Drow',
    look: 'drow',
    fonte: 'SRD',
    size: 'médio',
    level: 1,
    cr: '1/4',
    xp: 50,
    abilities: { str: 10, dex: 14, con: 10, int: 11, wis: 11, cha: 12 },
    ac: 15,
    acNote: 'camisão de malha',
    maxHp: 13,
    hpDice: '3d8',
    speedFt: 30,
    senses: { darkvisionFt: 120, passivePerception: 12 },
    skills: ['percepcao', 'furtividade'],
    attacks: [
      { name: 'Espada curta', bonus: 4, damage: '1d6+2', type: 'perfurante', reachFt: 5, art: 'sword' },
      {
        name: 'Besta de mão', bonus: 4, damage: '1d6+2', type: 'perfurante',
        ranged: true, rangeFt: 30, longRangeFt: 120, art: 'bow',
        // O veneno do bloco também derruba inconsciente quem falha por 5 ou
        // mais. O motor só aplica uma condição por acerto, e `envenenado` é a
        // que mantém o encontro jogável: inconsciente num personagem de 3º
        // nível por um dardo de 1d6 encerra a luta na primeira rodada.
        onHit: { save: 'con', dc: 13, condition: 'envenenado', note: 'fica envenenado pelo dardo' },
      },
    ],
    // O Manual dos Monstros do dono (pt-BR): Ataques Múltiplos, dois golpes de
    // espada curta.
    multiattack: { count: 2, sequence: ['Espada curta', 'Espada curta'] },
    // A figura troca de folha com a arma: a besta de mao quando atira.
    aparencias: { 'Besta de mão': 'drow@camisaoDeMalha-bestaDeMao' },
    // CONJURAÇÃO INATA (CAR, CD 11): globos de luz à vontade; escuridão e fogo
    // das fadas 3/dia cada. Os 3/dia viram espaços (3 de 1º para o fogo, 3 de
    // 2º para a escuridão). A IA abre com o Fogo das Fadas em grupo de heróis
    // (`rules/ai.js`); a Escuridão fica na ficha, sem a IA usar.
    spellcasting: {
      ability: 'cha',
      cantrips: ['luzesDancantes'],
      prepared: ['fogoDasFadas', 'escuridao'],
      slots: [0, 3, 3],
      inata: true,
      noMotor: true,
    },
    traits: ['ascendenciaFeerica', 'conjuracaoInataDrow', 'sensibilidadeALuzSolar'],
    blurb: 'Atira dardos envenenados de 9 m e dá desvantagem ao grupo inteiro com o veneno; sob luz do sol, porém, ele é que ataca com desvantagem — lute no claro e o drow vira o mais fraco do bando.',
  },

  ogro: {
    id: 'ogro',
    name: 'Ogro',
    look: 'ogro',
    fonte: 'SRD',
    size: 'grande',
    level: 3,
    cr: '2',
    xp: 450,
    abilities: { str: 19, dex: 8, con: 16, int: 5, wis: 7, cha: 7 },
    voice: 'gruntOgre',
    ac: 11,
    acNote: 'armadura de peles',
    maxHp: 59,
    hpDice: '7d10+21',
    speedFt: 40,
    senses: { darkvisionFt: 60 },
    attacks: [
      { name: 'Clava grande', bonus: 6, damage: '2d8+4', type: 'concussão', reachFt: 5, art: 'mace' },
      { name: 'Azagaia', bonus: 6, damage: '2d6+4', type: 'perfurante', ranged: true, rangeFt: 30, longRangeFt: 120, art: 'javelin' },
    ],
    blurb: 'Um golpe só, de 13 de dano médio, que leva metade dos PV de qualquer personagem de 3º nível: CA 11 faz dele alvo fácil, então a conta é se o grupo o derruba antes do segundo turno dele.',
  },

};

/**
 * Traços novos desta família, somados ao dicionário geral.
 *
 * Os ids estão em português porque o domínio é do jogo — mesma escolha de
 * `monsters/goblinoides.js`. `packTactics` NÃO está aqui: já existe no
 * dicionário base e é um dos três traços que `combat.js` realmente resolve, e
 * é por isso que o rufião usa aquele id em vez de um novo.
 *
 * Os demais são texto de ficha: o motor ainda não tem gancho para reação de
 * aparar, ação astuta nem sensibilidade à luz. Estão no relatório.
 */
export const TRAITS = {
  conjuracaoInataDrow: {
    name: 'Conjuração Inata',
    desc: 'Carisma, CD 11. À vontade: globos de luz. 3/dia cada: escuridão e fogo das fadas.',
  },
  agressivo: {
    name: 'Agressivo',
    desc: 'Ação bônus: anda até o seu deslocamento em direção a um inimigo.',
  },
  aparar: {
    name: 'Aparar',
    desc: 'Reação: sabendo que o ataque vem, soma +2 à CA contra um ataque corpo a corpo por rodada.',
  },
  devocaoSombria: {
    name: 'Devoção Sombria',
    desc: 'Vantagem em resistências contra ficar amedrontado ou enfeitiçado.',
  },
  bravura: {
    name: 'Bravura',
    desc: 'Vantagem em resistências contra ficar amedrontado.',
  },
  lideranca: {
    name: 'Liderança',
    desc: 'Uma vez por descanso: um aliado a até 9 m soma 1d4 em ataques e resistências por um minuto.',
  },
  acaoAstuta: {
    name: 'Ação Astuta',
    desc: 'Correr, Desengajar ou Esconder-se como ação bônus, todo turno.',
  },
  ataqueFurtivo: {
    name: 'Ataque Furtivo',
    desc: 'Uma vez por turno, +2d6 de dano quando tem vantagem ou um aliado colado no alvo.',
  },
  audicaoEVisaoApuradas: {
    name: 'Audição e Visão Apuradas',
    desc: 'Vantagem em testes de Percepção que dependam de ouvir ou ver.',
  },
  eminenciaDivina: {
    name: 'Eminência Divina',
    desc: 'Gastando um espaço de magia, o próximo golpe dele leva +3d6 de dano radiante.',
  },
  cajadoDeDefesa: {
    name: 'Cajado de Defesa',
    desc: '+1 na CA enquanto o segura. Tem 10 cargas: Armadura Arcana gasta 1, Escudo Arcano gasta 2 (a reação contra um golpe que ia acertar).',
  },
  conjuracao: {
    name: 'Conjuração',
    desc: 'Lança magias preparadas gastando espaços; dano nele pode quebrar a concentração.',
  },
  ascendenciaFeerica: {
    name: 'Ascendência Feérica',
    desc: 'Vantagem contra ficar encantado e não pode ser posto para dormir por magia.',
  },
  sensibilidadeALuzSolar: {
    name: 'Sensibilidade à Luz Solar',
    desc: 'Sob luz do sol: desvantagem em ataques e em testes de Percepção pela visão.',
  },
};
