// BANCADA DO ESQUELETO.
//
// Serve para uma coisa só: ver se a geometria e as poses funcionam ANTES de
// alguém desenhar carne por cima. Um erro de profundidade num boneco de
// palitos custa um minuto; o mesmo erro depois do pintor pronto custa um dia.
//
// O que há para olhar, em ordem de importância:
//   - andar lê como andar, e não como tremor ou como desfile;
//   - o ataque carrega e descarrega, e o tronco torce nos dois quadros;
//   - caído, dormindo e morto são TRÊS desenhos, não um com três nomes;
//   - o ombro encolhe até zero no perfil e volta na diagonal;
//   - o membro de perto sai claro e o de longe escuro, e os dois TROCAM entre
//     leste e oeste;
//   - o olho de trás some quando a cabeça vira.

import {
  BIPEDE, QUADRUPEDE, PROPORCOES, comProporcoes, projetar, ordemDeDesenho,
} from '../art/rig/esqueleto.js';
import { ANIMACOES, aplicarPose } from '../art/rig/poses.js';
import { ANIMS } from '../art/sheet.js';

const BUSSOLA = ['S', 'SE', 'E', 'NE', 'N', 'NW', 'W', 'SW'];
const CORPOS = { BIPEDE, QUADRUPEDE };

// PARALAXE — o conserto do perfil.
//
// Ombro direito e esquerdo têm o mesmo z no repouso, então a 90 graus os dois
// projetam no MESMO x e os braços se superpõem pixel a pixel. A geometria está
// certa (de perfil se vê um ombro só), a leitura é que não: some o volume.
//
// O conserto sai do próprio número de profundidade — cada junta desliza na
// horizontal em proporção a quanto está perto da câmera. É o mesmo recurso que
// a pixel art boa usa à mão, deslocando o membro de trás dois pixels.
const estado = {
  corpo: 'BIPEDE', prop: 'chibi', anim: 'walk',
  escala: 4, paralaxe: 0.035, tocando: true,
};

const el = (t, a = {}, ...f) => {
  const n = document.createElement(t);
  for (const [k, v] of Object.entries(a)) {
    if (k === 'class') n.className = v;
    else if (k === 'style') Object.assign(n.style, v);
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else if (v != null && v !== false) n.setAttribute(k, v);
  }
  for (const x of f.flat()) if (x != null && x !== false) n.append(x instanceof Node ? x : String(x));
  return n;
};

/** O `hold` de cada animação vem da folha, para a bancada correr no tempo do jogo. */
const RITMO = Object.fromEntries(ANIMS.map((a) => [a.name, a.hold]));

const CEL = 56;
const ALT = 76;

function figura(ctx, juntas, ox, oy) {
  const px = (n) => ox + juntas[n].x + (juntas[n].prof - 128) * estado.paralaxe;
  const py = (n) => oy + juntas[n].y;

  for (const o of ordemDeDesenho(juntas)) {
    const perto = (juntas[o.de].prof + juntas[o.a].prof) / 2 > 128;
    ctx.strokeStyle = perto ? '#e8d8a8' : '#6b5c3e';
    ctx.lineWidth = Math.max(1, o.esp * 5);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(px(o.de), py(o.de));
    ctx.lineTo(px(o.a), py(o.a));
    ctx.stroke();
  }
  // A cabeça acompanha a profundidade do nariz, senão o crânio fica na frente
  // de um corpo que está de costas.
  ctx.fillStyle = juntas.nariz.prof > 128 ? '#d9c88e' : '#9d8d63';
  ctx.beginPath();
  ctx.arc(px('nariz'), py('nariz'), 6.5, 0, 7);
  ctx.fill();
  ctx.fillStyle = '#e8720f';
  // O olho que girou para trás some: é a prova mais barata de que a oclusão
  // por profundidade está funcionando.
  for (const olho of ['olhoD', 'olhoE']) {
    if (juntas[olho].prof >= 120) ctx.fillRect(px(olho) - 1, py(olho) - 1, 2, 2);
  }
}

function corpoAtual() {
  return comProporcoes(CORPOS[estado.corpo], PROPORCOES[estado.prop]);
}

