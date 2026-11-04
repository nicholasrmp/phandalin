// IMPORTA uma página do Roll20 e devolve um mapa do nosso editor.
//
//   node src/dev/importar-roll20.mjs _referencias/roll20/2-cragmaw-hideout.json
//
// A entrada é o que `src/dev/extrair-roll20.js` tira da aba do Roll20: o tamanho da página em casas, as paredes já
// rasterizadas para ARESTAS de casa, a imagem do mapa e as fichas. A saída é o JSON que o `/editor.html` importa.
//
// O QUE VEM DE LÁ e o que não vem. O Roll20 NÃO GUARDA CHÃO: um mapa dele é imagem + parede, e quem sabe onde se
// pode pisar é o olho de quem joga. Por padrão este importador faz o mesmo — a página inteira é chão e só a parede
// barra.
//
// `--inundar` tenta deduzir o chão: inunda a partir das fichas e chama de rocha o que não alcançar. Só funciona se
// o contorno das paredes FECHAR na grade de casas, e medindo o Covil Cragmaw ele não fecha: a borda do mapa alcança
// as 19 fichas. As paredes do Roll20 são linhas finas que só precisam ser estanques para a LUZ; na nossa grade, de
// 70 px por casa, uma fresta sub-pixel vira passagem. O relatório diz quantas casas vazaram, e aí ou se tapa o
// buraco no `/editor.html`, ou se tira o chão da própria imagem (claro é chão, escuro é rocha).
//
// As fichas saem num arquivo ao lado (`-fichas.json`): o nosso mapa não guarda criatura, quem monta o encontro é
// `src/game/encounter.js`.
import { readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';

const PISO_DENTRO = '_';      // caverna
const PISO_FORA = 'R';        // rocha maciça

/** As casas alcançáveis a partir das sementes, sem atravessar parede nem sair do mapa. */
function inundar(w, h, paredes, sementes) {
  const n = paredes.n;
  const o = paredes.o;
  const visto = Array.from({ length: h }, () => new Array(w).fill(false));
  const pilha = sementes.filter(([x, y]) => x >= 0 && y >= 0 && x < w && y < h);
  for (const [x, y] of pilha) visto[y][x] = true;
  const livre = (c) => c === '.' || c === '/';        // vão aberto e porta deixam passar
  while (pilha.length) {
    const [x, y] = pilha.pop();
    const vizinhos = [
      [x, y - 1, y > 0 && livre(n[y][x])],
      [x, y + 1, y + 1 < h && livre(n[y + 1][x])],
      [x - 1, y, x > 0 && livre(o[y][x])],
      [x + 1, y, x + 1 < w && livre(o[y][x + 1])],
    ];
    for (const [nx, ny, passa] of vizinhos) {
      if (!passa || nx < 0 || ny < 0 || nx >= w || ny >= h || visto[ny][nx]) continue;
      visto[ny][nx] = true;
      pilha.push([nx, ny]);
    }
  }
  return visto;
}

export function converter(pagina, { imagem, inundarChao = false } = {}) {
  const { w, h, pxPorCasa: P = 70 } = pagina;
  const sementes = (pagina.fichas ?? []).map((f) => [Math.floor(f.cx), Math.floor(f.cy)]);
  const dentro = inundarChao
    ? inundar(w, h, pagina.paredes, sementes.length ? sementes : [[Math.floor(w / 2), Math.floor(h / 2)]])
    : Array.from({ length: h }, () => new Array(w).fill(true));
  const terreno = dentro.map((linha) => linha.map((d) => (d ? PISO_DENTRO : PISO_FORA)).join(''));

  // o contorno fecha? Se a borda do mapa alcança uma ficha, há fresta: o chão deduzido não vale
  const daBorda = [];
  for (let x = 0; x < w; x++) { daBorda.push([x, 0]); daBorda.push([x, h - 1]); }
  for (let y = 0; y < h; y++) { daBorda.push([0, y]); daBorda.push([w - 1, y]); }
  const fora = inundar(w, h, pagina.paredes, daBorda);
  const vazaram = sementes.filter(([x, y]) => fora[y]?.[x]).length;

  // o grupo começa nas casas livres mais ao sul e a oeste: é por onde se entra na maioria das plantas
  const livres = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (dentro[y][x]) livres.push({ x, y });
  livres.sort((a, b) => (b.y - a.y) || (a.x - b.x));
  const grupo = livres.slice(0, 4).map(({ x, y }) => ({ x, y }));

  // a imagem: o gráfico do Roll20 tem o CENTRO em (x,y) e `w`/`h` já escalados, então o canto é x - w/2
  let fundo = null;
  if (pagina.mapa) {
    const g = pagina.mapa;
    const cantoX = g.x - g.w / 2;
    const cantoY = g.y - g.h / 2;
    fundo = {
      nome: imagem ?? basename(new URL(g.src).pathname),
      // px da IMAGEM por casa: se o gráfico está esticado, uma casa cobre menos pixels do arquivo
      escala: +(P * (pagina.imagemLargura ? pagina.imagemLargura / g.w : 1)).toFixed(3),
      x0: +(-cantoX * (pagina.imagemLargura ? pagina.imagemLargura / g.w : 1)).toFixed(2),
      y0: +(-cantoY * (pagina.imagemLargura ? pagina.imagemLargura / g.w : 1)).toFixed(2),
      giro: ((Math.round((g.rot || 0) / 90) * 90) % 360 + 360) % 360,
      opacidade: 1,
    };
  }

  return {
    mapa: {
      terreno,
      paredes: { n: [...pagina.paredes.n], o: [...pagina.paredes.o] },
      objetos: [], salas: {}, folhas: [], vaoUnido: [], grades: [],
      materialDaParede: 'rocha', vaoPorCasa: true, cliqueNoObjeto: true,
      grupo: grupo.length ? grupo : [{ x: 1, y: 1 }],
      olhar: { dx: 0, dy: -1 },
      ...(fundo ? { fundo } : {}),
    },
    fichas: pagina.fichas ?? [],
    resumo: {
      pagina: pagina.nome, casas: `${w} x ${h}`, chao: livres.length, rocha: w * h - livres.length,
      arestas: pagina.paredes.n.join('').split('#').length - 1 + pagina.paredes.o.join('').split('#').length - 1,
      fichas: (pagina.fichas ?? []).length, imagem: fundo?.nome ?? '(sem imagem)',
      contornoFecha: vazaram === 0 ? 'sim' : `NÃO: a borda alcança ${vazaram} das ${sementes.length} fichas`,
    },
  };
}

if (process.argv[1] && import.meta.url.endsWith(basename(process.argv[1]))) {
  const entrada = process.argv[2];
  if (!entrada) { console.error('uso: node src/dev/importar-roll20.mjs <pagina.json>'); process.exit(1); }
  const pagina = JSON.parse(await readFile(entrada, 'utf8'));
  const { mapa, fichas, resumo } = converter(pagina, { inundarChao: process.argv.includes('--inundar') });
  const base = entrada.replace(/\.json$/, '');
  await writeFile(`${base}-mapa.json`, JSON.stringify(mapa, null, 1), 'utf8');
  await writeFile(`${base}-fichas.json`, JSON.stringify(fichas, null, 1), 'utf8');
  console.table(resumo);
  console.log(`\n${base}-mapa.json   (importe no /editor.html)\n${base}-fichas.json`);
}
