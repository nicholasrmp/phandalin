import { describe, it, expect, beforeEach, vi } from "vitest";
import { SaveManager } from "../../../app/persistence/SaveManager.js";
import { GAME_MODES } from "../../../app/AppConfig.js";

// Mock do módulo game/save.js
vi.mock("../../../game/save.js", () => ({
  montarSave: vi.fn((data) => ({
    ...data,
    versao: 1,
    timestamp: data.agora,
  })),
  resumoDoSave: vi.fn((save) => ({
    nome: save.nome,
    nivel: save.config?.nivel ?? 1,
    local: save.local?.tipo ?? "cena",
  })),
}));

describe("SaveManager", () => {
  let manager;
  let mockSaves;
  let mockJogadorId;

  beforeEach(() => {
    // Mock do sistema de saves
    mockSaves = {
      autosalvar: vi.fn(),
      gravar: vi.fn(),
      carregar: vi.fn(),
    };

    mockJogadorId = "player-123";
    manager = new SaveManager(mockSaves, mockJogadorId);
  });

  describe("constructor", () => {
    it("deve inicializar com valores corretos", () => {
      expect(manager.saves).toBe(mockSaves);
      expect(manager.jogadorId).toBe(mockJogadorId);
      expect(manager.tempoBase).toBe(0);
      expect(manager.inicioDaSessao).toBeGreaterThan(0);
    });
  });

  describe("montarSaveAtual", () => {
    it("deve montar save com dados válidos", () => {
      const herois = [{ id: "hero1", name: "Guerreiro", hp: 10, maxHp: 10 }];
      const config = { modo: GAME_MODES.CAMPAIGN, nivel: 2 };
      const local = { tipo: "cena" };
      const campanha = { capitulo: 1 };

      const result = manager.montarSaveAtual({
        tipo: "manual",
        slot: "save-1",
        nome: "Meu Save",
        herois,
        config,
        local,
        campanha,
      });

      expect(result.ok).toBe(true);
      expect(result.save).toBeDefined();
      expect(result.save.id).toBe("save-1");
      expect(result.save.nome).toBe("Meu Save");
      expect(result.save.tipo).toBe("manual");
      expect(result.save.herois).toHaveLength(1);
      expect(result.save.herois[0].jogadorId).toBe(mockJogadorId);
    });

    it("deve usar nome padrão se não fornecido", () => {
      const herois = [
        { id: "hero1", name: "Guerreiro" },
        { id: "hero2", name: "Mago" },
      ];
      const config = { modo: GAME_MODES.CAMPAIGN };
      const local = { tipo: "cena" };

      const result = manager.montarSaveAtual({
        tipo: "auto",
        herois,
        config,
        local,
      });

      expect(result.ok).toBe(true);
      expect(result.save.nome).toBe("Guerreiro, Mago");
    });

    it("deve usar slot padrão se não fornecido", () => {
      const herois = [{ id: "hero1", name: "Guerreiro" }];
      const config = { modo: GAME_MODES.CAMPAIGN };
      const local = { tipo: "cena" };

      const result = manager.montarSaveAtual({
        tipo: "auto",
        herois,
        config,
        local,
      });

      expect(result.ok).toBe(true);
      expect(result.save.id).toBe("auto-1");
    });

    it("deve falhar sem heróis", () => {
      const result = manager.montarSaveAtual({
        herois: [],
        config: { modo: GAME_MODES.CAMPAIGN },
        local: { tipo: "cena" },
      });

      expect(result.ok).toBe(false);
      expect(result.erro).toBe("Não há heróis para salvar.");
    });

    it("deve adicionar jogadorId aos heróis", () => {
      const herois = [
        { id: "hero1", name: "Guerreiro" },
        { id: "hero2", name: "Mago", jogadorId: "other-player" },
      ];
      const config = { modo: GAME_MODES.CAMPAIGN };
      const local = { tipo: "cena" };

      const result = manager.montarSaveAtual({
        tipo: "auto",
        herois,
        config,
        local,
      });

      expect(result.ok).toBe(true);
      expect(result.save.herois[0].jogadorId).toBe(mockJogadorId);
      expect(result.save.herois[1].jogadorId).toBe("other-player");
    });

    it("deve incluir tempo de jogo calculado", () => {
      manager.tempoBase = 100;
      manager.inicioDaSessao = Date.now() - 10000; // 10 segundos atrás

      const herois = [{ id: "hero1", name: "Guerreiro" }];
      const config = { modo: GAME_MODES.CAMPAIGN };
      const local = { tipo: "cena" };

      const result = manager.montarSaveAtual({
        tipo: "auto",
        herois,
        config,
        local,
      });

      expect(result.ok).toBe(true);
      expect(result.save.tempoDeJogo).toBeGreaterThan(100);
      expect(result.save.tempoDeJogo).toBeLessThan(120);
    });
  });

  describe("autosalvar", () => {
    it("deve autosalvar em modo campanha", () => {
      const config = { modo: GAME_MODES.CAMPAIGN };
      const herois = [{ id: "hero1", name: "Guerreiro" }];
      const local = { tipo: "cena" };
      const campanha = {};

      mockSaves.autosalvar.mockReturnValue({ ok: true });

      const result = manager.autosalvar(config, herois, local, campanha, null);

      expect(result.ok).toBe(true);
      expect(mockSaves.autosalvar).toHaveBeenCalled();
    });

    it("não deve autosalvar em modo arena", () => {
      const config = { modo: GAME_MODES.ARENA };
      const herois = [{ id: "hero1", name: "Guerreiro" }];
      const local = { tipo: "cena" };

      const result = manager.autosalvar(config, herois, local, {}, null);

      expect(result).toBe(null);
      expect(mockSaves.autosalvar).not.toHaveBeenCalled();
    });

    it("deve chamar onError se falhar", () => {
      const config = { modo: GAME_MODES.CAMPAIGN };
      const herois = [{ id: "hero1", name: "Guerreiro" }];
      const local = { tipo: "cena" };
      const onError = vi.fn();

      mockSaves.autosalvar.mockReturnValue({
        ok: false,
        erro: "Erro de teste",
      });

      const result = manager.autosalvar(config, herois, local, {}, null, {
        onError,
      });

      expect(result.ok).toBe(false);
      expect(onError).toHaveBeenCalledWith("Erro de teste");
    });

    it("deve chamar onMultiplayer se fornecido", () => {
      const config = { modo: GAME_MODES.CAMPAIGN };
      const herois = [{ id: "hero1", name: "Guerreiro" }];
      const local = { tipo: "cena" };
      const onMultiplayer = vi.fn();

      mockSaves.autosalvar.mockReturnValue({ ok: true });

      manager.autosalvar(config, herois, local, {}, null, { onMultiplayer });

      expect(onMultiplayer).toHaveBeenCalled();
      expect(onMultiplayer.mock.calls[0][0]).toHaveProperty("herois");
    });

    it("deve capturar exceções e retornar erro", () => {
      const config = { modo: GAME_MODES.CAMPAIGN };
      const herois = [{ id: "hero1", name: "Guerreiro" }];
      const local = { tipo: "cena" };
      const onError = vi.fn();

      mockSaves.autosalvar.mockImplementation(() => {
        throw new Error("Erro inesperado");
      });

      const result = manager.autosalvar(config, herois, local, {}, null, {
        onError,
      });

      expect(result.ok).toBe(false);
      expect(result.erro).toContain("Não consegui salvar");
      expect(onError).toHaveBeenCalled();
    });
  });

  describe("salvarManual", () => {
    it("deve salvar manualmente com sucesso", () => {
      const slot = "save-1";
      const config = { modo: GAME_MODES.CAMPAIGN };
      const herois = [{ id: "hero1", name: "Guerreiro" }];
      const local = { tipo: "cena" };
      const onSuccess = vi.fn();

      mockSaves.gravar.mockReturnValue({ ok: true });

      const result = manager.salvarManual(
        slot,
        config,
        herois,
        local,
        {},
        null,
        { onSuccess },
      );

      expect(result.ok).toBe(true);
      expect(mockSaves.gravar).toHaveBeenCalledWith(slot, expect.any(Object));
      expect(onSuccess).toHaveBeenCalledWith("Partida salva!");
    });

    it("deve chamar onError se falhar", () => {
      const slot = "save-1";
      const config = { modo: GAME_MODES.CAMPAIGN };
      const herois = [{ id: "hero1", name: "Guerreiro" }];
      const local = { tipo: "cena" };
      const onError = vi.fn();

      mockSaves.gravar.mockReturnValue({ ok: false, erro: "Erro ao gravar" });

      const result = manager.salvarManual(
        slot,
        config,
        herois,
        local,
        {},
        null,
        { onError },
      );

      expect(result.ok).toBe(false);
      expect(onError).toHaveBeenCalledWith("Erro ao gravar");
    });

    it("deve usar nome dos heróis", () => {
      const slot = "save-1";
      const config = { modo: GAME_MODES.CAMPAIGN };
      const herois = [
        { id: "hero1", name: "Guerreiro" },
        { id: "hero2", name: "Mago" },
      ];
      const local = { tipo: "cena" };

      mockSaves.gravar.mockReturnValue({ ok: true });

      manager.salvarManual(slot, config, herois, local, {}, null);

      expect(mockSaves.gravar).toHaveBeenCalled();
      const saveData = mockSaves.gravar.mock.calls[0][1];
      expect(saveData.nome).toBe("Guerreiro, Mago");
    });
  });

  describe("carregarSave", () => {
    it("deve carregar save de cena", () => {
      const save = {
        config: { modo: GAME_MODES.CAMPAIGN },
        herois: [{ id: "hero1", name: "Guerreiro" }],
        local: { tipo: "cena" },
        tempoDeJogo: 100,
      };
      const onLoadEncounter = vi.fn();

      const result = manager.carregarSave(save, { onLoadEncounter });

      expect(result.ok).toBe(true);
      expect(result.resumo).toBeDefined();
      expect(onLoadEncounter).toHaveBeenCalled();
      expect(manager.tempoBase).toBe(100);
    });

    it("deve carregar save de vila", () => {
      const save = {
        config: { modo: GAME_MODES.CAMPAIGN },
        herois: [{ id: "hero1", name: "Guerreiro" }],
        local: { tipo: "vila", chegando: true },
        tempoDeJogo: 200,
      };
      const onLoadVila = vi.fn();

      const result = manager.carregarSave(save, { onLoadVila });

      expect(result.ok).toBe(true);
      expect(onLoadVila).toHaveBeenCalledWith(save.herois, true);
    });

    it("deve carregar save de região", () => {
      const save = {
        config: { modo: GAME_MODES.CAMPAIGN },
        herois: [{ id: "hero1", name: "Guerreiro" }],
        local: { tipo: "regiao", onde: "phandalin" },
        tempoDeJogo: 300,
      };
      const onLoadRegiao = vi.fn();

      const result = manager.carregarSave(save, { onLoadRegiao });

      expect(result.ok).toBe(true);
      expect(onLoadRegiao).toHaveBeenCalledWith(save.herois, "phandalin");
    });

    it("deve chamar onBeforeLoad", () => {
      const save = {
        config: { modo: GAME_MODES.CAMPAIGN },
        herois: [{ id: "hero1", name: "Guerreiro" }],
        local: { tipo: "cena" },
      };
      const onBeforeLoad = vi.fn();
      const onLoadCena = vi.fn();

      const result = manager.carregarSave(save, { onBeforeLoad, onLoadCena });

      expect(result.ok).toBe(true);
      expect(onBeforeLoad).toHaveBeenCalled();
      expect(onLoadCena).toHaveBeenCalled();
    });

    it("deve capturar exceções e chamar onError", () => {
      const save = {
        config: { modo: GAME_MODES.CAMPAIGN },
        herois: [{ id: "hero1", name: "Guerreiro" }],
        local: { tipo: "cena" },
      };
      const onLoadEncounter = vi.fn(() => {
        throw new Error("Erro ao carregar");
      });
      const onError = vi.fn();

      const result = manager.carregarSave(save, { onLoadEncounter, onError });

      expect(result.ok).toBe(false);
      expect(result.erro).toContain("Não consegui abrir este save");
      expect(onError).toHaveBeenCalled();
    });
  });

  describe("setTempoBase", () => {
    it("deve atualizar tempo base e início de sessão", () => {
      const tempoAntes = manager.inicioDaSessao;

      manager.setTempoBase(500);

      expect(manager.tempoBase).toBe(500);
      expect(manager.inicioDaSessao).toBeGreaterThanOrEqual(tempoAntes);
    });
  });

  describe("resetTempo", () => {
    it("deve resetar tempo para zero", () => {
      manager.tempoBase = 1000;

      manager.resetTempo();

      expect(manager.tempoBase).toBe(0);
      expect(manager.inicioDaSessao).toBeGreaterThan(0);
    });
  });

  describe("getTempoDeJogo", () => {
    it("deve calcular tempo total de jogo", () => {
      manager.tempoBase = 100;
      manager.inicioDaSessao = Date.now() - 5000; // 5 segundos atrás

      const tempo = manager.getTempoDeJogo();

      expect(tempo).toBeGreaterThan(100);
      expect(tempo).toBeLessThan(110);
    });
  });
});
