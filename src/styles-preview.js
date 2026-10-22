// Quatro direções visuais para o mesmo jogo, desenhando a MESMA cena.
// Página de decisão: nada aqui é código de produção.

import { getSheet, drawSprite } from './art/sheet.js';

const SCENE = {
  w: 11, h: 7,
  walls: [[5, 2], [5, 3], [6, 2], [6, 3]],
  rough: [[2, 1], [3, 1], [2, 2]],
  cover: [[8, 5], [9, 5]],
  party: [
    { x: 2, y: 5, look: 'fighter', name: 'Dara', hp: 0.95, cls: 'GUE' },
    { x: 1, y: 4, look: 'rogue', name: 'Pip', hp: 0.7, cls: 'LAD' },
    { x: 1, y: 6, look: 'cleric', name: 'Brenn', hp: 1, cls: 'CLE' },
    { x: 0, y: 5, look: 'wizard', name: 'Ilvan', hp: 0.5, cls: 'MAG' },
  ],
  foes: [
    { x: 7, y: 2, look: 'goblinBoss', name: 'Chefe', hp: 0.8 },
    { x: 8, y: 3, look: 'goblin', name: 'Goblin A', hp: 1 },
    { x: 6, y: 5, look: 'goblin', name: 'Goblin B', hp: 0.35 },
    { x: 9, y: 1, look: 'wolf', name: 'Lobo', hp: 1 },
  ],
  move: [[2, 4], [3, 4], [3, 5], [3, 6], [4, 4], [4, 5], [4, 6], [2, 6], [2, 3], [3, 3]],
  target: [6, 5],
};

const STYLES = [
  {
    id: 'A', name: 'Pixel art em vista superior',
    pitch: 'O que está no protótipo hoje. Grade clara, bonecos em pixel art gerados por código, UI escura compacta.',
    pros: ['Arte sai de graça: personagem novo é um objeto de 10 linhas', 'Equipamento muda o boneco na hora', 'Legível em tela pequena', 'O mais rápido de levar adiante — já funciona'],
    cons: ['Visual de jogo indie, não de "mesa de D&D"', 'Mapa grande cansa a vista', 'Pixel art tem teto de sofisticação'],
    draw: drawPixel,
  },
  {
    id: 'B', name: 'Mesa de RPG (estilo VTT)',
    pitch: 'A estética de mesa de verdade: mapa em pergaminho, miniaturas vistas de cima como fichas redondas, dados grandes, tipografia de livro.',
    pros: ['Lê como D&D na hora — reconhecimento imediato', 'Token redondo dispensa arte de personagem: retrato + anel', 'Escala para qualquer mapa sem redesenhar nada', 'Combina com o log de rolagens que já existe'],
    cons: ['Parece ferramenta, não jogo', 'Menos personalidade visual própria', 'Skin vira moldura e retrato, não o corpo inteiro'],
    draw: drawVtt,
  },
  {
    id: 'C', name: 'Isométrico 2.5D',
    pitch: 'Grade em losango com altura real. Linhagem Final Fantasy Tactics / Baldur\'s Gate. O mapa vira cenário, não tabuleiro.',
    pros: ['De longe o mais bonito e o mais "aventura"', 'Altura e elevação viram mecânica de verdade', 'Dá peso dramático a chefe e cenário'],
    cons: ['Caro: cada personagem precisa de mais ângulos desenhados', 'Clicar em losango é pior que clicar em quadrado', 'Oclusão: parede esconde personagem, precisa de transparência', 'Atrasa o resto do projeto'],
    draw: drawIso,
  },
  {
    id: 'D', name: 'Minimalista tático',
    pitch: 'Formas geométricas, cor chapada, tipografia forte. Linhagem Into the Breach. A informação tática é o visual.',
    pros: ['Informação perfeita: dá para ler o combate inteiro num olhar', 'Custo de arte praticamente zero', 'Envelhece muito bem e tem identidade forte', 'Acessível: alto contraste, sem depender de detalhe fino'],
    cons: ['Frio — difícil criar apego ao personagem', 'Skin e equipamento viram cor e ícone, não visual', 'Contrasta com a fantasia de D&D'],
    draw: drawMinimal,
  },
];

