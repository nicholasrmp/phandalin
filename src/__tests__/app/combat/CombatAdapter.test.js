import { describe, it, expect, beforeEach, vi } from "vitest";
import { CombatAdapter } from "../../../app/combat/CombatAdapter.js";
import { runMonsterSide } from "../../../rules/ai.js";

// Mock do CombatManager
vi.mock("../../../app/combat/CombatManager.js", () => ({
  CombatManager: vi.fn().mockImplementation(() => ({
    attack: vi.fn(() => ({ ok: true })),
    castSpell: vi.fn(() => ({ ok: true })),
    endTurn: vi.fn(() => ({ ok: true })),
    executeFoeTurn: vi.fn(() => ({ ok: true, action: "attack" })),
    enterTargeting: vi.fn(() => ({ ok: true })),
    selectTarget: vi.fn(() => ({ ok: true })),
    exitTargeting: vi.fn(),
    getCurrentCombatant: vi.fn(() => null),
    getCurrentRound: vi.fn(() => 1),
    isTargeting: vi.fn(() => false),
    getSelectedTargets: vi.fn(() => []),
    getTargetingMode: vi.fn(() => null),
    isCombatOver: vi.fn(() => false),
  })),
}));

// Havia aqui um mock de `../../../data/spells.js`. Essa pasta não existe neste
// projeto (as magias estão em `rules/spells.js`), então o mock nunca pegava em
// nada: saiu.
vi.mock("../../../rules/spells.js", () => ({
  opcoesDaMagia: vi.fn(() => null),
}));

// O lado dos inimigos é da IA de `rules/ai.js`. Aqui só se verifica que o
// adaptador a CHAMA — como ela joga é assunto de `src/dev/testes-regras.mjs`,
// que roda o motor de verdade.
vi.mock("../../../rules/ai.js", () => ({
  runMonsterSide: vi.fn(async () => {}),
}));

