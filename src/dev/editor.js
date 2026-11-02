// O EDITOR DE CENÁRIO (`/editor.html`). Desenha o mapa com o TABULEIRO DE VERDADE (`Board`), então o que se vê é o que o jogo desenha, com a
// mesma luz, a mesma pedra e a mesma câmera. A lógica das edições mora em `game/mapa-editor.js` (testável em Node); aqui é só tela e mouse.
//
// Ferramentas: piso, parede e portas (por aresta), objetos de cenário, salas, ponto de partida e borracha de objeto. Cada mudança vira um
// ponto de desfazer, é guardada no navegador (`localStorage`) e o botão "Testar no jogo" abre o jogo naquele mapa (`?encontro=editor`).

import { Board, TW, TH, LIFT } from '../view/board.js';
import { Encounter } from '../rules/combat.js';
import { makeParty } from '../rules/party.js';
import { makeRng } from '../core/rng.js';
import { mapaDo } from '../game/encounter.js';
import { montarCampo } from '../game/campo.js';
import * as M from '../game/mapa-editor.js';
import atlas from '../art/folhas/cenario.json';
import urlAtlas from '../art/folhas/cenario.png';

const $ = (id) => document.getElementById(id);
const canvas = $('tela');
const area = $('area');

const MAPAS_DO_JOGO = [
  ['casaDaMorte1', 'Casa da Morte, 1º andar'], ['casaDaMorte2', 'Casa da Morte, 2º andar'], ['casaDaMorte3', 'Casa da Morte, 3º andar'],
  ['casaDaMorte4', 'Casa da Morte, sótão'], ['casaDaMortePorao1', 'Casa da Morte, masmorra 1'], ['casaDaMortePorao2', 'Casa da Morte, masmorra 2'],
  ['rua', 'Rua de Phandalin'], ['castelo', 'Castelo Dentefino'], ['emboscada', 'Emboscada na estrada'], ['mansao', 'Mansão Tresendar'],
];

const PISOS = [
  ['U', 'Assoalho'], ['-', 'Parquet'], ['*', 'Tapete'], ['L', 'Laje'], ['+', 'Terra socada'], ['Z', 'Chão de fora'], [',', 'Grama'], [':', 'Estrada'],
  ['.', 'Chão liso'], ['_', 'Caverna'], ['w', 'Água rasa'], ['=', 'Ponte'], ['p', 'Palha'], ['c', 'Ossos'], ['v', 'Mancha'], ['d', 'Cacos'],
  ['l', 'Escada'], ['M', 'Alvenaria'], ['R', 'Rocha'], ['#', 'Parede inteira'], ['r', 'Pedra'], ['A', 'Estalagmite'], ['W', 'Água funda'], ['O', 'Fosso'],
];

const FERRAMENTAS = [
  ['piso', 'Piso', '1'], ['aresta', 'Parede e porta', '2'], ['objeto', 'Objeto', '3'], ['apagar', 'Tirar objeto', '4'], ['sala', 'Sala', '5'], ['inicio', 'Partida', '6'], ['altura', 'Altura', '7'],
];

const PEGADAS = [[1, 1], [2, 1], [1, 2], [2, 2], [3, 1], [1, 3], [3, 2], [2, 3]];

// ------------------------------------------------------------------------------------------------ estado ---
let mapa = M.ler() ?? M.limpar(mapaDo('casaDaMorte4'));
let desfazer = [];
let refazer = [];
let board = null;
let sujo = true;
const sel = { ferramenta: 'piso', piso: 'U', estilo: 'parede', variante: null, baixo: false, espelhar: false, pega: [1, 1], altura: 1, sala: 'sala1', inicio: 0 };
let hoverEdge = null;
let hoverTile = null;
let pressionado = null;   // { tipo, chave }

