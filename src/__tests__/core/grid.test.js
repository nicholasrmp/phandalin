import { describe, it, expect } from "vitest";
import {
  distanceFt,
  isAdjacent,
  footprintOf,
  squaresOf,
  key,
  parseKey,
  FEET_PER_SQUARE,
} from "../../core/grid.js";

describe("Sistema de Grade", () => {
  describe("key() e parseKey()", () => {
    it("deve serializar posição em string", () => {
      expect(key(5, 10)).toBe("5,10");
      expect(key(0, 0)).toBe("0,0");
      expect(key(-1, -1)).toBe("-1,-1");
    });

    it("deve deserializar string em posição", () => {
      expect(parseKey("5,10")).toEqual({ x: 5, y: 10 });
      expect(parseKey("0,0")).toEqual({ x: 0, y: 0 });
      expect(parseKey("-1,-1")).toEqual({ x: -1, y: -1 });
    });

    it("deve ser reversível", () => {
      const pos = { x: 7, y: 3 };
      const serialized = key(pos.x, pos.y);
      const deserialized = parseKey(serialized);
      expect(deserialized).toEqual(pos);
    });
  });

  describe("FEET_PER_SQUARE", () => {
    it("deve ser 5 pés por quadrado", () => {
      expect(FEET_PER_SQUARE).toBe(5);
    });
  });

  describe("footprintOf()", () => {
    it("deve retornar 1 para criaturas Médias", () => {
      expect(footprintOf("médio")).toBe(1);
      expect(footprintOf("medio")).toBe(1);
      expect(footprintOf("pequeno")).toBe(1);
      expect(footprintOf("miúdo")).toBe(1);
    });

    it("deve retornar 2 para criaturas Grandes", () => {
      expect(footprintOf("grande")).toBe(2);
    });

    it("deve retornar 3 para criaturas Enormes", () => {
      expect(footprintOf("enorme")).toBe(3);
    });

    it("deve retornar 4 para criaturas Imensas", () => {
      expect(footprintOf("imenso")).toBe(4);
      expect(footprintOf("colossal")).toBe(4);
    });

    it("deve ignorar acentos", () => {
      expect(footprintOf("médio")).toBe(1);
      expect(footprintOf("medio")).toBe(1);
    });

    it("deve retornar 1 para tamanhos desconhecidos", () => {
      expect(footprintOf("desconhecido")).toBe(1);
      expect(footprintOf("")).toBe(1);
    });
  });

  describe("distanceFt()", () => {
    it("deve calcular distância ortogonal", () => {
      const a = { x: 0, y: 0 };
      const b = { x: 3, y: 0 };
      expect(distanceFt(a, b)).toBe(15); // 3 quadrados × 5 pés
    });

    it("deve calcular distância diagonal (Chebyshev)", () => {
      const a = { x: 0, y: 0 };
      const b = { x: 3, y: 3 };
      expect(distanceFt(a, b)).toBe(15); // diagonal = ortogonal
    });

    it("deve retornar 0 para mesma posição", () => {
      const a = { x: 5, y: 5 };
      const b = { x: 5, y: 5 };
      expect(distanceFt(a, b)).toBe(0);
    });

    it("deve considerar pegada de criatura Grande", () => {
      const ogro = { x: 0, y: 0, f: 2 }; // 2x2
      const heroi = { x: 2, y: 0 };
      expect(distanceFt(ogro, heroi)).toBe(5); // adjacente
    });

    it("deve calcular distância entre duas criaturas Grandes", () => {
      const ogro1 = { x: 0, y: 0, f: 2 };
      const ogro2 = { x: 3, y: 0, f: 2 };
      expect(distanceFt(ogro1, ogro2)).toBe(10); // 2 quadrados entre eles
    });

    it("deve funcionar com criaturas Enormes", () => {
      const dragao = { x: 0, y: 0, f: 3 }; // 3x3
      const heroi = { x: 3, y: 0 };
      expect(distanceFt(dragao, heroi)).toBe(5); // herói está dentro da pegada
    });

    it("deve calcular distância em L", () => {
      const a = { x: 0, y: 0 };
      const b = { x: 2, y: 1 };
      expect(distanceFt(a, b)).toBe(10); // max(2, 1) = 2 quadrados
    });
  });

  describe("isAdjacent()", () => {
    it("deve detectar adjacência ortogonal", () => {
      const a = { x: 0, y: 0 };
      const b = { x: 1, y: 0 };
      expect(isAdjacent(a, b)).toBe(true);
    });

    it("deve detectar adjacência diagonal", () => {
      const a = { x: 0, y: 0 };
      const b = { x: 1, y: 1 };
      expect(isAdjacent(a, b)).toBe(true);
    });

    it("não deve considerar mesma posição como adjacente", () => {
      const a = { x: 0, y: 0 };
      expect(isAdjacent(a, a)).toBe(false);
    });

    it("não deve considerar distância 2 como adjacente", () => {
      const a = { x: 0, y: 0 };
      const b = { x: 2, y: 0 };
      expect(isAdjacent(a, b)).toBe(false);
    });

    it("deve funcionar com criaturas Grandes", () => {
      const ogro = { x: 0, y: 0, f: 2 };
      const heroi = { x: 2, y: 0 };
      expect(isAdjacent(ogro, heroi)).toBe(true);
    });

    it("deve detectar todas as direções adjacentes", () => {
      const center = { x: 5, y: 5 };
      const adjacents = [
        { x: 6, y: 5 }, // direita
        { x: 4, y: 5 }, // esquerda
        { x: 5, y: 6 }, // baixo
        { x: 5, y: 4 }, // cima
        { x: 6, y: 6 }, // diagonal SE
        { x: 6, y: 4 }, // diagonal NE
        { x: 4, y: 6 }, // diagonal SO
        { x: 4, y: 4 }, // diagonal NO
      ];

      adjacents.forEach((adj) => {
        expect(isAdjacent(center, adj)).toBe(true);
      });
    });
  });

  describe("squaresOf()", () => {
    it("deve retornar 1 quadrado para criatura Média", () => {
      const pos = { x: 5, y: 5 };
      const squares = squaresOf(pos);
      expect(squares).toHaveLength(1);
      expect(squares[0]).toEqual({ x: 5, y: 5 });
    });

    it("deve retornar 4 quadrados para criatura Grande", () => {
      const pos = { x: 5, y: 5, f: 2 };
      const squares = squaresOf(pos);
      expect(squares).toHaveLength(4);
      expect(squares).toContainEqual({ x: 5, y: 5 });
      expect(squares).toContainEqual({ x: 6, y: 5 });
      expect(squares).toContainEqual({ x: 5, y: 6 });
      expect(squares).toContainEqual({ x: 6, y: 6 });
    });

    it("deve retornar 9 quadrados para criatura Enorme", () => {
      const pos = { x: 0, y: 0, f: 3 };
      const squares = squaresOf(pos);
      expect(squares).toHaveLength(9);

      // Verifica alguns quadrados específicos
      expect(squares).toContainEqual({ x: 0, y: 0 });
      expect(squares).toContainEqual({ x: 1, y: 1 });
      expect(squares).toContainEqual({ x: 2, y: 2 });
    });

    it("deve retornar 16 quadrados para criatura Imensa", () => {
      const pos = { x: 0, y: 0, f: 4 };
      const squares = squaresOf(pos);
      expect(squares).toHaveLength(16);
    });

    it("deve gerar quadrados na ordem correta", () => {
      const pos = { x: 0, y: 0, f: 2 };
      const squares = squaresOf(pos);

      // Ordem: (0,0), (1,0), (0,1), (1,1)
      expect(squares[0]).toEqual({ x: 0, y: 0 });
      expect(squares[1]).toEqual({ x: 1, y: 0 });
      expect(squares[2]).toEqual({ x: 0, y: 1 });
      expect(squares[3]).toEqual({ x: 1, y: 1 });
    });
  });

  describe("Casos de uso combinados", () => {
    it("deve calcular corretamente alcance de ataque corpo a corpo", () => {
      // Herói médio (1x1) atacando ogro grande (2x2)
      const heroi = { x: 0, y: 0 };
      const ogro = { x: 1, y: 0, f: 2 };

      const dist = distanceFt(heroi, ogro);
      expect(dist).toBe(5); // adjacente
      expect(isAdjacent(heroi, ogro)).toBe(true);
    });

    it("deve verificar se criatura Grande pode passar por corredor", () => {
      const ogro = { x: 0, y: 0, f: 2 };
      const squares = squaresOf(ogro);

      // Ogro ocupa 4 quadrados
      expect(squares).toHaveLength(4);

      // Largura mínima do corredor: 2 quadrados (10 pés)
      const maxX = Math.max(...squares.map((s) => s.x));
      const minX = Math.min(...squares.map((s) => s.x));
      const largura = maxX - minX + 1;
      expect(largura).toBe(2);
    });

    it("deve calcular alcance de magia de 30 pés", () => {
      const conjurador = { x: 0, y: 0 };
      const alvo1 = { x: 6, y: 0 }; // 30 pés
      const alvo2 = { x: 7, y: 0 }; // 35 pés

      expect(distanceFt(conjurador, alvo1)).toBe(30);
      expect(distanceFt(conjurador, alvo2)).toBe(35);
    });

    it("deve verificar alcance de ataque de oportunidade", () => {
      // Ataque de oportunidade ocorre quando sai de alcance (5 pés)
      const guerreiro = { x: 5, y: 5 };

      const posicaoInicial = { x: 6, y: 5 }; // adjacente
      const posicaoFinal = { x: 7, y: 5 }; // 2 quadrados

      expect(isAdjacent(guerreiro, posicaoInicial)).toBe(true);
      expect(isAdjacent(guerreiro, posicaoFinal)).toBe(false);
    });
  });
});
