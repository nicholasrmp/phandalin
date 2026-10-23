// Anatomia paramétrica: espécie + compleição → medidas em pixels.
//
// O pintor não sabe quanto mede uma cabeça. Ele pergunta aqui. É isso que
// permite um goblin ter cabeça maior que os ombros enquanto o hobgoblin tem
// ombros enormes e cabeça pequena — sem escrever dois pintores.
//
// A escala é relativa ao humano médio, que mede 58 px do pé ao alto do cabelo.
// O mais alto (ogro) chega a 72, o mais baixo (criança halfling) a 33. A célula
// tem 75 px úteis, então cimeira de elmo e chifre ainda cabem.
//
// A figura é exibida no tabuleiro em escala 1:1. Ter mais pixel por figura e
// não reescalar vale mais que desenhar pequeno e esticar: escala quebrada
// borra a grade e é metade do motivo de a arte parecer barata.
//
// TRÊS COISAS SAEM DAQUI, não só altura:
//   1. medidas    (onde fica o queixo, quanto mede o ombro)
//   2. `stance`   postura padrão da espécie — ver POSTURAS em draw.js
//   3. `face`     estrutura do rosto; é o que impede hobgoblin e orc de terem
//                 a mesma cara com tinta diferente

const BASE = {
  feetH: 4, legH: 17, torsoH: 19, neckH: 2, headH: 13, hairH: 3,
  shoulderW: 18, chestW: 15, legW: 5, armW: 4, headW: 14,
};

/**
 * Estrutura do rosto. Com 13 px de cabeça dá para muito mais que dois olhos e
 * um traço de boca, desde que as medidas sejam DIFERENTES entre espécies — é a
 * proporção que o jogador reconhece a 55 px, não o detalhe.
 *
 * testa      fração da altura da cabeça acima da linha dos olhos
 * arcada     0–3, projeção da arcada supraciliar
 * macas      0–2, quanto a maçã do rosto sai da face
 * mandibula  multiplicador da largura do maxilar sobre a do crânio
 * queixo     quadrado | pontudo | redondo | recuado | largo
 * projeta    quem avança no perfil: arcada | mandibula | focinho | nariz
 * olhoGap    -2 juntos … +1 afastados
 * olhoH/W    altura e largura do olho em pixels
 * nariz      reta | fina | chata | bulbosa | arrebitada | focinho
 * narizW     multiplicador da largura do nariz
 * boca       reta | fina | larga | frouxa | presas
 */
const rosto = (o) => ({
  testa: 0.36, arcada: 1, macas: 1, mandibula: 1.00, queixo: 'quadrado',
  projeta: null, olhoGap: 0, olhoH: 2, olhoW: 2,
  nariz: 'reta', narizW: 1.00, boca: 'reta', ...o,
});

/**
 * h      altura geral (1 = humano)
 * legs   quanto da altura vai para as pernas (anão tem perna curta e tronco longo)
 * head   tamanho da cabeça em relação ao corpo
 * bulk   largura de ombro, peito, braço e perna
 * arms   comprimento do braço (bugbear alcança abaixo do quadril)
 * neck   pixels de pescoço a mais ou a menos
 * ear    round | point | long | swept | wide
 * stance postura padrão de quem é dessa espécie (goblinoide não fica em sentido)
 *
 * Os valores são deliberadamente contidos. A primeira versão exagerava — o
 * goblin saía cabeçudo de olho enorme, mais gremlin de desenho animado que a
 * criatura do Manual dos Monstros, que é um humanoide pequeno e seco de cara
 * achatada. Diferença de espécie se lê com 15% a 25%, não com o dobro.
 */
