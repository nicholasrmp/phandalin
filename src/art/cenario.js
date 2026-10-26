// OS OBJETOS DE CENÁRIO DESENHADOS, para o tabuleiro.
//
// Um atlas com os objetos recortados — árvores por enquanto —, montado por
// `src/dev/montar-cenario.py` a partir dos candidatos do PixelLab. Cada
// quadro traz a sua ÂNCORA (`ax`, `ay`): o pixel do desenho que cai no centro
// do losango da casa. O tabuleiro posiciona pela âncora, então um objeto de
// qualquer tamanho assenta no chão do mesmo jeito.
//
// O desenho é 1:1, sem ampliar: um carvalho de 76 px ocupa 76 px na tela, e o
// goblin, com uns 46, fica com cerca de dois terços da altura dele.

import meta from './folhas/cenario.json';
import urlCenario from './folhas/cenario.png';
import { sorteio } from './chao.js';

const img = new Image();
let pronto = false;
img.onload = () => { pronto = true; };
// Sem a imagem o tabuleiro continua com os objetos provisórios em canvas.
img.onerror = () => console.warn('atlas do cenário não carregou');
img.src = urlCenario;

/**
 * O quadro de um objeto para a casa (x, y), ou null se o atlas ainda não
 * carregou ou não tem o grupo.
 *
 * `papeis` é a lista de papéis aceitos — numa árvore da borda da mata só
 * `borda`, que mostra o tronco; no miolo, `borda` e `miolo` juntos, porque lá
 * o tronco fica escondido pela copa da frente e o que importa é variar.
 *
 * O sorteio é por coordenada de MUNDO: a mata não muda quando a câmera gira.
 * O deslocamento de até 3 px quebra a grade — 233 árvores alinhadas pelo
 * centro de casa leem como pomar plantado, não como mata.
 */
// Objetos que formam FILEIRA e precisam emendar: sem o deslocamento aleatorio.
// Nas arvores o balanco quebra a grade do pomar; numa grade de cela ele quebraria
// a emenda de uma casa com a vizinha.
const SEM_BALANCO = new Set(['grade']);

// A taverna é desenhada à mão numa grade só: nenhuma peça dela balança.
const semBalanco = (grupo) => SEM_BALANCO.has(grupo) || grupo.startsWith('prop-taverna-');

/** `quadro`: escolhe esse quadro (módulo o total) em vez de sortear por casa, para as peças animadas. */
export function spriteCenario(grupo, papeis, x, y, quadro = null) {
  const g = meta[grupo];
  if (!pronto || !g) return null;
  const quadros = papeis.flatMap((p) => g[p] ?? []);
  if (!quadros.length) return null;
  const q = quadros[quadro == null ? sorteio(x, y, quadros.length) : quadro % quadros.length];
  return {
    img,
    ...q,
    dx: semBalanco(grupo) ? 0 : sorteio(x + 101, y, 7) - 3,
    dy: semBalanco(grupo) ? 0 : sorteio(x, y + 211, 5) - 2,
  };
}
