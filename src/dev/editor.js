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
// O atlas ainda é desenhado: os mapas sem pintura trazem móveis em `objetos`, e vê-los ajuda a decalcar. O que
// saiu foi PÔR e TIRAR sprite pelo editor — isso é do mundo isométrico, e o cenário agora vem pintado.
import atlas from '../art/folhas/cenario.json';
import urlAtlas from '../art/folhas/cenario.png';

const $ = (id) => document.getElementById(id);
const canvas = $('tela');
const area = $('area');

// TODA cena do jogo abre aqui. A lista tinha dez; as outras dez só se podiam conferir lendo o código, e
// `src/dev/conferir-paredes.mjs` aponta achados em qualquer uma delas — de nada adianta o parecer dizer
// "(30,78)" se a cena não abre para olhar e corrigir.
const MAPAS_DO_JOGO = [
  ['emboscada', 'Emboscada na estrada'],
  ['ermo', 'Ermo'], ['ermoNoite', 'Ermo, de noite'], ['rua', 'Rua de Phandalin'],
  ['esconderijo', 'Esconderijo Cragmaw'], ['mansao', 'Mansão Tresendar'], ['mansaoTunel', 'Mansão Tresendar, pelo túnel'],
  ['poco', 'Poço da Coruja Velha'], ['cume', 'Cume'], ['castelo', 'Castelo Dentefino'],
  ['arvoreTrovao', 'Árvore Trovão'], ['ondaEco', 'Caverna Onda Eco'],
  ['casaDaMorte1', 'Casa da Morte, 1º andar'], ['casaDaMorte2', 'Casa da Morte, 2º andar'], ['casaDaMorte3', 'Casa da Morte, 3º andar'],
  ['casaDaMorte4', 'Casa da Morte, sótão'], ['casaDaMortePorao1', 'Casa da Morte, masmorra 1'], ['casaDaMortePorao2', 'Casa da Morte, masmorra 2'],
];

// O TERRENO, por ORDEM DE REGRA e não por material. Com mapa pintado por baixo, a aparência da casa vem do
// desenho: o que o glifo decide é só o que a regra faz com ela. A paleta antiga tinha 24 materiais de decoração
// (parquet, tapete, palha, ossos, cacos, mancha...) que não se veem mais sob a pintura e não mudam regra nenhuma.
const PISOS = [
  ['Livre', [[':', 'Estrada'], [',', 'Grama'], ['_', 'Caverna'], ['L', 'Laje'], ['U', 'Assoalho'], ['Z', 'Chão de fora']]],
  ['Barra passo e visão', [['R', 'Rocha'], ['#', 'Parede inteira'], ['T', 'Mata'], ['M', 'Alvenaria'], ['H', 'Casa'], ['Y', 'Taverna']]],
  ['Cobertura: barra passo, não visão', [['b', 'Arbusto'], ['r', 'Pedra'], ['u', 'Barris'], ['A', 'Estalagmite']]],
  ['Difícil: custa o dobro', [['%', 'Espinheiro'], ['w', 'Água rasa'], ['x', 'Entulho']]],
  ['Não se anda', [['W', 'Água funda'], ['O', 'Fosso']]],
];

// As luzes que se põem com um clique. `claro` e `penumbra` em PÉS, como o SRD conta.
const LUZES = [
  ['fogueira', 'Fogueira', 20, 20],
  ['tocha', 'Tocha', 20, 20],
  ['braseiro', 'Braseiro', 15, 15],
  ['vela', 'Vela', 5, 5],
  ['lanterna', 'Lanterna', 30, 30],
];

// AS FERRAMENTAS, na ordem do trabalho com mapa pintado: primeiro se põe o desenho e se enquadra a grade,
// depois se decalca em cima dele. Saíram as duas do mundo isométrico — pôr e tirar sprite de cenário —, porque
// o cenário agora está PINTADO no mapa, e o sprite por cima o desenharia duas vezes.
const FERRAMENTAS = [
  ['fundo', 'Mapa de fundo', '1'],
  ['aresta', 'Parede, porta e segredo', '2'],
  ['tracar', 'Parede livre', '3'],
  ['luz', 'Iluminação', '4'],
  ['piso', 'Terreno', '5'],
  ['altura', 'Altura', '6'],
  ['sala', 'Sala', '7'],
  ['inicio', 'Partida', '8'],
  ['interativo', 'Objeto interagível', '9'],
  ['frente', 'Camada de frente', '0'],
  ['sobrepor', 'Sobreposição', 'q'],
];

