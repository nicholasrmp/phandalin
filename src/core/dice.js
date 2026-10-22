// Dados, do jeito do 5e.
// SRD 5.2 (CC-BY-4.0) — ver NOTICE.md
//
// Regras implementadas aqui:
//  · vantagem/desvantagem rolam 2d20 e pegam o maior/menor; se as duas se
//    aplicam, elas se cancelam e a rolagem é normal
//  · 20 natural no ataque sempre acerta; 1 natural sempre erra
//  · crítico dobra os DADOS de dano, não o modificador

export function rollDice(rng, count, sides) {
  const rolls = [];
  for (let i = 0; i < count; i++) rolls.push(rng.die(sides));
  return rolls;
}

export function sum(list) {
  return list.reduce((a, b) => a + b, 0);
}

/** "2d6+3" ou "1d8" ou "4" → { count, sides, mod } */
export function parseDice(notation) {
  if (typeof notation === 'number') return { count: 0, sides: 0, mod: notation };
  const m = /^\s*(?:(\d+)d(\d+))?\s*([+-]\s*\d+)?\s*$/i.exec(notation);
  if (!m) throw new Error(`Notação de dado inválida: "${notation}"`);
  return {
    count: m[1] ? Number(m[1]) : 0,
    sides: m[2] ? Number(m[2]) : 0,
    mod: m[3] ? Number(m[3].replace(/\s+/g, '')) : 0,
  };
}

export function roll(rng, notation) {
  const { count, sides, mod } = parseDice(notation);
  const rolls = count > 0 ? rollDice(rng, count, sides) : [];
  return { total: sum(rolls) + mod, rolls, mod, notation: String(notation) };
}

/**
 * Rolagem de d20 com vantagem/desvantagem.
 * @returns {{natural:number, total:number, rolls:number[], mode:'normal'|'vantagem'|'desvantagem'}}
 */
export function d20(rng, modifier = 0, { advantage = false, disadvantage = false } = {}) {
  // Vantagem e desvantagem juntas se anulam — a regra não acumula.
  const adv = advantage && !disadvantage;
  const dis = disadvantage && !advantage;
  const rolls = [rng.die(20)];
  if (adv || dis) rolls.push(rng.die(20));

  const natural = adv ? Math.max(...rolls) : dis ? Math.min(...rolls) : rolls[0];
  return {
    natural,
    total: natural + modifier,
    rolls,
    modifier,
    mode: adv ? 'vantagem' : dis ? 'desvantagem' : 'normal',
  };
}

/** Jogada de ataque contra uma CA. */
export function attackRoll(rng, bonus, ac, opts) {
  const r = d20(rng, bonus, opts);
  const critical = r.natural === 20;
  const fumble = r.natural === 1;
  return {
    ...r,
    ac,
    critical,
    fumble,
    hit: critical || (!fumble && r.total >= ac),
  };
}

/** Dano. No crítico, os dados dobram; o modificador não. */
export function damageRoll(rng, notation, { critical = false } = {}) {
  const { count, sides, mod } = parseDice(notation);
  const dice = count * (critical ? 2 : 1);
  const rolls = dice > 0 ? rollDice(rng, dice, sides) : [];
  const total = Math.max(0, sum(rolls) + mod);
  return { total, rolls, mod, critical, notation: String(notation) };
}

/** Teste de resistência contra uma CD. */
export function savingThrow(rng, bonus, dc, opts) {
  const r = d20(rng, bonus, opts);
  return { ...r, dc, success: r.total >= dc };
}

export const formatModifier = (n) => (n >= 0 ? `+${n}` : String(n));
