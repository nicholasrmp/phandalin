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
// o contorno das paredes FECHAR na grade de casas. Medido nas nove páginas de Phandelver: fecha nas masmorras
// ortogonais (o Covil Carrasco), vaza nas cavernas e no campo aberto, onde a parede é traçada à mão livre — as
// paredes do Roll20 são linhas finas que só precisam ser estanques para a LUZ, e na nossa grade, de 70 px por casa,
// uma fresta sub-pixel vira passagem. O relatório diz se fecha; o que vaza se tapa no `/editor.html`.
//
// PORTA NÃO VEM, e a razão importa. Na iluminação dinâmica antiga do Roll20 a parede barra a LUZ, não o movimento:
// o vão de porta é traçado como parede (para fechar a visão) e quem joga simplesmente anda por cima. No nosso motor
// uma aresta barra as duas coisas, então o mapa importado chega com os cômodos LACRADOS. O relatório conta em
// quantos pedaços o chão ficou; abrir os vãos é trabalho de alguns cliques na ferramenta 2 do editor.
//
// As fichas saem num arquivo ao lado (`-fichas.json`): o nosso mapa não guarda criatura, quem monta o encontro é
// `src/game/encounter.js`.
import { readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';

/** O nome de arquivo de uma página: "6: Wave Echo Cave" vira "6-wave-echo-cave". */
const apelido = (nome) => (nome ?? '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'pagina';

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

/** Os pedaços de chão sem ligação entre si, numerados: `nome[y][x]` é o número do pedaço, ou -1 fora do chão. */
function pedacosDoChao(w, h, paredes, dentro) {
  const numero = Array.from({ length: h }, () => new Array(w).fill(-1));
  let quantos = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!dentro[y][x] || numero[y][x] >= 0) continue;
      const alcance = inundar(w, h, paredes, [[x, y]]);
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (alcance[j][i] && dentro[j][i]) numero[j][i] = quantos;
      quantos += 1;
    }
  }
  return { numero, quantos };
}

/**
 * Abre os VÃOS DE PORTA. O Roll20 traça o vão como parede (lá a parede barra luz, não movimento), então o mapa chega
 * com os cômodos lacrados. Isto procura o MENOR conjunto de arestas a abrir para o chão voltar a ser um só pedaço:
 * cada abertura liga dois pedaços que não se falavam, e é aí que a porta está.
 *
 * Entre as várias arestas que separam os mesmos dois pedaços, escolhe a do MEIO da divisa — porta costuma ficar no
 * meio da parede, não na quina.
 */
function abrirVaos(w, h, paredes, dentro) {
  const { numero, quantos } = pedacosDoChao(w, h, paredes, dentro);
  const pai = Array.from({ length: quantos }, (_, i) => i);
  const raiz = (i) => (pai[i] === i ? i : (pai[i] = raiz(pai[i])));
  // candidatas: toda aresta de parede com chão dos dois lados, agrupada pelo par de pedaços que ela separa
  const porPar = new Map();
  const juntar = (a, b, lado, x, y) => {
    if (a < 0 || b < 0 || raiz(a) === raiz(b)) return;
    const chave = `${Math.min(a, b)}-${Math.max(a, b)}`;
    if (!porPar.has(chave)) porPar.set(chave, []);
    porPar.get(chave).push({ lado, x, y, a, b });
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (y > 0 && paredes.n[y][x] === '#') juntar(numero[y - 1][x], numero[y][x], 'n', x, y);
      if (x > 0 && paredes.o[y][x] === '#') juntar(numero[y][x - 1], numero[y][x], 'o', x, y);
    }
  }
  // os pares com menos divisa primeiro: uma parede compartilhada curta é vão; uma longa é parede de verdade
  const pares = [...porPar.values()].sort((A, B) => A.length - B.length);
  const abertos = [];
  for (const divisa of pares) {
    const { a, b } = divisa[0];
    if (raiz(a) === raiz(b)) continue;
    const meio = divisa[Math.floor(divisa.length / 2)];      // o vão fica no meio da parede, não na quina
    paredes[meio.lado][meio.y] = `${paredes[meio.lado][meio.y].slice(0, meio.x)}/${paredes[meio.lado][meio.y].slice(meio.x + 1)}`;
    abertos.push(meio);
    pai[raiz(a)] = raiz(b);
  }
  return abertos;
}

