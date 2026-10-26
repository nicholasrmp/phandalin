// O menu: a primeira coisa que o jogador vê, e o caminho até o tabuleiro.
//
//   principal  Continuar (a partida, ou o save mais recente) · Jogar solo ·
//              Carregar jogo · Salvar jogo (só em lugar seguro) · Multijogador
//              (em breve) · Opções · Créditos · Sair
//   carregar   os slots guardados, abrir arquivo, exportar, apagar
//   salvar     os três slots manuais
//   multi, salaCriar, salaEntrar, lobby   o multijogador (`menu-sala.js`)
//   jogar      Campanha ou Arena de testes
//   campanha   as aventuras publicadas; só a Mina Perdida de Phandelver joga
//   grupo      quem vai na carroça: quatro dos doze heróis prontos
//   preparo    magias, talento, subclasse e equipamento de cada um
//              (as duas em `menu-herois.js`)
//   arena      os encontros de teste, com o grupo no 2º nível
//   opcoes     volume e som
//   creditos   quem fez, e as atribuições que a licença exige
//   sair       a despedida (o navegador só fecha aba que ele mesmo abriu)
//
// O menu é uma camada por cima do HUD, e não uma página: voltar a ele no meio
// de um combate não destrói a partida — dá para continuar de onde parou.
// Enquanto ele está aberto, as teclas do jogo (espaço, números, Q/E) ficam
// presas aqui; senão o turno andaria por trás da tela.

import './menu.css';
import { el } from './hud.js';
import { makePortrait } from '../art/sheet.js';
import { AVENTURAS } from '../game/aventuras.js';
import { criarTelasDeHerois } from './menu-herois.js';
import { criarTelasDeSala } from './menu-sala.js';
import { audio } from '../core/audio.js';
import { criarFundo } from './menu-fundo.js';
import { SLOTS_MANUAIS, resumoDoSave, paraArquivo, nomeDoArquivo, deArquivo } from '../game/save.js';
// O logotipo: gerado no OpenArt (Nano Banana Pro) sobre magenta e recortado
// por `dev/recortar-logo.py`. Ganhou do candidato do Ideogram por ler melhor
// sobre o fundo escuro: ouro quente em vez de latão oliva.
import LOGO from '../art/menu/logo.webp';

/** Os encontros da arena, com o que cada um testa. */
const NIVEIS_DA_ARENA = [1, 2, 3, 5];

const ARENA = [
  { variante: 'emboscada', nome: 'Emboscada na estrada',
    texto: 'Quatro goblins nos barrancos, a carroça e os cavalos mortos no meio, e lobos que descem pela trilha na 2ª rodada. Com surpresa.' },
  { variante: 'caverna', nome: 'Caverna escura',
    texto: 'Teste da luz e das conversas: breu, tochas, visão no escuro, dois guardas goblins e Droop ao lado da fogueira. Começa explorando.' },
  { variante: 'padrao', nome: 'Clareira dos goblins',
    texto: 'O encontro antigo, o que foi balanceado e que o simulador continua medindo.' },
  { variante: 'grandes', nome: 'Vitrine de tamanhos',
    texto: 'Criaturas Grandes e Enormes no tabuleiro, para ver pegada, alcance e desenho.' },
];

// TRÊS CAMADAS, de trás para a frente:
//   fundo   a estrada viva (`menu-fundo.js`) — só fora de partida; no meio de
//           um combate o fundo é o próprio combate, escurecido
//   véu     o degradê que escurece o fundo: forte à esquerda na tela de
//           título, onde mora o menu, e por igual nas telas de pergaminho
//   palco   o conteúdo: a coluna do título, ou o quadro de pergaminho
// A música da tela de título. O arquivo mora em `public/musica/` e pode faltar
// (ver `audio.tocarMusica`): sem ele o menu abre calado, como sempre abriu.
const MUSICA_DO_TITULO = `${import.meta.env?.BASE_URL ?? '/'}musica/vincere-vel-mori.mp3`;

