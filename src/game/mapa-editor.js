// O EDITOR DE CENÁRIO: a lógica, sem tela. O editor (`editor.html`) e o jogo (`mapaDo('editor')`) falam por este módulo.
//
// Um MAPA do editor é o mesmo objeto que `mapaDo()` devolve (terreno, paredes, objetos, salas, folhas...), só que em dados puros (nada de
// função nem de Set), de modo que sai em JSON e volta igual. Toda edição é uma função daqui que muda o mapa que recebe e devolve `true` se
// mudou alguma coisa (o editor só guarda um ponto de desfazer quando mudou).
//
// Coordenadas são as do MAPA (já com o anel de fora, se o mapa tem). A aresta é `(x, y, lado)`: 'N' é a borda de cima da casa, 'O' a da esquerda.

import { Battlefield } from '../core/grid.js';

export const CHAVE = 'phandalin.editor.mapa';

/** Os dados que um mapa leva para o JSON. Fora disto (`cena`, `areas`, funções) é lógica de aventura, e o editor não a conhece. */
const DADOS = [
  'terreno', 'altura', 'objetos', 'paredes', 'salas', 'folhas', 'vaoUnido', 'grades', 'decor', 'decorCasa', 'degraus', 'pisos', 'luz', 'luzes',
  'materialDaParede', 'vaoPorCasa', 'fachadaUnica', 'fachadaFechada', 'cliqueNoObjeto', 'rochaEmCorte', 'paredeDeCaverna', 'poeira',
  'paredeAlta', 'veuDaEscuridao', 'avisosDeVista', 'grupo', 'olhar', 'cena', 'fundo', 'tracos',
];

/** Copia só os dados do mapa (Set vira lista, função some) e devolve um objeto novo, seguro de mexer. */
export function limpar(mapa) {
  const cru = {};
  for (const k of DADOS) if (mapa[k] !== undefined) cru[k] = mapa[k];
  // a cena de aventura de um mapa do jogo não vai junto: só a exploração livre do editor (`cena: 'editor'`) fica
  if (cru.cena !== 'editor') delete cru.cena;
  return JSON.parse(JSON.stringify(cru, (_, v) => (v instanceof Set ? [...v] : v instanceof Map ? [...v] : v)));
}

/** Um mapa vazio de `w` x `h` casas: o anel de fora ('Z') e o chão de assoalho dentro. */
export function novoMapa(w = 10, h = 10) {
  const terreno = Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => (x === 0 || y === 0 || x === w - 1 || y === h - 1 ? 'Z' : 'U')).join(''));
  const vazio = Array.from({ length: h }, () => '.'.repeat(w));
  const cx = Math.floor(w / 2);
  const cy = Math.floor(h / 2);
  return {
    terreno, objetos: [], paredes: { n: [...vazio], o: [...vazio] }, salas: {}, folhas: [], vaoUnido: [], grades: [],
    materialDaParede: 'madeiraVelha', vaoPorCasa: true, cliqueNoObjeto: true,
    grupo: [{ x: cx, y: cy }, { x: cx + 1, y: cy }, { x: cx, y: cy + 1 }, { x: cx + 1, y: cy + 1 }],
    olhar: { dx: 0, dy: 1 },
  };
}

export const dentro = (m, x, y) => y >= 0 && y < m.terreno.length && x >= 0 && x < m.terreno[0].length;

function trocar(linhas, x, y, c) {
  const l = linhas[y];
  if (l[x] === c) return false;
  linhas[y] = l.slice(0, x) + c + l.slice(x + 1);
  return true;
}

// ------------------------------------------------------------------------------------------------ chão ---

/** O nome do piso que a mobília guarda para cada glifo de chão (o mesmo de `casadamorte-mobilia.js`). */
const PISO_DO_GLIFO = { U: 'assoalho', '*': 'tapete', '-': 'parquet', '+': 'terraSocada', L: 'laje' };
const GLIFO_DO_PISO = Object.fromEntries(Object.entries(PISO_DO_GLIFO).map(([g, p]) => [p, g]));
const GLIFO_DE_PECA = new Set(['^', '&']);

export const propEm = (m, x, y) => (m.objetos ?? []).find((o) => o.tipo === 'prop' && o.x === x && o.y === y) ?? null;