describe("CombatAdapter", () => {
  let adapter;
  let mockApp;
  let mockEncounter;
  let mockBoard;
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
      pos: { x: 0, y: 0 },
      movementLeftFt: 30,
    };

    foe = {
      id: "goblin1",
      name: "Goblin",
      side: "foes",
      x: 10,
      y: 10,
      hp: 7,
      maxHp: 7,
      pos: { x: 10, y: 10 },
    };

    mockEncounter = {
      combatants: [hero, foe],
      canAttack: vi.fn(() => ({ ok: true })),
      attackAction: vi.fn(() => ({ ok: true })),
      weaponAttackProfile: vi.fn(() => ({ ranged: false, reachFt: 5 })),
      podeAtacar: vi.fn(() => true),
      reachableFor: vi.fn(() => new Map()),
      moveAlong: vi.fn(),
      castSpell: vi.fn(() => ({ ok: true })),
      tipoDoGlifo: vi.fn(() => "fire"),
      opcaoDeAprimorar: vi.fn(() => "strength"),
    };

    mockBoard = {};

    mockApp = {
      enc: mockEncounter,
      board: mockBoard,
      mode: null,
      refresh: vi.fn(),
      walkWaitMs: 0,
      refuse: vi.fn(),
      afterAct: vi.fn(),
      afterWalk: vi.fn((callback) => callback()),
      abrirMenuContexto: vi.fn(),
      root: {},
      _opcaoDeFora: null,
      onTurnEnd: vi.fn(),
      onRoundEnd: vi.fn(),
      onCombatEnd: vi.fn(),
      animarAcaoInimigo: vi.fn(),
      animarMovimento: vi.fn(),
      onFoeAttack: vi.fn(),
      onFoeCast: vi.fn(),
    };

    adapter = new CombatAdapter(mockApp);
  });

  describe("constructor", () => {
    it("deve criar adapter com referência ao app", () => {
      expect(adapter.app).toBe(mockApp);
      expect(adapter.combatManager).toBeNull();
    });
  });

  describe("initialize", () => {
    it("deve inicializar CombatManager", () => {
      adapter.initialize(mockEncounter, mockBoard);
      expect(adapter.combatManager).not.toBeNull();
    });

    it("deve marcar como inicializado", () => {
      expect(adapter.isInitialized()).toBe(false);
      adapter.initialize(mockEncounter, mockBoard);
      expect(adapter.isInitialized()).toBe(true);
    });
  });

  describe("tryAttack", () => {
    beforeEach(() => {
      adapter.initialize(mockEncounter, mockBoard);
    });

    it("deve executar ataque direto quando possível", () => {
      mockEncounter.canAttack.mockReturnValue({ ok: true });

      adapter.tryAttack(hero, foe, "sword");

      expect(adapter.combatManager.attack).toHaveBeenCalledWith(
        hero,
        foe,
        "sword",
        expect.any(Object),
      );
    });

    it("deve chamar afterAct em sucesso", () => {
      mockEncounter.canAttack.mockReturnValue({ ok: true });
      adapter.combatManager.attack.mockImplementation((a, t, w, callbacks) => {
        callbacks.onSuccess();
        return { ok: true };
      });

      adapter.tryAttack(hero, foe, "sword");

      expect(mockApp.afterAct).toHaveBeenCalledWith(hero);
    });

    it("deve recusar se arma à distância sem alcance", () => {
      mockEncounter.canAttack.mockReturnValue({
        ok: false,
        why: "fora de alcance",
      });
      mockEncounter.weaponAttackProfile.mockReturnValue({
        ranged: true,
        reachFt: 80,
      });

      adapter.tryAttack(hero, foe, "bow");

      expect(mockApp.refuse).toHaveBeenCalledWith(hero, "fora de alcance");
    });

    it("deve recusar se não pode atacar", () => {
      mockEncounter.canAttack.mockReturnValue({ ok: false, why: "sem ação" });
      mockEncounter.weaponAttackProfile.mockReturnValue({
        ranged: false,
        reachFt: 5,
      });
      mockEncounter.podeAtacar.mockReturnValue(false);

      adapter.tryAttack(hero, foe, "sword");

      expect(mockApp.refuse).toHaveBeenCalledWith(
        hero,
        "a ação deste turno já foi usada",
      );
    });

    it("deve recusar se sem movimento", () => {
      mockEncounter.canAttack.mockReturnValue({ ok: false, why: "longe" });
      mockEncounter.weaponAttackProfile.mockReturnValue({
        ranged: false,
        reachFt: 5,
      });
      hero.movementLeftFt = 0;

      adapter.tryAttack(hero, foe, "sword");

      expect(mockApp.refuse).toHaveBeenCalledWith(
        hero,
        expect.stringContaining("sem movimento"),
      );
    });

    it("deve avisar se não inicializado", () => {
      const consoleWarn = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});
      adapter.combatManager = null;

      adapter.tryAttack(hero, foe, "sword");

      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining("não inicializado"),
      );

      consoleWarn.mockRestore();
    });
  });

  describe("tryCast", () => {
    beforeEach(() => {
      adapter.initialize(mockEncounter, mockBoard);
    });

    it("deve lançar magia sem opções", () => {
      adapter.tryCast(hero, "fireball", { target: foe });

      expect(adapter.combatManager.castSpell).toHaveBeenCalledWith(
        hero,
        "fireball",
        expect.objectContaining({ target: foe }),
        expect.any(Object),
      );
    });

    it("deve chamar afterAct em sucesso", () => {
      adapter.combatManager.castSpell.mockImplementation(
        (c, s, o, callbacks) => {
          callbacks.onSuccess();
          return { ok: true };
        },
      );

      adapter.tryCast(hero, "fireball", { target: foe });

      expect(mockApp.afterAct).toHaveBeenCalled();
    });

    it("deve recusar em erro", () => {
      adapter.combatManager.castSpell.mockImplementation(
        (c, s, o, callbacks) => {
          callbacks.onError("sem slot");
          return { ok: false, why: "sem slot" };
        },
      );

      adapter.tryCast(hero, "fireball", { target: foe });

      expect(mockApp.refuse).toHaveBeenCalledWith(hero, "sem slot");
    });

    it("deve limpar mode após lançar", () => {
      mockApp.mode = { kind: "spell", spellId: "fireball" };

      adapter.combatManager.castSpell.mockImplementation(
        (c, s, o, callbacks) => {
          callbacks.onSuccess();
          return { ok: true };
        },
      );

      adapter.tryCast(hero, "fireball", { target: foe });

      expect(mockApp.mode).toBeNull();
    });
  });

  describe("terminarTurnoDe", () => {
    beforeEach(() => {
      adapter.initialize(mockEncounter, mockBoard);
    });

    it("deve finalizar turno", () => {
      adapter.terminarTurnoDe(hero);

      expect(adapter.combatManager.endTurn).toHaveBeenCalled();
    });

    it("deve chamar callback onTurnEnd", () => {
      adapter.combatManager.endTurn.mockImplementation((callbacks) => {
        callbacks.onTurnEnd(hero);
        return { ok: true };
      });

      adapter.terminarTurnoDe(hero);

      expect(mockApp.onTurnEnd).toHaveBeenCalledWith(hero);
    });

    it("deve chamar callback onRoundEnd", () => {
      adapter.combatManager.endTurn.mockImplementation((callbacks) => {
        callbacks.onRoundEnd(2);
        return { ok: true };
      });

      adapter.terminarTurnoDe(hero);

      expect(mockApp.onRoundEnd).toHaveBeenCalledWith(2);
    });

    it("deve chamar callback onCombatEnd", () => {
      adapter.combatManager.endTurn.mockImplementation((callbacks) => {
        callbacks.onCombatEnd("party"); // o vencedor é um `c.side`
        return { ok: true };
      });

      adapter.terminarTurnoDe(hero);

      expect(mockApp.onCombatEnd).toHaveBeenCalledWith("party");
    });
  });

  describe("runFoes", () => {
    beforeEach(() => {
      adapter.initialize(mockEncounter, mockBoard);
      // `runMonsterSide` é mock de MÓDULO: as chamadas acumulam entre testes.
      runMonsterSide.mockClear();
    });

    it("delega o lado dos inimigos para runMonsterSide, com o encontro", async () => {
      await adapter.runFoes();

      expect(runMonsterSide).toHaveBeenCalledTimes(1);
      expect(runMonsterSide.mock.calls.at(-1)[0]).toBe(mockEncounter);
    });

    it("redesenha antes e depois, para o turno do monstro aparecer", async () => {
      await adapter.runFoes();

      expect(mockApp.refresh).toHaveBeenCalled();
      // e a IA recebe um `onStep` que redesenha a cada passo
      const opcoes = runMonsterSide.mock.calls.at(-1)[1];
      expect(typeof opcoes.onStep).toBe("function");
      expect(typeof opcoes.delayMs).toBe("function");
    });

    it("a pausa entre monstros passa de 0,7 s (a animação do golpe)", async () => {
      mockApp.walkWaitMs = 300;

      await adapter.runFoes();

      const { delayMs } = runMonsterSide.mock.calls.at(-1)[1];
      expect(delayMs()).toBe(720);
      expect(delayMs()).toBeGreaterThan(700);
    });

    it("não decide o turno por conta própria: nada de IA no adaptador", async () => {
      await adapter.runFoes();

      // O `executeFoeTurn` do CombatManager tinha uma IA que lia campos
      // inexistentes (`.lado`, `.pv`) e por isso nenhum inimigo agia.
      expect(adapter.combatManager.executeFoeTurn).not.toHaveBeenCalled();
    });
  });

  describe("targeting methods", () => {
    beforeEach(() => {
      adapter.initialize(mockEncounter, mockBoard);
    });

    it("enterTargeting deve delegar para CombatManager", () => {
      const spell = { id: "fireball", name: "Bola de Fogo" };

      adapter.enterTargeting(spell, hero);

      expect(adapter.combatManager.enterTargeting).toHaveBeenCalledWith(
        spell,
        hero,
      );
    });

    it("selectTarget deve delegar para CombatManager", () => {
      adapter.selectTarget(foe);

      expect(adapter.combatManager.selectTarget).toHaveBeenCalledWith(foe, {});
    });

    it("exitTargeting deve delegar para CombatManager", () => {
      adapter.exitTargeting();

      expect(adapter.combatManager.exitTargeting).toHaveBeenCalled();
    });
  });

  describe("getters", () => {
    beforeEach(() => {
      adapter.initialize(mockEncounter, mockBoard);
    });

    it("getCurrentCombatant deve retornar combatente atual", () => {
      adapter.combatManager.getCurrentCombatant.mockReturnValue(hero);

      expect(adapter.getCurrentCombatant()).toBe(hero);
    });

    it("getCurrentRound deve retornar round atual", () => {
      adapter.combatManager.getCurrentRound.mockReturnValue(3);

      expect(adapter.getCurrentRound()).toBe(3);
    });

    it("isTargeting deve retornar estado de targeting", () => {
      adapter.combatManager.isTargeting.mockReturnValue(true);

      expect(adapter.isTargeting()).toBe(true);
    });

    it("getSelectedTargets deve retornar alvos selecionados", () => {
      const targets = [foe];
      adapter.combatManager.getSelectedTargets.mockReturnValue(targets);

      expect(adapter.getSelectedTargets()).toBe(targets);
    });

    it("getTargetingMode deve retornar modo de targeting", () => {
      adapter.combatManager.getTargetingMode.mockReturnValue("multi");

      expect(adapter.getTargetingMode()).toBe("multi");
    });

    it("isCombatOver deve retornar se combate terminou", () => {
      adapter.combatManager.isCombatOver.mockReturnValue(true);

      expect(adapter.isCombatOver()).toBe(true);
    });
  });

  describe("getters sem inicialização", () => {
    it("getCurrentCombatant deve retornar null", () => {
      expect(adapter.getCurrentCombatant()).toBeNull();
    });

    it("getCurrentRound deve retornar 0", () => {
      expect(adapter.getCurrentRound()).toBe(0);
    });

    it("isTargeting deve retornar false", () => {
      expect(adapter.isTargeting()).toBe(false);
    });

    it("getSelectedTargets deve retornar array vazio", () => {
      expect(adapter.getSelectedTargets()).toEqual([]);
    });

    it("getTargetingMode deve retornar null", () => {
      expect(adapter.getTargetingMode()).toBeNull();
    });

    it("isCombatOver deve retornar false", () => {
      expect(adapter.isCombatOver()).toBe(false);
    });
  });

  describe("utility methods", () => {
    it("distanceFt deve calcular distância corretamente", () => {
      const pos1 = { x: 0, y: 0 };
      const pos2 = { x: 3, y: 4 };

      const distance = adapter.distanceFt(pos1, pos2);

      expect(distance).toBe(25); // 5 * 5ft
    });

    it("delay deve aguardar tempo especificado", async () => {
      const start = Date.now();
      await adapter.delay(100);
      const end = Date.now();

      expect(end - start).toBeGreaterThanOrEqual(90);
    });
  });
});
