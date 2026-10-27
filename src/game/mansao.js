// O ESCONDERIJO DOS MARCARRUBRA (Parte 2): os porões da Mansão Tresendar.
//
// Gerado por `src/dev/mapa-mansao.py` — mude lá e rode de novo.
//
// Áreas do livro: 1 porão com a cisterna (entrada pela escada da cozinha, a
// leste) · 2 alojamento · 3 corredor do fosso · 4 criptas · 5 jaulas ·
// 6 depósito de armas (trancado) · 7 depósito · 8 caverna da fenda (entrada
// pelo túnel do Carp, ao sul) · 9 alojamento dos bugbears · 10 sala de estar ·
// 11 oficina do mago · 12 quarto do Cajavidro.
//
// Glifos: R parede · _ chão · W cisterna · = ponte · x fundo da fenda ·
// A coluna · s barris e estantes · z beliche · K baú · m mesa · Q sarcófago ·
// G grade · ! porta de madeira · M parede de pedra lavrada. Alturas em dígitos (um nível = 1,5 m). Luz: 2 claro, 1 penumbra,
// 0 breu.

export const MAPA_MANSAO = {
  "luzes": [
    {
      "pos": {
        "x": 5,
        "y": 2
      },
      "claro": 20,
      "penumbra": 20,
      "tipo": "fogueira"
    },
    {
      "pos": {
        "x": 5,
        "y": 9
      },
      "claro": 20,
      "penumbra": 20,
      "tipo": "fogueira"
    },
    {
      "pos": {
        "x": 4,
        "y": 16
      },
      "claro": 20,
      "penumbra": 20,
      "tipo": "fogueira"
    },
    {
      "pos": {
        "x": 18,
        "y": 13
      },
      "claro": 20,
      "penumbra": 20,
      "tipo": "fogueira"
    },
    {
      "pos": {
        "x": 8,
        "y": 2
      },
      "claro": 15,
      "penumbra": 15,
      "tipo": "tocha"
    },
    {
      "pos": {
        "x": 23,
        "y": 5
      },
      "claro": 15,
      "penumbra": 15,
      "tipo": "tocha"
    }
  ],
  "terreno": [
    "RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR",
    "RMMMMMMMMMMMMMMMMMMMMMMMMRRRRRR",
    "RM^LLeM^mLML^^LML!LgMpLpMRRRRRR",
    "RM^^LLLLLLMMLLLMLMLgMGGGMRRRRRR",
    "RM^^L^MKLzMMLLsMLMMMMLLLMRRRRRR",
    "RMMMLMMMMMMxx__MLLLLLLLsMRRRRRR",
    "RRRMLLLL___xx__MQLLQMGGGMRRRRRR",
    "RMMMMMLM__xxx__MLLLLMpLpMRRRRRR",
    "RMLmmLLM__===__MLLLLMMMMMMMMMMR",
    "RMLLLeLM___xxA_MQL&^ML^LLL^LLMR",
    "RMsLssLM___xx__MLLLLLLLLLLLLLMR",
    "RM^LLLLM__xx___MMMMMMMLLLLMLMMR",
    "RMMLMMMM__xx___MzLzLMsssssLLMMR",
    "RRMLLLL__Axxx__MLLeL!LLLLLLLLMR",
    "RMMLMMMM__===__MLLLsMVVVLLLMLMM",
    "RMzLLzLM___xx__MssssMVVVLLLMLLM",
    "RMLLeLLM___xx__MMMMMMVVVLLLMLMM",
    "RMzLLzLMR__xx_______MLLLLLLLLMR",
    "RMLLLLLMRR__xx_RRRRRML^^LLLLMMR",
    "RMMMMMMMRR__RRRRRRRRMMMMMMMMMRR",
    "RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR"
  ],
  "altura": [
    "5555555555555555555555555555555",
    "5444444444455555555555555555555",
    "5433334333434445454454445555555",
    "5433333333454445454454445555555",
    "5433334333454445455554445555555",
    "5444344555500445444444445555555",
    "5554333344400445444454445555555",
    "5444443544000445444454445555555",
    "5433333544444445444455555555555",
    "5433333544400445444454444444455",
    "5433333544400445444444444444455",
    "5433333544004445555555444454555",
    "5443445544004445444454444444775",
    "5543333444000445444454444445675",
    "5443445544444445444453334447677",
    "5433333544400445444453334447667",
    "5433333544400445555553334447677",
    "5433333554400444444454444445675",
    "5433333455440045555554444444775",
    "5444444455445555555555555555555",
    "5555555555555555555555555555555"
  ],
  "luz": [
    "0000000000000000000000000000000",
    "0022220222011110101102220000000",
    "0222222222211111111122222000000",
    "0222222222211111111122222000000",
    "0222222222211112221122222000000",
    "0022221222000001111112222000000",
    "0001111100000001111122222000000",
    "0022222200000001111122222000000",
    "0222222200000001111112220000000",
    "0222222200000001111110000000000",
    "0222222200000001111110000000000",
    "0222222200000000222212000021100",
    "0022222000000002222222222222200",
    "0011111000000002222222222222220",
    "0022222000000002222222222222220",
    "0222222200000002222222222222222",
    "0222222200000000222222222222220",
    "0222222200000000000022222222220",
    "0222222200000000000022222222200",
    "0022222000000000000002222222000",
    "0000000000000000000000000000000"
  ]
};

