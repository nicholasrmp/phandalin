// A ROTA PELO TERRENO DA REGIÃO: o caminho mais barato entre dois lugares, célula a célula, no terreno lido do mapa
// oficial (`rules/regiao-terreno.js`, gerado por `src/dev/mapa-regiao-terreno.py`).
//
// A REGRA é a do Livro do Jogador: em TERRENO DIFÍCIL (mata, colina, montanha) o grupo anda METADE do que andaria — aqui,
// cada quilômetro difícil custa dois da marcha do dia. TRILHA e ESTRADA andam no passo normal em qualquer terreno, e o
// CAMPO aberto também. O MAR não se anda. É por isso que a rota de Phandalin a Conyberry prefere a Trilha de Triboar à
// linha reta pelas colinas, e que o Castelo Dentefino, no meio da Floresta de Neverwinter, sai caro apesar de perto.
//
// A rota devolve a distância de verdade (o que se mostra ao jogador) e a distância EQUIVALENTE (o que a marcha gasta), e o
// PERFIL do caminho: o terreno de cada trecho, com a marcha acumulada, para cada dia da viagem saber por onde anda.

import { TERRENO_DA_REGIAO, CELULA_PX } from './regiao-terreno.js';
import { POSICOES_OFICIAIS, PX_POR_HEX, MILHAS_POR_HEX, KM_POR_MILHA, MAPA_OFICIAL_DA_REGIAO } from './regiao-mapa.js';

/** Quanto custa andar em cada terreno (1 = passo normal; 2 = terreno difícil). */
export const CUSTO_DO_TERRENO = { '.': 1, T: 1, f: 2, h: 2, m: 2, '~': Infinity };
export const NOME_DO_TERRENO = { '.': 'campo aberto', T: 'trilha', f: 'mata', h: 'colinas', m: 'montanha', '~': 'mar' };
/** O bioma de cada terreno, para a paisagem do dia, a caça e o Explorador Natural. */
export const BIOMA_DO_TERRENO = { '.': 'planicie', T: 'planicie', f: 'floresta', h: 'montanha', m: 'montanha' };

const NY = TERRENO_DA_REGIAO.length;
const NX = TERRENO_DA_REGIAO[0].length;
const KM_POR_PX = (MILHAS_POR_HEX / PX_POR_HEX) * KM_POR_MILHA;

export const terrenoEm = (i, j) => (i >= 0 && j >= 0 && i < NX && j < NY ? TERRENO_DA_REGIAO[j][i] : '~');
export const celulaDe = (id) => {
  const p = POSICOES_OFICIAIS[id];
  return p ? [Math.min(NX - 1, Math.floor(p.x / CELULA_PX)), Math.min(NY - 1, Math.floor(p.y / CELULA_PX))] : null;
};

/** Um passo de (a) para (b): metade em cada célula, cada metade pelo custo do terreno dela. */
function custoDoPasso(a, b) {
  const px = Math.hypot(a[0] - b[0], a[1] - b[1]) * CELULA_PX;
  const ca = CUSTO_DO_TERRENO[terrenoEm(...a)];
  const cb = CUSTO_DO_TERRENO[terrenoEm(...b)];
  return { px, custo: (px / 2) * ca + (px / 2) * cb };
}

const cache = new Map();

/**
 * A rota de `de` a `para` (ids de lugar): `{ km, kmEquivalentes, celulas, perfil, porTerreno }`, ou null.
 * `perfil`: `[{ km, kmEq, terreno }]` por célula do caminho, com a marcha acumulada até ela.
 * `porTerreno`: km de verdade em cada terreno.
 */
