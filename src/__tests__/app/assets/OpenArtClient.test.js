/**
 * Testes para OpenArtClient
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { OpenArtClient } from "../../../app/assets/OpenArtClient.js";

describe("OpenArtClient", () => {
  let client;
  let mockFetch;

  beforeEach(() => {
    // Mock do fetch global
    mockFetch = vi.fn();
    global.fetch = mockFetch;

    client = new OpenArtClient({
      apiKey: "test-api-key",
      timeout: 5000,
      maxRetries: 2,
    });
  });

  describe("constructor", () => {
    it("deve criar cliente com configurações padrão", () => {
      const defaultClient = new OpenArtClient({ apiKey: "test-key" });

      expect(defaultClient.apiKey).toBe("test-key");
      expect(defaultClient.baseUrl).toBe("https://api.openart.ai/v1");
      expect(defaultClient.timeout).toBe(30000);
      expect(defaultClient.maxRetries).toBe(3);
    });

    it("deve aceitar configurações customizadas", () => {
      expect(client.apiKey).toBe("test-api-key");
      expect(client.timeout).toBe(5000);
      expect(client.maxRetries).toBe(2);
    });

    it("deve lançar erro se API key não fornecida", () => {
      expect(() => new OpenArtClient()).toThrow("OpenArt API key is required");
    });

    it("deve usar variável de ambiente se disponível", () => {
      process.env.OPENART_API_KEY = "env-api-key";
      const envClient = new OpenArtClient();

      expect(envClient.apiKey).toBe("env-api-key");
      delete process.env.OPENART_API_KEY;
    });
  });

  describe("generateImage", () => {
    it("deve gerar imagem com parâmetros básicos", async () => {
      const mockResponse = {
        id: "gen-123",
        output_url: "https://example.com/image.png",
        seed: 12345,
        status: "completed",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.generateImage({
        prompt: "pixel art warrior",
      });

      expect(result).toEqual({
        id: "gen-123",
        url: "https://example.com/image.png",
        seed: 12345,
        prompt: "pixel art warrior",
        status: "completed",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.openart.ai/v1/generate",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-api-key",
            "Content-Type": "application/json",
          }),
        }),
      );
    });

    it("deve usar parâmetros customizados", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "gen-456",
          output_url: "https://example.com/custom.png",
          seed: 99999,
          status: "completed",
        }),
      });

      await client.generateImage({
        prompt: "dragon sprite",
        negativePrompt: "blurry",
        style: "anime",
        width: 128,
        height: 128,
        steps: 50,
        guidanceScale: 10,
        seed: 99999,
      });

      const callArgs = JSON.parse(mockFetch.mock.calls[0][1].body);

      expect(callArgs).toMatchObject({
        prompt: "dragon sprite",
        negative_prompt: "blurry",
        style: "anime",
        width: 128,
        height: 128,
        num_inference_steps: 50,
        guidance_scale: 10,
        seed: 99999,
      });
    });

    it("deve usar valores padrão quando não especificados", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "gen-789",
          output_url: "https://example.com/default.png",
          seed: 54321,
          status: "completed",
        }),
      });

      await client.generateImage({
        prompt: "test sprite",
      });

      const callArgs = JSON.parse(mockFetch.mock.calls[0][1].body);

      expect(callArgs.negative_prompt).toBe("blurry, low quality, distorted");
      expect(callArgs.style).toBe("pixel-art");
      expect(callArgs.width).toBe(512);
      expect(callArgs.height).toBe(512);
      expect(callArgs.num_inference_steps).toBe(30);
      expect(callArgs.guidance_scale).toBe(7.5);
    });

    it("deve tratar erro de API", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: async () => ({ message: "Invalid prompt" }),
      });

      await expect(client.generateImage({ prompt: "" })).rejects.toThrow(
        "OpenArt API error: 400 - Invalid prompt",
      );
    });
  });

  describe("generateVariations", () => {
    it("deve gerar variações de imagem", async () => {
      const mockResponse = {
        id: "var-123",
        outputs: [
          { url: "https://example.com/var1.png" },
          { url: "https://example.com/var2.png" },
          { url: "https://example.com/var3.png" },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.generateVariations({
        imageUrl: "https://example.com/base.png",
        prompt: "color variation",
        strength: 0.5,
        count: 3,
      });

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        id: "var-123_0",
        url: "https://example.com/var1.png",
        prompt: "color variation",
      });
    });

    it("deve usar valores padrão", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "var-456",
          outputs: [
            { url: "https://example.com/var1.png" },
            { url: "https://example.com/var2.png" },
            { url: "https://example.com/var3.png" },
            { url: "https://example.com/var4.png" },
          ],
        }),
      });

      await client.generateVariations({
        imageUrl: "https://example.com/base.png",
        prompt: "test",
      });

      const callArgs = JSON.parse(mockFetch.mock.calls[0][1].body);

      expect(callArgs.strength).toBe(0.7);
      expect(callArgs.num_outputs).toBe(4);
    });
  });

  describe("removeBackground", () => {
    it("deve remover fundo de imagem", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "bg-123",
          output_url: "https://example.com/nobg.png",
        }),
      });

      const result = await client.removeBackground(
        "https://example.com/image.png",
      );

      expect(result).toEqual({
        id: "bg-123",
        url: "https://example.com/nobg.png",
        originalUrl: "https://example.com/image.png",
      });
    });
  });

  describe("upscaleImage", () => {
    it("deve fazer upscale de imagem", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "up-123",
          output_url: "https://example.com/upscaled.png",
        }),
      });

      const result = await client.upscaleImage(
        "https://example.com/small.png",
        4,
      );

      expect(result).toEqual({
        id: "up-123",
        url: "https://example.com/upscaled.png",
        scale: 4,
        originalUrl: "https://example.com/small.png",
      });
    });

    it("deve usar escala padrão 2x", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "up-456",
          output_url: "https://example.com/upscaled2x.png",
        }),
      });

      await client.upscaleImage("https://example.com/small.png");

      const callArgs = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callArgs.scale).toBe(2);
    });
  });

  describe("getStatus", () => {
    it("deve obter status de geração", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "processing",
          progress: 50,
          output_url: null,
        }),
      });

      const result = await client.getStatus("gen-123");

      expect(result).toEqual({
        id: "gen-123",
        status: "processing",
        progress: 50,
        url: null,
        error: undefined,
      });
    });
  });

  describe("waitForCompletion", () => {
    it("deve aguardar conclusão com sucesso", async () => {
      // Primeira chamada: processing
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "processing",
          progress: 50,
        }),
      });

      // Segunda chamada: completed
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "completed",
          progress: 100,
          output_url: "https://example.com/done.png",
        }),
      });

      const result = await client.waitForCompletion("gen-123", 100);

      expect(result.status).toBe("completed");
      expect(result.url).toBe("https://example.com/done.png");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("deve lançar erro se geração falhar", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "failed",
          error: "Invalid parameters",
        }),
      });

      await expect(client.waitForCompletion("gen-123", 100)).rejects.toThrow(
        "Generation failed: Invalid parameters",
      );
    });

    it("deve lançar erro em timeout", async () => {
      // Mock que sempre retorna processing
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({ status: "processing", progress: 10 }),
        }),
      );

      await expect(client.waitForCompletion("gen-123", 10)).rejects.toThrow(
        "Generation timeout",
      );
    }, 10000);
  });

  describe("generateBatch", () => {
    it("deve gerar múltiplas imagens em batch", async () => {
      // Mock para 3 gerações
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: "gen-1",
            output_url: "url1",
            seed: 1,
            status: "completed",
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: "gen-2",
            output_url: "url2",
            seed: 2,
            status: "completed",
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: "gen-3",
            output_url: "url3",
            seed: 3,
            status: "completed",
          }),
        });

      const prompts = [
        { prompt: "warrior" },
        { prompt: "mage" },
        { prompt: "rogue" },
      ];

      const results = await client.generateBatch(prompts);

      expect(results).toHaveLength(3);
      expect(results[0].id).toBe("gen-1");
      expect(results[1].id).toBe("gen-2");
      expect(results[2].id).toBe("gen-3");
    });
  });

  describe("listModels", () => {
    it("deve listar modelos disponíveis", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          models: [
            { id: "model-1", name: "Pixel Art v1" },
            { id: "model-2", name: "Anime Style" },
          ],
        }),
      });

      const models = await client.listModels();

      expect(models).toHaveLength(2);
      expect(models[0].name).toBe("Pixel Art v1");
    });
  });

  describe("getUsage", () => {
    it("deve obter informações de uso", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          credits_remaining: 500,
          credits_used: 100,
          credits_limit: 1000,
          reset_date: "2024-01-01",
        }),
      });

      const usage = await client.getUsage();

      expect(usage).toEqual({
        credits: 500,
        used: 100,
        limit: 1000,
        resetDate: "2024-01-01",
      });
    });
  });

  describe("retry logic", () => {
    it("deve fazer retry em caso de erro de rede", async () => {
      // Primeira tentativa: erro
      mockFetch.mockRejectedValueOnce(new Error("network error"));

      // Segunda tentativa: sucesso
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "gen-retry",
          output_url: "https://example.com/retry.png",
          seed: 123,
          status: "completed",
        }),
      });

      const result = await client.generateImage({ prompt: "test" });

      expect(result.id).toBe("gen-retry");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("deve falhar após máximo de retries", async () => {
      mockFetch.mockRejectedValue(new Error("network error"));

      await expect(client.generateImage({ prompt: "test" })).rejects.toThrow(
        "network error",
      );

      // maxRetries = 2, então 1 tentativa inicial + 2 retries = 3 total
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });
});
