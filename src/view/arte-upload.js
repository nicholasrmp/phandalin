// A IMAGEM QUE O JOGADOR MANDA para a ficha do herói criado: ler o arquivo, recortar em quadrado (com zoom e
// deslocamento escolhidos na tela) e reduzir para um webp pequeno, que é o que vai na definição e no save.
//
// 192 px de lado: a ficha do tabuleiro, na casa de 64 px, tem uns 54 px de diâmetro; com o zoom no máximo, uns 110.
// O resto é desperdício — e cada save leva os quatro heróis. O teto de `game/criador.js` (MAX_ARTE) é 80 kB.

import { MAX_ARTE } from '../game/criador.js';

export const LADO_DA_ARTE = 192;
const MAX_ARQUIVO = 15 * 1024 * 1024;

/** O arquivo vira imagem carregada. Recusa o que não é imagem, ou é grande demais para ser foto de ficha. */
export function lerImagem(arquivo) {
  return new Promise((ok, falha) => {
    if (!arquivo || !/^image\/(png|jpeg|webp|gif|avif|bmp)$/.test(arquivo.type)) { falha(new Error('Escolha uma imagem (PNG, JPEG, WebP…).')); return; }
    if (arquivo.size > MAX_ARQUIVO) { falha(new Error('A imagem passa de 15 MB.')); return; }
    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); ok(img); };
    img.onerror = () => { URL.revokeObjectURL(url); falha(new Error('Não deu para abrir essa imagem.')); };
    img.src = url;
  });
}

/**
 * O quadrado da imagem que vai para a ficha. `zoom` 1 é o maior quadrado que cabe; `dx`/`dy` de -1 a 1 andam o
 * recorte até a borda. Devolve o retângulo na imagem.
 */
export function recorte(img, { zoom = 1, dx = 0, dy = 0 } = {}) {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const lado = Math.min(w, h) / Math.max(1, zoom);
  const folgaX = (w - lado) / 2;
  const folgaY = (h - lado) / 2;
  return { x: folgaX + dx * folgaX, y: folgaY + dy * folgaY, lado };
}

/** Desenha o recorte num canvas quadrado. */
export function desenharRecorte(canvas, img, ajuste) {
  const ctx = canvas.getContext('2d');
  const r = recorte(img, ajuste);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, r.x, r.y, r.lado, r.lado, 0, 0, canvas.width, canvas.height);
}

/**
 * A imagem do herói para levar à SALA do multijogador, que tem teto menor (`MAX_ARTE_DA_SALA`): se já cabe, vai como
 * está; se não, sai de novo a 128 px, baixando a qualidade até caber. `null` se não couber de jeito nenhum.
 */
export async function arteParaSala(url, teto) {
  if (!url || url.length <= teto) return url ?? null;
  const img = await new Promise((ok, falha) => { const i = new Image(); i.onload = () => ok(i); i.onerror = falha; i.src = url; });
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  desenharRecorte(c, img, { zoom: 1, dx: 0, dy: 0 });
  for (const q of [0.8, 0.65, 0.5, 0.35]) {
    const saida = c.toDataURL('image/webp', q);
    const final = saida.startsWith('data:image/webp') ? saida : c.toDataURL('image/jpeg', q);
    if (final.length <= teto) return final;
  }
  return null;
}

/** A imagem final, em data URL: webp, baixando a qualidade até caber no teto. */
export function reduzirArte(img, ajuste) {
  const c = document.createElement('canvas');
  c.width = LADO_DA_ARTE;
  c.height = LADO_DA_ARTE;
  desenharRecorte(c, img, ajuste);
  for (const q of [0.86, 0.75, 0.62, 0.5]) {
    const url = c.toDataURL('image/webp', q);
    // o navegador sem webp devolve PNG: aí tenta JPEG, que sempre existe
    const final = url.startsWith('data:image/webp') ? url : c.toDataURL('image/jpeg', q);
    if (final.length <= MAX_ARTE) return final;
  }
  return null;
}
