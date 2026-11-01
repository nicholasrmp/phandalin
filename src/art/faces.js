// AS FACES LATERAIS DESENHADAS, para o tabuleiro.
//
// Um quadrado elevado mostra duas faces: a da esquerda (na luz) e a da
// direita (na sombra). Até aqui elas eram dois polígonos de cor lisa — e numa
// masmorra a parede é a maior área de tela: a fenda tem 88 px de face lisa.
//
// O atlas (montado por `src/dev/montar-faces.py` a partir dos blocos do
// PixelLab) guarda, por material, faixas de UM nível (22 px) de cada face. O
// tabuleiro empilha a faixa quantas vezes a altura pedir; a variação é
// sorteada por casa E por nível, para a parede alta não repetir a mesma pedra
// em coluna. Guarda também o topo de cada bloco: o alto da parede de
// alvenaria, em corte.

import meta from './folhas/faces.json';
import urlFaces from './folhas/faces.png';
import { sorteio } from './chao.js';

const img = new Image();
let pronto = false;
img.onload = () => { pronto = true; };
// Sem a imagem o tabuleiro volta às faces de cor lisa.
img.onerror = () => console.warn('atlas das faces não carregou');
img.src = urlFaces;

/**
 * A faixa de um nível da face `lado` ('esq' | 'dir') do material, para a
 * casa (x, y) e o nível `n`, ou null.
 */
export function faixaDaFace(material, lado, x, y, n, total = 0) {
  // A parede alta tem peças diferentes por nível (o atlas guarda `material:topo` e `material:base`): a moldura no alto, o corpo no meio e
  // o rodapé embaixo. Sem `total` (ou sem as peças no atlas), é a mesma faixa em todos os níveis.
  let chave = material;
  if (total === 1 && meta.faces[`${material}:base`]) chave = `${material}:base`;
  else if (total > 1 && meta.faces[`${material}:topo`]) chave = n === 0 ? `${material}:topo` : (n === total - 1 ? `${material}:base` : material);
  const f = meta.faces[chave];
  if (!pronto || !f) return null;
  const i = sorteio(x * 5 + n * 11, y * 3 + n, f.n);
  return { img, sx: i * meta.tw + (lado === 'dir' ? meta.fw : 0), sy: f.y, w: meta.fw, h: meta.fh };
}

/** O topo de bloco do material (64 x 32) para a casa (x, y), ou null. */
export function topoDoBloco(material, x, y) {
  const t = meta.topos[material];
  if (!pronto || !t) return null;
  return { img, sx: sorteio(x, y, t.n) * meta.tw, sy: t.y, w: meta.tw, h: meta.th };
}
