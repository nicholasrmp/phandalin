import { Battlefield, distanceFt } from "../../core/grid.js";
import { getSpell, opcoesDaMagia } from "../../rules/spells.js";
import { WEAPONS } from "../../rules/equipment.js";

/**
 * ActionHandler
 *
 * Gerencia todas as ações de combate: ataques, conjuração de magias,
 * uso de itens e habilidades de classe.
 *
 * Responsabilidades:
 * - Validar ações antes de executar
 * - Calcular caminhos para ataques corpo a corpo
 * - Gerenciar escolhas de magias (Aprimorar Atributo, Glifo)
 * - Executar ações através do Encounter
 *
 * Padrões:
 * - Dependency Injection (encounter, board)
 * - Callbacks para eventos (onSuccess, onError, onWalk, onChoose)
 * - Retorna sempre { ok: boolean, why?: string }
 */
export class ActionHandler {
  constructor(encounter, board) {
    this.encounter = encounter;
    this.board = board;
  }

  /**
   * Tenta executar um ataque corpo a corpo ou à distância.
   *
   * Se for corpo a corpo e o alvo estiver longe, o personagem ANDA até ele
   * gastando movimento e então ataca. Se o movimento não der para chegar,
   * avança o máximo possível e não ataca — mas a ação continua disponível.
   *
   * @param {Object} attacker - Combatente atacante
   * @param {Object} target - Alvo do ataque
   * @param {string} weaponId - ID da arma
   * @param {Object} callbacks - { onSuccess, onError, onWalk }
   * @returns {Object} { ok: boolean, why?: string }
   */
  tryAttack(attacker, target, weaponId, callbacks = {}) {
    const { onSuccess, onError, onWalk } = callbacks;
    const enc = this.encounter;

    // Verifica se pode atacar diretamente
    const check = enc.canAttack(attacker, target, weaponId);

    if (check.ok) {
      // Ataque direto (em alcance)
      const r = enc.attackAction(attacker, target, weaponId);

      if (!r.ok) {
        if (onError) onError(r.why);
        return r;
      }

      if (onSuccess) onSuccess(r);
      return { ok: true };
    }

    // Não pode atacar diretamente - tenta se mover
    const prof = enc.weaponAttackProfile(attacker, weaponId);

    // Arma à distância não resolve andando: o problema é visão ou alcance
    if (prof.ranged) {
      if (onError) onError(check.why);
      return check;
    }

    // Validações de movimento
    if (!enc.podeAtacar(attacker)) {
      const why = "a ação deste turno já foi usada";
      if (onError) onError(why);
      return { ok: false, why };
    }

    if (attacker.movementLeftFt <= 0) {
      const why = `sem movimento para chegar até ${target.name}`;
      if (onError) onError(why);
      return { ok: false, why };
    }

    // Calcula caminho para o alvo
    const path = this.calculateAttackPath(attacker, target, weaponId);

    if (path.canReach) {
      // Consegue chegar e atacar
      enc.moveAlong(attacker, path.path);

      if (onWalk) {
        onWalk(() => {
          const r = enc.attackAction(attacker, target, weaponId);
          if (!r.ok && onError) onError(r.why);
          else if (r.ok && onSuccess) onSuccess(r);
        });
      }

      return { ok: true, needsMovement: true };
    }

    if (path.canAdvance) {
      // Não chega neste turno: avança o que der e guarda a ação
      enc.moveAlong(attacker, path.path);

      const why = `movimento insuficiente para alcançar ${target.name} — avançou o máximo possível, a ação continua sua`;

      if (onWalk) {
        onWalk(() => {
          if (onError) onError(why);
        });
      }

      return { ok: false, why, advanced: true };
    }

    // Não pode se mover
    if (onError) onError(check.why);
    return check;
  }

