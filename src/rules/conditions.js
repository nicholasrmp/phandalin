// SRD 5.1 (CC-BY-4.0) — ver NOTICE.md
// Condições. Cada uma descreve, em dados, o que muda mecanicamente.

import { DANOS_FISICOS } from './tipos-de-dano.js';

export const CONDITIONS = {
  caido: {
    name: 'Caído',
    desc: 'Movimento só rastejando. Desvantagem em ataques. Quem ataca de perto tem vantagem; à distância, desvantagem.',
    attackDisadvantage: true,
    attackedAdvantageMelee: true,
    attackedDisadvantageRanged: true,
  },
  // A BRISA DAS CINZAS (zumbi das cinzas, Árvore Trovão): a cinza que escorre do
  // corpo quando ele leva o primeiro golpe. 1 minuto, nova resistência de CON a
  // cada turno (`data.repete`, `combat.js` `fimDoTurnoDoLado`).
  brisaDasCinzas: {
    name: 'Brisa das Cinzas',
    desc: 'Desvantagem em ataques, resistências e testes de atributo por 1 minuto. Repete a resistência de CON (CD 10) no fim de cada turno seu.',
    attackDisadvantage: true,
    desvantagemTeste: ['str', 'dex', 'con', 'int', 'wis', 'cha'],
  },
  // ESPREMIDO (SRD 5.1): a criatura entrou num espaço de uma categoria abaixo da dela. Cada 1,5 m custa 1,5 m a
  // mais (isso é com a busca de movimento, `core/grid.js reachable`), e aqui ficam os três efeitos de combate.
  // Não é condição que alguém imponha: o motor a põe e a tira sozinho, conforme a casa em que a criatura para
  // (`combat.js moveAlong`).
  espremido: {
    name: 'Espremido',
    desc: 'Num espaço apertado demais: cada 1,5 m custa 1,5 m a mais, desvantagem em ataques e em testes de Destreza, e quem a ataca tem vantagem.',
    attackDisadvantage: true,
    attackedAdvantage: true,
    desvantagemTeste: ['dex'],
  },
  agarrado: {
    name: 'Agarrado',
    desc: 'Deslocamento 0.',
    speed: 0,
  },
  envenenado: {
    name: 'Envenenado',
    desc: 'Desvantagem em ataques e testes de atributo.',
    attackDisadvantage: true,
  },
  amedrontado: {
    name: 'Amedrontado',
    desc: 'Desvantagem em ataques enquanto enxergar a fonte do medo. Não pode se aproximar dela.',
    attackDisadvantage: true,
  },
  atordoado: {
    name: 'Atordoado',
    desc: 'Incapacitado, sem movimento. Falha automática em FOR e DES. Ataques contra têm vantagem.',
    incapacitated: true,
    speed: 0,
    attackedAdvantage: true,
    autoFailSaves: ['str', 'dex'],
  },
  inconsciente: {
    name: 'Inconsciente',
    desc: 'Incapacitado, caído, sem movimento. Ataques a até 1,5 m são críticos se acertarem.',
    incapacitated: true,
    speed: 0,
    attackedAdvantage: true,
    autoFailSaves: ['str', 'dex'],
    critWithinReach: true,
  },
  paralisado: {
    name: 'Paralisado',
    desc: 'Incapacitado, sem movimento. Falha automática em FOR e DES. Ataques contra têm vantagem; de perto, acerto é crítico.',
    incapacitated: true,
    speed: 0,
    attackedAdvantage: true,
    autoFailSaves: ['str', 'dex'],
    critWithinReach: true,
  },
  // O OLHAR DA MEDUSA (o Obelisco, Honna em Talhundereth). Petrificado: pedra, incapacitado, sem movimento, falha
  // automática em FOR e DES, ataques contra têm vantagem e resistência a todo dano. Só magia (Restauração Maior) desfaz.
  petrificado: {
    name: 'Petrificado',
    desc: 'Virou pedra. Incapacitado, sem movimento, falha automática em FOR e DES; ataques contra têm vantagem; resistência a todo dano. Só Restauração Maior desfaz.',
    incapacitated: true,
    speed: 0,
    attackedAdvantage: true,
    autoFailSaves: ['str', 'dex'],
    resisteTudo: true,
  },
  // Quem falhou no olhar por menos de 5 começa a virar pedra: contido até o fim do próximo turno, quando testa de novo.
  petrificando: {
    name: 'Virando pedra',
    desc: 'A carne endurece: contido. No fim do próximo turno, Constituição de novo — falhou, vira pedra; passou, volta ao normal.',
    speed: 0,
    attackDisadvantage: true,
    attackedAdvantage: true,
    saveDisadvantage: ['dex'],
  },
  // De olhos desviados da medusa (o jogador decide, `useFeature('desviarOlhar')`): não faz o teste do olhar, mas não a
  // vê. Ataca a medusa com desvantagem, e ela o ataca com vantagem (`attackModifiers`). Vale até o começo do próximo turno.
  olhosDesviados: {
    name: 'Olhos desviados',
    desc: 'Não olha para a medusa: escapa do olhar, mas ataca a medusa com desvantagem e ela o ataca com vantagem.',
    expiresAtTurnStart: true,
  },
  // A PODRIDÃO DA MÚMIA (Cripta dos Talhund): não recupera PV até tirarem a maldição.
  podridaoDaMumia: {
    name: 'Podridão da múmia',
    desc: 'Maldição: não recupera pontos de vida, e a cada descanso longo (as 24 horas do livro) perde 3d6 de PV máximo. A zero, morre e vira pó. Até alguém a tirar (Remover Maldição).',
    semCura: true,
  },
  // POSSUÍDO por um fantasma: o corpo é dele. Incapacitado; no começo do turno, o fantasma usa o corpo contra um aliado.
  possuido: {
    name: 'Possuído',
    desc: 'Um fantasma tomou o corpo: incapacitado, e o corpo ataca os próprios aliados. Acaba quando o corpo cai a 0 PV.',
    incapacitated: true,
  },
  // A PRESSA DO GOLEM DE ARGILA: +2 de CA e vantagem em Destreza, até o fim do próximo turno dele.
  pressaDoGolem: {
    name: 'Pressa',
    desc: '+2 de CA, vantagem nas resistências de Destreza e uma pancada a mais como ação bônus.',
    acBonus: 2,
    vantagemDex: true,
  },
  contido: {
    name: 'Contido',
    desc: 'Deslocamento 0. Desvantagem em ataques e em resistências de DES. Ataques contra têm vantagem.',
    speed: 0,
    attackDisadvantage: true,
    attackedAdvantage: true,
    saveDisadvantage: ['dex'],
  },
  // Golpe Constritor: o mesmo aperto do `contido`, mas num registro à parte,
  // para não sobrescrever nem soltar a Teia ou o Emaranhar do mesmo alvo.
  presoPorVinhas: {
    name: 'Preso pelas vinhas',
    desc: 'Deslocamento 0. Desvantagem em ataques e em resistências de DES. Ataques contra têm vantagem. As vinhas ferem no começo do seu turno.',
    speed: 0,
    attackDisadvantage: true,
    attackedAdvantage: true,
    saveDisadvantage: ['dex'],
  },
  esquivando: {
    name: 'Esquivando',
    desc: 'Ataques contra você têm desvantagem. Vantagem em testes de resistência de DES.',
    attackedDisadvantage: true,
    expiresAtTurnStart: true,
  },
  // A LIDERANÇA do cavaleiro: a mesma conta da Bênção, com outra fonte (as duas somam).
  lideranca: {
    name: 'Liderança',
    desc: 'As ordens de um líder: soma 1d4 às jogadas de ataque e aos testes de resistência por 1 minuto.',
    attackBonusDice: '1d4',
    saveBonusDice: '1d4',
  },
  abencoado: {
    name: 'Abençoado',
    desc: 'Some 1d4 às jogadas de ataque e aos testes de resistência.',
    attackBonusDice: '1d4',
    saveBonusDice: '1d4',
    concentrationEffect: true,
  },
  // ATAQUE DESCUIDADO: o bárbaro troca defesa por acerto. A vantagem nos
  // ataques DELE é lida em `attackModifiers`; esta condição é o preço —
  // quem o ataca também tem vantagem, até o próximo turno dele.
  descuidado: {
    name: 'Descuidado',
    desc: 'Ataca com vantagem, e quem o ataca também tem vantagem — até o seu próximo turno.',
    attackedAdvantage: true,
  },
  // INSPIRAÇÃO BÁRDICA. O dado vai no bolso de quem recebe e sai no primeiro
  // ataque, teste ou resistência que ele escolher gastar — por isso os três
  // `consumida*` juntos: o motor tira a condição no primeiro dos três que
  // acontecer. O tamanho do dado cresce com o nível do bardo, então ele vem
  // em `data.dado` em vez de escrito aqui.
  inspirado: {
    name: 'Inspirado',
    desc: 'Soma o dado da Inspiração Bárdica num ataque, teste ou resistência — o primeiro que você quiser.',
    // O dado cresce com o nível do bardo (d6, d8, d10, d12), então ele vem
    // na instância (`data.dado`) e não escrito aqui.
    dadoNaData: true,
    consumidaAoAtacar: true,
    consumidaNaResistencia: true,
    consumidaNoTeste: true,
  },
  // A FÚRIA do bárbaro. O que o SRD dá, posto nos campos que o motor já
  // sabe ler: vantagem em teste E resistência de Força (`vantagemTeste` vale
  // para os dois), e resistência aos três danos físicos. O bônus de dano não
  // cabe aqui porque depende do nível do bárbaro e só vale no corpo a corpo
  // com Força — isso o combate resolve, em `resolveAttack`.
  furia: {
    name: 'Fúria',
    desc: 'Vantagem em testes e resistências de FOR, bônus no dano corpo a corpo com FOR e resistência a dano de concussão, perfurante e cortante — de qualquer fonte, inclusive queda e magia. Um minuto; acaba antes se você passar um turno sem atacar nem apanhar, se cair inconsciente ou quando o combate termina. Entrar em Fúria derruba a concentração, e não se entra de armadura pesada. (O jogo ainda não BLOQUEIA conjurar em Fúria: nenhum bárbaro do elenco conjura, então a regra não tem como aparecer.)',
    vantagemTeste: ['str'],
    // A lista canonica, nao uma copia: a Furia resistia a 'contundente'
    // enquanto as armas causavam 'concussão', e por isso nao resistia a nada
    // que uma arma de pancada fizesse.
    resiste: DANOS_FISICOS,
  },
  lento: {
    name: 'Lento',
    desc: 'Deslocamento reduzido em 3 m.',
    speedPenaltyFt: 10,
  },
  // O espelho de `abencoado`, e por isso escrito igual: mesma estrutura,
  // mesmo dado, sinal trocado. Um efeito que subtrai escrito de outro jeito
  // seria a maneira mais rápida de os dois divergirem.
  amaldicoado: {
    name: 'Amaldiçoado',
    desc: 'Subtrai 1d4 das jogadas de ataque e dos testes de resistência.',
    attackPenaltyDice: '1d4',
    savePenaltyDice: '1d4',
    concentrationEffect: true,
  },

  // Raio Guiado: o próximo ataque contra o alvo tem vantagem, e a marca some
  // nesse ataque (`consumidaAoSerAtacado`).
  iluminado: {
    name: 'Iluminado',
    desc: 'O próximo ataque contra você tem vantagem.',
    attackedAdvantage: true,
    consumidaAoSerAtacado: true,
  },
  // Toque Arrepiante num morto-vivo: desvantagem nos ataques contra quem o
  // conjurou (lido em `attackModifiers`, pelo `source`).
  arrepiado: {
    name: 'Arrepiado',
    desc: 'Desvantagem nos ataques contra quem conjurou o Toque Arrepiante.',
  },
  // Toque Arrepiante: nenhuma cura funciona enquanto durar.
  semCura: {
    name: 'Sem cura',
    desc: 'Não recupera pontos de vida.',
    semCura: true,
  },
  // Resistência (truque): 1d4 no próximo teste de resistência, e acaba.
  resistente: {
    name: 'Resistente',
    desc: 'Soma 1d4 no próximo teste de resistência.',
    saveBonusDice: '1d4',
    consumidaNaResistencia: true,
    concentrationEffect: true,
  },

  // REGRA DA CASA — não é SRD. No 5e, dano de fogo não incendeia ninguém.
  // Aqui magias de fogo podem pegar: a criatura sofre 1d4 no início do turno
  // dela. Controlado por HOUSE_RULES.ignite em combat.js.
  // ---- magias de 2º e 3º círculo ------------------------------------------
  // SUBMERSO (o polvo da Onda Eco, no Obelisco: quem começa o turno na água funda e falha em Força CD 10 afunda).
  // Leitura simples da luta debaixo d'água do livro: ataques com desvantagem, e ninguém fala — magia com componente
  // verbal não sai (`combat.js canCast`). Sai quando a criatura deixa a água funda.
  submerso: {
    name: 'Submerso',
    desc: "Debaixo d'água: ataques com desvantagem e nada de magia que pede fala. Sai ao deixar a água funda.",
    attackDisadvantage: true,
  },
  cego: {
    name: 'Cego',
    desc: 'Não enxerga. Desvantagem nos ataques; ataques contra ele têm vantagem.',
    attackDisadvantage: true,
    attackedAdvantage: true,
  },
  borrado: {
    name: 'Borrado',
    desc: 'O contorno treme e se desfaz: ataques contra ele têm desvantagem.',
    attackedDisadvantage: true,
    concentrationEffect: true,
  },
  ajudado: {
    name: 'Ajudado',
    desc: 'Pontos de vida máximos e atuais aumentados pela magia Ajuda.',
  },
  lentificado: {
    name: 'Lentificado',
    desc: '−2 na CA e nas resistências de DES, metade do deslocamento, sem reações, só um ataque, e no turno usa a ação OU a ação bônus.',
    acBonus: -2,
    saveFixo: { dex: -2 },
    // MÁGICO, e por isso num campo próprio: a Liberdade de Movimento barra a
    // metade que vem de magia, e não a que vem da exaustão.
    speedHalfMagico: true,
    semReacao: true,
    acaoOuBonus: true,
    umAtaque: true,
    concentrationEffect: true,
  },
  // BANIMENTO: fora do jogo até a concentração acabar (a mesma lógica de quem está no Plano Etéreo).
  banido: {
    name: 'Banido',
    desc: 'Foi mandado a um semiplano: não age, não pode ser alvo, e volta quando a magia acaba.',
    incapacitated: true,
    inalcancavel: true,
    motivoInalcancavel: 'foi banido para outro plano',
    concentrationEffect: true,
  },
  // PELE DE PEDRA: resistência a dano físico que não seja mágico.
  peleDePedra: {
    name: 'Pele de Pedra',
    desc: 'Resistência a dano cortante, perfurante e de concussão que não seja mágico.',
    resisteNaoMagico: DANOS_FISICOS,
    concentrationEffect: true,
  },
  // CORPO VAZIO (monge, 18º): resistência a todo dano, menos energético. A invisibilidade vai numa condição à parte.
  corpoVazio: {
    name: 'Corpo Vazio',
    desc: 'Invisível, com resistência a todo dano exceto energético, por um minuto.',
    resiste: ['cortante', 'perfurante', 'concussão', 'fogo', 'frio', 'elétrico', 'trovejante', 'ácido', 'veneno', 'necrótico', 'radiante', 'psíquico'],
  },
  // ARMA SAGRADA (paladino da Devoção, 3º): soma o Carisma aos ataques, por um minuto. O valor mora na `data.bonus`.
  armaSagrada: {
    name: 'Arma Sagrada',
    desc: 'Soma o modificador de Carisma às jogadas de ataque e a arma emite luz.',
    bonusDeAtaqueNaData: true,
  },
  // NIMBO SAGRADO (paladino da Devoção, 20º): luz do sol que fere inimigos por perto e protege contra magia de corruptores e mortos-vivos.
  nimboSagrado: {
    name: 'Nimbo Sagrado',
    desc: 'Aura de luz: quem começa o turno a até 9 m sofre 10 radiante; vantagem contra magias de corruptores e mortos-vivos.',
  },
  // CONTRACANTO (bardo, 6º): vantagem contra medo e encantamento, lida em `passivas.js` (`vantagemPorTraco`).
  contracanto: {
    name: 'Contraencanto',
    desc: 'Vantagem nas resistências contra amedrontado e enfeitiçado, até o fim do próximo turno do bardo.',
  },
  // TÉCNICA DA MÃO ABERTA: não pode tomar reações até o fim do próximo turno do monge.
  semReacoesDaMao: {
    name: 'Sem reações',
    desc: 'Não pode tomar reações até o fim do próximo turno do monge que o acertou.',
    semReacao: true,
  },
  hipnotizado: {
    name: 'Hipnotizado',
    desc: 'Preso às cores do padrão: incapacitado e parado. Sofrer dano o desperta.',
    incapacitated: true,
    speed: 0,
    acordaComDano: true,
    concentrationEffect: true,
  },

  // ---- truques e 1º círculo dos heróis -------------------------------------
  // A LÂMINA PSÍQUICA do comandante goblin (o Obelisco): o próximo ataque OU teste de resistência perde 1d4, e a marca
  // some no primeiro dos dois, ou no fim do turno seguinte do goblin.
  laminaPsiquica: {
    name: 'Lâmina Psíquica',
    desc: 'Subtrai 1d4 do próximo ataque ou teste de resistência (o que vier primeiro).',
    attackPenaltyDice: '1d4',
    savePenaltyDice: '1d4',
    consumidaAoAtacar: true,
    consumidaNaResistencia: true,
  },
  // A COROA PSIÔNICA do ashenwight psiônico (o Obelisco): enfeitiçado por 1 minuto, com o pensamento lento — sem
  // reações, metade do deslocamento e 2d8 psíquicos no começo de cada turno; repete Sabedoria no fim de cada turno.
  coroaPsionica: {
    name: 'Coroa Psiônica',
    desc: 'Enfeitiçado por quem pôs a coroa: sem reações, metade do deslocamento, 2d8 psíquicos no começo de cada turno. Repete a resistência no fim do turno.',
    semReacao: true,
    speedHalfMagico: true,
  },
  // A DOENÇA DA MORDIDA DO OTYUGH (SRD): envenenado até a cura. A cada descanso longo (as 24 horas do livro), Constituição
  // CD 15: passa e cura; falha e o PV máximo cai 1d10 até a cura (`descanso.js`).
  doencaDoOtyugh: {
    name: 'Doente',
    desc: 'A mordida do otyugh: desvantagem em ataques e testes. A cada descanso longo, Constituição CD 15 cura; falha tira 1d10 do PV máximo até a cura.',
    attackDisadvantage: true,
  },
  // A GÊMULA GRUDADA (o Obelisco): 3d4 perfurante no começo de cada turno (`combat.js inicioDoTurnoDoBloco`). Sai com a
  // ação de escapar (a CD 15 de Força do livro) ou quando a gêmula morre ou cai (`soltarAgarroesDe`, pela `escape`).
  sanguessuga: {
    name: 'Gêmula grudada',
    desc: 'Uma gêmula encefálica grudada no corpo: 3d4 perfurante no começo de cada turno. Arrancá-la é a ação de escapar (Força CD 15).',
  },
  // O guardião-escudo sem o mestre: parado, sem ordem nenhuma.
  inerte: {
    name: 'Inerte',
    desc: 'Sem quem o comande, não age.',
    incapacitated: true,
  },
  // Incapacitado e nada mais (o Rasgo Sináptico do comandante goblin): não age nem reage, mas anda e não cai.
  incapacitado: {
    name: 'Incapacitado',
    desc: 'Não pode fazer ações nem reações.',
    incapacitated: true,
  },
  zombado: {
    name: 'Zombado',
    desc: 'Desvantagem no próximo ataque.',
    attackDisadvantage: true,
    consumidaAoAtacar: true,
  },
  casca: {
    name: 'Pele de Árvore',
    desc: 'A pele dura como casca: CA nunca abaixo de 16.',
    caMinima: 16,
    concentrationEffect: true,
  },
  armaMagica: {
    name: 'Arma Mágica',
    desc: '+1 no ataque e no dano com a arma, que conta como mágica.',
    bonusArma: 1,
    concentrationEffect: true,
  },
  armaElemental: {
    name: 'Arma Elemental',
    desc: '+1 no ataque, +1d4 do tipo escolhido no dano, e a arma conta como mágica.',
    bonusArma: 1,
    danoNoAcerto: { dados: '1d4', tipo: null },
    concentrationEffect: true,
  },
  golpeMarcante: {
    name: 'Golpe Marcante',
    desc: 'O próximo acerto com arma: +2d6 radiante.',
    golpe: { dados: '2d6', tipo: 'radiante', alcance: 'qualquer', efeito: null },
  },
  golpeCegante: {
    name: 'Golpe Cegante',
    desc: 'O próximo acerto corpo a corpo com arma: +3d8 radiante e CD de CON ou cego.',
    golpe: { dados: '3d8', tipo: 'radiante', alcance: 'perto', efeito: 'cega' },
  },
  enfraquecido: {
    name: 'Enfraquecido',
    desc: 'Golpes de Força causam metade do dano. Repete CON no fim do turno.',
    concentrationEffect: true,
  },
  rogado: {
    name: 'Rogar Maldição',
    desc: 'Quem amaldiçoou causa 1d8 necrótico a mais em cada acerto.',
    marcaDano: { dados: '1d8', tipo: 'necrótico', soArma: false },
    concentrationEffect: true,
  },
  contraVeneno: {
    name: 'Proteção contra Veneno',
    desc: 'Resistência a veneno.',
    resiste: ['veneno'],
    imuneA: ['envenenado'],
    removeAoReceber: ['envenenado'],
  },
  protegidoEnergia: {
    name: 'Proteção contra Energia',
    desc: 'Resistência ao tipo de dano escolhido.',
    resisteTipoDado: true,
    concentrationEffect: true,
  },
  metalQuente: {
    name: 'Metal em Brasa',
    desc: 'O metal queima: desvantagem nos ataques.',
    attackDisadvantage: true,
  },
  acelerado: {
    name: 'Acelerado',
    desc: '+2 de CA, dobro do deslocamento, vantagem em DES e uma ação a mais (um golpe, Disparada, Desengajar ou objeto).',
    acBonus: 2,
    speedMult: 2,
    vantagemDex: true,
    aoAcabar: 'letargico',
    concentrationEffect: true,
  },
  letargico: {
    name: 'Letárgico',
    desc: 'A Velocidade acabou: não anda nem age neste turno.',
    incapacitated: true,
    speed: 0,
  },
  invisivel: {
    name: 'Invisível',
    desc: 'Ataca com vantagem e é atacado com desvantagem. Atacar ou conjurar contra alguém desfaz.',
    concentrationEffect: true,
  },
  imagens: {
    name: 'Imagem Espelhada',
    desc: 'Cópias ilusórias que tomam ataques no seu lugar.',
  },
  nauseado: {
    name: 'Nauseado',
    desc: 'Engasgado na Nuvem Fétida: perde a ação deste turno.',
    perdeAcao: true,
  },
  acidoAtrasado: {
    name: 'Ácido',
    desc: 'Mais ácido no fim do próximo turno.',
  },
  enfeiticado: {
    name: 'Enfeitiçado',
    desc: 'Não ataca quem o enfeitiçou. Dano de quem o enfeitiçou, ou dos aliados dele, desfaz.',
  },
  esperanca: {
    name: 'Farol de Esperança',
    desc: 'Vantagem em resistências de SAB e testes de morte; toda cura sai no máximo.',
    vantagemSab: true,
    vantagemMorte: true,
    curaMaxima: true,
    concentrationEffect: true,
  },
  maresDoCaos: {
    name: 'Marés do Caos',
    desc: 'Vantagem na próxima jogada de ataque ou resistência.',
    consumidaAoAtacar: true,
  },
  desordemEntropica: {
    name: 'Desordem Entrópica',
    desc: 'O atacante que errou o feiticeiro do Grande Antigo dá a ele vantagem no próximo ataque contra ele.',
  },
  regenCaos: {
    name: 'Luz Restauradora',
    desc: 'Recupera 5 PV no começo de cada turno seu.',
  },
  escudoEspectral: {
    name: 'Escudo Espectral',
    desc: '+2 de CA.',
    acBonus: 2,
  },
  duplicidade: {
    name: 'Duplicidade',
    desc: 'Uma cópia ilusória sua luta ao seu lado: seus ataques contra quem está colado nela e em você têm vantagem.',
  },
  coroaDeLuz: {
    name: 'Coroa de Luz',
    desc: 'Luz do sol a até 18 m: as criaturas nela têm desvantagem nas resistências contra magias de fogo e radiantes.',
  },
  campeaoAnciao: {
    name: 'Campeão Ancestral',
    desc: 'Recupera 10 PV no começo de cada turno seu, por um minuto.',
  },
  passoSombrio: {
    name: 'Passo das Sombras',
    desc: 'O primeiro ataque corpo a corpo deste turno tem vantagem.',
  },
  olharHipnotico: {
    name: 'Olhar Hipnótico',
    desc: 'Incapacitado e sem andar, até o fim do próximo turno de quem o hipnotizou ou até sofrer dano.',
    incapacitated: true,
    speed: 0,
    acordaComDano: true,
  },
  provocado: {
    name: 'Provocado',
    desc: 'Desvantagem nos ataques contra qualquer um que não seja quem o provocou (Ataque Provocador).',
  },
  distraido: {
    name: 'Distraído',
    desc: 'O próximo ataque de um aliado de quem o distraiu tem vantagem (Ataque Distrativo).',
  },
  // SURTOS de magia selvagem (surto.js).
  surtoRepetido: {
    name: 'Surto Persistente',
    desc: 'Rola um novo surto de magia selvagem no começo de cada turno seu (Surto de Magia Selvagem).',
  },
  // OS BESTIÁRIOS DOS LIVROS (o Monster Manual): as condições que os blocos importados pedem.
  // A tagarelice da boca tagarela e o olhar do brutamonte umbral: no começo do turno, um d8 decide o que a criatura faz.
  desnorteado: {
    name: 'Desnorteado',
    desc: 'Sem reações até o começo do próximo turno. Neste turno, um d8 decide: 1 a 4, não faz nada; 5 ou 6, não age e anda o deslocamento inteiro para um lado qualquer; 7 ou 8, golpeia de perto alguém ao acaso que alcance, ou não faz nada.',
    semReacao: true,
  },
  // O Sopro de Euforia do dragão feérico: um minuto, e um d6 no começo de cada turno.
  euforico: {
    name: 'Eufórico',
    desc: 'Sem reações. No começo de cada turno, um d6: 1 a 4, não age e anda o deslocamento inteiro para um lado qualquer; 5 ou 6, não sai do lugar e só pode tentar Sabedoria para se livrar. Dura um minuto.',
    semReacao: true,
  },
  // AS MAGIAS DO PHB (`magias-livro-phb.js`): as condições que elas põem.
  dominado: {
    name: 'Dominado',
    desc: 'Enfeitiçado e comandado: no começo do turno, golpeia um antigo aliado ao alcance (ou anda até um) e não faz mais nada. A cada dano que sofre, repete a resistência de Sabedoria.',
    repeteAoSofrerDano: true,
    concentrationEffect: true,
  },
  dancando: {
    name: 'Dançando',
    desc: 'Dança sem parar no lugar: não anda, desvantagem nos ataques e nas resistências de Destreza, e quem o ataca tem vantagem. Com a ação, repete Sabedoria.',
    speed: 0,
    attackDisadvantage: true,
    attackedAdvantage: true,
    saveDisadvantage: ['dex'],
    concentrationEffect: true,
  },
  debilitado: {
    name: 'Mente Debilitada',
    desc: 'Inteligência e Carisma caem a 1: não conjura, não ativa item mágico, não entende língua nem se comunica. A cada 30 dias repete o teste; Restauração Maior, Cura Completa ou Desejo acabam com isto.',
  },
  banidoDeVez: {
    name: 'Mandado a outro plano',
    desc: 'Foi mandado para outro plano de existência: está fora desta luta.',
    incapacitated: true,
    inalcancavel: true,
    motivoInalcancavel: 'foi mandado para outro plano',
  },
  globo: {
    name: 'Globo de Invulnerabilidade',
    desc: 'Uma barreira de 3 m em volta dele: magia de 5º círculo ou menos lançada de fora não afeta ninguém dentro.',
    concentrationEffect: true,
  },
  escudoDeFogo: {
    name: 'Escudo de Fogo',
    desc: 'Chamas em volta do corpo: resistência a frio, e quem o acerta corpo a corpo a 1,5 m sofre 2d8 de fogo.',
    resiste: ['frio'],
  },
  menteVazia: {
    name: 'Mente Vazia',
    desc: 'Imune a dano psíquico, a ficar enfeitiçado e a ter a mente lida.',
    imuneA: ['enfeiticado', 'dominado', 'sugerido', 'hipnotizado', 'coroaDaLoucura'],
    imuneADanos: ['psíquico'],
  },
  auraSagrada: {
    name: 'Aura Sagrada',
    desc: 'Vantagem em toda resistência, e quem o ataca tem desvantagem.',
    attackedDisadvantage: true,
    saveAdvantage: ['str', 'dex', 'con', 'int', 'wis', 'cha'],
    concentrationEffect: true,
  },
  golpeAturdidor: {
    name: 'Golpe Atordoante',
    desc: 'O próximo acerto corpo a corpo com arma: +4d6 psíquico, e Sabedoria ou cambaleia.',
    golpe: { dados: '4d6', tipo: 'psíquico', alcance: 'perto', efeito: 'cambaleia' },
  },
  cambaleante: {
    name: 'Cambaleante',
    desc: 'Desvantagem nos ataques e nos testes de atributo, e sem reações, até o fim do próximo turno.',
    attackDisadvantage: true,
    desvantagemSoTeste: ['str', 'dex', 'con', 'int', 'wis', 'cha'],
    semReacao: true,
  },
  tempoParado: {
    name: 'Tempo Parado',
    desc: 'O tempo para para os outros: ele age 1d4 + 1 turnos seguidos. Acaba se ferir ou afetar outra criatura.',
  },
  // As magias de exploração do PHB.
  enlouquecido: {
    name: 'Enlouquecido',
    desc: 'A mente foi longe demais (Contatar Outro Plano): não age, não entende o que lê nem o que ouve, e fala sem sentido. Até o descanso longo.',
    incapacitated: true,
  },
  banqueteDosHerois: {
    name: 'Banquete de Heróis',
    desc: 'Comeu o banquete: imune a medo e a veneno, vantagem nas resistências de Sabedoria, e PV máximo a mais. Vinte e quatro horas.',
    imuneA: ['amedrontado', 'envenenado'],
    imuneADanos: ['veneno'],
    saveAdvantage: ['wis'],
  },
  // A segunda leva do PHB: as magias de combate.
  compelido: {
    name: 'Compelido',
    desc: 'No começo do turno, gasta o deslocamento inteiro andando para longe de quem o compeliu; a ação segue dele. Repete Sabedoria no fim de cada turno.',
    concentrationEffect: true,
  },
  enjaulado: {
    name: 'Enjaulado',
    desc: 'Preso numa jaula de força invisível: não sai dela. Golpe e magia passam pelas grades.',
    speed: 0,
  },
  esferaResiliente: {
    name: 'Esfera Resiliente',
    desc: 'Preso numa esfera de força: nada de fora o atinge e ele não atinge nada de fora.',
    inalcancavel: true,
    motivoInalcancavel: 'está dentro de uma esfera de força',
    concentrationEffect: true,
  },
  labirinto: {
    name: 'No Labirinto',
    desc: 'Mandado a um labirinto de outro plano: fora da luta. No turno, gasta a ação tentando sair (Inteligência CD 20).',
    inalcancavel: true,
    motivoInalcancavel: 'está perdido num labirinto',
    concentrationEffect: true,
  },
  conchaAntivida: {
    name: 'Concha Antivida',
    desc: 'Uma barreira de 3 m em volta dele: quem não é morto-vivo nem constructo não entra nem alcança através dela.',
    concentrationEffect: true,
  },
  auraDeVida: {
    name: 'Aura de Vida',
    desc: 'Ele e os aliados a 9 m resistem a necrótico; o aliado caído ali volta com 1 PV no começo do turno.',
    concentrationEffect: true,
  },
  auraDePureza: {
    name: 'Aura de Pureza',
    desc: 'Ele e os aliados a 9 m resistem a veneno e têm vantagem contra cegueira, encanto, surdez, medo, paralisia, veneno e atordoamento.',
    concentrationEffect: true,
  },
  circuloDePoder: {
    name: 'Círculo de Poder',
    desc: 'Ele e os aliados a 9 m têm vantagem contra magia, e quem passa numa resistência de metade do dano não sofre nada.',
    concentrationEffect: true,
  },
  campoAntimagia: {
    name: 'Campo Antimagia',
    desc: 'Uma esfera de 3 m em volta dele em que magia não funciona: ninguém conjura dentro, nem é alvo de magia.',
    concentrationEffect: true,
  },
  dissiparBemEMal: {
    name: 'Dissipar o Bem e o Mal',
    desc: 'Celestiais, elementais, fadas, corruptores e mortos-vivos o atacam com desvantagem.',
    concentrationEffect: true,
  },
  presciencia: {
    name: 'Presciência',
    desc: 'Vê o que vem: vantagem nos ataques, nos testes e nas resistências, e quem o ataca tem desvantagem. Oito horas.',
    vantagemNosAtaques: true,
    attackedDisadvantage: true,
    vantagemTeste: ['str', 'dex', 'con', 'int', 'wis', 'cha'],
    saveAdvantage: ['str', 'dex', 'con', 'int', 'wis', 'cha'],
  },
  golpeBanidor: {
    name: 'Destruição Banidora',
    desc: 'O próximo acerto com arma: +5d10 energético, e se o alvo ficar com 50 PV ou menos, é banido enquanto durar a concentração.',
    golpe: { dados: '5d10', tipo: 'energético', alcance: 'qualquer', efeito: 'bane' },
  },
  aljavaVeloz: {
    name: 'Aljava Veloz',
    desc: 'O primeiro tiro de arma do turno puxa mais dois, de ação bônus.',
    concentrationEffect: true,
  },
  // A Maldição Vil do semilich.
  malditoVil: {
    name: 'Maldição Vil',
    desc: 'Amaldiçoado: desvantagem nas jogadas de ataque e em toda resistência. Repete Sabedoria no fim de cada turno.',
    attackDisadvantage: true,
    saveDisadvantage: ['str', 'dex', 'con', 'int', 'wis', 'cha'],
  },
  // O Raio Confuso do espectador: até o fim do próximo turno.
  raioConfuso: {
    name: 'Confuso',
    desc: 'Sem reações. No turno, não anda e usa a ação para atacar alguém sorteado ao alcance; sem ninguém, não faz nada.',
    semReacao: true,
  },
  // O Fortalecer do empíreo: até o fim do próximo turno dele.
  reforcado: {
    name: 'Fortalecido',
    desc: 'Não pode ser enfeitiçado nem amedrontado, e tem vantagem nos testes de atributo e nas resistências.',
    vantagemTeste: ['str', 'dex', 'con', 'int', 'wis', 'cha'],
    saveAdvantage: ['str', 'dex', 'con', 'int', 'wis', 'cha'],
  },
  // A Energia Negativa do senhor das múmias.
  semCuraNegativa: {
    name: 'Energia negativa',
    desc: 'Não recupera pontos de vida até o fim do próximo turno de quem a soltou.',
    semCura: true,
  },
  // O Escudo Cintilante do unicórnio.
  escudoCintilante: {
    name: 'Escudo Cintilante',
    desc: '+2 de CA até o fim do próximo turno de quem o deu.',
    acBonus: 2,
  },
  // O Grito de Guerra do chefe orc: vantagem nos golpes até o começo do próximo turno dele.
  gritoDeGuerra: {
    name: 'Grito de Guerra',
    desc: 'Vantagem nas jogadas de ataque até o começo do próximo turno de quem gritou.',
  },
  // O Aumentar do duergar: Grande, o dobro dos dados no golpe de Força, vantagem em Força.
  aumentoDuergar: {
    name: 'Aumentado',
    desc: 'Cresceu até Grande: o dobro dos dados de dano nos golpes de Força, e vantagem nos testes e nas resistências de Força.',
    vantagemTeste: ['str'],
  },
  // A Maldição do Olho Maligno do fomoriano: até alguém a tirar.
  deformado: {
    name: 'Deformado',
    desc: 'Maldição: o corpo se retorce. Metade do deslocamento, e desvantagem nos testes e nas resistências de Força e de Destreza. Até alguém a tirar (Remover Maldição).',
    speedHalfMagico: true,
    desvantagemTeste: ['str', 'dex'],
  },
  // O Toque Inebriante da lâmia: uma hora.
  amaldicoadoLamia: {
    name: 'Inebriado',
    desc: 'Maldição de uma hora: desvantagem nas resistências de Sabedoria e em todo teste de atributo.',
    desvantagemTeste: ['wis'],
    desvantagemSoTeste: ['str', 'dex', 'con', 'int', 'wis', 'cha'],
  },
  // O segundo rugido da androesfinge.
  surdo: {
    name: 'Surdo',
    desc: 'Não ouve nada: falha em todo teste que dependa de ouvir, e não ouve quem fala com ele.',
  },
  // Engolido (o sapo gigante, o behir, o verme púrpura) ou engolfado (o cubo gelatinoso): está DENTRO de outra criatura.
  engolido: {
    name: 'Engolido',
    desc: 'Dentro de outra criatura: cego e contido, e nada de fora o alcança. Sofre o ácido dela no começo de cada turno dela. Só golpeia quem o engoliu. Sai quando ela morre (ou quando ela o vomita).',
    attackDisadvantage: true,
    speed: 0,
    inalcancavel: true,
    motivoInalcancavel: 'está dentro de outra criatura',
  },
  // A Deficiência ao Cair do flumph: caiu de costas.
  deCostas: {
    name: 'De costas',
    desc: 'Caiu de costas e não consegue se virar: incapacitado. No fim de cada turno, Destreza CD 10 para se endireitar.',
    incapacitated: true,
  },
  // Congelar, do elemental da água: o frio o endurece.
  congelado: {
    name: 'Meio congelado',
    desc: 'O frio o endureceu: 6 m a menos de deslocamento até o fim do próximo turno.',
    speedPenaltyFt: 20,
  },
  // As três cópias ilusórias do espreitador (Fantasmas): somem na luz plena.
  fantasmas: {
    name: 'Fantasmas',
    desc: 'Três cópias ilusórias dele o acompanham: quem o mira sorteia entre ele e as cópias. Cada cópia acertada some; somem todas na luz plena.',
  },
  confuso: {
    name: 'Confuso',
    desc: 'Sem reações e com desvantagem nos ataques (a Confusão do livro sorteia o que a criatura faz; o jogo usa este resumo).',
    semReacao: true,
    attackDisadvantage: true,
  },
  vasoDePlanta: {
    name: 'Vaso de Planta',
    desc: 'Incapacitado e vulnerável a todo dano até o começo do próximo turno (Surto de Magia Selvagem).',
    incapacitated: true,
    vulnerabilidadeTotal: true,
  },
  ovelha: {
    name: 'Ovelha',
    desc: 'Virou ovelha: incapacitado por um minuto (Polimorfia em si mesmo, num surto).',
    incapacitated: true,
  },
  resistenciaTotal: {
    name: 'Resistência a Tudo',
    desc: 'Resistência a todo tipo de dano por um minuto (Surto de Magia Selvagem).',
    resisteTudo: true,
  },
  vulnerabilidadePerfurante: {
    name: 'Vulnerável a Perfurante',
    desc: 'Sofre o dobro de dano perfurante por um minuto (Surto de Magia Selvagem).',
    vulnerabilidade: ['perfurante'],
  },
  passoDoCaos: { name: 'Passo do Caos', desc: 'Ação bônus: teleporta até 6 m (Surto de Magia Selvagem).' },
  tamanhoCaos: { name: 'Maior', desc: 'Uma categoria de tamanho acima por um minuto (Surto de Magia Selvagem).' },
  bencaoTrapaceiro: { name: 'Bênção do Trapaceiro', desc: 'Vantagem em Furtividade por uma hora (clérigo da Enganação).' },
  // A VISÃO DE DUMATHOIN (a bênção da Cripta dos Talhund): visão verdadeira de 36 m por um minuto.
  visaoVerdadeira: { name: 'Visão verdadeira', desc: 'Vê o invisível, no escuro e através de ilusões, a até 36 m (a bênção de Dumathoin).' },
  veInvisiveis: { name: 'Vê o Invisível', desc: 'Enxerga criaturas invisíveis (Surto de Magia Selvagem).' },
  olhoDoCaos: { name: 'Olho do Caos', desc: 'Um olho na testa: vantagem em Percepção pela visão (Surto de Magia Selvagem).' },
  reencarnar: { name: 'Reencarnação Pendente', desc: 'Se morrer, volta à vida como se reencarnado (Surto de Magia Selvagem).' },
  brilhoCaos: { name: 'Brilho do Caos', desc: 'Luz forte a 9 m: quem termina o turno a 1,5 m fica cego até o fim do próximo turno dele (Surto de Magia Selvagem).' },
  desarmado: {
    name: 'Desarmado',
    desc: 'Largou a arma: desvantagem em todos os ataques (Ataque Desarmante).',
    attackDisadvantage: true,
  },
  manobrado: {
    name: 'Reposicionado',
    desc: 'Anda sem provocar ataque de oportunidade de quem o Ataque Estratégico marcou.',
  },
  passoEvasivo: {
    name: 'Passo Evasivo',
    desc: 'Soma o dado de superioridade à CA até o fim do turno.',
    acNaData: true,
  },
  paralisadoDeMedo: {
    name: 'Paralisado de Medo',
    desc: 'Deslocamento 0 até sofrer dano (Repelir o Inimigo). Sem ação de se soltar.',
    speed: 0,
  },
  votoDeInimizade: {
    name: 'Voto de Inimizade',
    desc: 'O paladino da Vingança tem vantagem nos ataques contra esta criatura.',
  },
  alvoCerteiro: {
    name: 'Ataque Certeiro',
    desc: 'O próximo ataque de quem o leu tem vantagem.',
  },
  shillelagh: {
    name: 'Shillelagh',
    desc: 'Clava ou bordão com o atributo de conjuração, 1d8 e mágico.',
  },
  contraLaminas: {
    name: 'Proteção contra Lâminas',
    desc: 'Resistência a dano cortante, perfurante e de concussão de ataques com arma.',
    resiste: DANOS_FISICOS,
    soDeArma: true,
  },
  bruxaria: {
    name: 'Bruxaria',
    desc: 'Quem lançou a maldição causa 1d6 necrótico a mais em cada acerto.',
    marcaDano: { dados: '1d6', tipo: 'necrótico', soArma: false },
  },
  marcaDoCacador: {
    name: 'Marca do Caçador',
    desc: 'Quem marcou causa 1d6 a mais em cada acerto com arma.',
    marcaDano: { dados: '1d6', tipo: null, soArma: true },
  },
  escudoArcano: {
    name: 'Escudo Arcano',
    desc: '+5 de CA até o começo do próximo turno; Míssil Mágico não fere.',
    acBonus: 5,
    bloqueiaMissil: true,
  },
  agathys: {
    name: 'Armadura de Agathys',
    desc: 'Enquanto houver PV temporários, quem acerta corpo a corpo sofre frio.',
  },
  gargalhando: {
    name: 'Gargalhando',
    desc: 'Caído de rir: incapacitado. Repete o teste no fim do turno e quando sofre dano.',
    incapacitated: true,
    speed: 0,
    repeteAoSofrerDano: true,
    concentrationEffect: true,
  },
  heroico: {
    name: 'Heroico',
    desc: 'Imune a medo; PV temporários no começo de cada turno.',
    imuneA: ['amedrontado'],
    concentrationEffect: true,
  },
  feerico: {
    name: 'Fogo das Fadas',
    desc: 'Brilhando: ataques contra ele têm vantagem.',
    attackedAdvantage: true,
    concentrationEffect: true,
  },
  comandado: {
    name: 'Comandado',
    desc: 'Obedece "Ajoelhe!": cai e perde o próximo turno.',
  },
  santuario: {
    name: 'Santuário',
    desc: 'Quem tenta atacá-lo faz CD de SAB ou perde o ataque.',
  },
  escudoDaFe: {
    name: 'Escudo da Fé',
    desc: '+2 de CA.',
    acBonus: 2,
    concentrationEffect: true,
  },
  favorDivino: {
    name: 'Favor Divino',
    desc: 'Ataques com arma causam 1d4 radiante a mais.',
    danoNoAcerto: { dados: '1d4', tipo: 'radiante' },
    concentrationEffect: true,
  },
  golpeTrovejante: {
    name: 'Golpe Trovejante',
    desc: 'O próximo acerto corpo a corpo com arma: +2d6 trovejante, empurra e derruba.',
    golpe: { dados: '2d6', tipo: 'trovejante', alcance: 'perto', efeito: 'empurra' },
  },
  golpeAbrasador: {
    name: 'Golpe Abrasador',
    desc: 'O próximo acerto corpo a corpo com arma: +1d6 de fogo e o alvo pega fogo.',
    golpe: { dados: '1d6', tipo: 'fogo', alcance: 'perto', efeito: 'chamusca' },
  },
  golpeColerico: {
    name: 'Golpe Colérico',
    desc: 'O próximo acerto corpo a corpo com arma: +1d6 psíquico e medo.',
    golpe: { dados: '1d6', tipo: 'psíquico', alcance: 'perto', efeito: 'assusta' },
  },
  saraivada: {
    name: 'Saraivada de Espinhos',
    desc: 'O próximo acerto à distância com arma faz brotar espinhos em volta do alvo.',
    golpe: { dados: '1d10', tipo: 'perfurante', alcance: 'distancia', efeito: 'espinhos' },
  },
  duelo: {
    name: 'Duelo Compelido',
    desc: 'Desvantagem para atacar qualquer um que não seja o conjurador, e não se afasta mais de 9 m dele.',
    concentrationEffect: true,
  },
  golpeConstritor: {
    name: 'Golpe Constritor',
    desc: 'O próximo acerto com arma: vinhas prendem o alvo (CD de FOR) e o ferem a cada turno dele.',
    golpe: { dados: '1d6', tipo: 'perfurante', alcance: 'qualquer', efeito: 'constringe' },
  },
  flechaRelampago: {
    name: 'Flecha Relampejante',
    desc: 'O próximo ataque à distância vira um raio: 4d8 elétrico no alvo (metade se errar) e uma explosão em volta.',
    flecha: { alvo: '4d8', explosao: '2d8', tipo: 'elétrico' },
  },
  chamuscado: {
    name: 'Em chamas (Golpe Abrasador)',
    desc: 'No começo de cada turno, CD de CON ou 1d6 de fogo; passar apaga.',
    concentrationEffect: true,
  },
  passosLargos: {
    name: 'Passos Largos',
    desc: '+3 m de deslocamento.',
    speedBonusFt: 10,
  },
  protegidoBemMal: {
    name: 'Proteção contra o Bem e o Mal',
    desc: 'Aberrações, celestiais, elementais, feéricos, corruptores e mortos-vivos atacam com desvantagem.',
    contraTipos: ['aberração', 'celestial', 'elemental', 'fada', 'corruptor', 'morto-vivo'],
    imuneA: ['amedrontado'],
    concentrationEffect: true,
  },

  // ---- lote 10: Luz, Orientação, Aumentar/Reduzir, Elo, Coroa, Calma ----------

  // Luz (truque): quem a carrega acende como uma tocha (`luz.js`, fontesDeLuz).
  luzMagica: {
    name: 'Luz',
    desc: 'Emite luz clara num raio de 6 m e penumbra por mais 6 m, como uma tocha.',
  },
  // Luzes Dançantes (truque): as luzinhas acompanham quem conjurou, mais fracas que uma tocha (`luz.js`).
  luzesDancantes: {
    name: 'Luzes Dançantes',
    desc: 'Luzinhas flutuam junto de você: penumbra num raio de 3 m, só isso.',
    concentrationEffect: true,
  },
  // Orientação (truque): 1d4 no próximo teste de atributo, e acaba.
  orientado: {
    name: 'Orientado',
    desc: 'Soma 1d4 no próximo teste de atributo que fizer.',
    testeBonusDice: '1d4',
    consumidaNoTeste: true,
    concentrationEffect: true,
  },
  // Aumentar/Reduzir: o dano de arma muda em 1d4 (`danoArmaDados`) e a Força
  // ganha vantagem (aumentado) ou desvantagem (reduzido) em testes e resistências.
  aumentado: {
    name: 'Aumentado',
    desc: 'Cresce: +1d4 no dano de arma e vantagem em testes e resistências de Força.',
    danoArmaDados: '1d4',
    vantagemTeste: ['str'],
    concentrationEffect: true,
  },
  reduzido: {
    name: 'Reduzido',
    desc: 'Encolhe: −1d4 no dano de arma (nunca abaixo de 1) e desvantagem em testes e resistências de Força.',
    danoArmaDados: '-1d4',
    desvantagemTeste: ['str'],
    concentrationEffect: true,
  },
  // Elo de Proteção: +1 de CA e nas resistências, resistência a todo dano; o
  // conjurador (o `source`) sofre o mesmo dano (`combat.js`, eloDeProtecao).
  eloDeProtecao: {
    name: 'Elo de Proteção',
    desc: '+1 de CA e nas resistências, resistência a todo dano. Quem conjurou o elo sofre o mesmo dano que você.',
    acBonus: 1,
    saveFixo: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 },
    resisteTudo: true,
  },
  // Coroa da Loucura: a IA do alvo ataca o aliado mais próximo dele (`ai.js`).
  coroaDaLoucura: {
    name: 'Coroa da Loucura',
    desc: 'Enfeitiçado: gasta a ação atacando um aliado seu, escolhido por quem o coroou. Repete a resistência no fim de cada turno.',
    concentrationEffect: true,
  },
  // Acalmar Emoções: `data.modo` é 'suprime' (tirou medo ou encanto) ou
  // 'indiferente' (a IA não ataca até ver o perigo).
  calmo: {
    name: 'Calmo',
    desc: 'Sem medo nem encanto; se estava indiferente, não ataca ninguém até ser ferido ou ver um amigo ferido.',
    imuneA: ['amedrontado', 'enfeiticado', 'hipnotizado', 'coroaDaLoucura'],
    concentrationEffect: true,
  },

  // ---- lote 11: visão no escuro, atributo, ilusão, sugestão, voo ---------------

  // Visão no Escuro (2º círculo): `luz.js` (`visaoNoEscuro`) lê esta condição.
  visaoNoEscuro: {
    name: 'Visão no Escuro',
    desc: 'Enxerga no escuro até 18 m, como se fosse penumbra (a escuridão mágica continua opaca).',
    alcanceFt: 60,
  },
  // Aprimorar Atributo: `data.hab` diz qual atributo ganha vantagem nos TESTES
  // (não nas resistências); `data.opcao` é touro, gato, urso, aguia, raposa ou coruja.
  aprimorado: {
    name: 'Atributo Aprimorado',
    desc: 'Vantagem nos testes de um atributo (e, com a Graça do Gato, nenhum dano de queda; com a Resistência do Urso, PV temporários).',
    vantagemSoTesteDados: true,
    concentrationEffect: true,
  },
  // Força Fantasmagórica: o alvo acredita na ilusão e é ferido por ela no
  // início de cada turno dele (`combat.js`, `ilusaoTick`); gastar a ação num
  // teste de Investigação contra a CD a desfaz (`investigarIlusao`).
  iludido: {
    name: 'Iludido',
    desc: 'Crê numa ilusão que o fere: 1d6 psíquico no início do seu turno. Pode gastar a ação para investigá-la (INT contra a CD).',
    concentrationEffect: true,
  },
  // Sugestão: a IA do alvo abandona a luta e se afasta do grupo (`ai.js`).
  sugerido: {
    name: 'Sugestionado',
    desc: 'Seguiu uma sugestão: não ataca e se afasta do grupo, até ser ferido por quem o sugestionou ou pelos aliados dela.',
    concentrationEffect: true,
  },
  // Voo (3º círculo): ignora terreno difícil e o chão (ver `combat.js`, `voaAgora`).
  voando: {
    name: 'Voando',
    desc: 'Voa a 18 m: ignora terreno difícil, degraus de elevação e as zonas que só pegam quem pisa no chão. Se a magia acabar, cai.',
    vooFt: 60,
    concentrationEffect: true,
  },

  // Patas de Aranha (2º círculo): sobe como o Voo sobe, mas pisa no chão (ver `combat.js`, `escalaAgora`).
  escalando: {
    name: 'Patas de Aranha',
    desc: 'Sobe paredes e degraus de elevação sem custo extra nem limite de um nível por passo. Terreno difícil e zonas do chão continuam valendo.',
    concentrationEffect: true,
  },
  // Passo sem Rastro (2º círculo): `abilities.js` (`skillBonus`) soma o +10 em Furtividade;
  // `combat.js` (`renovarRastro`) tira a condição de quem se afasta mais de 9 m de quem a conjurou.
  semRastro: {
    name: 'Passo sem Rastro',
    desc: '+10 em Furtividade enquanto ficar a até 9 m de quem conjurou o véu.',
    furtividadeBonus: 10,
    concentrationEffect: true,
  },

  // Levitação (2º círculo): o alvo sobe 6 m e fica no ar. Não anda sozinho (só o conjurador o
  // move, com a ação) e quem está no chão não o alcança em corpo a corpo (`combat.js`, `canAttack`).
  levitando: {
    name: 'Levitando',
    desc: 'Flutua a 6 m do chão: não anda sozinho (o conjurador o move até 6 m por ação). Quem está no chão não o alcança em corpo a corpo, e ele não alcança quem está no chão. Se a magia acabar, cai.',
    speed: 0,
    concentrationEffect: true,
  },
  // Piscar (3º círculo): o d20 no fim de cada turno decide se ele some do plano material (`combat.js`, `piscarNoFimDoTurno`).
  piscando: {
    name: 'Piscando',
    desc: 'No fim de cada turno seu, rola 1d20: com 11 ou mais, some para o Plano Etéreo e só volta no começo do seu próximo turno.',
  },
  gasoso: {
    name: 'Forma Gasosa',
    desc: 'Névoa: o voo de 3 m é o único jeito de andar, e passa por vão estreito (grade, seteira). Resistência a todo dano não mágico, e vantagem nas resistências de FOR, DES e CON. Não ataca, não conjura e não usa objeto.',
    concentrationEffect: true,
    // O livro: "o único meio de movimento do alvo é um deslocamento de voo de
    // 3 m". Não é `speed: 0` — esse campo é o último a ganhar no agregador e
    // atropelaria o zero de `contido` e `agarrado`.
    soVoa: true,
    vooFt: 10,
    // O livro dá resistência a TODO dano não mágico, não só a concussão,
    // cortante e perfurante (essa é a fórmula dos monstros, não da magia).
    resisteNaoMagicoTudo: true,
    saveAdvantage: ['str', 'dex', 'con'],
    semAtaqueNemMagia: true,
    atravessaVao: true,
  },
  livreDeMovimento: {
    name: 'Liberdade de Movimento',
    desc: 'O terreno difícil não atrasa, nada reduz o deslocamento, e não fica paralisado nem contido. Agarrado, solta-se com 1,5 m.',
    imuneA: ['paralisado', 'contido', 'presoPorVinhas'],
    removeAoReceber: ['paralisado', 'contido', 'presoPorVinhas'],
    semTerrenoDificil: true,
    semReducaoDeDeslocamento: true,
    soltaDoAgarrao: true,
  },
  protegidoDaMorte: {
    name: 'Proteção contra a Morte',
    desc: 'A primeira queda a 0 PV deixa você de pé com 1 PV, e a magia acaba.',
  },
  revivido: {
    name: 'Voltou dos Mortos',
    desc: 'Voltar custa: a penalidade em ataques, resistências e testes cai de 1 a cada descanso longo.',
    // A penalidade mora em `data.penalidade` e vale para as três coisas.
    penalidadeDaData: true,
  },
  naAgua: {
    name: 'Andando na Água',
    desc: 'Pisa na superfície da água como se fosse chão firme: a água funda não custa o dobro.',
    sobreAgua: true,
  },
  naPedra: {
    name: 'Dentro da Pedra',
    desc: 'Fundido à pedra: ninguém o alcança, escolhe como alvo nem o afeta. De dentro, ouve o que acontece fora, mas não vê.',
    inalcancavel: true,
    motivoInalcancavel: 'está dentro da pedra',
  },

  etereo: {
    name: 'No Plano Etéreo',
    desc: 'Fora do plano material até o começo do próximo turno seu: não pode ser atingido, escolhido como alvo nem afetado, e não ataca nem conjura.',
    inalcancavel: true,
    motivoInalcancavel: 'está no Plano Etéreo',
  },

  // ---- lote 14: utilidade 2 -------------------------------------------------------

  // Salto: `combat.js` (`alcanceDoSalto`, `destinosDoSalto`) triplica o alcance e deixa pousar um nível acima.
  saltoTriplo: {
    name: 'Salto',
    desc: 'A distância dos seus saltos é três vezes maior, e o salto pode pousar um nível acima.',
    saltoMult: 3,
  },
  // Cativar: `abilities.js` (`passivePerception`) tira 5 da Percepção passiva (desvantagem em Percepção);
  // quem está cativado não grita nem chama ajuda (as cenas perguntam por `estaCativado`).
  cativado: {
    name: 'Cativado',
    desc: 'Só tem olhos para quem o cativou: desvantagem em Percepção para notar qualquer outra coisa, e não grita nem chama ajuda.',
    percepcaoPenalidade: 5,
    concentrationEffect: true,
  },
  // Fingir de Morto: os inimigos o tratam como morto (`combat.js`, `enemiesOf`).
  fingeMorto: {
    name: 'Fingindo-se de morto',
    desc: 'Parece morto: cego, incapacitado, deslocamento 0, com resistência a todo dano menos psíquico. Os inimigos o ignoram enquanto houver outro alvo.',
    incapacitated: true,
    speed: 0,
    attackDisadvantage: true,
    attackedAdvantage: true,
    resisteTudo: true,
    // Era `['psíquico', 'psiquico']`, as duas grafias, por desconfianca do
    // vocabulario. Nada no jogo causa 'psiquico' sem acento (medido).
    resisteTudoExceto: ['psíquico'],
  },

  queimando: {
    name: 'Queimando',
    desc: 'Sofre 1d4 de fogo no início de cada turno seu.',
    houseRule: true,
  },

  /**
   * Exaustão não é uma condição como as outras: são seis degraus que se
   * somam, e o degrau mora em `data.nivel`. Por isso os efeitos dela saem em
   * `conditionEffects` pelo nível, e não pelas chaves fixas daqui.
   *
   * 1 desvantagem em testes de atributo · 2 deslocamento pela metade ·
   * 3 desvantagem em ataques e em testes de resistência · 4 PV máximo pela
   * metade · 5 deslocamento 0 · 6 morte.
   */
  exausto: {
    name: 'Exausto',
    desc: 'Cansaço que se acumula em seis degraus: cada um soma ao anterior, e o sexto mata. Um descanso longo, com comida e água, tira um degrau.',
    porNivel: true,
  },
  // ================================================================ as magias do Guia de Xanathar
  // Os campos são os de sempre; o que não tem campo, `combat.js` lê pelo nome (está dito em cada uma).
  queimaduraDeGelo: {
    name: 'Queimadura de Gelo',
    desc: 'Desvantagem no próximo ataque com arma.',
    attackDisadvantage: true,
    consumidaAoAtacar: true,
  },
  imolado: {
    name: 'Em chamas (Imolação)',
    desc: 'Queima: no fim de cada turno, Destreza de novo — falha, 4d6 de fogo; passa, as chamas apagam.',
  },
  estaticaSinaptica: {
    name: 'Estática Sináptica',
    desc: 'A mente embaralhada: subtrai 1d6 das jogadas de ataque e das resistências de Constituição para manter a concentração.',
    attackPenaltyDice: '1d6',
  },
  dorAtroz: {
    name: 'Dor Atroz',
    desc: 'Deslocamento de no máximo 3 m, desvantagem nos ataques, nos testes e nas resistências que não sejam de Constituição. No fim de cada turno, Constituição para se livrar.',
    attackDisadvantage: true,
    desvantagemSoTeste: ['str', 'dex', 'con', 'int', 'wis', 'cha'],
    saveDisadvantage: ['str', 'dex', 'int', 'wis', 'cha'],
  },
  prisaoMental: {
    name: 'Prisão Mental',
    desc: 'Preso numa ilusão: contido, sem ver nem ouvir nada além dela. Sair dela custa 10d10 de dano psíquico.',
    speed: 0,
    attackDisadvantage: true,
    attackedAdvantage: true,
    desvantagemTeste: ['dex'],
  },
  invulneravel: {
    name: 'Invulnerável',
    desc: 'Imune a todo dano.',
    imuneADanos: ['ácido', 'concussão', 'cortante', 'elétrico', 'energético', 'fogo', 'frio', 'necrótico', 'perfurante', 'psíquico', 'radiante', 'trovejante', 'veneno'],
    concentrationEffect: true,
  },
  protecaoPrimordial: {
    name: 'Proteção Primordial',
    desc: 'Resistência a ácido, frio, fogo, elétrico e trovejante.',
    resiste: ['ácido', 'frio', 'fogo', 'elétrico', 'trovejante'],
    concentrationEffect: true,
  },
  golpeDeZefir: {
    name: 'Golpe de Zéfiro',
    desc: 'Andar não provoca ataque de oportunidade. Uma vez, no próprio turno: vantagem num ataque com arma, +1d8 de energético no acerto e +9 m de deslocamento no turno.',
    concentrationEffect: true,
  },
  ventoProtetor: {
    name: 'Vento Protetor',
    desc: 'Um vento forte em volta, num raio de 3 m: ataque à distância com arma que passa por ele tem desvantagem.',
    concentrationEffect: true,
  },
  laminaSombria: {
    name: 'Lâmina Sombria',
    desc: 'Uma espada de sombra na mão: acuidade, leve, arremesso, 2d8 psíquico, e vantagem contra quem está na penumbra ou no escuro.',
    concentrationEffect: true,
  },
  flechasFlamejantes: {
    name: 'Flechas Flamejantes',
    desc: 'A munição pega fogo: +1d6 de fogo em cada acerto com arma à distância, até acabar.',
    danoNoAcerto: { dados: '1d6', tipo: 'fogo', soDistancia: true },
    concentrationEffect: true,
  },
  armaSagradaDaMagia: {
    name: 'Arma Sagrada',
    desc: 'A arma brilha: +2d8 radiante em cada acerto, e conta como mágica.',
    danoNoAcerto: { dados: '2d8', tipo: 'radiante' },
    bonusArma: 0,
    concentrationEffect: true,
  },
  sombraDeMoil: {
    name: 'Sombra de Moil',
    desc: 'Envolto em sombra: quem ataca tem desvantagem, resiste a radiante, e quem o acerta a até 3 m sofre 2d8 necrótico.',
    attackedDisadvantage: true,
    resiste: ['radiante'],
    concentrationEffect: true,
  },
  guardiaoFera: {
    name: 'Guardião da Natureza: Fera Primal',
    desc: '+3 m de deslocamento, vantagem nos ataques com arma de Força e +1d6 de energético nos acertos com arma de perto.',
    speedBonusFt: 10,
    danoNoAcerto: { dados: '1d6', tipo: 'energético', soPerto: true },
    concentrationEffect: true,
  },
  guardiaoArvore: {
    name: 'Guardião da Natureza: Grande Árvore',
    desc: 'Vantagem nas resistências de Constituição e nos ataques com arma de Destreza ou Sabedoria.',
    saveAdvantage: ['con'],
    concentrationEffect: true,
  },
  transformacaoDeTenser: {
    name: 'Transformação de Tenser',
    desc: 'Vantagem nos ataques com arma, +2d12 de energético no acerto com arma, um ataque a mais na ação de Atacar; não conjura magias.',
    danoNoAcerto: { dados: '2d12', tipo: 'energético' },
    concentrationEffect: true,
  },
  presoATerra: {
    name: 'Preso à Terra',
    desc: 'Não voa: o voo cai a zero e quem estava no ar desce.',
    concentrationEffect: true,
  },
  ruinaElemental: {
    name: 'Ruína Elemental',
    desc: 'Perde a resistência ao tipo escolhido, e a primeira vez em cada turno que sofre esse tipo, sofre mais 2d6 dele.',
    concentrationEffect: true,
  },
  inimigosEmAbundancia: {
    name: 'Inimigos em Abundância',
    desc: 'Não distingue amigo de inimigo: ataca alguém sorteado ao alcance. Ao sofrer dano, Inteligência para se livrar.',
    repeteAoSofrerDano: true,
    concentrationEffect: true,
  },
  soproDraconico: {
    name: 'Sopro do Dragão',
    desc: 'Com a ação, sopra um cone de 4,5 m do tipo escolhido.',
    concentrationEffect: true,
  },
  meteorosMinusculos: {
    name: 'Meteoros Diminutos',
    desc: 'Meteoros girando em volta: com a ação bônus, solta dois num ponto.',
    concentrationEffect: true,
  },
  pedrasEncantadas: {
    name: 'Pedras Encantadas',
    desc: 'Pedras que a magia carregou: com a ação, arremessa uma.',
  },
  coroaDeEstrelas: {
    name: 'Coroa de Estrelas',
    desc: 'Estrelas em volta da cabeça: com a ação bônus, lança uma.',
  },
  investiduraDasChamas: {
    name: 'Investidura das Chamas',
    desc: 'Imune a fogo, resiste a frio; com a ação, um jato de fogo.',
    imuneADanos: ['fogo'],
    resiste: ['frio'],
    concentrationEffect: true,
  },
  investiduraDeGelo: {
    name: 'Investidura de Gelo',
    desc: 'Imune a frio, resiste a fogo, anda sobre o terreno difícil; com a ação, um cone gelado.',
    imuneADanos: ['frio'],
    resiste: ['fogo'],
    semTerrenoDificil: true,
    concentrationEffect: true,
  },
  investiduraDePedra: {
    name: 'Investidura de Pedra',
    desc: 'Resiste a concussão, corte e perfuração de ataque não mágico; com a ação, faz o chão tremer.',
    resisteNaoMagico: ['concussão', 'cortante', 'perfurante'],
    concentrationEffect: true,
  },
  investiduraDoVento: {
    name: 'Investidura do Vento',
    desc: 'Voa 18 m e ataque à distância com arma contra ele tem desvantagem; com a ação, uma rajada.',
    vooFt: 60,
    attackedDisadvantageRanged: true,
    concentrationEffect: true,
  },
  geladoPelaInvestidura: {
    name: 'Gelado',
    desc: 'Anda pela metade até o fim do próximo turno.',
    speedHalfMagico: true,
  },
  elementosAbsorvidos: {
    name: 'Elementos Absorvidos',
    desc: 'Resiste ao tipo de dano que absorveu até o próximo turno.',
    resisteTipoDado: true,
  },
  cargaElemental: {
    name: 'Carga Elemental',
    desc: 'O próximo acerto corpo a corpo soma 1d6 do tipo absorvido.',
    danoNoAcerto: { dados: '1d6', tipo: null, soPerto: true },
    consumidaNoAcerto: true,
  },
  // ================================================================ as magias do Caldeirão de Tasha
  lascaMental: {
    name: 'Lasca Mental',
    desc: 'A próxima resistência perde 1d4.',
  },
  acidoCaustico: {
    name: 'Infusão Cáustica',
    desc: 'Coberto de ácido: sofre o ácido no começo de cada turno, enquanto a magia durar.',
    danoNoInicio: 'ácido',
    concentrationEffect: true,
  },
  chicoteMental: {
    name: 'Chicote Mental',
    desc: 'Sem reação até o fim do próximo turno, e nesse turno só a ação ou a ação bônus.',
    semReacao: true,
    acaoOuBonus: true,
  },
  fortalezaDoIntelecto: {
    name: 'Fortaleza do Intelecto',
    desc: 'Resistência a psíquico e vantagem nas resistências de Inteligência, Sabedoria e Carisma.',
    resiste: ['psíquico'],
    saveAdvantage: ['int', 'wis', 'cha'],
    concentrationEffect: true,
  },
  mortalhaEspiritual: {
    name: 'Mortalha Espiritual',
    desc: 'Espíritos em volta: cada acerto em quem está a até 3 m soma o dano do tipo escolhido, e quem é ferido não se cura até o próximo turno.',
    danoNoAcerto: { dados: '1d8', tipo: null, alcanceFt: 10, tiraCura: true },
    concentrationEffect: true,
  },
  aparenciaInferior: {
    name: 'Aparência Extraplanar (Planos Inferiores)',
    desc: 'Imune a fogo e veneno e a ficar envenenado, voa 12 m, +2 de CA e um ataque a mais na ação de Atacar.',
    imuneADanos: ['fogo', 'veneno'],
    imuneA: ['envenenado'],
    vooFt: 40,
    acBonus: 2,
    concentrationEffect: true,
  },
  aparenciaSuperior: {
    name: 'Aparência Extraplanar (Planos Superiores)',
    desc: 'Imune a radiante e necrótico e a ficar enfeitiçado, voa 12 m, +2 de CA e um ataque a mais na ação de Atacar.',
    imuneADanos: ['radiante', 'necrótico'],
    imuneA: ['enfeiticado'],
    vooFt: 40,
    acBonus: 2,
    concentrationEffect: true,
  },
  envoltoEmTrovao: {
    name: 'Envolto em Trovão',
    desc: 'Se sair do lugar por vontade antes do próximo turno de quem o golpeou, sofre o trovão.',
  },
  // ---- AS SUBCLASSES DO GUIA DE XANATHAR (`subclasses-livros.js`)
  protetoresAncestrais: {
    name: 'Protetores Ancestrais',
    desc: 'Os espíritos do bárbaro o cercam: ataca outro que não o bárbaro com desvantagem, e quem ele acerta resiste ao dano.',
  },
  presoPelaTundra: {
    name: 'Preso pela Tundra',
    desc: 'Os pés presos no gelo: deslocamento 0 até o próximo turno do bárbaro.',
    speed: 0,
  },
  presencaZelosa: {
    name: 'Presença Zelosa',
    desc: 'Vantagem nos ataques e nas resistências até o próximo turno do bárbaro.',
    vantagemNosAtaques: true,
    saveAdvantage: ['str', 'dex', 'con', 'int', 'wis', 'cha'],
  },
  mantoDeMajestade: {
    name: 'Manto de Majestade',
    desc: 'Conjura Comando como ação bônus em cada turno, sem espaço de magia. Concentração, 1 minuto.',
    concentrationEffect: true,
  },
  majestadeInquebravel: {
    name: 'Majestade Inquebrável',
    desc: 'Na primeira vez em cada turno que alguém o ataca, ele testa Carisma; falha e não ataca o bardo neste turno.',
  },
  abaladoPelaMajestade: {
    name: 'Abalado pela Majestade',
    desc: 'Resiste com desvantagem às magias do bardo até o fim do próximo turno dele.',
  },
  floreioDefensivo: {
    name: 'Floreio Defensivo',
    desc: 'O dado do floreio somado à CA até o próximo turno do bardo.',
    acNaData: true,
  },
  debilitadoPeloDisparo: {
    name: 'Debilitado pela Flecha',
    desc: 'Os ataques com arma causam metade do dano até o próximo turno do arqueiro.',
  },
  marcaInabalavel: {
    name: 'Marca Inabalável',
    desc: 'Ataca com desvantagem quem não é o cavaleiro, se estiver a 1,5 m dele; ferir outro dá ao cavaleiro um golpe de ação bônus.',
  },
  espiritoDeLuta: {
    name: 'Espírito de Luta',
    desc: 'Vantagem nas jogadas de ataque até o fim do turno.',
    vantagemNosAtaques: true,
  },
  panache: {
    name: 'Panache',
    desc: 'Provocado pelo espadachim: ataca outro com desvantagem e só dá ataque de oportunidade nele. Um minuto.',
  },
  manobraElegante: {
    name: 'Manobra Elegante',
    desc: 'Vantagem no próximo teste de Acrobacia ou Atletismo deste turno.',
  },
  expostoNaEmboscada: {
    name: 'Exposto',
    desc: 'Todo ataque contra ele tem vantagem até o próximo turno do batedor.',
  },
  combatePerspicaz: {
    name: 'Lido pelo Inquisitivo',
    desc: 'O ladino leu os movimentos dele: o Ataque Furtivo vale contra ele sem vantagem. Um minuto.',
  },
  ajudaDoMentor: {
    name: 'Apontado pelo Mentor',
    desc: 'O próximo ataque de um aliado do mentor contra ele tem vantagem.',
  },
  aparoAgil: {
    name: 'Aparo Ágil',
    desc: '+2 de CA até o próximo turno do monge.',
    acBonus: 2,
  },
  tiroDoKensei: {
    name: 'Tiro do Kensei',
    desc: 'Até o fim do turno, o acerto à distância com arma kensei soma 1d4.',
  },
  laminaAfiada: {
    name: 'Lâmina Afiada',
    desc: 'A arma kensei soma o ki gasto no ataque e no dano. Um minuto.',
  },
  conquistadorInvencivel: {
    name: 'Conquistador Invencível',
    desc: 'Resistência a todo dano, um ataque a mais e crítico com 19. Um minuto.',
    resisteTudo: true,
  },
  emissarioDaPaz: {
    name: 'Emissário da Paz',
    desc: '+5 em Persuasão. Dez minutos.',
  },
  guerreiroPlanar: {
    name: 'Guerreiro Planar',
    desc: 'O próximo acerto de arma do andarilho neste turno vira energético e soma 1d8.',
  },
  presaDoMatador: {
    name: 'Presa do Matador',
    desc: 'O primeiro acerto de arma do matador em cada turno soma 1d6.',
  },
  asasDeOutroMundo: {
    name: 'Asas de Outro Mundo',
    desc: 'Asas espectrais: voo de 9 m, até dispensar.',
    vooFt: 30,
  },
  formaUmbral: {
    name: 'Forma Umbral',
    desc: 'Sombra viva: resistência a todo dano, menos energético e radiante. Um minuto.',
    resisteTudo: true,
    resisteTudoExceto: ['energético', 'radiante'],
  },
  maldicaoDoLamina: {
    name: 'Maldição do Lâmina Maldita',
    desc: 'O bruxo soma a proficiência ao dano contra ele e o critica com 19. Um minuto.',
  },
  deflexaoArcana: {
    name: 'Deflexão Arcana',
    desc: 'Depois do desvio, só truques até o fim do próximo turno.',
  },
  chamadoDaCaca: {
    name: 'Chamado da Caçada',
    desc: 'Até a Fúria do bárbaro acabar, uma vez por turno, o acerto de ataque soma 1d6.',
  },
  surtoBarbaro: {
    name: 'Surto Selvagem',
    desc: 'A magia selvagem que a Fúria do bárbaro soltou, até a Fúria acabar.',
  },
  luzesDoSurto: {
    name: 'Luzes Protetoras',
    desc: '+1 de CA, pelas luzes da magia selvagem do bárbaro.',
    acBonus: 1,
  },
  magiaFortalecedora: {
    name: 'Magia Fortalecedora',
    desc: '+1d3 nas jogadas de ataque. Dez minutos.',
    attackBonusDice: '1d3',
  },
  palavrasPerturbadoras: {
    name: 'Palavras Perturbadoras',
    desc: 'A próxima resistência perde o dado da Inspiração do bardo.',
  },
  iraDaOrdem: {
    name: 'Ira da Ordem',
    desc: 'O próximo aliado do clérigo que o acertar soma 2d8 psíquico.',
  },
  vinculoEncorajador: {
    name: 'Vínculo Encorajador',
    desc: 'Perto de outro vinculado, 1d4 no primeiro ataque ou resistência de cada turno. Dez minutos.',
  },
  bencaoVigilante: {
    name: 'Bênção Vigilante',
    desc: 'Vantagem na próxima iniciativa.',
  },
  santuarioDoCrepusculo: {
    name: 'Santuário do Crepúsculo',
    desc: 'Uma esfera de 9 m em volta do clérigo: quem termina o turno nela se livra do medo ou do encanto, ou ganha PV temporários.',
  },
  passosDaNoite: {
    name: 'Passos da Noite',
    desc: 'Voo igual ao andar. Um minuto.',
    vooFt: 30,
  },
  entidadeSimbiotica: {
    name: 'Entidade Simbiótica',
    desc: 'Os esporos no corpo: o halo em dobro e +1d6 necrótico no golpe de perto, enquanto durarem os PV temporários.',
  },
  formaEstrelada: {
    name: 'Forma Estrelada',
    desc: 'Uma figura de estrelas, com a constelação escolhida. Dez minutos.',
  },
  saltoPsionico: {
    name: 'Salto Psiônico',
    desc: 'Voo igual ao dobro do andar, até o fim do turno.',
  },
  baluarteDeForca: {
    name: 'Baluarte de Força',
    desc: 'Meia cobertura de força: +2 na CA e nas resistências de Destreza. Um minuto.',
    acBonus: 2,
    saveFixo: { dex: 2 },
  },
  poderDosGigantes: {
    name: 'Poder dos Gigantes',
    desc: 'Vantagem em testes e resistências de Força, e um dado a mais por turno no acerto. Um minuto.',
    vantagemTeste: ['str'],
  },
  runaDoGeloAtiva: {
    name: 'Runa do Gelo',
    desc: '+2 nas resistências de Força e de Constituição. Dez minutos.',
    saveFixo: { str: 2, con: 2 },
  },
  runaDaColinaAtiva: {
    name: 'Runa da Colina',
    desc: 'Resistência a dano de concussão, cortante e perfurante. Um minuto.',
    resiste: ['concussão', 'cortante', 'perfurante'],
  },
  runaDaTempestadeAtiva: {
    name: 'Runa da Tempestade',
    desc: 'Visão profética: uma vez por rodada, a reação dá vantagem ao ataque de um aliado. Um minuto.',
  },
  transePetrea: {
    name: 'Transe de Pedra',
    desc: 'Enfeitiçado pela runa: não age nem anda. Testa Sabedoria no fim de cada turno para sair.',
    incapacitated: true,
    speed: 0,
  },
  bracosAstrais: {
    name: 'Braços do Eu Astral',
    desc: 'Os golpes desarmados alcançam 3 m, usam Sabedoria e causam energético. Dez minutos.',
  },
  semblanteAstral: {
    name: 'Semblante do Eu Astral',
    desc: 'Visão no escuro de 36 m e vantagem em Intuição e Intimidação. Dez minutos.',
  },
  euAstralDesperto: {
    name: 'Eu Astral Desperto',
    desc: 'Braços, semblante e corpo astrais: +2 de CA e um golpe a mais com os braços. Dez minutos.',
    acBonus: 2,
  },
  // TASHA (3º lote)
  atletaSemIgual: {
    name: 'Atleta Sem Igual',
    desc: 'Vantagem nos testes de Atletismo e de Acrobacia. Dez minutos.',
  },
  auraDeProntidao: {
    name: 'Aura de Prontidão',
    desc: '+3 m de deslocamento neste turno: começou o turno colado no paladino da Glória.',
  },
  lendaViva: {
    name: 'Lenda Viva',
    desc: 'Vantagem nos testes de Carisma; uma vez por turno, o golpe que erra acerta; a resistência que falha se rola de novo, com a reação. Um minuto.',
  },
  vontadeDoVigilante: {
    name: 'Vontade do Vigilante',
    desc: 'Vantagem nas resistências de Inteligência, Sabedoria e Carisma. Um minuto.',
    saveAdvantage: ['int', 'wis', 'cha'],
  },
  baluarteMortal: {
    name: 'Baluarte Mortal',
    desc: 'Visão verdadeira de 36 m, vantagem contra aberração, celestial, elemental, feérico e corruptor, e o ataque que fere um deles pode bani-lo. Um minuto.',
  },
  mareOndulante: {
    name: 'Maré Ondulante',
    desc: 'O enxame o ergue: voo de 3 m, pairando. Um minuto.',
  },
  caminharFantasma: {
    name: 'Caminhar Fantasma',
    desc: 'Meio fantasma: voo de 3 m, pairando, e ataques contra ele têm desvantagem. Dez minutos.',
    attackedDisadvantage: true,
  },
  // TASHA (4º lote)
  revelacaoNaCarne: {
    name: 'Revelação na Carne',
    desc: 'A aberração aparece no corpo: voo igual ao andar, ou ver o invisível. Dez minutos.',
  },
  transeDaOrdem: {
    name: 'Transe da Ordem',
    desc: 'Ninguém o ataca com vantagem, e 9 ou menos no d20 dele conta como 10. Um minuto.',
  },
  vooDoGenio: {
    name: 'Dádiva Elemental',
    desc: 'O ar do gênio o sustenta: voo de 9 m, pairando. Dez minutos.',
  },
  cancaoDaLamina: {
    name: 'Canção da Lâmina',
    desc: 'A INT na CA e na concentração, +3 m de deslocamento e vantagem em Acrobacia. Um minuto.',
    acNaData: true,
  },
  // OS OUTROS LIVROS (Costa da Espada, Mestre, Fizban, Bigby)
  desafiadoPelaCoroa: {
    name: 'Desafio do Campeão',
    desc: 'Não consegue se afastar mais de 9 m do paladino que o desafiou.',
  },
  campeaoExaltado: {
    name: 'Campeão Exaltado',
    desc: 'Resistência ao golpe de arma não mágica; ele e os aliados a 9 m têm vantagem em Sabedoria e no teste contra a morte. Uma hora.',
  },
  senhorDoTerror: {
    name: 'Senhor do Terror',
    desc: 'Uma aura de sombra de 9 m: quem tem medo dele e começa o turno nela leva 4d10 psíquico, e quem ataca o grupo na sombra sem enxergá-la tem desvantagem. Um minuto.',
  },
  aspectoDaSerpe: {
    name: 'Aspecto da Serpe',
    desc: 'Uma aura de dragão de 3 m: medo, ou resistência ao tipo do dragão para ele e os aliados nela. Um minuto.',
  },
  asasDoDragao: {
    name: 'Asas do Dragão',
    desc: 'Asas espectrais: voo igual ao andar, até o fim do turno.',
  },
  caminhoDaSepultura: {
    name: 'Caminho para a Sepultura',
    desc: 'O próximo ataque do grupo do clérigo que o acertar fere em dobro, e a maldição acaba.',
  },
};

