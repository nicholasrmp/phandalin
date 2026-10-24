// Bestas: lobo, lobo atroz, aranhas, rato e morcego gigantes,
// urso, javali, coruja-urso, stirge.
// SRD 5.1 (CC-BY-4.0) — ver NOTICE.md e ELENCO.md.
//
// Regra dura: nada aqui pode ser bloco de monstro que não esteja no SRD. Se a
// criatura é do módulo publicado e não está no SRD, ela vira criatura NOSSA,
// com nome e números nossos, marcada `fonte: 'propria'`. Chutar atribuição de
// SRD num bloco que não é SRD é o pior erro possível neste projeto.
//
// `TRAITS` deste arquivo é somado ao dicionário de traços em `../monsters.js`.
//
// AS DEZ BESTAS SÃO SRD. Todas as dez estão no apêndice de criaturas do SRD —
// são bichos genéricos, não IP exclusiva da Wizards como beholder ou nothic.
// Por isso `fonte: 'SRD'` em todas, sem nenhuma `'verificar'`. O que NÃO é SRD
// é o papel de cada uma no roteiro da campanha; isso fica no arquivo de
// campanha, não aqui.
//
// CAMPOS ALÉM DO QUE `makeMonster` COPIA HOJE
//   `fonte`, `tipo`, `voice`, `hpDice`, `speeds`, `senses`, `expertise`,
//   `extraDamage`, `recharge` e `multiattack.sequence` ficam no bloco porque o
//   bloco é a fonte da verdade do bestiário — a HUD, o log e o sintetizador de
//   som leem `MONSTERS[defId]`, não o combatente instanciado. Os que o motor
//   ainda não consome estão listados no relatório desta rodada; nenhum deles
//   mente sobre o que acontece em mesa, e nenhum deles altera o que o motor já
//   resolve.