// ---------------------------------------------------------------- utilidades

const hpColor = (p) => (p > 0.6 ? '#5fd07a' : p > 0.3 ? '#ffc83a' : '#ff5a5a');

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const has = (list, x, y) => list.some(([a, b]) => a === x && b === y);

// ---------------------------------------------------------------- estilo A

function drawPixel(ctx, W, H) {
  const T = 44;
  const ox = (W - SCENE.w * T) / 2;
  const oy = (H - SCENE.h * T) / 2;

  ctx.fillStyle = '#14121a';
  ctx.fillRect(0, 0, W, H);

  for (let y = 0; y < SCENE.h; y++) {
    for (let x = 0; x < SCENE.w; x++) {
      const wall = has(SCENE.walls, x, y);
      const rough = has(SCENE.rough, x, y);
      const cover = has(SCENE.cover, x, y);
      const base = wall ? '#2a2733' : rough ? '#3a4030' : '#2f3b30';
      ctx.fillStyle = (x + y) % 2 ? base : shadeHex(base, 1.1);
      ctx.fillRect(ox + x * T, oy + y * T, T, T);
      if (wall) { ctx.fillStyle = '#3a3647'; ctx.fillRect(ox + x * T + 3, oy + y * T + 3, T - 6, T - 10); }
      if (cover) { ctx.fillStyle = '#6b5a46'; ctx.fillRect(ox + x * T + 8, oy + y * T + 12, T - 16, T - 20); }
      if (rough) {
        ctx.fillStyle = 'rgba(150,200,110,.2)';
        for (let i = 0; i < 4; i++) ctx.fillRect(ox + x * T + 7 + i * 9, oy + y * T + 12 + (i % 2) * 9, 3, 7);
      }
    }
  }
  for (const [x, y] of SCENE.move) {
    ctx.fillStyle = 'rgba(96,168,255,.22)';
    ctx.fillRect(ox + x * T + 2, oy + y * T + 2, T - 4, T - 4);
    ctx.strokeStyle = 'rgba(130,195,255,.4)';
    ctx.strokeRect(ox + x * T + 2.5, oy + y * T + 2.5, T - 5, T - 5);
  }
  ctx.strokeStyle = 'rgba(255,255,255,.06)';
  for (let x = 0; x <= SCENE.w; x++) { ctx.beginPath(); ctx.moveTo(ox + x * T + .5, oy); ctx.lineTo(ox + x * T + .5, oy + SCENE.h * T); ctx.stroke(); }
  for (let y = 0; y <= SCENE.h; y++) { ctx.beginPath(); ctx.moveTo(ox, oy + y * T + .5); ctx.lineTo(ox + SCENE.w * T, oy + y * T + .5); ctx.stroke(); }

  const [tx, ty] = SCENE.target;
  ctx.strokeStyle = '#ff6a4b'; ctx.lineWidth = 2;
  ctx.strokeRect(ox + tx * T + 3, oy + ty * T + 3, T - 6, T - 6);
  ctx.lineWidth = 1;

  for (const c of [...SCENE.foes, ...SCENE.party].sort((a, b) => a.y - b.y)) {
    const cx = ox + c.x * T + T / 2;
    const cy = oy + c.y * T + T * 0.82;
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.beginPath(); ctx.ellipse(cx, cy, T * .3, T * .13, 0, 0, 7); ctx.fill();
    const ally = SCENE.party.includes(c);
    ctx.strokeStyle = ally ? 'rgba(110,200,255,.8)' : 'rgba(255,120,96,.75)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(cx, cy, T * .32, T * .15, 0, 0, 7); ctx.stroke();
    ctx.lineWidth = 1;
    drawSprite(ctx, getSheet(c.look), 'idle', 0, { x: cx, y: cy + 4, scale: 1 });
    const bw = T * .66;
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(cx - bw / 2 - 1, oy + c.y * T + 3, bw + 2, 6);
    ctx.fillStyle = ally ? hpColor(c.hp) : '#d4574a';
    ctx.fillRect(cx - bw / 2, oy + c.y * T + 4, bw * c.hp, 4);
  }
}

