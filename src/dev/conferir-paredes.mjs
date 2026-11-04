// CONFERE PAREDE E PORTA de todos os mapas do jogo, rodando o motor de verdade.
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/conferir-paredes.mjs            # todas as cenas
//   node --import ./src/dev/cena-node/register.mjs src/dev/conferir-paredes.mjs mansao     # só uma
//   node --import ./src/dev/cena-node/register.mjs src/dev/conferir-paredes.mjs --tudo     # inclui os avisos fracos
//
// Não opina sobre desenho: faz perguntas que têm resposta de sim ou não no `Battlefield`, e cada achado sai com
// a casa, para abrir no editor (`/editor.html`, a cena está na lista do alto) e corrigir.
//
// O QUE PERGUNTA, e por que cada uma pega um defeito de verdade:
//
//   porta no maciço      a porta tem rocha de um dos lados. Ela nunca abre para lugar nenhum.
//   porta que não separa com TODAS as portas do mapa fechadas, os dois lados dela ainda se alcançam em três
//                        passos. É enfeite: dá a volta. (Porta dupla não cai aqui — fechando as duas, não dá.)
//   chão ilhado          casa de chão que o grupo não alcança da posição de partida, com as portas (e as
//                        secretas que o roteiro abre) abertas. Vem com a FRONTEIRA da ilha: são essas arestas
//                        que dizem se falta uma porta ou se é pedra de propósito.
//   bolsão murado        pior que o anterior: a ilha não faz fronteira com aresta nenhuma, só com pedra.
//   folha sem porta      `mapa.folhas` aponta uma aresta que não é porta: o tabuleiro desenharia folha no vazio.
//   grade sem barra      `mapa.grades` aponta uma aresta que não é seteira nem parede.
//
// O que NÃO é defeito, e por isso só aparece com `--tudo`: parede entre duas casas que já são maciças (redundante,
// mas inofensiva) e vão aberto (`aberta`) que não separa nada, que é justamente o que um arco é.

import { mapaDo } from '../game/encounter.js';
import { montarCampo } from '../game/campo.js';
import { ARESTA } from '../core/grid.js';
import { MANSAO } from '../game/mansao.js';
import { ANDARES } from '../game/casadamorte.js';
import { CRIPTAS, SEGREDO_SANTUARIO, SEGREDO_PRISAO, PONTE } from '../game/casadamorte-porao-cena.js';
import { PAR_DA_BIBLIOTECA } from '../game/capitulo-casadamorte.js';

// O QUE O ROTEIRO ABRE, e o mapa guarda fechado. Sem isto a conferência acusa metade das masmorras de
// inalcançável — e não é: é SEGREDO, que é outra coisa. Vem das constantes de verdade, importadas, e não de
// coordenadas copiadas para cá, que calariam no dia em que alguém mudasse a planta.
//
//   `arestas`  parede que vira vão quando alguém acha (a estante da biblioteca, as secretas da Mansão)
//   `casas`    casa maciça que vira chão (o segredo da prisão, o do santuário, a laje de cada cripta, a ponte)
const SEGREDOS = {
  arestas: {
    mansao: Object.values(MANSAO.secretas ?? {}),
    mansaoTunel: Object.values(MANSAO.secretas ?? {}),
    casaDaMorte2: [{ a: PAR_DA_BIBLIOTECA[0], b: PAR_DA_BIBLIOTECA[1] }],
  },
  casas: {
    casaDaMortePorao1: [...SEGREDO_SANTUARIO, ...Object.values(CRIPTAS).flatMap((c) => c.laje ?? [])],
    casaDaMortePorao2: [...SEGREDO_PRISAO, ...PONTE],
  },
};

/** Onde o grupo pode APARECER numa cena: a partida, mais a chegada de cada outro andar (a Casa da Morte). */
function entradas(cena, mapa) {
  const chegadas = Object.values(ANDARES[cena]?.chegadas ?? {}).flat();
  return [...(mapa.grupo ?? []), ...chegadas];
}

/** As casas de escada que se pegam pelo botão direito: chega-se nelas pela outra cena, e não andando. */
function casasDeEscada(cena) {
  const saida = new Set();
  for (const e of ANDARES[cena]?.escadas ?? []) {
    for (let y = e.rect.y1; y <= e.rect.y2; y++) for (let x = e.rect.x1; x <= e.rect.x2; x++) saida.add(`${x},${y}`);
  }
  return saida;
}