/** Pinta o piso de uma casa. Casa com móvel não se pinta (tire o móvel antes). */
export function pintarPiso(m, x, y, glifo) {
  if (!dentro(m, x, y) || propEm(m, x, y) || GLIFO_DE_PECA.has(m.terreno[y][x])) return false;
  return trocar(m.terreno, x, y, glifo);
}

// ---------------------------------------------------------------------------------------- paredes e portas ---

/**
 * Os estilos de aresta. `car` é o caractere da grade de paredes (`#` parede, `+` porta fechada, `/` arco aberto, `J` seteira ou grade, `.` nada);
 * `folha` põe a folha de madeira da porta, `grade` desenha barras de ferro no lugar da seteira.
 */
export const ESTILOS_DE_ARESTA = {
  nada: { rotulo: 'Sem parede', car: '.' },
  parede: { rotulo: 'Parede', car: '#' },
  arco: { rotulo: 'Arco (vão aberto)', car: '/' },
  porta: { rotulo: 'Porta com folha', car: '/', folha: true },
  trancada: { rotulo: 'Porta fechada', car: '+' },
  grade: { rotulo: 'Grade de ferro', car: 'J', grade: true },
  seteira: { rotulo: 'Seteira', car: 'J' },
};

/** As duas casas que a aresta separa: a de cima/esquerda primeiro. */
export function casasDaAresta(x, y, lado) {
  return lado === 'N' ? [{ x, y: y - 1 }, { x, y }] : [{ x: x - 1, y }, { x, y }];
}

function garantirParedes(m) {
  const h = m.terreno.length;
  const w = m.terreno[0].length;
  m.paredes ??= {};
  for (const l of ['n', 'o']) {
    m.paredes[l] ??= [];
    for (let y = 0; y < h; y++) m.paredes[l][y] = (m.paredes[l][y] ?? '').padEnd(w, '.');
  }
  m.folhas ??= []; m.vaoUnido ??= []; m.grades ??= [];
}

export function estiloDaAresta(m, x, y, lado) {
  if (!dentro(m, x, y)) return 'nada';
  const car = m.paredes?.[lado === 'N' ? 'n' : 'o']?.[y]?.[x] ?? '.';
  if (car === '/') return temFolha(m, x, y, lado) ? 'porta' : 'arco';
  if (car === 'J') return m.grades?.includes(`${x},${y},${lado}`) ? 'grade' : 'seteira';
  return { '#': 'parede', '+': 'trancada' }[car] ?? 'nada';
}

function temFolha(m, x, y, lado) {
  const [a, b] = casasDaAresta(x, y, lado);
  return (m.folhas ?? []).some(([p, q]) => (p.x === a.x && p.y === a.y && q.x === b.x && q.y === b.y) || (p.x === b.x && p.y === b.y && q.x === a.x && q.y === a.y));
}

/** Põe um estilo numa aresta. Devolve false se nada mudou (ou se a aresta é do contorno de fora do mapa). */
export function pintarAresta(m, x, y, lado, estilo) {
  const e = ESTILOS_DE_ARESTA[estilo];
  if (!e || !dentro(m, x, y)) return false;
  if ((lado === 'N' && y === 0) || (lado === 'O' && x === 0)) return false;
  garantirParedes(m);
  if (estiloDaAresta(m, x, y, lado) === estilo) return false;
  trocar(m.paredes[lado === 'N' ? 'n' : 'o'], x, y, e.car);
  const [a, b] = casasDaAresta(x, y, lado);
  const k = `${x},${y},${lado}`;
  m.folhas = m.folhas.filter(([p, q]) => !((p.x === a.x && p.y === a.y && q.x === b.x && q.y === b.y) || (p.x === b.x && p.y === b.y && q.x === a.x && q.y === a.y)));
  m.vaoUnido = m.vaoUnido.filter((v) => v !== k);
  m.grades = m.grades.filter((v) => v !== k);
  if (e.folha) m.folhas.push([a, b]);
  if (e.grade) m.grades.push(k);
  return true;
}

// ---------------------------------------------------------------------------------------------- objetos ---

/** A peça "vazia" que ocupa as casas de trás de um móvel de várias casas (a mesma `nada` da mobília da Casa da Morte). */
export const NADA = 'taverna-nada';