function shadeHex(hex, m) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v) => Math.max(0, Math.min(255, Math.round(v * m))).toString(16).padStart(2, '0');
  return `#${ch(n >> 16)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
}

// ---------------------------------------------------------------- estilo B

function drawVtt(ctx, W, H) {
  const T = 46;
  const ox = (W - SCENE.w * T) / 2;
  const oy = (H - SCENE.h * T) / 2;

  ctx.fillStyle = '#201910';
  ctx.fillRect(0, 0, W, H);

  // pergaminho
  const grad = ctx.createLinearGradient(ox, oy, ox + SCENE.w * T, oy + SCENE.h * T);
  grad.addColorStop(0, '#e8d7b0');
  grad.addColorStop(0.5, '#dcc79b');
  grad.addColorStop(1, '#cdb488');
  ctx.fillStyle = grad;
  ctx.fillRect(ox, oy, SCENE.w * T, SCENE.h * T);
  // manchas
  for (let i = 0; i < 90; i++) {
    const r = 6 + (i * 37) % 26;
    ctx.fillStyle = `rgba(120,90,50,${0.02 + ((i * 13) % 5) / 100})`;
    ctx.beginPath();
    ctx.arc(ox + ((i * 97) % (SCENE.w * T)), oy + ((i * 61) % (SCENE.h * T)), r, 0, 7);
    ctx.fill();
  }

  for (let y = 0; y < SCENE.h; y++) {
    for (let x = 0; x < SCENE.w; x++) {
      if (has(SCENE.walls, x, y)) {
        ctx.fillStyle = '#5a4a38';
        ctx.fillRect(ox + x * T, oy + y * T, T, T);
        ctx.strokeStyle = '#423429';
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(ox + x * T, oy + y * T + i * 15 + 7);
          ctx.lineTo(ox + x * T + T, oy + y * T + i * 15 + 7);
          ctx.stroke();
        }
      }
      if (has(SCENE.cover, x, y)) {
        ctx.fillStyle = '#7a6342';
        ctx.fillRect(ox + x * T + 9, oy + y * T + 11, T - 18, T - 20);
        ctx.strokeStyle = '#5a4830';
        ctx.strokeRect(ox + x * T + 9.5, oy + y * T + 11.5, T - 19, T - 21);
      }
      if (has(SCENE.rough, x, y)) {
        ctx.strokeStyle = 'rgba(90,110,60,.55)';
        for (let i = 0; i < 5; i++) {
          const px = ox + x * T + 8 + (i * 8) % (T - 14);
          const py = oy + y * T + T - 8;
          ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + 2, py - 10); ctx.stroke();
        }
      }
    }
  }

  for (const [x, y] of SCENE.move) {
    ctx.fillStyle = 'rgba(60,110,190,.22)';
    ctx.fillRect(ox + x * T, oy + y * T, T, T);
  }

  ctx.strokeStyle = 'rgba(70,50,30,.35)';
  for (let x = 0; x <= SCENE.w; x++) { ctx.beginPath(); ctx.moveTo(ox + x * T + .5, oy); ctx.lineTo(ox + x * T + .5, oy + SCENE.h * T); ctx.stroke(); }
  for (let y = 0; y <= SCENE.h; y++) { ctx.beginPath(); ctx.moveTo(ox, oy + y * T + .5); ctx.lineTo(ox + SCENE.w * T, oy + y * T + .5); ctx.stroke(); }

  // tokens circulares
  for (const c of [...SCENE.party, ...SCENE.foes]) {
    const cx = ox + c.x * T + T / 2;
    const cy = oy + c.y * T + T / 2;
    const r = T * 0.42;
    const ally = SCENE.party.includes(c);

    ctx.fillStyle = 'rgba(0,0,0,.25)';
    ctx.beginPath(); ctx.arc(cx + 2, cy + 3, r, 0, 7); ctx.fill();

    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r - 3, 0, 7); ctx.clip();
    ctx.fillStyle = ally ? '#2d3a52' : '#4a2420';
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    drawSprite(ctx, getSheet(c.look), 'idle', 0, { x: cx, y: cy + r - 2, scale: 0.92 });
    ctx.restore();

    ctx.lineWidth = 3;
    ctx.strokeStyle = ally ? '#4f7fc4' : '#b0442f';
    ctx.beginPath(); ctx.arc(cx, cy, r - 2, 0, 7); ctx.stroke();

    // anel de vida
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = ally ? hpColor(c.hp) : '#d4574a';
    ctx.beginPath();
    ctx.arc(cx, cy, r + 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * c.hp);
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  const [tx, ty] = SCENE.target;
  ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 3;
  ctx.setLineDash([6, 4]);
  ctx.beginPath(); ctx.arc(ox + tx * T + T / 2, oy + ty * T + T / 2, T * .48, 0, 7); ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineWidth = 1;

  // dado
  const dx = ox + SCENE.w * T - 76;
  const dy = oy + SCENE.h * T - 76;
  ctx.fillStyle = '#f3e8cf';
  ctx.strokeStyle = '#8a6a3a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(dx + 32, dy); ctx.lineTo(dx + 64, dy + 22); ctx.lineTo(dx + 52, dy + 60);
  ctx.lineTo(dx + 12, dy + 60); ctx.lineTo(dx, dy + 22); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#3a2a18';
  ctx.font = '700 26px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('17', dx + 32, dy + 42);
  ctx.lineWidth = 1;
}

// ---------------------------------------------------------------- estilo C

function drawIso(ctx, W, H) {
  const TW = 58; const TH = 29; const LIFT = 16;
  const ox = W / 2 - 30;
  const oy = 70;
  const iso = (x, y) => ({ sx: ox + (x - y) * TW / 2, sy: oy + (x + y) * TH / 2 });

  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#2a2438');
  sky.addColorStop(1, '#151220');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  const tile = (x, y, top, side1, side2, lift = 0) => {
    const { sx, sy } = iso(x, y);
    const py = sy - lift;
    ctx.beginPath();
    ctx.moveTo(sx, py); ctx.lineTo(sx + TW / 2, py + TH / 2);
    ctx.lineTo(sx, py + TH); ctx.lineTo(sx - TW / 2, py + TH / 2);
    ctx.closePath();
    ctx.fillStyle = top; ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.stroke();
    if (lift > 0) {
      ctx.beginPath();
      ctx.moveTo(sx - TW / 2, py + TH / 2); ctx.lineTo(sx, py + TH);
      ctx.lineTo(sx, py + TH + lift); ctx.lineTo(sx - TW / 2, py + TH / 2 + lift);
      ctx.closePath(); ctx.fillStyle = side1; ctx.fill();
      ctx.beginPath();
      ctx.moveTo(sx, py + TH); ctx.lineTo(sx + TW / 2, py + TH / 2);
      ctx.lineTo(sx + TW / 2, py + TH / 2 + lift); ctx.lineTo(sx, py + TH + lift);
      ctx.closePath(); ctx.fillStyle = side2; ctx.fill();
    }
  };

  for (let y = 0; y < SCENE.h; y++) {
    for (let x = 0; x < SCENE.w; x++) {
      const wall = has(SCENE.walls, x, y);
      const rough = has(SCENE.rough, x, y);
      const moveHi = has(SCENE.move, x, y);
      if (wall) tile(x, y, '#6a6276', '#453f52', '#52495f', LIFT);
      else if (rough) tile(x, y, '#4a5a38', '#2e3a22', '#36442a', 3);
      else tile(x, y, moveHi ? '#4a6e8e' : '#49603f', '#2d3c26', '#35462c', 3);
      if (has(SCENE.cover, x, y)) {
        const { sx, sy } = iso(x, y);
        ctx.fillStyle = '#7a6342';
        ctx.fillRect(sx - 12, sy - 14, 24, 22);
        ctx.fillStyle = '#5a4830';
        ctx.fillRect(sx - 12, sy + 4, 24, 4);
      }
    }
  }

  const all = [...SCENE.party, ...SCENE.foes].sort((a, b) => (a.x + a.y) - (b.x + b.y));
  for (const c of all) {
    const { sx, sy } = iso(c.x, c.y);
    const ally = SCENE.party.includes(c);
    ctx.fillStyle = 'rgba(0,0,0,.4)';
    ctx.beginPath(); ctx.ellipse(sx, sy + TH / 2 - 2, 15, 7, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = ally ? 'rgba(110,200,255,.85)' : 'rgba(255,120,96,.8)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(sx, sy + TH / 2 - 2, 17, 8, 0, 0, 7); ctx.stroke();
    ctx.lineWidth = 1;
    drawSprite(ctx, getSheet(c.look), 'idle', 0, { x: sx, y: sy + TH / 2, scale: 1.25 });
  }

  ctx.fillStyle = 'rgba(255,255,255,.45)';
  ctx.font = '12px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('mesma grade de 1,5 m, vista em losango — altura vira mecânica', W / 2, H - 14);
}

// ---------------------------------------------------------------- estilo D

function drawMinimal(ctx, W, H) {
  const T = 46;
  const ox = (W - SCENE.w * T) / 2;
  const oy = (H - SCENE.h * T) / 2;

  ctx.fillStyle = '#0f1117';
  ctx.fillRect(0, 0, W, H);

  for (let y = 0; y < SCENE.h; y++) {
    for (let x = 0; x < SCENE.w; x++) {
      ctx.fillStyle = (x + y) % 2 ? '#171b24' : '#141821';
      ctx.fillRect(ox + x * T, oy + y * T, T - 2, T - 2);
      if (has(SCENE.walls, x, y)) { ctx.fillStyle = '#39405a'; ctx.fillRect(ox + x * T, oy + y * T, T - 2, T - 2); }
      if (has(SCENE.rough, x, y)) {
        ctx.strokeStyle = '#2f5c3a'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ox + x * T + 8, oy + y * T + T - 10);
        ctx.lineTo(ox + x * T + T - 12, oy + y * T + 10);
        ctx.stroke(); ctx.lineWidth = 1;
      }
      if (has(SCENE.cover, x, y)) {
        ctx.strokeStyle = '#7a6a44'; ctx.lineWidth = 3;
        ctx.strokeRect(ox + x * T + 9, oy + y * T + 9, T - 20, T - 20);
        ctx.lineWidth = 1;
      }
    }
  }
  for (const [x, y] of SCENE.move) {
    ctx.fillStyle = 'rgba(70,150,255,.3)';
    ctx.fillRect(ox + x * T, oy + y * T, T - 2, T - 2);
  }

  const [tx, ty] = SCENE.target;
  ctx.fillStyle = 'rgba(255,90,70,.3)';
  ctx.fillRect(ox + tx * T, oy + ty * T, T - 2, T - 2);

  ctx.textAlign = 'center';
  for (const c of [...SCENE.party, ...SCENE.foes]) {
    const cx = ox + c.x * T + (T - 2) / 2;
    const cy = oy + c.y * T + (T - 2) / 2;
    const ally = SCENE.party.includes(c);
    const r = 15;

    if (ally) {
      ctx.fillStyle = '#2c6ea8';
      roundRect(ctx, cx - r, cy - r, r * 2, r * 2, 5);
      ctx.fill();
      ctx.fillStyle = '#e8f0ff';
      ctx.font = '700 12px ui-monospace, monospace';
      ctx.fillText(c.cls, cx, cy + 4);
    } else {
      ctx.fillStyle = '#a8392c';
      ctx.beginPath();
      ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r, cy);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffe2dc';
      ctx.font = '700 13px ui-monospace, monospace';
      ctx.fillText(c.look === 'wolf' ? 'L' : c.look === 'goblinBoss' ? 'C' : 'G', cx, cy + 5);
    }

    const bw = T - 14;
    ctx.fillStyle = '#000';
    ctx.fillRect(cx - bw / 2, cy + r + 2, bw, 4);
    ctx.fillStyle = ally ? hpColor(c.hp) : '#ff6a5a';
    ctx.fillRect(cx - bw / 2, cy + r + 2, bw * c.hp, 4);
  }

  ctx.fillStyle = 'rgba(255,255,255,.4)';
  ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('forma = lado · letra = tipo · barra = vida — tudo legível num olhar', W / 2, H - 14);
}

// ---------------------------------------------------------------- página

const root = document.getElementById('styles');
const el = (t, a = {}, ...kids) => {
  const n = document.createElement(t);
  for (const [k, v] of Object.entries(a)) {
    if (k === 'class') n.className = v;
    else if (k === 'style') Object.assign(n.style, v);
    else n.setAttribute(k, v);
  }
  for (const c of kids.flat()) if (c != null) n.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return n;
};

const style = document.createElement('style');
style.textContent = `
  body{margin:0;background:#0d0c12;color:#eceef4;font-family:'Segoe UI',system-ui,sans-serif}
  .page{max-width:1180px;margin:0 auto;padding:28px 20px 60px}
  h1{font-size:26px;margin:0 0 6px}
  .sub{color:#9aa0b4;margin:0 0 26px;font-size:14px;line-height:1.6;max-width:70ch}
  .card{background:#171521;border:1px solid rgba(255,255,255,.08);border-radius:14px;overflow:hidden;margin-bottom:22px}
  .cap{display:flex;gap:12px;align-items:baseline;padding:14px 18px 10px}
  .tag{background:#e0b84a;color:#241c05;font-weight:800;border-radius:6px;padding:2px 9px;font-size:13px}
  .cap h2{margin:0;font-size:18px}
  .pitch{color:#aeb4c6;font-size:13.5px;padding:0 18px 12px;line-height:1.6;max-width:85ch}
  canvas{display:block;width:100%;height:auto;background:#000}
  .lists{display:grid;grid-template-columns:1fr 1fr;gap:18px;padding:14px 18px 18px}
  @media(max-width:700px){.lists{grid-template-columns:1fr}}
  ul{margin:4px 0 0;padding-left:18px;font-size:13px;line-height:1.65}
  .pros h3,.cons h3{font-size:11px;letter-spacing:.1em;text-transform:uppercase;margin:0;color:#9aa0b4}
  .pros li{color:#bfe9c9}.cons li{color:#f0c3bb}
`;
document.head.append(style);

const page = el('div', { class: 'page' },
  el('h1', {}, 'Quatro direções visuais'),
  el('p', { class: 'sub' },
    'A mesma cena de combate — mesmo grupo, mesmos goblins, mesma grade de 1,5 m — desenhada de quatro jeitos. '
    + 'A regra do jogo não muda em nenhum deles; muda o que você vê e quanto custa produzir conteúdo novo.'),
);

for (const s of STYLES) {
  const canvas = el('canvas');
  canvas.width = 1120;
  canvas.height = 420;
  page.append(el('div', { class: 'card' },
    el('div', { class: 'cap' }, el('span', { class: 'tag' }, s.id), el('h2', {}, s.name)),
    el('p', { class: 'pitch' }, s.pitch),
    canvas,
    el('div', { class: 'lists' },
      el('div', { class: 'pros' }, el('h3', {}, 'A favor'), el('ul', {}, s.pros.map((p) => el('li', {}, p)))),
      el('div', { class: 'cons' }, el('h3', {}, 'Contra'), el('ul', {}, s.cons.map((p) => el('li', {}, p))))),
  ));
  requestAnimationFrame(() => s.draw(canvas.getContext('2d'), canvas.width, canvas.height));
}

root.append(page);