export const SPECIES = {
  humano: {
    h: 1.00, legs: 1.00, head: 1.00, bulk: 1.00, arms: 1.00, neck: 0, ear: 'round',
    face: rosto({}),
  },

  // Élficos: o que separa os três é proporção, não tinta. O elfo é o mais alto
  // e o de olho mais fechado; o drow é o mais baixo e magro dos três e tem o
  // olho aberto (vive no escuro); o meio-elfo fica no meio em tudo, com a
  // orelha só levemente pontuda.
  elfo: {
    h: 1.05, legs: 1.06, head: 0.94, bulk: 0.90, arms: 1.02, neck: 1, ear: 'long',
    face: rosto({
      testa: 0.40, arcada: 0, macas: 2, mandibula: 0.92, queixo: 'pontudo',
      olhoGap: 1, olhoH: 1, olhoW: 3, nariz: 'fina', narizW: 0.80, boca: 'fina',
    }),
  },
  // SILHUETA: figura alta e fina de ombro estreito, com duas pontas de orelha
  // saindo acima da linha do maxilar e nada de volume no tronco.
  drow: {
    h: 0.97, legs: 1.06, head: 0.96, bulk: 0.82, arms: 1.02, neck: 1, ear: 'long',
    face: rosto({
      testa: 0.40, arcada: 0, macas: 2, mandibula: 0.88, queixo: 'pontudo',
      olhoGap: 1, olhoH: 2, olhoW: 3, nariz: 'fina', narizW: 0.76, boca: 'fina',
    }),
  },
  // SILHUETA: estatura e largura de humano, com duas pontas de orelha curtas
  // que mal passam do crânio.
  meioElfo: {
    h: 1.02, legs: 1.03, head: 0.97, bulk: 0.96, arms: 1.01, neck: 0, ear: 'point',
    face: rosto({
      testa: 0.38, arcada: 1, macas: 2, mandibula: 0.94, queixo: 'pontudo',
      narizW: 0.90,
    }),
  },

  anao: {
    h: 0.82, legs: 0.72, head: 1.06, bulk: 1.14, arms: 0.92, neck: -1, ear: 'round',
    beardAlways: true, wideNose: true,
    face: rosto({
      testa: 0.34, arcada: 2, macas: 1, mandibula: 1.10, queixo: 'largo',
      nariz: 'bulbosa', narizW: 1.30, boca: 'larga',
    }),
  },
  halfling: {
    h: 0.74, legs: 0.88, head: 1.04, bulk: 0.96, arms: 0.94, neck: -1, ear: 'round',
    bigFeet: true,
    face: rosto({
      testa: 0.34, arcada: 0, macas: 2, mandibula: 1.00, queixo: 'redondo',
      olhoH: 2, olhoW: 3, nariz: 'arrebitada', boca: 'larga',
    }),
  },

  // Goblinoides: seco e corcunda, soldado ereto, bruto peludo de braço longo.
  // O rosto é onde eles param de ser o mesmo boneco: o goblin tem o queixo
  // RECUADO e o olho afastado; o hobgoblin projeta a ARCADA sobre um olho
  // juntinho; o orc projeta a MANDÍBULA, que passa da arcada. São três perfis
  // diferentes, não três cores.
  goblin: {
    h: 0.72, legs: 0.86, head: 1.06, bulk: 0.90, arms: 1.04, neck: -1, ear: 'swept',
    flatNose: true, hunch: 2, darkEyes: true, fangs: true, stance: 'agachado',
    face: rosto({
      testa: 0.32, arcada: 1, macas: 0, mandibula: 0.82, queixo: 'recuado',
      projeta: 'nariz', olhoGap: 1, olhoH: 1, olhoW: 3,
      nariz: 'chata', narizW: 1.15, boca: 'larga',
    }),
  },
  hobgoblin: {
    h: 1.10, legs: 1.04, head: 0.98, bulk: 1.18, arms: 1.00, neck: 1, ear: 'swept',
    brow: true, flatNose: true, stance: 'militar',
    face: rosto({
      testa: 0.30, arcada: 3, macas: 2, mandibula: 1.00, queixo: 'quadrado',
      projeta: 'arcada', olhoGap: -1, olhoH: 1, olhoW: 3,
      nariz: 'chata', narizW: 0.90, boca: 'fina',
    }),
  },
  bugbear: {
    h: 1.20, legs: 0.92, head: 1.00, bulk: 1.24, arms: 1.22, neck: 0, ear: 'wide',
    snout: true, fur: true, hunch: 1, fangs: true, stance: 'curvado',
    face: rosto({
      testa: 0.34, arcada: 1, macas: 0, mandibula: 0.95, queixo: 'redondo',
      projeta: 'focinho', nariz: 'focinho', narizW: 1.20, boca: 'larga',
    }),
  },
  orc: {
    h: 1.12, legs: 1.00, head: 1.00, bulk: 1.20, arms: 1.06, neck: 1, ear: 'swept',
    tusks: true, brow: true, flatNose: true, stance: 'bruto',
    face: rosto({
      testa: 0.34, arcada: 2, macas: 1, mandibula: 1.22, queixo: 'largo',
      projeta: 'mandibula', olhoH: 2, olhoW: 2,
      nariz: 'chata', narizW: 1.35, boca: 'presas',
    }),
  },

  // Ogro: Grande de verdade. A conta que o faz parecer Grande não é a altura
  // sozinha — é ombro de 28 px sob uma cabeça de 13. Dois ogros lado a lado
  // fecham um corredor, e é isso que precisa ler no tabuleiro.
  // SILHUETA: trapézio imenso de ombro duas vezes mais largo que a cabeça,
  // sem pescoço, com a cabeça afundada entre os ombros e braço de mão enorme.
  ogro: {
    h: 1.32, legs: 0.98, head: 0.82, bulk: 1.40, arms: 1.10, neck: -1, ear: 'round',
    brow: true, wideNose: true, fangs: true, stance: 'bruto',
    face: rosto({
      testa: 0.26, arcada: 2, macas: 0, mandibula: 1.30, queixo: 'largo',
      projeta: 'mandibula', olhoGap: -2, olhoH: 1, olhoW: 2,
      nariz: 'bulbosa', narizW: 1.50, boca: 'frouxa',
    }),
  },
};

