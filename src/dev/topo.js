// PROTÓTIPO de VISÃO DE CIMA (`/topo.html`) — descartável, para decidir se vale refazer o jogo nesse estilo (o do Foundry VTT).
//
// Desenha um mapa DE VERDADE do jogo (o mesmo `mapaDo()` que o jogo usa) visto de cima, e um botão alterna para o tabuleiro isométrico
// de verdade (`Board`), no mesmo mapa, para comparar lado a lado.
//
// O QUE É HONESTO AQUI: a planta, as paredes, as portas, o tamanho das salas e as fichas das criaturas são os do jogo.
// O QUE É FALSO AQUI: o chão e os móveis DESENHADOS PELO PROTÓTIPO. O chão é pintado com as cores que o jogo já usa para cada
// superfície, sem textura; os móveis são o sprite ISOMÉTRICO deitado na casa, porque arte de cima não existe no projeto. Num jogo de
// verdade os dois seriam arte nova — e é esse o custo que o protótipo existe para mostrar.
//
// O MAPA PINTADO ("Mapa pintado de verdade") é a exceção, e é o que torna a comparação justa: a Casa da Morte tem um battlemap
// comercial pintado (Morvold Press / Jeff Todd, em `_referencias/casa-da-morte-morvold/`, FORA do versionamento — é arte de terceiros,
// só serve de consulta e não pode ser publicada). O encaixe na grade do jogo foi MEDIDO por correlação, não chutado:
// `python src/dev/alinhar-mapa-pintado.py --provas` escreve a escala, o giro e a origem de cada andar, e a prova visual.
// Com ele ligado, o que se vê é exatamente o que o Foundry entrega: mapa pintado embaixo, as paredes e as fichas do jogo em cima.

import { Encounter } from '../rules/combat.js';
import { makeParty } from '../rules/party.js';
import { makeRng } from '../core/rng.js';
import { mapaDo, buildFoes } from '../game/encounter.js';
import { montarCampo } from '../game/campo.js';
import { Board } from '../view/board.js';
import { makePortrait } from '../art/sheet.js';
import * as T from './vista-topo.js';
import { PINTADOS, PASTA_PINTADOS } from './topo-pintados.js';
import atlas from '../art/folhas/cenario.json';
import urlAtlas from '../art/folhas/cenario.png';

const $ = (id) => document.getElementById(id);
const area = $('area');
const canvas = $('tela');
const ctx = canvas.getContext('2d');

const MAPAS = [
  ['casaDaMorte1', 'Casa da Morte, 1º andar ✦'],
  ['casaDaMorte2', 'Casa da Morte, 2º andar ✦'],
  ['casaDaMorte3', 'Casa da Morte, 3º andar ✦'],
  ['casaDaMorte4', 'Casa da Morte, sótão ✦'],
  ['casaDaMortePorao1', 'Casa da Morte, masmorra 1 ✦'],
  ['casaDaMortePorao2', 'Casa da Morte, masmorra 2, a câmara do ritual ✦'],
  ['mansao', 'Mansão Tresendar'],
  ['castelo', 'Castelo Dentefino'],
  ['rua', 'Rua de Phandalin'],
  ['emboscada', 'Emboscada na estrada'],
];

const sel = { variante: 'casaDaMorte1', topo: true, grade: true, moveis: true, arestas: false, pintado: true, centro: true, celula: 70 };
let cena = null;          // { mapa, field, enc, criaturas }
let board = null;         // o tabuleiro isométrico, criado só quando se pede
let telaIso = null;

const imgAtlas = new Image();
imgAtlas.src = urlAtlas;
let atlasPronto = imgAtlas.complete;
imgAtlas.addEventListener('load', () => { atlasPronto = true; desenhar(); }, { once: true });

