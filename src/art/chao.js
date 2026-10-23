// O CHÃO DESENHADO, para o tabuleiro.
//
// Um atlas com uma fileira por superfície — grama, estrada — e várias
// variações por fileira, montado por `src/dev/montar-chao.py` a partir das
// levas do PixelLab. Cada ladrilho já vem recortado pela partição exata do
// losango de 64 x 32, então o tabuleiro só precisa desenhá-lo 1:1 no lugar.
//
// POR QUE VÁRIAS VARIAÇÕES SORTEADAS.
// Um ladrilho só, repetido, vira papel de parede: qualquer feição dele — uma
// pedra, uma mancha — se repete na mesma posição em toda casa e desenha uma
// grade. Medido no primeiro gramado gerado: as duas pedras formaram uma grade
// perfeita num remendo de 6 x 6. Com dezesseis variações sorteadas por casa,
// a mesma grama lê como chão.
//
// O SORTEIO É PELA CASA, NÃO POR QUADRO.
// Determinístico em (x, y) de mundo: o chão não pisca a cada quadro e não muda
// quando a câmera gira, porque o que gira é a vista, não o mundo.

import meta from './folhas/chao.json';
import urlChao from './folhas/chao.png';

const img = new Image();
let pronto = false;
img.onload = () => { pronto = true; };
// Sem a imagem o tabuleiro continua desenhando o chão em cor lisa, que é o
// que ele fazia antes — falhar aqui não é fatal.
img.onerror = () => console.warn('atlas do chão não carregou');
img.src = urlChao;

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

/**
 * O ladrilho de chão de um tipo para a casa (x, y), ou null se o atlas ainda
 * não carregou ou não tem esse tipo.
 */
export function ladrilhoChao(tipo, x, y) {
  const fileira = meta.fileiras[tipo];
  if (!pronto || !fileira) return null;
  return {
    img,
    sx: sorteio(x, y, fileira.n) * meta.tw,
    sy: fileira.y,
    w: meta.tw,
    h: meta.th,
  };
}
