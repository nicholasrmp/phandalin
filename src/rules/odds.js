// Probabilidade de acerto e dano esperado.
//
// POR QUE ISTO EXISTE
// O jogo já recusava um ataque impossível e dizia o motivo — mas DEPOIS da
// tentativa. "CA 17" é um número cru: exige que o jogador calcule de cabeça
// "meu +5 contra 17 dá 45%". Mostrar a conta ANTES é o que transforma o
// combate em decisão em vez de aposta.
//
// Está em `rules/` e não em `view/` porque é regra: a mesma conta alimenta o
// tabuleiro, o HUD e, um dia, a IA. E é PURA — não altera nada no encontro,
// só lê. Pode ser chamada a cada quadro sem medo.

import { distanceFt } from '../core/grid.js';
import { averageOf } from '../core/dice.js';

/**
 * Chance de um d20 + bônus alcançar a CA.
 *
 * O 1 natural sempre erra e o 20 natural sempre acerta, então o alvo fica
 * preso entre 2 e 20 — é por isso que não existe inimigo impossível nem
 * ataque garantido em 5e, e a conta tem de respeitar isso.
 */
export function chanceD20(bonus, ca, { advantage = false, disadvantage = false } = {}) {
  const precisa = Math.max(2, Math.min(20, ca - bonus));
  const p = (21 - precisa) / 20;
  if (advantage && !disadvantage) return 1 - (1 - p) ** 2;
  if (disadvantage && !advantage) return p * p;
  return p;
}

/** Chance de crítico: 20 natural, e com vantagem são duas chances. */
export function chanceCritico({ advantage = false, disadvantage = false } = {}) {
  if (advantage && !disadvantage) return 1 - (19 / 20) ** 2;
  if (disadvantage && !advantage) return (1 / 20) ** 2;
  return 1 / 20;
}

/**
 * Tudo que o jogador precisa saber antes de clicar num alvo.
 *
 * @returns {{
 *   perfil: object, mods: object, dist: number,
 *   alcance: number, foraDeAlcance: boolean, alcanceLongo: boolean,
 *   semVisao: boolean, chance: number, critico: number,
 *   danoMedio: number, esperado: number, motivos: string[],
 * }}
 */
export function previsaoDeAtaque(enc, attacker, target, weaponId = null) {
  const perfil = enc.weaponAttackProfile(attacker, weaponId);
  const dist = distanceFt(attacker.pos, target.pos);
  const alcance = perfil.ranged ? perfil.rangeFt : perfil.reachFt;
  const limite = perfil.ranged ? perfil.longRangeFt : perfil.reachFt;
  const foraDeAlcance = dist > limite;
  // Além do alcance normal, mas dentro do longo: acerta com desvantagem.
  const alcanceLongo = perfil.ranged && dist > alcance && dist <= limite;
  const semVisao = !enc.field.hasLineOfSight(attacker.pos, target.pos);

  const base = enc.attackModifiers(attacker, target, { ranged: perfil.ranged });
  const mods = {
    advantage: base.advantage,
    disadvantage: base.disadvantage || alcanceLongo,
    reasons: alcanceLongo ? [...base.reasons, 'alcance longo'] : base.reasons,
  };

  const chance = foraDeAlcance || semVisao ? 0 : chanceD20(perfil.bonus, target.ac, mods);
  const critico = foraDeAlcance || semVisao ? 0 : chanceCritico(mods);
  const danoMedio = averageOf(perfil.damage);

  return {
    perfil,
    mods,
    dist,
    alcance,
    foraDeAlcance,
    alcanceLongo,
    semVisao,
    chance,
    critico,
    danoMedio,
    // O dano esperado já conta o crítico, que dobra só os dados.
    esperado: chance * danoMedio * (1 + critico * 0.5),
    motivos: mods.reasons,
  };
}

/** Mesma ideia para magia de ataque. Magia de resistência não usa d20 do atacante. */
export function previsaoDeMagia(enc, actor, target, spell, { atkBonus = 0, dc = 10 } = {}) {
  const dist = distanceFt(actor.pos, target.pos);
  const foraDeAlcance = spell.rangeFt > 0 && dist > spell.rangeFt;
  const semVisao = spell.rangeFt > 0 && !enc.field.hasLineOfSight(actor.pos, target.pos);
  const danoMedio = spell.damage ? averageOf(spell.damage) : 0;

  if (spell.kind === 'attack') {
    const mods = enc.attackModifiers(actor, target, { ranged: true });
    const chance = foraDeAlcance || semVisao ? 0 : chanceD20(atkBonus, target.ac, mods);
    return {
      tipo: 'ataque', dist, foraDeAlcance, semVisao, chance,
      critico: chanceCritico(mods), danoMedio,
      esperado: chance * danoMedio, motivos: mods.reasons, dc: null,
    };
  }
  return {
    tipo: spell.save ? 'resistência' : 'automática',
    dist, foraDeAlcance, semVisao,
    chance: null, critico: 0, danoMedio,
    esperado: danoMedio, motivos: [], dc: spell.save ? dc : null,
  };
}

export const pct = (p) => `${Math.round(p * 100)}%`;
