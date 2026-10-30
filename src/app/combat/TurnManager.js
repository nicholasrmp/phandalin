// `incapacitated` NÃO é nome de condição (as do projeto são em português:
// `inconsciente`, `paralisado`, `atordoado`...). É um efeito DERIVADO, que
// `conditionEffects` soma a partir das condições que a criatura tem — é o
// idioma que `main.js` e `rules/` usam para esta pergunta.
import { conditionEffects } from "../../rules/conditions.js";

/**
 * TurnManager
 *
 * Gerencia a ordem de turnos, fim de turno e transições entre combatentes.
 *
 * Responsabilidades:
 * - Finalizar turno do combatente atual
 * - Determinar próximo combatente ativo
 * - Detectar fim de rodada
 * - Gerenciar modo automático
 *
 * Padrões:
 * - Dependency Injection (encounter)
 * - Callbacks para eventos (onTurnEnd, onNextTurn, onRoundEnd)
 * - Retorna sempre { ok: boolean, nextCombatant?: Object }
 */
export class TurnManager {
  constructor(encounter) {
    this.encounter = encounter;
  }

  /**
   * Finaliza o turno do combatente atual.
   *
   * @param {Object} combatant - Combatente cujo turno está terminando
   * @param {Object} callbacks - { onTurnEnd, onNextTurn, onRoundEnd }
   * @returns {Object} { ok: boolean, nextCombatant?: Object }
   */
  endTurn(combatant, callbacks = {}) {
    const { onTurnEnd, onNextTurn, onRoundEnd } = callbacks;

    // Processa fim de turno no encounter
    const result = this.encounter.endTurn?.(combatant) ?? { ok: true };

    if (onTurnEnd) {
      onTurnEnd(combatant, result);
    }

    // Verifica fim de rodada ANTES de avançar
    const wasRoundEnd = this.isRoundEnd();

    // Próximo combatente
    const next = this.getNextCombatant();

    // Notifica fim de rodada se necessário
    if (wasRoundEnd && onRoundEnd) {
      onRoundEnd(this.encounter.round ?? 1);
    }

    if (next && onNextTurn) {
      onNextTurn(next);
    }

    return { ok: true, nextCombatant: next };
  }

  /**
   * Retorna o próximo combatente ativo.
   *
   * Pula combatentes mortos e incapacitados.
   *
   * @returns {Object|null} Próximo combatente ou null se combate acabou
   */
  getNextCombatant() {
    if (this.encounter.over) {
      return null;
    }

    const combatants = this.encounter.combatants;
    if (!combatants || combatants.length === 0) {
      return null;
    }

    const current = this.encounter.current ?? 0;

    // Procura próximo vivo e não incapacitado
    for (let i = 0; i < combatants.length; i++) {
      const index = (current + i + 1) % combatants.length;
      const c = combatants[index];

      if (!c.dead && !conditionEffects(c).incapacitated) {
        return c;
      }
    }

    return null;
  }

  /**
   * Retorna o primeiro combatente ativo (para início de combate).
   *
   * @returns {Object|null}
   */
  getFirstActive() {
    const combatants = this.encounter.combatants;
    if (!combatants) {
      return null;
    }

    for (const c of combatants) {
      if (!c.dead && !conditionEffects(c).incapacitated) {
        return c;
      }
    }

    return null;
  }

  /**
   * Verifica se é fim de rodada.
   *
   * Fim de rodada ocorre quando o índice atual é o último combatente
   * ou quando volta ao início.
   *
   * @returns {boolean}
   */
  isRoundEnd() {
    const current = this.encounter.current ?? 0;
    const combatants = this.encounter.combatants;

    if (!combatants || combatants.length === 0) {
      return false;
    }

    // Fim de rodada quando está no último combatente
    return current >= combatants.length - 1;
  }

  /**
   * Pula para o próximo turno (usado em auto-play).
   *
   * @param {Object} callbacks - { onNextTurn }
   * @returns {Object} { ok: boolean, nextCombatant?: Object }
   */
  skipToNext(callbacks = {}) {
    const { onNextTurn } = callbacks;

    const next = this.getNextCombatant();

    if (next && onNextTurn) {
      onNextTurn(next);
    }

    return { ok: true, nextCombatant: next };
  }

  /**
   * Alterna modo automático de turnos.
   *
   * @param {boolean} enabled - Ativar/desativar auto
   * @returns {Object} { ok: boolean, auto: boolean }
   */
  toggleAuto(enabled) {
    if (this.encounter.auto !== undefined) {
      this.encounter.auto = enabled;
    }

    return { ok: true, auto: enabled };
  }

  /**
   * Retorna o combatente atual.
   *
   * @returns {Object|null}
   */
  getCurrentCombatant() {
    const combatants = this.encounter.combatants;
    const current = this.encounter.current ?? 0;

    if (!combatants || current >= combatants.length) {
      return null;
    }

    return combatants[current];
  }

  /**
   * Retorna o número da rodada atual.
   *
   * @returns {number}
   */
  getCurrentRound() {
    return this.encounter.round ?? 1;
  }

  /**
   * Verifica se o combate acabou.
   *
   * @returns {boolean}
   */
  isOver() {
    return Boolean(this.encounter.over);
  }

  /**
   * Retorna o lado que está jogando (party ou foes).
   *
   * @returns {string|null}
   */
  getCurrentSide() {
    return this.encounter.side ?? null;
  }

  /**
   * Conta quantos combatentes ainda estão ativos.
   *
   * @param {string} side - "party" ou "foes" (opcional)
   * @returns {number}
   */
  countActiveCombatants(side = null) {
    const combatants = this.encounter.combatants ?? [];

    return combatants.filter((c) => {
      if (c.dead || conditionEffects(c).incapacitated) {
        return false;
      }

      if (side && c.side !== side) {
        return false;
      }

      return true;
    }).length;
  }

  /**
   * Verifica se um combatente específico está ativo.
   *
   * @param {Object} combatant - Combatente a verificar
   * @returns {boolean}
   */
  isActive(combatant) {
    if (!combatant) return false;
    return !combatant.dead && !conditionEffects(combatant).incapacitated;
  }

  /**
   * Retorna lista de combatentes ativos.
   *
   * @param {string} side - "party" ou "foes" (opcional)
   * @returns {Array}
   */
  getActiveCombatants(side = null) {
    const combatants = this.encounter.combatants ?? [];

    return combatants.filter((c) => {
      if (!this.isActive(c)) {
        return false;
      }

      if (side && c.side !== side) {
        return false;
      }

      return true;
    });
  }
}