export function criarMenu(root, {
  onIniciar, temPartida,
  // Save e carregar (`game/save.js`): sem `saves`, o menu é o de antes.
  saves = null, onCarregar = null, podeSalvar = () => false, onSalvar = null,
  // Multijogador (`menu-sala.js`): sem isto, "Multijogador" continua "em breve".
  multijogador = null,
}) {
  const camada = el('div', { class: 'menu', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Menu' });
  const fundoHost = el('div', { class: 'menu-fundo' });
  const palco = el('div', { class: 'menu-palco' });
  camada.append(
    fundoHost,
    el('div', { class: 'menu-veu' }),
    palco,
    el('footer', { class: 'menu-legal' },
      'Phandalin é conteúdo de fã não oficial, permitido sob a Fan Content Policy da Wizards of the Coast. '
      + 'Não é aprovado nem endossado pela Wizards. Inclui material do SRD 5.1 (CC-BY-4.0).'),
  );
  let aberto = false;
  const pilha = [];
  let fundo = null;
  addEventListener('resize', () => { if (aberto) fundo?.enquadrar(); });

  // Teclado preso enquanto o menu está na frente. Esc volta uma tela; na
  // principal, com partida em andamento, fecha e volta ao jogo.
  addEventListener('keydown', (e) => {
    if (!aberto) return;
    e.stopImmediatePropagation();
    // Setas andam pela lista da tela de título, como num menu de console.
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && camada.contains(document.activeElement)) {
      const itens = [...palco.querySelectorAll('.menu-item:not([disabled])')];
      const i = itens.indexOf(document.activeElement);
      if (i >= 0) {
        e.preventDefault();
        itens[(i + (e.key === 'ArrowDown' ? 1 : itens.length - 1)) % itens.length].focus();
      }
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      // No lobby o Esc não larga a sala sem querer: quem sai usa o botão. Sem sala a proteger
      // (ainda entrando, recusada, encerrada), o Esc sai como em qualquer tela.
      if (pilha[pilha.length - 1][0] === 'lobby') {
        // A mesa de grupo abriu por cima da taverna: o Esc volta para ela.
        if (multijogador?.taverna?.aberta()) { fechar(); return; }
        if (sala?.lobbyAtivo()) return;
        sala?.sairDaSala();
        irSala.aoMulti();
        return;
      }
      if (pilha.length > 1) voltar();
      else if (temPartida()) fechar();
    }
  }, { capture: true });

  function abrir(tela = 'principal', dados) {
    pilha.length = 0;
    // Na taverna o menu é uma folha por cima dela, como numa partida: nada de fundo animado nem de música do título.
    const naPartida = temPartida() || Boolean(multijogador?.taverna?.aberta()) || Boolean(sala?.dentroDeSala());
    camada.classList.toggle('na-partida', naPartida);
    multijogador?.taverna?.bloquear?.(true);   // a taverna fica por baixo: sem foco e sem Tab até o menu fechar
    if (naPartida) {
      fundo?.parar();
      fundoHost.replaceChildren();
      // Em partida o menu é uma pausa, não a tela de título: nada de música.
      audio.pararMusica(0.6);
    } else {
      fundo ??= criarFundo();
      fundoHost.replaceChildren(fundo.canvas);
      fundo.iniciar();
      // Antes do primeiro clique isto só GUARDA o pedido; o navegador não deixa
      // tocar sem gesto, e `audio.unlock()` o cumpre no primeiro toque.
      audio.tocarMusica(MUSICA_DO_TITULO);
    }
    if (!aberto) { root.append(camada); aberto = true; }
    ir(tela, dados);
  }

  /** O link `?sala=ABC234`: o menu abre direto na tela de entrar, com o código posto e o Voltar funcionando. */
  function abrirSala(codigo) {
    abrir();
    ir('multi');
    ir('salaEntrar', { codigo });
  }

  function fechar() {
    if (!aberto) return;
    if (multijogador?.taverna?.aberta()) { multijogador.taverna.bloquear(false); setTimeout(() => multijogador.taverna.focarMesa(), 0); }
    // Sair do menu — para jogar ou para voltar à partida — encerra a música,
    // com fade, que é o que faz a entrada na aventura não ser um corte seco.
    audio.pararMusica(1.6);
    fundo?.parar();
    camada.remove();
    aberto = false;
  }

  function ir(tela, dados) {
    pilha.push([tela, dados]);
    desenhar();
  }

  function voltar() {
    if (pilha.length > 1) pilha.pop();
    desenhar();
    audio.play('click');
  }

  function desenhar({ semFoco = false } = {}) {
    const [tela, dados] = pilha[pilha.length - 1];
    // Uma tela que se redesenha sozinha leva o foco do teclado junto: o botão focado volta a ser o mesmo.
    const chaveFocada = semFoco ? document.activeElement?.dataset?.chave : null;
    const titulo = tela === 'principal' || tela === 'sair';
    camada.dataset.tela = titulo ? 'titulo' : 'quadro';
    const conteudo = TELAS[tela](dados);
    palco.replaceChildren(titulo ? conteudo : el('div', { class: 'menu-quadro' }, conteudo));
    // Foco no primeiro botão: o menu inteiro anda no teclado. Uma tela que muda sozinha
    // (o lobby, quando chega gente) não rouba o foco de quem está no meio de um clique.
    if (!semFoco) (palco.querySelector('button[data-foco]') ?? palco.querySelector('input') ?? palco.querySelector('button:not([disabled])'))?.focus();
    else if (chaveFocada) palco.querySelector(`button[data-chave="${CSS.escape(chaveFocada)}"]:not([disabled])`)?.focus();
  }

  const botao = (rotulo, onclick, { primario = false, desabilitado = false, dica = null, foco = false, chave = null, aria = null } = {}) => el('button', {
    class: `menu-btn${primario ? ' primario' : ''}`,
    disabled: desabilitado,
    title: dica,
    'data-foco': foco ? '1' : null,
    // `chave` identifica o botão entre um redesenho e outro (o foco do teclado volta a ele).
    'data-chave': chave,
    'aria-label': aria,
    onclick: () => { audio.play('click'); onclick(); },
  }, rotulo);

  const voltarBtn = () => botao('Voltar', voltar);

  // Item da tela de título: texto, não botão de formulário. O losango de
  // latão aparece no item sob o cursor ou com foco.
  const item = (rotulo, onclick, { desabilitado = false, etiqueta = null, destaque = false } = {}) => el('button', {
    class: `menu-item${destaque ? ' destaque' : ''}`,
    disabled: desabilitado,
    onclick: () => { audio.play('click'); onclick(); },
  }, el('span', {}, rotulo), etiqueta && el('small', { class: 'menu-etiqueta' }, etiqueta));

  // O logotipo é arte (OpenArt, recortado por `dev/recortar-logo.py`), com a
  // régua de losango embaixo já desenhada nele. O `h1` continua sendo o
  // título da página para leitor de tela, pelo `alt`.
  const logo = () => el('div', { class: 'menu-logo' },
    el('h1', { class: 'menu-titulo' },
      el('img', { class: 'menu-titulo-img', src: LOGO, alt: 'Phandalin', width: 1000, height: 194, draggable: 'false' })),
    el('p', { class: 'menu-sub' }, 'RPG tático cooperativo'));

  const cabecalho = (titulo, sub = null) => el('header', { class: 'menu-cab' },
    el('h2', {}, titulo), sub && el('p', {}, sub));

  const TELAS = {
    principal: () => {
      const guardados = saves ? saves.listar() : [];
      const recente = guardados.find((r) => r.save) ?? null;
      return el('div', { class: 'menu-coluna' },
      logo(),
      el('nav', { class: 'menu-itens', 'aria-label': 'Menu principal' },
        temPartida() && item('Continuar', fechar, { destaque: true }),
        // S-01: sem partida na memória, "Continuar" abre o save mais recente.
        !temPartida() && recente && item('Continuar', () => carregarSlot(recente.slot),
          { destaque: true, etiqueta: resumoDoSave(recente.save) }),
        item('Jogar solo', () => ir('jogar'), { destaque: !temPartida() && !recente }),
        saves && item('Carregar jogo', () => ir('carregar'), { desabilitado: !guardados.length }),
        saves && temPartida() && podeSalvar() && item('Salvar jogo', () => ir('salvar')),
        multijogador
          ? item('Multijogador', () => ir('multi'))
          : item('Multijogador', () => {}, { desabilitado: true, etiqueta: 'em breve' }),
        item('Opções', () => ir('opcoes')),
        item('Créditos', () => ir('creditos')),
        item('Sair', () => ir('sair'))),
      el('p', { class: 'menu-versao' }, 'Protótipo · regras da 5ª edição'));
    },

    jogar: () => el('div', {},
      cabecalho('Jogar solo', 'Você controla o grupo inteiro.'),
      el('div', { class: 'menu-cartoes' },
        cartaoEscolha('Campanha', 'Uma aventura do começo ao fim, com o grupo no 1º nível.', () => ir('campanha')),
        cartaoEscolha('Arena de testes', 'Encontros avulsos para testar regras, mapas e criaturas, com o grupo no 2º nível.', () => ir('arena'))),
      el('div', { class: 'menu-rodape' }, voltarBtn())),

    campanha: () => el('div', {},
      cabecalho('Campanha', 'Escolha a aventura.'),
      el('ul', { class: 'menu-aventuras' },
        AVENTURAS.map((a) => el('li', {},
          el('button', {
            class: `menu-aventura${a.jogavel ? ' jogavel' : ''}`,
            disabled: !a.jogavel,
            title: a.jogavel ? null : 'Ainda não disponível',
            onclick: () => { audio.play('click'); ir('grupo', { aventura: a }); },
          },
          el('span', { class: 'menu-aventura-nome' }, a.tituloPt ?? a.titulo),
          a.tituloPt && el('span', { class: 'menu-aventura-orig' }, a.titulo),
          el('span', { class: 'menu-aventura-ano' }, a.ano),
          a.jogavel && el('span', { class: 'menu-aventura-resumo' }, a.resumo))))),
      el('div', { class: 'menu-rodape' }, voltarBtn())),

    grupo: (dados) => herois.telaGrupo(dados),
    preparo: (dados) => herois.telaPreparo(dados),

    // O nível troca na própria tela (sem empilhar): o 3º abre o 2º círculo
    // de magia, o 5º o 3º círculo.
    arena: (dados) => {
      const nivel = dados?.nivel ?? 2;
      const trocar = (n) => { audio.play('click'); pilha[pilha.length - 1][1] = { nivel: n }; desenhar(); };
      return el('div', {},
        cabecalho('Arena de testes', `O grupo inteiro, no ${nivel}º nível.`),
        el('div', { class: 'menu-niveis', role: 'group', 'aria-label': 'Nível do grupo' },
          NIVEIS_DA_ARENA.map((n) => el('button', {
            class: `menu-nivel${n === nivel ? ' ativo' : ''}`,
            'aria-pressed': String(n === nivel),
            onclick: () => trocar(n),
          }, `${n}º nível`))),
        el('div', { class: 'menu-cartoes' },
          ARENA.map((e) => cartaoEscolha(e.nome, e.texto, () => iniciar({ modo: 'arena', variante: e.variante, nivel })))),
        el('div', { class: 'menu-rodape' }, voltarBtn()));
    },

    carregar: (dados) => {
      const lista = saves.listar();
      return el('div', {},
        cabecalho('Carregar jogo', 'Guardado neste navegador. O combate não se guarda: cada save volta ao começo da cena.'),
        recadoDe(dados),
        el('ul', { class: 'menu-saves' },
          lista.length ? lista.map(linhaDeSave) : el('li', { class: 'menu-save vazio' }, 'Nenhum jogo guardado ainda.')),
        el('div', { class: 'menu-rodape' }, voltarBtn(), botao('Abrir arquivo…', escolherArquivo,
          { dica: 'Um arquivo .phandalin.json exportado antes' })));
    },

    salvar: (dados) => el('div', {},
      cabecalho('Salvar jogo', 'Três espaços à mão. O jogo também salva sozinho a cada cena, descanso e marco da aventura.'),
      recadoDe(dados),
      el('ul', { class: 'menu-saves' }, SLOTS_MANUAIS.map((slot) => linhaDeSlotManual(slot, dados))),
      el('div', { class: 'menu-rodape' }, voltarBtn())),

    opcoes: () => telaOpcoes(),

    creditos: () => el('div', { class: 'menu-texto' },
      cabecalho('Créditos'),
      secao('Criação', 'Nicholas (nicholasrmp).'),
      secao('Programação', 'Escrita com o Claude Code, da Anthropic.'),
      secao('Arte', 'Personagens, efeitos e ícones desenhados por código para o jogo. Goblins, ladrilhos do chão e objetos de cenário gerados com o PixelLab, e o logotipo com o OpenArt, escolhidos e ajustados à mão.'),
      secao('Som', 'Sintetizado em tempo real pelo navegador (Web Audio). Nenhum arquivo de áudio.'),
      secao('Regras', 'This work includes material taken from the System Reference Document 5.1 ("SRD 5.1") by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.'),
      secao('Cenário', 'Phandalin é conteúdo de fã não oficial, permitido sob a Fan Content Policy da Wizards of the Coast. Não é aprovado nem endossado pela Wizards. Partes dos materiais usados são propriedade da Wizards of the Coast. ©Wizards of the Coast LLC. Todo o texto de aventura, diálogo, encontro e mapa do jogo foi escrito do zero para este projeto.'),
      secao('Código', 'Licença MIT.'),
      el('div', { class: 'menu-rodape' }, voltarBtn())),

    sair: () => {
      // `window.close()` só funciona em aba aberta por script. Tenta; se a
      // aba continua aqui, a tela diz o que fazer em vez de fingir que saiu.
      setTimeout(() => window.close(), 50);
      return el('div', { class: 'menu-coluna' },
        logo(),
        el('p', { class: 'menu-despedida' }, 'Até a próxima. O navegador não deixa o jogo fechar a própria aba: pode fechá-la quando quiser.'),
        el('nav', { class: 'menu-itens' }, item('Voltar ao menu', voltar, { destaque: true })));
    },
  };

  // ---- save e carregar ------------------------------------------------------

  const ultimoSave = () => saves?.maisRecente() ?? null;

  /** Reescreve a tela de cima da pilha com um recado e a desenha de novo. */
  function recado(texto, erro = false, extra = {}) {
    pilha[pilha.length - 1][1] = { ...extra, recado: { texto, erro } };
    desenhar();
  }

  const recadoDe = (dados) => dados?.recado
    && el('p', { class: `menu-recado${dados.recado.erro ? ' erro' : ''}`, role: 'status' }, dados.recado.texto);

  const quando = (t) => new Date(t).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  const duracao = (s) => `${Math.floor(s / 3600)}h${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}`;
  const nomeDoSlot = (slot) => (slot.startsWith('auto') ? `Automático ${slot.slice(-1)}` : `Manual ${slot.slice(-1)}`);

  function falhouAoCarregar(texto) {
    if (pilha[pilha.length - 1][0] === 'carregar') { recado(texto, true); return; }
    // Veio do "Continuar" da tela principal: a lista, com o motivo, em cima do principal.
    ir('carregar');
    recado(texto, true);
  }

  function carregarSlot(slot) {
    const c = saves.carregar(slot);
    if (!c.ok) { falhouAoCarregar(c.erro); return; }
    let r;
    try { r = onCarregar(c.save); } catch (e) { console.error(e); r = { ok: false, erro: `Não consegui abrir este save: ${e?.message ?? e}` }; }
    if (r?.ok === false) { falhouAoCarregar(r.erro); return; }
    // Só agora o menu sai: sem isto, um save que não monta deixaria o jogador sem tela.
    fechar();
  }

  function linhaDeSave(r) {
    if (r.erro) {
      return el('li', { class: 'menu-save quebrado' },
        el('div', { class: 'menu-save-info' }, el('strong', {}, nomeDoSlot(r.slot)), el('span', {}, r.erro)),
        botao('Apagar', () => apagarAgora(r.slot)));
    }
    const s = r.save;
    return el('li', { class: 'menu-save' },
      el('div', { class: 'menu-save-info' },
        el('strong', {}, `${nomeDoSlot(r.slot)} · ${s.nome}`),
        el('span', {}, `${resumoDoSave(s)} · ${duracao(s.tempoDeJogo ?? 0)} de jogo`),
        el('small', {}, quando(s.atualizadoEm))),
      el('div', { class: 'menu-save-acoes' },
        botao('Carregar', () => carregarSlot(r.slot), { primario: true }),
        botao('Exportar', () => exportar(s), { dica: 'Baixa um arquivo .phandalin.json' }),
        botao('Apagar', () => apagarComConfirmacao(r.slot))));
  }

  /** Apagar pede um segundo clique: o primeiro só troca o rótulo da tela. */
  function apagarAgora(slot) {
    if (saves.apagar(slot)) recado('Save apagado.');
    else recado('Não consegui apagar: o navegador não deixou.', true);
  }

  // Um duplo clique não confirma: o segundo clique só vale depois de o jogador ter lido o recado.
  const PAUSA_DA_CONFIRMACAO = 400;
  const confirmou = (dados, campo, slot) => dados?.[campo] === slot && Date.now() - (dados.pedidoEm ?? 0) > PAUSA_DA_CONFIRMACAO;

  function apagarComConfirmacao(slot) {
    const dados = pilha[pilha.length - 1][1];
    if (confirmou(dados, 'apagar', slot)) { apagarAgora(slot); return; }
    if (dados?.apagar === slot) return;
    recado(`Clique em Apagar de novo para apagar ${nomeDoSlot(slot)}.`, false, { apagar: slot, pedidoEm: Date.now() });
  }

  function linhaDeSlotManual(slot, dados) {
    const r = saves.ler(slot);
    const confirmando = dados?.confirmar === slot;
    const ocupado = Boolean(r?.save);
    const guardar = () => {
      let g;
      try { g = onSalvar(slot); } catch (e) { console.error(e); g = { ok: false, erro: `Não consegui salvar: ${e?.message ?? e}` }; }
      recado(g.ok ? 'Jogo salvo.' : g.erro, !g.ok);
    };
    return el('li', { class: 'menu-save' },
      el('div', { class: 'menu-save-info' },
        el('strong', {}, nomeDoSlot(slot)),
        ocupado
          ? el('span', {}, `${r.save.nome} · ${resumoDoSave(r.save)} · ${quando(r.save.atualizadoEm)}`)
          : el('span', {}, r?.erro ?? 'Vazio')),
      botao(confirmando ? 'Sobrescrever?' : ocupado ? 'Salvar por cima' : 'Salvar aqui', () => {
        if (ocupado && !confirmou(dados, 'confirmar', slot)) {
          if (dados?.confirmar === slot) return;
          recado(`${nomeDoSlot(slot)} já tem um jogo. Clique de novo para sobrescrever.`, false, { confirmar: slot, pedidoEm: Date.now() });
          return;
        }
        guardar();
      }, { primario: !ocupado || confirmando, foco: confirmando }));
  }

  /** S-09: baixa o save como arquivo; é o backup e o jeito de mudar de navegador. */
  function exportar(save) {
    const url = URL.createObjectURL(new Blob([paraArquivo(save)], { type: 'application/json' }));
    const a = el('a', { href: url, download: nomeDoArquivo(save) });
    root.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /** S-09: importa um arquivo para o rodízio de autosaves, sem tocar no jogo atual. */
  let campoDeArquivo = null;
  function escolherArquivo() {
    // Guardado no módulo: um `input` solto pode ser coletado antes do `change`.
    campoDeArquivo = el('input', { type: 'file', accept: '.json,application/json' });
    const alvo = pilha[pilha.length - 1];
    campoDeArquivo.addEventListener('change', async () => {
      const arq = campoDeArquivo?.files?.[0];
      campoDeArquivo = null;
      if (!arq) return;
      // Se o jogador saiu desta tela enquanto o arquivo lia, o recado não tem onde cair.
      const aqui = () => aberto && pilha[pilha.length - 1] === alvo;
      let r;
      try {
        if (arq.size > 1_600_000) { if (aqui()) recado('O arquivo é grande demais para ser um save.', true); return; }
        r = deArquivo(await arq.text());
      } catch (e) {
        if (aqui()) recado(`Não consegui ler o arquivo: ${e?.message ?? e}`, true);
        return;
      }
      if (!aqui()) return;
      if (!r.ok) { recado(r.erro, true); return; }
      // Entra num slot MANUAL livre: um autosave bom nunca é trocado por um arquivo, e a data é a de agora.
      const livre = SLOTS_MANUAIS.find((s) => !saves.ler(s));
      if (!livre) { recado('Os três espaços manuais estão ocupados: apague um para importar.', true); return; }
      const g = saves.gravar(livre, { ...r.save, atualizadoEm: Date.now() });
      recado(g.ok ? `Importado em ${nomeDoSlot(livre)}: ${r.save.nome}.` : g.erro, !g.ok);
    });
    campoDeArquivo.click();
  }

  function cartaoEscolha(titulo, texto, onclick) {
    return el('button', { class: 'menu-cartao', onclick: () => { audio.play('click'); onclick(); } },
      el('strong', {}, titulo), el('span', {}, texto));
  }

  function secao(titulo, texto) {
    return el('section', {}, el('h3', {}, titulo), el('p', {}, texto));
  }

  function telaOpcoes() {
    const valor = el('span', { class: 'menu-valor' });
    const barra = el('input', {
      type: 'range', min: 0, max: 100, step: 5, value: Math.round(audio.volume * 100),
      'aria-label': 'Volume',
    });
    const mudo = el('input', { type: 'checkbox' });
    mudo.checked = audio.muted;
    const atualizar = () => { valor.textContent = `${barra.value}%`; };
    barra.addEventListener('input', () => { audio.setVolume(barra.value / 100); mudo.checked = false; atualizar(); });
    barra.addEventListener('change', () => audio.play('click'));
    mudo.addEventListener('change', () => { if (mudo.checked !== audio.muted) audio.toggleMute(); });
    atualizar();
    return el('div', {},
      cabecalho('Opções', 'Guardadas neste navegador.'),
      el('div', { class: 'menu-opcoes' },
        el('label', { class: 'menu-opcao' }, el('span', {}, 'Volume'), barra, valor),
        el('label', { class: 'menu-opcao' }, el('span', {}, 'Sem som'), mudo, el('span', { class: 'menu-valor' }, 'tecla M no jogo'))),
      el('div', { class: 'menu-rodape' }, voltarBtn()));
  }

  // O retrato vem da folha de sprite do personagem, e a folha de quem tem
  // arte do PixelLab carrega depois da página: abrir o menu antes disso faz
  // `makePortrait` falhar. Aí entra um quadro vazio do mesmo tamanho, e quem
  // chamou tenta de novo depois.
  function retratoDe(look) {
    try {
      const cv = makePortrait(look, 48);
      cv.className = 'pixel';
      return cv;
    } catch {
      return null;
    }
  }

  function iniciar(config) {
    fechar();
    onIniciar(config);
  }

  const herois = criarTelasDeHerois({ botao, voltarBtn, cabecalho, ir, iniciar, retratoDe });

  // As telas do multijogador pedem ao menu quatro coisas além de `ir`:
  // trocar os dados da tela de cima, avisar sem redesenhar (para não perder o que o
  // jogador digitou), voltar até "Multijogador" e voltar ao título.
  const irSala = Object.assign((tela, dados) => ir(tela, dados), {
    trocar: (dados) => { pilha[pilha.length - 1][1] = dados; desenhar(); },
    recado: (texto) => {
      let p = palco.querySelector('.menu-recado.erro');
      if (!p) { p = el('p', { class: 'menu-recado erro', role: 'status' }); (palco.querySelector('.menu-cab') ?? palco.firstChild)?.after(p); }
      p.textContent = texto;
    },
    aoMulti: () => {
      while (pilha.length > 1 && pilha[pilha.length - 1][0] !== 'multi') pilha.pop();
      // O lobby aberto pela mesa de grupo (ou pela partida iniciada) é a raiz da pilha: não há "Multijogador" para voltar.
      if (pilha[pilha.length - 1][0] !== 'multi') { pilha.length = 0; pilha.push(['principal', undefined], ['multi', undefined]); }
      desenhar();
    },
    raiz: () => { pilha.length = 1; desenhar(); },
  });
  const sala = multijogador && criarTelasDeSala({
    botao, voltarBtn, cabecalho, ir: irSala, voltar, retratoDe, ...multijogador,
    // O lobby e a taverna se revezam: entrar na sala fecha o menu e mostra a taverna; a mesa de
    // grupo reabre o lobby por cima; sair (ou a sala acabar) tira a taverna.
    fecharMenu: fechar, abrirMenuNaTela: (tela) => abrir(tela),
    redesenhar: (tela) => { if (aberto && pilha[pilha.length - 1][0] === tela) desenhar({ semFoco: true }); },
  });
  if (sala) Object.assign(TELAS, sala.TELAS);

  return {
    abrir, abrirSala, fechar, estaAberto: () => aberto,
    // A taverna (`taverna-tela.js`) pede ao menu a mesa de grupo e a saída da sala.
    abrirMesa: () => { abrir('lobby'); },
    /** "Sair" da taverna: o anfitrião não sai (a sala é dele), então vai à mesa de grupo, onde fecha com confirmação. */
    sairDaTaverna: () => {
      if (sala?.souAnfitriao()) { abrir('lobby'); sala.avisar('O anfitrião fecha a sala em vez de sair: use "Fechar sala".'); return; }
      sala?.sairDaSala();
      abrir();
    },
    sairDaSala: () => sala?.sairDaSala(),
    enviarSala: (msg) => sala?.mandar(msg),
    /** F4: o anfitrião publica a vista da partida para os outros jogadores. */
    enviarVista: (vista) => sala?.mandarVista(vista) ?? false,
    /** F4.3: narrativa, intenções e respostas da partida. */
    enviarCru: (msg) => sala?.mandarCru(msg) ?? false,
    linkDaSala: () => sala?.copiarLink(),
  };
}
