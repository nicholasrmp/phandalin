/**
 * CombatManager - Orquestra todos os módulos de combate
 *
 * Responsabilidades:
 * - Coordenar ActionHandler, TargetingSystem e TurnManager
 * - Gerenciar estado de combate
 * - Interface única para App
 *
 * O turno do monstro NÃO mora aqui: quem decide é `rules/ai.js`, chamada pelo
 * `CombatAdapter.runFoes`. É a IA revisada do projeto, e a única.
 */

import { ActionHandler } from "./ActionHandler.js";
import { TargetingSystem } from "./TargetingSystem.js";
import { TurnManager } from "./TurnManager.js";

export class CombatManager {
  /**
   * @param {Object} encounter - Referência ao encontro atual
   * @param {Object} board - Referência ao tabuleiro
   */
  constructor(encounter, board) {
    this.encounter = encounter;
    this.board = board;

    // Inicializar módulos
    this.actionHandler = new ActionHandler(encounter, board);
    this.targetingSystem = new TargetingSystem(encounter, board);
    this.turnManager = new TurnManager(encounter);

    // Estado
    this.isProcessing = false;
    this.autoPlayEnabled = false;
  }

  /**
   * Inicia um novo combate
   * @param {Object} callbacks - Callbacks para eventos
   * @returns {Object} { ok: boolean, why?: string }
   */
  startCombat(callbacks = {}) {
    if (!this.encounter || !this.encounter.combatentes) {
      return { ok: false, why: "Encontro inválido" };
    }

    if (this.encounter.combatentes.length === 0) {
      return { ok: false, why: "Sem combatentes" };
    }

    // Resetar estado
    this.isProcessing = false;
    this.autoPlayEnabled = false;
    this.targetingSystem.exitTargetingMode();

    // Notificar início
    if (callbacks.onCombatStart) {
      callbacks.onCombatStart(this.encounter);
    }

    return { ok: true };
  }

  /**
   * Finaliza o combate atual
   * @param {Object} callbacks - Callbacks para eventos
   * @returns {Object} { ok: boolean, winner?: string }
   */
  endCombat(callbacks = {}) {
    const winner = this.getWinner();

    // Limpar estado
    this.isProcessing = false;
    this.autoPlayEnabled = false;
    this.targetingSystem.exitTargetingMode();

    // Notificar fim
    if (callbacks.onCombatEnd) {
      callbacks.onCombatEnd(winner);
    }

    return { ok: true, winner };
  }

  /**
   * Executa ataque de um combatente
   * @param {Object} attacker - Atacante
   * @param {Object} target - Alvo
   * @param {string} weaponId - ID da arma
   * @param {Object} callbacks - Callbacks
   * @returns {Object} Resultado do ataque
   */
  attack(attacker, target, weaponId, callbacks = {}) {
    if (this.isProcessing) {
      return { ok: false, why: "Ação em andamento" };
    }

    if (!this.isCurrentTurn(attacker)) {
      return { ok: false, why: "Não é o turno deste combatente" };
    }

    this.isProcessing = true;

    const result = this.actionHandler.tryAttack(attacker, target, weaponId, {
      onSuccess: () => {
        if (callbacks.onSuccess) callbacks.onSuccess();
        this.checkCombatEnd(callbacks);
      },
      onError: (error) => {
        if (callbacks.onError) callbacks.onError(error);
      },
      onComplete: () => {
        this.isProcessing = false;
        if (callbacks.onComplete) callbacks.onComplete();
      },
      onMove: callbacks.onMove,
      onDamage: callbacks.onDamage,
    });

    if (!result.ok) {
      this.isProcessing = false;
    }

    return result;
  }

