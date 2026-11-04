// O EDITOR DE CENÁRIO (`/editor.html`), VISTO DE CIMA. Desenha com `vista-topo.js` — a mesma vista que o jogo passa a usar. O isométrico
// saiu daqui: mapa se desenha de cima, como no Roll20 e no Foundry. A lógica das edições mora em `game/mapa-editor.js` (testável em Node);
// aqui é só tela e mouse.
//
// Ferramentas: piso, parede e portas (por aresta), objetos de cenário, salas, ponto de partida, altura e o mapa de fundo. Cada mudança vira
// um ponto de desfazer, é guardada no navegador (`localStorage`) e o botão "Testar no jogo" abre o jogo naquele mapa (`?encontro=editor`).
//
// O MAPA DE FUNDO é o alinhamento do Roll20: carrega-se a imagem pintada, enquadra-se a grade nela (arrastando um retângulo por cima de
// N x M quadrados desenhados) e desenha-se em cima o que é parede, porta e arco. A imagem NÃO entra no mapa — só o enquadramento
// (`mapa.fundo`) entra; a figura fica no navegador (IndexedDB), porque costuma ser arte de terceiros que não pode ser publicada.

import { mapaDo } from '../game/encounter.js';
import { montarCampo } from '../game/campo.js';
import * as M from '../game/mapa-editor.js';
import * as T from '../view/vista-topo.js';
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
  ['fundo', 'Mapa de fundo', '8'], ['tracar', 'Parede livre', '9'],
];

const PEGADAS = [[1, 1], [2, 1], [1, 2], [2, 2], [3, 1], [1, 3], [3, 2], [2, 3]];

// ------------------------------------------------------------------------------------------------ estado ---
let mapa = M.ler() ?? M.limpar(mapaDo('casaDaMorte4'));
let desfazer = [];
let refazer = [];
let sujo = true;
const sel = {
  ferramenta: 'piso', piso: 'U', estilo: 'parede', variante: null, baixo: false, espelhar: false, pega: [1, 1], altura: 1, sala: 'sala1', inicio: 0,
  celula: 64, verChao: true, verGrade: true, verMoveis: true, arestasFinas: false,
  fundoModo: 'calibrar', colunas: 5, linhas: 5,
  tracoModo: 'desenhar',
};
let hoverEdge = null;
let hoverTile = null;
let pressionado = null;   // { tipo, chave }
let campo = null;         // o Battlefield, que a vista desenha direto
let imgFundo = null;      // a imagem escolhida; vive só no navegador, nunca no mapa
let arrasto = null;       // o retângulo que está sendo arrastado para calibrar, em casas
let tracando = null;      // os pontos da parede livre que está sendo desenhada, em casas


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
  fundoNoPainel();
}

// -------------------------------------------------------------------------------------------- vista de cima ---
function reconstruir() {
  campo = montarCampo(mapa);
  $('tamanho').textContent = `${mapa.terreno[0].length} x ${mapa.terreno.length} casas`;
  sujo = false;
}

/** Desenha o mapa visto de cima: a imagem de fundo embaixo, e por cima o que o jogo sabe — chão, grade, parede, móvel. */
function desenharTopo() {
  const C = sel.celula;
  if (canvas.width !== campo.w * C || canvas.height !== campo.h * C) {
    canvas.width = campo.w * C;
    canvas.height = campo.h * C;
  }
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#0d0c11';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const comFundo = T.pintarFundo(ctx, imgFundo, mapa.fundo, C);
  if (sel.verChao) {
    ctx.save();
    if (comFundo) ctx.globalAlpha = 0.45;     // com mapa pintado embaixo, o chão do jogo é só conferência
    T.pintarChao(ctx, campo, C);
    ctx.restore();
  }
  if (sel.verGrade) T.pintarGrade(ctx, campo, C, comFundo ? 'rgba(120,200,255,.45)' : 'rgba(0,0,0,.28)');
  if (sel.verMoveis) T.pintarMoveis(ctx, mapa, C, atlas, imgAtlas);
  // O traço livre (parede de caverna, pedra, destroço) é desenhado como foi traçado. A aresta de casa é a DERIVADA
  // dele, que é o que a regra usa para barrar movimento — fica discreta por baixo, para dar para conferir as duas.
  const comTracos = Boolean(mapa.tracos?.length);
  ctx.save();
  if (comTracos) ctx.globalAlpha = 0.3;
  T.pintarArestas(ctx, campo, C, sel.arestasFinas || comFundo);
  ctx.restore();
  if (comTracos) T.pintarTracos(ctx, mapa.tracos, C, sel.arestasFinas || comFundo);
  marcarTopo(ctx, C);
}

