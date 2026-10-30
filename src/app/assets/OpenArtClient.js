/**
 * OpenArtClient.js
 * Cliente para integração com OpenArt API
 * Gerencia autenticação, requisições e tratamento de erros
 */

export class OpenArtClient {
  /**
   * @param {Object} config - Configuração do cliente
   * @param {string} config.apiKey - Chave da API OpenArt
   * @param {string} [config.baseUrl] - URL base da API
   * @param {number} [config.timeout] - Timeout em ms
   * @param {number} [config.maxRetries] - Máximo de tentativas
   */
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.OPENART_API_KEY;
    this.baseUrl = config.baseUrl || "https://api.openart.ai/v1";
    this.timeout = config.timeout || 30000;
    this.maxRetries = config.maxRetries || 3;

    if (!this.apiKey) {
      throw new Error("OpenArt API key is required");
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
          `OpenArt API error: ${response.status} - ${error.message || response.statusText}`,
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

  /**
   * Gera uma imagem usando text-to-image
   * @param {Object} params - Parâmetros de geração
   * @param {string} params.prompt - Prompt descritivo
   * @param {string} [params.negativePrompt] - Prompt negativo
   * @param {string} [params.style] - Estilo (pixel-art, anime, etc)
   * @param {number} [params.width] - Largura (padrão: 512)
   * @param {number} [params.height] - Altura (padrão: 512)
   * @param {number} [params.steps] - Passos de inferência (padrão: 30)
   * @param {number} [params.guidanceScale] - Escala de guidance (padrão: 7.5)
   * @param {number} [params.seed] - Seed para reprodutibilidade
   * @returns {Promise<Object>} Resultado com URL da imagem
   */
  async generateImage(params) {
    const payload = {
      prompt: params.prompt,
      negative_prompt:
        params.negativePrompt || "blurry, low quality, distorted",
      style: params.style || "pixel-art",
      width: params.width || 512,
      height: params.height || 512,
      num_inference_steps: params.steps || 30,
      guidance_scale: params.guidanceScale || 7.5,
      seed: params.seed || Math.floor(Math.random() * 1000000),
    };

    const result = await this._request("/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      id: result.id,
      url: result.output_url,
      seed: result.seed,
      prompt: params.prompt,
      status: result.status,
    };
  }

  /**
   * Gera variações de uma imagem existente
   * @param {Object} params - Parâmetros
   * @param {string} params.imageUrl - URL da imagem base
   * @param {string} params.prompt - Prompt para variação
   * @param {number} [params.strength] - Força da variação (0-1)
   * @param {number} [params.count] - Número de variações
   * @returns {Promise<Array>} Array de variações
   */
  async generateVariations(params) {
    const payload = {
      image_url: params.imageUrl,
      prompt: params.prompt,
      strength: params.strength || 0.7,
      num_outputs: params.count || 4,
    };

    const result = await this._request("/variations", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return result.outputs.map((output, index) => ({
      id: `${result.id}_${index}`,
      url: output.url,
      prompt: params.prompt,
    }));
  }

  /**
   * Remove fundo de uma imagem
   * @param {string} imageUrl - URL da imagem
   * @returns {Promise<Object>} Imagem sem fundo
   */
  async removeBackground(imageUrl) {
    const result = await this._request("/remove-background", {
      method: "POST",
      body: JSON.stringify({ image_url: imageUrl }),
    });

    return {
      id: result.id,
      url: result.output_url,
      originalUrl: imageUrl,
    };
  }

  /**
   * Upscale de imagem (aumentar resolução)
   * @param {string} imageUrl - URL da imagem
   * @param {number} [scale] - Fator de escala (2 ou 4)
   * @returns {Promise<Object>} Imagem em alta resolução
   */
  async upscaleImage(imageUrl, scale = 2) {
    const result = await this._request("/upscale", {
      method: "POST",
      body: JSON.stringify({
        image_url: imageUrl,
        scale: scale,
      }),
    });

    return {
      id: result.id,
      url: result.output_url,
      scale: scale,
      originalUrl: imageUrl,
    };
  }

  /**
   * Verifica status de uma geração
   * @param {string} generationId - ID da geração
   * @returns {Promise<Object>} Status atual
   */
  async getStatus(generationId) {
    const result = await this._request(`/status/${generationId}`);

    return {
      id: generationId,
      status: result.status, // 'pending', 'processing', 'completed', 'failed'
      progress: result.progress || 0,
      url: result.output_url,
      error: result.error,
    };
  }

  /**
   * Aguarda conclusão de uma geração
   * @param {string} generationId - ID da geração
   * @param {number} [pollInterval] - Intervalo de polling em ms
   * @returns {Promise<Object>} Resultado final
   */
  async waitForCompletion(generationId, pollInterval = 2000) {
    let attempts = 0;
    const maxAttempts = 60; // 2 minutos máximo

    while (attempts < maxAttempts) {
      const status = await this.getStatus(generationId);

      if (status.status === "completed") {
        return status;
      }

      if (status.status === "failed") {
        throw new Error(`Generation failed: ${status.error}`);
      }

      await this._delay(pollInterval);
      attempts++;
    }

    throw new Error("Generation timeout: exceeded maximum wait time");
  }

  /**
   * Gera batch de imagens
   * @param {Array<Object>} prompts - Array de configurações
   * @returns {Promise<Array>} Resultados
   */
  async generateBatch(prompts) {
    const results = [];

    // Processa em paralelo (máximo 5 por vez)
    const batchSize = 5;
    for (let i = 0; i < prompts.length; i += batchSize) {
      const batch = prompts.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((params) => this.generateImage(params)),
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Lista modelos disponíveis
   * @returns {Promise<Array>} Lista de modelos
   */
  async listModels() {
    const result = await this._request("/models");
    return result.models;
  }

  /**
   * Obtém informações de uso da API
   * @returns {Promise<Object>} Estatísticas de uso
   */
  async getUsage() {
    const result = await this._request("/usage");
    return {
      credits: result.credits_remaining,
      used: result.credits_used,
      limit: result.credits_limit,
      resetDate: result.reset_date,
    };
  }
}
