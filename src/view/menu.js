// O menu: a primeira coisa que o jogador vê, e o caminho até o tabuleiro.
//
//   principal  Continuar (se há partida) · Jogar solo · Multijogador (em
//              breve) · Opções · Créditos · Sair
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
import { audio } from '../core/audio.js';
import { criarFundo } from './menu-fundo.js';
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

export function criarMenu(root, { onIniciar, temPartida }) {
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
      if (pilha.length > 1) voltar();
      else if (temPartida()) fechar();
    }
  }, { capture: true });

  function abrir(tela = 'principal') {
    pilha.length = 0;
    const naPartida = temPartida();
    camada.classList.toggle('na-partida', naPartida);
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
    ir(tela);
  }

  function fechar() {
    if (!aberto) return;
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

  function desenhar() {
    const [tela, dados] = pilha[pilha.length - 1];
    const titulo = tela === 'principal' || tela === 'sair';
    camada.dataset.tela = titulo ? 'titulo' : 'quadro';
    const conteudo = TELAS[tela](dados);
    palco.replaceChildren(titulo ? conteudo : el('div', { class: 'menu-quadro' }, conteudo));
    // Foco no primeiro botão: o menu inteiro anda no teclado.
    palco.querySelector('button:not([disabled])')?.focus();
  }

  const botao = (rotulo, onclick, { primario = false, desabilitado = false, dica = null } = {}) => el('button', {
    class: `menu-btn${primario ? ' primario' : ''}`,
    disabled: desabilitado,
    title: dica,
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
    principal: () => el('div', { class: 'menu-coluna' },
      logo(),
      el('nav', { class: 'menu-itens', 'aria-label': 'Menu principal' },
        temPartida() && item('Continuar', fechar, { destaque: true }),
        item('Jogar solo', () => ir('jogar'), { destaque: !temPartida() }),
        item('Multijogador', () => {}, { desabilitado: true, etiqueta: 'em breve' }),
        item('Opções', () => ir('opcoes')),
        item('Créditos', () => ir('creditos')),
        item('Sair', () => ir('sair'))),
      el('p', { class: 'menu-versao' }, 'Protótipo · regras da 5ª edição')),

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

  return { abrir, fechar, estaAberto: () => aberto };
}