/** Por cima do quadro: as salas, os pontos de partida, a aresta sob o cursor e o retângulo da calibração. */
function marcarTopo(ctx, C) {
  if (sel.ferramenta === 'sala') {
    ctx.save();
    ctx.globalAlpha = 0.3;
    for (const [id, casas] of Object.entries(mapa.salas ?? {})) {
      ctx.fillStyle = `hsl(${[...id].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) % 360} 80% 60%)`;
      for (const c of casas) ctx.fillRect(c.x * C, c.y * C, C, C);
    }
    ctx.restore();
  }
  if (sel.ferramenta === 'inicio' || sel.ferramenta === 'sala') {
    ctx.save();
    ctx.font = `bold ${Math.max(11, C * 0.3)}px system-ui`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    (mapa.grupo ?? []).forEach((p, i) => {
      ctx.lineWidth = 3; ctx.strokeStyle = '#000';
      ctx.fillStyle = i === sel.inicio && sel.ferramenta === 'inicio' ? '#ffd868' : '#fff';
      ctx.strokeText(String(i + 1), (p.x + 0.5) * C, (p.y + 0.5) * C);
      ctx.fillText(String(i + 1), (p.x + 0.5) * C, (p.y + 0.5) * C);
    });
    ctx.restore();
  }
  if (sel.ferramenta === 'aresta' && hoverEdge) {
    const { x, y, lado } = hoverEdge;
    ctx.save();
    ctx.strokeStyle = '#ffd868'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x * C, y * C);
    if (lado === 'N') ctx.lineTo((x + 1) * C, y * C); else ctx.lineTo(x * C, (y + 1) * C);
    ctx.stroke();
    ctx.restore();
  } else if (hoverTile && sel.ferramenta !== 'fundo') {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,216,104,.9)'; ctx.lineWidth = 2;
    ctx.strokeRect(hoverTile.x * C + 1, hoverTile.y * C + 1, C - 2, C - 2);
    ctx.restore();
  }
  if (tracando?.length) {
    ctx.save();
    ctx.strokeStyle = '#ffd868'; ctx.lineWidth = Math.max(3, C * 0.09);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(tracando[0].x * C, tracando[0].y * C);
    for (const p of tracando.slice(1)) ctx.lineTo(p.x * C, p.y * C);
    ctx.stroke();
    ctx.restore();
  }
  if (arrasto) {
    const x = Math.min(arrasto.a.x, arrasto.b.x) * C; const y = Math.min(arrasto.a.y, arrasto.b.y) * C;
    const w = Math.abs(arrasto.b.x - arrasto.a.x) * C; const h = Math.abs(arrasto.b.y - arrasto.a.y) * C;
    ctx.save();
    ctx.fillStyle = 'rgba(255,216,104,.18)'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#ffd868'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
  }
}

function quadro() {
  try {
    if (sujo) reconstruir();
    desenharTopo();
  } catch (e) {
    console.error(e);
    $('estado').textContent = `Erro ao desenhar: ${e.message}`;
  }
  requestAnimationFrame(quadro);
}

// ------------------------------------------------------------------------------------------------ pontaria ---
function pontoDe(e) {
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) * (canvas.width / r.width || 1), y: (e.clientY - r.top) * (canvas.height / r.height || 1) };
}
/** Com Shift, o ponto gruda no canto de casa mais perto: parede reta sai reta. Sem Shift, vai onde a mão foi. */
function prender(c, e) {
  return e?.shiftKey ? { x: Math.round(c.x * 2) / 2, y: Math.round(c.y * 2) / 2 } : c;
}

