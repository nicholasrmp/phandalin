import { describe, it, expect } from "vitest";
import { makeRng, seedFromString } from "../../core/rng.js";

describe("RNG - Gerador de Números Aleatórios", () => {
  describe("makeRng()", () => {
    it("deve criar um gerador funcional", () => {
      const rng = makeRng(12345);
      expect(typeof rng).toBe("function");
      expect(typeof rng()).toBe("number");
    });

    it("deve gerar números entre 0 e 1", () => {
      const rng = makeRng(12345);
      for (let i = 0; i < 100; i++) {
        const n = rng();
        expect(n).toBeGreaterThanOrEqual(0);
        expect(n).toBeLessThan(1);
      }
    });

    it("deve ser determinístico (mesma seed = mesma sequência)", () => {
      const rng1 = makeRng(12345);
      const rng2 = makeRng(12345);

      const seq1 = Array.from({ length: 10 }, () => rng1());
      const seq2 = Array.from({ length: 10 }, () => rng2());

      expect(seq1).toEqual(seq2);
    });

    it("deve gerar sequências diferentes para seeds diferentes", () => {
      const rng1 = makeRng(12345);
      const rng2 = makeRng(54321);

      const seq1 = Array.from({ length: 10 }, () => rng1());
      const seq2 = Array.from({ length: 10 }, () => rng2());

      expect(seq1).not.toEqual(seq2);
    });

    it("deve lidar com seed zero (converte para 0x9e3779b9)", () => {
      const rng = makeRng(0);
      expect(typeof rng()).toBe("number");
    });
  });

  describe("rng.int(n)", () => {
    it("deve gerar inteiros entre 0 e n-1", () => {
      const rng = makeRng(12345);
      for (let i = 0; i < 100; i++) {
        const n = rng.int(10);
        expect(n).toBeGreaterThanOrEqual(0);
        expect(n).toBeLessThan(10);
        expect(Number.isInteger(n)).toBe(true);
      }
    });

    it("deve cobrir toda a faixa de valores", () => {
      const rng = makeRng(12345);
      const seen = new Set();

      // Gera muitos números para ter chance de ver todos
      for (let i = 0; i < 1000; i++) {
        seen.add(rng.int(5));
      }

      // Deve ter visto todos os valores de 0 a 4
      expect(seen.size).toBe(5);
      expect(seen.has(0)).toBe(true);
      expect(seen.has(4)).toBe(true);
    });
  });

  describe("rng.die(sides)", () => {
    it("deve gerar números entre 1 e sides (inclusive)", () => {
      const rng = makeRng(12345);
      for (let i = 0; i < 100; i++) {
        const n = rng.die(20);
        expect(n).toBeGreaterThanOrEqual(1);
        expect(n).toBeLessThanOrEqual(20);
        expect(Number.isInteger(n)).toBe(true);
      }
    });

    it("deve simular d20 corretamente", () => {
      const rng = makeRng(12345);
      const rolls = Array.from({ length: 100 }, () => rng.die(20));

      // Deve ter pelo menos um 1 e um 20 em 100 rolagens
      expect(Math.min(...rolls)).toBe(1);
      expect(Math.max(...rolls)).toBe(20);
    });

    it("deve simular d6 corretamente", () => {
      const rng = makeRng(12345);
      const rolls = Array.from({ length: 100 }, () => rng.die(6));

      rolls.forEach((roll) => {
        expect(roll).toBeGreaterThanOrEqual(1);
        expect(roll).toBeLessThanOrEqual(6);
      });
    });
  });

  describe("rng.pick(arr)", () => {
    it("deve escolher um elemento do array", () => {
      const rng = makeRng(12345);
      const arr = ["a", "b", "c", "d", "e"];

      for (let i = 0; i < 20; i++) {
        const picked = rng.pick(arr);
        expect(arr).toContain(picked);
      }
    });

    it("deve escolher todos os elementos eventualmente", () => {
      const rng = makeRng(12345);
      const arr = ["a", "b", "c"];
      const seen = new Set();

      for (let i = 0; i < 100; i++) {
        seen.add(rng.pick(arr));
      }

      expect(seen.size).toBe(3);
    });

    it("deve funcionar com array de um elemento", () => {
      const rng = makeRng(12345);
      const arr = ["único"];
      expect(rng.pick(arr)).toBe("único");
    });
  });

  describe("rng.chance(p)", () => {
    it("deve retornar booleano", () => {
      const rng = makeRng(12345);
      expect(typeof rng.chance(0.5)).toBe("boolean");
    });

    it("deve retornar false para probabilidade 0", () => {
      const rng = makeRng(12345);
      for (let i = 0; i < 20; i++) {
        expect(rng.chance(0)).toBe(false);
      }
    });

    it("deve retornar true para probabilidade 1", () => {
      const rng = makeRng(12345);
      for (let i = 0; i < 20; i++) {
        expect(rng.chance(1)).toBe(true);
      }
    });

    it("deve respeitar aproximadamente a probabilidade", () => {
      const rng = makeRng(12345);
      const trials = 1000;
      const probability = 0.3;

      let successes = 0;
      for (let i = 0; i < trials; i++) {
        if (rng.chance(probability)) successes++;
      }

      const observed = successes / trials;
      // Deve estar próximo de 30% (±10% de margem)
      expect(observed).toBeGreaterThan(0.2);
      expect(observed).toBeLessThan(0.4);
    });
  });

  describe("rng.shuffle(arr)", () => {
    it("deve retornar array com mesmo tamanho", () => {
      const rng = makeRng(12345);
      const arr = [1, 2, 3, 4, 5];
      const shuffled = rng.shuffle(arr);

      expect(shuffled.length).toBe(arr.length);
    });

    it("deve conter todos os elementos originais", () => {
      const rng = makeRng(12345);
      const arr = [1, 2, 3, 4, 5];
      const shuffled = rng.shuffle(arr);

      expect(shuffled.sort()).toEqual(arr.sort());
    });

    it("não deve modificar o array original", () => {
      const rng = makeRng(12345);
      const arr = [1, 2, 3, 4, 5];
      const original = [...arr];

      rng.shuffle(arr);

      expect(arr).toEqual(original);
    });

    it("deve embaralhar de forma determinística", () => {
      const rng1 = makeRng(12345);
      const rng2 = makeRng(12345);
      const arr = [1, 2, 3, 4, 5];

      const shuffled1 = rng1.shuffle(arr);
      const shuffled2 = rng2.shuffle(arr);

      expect(shuffled1).toEqual(shuffled2);
    });

    it("deve realmente embaralhar (não retornar ordem original)", () => {
      const rng = makeRng(12345);
      const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      let differentCount = 0;
      for (let i = 0; i < 10; i++) {
        const shuffled = rng.shuffle(arr);
        if (JSON.stringify(shuffled) !== JSON.stringify(arr)) {
          differentCount++;
        }
      }

      // Pelo menos 8 de 10 devem ser diferentes
      expect(differentCount).toBeGreaterThanOrEqual(8);
    });
  });

  describe("rng.state()", () => {
    it("deve retornar o estado interno", () => {
      const rng = makeRng(12345);
      const state = rng.state();

      expect(typeof state).toBe("number");
      expect(Number.isInteger(state)).toBe(true);
    });

    it("deve mudar após cada chamada", () => {
      const rng = makeRng(12345);
      const state1 = rng.state();
      rng();
      const state2 = rng.state();

      expect(state2).not.toBe(state1);
    });
  });

  describe("seedFromString()", () => {
    it("deve converter string em número", () => {
      const seed = seedFromString("teste");
      expect(typeof seed).toBe("number");
      expect(Number.isInteger(seed)).toBe(true);
    });

    it("deve ser determinístico", () => {
      const seed1 = seedFromString("phandalin");
      const seed2 = seedFromString("phandalin");

      expect(seed1).toBe(seed2);
    });

    it("deve gerar seeds diferentes para strings diferentes", () => {
      const seed1 = seedFromString("abc");
      const seed2 = seedFromString("xyz");

      expect(seed1).not.toBe(seed2);
    });

    it("deve funcionar com string vazia", () => {
      const seed = seedFromString("");
      expect(typeof seed).toBe("number");
    });

    it("deve funcionar com caracteres especiais", () => {
      const seed = seedFromString("café-com-açúcar!");
      expect(typeof seed).toBe("number");
    });
  });
});
