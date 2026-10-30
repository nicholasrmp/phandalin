import { getSpell } from "../../rules/spells.js";
import { distanceFt } from "../../core/grid.js";

/**
 * TargetingSystem
 *
 * Gerencia o modo de seleção de alvos para magias, ataques e habilidades.
 *
 * Responsabilidades:
 * - Entrar/sair do modo de seleção de alvos
 * - Validar alvos selecionados
 * - Gerenciar seleção de múltiplos alvos
 * - Aplicar regras especiais (cubo, distância, etc.)
 *
 * Padrões:
 * - Dependency Injection (encounter, board)
 * - Callbacks para eventos (onComplete, onError, onUpdate)
 * - Retorna sempre { ok: boolean, why?: string }
 */
export class TargetingSystem {
  constructor(encounter, board) {
    this.encounter = encounter;
    this.board = board;
    this.mode = null;
    this.selectedTargets = [];
  }

  /**
   * Entra em modo de seleção de alvos.
   *
   * @param {Object} action - Ação que requer alvos
   * @param {Object} caster - Quem está executando a ação
   * @returns {Object} { ok: boolean, maxTargets: number, mode: Object }
   */
  enterTargetingMode(action, caster) {
    if (action.kind === "spell") {
      const spell = getSpell(action.spellId);
      const circulo = this.encounter.circuloDeConjuracao(caster, spell);
      const maxTargets = this.encounter.alvosDaMagia(spell, circulo, caster);

      this.mode = {
        ...action,
        circulo,
        caster,
        maxTargets,
        spell,
      };
      this.selectedTargets = [];

      return { ok: true, maxTargets, mode: this.mode };
    }

    if (action.kind === "attack") {
      this.mode = {
        ...action,
        caster,
        maxTargets: 1,
      };
      this.selectedTargets = [];

      return { ok: true, maxTargets: 1, mode: this.mode };
    }

    if (action.kind === "featureAlvo") {
      this.mode = {
        ...action,
        caster,
        maxTargets: 1,
      };
      this.selectedTargets = [];

      return { ok: true, maxTargets: 1, mode: this.mode };
    }

    return { ok: false, why: "Tipo de ação não suportado" };
  }

  /**
   * Seleciona ou desmarca um alvo.
   *
   * @param {Object} target - Alvo a ser selecionado
   * @param {Object} callbacks - { onComplete, onError, onUpdate }
   * @returns {Object} { ok: boolean, complete: boolean, targets: Array }
   */
  selectTarget(target, callbacks = {}) {
    const { onComplete, onError, onUpdate } = callbacks;

    if (!this.mode) {
      const why = "Não está em modo de seleção";
      if (onError) onError(why);
      return { ok: false, why };
    }

    const { caster, kind, spellId, maxTargets } = this.mode;

    // Validação de alvo para magia
    if (kind === "spell") {
      const spell = getSpell(spellId);
      const why = this.encounter.porqueNaoAlvo(caster, spell, target);

      if (why) {
        if (onError) onError(why);
        return { ok: false, why };
      }

      // Marca/desmarca alvo
      const index = this.selectedTargets.indexOf(target);
      const canRepeat = ["auto", "raios"].includes(spell.kind);

      // Desmarca se já estava selecionado (exceto magias que permitem repetir)
      if (!canRepeat && index >= 0) {
        this.selectedTargets.splice(index, 1);

        if (onUpdate) {
          onUpdate(this.selectedTargets);
        }

        return {
          ok: true,
          complete: false,
          targets: [...this.selectedTargets],
        };
      }

      // Adiciona novo alvo se ainda não atingiu o máximo
      if (this.selectedTargets.length < maxTargets) {
        // Validações especiais
        const validation = this.validateSpecialRules(spell, target);
        if (!validation.ok) {
          if (onError) onError(validation.why);
          return validation;
        }

        this.selectedTargets.push(target);
      }

      // Completo?
      const complete = this.selectedTargets.length >= maxTargets;

      if (complete && onComplete) {
        onComplete([...this.selectedTargets]);
      } else if (onUpdate) {
        onUpdate([...this.selectedTargets]);
      }

      return {
        ok: true,
        complete,
        targets: [...this.selectedTargets],
      };
    }

    // Seleção simples para ataques e habilidades
    if (kind === "attack" || kind === "featureAlvo") {
      this.selectedTargets = [target];

      if (onComplete) {
        onComplete([target]);
      }

      return {
        ok: true,
        complete: true,
        targets: [target],
      };
    }

    return { ok: false, why: "Tipo de ação não implementado" };
  }

