// O AMBIENTE VIVO das cavernas: o que se mexe no cenário sem ser criatura nem arte nova.
//
// Tudo isto é desenhado em código (nenhuma geração do PixelLab) na MESMA tela do brilho das fontes de luz, que é furada
// pela máscara da escuridão: só se vê o que o grupo enxerga. Cada efeito sai do tempo do tabuleiro e de um sorteio fixo
// da casa, sem estado guardado: o mesmo instante dá o mesmo quadro, e nada acumula.
//
//   fungos       o tapete pulsa devagar num verde-azulado, e solta esporos que sobem
//   bolas        as bolas brilhantes respiram (pulso mais forte) e soltam esporos
//   cogumelos    os cogumelos gigantes soltam esporos pálidos pela copa
//   brasas       braseiro, fogueira e chama verde soltam faíscas que sobem e morrem
//   brilhos      a água escura cintila (reflexo de um ponto que acende e apaga) e os cristais piscam

const TOPO_DE = { bolas: 16, cogumelos: 52, brasas: 24, cristais: 22 };

/** Sorteio fixo em [0, 1) de uma casa e uma "chave": o mesmo par dá sempre o mesmo valor. */
function sorteio(x, y, k = 0) {
  let n = (Math.imul(x + 1, 374761393) + Math.imul(y + 1, 668265263) + Math.imul(k + 1, 2147483647)) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

const CACHE = new WeakMap();

/** Os pontos do mapa que têm vida própria, achados uma vez por mapa. */
export function emissoresDoAmbiente(field) {
  if (CACHE.has(field)) return CACHE.get(field);
  const e = { fungos: [], bolas: [], cogumelos: [], brasas: [], agua: [], cristais: [] };
  for (let y = 0; y < field.h; y += 1) {
    for (let x = 0; x < field.w; x += 1) {
      const sup = field.surfaceAt(x, y);
      if (sup === 'fungos' && sorteio(x, y, 1) < 0.2) e.fungos.push({ x, y });
      else if (sup === 'aguaEscura' && sorteio(x, y, 2) < 0.14) e.agua.push({ x, y });
      else if (sup === 'braseiro' || sup === 'fogueira') e.brasas.push({ x, y, cor: '255, 168, 72' });
    }
  }
  for (const o of field.objetos ?? []) {
    if (o.tipo !== 'prop') continue;
    if (o.variante === 'bolasBrilhantes') e.bolas.push({ x: o.x, y: o.y });
    else if (o.variante === 'cogumeloGigante') e.cogumelos.push({ x: o.x, y: o.y });
    else if (o.variante === 'cristais') e.cristais.push({ x: o.x, y: o.y });
    else if (o.variante === 'braseiroVerde') e.brasas.push({ x: o.x, y: o.y, cor: '150, 255, 150' });
  }
  e.vazio = !Object.values(e).some((l) => l.length);
  CACHE.set(field, e);
  return e;
}

/** Um grão de luz de 1 ou 2 px (arte de pixel: sem borrar), com a cor e a opacidade dadas. */
function grao(g, x, y, lado, cor, alfa) {
  if (alfa <= 0.02) return;
  g.fillStyle = `rgba(${cor}, ${alfa.toFixed(3)})`;
  g.fillRect(Math.round(x), Math.round(y), lado, lado);
}

/** Uma poça de luz achatada (a elipse do losango) com o miolo mais forte. */
function poca(g, sx, sy, r, cor, alfa) {
  const grad = g.createRadialGradient(sx, sy, 1, sx, sy, r);
  grad.addColorStop(0, `rgba(${cor}, ${alfa.toFixed(3)})`);
  grad.addColorStop(1, `rgba(${cor}, 0)`);
  g.fillStyle = grad;
  g.beginPath();
  g.ellipse(sx, sy, r, r / 2, 0, 0, Math.PI * 2);
  g.fill();
}

/** Esporos que sobem de um ponto: `n` grãos, cada um com o seu período e o seu balanço. */
function esporos(g, t, sx, sy, e, n, topo, cor, alcance) {
  for (let i = 0; i < n; i += 1) {
    const periodo = 5 + sorteio(e.x, e.y, 10 + i) * 4;
    const u = (t / periodo + sorteio(e.x, e.y, 20 + i)) % 1;
    const balanco = Math.sin(t * 0.9 + sorteio(e.x, e.y, 30 + i) * 6.28) * 5;
    const x = sx + (sorteio(e.x, e.y, 40 + i) - 0.5) * 22 + balanco;
    const y = sy - topo - u * alcance;
    grao(g, x, y, i % 3 === 0 ? 2 : 1, cor, Math.sin(Math.PI * u) * 0.6);
  }
}

/**
 * Pinta o ambiente em `g` (a tela do brilho, em modo `lighter`). `centro(x, y)` devolve o ponto de tela do centro da casa.
 */
export function desenharAmbiente(g, t, centro, e) {
  for (const f of e.fungos) {
    const { sx, sy } = centro(f.x, f.y);
    const fase = sorteio(f.x, f.y, 3) * 6.28;
    poca(g, sx, sy, 22, '90, 235, 190', 0.045 + 0.03 * Math.sin(t * 0.9 + fase));
    esporos(g, t, sx, sy, f, 1, 4, '170, 255, 210', 26);
  }
  for (const b of e.bolas) {
    const { sx, sy } = centro(b.x, b.y);
    const fase = sorteio(b.x, b.y, 4) * 6.28;
    poca(g, sx, sy, 34, '110, 255, 150', 0.11 + 0.07 * Math.sin(t * 1.3 + fase));
    esporos(g, t, sx, sy, b, 3, TOPO_DE.bolas, '190, 255, 170', 36);
  }
  for (const c of e.cogumelos) {
    const { sx, sy } = centro(c.x, c.y);
    esporos(g, t, sx, sy, c, 3, TOPO_DE.cogumelos, '200, 235, 170', 40);
  }
  for (const b of e.brasas) {
    const { sx, sy } = centro(b.x, b.y);
    for (let i = 0; i < 5; i += 1) {
      const periodo = 1.3 + sorteio(b.x, b.y, 50 + i) * 1.2;
      const u = (t / periodo + sorteio(b.x, b.y, 60 + i)) % 1;
      const x = sx + (sorteio(b.x, b.y, 70 + i) - 0.5) * 12 + Math.sin(t * 3 + i * 2) * 3 * u;
      const y = sy - TOPO_DE.brasas - u * 30;
      grao(g, x, y, 1, b.cor, (1 - u) * 0.85);
    }
  }
  for (const a of e.agua) {
    const { sx, sy } = centro(a.x, a.y);
    const v = Math.sin(t * 0.8 + sorteio(a.x, a.y, 5) * 6.28);
    if (v < 0.86) continue;
    const alfa = (v - 0.86) / 0.14 * 0.55;
    const x = sx + (sorteio(a.x, a.y, 6) - 0.5) * 22;
    const y = sy + (sorteio(a.x, a.y, 7) - 0.5) * 8;
    grao(g, x, y, 1, '175, 215, 245', alfa);
    grao(g, x + 1, y, 1, '175, 215, 245', alfa * 0.6);
  }
  for (const c of e.cristais) {
    const { sx, sy } = centro(c.x, c.y);
    const v = Math.sin(t * 1.6 + sorteio(c.x, c.y, 8) * 6.28);
    if (v < 0.8) continue;
    const alfa = (v - 0.8) / 0.2 * 0.8;
    const x = sx + (sorteio(c.x, c.y, 9) - 0.5) * 16;
    const y = sy - TOPO_DE.cristais + (sorteio(c.x, c.y, 11) - 0.5) * 12;
    for (const [dx, dy] of [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]]) grao(g, x + dx, y + dy, 1, '190, 240, 255', dx || dy ? alfa * 0.6 : alfa);
  }
}
