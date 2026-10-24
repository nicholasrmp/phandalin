// SRD 5.1 (CC-BY-4.0) — ver NOTICE.md
// Bardo, do 1º ao 20º, com o colégio do SRD (Conhecimento).

import { abilityMod, SKILLS } from '../abilities.js';

export default {
  id: 'bardo',
  nome: 'Bardo',
  dadoDeVida: 8,
  resistencias: ['dex', 'cha'],
  armaduras: ['leve'],
  armas: ['simples', 'bestaDeMao', 'espadaLonga', 'rapieira', 'espadaCurta'],
  // Três perícias quaisquer.
  pericias: { quantas: 3, de: null },
  atributosPrincipais: ['cha', 'dex'],
  conjuracao: {
    tipo: 'plena',
    atributo: 'cha',
    prepara: 'conhecidas',
    truques: { 1: 2, 4: 3, 10: 4 },
    conhecidas: [null, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 15, 16, 18, 19, 19, 20, 22, 22, 22],
  },
  niveis: {
    1: ['spellcasting', 'bardicInspiration'],
    2: ['jackOfAllTrades', 'songOfRest'],
    3: ['bardCollege', 'expertise'],
    4: ['asi'],
    5: ['fontOfInspiration'],
    6: ['countercharm'],
    8: ['asi'],
    10: ['expertise', 'magicalSecrets'],
    12: ['asi'],
    14: ['magicalSecrets'],
    16: ['asi'],
    18: ['magicalSecrets'],
    19: ['asi'],
    20: ['superiorInspiration'],
  },
  escalas: {
    dadoDeInspiracao: (n) => (n >= 15 ? 'd12' : n >= 10 ? 'd10' : n >= 5 ? 'd8' : 'd6'),
    dadoDaCancaoDeDescanso: (n) => (n >= 17 ? 'd12' : n >= 13 ? 'd10' : n >= 9 ? 'd8' : n >= 2 ? 'd6' : null),
    // Segredos Mágicos: magias de qualquer lista aprendidas até agora.
    segredosMagicos: (n) => (n >= 18 ? 6 : n >= 14 ? 4 : n >= 10 ? 2 : 0),
  },
  recursos: {
    // Inspirações = modificador de CAR, mínimo 1.
    bardicInspiration: (n, c) => Math.max(1, abilityMod(c.abilities.cha)),
  },
  subclasse: {
    nivel: 3,
    nome: 'Colégio de Bardo',
    opcoes: {
      conhecimento: {
        nome: 'Colégio do Conhecimento',
        fonte: 'srd',
        niveis: {
          3: ['bonusProficiencies', 'cuttingWords'],
          6: ['additionalMagicalSecrets'],
          14: ['peerlessSkill'],
        },
        // Segredos Mágicos Adicionais: duas magias a mais, fora do limite.
        magiasExtra: { 6: 2 },
        // Proficiências Adicionais: três perícias à escolha.
        escolhasDeGanho: {
          bonusProficiencies: {
            campo: 'skills', lista: true, quantas: 3,
            opcoes: (c) => Object.keys(SKILLS).filter((s) => !c.skills.includes(s)),
          },
        },
      },
    },
  },
};