  /**
   * Lança uma magia
   * @param {Object} caster - Conjurador
   * @param {string} spellId - ID da magia
   * @param {Object} options - Opções (target, targets, position)
   * @param {Object} callbacks - Callbacks
   * @returns {Object} Resultado
   */
  castSpell(caster, spellId, options = {}, callbacks = {}) {
    if (this.isProcessing) {
      return { ok: false, why: "Ação em andamento" };
    }

    if (!this.isCurrentTurn(caster)) {
      return { ok: false, why: "Não é o turno deste combatente" };
    }

    this.isProcessing = true;

    const result = this.actionHandler.tryCast(caster, spellId, options, {
      onSuccess: () => {
        if (callbacks.onSuccess) callbacks.onSuccess();
        this.checkCombatEnd(callbacks);
      },
      onError: (error) => {
        if (callbacks.onError) callbacks.onError(error);
      },
      onComplete: () => {
        this.isProcessing = false;
        if (callbacks.onComplete) callbacks.onComplete();
      },
      onDamage: callbacks.onDamage,
      onEffect: callbacks.onEffect,
    });

    if (!result.ok) {
      this.isProcessing = false;
    }

    return result;
  }

  /**
   * Usa um item
   * @param {Object} user - Usuário
   * @param {string} itemId - ID do item
   * @param {Object} options - Opções
   * @param {Object} callbacks - Callbacks
   * @returns {Object} Resultado
   */
  useItem(user, itemId, options = {}, callbacks = {}) {
    if (this.isProcessing) {
      return { ok: false, why: "Ação em andamento" };
    }

    if (!this.isCurrentTurn(user)) {
      return { ok: false, why: "Não é o turno deste combatente" };
    }

    this.isProcessing = true;

    const result = this.actionHandler.useItem(user, itemId, options, {
      onSuccess: () => {
        if (callbacks.onSuccess) callbacks.onSuccess();
        this.checkCombatEnd(callbacks);
      },
      onError: (error) => {
        if (callbacks.onError) callbacks.onError(error);
      },
      onComplete: () => {
        this.isProcessing = false;
        if (callbacks.onComplete) callbacks.onComplete();
      },
      onHeal: callbacks.onHeal,
      onEffect: callbacks.onEffect,
    });

    if (!result.ok) {
      this.isProcessing = false;
    }

    return result;
  }

  /**
   * Usa uma habilidade
   * @param {Object} user - Usuário
   * @param {string} featureId - ID da habilidade
   * @param {Object} options - Opções
   * @param {Object} callbacks - Callbacks
   * @returns {Object} Resultado
   */
  useFeature(user, featureId, options = {}, callbacks = {}) {
    if (this.isProcessing) {
      return { ok: false, why: "Ação em andamento" };
    }

    if (!this.isCurrentTurn(user)) {
      return { ok: false, why: "Não é o turno deste combatente" };
    }

    this.isProcessing = true;

    const result = this.actionHandler.useFeature(user, featureId, options, {
      onSuccess: () => {
        if (callbacks.onSuccess) callbacks.onSuccess();
        this.checkCombatEnd(callbacks);
      },
      onError: (error) => {
        if (callbacks.onError) callbacks.onError(error);
      },
      onComplete: () => {
        this.isProcessing = false;
        if (callbacks.onComplete) callbacks.onComplete();
      },
      onEffect: callbacks.onEffect,
    });

    if (!result.ok) {
      this.isProcessing = false;
    }

    return result;
  }

  /**
   * Entra em modo de seleção de alvo
   * @param {Object} action - Ação (spell ou feature)
   * @param {Object} caster - Conjurador
   * @returns {Object} { ok: boolean, why?: string }
   */
  enterTargeting(action, caster) {
    if (!this.isCurrentTurn(caster)) {
      return { ok: false, why: "Não é o turno deste combatente" };
    }

    return this.targetingSystem.enterTargetingMode(action, caster);
  }

  /**
   * Seleciona um alvo
   * @param {Object} target - Alvo selecionado
   * @param {Object} callbacks - Callbacks
   * @returns {Object} Resultado
   */
  selectTarget(target, callbacks = {}) {
    return this.targetingSystem.selectTarget(target, callbacks);
  }

  /**
   * Sai do modo de targeting
   */
  exitTargeting() {
    this.targetingSystem.exitTargetingMode();
  }