// ------------------------------------------------------------------------------------------------ estado ---
let mapa = M.ler() ?? M.limpar(mapaDo('casaDaMorte4'));
let cenaAberta = '';   // a cena do jogo que está aberta, se for uma: dá nome ao JSON exportado
let desfazer = [];
let refazer = [];
let sujo = true;
const sel = {
  ferramenta: 'fundo', piso: ':', estilo: 'parede', luz: 'fogueira', altura: 1, sala: 'sala1', inicio: 0,
  interativo: { id: 'bau', rotulo: 'Abrir o baú', texto: 'Um baú de carvalho com ferragens.', oculto: false, pistaVerbo: '', pistaCd: 10, pistaAchado: '' },
  modoPiso: 'pincel', modoAresta: 'aresta', modoFrente: 'pincel', frenteMarca: true,
  sobrepor: { id: '', url: '/mapas/fa/ChestOpen.webp', frente: false, ligada: true },
  celula: 64, verChao: true, verGrade: true, verMoveis: true, arestasFinas: false,
  fundoModo: 'calibrar', colunas: 5, linhas: 5,
  tracoModo: 'desenhar',
};
let hoverEdge = null;
let hoverTile = null;
let pressionado = null;   // { tipo, chave }
let campo = null;         // o Battlefield, que a vista desenha direto
const imgAtlas = new Image();
imgAtlas.src = urlAtlas;
let imgFundo = null;      // a imagem escolhida; vive só no navegador, nunca no mapa
let arrasto = null;       // o retângulo que está sendo arrastado para calibrar, em casas
let tracando = null;      // os pontos da parede livre que está sendo desenhada, em casas
// AS FERRAMENTAS DE ÁREA. Marcar a pegada de um prédio casa a casa é o que o Foundry resolve com Region e o
// Roll20 com o polígono da camada de luz: aqui são o retângulo arrastado, o polígono clicado e o balde.
let caixa = null;         // { a, b } em casas inteiras, enquanto se arrasta um retângulo (terreno, frente ou parede)
let poligono = null;      // os cantos clicados do polígono, em casas com fração

// AS SOBREPOSIÇÕES no editor: as imagens de verdade, para se ver o que se está colocando, e qual peça está
// escolhida. As imagens vêm do servidor pela mesma `url` que o jogo usa — se o arquivo não estiver lá, a peça
// aparece só como retângulo com o nome, que é exatamente o que o jogo faz também.
const imgSobre = new Map();
let sobreSel = '';        // o `id` da peça escolhida, que os campos do painel editam

function imagemDaPeca(url) {
  if (!url) return null;
  if (!imgSobre.has(url)) {
    const img = new Image();
    img.addEventListener('load', () => { sujo = true; }, { once: true });
    img.src = url;
    imgSobre.set(url, img);
  }
  const img = imgSobre.get(url);
  return img.complete && img.naturalWidth ? img : null;
}

