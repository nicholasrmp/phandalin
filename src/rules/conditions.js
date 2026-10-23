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
    expiresAtTurnStart: true,
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

  // REGRA DA CASA — não é SRD. No 5e, dano de fogo não incendeia ninguém.
  // Aqui magias de fogo podem pegar: a criatura sofre 1d4 no início do turno
  // dela. Controlado por HOUSE_RULES.ignite em combat.js.
  queimando: {
    name: 'Queimando',
    desc: 'Sofre 1d4 de fogo no início de cada turno seu.',
    houseRule: true,
  },
};

export function hasCondition(actor, id) {
  return actor.conditions?.some((c) => c.id === id) ?? false;
}

export function addCondition(actor, id, { rounds = Infinity, source = null, data = null } = {}) {
  actor.conditions ??= [];
  const existing = actor.conditions.find((c) => c.id === id);
  if (existing) {
    existing.rounds = Math.max(existing.rounds, rounds);
    if (data) existing.data = data;
    return existing;
  }
  const c = { id, rounds, source, data };
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
    attackBonusDice: [],
    saveBonusDice: [],
    attackPenaltyDice: [],
    savePenaltyDice: [],
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
    if (def.attackBonusDice) out.attackBonusDice.push(def.attackBonusDice);
    if (def.saveBonusDice) out.saveBonusDice.push(def.saveBonusDice);
    if (def.attackPenaltyDice) out.attackPenaltyDice.push(def.attackPenaltyDice);
    if (def.savePenaltyDice) out.savePenaltyDice.push(def.savePenaltyDice);
  }
  return out;
}
