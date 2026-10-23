// FOLHAS DESENHADAS FORA DO CÓDIGO.
//
// Até aqui o jogo não tinha um único arquivo de imagem: as setenta figuras
// saíam de `draw.js`, pintadas em runtime. Isto abre a exceção — e ela é uma
// exceção, não uma mudança de rumo. O pintor procedural continua sendo quem
// desenha todo mundo; uma folha importada só substitui UMA figura, pela chave
// de look, e o resto do motor não fica sabendo.
//
// O CONTRATO É O MESMO DE `buildSheet`:
//   { key, image, w, h, anims: { nome: { y, fw, fh, frames, hold, total } }, dirs }
// `drawSprite` não distingue as duas origens, e `linhaDaDirecao` já pergunta
// à folha quantas direções ela tem — por isso uma folha de oito direções
// convive com as de três sem nenhum ramo novo em `board.js`.
//
// POR QUE O CARREGAMENTO É ASSÍNCRONO E MESMO ASSIM `getSheet` É SÍNCRONA.
// O tabuleiro chama `getSheet` dentro do laço de desenho, sessenta vezes por
// segundo; ela não pode esperar por um `Image`. Então: enquanto o PNG não
// chegou, a chave devolve a folha procedural de sempre — o goblin antigo
// aparece por alguns quadros —, e quando a imagem termina de carregar ela
// troca o cache. Sem tela em branco, sem exceção, sem espera.

import metaGoblin from './goblin.json';
import urlGoblin from './goblin.png';

const IMPORTADAS = {
  goblin: { meta: metaGoblin, url: urlGoblin },
};

const prontas = new Map();

/** A folha importada desta chave, se já carregou. Senão `null`. */
export function folhaImportada(key) {
  return prontas.get(key) ?? null;
}

/**
 * Dispara o carregamento de todas as folhas importadas.
 * `aoCarregar(key, folha)` é chamada por folha, para quem quiser invalidar
 * um cache. Chamar duas vezes não carrega duas vezes.
 */
let disparado = false;
export function carregarFolhas(aoCarregar) {
  if (disparado) return;
  disparado = true;
  for (const [key, { meta, url }] of Object.entries(IMPORTADAS)) {
    const image = new Image();
    image.onload = () => {
      const folha = {
        key, image, w: meta.w, h: meta.h, anims: meta.anims, dirs: meta.dirs,
      };
      prontas.set(key, folha);
      aoCarregar?.(key, folha);
    };
    // Falhar aqui não é fatal: sem a imagem, a chave continua caindo no
    // pintor procedural, que desenha o goblin de sempre.
    image.onerror = () => console.warn(`folha importada não carregou: ${key}`);
    image.src = url;
  }
}

export const CHAVES_IMPORTADAS = Object.keys(IMPORTADAS);