/** Um quadro, numa direção. */
function juntasDe(corpo, nomeAnim, i, dir) {
  const a = ANIMACOES[nomeAnim];
  const posta = aplicarPose(corpo, a.pose(i % a.quadros));
  return projetar(posta, (dir * Math.PI) / 4, { alt: 40 });
}

// ---------------------------------------------------------------------------
// A grade: um quadro por coluna, uma direção por fileira.
// ---------------------------------------------------------------------------
function grade() {
  const corpo = corpoAtual();
  const n = ANIMACOES[estado.anim].quadros;
  const c = document.createElement('canvas');
  c.width = CEL * n;
  c.height = ALT * 8;
  const ctx = c.getContext('2d');
  for (let d = 0; d < 8; d++) {
    for (let i = 0; i < n; i++) {
      figura(ctx, juntasDe(corpo, estado.anim, i, d), i * CEL + CEL / 2, d * ALT + ALT - 12);
    }
    ctx.fillStyle = '#b5a888';
    ctx.font = '9px sans-serif';
    ctx.fillText(BUSSOLA[d], 4, d * ALT + 11);
  }
  c.style.cssText = `image-rendering:pixelated;width:${CEL * n * estado.escala}px;max-width:100%`;
  return c;
}

// ---------------------------------------------------------------------------
// A tira viva: a animação correndo nas oito direções, no tempo da folha.
// ---------------------------------------------------------------------------
const vivo = document.createElement('canvas');
vivo.width = CEL * 8;
vivo.height = ALT;
const vctx = vivo.getContext('2d');
let t0 = performance.now();

function tique() {
  const hold = RITMO[estado.anim] ?? [30];
  const total = hold.reduce((a, b) => a + b, 0);
  let k = Math.floor(((performance.now() - t0) / 1000) * 60) % total;
  let i = 0;
  for (; i < hold.length; i++) { if (k < hold[i]) break; k -= hold[i]; }
  const corpo = corpoAtual();
  vctx.clearRect(0, 0, vivo.width, vivo.height);
  for (let d = 0; d < 8; d++) {
    figura(vctx, juntasDe(corpo, estado.anim, Math.min(i, hold.length - 1), d),
      d * CEL + CEL / 2, ALT - 12);
    vctx.fillStyle = '#b5a888';
    vctx.font = '9px sans-serif';
    vctx.fillText(BUSSOLA[d], d * CEL + 4, 10);
  }
  if (estado.tocando) requestAnimationFrame(tique);
}

// ---------------------------------------------------------------------------
function montar() {
  vivo.style.cssText = `image-rendering:pixelated;width:${CEL * 8 * Math.min(estado.escala, 3)}px;max-width:100%`;
  const alvo = document.getElementById('palco');
  alvo.innerHTML = '';
  alvo.append(
    el('h2', {}, `${estado.anim} — correndo nas oito direções`),
    vivo,
    el('h2', {}, `${estado.anim} — quadro a quadro`),
    grade(),
  );
}

function controles() {
  const sel = (rotulo, chave, opcoes) => el('label', {}, `${rotulo} `,
    el('select', { onchange: (e) => { estado[chave] = e.target.value; t0 = performance.now(); montar(); } },
      opcoes.map((o) => el('option', { value: o, selected: estado[chave] === o }, o))));
  const num = (rotulo, chave, min, max, passo) => el('label', {}, `${rotulo} `,
    el('input', {
      type: 'range', min, max, step: passo, value: estado[chave],
      oninput: (e) => { estado[chave] = Number(e.target.value); montar(); },
    }));
  document.getElementById('controles').append(
    sel('animação', 'anim', Object.keys(ANIMACOES)),
    sel('corpo', 'corpo', Object.keys(CORPOS)),
    sel('proporções', 'prop', Object.keys(PROPORCOES)),
    num('zoom', 'escala', 2, 8, 1),
    num('paralaxe', 'paralaxe', 0, 0.12, 0.005),
    el('label', {}, 'tocando ', el('input', {
      type: 'checkbox', checked: estado.tocando,
      onchange: (e) => {
        estado.tocando = e.target.checked;
        if (estado.tocando) { t0 = performance.now(); tique(); }
      },
    })),
  );
}

controles();
montar();
tique();
