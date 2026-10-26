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
import { HEROIS_COM_ARTE, MS_POR_CASA } from '../game/sala.js';
import { campoDaTaverna, caminhoNaTaverna, ehMesaDeGrupo, CORES_DO_MARCADOR, FORMAS_DO_MARCADOR } from '../game/taverna.js';
import { HEROIS, montarHeroi, escolhaAutomatica } from '../game/criacao.js';

const ALTURA_DA_PLACA = 78;   // do pé da figura até a placa do nome, em pixels do canvas
const CASAS_POR_SEGUNDO = 1000 / MS_POR_CASA;

export function criarTaverna({ aoMesa, aoSair, enviar, aoCopiarLink }) {
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
  const camada = el('div', { class: 'taverna', role: 'region', 'aria-label': 'Taverna' }, topo, personas, quadro, aviso);

  // O encontro que nunca começa: só serve para o `Board` ter o que desenhar.
  const enc = new Encounter({ battlefield: campo, party: [], foes: [], rng: makeRng(7), onLog: () => {}, onEvent: () => {} });
  let board = null;

  const semMovimento = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const avatares = new Map();       // rótulo público -> personagem desenhado
  const dados = new Map();          // id do personagem -> { nome, marcador, souEu, conectado }
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

  /** A placa do nome (e a seta, em quem é seu). Cresce quando o canvas é encolhido na tela, para o nome continuar legível. */
  function placaDoNome(ctx, c, bx, by) {
    const d = dados.get(c.id);
    if (!d) return;
    const cor = CORES_DO_MARCADOR[d.marcador.cor];
    const largura = canvas.getBoundingClientRect().width || canvas.width;
    const k = Math.max(1, Math.min(2.2, canvas.width / largura));
    const texto = d.conectado ? d.nome : `${d.nome} (ausente)`;
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
        if (ehMesaDeGrupo(t.x, t.y)) { aoMesa(); return; }
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
      dados.set(c.id, { nome: a.nome, marcador: a.marcador, souEu: a.id === visao.voce, conectado: a.conectado });
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

  function desenharPainel() {
    codigo.textContent = visao.codigo;
    const minha = visao.avatares.find((a) => a.id === visao.voce);
    // O cabeçalho e o seletor só se refazem quando algo que eles mostram mudou: refazer a cada passo de
    // qualquer jogador jogava o foco do teclado para fora do botão e redesenhava os retratos à toa.
    const assinatura = JSON.stringify([visao.avatares.map((a) => [a.id, a.nome, a.conectado, a.marcador]), visao.voce, minha?.persona]);
    if (assinatura === assinaturaDoPainel) return;
    assinaturaDoPainel = assinatura;
    jogadores.replaceChildren(...visao.avatares.map((a) => el('li', { class: `taverna-jogador${a.conectado ? '' : ' ausente'}` },
      el('span', { class: `taverna-marca forma-${FORMAS_DO_MARCADOR[a.marcador.forma]}`, style: { background: CORES_DO_MARCADOR[a.marcador.cor] }, 'aria-hidden': 'true' }),
      el('span', {}, a.nome, a.id === visao.voce ? ' (você)' : ''),
      a.conectado ? null : el('small', {}, 'desconectado'))));
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
      assinaturaDoPainel = '';
      if (!board) criarBoard();
      ultimo = performance.now();
      cancelAnimationFrame(quadroDeAnimacao);
      quadroDeAnimacao = requestAnimationFrame(quadroDaTela);
    },
    fechar() {
      if (!aberta) return;
      aberta = false;
      cancelAnimationFrame(quadroDeAnimacao);
      camada.remove();
      for (const c of [...avatares.values()]) tirar(c);
      avatares.clear(); dados.clear();
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
