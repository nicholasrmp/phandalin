// O SORTEIO PELA CASA: a variação de algo desenhado (a moita, o ladrilho, a faísca) escolhida pela posição no mundo.
//
// Determinístico em (x, y): o desenho não pisca a cada quadro. Era o coração do atlas de chão do isométrico (um ladrilho
// de losango sorteado por casa); o atlas saiu com o isométrico (2026-11-05), e o sorteio ficou — o cenário, as plantas
// e a vista de cima o usam.

/**
 * Mistura de inteiros para escolher a variação.
 *
 * A conta óbvia — `(x * a ^ y * b) % n` — tem diagonais visíveis com x e y
 * pequenos, que é exatamente o tamanho de um mapa de tabuleiro. Estas duas
 * rodadas de multiplicação e deslocamento espalham bem até em 28 x 22.
 */
export function sorteio(x, y, n) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) % n;
}
