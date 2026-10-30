import { audio } from "../../core/audio.js";
import { CORES_DOS_JOGADORES } from "../AppConfig.js";

/**
 * Gerencia o layout da interface do usuário.
 *
 * Responsabilidades:
 * - Montar layout livre (sem minimapa)
 * - Criar botão de registro de eventos
 * - Criar botão "Pronto" para multiplayer
 * - Gerenciar faixa de jogadores prontos
 * - Contar novidades no registro
 *
 * @example
 * const layout = new LayoutManager(root, hud);
 * layout.montarLayoutLivre(topoEsquerda, callbacks);
 */
export class LayoutManager {
  /**
   * @param {HTMLElement} root - Elemento raiz da aplicação
   * @param {Object} hud - Objeto HUD com banner e minimapaHost
   */
  constructor(root, hud) {
    this.root = root;
    this.hud = hud;

    // Estado do registro
    this.novidadesNoRegistro = 0;
    this.alternarRegistro = null;
    this.contarNovidade = null;

    // Elementos do multiplayer
    this.botaoPronto = null;
    this.faixaDosProntos = null;
    this.pilulaDeConexao = null;

    // Controle de atualização
    this._intervaloProntos = null;
    this._assinProntos = null;
  }

  /**
   * Monta o layout livre (sem minimapa, com gaveta de registro).
   *
   * O layout livre é usado no jogo principal:
   * - Remove o minimapa (tabuleiro mostra mapa completo)
   * - Transforma log em gaveta lateral
   * - Adiciona botão de registro com contador
   * - Adiciona botão "Pronto" para multiplayer
   * - Adiciona faixa de jogadores prontos
   *
   * @param {HTMLElement} topoEsquerda - Container do topo esquerdo
   * @param {Object} callbacks - Callbacks para ações
   * @param {Function} callbacks.onMarcarPronto - Callback ao marcar pronto
   * @param {Function} callbacks.getSalaDaPartida - Obtém dados da sala
   * @param {Function} callbacks.getProntosDaCena - Obtém jogadores prontos
   * @param {Function} callbacks.mostrarProntos - Atualiza visualização de prontos
   */
  montarLayoutLivre(topoEsquerda, callbacks = {}) {
    const coluna = this.root.querySelector(".coluna-log");
    const palco = this.root.querySelector(".palco");

    if (!coluna || !palco) {
      console.warn(
        "LayoutManager: elementos .coluna-log ou .palco não encontrados",
      );
      return;
    }

    // Ativa layout livre
    this.root.classList.add("layout-livre");

    // Remove minimapa (tabuleiro mostra mapa completo)
    this.hud.minimapaHost.remove();

    // Move aviso legal para rodapé
    const legal = coluna.querySelector(".legal");
    if (legal) {
      legal.classList.add("legal-rodape");
      palco.append(legal);
    }

    // Transforma log em gaveta
    coluna.classList.add("gaveta-registro");
    palco.append(coluna);

    // Cria botão de registro
    this._criarBotaoRegistro(topoEsquerda, coluna);

    // Cria elementos de multiplayer
    this._criarElementosMultiplayer(topoEsquerda, callbacks);
  }

  /**
   * Cria o botão de registro com contador de novidades.
   *
   * @private
   * @param {HTMLElement} topoEsquerda - Container do topo
   * @param {HTMLElement} coluna - Coluna do log
   */
  _criarBotaoRegistro(topoEsquerda, coluna) {
    const novidades = document.createElement("span");
    novidades.className = "novidades";

    const botao = document.createElement("button");
    botao.className = "btn btn-registro";
    botao.title = "Rolagens e acontecimentos";
    botao.append("Registro", novidades);

    // Inicializa contador
    this.novidadesNoRegistro = 0;

    // Função para alternar gaveta
    this.alternarRegistro = (abrir = !coluna.classList.contains("aberta")) => {
      coluna.classList.toggle("aberta", abrir);
      botao.classList.toggle("aberto", abrir);

      // Zera contador ao abrir
      if (abrir) {
        this.novidadesNoRegistro = 0;
        novidades.textContent = "";
      }
    };

    // Evento de clique
    botao.addEventListener("click", () => {
      audio.play("click");
      this.alternarRegistro();
    });

    // Função para contar novidades
    this.contarNovidade = () => {
      // Não conta se gaveta está aberta
      if (coluna.classList.contains("aberta")) return;

      this.novidadesNoRegistro += 1;
      novidades.textContent =
        this.novidadesNoRegistro > 99
          ? "99+"
          : String(this.novidadesNoRegistro);
    };

    // Adiciona ao topo
    topoEsquerda.insertBefore(botao, this.hud.banner);
  }

