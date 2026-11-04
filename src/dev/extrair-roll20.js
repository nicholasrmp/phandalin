// COLE ISTO no console da aba do Roll20, com a página aberta. Devolve a página em JSON, já com as paredes
// rasterizadas para as ARESTAS de casa do nosso motor — o dado pesado (as polilinhas à mão livre) nunca precisa
// sair do navegador.
//
//   __extrairPagina()                      // a página aberta
//   __extrairPagina('2: Cragmaw Hideout')  // uma pelo nome
//   __paginasDoRoll20()                    // os nomes de todas
//
// Depois: salve o JSON num arquivo e rode `node src/dev/importar-roll20.mjs <arquivo>`.
//
// A REGRA DA PAREDE. Uma aresta entre duas casas é parede quando o traço do Roll20 SEPARA as duas — isto é, quando
// cruza o segmento que liga o centro de uma ao centro da outra. Marcar "a aresta que o traço cruza" não funciona:
// um traço quase horizontal cruza as linhas verticais da grade e acabaria virando uma fileira de barras soltas,
// com buraco entre elas.

window.__paginasDoRoll20 = () => window.Campaign.pages.map((p) => p.attributes.name);

window.__extrairPagina = function (nomeDaPagina) {
  const C = window.Campaign;
  const p = nomeDaPagina ? C.pages.find((x) => x.attributes.name === nomeDaPagina) : C.activePage();
  if (!p) throw new Error(`não achei a página "${nomeDaPagina}"`);
  const pa = p.attributes;
  const P = 70;                       // o Roll20 tem a casa travada em 70 px
  const lista = (c) => (c ? (c.models || c) : []);

  // --- os traços, em pixels absolutos da página
  const absolutos = (a) => {
    let cmds; try { cmds = JSON.parse(a.path || a._path || '[]'); } catch { return []; }
    const sx = a.scaleX ?? 1; const sy = a.scaleY ?? 1; const rot = ((a.rotation || 0) * Math.PI) / 180;
    const cos = Math.cos(rot); const sin = Math.sin(rot);
    return cmds.map(([, x, y]) => {
      const lx = (x - (a.width || 0) / 2) * sx; const ly = (y - (a.height || 0) / 2) * sy;
      return [(a.left + lx * cos - ly * sin) / P, (a.top + lx * sin + ly * cos) / P];
    });
  };

  // --- a rasterização
  const W = Math.ceil(pa.width); const H = Math.ceil(pa.height);
  const n = Array.from({ length: H }, () => new Array(W).fill('.'));
  const o = Array.from({ length: H }, () => new Array(W).fill('.'));
  const lado = (p1, p2, q) => Math.sign((p2[0] - p1[0]) * (q[1] - p1[1]) - (p2[1] - p1[1]) * (q[0] - p1[0]));
  const cruza = (a, b, c, d) => lado(a, b, c) * lado(a, b, d) <= 0 && lado(c, d, a) * lado(c, d, b) <= 0;

  for (const traco of lista(p.thepaths)) {
    if (traco.attributes.layer !== 'walls') continue;
    const pts = absolutos(traco.attributes);
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i]; const b = pts[i + 1];
      const x0 = Math.floor(Math.min(a[0], b[0])) - 1; const x1 = Math.ceil(Math.max(a[0], b[0])) + 1;
      const y0 = Math.floor(Math.min(a[1], b[1])) - 1; const y1 = Math.ceil(Math.max(a[1], b[1])) + 1;
      for (let y = Math.max(0, y0); y <= Math.min(H - 1, y1); y++) {
        for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++) {
          // a aresta de cima separa (x, y-1) de (x, y)
          if (y > 0 && n[y][x] === '.' && cruza(a, b, [x + 0.5, y - 0.5], [x + 0.5, y + 0.5])) n[y][x] = '#';
          // a da esquerda separa (x-1, y) de (x, y)
          if (x > 0 && o[y][x] === '.' && cruza(a, b, [x - 0.5, y + 0.5], [x + 0.5, y + 0.5])) o[y][x] = '#';
        }
      }
    }
  }

  // Os TRAÇOS como foram desenhados, em casas (com fração). A aresta de casa é uma derivada deles, para a regra; o
  // desenho usa o traço, que é o que faz caverna e destroço parecerem caverna e destroço, e não escada de quadrados.
  const simplificar = (pts, tol) => {
    if (pts.length < 3) return pts;
    const dist = (q, a, b) => {
      const dx = b[0] - a[0]; const dy = b[1] - a[1];
      if (!dx && !dy) return Math.hypot(q[0] - a[0], q[1] - a[1]);
      const t = Math.max(0, Math.min(1, ((q[0] - a[0]) * dx + (q[1] - a[1]) * dy) / (dx * dx + dy * dy)));
      return Math.hypot(q[0] - (a[0] + t * dx), q[1] - (a[1] + t * dy));
    };
    const dp = (ini, fim) => {
      let pior = 0; let idx = -1;
      for (let i = ini + 1; i < fim; i++) { const d = dist(pts[i], pts[ini], pts[fim]); if (d > pior) { pior = d; idx = i; } }
      return pior > tol ? [...dp(ini, idx).slice(0, -1), ...dp(idx, fim)] : [pts[ini], pts[fim]];
    };
    return dp(0, pts.length - 1);
  };
  const r3 = (v) => Math.round(v * 1000) / 1000;
  const tracos = lista(p.thepaths)
    .filter((t) => t.attributes.layer === 'walls')
    .map((t) => simplificar(absolutos(t.attributes), 0.04).map(([x, y]) => [r3(x), r3(y)]))
    .filter((pts) => pts.length > 1);

  const mapa = lista(p.thegraphics).map((g) => g.attributes).find((a) => a.layer === 'map');
  const r2 = (v) => Math.round(v * 100) / 100;
  return {
    nome: pa.name, w: W, h: H, pxPorCasa: P, escala: pa.scale_number, unidade: pa.scale_units,
    paredes: { n: n.map((l) => l.join('')), o: o.map((l) => l.join('')) },
    tracos,
    mapa: mapa && { src: mapa.imgsrc, x: mapa.left, y: mapa.top, w: mapa.width, h: mapa.height, rot: mapa.rotation || 0 },
    fichas: lista(p.thegraphics).map((g) => g.attributes).filter((a) => a.layer === 'objects')
      .map((a) => ({ nome: a.name || '', cx: r2(a.left / P), cy: r2(a.top / P), casas: r2(a.width / P) })),
  };
};
'pronto: __extrairPagina() e __paginasDoRoll20()';