const CENAS = [
  'emboscada', 'ermo', 'ermoNoite', 'rua', 'esconderijo', 'mansao', 'mansaoTunel',
  'poco', 'cume', 'castelo', 'arvoreTrovao', 'ondaEco',
  'casaDaMorte1', 'casaDaMorte2', 'casaDaMorte3', 'casaDaMorte4', 'casaDaMortePorao1', 'casaDaMortePorao2',
];
const BARRA = new Set([ARESTA.parede, ARESTA.porta, ARESTA.seteira]);
const NOME_DA_ARESTA = { 0: 'nada', 1: 'parede', 2: 'porta', 3: 'vão aberto', 4: 'seteira' };

/** Todas as arestas do mapa, uma vez cada: `{ x, y, lado, a, b, codigo }`, com `a`/`b` as duas casas. */
function arestas(campo) {
  const saida = [];
  for (let y = 0; y < campo.h; y++) {
    for (let x = 0; x < campo.w; x++) {
      const i = y * campo.w + x;
      if (campo.paredeN[i]) saida.push({ x, y, lado: 'N', a: { x, y: y - 1 }, b: { x, y }, codigo: campo.paredeN[i] });
      if (campo.paredeO[i]) saida.push({ x, y, lado: 'O', a: { x: x - 1, y }, b: { x, y }, codigo: campo.paredeO[i] });
    }
  }
  return saida;
}

/** As casas que se alcançam a partir de `origens`, com as portas valendo o que `portaFechada` disser. */
function alcance(campo, origens, portaFechada, segredo = new Set(), casaQueAbre = new Set()) {
  const vistos = new Set();
  const fila = [];
  for (const p of origens) {
    const k = `${p.x},${p.y}`;
    if (campo.inside(p.x, p.y) && !vistos.has(k)) { vistos.add(k); fila.push(p); }
  }
  const barrado = (ax, ay, bx, by) => {
    if (segredo.has(`${ax},${ay},${bx},${by}`)) return false;
    const c = campo.aresta(ax, ay, bx, by);
    return c === ARESTA.parede || c === ARESTA.seteira || (portaFechada && c === ARESTA.porta);
  };
  const passa = (ax, ay, bx, by) => (ax === bx || ay === by
    ? !barrado(ax, ay, bx, by)
    // na diagonal o motor exige os dois lados livres; aqui vale o mesmo, senão o grupo "passa" pela quina
    : !barrado(ax, ay, bx, ay) && !barrado(bx, ay, bx, by)
      && !barrado(ax, ay, ax, by) && !barrado(ax, by, bx, by));
  while (fila.length) {
    const { x, y } = fila.pop();
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = x + dx;
        const ny = y + dy;
        const k = `${nx},${ny}`;
        if (!campo.inside(nx, ny) || vistos.has(k)) continue;
        if (campo.blocksMove(nx, ny) && !casaQueAbre.has(k)) continue;
        if (!passa(x, y, nx, ny)) continue;
        vistos.add(k);
        fila.push({ x: nx, y: ny });
      }
    }
  }
  return vistos;
}

/**
 * Quantos passos de `a` até `b` com TODAS as portas fechadas, até o limite (Infinity se não chega).
 *
 * `extra` é a aresta em teste, fechada junto: sem isso um VÃO ABERTO (que não barra nada) dava sempre 1 passo,
 * e toda arcada do jogo aparecia como "não separa" — resposta certa para a pergunta errada.
 */
function passosComTudoFechado(campo, a, b, limite = 3, extra = null) {
  let fronteira = [a];
  const vistos = new Set([`${a.x},${a.y}`]);
  for (let passo = 1; passo <= limite; passo++) {
    const proxima = [];
    for (const p of fronteira) {
      const perto = alcanceDeUmPasso(campo, p, extra);
      for (const q of perto) {
        const k = `${q.x},${q.y}`;
        if (vistos.has(k)) continue;
        if (q.x === b.x && q.y === b.y) return passo;
        vistos.add(k);
        proxima.push(q);
      }
    }
    fronteira = proxima;
  }
  return Infinity;
}

function alcanceDeUmPasso(campo, p, extra = null) {
  const saida = [];
  const eExtra = (ax, ay, bx, by) => extra
    && ((extra.a.x === ax && extra.a.y === ay && extra.b.x === bx && extra.b.y === by)
      || (extra.a.x === bx && extra.a.y === by && extra.b.x === ax && extra.b.y === ay));
  const barrado = (ax, ay, bx, by) => eExtra(ax, ay, bx, by) || BARRA.has(campo.aresta(ax, ay, bx, by));
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = p.x + dx;
      const ny = p.y + dy;
      if (!campo.inside(nx, ny) || campo.blocksMove(nx, ny)) continue;
      const ok = dx === 0 || dy === 0
        ? !barrado(p.x, p.y, nx, ny)
        : !barrado(p.x, p.y, nx, p.y) && !barrado(nx, p.y, nx, ny)
          && !barrado(p.x, p.y, p.x, ny) && !barrado(p.x, ny, nx, ny);
      if (ok) saida.push({ x: nx, y: ny });
    }
  }
  return saida;
}

