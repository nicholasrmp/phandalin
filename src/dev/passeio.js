// PASSEIO LIVRE (só desenvolvimento).
//
// Abre o jogo em `/passeio.html` direto em Árvore Trovão e deixa andar pelo
// mapa sem limite de movimento, sem luta e sem gatilho de cena, para VALIDAR o
// traçado: o tamanho, a posição de cada construção, se dá para entrar e sair.
//
// A página usa o JOGO DE VERDADE (tabuleiro, câmera, pedra, luz), a mesma razão
// da ferramenta de alturas: uma maquete à parte mentiria exatamente no que se
// está julgando.
//
// Controles:
//   clique no chão        anda até lá (qualquer distância)
//   W A S D               movem a CÂMERA (Shift acelera)
//   botão direito arrastado  empurra a câmera
//   roda do mouse         zoom
//   setas                 passo do herói na direção da tela
//   Q E Z C               passo do herói nas outras quatro direções da grade
//   Ir para…              pula para uma construção ou lugar
//
// O que fica desligado: os gatilhos da cena (infectados, zumbis, aranhas,
// dragão), a chegada de bandos e o limite de 60 pés por turno. O que continua:
// a cena inteira para quem quiser interagir (baús, poço, arca, conversas).
import { Battlefield, key } from '../core/grid.js';
import { ARVORE_TROVAO, MAPA_ARVORE_TROVAO } from '../game/arvoretrovao.js';

const GLIFOS = {
  ',': 'capim', ':': 'caminho de terra', T: 'mata (árvore)', b: 'arbusto', w: 'água',
  E: 'parede quebrada', M: 'alvenaria', L: 'laje', d: 'cacos', v: 'cinza',
  x: 'entulho', '%': 'espinheiro', A: 'estátua', F: 'fogueira', z: 'leito',
  u: 'barris', i: 'caixotes', K: 'baú', t: 'arca', m: 'mesa', s: 'mantimentos',
  q: 'poço', a: 'altar', c: 'ossos', p: 'palha',
  X: 'trigo', Z: 'cinza', $: 'teia', S: 'lago', y: 'margem', '^': 'mobília', '&': 'mobília baixa',
};

// W A S D movem a CÂMERA (abaixo). Os passos do herói ficam nas setas e em Q E Z C.
const PASSOS = {
  arrowup: [-1, -1], arrowdown: [1, 1], arrowleft: [-1, 1], arrowright: [1, -1],
  q: [-1, 0], e: [0, -1], z: [0, 1], c: [1, 0],
};

const LIVRE = 300;           // pés por "turno": cabe o mapa quase inteiro num clique

function esperarJogo() {
  return new Promise((resolve) => {
    const olha = () => {
      const a = window.__app;
      if (a?.board?.field && a.enc?.combatants?.length && a.capitulo) resolve(a);
      else setTimeout(olha, 150);
    };
    olha();
  });
}

const el = (tag, props = {}, ...filhos) => {
  const e = Object.assign(document.createElement(tag), props);
  e.append(...filhos);
  return e;
};

const app = await esperarJogo();
const { enc, board } = app;
const field = enc.field;
const terreno = MAPA_ARVORE_TROVAO.terreno;

// ----------------------------------------------------- cena sem gatilho ----
// A cena dispara cada encontro ao pisar num retângulo; aqui ninguém dispara.
app.capitulo.depoisDeMover = async () => {};

// As telas de chegada da cena: passa por elas sozinha, nos primeiros segundos.
const passar = setInterval(() => {
  const botao = [...document.querySelectorAll('button')].find((b) => /^Continuar$/.test(b.textContent.trim()));
  botao?.click();
}, 350);
setTimeout(() => clearInterval(passar), 9000);

// Sem a mancha azul do alcance: com 300 pés de cota ela cobre metade do mapa e
// esconde exatamente o chão que se quer julgar. Continua o traço do caminho que
// o cursor mostra.
const setOverlayOriginal = board.setOverlay.bind(board);
board.setOverlay = (patch) => setOverlayOriginal({ ...patch, reachable: null });
board.overlay.reachable = null;

