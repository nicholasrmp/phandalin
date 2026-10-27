// O CAMPO EM DIFERENÇAS (multijogador): o que as cenas do anfitrião mudam no mapa durante o jogo (portas abertas ou trancadas,
// passagens secretas e grades que viram chão, buracos que se abrem) e o convidado nunca via, porque ele monta o mapa
// do zero com `montarCampo(mapaDo(variante))` e só recebe os combatentes.
//
// O anfitrião compara o campo dele com um campo recém-montado do mesmo mapa (a BASE) e manda só as casas que diferem
// (`extras.campo`); o convidado desfaz o que a diferença anterior mexeu e põe a nova. Puro: roda em Node.

/** As casas e arestas do campo que diferem da base, ou `null` se nenhuma. `a`: [0 N | 1 O, índice, código]; `c`: [índice, tile, superfície, altura]. */
export function diferencasDoCampo(campo, base) {
  if (!campo || !base || campo.w !== base.w || campo.h !== base.h) return null;
  const a = [];
  const c = [];
  const n = campo.w * campo.h;
  for (let i = 0; i < n; i += 1) {
    if (campo.paredeN[i] !== base.paredeN[i]) a.push([0, i, campo.paredeN[i]]);
    if (campo.paredeO[i] !== base.paredeO[i]) a.push([1, i, campo.paredeO[i]]);
    if (campo.tiles[i] !== base.tiles[i] || campo.surfaces[i] !== base.surfaces[i] || campo.heights[i] !== base.heights[i]) {
      c.push([i, campo.tiles[i], campo.surfaces[i], campo.heights[i]]);
    }
  }
  // Uma diferença enorme (uma cena que remonta o mapa inteiro) estouraria o teto da vista: melhor não mandar do que perder a vista.
  if (a.length + c.length > LIMITE_DE_DIFERENCAS) return null;
  return a.length || c.length ? { a, c } : null;
}

/** Quantas casas e arestas diferentes cabem numa vista (cada uma pesa uns 15 caracteres; o teto é 120.000). */
export const LIMITE_DE_DIFERENCAS = 2500;

/** Confere a forma de uma diferença antes de aplicar (o que vem da rede é dado, não código). */
export function diferencaValida(d, n) {
  if (d === null || d === undefined) return true;
  if (typeof d !== 'object' || !Array.isArray(d.a) || !Array.isArray(d.c)) return false;
  const inteiro = (v) => Number.isInteger(v) && v >= 0 && v < 256;
  const indice = (v) => Number.isInteger(v) && v >= 0 && v < n;
  return d.a.length <= n * 2 && d.c.length <= n
    && d.a.every((e) => Array.isArray(e) && (e[0] === 0 || e[0] === 1) && indice(e[1]) && inteiro(e[2]))
    && d.c.every((e) => Array.isArray(e) && indice(e[0]) && inteiro(e[1]) && inteiro(e[2]) && inteiro(e[3]));
}

/**
 * Põe a diferença no campo do espelho. O que a diferença ANTERIOR mexeu e a nova não repete volta ao que a base tem (uma porta
 * que o anfitrião fechou de novo). Devolve `true` se algo mudou, e então a versão do campo sobe (a visão recalcula).
 */
export function aplicarDiferencas(campo, base, d) {
  if (!diferencaValida(d, campo.w * campo.h)) return false;
  const antes = campo.difAplicada ?? { a: [], c: [] };
  const mexidasA = new Set(antes.a.map((e) => `${e[0]}:${e[1]}`));
  const mexidasC = new Set(antes.c.map((e) => e[0]));
  let mudou = false;
  const poeA = (t, i, cod) => {
    const alvo = t === 0 ? campo.paredeN : campo.paredeO;
    if (alvo[i] !== cod) { alvo[i] = cod; mudou = true; }
  };
  const poeC = (i, tile, sup, h) => {
    if (campo.tiles[i] !== tile || campo.surfaces[i] !== sup || campo.heights[i] !== h) {
      campo.tiles[i] = tile; campo.surfaces[i] = sup; campo.heights[i] = h; mudou = true;
    }
  };
  const novoA = new Set((d?.a ?? []).map((e) => `${e[0]}:${e[1]}`));
  const novoC = new Set((d?.c ?? []).map((e) => e[0]));
  for (const k of mexidasA) {
    if (novoA.has(k)) continue;
    const [t, i] = k.split(':').map(Number);
    poeA(t, i, (t === 0 ? base.paredeN : base.paredeO)[i]);
  }
  for (const i of mexidasC) if (!novoC.has(i)) poeC(i, base.tiles[i], base.surfaces[i], base.heights[i]);
  for (const [t, i, cod] of d?.a ?? []) poeA(t, i, cod);
  for (const [i, tile, sup, h] of d?.c ?? []) poeC(i, tile, sup, h);
  campo.difAplicada = d ?? { a: [], c: [] };
  if (mudou) campo.versao = (campo.versao ?? 0) + 1;
  return mudou;
}