  /**
   * Valida regras especiais de magias (cubo, distância, etc.).
   *
   * @private
   * @param {Object} spell - Magia sendo conjurada
   * @param {Object} target - Novo alvo a adicionar
   * @returns {Object} { ok: boolean, why?: string }
   */
  validateSpecialRules(spell, target) {
    // Lentidão (cubo de 12 m): alvos devem estar dentro do cubo
    if (spell.cuboFt) {
      const dentroDoCubo = this.encounter.dentroDoCubo(spell, [
        ...this.selectedTargets,
        target,
      ]);

      if (dentroDoCubo.length <= this.selectedTargets.length) {
        return {
          ok: false,
          why: `fora do cubo de ${(spell.cuboFt / 5) * 1.5} m dos já marcados`,
        };
      }
    }

    // Respingo Ácido (a 1,5 m do primeiro): segundo alvo deve estar próximo
    if (spell.juntosFt && this.selectedTargets.length > 0) {
      const dist = distanceFt(target.pos, this.selectedTargets[0].pos);

      if (dist > spell.juntosFt) {
        return {
          ok: false,
          why: `o segundo alvo tem de estar a até ${(spell.juntosFt / 5) * 1.5} m do primeiro`,
        };
      }
    }

    return { ok: true };
  }

  /**
   * Valida se um alvo é válido para a ação atual.
   *
   * @param {Object} target - Alvo a validar
   * @returns {Object} { ok: boolean, why?: string }
   */
  validateTarget(target) {
    if (!this.mode) {
      return { ok: false, why: "Não está em modo de seleção" };
    }

    const { caster, kind, spellId } = this.mode;

    if (kind === "spell") {
      const spell = getSpell(spellId);
      const why = this.encounter.porqueNaoAlvo(caster, spell, target);
      return why ? { ok: false, why } : { ok: true };
    }

    // Ataques e habilidades sempre validam no encounter
    return { ok: true };
  }

  /**
   * Sai do modo de seleção de alvos.
   */
  exitTargetingMode() {
    this.mode = null;
    this.selectedTargets = [];
  }

  /**
   * Retorna os alvos selecionados.
   *
   * @returns {Array} Cópia dos alvos selecionados
   */
  getSelectedTargets() {
    return [...this.selectedTargets];
  }

  /**
   * Verifica se está em modo de seleção.
   *
   * @returns {boolean}
   */
  isTargeting() {
    return this.mode !== null;
  }

  /**
   * Retorna informações do modo atual.
   *
   * @returns {Object|null} Cópia do modo atual ou null
   */
  getMode() {
    return this.mode ? { ...this.mode } : null;
  }

  /**
   * Retorna o número máximo de alvos para o modo atual.
   *
   * @returns {number} Número máximo de alvos ou 0 se não em modo de seleção
   */
  getMaxTargets() {
    return this.mode?.maxTargets ?? 0;
  }

  /**
   * Retorna o número de alvos já selecionados.
   *
   * @returns {number}
   */
  getSelectedCount() {
    return this.selectedTargets.length;
  }

  /**
   * Verifica se a seleção está completa.
   *
   * @returns {boolean}
   */
  isComplete() {
    if (!this.mode) return false;
    return this.selectedTargets.length >= this.mode.maxTargets;
  }

  /**
   * Limpa os alvos selecionados sem sair do modo.
   */
  clearTargets() {
    this.selectedTargets = [];
  }

  /**
   * Atualiza o círculo de conjuração (para magias com círculo variável).
   *
   * @param {number} circulo - Novo círculo
   * @returns {Object} { ok: boolean, maxTargets: number }
   */
  updateCirculo(circulo) {
    if (!this.mode || this.mode.kind !== "spell") {
      return { ok: false, why: "Não está em modo de seleção de magia" };
    }

    const { caster, spell } = this.mode;
    const maxTargets = this.encounter.alvosDaMagia(spell, circulo, caster);

    this.mode.circulo = circulo;
    this.mode.maxTargets = maxTargets;

    // Corta alvos excedentes se o círculo diminuiu
    if (this.selectedTargets.length > maxTargets) {
      this.selectedTargets = this.selectedTargets.slice(0, maxTargets);
    }

    return { ok: true, maxTargets };
  }
}
