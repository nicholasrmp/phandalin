/**
 * AssetManager.js
 * Gerenciador de assets para Phandalin
 * Controla cache, download, organização e carregamento de sprites
 */

export class AssetManager {
  /**
   * @param {Object} options - Opções de configuração
   * @param {string} [options.basePath] - Caminho base para assets
   * @param {boolean} [options.useIndexedDB] - Usar IndexedDB para cache
   * @param {number} [options.maxCacheSize] - Tamanho máximo do cache em MB
   */
  constructor(options = {}) {
    this.basePath = options.basePath || "/assets";
    this.useIndexedDB = options.useIndexedDB !== false;
    this.maxCacheSize = (options.maxCacheSize || 50) * 1024 * 1024; // MB para bytes

    this.memoryCache = new Map();
    this.loadingPromises = new Map();
    this.cacheSize = 0;

    if (this.useIndexedDB) {
      this._initIndexedDB();
    }
  }

  /**
   * Inicializa IndexedDB para cache persistente
   * @private
   */
  async _initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("PhandalinAssets", 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains("sprites")) {
          const store = db.createObjectStore("sprites", { keyPath: "id" });
          store.createIndex("type", "type", { unique: false });
          store.createIndex("timestamp", "timestamp", { unique: false });
        }
      };
    });
  }

  /**
   * Salva asset no cache
   * @param {string} id - ID único do asset
   * @param {Object} data - Dados do asset
   * @param {string} data.url - URL da imagem
   * @param {string} data.type - Tipo do asset
   * @param {Object} [data.metadata] - Metadados adicionais
   */
  async saveAsset(id, data) {
    const asset = {
      id,
      url: data.url,
      type: data.type,
      metadata: data.metadata || {},
      timestamp: Date.now(),
    };

    // Salva em memória
    this.memoryCache.set(id, asset);

    // Salva no IndexedDB se disponível
    if (this.db) {
      await this._saveToIndexedDB(asset);
    }

    // Baixa e converte para blob
    await this._downloadAndCache(id, data.url);

    return asset;
  }

  /**
   * Salva no IndexedDB
   * @private
   */
  async _saveToIndexedDB(asset) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["sprites"], "readwrite");
      const store = transaction.objectStore("sprites");
      const request = store.put(asset);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Baixa imagem e armazena como blob
   * @private
   */
  async _downloadAndCache(id, url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      // Atualiza cache com blob URL
      const asset = this.memoryCache.get(id);
      if (asset) {
        asset.blobUrl = blobUrl;
        asset.blob = blob;
        asset.size = blob.size;
        this.cacheSize += blob.size;
      }

      // Verifica limite de cache
      await this._checkCacheSize();

      return blobUrl;
    } catch (error) {
      console.error(`Failed to download asset ${id}:`, error);
      throw error;
    }
  }

  /**
   * Verifica e limpa cache se necessário
   * @private
   */
  async _checkCacheSize() {
    if (this.cacheSize <= this.maxCacheSize) return;

    // Ordena por timestamp (mais antigos primeiro)
    const entries = Array.from(this.memoryCache.entries()).sort(
      (a, b) => a[1].timestamp - b[1].timestamp,
    );

    // Remove assets antigos até ficar abaixo do limite
    for (const [id, asset] of entries) {
      if (this.cacheSize <= this.maxCacheSize * 0.8) break;

      await this.removeAsset(id);
    }
  }

  /**
   * Carrega asset do cache
   * @param {string} id - ID do asset
   * @returns {Promise<Object|null>} Asset ou null se não encontrado
   */
  async loadAsset(id) {
    // Verifica memória primeiro
    if (this.memoryCache.has(id)) {
      return this.memoryCache.get(id);
    }

    // Verifica IndexedDB
    if (this.db) {
      const asset = await this._loadFromIndexedDB(id);
      if (asset) {
        this.memoryCache.set(id, asset);

        // Recarrega blob se necessário
        if (!asset.blobUrl && asset.url) {
          await this._downloadAndCache(id, asset.url);
        }

        return asset;
      }
    }

    return null;
  }

  /**
   * Carrega do IndexedDB
   * @private
   */
  async _loadFromIndexedDB(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["sprites"], "readonly");
      const store = transaction.objectStore("sprites");
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Carrega imagem como HTMLImageElement
   * @param {string} id - ID do asset
   * @returns {Promise<HTMLImageElement>} Imagem carregada
   */
  async loadImage(id) {
    // Evita carregar múltiplas vezes
    if (this.loadingPromises.has(id)) {
      return this.loadingPromises.get(id);
    }

    const promise = this._loadImageInternal(id);
    this.loadingPromises.set(id, promise);

    try {
      const img = await promise;
      return img;
    } finally {
      this.loadingPromises.delete(id);
    }
  }

  /**
   * Carrega imagem internamente
   * @private
   */
  async _loadImageInternal(id) {
    const asset = await this.loadAsset(id);
    if (!asset) {
      throw new Error(`Asset not found: ${id}`);
    }

    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${id}`));

      // Usa blob URL se disponível, senão URL original
      img.src = asset.blobUrl || asset.url;
    });
  }

  /**
   * Pré-carrega múltiplos assets
   * @param {Array<string>} ids - IDs dos assets
   * @returns {Promise<Array>} Assets carregados
   */
  async preloadAssets(ids) {
    const promises = ids.map((id) => this.loadImage(id));
    return Promise.all(promises);
  }

  /**
   * Remove asset do cache
   * @param {string} id - ID do asset
   */
  async removeAsset(id) {
    const asset = this.memoryCache.get(id);

    if (asset) {
      // Libera blob URL
      if (asset.blobUrl) {
        URL.revokeObjectURL(asset.blobUrl);
      }

      // Atualiza tamanho do cache
      if (asset.size) {
        this.cacheSize -= asset.size;
      }

      this.memoryCache.delete(id);
    }

    // Remove do IndexedDB
    if (this.db) {
      await this._removeFromIndexedDB(id);
    }
  }

  /**
   * Remove do IndexedDB
   * @private
   */
  async _removeFromIndexedDB(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["sprites"], "readwrite");
      const store = transaction.objectStore("sprites");
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Lista assets por tipo
   * @param {string} type - Tipo de asset
   * @returns {Promise<Array>} Lista de assets
   */
  async listAssetsByType(type) {
    const assets = [];

    // Memória
    for (const [id, asset] of this.memoryCache.entries()) {
      if (asset.type === type) {
        assets.push(asset);
      }
    }

    // IndexedDB
    if (this.db) {
      const dbAssets = await this._listFromIndexedDB(type);

      // Adiciona apenas os que não estão em memória
      for (const asset of dbAssets) {
        if (!this.memoryCache.has(asset.id)) {
          assets.push(asset);
        }
      }
    }

    return assets;
  }

  /**
   * Lista do IndexedDB por tipo
   * @private
   */
  async _listFromIndexedDB(type) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["sprites"], "readonly");
      const store = transaction.objectStore("sprites");
      const index = store.index("type");
      const request = index.getAll(type);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Organiza assets em estrutura de diretórios
   * @param {Object} asset - Asset para organizar
   * @returns {string} Caminho do arquivo
   */
  getAssetPath(asset) {
    const paths = {
      player_character: "characters/players",
      enemy: "characters/enemies",
      spell_effect: "effects/spells",
      environment_tile: "environment/tiles",
      item: "items",
      ui: "ui",
    };

    const dir = paths[asset.type] || "misc";
    return `${this.basePath}/${dir}/${asset.id}.png`;
  }

  /**
   * Exporta asset para download
   * @param {string} id - ID do asset
   * @param {string} [filename] - Nome do arquivo
   */
  async exportAsset(id, filename) {
    const asset = await this.loadAsset(id);
    if (!asset) {
      throw new Error(`Asset not found: ${id}`);
    }

    const blob = asset.blob || (await fetch(asset.url).then((r) => r.blob()));
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename || `${id}.png`;
    a.click();

    URL.revokeObjectURL(url);
  }

  /**
   * Exporta múltiplos assets como ZIP
   * @param {Array<string>} ids - IDs dos assets
   * @param {string} zipName - Nome do arquivo ZIP
   */
  async exportAssetsAsZip(ids, zipName = "phandalin-assets.zip") {
    // Nota: Requer biblioteca JSZip
    // Implementação básica - pode ser expandida
    console.warn("ZIP export requires JSZip library");

    // Por enquanto, exporta individualmente
    for (const id of ids) {
      await this.exportAsset(id);
    }
  }

  /**
   * Limpa todo o cache
   */
  async clearCache() {
    // Libera blob URLs
    for (const [id, asset] of this.memoryCache.entries()) {
      if (asset.blobUrl) {
        URL.revokeObjectURL(asset.blobUrl);
      }
    }

    this.memoryCache.clear();
    this.cacheSize = 0;

    // Limpa IndexedDB
    if (this.db) {
      await this._clearIndexedDB();
    }
  }

  /**
   * Limpa IndexedDB
   * @private
   */
  async _clearIndexedDB() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["sprites"], "readwrite");
      const store = transaction.objectStore("sprites");
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Obtém estatísticas do cache
   */
  getCacheStats() {
    return {
      memoryCount: this.memoryCache.size,
      totalSize: this.cacheSize,
      maxSize: this.maxCacheSize,
      usagePercent: ((this.cacheSize / this.maxCacheSize) * 100).toFixed(2),
      hasIndexedDB: !!this.db,
    };
  }

  /**
   * Valida integridade de um asset
   * @param {string} id - ID do asset
   * @returns {Promise<boolean>} True se válido
   */
  async validateAsset(id) {
    try {
      const asset = await this.loadAsset(id);
      if (!asset) return false;

      // Tenta carregar a imagem
      await this.loadImage(id);
      return true;
    } catch (error) {
      console.error(`Asset validation failed for ${id}:`, error);
      return false;
    }
  }

  /**
   * Cria sprite sheet a partir de múltiplos assets
   * @param {Array<string>} ids - IDs dos assets
   * @param {Object} options - Opções do sprite sheet
   * @returns {Promise<HTMLCanvasElement>} Canvas com sprite sheet
   */
  async createSpriteSheet(ids, options = {}) {
    const images = await Promise.all(ids.map((id) => this.loadImage(id)));

    const cols = options.cols || Math.ceil(Math.sqrt(ids.length));
    const rows = Math.ceil(ids.length / cols);
    const spriteWidth = options.spriteWidth || 64;
    const spriteHeight = options.spriteHeight || 64;

    const canvas = document.createElement("canvas");
    canvas.width = cols * spriteWidth;
    canvas.height = rows * spriteHeight;

    const ctx = canvas.getContext("2d");

    images.forEach((img, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = col * spriteWidth;
      const y = row * spriteHeight;

      ctx.drawImage(img, x, y, spriteWidth, spriteHeight);
    });

    return canvas;
  }
}