// O limite de movimento: refaz a cota de todo o grupo a cada instante.
const darCota = () => {
  for (const c of enc.allOf('party')) {
    c.movementLeftFt = Math.max(c.movementLeftFt ?? 0, LIVRE);
    c.acted = false;
  }
};
darCota();
setInterval(darCota, 200);

// ------------------------------------------------------------ o herói ----
const heroi = () => app.selected ?? enc.allOf('party')[0];

function andarPara(x, y) {
  const c = heroi();
  if (!c || !field.inside(x, y)) return false;
  darCota();
  const alcance = enc.reachableFor(c);
  const no = alcance.get(key(x, y));
  if (!no || no.cost === 0) return false;
  enc.moveAlong(c, Battlefield.pathFrom(alcance, { x, y }));
  board.seguir(c.pos);
  atualizar();
  return true;
}

function passo(dx, dy) {
  const c = heroi();
  if (!c?.pos) return;
  const ok = andarPara(c.pos.x + dx, c.pos.y + dy);
  if (!ok) piscar(`(${c.pos.x + dx}, ${c.pos.y + dy}): ${descreve(c.pos.x + dx, c.pos.y + dy).terreno} — não dá`);
}

// O clique do jogo anda só dentro dos 60 pés do turno; aqui anda onde o
// alcance dá (LIVRE), que é bem mais.
app.onTileClick = (t) => {
  if (!t) return;
  const outro = enc.allOf('party').find((c) => c.pos?.x === t.x && c.pos?.y === t.y);
  if (outro) { app.select(outro); atualizar(); return; }
  if (!andarPara(t.x, t.y)) piscar(`(${t.x}, ${t.y}): ${descreve(t.x, t.y).terreno} — não dá para chegar`);
};

addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (/^(input|select|textarea)$/i.test(e.target?.tagName ?? '')) return;
  const p = PASSOS[e.key.toLowerCase()];
  if (!p) return;
  e.preventDefault();
  e.stopImmediatePropagation();
  passo(p[0], p[1]);
}, { capture: true });

// --------------------------------------------------------- a câmera livre ----
// W A S D rolam a câmera enquanto estiverem apertados (Shift acelera), e o
// botão direito arrastado a empurra. No jogo, o botão direito arrastado GIRA o
// tabuleiro: aqui o passeio pede para andar pelo mapa, e girar desorientaria.
const quadro = () => board.canvas.parentElement;
const camera = { w: false, a: false, s: false, d: false };

addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (/^(input|select|textarea)$/i.test(e.target?.tagName ?? '')) return;
  const k = e.key.toLowerCase();
  if (k in camera) { camera[k] = true; e.preventDefault(); e.stopImmediatePropagation(); }
}, { capture: true });
addEventListener('keyup', (e) => {
  const k = e.key.toLowerCase();
  if (k in camera) camera[k] = false;
}, { capture: true });
addEventListener('blur', () => { for (const k of Object.keys(camera)) camera[k] = false; });

let ultimo = performance.now();
const rolar = (agora) => {
  const dt = Math.min(0.1, (agora - ultimo) / 1000);
  ultimo = agora;
  const q = quadro();
  if (q) {
    const v = (camera.shift ? 1800 : 800) * dt;
    q.scrollLeft += ((camera.d ? 1 : 0) - (camera.a ? 1 : 0)) * v;
    q.scrollTop += ((camera.s ? 1 : 0) - (camera.w ? 1 : 0)) * v;
  }
  requestAnimationFrame(rolar);
};
addEventListener('keydown', (e) => { camera.shift = e.shiftKey; }, { capture: true });
addEventListener('keyup', (e) => { camera.shift = e.shiftKey; }, { capture: true });
requestAnimationFrame(rolar);