/** O ponto do mouse em CASAS (com fração), que é como a calibração e o arrasto do fundo falam. */
function casaFracionada(e) {
  const p = pontoDe(e);
  return { x: p.x / sel.celula, y: p.y / sel.celula };
}
function casaDe(e) {
  const p = pontoDe(e);
  const t = T.casaNoPonto(campo, sel.celula, p.x, p.y);
  return t && M.dentro(mapa, t.x, t.y) ? t : null;
}
/** A aresta mais perto do ponteiro entre as quatro da casa apontada. */
function arestaDe(e) {
  const P = pontoDe(e);
  return T.arestaNoPonto(mapa.terreno[0].length, mapa.terreno.length, sel.celula, P.x, P.y);
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
let arrastandoFundo = null;

function aoApertar(e) {
  if (e.button === 1) { panorama = { x: e.clientX, y: e.clientY, l: area.scrollLeft, t: area.scrollTop }; e.preventDefault(); return; }
  if (e.button !== 0) return;
  pressionado = null;
  if (sel.ferramenta === 'tracar') {
    const c = casaFracionada(e);
    if (sel.tracoModo === 'apagar') {
      ponto();
      if (!aplicar(M.apagarTraco(mapa, c.x, c.y, 0.6))) { desfazer.pop(); botoes(); }
    } else {
      tracando = [prender(c, e)];
    }
    e.preventDefault();
    return;
  }
  if (sel.ferramenta === 'fundo') {
    const c = casaFracionada(e);
    if (sel.fundoModo === 'mover') { ponto(); arrastandoFundo = c; } else { arrasto = { a: c, b: c }; }
    e.preventDefault();
    return;
  }
  agir(e, true);
}
canvas.addEventListener('mousedown', aoApertar);

addEventListener('mousemove', (e) => {
  if (panorama) { area.scrollLeft = panorama.l - (e.clientX - panorama.x); area.scrollTop = panorama.t - (e.clientY - panorama.y); return; }
  if (arrastandoFundo) {
    const c = casaFracionada(e);
    if (M.moverFundo(mapa, c.x - arrastandoFundo.x, c.y - arrastandoFundo.y)) { arrastandoFundo = c; aplicar(true); fundoNoPainel(); }
    return;
  }
  if (tracando) {
    const c = prender(casaFracionada(e), e);
    const ultimo = tracando[tracando.length - 1];
    if (Math.hypot(c.x - ultimo.x, c.y - ultimo.y) > 0.18) tracando.push(c);
    return;
  }
  if (arrasto) { arrasto = { ...arrasto, b: casaFracionada(e) }; return; }
  if (e.target !== canvas) return;
  if ((e.buttons & 1) && sel.ferramenta !== 'fundo') agir(e, false);
  else {
    hoverEdge = sel.ferramenta === 'aresta' ? arestaDe(e) : null;
    hoverTile = casaDe(e);
    estado();
  }
});
addEventListener('mouseup', () => {
  if (tracando) {
    const pontos = tracando;
    tracando = null;
    if (pontos.length >= 2) {
      ponto();
      if (!aplicar(M.tracarParede(mapa, pontos.map((p) => [p.x, p.y])))) { desfazer.pop(); botoes(); }
    }
  }
  if (arrasto) {
    const { a, b } = arrasto;
    arrasto = null;
    if (Math.abs(b.x - a.x) > 0.1 && Math.abs(b.y - a.y) > 0.1) {
      ponto();
      if (!aplicar(M.calibrarFundo(mapa, a, b, sel.colunas, sel.linhas))) { desfazer.pop(); botoes(); }
      fundoNoPainel();
    }
  }
  pressionado = null; panorama = null; arrastandoFundo = null;
});
canvas.addEventListener('mouseleave', () => { hoverEdge = null; hoverTile = null; estado(); });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  sel.celula = Math.min(200, Math.max(12, Math.round(sel.celula * (e.deltaY < 0 ? 1.12 : 1 / 1.12))));
}, { passive: false });

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
  const conta = $('contaTracos');
  if (conta) conta.textContent = `${mapa.tracos?.length ?? 0} traço(s) no mapa.`;
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
    <h2>Ferramenta (teclas 1 a 9)</h2>
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

    <div data-secao="fundo">
      <h2>Mapa de fundo</h2>
      <p class="dica">Decalcar um mapa pintado, como no Roll20: carregue a imagem, enquadre a grade nela e depois desenhe parede e porta por cima (ferramenta 2).</p>
      <button id="escolherFundo" style="width:100%">Escolher imagem…</button>
      <p class="dica" id="fundoNome">Nenhuma imagem carregada.</p>
      <h2>Enquadrar</h2>
      <div class="lista">
        <button data-fundomodo="calibrar">Calibrar: arrastar sobre N x M casas</button>
        <button data-fundomodo="mover">Mover a imagem</button>
      </div>
      <div class="numeros" style="margin-top:6px">
        <label>colunas do arrasto<input type="number" id="fColunas" min="1" max="60" value="5" /></label>
        <label>linhas do arrasto<input type="number" id="fLinhas" min="1" max="60" value="5" /></label>
      </div>
      <p class="dica">Arraste por cima de um bloco de quadrados DESENHADOS no mapa e diga quantos são. A escala e a fase da grade saem daí.</p>
      <div class="numeros" style="margin-top:6px">
        <label>px por casa<input type="number" id="fEscala" step="0.1" min="1" /></label>
        <label>giro<select id="fGiro"><option>0</option><option>90</option><option>180</option><option>270</option></select></label>
        <label>origem x<input type="number" id="fX" step="1" /></label>
        <label>origem y<input type="number" id="fY" step="1" /></label>
      </div>
      <label class="linha">Opacidade <input type="range" id="fOpaco" min="0" max="1" step="0.05" value="1" style="flex:1" /></label>
      <button id="ajustarMapa" style="width:100%;margin-top:6px">Crescer o mapa até cobrir a imagem</button>
      <button id="tirarFundo" style="width:100%;margin-top:4px">Tirar o fundo</button>
    </div>

    <div data-secao="tracar">
      <h2>Parede livre</h2>
      <p class="dica">Caverna, pedra e destroço não são retos. Clique e arraste para traçar a parede como ela é; a aresta de casa que a regra usa sai sozinha do traço.</p>
      <div class="lista">
        <button data-tracomodo="desenhar">Desenhar</button>
        <button data-tracomodo="apagar">Apagar traço</button>
      </div>
      <p class="dica">Segure <b>Shift</b> para grudar nos cantos de casa (parede reta sai reta). Apagar tira o traço inteiro e devolve as arestas que ele tinha criado — a parede pintada à mão (ferramenta 2) e as portas ficam.</p>
      <p class="dica" id="contaTracos">—</p>
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

    <h2>Vista de cima</h2>
    <label class="linha"><input type="checkbox" id="vChao" checked /> Pintar o chão do jogo</label>
    <label class="linha"><input type="checkbox" id="vGrade" checked /> Grade</label>
    <label class="linha"><input type="checkbox" id="vMoveis" checked /> Móveis</label>
    <label class="linha"><input type="checkbox" id="vFinas" /> Parede em linha fina (como o editor do Foundry)</label>
    <p class="dica">A roda do mouse dá zoom na vista de cima.</p>

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
  L.querySelectorAll('[data-fundomodo]').forEach((b) => b.addEventListener('click', () => {
    sel.fundoModo = b.dataset.fundomodo;
    L.querySelectorAll('[data-fundomodo]').forEach((x) => x.classList.toggle('on', x === b));
  }));
  L.querySelector(`[data-fundomodo="${sel.fundoModo}"]`).classList.add('on');
  L.querySelectorAll('[data-tracomodo]').forEach((b) => b.addEventListener('click', () => {
    sel.tracoModo = b.dataset.tracomodo;
    L.querySelectorAll('[data-tracomodo]').forEach((x) => x.classList.toggle('on', x === b));
  }));
  L.querySelector(`[data-tracomodo="${sel.tracoModo}"]`).classList.add('on');
  $('escolherFundo').addEventListener('click', () => $('arquivoFundo').click());
  $('fColunas').addEventListener('input', (e) => { sel.colunas = Math.max(1, Number(e.target.value) || 1); });
  $('fLinhas').addEventListener('input', (e) => { sel.linhas = Math.max(1, Number(e.target.value) || 1); });
  for (const [id, campoDoFundo] of [['fEscala', 'escala'], ['fX', 'x0'], ['fY', 'y0'], ['fGiro', 'giro'], ['fOpaco', 'opacidade']]) {
    $(id).addEventListener('input', (e) => {
      if (!mapa.fundo) return;
      ponto();
      if (!aplicar(M.definirFundo(mapa, { [campoDoFundo]: Number(e.target.value) }))) { desfazer.pop(); botoes(); }
      if (campoDoFundo === 'giro') fundoNoPainel();
    });
  }
  $('tirarFundo').addEventListener('click', () => { ponto(); if (!aplicar(M.definirFundo(mapa, null))) { desfazer.pop(); botoes(); } fundoNoPainel(); });
  $('ajustarMapa').addEventListener('click', () => {
    if (!mapa.fundo || !imgFundo) return;
    ponto();
    let mudou = false;
    // cada crescimento pelo norte ou pelo oeste desloca as casas, então o retângulo se recalcula a cada borda
    for (const borda of ['O', 'N', 'L', 'S']) {
      const c = M.casasDoFundo(mapa, imgFundo.naturalWidth, imgFundo.naturalHeight);
      const n = { O: -c.x1, N: -c.y1, L: c.x2 - mapa.terreno[0].length, S: c.y2 - mapa.terreno.length }[borda];
      if (n) mudou = M.redimensionar(mapa, borda, n) || mudou;
    }
    if (!aplicar(mudou)) { desfazer.pop(); botoes(); }
    fundoNoPainel();
  });
  for (const [id, campoVisto] of [['vChao', 'verChao'], ['vGrade', 'verGrade'], ['vMoveis', 'verMoveis'], ['vFinas', 'arestasFinas']]) {
    $(id).checked = sel[campoVisto];
    $(id).addEventListener('change', (e) => { sel[campoVisto] = e.target.checked; });
  }
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