/** Compleição: é ortogonal à espécie — existe goblin gordo e hobgoblin magro. */
export const BUILDS = {
  magro: { bulk: 0.88, belly: 0, shoulder: -1 },
  normal: { bulk: 1.00, belly: 0, shoulder: 0 },
  forte: { bulk: 1.12, belly: 0, shoulder: 1 },
  gordo: { bulk: 1.08, belly: 3, shoulder: 0 },
};

/**
 * Criança: `look.child: true` em cima de qualquer espécie.
 *
 * Não é só "menor". Criança desenhada como adulto reduzido lê como anão: o que
 * identifica a idade é a CABEÇA ALTA sobre perna curta, nessa ordem. Serve
 * para o halfling pequeno dos Alderleaf, que precisa ler como criança ao lado
 * da mãe halfling — duas figuras baixas, e só uma é criança.
 *
 * A cabeça cresce em ALTURA e não em largura. A conta geral de `headW` já quase
 * não encolhe com a altura, então multiplicar a largura também saía com uma
 * cabeça achatada de 14 × 10 — que lê como anão de cara larga, o oposto do que
 * queremos. Alta e estreita, com a testa grande e o olho baixo, é cara de
 * criança.
 */
// SILHUETA: figura de um terço da altura adulta cuja cabeça é tão larga
// quanto os ombros, com perna curta e nenhuma arma.
const CRIANCA = {
  h: 0.80, legs: 0.84, headW: 1.00, headH: 1.28, bulk: 0.88, arms: 0.90, neck: -1,
  face: {
    testa: 0.46, arcada: 0, macas: 2, mandibula: 0.92, queixo: 'redondo',
    olhoH: 2, olhoW: 3, nariz: 'arrebitada', narizW: 0.90, boca: 'larga',
  },
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
  const kid = look.child ? CRIANCA : null;

  const h = sp.h * (look.heightMul ?? 1) * (kid ? kid.h : 1);
  const bulk = sp.bulk * bd.bulk * (kid ? kid.bulk : 1);
  const legs = sp.legs * (kid ? kid.legs : 1);
  const headH1 = sp.head * (kid ? kid.headH : 1);
  const headW1 = sp.head * (kid ? kid.headW : 1);
  const arms = (sp.arms ?? 1) * (kid ? kid.arms : 1);
  const neck = (sp.neck ?? 0) + (kid ? kid.neck : 0);
  // Largura cresce menos que altura: dobrar a altura não dobra o ombro.
  const wScale = bulk * (0.7 + 0.3 * h);

  const feetH = clamp(r(BASE.feetH * h), 2);
  const legH = clamp(r(BASE.legH * h * legs), 5);
  const torsoH = clamp(r(BASE.torsoH * h), 8);
  const neckH = clamp(r(BASE.neckH * h) + neck, 1);
  const headH = clamp(r(BASE.headH * h * headH1), 7);
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
  const headW = clamp(r(BASE.headW * (0.6 + 0.4 * h) * headW1), 7);
  const footW = legW + 2;
  const gap = clamp(r(2 * (0.8 + 0.2 * bulk)), 1);

  // O rosto pode ser afinado look por look (`look.face`), que é como dois
  // plebeus humanos saem com caras diferentes sem inventar espécie nova.
  const face = { ...(sp.face ?? rosto({})), ...(kid ? kid.face : {}), ...(look.face ?? {}) };
  const jawW = clamp(r(headW * face.mandibula), 4);

  return {
    sp, bd, h, bulk, arms, face, kid: !!kid,
    feetH, legH, torsoH, neckH, headH, hairH,
    footTop, waist, torsoTop, chin, headTop, crown,
    shoulderW, chestW, waistW, legW, armW, headW, jawW, footW, gap,
    belly: bd.belly,
    hunch: sp.hunch ?? 0,
    // Postura: o look manda, a espécie decide se o look não mandou, e o pintor
    // cai no arquétipo deduzido da arma e da armadura se nenhum dos dois falou.
    stance: look.stance ?? sp.stance ?? null,
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
