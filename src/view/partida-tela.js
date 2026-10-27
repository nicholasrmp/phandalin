// A PARTIDA VISTA DE QUEM NÃO A RODA (F4.2).
//
// O anfitrião roda o jogo (A-01) e publica a vista (`game/partida-vista.js`). Aqui o navegador dos outros
// jogadores monta o MESMO mapa pelo nome, põe os combatentes que chegam num `Encounter` que nunca começa
// (o precedente da taverna, T-17) e deixa o `Board` desenhar. Não há regra aqui e, por ora, nenhum controle:
// a F4.3 manda as intenções (andar) para o anfitrião.

import './taverna.css';
import { el } from './hud.js';
import { Board } from './board.js';
import { aplicarAparencia } from './ficha.js';
import { audio } from '../core/audio.js';
import { narrarLocal, definirVoto } from './narrativa.js';
import { getSpell, opcoesDaMagia } from '../rules/spells.js';
import { UTIL_FORA } from '../rules/utilidade.js';
import { mandaNaHora, escolheVarios } from '../game/acoes.js';
import { possoEscolher } from '../game/decisao.js';
import { abrirTelaVila } from './vila.js';
import { abrirMenuContexto } from './menu-contexto.js';
import { diarioParaTela } from '../game/diario.js';
import { makePortrait } from '../art/sheet.js';
import { estadoAparente } from '../game/interacoes.js';
import { temEscuridaoEm, visaoDoGrupo } from '../rules/luz.js';
import { telaDoCartao } from './nivel-tela.js';
import { telaDoDescansoRemoto } from './descanso-tela.js';
import { abrirLojaLocal } from './loja.js';
import { criarFicha } from './ficha.js';
import { LOJAS } from '../game/comercio.js';
import pinturaDaRegiao from '../art/vila/regiao.webp';
import { Encounter } from '../rules/combat.js';
import { Battlefield } from '../core/grid.js';
import { makeRng } from '../core/rng.js';
import { mapaDo } from '../game/encounter.js';
import { montarCampo } from '../game/campo.js';
import { lerVista, aplicarVista, desempacotarEvento } from '../game/partida-vista.js';
import { criarReceptor, lerDelta } from '../game/partida-delta.js';
import { playWeaponVisual, playSpellVisual, andarDe, mostrarAlfinete, mostrarFrase, CORES_DOS_JOGADORES } from './visuals.js';
import { FRASES_DA_PARTIDA, MARCAS_DO_MAPA } from '../game/sala.js';

const CASAS_POR_SEGUNDO = 5;
const SALTO_MAXIMO = 14;       // mais longe que isto (teletransporte, mapa novo) a figura aparece no destino, sem caminhar

