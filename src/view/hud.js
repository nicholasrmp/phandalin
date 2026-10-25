// HUD: ordem de turno, trilho do grupo, barra de ações, log de rolagens.
// DOM puro. Nome de jogador e texto de log sempre via textContent.
//
// A ARQUITETURA
// Vem do Baldur's Gate 3, que é o mesmo jogo que este: 5e tático em turnos com
// um grupo de quatro. Vale copiar a arquitetura de informação dele porque ela
// já resolveu problemas que apareceriam aqui de qualquer jeito. A arte é nossa.
//
// A tela se divide em cinco regiões, e cada uma responde UMA pergunta:
//
//   ordem de turno (topo)    quem joga agora e quem vem depois
//   trilho do grupo (esq.)   como está cada um dos meus
//   tabuleiro (centro)       onde todo mundo está
//   log (direita)            o que acabou de acontecer e por quê
//   barra de ação (baixo)    o que EU posso fazer agora
//
// A barra de ação tem três blocos. À esquerda, o núcleo diz de quem é o turno.
// No meio, uma bandeja só com tudo que se clica, em grupos: ataques e ações
// comuns gastam a AÇÃO, itens e magias gastam ação ou bônus; as cargas de
// classe ficam no canto do próprio azulejo. À direita, a economia inteira —
// ação, bônus, reação e movimento, com nome e gema acesa ou apagada —, que é a
// resposta mais rápida para "o que ainda me resta", e o botão de terminar.
//
// Antes disso tudo era uma fileira de botões de texto com emoji, e emoji é
// desenho do sistema operacional: era metade da cara de amador.
//
// O QUE A SEGUNDA RODADA DE TRABALHO ACRESCENTOU
// 1. Dica em TODO lugar clicável. A ficha do grupo é o ponto mais clicado da
//    tela e não explicava nada; os botões de câmera e som usavam `title`, que
//    é desenho do navegador e aparece depois de um segundo de espera.
// 2. A CA do inimigo virou chance de acerto. `rules/odds.js` faz a conta que o
//    jogador fazia de cabeça — e "CA 17 · 45%" é decisão, não aritmética.
// 3. Condição aparece onde a criatura aparece, com nome e efeito na dica.
// 4. Atalho de letra para arma e ação, impresso no canto do azulejo: sem a
//    tecla à vista, atalho é folclore.
// 5. Resumo do turno inimigo no centro. O log fica a 300 px do tabuleiro e
//    rola sozinho: quando o turno volta, ninguém sabe o que acabou de doer.

import { makePortrait } from '../art/sheet.js';
import { iconCanvas, iconeDaArma, iconeDeMagia, iconeDeAcao, temIcone } from '../art/icons.js';
import { CONDITIONS, hasCondition, maxHpEfetivo, DEGRAUS_DE_EXAUSTAO } from '../rules/conditions.js';
import { WEAPONS, consumiveisDe } from '../rules/equipment.js';
import { ARMORS } from '../rules/items/index.js';
import { isAdjacent } from '../core/grid.js';
import { criarMinimapa } from './minimapa.js';
import { getSpell, magiasProntas, dadosDaMagia } from '../rules/spells.js';
import { UTIL_FORA } from '../rules/utilidade.js';
import { spellSaveDc, spellAttackBonus } from '../rules/abilities.js';
import { previsaoDeAtaque, chanceD20, pct } from '../rules/odds.js';
import { formatModifier } from '../core/dice.js';
import { audio } from '../core/audio.js';

export const el = (tag, attrs = {}, ...children) => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'style') Object.assign(node.style, v);
    else if (k.startsWith('on')) node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v !== undefined && v !== null && v !== false) node.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return node;
};

/**
 * `replaceChildren` não é como `el()`: ele converte `null` no TEXTO "null" e
 * imprime isso na tela. Todo lugar que monta filhos condicionais passa por
 * aqui antes.
 */
const limpos = (...filhos) => filhos.flat().filter((f) => f !== null && f !== undefined && f !== false);

/**
 * O log usava emoji — treze desenhos do sistema operacional numa interface de
 * pedra e latão. Agora cada linha leva um losango da cor do tipo, no mesmo
 * idioma dos `pip` de espaço de magia: a cor já diz a categoria e o olho para
 * de tropeçar em bonequinho colorido. A cor mora no CSS, por classe.
 */
const LOG_TIPOS = new Set([
  'inicio', 'turno', 'ataque', 'magia', 'cura', 'morte', 'condicao',
  'recurso', 'acao', 'reacao', 'aviso', 'concentracao', 'fim',
]);

/**
 * O que entra no resumo do turno inimigo: o que ACONTECEU com o grupo. Ficam
 * fora as linhas de bookkeeping (`turno`, `recurso`, `concentracao`) — elas
 * enchem o painel e não mudam decisão nenhuma.
 */
const KINDS_RESUMO = new Set(['ataque', 'magia', 'cura', 'morte', 'condicao', 'reacao']);

/** Condições que o jogador QUER ter: pintadas de latão, não de sangue. */
const CONDICOES_BOAS = new Set(['abencoado', 'esquivando']);

// Atalhos de letra. Fora do jogo estão as teclas que `main.js` já escuta
// (Escape, espaço, Tab, Q, E, M) e os dígitos 1–9 da hotbar de magia. O que
// sobrou foi agrupado para a mão esquerda: F/G/H para as armas, na ordem em
// que elas aparecem, e R/X/C/T para as ações comuns.
const TECLAS_ARMA = ['f', 'g', 'h'];
const TECLAS_ACAO = { dash: 'r', dodge: 'x', disengage: 'c', stabilize: 't', standUp: 'z', escape: 'y', salto: 'j' };
const TECLAS_FEATURE = ['v', 'b', 'n', 'k'];

/** A gema de custo no canto do azulejo, pelo custo que a dica declara. */
const CUSTO_GEMA = { 'Ação': 'acao', 'Ação bônus': 'bonus' };

/**
 * As duas seções da bandeja têm duas fileiras. A de magias pagina com até N
 * colunas por página (menos em tela estreita).
 */
const FILEIRAS = 2;

/** O círculo da magia em numeral romano, como no selo do medalhão. */
const ROMANO = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];
const colunasDeMagia = () => (matchMedia('(max-width: 1150px)').matches ? 6 : 8);

/** Sigla de três letras sem acento: chip de condição legível sem emoji. */
const sigla = (texto) => texto.normalize('NFD').replace(/\p{M}/gu, '').slice(0, 3).toUpperCase();

/** Faixa de cor da chance: verde aposta boa, latão duvidosa, vermelha ruim. */
const faixaDeChance = (p) => (p >= 0.65 ? 'boa' : p >= 0.35 ? 'media' : 'ruim');

export class Hud {
  /**
   * Dados de dica por nó. É WeakMap porque cada `render*` descarta os nós
   * antigos: guardar num Map comum seria vazar a tela inteira a cada quadro.
   */
  static dicas = new WeakMap();

  constructor(root, handlers) {
    this.handlers = handlers;
    this.root = root;
    this.hotkeys = [];
    this.teclas = new Map();
    // A página da grade de magias e a magia mirada, por personagem (ver
    // `bandeja`), e a hora da última troca de página pela roda do mouse.
    this.paginaGrade = new Map();
    this.miradaGrade = new Map();
    this.ultimaRoda = 0;
    // A grade de magias tem menos colunas em tela estreita; atravessar o
    // limite com a barra aberta remonta a barra na hora.
    matchMedia('(max-width: 1150px)').addEventListener('change', () => this.redesenharBarra());

    // Estado do resumo do turno inimigo (ver `acompanharLado`).
    this.ladoAtual = null;
    this.resumoItens = [];
    this.pvAntes = null;

    this.ordem = el('div', { class: 'ordem' });
    this.viewBar = el('div', { class: 'viewbar' });
    this.banner = el('div', { class: 'turn-banner' });
    this.trilho = el('div', { class: 'trilho' });
    this.logList = el('div', { class: 'log-list' });
    // O minimapa se pendura aqui dentro, e o HUD só lhe passa o encontro.
    this.minimapaHost = el('div', { class: 'minimapa-host' });
    this.minimapa = criarMinimapa(this.minimapaHost);
    this.barra = el('div', { class: 'barra-acao' });
    this.hint = el('div', { class: 'hint' });
    this.dica = el('div', { class: 'dica', role: 'tooltip' });
    this.resumo = el('div', { class: 'resumo' });

    root.append(
      el('div', { class: 'hud-topo' }, this.banner, this.ordem, this.viewBar),
      el('div', { class: 'hud-meio' },
        el('aside', { class: 'coluna-grupo' }, this.trilho),
        // O resumo mora no palco e não no `board-wrap`: aquele é uma grade que
        // centraliza o tabuleiro e tem rolagem própria do zoom — um filho a
        // mais ali viraria item de grade e empurraria a peça principal.
        el('div', { class: 'palco' },
          el('div', { class: 'board-wrap', id: 'board-wrap' }),
          this.resumo,
          this.hint),
        el('aside', { class: 'coluna-log' },
          // O minimapa vem ANTES do log: é referência, consultada de relance,
          // e o log é narrativa, que rola. Referência que rola para fora da
          // tela não é referência.
          this.minimapaHost,
          el('h2', {}, 'Rolagens'),
          this.logList,
          el('footer', { class: 'legal' },
            el('p', {}, 'Phandalin é conteúdo de fã não oficial, permitido sob a Fan Content Policy da Wizards of the Coast. '
              + 'Não é aprovado nem endossado pela Wizards. Partes dos materiais usados são propriedade da Wizards of the Coast. '
              + '©Wizards of the Coast LLC.'),
            el('p', {}, 'Inclui material do SRD 5.1 por Wizards of the Coast LLC, sob licença Creative Commons Attribution 4.0.')))),
      el('div', { class: 'hud-baixo' }, this.barra),
      this.dica,
    );

    // As teclas 1–9 disparam a hotbar e as letras de `TECLAS_ARMA`/
    // `TECLAS_ACAO` disparam a barra, como num jogo de verdade. Nada aqui
    // conflita com o que `main.js` já escuta (Esc, espaço, Tab, Q/E, M).
    addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.altKey || e.metaKey || e.repeat) return;
      // O controle de volume é um campo de formulário: as teclas são dele.
      if (e.target instanceof HTMLInputElement) return;

      // Escape já limpa o modo de alvo em `main.js`; aqui ele também fecha o
      // resumo, que é a tecla que a mão procura para dispensar um painel.
      if (e.key === 'Escape') { this.fecharResumo(); return; }

