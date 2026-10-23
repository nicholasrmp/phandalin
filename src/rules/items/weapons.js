// SRD 5.1 (CC-BY-4.0) — ver NOTICE.md
// As trinta e sete armas da tabela do SRD.
//
// O QUE CADA CAMPO FAZ
// `damage`, `type`, `ability`, `reachFt`, `rangeFt`, `longRangeFt`, `finesse`
// e `ranged` são lidos pelo MOTOR (`combat.js`, `odds.js`). Mexer neles muda
// o combate. `peso`, `custo`, `categoria`, `versatil` e `props` são catálogo:
// a ficha os mostra, o motor os ignora.
//
// `art` é a figura que o pintor desenha na mão (`art/draw.js`), e só existem
// oito: sword, dagger, axe, mace, staff, bow, clava, gancho. Trinta e sete
// armas em oito desenhos significa que a alabarda usa a cabeça de machado e o
// chicote usa o gancho — aproximação deliberada, e melhor que um campo que
// aponta para um desenho inexistente e faz a figura sair de mãos vazias.
// A rede é a única com `art: null`: é a única que não se empunha.
//
// ARREMESSO NÃO É ARMA À DISTÂNCIA. A azagaia tem `rangeFt` e NÃO tem
// `ranged: true`, porque quem arremessa continua usando Força. É assim que a
// adaga já funcionava, e `weaponAbility` depende disso.
//
// ALCANCE 10 PÉS: glaive, alabarda, pique, lança e chicote têm `reachFt: 10`.
// `distanceFt` é métrica de caixa a caixa desde a pegada, então isso já vale
// no tabuleiro sem mais nada.

/** Atalho: toda arma simples corpo a corpo compartilha estes campos. */
const corpo = (extra) => ({ ability: 'str', reachFt: 5, ...extra });
const distancia = (extra) => ({ ability: 'dex', ranged: true, ...extra });

