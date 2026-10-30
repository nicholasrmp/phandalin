/**
 * Testes para AssetManager
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { AssetManager } from "../../../app/assets/AssetManager.js";

// Mock do IndexedDB
const mockIndexedDB = () => {
  const store = new Map();

  return {
    open: vi.fn((name, version) => {
      return {
        result: {
          objectStoreNames: { contains: () => false },
          createObjectStore: vi.fn(() => ({
            createIndex: vi.fn(),
          })),
          transaction: vi.fn((stores, mode) => ({
            objectStore: vi.fn(() => ({
              put: vi.fn(() => ({ onsuccess: null, onerror: null })),
              get: vi.fn((key) => ({
                onsuccess: null,
                onerror: null,
                result: store.get(key),
              })),
              delete: vi.fn(() => ({ onsuccess: null, onerror: null })),
              clear: vi.fn(() => ({ onsuccess: null, onerror: null })),
              index: vi.fn(() => ({
                getAll: vi.fn(() => ({
                  onsuccess: null,
                  onerror: null,
                  result: [],
                })),
              })),
            })),
          })),
        },
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
      };
    }),
  };
};

describe("AssetManager", () => {
  let manager;
  let mockFetch;

  beforeEach(() => {
    // Mock do fetch
    mockFetch = vi.fn();
    global.fetch = mockFetch;

    // Mock do IndexedDB
    global.indexedDB = mockIndexedDB();

    // Mock do URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
    global.URL.revokeObjectURL = vi.fn();

    manager = new AssetManager({
      basePath: "/test-assets",
      useIndexedDB: false, // Desabilita para testes mais simples
      maxCacheSize: 1, // 1MB para testes
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("deve criar manager com configurações padrão", () => {
      const defaultManager = new AssetManager();

      expect(defaultManager.basePath).toBe("/assets");
      expect(defaultManager.maxCacheSize).toBe(50 * 1024 * 1024);
      expect(defaultManager.memoryCache).toBeInstanceOf(Map);
    });

    it("deve aceitar configurações customizadas", () => {
      expect(manager.basePath).toBe("/test-assets");
      expect(manager.maxCacheSize).toBe(1 * 1024 * 1024);
    });
  });

  describe("saveAsset", () => {
    it("deve salvar asset no cache", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        blob: async () => new Blob(["test"], { type: "image/png" }),
      });

      const asset = await manager.saveAsset("test-id", {
        url: "https://example.com/test.png",
        type: "player_character",
        metadata: { race: "human" },
      });

      expect(asset.id).toBe("test-id");
      expect(asset.type).toBe("player_character");
      expect(asset.metadata.race).toBe("human");
      expect(manager.memoryCache.has("test-id")).toBe(true);
    });

    it("deve baixar e criar blob URL", async () => {
      const mockBlob = new Blob(["image data"], { type: "image/png" });
      mockFetch.mockResolvedValue({
        ok: true,
        blob: async () => mockBlob,
      });

      await manager.saveAsset("sprite-1", {
        url: "https://example.com/sprite.png",
        type: "enemy",
      });

      const cached = manager.memoryCache.get("sprite-1");
      expect(cached.blobUrl).toBe("blob:mock-url");
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
    });

    it("deve tratar erro de download", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(
        manager.saveAsset("fail-id", {
          url: "https://example.com/notfound.png",
          type: "item",
        }),
      ).rejects.toThrow();
    });
  });

  describe("loadAsset", () => {
    it("deve carregar asset do cache de memória", async () => {
      const testAsset = {
        id: "cached-1",
        url: "https://example.com/cached.png",
        type: "spell_effect",
        timestamp: Date.now(),
      };

      manager.memoryCache.set("cached-1", testAsset);

      const loaded = await manager.loadAsset("cached-1");
      expect(loaded).toEqual(testAsset);
    });

    it("deve retornar null se asset não encontrado", async () => {
      const loaded = await manager.loadAsset("nonexistent");
      expect(loaded).toBeNull();
    });
  });

  describe("loadImage", () => {
    it("deve carregar imagem como HTMLImageElement", async () => {
      const testAsset = {
        id: "img-1",
        url: "https://example.com/image.png",
        blobUrl: "blob:test-url",
        type: "player_character",
        timestamp: Date.now(),
      };

      manager.memoryCache.set("img-1", testAsset);

      // Mock do Image
      const mockImage = {
        onload: null,
        onerror: null,
        src: "",
      };

      global.Image = vi.fn(() => mockImage);

      const loadPromise = manager.loadImage("img-1");

      // Simula carregamento bem-sucedido
      setTimeout(() => {
        mockImage.src = testAsset.blobUrl;
        if (mockImage.onload) mockImage.onload();
      }, 0);

      const img = await loadPromise;
      expect(img.src).toBe("blob:test-url");
    });

    it("deve evitar carregamentos duplicados", async () => {
      const testAsset = {
        id: "img-2",
        url: "https://example.com/image2.png",
        blobUrl: "blob:test-url-2",
        type: "enemy",
        timestamp: Date.now(),
      };

      manager.memoryCache.set("img-2", testAsset);

      const mockImage = {
        onload: null,
        onerror: null,
        src: "",
      };

      global.Image = vi.fn(() => mockImage);

      // Inicia dois carregamentos simultâneos
      const promise1 = manager.loadImage("img-2");
      const promise2 = manager.loadImage("img-2");

      setTimeout(() => {
        if (mockImage.onload) mockImage.onload();
      }, 0);

      await Promise.all([promise1, promise2]);

      // Deve criar apenas uma Image
      expect(global.Image).toHaveBeenCalledTimes(1);
    });

    it("deve lançar erro se asset não encontrado", async () => {
      await expect(manager.loadImage("missing-img")).rejects.toThrow(
        "Asset not found: missing-img",
      );
    });
  });

  describe("preloadAssets", () => {
    it("deve pré-carregar múltiplos assets", async () => {
      const assets = ["asset-1", "asset-2", "asset-3"];

      assets.forEach((id) => {
        manager.memoryCache.set(id, {
          id,
          url: `https://example.com/${id}.png`,
          blobUrl: `blob:${id}`,
          type: "item",
          timestamp: Date.now(),
        });
      });

      global.Image = vi.fn(() => {
        const mockImage = {
          onload: null,
          onerror: null,
          src: "",
        };

        // Simula carregamento imediato
        setTimeout(() => {
          if (mockImage.onload) mockImage.onload();
        }, 0);

        return mockImage;
      });

      const results = await manager.preloadAssets(assets);
      expect(results).toHaveLength(3);
    });
  });

  describe("removeAsset", () => {
    it("deve remover asset do cache", async () => {
      const testAsset = {
        id: "remove-1",
        url: "https://example.com/remove.png",
        blobUrl: "blob:remove-url",
        type: "ui",
        size: 1024,
        timestamp: Date.now(),
      };

      manager.memoryCache.set("remove-1", testAsset);
      manager.cacheSize = 1024;

      await manager.removeAsset("remove-1");

      expect(manager.memoryCache.has("remove-1")).toBe(false);
      expect(manager.cacheSize).toBe(0);
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(
        "blob:remove-url",
      );
    });
  });

  describe("listAssetsByType", () => {
    it("deve listar assets por tipo", async () => {
      manager.memoryCache.set("char-1", {
        id: "char-1",
        type: "player_character",
        url: "url1",
      });

      manager.memoryCache.set("char-2", {
        id: "char-2",
        type: "player_character",
        url: "url2",
      });

      manager.memoryCache.set("enemy-1", {
        id: "enemy-1",
        type: "enemy",
        url: "url3",
      });

      const characters = await manager.listAssetsByType("player_character");

      expect(characters).toHaveLength(2);
      expect(characters.every((a) => a.type === "player_character")).toBe(true);
    });
  });

  describe("getAssetPath", () => {
    it("deve retornar caminho correto para cada tipo", () => {
      const paths = {
        player_character: "/test-assets/characters/players/test-id.png",
        enemy: "/test-assets/characters/enemies/test-id.png",
        spell_effect: "/test-assets/effects/spells/test-id.png",
        environment_tile: "/test-assets/environment/tiles/test-id.png",
        item: "/test-assets/items/test-id.png",
        ui: "/test-assets/ui/test-id.png",
        unknown: "/test-assets/misc/test-id.png",
      };

      Object.entries(paths).forEach(([type, expectedPath]) => {
        const path = manager.getAssetPath({ id: "test-id", type });
        expect(path).toBe(expectedPath);
      });
    });
  });

  describe("exportAsset", () => {
    it("deve exportar asset para download", async () => {
      const mockBlob = new Blob(["data"], { type: "image/png" });

      manager.memoryCache.set("export-1", {
        id: "export-1",
        url: "https://example.com/export.png",
        blob: mockBlob,
        type: "item",
      });

      // Mock do createElement e click
      const mockAnchor = {
        href: "",
        download: "",
        click: vi.fn(),
      };

      global.document = {
        createElement: vi.fn(() => mockAnchor),
      };

      await manager.exportAsset("export-1", "custom-name.png");

      expect(mockAnchor.download).toBe("custom-name.png");
      expect(mockAnchor.click).toHaveBeenCalled();
    });
  });

  describe("clearCache", () => {
    it("deve limpar todo o cache", async () => {
      manager.memoryCache.set("asset-1", {
        id: "asset-1",
        blobUrl: "blob:url-1",
        size: 512,
      });

      manager.memoryCache.set("asset-2", {
        id: "asset-2",
        blobUrl: "blob:url-2",
        size: 512,
      });

      manager.cacheSize = 1024;

      await manager.clearCache();

      expect(manager.memoryCache.size).toBe(0);
      expect(manager.cacheSize).toBe(0);
      expect(global.URL.revokeObjectURL).toHaveBeenCalledTimes(2);
    });
  });

  describe("getCacheStats", () => {
    it("deve retornar estatísticas do cache", () => {
      manager.memoryCache.set("stat-1", { size: 512 });
      manager.memoryCache.set("stat-2", { size: 512 });
      manager.cacheSize = 1024;
      manager.maxCacheSize = 10240;

      const stats = manager.getCacheStats();

      expect(stats.memoryCount).toBe(2);
      expect(stats.totalSize).toBe(1024);
      expect(stats.maxSize).toBe(10240);
      expect(stats.usagePercent).toBe("10.00");
    });
  });

  describe("validateAsset", () => {
    it("deve validar asset existente", async () => {
      const testAsset = {
        id: "valid-1",
        url: "https://example.com/valid.png",
        blobUrl: "blob:valid-url",
        type: "item",
        timestamp: Date.now(),
      };

      manager.memoryCache.set("valid-1", testAsset);

      const mockImage = {
        onload: null,
        onerror: null,
        src: "",
      };

      global.Image = vi.fn(() => mockImage);

      const validatePromise = manager.validateAsset("valid-1");

      setTimeout(() => {
        if (mockImage.onload) mockImage.onload();
      }, 0);

      const isValid = await validatePromise;
      expect(isValid).toBe(true);
    });

    it("deve retornar false para asset inexistente", async () => {
      const isValid = await manager.validateAsset("nonexistent");
      expect(isValid).toBe(false);
    });
  });

  describe("createSpriteSheet", () => {
    it("deve criar sprite sheet a partir de múltiplos assets", async () => {
      const ids = ["sprite-1", "sprite-2", "sprite-3", "sprite-4"];

      ids.forEach((id) => {
        manager.memoryCache.set(id, {
          id,
          url: `https://example.com/${id}.png`,
          blobUrl: `blob:${id}`,
          type: "player_character",
          timestamp: Date.now(),
        });
      });

      // Mock do Image e Canvas
      global.Image = vi.fn(() => {
        const mockImage = {
          onload: null,
          onerror: null,
          src: "",
          width: 64,
          height: 64,
        };

        // Simula carregamento imediato
        setTimeout(() => {
          if (mockImage.onload) mockImage.onload();
        }, 0);

        return mockImage;
      });

      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn(() => ({
          drawImage: vi.fn(),
        })),
      };

      global.document = {
        createElement: vi.fn(() => mockCanvas),
      };

      const canvas = await manager.createSpriteSheet(ids, {
        cols: 2,
        spriteWidth: 64,
        spriteHeight: 64,
      });

      expect(canvas.width).toBe(128); // 2 cols * 64px
      expect(canvas.height).toBe(128); // 2 rows * 64px
      expect(mockCanvas.getContext).toHaveBeenCalledWith("2d");
    });
  });
});
