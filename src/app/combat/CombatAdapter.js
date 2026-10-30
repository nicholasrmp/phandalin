/**
 * CombatAdapter - Camada de compatibilidade entre App e CombatManager
 *
 * Responsabilidades:
 * - Manter interface original dos métodos do App
 * - Delegar operações para CombatManager
 * - Garantir zero breaking changes
 * - Facilitar transição gradual
 */

import { CombatManager } from "./CombatManager.js";
import { runMonsterSide } from "../../rules/ai.js";

export class CombatAdapter {
  /**
   * @param {Object} app - Referência à instância do App
   * @param {Object} deps - Dependências externas (getSpell, opcoesDaMagia)
   */
  constructor(app, deps = {}) {
    this.app = app;
    this.combatManager = null;
    this.getSpell = deps.getSpell || null;
    this.opcoesDaMagia = deps.opcoesDaMagia || null;
  }

  /**
   * Inicializa o CombatManager quando um encontro é criado
   * @param {Object} encounter - Encontro atual
   * @param {Object} board - Tabuleiro
   */
  initialize(encounter, board) {
    this.combatManager = new CombatManager(encounter, board);
  }

  /**
   * Verifica se o adapter está inicializado
   * @returns {boolean}
   * @private
   */
  isInitialized() {
    return this.combatManager !== null;
  }

  /**
   * Tenta executar um ataque
   * @param {Object} c - Combatente atacante
   * @param {Object} target - Alvo do ataque
   * @param {string} weaponId - ID da arma
   */
  tryAttack(c, target, weaponId) {
    if (!this.isInitialized()) {
      console.warn("CombatAdapter não inicializado, usando método original");
      return;
    }

    const enc = this.app.enc;
    const check = enc.canAttack(c, target, weaponId);

    if (check.ok) {
      // Ataque direto sem movimento
      return this.combatManager.attack(c, target, weaponId, {
        onSuccess: () => {
          this.app.mode = null;
          this.app.afterAct(c);
        },
        onError: (why) => {
          this.app.mode = null;
          this.app.refuse(c, why);
        },
      });
    }

    // Precisa de movimento
    const prof = enc.weaponAttackProfile(c, weaponId);

    // Arma à distância não resolve andando
    if (prof.ranged) {
      this.app.refuse(c, check.why);
      return;
    }

    if (!enc.podeAtacar(c)) {
      this.app.refuse(c, "a ação deste turno já foi usada");
      return;
    }

    if (c.movementLeftFt <= 0) {
      this.app.refuse(c, `sem movimento para chegar até ${target.name}`);
      return;
    }

    // Calcular caminho e mover
    const reached = enc.reachableFor(c);
    let encosta = null;
    let maisPerto = null;

    for (const node of reached.values()) {
      if (node.parar === false) continue;

      const d = this.distanceFt({ x: node.x, y: node.y }, target.pos);

      if (d <= prof.reachFt && (!encosta || node.cost < encosta.node.cost)) {
        encosta = { node, d };
      }

      if (
        !maisPerto ||
        d < maisPerto.d ||
        (d === maisPerto.d && node.cost < maisPerto.node.cost)
      ) {
        maisPerto = { node, d };
      }
    }

    if (encosta) {
      // Consegue chegar e atacar
      const path = this.pathFrom(reached, encosta.node);
      enc.moveAlong(c, path);
      this.app.mode = null;

      this.app.afterWalk(() => {
        const r = enc.attackAction(c, target, weaponId);
        if (!r.ok) {
          this.app.refuse(c, r.why);
        } else {
          this.app.afterAct(c);
        }
      });
      return;
    }

    // Não chega neste turno
    if (maisPerto && maisPerto.node.cost > 0) {
      const path = this.pathFrom(reached, maisPerto.node);
      enc.moveAlong(c, path);
      this.app.mode = null;

      this.app.afterWalk(() => {
        this.app.refuse(
          c,
          `movimento insuficiente para alcançar ${target.name} — avançou o máximo possível, a ação continua sua`,
        );
      });
      return;
    }

    this.app.refuse(c, check.why);
  }

  /**
   * Tenta lançar uma magia
   * @param {Object} c - Conjurador
   * @param {string} spellId - ID da magia
   * @param {Object} options - Opções (target, point, targets, opcao)
   */
  tryCast(c, spellId, options = {}) {
    if (!this.isInitialized()) {
      console.warn("CombatAdapter não inicializado, usando método original");
      return;
    }

    const {
      target = null,
      point = null,
      targets = null,
      opcao = null,
    } = options;

    // Verificar se precisa de menu de opções
    const circulo =
      this.app.mode?.kind === "spell" && this.app.mode.spellId === spellId
        ? this.app.mode.circulo
        : null;

    const opcaoFinal = opcao ?? this.app._opcaoDeFora ?? null;
    const lista = opcaoFinal
      ? null
      : this.opcoesDaMagia
        ? this.opcoesDaMagia(this.getSpell ? this.getSpell(spellId) : null)
        : null;

    if (lista) {
      // Precisa abrir menu de opções
      const spell = this.getSpell ? this.getSpell(spellId) : null;
      if (!spell) return;
      const sugerida = spell.escolheTipoDoGlifo
        ? this.app.enc.tipoDoGlifo(null, c)
        : this.app.enc.opcaoDeAprimorar(target ?? c);

      const ordem = [...lista].sort(
        (a, b) => (b.id === sugerida) - (a.id === sugerida),
      );

      this.app.abrirMenuContexto(this.app.root, {
        x: NaN,
        y: NaN,
        titulo: spell.name,
        subtitulo: "escolha uma opção",
        opcoes: ordem.map((o) => ({
          rotulo: o.rotulo,
          detalhe:
            o.id === sugerida ? `sugerida — ${o.detalhe ?? ""}` : o.detalhe,
          destaque: o.id === sugerida,
          fazer: () =>
            this.tryCast(c, spellId, { target, point, targets, opcao: o.id }),
        })),
      });
      return;
    }

    // Lançar magia
    return this.combatManager.castSpell(
      c,
      spellId,
      {
        target,
        point,
        targets,
        circulo,
        opcao: opcaoFinal,
      },
      {
        onSuccess: () => {
          this.app.mode = null;
          this.app.afterAct();
        },
        onError: (why) => {
          this.app.mode = null;
          this.app.refuse(c, why);
        },
      },
    );
  }