/** As casas de DENTRO da planta: as que uma inundação vinda da borda não alcança, barrada por parede, porta ou rocha. */
function dentroDaPlanta(field) {
  const fora = new Uint8Array(field.w * field.h);
  const pilha = [];
  const por = (x, y) => {
    if (x < 0 || y < 0 || x >= field.w || y >= field.h || fora[y * field.w + x] || field.blocksMove(x, y)) return;
    fora[y * field.w + x] = 1;
    pilha.push([x, y]);
  };
  for (let x = 0; x < field.w; x++) { por(x, 0); por(x, field.h - 1); }
  for (let y = 0; y < field.h; y++) { por(0, y); por(field.w - 1, y); }
  while (pilha.length) {
    const [x, y] = pilha.pop();
    const i = y * field.w + x;
    if (!field.paredeN[i]) por(x, y - 1);
    if (y + 1 < field.h && !field.paredeN[i + field.w]) por(x, y + 1);
    if (!field.paredeO[i]) por(x - 1, y);
    if (x + 1 < field.w && !field.paredeO[i + 1]) por(x + 1, y);
  }
  const dentro = [];
  for (let y = 0; y < field.h; y++) {
    for (let x = 0; x < field.w; x++) if (!fora[y * field.w + x] && !field.blocksMove(x, y)) dentro.push({ x, y });
  }
  return dentro;
}

/** As casas livres mais perto do meio da planta. O grupo começa fora da casa, e aí não daria para ver as fichas na pintura. */
function aoCentro(field, quantos) {
  const livres = dentroDaPlanta(field);
  if (!livres.length) return [{ x: 1, y: 1 }];
  const mx = livres.reduce((s, p) => s + p.x, 0) / livres.length;
  const my = livres.reduce((s, p) => s + p.y, 0) / livres.length;
  livres.sort((a, b) => ((a.x - mx) ** 2 + (a.y - my) ** 2) - ((b.x - mx) ** 2 + (b.y - my) ** 2));
  return livres.slice(0, quantos);
}

// ------------------------------------------------------------------------------- o mapa pintado de verdade ---
const pintadas = new Map();
/** Correcao manual do encaixe, por cena: as setas e o PgUp/PgDn mexem aqui, e o rodape mostra o numero para copiar. */
const ajuste = {};
/** A imagem pintada da cena, se houver. Devolve `null` enquanto carrega ou se não existir. */
function pintado(variante) {
  const a = PINTADOS[variante];
  if (!a) return null;
  if (!pintadas.has(variante)) {
    const img = new Image();
    img.addEventListener('load', () => desenhar(), { once: true });
    img.addEventListener('error', () => { img.falhou = true; desenhar(); }, { once: true });
    img.src = `${PASTA_PINTADOS}${a.arquivo}`;
    pintadas.set(variante, img);
  }
  const img = pintadas.get(variante);
  return img.complete && img.naturalWidth ? img : null;
}

/** Deita a imagem pintada na grade, com o encaixe medido. É o mesmo enquadramento que o editor usa (`mapa.fundo`). */
function pintarMapaPintado(C) {
  const img = pintado(sel.variante);
  return img ? T.pintarFundo(ctx, img, { ...PINTADOS[sel.variante], ...(ajuste[sel.variante] ?? {}) }, C) : false;
}

// ------------------------------------------------------------------------------------------------- a cena ---
function montar() {
  const mapa = mapaDo(sel.variante);
  const field = montarCampo(mapa);
  const party = makeParty({ nivel: 2 });
  const lugares = sel.centro ? aoCentro(field, party.length) : (mapa.grupo?.length ? mapa.grupo : [{ x: 1, y: 1 }]);
  party.forEach((c, i) => { c.pos = { ...(lugares[i] ?? lugares[0]) }; c.facingVec = { ...(mapa.olhar ?? { dx: 0, dy: 1 }) }; });
  const foes = buildFoes(sel.variante);
  const enc = new Encounter({ battlefield: field, party, foes, rng: makeRng(1), onLog: () => {}, onEvent: () => {} });
  for (const f of foes) { try { enc.addCombatant(f); } catch { /* criatura fora do mapa: ignora */ } }
  cena = { mapa, field, enc, criaturas: [...party, ...foes] };
  board?.disposeCamera();
  board = null;
  rodape();
}