/** Os seis degraus da exaustão, para o texto do jogo. */
export const DEGRAUS_DE_EXAUSTAO = [
  'Desvantagem em testes de atributo',
  'Deslocamento pela metade',
  'Desvantagem em ataques e em testes de resistência',
  'Pontos de vida máximos pela metade',
  'Deslocamento 0',
  'Morte',
];

const HABILIDADES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

/** O degrau de exaustão de `actor`, de 0 a 6. */
export function nivelDeExaustao(actor) {
  return actor?.conditions?.find((c) => c.id === 'exausto')?.data?.nivel ?? 0;
}

/**
 * Sobe (ou desce, com `n` negativo) os degraus de exaustão e devolve o nível
 * novo. No 0 a condição sai; no 6 quem carrega morre, e isso é com quem chama.
 */
export function mudarExaustao(actor, n) {
  // Morto-vivo e constructo não cansam: o bloco deles lista 'exausto'.
  if (n > 0 && actor?.conditionImmunities?.includes('exausto')) return nivelDeExaustao(actor);
  const nivel = Math.max(0, Math.min(6, nivelDeExaustao(actor) + n));
  if (nivel === 0) {
    removeCondition(actor, 'exausto');
    return 0;
  }
  const c = addCondition(actor, 'exausto', { data: { nivel } });
  c.data = { nivel };
  // No 4º degrau o teto cai pela metade: quem estava acima dele desce junto,
  // ou o `Math.min` da cura passaria a TIRAR vida de quem está "cheio".
  if (nivel >= 4) actor.hp = Math.min(actor.hp ?? 0, maxHpEfetivo(actor));
  return nivel;
}