/**
 * TAPA AS FRESTAS. A parede do Roll20 é uma linha fina que só precisa ser estanque para a LUZ; na nossa grade, de
 * 70 px por casa, uma fresta sub-pixel vira passagem, e a borda do mapa alcança o interior. Isto acha o MENOR
 * conjunto de passagens a fechar para separar a borda das fichas — um corte mínimo, que por definição cai onde a
 * passagem é mais estreita, que é onde está a fresta.
 *
 * É o avesso de `abrirVaos`: lá o menor conjunto a ABRIR para ligar; aqui o menor a FECHAR para separar.
 */
/**
 * Tira as fichas ESTACIONADAS. O mestre deixa pilhas de ficha sobrando de lado, em fileira — na Caverna Onda Eco são
 * 66 "Ochre Jelly" enfileiradas, e eram elas que estragavam o corte mínimo, porque metade estava fora da planta.
 * Uma criatura posta no mapa não forma fileira reta de cinco ou mais do mesmo nome em casas seguidas.
 */
function fichasDeVerdade(fichas) {
  const estacionada = new Set();
  const porNome = {};
  for (const f of fichas) (porNome[f.nome] ??= []).push(f);
  for (const mesmas of Object.values(porNome)) {
    if (mesmas.length < 5) continue;
    const casas = new Set(mesmas.map((f) => `${Math.floor(f.cx)},${Math.floor(f.cy)}`));
    for (const f of mesmas) {
      const x = Math.floor(f.cx); const y = Math.floor(f.cy);
      const corrida = (dx, dy) => {
        let n = 1;
        for (let k = 1; casas.has(`${x + k * dx},${y + k * dy}`); k++) n++;
        for (let k = 1; casas.has(`${x - k * dx},${y - k * dy}`); k++) n++;
        return n;
      };
      if (corrida(1, 0) >= 5 || corrida(0, 1) >= 5) estacionada.add(f);
    }
  }
  return fichas.filter((f) => !estacionada.has(f));
}

const LIMITE_DO_CORTE = 14;     // mais que isto não é fresta: é mapa que simplesmente não tem contorno

function taparFrestas(w, h, paredes, sementes) {
  const id = (x, y) => y * w + x;
  const N = w * h;
  const FONTE = N; const SUMIDOURO = N + 1;
  // grafo de fluxo: cada passagem entre casas vizinhas tem capacidade 1 nos dois sentidos
  const prox = []; const de = []; const cap = [];
  const vizinhos = Array.from({ length: N + 2 }, () => []);
  const ligar = (a, b, c) => {
    vizinhos[a].push(de.length); de.push(b); cap.push(c); prox.push(0);
    vizinhos[b].push(de.length); de.push(a); cap.push(0); prox.push(0);
  };
  const livre = (ch) => ch === '.' || ch === '/';
  const arestas = [];       // para saber, no fim, que aresta do mapa cada ligação é
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (y > 0 && livre(paredes.n[y][x])) { arestas.push({ i: de.length, lado: 'n', x, y }); ligar(id(x, y - 1), id(x, y), 1); ligar(id(x, y), id(x, y - 1), 1); }
      if (x > 0 && livre(paredes.o[y][x])) { arestas.push({ i: de.length, lado: 'o', x, y }); ligar(id(x - 1, y), id(x, y), 1); ligar(id(x, y), id(x - 1, y), 1); }
    }
  }
  const INF = 1e9;
  for (let x = 0; x < w; x++) { ligar(FONTE, id(x, 0), INF); ligar(FONTE, id(x, h - 1), INF); }
  for (let y = 0; y < h; y++) { ligar(FONTE, id(0, y), INF); ligar(FONTE, id(w - 1, y), INF); }
  for (const [x, y] of sementes) ligar(id(x, y), SUMIDOURO, INF);

  // Edmonds-Karp: caminhos de aumento por largura, capacidades unitárias — o fluxo máximo é pequeno
  let fluxo = 0;
  for (;;) {
    const veioDe = new Int32Array(N + 2).fill(-1);
    veioDe[FONTE] = -2;
    const fila = [FONTE];
    let achou = false;
    for (let k = 0; k < fila.length && !achou; k++) {
      const u = fila[k];
      for (const e of vizinhos[u]) {
        if (cap[e] <= 0 || veioDe[de[e]] !== -1) continue;
        veioDe[de[e]] = e;
        if (de[e] === SUMIDOURO) { achou = true; break; }
        fila.push(de[e]);
      }
    }
    if (!achou) break;
    let u = SUMIDOURO; let minimo = INF;
    while (u !== FONTE) { const e = veioDe[u]; minimo = Math.min(minimo, cap[e]); u = de[e ^ 1]; }
    u = SUMIDOURO;
    while (u !== FONTE) { const e = veioDe[u]; cap[e] -= minimo; cap[e ^ 1] += minimo; u = de[e ^ 1]; }
    fluxo += minimo;
    if (fluxo > LIMITE_DO_CORTE) return [];   // sem contorno nenhum: não é fresta, é mapa aberto
  }
  if (!fluxo) return [];

  // o corte: o que a fonte ainda alcança no grafo residual, e as passagens que saem daí
  const alcanca = new Uint8Array(N + 2);
  alcanca[FONTE] = 1;
  const fila = [FONTE];
  for (let k = 0; k < fila.length; k++) {
    for (const e of vizinhos[fila[k]]) if (cap[e] > 0 && !alcanca[de[e]]) { alcanca[de[e]] = 1; fila.push(de[e]); }
  }
  const tapadas = [];
  for (const { i, lado, x, y } of arestas) {
    const a = de[i ^ 1]; const b = de[i];
    if (alcanca[a] !== alcanca[b]) {
      paredes[lado][y] = `${paredes[lado][y].slice(0, x)}#${paredes[lado][y].slice(x + 1)}`;
      tapadas.push({ lado, x, y });
    }
  }
  return tapadas;
}

