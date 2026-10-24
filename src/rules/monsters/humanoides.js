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
      prepared: ['misselMagico', 'maosFlamejantes', 'sono'],
      slots: [0, 4, 3, 3, 3, 1],
    },
    traits: ['conjuracao'],
    blurb: 'Abre com Sono para tirar dois personagens da luta sem rolar ataque, depois Mãos Flamejantes em quem se amontoar; 40 PV e CA 12 significam que o grupo tem uma rodada para alcançá-lo.',
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
    speedFt: 30,
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
    traits: ['ascendenciaFeerica', 'sensibilidadeALuzSolar'],
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
    ac: 11,
    acNote: 'armadura de peles',
    maxHp: 59,
    speedFt: 40,
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
  aparar: {
    name: 'Aparar',
    desc: 'Reação: sabendo que o ataque vem, soma +2 à CA contra um ataque corpo a corpo por rodada.',
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