      const n = Number(e.key);
      const slot = Number.isInteger(n) && n >= 1 && n <= 9
        ? this.hotkeys[n - 1]
        : this.teclas.get(e.key.toLowerCase());
      if (!slot || slot.disabled) return;
      e.preventDefault();
      slot.run();
    });
  }

  /**
   * Reserva uma letra para uma ação do turno. Devolve o rótulo a imprimir no
   * azulejo, ou `null` quando a letra já saiu para outra ação — azulejo sem
   * rótulo é melhor que dois azulejos prometendo a mesma tecla.
   */
  reservarTecla(tecla, run, desabilitado) {
    if (!tecla || this.teclas.has(tecla)) return null;
    this.teclas.set(tecla, { run, disabled: desabilitado });
    return tecla.toUpperCase();
  }

  get boardWrap() {
    return this.root.querySelector('#board-wrap');
  }

  // ---- dica flutuante -------------------------------------------------------

  /**
   * O tooltip rico é o que transforma um ícone em informação. Sem ele o jogador
   * tem de decorar vinte desenhos; com ele, o desenho é só o atalho.
   */
  ligarDica(node, dados) {
    if (!dados) return node;
    // Botão cujo conteúdo é só pixel art não tem texto para a leitura de tela
    // nem para a busca do navegador: o nome da dica serve aos dois.
    if (!node.getAttribute('aria-label') && !node.textContent.trim()) {
      node.setAttribute('aria-label', dados.nome);
    }
    // Marca o nó como dono de dica para o aninhamento funcionar: ao sair de um
    // chip de condição de volta para a ficha, a dica da FICHA volta em vez de
    // a tela ficar muda com o ponteiro parado em cima dela.
    node.dataset.dica = '1';
    Hud.dicas.set(node, dados);

    node.addEventListener('pointerenter', () => this.mostrarDica(node));
    node.addEventListener('pointerleave', () => {
      const pai = node.parentElement?.closest('[data-dica]');
      if (pai) this.mostrarDica(pai);
      else this.esconderDica();
    });
    node.addEventListener('click', () => this.esconderDica());
    return node;
  }

  esconderDica() {
    this.dica.classList.remove('on');
  }

  mostrarDica(node) {
    const dados = Hud.dicas.get(node);
    if (!dados) { this.esconderDica(); return; }
    this.dica.replaceChildren(...limpos(
      el('div', { class: 'dica-topo' },
        el('strong', {}, dados.nome),
        dados.tipo ? el('span', { class: 'dica-tipo' }, dados.tipo) : null),
      dados.linhas?.length
        ? el('div', { class: 'dica-linhas' }, dados.linhas.filter(Boolean).map(
          ([rotulo, valor, classe]) => el('div', { class: 'dica-linha' },
            el('span', { class: 'dica-rot' }, rotulo),
            el('span', { class: `dica-val${classe ? ` ${classe}` : ''}` }, valor))))
        : null,
      dados.texto ? el('p', { class: 'dica-texto' }, dados.texto) : null,
      dados.custo ? el('div', { class: 'dica-custo' }, dados.custo) : null,
      dados.aviso ? el('div', { class: 'dica-aviso' }, dados.aviso) : null,
      dados.atalho ? el('div', { class: 'dica-atalho' }, `tecla ${dados.atalho}`) : null,
    ));
    const r = node.getBoundingClientRect();
    // Medir ANTES de reposicionar dá a largura do lugar ANTERIOR: se a dica
    // estava encostada na borda, ela tinha quebrado mais estreita, e a trava
    // de borda calculada com esse número deixa a dica meio palmo fora da
    // tela. Zerar a posição primeiro força a medida no espaço livre.
    this.dica.style.left = '0px';
    this.dica.style.top = '0px';
    this.dica.classList.add('on');
    const dr = this.dica.getBoundingClientRect();
    const x = Math.min(Math.max(8, r.left + r.width / 2 - dr.width / 2), innerWidth - dr.width - 8);
    this.dica.style.left = `${x}px`;
    // Em cima do alvo é o padrão; quando não cabe (ficha no topo da coluna), a
    // dica desce para baixo dele em vez de encostar no teto e cobrir o nome.
    const acima = r.top - dr.height - 10;
    this.dica.style.top = `${acima >= 8 ? acima : Math.min(r.bottom + 10, innerHeight - dr.height - 8)}px`;
  }

  /** Um azulejo da barra: ícone, tecla, estado e dica. */
  tile(icone, { tecla = null, ativo = false, desabilitado = false, classe = '', dica = null, onClick = null, selo = null }) {
    const node = el('button', {
      class: `tile${ativo ? ' on' : ''}${desabilitado ? ' off' : ''}${classe ? ` ${classe}` : ''}`,
      disabled: desabilitado ? 'disabled' : null,
      // O nome vem da dica. Sem isto a leitura de tela anunciava o texto do
      // azulejo — a tecla "F", o selo "T" —, e `ligarDica` só põe o nome em
      // nó sem texto.
      'aria-label': dica?.nome ?? null,
      onclick: onClick ?? undefined,
    },
      iconCanvas(icone, 32),
      // O CUSTO, no canto de cima à esquerda: a mesma gema do bloco do turno
      // — âmbar é ação, azul é bônus —, para o azulejo dizer o que gasta sem
      // texto. Vem do custo que a dica já declara.
      CUSTO_GEMA[dica?.custo] ? el('span', { class: `tile-custo ${CUSTO_GEMA[dica.custo]}`, 'aria-hidden': 'true' }) : null,
      // O selo é a QUANTIDADE, no canto de cima: a tecla já mora no de baixo,
      // e duas plaquinhas no mesmo canto viram uma mancha só.
      selo !== null ? el('span', { class: 'tile-selo' }, selo) : null,
      tecla ? el('span', { class: 'tecla' }, tecla) : null);
    // A tecla impressa no canto só vale metade: na dica ela aparece escrita,
    // que é onde o jogador procura quando quer decorar o atalho.
    return this.ligarDica(node, dica && tecla ? { atalho: tecla, ...dica } : dica);
  }

  // ---- condições ------------------------------------------------------------

  /**
   * Chips de condição. Aparecem em todo lugar onde a criatura aparece — trilho,
   * ordem de turno, ficha de inimigo — porque condição esquecida é regra
   * perdida: ninguém lembra que está com desvantagem olhando o retrato.
   *
   * Cada condição aparece com o seu ícone de 32 px (src/art/icones-condicoes.js).
   * Nunca emoji: emoji é desenho do sistema operacional e não existe na nossa
   * interface. A sigla de três letras sobra para onde o ícone não cabe.
   */
  condChips(c, { mini = false } = {}) {
    const bruta = c.conditions ?? [];
    if (!bruta.length) return null;
    // Chips repetidos (duas Luzes, a mesma condição de duas fontes) viram um só,
    // com a maior duração; sem ícone, a mesma sigla também junta.
    const porChave = new Map();
    for (const x of bruta) {
      const k = mini || !temIcone(x.id) ? sigla(CONDITIONS[x.id]?.name ?? x.id) : x.id;
      const antes = porChave.get(k);
      if (!antes) porChave.set(k, { ...x, _n: 1, _fontes: [x] });
      else {
        antes._n += 1;
        antes._fontes.push(x);
        if (!(Number.isFinite(antes.rounds) && Number.isFinite(x.rounds) ? antes.rounds >= x.rounds : !Number.isFinite(x.rounds))) antes.rounds = x.rounds;
      }
    }
    const lista = [...porChave.values()];
    return el('div', { class: `conds${mini ? ' mini' : ''}` }, lista.map((x) => {
      const def = CONDITIONS[x.id];
      // Exaustão: o degrau faz parte do nome, porque é ele que diz o que dói.
      const nome = def?.porNivel && x.data?.nivel ? `${def.name} ${x.data.nivel}` : (def?.name ?? x.id);
      // O ícone de 32 px entra onde cabe. Na ordem de turno (`mini`) o
      // azulejo tem 36 px de largura: ali a condição continua sendo um ponto
      // colorido, e a sigla fica no DOM para a leitura de tela.
      const comIcone = !mini && temIcone(x.id);
      return this.ligarDica(
        el('span', {
          class: `cond${CONDICOES_BOAS.has(x.id) ? ' boa' : ''}${comIcone ? ' com-icone' : ''}`,
          'aria-label': nome,
        }, comIcone ? iconCanvas(x.id, 32) : sigla(nome)),
        {
          nome,
          tipo: 'condição',
          linhas: [
            Number.isFinite(x.rounds) ? ['Duração', x.rounds >= 10 ? `${Math.round(x.rounds / 10)} min (${x.rounds} rodadas)` : `${x.rounds} rodada${x.rounds === 1 ? '' : 's'}`] : null,
            (c.concentrating?.condition === x.id || def?.concentrationEffect) ? ['Concentração', 'acaba se quem a mantém perder a concentração'] : null,
            x._n > 1 ? ['Fontes', String(x._n)] : null,
            def?.porNivel && x.data?.nivel
              ? ['Agora', DEGRAUS_DE_EXAUSTAO.slice(0, x.data.nivel).join(' · ')] : null,
          ],
          texto: def?.desc,
          aviso: def?.houseRule ? 'Regra da casa — não é do SRD' : null,
        },
      );
    }));
  }

  /** Nomes das condições em texto corrido, para a dica de quem as carrega. */
  nomesDeCondicao(c) {
    const lista = c.conditions ?? [];
    if (!lista.length) return null;
    return lista.map((x) => CONDITIONS[x.id]?.name ?? x.id).join(', ');
  }

  // ---- previsão de acerto ---------------------------------------------------

  /**
   * A conta de `rules/odds.js` para o personagem SELECIONADO contra este alvo.
   * Devolve `null` quando não há quem ataque — aí a ficha mostra só a CA, que é
   * o que ela sempre mostrou.
   *
   * A arma é a do modo de alvo, quando o jogador está com um ataque escolhido:
   * trocar de azulejo e ver a porcentagem mudar é como se aprende que o arco
   * acerta mais longe e a espada acerta mais forte.
   */
  previsaoContra(enc, atacante, alvo, mode = null) {
    if (!atacante || !alvo || alvo === atacante) return null;
    if (atacante.side === alvo.side) return null;
    if (atacante.dead || hasCondition(atacante, 'inconsciente')) return null;
    if (alvo.dead) return null;
    if (atacante.attacks && !atacante.attacks.length) return null;   // o familiar não ataca
    const weaponId = mode?.kind === 'attack' ? mode.weaponId : null;
    return previsaoDeAtaque(enc, atacante, alvo, weaponId);
  }

  /**
   * O rótulo curto que vai na ficha: "45%", "fora", "sem visão".
   *
   * O alcance vem ANTES da visão de propósito. `odds.js` mede linha de visão
   * para qualquer arma, mas a regra só exige visão no ataque à distância; num
   * corpo a corpo a 45 pés o que o jogador precisa saber é que tem de andar.
   */
  rotuloDeChance(p, alvo = null) {
    if (!p) return null;
    if (p.foraDeAlcance) {
      // Corpo a corpo longe do alvo não é ataque impossível: clicar no inimigo
      // anda até ele e golpeia. A chance DE QUANDO ENCOSTAR é o que permite
      // escolher para quem atravessar a sala, então ela aparece — apagada,
      // porque ainda não é a chance de agora.
      if (!p.perfil.ranged && alvo) {
        return { texto: pct(chanceD20(p.perfil.bonus, alvo.ac, p.mods)), classe: 'longe', aoChegar: true };
      }
      return { texto: 'fora', classe: 'ruim' };
    }
    if (p.semVisao) return { texto: 'sem visão', classe: 'ruim' };
    return { texto: pct(p.chance), classe: faixaDeChance(p.chance) };
  }

  /** As linhas de dica que explicam a porcentagem. Sem elas o número é palpite. */
  linhasDePrevisao(p, atacante, alvo = null) {
    if (!p) return [];
    const r = this.rotuloDeChance(p, alvo);
    const linhas = [
      [`Acerto de ${atacante.name}`, `${r.texto}${r.aoChegar ? ' ao encostar' : ''} · ${p.perfil.name}`, r.classe],
      ['Distância', `${p.dist} pés · alcance ${p.alcance}`],
    ];
    if (!p.foraDeAlcance && !p.semVisao) {
      linhas.push(['Dano médio', `${p.danoMedio.toFixed(1)} · esperado ${p.esperado.toFixed(1)}`]);
      linhas.push(['Crítico', pct(p.critico)]);
    }
    return linhas;
  }

  /**
   * Quantos turnos de ataque este alvo ainda aguenta, pelo dano esperado. É a
   * leitura que decide o turno: um inimigo a um golpe de cair muda a ordem de
   * tudo. Só aparece quando a conta faz sentido (chance e dano > 0).
   */
  golpesParaDerrubar(p, alvo) {
    if (!p || p.esperado <= 0) return null;
    const n = Math.ceil(Math.max(0, alvo.hp) / p.esperado);
    return n <= 1 ? 'um golpe deve bastar' : `cerca de ${n} golpes`;
  }

  /** Vantagem e desvantagem em uma frase, com o motivo que a regra deu. */
  avisoDePrevisao(p) {
    if (!p) return null;
    if (p.foraDeAlcance) {
      return p.perfil.ranged
        ? `Fora de alcance — ${p.dist} pés, a arma chega a ${p.alcance}`
        : `A ${p.dist} pés: clicar ataca andando até lá, se o movimento der`;
    }
    if (p.semVisao) return 'Sem linha de visão até o alvo';
    const motivos = p.motivos?.length ? ` (${p.motivos.join(', ')})` : '';
    if (p.mods.advantage && !p.mods.disadvantage) return `Vantagem${motivos}`;
    if (p.mods.disadvantage && !p.mods.advantage) return `Desvantagem${motivos}`;
    return null;
  }

  // ---- log e faixa ----------------------------------------------------------

  pushLog(entry) {
    const tipo = LOG_TIPOS.has(entry.kind) ? entry.kind : 'outro';
    const node = el('div', { class: `log-entry log-${entry.kind}` },
      el('span', { class: `log-rune rune-${tipo}` }),
      el('div', {},
        el('span', { class: 'log-text' }, entry.text),
        entry.detail ? el('span', { class: 'log-detail' }, entry.detail) : null));
    this.logList.append(node);
    this.logList.scrollTop = this.logList.scrollHeight;
    while (this.logList.childElementCount > 160) this.logList.firstElementChild.remove();

    // O resumo do turno inimigo se monta com o que o log diz ENQUANTO o lado
    // inimigo age: é a única fonte que já tem a frase pronta e revisada.
    if (this.ladoAtual === 'foes' && KINDS_RESUMO.has(entry.kind)) {
      this.resumoItens.push(entry.text);
    }
  }

  setBanner(enc) {
    if (enc.over) {
      this.banner.textContent = enc.outcome === 'vitoria' ? 'Vitória' : 'Derrota';
      this.banner.className = `turn-banner ${enc.outcome}`;
      return;
    }
    const party = enc.side === 'party';
    const circulos = (enc.zonas ?? []).filter((z) => z.circuloMagico).map((z) => z.circuloMagico.tipo);
    const plural = { celestial: 'celestiais', elemental: 'elementais', 'feérico': 'feéricos', corruptor: 'corruptores', 'morto-vivo': 'mortos-vivos' };
    const circ = circulos.length ? ` · Círculo: barra ${[...new Set(circulos)].map((t) => plural[t] ?? t).join(', ')}` : '';
    this.banner.textContent = (party ? `Rodada ${enc.round} · seu turno` : `Rodada ${enc.round} · inimigos`) + circ;
    this.banner.className = `turn-banner ${party ? 'party' : 'foes'}`;
  }

  setHint(text) {
    this.hint.textContent = text ?? '';
  }

  /**
   * @param alvo  o inimigo sob o cursor, quando há um. É o que faz cada
   *              azulejo de arma mostrar a chance contra ELE em vez de só o
   *              dado da tabela.
   */
  update(enc, selected, mode, alvo = null) {
    this.acompanharLado(enc);
    this.setBanner(enc);
    this.renderOrdem(enc, selected, mode);
    this.enc = enc;
    this.renderTrilho(enc, selected, mode);
    this.renderBarra(enc, selected, mode, alvo);
    this.renderViewBar();
    this.minimapa.desenhar(enc, selected);
  }

  // ---- resumo do turno inimigo ----------------------------------------------

  /**
   * O log fica na coluna da direita, a uns 300 px do tabuleiro, e rola sozinho:
   * quando seis inimigos agem em sequência, o jogador vê os números subirem no
   * tabuleiro e depois não tem como saber o que doeu nem em quem. Este resumo
   * aparece no centro, no instante em que o turno volta, e sai com um clique.
   *
   * A troca de lado é detectada aqui, dentro do `update` que `main.js` já
   * chama depois de cada evento — não precisou de gancho novo.
   */
  acompanharLado(enc) {
    const lado = enc.over ? 'fim' : enc.side;
    if (lado === this.ladoAtual) return;
    const anterior = this.ladoAtual;
    this.ladoAtual = lado;

    if (lado === 'foes') {
      // Os PV de ANTES são a medida honesta do estrago: contar dano somando o
      // texto do log erraria cura, resistência e dano redirecionado.
      this.resumoItens = [];
      // A rodada é anotada agora: a do fim do turno inimigo pode já ser a
      // seguinte, porque o contador vira quando o lado que abriu volta a agir.
      this.resumoRodada = enc.round;
      this.pvAntes = new Map(enc.allOf('party').map((c) => [c.id, { hp: c.hp, down: c.dead || hasCondition(c, 'inconsciente') }]));
      this.fecharResumo();
      return;
    }
    if (anterior === 'foes') this.montarResumo(enc);
  }

  fecharResumo() {
    this.resumo.classList.remove('on');
    this.resumo.replaceChildren();
  }

  montarResumo(enc) {
    const feridos = [];
    const curados = [];
    const baixas = [];
    for (const c of enc.allOf('party')) {
      const antes = this.pvAntes?.get(c.id);
      if (!antes) continue;
      const delta = Math.round(antes.hp - c.hp);
      if (delta > 0) feridos.push(`${c.name} −${delta}`);
      if (delta < 0) curados.push(`${c.name} +${-delta}`);
      const down = c.dead || hasCondition(c, 'inconsciente');
      if (down && !antes.down) baixas.push(c.name);
    }

    // Lado inimigo que não encostou em ninguém e não fez nada digno de nota
    // não merece um painel em cima do tabuleiro.
    if (!feridos.length && !baixas.length && !this.resumoItens.length) { this.fecharResumo(); return; }

    const MAX = 6;
    const linhas = this.resumoItens.slice(0, MAX);
    const sobra = this.resumoItens.length - linhas.length;

    this.resumo.replaceChildren(...limpos(
      el('div', { class: 'resumo-topo' },
        el('strong', {}, 'O que os inimigos fizeram'),
        el('span', { class: 'resumo-rodada' }, `rodada ${this.resumoRodada ?? enc.round}`),
        el('button', {
          class: 'resumo-x',
          'aria-label': 'Dispensar o resumo',
          onclick: (e) => { e.stopPropagation(); this.fecharResumo(); },
        }, '×')),
      feridos.length
        ? el('div', { class: 'resumo-dano' }, feridos.join(' · '))
        : el('div', { class: 'resumo-nada' }, 'Ninguém do grupo se feriu.'),
      curados.length ? el('div', { class: 'resumo-cura' }, curados.join(' · ')) : null,
      baixas.length ? el('div', { class: 'resumo-baixa' }, `${baixas.join(' e ')} ${baixas.length > 1 ? 'caíram' : 'caiu'}`) : null,
      linhas.length
        ? el('ul', { class: 'resumo-linhas' }, linhas.map((t) => el('li', {}, t)))
        : null,
      sobra > 0 ? el('div', { class: 'resumo-sobra' }, `e mais ${sobra} no log à direita`) : null,
      el('div', { class: 'resumo-pe' }, 'clique ou Esc para dispensar'),
    ));
    // Clicar em qualquer lugar do painel dispensa: a mão já está no mouse e o
    // alvo é o painel inteiro, não um × de 12 px.
    this.resumo.onclick = () => this.fecharResumo();
    this.resumo.classList.add('on');
  }

  // ---- ordem de turno -------------------------------------------------------

  /**
   * Este jogo usa iniciativa POR LADO: um grupo inteiro age, depois o outro.
   * A fila mostra exatamente isso — quem ainda tem turno neste lado, e o lado
   * que espera, separado por uma marca. Fingir uma fila individual mostraria
   * uma ordem que a regra não tem.
   */
  renderOrdem(enc, selected, mode) {
    if (enc.over) { this.ordem.replaceChildren(); return; }
    const agora = enc.side;
    const depois = agora === 'party' ? 'foes' : 'party';

    const ficha = (c, ativo) => {
      const down = c.dead || hasCondition(c, 'inconsciente');
      const fracao = Math.max(0, c.hp / maxHpEfetivo(c));
      const retrato = makePortrait(c.look, 32);
      retrato.className = 'pixel';
      // A condição também aparece aqui: a ordem de turno é onde o olho está
      // quando a vez troca, e "atordoado" muda o plano da rodada inteira.
      const chips = this.condChips(c, { mini: true });
      const previsao = this.previsaoContra(enc, selected, c, mode);
      const numero = c.invocado ? /(\d+)$/.exec(c.name)?.[1] : null;
      const node = el('div', {
        class: `vez${ativo ? ' agora' : ''}${c.acted && !c.familiar ? ' agiu' : ''}${down ? ' down' : ''}${selected === c ? ' alvo' : ''}`,
      },
        el('div', { class: 'vez-retrato' }, retrato, numero ? el('span', { class: 'vez-num' }, numero) : null),
        el('div', { class: 'vez-pv' }, el('i', { style: { width: `${fracao * 100}%` } })),
        chips);
      return this.ligarDica(node, {
        nome: c.name,
        tipo: c.invocado ? `invocado de ${enc.combatants.find((x) => x.id === c.invocado.donoId)?.name ?? 'alguém do grupo'}` : c.kind === 'npc' ? 'inimigo' : `${c.className} · Nv ${c.level}`,
        linhas: [
          ['Pontos de vida', `${Math.max(0, Math.ceil(c.hp))} / ${maxHpEfetivo(c)}`],
          ['Classe de armadura', String(c.ac)],
          ...this.linhasDePrevisao(previsao, selected, c),
          this.nomesDeCondicao(c) ? ['Condições', this.nomesDeCondicao(c)] : null,
        ],
        aviso: down ? 'Fora de combate' : this.avisoDePrevisao(previsao) ?? (c.acted && !c.familiar ? 'Já agiu nesta rodada' : null),
      });
    };

    this.ordem.replaceChildren(
      // `oculto`: no escuro, quem o grupo não vê não entra na fila (`main.js`).
      ...enc.allOf(agora).filter((c) => !c.oculto).map((c) => ficha(c, true)),
      this.ligarDica(el('span', { class: 'vez-sep' }, '▸'), {
        nome: 'Iniciativa por lado',
        texto: 'Todo o lado age e só então passa para o outro. Quem está à esquerda da marca joga nesta vez; à direita, espera.',
      }),
      ...enc.allOf(depois).filter((c) => !c.oculto).map((c) => ficha(c, false)),
    );
  }

  // ---- trilho do grupo ------------------------------------------------------

  renderTrilho(enc, selected, mode) {
    this.trilho.replaceChildren(...limpos(
      enc.allOf('party').map((c) => this.fichaGrupo(enc, c, selected)),
      enc.allOf('foes').some((c) => !c.oculto) ? el('div', { class: 'trilho-titulo' }, 'Inimigos') : null,
      enc.allOf('foes').filter((c) => !c.oculto).map((c) => this.fichaInimigo(enc, c, selected, mode)),
    ));
  }

  /**
   * A ficha do grupo é o lugar mais clicado da tela e era o único sem dica
   * nenhuma. Ela agora explica o que os números dela querem dizer e o que
   * ainda sobrou do turno — a mesma resposta das gemas, mas sem obrigar o
   * jogador a atravessar a tela para ver.
   */
  /**
   * Ação, bônus, reação e movimento restantes, no próprio cartão.
   *
   * Isto já existia — na DICA. Para planejar a rodada o jogador tinha de
   * passar o mouse por quatro cartões, um de cada vez, e guardar de cabeça o
   * que viu nos três anteriores. É o contrário do que um trilho serve para
   * fazer. Três letras acesas ou apagadas dizem a mesma coisa de relance, e
   * a dica continua lá para quem quiser o nome por extenso.
   */
  economiaDoCartao(c) {
    const ponto = (rot, gasto, nome) => el('span', {
      class: `eco${gasto ? ' gasto' : ''}`,
      title: `${nome}: ${gasto ? 'já usada' : 'disponível'}`,
    }, rot);
    const pes = Math.max(0, Math.round(c.movementLeftFt ?? 0));
    return el('div', { class: 'eco-linha' },
      ponto('A', c.actionUsed, 'Ação'),
      ponto('B', c.bonusUsed, 'Ação bônus'),
      ponto('R', c.reactionUsed, 'Reação'),
      el('span', { class: `eco-mov${pes === 0 ? ' gasto' : ''}` }, `${pes} pés`));
  }

  /** "Controlar" x "Agir sozinho" do invocado: lembrado por criatura (`invocado.auto`). */
  botaoAuto(c) {
    const auto = Boolean(c.invocado?.auto);
    return el('span', {
      class: `btn-auto${auto ? ' on' : ''}`,
      role: 'button',
      tabindex: '0',
      title: auto ? 'Agindo sozinho: a IA aliada joga o turno. Clique para controlar.' : 'Você comanda. Clique para deixar agir sozinho.',
      onclick: (e) => { e.stopPropagation(); this.handlers.onAutoInvocado?.(c); },
    }, auto ? 'Agir sozinho' : 'Controlar');
  }

  /** O deslocamento do familiar em palavras: o morcego voa, o rato anda. */
  deslocamentoDoFamiliar(c) {
    const voo = c.speeds?.flyFt;
    return voo ? `voa ${voo} pés` : `anda ${c.speedFt || 20} pés`;
  }

  /** O atalho do dono, junto do "Terminar turno": todos os invocados dele de uma vez. */
  botaoAutoDoDono(dono) {
    const enc = this.enc;
    const lista = (enc?.combatants ?? []).filter((x) => x.invocado?.donoId === dono.id && !x.dead);
    if (!lista.length) return null;
    const todos = lista.every((x) => x.invocado.auto);
    return this.ligarDica(
      el('button', {
        class: `btn-auto-dono${todos ? ' on' : ''}`,
        onclick: () => this.handlers.onAutoDosInvocados?.(dono),
      }, todos ? 'Invocados: agem sozinhos' : 'Invocados: você controla'),
      {
        nome: 'Invocados de ' + dono.name,
        tipo: 'alterna para todos',
        texto: 'Alterna todos os invocados deste personagem entre "Controlar" e "Agir sozinho". Ao terminar o turno do dono, os que ainda não agiram encerram o turno (os sozinhos jogam antes).',
      });
  }

  fichaGrupo(enc, c, selected) {
    const down = c.dead || hasCondition(c, 'inconsciente');
    const fracao = Math.max(0, c.hp / maxHpEfetivo(c));
    // 36 e não 44: o retrato mora dentro do slot de madeira de .ficha-retrato.
    const retrato = makePortrait(c.look, 36);
    retrato.className = 'pixel';

    const dono = c.invocado ? enc.combatants.find((x) => x.id === c.invocado.donoId) : null;
    const donoNome = dono?.name ?? 'quem o conjurou';
    const eter = hasCondition(c, 'etereo');
    const numero = c.invocado ? /(\d+)$/.exec(c.name)?.[1] : null;
    const node = el('button', {
      class: `ficha${selected === c ? ' on' : ''}${c.acted && !c.familiar ? ' agiu' : ''}${down ? ' down' : ''}${c.invocado ? ' invocado' : ''}${eter ? ' etereo' : ''}`,
      onclick: () => this.handlers.onSelect?.(c),
      // A ficha do grupo é o ponto mais clicado da tela e só selecionava.
      ondblclick: () => this.handlers.onAbrirFicha?.(c),
    },
      el('div', { class: 'ficha-retrato' }, retrato, c.invocado ? null : el('span', { class: 'ficha-ca' }, c.ac),
        numero ? el('span', { class: 'ficha-num' }, numero) : null),
      el('div', { class: 'ficha-corpo' },
        el('strong', {}, c.name),
        el('span', { class: 'ficha-sub' }, c.invocado
          ? (c.familiar ? `Familiar de ${donoNome} · não ataca` : `Invocado de ${donoNome}${getSpell(c.invocado.spellId).concentration ? ' · concentração' : ''}`)
          : `${c.className} ${c.ancestry}`),
        eter ? el('span', { class: 'tarja-etereo' }, 'No Plano Etéreo') : null,
        c.invocado ? this.botaoAuto(c) : null,
        el('div', { class: 'bar' },
          el('i', { style: { width: `${fracao * 100}%`, background: fracao > 0.5 ? '#5fd07a' : fracao > 0.25 ? '#ffc83a' : '#ff5a5a' } })),
        el('span', { class: 'ficha-pv' }, `${Math.max(0, Math.ceil(c.hp))} / ${maxHpEfetivo(c)}`),
        down
          ? el('span', { class: 'ficha-morte' }, c.dead ? 'Morto' : `Morte ${c.deathSaves.successes}✓ ${c.deathSaves.failures}✗`)
          : null,
        // O familiar não ataca nem conjura: em vez de uma barra de ações apagada, uma linha que diz o que ele faz.
        !down && enc.side === 'party' ? (c.familiar ? el('span', { class: 'ficha-sub' }, `${this.deslocamentoDoFamiliar(c)} · obedece, não ataca`) : this.economiaDoCartao(c)) : null,
        c.spellcasting
          ? el('div', { class: 'slots' }, c.spellcasting.slots.map((n, lvl) => (lvl === 0 || n === undefined ? null
            : el('span', { class: 'slot' }, `${lvl}º ${'◆'.repeat(n)}`))))
          : null,
        this.condChips(c)),
    );

    const restos = [];
    if (!down && enc.side === 'party') {
      if (!c.actionUsed) restos.push('ação');
      if (!c.bonusUsed) restos.push('bônus');
      if ((c.movementLeftFt ?? 0) > 0) restos.push(`${c.movementLeftFt} pés`);
      if (!c.reactionUsed) restos.push('reação');
    }

    return this.ligarDica(node, {
      nome: c.name,
      tipo: c.invocado ? `${c.familiar ? 'Familiar' : 'Invocado'} de ${donoNome} · ${c.ancestry} (${c.familiar ? 'espírito de bicho miúdo; obedece e não ataca' : c.invocado.corpo ? `ergue-se de ${c.invocado.corpo}` : 'fera conjurada'})` : `${c.className} ${c.ancestry} · Nv ${c.level}`,
      linhas: [
        c.invocado ? ['Controle', c.invocado.auto ? 'age sozinho (IA aliada)' : 'você comanda'] : null,
        eter ? ['No Plano Etéreo', 'volta no começo do próximo turno'] : null,
        ['Pontos de vida', `${Math.max(0, Math.ceil(c.hp))} / ${maxHpEfetivo(c)}`],
        ['Classe de armadura', String(c.ac)],
        c.familiar ? ['Deslocamento', this.deslocamentoDoFamiliar(c)] : ['Deslocamento', `${Math.max(0, c.movementLeftFt ?? 0)} de ${c.speedFt || 30} pés`],
        restos.length ? ['Ainda tem', restos.join(', ')] : null,
        this.nomesDeCondicao(c) ? ['Condições', this.nomesDeCondicao(c)] : null,
      ],
      texto: down
        ? 'Fora de combate. Um aliado adjacente pode estabilizar com uma ação.'
        : c.invocado
          ? (c.familiar ? `Olho e ouvido de ${donoNome}; se cair a 0 PV, o espírito se vai. ` : getSpell(c.invocado.spellId).concentration ? `Dura enquanto ${donoNome} se concentrar. ` : '') + 'Clique para comandar; o botão alterna entre controlar e agir sozinho.'
          : 'Clique para assumir este personagem. Tab passa para o próximo que ainda não agiu.',
      aviso: down
        ? (c.dead ? 'Morto' : 'Inconsciente — rolando testes de morte')
        : c.acted ? 'Turno encerrado nesta rodada' : null,
    });
  }

  /**
   * "CA 17" obriga o jogador a calcular de cabeça; "CA 17 · 45%" é decisão.
   * A conta vem de `rules/odds.js` e é do personagem SELECIONADO com a arma
   * em mão — sem ninguém selecionado, a ficha volta a mostrar só a CA, porque
   * uma porcentagem sem dono seria mentira.
   */
  fichaInimigo(enc, c, selected, mode) {
    const fracao = Math.max(0, c.hp / maxHpEfetivo(c));
    const down = hasCondition(c, 'inconsciente');
    const previsao = this.previsaoContra(enc, selected, c, mode);
    const chance = this.rotuloDeChance(previsao, c);
    const golpes = this.golpesParaDerrubar(previsao, c);

    return this.ligarDica(
      el('div', {
        class: `inimigo${down ? ' down' : ''}`,
        // Passar o mouse aqui também vira contexto de alvo para a barra: é um
        // alvo maior e mais estável que a figura no tabuleiro, e é onde o
        // jogador já olha para comparar inimigos.
        onmouseenter: () => this.handlers.onAlvoHover?.(c),
        onmouseleave: () => this.handlers.onAlvoHover?.(null),
      },
        el('div', { class: 'inimigo-topo' },
          el('strong', {}, c.name),
          el('span', { class: 'inimigo-ca' },
            `CA ${c.ac}`,
            chance ? el('span', { class: `inimigo-chance ${chance.classe}` }, ` · ${chance.texto}`) : null)),
        el('div', { class: 'bar small' }, el('i', { style: { width: `${fracao * 100}%`, background: '#d4574a' } })),
        this.condChips(c)),
      {
        nome: c.name,
        tipo: 'inimigo',
        linhas: [
          ['Classe de armadura', String(c.ac)],
          ['Pontos de vida', `${Math.max(0, Math.ceil(c.hp))} / ${maxHpEfetivo(c)}`],
          ...this.linhasDePrevisao(previsao, selected, c),
          golpes ? ['Para derrubar', golpes] : null,
          this.nomesDeCondicao(c) ? ['Condições', this.nomesDeCondicao(c)] : null,
          ...this.linhasDeConjurador(c),
        ],
        texto: c.blurb ?? (previsao ? null : 'Escolha um personagem à esquerda para ver a chance de acerto contra este inimigo.'),
        aviso: this.avisoDePrevisao(previsao) ?? (down ? 'Fora de combate' : null),
      },
    );
  }

  /**
   * O que um inimigo conjurador ainda tem (o Cajavidro): as magias, os
   * espaços que sobram em cada círculo e as cargas do item. É a ficha dele
   * que o jogador vê gastar ao longo da luta.
   */
  linhasDeConjurador(c) {
    const sc = c.spellcasting;
    if (!sc || c.kind === 'pc') return [];
    const nome = (id) => getSpell(id)?.name ?? id;
    const linhas = [];
    if (sc.cantrips?.length) linhas.push(['Truques', sc.cantrips.map(nome).join(', ')]);
    if (sc.prepared?.length) linhas.push(['Magias', sc.prepared.map(nome).join(', ')]);
    const espacos = (sc.slots ?? []).map((n, i) => (i > 0 ? `${i}º: ${n}` : null)).filter(Boolean);
    if (espacos.length) linhas.push(['Espaços', espacos.join(' · ')]);
    if (sc.cajado) linhas.push(['Cajado', `${sc.cajado.cargas} cargas`]);
    return linhas;
  }

  // ---- barra de ação --------------------------------------------------------

  renderBarra(enc, c, mode, alvo = null) {
    this.ultimaBarra = [enc, c, mode, alvo];
    this.hotkeys = [];
    // As letras são reservadas a cada montagem da barra: a barra muda com a
    // classe e com o turno, e tecla apontando para um azulejo que não existe
    // mais é pior que tecla nenhuma.
    this.teclas = new Map();
    this.barra.replaceChildren();
    // O mouse pode estar sobre um medalhão que a remontagem tirou do lugar, e
    // o mouseleave dele nunca vem: o foco de círculo é limpo aqui.
    this.barra.classList.remove('com-foco');

    if (enc.over) {
      this.barra.append(el('div', { class: 'barra-aviso' },
        el('button', { class: 'btn primary', onclick: () => this.handlers.onRestart?.() }, 'Novo encontro')));
      return;
    }
    if (enc.side !== 'party') {
      this.barra.append(el('div', { class: 'barra-aviso' }, 'Os inimigos estão agindo…'));
      return;
    }
    if (!c) {
      this.barra.append(el('div', { class: 'barra-aviso' }, 'Escolha um personagem à esquerda.'));
      return;
    }
    if (c.dead || hasCondition(c, 'inconsciente')) {
      this.barra.append(el('div', { class: 'barra-aviso' }, `${c.name} está fora de combate.`));
      return;
    }

    // TRÊS BLOCOS: quem joga (núcleo), o que dá para fazer (a bandeja) e o
    // que sobrou do turno (economia, espaços de magia e terminar). Já foram
    // sete caixas lado a lado, cada uma com moldura e plaquinha.
    // Explorando não há turno: atacar, correr e esquivar não valem nada e a
    // barra fica só com as magias de utilidade (`.explorando .hud-baixo` em
    // `narrativa.css` apaga o resto e deixa a bandeja viva).
    const explorando = Boolean(this.handlers.explorando?.());
    const fixas = explorando ? [] : [
      ...this.tilesAtaques(enc, c, mode, alvo),
      ...this.tilesComuns(enc, c, mode),
      ...this.tilesItens(enc, c, mode),
    ];
    const magias = c.spellcasting ? this.magiasDe(c, mode) : [];
    // Sobra o que fazer enquanto houver azulejo habilitado — em qualquer
    // página de magias, não só na que está à vista. Conta também o que custa
    // "Livre", como a Ação Surpreendente.
    const sobra = fixas.some((t) => !t.classList.contains('off')) || magias.some((m) => !m.desabilitado);
    this.barra.append(this.nucleo(c), this.bandeja(c, mode, fixas, magias), this.zonaTurno(c, sobra, mode));
  }

  /**
   * A BANDEJA, como a barra do Baldur's Gate 3, em duas seções.
   *
   * À esquerda, as AÇÕES FIXAS — ataques, ações comuns e itens —, sempre à
   * vista, nunca paginadas: são o que o jogador usa todo turno, e uma versão
   * anterior desta barra as escondia atrás de filtro e página justamente no
   * mago, que é quem mais precisa achar o Esquivar e a poção depressa.
   *
   * À direita, as MAGIAS, do truque ao 9º, com o aro na cor do círculo. Só
   * esta seção pagina: enquanto as magias cabem, a grade tem o tamanho delas;
   * quando passam de uma página, ganha largura fixa, setas e "1/3", e a roda
   * do mouse sobre ela troca de página. O círculo não é aba: os espaços ficam
   * no bloco do turno. A página é lembrada por personagem, e mirar uma magia
   * leva à página dela.
   */
  bandeja(c, mode, fixas, magias) {
    const grade = (azulejos, colunas, classe) => {
      const node = el('div', { class: `grade-acoes ${classe}` }, azulejos);
      node.style.setProperty('--colunas', colunas);
      return node;
    };
    const secaoFixa = grade(fixas, Math.ceil(fixas.length / FILEIRAS), 'grade-fixa');
    if (!magias.length) return el('div', { class: 'bandeja-acoes' }, secaoFixa);

    const maxColunas = colunasDeMagia();
    const porPagina = maxColunas * FILEIRAS;
    const paginas = Math.ceil(magias.length / porPagina);
    let pagina = Math.min(this.paginaGrade.get(c.id) ?? 0, paginas - 1);
    // Mirar uma magia leva à página dela UMA vez, quando a mira começa. Se
    // levasse a cada remontagem, as setas não sairiam do lugar enquanto a
    // mira estivesse ativa.
    const mirando = mode?.kind === 'spell' ? mode.spellId : null;
    if (mirando && mirando !== this.miradaGrade.get(c.id)) {
      const i = magias.findIndex((m) => m.sid === mirando);
      if (i >= 0) pagina = Math.floor(i / porPagina);
    }
    this.miradaGrade.set(c.id, mirando);
    this.paginaGrade.set(c.id, pagina);

    // As teclas 1–9 são das magias da página à vista; as letras de arma e de
    // ação já foram reservadas ao montar os azulejos fixos.
    const azulejos = magias.slice(pagina * porPagina, (pagina + 1) * porPagina).map((m) => {
      const n = this.hotkeys.length + 1;
      if (n <= 9) this.hotkeys.push({ run: m.run, disabled: m.desabilitado });
      return m.criar(n <= 9 ? String(n) : null);
    });
    const colunas = paginas > 1 ? maxColunas : Math.ceil(azulejos.length / FILEIRAS);
    // Na última página, os soquetes que sobram ficam vazios: as setas não
    // mudam de lugar ao trocar de página.
    if (paginas > 1) while (azulejos.length < porPagina) azulejos.push(el('span', { class: 'tile vazio', 'aria-hidden': 'true' }));
    const secaoMagias = grade(azulejos, colunas, 'grade-magias');

    const ir = (p) => { this.paginaGrade.set(c.id, (p + paginas) % paginas); this.redesenharBarra(); };
    if (paginas > 1) {
      // Um gesto de trackpad dispara dezenas de eventos de roda: sem freio,
      // cada um virava uma página. Uma troca a cada 250 ms, e a roda para na
      // primeira e na última página em vez de dar a volta.
      secaoMagias.addEventListener('wheel', (ev) => {
        ev.preventDefault();
        const agora = performance.now();
        if (agora - this.ultimaRoda < 250) return;
        const p = Math.min(paginas - 1, Math.max(0, pagina + Math.sign(ev.deltaY)));
        if (p === pagina) return;
        this.ultimaRoda = agora;
        ir(p);
      }, { passive: false });
    }

    return el('div', { class: 'bandeja-acoes' },
      secaoFixa,
      el('span', { class: 'separador', 'aria-hidden': 'true' }),
      secaoMagias,
      paginas > 1
        ? el('div', { class: 'paginador' },
          el('button', { class: 'pag', 'aria-label': 'Página anterior de magias', onclick: () => ir(pagina - 1) }, '▲'),
          el('span', { class: 'pag-num' }, `${pagina + 1}/${paginas}`),
          el('button', { class: 'pag', 'aria-label': 'Próxima página de magias', onclick: () => ir(pagina + 1) }, '▼'))
        : null);
  }

  /** Os azulejos de arma. */
  tilesAtaques(enc, c, mode, alvo = null) {
    // Criatura invocada (lobo, esqueleto): ataca com os golpes do bloco de monstro, que
    // nunca estão "guardados" e se chamam pelo nome.
    const doBloco = !c.weapons && !!c.attacks;
    const tiles = (doBloco ? c.attacks.map((a) => a.name) : (c.weapons ?? [])).map((wid, i) => {
      const w = doBloco ? (({ name, ranged, rangeFt, longRangeFt, reachFt, art }) => ({ name, ranged, rangeFt, longRangeFt, reachFt, art }))(enc.weaponAttackProfile(c, wid)) : WEAPONS[wid];
      // Arma guardada não ataca: o azulejo SACA. Custa a interação gratuita
      // do turno, ou a ação se ela já foi gasta (`custoDeInteracao`).
      if (!doBloco && !enc.empunha(c, wid)) {
        const custo = enc.custoDeInteracao(c);
        const sacar = () => this.handlers.onAction?.({ kind: 'sacar', weaponId: wid });
        return this.tile(iconeDaArma(wid, w), {
          tecla: this.reservarTecla(TECLAS_ARMA[i], sacar, !custo),
          desabilitado: !custo,
          classe: 'guardada',
          onClick: sacar,
          dica: {
            nome: `Sacar ${w.name}`,
            tipo: 'arma guardada',
            texto: `Põe ${w.name} na mão principal; a arma de agora volta para a bainha. Só se ataca com a arma na mão.`,
            custo: custo === 'acao' ? 'Ação' : null,
            linhas: [['Custo', custo === 'interacao' ? 'interação gratuita do turno' : custo === 'acao' ? 'a ação (a interação gratuita já foi usada)' : custo === 'livre' ? 'nenhum' : 'nada sobrou neste turno']],
            aviso: custo ? null : 'A interação gratuita e a ação deste turno já foram usadas',
          },
        });
      }
      const run = () => this.handlers.onAction?.({ kind: 'attack', weaponId: wid });
      const tecla = this.reservarTecla(TECLAS_ARMA[i], run, !enc.podeAtacar(c));
      // O perfil é a arma NAS MÃOS DESTE personagem: a dica mostrava "1d8
      // cortante", o dado cru da tabela, sem o modificador que o guerreiro
      // soma de verdade. O bônus de ataque é a metade que faltava da conta.
      const p = enc.weaponAttackProfile(c, wid);

      // Com um inimigo sob o cursor, o azulejo deixa de mostrar só o que a
      // arma É e passa a mostrar o que ela FAZ contra aquele alvo. A conta
      // sai de `odds.js`, a mesma que o cartão do tabuleiro usa — duas contas
      // de chance seriam duas chances diferentes no dia em que uma mudasse.
      // `rotuloDeChance` é a MESMA função que rotula a lista de inimigos, e
      // ela já resolve os quatro casos: dentro do alcance, corpo a corpo que
      // ainda tem de andar até lá, fora de alcance de verdade, e sem visão.
      // Reescrever isso aqui faria o azulejo e a lista discordarem sobre o
      // mesmo inimigo na mesma tela.
      const prev = alvo ? previsaoDeAtaque(enc, c, alvo, wid) : null;
      const rot = prev ? this.rotuloDeChance(prev, alvo) : null;

      const linhas = [
        // Acao por teste (o Olhar Apodrecedor): sem bonus, a CD do alvo.
        p.teste ? ['Teste', `${p.teste.save.toUpperCase()} CD ${p.teste.dc}`] : ['Ataque', formatModifier(p.bonus)],
        ['Dano', `${p.damage} ${p.type}`],
        ['Alcance', w.ranged ? `${w.rangeFt} pés (longo ${w.longRangeFt})` : `${w.reachFt ?? 5} pés`],
      ];
      if (rot) {
        linhas.push([`Contra ${alvo.name}`, rot.aoChegar ? `${rot.texto} ao encostar` : rot.texto]);
        if (!prev.foraDeAlcance && !prev.semVisao) linhas.push(['Dano esperado', prev.esperado.toFixed(1)]);
      }

      return this.tile(iconeDaArma(wid, w), {
        tecla,
        ativo: mode?.kind === 'attack' && mode.weaponId === wid,
        desabilitado: !enc.podeAtacar(c),
        onClick: run,
        selo: rot?.texto ?? null,
        classe: rot ? `chance-${rot.classe}` : '',
        dica: {
          nome: w.name,
          tipo: w.ranged ? 'ataque à distância' : 'ataque corpo a corpo',
          linhas,
          texto: 'Clique num inimigo para atacar. Corpo a corpo longe do alvo anda até ele primeiro, gastando movimento.',
          custo: 'Ação',
          aviso: !enc.podeAtacar(c) ? 'A ação deste turno já foi usada' : null,
        },
      });
    });
    return tiles;
  }

  tilesComuns(enc, c, mode) {
    const tiles = [];
    let proximaExtra = 0;
    const comum = (icone, nome, texto, custo, acao, desabilitado, carga = null, motivo = null) => {
      const run = () => this.handlers.onAction?.(acao);
      // Ação comum tem letra fixa (R, X, C, T) e habilidade de classe pega a
      // próxima do pote: fixar V para "Retomar o Fôlego" e V para "Ação
      // Ardilosa" quebraria em quem tivesse as duas.
      const tecla = this.reservarTecla(
        TECLAS_ACAO[acao.kind] ?? TECLAS_FEATURE[proximaExtra++],
        run,
        desabilitado,
      );
      // A CARGA NO PRÓPRIO AZULEJO. Retomar o Fôlego e Ação Surpreendente
      // mostravam as cargas numa zona "Recursos" à parte, longe do botão que
      // as gasta; agora o número fica no canto do azulejo, como a quantidade
      // de poções.
      const restam = carga ? (c.resources?.[carga] ?? 0) : null;
      const total = carga ? (c.resourcesMax?.[carga] ?? restam) : null;
      tiles.push(this.tile(iconeDeAcao(icone), {
        tecla,
        desabilitado,
        onClick: run,
        selo: carga ? restam : null,
        dica: {
          nome, texto, custo,
          linhas: carga ? [['Cargas', `${restam} de ${total}`]] : null,
          aviso: desabilitado ? (motivo ?? 'Indisponível agora') : null,
        },
      }));
    };

    comum('correr', 'Disparada', 'Dobra o deslocamento deste turno.', 'Ação', { kind: 'dash' }, c.actionUsed);
    comum('esquivar', 'Esquivar', 'Quem te ataca fica com desvantagem; seus testes de Destreza ganham vantagem.', 'Ação', { kind: 'dodge' }, c.actionUsed);
    comum('desengajar', 'Desengajar', 'Sair de perto sem sofrer ataque de oportunidade.', 'Ação', { kind: 'disengage' }, c.actionUsed);
    // Só aparecem quando valem: derrubado ou preso.
    if (hasCondition(c, 'caido') && !hasCondition(c, 'inconsciente')) {
      const custo = Math.ceil(enc.speedOf(c) / 2);
      comum('levantar', 'Levantar-se', `Fica de pé gastando metade do deslocamento (${custo} pés). Caído, você rasteja a meio passo e ataca com desvantagem.`,
        'Movimento', { kind: 'standUp' }, c.movementLeftFt < custo || custo === 0);
    }
    // Saltar por cima da tocaia, do caixote ou do buraco. Fica sempre na
    // barra; apagado, diz por que não dá agora (`destinosDoSalto`).
    if (!enc.over) {
      const pes = enc.alcanceDoSalto(c);
      const da = enc.destinosDoSalto(c).size > 0;
      const correu = enc.explorando || (c.corridaFt ?? 0) >= 10;
      const motivo = da ? null
        : hasCondition(c, 'caido') ? 'Levante-se primeiro'
          : pes < 10 ? `O salto alcança só ${pes} pés agora${correu ? '' : ': ande 3 m antes para pegar corrida'}`
            : 'Nenhum obstáculo, buraco ou terreno difícil ao alcance do salto';
      comum('pular', 'Saltar', `Salto em distância de até ${pes} pés por cima de obstáculo baixo, buraco ou terreno difícil (Força em pés com 3 m de corrida antes; metade parado). Gasta o deslocamento; obstáculo pede Atletismo CD 10, pousar em terreno difícil, Acrobacia CD 10.`,
        'Movimento', { kind: 'salto' }, !da, null, motivo);
    }
    if (hasCondition(c, 'agarrado') || hasCondition(c, 'contido') || hasCondition(c, 'presoPorVinhas')) {
      comum('escapar', 'Escapar', 'Teste de Atletismo ou Acrobacia (o melhor) contra a CD de quem prende.', 'Ação', { kind: 'escape' }, c.actionUsed);
    }

    // Examinar uma ilusão: a imagem do outro lado (Ilusão Menor, Imagem
    // Silenciosa/Maior) ou a Força Fantasmagórica que prende o próprio herói.
    const imagens = (enc.zonas ?? []).filter((z) => z.ilusao && z.lado !== c.side);
    if (imagens.length) {
      const perto = enc.ilusoesAoAlcance(c).length > 0;
      const motivo = c.actionUsed ? 'A ação deste turno já foi usada' : !perto ? 'Chegue a 1,5 m da imagem' : null;
      comum('procurar', 'Examinar a ilusão', 'Teste de Investigação (INT) contra a CD da magia. Se passar, a imagem some. Tem de estar a 1,5 m dela.',
        'Ação', { kind: 'examinar' }, Boolean(motivo), null, motivo);
    }
    if (hasCondition(c, 'iludido')) {
      comum('procurar', 'Investigar a ilusão', 'Teste de Investigação (INT) contra a CD de quem a lançou. Se passar, a Força Fantasmagórica acaba em você.',
        'Ação', { kind: 'investigar' }, c.actionUsed, null, c.actionUsed ? 'A ação deste turno já foi usada' : null);
    }

    // O último campo é o recurso de `c.resources` que a habilidade gasta.
    const feats = {
      secondWind: ['folego', 'Retomar o Fôlego', 'Recupera 1d10 + nível de pontos de vida.', 'Ação bônus', () => !c.bonusUsed && c.resources?.secondWind > 0, 'secondWind'],
      actionSurge: ['surto', 'Ação Surpreendente', 'Ganha uma ação extra neste turno.', 'Livre', () => c.resources?.actionSurge > 0, 'actionSurge'],
      preserveLife: ['preservar', 'Preservar a Vida', 'Distribui cura entre os feridos por perto.', 'Ação', () => !c.actionUsed && c.resources?.channelDivinity > 0, 'channelDivinity'],
      rage: ['furia', 'Fúria',
        `Vantagem em testes e resistências de Força, +${c.danoDeFuria ?? 2} de dano corpo a corpo com Força e resistência a contundente, perfurante e cortante. Um minuto; acaba antes se você passar um turno sem atacar nem apanhar.`,
        'Ação bônus',
        () => !c.bonusUsed && c.resources?.rage > 0 && !hasCondition(c, 'furia')
          && ARMORS[c.armor]?.categoria !== 'pesada',
        'rage'],
      // Sentido Divino e Recuperação Arcana não pedem alvo: azulejo simples.
      recklessAttack: ['descuidado', 'Ataque Descuidado',
        'Vantagem nos seus ataques corpo a corpo com Força neste turno — e quem te atacar também tem vantagem, até o seu próximo turno.',
        'Livre', () => !hasCondition(c, 'descuidado')],
      turnUndead: ['expulsar', 'Expulsar Mortos-Vivos',
        'Canalizar Divindade: todo morto-vivo a 9 m testa Sabedoria ou foge por um minuto. Do 5º nível, o mais fraco vira pó.',
        'Ação', () => !c.actionUsed && c.resources?.channelDivinity > 0, 'channelDivinity'],
      divineSmite: ['smite', 'Destruição Divina',
        'Gasta um espaço de 1º círculo e carrega o próximo golpe de arma corpo a corpo deste turno com 2d8 radiantes — 3d8 contra morto-vivo.',
        'Livre', () => !c.smitePronto && (c.spellcasting?.slots?.[1] ?? 0) > 0],
      divineSense: ['sentidoDivino', 'Sentido Divino',
        'Sente mortos-vivos, corruptores e celestiais a até 18 m — inclusive os que ninguém está vendo.',
        'Ação', () => !c.actionUsed && c.resources?.divineSense > 0, 'divineSense'],
      patientDefense: ['defesaPaciente', 'Defesa Paciente',
        'Gasta 1 ponto de ki para Esquivar: quem atacar você rola com desvantagem, e você rola DES com vantagem.',
        'Ação bônus', () => !c.bonusUsed && c.resources?.ki > 0 && !hasCondition(c, 'esquivando'), 'ki'],
      stunningStrike: ['atordoante', 'Ataque Atordoante',
        `Gasta 1 ponto de ki e carrega o próximo acerto de arma corpo a corpo deste turno: o alvo testa Constituição CD ${enc.cdDeKi(c)} ou fica atordoado até o fim do seu próximo turno.`,
        'Livre', () => !c.atordoantePronto && c.resources?.ki > 0, 'ki'],
      arcaneRecovery: ['recuperacaoArcana', 'Recuperação Arcana',
        `Fora da luta, recupera espaços de magia somando ${Math.ceil((c.level ?? 1) / 2)} círculos. Uma vez por dia.`,
        'Fora da luta', () => c.resources?.arcaneRecovery > 0 && !enc.combatants.some((o) => o.side !== c.side && !o.dead),
        'arcaneRecovery'],
    };
    for (const f of c.features ?? []) {
      // Ação Ardilosa é UMA escolha por ação bônus: dois azulejos, um por modo.
      // Passo do Vento também é UMA escolha por ação bônus: um azulejo por modo.
      if (f === 'stepOfTheWind') {
        const semKi = c.bonusUsed || !(c.resources?.ki > 0);
        comum('ventoDisparada', 'Passo do Vento: correr', 'Gasta 1 ponto de ki e dobra o deslocamento neste turno.', 'Ação bônus',
          { kind: 'feature', featureId: f, modo: 'disparada' }, semKi, 'ki');
        comum('ventoDesengajar', 'Passo do Vento: desengajar', 'Gasta 1 ponto de ki e sai de perto sem levar ataque de oportunidade.', 'Ação bônus',
          { kind: 'feature', featureId: f, modo: 'desengajar' }, semKi, 'ki');
        continue;
      }
      if (f === 'cunningAction') {
        comum('ardilosaDisparada', 'Ação Ardilosa: Disparada', 'Dobra o deslocamento como ação bônus.', 'Ação bônus',
          { kind: 'feature', featureId: f, modo: 'disparada' }, c.bonusUsed);
        comum('ardilosaDesengajar', 'Ação Ardilosa: Desengajar', 'Sai de perto sem ataque de oportunidade, como ação bônus.', 'Ação bônus',
          { kind: 'feature', featureId: f, modo: 'desengajar' }, c.bonusUsed);
        continue;
      }
      const e = feats[f];
      if (!e) continue;
      comum(e[0], e[1], e[2], e[3], { kind: 'feature', featureId: f }, !e[4](), e[5]);
    }

    const caido = enc.alliesOf(c).find(
      (a) => !a.dead && !a.stable && hasCondition(a, 'inconsciente')
        && Math.max(Math.abs(a.pos.x - c.pos.x), Math.abs(a.pos.y - c.pos.y)) === 1,
    );
    if (caido) {
      comum('estabilizar', `Estabilizar ${caido.name}`, 'Teste de Medicina CD 10. Impede a morte; não cura.', 'Ação',
        { kind: 'stabilize', targetId: caido.id }, c.actionUsed);
    }

    // Stirge grudado em si ou num aliado colado: arrancar gasta a ação.
    for (const quem of [c, ...enc.alliesOf(c).filter((a) => !a.dead && isAdjacent(a.pos, c.pos))]) {
      for (const s of enc.grudadosEm(quem)) {
        comum('estabilizar', `Arrancar ${s.name}${quem === c ? '' : ` de ${quem.name}`}`,
          'O stirge se solta e para de drenar sangue.', 'Ação',
          { kind: 'arrancarGrudado', targetId: s.id }, c.actionUsed);
      }
    }

    // Fingir de Morto: o conjurador toca o amigo que finge e desfaz a magia.
    const fingido = enc.alliesOf(c).find((a) => !a.dead && isAdjacent(a.pos, c.pos)
      && a.conditions?.some((k) => k.id === 'fingeMorto' && (!k.source || k.source === c.id)));
    if (fingido) {
      comum('estabilizar', `Acordar ${fingido.name}`, 'Toca o amigo e encerra Fingir de Morto.', 'Ação',
        { kind: 'despertar', targetId: fingido.id }, c.actionUsed);
    }

    return tiles;
  }

  /**
   * Os itens de usar da mochila.
   *
   * Ficam no fim das ações fixas, porque são o único grupo da barra que
   * ACABA: a poção some quando a última é bebida, e o resto não sai do lugar.
   *
   * O alvo sai daqui pronto quando é óbvio — beber a própria poção, o kit no
   * aliado caído ao lado. Só o arremesso pede mira.
   */
  tilesItens(enc, c, mode) {
    const lista = consumiveisDe(c);

    const caido = enc.alliesOf(c).find(
      (a) => !a.dead && !a.stable && hasCondition(a, 'inconsciente') && isAdjacent(a.pos, c.pos),
    );

    const tiles = lista.map(({ id, qtd, dados }) => {
      const arremesso = dados.consumivel === 'arremesso';
      const porBonus = dados.acao === 'bonus';
      const semEconomia = porBonus ? c.bonusUsed : c.actionUsed;

      // O kit de cura só serve se houver alguém caído ao lado. Sem isso ele
      // fica apagado com o motivo na dica, em vez de gastar a ação à toa.
      const precisaCaido = dados.consumivel === 'estabilizar';
      const alvo = precisaCaido ? caido : null;
      const semAlvo = precisaCaido && !alvo;
      const desabilitado = semEconomia || semAlvo;

      const acao = {
        kind: 'item', itemId: id, mira: arremesso,
        targetId: alvo?.id ?? null,
      };
      const run = () => this.handlers.onAction?.(acao);
      const ligado = mode?.kind === 'item' && mode.itemId === id;

      const linhas = [];
      if (dados.cura) linhas.push(['Cura', dados.cura]);
      if (dados.damage && dados.damage !== '0') linhas.push(['Dano', `${dados.damage} ${dados.damageType}`]);
      if (arremesso) linhas.push(['Alcance', `${dados.rangeFt ?? 20} pés`]);
      if (dados.usos) linhas.push(['Usos no kit', String(dados.usos)]);
      linhas.push(['Na mochila', String(qtd)]);

      return this.tile(dados.art ?? 'cura', {
        classe: 'item',
        desabilitado,
        ativo: ligado,
        onClick: run,
        selo: qtd > 1 ? qtd : null,
        dica: {
          nome: dados.name,
          tipo: dados.tipo,
          linhas,
          texto: dados.desc,
          custo: porBonus ? 'Ação bônus' : 'Ação',
          aviso: semAlvo
            ? 'Ninguém caído ao seu lado'
            : semEconomia
              ? (porBonus ? 'A ação bônus deste turno já foi usada' : 'A ação deste turno já foi usada')
              : arremesso ? 'Clique num inimigo para arremessar' : null,
        },
      });
    });

    return tiles;
  }

  /**
   * O núcleo: de quem é o turno. O retrato no medalhão existe para o jogador
   * nunca precisar conferir quem está jogando; nome, PV e CA ficam escritos
   * embaixo. As gemas de ação e bônus que moravam aqui foram para `zonaTurno`.
   */
  nucleo(c) {
    // 46: o diâmetro do vão escuro do medalhão de .nucleo-retrato.
    const retrato = makePortrait(c.look, 46);
    retrato.className = 'pixel';
    // `fracao`, e não `pct`: `pct` agora é a formatação de porcentagem que vem
    // de `rules/odds.js`, e um nome local igual ao importado é bug esperando.
    const fracao = Math.max(0, c.hp / maxHpEfetivo(c));

    return el('div', { class: 'nucleo' },
      el('div', { class: 'nucleo-retrato' }, retrato),
      el('div', { class: 'nucleo-nome' }, c.name),
      el('div', { class: 'nucleo-pv' },
        el('i', { style: { width: `${fracao * 100}%`, background: fracao > 0.5 ? '#5fd07a' : fracao > 0.25 ? '#ffc83a' : '#ff5a5a' } })),
      el('div', { class: 'nucleo-vitais' },
        el('span', {}, `${Math.max(0, Math.ceil(c.hp))}/${maxHpEfetivo(c)} PV`),
        el('span', { class: 'nucleo-ca' }, `CA ${c.ac}`)));
  }

  /**
   * A ECONOMIA DO TURNO, NUM LUGAR SÓ.
   *
   * Ação, ação bônus e reação são gemas com NOME ao lado: acesa é disponível,
   * apagada é gasta. Embaixo, o movimento que sobra. É a resposta para "o que
   * ainda me resta", e antes ela estava espalhada em três lugares: duas gemas
   * sem nome no núcleo, o medidor numa zona e a reação noutra — desenhada como
   * um botão grande, que pedia um clique que não fazia nada. A reação não se
   * clica: o ataque de oportunidade acontece sozinho.
   *
   * O botão de terminar fecha o bloco: depois de ler o que sobrou, a próxima
   * decisão é se o turno acabou.
   */
  zonaTurno(c, sobra, mode = null) {
    // Ação Surpreendente dá uma ação EXTRA. Mostrar "1" quando restam duas é
    // esconder do guerreiro o recurso que define o turno dele.
    const acoesExtras = c.resources?.actionSurge ?? 0;
    const acoesRestam = (c.actionUsed ? 0 : 1) + acoesExtras;

    // Em linha: gema e nome. A gema acesa ou apagada já diz "pronta" ou
    // "usada"; o número só aparece quando há mais de uma.
    // O rótulo é curto ("Bônus"); o nome inteiro fica na dica.
    const linha = (tipo, nome, restam, quando, texto, rotulo = nome) => this.ligarDica(
      el('div', { class: `economia-linha${restam ? '' : ' gasta'}` },
        el('span', { class: `gema-luz ${tipo}` }),
        el('span', { class: 'economia-nome' }, rotulo),
        restam > 1 ? el('span', { class: 'economia-estado' }, `×${restam}`) : null),
      { nome, tipo: quando, texto, aviso: restam ? `${restam} disponível${restam > 1 ? 'is' : ''}` : 'Já usada' },
    );

    const total = c.speedFt || 30;
    const resta = Math.max(0, c.movementLeftFt ?? 0);
    const fracao = Math.min(1, resta / total);
    // Marcas de 1,5 m (um quadrado) para o jogador contar quadrados, não pés.
    const quadrados = Math.max(1, Math.round(total / 5));
    const mov = this.ligarDica(
      el('div', { class: 'mov' },
        el('div', { class: 'mov-rot' }, el('span', {}, 'Movimento'), el('strong', {}, `${resta} pés`)),
        el('div', { class: 'mov-trilho' },
          el('i', { class: 'mov-cheio', style: { width: `${fracao * 100}%` } }),
          ...Array.from({ length: quadrados - 1 }, (_, i) => el('span', {
            class: 'mov-marca', style: { left: `${((i + 1) / quadrados) * 100}%` },
          })))),
      {
        nome: 'Deslocamento',
        linhas: [['Resta', `${resta} pés · ${Math.floor(resta / 5)} quadrados`], ['Total por turno', `${total} pés`]],
        texto: 'Clique num quadrado azul para andar. Mover não gasta a ação.',
      },
    );

    return el('div', { class: 'zona zona-turno' },
      el('div', { class: 'economia' },
        linha('acao', 'Ação', acoesRestam, 'no seu turno',
          acoesExtras
            ? 'Uma por turno — e Ação Surpreendente dá outra.'
            : 'Uma por turno: atacar, conjurar, disparada, esquivar, desengajar.'),
        linha('bonus', 'Ação bônus', c.bonusUsed ? 0 : 1, 'no seu turno',
          'Uma por turno, e só quando alguma habilidade a oferece.', 'Bônus'),
        linha('reacao', 'Reação', c.reactionUsed ? 0 : 1, 'fora do seu turno',
          'Ataque de oportunidade: quando um inimigo adjacente se afasta, você ataca de graça, sem clicar. Uma por rodada.')),
      this.espacosDeMagia(c, mode),
      mov,
      this.botaoAutoDoDono(c),
      this.botaoTerminar(c, sobra));
  }

  /**
   * Terminar o turno é irreversível e ficava com `title` do navegador. A dica
   * agora lista o que seria JOGADO FORA: ação, bônus e os pés que sobraram.
   * É o aviso que impede o clique de reflexo que custa um turno de guerreiro.
   *
   * O botão acende quando não sobra nada: nenhum azulejo ainda habilitado e
   * nenhum pé de movimento. Acender só porque a ação
   * acabou fazia o guerreiro passar a vez com a Ação Surpreendente ou o
   * Retomar o Fôlego ainda na mão.
   */
  botaoTerminar(c, sobra = true) {
    const perdas = [];
    if (!c.actionUsed) perdas.push('a ação');
    if (!c.bonusUsed) perdas.push('a ação bônus');
    if ((c.movementLeftFt ?? 0) > 0) perdas.push(`${c.movementLeftFt} pés de movimento`);
    const pronto = !sobra && (c.movementLeftFt ?? 0) <= 0;

    return this.ligarDica(
      el('button', {
        class: `btn-terminar${pronto ? ' pronto' : ''}`,
        onclick: () => this.handlers.onEndTurn?.(),
      }, el('span', { class: 'lacre' }), el('span', { class: 'btn-terminar-texto' }, 'Terminar turno'),
      el('span', { class: 'tecla-inline' }, 'espaço')),
      {
        nome: 'Terminar o turno',
        tipo: 'passa a vez',
        texto: 'Encerra o turno deste personagem e passa para o próximo do grupo que ainda não agiu.',
        atalho: 'espaço',
        aviso: perdas.length ? `Ainda resta ${perdas.join(', ')} — terminar agora joga fora.` : null,
      },
    );
  }

  /**
   * As magias, em ordem do truque ao 9º círculo.
   *
   * CADA CÍRCULO TEM COR. Truque é aço (de graça, à vontade); do 1º ao 3º,
   * metais — bronze, prata, ouro; do 4º ao 6º, gemas — esmeralda, safira,
   * rubi; do 7º ao 9º, tons arcanos. A cor está no aro do medalhão e nos
   * espaços de magia do bloco do turno, que é onde o círculo vira recurso.
   *
   * Devolve descritores, e não azulejos: a tecla 1–9 depende de a magia
   * cair na página à vista, e isso só a grade sabe (ver `renderBarra`).
   */
  magiasDe(c, mode) {
    const dc = spellSaveDc(c);
    const atk = spellAttackBonus(c);
    // Truques, preparadas e as sempre preparadas do domínio/juramento/círculo.
    return magiasProntas(c)
      .map((sid) => ({ sid, s: getSpell(sid) }))
      .sort((a, b) => a.s.level - b.s.level)
      .map(({ sid, s }) => {
        // Sem espaço do círculo dela, a magia ainda sai num círculo maior.
        const semSlot = s.level > 0 && !c.spellcasting.slots.some((n, i) => i >= s.level && n > 0);
        const dano = dadosDaMagia(s, { nivel: c.level ?? 1 });
        // Repetir uma magia ativa (Lufada, Convocar) usa a ação do `reuso`, e
        // não a de conjurar, e não gasta espaço.
        const repete = Boolean(s.reuso && c.magiasAtivas?.[sid]);
        const bonus = repete ? s.reuso === 'bonus' : s.castTime === 'bonus';
        const gasto = bonus ? c.bonusUsed : c.actionUsed;
        const explorandoAgora = Boolean(this.handlers.explorando?.());
        const foraDoCombate = Boolean(explorandoAgora && (s.soFora || UTIL_FORA.has(sid)));
        // Explorando, só a magia de utilidade sai: a de combate nem tem em quem pegar.
        const desabilitado = foraDoCombate ? semSlot && s.level > 0
          : explorandoAgora ? true
            : (semSlot && !repete) || gasto || Boolean(s.foraDeCombate || s.soFora);
        const run = () => this.handlers.onAction?.({ kind: 'spell', spellId: sid });
        return {
          sid,
          run,
          desabilitado,
          criar: (tecla) => this.focoDeCirculo(this.tile(iconeDeMagia({ ...s, id: sid }), {
            tecla,
            ativo: mode?.kind === 'spell' && mode.spellId === sid,
            desabilitado,
            classe: `circulo-${s.level}`,
            // O SELO DO CÍRCULO, no canto de cima: o numeral romano, na cor
            // dele, e "T" no truque. Só a cor do aro obrigava a decorar dez
            // cores, e aço (truque) e prata (2º) quase não se distinguem.
            // Romano, e não algarismo, porque o algarismo do canto de baixo
            // já é a tecla de atalho: "1" em cima e "1" embaixo confundia.
            selo: s.level === 0 ? 'T' : ROMANO[s.level],
            onClick: run,
            dica: {
              nome: s.name,
              tipo: s.level === 0 ? 'truque' : `magia de ${s.level}º círculo`,
              linhas: [
                s.damage ? ['Dano', `${dano}${s.damageType ? ` ${s.damageType}` : ''}`] : null,
                s.rangeFt ? ['Alcance', `${s.rangeFt} pés`] : null,
                s.kind === 'attack' ? ['Ataque de magia', formatModifier(atk)] : null,
                s.save ? ['Resistência', `${s.save} CD ${dc}`] : null,
              ],
              texto: s.desc,
              custo: repete ? `${bonus ? 'Ação bônus' : 'Ação'} · repetir, sem espaço` : foraDoCombate ? 'Fora de combate · pelo relógio' : s.foraDeCombate ? '10 minutos' : s.soFora ? 'Utilidade' : bonus ? 'Ação bônus' : 'Ação',
              aviso: foraDoCombate ? (semSlot && s.level > 0 ? `Sem espaço de ${s.level}º círculo ou maior` : 'Conjura agora: gasta espaço e o tempo passa') : s.soFora ? 'Só fora de combate (explorando e conversando)' : s.foraDeCombate ? 'Só fora de combate, no descanso' : semSlot && !repete ? `Sem espaço de ${s.level}º círculo ou maior` : gasto ? 'Recurso do turno já usado' : null,
            },
          }), s.level),
        };
      });
  }

  /**
   * Os espaços de magia, no bloco do turno: um grupo por círculo, com o
   * número e uma pedrinha por espaço, na cor do círculo. É o que o Baldur's
   * Gate 3 faz — o círculo é recurso, como a ação e o bônus, e fica sempre à
   * vista; nunca é uma aba que esconde magia.
   */
  espacosDeMagia(c, mode = null) {
    const max = c.spellcasting?.slotsMax ?? [];
    if (!c.spellcasting) return null;
    // Com uma magia de círculo na mira, os círculos em que ela pode sair
    // viram botões: clicar escolhe conjurar num círculo maior.
    const naMira = mode?.kind === 'spell' ? getSpell(mode.spellId) : null;
    // O truque abre a legenda: é ela que explica o "T" do selo nos medalhões.
    const grupos = c.spellcasting.cantrips?.length
      ? [this.focoDeCirculo(this.ligarDica(
        el('span', { class: 'espaco-circulo circulo-0' },
          el('span', { class: 'espaco-num' }, 'T'), el('span', { class: 'espaco-livre' }, 'à vontade')),
        { nome: 'Truques', texto: 'Magias de círculo 0: não gastam espaço, podem ser conjuradas todo turno.' },
      ), 0)]
      : [];
    for (let lvl = 1; lvl < max.length; lvl++) {
      const total = max[lvl] ?? 0;
      if (!total) continue;
      const tem = c.spellcasting.slots?.[lvl] ?? 0;
      const escolhivel = naMira && naMira.level > 0 && lvl >= naMira.level && tem > 0;
      const escolhido = escolhivel && mode.circulo === lvl;
      const grupo = el('span', {
        class: `espaco-circulo circulo-${lvl}${tem ? '' : ' esgotado'}${escolhivel ? ' escolhivel' : ''}${escolhido ? ' escolhido' : ''}`,
        onClick: escolhivel ? () => this.handlers.onAction?.({ kind: 'circulo', lvl }) : undefined,
      },
      el('span', { class: 'espaco-num' }, ROMANO[lvl]),
      Array.from({ length: total }, (_, i) => el('i', { class: i < tem ? 'cheio' : '' })));
      grupos.push(this.focoDeCirculo(this.ligarDica(grupo, {
        nome: `Espaços de ${lvl}º círculo`,
        linhas: [['Restam', `${tem} de ${total}`]],
        texto: escolhivel
          ? `Clique para conjurar ${naMira.name} neste círculo${lvl > naMira.level ? ' — mais forte, gasta um espaço maior' : ''}.`
          : 'Cada conjuração de magia deste círculo gasta um. Voltam num descanso longo.',
      }), lvl));
    }
    return grupos.length ? el('div', { class: 'espacos-magia' }, grupos) : null;
  }

  /**
   * Liga a magia ao espaço dela. Passar o mouse num medalhão acende o círculo
   * dele na fileira de espaços (e apaga as magias de outros círculos);
   * passar num círculo da fileira acende as magias dele na grade.
   */
  focoDeCirculo(node, lvl) {
    const ligar = (on) => {
      this.barra.classList.toggle('com-foco', on);
      for (const alvo of this.barra.querySelectorAll(`.circulo-${lvl}`)) alvo.classList.toggle('em-foco', on);
    };
    node.addEventListener('mouseenter', () => ligar(true));
    node.addEventListener('mouseleave', () => ligar(false));
    return node;
  }

  /** Remonta a barra com o mesmo estado — para a troca de página das magias. */
  redesenharBarra() {
    if (this.ultimaBarra) this.renderBarra(...this.ultimaBarra);
  }

  // ---- câmera e som ---------------------------------------------------------

  /**
   * Câmera e som. Os botões usavam `title`, que é desenho do navegador: aparece
   * com um segundo de atraso, em fonte do sistema, longe da nossa pedra e
   * latão. Agora usam a mesma dica rica do resto da tela — e o botão de som
   * perdeu o emoji: a nota musical com um corte é glifo de texto, não figura
   * do sistema operacional.
   */
  renderViewBar() {
    if (this.viewBar.childElementCount > 0) {
      this.muteBtn.className = `icon-btn${audio.muted ? ' mudo' : ''}`;
      Hud.dicas.set(this.muteBtn, this.dicaDeSom());
      this.volume.value = String(audio.muted ? 0 : Math.round(audio.volume * 100));
      return;
    }

    this.muteBtn = this.ligarDica(el('button', {
      class: `icon-btn${audio.muted ? ' mudo' : ''}`,
      'aria-label': 'Ligar ou desligar o som',
      onclick: () => { audio.unlock(); audio.toggleMute(); this.renderViewBar(); },
    }, '♪'), this.dicaDeSom());

    this.volume = el('input', {
      type: 'range', min: '0', max: '100', class: 'volume',
      value: String(Math.round(audio.volume * 100)),
      'aria-label': 'Volume',
      oninput: (e) => { audio.unlock(); audio.setVolume(Number(e.target.value) / 100); this.renderViewBar(); },
    });
    this.ligarDica(this.volume, {
      nome: 'Volume',
      texto: 'Todo o som do jogo é sintetizado na hora — não há arquivo de áudio no jogo.',
    });

    const botao = (glifo, dica, onClick) => this.ligarDica(
      el('button', { class: 'icon-btn', 'aria-label': dica.nome, onclick: onClick }, glifo),
      dica,
    );

    this.viewBar.replaceChildren(
      botao('－', {
        nome: 'Afastar',
        tipo: 'câmera',
        texto: 'Mostra mais tabuleiro. A roda do mouse faz o mesmo.',
      }, () => this.handlers.onZoom?.(1 / 1.2)),
      botao('⌖', {
        nome: 'Enquadrar de novo',
        tipo: 'câmera',
        texto: 'Volta ao enquadramento inicial, com o tabuleiro inteiro à vista.',
      }, () => this.handlers.onResetCamera?.()),
      botao('＋', {
        nome: 'Aproximar',
        tipo: 'câmera',
        texto: 'Chega perto para ver a arte das criaturas. A roda do mouse faz o mesmo.',
      }, () => this.handlers.onZoom?.(1.2)),
      el('span', { class: 'divider' }),
      this.muteBtn,
      this.volume,
    );
  }

  dicaDeSom() {
    return {
      nome: audio.muted ? 'Religar o som' : 'Silenciar',
      tipo: 'som',
      texto: 'Passos, aço, magia e queda. Tudo sintetizado por código.',
      atalho: 'M',
      aviso: audio.muted ? 'Silenciado' : null,
    };
  }
}