export function converter(pagina, { imagem, inundarChao = false, abrir = false, tapar = false } = {}) {
  const { w, h, pxPorCasa: P = 70 } = pagina;
  const noMapa = fichasDeVerdade(pagina.fichas ?? []);
  const sementes = noMapa.map((f) => [Math.floor(f.cx), Math.floor(f.cy)]);

  // O contorno fecha? Se a borda do mapa alcança uma ficha, há fresta, e não dá para deduzir chão nenhum.
  const daBorda = [];
  for (let x = 0; x < w; x++) { daBorda.push([x, 0]); daBorda.push([x, h - 1]); }
  for (let y = 0; y < h; y++) { daBorda.push([0, y]); daBorda.push([w - 1, y]); }
  let fora = inundar(w, h, pagina.paredes, daBorda);
  const vazaramAntes = sementes.filter(([x, y]) => fora[y]?.[x]).length;
  const tinhaParede = pagina.paredes.n.join('').includes('#') || pagina.paredes.o.join('').includes('#');
  // tapar primeiro: sem contorno estanque não dá para falar em dentro, nem achar vão de porta.
  // Só em página que JÁ tem parede — numa página sem nenhuma o corte mínimo inventaria muro em volta das fichas.
  // o corte mira só nas fichas QUE VAZAM: as outras já estão do lado de dentro e só engordariam o corte
  const vazando = sementes.filter(([x, y]) => fora[y]?.[x]);
  let frestas = tapar && tinhaParede && vazando.length
    ? taparFrestas(w, h, pagina.paredes, vazando) : [];
  if (frestas.length) {
    fora = inundar(w, h, pagina.paredes, daBorda);
    // o corte mínimo é mínimo, não é certo: num mapa de campo aberto ele lacra um cantinho em volta das fichas.
    // Se o que sobrou dentro é pouco demais para ser a planta, desfaz e deixa o mapa como o Roll20 o trata.
    const dentroAgora = fora.flat().filter((v) => !v).length;
    if (dentroAgora < w * h * 0.2) {
      for (const { lado, x, y } of frestas) {
        pagina.paredes[lado][y] = `${pagina.paredes[lado][y].slice(0, x)}.${pagina.paredes[lado][y].slice(x + 1)}`;
      }
      frestas = [];
      fora = inundar(w, h, pagina.paredes, daBorda);
    }
  }
  const vazaram = sementes.filter(([x, y]) => fora[y]?.[x]).length;
  const quantasParedes = pagina.paredes.n.join('').split('#').length - 1 + pagina.paredes.o.join('').split('#').length - 1;
  // só dá para falar em "dentro" quando há parede, há ficha para conferir, e nenhuma delas é alcançada pela borda
  const fechado = quantasParedes > 0 && sementes.length > 0 && vazaram === 0;

  // O chão é o que a BORDA NÃO ALCANÇA — e não o que as fichas alcançam. A diferença importa: no Covil Carrasco
  // cada cômodo está lacrado, então partir das fichas deixaria de fora todo corredor sem ninguém dentro, e aí os
  // vãos de porta nem teriam chão dos dois lados para ligar.
  const dentro = inundarChao && fechado
    ? fora.map((linha) => linha.map((alcancada) => !alcancada))
    : Array.from({ length: h }, () => new Array(w).fill(true));
  // abrir vão sem contorno fechado é adivinhação: os "pedaços" seriam recortes do mapa inteiro, não cômodos
  const vaos = abrir && fechado ? abrirVaos(w, h, pagina.paredes, dentro) : [];
  const terreno = dentro.map((linha) => linha.map((d) => (d ? PISO_DENTRO : PISO_FORA)).join(''));

  // em quantos pedaços sem ligação o chão ficou? Cada pedaço a mais é um vão de porta que o Roll20 traçou como parede
  const visto = Array.from({ length: h }, () => new Array(w).fill(false));
  let pedacos = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!dentro[y][x] || visto[y][x]) continue;
      pedacos += 1;
      const alcance = inundar(w, h, pagina.paredes, [[x, y]]);
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (alcance[j][i]) visto[j][i] = true;
    }
  }

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
      // o endereço de onde o navegador PEGA a imagem. O `src` do Roll20 aponta para o bucket cru do S3, que responde
      // AccessDenied; quem serve é o `files.d20.io`, e o `max` é a maior resolução que ele guarda.
      url: g.src.replace('https://s3.amazonaws.com/files.d20.io/', 'https://files.d20.io/')
        .replace(/\/(med|thumb|original)\.(jpg|png|jpeg)/, '/max.$2'),
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
      fichas: noMapa.length === (pagina.fichas ?? []).length ? noMapa.length
        : `${noMapa.length} (${(pagina.fichas ?? []).length - noMapa.length} estacionadas)`,
      contornoFecha: quantasParedes === 0 ? 'sem paredes'
        : !sementes.length ? 'sem fichas para conferir'
          : vazaram ? `NÃO: a borda alcança ${vazaram} das ${sementes.length} fichas` : 'sim',
      pedacos: pedacos === 1 ? '1 (tudo ligado)' : `${pedacos} — abra os vãos de porta no editor`,
      frestasTapadas: frestas.length,
      vaosAbertos: vaos.length,
    },
  };
}

