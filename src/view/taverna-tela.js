// A taverna andável: a tela do lobby social (MULTIJOGADOR.md, seção 13).
//
// É o tabuleiro de verdade (`Board`) desenhando um encontro que nunca começa, como
// o fundo do menu (`menu-fundo.js`, T-17): os avatares são personagens sem uso de
// combate, e o mapa é `game/taverna.js`. Nada aqui decide regra: o servidor
// (`game/sala.js`) diz onde cada um está, e esta tela só desenha, anima o caminho
// de um ponto ao outro (T-11) e manda o clique como intenção `mover`.
//
// O que se vê de longe (T-05): a figura (a persona, ou o herói que o jogador
// pegou), o MARCADOR no chão (cor e forma, atribuído pela sala, nunca repetido) e a
// placa do nome. Quem controla um avatar vê uma seta sobre ele.

import './taverna.css';
import { el } from './hud.js';
import { Board } from './board.js';
import { aplicarAparencia } from './ficha.js';
import { makePortrait } from '../art/sheet.js';
import { audio } from '../core/audio.js';
import { Encounter } from '../rules/combat.js';
import { makeRng } from '../core/rng.js';
import { HEROIS_COM_ARTE, MS_POR_CASA, EMOTES } from '../game/sala.js';
import { campoDaTaverna, caminhoNaTaverna, ehMesaDeGrupo, ehBalcao, CORES_DO_MARCADOR, FORMAS_DO_MARCADOR } from '../game/taverna.js';
import { HEROIS, montarHeroi, escolhaAutomatica } from '../game/criacao.js';

const MS_DO_BALAO = 4500;       // quanto tempo uma frase pronta fica sobre a cabeça
const ALTURA_DA_PLACA = 78;   // do pé da figura até a placa do nome, em pixels do canvas
const CASAS_POR_SEGUNDO = 1000 / MS_POR_CASA;

