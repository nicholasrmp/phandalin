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
import { narrarLocal } from './narrativa.js';
import { getSpell } from '../rules/spells.js';
import { mandaNaHora, escolheVarios } from '../game/acoes.js';
import { Encounter } from '../rules/combat.js';
import { Battlefield } from '../core/grid.js';
import { makeRng } from '../core/rng.js';
import { mapaDo } from '../game/encounter.js';
import { montarCampo } from '../game/campo.js';
import { lerVista, aplicarVista, desempacotarEvento } from '../game/partida-vista.js';
import { playWeaponVisual, playSpellVisual, andarDe } from './visuals.js';

const CASAS_POR_SEGUNDO = 5;
const SALTO_MAXIMO = 14;       // mais longe que isto (teletransporte, mapa novo) a figura aparece no destino, sem caminhar

export function criarPartidaTela({ aoSair, enviar = () => false, hud = null }) {
  const canvas = el('canvas', { class: 'board', 'aria-label': 'A partida' });
  const quadro = el('div', { class: 'board-wrap taverna-quadro' }, canvas);
  const titulo = el('span', { class: 'partida-titulo' }, 'Partida');
  const fase = el('span', { class: 'partida-fase' });
  const aviso = el('p', { class: 'taverna-aviso visivel', role: 'status' }, 'Esperando o anfitrião mostrar a partida…');
  const grupo = el('ul', { class: 'taverna-jogadores', 'aria-label': 'Quem joga com quem' });
  const barraEm = hud?.barra?.parentNode ?? null;   // onde a barra de ações mora quando não há partida de sala
  const lugarDaBarra = el('div', { class: 'partida-barra' });
  const terminar = el('button', { class: 'menu-btn primario', hidden: true, onclick: () => { audio.play('click'); if (selecionado) enviar({ tipo: 'agir', acao: 'terminar', heroi: selecionado.id }); } }, 'Terminar turno do herói');
  const camada = el('div', { class: 'taverna partida', role: 'region', 'aria-label': 'Partida' },
    el('header', { class: 'taverna-topo' }, el('div', { class: 'taverna-sala' }, titulo, fase), grupo,
      el('div', { class: 'taverna-acoes' }, terminar, el('button', { class: 'menu-btn', onclick: () => { audio.play('click'); aoSair(); } }, 'Sair'))),
    quadro, lugarDaBarra, aviso);

  let aberta = false;
  let enc = null; let board = null; let variante = null;
  let quadroDeAnimacao = 0; let ultimo = 0;
  let pendente = null;          // a última vista que chegou antes de a tela abrir
  let visaoDaSala = null;
  let avisoTimer = null;
  let selecionado = null;
  let emModo = null;            // a ação da barra que espera um clique no tabuleiro (ataque, magia com alvo…)
  const narrativas = new Map(); // id da narrativa aberta -> AbortController (o anfitrião a fecha por fora)

  function montar(v) {
    variante = v.variante;
    const mapa = mapaDo(variante);
    enc = new Encounter({ battlefield: montarCampo(mapa), party: [], foes: [], rng: makeRng(7), onLog: () => {}, onEvent: () => {} });
    board = new Board(canvas, { encounter: enc, onTileClick: clicar, onTileHover: () => {} });
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

  const limpa = (a) => Object.fromEntries(Object.entries(a).filter(([k, v]) => ['kind', 'weaponId', 'spellId', 'itemId', 'targetId', 'featureId', 'modo', 'zona', 'mira'].includes(k) && v !== undefined && v !== null));

  function usar(action, tiles = []) {
    if (!selecionado) return;
    enviar({ tipo: 'agir', acao: 'usar', heroi: selecionado.id, action: limpa(action), circulo: emModo?.circulo ?? null, tiles });
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
  function clicar(t) {
    if (!enc) return;
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

  /** A narrativa do anfitrião (A-02): todos leem; só o líder escolhe, e o índice volta ao anfitrião. */
  function narrativa(msg) {
    if (msg.tipo === 'fechar') { narrativas.get(msg.id)?.abort(); narrativas.delete(msg.id); return; }
    if (msg.tipo !== 'abrir' || !aberta) return;
    const p = msg.pedido;
    const ctl = new AbortController();
    narrativas.set(msg.id, ctl);
    const lider = souLider();
    narrarLocal(document.getElementById('app'), {
      formato: p.formato, lista: p.lista, pular: p.pular && lider,
      paginas: p.paginas.map((pg) => ({ titulo: pg.titulo, texto: pg.texto, teste: pg.teste, retrato: pg.retrato })),
      escolhas: lider && p.escolhas ? p.escolhas.map((e) => ({ rotulo: e.rotulo, detalhe: e.detalhe, motivo: e.motivo, primaria: e.primaria, valor: e.indice })) : null,
      sinal: ctl.signal,
    }).then((r) => {
      narrativas.delete(msg.id);
      if (!lider || ctl.signal.aborted) return;
      enviar(p.escolhas ? { tipo: 'resposta', id: msg.id, indice: Number.isInteger(r) ? r : null } : { tipo: 'resposta', id: msg.id, continuar: true });
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
    grupo.replaceChildren(...herois.map((c) => {
      const meu = dono(c.id) && visaoDaSala?.herois?.[c.id] === visaoDaSala?.voce;
      // Em luta, o herói mostra o que ainda tem no turno: a marca ► é o que o próximo clique move.
      const turno = emLuta && enc.side === 'party' ? (c.acted ? ' · turno encerrado' : ` · ação ${c.actionUsed ? 'usada' : 'livre'}, ${Math.max(0, c.movementLeftFt ?? 0)} ft`) : '';
      return el('li', { class: 'taverna-jogador' },
        el('span', {}, `${meu && c === selecionado ? '► ' : ''}${c.name}${dono(c.id) ? ` — ${dono(c.id)}` : ''} · ${Math.max(0, c.hp)}/${c.maxHp} PV${meu ? turno : ''}`));
    }));
    terminar.hidden = hud != null || !(emLuta && enc.side === 'party' && selecionado && !selecionado.acted);
    fase.textContent = emLuta ? (enc.side === 'party' ? `Rodada ${enc.round}: vez do grupo` : 'Vez dos inimigos') : '';
  }

  function receber(bruto) {
    const v = lerVista(bruto);
    if (!v) return;
    if (!aberta) { pendente = v; return; }
    if (!enc || variante !== v.variante) { if (board) desmontar(); montar(v); if (aberta) loop(); }
    const { moveram } = aplicarVista(enc, v);
    for (const c of enc.combatants) aplicarAparencia(c);
    const andaram = reproduzir(v.extras?.eventos ?? []);
    for (const m of moveram) if (!andaram.has(m.c.id)) caminhar(m);
    // Herói caído (a 0 PV) não fica na mira: passa para o próximo dos meus que ainda está de pé.
    if (!selecionado || !meus().includes(selecionado)) selecionado = meus()[0] ?? null;
    if (!board.focoJaEnquadrado) {
      board.focoJaEnquadrado = true;
      const lider = enc.combatants.find((x) => x.side === 'party');
      board.focoInicial = lider?.pos ? { ...lider.pos } : null;
      requestAnimationFrame(() => board?.enquadrarGrande?.(board.focoInicial));
    }
    aviso.classList.remove('visivel');
    destacar();
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
    atualizarSala(v) {
      visaoDaSala = v;
      const anf = v.jogadores.find((j) => j.id === v.anfitriao);
      titulo.textContent = `Partida de ${anf?.nome ?? 'o anfitrião'} · sala ${v.codigo}`;
      if (enc) desenharGrupo();
    },
  };
}