function rodape() {
  const m = cena.mapa;
  const a = PINTADOS[sel.variante] ? { ...PINTADOS[sel.variante], ...(ajuste[sel.variante] ?? {}) } : null;
  const encaixe = a
    ? `mapa pintado: giro ${a.giro}°, ${a.escala.toFixed(1)} px/casa, origem (${a.x0.toFixed(0)}, ${a.y0.toFixed(0)}) — setas movem, PgUp/PgDn muda a escala`
    : 'sem mapa pintado para esta cena: chão e móveis são provisórios (ver o cabeçalho de src/dev/topo.js)';
  $('rodape').textContent = `${m.terreno[0].length} x ${m.terreno.length} casas · ${cena.criaturas.length} criaturas · ${encaixe}`;
}

// ------------------------------------------------------------------------------------------- visão de cima ---
// O desenho em si mora em `vista-topo.js`, que o editor também usa.

/** A ficha de criatura do Foundry: retrato num círculo, anel do lado e barra de vida. */
const retratos = new Map();
function retrato(look) {
  if (!retratos.has(look)) {
    let c = null;
    try { c = makePortrait(look, 64); } catch { c = null; }
    retratos.set(look, c);
  }
  return retratos.get(look);
}

function pintarCriaturas(C) {
  for (const c of cena.criaturas) {
    if (!c.pos || c.dead) continue;
    const f = c.pos.f ?? 1;                       // criatura Grande ocupa 2 x 2
    const cx = (c.pos.x + f / 2) * C;
    const cy = (c.pos.y + f / 2) * C;
    const r = (C * f) * 0.43;
    const aliado = c.side === 'party';
    const anel = aliado ? '#d9b45a' : c.side === 'neutro' ? '#6fa8dc' : '#b3433a';

    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.closePath();
    ctx.fillStyle = 'rgba(10,8,14,.85)'; ctx.fill();
    ctx.clip();
    const p = retrato(c.look);
    if (p) { ctx.imageSmoothingEnabled = false; ctx.drawImage(p, cx - r, cy - r, r * 2, r * 2); }
    else {
      ctx.fillStyle = anel; ctx.globalAlpha = 0.5; ctx.fillRect(cx - r, cy - r, r * 2, r * 2); ctx.globalAlpha = 1;
      ctx.fillStyle = '#fff'; ctx.font = `bold ${Math.round(r)}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText((c.name ?? '?')[0], cx, cy);
    }
    ctx.restore();

    ctx.strokeStyle = anel; ctx.lineWidth = Math.max(2, C * 0.045);
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke();

    // a barra de vida, colada embaixo do anel
    const bw = r * 1.8; const bh = Math.max(4, C * 0.075);
    const bx = cx - bw / 2; const by = cy + r - bh / 2;
    const frac = Math.max(0, Math.min(1, (c.hp ?? 1) / (c.maxHp || 1)));
    ctx.fillStyle = 'rgba(0,0,0,.75)'; ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = frac > 0.5 ? '#5fbf5f' : frac > 0.25 ? '#d9b45a' : '#b3433a';
    ctx.fillRect(bx + 1, by + 1, (bw - 2) * frac, bh - 2);

    // o nome, como nas telas do Foundry
    ctx.font = `${Math.max(10, Math.round(C * 0.16))}px system-ui`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const nome = c.name ?? '';
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.9)'; ctx.strokeText(nome, cx, by + bh + 3);
    ctx.fillStyle = '#efe8da'; ctx.fillText(nome, cx, by + bh + 3);
  }
}

function desenhar() {
  if (!cena || !sel.topo) return;
  const C = sel.celula;
  const { field } = cena;
  canvas.width = field.w * C;
  canvas.height = field.h * C;
  ctx.imageSmoothingEnabled = false;
  const comPintura = sel.pintado && pintarMapaPintado(C);
  if (!comPintura) {
    T.pintarChao(ctx, field, C);
    if (sel.moveis) T.pintarMoveis(ctx, cena.mapa, C, atlas, imgAtlas);
  }
  if (sel.grade) T.pintarGrade(ctx, field, C, comPintura ? 'rgba(120,200,255,.4)' : 'rgba(0,0,0,.28)');
  // sobre o mapa pintado as paredes não se desenham: elas já estão pintadas. Só aparecem no modo do editor do Foundry.
  if (!comPintura || sel.arestas) T.pintarArestas(ctx, field, C, sel.arestas);
  pintarCriaturas(C);
}

// ------------------------------------------------------------------------------------------------ isométrico ---
function iso(ligar) {
  if (ligar) {
    if (!telaIso) { telaIso = document.createElement('canvas'); area.append(telaIso); }
    telaIso.hidden = false;
    canvas.hidden = true;
    if (!board) {
      board = new Board(telaIso, { encounter: cena.enc, onTileClick: () => {}, onTileHover: () => {} });
      board.verTudo = true;
    }
  } else {
    if (telaIso) telaIso.hidden = true;
    canvas.hidden = false;
    desenhar();
  }
}

let ultimo = 0;
function quadro(t) {
  const dt = Math.min(0.1, (t - ultimo) / 1000 || 0);
  ultimo = t;
  if (!sel.topo && board) { try { board.render(dt); } catch (e) { console.error(e); } }
  requestAnimationFrame(quadro);
}

// ----------------------------------------------------------------------------------------------------- tela ---
$('mapa').innerHTML = MAPAS.map(([id, nome]) => `<option value="${id}">${nome}</option>`).join('');
$('mapa').value = sel.variante;
$('mapa').addEventListener('change', (e) => {
  sel.variante = e.target.value;
  montar();
  if (sel.topo) desenhar(); else iso(true);
});
$('modo').addEventListener('click', () => {
  sel.topo = !sel.topo;
  $('modo').textContent = sel.topo ? 'Visão de cima' : 'Isométrico';
  $('modo').classList.toggle('on', sel.topo);
  iso(!sel.topo);
});
for (const [id, campo] of [['grade', 'grade'], ['moveis', 'moveis'], ['arestas', 'arestas'], ['pintado', 'pintado'], ['centro', 'centro']]) {
  $(id).addEventListener('change', (e) => {
    sel[campo] = e.target.checked;
    if (campo === 'centro') montar();
    desenhar();
  });
}
// Afinar o encaixe do mapa pintado a olho, quando a medida automática deixar um resto.
window.addEventListener('keydown', (e) => {
  const base = PINTADOS[sel.variante];
  if (!base || !sel.topo || !sel.pintado) return;
  const a = (ajuste[sel.variante] ??= { x0: base.x0, y0: base.y0, escala: base.escala });
  const passo = e.shiftKey ? 10 : 1;
  const movimento = { ArrowLeft: ['x0', -passo], ArrowRight: ['x0', passo], ArrowUp: ['y0', -passo], ArrowDown: ['y0', passo],
    PageUp: ['escala', passo * 0.25], PageDown: ['escala', -passo * 0.25] }[e.key];
  if (!movimento) return;
  e.preventDefault();
  a[movimento[0]] += movimento[1];
  rodape();
  desenhar();
});

$('mais').addEventListener('click', () => { sel.celula = Math.min(140, sel.celula + 14); desenhar(); });
$('menos').addEventListener('click', () => { sel.celula = Math.max(28, sel.celula - 14); desenhar(); });

montar();
desenhar();
requestAnimationFrame(quadro);
window.__topo = { get cena() { return cena; }, sel, desenhar };