// ------------------------------------------------------------------------------- a imagem de fundo, no navegador ---
//
// A figura não entra no mapa nem no repositório: fica no IndexedDB deste navegador. Quase sempre é arte de terceiros
// (um battlemap comprado), e o que o jogo precisa guardar é só o ENQUADRAMENTO.

const BD = 'phandalin.editor';
function comBanco(modo, trabalho) {
  return new Promise((ok, falha) => {
    const p = indexedDB.open(BD, 1);
    p.onupgradeneeded = () => p.result.createObjectStore('fundos');
    p.onerror = () => falha(p.error);
    p.onsuccess = () => {
      const t = p.result.transaction('fundos', modo);
      const r = trabalho(t.objectStore('fundos'));
      r.onsuccess = () => ok(r.result);
      r.onerror = () => falha(r.error);
    };
  });
}
const guardarFundo = (nome, blob) => comBanco('readwrite', (s) => s.put(blob, nome)).catch(() => {});
const lerFundo = (nome) => comBanco('readonly', (s) => s.get(nome)).catch(() => null);

function usarFundo(blob, nome) {
  const img = new Image();
  img.addEventListener('load', () => { imgFundo = img; sujo = true; fundoNoPainel(); }, { once: true });
  img.addEventListener('error', () => { imgFundo = null; fundoNoPainel(); }, { once: true });
  img.src = URL.createObjectURL(blob);
  img.nomeDoArquivo = nome;
}

