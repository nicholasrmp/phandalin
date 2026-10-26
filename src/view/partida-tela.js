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
import { Encounter } from '../rules/combat.js';
import { Battlefield } from '../core/grid.js';
import { makeRng } from '../core/rng.js';
import { mapaDo } from '../game/encounter.js';
import { montarCampo } from '../game/campo.js';
import { lerVista, aplicarVista } from '../game/partida-vista.js';

const CASAS_POR_SEGUNDO = 5;
const SALTO_MAXIMO = 14;       // mais longe que isto (teletransporte, mapa novo) a figura aparece no destino, sem caminhar

export function criarPartidaTela({ aoSair, enviar = () => false }) {
  const canvas = el('canvas', { class: 'board', 'aria-label': 'A partida' });
  const quadro = el('div', { class: 'board-wrap taverna-quadro' }, canvas);
  const titulo = el('span', { class: 'partida-titulo' }, 'Partida');
  const aviso = el('p', { class: 'taverna-aviso visivel', role: 'status' }, 'Esperando o anfitrião mostrar a partida…');
  const grupo = el('ul', { class: 'taverna-jogadores', 'aria-label': 'Quem joga com quem' });
  const camada = el('div', { class: 'taverna partida', role: 'region', 'aria-label': 'Partida' },
    el('header', { class: 'taverna-topo' }, el('div', { class: 'taverna-sala' }, titulo), grupo,
      el('div', { class: 'taverna-acoes' }, el('button', { class: 'menu-btn', onclick: () => { audio.play('click'); aoSair(); } }, 'Sair'))),
    quadro, aviso);

  let aberta = false;
  let enc = null; let board = null; let variante = null;
  let quadroDeAnimacao = 0; let ultimo = 0;
  let pendente = null;          // a última vista que chegou antes de a tela abrir
  let visaoDaSala = null;
  let selecionado = null;       // o herói MEU que o próximo clique move
  const narrativas = new Map(); // id da narrativa aberta -> AbortController (o anfitrião a fecha por fora)

  function montar(v) {
    variante = v.variante;
    const mapa = mapaDo(variante);
    enc = new Encounter({ battlefield: montarCampo(mapa), party: [], foes: [], rng: makeRng(7), onLog: () => {}, onEvent: () => {} });
    board = new Board(canvas, { encounter: enc, onTileClick: clicar, onTileHover: () => {} });
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
  }

  /** F4.3: clicar num herói MEU o escolhe; clicar numa casa manda o herói escolhido andar (o anfitrião aplica). */
  function clicar(t) {
    if (!enc) return;
    const noLugar = enc.at?.(t.x, t.y);
    if (noLugar && meus().includes(noLugar)) { selecionado = noLugar; audio.play('click'); destacar(); return; }
    if (!selecionado || !meus().includes(selecionado)) { selecionado = meus()[0] ?? null; destacar(); }
    if (!selecionado) { aviso.textContent = 'Você não tem nenhum herói em campo.'; aviso.classList.add('visivel'); return; }
    if (noLugar) return;
    aviso.classList.remove('visivel');
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

  /** Mais de um passo: o caminho que o motor do cliente acha; se não acha, ou é longe demais, a figura aparece no destino. */
  function caminhar(m) {
    const { c, de, para } = m;
    board.fx.cancel(c.id, 'walk');
    const d = Math.max(Math.abs(de.x - para.x), Math.abs(de.y - para.y));
    if (d > SALTO_MAXIMO) return;
    const alcancados = enc.battlefield.reachable(de, 600, () => false);
    const caminho = Battlefield.pathFrom(alcancados, para);
    if (caminho.length > 1) board.fx.walk(c, caminho, { andar: 'passo', tilesPerSecond: CASAS_POR_SEGUNDO });
  }

  function desenharGrupo() {
    const herois = enc?.combatants.filter((c) => c.side === 'party') ?? [];
    const dono = (id) => {
      const pub = visaoDaSala?.herois?.[id];
      return visaoDaSala?.jogadores?.find((j) => j.id === pub)?.nome ?? (pub ? 'Piloto automático' : '');
    };
    grupo.replaceChildren(...herois.map((c) => el('li', { class: 'taverna-jogador' },
      el('span', {}, `${c.name}${dono(c.id) ? ` — ${dono(c.id)}` : ''} · ${Math.max(0, c.hp)}/${c.maxHp} PV`))));
  }

  function receber(bruto) {
    const v = lerVista(bruto);
    if (!v) return;
    if (!aberta) { pendente = v; return; }
    if (!enc || variante !== v.variante) { if (board) desmontar(); montar(v); if (aberta) loop(); }
    const { moveram } = aplicarVista(enc, v);
    for (const c of enc.combatants) aplicarAparencia(c);
    for (const m of moveram) caminhar(m);
    if (!selecionado || !enc.combatants.includes(selecionado)) selecionado = meus()[0] ?? null;
    if (!board.focoJaEnquadrado) {
      board.focoJaEnquadrado = true;
      const lider = enc.combatants.find((x) => x.side === 'party');
      board.focoInicial = lider?.pos ? { ...lider.pos } : null;
      requestAnimationFrame(() => board?.enquadrarGrande?.(board.focoInicial));
    }
    aviso.classList.remove('visivel');
    desenharGrupo();
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
      aberta = true;
      if (pendente) { const v = pendente; pendente = null; receber(v); }
    },
    fechar() {
      if (!aberta) return;
      aberta = false;
      camada.remove();
      for (const ctl of narrativas.values()) ctl.abort();
      narrativas.clear();
      selecionado = null;
      desmontar();
      pendente = null;
      aviso.classList.add('visivel');
    },
    /** A vista da partida chegou (o anfitrião publicou). */
    vista: receber,
    /** Uma página da narrativa (ou o fim dela). */
    narrativa,
    /** O estado da sala mudou: quem joga com quem, o nome do anfitrião. */
    atualizarSala(v) {
      visaoDaSala = v;
      const anf = v.jogadores.find((j) => j.id === v.anfitriao);
      titulo.textContent = `Partida de ${anf?.nome ?? 'o anfitrião'} · sala ${v.codigo}`;
      if (enc) desenharGrupo();
    },
  };
}
