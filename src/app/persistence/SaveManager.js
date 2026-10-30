import { montarSave, resumoDoSave } from "../../game/save.js";
import { GAME_MODES } from "../AppConfig.js";

/**
 * Gerencia salvamento e carregamento de partidas.
 *
 * Responsabilidades:
 * - Montar dados de save com estado atual
 * - Autosave periódico (apenas em modo campanha)
 * - Save manual em slots específicos
 * - Carregamento de saves com validação
 * - Notificações de erro/sucesso
 *
 * @example
 * const manager = new SaveManager(saves, jogadorId);
 * const result = manager.autosalvar(config, herois, local, campanha);
 * if (!result.ok) {
 *   console.error(result.erro);
 * }
 */
export class SaveManager {
  /**
   * @param {Object} saves - Sistema de armazenamento de saves
   * @param {string} jogadorId - ID do jogador local
   */
  constructor(saves, jogadorId) {
    this.saves = saves;
    this.jogadorId = jogadorId;
    this.tempoBase = 0;
    this.inicioDaSessao = Date.now();
  }

  /**
   * Monta um save com os dados atuais da partida.
   *
   * @param {Object} options - Opções do save
   * @param {string} options.tipo - Tipo do save ('auto' ou 'manual')
   * @param {string} [options.slot] - Slot do save (padrão: 'auto-1')
   * @param {string} [options.nome] - Nome do save (padrão: nomes dos heróis)
   * @param {Array} options.herois - Heróis a salvar
   * @param {Object} options.config - Configuração da partida
   * @param {Object} options.local - Local atual
   * @param {Object} [options.campanha] - Estado da campanha
   * @param {Object} [options.xpPendente] - XP pendente de distribuição
   * @returns {Object} { ok: boolean, save?: Object, erro?: string }
   */
  montarSaveAtual({
    tipo,
    slot,
    nome,
    herois,
    config,
    local,
    campanha,
    xpPendente,
  }) {
    // Adiciona jogadorId a cada herói
    const grupo = (herois ?? []).map((h) => ({
      ...h,
      jogadorId: h.jogadorId ?? this.jogadorId,
    }));

    // Validação: precisa ter pelo menos um herói
    if (!grupo.length) {
      return { ok: false, erro: "Não há heróis para salvar." };
    }

    const agora = Date.now();
    const tempoDeJogo = this.tempoBase + (agora - this.inicioDaSessao) / 1000;

    // Monta o save usando a função do game/save.js
    const save = montarSave({
      id: slot ?? "auto-1",
      nome: nome ?? `${grupo.map((h) => h.name).join(", ")}`,
      tipo,
      agora,
      tempoDeJogo,
      config,
      local,
      campanha: campanha ?? {},
      herois: grupo,
      xpPendente: xpPendente ?? null,
      jogadores: [{ jogadorId: this.jogadorId, nome: "Jogador" }],
    });

    return { ok: true, save };
  }

  /**
   * Autosalva a partida (apenas em modo campanha).
   *
   * S-02: O autosave roda periodicamente e em pontos específicos:
   * - Ao entrar numa cena nova
   * - A cada 30 segundos (se em lugar seguro)
   * - Após descanso
   * - Após eventos importantes
   *
   * Falha em voz alta (aviso ao jogador) mas nunca derruba o jogo.
   *
   * @param {Object} config - Configuração da partida
   * @param {Array} herois - Heróis atuais
   * @param {Object} local - Local atual
   * @param {Object} campanha - Estado da campanha
   * @param {Object} xpPendente - XP pendente
   * @param {Function} onError - Callback para erros (recebe mensagem)
   * @param {Function} onMultiplayer - Callback para enviar save ao servidor
   * @returns {Object|null} Resultado do save ou null se não for campanha
   */
  autosalvar(
    config,
    herois,
    local,
    campanha,
    xpPendente,
    { onError, onMultiplayer } = {},
  ) {
    // Só autosalva em modo campanha
    if (config?.modo !== GAME_MODES.CAMPAIGN) {
      return null;
    }

    try {
      // Monta o save
      const r = this.montarSaveAtual({
        tipo: "auto",
        herois,
        config,
        local,
        campanha,
        xpPendente,
      });

      // Se montagem falhou, retorna erro
      if (!r.ok) {
        if (onError) onError(r.erro);
        return r;
      }

      // Grava o autosave
      const g = this.saves.autosalvar(r.save);

      // Se gravação falhou, notifica
      if (!g.ok) {
        if (onError) onError(g.erro);
        return g;
      }

      // F6: Em partida multiplayer, envia save ao servidor
      // para que outro jogador possa assumir se o anfitrião cair
      if (onMultiplayer) {
        onMultiplayer(r.save);
      }

      return g;
    } catch (e) {
      const erro = `Não consegui salvar: ${e.message}`;
      if (onError) onError(erro);
      return { ok: false, erro };
    }
  }