/** Põe no painel os números do enquadramento que está valendo. */
function fundoNoPainel() {
  const f = mapa.fundo;
  const campos = { fEscala: f?.escala ?? '', fX: f?.x0 ?? '', fY: f?.y0 ?? '', fGiro: String(f?.giro ?? 0), fOpaco: f?.opacidade ?? 1 };
  for (const [id, v] of Object.entries(campos)) if ($(id)) $(id).value = v;
  const nome = $('fundoNome');
  if (!nome) return;
  if (!f) nome.textContent = 'Nenhuma imagem carregada.';
  else if (!imgFundo) nome.textContent = f.url ? `Carregando ${f.nome} de ${new URL(f.url).host}…` : `O mapa pede "${f.nome}", mas a imagem não está neste navegador: carregue de novo.`;
  else nome.textContent = `${f.nome} — ${imgFundo.naturalWidth} x ${imgFundo.naturalHeight} px, ${f.escala} px por casa.`;
}

/**
 * Depois de abrir ou importar um mapa: se ele pede um fundo, procura a imagem.
 * Primeiro a guardada neste navegador; se não houver, o endereço que o mapa traz (`fundo.url`) — é o caso dos mapas
 * vindos do Roll20, que apontam para o `files.d20.io`.
 */
async function recuperarFundo() {
  const f = mapa.fundo;
  imgFundo = null;
  if (f?.nome) {
    const blob = await lerFundo(f.nome);
    if (blob) { usarFundo(blob, f.nome); fundoNoPainel(); return; }
  }
  if (f?.url) {
    // sem `crossOrigin`: o `files.d20.io` não manda cabeçalho de CORS, e para DESENHAR a imagem não é preciso
    const img = new Image();
    img.addEventListener('load', () => { imgFundo = img; sujo = true; fundoNoPainel(); }, { once: true });
    img.addEventListener('error', () => { imgFundo = null; fundoNoPainel(); }, { once: true });
    img.src = f.url;
  }
  fundoNoPainel();
}