export const MANSAO = {
  "salas": {
    "oficina": [
      {
        "x": 2,
        "y": 2
      },
      {
        "x": 3,
        "y": 2
      },
      {
        "x": 4,
        "y": 2
      },
      {
        "x": 5,
        "y": 2
      },
      {
        "x": 2,
        "y": 3
      },
      {
        "x": 3,
        "y": 3
      },
      {
        "x": 4,
        "y": 3
      },
      {
        "x": 5,
        "y": 3
      },
      {
        "x": 2,
        "y": 4
      },
      {
        "x": 3,
        "y": 4
      },
      {
        "x": 4,
        "y": 4
      },
      {
        "x": 5,
        "y": 4
      }
    ],
    "quartoMago": [
      {
        "x": 7,
        "y": 2
      },
      {
        "x": 8,
        "y": 2
      },
      {
        "x": 9,
        "y": 2
      },
      {
        "x": 7,
        "y": 3
      },
      {
        "x": 8,
        "y": 3
      },
      {
        "x": 9,
        "y": 3
      },
      {
        "x": 7,
        "y": 4
      },
      {
        "x": 8,
        "y": 4
      },
      {
        "x": 9,
        "y": 4
      }
    ],
    "deposito": [
      {
        "x": 12,
        "y": 2
      },
      {
        "x": 13,
        "y": 2
      },
      {
        "x": 14,
        "y": 2
      },
      {
        "x": 12,
        "y": 3
      },
      {
        "x": 13,
        "y": 3
      },
      {
        "x": 14,
        "y": 3
      },
      {
        "x": 12,
        "y": 4
      },
      {
        "x": 13,
        "y": 4
      },
      {
        "x": 14,
        "y": 4
      }
    ],
    "armas": [
      {
        "x": 18,
        "y": 2
      },
      {
        "x": 19,
        "y": 2
      },
      {
        "x": 18,
        "y": 3
      },
      {
        "x": 19,
        "y": 3
      }
    ],
    "jaulas": [
      {
        "x": 21,
        "y": 2
      },
      {
        "x": 22,
        "y": 2
      },
      {
        "x": 23,
        "y": 2
      },
      {
        "x": 21,
        "y": 4
      },
      {
        "x": 22,
        "y": 4
      },
      {
        "x": 23,
        "y": 4
      },
      {
        "x": 21,
        "y": 5
      },
      {
        "x": 22,
        "y": 5
      },
      {
        "x": 23,
        "y": 5
      },
      {
        "x": 21,
        "y": 7
      },
      {
        "x": 22,
        "y": 7
      },
      {
        "x": 23,
        "y": 7
      }
    ],
    "cripta": [
      {
        "x": 16,
        "y": 5
      },
      {
        "x": 17,
        "y": 5
      },
      {
        "x": 18,
        "y": 5
      },
      {
        "x": 19,
        "y": 5
      },
      {
        "x": 16,
        "y": 6
      },
      {
        "x": 17,
        "y": 6
      },
      {
        "x": 18,
        "y": 6
      },
      {
        "x": 19,
        "y": 6
      },
      {
        "x": 16,
        "y": 7
      },
      {
        "x": 17,
        "y": 7
      },
      {
        "x": 18,
        "y": 7
      },
      {
        "x": 19,
        "y": 7
      },
      {
        "x": 16,
        "y": 8
      },
      {
        "x": 17,
        "y": 8
      },
      {
        "x": 18,
        "y": 8
      },
      {
        "x": 19,
        "y": 8
      },
      {
        "x": 16,
        "y": 9
      },
      {
        "x": 17,
        "y": 9
      },
      {
        "x": 18,
        "y": 9
      },
      {
        "x": 19,
        "y": 9
      },
      {
        "x": 16,
        "y": 10
      },
      {
        "x": 17,
        "y": 10
      },
      {
        "x": 18,
        "y": 10
      },
      {
        "x": 19,
        "y": 10
      }
    ],
    "estarRubro": [
      {
        "x": 2,
        "y": 8
      },
      {
        "x": 3,
        "y": 8
      },
      {
        "x": 4,
        "y": 8
      },
      {
        "x": 5,
        "y": 8
      },
      {
        "x": 6,
        "y": 8
      },
      {
        "x": 2,
        "y": 9
      },
      {
        "x": 3,
        "y": 9
      },
      {
        "x": 4,
        "y": 9
      },
      {
        "x": 5,
        "y": 9
      },
      {
        "x": 6,
        "y": 9
      },
      {
        "x": 2,
        "y": 10
      },
      {
        "x": 3,
        "y": 10
      },
      {
        "x": 4,
        "y": 10
      },
      {
        "x": 5,
        "y": 10
      },
      {
        "x": 6,
        "y": 10
      },
      {
        "x": 2,
        "y": 11
      },
      {
        "x": 3,
        "y": 11
      },
      {
        "x": 4,
        "y": 11
      },
      {
        "x": 5,
        "y": 11
      },
      {
        "x": 6,
        "y": 11
      }
    ],
    "guardasBugbear": [
      {
        "x": 2,
        "y": 15
      },
      {
        "x": 3,
        "y": 15
      },
      {
        "x": 4,
        "y": 15
      },
      {
        "x": 5,
        "y": 15
      },
      {
        "x": 6,
        "y": 15
      },
      {
        "x": 2,
        "y": 16
      },
      {
        "x": 3,
        "y": 16
      },
      {
        "x": 4,
        "y": 16
      },
      {
        "x": 5,
        "y": 16
      },
      {
        "x": 6,
        "y": 16
      },
      {
        "x": 2,
        "y": 17
      },
      {
        "x": 3,
        "y": 17
      },
      {
        "x": 4,
        "y": 17
      },
      {
        "x": 5,
        "y": 17
      },
      {
        "x": 6,
        "y": 17
      },
      {
        "x": 2,
        "y": 18
      },
      {
        "x": 3,
        "y": 18
      },
      {
        "x": 4,
        "y": 18
      },
      {
        "x": 5,
        "y": 18
      },
      {
        "x": 6,
        "y": 18
      }
    ],
    "alojamentoRubro": [
      {
        "x": 16,
        "y": 12
      },
      {
        "x": 17,
        "y": 12
      },
      {
        "x": 18,
        "y": 12
      },
      {
        "x": 19,
        "y": 12
      },
      {
        "x": 16,
        "y": 13
      },
      {
        "x": 17,
        "y": 13
      },
      {
        "x": 18,
        "y": 13
      },
      {
        "x": 19,
        "y": 13
      },
      {
        "x": 16,
        "y": 14
      },
      {
        "x": 17,
        "y": 14
      },
      {
        "x": 18,
        "y": 14
      },
      {
        "x": 19,
        "y": 14
      },
      {
        "x": 16,
        "y": 15
      },
      {
        "x": 17,
        "y": 15
      },
      {
        "x": 18,
        "y": 15
      },
      {
        "x": 19,
        "y": 15
      }
    ],
    "corredorFosso": [
      {
        "x": 21,
        "y": 9
      },
      {
        "x": 22,
        "y": 9
      },
      {
        "x": 23,
        "y": 9
      },
      {
        "x": 24,
        "y": 9
      },
      {
        "x": 25,
        "y": 9
      },
      {
        "x": 26,
        "y": 9
      },
      {
        "x": 27,
        "y": 9
      },
      {
        "x": 28,
        "y": 9
      },
      {
        "x": 21,
        "y": 10
      },
      {
        "x": 22,
        "y": 10
      },
      {
        "x": 23,
        "y": 10
      },
      {
        "x": 24,
        "y": 10
      },
      {
        "x": 25,
        "y": 10
      },
      {
        "x": 26,
        "y": 10
      },
      {
        "x": 27,
        "y": 10
      },
      {
        "x": 28,
        "y": 10
      }
    ],
    "poraoCisterna": [
      {
        "x": 21,
        "y": 12
      },
      {
        "x": 22,
        "y": 12
      },
      {
        "x": 23,
        "y": 12
      },
      {
        "x": 24,
        "y": 12
      },
      {
        "x": 25,
        "y": 12
      },
      {
        "x": 26,
        "y": 12
      },
      {
        "x": 27,
        "y": 12
      },
      {
        "x": 21,
        "y": 13
      },
      {
        "x": 22,
        "y": 13
      },
      {
        "x": 23,
        "y": 13
      },
      {
        "x": 24,
        "y": 13
      },
      {
        "x": 25,
        "y": 13
      },
      {
        "x": 26,
        "y": 13
      },
      {
        "x": 27,
        "y": 13
      },
      {
        "x": 21,
        "y": 14
      },
      {
        "x": 22,
        "y": 14
      },
      {
        "x": 23,
        "y": 14
      },
      {
        "x": 24,
        "y": 14
      },
      {
        "x": 25,
        "y": 14
      },
      {
        "x": 26,
        "y": 14
      },
      {
        "x": 27,
        "y": 14
      },
      {
        "x": 21,
        "y": 15
      },
      {
        "x": 22,
        "y": 15
      },
      {
        "x": 23,
        "y": 15
      },
      {
        "x": 24,
        "y": 15
      },
      {
        "x": 25,
        "y": 15
      },
      {
        "x": 26,
        "y": 15
      },
      {
        "x": 27,
        "y": 15
      },
      {
        "x": 21,
        "y": 16
      },
      {
        "x": 22,
        "y": 16
      },
      {
        "x": 23,
        "y": 16
      },
      {
        "x": 24,
        "y": 16
      },
      {
        "x": 25,
        "y": 16
      },
      {
        "x": 26,
        "y": 16
      },
      {
        "x": 27,
        "y": 16
      },
      {
        "x": 21,
        "y": 17
      },
      {
        "x": 22,
        "y": 17
      },
      {
        "x": 23,
        "y": 17
      },
      {
        "x": 24,
        "y": 17
      },
      {
        "x": 25,
        "y": 17
      },
      {
        "x": 26,
        "y": 17
      },
      {
        "x": 27,
        "y": 17
      },
      {
        "x": 21,
        "y": 18
      },
      {
        "x": 22,
        "y": 18
      },
      {
        "x": 23,
        "y": 18
      },
      {
        "x": 24,
        "y": 18
      },
      {
        "x": 25,
        "y": 18
      },
      {
        "x": 26,
        "y": 18
      },
      {
        "x": 27,
        "y": 18
      }
    ]
  },
  "secretas": {
    "quarto": {
      "x": 10,
      "y": 2,
      "h": 3
    },
    "passagem": {
      "x": 11,
      "y": 3,
      "h": 4
    },
    "deposito": {
      "x": 15,
      "y": 2,
      "h": 4
    },
    "cisterna": {
      "x": 20,
      "y": 17,
      "h": 4
    }
  },
  "trancada": {
    "x": 17,
    "y": 2,
    "h": 4
  },
  "portas": {
    "alojamento": {
      "x": 20,
      "y": 13,
      "h": 4
    }
  },
  "pontes": {
    "norte": 8,
    "sul": 14
  },
  "fenda": {
    "5": [
      11,
      12
    ],
    "6": [
      11,
      12
    ],
    "7": [
      10,
      12
    ],
    "8": [
      10,
      12
    ],
    "9": [
      11,
      12
    ],
    "10": [
      11,
      12
    ],
    "11": [
      10,
      11
    ],
    "12": [
      10,
      11
    ],
    "13": [
      10,
      12
    ],
    "14": [
      10,
      12
    ],
    "15": [
      11,
      12
    ],
    "16": [
      11,
      12
    ],
    "17": [
      11,
      12
    ],
    "18": [
      12,
      13
    ]
  },
  "fosso": [
    {
      "x": 23,
      "y": 9
    },
    {
      "x": 24,
      "y": 9
    },
    {
      "x": 23,
      "y": 10
    },
    {
      "x": 24,
      "y": 10
    }
  ],
  "jaulas": {
    "norte": {
      "x": 22,
      "y": 3
    },
    "sul": {
      "x": 22,
      "y": 6
    }
  },
  "entradas": {
    "cozinha": {
      "x": 29,
      "y": 15
    },
    "tunel": {
      "x": 10,
      "y": 19
    }
  },
  "props": [
    {
      "tipo": "prop",
      "x": 2,
      "y": 2,
      "variante": "estante"
    },
    {
      "tipo": "prop",
      "x": 2,
      "y": 4,
      "variante": "estante"
    },
    {
      "tipo": "prop",
      "x": 2,
      "y": 3,
      "variante": "prateleira"
    },
    {
      "tipo": "prop",
      "x": 3,
      "y": 3,
      "variante": "mesaFerramentas"
    },
    {
      "tipo": "prop",
      "x": 3,
      "y": 4,
      "variante": "tina"
    },
    {
      "tipo": "prop",
      "x": 5,
      "y": 4,
      "variante": "saco"
    },
    {
      "tipo": "prop",
      "x": 7,
      "y": 2,
      "variante": "estante"
    },
    {
      "tipo": "prop",
      "x": 12,
      "y": 2,
      "variante": "ferramentas"
    },
    {
      "tipo": "prop",
      "x": 13,
      "y": 2,
      "variante": "tabuas"
    },
    {
      "tipo": "prop",
      "x": 19,
      "y": 9,
      "variante": "pilarQuebrado"
    },
    {
      "tipo": "prop",
      "x": 18,
      "y": 9,
      "variante": "ossos"
    },
    {
      "tipo": "prop",
      "x": 22,
      "y": 9,
      "variante": "pilarQuebrado"
    },
    {
      "tipo": "prop",
      "x": 26,
      "y": 9,
      "variante": "pilarQuebrado"
    },
    {
      "tipo": "prop",
      "x": 2,
      "y": 11,
      "variante": "cubaCerveja"
    },
    {
      "tipo": "prop",
      "x": 22,
      "y": 18,
      "variante": "cubaCerveja"
    },
    {
      "tipo": "prop",
      "x": 23,
      "y": 18,
      "variante": "barrisRack"
    }
  ],
  "decor": [
    {
      "x": 4,
      "y": 1,
      "tipo": "tochaAcesa"
    },
    {
      "x": 8,
      "y": 1,
      "tipo": "tochaAcesa"
    },
    {
      "x": 13,
      "y": 1,
      "tipo": "tochaAcesa"
    },
    {
      "x": 18,
      "y": 1,
      "tipo": "tochaAcesa"
    },
    {
      "x": 18,
      "y": 4,
      "tipo": "tochaAcesa"
    },
    {
      "x": 15,
      "y": 7,
      "tipo": "tochaAcesa"
    },
    {
      "x": 22,
      "y": 1,
      "tipo": "tochaAcesa"
    },
    {
      "x": 20,
      "y": 4,
      "tipo": "tochaAcesa"
    },
    {
      "x": 4,
      "y": 7,
      "tipo": "tochaAcesa"
    },
    {
      "x": 1,
      "y": 9,
      "tipo": "tochaAcesa"
    },
    {
      "x": 5,
      "y": 14,
      "tipo": "tochaAcesa"
    },
    {
      "x": 1,
      "y": 16,
      "tipo": "tochaAcesa"
    },
    {
      "x": 17,
      "y": 11,
      "tipo": "tochaAcesa"
    },
    {
      "x": 15,
      "y": 13,
      "tipo": "tochaAcesa"
    },
    {
      "x": 21,
      "y": 11,
      "tipo": "tochaAcesa"
    },
    {
      "x": 20,
      "y": 15,
      "tipo": "tochaAcesa"
    }
  ],
  "degraus": [
    {
      "x": 27,
      "y": 13,
      "eixo": "x"
    },
    {
      "x": 27,
      "y": 17,
      "eixo": "x"
    },
    {
      "x": 7,
      "y": 6,
      "eixo": "x"
    },
    {
      "x": 7,
      "y": 13,
      "eixo": "x"
    },
    {
      "x": 11,
      "y": 3,
      "eixo": "y"
    }
  ]
};