export function conferirMapa(mapa, cena = '', tudo = false) {
  const campo = montarCampo(mapa);
  const achados = [];
  const marca = (grave, tipo, onde, texto) => achados.push({ grave, tipo, onde, texto });
  const livre = (p) => campo.inside(p.x, p.y) && !campo.blocksMove(p.x, p.y);

  for (const e of arestas(campo)) {
    const nome = `${e.x},${e.y},${e.lado}`;
    const porta = e.codigo === ARESTA.porta;
    const vao = e.codigo === ARESTA.aberta;
    if (!porta && !vao) continue;

    const foraA = !campo.inside(e.a.x, e.a.y);
    const foraB = !campo.inside(e.b.x, e.b.y);
    if (foraA || foraB) {
      marca(porta, 'porta na borda', nome, `${NOME_DA_ARESTA[e.codigo]} com um lado fora do mapa`);
      continue;
    }
    if (!livre(e.a) || !livre(e.b)) {
      const lado = !livre(e.a) ? e.a : e.b;
      marca(porta, 'porta no maciço', nome,
        `${NOME_DA_ARESTA[e.codigo]} com (${lado.x},${lado.y}) maciça: não abre para lugar nenhum`);
      continue;
    }
    if (!porta && !tudo) continue;   // vão aberto não separar nada é o que um arco é
    // TRÊS passos, e não dois: dar a volta numa porta solta no meio de uma sala custa subir, atravessar e
    // descer, porque a diagonal pela quina da própria porta não passa. Com dois, o teste nunca acusava nada.
    const volta = passosComTudoFechado(campo, e.a, e.b, 3, e);
    if (volta <= 3) {
      marca(porta, 'porta que não separa', nome,
        `com todas as portas fechadas ainda se vai de (${e.a.x},${e.a.y}) a (${e.b.x},${e.b.y}) em ${volta} passo(s)`);
    }
  }

  // o chão ilhado: o que não se alcança de NENHUMA entrada, com as portas e os segredos do roteiro abertos
  const partida = entradas(cena, mapa).filter((p) => campo.inside(p.x, p.y));
  const dePe = partida.filter((p) => livre(p));
  if (!dePe.length && partida.length) {
    marca(true, 'partida no maciço', `${partida[0].x},${partida[0].y}`, 'nenhuma casa de entrada é chão livre');
  } else if (dePe.length) {
    const segredoDeAresta = new Set((SEGREDOS.arestas[cena] ?? [])
      .flatMap((s) => [`${s.a.x},${s.a.y},${s.b.x},${s.b.y}`, `${s.b.x},${s.b.y},${s.a.x},${s.a.y}`]));
    const segredoDeCasa = new Set((SEGREDOS.casas[cena] ?? []).map(([x, y]) => `${x},${y}`));
    const escadas = casasDeEscada(cena);
    const grades = new Set(mapa.grades ?? []);
    const temGrade = (x, y, nx, ny) => grades.has(ny > y ? `${nx},${ny},N` : ny < y ? `${x},${y},N`
      : nx > x ? `${nx},${ny},O` : `${x},${y},O`);
    const anda = (x, y) => !campo.blocksMove(x, y) || segredoDeCasa.has(`${x},${y}`);

    const alcancado = alcance(campo, dePe, false, segredoDeAresta, segredoDeCasa);
    const resto = new Set();
    for (let y = 0; y < campo.h; y++) {
      for (let x = 0; x < campo.w; x++) if (anda(x, y) && !alcancado.has(`${x},${y}`)) resto.add(`${x},${y}`);
    }
    while (resto.size) {
      const [k0] = resto;
      const [x0, y0] = k0.split(',').map(Number);
      const ilha = alcance(campo, [{ x: x0, y: y0 }], false, segredoDeAresta, segredoDeCasa);
      for (const k of ilha) resto.delete(k);

      const fronteira = [];
      for (const k of ilha) {
        const [x, y] = k.split(',').map(Number);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx;
          const ny = y + dy;
          if (!campo.inside(nx, ny) || !anda(nx, ny) || ilha.has(`${nx},${ny}`)) continue;
          const c = campo.aresta(x, y, nx, ny);
          if (c) fronteira.push({ texto: `(${x},${y})-(${nx},${ny}) ${NOME_DA_ARESTA[c]}`, grade: temGrade(x, y, nx, ny) });
        }
      }
      // O QUE NÃO É DEFEITO, e por quê:
      const casas = [...ilha].map((k) => k.split(',').map(Number));
      const soFora = casas.every(([x, y]) => campo.surfaceAt(x, y) === 'cinza');     // o anel de fora da casa
      const soEscada = casas.every(([x, y]) => escadas.has(`${x},${y}`));            // chega-se por botão, não andando
      // basta UMA barra de ferro na fronteira: a cela da Mansão tem grade de um lado e parede nos outros três,
      // e exigir que toda a fronteira fosse grade reprovava a cela do sul e aprovava a do norte, que são iguais
      const temGradeNaFronteira = fronteira.some((f) => f.grade);
      if (soFora || soEscada || temGradeNaFronteira) continue;

      const salas = Object.entries(mapa.salas ?? {})
        .filter(([, cs]) => cs.some((c) => ilha.has(`${c.x},${c.y}`)))
        .map(([nome]) => nome);
      const quem = salas.length ? ` (sala${salas.length > 1 ? 's' : ''} ${salas.join(', ')})` : '';
      if (!fronteira.length) {
        marca(true, 'bolsão murado', `${x0},${y0}`,
          `${ilha.size} casa(s) de chão cercadas só por pedra${quem}: não há aresta nenhuma por onde entrar`);
      } else {
        marca(true, 'chão ilhado', `${x0},${y0}`,
          `${ilha.size} casa(s) de chão que nenhuma entrada alcança${quem}; a fronteira é ${fronteira.length} aresta(s): `
          + fronteira.slice(0, 6).map((f) => f.texto).join('; ') + (fronteira.length > 6 ? ' ...' : ''));
      }
    }
  }

  for (const [a, b] of mapa.folhas ?? []) {
    const c = campo.aresta(a.x, a.y, b.x, b.y);
    if (c !== ARESTA.porta && c !== ARESTA.aberta) {
      marca(true, 'folha sem porta', `${a.x},${a.y}`,
        `\`folhas\` aponta (${a.x},${a.y})-(${b.x},${b.y}), que é ${NOME_DA_ARESTA[c] ?? c}`);
    }
  }
  for (const g of mapa.grades ?? []) {
    const [x, y, lado] = String(g).split(',');
    const c = lado === 'N' ? campo.paredeN[Number(y) * campo.w + Number(x)] : campo.paredeO[Number(y) * campo.w + Number(x)];
    if (c !== ARESTA.seteira && c !== ARESTA.parede) {
      marca(true, 'grade sem barra', `${x},${y},${lado}`, `\`grades\` aponta uma aresta que é ${NOME_DA_ARESTA[c] ?? c}`);
    }
  }

  if (tudo) {
    let redundantes = 0;
    for (const e of arestas(campo)) {
      if (e.codigo !== ARESTA.parede) continue;
      if (!livre(e.a) && !livre(e.b)) redundantes += 1;
    }
    if (redundantes) marca(false, 'parede redundante', '-', `${redundantes} parede(s) entre duas casas já maciças`);
  }
  return { mapa, campo, achados };
}

