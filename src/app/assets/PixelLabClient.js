/**
 * PixelLabClient.js
 * Cliente para integração com PixelLab API v2
 * Especializado em criação de personagens, objetos e tilesets pixel art
 *
 * Documentação: https://api.pixellab.ai/v2/docs
 * OpenAPI Spec: https://api.pixellab.ai/v2/openapi.json
 *
 * ATUALIZADO: 2026-10-29 - Corrigido baseado na documentação oficial
 */

export class PixelLabClient {
  /**
   * @param {Object} config - Configuração do cliente
   * @param {string} config.apiKey - Chave da API PixelLab
   * @param {string} [config.baseUrl] - URL base da API
   * @param {number} [config.timeout] - Timeout em ms
   * @param {number} [config.maxRetries] - Máximo de tentativas
   */
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.PIXELLAB_API_KEY;
    this.baseUrl = config.baseUrl || "https://api.pixellab.ai/v2";
    this.timeout = config.timeout || 30000;
    this.maxRetries = config.maxRetries || 3;

    if (!this.apiKey) {
      throw new Error("PixelLab API key is required");
    }
  }

  /**
   * Faz requisição HTTP com retry automático
   * @private
   */
  async _request(endpoint, options = {}, retryCount = 0) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      ...options.headers,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          `PixelLab API error: ${response.status} - ${error.message || response.statusText}`,
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      // Retry em caso de erro de rede ou timeout
      if (retryCount < this.maxRetries && this._shouldRetry(error)) {
        await this._delay(Math.pow(2, retryCount) * 1000);
        return this._request(endpoint, options, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Verifica se deve fazer retry
   * @private
   */
  _shouldRetry(error) {
    return (
      error.name === "AbortError" ||
      error.message.includes("network") ||
      error.message.includes("timeout")
    );
  }

  /**
   * Delay para retry
   * @private
   */
  _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ============================================================================
  // MÉTODOS CORRIGIDOS - FASE 1 (CRÍTICOS)
  // ============================================================================

  /**
   * Cria um personagem com 8 direções usando v3 (CORRIGIDO)
   * @param {Object} params
   * @param {string} params.description - Descrição do personagem (1-2000 chars)
   * @param {Object} [params.reference_image] - Imagem de referência (sul)
   * @param {Object} [params.direction_images] - Imagens por direção
   * @param {4|8} [params.n_directions=8] - Número de direções
   * @param {Object} [params.image_size] - Tamanho do frame
   * @param {string} [params.view="low top-down"] - Ângulo da câmera
   * @param {string} [params.template_id="mannequin"] - Tipo de corpo
   * @param {string} [params.name] - Nome de exibição
   * @param {number} [params.seed] - Seed para reprodutibilidade
   * @param {boolean} [params.no_background=true] - Fundo transparente
   * @param {string} [params.outline] - Estilo de contorno
   * @param {string} [params.detail] - Nível de detalhe
   * @param {boolean} [params.enhance_prompt=false] - Expandir descrição
   * @returns {Promise<Object>} { characterId, jobId, directionsCount, status }
   */
  async createCharacterV3(params) {
    const payload = {
      description: params.description,
      n_directions: params.n_directions || 8,
      view: params.view || "low top-down",
      template_id: params.template_id || "mannequin",
      no_background: params.no_background !== false,
      enhance_prompt: params.enhance_prompt || false,
    };

    // Adicionar campos opcionais
    if (params.reference_image)
      payload.reference_image = params.reference_image;
    if (params.direction_images)
      payload.direction_images = params.direction_images;
    if (params.image_size) payload.image_size = params.image_size;
    if (params.name) payload.name = params.name;
    if (params.seed !== undefined) payload.seed = params.seed;
    if (params.outline) payload.outline = params.outline;
    if (params.detail) payload.detail = params.detail;

    const result = await this._request("/create-character-v3", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      characterId: result.character_id,
      jobId: result.background_job_id,
      directionsCount: result.directions_count,
      status: result.status,
    };
  }

  /**
   * Wrapper para compatibilidade (deprecated)
   * @deprecated Use createCharacterV3() instead
   */
  async createCharacter(params) {
    console.warn("createCharacter() is deprecated, use createCharacterV3()");
    // Mapear parâmetros antigos para novos
    const newParams = {
      description: params.description,
      image_size: params.size
        ? { width: params.size, height: params.size }
        : undefined,
      no_background: true,
    };
    return this.createCharacterV3(newParams);
  }

  /**
   * Cria um objeto de 1 direção (CORRIGIDO)
   * @param {Object} params
   * @param {string} params.description - Descrição do objeto (1-2000 chars)
   * @param {number} [params.size=64] - Tamanho em pixels (16-256)
   * @param {string} [params.view="top-down"] - Vista (top-down | sidescroller)
   * @param {Array<Object>} [params.style_images] - Imagens de referência de estilo
   * @param {Array<string>} [params.item_descriptions] - Descrições por objeto
   * @param {Object} [params.target_palette] - Paleta de cores
   * @returns {Promise<Object>} { objectId, jobId, status }
   */
  async createObject1Direction(params) {
    const payload = {
      description: params.description,
      size: params.size || 64,
      view: params.view || "top-down",
    };

    if (params.style_images) payload.style_images = params.style_images;
    if (params.item_descriptions)
      payload.item_descriptions = params.item_descriptions;
    if (params.target_palette) payload.target_palette = params.target_palette;

    const result = await this._request("/create-1-direction-object", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      objectId: result.object_id,
      jobId: result.background_job_id,
      status: result.status,
    };
  }

  /**
   * Cria um objeto com 8 direções (NOVO)
   * @param {Object} params
   * @param {string} params.description - Descrição do objeto
   * @param {number} [params.size=64] - Tamanho (24-168)
   * @param {string} [params.view="low top-down"] - Ângulo da câmera
   * @param {Object} [params.reference_image] - Imagem de referência
   * @param {Object} [params.style_image] - Imagem de estilo
   * @param {string} [params.style_object_id] - ID de objeto para estilo
   * @param {Object} [params.target_palette] - Paleta de cores
   * @returns {Promise<Object>} { objectId, jobId, status }
   */
  async createObject8Directions(params) {
    const payload = {
      description: params.description,
      size: params.size || 64,
      view: params.view || "low top-down",
    };

    if (params.reference_image)
      payload.reference_image = params.reference_image;
    if (params.style_image) payload.style_image = params.style_image;
    if (params.style_object_id)
      payload.style_object_id = params.style_object_id;
    if (params.target_palette) payload.target_palette = params.target_palette;

    const result = await this._request("/create-8-direction-object", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      objectId: result.object_id,
      jobId: result.background_job_id,
      status: result.status,
    };
  }

  /**
   * Wrapper para compatibilidade (deprecated)
   * @deprecated Use createObject1Direction() or createObject8Directions() instead
   */
  async createObject(params) {
    console.warn(
      "createObject() is deprecated, use createObject1Direction() or createObject8Directions()",
    );
    return this.createObject1Direction(params);
  }

  /**
   * Anima um sprite usando texto v3 (CORRIGIDO)
   * @param {Object} params
   * @param {Object} params.first_frame - Primeiro frame (obrigatório)
   * @param {Object} [params.last_frame] - Último frame (interpolação)
   * @param {string} params.action - Descrição da ação (1-1000 chars)
   * @param {number} [params.frame_count=8] - Número de frames (4-16, par)
   * @param {number} [params.seed=0] - Seed para reprodutibilidade
   * @param {boolean} [params.no_background] - Fundo transparente
   * @param {number} [params.drift_threshold] - Sensibilidade de de-flicker
   * @param {boolean} [params.enhance_prompt=false] - Expandir descrição
   * @returns {Promise<Object>} { jobId, status }
   */
  async animateWithTextV3(params) {
    const payload = {
      first_frame: params.first_frame,
      action: params.action,
      frame_count: params.frame_count || 8,
      seed: params.seed || 0,
      enhance_prompt: params.enhance_prompt || false,
    };

    if (params.last_frame) payload.last_frame = params.last_frame;
    if (params.no_background !== undefined)
      payload.no_background = params.no_background;
    if (params.drift_threshold !== undefined)
      payload.drift_threshold = params.drift_threshold;

    const result = await this._request("/animate-with-text-v3", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      jobId: result.background_job_id,
      status: result.status,
    };
  }

  /**
   * Wrapper para compatibilidade (deprecated)
   * @deprecated Use animateWithTextV3() instead
   */
  async createAnimation(params) {
    console.warn("createAnimation() is deprecated, use animateWithTextV3()");
    // Nota: spriteUrl precisa ser convertido para Base64Image
    return this.animateWithTextV3({
      first_frame: { type: "base64", base64: params.spriteUrl },
      action: params.animations ? params.animations.join(", ") : "idle",
      frame_count: params.frames || 4,
    });
  }

  /**
   * Verifica status de um job em background (CORRIGIDO)
   * @param {string} jobId - ID do job
   * @returns {Promise<Object>} Status atual
   */
  async getStatus(jobId) {
    const result = await this._request(`/background-jobs/${jobId}`);

    return {
      id: jobId,
      status: result.status, // "processing" | "completed" | "failed"
      progress: result.progress || 0,
      lastResponse: result.last_response,
      usage: result.usage,
      error: result.error,
      createdAt: result.created_at,
    };
  }

  /**
   * Aguarda conclusão de uma geração (ATUALIZADO)
   * @param {string} jobId - ID do job
   * @param {number} [pollInterval] - Intervalo de polling em ms
   * @returns {Promise<Object>} Resultado final
   */
  async waitForCompletion(jobId, pollInterval = 2000) {
    let attempts = 0;
    const maxAttempts = 60;

    while (attempts < maxAttempts) {
      const status = await this.getStatus(jobId);

      if (status.status === "completed") {
        return status.lastResponse;
      }

      if (status.status === "failed") {
        throw new Error(`Generation failed: ${status.error}`);
      }

      await this._delay(pollInterval);
      attempts++;
    }

    throw new Error("Generation timeout: exceeded maximum wait time");
  }

  // ============================================================================
  // MÉTODOS CORRIGIDOS - FASE 2 (IMPORTANTES)
  // ============================================================================

  /**
   * Cria um tileset top-down (CORRIGIDO)
   * @param {Object} params
   * @param {string} params.lower_description - Terreno inferior (obrigatório)
   * @param {string} params.upper_description - Terreno superior (obrigatório)
   * @param {string} [params.transition_description] - Descrição da transição
   * @param {Object} [params.tile_size={ width: 16, height: 16 }] - Tamanho do tile
   * @param {string} [params.mode="standard"] - Pipeline (standard | pro)
   * @param {string} [params.shape_style] - Geometria (square | round)
   * @param {number} [params.transition_size=0.0] - Tamanho da transição (0.0-1.0)
   * @param {string} [params.view="high top-down"] - Ângulo da câmera
   * @param {string} [params.shading] - Estilo de sombreamento
   * @param {string} [params.detail] - Nível de detalhe
   * @param {Object} [params.target_palette] - Paleta de cores
   * @param {number} [params.seed] - Seed para reprodutibilidade
   * @returns {Promise<Object>} { tilesetId, jobId, status }
   */
  async createTileset(params) {
    const payload = {
      lower_description: params.lower_description,
      upper_description: params.upper_description,
      tile_size: params.tile_size || { width: 16, height: 16 },
      mode: params.mode || "standard",
      transition_size: params.transition_size || 0.0,
      view: params.view || "high top-down",
    };

    if (params.transition_description)
      payload.transition_description = params.transition_description;
    if (params.shape_style) payload.shape_style = params.shape_style;
    if (params.shading) payload.shading = params.shading;
    if (params.detail) payload.detail = params.detail;
    if (params.target_palette) payload.target_palette = params.target_palette;
    if (params.seed !== undefined) payload.seed = params.seed;

    const result = await this._request("/create-tileset", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      tilesetId: result.tileset_id,
      jobId: result.background_job_id,
      status: result.status,
    };
  }

  /**
   * Reduz cores de imagens para paleta compartilhada (CORRIGIDO)
   * @param {Object} params
   * @param {Array<Object>} params.images - Imagens a quantizar (min 1)
   * @param {number} [params.num_colors] - Número alvo de cores
   * @param {Object} [params.palette_image] - Imagem com paleta
   * @param {string} [params.dithering="none"] - Matriz de dithering
   * @param {number} [params.dithering_strength=5.0] - Força do dithering (0.0-10.0)
   * @returns {Promise<Object>} Imagens quantizadas
   */
  async reduceColors(params) {
    const payload = {
      images: params.images,
      dithering: params.dithering || "none",
      dithering_strength: params.dithering_strength || 5.0,
    };

    if (params.num_colors) payload.num_colors = params.num_colors;
    if (params.palette_image) payload.palette_image = params.palette_image;

    const result = await this._request("/reduce-colors", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      images: result.images,
      palette: result.palette,
      colorCount: result.color_count,
    };
  }

  /**
   * Wrapper para compatibilidade (deprecated)
   * @deprecated Use reduceColors() instead
   */
  async optimizePalette(imageUrl, maxColors = 16) {
    console.warn("optimizePalette() is deprecated, use reduceColors()");
    return this.reduceColors({
      images: [{ type: "base64", base64: imageUrl }],
      num_colors: maxColors,
    });
  }

  /**
   * Cria efeito visual (VFX) (CORRIGIDO)
   * @param {Object} params
   * @param {string} params.description - Descrição do efeito (1-8000 chars)
   * @param {Object} [params.sprite] - Sprite base (max 512x512)
   * @param {number} [params.sprite_frames=1] - Frames no sprite (1-32)
   * @param {number} [params.sprite_fps] - FPS do sprite
   * @param {string} [params.artist="lite"] - Artista (lite | pro)
   * @param {string} [params.effect_id] - ID para editar efeito existente
   * @param {string} [params.conversation] - Conversa anterior
   * @param {string} [params.name] - Nome do efeito
   * @param {boolean} [params.game_pack=false] - Gerar game pack ZIP
   * @returns {Promise<Object>} { jobId, effectId, status, quotedGenerations }
   */
  async createVFX(params) {
    const payload = {
      description: params.description,
      sprite_frames: params.sprite_frames || 1,
      artist: params.artist || "lite",
      game_pack: params.game_pack || false,
    };

    if (params.sprite) payload.sprite = params.sprite;
    if (params.sprite_fps) payload.sprite_fps = params.sprite_fps;
    if (params.effect_id) payload.effect_id = params.effect_id;
    if (params.conversation) payload.conversation = params.conversation;
    if (params.name) payload.name = params.name;

    const result = await this._request("/vfx", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      jobId: result.background_job_id,
      effectId: result.effect_id,
      status: result.status,
      quotedGenerations: result.quoted_generations,
    };
  }

  /**
   * Wrapper para compatibilidade (deprecated)
   * @deprecated Use createVFX() instead
   */
  async createParticleEffect(params) {
    console.warn("createParticleEffect() is deprecated, use createVFX()");
    return this.createVFX({
      description: `${params.type} effect with ${params.color || "auto"} color`,
      artist: "lite",
    });
  }

  /**
   * Redimensiona pixel art mantendo estética (CORRIGIDO)
   * @param {Object} params
   * @param {string} params.description - Descrição do personagem (1-2000 chars)
   * @param {Object} params.reference_image - Imagem de referência
   * @param {Object} params.reference_image_size - Tamanho da referência
   * @param {Object} params.target_size - Tamanho alvo
   * @param {string} [params.view] - Ângulo da câmera
   * @param {string} [params.direction] - Direção
   * @param {boolean} [params.isometric=false] - Vista isométrica
   * @param {boolean} [params.no_background=false] - Fundo transparente
   * @param {Object} [params.color_image] - Paleta forçada
   * @param {Object} [params.init_image] - Imagem inicial
   * @param {number} [params.init_image_strength=150.0] - Força da imagem inicial
   * @param {number} [params.seed] - Seed para reprodutibilidade
   * @returns {Promise<Object>} Imagem redimensionada
   */
  async resizeSprite(params) {
    const payload = {
      description: params.description,
      reference_image: params.reference_image,
      reference_image_size: params.reference_image_size,
      target_size: params.target_size,
      isometric: params.isometric || false,
      no_background: params.no_background || false,
      init_image_strength: params.init_image_strength || 150.0,
    };

    if (params.view) payload.view = params.view;
    if (params.direction) payload.direction = params.direction;
    if (params.color_image) payload.color_image = params.color_image;
    if (params.init_image) payload.init_image = params.init_image;
    if (params.seed !== undefined) payload.seed = params.seed;

    const result = await this._request("/resize", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      image: result.image,
      usage: result.usage,
    };
  }

  /**
   * Obtém saldo da conta (CORRIGIDO)
   * @returns {Promise<Object>} Saldo e gerações
   */
  async getBalance() {
    const result = await this._request("/balance");

    return {
      credits: {
        usd: result.credits?.usd || 0,
        used: result.credits?.used || 0,
        limit: result.credits?.limit || 0,
      },
      subscription: {
        generations: result.subscription?.generations || 0,
        total: result.subscription?.total || 0,
        resetDate: result.subscription?.reset_date,
      },
    };
  }

  /**
   * Wrapper para compatibilidade (deprecated)
   * @deprecated Use getBalance() instead
   */
  async getUsage() {
    console.warn("getUsage() is deprecated, use getBalance()");
    const balance = await this.getBalance();
    return {
      credits: balance.subscription.generations,
      used: balance.subscription.total - balance.subscription.generations,
      limit: balance.subscription.total,
      resetDate: balance.subscription.resetDate,
    };
  }

  // ============================================================================
  // MÉTODOS NOVOS - FASE 3 (MELHORIAS)
  // ============================================================================

  /**
   * Lista personagens do usuário (NOVO)
   * @param {number} [limit=50] - Máximo de resultados
   * @param {number} [offset=0] - Offset para paginação
   * @returns {Promise<Object>} Lista de personagens
   */
  async listCharacters(limit = 50, offset = 0) {
    const queryParams = new URLSearchParams({ limit, offset }).toString();
    const result = await this._request(`/characters?${queryParams}`);
    return result;
  }

  /**
   * Obtém detalhes de um personagem (NOVO)
   * @param {string} characterId - ID do personagem
   * @returns {Promise<Object>} Detalhes do personagem
   */
  async getCharacter(characterId) {
    return await this._request(`/characters/${characterId}`);
  }

  /**
   * Deleta um personagem (NOVO)
   * @param {string} characterId - ID do personagem
   * @returns {Promise<Object>} Resultado da deleção
   */
  async deleteCharacter(characterId) {
    return await this._request(`/characters/${characterId}`, {
      method: "DELETE",
    });
  }

  /**
   * Lista objetos do usuário (NOVO)
   * @param {number} [limit=50] - Máximo de resultados
   * @param {number} [offset=0] - Offset para paginação
   * @returns {Promise<Object>} Lista de objetos
   */
  async listObjects(limit = 50, offset = 0) {
    const queryParams = new URLSearchParams({ limit, offset }).toString();
    const result = await this._request(`/objects?${queryParams}`);
    return result;
  }

  /**
   * Obtém detalhes de um objeto (NOVO)
   * @param {string} objectId - ID do objeto
   * @returns {Promise<Object>} Detalhes do objeto
   */
  async getObject(objectId) {
    return await this._request(`/objects/${objectId}`);
  }

  /**
   * Deleta um objeto (NOVO)
   * @param {string} objectId - ID do objeto
   * @returns {Promise<Object>} Resultado da deleção
   */
  async deleteObject(objectId) {
    return await this._request(`/objects/${objectId}`, {
      method: "DELETE",
    });
  }

  /**
   * Lista tilesets do usuário (NOVO)
   * @param {number} [limit=50] - Máximo de resultados
   * @param {number} [offset=0] - Offset para paginação
   * @returns {Promise<Object>} Lista de tilesets
   */
  async listTilesets(limit = 50, offset = 0) {
    const queryParams = new URLSearchParams({ limit, offset }).toString();
    const result = await this._request(`/tilesets?${queryParams}`);
    return result;
  }

  /**
   * Obtém detalhes de um tileset (NOVO)
   * @param {string} tilesetId - ID do tileset
   * @returns {Promise<Object>} Detalhes do tileset
   */
  async getTileset(tilesetId) {
    return await this._request(`/tilesets/${tilesetId}`);
  }

  /**
   * Deleta um tileset (NOVO)
   * @param {string} tilesetId - ID do tileset
   * @returns {Promise<Object>} Resultado da deleção
   */
  async deleteTileset(tilesetId) {
    return await this._request(`/tilesets/${tilesetId}`, {
      method: "DELETE",
    });
  }

  /**
   * Cancela um job em background (NOVO)
   * @param {string} jobId - ID do job
   * @returns {Promise<Object>} Resultado do cancelamento
   */
  async cancelJob(jobId) {
    return await this._request(`/background-jobs/${jobId}`, {
      method: "DELETE",
    });
  }

  // ============================================================================
  // MÉTODOS REMOVIDOS (não existem na API real)
  // ============================================================================

  /**
   * @deprecated Método removido - não existe na API real
   * Use métodos específicos por tipo de asset
   */
  async generateVariations() {
    throw new Error(
      "generateVariations() was removed - use specific methods:\n" +
        "- For characters: createCharacterState()\n" +
        "- For objects: createObjectState()\n" +
        "- For images: generateWithStyleV2()",
    );
  }

  /**
   * @deprecated Método removido - não existe na API real
   * Crie assets individuais e combine-os manualmente
   */
  async createGameAssetPack() {
    throw new Error(
      "createGameAssetPack() was removed - not available in API.\n" +
        "Create individual assets and combine them manually.",
    );
  }

  /**
   * @deprecated Método removido - use métodos específicos
   * Use listCharacters(), listObjects(), ou listTilesets()
   */
  async listAssets() {
    throw new Error(
      "listAssets() was removed - use specific methods:\n" +
        "- listCharacters()\n" +
        "- listObjects()\n" +
        "- listTilesets()",
    );
  }
}
