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
//
// E PELA MESMA RAZÃO O MOCK PERDEU O `current`. Ele trazia `current: 0`, um
// ponteiro de iniciativa que o Encounter de verdade NUNCA teve — aqui a fase é
// do LADO (`enc.side`) e cada um fecha o seu turno com `acted`. Enquanto o mock
// inventava o campo, estes 39 testes passavam verdes enquanto, no jogo, só o
// primeiro da lista conseguia atacar, conjurar e entrar em mira. Mock que
// inventa campo não testa o jogo: testa a ficção. O que prova isto de verdade,
// sobre o Encounter real, é `src/dev/testes-regras.mjs`, em "A VEZ É DO LADO".

describe("TurnManager", () => {
  let manager;
  let mockEncounter;

  beforeEach(() => {
    // Mock do Encounter
    mockEncounter = {
      combatants: [
        { id: "hero1", name: "Guerreiro", side: "party", dead: false, acted: false },
        { id: "hero2", name: "Mago", side: "party", dead: false, acted: false },
        { id: "foe1", name: "Goblin 1", side: "foes", dead: false, acted: false },
        { id: "foe2", name: "Goblin 2", side: "foes", dead: false, acted: false },
      ],
      round: 1,
      over: false,
      side: "party",
      auto: false,
      // O motor marca `acted` ao encerrar o turno, e vira a rodada quando o lado
      // que joga por último acaba. O mock faz as duas coisas, senão não é o motor.
      endTurn: vi.fn((c) => {
        c.acted = true;
        if (mockEncounter.combatants.every((x) => x.acted || x.dead)) {
          mockEncounter.round += 1;
        }
        return { ok: true };
      }),
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

    it("deve chamar onRoundEnd quando o MOTOR vira a rodada", () => {
      // A rodada vira quando o motor a vira, e não quando um índice chega ao fim
      // da lista: `endTurn` compara `enc.round` antes e depois.
      mockEncounter.combatants.forEach((c) => { c.acted = true; });
      const ultimo = mockEncounter.combatants[3];
      ultimo.acted = false;
      const onRoundEnd = vi.fn();

      manager.endTurn(ultimo, { onRoundEnd });

      expect(onRoundEnd).toHaveBeenCalledWith(2);
    });

    it("NÃO chama onRoundEnd enquanto sobra gente por jogar", () => {
      const onRoundEnd = vi.fn();

      manager.endTurn(mockEncounter.combatants[0], { onRoundEnd });

      expect(onRoundEnd).not.toHaveBeenCalled();
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
    it("deve retornar o próximo do LADO DA VEZ que ainda não agiu", () => {
      mockEncounter.combatants[0].acted = true;

      const next = manager.getNextCombatant();

      expect(next).toBe(mockEncounter.combatants[1]);
    });

    it("NÃO dá a volta na lista até cair num inimigo", () => {
      // Com o índice circular, o último herói a agir entregava a vez a um goblin
      // no meio da fase do grupo. A fase é do lado: acabando o lado, não há próximo.
      mockEncounter.combatants[0].acted = true;
      mockEncounter.combatants[1].acted = true;

      expect(manager.getNextCombatant()).toBeNull();
    });

    it("deve pular combatentes mortos", () => {
      mockEncounter.combatants[0].acted = true;
      mockEncounter.combatants[1].dead = true;

      expect(manager.getNextCombatant()).toBeNull();
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
    it("é verdade quando o lado da vez não tem mais ninguém por jogar", () => {
      mockEncounter.combatants.forEach((c) => { c.acted = true; });

      expect(manager.isRoundEnd()).toBe(true);
    });

    it("deve retornar false no meio da fase", () => {
      mockEncounter.combatants[0].acted = true;

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
    it("é o primeiro do lado da vez que ainda não agiu", () => {
      mockEncounter.combatants[0].acted = true;

      expect(manager.getCurrentCombatant()).toBe(mockEncounter.combatants[1]);
    });

    it("deve retornar null quando o lado da vez acabou", () => {
      mockEncounter.combatants.forEach((c) => { c.acted = true; });

      expect(manager.getCurrentCombatant()).toBeNull();
    });

    it("deve retornar null sem combatentes", () => {
      mockEncounter.combatants = null;

      const current = manager.getCurrentCombatant();

      expect(current).toBeNull();
    });
  });

  describe("ehAVezDe", () => {
    it("deixa agir QUALQUER UM do lado da vez, e não só o primeiro da lista", () => {
      // O defeito que isto guarda: `combatants[enc.current ?? 0]` respondia sempre
      // "o primeiro da lista", e os outros heróis levavam "Não é o turno deste
      // combatente" ao atacar, conjurar, usar item e entrar em mira.
      expect(manager.ehAVezDe(mockEncounter.combatants[0])).toBe(true);
      expect(manager.ehAVezDe(mockEncounter.combatants[1])).toBe(true);
    });

    it("barra quem é do outro lado", () => {
      expect(manager.ehAVezDe(mockEncounter.combatants[2])).toBe(false);
    });

    it("barra morto, barra combate acabado, e barra nada", () => {
      mockEncounter.combatants[1].dead = true;
      expect(manager.ehAVezDe(mockEncounter.combatants[1])).toBe(false);
      expect(manager.ehAVezDe(null)).toBe(false);
      mockEncounter.over = true;
      expect(manager.ehAVezDe(mockEncounter.combatants[0])).toBe(false);
    });

    it("NÃO barra quem já agiu: quem recusa, com a palavra certa, é o motor", () => {
      // O motor diz "a ação deste turno já foi usada" e sabe do Ataque Extra, que
      // deixa golpear de novo com a ação gasta. Barrar aqui seria uma mentira.
      mockEncounter.combatants[0].acted = true;

      expect(manager.ehAVezDe(mockEncounter.combatants[0])).toBe(true);
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