// Botão direito arrastado: empurra a câmera. Entra na captura da janela para
// chegar ANTES do tabuleiro, que usa o mesmo gesto para girar.
let arraste = null;
addEventListener('mousedown', (e) => {
  if (e.button !== 2 || e.target !== board.canvas) return;
  e.stopImmediatePropagation();
  e.preventDefault();
  arraste = { x: e.clientX, y: e.clientY };
  board.canvas.style.cursor = 'grabbing';
}, { capture: true });
addEventListener('mousemove', (e) => {
  if (!arraste) return;
  const q = quadro();
  q.scrollLeft -= e.clientX - arraste.x;
  q.scrollTop -= e.clientY - arraste.y;
  arraste = { x: e.clientX, y: e.clientY };
}, { capture: true });
addEventListener('mouseup', (e) => {
  if (e.button !== 2 || !arraste) return;
  arraste = null;
  board.canvas.style.cursor = '';
}, { capture: true });

// ------------------------------------------------------------ o painel ----
function construcaoEm(x, y) {
  for (const [id, p] of Object.entries(ARVORE_TROVAO.predios)) {
    if (x >= p.x0 && x <= p.x1 && y >= p.y0 && y <= p.y1) return p.nome;
  }
  const t = ARVORE_TROVAO.torre;
  if (Math.hypot(x - t.cx, y - t.cy) <= t.raio) return 'a Torre do Dragão';
  return null;
}

function descreve(x, y) {
  if (!field.inside(x, y)) return { terreno: 'fora do mapa', lugar: null, altura: 0 };
  const g = terreno[y]?.[x] ?? '?';
  return {
    glifo: g,
    terreno: GLIFOS[g] ?? `glifo "${g}"`,
    lugar: construcaoEm(x, y),
    altura: field.heightAt(x, y),
    barra: field.blocksMove(x, y),
  };
}

// Onde cada lugar pula: a casa livre mais perto do centro dele.
function livreMaisPerto(cx, cy, raio = 12) {
  let melhor = null;
  for (let r = 0; r <= raio && !melhor; r += 1) {
    for (let dy = -r; dy <= r; dy += 1) {
      for (let dx = -r; dx <= r; dx += 1) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = Math.round(cx) + dx;
        const y = Math.round(cy) + dy;
        if (!field.inside(x, y) || field.blocksMove(x, y)) continue;
        if (enc.allOf('party').some((c) => c.pos?.x === x && c.pos?.y === y)) continue;
        melhor = { x, y };
        break;
      }
      if (melhor) break;
    }
  }
  return melhor;
}

const LUGARES = [
  ['A chegada (sul)', ARVORE_TROVAO.chegada.x, ARVORE_TROVAO.chegada.y],
  ...Object.entries(ARVORE_TROVAO.predios).map(([id, p]) => [
    p.nome.replace(/^(a |o )/, (m) => m).replace(/^./, (s) => s.toUpperCase()),
    (p.x0 + p.x1) / 2, (p.y0 + p.y1) / 2,
  ]),
  ['A Torre do Dragão (dentro)', ARVORE_TROVAO.torre.cx, ARVORE_TROVAO.torre.cy],
  ['A Praça', (ARVORE_TROVAO.praca.x0 + ARVORE_TROVAO.praca.x1) / 2, (ARVORE_TROVAO.praca.y0 + ARVORE_TROVAO.praca.y1) / 2],
  ['A estátua', ARVORE_TROVAO.estatua.x, ARVORE_TROVAO.estatua.y],
  ['O Lago Trovão (margem)', ARVORE_TROVAO.lago.x0 - 2, (ARVORE_TROVAO.lago.y0 + ARVORE_TROVAO.lago.y1) / 2],
  ['O espinheirado (leste)', (ARVORE_TROVAO.jardim.x0 + ARVORE_TROVAO.jardim.x1) / 2, (ARVORE_TROVAO.jardim.y0 + ARVORE_TROVAO.jardim.y1) / 2],
  ['O pomar morto (sudoeste)', (ARVORE_TROVAO.pomar.x0 + ARVORE_TROVAO.pomar.x1) / 2, (ARVORE_TROVAO.pomar.y0 + ARVORE_TROVAO.pomar.y1) / 2],
  ['Canto noroeste', 4, 4],
  ['Canto nordeste', field.w - 5, 4],
  ['Canto sudoeste', 4, field.h - 5],
  ['Canto sudeste', field.w - 5, field.h - 5],
];

