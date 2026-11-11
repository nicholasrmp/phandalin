// Goblinoides: goblin, hobgoblin, bugbear e os chefes nomeados da campanha.
// SRD 5.1 (CC-BY-4.0) — ver NOTICE.md e ELENCO.md.
//
// Regra dura: nada aqui pode ser bloco de monstro que não esteja no SRD. Se a
// criatura é do módulo publicado e não está no SRD, ela vira criatura NOSSA,
// com nome e números nossos, marcada `fonte: 'propria'`. Chutar atribuição de
// SRD num bloco que não é SRD é o pior erro possível neste projeto.
//
// CHEFES NOMEADOS
//   O nome de um personagem do módulo é fan content e pode ser usado; o bloco
//   dele sai do SRD. Então Klarg, Yeemik e Droop são o bloco do SRD com NOME e
//   LOOK próprios, sem um número inventado — o que os separa no tabuleiro é a
//   silhueta, não a ficha. A única exceção é o Rei Grol, que é o chefe final
//   desta linha da campanha: nenhum bloco de ND 1 do SRD aguenta esse papel
//   contra quatro personagens de 3º nível, então ele é criatura NOSSA e está
//   marcado assim.
//
// `fonte` é documentação de licença, não dado de jogo: `makeMonster` não a
// copia para o combatente. Ela existe para auditoria do contrato do elenco.
//
// `TRAITS` deste arquivo é somado ao dicionário de traços em `../monsters.js`.