const instantaneo = () => JSON.stringify(mapa);
function aplicar(mudou) {
  if (!mudou) return false;
  sujo = true;
  agendarGuardar();
  return true;
}
let relogioGuardar = 0;
function agendarGuardar() {
  clearTimeout(relogioGuardar);
  relogioGuardar = setTimeout(() => { M.guardar(mapa); avisar(); }, 250);
}
/** Marca o ponto de desfazer ANTES de uma edição (um gesto de arrastar vale um ponto só). */
function ponto() {
  desfazer.push(instantaneo());
  if (desfazer.length > 80) desfazer.shift();
  refazer = [];
  botoes();
}
function volta(de, para) {
  if (!de.length) return;
  para.push(instantaneo());
  mapa = JSON.parse(de.pop());
  sujo = true;
  agendarGuardar();
  botoes();
  sincronizarModo();
}

// ------------------------------------------------------------------------------------------------ tabuleiro ---
function reconstruir() {
  const x = area.scrollLeft; const y = area.scrollTop;
  board?.disposeCamera();
  const field = montarCampo(mapa);
  const party = makeParty({ nivel: 2 });
  const lugares = mapa.grupo?.length ? mapa.grupo : [{ x: 1, y: 1 }];
  party.forEach((c, i) => { c.pos = { ...(lugares[i] ?? lugares[0]) }; c.facingVec = { ...(mapa.olhar ?? { dx: 0, dy: 1 }) }; });
  const enc = new Encounter({ battlefield: field, party, foes: [], rng: makeRng(1), onLog: () => {}, onEvent: () => {} });
  board = new Board(canvas, { encounter: enc, onTileClick: () => {}, onTileHover: () => {} });
  board.verTudo = true;       // a casa aberta por inteiro: o editor não esconde sala nenhuma
  board.soCenario = true;     // sem anel nem barra de vida
  area.scrollLeft = x; area.scrollTop = y;
  sujo = false;
  $('tamanho').textContent = `${mapa.terreno[0].length} x ${mapa.terreno.length} casas`;
}

let ultimo = 0;
function quadro(t) {
  const dt = Math.min(0.1, (t - ultimo) / 1000 || 0);
  ultimo = t;
  try {
    if (sujo) reconstruir();
    board.render(dt);
    marcar();
  } catch (e) {
    console.error(e);
    $('estado').textContent = `Erro ao desenhar: ${e.message}`;
  }
  requestAnimationFrame(quadro);
}

/** O que o mouse aponta, por cima do quadro: o losango da casa, a aresta, ou o fantasma do ponto de partida. */
function marcar() {
  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.lineWidth = 3; ctx.lineCap = 'round';
  if (sel.ferramenta === 'aresta' && hoverEdge) {
    const { A, B } = segmento(hoverEdge);
    ctx.strokeStyle = '#ffd868'; ctx.shadowColor = '#000'; ctx.shadowBlur = 4;
    ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
  }
  if (sel.ferramenta === 'inicio' || sel.ferramenta === 'sala') {
    // as casas de partida e a sala do cursor
    ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center';
    (mapa.grupo ?? []).forEach((p, i) => {
      const c = board.center(p.x, p.y);
      ctx.fillStyle = i === sel.inicio && sel.ferramenta === 'inicio' ? '#ffd868' : '#fff';
      ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
      ctx.strokeText(String(i + 1), c.sx, c.sy - 18); ctx.fillText(String(i + 1), c.sx, c.sy - 18);
    });
  }
  if (sel.ferramenta === 'sala') {
    const cor = {};
    ctx.globalAlpha = 0.28;
    for (const [id, casas] of Object.entries(mapa.salas ?? {})) {
      cor[id] ??= `hsl(${[...id].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) % 360} 80% 60%)`;
      ctx.fillStyle = cor[id];
      for (const c of casas) losango(ctx, c.x, c.y);
    }
  }
  ctx.restore();
}

function losango(ctx, x, y) {
  const { sx, sy } = board.iso(x, y);
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + TW / 2, sy + TH / 2); ctx.lineTo(sx, sy + TH); ctx.lineTo(sx - TW / 2, sy + TH / 2); ctx.closePath(); ctx.fill();
}