export const conferir = (cena, tudo) => conferirMapa(mapaDo(cena), cena, tudo);

// O relatório só roda quando o arquivo é chamado na linha de comando: `testes-paredes.mjs` importa `conferirMapa`.
const chamadoDireto = import.meta.url.endsWith('conferir-paredes.mjs') && /conferir-paredes\.mjs$/.test(process.argv[1] ?? '');
const args = process.argv.slice(2);
const tudo = args.includes('--tudo');
const pedidas = args.filter((a) => !a.startsWith('--'));
let graves = 0;
let fracos = 0;
for (const cena of chamadoDireto ? (pedidas.length ? pedidas : CENAS) : []) {
  let r;
  try { r = conferir(cena, tudo); } catch (e) { console.log(`${cena}: ERRO — ${e.message}`); continue; }
  const { mapa, campo, achados } = r;
  const portas = arestas(campo).filter((e) => e.codigo === ARESTA.porta).length;
  const paredes = arestas(campo).filter((e) => e.codigo === ARESTA.parede).length;
  const cab = `${cena.padEnd(20)} ${String(campo.w).padStart(3)}x${String(campo.h).padEnd(3)} ${String(paredes).padStart(4)} paredes ${String(portas).padStart(3)} portas`;
  if (!achados.length) { console.log(`${cab}   ok`); continue; }
  console.log(`${cab}   ${achados.length} achado(s)`);
  for (const a of achados) {
    console.log(`    ${a.grave ? '!' : '-'} [${a.onde}] ${a.tipo}: ${a.texto}`);
    if (a.grave) graves += 1; else fracos += 1;
  }
}
if (chamadoDireto) console.log(`\n${graves} achado(s) para corrigir${tudo ? `, ${fracos} aviso(s) fraco(s)` : ''}.`);
