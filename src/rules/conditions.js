// SRD 5.1 (CC-BY-4.0) — ver NOTICE.md
// Condições. Cada uma descreve, em dados, o que muda mecanicamente.

export const CONDITIONS = {
  caido: {
    name: 'Caído',
    desc: 'Movimento só rastejando. Desvantagem em ataques. Quem ataca de perto tem vantagem; à distância, desvantagem.',
    attackDisadvantage: true,
    attackedAdvantageMelee: true,
    attackedDisadvantageRanged: true,
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
  abencoado: {
    name: 'Abençoado',
    desc: 'Some 1d4 às jogadas de ataque e aos testes de resistência.',
    attackBonusDice: '1d4',
    saveBonusDice: '1d4',
    concentrationEffect: true,
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
    speedHalf: true,
    semReacao: true,
    acaoOuBonus: true,
    umAtaque: true,
    concentrationEffect: true,
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
    name: 'Metal em brasa',
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
    resiste: ['cortante', 'perfurante', 'concussão'],
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
    desc: 'Aberrações, celestiais, elementais, fadas, corruptores e mortos-vivos atacam com desvantagem.',
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
    name: 'Atributo aprimorado',
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
    name: 'Patas de aranha',
    desc: 'Sobe paredes e degraus de elevação sem custo extra nem limite de um nível por passo. Terreno difícil e zonas do chão continuam valendo.',
    concentrationEffect: true,
  },
  // Passo sem Rastro (2º círculo): `abilities.js` (`skillBonus`) soma o +10 em Furtividade;
  // `combat.js` (`renovarRastro`) tira a condição de quem se afasta mais de 9 m de quem a conjurou.
  semRastro: {
    name: 'Passo sem rastro',
    desc: '+10 em Furtividade enquanto ficar a até 9 m de quem conjurou o véu.',
    furtividadeBonus: 10,
    concentrationEffect: true,
  },

  queimando: {
    name: 'Queimando',
    desc: 'Sofre 1d4 de fogo no início de cada turno seu.',
    houseRule: true,
  },
};

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
  actor.conditions = actor.conditions.filter((c) => c.id !== id);
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
    attackBonusDice: [],
    saveBonusDice: [],
    attackPenaltyDice: [],
    savePenaltyDice: [],
    acBonus: 0,
    saveFixo: {},
    speedHalf: false,
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
    desvantagemTeste: [],
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
    if (def.saveBonusDice) out.saveBonusDice.push(def.saveBonusDice);
    if (def.attackPenaltyDice) out.attackPenaltyDice.push(def.attackPenaltyDice);
    if (def.savePenaltyDice) out.savePenaltyDice.push(def.savePenaltyDice);
    if (def.acBonus) out.acBonus += def.acBonus;
    for (const [hab, v] of Object.entries(def.saveFixo ?? {})) out.saveFixo[hab] = (out.saveFixo[hab] ?? 0) + v;
    if (def.speedHalf) out.speedHalf = true;
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
    if (def.vantagemSoTesteDados && c.data?.hab) out.vantagemSoTeste.push(c.data.hab);
    if (def.desvantagemTeste) out.desvantagemTeste.push(...def.desvantagemTeste);
  }
  return out;
}

/** A CA que vale agora: a da ficha mais o que as condições mudam (Lentidão). */
export function caEfetiva(c) {
  // Pele de Árvore: a CA nunca fica abaixo de 16 (antes dos bônus).
  const minima = Math.max(0, ...(c.conditions ?? []).map((x) => CONDITIONS[x.id]?.caMinima ?? 0));
  return Math.max(c.ac ?? 10, minima) + conditionEffects(c).acBonus;
}