export const FERAS = {

  // -------------------------------------------------------------------------
  // CANÍDEOS — a dupla que ensina o jogador o que é Táticas de Matilha
  // -------------------------------------------------------------------------

  lobo: {
    id: 'lobo',
    name: 'Lobo',
    look: 'wolf',
    size: 'médio',
    tipo: 'fera',
    fonte: 'SRD',
    level: 1,
    cr: '1/4',
    xp: 50,
    abilities: { str: 12, dex: 15, con: 12, int: 3, wis: 12, cha: 6 },
    ac: 13,
    acNote: 'pelo natural',
    maxHp: 11,
    hpDice: '2d8+2',
    speedFt: 40,
    skills: ['percepcao', 'furtividade'],
    senses: { passivePerception: 13 },
    voice: 'growlWolf',
    attacks: [
      {
        name: 'Mordida', bonus: 4, damage: '2d4+2', type: 'perfurante', reachFt: 5, art: 'bite',
        // A CD é 11 e não 12: o lobo derruba com frequência mas não sempre, e é
        // esse "às vezes" que faz a matilha valer a pena em vez de um lobo só.
        onHit: { save: 'str', dc: 11, condition: 'caido', note: 'vai ao chão' },
      },
    ],
    traits: ['packTactics', 'keenHearingSmell'],
    blurb: 'Fecha 12 m num turno, morde com vantagem enquanto outro lobo está colado no alvo e derruba quem falhar — o próximo da matilha ataca no chão.',
  },

  loboAtroz: {
    id: 'loboAtroz',
    name: 'Lobo Atroz',
    look: 'direWolf',
    size: 'grande',
    tipo: 'fera',
    fonte: 'SRD',
    // Nível 3 só para a conta de proficiência (+2) bater com a de CR 1; os
    // bônus de ataque do SRD estão escritos à mão em cada ataque.
    level: 3,
    cr: '1',
    xp: 200,
    abilities: { str: 17, dex: 15, con: 15, int: 3, wis: 12, cha: 7 },
    ac: 14,
    acNote: 'pelo natural',
    maxHp: 37,
    hpDice: '5d10+10',
    speedFt: 50,
    skills: ['percepcao', 'furtividade'],
    senses: { passivePerception: 13 },
    voice: 'howlWolf',
    attacks: [
      {
        name: 'Mordida', bonus: 5, damage: '2d6+3', type: 'perfurante', reachFt: 5, art: 'bite',
        onHit: { save: 'str', dc: 13, condition: 'caido', note: 'vai ao chão' },
      },
    ],
    traits: ['packTactics', 'keenHearingSmell'],
    blurb: 'Mesma mordida de matilha do lobo com o triplo dos PV e 15 m de deslocamento: alcança o conjurador no primeiro turno e o derruba com CD 13.',
  },

  // -------------------------------------------------------------------------
  // ARANHAS — plano `aracnideo`
  // -------------------------------------------------------------------------

  aranhaGigante: {
    id: 'aranhaGigante',
    name: 'Aranha Gigante',
    look: 'giantSpider',
    size: 'grande',
    tipo: 'fera',
    fonte: 'SRD',
    level: 3,
    cr: '1',
    xp: 200,
    abilities: { str: 14, dex: 16, con: 12, int: 2, wis: 11, cha: 4 },
    ac: 14,
    acNote: 'pelo natural',
    maxHp: 26,
    hpDice: '4d10+4',
    speedFt: 30,
    speeds: { climbFt: 30 },
    skills: ['furtividade'],
    // Furtividade +7: DES +3 com o dobro da proficiência. Está como `expertise`
    // porque é assim que o motor dobra o bônus — ver relatório, `makeMonster`
    // ainda não copia este campo para o combatente.
    expertise: ['furtividade'],
    senses: { blindsightFt: 10, darkvisionFt: 60, passivePerception: 10 },
    voice: 'hissSpider',
    // A ORDEM DESTE ARRAY É A TÁTICA DELA. `ai.js` pega o primeiro ataque usável
    // quando está colada no alvo e procura um ataque `ranged` quando não tem
    // ninguém ao lado — com Mordida em primeiro e Teia em segundo, a aranha
    // enreda de longe e morde de perto, que é exatamente o bloco. Inverter as
    // duas linhas faz dela uma aranha que cospe teia na cara de quem já está
    // agarrado.
    attacks: [
      {
        name: 'Mordida', bonus: 5, damage: '1d8+3', type: 'perfurante', reachFt: 5, art: 'bite',
        // O veneno é METADE do dano do bloco (2d8 contra 1d8+3) e vale resistência
        // de CON. Fica declarado aqui, e não somado à notação principal, porque
        // somar transformaria um ataque com resistência num ataque sem — e aí a
        // aranha deixa de ser o monstro que castiga quem falha em CON.
        extraDamage: { damage: '2d8', type: 'veneno', save: 'con', dc: 11, half: true },
      },
      {
        // Teia é o que faz esta aranha diferente da aranha-lobo: ela prende
        // alguém de longe e só então desce para morder o que não anda mais.
        // `damage` é o NÚMERO 0, não a string '0': `parseDice` só aceita
        // "NdM±K" em texto e estoura com "Notação de dado inválida: \"0\"" — um
        // ataque sem dano tem de entrar como número ou a teia derruba o combate.
        name: 'Teia', bonus: 5, damage: 0, type: 'nenhum',
        ranged: true, rangeFt: 30, longRangeFt: 60, art: 'bow',
        recharge: '5-6',
        // Sem resistência: o acerto prende. Sai com Atletismo/Acrobacia CD 12.
        onHit: { semResistencia: true, dc: 12, escape: 12, condition: 'contido', note: 'fica preso na teia' },
      },
    ],
    traits: ['spiderClimb', 'webSense', 'webWalker'],
    blurb: 'Prende um alvo de 9 m com teia e desce para morder quem não anda mais; o veneno vale metade do dano e cobra resistência de CON.',
  },

  aranhaLoboGigante: {
    id: 'aranhaLoboGigante',
    name: 'Aranha-Lobo Gigante',
    look: 'giantWolfSpider',
    size: 'médio',
    tipo: 'fera',
    fonte: 'SRD',
    level: 1,
    cr: '1/4',
    xp: 50,
    abilities: { str: 12, dex: 16, con: 13, int: 3, wis: 12, cha: 4 },
    ac: 13,
    acNote: 'pelo natural',
    maxHp: 11,
    hpDice: '2d8+2',
    speedFt: 40,
    speeds: { climbFt: 40 },
    skills: ['percepcao', 'furtividade'],
    expertise: ['furtividade'],
    senses: { blindsightFt: 10, darkvisionFt: 60, passivePerception: 13 },
    voice: 'hissSpider',
    attacks: [
      {
        name: 'Mordida', bonus: 3, damage: '1d6+1', type: 'perfurante', reachFt: 5, art: 'bite',
        extraDamage: { damage: '2d6', type: 'veneno', save: 'con', dc: 11, half: true },
      },
    ],
    // Nenhuma teia: esta aranha CAÇA. É a diferença de papel entre as duas, e é
    // por isso que ela anda 12 m e a outra 9 m.
    traits: ['spiderClimb', 'webSense', 'webWalker'],
    blurb: 'Caça correndo em vez de esperar: anda 12 m, escala parede e morde com veneno, sem teia para prender ninguém.',
  },

  // -------------------------------------------------------------------------
  // VERMES E VOADORES — o que enche uma sala sem matar o grupo
  // -------------------------------------------------------------------------

  ratoGigante: {
    id: 'ratoGigante',
    name: 'Rato Gigante',
    look: 'giantRat',
    size: 'pequeno',
    tipo: 'fera',
    fonte: 'SRD',
    level: 1,
    cr: '1/8',
    xp: 25,
    abilities: { str: 7, dex: 15, con: 11, int: 2, wis: 10, cha: 4 },
    ac: 12,
    acNote: 'pelo natural',
    maxHp: 7,
    hpDice: '2d6',
    speedFt: 30,
    senses: { darkvisionFt: 60, passivePerception: 10 },
    attacks: [
      { name: 'Mordida', bonus: 4, damage: '1d4+2', type: 'perfurante', reachFt: 5, art: 'bite' },
    ],
    traits: ['packTactics', 'keenSmell'],
    blurb: 'Um rato não arranha ninguém; seis ratos atacam todos com vantagem e cercam quem se afastou do grupo.',
  },

  morcegoGigante: {
    id: 'morcegoGigante',
    name: 'Morcego Gigante',
    look: 'giantBat',
    size: 'grande',
    tipo: 'fera',
    fonte: 'SRD',
    level: 1,
    cr: '1/4',
    xp: 50,
    abilities: { str: 15, dex: 16, con: 11, int: 2, wis: 12, cha: 6 },
    ac: 13,
    acNote: 'pelo natural',
    maxHp: 22,
    hpDice: '4d10',
    // Dez pés no chão, sessenta no ar: no chão ele é presa. O voo é o bloco
    // inteiro dele, e `speedFt` tem de ser o de voo ou a IA o deixa rastejando.
    speedFt: 60,
    speeds: { walkFt: 10, flyFt: 60 },
    senses: { blindsightFt: 60, passivePerception: 11 },
    attacks: [
      { name: 'Mordida', bonus: 4, damage: '1d6+2', type: 'perfurante', reachFt: 5, art: 'bite' },
    ],
    traits: ['echolocation', 'keenHearing'],
    blurb: 'Entra voando 18 m, morde e sai do alcance de todo mundo no mesmo turno; escuridão não o atrasa, surdez sim.',
  },

  stirge: {
    id: 'stirge',
    name: 'Stirge',
    look: 'stirge',
    size: 'miúdo',
    tipo: 'fera',
    fonte: 'SRD',
    level: 1,
    cr: '1/8',
    xp: 25,
    abilities: { str: 4, dex: 16, con: 11, int: 2, wis: 8, cha: 6 },
    ac: 14,
    acNote: 'pelo natural',
    // DOIS PV. Qualquer acerto mata, e é essa fragilidade que faz o jogador
    // gastar uma ação inteira com um bicho de 25 XP — o que é exatamente o
    // preço que o stirge cobra.
    maxHp: 2,
    hpDice: '1d4',
    speedFt: 40,
    speeds: { walkFt: 10, flyFt: 40 },
    senses: { darkvisionFt: 60, passivePerception: 9 },
    voice: 'screechStirge',
    attacks: [
      {
        name: 'Dreno de Sangue', bonus: 5, damage: '1d4+3', type: 'perfurante', reachFt: 5, art: 'bite',
        // SEM `onHit` DE PROPÓSITO. A agulha não derruba nem envenena: ela
        // GRUDA, e no bloco do SRD isso não tem resistência — acertou, prendeu.
        // `onHit` do motor SEMPRE rola um teste, então qualquer CD que eu
        // escrevesse aqui seria número nosso num bloco marcado SRD: CD baixa
        // deixa todo mundo passar (o stirge nunca gruda) e CD alta é um "vs CD
        // 30" mentiroso no log. Fica como traço até o motor aceitar efeito sem
        // resistência — está pedido no relatório desta rodada.
      },
    ],
    traits: ['bloodDrain'],
    blurb: 'Gruda no alvo no primeiro acerto e drena 1d4+3 por turno sem rolar mais nada, até alguém gastar uma ação para arrancá-la.',
  },

  // -------------------------------------------------------------------------
  // BESTAS GRANDES — as que mudam a conta de um encontro
  // -------------------------------------------------------------------------

  javali: {
    id: 'javali',
    name: 'Javali',
    look: 'boar',
    size: 'médio',
    tipo: 'fera',
    fonte: 'SRD',
    level: 1,
    cr: '1/4',
    xp: 50,
    abilities: { str: 13, dex: 11, con: 12, int: 2, wis: 9, cha: 5 },
    ac: 11,
    acNote: 'pelo natural',
    maxHp: 11,
    hpDice: '2d8+2',
    speedFt: 40,
    senses: { passivePerception: 9 },
    attacks: [
      { name: 'Presas', bonus: 3, damage: '1d6+1', type: 'cortante', reachFt: 5, art: 'claw' },
    ],
    traits: ['charge', 'relentless'],
    blurb: 'Corre 6 m em linha reta e acerta com +1d6 que derruba; quando o dano o levaria a 0, fica de pé com 1 PV e ataca mais uma vez.',
  },

  ursoPardo: {
    id: 'ursoPardo',
    name: 'Urso Pardo',
    look: 'brownBear',
    size: 'grande',
    tipo: 'fera',
    fonte: 'SRD',
    level: 3,
    cr: '1',
    xp: 200,
    abilities: { str: 19, dex: 10, con: 16, int: 2, wis: 13, cha: 7 },
    ac: 11,
    acNote: 'pelo natural',
    maxHp: 34,
    hpDice: '4d10+12',
    speedFt: 40,
    speeds: { climbFt: 30 },
    skills: ['percepcao'],
    senses: { passivePerception: 13 },
    voice: 'gruntOgre',
    attacks: [
      { name: 'Mordida', bonus: 6, damage: '1d8+4', type: 'perfurante', reachFt: 5, art: 'bite' },
      { name: 'Garras', bonus: 6, damage: '2d6+4', type: 'cortante', reachFt: 5, art: 'claw' },
    ],
    // Uma mordida E uma garrada, nesta ordem.
    multiattack: { count: 2, sequence: ['Mordida', 'Garras'] },
    traits: ['keenSmell'],
    blurb: 'Dois ataques por turno de perto, com a garrada valendo 2d6+4: concentra 19 de dano médio num alvo e escala parede para alcançá-lo.',
  },

  corujaUrso: {
    id: 'corujaUrso',
    name: 'Coruja-Urso',
    look: 'owlbear',
    size: 'grande',
    tipo: 'fera',
    fonte: 'SRD',
    // Nível 4 mantém a proficiência em +2, que é a de CR 3. Nível 5 daria +3 e
    // inflaria perícias e resistências da criatura.
    level: 4,
    cr: '3',
    xp: 700,
    abilities: { str: 20, dex: 12, con: 17, int: 3, wis: 12, cha: 7 },
    ac: 13,
    acNote: 'pelo natural',
    maxHp: 59,
    hpDice: '7d10+21',
    speedFt: 40,
    skills: ['percepcao'],
    senses: { darkvisionFt: 60, passivePerception: 13 },
    voice: 'roarDragon',
    attacks: [
      { name: 'Bico', bonus: 7, damage: '1d10+5', type: 'perfurante', reachFt: 5, art: 'bite' },
      { name: 'Garras', bonus: 7, damage: '2d8+5', type: 'cortante', reachFt: 5, art: 'claw' },
    ],
    multiattack: { count: 2, sequence: ['Bico', 'Garras'] },
    traits: ['keenSightSmell'],
    blurb: 'Bico e garras no mesmo turno, +7 para acertar e 24 de dano médio: mata um personagem de 1º nível por rodada se ninguém segurar a atenção dela.',
  },

};