// ------------------------------------------------------------------------------------------------ cabeçalho ---
function iniciarCabecalho() {
  $('base').innerHTML = '<option value="" disabled selected>(mapa em edição)</option>' + MAPAS_DO_JOGO.map(([id, nome]) => `<option value="${id}">${nome}</option>`).join('');
  $('abrir').addEventListener('click', () => {
    if (desfazer.length && !confirm('Abrir outro mapa descarta o que está na tela (dá para desfazer). Continuar?')) return;
    if (!$('base').value) return;
    ponto();
    try { mapa = M.limpar(mapaDo($('base').value)); } catch (e) { alert(`Não abriu: ${e.message}`); return; }
    sujo = true; agendarGuardar(); sincronizarModo(); recuperarFundo();
  });
  $('novo').addEventListener('click', () => {
    const t = prompt('Tamanho do mapa novo (largura x altura, em casas):', '12x12');
    const m = /^(\d+)\s*[x×]\s*(\d+)$/i.exec(t ?? '');
    if (!m) return;
    const w = Math.min(80, Math.max(5, Number(m[1]))); const h = Math.min(80, Math.max(5, Number(m[2])));
    ponto(); mapa = M.novoMapa(w, h); sujo = true; agendarGuardar(); sincronizarModo(); recuperarFundo();
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
      ponto(); mapa = m; sujo = true; agendarGuardar(); sincronizarModo(); recuperarFundo();
    } catch (err) { alert(`Esse arquivo não é um cenário: ${err.message}`); }
  });
  $('testar').addEventListener('click', () => { M.guardar(mapa); window.open('/?encontro=editor&nivel=2', '_blank'); });
  $('arquivoFundo').addEventListener('change', async (e) => {
    const arq = e.target.files[0]; e.target.value = '';
    if (!arq) return;
    ponto();
    M.definirFundo(mapa, { nome: arq.name });
    await guardarFundo(arq.name, arq);
    usarFundo(arq, arq.name);
    aplicar(true);
    sel.verChao = false;
    if ($('vChao')) $('vChao').checked = false;   // com mapa pintado, o chão do jogo só atrapalha
  });
}

montarPainel();
iniciarCabecalho();
recuperarFundo();
botoes();
avisar();
estado();
requestAnimationFrame(quadro);
window.__editor = {
  arestaDe, casaDe, agir, M, sel, usarFundo, recuperarFundo,
  desenhar: () => { if (sujo) reconstruir(); desenharTopo(); },
  get mapa() { return mapa; }, set mapa(v) { mapa = v; sujo = true; },
  get campo() { return campo; }, get imgFundo() { return imgFundo; },
};
