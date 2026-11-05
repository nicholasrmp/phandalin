// A CATEGORIA DE TAMANHO do SRD como número (Miúdo 0 ... Imenso/Colossal 5): a regra de passar pelo espaço de outro
// (`combat.js`) e as regiões que só pegam quem tem peso (`regioes.js`, a laje que o goblin atravessa) perguntam aqui.
//
// Os heróis não trazem `size`: halfling e gnomo são Pequenos, os outros Médios (a mesma dedução de `visuals.js`).

export const CATEGORIAS_DE_TAMANHO = { miudo: 0, pequeno: 1, medio: 2, grande: 3, enorme: 4, imenso: 5, colossal: 5 };

const semAcento = (s) => `${s}`.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function categoriaDeTamanho(c) {
  const padrao = /halfling|pequenin|gnom/i.test(`${c.ancestry ?? ''} ${c.raca ?? ''}`) ? 'pequeno' : 'médio';
  return CATEGORIAS_DE_TAMANHO[semAcento(c.size ?? padrao)] ?? 2;
}

/** A categoria pelo nome ('medio', 'Grande'...), ou `null` se não é um nome de tamanho. */
export const categoriaDoNome = (nome) => (nome == null ? null : CATEGORIAS_DE_TAMANHO[semAcento(nome)] ?? null);
