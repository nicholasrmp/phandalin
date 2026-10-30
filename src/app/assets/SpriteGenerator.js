/**
 * SpriteGenerator.js
 * Gerenciador de geração de sprites para Phandalin
 * Usa OpenArt API para criar sprites de personagens, inimigos e efeitos
 */

import { OpenArtClient } from "./OpenArtClient.js";

export class SpriteGenerator {
  /**
   * @param {OpenArtClient} client - Cliente OpenArt
   * @param {Object} [options] - Opções de configuração
   */
  constructor(client, options = {}) {
    this.client = client;
    this.defaultStyle = options.style || "pixel-art";
    this.defaultSize = options.size || { width: 64, height: 64 };
    this.cache = new Map();
  }

  /**
   * Configurações padrão para pixel art D&D
   * @private
   */
  _getPixelArtDefaults() {
    return {
      style: "pixel-art",
      negativePrompt:
        "blurry, 3d, realistic, photograph, smooth, antialiased, modern, high resolution",
      steps: 40,
      guidanceScale: 8.5,
    };
  }

  /**
   * Gera sprite de personagem jogável
   * @param {Object} params - Parâmetros do personagem
   * @param {string} params.race - Raça (human, elf, dwarf, etc)
   * @param {string} params.class - Classe (fighter, wizard, rogue, etc)
   * @param {string} [params.gender] - Gênero
   * @param {string} [params.equipment] - Equipamento
   * @param {string} [params.pose] - Pose (idle, attack, cast, etc)
   * @returns {Promise<Object>} Sprite gerado
   */
  async generatePlayerCharacter(params) {
    const cacheKey = `pc_${JSON.stringify(params)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const prompt = this._buildCharacterPrompt(params);
    const defaults = this._getPixelArtDefaults();

    const result = await this.client.generateImage({
      prompt,
      ...defaults,
      width: this.defaultSize.width,
      height: this.defaultSize.height,
      seed: params.seed,
    });

    // Aguarda conclusão
    const completed = await this.client.waitForCompletion(result.id);

    const sprite = {
      type: "player_character",
      params,
      url: completed.url,
      id: completed.id,
      seed: completed.seed,
    };

    this.cache.set(cacheKey, sprite);
    return sprite;
  }

  /**
   * Constrói prompt para personagem
   * @private
   */
  _buildCharacterPrompt(params) {
    const parts = [
      "pixel art sprite",
      "top-down view",
      "D&D fantasy character",
      params.race || "human",
      params.class || "adventurer",
      params.gender || "",
      params.equipment || "",
      params.pose || "idle stance",
      "transparent background",
      "64x64 pixels",
      "retro RPG style",
      "clear silhouette",
      "vibrant colors",
    ];

    return parts.filter(Boolean).join(", ");
  }

  /**
   * Gera sprite de inimigo/monstro
   * @param {Object} params - Parâmetros do monstro
   * @param {string} params.type - Tipo (goblin, dragon, skeleton, etc)
   * @param {string} [params.variant] - Variante (red, ice, shadow, etc)
   * @param {string} [params.size] - Tamanho (tiny, small, medium, large, huge)
   * @param {string} [params.pose] - Pose
   * @returns {Promise<Object>} Sprite gerado
   */
  async generateEnemy(params) {
    const cacheKey = `enemy_${JSON.stringify(params)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const prompt = this._buildEnemyPrompt(params);
    const defaults = this._getPixelArtDefaults();

    // Ajusta tamanho baseado no size do monstro
    const size = this._getEnemySize(params.size);

    const result = await this.client.generateImage({
      prompt,
      ...defaults,
      width: size.width,
      height: size.height,
      seed: params.seed,
    });

    const completed = await this.client.waitForCompletion(result.id);

    const sprite = {
      type: "enemy",
      params,
      url: completed.url,
      id: completed.id,
      seed: completed.seed,
      size,
    };

    this.cache.set(cacheKey, sprite);
    return sprite;
  }

  /**
   * Constrói prompt para inimigo
   * @private
   */
  _buildEnemyPrompt(params) {
    const parts = [
      "pixel art sprite",
      "top-down view",
      "D&D monster",
      params.type,
      params.variant || "",
      params.size ? `${params.size} size` : "",
      params.pose || "aggressive stance",
      "transparent background",
      "retro RPG style",
      "menacing appearance",
      "clear details",
    ];

    return parts.filter(Boolean).join(", ");
  }

  /**
   * Determina tamanho do sprite baseado no size do monstro
   * @private
   */
  _getEnemySize(size) {
    const sizes = {
      tiny: { width: 32, height: 32 },
      small: { width: 48, height: 48 },
      medium: { width: 64, height: 64 },
      large: { width: 96, height: 96 },
      huge: { width: 128, height: 128 },
      gargantuan: { width: 192, height: 192 },
    };

    return sizes[size] || sizes.medium;
  }

  /**
   * Gera efeito visual de magia
   * @param {Object} params - Parâmetros do efeito
   * @param {string} params.spellName - Nome da magia
   * @param {string} params.element - Elemento (fire, ice, lightning, etc)
   * @param {string} [params.shape] - Forma (projectile, area, beam, etc)
   * @param {number} [params.frames] - Número de frames de animação
   * @returns {Promise<Object>} Efeito gerado
   */
  async generateSpellEffect(params) {
    const cacheKey = `spell_${JSON.stringify(params)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const prompt = this._buildSpellPrompt(params);
    const defaults = this._getPixelArtDefaults();

    const result = await this.client.generateImage({
      prompt,
      ...defaults,
      width: 128,
      height: 128,
      seed: params.seed,
    });

    const completed = await this.client.waitForCompletion(result.id);

    // Se precisa de frames de animação, gera variações
    let frames = [completed.url];
    if (params.frames && params.frames > 1) {
      const variations = await this.client.generateVariations({
        imageUrl: completed.url,
        prompt: `${prompt}, animation frame`,
        count: params.frames - 1,
        strength: 0.3,
      });
      frames = [completed.url, ...variations.map((v) => v.url)];
    }

    const effect = {
      type: "spell_effect",
      params,
      frames,
      id: completed.id,
      seed: completed.seed,
    };

    this.cache.set(cacheKey, effect);
    return effect;
  }

  /**
   * Constrói prompt para efeito de magia
   * @private
   */
  _buildSpellPrompt(params) {
    const parts = [
      "pixel art effect",
      "D&D magic spell",
      params.spellName,
      params.element,
      params.shape || "magical effect",
      "transparent background",
      "glowing particles",
      "vibrant colors",
      "dynamic energy",
      "128x128 pixels",
      "retro game effect",
    ];

    return parts.filter(Boolean).join(", ");
  }

  /**
   * Gera tile de ambiente
   * @param {Object} params - Parâmetros do tile
   * @param {string} params.type - Tipo (floor, wall, door, etc)
   * @param {string} params.material - Material (stone, wood, grass, etc)
   * @param {string} [params.variant] - Variante
   * @returns {Promise<Object>} Tile gerado
   */
  async generateEnvironmentTile(params) {
    const cacheKey = `tile_${JSON.stringify(params)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const prompt = this._buildTilePrompt(params);
    const defaults = this._getPixelArtDefaults();

    const result = await this.client.generateImage({
      prompt,
      ...defaults,
      width: 64,
      height: 64,
      seed: params.seed,
    });

    const completed = await this.client.waitForCompletion(result.id);

    const tile = {
      type: "environment_tile",
      params,
      url: completed.url,
      id: completed.id,
      seed: completed.seed,
    };

    this.cache.set(cacheKey, tile);
    return tile;
  }

  /**
   * Constrói prompt para tile
   * @private
   */
  _buildTilePrompt(params) {
    const parts = [
      "pixel art tile",
      "top-down view",
      "seamless tileable",
      params.type,
      params.material,
      params.variant || "",
      "64x64 pixels",
      "retro RPG style",
      "clear texture",
      "consistent lighting",
    ];

    return parts.filter(Boolean).join(", ");
  }

  /**
   * Gera conjunto completo de sprites para um personagem
   * @param {Object} params - Parâmetros base
   * @param {Array<string>} poses - Lista de poses desejadas
   * @returns {Promise<Object>} Conjunto de sprites
   */
  async generateCharacterSet(
    params,
    poses = ["idle", "walk", "attack", "cast", "hurt", "death"],
  ) {
    const sprites = {};

    for (const pose of poses) {
      const sprite = await this.generatePlayerCharacter({
        ...params,
        pose,
      });
      sprites[pose] = sprite;
    }

    return {
      type: "character_set",
      params,
      sprites,
      poses,
    };
  }

  /**
   * Gera variações de cor de um sprite
   * @param {string} spriteUrl - URL do sprite base
   * @param {Array<string>} colors - Cores desejadas
   * @returns {Promise<Array>} Variações
   */
  async generateColorVariants(spriteUrl, colors) {
    const variants = [];

    for (const color of colors) {
      const variation = await this.client.generateVariations({
        imageUrl: spriteUrl,
        prompt: `recolor to ${color}, maintain pixel art style`,
        count: 1,
        strength: 0.5,
      });
      variants.push({
        color,
        url: variation[0].url,
      });
    }

    return variants;
  }

  /**
   * Gera sprite sheet de animação
   * @param {Object} params - Parâmetros
   * @param {number} params.frames - Número de frames
   * @param {string} params.animation - Tipo de animação
   * @returns {Promise<Object>} Sprite sheet
   */
  async generateSpriteSheet(params) {
    const baseSprite = await this.generatePlayerCharacter({
      ...params,
      pose: params.animation,
    });

    // Gera frames intermediários
    const frames = await this.client.generateVariations({
      imageUrl: baseSprite.url,
      prompt: `${params.animation} animation frame, pixel art`,
      count: params.frames - 1,
      strength: 0.4,
    });

    return {
      type: "sprite_sheet",
      baseUrl: baseSprite.url,
      frames: [baseSprite.url, ...frames.map((f) => f.url)],
      animation: params.animation,
      frameCount: params.frames,
    };
  }

  /**
   * Processa sprite para remover fundo
   * @param {string} spriteUrl - URL do sprite
   * @returns {Promise<Object>} Sprite sem fundo
   */
  async removeBackground(spriteUrl) {
    return await this.client.removeBackground(spriteUrl);
  }

  /**
   * Aumenta resolução de sprite
   * @param {string} spriteUrl - URL do sprite
   * @param {number} scale - Fator de escala
   * @returns {Promise<Object>} Sprite em alta resolução
   */
  async upscaleSprite(spriteUrl, scale = 2) {
    return await this.client.upscaleImage(spriteUrl, scale);
  }

  /**
   * Gera batch de inimigos para um encontro
   * @param {Array<Object>} enemies - Lista de inimigos
   * @returns {Promise<Array>} Sprites gerados
   */
  async generateEncounterEnemies(enemies) {
    const sprites = [];

    // Processa em paralelo
    const promises = enemies.map((enemy) => this.generateEnemy(enemy));
    const results = await Promise.all(promises);

    return results;
  }

  /**
   * Limpa cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Obtém estatísticas do cache
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}
