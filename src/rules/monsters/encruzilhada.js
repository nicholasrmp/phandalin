// AS CRIATURAS DA ENCRUZILHADA DA FORCA (o Obelisco, capítulo 6): o velho entreposto de drow, duergar e svirfneblin no
// Subterrâneo, onde está o terceiro fragmento do obelisco.
//
// Quase todo o elenco já estava no jogo pelo bestiário do Livro dos Monstros (o diabo acorrentado, o enrolador, o chuul,
// o xorn, o elemental da terra, o yochlol, o grimlock, o basilisco) e pelo capítulo 5 (o ashenwight feral, o grick alfa).
// Falta só o Qunbraxel, o devorador de mentes bruxo que os fanáticos mandaram atrás dos fragmentos: o bloco do Obelisco,
// lido do 5e.tools. O texto é nosso.
//
// O QUE O MOTOR EXECUTA, e onde:
//   - o TENTÁCULO agarra (escape CD 16) quem é Médio ou menor e, se o alvo falha em Inteligência CD 16, atordoa até o
//     agarrão acabar — `onHit.comOAgarrao`: o atordoado nasce preso ao agarrão e cai junto com ele, por qualquer caminho
//     (escapar, o Qunbraxel cair, ser derrubado ou incapacitado; `conditions.js removeCondition`);
//   - o EXTRAIR CÉREBRO só vale contra um humanoide atordoado E agarrado por ele (`exige: 'agarradoAtordoado'`,
//     `combat.js canAttack`), e quem ele zera morre na hora (`consome`);
//   - a RAJADA MENTAL, cone de 18 m com recarga 5–6 (a mesma ação especial do arcanista);
//   - o MULTIATAQUE: duas Rajadas Místicas, ou o Tentáculo e uma Rajada (`multiattack.sequence` e `porArma`);
//   - a CONJURAÇÃO PSIÔNICA (Carisma, CD 16): Confusão, Dominar Monstro e Viagem Planar por dia, Levitação e Detectar
//     Pensamentos à vontade. A Armadura Arcana já está nele (a CA de 15 é a do bloco com ela).
//
// DE FORA, dito: a Telecinésia (o jogo não tem a magia) e a Mão Mágica invisível (não muda a luta).

export const ENCRUZILHADA = {
  // G24: o devorador de mentes bruxo, no trono da sala da guarda.
  qunbraxel: {
    id: 'qunbraxel',
    tipo: 'aberração',
    name: 'Qunbraxel',
    nomeOriginal: 'Qunbraxel',
    fonte: 'PaBTSO',
    size: 'médio',
    level: 9,
    cr: '9',
    xp: 5000,
    abilities: { str: 11, dex: 14, con: 17, int: 19, wis: 15, cha: 19 },
    ac: 15,
    acNote: 'com Armadura Arcana',
    maxHp: 112,
    hpDice: '15d8+45',
    speedFt: 30,
    senses: { passivePerception: 16, darkvisionFt: 120 },
    saves: ['int', 'wis', 'cha'],
    skills: ['arcanismo', 'intuicao', 'percepcao', 'furtividade'],
    languages: ['dialeto subterrâneo', 'subcomum', 'telepatia 18 m'],
    attacks: [
      // A ordem importa: a IA tenta o primeiro golpe que pode — o cérebro, quando há quem extrair; o tentáculo, de perto;
      // a rajada, de longe.
      { name: 'Extrair Cérebro', bonus: 8, damage: '10d10', type: 'perfurante', reachFt: 5, art: 'claw', consome: true,
        exige: 'agarradoAtordoado' },
      { name: 'Tentáculo', bonus: 8, damage: '2d10+4', type: 'psíquico', reachFt: 5, art: 'claw',
        onHit: [
          { semResistencia: true, condition: 'agarrado', escape: 16, note: 'é agarrado pelos tentáculos',
            imunes: { tamanhos: ['grande', 'enorme', 'imenso'], motivo: 'grande demais para os tentáculos' } },
          { save: 'int', dc: 16, condition: 'atordoado', comOAgarrao: true, exigeAgarrado: true,
            note: 'sente a mente ser apertada' },
        ] },
      { name: 'Rajada Mística', bonus: 8, damage: '3d10+4', type: 'energético', ranged: true, rangeFt: 120, longRangeFt: 120, art: 'spell' },
    ],
    multiattack: { sequence: ['Tentáculo', 'Rajada Mística'], porArma: { 'Rajada Mística': 2 } },
    spellcasting: {
      ability: 'cha', cantrips: [], slots: [],
      prepared: ['confusao', 'dominarMonstro', 'viagemPlanar', 'detectarPensamentos', 'levitacao'],
      porDia: { confusao: 2, dominarMonstro: 1, viagemPlanar: 1 },
      aVontade: ['detectarPensamentos', 'levitacao'],
      cdPorMagia: { confusao: 16, dominarMonstro: 16, viagemPlanar: 16, detectarPensamentos: 16, levitacao: 16 },
      noMotor: true, conjuraNoTurno: 'geral',
    },
    acoesEspeciais: [
      { nome: 'Rajada Mental', recharge: [5, 6], tipo: 'area', shape: 'cone', areaFt: 60, save: 'int', dc: 16,
        damage: '5d8+4', damageType: 'psíquico', halfOnSave: false, condition: 'atordoado', rounds: 10, repete: true },
    ],
    traits: ['resistenciaAMagia'],
    blurb: 'O devorador de mentes que os fanáticos mandaram juntar os fragmentos. Rajadas místicas de longe, tentáculos que agarram e atordoam de perto, a Rajada Mental em cone, e o cérebro de quem fica preso.',
  },
};

export const TRAITS = {};
