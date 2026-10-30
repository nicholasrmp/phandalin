/**
 * Testes para SpriteGenerator
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { SpriteGenerator } from "../../../app/assets/SpriteGenerator.js";

describe("SpriteGenerator", () => {
  let generator;
  let mockClient;

  beforeEach(() => {
    // Mock do OpenArtClient
    mockClient = {
      generateImage: vi.fn(),
      generateVariations: vi.fn(),
      removeBackground: vi.fn(),
      upscaleImage: vi.fn(),
      waitForCompletion: vi.fn(),
    };

    generator = new SpriteGenerator(mockClient, {
      style: "pixel-art",
      size: { width: 64, height: 64 },
    });
  });

  describe("constructor", () => {
    it("deve criar gerador com configurações padrão", () => {
      const defaultGen = new SpriteGenerator(mockClient);

      expect(defaultGen.defaultStyle).toBe("pixel-art");
      expect(defaultGen.defaultSize).toEqual({ width: 64, height: 64 });
      expect(defaultGen.cache).toBeInstanceOf(Map);
    });

    it("deve aceitar configurações customizadas", () => {
      const customGen = new SpriteGenerator(mockClient, {
        style: "anime",
        size: { width: 128, height: 128 },
      });

      expect(customGen.defaultStyle).toBe("anime");
      expect(customGen.defaultSize).toEqual({ width: 128, height: 128 });
    });
  });

  describe("generatePlayerCharacter", () => {
    it("deve gerar sprite de personagem jogável", async () => {
      mockClient.generateImage.mockResolvedValue({
        id: "pc-123",
        url: "https://example.com/warrior.png",
        seed: 12345,
      });

      mockClient.waitForCompletion.mockResolvedValue({
        id: "pc-123",
        url: "https://example.com/warrior.png",
        seed: 12345,
        status: "completed",
      });

      const result = await generator.generatePlayerCharacter({
        race: "human",
        class: "fighter",
        gender: "male",
        equipment: "sword and shield",
      });

      expect(result).toEqual({
        type: "player_character",
        params: {
          race: "human",
          class: "fighter",
          gender: "male",
          equipment: "sword and shield",
        },
        url: "https://example.com/warrior.png",
        id: "pc-123",
        seed: 12345,
      });

      expect(mockClient.generateImage).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining("human"),
          style: "pixel-art",
          width: 64,
          height: 64,
        }),
      );
    });

    it("deve usar cache para requisições duplicadas", async () => {
      mockClient.generateImage.mockResolvedValue({
        id: "pc-456",
        url: "https://example.com/elf.png",
        seed: 99999,
      });

      mockClient.waitForCompletion.mockResolvedValue({
        id: "pc-456",
        url: "https://example.com/elf.png",
        seed: 99999,
        status: "completed",
      });

      const params = { race: "elf", class: "wizard" };

      // Primeira chamada
      await generator.generatePlayerCharacter(params);

      // Segunda chamada (deve usar cache)
      const result = await generator.generatePlayerCharacter(params);

      expect(mockClient.generateImage).toHaveBeenCalledTimes(1);
      expect(result.url).toBe("https://example.com/elf.png");
    });

    it("deve incluir pose no prompt", async () => {
      mockClient.generateImage.mockResolvedValue({
        id: "pc-789",
        url: "https://example.com/attack.png",
        seed: 11111,
      });

      mockClient.waitForCompletion.mockResolvedValue({
        id: "pc-789",
        url: "https://example.com/attack.png",
        seed: 11111,
        status: "completed",
      });

      await generator.generatePlayerCharacter({
        race: "dwarf",
        class: "barbarian",
        pose: "attack",
      });

      const callArgs = mockClient.generateImage.mock.calls[0][0];
      expect(callArgs.prompt).toContain("attack");
    });
  });

  describe("generateEnemy", () => {
    it("deve gerar sprite de inimigo", async () => {
      mockClient.generateImage.mockResolvedValue({
        id: "enemy-123",
        url: "https://example.com/goblin.png",
        seed: 22222,
      });

      mockClient.waitForCompletion.mockResolvedValue({
        id: "enemy-123",
        url: "https://example.com/goblin.png",
        seed: 22222,
        status: "completed",
      });

      const result = await generator.generateEnemy({
        type: "goblin",
        variant: "red",
        size: "small",
      });

      expect(result.type).toBe("enemy");
      expect(result.params.type).toBe("goblin");
      expect(result.size).toEqual({ width: 48, height: 48 });
    });

    it("deve ajustar tamanho baseado no size do monstro", async () => {
      mockClient.generateImage.mockResolvedValue({
        id: "dragon-123",
        url: "https://example.com/dragon.png",
        seed: 33333,
      });

      mockClient.waitForCompletion.mockResolvedValue({
        id: "dragon-123",
        url: "https://example.com/dragon.png",
        seed: 33333,
        status: "completed",
      });

      const result = await generator.generateEnemy({
        type: "dragon",
        size: "huge",
      });

      expect(result.size).toEqual({ width: 128, height: 128 });

      const callArgs = mockClient.generateImage.mock.calls[0][0];
      expect(callArgs.width).toBe(128);
      expect(callArgs.height).toBe(128);
    });

    it("deve usar tamanho médio como padrão", async () => {
      mockClient.generateImage.mockResolvedValue({
        id: "skeleton-123",
        url: "https://example.com/skeleton.png",
        seed: 44444,
      });

      mockClient.waitForCompletion.mockResolvedValue({
        id: "skeleton-123",
        url: "https://example.com/skeleton.png",
        seed: 44444,
        status: "completed",
      });

      const result = await generator.generateEnemy({
        type: "skeleton",
      });

      expect(result.size).toEqual({ width: 64, height: 64 });
    });
  });

  describe("generateSpellEffect", () => {
    it("deve gerar efeito de magia", async () => {
      mockClient.generateImage.mockResolvedValue({
        id: "spell-123",
        url: "https://example.com/fireball.png",
        seed: 55555,
      });

      mockClient.waitForCompletion.mockResolvedValue({
        id: "spell-123",
        url: "https://example.com/fireball.png",
        seed: 55555,
        status: "completed",
      });

      const result = await generator.generateSpellEffect({
        spellName: "Fireball",
        element: "fire",
        shape: "projectile",
      });

      expect(result.type).toBe("spell_effect");
      expect(result.frames).toHaveLength(1);
      expect(result.frames[0]).toBe("https://example.com/fireball.png");
    });

    it("deve gerar múltiplos frames de animação", async () => {
      mockClient.generateImage.mockResolvedValue({
        id: "spell-456",
        url: "https://example.com/lightning-base.png",
        seed: 66666,
      });

      mockClient.waitForCompletion.mockResolvedValue({
        id: "spell-456",
        url: "https://example.com/lightning-base.png",
        seed: 66666,
        status: "completed",
      });

      mockClient.generateVariations.mockResolvedValue([
        { url: "https://example.com/lightning-1.png" },
        { url: "https://example.com/lightning-2.png" },
        { url: "https://example.com/lightning-3.png" },
      ]);

      const result = await generator.generateSpellEffect({
        spellName: "Lightning Bolt",
        element: "lightning",
        frames: 4,
      });

      expect(result.frames).toHaveLength(4);
      expect(mockClient.generateVariations).toHaveBeenCalledWith(
        expect.objectContaining({
          imageUrl: "https://example.com/lightning-base.png",
          count: 3,
          strength: 0.3,
        }),
      );
    });
  });

  describe("generateEnvironmentTile", () => {
    it("deve gerar tile de ambiente", async () => {
      mockClient.generateImage.mockResolvedValue({
        id: "tile-123",
        url: "https://example.com/stone-floor.png",
        seed: 77777,
      });

      mockClient.waitForCompletion.mockResolvedValue({
        id: "tile-123",
        url: "https://example.com/stone-floor.png",
        seed: 77777,
        status: "completed",
      });

      const result = await generator.generateEnvironmentTile({
        type: "floor",
        material: "stone",
        variant: "cracked",
      });

      expect(result.type).toBe("environment_tile");
      expect(result.params.type).toBe("floor");

      const callArgs = mockClient.generateImage.mock.calls[0][0];
      expect(callArgs.prompt).toContain("seamless tileable");
      expect(callArgs.width).toBe(64);
      expect(callArgs.height).toBe(64);
    });
  });

  describe("generateCharacterSet", () => {
    it("deve gerar conjunto completo de sprites", async () => {
      const poses = ["idle", "walk", "attack"];

      mockClient.generateImage.mockImplementation((params) => {
        const pose = params.prompt.includes("idle")
          ? "idle"
          : params.prompt.includes("walk")
            ? "walk"
            : "attack";
        return Promise.resolve({
          id: `char-${pose}`,
          url: `https://example.com/${pose}.png`,
          seed: 88888,
        });
      });

      mockClient.waitForCompletion.mockImplementation((id) => {
        return Promise.resolve({
          id,
          url: `https://example.com/${id.split("-")[1]}.png`,
          seed: 88888,
          status: "completed",
        });
      });

      const result = await generator.generateCharacterSet(
        { race: "human", class: "rogue" },
        poses,
      );

      expect(result.type).toBe("character_set");
      expect(result.poses).toEqual(poses);
      expect(Object.keys(result.sprites)).toHaveLength(3);
      expect(result.sprites.idle).toBeDefined();
      expect(result.sprites.walk).toBeDefined();
      expect(result.sprites.attack).toBeDefined();
    });
  });

  describe("generateColorVariants", () => {
    it("deve gerar variações de cor", async () => {
      mockClient.generateVariations.mockImplementation((params) => {
        const color = params.prompt.includes("red")
          ? "red"
          : params.prompt.includes("blue")
            ? "blue"
            : "green";
        return Promise.resolve([
          {
            url: `https://example.com/${color}.png`,
          },
        ]);
      });

      const colors = ["red", "blue", "green"];
      const result = await generator.generateColorVariants(
        "https://example.com/base.png",
        colors,
      );

      expect(result).toHaveLength(3);
      expect(result[0].color).toBe("red");
      expect(result[1].color).toBe("blue");
      expect(result[2].color).toBe("green");
    });
  });

  describe("generateSpriteSheet", () => {
    it("deve gerar sprite sheet de animação", async () => {
      mockClient.generateImage.mockResolvedValue({
        id: "sheet-123",
        url: "https://example.com/base.png",
        seed: 99999,
      });

      mockClient.waitForCompletion.mockResolvedValue({
        id: "sheet-123",
        url: "https://example.com/base.png",
        seed: 99999,
        status: "completed",
      });

      mockClient.generateVariations.mockResolvedValue([
        { url: "https://example.com/frame1.png" },
        { url: "https://example.com/frame2.png" },
        { url: "https://example.com/frame3.png" },
      ]);

      const result = await generator.generateSpriteSheet({
        race: "elf",
        class: "ranger",
        animation: "run",
        frames: 4,
      });

      expect(result.type).toBe("sprite_sheet");
      expect(result.frames).toHaveLength(4);
      expect(result.animation).toBe("run");
      expect(result.frameCount).toBe(4);
    });
  });

  describe("removeBackground", () => {
    it("deve remover fundo de sprite", async () => {
      mockClient.removeBackground.mockResolvedValue({
        id: "nobg-123",
        url: "https://example.com/nobg.png",
        originalUrl: "https://example.com/original.png",
      });

      const result = await generator.removeBackground(
        "https://example.com/original.png",
      );

      expect(result.url).toBe("https://example.com/nobg.png");
      expect(mockClient.removeBackground).toHaveBeenCalledWith(
        "https://example.com/original.png",
      );
    });
  });

  describe("upscaleSprite", () => {
    it("deve fazer upscale de sprite", async () => {
      mockClient.upscaleImage.mockResolvedValue({
        id: "upscale-123",
        url: "https://example.com/upscaled.png",
        scale: 2,
        originalUrl: "https://example.com/small.png",
      });

      const result = await generator.upscaleSprite(
        "https://example.com/small.png",
        2,
      );

      expect(result.url).toBe("https://example.com/upscaled.png");
      expect(result.scale).toBe(2);
    });

    it("deve usar escala padrão 2x", async () => {
      mockClient.upscaleImage.mockResolvedValue({
        id: "upscale-456",
        url: "https://example.com/upscaled2x.png",
        scale: 2,
        originalUrl: "https://example.com/small.png",
      });

      await generator.upscaleSprite("https://example.com/small.png");

      expect(mockClient.upscaleImage).toHaveBeenCalledWith(
        "https://example.com/small.png",
        2,
      );
    });
  });

  describe("generateEncounterEnemies", () => {
    it("deve gerar múltiplos inimigos em paralelo", async () => {
      mockClient.generateImage.mockImplementation((params) => {
        const type = params.prompt.includes("goblin") ? "goblin" : "orc";
        return Promise.resolve({
          id: `enemy-${type}`,
          url: `https://example.com/${type}.png`,
          seed: 12345,
        });
      });

      mockClient.waitForCompletion.mockImplementation((id) => {
        return Promise.resolve({
          id,
          url: `https://example.com/${id.split("-")[1]}.png`,
          seed: 12345,
          status: "completed",
        });
      });

      const enemies = [
        { type: "goblin", size: "small" },
        { type: "orc", size: "medium" },
      ];

      const results = await generator.generateEncounterEnemies(enemies);

      expect(results).toHaveLength(2);
      expect(results[0].params.type).toBe("goblin");
      expect(results[1].params.type).toBe("orc");
    });
  });

  describe("cache", () => {
    it("deve limpar cache", () => {
      generator.cache.set("test", { data: "test" });
      expect(generator.cache.size).toBe(1);

      generator.clearCache();
      expect(generator.cache.size).toBe(0);
    });

    it("deve obter estatísticas do cache", () => {
      generator.cache.set("sprite1", { url: "url1" });
      generator.cache.set("sprite2", { url: "url2" });

      const stats = generator.getCacheStats();

      expect(stats.size).toBe(2);
      expect(stats.keys).toContain("sprite1");
      expect(stats.keys).toContain("sprite2");
    });
  });
});