/**
 * O 6º degrau é a morte. Devolve true se matou — quem chama escreve a frase,
 * porque só a camada de jogo sabe como contar.
 */
export function exaustaoFatal(actor) {
  if (nivelDeExaustao(actor) < 6 || actor.dead) return false;
  actor.dead = true;
  actor.hp = 0;
  return true;
}

/**
 * O PV máximo que vale agora: no 4º degrau de exaustão, metade (arredondada
 * para baixo). É o que o dano maciço, a cura e as barras de vida devem ler,
 * não `c.maxHp` cru.
 */
export function maxHpEfetivo(c) {
  const max = c?.maxHp ?? 0;
  return nivelDeExaustao(c) >= 4 ? Math.floor(max / 2) : max;
}

/** Até onde a criatura tem visão verdadeira, em pés: a do bloco ou a da bênção de Dumathoin (36 m). */
export function alcanceDaVisaoVerdadeira(c) {
  // e a do BALUARTE MORTAL (Vigilantes, 20º), também 36 m
  return Math.max(c?.senses?.truesightFt ?? 0, hasCondition(c, 'visaoVerdadeira') || hasCondition(c, 'baluarteMortal') ? 120 : 0);
}

export function hasCondition(actor, id) {
  return actor.conditions?.some((c) => c.id === id) ?? false;
}