/** A peça de várias casas a que esta casa pertence: a própria casa se ela leva `pega`, ou a dona, se esta casa é uma das de trás. */
function donaDaCasa(m, x, y) {
  const o = propEm(m, x, y);
  if (!o) return null;
  if (o.variante !== NADA) return o;
  return (m.objetos ?? []).find((q) => q.pega?.some(([dx, dy]) => q.x + dx === x && q.y + dy === y)) ?? o;
}

/** As casas que a peça ocupa para uma pegada de `w` x `h` casas: a casa da FRENTE (a clicada) e as de trás, a oeste e ao norte dela. */
export const pegadaDe = (w, h) => {
  const lista = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (i || j) lista.push([i ? -i : 0, j ? -j : 0]);
  return lista;
};

/**
 * Põe um móvel ou peça de cenário na casa (`variante` é a chave do atlas sem o `prop-`: `casa-lareira:+x`). Troca o que já estava lá.
 * `pega` são as casas de trás de uma peça grande (deslocamentos a partir da casa da frente): todas têm de estar livres, e saem junto com a peça.
 */
export function colocarProp(m, x, y, variante, { baixo = false, espelhar = false, pega = [] } = {}) {
  const casas = [[0, 0], ...pega].map(([dx, dy]) => [x + dx, y + dy]);
  for (const [cx, cy] of casas) {
    if (!dentro(m, cx, cy)) return false;
    // dentro de parede de casa inteira não se põe móvel
    if (['#', 'M', 'R', 'T'].includes(m.terreno[cy][cx]) && !propEm(m, cx, cy)) return false;
  }
  for (const [cx, cy] of casas) {
    const velha = donaDaCasa(m, cx, cy);
    if (velha) removerProp(m, velha.x, velha.y);
  }
  const antes = m.terreno[y][x];
  const piso = PISO_DO_GLIFO[antes] ?? 'assoalho';
  m.objetos.push({ tipo: 'prop', x, y, variante, piso, ...(espelhar ? { espelhar: true } : {}), ...(pega.length ? { pega: pega.map((d) => [...d]) } : {}) });
  trocar(m.terreno, x, y, baixo ? '&' : '^');
  for (const [dx, dy] of pega) {
    const nx = x + dx;
    const ny = y + dy;
    m.objetos.push({ tipo: 'prop', x: nx, y: ny, variante: NADA, piso: PISO_DO_GLIFO[m.terreno[ny][nx]] ?? piso });
    trocar(m.terreno, nx, ny, '^');
  }
  return true;
}

/** Tira o móvel da casa; se a casa é de uma peça grande (a da frente ou uma de trás), a peça inteira sai. */
export function removerProp(m, x, y) {
  const o = donaDaCasa(m, x, y);
  if (!o) return false;
  const todas = [[0, 0], ...(o.pega ?? [])].map(([dx, dy]) => [o.x + dx, o.y + dy]);
  for (const [cx, cy] of todas) {
    const q = propEm(m, cx, cy);
    if (!q) continue;
    m.objetos.splice(m.objetos.indexOf(q), 1);
    trocar(m.terreno, cx, cy, GLIFO_DO_PISO[q.piso] ?? '.');
  }
  return true;
}

// ----------------------------------------------------------------------------------------------- altura ---

/** A altura máxima que o editor deixa pintar (o tabuleiro desenha até esta, com a face lateral de cada degrau). */
export const ALTURA_MAXIMA = 6;

/** Põe a casa na altura `n` (0 a 6). Cria a grade de alturas se o mapa não tinha. */
export function pintarAltura(m, x, y, n) {
  if (!dentro(m, x, y)) return false;
  const v = Math.max(0, Math.min(ALTURA_MAXIMA, Math.trunc(n)));
  if (!m.altura) m.altura = m.terreno.map((l) => '0'.repeat(l.length));
  return trocar(m.altura, x, y, String(v));
}

/** A altura da casa (0 se o mapa não tem grade de alturas). */
export const alturaDe = (m, x, y) => Number(m.altura?.[y]?.[x] ?? 0) || 0;

// ------------------------------------------------------------------------------------------------- modo ---

