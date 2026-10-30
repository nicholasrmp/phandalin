import { describe, it, expect, beforeEach, vi } from "vitest";
import { TurnManager } from "../../../app/combat/TurnManager.js";

// Sem mock de `rules/conditions.js` DE PROPÓSITO: usa-se o módulo de verdade.
//
// O mock anterior fingia `hasCondition`, e foi ele que escondeu o defeito — o
// TurnManager perguntava por uma condição chamada `incapacitated`, que não
// existe (os nomes são `inconsciente`, `paralisado`, `atordoado`...), e o mock
// concordava devolvendo `false` para qualquer pergunta. Com o módulo real, uma
// pergunta errada aparece no teste.
//
// Para marcar um combatente de teste: `addCondition(c, 'inconsciente')`.

describe("TurnManager", () => {
  let manager;
  let mockEncounter;

  beforeEach(() => {
    // Mock do Encounter
    mockEncounter = {
      combatants: [
        { id: "hero1", name: "Guerreiro", side: "party", dead: false },
        { id: "hero2", name: "Mago", side: "party", dead: false },
        { id: "foe1", name: "Goblin 1", side: "foes", dead: false },
        { id: "foe2", name: "Goblin 2", side: "foes", dead: false },
      ],
      current: 0,
      round: 1,
      over: false,
      side: "party",
      auto: false,
      endTurn: vi.fn(() => ({ ok: true })),
    };

    manager = new TurnManager(mockEncounter);
  });

  describe("constructor", () => {
    it("deve inicializar com encounter", () => {
      expect(manager.encounter).toBe(mockEncounter);
    });
  });

  describe("endTurn", () => {
    it("deve finalizar turno e retornar próximo combatente", () => {
      const combatant = mockEncounter.combatants[0];
      const onTurnEnd = vi.fn();
      const onNextTurn = vi.fn();

      const result = manager.endTurn(combatant, { onTurnEnd, onNextTurn });

      expect(result.ok).toBe(true);
      expect(result.nextCombatant).toBeDefined();
      expect(mockEncounter.endTurn).toHaveBeenCalledWith(combatant);
      expect(onTurnEnd).toHaveBeenCalledWith(combatant, { ok: true });
      expect(onNextTurn).toHaveBeenCalled();
    });

    it("deve chamar onRoundEnd no fim da rodada", () => {
      mockEncounter.current = 3; // Último combatente
      const combatant = mockEncounter.combatants[3];
      const onRoundEnd = vi.fn();

      manager.endTurn(combatant, { onRoundEnd });

      expect(onRoundEnd).toHaveBeenCalledWith(1);
    });

    it("deve funcionar sem callbacks", () => {
      const combatant = mockEncounter.combatants[0];
      const result = manager.endTurn(combatant);

      expect(result.ok).toBe(true);
    });

    it("deve funcionar sem método endTurn no encounter", () => {
      delete mockEncounter.endTurn;
      const combatant = mockEncounter.combatants[0];

      const result = manager.endTurn(combatant);

      expect(result.ok).toBe(true);
    });
  });

  describe("getNextCombatant", () => {
    it("deve retornar próximo combatente vivo", () => {
      mockEncounter.current = 0;

      const next = manager.getNextCombatant();

      expect(next).toBe(mockEncounter.combatants[1]);
    });

    it("deve circular pela lista de combatentes", () => {
      mockEncounter.current = 3; // Último

      const next = manager.getNextCombatant();

      expect(next).toBe(mockEncounter.combatants[0]); // Volta ao primeiro
    });

    it("deve pular combatentes mortos", () => {
      mockEncounter.current = 0;
      mockEncounter.combatants[1].dead = true;

      const next = manager.getNextCombatant();

      expect(next).toBe(mockEncounter.combatants[2]); // Pula o morto
    });

    it("deve retornar null se combate acabou", () => {
      mockEncounter.over = true;

      const next = manager.getNextCombatant();

      expect(next).toBeNull();
    });

    it("deve retornar null se não há combatentes", () => {
      mockEncounter.combatants = [];

      const next = manager.getNextCombatant();

      expect(next).toBeNull();
    });
  });

  describe("getFirstActive", () => {
    it("deve retornar primeiro combatente ativo", () => {
      const first = manager.getFirstActive();

      expect(first).toBe(mockEncounter.combatants[0]);
    });

    it("deve pular combatentes mortos no início", () => {
      mockEncounter.combatants[0].dead = true;

      const first = manager.getFirstActive();

      expect(first).toBe(mockEncounter.combatants[1]);
    });

    it("deve retornar null se não há combatentes", () => {
      mockEncounter.combatants = null;

      const first = manager.getFirstActive();

      expect(first).toBeNull();
    });
  });

  describe("isRoundEnd", () => {
    it("deve detectar fim de rodada", () => {
      mockEncounter.current = 3; // Último combatente

      expect(manager.isRoundEnd()).toBe(true);
    });

    it("deve retornar false no meio da rodada", () => {
      mockEncounter.current = 1;

      expect(manager.isRoundEnd()).toBe(false);
    });

    it("deve retornar false sem combatentes", () => {
      mockEncounter.combatants = [];

      expect(manager.isRoundEnd()).toBe(false);
    });
  });

  describe("skipToNext", () => {
    it("deve pular para próximo turno", () => {
      const onNextTurn = vi.fn();

      const result = manager.skipToNext({ onNextTurn });

      expect(result.ok).toBe(true);
      expect(result.nextCombatant).toBeDefined();
      expect(onNextTurn).toHaveBeenCalled();
    });
  });

  describe("toggleAuto", () => {
    it("deve ativar modo automático", () => {
      const result = manager.toggleAuto(true);

      expect(result.ok).toBe(true);
      expect(result.auto).toBe(true);
      expect(mockEncounter.auto).toBe(true);
    });

    it("deve desativar modo automático", () => {
      mockEncounter.auto = true;

      const result = manager.toggleAuto(false);

      expect(result.ok).toBe(true);
      expect(result.auto).toBe(false);
      expect(mockEncounter.auto).toBe(false);
    });
  });

  describe("getCurrentCombatant", () => {
    it("deve retornar combatente atual", () => {
      mockEncounter.current = 2;

      const current = manager.getCurrentCombatant();

      expect(current).toBe(mockEncounter.combatants[2]);
    });

    it("deve retornar null se índice inválido", () => {
      mockEncounter.current = 10;

      const current = manager.getCurrentCombatant();

      expect(current).toBeNull();
    });

    it("deve retornar null sem combatentes", () => {
      mockEncounter.combatants = null;

      const current = manager.getCurrentCombatant();

      expect(current).toBeNull();
    });
  });

  describe("getCurrentRound", () => {
    it("deve retornar número da rodada atual", () => {
      mockEncounter.round = 5;

      expect(manager.getCurrentRound()).toBe(5);
    });

    it("deve retornar 1 se rodada não definida", () => {
      mockEncounter.round = undefined;

      expect(manager.getCurrentRound()).toBe(1);
    });
  });

  describe("isOver", () => {
    it("deve retornar true se combate acabou", () => {
      mockEncounter.over = true;

      expect(manager.isOver()).toBe(true);
    });

    it("deve retornar false se combate continua", () => {
      mockEncounter.over = false;

      expect(manager.isOver()).toBe(false);
    });
  });

  describe("getCurrentSide", () => {
    it("deve retornar lado atual", () => {
      mockEncounter.side = "foes";

      expect(manager.getCurrentSide()).toBe("foes");
    });

    it("deve retornar null se não definido", () => {
      mockEncounter.side = undefined;

      expect(manager.getCurrentSide()).toBeNull();
    });
  });

  describe("countActiveCombatants", () => {
    it("deve contar todos os combatentes ativos", () => {
      const count = manager.countActiveCombatants();

      expect(count).toBe(4);
    });

    it("deve contar apenas combatentes de um lado", () => {
      const count = manager.countActiveCombatants("party");

      expect(count).toBe(2);
    });

    it("deve excluir combatentes mortos", () => {
      mockEncounter.combatants[0].dead = true;

      const count = manager.countActiveCombatants();

      expect(count).toBe(3);
    });

    it("deve retornar 0 sem combatentes", () => {
      mockEncounter.combatants = [];

      const count = manager.countActiveCombatants();

      expect(count).toBe(0);
    });
  });

  describe("isActive", () => {
    it("deve retornar true para combatente ativo", () => {
      const combatant = mockEncounter.combatants[0];

      expect(manager.isActive(combatant)).toBe(true);
    });

    it("deve retornar false para combatente morto", () => {
      const combatant = { ...mockEncounter.combatants[0], dead: true };

      expect(manager.isActive(combatant)).toBe(false);
    });

    it("deve retornar false para null", () => {
      expect(manager.isActive(null)).toBe(false);
    });
  });

  describe("getActiveCombatants", () => {
    it("deve retornar todos os combatentes ativos", () => {
      const actives = manager.getActiveCombatants();

      expect(actives).toHaveLength(4);
    });

    it("deve retornar apenas combatentes de um lado", () => {
      const actives = manager.getActiveCombatants("foes");

      expect(actives).toHaveLength(2);
      expect(actives[0].side).toBe("foes");
      expect(actives[1].side).toBe("foes");
    });

    it("deve excluir combatentes mortos", () => {
      mockEncounter.combatants[0].dead = true;
      mockEncounter.combatants[2].dead = true;

      const actives = manager.getActiveCombatants();

      expect(actives).toHaveLength(2);
    });

    it("deve retornar array vazio sem combatentes", () => {
      mockEncounter.combatants = [];

      const actives = manager.getActiveCombatants();

      expect(actives).toEqual([]);
    });
  });
});