/**
 * Põe uma condição.
 *
 * `rounds` conta, por padrão, no fim de cada turno de quem a carrega. Os
 * efeitos que duram "até o fim do SEU próximo turno" (do conjurador) contam no
 * turno do lado dele: `lado` diz qual lado, e `quando` ('fim' ou 'inicio')
 * diz em que ponto do turno desse lado a conta anda.
 */
export function addCondition(actor, id, { rounds = Infinity, source = null, data = null, lado = null, quando = 'fim', magia = null } = {}) {
  actor.conditions ??= [];
  const existing = actor.conditions.find((c) => c.id === id);
  if (existing) {
    existing.rounds = Math.max(existing.rounds, rounds);
    if (data) existing.data = data;
    if (magia) existing.magia = magia;
    if (lado) { existing.lado = lado; existing.quando = quando; }
    return existing;
  }
  // `magia` ({ id, circulo }) marca o efeito como de magia: é o que o
  // Dissipar Magia procura. Condição de mordida ou de armadilha não tem.
  const c = { id, rounds, source, data, lado, quando, magia };
  actor.conditions.push(c);
  return c;
}

export function getCondition(actor, id) {
  return actor.conditions?.find((c) => c.id === id) ?? null;
}

export function removeCondition(actor, id) {
  if (!actor.conditions) return;
  const saiu = actor.conditions.find((c) => c.id === id);
  actor.conditions = actor.conditions.filter((c) => c.id !== id);
  // O QUE DURA ENQUANTO O AGARRÃO DURA (o tentáculo do Qunbraxel: atordoado "até o agarrão acabar"). A condição presa ao
  // agarrão leva `data.comOAgarrao` = quem agarra, e cai junto com ele por qualquer caminho: escapar, quem agarra cair,
  // morrer ou soltar.
  if (saiu?.id === 'agarrado') actor.conditions = actor.conditions.filter((c) => !(c.data?.comOAgarrao && c.data.comOAgarrao === saiu.source));
}

