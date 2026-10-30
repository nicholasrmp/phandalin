import { describe, it, expect, beforeEach, vi } from "vitest";
import { TargetingSystem } from "../../../app/combat/TargetingSystem.js";
import * as spells from "../../../rules/spells.js";

// Mock getSpell
vi.mock("../../../rules/spells.js", async () => {
  const actual = await vi.importActual("../../../rules/spells.js");
  return {
    ...actual,
    getSpell: vi.fn((id) => ({
      id,
      name: "Magia Teste",
      kind: "area", // Por padrão, não permite repetir alvos
    })),
  };
});

describe("TargetingSystem", () => {
  let system;
  let mockEncounter;
  let mockBoard;

  beforeEach(() => {
    // Mock do Encounter
    mockEncounter = {
      circuloDeConjuracao: vi.fn(),
      alvosDaMagia: vi.fn(),
      porqueNaoAlvo: vi.fn(),
      dentroDoCubo: vi.fn(),
    };

    // Mock do Board
    mockBoard = {};

    system = new TargetingSystem(mockEncounter, mockBoard);
  });

  describe("constructor", () => {
    it("deve inicializar com encounter e board", () => {
      expect(system.encounter).toBe(mockEncounter);
      expect(system.board).toBe(mockBoard);
      expect(system.mode).toBeNull();
      expect(system.selectedTargets).toEqual([]);
    });
  });

  describe("enterTargetingMode", () => {
    it("deve entrar em modo de seleção para magia", () => {
      const action = { kind: "spell", spellId: "fireball" };
      const caster = { id: "hero1", name: "Mago" };

      mockEncounter.circuloDeConjuracao.mockReturnValue(3);
      mockEncounter.alvosDaMagia.mockReturnValue(5);

      const result = system.enterTargetingMode(action, caster);

      expect(result.ok).toBe(true);
      expect(result.maxTargets).toBe(5);
      expect(system.mode).toBeDefined();
      expect(system.mode.kind).toBe("spell");
      expect(system.mode.caster).toBe(caster);
      expect(system.selectedTargets).toEqual([]);
    });

    it("deve entrar em modo de seleção para ataque", () => {
      const action = { kind: "attack", weaponId: "longsword" };
      const caster = { id: "hero1", name: "Guerreiro" };

      const result = system.enterTargetingMode(action, caster);

      expect(result.ok).toBe(true);
      expect(result.maxTargets).toBe(1);
      expect(system.mode.kind).toBe("attack");
    });

    it("deve entrar em modo de seleção para habilidade", () => {
      const action = { kind: "featureAlvo", featureId: "lay-on-hands" };
      const caster = { id: "hero1", name: "Paladino" };

      const result = system.enterTargetingMode(action, caster);

      expect(result.ok).toBe(true);
      expect(result.maxTargets).toBe(1);
      expect(system.mode.kind).toBe("featureAlvo");
    });

    it("deve recusar tipo de ação não suportado", () => {
      const action = { kind: "unknown" };
      const caster = { id: "hero1" };

      const result = system.enterTargetingMode(action, caster);

      expect(result.ok).toBe(false);
      expect(result.why).toBe("Tipo de ação não suportado");
    });
  });

  describe("selectTarget", () => {
    beforeEach(() => {
      const action = { kind: "spell", spellId: "magic-missile" };
      const caster = { id: "hero1", name: "Mago" };
      mockEncounter.circuloDeConjuracao.mockReturnValue(1);
      mockEncounter.alvosDaMagia.mockReturnValue(3);
      system.enterTargetingMode(action, caster);
    });

    it("deve selecionar alvo válido", () => {
      const target = { id: "foe1", name: "Goblin" };
      mockEncounter.porqueNaoAlvo.mockReturnValue(null);

      const onUpdate = vi.fn();
      const result = system.selectTarget(target, { onUpdate });

      expect(result.ok).toBe(true);
      expect(result.complete).toBe(false);
      expect(result.targets).toHaveLength(1);
      expect(result.targets[0]).toBe(target);
      expect(onUpdate).toHaveBeenCalledWith([target]);
    });

    it("deve chamar onComplete quando atingir máximo de alvos", () => {
      const targets = [
        { id: "foe1", name: "Goblin 1" },
        { id: "foe2", name: "Goblin 2" },
        { id: "foe3", name: "Goblin 3" },
      ];
      mockEncounter.porqueNaoAlvo.mockReturnValue(null);

      const onComplete = vi.fn();

      system.selectTarget(targets[0], {});
      system.selectTarget(targets[1], {});
      const result = system.selectTarget(targets[2], { onComplete });

      expect(result.ok).toBe(true);
      expect(result.complete).toBe(true);
      expect(result.targets).toHaveLength(3);
      expect(onComplete).toHaveBeenCalledWith(targets);
    });

    it("deve chamar onError para alvo inválido", () => {
      const target = { id: "foe1", name: "Goblin" };
      mockEncounter.porqueNaoAlvo.mockReturnValue("Fora de alcance");

      const onError = vi.fn();
      const result = system.selectTarget(target, { onError });

      expect(result.ok).toBe(false);
      expect(result.why).toBe("Fora de alcance");
      expect(onError).toHaveBeenCalledWith("Fora de alcance");
    });

    it("deve desmarcar alvo ao clicar novamente", () => {
      const target = { id: "foe1", name: "Goblin" };
      mockEncounter.porqueNaoAlvo.mockReturnValue(null);

      // Seleciona
      system.selectTarget(target, {});
      expect(system.selectedTargets).toHaveLength(1);

      // Desmarca (funciona porque o mock padrão usa kind: "area")
      const result = system.selectTarget(target, {});
      expect(result.ok).toBe(true);
      expect(result.targets).toHaveLength(0);
    });

    it("deve recusar quando não está em modo de seleção", () => {
      system.exitTargetingMode();

      const target = { id: "foe1" };
      const onError = vi.fn();
      const result = system.selectTarget(target, { onError });

      expect(result.ok).toBe(false);
      expect(onError).toHaveBeenCalledWith("Não está em modo de seleção");
    });
  });

  describe("validateSpecialRules", () => {
    it("deve validar regra de cubo", () => {
      const spell = { cuboFt: 40 };
      const target = { id: "foe1", pos: { x: 5, y: 5 } };

      system.selectedTargets = [{ id: "foe2", pos: { x: 3, y: 3 } }];
      mockEncounter.dentroDoCubo.mockReturnValue([
        system.selectedTargets[0],
        target,
      ]);

      const result = system.validateSpecialRules(spell, target);

      expect(result.ok).toBe(true);
    });

    it("deve recusar alvo fora do cubo", () => {
      const spell = { cuboFt: 40 };
      const target = { id: "foe1", pos: { x: 10, y: 10 } };

      system.selectedTargets = [{ id: "foe2", pos: { x: 3, y: 3 } }];
      mockEncounter.dentroDoCubo.mockReturnValue([system.selectedTargets[0]]);

      const result = system.validateSpecialRules(spell, target);

      expect(result.ok).toBe(false);
      expect(result.why).toContain("fora do cubo");
    });

    it("deve validar regra de distância", () => {
      const spell = { juntosFt: 5 };
      const target = { id: "foe1", pos: { x: 3, y: 3 } };

      system.selectedTargets = [{ id: "foe2", pos: { x: 3, y: 3 } }];

      const result = system.validateSpecialRules(spell, target);

      expect(result.ok).toBe(true);
    });

    it("deve recusar alvo muito longe", () => {
      const spell = { juntosFt: 5 };
      const target = { id: "foe1", pos: { x: 10, y: 10 } };

      system.selectedTargets = [{ id: "foe2", pos: { x: 3, y: 3 } }];

      const result = system.validateSpecialRules(spell, target);

      expect(result.ok).toBe(false);
      expect(result.why).toContain("segundo alvo");
    });
  });

  describe("validateTarget", () => {
    it("deve validar alvo de magia", () => {
      const action = { kind: "spell", spellId: "fireball" };
      const caster = { id: "hero1" };
      mockEncounter.circuloDeConjuracao.mockReturnValue(3);
      mockEncounter.alvosDaMagia.mockReturnValue(1);
      system.enterTargetingMode(action, caster);

      const target = { id: "foe1" };
      mockEncounter.porqueNaoAlvo.mockReturnValue(null);

      const result = system.validateTarget(target);

      expect(result.ok).toBe(true);
    });

    it("deve recusar alvo inválido", () => {
      const action = { kind: "spell", spellId: "fireball" };
      const caster = { id: "hero1" };
      mockEncounter.circuloDeConjuracao.mockReturnValue(3);
      mockEncounter.alvosDaMagia.mockReturnValue(1);
      system.enterTargetingMode(action, caster);

      const target = { id: "foe1" };
      mockEncounter.porqueNaoAlvo.mockReturnValue("Imune a fogo");

      const result = system.validateTarget(target);

      expect(result.ok).toBe(false);
      expect(result.why).toBe("Imune a fogo");
    });

    it("deve recusar quando não está em modo de seleção", () => {
      const target = { id: "foe1" };
      const result = system.validateTarget(target);

      expect(result.ok).toBe(false);
      expect(result.why).toBe("Não está em modo de seleção");
    });
  });

  describe("exitTargetingMode", () => {
    it("deve limpar modo e alvos", () => {
      const action = { kind: "attack", weaponId: "longsword" };
      const caster = { id: "hero1" };
      system.enterTargetingMode(action, caster);
      system.selectedTargets = [{ id: "foe1" }];

      system.exitTargetingMode();

      expect(system.mode).toBeNull();
      expect(system.selectedTargets).toEqual([]);
    });
  });

  describe("getSelectedTargets", () => {
    it("deve retornar cópia dos alvos selecionados", () => {
      system.selectedTargets = [{ id: "foe1" }, { id: "foe2" }];

      const targets = system.getSelectedTargets();

      expect(targets).toEqual(system.selectedTargets);
      expect(targets).not.toBe(system.selectedTargets); // Cópia, não referência
    });
  });

  describe("isTargeting", () => {
    it("deve retornar true quando em modo de seleção", () => {
      const action = { kind: "attack", weaponId: "longsword" };
      const caster = { id: "hero1" };
      system.enterTargetingMode(action, caster);

      expect(system.isTargeting()).toBe(true);
    });

    it("deve retornar false quando não em modo de seleção", () => {
      expect(system.isTargeting()).toBe(false);
    });
  });

  describe("getMode", () => {
    it("deve retornar cópia do modo atual", () => {
      const action = { kind: "attack", weaponId: "longsword" };
      const caster = { id: "hero1" };
      system.enterTargetingMode(action, caster);

      const mode = system.getMode();

      expect(mode).toBeDefined();
      expect(mode.kind).toBe("attack");
      expect(mode).not.toBe(system.mode); // Cópia, não referência
    });

    it("deve retornar null quando não em modo de seleção", () => {
      expect(system.getMode()).toBeNull();
    });
  });

  describe("getMaxTargets", () => {
    it("deve retornar número máximo de alvos", () => {
      const action = { kind: "spell", spellId: "magic-missile" };
      const caster = { id: "hero1" };
      mockEncounter.circuloDeConjuracao.mockReturnValue(1);
      mockEncounter.alvosDaMagia.mockReturnValue(3);
      system.enterTargetingMode(action, caster);

      expect(system.getMaxTargets()).toBe(3);
    });

    it("deve retornar 0 quando não em modo de seleção", () => {
      expect(system.getMaxTargets()).toBe(0);
    });
  });

  describe("getSelectedCount", () => {
    it("deve retornar número de alvos selecionados", () => {
      system.selectedTargets = [{ id: "foe1" }, { id: "foe2" }];

      expect(system.getSelectedCount()).toBe(2);
    });
  });

  describe("isComplete", () => {
    it("deve retornar true quando seleção completa", () => {
      const action = { kind: "spell", spellId: "magic-missile" };
      const caster = { id: "hero1" };
      mockEncounter.circuloDeConjuracao.mockReturnValue(1);
      mockEncounter.alvosDaMagia.mockReturnValue(2);
      system.enterTargetingMode(action, caster);

      system.selectedTargets = [{ id: "foe1" }, { id: "foe2" }];

      expect(system.isComplete()).toBe(true);
    });

    it("deve retornar false quando seleção incompleta", () => {
      const action = { kind: "spell", spellId: "magic-missile" };
      const caster = { id: "hero1" };
      mockEncounter.circuloDeConjuracao.mockReturnValue(1);
      mockEncounter.alvosDaMagia.mockReturnValue(3);
      system.enterTargetingMode(action, caster);

      system.selectedTargets = [{ id: "foe1" }];

      expect(system.isComplete()).toBe(false);
    });

    it("deve retornar false quando não em modo de seleção", () => {
      expect(system.isComplete()).toBe(false);
    });
  });

  describe("clearTargets", () => {
    it("deve limpar alvos sem sair do modo", () => {
      const action = { kind: "attack", weaponId: "longsword" };
      const caster = { id: "hero1" };
      system.enterTargetingMode(action, caster);
      system.selectedTargets = [{ id: "foe1" }];

      system.clearTargets();

      expect(system.selectedTargets).toEqual([]);
      expect(system.mode).not.toBeNull();
    });
  });

  describe("updateCirculo", () => {
    it("deve atualizar círculo e máximo de alvos", () => {
      const action = { kind: "spell", spellId: "magic-missile" };
      const caster = { id: "hero1" };
      const spell = { id: "magic-missile", name: "Míssil Mágico" };
      mockEncounter.circuloDeConjuracao.mockReturnValue(1);
      mockEncounter.alvosDaMagia.mockReturnValue(3);
      system.enterTargetingMode(action, caster);
      system.mode.spell = spell;

      mockEncounter.alvosDaMagia.mockReturnValue(5);
      const result = system.updateCirculo(3);

      expect(result.ok).toBe(true);
      expect(result.maxTargets).toBe(5);
      expect(system.mode.circulo).toBe(3);
    });

    it("deve cortar alvos excedentes quando círculo diminui", () => {
      const action = { kind: "spell", spellId: "magic-missile" };
      const caster = { id: "hero1" };
      const spell = { id: "magic-missile", name: "Míssil Mágico" };
      mockEncounter.circuloDeConjuracao.mockReturnValue(3);
      mockEncounter.alvosDaMagia.mockReturnValue(5);
      system.enterTargetingMode(action, caster);
      system.mode.spell = spell;

      system.selectedTargets = [{ id: "foe1" }, { id: "foe2" }, { id: "foe3" }];

      mockEncounter.alvosDaMagia.mockReturnValue(2);
      system.updateCirculo(1);

      expect(system.selectedTargets).toHaveLength(2);
    });

    it("deve recusar quando não em modo de magia", () => {
      const result = system.updateCirculo(3);

      expect(result.ok).toBe(false);
      expect(result.why).toBe("Não está em modo de seleção de magia");
    });
  });
});