  /**
   * Finaliza o turno do combatente atual
   * @param {Object} callbacks - Callbacks
   * @returns {Object} { ok: boolean, why?: string }
   */
  endTurn(callbacks = {}) {
    if (this.isProcessing) {
      return { ok: false, why: "Ação em andamento" };
    }

    const current = this.turnManager.getCurrentCombatant();
    if (!current) {
      return { ok: false, why: "Sem combatente ativo" };
    }

    const result = this.turnManager.endTurn(current, {
      onTurnEnd: (combatant) => {
        if (callbacks.onTurnEnd) callbacks.onTurnEnd(combatant);
      },
      onRoundEnd: (round) => {
        if (callbacks.onRoundEnd) callbacks.onRoundEnd(round);
      },
      onCombatEnd: (winner) => {
        if (callbacks.onCombatEnd) callbacks.onCombatEnd(winner);
        this.endCombat({ onCombatEnd: callbacks.onCombatEnd });
      },
    });

    return result;
  }

  /**
   * O turno do monstro não é decidido aqui.
   *
   * Quem decide é `runMonsterSide` (`rules/ai.js`), chamada pelo
   * `CombatAdapter.runFoes`. Este método existia com uma IA própria, que lia
   * campos que o motor não tem (`.lado`, `.pv`, `.armas`) e por isso nunca
   * agia; está mantido só para avisar quem o procurar.
   *
   * @deprecated use `CombatAdapter.runFoes()`
   */
  executeFoeTurn() {
    return { ok: false, why: "o lado dos inimigos roda por rules/ai.js" };
  }

  /**
   * Ativa/desativa modo automático
   * @param {boolean} enabled - Ativar ou desativar
   */
  toggleAutoPlay(enabled) {
    this.autoPlayEnabled = enabled;
    this.turnManager.toggleAuto(enabled);
  }

  /**
   * Verifica se é o turno do combatente
   * @param {Object} combatant - Combatente
   * @returns {boolean}
   * @private
   */
  isCurrentTurn(combatant) {
    const current = this.turnManager.getCurrentCombatant();
    return current && current.id === combatant.id;
  }

  /**
   * Verifica se o combate terminou
   * @param {Object} callbacks - Callbacks
   * @private
   */
  checkCombatEnd(callbacks) {
    if (this.turnManager.isOver()) {
      const winner = this.getWinner();
      if (callbacks.onCombatEnd) {
        callbacks.onCombatEnd(winner);
      }
      this.endCombat({ onCombatEnd: callbacks.onCombatEnd });
    }
  }

  /**
   * Obtém o vencedor do combate
   * @returns {string|null} 'party', 'foes' ou null — os valores de `c.side`
   * @private
   */
  getWinner() {
    const heroesAlive = this.turnManager.countActiveCombatants("party");
    const foesAlive = this.turnManager.countActiveCombatants("foes");

    if (heroesAlive > 0 && foesAlive === 0) return "party";
    if (foesAlive > 0 && heroesAlive === 0) return "foes";
    return null;
  }

  // Getters para acesso aos módulos e estado

  /**
   * Obtém o combatente atual
   * @returns {Object|null}
   */
  getCurrentCombatant() {
    return this.turnManager.getCurrentCombatant();
  }

  /**
   * Obtém o round atual
   * @returns {number}
   */
  getCurrentRound() {
    return this.turnManager.getCurrentRound();
  }

  /**
   * Verifica se está em modo de targeting
   * @returns {boolean}
   */
  isTargeting() {
    return this.targetingSystem.isTargeting();
  }

  /**
   * Obtém alvos selecionados
   * @returns {Array}
   */
  getSelectedTargets() {
    return this.targetingSystem.getSelectedTargets();
  }

  /**
   * Obtém modo de targeting atual
   * @returns {string|null}
   */
  getTargetingMode() {
    return this.targetingSystem.getMode();
  }

  /**
   * Verifica se o combate terminou
   * @returns {boolean}
   */
  isCombatOver() {
    return this.turnManager.isOver();
  }

  /**
   * Obtém combatentes ativos
   * @param {string} side - 'party' ou 'foes' (opcional) — valores de `c.side`
   * @returns {Array}
   */
  getActiveCombatants(side = null) {
    return this.turnManager.getActiveCombatants(side);
  }

  /**
   * Conta combatentes ativos
   * @param {string} side - 'party' ou 'foes' (opcional) — valores de `c.side`
   * @returns {number}
   */
  countActiveCombatants(side = null) {
    return this.turnManager.countActiveCombatants(side);
  }
}