/** Qual forma de área a ferramenta escolhida está usando. A parede só tem retângulo. */
const modoDeArea = () => (sel.ferramenta === 'piso' ? sel.modoPiso
  : sel.ferramenta === 'frente' ? sel.modoFrente : 'retangulo');


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
  T.pintarInterativos(ctx, campo, C, performance.now() / 1000);
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
  // A ALTURA, que de cima não aparece em lugar nenhum. Oito cenas usam desnível — os
  // barrancos do Poço, os cinco níveis da Mansão, os três da Onda Eco — e sem isto o editor desenhava todas
  // elas planas: não dava para conferir o que a regra usa para cobertura, custo de subida e linha de visão.
  if (sel.ferramenta === 'altura') {
    ctx.save();
    ctx.font = `bold ${Math.max(9, C * 0.34)}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let y = 0; y < campo.h; y++) {
      for (let x = 0; x < campo.w; x++) {
        const nivel = campo.heightAt(x, y);
        if (!nivel) continue;
        ctx.fillStyle = `rgba(120, 200, 255, ${0.10 + Math.min(nivel, 5) * 0.055})`;
        ctx.fillRect(x * C, y * C, C, C);
        if (C < 18) continue;        // em zoom pequeno o número vira borrão: fica só a tinta
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(0,0,0,.85)';
        ctx.strokeText(String(nivel), (x + 0.5) * C, (y + 0.5) * C);
        ctx.fillStyle = '#dff1ff';
        ctx.fillText(String(nivel), (x + 0.5) * C, (y + 0.5) * C);
      }
    }
    ctx.restore();
  }
  // A CAMADA DE FRENTE marcada à mão, que no editor não aparece de outro jeito: no jogo ela é a própria
  // pintura redesenhada, então sem esta tinta não se vê o que já foi marcado.
  if (sel.ferramenta === 'frente') {
    ctx.save();
    for (let y = 0; y < campo.h; y++) {
      for (let x = 0; x < campo.w; x++) {
        if (!M.frenteEm(mapa, x, y)) continue;
        ctx.fillStyle = 'rgba(120, 230, 160, .26)';
        ctx.fillRect(x * C, y * C, C, C);
        ctx.strokeStyle = 'rgba(150, 255, 190, .7)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x * C + 1, y * C + 1, C - 2, C - 2);
      }
    }
    ctx.restore();
  }
  // AS SOBREPOSIÇÕES. Fora da ferramenta, só as ACESAS, do jeito que o jogo as mostra. Dentro dela, todas —
  // as apagadas esmaecidas —, com o retângulo e o nome, porque é o nome que o roteiro da cena vai chamar.
  const naFerramenta = sel.ferramenta === 'sobrepor';
  for (const o of mapa.sobreposicoes ?? []) {
    if (!o.ligada && !naFerramenta) continue;
    const img = imagemDaPeca(o.url);
    ctx.save();
    ctx.globalAlpha = o.ligada ? (o.opacidade ?? 1) : 0.35;
    if (img) ctx.drawImage(img, o.x * C, o.y * C, o.w * C, o.h * C);
    else if (naFerramenta) { ctx.fillStyle = 'rgba(200,120,255,.18)'; ctx.fillRect(o.x*C, o.y*C, o.w*C, o.h*C); }
    ctx.restore();
    if (!naFerramenta) continue;
    const escolhida = o.id === sobreSel;
    ctx.save();
    ctx.setLineDash(o.ligada ? [] : [6, 4]);
    ctx.strokeStyle = escolhida ? '#ffd868' : '#c080ff';
    ctx.lineWidth = escolhida ? 3 : 2;
    ctx.strokeRect(o.x * C + 1, o.y * C + 1, o.w * C - 2, o.h * C - 2);
    ctx.setLineDash([]);
    if (C >= 14) {
      const rotulo = `${o.id}${o.frente ? ' ↑' : ''}${img ? '' : ' (sem arte)'}`;
      ctx.font = `bold ${Math.max(10, C * 0.26)}px system-ui`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(0,0,0,.85)';
      ctx.strokeText(rotulo, o.x * C + 5, o.y * C + 4);
      ctx.fillStyle = escolhida ? '#ffd868' : '#e8d0ff';
      ctx.fillText(rotulo, o.x * C + 5, o.y * C + 4);
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
  // A PRÉVIA DA ÁREA: ver antes de soltar é a diferença entre arrastar com confiança e arrastar e desfazer.
  if (caixa) {
    const x1 = Math.min(caixa.a.x, caixa.b.x);
    const x2 = Math.max(caixa.a.x, caixa.b.x);
    const y1 = Math.min(caixa.a.y, caixa.b.y);
    const y2 = Math.max(caixa.a.y, caixa.b.y);
    ctx.save();
    ctx.fillStyle = 'rgba(255,216,104,.18)';
    ctx.fillRect(x1 * C, y1 * C, (x2 - x1 + 1) * C, (y2 - y1 + 1) * C);
    ctx.strokeStyle = '#ffd868';
    ctx.lineWidth = Math.max(2, C * 0.06);
    ctx.strokeRect(x1 * C, y1 * C, (x2 - x1 + 1) * C, (y2 - y1 + 1) * C);
    ctx.restore();
    $('estado').textContent = `${x2 - x1 + 1} x ${y2 - y1 + 1} casas`;
  }
  if (poligono?.length) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,216,104,.16)';
    ctx.strokeStyle = '#ffd868';
    ctx.lineWidth = Math.max(2, C * 0.05);
    ctx.beginPath();
    ctx.moveTo(poligono[0][0] * C, poligono[0][1] * C);
    for (const [x, y] of poligono.slice(1)) ctx.lineTo(x * C, y * C);
    if (poligono.length > 2) { ctx.closePath(); ctx.fill(); }
    ctx.stroke();
    for (const [x, y] of poligono) { ctx.beginPath(); ctx.arc(x * C, y * C, Math.max(3, C * 0.08), 0, 7); ctx.fill(); }
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
    estado();      // os contadores do painel (traços, luzes, interagíveis) acompanham o que está no mapa
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
  else if (f === 'frente') aplicar(M.pintarFrente(mapa, t.x, t.y, sel.frenteMarca));
  else if (f === 'luz') { const l = LUZES.find(([id]) => id === sel.luz); aplicar(M.porLuz(mapa, t.x, t.y, { tipo: l[0], claro: l[2], penumbra: l[3] })); }
  else if (f === 'interativo') aplicar(M.porInterativo(mapa, t.x, t.y, sel.interativo.id.trim() ? objetoDoPainel() : null));
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
  // terreno, parede e camada de frente por ÁREA: retângulo arrastado, polígono clicado, balde de uma vez
  const porArea = (sel.ferramenta === 'piso' && sel.modoPiso !== 'pincel')
    || (sel.ferramenta === 'frente' && sel.modoFrente !== 'pincel')
    || sel.ferramenta === 'sobrepor'
    || (sel.ferramenta === 'aresta' && sel.modoAresta === 'retangulo');
  if (porArea) {
    const t = casaDe(e);
    if (!t) return;
    const modo = modoDeArea();
    if (modo === 'balde') {
      ponto();
      const n = sel.ferramenta === 'frente'
        ? M.frenteNoBalde(mapa, t.x, t.y, sel.frenteMarca)
        : M.balde(mapa, t.x, t.y, sel.piso);
      if (!aplicar(n > 0)) { desfazer.pop(); botoes(); }
    }
    else if (modo === 'poligono') {
      const c = casaFracionada(e);
      poligono = poligono ?? [];
      // fechar: clicar de novo bem perto do primeiro canto
      if (poligono.length >= 3 && Math.hypot(c.x - poligono[0][0], c.y - poligono[0][1]) < 0.6) fecharPoligono();
      else poligono.push([c.x, c.y]);
    } else caixa = { a: t, b: t };
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
  if (caixa) { const t = casaDe(e); if (t) caixa = { ...caixa, b: t }; return; }
  if (arrasto) { arrasto = { ...arrasto, b: casaFracionada(e) }; return; }
  if (e.target !== canvas) return;
  if ((e.buttons & 1) && sel.ferramenta !== 'fundo') agir(e, false);
  else {
    hoverEdge = sel.ferramenta === 'aresta' ? arestaDe(e) : null;
    hoverTile = casaDe(e);
    estado();
  }
});
/** Um nome livre para a peça nova: `peca1`, `peca2`... Nome é o que o roteiro usa para acender, então tem de existir. */
function proximoId() {
  const usados = new Set((mapa.sobreposicoes ?? []).map((o) => o.id));
  for (let i = 1; ; i++) if (!usados.has(`peca${i}`)) return `peca${i}`;
}

/** Enche o painel com a peça de `id` e a deixa escolhida. */
function escolherPeca(id) {
  const o = (mapa.sobreposicoes ?? []).find((p) => p.id === id);
  if (!o) return;
  sobreSel = id;
  sel.sobrepor = { id: o.id, url: o.url, frente: Boolean(o.frente), ligada: Boolean(o.ligada) };
  sobreNoPainel();
}

/**
 * O arrasto da ferramenta de sobreposição: a caixa vira o retângulo da peça.
 *
 * CLIQUE SECO DENTRO DE UMA PEÇA ESCOLHE em vez de criar — senão não haveria como pegar uma peça já posta para
 * mexer nela, e cada clique empilharia uma peça de uma casa por cima da outra.
 */
function sobreposicaoNoArrasto(a, b) {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  const w = Math.abs(a.x - b.x) + 1;
  const h = Math.abs(a.y - b.y) + 1;
  if (w === 1 && h === 1) {
    const achada = M.sobreposicoesEm(mapa, x, y)[0];
    if (achada) { escolherPeca(achada.id); return 0; }
  }
  const id = (sel.sobrepor.id || '').trim() || proximoId();
  const ok = M.porSobreposicao(mapa, {
    id, url: (sel.sobrepor.url || '').trim(), x, y, w, h,
    ligada: sel.sobrepor.ligada, frente: sel.sobrepor.frente,
  });
  if (ok) { sobreSel = id; sel.sobrepor.id = id; sobreNoPainel(); }
  return ok ? 1 : 0;
}

/** Fecha o polígono que está sendo clicado e pinta o que está dentro dele. */
function fecharPoligono() {
  const pts = poligono;
  poligono = null;
  if (!pts || pts.length < 3) return;
  ponto();
  const n = sel.ferramenta === 'frente'
    ? M.frenteNoPoligono(mapa, pts, sel.frenteMarca)
    : M.pintarPoligono(mapa, pts, sel.piso);
  if (!aplicar(n > 0)) { desfazer.pop(); botoes(); }
}

addEventListener('mouseup', () => {
  if (caixa) {
    const { a, b } = caixa;
    caixa = null;
    ponto();
    const n = sel.ferramenta === 'piso' ? M.pintarRetangulo(mapa, a, b, sel.piso)
      : sel.ferramenta === 'frente' ? M.frenteNoRetangulo(mapa, a, b, sel.frenteMarca)
        : sel.ferramenta === 'sobrepor' ? sobreposicaoNoArrasto(a, b)
          : M.paredesDoRetangulo(mapa, a, b, sel.estilo);
    if (!aplicar(n > 0)) { desfazer.pop(); botoes(); }
  }
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
  if (poligono?.length) {
    if (e.key === 'Enter') { fecharPoligono(); return; }
    if (e.key === 'Escape') { poligono = null; return; }
  }
  const f = FERRAMENTAS.find(([, , k]) => k === e.key);
  if (f) escolher(f[0]);
});

// ------------------------------------------------------------------------------------------------ painel ---

/** A seção da sobreposição: os campos da peça escolhida e a lista do que há no mapa. */
function sobreNoPainel() {
  const campo = (id, v) => { const e = $(id); if (e) { if (e.type === 'checkbox') e.checked = Boolean(v); else e.value = v ?? ''; } };
  campo('sId', sel.sobrepor.id);
  campo('sUrl', sel.sobrepor.url);
  campo('sLigada', sel.sobrepor.ligada);
  campo('sFrente', sel.sobrepor.frente);
  const conta = $('contaSobre');
  const lista = $('listaSobre');
  const todas = mapa.sobreposicoes ?? [];
  if (conta) conta.textContent = `${todas.length} peça(s), ${todas.filter((o) => o.ligada).length} acesa(s).`;
  if (!lista) return;
  lista.innerHTML = '';
  for (const o of todas) {
    const b = document.createElement('button');
    b.textContent = `${o.ligada ? '●' : '○'} ${o.id} — ${o.w}x${o.h}${o.frente ? ' ↑' : ''}`;
    b.classList.toggle('on', o.id === sobreSel);
    b.addEventListener('click', () => { escolherPeca(o.id); sujo = true; });
    lista.appendChild(b);
  }
}

/** A seção da camada de frente: se a folhagem sai da cor do desenho, e com que limiares. */
function frenteNoPainel() {
  const cor = mapa.frente?.cor;
  document.querySelectorAll('[data-frentecor]').forEach((b) => {
    b.classList.toggle('on', (b.dataset.frentecor === '1') === Boolean(cor));
  });
  const alvo = $('frenteCor');
  if (!alvo) return;
  alvo.textContent = cor
    ? `Folhagem pela cor: verde acima de ${cor.verde}, brilho abaixo de ${cor.escuro}. O recorte sai pixel a pixel do próprio desenho — não custa arte nenhuma.`
    : 'Sem máscara de cor: só as casas marcadas à mão entram na camada de frente.';
}

function estado() {
  const conta = $('contaTracos');
  if (conta) conta.textContent = `${mapa.tracos?.length ?? 0} traço(s) no mapa.`;
  const luzes = $('contaLuzes');
  if (luzes) luzes.textContent = `${mapa.luzes?.length ?? 0} luz(es) no mapa.`;
  const inter = $('contaInterativos');
  if (inter) inter.textContent = `${mapa.interativos?.length ?? 0} objeto(s) interagível(is) no mapa.`;
  const frente = $('contaFrente');
  if (frente) {
    const n = (mapa.frente?.casas ?? []).reduce((a, l) => a + [...l].filter((c) => c === '#').length, 0);
    frente.textContent = `${n} casa(s) marcada(s) à mão.`;
  }
  const t = hoverTile;
  if (!t) { $('estado').textContent = 'Passe o mouse no mapa. Botão do meio arrasta; a roda dá zoom.'; return; }
  const sala = M.salaDe(mapa, t.x, t.y);
  const o = M.propEm(mapa, t.x, t.y);
  const luz = (mapa.luzes ?? []).find((l) => l.pos?.x === t.x && l.pos?.y === t.y);
  const alvo = (mapa.interativos ?? []).find((i) => i.x === t.x && i.y === t.y);
  const pecas = M.sobreposicoesEm(mapa, t.x, t.y);
  const h = hoverEdge ? ` | aresta ${hoverEdge.lado === 'N' ? 'de cima' : 'da esquerda'}: ${M.ESTILOS_DE_ARESTA[M.estiloDaAresta(mapa, hoverEdge.x, hoverEdge.y, hoverEdge.lado)].rotulo}` : '';
  $('estado').innerHTML = `casa <b>${t.x},${t.y}</b> | piso <b>${mapa.terreno[t.y][t.x]}</b>${sala ? ` | sala <b>${sala}</b>` : ''}${o ? ` | objeto <b>${o.variante}</b>` : ''}${luz ? ` | luz <b>${luz.tipo}</b>` : ''}${alvo ? ` | interagível <b>${alvo.id}</b>` : ''}${M.frenteEm(mapa, t.x, t.y) ? ' | <b>frente</b>' : ''}${pecas.length ? ` | peça <b>${pecas.map((o) => o.id).join(', ')}</b>` : ''}${h}`;
}

/** O objeto interagível como o painel o descreve, com o TESTE (a pista) se um verbo foi escolhido. */
function objetoDoPainel() {
  const i = sel.interativo;
  const pista = i.pistaVerbo && i.pistaAchado.trim()
    ? { verbo: i.pistaVerbo, cd: Number(i.pistaCd) || 10, achado: i.pistaAchado.trim(), titulo: i.rotulo.trim() || i.id.trim() }
    : null;
  return { id: i.id, rotulo: i.rotulo, texto: i.texto, oculto: i.oculto, ...(pista ? { pista } : {}) };
}

/** O painel acompanha o mapa (depois de abrir, importar ou desfazer): o modo livre e a lista de sobreposições. */
function sincronizarModo() {
  const c = $('explorar');
  if (c) c.checked = mapa.cena === 'editor';
  // a peça escolhida pode ter sumido no desfazer, ou o mapa aberto ser outro
  if (sobreSel && !(mapa.sobreposicoes ?? []).some((o) => o.id === sobreSel)) sobreSel = '';
  sobreNoPainel();
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
  document.querySelectorAll('[data-secao]').forEach((s) => { s.hidden = s.dataset.secao !== f; });
  canvas.style.cursor = 'crosshair';
}

function montarPainel() {
  const L = $('lateral');
  L.innerHTML = `
    <h2>Ferramenta (teclas 1 a 0, e Q)</h2>
    <div class="ferramentas">${FERRAMENTAS.map(([id, nome, k]) => `<button data-ferramenta="${id}">${k} · ${nome}</button>`).join('')}</div>

    <div data-secao="piso">
      <h2>Terreno</h2>
      ${PISOS.map(([titulo, lista]) => `<p class="dica" style="margin:6px 0 2px">${titulo}</p>
      <div class="grade">${lista.map(([g, n]) => `<button data-piso="${g}" title="${n}">${n}</button>`).join('')}</div>`).join('')}
      <p class="dica">É a camada de REGRA, não a de aparência: com mapa pintado por baixo, quem se vê é o desenho,
      e o glifo só diz se a casa barra passo, barra visão, custa o dobro ou é livre.</p>
      <h2>Como pintar</h2>
      <div class="lista">
        <button data-modopiso="pincel">Pincel (casa a casa)</button>
        <button data-modopiso="retangulo">Retângulo (arrastar)</button>
        <button data-modopiso="poligono">Polígono (clicar os cantos)</button>
        <button data-modopiso="balde">Balde (encher a mancha)</button>
      </div>
      <p class="dica">O POLÍGONO fecha clicando de novo no primeiro canto (ou com <b>Enter</b>); <b>Esc</b> desiste.
      É assim que se marca a pegada de um prédio inteiro sem criar parede nenhuma: pinte a área com um glifo que
      barra passo e pronto.</p>
    </div>

    <div data-secao="sobrepor">
      <h2>Sobreposição</h2>
      <p class="dica">Pedaço de arte com NOME que o roteiro acende e apaga — a fogueira que acende, a ponte que
      cede, o baú que abre. É o ladrilho comutável de um mapa do Foundry; lá o mestre dá um duplo clique, aqui
      quem liga é o <code>aoInteragir</code> da cena, com <code>enc.field.alternarSobreposicao(id, true)</code>.</p>
      <p class="dica"><b>Arraste</b> um retângulo no mapa para pôr a peça. <b>Um clique</b> dentro de uma peça já
      posta escolhe ela, para mexer nos campos aqui.</p>
      <div class="numeros">
        <label>nome (o id que o roteiro chama)<input id="sId" type="text" /></label>
      </div>
      <div class="numeros">
        <label>arte (url que o jogo carrega)<input id="sUrl" type="text" /></label>
      </div>
      <label class="dica"><input type="checkbox" id="sLigada" /> começa acesa</label>
      <label class="dica"><input type="checkbox" id="sFrente" /> por cima das fichas (teto, ponte, copa)</label>
      <div class="lista">
        <button id="sAlternar">Acender / apagar a escolhida</button>
        <button id="sTirar">Tirar a escolhida</button>
      </div>
      <p class="dica">Não é camada de regra: a ponte que cai no desenho continua atravessável até alguém mudar o
      terreno (ferramenta 5) ou a parede (2).</p>
      <p class="dica" id="contaSobre">—</p>
      <div class="lista" id="listaSobre"></div>
    </div>

    <div data-secao="frente">
      <h2>Camada de frente</h2>
      <p class="dica">A parte da pintura que o tabuleiro redesenha <b>por cima das fichas</b>, para copa de árvore
      e beiral de telhado cobrirem em parte quem passa debaixo deles. Não é regra: quem barra passo é o terreno
      (ferramenta 5).</p>
      <div class="lista">
        <button data-frentecor="1">Derivar a folhagem da cor do desenho</button>
        <button data-frentecor="0">Só o que eu marcar à mão</button>
      </div>
      <p class="dica" id="frenteCor">—</p>
      <h2>Marcar à mão</h2>
      <div class="lista">
        <button data-frentemarca="1">Marcar</button>
        <button data-frentemarca="0">Apagar</button>
      </div>
      <div class="lista">
        <button data-modofrente="pincel">Pincel (casa a casa)</button>
        <button data-modofrente="retangulo">Retângulo (arrastar)</button>
        <button data-modofrente="poligono">Polígono (clicar os cantos)</button>
        <button data-modofrente="balde">Balde (a mancha de terreno igual)</button>
      </div>
      <p class="dica">Use a mão para o que a cor não acha — a palha dos chalés da Rua mede a mesma faixa de
      brilho da terra batida, e nenhuma regra de cor os separa. O <b>balde</b> enche a pegada inteira do prédio
      de uma vez, porque ela já é uma mancha de um glifo só.</p>
      <p class="dica">A borda da casa marcada à mão sai <b>reta</b>, na aresta da grade: serve para telhado, não
      para folha. Folha é trabalho da máscara de cor, que recorta pixel a pixel.</p>
      <p class="dica" id="contaFrente">—</p>
    </div>

    <div data-secao="aresta">
      <h2>Parede, porta e segredo</h2>
      <div class="lista">${Object.entries(M.ESTILOS_DE_ARESTA).map(([id, e]) => `<button data-estilo="${id}">${e.rotulo}</button>`).join('')}</div>
      <p class="dica">Passe o mouse perto da borda de uma casa: a aresta acende. Clique (ou arraste ao longo da parede) para pôr o estilo. Clicar de novo no mesmo estilo apaga.</p>
      <p class="dica"><b>Passagem secreta</b> é parede para quem joga: fica igual a uma parede no tabuleiro e entra
      em <code>secretas</code>, que é o que o roteiro da cena abre quando alguém a acha.</p>
      <h2>Como desenhar</h2>
      <div class="lista">
        <button data-modoaresta="aresta">Aresta a aresta</button>
        <button data-modoaresta="retangulo">Retângulo (arrastar)</button>
      </div>
      <p class="dica">O retângulo fecha o contorno de uma caixa de uma arrastada só — no Foundry isso vem de
      módulo (Indy Walls, Wayfinder), no núcleo é segmento por segmento.</p>
    </div>

    <div data-secao="luz">
      <h2>Iluminação</h2>
      <div class="lista">${LUZES.map(([id, n, c, pn]) => `<button data-luz="${id}">${n} — ${c} / ${pn} pés</button>`).join('')}</div>
      <p class="dica">Clique na casa para acender; clique de novo na mesma luz para apagar. O primeiro número é a
      luz CLARA e o segundo a penumbra, em pés, como o SRD conta. Num mapa escuro (<code>luz: 'escuro'</code>) é
      isto que o grupo enxerga.</p>
      <p class="dica" id="contaLuzes">—</p>
    </div>

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

    <div data-secao="interativo">
      <h2>Objeto interagível</h2>
      <label class="linha">id <input type="text" id="iId" value="${sel.interativo.id}" style="flex:1" /></label>
      <label class="linha">menu <input type="text" id="iRotulo" value="${sel.interativo.rotulo}" style="flex:1" /></label>
      <p class="dica" style="margin:6px 0 2px">texto (o que acontece quando a cena não reconhece o id)</p>
      <textarea id="iTexto" rows="3" style="width:100%">${sel.interativo.texto}</textarea>
      <label class="linha"><input type="checkbox" id="iOculto" /> Oculto (sem marca no tabuleiro)</label>
      <h3 style="margin:10px 0 4px">Teste (opcional)</h3>
      <label class="linha">verbo <select id="iVerbo" style="flex:1">
        <option value="">nenhum — só o "menu" acima</option>
        <option value="procurar">Procurar (Percepção) — o que está escondido</option>
        <option value="investigar">Investigar (Investigação) — o que se deduz</option>
        <option value="rastrear">Ler os rastros (Sobrevivência)</option>
        <option value="lembrar">Lembrar (História, Arcanismo, Religião, Natureza)</option>
      </select></label>
      <label class="linha">CD <input type="number" id="iCd" min="5" max="30" value="${sel.interativo.pistaCd}" style="width:5em" /></label>
      <p class="dica" style="margin:6px 0 2px">o que acha quem passa no teste</p>
      <textarea id="iAchado" rows="3" style="width:100%">${sel.interativo.pistaAchado}</textarea>
      <p class="dica">Com um verbo, o jogo põe a opção no menu da casa, com a perícia e o bônus de quem vai rolar, uma
      tentativa por herói; o achado vai para o diário. A Percepção passiva de quem chega perto já faz a casa brilhar
      se alcançar a CD. Sem roteiro nenhum.</p>
      <p class="dica">Clique na casa para pôr; clique de novo para tirar. No jogo ele aparece no menu do botão
      direito de quem estiver encostado, e o tabuleiro desenha um anel na casa — a não ser que seja oculto.</p>
      <p class="dica">O <b>id</b> é o nome pelo qual o roteiro da cena o reconhece
      (<code>capitulo.aoInteragir</code>). Sem roteiro, o clique abre o texto acima.</p>
      <p class="dica" id="contaInterativos">—</p>
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
  L.querySelectorAll('[data-luz]').forEach((b) => b.addEventListener('click', () => {
    sel.luz = b.dataset.luz;
    L.querySelectorAll('[data-luz]').forEach((x) => x.classList.toggle('on', x === b));
  }));
  // a sobreposição: os campos da peça, e os dois botões que mexem na escolhida
  for (const [id, campo] of [['sId', 'id'], ['sUrl', 'url']]) {
    $(id).addEventListener('input', (e) => { sel.sobrepor[campo] = e.target.value; });
  }
  for (const [id, campo] of [['sLigada', 'ligada'], ['sFrente', 'frente']]) {
    $(id).addEventListener('change', (e) => {
      sel.sobrepor[campo] = e.target.checked;
      // mexer no campo com uma peça escolhida muda a PEÇA, e não só o molde da próxima
      if (!sobreSel) return;
      ponto();
      const o = (mapa.sobreposicoes ?? []).find((p) => p.id === sobreSel);
      if (o && aplicar(M.porSobreposicao(mapa, { ...o, [campo]: e.target.checked }))) sobreNoPainel();
      else { desfazer.pop(); botoes(); }
    });
  }
  $('sAlternar').addEventListener('click', () => {
    if (!sobreSel) return;
    ponto();
    if (aplicar(M.alternarSobreposicao(mapa, sobreSel))) { escolherPeca(sobreSel); } else { desfazer.pop(); botoes(); }
  });
  $('sTirar').addEventListener('click', () => {
    if (!sobreSel) return;
    ponto();
    if (aplicar(M.tirarSobreposicao(mapa, sobreSel))) { sobreSel = ''; sobreNoPainel(); } else { desfazer.pop(); botoes(); }
  });
  // a camada de frente: marcar ou apagar, e se a folhagem sai da cor do desenho
  L.querySelectorAll('[data-frentemarca]').forEach((b) => b.addEventListener('click', () => {
    sel.frenteMarca = b.dataset.frentemarca === '1';
    L.querySelectorAll('[data-frentemarca]').forEach((x) => x.classList.toggle('on', x === b));
  }));
  L.querySelectorAll('[data-frentecor]').forEach((b) => b.addEventListener('click', () => {
    ponto();
    if (!aplicar(M.definirFrentePorCor(mapa, b.dataset.frentecor === '1' ? M.FRENTE_PADRAO : null))) { desfazer.pop(); botoes(); }
    frenteNoPainel();
  }));
  for (const [attr, campo] of [['data-modopiso', 'modoPiso'], ['data-modoaresta', 'modoAresta'], ['data-modofrente', 'modoFrente']]) {
    L.querySelectorAll(`[${attr}]`).forEach((b) => b.addEventListener('click', () => {
      sel[campo] = b.getAttribute(attr);
      poligono = null;
      L.querySelectorAll(`[${attr}]`).forEach((x) => x.classList.toggle('on', x === b));
    }));
    L.querySelector(`[${attr}="${sel[campo]}"]`)?.classList.add('on');
  }
  for (const [id, campo] of [['iId', 'id'], ['iRotulo', 'rotulo'], ['iTexto', 'texto']]) {
    $(id).addEventListener('input', (e) => { sel.interativo[campo] = e.target.value; });
  }
  $('iOculto').addEventListener('change', (e) => { sel.interativo.oculto = e.target.checked; });
  $('iVerbo').addEventListener('change', (e) => { sel.interativo.pistaVerbo = e.target.value; });
  $('iCd').addEventListener('input', (e) => { sel.interativo.pistaCd = e.target.value; });
  $('iAchado').addEventListener('input', (e) => { sel.interativo.pistaAchado = e.target.value; });
  L.querySelector(`[data-frentemarca="${sel.frenteMarca ? 1 : 0}"]`).classList.add('on');
  frenteNoPainel();
  sobreNoPainel();
  L.querySelector(`[data-luz="${sel.luz}"]`).classList.add('on');
  L.querySelector(`[data-piso="${sel.piso}"]`).classList.add('on');
  L.querySelector(`[data-estilo="${sel.estilo}"]`).classList.add('on');
  L.querySelector(`[data-inicio="${sel.inicio}"]`).classList.add('on');
  L.querySelector(`[data-altura="${sel.altura}"]`).classList.add('on');

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
  // `new URL(f.url)` sozinho estoura em endereço RELATIVO, e os mapas nossos usam `/mapas/...`: sem a base,
  // abrir o Ermo no editor derrubava o painel com "Invalid URL" antes de a imagem carregar.
  else if (!imgFundo) nome.textContent = f.url ? `Carregando ${f.nome} de ${new URL(f.url, location.href).host}…` : `O mapa pede "${f.nome}", mas a imagem não está neste navegador: carregue de novo.`;
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
  // IR PARA UMA CASA. `src/dev/conferir-paredes.mjs` devolve achados por coordenada — "[30,78] chão ilhado" —
  // e num mapa de 91 por 68 casas procurar isso com o olho é desistir. Digita-se `x,y` e a casa vem ao centro,
  // marcada como a de baixo do ponteiro.
  $('irPara').addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const [x, y] = String(e.target.value).split(/[^0-9-]+/).filter((v) => v !== '').map(Number);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !M.dentro(mapa, x, y)) { e.target.value = ''; return; }
    hoverTile = { x, y };
    // DESENHAR ANTES DE ROLAR: a tela só ganha o tamanho do mapa novo quando `desenharTopo` a redimensiona, e
    // rolar antes disso o navegador grampeia em zero — foi o que aconteceu na primeira versão.
    if (sujo) reconstruir();
    desenharTopo();
    const C = sel.celula;
    area.scrollLeft = Math.max(0, (x + 0.5) * C - area.clientWidth / 2);
    area.scrollTop = Math.max(0, (y + 0.5) * C - area.clientHeight / 2);
    $('estado').textContent = `casa (${x},${y})`;
  });

  $('abrir').addEventListener('click', () => {
    if (desfazer.length && !confirm('Abrir outro mapa descarta o que está na tela (dá para desfazer). Continuar?')) return;
    if (!$('base').value) return;
    ponto();
    try { mapa = M.limpar(mapaDo($('base').value)); cenaAberta = $('base').value; } catch (e) { alert(`Não abriu: ${e.message}`); return; }
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
    // o nome da cena, e não `cenario.json` para todas: revisando mapa a mapa, o terceiro arquivo já era
    // `cenario (2).json` e ninguém sabia de qual mapa era
    a.download = `${cenaAberta || 'cenario'}.json`; a.click(); URL.revokeObjectURL(a.href);
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