// ------------------------------------------------------------------------------------------------ pontaria ---
const ARESTA_ALTURA = 3 * LIFT;
function segmento({ x, y, lado }) {
  const { sx, sy } = board.iso(x, y);
  const A = { x: sx, y: sy };
  const B = lado === 'N' ? { x: sx + TW / 2, y: sy + TH / 2 } : { x: sx - TW / 2, y: sy + TH / 2 };
  return { A, B };
}
function distSeg(P, A, B) {
  const dx = B.x - A.x; const dy = B.y - A.y;
  const t = Math.max(0, Math.min(1, ((P.x - A.x) * dx + (P.y - A.y) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(P.x - (A.x + t * dx), P.y - (A.y + t * dy));
}
/** O ponto está no pano de parede (o retângulo da aresta até 3 níveis acima)? */
function noPano(P, A, B) {
  const q = [A, B, { x: B.x, y: B.y - ARESTA_ALTURA }, { x: A.x, y: A.y - ARESTA_ALTURA }];
  let d = false;
  for (let i = 0, j = q.length - 1; i < q.length; j = i++) {
    if ((q[i].y > P.y) !== (q[j].y > P.y) && P.x < ((q[j].x - q[i].x) * (P.y - q[i].y)) / (q[j].y - q[i].y) + q[i].x) d = !d;
  }
  return d;
}

function pontoDe(e) {
  const { px, py } = board.pontoDoEvento(e);
  return { x: px, y: py };
}
function casaDe(e) {
  const p = pontoDe(e);
  const t = board.casaNoPonto(p.x, p.y);
  return t && M.dentro(mapa, t.x, t.y) ? t : null;
}
/** A aresta mais perto do ponteiro entre as quatro da casa apontada. */
function arestaDe(e) {
  const P = pontoDe(e);
  const t = board.casaNoPonto(P.x, P.y);
  if (!t) return null;
  let melhor = null;
  for (const c of [{ x: t.x, y: t.y, lado: 'N' }, { x: t.x, y: t.y, lado: 'O' }, { x: t.x, y: t.y + 1, lado: 'N' }, { x: t.x + 1, y: t.y, lado: 'O' }]) {
    if (!M.dentro(mapa, c.x, c.y) || (c.lado === 'N' && c.y === 0) || (c.lado === 'O' && c.x === 0)) continue;
    const { A, B } = segmento(c);
    const d = distSeg(P, A, B);
    const nota = (noPano(P, A, B) ? 0 : 1000) + d;
    if (!melhor || nota < melhor.nota) melhor = { ...c, nota };
  }
  return melhor && melhor.nota < 1000 + 22 ? melhor : null;
}

// ------------------------------------------------------------------------------------------------ mouse ---
function agir(e, primeira) {
  const f = sel.ferramenta;
  if (f === 'aresta') {
    const a = arestaDe(e);
    hoverEdge = a;
    if (!a) return;
    const chave = `${a.x},${a.y},${a.lado}`;
    if (pressionado && pressionado.chave === chave) return;
    if (primeira) {
      ponto();
      // clicar de novo numa aresta que já tem o estilo escolhido a limpa (liga e desliga); arrastar segue o que o primeiro clique fez
      pressionado = { estilo: M.estiloDaAresta(mapa, a.x, a.y, a.lado) === sel.estilo ? 'nada' : sel.estilo };
    }
    const estilo = pressionado?.estilo ?? sel.estilo;
    pressionado = { chave, estilo };
    aplicar(M.pintarAresta(mapa, a.x, a.y, a.lado, estilo));
    return;
  }
  const t = casaDe(e);
  if (!t) return;
  const chave = `${t.x},${t.y}`;
  if (pressionado && pressionado.chave === chave) return;
  if (primeira) ponto();
  pressionado = { chave };
  if (f === 'piso') aplicar(M.pintarPiso(mapa, t.x, t.y, sel.piso));
  else if (f === 'objeto') { if (sel.variante) aplicar(M.colocarProp(mapa, t.x, t.y, sel.variante, { baixo: sel.baixo, espelhar: sel.espelhar, pega: M.pegadaDe(...sel.pega) })); }
  else if (f === 'apagar') aplicar(M.removerProp(mapa, t.x, t.y));
  else if (f === 'altura') aplicar(M.pintarAltura(mapa, t.x, t.y, sel.altura));
  else if (f === 'sala') aplicar(M.definirSala(mapa, t.x, t.y, sel.sala.trim()));
  else if (f === 'inicio') aplicar(M.definirInicio(mapa, sel.inicio, t.x, t.y));
}

let panorama = null;
canvas.addEventListener('mousedown', (e) => {
  if (e.button === 1) { panorama = { x: e.clientX, y: e.clientY, l: area.scrollLeft, t: area.scrollTop }; e.preventDefault(); return; }
  if (e.button !== 0) return;
  pressionado = null;
  agir(e, true);
});
addEventListener('mousemove', (e) => {
  if (panorama) { area.scrollLeft = panorama.l - (e.clientX - panorama.x); area.scrollTop = panorama.t - (e.clientY - panorama.y); return; }
  if (!board || e.target !== canvas) return;
  if (e.buttons & 1) agir(e, false);
  else {
    hoverEdge = sel.ferramenta === 'aresta' ? arestaDe(e) : null;
    hoverTile = casaDe(e);
    estado();
  }
});
addEventListener('mouseup', () => { pressionado = null; panorama = null; });
canvas.addEventListener('mouseleave', () => { hoverEdge = null; hoverTile = null; estado(); });

addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  const ctrl = e.ctrlKey || e.metaKey;
  if (ctrl && e.key.toLowerCase() === 'z') { e.preventDefault(); volta(e.shiftKey ? refazer : desfazer, e.shiftKey ? desfazer : refazer); return; }
  if (ctrl && e.key.toLowerCase() === 'y') { e.preventDefault(); volta(refazer, desfazer); return; }
  const f = FERRAMENTAS.find(([, , k]) => k === e.key);
  if (f) escolher(f[0]);
});

// ------------------------------------------------------------------------------------------------ painel ---
function estado() {
  const t = hoverTile;
  if (!t) { $('estado').textContent = 'Passe o mouse no mapa. Botão do meio arrasta; a roda dá zoom.'; return; }
  const sala = M.salaDe(mapa, t.x, t.y);
  const o = M.propEm(mapa, t.x, t.y);
  const h = hoverEdge ? ` | aresta ${hoverEdge.lado === 'N' ? 'de cima' : 'da esquerda'}: ${M.ESTILOS_DE_ARESTA[M.estiloDaAresta(mapa, hoverEdge.x, hoverEdge.y, hoverEdge.lado)].rotulo}` : '';
  $('estado').innerHTML = `casa <b>${t.x},${t.y}</b> | piso <b>${mapa.terreno[t.y][t.x]}</b>${sala ? ` | sala <b>${sala}</b>` : ''}${o ? ` | objeto <b>${o.variante}</b>` : ''}${h}`;
}

/** A caixa de "exploração livre" acompanha o mapa (depois de abrir, importar ou desfazer). */
function sincronizarModo() {
  const c = $('explorar');
  if (c) c.checked = mapa.cena === 'editor';
}

function botoes() {
  $('desfazer').disabled = !desfazer.length;
  $('refazer').disabled = !refazer.length;
}

function avisar() {
  const ul = $('avisos');
  if (!ul) return;
  let a = [];
  try { a = M.diagnostico(mapa); } catch (e) { a = [`Não deu para checar: ${e.message}`]; }
  ul.className = a.length ? '' : 'ok';
  ul.innerHTML = a.length ? a.map((t) => `<li>${t}</li>`).join('') : '<li>✓ Tudo alcançável, ninguém nasce preso.</li>';
}

function escolher(f) {
  sel.ferramenta = f;
  document.querySelectorAll('[data-ferramenta]').forEach((b) => b.classList.toggle('on', b.dataset.ferramenta === f));
  document.querySelectorAll('[data-secao]').forEach((s) => { s.hidden = s.dataset.secao !== f && !(s.dataset.secao === 'objeto' && f === 'apagar' && false); });
  canvas.style.cursor = f === 'apagar' ? 'not-allowed' : 'crosshair';
}

const miniaturas = new Map();
const imgAtlas = new Image();
imgAtlas.src = urlAtlas;

function miniatura(chave) {
  const f = atlas[chave]?.todas?.[0];
  const c = document.createElement('canvas');
  if (!f) return c;
  c.width = f.w; c.height = f.h;
  const pinta = () => c.getContext('2d').drawImage(imgAtlas, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h);
  if (imgAtlas.complete) pinta(); else imgAtlas.addEventListener('load', pinta, { once: true });
  return c;
}

function montarPainel() {
  const L = $('lateral');
  L.innerHTML = `
    <h2>Ferramenta (teclas 1 a 7)</h2>
    <div class="ferramentas">${FERRAMENTAS.map(([id, nome, k]) => `<button data-ferramenta="${id}">${k} · ${nome}</button>`).join('')}</div>

    <div data-secao="piso">
      <h2>Piso</h2>
      <div class="grade">${PISOS.map(([g, n]) => `<button data-piso="${g}" title="${n}">${n}</button>`).join('')}</div>
      <p class="dica">Clique e arraste para pintar. Casa com móvel não se pinta: tire o móvel antes.</p>
    </div>

    <div data-secao="aresta">
      <h2>Parede e porta</h2>
      <div class="lista">${Object.entries(M.ESTILOS_DE_ARESTA).map(([id, e]) => `<button data-estilo="${id}">${e.rotulo}</button>`).join('')}</div>
      <p class="dica">Passe o mouse perto da borda de uma casa: a aresta acende. Clique (ou arraste ao longo da parede) para pôr o estilo. Clicar de novo no mesmo estilo apaga.</p>
    </div>

    <div data-secao="objeto">
      <h2>Objeto</h2>
      <input type="text" id="filtro" placeholder="buscar: lareira, cama, arvore..." style="width:100%;margin-bottom:6px" />
      <div id="pecas"></div>
      <label class="linha">Pegada <select id="pega">${PEGADAS.map(([w, h]) => `<option value="${w},${h}">${w} x ${h} casa${w * h > 1 ? 's' : ''}</option>`).join('')}</select></label>
      <p class="dica">Peça de várias casas: clique na casa da FRENTE (a mais ao sul/leste na tela); as outras ficam a oeste e ao norte dela. Tirar uma casa da peça tira a peça inteira.</p>
      <label class="linha"><input type="checkbox" id="baixo" /> Baixo (dá para pisar por cima)</label>
      <label class="linha"><input type="checkbox" id="espelhar" /> Espelhar</label>
      <p class="dica" id="escolhida">Nenhuma peça escolhida.</p>
    </div>

    <div data-secao="apagar"><h2>Tirar objeto</h2><p class="dica">Clique num objeto para tirá-lo.</p></div>

    <div data-secao="altura">
      <h2>Altura do terreno</h2>
      <div class="grade">${[0, 1, 2, 3, 4, 5, 6].map((n) => `<button data-altura="${n}">${n}</button>`).join('')}</div>
      <p class="dica">Cada nível vale 1,5 m a mais (um degrau de pedra). Escolha o nível e pinte; subir custa o dobro de movimento, e quem está no alto tem vantagem de visão. 0 é o chão.</p>
    </div>

    <div data-secao="sala">
      <h2>Sala</h2>
      <input type="text" id="salaId" value="${sel.sala}" style="width:100%" />
      <p class="dica">Pinte as casas da sala com este nome. Deixe o campo vazio para tirar a casa de qualquer sala. O jogo usa as salas para abrir e fechar a casa e para os textos.</p>
    </div>

    <div data-secao="inicio">
      <h2>Ponto de partida</h2>
      <div class="grade">${[0, 1, 2, 3].map((i) => `<button data-inicio="${i}">Herói ${i + 1}</button>`).join('')}</div>
      <p class="dica">Escolha o herói e clique na casa onde ele nasce.</p>
    </div>

    <h2>Modo no jogo</h2>
    <label class="linha"><input type="checkbox" id="explorar" ${mapa.cena === 'editor' ? 'checked' : ''} /> Exploração livre (sem iniciativa e sem inimigos)</label>
    <p class="dica">Desligado, "Testar no jogo" abre o mapa em combate por turnos.</p>

    <h2>Tamanho do mapa</h2>
    <div class="grade">
      <button data-cresce="N,1">+ norte</button><button data-cresce="S,1">+ sul</button><button data-cresce="O,1">+ oeste</button><button data-cresce="L,1">+ leste</button>
      <button data-cresce="N,-1">− norte</button><button data-cresce="S,-1">− sul</button><button data-cresce="O,-1">− oeste</button><button data-cresce="L,-1">− leste</button>
    </div>

    <h2>Checagem</h2>
    <ul id="avisos" class="ok"></ul>`;

  L.querySelectorAll('[data-ferramenta]').forEach((b) => b.addEventListener('click', () => escolher(b.dataset.ferramenta)));
  L.querySelectorAll('[data-piso]').forEach((b) => b.addEventListener('click', () => {
    sel.piso = b.dataset.piso;
    L.querySelectorAll('[data-piso]').forEach((x) => x.classList.toggle('on', x === b));
  }));
  L.querySelectorAll('[data-estilo]').forEach((b) => b.addEventListener('click', () => {
    sel.estilo = b.dataset.estilo;
    L.querySelectorAll('[data-estilo]').forEach((x) => x.classList.toggle('on', x === b));
  }));
  L.querySelectorAll('[data-inicio]').forEach((b) => b.addEventListener('click', () => {
    sel.inicio = Number(b.dataset.inicio);
    L.querySelectorAll('[data-inicio]').forEach((x) => x.classList.toggle('on', x === b));
  }));
  L.querySelectorAll('[data-altura]').forEach((b) => b.addEventListener('click', () => {
    sel.altura = Number(b.dataset.altura);
    L.querySelectorAll('[data-altura]').forEach((x) => x.classList.toggle('on', x === b));
  }));
  $('pega').addEventListener('change', (e) => { sel.pega = e.target.value.split(',').map(Number); });
  $('explorar').addEventListener('change', (e) => { ponto(); if (!aplicar(M.definirExploracao(mapa, e.target.checked))) { desfazer.pop(); botoes(); } });
  L.querySelectorAll('[data-cresce]').forEach((b) => b.addEventListener('click', () => {
    const [borda, n] = b.dataset.cresce.split(',');
    ponto();
    if (!aplicar(M.redimensionar(mapa, borda, Number(n)))) { desfazer.pop(); botoes(); }
  }));
  $('salaId').addEventListener('input', (e) => { sel.sala = e.target.value; });
  $('baixo').addEventListener('change', (e) => { sel.baixo = e.target.checked; });
  $('espelhar').addEventListener('change', (e) => { sel.espelhar = e.target.checked; });
  L.querySelector(`[data-piso="${sel.piso}"]`).classList.add('on');
  L.querySelector(`[data-estilo="${sel.estilo}"]`).classList.add('on');
  L.querySelector(`[data-inicio="${sel.inicio}"]`).classList.add('on');
  L.querySelector(`[data-altura="${sel.altura}"]`).classList.add('on');

  // as peças do atlas: toda chave `prop-...` é um objeto que o jogo sabe desenhar
  const chaves = Object.keys(atlas).filter((k) => k.startsWith('prop-')).sort();
  const grade = $('pecas');
  const botoesDePeca = chaves.map((k) => {
    const b = document.createElement('button');
    const nome = k.slice(5);
    b.title = nome; b.dataset.nome = nome;
    if (!miniaturas.has(k)) miniaturas.set(k, miniatura(k));
    b.append(miniaturas.get(k).cloneNode(true));
    // o clone não leva o desenho: redesenha
    const c = b.firstChild;
    const f = atlas[k]?.todas?.[0];
    if (f) { c.width = f.w; c.height = f.h; const pinta = () => c.getContext('2d').drawImage(imgAtlas, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h); if (imgAtlas.complete) pinta(); else imgAtlas.addEventListener('load', pinta, { once: true }); }
    b.addEventListener('click', () => {
      sel.variante = nome;
      grade.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
      $('escolhida').textContent = `Peça: ${nome}. Clique no mapa para colocar.`;
    });
    grade.append(b);
    return b;
  });
  $('filtro').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    botoesDePeca.forEach((b) => { b.hidden = q && !b.dataset.nome.toLowerCase().includes(q); });
  });
  escolher(sel.ferramenta);
}