export const WEAPONS = {
  // ---------------------------------------------------- simples, corpo ----
  clava: corpo({
    id: 'clava', name: 'Clava', damage: '1d4', type: 'concussão',
    props: ['leve'], art: 'clava',
    categoria: 'simples', peso: 2, custo: 0.1, fonte: 'srd',
  }),
  adaga: corpo({
    id: 'adaga', name: 'Adaga', damage: '1d4', type: 'perfurante',
    finesse: true, rangeFt: 20, longRangeFt: 60,
    props: ['acuidade', 'leve', 'arremesso'], art: 'dagger',
    categoria: 'simples', peso: 1, custo: 2, fonte: 'srd',
  }),
  clavaGrande: corpo({
    id: 'clavaGrande', name: 'Clava grande', damage: '1d8', type: 'concussão',
    props: ['duas mãos'], art: 'clava',
    categoria: 'simples', peso: 10, custo: 0.2, fonte: 'srd',
  }),
  machadinha: corpo({
    id: 'machadinha', name: 'Machadinha', damage: '1d6', type: 'cortante',
    rangeFt: 20, longRangeFt: 60,
    props: ['leve', 'arremesso'], art: 'axe',
    categoria: 'simples', peso: 2, custo: 5, fonte: 'srd',
  }),
  azagaia: corpo({
    id: 'azagaia', name: 'Azagaia', damage: '1d6', type: 'perfurante',
    rangeFt: 30, longRangeFt: 120,
    props: ['arremesso'], art: 'staff',
    categoria: 'simples', peso: 2, custo: 0.5, fonte: 'srd',
  }),
  marteloLeve: corpo({
    id: 'marteloLeve', name: 'Martelo leve', damage: '1d4', type: 'concussão',
    rangeFt: 20, longRangeFt: 60,
    props: ['leve', 'arremesso'], art: 'mace',
    categoria: 'simples', peso: 2, custo: 2, fonte: 'srd',
  }),
  maca: corpo({
    id: 'maca', name: 'Maça', damage: '1d6', type: 'concussão',
    props: [], art: 'mace',
    categoria: 'simples', peso: 4, custo: 5, fonte: 'srd',
  }),
  bordao: corpo({
    id: 'bordao', name: 'Bordão', damage: '1d6', type: 'concussão',
    props: ['versátil'], versatil: '1d8', art: 'staff',
    categoria: 'simples', peso: 4, custo: 0.2, fonte: 'srd',
  }),
  foice: corpo({
    id: 'foice', name: 'Foice', damage: '1d4', type: 'cortante',
    props: ['leve'], art: 'gancho',
    categoria: 'simples', peso: 2, custo: 1, fonte: 'srd',
  }),
  lancaCurta: corpo({
    id: 'lancaCurta', name: 'Lança', damage: '1d6', type: 'perfurante',
    rangeFt: 20, longRangeFt: 60,
    props: ['arremesso', 'versátil'], versatil: '1d8', art: 'staff',
    categoria: 'simples', peso: 3, custo: 1, fonte: 'srd',
  }),

  // ------------------------------------------------ simples, distância ----
  bestaLeve: distancia({
    id: 'bestaLeve', name: 'Besta leve', damage: '1d8', type: 'perfurante',
    rangeFt: 80, longRangeFt: 320,
    props: ['munição', 'recarga', 'duas mãos'], art: 'bow',
    categoria: 'simples', peso: 5, custo: 25, fonte: 'srd',
  }),
  dardo: corpo({
    // Dardo é arremesso com acuidade, não arma à distância: Destreza entra
    // por `finesse`, não por `ranged`.
    id: 'dardo', name: 'Dardo', damage: '1d4', type: 'perfurante',
    finesse: true, rangeFt: 20, longRangeFt: 60,
    props: ['acuidade', 'arremesso'], art: 'dagger',
    categoria: 'simples', peso: 0.25, custo: 0.05, fonte: 'srd',
  }),
  arcoCurto: distancia({
    id: 'arcoCurto', name: 'Arco curto', damage: '1d6', type: 'perfurante',
    rangeFt: 80, longRangeFt: 320,
    props: ['munição', 'duas mãos'], art: 'bow',
    categoria: 'simples', peso: 2, custo: 25, fonte: 'srd',
  }),
  funda: distancia({
    id: 'funda', name: 'Funda', damage: '1d4', type: 'concussão',
    rangeFt: 30, longRangeFt: 120,
    props: ['munição'], art: 'bow',
    categoria: 'simples', peso: 0, custo: 0.1, fonte: 'srd',
  }),

  // ---------------------------------------------------- marcial, corpo ----
  machadoDeBatalha: corpo({
    id: 'machadoDeBatalha', name: 'Machado de batalha', damage: '1d8', type: 'cortante',
    props: ['versátil'], versatil: '1d10', art: 'axe',
    categoria: 'marcial', peso: 4, custo: 10, fonte: 'srd',
  }),
  mangual: corpo({
    id: 'mangual', name: 'Mangual', damage: '1d8', type: 'concussão',
    props: [], art: 'mace',
    categoria: 'marcial', peso: 2, custo: 10, fonte: 'srd',
  }),
  glaive: corpo({
    id: 'glaive', name: 'Glaive', damage: '1d10', type: 'cortante',
    reachFt: 10, props: ['pesada', 'alcance', 'duas mãos'], art: 'staff',
    categoria: 'marcial', peso: 6, custo: 20, fonte: 'srd',
  }),
  machadoGrande: corpo({
    id: 'machadoGrande', name: 'Machado grande', damage: '1d12', type: 'cortante',
    props: ['pesada', 'duas mãos'], art: 'axe',
    categoria: 'marcial', peso: 7, custo: 30, fonte: 'srd',
  }),
  espadaGrande: corpo({
    id: 'espadaGrande', name: 'Espada grande', damage: '2d6', type: 'cortante',
    props: ['pesada', 'duas mãos'], art: 'sword',
    categoria: 'marcial', peso: 6, custo: 50, fonte: 'srd',
  }),
  alabarda: corpo({
    id: 'alabarda', name: 'Alabarda', damage: '1d10', type: 'cortante',
    reachFt: 10, props: ['pesada', 'alcance', 'duas mãos'], art: 'axe',
    categoria: 'marcial', peso: 6, custo: 20, fonte: 'srd',
  }),
  lancaMontada: corpo({
    id: 'lancaMontada', name: 'Lança montada', damage: '1d12', type: 'perfurante',
    reachFt: 10, props: ['alcance', 'especial'], art: 'staff',
    categoria: 'marcial', peso: 6, custo: 10, fonte: 'srd',
    nota: 'Desvantagem contra alvo a menos de 1,5 m, e exige as duas mãos fora de montaria.',
  }),
  espadaLonga: corpo({
    id: 'espadaLonga', name: 'Espada longa', damage: '1d8', type: 'cortante',
    props: ['versátil'], versatil: '1d10', art: 'sword',
    categoria: 'marcial', peso: 3, custo: 15, fonte: 'srd',
  }),
  malho: corpo({
    id: 'malho', name: 'Malho', damage: '2d6', type: 'concussão',
    props: ['pesada', 'duas mãos'], art: 'mace',
    categoria: 'marcial', peso: 10, custo: 10, fonte: 'srd',
  }),
  estrelaMatinal: corpo({
    id: 'estrelaMatinal', name: 'Estrela matinal', damage: '1d8', type: 'perfurante',
    props: [], art: 'clava',
    categoria: 'marcial', peso: 4, custo: 15, fonte: 'srd',
  }),
  pique: corpo({
    id: 'pique', name: 'Pique', damage: '1d10', type: 'perfurante',
    reachFt: 10, props: ['pesada', 'alcance', 'duas mãos'], art: 'staff',
    categoria: 'marcial', peso: 18, custo: 5, fonte: 'srd',
  }),
  rapieira: corpo({
    id: 'rapieira', name: 'Rapieira', damage: '1d8', type: 'perfurante',
    finesse: true, props: ['acuidade'], art: 'sword',
    categoria: 'marcial', peso: 2, custo: 25, fonte: 'srd',
  }),
  cimitarra: corpo({
    id: 'cimitarra', name: 'Cimitarra', damage: '1d6', type: 'cortante',
    finesse: true, props: ['acuidade', 'leve'], art: 'sword',
    categoria: 'marcial', peso: 3, custo: 25, fonte: 'srd',
  }),
  espadaCurta: corpo({
    id: 'espadaCurta', name: 'Espada curta', damage: '1d6', type: 'perfurante',
    finesse: true, props: ['acuidade', 'leve'], art: 'sword',
    categoria: 'marcial', peso: 2, custo: 10, fonte: 'srd',
  }),
  tridente: corpo({
    id: 'tridente', name: 'Tridente', damage: '1d6', type: 'perfurante',
    rangeFt: 20, longRangeFt: 60,
    props: ['arremesso', 'versátil'], versatil: '1d8', art: 'staff',
    categoria: 'marcial', peso: 4, custo: 5, fonte: 'srd',
  }),
  picareta: corpo({
    id: 'picareta', name: 'Picareta de guerra', damage: '1d8', type: 'perfurante',
    props: [], art: 'mace',
    categoria: 'marcial', peso: 2, custo: 5, fonte: 'srd',
  }),
  marteloDeGuerra: corpo({
    id: 'marteloDeGuerra', name: 'Martelo de guerra', damage: '1d8', type: 'concussão',
    props: ['versátil'], versatil: '1d10', art: 'mace',
    categoria: 'marcial', peso: 2, custo: 15, fonte: 'srd',
  }),
  chicote: corpo({
    id: 'chicote', name: 'Chicote', damage: '1d4', type: 'cortante',
    finesse: true, reachFt: 10, props: ['acuidade', 'alcance'], art: 'gancho',
    categoria: 'marcial', peso: 3, custo: 2, fonte: 'srd',
  }),

  // ------------------------------------------------ marcial, distância ----
  zarabatana: distancia({
    id: 'zarabatana', name: 'Zarabatana', damage: '1', type: 'perfurante',
    rangeFt: 25, longRangeFt: 100,
    props: ['munição', 'recarga'], art: 'staff',
    categoria: 'marcial', peso: 1, custo: 10, fonte: 'srd',
  }),
  bestaDeMao: distancia({
    id: 'bestaDeMao', name: 'Besta de mão', damage: '1d6', type: 'perfurante',
    rangeFt: 30, longRangeFt: 120,
    props: ['munição', 'leve', 'recarga'], art: 'bow',
    categoria: 'marcial', peso: 3, custo: 75, fonte: 'srd',
  }),
  bestaPesada: distancia({
    id: 'bestaPesada', name: 'Besta pesada', damage: '1d10', type: 'perfurante',
    rangeFt: 100, longRangeFt: 400,
    props: ['munição', 'pesada', 'recarga', 'duas mãos'], art: 'bow',
    categoria: 'marcial', peso: 18, custo: 50, fonte: 'srd',
  }),
  arcoLongo: distancia({
    id: 'arcoLongo', name: 'Arco longo', damage: '1d8', type: 'perfurante',
    rangeFt: 150, longRangeFt: 600,
    props: ['munição', 'pesada', 'duas mãos'], art: 'bow',
    categoria: 'marcial', peso: 2, custo: 50, fonte: 'srd',
  }),
  rede: corpo({
    // `damage: '0'` e não `null`: `parseDice` aceita número, e o motor rola
    // dano de toda arma. A rede prende em vez de ferir, e isso está na nota.
    id: 'rede', name: 'Rede', damage: '0', type: 'nenhum',
    rangeFt: 5, longRangeFt: 15,
    props: ['arremesso', 'especial'], art: null,
    categoria: 'marcial', peso: 3, custo: 1, fonte: 'srd',
    nota: 'Não causa dano: prende uma criatura Grande ou menor até alguém gastar uma ação para soltá-la.',
  }),
};

/** As munições, que não são armas mas vivem com elas. */
export const AMMO = {
  flechas: {
    id: 'flechas', name: 'Flechas', tipo: 'munição', art: 'bow',
    pilha: true, peso: 0.05, custo: 0.05, fonte: 'srd',
    desc: 'Para arco curto e arco longo. Vinte numa aljava.',
  },
  virotes: {
    id: 'virotes', name: 'Virotes', tipo: 'munição', art: 'bow',
    pilha: true, peso: 0.075, custo: 0.05, fonte: 'srd',
    desc: 'Para as bestas. Vinte numa caixa.',
  },
  balasDeFunda: {
    id: 'balasDeFunda', name: 'Balas de funda', tipo: 'munição', art: 'bow',
    pilha: true, peso: 0.075, custo: 0.002, fonte: 'srd',
    desc: 'Chumbo fundido, para funda.',
  },
  agulhas: {
    id: 'agulhas', name: 'Agulhas de zarabatana', tipo: 'munição', art: 'bow',
    pilha: true, peso: 0.02, custo: 0.02, fonte: 'srd',
    desc: 'Cinquenta num estojo. Para zarabatana.',
  },
};
