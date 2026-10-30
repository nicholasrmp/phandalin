/**
 * Testes para PixelLabClient - Atualizado para API v2 Real
 * Baseado na documentação oficial: https://api.pixellab.ai/v2/docs
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { PixelLabClient } from "../../../app/assets/PixelLabClient.js";

describe("PixelLabClient", () => {
  let client;
  let mockFetch;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;

    client = new PixelLabClient({
      apiKey: "test-pixellab-key",
      timeout: 5000,
      maxRetries: 2,
    });
  });

  // ============================================================================
  // TESTES BÁSICOS
  // ============================================================================

  describe("constructor", () => {
    it("deve criar cliente com configurações padrão", () => {
      const defaultClient = new PixelLabClient({ apiKey: "test-key" });

      expect(defaultClient.apiKey).toBe("test-key");
      expect(defaultClient.baseUrl).toBe("https://api.pixellab.ai/v2");
      expect(defaultClient.timeout).toBe(30000);
      expect(defaultClient.maxRetries).toBe(3);
    });

    it("deve aceitar configurações customizadas", () => {
      expect(client.apiKey).toBe("test-pixellab-key");
      expect(client.timeout).toBe(5000);
      expect(client.maxRetries).toBe(2);
    });

    it("deve lançar erro se API key não fornecida", () => {
      expect(() => new PixelLabClient()).toThrow(
        "PixelLab API key is required",
      );
    });

    it("deve usar variável de ambiente se disponível", () => {
      process.env.PIXELLAB_API_KEY = "env-pixellab-key";
      const envClient = new PixelLabClient();

      expect(envClient.apiKey).toBe("env-pixellab-key");
      delete process.env.PIXELLAB_API_KEY;
    });
  });

  // ============================================================================
  // TESTES DE PERSONAGENS (v3)
  // ============================================================================

  describe("createCharacterV3", () => {
    it("deve criar personagem com 8 direções", async () => {
      const mockResponse = {
        character_id: "char-123",
        background_job_id: "job-456",
        directions_count: 8,
        status: "processing",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.createCharacterV3({
        description: "warrior with sword",
      });

      expect(result).toEqual({
        characterId: "char-123",
        jobId: "job-456",
        directionsCount: 8,
        status: "processing",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.pixellab.ai/v2/create-character-v3",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-pixellab-key",
          }),
        }),
      );
    });

    it("deve usar parâmetros customizados", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          character_id: "char-456",
          background_job_id: "job-789",
          directions_count: 4,
          status: "processing",
        }),
      });

      await client.createCharacterV3({
        description: "mage with staff",
        n_directions: 4,
        view: "high top-down",
        template_id: "humanoid",
        image_size: { width: 64, height: 64 },
        no_background: true,
        enhance_prompt: true,
      });

      const callArgs = JSON.parse(mockFetch.mock.calls[0][1].body);

      expect(callArgs).toMatchObject({
        description: "mage with staff",
        n_directions: 4,
        view: "high top-down",
        template_id: "humanoid",
        no_background: true,
        enhance_prompt: true,
      });
      expect(callArgs.image_size).toEqual({ width: 64, height: 64 });
    });
  });

  describe("listCharacters", () => {
    it("deve listar personagens com paginação", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          characters: [
            { id: "char-1", name: "Warrior" },
            { id: "char-2", name: "Mage" },
          ],
          total: 2,
        }),
      });

      const result = await client.listCharacters(10, 0);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.pixellab.ai/v2/characters?limit=10&offset=0",
        expect.any(Object),
      );
    });
  });

  describe("getCharacter", () => {
    it("deve obter detalhes de um personagem", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "char-123",
          name: "Warrior",
          directions: 8,
        }),
      });

      const result = await client.getCharacter("char-123");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.pixellab.ai/v2/characters/char-123",
        expect.any(Object),
      );
    });
  });

  describe("deleteCharacter", () => {
    it("deve deletar um personagem", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await client.deleteCharacter("char-123");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.pixellab.ai/v2/characters/char-123",
        expect.objectContaining({
          method: "DELETE",
        }),
      );
    });
  });

  // ============================================================================
  // TESTES DE OBJETOS
  // ============================================================================

  describe("createObject1Direction", () => {
    it("deve criar objeto de 1 direção", async () => {
      const mockResponse = {
        object_id: "obj-123",
        background_job_id: "job-456",
        status: "processing",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.createObject1Direction({
        description: "magic sword",
        size: 64,
        view: "top-down",
      });

      expect(result).toEqual({
        objectId: "obj-123",
        jobId: "job-456",
        status: "processing",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.pixellab.ai/v2/create-1-direction-object",
        expect.objectContaining({
          method: "POST",
        }),
      );
    });
  });

  describe("createObject8Directions", () => {
    it("deve criar objeto com 8 direções", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          object_id: "obj-456",
          background_job_id: "job-789",
          status: "processing",
        }),
      });

      const result = await client.createObject8Directions({
        description: "treasure chest",
        size: 48,
        view: "low top-down",
      });

      expect(result.objectId).toBe("obj-456");
      expect(result.jobId).toBe("job-789");
    });
  });

  describe("listObjects", () => {
    it("deve listar objetos", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          objects: [{ id: "obj-1" }, { id: "obj-2" }],
        }),
      });

      await client.listObjects(20, 0);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.pixellab.ai/v2/objects?limit=20&offset=0",
        expect.any(Object),
      );
    });
  });

  // ============================================================================
  // TESTES DE TILESETS
  // ============================================================================

  describe("createTileset", () => {
    it("deve criar tileset com parâmetros corretos", async () => {
      const mockResponse = {
        tileset_id: "tileset-123",
        background_job_id: "job-456",
        status: "processing",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.createTileset({
        lower_description: "stone floor",
        upper_description: "grass terrain",
        tile_size: { width: 16, height: 16 },
        mode: "standard",
      });

      expect(result).toEqual({
        tilesetId: "tileset-123",
        jobId: "job-456",
        status: "processing",
      });

      const callArgs = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callArgs.lower_description).toBe("stone floor");
      expect(callArgs.upper_description).toBe("grass terrain");
      expect(callArgs.tile_size).toEqual({ width: 16, height: 16 });
    });

    it("deve usar valores padrão", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tileset_id: "tileset-456",
          background_job_id: "job-789",
          status: "processing",
        }),
      });

      await client.createTileset({
        lower_description: "water",
        upper_description: "sand",
      });

      const callArgs = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callArgs.tile_size).toEqual({ width: 16, height: 16 });
      expect(callArgs.mode).toBe("standard");
      expect(callArgs.view).toBe("high top-down");
    });
  });

  describe("listTilesets", () => {
    it("deve listar tilesets", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tilesets: [{ id: "tileset-1" }],
        }),
      });

      await client.listTilesets();

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.pixellab.ai/v2/tilesets?limit=50&offset=0",
        expect.any(Object),
      );
    });
  });

  // ============================================================================
  // TESTES DE ANIMAÇÃO
  // ============================================================================

  describe("animateWithTextV3", () => {
    it("deve criar animação com texto", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          background_job_id: "job-123",
          status: "processing",
        }),
      });

      const result = await client.animateWithTextV3({
        first_frame: { type: "base64", base64: "data:image/png;base64,..." },
        action: "walking forward",
        frame_count: 8,
      });

      expect(result.jobId).toBe("job-123");
      expect(result.status).toBe("processing");
    });
  });

  // ============================================================================
  // TESTES DE PROCESSAMENTO DE IMAGEM
  // ============================================================================

  describe("reduceColors", () => {
    it("deve reduzir cores de imagens", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          images: [{ type: "base64", base64: "..." }],
          palette: ["#FF0000", "#00FF00", "#0000FF"],
          color_count: 3,
        }),
      });

      const result = await client.reduceColors({
        images: [{ type: "base64", base64: "data:image/png;base64,..." }],
        num_colors: 8,
        dithering: "bayer",
      });

      expect(result.palette).toHaveLength(3);
      expect(result.colorCount).toBe(3);
    });
  });

  describe("resizeSprite", () => {
    it("deve redimensionar sprite mantendo estética pixel art", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          image: { type: "base64", base64: "..." },
          usage: { credits_used: 1 },
        }),
      });

      const result = await client.resizeSprite({
        description: "warrior character",
        reference_image: { type: "base64", base64: "..." },
        reference_image_size: { width: 32, height: 32 },
        target_size: { width: 64, height: 64 },
      });

      expect(result.image).toBeDefined();
      expect(result.usage).toBeDefined();
    });
  });

  // ============================================================================
  // TESTES DE VFX
  // ============================================================================

  describe("createVFX", () => {
    it("deve criar efeito visual", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          background_job_id: "job-123",
          effect_id: "vfx-456",
          status: "processing",
          quoted_generations: 2,
        }),
      });

      const result = await client.createVFX({
        description: "fire explosion effect",
        artist: "pro",
        game_pack: true,
      });

      expect(result.jobId).toBe("job-123");
      expect(result.effectId).toBe("vfx-456");
      expect(result.quotedGenerations).toBe(2);
    });
  });

  // ============================================================================
  // TESTES DE JOBS EM BACKGROUND
  // ============================================================================

  describe("getStatus", () => {
    it("deve obter status de job em background", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "processing",
          progress: 50,
          last_response: null,
          usage: { credits_used: 1 },
          created_at: "2024-01-01T00:00:00Z",
        }),
      });

      const result = await client.getStatus("job-123");

      expect(result).toEqual({
        id: "job-123",
        status: "processing",
        progress: 50,
        lastResponse: null,
        usage: { credits_used: 1 },
        error: undefined,
        createdAt: "2024-01-01T00:00:00Z",
      });
    });
  });

  describe("waitForCompletion", () => {
    it("deve aguardar conclusão com sucesso", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status: "processing",
            progress: 50,
            last_response: null,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status: "completed",
            progress: 100,
            last_response: { url: "https://example.com/done.png" },
          }),
        });

      const result = await client.waitForCompletion("job-123", 100);

      expect(result).toEqual({ url: "https://example.com/done.png" });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("deve lançar erro se job falhar", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "failed",
          error: "Invalid parameters",
        }),
      });

      await expect(client.waitForCompletion("job-123", 100)).rejects.toThrow(
        "Generation failed: Invalid parameters",
      );
    });
  });

  describe("cancelJob", () => {
    it("deve cancelar job em background", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await client.cancelJob("job-123");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.pixellab.ai/v2/background-jobs/job-123",
        expect.objectContaining({
          method: "DELETE",
        }),
      );
    });
  });

  // ============================================================================
  // TESTES DE SALDO
  // ============================================================================

  describe("getBalance", () => {
    it("deve obter saldo da conta", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          credits: {
            usd: 10.5,
            used: 5.2,
            limit: 100.0,
          },
          subscription: {
            generations: 150,
            total: 200,
            reset_date: "2024-12-01",
          },
        }),
      });

      const result = await client.getBalance();

      expect(result.credits.usd).toBe(10.5);
      expect(result.subscription.generations).toBe(150);
      expect(result.subscription.resetDate).toBe("2024-12-01");
    });
  });

  // ============================================================================
  // TESTES DE COMPATIBILIDADE (DEPRECATED)
  // ============================================================================

  describe("métodos deprecated", () => {
    it("createCharacter deve chamar createCharacterV3 com warning", async () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          character_id: "char-123",
          background_job_id: "job-456",
          directions_count: 8,
          status: "processing",
        }),
      });

      const result = await client.createCharacter({
        description: "warrior",
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "createCharacter() is deprecated, use createCharacterV3()",
      );
      expect(result.characterId).toBe("char-123");

      consoleSpy.mockRestore();
    });

    it("createObject deve chamar createObject1Direction com warning", async () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          object_id: "obj-123",
          background_job_id: "job-456",
          status: "processing",
        }),
      });

      await client.createObject({ description: "sword" });

      expect(consoleSpy).toHaveBeenCalledWith(
        "createObject() is deprecated, use createObject1Direction() or createObject8Directions()",
      );

      consoleSpy.mockRestore();
    });

    it("getUsage deve chamar getBalance com warning", async () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          credits: { usd: 10, used: 5, limit: 100 },
          subscription: {
            generations: 150,
            total: 200,
            reset_date: "2024-12-01",
          },
        }),
      });

      const result = await client.getUsage();

      expect(consoleSpy).toHaveBeenCalledWith(
        "getUsage() is deprecated, use getBalance()",
      );
      expect(result.credits).toBe(150);

      consoleSpy.mockRestore();
    });
  });

  // ============================================================================
  // TESTES DE MÉTODOS REMOVIDOS
  // ============================================================================

  describe("métodos removidos", () => {
    it("generateVariations deve lançar erro explicativo", async () => {
      await expect(client.generateVariations()).rejects.toThrow(
        "generateVariations() was removed",
      );
    });

    it("createGameAssetPack deve lançar erro explicativo", async () => {
      await expect(client.createGameAssetPack()).rejects.toThrow(
        "createGameAssetPack() was removed",
      );
    });

    it("listAssets deve lançar erro explicativo", async () => {
      await expect(client.listAssets()).rejects.toThrow(
        "listAssets() was removed",
      );
    });
  });

  // ============================================================================
  // TESTES DE TRATAMENTO DE ERROS
  // ============================================================================

  describe("error handling", () => {
    it("deve tratar erro de API", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: async () => ({ message: "Invalid description" }),
      });

      await expect(
        client.createCharacterV3({ description: "" }),
      ).rejects.toThrow("PixelLab API error: 400 - Invalid description");
    });

    it("deve fazer retry em caso de erro de rede", async () => {
      mockFetch
        .mockRejectedValueOnce(new Error("network error"))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            character_id: "char-retry",
            background_job_id: "job-retry",
            directions_count: 8,
            status: "processing",
          }),
        });

      const result = await client.createCharacterV3({ description: "test" });

      expect(result.characterId).toBe("char-retry");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("deve respeitar maxRetries", async () => {
      mockFetch
        .mockRejectedValueOnce(new Error("network error"))
        .mockRejectedValueOnce(new Error("network error"))
        .mockRejectedValueOnce(new Error("network error"));

      await expect(
        client.createCharacterV3({ description: "test" }),
      ).rejects.toThrow("network error");

      expect(mockFetch).toHaveBeenCalledTimes(3); // 1 inicial + 2 retries
    });

    it("deve respeitar timeout", async () => {
      // Mock que simula AbortError quando o signal é abortado
      mockFetch.mockImplementationOnce((url, options) => {
        return new Promise((resolve, reject) => {
          // Escuta o sinal de abort
          options.signal.addEventListener("abort", () => {
            const error = new Error("The operation was aborted");
            error.name = "AbortError";
            reject(error);
          });

          // Simula uma requisição lenta que nunca completa
          setTimeout(() => {
            resolve({ ok: true, json: async () => ({}) });
          }, 100000);
        });
      });

      await expect(
        client.createCharacterV3({ description: "test" }),
      ).rejects.toThrow();
    });
  });
});
