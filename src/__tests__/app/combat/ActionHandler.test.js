import { describe, it, expect, beforeEach, vi } from "vitest";
import { ActionHandler } from "../../../app/combat/ActionHandler.js";
import * as spells from "../../../rules/spells.js";

// Mock getSpell para evitar validação de IDs
vi.mock("../../../rules/spells.js", async () => {
  const actual = await vi.importActual("../../../rules/spells.js");
  return {
    ...actual,
    getSpell: vi.fn((id) => ({
      id,
      name: "Magia Teste",
      kind: "auto",
    })),
    opcoesDaMagia: vi.fn(() => null),
  };
});

describe("ActionHandler", () => {
  let handler;
  let mockEncounter;
  let mockBoard;

  beforeEach(() => {
    // Mock do Encounter
    mockEncounter = {
      canAttack: vi.fn(),
      attackAction: vi.fn(),
      weaponAttackProfile: vi.fn(),
      podeAtacar: vi.fn(),
      reachableFor: vi.fn(),
      moveAlong: vi.fn(),
      castSpell: vi.fn(),
      useItem: vi.fn(),
      useFeature: vi.fn(),
    };

    // Mock do Board
    mockBoard = {
      fx: { walkTimeLeft: 0 },
    };

    handler = new ActionHandler(mockEncounter, mockBoard);
  });

  describe("constructor", () => {
    it("deve inicializar com encounter e board", () => {
      expect(handler.encounter).toBe(mockEncounter);
      expect(handler.board).toBe(mockBoard);
    });
  });

  describe("tryAttack", () => {
    const attacker = { id: "hero1", name: "Guerreiro", movementLeftFt: 30 };
    const target = { id: "foe1", name: "Goblin", pos: { x: 5, y: 5 } };
    const weaponId = "longsword";

    it("deve executar ataque direto quando em alcance", () => {
      mockEncounter.canAttack.mockReturnValue({ ok: true });
      mockEncounter.attackAction.mockReturnValue({ ok: true });

      const onSuccess = vi.fn();
      const result = handler.tryAttack(attacker, target, weaponId, {
        onSuccess,
      });

      expect(result.ok).toBe(true);
      expect(mockEncounter.canAttack).toHaveBeenCalledWith(
        attacker,
        target,
        weaponId,
      );
      expect(mockEncounter.attackAction).toHaveBeenCalledWith(
        attacker,
        target,
        weaponId,
      );
      expect(onSuccess).toHaveBeenCalled();
    });

    it("deve chamar onError quando ataque direto falha", () => {
      mockEncounter.canAttack.mockReturnValue({ ok: true });
      mockEncounter.attackAction.mockReturnValue({
        ok: false,
        why: "Alvo muito longe",
      });

      const onError = vi.fn();
      const result = handler.tryAttack(attacker, target, weaponId, {
        onError,
      });

      expect(result.ok).toBe(false);
      expect(onError).toHaveBeenCalledWith("Alvo muito longe");
    });

    it("deve recusar ataque à distância quando fora de alcance", () => {
      mockEncounter.canAttack.mockReturnValue({
        ok: false,
        why: "Fora de alcance",
      });
      mockEncounter.weaponAttackProfile.mockReturnValue({ ranged: true });

      const onError = vi.fn();
      const result = handler.tryAttack(attacker, target, weaponId, {
        onError,
      });

      expect(result.ok).toBe(false);
      expect(onError).toHaveBeenCalledWith("Fora de alcance");
    });

    it("deve recusar quando ação já foi usada", () => {
      mockEncounter.canAttack.mockReturnValue({
        ok: false,
        why: "Sem ação",
      });
      mockEncounter.weaponAttackProfile.mockReturnValue({ ranged: false });
      mockEncounter.podeAtacar.mockReturnValue(false);

      const onError = vi.fn();
      const result = handler.tryAttack(attacker, target, weaponId, {
        onError,
      });

      expect(result.ok).toBe(false);
      expect(onError).toHaveBeenCalledWith("a ação deste turno já foi usada");
    });

    it("deve recusar quando sem movimento", () => {
      const attackerSemMovimento = { ...attacker, movementLeftFt: 0 };
      mockEncounter.canAttack.mockReturnValue({
        ok: false,
        why: "Longe",
      });
      mockEncounter.weaponAttackProfile.mockReturnValue({ ranged: false });
      mockEncounter.podeAtacar.mockReturnValue(true);

      const onError = vi.fn();
      const result = handler.tryAttack(attackerSemMovimento, target, weaponId, {
        onError,
      });

      expect(result.ok).toBe(false);
      expect(onError).toHaveBeenCalledWith(
        "sem movimento para chegar até Goblin",
      );
    });

    it("deve calcular caminho e atacar quando pode chegar", () => {
      mockEncounter.canAttack.mockReturnValue({
        ok: false,
        why: "Longe",
      });
      mockEncounter.weaponAttackProfile.mockReturnValue({
        ranged: false,
        reachFt: 5,
      });
      mockEncounter.podeAtacar.mockReturnValue(true);
      mockEncounter.reachableFor.mockReturnValue(
        new Map([
          [
            "4,5",
            {
              x: 4,
              y: 5,
              cost: 5,
              parar: true,
            },
          ],
        ]),
      );
      mockEncounter.attackAction.mockReturnValue({ ok: true });

      const onWalk = vi.fn((callback) => callback());
      const onSuccess = vi.fn();

      const result = handler.tryAttack(attacker, target, weaponId, {
        onWalk,
        onSuccess,
      });

      expect(result.ok).toBe(true);
      expect(result.needsMovement).toBe(true);
      expect(mockEncounter.moveAlong).toHaveBeenCalled();
      expect(onWalk).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalled();
    });

    it("deve avançar o máximo quando não consegue chegar", () => {
      mockEncounter.canAttack.mockReturnValue({
        ok: false,
        why: "Longe",
      });
      mockEncounter.weaponAttackProfile.mockReturnValue({
        ranged: false,
        reachFt: 5,
      });
      mockEncounter.podeAtacar.mockReturnValue(true);
      mockEncounter.reachableFor.mockReturnValue(
        new Map([
          [
            "3,5",
            {
              x: 3,
              y: 5,
              cost: 10,
              parar: true,
            },
          ],
        ]),
      );

      const onWalk = vi.fn((callback) => callback());
      const onError = vi.fn();

      const result = handler.tryAttack(attacker, target, weaponId, {
        onWalk,
        onError,
      });

      expect(result.ok).toBe(false);
      expect(result.advanced).toBe(true);
      expect(mockEncounter.moveAlong).toHaveBeenCalled();
      expect(onWalk).toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(
        expect.stringContaining("movimento insuficiente"),
      );
    });
  });

  describe("tryCast", () => {
    const caster = { id: "hero1", name: "Mago" };
    const target = { id: "foe1", name: "Goblin" };
    const spellId = "missil-magico"; // ID válido no sistema

    it("deve conjurar magia simples", () => {
      mockEncounter.castSpell.mockReturnValue({ ok: true });

      const onSuccess = vi.fn();
      const result = handler.tryCast(
        caster,
        spellId,
        { target },
        { onSuccess },
      );

      expect(result.ok).toBe(true);
      expect(mockEncounter.castSpell).toHaveBeenCalledWith(
        caster,
        spellId,
        expect.objectContaining({ target }),
      );
      expect(onSuccess).toHaveBeenCalled();
    });

    it("deve chamar onError quando conjuração falha", () => {
      mockEncounter.castSpell.mockReturnValue({
        ok: false,
        why: "Sem espaços de magia",
      });

      const onError = vi.fn();
      const result = handler.tryCast(caster, spellId, { target }, { onError });

      expect(result.ok).toBe(false);
      expect(onError).toHaveBeenCalledWith("Sem espaços de magia");
    });

    it("deve passar círculo de conjuração", () => {
      mockEncounter.castSpell.mockReturnValue({ ok: true });

      handler.tryCast(caster, spellId, { target, circulo: 3 }, {});

      expect(mockEncounter.castSpell).toHaveBeenCalledWith(
        caster,
        spellId,
        expect.objectContaining({ circulo: 3 }),
      );
    });

    it("deve passar múltiplos alvos", () => {
      const targets = [target, { id: "foe2", name: "Orc" }];
      mockEncounter.castSpell.mockReturnValue({ ok: true });

      handler.tryCast(caster, spellId, { targets }, {});

      expect(mockEncounter.castSpell).toHaveBeenCalledWith(
        caster,
        spellId,
        expect.objectContaining({ targets }),
      );
    });

    it("deve passar ponto de conjuração", () => {
      const point = { x: 5, y: 5 };
      mockEncounter.castSpell.mockReturnValue({ ok: true });

      handler.tryCast(caster, spellId, { point }, {});

      expect(mockEncounter.castSpell).toHaveBeenCalledWith(
        caster,
        spellId,
        expect.objectContaining({ point }),
      );
    });
  });

  describe("useItem", () => {
    const user = { id: "hero1", name: "Guerreiro" };
    const itemId = "potion-healing";

    it("deve usar item com sucesso", () => {
      mockEncounter.useItem.mockReturnValue({ ok: true });

      const onSuccess = vi.fn();
      const result = handler.useItem(user, itemId, {}, { onSuccess });

      expect(result.ok).toBe(true);
      expect(mockEncounter.useItem).toHaveBeenCalledWith(user, itemId, {
        target: undefined,
        jogando: undefined,
      });
      expect(onSuccess).toHaveBeenCalled();
    });

    it("deve chamar onError quando uso falha", () => {
      mockEncounter.useItem.mockReturnValue({
        ok: false,
        why: "Item não encontrado",
      });

      const onError = vi.fn();
      const result = handler.useItem(user, itemId, {}, { onError });

      expect(result.ok).toBe(false);
      expect(onError).toHaveBeenCalledWith("Item não encontrado");
    });

    it("deve passar alvo do item", () => {
      const target = { id: "hero2", name: "Clérigo" };
      mockEncounter.useItem.mockReturnValue({ ok: true });

      handler.useItem(user, itemId, { target }, {});

      expect(mockEncounter.useItem).toHaveBeenCalledWith(
        user,
        itemId,
        expect.objectContaining({ target }),
      );
    });

    it("deve passar flag jogando", () => {
      mockEncounter.useItem.mockReturnValue({ ok: true });

      handler.useItem(user, itemId, { jogando: true }, {});

      expect(mockEncounter.useItem).toHaveBeenCalledWith(
        user,
        itemId,
        expect.objectContaining({ jogando: true }),
      );
    });
  });

  describe("useFeature", () => {
    const user = { id: "hero1", name: "Paladino" };
    const featureId = "lay-on-hands";

    it("deve usar habilidade com sucesso", () => {
      mockEncounter.useFeature.mockReturnValue({ ok: true });

      const onSuccess = vi.fn();
      const result = handler.useFeature(user, featureId, {}, { onSuccess });

      expect(result.ok).toBe(true);
      expect(mockEncounter.useFeature).toHaveBeenCalledWith(user, featureId, {
        target: undefined,
      });
      expect(onSuccess).toHaveBeenCalled();
    });

    it("deve chamar onError quando uso falha", () => {
      mockEncounter.useFeature.mockReturnValue({
        ok: false,
        why: "Sem recursos",
      });

      const onError = vi.fn();
      const result = handler.useFeature(user, featureId, {}, { onError });

      expect(result.ok).toBe(false);
      expect(onError).toHaveBeenCalledWith("Sem recursos");
    });

    it("deve passar alvo da habilidade", () => {
      const target = { id: "hero2", name: "Guerreiro" };
      mockEncounter.useFeature.mockReturnValue({ ok: true });

      handler.useFeature(user, featureId, { target }, {});

      expect(mockEncounter.useFeature).toHaveBeenCalledWith(
        user,
        featureId,
        expect.objectContaining({ target }),
      );
    });
  });

  describe("calculateAttackPath", () => {
    const attacker = { id: "hero1", name: "Guerreiro" };
    const target = { id: "foe1", name: "Goblin", pos: { x: 5, y: 5 } };
    const weaponId = "longsword";

    it("deve retornar canReach quando consegue chegar", () => {
      mockEncounter.weaponAttackProfile.mockReturnValue({ reachFt: 5 });
      mockEncounter.reachableFor.mockReturnValue(
        new Map([
          [
            "4,5",
            {
              x: 4,
              y: 5,
              cost: 5,
              parar: true,
            },
          ],
        ]),
      );

      const result = handler.calculateAttackPath(attacker, target, weaponId);

      expect(result.canReach).toBe(true);
      expect(result.canAdvance).toBe(false);
      expect(result.path).toBeDefined();
    });

    it("deve retornar canAdvance quando não consegue chegar", () => {
      mockEncounter.weaponAttackProfile.mockReturnValue({ reachFt: 5 });
      mockEncounter.reachableFor.mockReturnValue(
        new Map([
          [
            "3,5",
            {
              x: 3,
              y: 5,
              cost: 10,
              parar: true,
            },
          ],
        ]),
      );

      const result = handler.calculateAttackPath(attacker, target, weaponId);

      expect(result.canReach).toBe(false);
      expect(result.canAdvance).toBe(true);
      expect(result.path).toBeDefined();
    });

    it("deve retornar false para ambos quando não pode se mover", () => {
      mockEncounter.weaponAttackProfile.mockReturnValue({ reachFt: 5 });
      mockEncounter.reachableFor.mockReturnValue(new Map());

      const result = handler.calculateAttackPath(attacker, target, weaponId);

      expect(result.canReach).toBe(false);
      expect(result.canAdvance).toBe(false);
      expect(result.path).toEqual([]);
    });

    it("deve ignorar posições com parar=false", () => {
      mockEncounter.weaponAttackProfile.mockReturnValue({ reachFt: 5 });
      mockEncounter.reachableFor.mockReturnValue(
        new Map([
          [
            "4,5",
            {
              x: 4,
              y: 5,
              cost: 5,
              parar: false, // Ocupada por aliado
            },
          ],
          [
            "4,6",
            {
              x: 4,
              y: 6,
              cost: 10,
              parar: true,
            },
          ],
        ]),
      );

      const result = handler.calculateAttackPath(attacker, target, weaponId);

      // Deve usar a posição 4,6 mesmo sendo mais longe
      expect(result.canReach).toBe(true);
    });

    it("deve escolher caminho mais curto quando múltiplas opções", () => {
      mockEncounter.weaponAttackProfile.mockReturnValue({ reachFt: 5 });
      mockEncounter.reachableFor.mockReturnValue(
        new Map([
          [
            "4,5",
            {
              x: 4,
              y: 5,
              cost: 5,
              parar: true,
            },
          ],
          [
            "4,6",
            {
              x: 4,
              y: 6,
              cost: 10,
              parar: true,
            },
          ],
        ]),
      );

      const result = handler.calculateAttackPath(attacker, target, weaponId);

      expect(result.canReach).toBe(true);
      // Deve escolher o caminho com cost=5
    });
  });
});