/** `true`: o jogo abre este mapa em EXPLORAÇÃO livre (sem iniciativa, sem inimigos); `false`: no modo de combate por turnos. */
// ------------------------------------------------------------------------------------- o mapa pintado de fundo ---
//
// `m.fundo` guarda COMO uma imagem pintada se encaixa na grade — nunca a imagem, que fica no navegador e é escolhida
// de novo a cada sessão. É o enquadramento do Roll20: quantos pixels da imagem valem uma casa, e onde cai, em pixels
// da imagem, o canto da casa (0,0).
//
//   { nome, escala, x0, y0, giro, opacidade }
//
// `giro` é 0, 90, 180 ou 270 graus, aplicado à imagem ANTES de medir — então `x0`/`y0` são sempre pixels da imagem
// já girada, e mudar o giro invalida os dois (o editor zera e manda calibrar de novo).

export const FUNDO_PADRAO = { nome: '', escala: 100, x0: 0, y0: 0, giro: 0, opacidade: 1 };

/** Muda o enquadramento (só os campos passados). `null` tira o fundo. */
export function definirFundo(m, troca) {
  if (troca === null) {
    if (!m.fundo) return false;
    delete m.fundo;
    return true;
  }
  const antes = m.fundo ?? FUNDO_PADRAO;
  const depois = { ...antes, ...troca };
  if (troca.giro !== undefined && troca.giro !== antes.giro) { depois.x0 = 0; depois.y0 = 0; }
  depois.escala = Math.max(1, Number(depois.escala) || 1);
  depois.giro = ((Math.round((Number(depois.giro) || 0) / 90) * 90) % 360 + 360) % 360;
  depois.opacidade = Math.min(1, Math.max(0, depois.opacidade ?? 1));
  if (JSON.stringify(antes) === JSON.stringify(depois) && m.fundo) return false;
  m.fundo = depois;
  return true;
}

/** Arrasta a imagem `dx`, `dy` CASAS (o que o mouse fez na tela, dividido pelo tamanho da casa). */
export function moverFundo(m, dx, dy) {
  if (!m.fundo || (!dx && !dy)) return false;
  m.fundo.x0 = +(m.fundo.x0 - dx * m.fundo.escala).toFixed(2);
  m.fundo.y0 = +(m.fundo.y0 - dy * m.fundo.escala).toFixed(2);
  return true;
}

/**
 * Calibra como no Roll20: o usuário arrasta um retângulo por cima de `colunas` x `linhas` quadrados DESENHADOS no
 * mapa, e daí saem a escala e a fase da grade. `a` e `b` são os cantos do arrasto, em CASAS (pixel da tela / tamanho
 * da casa). As casas são quadradas, então a escala é o melhor ajuste dos dois lados juntos.
 */
export function calibrarFundo(m, a, b, colunas, linhas) {
  if (!m.fundo) return false;
  const nc = Math.max(1, Math.round(colunas));
  const nl = Math.max(1, Math.round(linhas));
  const f = m.fundo;
  const emPixels = (p) => ({ x: f.x0 + p.x * f.escala, y: f.y0 + p.y * f.escala });
  const ia = emPixels(a);
  const ib = emPixels(b);
  const larg = Math.abs(ib.x - ia.x);
  const alt = Math.abs(ib.y - ia.y);
  if (larg < 2 || alt < 2) return false;
  const escala = (larg + alt) / (nc + nl);
  // o canto do arrasto vira canto de casa: a casa inteira mais perto dele é que manda
  const kx = Math.round(Math.min(a.x, b.x));
  const ky = Math.round(Math.min(a.y, b.y));
  m.fundo = {
    ...f,
    escala: +escala.toFixed(3),
    x0: +(Math.min(ia.x, ib.x) - kx * escala).toFixed(2),
    y0: +(Math.min(ia.y, ib.y) - ky * escala).toFixed(2),
  };
  return true;
}

