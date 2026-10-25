// FERRAMENTA DE ALTURA DE PAREDE (só desenvolvimento).
//
// Abre o jogo em `/alturas.html?encontro=castelo&nivel=3` e deixa clicar nas
// paredes do mapa para baixar a altura de cada uma. É para decidir no olho o
// que nenhuma regra automática acerta: quais paredes ficam esquisitas altas.
//
// Clique numa parede: 3 níveis → 2 → 1 → volta ao que era.
// O que você marcar sai em `PAREDES_BAIXAS` no painel, pronto para colar em
// `src/dev/mapa-castelo.py`.
//
// A página usa o TABULEIRO DE VERDADE: o que se vê aqui é o que o jogo
// desenha, com a mesma câmera, a mesma pedra e a mesma luz. Uma maquete à
// parte mentiria exatamente no que se está julgando.
import { TW, TH, LIFT } from '../view/board.js';

const CICLO = [2, 1, null];          // null = volta à altura original
const RECEPTOR = 'http://127.0.0.1:8766/alturas.json';

/** Espera o jogo montar o tabuleiro. */
function esperarTabuleiro() {
  return new Promise((resolve) => {
    const olha = () => {
      const b = window.__app?.board;
      if (b?.field?.paredeN) resolve(b);
      else setTimeout(olha, 120);
    };
    olha();
  });
}

/** A altura, em níveis, que a casa desenha hoje. */
function alturaDe(f, x, y) {
  return f.paredeAlt?.[y * f.w + x] || 3;
}

/** As quatro pontas do pano de parede desta aresta, em pixels de tela. */
function panoDaAresta(b, x, y, lado, niveis) {
  const { sx, sy } = b.iso(x, y, b.field.heightAt(x, y));
  const A = { x: sx, y: sy };
  const B = lado === 'N'
    ? { x: sx + TW / 2, y: sy + TH / 2 }
    : { x: sx - TW / 2, y: sy + TH / 2 };
  const alto = niveis * LIFT;
  return [A, B, { x: B.x, y: B.y - alto }, { x: A.x, y: A.y - alto }];
}

/** O ponto está dentro do polígono? (raio para a direita) */
function dentro(p, poly) {
  let d = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const c = poly[j];
    if ((a.y > p.y) !== (c.y > p.y)
      && p.x < ((c.x - a.x) * (p.y - a.y)) / (c.y - a.y) + a.x) d = !d;
  }
  return d;
}