if (process.argv[1] && import.meta.url.endsWith(basename(process.argv[1]))) {
  const entrada = process.argv[2];
  if (!entrada) { console.error('uso: node src/dev/importar-roll20.mjs <pagina.json>'); process.exit(1); }
  const cru = JSON.parse(await readFile(entrada, 'utf8'));
  // o arquivo pode ser uma página só, ou o saco com todas elas (`{ nome: pagina }`)
  const paginas = cru.paredes ? { [cru.nome]: cru } : cru;
  const tapar = process.argv.includes('--tapar-frestas');
  const abrir = process.argv.includes('--abrir-vaos');
  const inundarChao = process.argv.includes('--inundar') || abrir;   // sem saber o que é chão não dá para achar vão
  const pasta = dirname(entrada);
  const resumos = [];
  for (const pagina of Object.values(paginas)) {
    const { mapa, fichas, resumo } = converter(pagina, { inundarChao, abrir, tapar });
    const base = join(pasta, apelido(pagina.nome));
    await writeFile(`${base}-mapa.json`, JSON.stringify(mapa, null, 1), 'utf8');
    if (fichas.length) await writeFile(`${base}-fichas.json`, JSON.stringify(fichas, null, 1), 'utf8');
    resumos.push(resumo);
  }
  console.table(resumos);
  console.log(`\n${resumos.length} mapa(s) em ${pasta}/ — importe o "-mapa.json" no /editor.html`);
}