/** Agrega os efeitos de todas as condições ativas. */
export function conditionEffects(actor) {
  const out = {
    incapacitated: false,
    attackDisadvantage: false,
    attackedAdvantage: false,
    attackedDisadvantage: false,
    attackedAdvantageMelee: false,
    attackedDisadvantageRanged: false,
    critWithinReach: false,
    speedOverride: null,
    speedPenaltyFt: 0,
    autoFailSaves: [],
    saveDisadvantage: [],
    // O espelho de `saveDisadvantage`: vantagem SÓ na resistência, sem tocar
    // no teste de atributo (Forma Gasosa dá isso em FOR, DES e CON).
    saveAdvantage: [],
    // Forma Gasosa: a névoa não ataca, não conjura e não usa objeto, mas
    // continua agindo (anda, foge, passa pelo vão) — por isso não é
    // `incapacitated`, que tiraria o turno dela inteiro.
    semAtaqueNemMagia: false,
    atravessaVao: false,
    sobreAgua: false,
    // Modificador FIXO (não dado) em ataque e em teste de atributo. O de
    // resistência já tinha casa: `saveFixo`, por atributo.
    ataqueFixo: 0,
    testeFixo: 0,
    // Liberdade de Movimento: o terreno difícil não atrasa, nada reduz o
    // deslocamento, e o agarrão se solta sem teste.
    semTerrenoDificil: false,
    semReducaoDeDeslocamento: false,
    soltaDoAgarrao: false,
    // Fora de alcance: não pode ser atingido, escolhido como alvo nem afetado.
    // O Plano Etéreo e o Fundir-se com a Pedra, que leem o mesmo campo.
    inalcancavel: false,
    // Por que está fora de alcance, para a recusa dizer a razão ao jogador.
    motivoInalcancavel: null,
    // Forma Gasosa: o voo é o ÚNICO meio de movimento (o livro), em vez de
    // somar-se ao deslocamento de andar.
    soVoa: false,
    resisteNaoMagicoTudo: false,
    attackBonusDice: [],
    saveBonusDice: [],
    attackPenaltyDice: [],
    savePenaltyDice: [],
    acBonus: 0,
    saveFixo: {},
    speedHalf: false,
    // A metade do deslocamento que vem de MAGIA (a Lentidão), separada da que
    // vem da exaustão: a Liberdade de Movimento barra só a primeira.
    speedHalfMagico: false,
    semReacao: false,
    acaoOuBonus: false,
    umAtaque: false,
    speedBonusFt: 0,
    speedMult: 1,
    vooFt: 0,
    vantagemDex: false,
    vantagemSab: false,
    vantagemMorte: false,
    curaMaxima: false,
    vantagemTeste: [],
    vantagemSoTeste: [],
    // `desvantagemTeste` vale no teste de atributo E na resistência (Reduzir
    // pune as duas coisas em Força). `desvantagemSoTeste` vale só no teste de
    // atributo: é o 1º degrau de exaustão, que não toca em resistência — essa
    // começa no 3º.
    desvantagemTeste: [],
    desvantagemSoTeste: [],
    pvMaxMetade: false,
  };
  for (const c of actor.conditions ?? []) {
    const def = CONDITIONS[c.id];
    if (!def) continue;
    if (def.incapacitated) out.incapacitated = true;
    if (def.attackDisadvantage) out.attackDisadvantage = true;
    if (def.attackedAdvantage) out.attackedAdvantage = true;
    if (def.attackedDisadvantage) out.attackedDisadvantage = true;
    if (def.attackedAdvantageMelee) out.attackedAdvantageMelee = true;
    if (def.attackedDisadvantageRanged) out.attackedDisadvantageRanged = true;
    if (def.critWithinReach) out.critWithinReach = true;
    if (def.speed !== undefined) out.speedOverride = def.speed;
    if (def.speedPenaltyFt) out.speedPenaltyFt += def.speedPenaltyFt;
    if (def.autoFailSaves) out.autoFailSaves.push(...def.autoFailSaves);
    if (def.saveDisadvantage) out.saveDisadvantage.push(...def.saveDisadvantage);
    if (def.attackBonusDice) out.attackBonusDice.push(def.attackBonusDice);
    if (def.bonusDeAtaqueNaData && c.data?.bonus) out.attackBonusDice.push(`+${c.data.bonus}`);
    if (def.saveBonusDice) out.saveBonusDice.push(def.saveBonusDice);
    // Dado guardado na instância (Inspiração Bárdica): vale nos três.
    if (def.dadoNaData && c.data?.dado) {
      out.attackBonusDice.push(c.data.dado);
      out.saveBonusDice.push(c.data.dado);
    }
    if (def.attackPenaltyDice) out.attackPenaltyDice.push(def.attackPenaltyDice);
    if (def.savePenaltyDice) out.savePenaltyDice.push(def.savePenaltyDice);
    if (def.acBonus) out.acBonus += def.acBonus;
    if (def.acNaData && c.data?.acBonus) out.acBonus += c.data.acBonus;
    // o voo que a condição guarda na instância (o Salto Psiônico, o Dragão da Forma Estrelada no 10º)
    if (c.id === 'saltoPsionico' && c.data?.voo) out.vooFt = Math.max(out.vooFt, c.data.voo);
    if (c.id === 'formaEstrelada' && c.data?.voo) out.vooFt = Math.max(out.vooFt, 20);
    if (['mareOndulante', 'caminharFantasma', 'revelacaoNaCarne', 'vooDoGenio', 'asasDoDragao'].includes(c.id) && c.data?.voo) out.vooFt = Math.max(out.vooFt, c.data.voo);
    for (const [hab, v] of Object.entries(def.saveFixo ?? {})) out.saveFixo[hab] = (out.saveFixo[hab] ?? 0) + v;
    if (def.speedHalf) out.speedHalf = true;
    if (def.speedHalfMagico) out.speedHalfMagico = true;
    if (def.semReacao) out.semReacao = true;
    if (def.acaoOuBonus) out.acaoOuBonus = true;
    if (def.umAtaque) out.umAtaque = true;
    if (def.speedBonusFt) out.speedBonusFt += def.speedBonusFt;
    if (def.speedMult) out.speedMult *= def.speedMult;
    if (def.vooFt) out.vooFt = Math.max(out.vooFt, def.vooFt);
    if (def.vantagemDex) out.vantagemDex = true;
    if (def.vantagemSab) out.vantagemSab = true;
    if (def.vantagemMorte) out.vantagemMorte = true;
    if (def.curaMaxima) out.curaMaxima = true;
    if (def.vantagemTeste) out.vantagemTeste.push(...def.vantagemTeste);
    // vantagem nas jogadas de ataque (Presciência, Presença Zelosa): `combat.js attackModifiers` pergunta por isto, e a
    // soma não o trazia — a Presciência prometia vantagem nos ataques e nunca a dava.
    if (def.vantagemNosAtaques) out.vantagemNosAtaques = true;
    // Forma Gasosa: vantagem só nas RESISTÊNCIAS de FOR, DES e CON — não nos
    // testes de perícia desses atributos, que é o que `vantagemTeste` faria.
    // É o espelho de `saveDisadvantage`, que já existia.
    if (def.saveAdvantage) out.saveAdvantage.push(...def.saveAdvantage);
    if (def.semAtaqueNemMagia) out.semAtaqueNemMagia = true;
    if (def.sobreAgua) out.sobreAgua = true;
    if (def.semTerrenoDificil) out.semTerrenoDificil = true;
    if (def.semReducaoDeDeslocamento) out.semReducaoDeDeslocamento = true;
    if (def.soltaDoAgarrao) out.soltaDoAgarrao = true;
    // Reviver os Mortos: −4 que cai de 1 por descanso longo, e que pesa em
    // ataque, resistência e teste de atributo ao mesmo tempo.
    if (def.penalidadeDaData && c.data?.penalidade) {
      const p = c.data.penalidade;
      out.ataqueFixo -= p;
      out.testeFixo -= p;
      for (const hab of HABILIDADES) out.saveFixo[hab] = (out.saveFixo[hab] ?? 0) - p;
    }
    if (def.inalcancavel) out.inalcancavel = true;
    if (def.motivoInalcancavel && !out.motivoInalcancavel) out.motivoInalcancavel = def.motivoInalcancavel;
    if (def.soVoa) out.soVoa = true;
    if (def.resisteNaoMagicoTudo) out.resisteNaoMagicoTudo = true;
    if (def.atravessaVao) out.atravessaVao = true;
    if (def.vantagemSoTesteDados && c.data?.hab) out.vantagemSoTeste.push(c.data.hab);
    if (def.desvantagemTeste) out.desvantagemTeste.push(...def.desvantagemTeste);
    // A Palavra de Poder Dor: desvantagem nos testes de atributo, sem tocar nas resistências (que vão em `saveDisadvantage`).
    if (def.desvantagemSoTeste) out.desvantagemSoTeste.push(...def.desvantagemSoTeste);
    // Exaustão: os degraus se somam, então cada um lê o nível guardado na
    // condição em vez de uma chave fixa da tabela.
    if (def.porNivel) {
      const n = c.data?.nivel ?? 0;
      if (n >= 1) out.desvantagemSoTeste.push(...HABILIDADES);
      if (n >= 2) out.speedHalf = true;
      if (n >= 3) { out.attackDisadvantage = true; out.saveDisadvantage.push(...HABILIDADES); }
      if (n >= 4) out.pvMaxMetade = true;
      if (n >= 5) out.speedOverride = 0;
    }
  }
  // LIBERDADE DE MOVIMENTO como TRAÇO de criatura (o kraken): a mesma coisa que a magia, para sempre
  // ALMA DO VENTO (Feitiçaria da Tempestade, 18º): voo de 18 m. MAGIA DURÁVEL (Magia de Guerra, 10º): concentrado, +2 na CA e
  // em toda resistência.
  if (actor.features?.includes('windSoul')) out.vooFt = Math.max(out.vooFt, 60);
  if (actor.features?.includes('durableMagic') && actor.concentrating) {
    out.acBonus += 2;
    for (const hab of HABILIDADES) out.saveFixo[hab] = (out.saveFixo[hab] ?? 0) + 2;
  }
  if (actor.traits?.includes('liberdadeDeMovimento')) {
    out.semTerrenoDificil = true;
    out.semReducaoDeDeslocamento = true;
    out.soltaDoAgarrao = true;
  }
  return out;
}