function pular(i) {
  const c = heroi();
  const [, cx, cy] = LUGARES[i];
  const alvo = livreMaisPerto(cx, cy);
  if (!c || !alvo) { piscar('não achei casa livre perto desse lugar'); return; }
  c.pos = { ...alvo, f: c.pos?.f };
  board.focarEm(c.pos);
  app.refresh();
  atualizar();
}

function juntarGrupo() {
  const c = heroi();
  if (!c?.pos) return;
  for (const o of enc.allOf('party')) {
    if (o === c) continue;
    const alvo = livreMaisPerto(c.pos.x, c.pos.y, 6);
    if (alvo) o.pos = { ...alvo, f: o.pos?.f };
  }
  app.refresh();
  atualizar();
}

const estilo = el('style', {
  textContent: `
    #passeio { position: fixed; top: 8px; right: 8px; z-index: 9999; width: 292px; padding: 10px 12px;
      background: rgba(20, 18, 26, .92); color: #e8e0d0; border: 1px solid #6b5a3a; border-radius: 8px;
      font: 12px/1.45 system-ui, sans-serif; box-shadow: 0 6px 24px rgba(0,0,0,.5); }
    #passeio h2 { margin: 0 0 6px; font-size: 13px; color: #f0d890; }
    #passeio .lin { margin: 2px 0; }
    #passeio .chave { color: #9a9080; }
    #passeio select, #passeio button { font: inherit; color: inherit; background: #2c2634;
      border: 1px solid #6b5a3a; border-radius: 4px; padding: 3px 6px; }
    #passeio select { width: 100%; margin: 4px 0; }
    #passeio button { cursor: pointer; margin: 2px 4px 2px 0; }
    #passeio button:hover { background: #3a3244; }
    #passeio .aviso { color: #ffb86b; min-height: 1.4em; }
    #passeio details { margin-top: 6px; color: #b8ae9c; }
    #passeio.fechado .corpo { display: none; }
    #passeio .topo { display: flex; justify-content: space-between; align-items: center; }
  `,
});
document.head.append(estilo);

const linhaCursor = el('div', { className: 'lin' });
const linhaHeroi = el('div', { className: 'lin' });
const aviso = el('div', { className: 'lin aviso' });
const seletor = el('select');
seletor.append(el('option', { value: '', textContent: 'Ir para…' }),
  ...LUGARES.map(([nome], i) => el('option', { value: String(i), textContent: nome })));
seletor.addEventListener('change', () => {
  if (seletor.value !== '') pular(Number(seletor.value));
  seletor.value = '';
  seletor.blur();
});

// A NEBLINA: o jogo escurece o que o grupo não vê (a vista é cortada por parede e
// por árvore), e num mapa de mata fechada isso deixa quase tudo no breu. Para
// VALIDAR o traçado o passeio começa com ela desligada; o botão liga de volta
// e mostra como o jogador de verdade enxerga.
const luzOriginal = field.luz;
const luzesOriginais = field.luzes;
let neblina = false;
field.luz = null;
field.luzes = [];
const botaoNeblina = el('button', { textContent: 'Neblina de visão: desligada' });
botaoNeblina.addEventListener('click', () => {
  neblina = !neblina;
  field.luz = neblina ? luzOriginal : null;
  field.luzes = neblina ? luzesOriginais : [];
  field.versao = (field.versao ?? 0) + 1;
  botaoNeblina.textContent = `Neblina de visão: ${neblina ? 'ligada' : 'desligada'}`;
  app.refresh();
});