/** Quantas casas a imagem cobre, do jeito que está enquadrada. Serve para o mapa crescer até cobri-la. */
export function casasDoFundo(m, larguraDaImagem, alturaDaImagem) {
  if (!m.fundo) return null;
  const f = m.fundo;
  const [iw, ih] = f.giro % 180 ? [alturaDaImagem, larguraDaImagem] : [larguraDaImagem, alturaDaImagem];
  const inteiro = (v) => (Object.is(v, -0) ? 0 : v);     // -0 existe em JS e atrapalha comparação
  return {
    x1: inteiro(Math.floor(-f.x0 / f.escala)), y1: inteiro(Math.floor(-f.y0 / f.escala)),
    x2: inteiro(Math.ceil((iw - f.x0) / f.escala)), y2: inteiro(Math.ceil((ih - f.y0) / f.escala)),
  };
}

export function definirExploracao(m, ligada) {
  if (Boolean(ligada) === (m.cena === 'editor')) return false;
  if (ligada) m.cena = 'editor'; else delete m.cena;
  return true;
}

// ------------------------------------------------------------------------------------------- salas e início ---

/** A sala em que a casa está (ou null). */
export function salaDe(m, x, y) {
  for (const [id, casas] of Object.entries(m.salas ?? {})) if (casas.some((c) => c.x === x && c.y === y)) return id;
  return null;
}

/** Põe a casa numa sala (`id` vazio tira da sala em que estava). */
export function definirSala(m, x, y, id) {
  if (!dentro(m, x, y)) return false;
  const antes = salaDe(m, x, y);
  if ((antes ?? '') === (id ?? '')) return false;
  m.salas ??= {};
  if (antes) {
    m.salas[antes] = m.salas[antes].filter((c) => !(c.x === x && c.y === y));
    if (!m.salas[antes].length) delete m.salas[antes];
  }
  if (id) (m.salas[id] ??= []).push({ x, y });
  return true;
}

/** Muda a casa de partida do herói `i` (0 a 3). */
export function definirInicio(m, i, x, y) {
  if (!dentro(m, x, y)) return false;
  m.grupo ??= [];
  if (m.grupo[i]?.x === x && m.grupo[i]?.y === y) return false;
  m.grupo[i] = { x, y };
  return true;
}

// ------------------------------------------------------------------------------------------------ tamanho ---

/** Cresce (n > 0) ou encolhe (n < 0) o mapa pela borda: 'N', 'S', 'L' (leste) ou 'O' (oeste). Tudo o que estava no lugar acompanha. */
export function redimensionar(m, borda, n) {
  if (!n) return false;
  const h = m.terreno.length;
  const w = m.terreno[0].length;
  if (n < 0 && (borda === 'N' || borda === 'S' ? h + n < 3 : w + n < 3)) return false;
  const dx = borda === 'O' ? n : 0;
  const dy = borda === 'N' ? n : 0;
  const novoW = w + (borda === 'O' || borda === 'L' ? n : 0);
  const novoH = h + (borda === 'N' || borda === 'S' ? n : 0);
  const preencher = (linhas, vazio) => {
    const saida = [];
    for (let y = 0; y < novoH; y++) {
      const oy = y - dy;
      let l = '';
      for (let x = 0; x < novoW; x++) {
        const ox = x - dx;
        l += oy >= 0 && oy < h && ox >= 0 && ox < w ? (linhas[oy]?.[ox] ?? vazio) : vazio;
      }
      saida.push(l);
    }
    return saida;
  };
  // o que sobra de fora do contorno novo some; o terreno novo é a borda de fora (`Z`) ou o chão vizinho
  const sobra = (x, y) => x < 0 || y < 0 || x >= novoW || y >= novoH;
  const move = (p) => ({ ...p, x: p.x + dx, y: p.y + dy });
  const chaveMove = (k) => {
    const [x, y, l] = k.split(',');
    return `${Number(x) + dx},${Number(y) + dy},${l}`;
  };
  const ok = (p) => !sobra(p.x, p.y);
  garantirParedes(m);
  m.terreno = preencher(m.terreno, 'U');
  if (n > 0) {
    // as casas novas viram o chão de fora
    for (let y = 0; y < novoH; y++) {
      for (let x = 0; x < novoW; x++) {
        const nova = x - dx < 0 || x - dx >= w || y - dy < 0 || y - dy >= h;
        if (nova) trocar(m.terreno, x, y, 'Z');
      }
    }
  }
  m.paredes.n = preencher(m.paredes.n, '.');
  m.paredes.o = preencher(m.paredes.o, '.');
  if (m.altura) m.altura = preencher(m.altura, '0');
  m.objetos = m.objetos.map(move).filter(ok);
  m.salas = Object.fromEntries(Object.entries(m.salas ?? {}).map(([id, cs]) => [id, cs.map(move).filter(ok)]).filter(([, cs]) => cs.length));
  m.folhas = m.folhas.map(([a, b]) => [move(a), move(b)]).filter(([a, b]) => ok(a) && ok(b));
  m.vaoUnido = m.vaoUnido.map(chaveMove);
  m.grades = m.grades.map(chaveMove);
  m.grupo = (m.grupo ?? []).map(move).map((p) => (ok(p) ? p : { x: 1, y: 1 }));
  // o traço de parede livre anda junto com as casas
  if (m.tracos) m.tracos = m.tracos.map((pts) => pts.map(([x, y]) => [+(x + dx).toFixed(3), +(y + dy).toFixed(3)]));
  // crescer pelo norte ou pelo oeste empurra todas as casas para baixo e para a direita. A imagem de fundo fica onde
  // está, então a casa (0,0), que agora é `dx`, `dy` casas antes da antiga, cai `dx * escala` pixels antes na imagem.
  if (m.fundo && (dx || dy)) {
    m.fundo.x0 = +(m.fundo.x0 - dx * m.fundo.escala).toFixed(2);
    m.fundo.y0 = +(m.fundo.y0 - dy * m.fundo.escala).toFixed(2);
  }
  return true;
}

