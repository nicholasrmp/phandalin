// AS FACES EM RUÍNA, para o tabuleiro.
//
// Parede de ruína é a parede de borda de sempre (`board.js`, `faceDaParede`)
// com outra pedra: rachada, furada, escurecida de fuligem, com entulho no pé.
// O atlas (montado por `src/dev/montar-ruinas.py` a partir dos kits `trovao*`
// do PixelLab) guarda, por material e por face, faixas de UM nível (22 px) em
// três classes: a do PÉ (nível 0, entulho e mato), a do MEIO e a do TOPO. A
// quebra do alto da parede NÃO está no atlas: o tabuleiro recorta o perfil.

import meta from './folhas/ruinas.json';
import urlRuinas from './folhas/ruinas.png';
import { sorteio } from './chao.js';

const img = new Image();
let pronto = false;
img.onload = () => { pronto = true; };
// Sem a imagem a parede em ruína volta à alvenaria comum.
img.onerror = () => console.warn('atlas das ruínas não carregou');
img.src = urlRuinas;

/** Os materiais que o atlas tem (`leve`, `pesada`, `escombros`, `alta`). */
export const MATERIAIS_DE_RUINA = Object.keys(meta.faixas);

/**
 * A faixa de um nível da face `lado` ('esq' | 'dir') do material, da classe
 * `classe` ('base' | 'meio' | 'topo'), sorteada por casa e nível, ou null.
 */
export function faixaDaRuina(material, lado, classe, x, y, n) {
  const lista = meta.faixas[material]?.[lado]?.[classe];
  if (!pronto || !lista?.length) return null;
  const f = lista[sorteio(x * 5 + n * 11, y * 3 + n, lista.length)];
  return { img, sx: f.x, sy: f.y, w: meta.fw, h: meta.fh };
}
