// AS PAREDES DE BORDA DESENHADAS, para o tabuleiro.
//
// A parede não ocupa casa: ela mora na aresta entre duas casas
// (`core/grid.js`). O atlas (montado por `src/dev/montar-paredes.py` a partir
// de um kit de construção do PixelLab) guarda uma peça por tipo de aresta —
// parede, porta e arco, do norte e do oeste — já na projeção do tabuleiro.
//
// Cada peça traz onde desenhar (`ax`, `ay`), medido a partir do canto
// esquerdo do losango da casa: é a mesma origem que o `drawTile` usa.

import meta from './folhas/paredes.json';
import urlParedes from './folhas/paredes.png';

const img = new Image();
let pronto = false;
img.onload = () => { pronto = true; };
// Sem a imagem o tabuleiro volta a desenhar a parede com a faixa de pedra.
img.onerror = () => console.warn('atlas das paredes não carregou');
img.src = urlParedes;

/** A peça da aresta (`paredeN`, `portaO`, `arcoN`, `pilar`…), ou null. */
export function pecaDaParede(nome) {
  const p = pronto && meta.pecas[nome];
  return p ? { img, ...p } : null;
}