/** A CA que vale agora: a da ficha mais o que as condições mudam (Lentidão). */
export function caEfetiva(c) {
  // Pele de Árvore: a CA nunca fica abaixo de 16 (antes dos bônus).
  const minima = Math.max(0, ...(c.conditions ?? []).map((x) => CONDITIONS[x.id]?.caMinima ?? 0));
  return Math.max(c.ac ?? 10, minima) + conditionEffects(c).acBonus;
}

/**
 * O FÔLEGO DEBAIXO D'ÁGUA (SRD, Sufocamento). Prende-se a respiração por 1 + modificador de Constituição minutos
 * (mínimo 30 segundos): 10 rodadas por minuto, 5 no mínimo. Acabado o ar, a criatura aguenta um número de rodadas
 * igual ao modificador de Constituição (mínimo 1), e no começo do turno seguinte cai a 0 PV. Quem respira na água
 * (a magia Respirar na Água, `respiraNaAgua`; ou quem nada por natureza) não se afoga. Devolve o que aconteceu:
 * null (nada), 'semAr' (o ar acabou agora), 'cai' (caiu a 0 PV) — quem chama narra e derruba.
 */
export function gastarFolego(c) {
  if (c.respiraNaAgua || c.speeds?.swimFt || c.tipo === 'morto-vivo' || c.tipo === 'constructo') return null;
  const con = Math.floor(((c.abilities?.con ?? 10) - 10) / 2);
  c.folego ??= Math.max(5, (1 + con) * 10);
  if (c.folego > 0) {
    c.folego -= 1;
    if (c.folego > 0) return null;
    c.sufocando = Math.max(1, con);
    return 'semAr';
  }
  c.sufocando = (c.sufocando ?? 1) - 1;
  return c.sufocando < 0 ? 'cai' : null;
}

/** Fora da água o ar volta inteiro. */
export function recuperarFolego(c) {
  delete c.folego;
  delete c.sufocando;
}
