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
 * O MODELO DE TURNO DESTE MOTOR É POR LADO, não por ponteiro de iniciativa. `enc.side` diz de quem é
 * a fase ('party' ou 'foes'), todo mundo daquele lado joga na ordem que quiser, cada um fecha o seu
 * com `acted`, e quando não sobra ninguém o motor vira o lado sozinho (`combat.js maybeEndSide`) e
 * conta a rodada. NÃO existe `encounter.current`, e este arquivo inteiro foi escrito perguntando por
 * ele: `encounter.current ?? 0` caía em zero e respondia SEMPRE "o primeiro da lista". O preço disso
 * está medido em `isCurrentTurn`, abaixo.
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

    const rodadaAntes = this.getCurrentRound();
    // Processa fim de turno no encounter
    const result = this.encounter.endTurn?.(combatant) ?? { ok: true };

    if (onTurnEnd) {
      onTurnEnd(combatant, result);
    }

    // A RODADA VIROU se o motor a virou. Antes isto era "o índice chegou ao fim da lista", com o
    // índice que não existe. Agora é a conta do próprio motor, comparada antes e depois.
    const wasRoundEnd = this.getCurrentRound() > rodadaAntes;

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

    // O PRÓXIMO É O PRÓXIMO DO LADO DA VEZ que ainda não agiu — não "o seguinte no array". Dar a vez
    // em volta da lista inteira entregava o turno a um inimigo no meio da fase do grupo.
    return this.porJogarDoLado()[0] ?? null;
  }

  /** Quem, do lado da vez, ainda tem turno: vivo, de pé e sem `acted`. Em ordem da lista. */
  porJogarDoLado() {
    return this.getActiveCombatants(this.encounter.side ?? null).filter(
      (c) => !c.acted,
    );
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
   * A FASE do lado da vez acabou: ninguém dele tem turno por jogar. Não é o fim da RODADA — a rodada
   * só vira quando o lado que joga por último termina, e quem conta isso é o motor (`enc.round`).
   * `endTurn` compara a rodada antes e depois justamente por isso.
   *
   * @returns {boolean}
   */
  isRoundEnd() {
    const combatants = this.encounter.combatants;
    if (!combatants || combatants.length === 0) {
      return false;
    }
    return this.porJogarDoLado().length === 0;
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
    // Não há UM combatente da vez: a fase é do lado inteiro. O mais perto disso é o primeiro que
    // ainda tem turno, que é quem o tabuleiro seleciona sozinho (`main.js firstActive`).
    return this.porJogarDoLado()[0] ?? null;
  }

  /**
   * É A VEZ DELE? Com a fase sendo do LADO, a resposta é: o combate não acabou, ele é do lado da vez
   * e está vivo e de pé. Perguntar por índice respondia sempre "o primeiro da lista", e por isso só a
   * primeira heroína atacava, conjurava, usava item e entrava em mira — os outros três levavam "Não é
   * o turno deste combatente" em toda porta de `CombatManager`. É o mesmo defeito que
   * `CombatAdapter.terminarTurnoDe` já tinha corrigido no botão de passar a vez, e que sobrava aqui.
   *
   * Quem já AGIU não é barrado AQUI, de propósito: o motor recusa com a palavra certa ("a ação deste
   * turno já foi usada") e sabe do Ataque Extra, que deixa golpear de novo com a ação gasta. Barrar
   * aqui trocaria uma recusa certa por uma mentira.
   *
   * @param {Object} combatant
   * @returns {boolean}
   */
  ehAVezDe(combatant) {
    if (!combatant || this.encounter.over) return false;
    const lado = this.encounter.side ?? null;
    if (lado && combatant.side !== lado) return false;
    return this.isActive(combatant);
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
