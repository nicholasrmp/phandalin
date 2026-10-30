import { describe, it, expect, beforeEach, vi } from "vitest";
import { CombatManager } from "../../../app/combat/CombatManager.js";

// Mock dos módulos de combate
vi.mock("../../../app/combat/ActionHandler.js", () => ({
  ActionHandler: vi.fn().mockImplementation(() => ({
    tryAttack: vi.fn(() => ({ ok: true })),
    tryCast: vi.fn(() => ({ ok: true })),
    useItem: vi.fn(() => ({ ok: true })),
    useFeature: vi.fn(() => ({ ok: true })),
  })),
}));

vi.mock("../../../app/combat/TargetingSystem.js", () => ({
  TargetingSystem: vi.fn().mockImplementation(() => ({
    enterTargetingMode: vi.fn(() => ({ ok: true })),
    selectTarget: vi.fn(() => ({ ok: true })),
    exitTargetingMode: vi.fn(),
    isTargeting: vi.fn(() => false),
    getSelectedTargets: vi.fn(() => []),
    getMode: vi.fn(() => null),
  })),
}));

vi.mock("../../../app/combat/TurnManager.js", () => ({
  TurnManager: vi.fn().mockImplementation(() => ({
    endTurn: vi.fn(() => ({ ok: true })),
    getCurrentCombatant: vi.fn(),
    getCurrentRound: vi.fn(() => 1),
    isOver: vi.fn(() => false),
    countActiveCombatants: vi.fn(() => 2),
    getActiveCombatants: vi.fn(() => []),
    toggleAuto: vi.fn(),
  })),
}));