export const GOBLINOIDES = {

  goblin: {
    id: 'goblin',
    name: 'Goblin',
    look: 'goblin',
    fonte: 'SRD',
    size: 'pequeno',
    level: 1,
    cr: '1/4',
    xp: 50,
    abilities: { str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8 },
    voice: 'yellGoblin',
    ac: 15,
    acNote: 'armadura de couro, escudo',
    maxHp: 7,
    hpDice: '2d6',
    speedFt: 30,
    senses: { darkvisionFt: 60 },
    skills: ['furtividade'],
    // Furtividade +6 no SRD. Proficiência só dá +4 (DES +2, prof +2); o +6
    // é especialização. Com só `skills` o motor calculava +4 — e isso
    // passou despercebido enquanto nada usava Furtividade. A emboscada usa.
    expertise: ['furtividade'],
    attacks: [
      { name: 'Cimitarra', bonus: 4, damage: '1d6+2', type: 'cortante', reachFt: 5, art: 'sword' },
      { name: 'Arco curto', bonus: 4, damage: '1d6+2', type: 'perfurante', ranged: true, rangeFt: 80, longRangeFt: 320, art: 'bow' },
    ],
    traits: ['nimbleEscape'],
    // UM GOBLIN SÓ, com as duas armas do bloco do SRD. A IA escolhe o ataque
    // pela situação (`ai.js`: terreno alto e à distância atira, colado bate) e
    // a figura troca de folha com a arma do golpe: espada e escudo (a padrão)
    // ou arco (`aparencias`, lido em `resolveAttack`). A CA é 15 nas duas: o
    // bloco do SRD não muda com a arma, e vestir ou tirar escudo custa uma
    // ação no livro. Trocar de arma é a interação gratuita do turno, uma por
    // turno (`armaNaMao`, em `combat.js`). Quem nasce atirador leva
    // `{ tatica: 'atirador', arma: 'Arco curto' }` em `makeMonster`.
    aparencias: { 'Arco curto': 'goblin@couro-arcoCurto' },
    // Só o goblin troca de arma como interação gratuita: o dragão e o hobgoblin
    // também têm `aparencias`, mas golpeiam com mais de um ataque por turno.
    trocaDeArma: true,
    // O blurb diz o que a criatura FAZ no turno, não o que ela é: é por ele
    // que o jogador decide se persegue ou se ignora.
    blurb: 'Espada e escudo de perto, arco de longe: troca de arma de graça, uma vez por turno. Com Escapada Ágil se afasta sem dar ataque de oportunidade. Sete PV — morre de um golpe bom.',
  },

  goblinChefe: {
    id: 'goblinChefe',
    name: 'Chefe Goblin',
    look: 'goblinBoss',
    // O Chefe Goblin NÃO está no SRD 5.1, e este bloco não é derivado do
    // goblin: são os números e os traços do Chefe Goblin do Livro dos Monstros
    // (2014) — CA 17, 21 PV, dois ataques, Escapada Ágil e Redirecionar
    // Ataque. Estava marcado 'propria', o que não era verdade. O nome e a arte
    // continuam nossos, como no Vigia Ciclópico.
    fonte: 'MM',
    size: 'pequeno',
    level: 3,
    cr: '1',
    xp: 200,
    abilities: { str: 10, dex: 14, con: 10, int: 10, wis: 8, cha: 10 },
    voice: 'yellGoblin',
    ac: 17,
    acNote: 'camisão de malha, escudo',
    maxHp: 21,
    hpDice: '6d6',
    speedFt: 30,
    senses: { darkvisionFt: 60 },
    skills: ['furtividade'],
    expertise: ['furtividade'],
    attacks: [
      { name: 'Cimitarra', bonus: 4, damage: '1d6+2', type: 'cortante', reachFt: 5, art: 'sword' },
      // A AZAGAIA É DE FORÇA, e a do chefe é 10: +2 e 1d6, como no livro. Estava +4 e 1d6+2, os números da
      // cimitarra, que é de acuidade. Achado ao montar o arqueiro do Obelisco, que é este bloco com arco.
      { name: 'Azagaia', bonus: 2, damage: '1d6', type: 'perfurante', ranged: true, rangeFt: 30, longRangeFt: 120, art: 'javelin' },
    ],
    // Dois ataques DE CIMITARRA; o segundo com desvantagem. Sem a sequência, o motor dava duas azagaias também.
    multiattack: { count: 2, sequence: ['Cimitarra', 'Cimitarra'], secondAtDisadvantage: true },
    traits: ['nimbleEscape', 'redirectAttack'],
    blurb: 'Dois ataques por turno e, de reação, troca de lugar com um goblin ao lado para o golpe acertar o capanga. Mate o capanga primeiro e a reação dele morre.',
  },

  // OS GOBLINS PSÍQUICOS DOS SAWPLEE (o Obelisco, capítulo 5): goblins de um clã que vive há gerações no posto que os
  // devoradores de mente tomaram, e que herdou o que eles deixaram na cabeça. Aberrações goblinoides, resistentes a
  // psíquico, com telepatia; os dois explodem ao morrer (`explosaoMental`) e têm vantagem contra encanto e medo
  // (`fortitudeMental`).
  goblinPsiLutador: {
    id: 'goblinPsiLutador',
    name: 'Goblin Psíquico Lutador',
    look: 'goblin',
    fonte: 'PaBTSO',
    tipo: 'aberração',
    size: 'pequeno',
    level: 4,
    cr: '2',
    xp: 450,
    abilities: { str: 9, dex: 17, con: 12, int: 16, wis: 15, cha: 10 },
    voice: 'yellGoblin',
    ac: 15,
    acNote: 'couro batido',
    maxHp: 31,
    hpDice: '7d6+7',
    speedFt: 30,
    senses: { darkvisionFt: 60 },
    saves: ['int', 'wis'],
    skills: ['furtividade'],
    expertise: ['furtividade'],
    resist: ['psíquico'],
    attacks: [
      // Golpe desarmado com a mente por trás: 1d4+3 de concussão e mais 1d6 psíquico.
      { name: 'Golpe Desarmado', bonus: 5, damage: '1d4+3', type: 'concussão', reachFt: 5, art: 'mace', danoExtra: { damage: '1d6', type: 'psíquico' } },
    ],
    multiattack: { count: 2 },
    explosaoMental: { dano: '2d4', cd: 13 },
    traits: ['nimbleEscape', 'explosaoMental', 'fortitudeMental', 'empurraoTelecinetico'],
    blurb: 'Dois socos carregados de mente. De ação bônus, derruba quem vê a 9 m (Força CD 13) ou some (Escapada Ágil). Ao morrer, explode: Inteligência CD 13 ou 2d4 psíquicos em quem está colado.',
  },

  goblinPsiComandante: {
    id: 'goblinPsiComandante',
    name: 'Goblin Psíquico Comandante',
    look: 'goblinBoss',
    fonte: 'PaBTSO',
    tipo: 'aberração',
    size: 'pequeno',
    level: 7,
    cr: '4',
    xp: 1100,
    abilities: { str: 12, dex: 19, con: 13, int: 17, wis: 15, cha: 10 },
    voice: 'yellGoblin',
    ac: 16,
    acNote: 'couro batido',
    maxHp: 58,
    hpDice: '13d6+13',
    speedFt: 30,
    senses: { darkvisionFt: 60 },
    saves: ['int', 'wis'],
    skills: ['furtividade'],
    expertise: ['furtividade'],
    resist: ['psíquico'],
    attacks: [
      // A LÂMINA PSÍQUICA: de perto ou a 18 m; quem leva perde 1d4 no próximo ataque ou resistência.
      { name: 'Lâmina Psíquica', bonus: 6, damage: '2d6+4', type: 'psíquico', reachFt: 5, art: 'sword', magico: true,
        onHit: { semResistencia: true, condition: 'laminaPsiquica', rounds: 1, note: 'perde 1d4 no próximo ataque ou resistência' } },
      { name: 'Lâmina Psíquica (longe)', bonus: 6, damage: '2d6+4', type: 'psíquico', ranged: true, rangeFt: 60, longRangeFt: 60, art: 'sword', magico: true,
        onHit: { semResistencia: true, condition: 'laminaPsiquica', rounds: 1, note: 'perde 1d4 no próximo ataque ou resistência' } },
    ],
    multiattack: { count: 3 },
    explosaoMental: { dano: '4d4', cd: 13 },
    // A psiônica do livro: Mão Mágica e Ilusão Menor à vontade; uma vez por dia cada, Enfeitiçar Pessoa, Sussurros
    // Dissonantes e Telecinese (`ai.js psionicaDoComandante`; a Telecinese é `combat.js telecinese`). CD 13, Inteligência.
    spellcasting: {
      ability: 'int', cantrips: ['maoMagica', 'ilusaoMenor'], prepared: ['enfeiticarPessoa', 'sussurrosDissonantes'], slots: [],
      porDia: { enfeiticarPessoa: 1, sussurrosDissonantes: 1 }, cdPorMagia: { enfeiticarPessoa: 13, sussurrosDissonantes: 13 },
      inataPsionica: true, noMotor: true,
    },
    traits: ['nimbleEscape', 'explosaoMental', 'fortitudeMental', 'escudoPsionico', 'rasgoSinaptico', 'psionicaDoComandante'],
    blurb: 'Três Lâminas Psíquicas de perto ou a 18 m (quem leva perde 1d4 no próximo d20). Recarga 5–6: Rasgo Sináptico, esfera de 9 m que incapacita quem falha em Inteligência CD 13. De reação, +3 de CA num aliado a 4,5 m. Explode ao morrer (4d4).',
  },

  // RUXITHID, O ESCOLHIDO (o Obelisco, capítulo 5): o chefe dos Sawplee, com um cristal cravado no crânio por onde os
  // "deuses" falam. Paira, bate com a cimitarra carregada de mente, fura o cérebro de alguém com os Tentáculos
  // Cerebrais e manda um aliado bater de reação (`comandoDeCombate`). Resistência Lendária 2/dia.
  ruxithid: {
    id: 'ruxithid',
    name: 'Ruxithid, o Escolhido',
    look: 'ruxithid',
    fonte: 'PaBTSO',
    tipo: 'aberração',
    size: 'médio',
    level: 8,
    cr: '5',
    xp: 1800,
    abilities: { str: 14, dex: 19, con: 12, int: 18, wis: 15, cha: 12 },
    voice: 'yellGoblin',
    ac: 15,
    acNote: 'camisão de malha',
    maxHp: 88,
    hpDice: '16d8+16',
    speedFt: 30,
    speeds: { walkFt: 30, flyFt: 30 },
    hover: true,
    senses: { darkvisionFt: 60 },
    saves: ['int', 'wis'],
    skills: ['intuicao', 'percepcao', 'furtividade'],
    expertise: ['furtividade'],
    resist: ['psíquico'],
    attacks: [
      { name: 'Cimitarra Psíquica', bonus: 7, damage: '2d6+4', type: 'cortante', reachFt: 5, art: 'sword', danoExtra: { damage: '2d6', type: 'psíquico' } },
    ],
    multiattack: { count: 2 },
    recursos: { resistenciaLendaria: 2 },
    traits: ['resistenciaLendaria', 'fortitudeMental', 'tentaculosCerebrais', 'comandoDeCombate'],
    blurb: 'Paira e bate duas vezes com a cimitarra (2d6+4 e 2d6 psíquicos). Ação bônus: Tentáculos Cerebrais (Destreza CD 15 ou atordoado) ou manda um aliado bater. Passa em duas resistências que falharia.',
  },

  // O CASTELO, C3: dois em cada posto de arqueiros. É o Chefe Goblin com arco curto no lugar da azagaia — o
  // Obelisco o criou assim, e o resto do bloco é o mesmo.
  chefeGoblinArqueiro: {
    id: 'chefeGoblinArqueiro',
    name: 'Chefe Goblin Arqueiro',
    look: 'goblinBoss',
    fonte: 'PaBTSO',
    size: 'pequeno',
    level: 3,
    cr: '1',
    xp: 200,
    abilities: { str: 10, dex: 14, con: 10, int: 10, wis: 8, cha: 10 },
    voice: 'yellGoblin',
    ac: 17,
    acNote: 'camisão de malha, escudo',
    maxHp: 21,
    hpDice: '6d6',
    speedFt: 30,
    senses: { darkvisionFt: 60 },
    skills: ['furtividade'],
    expertise: ['furtividade'],
    tatica: 'atirador',
    attacks: [
      { name: 'Arco curto', bonus: 4, damage: '1d6+2', type: 'perfurante', ranged: true, rangeFt: 80, longRangeFt: 320, art: 'bow' },
      { name: 'Cimitarra', bonus: 4, damage: '1d6+2', type: 'cortante', reachFt: 5, art: 'sword' },
    ],
    // Os dois golpes são de cimitarra; o arco atira uma vez por turno.
    multiattack: { count: 2, sequence: ['Cimitarra', 'Cimitarra'], secondAtDisadvantage: true },
    traits: ['nimbleEscape', 'redirectAttack'],
    blurb: 'O chefe goblin de arco: atira de longe, troca de lugar com o capanga quando é mirado, e de perto ainda tem a cimitarra duas vezes.',
  },

  hobgoblin: {
    id: 'hobgoblin',
    name: 'Hobgoblin',
    look: 'hobgoblin',
    fonte: 'SRD',
    size: 'médio',
    level: 2,
    cr: '1/2',
    xp: 100,
    abilities: { str: 13, dex: 12, con: 12, int: 10, wis: 10, cha: 9 },
    ac: 18,
    acNote: 'cota de malha, escudo',
    maxHp: 11,
    hpDice: '2d8+2',
    speedFt: 30,
    senses: { darkvisionFt: 60 },
    attacks: [
      { name: 'Espada longa', bonus: 3, damage: '1d8+1', type: 'cortante', reachFt: 5, art: 'sword' },
      { name: 'Arco longo', bonus: 3, damage: '1d8+1', type: 'perfurante', ranged: true, rangeFt: 150, longRangeFt: 600, art: 'bow' },
    ],
    traits: ['martialAdvantage'],
    // A figura troca de folha com a arma: de espada e escudo (a padrão) e,
    // quando atira, com o arco na mão (`attackAction` em `rules/combat.js`).
    aparencias: { 'Arco longo': 'hobgoblin@cotaDeMalha-arcoLongo' },
    blurb: 'CA 18, espada e escudo de perto e arco longo de longe. Vantagem Marcial: +2d6 se um aliado dele estiver colado no seu alvo. Pune quem se amontoa.',
  },

  bugbear: {
    id: 'bugbear',
    name: 'Bugbear',
    look: 'bugbear',
    fonte: 'SRD',
    size: 'médio',
    level: 3,
    cr: '1',
    xp: 200,
    abilities: { str: 15, dex: 14, con: 13, int: 8, wis: 11, cha: 9 },
    voice: 'gruntOgre',
    ac: 16,
    acNote: 'armadura de peles, escudo',
    maxHp: 27,
    hpDice: '5d8+5',
    speedFt: 30,
    senses: { darkvisionFt: 60 },
    skills: ['furtividade', 'sobrevivencia'],
    expertise: ['furtividade'],
    attacks: [
      // O 2d8 da clava e o 2d6 da azagaia em corpo a corpo JÁ SÃO Brutamontes
      // (um dado extra de dano), como o bloco do SRD os escreve. Quem somar o
      // traço outra vez no motor dobra o dano do bugbear.
      { name: 'Clava com cravos', bonus: 4, damage: '2d8+2', type: 'perfurante', reachFt: 5, art: 'mace' },
      { name: 'Azagaia', bonus: 4, damage: '2d6+2', type: 'perfurante', reachFt: 5, art: 'javelin' },
      { name: 'Azagaia arremessada', bonus: 4, damage: '1d6+2', type: 'perfurante', ranged: true, rangeFt: 30, longRangeFt: 120, art: 'javelin' },
    ],
    traits: ['brutamontes', 'ataqueSurpresa'],
    blurb: '2d8+2 num golpe só: é o inimigo que abre o grupo pelo meio e mata um conjurador de 11 PV em uma rodada. Não deixe o mago na linha de frente dele.',
  },

  // --- chefes nomeados da campanha -----------------------------------------
  // Mesmo bloco, nome e look próprios. Fan Content Policy: só o nome e o papel.

  klarg: {
    id: 'klarg',
    name: 'Klarg',
    look: 'klarg',
    fonte: 'SRD',               // bloco do bugbear do SRD, sem um número mudado
    size: 'médio',
    level: 3,
    cr: '1',
    xp: 200,
    abilities: { str: 15, dex: 14, con: 13, int: 8, wis: 11, cha: 9 },
    voice: 'gruntOgre',
    ac: 16,
    acNote: 'armadura de peles, escudo',
    maxHp: 27,
    hpDice: '5d8+5',
    speedFt: 30,
    senses: { darkvisionFt: 60 },
    skills: ['furtividade', 'sobrevivencia'],
    expertise: ['furtividade'],
    attacks: [
      { name: 'Clava com cravos', bonus: 4, damage: '2d8+2', type: 'perfurante', reachFt: 5, art: 'mace' },
      { name: 'Azagaia', bonus: 4, damage: '2d6+2', type: 'perfurante', reachFt: 5, art: 'javelin' },
    ],
    traits: ['brutamontes', 'ataqueSurpresa'],
    blurb: 'O primeiro bugbear que o grupo encontra: espera na emboscada, abre com Ataque Surpresa e concentra tudo em quem entrou primeiro na caverna.',
  },

  // Sem `hpDice`: os 45 PV do Rei Grol não fecham com nenhum número inteiro de
  // dados de vida (d8 com Constituição 13 rende 5,5 por dado). É número
  // escolhido, não rolado, e inventar um dado aqui seria mentir na ficha.
  reiGrol: {
    id: 'reiGrol',
    name: 'Rei Grol',
    look: 'reiGrol',
    // O BUGBEAR DA AVENTURA: o bloco do SRD com os PONTOS DE VIDA DO LIVRO.
    // A aventura dá a ele 45 PV, por ser velho e bravo (pág. 40), e não os 27
    // de um bugbear comum. O resto — CA 16, a
    // clava de 2d8+2 com Brutamontes, o Ataque Surpresa — é o bloco do SRD,
    // sem reforço nosso: já tentamos um chefe inventado (duas machadadas e um
    // grito de guerra) e isso levava o quarto de 1.900 para 2.900 de XP
    // ajustado, pagando os 950 do livro.
    //
    // Por isso NÃO é 'SRD', como estava: o bugbear do SRD tem 27 PV e clava
    // perfurante, e este tem 45 e machado cortante. Dois números mudados é
    // bloco nosso pela regra do próprio arquivo, e o cabeçalho já dizia isso
    // — era o campo que contradizia. Os 45 PV não fecham com dado nenhum
    // (d8 com Constituição 13 rende 5,5 por dado), então é número escolhido e
    // fica sem `hpDice`, como o Brughor.
    fonte: 'propria',
    size: 'médio',
    level: 3,
    cr: '1',
    xp: 200,
    abilities: { str: 15, dex: 14, con: 13, int: 8, wis: 11, cha: 9 },
    voice: 'gruntOgre',
    ac: 16,
    acNote: 'armadura de peles, escudo',
    maxHp: 45,
    speedFt: 30,
    senses: { darkvisionFt: 60 },
    skills: ['furtividade', 'sobrevivencia'],
    expertise: ['furtividade'],
    attacks: [
      // O dado a mais já é Brutamontes, como o bloco do SRD o escreve.
      { name: 'Machado do rei', bonus: 4, damage: '2d8+2', type: 'cortante', reachFt: 5, art: 'axe' },
      { name: 'Azagaia', bonus: 4, damage: '2d6+2', type: 'perfurante', reachFt: 5, art: 'javelin' },
      { name: 'Azagaia arremessada', bonus: 4, damage: '1d6+2', type: 'perfurante', ranged: true, rangeFt: 30, longRangeFt: 120, art: 'javelin' },
    ],
    traits: ['brutamontes', 'ataqueSurpresa'],
    blurb: 'O rei goblin é um bugbear: 2d8+2 num golpe só, e a emboscada dele soma 2d6. Quem segura o machado dele é quem tem a melhor armadura.',
  },


  yeemik: {
    id: 'yeemik',
    name: 'Yeemik',
    look: 'yeemik',
    // Mesmo bloco do Chefe Goblin, e pela mesma razão ele é 'MM' e não
    // 'propria': os números vêm do Livro dos Monstros (2014). É o papel dele
    // no módulo — o segundo em comando que quer o posto do chefe —, e
    // Redirecionar Ataque é exatamente "empurra o subordinado na frente do
    // golpe". Quem jogar com 12 PV (o que `encounter.js` força no esconderijo)
    // está jogando com um bloco mais fraco que este.
    fonte: 'MM',
    size: 'pequeno',
    level: 3,
    cr: '1',
    xp: 200,
    abilities: { str: 10, dex: 14, con: 10, int: 10, wis: 8, cha: 10 },
    voice: 'yellGoblin',
    ac: 17,
    acNote: 'camisão de malha, escudo',
    maxHp: 21,
    hpDice: '6d6',
    speedFt: 30,
    senses: { darkvisionFt: 60 },
    skills: ['furtividade'],
    expertise: ['furtividade'],
    attacks: [
      { name: 'Punhal', bonus: 4, damage: '1d4+2', type: 'perfurante', reachFt: 5, art: 'dagger' },
      // A azagaia é de Força (10): +2 e 1d6, como a do Chefe Goblin — o mesmo engano estava nos dois blocos.
      { name: 'Azagaia', bonus: 2, damage: '1d6', type: 'perfurante', ranged: true, rangeFt: 30, longRangeFt: 120, art: 'javelin' },
    ],
    // Os dois golpes são de lâmina; a azagaia vai uma vez por turno.
    multiattack: { count: 2, sequence: ['Punhal', 'Punhal'], secondAtDisadvantage: true },
    traits: ['nimbleEscape', 'redirectAttack'],
    blurb: 'Fica atrás dos capangas e empurra um deles para receber o golpe que era dele. Chegue até ele por fora do bando, ou nenhum dano o alcança.',
  },

  droop: {
    id: 'droop',
    name: 'Droop',
    look: 'droop',
    fonte: 'SRD',               // bloco do goblin do SRD, sem um número mudado
    size: 'pequeno',
    level: 1,
    cr: '1/4',
    xp: 50,
    abilities: { str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8 },
    voice: 'yellGoblin',
    ac: 15,
    acNote: 'armadura de couro, escudo',
    maxHp: 7,
    hpDice: '2d6',
    speedFt: 30,
    senses: { darkvisionFt: 60 },
    skills: ['furtividade'],
    expertise: ['furtividade'],
    attacks: [
      { name: 'Cimitarra', bonus: 4, damage: '1d6+2', type: 'cortante', reachFt: 5, art: 'sword' },
    ],
    traits: ['nimbleEscape'],
    blurb: 'Carrega o fardo do bando e luta mal: usa Escapada Ágil para fugir do corpo a corpo em vez de trocar golpes. Vale mais vivo, falando, que morto.',
  },

};

/** Traços novos desta família, somados ao dicionário geral. */
export const TRAITS = {
  psionicaDoComandante: {
    name: 'Psiônica',
    desc: 'Mão Mágica e Ilusão Menor à vontade; uma vez por dia cada, Enfeitiçar Pessoa, Sussurros Dissonantes e Telecinese (Inteligência, CD 13).',
  },
  // Brutamontes está EMBUTIDO nos dados de dano dos ataques (é assim que o
  // bloco do SRD o escreve), então o motor não precisa somar nada. A entrada
  // existe para o HUD explicar ao jogador de onde vem o 2d8.
  brutamontes: {
    name: 'Brutamontes',
    desc: 'Um dado extra de dano em ataque corpo a corpo com arma — já contado nos dados de dano acima.',
  },
  ataqueSurpresa: {
    name: 'Ataque Surpresa',
    desc: 'Se surpreende a criatura e acerta na primeira rodada, +2d6 de dano.',
  },
};
