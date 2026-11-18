// GERADO por `src/dev/importar-bestiario.mjs ftd` — não edite à mão; mude o conversor ou o texto em
  // `src/dev/bestiario/ftd-pt.json` e rode de novo. Os números são os do livro (FTD, via o espelho do 5etools);
  // o texto é nosso, em pt-br. O que o motor ainda não faz está em `src/dev/bestiario/ftd-pendente.json`.
  
export const LIVRO_FTD = {
 "dragaoDeAmetistaAdulto": {
  "id": "dragaoDeAmetistaAdulto",
  "tipo": "dragão",
  "name": "Dragão de Ametista Adulto",
  "nomeOriginal": "Adult Amethyst Dragon",
  "fonte": "FTD",
  "size": "enorme",
  "level": 13,
  "cr": "16",
  "xp": 15000,
  "abilities": {
   "str": 25,
   "dex": 14,
   "con": 25,
   "int": 20,
   "wis": 17,
   "cha": 21
  },
  "ac": 19,
  "acNote": "armadura natural",
  "maxHp": 229,
  "hpDice": "17d12+119",
  "speedFt": 40,
  "flyFt": 80,
  "hover": true,
  "speeds": {
   "flyFt": 80,
   "swimFt": 40
  },
  "senses": {
   "passivePerception": 23,
   "blindsightFt": 60,
   "darkvisionFt": 120
  },
  "saves": [
   "dex",
   "con",
   "wis",
   "cha"
  ],
  "skills": [
   "arcanismo",
   "percepcao",
   "persuasao",
   "furtividade"
  ],
  "expertise": [
   "arcanismo",
   "percepcao"
  ],
  "damageResistances": [
   "energético",
   "psíquico"
  ],
  "conditionImmunities": [
   "amedrontado",
   "caido"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 12,
    "damage": "2d10+7",
    "type": "perfurante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "2d8",
     "type": "energético"
    }
   },
   {
    "name": "Garra",
    "bonus": 12,
    "damage": "1d8+7",
    "type": "cortante",
    "reachFt": 10
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida",
    "Garra",
    "Garra"
   ]
  },
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "piscar",
    "dissiparMagia",
    "protecaoBemMal",
    "enviarMensagem"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "piscar": 1,
    "dissiparMagia": 1,
    "protecaoBemMal": 1,
    "enviarMensagem": 1
   },
   "cdPorMagia": {
    "piscar": 18,
    "dissiparMagia": 18,
    "protecaoBemMal": 18,
    "enviarMensagem": 18
   }
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "acoesEspeciais": [
   {
    "nome": "Sopro de Singularidade",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 90,
    "save": "str",
    "dc": 20,
    "damage": "10d8",
    "damageType": "energético",
    "halfOnSave": true
   },
   {
    "nome": "Passo Psíquico",
    "tipo": "teleporte",
    "alcanceFt": 60,
    "bonus": true
   }
  ],
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Garra",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Garra"
    },
    {
     "nome": "Psiônica",
     "custo": 2,
     "tipo": "magia"
    },
    {
     "nome": "Cristal Explosivo",
     "custo": 3,
     "tipo": "area",
     "raioFt": 60,
     "save": "dex",
     "dc": 20,
     "damage": "3d8",
     "damageType": "energético",
     "halfOnSave": false,
     "condition": "caido",
     "rounds": 10,
     "repete": false
    }
   ]
  },
  "traits": [
   "t_mudarDeForma",
   "acoesLendarias"
  ],
  "marcas": [
   "gem"
  ],
  "blurb": "Dragão psiônico que se teletransporta pelo campo de batalha e dispara um sopro de gravidade em cone capaz de prender os inimigos no lugar. Mordida e cristais explosivos causam dano energético e derrubam grupos inteiros.",
  "lore": "Os dragões de ametista são os mais sábios e reservados entre os dragões de gema, dedicados ao estudo da magia e dos mistérios da mente. Costumam erguer covis em cavernas submersas ou lagos isolados, onde guardam cristais e conhecimento. Em geral são neutros e preferem a diplomacia e a observação a conflitos abertos. Quando ameaçados, porém, usam poderes psiônicos com precisão fria e calculada."
 },
 "dragaoDeCristalAdulto": {
  "id": "dragaoDeCristalAdulto",
  "tipo": "dragão",
  "name": "Dragão de Cristal Adulto",
  "nomeOriginal": "Adult Crystal Dragon",
  "fonte": "FTD",
  "size": "enorme",
  "level": 9,
  "cr": "12",
  "xp": 8400,
  "abilities": {
   "str": 21,
   "dex": 12,
   "con": 21,
   "int": 18,
   "wis": 15,
   "cha": 19
  },
  "ac": 16,
  "acNote": "armadura natural",
  "maxHp": 172,
  "hpDice": "15d12+75",
  "speedFt": 40,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80,
   "climbFt": 40,
   "burrowFt": 40
  },
  "senses": {
   "passivePerception": 20,
   "blindsightFt": 60,
   "darkvisionFt": 120
  },
  "saves": [
   "dex",
   "con",
   "wis",
   "cha"
  ],
  "skills": [
   "percepcao",
   "furtividade",
   "sobrevivencia"
  ],
  "expertise": [
   "percepcao",
   "furtividade"
  ],
  "damageResistances": [
   "frio",
   "radiante"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 9,
    "damage": "2d10+5",
    "type": "perfurante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "1d8",
     "type": "radiante"
    }
   },
   {
    "name": "Garra",
    "bonus": 9,
    "damage": "1d8+5",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida",
    "Garra",
    "Garra"
   ]
  },
  "breath": {
   "name": "Sopro Cintilante",
   "kind": "save",
   "shape": "cone",
   "areaFt": 60,
   "save": "con",
   "dc": 17,
   "damage": "9d8",
   "damageType": "radiante",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    5,
    6
   ]
  },
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "comando",
    "adivinhacao",
    "padraoHipnotico",
    "restauracaoMenor",
    "luzesDancantes",
    "orientacao"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "comando": 1,
    "adivinhacao": 1,
    "padraoHipnotico": 1,
    "restauracaoMenor": 1
   },
   "aVontade": [
    "luzesDancantes",
    "orientacao"
   ],
   "cdPorMagia": {
    "comando": 16,
    "adivinhacao": 16,
    "padraoHipnotico": 16,
    "restauracaoMenor": 16,
    "luzesDancantes": 16,
    "orientacao": 16
   }
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "acoesEspeciais": [
   {
    "nome": "Passo Psíquico",
    "tipo": "teleporte",
    "alcanceFt": 60,
    "bonus": true
   }
  ],
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Garra",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Garra"
    },
    {
     "nome": "Psiônica",
     "custo": 2,
     "tipo": "magia"
    },
    {
     "nome": "Golpe de Luz Estelar",
     "custo": 3,
     "tipo": "alvo",
     "alcanceFt": 60,
     "save": "dex",
     "dc": 17,
     "damage": "9d6",
     "damageType": "radiante",
     "halfOnSave": false
    }
   ]
  },
  "traits": [
   "t_mudarDeForma",
   "acoesLendarias"
  ],
  "marcas": [
   "gem"
  ],
  "blurb": "Combina mordida e garras com um sopro de radiância cintilante que o protege com PV temporários, e se teleporta pelo campo usando psiônica. Seus raios de luz estelar atingem alvos a até 18 m.",
  "lore": "Dragões de cristal são dragões de gema ligados ao brilho das estrelas e às energias da mente. Costumam fazer seus covis em cavernas geladas ou picos cheios de cristais, onde a luz se refrata em mil cores. São curiosos e brincalhões, gostam de conversar telepaticamente e de observar os céus noturnos. Apesar disso, defendem seu território com astúcia, alternando entre teleportes e explosões de luz."
 },
 "dragaoDasProfundezasAdulto": {
  "id": "dragaoDasProfundezasAdulto",
  "tipo": "dragão",
  "name": "Dragão das Profundezas Adulto",
  "nomeOriginal": "Adult Deep Dragon",
  "fonte": "FTD",
  "size": "enorme",
  "level": 9,
  "cr": "11",
  "xp": 7200,
  "abilities": {
   "str": 20,
   "dex": 14,
   "con": 18,
   "int": 16,
   "wis": 16,
   "cha": 18
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 147,
  "hpDice": "14d12+56",
  "speedFt": 40,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80,
   "swimFt": 40,
   "burrowFt": 30
  },
  "senses": {
   "passivePerception": 17,
   "blindsightFt": 60,
   "darkvisionFt": 150
  },
  "saves": [
   "dex",
   "con",
   "wis",
   "cha"
  ],
  "skills": [
   "percepcao",
   "persuasao",
   "furtividade"
  ],
  "expertise": [
   "persuasao",
   "furtividade"
  ],
  "damageResistances": [
   "veneno",
   "psíquico"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "amedrontado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 9,
    "damage": "2d10+5",
    "type": "perfurante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "1d10",
     "type": "veneno"
    }
   },
   {
    "name": "Garra",
    "bonus": 9,
    "damage": "1d6+5",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Cauda",
    "bonus": 9,
    "damage": "1d8+5",
    "type": "concussão",
    "reachFt": 15,
    "onHit": {
     "save": "str",
     "dc": 17,
     "condition": "caido",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida",
    "Garra",
    "Garra"
   ]
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "acoesEspeciais": [
   {
    "nome": "Sopro de Pesadelo",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 60,
    "save": "wis",
    "dc": 16,
    "damage": "6d10",
    "damageType": "psíquico",
    "halfOnSave": true,
    "condition": "amedrontado",
    "rounds": 10,
    "repete": true
   }
  ],
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Esporos de Comando",
     "custo": 1,
     "tipo": "alvo",
     "alcanceFt": 30,
     "save": "wis",
     "dc": 16,
     "damage": "1d10",
     "damageType": "psíquico",
     "halfOnSave": false
    },
    {
     "nome": "Cauda",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Cauda"
    },
    {
     "nome": "Rajada de Esporos",
     "custo": 2,
     "tipo": "alvo",
     "alcanceFt": 30,
     "save": "con",
     "dc": 16,
     "damage": "5d6",
     "damageType": "veneno",
     "halfOnSave": false,
     "condition": "envenenado",
     "rounds": 10,
     "repete": true
    }
   ]
  },
  "traits": [
   "t_mudarDeForma",
   "acoesLendarias"
  ],
  "blurb": "Luta com mordida venenosa, garras e cauda que derruba, e exala uma nuvem de esporos que causa dano psíquico e medo. Com ações lendárias, força inimigos a atacar os próprios aliados ou os envenena à distância.",
  "lore": "Dragões das profundezas habitam as cavernas mais escuras do Subterrâneo, onde fungos e silêncio dominam. São astutos, persuasivos e preferem manipular a lutar abertamente. Muitas vezes assumem forma pequena ou média para circular entre os povos subterrâneos e reunir informações e aliados. Quando enfim combatem, usam esporos alucinógenos e venenosos para semear pânico e discórdia."
 },
 "dragaoDeEsmeraldaAdulto": {
  "id": "dragaoDeEsmeraldaAdulto",
  "tipo": "dragão",
  "name": "Dragão de Esmeralda Adulto",
  "nomeOriginal": "Adult Emerald Dragon",
  "fonte": "FTD",
  "size": "enorme",
  "level": 13,
  "cr": "14",
  "xp": 11500,
  "abilities": {
   "str": 23,
   "dex": 12,
   "con": 21,
   "int": 18,
   "wis": 16,
   "cha": 18
  },
  "ac": 18,
  "acNote": "armadura natural",
  "maxHp": 207,
  "hpDice": "18d12+90",
  "speedFt": 40,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80,
   "burrowFt": 30
  },
  "senses": {
   "passivePerception": 23,
   "blindsightFt": 60,
   "darkvisionFt": 120
  },
  "saves": [
   "dex",
   "con",
   "wis",
   "cha"
  ],
  "skills": [
   "arcanismo",
   "enganacao",
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageResistances": [
   "fogo",
   "psíquico"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 11,
    "damage": "2d10+6",
    "type": "perfurante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "2d6",
     "type": "psíquico"
    }
   },
   {
    "name": "Garra",
    "bonus": 11,
    "damage": "1d8+6",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida",
    "Garra",
    "Garra"
   ]
  },
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "detectarPensamentos",
    "dissiparMagia",
    "invisibilidade",
    "imagemMaior",
    "maoMagica",
    "ilusaoMenor"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "detectarPensamentos": 1,
    "dissiparMagia": 1,
    "invisibilidade": 1,
    "imagemMaior": 1
   },
   "aVontade": [
    "maoMagica",
    "ilusaoMenor"
   ],
   "cdPorMagia": {
    "detectarPensamentos": 17,
    "dissiparMagia": 17,
    "invisibilidade": 17,
    "imagemMaior": 17,
    "maoMagica": 17,
    "ilusaoMenor": 17
   }
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "acoesEspeciais": [
   {
    "nome": "Sopro Desorientador",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 60,
    "save": "int",
    "dc": 18,
    "damage": "12d6",
    "damageType": "psíquico",
    "halfOnSave": true
   },
   {
    "nome": "Passo Psíquico",
    "tipo": "teleporte",
    "alcanceFt": 60,
    "bonus": true
   }
  ],
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Garra",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Garra"
    },
    {
     "nome": "Psiônica",
     "custo": 2,
     "tipo": "magia"
    },
    {
     "nome": "Brasas de Esmeralda",
     "custo": 3,
     "tipo": "alvo",
     "alcanceFt": 60,
     "save": "dex",
     "dc": 17,
     "damage": "9d6",
     "damageType": "fogo",
     "halfOnSave": false
    }
   ]
  },
  "traits": [
   "t_alterarPercepcao",
   "escavador",
   "t_mudarDeForma",
   "acoesLendarias"
  ],
  "marcas": [
   "gem"
  ],
  "blurb": "Dragão psiônico que se teleporta pelo campo, morde com dano psíquico e solta um sopro dissonante que atrapalha ataques e testes dos alvos. Ilusões, invisibilidade e chamas verdes tornam difícil prever onde ele vai atacar.",
  "lore": "Dragões de esmeralda são dragões de gema paranoicos e reservados, que guardam segredos e conhecimento com tanto zelo quanto tesouros. Costumam fazer covis em lugares escondidos, como ruínas antigas, vulcões adormecidos ou túneis que eles mesmos escavam na rocha. Usam ilusões e telepatia para enganar visitantes e testar suas intenções antes de se revelar. Preferem observar à distância e só lutam abertamente quando acuados ou quando seu território é violado."
 },
 "dragaoDePedraDaLuaAdulto": {
  "id": "dragaoDePedraDaLuaAdulto",
  "tipo": "dragão",
  "name": "Dragão de Pedra-da-Lua Adulto",
  "nomeOriginal": "Adult Moonstone Dragon",
  "fonte": "FTD",
  "size": "enorme",
  "level": 13,
  "cr": "15",
  "xp": 13000,
  "abilities": {
   "str": 20,
   "dex": 18,
   "con": 20,
   "int": 22,
   "wis": 20,
   "cha": 23
  },
  "ac": 19,
  "acNote": "armadura natural",
  "maxHp": 195,
  "hpDice": "17d12+85",
  "speedFt": 40,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80
  },
  "senses": {
   "passivePerception": 20,
   "blindsightFt": 60,
   "darkvisionFt": 120
  },
  "saves": [
   "int",
   "wis",
   "cha"
  ],
  "skills": [
   "percepcao",
   "persuasao",
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [
   "enfeitiçado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 10,
    "damage": "2d10+5",
    "type": "perfurante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "2d6",
     "type": "radiante"
    }
   },
   {
    "name": "Garra",
    "bonus": 10,
    "damage": "2d6+5",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Cauda",
    "bonus": 10,
    "damage": "1d8+5",
    "type": "concussão",
    "reachFt": 15,
    "onHit": {
     "save": "str",
     "dc": 18,
     "condition": "caido",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida",
    "Garra",
    "Garra"
   ]
  },
  "breath": {
   "name": "Sopro",
   "kind": "save",
   "shape": "cone",
   "areaFt": 90,
   "save": "con",
   "dc": 18,
   "damage": "9d10",
   "damageType": "radiante",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    5,
    6
   ]
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "acalmarEmocoes",
    "invisibilidade",
    "revivificar",
    "fogoDasFadas"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "acalmarEmocoes": 1,
    "invisibilidade": 1,
    "revivificar": 1
   },
   "aVontade": [
    "fogoDasFadas"
   ],
   "cdPorMagia": {
    "acalmarEmocoes": 19,
    "invisibilidade": 19,
    "revivificar": 19,
    "fogoDasFadas": 19
   }
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Cauda",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Cauda"
    },
    {
     "nome": "Lançar Magia",
     "custo": 2,
     "tipo": "magia"
    }
   ]
  },
  "traits": [
   "acoesLendarias"
  ],
  "blurb": "Combina mordida radiante, garras e cauda que derruba com um sopro que faz grupos inteiros dormirem ou um raio de luar devastador. Também lança magias para se tornar invisível, revelar inimigos ou acalmar o combate.",
  "lore": "Dragões de pedra-da-lua são criaturas ligadas aos sonhos e à Agrestia das Fadas, de escamas pálidas que brilham como a lua. Costumam viver em lugares isolados e enluarados, como ilhas, clareiras antigas e ruínas esquecidas. São curiosos e caprichosos, mais interessados em conversar, observar e brincar com a mente dos outros do que em destruir. Quando ameaçados, porém, usam sopro e magia com precisão para encerrar o conflito rapidamente."
 },
 "dragaoDeSafiraAdulto": {
  "id": "dragaoDeSafiraAdulto",
  "tipo": "dragão",
  "name": "Dragão de Safira Adulto",
  "nomeOriginal": "Adult Sapphire Dragon",
  "fonte": "FTD",
  "size": "enorme",
  "level": 13,
  "cr": "15",
  "xp": 13000,
  "abilities": {
   "str": 23,
   "dex": 14,
   "con": 22,
   "int": 18,
   "wis": 17,
   "cha": 18
  },
  "ac": 18,
  "acNote": "armadura natural",
  "maxHp": 225,
  "hpDice": "18d12+108",
  "speedFt": 40,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80,
   "climbFt": 40,
   "burrowFt": 30
  },
  "senses": {
   "passivePerception": 23,
   "blindsightFt": 60,
   "darkvisionFt": 120
  },
  "saves": [
   "dex",
   "con",
   "wis",
   "cha"
  ],
  "skills": [
   "historia",
   "percepcao",
   "persuasao",
   "furtividade"
  ],
  "expertise": [
   "percepcao",
   "persuasao"
  ],
  "damageResistances": [
   "elétrico",
   "trovejante"
  ],
  "conditionImmunities": [
   "amedrontado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 11,
    "damage": "2d10+6",
    "type": "perfurante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "1d10",
     "type": "trovejante"
    }
   },
   {
    "name": "Garra",
    "bonus": 11,
    "damage": "1d8+6",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida",
    "Garra",
    "Garra"
   ]
  },
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "sussurrosDissonantes",
    "imobilizarMonstro",
    "fundirSeComPedra",
    "telecinesia"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "sussurrosDissonantes": 1,
    "imobilizarMonstro": 1,
    "fundirSeComPedra": 1,
    "telecinesia": 1
   },
   "cdPorMagia": {
    "sussurrosDissonantes": 17,
    "imobilizarMonstro": 17,
    "fundirSeComPedra": 17,
    "telecinesia": 17
   }
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "acoesEspeciais": [
   {
    "nome": "Sopro Debilitante",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 60,
    "save": "con",
    "dc": 19,
    "damage": "8d10",
    "damageType": "trovejante",
    "halfOnSave": true,
    "condition": "incapacitado",
    "rounds": 1,
    "repete": false,
    "ateFimDoTurnoDele": true
   },
   {
    "nome": "Passo Psíquico",
    "tipo": "teleporte",
    "alcanceFt": 60,
    "bonus": true
   }
  ],
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Garra",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Garra"
    },
    {
     "nome": "Psiônica",
     "custo": 2,
     "tipo": "magia"
    },
    {
     "nome": "Arremesso Telecinético",
     "custo": 3,
     "tipo": "alvo",
     "alcanceFt": 60,
     "save": "dex",
     "dc": 17,
     "damage": "9d6",
     "damageType": "concussão",
     "halfOnSave": false
    }
   ]
  },
  "traits": [
   "spiderClimb",
   "escavador",
   "t_mudarDeForma",
   "acoesLendarias"
  ],
  "marcas": [
   "gem"
  ],
  "blurb": "Combina garras e mordida trovejante com um sopro sônico que incapacita grupos inteiros, e se teleporta pelo campo usando psiônica. Cuidado com o sopro em cone de 18 m e com objetos arremessados por telecinese.",
  "lore": "Dragões de safira são dragões de gema que preferem as profundezas da terra, onde escavam túneis e exploram cavernas esquecidas. Metódicos e territoriais, valorizam a ordem e o conhecimento, especialmente a história do mundo subterrâneo. Usam poderes psiônicos para se comunicar por telepatia e enfrentar invasores. Costumam ver os habitantes do Subterrâneo como ameaças a serem vigiadas de perto."
 },
 "dragaoDeTopazioAdulto": {
  "id": "dragaoDeTopazioAdulto",
  "tipo": "dragão",
  "name": "Dragão de Topázio Adulto",
  "nomeOriginal": "Adult Topaz Dragon",
  "fonte": "FTD",
  "size": "enorme",
  "level": 13,
  "cr": "13",
  "xp": 10000,
  "abilities": {
   "str": 19,
   "dex": 12,
   "con": 19,
   "int": 18,
   "wis": 17,
   "cha": 18
  },
  "ac": 18,
  "acNote": "armadura natural",
  "maxHp": 210,
  "hpDice": "20d12+80",
  "speedFt": 40,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80,
   "swimFt": 40
  },
  "senses": {
   "passivePerception": 23,
   "blindsightFt": 60,
   "darkvisionFt": 120
  },
  "saves": [
   "dex",
   "con",
   "wis",
   "cha"
  ],
  "skills": [
   "intimidacao",
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "intimidacao",
   "percepcao"
  ],
  "damageResistances": [
   "frio",
   "necrótico"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 9,
    "damage": "2d10+4",
    "type": "perfurante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "1d6",
     "type": "necrótico"
    }
   },
   {
    "name": "Garra",
    "bonus": 9,
    "damage": "1d8+4",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida",
    "Garra",
    "Garra"
   ]
  },
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "perdicao",
    "criarDestruirAgua"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "perdicao": 1,
    "criarDestruirAgua": 1
   },
   "cdPorMagia": {
    "perdicao": 17,
    "criarDestruirAgua": 17
   }
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "acoesEspeciais": [
   {
    "nome": "Sopro Dessecante",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 60,
    "save": "con",
    "dc": 17,
    "damage": "10d6",
    "damageType": "necrótico",
    "halfOnSave": true
   },
   {
    "nome": "Passo Psíquico",
    "tipo": "teleporte",
    "alcanceFt": 60,
    "bonus": true
   }
  ],
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Garra",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Garra"
    },
    {
     "nome": "Psiônica",
     "custo": 2,
     "tipo": "magia"
    },
    {
     "nome": "Redução Essencial",
     "custo": 3,
     "tipo": "alvo",
     "alcanceFt": 60,
     "save": "con",
     "dc": 17,
     "damage": "8d6",
     "damageType": "necrótico",
     "halfOnSave": false
    }
   ]
  },
  "traits": [
   "t_fabricar",
   "t_mudarDeForma",
   "acoesLendarias"
  ],
  "marcas": [
   "gem"
  ],
  "blurb": "Combina mordida e garras com um sopro necrótico em cone que resseca e enfraquece os alvos, e se teletransporta pelo campo de batalha com poderes psiônicos. Sua Redução Essencial pode transformar em pó quem cair a 0 PV.",
  "lore": "Dragões de topázio são dragões de gema solitários e reservados, ligados a mares, litorais e ilhas rochosas. Preferem observar à distância e se irritam com intrusos que perturbam seu isolamento. Usam a mente tanto quanto as garras, comunicando-se por telepatia e manipulando a água com psiônica. A energia que exalam suga a umidade e a vitalidade de tudo o que tocam."
 },
 "filhoteDeDragaoDeAmetista": {
  "id": "filhoteDeDragaoDeAmetista",
  "tipo": "dragão",
  "name": "Filhote de Dragão de Ametista",
  "nomeOriginal": "Amethyst Dragon Wyrmling",
  "fonte": "FTD",
  "size": "médio",
  "level": 1,
  "cr": "4",
  "xp": 1100,
  "abilities": {
   "str": 19,
   "dex": 10,
   "con": 17,
   "int": 16,
   "wis": 13,
   "cha": 17
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 75,
  "hpDice": "10d8+30",
  "speedFt": 30,
  "flyFt": 60,
  "hover": true,
  "speeds": {
   "flyFt": 60,
   "swimFt": 30
  },
  "senses": {
   "passivePerception": 15,
   "blindsightFt": 10,
   "darkvisionFt": 120
  },
  "saves": [
   "dex",
   "con",
   "wis",
   "cha"
  ],
  "skills": [
   "arcanismo",
   "percepcao",
   "persuasao",
   "furtividade"
  ],
  "expertise": [
   "arcanismo",
   "percepcao"
  ],
  "damageResistances": [
   "energético",
   "psíquico"
  ],
  "conditionImmunities": [
   "amedrontado",
   "caido"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 6,
    "damage": "1d10+4",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d8",
     "type": "energético"
    }
   }
  ],
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "protecaoBemMal",
    "discoFlutuante",
    "servoInvisivel"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "protecaoBemMal": 1,
    "discoFlutuante": 1,
    "servoInvisivel": 1
   },
   "cdPorMagia": {
    "protecaoBemMal": 13,
    "discoFlutuante": 13,
    "servoInvisivel": 13
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Sopro de Singularidade",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 15,
    "save": "str",
    "dc": 13,
    "damage": "5d8",
    "damageType": "energético",
    "halfOnSave": true
   }
  ],
  "traits": [],
  "marcas": [
   "gem"
  ],
  "blurb": "Morde com força energética extra e solta um cone de gravidade que fere e prende os alvos no lugar. Voa pairando, nada e resiste a dano energético e psíquico.",
  "lore": "Dragões de ametista são dragões de gema ligados a poderes psiônicos e às forças que mantêm o mundo coeso. Mesmo jovens, já demonstram curiosidade intelectual e preferem conversar por telepatia antes de lutar. Vivem perto de lagos e cavernas submersas, pois respiram tanto no ar quanto na água. Costumam ser neutros, avaliando cada encontro pelo que podem aprender ou ganhar."
 },
 "grandeWyrmDeAmetista": {
  "id": "grandeWyrmDeAmetista",
  "tipo": "dragão",
  "name": "Grande Wyrm de Ametista",
  "nomeOriginal": "Amethyst Greatwyrm",
  "fonte": "FTD",
  "size": "imenso",
  "level": 25,
  "cr": "26",
  "xp": 90000,
  "abilities": {
   "str": 28,
   "dex": 14,
   "con": 29,
   "int": 30,
   "wis": 24,
   "cha": 25
  },
  "ac": 21,
  "acNote": "armadura natural",
  "maxHp": 507,
  "hpDice": "26d20+234",
  "speedFt": 60,
  "flyFt": 120,
  "hover": true,
  "speeds": {
   "flyFt": 120,
   "swimFt": 60,
   "burrowFt": 60
  },
  "senses": {
   "passivePerception": 25,
   "truesightFt": 120
  },
  "saves": [
   "dex",
   "con",
   "wis",
   "cha"
  ],
  "skills": [
   "arcanismo",
   "historia",
   "percepcao"
  ],
  "expertise": [
   "arcanismo"
  ],
  "damageImmunities": [
   "energético"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "amedrontado",
   "envenenado",
   "caido"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 17,
    "damage": "2d10+9",
    "type": "perfurante",
    "reachFt": 15,
    "danoExtra": {
     "damage": "3d10",
     "type": "energético"
    }
   },
   {
    "name": "Garra",
    "bonus": 17,
    "damage": "2d8+9",
    "type": "cortante",
    "reachFt": 10,
    "onHit": {
     "semResistencia": true,
     "dc": 19,
     "escape": 19,
     "condition": "contido",
     "note": "é agarrado",
     "maxAgarrados": 1
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida",
    "Garra",
    "Garra"
   ]
  },
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "dissiparMagia",
    "jaulaDeEnergia",
    "viagemPlanar",
    "inverterAGravidade",
    "pararOTempo"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "dissiparMagia": 1,
    "jaulaDeEnergia": 1,
    "viagemPlanar": 1,
    "inverterAGravidade": 1,
    "pararOTempo": 1
   },
   "cdPorMagia": {
    "dissiparMagia": 26,
    "jaulaDeEnergia": 26,
    "viagemPlanar": 26,
    "inverterAGravidade": 26,
    "pararOTempo": 26
   }
  },
  "recursos": {
   "resistenciaLendaria": 4
  },
  "acoesEspeciais": [
   {
    "nome": "Sopro",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 300,
    "save": "dex",
    "dc": 25,
    "damage": "11d12",
    "damageType": "energético",
    "halfOnSave": true,
    "condition": "caido",
    "rounds": 1,
    "repete": false,
    "ateFimDoTurnoDele": true
   },
   {
    "nome": "Telecinese em Massa",
    "tipo": "area",
    "shape": "raio",
    "areaFt": 120,
    "save": "str",
    "dc": 26,
    "damage": "7d12",
    "damageType": "energético",
    "halfOnSave": false,
    "condition": "contido",
    "rounds": 10,
    "repete": true
   },
   {
    "nome": "Passo Psíquico",
    "tipo": "teleporte",
    "alcanceFt": 60,
    "bonus": true
   }
  ],
  "despertar": {
   "pv": 400
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Garra",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Garra"
    },
    {
     "nome": "Psiônica",
     "custo": 2,
     "tipo": "magia"
    },
    {
     "nome": "Raio Psíquico",
     "custo": 3,
     "tipo": "linha",
     "comprimentoFt": 90,
     "larguraFt": 10,
     "save": "int",
     "dc": 26,
     "damage": "5d10",
     "damageType": "psíquico",
     "halfOnSave": true
    }
   ]
  },
  "traits": [
   "despertar",
   "t_naturezaIncomum",
   "t_mudarDeForma",
   "acoesLendarias"
  ],
  "marcas": [
   "gem"
  ],
  "blurb": "Dragão colossal que esmaga grupos inteiros com um sopro de força em cone de 90 m, se teleporta pelo campo e lança magias como parar o tempo e jaula de força. Ao chegar a 0 PV, desperta e volta com 400 PV, podendo erguer e esmagar inimigos por telecinese.",
  "lore": "Os grandes wyrms de ametista estão entre os dragões de gema mais antigos e poderosos, mentes psiônicas de intelecto quase inigualável. Costumam ser neutros e dão mais valor ao conhecimento e ao equilíbrio que à conquista. Escondem-se em covis remotos, muitas vezes ligados a outros planos, e às vezes andam entre mortais em forma pequena. Quando ameaçados, revelam reservas de poder que poucos sobrevivem para descrever."
 },
 "dragaoDeAmetistaAnciao": {
  "id": "dragaoDeAmetistaAnciao",
  "tipo": "dragão",
  "name": "Dragão de Ametista Ancião",
  "nomeOriginal": "Ancient Amethyst Dragon",
  "fonte": "FTD",
  "size": "imenso",
  "level": 21,
  "cr": "23",
  "xp": 50000,
  "abilities": {
   "str": 26,
   "dex": 14,
   "con": 27,
   "int": 26,
   "wis": 19,
   "cha": 23
  },
  "ac": 20,
  "acNote": "armadura natural",
  "maxHp": 444,
  "hpDice": "24d20+192",
  "speedFt": 40,
  "flyFt": 80,
  "hover": true,
  "speeds": {
   "flyFt": 80,
   "swimFt": 40
  },
  "senses": {
   "passivePerception": 28,
   "blindsightFt": 60,
   "darkvisionFt": 120
  },
  "saves": [
   "dex",
   "con",
   "wis",
   "cha"
  ],
  "skills": [
   "arcanismo",
   "percepcao",
   "persuasao",
   "furtividade"
  ],
  "expertise": [
   "arcanismo",
   "percepcao"
  ],
  "damageResistances": [
   "energético",
   "psíquico"
  ],
  "conditionImmunities": [
   "amedrontado",
   "caido"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 15,
    "damage": "2d10+8",
    "type": "perfurante",
    "reachFt": 15,
    "danoExtra": {
     "damage": "3d8",
     "type": "energético"
    }
   },
   {
    "name": "Garra",
    "bonus": 15,
    "damage": "2d6+8",
    "type": "cortante",
    "reachFt": 10
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida",
    "Garra",
    "Garra"
   ]
  },
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "piscar",
    "dissiparMagia",
    "liberdadeDeMovimento",
    "globoDeInvulnerabilidade",
    "viagemPlanar",
    "protecaoBemMal",
    "enviarMensagem"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "piscar": 1,
    "dissiparMagia": 1,
    "liberdadeDeMovimento": 1,
    "globoDeInvulnerabilidade": 1,
    "viagemPlanar": 1,
    "protecaoBemMal": 1,
    "enviarMensagem": 1
   },
   "cdPorMagia": {
    "piscar": 23,
    "dissiparMagia": 23,
    "liberdadeDeMovimento": 23,
    "globoDeInvulnerabilidade": 23,
    "viagemPlanar": 23,
    "protecaoBemMal": 23,
    "enviarMensagem": 23
   }
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "acoesEspeciais": [
   {
    "nome": "Sopro de Singularidade",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 90,
    "save": "str",
    "dc": 23,
    "damage": "14d8",
    "damageType": "energético",
    "halfOnSave": true
   },
   {
    "nome": "Passo Psíquico",
    "tipo": "teleporte",
    "alcanceFt": 60,
    "bonus": true
   }
  ],
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Garra",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Garra"
    },
    {
     "nome": "Psiônica",
     "custo": 2,
     "tipo": "magia"
    },
    {
     "nome": "Cristal Explosivo",
     "custo": 3,
     "tipo": "area",
     "raioFt": 60,
     "save": "dex",
     "dc": 23,
     "damage": "4d8",
     "damageType": "energético",
     "halfOnSave": false,
     "condition": "caido",
     "rounds": 10,
     "repete": false
    }
   ]
  },
  "traits": [
   "t_mudarDeForma",
   "acoesLendarias"
  ],
  "marcas": [
   "gem"
  ],
  "blurb": "Colosso psiônico que alterna mordidas de energia com teleportes e um sopro gravitacional em cone de 27 m que prende os alvos no lugar. Cristais explosivos derrubam grupos inteiros à distância.",
  "lore": "Dragões de ametista são os mais serenos e calculistas entre os dragões de gema, mentes poderosas que dominam forças psíquicas e gravitacionais. Os anciões costumam viver isolados em covis cristalinos, muitas vezes junto a lagos ou mares subterrâneos, já que respiram tanto na água quanto no ar. Preferem observar e estudar a se envolver em conflitos, mas quando provocados lutam com precisão fria. Podem assumir formas menores para circular discretamente entre outros povos."
 },
 "dragaoDeCristalAnciao": {
  "id": "dragaoDeCristalAnciao",
  "tipo": "dragão",
  "name": "Dragão de Cristal Ancião",
  "nomeOriginal": "Ancient Crystal Dragon",
  "fonte": "FTD",
  "size": "imenso",
  "level": 17,
  "cr": "19",
  "xp": 22000,
  "abilities": {
   "str": 25,
   "dex": 12,
   "con": 26,
   "int": 20,
   "wis": 16,
   "cha": 21
  },
  "ac": 20,
  "acNote": "armadura natural",
  "maxHp": 222,
  "hpDice": "12d20+96",
  "speedFt": 40,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80,
   "climbFt": 40,
   "burrowFt": 40
  },
  "senses": {
   "passivePerception": 25,
   "blindsightFt": 60,
   "darkvisionFt": 120
  },
  "saves": [
   "dex",
   "con",
   "wis",
   "cha"
  ],
  "skills": [
   "percepcao",
   "furtividade",
   "sobrevivencia"
  ],
  "expertise": [
   "percepcao",
   "furtividade"
  ],
  "damageResistances": [
   "frio",
   "radiante"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 13,
    "damage": "2d10+7",
    "type": "perfurante",
    "reachFt": 15,
    "danoExtra": {
     "damage": "2d8",
     "type": "radiante"
    }
   },
   {
    "name": "Garra",
    "bonus": 13,
    "damage": "2d6+7",
    "type": "cortante",
    "reachFt": 10
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida",
    "Garra",
    "Garra"
   ]
  },
  "breath": {
   "name": "Sopro Cintilante",
   "kind": "save",
   "shape": "cone",
   "areaFt": 90,
   "save": "con",
   "dc": 22,
   "damage": "11d8",
   "damageType": "radiante",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    5,
    6
   ]
  },
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "comando",
    "adivinhacao",
    "restauracaoMaior",
    "padraoHipnotico",
    "invisibilidade",
    "luzesDancantes",
    "orientacao"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "comando": 1,
    "adivinhacao": 1,
    "restauracaoMaior": 1,
    "padraoHipnotico": 1,
    "invisibilidade": 1
   },
   "aVontade": [
    "luzesDancantes",
    "orientacao"
   ],
   "cdPorMagia": {
    "comando": 19,
    "adivinhacao": 19,
    "restauracaoMaior": 19,
    "padraoHipnotico": 19,
    "invisibilidade": 19,
    "luzesDancantes": 19,
    "orientacao": 19
   }
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "acoesEspeciais": [
   {
    "nome": "Passo Psíquico",
    "tipo": "teleporte",
    "alcanceFt": 60,
    "bonus": true
   }
  ],
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Garra",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Garra"
    },
    {
     "nome": "Psiônica",
     "custo": 2,
     "tipo": "magia"
    },
    {
     "nome": "Golpe de Luz Estelar",
     "custo": 3,
     "tipo": "alvo",
     "alcanceFt": 60,
     "save": "dex",
     "dc": 19,
     "damage": "11d6",
     "damageType": "radiante",
     "halfOnSave": false
    }
   ]
  },
  "traits": [
   "t_mudarDeForma",
   "acoesLendarias"
  ],
  "marcas": [
   "gem"
  ],
  "blurb": "Gigante psiônico que se teletransporta pelo campo de batalha, morde e arranha com força e solta um sopro radiante em cone de 27 m que ainda lhe concede PV temporários. Pode fulminar alvos distantes com um raio de luz estelar como ação lendária.",
  "lore": "Os dragões de cristal são dragões-gema de temperamento curioso e brincalhão, fascinados pelas estrelas e pelos mistérios do cosmos. Costumam fazer seus covis em cavernas geladas ou montanhas cheias de cristais, onde observam o céu noturno. Usam poderes psiônicos para se comunicar por telepatia e, às vezes, assumem forma humanoide para circular entre outros povos. Um ancião acumula séculos de conhecimento e prefere a conversa ao combate, mas reage com fúria brilhante quando ameaçado."
 },
 "dragaoProfundoAnciao": {
  "id": "dragaoProfundoAnciao",
  "tipo": "dragão",
  "name": "Dragão Profundo Ancião",
  "nomeOriginal": "Ancient Deep Dragon",
  "fonte": "FTD",
  "size": "imenso",
  "level": 17,
  "cr": "18",
  "xp": 20000,
  "abilities": {
   "str": 23,
   "dex": 16,
   "con": 20,
   "int": 19,
   "wis": 18,
   "cha": 21
  },
  "ac": 20,
  "acNote": "armadura natural",
  "maxHp": 201,
  "hpDice": "13d20+65",
  "speedFt": 40,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80,
   "swimFt": 40,
   "burrowFt": 40
  },
  "senses": {
   "passivePerception": 20,
   "blindsightFt": 60,
   "darkvisionFt": 300
  },
  "saves": [
   "dex",
   "con",
   "wis",
   "cha"
  ],
  "skills": [
   "percepcao",
   "persuasao",
   "furtividade"
  ],
  "expertise": [
   "persuasao",
   "furtividade"
  ],
  "damageResistances": [
   "veneno",
   "psíquico"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "amedrontado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 12,
    "damage": "2d10+6",
    "type": "perfurante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "2d10",
     "type": "veneno"
    }
   },
   {
    "name": "Garra",
    "bonus": 12,
    "damage": "2d6+6",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Cauda",
    "bonus": 12,
    "damage": "1d8+6",
    "type": "concussão",
    "reachFt": 15,
    "onHit": {
     "save": "str",
     "dc": 20,
     "condition": "caido",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida",
    "Garra",
    "Garra"
   ]
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "acoesEspeciais": [
   {
    "nome": "Sopro de Pesadelo",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 90,
    "save": "wis",
    "dc": 19,
    "damage": "9d10",
    "damageType": "psíquico",
    "halfOnSave": true,
    "condition": "amedrontado",
    "rounds": 10,
    "repete": true
   }
  ],
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Esporos de Comando",
     "custo": 1,
     "tipo": "alvo",
     "alcanceFt": 30,
     "save": "wis",
     "dc": 19,
     "damage": "2d10",
     "damageType": "psíquico",
     "halfOnSave": false
    },
    {
     "nome": "Cauda",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Cauda"
    },
    {
     "nome": "Rajada de Esporos",
     "custo": 2,
     "tipo": "alvo",
     "alcanceFt": 30,
     "save": "con",
     "dc": 19,
     "damage": "8d6",
     "damageType": "veneno",
     "halfOnSave": false,
     "condition": "envenenado",
     "rounds": 10,
     "repete": true
    }
   ]
  },
  "traits": [
   "t_mudarDeForma",
   "acoesLendarias"
  ],
  "blurb": "Um dragão colossal do Subterrâneo que mistura garras e mordida venenosa com nuvens de esporos que causam pesadelos, medo e até fazem os inimigos atacarem uns aos outros. Cave, voa e nada, surgindo de onde menos se espera.",
  "lore": "Dragões profundos habitam as cavernas mais remotas do Subterrâneo, onde acumulam segredos e influência tanto quanto tesouros. São manipuladores pacientes, que gostam de negociar e de controlar outros seres por meio de favores e ameaças. Na forma de um humanoide pequeno ou médio, circulam entre as cidades subterrâneas para espionar e tramar. Seu corpo abriga fungos que liberam esporos capazes de envenenar ou invadir a mente das vítimas."
 },
 "tartarugaDragaoAncia": {
  "id": "tartarugaDragaoAncia",
  "tipo": "dragão",
  "name": "Tartaruga-Dragão Anciã",
  "nomeOriginal": "Ancient Dragon Turtle",
  "fonte": "FTD",
  "size": "imenso",
  "level": 21,
  "cr": "24",
  "xp": 62000,
  "abilities": {
   "str": 28,
   "dex": 12,
   "con": 29,
   "int": 14,
   "wis": 19,
   "cha": 15
  },
  "ac": 22,
  "acNote": "armadura natural",
  "maxHp": 409,
  "hpDice": "21d20+189",
  "speedFt": 30,
  "speeds": {
   "swimFt": 60
  },
  "senses": {
   "passivePerception": 21,
   "truesightFt": 120
  },
  "saves": [
   "dex",
   "con",
   "wis"
  ],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "damageImmunities": [
   "frio",
   "fogo"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "amedrontado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 16,
    "damage": "1d12+9",
    "type": "perfurante",
    "reachFt": 15,
    "danoExtra": {
     "damage": "2d12",
     "type": "elétrico"
    }
   },
   {
    "name": "Garra",
    "bonus": 16,
    "damage": "2d8+9",
    "type": "cortante",
    "reachFt": 15
   },
   {
    "name": "Cauda",
    "bonus": 16,
    "damage": "2d10+9",
    "type": "concussão",
    "reachFt": 15,
    "onHit": {
     "save": "str",
     "dc": 24,
     "condition": "caido",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequencias": [
    [
     "Mordida",
     "Garra",
     "Garra"
    ],
    [
     "Cauda",
     "Garra",
     "Garra"
    ]
   ]
  },
  "breath": {
   "name": "Sopro de Vapor",
   "kind": "save",
   "shape": "cone",
   "areaFt": 90,
   "save": "con",
   "dc": 24,
   "damage": "15d8",
   "damageType": "fogo",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    5,
    6
   ]
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "despertar": {
   "pv": 350
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Ataque",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Garra"
    },
    {
     "nome": "Movimento",
     "custo": 1,
     "tipo": "mover",
     "metade": false,
     "semOportunidade": false
    },
    {
     "nome": "Aura Fervente",
     "custo": 3,
     "tipo": "postura",
     "condicao": "auraFervente",
     "data": {
      "auraNoInicio": {
       "raioFt": 20,
       "dc": 24,
       "save": "con",
       "dano": "9d8",
       "tipo": "fogo"
      }
     }
    }
   ]
  },
  "traits": [
   "despertar",
   "t_naturezaIncomum",
   "acoesLendarias"
  ],
  "blurb": "Colosso marinho que combina mordidas eletrificadas, garras e cauda de longo alcance com um sopro de vapor escaldante em cone de 27 m. Ao cair a 0 PV, renasce com 350 PV e ganha ações míticas.",
  "lore": "As tartarugas-dragão anciãs são titãs dos oceanos, com cascos cobertos de cracas e corais que lembram ilhas à deriva. Vagam por mares profundos e recifes distantes, onde reinam sobre territórios imensos. São criaturas neutras e pacientes, que podem negociar com navegantes em troca de tributo, mas reagem com fúria a quem invade seus domínios. Diz-se que o próprio mar as abençoa, devolvendo-lhes as forças quando parecem vencidas."
 },
 "dragaoDeEsmeraldaAnciao": {
  "id": "dragaoDeEsmeraldaAnciao",
  "tipo": "dragão",
  "name": "Dragão de Esmeralda Ancião",
  "nomeOriginal": "Ancient Emerald Dragon",
  "fonte": "FTD",
  "size": "imenso",
  "level": 21,
  "cr": "21",
  "xp": 33000,
  "abilities": {
   "str": 25,
   "dex": 12,
   "con": 25,
   "int": 20,
   "wis": 18,
   "cha": 20
  },
  "ac": 20,
  "acNote": "armadura natural",
  "maxHp": 332,
  "hpDice": "19d20+133",
  "speedFt": 40,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80,
   "burrowFt": 30
  },
  "senses": {
   "passivePerception": 28,
   "blindsightFt": 60,
   "darkvisionFt": 120
  },
  "saves": [
   "dex",
   "con",
   "wis",
   "cha"
  ],
  "skills": [
   "arcanismo",
   "enganacao",
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageResistances": [
   "fogo",
   "psíquico"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 14,
    "damage": "2d10+7",
    "type": "perfurante",
    "reachFt": 15,
    "danoExtra": {
     "damage": "3d6",
     "type": "psíquico"
    }
   },
   {
    "name": "Garra",
    "bonus": 14,
    "damage": "2d6+7",
    "type": "cortante",
    "reachFt": 10
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida",
    "Garra",
    "Garra"
   ]
  },
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "detectarPensamentos",
    "dissiparMagia",
    "imagemMaior",
    "despistar",
    "maoMagica",
    "ilusaoMenor"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "detectarPensamentos": 1,
    "dissiparMagia": 1,
    "imagemMaior": 1,
    "despistar": 1
   },
   "aVontade": [
    "maoMagica",
    "ilusaoMenor"
   ],
   "cdPorMagia": {
    "detectarPensamentos": 20,
    "dissiparMagia": 20,
    "imagemMaior": 20,
    "despistar": 20,
    "maoMagica": 20,
    "ilusaoMenor": 20
   }
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "acoesEspeciais": [
   {
    "nome": "Sopro Desorientador (Recarga 5-6)",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 90,
    "save": "int",
    "dc": 22,
    "damage": "16d6",
    "damageType": "psíquico",
    "halfOnSave": true
   },
   {
    "nome": "Passo Psíquico",
    "tipo": "teleporte",
    "alcanceFt": 60,
    "bonus": true
   },
   {
    "nome": "Forma Etérea",
    "tipo": "etereo",
    "porDia": 1
   }
  ],
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Garra",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Garra"
    },
    {
     "nome": "Psiônica",
     "custo": 2,
     "tipo": "magia"
    },
    {
     "nome": "Brasas de Esmeralda",
     "custo": 3,
     "tipo": "alvo",
     "alcanceFt": 60,
     "save": "dex",
     "dc": 20,
     "damage": "12d6",
     "damageType": "fogo",
     "halfOnSave": false
    }
   ]
  },
  "traits": [
   "escavador",
   "t_distorcerPercepcao1Dia",
   "t_mudarDeForma",
   "acoesLendarias"
  ],
  "marcas": [
   "gem"
  ],
  "blurb": "Combina mordida psíquica e garras com um sopro que atordoa mentes e atrapalha ataques e testes, enquanto se teleporta pelo campo e confunde os inimigos com ilusões. Ainda lança chamas verdes como ação lendária.",
  "lore": "Dragões de esmeralda são dragões de gema psiônicos, desconfiados e reservados, que vigiam o mundo escondidos. Os anciões cavam covis profundos sob a rocha e os protegem com ilusões que enganam qualquer intruso. Preferem observar e manipular a lutar abertamente, muitas vezes disfarçados de criaturas pequenas. Quando ameaçados, desorientam a mente dos invasores antes de atacar."
 },
 "dragaoDaPedraDaLuaAnciao": {
  "id": "dragaoDaPedraDaLuaAnciao",
  "tipo": "dragão",
  "name": "Dragão da Pedra da Lua Ancião",
  "nomeOriginal": "Ancient Moonstone Dragon",
  "fonte": "FTD",
  "size": "imenso",
  "level": 21,
  "cr": "21",
  "xp": 33000,
  "abilities": {
   "str": 22,
   "dex": 18,
   "con": 23,
   "int": 20,
   "wis": 22,
   "cha": 26
  },
  "ac": 20,
  "acNote": "armadura natural",
  "maxHp": 330,
  "hpDice": "20d20+120",
  "speedFt": 40,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80
  },
  "senses": {
   "passivePerception": 23,
   "truesightFt": 120
  },
  "saves": [
   "int",
   "wis",
   "cha"
  ],
  "skills": [
   "percepcao",
   "persuasao",
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [
   "enfeitiçado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 13,
    "damage": "2d10+6",
    "type": "perfurante",
    "reachFt": 15,
    "danoExtra": {
     "damage": "2d10",
     "type": "radiante"
    }
   },
   {
    "name": "Garra",
    "bonus": 13,
    "damage": "2d6+6",
    "type": "cortante",
    "reachFt": 10
   },
   {
    "name": "Cauda",
    "bonus": 13,
    "damage": "1d8+6",
    "type": "concussão",
    "reachFt": 20,
    "onHit": {
     "save": "str",
     "dc": 21,
     "condition": "caido",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida",
    "Garra",
    "Garra"
   ]
  },
  "breath": {
   "name": "Sopro",
   "kind": "save",
   "shape": "cone",
   "areaFt": 90,
   "save": "con",
   "dc": 21,
   "damage": "11d10",
   "damageType": "radiante",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    5,
    6
   ]
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "acalmarEmocoes",
    "dissiparMagia",
    "invisibilidade",
    "revivificar",
    "fogoDasFadas"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "acalmarEmocoes": 2,
    "dissiparMagia": 2,
    "invisibilidade": 2,
    "revivificar": 2
   },
   "aVontade": [
    "fogoDasFadas"
   ],
   "cdPorMagia": {
    "acalmarEmocoes": 23,
    "dissiparMagia": 23,
    "invisibilidade": 23,
    "revivificar": 23,
    "fogoDasFadas": 23
   }
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Cauda",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Cauda"
    },
    {
     "nome": "Lançar Magia",
     "custo": 2,
     "tipo": "magia"
    }
   ]
  },
  "traits": [
   "acoesLendarias"
  ],
  "blurb": "Combina garras e mordida radiante com um sopro que adormece multidões ou um feixe de luar devastador em linha. Também lança magias e enxerga a verdade, sendo difícil de enganar ou enfeitiçar.",
  "lore": "Dragões da pedra da lua são criaturas oníricas ligadas ao luar e ao mundo dos sonhos. Os anciões vivem há séculos em ilhas remotas, florestas encantadas ou cavernas onde a luz da lua penetra. São caprichosos e reservados, preferindo observar e influenciar os mortais através de sonhos a lutar abertamente. Quando provocados, porém, combinam magia e força bruta com grande precisão."
 },
 "dragaoDeSafiraAnciao": {
  "id": "dragaoDeSafiraAnciao",
  "tipo": "dragão",
  "name": "Dragão de Safira Ancião",
  "nomeOriginal": "Ancient Sapphire Dragon",
  "fonte": "FTD",
  "size": "imenso",
  "level": 21,
  "cr": "22",
  "xp": 41000,
  "abilities": {
   "str": 27,
   "dex": 14,
   "con": 27,
   "int": 21,
   "wis": 19,
   "cha": 20
  },
  "ac": 20,
  "acNote": "armadura natural",
  "maxHp": 370,
  "hpDice": "20d20+160",
  "speedFt": 40,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80,
   "climbFt": 40,
   "burrowFt": 40
  },
  "senses": {
   "passivePerception": 28,
   "blindsightFt": 60,
   "darkvisionFt": 120
  },
  "saves": [
   "dex",
   "con",
   "wis",
   "cha"
  ],
  "skills": [
   "historia",
   "percepcao",
   "persuasao",
   "furtividade"
  ],
  "expertise": [
   "percepcao",
   "persuasao"
  ],
  "damageResistances": [
   "elétrico",
   "trovejante"
  ],
  "conditionImmunities": [
   "amedrontado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 15,
    "damage": "2d10+8",
    "type": "perfurante",
    "reachFt": 15,
    "danoExtra": {
     "damage": "2d10",
     "type": "trovejante"
    }
   },
   {
    "name": "Garra",
    "bonus": 15,
    "damage": "2d6+8",
    "type": "cortante",
    "reachFt": 10
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida",
    "Garra",
    "Garra"
   ]
  },
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "sussurrosDissonantes",
    "imobilizarMonstro",
    "fundirSeComPedra",
    "telecinesia",
    "teletransporte"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "sussurrosDissonantes": 1,
    "imobilizarMonstro": 1,
    "fundirSeComPedra": 1,
    "telecinesia": 1,
    "teletransporte": 1
   },
   "cdPorMagia": {
    "sussurrosDissonantes": 20,
    "imobilizarMonstro": 20,
    "fundirSeComPedra": 20,
    "telecinesia": 20,
    "teletransporte": 20
   }
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "acoesEspeciais": [
   {
    "nome": "Sopro Debilitante",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 90,
    "save": "con",
    "dc": 23,
    "damage": "10d10",
    "damageType": "trovejante",
    "halfOnSave": true,
    "condition": "incapacitado",
    "rounds": 1,
    "repete": false,
    "ateFimDoTurnoDele": true
   },
   {
    "nome": "Passo Psíquico",
    "tipo": "teleporte",
    "alcanceFt": 60,
    "bonus": true
   }
  ],
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Garra",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Garra"
    },
    {
     "nome": "Psiônica",
     "custo": 2,
     "tipo": "magia"
    },
    {
     "nome": "Arremesso Telecinético",
     "custo": 3,
     "tipo": "alvo",
     "alcanceFt": 60,
     "save": "dex",
     "dc": 20,
     "damage": "12d6",
     "damageType": "concussão",
     "halfOnSave": false
    }
   ]
  },
  "traits": [
   "spiderClimb",
   "escavador",
   "t_mudarDeForma",
   "acoesLendarias"
  ],
  "marcas": [
   "gem"
  ],
  "blurb": "Gigante psiônico que cava, escala e se teleporta pelo campo de batalha, mordendo com dano trovejante e soltando um sopro sônico que deixa grupos inteiros incapacitados. À distância, arremessa objetos com telecinese e lança magias como imobilizar monstro.",
  "lore": "Os dragões de safira são dragões de gema ligados a poderes da mente, de tendência leal e neutra. Vivem nas profundezas da terra, abrindo túneis na rocha e guardando complexos subterrâneos onde acumulam conhecimento e tesouros. Desconfiados e territoriais, enxergam intrusos como ameaças e preferem conversar por telepatia antes de decidir se atacam. Os anciões dominam a psiônica a ponto de se teleportar e mover objetos com o pensamento, e podem assumir formas menores para circular entre outros povos."
 },
 "serpenteMarinhaAncia": {
  "id": "serpenteMarinhaAncia",
  "tipo": "dragão",
  "name": "Serpente Marinha Anciã",
  "nomeOriginal": "Ancient Sea Serpent",
  "fonte": "FTD",
  "size": "imenso",
  "level": 13,
  "cr": "14",
  "xp": 11500,
  "abilities": {
   "str": 24,
   "dex": 15,
   "con": 20,
   "int": 13,
   "wis": 16,
   "cha": 12
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 170,
  "hpDice": "11d20+55",
  "speedFt": 20,
  "speeds": {
   "swimFt": 60
  },
  "senses": {
   "passivePerception": 18,
   "darkvisionFt": 120
  },
  "saves": [
   "str",
   "con"
  ],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "damageImmunities": [
   "frio"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 12,
    "damage": "2d12+7",
    "type": "perfurante",
    "reachFt": 15,
    "danoExtra": {
     "damage": "1d12",
     "type": "frio"
    }
   },
   {
    "name": "Constrição",
    "bonus": 12,
    "damage": "4d10+7",
    "type": "concussão",
    "reachFt": 20,
    "onHit": {
     "semResistencia": true,
     "dc": 20,
     "escape": 20,
     "condition": "contido",
     "note": "é agarrado"
    }
   },
   {
    "name": "Cauda",
    "bonus": 12,
    "damage": "1d12+7",
    "type": "concussão",
    "reachFt": 20,
    "onHit": {
     "save": "str",
     "dc": 20,
     "condition": "caido",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequencias": [
    [
     "Mordida",
     "Constrição"
    ],
    [
     "Mordida",
     "Cauda"
    ]
   ]
  },
  "breath": {
   "name": "Sopro Glacial (Recarga 5–6)",
   "kind": "save",
   "shape": "cone",
   "areaFt": 60,
   "save": "con",
   "dc": 18,
   "damage": "9d10",
   "damageType": "frio",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    5,
    6
   ]
  },
  "recursos": {
   "resistenciaLendaria": 2
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Cauda",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Cauda"
    },
    {
     "nome": "Mordida",
     "custo": 2,
     "tipo": "golpe",
     "arma": "Mordida"
    }
   ]
  },
  "traits": [
   "monstroDeCerco",
   "acoesLendarias"
  ],
  "blurb": "Gigantesca serpente dracônica que esmaga presas em seus anéis, arremessa inimigos com a cauda e solta um sopro de gelo em cone. Seu alcance enorme e a resistência lendária a tornam um terror para navios.",
  "lore": "Serpentes marinhas são parentes distantes dos dragões que trocaram as asas pela vida nas profundezas oceânicas. As mais antigas atingem tamanho capaz de envolver um navio inteiro e partir seu casco. Patrulham rotas marítimas e águas geladas, atacando embarcações que invadem seu território ou que parecem presas fáceis. Apesar da fúria, são inteligentes e falam o Comum e o Dracônico, podendo às vezes ser convencidas com tributos."
 },
 "dragaoDeTopazioAnciao": {
  "id": "dragaoDeTopazioAnciao",
  "tipo": "dragão",
  "name": "Dragão de Topázio Ancião",
  "nomeOriginal": "Ancient Topaz Dragon",
  "fonte": "FTD",
  "size": "imenso",
  "level": 17,
  "cr": "20",
  "xp": 25000,
  "abilities": {
   "str": 23,
   "dex": 12,
   "con": 23,
   "int": 20,
   "wis": 19,
   "cha": 20
  },
  "ac": 20,
  "acNote": "armadura natural",
  "maxHp": 280,
  "hpDice": "17d20+102",
  "speedFt": 40,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80,
   "swimFt": 40
  },
  "senses": {
   "passivePerception": 26,
   "blindsightFt": 60,
   "darkvisionFt": 120
  },
  "saves": [
   "dex",
   "con",
   "wis",
   "cha"
  ],
  "skills": [
   "intimidacao",
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "intimidacao",
   "percepcao"
  ],
  "damageResistances": [
   "frio",
   "necrótico"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 12,
    "damage": "2d10+6",
    "type": "perfurante",
    "reachFt": 15,
    "danoExtra": {
     "damage": "3d6",
     "type": "necrótico"
    }
   },
   {
    "name": "Garra",
    "bonus": 12,
    "damage": "2d6+6",
    "type": "cortante",
    "reachFt": 10
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida",
    "Garra",
    "Garra"
   ]
  },
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "conchaAntivida",
    "perdicao",
    "criarDestruirAgua"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "conchaAntivida": 1,
    "perdicao": 1,
    "criarDestruirAgua": 1
   },
   "cdPorMagia": {
    "conchaAntivida": 19,
    "perdicao": 19,
    "criarDestruirAgua": 19
   }
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "acoesEspeciais": [
   {
    "nome": "Sopro Dessecante",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 90,
    "save": "con",
    "dc": 20,
    "damage": "14d6",
    "damageType": "necrótico",
    "halfOnSave": true
   },
   {
    "nome": "Passo Psíquico",
    "tipo": "teleporte",
    "alcanceFt": 60,
    "bonus": true
   }
  ],
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Garra",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Garra"
    },
    {
     "nome": "Psiônica",
     "custo": 2,
     "tipo": "magia"
    },
    {
     "nome": "Redução Essencial",
     "custo": 3,
     "tipo": "alvo",
     "alcanceFt": 60,
     "save": "con",
     "dc": 19,
     "damage": "9d8",
     "damageType": "necrótico",
     "halfOnSave": false
    }
   ]
  },
  "traits": [
   "t_fabricar",
   "t_mudarDeForma",
   "acoesLendarias"
  ],
  "marcas": [
   "gem"
  ],
  "blurb": "Um dragão psiônico colossal que drena a umidade e a vida dos inimigos com um sopro necrótico enfraquecedor, teleporta-se pelo campo e pode reduzir alvos a pó com uma descarga de energia vital.",
  "lore": "Dragões de topázio são dragões de gema ligados ao mar e à entropia, frequentemente solitários e pouco sociáveis. Vivem em covis costeiros ou submersos, entre rochedos batidos pelas ondas, e respiram tanto ar quanto água. Os anciões dominam poderes psiônicos refinados, comunicam-se por telepatia e podem assumir formas menores para observar o mundo sem serem notados. Preferem ser deixados em paz, mas reagem com crueldade fria a quem invade seu território."
 },
 "soproAnimado": {
  "id": "soproAnimado",
  "tipo": "elemental",
  "name": "Sopro Animado",
  "nomeOriginal": "Animated Breath",
  "fonte": "FTD",
  "size": "grande",
  "level": 5,
  "cr": "6",
  "xp": 2300,
  "abilities": {
   "str": 19,
   "dex": 11,
   "con": 18,
   "int": 6,
   "wis": 10,
   "cha": 5
  },
  "ac": 15,
  "acNote": "armadura natural; 17 apenas na forma de frio",
  "maxHp": 95,
  "hpDice": "10d10+40",
  "speedFt": 30,
  "flyFt": 30,
  "hover": true,
  "speeds": {
   "flyFt": 30
  },
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [
   "exausto",
   "paralisado",
   "petrificado",
   "envenenado",
   "contido",
   "inconsciente"
  ],
  "attacks": [
   {
    "name": "Pancada",
    "bonus": 7,
    "damage": "2d10",
    "type": "energético",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Pancada",
    "Pancada"
   ]
  },
  "acoesEspeciais": [
   {
    "nome": "Explosão de Relâmpago",
    "tipo": "teleporte",
    "alcanceFt": 30,
    "danoAoChegar": {
     "raioFt": 5,
     "dano": "1d6",
     "tipo": "elétrico"
    },
    "bonus": true
   }
  ],
  "aura": {
   "raioFt": 5,
   "quando": "inicioDoAlvo",
   "save": "con",
   "dc": 15,
   "damage": "1d6",
   "damageType": "ácido",
   "condition": "envenenado",
   "rounds": 1
  },
  "corpoQuente": {
   "damage": "1d6",
   "type": "fogo"
  },
  "traits": [
   "t_formaCromatica",
   "aura"
  ],
  "blurb": "Golpeia duas vezes por turno com pancadas que somam dano do elemento do dragão que o criou. Dependendo da forma, queima, envenena quem fica perto ou salta pelo campo como um relâmpago.",
  "lore": "Dragões cromáticos experientes aprendem a puxar energia dos Planos Elementais e moldar o próprio sopro numa criatura bípede. Esses elementais costumam vigiar tesouros ou vasculhar os arredores do covil atrás de riquezas para o mestre. A aparência reflete o dragão de origem: chamas vivas para o vermelho, uma massa líquida e fétida para o negro, nuvens de gás verde para o verde, uma estátua de gelo envolta em vento gélido para o branco. O do dragão azul é um vulto de raios crepitantes que some e reaparece de repente."
 },
 "aspectoDeBahamut": {
  "id": "aspectoDeBahamut",
  "tipo": "dragão",
  "name": "Aspecto de Bahamut",
  "nomeOriginal": "Aspect of Bahamut",
  "fonte": "FTD",
  "size": "imenso",
  "level": 29,
  "cr": "30",
  "xp": 155000,
  "abilities": {
   "str": 30,
   "dex": 18,
   "con": 29,
   "int": 25,
   "wis": 28,
   "cha": 30
  },
  "ac": 23,
  "acNote": "armadura natural",
  "maxHp": 585,
  "hpDice": "30d20+270",
  "speedFt": 60,
  "flyFt": 120,
  "speeds": {
   "flyFt": 120,
   "swimFt": 60,
   "burrowFt": 60
  },
  "senses": {
   "passivePerception": 28,
   "truesightFt": 120
  },
  "saves": [
   "con",
   "int",
   "wis",
   "cha"
  ],
  "skills": [
   "intuicao",
   "percepcao",
   "persuasao"
  ],
  "expertise": [],
  "damageImmunities": [
   "ácido",
   "frio",
   "fogo",
   "elétrico",
   "radiante",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageImmunitiesNote": "só de armas não mágicas",
  "conditionImmunities": [
   "enfeitiçado",
   "surdo",
   "amedrontado",
   "paralisado",
   "atordoado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 19,
    "damage": "2d12+10",
    "type": "perfurante",
    "reachFt": 20,
    "danoExtra": {
     "damage": "4d10",
     "type": "energético"
    }
   },
   {
    "name": "Garra",
    "bonus": 19,
    "damage": "2d10+10",
    "type": "cortante",
    "reachFt": 15,
    "onHit": {
     "semResistencia": true,
     "dc": 20,
     "escape": 20,
     "condition": "contido",
     "note": "é agarrado",
     "maxAgarrados": 1
    }
   },
   {
    "name": "Cauda",
    "bonus": 19,
    "damage": "2d12+10",
    "type": "concussão",
    "reachFt": 15,
    "onHit": {
     "save": "str",
     "dc": 27,
     "condition": "caido",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida",
    "Garra",
    "Cauda"
   ]
  },
  "breath": {
   "name": "Arma de Sopro",
   "kind": "save",
   "shape": "cone",
   "areaFt": 300,
   "save": "dex",
   "dc": 26,
   "damage": "12d10",
   "damageType": "radiante",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    5,
    6
   ]
  },
  "recursos": {
   "resistenciaLendaria": 5
  },
  "despertar": {
   "pv": 500
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Ataque",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Garra"
    },
    {
     "nome": "Mordida Furiosa",
     "custo": 2,
     "tipo": "golpe",
     "arma": "Mordida"
    }
   ]
  },
  "traits": [
   "despertar",
   "t_mudarDeForma",
   "acoesLendarias"
  ],
  "marcas": [
   "metallic"
  ],
  "blurb": "Um dragão divino colossal que morde, rasga e varre com a cauda a grande distância, além de soprar chamas radiantes num cone gigantesco ou curar e reviver aliados. Ao cair a 0 PV, volta com 500 PV e libera ações míticas devastadoras.",
  "lore": "O Dragão de Platina é o pai e protetor dos dragões metálicos, venerado como deus nos Sete Céus do Monte Celestia. Só em crises extremas, e diante de um sacrifício enorme de um devoto, ele envia ao mundo um aspecto físico que carrega sua vontade e boa parte de seu poder. Essa manifestação supera em tamanho os dragões anciões e mistura traços dos cinco tipos metálicos em escamas de platina. Também gosta de andar disfarçado como sábio, monge ou pássaro, muitas vezes acompanhado de sete dragões de ouro anciões em forma de canários. Em batalha, é implacável com os inimigos e generoso com os aliados."
 },
 "aspectoDeTiamat": {
  "id": "aspectoDeTiamat",
  "tipo": "dragão",
  "name": "Aspecto de Tiamat",
  "nomeOriginal": "Aspect of Tiamat",
  "fonte": "FTD",
  "size": "imenso",
  "level": 29,
  "cr": "30",
  "xp": 155000,
  "abilities": {
   "str": 30,
   "dex": 14,
   "con": 30,
   "int": 21,
   "wis": 20,
   "cha": 26
  },
  "ac": 23,
  "acNote": "armadura natural",
  "maxHp": 574,
  "hpDice": "28d20+280",
  "speedFt": 60,
  "flyFt": 120,
  "speeds": {
   "flyFt": 120,
   "swimFt": 60,
   "burrowFt": 60
  },
  "senses": {
   "passivePerception": 33,
   "truesightFt": 120
  },
  "saves": [
   "dex",
   "con",
   "wis",
   "cha"
  ],
  "skills": [
   "intimidacao",
   "percepcao"
  ],
  "expertise": [
   "intimidacao",
   "percepcao"
  ],
  "damageImmunities": [
   "ácido",
   "frio",
   "fogo",
   "elétrico",
   "veneno",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageImmunitiesNote": "só de armas não mágicas",
  "conditionImmunities": [
   "cego",
   "enfeitiçado",
   "surdo",
   "amedrontado",
   "envenenado",
   "atordoado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 19,
    "damage": "2d12+10",
    "type": "perfurante",
    "reachFt": 20,
    "danoExtra": {
     "damage": "3d12",
     "type": "energético"
    }
   },
   {
    "name": "Garra",
    "bonus": 19,
    "damage": "2d10+10",
    "type": "cortante",
    "reachFt": 15,
    "onHit": {
     "semResistencia": true,
     "dc": 20,
     "escape": 20,
     "condition": "contido",
     "note": "é agarrado",
     "maxAgarrados": 1
    }
   },
   {
    "name": "Cauda",
    "bonus": 19,
    "damage": "2d12+10",
    "type": "concussão",
    "reachFt": 15,
    "onHit": {
     "save": "str",
     "dc": 27,
     "condition": "caido",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida",
    "Garra",
    "Cauda"
   ]
  },
  "recursos": {
   "resistenciaLendaria": 5
  },
  "acoesEspeciais": [
   {
    "nome": "Chamas Cromáticas",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 300,
    "save": "dex",
    "dc": 27,
    "damage": "11d12",
    "damageType": "ácido",
    "halfOnSave": true
   }
  ],
  "despertar": {
   "pv": 500
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Ataque",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Garra"
    },
    {
     "nome": "Mordida Furiosa",
     "custo": 2,
     "tipo": "golpe",
     "arma": "Mordida"
    }
   ]
  },
  "traits": [
   "despertar",
   "acoesLendarias"
  ],
  "marcas": [
   "chromatic"
  ],
  "blurb": "Colosso de cinco cabeças que morde, agarra e derruba com cauda enquanto cospe chamas cromáticas num cone gigantesco. Ao chegar a 0 PV ela volta com 500 PV e ganha ações míticas devastadoras.",
  "lore": "Tiamat é a mãe dos dragões cromáticos e reúne em si todos os vícios dessa linhagem. Ela vive presa, ou talvez por vontade própria, em Avernus, a primeira camada dos Nove Infernos. Seguidores sedentos de poder podem sacrificar um tesouro digno de dragões anciões para que ela projete seu aspecto no Plano Material. Essa manifestação tem cinco cabeças, cada uma com a cor e o temperamento de um dragão cromático, e percorre o mundo saqueando riquezas e esmagando quem se opuser."
 },
 "grandeSerpeNegra": {
  "id": "grandeSerpeNegra",
  "tipo": "dragão",
  "name": "Grande Serpe Negra",
  "nomeOriginal": "Black Greatwyrm",
  "fonte": "FTD",
  "size": "imenso",
  "level": 25,
  "cr": "27",
  "xp": 105000,
  "abilities": {
   "str": 30,
   "dex": 14,
   "con": 30,
   "int": 21,
   "wis": 20,
   "cha": 26
  },
  "ac": 22,
  "acNote": "armadura natural",
  "maxHp": 533,
  "hpDice": "26d20+260",
  "speedFt": 60,
  "flyFt": 120,
  "speeds": {
   "flyFt": 120,
   "swimFt": 60,
   "burrowFt": 60
  },
  "senses": {
   "passivePerception": 31,
   "truesightFt": 120
  },
  "saves": [
   "dex",
   "con",
   "wis",
   "cha"
  ],
  "skills": [
   "intimidacao",
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "ácido"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "amedrontado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 18,
    "damage": "2d10+10",
    "type": "perfurante",
    "reachFt": 15,
    "danoExtra": {
     "damage": "2d12",
     "type": "energético"
    }
   },
   {
    "name": "Garra",
    "bonus": 18,
    "damage": "2d8+10",
    "type": "cortante",
    "reachFt": 10,
    "onHit": {
     "semResistencia": true,
     "dc": 20,
     "escape": 20,
     "condition": "contido",
     "note": "é agarrado",
     "maxAgarrados": 1
    }
   },
   {
    "name": "Cauda",
    "bonus": 18,
    "damage": "2d8+10",
    "type": "concussão",
    "reachFt": 20,
    "onHit": {
     "save": "str",
     "dc": 26,
     "condition": "caido",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida",
    "Garra",
    "Garra"
   ]
  },
  "recursos": {
   "resistenciaLendaria": 4
  },
  "acoesEspeciais": [
   {
    "nome": "Sopro",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 300,
    "save": "dex",
    "dc": 26,
    "damage": "12d12",
    "damageType": "ácido",
    "halfOnSave": true
   }
  ],
  "despertar": {
   "pv": 425
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Ataque",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Garra"
    },
    {
     "nome": "Ataque de Asas",
     "custo": 2,
     "tipo": "area",
     "raioFt": 30,
     "save": "dex",
     "dc": 26,
     "damage": "2d6+10",
     "damageType": "concussão",
     "halfOnSave": false,
     "condition": "caido",
     "rounds": 10,
     "repete": false
    },
    {
     "nome": "Lança Arcana",
     "custo": 3,
     "tipo": "lancas",
     "n": 4,
     "alcanceFt": 120,
     "damage": "1d8+8",
     "damageType": "energético"
    }
   ]
  },
  "traits": [
   "despertar",
   "t_naturezaIncomum",
   "acoesLendarias"
  ],
  "marcas": [
   "chromatic"
  ],
  "blurb": "Colosso dracônico que agarra e despedaça com garras e mordida, e derrete grupos inteiros com um cone de ácido de 90 m. Ao cair a 0 PV, desperta, recupera vida e sopro e ganha ações míticas.",
  "lore": "As grandes serpes cromáticas são dragões que viveram tanto que transcenderam a idade ancestral, tornando-se forças quase divinas. A grande serpe negra é cruel e caótica, reinando sobre pântanos pútridos e ruínas alagadas onde tudo apodrece. Não precisa comer nem beber e passa séculos acumulando poder e servos. Enxerga a verdade de tudo à sua volta e raramente é pega de surpresa."
 },
 "grandeWyrmAzul": {
  "id": "grandeWyrmAzul",
  "tipo": "dragão",
  "name": "Grande Wyrm Azul",
  "nomeOriginal": "Blue Greatwyrm",
  "fonte": "FTD",
  "size": "imenso",
  "level": 25,
  "cr": "27",
  "xp": 105000,
  "abilities": {
   "str": 30,
   "dex": 14,
   "con": 30,
   "int": 21,
   "wis": 20,
   "cha": 26
  },
  "ac": 22,
  "acNote": "armadura natural",
  "maxHp": 533,
  "hpDice": "26d20+260",
  "speedFt": 60,
  "flyFt": 120,
  "speeds": {
   "flyFt": 120,
   "swimFt": 60,
   "burrowFt": 60
  },
  "senses": {
   "passivePerception": 31,
   "truesightFt": 120
  },
  "saves": [
   "dex",
   "con",
   "wis",
   "cha"
  ],
  "skills": [
   "intimidacao",
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "elétrico"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "amedrontado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 18,
    "damage": "2d10+10",
    "type": "perfurante",
    "reachFt": 15,
    "danoExtra": {
     "damage": "2d12",
     "type": "energético"
    }
   },
   {
    "name": "Garra",
    "bonus": 18,
    "damage": "2d8+10",
    "type": "cortante",
    "reachFt": 10,
    "onHit": {
     "semResistencia": true,
     "dc": 20,
     "escape": 20,
     "condition": "contido",
     "note": "é agarrado",
     "maxAgarrados": 1
    }
   },
   {
    "name": "Cauda",
    "bonus": 18,
    "damage": "2d8+10",
    "type": "concussão",
    "reachFt": 20,
    "onHit": {
     "save": "str",
     "dc": 26,
     "condition": "caido",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida",
    "Garra",
    "Garra"
   ]
  },
  "recursos": {
   "resistenciaLendaria": 4
  },
  "acoesEspeciais": [
   {
    "nome": "Sopro",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 300,
    "save": "dex",
    "dc": 26,
    "damage": "12d12",
    "damageType": "elétrico",
    "halfOnSave": true
   }
  ],
  "despertar": {
   "pv": 425
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Ataque",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Garra"
    },
    {
     "nome": "Ataque com Asas",
     "custo": 2,
     "tipo": "area",
     "raioFt": 30,
     "save": "dex",
     "dc": 26,
     "damage": "2d6+10",
     "damageType": "concussão",
     "halfOnSave": false,
     "condition": "caido",
     "rounds": 10,
     "repete": false
    },
    {
     "nome": "Lança Arcana",
     "custo": 3,
     "tipo": "lancas",
     "n": 4,
     "alcanceFt": 120,
     "damage": "1d8+8",
     "damageType": "energético"
    }
   ]
  },
  "traits": [
   "despertar",
   "t_naturezaIncomum",
   "acoesLendarias"
  ],
  "marcas": [
   "chromatic"
  ],
  "blurb": "Colosso voador que agarra com as garras, derruba com a cauda e devasta áreas enormes com um sopro elétrico em cone de 90 m. Ao cair a 0 PV pela primeira vez, desperta com 425 PV e ganha ações míticas.",
  "lore": "Os grandes wyrms são dragões cromáticos que alcançaram um poder quase divino, muito além dos anciões comuns. O azul domina desertos e tempestades, e sua energia elétrica parece responder à sua vontade. Não precisa comer nem beber, e dedica seus séculos a planos de dominação e à guarda de tesouros lendários. Quem o enfrenta descobre que derrubá-lo uma vez não basta, pois sua essência cromática o reergue ainda mais furioso."
 },
 "grandeWyrmDeLatao": {
  "id": "grandeWyrmDeLatao",
  "tipo": "dragão",
  "name": "Grande Wyrm de Latão",
  "nomeOriginal": "Brass Greatwyrm",
  "fonte": "FTD",
  "size": "imenso",
  "level": 25,
  "cr": "28",
  "xp": 120000,
  "abilities": {
   "str": 30,
   "dex": 16,
   "con": 29,
   "int": 21,
   "wis": 22,
   "cha": 30
  },
  "ac": 22,
  "acNote": "armadura natural",
  "maxHp": 565,
  "hpDice": "29d20+261",
  "speedFt": 60,
  "flyFt": 120,
  "speeds": {
   "flyFt": 120,
   "swimFt": 60,
   "burrowFt": 60
  },
  "senses": {
   "passivePerception": 32,
   "truesightFt": 120
  },
  "saves": [
   "dex",
   "con",
   "int",
   "wis",
   "cha"
  ],
  "skills": [
   "intuicao",
   "percepcao",
   "persuasao"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "fogo"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "amedrontado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 18,
    "damage": "2d10+10",
    "type": "perfurante",
    "reachFt": 15,
    "danoExtra": {
     "damage": "2d12",
     "type": "energético"
    }
   },
   {
    "name": "Garra",
    "bonus": 18,
    "damage": "2d8+10",
    "type": "cortante",
    "reachFt": 10,
    "onHit": {
     "semResistencia": true,
     "dc": 20,
     "escape": 20,
     "condition": "contido",
     "note": "é agarrado",
     "maxAgarrados": 1
    }
   },
   {
    "name": "Cauda",
    "bonus": 18,
    "damage": "2d10+10",
    "type": "concussão",
    "reachFt": 20,
    "onHit": {
     "save": "str",
     "dc": 26,
     "condition": "caido",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida",
    "Garra",
    "Garra"
   ]
  },
  "breath": {
   "name": "Arma de Sopro",
   "kind": "save",
   "shape": "cone",
   "areaFt": 300,
   "save": "dex",
   "dc": 25,
   "damage": "13d12",
   "damageType": "fogo",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    5,
    6
   ]
  },
  "recursos": {
   "resistenciaLendaria": 4
  },
  "despertar": {
   "pv": 450
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Ataque",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Garra"
    },
    {
     "nome": "Ataque de Asas",
     "custo": 2,
     "tipo": "area",
     "raioFt": 30,
     "save": "dex",
     "dc": 26,
     "damage": "2d6+10",
     "damageType": "concussão",
     "halfOnSave": false,
     "condition": "caido",
     "rounds": 10,
     "repete": false
    }
   ]
  },
  "traits": [
   "t_mudarDeForma",
   "despertar",
   "t_naturezaIncomum",
   "acoesLendarias"
  ],
  "marcas": [
   "metallic"
  ],
  "blurb": "Colosso dracônico que esmaga com mordida, garras e cauda e pode fazer grupos inteiros desmaiarem com seu sopro de gás num cone de 90 m. Ao cair a 0 PV, desperta seu poder metálico e volta à luta com 450 PV e um rugido que incapacita.",
  "lore": "Os grandes wyrms de latão são dragões metálicos de idade quase mítica, que alcançaram um poder muito além dos dragões anciões. Costumam ser falantes e curiosos, preferindo a conversa e a negociação ao combate. Não precisam comer nem beber, e muitas vezes passeiam entre os povos menores disfarçados de pessoas comuns. Quando enfim lutam, revelam uma força avassaladora e uma vontade férrea de proteger o que valorizam."
 },
 "grandeWyrmDeBronze": {
  "id": "grandeWyrmDeBronze",
  "tipo": "dragão",
  "name": "Grande Wyrm de Bronze",
  "nomeOriginal": "Bronze Greatwyrm",
  "fonte": "FTD",
  "size": "imenso",
  "level": 25,
  "cr": "28",
  "xp": 120000,
  "abilities": {
   "str": 30,
   "dex": 16,
   "con": 29,
   "int": 21,
   "wis": 22,
   "cha": 30
  },
  "ac": 22,
  "acNote": "armadura natural",
  "maxHp": 565,
  "hpDice": "29d20+261",
  "speedFt": 60,
  "flyFt": 120,
  "speeds": {
   "flyFt": 120,
   "swimFt": 60,
   "burrowFt": 60
  },
  "senses": {
   "passivePerception": 32,
   "truesightFt": 120
  },
  "saves": [
   "dex",
   "con",
   "int",
   "wis",
   "cha"
  ],
  "skills": [
   "intuicao",
   "percepcao",
   "persuasao"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "elétrico"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "amedrontado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 18,
    "damage": "2d10+10",
    "type": "perfurante",
    "reachFt": 15,
    "danoExtra": {
     "damage": "2d12",
     "type": "energético"
    }
   },
   {
    "name": "Garra",
    "bonus": 18,
    "damage": "2d8+10",
    "type": "cortante",
    "reachFt": 10,
    "onHit": {
     "semResistencia": true,
     "dc": 20,
     "escape": 20,
     "condition": "contido",
     "note": "é agarrado",
     "maxAgarrados": 1
    }
   },
   {
    "name": "Cauda",
    "bonus": 18,
    "damage": "2d10+10",
    "type": "concussão",
    "reachFt": 20,
    "onHit": {
     "save": "str",
     "dc": 26,
     "condition": "caido",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida",
    "Garra",
    "Garra"
   ]
  },
  "breath": {
   "name": "Sopro",
   "kind": "save",
   "shape": "cone",
   "areaFt": 300,
   "save": "dex",
   "dc": 25,
   "damage": "13d12",
   "damageType": "elétrico",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    5,
    6
   ]
  },
  "recursos": {
   "resistenciaLendaria": 4
  },
  "despertar": {
   "pv": 450
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Ataque",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Garra"
    },
    {
     "nome": "Ataque de Asas",
     "custo": 2,
     "tipo": "area",
     "raioFt": 30,
     "save": "dex",
     "dc": 26,
     "damage": "2d6+10",
     "damageType": "concussão",
     "halfOnSave": false,
     "condition": "caido",
     "rounds": 10,
     "repete": false
    }
   ]
  },
  "traits": [
   "t_mudarDeForma",
   "despertar",
   "t_naturezaIncomum",
   "acoesLendarias"
  ],
  "marcas": [
   "metallic"
  ],
  "blurb": "Colosso dracônico que esmaga com mordida, garras e cauda e varre o campo com um sopro elétrico ou um gás que faz dormir em cones de 90 m. Ao cair a 0 PV, desperta com 450 PV e ganha ações míticas.",
  "lore": "Os grandes wyrms de bronze são dragões metálicos de idade lendária, guardiões ordeiros e benevolentes que já transcenderam a necessidade de comer ou beber. Vivem perto de costas e mares, nadando e escavando com a mesma facilidade com que voam. Costumam observar o mundo disfarçados em formas pequenas, intervindo contra tiranias e ameaças à ordem. Quando enfrentam um inimigo digno, uma centelha de poder ancestral pode despertar neles, tornando-os ainda mais temíveis."
 },
 "grandeSerpeDeCobre": {
  "id": "grandeSerpeDeCobre",
  "tipo": "dragão",
  "name": "Grande Serpe de Cobre",
  "nomeOriginal": "Copper Greatwyrm",
  "fonte": "FTD",
  "size": "imenso",
  "level": 25,
  "cr": "28",
  "xp": 120000,
  "abilities": {
   "str": 30,
   "dex": 16,
   "con": 29,
   "int": 21,
   "wis": 22,
   "cha": 30
  },
  "ac": 22,
  "acNote": "armadura natural",
  "maxHp": 565,
  "hpDice": "29d20+261",
  "speedFt": 60,
  "flyFt": 120,
  "speeds": {
   "flyFt": 120,
   "swimFt": 60,
   "burrowFt": 60
  },
  "senses": {
   "passivePerception": 32,
   "truesightFt": 120
  },
  "saves": [
   "dex",
   "con",
   "int",
   "wis",
   "cha"
  ],
  "skills": [
   "intuicao",
   "percepcao",
   "persuasao"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "ácido"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "amedrontado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 18,
    "damage": "2d10+10",
    "type": "perfurante",
    "reachFt": 15,
    "danoExtra": {
     "damage": "2d12",
     "type": "energético"
    }
   },
   {
    "name": "Garra",
    "bonus": 18,
    "damage": "2d8+10",
    "type": "cortante",
    "reachFt": 10,
    "onHit": {
     "semResistencia": true,
     "dc": 20,
     "escape": 20,
     "condition": "contido",
     "note": "é agarrado",
     "maxAgarrados": 1
    }
   },
   {
    "name": "Cauda",
    "bonus": 18,
    "damage": "2d10+10",
    "type": "concussão",
    "reachFt": 20,
    "onHit": {
     "save": "str",
     "dc": 26,
     "condition": "caido",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida",
    "Garra",
    "Garra"
   ]
  },
  "breath": {
   "name": "Arma de Sopro",
   "kind": "save",
   "shape": "cone",
   "areaFt": 300,
   "save": "dex",
   "dc": 25,
   "damage": "13d12",
   "damageType": "ácido",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    5,
    6
   ]
  },
  "recursos": {
   "resistenciaLendaria": 4
  },
  "despertar": {
   "pv": 450
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Ataque",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Garra"
    },
    {
     "nome": "Ataque de Asas",
     "custo": 2,
     "tipo": "area",
     "raioFt": 30,
     "save": "dex",
     "dc": 26,
     "damage": "2d6+10",
     "damageType": "concussão",
     "halfOnSave": false,
     "condition": "caido",
     "rounds": 10,
     "repete": false
    }
   ]
  },
  "traits": [
   "t_mudarDeForma",
   "despertar",
   "t_naturezaIncomum",
   "acoesLendarias"
  ],
  "marcas": [
   "metallic"
  ],
  "blurb": "Dragão colossal que agarra com as garras, derruba com a cauda e varre o campo com um cone de 90 m de ácido ou de gás que faz dormir. Ao chegar a 0 PV, desperta seu poder metálico, volta com 450 PV e ganha ações míticas.",
  "lore": "As grandes serpes são dragões que atingiram um estágio de poder quase divino, muito além da velhice comum da espécie. A de cobre conserva o humor e a astúcia de sua linhagem, mas agora tem a sabedoria de eras. Costuma andar disfarçada em forma pequena entre os mortais, observando e conversando. Quando luta de verdade, é uma força da natureza difícil de derrubar."
 },
 "filhoteDeDragaoDeCristal": {
  "id": "filhoteDeDragaoDeCristal",
  "tipo": "dragão",
  "name": "Filhote de Dragão de Cristal",
  "nomeOriginal": "Crystal Dragon Wyrmling",
  "fonte": "FTD",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 14,
   "dex": 12,
   "con": 14,
   "int": 14,
   "wis": 13,
   "cha": 15
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 32,
  "hpDice": "5d8+10",
  "speedFt": 30,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60,
   "climbFt": 30,
   "burrowFt": 15
  },
  "senses": {
   "passivePerception": 15,
   "blindsightFt": 10,
   "darkvisionFt": 60
  },
  "saves": [
   "dex",
   "con",
   "wis",
   "cha"
  ],
  "skills": [
   "percepcao",
   "furtividade",
   "sobrevivencia"
  ],
  "expertise": [
   "percepcao",
   "furtividade"
  ],
  "damageResistances": [
   "frio",
   "radiante"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 4,
    "damage": "1d10+2",
    "type": "perfurante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "1d4",
     "type": "radiante"
    }
   }
  ],
  "breath": {
   "name": "Sopro Cintilante",
   "kind": "save",
   "shape": "cone",
   "areaFt": 15,
   "save": "con",
   "dc": 12,
   "damage": "4d8",
   "damageType": "radiante",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    5,
    6
   ]
  },
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "luzesDancantes",
    "orientacao"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "aVontade": [
    "luzesDancantes",
    "orientacao"
   ]
  },
  "traits": [],
  "marcas": [
   "gem"
  ],
  "blurb": "Morde com alcance de 3 m somando dano radiante e solta um cone ofuscante de luz que fere quem estiver à frente e ainda lhe dá PV temporários. Voa, escala e cava, o que o torna difícil de encurralar.",
  "lore": "Dragões de cristal pertencem à família dos dragões de gema, criaturas de mente psiônica e temperamento caótico, porém curioso. Os filhotes costumam se instalar em cavernas geladas ou grutas cheias de cristais, onde a luz refletida os esconde. São brincalhões e falam com outros seres por telepatia, gostando de observar e testar visitantes. Mesmo jovens, já colecionam pedras brilhantes e reagem com fúria luminosa quando ameaçados."
 },
 "grandeSerpeDeCristal": {
  "id": "grandeSerpeDeCristal",
  "tipo": "dragão",
  "name": "Grande Serpe de Cristal",
  "nomeOriginal": "Crystal Greatwyrm",
  "fonte": "FTD",
  "size": "imenso",
  "level": 25,
  "cr": "26",
  "xp": 90000,
  "abilities": {
   "str": 28,
   "dex": 14,
   "con": 29,
   "int": 30,
   "wis": 24,
   "cha": 25
  },
  "ac": 21,
  "acNote": "armadura natural",
  "maxHp": 507,
  "hpDice": "26d20+234",
  "speedFt": 60,
  "flyFt": 120,
  "hover": true,
  "speeds": {
   "flyFt": 120,
   "swimFt": 60,
   "burrowFt": 60
  },
  "senses": {
   "passivePerception": 25,
   "truesightFt": 120
  },
  "saves": [
   "dex",
   "con",
   "wis",
   "cha"
  ],
  "skills": [
   "arcanismo",
   "historia",
   "percepcao"
  ],
  "expertise": [
   "arcanismo"
  ],
  "damageImmunities": [
   "radiante"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "amedrontado",
   "envenenado",
   "caido"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 17,
    "damage": "2d10+9",
    "type": "perfurante",
    "reachFt": 15,
    "danoExtra": {
     "damage": "3d10",
     "type": "energético"
    }
   },
   {
    "name": "Garra",
    "bonus": 17,
    "damage": "2d8+9",
    "type": "cortante",
    "reachFt": 10,
    "onHit": {
     "semResistencia": true,
     "dc": 19,
     "escape": 19,
     "condition": "contido",
     "note": "é agarrado",
     "maxAgarrados": 1
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida",
    "Garra",
    "Garra"
   ]
  },
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "dissiparMagia",
    "jaulaDeEnergia",
    "viagemPlanar",
    "inverterAGravidade",
    "pararOTempo"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "dissiparMagia": 1,
    "jaulaDeEnergia": 1,
    "viagemPlanar": 1,
    "inverterAGravidade": 1,
    "pararOTempo": 1
   },
   "cdPorMagia": {
    "dissiparMagia": 26,
    "jaulaDeEnergia": 26,
    "viagemPlanar": 26,
    "inverterAGravidade": 26,
    "pararOTempo": 26
   }
  },
  "recursos": {
   "resistenciaLendaria": 4
  },
  "acoesEspeciais": [
   {
    "nome": "Sopro",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 300,
    "save": "dex",
    "dc": 25,
    "damage": "11d12",
    "damageType": "energético",
    "halfOnSave": true,
    "condition": "caido",
    "rounds": 1,
    "repete": false,
    "ateFimDoTurnoDele": true
   },
   {
    "nome": "Telecinese em Massa",
    "tipo": "area",
    "shape": "raio",
    "areaFt": 120,
    "save": "str",
    "dc": 26,
    "damage": "7d12",
    "damageType": "energético",
    "halfOnSave": false,
    "condition": "contido",
    "rounds": 10,
    "repete": true
   },
   {
    "nome": "Passo Psíquico",
    "tipo": "teleporte",
    "alcanceFt": 60,
    "bonus": true
   }
  ],
  "despertar": {
   "pv": 400
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Garra",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Garra"
    },
    {
     "nome": "Psiônica",
     "custo": 2,
     "tipo": "magia"
    },
    {
     "nome": "Raio Psíquico",
     "custo": 3,
     "tipo": "linha",
     "comprimentoFt": 90,
     "larguraFt": 10,
     "save": "int",
     "dc": 26,
     "damage": "5d10",
     "damageType": "psíquico",
     "halfOnSave": true
    }
   ]
  },
  "traits": [
   "despertar",
   "t_naturezaIncomum",
   "t_mudarDeForma",
   "acoesLendarias"
  ],
  "marcas": [
   "gem"
  ],
  "blurb": "Colosso psiônico que esmaga grupos com um cone de força de 90 m, prende vítimas nas garras e se teleporta pelo campo. Ao cair a 0 PV, desperta com 400 PV e passa a arremessar todos ao redor com telecinese em massa.",
  "lore": "As grandes serpes de cristal estão entre os dragões de gema mais antigos, mentes vastas que cruzaram eras estudando os mistérios da consciência e da magia. Sem precisar comer nem beber, dedicam-se à contemplação e a planos de longo prazo, muitas vezes ocultas sob forma humanoide. Raramente lutam por impulso, mas, quando provocadas, distorcem o próprio tempo e o espaço contra os inimigos. Derrotar uma delas exige vencê-la duas vezes, pois sua gema interior reacende quando o corpo parece prestes a ceder."
 },
 "filhoteDeDragaoProfundo": {
  "id": "filhoteDeDragaoProfundo",
  "tipo": "dragão",
  "name": "Filhote de Dragão Profundo",
  "nomeOriginal": "Deep Dragon Wyrmling",
  "fonte": "FTD",
  "size": "médio",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 14,
   "dex": 11,
   "con": 12,
   "int": 11,
   "wis": 12,
   "cha": 13
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 27,
  "hpDice": "5d8+5",
  "speedFt": 30,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60,
   "swimFt": 30,
   "burrowFt": 15
  },
  "senses": {
   "passivePerception": 13,
   "blindsightFt": 10,
   "darkvisionFt": 90
  },
  "saves": [
   "dex",
   "con",
   "wis",
   "cha"
  ],
  "skills": [
   "percepcao",
   "persuasao",
   "furtividade"
  ],
  "expertise": [
   "furtividade"
  ],
  "damageResistances": [
   "veneno",
   "psíquico"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "amedrontado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 4,
    "damage": "1d10+2",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "acoesEspeciais": [
   {
    "nome": "Sopro de Pesadelo",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 15,
    "save": "wis",
    "dc": 11,
    "damage": "1d10",
    "damageType": "psíquico",
    "halfOnSave": true,
    "condition": "amedrontado",
    "rounds": 10,
    "repete": true
   }
  ],
  "traits": [],
  "blurb": "Pequeno dragão do Subterrâneo que morde com força e solta uma nuvem de esporos capaz de causar dano psíquico e deixar os inimigos amedrontados. Voa, nada e escava, então pode atacar de onde ninguém espera.",
  "lore": "Os dragões profundos nascem nas cavernas escuras do Subterrâneo, longe de qualquer luz do sol. Mesmo jovens, já são astutos e preferem a manipulação e a emboscada a um confronto direto. Seus esporos trazem visões de pesadelo que abalam a mente de quem os respira. Costumam vagar por túneis e lagos subterrâneos em busca de tesouros e segredos."
 },
 "dracohidra": {
  "id": "dracohidra",
  "tipo": "monstruosidade",
  "name": "Dracohidra",
  "nomeOriginal": "Dracohydra",
  "fonte": "FTD",
  "size": "enorme",
  "level": 9,
  "cr": "11",
  "xp": 7200,
  "abilities": {
   "str": 20,
   "dex": 12,
   "con": 20,
   "int": 6,
   "wis": 12,
   "cha": 12
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 218,
  "hpDice": "19d12+95",
  "speedFt": 30,
  "flyFt": 30,
  "speeds": {
   "flyFt": 30,
   "swimFt": 30
  },
  "senses": {
   "passivePerception": 19,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "percepcao"
  ],
  "expertise": [
   "percepcao"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 9,
    "damage": "1d10+5",
    "type": "energético",
    "reachFt": 10
   }
  ],
  "multiattack": {
   "count": 2
  },
  "breath": {
   "name": "Sopro Prismático",
   "kind": "save",
   "shape": "cone",
   "areaFt": 60,
   "save": "dex",
   "dc": 17,
   "damage": "6d10",
   "damageType": "ácido",
   "tiposAEscolher": [
    "ácido",
    "frio",
    "fogo",
    "elétrico",
    "veneno"
   ],
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    4,
    5,
    6
   ]
  },
  "vantagemRacial": [
   {
    "nome": "Múltiplas Cabeças",
    "condicoes": [
     "cego",
     "enfeiticado",
     "surdo",
     "amedrontado",
     "atordoado",
     "inconsciente"
    ]
   }
  ],
  "motorDoLivro": {
   "cabecasReativas": {
    "nome": "Cabeças Reativas",
    "cabecas": 5
   }
  },
  "traits": [
   "t_multiplasCabecas",
   "t_cabecasReativas",
   "sempreAlerta"
  ],
  "blurb": "Morde uma vez por cabeça com dano elemental à sua escolha e cospe um cone prismático devastador; cada cabeça cortada pode virar duas, a menos que receba dano radiante.",
  "lore": "A dracohidra nasceu de experimentos arcanos que tentavam reproduzir o poder de Tiamat, fundindo magia de dragões cromáticos ao sangue de uma hidra. É um monstro alado de várias cabeças e caudas serpentinas. Sua fome é insaciável, pois cada cabeça exige sua própria refeição: ela esvazia a fauna de uma região e depois passa a ameaçar os povoados próximos. Às vezes serve ao conjurador que a criou, mantida obediente pelos rituais que lhe deram origem."
 },
 "draconianoCouracado": {
  "id": "draconianoCouracado",
  "tipo": "monstruosidade",
  "name": "Draconiano Couraçado",
  "nomeOriginal": "Draconian Dreadnought",
  "fonte": "FTD",
  "size": "grande",
  "level": 1,
  "cr": "4",
  "xp": 1100,
  "abilities": {
   "str": 18,
   "dex": 10,
   "con": 18,
   "int": 10,
   "wis": 10,
   "cha": 10
  },
  "ac": 16,
  "acNote": "armadura natural",
  "maxHp": 57,
  "hpDice": "6d10+24",
  "speedFt": 30,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60
  },
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 60
  },
  "saves": [
   "str",
   "wis"
  ],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Espada Serrilhada",
    "bonus": 6,
    "damage": "2d8+4",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Cauda",
    "bonus": 6,
    "damage": "1d8+4",
    "type": "concussão",
    "reachFt": 5,
    "onHit": {
     "save": "str",
     "dc": 14,
     "condition": "caido",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Espada Serrilhada",
    "Espada Serrilhada",
    "Cauda"
   ]
  },
  "explosaoAoMorrer": {
   "pes": 10,
   "save": "dex",
   "dc": 13,
   "dano": "3d6",
   "tipo": "fogo",
   "metade": false
  },
  "traits": [
   "explosaoAoMorrer",
   "t_rouboDeForma"
  ],
  "blurb": "Brutamontes alado que golpeia duas vezes com a espada serrilhada e derruba alvos com a cauda. Ao morrer, explode em chamas, então não fique colado nele no golpe final.",
  "lore": "Draconianos são criaturas nascidas de rituais sombrios que corrompem ovos de dragão, e o couraçado é a variedade mais pesada e robusta da linhagem. Serve como tropa de choque em exércitos de devotos de dragões malignos, avançando na linha de frente. Pode roubar a aparência de quem mata, infiltrando-se entre os inimigos disfarçado. Quando cai, seu corpo se desfaz em cinzas numa explosão de fogo."
 },
 "soldadoDeInfantariaDraconiano": {
  "id": "soldadoDeInfantariaDraconiano",
  "tipo": "monstruosidade",
  "name": "Soldado de Infantaria Draconiano",
  "nomeOriginal": "Draconian Foot Soldier",
  "fonte": "FTD",
  "size": "médio",
  "level": 1,
  "cr": "1/2",
  "xp": 100,
  "abilities": {
   "str": 13,
   "dex": 11,
   "con": 13,
   "int": 8,
   "wis": 8,
   "cha": 10
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 22,
  "hpDice": "4d8+4",
  "speedFt": 30,
  "senses": {
   "passivePerception": 9,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Espada Curta",
    "bonus": 3,
    "damage": "1d6+1",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Espada Curta",
    "Espada Curta"
   ]
  },
  "explosaoAoMorrer": {
   "pes": 5,
   "save": "con",
   "dc": 11,
   "condicao": "contido",
   "rounds": 10
  },
  "traits": [
   "t_quedaControlada",
   "explosaoAoMorrer"
  ],
  "blurb": "Ataca duas vezes com espadas curtas em combate próximo. Ao morrer, vira pedra e solta um gás que pode petrificar quem estiver colado nele.",
  "lore": "Draconianos são humanoides com traços de dragão, criados por magia sombria a partir de ovos de dragões metálicos corrompidos. Os soldados de infantaria formam a massa dos exércitos que servem a senhores dragões ambiciosos. Lutam em fileiras disciplinadas, obedecendo a comandantes mais fortes. Suas asas atrofiadas não permitem voar, mas amortecem quedas, e até a morte deles é uma arma contra quem os enfrenta."
 },
 "draconianoInfiltrador": {
  "id": "draconianoInfiltrador",
  "tipo": "monstruosidade",
  "name": "Draconiano Infiltrador",
  "nomeOriginal": "Draconian Infiltrator",
  "fonte": "FTD",
  "size": "médio",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 11,
   "dex": 17,
   "con": 14,
   "int": 9,
   "wis": 13,
   "cha": 11
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 39,
  "hpDice": "6d8+12",
  "speedFt": 40,
  "speeds": {
   "climbFt": 30
  },
  "senses": {
   "passivePerception": 13,
   "darkvisionFt": 60
  },
  "saves": [
   "dex"
  ],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "furtividade"
  ],
  "damageImmunities": [
   "veneno"
  ],
  "conditionImmunities": [
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Adaga",
    "bonus": 5,
    "damage": "1d4+3",
    "type": "perfurante",
    "reachFt": 5,
    "rangeFt": 20,
    "longRangeFt": 60,
    "danoExtra": {
     "damage": "2d6",
     "type": "veneno"
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Adaga",
    "Adaga"
   ]
  },
  "explosaoAoMorrer": {
   "pes": 5,
   "save": "dex",
   "dc": 12,
   "dano": "2d6",
   "tipo": "ácido",
   "metade": false
  },
  "traits": [
   "explosaoAoMorrer",
   "t_planar"
  ],
  "blurb": "Ágil e furtivo, ataca com duas adagas envenenadas; se ambas acertarem o mesmo alvo, pode deixá-lo envenenado e paralisado. Ao morrer, vira uma poça de ácido que respinga em quem está perto.",
  "lore": "Draconianos infiltradores são criaturas dracônicas criadas por meios mágicos para agir como espiões e assassinos. Esguios e silenciosos, escalam muros e planam de alturas para alcançar alvos importantes. Costumam servir a senhores malignos, coletando segredos e eliminando inimigos sem chamar atenção. Mesmo na morte continuam perigosos, desfazendo-se em ácido corrosivo."
 },
 "magoDraconiano": {
  "id": "magoDraconiano",
  "tipo": "monstruosidade",
  "name": "Mago Draconiano",
  "nomeOriginal": "Draconian Mage",
  "fonte": "FTD",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 14,
   "dex": 10,
   "con": 11,
   "int": 11,
   "wis": 10,
   "cha": 14
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 40,
  "hpDice": "9d8",
  "speedFt": 30,
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 60
  },
  "saves": [
   "int",
   "wis",
   "cha"
  ],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Tridente",
    "bonus": 4,
    "damage": "1d6+2",
    "type": "perfurante",
    "reachFt": 5,
    "rangeFt": 20,
    "longRangeFt": 60,
    "danoExtra": {
     "damage": "1d8+2",
     "type": "perfurante"
    }
   },
   {
    "name": "Raio Necrótico",
    "bonus": 4,
    "damage": "3d6",
    "type": "necrótico",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 60,
    "longRangeFt": 60
   }
  ],
  "multiattack": {
   "count": 2,
   "sequencias": [
    [
     "Tridente",
     "Tridente"
    ],
    [
     "Raio Necrótico",
     "Raio Necrótico"
    ]
   ]
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "aumentarReduzir",
    "invisibilidade",
    "nuvemFetida"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "aumentarReduzir": 1,
    "invisibilidade": 1,
    "nuvemFetida": 1
   },
   "cdPorMagia": {
    "aumentarReduzir": 12,
    "invisibilidade": 12,
    "nuvemFetida": 12
   }
  },
  "explosaoAoMorrer": {
   "pes": 10,
   "save": "dex",
   "dc": 10,
   "dano": "2d8",
   "tipo": "energético",
   "metade": false
  },
  "traits": [
   "explosaoAoMorrer",
   "t_planar"
  ],
  "blurb": "Dispara pares de raios necróticos à distância ou ataca com tridente, e pode ficar invisível, crescer ou soltar uma nuvem fétida. Ao morrer, seus ossos explodem e ferem quem estiver perto.",
  "lore": "Os draconianos são criaturas de aspecto dracônico criadas por magia sombria a partir de ovos de dragão corrompidos. Os magos da espécie servem como conjuradores nas tropas de exércitos malignos, apoiando os soldados com feitiços de engano e controle. Agem com astúcia e preferem atacar de longe, usando a invisibilidade para escapar ou surpreender. Até a morte deles é uma arma, pois o corpo se desfaz numa explosão de ossos."
 },
 "draconianoMentor": {
  "id": "draconianoMentor",
  "tipo": "monstruosidade",
  "name": "Draconiano Mentor",
  "nomeOriginal": "Draconian Mastermind",
  "fonte": "FTD",
  "size": "médio",
  "level": 5,
  "cr": "6",
  "xp": 2300,
  "abilities": {
   "str": 13,
   "dex": 14,
   "con": 16,
   "int": 15,
   "wis": 11,
   "cha": 17
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 67,
  "hpDice": "9d8+27",
  "speedFt": 35,
  "senses": {
   "passivePerception": 13,
   "truesightFt": 60
  },
  "saves": [
   "int",
   "wis",
   "cha"
  ],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "conditionImmunities": [
   "enfeitiçado"
  ],
  "attacks": [
   {
    "name": "Dilacerar",
    "bonus": 5,
    "damage": "1d6+2",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Raio de Energia",
    "bonus": 6,
    "damage": "1d10+3",
    "type": "energético",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 60,
    "longRangeFt": 60
   }
  ],
  "multiattack": {
   "count": 3,
   "sequencias": [
    [
     "Dilacerar",
     "Dilacerar",
     "Dilacerar"
    ],
    [
     "Raio de Energia",
     "Raio de Energia",
     "Raio de Energia"
    ]
   ]
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "dimensaoPorta",
    "disfarcarSe",
    "enviarMensagem",
    "invisibilidade",
    "maoMagica"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "dimensaoPorta": 2,
    "disfarcarSe": 2,
    "enviarMensagem": 2
   },
   "aVontade": [
    "invisibilidade",
    "maoMagica"
   ],
   "cdPorMagia": {
    "dimensaoPorta": 14,
    "disfarcarSe": 14,
    "enviarMensagem": 14,
    "invisibilidade": 14,
    "maoMagica": 14
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Sopro Nocivo",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 15,
    "save": "con",
    "dc": 14,
    "damage": "6d6",
    "damageType": "veneno",
    "halfOnSave": true,
    "condition": "exausto",
    "rounds": 100,
    "repete": false
   }
  ],
  "explosaoAoMorrer": {
   "pes": 30,
   "save": "dex",
   "dc": 14,
   "condicao": "atordoado",
   "rounds": 1,
   "dano": "2d8",
   "tipo": "elétrico",
   "metade": true
  },
  "apararBonus": 5,
  "apararTudo": true,
  "traits": [
   "explosaoAoMorrer",
   "aparar"
  ],
  "blurb": "Ataca de longe com três raios de energia ou de perto com garras, solta um sopro venenoso que causa exaustão e se protege com um escudo mágico. Ao morrer, explode em relâmpagos que podem atordoar quem estiver por perto.",
  "lore": "Draconianos mentores são a elite intelectual de sua raça, criaturas dracônicas nascidas por meio de magia sombria a partir de ovos de dragão corrompidos. Servem como estrategistas, espiões e conjuradores nos exércitos de seus senhores. Usam disfarces e invisibilidade para se infiltrar e manipular, preferindo planejar a lutar de frente. Mesmo na morte continuam perigosos, pois a magia que os anima se liberta de forma violenta."
 },
 "fragmentoDraconico": {
  "id": "fragmentoDraconico",
  "tipo": "morto-vivo",
  "name": "Fragmento Dracônico",
  "nomeOriginal": "Draconic Shard",
  "fonte": "FTD",
  "size": "enorme",
  "level": 17,
  "cr": "17",
  "xp": 18000,
  "abilities": {
   "str": 1,
   "dex": 12,
   "con": 18,
   "int": 22,
   "wis": 18,
   "cha": 22
  },
  "ac": 17,
  "acNote": "deflexão",
  "maxHp": 168,
  "hpDice": "16d12+64",
  "speedFt": 0,
  "flyFt": 80,
  "hover": true,
  "speeds": {
   "flyFt": 80
  },
  "senses": {
   "passivePerception": 26,
   "blindsightFt": 60,
   "darkvisionFt": 120
  },
  "saves": [
   "dex",
   "int",
   "wis",
   "cha"
  ],
  "skills": [
   "arcanismo",
   "historia",
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageResistances": [
   "ácido",
   "fogo",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "damageImmunities": [
   "frio",
   "necrótico",
   "veneno",
   "psíquico"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "exausto",
   "amedrontado",
   "agarrado",
   "paralisado",
   "petrificado",
   "envenenado",
   "caido"
  ],
  "attacks": [
   {
    "name": "Dilacerar Telecinético",
    "bonus": 12,
    "damage": "2d8+6",
    "type": "energético",
    "reachFt": 10
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Dilacerar Telecinético",
    "Dilacerar Telecinético"
   ]
  },
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "detectarPensamentos",
    "invisibilidade",
    "telecinesia"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "aVontade": [
    "detectarPensamentos",
    "invisibilidade",
    "telecinesia"
   ],
   "cdPorMagia": {
    "detectarPensamentos": 20,
    "invisibilidade": 20,
    "telecinesia": 20
   }
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "acoesEspeciais": [
   {
    "nome": "Esmagamento Psíquico",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "raio",
    "areaFt": 60,
    "save": "int",
    "dc": 20,
    "damage": "10d10",
    "damageType": "psíquico",
    "halfOnSave": true,
    "condition": "atordoado",
    "rounds": 1,
    "repete": false,
    "ateFimDoTurnoDele": true
   }
  ],
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Dilacerar",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Dilacerar Telecinético"
    },
    {
     "nome": "Conjurar Magia",
     "custo": 2,
     "tipo": "magia"
    },
    {
     "nome": "Pensamento Dominador",
     "custo": 2,
     "tipo": "alvo",
     "alcanceFt": 30,
     "save": "wis",
     "dc": 20,
     "condition": "enfeiticado",
     "rounds": 10,
     "repete": false
    }
   ]
  },
  "traits": [
   "t_habitarObjeto",
   "t_deflexao",
   "incorporealMovement",
   "t_rejuvenescimento",
   "t_naturezaIncomum",
   "acoesLendarias"
  ],
  "blurb": "Espírito psiônico que dilacera alvos com telecinesia a até 36 m e libera pulsos mentais capazes de atordoar grupos inteiros. Pode possuir objetos, controlar a mente de inimigos e retorna dias depois se sua gema não for destruída.",
  "lore": "Quando um dragão de gema poderoso morre, às vezes sua mente se recusa a partir e permanece como um eco psíquico. Esse fragmento aparece como uma imagem espectral e cintilante do dragão, mas costuma se abrigar em algum objeto do antigo tesouro, como uma arma. Dentro desse receptáculo, continua perseguindo as ambições que tinha em vida, às vezes se passando por um item mágico inteligente para guiar aventureiros. Derrotá-lo apenas o reduz a uma gema rachada, e só destruindo essa pedra ele encontra descanso."
 },
 "espiritoDraconico": {
  "id": "espiritoDraconico",
  "tipo": "dragão",
  "name": "Espírito Dracônico",
  "nomeOriginal": "Draconic Spirit",
  "fonte": "FTD",
  "size": "grande",
  "level": 1,
  "cr": "0",
  "xp": 10,
  "abilities": {
   "str": 19,
   "dex": 14,
   "con": 17,
   "int": 10,
   "wis": 14,
   "cha": 14
  },
  "ac": 10,
  "acNote": "armadura natural (14 + nível da magia)",
  "maxHp": 1,
  "hpDice": "",
  "speedFt": 30,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60,
   "swimFt": 30
  },
  "senses": {
   "passivePerception": 12,
   "blindsightFt": 30,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "ácido",
   "frio",
   "fogo",
   "elétrico",
   "veneno",
   "energético",
   "necrótico",
   "psíquico",
   "radiante",
   "trovejante"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "amedrontado",
   "envenenado"
  ],
  "multiattack": {
   "count": 2
  },
  "traits": [
   "t_dilacerar",
   "t_armaDeSopro",
   "t_resistenciasCompartilhadas"
  ],
  "blurb": "Dragão invocado que avança com várias mordidas e garras de alcance longo e solta um cone de energia a cada turno. Ainda compartilha uma de suas resistências com quem o conjurou.",
  "lore": "Este dragão não nasce de ovo: é um espírito convocado pela magia Invocar Espírito Dracônico, ganhando forma cromática, metálica ou de gema conforme a escolha do conjurador. Sua força cresce com o poder da magia usada para chamá-lo. Obedece ao invocador enquanto a magia dura e entende os idiomas que ele fala, embora se expresse em dracônico. Some quando o efeito termina."
 },
 "abencoadoDraconico": {
  "id": "abencoadoDraconico",
  "tipo": "humanoide",
  "name": "Abençoado Dracônico",
  "nomeOriginal": "Dragon Blessed",
  "fonte": "FTD",
  "size": "médio",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 12,
   "dex": 10,
   "con": 16,
   "int": 14,
   "wis": 17,
   "cha": 10
  },
  "ac": 14,
  "acNote": "brunea",
  "maxHp": 75,
  "hpDice": "10d8+30",
  "speedFt": 30,
  "senses": {
   "passivePerception": 13
  },
  "saves": [
   "con",
   "wis"
  ],
  "skills": [
   "medicina",
   "religiao"
  ],
  "expertise": [],
  "conditionImmunities": [
   "amedrontado"
  ],
  "attacks": [
   {
    "name": "Maça",
    "bonus": 4,
    "damage": "1d6+1",
    "type": "concussão",
    "reachFt": 5,
    "danoExtra": {
     "damage": "4d8",
     "type": "radiante"
    }
   },
   {
    "name": "Raio Radiante",
    "bonus": 6,
    "damage": "5d8",
    "type": "radiante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 120,
    "longRangeFt": 120
   }
  ],
  "multiattack": {
   "count": 2,
   "sequencias": [
    [
     "Maça",
     "Maça"
    ],
    [
     "Raio Radiante",
     "Raio Radiante"
    ]
   ]
  },
  "spellcasting": {
   "ability": "wis",
   "cantrips": [],
   "prepared": [
    "aprimorarAtributo",
    "golpeDeChama",
    "curarFerimentosEmMassa",
    "revivificar",
    "linguas",
    "luz",
    "taumaturgia"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "aprimorarAtributo": 1,
    "golpeDeChama": 1,
    "curarFerimentosEmMassa": 1,
    "revivificar": 1,
    "linguas": 1
   },
   "aVontade": [
    "luz",
    "taumaturgia"
   ],
   "cdPorMagia": {
    "aprimorarAtributo": 14,
    "golpeDeChama": 14,
    "curarFerimentosEmMassa": 14,
    "revivificar": 14,
    "linguas": 14,
    "luz": 14,
    "taumaturgia": 14
   }
  },
  "traits": [],
  "blurb": "Sacerdote resistente que alterna golpes de maça carregados de energia radiante com raios de luz à distância que o curam. Também lança coluna de chamas e cura em massa, e não pode ser amedrontado.",
  "lore": "O abençoado dracônico é um devoto que recebeu poder divino ao servir um dragão ou uma divindade dracônica. Costuma atuar como curandeiro e conselheiro de cultos, templos ou comunidades ligadas a dragões. Em combate, fica perto dos aliados, sustentando-os com magia de cura enquanto castiga os inimigos com luz sagrada. Sua fé inabalável o torna imune ao medo."
 },
 "escolhidoDoDragao": {
  "id": "escolhidoDoDragao",
  "tipo": "humanoide",
  "name": "Escolhido do Dragão",
  "nomeOriginal": "Dragon Chosen",
  "fonte": "FTD",
  "size": "médio",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 18,
   "dex": 18,
   "con": 14,
   "int": 10,
   "wis": 13,
   "cha": 14
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 45,
  "hpDice": "7d8+14",
  "speedFt": 30,
  "senses": {
   "passivePerception": 13
  },
  "saves": [
   "str",
   "dex",
   "con"
  ],
  "skills": [
   "atletismo",
   "percepcao"
  ],
  "expertise": [],
  "conditionImmunities": [
   "amedrontado"
  ],
  "attacks": [
   {
    "name": "Machadinha",
    "bonus": 6,
    "damage": "1d6+4",
    "type": "cortante",
    "reachFt": 5,
    "rangeFt": 20,
    "longRangeFt": 60
   },
   {
    "name": "Espada Curta",
    "bonus": 6,
    "damage": "1d6+4",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Machadinha",
    "Espada Curta",
    "Espada Curta"
   ]
  },
  "revide": {
   "nome": "Revide Mordaz",
   "arma": "Espada Curta",
   "vantagem": true
  },
  "traits": [
   "t_revideMordaz"
  ],
  "blurb": "Guerreiro ágil que combina machadinha e espada curta numa saraivada de três golpes por turno, e pune quem o fere de perto com um contra-ataque imediato.",
  "lore": "Os escolhidos do dragão são humanoides que juraram lealdade a um dragão e receberam dele parte de sua força. Servem como guarda-costas, executores e agentes de confiança do seu patrono, cumprindo ordens sem hesitar. A devoção fanática os torna imunes ao medo. Costumam ser encontrados perto do covil do dragão ou cuidando de seus interesses em terras distantes."
 },
 "oradorDraconico": {
  "id": "oradorDraconico",
  "tipo": "humanoide",
  "name": "Orador Dracônico",
  "nomeOriginal": "Dragon Speaker",
  "fonte": "FTD",
  "size": "pequeno",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 10,
   "dex": 14,
   "con": 12,
   "int": 13,
   "wis": 11,
   "cha": 17
  },
  "ac": 13,
  "acNote": "armadura de couro",
  "maxHp": 36,
  "hpDice": "8d6+8",
  "speedFt": 30,
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 60
  },
  "saves": [
   "dex",
   "cha"
  ],
  "skills": [
   "persuasao",
   "religiao"
  ],
  "expertise": [],
  "conditionImmunities": [
   "enfeitiçado",
   "amedrontado"
  ],
  "attacks": [
   {
    "name": "Raio Trovejante",
    "bonus": 5,
    "damage": "3d8",
    "type": "trovejante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Raio Trovejante",
    "Raio Trovejante"
   ]
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "acalmarEmocoes",
    "enfeiticarPessoa",
    "comando",
    "compreenderIdiomas",
    "luzesDancantes"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "acalmarEmocoes": 1,
    "enfeiticarPessoa": 1,
    "comando": 1,
    "compreenderIdiomas": 1
   },
   "aVontade": [
    "luzesDancantes"
   ],
   "cdPorMagia": {
    "acalmarEmocoes": 13,
    "enfeiticarPessoa": 13,
    "comando": 13,
    "compreenderIdiomas": 13,
    "luzesDancantes": 13
   }
  },
  "motorDoLivro": {
   "palavrasDesarmantes": {
    "nome": "Palavras Desarmantes",
    "alcanceFt": 60,
    "dados": "1d6"
   }
  },
  "traits": [
   "t_palavrasDesarmantes"
  ],
  "blurb": "Diplomata que dispara rajadas trovejantes à distância, empurrando inimigos, e usa magias de encanto e comando para controlar a luta. Sua reação reduz o dano dos ataques de quem estiver por perto.",
  "lore": "Oradores dracônicos são intermediários que tratam com dragões em nome de outros povos, ou que servem de voz a um dragão diante de mortais. Conhecem bem a língua e os costumes dracônicos e confiam mais na lábia do que nas armas. Raramente se deixam intimidar ou seduzir, pois quem fala com dragões precisa de nervos firmes. Quando a conversa falha, lançam ondas de trovão para manter os agressores afastados."
 },
 "filhoteDeDragaoTartaruga": {
  "id": "filhoteDeDragaoTartaruga",
  "tipo": "dragão",
  "name": "Filhote de Dragão-Tartaruga",
  "nomeOriginal": "Dragon Turtle Wyrmling",
  "fonte": "FTD",
  "size": "grande",
  "level": 1,
  "cr": "4",
  "xp": 1100,
  "abilities": {
   "str": 17,
   "dex": 10,
   "con": 15,
   "int": 8,
   "wis": 10,
   "cha": 10
  },
  "ac": 18,
  "acNote": "armadura natural",
  "maxHp": 90,
  "hpDice": "12d10+24",
  "speedFt": 20,
  "speeds": {
   "swimFt": 30
  },
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 120
  },
  "saves": [
   "dex",
   "con",
   "wis"
  ],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "fogo"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 5,
    "damage": "1d12+3",
    "type": "perfurante",
    "reachFt": 10
   }
  ],
  "breath": {
   "name": "Sopro de Vapor",
   "kind": "save",
   "shape": "cone",
   "areaFt": 15,
   "save": "con",
   "dc": 12,
   "damage": "5d6",
   "damageType": "fogo",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    5,
    6
   ]
  },
  "traits": [],
  "blurb": "Lento em terra, mas resistente: morde com alcance de 3 m e solta um cone de vapor escaldante que cozinha quem estiver perto, mesmo debaixo d'água.",
  "lore": "Recém-saído do ovo, o filhote de dragão-tartaruga já carrega um casco duro e uma índole territorial. Vive em águas costeiras, recifes e enseadas, onde caça peixes e explora destroços em busca de pequenos tesouros. Respira tanto no ar quanto na água e costuma emergir apenas para defender seu território ou investigar barcos. Ainda imaturo, prefere evitar brigas longas, mas reage com ferocidade quando encurralado."
 },
 "gosmaDeSangueDeDragao": {
  "id": "gosmaDeSangueDeDragao",
  "tipo": "gosma",
  "name": "Gosma de Sangue de Dragão",
  "nomeOriginal": "Dragonblood Ooze",
  "fonte": "FTD",
  "size": "grande",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 18,
   "dex": 6,
   "con": 17,
   "int": 2,
   "wis": 12,
   "cha": 10
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 68,
  "hpDice": "8d10+24",
  "speedFt": 20,
  "speeds": {
   "climbFt": 20
  },
  "senses": {
   "passivePerception": 14,
   "blindsightFt": 120
  },
  "saves": [],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "furtividade"
  ],
  "damageResistances": [
   "ácido",
   "frio",
   "fogo",
   "elétrico",
   "veneno"
  ],
  "conditionImmunities": [
   "cego",
   "enfeitiçado",
   "surdo",
   "exausto",
   "amedrontado",
   "agarrado",
   "caido",
   "contido"
  ],
  "attacks": [
   {
    "name": "Pseudópode",
    "bonus": 7,
    "damage": "1d10+4",
    "type": "concussão",
    "reachFt": 10,
    "danoExtra": {
     "damage": "4d6",
     "type": "ácido"
    },
    "onHit": {
     "semResistencia": true,
     "dc": 15,
     "escape": 15,
     "condition": "agarrado",
     "note": "é agarrado"
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequencias": [
    [
     "Pseudópode",
     "Pseudópode"
    ],
    [
     "Pseudópode"
    ]
   ]
  },
  "acoesEspeciais": [
   {
    "nome": "Sopro de Gosma",
    "recharge": [
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 30,
    "save": "dex",
    "dc": 14,
    "damage": "4d10",
    "damageType": "ácido",
    "halfOnSave": true
   }
  ],
  "traits": [
   "amorfo",
   "spiderClimb"
  ],
  "blurb": "Agarra presas com pseudópodes ácidos de longo alcance e cospe jatos de gosma que arrastam os inimigos até ela. Quem fica preso sofre ácido a cada turno.",
  "lore": "Nasce de experimentos alquímicos malsucedidos com sangue de dragão, que acabam dando vida e fome ao sangue coagulado. A massa tenta imitar a forma de um dragão, mas logo desmorona num monte disforme. Também tenta soprar como seus criadores, mas só consegue lançar pedaços do próprio corpo e depois recolhê-los. Costuma rondar laboratórios e oficinas de artesãos que trabalham com partes de dragões."
 },
 "golemDeOssosDeDragao": {
  "id": "golemDeOssosDeDragao",
  "tipo": "constructo",
  "name": "Golem de Ossos de Dragão",
  "nomeOriginal": "Dragonbone Golem",
  "fonte": "FTD",
  "size": "grande",
  "level": 9,
  "cr": "11",
  "xp": 7200,
  "abilities": {
   "str": 20,
   "dex": 10,
   "con": 17,
   "int": 3,
   "wis": 11,
   "cha": 10
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 161,
  "hpDice": "19d10+57",
  "speedFt": 40,
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "damageImmunities": [
   "veneno"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "exausto",
   "amedrontado",
   "paralisado",
   "petrificado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Asa Óssea",
    "bonus": 9,
    "damage": "2d6+5",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Dilacerar",
    "bonus": 9,
    "damage": "2d6+5",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d10",
     "type": "necrótico"
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Asa Óssea",
    "Dilacerar",
    "Dilacerar"
   ]
  },
  "acoesEspeciais": [
   {
    "nome": "Sopro Petrificante",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 60,
    "save": "con",
    "dc": 15,
    "damage": "10d6",
    "damageType": "veneno",
    "halfOnSave": false,
    "condition": "contido",
    "rounds": 10,
    "repete": true
   }
  ],
  "aura": {
   "raioFt": 20,
   "quando": "inicioDoAlvo",
   "save": "wis",
   "dc": 15,
   "condition": "amedrontado",
   "imunizaAoPassar": true
  },
  "traits": [
   "aura",
   "resistenciaAMagia",
   "t_naturezaIncomum"
  ],
  "blurb": "Prende alvos sob suas asas ósseas enquanto os dilacera com energia necrótica, e seu sopro de gás pode transformar grupos inteiros em pedra. Sua aura de medo enfraquece quem se aproxima.",
  "lore": "Este constructo é um esqueleto de dragão cujos ossos foram unidos por fios de adamante e gravados com runas que conduzem a magia de animação. Quase sempre é obra de dragões poderosos, que usam os restos de rivais derrotados como matéria-prima. Obediente e incansável, serve como guardião de covil para seu criador. Sua presença sobrenatural aterroriza intrusos antes mesmo do primeiro golpe."
 },
 "draconatoDeBahamut": {
  "id": "draconatoDeBahamut",
  "tipo": "humanoide",
  "name": "Draconato de Bahamut",
  "nomeOriginal": "Dragonborn of Bahamut",
  "fonte": "FTD",
  "size": "médio",
  "level": 5,
  "cr": "8",
  "xp": 3900,
  "abilities": {
   "str": 19,
   "dex": 13,
   "con": 18,
   "int": 12,
   "wis": 14,
   "cha": 17
  },
  "ac": 18,
  "acNote": "meia-armadura e escudo",
  "maxHp": 93,
  "hpDice": "11d8+44",
  "speedFt": 30,
  "flyFt": 30,
  "speeds": {
   "flyFt": 30
  },
  "senses": {
   "passivePerception": 15
  },
  "saves": [
   "con",
   "int",
   "wis",
   "cha"
  ],
  "skills": [
   "atletismo",
   "percepcao",
   "persuasao"
  ],
  "expertise": [],
  "conditionImmunities": [
   "amedrontado"
  ],
  "attacks": [
   {
    "name": "Espada Longa",
    "bonus": 7,
    "damage": "1d8+4",
    "type": "cortante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d10+4",
     "type": "cortante"
    },
    "onHit": {
     "save": "con",
     "dc": 14,
     "condition": "cego",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Espada Longa",
    "Espada Longa",
    "Espada Longa"
   ]
  },
  "breath": {
   "name": "Sopro Radiante (Recarga 5–6)",
   "kind": "save",
   "shape": "cone",
   "areaFt": 30,
   "save": "dex",
   "dc": 15,
   "damage": "8d10",
   "damageType": "radiante",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    6
   ]
  },
  "recursos": {
   "resistenciaLendaria": 1
  },
  "acoesEspeciais": [
   {
    "nome": "Toque Curativo (1/Dia)",
    "porDia": 1,
    "tipo": "cura",
    "dados": "40"
   }
  ],
  "traits": [],
  "blurb": "Guerreiro sagrado que golpeia três vezes por turno com uma espada longa carregada de energia radiante, capaz de cegar quem atinge. Seu sopro radiante queima inimigos e, ao mesmo tempo, cura aliados escolhidos.",
  "lore": "Este draconato é um campeão devotado a Bahamut, o Dragão de Platina, e carrega parte do poder dele. Ele ganhou asas e um sopro de luz que tanto fere quanto restaura. Costuma agir como protetor dos fracos e caçador do mal, liderando ou apoiando grupos de heróis. Não conhece o medo e prefere a linha de frente, onde pode proteger os companheiros."
 },
 "draconatoDeSardior": {
  "id": "draconatoDeSardior",
  "tipo": "humanoide",
  "name": "Draconato de Sardior",
  "nomeOriginal": "Dragonborn of Sardior",
  "fonte": "FTD",
  "size": "médio",
  "level": 5,
  "cr": "6",
  "xp": 2300,
  "abilities": {
   "str": 14,
   "dex": 16,
   "con": 17,
   "int": 18,
   "wis": 14,
   "cha": 12
  },
  "ac": 17,
  "acNote": "defesa mental",
  "maxHp": 75,
  "hpDice": "10d8+30",
  "speedFt": 30,
  "flyFt": 30,
  "hover": true,
  "speeds": {
   "flyFt": 30
  },
  "senses": {
   "passivePerception": 15
  },
  "saves": [
   "con",
   "int",
   "wis",
   "cha"
  ],
  "skills": [
   "arcanismo",
   "historia",
   "percepcao"
  ],
  "expertise": [],
  "damageResistances": [
   "psíquico"
  ],
  "conditionImmunities": [
   "amedrontado"
  ],
  "attacks": [
   {
    "name": "Lâmina Mental",
    "bonus": 7,
    "damage": "1d4+4",
    "type": "perfurante",
    "reachFt": 5,
    "rangeFt": 20,
    "longRangeFt": 60,
    "danoExtra": {
     "damage": "3d6",
     "type": "psíquico"
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Lâmina Mental",
    "Lâmina Mental",
    "Lâmina Mental"
   ]
  },
  "breath": {
   "name": "Sopro de Calor (Recarga 5–6)",
   "kind": "save",
   "shape": "cone",
   "areaFt": 30,
   "save": "con",
   "dc": 14,
   "damage": "6d8",
   "damageType": "fogo",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    6
   ]
  },
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "maoDeBigby",
    "padraoHipnotico",
    "telecinesia"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "maoDeBigby": 1,
    "padraoHipnotico": 1,
    "telecinesia": 1
   },
   "cdPorMagia": {
    "maoDeBigby": 15,
    "padraoHipnotico": 15,
    "telecinesia": 15
   }
  },
  "recursos": {
   "resistenciaLendaria": 1
  },
  "traits": [
   "t_defesaMental"
  ],
  "blurb": "Combatente psiônico que flutua e golpeia três vezes com lâminas mentais, de perto ou à distância, causando dano perfurante e psíquico. Seu sopro de calor queima em cone e deixa o metal em brasa, além de conjurar mão de Bigby, padrão hipnótico e telecinesia.",
  "lore": "Estes draconatos seguem Sardior, o lendário dragão de rubi associado aos poderes da mente. Treinam o intelecto até que ele se torne arma e escudo, dispensando armaduras e flutuando pelo ar com força psíquica. Costumam atuar como estudiosos, guardiões de saber antigo ou emissários de ordens místicas. Em combate, são calculistas e preferem desorientar os inimigos antes de atacar."
 },
 "draconatoDeTiamat": {
  "id": "draconatoDeTiamat",
  "tipo": "humanoide",
  "name": "Draconato de Tiamat",
  "nomeOriginal": "Dragonborn of Tiamat",
  "fonte": "FTD",
  "size": "médio",
  "level": 5,
  "cr": "7",
  "xp": 2900,
  "abilities": {
   "str": 20,
   "dex": 11,
   "con": 18,
   "int": 10,
   "wis": 12,
   "cha": 16
  },
  "ac": 18,
  "acNote": "armadura de placas",
  "maxHp": 85,
  "hpDice": "10d8+40",
  "speedFt": 30,
  "senses": {
   "passivePerception": 14
  },
  "saves": [
   "str",
   "con",
   "wis",
   "cha"
  ],
  "skills": [
   "atletismo",
   "intimidacao",
   "percepcao"
  ],
  "expertise": [],
  "conditionImmunities": [
   "amedrontado"
  ],
  "attacks": [
   {
    "name": "Machado Grande",
    "bonus": 8,
    "damage": "1d12+5",
    "type": "cortante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "3d8",
     "type": "necrótico"
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Machado Grande",
    "Machado Grande"
   ]
  },
  "recursos": {
   "resistenciaLendaria": 1
  },
  "acoesEspeciais": [
   {
    "nome": "Sopro Necrótico",
    "recharge": [
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 30,
    "save": "wis",
    "dc": 15,
    "damage": "8d8",
    "damageType": "necrótico",
    "halfOnSave": true,
    "condition": "amedrontado",
    "rounds": 10,
    "repete": true
   }
  ],
  "traits": [],
  "blurb": "Guerreiro brutal que golpeia duas vezes com um machado grande carregado de energia necrótica e cospe um cone de fogo sombrio que fere e amedronta. Resiste a efeitos mentais e não pode ser amedrontado.",
  "lore": "Draconatos de Tiamat são campeões devotos da Rainha dos Dragões, que receberam dela parte de sua essência sombria. Servem como tropas de elite e executores em cultos e exércitos dedicados à deusa. São cruéis, orgulhosos e destemidos, buscando provar seu valor esmagando quem se opõe a Tiamat. Costumam liderar grupos de cultistas ou guardar covis de dragões cromáticos."
 },
 "abominacaoDeCarneDraconica": {
  "id": "abominacaoDeCarneDraconica",
  "tipo": "monstruosidade",
  "name": "Abominação de Carne Dracônica",
  "nomeOriginal": "Dragonflesh Abomination",
  "fonte": "FTD",
  "size": "enorme",
  "level": 5,
  "cr": "6",
  "xp": 2300,
  "abilities": {
   "str": 18,
   "dex": 14,
   "con": 17,
   "int": 5,
   "wis": 12,
   "cha": 6
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 66,
  "hpDice": "7d12+21",
  "speedFt": 30,
  "flyFt": 40,
  "speeds": {
   "flyFt": 40
  },
  "senses": {
   "passivePerception": 11
  },
  "saves": [
   "str",
   "con"
  ],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [
   "enfeitiçado",
   "amedrontado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Garra",
    "bonus": 7,
    "damage": "1d8+4",
    "type": "cortante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "1d10",
     "type": "veneno"
    }
   },
   {
    "name": "Cauda",
    "bonus": 7,
    "damage": "1d12+4",
    "type": "concussão",
    "reachFt": 15,
    "onHit": {
     "save": "str",
     "dc": 15,
     "condition": "caido",
     "rounds": 1,
     "repete": false
    }
   },
   {
    "name": "Cuspe Ácido",
    "bonus": 5,
    "damage": "3d6",
    "type": "ácido",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 60,
    "longRangeFt": 60
   }
  ],
  "multiattack": {
   "count": 3
  },
  "breath": {
   "name": "Arroto Ácido",
   "kind": "save",
   "shape": "cone",
   "areaFt": 30,
   "save": "con",
   "dc": 14,
   "damage": "8d6",
   "damageType": "ácido",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    5,
    6
   ]
  },
  "aura": {
   "raioFt": 5,
   "quando": "inicioDoDono",
   "save": "con",
   "dc": 14,
   "condition": "envenenado",
   "rounds": 1
  },
  "regeneracao": {
   "pv": 10,
   "bloqueia": []
  },
  "traits": [
   "aura",
   "regeneracaoDoLivro"
  ],
  "blurb": "Monstro voador que regenera 10 PV por turno e envenena quem fica colado nele com seu fedor. Ataca com garras de longo alcance, cuspe ácido e uma cauda que derruba, além de um arroto ácido em cone devastador.",
  "lore": "Criatura monstruosa montada a partir de carne de dragão, fruto de experimentos cruéis de magos e cultistas obcecados por poder dracônico. Seu corpo deformado se recompõe sem parar e exala um odor pútrido. Entende Comum e Dracônico, mas não fala, e costuma servir como guarda ou arma de seus criadores. Age com fúria bestial e pouca astúcia."
 },
 "enxertadorDeCarneDraconica": {
  "id": "enxertadorDeCarneDraconica",
  "tipo": "monstruosidade",
  "name": "Enxertador de Carne Dracônica",
  "nomeOriginal": "Dragonflesh Grafter",
  "fonte": "FTD",
  "size": "grande",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 16,
   "dex": 11,
   "con": 14,
   "int": 10,
   "wis": 10,
   "cha": 6
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 52,
  "hpDice": "7d10+14",
  "speedFt": 30,
  "senses": {
   "passivePerception": 10
  },
  "saves": [
   "str",
   "con"
  ],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Garra",
    "bonus": 5,
    "damage": "1d8+3",
    "type": "cortante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "1d10",
     "type": "veneno"
    }
   },
   {
    "name": "Clava Grande",
    "bonus": 5,
    "damage": "2d8+3",
    "type": "concussão",
    "reachFt": 10
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Garra",
    "Clava Grande"
   ]
  },
  "breath": {
   "name": "Vômito Ácido",
   "kind": "save",
   "shape": "cone",
   "areaFt": 30,
   "save": "dex",
   "dc": 12,
   "damage": "4d6",
   "damageType": "ácido",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    5,
    6
   ]
  },
  "traits": [],
  "blurb": "Brutamontes de alcance longo que combina garra venenosa e clava grande a 3 m de distância. De tempos em tempos vomita bile ácida em cone, atingindo grupos inteiros.",
  "lore": "É um ser que costurou ao próprio corpo pedaços arrancados de dragões, buscando roubar o poder dessas criaturas. Os enxertos lhe dão membros longos, garras tóxicas e uma garganta capaz de expelir ácido. Costuma servir cultos e caçadores de dragões, ou age sozinho perseguindo novas partes para incorporar. Sua mente é instável e cruel, movida pela obsessão de se tornar cada vez mais dracônico."
 },
 "dragonel": {
  "id": "dragonel",
  "tipo": "dragão",
  "name": "Dragonel",
  "nomeOriginal": "Dragonnel",
  "fonte": "FTD",
  "size": "grande",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 16,
   "dex": 15,
   "con": 12,
   "int": 8,
   "wis": 13,
   "cha": 10
  },
  "ac": 13,
  "acNote": "armadura natural",
  "maxHp": 58,
  "hpDice": "9d10+9",
  "speedFt": 30,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60
  },
  "senses": {
   "passivePerception": 13,
   "blindsightFt": 30,
   "darkvisionFt": 120
  },
  "saves": [],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Dilacerar",
    "bonus": 5,
    "damage": "2d6+3",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Dilacerar",
    "Dilacerar"
   ]
  },
  "traits": [
   "voaSemProvocar"
  ],
  "blurb": "Voador ágil que mergulha, golpeia duas vezes com bico e garras e volta ao céu sem sofrer ataques de oportunidade. Sente o entorno às cegas a curta distância.",
  "lore": "Parente distante dos dragões cromáticos, metálicos e de gemas, o dragonel lembra uma versão menor deles. Entende Dracônico e Comum, mas não fala, e age movido pela fome e pela vontade de se divertir, muitas vezes brincando com a presa antes de matá-la. Criados desde o ovo, tornam-se montarias aéreas leais e até protetoras demais com seus cavaleiros. Já os selvagens resistem à sela e costumam fingir obediência até derrubar o cavaleiro lá do alto."
 },
 "dracoCompanheiro": {
  "id": "dracoCompanheiro",
  "tipo": "dragão",
  "name": "Draco Companheiro",
  "nomeOriginal": "Drake Companion",
  "fonte": "FTD",
  "size": "pequeno",
  "level": 1,
  "cr": "0",
  "xp": 10,
  "abilities": {
   "str": 16,
   "dex": 12,
   "con": 15,
   "int": 8,
   "wis": 14,
   "cha": 8
  },
  "ac": 10,
  "acNote": "armadura natural (14 + BP)",
  "maxHp": 1,
  "hpDice": "",
  "speedFt": 40,
  "senses": {
   "passivePerception": 12,
   "darkvisionFt": 60
  },
  "saves": [
   "dex",
   "wis"
  ],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "traits": [
   "t_mordida",
   "t_essenciaDraconica",
   "t_golpesImbuidos"
  ],
  "blurb": "Pequeno dragão leal ao patrulheiro que morde com força e, com sua reação, carrega os golpes dos aliados com energia elemental extra.",
  "lore": "O draco companheiro é um dragãozinho invocado por patrulheiros ligados à magia dracônica. Sua essência elemental é definida no momento da invocação e molda tanto suas defesas quanto o poder que empresta aos aliados. Fiel e atento, luta ao lado do mestre e fala dracônico. Cresce em resistência conforme o patrulheiro ganha experiência."
 },
 "cacadorDeOvosAdulto": {
  "id": "cacadorDeOvosAdulto",
  "tipo": "monstruosidade",
  "name": "Caçador de Ovos Adulto",
  "nomeOriginal": "Egg Hunter Adult",
  "fonte": "FTD",
  "size": "pequeno",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 14,
   "dex": 20,
   "con": 16,
   "int": 3,
   "wis": 13,
   "cha": 5
  },
  "ac": 16,
  "acNote": "armadura natural",
  "maxHp": 52,
  "hpDice": "8d6+24",
  "speedFt": 40,
  "speeds": {
   "climbFt": 40
  },
  "senses": {
   "passivePerception": 14,
   "darkvisionFt": 120
  },
  "saves": [
   "dex",
   "wis"
  ],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "furtividade"
  ],
  "conditionImmunities": [
   "amedrontado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Probóscide Farpada",
    "bonus": 8,
    "damage": "1d6+5",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "2d8",
     "type": "necrótico"
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Probóscide Farpada",
    "Probóscide Farpada"
   ]
  },
  "acoesEspeciais": [
   {
    "nome": "Esporos de Torpor",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "raio",
    "areaFt": 30,
    "save": "con",
    "dc": 14,
    "condition": "envenenado",
    "rounds": 10,
    "repete": true,
    "imunizaAoPassar": true
   }
  ],
  "motorDoLivro": {
   "adaptarAoDano": {
    "nome": "Adaptação Rápida"
   }
  },
  "traits": [
   "aparenciaFalsa",
   "t_adaptacaoRapida"
  ],
  "blurb": "Predador ágil que suga vida com sua probóscide farpada, curando-se a cada golpe, e espalha esporos que entorpecem quem estiver por perto. Adapta-se rapidamente aos ataques, ganhando resistência ao dano que recebe.",
  "lore": "Caçadores de ovos são monstruosidades pequenas criadas para se alimentar de ovos e filhotes de dragão. Escondem-se imóveis em ninhos e covis, confundindo-se com o ambiente até que a presa se aproxime. Vivem tanto na terra quanto na água e escalam com facilidade. Agem por puro instinto, sem medo, e são especialmente difíceis de detectar até para os próprios dragões."
 },
 "filhoteDeCacadorDeOvos": {
  "id": "filhoteDeCacadorDeOvos",
  "tipo": "monstruosidade",
  "name": "Filhote de Caçador de Ovos",
  "nomeOriginal": "Egg Hunter Hatchling",
  "fonte": "FTD",
  "size": "miúdo",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 8,
   "dex": 17,
   "con": 13,
   "int": 1,
   "wis": 10,
   "cha": 5
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 28,
  "hpDice": "8d4+8",
  "speedFt": 30,
  "speeds": {
   "climbFt": 30,
   "burrowFt": 10
  },
  "senses": {
   "passivePerception": 12,
   "darkvisionFt": 60
  },
  "saves": [
   "dex",
   "wis"
  ],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "furtividade"
  ],
  "conditionImmunities": [
   "amedrontado"
  ],
  "attacks": [
   {
    "name": "Dente de Ovo",
    "bonus": 5,
    "damage": "2d6+3",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "4d6+3",
     "type": "perfurante"
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Dente de Ovo",
    "Dente de Ovo"
   ]
  },
  "acoesEspeciais": [
   {
    "nome": "Movimento Rápido",
    "tipo": "disparada",
    "doDeslocamento": true,
    "bonus": true
   }
  ],
  "traits": [],
  "blurb": "Pequeno e veloz, ataca duas vezes com seu dente de ovo, que é especialmente devastador contra objetos como cascas de ovos. Usa ação bônus para disparar ou se desvencilhar, escapando antes que o inimigo reaja.",
  "lore": "O caçador de ovos é uma monstruosidade que se alimenta de ovos de dragão, e seus filhotes já nascem famintos por eles. Esgueiram-se furtivamente por ninhos e covis, escalando paredes e cavando na terra para alcançar as ninhadas. Respiram tanto no ar quanto na água, o que lhes permite invadir até covis submersos. Não conhecem o medo e atacam com fúria instintiva quem se interpõe entre eles e a presa."
 },
 "dragaoCerebroAnciao": {
  "id": "dragaoCerebroAnciao",
  "tipo": "aberração",
  "name": "Dragão Cérebro Ancião",
  "nomeOriginal": "Elder Brain Dragon",
  "fonte": "FTD",
  "size": "imenso",
  "level": 21,
  "cr": "22",
  "xp": 41000,
  "abilities": {
   "str": 27,
   "dex": 13,
   "con": 25,
   "int": 21,
   "wis": 19,
   "cha": 24
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 350,
  "hpDice": "20d20+140",
  "speedFt": 40,
  "flyFt": 80,
  "hover": true,
  "speeds": {
   "flyFt": 80
  },
  "senses": {
   "passivePerception": 28,
   "blindsightFt": 120
  },
  "saves": [
   "con",
   "int",
   "wis",
   "cha"
  ],
  "skills": [
   "arcanismo",
   "intuicao",
   "percepcao"
  ],
  "expertise": [
   "intuicao",
   "percepcao"
  ],
  "damageImmunities": [
   "psíquico"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "amedrontado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 15,
    "damage": "2d10+8",
    "type": "perfurante",
    "reachFt": 15,
    "danoExtra": {
     "damage": "2d10",
     "type": "psíquico"
    }
   },
   {
    "name": "Garra",
    "bonus": 15,
    "damage": "1d6+8",
    "type": "cortante",
    "reachFt": 10
   },
   {
    "name": "Tentáculo",
    "bonus": 15,
    "damage": "1d8+8",
    "type": "psíquico",
    "reachFt": 15,
    "onHit": {
     "semResistencia": true,
     "dc": 18,
     "escape": 18,
     "condition": "agarrado",
     "note": "é agarrado"
    }
   }
  ],
  "multiattack": {
   "count": 4,
   "sequence": [
    "Mordida",
    "Garra",
    "Garra",
    "Tentáculo"
   ]
  },
  "breath": {
   "name": "Sopro de Salmoura de Girinos (Recarga 5–6)",
   "kind": "save",
   "shape": "linha",
   "areaFt": 120,
   "save": "con",
   "dc": 22,
   "damage": "10d10",
   "damageType": "psíquico",
   "halfOnSave": true,
   "origem": "sopro",
   "larguraFt": 15,
   "recharge": [
    5,
    6
   ]
  },
  "recursos": {
   "resistenciaLendaria": 4
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Tentáculo",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Tentáculo"
    },
    {
     "nome": "Despedaçar Concentração",
     "custo": 2,
     "tipo": "quebrarConcentracao",
     "soAgarrado": true,
     "damage": "3d12"
    }
   ]
  },
  "traits": [
   "monstroDeCerco",
   "t_naturezaIncomum",
   "acoesLendarias"
  ],
  "blurb": "Combina mordidas, garras e tentáculos que agarram até quatro vítimas, rompendo a concentração de conjuradores com dano psíquico. Seu sopro de salmoura infesta os alvos com girinos de illithid que podem transformar humanoides em devoradores de mentes.",
  "lore": "Quando uma colônia de devoradores de mentes consegue dominar um dragão, seu cérebro ancião se prende às costas da fera e crava tentáculos em seu cérebro, fundindo-se a ela. O resultado é um general aberrante que não fica mais preso ao tanque de salmoura e pode liderar exércitos illithid por onde quiser. O corpo do dragão pulsa com poder psiônico, e até seu sopro se corrompe numa torrente de salmoura cheia de girinos. Com eles, a criatura converte suas vítimas em novos devoradores de mentes e forma uma colônia itinerante."
 },
 "filhoteDeDragaoEsmeralda": {
  "id": "filhoteDeDragaoEsmeralda",
  "tipo": "dragão",
  "name": "Filhote de Dragão Esmeralda",
  "nomeOriginal": "Emerald Dragon Wyrmling",
  "fonte": "FTD",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 15,
   "dex": 12,
   "con": 15,
   "int": 14,
   "wis": 12,
   "cha": 14
  },
  "ac": 16,
  "acNote": "armadura natural",
  "maxHp": 39,
  "hpDice": "6d8+12",
  "speedFt": 30,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60,
   "burrowFt": 20
  },
  "senses": {
   "passivePerception": 15,
   "blindsightFt": 10,
   "darkvisionFt": 60
  },
  "saves": [
   "dex",
   "con",
   "wis",
   "cha"
  ],
  "skills": [
   "arcanismo",
   "enganacao",
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageResistances": [
   "fogo",
   "psíquico"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 4,
    "damage": "1d10+2",
    "type": "perfurante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "1d6",
     "type": "psíquico"
    }
   }
  ],
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "maoMagica",
    "ilusaoMenor"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "aVontade": [
    "maoMagica",
    "ilusaoMenor"
   ],
   "cdPorMagia": {
    "maoMagica": 12,
    "ilusaoMenor": 12
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Sopro Desorientador",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 15,
    "save": "int",
    "dc": 12,
    "damage": "5d6",
    "damageType": "psíquico",
    "halfOnSave": true
   }
  ],
  "traits": [
   "escavador"
  ],
  "marcas": [
   "gem"
  ],
  "blurb": "Morde a até 3 m somando dano psíquico e solta um cone de dissonância mental que fere e atrapalha ataques e testes dos alvos. Cava túneis e pode sumir sob a rocha.",
  "lore": "Dragões esmeralda são dragões de gema, criaturas psiônicas ligadas à mente e aos segredos. Mesmo filhotes já falam por telepatia e usam pequenas ilusões para confundir intrusos. Costumam viver em cavernas e túneis escavados por eles mesmos, longe de olhares curiosos. São desconfiados e preferem observar e enganar antes de lutar abertamente."
 },
 "grandeWyrmEsmeralda": {
  "id": "grandeWyrmEsmeralda",
  "tipo": "dragão",
  "name": "Grande Wyrm Esmeralda",
  "nomeOriginal": "Emerald Greatwyrm",
  "fonte": "FTD",
  "size": "imenso",
  "level": 25,
  "cr": "26",
  "xp": 90000,
  "abilities": {
   "str": 28,
   "dex": 14,
   "con": 29,
   "int": 30,
   "wis": 24,
   "cha": 25
  },
  "ac": 21,
  "acNote": "armadura natural",
  "maxHp": 507,
  "hpDice": "26d20+234",
  "speedFt": 60,
  "flyFt": 120,
  "hover": true,
  "speeds": {
   "flyFt": 120,
   "swimFt": 60,
   "burrowFt": 60
  },
  "senses": {
   "passivePerception": 25,
   "truesightFt": 120
  },
  "saves": [
   "dex",
   "con",
   "wis",
   "cha"
  ],
  "skills": [
   "arcanismo",
   "historia",
   "percepcao"
  ],
  "expertise": [
   "arcanismo"
  ],
  "damageImmunities": [
   "psíquico"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "amedrontado",
   "envenenado",
   "caido"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 17,
    "damage": "2d10+9",
    "type": "perfurante",
    "reachFt": 15,
    "danoExtra": {
     "damage": "3d10",
     "type": "energético"
    }
   },
   {
    "name": "Garra",
    "bonus": 17,
    "damage": "2d8+9",
    "type": "cortante",
    "reachFt": 10,
    "onHit": {
     "semResistencia": true,
     "dc": 19,
     "escape": 19,
     "condition": "contido",
     "note": "é agarrado",
     "maxAgarrados": 1
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida",
    "Garra",
    "Garra"
   ]
  },
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "dissiparMagia",
    "jaulaDeEnergia",
    "viagemPlanar",
    "inverterAGravidade",
    "pararOTempo"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "dissiparMagia": 1,
    "jaulaDeEnergia": 1,
    "viagemPlanar": 1,
    "inverterAGravidade": 1,
    "pararOTempo": 1
   },
   "cdPorMagia": {
    "dissiparMagia": 26,
    "jaulaDeEnergia": 26,
    "viagemPlanar": 26,
    "inverterAGravidade": 26,
    "pararOTempo": 26
   }
  },
  "recursos": {
   "resistenciaLendaria": 4
  },
  "acoesEspeciais": [
   {
    "nome": "Sopro",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 300,
    "save": "dex",
    "dc": 25,
    "damage": "11d12",
    "damageType": "energético",
    "halfOnSave": true,
    "condition": "caido",
    "rounds": 1,
    "repete": false,
    "ateFimDoTurnoDele": true
   },
   {
    "nome": "Telecinese em Massa",
    "tipo": "area",
    "shape": "raio",
    "areaFt": 120,
    "save": "str",
    "dc": 26,
    "damage": "7d12",
    "damageType": "energético",
    "halfOnSave": false,
    "condition": "contido",
    "rounds": 10,
    "repete": true
   },
   {
    "nome": "Passo Psíquico",
    "tipo": "teleporte",
    "alcanceFt": 60,
    "bonus": true
   }
  ],
  "despertar": {
   "pv": 400
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Garra",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Garra"
    },
    {
     "nome": "Psiônica",
     "custo": 2,
     "tipo": "magia"
    },
    {
     "nome": "Raio Psíquico",
     "custo": 3,
     "tipo": "linha",
     "comprimentoFt": 90,
     "larguraFt": 10,
     "save": "int",
     "dc": 26,
     "damage": "5d10",
     "damageType": "psíquico",
     "halfOnSave": true
    }
   ]
  },
  "traits": [
   "despertar",
   "t_naturezaIncomum",
   "t_mudarDeForma",
   "acoesLendarias"
  ],
  "marcas": [
   "gem"
  ],
  "blurb": "Dragão colossal que alterna mordidas e garras com teletransporte psíquico e magias devastadoras como parar o tempo. Seu sopro de força esmaga tudo num cone enorme, e ao cair a 0 PV ele desperta com 400 PV novos.",
  "lore": "Grandes wyrms esmeralda são dragões de gema no ápice do poder, mentes psiônicas antigas que acumulam conhecimento e segredos. São neutros e preferem observar e manipular de longe, muitas vezes disfarçados em formas pequenas. Raramente lutam sem motivo, mas quando o fazem dominam o campo com telecinese e magia. Sua essência cristalina pode despertar quando estão à beira da morte, tornando-os quase invencíveis."
 },
 "olhodraco": {
  "id": "olhodraco",
  "tipo": "aberração",
  "name": "Olhodraco",
  "nomeOriginal": "Eyedrake",
  "fonte": "FTD",
  "size": "grande",
  "level": 5,
  "cr": "8",
  "xp": 3900,
  "abilities": {
   "str": 16,
   "dex": 10,
   "con": 16,
   "int": 14,
   "wis": 14,
   "cha": 16
  },
  "ac": 16,
  "acNote": "armadura natural",
  "maxHp": 119,
  "hpDice": "14d10+42",
  "speedFt": 0,
  "flyFt": 30,
  "hover": true,
  "speeds": {
   "flyFt": 30
  },
  "senses": {
   "passivePerception": 18,
   "darkvisionFt": 120
  },
  "saves": [
   "con",
   "wis"
  ],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "percepcao",
   "furtividade"
  ],
  "conditionImmunities": [
   "caido"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 6,
    "damage": "3d6+3",
    "type": "perfurante",
    "reachFt": 10
   }
  ],
  "breath": {
   "name": "Sopro Antimagia",
   "kind": "save",
   "shape": "cone",
   "areaFt": 30,
   "save": "con",
   "dc": 14,
   "damage": "6d12",
   "damageType": "energético",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    6
   ]
  },
  "raiosOculares": {
   "n": 3,
   "alcanceFt": 60,
   "aoAcaso": true,
   "raios": [
    {
     "nome": "1: Freezing Ray",
     "save": "con",
     "dc": 14,
     "damage": "5d6",
     "damageType": "frio",
     "halfOnSave": true
    },
    {
     "nome": "2: Debilitating Ray",
     "save": "con",
     "dc": 14,
     "damage": "2d6",
     "damageType": "trovejante",
     "halfOnSave": false,
     "condition": "incapacitado",
     "rounds": 1,
     "repete": false
    },
    {
     "nome": "3: Repulsion Ray",
     "save": "str",
     "dc": 14,
     "damage": "4d6",
     "damageType": "energético",
     "halfOnSave": false
    },
    {
     "nome": "4: Fire Ray",
     "save": "dex",
     "dc": 14,
     "damage": "6d6",
     "damageType": "fogo",
     "halfOnSave": true
    },
    {
     "nome": "5: Paralyzing Ray",
     "save": "con",
     "dc": 14,
     "condition": "paralisado",
     "rounds": 10,
     "repete": true
    },
    {
     "nome": "6: Death Ray",
     "save": "dex",
     "dc": 14,
     "damage": "8d6",
     "damageType": "necrótico",
     "halfOnSave": true,
     "efeito": "morte"
    }
   ]
  },
  "traits": [
   "raiosOculares",
   "t_naturezaIncomum"
  ],
  "blurb": "Flutua disparando três raios oculares aleatórios por turno, que podem congelar, paralisar, empurrar, queimar ou matar. Seu sopro em cone causa dano energético e desfaz magias de nível baixo.",
  "lore": "O olhodraco surge dos sonhos febris de um observador obcecado por um dragão rival com quem disputa riquezas e poder. Parece um dragão alado sem membros, de boca sempre aberta, onde se esconde um grande olho que exala antimagia. Suas asas são feixes de pedúnculos oculares capazes de lançar raios. Sozinho, age como um dragão jovem: busca um covil, junta um tesouro e luta até a morte para proteger até a menor bugiganga."
 },
 "espreitadorDeGemas": {
  "id": "espreitadorDeGemas",
  "tipo": "monstruosidade",
  "name": "Espreitador de Gemas",
  "nomeOriginal": "Gem Stalker",
  "fonte": "FTD",
  "size": "grande",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 17,
   "dex": 15,
   "con": 14,
   "int": 15,
   "wis": 10,
   "cha": 6
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 67,
  "hpDice": "9d10+18",
  "speedFt": 40,
  "speeds": {
   "climbFt": 40
  },
  "senses": {
   "passivePerception": 13,
   "darkvisionFt": 120
  },
  "saves": [
   "dex",
   "int"
  ],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "damageResistances": [
   "psíquico"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Garra",
    "bonus": 6,
    "damage": "2d6+3",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 4,
   "sequence": [
    "Garra",
    "Garra",
    "Garra",
    "Garra"
   ]
  },
  "acoesEspeciais": [
   {
    "nome": "Dardo de Cristal",
    "tipo": "golpeBonus",
    "bonus": true,
    "golpe": {
     "name": "Dardo de Cristal",
     "bonus": 5,
     "damage": "1d10+2",
     "type": "energético",
     "reachFt": 5,
     "ranged": true,
     "rangeFt": 30,
     "longRangeFt": 30,
     "nomeEn": "Crystal Dart"
    }
   }
  ],
  "motorDoLivro": {
   "eloProtetor": {
    "nome": "Elo Protetor",
    "alcanceFt": 30,
    "dados": "3d6"
   }
  },
  "traits": [
   "spiderClimb",
   "t_naturezaIncomum",
   "t_eloProtetor"
  ],
  "blurb": "Rasga os inimigos com quatro golpes de garra por turno e, como ação bônus, dispara dardos de cristal com efeitos que dependem do dragão que o criou. Também pode absorver o dano destinado a um aliado próximo.",
  "lore": "Esse predador nasce quando um dragão de gema mata uma aberração vinda do Reino Distante e remodela o cadáver com o poder do seu sopro. Ganha vida, inteligência e uma missão: caçar aberrações pelo Subterrâneo e proteger o covil do seu criador. Tem corpo de dragão sem asas e quatro patas, com tronco, braços e cabeça quase humanos no lugar do pescoço. Não tem boca, seus olhos são brancos como leite e cristais pulsantes de energia psíquica cobrem sua pele, concedendo-lhe telepatia e seus poderes."
 },
 "dragaoFantasma": {
  "id": "dragaoFantasma",
  "tipo": "morto-vivo",
  "name": "Dragão Fantasma",
  "nomeOriginal": "Ghost Dragon",
  "fonte": "FTD",
  "size": "enorme",
  "level": 17,
  "cr": "17",
  "xp": 18000,
  "abilities": {
   "str": 20,
   "dex": 10,
   "con": 25,
   "int": 16,
   "wis": 15,
   "cha": 19
  },
  "ac": 10,
  "maxHp": 324,
  "hpDice": "24d12+168",
  "speedFt": 40,
  "flyFt": 80,
  "hover": true,
  "speeds": {
   "flyFt": 80
  },
  "senses": {
   "passivePerception": 24,
   "blindsightFt": 60,
   "darkvisionFt": 120
  },
  "saves": [
   "con",
   "wis",
   "cha"
  ],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "percepcao",
   "furtividade"
  ],
  "damageResistances": [
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageImmunities": [
   "ácido",
   "frio",
   "necrótico",
   "veneno"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "exausto",
   "amedrontado",
   "agarrado",
   "paralisado",
   "petrificado",
   "envenenado",
   "caido",
   "contido"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 11,
    "damage": "6d8+5",
    "type": "frio",
    "reachFt": 10
   },
   {
    "name": "Garra",
    "bonus": 11,
    "damage": "2d8+5",
    "type": "necrótico",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida",
    "Garra",
    "Garra"
   ]
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "acoesEspeciais": [
   {
    "nome": "Sopro Aterrorizante (Recarga 5–6)",
    "recharge": [
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 90,
    "save": "con",
    "dc": 21,
    "damage": "9d8",
    "damageType": "frio",
    "halfOnSave": true,
    "condition": "amedrontado",
    "rounds": 10,
    "repete": true,
    "imunizaAoPassar": true
   }
  ],
  "traits": [
   "incorporealMovement",
   "t_naturezaIncomum"
  ],
  "blurb": "Espírito dracônico incorpóreo que atravessa paredes, morde com frio que retarda e dilacera com garras necróticas. Seu sopro sombrio pode deixar um grupo inteiro paralisado de pavor.",
  "lore": "Alguns dragões se apegam tanto ao próprio tesouro que seu espírito continua preso a ele depois da morte. Esse fantasma assombra o covil onde guardava suas riquezas, muitas vezes concentrando sua existência morta-viva em um único objeto de valor inestimável. Ele surge como uma versão translúcida do dragão que foi em vida. Seu sopro lembra o elemento de outrora, mas carrega uma maldição de outro mundo que mergulha as vítimas em pesadelos acordados."
 },
 "canarioGigante": {
  "id": "canarioGigante",
  "tipo": "fera",
  "name": "Canário Gigante",
  "nomeOriginal": "Giant Canary",
  "fonte": "FTD",
  "size": "grande",
  "level": 1,
  "cr": "1/2",
  "xp": 100,
  "abilities": {
   "str": 10,
   "dex": 14,
   "con": 12,
   "int": 2,
   "wis": 10,
   "cha": 6
  },
  "ac": 12,
  "maxHp": 26,
  "hpDice": "4d10+4",
  "speedFt": 30,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60
  },
  "senses": {
   "passivePerception": 10
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Bicada",
    "bonus": 4,
    "damage": "1d10+2",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "traits": [],
  "blurb": "Ave enorme e ágil que voa rápido e ataca com bicadas perfurantes; pouco resistente, mas difícil de alcançar no ar.",
  "lore": "Versão colossal do pequeno pássaro canoro, grande o bastante para carregar um cavaleiro. Costuma ser criada e domesticada como montaria voadora em regiões onde o voo é essencial. Sem dono, comporta-se como qualquer ave: busca alimento, foge de ameaças maiores e só bica quando acuada ou defendendo o ninho."
 },
 "grandeWyrmDourado": {
  "id": "grandeWyrmDourado",
  "tipo": "dragão",
  "name": "Grande Wyrm Dourado",
  "nomeOriginal": "Gold Greatwyrm",
  "fonte": "FTD",
  "size": "imenso",
  "level": 25,
  "cr": "28",
  "xp": 120000,
  "abilities": {
   "str": 30,
   "dex": 16,
   "con": 29,
   "int": 21,
   "wis": 22,
   "cha": 30
  },
  "ac": 22,
  "acNote": "armadura natural",
  "maxHp": 565,
  "hpDice": "29d20+261",
  "speedFt": 60,
  "flyFt": 120,
  "speeds": {
   "flyFt": 120,
   "swimFt": 60,
   "burrowFt": 60
  },
  "senses": {
   "passivePerception": 32,
   "truesightFt": 120
  },
  "saves": [
   "dex",
   "con",
   "int",
   "wis",
   "cha"
  ],
  "skills": [
   "intuicao",
   "percepcao",
   "persuasao"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "fogo"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "amedrontado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 18,
    "damage": "2d10+10",
    "type": "perfurante",
    "reachFt": 15,
    "danoExtra": {
     "damage": "2d12",
     "type": "energético"
    }
   },
   {
    "name": "Garra",
    "bonus": 18,
    "damage": "2d8+10",
    "type": "cortante",
    "reachFt": 10,
    "onHit": {
     "semResistencia": true,
     "dc": 20,
     "escape": 20,
     "condition": "contido",
     "note": "é agarrado",
     "maxAgarrados": 1
    }
   },
   {
    "name": "Cauda",
    "bonus": 18,
    "damage": "2d10+10",
    "type": "concussão",
    "reachFt": 20,
    "onHit": {
     "save": "str",
     "dc": 26,
     "condition": "caido",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida",
    "Garra",
    "Garra"
   ]
  },
  "breath": {
   "name": "Arma de Sopro",
   "kind": "save",
   "shape": "cone",
   "areaFt": 300,
   "save": "dex",
   "dc": 25,
   "damage": "13d12",
   "damageType": "fogo",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    5,
    6
   ]
  },
  "recursos": {
   "resistenciaLendaria": 4
  },
  "despertar": {
   "pv": 450
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Ataque",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Garra"
    },
    {
     "nome": "Ataque de Asas",
     "custo": 2,
     "tipo": "area",
     "raioFt": 30,
     "save": "dex",
     "dc": 26,
     "damage": "2d6+10",
     "damageType": "concussão",
     "halfOnSave": false,
     "condition": "caido",
     "rounds": 10,
     "repete": false
    }
   ]
  },
  "traits": [
   "t_mudarDeForma",
   "despertar",
   "t_naturezaIncomum",
   "acoesLendarias"
  ],
  "marcas": [
   "metallic"
  ],
  "blurb": "Um dragão colossal que agarra com as garras, derruba com a cauda e varre o campo com um sopro de fogo em cone de 90 m ou um gás que faz desmaiar. Ao chegar a 0 PV, desperta seu poder metálico, volta com 450 PV e ganha ações míticas.",
  "lore": "O grande wyrm dourado é um dos dragões metálicos mais antigos e poderosos que existem, um ser quase divino que já ultrapassou as necessidades de comer e beber. Costuma agir como guardião da justiça e da ordem, observando o mundo com paciência e sabedoria acumuladas ao longo de eras. Muitas vezes caminha entre os povos menores disfarçado de pessoa comum, julgando seus atos de perto. Quando enfim entra em combate, só é derrotado por heróis capazes de enfrentá-lo duas vezes, já que seu despertar metálico o faz renascer em plena fúria."
 },
 "grandeWyrmVerde": {
  "id": "grandeWyrmVerde",
  "tipo": "dragão",
  "name": "Grande Wyrm Verde",
  "nomeOriginal": "Green Greatwyrm",
  "fonte": "FTD",
  "size": "imenso",
  "level": 25,
  "cr": "27",
  "xp": 105000,
  "abilities": {
   "str": 30,
   "dex": 14,
   "con": 30,
   "int": 21,
   "wis": 20,
   "cha": 26
  },
  "ac": 22,
  "acNote": "armadura natural",
  "maxHp": 533,
  "hpDice": "26d20+260",
  "speedFt": 60,
  "flyFt": 120,
  "speeds": {
   "flyFt": 120,
   "swimFt": 60,
   "burrowFt": 60
  },
  "senses": {
   "passivePerception": 31,
   "truesightFt": 120
  },
  "saves": [
   "dex",
   "con",
   "wis",
   "cha"
  ],
  "skills": [
   "intimidacao",
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "veneno"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "amedrontado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 18,
    "damage": "2d10+10",
    "type": "perfurante",
    "reachFt": 15,
    "danoExtra": {
     "damage": "2d12",
     "type": "energético"
    }
   },
   {
    "name": "Garra",
    "bonus": 18,
    "damage": "2d8+10",
    "type": "cortante",
    "reachFt": 10,
    "onHit": {
     "semResistencia": true,
     "dc": 20,
     "escape": 20,
     "condition": "contido",
     "note": "é agarrado",
     "maxAgarrados": 1
    }
   },
   {
    "name": "Cauda",
    "bonus": 18,
    "damage": "2d8+10",
    "type": "concussão",
    "reachFt": 20,
    "onHit": {
     "save": "str",
     "dc": 26,
     "condition": "caido",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida",
    "Garra",
    "Garra"
   ]
  },
  "recursos": {
   "resistenciaLendaria": 4
  },
  "acoesEspeciais": [
   {
    "nome": "Sopro",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 300,
    "save": "dex",
    "dc": 26,
    "damage": "12d12",
    "damageType": "veneno",
    "halfOnSave": true
   }
  ],
  "despertar": {
   "pv": 425
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Ataque",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Garra"
    },
    {
     "nome": "Ataque com Asas",
     "custo": 2,
     "tipo": "area",
     "raioFt": 30,
     "save": "dex",
     "dc": 26,
     "damage": "2d6+10",
     "damageType": "concussão",
     "halfOnSave": false,
     "condition": "caido",
     "rounds": 10,
     "repete": false
    },
    {
     "nome": "Lança Arcana",
     "custo": 3,
     "tipo": "lancas",
     "n": 4,
     "alcanceFt": 120,
     "damage": "1d8+8",
     "damageType": "energético"
    }
   ]
  },
  "traits": [
   "despertar",
   "t_naturezaIncomum",
   "acoesLendarias"
  ],
  "marcas": [
   "chromatic"
  ],
  "blurb": "Colosso dracônico que agarra e despedaça com garras e mordida, varre o campo com a cauda e exala um cone de veneno de 90 m. Ao cair a 0 PV, desperta com novas forças e ações míticas.",
  "lore": "Os grandes wyrms são dragões cromáticos que atingiram um poder quase divino, muito além dos anciões comuns. O verde é mestre da manipulação, tratando reinos inteiros como peças de um jogo de intrigas. Prefere florestas antigas e ruínas cobertas de vegetação, onde nada acontece sem que ele saiba. Não precisa comer nem beber e só se revela quando a vitória já está garantida."
 },
 "mimicoDeTesouro": {
  "id": "mimicoDeTesouro",
  "tipo": "monstruosidade",
  "name": "Mímico de Tesouro",
  "nomeOriginal": "Hoard Mimic",
  "fonte": "FTD",
  "size": "enorme",
  "level": 5,
  "cr": "8",
  "xp": 3900,
  "abilities": {
   "str": 21,
   "dex": 12,
   "con": 17,
   "int": 10,
   "wis": 16,
   "cha": 10
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 123,
  "hpDice": "13d12+39",
  "speedFt": 30,
  "senses": {
   "passivePerception": 13,
   "darkvisionFt": 60
  },
  "saves": [
   "con",
   "wis"
  ],
  "skills": [
   "persuasao",
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [
   "caido"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 8,
    "damage": "2d10+5",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "2d6",
     "type": "ácido"
    }
   },
   {
    "name": "Pseudópode",
    "bonus": 8,
    "damage": "2d6+5",
    "type": "concussão",
    "reachFt": 10,
    "onHit": {
     "semResistencia": true,
     "dc": 16,
     "escape": 16,
     "condition": "contido",
     "note": "é agarrado"
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida",
    "Pseudópode",
    "Pseudópode"
   ]
  },
  "acoesEspeciais": [
   {
    "nome": "Névoa Cáustica",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 30,
    "save": "dex",
    "dc": 14,
    "damage": "6d8",
    "damageType": "ácido",
    "halfOnSave": true,
    "condition": "cego",
    "rounds": 1,
    "repete": false,
    "ateFimDoTurnoDele": true
   }
  ],
  "traits": [
   "metamorfo",
   "aparenciaFalsa"
  ],
  "blurb": "Disfarçado de pilha de riquezas, prende os intrusos com pseudópodes grudentos e os morde com ácido. Também cospe uma névoa corrosiva que queima e cega quem estiver num cone à sua frente.",
  "lore": "Parente gigantesco dos mímicos comuns, este é um dos mais antigos e astutos de sua espécie, capaz de imitar um tesouro inteiro em vez de um único objeto. Muitos fazem acordos com dragões e servem de tesouro falso nos covis, atraindo saqueadores para longe das riquezas verdadeiras e direto para a boca. Sua pele secreta uma cola que prende as presas, e seus poros liberam uma névoa ácida. Quando a luta vai mal, costuma barganhar a própria vida revelando onde está o tesouro real."
 },
 "escaravelhoDoTesouro": {
  "id": "escaravelhoDoTesouro",
  "tipo": "monstruosidade",
  "name": "Escaravelho do Tesouro",
  "nomeOriginal": "Hoard Scarab",
  "fonte": "FTD",
  "size": "miúdo",
  "level": 1,
  "cr": "1/8",
  "xp": 25,
  "abilities": {
   "str": 4,
   "dex": 16,
   "con": 11,
   "int": 3,
   "wis": 8,
   "cha": 6
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 7,
  "hpDice": "3d4",
  "speedFt": 20,
  "flyFt": 20,
  "speeds": {
   "flyFt": 20,
   "burrowFt": 20
  },
  "senses": {
   "passivePerception": 9,
   "darkvisionFt": 60,
   "tremorsenseFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 5,
    "damage": "1d4+3",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "acoesEspeciais": [
   {
    "nome": "Pó de Escamas",
    "tipo": "area",
    "shape": "raio",
    "areaFt": 5,
    "save": "dex",
    "dc": 13,
    "condition": "contornadoDeLuz",
    "rounds": 100,
    "repete": false,
    "bonus": true,
    "porDia": 1
   }
  ],
  "traits": [
   "aparenciaFalsa"
  ],
  "blurb": "Disfarça-se de joia ou moeda no meio do tesouro e ataca de surpresa com uma mordida que atrapalha a mira da vítima. Seu pó cintilante marca os intrusos para que dragões próximos possam caçá-los.",
  "lore": "Pequenos besouros de carapaça metálica e brilhante, os escaravelhos do tesouro vivem enterrados entre as pilhas de ouro dos covis de dragões. Parados, passam facilmente por peças de joalheria. Os dragões os toleram, e até apreciam, porque eles funcionam como alarmes vivos contra ladrões. Quem rouba o tesouro costuma sair coberto por um brilho azul que o denuncia por quilômetros."
 },
 "dragaoOco": {
  "id": "dragaoOco",
  "tipo": "morto-vivo",
  "name": "Dragão Oco",
  "nomeOriginal": "Hollow Dragon",
  "fonte": "FTD",
  "size": "enorme",
  "level": 17,
  "cr": "18",
  "xp": 20000,
  "abilities": {
   "str": 23,
   "dex": 12,
   "con": 21,
   "int": 16,
   "wis": 13,
   "cha": 21
  },
  "ac": 19,
  "acNote": "armadura natural",
  "maxHp": 241,
  "hpDice": "21d12+105",
  "speedFt": 40,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80
  },
  "senses": {
   "passivePerception": 23,
   "blindsightFt": 60,
   "darkvisionFt": 120
  },
  "saves": [
   "con",
   "int",
   "wis",
   "cha"
  ],
  "skills": [
   "arcanismo",
   "historia",
   "percepcao"
  ],
  "expertise": [
   "historia",
   "percepcao"
  ],
  "damageResistances": [
   "necrótico"
  ],
  "damageImmunities": [
   "veneno",
   "radiante"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "surdo",
   "exausto",
   "amedrontado",
   "paralisado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 12,
    "damage": "2d10+6",
    "type": "perfurante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "2d8",
     "type": "radiante"
    }
   },
   {
    "name": "Garra",
    "bonus": 12,
    "damage": "2d6+6",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida",
    "Garra",
    "Garra"
   ]
  },
  "breath": {
   "name": "Sopro Radiante",
   "kind": "save",
   "shape": "cone",
   "areaFt": 60,
   "save": "dex",
   "dc": 19,
   "damage": "12d8",
   "damageType": "radiante",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    5,
    6
   ]
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "acoesEspeciais": [
   {
    "nome": "Presença Drenante",
    "tipo": "area",
    "shape": "raio",
    "areaFt": 60,
    "save": "wis",
    "dc": 19,
    "condition": "esmorecido",
    "rounds": 1,
    "repete": false,
    "ateFimDoTurnoDele": true,
    "imunizaAoPassar": true
   }
  ],
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Garra",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Garra"
    },
    {
     "nome": "Amarras Fantasmagóricas",
     "custo": 2,
     "tipo": "alvo",
     "alcanceFt": 60,
     "save": "str",
     "dc": 19,
     "condition": "contido",
     "rounds": 1,
     "repete": false,
     "ateFimDoTurnoDoAlvo": true
    },
    {
     "nome": "Escamas Retumbantes",
     "custo": 3,
     "tipo": "area",
     "raioFt": 10,
     "save": "con",
     "dc": 19,
     "damage": "7d6",
     "damageType": "trovejante",
     "halfOnSave": true
    }
   ]
  },
  "traits": [
   "t_reconstrucao",
   "acoesLendarias"
  ],
  "blurb": "Luta de perto com mordida radiante e garras, enfraquece quem está ao redor com sua presença drenante e solta um cone de chamas radiantes devastador. Mesmo destruído, pode se remontar dias depois.",
  "lore": "Alguns dragões metálicos aceitam a morte-viva não por ambição, mas para cumprir um juramento ou guardar um artefato importante. O que resta é a carcaça vazia de suas escamas, preenchida por energia radiante que pode lembrar fogo, raios ou névoa, conforme a linhagem original. Nada os desvia da missão, e essa determinação é tão forte que o corpo se recompõe após ser despedaçado. Quando a tarefa termina, muitos finalmente aceitam o descanso, mas outros procuram novos propósitos ou simplesmente se recusam a partir."
 },
 "dragaoLeao": {
  "id": "dragaoLeao",
  "tipo": "monstruosidade",
  "name": "Dragão-Leão",
  "nomeOriginal": "Liondrake",
  "fonte": "FTD",
  "size": "grande",
  "level": 5,
  "cr": "7",
  "xp": 2900,
  "abilities": {
   "str": 19,
   "dex": 15,
   "con": 17,
   "int": 6,
   "wis": 12,
   "cha": 12
  },
  "ac": 16,
  "acNote": "armadura natural",
  "maxHp": 119,
  "hpDice": "14d10+42",
  "speedFt": 40,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60
  },
  "senses": {
   "passivePerception": 17,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "percepcao"
  ],
  "expertise": [
   "percepcao"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 7,
    "damage": "2d10+4",
    "type": "perfurante",
    "reachFt": 5,
    "onHit": {
     "save": "str",
     "dc": 15,
     "condition": "caido",
     "rounds": 1,
     "repete": false
    }
   },
   {
    "name": "Garra",
    "bonus": 7,
    "damage": "2d6+4",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida",
    "Garra",
    "Garra"
   ]
  },
  "acoesEspeciais": [
   {
    "nome": "Rugido Arrepiante",
    "recharge": [
     4,
     5,
     6
    ],
    "tipo": "area",
    "shape": "raio",
    "areaFt": 30,
    "save": "wis",
    "dc": 14,
    "condition": "amedrontado",
    "rounds": 10,
    "repete": true,
    "imunizaAoPassar": true
   }
  ],
  "traits": [],
  "blurb": "Fera voadora que mergulha com mordida e garras, derrubando alvos menores. Seu rugido apavorante pode deixar quem ouve amedrontado e até paralisado.",
  "lore": "O dragão-leão, também chamado de dragonne, une o corpo e a cabeça de um leão ao pescoço longo e às asas de um dragão de latão; os machos ostentam juba farta. É um caçador solitário e guloso que patrulha territórios bem definidos. Não costuma caçar pessoas de propósito, mas quem invade sua área vira presa, o que lhe deu fama de apreciar carne humanoide. Usa a ferocidade e o rugido para dominar presas e expulsar rivais."
 },
 "pacificadorMetalico": {
  "id": "pacificadorMetalico",
  "tipo": "constructo",
  "name": "Pacificador Metálico",
  "nomeOriginal": "Metallic Peacekeeper",
  "fonte": "FTD",
  "size": "médio",
  "level": 1,
  "cr": "4",
  "xp": 1100,
  "abilities": {
   "str": 17,
   "dex": 10,
   "con": 18,
   "int": 14,
   "wis": 12,
   "cha": 11
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 68,
  "hpDice": "8d8+32",
  "speedFt": 30,
  "senses": {
   "passivePerception": 11,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "damageImmunities": [
   "fogo"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "exausto",
   "amedrontado",
   "paralisado",
   "petrificado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Pancada",
    "bonus": 5,
    "damage": "3d8+3",
    "type": "concussão",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Pancada",
    "Pancada"
   ]
  },
  "acoesEspeciais": [
   {
    "nome": "Névoa Calmante",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "raio",
    "areaFt": 30,
    "save": "cha",
    "dc": 14,
    "condition": "enfeiticado",
    "rounds": 10,
    "repete": false
   }
  ],
  "traits": [
   "formaImutavel",
   "t_eloTelepatico"
  ],
  "blurb": "Golpeia duas vezes com punhos pesados e libera uma névoa calmante que enfeitiça e imobiliza quem estiver ao redor. Imune a fogo e a efeitos que alterem sua forma.",
  "lore": "O pacificador metálico é um constructo criado por dragões metálicos ou por seus aliados para manter a ordem e proteger lugares sob sua guarda. Ele mantém um elo telepático com o mestre, transmitindo o que vê e ouve. Prefere encerrar conflitos sem derramar sangue, acalmando os agressores com seu gás antes de recorrer à força. Costuma patrulhar covis, templos e comunidades ligadas a dragões bondosos."
 },
 "gorjeadorMetalico": {
  "id": "gorjeadorMetalico",
  "tipo": "constructo",
  "name": "Gorjeador Metálico",
  "nomeOriginal": "Metallic Warbler",
  "fonte": "FTD",
  "size": "miúdo",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 4,
   "dex": 15,
   "con": 12,
   "int": 9,
   "wis": 10,
   "cha": 12
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 14,
  "hpDice": "4d4+4",
  "speedFt": 40,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60
  },
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 60
  },
  "saves": [
   "dex"
  ],
  "skills": [],
  "expertise": [],
  "damageImmunities": [
   "fogo"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "exausto",
   "amedrontado",
   "paralisado",
   "petrificado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Garra",
    "bonus": 4,
    "damage": "1d4+2",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "acoesEspeciais": [
   {
    "nome": "Névoa Calmante",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "raio",
    "areaFt": 5,
    "save": "cha",
    "dc": 11,
    "condition": "enfeiticado",
    "rounds": 10,
    "repete": false
   }
  ],
  "traits": [
   "formaImutavel",
   "t_eloTelepatico"
  ],
  "blurb": "Pequeno constructo voador que arranha com as garras e solta uma névoa calmante capaz de deixar inimigos próximos enfeitiçados e imóveis.",
  "lore": "O gorjeador metálico é um minúsculo constructo em forma de pássaro, feito de metal reluzente por artífices ligados aos dragões metálicos. Serve a um mestre como mensageiro e batedor, mantendo com ele um elo telepático. Entende o Comum e o Dracônico, mas não fala. Em combate, prefere acalmar os agressores a feri-los, o que combina com sua índole geralmente bondosa."
 },
 "filhoteDeDragaoDePedraDaLua": {
  "id": "filhoteDeDragaoDePedraDaLua",
  "tipo": "dragão",
  "name": "Filhote de Dragão de Pedra-da-Lua",
  "nomeOriginal": "Moonstone Dragon Wyrmling",
  "fonte": "FTD",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 16,
   "dex": 14,
   "con": 14,
   "int": 16,
   "wis": 14,
   "cha": 17
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 39,
  "hpDice": "6d8+12",
  "speedFt": 30,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60
  },
  "senses": {
   "passivePerception": 14,
   "blindsightFt": 10,
   "darkvisionFt": 60
  },
  "saves": [
   "int",
   "wis",
   "cha"
  ],
  "skills": [
   "percepcao",
   "persuasao",
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [
   "enfeitiçado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 5,
    "damage": "2d8+3",
    "type": "perfurante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "1d6",
     "type": "radiante"
    }
   }
  ],
  "breath": {
   "name": "Sopro",
   "kind": "save",
   "shape": "cone",
   "areaFt": 90,
   "save": "con",
   "dc": 12,
   "damage": "4d6",
   "damageType": "radiante",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    5,
    6
   ]
  },
  "traits": [],
  "blurb": "Morde com alcance de 3 m, somando dano radiante, e alterna entre um sopro de névoa que faz os inimigos adormecerem em um cone enorme e um raio de luar radiante em linha. Cuidado com o sono: aliados caídos ficam à mercê das mordidas.",
  "lore": "Dragões de pedra-da-lua são criaturas oníricas ligadas à luz da lua e ao mundo dos sonhos. Ainda filhote, este dragão já é curioso, falante e mais interessado em observar mortais do que em destruí-los. Costuma surgir em noites de lua clara, em ruínas isoladas, clareiras e ilhas enevoadas. Quando ameaçado, prefere pôr os intrusos para dormir a travar uma luta longa."
 },
 "grandeWyrmVermelho": {
  "id": "grandeWyrmVermelho",
  "tipo": "dragão",
  "name": "Grande Wyrm Vermelho",
  "nomeOriginal": "Red Greatwyrm",
  "fonte": "FTD",
  "size": "imenso",
  "level": 25,
  "cr": "27",
  "xp": 105000,
  "abilities": {
   "str": 30,
   "dex": 14,
   "con": 30,
   "int": 21,
   "wis": 20,
   "cha": 26
  },
  "ac": 22,
  "acNote": "armadura natural",
  "maxHp": 533,
  "hpDice": "26d20+260",
  "speedFt": 60,
  "flyFt": 120,
  "speeds": {
   "flyFt": 120,
   "swimFt": 60,
   "burrowFt": 60
  },
  "senses": {
   "passivePerception": 31,
   "truesightFt": 120
  },
  "saves": [
   "dex",
   "con",
   "wis",
   "cha"
  ],
  "skills": [
   "intimidacao",
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "fogo"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "amedrontado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 18,
    "damage": "2d10+10",
    "type": "perfurante",
    "reachFt": 15,
    "danoExtra": {
     "damage": "2d12",
     "type": "energético"
    }
   },
   {
    "name": "Garra",
    "bonus": 18,
    "damage": "2d8+10",
    "type": "cortante",
    "reachFt": 10,
    "onHit": {
     "semResistencia": true,
     "dc": 20,
     "escape": 20,
     "condition": "contido",
     "note": "é agarrado",
     "maxAgarrados": 1
    }
   },
   {
    "name": "Cauda",
    "bonus": 18,
    "damage": "2d8+10",
    "type": "concussão",
    "reachFt": 20,
    "onHit": {
     "save": "str",
     "dc": 26,
     "condition": "caido",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida",
    "Garra",
    "Garra"
   ]
  },
  "recursos": {
   "resistenciaLendaria": 4
  },
  "acoesEspeciais": [
   {
    "nome": "Sopro de Fogo",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 300,
    "save": "dex",
    "dc": 26,
    "damage": "12d12",
    "damageType": "fogo",
    "halfOnSave": true
   }
  ],
  "despertar": {
   "pv": 425
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Ataque",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Garra"
    },
    {
     "nome": "Ataque de Asas",
     "custo": 2,
     "tipo": "area",
     "raioFt": 30,
     "save": "dex",
     "dc": 26,
     "damage": "2d6+10",
     "damageType": "concussão",
     "halfOnSave": false,
     "condition": "caido",
     "rounds": 10,
     "repete": false
    },
    {
     "nome": "Lança Arcana",
     "custo": 3,
     "tipo": "lancas",
     "n": 4,
     "alcanceFt": 120,
     "damage": "1d8+8",
     "damageType": "energético"
    }
   ]
  },
  "traits": [
   "despertar",
   "t_naturezaIncomum",
   "acoesLendarias"
  ],
  "marcas": [
   "chromatic"
  ],
  "blurb": "Colosso de fogo que agarra com as garras, derruba com a cauda e varre o campo com um sopro flamejante em cone de 90 m. Ao chegar a 0 PV, desperta e volta com 425 PV, sopro recarregado e novos poderes míticos.",
  "lore": "O grande wyrm vermelho é um dragão cromático que superou a velhice comum e se tornou uma força quase divina. Já não precisa comer nem beber e passa os séculos guardando seu tesouro e cultivando o próprio orgulho. É cruel, vaidoso e não tolera rivais. Quando parece derrotado, sua essência cromática desperta e o devolve à luta com fúria renovada."
 },
 "filhoteDeDragaoDeSafira": {
  "id": "filhoteDeDragaoDeSafira",
  "tipo": "dragão",
  "name": "Filhote de Dragão de Safira",
  "nomeOriginal": "Sapphire Dragon Wyrmling",
  "fonte": "FTD",
  "size": "médio",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 17,
   "dex": 14,
   "con": 16,
   "int": 14,
   "wis": 13,
   "cha": 14
  },
  "ac": 16,
  "acNote": "armadura natural",
  "maxHp": 45,
  "hpDice": "6d8+18",
  "speedFt": 30,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60,
   "climbFt": 30,
   "burrowFt": 15
  },
  "senses": {
   "passivePerception": 15,
   "blindsightFt": 30,
   "darkvisionFt": 120
  },
  "saves": [
   "dex",
   "con",
   "wis",
   "cha"
  ],
  "skills": [
   "historia",
   "percepcao",
   "persuasao",
   "furtividade"
  ],
  "expertise": [
   "percepcao",
   "persuasao"
  ],
  "damageResistances": [
   "elétrico",
   "trovejante"
  ],
  "conditionImmunities": [
   "amedrontado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 5,
    "damage": "1d10+3",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d6",
     "type": "trovejante"
    }
   }
  ],
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "alarme",
    "discoFlutuante"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "alarme": 1,
    "discoFlutuante": 1
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Sopro Debilitante",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 15,
    "save": "con",
    "dc": 13,
    "damage": "4d10",
    "damageType": "trovejante",
    "halfOnSave": true,
    "condition": "incapacitado",
    "rounds": 1,
    "repete": false,
    "ateFimDoTurnoDele": true
   }
  ],
  "traits": [
   "spiderClimb",
   "escavador"
  ],
  "marcas": [
   "gem"
  ],
  "blurb": "Escava e escala paredes para surgir de onde ninguém espera, mordendo com estalos sônicos. Seu sopro de som agudo causa dano trovejante e pode deixar vários inimigos incapacitados.",
  "lore": "Dragões de safira são dragões de gema ligados à mente e ao subterrâneo, com escamas azuis cintilantes. Os filhotes vivem em cavernas e túneis profundos, que ampliam escavando a própria rocha. São curiosos, desconfiados e territoriais, usando telepatia para sondar quem se aproxima. Gostam de colecionar saberes e objetos antigos, e preferem negociar a lutar quando a vantagem não é clara."
 },
 "grandeWyrmDeSafira": {
  "id": "grandeWyrmDeSafira",
  "tipo": "dragão",
  "name": "Grande Wyrm de Safira",
  "nomeOriginal": "Sapphire Greatwyrm",
  "fonte": "FTD",
  "size": "imenso",
  "level": 25,
  "cr": "26",
  "xp": 90000,
  "abilities": {
   "str": 28,
   "dex": 14,
   "con": 29,
   "int": 30,
   "wis": 24,
   "cha": 25
  },
  "ac": 21,
  "acNote": "armadura natural",
  "maxHp": 507,
  "hpDice": "26d20+234",
  "speedFt": 60,
  "flyFt": 120,
  "hover": true,
  "speeds": {
   "flyFt": 120,
   "swimFt": 60,
   "burrowFt": 60
  },
  "senses": {
   "passivePerception": 25,
   "truesightFt": 120
  },
  "saves": [
   "dex",
   "con",
   "wis",
   "cha"
  ],
  "skills": [
   "arcanismo",
   "historia",
   "percepcao"
  ],
  "expertise": [
   "arcanismo"
  ],
  "damageImmunities": [
   "trovejante"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "amedrontado",
   "envenenado",
   "caido"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 17,
    "damage": "2d10+9",
    "type": "perfurante",
    "reachFt": 15,
    "danoExtra": {
     "damage": "3d10",
     "type": "energético"
    }
   },
   {
    "name": "Garra",
    "bonus": 17,
    "damage": "2d8+9",
    "type": "cortante",
    "reachFt": 10,
    "onHit": {
     "semResistencia": true,
     "dc": 19,
     "escape": 19,
     "condition": "contido",
     "note": "é agarrado",
     "maxAgarrados": 1
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida",
    "Garra",
    "Garra"
   ]
  },
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "dissiparMagia",
    "jaulaDeEnergia",
    "viagemPlanar",
    "inverterAGravidade",
    "pararOTempo"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "dissiparMagia": 1,
    "jaulaDeEnergia": 1,
    "viagemPlanar": 1,
    "inverterAGravidade": 1,
    "pararOTempo": 1
   },
   "cdPorMagia": {
    "dissiparMagia": 26,
    "jaulaDeEnergia": 26,
    "viagemPlanar": 26,
    "inverterAGravidade": 26,
    "pararOTempo": 26
   }
  },
  "recursos": {
   "resistenciaLendaria": 4
  },
  "acoesEspeciais": [
   {
    "nome": "Sopro",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 300,
    "save": "dex",
    "dc": 25,
    "damage": "11d12",
    "damageType": "energético",
    "halfOnSave": true,
    "condition": "caido",
    "rounds": 1,
    "repete": false,
    "ateFimDoTurnoDele": true
   },
   {
    "nome": "Telecinese em Massa",
    "tipo": "area",
    "shape": "raio",
    "areaFt": 120,
    "save": "str",
    "dc": 26,
    "damage": "7d12",
    "damageType": "energético",
    "halfOnSave": false,
    "condition": "contido",
    "rounds": 10,
    "repete": true
   },
   {
    "nome": "Passo Psíquico",
    "tipo": "teleporte",
    "alcanceFt": 60,
    "bonus": true
   }
  ],
  "despertar": {
   "pv": 400
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Garra",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Garra"
    },
    {
     "nome": "Psiônicos",
     "custo": 2,
     "tipo": "magia"
    },
    {
     "nome": "Raio Psíquico",
     "custo": 3,
     "tipo": "linha",
     "comprimentoFt": 90,
     "larguraFt": 10,
     "save": "int",
     "dc": 26,
     "damage": "5d10",
     "damageType": "psíquico",
     "halfOnSave": true
    }
   ]
  },
  "traits": [
   "despertar",
   "t_naturezaIncomum",
   "t_mudarDeForma",
   "acoesLendarias"
  ],
  "marcas": [
   "gem"
  ],
  "blurb": "Colosso psiônico que esmaga grupos inteiros com um sopro de força em cone de 90 m, agarra com as garras e se teleporta pelo campo. Ao cair a 0 PV, desperta seu poder de gema e volta com 400 PV, podendo erguer e arremessar todos telecineticamente.",
  "lore": "Os grandes wyrms de safira são dragões de gema que atingiram o ápice da idade e do poder mental. Vivem nas profundezas da terra e entre planos, guardando segredos e conhecimentos antigos. Pensam com frieza e neutralidade, preferindo observar e calcular antes de agir. Quando provocados, usam psiônicos capazes de dobrar o tempo e a gravidade."
 },
 "grandeSerpeDePrata": {
  "id": "grandeSerpeDePrata",
  "tipo": "dragão",
  "name": "Grande Serpe de Prata",
  "nomeOriginal": "Silver Greatwyrm",
  "fonte": "FTD",
  "size": "imenso",
  "level": 25,
  "cr": "28",
  "xp": 120000,
  "abilities": {
   "str": 30,
   "dex": 16,
   "con": 29,
   "int": 21,
   "wis": 22,
   "cha": 30
  },
  "ac": 22,
  "acNote": "armadura natural",
  "maxHp": 565,
  "hpDice": "29d20+261",
  "speedFt": 60,
  "flyFt": 120,
  "speeds": {
   "flyFt": 120,
   "swimFt": 60,
   "burrowFt": 60
  },
  "senses": {
   "passivePerception": 32,
   "truesightFt": 120
  },
  "saves": [
   "dex",
   "con",
   "int",
   "wis",
   "cha"
  ],
  "skills": [
   "intuicao",
   "percepcao",
   "persuasao"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "frio"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "amedrontado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 18,
    "damage": "2d10+10",
    "type": "perfurante",
    "reachFt": 15,
    "danoExtra": {
     "damage": "2d12",
     "type": "energético"
    }
   },
   {
    "name": "Garra",
    "bonus": 18,
    "damage": "2d8+10",
    "type": "cortante",
    "reachFt": 10,
    "onHit": {
     "semResistencia": true,
     "dc": 20,
     "escape": 20,
     "condition": "contido",
     "note": "é agarrado",
     "maxAgarrados": 1
    }
   },
   {
    "name": "Cauda",
    "bonus": 18,
    "damage": "2d10+10",
    "type": "concussão",
    "reachFt": 20,
    "onHit": {
     "save": "str",
     "dc": 26,
     "condition": "caido",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida",
    "Garra",
    "Garra"
   ]
  },
  "breath": {
   "name": "Arma de Sopro",
   "kind": "save",
   "shape": "cone",
   "areaFt": 300,
   "save": "dex",
   "dc": 25,
   "damage": "13d12",
   "damageType": "frio",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    5,
    6
   ]
  },
  "recursos": {
   "resistenciaLendaria": 4
  },
  "despertar": {
   "pv": 450
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Ataque",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Garra"
    },
    {
     "nome": "Ataque de Asas",
     "custo": 2,
     "tipo": "area",
     "raioFt": 30,
     "save": "dex",
     "dc": 26,
     "damage": "2d6+10",
     "damageType": "concussão",
     "halfOnSave": false,
     "condition": "caido",
     "rounds": 10,
     "repete": false
    }
   ]
  },
  "traits": [
   "t_mudarDeForma",
   "despertar",
   "t_naturezaIncomum",
   "acoesLendarias"
  ],
  "marcas": [
   "metallic"
  ],
  "blurb": "Colosso dracônico que morde, agarra com as garras e varre com a cauda, enquanto seus sopros em cone de 90 m congelam ou derrubam inconscientes grupos inteiros. Ao cair a 0 PV, desperta seu poder metálico, volta com 450 PV e ganha ações míticas.",
  "lore": "As grandes serpes metálicas são dragões que atravessaram eras e alcançaram um poder quase divino. A de prata costuma ser uma guardiã ordeira e benevolente, que valoriza a justiça e a proteção dos fracos. Muitas vezes caminha entre os povos menores disfarçada de forma humana, observando e aconselhando. Não precisa comer nem beber, e quando enfim se lança à batalha, poucos sobrevivem para contar."
 },
 "enxameDeEscaravelhosDoTesouro": {
  "id": "enxameDeEscaravelhosDoTesouro",
  "tipo": "monstruosidade",
  "name": "Enxame de Escaravelhos do Tesouro",
  "nomeOriginal": "Swarm of Hoard Scarabs",
  "fonte": "FTD",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 6,
   "dex": 16,
   "con": 11,
   "int": 3,
   "wis": 8,
   "cha": 6
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 31,
  "hpDice": "7d8",
  "speedFt": 20,
  "flyFt": 20,
  "speeds": {
   "flyFt": 20,
   "burrowFt": 20
  },
  "senses": {
   "passivePerception": 9,
   "darkvisionFt": 60,
   "tremorsenseFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "concussão",
   "perfurante",
   "cortante"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "amedrontado",
   "agarrado",
   "paralisado",
   "petrificado",
   "caido",
   "contido",
   "atordoado"
  ],
  "attacks": [
   {
    "name": "Enxame de Mordidas",
    "bonus": 5,
    "damage": "3d6+3",
    "type": "perfurante",
    "reachFt": 0,
    "danoExtra": {
     "damage": "1d6+3",
     "type": "perfurante"
    }
   }
  ],
  "acoesEspeciais": [
   {
    "nome": "Pó de Escamas",
    "tipo": "area",
    "shape": "raio",
    "areaFt": 10,
    "save": "dex",
    "dc": 13,
    "condition": "contornadoDeLuz",
    "rounds": 100,
    "repete": false,
    "bonus": true,
    "porDia": 1
   }
  ],
  "traits": [
   "aparenciaFalsa",
   "enxameDoLivro"
  ],
  "blurb": "Um enxame que se disfarça entre moedas e joias e cobre quem estiver em seu espaço com mordidas que atrapalham os ataques. Uma vez por dia solta um pó brilhante que marca os alvos para qualquer dragão nas redondezas.",
  "lore": "Esses escaravelhos de carapaça metálica vivem nos tesouros acumulados por dragões, misturados ao ouro e às pedras preciosas. Parados, parecem apenas parte da pilha de riquezas, o que pega ladrões desprevenidos. Quando perturbados, sobem em nuvem, cavam pelo monte de moedas e atacam em massa. O pó de suas asas funciona como um alarme mágico, denunciando invasores ao dono do covil."
 },
 "filhoteDeDragaoDeTopazio": {
  "id": "filhoteDeDragaoDeTopazio",
  "tipo": "dragão",
  "name": "Filhote de Dragão de Topázio",
  "nomeOriginal": "Topaz Dragon Wyrmling",
  "fonte": "FTD",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 15,
   "dex": 12,
   "con": 13,
   "int": 14,
   "wis": 13,
   "cha": 14
  },
  "ac": 16,
  "acNote": "armadura natural",
  "maxHp": 33,
  "hpDice": "6d8+6",
  "speedFt": 30,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60,
   "swimFt": 30
  },
  "senses": {
   "passivePerception": 15,
   "blindsightFt": 10,
   "darkvisionFt": 120
  },
  "saves": [
   "dex",
   "con",
   "wis",
   "cha"
  ],
  "skills": [
   "intimidacao",
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "intimidacao",
   "percepcao"
  ],
  "damageResistances": [
   "frio",
   "necrótico"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 4,
    "damage": "1d10+2",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d4",
     "type": "necrótico"
    }
   }
  ],
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "perdicao"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "perdicao": 1
   },
   "cdPorMagia": {
    "perdicao": 12
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Sopro Ressecante",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 15,
    "save": "con",
    "dc": 11,
    "damage": "6d6",
    "damageType": "necrótico",
    "halfOnSave": true
   }
  ],
  "traits": [],
  "marcas": [
   "gem"
  ],
  "blurb": "Morde com presas que drenam a vitalidade e exala um cone de energia necrótica que resseca e enfraquece os inimigos, cortando a força de seus golpes. Também pode lançar Perdição com seus poderes psiônicos.",
  "lore": "Dragões de topázio são dragões de gema, criaturas de mente psiônica ligadas aos mistérios do plano material. Mesmo jovens, preferem viver perto de mares e costas, nadando com facilidade e respirando sob a água. São solitários e desconfiados, guardando seu território com intimidação mais do que com conversa. Quando provocados, secam a vida dos intrusos com seu sopro amarelado."
 },
 "grandeSerpeDeTopazio": {
  "id": "grandeSerpeDeTopazio",
  "tipo": "dragão",
  "name": "Grande Serpe de Topázio",
  "nomeOriginal": "Topaz Greatwyrm",
  "fonte": "FTD",
  "size": "imenso",
  "level": 25,
  "cr": "26",
  "xp": 90000,
  "abilities": {
   "str": 28,
   "dex": 14,
   "con": 29,
   "int": 30,
   "wis": 24,
   "cha": 25
  },
  "ac": 21,
  "acNote": "armadura natural",
  "maxHp": 507,
  "hpDice": "26d20+234",
  "speedFt": 60,
  "flyFt": 120,
  "hover": true,
  "speeds": {
   "flyFt": 120,
   "swimFt": 60,
   "burrowFt": 60
  },
  "senses": {
   "passivePerception": 25,
   "truesightFt": 120
  },
  "saves": [
   "dex",
   "con",
   "wis",
   "cha"
  ],
  "skills": [
   "arcanismo",
   "historia",
   "percepcao"
  ],
  "expertise": [
   "arcanismo"
  ],
  "damageImmunities": [
   "necrótico"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "amedrontado",
   "envenenado",
   "caido"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 17,
    "damage": "2d10+9",
    "type": "perfurante",
    "reachFt": 15,
    "danoExtra": {
     "damage": "3d10",
     "type": "energético"
    }
   },
   {
    "name": "Garra",
    "bonus": 17,
    "damage": "2d8+9",
    "type": "cortante",
    "reachFt": 10,
    "onHit": {
     "semResistencia": true,
     "dc": 19,
     "escape": 19,
     "condition": "contido",
     "note": "é agarrado",
     "maxAgarrados": 1
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida",
    "Garra",
    "Garra"
   ]
  },
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "dissiparMagia",
    "jaulaDeEnergia",
    "viagemPlanar",
    "inverterAGravidade",
    "pararOTempo"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "dissiparMagia": 1,
    "jaulaDeEnergia": 1,
    "viagemPlanar": 1,
    "inverterAGravidade": 1,
    "pararOTempo": 1
   },
   "cdPorMagia": {
    "dissiparMagia": 26,
    "jaulaDeEnergia": 26,
    "viagemPlanar": 26,
    "inverterAGravidade": 26,
    "pararOTempo": 26
   }
  },
  "recursos": {
   "resistenciaLendaria": 4
  },
  "acoesEspeciais": [
   {
    "nome": "Sopro",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 300,
    "save": "dex",
    "dc": 25,
    "damage": "11d12",
    "damageType": "energético",
    "halfOnSave": true,
    "condition": "caido",
    "rounds": 1,
    "repete": false,
    "ateFimDoTurnoDele": true
   },
   {
    "nome": "Telecinese em Massa",
    "tipo": "area",
    "shape": "raio",
    "areaFt": 120,
    "save": "str",
    "dc": 26,
    "damage": "7d12",
    "damageType": "energético",
    "halfOnSave": false,
    "condition": "contido",
    "rounds": 10,
    "repete": true
   },
   {
    "nome": "Passo Psíquico",
    "tipo": "teleporte",
    "alcanceFt": 60,
    "bonus": true
   }
  ],
  "despertar": {
   "pv": 400
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Garra",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Garra"
    },
    {
     "nome": "Psiônica",
     "custo": 2,
     "tipo": "magia"
    },
    {
     "nome": "Raio Psíquico",
     "custo": 3,
     "tipo": "linha",
     "comprimentoFt": 90,
     "larguraFt": 10,
     "save": "int",
     "dc": 26,
     "damage": "5d10",
     "damageType": "psíquico",
     "halfOnSave": true
    }
   ]
  },
  "traits": [
   "despertar",
   "t_naturezaIncomum",
   "t_mudarDeForma",
   "acoesLendarias"
  ],
  "marcas": [
   "gem"
  ],
  "blurb": "Dragão colossal que esmaga grupos inteiros com um sopro de força em cone enorme, agarra presas com as garras e se teletransporta enquanto lança magias psiônicas devastadoras como parar o tempo e jaula de força. Ao cair a 0 PV, desperta e volta com 400 PV.",
  "lore": "As grandes serpes de topázio são os dragões de gema mais antigos e poderosos dessa linhagem, ligados à mente e à energia psiônica. Ponderadas e reservadas, preferem observar e calcular antes de agir, guardando segredos acumulados ao longo de eras. Podem cavar, nadar e voar, e muitas vezes caminham entre os mortais sob formas pequenas e discretas. Quando provocadas, revelam um poder telecinético capaz de remodelar o campo de batalha."
 },
 "grandeSerpeBranca": {
  "id": "grandeSerpeBranca",
  "tipo": "dragão",
  "name": "Grande Serpe Branca",
  "nomeOriginal": "White Greatwyrm",
  "fonte": "FTD",
  "size": "imenso",
  "level": 25,
  "cr": "27",
  "xp": 105000,
  "abilities": {
   "str": 30,
   "dex": 14,
   "con": 30,
   "int": 21,
   "wis": 20,
   "cha": 26
  },
  "ac": 22,
  "acNote": "armadura natural",
  "maxHp": 533,
  "hpDice": "26d20+260",
  "speedFt": 60,
  "flyFt": 120,
  "speeds": {
   "flyFt": 120,
   "swimFt": 60,
   "burrowFt": 60
  },
  "senses": {
   "passivePerception": 31,
   "truesightFt": 120
  },
  "saves": [
   "dex",
   "con",
   "wis",
   "cha"
  ],
  "skills": [
   "intimidacao",
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "frio"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "amedrontado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 18,
    "damage": "2d10+10",
    "type": "perfurante",
    "reachFt": 15,
    "danoExtra": {
     "damage": "2d12",
     "type": "energético"
    }
   },
   {
    "name": "Garra",
    "bonus": 18,
    "damage": "2d8+10",
    "type": "cortante",
    "reachFt": 10,
    "onHit": {
     "semResistencia": true,
     "dc": 20,
     "escape": 20,
     "condition": "contido",
     "note": "é agarrado",
     "maxAgarrados": 1
    }
   },
   {
    "name": "Cauda",
    "bonus": 18,
    "damage": "2d8+10",
    "type": "concussão",
    "reachFt": 20,
    "onHit": {
     "save": "str",
     "dc": 26,
     "condition": "caido",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida",
    "Garra",
    "Garra"
   ]
  },
  "recursos": {
   "resistenciaLendaria": 4
  },
  "acoesEspeciais": [
   {
    "nome": "Sopro",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 300,
    "save": "dex",
    "dc": 26,
    "damage": "12d12",
    "damageType": "frio",
    "halfOnSave": true
   }
  ],
  "despertar": {
   "pv": 425
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Ataque",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Garra"
    },
    {
     "nome": "Ataque de Asas",
     "custo": 2,
     "tipo": "area",
     "raioFt": 30,
     "save": "dex",
     "dc": 26,
     "damage": "2d6+10",
     "damageType": "concussão",
     "halfOnSave": false,
     "condition": "caido",
     "rounds": 10,
     "repete": false
    },
    {
     "nome": "Lança Arcana",
     "custo": 3,
     "tipo": "lancas",
     "n": 4,
     "alcanceFt": 120,
     "damage": "1d8+8",
     "damageType": "energético"
    }
   ]
  },
  "traits": [
   "despertar",
   "t_naturezaIncomum",
   "acoesLendarias"
  ],
  "marcas": [
   "chromatic"
  ],
  "blurb": "Colosso dracônico que agarra com as garras, derruba com a cauda e varre o campo com um sopro gélido em cone de 90 m. Ao chegar a 0 PV, desperta, volta com 425 PV e ganha ações míticas.",
  "lore": "As grandes serpes são dragões cromáticos que alcançaram um poder quase divino, muito além dos anciões comuns. A branca domina regiões de gelo eterno, onde escava, nada e voa com igual facilidade. Não precisa comer nem beber, e sua fúria fria é guiada por uma inteligência antiga e cruel. Quando parece derrotada, desperta sua essência cromática e retorna ainda mais perigosa."
 },
 "dragaoDeAmetistaJovem": {
  "id": "dragaoDeAmetistaJovem",
  "tipo": "dragão",
  "name": "Dragão de Ametista Jovem",
  "nomeOriginal": "Young Amethyst Dragon",
  "fonte": "FTD",
  "size": "grande",
  "level": 9,
  "cr": "9",
  "xp": 5000,
  "abilities": {
   "str": 21,
   "dex": 12,
   "con": 21,
   "int": 18,
   "wis": 15,
   "cha": 19
  },
  "ac": 18,
  "acNote": "armadura natural",
  "maxHp": 168,
  "hpDice": "16d10+80",
  "speedFt": 40,
  "flyFt": 80,
  "hover": true,
  "speeds": {
   "flyFt": 80,
   "swimFt": 40
  },
  "senses": {
   "passivePerception": 20,
   "blindsightFt": 30,
   "darkvisionFt": 120
  },
  "saves": [
   "dex",
   "con",
   "wis",
   "cha"
  ],
  "skills": [
   "arcanismo",
   "percepcao",
   "persuasao",
   "furtividade"
  ],
  "expertise": [
   "arcanismo",
   "percepcao"
  ],
  "damageResistances": [
   "energético",
   "psíquico"
  ],
  "conditionImmunities": [
   "amedrontado",
   "caido"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 9,
    "damage": "2d10+5",
    "type": "perfurante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "1d8",
     "type": "energético"
    }
   },
   {
    "name": "Garra",
    "bonus": 9,
    "damage": "1d8+5",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida",
    "Garra",
    "Garra"
   ]
  },
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "piscar",
    "dissiparMagia",
    "protecaoBemMal",
    "enviarMensagem"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "piscar": 1,
    "dissiparMagia": 1,
    "protecaoBemMal": 1,
    "enviarMensagem": 1
   },
   "cdPorMagia": {
    "piscar": 16,
    "dissiparMagia": 16,
    "protecaoBemMal": 16,
    "enviarMensagem": 16
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Sopro de Singularidade",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 30,
    "save": "str",
    "dc": 17,
    "damage": "8d8",
    "damageType": "energético",
    "halfOnSave": true
   }
  ],
  "traits": [],
  "marcas": [
   "gem"
  ],
  "blurb": "Combina mordida com dano energético e duas garras, e seu sopro de singularidade causa muito dano energético num cone e prende os alvos no lugar. Teleporta-se com piscar e anula magias, sendo difícil de cercar.",
  "lore": "Dragões de ametista são dragões de gema de natureza psiônica, conhecidos pela mente afiada e pelo interesse em segredos arcanos. Os jovens já falam por telepatia e preferem resolver conflitos com diplomacia calculada antes de recorrer às garras. Anfíbios, costumam fazer covis em cavernas submersas ou lagos profundos ricos em cristais. São neutros e pragmáticos, fazendo alianças apenas quando lhes trazem vantagem."
 },
 "dragaoDeCristalJovem": {
  "id": "dragaoDeCristalJovem",
  "tipo": "dragão",
  "name": "Dragão de Cristal Jovem",
  "nomeOriginal": "Young Crystal Dragon",
  "fonte": "FTD",
  "size": "grande",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 17,
   "dex": 12,
   "con": 18,
   "int": 16,
   "wis": 14,
   "cha": 17
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 95,
  "hpDice": "10d10+40",
  "speedFt": 40,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80,
   "climbFt": 40,
   "burrowFt": 20
  },
  "senses": {
   "passivePerception": 18,
   "blindsightFt": 30,
   "darkvisionFt": 120
  },
  "saves": [
   "dex",
   "con",
   "wis",
   "cha"
  ],
  "skills": [
   "percepcao",
   "furtividade",
   "sobrevivencia"
  ],
  "expertise": [
   "percepcao",
   "furtividade"
  ],
  "damageResistances": [
   "frio",
   "radiante"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 6,
    "damage": "2d10+3",
    "type": "perfurante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "1d8",
     "type": "radiante"
    }
   },
   {
    "name": "Garra",
    "bonus": 6,
    "damage": "1d6+3",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida",
    "Garra",
    "Garra"
   ]
  },
  "breath": {
   "name": "Sopro Cintilante (Recarga 5–6)",
   "kind": "save",
   "shape": "cone",
   "areaFt": 30,
   "save": "con",
   "dc": 15,
   "damage": "6d8",
   "damageType": "radiante",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    5,
    6
   ]
  },
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "padraoHipnotico",
    "restauracaoMenor",
    "luzesDancantes",
    "orientacao"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "padraoHipnotico": 1,
    "restauracaoMenor": 1
   },
   "aVontade": [
    "luzesDancantes",
    "orientacao"
   ],
   "cdPorMagia": {
    "padraoHipnotico": 16,
    "restauracaoMenor": 16,
    "luzesDancantes": 16,
    "orientacao": 16
   }
  },
  "traits": [],
  "marcas": [
   "gem"
  ],
  "blurb": "Combina mordida radiante e garras com um sopro cintilante em cone que fere vários alvos e lhe concede PV temporários. Também usa psiônica para hipnotizar grupos inteiros.",
  "lore": "Dragões de cristal são dragões de gema curiosos e brincalhões, ligados à luz e à mente. Os jovens costumam montar covis em cavernas geladas ou picos cobertos de neve, onde o brilho das estrelas reflete nas paredes cristalinas. Gostam de conversar por telepatia e às vezes aceitam aprendizes, mas se ofendem fácil quando alguém zomba deles. Defendem seu território com rajadas de luz ofuscante."
 },
 "dragaoProfundoJovem": {
  "id": "dragaoProfundoJovem",
  "tipo": "dragão",
  "name": "Dragão Profundo Jovem",
  "nomeOriginal": "Young Deep Dragon",
  "fonte": "FTD",
  "size": "grande",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 18,
   "dex": 13,
   "con": 16,
   "int": 12,
   "wis": 14,
   "cha": 16
  },
  "ac": 16,
  "acNote": "armadura natural",
  "maxHp": 93,
  "hpDice": "11d10+33",
  "speedFt": 40,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80,
   "swimFt": 40,
   "burrowFt": 20
  },
  "senses": {
   "passivePerception": 15,
   "blindsightFt": 30,
   "darkvisionFt": 150
  },
  "saves": [
   "dex",
   "con",
   "wis",
   "cha"
  ],
  "skills": [
   "percepcao",
   "persuasao",
   "furtividade"
  ],
  "expertise": [
   "furtividade"
  ],
  "damageResistances": [
   "veneno",
   "psíquico"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "amedrontado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 7,
    "damage": "1d10+4",
    "type": "perfurante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "1d6",
     "type": "veneno"
    }
   },
   {
    "name": "Garra",
    "bonus": 7,
    "damage": "1d6+4",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida",
    "Garra",
    "Garra"
   ]
  },
  "acoesEspeciais": [
   {
    "nome": "Sopro de Pesadelo",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 30,
    "save": "wis",
    "dc": 14,
    "damage": "4d10",
    "damageType": "psíquico",
    "halfOnSave": true,
    "condition": "amedrontado",
    "rounds": 10,
    "repete": true
   }
  ],
  "traits": [],
  "blurb": "Combina mordida venenosa e garras em sequência, e solta uma nuvem de esporos que causa dano psíquico e deixa os alvos amedrontados. Voa, nada e escava, então pode surgir de qualquer direção.",
  "lore": "Dragões profundos habitam as cavernas mais remotas do Subterrâneo, onde a luz do sol nunca chega. Ainda jovem, este dragão já é ardiloso e prefere manipular as criaturas subterrâneas com palavras antes de recorrer às garras. Ele se move com facilidade por túneis, lagos escuros e grandes cavernas abertas. Sua mente resistente o torna difícil de enganar ou assustar, e seus esporos trazem pesadelos a quem os respira."
 },
 "tartarugaDragaoJovem": {
  "id": "tartarugaDragaoJovem",
  "tipo": "dragão",
  "name": "Tartaruga-Dragão Jovem",
  "nomeOriginal": "Young Dragon Turtle",
  "fonte": "FTD",
  "size": "enorme",
  "level": 9,
  "cr": "10",
  "xp": 5900,
  "abilities": {
   "str": 21,
   "dex": 10,
   "con": 19,
   "int": 10,
   "wis": 12,
   "cha": 12
  },
  "ac": 19,
  "acNote": "armadura natural",
  "maxHp": 178,
  "hpDice": "17d12+68",
  "speedFt": 20,
  "speeds": {
   "swimFt": 40
  },
  "senses": {
   "passivePerception": 11,
   "darkvisionFt": 120
  },
  "saves": [
   "dex",
   "con",
   "wis"
  ],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "fogo"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 9,
    "damage": "1d12+5",
    "type": "perfurante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "1d12",
     "type": "elétrico"
    }
   },
   {
    "name": "Garra",
    "bonus": 9,
    "damage": "1d8+5",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida",
    "Garra",
    "Garra"
   ]
  },
  "breath": {
   "name": "Sopro de Vapor",
   "kind": "save",
   "shape": "cone",
   "areaFt": 30,
   "save": "con",
   "dc": 16,
   "damage": "12d6",
   "damageType": "fogo",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    5,
    6
   ]
  },
  "traits": [],
  "blurb": "Combina mordida eletrizada de longo alcance com duas garras, e pode soltar um cone de vapor escaldante que causa muito dano de fogo, mesmo debaixo d'água.",
  "lore": "A tartaruga-dragão jovem é um dragão marinho de casco enorme que ainda não atingiu o tamanho colossal dos adultos. Vive em mares profundos, recifes e costas rochosas, movendo-se com agilidade na água e com lentidão em terra. Costuma defender com ferocidade seu território e os tesouros que encontra em naufrágios. Pode ser negociada com presentes, mas reage com violência a quem invade suas águas."
 },
 "dragaoDeEsmeraldaJovem": {
  "id": "dragaoDeEsmeraldaJovem",
  "tipo": "dragão",
  "name": "Dragão de Esmeralda Jovem",
  "nomeOriginal": "Young Emerald Dragon",
  "fonte": "FTD",
  "size": "grande",
  "level": 5,
  "cr": "8",
  "xp": 3900,
  "abilities": {
   "str": 21,
   "dex": 12,
   "con": 19,
   "int": 16,
   "wis": 14,
   "cha": 16
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 142,
  "hpDice": "15d10+60",
  "speedFt": 40,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60,
   "burrowFt": 30
  },
  "senses": {
   "passivePerception": 18,
   "blindsightFt": 30,
   "darkvisionFt": 120
  },
  "saves": [
   "dex",
   "con",
   "wis",
   "cha"
  ],
  "skills": [
   "arcanismo",
   "enganacao",
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageResistances": [
   "fogo",
   "psíquico"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 8,
    "damage": "2d10+5",
    "type": "perfurante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "1d6",
     "type": "psíquico"
    }
   },
   {
    "name": "Garra",
    "bonus": 8,
    "damage": "1d6+5",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida",
    "Garra",
    "Garra"
   ]
  },
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "detectarPensamentos",
    "invisibilidade",
    "imagemSilenciosa",
    "maoMagica",
    "ilusaoMenor"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "detectarPensamentos": 1,
    "invisibilidade": 1,
    "imagemSilenciosa": 1
   },
   "aVontade": [
    "maoMagica",
    "ilusaoMenor"
   ],
   "cdPorMagia": {
    "detectarPensamentos": 14,
    "invisibilidade": 14,
    "imagemSilenciosa": 14,
    "maoMagica": 14,
    "ilusaoMenor": 14
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Sopro Desorientador",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 30,
    "save": "int",
    "dc": 15,
    "damage": "9d6",
    "damageType": "psíquico",
    "halfOnSave": true
   }
  ],
  "traits": [
   "escavador"
  ],
  "marcas": [
   "gem"
  ],
  "blurb": "Combina mordida de alcance longo e garras com um sopro psíquico que fere e atrapalha ataques e testes dos alvos. Usa ilusões e invisibilidade para surgir de onde menos se espera, inclusive de túneis na rocha.",
  "lore": "Dragões de esmeralda são dragões de gema, criaturas de mente afiada e poderes psiônicos. Os jovens costumam escavar covis em rocha profunda ou em ruínas esquecidas, protegendo seus segredos com paranoia. Preferem observar à distância, lendo pensamentos e enganando intrusos com imagens falsas antes de decidir se lutam. Quando atacam, buscam confundir o inimigo e desaparecer pelos próprios túneis."
 },
 "dragaoDaPedraDaLuaJovem": {
  "id": "dragaoDaPedraDaLuaJovem",
  "tipo": "dragão",
  "name": "Dragão da Pedra-da-Lua Jovem",
  "nomeOriginal": "Young Moonstone Dragon",
  "fonte": "FTD",
  "size": "grande",
  "level": 5,
  "cr": "8",
  "xp": 3900,
  "abilities": {
   "str": 18,
   "dex": 16,
   "con": 17,
   "int": 18,
   "wis": 17,
   "cha": 19
  },
  "ac": 18,
  "acNote": "armadura natural",
  "maxHp": 144,
  "hpDice": "17d10+51",
  "speedFt": 40,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80
  },
  "senses": {
   "passivePerception": 16,
   "blindsightFt": 30,
   "darkvisionFt": 120
  },
  "saves": [
   "con",
   "int",
   "wis",
   "cha"
  ],
  "skills": [
   "percepcao",
   "persuasao",
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [
   "enfeitiçado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 7,
    "damage": "2d10+4",
    "type": "perfurante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "1d10",
     "type": "radiante"
    }
   },
   {
    "name": "Garra",
    "bonus": 7,
    "damage": "2d6+4",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida",
    "Garra",
    "Garra"
   ]
  },
  "breath": {
   "name": "Arma de Sopro",
   "kind": "save",
   "shape": "cone",
   "areaFt": 90,
   "save": "con",
   "dc": 14,
   "damage": "7d10",
   "damageType": "radiante",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    5,
    6
   ]
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "acalmarEmocoes",
    "fogoDasFadas"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "acalmarEmocoes": 1,
    "fogoDasFadas": 1
   },
   "cdPorMagia": {
    "acalmarEmocoes": 15,
    "fogoDasFadas": 15
   }
  },
  "traits": [],
  "blurb": "Combina mordida radiante e garras com um sopro que alterna entre névoa que faz os inimigos dormirem e um raio de luar devastador. Cuidado com grupos agrupados no cone de sono.",
  "lore": "Dragões da pedra-da-lua são criaturas ligadas aos sonhos e à luz do luar, com laços fortes com o mundo feérico. Costumam habitar ilhas enevoadas, florestas antigas e lugares onde a lua brilha com intensidade. Os jovens são curiosos e brincalhões, preferindo conversar e observar a lutar sem motivo. Quando ameaçados, porém, usam o sono e a luz para desarmar invasores antes de atacar."
 },
 "dragaoDeSafiraJovem": {
  "id": "dragaoDeSafiraJovem",
  "tipo": "dragão",
  "name": "Dragão de Safira Jovem",
  "nomeOriginal": "Young Sapphire Dragon",
  "fonte": "FTD",
  "size": "grande",
  "level": 9,
  "cr": "9",
  "xp": 5000,
  "abilities": {
   "str": 21,
   "dex": 14,
   "con": 20,
   "int": 16,
   "wis": 15,
   "cha": 16
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 157,
  "hpDice": "15d10+75",
  "speedFt": 40,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80,
   "climbFt": 40,
   "burrowFt": 20
  },
  "senses": {
   "passivePerception": 20,
   "blindsightFt": 30,
   "darkvisionFt": 120
  },
  "saves": [
   "dex",
   "con",
   "wis",
   "cha"
  ],
  "skills": [
   "historia",
   "percepcao",
   "persuasao",
   "furtividade"
  ],
  "expertise": [
   "percepcao",
   "persuasao"
  ],
  "damageResistances": [
   "elétrico",
   "trovejante"
  ],
  "conditionImmunities": [
   "amedrontado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 9,
    "damage": "2d10+5",
    "type": "perfurante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "1d8",
     "type": "trovejante"
    }
   },
   {
    "name": "Garra",
    "bonus": 9,
    "damage": "1d6+5",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida",
    "Garra",
    "Garra"
   ]
  },
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "sussurrosDissonantes",
    "imobilizarPessoa",
    "fundirSeComPedra"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "sussurrosDissonantes": 1,
    "imobilizarPessoa": 1,
    "fundirSeComPedra": 1
   },
   "cdPorMagia": {
    "sussurrosDissonantes": 15,
    "imobilizarPessoa": 15,
    "fundirSeComPedra": 15
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Sopro Debilitante",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 30,
    "save": "con",
    "dc": 17,
    "damage": "6d10",
    "damageType": "trovejante",
    "halfOnSave": true,
    "condition": "incapacitado",
    "rounds": 1,
    "repete": false,
    "ateFimDoTurnoDele": true
   }
  ],
  "traits": [
   "spiderClimb",
   "escavador"
  ],
  "marcas": [
   "gem"
  ],
  "blurb": "Escala paredes e escava rocha para emboscar, alternando mordidas trovejantes e garras com um sopro sônico que deixa quem estiver no cone incapacitado. Também usa psiônica para paralisar e assustar alvos.",
  "lore": "Dragões de safira são dragões de gema metódicos e territoriais que fazem seus covis em cavernas profundas no subterrâneo. Os jovens já dominam a telepatia e defendem com ferocidade os túneis que escavam. São curiosos sobre a história e o conhecimento dos povos da superfície e das profundezas. Preferem negociar e manipular a lutar, mas reagem com violência a quem invade seu território."
 },
 "serpenteMarinhaJovem": {
  "id": "serpenteMarinhaJovem",
  "tipo": "dragão",
  "name": "Serpente Marinha Jovem",
  "nomeOriginal": "Young Sea Serpent",
  "fonte": "FTD",
  "size": "enorme",
  "level": 5,
  "cr": "8",
  "xp": 3900,
  "abilities": {
   "str": 19,
   "dex": 12,
   "con": 17,
   "int": 11,
   "wis": 13,
   "cha": 10
  },
  "ac": 16,
  "acNote": "armadura natural",
  "maxHp": 123,
  "hpDice": "13d12+39",
  "speedFt": 10,
  "speeds": {
   "swimFt": 40
  },
  "senses": {
   "passivePerception": 14,
   "darkvisionFt": 120
  },
  "saves": [
   "str",
   "con"
  ],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "damageImmunities": [
   "frio"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 7,
    "damage": "2d10+4",
    "type": "perfurante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "1d10",
     "type": "frio"
    }
   },
   {
    "name": "Constrição",
    "bonus": 7,
    "damage": "4d8+4",
    "type": "concussão",
    "reachFt": 20,
    "onHit": {
     "semResistencia": true,
     "dc": 15,
     "escape": 15,
     "condition": "contido",
     "note": "é agarrado"
    }
   },
   {
    "name": "Cauda",
    "bonus": 7,
    "damage": "1d10+4",
    "type": "concussão",
    "reachFt": 15,
    "onHit": {
     "save": "str",
     "dc": 15,
     "condition": "caido",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequencias": [
    [
     "Mordida",
     "Constrição"
    ],
    [
     "Mordida",
     "Cauda"
    ]
   ]
  },
  "breath": {
   "name": "Sopro Gélido",
   "kind": "save",
   "shape": "cone",
   "areaFt": 30,
   "save": "con",
   "dc": 14,
   "damage": "7d10",
   "damageType": "frio",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    5,
    6
   ]
  },
  "traits": [
   "monstroDeCerco"
  ],
  "blurb": "Ataca de longe com mordidas gélidas, constrição que prende a vítima e golpes de cauda que derrubam e empurram. Seu sopro de gelo em cone causa dano pesado em grupos.",
  "lore": "Serpentes marinhas são dragões sem asas que vivem nos oceanos, caçando navios e criaturas grandes. As jovens já são grandes o bastante para ameaçar embarcações e despedaçar cascos. Costumam patrulhar rotas marítimas e águas frias, onde o seu hálito congelante é mais eficaz. Falam Comum e Dracônico, e podem negociar quando não estão famintas."
 },
 "dragaoDeTopazioJovem": {
  "id": "dragaoDeTopazioJovem",
  "tipo": "dragão",
  "name": "Dragão de Topázio Jovem",
  "nomeOriginal": "Young Topaz Dragon",
  "fonte": "FTD",
  "size": "grande",
  "level": 5,
  "cr": "7",
  "xp": 2900,
  "abilities": {
   "str": 17,
   "dex": 12,
   "con": 15,
   "int": 16,
   "wis": 15,
   "cha": 16
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 127,
  "hpDice": "17d10+34",
  "speedFt": 40,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80,
   "swimFt": 40
  },
  "senses": {
   "passivePerception": 18,
   "blindsightFt": 30,
   "darkvisionFt": 120
  },
  "saves": [
   "dex",
   "con",
   "wis",
   "cha"
  ],
  "skills": [
   "intimidacao",
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "intimidacao",
   "percepcao"
  ],
  "damageResistances": [
   "frio",
   "necrótico"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 6,
    "damage": "2d10+3",
    "type": "perfurante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "1d6",
     "type": "necrótico"
    }
   },
   {
    "name": "Garra",
    "bonus": 6,
    "damage": "1d6+3",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida",
    "Garra",
    "Garra"
   ]
  },
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "perdicao",
    "criarDestruirAgua"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "perdicao": 1,
    "criarDestruirAgua": 1
   },
   "cdPorMagia": {
    "perdicao": 14,
    "criarDestruirAgua": 14
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Sopro Ressecante",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 30,
    "save": "con",
    "dc": 13,
    "damage": "8d6",
    "damageType": "necrótico",
    "halfOnSave": true
   }
  ],
  "traits": [],
  "marcas": [
   "gem"
  ],
  "blurb": "Ataca com mordida e garras que somam energia necrótica, e seu sopro ressecante causa dano necrótico em cone e deixa os alvos enfraquecidos, cortando pela metade o dano de suas armas de Força.",
  "lore": "Os dragões de topázio são dragões de gema ligados à energia psiônica, reservados e de temperamento imprevisível. Preferem regiões costeiras e águas profundas, onde caçam e guardam seus tesouros longe de olhares curiosos. Os jovens já falam por telepatia e usam poderes mentais para enfraquecer quem os incomoda. Costumam evitar companhia e reagem com hostilidade a intrusos em seu território."
 }
};

