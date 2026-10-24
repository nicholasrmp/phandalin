// Os RETRATOS PINTADOS dos heróis (OpenArt), um por look base.
//
// O retrato recortado da folha de sprite vale para quem não tem um: goblin,
// NPC, look provisório. Herói com `retratos/<look>.webp` aparece pintado em
// todo lugar que pede `makePortrait` -- a HUD, a ficha, o menu --, com a
// mesma chamada e o mesmo tamanho. A troca de armadura e arma não muda o
// rosto, nem um estado: `fighter@placas-...` e `barbarian~furia` usam o
// retrato da figura.
//
// O PNG chega depois; enquanto isso o canvas sai com o recorte do sprite, e
// é repintado quando a imagem carrega.

const urls = import.meta.glob('./*.webp', { eager: true, query: '?url', import: 'default' });
const POR_LOOK = Object.fromEntries(
  Object.entries(urls).map(([caminho, url]) => [caminho.slice(2, -5), url]));

const imagens = new Map();

/** A imagem do retrato pintado da figura, ou null se ela não tem um. */
export function retratoPintado(lookKey) {
  const base = String(lookKey).split(/[@~]/)[0];
  const url = POR_LOOK[base];
  if (!url) return null;
  let img = imagens.get(base);
  if (!img) {
    img = new Image();
    img.decoding = 'async';
    img.src = url;
    imagens.set(base, img);
  }
  return img;
}