export function criarTaverna({ aoMesa, aoAbrirMesa = () => {}, aoSair, enviar, aoCopiarLink }) {
  const campo = campoDaTaverna();
  const canvas = el('canvas', { class: 'board', 'aria-label': 'A taverna' });
  const quadro = el('div', { class: 'board-wrap taverna-quadro' }, canvas);
  const aviso = el('p', { class: 'taverna-aviso', role: 'status' });
  const jogadores = el('ul', { class: 'taverna-jogadores', 'aria-label': 'Quem está na taverna', 'aria-live': 'polite' });
  const codigo = el('span', { class: 'taverna-codigo', title: 'O código da sala' });
  const personas = el('div', { class: 'taverna-personas', hidden: true });
  const botaoPersona = el('button', { class: 'menu-btn', onclick: () => { audio.play('click'); personas.hidden = !personas.hidden; } }, 'Trocar de herói');
  const botaoMesa = el('button', { class: 'menu-btn primario', onclick: () => { audio.play('click'); aoMesa(); } }, 'Mesa de grupo');
  const topo = el('header', { class: 'taverna-topo' },
    el('div', { class: 'taverna-sala' }, el('span', {}, 'Sala'), codigo,
      el('button', { class: 'menu-btn', onclick: () => { audio.play('click'); aoCopiarLink(); } }, 'Copiar link')),
    jogadores,
    el('div', { class: 'taverna-acoes' }, botaoPersona, botaoMesa,
      el('button', { class: 'menu-btn', onclick: () => { audio.play('click'); aoSair(); } }, 'Sair')));
  // B1, a taverna pública: as mesas de quatro lugares. Sentar não vale nada além de formar o grupo; o dono da mesa a abre.
  const mesas = el('div', { class: 'taverna-mesas', role: 'group', 'aria-label': 'Mesas', hidden: true });
  // As frases prontas (T-14): botões embaixo do quadro; o balão aparece sobre a cabeça de quem falou.
  const frases = el('div', { class: 'taverna-frases', role: 'group', 'aria-label': 'Frases prontas' },
    ...EMOTES.map((e) => el('button', {
      class: 'taverna-frase', 'data-emote': e.id,
      onclick: () => { audio.play('click'); enviar({ tipo: 'emote', id: e.id }); },
    }, e.texto)));
  // O Toblen é o menu em forma de personagem (T-09): clicar nele ou no balcão abre este painel.
  const fecharToblen = () => { toblen.hidden = true; quadro.focus?.(); };
  const nomeDaAventura = el('strong', {}, 'A Mina Perdida de Phandelver');
  const toblen = el('div', { class: 'taverna-toblen', role: 'dialog', 'aria-label': 'Toblen Stonehill', hidden: true,
    onkeydown: (e) => { if (e.key === 'Escape') { e.stopPropagation(); fecharToblen(); } } },
    el('h2', {}, 'Toblen Stonehill'),
    el('p', { class: 'taverna-toblen-fala' }, '“Bem-vindos à Estalagem Stonehill! Sentem-se, a casa é de vocês.”'),
    el('section', {}, el('h3', {}, 'Quadro de aventuras'),
      el('p', {}, 'A campanha desta sala: ', nomeDaAventura, '. Quem abriu a sala escolhe a aventura; é a única que existe por enquanto.')),
    el('section', {}, el('h3', {}, 'Livro de saves'),
      el('p', {}, 'Cada anfitrião guarda a própria campanha. Para continuar uma, abra a sala a partir do save, pelo menu inicial.')),
    el('section', {}, el('h3', {}, 'No balcão, a ajuda'),
      el('ul', {},
        el('li', {}, 'Clique no chão para andar.'),
        el('li', {}, 'Clique na mesa redonda do centro para formar o grupo e escolher os heróis.'),
        el('li', {}, 'As frases de baixo aparecem em balão sobre a sua cabeça.'))),
    el('button', { class: 'menu-btn primario', onclick: () => { audio.play('click'); fecharToblen(); } }, 'Fechar'));
  function abrirToblen() {
    audio.play('click');
    toblen.hidden = false;
    toblen.querySelector('button')?.focus();
  }
  quadro.append(toblen);
  const camada = el('div', { class: 'taverna', role: 'region', 'aria-label': 'Taverna' }, topo, personas, quadro, mesas, frases, aviso);

  // O encontro que nunca começa: só serve para o `Board` ter o que desenhar.
  const enc = new Encounter({ battlefield: campo, party: [], foes: [], rng: makeRng(7), onLog: () => {}, onEvent: () => {} });
  let board = null;

  const semMovimento = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const avatares = new Map();       // rótulo público -> personagem desenhado
  const dados = new Map();          // id do personagem -> { nome, marcador, souEu, conectado, emote?: { texto, ate } }
  const emotesVistos = new Map();   // rótulo público -> o `emoteN` que já foi mostrado (ou ignorado)
  const retratos = new Map();       // herói -> retrato já desenhado (o painel de personas se refaz, os retratos não)
  let aberta = false;
  let quadroDeAnimacao = 0;
  let ultimo = 0;
  let visao = null;
  let assinaturaDoPainel = '';

  // ---- o que se desenha por cima da figura ---------------------------------------------

  /** O marcador no chão: a cor e a forma que a sala deu ao jogador. */
  function marcadorNoChao(ctx, c, bx, by) {
    const d = dados.get(c.id);
    if (!d) return;
    const cor = CORES_DO_MARCADOR[d.marcador.cor];
    ctx.save();
    if (!d.conectado) ctx.globalAlpha = 0.45;
    ctx.lineWidth = d.souEu ? 4 : 3;
    ctx.strokeStyle = cor;
    ctx.fillStyle = `${cor}55`;
    ctx.beginPath();
    if (FORMAS_DO_MARCADOR[d.marcador.forma] === 'circulo') {
      ctx.ellipse(bx, by, 22, 11, 0, 0, Math.PI * 2);
    } else {
      ctx.moveTo(bx, by - 12); ctx.lineTo(bx + 26, by); ctx.lineTo(bx, by + 12); ctx.lineTo(bx - 26, by); ctx.closePath();
    }
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  /** O balão da frase pronta, logo acima da placa do nome. */
  function balaoDaFrase(ctx, c, bx, by, k) {
    const d = dados.get(c.id);
    if (!d?.emote) return;
    if (performance.now() > d.emote.ate) { d.emote = null; return; }
    ctx.save();
    ctx.font = `600 ${Math.round(14 * k)}px Georgia, serif`;
    ctx.textAlign = 'center';
    const w = Math.ceil(ctx.measureText(d.emote.texto).width) + 18 * k;
    const h = 24 * k;
    const x = Math.round(bx - w / 2);
    const y = Math.round(by - ALTURA_DA_PLACA - (k - 1) * 10 - 20 * k - h);
    ctx.fillStyle = '#f7efd8';
    ctx.strokeStyle = '#3a2f22';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 8 * k);
    ctx.moveTo(bx - 5 * k, y + h); ctx.lineTo(bx, y + h + 7 * k); ctx.lineTo(bx + 5 * k, y + h);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#2a2118';
    ctx.fillText(d.emote.texto, bx, y + h * 0.7);
    ctx.restore();
  }

  /** A placa do nome (e a seta, em quem é seu). Cresce quando o canvas é encolhido na tela, para o nome continuar legível. */
  function placaDoNome(ctx, c, bx, by) {
    const d = dados.get(c.id);
    if (!d) return;
    const cor = CORES_DO_MARCADOR[d.marcador.cor];
    const largura = canvas.getBoundingClientRect().width || canvas.width;
    const k = Math.max(1, Math.min(2.2, canvas.width / largura));
    const texto = d.conectado ? d.nome : `${d.nome} (ausente)`;
    balaoDaFrase(ctx, c, bx, by, k);
    ctx.save();
    if (!d.conectado) ctx.globalAlpha = 0.6;
    ctx.font = `600 ${Math.round(13 * k)}px Georgia, serif`;
    ctx.textAlign = 'center';
    const w = Math.ceil(ctx.measureText(texto).width) + 16 * k;
    const h = 20 * k;
    const x = Math.round(bx - w / 2);
    const y = Math.round(by - ALTURA_DA_PLACA - (k - 1) * 10);
    ctx.fillStyle = 'rgba(16, 14, 22, .82)';
    ctx.strokeStyle = cor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 6 * k);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = d.souEu ? '#ffe9a8' : '#f4ecd8';
    ctx.fillText(texto, bx, y + h * 0.72);
    if (d.souEu) {
      const sy = y - 5 + (semMovimento ? 0 : Math.sin(performance.now() / 260) * 2);
      ctx.fillStyle = cor;
      ctx.strokeStyle = '#14121a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(bx - 7 * k, sy - 9 * k); ctx.lineTo(bx + 7 * k, sy - 9 * k); ctx.lineTo(bx, sy);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  function criarBoard() {
    board = new Board(canvas, {
      encounter: enc,
      onTileClick: (t) => {
        if (!visao || visao.fase !== 'lobby') return;
        if (ehMesaDeGrupo(t.x, t.y)) { if (visao.publica) { mesas.scrollIntoView?.({ block: 'nearest' }); return; } aoMesa(); return; }
        if (ehBalcao(t.x, t.y)) { abrirToblen(); return; }
        enviar({ tipo: 'mover', x: t.x, y: t.y });
      },
      onTileHover: () => {},
    });
    board.soCenario = true;      // sem anel nem barra de vida: é cena, não jogo
    board.aoPes = marcadorNoChao;
    board.aoCima = placaDoNome;
    // Em desenvolvimento, dá para dirigir a taverna pelo console (`__taverna.clicarCasa(x, y)`), como o `__app` do jogo.
    if (import.meta.env?.DEV) {
      window.__taverna = {
        board,
        clicarCasa(x, y) {
          const { sx, sy } = board.center(x, y);
          const r = canvas.getBoundingClientRect();
          canvas.dispatchEvent(new MouseEvent('click', { clientX: r.left + sx * (r.width / canvas.width), clientY: r.top + sy * (r.height / canvas.height), bubbles: true }));
        },
      };
    }
  }

  function quadroDaTela(agora) {
    if (!aberta) return;
    const dt = Math.min(0.1, (agora - ultimo) / 1000 || 0);
    ultimo = agora;
    board.render(dt);
    quadroDeAnimacao = requestAnimationFrame(quadroDaTela);
  }

  // ---- sincronizar com a sala --------------------------------------------------------------

  function novoPersonagem(a) {
    // O herói de verdade (a ficha pronta, com as escolhas automáticas): é ele que o jogador vai jogar.
    const c = montarHeroi(a.figura, escolhaAutomatica(a.figura));
    c.id = `avatar-${a.id}`;
    c.name = a.nome;
    c.pos = { x: a.x, y: a.y };
    c.facingVec = { dx: 0, dy: -1 };
    aplicarAparencia(c);
    return c;
  }

  /** Tira um avatar do desenho, com as caminhadas que ainda andavam por ele: o mesmo id volta a ser usado. */
  function tirar(c) {
    board.fx.cancel(c.id);
    const i = enc.combatants.indexOf(c);
    if (i >= 0) enc.combatants.splice(i, 1);
    dados.delete(c.id);
  }

  function sincronizar() {
    const presentes = new Set();
    for (const a of visao.avatares) {
      presentes.add(a.id);
      let c = avatares.get(a.id);
      // Mudou de figura (pegou um herói, ou trocou de persona): desenha de novo, na mesma casa.
      if (c && c.figura !== a.figura) {
        tirar(c);
        avatares.delete(a.id);
        c = null;
      }
      if (!c) {
        c = novoPersonagem(a);
        c.figura = a.figura;
        enc.combatants.push(c);
        avatares.set(a.id, c);
      } else if (c.pos.x !== a.x || c.pos.y !== a.y) {
        // Outra caminhada começa enquanto a anterior ainda anda: a velha sai, e a nova parte de ONDE A FIGURA
        // ESTÁ DESENHADA (não do destino antigo), senão ela saltava para o fim do trajeto velho.
        const andando = board.fx.positionFor(c.id);
        board.fx.cancel(c.id, 'walk');
        const de = andando ? { x: Math.round(andando.x), y: Math.round(andando.y) } : { ...c.pos };
        const caminho = semMovimento ? [] : caminhoNaTaverna(campo, de, { x: a.x, y: a.y }, new Set());
        c.pos = { x: a.x, y: a.y };
        if (caminho.length > 1) {
          const u = caminho[caminho.length - 1]; const p = caminho[caminho.length - 2];
          c.facingVec = { dx: u.x - p.x, dy: u.y - p.y };
          board.fx.walk(c, caminho, { andar: 'passo', tilesPerSecond: CASAS_POR_SEGUNDO });
        } else {
          c.facingVec = { dx: Math.sign(a.x - de.x), dy: Math.sign(a.y - de.y) };
        }
      }
      // Uma frase nova (o contador subiu): abre o balão. A primeira vez que se vê um avatar só anota o contador,
      // para quem entra não ver a frase velha de quem já estava falando.
      const antes = dados.get(c.id);
      let emote = antes?.emote ?? null;
      const visto = emotesVistos.get(a.id);
      if (visto !== undefined && a.emote && a.emoteN > visto) {
        const e = EMOTES.find((x) => x.id === a.emote);
        if (e) emote = { texto: e.texto, ate: performance.now() + MS_DO_BALAO };
      }
      emotesVistos.set(a.id, a.emoteN ?? 0);
      dados.set(c.id, { nome: a.nome, marcador: a.marcador, souEu: a.id === visao.voce, conectado: a.conectado, emote });
    }
    for (const [id, c] of [...avatares]) {
      if (presentes.has(id)) continue;
      tirar(c);
      avatares.delete(id);
    }
  }

  function retratoDe(id) {
    if (retratos.has(id)) return retratos.get(id);
    let rosto = null;
    try { rosto = makePortrait(HEROIS.find((x) => x.id === id).look, 40); rosto.className = 'pixel'; } catch { rosto = null; }
    retratos.set(id, rosto);
    return rosto;
  }

  /** As mesas da taverna pública: quem está sentado (o primeiro é o dono), sentar, levantar e abrir a sala do grupo. */
  function desenharMesas() {
    mesas.hidden = !visao.publica;
    if (!visao.publica) { mesas.replaceChildren(); return; }
    const nomeDe = (pub) => visao.jogadores.find((j) => j.id === pub)?.nome ?? '?';
    const minhaMesa = visao.mesas.findIndex((m) => m.lugares.includes(visao.voce));
    mesas.replaceChildren(...visao.mesas.map((m, i) => {
      const sou = minhaMesa === i;
      const dono = m.lugares[0] === visao.voce;
      return el('div', { class: `taverna-mesa${sou ? ' minha' : ''}` },
        el('strong', {}, `Mesa ${i + 1}`),
        m.lugares.length ? el('small', { class: 'taverna-mesa-info' }, `A Mina Perdida · mesa de ${nomeDe(m.lugares[0])}${m.lugares.length >= 4 ? ' · cheia' : ' · aberta'}`) : null,
        el('span', { class: 'taverna-lugares' }, m.lugares.length ? m.lugares.map((p, k) => `${nomeDe(p)}${k === 0 ? ' ★' : ''}`).join(', ') : 'vazia', el('small', {}, ` ${m.lugares.length}/4`)),
        sou
          ? el('span', { class: 'taverna-mesa-acoes' },
            dono ? el('button', { class: 'menu-btn primario', title: 'Abre a sala privada do grupo e leva a mesa toda', onclick: () => { audio.play('click'); aoAbrirMesa(); } }, 'Abrir a sala') : null,
            el('button', { class: 'menu-btn', onclick: () => { audio.play('click'); enviar({ tipo: 'levantar' }); } }, 'Levantar'))
          : el('button', { class: 'menu-btn', disabled: m.lugares.length >= 4, onclick: () => { audio.play('click'); enviar({ tipo: 'sentar', mesa: i }); } }, m.lugares.length >= 4 ? 'Cheia' : 'Sentar'));
    }));
  }

  function desenharPainel() {
    codigo.textContent = visao.publica ? 'pública' : visao.codigo;
    botaoMesa.hidden = Boolean(visao.publica);
    const minha = visao.avatares.find((a) => a.id === visao.voce);
    // O cabeçalho e o seletor só se refazem quando algo que eles mostram mudou: refazer a cada passo de
    // qualquer jogador jogava o foco do teclado para fora do botão e redesenhava os retratos à toa.
    const assinatura = JSON.stringify([visao.avatares.map((a) => [a.id, a.nome, a.conectado, a.marcador]), visao.voce, minha?.persona, visao.mesas]);
    if (assinatura === assinaturaDoPainel) return;
    assinaturaDoPainel = assinatura;
    // Uma taverna pública tem até 16 pessoas: a faixa mostra só quantas, e os nomes aparecem nas placas do salão.
    if (visao.publica) {
      jogadores.replaceChildren(el('li', { class: 'taverna-jogador', title: visao.avatares.map((a) => a.nome).join(', ') }, `${visao.avatares.length} na taverna`));
    } else jogadores.replaceChildren(...visao.avatares.map((a) => el('li', { class: `taverna-jogador${a.conectado ? '' : ' ausente'}` },
      el('span', { class: `taverna-marca forma-${FORMAS_DO_MARCADOR[a.marcador.forma]}`, style: { background: CORES_DO_MARCADOR[a.marcador.cor] }, 'aria-hidden': 'true' }),
      el('span', {}, a.nome, a.id === visao.voce ? ' (você)' : ''),
      a.conectado ? null : el('small', {}, 'desconectado'))));
    desenharMesas();
    const foco = document.activeElement?.dataset?.persona;
    personas.replaceChildren(...HEROIS_COM_ARTE.map((id) => {
      const h = HEROIS.find((x) => x.id === id);
      const rosto = retratoDe(id);
      return el('button', {
        class: `taverna-persona${minha?.persona === id ? ' ativa' : ''}`,
        'data-persona': id,
        title: `${h.name}, ${h.className}`,
        'aria-label': `Ser ${h.name}`,
        'aria-pressed': String(minha?.persona === id),
        onclick: () => { audio.play('click'); enviar({ tipo: 'persona', heroi: id }); personas.hidden = true; botaoPersona.focus(); },
      }, rosto ? rosto.cloneNode(true) : null, el('span', {}, h.name));
    }));
    if (foco) personas.querySelector(`[data-persona="${foco}"]`)?.focus();
    botaoPersona.title = 'A figura da taverna: enquanto você não pega um herói na mesa de grupo';
  }

  return {
    /** A taverna está na tela? (O menu usa para não tocar a música do título por cima.) */
    aberta: () => aberta,
    /** Mostra a taverna. Chamar `atualizar` em seguida com o estado da sala. */
    abrir(parent) {
      if (aberta) return;
      parent.append(camada);
      aberta = true;
      audio.ambiente('taverna');      // burburinho, lareira e canecas
      assinaturaDoPainel = '';
      if (!board) criarBoard();
      ultimo = performance.now();
      cancelAnimationFrame(quadroDeAnimacao);
      quadroDeAnimacao = requestAnimationFrame(quadroDaTela);
    },
    fechar() {
      if (!aberta) return;
      aberta = false;
      audio.ambiente(null);
      cancelAnimationFrame(quadroDeAnimacao);
      camada.remove();
      for (const c of [...avatares.values()]) tirar(c);
      avatares.clear(); dados.clear(); emotesVistos.clear();
      visao = null;
      personas.hidden = true;
    },
    /** O menu abriu por cima (a mesa de grupo): a taverna não recebe foco nem Tab enquanto isso. */
    bloquear(sim) { camada.inert = Boolean(sim); },
    /** Ao voltar da mesa de grupo, o foco volta ao botão que a abriu. */
    focarMesa() { botaoMesa.focus(); },
    /** O estado da sala mudou: avatares, nomes, a lista de gente. */
    atualizar(v) {
      visao = v;
      if (!aberta || !board) return;
      sincronizar();
      desenharPainel();
    },
    /** Uma frase de ajuda embaixo (erros do servidor: "devagar", "não dá para chegar lá"). */
    avisar(texto) {
      aviso.textContent = texto ?? '';
      aviso.classList.toggle('visivel', Boolean(texto));
    },
  };
}
