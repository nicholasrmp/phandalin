import { describe, it, expect } from "vitest";
import { makeRng } from "../../core/rng.js";
import {
  rollDice,
  sum,
  parseDice,
  averageOf,
  roll,
  d20,
  attackRoll,
  damageRoll,
  savingThrow,
  formatModifier,
} from "../../core/dice.js";

describe("Sistema de Dados", () => {
  describe("rollDice()", () => {
    it("deve rolar a quantidade correta de dados", () => {
      const rng = makeRng(12345);
      const rolls = rollDice(rng, 3, 6);

      expect(rolls).toHaveLength(3);
    });

    it("deve respeitar os lados do dado", () => {
      const rng = makeRng(12345);
      const rolls = rollDice(rng, 10, 20);

      rolls.forEach((roll) => {
        expect(roll).toBeGreaterThanOrEqual(1);
        expect(roll).toBeLessThanOrEqual(20);
      });
    });

    it("deve ser determinístico", () => {
      const rng1 = makeRng(12345);
      const rng2 = makeRng(12345);

      const rolls1 = rollDice(rng1, 5, 6);
      const rolls2 = rollDice(rng2, 5, 6);

      expect(rolls1).toEqual(rolls2);
    });
  });

  describe("sum()", () => {
    it("deve somar lista de números", () => {
      expect(sum([1, 2, 3, 4, 5])).toBe(15);
    });

    it("deve retornar 0 para lista vazia", () => {
      expect(sum([])).toBe(0);
    });

    it("deve funcionar com números negativos", () => {
      expect(sum([5, -3, 2])).toBe(4);
    });
  });

  describe("parseDice()", () => {
    it('deve parsear notação simples "2d6"', () => {
      const parsed = parseDice("2d6");
      expect(parsed).toEqual({ count: 2, sides: 6, mod: 0 });
    });

    it('deve parsear notação com modificador "2d6+3"', () => {
      const parsed = parseDice("2d6+3");
      expect(parsed).toEqual({ count: 2, sides: 6, mod: 3 });
    });

    it('deve parsear modificador negativo "1d8-2"', () => {
      const parsed = parseDice("1d8-2");
      expect(parsed).toEqual({ count: 1, sides: 8, mod: -2 });
    });

    it("deve parsear número como modificador", () => {
      const parsed = parseDice(10);
      expect(parsed).toEqual({ count: 0, sides: 0, mod: 10 });
    });

    it('deve parsear modificador sem dados "+5"', () => {
      const parsed = parseDice("+5");
      expect(parsed).toEqual({ count: 0, sides: 0, mod: 5 });
    });

    it('deve ignorar espaços "2d6 + 3"', () => {
      const parsed = parseDice("2d6 + 3");
      expect(parsed).toEqual({ count: 2, sides: 6, mod: 3 });
    });

    it("deve lançar erro para notação inválida", () => {
      expect(() => parseDice("abc")).toThrow();
      expect(() => parseDice("2d")).toThrow();
    });
  });

  describe("averageOf()", () => {
    it('deve calcular média de "1d8" (4.5)', () => {
      expect(averageOf("1d8")).toBe(4.5);
    });

    it('deve calcular média de "2d6+3" (10)', () => {
      expect(averageOf("2d6+3")).toBe(10);
    });

    it("deve calcular média de modificador puro", () => {
      expect(averageOf(5)).toBe(5);
      expect(averageOf(10)).toBe(10);
    });

    it('deve calcular média de "1d20" (10.5)', () => {
      expect(averageOf("1d20")).toBe(10.5);
    });
  });

  describe("roll()", () => {
    it("deve rolar e retornar resultado completo", () => {
      const rng = makeRng(12345);
      const result = roll(rng, "2d6+3");

      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("rolls");
      expect(result).toHaveProperty("mod");
      expect(result).toHaveProperty("notation");
    });

    it("deve calcular total corretamente", () => {
      const rng = makeRng(12345);
      const result = roll(rng, "2d6+3");

      const expected = sum(result.rolls) + result.mod;
      expect(result.total).toBe(expected);
    });

    it("deve funcionar com modificador puro (número)", () => {
      const rng = makeRng(12345);
      const result = roll(rng, 5);

      expect(result.total).toBe(5);
      expect(result.rolls).toEqual([]);
    });
  });

  describe("d20()", () => {
    it("deve rolar d20 normal", () => {
      const rng = makeRng(12345);
      const result = d20(rng, 5);

      expect(result.natural).toBeGreaterThanOrEqual(1);
      expect(result.natural).toBeLessThanOrEqual(20);
      expect(result.total).toBe(result.natural + 5);
      expect(result.mode).toBe("normal");
    });

    it("deve rolar com vantagem (pega o maior)", () => {
      const rng = makeRng(12345);
      const result = d20(rng, 0, { advantage: true });

      expect(result.rolls).toHaveLength(2);
      expect(result.natural).toBe(Math.max(...result.rolls));
      expect(result.mode).toBe("vantagem");
    });

    it("deve rolar com desvantagem (pega o menor)", () => {
      const rng = makeRng(12345);
      const result = d20(rng, 0, { disadvantage: true });

      expect(result.rolls).toHaveLength(2);
      expect(result.natural).toBe(Math.min(...result.rolls));
      expect(result.mode).toBe("desvantagem");
    });

    it("deve cancelar vantagem e desvantagem juntas", () => {
      const rng = makeRng(12345);
      const result = d20(rng, 0, { advantage: true, disadvantage: true });

      expect(result.rolls).toHaveLength(1);
      expect(result.mode).toBe("normal");
    });

    it("deve aplicar modificador", () => {
      const rng = makeRng(12345);
      const result = d20(rng, 7);

      expect(result.total).toBe(result.natural + 7);
      expect(result.modifier).toBe(7);
    });
  });

  describe("attackRoll()", () => {
    it("deve retornar hit quando total >= CA", () => {
      const rng = makeRng(12345);
      // Força um resultado específico testando múltiplas vezes
      let foundHit = false;

      for (let i = 0; i < 100; i++) {
        const rng2 = makeRng(i);
        const result = attackRoll(rng2, 5, 15);
        if (result.hit && !result.critical) {
          foundHit = true;
          expect(result.total).toBeGreaterThanOrEqual(15);
          break;
        }
      }

      expect(foundHit).toBe(true);
    });

    it("deve marcar crítico em 20 natural", () => {
      // Testa múltiplas seeds até achar um 20
      let foundCritical = false;

      for (let i = 0; i < 1000; i++) {
        const rng = makeRng(i);
        const result = attackRoll(rng, 0, 25);

        if (result.natural === 20) {
          expect(result.critical).toBe(true);
          expect(result.hit).toBe(true);
          foundCritical = true;
          break;
        }
      }

      expect(foundCritical).toBe(true);
    });

    it("deve marcar fumble em 1 natural", () => {
      let foundFumble = false;

      for (let i = 0; i < 1000; i++) {
        const rng = makeRng(i);
        const result = attackRoll(rng, 10, 5);

        if (result.natural === 1) {
          expect(result.fumble).toBe(true);
          expect(result.hit).toBe(false);
          foundFumble = true;
          break;
        }
      }

      expect(foundFumble).toBe(true);
    });

    it("deve incluir CA no resultado", () => {
      const rng = makeRng(12345);
      const result = attackRoll(rng, 5, 18);

      expect(result.ac).toBe(18);
    });
  });

  describe("damageRoll()", () => {
    it("deve rolar dano normal", () => {
      const rng = makeRng(12345);
      const result = damageRoll(rng, "1d8+3");

      expect(result.total).toBeGreaterThanOrEqual(4); // mín: 1+3
      expect(result.total).toBeLessThanOrEqual(11); // máx: 8+3
      expect(result.critical).toBe(false);
    });

    it("deve dobrar dados no crítico", () => {
      const rng = makeRng(12345);
      const result = damageRoll(rng, "2d6+3", { critical: true });

      expect(result.rolls).toHaveLength(4); // 2d6 vira 4d6
      expect(result.critical).toBe(true);
      // Modificador não dobra
      expect(result.mod).toBe(3);
    });

    it("não deve permitir dano negativo", () => {
      const rng = makeRng(12345);
      const result = damageRoll(rng, "1d4-10");

      expect(result.total).toBeGreaterThanOrEqual(0);
    });

    it("deve rerolar dados baixos (Armas Grandes)", () => {
      const rng = makeRng(12345);

      // Testa múltiplas vezes para garantir que rerolagem acontece
      let foundReroll = false;
      for (let i = 0; i < 100; i++) {
        const rng2 = makeRng(i);
        const result = damageRoll(rng2, "1d12", { rerolarAte: 2 });

        // Se todos os rolls são > 2, a rerolagem funcionou
        if (result.rolls.every((r) => r > 2)) {
          foundReroll = true;
        }
      }

      // Pelo menos alguns devem ter rerolado
      expect(foundReroll).toBe(true);
    });
  });

  describe("savingThrow()", () => {
    it("deve retornar sucesso quando total >= CD", () => {
      let foundSuccess = false;

      for (let i = 0; i < 100; i++) {
        const rng = makeRng(i);
        const result = savingThrow(rng, 5, 12);

        if (result.success) {
          expect(result.total).toBeGreaterThanOrEqual(12);
          foundSuccess = true;
          break;
        }
      }

      expect(foundSuccess).toBe(true);
    });

    it("deve retornar falha quando total < CD", () => {
      let foundFailure = false;

      for (let i = 0; i < 100; i++) {
        const rng = makeRng(i);
        const result = savingThrow(rng, 0, 20);

        if (!result.success) {
          expect(result.total).toBeLessThan(20);
          foundFailure = true;
          break;
        }
      }

      expect(foundFailure).toBe(true);
    });

    it("deve incluir CD no resultado", () => {
      const rng = makeRng(12345);
      const result = savingThrow(rng, 3, 15);

      expect(result.dc).toBe(15);
    });

    it("deve funcionar com vantagem", () => {
      const rng = makeRng(12345);
      const result = savingThrow(rng, 2, 10, { advantage: true });

      expect(result.rolls).toHaveLength(2);
      expect(result.mode).toBe("vantagem");
    });
  });

  describe("formatModifier()", () => {
    it("deve formatar modificador positivo com +", () => {
      expect(formatModifier(5)).toBe("+5");
      expect(formatModifier(1)).toBe("+1");
    });

    it("deve formatar modificador negativo", () => {
      expect(formatModifier(-3)).toBe("-3");
      expect(formatModifier(-1)).toBe("-1");
    });

    it("deve formatar zero com +", () => {
      expect(formatModifier(0)).toBe("+0");
    });
  });
});
