// AS CRIATURAS DO CAPÍTULO 7 DO OBELISCO, "Fendas na Realidade": a vila infectada, o túnel até Illithinoch, a fortaleza
// dos devoradores de mentes e as três fendas para o Reino Distante.
//
// Os blocos são do Obelisco, lidos do 5e.tools, e o texto é nosso. Feitos à mão e não pelo importador porque cinco deles
// são CÓPIA de um bloco do Livro dos Monstros com uma troca (o importador pula `_copy`) e quatro têm ação bônus (que ele
// não lê). Quem já existia no jogo (o grell, o behir, a boca tagarela, o devorador de mentes, os slaadi, o nothic, o
// quaggoth...) não está aqui.
//
// O QUE O MOTOR EXECUTA, e onde (cada um com prova em `testes-obelisco7.mjs`):
//   - a ação bônus de bloco (`acoesEspeciais` com `bonus: true`, `combat.js acaoEspecialPronta`, `ai.js
//     bonusEspecialNoTurno`): o Gemido e as Duplicatas do cloaker mutante, a Distorção do Vazio do zelote, o Consumir da
//     fusão de carne;
//   - a aura do dono com teste (`aura.save`): a Aura da Morte da fusão de carne; a que pega quem começa o turno perto e
//     fere (`aura.damage` em `inicioDoAlvo`, com `poupaTipo`): a Forma Aberrante do zelote;
//   - o golpe que pesa mais contra o amedrontado (`danoSeCondicao`): o Contato Terrível da ocular;
//   - o golpe que cura quem bate (`curaNoAcerto`): o Toque Gélido do Oshundo;
//   - o puxão de 4,5 m em quem a mordida agarra (`puxa: 15`, `puxaSeAgarrado`): a fusão de carne;
//   - os quatro agarrados de uma vez, cada um apertado no começo do próprio turno (`maxAgarrados`, `danoPorTurno`): o
//     cérebro ancião;
//   - a reação que fere quem a fere (`repreensao`): a ocular;
//   - Negar Magia (`negarMagia`, `combat.js negarMagia`): o Oshundo;
//   - duas opções da mesma recarga (`recargaDe`): o Choro e o Olhar Fulminante da ocular;
//   - envenenado que não se cura (`semCuraJunto`): o Golpe de Cadáver.
//
// DE FORA, dito: o Vínculo Psíquico e o Sentido de Criaturas do cérebro ancião (são da cena de Illithinoch, que sabe onde
// o grupo está, e não da luta); o Portal Arcano do zelote (o jogo não tem a magia); a Mão Mágica invisível do grell
// psíquico e a Telepatia de todos (não mudam a luta); a vantagem na iniciativa do profeta e da ocular (a iniciativa
// aqui é por lado).

import { LIVRO_MM } from './livro-mm.js';
import { ABERRACOES } from './aberracoes.js';

const berserker = LIVRO_MM.berserker;
const nothic = ABERRACOES.vigiaCiclopico;
const doninha = LIVRO_MM.doninha;