  /**
   * Tenta conjurar uma magia.
   *
   * @param {Object} caster - Conjurador
   * @param {string} spellId - ID da magia
   * @param {Object} options - { target, point, targets, circulo, opcao }
   * @param {Object} callbacks - { onSuccess, onError, onChoose }
   * @returns {Object} { ok: boolean, why?: string, pending?: boolean }
   */
  tryCast(caster, spellId, options = {}, callbacks = {}) {
    const { onSuccess, onError, onChoose } = callbacks;
    const { target, point, targets, circulo, opcao } = options;

    // Magia com escolha (Aprimorar Atributo, Glifo de Proteção)
    const spell = getSpell(spellId);
    const escolhas = opcao ? null : opcoesDaMagia(spell);

    if (escolhas && onChoose) {
      // Pede escolha ao usuário
      onChoose(escolhas, (escolhida) => {
        this.tryCast(
          caster,
          spellId,
          { ...options, opcao: escolhida },
          callbacks,
        );
      });
      return { ok: true, pending: true };
    }

    // Conjuração
    const result = this.encounter.castSpell(caster, spellId, {
      target,
      point,
      targets,
      circulo,
      opcao,
    });

    if (result.ok && onSuccess) {
      onSuccess(result);
    } else if (!result.ok && onError) {
      onError(result.why);
    }

    return result;
  }

  /**
   * Usa um item do inventário.
   *
   * @param {Object} user - Usuário do item
   * @param {string} itemId - ID do item
   * @param {Object} options - { target, jogando }
   * @param {Object} callbacks - { onSuccess, onError }
   * @returns {Object} { ok: boolean, why?: string }
   */
  useItem(user, itemId, options = {}, callbacks = {}) {
    const { onSuccess, onError } = callbacks;
    const { target, jogando } = options;

    const result = this.encounter.useItem(user, itemId, { target, jogando });

    if (result.ok && onSuccess) {
      onSuccess(result);
    } else if (!result.ok && onError) {
      onError(result.why);
    }

    return result;
  }

  /**
   * Usa uma habilidade de classe.
   *
   * @param {Object} user - Usuário da habilidade
   * @param {string} featureId - ID da habilidade
   * @param {Object} options - { target }
   * @param {Object} callbacks - { onSuccess, onError }
   * @returns {Object} { ok: boolean, why?: string }
   */
  useFeature(user, featureId, options = {}, callbacks = {}) {
    const { onSuccess, onError } = callbacks;
    const { target } = options;

    const result = this.encounter.useFeature(user, featureId, { target });

    if (result.ok && onSuccess) {
      onSuccess(result);
    } else if (!result.ok && onError) {
      onError(result.why);
    }

    return result;
  }

  /**
   * Calcula caminho para ataque (movimento + ataque).
   *
   * Retorna o melhor caminho possível:
   * - canReach: true se consegue chegar e atacar
   * - canAdvance: true se consegue avançar (mas não atacar)
   * - path: caminho a seguir
   *
   * @private
   * @param {Object} attacker - Atacante
   * @param {Object} target - Alvo
   * @param {string} weaponId - ID da arma
   * @returns {Object} { canReach: boolean, canAdvance: boolean, path: Array }
   */
  calculateAttackPath(attacker, target, weaponId) {
    const enc = this.encounter;
    const prof = enc.weaponAttackProfile(attacker, weaponId);
    const reached = enc.reachableFor(attacker);

    let encosta = null;
    let maisPerto = null;

    for (const node of reached.values()) {
      // Tomada por outra criatura (aliado que se atravessa): não serve de destino
      if (node.parar === false) continue;

      const d = distanceFt({ x: node.x, y: node.y }, target.pos);

      // Posição que permite atacar
      if (d <= prof.reachFt && (!encosta || node.cost < encosta.node.cost)) {
        encosta = { node, d };
      }

      // Posição mais próxima possível
      if (
        !maisPerto ||
        d < maisPerto.d ||
        (d === maisPerto.d && node.cost < maisPerto.node.cost)
      ) {
        maisPerto = { node, d };
      }
    }

    // Consegue chegar em alcance de ataque
    if (encosta) {
      return {
        canReach: true,
        canAdvance: false,
        path: Battlefield.pathFrom(reached, encosta.node),
      };
    }

    // Não chega, mas pode avançar
    if (maisPerto && maisPerto.node.cost > 0) {
      return {
        canReach: false,
        canAdvance: true,
        path: Battlefield.pathFrom(reached, maisPerto.node),
      };
    }

    // Não pode se mover
    return {
      canReach: false,
      canAdvance: false,
      path: [],
    };
  }
}