/** Traços novos desta família, somados ao dicionário geral. */
export const TRAITS = {
  keenHearingSmell: {
    name: 'Audição e Olfato Aguçados',
    desc: 'Vantagem em testes de Percepção por audição ou olfato. Furtividade não esconde o grupo dela.',
  },
  keenHearing: {
    name: 'Audição Aguçada',
    desc: 'Vantagem em testes de Percepção por audição.',
  },
  keenSmell: {
    name: 'Olfato Aguçado',
    desc: 'Vantagem em testes de Percepção por olfato.',
  },
  keenSightSmell: {
    name: 'Visão e Olfato Aguçados',
    desc: 'Vantagem em testes de Percepção por visão ou olfato.',
  },
  spiderClimb: {
    name: 'Escalada em Parede',
    desc: 'Escala superfícies difíceis, inclusive teto de cabeça para baixo, sem teste de atributo.',
  },
  webSense: {
    name: 'Sentir Teia',
    desc: 'Em contato com a própria teia, sabe a posição exata de qualquer criatura que toque a mesma teia.',
  },
  webWalker: {
    name: 'Andar na Teia',
    desc: 'Ignora restrição de movimento causada por teia.',
  },
  echolocation: {
    name: 'Ecolocalização',
    desc: 'Percebe por som a 18 m, inclusive no escuro total. Enquanto surdo, não enxerga nada.',
  },
  charge: {
    name: 'Investida',
    desc: 'Movendo-se 6 m em linha reta antes de acertar com as presas: +1d6 de dano cortante e resistência de FOR CD 11 ou cai no chão.',
  },
  relentless: {
    name: 'Implacável',
    desc: 'Dano de 7 ou menos que o levaria a 0 PV o deixa com 1 PV. Recarrega após um descanso.',
  },
  bloodDrain: {
    name: 'Dreno de Sangue',
    desc: 'Ao acertar, fixa-se no alvo: deixa de atacar e, no início de cada turno seu, o alvo perde 1d4+3 PV sem rolagem de ataque. Uma criatura pode usar a ação para arrancá-la.',
  },
};