export const OBELISCO7 = {
  // A briga no Santuário da Sorte: Garaele, Halia e Ander, tomados pelo que vazou dos cacos do obelisco. O berserker com
  // a Pancada Psíquica no lugar do machado. O livro os quer VIVOS: a cena pede o golpe não letal.
  moradorInfectado: {
    ...berserker,
    id: 'moradorInfectado',
    name: 'Morador Infectado',
    nomeOriginal: 'Infected Townsperson',
    fonte: 'PaBTSO',
    acNote: 'roupa de trabalho e fúria',
    attacks: [
      { name: 'Pancada Psíquica', bonus: 5, damage: '1d6+3', type: 'concussão', reachFt: 5, art: 'fist',
        danoExtra: { damage: '1d6', type: 'psíquico' } },
    ],
    blurb: 'Um morador da vila que passou tempo demais perto dos cacos do obelisco. Bate sem cuidado, com a força de quem não sente mais dor, e cada pancada vem com um choque na mente.',
    lore: null,
  },

  // J7: o grell que aprendeu a pensar. Voa, se esconde no teto, e tem Confusão e Medo uma vez por dia.
  grellPsiquico: {
    id: 'grellPsiquico',
    tipo: 'aberração',
    name: 'Grell Psíquico',
    nomeOriginal: 'Grell Psychic',
    fonte: 'PaBTSO',
    size: 'médio',
    level: 5,
    cr: '4',
    xp: 1100,
    abilities: { str: 17, dex: 14, con: 13, int: 12, wis: 11, cha: 14 },
    ac: 15,
    acNote: 'com Armadura Arcana',
    maxHp: 66,
    hpDice: '12d8+12',
    speedFt: 10,
    flyFt: 30,
    hover: true,
    speeds: { walkFt: 10, flyFt: 30 },
    senses: { blindsightFt: 60, passivePerception: 14 },
    skills: ['percepcao', 'furtividade'],
    expertise: ['percepcao', 'furtividade'],
    attacks: [
      {
        name: 'Tentáculo', bonus: 5, damage: '1d10+3', type: 'perfurante', reachFt: 10, art: 'claw',
        onHit: [
          // envenenado, e o envenenado pelo grell fica paralisado: é a paralisia que entra (como no grell)
          { save: 'con', dc: 11, condition: 'paralisado', rounds: 10, repete: true, note: 'o veneno dos tentáculos trava o corpo' },
          { semResistencia: true, dc: 16, escape: 16, condition: 'contido', note: 'é agarrado pelos tentáculos' },
        ],
      },
      { name: 'Bico', bonus: 5, damage: '3d4+3', type: 'perfurante', reachFt: 5, art: 'bite' },
    ],
    multiattack: { count: 2, sequence: ['Tentáculo', 'Bico'] },
    spellcasting: {
      ability: 'cha', cantrips: [], slots: [],
      prepared: ['confusao', 'medo', 'detectarPensamentos'],
      porDia: { confusao: 1, medo: 1 },
      aVontade: ['detectarPensamentos'],
      cdPorMagia: { confusao: 12, medo: 12, detectarPensamentos: 12 },
      noMotor: true, conjuraNoTurno: 'geral',
    },
    damageImmunities: ['elétrico'],
    conditionImmunities: ['cego', 'caido'],
    traits: ['carregaAgarrados'],
    blurb: 'Um grell que pensa: voa baixo, se esconde no teto da caverna e solta Confusão e Medo antes de descer. Os tentáculos paralisam e agarram, como os dos outros.',
  },

  // J9: o que as bocas tagarelas viram quando se fundiram — a carne inteira da gruta, com dentes por toda parte.
  fusaoDeCarne: {
    id: 'fusaoDeCarne',
    tipo: 'aberração',
    name: 'Fusão de Carne',
    nomeOriginal: 'Flesh Meld',
    fonte: 'PaBTSO',
    size: 'enorme',
    level: 8,
    cr: '7',
    xp: 2900,
    abilities: { str: 21, dex: 14, con: 17, int: 7, wis: 13, cha: 5 },
    ac: 12,
    maxHp: 95,
    hpDice: '10d12+30',
    speedFt: 30,
    speeds: { walkFt: 30, climbFt: 30 },
    senses: { blindsightFt: 60, passivePerception: 11 },
    saves: ['str', 'dex'],
    conditionImmunities: ['cego', 'caido'],
    attacks: [
      { name: 'Mordida', bonus: 8, damage: '2d10+5', type: 'perfurante', reachFt: 30, art: 'bite',
        puxa: 15, puxaSeAgarrado: true,
        onHit: { semResistencia: true, escape: 15, condition: 'agarrado', note: 'é preso pelos dentes',
          imunes: { tamanhos: ['enorme', 'imenso'], motivo: 'grande demais para a boca' } } },
    ],
    multiattack: { count: 2 },
    // A AURA DA MORTE: no começo do turno dela, Constituição CD 15 a 1,5 m, ou 1d6 necrótico e envenenado até o
    // começo do próximo turno dela.
    aura: { quando: 'inicioDoDono', raioFt: 5, save: 'con', dc: 15, damage: '1d6', damageType: 'necrótico', condition: 'envenenado' },
    acoesEspeciais: [
      // CONSUMIR (ação bônus): quem ela já segura a 1,5 m faz Destreza CD 15 ou vai para dentro: cego, preso, 3d6
      // necróticos no começo de cada turno dela; 30 de dano de dentro num turno, Constituição CD 15 ou ela cospe.
      { nome: 'Consumir', bonus: true, tipo: 'engolir', save: 'dex', dc: 15, tamanhoMax: 'large',
        dano: '3d6', tipoDano: 'necrótico', regurgita: { dano: 30, dc: 15 } },
    ],
    traits: ['amorfo', 'resistenciaAMagia'],
    blurb: 'A carne das bocas tagarelas, fundida numa massa do tamanho de uma sala. Morde de 9 m e arrasta quem pega, engole quem chega perto, e quem fica do lado dela apodrece.',
  },

  // J10: o cloaker que o Reino Distante virou do avesso, que move o cadáver do Thorgran Ironquill como um boneco.
  capaNegraMutante: {
    id: 'capaNegraMutante',
    tipo: 'aberração',
    name: 'Capa Negra Mutante',
    nomeOriginal: 'Cloaker Mutate',
    fonte: 'PaBTSO',
    size: 'grande',
    level: 11,
    cr: '10',
    xp: 5900,
    abilities: { str: 19, dex: 15, con: 12, int: 18, wis: 13, cha: 11 },
    ac: 14,
    acNote: 'armadura natural',
    maxHp: 143,
    hpDice: '22d10+22',
    speedFt: 10,
    flyFt: 30,
    speeds: { walkFt: 10, flyFt: 30 },
    senses: { darkvisionFt: 60, passivePerception: 11 },
    skills: ['furtividade'],
    damageResistances: ['necrótico', 'veneno', 'psíquico'],
    conditionImmunities: ['exausto', 'envenenado'],
    attacks: [
      { name: 'Golpe de Cadáver', bonus: 8, damage: '3d10+4', type: 'concussão', reachFt: 5, art: 'fist',
        onHit: { save: 'con', dc: 16, condition: 'envenenado', rounds: 10, semCuraJunto: true,
          note: 'sente a podridão do cadáver entrar no sangue, e a carne para de fechar' } },
      { name: 'Cauda', bonus: 8, damage: '2d8+4', type: 'cortante', reachFt: 10, art: 'claw' },
    ],
    // o Golpe de Cadáver e duas caudas, OU quatro caudas
    multiattack: { count: 3, sequencias: [['Cauda', 'Cauda', 'Cauda', 'Cauda'], ['Golpe de Cadáver', 'Cauda', 'Cauda']] },
    acoesEspeciais: [
      // O GEMIDO PSÍQUICO (ação bônus, recarga 5–6): quem não é aberração, a 18 m, Sabedoria CD 16, ou 5d6 psíquicos e
      // amedrontado até o fim do próximo turno dele.
      { nome: 'Gemido Psíquico', bonus: true, recharge: [5, 6], tipo: 'area', shape: 'raio', areaFt: 60, save: 'wis', dc: 16,
        damage: '5d6', damageType: 'psíquico', halfOnSave: false, condition: 'amedrontado', ateFimDoTurnoDele: true,
        poupaTipo: 'aberração' },
      // as DUPLICATAS (ação bônus): depois do Gemido na lista, para a IA gemer quando ele está pronto e se desdobrar
      // quando não está
      { nome: 'Duplicatas Fantasmagóricas', bonus: true, tipo: 'propria', condition: 'duplicatas',
        texto: 'se desdobra em quatro cópias que giram em volta dele.' },
    ],
    traits: ['evasaoTotal', 'sensibilidadeALuz'],
    blurb: 'Uma capa negra que o Reino Distante virou do avesso. Carrega um cadáver de anão como luva e bate com ele, chicoteia com a cauda de 3 m, geme na mente de todos a 18 m e se desdobra em cópias.',
  },

  // X7: o devorador de mentes morto-vivo, mago, que se cansou dos fanáticos e conversa antes de lutar.
  oshundo: {
    id: 'oshundo',
    tipo: 'morto-vivo',
    name: 'Oshundo',
    nomeOriginal: 'Oshundo the Alhoon',
    fonte: 'PaBTSO',
    size: 'médio',
    level: 11,
    cr: '10',
    xp: 5900,
    abilities: { str: 11, dex: 12, con: 16, int: 19, wis: 17, cha: 17 },
    ac: 15,
    acNote: 'armadura natural',
    maxHp: 150,
    hpDice: '20d8+60',
    speedFt: 30,
    flyFt: 15,
    hover: true,
    speeds: { walkFt: 30, flyFt: 15 },
    senses: { truesightFt: 120, passivePerception: 17 },
    saves: ['con', 'int', 'wis', 'cha'],
    skills: ['arcanismo', 'historia', 'intuicao', 'percepcao', 'furtividade'],
    damageResistances: ['frio', 'elétrico', 'necrótico'],
    damageImmunities: ['veneno'],
    conditionImmunities: ['enfeitiçado', 'exausto', 'amedrontado', 'paralisado', 'envenenado'],
    attacks: [
      { name: 'Toque Gélido', bonus: 8, damage: '4d6', type: 'frio', reachFt: 5, art: 'spell', curaNoAcerto: 14, magico: true },
      { name: 'Rajada Arcana', bonus: 8, damage: '8d6', type: 'energético', ranged: true, rangeFt: 120, longRangeFt: 120, art: 'spell', magico: true },
    ],
    multiattack: { count: 2 },
    spellcasting: {
      ability: 'int', cantrips: [], slots: [],
      prepared: ['dominarMonstro', 'globoDeInvulnerabilidade', 'invisibilidade', 'modificarMemoria', 'viagemPlanar', 'muralhaDeForca', 'detectarMagia', 'detectarPensamentos'],
      porDia: { dominarMonstro: 1, globoDeInvulnerabilidade: 1, invisibilidade: 1, modificarMemoria: 1, viagemPlanar: 1, muralhaDeForca: 1 },
      aVontade: ['detectarMagia', 'detectarPensamentos'],
      cdPorMagia: { dominarMonstro: 16, globoDeInvulnerabilidade: 16, invisibilidade: 16, modificarMemoria: 16, viagemPlanar: 16, muralhaDeForca: 16 },
      noMotor: true, conjuraNoTurno: 'geral',
    },
    acoesEspeciais: [
      { nome: 'Explosão Trovejante', recharge: [5, 6], tipo: 'area', shape: 'cone', areaFt: 60, save: 'int', dc: 16,
        damage: '4d8+4', damageType: 'trovejante', halfOnSave: false, condition: 'atordoado', rounds: 10, repete: true },
    ],
    // NEGAR MAGIA (reação, 3 por dia): magia de até 3º círculo a 18 m falha, e o espaço não se perde
    negarMagia: { usos: 3, circuloMax: 3, alcanceFt: 60 },
    traits: ['resistenciaAMagia'],
    blurb: 'Um devorador de mentes que se fez lich, e que não acredita mais no deus dos fanáticos. Toque gélido que o cura, rajadas arcanas de 8d6, uma onda que atordoa em cone e a mão que anula a magia de quem conjura perto.',
  },

  // X10, X12: o nothic que os devoradores de mentes fizeram, com a Rajada Mental no lugar do olhar que apodrece.
  nothicDevoradorDeMentes: {
    ...nothic,
    id: 'nothicDevoradorDeMentes',
    name: 'Nothic Devorador de Mentes',
    nomeOriginal: 'Mind Flayer Nothic',
    fonte: 'PaBTSO',
    // a ficha do Obelisco, e não a figura do vigia
    look: undefined,
    attacks: nothic.attacks.filter((a) => a.name === 'Garra'),
    // a Rajada Mental: cone de 9 m, Inteligência CD 12, 2d8+1 psíquicos e atordoado até o fim do próximo turno do alvo
    acoesEspeciais: [
      { nome: 'Rajada Mental', recharge: [5, 6], tipo: 'area', shape: 'cone', areaFt: 30, save: 'int', dc: 12,
        damage: '2d8+1', damageType: 'psíquico', halfOnSave: false, condition: 'atordoado', ateFimDoTurnoDoAlvo: true },
    ],
    blurb: 'Um nothic que os devoradores de mentes refizeram para guardar a fortaleza. Duas garras de perto e, no lugar do olhar, uma rajada mental em cone que atordoa.',
  },

  // X11: o humano que o Reino Distante dobrou por dentro. Golpeia de 4,5 m, some num rasgo e arrasta quem estava perto.
  zeloteAberrante: {
    id: 'zeloteAberrante',
    tipo: 'aberração',
    name: 'Zelote Aberrante',
    nomeOriginal: 'Aberrant Zealot',
    fonte: 'PaBTSO',
    size: 'médio',
    level: 9,
    cr: '8',
    xp: 3900,
    abilities: { str: 15, dex: 18, con: 12, int: 13, wis: 8, cha: 19 },
    ac: 16,
    acNote: 'couro batido',
    maxHp: 93,
    hpDice: '17d8+17',
    speedFt: 30,
    senses: { darkvisionFt: 60, truesightFt: 10, passivePerception: 15 },
    saves: ['dex', 'cha'],
    skills: ['percepcao'],
    damageResistances: ['psíquico'],
    conditionImmunities: ['cego', 'enfeitiçado', 'amedrontado', 'agarrado', 'contido'],
    attacks: [
      { name: 'Rasgo Psíquico', bonus: 7, damage: '3d6+4', type: 'psíquico', reachFt: 15, art: 'spell', magico: true,
        onHit: { save: 'wis', dc: 15, condition: 'atordoado', ateInicioDoTurnoDoDono: true, note: 'sente a mente se rasgar' } },
      { name: 'Rasgo Psíquico à Distância', bonus: 7, damage: '3d6+4', type: 'psíquico', ranged: true, rangeFt: 120, longRangeFt: 120, art: 'spell', magico: true,
        onHit: { save: 'wis', dc: 15, condition: 'atordoado', ateInicioDoTurnoDoDono: true, note: 'sente a mente se rasgar' } },
      { name: 'Espada Curta', bonus: 7, damage: '1d6+4', type: 'perfurante', reachFt: 15, art: 'sword',
        danoExtra: { damage: '2d6', type: 'psíquico' } },
    ],
    // um Rasgo e duas Espadas Curtas; de longe, só o Rasgo (as espadas não chegam)
    multiattack: { count: 3, sequencias: [['Rasgo Psíquico', 'Espada Curta', 'Espada Curta'], ['Rasgo Psíquico à Distância']] },
    spellcasting: {
      ability: 'cha', cantrips: [], slots: [],
      prepared: ['fomeDeHadar', 'detectarPensamentos', 'ilusaoMenor'],
      porDia: { fomeDeHadar: 1 },
      aVontade: ['detectarPensamentos', 'ilusaoMenor'],
      cdPorMagia: { fomeDeHadar: 15, detectarPensamentos: 15, ilusaoMenor: 15 },
      noMotor: true, conjuraNoTurno: 'geral',
    },
    // A FORMA ABERRANTE: quem não é aberração e começa o turno a 1,5 m dele, Sabedoria CD 15 ou 2d6 psíquicos
    aura: { quando: 'inicioDoAlvo', raioFt: 5, save: 'wis', dc: 15, damage: '2d6', damageType: 'psíquico', poupaTipo: 'aberração' },
    acoesEspeciais: [
      { nome: 'Distorção do Vazio', bonus: true, recharge: [5, 6], tipo: 'vazio', alcanceFt: 120, raioFt: 30, save: 'str', dc: 15,
        damage: '4d8', damageType: 'energético' },
    ],
    traits: ['amorfo'],
    blurb: 'Um fanático que o Reino Distante dobrou por dentro: estica os braços e golpeia de 4,5 m, rasga a mente de quem acerta, e some num vazio que arrasta todos em volta.',
  },

  // X14: o devorador de mentes que escreve as visões de Ilvaash, com o homúnculo ao lado.
  profetaDevoradorDeMentes: {
    id: 'profetaDevoradorDeMentes',
    tipo: 'aberração',
    name: 'Profeta Devorador de Mentes',
    nomeOriginal: 'Mind Flayer Prophet',
    fonte: 'PaBTSO',
    size: 'médio',
    level: 9,
    cr: '8',
    xp: 3900,
    abilities: { str: 15, dex: 14, con: 14, int: 20, wis: 17, cha: 17 },
    ac: 17,
    acNote: 'armadura natural',
    maxHp: 97,
    hpDice: '15d8+30',
    speedFt: 30,
    senses: { darkvisionFt: 120, passivePerception: 16 },
    saves: ['int', 'wis', 'cha'],
    skills: ['arcanismo', 'intuicao', 'percepcao', 'furtividade'],
    attacks: [
      { name: 'Extrair Cérebro', bonus: 8, damage: '10d10', type: 'perfurante', reachFt: 5, art: 'claw', consome: true,
        exige: 'agarradoAtordoado' },
      { name: 'Tentáculos', bonus: 8, damage: '2d10+5', type: 'psíquico', reachFt: 5, art: 'claw',
        onHit: [
          { semResistencia: true, condition: 'agarrado', escape: 16, note: 'é agarrado pelos tentáculos',
            imunes: { tamanhos: ['grande', 'enorme', 'imenso'], motivo: 'grande demais para os tentáculos' } },
          { save: 'int', dc: 16, condition: 'atordoado', comOAgarrao: true, exigeAgarrado: true, note: 'sente a mente ser apertada' },
        ] },
    ],
    spellcasting: {
      ability: 'int', cantrips: [], slots: [],
      prepared: ['dominarMonstro', 'viagemPlanar', 'visaoDaVerdade', 'detectarMagia', 'detectarPensamentos', 'levitacao'],
      porDia: { dominarMonstro: 1, viagemPlanar: 1, visaoDaVerdade: 1 },
      aVontade: ['detectarMagia', 'detectarPensamentos', 'levitacao'],
      cdPorMagia: { dominarMonstro: 16, viagemPlanar: 16, visaoDaVerdade: 16 },
      noMotor: true, conjuraNoTurno: 'geral',
    },
    acoesEspeciais: [
      // O AÇOITE MENTAL: até dois alvos que ele vê a 18 m, Inteligência CD 16, 4d8+5 psíquicos e atordoado por 1 minuto
      { nome: 'Açoite Mental', recharge: [5, 6], tipo: 'alvo', alcanceFt: 60, alvos: 2, save: 'int', dc: 16,
        damage: '4d8+5', damageType: 'psíquico', halfOnSave: false, condition: 'atordoado', rounds: 10, repete: true },
    ],
    traits: ['resistenciaAMagia', 'sempreAlerta'],
    blurb: 'O devorador de mentes que escreve as visões do deus dos fanáticos. Tentáculos que agarram e atordoam, o cérebro de quem fica preso, e um açoite mental que atordoa dois de uma vez.',
  },

  // X15: o cérebro ancião, doente do Reino Distante, na piscina do fundo da fortaleza. Não sai dela: os tentáculos
  // alcançam 9 m.
  cerebroAnciaoInfectado: {
    id: 'cerebroAnciaoInfectado',
    tipo: 'aberração',
    name: 'Cérebro Ancião Infectado',
    nomeOriginal: 'Infected Elder Brain',
    fonte: 'PaBTSO',
    size: 'grande',
    level: 12,
    cr: '11',
    xp: 7200,
    abilities: { str: 15, dex: 10, con: 20, int: 21, wis: 19, cha: 20 },
    ac: 10,
    maxHp: 189,
    hpDice: '18d10+90',
    speedFt: 5,
    speeds: { walkFt: 5, swimFt: 10 },
    senses: { blindsightFt: 120, passivePerception: 14 },
    saves: ['int', 'wis', 'cha'],
    skills: ['arcanismo', 'intuicao'],
    attacks: [
      { name: 'Tentáculo', bonus: 6, damage: '3d8+2', type: 'concussão', reachFt: 30, art: 'claw',
        onHit: [
          { semResistencia: true, condition: 'agarrado', escape: 14, maxAgarrados: 4, note: 'é enrolado pelo tentáculo',
            imunes: { tamanhos: ['imenso'], motivo: 'grande demais para o tentáculo' } },
          // o APERTO: 1d8+5 psíquicos no começo de cada turno do preso, enquanto o agarrão durar
          { semResistencia: true, condition: 'apertoPsiquico', comOAgarrao: true, exigeAgarrado: true, danoPorTurno: '1d8+5',
            note: 'sente o cérebro se apertar contra o dele' },
        ] },
    ],
    multiattack: { count: 2 },
    spellcasting: {
      ability: 'int', cantrips: [], slots: [],
      prepared: ['detectarPensamentos', 'levitacao'],
      aVontade: ['detectarPensamentos', 'levitacao'],
      cdPorMagia: { detectarPensamentos: 17, levitacao: 17 },
      noMotor: true,
    },
    acoesEspeciais: [
      // A RAJADA MENTAL: as criaturas que ELE escolhe a 18 m, Inteligência CD 17, 5d10+5 e atordoado por 1 minuto
      { nome: 'Rajada Mental', recharge: [5, 6], tipo: 'area', shape: 'raio', areaFt: 60, escolhe: true, save: 'int', dc: 17,
        damage: '5d10+5', damageType: 'psíquico', halfOnSave: false, condition: 'atordoado', rounds: 10, repete: true },
    ],
    traits: ['resistenciaAMagia'],
    blurb: 'O cérebro ancião de Illithinoch, inchado e doente do Reino Distante, numa piscina de salmoura. Não sai dela, e não precisa: os tentáculos alcançam 9 m e seguram quatro de uma vez, e a rajada mental atordoa quem ele quiser.',
  },

  // L7: o globo de olhos que guarda a runa do Labirinto dos Olhos.
  ocular: {
    id: 'ocular',
    tipo: 'aberração',
    name: 'Ocular',
    nomeOriginal: 'Oculorb',
    fonte: 'PaBTSO',
    size: 'grande',
    level: 10,
    cr: '9',
    xp: 5000,
    abilities: { str: 13, dex: 10, con: 17, int: 14, wis: 15, cha: 19 },
    ac: 13,
    acNote: 'armadura natural',
    maxHp: 127,
    hpDice: '15d10+45',
    speedFt: 0,
    flyFt: 60,
    hover: true,
    speeds: { walkFt: 0, flyFt: 60 },
    senses: { truesightFt: 60, passivePerception: 20 },
    saves: ['int', 'wis', 'cha'],
    skills: ['investigacao', 'percepcao'],
    expertise: ['percepcao'],
    conditionImmunities: ['cego', 'caido'],
    attacks: [
      { name: 'Raio Ocular', bonus: 8, damage: '3d6+4', type: 'psíquico', ranged: true, rangeFt: 120, longRangeFt: 120, art: 'spell', magico: true },
      { name: 'Contato Terrível', bonus: 5, damage: '3d6+4', type: 'psíquico', reachFt: 5, art: 'claw',
        danoSeCondicao: { condicao: 'amedrontado', damage: '6d6+4' } },
    ],
    // dois Contatos Terríveis, OU quatro Raios Oculares
    multiattack: { count: 2, porArma: { 'Raio Ocular': 4 } },
    acoesEspeciais: [
      // A TORRENTE ANTIPÁTICA (recarga 5–6), uma das duas: o OLHAR FULMINANTE (cone de 18 m, Sabedoria CD 16, 6d10
      // necróticos e amedrontado por 1 minuto; metade e sem medo a quem passa) ou o CHORO (9 m em volta, Constituição CD
      // 16, deslocamento 0 até o fim do próximo turno dela e a concentração perdida).
      { nome: 'Olhar Fulminante', recargaDe: 'Torrente Antipática', recharge: [5, 6], tipo: 'area', shape: 'cone', areaFt: 60,
        save: 'wis', dc: 16, damage: '6d10', damageType: 'necrótico', halfOnSave: true, condition: 'amedrontado', rounds: 10, repete: true },
      { nome: 'Choro', recargaDe: 'Torrente Antipática', recharge: [5, 6], tipo: 'area', shape: 'raio', areaFt: 30,
        save: 'con', dc: 16, condition: 'desalento', ateFimDoTurnoDele: true, quebraConcentracao: true },
    ],
    // A REPREENSÃO OBSESSIVA (reação): quem a fere a 18 m, à vista, Sabedoria CD 16, 3d6 psíquicos (metade se passar)
    repreensao: { nome: 'Repreensão Obsessiva', alcanceFt: 60, save: 'wis', dc: 16, damage: '3d6', damageType: 'psíquico' },
    traits: ['resistenciaAMagia', 'sempreAlerta'],
    blurb: 'Um globo de olhos que paira no fundo do Labirinto. Quatro raios por turno de 36 m, um olhar em cone que apodrece e amedronta, o choro que prende os pés, e cada olho se vira contra quem o fere.',
  },

  // A runa de reforço de cada fenda dá um destes: uma bola de pelo com boca, que se colhe como fruta. Não anda, não come,
  // não respira, não dorme, e renasce um dia depois de colhida.
  gnawble: {
    ...doninha,
    id: 'gnawble',
    tipo: 'aberração',
    name: 'Gnawble',
    nomeOriginal: 'Gnawble',
    fonte: 'PaBTSO',
    look: 'doninha',
    speedFt: 0,
    traits: [],
    naoSeguraALuta: true,
    blurb: 'Uma bola de pelo do tamanho de um punho, com uma boca cheia de dentes, que brota da runa como fruta. Morde quem a segura ou se aninha no colo dele.',
    lore: null,
  },
};

export const TRAITS = {};