// VER DENTRO DAS CASAS: no jogo, uma construção só se abre à vista quando o grupo está dentro
// dela ou enxerga dentro (`board.calcularSalasReveladas`); de fora ela é um bloco fechado. O
// passeio começa assim, como o jogo; este botão abre todas para validar o interior.
const botaoDentro = el('button', { textContent: 'Ver dentro das casas: desligado' });
botaoDentro.addEventListener('click', () => {
  board.verTudo = !board.verTudo;
  botaoDentro.textContent = `Ver dentro das casas: ${board.verTudo ? 'ligado' : 'desligado'}`;
  app.refresh();
});

const painel = el('div', { id: 'passeio' },
  el('div', { className: 'topo' },
    el('h2', { textContent: `Passeio livre · ${field.w} × ${field.h} casas` }),
    el('button', { textContent: '–', title: 'recolher', onclick: () => painel.classList.toggle('fechado') })),
  el('div', { className: 'corpo' },
    linhaHeroi, linhaCursor, aviso, seletor,
    el('button', { textContent: 'Juntar o grupo', onclick: juntarGrupo }),
    el('button', { textContent: 'Centrar no herói', onclick: () => board.focarEm(heroi()?.pos) }),
    botaoNeblina,
    botaoDentro,
    el('details', {},
      el('summary', { textContent: 'Controles' }),
      el('div', { innerHTML: 'W A S D: movem a câmera (Shift acelera).<br>Botão direito arrastado: empurra a câmera.<br>Roda do mouse: zoom.<br>Clique no chão: o herói anda até lá.<br>Setas: um passo na direção da tela · Q E Z C: nas outras quatro.<br>Clique noutro herói para trocar de quem anda.' }))));
// O painel fica ESCONDIDO: o passeio mostra só o mapa. `?painel` na URL (ou `window.__painel()`) o traz de volta.
const mostrarPainel = (ligado) => { painel.style.display = ligado ? '' : 'none'; };
mostrarPainel(new URLSearchParams(location.search).has('painel'));
window.__painel = () => mostrarPainel(painel.style.display === 'none');
document.body.append(painel);

let timer = 0;
function piscar(texto) {
  aviso.textContent = texto;
  clearTimeout(timer);
  timer = setTimeout(() => { aviso.textContent = ''; }, 3500);
}

function atualizar() {
  const c = heroi();
  if (c?.pos) {
    const d = descreve(c.pos.x, c.pos.y);
    linhaHeroi.innerHTML = `<span class="chave">${c.name}:</span> (${c.pos.x}, ${c.pos.y}) · ${d.terreno}${d.lugar ? ` · <b>${d.lugar}</b>` : ''}`;
  }
  const h = board.hover;
  if (h) {
    const d = descreve(h.x, h.y);
    linhaCursor.innerHTML = `<span class="chave">cursor:</span> (${h.x}, ${h.y}) · ${d.terreno}${d.lugar ? ` · ${d.lugar}` : ''}${d.altura ? ` · alt ${d.altura}` : ''}${d.barra ? ' · <i>barra o passo</i>' : ''}`;
  } else {
    linhaCursor.innerHTML = '<span class="chave">cursor:</span> —';
  }
}
setInterval(atualizar, 150);
atualizar();

// Começa perto do grupo. O enquadramento espera a janela TER tamanho: aberta
// numa aba escondida, o navegador mede o tabuleiro em 0 px, e a medida errada
// fica guardada para sempre.
const esperaTamanho = setInterval(() => {
  const q = board.canvas.parentElement;
  if (innerWidth < 400 || !q || q.clientWidth < 300) return;
  clearInterval(esperaTamanho);
  board.setZoom(1);
  board.fitWidth = null;
  board.enquadrarGrande(board.focoInicial ?? heroi()?.pos);
}, 250);
window.__passeio = { andarPara, pular, LUGARES };
