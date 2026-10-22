// Anatomia paramétrica: espécie + compleição → medidas em pixels.
//
// O pintor não sabe quanto mede uma cabeça. Ele pergunta aqui. É isso que
// permite um goblin ter cabeça maior que os ombros enquanto o hobgoblin tem
// ombros enormes e cabeça pequena — sem escrever dois pintores.
//
// A escala é relativa ao humano médio, que mede 46 px do pé ao alto do cabelo.
// O mais alto (bugbear) chega a 57, o mais baixo (goblin) a 32. A célula tem
// 60 px úteis, então cimeira de elmo e chifre ainda cabem.

const BASE = {
  feetH: 3, legH: 13, torsoH: 15, neckH: 2, headH: 10, hairH: 3,
  shoulderW: 14, chestW: 12, legW: 4, armW: 3, headW: 11,
};

/**
 * h      altura geral (1 = humano)
 * legs   quanto da altura vai para as pernas (anão tem perna curta e tronco longo)
 * head   tamanho da cabeça em relação ao corpo (goblin: cabeçudo)
 * bulk   largura de ombro, peito, braço e perna
 * neck   pixels de pescoço a mais ou a menos (hobgoblin tem pescoço de touro)
 * ear    round | long | wide
 */
export const SPECIES = {
  humano: { h: 1.00, legs: 1.00, head: 1.00, bulk: 1.00, neck: 0, ear: 'round' },
  elfo: { h: 1.06, legs: 1.08, head: 0.92, bulk: 0.88, neck: 1, ear: 'long', jaw: -1 },
  anao: { h: 0.84, legs: 0.68, head: 1.10, bulk: 1.34, neck: -1, ear: 'round', beardAlways: true, wideNose: true },
  halfling: { h: 0.72, legs: 0.86, head: 1.18, bulk: 0.94, neck: -1, ear: 'round', bigFeet: true },

  goblin: { h: 0.70, legs: 0.80, head: 1.30, bulk: 0.80, neck: -1, ear: 'wide', snout: true, hunch: 2, bigEyes: true, fangs: true },
  hobgoblin: { h: 1.12, legs: 1.02, head: 0.94, bulk: 1.26, neck: 2, ear: 'wide', brow: true, flatNose: true, jaw: 1 },
  bugbear: { h: 1.24, legs: 0.94, head: 1.00, bulk: 1.36, neck: 1, ear: 'wide', snout: true, fur: true, hunch: 1, fangs: true },
  orc: { h: 1.14, legs: 0.98, head: 1.00, bulk: 1.30, neck: 2, ear: 'wide', tusks: true, brow: true, jaw: 1 },
};

/** Compleição: é ortogonal à espécie — existe goblin gordo e hobgoblin magro. */
export const BUILDS = {
  magro: { bulk: 0.84, belly: 0, shoulder: -1 },
  normal: { bulk: 1.00, belly: 0, shoulder: 0 },
  forte: { bulk: 1.20, belly: 0, shoulder: 2 },
  gordo: { bulk: 1.14, belly: 4, shoulder: 0 },
};

const r = Math.round;
const clamp = (v, lo) => Math.max(lo, v);

/**
 * Medidas concretas de um look. Tudo em pixels, medido PARA CIMA a partir da
 * linha do chão (y negativo), no mesmo sistema do pintor.
 */
export function metrics(look) {
  const sp = SPECIES[look.species] ?? SPECIES.humano;
  const bd = BUILDS[look.build] ?? BUILDS.normal;

  const h = sp.h * (look.heightMul ?? 1);
  const bulk = sp.bulk * bd.bulk;
  // Largura cresce menos que altura: dobrar a altura não dobra o ombro.
  const wScale = bulk * (0.7 + 0.3 * h);

  const feetH = clamp(r(BASE.feetH * h), 2);
  const legH = clamp(r(BASE.legH * h * sp.legs), 5);
  const torsoH = clamp(r(BASE.torsoH * h), 8);
  const neckH = clamp(r(BASE.neckH * h) + (sp.neck ?? 0), 1);
  const headH = clamp(r(BASE.headH * h * sp.head), 7);
  const hairH = clamp(r(BASE.hairH * h), 2);

  // Linhas horizontais, do chão para cima.
  const footTop = -feetH;
  const waist = footTop - legH;        // onde a perna encontra o tronco
  const torsoTop = waist - torsoH;
  const chin = torsoTop - neckH;
  const headTop = chin - headH;
  const crown = headTop - hairH;

  const shoulderW = clamp(r(BASE.shoulderW * wScale) + bd.shoulder, 7);
  const chestW = clamp(r(BASE.chestW * wScale), 6);
  const waistW = clamp(chestW - 2 + bd.belly, 5);
  const legW = clamp(r(BASE.legW * bulk), 2);
  const armW = clamp(r(BASE.armW * bulk), 2);
  const headW = clamp(r(BASE.headW * (0.6 + 0.4 * h) * sp.head), 7);
  const footW = legW + 2;
  const gap = clamp(r(2 * (0.8 + 0.2 * bulk)), 1);

  return {
    sp, bd, h, bulk,
    feetH, legH, torsoH, neckH, headH, hairH,
    footTop, waist, torsoTop, chin, headTop, crown,
    shoulderW, chestW, waistW, legW, armW, headW, footW, gap,
    belly: bd.belly,
    hunch: sp.hunch ?? 0,
    // Altura total — o HUD usa para ordenar e a câmera para enquadrar.
    total: -crown,
    // Onde a mão da arma fica: na altura do quadril, na borda do ombro.
    handX: r(shoulderW / 2) + 1,
    handY: waist + r(torsoH * 0.25),
  };
}

/** Lista legível para a tela de criação de personagem. */
export const speciesNames = () => Object.keys(SPECIES);
export const buildNames = () => Object.keys(BUILDS);
