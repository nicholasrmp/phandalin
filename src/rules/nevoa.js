// A NÉVOA EXPLORADA, como a "Fog Exploration" do Foundry: o que o grupo já viu numa cena escura fica lembrado.
// A casa vista uma vez sai do preto e fica no escuro (o chão, a parede, o móvel que não se mexe), mas a criatura
// que está lá só aparece onde alguém está olhando AGORA — quem decide isso continua sendo `visaoDoGrupo`.
//
// A memória é do CAMPO (`field.explorado`, uma casa por byte), e o tabuleiro a enche a cada vez que a visão muda.
// O save guarda uma por cena, em `campanha.nevoa[variante]` (`codificarExplorado`), para voltar à caverna e achar
// o mapa que o grupo já andou. No multijogador cada navegador tem a sua, como no Foundry cada jogador tem a sua.
// O mapa que não quer (`nevoaExplorada: false`) fica como era: o que não se vê agora é preto.
//
// Puro: roda em Node.

/** O campo lembra o que o grupo vê? */
export const lembraOVisto = (field) => Boolean(field) && field.nevoaExplorada !== false;

/**
 * Marca como exploradas as casas de `visao` (o Map `"x,y" -> nível` de `visaoDoGrupo`, ou qualquer iterável de
 * chaves `"x,y"`). Devolve quantas casas eram novas; com alguma, `field.exploradoVersao` sobe (o véu se refaz).
 */
export function explorar(field, visao) {
  if (!lembraOVisto(field) || !visao) return 0;
  const n = field.w * field.h;
  if (!field.explorado || field.explorado.length !== n) field.explorado = new Uint8Array(n);
  let novas = 0;
  for (const k of visao instanceof Map ? visao.keys() : visao) {
    const v = k.indexOf(',');
    const x = Number(k.slice(0, v));
    const y = Number(k.slice(v + 1));
    if (!(x >= 0 && y >= 0 && x < field.w && y < field.h)) continue;
    const i = y * field.w + x;
    if (!field.explorado[i]) { field.explorado[i] = 1; novas += 1; }
  }
  if (novas) field.exploradoVersao = (field.exploradoVersao ?? 0) + 1;
  return novas;
}

/** A casa já foi vista? */
export const explorada = (field, x, y) => Boolean(field.explorado?.[y * field.w + x]);

/**
 * A memória em texto curto, para o save: `"LxA:"` e as corridas alternadas (começando pelas NÃO vistas) em base 36,
 * separadas por ponto. Uma caverna de 30x20 meio explorada cabe em algumas dezenas de caracteres. `null` se nada.
 */
export function codificarExplorado(field) {
  const e = field?.explorado;
  if (!e || !e.some((v) => v)) return null;
  const corridas = [];
  let atual = 0;
  let conta = 0;
  for (const v of e) {
    const b = v ? 1 : 0;
    if (b === atual) conta += 1;
    else { corridas.push(conta); atual = b; conta = 1; }
  }
  corridas.push(conta);
  return `${field.w}x${field.h}:${corridas.map((c) => c.toString(36)).join('.')}`;
}

/**
 * Põe de volta a memória que o save guardou. Recusa (devolve `false`) o texto que não casa com o campo — o mapa
 * mudou de tamanho desde então — ou que não fecha a conta das casas: dado de fora não vira memória pela metade.
 */
export function restaurarExplorado(field, texto) {
  if (!lembraOVisto(field) || typeof texto !== 'string') return false;
  const m = /^(\d+)x(\d+):([0-9a-z.]*)$/.exec(texto);
  if (!m || Number(m[1]) !== field.w || Number(m[2]) !== field.h) return false;
  const n = field.w * field.h;
  const g = new Uint8Array(n);
  let i = 0;
  let b = 0;
  for (const parte of m[3].split('.')) {
    const c = parseInt(parte, 36);
    if (!Number.isInteger(c) || c < 0 || i + c > n) return false;
    if (b) g.fill(1, i, i + c);
    i += c;
    b ^= 1;
  }
  if (i !== n) return false;
  field.explorado = g;
  field.exploradoVersao = (field.exploradoVersao ?? 0) + 1;
  return true;
}

/** Esquece tudo (a cena recomeçou do zero). */
export function esquecerExplorado(field) {
  if (!field?.explorado) return;
  field.explorado = null;
  field.exploradoVersao = (field.exploradoVersao ?? 0) + 1;
}