  /**
   * Termina o turno de um combatente
   * @param {Object} c - Combatente
   */
  terminarTurnoDe(c) {
    if (!this.isInitialized()) {
      console.warn("CombatAdapter não inicializado, usando método original");
      return;
    }

    return this.combatManager.endTurn({
      onTurnEnd: (combatant) => {
        // Atualizar UI do turno
        if (this.app.onTurnEnd) {
          this.app.onTurnEnd(combatant);
        }
      },
      onRoundEnd: (round) => {
        // Processar fim de round
        if (this.app.onRoundEnd) {
          this.app.onRoundEnd(round);
        }
      },
      onCombatEnd: (winner) => {
        // Finalizar combate
        if (this.app.onCombatEnd) {
          this.app.onCombatEnd(winner);
        }
      },
    });
  }

  /**
   * Executa o lado dos inimigos — delegando para a IA de `rules/ai.js`.
   *
   * Esta é a IA revisada do projeto (fecha distância, foca em quem está
   * machucado, usa Escapada Ágil) e a única: o adaptador NÃO decide o turno do
   * monstro. Uma segunda IA aqui seria uma segunda fonte de verdade, que o
   * parecer das regras já teria de revisar de novo.
   *
   * A pausa entre monstros tem que ser maior que a animação do golpe, senão um
   * começa a agir enquanto o anterior ainda está no ar: flecha viajando (0,3 s)
   * + estilhaços (0,42 s) ≈ 0,7 s.
   *
   * @returns {Promise<void>}
   */
  async runFoes() {
    const app = this.app;
    app.refresh();
    await runMonsterSide(app.enc, {
      delayMs: () => 420 + app.walkWaitMs,
      onStep: () => app.refresh(),
    });
    app.refresh();
  }

  /**
   * Entra em modo de seleção de alvo
   * @param {Object} action - Ação (spell ou feature)
   * @param {Object} caster - Conjurador
   * @returns {Object} Resultado
   */
  enterTargeting(action, caster) {
    if (!this.isInitialized()) {
      console.warn("CombatAdapter não inicializado");
      return { ok: false, why: "Adapter não inicializado" };
    }

    return this.combatManager.enterTargeting(action, caster);
  }

  /**
   * Seleciona um alvo
   * @param {Object} target - Alvo selecionado
   * @param {Object} callbacks - Callbacks
   * @returns {Object} Resultado
   */
  selectTarget(target, callbacks = {}) {
    if (!this.isInitialized()) {
      console.warn("CombatAdapter não inicializado");
      return { ok: false, why: "Adapter não inicializado" };
    }

    return this.combatManager.selectTarget(target, callbacks);
  }

  /**
   * Sai do modo de targeting
   */
  exitTargeting() {
    if (!this.isInitialized()) {
      return;
    }

    this.combatManager.exitTargeting();
  }

  // Getters para estado

  /**
   * Obtém o combatente atual
   * @returns {Object|null}
   */
  getCurrentCombatant() {
    if (!this.isInitialized()) {
      return null;
    }

    return this.combatManager.getCurrentCombatant();
  }

  /**
   * Obtém o round atual
   * @returns {number}
   */
  getCurrentRound() {
    if (!this.isInitialized()) {
      return 0;
    }

    return this.combatManager.getCurrentRound();
  }

  /**
   * Verifica se está em modo de targeting
   * @returns {boolean}
   */
  isTargeting() {
    if (!this.isInitialized()) {
      return false;
    }

    return this.combatManager.isTargeting();
  }

  /**
   * Obtém alvos selecionados
   * @returns {Array}
   */
  getSelectedTargets() {
    if (!this.isInitialized()) {
      return [];
    }

    return this.combatManager.getSelectedTargets();
  }

  /**
   * Obtém modo de targeting atual
   * @returns {string|null}
   */
  getTargetingMode() {
    if (!this.isInitialized()) {
      return null;
    }

    return this.combatManager.getTargetingMode();
  }

  /**
   * Verifica se o combate terminou
   * @returns {boolean}
   */
  isCombatOver() {
    if (!this.isInitialized()) {
      return false;
    }

    return this.combatManager.isCombatOver();
  }

  // Métodos auxiliares

  /**
   * Calcula distância em pés
   * @param {Object} pos1 - Posição 1
   * @param {Object} pos2 - Posição 2
   * @returns {number}
   * @private
   */
  distanceFt(pos1, pos2) {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    return Math.sqrt(dx * dx + dy * dy) * 5; // Assumindo grid de 5ft
  }

  /**
   * Reconstrói caminho a partir de nós
   * @param {Map} reached - Mapa de nós alcançáveis
   * @param {Object} node - Nó destino
   * @returns {Array} Caminho
   * @private
   */
  pathFrom(reached, node) {
    const path = [];
    let current = node;

    while (current) {
      path.unshift({ x: current.x, y: current.y });
      current = current.parent
        ? reached.get(`${current.parent.x},${current.parent.y}`)
        : null;
    }

    return path;
  }

  /**
   * Aguarda um tempo em milissegundos
   * @param {number} ms - Milissegundos
   * @returns {Promise<void>}
   * @private
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