export const TRACOS_FTD = {
 "t_mudarDeForma": {
  "name": "Mudar de Forma",
  "desc": "Com a ação bônus, toma a forma de outra criatura e guarda os números dela. No jogo, só o nome."
 },
 "t_alterarPercepcao": {
  "name": "Alterar Percepção",
  "desc": "1 vez por dia, conjura terreno alucinatório sem componentes, usando Inteligência (CD 17)."
 },
 "t_fabricar": {
  "name": "Fabricar",
  "desc": "Uma vez por dia, conjura fabricar sem componentes, usando Inteligência."
 },
 "t_naturezaIncomum": {
  "name": "Natureza Incomum",
  "desc": "Não precisa de comida nem bebida."
 },
 "t_distorcerPercepcao1Dia": {
  "name": "Distorcer Percepção (1/Dia)",
  "desc": "Conjura miragem arcana sem componentes, usando Inteligência."
 },
 "t_formaCromatica": {
  "name": "Forma Cromática",
  "desc": "Ao surgir, assume a forma do sopro do criador: ácido, frio, fogo, elétrico ou veneno. A forma define CA, resistência a dano, traços e o tipo de dano dos ataques."
 },
 "t_multiplasCabecas": {
  "name": "Múltiplas Cabeças",
  "desc": "Tem cinco cabeças; com mais de uma, tem vantagem em resistências contra ficar cego, enfeitiçado, surdo, amedrontado, atordoado ou inconsciente. Se sofrer 30 ou mais de dano num só turno, perde uma cabeça, e morre se perder todas. No fim do seu turno, cada cabeça perdida é substituída por duas (recuperando 10 PV por cabeça nova), salvo se tiver sofrido dano radiante desde o turno anterior."
 },
 "t_cabecasReativas": {
  "name": "Cabeças Reativas",
  "desc": "Ganha uma reação extra, só para ataques de oportunidade, para cada cabeça além da primeira."
 },
 "t_rouboDeForma": {
  "name": "Roubo de Forma",
  "desc": "Ao matar um humanoide Médio ou menor, assume magicamente a aparência e o toque dele, mantendo suas estatísticas exceto o tamanho. Dura até morrer ou gastar uma ação para encerrar."
 },
 "t_quedaControlada": {
  "name": "Queda Controlada",
  "desc": "Se não estiver incapacitado ao cair, reduz em até 30 m a altura da queda para calcular o dano."
 },
 "t_planar": {
  "name": "Planar",
  "desc": "Se não estiver incapacitado, reduz até 30 m da altura considerada para dano de queda e pode se deslocar 2 m na horizontal para cada 1 m que desce."
 },
 "t_habitarObjeto": {
  "name": "Habitar Objeto",
  "desc": "Possui um objeto não senciente Médio ou menor a até 9 m, que passa a usar sua CA e PV e pode voar, falar e conjurar por ele. Sai com uma ação, ao ser expulso, ao chegar a 0 PV ou por efeitos que encerram possessão; quem porta o objeto pode receber +1d8 de dano energético nos ataques e resistência a dano psíquico."
 },
 "t_deflexao": {
  "name": "Deflexão",
  "desc": "O modificador de Inteligência do fragmento é somado à sua CA."
 },
 "t_rejuvenescimento": {
  "name": "Rejuvenescimento",
  "desc": "Ao chegar a 0 PV, vira uma gema rachada Miúda (CA 20, 15 PV, imune a todo dano exceto energético). Se a gema não for destruída, ele se reconstitui com todos os PV após 1d20 dias."
 },
 "t_dilacerar": {
  "name": "Dilacerar",
  "desc": "Ataque corpo a corpo com o modificador de ataque mágico do conjurador, alcance 3 m, um alvo. Causa 1d6 + 4 + nível da magia de dano perfurante."
 },
 "t_armaDeSopro": {
  "name": "Arma de Sopro",
  "desc": "Cone de 9 m: cada criatura faz teste de resistência de Destreza contra a CD de magia do conjurador. Falha sofre 2d6 de dano de um tipo ao qual o dragão resiste (à escolha), sucesso sofre metade."
 },
 "t_resistenciasCompartilhadas": {
  "name": "Resistências Compartilhadas",
  "desc": "Ao ser invocado, escolha uma das resistências a dano do dragão; o conjurador também tem essa resistência até a magia acabar."
 },
 "t_revideMordaz": {
  "name": "Revide Mordaz",
  "desc": "Quando sofre dano de uma criatura a até 1,5 m, pode atacá-la imediatamente com a Espada Curta, com vantagem."
 },
 "t_palavrasDesarmantes": {
  "name": "Palavras Desarmantes",
  "desc": "3/dia. Quando uma criatura visível a até 18 m rola dano, o orador rola 1d6 e subtrai o resultado desse dano."
 },
 "t_defesaMental": {
  "name": "Defesa Mental",
  "desc": "Sem armadura, soma seu modificador de Inteligência à CA."
 },
 "t_mordida": {
  "name": "Mordida",
  "desc": "Ataque corpo a corpo com +3 + BP para acertar, alcance 1,5 m, um alvo. Causa 1d6 + BP de dano perfurante."
 },
 "t_essenciaDraconica": {
  "name": "Essência Dracônica",
  "desc": "Ao ser invocado, escolha ácido, frio, fogo, elétrico ou veneno. O draco fica imune a esse tipo de dano, e ele também define o dano extra dos Golpes Imbuídos."
 },
 "t_golpesImbuidos": {
  "name": "Golpes Imbuídos",
  "desc": "Quando outra criatura que o draco veja, a até 9 m dele, acerta um ataque com arma, o alvo sofre 1d6 de dano extra do tipo escolhido na Essência Dracônica."
 },
 "t_adaptacaoRapida": {
  "name": "Adaptação Rápida",
  "desc": "Ao sofrer dano, ganha resistência a esse tipo de dano."
 },
 "t_eloProtetor": {
  "name": "Elo Protetor",
  "desc": "Quando outra criatura visível a até 9 m vai sofrer dano, o espreitador reduz esse dano em 10 (3d6) e sofre ele mesmo a quantia reduzida."
 },
 "t_reconstrucao": {
  "name": "Reconstrução",
  "desc": "Ao chegar a 0 PV, se parte em nove pedaços (objetos Grandes, CA 19, 27 PV, imunes a psíquico e veneno). Após 1d6 dias, se todos estiverem a até 9,6 km uns dos outros, reúnem-se na cabeça e o dragão volta com todos os PV."
 },
 "t_eloTelepatico": {
  "name": "Elo Telepático",
  "desc": "No mesmo plano que seu mestre, pode transmitir a ele o que percebe, e os dois conversam telepaticamente."
 }
};