  /**
   * Cria elementos de multiplayer (botão Pronto, faixa de jogadores).
   *
   * @private
   * @param {HTMLElement} topoEsquerda - Container do topo
   * @param {Object} callbacks - Callbacks para ações
   */
  _criarElementosMultiplayer(topoEsquerda, callbacks) {
    const {
      onMarcarPronto,
      getSalaDaPartida,
      getProntosDaCena,
      mostrarProntos,
    } = callbacks;

    // Botão "Pronto"
    const pronto = document.createElement("button");
    pronto.className = "btn btn-registro";
    pronto.hidden = true;
    pronto.title =
      "Marca que você não tem mais o que fazer nesta cena; as decisões de saída mostram quem está pronto";
    pronto.textContent = "Pronto";

    pronto.addEventListener("click", () => {
      audio.play("click");

      if (onMarcarPronto) {
        const sala = getSalaDaPartida ? getSalaDaPartida() : null;
        const prontos = getProntosDaCena ? getProntosDaCena() : null;
        const eu = sala?.visao?.voce;

        if (eu) {
          const estaPronto = prontos?.has(eu);
          onMarcarPronto(eu, !estaPronto);
        }
      }
    });

    // Faixa de jogadores prontos
    const faixa = document.createElement("span");
    faixa.className = "faixa-prontos";

    // Pílula de conexão ruim
    const conexao = document.createElement("span");
    conexao.className = "conexao-ruim";
    conexao.hidden = true;

    // Adiciona elementos
    topoEsquerda.insertBefore(pronto, this.hud.banner);
    topoEsquerda.insertBefore(faixa, this.hud.banner);
    topoEsquerda.insertBefore(conexao, this.hud.banner);

    // Guarda referências
    this.botaoPronto = pronto;
    this.faixaDosProntos = faixa;
    this.pilulaDeConexao = conexao;

    // Atualiza visibilidade periodicamente
    this._iniciarAtualizacaoProntos(getSalaDaPartida, mostrarProntos);
  }

  /**
   * Inicia atualização periódica dos elementos de multiplayer.
   *
   * @private
   * @param {Function} getSalaDaPartida - Obtém dados da sala
   * @param {Function} mostrarProntos - Atualiza visualização
   */
  _iniciarAtualizacaoProntos(getSalaDaPartida, mostrarProntos) {
    // Limpa interval anterior se existir
    if (this._intervaloProntos) {
      clearInterval(this._intervaloProntos);
    }

    // Atualiza a cada segundo
    this._intervaloProntos = setInterval(() => {
      const sala = getSalaDaPartida ? getSalaDaPartida() : null;
      const temSala = Boolean(sala);

      // Mostra/esconde elementos baseado em sala ativa
      if (this.botaoPronto) {
        this.botaoPronto.hidden = !temSala;
      }
      if (this.faixaDosProntos) {
        this.faixaDosProntos.hidden = !temSala;
      }

      // Atualiza faixa de prontos
      if (temSala && mostrarProntos) {
        mostrarProntos();
      }
    }, 1000);
  }

  /**
   * Atualiza a faixa de jogadores prontos.
   *
   * @param {Object} visao - Visão da sala (jogadores, voce)
   * @param {Set} prontosDaCena - Set de IDs de jogadores prontos
   */
  atualizarFaixaProntos(visao, prontosDaCena) {
    if (!this.faixaDosProntos || !visao) return;

    // Cria assinatura para evitar re-renderizações desnecessárias
    const assin = JSON.stringify([
      visao.jogadores?.map((j) => [j.id, j.nome, j.conectado]),
      [...(prontosDaCena ?? [])],
      visao.voce,
    ]);

    // Só atualiza se mudou
    if (
      assin === this._assinProntos &&
      this.faixaDosProntos.childElementCount > 0
    ) {
      // Apenas atualiza classe do botão
      if (this.botaoPronto) {
        this.botaoPronto.classList.toggle(
          "aberto",
          Boolean(prontosDaCena?.has(visao.voce)),
        );
      }
      return;
    }

    this._assinProntos = assin;

    // Reconstrói faixa
    const elementos = (visao.jogadores ?? []).map((j, i) => {
      const li = document.createElement("span");
      li.className = `faixa-jogador${j.conectado ? "" : " ausente"}${prontosDaCena?.has(j.id) ? " pronto" : ""}`;
      li.title = `${j.nome}${j.id === visao.voce ? " (você)" : ""}${prontosDaCena?.has(j.id) ? " — pronto para sair" : ""}`;

      const ponto = document.createElement("i");
      ponto.style.background =
        CORES_DOS_JOGADORES[i % CORES_DOS_JOGADORES.length];

      li.append(ponto, `${j.nome}${prontosDaCena?.has(j.id) ? " ✓" : ""}`);
      return li;
    });

    this.faixaDosProntos.replaceChildren(...elementos);

    // Atualiza classe do botão
    if (this.botaoPronto) {
      this.botaoPronto.classList.toggle(
        "aberto",
        Boolean(prontosDaCena?.has(visao.voce)),
      );
    }
  }

  /**
   * Mostra/esconde pílula de conexão ruim.
   *
   * @param {Object} status - Status da conexão
   * @param {boolean} status.ruim - Se a conexão está ruim
   * @param {string} [status.texto] - Texto a exibir
   */
  mostrarConexao(status) {
    if (!this.pilulaDeConexao) return;

    if (status.ruim) {
      this.pilulaDeConexao.hidden = false;
      if (status.texto) {
        this.pilulaDeConexao.textContent = status.texto;
      }
    } else {
      this.pilulaDeConexao.hidden = true;
    }
  }

  /**
   * Limpa recursos (intervals, event listeners).
   */
  dispose() {
    if (this._intervaloProntos) {
      clearInterval(this._intervaloProntos);
      this._intervaloProntos = null;
    }

    this.alternarRegistro = null;
    this.contarNovidade = null;
    this.botaoPronto = null;
    this.faixaDosProntos = null;
    this.pilulaDeConexao = null;
  }

  /**
   * Reseta contador de novidades.
   */
  resetNovidades() {
    this.novidadesNoRegistro = 0;
  }

  /**
   * Obtém número de novidades.
   *
   * @returns {number} Número de novidades
   */
  getNumeroNovidades() {
    return this.novidadesNoRegistro;
  }
}
