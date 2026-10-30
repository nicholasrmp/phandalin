/**
 * Estado central da aplicação.
 *
 * Centraliza todo o estado mutável da aplicação para facilitar
 * debugging, testes e gerenciamento de estado.
 */
export class AppState {
  constructor() {
    // Encontro atual
    this.enc = null;
    this.config = null;
    this.varianteAtual = null;
    this.campoBase = null;

    // Seleção e modo
    this.selected = null;
    this.mode = null;
    this.recusa = null;

    // Capítulo/Cena
    this.capitulo = null;
    this.inimigosEscondidos = null;
    this.busy = false;

    // Campanha
    this.campanha = {};
    this.xpPendente = null;
    this.grupoDaCampanha = null;
    this.localAtual = null;

    // Multiplayer/Sala
    this.salaDaPartida = null;
    this.donoDaVisao = null;
    this.prontosDaCena = null;
    this.votoDeLugar = null;

    // UI
    this.root = null;
    this.hud = null;
    this.board = null;
    this.ficha = null;
    this.menu = null;
    this.canvas = null;
    this.dicas = null;

    // Save/Load
    this.saves = null;
    this.jogadorId = null;
    this.tempoBase = 0;
    this.inicioDaSessao = Date.now();
    this.carregando = false;

    // Animações e efeitos
    this.impactDelay = 0;
    this.walkWaitMs = 0;

    // Flags e controles internos
    this._remoto = false;
    this._pilotando = false;
    this._descansoEmVotacao = false;
    this._descansoAprovado = false;
    this._critico = null;
    this._dicaPendente = null;

    // Multiplayer - controles
    this.eventosPendentes = null;
    this.ultimaVistaTexto = null;
    this.emissorDeVista = null;
    this.esperasDeResposta = null;
    this._contextos = null;
    this._esperasDeNivel = null;
    this.lojaAberta = null;
    this._descansoRemoto = null;

    // Vila e região
    this.vilaBase = null;
    this.vilaAtual = null;

    // Contadores e sequências
    this._seqDescanso = 0;
    this._seqNivel = 0;
    this._seqLoja = 0;
    this._seqContexto = 0;
    this._assinProntos = null;

    // Layout
    this.novidadesNoRegistro = 0;
    this.alternarRegistro = null;
    this.contarNovidade = null;
    this.botaoPronto = null;
    this.faixaDosProntos = null;
    this.pilulaDeConexao = null;
    this._aoFecharFicha = null;
  }

  /**
   * Reseta o estado para um novo encontro.
   */
  resetEncounter() {
    this.enc = null;
    this.selected = null;
    this.mode = null;
    this.capitulo = null;
    this.inimigosEscondidos = null;
    this.busy = false;
    this.recusa = null;
    this._critico = null;
  }

  /**
   * Reseta o estado de multiplayer.
   */
  resetMultiplayer() {
    this.salaDaPartida = null;
    this.donoDaVisao = null;
    this.prontosDaCena = null;
    this.votoDeLugar = null;
    this.eventosPendentes = null;
    this.ultimaVistaTexto = null;
    this.esperasDeResposta = null;
    this._contextos = null;
    this._esperasDeNivel = null;
    this.lojaAberta = null;
    this._descansoRemoto = null;
  }

  /**
   * Reseta o estado de campanha.
   */
  resetCampanha() {
    this.campanha = {};
    this.xpPendente = null;
    this.grupoDaCampanha = null;
    this.localAtual = null;
    this.vilaBase = null;
    this.vilaAtual = null;
  }

  /**
   * Verifica se está em modo multiplayer.
   */
  isMultiplayer() {
    return Boolean(this.salaDaPartida);
  }

  /**
   * Verifica se está em combate.
   */
  isInCombat() {
    return Boolean(this.enc && !this.enc.over);
  }

  /**
   * Verifica se está explorando.
   */
  isExploring() {
    return Boolean(this.capitulo?.explorando);
  }

  /**
   * Obtém o grupo atual (em encontro ou campanha).
   */
  getCurrentParty() {
    if (this.enc) {
      return this.enc.combatants.filter((c) => c.side === "party" && !c.dead);
    }
    return (this.grupoDaCampanha ?? []).filter((c) => !c.dead);
  }

  /**
   * Obtém o local atual no formato de save.
   */
  getCurrentLocation() {
    if (this.enc) return { tipo: "cena" };

    if (!this.localAtual) {
      return this.campanha?.regiao
        ? { tipo: "regiao", onde: this.campanha.regiao.onde }
        : { tipo: "cena" };
    }

    if (this.localAtual.tipo === "regiao") {
      return {
        tipo: "regiao",
        onde: this.campanha?.regiao?.onde ?? this.localAtual.onde,
      };
    }

    return { ...this.localAtual };
  }
}