// ------------------------------------------------------------------------------------------------ cabeçalho ---
function iniciarCabecalho() {
  $('base').innerHTML = '<option value="" disabled selected>(mapa em edição)</option>' + MAPAS_DO_JOGO.map(([id, nome]) => `<option value="${id}">${nome}</option>`).join('');
  $('abrir').addEventListener('click', () => {
    if (desfazer.length && !confirm('Abrir outro mapa descarta o que está na tela (dá para desfazer). Continuar?')) return;
    if (!$('base').value) return;
    ponto();
    try { mapa = M.limpar(mapaDo($('base').value)); } catch (e) { alert(`Não abriu: ${e.message}`); return; }
    sujo = true; agendarGuardar(); sincronizarModo();
  });
  $('novo').addEventListener('click', () => {
    const t = prompt('Tamanho do mapa novo (largura x altura, em casas):', '12x12');
    const m = /^(\d+)\s*[x×]\s*(\d+)$/i.exec(t ?? '');
    if (!m) return;
    const w = Math.min(80, Math.max(5, Number(m[1]))); const h = Math.min(80, Math.max(5, Number(m[2])));
    ponto(); mapa = M.novoMapa(w, h); sujo = true; agendarGuardar(); sincronizarModo();
  });
  $('desfazer').addEventListener('click', () => volta(desfazer, refazer));
  $('refazer').addEventListener('click', () => volta(refazer, desfazer));
  $('exportar').addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(mapa, null, 1)], { type: 'application/json' }));
    a.download = 'cenario.json'; a.click(); URL.revokeObjectURL(a.href);
  });
  $('importar').addEventListener('click', () => $('arquivo').click());
  $('arquivo').addEventListener('change', async (e) => {
    const arq = e.target.files[0]; e.target.value = '';
    if (!arq) return;
    try {
      const m = M.limpar(JSON.parse(await arq.text()));
      if (!Array.isArray(m.terreno) || !m.terreno.length) throw new Error('não tem `terreno`');
      ponto(); mapa = m; sujo = true; agendarGuardar(); sincronizarModo();
    } catch (err) { alert(`Esse arquivo não é um cenário: ${err.message}`); }
  });
  $('testar').addEventListener('click', () => { M.guardar(mapa); window.open('/?encontro=editor&nivel=2', '_blank'); });
}

montarPainel();
iniciarCabecalho();
botoes();
avisar();
estado();
requestAnimationFrame(quadro);
window.__editor = { arestaDe, casaDe, agir, get mapa() { return mapa; }, set mapa(v) { mapa = v; sujo = true; }, M, sel, get board() { return board; } };