describe("CombatManager", () => {
  let manager;
  let encounter;
  let board;
  let hero;
  let foe;

  beforeEach(() => {
    hero = {
      id: "hero1",
      name: "Herói",
      side: "party",
      x: 0,
      y: 0,
      hp: 20,
      maxHp: 20,
    };

    foe = {
      id: "goblin1",
      name: "Goblin",
      side: "foes",
      x: 10,
      y: 10,
      hp: 7,
      maxHp: 7,
    };

    encounter = {
      combatentes: [hero, foe],
    };

    board = {};

    manager = new CombatManager(encounter, board);
  });

  describe("constructor", () => {
    it("deve inicializar todos os módulos", () => {
      expect(manager.actionHandler).toBeDefined();
      expect(manager.targetingSystem).toBeDefined();
      expect(manager.turnManager).toBeDefined();
      // Sem IA de inimigo aqui: o lado dos monstros roda por `rules/ai.js`.
      expect(manager.foeAI).toBeUndefined();
    });

    it("deve inicializar estado", () => {
      expect(manager.isProcessing).toBe(false);
      expect(manager.autoPlayEnabled).toBe(false);
    });
  });

  describe("startCombat", () => {
    it("deve iniciar combate com sucesso", () => {
      const result = manager.startCombat();
      expect(result.ok).toBe(true);
    });

    it("deve chamar callback onCombatStart", () => {
      const onCombatStart = vi.fn();
      manager.startCombat({ onCombatStart });
      expect(onCombatStart).toHaveBeenCalledWith(encounter);
    });

    it("deve retornar erro se encontro inválido", () => {
      manager.encounter = null;
      const result = manager.startCombat();
      expect(result.ok).toBe(false);
      expect(result.why).toContain("inválido");
    });

    it("deve retornar erro se sem combatentes", () => {
      manager.encounter.combatentes = [];
      const result = manager.startCombat();
      expect(result.ok).toBe(false);
      expect(result.why).toContain("Sem combatentes");
    });

    it("deve resetar estado ao iniciar", () => {
      manager.isProcessing = true;
      manager.autoPlayEnabled = true;

      manager.startCombat();

      expect(manager.isProcessing).toBe(false);
      expect(manager.autoPlayEnabled).toBe(false);
    });
  });

  describe("endCombat", () => {
    it("deve finalizar combate", () => {
      const result = manager.endCombat();
      expect(result.ok).toBe(true);
    });

    it("deve chamar callback onCombatEnd com vencedor", () => {
      const onCombatEnd = vi.fn();
      manager.turnManager.countActiveCombatants.mockImplementation((side) => {
        return side === "party" ? 1 : 0;
      });

      manager.endCombat({ onCombatEnd });

      expect(onCombatEnd).toHaveBeenCalledWith("party");
    });

    it("deve limpar estado ao finalizar", () => {
      manager.isProcessing = true;
      manager.autoPlayEnabled = true;

      manager.endCombat();

      expect(manager.isProcessing).toBe(false);
      expect(manager.autoPlayEnabled).toBe(false);
    });
  });

  describe("attack", () => {
    beforeEach(() => {
      manager.turnManager.getCurrentCombatant.mockReturnValue(hero);
    });

    it("deve executar ataque com sucesso", () => {
      const result = manager.attack(hero, foe, "sword");
      expect(result.ok).toBe(true);
      expect(manager.actionHandler.tryAttack).toHaveBeenCalled();
    });

    it("deve retornar erro se não é o turno", () => {
      manager.turnManager.getCurrentCombatant.mockReturnValue(foe);
      const result = manager.attack(hero, foe, "sword");
      expect(result.ok).toBe(false);
      expect(result.why).toContain("turno");
    });

    it("deve retornar erro se processando", () => {
      manager.isProcessing = true;
      const result = manager.attack(hero, foe, "sword");
      expect(result.ok).toBe(false);
      expect(result.why).toContain("andamento");
    });

    it("deve chamar callbacks de sucesso", () => {
      const onSuccess = vi.fn();
      manager.actionHandler.tryAttack.mockImplementation(
        (a, t, w, callbacks) => {
          callbacks.onSuccess();
          return { ok: true };
        },
      );

      manager.attack(hero, foe, "sword", { onSuccess });

      expect(onSuccess).toHaveBeenCalled();
    });

    it("deve verificar fim de combate após ataque", () => {
      manager.turnManager.isOver.mockReturnValue(true);
      const onCombatEnd = vi.fn();

      manager.actionHandler.tryAttack.mockImplementation(
        (a, t, w, callbacks) => {
          callbacks.onSuccess();
          return { ok: true };
        },
      );

      manager.attack(hero, foe, "sword", { onCombatEnd });

      expect(onCombatEnd).toHaveBeenCalled();
    });
  });

  describe("castSpell", () => {
    beforeEach(() => {
      manager.turnManager.getCurrentCombatant.mockReturnValue(hero);
    });

    it("deve lançar magia com sucesso", () => {
      const result = manager.castSpell(hero, "fireball", { target: foe });
      expect(result.ok).toBe(true);
      expect(manager.actionHandler.tryCast).toHaveBeenCalled();
    });

    it("deve retornar erro se não é o turno", () => {
      manager.turnManager.getCurrentCombatant.mockReturnValue(foe);
      const result = manager.castSpell(hero, "fireball");
      expect(result.ok).toBe(false);
    });

    it("deve retornar erro se processando", () => {
      manager.isProcessing = true;
      const result = manager.castSpell(hero, "fireball");
      expect(result.ok).toBe(false);
    });
  });

  describe("useItem", () => {
    beforeEach(() => {
      manager.turnManager.getCurrentCombatant.mockReturnValue(hero);
    });

    it("deve usar item com sucesso", () => {
      const result = manager.useItem(hero, "potion");
      expect(result.ok).toBe(true);
      expect(manager.actionHandler.useItem).toHaveBeenCalled();
    });

    it("deve retornar erro se não é o turno", () => {
      manager.turnManager.getCurrentCombatant.mockReturnValue(foe);
      const result = manager.useItem(hero, "potion");
      expect(result.ok).toBe(false);
    });
  });

  describe("useFeature", () => {
    beforeEach(() => {
      manager.turnManager.getCurrentCombatant.mockReturnValue(hero);
    });

    it("deve usar habilidade com sucesso", () => {
      const result = manager.useFeature(hero, "second-wind");
      expect(result.ok).toBe(true);
      expect(manager.actionHandler.useFeature).toHaveBeenCalled();
    });

    it("deve retornar erro se não é o turno", () => {
      manager.turnManager.getCurrentCombatant.mockReturnValue(foe);
      const result = manager.useFeature(hero, "second-wind");
      expect(result.ok).toBe(false);
    });
  });

  describe("enterTargeting", () => {
    beforeEach(() => {
      manager.turnManager.getCurrentCombatant.mockReturnValue(hero);
    });

    it("deve entrar em modo targeting", () => {
      const spell = { id: "fireball", name: "Bola de Fogo" };
      const result = manager.enterTargeting(spell, hero);
      expect(result.ok).toBe(true);
      expect(manager.targetingSystem.enterTargetingMode).toHaveBeenCalled();
    });

    it("deve retornar erro se não é o turno", () => {
      manager.turnManager.getCurrentCombatant.mockReturnValue(foe);
      const spell = { id: "fireball" };
      const result = manager.enterTargeting(spell, hero);
      expect(result.ok).toBe(false);
    });
  });

  describe("selectTarget", () => {
    it("deve selecionar alvo", () => {
      const result = manager.selectTarget(foe);
      expect(result.ok).toBe(true);
      expect(manager.targetingSystem.selectTarget).toHaveBeenCalled();
    });
  });

  describe("exitTargeting", () => {
    it("deve sair do modo targeting", () => {
      manager.exitTargeting();
      expect(manager.targetingSystem.exitTargetingMode).toHaveBeenCalled();
    });
  });

  describe("endTurn", () => {
    beforeEach(() => {
      manager.turnManager.getCurrentCombatant.mockReturnValue(hero);
    });

    it("deve finalizar turno com sucesso", () => {
      const result = manager.endTurn();
      expect(result.ok).toBe(true);
      expect(manager.turnManager.endTurn).toHaveBeenCalled();
    });

    it("deve retornar erro se processando", () => {
      manager.isProcessing = true;
      const result = manager.endTurn();
      expect(result.ok).toBe(false);
    });

    it("deve retornar erro se sem combatente ativo", () => {
      manager.turnManager.getCurrentCombatant.mockReturnValue(null);
      const result = manager.endTurn();
      expect(result.ok).toBe(false);
      expect(result.why).toContain("Sem combatente");
    });

    it("deve chamar callbacks de turno", () => {
      const onTurnEnd = vi.fn();
      manager.turnManager.endTurn.mockImplementation((c, callbacks) => {
        callbacks.onTurnEnd(c);
        return { ok: true };
      });

      manager.endTurn({ onTurnEnd });

      expect(onTurnEnd).toHaveBeenCalled();
    });
  });

  describe("executeFoeTurn", () => {
    it("recusa: o lado dos inimigos roda por rules/ai.js, não aqui", () => {
      // O método existia com uma IA própria que lia campos inexistentes
      // (`.lado`, `.pv`, `.armas`) e por isso nenhum inimigo agia. Hoje ele só
      // avisa quem o procurar; quem roda o lado é `CombatAdapter.runFoes`.
      const result = manager.executeFoeTurn(foe);
      expect(result.ok).toBe(false);
      expect(result.why).toMatch(/rules\/ai\.js/);
    });
  });

  describe("toggleAutoPlay", () => {
    it("deve ativar modo automático", () => {
      manager.toggleAutoPlay(true);
      expect(manager.autoPlayEnabled).toBe(true);
      expect(manager.turnManager.toggleAuto).toHaveBeenCalledWith(true);
    });

    it("deve desativar modo automático", () => {
      manager.autoPlayEnabled = true;
      manager.toggleAutoPlay(false);
      expect(manager.autoPlayEnabled).toBe(false);
    });
  });

  describe("isCurrentTurn", () => {
    it("deve retornar true se é o turno do combatente", () => {
      manager.turnManager.getCurrentCombatant.mockReturnValue(hero);
      expect(manager.isCurrentTurn(hero)).toBe(true);
    });

    it("deve retornar false se não é o turno", () => {
      manager.turnManager.getCurrentCombatant.mockReturnValue(foe);
      expect(manager.isCurrentTurn(hero)).toBe(false);
    });
  });

  describe("getWinner", () => {
    it('deve retornar "party" se apenas heróis vivos', () => {
      manager.turnManager.countActiveCombatants.mockImplementation((side) => {
        return side === "party" ? 1 : 0;
      });

      expect(manager.getWinner()).toBe("party");
    });

    it('deve retornar "foes" se apenas inimigos vivos', () => {
      manager.turnManager.countActiveCombatants.mockImplementation((side) => {
        return side === "party" ? 0 : 1;
      });

      expect(manager.getWinner()).toBe("foes");
    });

    it("deve retornar null se ambos vivos", () => {
      manager.turnManager.countActiveCombatants.mockReturnValue(1);
      expect(manager.getWinner()).toBeNull();
    });
  });

  describe("getters", () => {
    it("getCurrentCombatant deve retornar combatente atual", () => {
      manager.turnManager.getCurrentCombatant.mockReturnValue(hero);
      expect(manager.getCurrentCombatant()).toBe(hero);
    });

    it("getCurrentRound deve retornar round atual", () => {
      manager.turnManager.getCurrentRound.mockReturnValue(3);
      expect(manager.getCurrentRound()).toBe(3);
    });

    it("isTargeting deve retornar estado de targeting", () => {
      manager.targetingSystem.isTargeting.mockReturnValue(true);
      expect(manager.isTargeting()).toBe(true);
    });

    it("getSelectedTargets deve retornar alvos selecionados", () => {
      const targets = [foe];
      manager.targetingSystem.getSelectedTargets.mockReturnValue(targets);
      expect(manager.getSelectedTargets()).toBe(targets);
    });

    it("getTargetingMode deve retornar modo de targeting", () => {
      manager.targetingSystem.getMode.mockReturnValue("multi");
      expect(manager.getTargetingMode()).toBe("multi");
    });

    it("isCombatOver deve retornar se combate terminou", () => {
      manager.turnManager.isOver.mockReturnValue(true);
      expect(manager.isCombatOver()).toBe(true);
    });

    it("getActiveCombatants deve retornar combatentes ativos", () => {
      const active = [hero, foe];
      manager.turnManager.getActiveCombatants.mockReturnValue(active);
      expect(manager.getActiveCombatants()).toBe(active);
    });

    it("countActiveCombatants deve contar combatentes ativos", () => {
      manager.turnManager.countActiveCombatants.mockReturnValue(5);
      expect(manager.countActiveCombatants()).toBe(5);
    });
  });
});