function montar(b) {
  const f = b.field;
  // O que o mapa trouxe, para saber o que foi mexido e o que não foi.
  const original = new Map();
  for (let y = 0; y < f.h; y++) {
    for (let x = 0; x < f.w; x++) original.set(`${x},${y}`, alturaDe(f, x, y));
  }
  const mexidas = new Map();          // 'x,y' -> níveis escolhidos

  if (!f.paredeAlt) f.paredeAlt = new Uint8Array(f.w * f.h).fill(3);

  const painel = document.createElement('div');
  painel.style.cssText = `position:fixed;right:10px;top:10px;z-index:99999;width:330px;
    background:#17151d;color:#e9e4d9;font:12px/1.45 ui-monospace,Consolas,monospace;
    border:1px solid #4a4454;border-radius:8px;padding:10px;box-shadow:0 8px 24px #0009`;
  painel.innerHTML = `
    <div style="font-weight:700;margin-bottom:6px">Altura das paredes</div>
    <div style="opacity:.75;margin-bottom:8px">
      Clique numa parede para baixá-la: 3 → 2 → 1 → volta.<br>
      O realce verde é o que você baixou.
    </div>
    <label style="display:block;margin-bottom:8px;cursor:pointer">
      <input type="checkbox" id="alt-tudo" checked> ver o castelo inteiro
    </label>
    <div id="alt-conta" style="margin-bottom:8px"></div>
    <textarea id="alt-saida" readonly style="width:100%;height:150px;background:#0e0d12;
      color:#cfe8c4;border:1px solid #3a3544;border-radius:5px;padding:6px;
      font:11px/1.4 ui-monospace,Consolas,monospace"></textarea>
    <div style="display:flex;gap:6px;margin-top:8px">
      <button id="alt-copiar" style="flex:1">Copiar</button>
      <button id="alt-salvar" style="flex:1">Salvar</button>
      <button id="alt-limpar" style="flex:1">Limpar</button>
    </div>
    <div id="alt-aviso" style="margin-top:6px;min-height:14px;opacity:.8"></div>`;
  document.body.appendChild(painel);

  const conta = painel.querySelector('#alt-conta');
  const saida = painel.querySelector('#alt-saida');
  const aviso = painel.querySelector('#alt-aviso');

  const texto = () => {
    const linhas = [...mexidas.entries()]
      .map(([k, n]) => { const [x, y] = k.split(',').map(Number); return [x, y, n]; })
      .sort((a, c) => a[1] - c[1] || a[0] - c[0])
      .map(([x, y, n]) => `    (${x}, ${y}): ${n},`);
    return linhas.length
      ? `# Colar em src/dev/mapa-castelo.py, no passe de altura de parede.\n`
        + `PAREDES_BAIXAS = {\n${linhas.join('\n')}\n}`
      : '(nada marcado ainda)';
  };
  const atualizar = () => {
    conta.textContent = `${mexidas.size} parede(s) baixada(s)`;
    saida.value = texto();
  };

  painel.querySelector('#alt-copiar').onclick = async () => {
    await navigator.clipboard.writeText(saida.value);
    aviso.textContent = 'copiado';
  };
  painel.querySelector('#alt-salvar').onclick = async () => {
    try {
      await fetch(RECEPTOR, { method: 'POST', body: JSON.stringify([...mexidas]) });
      aviso.textContent = 'salvo para o Claude';
    } catch {
      aviso.textContent = 'o receptor não está no ar — use Copiar';
    }
  };
  painel.querySelector('#alt-limpar').onclick = () => {
    for (const [k, n] of original) {
      const [x, y] = k.split(',').map(Number);
      f.paredeAlt[y * f.w + x] = n;
    }
    mexidas.clear();
    atualizar();
    b.render(1 / 60);
  };

  // VER O CASTELO INTEIRO. Quem está escolhendo paredes precisa VER as
  // paredes: com a escuridão do jogo por cima, metade do mapa é um borrão e
  // não dá para clicar no que não se enxerga.
  const proto = Object.getPrototypeOf(b);
  const escuroOriginal = proto.desenharEscuridao;
  const caixaTudo = painel.querySelector('#alt-tudo');
  const aplicarLuz = () => {
    proto.desenharEscuridao = caixaTudo.checked ? function semEscuro() {} : escuroOriginal;
    b.render(1 / 60);
  };
  caixaTudo.onchange = aplicarLuz;
  aplicarLuz();

  // O REALCE. Desenhado por cima do tabuleiro, depois de cada quadro: é o que
  // diz, sem ambiguidade, o que já foi marcado.
  const renderOriginal = proto.render;
  proto.render = function render(dt) {
    const r = renderOriginal.call(this, dt);
    if (!mexidas.size) return r;
    const ctx = this.ctx;
    ctx.save();
    for (const [k, n] of mexidas) {
      const [x, y] = k.split(',').map(Number);
      const i = y * f.w + x;
      for (const lado of ['N', 'O']) {
        const cod = lado === 'N' ? f.paredeN[i] : f.paredeO[i];
        if (!cod) continue;
        const p = panoDaAresta(this, x, y, lado, n);
        ctx.beginPath();
        ctx.moveTo(p[0].x, p[0].y);
        for (const q of p.slice(1)) ctx.lineTo(q.x, q.y);
        ctx.closePath();
        ctx.fillStyle = 'rgba(90, 230, 120, .22)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(140, 255, 170, .9)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
    ctx.restore();
    return r;
  };

  // O CLIQUE. Pega a aresta mais À FRENTE entre as que cobrem o ponto, que é
  // a que o olho acha que clicou.
  b.canvas.addEventListener('click', (ev) => {
    const r = b.canvas.getBoundingClientRect();
    const p = {
      x: (ev.clientX - r.left) * (b.canvas.width / r.width),
      y: (ev.clientY - r.top) * (b.canvas.height / r.height),
    };
    let achou = null;
    let fundo = -1;
    for (let y = 0; y < f.h; y++) {
      for (let x = 0; x < f.w; x++) {
        const i = y * f.w + x;
        const niveis = f.paredeAlt[i] || 3;
        for (const lado of ['N', 'O']) {
          const cod = lado === 'N' ? f.paredeN[i] : f.paredeO[i];
          if (!cod) continue;
          if (!dentro(p, panoDaAresta(b, x, y, lado, niveis))) continue;
          const d = x + y;
          if (d > fundo) { fundo = d; achou = { x, y }; }
        }
      }
    }
    if (!achou) return;
    ev.stopPropagation();
    const k = `${achou.x},${achou.y}`;
    const atual = mexidas.get(k);
    const passo = atual === undefined ? 0 : CICLO.indexOf(atual) + 1;
    const alvo = CICLO[passo % CICLO.length];
    if (alvo === null) mexidas.delete(k);
    else mexidas.set(k, alvo);
    f.paredeAlt[achou.y * f.w + achou.x] = alvo ?? original.get(k);
    atualizar();
    b.render(1 / 60);
  }, true);

  atualizar();
  b.render(1 / 60);
  console.log('[alturas] pronto: clique nas paredes');
}

esperarTabuleiro().then(montar);