// -------------------------------------------------------------------------------------------- diagnóstico ---

/**
 * O que está errado no mapa, medido com o motor de verdade: casas de chão que o grupo não alcança a pé, e heróis que nascem em casa bloqueada.
 * @returns {string[]} avisos em português (lista vazia: o mapa está são)
 */
export function diagnostico(m) {
  const avisos = [];
  const w = m.terreno[0].length;
  const h = m.terreno.length;
  // porta fechada se abre no jogo: para alcançar, conta como passagem
  const abertas = { n: m.paredes?.n?.map((l) => l.replaceAll('+', '/')), o: m.paredes?.o?.map((l) => l.replaceAll('+', '/')) };
  const f = new Battlefield(w, h, m.terreno, m.altura, m.objetos, abertas);
  const inicio = (m.grupo ?? []).filter((p) => dentro(m, p.x, p.y));
  if (!inicio.length) return ['O mapa não tem casa de partida.'];
  inicio.forEach((p, i) => { if (f.blocksMove(p.x, p.y)) avisos.push(`O herói ${i + 1} nasce em casa bloqueada (${p.x},${p.y}).`); });
  const livre = inicio.find((p) => !f.blocksMove(p.x, p.y));
  if (!livre) return avisos;
  const alcancadas = f.reachable(livre, 100000);
  const salas = new Map();
  const solto = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (f.blocksMove(x, y) || alcancadas.has(`${x},${y}`)) continue;
      const sala = salaDe(m, x, y);
      if (sala) salas.set(sala, (salas.get(sala) ?? 0) + 1);
      else if (m.terreno[y][x] !== 'Z') solto.push(`${x},${y}`);
    }
  }
  for (const [s, n] of salas) avisos.push(`A sala "${s}" tem ${n} casa(s) que o grupo não alcança.`);
  if (solto.length) avisos.push(`${solto.length} casa(s) de chão fora de sala não são alcançáveis (${solto.slice(0, 4).join(' ')}${solto.length > 4 ? '...' : ''}).`);
  return avisos;
}

// -------------------------------------------------------------------------------------------- guardar e ler ---

/** Guarda o mapa para o jogo abrir com `?encontro=editor`. */
export function guardar(m, armazem = globalThis.localStorage) {
  try { armazem.setItem(CHAVE, JSON.stringify(m)); return true; } catch { return false; }
}

/** O mapa guardado, ou null (nada guardado, ou JSON quebrado). */
export function ler(armazem = globalThis.localStorage) {
  try {
    const t = armazem?.getItem(CHAVE);
    if (!t) return null;
    const m = JSON.parse(t);
    return Array.isArray(m?.terreno) && m.terreno.length ? m : null;
  } catch { return null; }
}
