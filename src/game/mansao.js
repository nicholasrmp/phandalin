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
// A coluna · s barris e estantes · z beliche · K baú · o mesa/sarcófago ·
// P grade. Alturas em dígitos (um nível = 1,5 m). Luz: 2 claro, 1 penumbra,
// 0 breu.

export const MAPA_MANSAO = {
  "terreno": [
    "RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR",
    "RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR",
    "RRs___R_o_R_ss_R_R_sR___RRRRRRR",
    "RRso___K_zR____R_R_sRPPPRRRRRRR",
    "RRso__RRRRRR__sR_RRRR___RRRRRRR",
    "RR____R________R_______sRRRRRRR",
    "RRRR_______xx__Ro__oRPPPRRRRRRR",
    "RR____sR__xxx__R____R___RRRRRRR",
    "RR_oo__R__===__R____RRRRRRRRRRR",
    "RR_____R___xxA_Ro___R________RR",
    "RR_____R___xx__R_____________RR",
    "RR___ssR__xx___RRRRRRRRRRRR_RRR",
    "RRR_RRR___xx___Rz_z_Rsss____RRR",
    "RRR______Axxx__R_____________RR",
    "RRR_RRRR__===__R___sRWWW___R_RR",
    "RRz___zR___xx__Rsss_RWWW___R__R",
    "RR_____R___xx__RRRRRRWWW___R_RR",
    "RR_____RR__xx_______R________RR",
    "RRz___zRRR_____RRRRRR_ss____RRR",
    "RRRRRRRRRRRR__RRRRRRRRRRRRRRRRR",
    "RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR"
  ],
  "altura": [
    "5555555555555555555555555555555",
    "5444444444455555555555555555555",
    "5433334333534445454454445555555",
    "5433333333544445454454445555555",
    "5433335555554445455554445555555",
    "5433335444444445444444445555555",
    "5444333344400445444454445555555",
    "5433333544000445444454445555555",
    "5433333544444445444455555555555",
    "5433333544400445444454444444455",
    "5433333544400445444444444444455",
    "5433333544004445555555555554555",
    "5443445444004445444454444444775",
    "5543333444000445444444444445675",
    "5443445544444445444454444447677",
    "5433333544400445444454444447667",
    "5433333544400445555554444447677",
    "5433333554400444444454444445675",
    "5433333455444445555554444444775",
    "5444444455554455555555555555555",
    "5555555555555555555555555555555"
  ],
  "luz": [
    "0000000000000000000000000000000",
    "0000000000000000000000000000000",
    "0022220222011110101102220000000",
    "0022222222011110101102220000000",
    "0022220000001110200002220000000",
    "0022220111000000111112220000000",
    "0000211100000000111102220000000",
    "0022222000000000111102220000000",
    "0022222000000000111100000000000",
    "0022222000000000111100000000000",
    "0022222000000000111110000000000",
    "0022222000000000000000000001000",
    "0002000000000000222202222222000",
    "0001111000000000222222222222200",
    "0002000000000000222202222222200",
    "0022222000000000222202222222220",
    "0022222000000000000002222222200",
    "0022222000000000000002222222200",
    "0022222000000000000002222222000",
    "0000000000000000000000000000000",
    "0000000000000000000000000000000"
  ]
};

export const MANSAO = {
  "secretas": {
    "quarto": {
      "x": 10,
      "y": 2,
      "h": 3
    },
    "passagem": {
      "x": 11,
      "y": 4,
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
  "pontes": {
    "norte": 8,
    "sul": 14
  },
  "fenda": {
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
      "x": 12,
      "y": 19
    }
  }
};