export function rotaEntre(de, para) {
  const chave = `${de}>${para}`;
  if (cache.has(chave)) return cache.get(chave);
  const a = celulaDe(de);
  const b = celulaDe(para);
  if (!a || !b) return null;
  const idx = (i, j) => j * NX + i;
  const dist = new Float64Array(NX * NY).fill(Infinity);
  const veio = new Int32Array(NX * NY).fill(-1);
  // a célula do lugar é sempre andável (Neverwinter fica na beira do mar)
  const anda = (i, j) => (i === a[0] && j === a[1]) || (i === b[0] && j === b[1]) || CUSTO_DO_TERRENO[terrenoEm(i, j)] < Infinity;
  const fila = [[0, a[0], a[1]]];
  dist[idx(...a)] = 0;
  const empurra = (x) => { fila.push(x); let k = fila.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (fila[p][0] <= fila[k][0]) break; [fila[p], fila[k]] = [fila[k], fila[p]]; k = p; } };
  const tira = () => { const top = fila[0]; const ult = fila.pop(); if (fila.length) { fila[0] = ult; let k = 0; for (;;) { const l = 2 * k + 1; const r = l + 1; let m = k; if (l < fila.length && fila[l][0] < fila[m][0]) m = l; if (r < fila.length && fila[r][0] < fila[m][0]) m = r; if (m === k) break; [fila[m], fila[k]] = [fila[k], fila[m]]; k = m; } } return top; };
  while (fila.length) {
    const [d, i, j] = tira();
    if (d > dist[idx(i, j)]) continue;
    if (i === b[0] && j === b[1]) break;
    for (let dj = -1; dj <= 1; dj++) {
      for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        const ni = i + di;
        const nj = j + dj;
        if (ni < 0 || nj < 0 || ni >= NX || nj >= NY || !anda(ni, nj)) continue;
        const { custo } = custoDoPasso([i, j], [ni, nj]);
        const nd = d + (Number.isFinite(custo) ? custo : CELULA_PX * 3);
        if (nd < dist[idx(ni, nj)]) { dist[idx(ni, nj)] = nd; veio[idx(ni, nj)] = idx(i, j); empurra([nd, ni, nj]); }
      }
    }
  }
  if (!Number.isFinite(dist[idx(...b)])) return null;
  const celulas = [];
  for (let k = idx(...b); k !== -1; k = veio[k]) celulas.push([k % NX, Math.floor(k / NX)]);
  celulas.reverse();
  const perfil = [];
  const porTerreno = {};
  let km = 0;
  let kmEq = 0;
  for (let n = 0; n < celulas.length; n++) {
    if (n > 0) {
      const { px, custo } = custoDoPasso(celulas[n - 1], celulas[n]);
      km += px * KM_POR_PX;
      kmEq += (Number.isFinite(custo) ? custo : px) * KM_POR_PX;
      const t = terrenoEm(...celulas[n]);
      porTerreno[t] = (porTerreno[t] ?? 0) + px * KM_POR_PX;
    }
    perfil.push({ km, kmEq, terreno: terrenoEm(...celulas[n]) });
  }
  const r = {
    km: Math.max(2, Math.round(km / 2) * 2),
    kmEquivalentes: Math.max(2, Math.round(kmEq / 2) * 2),
    celulas,
    perfil,
    porTerreno,
  };
  cache.set(chave, r);
  return r;
}

/** O terreno que mais pesa entre duas marcas de marcha (km equivalentes): o terreno do dia. */
export function terrenoDoTrecho(perfil, deKmEq, ateKmEq) {
  const conta = {};
  for (let n = 1; n < perfil.length; n++) {
    const p = perfil[n];
    if (p.kmEq <= deKmEq || perfil[n - 1].kmEq >= ateKmEq) continue;
    conta[p.terreno] = (conta[p.terreno] ?? 0) + (p.kmEq - perfil[n - 1].kmEq);
  }
  const lista = Object.entries(conta).sort((x, y) => y[1] - x[1]);
  return lista[0]?.[0] ?? perfil[perfil.length - 1]?.terreno ?? '.';
}

/** Quantos km DE VERDADE a marcha andou até a marca `kmEq` (o difícil gasta o dobro: anda-se menos). */
export function kmDeVerdade(perfil, kmEq) {
  if (!perfil?.length) return kmEq;
  for (let n = 1; n < perfil.length; n++) {
    const a = perfil[n - 1];
    const b = perfil[n];
    if (b.kmEq >= kmEq) {
      const f = b.kmEq > a.kmEq ? (kmEq - a.kmEq) / (b.kmEq - a.kmEq) : 1;
      return a.km + f * (b.km - a.km);
    }
  }
  return perfil[perfil.length - 1].km;
}

/** Os pontos da rota em % do mapa oficial (para desenhar o caminho na tela). */
export function pontosDaRota(rota) {
  const { w, h } = MAPA_OFICIAL_DA_REGIAO;
  return rota.celulas.map(([i, j]) => ({ x: (((i + 0.5) * CELULA_PX) / w) * 100, y: (((j + 0.5) * CELULA_PX) / h) * 100 }));
}

/** Em poucas palavras, por onde a rota passa: "trilha 40 km, colinas 12 km". */
export function resumoDaRota(rota) {
  return Object.entries(rota.porTerreno)
    .filter(([, km]) => km >= 2)
    .sort((x, y) => y[1] - x[1])
    .map(([t, km]) => `${NOME_DO_TERRENO[t]} ${Math.round(km)} km`)
    .join(', ');
}