export function criarPartidaTela({ aoSair, enviar = () => false, hud = null }) {
  const canvas = el('canvas', { class: 'board', 'aria-label': 'A partida' });
  const quadro = el('div', { class: 'board-wrap taverna-quadro' }, canvas);
  const titulo = el('span', { class: 'partida-titulo' }, 'Partida');
  const fase = el('span', { class: 'partida-fase' });
  const conexao = el('span', { class: 'conexao-ruim', hidden: true, role: 'status' });
  const aviso = el('p', { class: 'taverna-aviso visivel', role: 'status' }, 'Esperando o anfitrião mostrar a partida…');
  const grupo = el('ul', { class: 'partida-herois', 'aria-label': 'Os heróis do grupo' });
  const inimigosEl = el('ul', { class: 'partida-inimigos', 'aria-label': 'Os inimigos à vista', hidden: true });
  const jogadoresEl = el('ul', { class: 'partida-jogadores', 'aria-label': 'Quem está na sala' });
  const barraEm = hud?.barra?.parentNode ?? null;   // onde a barra de ações mora quando não há partida de sala
  const lugarDaBarra = el('div', { class: 'partida-barra' });
  const terminar = el('button', { class: 'menu-btn primario', hidden: true, onclick: () => { audio.play('click'); if (selecionado) enviar({ tipo: 'agir', acao: 'terminar', heroi: selecionado.id }); } }, 'Terminar turno do herói');
  const fichaBtn = el('button', { class: 'menu-btn', hidden: true, title: 'A ficha e o inventário do seu herói', onclick: () => { audio.play('click'); abrirFicha(selecionado); } }, 'Ficha');
  const descanso = el('button', { class: 'menu-btn', hidden: true, title: 'Pede um descanso curto (uma hora): o grupo vota', onclick: () => { audio.play('click'); menuDescanso.hidden = true; enviar({ tipo: 'agir', acao: 'descanso' }); } }, 'Descanso rápido');
  const diarioBtn = el('button', { class: 'menu-btn', title: 'Missões e pistas do grupo', onclick: () => { audio.play('click'); alternarPainel('diario'); } }, 'Diário');
  const registroBtn = el('button', { class: 'menu-btn', title: 'Rolagens e acontecimentos', onclick: () => { audio.play('click'); alternarPainel('registro'); } }, 'Registro');
  const descansoLongo = el('button', { class: 'menu-btn', hidden: true, title: 'Pede um descanso longo (oito horas): o grupo vota', onclick: () => { audio.play('click'); menuDescanso.hidden = true; enviar({ tipo: 'agir', acao: 'descanso', descanso: 'longo' }); } }, 'Descanso longo');
  // Os dois descansos moram num só botão ("Descanso ▾"): a barra de cima fica curta.
  const menuDescanso = el('div', { class: 'partida-menu-descanso', hidden: true }, descanso, descansoLongo);
  const botaoDescanso = el('button', { class: 'menu-btn', hidden: true, 'aria-haspopup': 'true', title: 'Pede um descanso: o grupo vota', onclick: () => { audio.play('click'); menuDescanso.hidden = !menuDescanso.hidden; descanso.hidden = false; descansoLongo.hidden = false; } }, 'Descanso ▾');
  const caixaDescanso = el('span', { class: 'partida-descanso' }, botaoDescanso, menuDescanso);
  // Frases prontas (sem texto livre): um balão sobre o seu herói, para todos.
  const menuFrases = el('div', { class: 'partida-menu-descanso', hidden: true }, ...FRASES_DA_PARTIDA.map((f) => el('button', { class: 'menu-btn', onclick: () => { audio.play('click'); menuFrases.hidden = true; enviar({ tipo: 'agir', acao: 'frase', id: f.id }); } }, f.texto)));
  const botaoFrases = el('button', { class: 'menu-btn', 'aria-haspopup': 'true', title: 'Frases prontas (aparecem sobre o seu herói)', onclick: () => { audio.play('click'); menuFrases.hidden = !menuFrases.hidden; } }, 'Frases ▾');
  const caixaFrases = el('span', { class: 'partida-descanso' }, botaoFrases, menuFrases);
  const prontoBtn = el('button', { class: 'menu-btn', title: 'Marca que você não tem mais o que fazer nesta cena; as decisões de saída mostram quem está pronto', onclick: () => { audio.play('click'); prontoDaCena = !prontoDaCena; enviar({ tipo: 'agir', acao: 'pronto-cena', valor: prontoDaCena }); desenharPronto(); } }, 'Pronto');
  const camada = el('div', { class: 'taverna partida', role: 'region', 'aria-label': 'Partida' },
    el('header', { class: 'taverna-topo partida-topo' },
      el('div', { class: 'partida-linha' }, el('div', { class: 'taverna-sala' }, titulo, fase, conexao), jogadoresEl,
        el('div', { class: 'taverna-acoes' }, prontoBtn, caixaFrases, diarioBtn, registroBtn, fichaBtn, caixaDescanso, terminar, el('button', { class: 'menu-btn', onclick: () => { audio.play('click'); aoSair(); } }, 'Sair'))), grupo, inimigosEl),
    quadro, lugarDaBarra, aviso);

  let aberta = false;
  let enc = null; let board = null; let variante = null;
  let quadroDeAnimacao = 0; let ultimo = 0;
  let pendente = null;          // a última vista que chegou antes de a tela abrir
  let visaoDaSala = null;
  let avisoTimer = null;
  let diario = { missoes: [], pistas: [] };   // o que o anfitrião mostra no Diário (vem na vista)
  const registro = [];                        // as linhas do registro, as mais novas no fim
  let painelAberto = null; let painelEl = null;
  let prontoDaCena = false;     // este jogador marcou "pronto para sair"
  let prontosDaCena = [];        // quem está pronto (ids públicos), vindo da vista
  const desenharPronto = () => { prontoBtn.classList.toggle('primario', prontoDaCena); prontoBtn.textContent = prontoDaCena ? 'Pronto ✓' : 'Pronto'; };
  let selecionado = null;
  let emModo = null;            // a ação da barra que espera um clique no tabuleiro (ataque, magia com alvo…)
  const narrativas = new Map(); // id da narrativa aberta -> AbortController (o anfitrião a fecha por fora)

  function montar(v) {
    variante = v.variante;
    const mapa = mapaDo(variante);
    enc = new Encounter({ battlefield: montarCampo(mapa), party: [], foes: [], rng: makeRng(7), onLog: () => {}, onEvent: () => {} });
    board = new Board(canvas, { encounter: enc, onTileClick: clicar, onTileHover: () => {} });
    board.onTileContext = pedirContexto;
    board.filtroDeVisao = (c) => visaoDaSala?.herois?.[c.id] === visaoDaSala?.voce;   // F4.4: vê o que os SEUS heróis veem
    if (import.meta.env?.DEV) window.__partida = { board, enc };
  }

  function desmontar() {
    cancelAnimationFrame(quadroDeAnimacao);
    enc = null; board = null; variante = null;
  }

  const souLider = () => Boolean(visaoDaSala) && visaoDaSala.lider === visaoDaSala.voce;
  const meus = () => (enc?.combatants ?? []).filter((c) => c.side === 'party' && !c.dead && c.hp > 0 && visaoDaSala?.herois?.[c.id] === visaoDaSala?.voce);

  function destacar() {
    board?.setOverlay?.({ selected: selecionado });
    desenharGrupo();
    // A barra de ações é a do anfitrião, com o mesmo código (`view/hud.js`), desenhada com o espelho da partida.
    if (hud && enc) { try { hud.update(enc, selecionado, emModo); } catch (e) { console.warn('a barra de ações não desenhou o espelho', e); } }
  }

  /** Só se escolhe herói MEU (a barra mostra o grupo todo, mas o resto é do dono). */
  function selecionar(c) {
    if (!meus().includes(c)) return;
    selecionado = c; emModo = null; audio.play('click'); destacar();
  }

  const limpa = (a) => Object.fromEntries(Object.entries(a).filter(([k, v]) => ['kind', 'weaponId', 'spellId', 'itemId', 'targetId', 'featureId', 'modo', 'zona', 'mira', 'opcao'].includes(k) && v !== undefined && v !== null));

  function usar(action, tiles = []) {
    if (!selecionado) return;
    const heroi = selecionado.id; const circulo = emModo?.circulo ?? null;
    // Magia que pede uma escolha (Aprimorar Atributo, Glifo de Proteção): quem conjura escolhe aqui, na tela dele.
    const spell = action.kind === 'spell' ? getSpell(action.spellId) : null;
    const lista = spell && !action.opcao ? opcoesDaMagia(spell) : null;
    if (lista) {
      emModo = null; destacar();
      abrirMenuContexto(document.getElementById('app'), {
        x: NaN, y: NaN, titulo: spell.name, subtitulo: 'escolha uma opção',
        opcoes: lista.map((o) => ({ rotulo: o.rotulo, detalhe: o.detalhe, fazer: () => enviar({ tipo: 'agir', acao: 'usar', heroi, action: limpa({ ...action, opcao: o.id }), circulo, tiles }) })),
      });
      return;
    }
    enviar({ tipo: 'agir', acao: 'usar', heroi, action: limpa(action), circulo, tiles });
    emModo = null;
    destacar();
  }

  /** Uma ação da barra: manda na hora (correr, esquivar, magia sem alvo) ou entra em modo de alvo, como no jogo do anfitrião. */
  function acao(a) {
    if (!enc || enc.side !== 'party') return;
    if (!selecionado || !meus().includes(selecionado)) { selecionado = meus()[0] ?? null; if (!selecionado) return; }
    if (a.kind === 'circulo') {
      if (emModo?.kind !== 'spell') return;
      emModo = { ...emModo, circulo: a.lvl, alvos: (emModo.alvos ?? []).slice(0, enc.alvosDaMagia(getSpell(emModo.spellId), a.lvl, selecionado)) };
      destacar();
      return;
    }
    const spell = a.kind === 'spell' ? getSpell(a.spellId) : null;
    // Explorando, a magia de utilidade sai na hora: o anfitrião a conjura e pergunta o resto (alvo, ritual) pela narrativa.
    if (spell && enc.explorando && UTIL_FORA.has(a.spellId)) { usar(a); return; }
    if (mandaNaHora(a, spell, selecionado.magiasAtivas?.[a.spellId])) { usar(a); return; }
    if (a.kind === 'spell' && emModo?.kind === 'spell' && emModo.spellId === a.spellId && emModo.alvos?.length) { usar(emModo, emModo.alvos); return; }
    const igual = emModo && emModo.kind === a.kind && emModo.weaponId === a.weaponId && emModo.spellId === a.spellId && emModo.itemId === a.itemId;
    emModo = igual ? null : { ...a, circulo: spell ? enc.circuloDeConjuracao(selecionado, spell) : undefined, alvos: [] };
    destacar();
  }

  function terminarHeroi() {
    if (selecionado) enviar({ tipo: 'agir', acao: 'terminar', heroi: selecionado.id });
  }

  /** F4.3: clicar num herói MEU o escolhe; clicar numa casa manda o herói escolhido andar (o anfitrião aplica). */
  function clicar(t, e) {
    if (!enc) return;
    // Alt+clique: um alfinete no mapa, para todos verem.
    if (e?.altKey) {
      abrirMenuContexto(document.getElementById('app'), {
        x: e.clientX, y: e.clientY, titulo: 'Marcar no mapa', subtitulo: 'todos veem',
        opcoes: MARCAS_DO_MAPA.map((m) => ({ rotulo: m.texto, icone: 'acao-procurar', fazer: () => enviar({ tipo: 'agir', acao: 'alfinete', x: t.x, y: t.y, marca: m.id }) })),
      });
      return;
    }
    const noLugar = enc.at?.(t.x, t.y);
    // Com uma ação da barra na mira, o clique escolhe o ALVO dela (a magia de vários alvos junta casas até completar).
    if (emModo && selecionado) {
      const spell = emModo.kind === 'spell' ? getSpell(emModo.spellId) : null;
      if (spell && escolheVarios(spell)) {
        emModo = { ...emModo, alvos: [...(emModo.alvos ?? []), { x: t.x, y: t.y }] };
        const quantos = enc.alvosDaMagia(spell, emModo.circulo ?? enc.circuloDeConjuracao(selecionado, spell), selecionado);
        if (emModo.alvos.length >= quantos) usar(emModo, emModo.alvos); else destacar();
        return;
      }
      usar(emModo, [{ x: t.x, y: t.y }]);
      return;
    }
    if (noLugar && meus().includes(noLugar)) { selecionado = noLugar; audio.play('click'); destacar(); return; }
    if (!selecionado || !meus().includes(selecionado)) { selecionado = meus()[0] ?? null; destacar(); }
    if (!selecionado) { aviso.textContent = 'Você não tem nenhum herói em campo.'; aviso.classList.add('visivel'); return; }
    aviso.classList.remove('visivel');
    // F5: clicar num inimigo é atacar com a arma na mão; o anfitrião confere alcance e ação e diz por que não deu.
    if (noLugar && noLugar.side !== 'party' && !noLugar.dead && noLugar.hp > 0) {
      enviar({ tipo: 'agir', acao: 'atacar', heroi: selecionado.id, alvo: noLugar.id, arma: selecionado.equippedWeapon ?? null });
      return;
    }
    if (noLugar) return;
    enviar({ tipo: 'agir', acao: 'mover', heroi: selecionado.id, x: t.x, y: t.y });
  }

  // ---- o Diário e o Registro: o que o anfitrião lê, o convidado lê igual (J-09) -----------------------------------------------

  function desenharPainel() {
    if (!painelAberto) return;
    painelEl ??= el('aside', { class: 'partida-painel', role: 'dialog' });
    const fechar = el('button', { class: 'menu-btn', onclick: () => alternarPainel(painelAberto) }, 'Fechar');
    if (painelAberto === 'diario') {
      painelEl.replaceChildren(
        el('h3', {}, 'Diário'), el('h4', {}, 'Missões'),
        diario.missoes.length
          ? el('ul', {}, ...diario.missoes.map((m) => el('li', { class: m.estado === 'feita' ? 'feita' : '' },
            el('strong', {}, m.titulo), el('small', {}, ` — de ${m.de}${m.recompensa ? ` · ${m.recompensa}` : ''}`), el('p', {}, m.texto))))
          : el('p', {}, 'Nenhuma ainda.'),
        el('h4', {}, 'Pistas'),
        diario.pistas.length ? el('ul', {}, ...diario.pistas.map((p) => el('li', {}, p))) : el('p', {}, 'Nenhuma ainda.'),
        fechar);
    } else {
      painelEl.replaceChildren(
        el('h3', {}, 'Registro'),
        registro.length
          ? el('ul', { class: 'partida-registro' }, ...registro.slice(-120).map((r) => el('li', { class: `log-${r.kind}` }, r.text, r.detail ? el('small', {}, ` ${r.detail}`) : null)))
          : el('p', {}, 'Nada ainda.'),
        fechar);
      painelEl.querySelector('.partida-registro')?.lastElementChild?.scrollIntoView?.({ block: 'end' });
    }
    if (!painelEl.isConnected) camada.append(painelEl);
  }

  function alternarPainel(qual) {
    if (painelAberto === qual) { painelAberto = null; painelEl?.remove(); return; }
    painelAberto = qual;
    desenharPainel();
  }

  // ---- o descanso curto: a tabela do anfitrião, com os dados do meu herói na minha mão ------------------------------------------

  let descansoAberto = null;
  const ehMeuHeroi = (id) => visaoDaSala?.herois?.[id] === visaoDaSala?.voce;

  function descansoRemoto(msg) {
    if (!aberta) return;
    if (!descansoAberto) {
      const ctl = new AbortController();
      const tela = telaDoDescansoRemoto(document.getElementById('app'), {
        titulo: msg.titulo, texto: msg.texto, sinal: ctl.signal, narrarFn: narrarLocal,
        ehMeu: ehMeuHeroi,
        aoGastar: (heroi) => enviar({ tipo: 'agir', acao: 'descanso-dado', heroi, id: msg.id }),
        aoMagia: (heroi, spellId, circulo) => enviar({ tipo: 'agir', acao: 'descanso-magia', heroi, id: msg.id, spellId, circulo }),
      });
      descansoAberto = { id: msg.id, ctl, tela };
      // Fechar a página (ou o anfitrião encerrar) é ficar pronto: o jogo só segue quando todos terminam ou o tempo acaba.
      tela.fim.then(() => {
        const heroi = Object.keys(visaoDaSala?.herois ?? {}).find(ehMeuHeroi);
        if (descansoAberto?.id === msg.id && !ctl.signal.aborted && heroi) enviar({ tipo: 'agir', acao: 'descanso-pronto', heroi, id: msg.id });
        if (descansoAberto?.id === msg.id) descansoAberto = null;
      });
    }
    if (descansoAberto.id === msg.id) descansoAberto.tela.atualizar(msg);
  }

  // ---- Interagir: o botão direito numa casa (o anfitrião monta o menu do SEU herói e devolve) -----------------------------------

  let ondeAbrir = { x: 200, y: 200 };

  function pedirContexto(t, e) {
    if (!enc || !selecionado || !meus().includes(selecionado)) selecionado = meus()[0] ?? null;
    if (!selecionado) return;
    ondeAbrir = { x: e.clientX, y: e.clientY };
    emModo = null;
    enviar({ tipo: 'agir', acao: 'contexto', heroi: selecionado.id, x: t.x, y: t.y });
  }

  function abrirContextoRemoto(msg) {
    if (msg.para !== visaoDaSala?.voce || !aberta) return;
    abrirMenuContexto(document.getElementById('app'), {
      ...ondeAbrir, titulo: msg.titulo, subtitulo: msg.subtitulo, alvo: msg.alvo,
      opcoes: msg.opcoes.map((o) => ({
        ...o,
        // A ficha e a seleção acontecem na tela de quem clicou, não na do anfitrião.
        fazer: o.local === 'ficha' ? () => { const c = enc?.combatants.find((x) => x.id === o.alvoId); if (c) abrirFicha(c, true); }
          : o.local === 'selecionar' ? () => { const c = enc?.combatants.find((x) => x.id === o.alvoId); if (c) selecionar(c); }
            : () => enviar({ tipo: 'agir', acao: 'contexto-escolher', heroi: msg.heroi, idx: o.i }),
      })),
      aoPrevia: (o) => board?.setOverlay({ targets: o?.previa ? [{ pos: o.previa }] : null }),
    });
  }

  /** A narrativa do anfitrião (A-02): todos leem; só o líder escolhe, e o índice volta ao anfitrião. */
  function narrativa(msg) {
    if (msg.tipo === 'contexto-abrir') { abrirContextoRemoto(msg); return; }
    if (msg.tipo === 'descanso-estado') { descansoRemoto(msg); return; }
    if (msg.tipo === 'descanso-fechar') { descansoAberto?.ctl.abort(); descansoAberto = null; return; }
    if (msg.tipo === 'nivel-abrir' || msg.tipo === 'nivel-fechar') {
      if (msg.para !== visaoDaSala?.voce) return;
      if (msg.tipo === 'nivel-fechar') { narrativas.get(`nivel${msg.id}`)?.abort(); narrativas.delete(`nivel${msg.id}`); return; }
      if (!aberta) return;
      const ctl = new AbortController();
      narrativas.set(`nivel${msg.id}`, ctl);
      telaDoCartao(document.getElementById('app'), msg.dados, { sinal: ctl.signal, narrarFn: narrarLocal }).then((selecoes) => {
        if (!narrativas.delete(`nivel${msg.id}`)) return;    // o anfitrião já fechou (acabou o tempo)
        enviar({ tipo: 'agir', acao: 'nivel', heroi: msg.dados.heroi, id: msg.id, selecoes });
      });
      return;
    }
    if (msg.tipo === 'loja-abrir') { abrirLojaRemota(msg); return; }
    if (msg.tipo === 'loja-fechar') { fecharLojaRemota(); return; }
    // O placar da votação: o relógio do anfitrião não é o meu, então conta-se o que RESTA a partir de agora.
    if (msg.tipo === 'voto') { definirVoto({ nomes: msg.nomes, votaram: msg.votaram, fim: msg.restam != null ? Date.now() + msg.restam : null }); return; }
    if (msg.tipo === 'fechar') { definirVoto(null); narrativas.get(msg.id)?.abort(); narrativas.delete(msg.id); return; }
    if (msg.tipo !== 'abrir' || !aberta) return;
    const p = msg.pedido;
    const ctl = new AbortController();
    narrativas.set(msg.id, ctl);
    // J-20 (como no Baldur's Gate 3): o jogador do personagem que começou a cena escolhe; numa decisão geral todos votam; quem não
    // decide lê as mesmas escolhas, sem poder clicar. O anfitrião diz quem é quem no pedido (`decide`).
    const eu = visaoDaSala?.voce;
    const decide = p.decide ?? null;
    const escolhe = Boolean(p.escolhas) && possoEscolher(decide, eu);
    const votando = decide?.modo === 'votacao';
    narrarLocal(document.getElementById('app'), {
      formato: p.formato, lista: p.lista, pular: false,
      paginas: p.paginas.map((pg) => ({ titulo: pg.titulo, texto: pg.texto, teste: pg.teste, retrato: pg.retrato })),
      escolhas: p.escolhas ? p.escolhas.map((e) => ({ rotulo: e.rotulo, detalhe: e.detalhe, motivo: e.motivo, primaria: e.primaria, valor: e.indice })) : null,
      nota: decide?.titulo || null,
      soLeitura: Boolean(p.escolhas) && !escolhe,
      aoVotar: escolhe && votando ? (indice) => enviar({ tipo: 'resposta', id: msg.id, indice }) : null,
      sinal: ctl.signal,
    }).then((r) => {
      narrativas.delete(msg.id);
      // Texto sem escolha: ao virar a última página, o jogador segue a cena por todos (qualquer um pode, como o anfitrião).
      if (!p.escolhas && !ctl.signal.aborted) { enviar({ tipo: 'resposta', id: msg.id, indice: null, continuar: true }); return; }
      // Quem decide por ser o dono da cena responde pelo clique (o voto já foi enviado por `aoVotar`).
      if (!escolhe || votando || ctl.signal.aborted) return;
      enviar({ tipo: 'resposta', id: msg.id, indice: Number.isInteger(r) ? r : null });
    });
  }

  /**
   * Os eventos do motor que o anfitrião mandou junto da vista (F5.3): o lado visual do `onEvent` dele. Cada golpe ou magia
   * abre uma janela de impacto, e o dano, a cura e a queda que vêm depois chegam quando o golpe chega. Devolve os ids de quem
   * já andou por evento (a caminhada exata, com o caminho), para a caminhada por diferença de casa não repetir.
   */
  function reproduzir(dados) {
    const andaram = new Set();
    let atraso = 0;           // segundos até o impacto do golpe ou da magia em curso
    let fila = 0;             // um golpe por vez: cada um começa um pouco depois do anterior
    const noImpacto = (fn) => setTimeout(() => { if (board) fn(); }, (fila + atraso) * 1000);
    for (const dado of dados) {
      const ev = desempacotarEvento(enc, dado);
      try {
        switch (ev.type) {
          case 'alfinete': {
            const i = Math.max(0, (visaoDaSala?.jogadores ?? []).findIndex((j) => j.id === ev.de));
            mostrarAlfinete(board, { x: ev.x, y: ev.y }, visaoDaSala?.jogadores?.[i]?.nome ?? '?', CORES_DOS_JOGADORES[i % CORES_DOS_JOGADORES.length], ev.marca);
            break;
          }
          case 'frase': {
            const f = FRASES_DA_PARTIDA.find((x) => x.id === ev.id);
            const h = enc.combatants.find((c) => visaoDaSala?.herois?.[c.id] === ev.de && !c.dead && c.hp > 0);
            const k = Math.max(0, (visaoDaSala?.jogadores ?? []).findIndex((j) => j.id === ev.de));
            if (f && h?.pos) mostrarFrase(board, h.pos, f.texto, CORES_DOS_JOGADORES[k % CORES_DOS_JOGADORES.length]);
            break;
          }
          case 'log': registro.push({ kind: ev.kind, text: ev.text, detail: ev.detail }); if (registro.length > 300) registro.shift(); if (painelAberto === 'registro') desenharPainel(); break;
          case 'moved': {
            if (!ev.actor || !ev.path?.length) break;
            ev.actor.facingVec = { dx: ev.to.x - ev.from.x, dy: ev.to.y - ev.from.y };
            board.fx.cancel(ev.actor.id, 'walk');
            board.fx.walk(ev.actor, ev.path, { andar: ev.voo ? 'voo' : andarDe(ev.actor) });
            andaram.add(ev.actor.id);
            break;
          }
          case 'attack': {
            const { attacker: a, target: t } = ev;
            if (!a || !t) break;
            a.facingVec = { dx: t.pos.x - a.pos.x, dy: t.pos.y - a.pos.y };
            fila += 0.35;
            atraso = playWeaponVisual(board, ev, { startDelay: board.fx.walkTimeLeft ?? 0 }) ?? 0;
            break;
          }
          case 'spell': {
            if (!ev.caster) break;
            fila += 0.35;
            atraso = playSpellVisual(board, ev) ?? 0;
            break;
          }
          case 'damage':
            if (ev.target) noImpacto(() => { board.floatText(ev.target.pos, `-${Math.round(ev.amount)}`, '#ff6a6a', ev.amount >= 10); board.bump(0.22); });
            break;
          case 'heal':
            if (ev.target && ev.amount > 0) noImpacto(() => { audio.play('heal'); board.floatText(ev.target.pos, `+${Math.round(ev.amount)}`, '#6ee89a'); board.fx.ring(ev.target.pos, { color: '#6ee89a', radius: 28, dur: 0.5, width: 2 }); });
            break;
          case 'downed':
          case 'died':
            if (ev.target) noImpacto(() => { board.floatText(ev.target.pos, '✖', '#ff4b4b', true); board.fx.impact(ev.target.pos, { color: '#8a2b2b', count: 14, spread: 40, dur: 0.6 }); audio.play('down'); });
            break;
          case 'reinforcements':
            audio.play('down');
            for (const u of ev.units ?? []) if (u?.pos) { board.fx.ring(u.pos, { color: '#ff6a4b', radius: 44, dur: 0.7 }); board.floatText(u.pos, '!', '#ff6a4b', true); }
            break;
          case 'ignite': if (ev.target) { board.fx.flames(ev.target.pos, { color: '#ff6a2a', count: 6, dur: 0.7, scale: 1.2 }); board.floatText(ev.target.pos, 'pegou fogo!', '#ff8a3a'); } break;
          case 'burn': if (ev.target) board.fx.flames(ev.target.pos, { color: '#ff6a2a', count: 4, dur: 0.45 }); break;
          case 'redirect': if (ev.from && ev.to) { board.floatText(ev.from.pos, 'empurrado!', '#ffc83a'); board.fx.ring(ev.to.pos, { color: '#ffc83a', radius: 26, dur: 0.4, width: 2 }); } break;
          case 'invocado': if (ev.criatura?.pos) board.fx.ring(ev.criatura.pos, { color: '#8fe6a8', radius: 46, dur: 0.7, width: 3 }); break;
          case 'sumiu': if (ev.de) board.fx.ring(ev.de, { color: '#bfe6ff', radius: 40, dur: 0.6, width: 2 }); break;
          case 'voltou': if (ev.to) board.fx.ring(ev.to, { color: '#bfe6ff', radius: 40, dur: 0.6, width: 2 }); break;
          case 'iniciativa': audio.play('initiative'); break;
          default: break;
        }
      } catch (e) { console.warn(`o evento ${dado?.type} não se reproduziu na tela de quem assiste`, e); }
    }
    return andaram;
  }

  // ---- a loja e a ficha do SEU herói (F6.4) -------------------------------------------------

  const vilaHerois = new Map();     // os heróis da vila (a vila não tem encontro): objetos que o anfitrião atualiza a cada vista
  let lojaApi = null;
  let fichaRemota = null;

  const ehMeu = (c) => Boolean(c) && visaoDaSala?.herois?.[c.id] === visaoDaSala?.voce;
  const meusDaVila = () => [...vilaHerois.values()].filter((c) => !c.dead && ehMeu(c));

  /** A ficha do herói do jogador: ver, equipar e beber poção. Quem executa é o anfitrião; a ficha redesenha quando ele responde. */
  function abrirFicha(c, qualquerDoGrupo = false) {
    const alvo = (c && (qualquerDoGrupo || ehMeu(c)) ? c : null) ?? meus()[0] ?? meusDaVila()[0];
    if (!alvo) { aviso.textContent = 'Você não tem herói para abrir a ficha.'; aviso.classList.add('visivel'); return; }
    fichaRemota ??= criarFicha(document.getElementById('app'), {
      podeEquipar: (p, slot, id) => {
        enviar({ tipo: 'agir', acao: 'equipar', heroi: p.id, slot, item: id ?? null });
        return 'Pedido enviado ao anfitrião: a ficha muda quando ele responder.';
      },
      onUsar: (p, id) => { enviar({ tipo: 'agir', acao: 'usar', heroi: p.id, action: { kind: 'item', itemId: id } }); return { ok: true }; },
      // Preparar: a ficha troca no espelho na hora e o anfitrião confere (a próxima vista desfaz o que ele recusar).
      podePreparar: () => (enc && !(enc.side === 'party' && !enc.over) ? 'dá para preparar magias só no turno do grupo' : null),
      onPreparar: (p) => enviar({ tipo: 'agir', acao: 'preparar', heroi: p.id, lista: [...(p.spellcasting?.prepared ?? [])] }),
    });
    fichaRemota.abrir(alvo, 'inventario');
  }

  /** O anfitrião abriu uma loja: este jogador compra e vende só para o herói DELE (o dinheiro é do grupo). */
  function abrirLojaRemota(msg) {
    fecharLojaRemota();
    const def = LOJAS[msg.lojaId];
    const grupoDaLoja = vilaHerois.size ? [...vilaHerois.values()] : (enc?.combatants.filter((c) => c.side === 'party') ?? []);
    if (!def || !grupoDaLoja.length) return;
    abrirLojaLocal(document.getElementById('app'), {
      loja: def, npc: msg.npc, grupo: grupoDaLoja, aoMudar: () => {},
      podeUsar: ehMeu,
      acoes: {
        comprar: (heroi, l) => { enviar({ tipo: 'agir', acao: 'comprar', heroi: heroi.id, item: l.id }); return { ok: true, pendente: true }; },
        vender: (heroi, v) => { enviar({ tipo: 'agir', acao: 'vender', heroi: heroi.id, item: v.id }); return { ok: true, pendente: true }; },
      },
      onFicha: (c) => abrirFicha(c),
      ligar: (api) => { lojaApi = api; },
    }).then(() => { lojaApi = null; });
  }

  function fecharLojaRemota() { lojaApi?.fechar(); lojaApi = null; }

  /** O anfitrião mandou os heróis da vila: põe no espelho (os mesmos objetos) e redesenha o que está aberto. */
  function espelharHerois(lista) {
    const vistos = new Set();
    for (const nova of lista) {
      vistos.add(nova.id);
      const c = vilaHerois.get(nova.id);
      if (!c) { vilaHerois.set(nova.id, nova); continue; }
      for (const k of Object.keys(c)) if (!(k in nova)) delete c[k];
      Object.assign(c, nova);
    }
    for (const id of [...vilaHerois.keys()]) if (!vistos.has(id)) vilaHerois.delete(id);
    for (const c of vilaHerois.values()) aplicarAparencia(c);
    lojaApi?.desenhar();
    fichaRemota?.atualizar();
  }

  // ---- a vila e a região, vistas de fora (F6.3) ------------------------------------------

  let vilaTela = null;
  let vilaObj = null;
  let vilaAssinatura = null;

  function fecharVila() {
    vilaTela?.fechar();
    vilaTela = null; vilaObj = null; vilaAssinatura = null;
  }

  /** O mapa que o anfitrião mostra: a mesma tela da vila (`view/vila.js`), com o clique virando VOTO no destino. */
  function mostrarVila(snap) {
    const assinatura = `${snap.chave}|${snap.lugares.map((l) => l.id).join(',')}`;
    if (vilaTela && assinatura !== vilaAssinatura) fecharVila();
    if (!vilaTela) {
      vilaObj = {
        titulo: snap.titulo, classe: snap.classe, proporcao: snap.proporcao,
        pintura: snap.chave === 'regiao' ? pinturaDaRegiao : undefined,
        lugares: snap.lugares, estado: { missoes: {}, pistas: [], registro: [] }, missoes: {},
        grupo: [], momento: () => vilaObj.__momento, dinheiro: () => vilaObj.__dinheiro,
        aberto: (l) => !l.fechado, novidade: (l) => l.novidade,
        onLugar: (l) => { audio.play('click'); enviar({ tipo: 'agir', acao: 'lugar', lugar: l.id }); },
        onMenu: () => aoSair(), onFicha: (c) => abrirFicha(vilaHerois.get(c?.id) ?? c),
        botoes: [
          { rotulo: 'Descanso rápido', dica: 'Pede um descanso curto: o grupo vota', fazer: () => enviar({ tipo: 'agir', acao: 'descanso' }) },
          ...(snap.acoes ?? []).filter((a) => a.id !== 'dormir').map((a) => ({ rotulo: a.rotulo, dica: a.dica, fazer: () => enviar({ tipo: 'agir', acao: 'vila-acao', qual: a.id }) })),
        ],
        ...((snap.acoes ?? []).some((a) => a.id === 'dormir') ? { onDormir: () => enviar({ tipo: 'agir', acao: 'vila-acao', qual: 'dormir' }) } : {}),
      };
      vilaAssinatura = assinatura;
      vilaObj.__momento = snap.momento; vilaObj.__dinheiro = snap.dinheiro;
      vilaObj.grupo = snap.grupo.map((c) => ({ ...c, maxHp: c.maxHp, conditions: [] }));
      vilaTela = abrirTelaVila(document.getElementById('app'), vilaObj);
    }
    vilaObj.__momento = snap.momento; vilaObj.__dinheiro = snap.dinheiro;
    if (snap.diario) { const t = diarioParaTela(snap.diario); vilaObj.estado = t.estado; vilaObj.missoes = t.defs; diario = snap.diario; }
    vilaObj.grupo = snap.grupo.map((c) => ({ ...c, conditions: [] }));
    if (snap.herois) espelharHerois(snap.herois);
    vilaObj.lugares.forEach((l, i) => Object.assign(l, snap.lugares[i]));
    // O que o anfitrião diz da votação (quem votou em quê) fica nos pinos e na frase do alto.
    const porId = snap.votos ?? {};
    vilaObj.__votos = porId;
    vilaTela.atualizar();
    const faixaEl = document.querySelector('.vila .vila-votacao');
    if (faixaEl) faixaEl.textContent = snap.faixa ?? '';
    for (const pino of document.querySelectorAll('.vila .vila-pino')) {
      const id = [...snap.lugares].find((l) => l.nome === pino.querySelector('span')?.textContent)?.id;
      const n = porId[id]?.length ?? 0;
      pino.dataset.votos = n ? String(n) : '';
      if (n) pino.title = `${pino.querySelector('span')?.textContent} — votaram: ${porId[id].join(', ')}`;
    }
  }

  /** Mais de um passo: o caminho que o motor do cliente acha; se não acha, ou é longe demais, a figura aparece no destino. */
  function caminhar(m) {
    const { c, de, para } = m;
    board.fx.cancel(c.id, 'walk');
    const d = Math.max(Math.abs(de.x - para.x), Math.abs(de.y - para.y));
    if (d > SALTO_MAXIMO) return;
    const alcancados = enc.field.reachable(de, 600, () => false);
    const caminho = Battlefield.pathFrom(alcancados, para);
    if (caminho.length > 1) board.fx.walk(c, caminho, { andar: 'passo', tilesPerSecond: CASAS_POR_SEGUNDO });
  }

  function desenharGrupo() {
    const herois = enc?.combatants.filter((c) => c.side === 'party') ?? [];
    const dono = (id) => {
      const pub = visaoDaSala?.herois?.[id];
      return visaoDaSala?.jogadores?.find((j) => j.id === pub)?.nome ?? (pub ? 'Piloto automático' : '');
    };
    const emLuta = Boolean(enc) && !enc.combatants.every((c) => c.side === 'party');
    const corDe = (pub) => CORES_DOS_JOGADORES[Math.max(0, (visaoDaSala?.jogadores ?? []).findIndex((j) => j.id === pub)) % CORES_DOS_JOGADORES.length];
    // Quem está na sala: a cor de cada um (a mesma do alfinete), o nome, e ✓ de quem já está pronto para sair da cena.
    jogadoresEl.replaceChildren(...(visaoDaSala?.jogadores ?? []).map((j) => el('li', {
      class: `partida-jogador${j.conectado ? '' : ' ausente'}${prontosDaCena.includes(j.id) ? ' pronto' : ''}`,
      title: `${j.nome}${j.id === visaoDaSala.voce ? ' (você)' : ''}${j.conectado ? '' : ' — desconectado'}${prontosDaCena.includes(j.id) ? ' — pronto para sair' : ''}`,
    }, el('i', { style: { background: corDe(j.id) } }), el('span', {}, j.nome), prontosDaCena.includes(j.id) ? el('b', {}, '✓') : null)));
    grupo.replaceChildren(...herois.map((c) => {
      const pub = visaoDaSala?.herois?.[c.id];
      const meu = Boolean(pub) && pub === visaoDaSala?.voce;
      // Em luta, o herói mostra o que ainda tem no turno.
      const turno = emLuta && enc.side === 'party' ? (c.acted ? 'turno encerrado' : `ação ${c.actionUsed ? 'usada' : 'livre'} · ${Math.max(0, c.movementLeftFt ?? 0)} ft`) : '';
      // Desenhado a cada vez, como no HUD: a arte nova (a folha do PixelLab) chega depois, e um retrato guardado cedo ficaria o antigo.
      let retrato = null;
      try { retrato = makePortrait(c.look, 28); retrato.className = 'pixel'; } catch { retrato = null; }
      const frac = Math.max(0, Math.min(1, c.hp / (c.maxHp || 1)));
      return el('li', {
        class: `partida-heroi${meu ? ' meu' : ''}${meu && c === selecionado ? ' selecionado' : ''}${c.hp <= 0 ? ' caido' : ''}`,
        title: `${c.name}: ${Math.max(0, c.hp)}/${c.maxHp} PV${pub ? ` · ${dono(c.id)}` : ''}`,
        onclick: meu ? () => selecionar(c) : null,
      },
      retrato ?? el('span', { class: 'sem-retrato' }),
      el('span', { class: 'partida-heroi-dados' },
        el('strong', {}, c.name),
        el('small', {}, pub ? el('i', { style: { background: corDe(pub) } }) : null, dono(c.id) || 'sem dono'),
        el('span', { class: 'partida-vida' }, el('i', { style: { width: `${Math.round(frac * 100)}%` } })),
        turno && meu ? el('small', {}, turno) : null),
      el('span', { class: 'partida-pv' }, `${Math.max(0, c.hp)}/${c.maxHp}`));
    }));
    // Em luta: quem é o inimigo à vista e como ele parece (do inimigo só a palavra, como no jogo do anfitrião), e de quem é a vez.
    const noEscuro = Boolean(enc) && temEscuridaoEm(enc);
    const vistas = noEscuro ? visaoDoGrupo(enc) : null;
    const inimigos = emLuta ? enc.combatants.filter((c) => c.side !== 'party' && c.side !== 'neutro' && !c.dead && c.hp > 0 && (!vistas || vistas.has(`${c.pos.x},${c.pos.y}`))) : [];
    inimigosEl.hidden = !inimigos.length;
    inimigosEl.replaceChildren(...inimigos.map((c) => {
      const estado = estadoAparente(c);
      return el('li', { class: `partida-inimigo estado-${String(estado).toLowerCase().replace(/\s+/g, '-')}`, title: `${c.name}: ${estado}` },
        el('strong', {}, c.name), el('small', {}, estado));
    }));
    terminar.hidden = hud != null || !(emLuta && enc.side === 'party' && selecionado && !selecionado.acted);
    botaoDescanso.hidden = emLuta || !enc;   // só explorando
    if (botaoDescanso.hidden) menuDescanso.hidden = true;
    fichaBtn.hidden = !selecionado;
    const faltam = emLuta && enc.side === 'party' ? herois.filter((c) => c.hp > 0 && !c.acted).length : 0;
    fase.textContent = emLuta ? (enc.side === 'party' ? `Rodada ${enc.round}: vez do grupo${faltam ? ` · faltam ${faltam} herói${faltam > 1 ? 's' : ''}` : ''}` : `Rodada ${enc.round}: vez dos inimigos`) : '';
  }

  const receptor = criarReceptor();

  function receber(bruto) {
    // Completa (guarda como base) ou diferença (junta à base; sem base, espera a próxima completa).
    let v = lerVista(bruto);
    if (v) receptor.receber(v);
    else {
      const d = lerDelta(bruto);
      if (!d) return;
      v = receptor.aplicar(d);
      if (!v) return;
    }
    if (!aberta) { pendente = v; return; }
    if (v.variante === 'vila' && v.extras?.vila) { mostrarVila(v.extras.vila); aviso.classList.remove('visivel'); return; }
    if (vilaTela) { fecharVila(); vilaHerois.clear(); fecharLojaRemota(); }
    if (!enc || variante !== v.variante) { if (board) desmontar(); montar(v); if (aberta) loop(); }
    const { moveram } = aplicarVista(enc, v);
    for (const c of enc.combatants) aplicarAparencia(c);
    const explorando = Boolean(v.extras?.explorando);
    if (v.extras?.prontos) {
      prontosDaCena = v.extras.prontos;
      prontoDaCena = prontosDaCena.includes(visaoDaSala?.voce);
      desenharPronto();
    }
    enc.explorando = explorando;
    document.getElementById('app')?.classList.toggle('explorando', explorando);
    if (v.extras?.diario) { diario = v.extras.diario; if (painelAberto === 'diario') desenharPainel(); }
    const andaram = reproduzir(v.extras?.eventos ?? []);
    for (const m of moveram) if (!andaram.has(m.c.id)) caminhar(m);
    // Herói caído (a 0 PV) não fica na mira: passa para o próximo dos meus que ainda está de pé.
    if (!selecionado || !meus().includes(selecionado)) selecionado = meus()[0] ?? null;
    if (!board.focoJaEnquadrado) {
      board.focoJaEnquadrado = true;
      const lider = meus()[0] ?? enc.combatants.find((x) => x.side === 'party');   // a tela de cada jogador começa no herói DELE
      board.focoInicial = lider?.pos ? { ...lider.pos } : null;
      requestAnimationFrame(() => board?.enquadrarGrande?.(board.focoInicial));
    }
    aviso.classList.remove('visivel');
    destacar();
    fichaRemota?.atualizar();
    // Cada jogador vai aonde quiser e a tela dele segue o herói dele (só recentra quando ele sai do miolo do quadro).
    if (selecionado?.pos) board.seguir?.(selecionado.pos);
  }

  function quadroDaTela(agora) {
    if (!aberta || !board) return;
    const dt = Math.min(0.1, (agora - ultimo) / 1000 || 0);
    ultimo = agora;
    board.render(dt);
    quadroDeAnimacao = requestAnimationFrame(quadroDaTela);
  }
  function loop() {
    cancelAnimationFrame(quadroDeAnimacao);
    ultimo = performance.now();
    quadroDeAnimacao = requestAnimationFrame(quadroDaTela);
  }

  return {
    aberta: () => aberta,
    explorando: () => Boolean(enc?.explorando),
    abrir(parent) {
      if (aberta) return;
      parent.append(camada);
      if (hud) lugarDaBarra.append(hud.barra);
      aberta = true;
      if (pendente) { const v = pendente; pendente = null; receber(v); }
    },
    fechar() {
      if (!aberta) return;
      aberta = false;
      camada.remove();
      document.getElementById('app')?.classList.remove('explorando');
      painelAberto = null; painelEl?.remove(); painelEl = null;
      fecharLojaRemota();
      fichaRemota?.fechar();
      fecharVila();
      if (hud && barraEm) barraEm.append(hud.barra);
      for (const ctl of narrativas.values()) ctl.abort();
      narrativas.clear();
      selecionado = null; emModo = null;
      desmontar();
      pendente = null;
      aviso.classList.add('visivel');
    },
    /** A vista da partida chegou (o anfitrião publicou). */
    vista: receber,
    /** Uma página da narrativa (ou o fim dela). */
    narrativa,
    /** A barra de ações do HUD, vista de fora: escolher herói, usar ação, terminar o turno do herói. */
    selecionar,
    acao,
    terminar: terminarHeroi,
    /** O anfitrião explicou por que o passo foi ignorado. */
    avisar(texto) {
      aviso.textContent = texto;
      aviso.classList.add('visivel');
      clearTimeout(avisoTimer);
      avisoTimer = setTimeout(() => aviso.classList.remove('visivel'), 3500);
    },
    /** O estado da sala mudou: quem joga com quem, o nome do anfitrião. */
    /** A conexão deste navegador com a sala: só aparece quando algo vai mal. */
    status(s) {
      const texto = { reconectando: 'Reconectando…', caiu: 'Sem conexão com a sala', conectando: 'Conectando…' }[s] ?? '';
      conexao.textContent = texto;
      conexao.hidden = !texto;
    },
    atualizarSala(v) {
      visaoDaSala = v;
      const anf = v.jogadores.find((j) => j.id === v.anfitriao);
      titulo.textContent = `Partida de ${anf?.nome ?? 'o anfitrião'} · sala ${v.codigo}`;
      if (enc) desenharGrupo();
    },
  };
}
