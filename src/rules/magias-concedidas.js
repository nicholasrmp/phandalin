// AS AÇÕES QUE UMA MAGIA CONCEDE (Xanathar): o sopro que o Sopro do Dragão dá a quem foi tocado, o meteoro que se solta
// dos Meteoros Diminutos de Melf, a estrela da Coroa de Estrelas, o jato de cada Investidura, o raio da Esfera da
// Tempestade. No livro, nenhuma delas é magia: é a ação (ou a ação bônus) que a magia já conjurada dá. No jogo elas são
// MAGIAS INTERNAS — círculo 0, sem espaço, sem escala de truque, fora de toda lista de classe — que entram na lista de
// quem as tem (`spells.js magiasProntas`) só enquanto a condição ou a concentração que as dá estiver de pé. Assim o
// jogador as acha onde já procura as magias, e a mira, a área, o teste e a prévia são os de sempre.
//
//   `daCondicao`  o tipo, o dano e a CD saem da condição (o Sopro do Dragão é do tipo escolhido por quem conjurou, com a
//                 CD dele, e sobe com o círculo)
//   `cargaDe`     cada uso gasta uma carga da condição; sem carga, a ação some (os meteoros, as estrelas)
//   `tom`         a nota do som, escolhida à mão entre as que só as magias dos livros usam (`core/audio.js`)
export const MAGIAS_CONCEDIDAS = {
  // ---- as que as SUBCLASSES dão (`classes/subclasses-xge.js`)
  comandoDaMajestade: {
    tom: 3, id: 'comandoDaMajestade', name: 'Manto de Majestade: Comando', level: 0, school: 'encantamento', fonte: 'xge', interna: true, semEscala: true,
    castTime: 'bonus', rangeFt: 60, kind: 'debuff', targets: 1, save: 'wis', condition: 'comandado', duracaoRodadas: 1, naoAfeta: ['morto-vivo'],
    falhaQuemEnfeiticou: true, semRegraDeBonus: true,
    desc: 'Ação bônus, enquanto o Manto de Majestade dura: Comando sem espaço de magia. Quem o bardo enfeitiçou falha sozinho.',
  },
  arcoAbrasador: {
    tom: 5, id: 'arcoAbrasador', name: 'Golpe do Arco Abrasador', level: 1, school: 'evocação', fonte: 'xge', interna: true,
    castTime: 'bonus', rangeFt: 0, shape: 'cone', areaFt: 15, kind: 'save', save: 'dex', damage: '3d6', damageType: 'fogo', halfOnSave: true,
    upcast: { dados: 1 }, depoisDaAcaoDeAtaque: true, semRegraDeBonus: true,
    desc: 'O monge da Alma Solar, logo depois da ação de Atacar: Mãos Flamejantes como ação bônus, por 2 de ki; cada ki a mais sobe um círculo.',
  },
  explosaoSolarAbrasadora: {
    tom: 3, id: 'explosaoSolarAbrasadora', name: 'Explosão Solar Abrasadora', level: 0, school: 'evocação', fonte: 'xge', interna: true, semEscala: true,
    castTime: 'action', rangeFt: 150, shape: 'sphere', areaFt: 20, kind: 'save', save: 'con', damage: '2d6', damageType: 'radiante', halfOnSave: false,
    kiPorOpcao: true,
    opcoes: [{ id: '0', rotulo: 'Sem ki', detalhe: '2d6' }, { id: '1', rotulo: '1 de ki', detalhe: '4d6' }, { id: '2', rotulo: '2 de ki', detalhe: '6d6' }, { id: '3', rotulo: '3 de ki', detalhe: '8d6' }],
    desc: 'O orbe de luz do monge da Alma Solar: esfera de 6 m a até 45 m, Constituição ou 2d6 radiante; cada ki, até 3, soma 2d6.',
  },
  caminhosOcultos: {
    tom: 3, id: 'caminhosOcultos', name: 'Caminhos Ocultos', level: 0, school: 'conjuração', fonte: 'xge', interna: true, semEscala: true,
    castTime: 'bonus', rangeFt: 60, kind: 'teleporte', mira: 'casa', recursoDe: 'hiddenPaths', semRegraDeBonus: true,
    desc: 'O druida dos Sonhos: ação bônus, um teleporte até uma casa livre que ele vê a até 18 m. SAB usos por descanso longo.',
  },
  passoDasSombrasDaFeiticaria: {
    tom: -2, id: 'passoDasSombrasDaFeiticaria', name: 'Caminhar nas Sombras', level: 0, school: 'conjuração', fonte: 'xge', interna: true, semEscala: true,
    castTime: 'bonus', rangeFt: 120, kind: 'teleporte', mira: 'casa', exigeSombra: true, semRegraDeBonus: true,
    desc: 'O feiticeiro das sombras: ação bônus, de uma sombra (penumbra ou escuridão) para outra a até 36 m.',
  },
  teletransportePsiquico: {
    tom: 6, id: 'teletransportePsiquico', name: 'Teletransporte Psíquico', level: 0, school: 'conjuração', fonte: 'tce', interna: true, semEscala: true,
    castTime: 'bonus', rangeFt: 120, kind: 'teleporte', mira: 'casa', recursoDe: 'psionicEnergy', alcancePorDadoPsi: true, semRegraDeBonus: true,
    desc: 'O ladino da Lâmina da Alma: ação bônus e um dado de energia psiônica; a lâmina voa até 3 m por ponto do dado, e ele surge onde ela cai.',
  },
  soproDoMongeCone: {
    tom: 2, id: 'soproDoMongeCone', name: 'Sopro do Dragão: cone', level: 0, school: 'evocação', fonte: 'ftd', interna: true, semEscala: true,
    castTime: 'action', rangeFt: 0, shape: 'cone', areaFt: 20, kind: 'save', save: 'dex', damage: '2d6', damageType: 'fogo', halfOnSave: true,
    exigeCaracteristica: 'breathOfTheDragon', recursoOuPontos: { recurso: 'breathOfTheDragon', pontos: 2, campo: 'ki' },
    desc: 'O monge do Dragão Ascendente, no lugar de um golpe da ação de Atacar: um cone de 6 m; DES contra a CD de ki, os dados de Artes Marciais do tipo do dragão (metade no sucesso). Um uso por descanso longo (a proficiência de vezes), depois 2 de ki.',
  },
  soproDoMongeLinha: {
    tom: 4, id: 'soproDoMongeLinha', name: 'Sopro do Dragão: linha', level: 0, school: 'evocação', fonte: 'ftd', interna: true, semEscala: true,
    castTime: 'action', rangeFt: 0, shape: 'linha', areaFt: 30, kind: 'save', save: 'dex', damage: '2d6', damageType: 'fogo', halfOnSave: true,
    exigeCaracteristica: 'breathOfTheDragon', recursoOuPontos: { recurso: 'breathOfTheDragon', pontos: 2, campo: 'ki' },
    desc: 'O monge do Dragão Ascendente, no lugar de um golpe da ação de Atacar: uma linha de 9 m; DES contra a CD de ki, os dados de Artes Marciais do tipo do dragão (metade no sucesso). Um uso por descanso longo (a proficiência de vezes), depois 2 de ki.',
  },
  soproDoMongeConeMaior: {
    tom: -3, id: 'soproDoMongeConeMaior', name: 'Sopro do Dragão aumentado: cone', level: 0, school: 'evocação', fonte: 'ftd', interna: true, semEscala: true,
    castTime: 'action', rangeFt: 0, shape: 'cone', areaFt: 60, kind: 'save', save: 'dex', damage: '2d6', damageType: 'fogo', halfOnSave: true,
    exigeCaracteristica: 'ascendantAspect', recursoOuPontos: { recurso: 'breathOfTheDragon', pontos: 2, campo: 'ki', extra: 1 },
    desc: 'O monge do Dragão Ascendente, no lugar de um golpe da ação de Atacar: um cone de 18 m, quatro dados; DES contra a CD de ki, os dados de Artes Marciais do tipo do dragão (metade no sucesso). Um uso por descanso longo (a proficiência de vezes), depois 2 de ki; a forma maior custa 1 de ki a mais.',
  },
  soproDoMongeLinhaMaior: {
    tom: -5, id: 'soproDoMongeLinhaMaior', name: 'Sopro do Dragão aumentado: linha', level: 0, school: 'evocação', fonte: 'ftd', interna: true, semEscala: true,
    castTime: 'action', rangeFt: 0, shape: 'linha', areaFt: 90, kind: 'save', save: 'dex', damage: '2d6', damageType: 'fogo', halfOnSave: true,
    exigeCaracteristica: 'ascendantAspect', recursoOuPontos: { recurso: 'breathOfTheDragon', pontos: 2, campo: 'ki', extra: 1 },
    desc: 'O monge do Dragão Ascendente, no lugar de um golpe da ação de Atacar: uma linha de 27 m, quatro dados; DES contra a CD de ki, os dados de Artes Marciais do tipo do dragão (metade no sucesso). Um uso por descanso longo (a proficiência de vezes), depois 2 de ki; a forma maior custa 1 de ki a mais.',
  },
  soproDoDraco: {
    tom: -6, id: 'soproDoDraco', name: 'Sopro do Draco', level: 0, school: 'evocação', fonte: 'ftd', interna: true, semEscala: true,
    castTime: 'action', rangeFt: 0, shape: 'cone', areaFt: 30, kind: 'save', save: 'dex', damage: '8d6', damageType: 'fogo', halfOnSave: true,
    exigeCaracteristica: 'drakesBreath', recursoDe: 'drakesBreath',
    desc: 'O Guardião Dracônico, 11º: um cone de 9 m do tipo escolhido para o draco; DES contra a CD de magia, 8d6 (10d6 no 15º), metade no sucesso. Uma vez por descanso longo.',
  },
  implosaoDistorcida: {
    tom: -4, id: 'implosaoDistorcida', name: 'Implosão Distorcida', level: 0, school: 'conjuração', fonte: 'tce', interna: true, semEscala: true,
    castTime: 'action', rangeFt: 120, kind: 'teleporte', mira: 'casa', damage: '3d10', damageType: 'energético', save: 'str',
    explosaoNaSaida: { raioFt: 30, save: 'str', tipo: 'energético', puxa: true }, recursoOuPontos: { recurso: 'warpingImplosion', pontos: 5 },
    desc: 'A Mente Aberrante, 18º: some e reaparece a até 36 m; quem estava a 9 m de onde ele saiu testa Força ou leva 3d10 de energético e é puxado para lá (metade, sem puxão, no sucesso). Um uso por descanso longo, ou 5 pontos de feitiçaria.',
  },
  tentaculoDasProfundezas: {
    tom: -1, id: 'tentaculoDasProfundezas', name: 'Tentáculo das Profundezas', level: 0, school: 'conjuração', fonte: 'tce', interna: true, semEscala: true,
    castTime: 'bonus', rangeFt: 60, kind: 'arma', melee: true, reuso: 'bonus', alcanceDaArmaFt: 40, recursoDe: 'tentacleOfTheDeeps', semRegraDeBonus: true,
    damage: '1d8', damageType: 'frio', duracaoRodadas: 10,
    applies: { condition: 'lento', rounds: 1, conta: 'conjurador', quando: 'inicio' },
    desc: 'O bruxo do Insondável: ação bônus, um tentáculo de 3 m surge a até 18 m por um minuto e golpeia (ataque de magia, 1d8 de frio, 2d8 no 10º, e −3 m de deslocamento). Nos outros turnos, a ação bônus o move até 9 m e golpeia de novo.',
  },
  saltoDaTempestade: {
    tom: 5, id: 'saltoDaTempestade', name: 'Magia Tempestuosa: voar', level: 0, school: 'transmutação', fonte: 'xge', interna: true, semEscala: true,
    castTime: 'bonus', rangeFt: 10, kind: 'teleporte', mira: 'casa', depoisDeMagia: true, semRegraDeBonus: true,
    desc: 'O feiticeiro da tempestade, logo depois de uma magia de 1º círculo ou mais: ação bônus, um voo de até 3 m que não dá ataque de oportunidade.',
  },
  esporosQueSeEspalham: {
    tom: -2, id: 'esporosQueSeEspalham', name: 'Esporos que se Espalham', level: 0, school: 'conjuração', fonte: 'tce', interna: true, semEscala: true,
    castTime: 'bonus', rangeFt: 30, shape: 'square', areaFt: 10, kind: 'save', soZona: true, exigeCaracteristica: 'spreadingSpores', semRegraDeBonus: true,
    zona: { rodadas: 10, quando: 'inicio', aoEntrar: true, dificil: false, dano: { dados: '1d8', tipo: 'necrótico', save: 'con' } },
    duracaoRodadas: 10,
    desc: 'O druida dos Esporos, com a Entidade Simbiótica: um cubo de 3 m de esporos a até 9 m por um minuto; quem entra ou começa o turno nele testa CON ou leva o dado do halo.',
  },
  saltoDoSurto: {
    tom: 3, id: 'saltoDoSurto', name: 'Surto Selvagem: teleporte', level: 0, school: 'conjuração', fonte: 'tce', interna: true, semEscala: true,
    castTime: 'bonus', rangeFt: 30, kind: 'teleporte', mira: 'casa', exigeSurto: 'teleporte', semRegraDeBonus: true,
    desc: 'Quando o surto da Fúria é o do teleporte: ação bônus, uma casa livre que o bárbaro vê a até 9 m.',
  },
  pouparOsMoribundosDaSepultura: {
    tom: -2, id: 'pouparOsMoribundosDaSepultura', name: 'Poupar os Moribundos (Círculo da Mortalidade)', level: 0, school: 'necromancia', fonte: 'xge', interna: true, semEscala: true,
    castTime: 'bonus', rangeFt: 30, kind: 'estabilizar',
    desc: 'O truque do clérigo da Sepultura: alcance de 9 m e ação bônus. Quem está a 0 PV fica estável.',
  },
  soproDraconicoSopro: {
    tom: 5, id: 'soproDraconicoSopro', name: 'Sopro do Dragão: soprar', level: 0, school: 'transmutação', fonte: 'xge', interna: true, semEscala: true,
    castTime: 'action', rangeFt: 0, shape: 'cone', areaFt: 15, kind: 'save', save: 'dex', damage: '3d6', damageType: 'fogo', halfOnSave: true,
    daCondicao: 'soproDraconico', semRegraDeBonus: true,
    desc: 'A ação que o Sopro do Dragão dá: um cone de 4,5 m do tipo escolhido; Destreza na CD de quem conjurou, metade no sucesso.',
  },
  meteoroDeMelf: {
    tom: 5, id: 'meteoroDeMelf', name: 'Meteoros: soltar dois', level: 0, school: 'evocação', fonte: 'xge', interna: true, semEscala: true,
    castTime: 'bonus', rangeFt: 120, shape: 'sphere', areaFt: 5, kind: 'save', save: 'dex', damage: '4d6', damageType: 'fogo', halfOnSave: true,
    cargaDe: 'meteorosMinusculos', semRegraDeBonus: true,
    desc: 'Ação bônus: dois meteoros no mesmo ponto, uma explosão só de 4d6 de fogo num raio de 1,5 m; Destreza para metade.',
  },
  pedraEncantadaArremesso: {
    tom: -4, id: 'pedraEncantadaArremesso', name: 'Pedra Encantada: arremessar', level: 0, school: 'transmutação', fonte: 'xge', interna: true, semEscala: true,
    castTime: 'action', rangeFt: 60, kind: 'attack', damage: '1d6', damageType: 'concussão', daCondicao: 'pedrasEncantadas', cargaDe: 'pedrasEncantadas',
    desc: 'Ação: arremessa uma das pedras, ataque mágico à distância, 1d6 + o atributo de conjuração de concussão.',
  },
  coroaEstrela: {
    tom: -4, id: 'coroaEstrela', name: 'Coroa de Estrelas: lançar uma', level: 0, school: 'evocação', fonte: 'xge', interna: true, semEscala: true,
    castTime: 'bonus', rangeFt: 120, kind: 'attack', damage: '4d12', damageType: 'radiante', cargaDe: 'coroaDeEstrelas', semRegraDeBonus: true,
    desc: 'Ação bônus: uma das estrelas voa até o alvo, ataque mágico à distância, 4d12 radiante.',
  },
  raioDaTempestade: {
    tom: 5, id: 'raioDaTempestade', name: 'Esfera da Tempestade: raio', level: 0, school: 'evocação', fonte: 'xge', interna: true, semEscala: true,
    castTime: 'bonus', rangeFt: 60, kind: 'attack', damage: '4d6', damageType: 'elétrico', semRegraDeBonus: true,
    desc: 'Ação bônus: um raio salta da esfera, ataque mágico à distância, 4d6 elétrico.',
  },
  jatoDasChamas: {
    tom: -4, id: 'jatoDasChamas', name: 'Investidura das Chamas: jato', level: 0, school: 'transmutação', fonte: 'xge', interna: true, semEscala: true,
    castTime: 'action', rangeFt: 0, shape: 'linha', areaFt: 15, larguraFt: 5, kind: 'save', save: 'dex', damage: '4d8', damageType: 'fogo', halfOnSave: true,
    desc: 'Ação: uma linha de fogo de 4,5 m; Destreza, 4d8 de fogo, metade no sucesso.',
  },
  coneDeGelo: {
    tom: 5, id: 'coneDeGelo', name: 'Investidura de Gelo: cone', level: 0, school: 'transmutação', fonte: 'xge', interna: true, semEscala: true,
    castTime: 'action', rangeFt: 0, shape: 'cone', areaFt: 15, kind: 'save', save: 'con', damage: '4d6', damageType: 'frio', halfOnSave: true,
    onFail: { condition: 'geladoPelaInvestidura', rounds: 1 },
    desc: 'Ação: um cone de 4,5 m de vento gelado; Constituição, 4d6 de frio, metade no sucesso, e quem falha anda pela metade até o próximo turno.',
  },
  tremorDePedra: {
    tom: 14, id: 'tremorDePedra', name: 'Investidura de Pedra: tremor', level: 0, school: 'transmutação', fonte: 'xge', interna: true, semEscala: true,
    castTime: 'action', rangeFt: 0, shape: 'sphere', areaFt: 15, centradoEmSi: true, kind: 'save', save: 'dex', onFail: { condition: 'caido' },
    desc: 'Ação: o chão treme num raio de 4,5 m; quem falha em Destreza cai.',
  },
  rajadaDaInvestidura: {
    tom: -4, id: 'rajadaDaInvestidura', name: 'Investidura do Vento: rajada', level: 0, school: 'transmutação', fonte: 'xge', interna: true, semEscala: true,
    castTime: 'action', rangeFt: 60, shape: 'square', areaFt: 15, kind: 'save', save: 'con', damage: '2d10', damageType: 'concussão', halfOnSave: true, pushFt: 10,
    desc: 'Ação: um cubo de 4,5 m de vento num ponto a até 18 m; Constituição, 2d10 de concussão e 3 m de empurrão, metade e nada de empurrão no sucesso.',
  },
};