  /**
   * Salva manualmente em um slot específico.
   *
   * S-03: Save manual só funciona em lugar seguro:
   * - Explorando (sem combate)
   * - Sem narrativa aberta
   * - Sem ficha aberta
   *
   * @param {string} slot - Slot do save (ex: 'save-1')
   * @param {Object} config - Configuração da partida
   * @param {Array} herois - Heróis atuais
   * @param {Object} local - Local atual
   * @param {Object} campanha - Estado da campanha
   * @param {Object} xpPendente - XP pendente
   * @param {Function} onError - Callback para erros
   * @param {Function} onSuccess - Callback para sucesso
   * @returns {Object} { ok: boolean, erro?: string }
   */
  salvarManual(
    slot,
    config,
    herois,
    local,
    campanha,
    xpPendente,
    { onError, onSuccess } = {},
  ) {
    try {
      // Monta o save
      const r = this.montarSaveAtual({
        tipo: "manual",
        slot,
        nome: `${herois.map((h) => h.name).join(", ")}`,
        herois,
        config,
        local,
        campanha,
        xpPendente,
      });

      // Se montagem falhou, retorna erro
      if (!r.ok) {
        if (onError) onError(r.erro);
        return r;
      }

      // Grava o save manual
      const g = this.saves.gravar(slot, r.save);

      // Notifica resultado
      if (!g.ok) {
        if (onError) onError(g.erro);
      } else {
        if (onSuccess) onSuccess("Partida salva!");
      }

      return g;
    } catch (e) {
      const erro = `Não consegui salvar: ${e.message}`;
      if (onError) onError(erro);
      return { ok: false, erro };
    }
  }

  /**
   * Carrega um save.
   *
   * S-10: O carregamento nunca é parcial. Se falhar, o jogo
   * volta ao estado anterior. O save já chega validado e migrado.
   *
   * @param {Object} save - Dados do save a carregar
   * @param {Object} callbacks - Callbacks para diferentes ações
   * @param {Function} callbacks.onBeforeLoad - Antes de carregar
   * @param {Function} callbacks.onLoadState - Carregar estado (campanha, xp, tempo, config)
   * @param {Function} callbacks.onLoadVila - Carregar vila (herois, chegando)
   * @param {Function} callbacks.onLoadRegiao - Carregar região (herois, onde)
   * @param {Function} callbacks.onLoadCena - Carregar cena/encontro (herois, config)
   * @param {Function} callbacks.onLoadEncounter - Alias para onLoadCena (retrocompatibilidade)
   * @param {Function} callbacks.onError - Erro no carregamento
   * @param {Function} callbacks.onFinally - Executado sempre ao final
   * @returns {Object} { ok: boolean, resumo?: Object, erro?: string }
   */
  carregarSave(save, callbacks = {}) {
    const {
      onBeforeLoad,
      onLoadState,
      onLoadVila,
      onLoadRegiao,
      onLoadCena,
      onLoadEncounter,
      onError,
      onFinally,
    } = callbacks;

    try {
      // Preparação antes de carregar
      if (onBeforeLoad) {
        onBeforeLoad();
      }

      // Carrega estado da aplicação (campanha, xp, tempo, config)
      if (onLoadState) {
        onLoadState(save);
      } else {
        // Fallback: atualiza tempo base diretamente
        this.tempoBase = save.tempoDeJogo ?? 0;
        this.inicioDaSessao = Date.now();
      }

      // Determina tipo de local e carrega apropriadamente
      const lugar = save.local ?? { tipo: "cena" };

      if (lugar.tipo === "vila") {
        if (onLoadVila) {
          onLoadVila(save.herois, Boolean(lugar.chegando));
        }
      } else if (lugar.tipo === "regiao") {
        if (onLoadRegiao) {
          onLoadRegiao(save.herois, lugar.onde);
        }
      } else {
        // onLoadCena é o novo nome, onLoadEncounter é retrocompatibilidade
        const loadCena = onLoadCena ?? onLoadEncounter;
        if (loadCena) {
          loadCena(save.herois, save.config);
        }
      }

      return { ok: true, resumo: resumoDoSave(save) };
    } catch (e) {
      const erro = e?.message ?? e;
      if (onError) onError(erro);
      return { ok: false, erro: `Não consegui abrir este save: ${erro}` };
    } finally {
      if (onFinally) onFinally();
    }
  }

  /**
   * Atualiza o tempo base (usado ao carregar save).
   *
   * @param {number} tempo - Tempo em segundos
   */
  setTempoBase(tempo) {
    this.tempoBase = tempo;
    this.inicioDaSessao = Date.now();
  }

  /**
   * Reseta o tempo (usado ao iniciar nova partida).
   */
  resetTempo() {
    this.tempoBase = 0;
    this.inicioDaSessao = Date.now();
  }

  /**
   * Obtém o tempo total de jogo em segundos.
   *
   * @returns {number} Tempo em segundos
   */
  getTempoDeJogo() {
    const agora = Date.now();
    return this.tempoBase + (agora - this.inicioDaSessao) / 1000;
  }
}