/** As concedidas pela CONDIÇÃO de quem as usa. */
export const CONCEDIDAS_POR_CONDICAO = {
  soproDraconico: ['soproDraconicoSopro'],
  meteorosMinusculos: ['meteoroDeMelf'],
  pedrasEncantadas: ['pedraEncantadaArremesso'],
  coroaDeEstrelas: ['coroaEstrela'],
  investiduraDasChamas: ['jatoDasChamas'],
  investiduraDeGelo: ['coneDeGelo'],
  investiduraDePedra: ['tremorDePedra'],
  investiduraDoVento: ['rajadaDaInvestidura'],
  mantoDeMajestade: ['comandoDaMajestade'],
  surtoBarbaro: ['saltoDoSurto'],
  entidadeSimbiotica: ['esporosQueSeEspalham'],
};

/** As concedidas pela CONCENTRAÇÃO de quem conjurou (a esfera está no chão; quem a mantém é que solta o raio). */
export const CONCEDIDAS_POR_CONCENTRACAO = {
  esferaDaTempestade: ['raioDaTempestade'],
};

/** As concedidas por uma CARACTERÍSTICA de classe ou subclasse (sempre que o combatente a tem). */
export const CONCEDIDAS_POR_CARACTERISTICA = {
  circleOfMortality: ['pouparOsMoribundosDaSepultura'],
  searingSunburst: ['explosaoSolarAbrasadora'],
  hiddenPaths: ['caminhosOcultos'],
  shadowWalk: ['passoDasSombrasDaFeiticaria'],
  tempestuousMagic: ['saltoDaTempestade'],
  soulBlades: ['teletransportePsiquico'],
  warpingImplosion: ['implosaoDistorcida'],
  tentacleOfTheDeeps: ['tentaculoDasProfundezas'],
  breathOfTheDragon: ['soproDoMongeCone', 'soproDoMongeLinha'],
  ascendantAspect: ['soproDoMongeConeMaior', 'soproDoMongeLinhaMaior'],
  drakesBreath: ['soproDoDraco'],
};

/** As concedidas que o combatente tem agora. */
export function concedidasDe(actor) {
  const out = [];
  for (const c of actor?.conditions ?? []) out.push(...(CONCEDIDAS_POR_CONDICAO[c.id] ?? []));
  out.push(...(CONCEDIDAS_POR_CONCENTRACAO[actor?.concentrating?.spellId] ?? []));
  for (const f of actor?.features ?? []) out.push(...(CONCEDIDAS_POR_CARACTERISTICA[f] ?? []));
  return out;
}
