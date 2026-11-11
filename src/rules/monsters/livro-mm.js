// GERADO por `src/dev/importar-bestiario.mjs mm` — não edite à mão; mude o conversor ou o texto em
  // `src/dev/bestiario/mm-pt.json` e rode de novo. Os números são os do livro (MM, via o espelho do 5etools);
  // o texto é nosso, em pt-br. O que o motor ainda não faz está em `src/dev/bestiario/mm-pendente.json`.
  
export const LIVRO_MM = {
 "aarakocra": {
  "id": "aarakocra",
  "tipo": "humanoide",
  "name": "Aarakocra",
  "nomeOriginal": "Aarakocra",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 10,
   "dex": 14,
   "con": 10,
   "int": 11,
   "wis": 12,
   "cha": 11
  },
  "ac": 12,
  "maxHp": 13,
  "hpDice": "3d8",
  "speedFt": 20,
  "flyFt": 50,
  "speeds": {
   "flyFt": 50
  },
  "senses": {
   "passivePerception": 15
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
    "name": "Garra",
    "bonus": 4,
    "damage": "1d4+2",
    "type": "cortante",
    "reachFt": 5,
    "investida": {
     "pes": 30,
     "dano": "1d6",
     "tipo": "cortante",
     "soVoando": true
    }
   },
   {
    "name": "Azagaia",
    "bonus": 4,
    "damage": "1d6+2",
    "type": "perfurante",
    "reachFt": 5,
    "rangeFt": 30,
    "longRangeFt": 120,
    "investida": {
     "pes": 30,
     "dano": "1d6",
     "tipo": "perfurante",
     "soVoando": true
    }
   }
  ],
  "traits": [
   "t_invocarElementalDoAr"
  ],
  "blurb": "Guerreiro alado que fica no ar, despenca sobre o alvo para golpes mais fortes e arremessa azagaias de longe. Cinco deles juntos conseguem invocar um elemental do ar.",
  "lore": "Os aarakocra são humanoides com feições de ave, nativos do Plano Elemental do Ar, onde patrulham a tempestade que cerca o reino de Aaqa contra intrusos da terra, sobretudo gárgulas. Servem aos Duques do Vento, vasculhando os planos atrás de templos do Mal Elemental e de fragmentos do lendário Cetro das Sete Partes. No Plano Material, fazem ninhos nos picos mais altos, perto de portais para o Plano do Ar, e vigiam a região por anos se preciso. Não ligam para fronteiras, posses ou riquezas: usam o que precisam e deixam o resto para os outros."
 },
 "aboleth": {
  "id": "aboleth",
  "tipo": "aberração",
  "name": "Aboleth",
  "nomeOriginal": "Aboleth",
  "fonte": "MM",
  "size": "grande",
  "level": 9,
  "cr": "10",
  "xp": 5900,
  "abilities": {
   "str": 21,
   "dex": 9,
   "con": 15,
   "int": 18,
   "wis": 15,
   "cha": 18
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 135,
  "hpDice": "18d10+36",
  "speedFt": 10,
  "speeds": {
   "swimFt": 40
  },
  "senses": {
   "passivePerception": 20,
   "darkvisionFt": 120
  },
  "saves": [
   "con",
   "int",
   "wis"
  ],
  "skills": [
   "historia",
   "percepcao"
  ],
  "expertise": [
   "historia",
   "percepcao"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Tentáculo",
    "bonus": 9,
    "damage": "2d6+5",
    "type": "concussão",
    "reachFt": 10,
    "onHit": {
     "save": "con",
     "dc": 14,
     "danoSeFalhar": {
      "damage": "1d12",
      "type": "ácido"
     },
     "metadeSePassar": false
    }
   },
   {
    "name": "Cauda",
    "bonus": 9,
    "damage": "3d6+5",
    "type": "concussão",
    "reachFt": 10
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Tentáculo",
    "Tentáculo",
    "Tentáculo"
   ]
  },
  "acoesEspeciais": [
   {
    "nome": "Escravizar",
    "porDia": 3,
    "tipo": "alvo",
    "alcanceFt": 30,
    "save": "wis",
    "dc": 14,
    "condition": "enfeiticado",
    "rounds": 10,
    "repete": true
   }
  ],
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Golpe de Cauda",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Cauda"
    },
    {
     "nome": "Dreno Psíquico",
     "custo": 2,
     "tipo": "alvo",
     "alcanceFt": 120,
     "soComCondicao": "enfeiticado",
     "semTeste": true,
     "damage": "3d6",
     "damageType": "psíquico",
     "drena": true
    }
   ]
  },
  "traits": [
   "t_nuvemDeMuco",
   "t_telepatiaInvasiva",
   "acoesLendarias"
  ],
  "blurb": "Fica na água, chicoteando com tentáculos de 3 m de alcance que transmitem uma doença terrível, enquanto escraviza a mente dos inimigos e drena a energia psíquica deles. Cuidado ao atacá-lo de perto debaixo d'água: o muco que o envolve também contamina.",
  "lore": "Os aboleths são aberrações primordiais que reinavam sobre os primeiros seres vivos antes de os deuses surgirem e destruírem seu império. Sua memória é perfeita e herdada entre gerações, por isso nunca esquecem essa derrota e tramam por eras para recuperar o mundo. Habitam lagos subterrâneos, abismos oceânicos e o Plano Elemental da Água, muitas vezes entre ruínas de cidades antigas da sua raça. Leem os desejos das criaturas e prometem realizá-los em troca de adoração. Mesmo quando seu corpo é destruído, o espírito retorna ao Plano da Água e forma um corpo novo."
 },
 "yetiAbominavel": {
  "id": "yetiAbominavel",
  "tipo": "monstruosidade",
  "name": "Yeti Abominável",
  "nomeOriginal": "Abominable Yeti",
  "fonte": "MM",
  "size": "enorme",
  "level": 9,
  "cr": "9",
  "xp": 5000,
  "abilities": {
   "str": 24,
   "dex": 10,
   "con": 22,
   "int": 9,
   "wis": 13,
   "cha": 9
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 137,
  "hpDice": "11d12+66",
  "speedFt": 40,
  "speeds": {
   "climbFt": 40
  },
  "senses": {
   "passivePerception": 15,
   "darkvisionFt": 60
  },
  "saves": [],
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
    "name": "Garra",
    "bonus": 11,
    "damage": "2d6+7",
    "type": "cortante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "2d6",
     "type": "frio"
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Garra",
    "Garra"
   ]
  },
  "breath": {
   "name": "Sopro Gélido",
   "kind": "save",
   "shape": "cone",
   "areaFt": 30,
   "save": "con",
   "dc": 18,
   "damage": "10d8",
   "damageType": "frio",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    6
   ]
  },
  "acoesEspeciais": [
   {
    "nome": "Olhar Gélido",
    "tipo": "alvo",
    "alcanceFt": 30,
    "save": "con",
    "dc": 18,
    "damage": "6d6",
    "damageType": "frio",
    "halfOnSave": false,
    "condition": "paralisado",
    "rounds": 10,
    "repete": true,
    "imunizaAoPassar": true
   }
  ],
  "traits": [
   "t_medoDeFogo",
   "keenSmell",
   "t_camuflagemNaNeve"
  ],
  "blurb": "Gigante das neves que paralisa com o olhar gélido e dilacera com garras congelantes; seu sopro de frio arrasa grupos inteiros. O fogo o abala e atrapalha seus ataques.",
  "lore": "O yeti abominável é uma versão colossal e mais cruel do yeti comum, nascida nas regiões mais remotas das montanhas geladas. Vive solitário em cavernas e picos nevados, caçando tudo o que se aventura em seu território. Move-se em silêncio pela neve, onde quase desaparece, e ataca de surpresa. Apesar de sua força brutal, teme as chamas e recua diante delas."
 },
 "dragaoNegroAdulto": {
  "id": "dragaoNegroAdulto",
  "tipo": "dragão",
  "name": "Dragão Negro Adulto",
  "nomeOriginal": "Adult Black Dragon",
  "fonte": "MM",
  "size": "enorme",
  "level": 13,
  "cr": "14",
  "xp": 11500,
  "abilities": {
   "str": 23,
   "dex": 14,
   "con": 21,
   "int": 14,
   "wis": 13,
   "cha": 17
  },
  "ac": 19,
  "acNote": "armadura natural",
  "maxHp": 195,
  "hpDice": "17d12+85",
  "speedFt": 40,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80,
   "swimFt": 40
  },
  "senses": {
   "passivePerception": 21,
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
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "ácido"
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
     "damage": "1d8",
     "type": "ácido"
    }
   },
   {
    "name": "Garra",
    "bonus": 11,
    "damage": "2d6+6",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Cauda",
    "bonus": 11,
    "damage": "2d8+6",
    "type": "concussão",
    "reachFt": 15
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
   "name": "Sopro Ácido (Recarga 5–6)",
   "kind": "save",
   "shape": "linha",
   "areaFt": 60,
   "save": "dex",
   "dc": 18,
   "damage": "12d8",
   "damageType": "ácido",
   "halfOnSave": true,
   "origem": "sopro",
   "larguraFt": 5,
   "recharge": [
    5,
    6
   ]
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "presencaAterradora": {
   "dc": 16,
   "alcanceFt": 120
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Ataque de Cauda",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Cauda"
    },
    {
     "nome": "Ataque de Asas (Custa 2 Ações)",
     "custo": 2,
     "tipo": "area",
     "raioFt": 10,
     "save": "dex",
     "dc": 19,
     "damage": "2d6+6",
     "damageType": "concussão",
     "halfOnSave": false,
     "condition": "caido",
     "rounds": 10,
     "repete": false
    }
   ]
  },
  "traits": [
   "presencaAterradora",
   "acoesLendarias"
  ],
  "blurb": "Abre o combate com sua Presença Aterradora e despeja uma linha de ácido capaz de dissolver grupos inteiros. Depois alterna mordidas, garras e cauda, fugindo pelo ar ou mergulhando na água quando lhe convém.",
  "lore": "Os dragões negros são os mais cruéis e rancorosos entre os dragões cromáticos, e fazem seus covis em pântanos sombrios e ruínas alagadas. Adoram ver presas mais fracas sofrerem e preferem emboscadas, atacando de dentro da água turva. Acumulam tesouros de reinos caídos e desprezam qualquer criatura que ouse invadir seu território. Um adulto já domina a região ao redor do covil, que apodrece e se enche de lodo sob sua influência."
 },
 "dracolichAzulAdulto": {
  "id": "dracolichAzulAdulto",
  "tipo": "morto-vivo",
  "name": "Dracolich Azul Adulto",
  "nomeOriginal": "Adult Blue Dracolich",
  "fonte": "MM",
  "size": "enorme",
  "level": 17,
  "cr": "17",
  "xp": 18000,
  "abilities": {
   "str": 25,
   "dex": 10,
   "con": 23,
   "int": 16,
   "wis": 15,
   "cha": 19
  },
  "ac": 19,
  "acNote": "armadura natural",
  "maxHp": 225,
  "hpDice": "18d12+108",
  "speedFt": 40,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80,
   "burrowFt": 30
  },
  "senses": {
   "passivePerception": 24,
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
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageResistances": [
   "necrótico"
  ],
  "damageImmunities": [
   "elétrico",
   "veneno"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "exausto",
   "amedrontado",
   "paralisado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 13,
    "damage": "2d10+7",
    "type": "perfurante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "1d10",
     "type": "elétrico"
    }
   },
   {
    "name": "Garra",
    "bonus": 13,
    "damage": "2d6+7",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Cauda",
    "bonus": 13,
    "damage": "2d8+7",
    "type": "concussão",
    "reachFt": 15
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
   "name": "Sopro Elétrico",
   "kind": "save",
   "shape": "linha",
   "areaFt": 90,
   "save": "dex",
   "dc": 20,
   "damage": "12d10",
   "damageType": "elétrico",
   "halfOnSave": true,
   "origem": "sopro",
   "larguraFt": 5,
   "recharge": [
    5,
    6
   ]
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "presencaAterradora": {
   "dc": 18,
   "alcanceFt": 120
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Ataque de Cauda",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Cauda"
    },
    {
     "nome": "Ataque de Asas",
     "custo": 2,
     "tipo": "area",
     "raioFt": 10,
     "save": "dex",
     "dc": 21,
     "damage": "2d6+7",
     "damageType": "concussão",
     "halfOnSave": false,
     "condition": "caido",
     "rounds": 10,
     "repete": false
    }
   ]
  },
  "traits": [
   "presencaAterradora",
   "resistenciaAMagia",
   "acoesLendarias"
  ],
  "blurb": "Esqueleto dracônico que abre o combate com sua presença aterradora e um sopro elétrico em linha de 27 m, depois rasga com mordida e garras. Resiste a magia e ignora o primeiro fracasso em testes graças à Resistência Lendária.",
  "lore": "Um dragão azul adulto que, por vaidade e medo da morte, aceitou um ritual necromântico para continuar existindo como morto-vivo. Seu espírito fica preso numa gema que funciona como filactério, e enquanto ela estiver no mesmo plano o corpo destruído pode renascer em outro cadáver de dragão. Tirano calculista, age nas sombras, mantém sua existência em segredo e cerca-se de servos movidos por ganância. Costuma reinar sobre desertos, onde se esconde sob a areia."
 },
 "dragaoAzulAdulto": {
  "id": "dragaoAzulAdulto",
  "tipo": "dragão",
  "name": "Dragão Azul Adulto",
  "nomeOriginal": "Adult Blue Dragon",
  "fonte": "MM",
  "size": "enorme",
  "level": 13,
  "cr": "16",
  "xp": 15000,
  "abilities": {
   "str": 25,
   "dex": 10,
   "con": 23,
   "int": 16,
   "wis": 15,
   "cha": 19
  },
  "ac": 19,
  "acNote": "armadura natural",
  "maxHp": 225,
  "hpDice": "18d12+108",
  "speedFt": 40,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80,
   "burrowFt": 30
  },
  "senses": {
   "passivePerception": 22,
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
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "elétrico"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 12,
    "damage": "2d10+7",
    "type": "perfurante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "1d10",
     "type": "elétrico"
    }
   },
   {
    "name": "Garra",
    "bonus": 12,
    "damage": "2d6+7",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Cauda",
    "bonus": 12,
    "damage": "2d8+7",
    "type": "concussão",
    "reachFt": 15
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
   "name": "Sopro de Relâmpago",
   "kind": "save",
   "shape": "linha",
   "areaFt": 90,
   "save": "dex",
   "dc": 19,
   "damage": "12d10",
   "damageType": "elétrico",
   "halfOnSave": true,
   "origem": "sopro",
   "larguraFt": 5,
   "recharge": [
    5,
    6
   ]
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "presencaAterradora": {
   "dc": 17,
   "alcanceFt": 120
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Ataque de Cauda",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Cauda"
    },
    {
     "nome": "Ataque de Asas",
     "custo": 2,
     "tipo": "area",
     "raioFt": 10,
     "save": "dex",
     "dc": 20,
     "damage": "2d6+7",
     "damageType": "concussão",
     "halfOnSave": false,
     "condition": "caido",
     "rounds": 10,
     "repete": false
    }
   ]
  },
  "traits": [
   "presencaAterradora",
   "acoesLendarias"
  ],
  "blurb": "Ataca do alto ou emerge da areia, espalhando medo antes de rasgar com mordida e garras. Seu sopro de relâmpago numa linha de 27 m pode fulminar um grupo inteiro alinhado.",
  "lore": "Dragões azuis são cromáticos vaidosos e territoriais que dominam desertos e litorais áridos. Escavam covis sob as dunas e adoram emboscar presas, surgindo de baixo da areia. Orgulhosos e calculistas, exigem tributo de caravanas e cidades próximas e acumulam gemas, sobretudo safiras. Desprezam criaturas que consideram inferiores e raramente perdoam ofensas."
 },
 "dragaoDeLataoAdulto": {
  "id": "dragaoDeLataoAdulto",
  "tipo": "dragão",
  "name": "Dragão de Latão Adulto",
  "nomeOriginal": "Adult Brass Dragon",
  "fonte": "MM",
  "size": "enorme",
  "level": 13,
  "cr": "13",
  "xp": 10000,
  "abilities": {
   "str": 23,
   "dex": 10,
   "con": 21,
   "int": 14,
   "wis": 13,
   "cha": 17
  },
  "ac": 18,
  "acNote": "armadura natural",
  "maxHp": 172,
  "hpDice": "15d12+75",
  "speedFt": 40,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80,
   "burrowFt": 40
  },
  "senses": {
   "passivePerception": 21,
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
   "percepcao"
  ],
  "damageImmunities": [
   "fogo"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 11,
    "damage": "2d10+6",
    "type": "perfurante",
    "reachFt": 10
   },
   {
    "name": "Garra",
    "bonus": 11,
    "damage": "2d6+6",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Cauda",
    "bonus": 11,
    "damage": "2d8+6",
    "type": "concussão",
    "reachFt": 15
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
   "name": "Sopro de Fogo",
   "kind": "save",
   "shape": "linha",
   "areaFt": 60,
   "save": "dex",
   "dc": 18,
   "damage": "13d6",
   "damageType": "fogo",
   "halfOnSave": true,
   "larguraFt": 5,
   "origem": "sopro",
   "chaveRecarga": "Armas de Sopro",
   "recharge": [
    5,
    6
   ]
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "presencaAterradora": {
   "dc": 16,
   "alcanceFt": 120
  },
  "sopros": [
   {
    "name": "Sopro de Fogo",
    "kind": "save",
    "shape": "linha",
    "areaFt": 60,
    "save": "dex",
    "dc": 18,
    "damage": "13d6",
    "damageType": "fogo",
    "halfOnSave": true,
    "larguraFt": 5,
    "origem": "sopro",
    "chaveRecarga": "Armas de Sopro",
    "recharge": [
     5,
     6
    ]
   },
   {
    "name": "Sopro do Sono",
    "kind": "save",
    "shape": "cone",
    "areaFt": 60,
    "save": "con",
    "dc": 18,
    "condition": "inconsciente",
    "rounds": 100,
    "origem": "sopro",
    "chaveRecarga": "Armas de Sopro",
    "recharge": [
     5,
     6
    ]
   }
  ],
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Ataque de Cauda",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Cauda"
    },
    {
     "nome": "Ataque de Asas",
     "custo": 2,
     "tipo": "area",
     "raioFt": 10,
     "save": "dex",
     "dc": 19,
     "damage": "2d6+6",
     "damageType": "concussão",
     "halfOnSave": false,
     "condition": "caido",
     "rounds": 10,
     "repete": false
    }
   ]
  },
  "traits": [
   "presencaAterradora",
   "acoesLendarias"
  ],
  "blurb": "Escava e voa com agilidade, e pode escolher entre uma linha de fogo e um cone de gás que derruba grupos inteiros no sono. Em combate corpo a corpo, combina mordida, garras e cauda, e assusta com sua presença.",
  "lore": "Dragões de latão são os mais falantes entre os dragões metálicos e adoram uma boa conversa com viajantes. Vivem em desertos quentes e secos, onde cavam covis sob a areia ou entre rochas. São bondosos, mas vaidosos, e às vezes prendem visitantes só para não ficarem sem companhia. Preferem resolver conflitos com palavras ou com seu sopro de sono antes de recorrer ao fogo."
 },
 "dragaoDeBronzeAdulto": {
  "id": "dragaoDeBronzeAdulto",
  "tipo": "dragão",
  "name": "Dragão de Bronze Adulto",
  "nomeOriginal": "Adult Bronze Dragon",
  "fonte": "MM",
  "size": "enorme",
  "level": 13,
  "cr": "15",
  "xp": 13000,
  "abilities": {
   "str": 25,
   "dex": 10,
   "con": 23,
   "int": 16,
   "wis": 15,
   "cha": 19
  },
  "ac": 19,
  "acNote": "armadura natural",
  "maxHp": 212,
  "hpDice": "17d12+102",
  "speedFt": 40,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80,
   "swimFt": 40
  },
  "senses": {
   "passivePerception": 22,
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
   "intuicao",
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "elétrico"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 12,
    "damage": "2d10+7",
    "type": "perfurante",
    "reachFt": 10
   },
   {
    "name": "Garra",
    "bonus": 12,
    "damage": "2d6+7",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Cauda",
    "bonus": 12,
    "damage": "2d8+7",
    "type": "concussão",
    "reachFt": 15
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
   "name": "Sopro Elétrico",
   "kind": "save",
   "shape": "linha",
   "areaFt": 90,
   "save": "dex",
   "dc": 19,
   "damage": "12d10",
   "damageType": "elétrico",
   "halfOnSave": true,
   "larguraFt": 5,
   "origem": "sopro",
   "chaveRecarga": "Armas de Sopro",
   "recharge": [
    5,
    6
   ]
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "presencaAterradora": {
   "dc": 17,
   "alcanceFt": 120
  },
  "sopros": [
   {
    "name": "Sopro Elétrico",
    "kind": "save",
    "shape": "linha",
    "areaFt": 90,
    "save": "dex",
    "dc": 19,
    "damage": "12d10",
    "damageType": "elétrico",
    "halfOnSave": true,
    "larguraFt": 5,
    "origem": "sopro",
    "chaveRecarga": "Armas de Sopro",
    "recharge": [
     5,
     6
    ]
   },
   {
    "name": "Sopro Repulsor",
    "kind": "save",
    "shape": "cone",
    "areaFt": 30,
    "save": "str",
    "dc": 19,
    "empurraFt": 60,
    "origem": "sopro",
    "chaveRecarga": "Armas de Sopro",
    "recharge": [
     5,
     6
    ]
   }
  ],
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Ataque de Cauda",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Cauda"
    },
    {
     "nome": "Ataque de Asas",
     "custo": 2,
     "tipo": "area",
     "raioFt": 10,
     "save": "dex",
     "dc": 20,
     "damage": "2d6+7",
     "damageType": "concussão",
     "halfOnSave": false,
     "condition": "caido",
     "rounds": 10,
     "repete": false
    }
   ]
  },
  "traits": [
   "presencaAterradora",
   "t_mudarDeForma",
   "acoesLendarias"
  ],
  "blurb": "Combina mordida, garras e cauda com alcance longo e alterna entre um sopro de relâmpago em linha e um sopro que empurra os inimigos para longe. Sua presença aterradora pode deixar o grupo inteiro amedrontado logo no início da luta.",
  "lore": "Dragões de bronze são criaturas metálicas de índole ordeira e benevolente que habitam litorais, ilhas e grutas marinhas. Respiram tanto no ar quanto debaixo d'água e gostam de observar navios e embarcações que passam por seus domínios. Costumam assumir formas humanoides ou animais para conviver discretamente com povos costeiros. Odeiam a tirania e muitas vezes oferecem ajuda em guerras justas, cobrando pouco além de respeito."
 },
 "dragaoDeCobreAdulto": {
  "id": "dragaoDeCobreAdulto",
  "tipo": "dragão",
  "name": "Dragão de Cobre Adulto",
  "nomeOriginal": "Adult Copper Dragon",
  "fonte": "MM",
  "size": "enorme",
  "level": 13,
  "cr": "14",
  "xp": 11500,
  "abilities": {
   "str": 23,
   "dex": 12,
   "con": 21,
   "int": 18,
   "wis": 15,
   "cha": 17
  },
  "ac": 18,
  "acNote": "armadura natural",
  "maxHp": 184,
  "hpDice": "16d12+80",
  "speedFt": 40,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80,
   "climbFt": 40
  },
  "senses": {
   "passivePerception": 22,
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
   "enganacao",
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "ácido"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 11,
    "damage": "2d10+6",
    "type": "perfurante",
    "reachFt": 10
   },
   {
    "name": "Garra",
    "bonus": 11,
    "damage": "2d6+6",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Cauda",
    "bonus": 11,
    "damage": "2d8+6",
    "type": "concussão",
    "reachFt": 15
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
   "name": "Armas de Sopro",
   "kind": "save",
   "shape": "linha",
   "areaFt": 60,
   "save": "dex",
   "dc": 18,
   "damage": "12d8",
   "damageType": "ácido",
   "halfOnSave": true,
   "origem": "sopro",
   "larguraFt": 5,
   "recharge": [
    5,
    6
   ]
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "presencaAterradora": {
   "dc": 16,
   "alcanceFt": 120
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Ataque de Cauda",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Cauda"
    },
    {
     "nome": "Ataque de Asas",
     "custo": 2,
     "tipo": "area",
     "raioFt": 10,
     "save": "dex",
     "dc": 19,
     "damage": "2d6+6",
     "damageType": "concussão",
     "halfOnSave": false,
     "condition": "caido",
     "rounds": 10,
     "repete": false
    }
   ]
  },
  "traits": [
   "presencaAterradora",
   "acoesLendarias"
  ],
  "blurb": "Escalador e voador ágil, mistura mordidas e garras com um sopro de ácido em linha ou um gás que deixa os alvos lentos e sem reações. Sua Presença Aterradora pode deixar o grupo inteiro amedrontado logo no início da luta.",
  "lore": "Os dragões de cobre são brincalhões incorrigíveis que adoram piadas, charadas e enigmas. Fazem seus covis em colinas e cânions rochosos, onde sobem paredes de pedra com facilidade. Costumam testar os visitantes com truques e conversas espirituosas antes de decidir se são amigos. Ficam irritados com quem não aprecia seu humor, mas raramente matam por crueldade."
 },
 "dragaoDouradoAdulto": {
  "id": "dragaoDouradoAdulto",
  "tipo": "dragão",
  "name": "Dragão Dourado Adulto",
  "nomeOriginal": "Adult Gold Dragon",
  "fonte": "MM",
  "size": "enorme",
  "level": 17,
  "cr": "17",
  "xp": 18000,
  "abilities": {
   "str": 27,
   "dex": 14,
   "con": 25,
   "int": 16,
   "wis": 15,
   "cha": 24
  },
  "ac": 19,
  "acNote": "armadura natural",
  "maxHp": 256,
  "hpDice": "19d12+133",
  "speedFt": 40,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80,
   "swimFt": 40
  },
  "senses": {
   "passivePerception": 24,
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
   "intuicao",
   "percepcao",
   "persuasao",
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "fogo"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 14,
    "damage": "2d10+8",
    "type": "perfurante",
    "reachFt": 10
   },
   {
    "name": "Garra",
    "bonus": 14,
    "damage": "2d6+8",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Cauda",
    "bonus": 14,
    "damage": "2d8+8",
    "type": "concussão",
    "reachFt": 15
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
   "name": "Armas de Sopro (Recarga 5–6)",
   "kind": "save",
   "shape": "cone",
   "areaFt": 60,
   "save": "dex",
   "dc": 21,
   "damage": "12d10",
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
  "presencaAterradora": {
   "dc": 21,
   "alcanceFt": 120
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Ataque de Cauda",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Cauda"
    },
    {
     "nome": "Ataque de Asas (Custa 2 Ações)",
     "custo": 2,
     "tipo": "area",
     "raioFt": 10,
     "save": "dex",
     "dc": 22,
     "damage": "2d6+8",
     "damageType": "concussão",
     "halfOnSave": false,
     "condition": "caido",
     "rounds": 10,
     "repete": false
    }
   ]
  },
  "traits": [
   "presencaAterradora",
   "t_mudarDeForma",
   "acoesLendarias"
  ],
  "blurb": "Gigante voador que abre o combate aterrorizando o grupo e alterna mordidas e garras com sopros de fogo devastadores ou um gás que drena a força dos inimigos. Resiste a falhas em testes três vezes por dia e reage fora do turno com ações lendárias.",
  "lore": "Os dragões dourados são os mais nobres entre os dragões metálicos, defensores da justiça e inimigos declarados da crueldade. Costumam habitar campos e florestas remotas, muitas vezes em covis escondidos perto de lagos ou cachoeiras. Frequentemente circulam entre os povos disfarçados de humanoides ou animais, observando e ajudando em segredo. São pacientes e sábios, preferindo conversar antes de lutar, mas enfrentam o mal com fúria implacável."
 },
 "dragaoVerdeAdulto": {
  "id": "dragaoVerdeAdulto",
  "tipo": "dragão",
  "name": "Dragão Verde Adulto",
  "nomeOriginal": "Adult Green Dragon",
  "fonte": "MM",
  "size": "enorme",
  "level": 13,
  "cr": "15",
  "xp": 13000,
  "abilities": {
   "str": 23,
   "dex": 12,
   "con": 21,
   "int": 18,
   "wis": 15,
   "cha": 17
  },
  "ac": 19,
  "acNote": "armadura natural",
  "maxHp": 207,
  "hpDice": "18d12+90",
  "speedFt": 40,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80,
   "swimFt": 40
  },
  "senses": {
   "passivePerception": 22,
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
   "enganacao",
   "intuicao",
   "percepcao",
   "persuasao",
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "veneno"
  ],
  "conditionImmunities": [
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 11,
    "damage": "2d10+6",
    "type": "perfurante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "2d6",
     "type": "veneno"
    }
   },
   {
    "name": "Garra",
    "bonus": 11,
    "damage": "2d6+6",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Cauda",
    "bonus": 11,
    "damage": "2d8+6",
    "type": "concussão",
    "reachFt": 15
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
   "name": "Sopro Venenoso",
   "kind": "save",
   "shape": "cone",
   "areaFt": 60,
   "save": "con",
   "dc": 18,
   "damage": "16d6",
   "damageType": "veneno",
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
  "presencaAterradora": {
   "dc": 16,
   "alcanceFt": 120
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Ataque de Cauda",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Cauda"
    },
    {
     "nome": "Ataque de Asas",
     "custo": 2,
     "tipo": "area",
     "raioFt": 10,
     "save": "dex",
     "dc": 19,
     "damage": "2d6+6",
     "damageType": "concussão",
     "halfOnSave": false,
     "condition": "caido",
     "rounds": 10,
     "repete": false
    }
   ]
  },
  "traits": [
   "presencaAterradora",
   "acoesLendarias"
  ],
  "blurb": "Abre o combate com sua presença aterradora e um sopro de gás venenoso em cone, depois rasga com mordida e garras enquanto usa a cauda e as asas para manter os inimigos longe. Resiste a falhas em testes três vezes por dia e nunca é envenenado.",
  "lore": "Dragões verdes são cromáticos ardilosos que dominam florestas antigas e densas, tratando cada criatura do bosque como súdita. Adoram intriga: mentem, manipulam e preferem dobrar a vontade dos outros a simplesmente matá-los. Um adulto costuma comandar uma rede de servos enganados ou aterrorizados. Nadam bem e às vezes escondem o covil atrás de cachoeiras ou lagos sombrios."
 },
 "dragaoVermelhoAdulto": {
  "id": "dragaoVermelhoAdulto",
  "tipo": "dragão",
  "name": "Dragão Vermelho Adulto",
  "nomeOriginal": "Adult Red Dragon",
  "fonte": "MM",
  "size": "enorme",
  "level": 17,
  "cr": "17",
  "xp": 18000,
  "abilities": {
   "str": 27,
   "dex": 10,
   "con": 25,
   "int": 16,
   "wis": 13,
   "cha": 21
  },
  "ac": 19,
  "acNote": "armadura natural",
  "maxHp": 256,
  "hpDice": "19d12+133",
  "speedFt": 40,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80,
   "climbFt": 40
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
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "fogo"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 14,
    "damage": "2d10+8",
    "type": "perfurante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "2d6",
     "type": "fogo"
    }
   },
   {
    "name": "Garra",
    "bonus": 14,
    "damage": "2d6+8",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Cauda",
    "bonus": 14,
    "damage": "2d8+8",
    "type": "concussão",
    "reachFt": 15
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
   "name": "Sopro de Fogo",
   "kind": "save",
   "shape": "cone",
   "areaFt": 60,
   "save": "dex",
   "dc": 21,
   "damage": "18d6",
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
  "presencaAterradora": {
   "dc": 19,
   "alcanceFt": 120
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Ataque de Cauda",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Cauda"
    },
    {
     "nome": "Ataque de Asas",
     "custo": 2,
     "tipo": "area",
     "raioFt": 10,
     "save": "dex",
     "dc": 22,
     "damage": "2d6+8",
     "damageType": "concussão",
     "halfOnSave": false,
     "condition": "caido",
     "rounds": 10,
     "repete": false
    }
   ]
  },
  "traits": [
   "presencaAterradora",
   "acoesLendarias"
  ],
  "blurb": "Abre o combate aterrorizando o grupo e depois despeja um cone de fogo devastador, seguido de mordidas, garras e golpes de cauda de longo alcance. Voa rápido e resiste a efeitos que derrubariam outros monstros.",
  "lore": "O dragão vermelho é o mais ganancioso e arrogante dos dragões cromáticos. Ele escolhe montanhas altas e vulcões como covil, de onde vigia o território e cobra tributo de quem vive por perto. Acumula tesouros com obsessão e sabe de cor cada moeda que possui. Não tolera desafios ao seu orgulho e reage à menor ofensa com fúria incendiária."
 },
 "dragaoDePrataAdulto": {
  "id": "dragaoDePrataAdulto",
  "tipo": "dragão",
  "name": "Dragão de Prata Adulto",
  "nomeOriginal": "Adult Silver Dragon",
  "fonte": "MM",
  "size": "enorme",
  "level": 13,
  "cr": "16",
  "xp": 15000,
  "abilities": {
   "str": 27,
   "dex": 10,
   "con": 25,
   "int": 16,
   "wis": 13,
   "cha": 21
  },
  "ac": 19,
  "acNote": "armadura natural",
  "maxHp": 243,
  "hpDice": "18d12+126",
  "speedFt": 40,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80
  },
  "senses": {
   "passivePerception": 21,
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
   "historia",
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "frio"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 13,
    "damage": "2d10+8",
    "type": "perfurante",
    "reachFt": 10
   },
   {
    "name": "Garra",
    "bonus": 13,
    "damage": "2d6+8",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Cauda",
    "bonus": 13,
    "damage": "2d8+8",
    "type": "concussão",
    "reachFt": 15
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
   "name": "Sopro de Frio",
   "kind": "save",
   "shape": "cone",
   "areaFt": 60,
   "save": "con",
   "dc": 20,
   "damage": "13d8",
   "damageType": "frio",
   "halfOnSave": true,
   "origem": "sopro",
   "chaveRecarga": "Armas de Sopro",
   "recharge": [
    5,
    6
   ]
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "presencaAterradora": {
   "dc": 18,
   "alcanceFt": 120
  },
  "sopros": [
   {
    "name": "Sopro de Frio",
    "kind": "save",
    "shape": "cone",
    "areaFt": 60,
    "save": "con",
    "dc": 20,
    "damage": "13d8",
    "damageType": "frio",
    "halfOnSave": true,
    "origem": "sopro",
    "chaveRecarga": "Armas de Sopro",
    "recharge": [
     5,
     6
    ]
   },
   {
    "name": "Sopro Paralisante",
    "kind": "save",
    "shape": "cone",
    "areaFt": 60,
    "save": "con",
    "dc": 20,
    "condition": "paralisado",
    "rounds": 10,
    "origem": "sopro",
    "chaveRecarga": "Armas de Sopro",
    "recharge": [
     5,
     6
    ]
   }
  ],
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Ataque de Cauda",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Cauda"
    },
    {
     "nome": "Ataque de Asas",
     "custo": 2,
     "tipo": "area",
     "raioFt": 10,
     "save": "dex",
     "dc": 22,
     "damage": "2d6+8",
     "damageType": "concussão",
     "halfOnSave": false,
     "condition": "caido",
     "rounds": 10,
     "repete": false
    }
   ]
  },
  "traits": [
   "presencaAterradora",
   "t_mudarDeForma",
   "acoesLendarias"
  ],
  "blurb": "Combate com mordida, garras e cauda de longo alcance, enquanto sua presença aterradora espalha medo pelo campo. Seu sopro alterna entre um cone de frio devastador e um gás que paralisa grupos inteiros.",
  "lore": "Dragões de prata são dragões metálicos benevolentes e ordeiros, que costumam viver em picos montanhosos gelados. Gostam da companhia dos povos humanoides e muitas vezes passam longos períodos disfarçados entre eles, em cidades. Valorizam a justiça e a amizade, e preferem resolver conflitos sem violência. Quando enfrentam o mal, porém, lutam com determinação implacável."
 },
 "dragaoBrancoAdulto": {
  "id": "dragaoBrancoAdulto",
  "tipo": "dragão",
  "name": "Dragão Branco Adulto",
  "nomeOriginal": "Adult White Dragon",
  "fonte": "MM",
  "size": "enorme",
  "level": 13,
  "cr": "13",
  "xp": 10000,
  "abilities": {
   "str": 22,
   "dex": 10,
   "con": 22,
   "int": 8,
   "wis": 12,
   "cha": 12
  },
  "ac": 18,
  "acNote": "armadura natural",
  "maxHp": 200,
  "hpDice": "16d12+96",
  "speedFt": 40,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80,
   "swimFt": 40,
   "burrowFt": 30
  },
  "senses": {
   "passivePerception": 21,
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
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "frio"
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
     "damage": "1d8",
     "type": "frio"
    }
   },
   {
    "name": "Garra",
    "bonus": 11,
    "damage": "2d6+6",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Cauda",
    "bonus": 11,
    "damage": "2d8+6",
    "type": "concussão",
    "reachFt": 15
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
   "name": "Sopro Gélido",
   "kind": "save",
   "shape": "cone",
   "areaFt": 60,
   "save": "con",
   "dc": 19,
   "damage": "12d8",
   "damageType": "frio",
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
  "presencaAterradora": {
   "dc": 14,
   "alcanceFt": 120
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Ataque de Cauda",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Cauda"
    },
    {
     "nome": "Ataque de Asas",
     "custo": 2,
     "tipo": "area",
     "raioFt": 10,
     "save": "dex",
     "dc": 19,
     "damage": "2d6+6",
     "damageType": "concussão",
     "halfOnSave": false,
     "condition": "caido",
     "rounds": 10,
     "repete": false
    }
   ]
  },
  "traits": [
   "presencaAterradora",
   "t_andarNoGelo",
   "acoesLendarias"
  ],
  "blurb": "Fera brutal que congela grupos inteiros com seu sopro em cone de 18 m e depois os despedaça com mordida, garras e cauda. Sua presença aterradora pode deixar metade do grupo amedrontado antes mesmo do primeiro golpe.",
  "lore": "O menor e mais selvagem dos dragões cromáticos, o dragão branco vive nas regiões geladas, em cavernas de gelo e picos nevados. Pouco inteligente mas muito astuto como caçador, age mais por instinto que por planos. Guarda uma memória rancorosa de cada derrota e de cada vitória. Seu tesouro costuma ficar preso no gelo, exibido como troféu."
 },
 "elementalDoAr": {
  "id": "elementalDoAr",
  "tipo": "elemental",
  "name": "Elemental do Ar",
  "nomeOriginal": "Air Elemental",
  "fonte": "MM",
  "size": "grande",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 14,
   "dex": 20,
   "con": 14,
   "int": 6,
   "wis": 10,
   "cha": 6
  },
  "ac": 15,
  "maxHp": 90,
  "hpDice": "12d10+24",
  "speedFt": 0,
  "flyFt": 90,
  "hover": true,
  "speeds": {
   "flyFt": 90
  },
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "elétrico",
   "trovejante",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "damageImmunities": [
   "veneno"
  ],
  "conditionImmunities": [
   "exausto",
   "agarrado",
   "paralisado",
   "petrificado",
   "envenenado",
   "caido",
   "contido",
   "inconsciente"
  ],
  "attacks": [
   {
    "name": "Pancada",
    "bonus": 8,
    "damage": "2d8+5",
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
    "nome": "Redemoinho",
    "recharge": [
     4,
     5,
     6
    ],
    "tipo": "area",
    "shape": "raio",
    "areaFt": 5,
    "arremessaFt": 20,
    "save": "str",
    "dc": 13,
    "damage": "3d8+2",
    "damageType": "concussão",
    "halfOnSave": true,
    "condition": "caido",
    "rounds": 10,
    "repete": false
   }
  ],
  "traits": [
   "formaFluida"
  ],
  "blurb": "Voa muito rápido, invade o espaço dos inimigos e os golpeia duas vezes por turno; seu Redemoinho arremessa quem estiver dentro dele, derrubando e ferindo também quem estiver no caminho.",
  "lore": "É um turbilhão de vento vivo, arrancado do Plano Elemental do Ar e mantido neste mundo por magia. Costuma surgir em picos de montanha e desertos abertos, onde o vento sopra sem obstáculos. Tem pouca inteligência e age como uma tempestade com vontade própria, avançando contra o que estiver à frente. Quase nada o prende ou derruba, e frestas mínimas bastam para ele passar."
 },
 "alossauro": {
  "id": "alossauro",
  "tipo": "fera",
  "name": "Alossauro",
  "nomeOriginal": "Allosaurus",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 19,
   "dex": 13,
   "con": 17,
   "int": 2,
   "wis": 12,
   "cha": 5
  },
  "ac": 13,
  "acNote": "armadura natural",
  "maxHp": 51,
  "hpDice": "6d10+18",
  "speedFt": 60,
  "senses": {
   "passivePerception": 15
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
    "bonus": 6,
    "damage": "2d10+4",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Garra",
    "bonus": 6,
    "damage": "1d8+4",
    "type": "cortante",
    "reachFt": 5,
    "investida": {
     "pes": 30,
     "save": "str",
     "dc": 13,
     "mordeSeCair": "Mordida"
    }
   }
  ],
  "traits": [],
  "blurb": "Predador veloz que dispara em linha reta contra a presa, derruba-a com as garras e emenda uma mordida brutal. Seu deslocamento de 18 m torna a fuga quase impossível.",
  "lore": "O alossauro é um grande dinossauro carnívoro que caça em planícies e campos abertos. Anda sobre duas patas fortes e usa a velocidade para alcançar presas antes que elas reajam. Age por puro instinto, farejando e observando o terreno em busca de alvos isolados ou feridos. Costuma atacar em investidas curtas e violentas, sem hesitar diante de criaturas maiores."
 },
 "dragaoNegroAnciao": {
  "id": "dragaoNegroAnciao",
  "tipo": "dragão",
  "name": "Dragão Negro Ancião",
  "nomeOriginal": "Ancient Black Dragon",
  "fonte": "MM",
  "size": "imenso",
  "level": 21,
  "cr": "21",
  "xp": 33000,
  "abilities": {
   "str": 27,
   "dex": 14,
   "con": 25,
   "int": 16,
   "wis": 15,
   "cha": 19
  },
  "ac": 22,
  "acNote": "armadura natural",
  "maxHp": 367,
  "hpDice": "21d20+147",
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
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "ácido"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 15,
    "damage": "2d10+8",
    "type": "perfurante",
    "reachFt": 15,
    "danoExtra": {
     "damage": "2d8",
     "type": "ácido"
    }
   },
   {
    "name": "Garra",
    "bonus": 15,
    "damage": "2d6+8",
    "type": "cortante",
    "reachFt": 10
   },
   {
    "name": "Cauda",
    "bonus": 15,
    "damage": "2d8+8",
    "type": "concussão",
    "reachFt": 20
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
   "name": "Sopro Ácido",
   "kind": "save",
   "shape": "linha",
   "areaFt": 90,
   "save": "dex",
   "dc": 22,
   "damage": "15d8",
   "damageType": "ácido",
   "halfOnSave": true,
   "origem": "sopro",
   "larguraFt": 10,
   "recharge": [
    5,
    6
   ]
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "presencaAterradora": {
   "dc": 19,
   "alcanceFt": 120
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Ataque de Cauda",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Cauda"
    },
    {
     "nome": "Ataque de Asas",
     "custo": 2,
     "tipo": "area",
     "raioFt": 15,
     "save": "dex",
     "dc": 23,
     "damage": "2d6+8",
     "damageType": "concussão",
     "halfOnSave": false,
     "condition": "caido",
     "rounds": 10,
     "repete": false
    }
   ]
  },
  "traits": [
   "presencaAterradora",
   "acoesLendarias"
  ],
  "blurb": "Predador colossal que espalha medo com sua presença, dilacera com mordida ácida, garras e cauda de longo alcance e dissolve fileiras inteiras com um sopro de ácido em linha de 27 m.",
  "lore": "Os dragões negros são cromáticos cruéis e rancorosos que fazem covil em pântanos fétidos e ruínas alagadas. Um ancião desses domina vastas extensões de charco, onde a água parada e a vegetação podre denunciam sua presença. Respira tanto no ar quanto debaixo d'água e gosta de emboscar presas a partir das profundezas lamacentas. Sente prazer em ver os fracos sofrerem e guarda tesouros de reinos que ele mesmo ajudou a afundar."
 },
 "dragaoAzulAnciao": {
  "id": "dragaoAzulAnciao",
  "tipo": "dragão",
  "name": "Dragão Azul Ancião",
  "nomeOriginal": "Ancient Blue Dragon",
  "fonte": "MM",
  "size": "imenso",
  "level": 21,
  "cr": "23",
  "xp": 50000,
  "abilities": {
   "str": 29,
   "dex": 10,
   "con": 27,
   "int": 18,
   "wis": 17,
   "cha": 21
  },
  "ac": 22,
  "acNote": "armadura natural",
  "maxHp": 481,
  "hpDice": "26d20+208",
  "speedFt": 40,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80,
   "burrowFt": 40
  },
  "senses": {
   "passivePerception": 27,
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
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "elétrico"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 16,
    "damage": "2d10+9",
    "type": "perfurante",
    "reachFt": 15,
    "danoExtra": {
     "damage": "2d10",
     "type": "elétrico"
    }
   },
   {
    "name": "Garra",
    "bonus": 16,
    "damage": "2d6+9",
    "type": "cortante",
    "reachFt": 10
   },
   {
    "name": "Cauda",
    "bonus": 16,
    "damage": "2d8+9",
    "type": "concussão",
    "reachFt": 20
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
   "name": "Sopro de Relâmpago",
   "kind": "save",
   "shape": "linha",
   "areaFt": 120,
   "save": "dex",
   "dc": 23,
   "damage": "16d10",
   "damageType": "elétrico",
   "halfOnSave": true,
   "origem": "sopro",
   "larguraFt": 10,
   "recharge": [
    5,
    6
   ]
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "presencaAterradora": {
   "dc": 20,
   "alcanceFt": 120
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Ataque de Cauda",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Cauda"
    },
    {
     "nome": "Ataque de Asas",
     "custo": 2,
     "tipo": "area",
     "raioFt": 15,
     "save": "dex",
     "dc": 24,
     "damage": "2d6+9",
     "damageType": "concussão",
     "halfOnSave": false,
     "condition": "caido",
     "rounds": 10,
     "repete": false
    }
   ]
  },
  "traits": [
   "presencaAterradora",
   "acoesLendarias"
  ],
  "blurb": "Voa e escava pelas areias, emboscando com um sopro de relâmpago em linha de 36 m que pode aniquilar um grupo inteiro. De perto, mordidas eletrificadas, garras e cauda de longo alcance completam o estrago.",
  "lore": "Dragões azuis são cromáticos vaidosos e territoriais que dominam desertos e litorais áridos. Um ancião desses governa vastas regiões, cobrando tributo de caravanas e povoados. Costuma se enterrar na areia deixando só os chifres à mostra, à espera de presas. Tem prazer em ver suas vítimas se arrastarem sob o sol antes de atacar. Seu covil fica em cavernas profundas sob dunas, onde guarda tesouros, especialmente gemas azuis."
 },
 "dragaoDeLataoAnciao": {
  "id": "dragaoDeLataoAnciao",
  "tipo": "dragão",
  "name": "Dragão de Latão Ancião",
  "nomeOriginal": "Ancient Brass Dragon",
  "fonte": "MM",
  "size": "imenso",
  "level": 17,
  "cr": "20",
  "xp": 25000,
  "abilities": {
   "str": 27,
   "dex": 10,
   "con": 25,
   "int": 16,
   "wis": 15,
   "cha": 19
  },
  "ac": 20,
  "acNote": "armadura natural",
  "maxHp": 297,
  "hpDice": "17d20+119",
  "speedFt": 40,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80,
   "burrowFt": 40
  },
  "senses": {
   "passivePerception": 24,
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
   "percepcao"
  ],
  "damageImmunities": [
   "fogo"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 14,
    "damage": "2d10+8",
    "type": "perfurante",
    "reachFt": 15
   },
   {
    "name": "Garra",
    "bonus": 14,
    "damage": "2d6+8",
    "type": "cortante",
    "reachFt": 10
   },
   {
    "name": "Cauda",
    "bonus": 14,
    "damage": "2d8+8",
    "type": "concussão",
    "reachFt": 20
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
   "name": "Sopro de Fogo",
   "kind": "save",
   "shape": "linha",
   "areaFt": 90,
   "save": "dex",
   "dc": 21,
   "damage": "16d6",
   "damageType": "fogo",
   "halfOnSave": true,
   "larguraFt": 10,
   "origem": "sopro",
   "chaveRecarga": "Armas de Sopro",
   "recharge": [
    5,
    6
   ]
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "presencaAterradora": {
   "dc": 18,
   "alcanceFt": 120
  },
  "sopros": [
   {
    "name": "Sopro de Fogo",
    "kind": "save",
    "shape": "linha",
    "areaFt": 90,
    "save": "dex",
    "dc": 21,
    "damage": "16d6",
    "damageType": "fogo",
    "halfOnSave": true,
    "larguraFt": 10,
    "origem": "sopro",
    "chaveRecarga": "Armas de Sopro",
    "recharge": [
     5,
     6
    ]
   },
   {
    "name": "Sopro do Sono",
    "kind": "save",
    "shape": "cone",
    "areaFt": 90,
    "save": "con",
    "dc": 21,
    "condition": "inconsciente",
    "rounds": 100,
    "origem": "sopro",
    "chaveRecarga": "Armas de Sopro",
    "recharge": [
     5,
     6
    ]
   }
  ],
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Ataque de Cauda",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Cauda"
    },
    {
     "nome": "Ataque de Asas",
     "custo": 2,
     "tipo": "area",
     "raioFt": 15,
     "save": "dex",
     "dc": 22,
     "damage": "2d6+8",
     "damageType": "concussão",
     "halfOnSave": false,
     "condition": "caido",
     "rounds": 10,
     "repete": false
    }
   ]
  },
  "traits": [
   "presencaAterradora",
   "t_mudarDeForma",
   "acoesLendarias"
  ],
  "blurb": "Gigante voador e escavador que abre a luta com sua Presença Aterradora, morde e golpeia com garras de longo alcance. Seu sopro alterna entre uma linha de fogo devastadora e um cone de gás que derruba grupos inteiros no sono.",
  "lore": "Os dragões de latão são os mais falantes entre os dragões metálicos e adoram uma boa conversa com viajantes. Fazem seus covis sob as areias de desertos quentes, muitas vezes em ruínas ou rochas esculpidas pelo vento. Um ancião desses já viu séculos de história e guarda informações tão valiosas quanto seu tesouro. Costuma preferir pôr intrusos para dormir e interrogá-los a matá-los, mas reage com fúria a quem ameaça seu lar."
 },
 "dragaoDeBronzeAnciao": {
  "id": "dragaoDeBronzeAnciao",
  "tipo": "dragão",
  "name": "Dragão de Bronze Ancião",
  "nomeOriginal": "Ancient Bronze Dragon",
  "fonte": "MM",
  "size": "imenso",
  "level": 21,
  "cr": "22",
  "xp": 41000,
  "abilities": {
   "str": 29,
   "dex": 10,
   "con": 27,
   "int": 18,
   "wis": 17,
   "cha": 21
  },
  "ac": 22,
  "acNote": "armadura natural",
  "maxHp": 444,
  "hpDice": "24d20+192",
  "speedFt": 40,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80,
   "swimFt": 40
  },
  "senses": {
   "passivePerception": 27,
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
   "intuicao",
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "elétrico"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 16,
    "damage": "2d10+9",
    "type": "perfurante",
    "reachFt": 15
   },
   {
    "name": "Garra",
    "bonus": 16,
    "damage": "2d6+9",
    "type": "cortante",
    "reachFt": 10
   },
   {
    "name": "Cauda",
    "bonus": 16,
    "damage": "2d8+9",
    "type": "concussão",
    "reachFt": 20
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
   "name": "Sopro Elétrico",
   "kind": "save",
   "shape": "linha",
   "areaFt": 120,
   "save": "dex",
   "dc": 23,
   "damage": "16d10",
   "damageType": "elétrico",
   "halfOnSave": true,
   "larguraFt": 10,
   "origem": "sopro",
   "chaveRecarga": "Armas de Sopro",
   "recharge": [
    5,
    6
   ]
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "presencaAterradora": {
   "dc": 20,
   "alcanceFt": 120
  },
  "sopros": [
   {
    "name": "Sopro Elétrico",
    "kind": "save",
    "shape": "linha",
    "areaFt": 120,
    "save": "dex",
    "dc": 23,
    "damage": "16d10",
    "damageType": "elétrico",
    "halfOnSave": true,
    "larguraFt": 10,
    "origem": "sopro",
    "chaveRecarga": "Armas de Sopro",
    "recharge": [
     5,
     6
    ]
   },
   {
    "name": "Sopro Repulsor",
    "kind": "save",
    "shape": "cone",
    "areaFt": 30,
    "save": "str",
    "dc": 23,
    "empurraFt": 60,
    "origem": "sopro",
    "chaveRecarga": "Armas de Sopro",
    "recharge": [
     5,
     6
    ]
   }
  ],
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Ataque de Cauda",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Cauda"
    },
    {
     "nome": "Ataque de Asas",
     "custo": 2,
     "tipo": "area",
     "raioFt": 15,
     "save": "dex",
     "dc": 24,
     "damage": "2d6+9",
     "damageType": "concussão",
     "halfOnSave": false,
     "condition": "caido",
     "rounds": 10,
     "repete": false
    }
   ]
  },
  "traits": [
   "presencaAterradora",
   "t_mudarDeForma",
   "acoesLendarias"
  ],
  "blurb": "Colosso anfíbio que domina mar e céu, alternando mordidas e garras devastadoras com um sopro de relâmpago em linha ou uma rajada que arremessa grupos inteiros para longe. Sua presença aterradora e suas asas derrubam quem se aproxima.",
  "lore": "Os dragões de bronze habitam litorais, fazendo covis em grutas marinhas e ilhas rochosas onde a maré esconde seus tesouros. São guardiões de índole justa, fascinados pela guerra e pelo mar, e costumam ajudar navegantes e povos costeiros contra tiranos. Muitos assumem forma humana ou de animal para observar o mundo de perto. Um ancião desses viveu séculos, é astuto e raramente entra num combate sem entender o que está em jogo."
 },
 "dragaoDeCobreAnciao": {
  "id": "dragaoDeCobreAnciao",
  "tipo": "dragão",
  "name": "Dragão de Cobre Ancião",
  "nomeOriginal": "Ancient Copper Dragon",
  "fonte": "MM",
  "size": "imenso",
  "level": 21,
  "cr": "21",
  "xp": 33000,
  "abilities": {
   "str": 27,
   "dex": 12,
   "con": 25,
   "int": 20,
   "wis": 17,
   "cha": 19
  },
  "ac": 21,
  "acNote": "armadura natural",
  "maxHp": 350,
  "hpDice": "20d20+140",
  "speedFt": 40,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80,
   "climbFt": 40
  },
  "senses": {
   "passivePerception": 27,
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
   "enganacao",
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "ácido"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 15,
    "damage": "2d10+8",
    "type": "perfurante",
    "reachFt": 15
   },
   {
    "name": "Garra",
    "bonus": 15,
    "damage": "2d6+8",
    "type": "cortante",
    "reachFt": 10
   },
   {
    "name": "Cauda",
    "bonus": 15,
    "damage": "2d8+8",
    "type": "concussão",
    "reachFt": 20
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
   "name": "Armas de Sopro",
   "kind": "save",
   "shape": "linha",
   "areaFt": 90,
   "save": "dex",
   "dc": 22,
   "damage": "14d8",
   "damageType": "ácido",
   "halfOnSave": true,
   "origem": "sopro",
   "larguraFt": 10,
   "recharge": [
    5,
    6
   ]
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "presencaAterradora": {
   "dc": 19,
   "alcanceFt": 120
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Ataque de Cauda",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Cauda"
    },
    {
     "nome": "Ataque de Asas",
     "custo": 2,
     "tipo": "area",
     "raioFt": 15,
     "save": "dex",
     "dc": 23,
     "damage": "2d6+8",
     "damageType": "concussão",
     "halfOnSave": false,
     "condition": "caido",
     "rounds": 10,
     "repete": false
    }
   ]
  },
  "traits": [
   "presencaAterradora",
   "t_mudarDeForma",
   "acoesLendarias"
  ],
  "blurb": "Gigante voador e escalador que combina mordida, garras e cauda de longo alcance com um sopro de ácido em linha ou um gás que deixa os alvos lentos. Sua presença aterradora e as resistências lendárias tornam difícil derrubá-lo ou controlá-lo.",
  "lore": "Dragões de cobre são metálicos brincalhões que adoram piadas, enigmas e boas histórias. Fazem seus covis em colinas e planaltos rochosos, cheios de cavernas e passagens apertadas. Um ancião já viu séculos de pegadinhas e costuma testar a inteligência dos visitantes antes de decidir se são dignos. Raramente busca briga, mas quem o enfurece descobre que por trás do humor existe uma fera colossal e astuta."
 },
 "dragaoDeOuroAnciao": {
  "id": "dragaoDeOuroAnciao",
  "tipo": "dragão",
  "name": "Dragão de Ouro Ancião",
  "nomeOriginal": "Ancient Gold Dragon",
  "fonte": "MM",
  "size": "imenso",
  "level": 21,
  "cr": "24",
  "xp": 62000,
  "abilities": {
   "str": 30,
   "dex": 14,
   "con": 29,
   "int": 18,
   "wis": 17,
   "cha": 28
  },
  "ac": 22,
  "acNote": "armadura natural",
  "maxHp": 546,
  "hpDice": "28d20+252",
  "speedFt": 40,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80,
   "swimFt": 40
  },
  "senses": {
   "passivePerception": 27,
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
   "intuicao",
   "percepcao",
   "persuasao",
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "fogo"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 17,
    "damage": "2d10+10",
    "type": "perfurante",
    "reachFt": 15
   },
   {
    "name": "Garra",
    "bonus": 17,
    "damage": "2d6+10",
    "type": "cortante",
    "reachFt": 10
   },
   {
    "name": "Cauda",
    "bonus": 17,
    "damage": "2d8+10",
    "type": "concussão",
    "reachFt": 20
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
   "name": "Armas de Sopro",
   "kind": "save",
   "shape": "cone",
   "areaFt": 90,
   "save": "dex",
   "dc": 24,
   "damage": "13d10",
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
  "presencaAterradora": {
   "dc": 24,
   "alcanceFt": 120
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Ataque de Cauda",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Cauda"
    },
    {
     "nome": "Ataque de Asas",
     "custo": 2,
     "tipo": "area",
     "raioFt": 15,
     "save": "dex",
     "dc": 25,
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
   "presencaAterradora",
   "t_mudarDeForma",
   "acoesLendarias"
  ],
  "blurb": "Gigante voador que abre o combate com presença aterradora e alterna entre um sopro de fogo devastador e um gás que drena a força dos inimigos. Com mordida, garras, cauda de longo alcance e ações lendárias, pune quem se aproxima e quem se esconde.",
  "lore": "Os dragões de ouro são os mais nobres entre os dragões metálicos, defensores da justiça e inimigos declarados da crueldade. Vivem em covis afastados, perto de lagos, cachoeiras ou florestas antigas, muitas vezes ocultos por magia. Os anciões costumam andar entre os povos disfarçados de humanos ou animais, observando e ajudando em segredo. São sábios, pacientes e orgulhosos, e preferem a conversa à batalha, mas quando lutam não poupam os malfeitores."
 },
 "dragaoVerdeAnciao": {
  "id": "dragaoVerdeAnciao",
  "tipo": "dragão",
  "name": "Dragão Verde Ancião",
  "nomeOriginal": "Ancient Green Dragon",
  "fonte": "MM",
  "size": "imenso",
  "level": 21,
  "cr": "22",
  "xp": 41000,
  "abilities": {
   "str": 27,
   "dex": 12,
   "con": 25,
   "int": 20,
   "wis": 17,
   "cha": 19
  },
  "ac": 21,
  "acNote": "armadura natural",
  "maxHp": 385,
  "hpDice": "22d20+154",
  "speedFt": 40,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80,
   "swimFt": 40
  },
  "senses": {
   "passivePerception": 27,
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
   "enganacao",
   "intuicao",
   "percepcao",
   "persuasao",
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "veneno"
  ],
  "conditionImmunities": [
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 15,
    "damage": "2d10+8",
    "type": "perfurante",
    "reachFt": 15,
    "danoExtra": {
     "damage": "3d6",
     "type": "veneno"
    }
   },
   {
    "name": "Garra",
    "bonus": 15,
    "damage": "4d6+8",
    "type": "cortante",
    "reachFt": 10
   },
   {
    "name": "Cauda",
    "bonus": 15,
    "damage": "2d8+8",
    "type": "concussão",
    "reachFt": 20
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
   "name": "Sopro Venenoso",
   "kind": "save",
   "shape": "cone",
   "areaFt": 90,
   "save": "con",
   "dc": 22,
   "damage": "22d6",
   "damageType": "veneno",
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
  "presencaAterradora": {
   "dc": 19,
   "alcanceFt": 120
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Ataque de Cauda",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Cauda"
    },
    {
     "nome": "Ataque de Asas",
     "custo": 2,
     "tipo": "area",
     "raioFt": 15,
     "save": "dex",
     "dc": 23,
     "damage": "2d6+8",
     "damageType": "concussão",
     "halfOnSave": false,
     "condition": "caido",
     "rounds": 10,
     "repete": false
    }
   ]
  },
  "traits": [
   "presencaAterradora",
   "acoesLendarias"
  ],
  "blurb": "Abre a luta com sua presença aterradora e um sopro de gás venenoso em cone de 27 m que pode causar 77 de dano. De perto, morde, arranha e varre o terreno com a cauda e as asas, e ainda resiste a efeitos que derrubariam qualquer outro.",
  "lore": "É um dos dragões cromáticos mais velhos e astutos, senhor de florestas antigas e densas onde poucos ousam entrar. Gosta de manipular: prefere enganar, corromper e dominar outras criaturas a simplesmente matá-las. Respira tanto no ar quanto na água, e costuma esconder seu covil atrás de cachoeiras ou em lagos sombrios. Mente com naturalidade e trata quase todos como peões ou servos em potencial."
 },
 "dragaoVermelhoAnciao": {
  "id": "dragaoVermelhoAnciao",
  "tipo": "dragão",
  "name": "Dragão Vermelho Ancião",
  "nomeOriginal": "Ancient Red Dragon",
  "fonte": "MM",
  "size": "imenso",
  "level": 21,
  "cr": "24",
  "xp": 62000,
  "abilities": {
   "str": 30,
   "dex": 10,
   "con": 29,
   "int": 18,
   "wis": 15,
   "cha": 23
  },
  "ac": 22,
  "acNote": "armadura natural",
  "maxHp": 546,
  "hpDice": "28d20+252",
  "speedFt": 40,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80,
   "climbFt": 40
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
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "fogo"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 17,
    "damage": "2d10+10",
    "type": "perfurante",
    "reachFt": 15,
    "danoExtra": {
     "damage": "4d6",
     "type": "fogo"
    }
   },
   {
    "name": "Garra",
    "bonus": 17,
    "damage": "2d6+10",
    "type": "cortante",
    "reachFt": 10
   },
   {
    "name": "Cauda",
    "bonus": 17,
    "damage": "2d8+10",
    "type": "concussão",
    "reachFt": 20
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
   "name": "Sopro de Fogo",
   "kind": "save",
   "shape": "cone",
   "areaFt": 90,
   "save": "dex",
   "dc": 24,
   "damage": "26d6",
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
  "presencaAterradora": {
   "dc": 21,
   "alcanceFt": 120
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Ataque de Cauda",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Cauda"
    },
    {
     "nome": "Ataque de Asas",
     "custo": 2,
     "tipo": "area",
     "raioFt": 15,
     "save": "dex",
     "dc": 25,
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
   "presencaAterradora",
   "acoesLendarias"
  ],
  "blurb": "Um colosso voador que aterroriza com sua presença, despedaça alvos com mordida flamejante e garras, e incinera grupos inteiros com um sopro de fogo devastador. Resiste a magias com facilidade e age até fora do próprio turno.",
  "lore": "O dragão vermelho ancião é o mais arrogante e cruel dos dragões cromáticos, um tirano que se considera rei de tudo o que vê. Faz seu covil em montanhas e colinas, de preferência perto de vulcões ou cavernas aquecidas, onde guarda um tesouro imenso. Exige tributo de povos vizinhos e destrói quem o desafia. Séculos de vida o tornaram astuto, paciente e quase impossível de enganar."
 },
 "dragaoDePrataAnciao": {
  "id": "dragaoDePrataAnciao",
  "tipo": "dragão",
  "name": "Dragão de Prata Ancião",
  "nomeOriginal": "Ancient Silver Dragon",
  "fonte": "MM",
  "size": "imenso",
  "level": 21,
  "cr": "23",
  "xp": 50000,
  "abilities": {
   "str": 30,
   "dex": 10,
   "con": 29,
   "int": 18,
   "wis": 15,
   "cha": 23
  },
  "ac": 22,
  "acNote": "armadura natural",
  "maxHp": 487,
  "hpDice": "25d20+225",
  "speedFt": 40,
  "flyFt": 80,
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
   "con",
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
  "damageImmunities": [
   "frio"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 17,
    "damage": "2d10+10",
    "type": "perfurante",
    "reachFt": 15
   },
   {
    "name": "Garra",
    "bonus": 17,
    "damage": "2d6+10",
    "type": "cortante",
    "reachFt": 10
   },
   {
    "name": "Cauda",
    "bonus": 17,
    "damage": "2d8+10",
    "type": "concussão",
    "reachFt": 20
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
   "name": "Sopro de Frio",
   "kind": "save",
   "shape": "cone",
   "areaFt": 90,
   "save": "con",
   "dc": 24,
   "damage": "15d8",
   "damageType": "frio",
   "halfOnSave": true,
   "origem": "sopro",
   "chaveRecarga": "Armas de Sopro",
   "recharge": [
    5,
    6
   ]
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "presencaAterradora": {
   "dc": 21,
   "alcanceFt": 120
  },
  "sopros": [
   {
    "name": "Sopro de Frio",
    "kind": "save",
    "shape": "cone",
    "areaFt": 90,
    "save": "con",
    "dc": 24,
    "damage": "15d8",
    "damageType": "frio",
    "halfOnSave": true,
    "origem": "sopro",
    "chaveRecarga": "Armas de Sopro",
    "recharge": [
     5,
     6
    ]
   },
   {
    "name": "Sopro Paralisante",
    "kind": "save",
    "shape": "cone",
    "areaFt": 90,
    "save": "con",
    "dc": 24,
    "condition": "paralisado",
    "rounds": 10,
    "origem": "sopro",
    "chaveRecarga": "Armas de Sopro",
    "recharge": [
     5,
     6
    ]
   }
  ],
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Ataque de Cauda",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Cauda"
    },
    {
     "nome": "Ataque de Asas",
     "custo": 2,
     "tipo": "area",
     "raioFt": 15,
     "save": "dex",
     "dc": 25,
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
   "presencaAterradora",
   "t_mudarDeForma",
   "acoesLendarias"
  ],
  "blurb": "Colosso voador que alterna sopro congelante e gás paralisante em cones de 27 m, enquanto morde, golpeia com garras e varre com a cauda a até 6 m. Sua presença aterradora e três resistências lendárias tornam difícil derrubá-lo.",
  "lore": "Os dragões de prata estão entre os mais nobres dos dragões metálicos e gostam sinceramente da companhia dos povos humanoides. Costumam fazer seus covis em picos gelados de montanhas, mas passam longos períodos disfarçados em cidades, vivendo entre as pessoas. Um ancião acumula séculos de sabedoria e conhecimento arcano. Prefere conversar e proteger os fracos, mas combate o mal com fúria implacável quando necessário."
 },
 "dragaoBrancoAnciao": {
  "id": "dragaoBrancoAnciao",
  "tipo": "dragão",
  "name": "Dragão Branco Ancião",
  "nomeOriginal": "Ancient White Dragon",
  "fonte": "MM",
  "size": "imenso",
  "level": 17,
  "cr": "20",
  "xp": 25000,
  "abilities": {
   "str": 26,
   "dex": 10,
   "con": 26,
   "int": 10,
   "wis": 13,
   "cha": 14
  },
  "ac": 20,
  "acNote": "armadura natural",
  "maxHp": 333,
  "hpDice": "18d20+144",
  "speedFt": 40,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80,
   "swimFt": 40,
   "burrowFt": 40
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
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "frio"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 14,
    "damage": "2d10+8",
    "type": "perfurante",
    "reachFt": 15,
    "danoExtra": {
     "damage": "2d8",
     "type": "frio"
    }
   },
   {
    "name": "Garra",
    "bonus": 14,
    "damage": "2d6+8",
    "type": "cortante",
    "reachFt": 10
   },
   {
    "name": "Cauda",
    "bonus": 14,
    "damage": "2d8+8",
    "type": "concussão",
    "reachFt": 20
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
   "name": "Sopro Gélido (Recarga 5–6)",
   "kind": "save",
   "shape": "cone",
   "areaFt": 90,
   "save": "con",
   "dc": 22,
   "damage": "16d8",
   "damageType": "frio",
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
  "presencaAterradora": {
   "dc": 16,
   "alcanceFt": 120
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Ataque de Cauda",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Cauda"
    },
    {
     "nome": "Ataque de Asas (Custa 2 Ações)",
     "custo": 2,
     "tipo": "area",
     "raioFt": 15,
     "save": "dex",
     "dc": 22,
     "damage": "2d6+8",
     "damageType": "concussão",
     "halfOnSave": false,
     "condition": "caido",
     "rounds": 10,
     "repete": false
    }
   ]
  },
  "traits": [
   "presencaAterradora",
   "t_andarNoGelo",
   "acoesLendarias"
  ],
  "blurb": "Fera colossal que congela grupos inteiros com um sopro de gelo em cone de 27 m e depois despedaça os sobreviventes com mordida, garras e cauda. Sua presença aterradora e as asas que derrubam quem estiver perto tornam difícil até chegar nela.",
  "lore": "O dragão branco ancião é o mais bestial dos dragões cromáticos, guiado mais pelo instinto e pela fome do que pela astúcia. Ele domina geleiras, picos nevados e cavernas de gelo nas terras árticas, onde guarda seu tesouro congelado. Prefere emboscar presas, surgindo sob a neve ou mergulhando do céu tempestuoso. Memória longa e rancor profundo fazem dele um caçador implacável contra quem invade seu território."
 },
 "androesfinge": {
  "id": "androesfinge",
  "tipo": "monstruosidade",
  "name": "Androesfinge",
  "nomeOriginal": "Androsphinx",
  "fonte": "MM",
  "size": "grande",
  "level": 17,
  "cr": "17",
  "xp": 18000,
  "abilities": {
   "str": 22,
   "dex": 10,
   "con": 20,
   "int": 16,
   "wis": 18,
   "cha": 23
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 199,
  "hpDice": "19d10+95",
  "speedFt": 40,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60
  },
  "senses": {
   "passivePerception": 20,
   "truesightFt": 120
  },
  "saves": [
   "dex",
   "con",
   "int",
   "wis"
  ],
  "skills": [
   "arcanismo",
   "percepcao",
   "religiao"
  ],
  "expertise": [
   "religiao"
  ],
  "damageImmunities": [
   "psíquico",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageImmunitiesNote": "só de armas não mágicas",
  "conditionImmunities": [
   "enfeitiçado",
   "amedrontado"
  ],
  "attacks": [
   {
    "name": "Garra",
    "bonus": 12,
    "damage": "2d10+6",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Garra",
    "Garra"
   ]
  },
  "spellcasting": {
   "ability": "wis",
   "cantrips": [
    "chamaSagrada",
    "pouparOsMoribundos",
    "taumaturgia"
   ],
   "prepared": [
    "comando",
    "detectarBemMal",
    "detectarMagia",
    "restauracaoMenor",
    "zonaDaVerdade",
    "dissiparMagia",
    "linguas",
    "banimento",
    "liberdadeDeMovimento",
    "golpeDeChama",
    "restauracaoMaior",
    "banqueteDeHerois"
   ],
   "slots": [
    0,
    4,
    3,
    3,
    3,
    2,
    1
   ],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "cdPorMagia": {
    "chamaSagrada": 18,
    "pouparOsMoribundos": 18,
    "taumaturgia": 18,
    "comando": 18,
    "detectarBemMal": 18,
    "detectarMagia": 18,
    "restauracaoMenor": 18,
    "zonaDaVerdade": 18,
    "dissiparMagia": 18,
    "linguas": 18,
    "banimento": 18,
    "liberdadeDeMovimento": 18,
    "golpeDeChama": 18,
    "restauracaoMaior": 18,
    "banqueteDeHerois": 18
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Rugido",
    "porDia": 3,
    "tipo": "estagios",
    "estagios": [
     {
      "nome": "Rugido",
      "tipo": "area",
      "shape": "raio",
      "areaFt": 500,
      "save": "wis",
      "dc": 18,
      "condition": "amedrontado",
      "rounds": 10,
      "repete": true
     },
     {
      "nome": "Rugido",
      "tipo": "area",
      "shape": "raio",
      "areaFt": 500,
      "save": "wis",
      "dc": 18,
      "condition": "surdo",
      "rounds": 10,
      "repete": true
     },
     {
      "nome": "Rugido",
      "tipo": "area",
      "shape": "raio",
      "areaFt": 500,
      "save": "con",
      "dc": 18,
      "damage": "8d10",
      "damageType": "trovejante",
      "halfOnSave": true,
      "condition": "caido",
      "rounds": 10,
      "repete": false
     }
    ]
   }
  ],
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Ataque de Garra",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Garra"
    },
    {
     "nome": "Teletransporte",
     "custo": 2,
     "tipo": "teleporte",
     "alcanceFt": 120
    },
    {
     "nome": "Conjurar Magia",
     "custo": 3,
     "tipo": "magia"
    }
   ]
  },
  "traits": [
   "t_inescrutavel",
   "armasMagicas",
   "acoesLendarias"
  ],
  "blurb": "Guardiã divina que rasga com as garras, conjura magias de clérigo como Golpe Flamejante e Banimento e ruge até três vezes por dia, com efeitos cada vez piores: medo, paralisia e por fim uma onda trovejante devastadora. Só armas mágicas a ferem de verdade.",
  "lore": "A androesfinge é uma sentinela com corpo de leão e cabeça humana, posta pelos deuses para guardar segredos, tesouros e passagens sagradas. Habita templos esquecidos e ruínas no deserto, onde testa a dignidade de quem se aproxima. Prefere desafiar visitantes com enigmas e provas antes de recorrer à força. Quando decide lutar, porém, seu rugido ecoa por centenas de metros e derruba até os mais corajosos."
 },
 "ankheg": {
  "id": "ankheg",
  "tipo": "monstruosidade",
  "name": "Ankheg",
  "nomeOriginal": "Ankheg",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 17,
   "dex": 11,
   "con": 13,
   "int": 1,
   "wis": 13,
   "cha": 6
  },
  "ac": 14,
  "acNote": "armadura natural (CA 11 enquanto caído)",
  "maxHp": 39,
  "hpDice": "6d10+6",
  "speedFt": 30,
  "speeds": {
   "burrowFt": 10
  },
  "senses": {
   "passivePerception": 11,
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
    "damage": "2d6+3",
    "type": "cortante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d6",
     "type": "ácido"
    },
    "onHit": {
     "semResistencia": true,
     "dc": 13,
     "escape": 13,
     "condition": "agarrado",
     "note": "é agarrado"
    }
   }
  ],
  "breath": {
   "name": "Jato de Ácido",
   "kind": "save",
   "shape": "linha",
   "areaFt": 30,
   "save": "dex",
   "dc": 13,
   "damage": "3d6",
   "damageType": "ácido",
   "halfOnSave": true,
   "origem": "sopro",
   "larguraFt": 5,
   "recharge": [
    6
   ]
  },
  "traits": [],
  "blurb": "Emboscador que irrompe do solo, prende a vítima nas mandíbulas e a dissolve com ácido; quando não está segurando ninguém, cospe uma linha de ácido que atinge vários alvos.",
  "lore": "O ankheg é um inseto gigantesco de muitas patas, com antenas sensíveis e mandíbulas capazes de partir árvores jovens. Cava túneis sinuosos sob campos e florestas e espera logo abaixo da superfície até sentir passos acima. Então salta da terra, agarra a presa e a tritura enquanto secreta enzimas ácidas que a digerem. Embora tire parte do sustento do próprio solo, precisa de carne fresca, o que o torna o terror de fazendeiros e patrulheiros. Seus túneis meio desabados costumam guardar cascas trocadas, ovos eclodidos e restos de vítimas com seus pertences."
 },
 "anquilossauro": {
  "id": "anquilossauro",
  "tipo": "fera",
  "name": "Anquilossauro",
  "nomeOriginal": "Ankylosaurus",
  "fonte": "MM",
  "size": "enorme",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 19,
   "dex": 11,
   "con": 15,
   "int": 2,
   "wis": 12,
   "cha": 5
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 68,
  "hpDice": "8d12+16",
  "speedFt": 30,
  "senses": {
   "passivePerception": 11
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Cauda",
    "bonus": 7,
    "damage": "4d6+4",
    "type": "concussão",
    "reachFt": 10,
    "onHit": {
     "save": "str",
     "dc": 14,
     "condition": "caido",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "traits": [],
  "blurb": "Um tanque blindado que gira a cauda em forma de clava contra quem chega perto, causando dano pesado e derrubando os alvos.",
  "lore": "O anquilossauro é um dinossauro herbívoro enorme, coberto de placas ósseas e espinhos que o protegem de predadores. Vive em campos e planícies abertas, pastando em pequenos grupos. Não costuma atacar sem motivo, mas reage com violência quando se sente ameaçado. Sua arma principal é a cauda terminada em uma massa óssea capaz de quebrar ossos."
 },
 "macaco": {
  "id": "macaco",
  "tipo": "fera",
  "name": "Macaco",
  "nomeOriginal": "Ape",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1/2",
  "xp": 100,
  "abilities": {
   "str": 16,
   "dex": 14,
   "con": 14,
   "int": 6,
   "wis": 12,
   "cha": 7
  },
  "ac": 12,
  "maxHp": 19,
  "hpDice": "3d8+6",
  "speedFt": 30,
  "speeds": {
   "climbFt": 30
  },
  "senses": {
   "passivePerception": 13
  },
  "saves": [],
  "skills": [
   "atletismo",
   "percepcao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Punho",
    "bonus": 5,
    "damage": "1d6+3",
    "type": "concussão",
    "reachFt": 5
   },
   {
    "name": "Pedra",
    "bonus": 5,
    "damage": "1d6+3",
    "type": "concussão",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 25,
    "longRangeFt": 50
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Punho",
    "Punho"
   ]
  },
  "traits": [],
  "blurb": "Golpeia duas vezes com os punhos em combate corpo a corpo e arremessa pedras em quem tenta manter distância. Escala com facilidade, alcançando alvos em árvores e rochedos.",
  "lore": "Grande primata das florestas, forte e ágil tanto no chão quanto nas copas. Vive em bandos que defendem seu território com gritos e ameaças antes de partir para a briga. Costuma atirar pedras e galhos em intrusos e só avança quando se sente encurralado ou quando o grupo está em perigo."
 },
 "arcanaloth": {
  "id": "arcanaloth",
  "tipo": "corruptor",
  "name": "Arcanaloth",
  "nomeOriginal": "Arcanaloth",
  "fonte": "MM",
  "size": "médio",
  "level": 9,
  "cr": "12",
  "xp": 8400,
  "abilities": {
   "str": 17,
   "dex": 12,
   "con": 14,
   "int": 20,
   "wis": 16,
   "cha": 17
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 104,
  "hpDice": "16d8+32",
  "speedFt": 30,
  "flyFt": 30,
  "speeds": {
   "flyFt": 30
  },
  "senses": {
   "passivePerception": 17,
   "truesightFt": 120
  },
  "saves": [
   "dex",
   "int",
   "wis",
   "cha"
  ],
  "skills": [
   "arcanismo",
   "enganacao",
   "intuicao",
   "percepcao"
  ],
  "expertise": [
   "arcanismo",
   "enganacao",
   "intuicao"
  ],
  "damageResistances": [
   "frio",
   "fogo",
   "elétrico",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "damageImmunities": [
   "ácido",
   "veneno"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Garras",
    "bonus": 7,
    "damage": "2d4+3",
    "type": "cortante",
    "reachFt": 5,
    "onHit": {
     "save": "con",
     "dc": 14,
     "danoSeFalhar": {
      "damage": "3d6",
      "type": "veneno"
     },
     "metadeSePassar": true
    }
   }
  ],
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "alterarAparencia",
    "escuridao",
    "calorNoMetal",
    "invisibilidade",
    "misselMagico"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "aVontade": [
    "alterarAparencia",
    "escuridao",
    "calorNoMetal",
    "invisibilidade",
    "misselMagico"
   ],
   "cdPorMagia": {
    "alterarAparencia": 15,
    "escuridao": 15,
    "calorNoMetal": 15,
    "invisibilidade": 15,
    "misselMagico": 15
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Teletransporte",
    "tipo": "teleporte",
    "alcanceFt": 60
   }
  ],
  "traits": [
   "resistenciaAMagia",
   "armasMagicas"
  ],
  "blurb": "Conjurador de 16º nível com bola de fogo, relâmpago em cadeia e dedo da morte, que se teletransporta para fugir do corpo a corpo. Suas garras envenenam e ele resiste à maioria das magias.",
  "lore": "Os arcanaloths são yugoloths de cabeça de chacal que atuam como escribas, negociadores e contadores da sua raça mercenária. Vivem nos planos inferiores, sobretudo no Gehenna, mas viajam a serviço de quem pagar bem. Ardilosos e eruditos, colecionam segredos e contratos, e preferem manipular a lutar. Quando o combate é inevitável, recorrem a magia devastadora e a ilusões para confundir os inimigos."
 },
 "arquimago": {
  "id": "arquimago",
  "tipo": "humanoide",
  "name": "Arquimago",
  "nomeOriginal": "Archmage",
  "fonte": "MM",
  "size": "médio",
  "level": 9,
  "cr": "12",
  "xp": 8400,
  "abilities": {
   "str": 10,
   "dex": 14,
   "con": 12,
   "int": 20,
   "wis": 15,
   "cha": 16
  },
  "ac": 12,
  "acNote": "15 com armadura arcana",
  "maxHp": 99,
  "hpDice": "18d8+18",
  "speedFt": 30,
  "senses": {
   "passivePerception": 12
  },
  "saves": [
   "int",
   "wis"
  ],
  "skills": [
   "arcanismo",
   "historia"
  ],
  "expertise": [
   "arcanismo",
   "historia"
  ],
  "damageResistances": [
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Adaga",
    "bonus": 6,
    "damage": "1d4+2",
    "type": "perfurante",
    "reachFt": 5,
    "rangeFt": 20,
    "longRangeFt": 60
   }
  ],
  "spellcasting": {
   "ability": "int",
   "cantrips": [
    "raioDeFogo",
    "luz",
    "maoMagica",
    "prestidigitacao",
    "toqueChocante"
   ],
   "prepared": [
    "detectarMagia",
    "identificar",
    "armaduraArcana",
    "misselMagico",
    "detectarPensamentos",
    "imagemEspelhada",
    "passoNebuloso",
    "contramagia",
    "voo",
    "relampago",
    "banimento",
    "escudoDeFogo",
    "peleDePedra",
    "coneDeFrio",
    "videncia",
    "muralhaDeForca",
    "globoDeInvulnerabilidade",
    "teletransporte",
    "limparAMente",
    "pararOTempo",
    "disfarcarSe",
    "invisibilidade"
   ],
   "slots": [
    0,
    4,
    3,
    3,
    3,
    3,
    1,
    1,
    1,
    1
   ],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "aVontade": [
    "disfarcarSe",
    "invisibilidade"
   ],
   "cdPorMagia": {
    "raioDeFogo": 17,
    "luz": 17,
    "maoMagica": 17,
    "prestidigitacao": 17,
    "toqueChocante": 17,
    "detectarMagia": 17,
    "identificar": 17,
    "armaduraArcana": 17,
    "misselMagico": 17,
    "detectarPensamentos": 17,
    "imagemEspelhada": 17,
    "passoNebuloso": 17,
    "contramagia": 17,
    "voo": 17,
    "relampago": 17,
    "banimento": 17,
    "escudoDeFogo": 17,
    "peleDePedra": 17,
    "coneDeFrio": 17,
    "videncia": 17,
    "muralhaDeForca": 17,
    "globoDeInvulnerabilidade": 17,
    "teletransporte": 17,
    "limparAMente": 17,
    "pararOTempo": 17,
    "disfarcarSe": 17,
    "invisibilidade": 17
   }
  },
  "traits": [
   "resistenciaAMagia"
  ],
  "blurb": "Conjurador de 18º nível que entra em combate já protegido por pele de pedra e mente vazia, e controla o campo com muralha de energia, contramágica, cone de frio e até parada temporal. Resiste a dano de magias e tem vantagem contra efeitos mágicos.",
  "lore": "O arquimago é um estudioso das artes arcanas que dedicou décadas, às vezes uma vida inteira, a dominar a magia. Os bondosos servem de conselheiros a monarcas, e os cruéis governam pelo medo e buscam se tornar liches. Os que não pendem para nenhum lado se isolam em torres distantes para pesquisar em paz. Costumam ter aprendizes, e suas moradas são protegidas por guardiões e barreiras mágicas contra intrusos."
 },
 "assassino": {
  "id": "assassino",
  "tipo": "humanoide",
  "name": "Assassino",
  "nomeOriginal": "Assassin",
  "fonte": "MM",
  "size": "médio",
  "level": 5,
  "cr": "8",
  "xp": 3900,
  "abilities": {
   "str": 11,
   "dex": 16,
   "con": 14,
   "int": 13,
   "wis": 11,
   "cha": 10
  },
  "ac": 15,
  "acNote": "couro batido",
  "maxHp": 78,
  "hpDice": "12d8+24",
  "speedFt": 30,
  "senses": {
   "passivePerception": 13
  },
  "saves": [
   "dex",
   "int"
  ],
  "skills": [
   "acrobacia",
   "enganacao",
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "furtividade"
  ],
  "damageResistances": [
   "veneno"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Espada Curta",
    "bonus": 6,
    "damage": "1d6+3",
    "type": "perfurante",
    "reachFt": 5,
    "onHit": {
     "save": "con",
     "dc": 15,
     "danoSeFalhar": {
      "damage": "7d6",
      "type": "veneno"
     },
     "metadeSePassar": true
    }
   },
   {
    "name": "Besta Leve",
    "bonus": 6,
    "damage": "1d8+3",
    "type": "perfurante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 80,
    "longRangeFt": 320,
    "onHit": {
     "save": "con",
     "dc": 15,
     "danoSeFalhar": {
      "damage": "7d6",
      "type": "veneno"
     },
     "metadeSePassar": true
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Espada Curta",
    "Espada Curta"
   ]
  },
  "features": [
   "evasion",
   "sneakAttack"
  ],
  "sneakAttack": "4d6",
  "traits": [
   "assassinar"
  ],
  "blurb": "Ataca primeiro e das sombras: no primeiro turno tem vantagem e acerta críticos em alvos surpresos, somando ataque furtivo e lâminas envenenadas que causam dano de veneno pesado.",
  "lore": "Assassinos são matadores profissionais, frios e sem remorso, que dominam o uso de venenos. Vendem seus serviços a quem puder pagar, de nobres e mestres de guilda a reis. Costumam agir nas cidades, misturando-se à multidão até o momento do golpe. Preferem emboscadas cuidadosamente planejadas a combates abertos."
 },
 "arbustoDesperto": {
  "id": "arbustoDesperto",
  "tipo": "planta",
  "name": "Arbusto Desperto",
  "nomeOriginal": "Awakened Shrub",
  "fonte": "MM",
  "size": "pequeno",
  "level": 1,
  "cr": "0",
  "xp": 10,
  "abilities": {
   "str": 3,
   "dex": 8,
   "con": 11,
   "int": 10,
   "wis": 10,
   "cha": 6
  },
  "ac": 9,
  "maxHp": 10,
  "hpDice": "3d6",
  "speedFt": 20,
  "senses": {
   "passivePerception": 10
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "perfurante"
  ],
  "damageVulnerabilities": [
   "fogo"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Arranhão",
    "bonus": 1,
    "damage": "1d4-1",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "traits": [
   "aparenciaFalsa"
  ],
  "blurb": "Um arbusto frágil e lento que arranha com galhos secos; quase inofensivo, mas pode passar despercebido entre a vegetação até atacar. Muito vulnerável a fogo.",
  "lore": "É uma planta comum que ganhou consciência e a capacidade de se mover graças à magia despertar ou a um efeito parecido. Costuma servir a quem a despertou, falando o idioma dessa pessoa. Vive em florestas e jardins, onde se confunde com a vegetação ao redor. Sozinho representa pouca ameaça, mas em grupo pode incomodar viajantes desatentos."
 },
 "arvoreDesperta": {
  "id": "arvoreDesperta",
  "tipo": "planta",
  "name": "Árvore Desperta",
  "nomeOriginal": "Awakened Tree",
  "fonte": "MM",
  "size": "enorme",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 19,
   "dex": 6,
   "con": 15,
   "int": 10,
   "wis": 10,
   "cha": 7
  },
  "ac": 13,
  "acNote": "armadura natural",
  "maxHp": 59,
  "hpDice": "7d12+14",
  "speedFt": 20,
  "senses": {
   "passivePerception": 10
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "concussão",
   "perfurante"
  ],
  "damageVulnerabilities": [
   "fogo"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Pancada",
    "bonus": 6,
    "damage": "3d6+4",
    "type": "concussão",
    "reachFt": 10
   }
  ],
  "traits": [
   "aparenciaFalsa"
  ],
  "blurb": "Gigante lenta que golpeia com galhos pesados a até 3 metros de distância. Resiste a golpes de concussão e perfurantes, mas queima fácil com fogo.",
  "lore": "É uma árvore comum que ganhou consciência e a capacidade de se mover graças à magia de despertar ou a um encanto parecido. Costuma servir de guardiã para o druida ou conjurador que a despertou e fala apenas a língua dele. Vive em florestas, onde se confunde com as árvores ao redor até decidir agir. Mesmo pensante, mantém a paciência e a lentidão de uma planta."
 },
 "bicoDeMachado": {
  "id": "bicoDeMachado",
  "tipo": "fera",
  "name": "Bico-de-Machado",
  "nomeOriginal": "Axe Beak",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 14,
   "dex": 12,
   "con": 12,
   "int": 2,
   "wis": 10,
   "cha": 5
  },
  "ac": 11,
  "maxHp": 19,
  "hpDice": "3d10+3",
  "speedFt": 50,
  "senses": {
   "passivePerception": 10
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Bico",
    "bonus": 4,
    "damage": "1d8+2",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "traits": [],
  "blurb": "Ave grande e veloz que corre até o alvo e golpeia com o bico em forma de cunha, causando dano cortante. Seu deslocamento de 15 m permite alcançar quase qualquer inimigo no tabuleiro.",
  "lore": "O bico-de-machado é uma ave alta que não voa, sustentada por pernas musculosas e armada com um bico pesado e afiado. Habita campos abertos e colinas, onde corre em grande velocidade. Tem temperamento agressivo e costuma investir contra qualquer criatura estranha que se aproxime demais. Viajantes às vezes a domesticam como montaria ou animal de carga, apesar do gênio difícil."
 },
 "azer": {
  "id": "azer",
  "tipo": "elemental",
  "name": "Azer",
  "nomeOriginal": "Azer",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 17,
   "dex": 12,
   "con": 15,
   "int": 12,
   "wis": 13,
   "cha": 10
  },
  "ac": 17,
  "acNote": "armadura natural e escudo",
  "maxHp": 39,
  "hpDice": "6d8+12",
  "speedFt": 30,
  "senses": {
   "passivePerception": 11
  },
  "saves": [
   "con"
  ],
  "skills": [],
  "expertise": [],
  "damageImmunities": [
   "fogo",
   "veneno"
  ],
  "conditionImmunities": [
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Martelo de Guerra",
    "bonus": 5,
    "damage": "1d8+3",
    "type": "concussão",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d10+3",
     "type": "concussão"
    }
   }
  ],
  "corpoQuente": {
   "damage": "1d10",
   "type": "fogo"
  },
  "luzPropria": {
   "claro": 10,
   "penumbra": 10
  },
  "traits": [
   "corpoQuente"
  ],
  "blurb": "Guerreiro de bronze e chamas que golpeia com martelo de guerra incandescente, somando dano de fogo a cada acerto. Quem o toca ou o ataca corpo a corpo de perto também se queima.",
  "lore": "Os azers vêm do Plano Elemental do Fogo e parecem anões de pele metálica com barba e cabelos em chamas, mas por dentro são puro fogo. Não nascem: cada um é moldado em bronze por outro azer, que lhe cede parte da própria chama, por isso são raros. Vivem num reino de montanhas e vulcões entre os planos do Fogo e da Terra, onde mineram metais e gemas e repelem as salamandras enviadas pelos efreets, antigos aliados que os traíram após a construção da Cidade de Bronze. Artesãos incomparáveis, às vezes são invocados ao Plano Material para forjar itens mágicos, e não precisam comer, beber nem dormir."
 },
 "babuino": {
  "id": "babuino",
  "tipo": "fera",
  "name": "Babuíno",
  "nomeOriginal": "Baboon",
  "fonte": "MM",
  "size": "pequeno",
  "level": 1,
  "cr": "0",
  "xp": 10,
  "abilities": {
   "str": 8,
   "dex": 14,
   "con": 11,
   "int": 4,
   "wis": 12,
   "cha": 6
  },
  "ac": 12,
  "maxHp": 3,
  "hpDice": "1d6",
  "speedFt": 30,
  "speeds": {
   "climbFt": 30
  },
  "senses": {
   "passivePerception": 11
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 1,
    "damage": "1d4-1",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "traits": [
   "packTactics"
  ],
  "blurb": "Fraco sozinho, o babuíno ataca em bando e ganha vantagem nas mordidas quando um aliado está ao lado do alvo.",
  "lore": "O babuíno é um primata ágil e barulhento que vive em bandos nas florestas e colinas. Sobe em árvores e rochas com facilidade e usa a altura para vigiar o território. Costuma evitar criaturas maiores, mas o grupo inteiro reage com agressividade quando se sente ameaçado. Às vezes é adotado como familiar por conjuradores."
 },
 "texugo": {
  "id": "texugo",
  "tipo": "fera",
  "name": "Texugo",
  "nomeOriginal": "Badger",
  "fonte": "MM",
  "size": "miúdo",
  "level": 1,
  "cr": "0",
  "xp": 10,
  "abilities": {
   "str": 4,
   "dex": 11,
   "con": 12,
   "int": 2,
   "wis": 12,
   "cha": 5
  },
  "ac": 10,
  "maxHp": 3,
  "hpDice": "1d4+1",
  "speedFt": 20,
  "speeds": {
   "burrowFt": 5
  },
  "senses": {
   "passivePerception": 11,
   "darkvisionFt": 30
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 2,
    "damage": 1,
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "traits": [
   "keenSmell"
  ],
  "blurb": "Um animal pequeno e teimoso que morde quem chega perto; quase inofensivo sozinho, mas difícil de surpreender graças ao faro.",
  "lore": "O texugo é um mamífero pequeno e atarracado que vive em florestas e campos, escavando tocas na terra. Passa boa parte do tempo farejando o solo atrás de raízes, insetos e pequenos animais. Costuma evitar encrencas, mas quando se sente encurralado reage com mordidas ferozes. Também pode servir de familiar para conjuradores."
 },
 "balor": {
  "id": "balor",
  "tipo": "corruptor",
  "name": "Balor",
  "nomeOriginal": "Balor",
  "fonte": "MM",
  "size": "enorme",
  "level": 17,
  "cr": "19",
  "xp": 22000,
  "abilities": {
   "str": 26,
   "dex": 15,
   "con": 22,
   "int": 20,
   "wis": 16,
   "cha": 22
  },
  "ac": 19,
  "acNote": "armadura natural",
  "maxHp": 262,
  "hpDice": "21d12+126",
  "speedFt": 40,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80
  },
  "senses": {
   "passivePerception": 13,
   "truesightFt": 120
  },
  "saves": [
   "str",
   "con",
   "wis",
   "cha"
  ],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "frio",
   "elétrico",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "damageImmunities": [
   "fogo",
   "veneno"
  ],
  "conditionImmunities": [
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Espada Longa",
    "bonus": 14,
    "damage": "3d8+8",
    "type": "cortante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "3d8",
     "type": "elétrico"
    }
   },
   {
    "name": "Chicote",
    "bonus": 14,
    "damage": "2d6+8",
    "type": "cortante",
    "reachFt": 30,
    "onHit": {
     "save": "str",
     "dc": 20,
     "danoSeFalhar": {
      "damage": "3d6",
      "type": "fogo"
     },
     "metadeSePassar": false
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Espada Longa",
    "Chicote"
   ]
  },
  "acoesEspeciais": [
   {
    "nome": "Teletransporte",
    "tipo": "teleporte",
    "alcanceFt": 120
   }
  ],
  "explosaoAoMorrer": {
   "pes": 30,
   "save": "dex",
   "dc": 20,
   "dano": "20d6",
   "tipo": "fogo",
   "metade": true
  },
  "aura": {
   "raioFt": 5,
   "quando": "inicioDoDono",
   "damage": "3d6",
   "damageType": "fogo"
  },
  "corpoQuente": {
   "damage": "3d6",
   "type": "fogo"
  },
  "traits": [
   "explosaoAoMorrer",
   "aura",
   "resistenciaAMagia",
   "armasMagicas"
  ],
  "blurb": "Avança envolto em chamas, puxa alvos distantes com o chicote flamejante e os corta com uma espada elétrica. Ficar colado nele queima, e matá-lo provoca uma explosão devastadora.",
  "lore": "O balor é um dos demônios mais poderosos do Abismo, um general brutal que comanda hordas de demônios menores. Tem forma gigantesca, asas enormes e o corpo cercado de fogo. Serve aos senhores demônios e só respeita a força. Nos campos de batalha, procura os inimigos mais fortes para provar seu domínio, e mesmo derrotado leva os oponentes consigo numa erupção de chamas."
 },
 "diaboFarpado": {
  "id": "diaboFarpado",
  "tipo": "corruptor",
  "name": "Diabo Farpado",
  "nomeOriginal": "Barbed Devil",
  "fonte": "MM",
  "size": "médio",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 16,
   "dex": 17,
   "con": 18,
   "int": 12,
   "wis": 14,
   "cha": 14
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 110,
  "hpDice": "13d8+52",
  "speedFt": 30,
  "senses": {
   "passivePerception": 18,
   "darkvisionFt": 120
  },
  "saves": [
   "str",
   "con",
   "wis",
   "cha"
  ],
  "skills": [
   "enganacao",
   "intuicao",
   "percepcao"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageResistances": [
   "frio",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "damageImmunities": [
   "fogo",
   "veneno"
  ],
  "conditionImmunities": [
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Garra",
    "bonus": 6,
    "damage": "1d6+3",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Cauda",
    "bonus": 6,
    "damage": "2d6+3",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Arremessar Chamas",
    "bonus": 5,
    "damage": "3d6",
    "type": "fogo",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 150,
    "longRangeFt": 150
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Garra",
    "Garra",
    "Cauda"
   ]
  },
  "espinhos": {
   "dano": "1d10",
   "tipo": "perfurante"
  },
  "features": [
   "devilsSight"
  ],
  "traits": [
   "espinhos",
   "resistenciaAMagia"
  ],
  "blurb": "Combina garras e cauda em três golpes por turno ou arremessa duas chamas à distância. Quem tenta agarrá-lo se fere nos espinhos do corpo.",
  "lore": "O diabo farpado é um guerreiro dos Nove Infernos, coberto de espinhos afiados da cabeça à cauda. Costuma servir como guarda e sentinela de diabos mais poderosos, vigiando tesouros e prisioneiros com atenção incansável. É ganancioso e cobiça objetos de valor, o que às vezes o distrai. Em combate, prefere cercar o inimigo e atacar sem trégua."
 },
 "barlgura": {
  "id": "barlgura",
  "tipo": "corruptor",
  "name": "Barlgura",
  "nomeOriginal": "Barlgura",
  "fonte": "MM",
  "size": "grande",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 18,
   "dex": 15,
   "con": 16,
   "int": 7,
   "wis": 14,
   "cha": 9
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 68,
  "hpDice": "8d10+24",
  "speedFt": 40,
  "speeds": {
   "climbFt": 40
  },
  "senses": {
   "passivePerception": 15,
   "blindsightFt": 30,
   "darkvisionFt": 120
  },
  "saves": [
   "dex",
   "con"
  ],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "damageResistances": [
   "frio",
   "fogo",
   "elétrico"
  ],
  "damageImmunities": [
   "veneno"
  ],
  "conditionImmunities": [
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 7,
    "damage": "2d6+4",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Soco",
    "bonus": 7,
    "damage": "1d10+4",
    "type": "concussão",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida",
    "Soco",
    "Soco"
   ]
  },
  "spellcasting": {
   "ability": "wis",
   "cantrips": [],
   "prepared": [
    "emaranhar",
    "forcaFantasmagorica",
    "disfarcarSe",
    "invisibilidade"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "emaranhar": 1,
    "forcaFantasmagorica": 1,
    "disfarcarSe": 2,
    "invisibilidade": 2
   },
   "cdPorMagia": {
    "emaranhar": 13,
    "forcaFantasmagorica": 13,
    "disfarcarSe": 13,
    "invisibilidade": 13
   }
  },
  "traits": [
   "imprudente",
   "t_saltoComImpulso"
  ],
  "blurb": "Demônio simiesco que salta de longe sobre a presa e a esmurra com dois punhos e uma mordida a cada turno. Pode atacar de forma imprudente para ganhar vantagem, e usa magia para se esconder ou prender alvos em vinhas.",
  "lore": "O barlgura é um demônio do Abismo com aparência de um grande símio brutal, de pelagem áspera e presas salientes. Vagueia em bandos pelas regiões selvagens e caóticas dos planos inferiores, caçando o que encontrar. Apesar da pouca inteligência, sabe ficar invisível ou disfarçado para emboscar as vítimas. Quando chega ao Plano Material, costuma se refugiar em florestas e ruínas, de onde salta para atacar."
 },
 "basilisco": {
  "id": "basilisco",
  "tipo": "monstruosidade",
  "name": "Basilisco",
  "nomeOriginal": "Basilisk",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 16,
   "dex": 8,
   "con": 15,
   "int": 2,
   "wis": 8,
   "cha": 7
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 52,
  "hpDice": "8d8+16",
  "speedFt": 20,
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
    "name": "Mordida",
    "bonus": 5,
    "damage": "2d6+3",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "2d6",
     "type": "veneno"
    }
   }
  ],
  "olharCd": 12,
  "traits": [
   "olharPetrificante"
  ],
  "blurb": "Lento e pesado, o basilisco transforma em pedra quem cruza seu olhar a até 9 m e depois tritura a vítima com mordidas venenosas. Desviar os olhos protege, mas deixa você lutando às cegas contra ele.",
  "lore": "O basilisco é um predador reptiliano que se adapta a climas secos, temperados ou tropicais, e costuma fazer toca em cavernas e passagens subterrâneas. Como é vagaroso demais para perseguir presas, ele simplesmente as encara até virarem pedra porosa, que suas mandíbulas conseguem roer e digerir. Estátuas de animais com pedaços arrancados são o sinal clássico de que um deles está por perto. Filhotes criados em cativeiro podem ser treinados como guardiões, por isso seus ovos valem muito, e alquimistas extraem de sua goela um óleo capaz de desfazer a petrificação."
 },
 "diaboBarbado": {
  "id": "diaboBarbado",
  "tipo": "corruptor",
  "name": "Diabo Barbado",
  "nomeOriginal": "Bearded Devil",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 16,
   "dex": 15,
   "con": 15,
   "int": 9,
   "wis": 11,
   "cha": 11
  },
  "ac": 13,
  "acNote": "armadura natural",
  "maxHp": 52,
  "hpDice": "8d8+16",
  "speedFt": 30,
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 120
  },
  "saves": [
   "str",
   "con",
   "wis"
  ],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "frio",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "damageImmunities": [
   "fogo",
   "veneno"
  ],
  "conditionImmunities": [
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Barba",
    "bonus": 5,
    "damage": "1d8+2",
    "type": "perfurante",
    "reachFt": 5,
    "onHit": {
     "save": "con",
     "dc": 12,
     "condition": "envenenado",
     "rounds": 10,
     "repete": true
    }
   },
   {
    "name": "Glaive",
    "bonus": 5,
    "damage": "1d10+3",
    "type": "cortante",
    "reachFt": 10
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Barba",
    "Glaive"
   ]
  },
  "features": [
   "devilsSight"
  ],
  "traits": [
   "resistenciaAMagia",
   "bravura"
  ],
  "blurb": "Combina a barba venenosa, que impede a cura do alvo, com uma glaive de alcance longo que abre feridas infernais cada vez piores. Resiste a magia e não se amedronta perto de aliados.",
  "lore": "O diabo barbado é um soldado de choque dos Nove Infernos, servindo como tropa de elite a diabos mais poderosos. Sua barba de espinhos cobertos de veneno e sua glaive serrilhada são marcas de sua brutalidade. Luta com disciplina feroz e ganha coragem quando combate ao lado de companheiros. Obedece cegamente à hierarquia infernal e se deleita em ferir quem cruza seu caminho."
 },
 "behir": {
  "id": "behir",
  "tipo": "monstruosidade",
  "name": "Behir",
  "nomeOriginal": "Behir",
  "fonte": "MM",
  "size": "enorme",
  "level": 9,
  "cr": "11",
  "xp": 7200,
  "abilities": {
   "str": 23,
   "dex": 16,
   "con": 18,
   "int": 7,
   "wis": 14,
   "cha": 12
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 168,
  "hpDice": "16d12+64",
  "speedFt": 50,
  "speeds": {
   "climbFt": 40
  },
  "senses": {
   "passivePerception": 16,
   "darkvisionFt": 90
  },
  "saves": [],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "damageImmunities": [
   "elétrico"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 10,
    "damage": "3d10+6",
    "type": "perfurante",
    "reachFt": 10
   },
   {
    "name": "Constrição",
    "bonus": 10,
    "damage": "2d10+6",
    "type": "concussão",
    "reachFt": 5,
    "danoExtra": {
     "damage": "2d10+6",
     "type": "cortante"
    },
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
   "count": 2
  },
  "breath": {
   "name": "Sopro Elétrico",
   "kind": "save",
   "shape": "linha",
   "areaFt": 20,
   "save": "dex",
   "dc": 16,
   "damage": "12d10",
   "damageType": "elétrico",
   "halfOnSave": true,
   "origem": "sopro",
   "larguraFt": 5,
   "recharge": [
    5,
    6
   ]
  },
  "acoesEspeciais": [
   {
    "nome": "Engolir",
    "tipo": "engolir",
    "tamanhoMax": "medium",
    "dano": "6d6",
    "tipoDano": "ácido",
    "regurgita": {
     "dano": 30,
     "dc": 14
    }
   }
  ],
  "traits": [],
  "blurb": "Serpente de muitas patas que morde, enrola e esmaga a presa, podendo engoli-la viva. Seu sopro elétrico em linha causa dano devastador a quem estiver no caminho.",
  "lore": "O behir é um predador serpentino de escamas azuis, com corpo que lembra um cruzamento de centopeia e crocodilo. Vive no Subterrâneo, em covis de acesso perigoso, como poços profundos, cavernas altas em penhascos ou túneis estreitos, onde arma emboscadas. Engole as vítimas inteiras e depois fica adormecido, escondido, enquanto digere. Criado por gigantes das tempestades como arma na antiga guerra contra os dragões, odeia dragões e luta para expulsar qualquer um que se instale perto de seu território."
 },
 "observador": {
  "id": "observador",
  "tipo": "aberração",
  "name": "Observador",
  "nomeOriginal": "Beholder",
  "fonte": "MM",
  "size": "grande",
  "level": 13,
  "cr": "13",
  "xp": 10000,
  "abilities": {
   "str": 10,
   "dex": 14,
   "con": 18,
   "int": 17,
   "wis": 15,
   "cha": 17
  },
  "ac": 18,
  "acNote": "armadura natural",
  "maxHp": 180,
  "hpDice": "19d10+76",
  "speedFt": 0,
  "flyFt": 20,
  "hover": true,
  "speeds": {
   "flyFt": 20
  },
  "senses": {
   "passivePerception": 22,
   "darkvisionFt": 120
  },
  "saves": [
   "int",
   "wis",
   "cha"
  ],
  "skills": [
   "percepcao"
  ],
  "expertise": [
   "percepcao"
  ],
  "conditionImmunities": [
   "caido"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 5,
    "damage": "4d6",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "raiosOculares": {
   "n": 3,
   "alcanceFt": 120,
   "aoAcaso": true,
   "raios": [
    {
     "nome": "Raio Enfeitiçante",
     "save": "wis",
     "dc": 16,
     "condition": "enfeiticado",
     "rounds": 100,
     "repete": false
    },
    {
     "nome": "Raio Paralisante",
     "save": "con",
     "dc": 16,
     "condition": "paralisado",
     "rounds": 10,
     "repete": true
    },
    {
     "nome": "Raio do Medo",
     "save": "wis",
     "dc": 16,
     "condition": "amedrontado",
     "rounds": 10,
     "repete": true
    },
    {
     "nome": "Raio Lento",
     "save": "dex",
     "dc": 16
    },
    {
     "nome": "Raio Enervante",
     "save": "con",
     "dc": 16,
     "damage": "8d8",
     "damageType": "necrótico",
     "halfOnSave": true
    },
    {
     "nome": "Raio Telecinético",
     "save": "str",
     "dc": 16,
     "efeito": "telecinese"
    },
    {
     "nome": "Raio do Sono",
     "save": "wis",
     "dc": 16,
     "efeito": "sono"
    },
    {
     "nome": "Raio Petrificante",
     "save": "dex",
     "dc": 16,
     "efeito": "petrificar"
    },
    {
     "nome": "Raio Desintegrador",
     "save": "dex",
     "dc": 16,
     "damage": "10d8",
     "damageType": "energético",
     "halfOnSave": false,
     "efeito": "desintegrar"
    },
    {
     "nome": "Raio da Morte",
     "save": "dex",
     "dc": 16,
     "damage": "10d10",
     "damageType": "necrótico",
     "halfOnSave": false,
     "efeito": "morte"
    }
   ]
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Raio Ocular",
     "custo": 1,
     "tipo": "raio"
    }
   ]
  },
  "traits": [
   "raiosOculares",
   "coneAntimagia",
   "acoesLendarias"
  ],
  "blurb": "Flutua fora de alcance e dispara três raios oculares aleatórios por turno, além de mais raios como ações lendárias, que podem petrificar, desintegrar ou matar na hora. Seu olho central anula magia num cone enorme, então conjuradores precisam se posicionar com cuidado.",
  "lore": "O observador é uma aberração esférica e flutuante, com uma boca cheia de dentes, um grande olho central e vários olhos menores em pedúnculos. Arrogante e paranoico, despreza todas as outras criaturas e até outros observadores, pois cada um se considera a forma perfeita da espécie. Costuma se isolar em cavernas profundas, ruínas ou colinas geladas, escavando com seu raio desintegrador covis de câmaras verticais onde só ele se move com facilidade. Alguns se tornam tiranos e dominam impérios de servos. Enche o covil de troféus, como aventureiros petrificados e itens mágicos, e nunca abre mão deles."
 },
 "observadorZumbi": {
  "id": "observadorZumbi",
  "tipo": "morto-vivo",
  "name": "Observador Zumbi",
  "nomeOriginal": "Beholder Zombie",
  "fonte": "MM",
  "size": "grande",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 10,
   "dex": 8,
   "con": 16,
   "int": 3,
   "wis": 8,
   "cha": 5
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 93,
  "hpDice": "11d10+33",
  "speedFt": 0,
  "flyFt": 20,
  "hover": true,
  "speeds": {
   "flyFt": 20
  },
  "senses": {
   "passivePerception": 9,
   "darkvisionFt": 60
  },
  "saves": [
   "wis"
  ],
  "skills": [],
  "expertise": [],
  "damageImmunities": [
   "veneno"
  ],
  "conditionImmunities": [
   "envenenado",
   "caido"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 3,
    "damage": "4d6",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "breath": {
   "name": "Raio Ocular",
   "kind": "save",
   "shape": "cube",
   "areaFt": 10,
   "save": "con",
   "dc": 14,
   "damage": "8d8",
   "damageType": "necrótico",
   "halfOnSave": true,
   "origem": "sopro"
  },
  "traits": [
   "undeadFortitude"
  ],
  "blurb": "Flutua lentamente e dispara um raio ocular aleatório a até 18 m, que pode paralisar, amedrontar, drenar vida ou desintegrar. De perto, morde com força e resiste a cair graças à fortitude morta-viva.",
  "lore": "É o cadáver reanimado de um observador, geralmente erguido por um necromante ou por outro observador que deseja servos. Perdeu quase toda a inteligência e a maior parte dos olhos funcionais, restando apenas alguns que ainda disparam raios de forma descontrolada. Vaga pelo Subterrâneo guardando covis e obedecendo a quem o controla. Entende a Língua Profunda e o Subcomum, mas não consegue falar."
 },
 "berserker": {
  "id": "berserker",
  "tipo": "humanoide",
  "name": "Berserker",
  "nomeOriginal": "Berserker",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 16,
   "dex": 12,
   "con": 17,
   "int": 9,
   "wis": 11,
   "cha": 9
  },
  "ac": 13,
  "acNote": "armadura de peles",
  "maxHp": 67,
  "hpDice": "9d8+27",
  "speedFt": 30,
  "senses": {
   "passivePerception": 10
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Machado Grande",
    "bonus": 5,
    "damage": "1d12+3",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "traits": [
   "imprudente"
  ],
  "blurb": "Guerreiro feroz que avança com um machado grande e pode se atirar sem cautela ao combate, ganhando vantagem nos ataques ao custo de ficar exposto. Cada golpe acerta pesado, e ele aguenta bastante castigo.",
  "lore": "Berserkers vêm de terras selvagens, longe de cidades e leis. Reúnem-se em bandos de guerra e vagam em busca de qualquer briga que apareça. São imprevisíveis e movidos pela fúria, preferindo o choque direto a qualquer estratégia. Podem surgir em costas, montanhas, florestas, desertos ou no gelo do norte."
 },
 "filhoteDeDragaoNegro": {
  "id": "filhoteDeDragaoNegro",
  "tipo": "dragão",
  "name": "Filhote de Dragão Negro",
  "nomeOriginal": "Black Dragon Wyrmling",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 15,
   "dex": 14,
   "con": 13,
   "int": 10,
   "wis": 11,
   "cha": 13
  },
  "ac": 17,
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
   "passivePerception": 14,
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
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "ácido"
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
     "type": "ácido"
    }
   }
  ],
  "breath": {
   "name": "Sopro Ácido",
   "kind": "save",
   "shape": "linha",
   "areaFt": 15,
   "save": "dex",
   "dc": 11,
   "damage": "5d8",
   "damageType": "ácido",
   "halfOnSave": true,
   "origem": "sopro",
   "larguraFt": 5,
   "recharge": [
    5,
    6
   ]
  },
  "traits": [],
  "blurb": "Ataca com mordidas ácidas e cospe uma linha de ácido corrosivo que derrete quem estiver no caminho. Voa rápido e nada bem, emboscando a partir da água.",
  "lore": "O filhote de dragão negro é a forma mais jovem desse dragão cromático cruel, que gosta de pântanos e ruínas alagadas. Mesmo pequeno, já é maldoso e sente prazer em ver a presa sofrer. Esconde-se sob águas escuras e salta sobre viajantes desatentos. Começa cedo a juntar seu tesouro e defende o covil com fúria."
 },
 "pudimNegro": {
  "id": "pudimNegro",
  "tipo": "gosma",
  "name": "Pudim Negro",
  "nomeOriginal": "Black Pudding",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "4",
  "xp": 1100,
  "abilities": {
   "str": 16,
   "dex": 5,
   "con": 16,
   "int": 1,
   "wis": 6,
   "cha": 1
  },
  "ac": 7,
  "maxHp": 85,
  "hpDice": "10d10+30",
  "speedFt": 20,
  "speeds": {
   "climbFt": 20
  },
  "senses": {
   "passivePerception": 8,
   "blindsightFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "damageImmunities": [
   "ácido",
   "frio",
   "elétrico",
   "cortante"
  ],
  "conditionImmunities": [
   "cego",
   "enfeitiçado",
   "surdo",
   "exausto",
   "amedrontado",
   "caido"
  ],
  "attacks": [
   {
    "name": "Pseudópode",
    "bonus": 5,
    "damage": "1d6+3",
    "type": "concussão",
    "reachFt": 5,
    "danoExtra": {
     "damage": "4d8",
     "type": "ácido"
    }
   }
  ],
  "features": [
   "corroeMadeira"
  ],
  "corpoQuente": {
   "damage": "1d8",
   "type": "ácido"
  },
  "traits": [
   "amorfo",
   "corroiArma",
   "spiderClimb",
   "divisao"
  ],
  "blurb": "Massa ácida lenta que dissolve armaduras e armas a cada contato; golpes cortantes ou elétricos apenas a dividem em mais pudins.",
  "lore": "O pudim negro é uma gosma escura e viscosa que rasteja pelos túneis do Subterrâneo em busca de qualquer coisa orgânica para digerir. Não tem mente, apenas fome, e percebe as presas pelas vibrações e pela proximidade. Costuma se esconder em tetos e frestas, caindo sobre quem passa. Aventureiros temem a criatura porque ela corrói equipamentos de metal e madeira com facilidade."
 },
 "caoIntermitente": {
  "id": "caoIntermitente",
  "tipo": "feérico",
  "name": "Cão Intermitente",
  "nomeOriginal": "Blink Dog",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 12,
   "dex": 17,
   "con": 12,
   "int": 10,
   "wis": 13,
   "cha": 11
  },
  "ac": 13,
  "maxHp": 22,
  "hpDice": "4d8+4",
  "speedFt": 40,
  "senses": {
   "passivePerception": 13
  },
  "saves": [],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 3,
    "damage": "1d6+1",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "acoesEspeciais": [
   {
    "nome": "Teletransporte",
    "recharge": [
     4,
     5,
     6
    ],
    "tipo": "teleporte",
    "alcanceFt": 40
   }
  ],
  "traits": [
   "keenHearingSmell"
  ],
  "blurb": "Morde e some num piscar de olhos, reaparecendo a até 12 m de distância para atacar de novo ou escapar. Difícil de encurralar, costuma caçar em matilha.",
  "lore": "Cães feéricos de índole bondosa e disciplinada, conhecidos por surgir e desaparecer do nada. Vivem em florestas, geralmente em grupos organizados que agem como uma matilha. Usam o teletransporte tanto para flanquear presas quanto para fugir do perigo. Nutrem um ódio antigo pelas feras deslocadoras e partem para cima delas assim que as avistam."
 },
 "falcaoSangrento": {
  "id": "falcaoSangrento",
  "tipo": "fera",
  "name": "Falcão Sangrento",
  "nomeOriginal": "Blood Hawk",
  "fonte": "MM",
  "size": "pequeno",
  "level": 1,
  "cr": "1/8",
  "xp": 25,
  "abilities": {
   "str": 6,
   "dex": 14,
   "con": 10,
   "int": 3,
   "wis": 14,
   "cha": 5
  },
  "ac": 12,
  "maxHp": 7,
  "hpDice": "2d6",
  "speedFt": 10,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60
  },
  "senses": {
   "passivePerception": 14
  },
  "saves": [],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Bico",
    "bonus": 4,
    "damage": "1d4+2",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "traits": [
   "visaoAgucada",
   "packTactics"
  ],
  "blurb": "Ataca em bando, mergulhando contra a presa e bicando com vantagem sempre que um aliado está ao lado do alvo. Sozinho é frágil, mas em revoada derruba presas grandes.",
  "lore": "Ave de rapina de plumagem vermelha como sangue, conhecida pela agressividade quase suicida. Vive em montanhas, campos, florestas, colinas, litorais e até regiões geladas. Não teme quase nenhum animal e investe contra ele com o bico afiado como uma adaga. Costuma voar em grandes bandos, que cercam e abatem a presa juntos."
 },
 "filhoteDeDragaoAzul": {
  "id": "filhoteDeDragaoAzul",
  "tipo": "dragão",
  "name": "Filhote de Dragão Azul",
  "nomeOriginal": "Blue Dragon Wyrmling",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 17,
   "dex": 10,
   "con": 15,
   "int": 12,
   "wis": 11,
   "cha": 15
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 52,
  "hpDice": "8d8+16",
  "speedFt": 30,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60,
   "burrowFt": 15
  },
  "senses": {
   "passivePerception": 14,
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
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "elétrico"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 5,
    "damage": "1d10+3",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d6",
     "type": "elétrico"
    }
   }
  ],
  "breath": {
   "name": "Sopro Elétrico",
   "kind": "save",
   "shape": "linha",
   "areaFt": 30,
   "save": "dex",
   "dc": 12,
   "damage": "4d10",
   "damageType": "elétrico",
   "halfOnSave": true,
   "origem": "sopro",
   "larguraFt": 5,
   "recharge": [
    5,
    6
   ]
  },
  "traits": [],
  "blurb": "Voa ou emerge da areia para morder com presas carregadas de eletricidade e dispara um raio em linha que atinge vários inimigos alinhados. Evite ficar em fila diante dele.",
  "lore": "Filhote de um dos dragões cromáticos mais orgulhosos, o dragão azul nasce em desertos e terras áridas. Mesmo jovem, já é territorial e cruel, e costuma se enterrar na areia para emboscar presas. Cobiça tesouros desde cedo e despreza criaturas que considera inferiores. Seu sopro elétrico e sua mordida tornam-no uma ameaça séria para grupos inexperientes."
 },
 "slaadAzul": {
  "id": "slaadAzul",
  "tipo": "aberração",
  "name": "Slaad Azul",
  "nomeOriginal": "Blue Slaad",
  "fonte": "MM",
  "size": "grande",
  "level": 5,
  "cr": "7",
  "xp": 2900,
  "abilities": {
   "str": 20,
   "dex": 15,
   "con": 18,
   "int": 7,
   "wis": 7,
   "cha": 9
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 123,
  "hpDice": "13d10+52",
  "speedFt": 30,
  "senses": {
   "passivePerception": 11,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "damageResistances": [
   "ácido",
   "frio",
   "fogo",
   "elétrico",
   "trovejante"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 8,
    "damage": "2d6+5",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Garra",
    "bonus": 8,
    "damage": "2d6+5",
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
  "regeneracao": {
   "pv": 10,
   "bloqueia": []
  },
  "traits": [
   "resistenciaAMagia",
   "regeneracaoDoLivro"
  ],
  "blurb": "Brutamontes anfíbio que ataca com mordida e duas garras afiadas a cada turno, regenerando 10 PV por rodada. Suas garras transmitem a fagocitose do caos, que pode transformar humanoides em novos slaadi.",
  "lore": "Os slaadi azuis são aberrações caóticas nascidas no Limbo, o plano do caos em constante transformação. Grandes e musculosos, têm garras curvas como ganchos ósseos e vivem para destruir e caçar. Ferozes e pouco inteligentes, atacam qualquer coisa que encontrem, sobretudo humanoides, que servem para espalhar a doença que perpetua sua espécie. Alguns carregam no cérebro uma gema mágica que os deixa submissos a quem a possuir."
 },
 "diaboOssudo": {
  "id": "diaboOssudo",
  "tipo": "corruptor",
  "name": "Diabo Ossudo",
  "nomeOriginal": "Bone Devil",
  "fonte": "MM",
  "size": "grande",
  "level": 9,
  "cr": "9",
  "xp": 5000,
  "abilities": {
   "str": 18,
   "dex": 16,
   "con": 18,
   "int": 13,
   "wis": 14,
   "cha": 16
  },
  "ac": 19,
  "acNote": "armadura natural",
  "maxHp": 142,
  "hpDice": "15d10+60",
  "speedFt": 40,
  "flyFt": 40,
  "speeds": {
   "flyFt": 40
  },
  "senses": {
   "passivePerception": 12,
   "darkvisionFt": 120
  },
  "saves": [
   "int",
   "wis",
   "cha"
  ],
  "skills": [
   "enganacao",
   "intuicao"
  ],
  "expertise": [],
  "damageResistances": [
   "frio",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "damageImmunities": [
   "fogo",
   "veneno"
  ],
  "conditionImmunities": [
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Garra",
    "bonus": 8,
    "damage": "1d8+4",
    "type": "cortante",
    "reachFt": 10
   },
   {
    "name": "Ferrão",
    "bonus": 8,
    "damage": "2d8+4",
    "type": "perfurante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "5d6",
     "type": "veneno"
    },
    "onHit": {
     "save": "con",
     "dc": 14,
     "condition": "envenenado",
     "rounds": 10,
     "repete": true
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Garra",
    "Garra",
    "Ferrão"
   ]
  },
  "features": [
   "devilsSight"
  ],
  "traits": [
   "resistenciaAMagia"
  ],
  "blurb": "Ataca de longe com garras e um ferrão de escorpião, alcançando 3 m; o ferrão causa muito dano de veneno e pode deixar o alvo envenenado. Resiste a magia e a armas comuns, e enxerga na escuridão mágica.",
  "lore": "Diabo esquelético de pele ressecada esticada sobre os ossos, com cauda de escorpião e asas. Serve nos Nove Infernos como capataz e policial, vigiando diabos menores com crueldade metódica. Adora atormentar quem está sob seu comando e obedece fielmente aos superiores na hierarquia infernal. Prefere a intimidação e o castigo exemplar para manter a ordem."
 },
 "nagaOssudaGuardia": {
  "id": "nagaOssudaGuardia",
  "tipo": "morto-vivo",
  "name": "Naga Ossuda (Guardiã)",
  "nomeOriginal": "Bone Naga (Guardian)",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "4",
  "xp": 1100,
  "abilities": {
   "str": 15,
   "dex": 16,
   "con": 12,
   "int": 15,
   "wis": 15,
   "cha": 16
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 58,
  "hpDice": "9d10+9",
  "speedFt": 30,
  "senses": {
   "passivePerception": 12,
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
   "paralisado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 5,
    "damage": "2d6+3",
    "type": "perfurante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "3d6",
     "type": "veneno"
    }
   }
  ],
  "spellcasting": {
   "ability": "wis",
   "cantrips": [
    "consertar",
    "chamaSagrada",
    "taumaturgia"
   ],
   "prepared": [
    "comando",
    "escudoDaFe",
    "acalmarEmocoes",
    "imobilizarPessoa",
    "rogarMaldicao"
   ],
   "slots": [
    0,
    4,
    3,
    2
   ],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "cdPorMagia": {
    "consertar": 12,
    "chamaSagrada": 12,
    "taumaturgia": 12,
    "comando": 12,
    "escudoDaFe": 12,
    "acalmarEmocoes": 12,
    "imobilizarPessoa": 12,
    "rogarMaldicao": 12
   }
  },
  "traits": [],
  "blurb": "Morde a até 3 m de distância com presas que causam dano perfurante e veneno, e conjura magias de clérigo como imobilizar pessoa e rogar maldição para travar os inimigos.",
  "lore": "A naga ossuda é o esqueleto reanimado de uma naga guardiã, erguido por necromancia e preso à vontade de quem o criou. Conserva parte do intelecto e das orações que conhecia em vida, mas perde a personalidade antiga. Costuma vigiar templos, criptas e passagens no Subterrâneo. Não come, não dorme e segue as ordens do mestre sem hesitar."
 },
 "nagaOssudaEspirito": {
  "id": "nagaOssudaEspirito",
  "tipo": "morto-vivo",
  "name": "Naga Ossuda (Espírito)",
  "nomeOriginal": "Bone Naga (Spirit)",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "4",
  "xp": 1100,
  "abilities": {
   "str": 15,
   "dex": 16,
   "con": 12,
   "int": 15,
   "wis": 15,
   "cha": 16
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 58,
  "hpDice": "9d10+9",
  "speedFt": 30,
  "senses": {
   "passivePerception": 12,
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
   "paralisado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 5,
    "damage": "2d6+3",
    "type": "perfurante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "3d6",
     "type": "veneno"
    }
   }
  ],
  "spellcasting": {
   "ability": "int",
   "cantrips": [
    "maoMagica",
    "ilusaoMenor",
    "raioDeGelo"
   ],
   "prepared": [
    "enfeiticarPessoa",
    "sono",
    "detectarPensamentos",
    "imobilizarPessoa",
    "relampago"
   ],
   "slots": [
    0,
    4,
    3,
    2
   ],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "cdPorMagia": {
    "maoMagica": 12,
    "ilusaoMenor": 12,
    "raioDeGelo": 12,
    "enfeiticarPessoa": 12,
    "sono": 12,
    "detectarPensamentos": 12,
    "imobilizarPessoa": 12,
    "relampago": 12
   }
  },
  "traits": [],
  "blurb": "Conjuradora morta-viva que paralisa, adormece e enfeitiça os alvos com magia de mago e despeja relâmpagos em linha. De perto, sua mordida com 3 m de alcance causa dano perfurante somado a veneno.",
  "lore": "A naga ossuda é o esqueleto reanimado de uma naga espiritual, trazido de volta por necromancia e forçado a servir quem a ergueu. Ela conserva parte das lembranças e da magia que dominava em vida, embora boa parte de sua personalidade tenha se perdido. Costuma vigiar ruínas, covis e passagens do Subterrâneo a mando de seu mestre. Não sente cansaço nem medo de venenos, e guarda seu posto com paciência sem fim."
 },
 "filhoteDeDragaoDeLatao": {
  "id": "filhoteDeDragaoDeLatao",
  "tipo": "dragão",
  "name": "Filhote de Dragão de Latão",
  "nomeOriginal": "Brass Dragon Wyrmling",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 15,
   "dex": 10,
   "con": 13,
   "int": 10,
   "wis": 11,
   "cha": 13
  },
  "ac": 16,
  "acNote": "armadura natural",
  "maxHp": 16,
  "hpDice": "3d8+3",
  "speedFt": 30,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60,
   "burrowFt": 15
  },
  "senses": {
   "passivePerception": 14,
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
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "fogo"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 4,
    "damage": "1d10+2",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "breath": {
   "name": "Sopro de Fogo",
   "kind": "save",
   "shape": "linha",
   "areaFt": 20,
   "save": "dex",
   "dc": 11,
   "damage": "4d6",
   "damageType": "fogo",
   "halfOnSave": true,
   "larguraFt": 5,
   "origem": "sopro",
   "chaveRecarga": "Armas de Sopro",
   "recharge": [
    5,
    6
   ]
  },
  "sopros": [
   {
    "name": "Sopro de Fogo",
    "kind": "save",
    "shape": "linha",
    "areaFt": 20,
    "save": "dex",
    "dc": 11,
    "damage": "4d6",
    "damageType": "fogo",
    "halfOnSave": true,
    "larguraFt": 5,
    "origem": "sopro",
    "chaveRecarga": "Armas de Sopro",
    "recharge": [
     5,
     6
    ]
   },
   {
    "name": "Sopro do Sono",
    "kind": "save",
    "shape": "cone",
    "areaFt": 15,
    "save": "con",
    "dc": 11,
    "condition": "inconsciente",
    "rounds": 10,
    "origem": "sopro",
    "chaveRecarga": "Armas de Sopro",
    "recharge": [
     5,
     6
    ]
   }
  ],
  "traits": [],
  "blurb": "Morde com força e, a cada recarga, escolhe entre uma linha de fogo ou uma nuvem de gás que põe os inimigos para dormir. Voa rápido e pode se enterrar na areia.",
  "lore": "Recém-saído do ovo, este pequeno dragão metálico já mostra o temperamento curioso e falante da sua espécie. Costuma viver em desertos quentes e terras áridas, cavando tocas sob as dunas. Prefere conversar a lutar e raramente ataca sem motivo. Quando ameaçado, tenta adormecer os incômodos antes de recorrer às chamas."
 },
 "filhoteDeDragaoDeBronze": {
  "id": "filhoteDeDragaoDeBronze",
  "tipo": "dragão",
  "name": "Filhote de Dragão de Bronze",
  "nomeOriginal": "Bronze Dragon Wyrmling",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 17,
   "dex": 10,
   "con": 15,
   "int": 12,
   "wis": 11,
   "cha": 15
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 32,
  "hpDice": "5d8+10",
  "speedFt": 30,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60,
   "swimFt": 30
  },
  "senses": {
   "passivePerception": 14,
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
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "elétrico"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 5,
    "damage": "1d10+3",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "breath": {
   "name": "Sopro Elétrico",
   "kind": "save",
   "shape": "linha",
   "areaFt": 40,
   "save": "dex",
   "dc": 12,
   "damage": "3d10",
   "damageType": "elétrico",
   "halfOnSave": true,
   "larguraFt": 5,
   "origem": "sopro",
   "chaveRecarga": "Armas de Sopro",
   "recharge": [
    5,
    6
   ]
  },
  "sopros": [
   {
    "name": "Sopro Elétrico",
    "kind": "save",
    "shape": "linha",
    "areaFt": 40,
    "save": "dex",
    "dc": 12,
    "damage": "3d10",
    "damageType": "elétrico",
    "halfOnSave": true,
    "larguraFt": 5,
    "origem": "sopro",
    "chaveRecarga": "Armas de Sopro",
    "recharge": [
     5,
     6
    ]
   },
   {
    "name": "Sopro Repulsor",
    "kind": "save",
    "shape": "cone",
    "areaFt": 30,
    "save": "str",
    "dc": 12,
    "empurraFt": 30,
    "origem": "sopro",
    "chaveRecarga": "Armas de Sopro",
    "recharge": [
     5,
     6
    ]
   }
  ],
  "traits": [],
  "blurb": "Morde com força e, quando o sopro recarrega, escolhe entre uma linha de relâmpagos ou um cone que empurra os inimigos para longe. Voa rápido e nada bem, atacando tanto do ar quanto da água.",
  "lore": "O dragão de bronze é um dragão metálico de índole ordeira e bondosa, que costuma fazer seu covil em litorais e ilhas. Ainda filhote, já se sente em casa nas ondas e passa horas caçando no mar. É curioso e se interessa por navios e pelas pessoas que os tripulam. Se for provocado, porém, defende seu território com fúria e eletricidade."
 },
 "chefeBugbear": {
  "id": "chefeBugbear",
  "tipo": "humanoide",
  "name": "Chefe Bugbear",
  "nomeOriginal": "Bugbear Chief",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 17,
   "dex": 14,
   "con": 14,
   "int": 11,
   "wis": 12,
   "cha": 11
  },
  "ac": 17,
  "acNote": "camisão de malha e escudo",
  "maxHp": 65,
  "hpDice": "10d8+20",
  "speedFt": 30,
  "senses": {
   "passivePerception": 11,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "intimidacao",
   "furtividade",
   "sobrevivencia"
  ],
  "expertise": [
   "furtividade"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Maça-Estrela",
    "bonus": 5,
    "damage": "2d8+3",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Azagaia",
    "bonus": 5,
    "damage": "2d6+3",
    "type": "perfurante",
    "reachFt": 5,
    "rangeFt": 30,
    "longRangeFt": 120,
    "danoExtra": {
     "damage": "1d6+3",
     "type": "perfurante"
    }
   }
  ],
  "multiattack": {
   "count": 2
  },
  "traits": [
   "ataqueSurpresa",
   "t_coracaoDeHruggek"
  ],
  "blurb": "Líder brutal que golpeia duas vezes por turno com maça-estrela ou azagaias, causando dano extra em emboscadas. Resiste bem a medo, encantamentos e venenos.",
  "lore": "O chefe bugbear é o mais forte e cruel de seu bando, e mantém a liderança pela intimidação e pela força bruta. Esses goblinoides peludos vivem em florestas, campos e nas profundezas do Subterrâneo. Preferem atacar de surpresa, movendo-se em silêncio apesar do tamanho. Acredita-se que o deus Hruggek abençoe esses chefes com uma vontade quase inquebrável."
 },
 "bulette": {
  "id": "bulette",
  "tipo": "monstruosidade",
  "name": "Bulette",
  "nomeOriginal": "Bulette",
  "fonte": "MM",
  "size": "grande",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 19,
   "dex": 11,
   "con": 21,
   "int": 2,
   "wis": 10,
   "cha": 5
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 94,
  "hpDice": "9d10+45",
  "speedFt": 40,
  "speeds": {
   "burrowFt": 40
  },
  "senses": {
   "passivePerception": 16,
   "darkvisionFt": 60,
   "tremorsenseFt": 60
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
    "damage": "4d12+4",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "acoesEspeciais": [
   {
    "nome": "Salto Mortal",
    "tipo": "area",
    "shape": "raio",
    "areaFt": 5,
    "save": "dex",
    "dc": 16,
    "damage": "3d6+4",
    "damageType": "concussão",
    "damage2": "3d6+4",
    "damageType2": "cortante",
    "halfOnSave": true,
    "condition": "caido",
    "rounds": 1,
    "soDepoisDeSaltar": 15
   }
  ],
  "traits": [
   "t_saltoParado"
  ],
  "blurb": "Surge do subsolo guiada por sentido sísmico e salta sobre grupos inteiros, derrubando e esmagando quem estiver embaixo. Sua mordida brutal causa dano enorme em um único golpe.",
  "lore": "O bulette, apelidado de tubarão-de-terra, é um predador colossal movido apenas pela fome. Ele cava túneis com garras poderosas, derrubando árvores e abrindo crateras, e irrompe na superfície ao sentir vibrações no solo. Não tem covil: vaga por territórios de dezenas de quilômetros nas regiões temperadas, devorando tudo até esgotar a caça e então segue adiante. Prefere carne de halfling, evita a de anões e elfos, e ataca qualquer coisa que se mova, até outros bulettes. Há quem diga que nasceu de experimentos de um mago insano misturando tartarugas, tatus e sangue demoníaco."
 },
 "bullywug": {
  "id": "bullywug",
  "tipo": "humanoide",
  "name": "Bullywug",
  "nomeOriginal": "Bullywug",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 12,
   "dex": 12,
   "con": 13,
   "int": 7,
   "wis": 10,
   "cha": 7
  },
  "ac": 15,
  "acNote": "gibão de peles e escudo",
  "maxHp": 11,
  "hpDice": "2d8+2",
  "speedFt": 20,
  "speeds": {
   "swimFt": 40
  },
  "senses": {
   "passivePerception": 10
  },
  "saves": [],
  "skills": [
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 3,
    "damage": "1d4+1",
    "type": "concussão",
    "reachFt": 5
   },
   {
    "name": "Lança",
    "bonus": 3,
    "damage": "1d6+1",
    "type": "perfurante",
    "reachFt": 5,
    "rangeFt": 20,
    "longRangeFt": 60,
    "danoExtra": {
     "damage": "1d8+1",
     "type": "perfurante"
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Mordida",
    "Lança"
   ]
  },
  "traits": [
   "t_falarComSaposERas",
   "t_camuflagemDoPantano",
   "t_saltoParado"
  ],
  "blurb": "Luta em bandos, cercando o alvo com lança e mordida no mesmo turno, e salta longe para alcançar presas ou fugir. Some facilmente no pântano e prefere emboscar a enfrentar inimigos fortes.",
  "lore": "Os bullywugs são humanoides anfíbios com cabeça de sapo que precisam viver molhados, ocupando brejos, florestas chuvosas e grutas úmidas. Famintos e cruéis, atacam em grande número, mas debandam quando o perigo é real. Julgam-se a nobreza legítima dos pântanos e vivem de bajular um senhor da lama, a quem oferecem tesouros roubados de caravanas e vilas. Preferem capturar invasores para humilhá-los diante do rei, e treinam sapos gigantes como guardas, caçadores e montarias graças ao seu idioma coaxado."
 },
 "cambion": {
  "id": "cambion",
  "tipo": "corruptor",
  "name": "Cambion",
  "nomeOriginal": "Cambion",
  "fonte": "MM",
  "size": "médio",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 18,
   "dex": 18,
   "con": 16,
   "int": 14,
   "wis": 12,
   "cha": 16
  },
  "ac": 19,
  "acNote": "brunea",
  "maxHp": 82,
  "hpDice": "11d8+33",
  "speedFt": 30,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60
  },
  "senses": {
   "passivePerception": 14,
   "darkvisionFt": 60
  },
  "saves": [
   "str",
   "con",
   "int",
   "cha"
  ],
  "skills": [
   "enganacao",
   "intimidacao",
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "damageResistances": [
   "frio",
   "fogo",
   "elétrico",
   "veneno",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Lança",
    "bonus": 7,
    "damage": "1d6+4",
    "type": "perfurante",
    "reachFt": 5,
    "rangeFt": 20,
    "longRangeFt": 60,
    "danoExtra": {
     "damage": "1d8+4",
     "type": "perfurante"
    }
   },
   {
    "name": "Raio de Fogo",
    "bonus": 7,
    "damage": "3d6",
    "type": "fogo",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 120,
    "longRangeFt": 120
   }
  ],
  "multiattack": {
   "count": 2
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "viagemPlanar",
    "alterarAparencia",
    "comando",
    "detectarMagia"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "viagemPlanar": 1,
    "alterarAparencia": 3,
    "comando": 3,
    "detectarMagia": 3
   },
   "cdPorMagia": {
    "viagemPlanar": 14,
    "alterarAparencia": 14,
    "comando": 14,
    "detectarMagia": 14
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Encanto Infernal",
    "tipo": "alvo",
    "alcanceFt": 30,
    "save": "wis",
    "dc": 14,
    "condition": "enfeiticado",
    "rounds": 100,
    "repete": true,
    "imunizaAoPassar": true
   }
  ],
  "traits": [
   "t_bencaoInfernal"
  ],
  "blurb": "Voa rápido e alterna entre golpes de lança flamejante e raios de fogo à distância, com resistência a armas não mágicas. Seu Encanto Infernal pode virar um aliado seu contra o próprio grupo.",
  "lore": "O cambion nasce da união entre um corruptor, quase sempre um súcubo ou íncubo, e um humanoide. Chifres, asas de couro e cauda denunciam sua herança infernal. Desde jovem se considera senhor natural dos mortais e trama revoltas em cidades, reunindo bandidos e diabretes como seguidores. Nos Nove Infernos serve como soldado e emissário de diabos maiores, enquanto no Abismo só manda quem consegue se impor pela força."
 },
 "camelo": {
  "id": "camelo",
  "tipo": "fera",
  "name": "Camelo",
  "nomeOriginal": "Camel",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "1/8",
  "xp": 25,
  "abilities": {
   "str": 16,
   "dex": 8,
   "con": 14,
   "int": 2,
   "wis": 8,
   "cha": 5
  },
  "ac": 9,
  "maxHp": 15,
  "hpDice": "2d10+4",
  "speedFt": 50,
  "senses": {
   "passivePerception": 9
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 5,
    "damage": "1d4",
    "type": "concussão",
    "reachFt": 5
   }
  ],
  "traits": [],
  "blurb": "Animal de carga resistente e veloz, que só morde quando acuado. Seu ataque é fraco, e o maior valor dele está no deslocamento de 15 m.",
  "lore": "O camelo é uma fera robusta, adaptada aos desertos, capaz de passar longos períodos sem água. Caravanas o usam como montaria e animal de carga para atravessar as dunas. Costuma ser teimoso e mal-humorado, mas raramente ataca sem motivo. Quando provocado, defende-se com mordidas."
 },
 "rastejadorCarniceiro": {
  "id": "rastejadorCarniceiro",
  "tipo": "monstruosidade",
  "name": "Rastejador Carniceiro",
  "nomeOriginal": "Carrion Crawler",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 14,
   "dex": 13,
   "con": 16,
   "int": 1,
   "wis": 12,
   "cha": 5
  },
  "ac": 13,
  "acNote": "armadura natural",
  "maxHp": 51,
  "hpDice": "6d10+18",
  "speedFt": 30,
  "speeds": {
   "climbFt": 30
  },
  "senses": {
   "passivePerception": 13,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Tentáculos",
    "bonus": 8,
    "damage": "1d4+2",
    "type": "veneno",
    "reachFt": 10,
    "onHit": {
     "save": "con",
     "dc": 13,
     "condition": "paralisado",
     "rounds": 10,
     "repete": true
    }
   },
   {
    "name": "Mordida",
    "bonus": 4,
    "damage": "2d4+2",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Tentáculos",
    "Mordida"
   ]
  },
  "traits": [
   "keenSmell",
   "spiderClimb"
  ],
  "blurb": "Ataca com tentáculos de longo alcance cujo veneno paralisa a vítima e depois finaliza com a mordida. Anda pelo teto e costuma surgir de cima ou de trás de curvas.",
  "lore": "É um necrófago enorme e segmentado que limpa carcaças até os ossos e defende com fúria o território onde se alimenta. Prefere lugares onde a morte é comum, como cavernas, esgotos, masmorras, pântanos, cemitérios e campos de batalha. Percorre túneis pelo teto, farejando sangue e podridão com os tentáculos, e assim evita outros perigos da escuridão enquanto surpreende presas desatentas. Segue luzes de longe por horas e embosca em esquinas. Depois de paralisar uma vítima, arrasta-a para um lugar isolado e a deixa apodrecer antes de comer."
 },
 "gato": {
  "id": "gato",
  "tipo": "fera",
  "name": "Gato",
  "nomeOriginal": "Cat",
  "fonte": "MM",
  "size": "miúdo",
  "level": 1,
  "cr": "0",
  "xp": 10,
  "abilities": {
   "str": 3,
   "dex": 15,
   "con": 10,
   "int": 3,
   "wis": 12,
   "cha": 7
  },
  "ac": 12,
  "maxHp": 2,
  "hpDice": "1d4",
  "speedFt": 40,
  "speeds": {
   "climbFt": 30
  },
  "senses": {
   "passivePerception": 13
  },
  "saves": [],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Garras",
    "bonus": 0,
    "damage": 1,
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "traits": [
   "keenSmell"
  ],
  "blurb": "Pequeno e ágil, arranha com as garras causando dano mínimo; seu valor está no faro apurado e na furtividade, não no combate.",
  "lore": "Felinos pequenos encontrados quase em qualquer lugar, de campos e florestas a desertos e cidades. Caçam roedores e aves com paciência, escondendo-se e escalando com facilidade. São independentes e cautelosos, fugindo de ameaças maiores. Magos costumam escolhê-los como familiares pela discrição e pelos sentidos aguçados."
 },
 "ursoDasCavernas": {
  "id": "ursoDasCavernas",
  "tipo": "fera",
  "name": "Urso das Cavernas",
  "nomeOriginal": "Cave Bear",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 20,
   "dex": 10,
   "con": 16,
   "int": 2,
   "wis": 13,
   "cha": 7
  },
  "ac": 12,
  "acNote": "armadura natural",
  "maxHp": 42,
  "hpDice": "5d10+15",
  "speedFt": 40,
  "speeds": {
   "swimFt": 30
  },
  "senses": {
   "passivePerception": 13,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 7,
    "damage": "1d8+5",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Garras",
    "bonus": 7,
    "damage": "2d6+5",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Mordida",
    "Garras"
   ]
  },
  "traits": [
   "keenSmell"
  ],
  "blurb": "Fera enorme que avança rápido e despedaça o alvo com mordida e garras no mesmo turno, causando muito dano por rodada. Enxerga no escuro e fareja presas com facilidade.",
  "lore": "O urso das cavernas é um parente antigo e mais robusto dos ursos comuns, adaptado à vida em grutas e túneis profundos. Habita florestas densas e regiões do Subterrâneo, onde a escuridão não o atrapalha. É territorial e agressivo, atacando quem invade seu covil. Também nada bem e costuma caçar perto de rios e lagos subterrâneos."
 },
 "centauro": {
  "id": "centauro",
  "tipo": "monstruosidade",
  "name": "Centauro",
  "nomeOriginal": "Centaur",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 18,
   "dex": 14,
   "con": 14,
   "int": 9,
   "wis": 13,
   "cha": 11
  },
  "ac": 12,
  "maxHp": 45,
  "hpDice": "6d10+12",
  "speedFt": 50,
  "senses": {
   "passivePerception": 13
  },
  "saves": [],
  "skills": [
   "atletismo",
   "percepcao",
   "sobrevivencia"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Pique",
    "bonus": 6,
    "damage": "1d10+4",
    "type": "perfurante",
    "reachFt": 10,
    "investida": {
     "pes": 30,
     "dano": "3d6",
     "tipo": "perfurante"
    }
   },
   {
    "name": "Cascos",
    "bonus": 6,
    "damage": "2d6+4",
    "type": "concussão",
    "reachFt": 5
   },
   {
    "name": "Arco Longo",
    "bonus": 4,
    "damage": "1d8+2",
    "type": "perfurante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 150,
    "longRangeFt": 600
   }
  ],
  "multiattack": {
   "count": 2
  },
  "traits": [],
  "blurb": "Investe em linha reta com o pique para causar dano extra e completa o ataque com coices; à distância, dispara dois tiros de arco longo por turno. Rápido e com alcance de 3 m, é difícil de evitar.",
  "lore": "Centauros são nômades solitários das terras selvagens, que leem presságios na natureza e preferem evitar brigas, embora lutem com ferocidade quando encurralados. Suas tribos caçam e coletam em regiões de clima ameno ou quente, quase sem abrigo, e seguem rotas migratórias tão longas que podem levar gerações para se repetir. Quando uma vila surge no meio dessas rotas, o conflito é comum. Um centauro que não acompanha a tribo fica para trás e às vezes acaba vivendo entre outros povos, onde seu conhecimento da natureza é muito valorizado. Também negociam com elfos e caravanas amistosas."
 },
 "diaboAcorrentado": {
  "id": "diaboAcorrentado",
  "tipo": "corruptor",
  "name": "Diabo Acorrentado",
  "nomeOriginal": "Chain Devil",
  "fonte": "MM",
  "size": "médio",
  "level": 5,
  "cr": "8",
  "xp": 3900,
  "abilities": {
   "str": 18,
   "dex": 15,
   "con": 18,
   "int": 11,
   "wis": 12,
   "cha": 14
  },
  "ac": 16,
  "acNote": "armadura natural",
  "maxHp": 85,
  "hpDice": "10d8+40",
  "speedFt": 30,
  "senses": {
   "passivePerception": 11,
   "darkvisionFt": 120
  },
  "saves": [
   "con",
   "wis",
   "cha"
  ],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "frio",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "damageImmunities": [
   "fogo",
   "veneno"
  ],
  "conditionImmunities": [
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Corrente",
    "bonus": 8,
    "damage": "2d6+4",
    "type": "cortante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "2d6",
     "type": "perfurante"
    },
    "onHit": {
     "semResistencia": true,
     "dc": 14,
     "escape": 14,
     "condition": "contido",
     "note": "é agarrado"
    }
   }
  ],
  "multiattack": {
   "count": 2
  },
  "acoesEspeciais": [
   {
    "nome": "Animar Correntes",
    "tipo": "invocar",
    "opcoes": [
     {
      "id": "espadaVoadora",
      "dados": "1d4",
      "nome": "Corrente Animada"
     }
    ],
    "porDia": 1
   }
  ],
  "features": [
   "devilsSight"
  ],
  "traits": [
   "resistenciaAMagia",
   "mascaraPerturbadora"
  ],
  "blurb": "Ataca duas vezes com correntes de 3 m de alcance que agarram, contêm e dilaceram a vítima a cada turno, e pode dar vida a correntes próximas para atacar junto. Sua máscara ilusória amedronta quem chega perto.",
  "lore": "Diabo dos Nove Infernos, coberto de correntes farpadas que se movem como extensões do próprio corpo. Serve como torturador e carcereiro, sentindo prazer na dor que causa. Obedece à hierarquia infernal e costuma guardar prisioneiros ou caçar fugitivos. Usa ilusões para assumir rostos que a vítima amou ou odiou, quebrando sua coragem antes do golpe."
 },
 "chasme": {
  "id": "chasme",
  "tipo": "corruptor",
  "name": "Chasme",
  "nomeOriginal": "Chasme",
  "fonte": "MM",
  "size": "grande",
  "level": 5,
  "cr": "6",
  "xp": 2300,
  "abilities": {
   "str": 15,
   "dex": 15,
   "con": 12,
   "int": 11,
   "wis": 14,
   "cha": 10
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 84,
  "hpDice": "13d10+13",
  "speedFt": 20,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60
  },
  "senses": {
   "passivePerception": 15,
   "blindsightFt": 10,
   "darkvisionFt": 120
  },
  "saves": [
   "dex",
   "wis"
  ],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "damageResistances": [
   "frio",
   "fogo",
   "elétrico"
  ],
  "damageImmunities": [
   "veneno"
  ],
  "conditionImmunities": [
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Probóscide",
    "bonus": 5,
    "damage": "4d6+2",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "7d6",
     "type": "necrótico"
    }
   }
  ],
  "traits": [
   "t_zumbido",
   "resistenciaAMagia",
   "spiderClimb"
  ],
  "blurb": "Seu zumbido constante faz quem estiver por perto cair inconsciente, e então ela crava a probóscide na vítima indefesa para sugar sua vitalidade. Cada picada reduz o máximo de PV do alvo e pode matá-lo de vez.",
  "lore": "A chasme é um demônio do Abismo com aparência de mosca gigante e traços vagamente humanos. Serve como caçadora e carcereira dos senhores demoníacos, rastreando desertores e fugitivos. Ela zumbe pelo ar até que suas presas desmaiem e depois se alimenta delas sem pressa. Caminha por paredes e tetos com facilidade e costuma atacar de cima."
 },
 "quimera": {
  "id": "quimera",
  "tipo": "monstruosidade",
  "name": "Quimera",
  "nomeOriginal": "Chimera",
  "fonte": "MM",
  "size": "grande",
  "level": 5,
  "cr": "6",
  "xp": 2300,
  "abilities": {
   "str": 19,
   "dex": 11,
   "con": 19,
   "int": 3,
   "wis": 14,
   "cha": 10
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 114,
  "hpDice": "12d10+48",
  "speedFt": 30,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60
  },
  "senses": {
   "passivePerception": 18,
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
    "damage": "2d6+4",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Chifres",
    "bonus": 7,
    "damage": "1d12+4",
    "type": "concussão",
    "reachFt": 5
   },
   {
    "name": "Garras",
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
    "Chifres",
    "Garras"
   ]
  },
  "breath": {
   "name": "Sopro de Fogo",
   "kind": "save",
   "shape": "cone",
   "areaFt": 15,
   "save": "dex",
   "dc": 15,
   "damage": "7d8",
   "damageType": "fogo",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    5,
    6
   ]
  },
  "traits": [],
  "blurb": "Ataca com três cabeças por turno, mordendo, chifrando e arranhando, e pode trocar uma dessas investidas por um cone de fogo devastador. Como voa, costuma mergulhar do céu já soprando chamas antes de pousar.",
  "lore": "As quimeras surgiram quando Demogorgon, trazido ao mundo por mortais, deformou as feras ao seu redor em monstros de várias cabeças. Têm corpo de leão na frente, de bode atrás, asas de dragão e as três cabeças correspondentes, e herdaram a crueldade demoníaca do seu criador. Defendem territórios enormes nas montanhas, colinas, planícies e no Subterrâneo, onde caçam presas e humilham rivais como dragões, grifos e mantícoras. Gostam de brincar com vítimas mais fracas, ferindo e recuando para voltar depois. Sua vaidade dracônica as torna sensíveis a bajulação, comida e tesouro, e vilões podem mantê-las a seu serviço assim."
 },
 "chuul": {
  "id": "chuul",
  "tipo": "aberração",
  "name": "Chuul",
  "nomeOriginal": "Chuul",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "4",
  "xp": 1100,
  "abilities": {
   "str": 19,
   "dex": 10,
   "con": 16,
   "int": 5,
   "wis": 11,
   "cha": 5
  },
  "ac": 16,
  "acNote": "armadura natural",
  "maxHp": 93,
  "hpDice": "11d10+33",
  "speedFt": 30,
  "speeds": {
   "swimFt": 30
  },
  "senses": {
   "passivePerception": 14,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "percepcao"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "veneno"
  ],
  "conditionImmunities": [
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Pinça",
    "bonus": 6,
    "damage": "2d6+4",
    "type": "concussão",
    "reachFt": 10,
    "onHit": {
     "semResistencia": true,
     "dc": 14,
     "escape": 14,
     "condition": "agarrado",
     "note": "é agarrado"
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Pinça",
    "Pinça"
   ]
  },
  "acoesEspeciais": [
   {
    "nome": "Tentáculos",
    "tipo": "alvo",
    "alcanceFt": 15,
    "soAgarrado": true,
    "save": "con",
    "dc": 13,
    "condition": "envenenado",
    "rounds": 10,
    "repete": true
   }
  ],
  "traits": [
   "t_sentirMagia"
  ],
  "blurb": "Agarra presas com pinças de longo alcance e, enquanto as segura, usa os tentáculos para envenená-las e paralisá-las. Pode prender até duas criaturas ao mesmo tempo.",
  "lore": "Os chuuls são crustáceos que os aboletes alteraram e dotaram de inteligência nos tempos primordiais, para agir por eles fora da água. O império dos seus criadores caiu, mas eles seguem cumprindo as velhas ordens: capturam humanoides, juntam tesouros e acumulam objetos mágicos. Muitos montam guarda em ruínas aboletes esquecidas, matando exploradores atraídos por lendas e escondendo o equipamento deles em esconderijos antigos. Ficam mais fortes com o passar das eras e, se reencontram um abolete, voltam na hora a servi-lo."
 },
 "capaNegra": {
  "id": "capaNegra",
  "tipo": "aberração",
  "name": "Capa Negra",
  "nomeOriginal": "Cloaker",
  "fonte": "MM",
  "size": "grande",
  "level": 5,
  "cr": "8",
  "xp": 3900,
  "abilities": {
   "str": 17,
   "dex": 15,
   "con": 12,
   "int": 13,
   "wis": 12,
   "cha": 14
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 78,
  "hpDice": "12d10+12",
  "speedFt": 10,
  "flyFt": 40,
  "speeds": {
   "flyFt": 40
  },
  "senses": {
   "passivePerception": 11,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 6,
    "damage": "2d6+3",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Cauda",
    "bonus": 6,
    "damage": "1d8+3",
    "type": "cortante",
    "reachFt": 10
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Mordida",
    "Cauda"
   ]
  },
  "acoesEspeciais": [
   {
    "nome": "Gemido",
    "tipo": "area",
    "shape": "raio",
    "areaFt": 60,
    "save": "wis",
    "dc": 13,
    "condition": "amedrontado",
    "rounds": 1,
    "repete": false,
    "ateFimDoTurnoDele": true,
    "imunizaAoPassar": true
   }
  ],
  "traits": [
   "fantasmas",
   "transfereDano",
   "aparenciaFalsa",
   "sensibilidadeALuz"
  ],
  "blurb": "Gruda na vítima com a mordida, cegando-a e sufocando-a se atacar com vantagem, e divide com ela o dano que recebe. Usa gemidos aterrorizantes e cópias ilusórias para confundir o grupo.",
  "lore": "Predador aberrante do Subterrâneo que, parado, parece apenas uma capa de couro escuro. Seu corpo de cartilagem lembra uma arraia, e ele plana pelas cavernas seguindo grupos à distância para atacar feridos, doentes e retardatários. Envolve a presa e a devora rápido, defendendo-se com a cauda e evitando lutas contra inimigos fortes. Comunica-se por gemidos graves que outros seres mal ouvem e costuma viver isolado, reunindo-se com outros da espécie só para trocar informações."
 },
 "giganteDasNuvens": {
  "id": "giganteDasNuvens",
  "tipo": "gigante",
  "name": "Gigante das Nuvens",
  "nomeOriginal": "Cloud Giant",
  "fonte": "MM",
  "size": "enorme",
  "level": 9,
  "cr": "9",
  "xp": 5000,
  "abilities": {
   "str": 27,
   "dex": 10,
   "con": 22,
   "int": 12,
   "wis": 16,
   "cha": 16
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 200,
  "hpDice": "16d12+96",
  "speedFt": 40,
  "senses": {
   "passivePerception": 17
  },
  "saves": [
   "con",
   "wis",
   "cha"
  ],
  "skills": [
   "intuicao",
   "percepcao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Maça Estrela",
    "bonus": 12,
    "damage": "3d8+8",
    "type": "perfurante",
    "reachFt": 10
   },
   {
    "name": "Rocha",
    "bonus": 12,
    "damage": "4d10+8",
    "type": "concussão",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 60,
    "longRangeFt": 240
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Maça Estrela",
    "Maça Estrela"
   ]
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "quedaSuave",
    "voo",
    "passoNebuloso",
    "telecinesia",
    "formaGasosa",
    "detectarMagia",
    "nevoaObscurecente",
    "luz"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "quedaSuave": 3,
    "voo": 3,
    "passoNebuloso": 3,
    "telecinesia": 3,
    "formaGasosa": 1
   },
   "aVontade": [
    "detectarMagia",
    "nevoaObscurecente",
    "luz"
   ]
  },
  "traits": [
   "keenSmell"
  ],
  "blurb": "Golpeia duas vezes por turno com uma maça estrela de alcance longo e arremessa rochas devastadoras de longe. Usa magia inata para voar, criar névoa e mover inimigos com telecinesia.",
  "lore": "Gigantes das nuvens são colossos orgulhosos que habitam picos montanhosos e castelos suspensos entre as nuvens. Valorizam riqueza, status e presentes extravagantes, e costumam se comportar como nobres caprichosos. Alguns são benevolentes e protegem as terras abaixo, enquanto outros manipulam mortais como peças de um jogo. Dominam uma magia ligada ao ar e ao clima, capaz até de alterar o tempo de uma região."
 },
 "cocatriz": {
  "id": "cocatriz",
  "tipo": "monstruosidade",
  "name": "Cocatriz",
  "nomeOriginal": "Cockatrice",
  "fonte": "MM",
  "size": "pequeno",
  "level": 1,
  "cr": "1/2",
  "xp": 100,
  "abilities": {
   "str": 6,
   "dex": 12,
   "con": 12,
   "int": 2,
   "wis": 13,
   "cha": 5
  },
  "ac": 11,
  "maxHp": 27,
  "hpDice": "6d6+6",
  "speedFt": 20,
  "flyFt": 40,
  "speeds": {
   "flyFt": 40
  },
  "senses": {
   "passivePerception": 11,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 3,
    "damage": "1d4+1",
    "type": "perfurante",
    "reachFt": 5,
    "onHit": {
     "save": "con",
     "dc": 11,
     "condition": "petrificado",
     "rounds": 1,
     "repete": true
    }
   }
  ],
  "traits": [],
  "blurb": "Ataca em frenesi com bicadas que podem transformar a vítima em pedra. Qualquer mordida exige teste de Constituição, e falhar duas vezes significa ficar petrificado por um dia inteiro.",
  "lore": "A cocatriz é uma criatura pequena e grotesca, uma mistura de lagarto, ave e morcego, temida pelo poder de petrificar a carne. Vive em campos e pradarias e come de tudo: frutas silvestres, nozes, flores e bichos miúdos que engole inteiros. Sozinha não seria ameaça, mas reage a qualquer sinal de perigo com fúria descontrolada. Avança batendo as asas e grasnando, bicando o rosto do intruso. Um simples arranhão do bico pode fazer a vítima endurecer aos poucos até virar estátua."
 },
 "serpenteConstritora": {
  "id": "serpenteConstritora",
  "tipo": "fera",
  "name": "Serpente Constritora",
  "nomeOriginal": "Constrictor Snake",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 15,
   "dex": 14,
   "con": 12,
   "int": 1,
   "wis": 10,
   "cha": 3
  },
  "ac": 12,
  "maxHp": 13,
  "hpDice": "2d10+2",
  "speedFt": 30,
  "speeds": {
   "swimFt": 30
  },
  "senses": {
   "passivePerception": 10,
   "blindsightFt": 10
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 4,
    "damage": "1d6+2",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Constrição",
    "bonus": 4,
    "damage": "1d8+2",
    "type": "concussão",
    "reachFt": 5,
    "onHit": {
     "semResistencia": true,
     "dc": 14,
     "escape": 14,
     "condition": "contido",
     "note": "é agarrado"
    }
   }
  ],
  "traits": [],
  "blurb": "Morde com rapidez e se enrola na presa, deixando-a agarrada e contida enquanto a esmaga. Sozinha é frágil, mas imobiliza bem um alvo isolado.",
  "lore": "É uma cobra grande e musculosa que mata apertando suas vítimas até que parem de respirar. Vive em florestas, pântanos, desertos e até debaixo d'água, já que nada tão bem quanto rasteja. Costuma emboscar animais que se aproximam, usando a percepção às cegas para notar presas muito próximas. Não tem malícia nenhuma, apenas fome."
 },
 "filhoteDeDragaoDeCobre": {
  "id": "filhoteDeDragaoDeCobre",
  "tipo": "dragão",
  "name": "Filhote de Dragão de Cobre",
  "nomeOriginal": "Copper Dragon Wyrmling",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 15,
   "dex": 12,
   "con": 13,
   "int": 14,
   "wis": 11,
   "cha": 13
  },
  "ac": 16,
  "acNote": "armadura natural",
  "maxHp": 22,
  "hpDice": "4d8+4",
  "speedFt": 30,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60,
   "climbFt": 30
  },
  "senses": {
   "passivePerception": 14,
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
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "ácido"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 4,
    "damage": "1d10+2",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "breath": {
   "name": "Armas de Sopro",
   "kind": "save",
   "shape": "linha",
   "areaFt": 20,
   "save": "dex",
   "dc": 11,
   "damage": "4d8",
   "damageType": "ácido",
   "halfOnSave": true,
   "origem": "sopro",
   "larguraFt": 5,
   "recharge": [
    5,
    6
   ]
  },
  "traits": [],
  "blurb": "Escala paredes e voa com agilidade, mordendo de perto e cuspindo uma linha de ácido ou um gás que deixa os inimigos lentos e desajeitados.",
  "lore": "Os dragões de cobre são dragões metálicos brincalhões, amantes de piadas, enigmas e boas histórias. Ainda filhote, este já mostra a curiosidade e o gosto por travessuras típicos da espécie. Costuma habitar colinas e regiões rochosas, onde se esconde em cavernas e fendas. Prefere enganar e provocar os intrusos a matá-los, mas se defende com ferocidade quando ameaçado."
 },
 "couatl": {
  "id": "couatl",
  "tipo": "celestial",
  "name": "Couatl",
  "nomeOriginal": "Couatl",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "4",
  "xp": 1100,
  "abilities": {
   "str": 16,
   "dex": 20,
   "con": 17,
   "int": 18,
   "wis": 20,
   "cha": 18
  },
  "ac": 19,
  "acNote": "armadura natural",
  "maxHp": 97,
  "hpDice": "13d8+39",
  "speedFt": 30,
  "flyFt": 90,
  "speeds": {
   "flyFt": 90
  },
  "senses": {
   "passivePerception": 15,
   "truesightFt": 120
  },
  "saves": [
   "con",
   "wis",
   "cha"
  ],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "radiante"
  ],
  "damageImmunities": [
   "psíquico",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageImmunitiesNote": "só de armas não mágicas",
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 8,
    "damage": "1d6+5",
    "type": "perfurante",
    "reachFt": 5,
    "onHit": {
     "save": "con",
     "dc": 13,
     "condition": "envenenado",
     "rounds": 1,
     "repete": false
    }
   },
   {
    "name": "Constrição",
    "bonus": 6,
    "damage": "2d6+3",
    "type": "concussão",
    "reachFt": 10,
    "onHit": {
     "semResistencia": true,
     "dc": 15,
     "escape": 15,
     "condition": "contido",
     "note": "é agarrado"
    }
   }
  ],
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "bencao",
    "criarAlimentoAgua",
    "curarFerimentos",
    "restauracaoMenor",
    "protecaoContraVeneno",
    "santuario",
    "escudoArcano",
    "restauracaoMaior",
    "videncia",
    "detectarBemMal",
    "detectarMagia",
    "detectarPensamentos"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "bencao": 3,
    "criarAlimentoAgua": 3,
    "curarFerimentos": 3,
    "restauracaoMenor": 3,
    "protecaoContraVeneno": 3,
    "santuario": 3,
    "escudoArcano": 3,
    "restauracaoMaior": 1,
    "videncia": 1
   },
   "aVontade": [
    "detectarBemMal",
    "detectarMagia",
    "detectarPensamentos"
   ],
   "cdPorMagia": {
    "bencao": 14,
    "criarAlimentoAgua": 14,
    "curarFerimentos": 14,
    "restauracaoMenor": 14,
    "protecaoContraVeneno": 14,
    "santuario": 14,
    "escudoArcano": 14,
    "restauracaoMaior": 14,
    "videncia": 14,
    "detectarBemMal": 14,
    "detectarMagia": 14,
    "detectarPensamentos": 14
   }
  },
  "traits": [
   "t_mudarDeForma",
   "armasMagicas",
   "t_menteProtegida"
  ],
  "blurb": "Serpente celestial alada e veloz que morde com um veneno capaz de pôr o alvo para dormir e se enrosca nos inimigos para contê-los. Armas comuns não a ferem, e ela se protege e cura com magia inata.",
  "lore": "O couatl é uma serpente emplumada de cores vivas, criada por um deus bondoso de quem quase ninguém mais se lembra. Muitos ainda cumprem antigas missões, como guardar poderes esquecidos, aguardar profecias ou proteger descendentes de quem um dia ampararam. Prefere agir às escondidas e só se revela em último caso. Jamais mente, mas pode calar, responder de modo vago ou deixar que outros tirem conclusões erradas. Vive por eras sem comer nem respirar e pressente a própria morte com até um século de antecedência; se a missão ainda estiver incompleta, busca um parceiro para gerar um herdeiro a partir de um ovo que parece uma gema."
 },
 "caranguejo": {
  "id": "caranguejo",
  "tipo": "fera",
  "name": "Caranguejo",
  "nomeOriginal": "Crab",
  "fonte": "MM",
  "size": "miúdo",
  "level": 1,
  "cr": "0",
  "xp": 10,
  "abilities": {
   "str": 2,
   "dex": 11,
   "con": 10,
   "int": 1,
   "wis": 8,
   "cha": 2
  },
  "ac": 11,
  "acNote": "armadura natural",
  "maxHp": 2,
  "hpDice": "1d4",
  "speedFt": 20,
  "speeds": {
   "swimFt": 20
  },
  "senses": {
   "passivePerception": 9,
   "blindsightFt": 30
  },
  "saves": [],
  "skills": [
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Garra",
    "bonus": 0,
    "damage": 1,
    "type": "concussão",
    "reachFt": 5
   }
  ],
  "traits": [],
  "blurb": "Um bicho minúsculo que belisca com a garra e quase não causa dano. Percebe o que está ao redor mesmo sem enxergar.",
  "lore": "O caranguejo é um pequeno crustáceo comum em praias, costões rochosos e águas rasas do litoral. Ele se move bem tanto na areia quanto debaixo d'água e costuma se esconder entre pedras e algas. Raramente ataca, a não ser que seja encurralado ou incomodado. Alguns conjuradores o escolhem como familiar por ser discreto e anfíbio."
 },
 "garraRastejante": {
  "id": "garraRastejante",
  "tipo": "morto-vivo",
  "name": "Garra Rastejante",
  "nomeOriginal": "Crawling Claw",
  "fonte": "MM",
  "size": "miúdo",
  "level": 1,
  "cr": "0",
  "xp": 10,
  "abilities": {
   "str": 13,
   "dex": 14,
   "con": 11,
   "int": 5,
   "wis": 10,
   "cha": 4
  },
  "ac": 12,
  "maxHp": 2,
  "hpDice": "1d4",
  "speedFt": 20,
  "speeds": {
   "climbFt": 20
  },
  "senses": {
   "passivePerception": 10,
   "blindsightFt": 30
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
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Garra",
    "bonus": 3,
    "damage": "1d4+1",
    "type": "concussão",
    "reachFt": 5
   }
  ],
  "traits": [
   "imuneAExpulsar"
  ],
  "blurb": "Mão decepada que avança às cegas e ataca com arranhões ou pancadas, escolhendo o tipo de dano. Sozinha é fraca, mas em bandos e escalando paredes pode surpreender aventureiros desatentos.",
  "lore": "É a mão cortada de um assassino, reanimada por um ritual necromântico que prende a ela o espírito do criminoso. Necromantes e bruxos sombrios as usam como ajudantes e costumam buscar mãos frescas em execuções públicas ou com matadores de aluguel. Obedecem somente ao criador e, sem novas ordens, cumprem a última recebida, matando tudo o que encontram em um lugar, já que não conseguem caçar alguém em particular. Abandonada, repete os crimes que cometia em vida. Se o assassino ainda vive, a garra pode voltar a se unir ao braço dele, e destruí-la longe do corpo mata o dono."
 },
 "crocodilo": {
  "id": "crocodilo",
  "tipo": "fera",
  "name": "Crocodilo",
  "nomeOriginal": "Crocodile",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "1/2",
  "xp": 100,
  "abilities": {
   "str": 15,
   "dex": 10,
   "con": 13,
   "int": 2,
   "wis": 10,
   "cha": 5
  },
  "ac": 12,
  "acNote": "armadura natural",
  "maxHp": 19,
  "hpDice": "3d10+3",
  "speedFt": 20,
  "speeds": {
   "swimFt": 30
  },
  "senses": {
   "passivePerception": 10
  },
  "saves": [],
  "skills": [
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 4,
    "damage": "1d10+2",
    "type": "perfurante",
    "reachFt": 5,
    "onHit": {
     "semResistencia": true,
     "dc": 12,
     "escape": 12,
     "condition": "contido",
     "note": "é agarrado"
    }
   }
  ],
  "traits": [],
  "blurb": "Espreita submerso e morde com força, prendendo a vítima nas mandíbulas até que ela consiga se soltar. Quem é agarrado fica contido e à mercê dos ataques seguintes.",
  "lore": "O crocodilo é um réptil enorme de pântanos, rios lentos e até esgotos de cidades grandes. Passa horas imóvel na água, só com os olhos de fora, esperando uma presa se aproximar da margem. Quando ataca, avança de repente e trava a mordida, arrastando a vítima para o fundo. Em terra é lento, mas na água se move com rapidez e pode ficar muito tempo sem respirar."
 },
 "fanaticoDoCulto": {
  "id": "fanaticoDoCulto",
  "tipo": "humanoide",
  "name": "Fanático do Culto",
  "nomeOriginal": "Cult Fanatic",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 11,
   "dex": 14,
   "con": 12,
   "int": 10,
   "wis": 13,
   "cha": 14
  },
  "ac": 13,
  "acNote": "armadura de couro",
  "maxHp": 33,
  "hpDice": "6d8+6",
  "speedFt": 30,
  "senses": {
   "passivePerception": 11
  },
  "saves": [],
  "skills": [
   "enganacao",
   "persuasao",
   "religiao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Adaga",
    "bonus": 4,
    "damage": "1d4+2",
    "type": "perfurante",
    "reachFt": 5,
    "rangeFt": 20,
    "longRangeFt": 60
   }
  ],
  "multiattack": {
   "count": 2
  },
  "spellcasting": {
   "ability": "wis",
   "cantrips": [
    "luz",
    "chamaSagrada",
    "taumaturgia"
   ],
   "prepared": [
    "comando",
    "infligirFerimentos",
    "escudoDaFe",
    "imobilizarPessoa",
    "armaEspiritual"
   ],
   "slots": [
    0,
    4,
    3
   ],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "cdPorMagia": {
    "luz": 11,
    "chamaSagrada": 11,
    "taumaturgia": 11,
    "comando": 11,
    "infligirFerimentos": 11,
    "escudoDaFe": 11,
    "imobilizarPessoa": 11,
    "armaEspiritual": 11
   }
  },
  "traits": [
   "devocaoSombria"
  ],
  "blurb": "Combina duas punhaladas por turno com magias de clérigo: paralisa alvos com Imobilizar Pessoa, causa dano necrótico pesado com Infligir Ferimentos e invoca uma arma espiritual. Resiste bem a medo e encantamentos.",
  "lore": "O fanático costuma ocupar posições de comando dentro de um culto, usando lábia e doutrina para manipular os mais fracos de vontade. Por trás da fé aparente, quase sempre o que move esse sectário é a sede de poder próprio. Age sobretudo nas cidades, recrutando seguidores e escondendo suas reuniões nos becos e porões. Em combate, deixa os acólitos na linha de frente enquanto conjura bênçãos e maldições de seu deus sombrio."
 },
 "ciclope": {
  "id": "ciclope",
  "tipo": "gigante",
  "name": "Ciclope",
  "nomeOriginal": "Cyclops",
  "fonte": "MM",
  "size": "enorme",
  "level": 5,
  "cr": "6",
  "xp": 2300,
  "abilities": {
   "str": 22,
   "dex": 11,
   "con": 20,
   "int": 8,
   "wis": 6,
   "cha": 10
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 138,
  "hpDice": "12d12+60",
  "speedFt": 30,
  "senses": {
   "passivePerception": 8
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Clava Grande",
    "bonus": 9,
    "damage": "3d8+6",
    "type": "concussão",
    "reachFt": 10
   },
   {
    "name": "Pedra",
    "bonus": 9,
    "damage": "4d10+6",
    "type": "concussão",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 30,
    "longRangeFt": 120
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Clava Grande",
    "Clava Grande"
   ]
  },
  "traits": [
   "t_percepcaoDeProfundidadeRuim"
  ],
  "blurb": "Gigante de um olho só que esmaga quem estiver a até 3 m com dois golpes de clava grande e arremessa pedras devastadoras. Contra alvos a mais de 9 m ele erra com facilidade, então manter distância é a melhor defesa.",
  "lore": "Os ciclopes são gigantes de um único olho que levam uma vida dura e simples em regiões selvagens, criando rebanhos para se alimentar. Moram sozinhos ou em pequenas famílias, em cavernas, ruínas ou abrigos de pedra empilhada, e expulsam qualquer estranho que invada suas terras. Quase não falam, pouco se importam com deuses e adoram enfeitar-se com objetos brilhantes, de moedas a talheres velhos. São fáceis de enganar, sobretudo com demonstrações de magia, mas quando descobrem que foram feitos de bobos reagem com fúria vingativa."
 },
 "dao": {
  "id": "dao",
  "tipo": "elemental",
  "name": "Dao",
  "nomeOriginal": "Dao",
  "fonte": "MM",
  "size": "grande",
  "level": 9,
  "cr": "11",
  "xp": 7200,
  "abilities": {
   "str": 23,
   "dex": 12,
   "con": 24,
   "int": 12,
   "wis": 13,
   "cha": 14
  },
  "ac": 18,
  "acNote": "armadura natural",
  "maxHp": 187,
  "hpDice": "15d10+105",
  "speedFt": 30,
  "flyFt": 30,
  "speeds": {
   "flyFt": 30,
   "burrowFt": 30
  },
  "senses": {
   "passivePerception": 11,
   "darkvisionFt": 120
  },
  "saves": [
   "int",
   "wis",
   "cha"
  ],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [
   "petrificado"
  ],
  "attacks": [
   {
    "name": "Punho",
    "bonus": 10,
    "damage": "2d8+6",
    "type": "concussão",
    "reachFt": 5
   },
   {
    "name": "Marreta",
    "bonus": 10,
    "damage": "4d6+6",
    "type": "concussão",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "linguas",
    "formaGasosa",
    "invisibilidade",
    "assassinoFantasmagorico",
    "viagemPlanar",
    "muralhaDePedra",
    "detectarBemMal",
    "detectarMagia"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "linguas": 3,
    "formaGasosa": 1,
    "invisibilidade": 1,
    "assassinoFantasmagorico": 1,
    "viagemPlanar": 1,
    "muralhaDePedra": 1
   },
   "aVontade": [
    "detectarBemMal",
    "detectarMagia"
   ],
   "cdPorMagia": {
    "linguas": 14,
    "formaGasosa": 14,
    "invisibilidade": 14,
    "assassinoFantasmagorico": 14,
    "viagemPlanar": 14,
    "muralhaDePedra": 14,
    "detectarBemMal": 14,
    "detectarMagia": 14
   }
  },
  "traits": [
   "deslizarNaTerra",
   "t_morteElemental",
   "pesFirmes"
  ],
  "blurb": "Gênio da terra brutal que atravessa rocha e esmaga com uma marreta capaz de derrubar quase qualquer alvo. Ataca com magia de terra, ilusões mortais e paredes de pedra.",
  "lore": "Os dao são gênios do Plano Elemental da Terra, gananciosos e cruéis, que vivem em labirintos subterrâneos repletos de gemas e minérios. Adoram riquezas e tratam os mortais como mão de obra escrava em suas minas. Costumam aparecer nas profundezas do Subterrâneo, onde negociam ou extorquem quem cruza seu caminho. Quando um dao morre, sobra apenas um pó cristalino e o que ele carregava."
 },
 "mantoSombrio": {
  "id": "mantoSombrio",
  "tipo": "monstruosidade",
  "name": "Manto Sombrio",
  "nomeOriginal": "Darkmantle",
  "fonte": "MM",
  "size": "pequeno",
  "level": 1,
  "cr": "1/2",
  "xp": 100,
  "abilities": {
   "str": 16,
   "dex": 12,
   "con": 13,
   "int": 2,
   "wis": 10,
   "cha": 5
  },
  "ac": 11,
  "maxHp": 22,
  "hpDice": "5d6+5",
  "speedFt": 10,
  "flyFt": 30,
  "speeds": {
   "flyFt": 30
  },
  "senses": {
   "passivePerception": 10,
   "blindsightFt": 60
  },
  "saves": [],
  "skills": [
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Esmagar",
    "bonus": 5,
    "damage": "1d6+3",
    "type": "concussão",
    "reachFt": 5
   }
  ],
  "acoesEspeciais": [
   {
    "nome": "Aura de Escuridão",
    "porDia": 1,
    "tipo": "escuridao",
    "raioFt": 15
   }
  ],
  "traits": [
   "echolocation",
   "aparenciaFalsa"
  ],
  "blurb": "Despenca do teto, cobre a cabeça da vítima e a esmaga, deixando-a cega e sem ar enquanto estiver grudado. Uma vez por dia envolve a área em escuridão mágica que nem visão no escuro atravessa.",
  "lore": "O manto sombrio é um predador das cavernas que se disfarça de estalactite ou pedaço de rocha, imóvel no teto. Quando uma presa passa por baixo, ele se solta, abre o corpo e a envolve em trevas mágicas. É comum no Subterrâneo e também na Umbra, onde ocupa o papel que os morcegos têm no Plano Material. Criaturas inteligentes da Umbra às vezes o adestram como guarda ou companheiro."
 },
 "caoDaMorte": {
  "id": "caoDaMorte",
  "tipo": "monstruosidade",
  "name": "Cão da Morte",
  "nomeOriginal": "Death Dog",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 15,
   "dex": 14,
   "con": 14,
   "int": 3,
   "wis": 13,
   "cha": 6
  },
  "ac": 12,
  "maxHp": 39,
  "hpDice": "6d8+12",
  "speedFt": 40,
  "senses": {
   "passivePerception": 15,
   "darkvisionFt": 120
  },
  "saves": [],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 4,
    "damage": "1d6+2",
    "type": "perfurante",
    "reachFt": 5,
    "onHit": {
     "save": "con",
     "dc": 12,
     "condition": "envenenado",
     "rounds": 1,
     "repete": true
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Mordida",
    "Mordida"
   ]
  },
  "traits": [
   "t_duasCabecas"
  ],
  "blurb": "Ataca com duas mordidas por turno, e cada uma pode transmitir uma doença que envenena a vítima e corrói seus PV máximos dia após dia. Com duas cabeças, é difícil de surpreender, cegar ou amedrontar.",
  "lore": "O cão da morte é um sabujo horrendo de duas cabeças que vaga por planícies, desertos e pelas profundezas do Subterrâneo. Movido por um ódio constante e pela fome de carne humanoide, persegue viajantes e exploradores sem descanso. Sua baba carrega uma moléstia terrível que faz a carne das vítimas apodrecer lentamente até se soltar dos ossos. Costuma caçar em matilhas e farejar presas a grande distância."
 },
 "cavaleiroDaMorte": {
  "id": "cavaleiroDaMorte",
  "tipo": "morto-vivo",
  "name": "Cavaleiro da Morte",
  "nomeOriginal": "Death Knight",
  "fonte": "MM",
  "size": "médio",
  "level": 17,
  "cr": "17",
  "xp": 18000,
  "abilities": {
   "str": 20,
   "dex": 11,
   "con": 20,
   "int": 12,
   "wis": 16,
   "cha": 18
  },
  "ac": 20,
  "acNote": "armadura de placas e escudo",
  "maxHp": 180,
  "hpDice": "19d8+95",
  "speedFt": 30,
  "senses": {
   "passivePerception": 13,
   "darkvisionFt": 120
  },
  "saves": [
   "dex",
   "wis",
   "cha"
  ],
  "skills": [],
  "expertise": [],
  "damageImmunities": [
   "necrótico",
   "veneno"
  ],
  "conditionImmunities": [
   "exausto",
   "amedrontado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Espada Longa",
    "bonus": 11,
    "damage": "1d8+5",
    "type": "cortante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d10+5",
     "type": "cortante"
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
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "comando",
    "dueloCompelido",
    "golpeAbrasador",
    "imobilizarPessoa",
    "armaMagica",
    "dissiparMagia",
    "armaElemental",
    "banimento",
    "destruicaoCambaleante",
    "ondaDestrutiva"
   ],
   "slots": [
    0,
    4,
    3,
    3,
    3,
    2
   ],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "cdPorMagia": {
    "comando": 18,
    "dueloCompelido": 18,
    "golpeAbrasador": 18,
    "imobilizarPessoa": 18,
    "armaMagica": 18,
    "dissiparMagia": 18,
    "armaElemental": 18,
    "banimento": 18,
    "destruicaoCambaleante": 18,
    "ondaDestrutiva": 18
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Orbe de Fogo Infernal",
    "porDia": 1,
    "tipo": "area",
    "shape": "raio",
    "areaFt": 120,
    "save": "dex",
    "dc": 18,
    "damage": "10d6",
    "damageType": "fogo",
    "halfOnSave": true
   }
  ],
  "traits": [
   "resistenciaAMagia",
   "comandaMortos",
   "aparar"
  ],
  "blurb": "Combatente brutal que golpeia três vezes por turno com uma espada longa carregada de energia necrótica e conjura magias de paladino. Uma vez por dia lança uma esfera de fogo infernal devastadora e ainda apara golpes corpo a corpo.",
  "lore": "É o que resta de um paladino caído que morreu sem buscar redenção e foi reerguido por forças sombrias como um esqueleto em armadura. Conserva a magia divina de outrora, mas jamais consegue usá-la para curar. Costuma liderar hordas de mortos-vivos menores ou servos demoníacos, cavalgando pesadelos ou esqueletos de cavalos de guerra. Destruí-lo não basta: ele volta repetidas vezes até expiar seus crimes. Não precisa respirar, comer, beber nem dormir."
 },
 "slaadDaMorte": {
  "id": "slaadDaMorte",
  "tipo": "aberração",
  "name": "Slaad da Morte",
  "nomeOriginal": "Death Slaad",
  "fonte": "MM",
  "size": "médio",
  "level": 9,
  "cr": "10",
  "xp": 5900,
  "abilities": {
   "str": 20,
   "dex": 15,
   "con": 19,
   "int": 15,
   "wis": 10,
   "cha": 16
  },
  "ac": 18,
  "acNote": "armadura natural",
  "maxHp": 170,
  "hpDice": "20d8+80",
  "speedFt": 30,
  "senses": {
   "passivePerception": 18,
   "blindsightFt": 60,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "arcanismo",
   "percepcao"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageResistances": [
   "ácido",
   "frio",
   "fogo",
   "elétrico",
   "trovejante"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida (só forma de slaad)",
    "bonus": 9,
    "damage": "1d8+5",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "2d6",
     "type": "necrótico"
    }
   },
   {
    "name": "Garras (só forma de slaad)",
    "bonus": 9,
    "damage": "1d10+5",
    "type": "cortante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "2d6",
     "type": "necrótico"
    }
   },
   {
    "name": "Espada Grande",
    "bonus": 9,
    "damage": "2d6+5",
    "type": "cortante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "2d6",
     "type": "necrótico"
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida (só forma de slaad)",
    "Garras (só forma de slaad)",
    "Garras (só forma de slaad)"
   ]
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "medo",
    "bolaDeFogo",
    "voo",
    "linguas",
    "nuvemMortal",
    "viagemPlanar",
    "detectarMagia",
    "detectarPensamentos",
    "invisibilidade",
    "maoMagica",
    "imagemMaior"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "medo": 2,
    "bolaDeFogo": 2,
    "voo": 2,
    "linguas": 2,
    "nuvemMortal": 1,
    "viagemPlanar": 1
   },
   "aVontade": [
    "detectarMagia",
    "detectarPensamentos",
    "invisibilidade",
    "maoMagica",
    "imagemMaior"
   ],
   "cdPorMagia": {
    "medo": 15,
    "bolaDeFogo": 15,
    "voo": 15,
    "linguas": 15,
    "nuvemMortal": 15,
    "viagemPlanar": 15,
    "detectarMagia": 15,
    "detectarPensamentos": 15,
    "invisibilidade": 15,
    "maoMagica": 15,
    "imagemMaior": 15
   }
  },
  "regeneracao": {
   "pv": 10,
   "bloqueia": []
  },
  "traits": [
   "metamorfo",
   "resistenciaAMagia",
   "armasMagicas",
   "regeneracaoDoLivro"
  ],
  "blurb": "Combatente brutal que morde e golpeia com garras ou montante, somando dano necrótico a cada acerto, enquanto se regenera todo turno. Também conjura bola de fogo, névoa mortal e medo, e resiste bem à magia.",
  "lore": "Os slaadi da morte são os mais cruéis de sua raça anfíbia, nascidos do caos do plano de Limbo. Costumam surgir quando um slaad cinzento é tocado por energias de morte, tornando-se líderes temidos entre seus semelhantes. Adoram se disfarçar de humanoides para semear destruição em outros mundos. Alguns carregam uma gema de controle no cérebro, o que os torna servos de quem a possuir."
 },
 "tiranoDaMorte": {
  "id": "tiranoDaMorte",
  "tipo": "morto-vivo",
  "name": "Tirano da Morte",
  "nomeOriginal": "Death Tyrant",
  "fonte": "MM",
  "size": "grande",
  "level": 13,
  "cr": "14",
  "xp": 11500,
  "abilities": {
   "str": 10,
   "dex": 14,
   "con": 14,
   "int": 19,
   "wis": 15,
   "cha": 19
  },
  "ac": 19,
  "acNote": "armadura natural",
  "maxHp": 187,
  "hpDice": "25d10+50",
  "speedFt": 0,
  "flyFt": 20,
  "hover": true,
  "speeds": {
   "flyFt": 20
  },
  "senses": {
   "passivePerception": 22,
   "darkvisionFt": 120
  },
  "saves": [
   "str",
   "con",
   "int",
   "wis",
   "cha"
  ],
  "skills": [
   "percepcao"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "veneno"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "exausto",
   "paralisado",
   "petrificado",
   "envenenado",
   "caido"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 5,
    "damage": "4d6",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "raiosOculares": {
   "n": 3,
   "alcanceFt": 120,
   "aoAcaso": true,
   "raios": [
    {
     "nome": "Raio Enfeitiçante",
     "save": "wis",
     "dc": 17,
     "condition": "enfeiticado",
     "rounds": 100,
     "repete": false
    },
    {
     "nome": "Raio Paralisante",
     "save": "con",
     "dc": 17,
     "condition": "paralisado",
     "rounds": 10,
     "repete": true
    },
    {
     "nome": "Raio do Medo",
     "save": "wis",
     "dc": 17,
     "condition": "amedrontado",
     "rounds": 10,
     "repete": true
    },
    {
     "nome": "Raio Lento",
     "save": "dex",
     "dc": 17
    },
    {
     "nome": "Raio Enervante",
     "save": "con",
     "dc": 17,
     "damage": "8d8",
     "damageType": "necrótico",
     "halfOnSave": true
    },
    {
     "nome": "Raio Telecinético",
     "save": "str",
     "dc": 17,
     "efeito": "telecinese"
    },
    {
     "nome": "Raio do Sono",
     "save": "wis",
     "dc": 17,
     "efeito": "sono"
    },
    {
     "nome": "Raio Petrificante",
     "save": "dex",
     "dc": 17,
     "efeito": "petrificar"
    },
    {
     "nome": "Raio Desintegrador",
     "save": "dex",
     "dc": 17,
     "damage": "10d8",
     "damageType": "energético",
     "halfOnSave": false,
     "efeito": "desintegrar"
    },
    {
     "nome": "Raio da Morte",
     "save": "dex",
     "dc": 17,
     "damage": "10d10",
     "damageType": "necrótico",
     "halfOnSave": false,
     "efeito": "morte"
    }
   ]
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Raio Ocular",
     "custo": 1,
     "tipo": "raio"
    }
   ]
  },
  "traits": [
   "raiosOculares",
   "coneDeEnergiaNegativa",
   "acoesLendarias"
  ],
  "blurb": "Flutua à distância disparando três raios oculares aleatórios por turno, de sono e paralisia a desintegração e morte instantânea. Seu cone invisível de energia negativa impede curas e transforma humanoides mortos em zumbis a seu serviço.",
  "lore": "Um observador que sonha com a própria existência além da morte pode se transformar nesta caveira colossal, com dez olhos espectrais flutuando acima dela e um ponto de luz vermelha na órbita central. Conserva a astúcia e grande parte da magia que tinha em vida, agora movida pelo poder da não vida. Domina outras criaturas como antes, mas converte escravos e inimigos em zumbis descartáveis, usados como guardas, iscas e bucha de canhão. Quando parte para a conquista, devasta assentamentos humanoides e engrossa seu exército morto-vivo a cada cidade que cai. Não precisa respirar, comer, beber nem dormir."
 },
 "cervo": {
  "id": "cervo",
  "tipo": "fera",
  "name": "Cervo",
  "nomeOriginal": "Deer",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "0",
  "xp": 10,
  "abilities": {
   "str": 11,
   "dex": 16,
   "con": 11,
   "int": 2,
   "wis": 14,
   "cha": 5
  },
  "ac": 13,
  "maxHp": 4,
  "hpDice": "1d8",
  "speedFt": 50,
  "senses": {
   "passivePerception": 12
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 2,
    "damage": "1d4",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "traits": [],
  "blurb": "Animal arisco e veloz que prefere fugir a lutar; quando encurralado, morde sem causar grande estrago.",
  "lore": "O cervo é um herbívoro esguio comum em campos abertos e florestas. Anda em pequenos grupos, sempre atento a predadores e a qualquer ruído estranho. Sua principal defesa é a velocidade, que o leva para longe do perigo em poucos saltos. Raramente ataca, a não ser que se veja sem saída."
 },
 "semilich": {
  "id": "semilich",
  "tipo": "morto-vivo",
  "name": "Semilich",
  "nomeOriginal": "Demilich",
  "fonte": "MM",
  "size": "miúdo",
  "level": 17,
  "cr": "18",
  "xp": 20000,
  "abilities": {
   "str": 1,
   "dex": 20,
   "con": 10,
   "int": 20,
   "wis": 17,
   "cha": 20
  },
  "ac": 20,
  "acNote": "armadura natural",
  "maxHp": 80,
  "hpDice": "32d4",
  "speedFt": 0,
  "flyFt": 30,
  "hover": true,
  "speeds": {
   "flyFt": 30
  },
  "senses": {
   "passivePerception": 13,
   "truesightFt": 120
  },
  "saves": [
   "con",
   "int",
   "wis",
   "cha"
  ],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageImmunities": [
   "necrótico",
   "veneno",
   "psíquico",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageImmunitiesNote": "só de armas não mágicas",
  "conditionImmunities": [
   "enfeitiçado",
   "surdo",
   "exausto",
   "amedrontado",
   "paralisado",
   "petrificado",
   "envenenado",
   "caido",
   "atordoado"
  ],
  "recursos": {
   "resistenciaLendaria": 3
  },
  "acoesEspeciais": [
   {
    "nome": "Uivo",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "raio",
    "areaFt": 30,
    "cai0": true,
    "save": "con",
    "dc": 15,
    "condicaoAoPassar": "amedrontado"
   },
   {
    "nome": "Drenar Vida",
    "tipo": "alvo",
    "alcanceFt": 10,
    "alvos": 3,
    "drena": true,
    "save": "con",
    "dc": 19,
    "damage": "6d6",
    "damageType": "necrótico",
    "halfOnSave": false
   }
  ],
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Voo",
     "custo": 1,
     "tipo": "mover",
     "metade": true,
     "semOportunidade": false
    },
    {
     "nome": "Nuvem de Poeira",
     "custo": 1,
     "tipo": "area",
     "raioFt": 10,
     "save": "con",
     "dc": 15,
     "condition": "cego",
     "rounds": 1,
     "repete": false,
     "ateFimDoTurnoDoAlvo": true
    },
    {
     "nome": "Drenar Energia",
     "custo": 2,
     "tipo": "area",
     "raioFt": 30,
     "save": "con",
     "dc": 15,
     "reduzMaximoDados": "3d6"
    },
    {
     "nome": "Maldição Vil",
     "custo": 3,
     "tipo": "alvo",
     "alcanceFt": 30,
     "save": "wis",
     "dc": 15,
     "condition": "malditoVil",
     "rounds": 10,
     "repete": true
    }
   ]
  },
  "traits": [
   "evasaoTotal",
   "imuneAExpulsar",
   "acoesLendarias"
  ],
  "blurb": "Crânio flutuante que uiva para derrubar a 0 PV quem estiver perto e drena a vida de até três alvos para se curar. Entre turnos, cega com poeira, corrói o PV máximo do grupo e lança maldições, além de quase ignorar dano em área.",
  "lore": "Um lich que deixa de alimentar seu filactério com almas acaba reduzido a pó, restando apenas o crânio com um resquício de sua vontade maligna. Ele repousa no coração de um túmulo labiríntico, cercado de armadilhas e guardiões, e só desperta quando alguém perturba seus restos. Já não conjura as magias de antes, mas continua letal, e enquanto o filactério existir o crânio volta a se formar dias depois. Alguns, como Acererak, escolhem esse estado de propósito e engastam gemas que capturam almas no próprio crânio."
 },
 "deva": {
  "id": "deva",
  "tipo": "celestial",
  "name": "Deva",
  "nomeOriginal": "Deva",
  "fonte": "MM",
  "size": "médio",
  "level": 9,
  "cr": "10",
  "xp": 5900,
  "abilities": {
   "str": 18,
   "dex": 18,
   "con": 18,
   "int": 17,
   "wis": 20,
   "cha": 20
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 136,
  "hpDice": "16d8+64",
  "speedFt": 30,
  "flyFt": 90,
  "speeds": {
   "flyFt": 90
  },
  "senses": {
   "passivePerception": 19,
   "darkvisionFt": 120
  },
  "saves": [
   "wis",
   "cha"
  ],
  "skills": [
   "intuicao",
   "percepcao"
  ],
  "expertise": [],
  "damageResistances": [
   "radiante",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "conditionImmunities": [
   "enfeitiçado",
   "exausto",
   "amedrontado"
  ],
  "attacks": [
   {
    "name": "Maça",
    "bonus": 8,
    "damage": "1d6+4",
    "type": "concussão",
    "reachFt": 5,
    "danoExtra": {
     "damage": "4d8",
     "type": "radiante"
    }
   }
  ],
  "multiattack": {
   "count": 2
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "comunhao",
    "reviverOsMortos",
    "detectarBemMal"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "comunhao": 1,
    "reviverOsMortos": 1
   },
   "aVontade": [
    "detectarBemMal"
   ],
   "cdPorMagia": {
    "comunhao": 17,
    "reviverOsMortos": 17,
    "detectarBemMal": 17
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Toque Curativo",
    "porDia": 3,
    "tipo": "cura",
    "dados": "4d8+2"
   }
  ],
  "traits": [
   "t_mudarDeForma",
   "armasMagicas",
   "resistenciaAMagia"
  ],
  "blurb": "Celestial alado que golpeia duas vezes com a maça, cada acerto carregado de dano radiante extra, e voa a grande velocidade. Também cura aliados e resiste bem a magia.",
  "lore": "Devas são anjos enviados pelos deuses como mensageiros e agentes nos planos mortais e além. Costumam surgir para guiar, proteger ou punir conforme a vontade divina que servem. Podem assumir a aparência de pessoas ou animais para agir sem chamar atenção entre os mortais. São incansáveis, leais e quase impossíveis de corromper."
 },
 "bestaDeslocadora": {
  "id": "bestaDeslocadora",
  "tipo": "monstruosidade",
  "name": "Besta Deslocadora",
  "nomeOriginal": "Displacer Beast",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 18,
   "dex": 15,
   "con": 16,
   "int": 6,
   "wis": 12,
   "cha": 8
  },
  "ac": 13,
  "acNote": "armadura natural",
  "maxHp": 85,
  "hpDice": "10d10+30",
  "speedFt": 40,
  "senses": {
   "passivePerception": 11,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Tentáculo",
    "bonus": 6,
    "damage": "1d6+4",
    "type": "concussão",
    "reachFt": 10,
    "danoExtra": {
     "damage": "1d6",
     "type": "perfurante"
    }
   }
  ],
  "multiattack": {
   "count": 2
  },
  "traits": [
   "evasaoTotal",
   "deslocamento"
  ],
  "blurb": "Ataca com dois tentáculos de 3 m de alcance enquanto uma ilusão a faz parecer estar em outro lugar, impondo desvantagem a quem tenta acertá-la. Também escapa quase ilesa de efeitos que exigem testes de resistência.",
  "lore": "Felino enorme de pelagem negro-azulada, com seis patas e dois tentáculos com pontas espinhosas saindo dos ombros, cujos olhos brilham de malícia até depois de morto. Veio da Agrestia das Fadas, onde a Corte Unseelie a criou para caçar unicórnios e pégasos, até que as feras fugiram e foram empurradas pela Corte Seelie, junto com cães teleportadores, para o Plano Material. Desde então, odeia esses cães e os ataca assim que os vê. Mata por prazer, brinca com as vítimas e arrasta os corpos para comer em paz. Caça sozinha ou em pequenos bandos que armam emboscadas em florestas densas e até decoram os horários das caravanas nas estradas."
 },
 "djinni": {
  "id": "djinni",
  "tipo": "elemental",
  "name": "Djinni",
  "nomeOriginal": "Djinni",
  "fonte": "MM",
  "size": "grande",
  "level": 9,
  "cr": "11",
  "xp": 7200,
  "abilities": {
   "str": 21,
   "dex": 15,
   "con": 22,
   "int": 15,
   "wis": 16,
   "cha": 20
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 161,
  "hpDice": "14d10+84",
  "speedFt": 30,
  "flyFt": 90,
  "speeds": {
   "flyFt": 90
  },
  "senses": {
   "passivePerception": 13,
   "darkvisionFt": 120
  },
  "saves": [
   "dex",
   "wis",
   "cha"
  ],
  "skills": [],
  "expertise": [],
  "damageImmunities": [
   "elétrico",
   "trovejante"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Cimitarra",
    "bonus": 9,
    "damage": "2d6+5",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Cimitarra",
    "Cimitarra",
    "Cimitarra"
   ]
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "criarAlimentoAgua",
    "linguas",
    "caminharNoVento",
    "formaGasosa",
    "invisibilidade",
    "imagemMaior",
    "viagemPlanar",
    "detectarBemMal",
    "detectarMagia",
    "ondaTrovejante"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "criarAlimentoAgua": 3,
    "linguas": 3,
    "caminharNoVento": 3,
    "formaGasosa": 1,
    "invisibilidade": 1,
    "imagemMaior": 1,
    "viagemPlanar": 1
   },
   "aVontade": [
    "detectarBemMal",
    "detectarMagia",
    "ondaTrovejante"
   ],
   "cdPorMagia": {
    "criarAlimentoAgua": 17,
    "linguas": 17,
    "caminharNoVento": 17,
    "formaGasosa": 17,
    "invisibilidade": 17,
    "imagemMaior": 17,
    "viagemPlanar": 17,
    "detectarBemMal": 17,
    "detectarMagia": 17,
    "ondaTrovejante": 17
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Criar Redemoinho",
    "tipo": "alvo",
    "alcanceFt": 120,
    "save": "str",
    "dc": 18,
    "condition": "contido",
    "rounds": 10,
    "repete": true
   }
  ],
  "traits": [
   "t_fimElemental"
  ],
  "blurb": "Gênio do ar que voa rápido e golpeia três vezes por turno com a cimitarra, somando dano elétrico ou trovejante. Pode criar um redemoinho que prende e arrasta inimigos, além de lançar magias inatas como onda trovejante e invisibilidade.",
  "lore": "O djinni é um gênio nascido do Plano Elemental do Ar, orgulhoso, alegre e amante do luxo. Costuma habitar palácios flutuantes entre as nuvens e aparece no mundo material perto de costas e céus abertos. Embora de índole bondosa, aprecia ser tratado com respeito e detesta ser aprisionado ou servir contra a vontade. Os mais poderosos dominam disfarces e até a lendária concessão de desejos."
 },
 "cavaloDeTracao": {
  "id": "cavaloDeTracao",
  "tipo": "fera",
  "name": "Cavalo de Tração",
  "nomeOriginal": "Draft Horse",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 18,
   "dex": 10,
   "con": 12,
   "int": 2,
   "wis": 11,
   "cha": 7
  },
  "ac": 10,
  "maxHp": 19,
  "hpDice": "3d10+3",
  "speedFt": 40,
  "senses": {
   "passivePerception": 10
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Cascos",
    "bonus": 6,
    "damage": "2d4+4",
    "type": "concussão",
    "reachFt": 5
   }
  ],
  "traits": [],
  "blurb": "Animal de carga forte mas pouco ágil, que só luta quando acuado, desferindo coices pesados com os cascos.",
  "lore": "Cavalos de tração são criados para puxar carroças, arados e carga pesada em fazendas e cidades. Musculosos e pacientes, valem mais pela força do que pela velocidade. Raramente buscam briga e tendem a fugir ou empacar diante do perigo. Quando assustados ou feridos, porém, podem atingir com coices capazes de quebrar ossos."
 },
 "tartarugaDragao": {
  "id": "tartarugaDragao",
  "tipo": "dragão",
  "name": "Tartaruga-Dragão",
  "nomeOriginal": "Dragon Turtle",
  "fonte": "MM",
  "size": "imenso",
  "level": 17,
  "cr": "17",
  "xp": 18000,
  "abilities": {
   "str": 25,
   "dex": 10,
   "con": 20,
   "int": 10,
   "wis": 12,
   "cha": 12
  },
  "ac": 20,
  "acNote": "armadura natural",
  "maxHp": 341,
  "hpDice": "22d20+110",
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
    "bonus": 13,
    "damage": "3d12+7",
    "type": "perfurante",
    "reachFt": 15
   },
   {
    "name": "Garra",
    "bonus": 13,
    "damage": "2d8+7",
    "type": "cortante",
    "reachFt": 10
   },
   {
    "name": "Cauda",
    "bonus": 13,
    "damage": "3d12+7",
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
   "count": 3
  },
  "breath": {
   "name": "Bafo de Vapor",
   "kind": "save",
   "shape": "cone",
   "areaFt": 60,
   "save": "con",
   "dc": 18,
   "damage": "15d6",
   "damageType": "fogo",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    5,
    6
   ]
  },
  "traits": [],
  "blurb": "Colosso marinho de casco quase impenetrável que morde, esmaga e varre com a cauda a até 4,5 m, derrubando quem atinge. Seu bafo de vapor escaldante cozinha grupos inteiros num cone, até debaixo d'água.",
  "lore": "A tartaruga-dragão é um dos maiores predadores dos oceanos, com um casco verde-escuro raiado de prata que, ao emergir, pode ser confundido com o reflexo da lua nas ondas. Ela afunda navios para recolher moedas e joias, engole o butim e o cospe em seu covil. Vive em cavernas de recifes de coral, sob o leito marinho ou em costas acidentadas, expulsando à força quem já ocupe um bom abrigo. Gananciosa e esperta, aceita suborno de piratas em troca de passagem segura e às vezes se alia a sahuagin em ataques a navios. Algumas chegam ao Plano Elemental da Água, onde servem de montaria a marids."
 },
 "dretch": {
  "id": "dretch",
  "tipo": "corruptor",
  "name": "Dretch",
  "nomeOriginal": "Dretch",
  "fonte": "MM",
  "size": "pequeno",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 11,
   "dex": 11,
   "con": 12,
   "int": 5,
   "wis": 8,
   "cha": 3
  },
  "ac": 11,
  "acNote": "armadura natural",
  "maxHp": 18,
  "hpDice": "4d6+4",
  "speedFt": 20,
  "senses": {
   "passivePerception": 9,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "frio",
   "fogo",
   "elétrico"
  ],
  "damageImmunities": [
   "veneno"
  ],
  "conditionImmunities": [
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 2,
    "damage": "1d6",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Garras",
    "bonus": 2,
    "damage": "2d4",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Mordida",
    "Garras"
   ]
  },
  "acoesEspeciais": [
   {
    "nome": "Nuvem Fétida",
    "porDia": 1,
    "tipo": "area",
    "shape": "raio",
    "areaFt": 10,
    "save": "con",
    "dc": 11,
    "condition": "envenenado",
    "rounds": 10,
    "repete": false
   }
  ],
  "traits": [],
  "blurb": "Demônio fraco e lento que morde e arranha em sequência; uma vez por dia solta uma nuvem fétida que envenena e limita as ações de quem fica dentro dela.",
  "lore": "Os dretches estão entre os demônios mais baixos do Abismo, criaturas barrigudas e patéticas que mal passam de carne de canhão. Vivem em bandos que vagam pelos planos inferiores, servindo de fodder para demônios mais poderosos. São covardes e invejosos, atacando em grupo quando sentem vantagem. Comunicam-se por telepatia com outros que entendem abissal e exalam um fedor insuportável."
 },
 "drider": {
  "id": "drider",
  "tipo": "monstruosidade",
  "name": "Drider",
  "nomeOriginal": "Drider",
  "fonte": "MM",
  "size": "grande",
  "level": 5,
  "cr": "6",
  "xp": 2300,
  "abilities": {
   "str": 16,
   "dex": 16,
   "con": 18,
   "int": 13,
   "wis": 14,
   "cha": 12
  },
  "ac": 19,
  "acNote": "armadura natural",
  "maxHp": 123,
  "hpDice": "13d10+52",
  "speedFt": 30,
  "speeds": {
   "climbFt": 30
  },
  "senses": {
   "passivePerception": 15,
   "darkvisionFt": 120
  },
  "saves": [],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "furtividade"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 6,
    "damage": "1d4",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "2d8",
     "type": "veneno"
    }
   },
   {
    "name": "Espada Longa",
    "bonus": 6,
    "damage": "1d8+3",
    "type": "cortante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d10+3",
     "type": "cortante"
    }
   },
   {
    "name": "Arco Longo",
    "bonus": 6,
    "damage": "1d8+3",
    "type": "perfurante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 150,
    "longRangeFt": 600,
    "danoExtra": {
     "damage": "1d8",
     "type": "veneno"
    }
   }
  ],
  "multiattack": {
   "count": 3
  },
  "spellcasting": {
   "ability": "wis",
   "cantrips": [],
   "prepared": [
    "escuridao",
    "fogoDasFadas",
    "luzesDancantes"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "escuridao": 1,
    "fogoDasFadas": 1
   },
   "aVontade": [
    "luzesDancantes"
   ],
   "cdPorMagia": {
    "escuridao": 13,
    "fogoDasFadas": 13,
    "luzesDancantes": 13
   }
  },
  "traits": [
   "ascendenciaFeerica",
   "spiderClimb",
   "sunlightSensitivity",
   "webWalker"
  ],
  "blurb": "Combate com três golpes de espada longa ou flechas envenenadas, podendo trocar um deles por uma mordida venenosa, e se move por paredes e teias sem dificuldade. Na luz do sol fica bem mais fraco.",
  "lore": "O drider é um drow que fracassou na provação imposta por Lolth e foi castigado com um corpo meio elfo, meio aranha gigante. Apenas a Rainha Aranha tem o poder de criar essas criaturas, que servem de lembrete vivo da sua vontade. Enlouquecidos pela transformação, a maioria vaga pelo Subterrâneo como caçadores solitários ou à frente de bandos de aranhas gigantes. Às vezes um deles volta às margens da sociedade drow para cumprir uma antiga promessa ou vingança, e lá é temido e desprezado, mas tolerado como símbolo de Lolth."
 },
 "magoDrow": {
  "id": "magoDrow",
  "tipo": "humanoide",
  "name": "Mago Drow",
  "nomeOriginal": "Drow Mage",
  "fonte": "MM",
  "size": "médio",
  "level": 5,
  "cr": "7",
  "xp": 2900,
  "abilities": {
   "str": 9,
   "dex": 14,
   "con": 10,
   "int": 17,
   "wis": 13,
   "cha": 12
  },
  "ac": 12,
  "acNote": "15 com armadura arcana",
  "maxHp": 45,
  "hpDice": "10d8",
  "speedFt": 30,
  "senses": {
   "passivePerception": 14,
   "darkvisionFt": 120
  },
  "saves": [],
  "skills": [
   "arcanismo",
   "enganacao",
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Cajado",
    "bonus": 2,
    "damage": "1d6-1",
    "type": "concussão",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d8-1",
     "type": "concussão"
    }
   }
  ],
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "escuridao",
    "fogoDasFadas",
    "levitacao",
    "luzesDancantes"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "escuridao": 1,
    "fogoDasFadas": 1,
    "levitacao": 1
   },
   "aVontade": [
    "luzesDancantes"
   ],
   "cdPorMagia": {
    "escuridao": 12,
    "fogoDasFadas": 12,
    "levitacao": 12,
    "luzesDancantes": 12
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Invocar Demônio",
    "porDia": 1,
    "tipo": "invocar",
    "opcoes": [
     {
      "id": "quasit",
      "dados": "1"
     },
     {
      "id": "demonioDasSombras",
      "dados": "1",
      "chance": 50
     }
    ]
   }
  ],
  "traits": [
   "ascendenciaFeerica",
   "sunlightSensitivity"
  ],
  "blurb": "Conjurador frágil que domina o campo à distância com teia, tentáculos negros, relâmpagos e névoa mortal, além de poder invocar um demônio aliado. Fica invisível e voa para escapar do corpo a corpo.",
  "lore": "Os magos drow são arcanistas dos elfos sombrios que vivem nas cidades da Umbreterna. Estudam magia para ganhar poder e prestígio numa sociedade dominada pelas sacerdotisas. Costumam lutar protegidos por guerreiros e escravos, atacando das sombras. Alguns firmam laços com demônios, que chamam para servi-los em combate."
 },
 "sacerdotisaDrowDeLolth": {
  "id": "sacerdotisaDrowDeLolth",
  "tipo": "humanoide",
  "name": "Sacerdotisa Drow de Lolth",
  "nomeOriginal": "Drow Priestess of Lolth",
  "fonte": "MM",
  "size": "médio",
  "level": 5,
  "cr": "8",
  "xp": 3900,
  "abilities": {
   "str": 10,
   "dex": 14,
   "con": 12,
   "int": 13,
   "wis": 17,
   "cha": 18
  },
  "ac": 16,
  "acNote": "brunea",
  "maxHp": 71,
  "hpDice": "13d8+13",
  "speedFt": 30,
  "senses": {
   "passivePerception": 16,
   "darkvisionFt": 120
  },
  "saves": [
   "con",
   "wis",
   "cha"
  ],
  "skills": [
   "intuicao",
   "percepcao",
   "religiao",
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Flagelo",
    "bonus": 5,
    "damage": "1d6+2",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "5d6",
     "type": "veneno"
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Flagelo",
    "Flagelo"
   ]
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "escuridao",
    "fogoDasFadas",
    "levitacao",
    "luzesDancantes"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "escuridao": 1,
    "fogoDasFadas": 1,
    "levitacao": 1
   },
   "aVontade": [
    "luzesDancantes"
   ],
   "cdPorMagia": {
    "escuridao": 15,
    "fogoDasFadas": 15,
    "levitacao": 15,
    "luzesDancantes": 15
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Invocar Demônio",
    "porDia": 1,
    "tipo": "invocar",
    "opcoes": [
     {
      "id": "quasit",
      "dados": "1"
     },
     {
      "id": "demonioDasSombras",
      "dados": "1",
      "chance": 50
     }
    ]
   }
  ],
  "traits": [
   "ascendenciaFeerica",
   "sunlightSensitivity"
  ],
  "blurb": "Conjuradora divina que alterna golpes de flagelo envenenado com teias, pragas de insetos e aranhas gigantes invocadas. Pode ainda tentar trazer um demônio yochlol para o combate.",
  "lore": "Ela pertence à casta religiosa que governa as cidades drow do Subterrâneo em nome de Lolth, a Rainha Aranha. Recebe poder diretamente da deusa e é temida tanto por inimigos quanto por seus próprios súditos. Intrigas, sacrifícios e crueldade fazem parte da sua rotina. Raramente luta sozinha, cercando-se de servos, aranhas e, às vezes, demônios."
 },
 "druida": {
  "id": "druida",
  "tipo": "humanoide",
  "name": "Druida",
  "nomeOriginal": "Druid",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 10,
   "dex": 12,
   "con": 13,
   "int": 12,
   "wis": 15,
   "cha": 11
  },
  "ac": 11,
  "acNote": "16 com pele de árvore",
  "maxHp": 27,
  "hpDice": "5d8+5",
  "speedFt": 30,
  "senses": {
   "passivePerception": 14
  },
  "saves": [],
  "skills": [
   "medicina",
   "natureza",
   "percepcao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Bordão",
    "bonus": 2,
    "damage": "1d6",
    "type": "concussão",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d8",
     "type": "concussão"
    }
   }
  ],
  "spellcasting": {
   "ability": "wis",
   "cantrips": [
    "arteDruidica",
    "produzirChama",
    "shillelagh"
   ],
   "prepared": [
    "emaranhar",
    "passosLargos",
    "falarComAnimais",
    "ondaTrovejante",
    "mensageiroAnimal",
    "peleDeArvore"
   ],
   "slots": [
    0,
    4,
    3
   ],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "cdPorMagia": {
    "arteDruidica": 12,
    "produzirChama": 12,
    "shillelagh": 12,
    "emaranhar": 12,
    "passosLargos": 12,
    "falarComAnimais": 12,
    "ondaTrovejante": 12,
    "mensageiroAnimal": 12,
    "peleDeArvore": 12
   }
  },
  "traits": [],
  "blurb": "Conjurador da natureza que prende inimigos com constrição, empurra-os com onda trovejante e golpeia com um bordão encantado por shillelagh. Fica mais resistente quando ativa pele de árvore.",
  "lore": "Os druidas vivem em florestas e outros recantos selvagens e isolados, guardando a natureza contra monstros e contra o avanço das cidades. Muitos servem como xamãs de suas tribos. Curam enfermos, conversam com espíritos animais e orientam seu povo nas questões da alma. Costumam evitar a civilização, mas defendem com firmeza o território que protegem."
 },
 "driade": {
  "id": "driade",
  "tipo": "feérico",
  "name": "Dríade",
  "nomeOriginal": "Dryad",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 10,
   "dex": 12,
   "con": 11,
   "int": 14,
   "wis": 15,
   "cha": 18
  },
  "ac": 11,
  "acNote": "16 com pele de árvore",
  "maxHp": 22,
  "hpDice": "5d8",
  "speedFt": 30,
  "senses": {
   "passivePerception": 14,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "furtividade"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Clava",
    "bonus": 2,
    "damage": "1d4",
    "type": "concussão",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d8+4",
     "type": "concussão"
    }
   }
  ],
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "emaranhar",
    "bomFruto",
    "peleDeArvore",
    "passosSemPegadas",
    "shillelagh",
    "arteDruidica"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "emaranhar": 3,
    "bomFruto": 3,
    "peleDeArvore": 1,
    "passosSemPegadas": 1,
    "shillelagh": 1
   },
   "aVontade": [
    "arteDruidica"
   ],
   "cdPorMagia": {
    "emaranhar": 14,
    "bomFruto": 14,
    "peleDeArvore": 14,
    "passosSemPegadas": 14,
    "shillelagh": 14,
    "arteDruidica": 14
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Encanto Feérico",
    "tipo": "alvo",
    "alcanceFt": 30,
    "save": "wis",
    "dc": 14,
    "condition": "enfeiticado",
    "rounds": 10,
    "repete": true,
    "imunizaAoPassar": true
   }
  ],
  "traits": [
   "resistenciaAMagia",
   "t_falarComBestasEPlantas",
   "t_caminharEmArvores"
  ],
  "blurb": "Evita o combate direto: enfeitiça inimigos para virarem aliados, prende grupos com constrição e salta de uma árvore a outra para escapar. Com shillelagh, seu bordão bate com força surpreendente.",
  "lore": "A dríade é um espírito feérico menor preso a uma árvore por fadas poderosas, às vezes como castigo por um amor proibido com um mortal. Pode se afastar da árvore, mas é ela que a mantém jovem e bela; se a árvore sofre, a dríade sofre junto, e se for destruída, ela enlouquece. Tímida, vigia intrusos escondida na mata e às vezes tenta atrair estranhos que a encantam. Protege a floresta ao lado de unicórnios, ents, sátiros e druidas."
 },
 "duergar": {
  "id": "duergar",
  "tipo": "humanoide",
  "name": "Duergar",
  "nomeOriginal": "Duergar",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 14,
   "dex": 11,
   "con": 14,
   "int": 11,
   "wis": 10,
   "cha": 9
  },
  "ac": 16,
  "acNote": "brunea e escudo",
  "maxHp": 26,
  "hpDice": "4d8+4",
  "speedFt": 25,
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 120
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "veneno"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Picareta de Guerra",
    "bonus": 4,
    "damage": "1d8+2",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "2d8+2",
     "type": "perfurante"
    }
   },
   {
    "name": "Azagaia",
    "bonus": 4,
    "damage": "1d6+2",
    "type": "perfurante",
    "reachFt": 5,
    "rangeFt": 30,
    "longRangeFt": 120,
    "danoExtra": {
     "damage": "2d6+2",
     "type": "perfurante"
    }
   }
  ],
  "acoesEspeciais": [
   {
    "nome": "Aumentar",
    "tipo": "aumentar"
   }
  ],
  "traits": [
   "invisivelAVontade",
   "t_resilienciaDuergar",
   "sunlightSensitivity"
  ],
  "blurb": "Anão cinzento que cresce até tamanho Grande para dobrar o dano de sua picareta ou some invisível para emboscar e fugir. Resiste bem a magias, ilusões e venenos, mas sofre sob a luz do sol.",
  "lore": "Os duergar, ou anões cinzentos, erguem cidades austeras nas profundezas do Subterrâneo, sustentadas por escravos e por saberes anões antigos. Descendem de anões que passaram gerações cativos dos devoradores de mentes e, ao se libertarem, saíram tão cruéis quanto seus antigos senhores. São carrancudos, desconfiados e incansáveis, fazem alianças apenas por conveniência e guerreiam contra outros anões e povos subterrâneos. A magia do Subterrâneo lhes deu o poder de crescer ou desaparecer, e há rumores de que Asmodeus se disfarça de seus deuses para alimentar sua tirania."
 },
 "duodrone": {
  "id": "duodrone",
  "tipo": "constructo",
  "name": "Duodrone",
  "nomeOriginal": "Duodrone",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 11,
   "dex": 13,
   "con": 12,
   "int": 6,
   "wis": 10,
   "cha": 7
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 11,
  "hpDice": "2d8+2",
  "speedFt": 30,
  "senses": {
   "passivePerception": 10,
   "truesightFt": 120
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Punho",
    "bonus": 2,
    "damage": "1d4",
    "type": "concussão",
    "reachFt": 5
   },
   {
    "name": "Azagaia",
    "bonus": 3,
    "damage": "1d6+1",
    "type": "perfurante",
    "reachFt": 5,
    "rangeFt": 30,
    "longRangeFt": 120
   }
  ],
  "multiattack": {
   "count": 2
  },
  "traits": [
   "t_menteAxiomatica",
   "t_desintegracao"
  ],
  "blurb": "Modron em forma de bloco que ataca duas vezes por turno, com punhos ou lançando azagaias à distância. Sozinho é fraco, mas costuma aparecer em grupos disciplinados.",
  "lore": "Os duodrones são modrons de baixa patente, corpos retangulares com dois braços e duas pernas, servos da ordem absoluta de Mechanus. Recebem ordens dos superiores e repassam instruções aos monodrones abaixo deles. Agem com lógica rígida, sem iniciativa própria, e marcham em formações precisas. Quando um deles se torna defeituoso, os demais modrons o caçam como renegado."
 },
 "aguia": {
  "id": "aguia",
  "tipo": "fera",
  "name": "Águia",
  "nomeOriginal": "Eagle",
  "fonte": "MM",
  "size": "pequeno",
  "level": 1,
  "cr": "0",
  "xp": 10,
  "abilities": {
   "str": 6,
   "dex": 15,
   "con": 10,
   "int": 2,
   "wis": 14,
   "cha": 7
  },
  "ac": 12,
  "maxHp": 3,
  "hpDice": "1d6",
  "speedFt": 10,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60
  },
  "senses": {
   "passivePerception": 14
  },
  "saves": [],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Garras",
    "bonus": 4,
    "damage": "1d4+2",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "traits": [
   "visaoAgucada"
  ],
  "blurb": "Ave de rapina que mergulha do alto e rasga o alvo com as garras. Frágil, mas difícil de surpreender graças à visão aguçada.",
  "lore": "A águia é uma ave de rapina que domina os céus de montanhas, colinas, campos abertos e litorais. Faz ninhos em penhascos e pontos elevados, de onde vigia o território por longas distâncias. Caça pequenos animais com voos rápidos e precisos e raramente enfrenta criaturas maiores. Por ser atenta e ágil, é escolhida com frequência como familiar por conjuradores."
 },
 "efreeti": {
  "id": "efreeti",
  "tipo": "elemental",
  "name": "Efreeti",
  "nomeOriginal": "Efreeti",
  "fonte": "MM",
  "size": "grande",
  "level": 9,
  "cr": "11",
  "xp": 7200,
  "abilities": {
   "str": 22,
   "dex": 12,
   "con": 24,
   "int": 16,
   "wis": 15,
   "cha": 16
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 200,
  "hpDice": "16d10+112",
  "speedFt": 40,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60
  },
  "senses": {
   "passivePerception": 12,
   "darkvisionFt": 120
  },
  "saves": [
   "int",
   "wis",
   "cha"
  ],
  "skills": [],
  "expertise": [],
  "damageImmunities": [
   "fogo"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Cimitarra",
    "bonus": 10,
    "damage": "2d6+6",
    "type": "cortante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "2d6",
     "type": "fogo"
    }
   },
   {
    "name": "Arremessar Chamas",
    "bonus": 7,
    "damage": "5d6",
    "type": "fogo",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 120,
    "longRangeFt": 120
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Cimitarra",
    "Cimitarra"
   ]
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "aumentarReduzir",
    "linguas",
    "formaGasosa",
    "invisibilidade",
    "imagemMaior",
    "viagemPlanar",
    "muralhaDeFogo",
    "detectarMagia"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "aumentarReduzir": 3,
    "linguas": 3,
    "formaGasosa": 1,
    "invisibilidade": 1,
    "imagemMaior": 1,
    "viagemPlanar": 1,
    "muralhaDeFogo": 1
   },
   "aVontade": [
    "detectarMagia"
   ],
   "cdPorMagia": {
    "aumentarReduzir": 15,
    "linguas": 15,
    "formaGasosa": 15,
    "invisibilidade": 15,
    "imagemMaior": 15,
    "viagemPlanar": 15,
    "muralhaDeFogo": 15,
    "detectarMagia": 15
   }
  },
  "traits": [
   "t_fimElemental"
  ],
  "blurb": "Gênio de fogo enorme que alterna entre dois golpes de cimitarra flamejante e rajadas de chamas lançadas a até 36 m. Resistente e imune a fogo, ainda conjura muralhas de fogo, invisibilidade e elementais.",
  "lore": "Os efreets são gênios nascidos do Plano Elemental do Fogo, orgulhosos, cruéis e obcecados por hierarquia. Gostam de dominar e escravizar criaturas inferiores, e costumam aparecer em desertos escaldantes ou servindo a quem consiga prendê-los. Seguem contratos ao pé da letra, sempre buscando uma brecha em proveito próprio. Os mais nobres têm o poder de conceder desejos, mas raramente sem distorcer o pedido."
 },
 "elefante": {
  "id": "elefante",
  "tipo": "fera",
  "name": "Elefante",
  "nomeOriginal": "Elephant",
  "fonte": "MM",
  "size": "enorme",
  "level": 1,
  "cr": "4",
  "xp": 1100,
  "abilities": {
   "str": 22,
   "dex": 9,
   "con": 17,
   "int": 3,
   "wis": 11,
   "cha": 6
  },
  "ac": 12,
  "acNote": "armadura natural",
  "maxHp": 76,
  "hpDice": "8d12+24",
  "speedFt": 40,
  "senses": {
   "passivePerception": 10
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Presas",
    "bonus": 8,
    "damage": "3d8+6",
    "type": "perfurante",
    "reachFt": 5,
    "investida": {
     "pes": 20,
     "save": "str",
     "dc": 12,
     "mordeSeCair": "Pisotear"
    }
   },
   {
    "name": "Pisotear",
    "bonus": 8,
    "damage": "3d10+6",
    "type": "concussão",
    "reachFt": 5
   }
  ],
  "traits": [],
  "blurb": "Investe em linha reta para cravar as presas e derrubar o alvo, depois o esmaga com as patas. Um inimigo caído diante dele corre sério risco.",
  "lore": "O elefante é um herbívoro colossal das savanas e campos abertos, onde vive em manadas lideradas pelas fêmeas mais velhas. Costuma ser pacífico, mas protege os filhotes com ferocidade. Quando se sente ameaçado, avança como uma avalanche de músculos. Alguns povos o domesticam como montaria de guerra ou animal de carga."
 },
 "alce": {
  "id": "alce",
  "tipo": "fera",
  "name": "Alce",
  "nomeOriginal": "Elk",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 16,
   "dex": 10,
   "con": 12,
   "int": 2,
   "wis": 10,
   "cha": 6
  },
  "ac": 10,
  "maxHp": 13,
  "hpDice": "2d10+2",
  "speedFt": 50,
  "senses": {
   "passivePerception": 10
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Chifrada",
    "bonus": 5,
    "damage": "1d6+3",
    "type": "concussão",
    "reachFt": 5,
    "investida": {
     "pes": 20,
     "save": "str",
     "dc": 13,
     "dano": "2d6",
     "tipo": "concussão"
    }
   },
   {
    "name": "Cascos",
    "bonus": 5,
    "damage": "2d4+3",
    "type": "concussão",
    "reachFt": 5
   }
  ],
  "traits": [],
  "blurb": "Investe em linha reta para derrubar o alvo com uma cabeçada poderosa e depois o pisoteia com os cascos enquanto ele está no chão.",
  "lore": "O alce é um grande cervídeo de galhada larga, comum em campos abertos, florestas e colinas. Costuma andar em pequenos grupos e pastar com calma. Fica agressivo quando se sente ameaçado ou na época de acasalamento. Nessas horas, avança contra o intruso a toda velocidade."
 },
 "empireo": {
  "id": "empireo",
  "tipo": "celestial",
  "name": "Empíreo",
  "nomeOriginal": "Empyrean",
  "fonte": "MM",
  "size": "enorme",
  "level": 21,
  "cr": "23",
  "xp": 50000,
  "abilities": {
   "str": 30,
   "dex": 21,
   "con": 30,
   "int": 21,
   "wis": 22,
   "cha": 27
  },
  "ac": 22,
  "acNote": "armadura natural",
  "maxHp": 313,
  "hpDice": "19d12+190",
  "speedFt": 50,
  "flyFt": 50,
  "speeds": {
   "flyFt": 50,
   "swimFt": 50
  },
  "senses": {
   "passivePerception": 16,
   "truesightFt": 120
  },
  "saves": [
   "str",
   "int",
   "wis",
   "cha"
  ],
  "skills": [
   "intuicao",
   "persuasao"
  ],
  "expertise": [],
  "damageImmunities": [
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageImmunitiesNote": "só de armas não mágicas",
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Marreta",
    "bonus": 17,
    "damage": "6d6+10",
    "type": "concussão",
    "reachFt": 10,
    "onHit": {
     "save": "con",
     "dc": 15,
     "condition": "atordoado",
     "rounds": 1,
     "repete": false
    }
   },
   {
    "name": "Raio",
    "bonus": 15,
    "damage": "7d6",
    "type": "radiante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 600,
    "longRangeFt": 600
   }
  ],
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "comunhao",
    "dissiparOBemEOMal",
    "terremoto",
    "tempestadeDeFogo",
    "viagemPlanar",
    "restauracaoMaior",
    "passosSemPegadas",
    "respirarNaAgua",
    "andarNaAgua"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "comunhao": 1,
    "dissiparOBemEOMal": 1,
    "terremoto": 1,
    "tempestadeDeFogo": 1,
    "viagemPlanar": 1
   },
   "aVontade": [
    "restauracaoMaior",
    "passosSemPegadas",
    "respirarNaAgua",
    "andarNaAgua"
   ],
   "cdPorMagia": {
    "comunhao": 23,
    "dissiparOBemEOMal": 23,
    "terremoto": 23,
    "tempestadeDeFogo": 23,
    "viagemPlanar": 23,
    "restauracaoMaior": 23,
    "passosSemPegadas": 23,
    "respirarNaAgua": 23,
    "andarNaAgua": 23
   }
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Ataque",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Marreta"
    },
    {
     "nome": "Fortalecer",
     "custo": 1,
     "tipo": "reforco",
     "raioFt": 120
    },
    {
     "nome": "Golpe Tremulante",
     "custo": 2,
     "tipo": "area",
     "raioFt": 60,
     "save": "str",
     "dc": 25,
     "condition": "caido",
     "rounds": 10,
     "repete": false,
     "soNoChao": true
    }
   ]
  },
  "traits": [
   "resistenciaAMagia",
   "armasMagicas",
   "acoesLendarias"
  ],
  "blurb": "Titã celestial que esmaga com uma marreta capaz de atordoar e dispara raios elementais a 180 m de distância. Com ações lendárias, derruba todos ao redor com tremores e fortalece os aliados.",
  "lore": "Os empíreos são filhos dos deuses dos Planos Superiores, gigantes belíssimos e cheios de confiança. Seu humor transborda para o mundo: na tristeza, flores murcham e nuvens choram sal, e na alegria o sol e os pássaros os acompanham. Alguns se corrompem nos Planos Inferiores ou sob maldições divinas e passam a governar reinos mortais no Plano Material como tiranos. Não envelhecem e lutam sem medo, incapazes de conceber a própria morte. Quando morrem, o espírito volta ao plano natal, onde um dos pais divinos costuma ressuscitá-los."
 },
 "erinia": {
  "id": "erinia",
  "tipo": "corruptor",
  "name": "Erínia",
  "nomeOriginal": "Erinyes",
  "fonte": "MM",
  "size": "médio",
  "level": 9,
  "cr": "12",
  "xp": 8400,
  "abilities": {
   "str": 18,
   "dex": 16,
   "con": 18,
   "int": 14,
   "wis": 14,
   "cha": 18
  },
  "ac": 18,
  "acNote": "armadura de placas",
  "maxHp": 153,
  "hpDice": "18d8+72",
  "speedFt": 30,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60
  },
  "senses": {
   "passivePerception": 12,
   "truesightFt": 120
  },
  "saves": [
   "dex",
   "con",
   "wis",
   "cha"
  ],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "frio",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "damageImmunities": [
   "fogo",
   "veneno"
  ],
  "conditionImmunities": [
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Espada Longa",
    "bonus": 8,
    "damage": "1d8+4",
    "type": "cortante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d10+4",
     "type": "cortante"
    }
   },
   {
    "name": "Arco Longo",
    "bonus": 7,
    "damage": "1d8+3",
    "type": "perfurante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 150,
    "longRangeFt": 600,
    "danoExtra": {
     "damage": "3d8",
     "type": "veneno"
    },
    "onHit": {
     "save": "con",
     "dc": 14,
     "condition": "envenenado",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "multiattack": {
   "count": 3
  },
  "traits": [
   "armasMagicas",
   "resistenciaAMagia",
   "aparar"
  ],
  "blurb": "Guerreira infernal alada que ataca três vezes por turno, com espada ou arco, e cada golpe carrega veneno extra. Apara golpes corpo a corpo e resiste bem a magia.",
  "lore": "As erínias são diabas guerreiras de porte elegante e asas emplumadas, a elite marcial dos Nove Infernos. Servem arquiduques e generais diabólicos como caçadoras de traidores e fugitivos, perseguindo suas presas sem descanso. Disciplinadas e orgulhosas, preferem combater do alto, alternando flechas envenenadas e investidas de espada. Enxergam a verdade por trás de ilusões e disfarces, o que torna quase impossível escapar delas."
 },
 "ettercap": {
  "id": "ettercap",
  "tipo": "monstruosidade",
  "name": "Ettercap",
  "nomeOriginal": "Ettercap",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 14,
   "dex": 15,
   "con": 13,
   "int": 7,
   "wis": 12,
   "cha": 8
  },
  "ac": 13,
  "acNote": "armadura natural",
  "maxHp": 44,
  "hpDice": "8d8+8",
  "speedFt": 30,
  "speeds": {
   "climbFt": 30
  },
  "senses": {
   "passivePerception": 13,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "percepcao",
   "furtividade",
   "sobrevivencia"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 4,
    "damage": "1d8+2",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d8",
     "type": "veneno"
    },
    "onHit": {
     "save": "con",
     "dc": 11,
     "condition": "envenenado",
     "rounds": 10,
     "repete": true
    }
   },
   {
    "name": "Garras",
    "bonus": 4,
    "damage": "2d4+2",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Teia",
    "bonus": 4,
    "damage": 0,
    "type": "nenhum",
    "reachFt": 5,
    "onHit": {
     "semResistencia": true,
     "dc": 11,
     "escape": 11,
     "condition": "contido",
     "note": "fica preso"
    },
    "ranged": true,
    "rangeFt": 30,
    "longRangeFt": 60,
    "recharge": [
     5,
     6
    ]
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Mordida",
    "Garras"
   ]
  },
  "traits": [
   "spiderClimb",
   "webSense",
   "webWalker"
  ],
  "blurb": "Prende os alvos à distância com teias e depois avança com mordida venenosa e garras; também pode estrangular com um laço de teia quem estiver em desvantagem.",
  "lore": "O ettercap é uma criatura de feições humanoides e corpo de aranha que cria e protege aranhas como um pastor cuida do rebanho. Vive no fundo de florestas isoladas, que acaba transformando em lugares sombrios, tomados por teias e predadores. Persegue viajantes em silêncio, guiando-os para armadilhas de seda ou atacando-os com veneno e laços estranguladores. Odeia as fadas: caça sprites e pixies para devorá-las e tenta aprisionar dríades envolvendo suas árvores em teia."
 },
 "ettin": {
  "id": "ettin",
  "tipo": "gigante",
  "name": "Ettin",
  "nomeOriginal": "Ettin",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "4",
  "xp": 1100,
  "abilities": {
   "str": 21,
   "dex": 8,
   "con": 17,
   "int": 6,
   "wis": 10,
   "cha": 8
  },
  "ac": 12,
  "acNote": "armadura natural",
  "maxHp": 85,
  "hpDice": "10d10+30",
  "speedFt": 40,
  "senses": {
   "passivePerception": 14,
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
    "name": "Machado de Batalha",
    "bonus": 7,
    "damage": "2d8+5",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Maça-Estrela",
    "bonus": 7,
    "damage": "2d8+5",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Machado de Batalha",
    "Maça-Estrela"
   ]
  },
  "traits": [
   "t_duasCabecas",
   "sempreAlerta"
  ],
  "blurb": "Gigante de duas cabeças que ataca com um machado de batalha e uma maça-estrela no mesmo turno, causando muito dano corpo a corpo. As duas cabeças tornam difícil surpreendê-lo, cegá-lo, enfeitiçá-lo ou atordoá-lo.",
  "lore": "O ettin é um gigante imundo de duas cabeças com traços brutos de orc, coberto de sujeira e peles fedorentas. Cada cabeça tem nome, mente e manias próprias, e as duas vivem brigando entre si. Por isso costumam viver sozinhos em colinas, montanhas e no Subterrâneo, encontrando outros da espécie só para se reproduzir. Lendas dizem que surgiram de orcs transformados num templo de Demogorgon, e as tribos orcs ainda os contratam como guardas e saqueadores em troca de comida e pilhagem."
 },
 "dragaoFeericoAzul": {
  "id": "dragaoFeericoAzul",
  "tipo": "dragão",
  "name": "Dragão Feérico (Azul)",
  "nomeOriginal": "Faerie Dragon (Blue)",
  "fonte": "MM",
  "size": "miúdo",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 3,
   "dex": 20,
   "con": 13,
   "int": 14,
   "wis": 12,
   "cha": 16
  },
  "ac": 15,
  "maxHp": 14,
  "hpDice": "4d4+4",
  "speedFt": 10,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60
  },
  "senses": {
   "passivePerception": 13,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "arcanismo",
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 7,
    "damage": 1,
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "borrifoDeCores",
    "luzesDancantes",
    "maoMagica",
    "imagemMaior",
    "ilusaoMenor",
    "imagemEspelhada",
    "sugestao"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "borrifoDeCores": 1,
    "luzesDancantes": 1,
    "maoMagica": 1,
    "imagemMaior": 1,
    "ilusaoMenor": 1,
    "imagemEspelhada": 1,
    "sugestao": 1
   },
   "cdPorMagia": {
    "borrifoDeCores": 13,
    "luzesDancantes": 13,
    "maoMagica": 13,
    "imagemMaior": 13,
    "ilusaoMenor": 13,
    "imagemEspelhada": 13,
    "sugestao": 13
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Sopro de Euforia",
    "recharge": [
     5,
     6
    ],
    "tipo": "alvo",
    "alcanceFt": 5,
    "save": "wis",
    "dc": 11,
    "condition": "euforico",
    "rounds": 10,
    "repete": false
   }
  ],
  "traits": [
   "t_asCoresDaIdade",
   "invisivelAVontade",
   "t_telepatiaLimitada",
   "resistenciaAMagia"
  ],
  "blurb": "Fica invisível, confunde os inimigos com ilusões e magias como sugestão e imagem maior, e usa seu sopro de euforia para deixar um alvo vagando sem rumo. Frágil em combate direto, mas muito difícil de acertar e de enfeitiçar.",
  "lore": "Pequeno dragão do tamanho de um gato, com asas de borboleta, que vive em florestas encantadas e clareiras feéricas. Brincalhão e travesso, adora pregar peças em viajantes usando ilusões, mas raramente é cruel. Suas escamas mudam de cor com a idade, e o tom azul indica um indivíduo entre 31 e 40 anos. Costuma agir com outros de sua espécie, conversando por telepatia para coordenar as brincadeiras."
 },
 "dragaoFeericoVerde": {
  "id": "dragaoFeericoVerde",
  "tipo": "dragão",
  "name": "Dragão Feérico (Verde)",
  "nomeOriginal": "Faerie Dragon (Green)",
  "fonte": "MM",
  "size": "miúdo",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 3,
   "dex": 20,
   "con": 13,
   "int": 14,
   "wis": 12,
   "cha": 16
  },
  "ac": 15,
  "maxHp": 14,
  "hpDice": "4d4+4",
  "speedFt": 10,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60
  },
  "senses": {
   "passivePerception": 13,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "arcanismo",
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 7,
    "damage": 1,
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "borrifoDeCores",
    "luzesDancantes",
    "maoMagica",
    "ilusaoMenor",
    "imagemEspelhada",
    "sugestao"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "borrifoDeCores": 1,
    "luzesDancantes": 1,
    "maoMagica": 1,
    "ilusaoMenor": 1,
    "imagemEspelhada": 1,
    "sugestao": 1
   },
   "cdPorMagia": {
    "borrifoDeCores": 13,
    "luzesDancantes": 13,
    "maoMagica": 13,
    "ilusaoMenor": 13,
    "imagemEspelhada": 13,
    "sugestao": 13
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Sopro de Euforia",
    "recharge": [
     5,
     6
    ],
    "tipo": "alvo",
    "alcanceFt": 5,
    "save": "wis",
    "dc": 11,
    "condition": "euforico",
    "rounds": 10,
    "repete": false
   }
  ],
  "traits": [
   "t_asCoresDaIdade",
   "invisivelAVontade",
   "t_telepatiaLimitada",
   "resistenciaAMagia"
  ],
  "blurb": "Pequeno, veloz e quase sempre invisível, confunde os inimigos com ilusões, rajadas de cores e sugestões mágicas. Seu sopro de euforia deixa o alvo vagando a esmo, sem reações.",
  "lore": "Os dragões feéricos são parentes minúsculos dos grandes dragões e vivem em florestas encantadas, perto de clareiras e riachos ligados ao mundo das fadas. Adoram pregar peças e fazer travessuras, mas raramente têm intenções cruéis. As escamas mudam de cor com a idade, e os de tom verde já passaram dos vinte anos e dominam mais magia. Costumam observar viajantes escondidos antes de decidir se vão ajudá-los ou atormentá-los."
 },
 "dragaoFeericoIndigo": {
  "id": "dragaoFeericoIndigo",
  "tipo": "dragão",
  "name": "Dragão Feérico (Índigo)",
  "nomeOriginal": "Faerie Dragon (Indigo)",
  "fonte": "MM",
  "size": "miúdo",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 3,
   "dex": 20,
   "con": 13,
   "int": 14,
   "wis": 12,
   "cha": 16
  },
  "ac": 15,
  "maxHp": 14,
  "hpDice": "4d4+4",
  "speedFt": 10,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60
  },
  "senses": {
   "passivePerception": 13,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "arcanismo",
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 7,
    "damage": 1,
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "borrifoDeCores",
    "luzesDancantes",
    "maoMagica",
    "imagemMaior",
    "ilusaoMenor",
    "imagemEspelhada",
    "sugestao"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "borrifoDeCores": 1,
    "luzesDancantes": 1,
    "maoMagica": 1,
    "imagemMaior": 1,
    "ilusaoMenor": 1,
    "imagemEspelhada": 1,
    "sugestao": 1
   },
   "cdPorMagia": {
    "borrifoDeCores": 13,
    "luzesDancantes": 13,
    "maoMagica": 13,
    "imagemMaior": 13,
    "ilusaoMenor": 13,
    "imagemEspelhada": 13,
    "sugestao": 13
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Sopro da Euforia",
    "recharge": [
     5,
     6
    ],
    "tipo": "alvo",
    "alcanceFt": 5,
    "save": "wis",
    "dc": 11,
    "condition": "euforico",
    "rounds": 10,
    "repete": false
   }
  ],
  "traits": [
   "t_asCoresDaIdade",
   "invisivelAVontade",
   "t_telepatiaLimitada",
   "resistenciaAMagia"
  ],
  "blurb": "Pequeno e quase sempre invisível, confunde os inimigos com ilusões, sugestões e um sopro eufórico que os faz vagar sem rumo. Frágil em combate direto, mas difícil de acertar e de encontrar.",
  "lore": "Dragões fada são parentes minúsculos e brincalhões dos grandes dragões, vivendo em florestas encantadas e clareiras feéricas. Suas escamas mudam de cor com a idade, e o tom índigo indica um exemplar de quarenta e poucos anos, já hábil em magias de ilusão. Adoram pregar peças em viajantes, mas raramente são cruéis. Quando ameaçados, preferem sumir e enganar a lutar de frente."
 },
 "dragaoFeericoLaranja": {
  "id": "dragaoFeericoLaranja",
  "tipo": "dragão",
  "name": "Dragão Feérico (Laranja)",
  "nomeOriginal": "Faerie Dragon (Orange)",
  "fonte": "MM",
  "size": "miúdo",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 3,
   "dex": 20,
   "con": 13,
   "int": 14,
   "wis": 12,
   "cha": 16
  },
  "ac": 15,
  "maxHp": 14,
  "hpDice": "4d4+4",
  "speedFt": 10,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60
  },
  "senses": {
   "passivePerception": 13,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "arcanismo",
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 7,
    "damage": 1,
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "borrifoDeCores",
    "luzesDancantes",
    "maoMagica",
    "ilusaoMenor"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "borrifoDeCores": 1,
    "luzesDancantes": 1,
    "maoMagica": 1,
    "ilusaoMenor": 1
   },
   "cdPorMagia": {
    "borrifoDeCores": 13,
    "luzesDancantes": 13,
    "maoMagica": 13,
    "ilusaoMenor": 13
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Sopro de Euforia",
    "recharge": [
     5,
     6
    ],
    "tipo": "alvo",
    "alcanceFt": 5,
    "save": "wis",
    "dc": 11,
    "condition": "euforico",
    "rounds": 10,
    "repete": false
   }
  ],
  "traits": [
   "t_asCoresDaIdade",
   "invisivelAVontade",
   "t_telepatiaLimitada",
   "resistenciaAMagia"
  ],
  "blurb": "Pequeno e travesso, fica invisível à vontade e confunde os inimigos com ilusões, spray de cores e um sopro de euforia que os faz vagar sem rumo. Sua mordida quase não causa dano.",
  "lore": "Dragões feéricos são parentes minúsculos dos grandes dragões, com asas de borboleta e escamas que mudam de cor conforme envelhecem. Os laranja têm entre 6 e 10 anos e já dominam algumas magias inatas. Vivem em florestas encantadas, muitas vezes ligados à corte das fadas. Adoram pregar peças em viajantes, mas raramente são cruéis, preferindo brincadeiras a ferimentos."
 },
 "dragaoFeericoVermelho": {
  "id": "dragaoFeericoVermelho",
  "tipo": "dragão",
  "name": "Dragão Feérico (Vermelho)",
  "nomeOriginal": "Faerie Dragon (Red)",
  "fonte": "MM",
  "size": "miúdo",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 3,
   "dex": 20,
   "con": 13,
   "int": 14,
   "wis": 12,
   "cha": 16
  },
  "ac": 15,
  "maxHp": 14,
  "hpDice": "4d4+4",
  "speedFt": 10,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60
  },
  "senses": {
   "passivePerception": 13,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "arcanismo",
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 7,
    "damage": 1,
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "luzesDancantes",
    "maoMagica",
    "ilusaoMenor"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "luzesDancantes": 1,
    "maoMagica": 1,
    "ilusaoMenor": 1
   },
   "cdPorMagia": {
    "luzesDancantes": 13,
    "maoMagica": 13,
    "ilusaoMenor": 13
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Sopro de Euforia",
    "recharge": [
     5,
     6
    ],
    "tipo": "alvo",
    "alcanceFt": 5,
    "save": "wis",
    "dc": 11,
    "condition": "euforico",
    "rounds": 10,
    "repete": false
   }
  ],
  "traits": [
   "t_asCoresDaIdade",
   "invisivelAVontade",
   "t_telepatiaLimitada",
   "resistenciaAMagia"
  ],
  "blurb": "Minúsculo e travesso, some com invisibilidade superior e confunde os inimigos com ilusões e um sopro de euforia que os faz vagar sem rumo. Quase não causa dano, mas é difícil de acertar e resiste à magia.",
  "lore": "Dragões feéricos são parentes diminutos dos grandes dragões, nascidos em florestas encantadas tocadas pela magia das fadas. As escamas vermelhas indicam um filhote de no máximo cinco anos, que ainda conhece poucos truques. Brincalhões e curiosos, preferem pregar peças a ferir alguém e raramente lutam até a morte. Costumam se esconder invisíveis e observar viajantes antes de decidir se vão ajudá-los ou atormentá-los."
 },
 "dragaoFeericoVioleta": {
  "id": "dragaoFeericoVioleta",
  "tipo": "dragão",
  "name": "Dragão Feérico (Violeta)",
  "nomeOriginal": "Faerie Dragon (Violet)",
  "fonte": "MM",
  "size": "miúdo",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 3,
   "dex": 20,
   "con": 13,
   "int": 14,
   "wis": 12,
   "cha": 16
  },
  "ac": 15,
  "maxHp": 14,
  "hpDice": "4d4+4",
  "speedFt": 10,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60
  },
  "senses": {
   "passivePerception": 13,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "arcanismo",
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 7,
    "damage": 1,
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "borrifoDeCores",
    "luzesDancantes",
    "maoMagica",
    "imagemMaior",
    "ilusaoMenor",
    "imagemEspelhada",
    "metamorfose",
    "sugestao"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "borrifoDeCores": 1,
    "luzesDancantes": 1,
    "maoMagica": 1,
    "imagemMaior": 1,
    "ilusaoMenor": 1,
    "imagemEspelhada": 1,
    "metamorfose": 1,
    "sugestao": 1
   },
   "cdPorMagia": {
    "borrifoDeCores": 13,
    "luzesDancantes": 13,
    "maoMagica": 13,
    "imagemMaior": 13,
    "ilusaoMenor": 13,
    "imagemEspelhada": 13,
    "metamorfose": 13,
    "sugestao": 13
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Sopro da Euforia",
    "recharge": [
     5,
     6
    ],
    "tipo": "alvo",
    "alcanceFt": 5,
    "save": "wis",
    "dc": 11,
    "condition": "euforico",
    "rounds": 10,
    "repete": false
   }
  ],
  "traits": [
   "t_asCoresDaIdade",
   "invisivelAVontade",
   "t_telepatiaLimitada",
   "resistenciaAMagia"
  ],
  "blurb": "Pequeno e quase intocável, some na invisibilidade e confunde os inimigos com ilusões, polimorfia e um sopro de euforia que os faz vagar sem rumo.",
  "lore": "Os dragões das fadas são parentes minúsculos dos grandes dragões, nascidos da magia feérica das florestas. As escamas mudam de cor com a idade, e os violetas são os mais velhos, com mais de meio século e o repertório mágico mais vasto. Brincalhões e travessos, adoram pregar peças em viajantes, mas raramente buscam causar mal de verdade. Costumam esconder-se invisíveis e conversar entre si por telepatia enquanto planejam suas brincadeiras."
 },
 "dragaoFeericoAmarelo": {
  "id": "dragaoFeericoAmarelo",
  "tipo": "dragão",
  "name": "Dragão Feérico (Amarelo)",
  "nomeOriginal": "Faerie Dragon (Yellow)",
  "fonte": "MM",
  "size": "miúdo",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 3,
   "dex": 20,
   "con": 13,
   "int": 14,
   "wis": 12,
   "cha": 16
  },
  "ac": 15,
  "maxHp": 14,
  "hpDice": "4d4+4",
  "speedFt": 10,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60
  },
  "senses": {
   "passivePerception": 13,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "arcanismo",
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 7,
    "damage": 1,
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "borrifoDeCores",
    "luzesDancantes",
    "maoMagica",
    "ilusaoMenor",
    "imagemEspelhada"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "borrifoDeCores": 1,
    "luzesDancantes": 1,
    "maoMagica": 1,
    "ilusaoMenor": 1,
    "imagemEspelhada": 1
   },
   "cdPorMagia": {
    "borrifoDeCores": 13,
    "luzesDancantes": 13,
    "maoMagica": 13,
    "ilusaoMenor": 13,
    "imagemEspelhada": 13
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Sopro de Euforia",
    "recharge": [
     5,
     6
    ],
    "tipo": "alvo",
    "alcanceFt": 5,
    "save": "wis",
    "dc": 11,
    "condition": "euforico",
    "rounds": 10,
    "repete": false
   }
  ],
  "traits": [
   "t_asCoresDaIdade",
   "invisivelAVontade",
   "t_telepatiaLimitada",
   "resistenciaAMagia"
  ],
  "blurb": "Minúsculo e veloz, fica invisível com uma ação bônus e confunde os inimigos com ilusões e seu sopro de euforia. Seu dano é quase nulo, mas ele desorganiza o grupo inteiro.",
  "lore": "Dragões feéricos são parentes diminutos dos grandes dragões, com asas de borboleta e escamas que mudam de cor com o passar dos anos. Vivem em florestas encantadas, muitas vezes perto de portais para o reino das fadas. São brincalhões e curiosos, adoram pregar peças em viajantes e raramente fazem mal de verdade. O amarelo tem entre 11 e 20 anos e já domina várias magias de ilusão."
 },
 "elementalDoFogo": {
  "id": "elementalDoFogo",
  "tipo": "elemental",
  "name": "Elemental do Fogo",
  "nomeOriginal": "Fire Elemental",
  "fonte": "MM",
  "size": "grande",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 10,
   "dex": 17,
   "con": 16,
   "int": 6,
   "wis": 10,
   "cha": 7
  },
  "ac": 13,
  "maxHp": 102,
  "hpDice": "12d10+36",
  "speedFt": 50,
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "damageImmunities": [
   "fogo",
   "veneno"
  ],
  "conditionImmunities": [
   "exausto",
   "agarrado",
   "paralisado",
   "petrificado",
   "envenenado",
   "caido",
   "contido",
   "inconsciente"
  ],
  "attacks": [
   {
    "name": "Toque",
    "bonus": 6,
    "damage": "2d6+3",
    "type": "fogo",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d10",
     "type": "fogo"
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Toque",
    "Toque"
   ]
  },
  "corpoQuente": {
   "damage": "1d10",
   "type": "fogo"
  },
  "luzPropria": {
   "claro": 30,
   "penumbra": 30
  },
  "traits": [
   "formaFluida"
  ],
  "blurb": "Uma chama viva e veloz que invade o espaço dos inimigos e os incendeia a cada toque. Quem o golpeia de perto também se queima, mas a água o fere.",
  "lore": "Elementais do fogo são fragmentos do Plano Elemental do Fogo dotados de uma vontade simples e voraz. Costumam surgir quando conjurados por magos ou em regiões de calor extremo, como desertos e vulcões. Movem-se como labaredas inquietas, consumindo tudo o que é inflamável pelo caminho. Não têm malícia própria, apenas o impulso de queimar, e evitam a água como quem evita a morte."
 },
 "giganteDoFogo": {
  "id": "giganteDoFogo",
  "tipo": "gigante",
  "name": "Gigante do Fogo",
  "nomeOriginal": "Fire Giant",
  "fonte": "MM",
  "size": "enorme",
  "level": 9,
  "cr": "9",
  "xp": 5000,
  "abilities": {
   "str": 25,
   "dex": 9,
   "con": 23,
   "int": 10,
   "wis": 14,
   "cha": 13
  },
  "ac": 18,
  "acNote": "armadura de placas",
  "maxHp": 162,
  "hpDice": "13d12+78",
  "speedFt": 30,
  "senses": {
   "passivePerception": 16
  },
  "saves": [
   "dex",
   "con",
   "cha"
  ],
  "skills": [
   "atletismo",
   "percepcao"
  ],
  "expertise": [],
  "damageImmunities": [
   "fogo"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Espada Grande",
    "bonus": 11,
    "damage": "6d6+7",
    "type": "cortante",
    "reachFt": 10
   },
   {
    "name": "Pedra",
    "bonus": 11,
    "damage": "4d10+7",
    "type": "concussão",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 60,
    "longRangeFt": 240
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Espada Grande",
    "Espada Grande"
   ]
  },
  "traits": [],
  "blurb": "Brutamontes de armadura pesada que golpeia duas vezes com uma espada grande de alcance longo e arremessa pedras enormes à distância. É imune a fogo e cada golpe causa dano devastador.",
  "lore": "Os gigantes do fogo são ferreiros e guerreiros orgulhosos, que erguem fortalezas em vulcões, montanhas e cavernas profundas do Subterrâneo. Vivem sob uma hierarquia militar rígida e valorizam a força e a habilidade na forja acima de tudo. Costumam escravizar povos menores para trabalhar em suas minas e forjas. Em batalha, avançam em formação disciplinada, vestidos com placas de metal que eles mesmos forjaram."
 },
 "serpenteDeFogo": {
  "id": "serpenteDeFogo",
  "tipo": "elemental",
  "name": "Serpente de Fogo",
  "nomeOriginal": "Fire Snake",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 12,
   "dex": 14,
   "con": 11,
   "int": 7,
   "wis": 10,
   "cha": 8
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 22,
  "hpDice": "5d8",
  "speedFt": 30,
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "damageImmunities": [
   "fogo"
  ],
  "damageVulnerabilities": [
   "frio"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 3,
    "damage": "1d4+1",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d6",
     "type": "fogo"
    }
   },
   {
    "name": "Cauda",
    "bonus": 3,
    "damage": "1d4+1",
    "type": "concussão",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d6",
     "type": "fogo"
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Mordida",
    "Cauda"
   ]
  },
  "corpoQuente": {
   "damage": "1d6",
   "type": "fogo"
  },
  "traits": [
   "corpoQuente"
  ],
  "blurb": "Ataca com mordida e cauda incandescentes, somando dano de fogo a cada golpe. Encostar nela ou golpeá-la de perto queima o atacante.",
  "lore": "A serpente de fogo é a forma jovem de uma salamandra, um elemental nascido do Plano Elemental do Fogo. Seu corpo serpentino brilha em brasa e deixa marcas chamuscadas por onde rasteja. Costuma aparecer em cavernas vulcânicas do Subterrâneo ou servindo salamandras e outros seres ígneos. Entende o ígneo, mas não fala, e age de forma instintiva e agressiva."
 },
 "golemDeCarne": {
  "id": "golemDeCarne",
  "tipo": "constructo",
  "name": "Golem de Carne",
  "nomeOriginal": "Flesh Golem",
  "fonte": "MM",
  "size": "médio",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 19,
   "dex": 9,
   "con": 18,
   "int": 6,
   "wis": 10,
   "cha": 5
  },
  "ac": 9,
  "maxHp": 93,
  "hpDice": "11d8+44",
  "speedFt": 30,
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "damageImmunities": [
   "elétrico",
   "veneno",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageImmunitiesNote": "só de armas não mágicas",
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
    "bonus": 7,
    "damage": "2d8+4",
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
  "traits": [
   "furorDoGolem",
   "t_aversaoAoFogo",
   "formaImutavel",
   "absorcaoDeRaios",
   "resistenciaAMagia",
   "armasMagicas"
  ],
  "blurb": "Bate duas vezes por turno com punhos pesados e ignora armas comuns. Ferido gravemente, pode entrar em fúria e atacar quem estiver mais perto; o fogo o atrapalha e a eletricidade o cura.",
  "lore": "É um corpo costurado com pedaços de cadáveres e animado por magia, normalmente por um espírito elemental preso dentro dele. Serve ao criador com obediência cega e fica de guarda em laboratórios, criptas e torres de magos. Não sente medo nem cansaço, mas o vínculo com o espírito é instável. Sob muita dor, ele pode se descontrolar e destruir tudo ao redor."
 },
 "flumph": {
  "id": "flumph",
  "tipo": "aberração",
  "name": "Flumph",
  "nomeOriginal": "Flumph",
  "fonte": "MM",
  "size": "pequeno",
  "level": 1,
  "cr": "1/8",
  "xp": 25,
  "abilities": {
   "str": 6,
   "dex": 15,
   "con": 10,
   "int": 14,
   "wis": 14,
   "cha": 11
  },
  "ac": 12,
  "maxHp": 7,
  "hpDice": "2d6",
  "speedFt": 5,
  "flyFt": 30,
  "speeds": {
   "flyFt": 30
  },
  "senses": {
   "passivePerception": 12,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "arcanismo",
   "historia",
   "religiao"
  ],
  "expertise": [],
  "damageVulnerabilities": [
   "psíquico"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Tentáculos",
    "bonus": 4,
    "damage": "1d4+2",
    "type": "perfurante",
    "reachFt": 5,
    "onHit": {
     "save": "con",
     "dc": 10,
     "danoSeFalhar": {
      "damage": "1d4",
      "type": "ácido"
     },
     "metadeSePassar": false
    }
   }
  ],
  "acoesEspeciais": [
   {
    "nome": "Jato Fedorento",
    "porDia": 1,
    "tipo": "area",
    "shape": "cone",
    "areaFt": 15,
    "save": "dex",
    "dc": 10,
    "condition": "envenenado",
    "rounds": 10,
    "repete": false
   }
  ],
  "traits": [
   "t_telepatiaAvancada",
   "deficienciaCaido",
   "t_veuTelepatico"
  ],
  "blurb": "Pequena aberração voadora que fere com tentáculos ácidos cujo efeito persiste a cada turno, e uma vez por dia lança um jato fedorento que deixa os inimigos envenenados. Frágil, fica indefesa se cair de costas.",
  "lore": "Os flumphs parecem águas-vivas flutuantes que vagam pelo Subterrâneo, impulsionados por jatos de ar que produzem o som que lhes dá nome. Seu brilho suave muda de cor conforme o humor: rosa quando se divertem, azul na tristeza, verde na curiosidade e carmesim na raiva. São seres telepáticos muito sábios, que se alimentam discretamente da energia mental de criaturas psiônicas como devoradores de mentes e githyanki. Como absorvem os pensamentos sombrios dessas criaturas, costumam procurar aventureiros de bom coração para revelar segredos e ajudar a derrubar o mal. Vivem em claustros harmoniosos, sem líderes, onde cada um tem seu papel."
 },
 "serpenteVoadora": {
  "id": "serpenteVoadora",
  "tipo": "fera",
  "name": "Serpente Voadora",
  "nomeOriginal": "Flying Snake",
  "fonte": "MM",
  "size": "miúdo",
  "level": 1,
  "cr": "1/8",
  "xp": 25,
  "abilities": {
   "str": 4,
   "dex": 18,
   "con": 11,
   "int": 2,
   "wis": 12,
   "cha": 5
  },
  "ac": 14,
  "maxHp": 5,
  "hpDice": "2d4",
  "speedFt": 30,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60,
   "swimFt": 30
  },
  "senses": {
   "passivePerception": 11,
   "blindsightFt": 10
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 6,
    "damage": "3d4",
    "type": "veneno",
    "reachFt": 5
   }
  ],
  "traits": [
   "voaSemProvocar"
  ],
  "blurb": "Pequena e veloz, ataca em voo com uma mordida carregada de veneno e se afasta sem sofrer ataques de oportunidade. Frágil, mas o veneno dói mais do que parece.",
  "lore": "É uma cobra alada de cores vivas que habita selvas distantes e pouco exploradas. Apesar do tamanho minúsculo, sua peçonha é potente. Algumas tribos e seitas a criam e treinam como mensageira. Nesse papel, ela leva pergaminhos enrolados no próprio corpo até o destinatário."
 },
 "espadaVoadora": {
  "id": "espadaVoadora",
  "tipo": "constructo",
  "name": "Espada Voadora",
  "nomeOriginal": "Flying Sword",
  "fonte": "MM",
  "size": "pequeno",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 12,
   "dex": 15,
   "con": 11,
   "int": 1,
   "wis": 5,
   "cha": 1
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 17,
  "hpDice": "5d6",
  "speedFt": 0,
  "flyFt": 50,
  "hover": true,
  "speeds": {
   "flyFt": 50
  },
  "senses": {
   "passivePerception": 7,
   "blindsightFt": 60
  },
  "saves": [
   "dex"
  ],
  "skills": [],
  "expertise": [],
  "damageImmunities": [
   "veneno",
   "psíquico"
  ],
  "conditionImmunities": [
   "cego",
   "enfeitiçado",
   "surdo",
   "amedrontado",
   "paralisado",
   "petrificado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Espada Longa",
    "bonus": 3,
    "damage": "1d8+1",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "traits": [
   "suscetibilidadeAntimagica",
   "aparenciaFalsa"
  ],
  "blurb": "Uma lâmina encantada que paira no ar e investe rapidamente contra os inimigos, golpeando com cortes precisos. É frágil, mas difícil de acertar e imune a veneno e a efeitos mentais.",
  "lore": "A espada voadora é um objeto animado por magia, geralmente posta como guardiã por magos ou em salas de tesouro. Ela não pensa nem sente: apenas cumpre as ordens simples de quem a encantou. Costuma ficar pendurada em paredes ou caída no chão, parecendo uma arma comum, até que um intruso se aproxime. Percebe o ambiente sem olhos, por uma espécie de sentido mágico de curto alcance."
 },
 "fomoriano": {
  "id": "fomoriano",
  "tipo": "gigante",
  "name": "Fomoriano",
  "nomeOriginal": "Fomorian",
  "fonte": "MM",
  "size": "enorme",
  "level": 5,
  "cr": "8",
  "xp": 3900,
  "abilities": {
   "str": 23,
   "dex": 10,
   "con": 20,
   "int": 9,
   "wis": 14,
   "cha": 6
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 149,
  "hpDice": "13d12+65",
  "speedFt": 30,
  "senses": {
   "passivePerception": 18,
   "darkvisionFt": 120
  },
  "saves": [],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Porrete Grande",
    "bonus": 9,
    "damage": "3d8+6",
    "type": "concussão",
    "reachFt": 15
   }
  ],
  "multiattack": {
   "count": 1,
   "sequence": [
    "Porrete Grande"
   ]
  },
  "acoesEspeciais": [
   {
    "nome": "Olho Maligno",
    "tipo": "alvo",
    "alcanceFt": 60,
    "save": "cha",
    "dc": 14,
    "damage": "6d8",
    "damageType": "psíquico",
    "halfOnSave": true
   },
   {
    "nome": "Maldição do Olho Maligno",
    "tipo": "alvo",
    "alcanceFt": 60,
    "save": "cha",
    "dc": 14,
    "damage": "6d8",
    "damageType": "psíquico",
    "halfOnSave": true,
    "condition": "deformado",
    "rounds": 100,
    "repete": false,
    "porDia": 1
   }
  ],
  "traits": [],
  "blurb": "Gigante deformado que esmaga com um enorme porrete a 4,5 m de alcance e lança um olhar maligno que causa dano psíquico. Seu olhar amaldiçoado pode deixar um alvo lento e fraco por dias.",
  "lore": "Os fomorianos já foram gigantes belos e poderosos em magia, até tentarem dominar a Agrestia das Fadas e serem amaldiçoados pelas fadas unidas. Hoje têm corpos retorcidos, com olhos, orelhas e bocas fora do lugar, e se escondem em cavernas do Subterrâneo perto de água e florestas de cogumelos. Vivem de escravos, que devoram quando já não servem, e os mais cruéis comandam os demais. Sentidos estranhamente aguçados os tornam difíceis de surpreender, e traem qualquer aliado sem hesitar."
 },
 "ra": {
  "id": "ra",
  "tipo": "fera",
  "name": "Rã",
  "nomeOriginal": "Frog",
  "fonte": "MM",
  "size": "miúdo",
  "level": 1,
  "cr": "0",
  "xp": 10,
  "abilities": {
   "str": 1,
   "dex": 13,
   "con": 8,
   "int": 1,
   "wis": 8,
   "cha": 3
  },
  "ac": 11,
  "maxHp": 1,
  "hpDice": "1d4-1",
  "speedFt": 20,
  "speeds": {
   "swimFt": 20
  },
  "senses": {
   "passivePerception": 11,
   "darkvisionFt": 30
  },
  "saves": [],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "traits": [
   "t_saltoParado"
  ],
  "blurb": "Não tem ataques que valham alguma coisa; seu único recurso é saltar para longe e se esconder na água ou na vegetação.",
  "lore": "Pequeno anfíbio que se alimenta de insetos minúsculos. Costuma viver perto de lagoas e riachos, mas também aparece em árvores e em cavernas subterrâneas. É inofensivo e foge diante de qualquer ameaça. As mesmas estatísticas servem para representar uma rã ou um sapo-cururu, e é um familiar comum de magos."
 },
 "giganteDoGelo": {
  "id": "giganteDoGelo",
  "tipo": "gigante",
  "name": "Gigante do Gelo",
  "nomeOriginal": "Frost Giant",
  "fonte": "MM",
  "size": "enorme",
  "level": 5,
  "cr": "8",
  "xp": 3900,
  "abilities": {
   "str": 23,
   "dex": 9,
   "con": 21,
   "int": 9,
   "wis": 10,
   "cha": 12
  },
  "ac": 15,
  "acNote": "armadura de retalhos",
  "maxHp": 138,
  "hpDice": "12d12+60",
  "speedFt": 40,
  "senses": {
   "passivePerception": 13
  },
  "saves": [
   "con",
   "wis",
   "cha"
  ],
  "skills": [
   "atletismo",
   "percepcao"
  ],
  "expertise": [],
  "damageImmunities": [
   "frio"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Machado Grande",
    "bonus": 9,
    "damage": "3d12+6",
    "type": "cortante",
    "reachFt": 10
   },
   {
    "name": "Rocha",
    "bonus": 9,
    "damage": "4d10+6",
    "type": "concussão",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 60,
    "longRangeFt": 240
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Machado Grande",
    "Machado Grande"
   ]
  },
  "traits": [],
  "blurb": "Brutamontes enorme que racha inimigos com dois golpes de machado grande de 3 m de alcance e arremessa pedras a longa distância. Imune a frio e muito resistente.",
  "lore": "Gigantes do gelo são saqueadores colossais das tundras geladas e dos picos nevados. Vivem em clãs que valorizam a força bruta acima de tudo e medem a honra pelo sucesso nas caçadas e pilhagens. Vestem peles e pedaços de armaduras tomadas de vítimas, costurados de qualquer jeito. Descem das montanhas no inverno para atacar vilarejos e roubar comida, gado e tesouros."
 },
 "gargula": {
  "id": "gargula",
  "tipo": "elemental",
  "name": "Gárgula",
  "nomeOriginal": "Gargoyle",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 15,
   "dex": 11,
   "con": 16,
   "int": 6,
   "wis": 11,
   "cha": 7
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 52,
  "hpDice": "7d8+21",
  "speedFt": 30,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60
  },
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "damageImmunities": [
   "veneno"
  ],
  "conditionImmunities": [
   "exausto",
   "petrificado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 4,
    "damage": "1d6+2",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Garras",
    "bonus": 4,
    "damage": "1d6+2",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Mordida",
    "Garras"
   ]
  },
  "traits": [
   "aparenciaFalsa"
  ],
  "blurb": "Fica imóvel como estátua até o momento do bote, então ataca com mordida e garras e pode voar a 18 m. Golpes comuns não mágicos e que não sejam de adamante pouco a ferem.",
  "lore": "A gárgula é um ser maligno de terra elemental com aparência de estátua grotesca e demoníaca. Empoleira-se em telhados, catedrais, penhascos e cavernas, e consegue passar anos sem se mover, o que a torna uma sentinela perfeita. Seu prazer está no susto que provoca ao ganhar vida e na dor que causa às vítimas. Costuma servir de bom grado a demônios e conjuradores cruéis, guardando portões e muralhas sem reclamar. Não precisa respirar, comer, beber nem dormir."
 },
 "esporoDeGas": {
  "id": "esporoDeGas",
  "tipo": "planta",
  "name": "Esporo de Gás",
  "nomeOriginal": "Gas Spore",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "1/2",
  "xp": 100,
  "abilities": {
   "str": 5,
   "dex": 1,
   "con": 3,
   "int": 1,
   "wis": 1,
   "cha": 1
  },
  "ac": 5,
  "maxHp": 1,
  "hpDice": "1d10-4",
  "speedFt": 0,
  "flyFt": 10,
  "hover": true,
  "speeds": {
   "flyFt": 10
  },
  "senses": {
   "passivePerception": 5,
   "blindsightFt": 30
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "damageImmunities": [
   "veneno"
  ],
  "conditionImmunities": [
   "cego",
   "surdo",
   "amedrontado",
   "paralisado",
   "envenenado",
   "caido"
  ],
  "attacks": [
   {
    "name": "Toque",
    "bonus": 0,
    "damage": 1,
    "type": "veneno",
    "reachFt": 5
   }
  ],
  "explosaoAoMorrer": {
   "pes": 20,
   "save": "con",
   "dc": 15,
   "condicao": "envenenado",
   "rounds": 1,
   "dano": "3d6",
   "tipo": "veneno",
   "metade": false
  },
  "traits": [
   "explosaoAoMorrer",
   "t_semelhancaInquietante"
  ],
  "blurb": "Flutua devagar até os inimigos e quase não resiste a golpes, mas explode ao morrer, espalhando veneno e uma doença fatal num raio de 6 m. Mate-o de longe.",
  "lore": "O esporo de gás é um fungo inflado que flutua pelas cavernas do Subterrâneo e lembra muito um observador. Muitos aventureiros o atacam achando que enfrentam o tirano ocular e acabam pegos pela explosão. Ele não pensa nem planeja: apenas vaga em direção a criaturas vivas que percebe por perto. Quem é infectado por seus esporos pode morrer em poucas horas e servir de berço para novos esporos."
 },
 "cuboGelatinoso": {
  "id": "cuboGelatinoso",
  "tipo": "gosma",
  "name": "Cubo Gelatinoso",
  "nomeOriginal": "Gelatinous Cube",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 14,
   "dex": 3,
   "con": 20,
   "int": 1,
   "wis": 6,
   "cha": 1
  },
  "ac": 6,
  "maxHp": 84,
  "hpDice": "8d10+40",
  "speedFt": 15,
  "senses": {
   "passivePerception": 8,
   "blindsightFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [
   "cego",
   "enfeitiçado",
   "surdo",
   "exausto",
   "amedrontado",
   "caido"
  ],
  "attacks": [
   {
    "name": "Pseudópode",
    "bonus": 4,
    "damage": "3d6",
    "type": "ácido",
    "reachFt": 5
   }
  ],
  "acoesEspeciais": [
   {
    "nome": "Engolfar",
    "tipo": "engolfar",
    "save": "dex",
    "dc": 12,
    "dano": "3d6",
    "danoPorTurno": "6d6",
    "tipoDano": "ácido"
   }
  ],
  "traits": [
   "t_cuboDeLimo",
   "t_transparente"
  ],
  "blurb": "Avança lentamente e engole quem estiver no caminho, prendendo a vítima dentro de si enquanto o ácido a dissolve a cada turno. Quase invisível parado, costuma pegar o grupo de surpresa.",
  "lore": "O cubo gelatinoso é um limo em forma de bloco que patrulha corredores de masmorras seguindo rotas repetitivas e silenciosas. Por onde passa, o chão fica impecável, pois ele absorve tudo o que é orgânico. Ossos, moedas e objetos que não consegue digerir ficam boiando em seu interior. Seu corpo é tão translúcido que só se percebe o perigo quando já é tarde, a menos que restos de refeições anteriores o denunciem."
 },
 "lividoMm": {
  "id": "lividoMm",
  "tipo": "morto-vivo",
  "name": "Lívido",
  "nomeOriginal": "Ghast",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 16,
   "dex": 17,
   "con": 10,
   "int": 11,
   "wis": 10,
   "cha": 8
  },
  "ac": 13,
  "maxHp": 36,
  "hpDice": "8d8",
  "speedFt": 30,
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "necrótico"
  ],
  "damageImmunities": [
   "veneno"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "exausto",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 3,
    "damage": "2d8+3",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Garras",
    "bonus": 5,
    "damage": "2d6+3",
    "type": "cortante",
    "reachFt": 5,
    "onHit": {
     "save": "con",
     "dc": 10,
     "condition": "paralisado",
     "rounds": 10,
     "repete": true
    }
   }
  ],
  "aura": {
   "raioFt": 5,
   "quando": "inicioDoAlvo",
   "save": "con",
   "dc": 10,
   "condition": "envenenado",
   "imunizaAoPassar": true
  },
  "traits": [
   "aura",
   "resisteExpulsar"
  ],
  "blurb": "Morto-vivo veloz que paralisa com as garras e envenena quem fica ao lado com seu fedor. Uma vez que a vítima está paralisada, suas mordidas causam muito dano.",
  "lore": "O lívido é um carniçal mais forte e astuto, nascido de mortais cruéis que provaram carne humana em vida. Costuma liderar bandos de carniçais em criptas, pântanos e esgotos de cidades. O fedor de podridão que exala anuncia sua presença antes mesmo que ele apareça. Tem uma fome insaciável por carne e prefere emboscar presas isoladas."
 },
 "macacoGigante": {
  "id": "macacoGigante",
  "tipo": "fera",
  "name": "Macaco Gigante",
  "nomeOriginal": "Giant Ape",
  "fonte": "MM",
  "size": "enorme",
  "level": 5,
  "cr": "7",
  "xp": 2900,
  "abilities": {
   "str": 23,
   "dex": 14,
   "con": 18,
   "int": 7,
   "wis": 12,
   "cha": 7
  },
  "ac": 12,
  "maxHp": 157,
  "hpDice": "15d12+60",
  "speedFt": 40,
  "speeds": {
   "climbFt": 40
  },
  "senses": {
   "passivePerception": 14
  },
  "saves": [],
  "skills": [
   "atletismo",
   "percepcao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Punho",
    "bonus": 9,
    "damage": "3d10+6",
    "type": "concussão",
    "reachFt": 10
   },
   {
    "name": "Pedra",
    "bonus": 9,
    "damage": "7d6+6",
    "type": "concussão",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 50,
    "longRangeFt": 100
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Punho",
    "Punho"
   ]
  },
  "traits": [],
  "blurb": "Primata colossal que esmaga alvos com dois socos de longo alcance e arremessa pedras capazes de derrubar quem tenta manter distância.",
  "lore": "O macaco gigante é um símio do tamanho de uma casa, encontrado nas florestas mais densas e antigas. Vive em pequenos bandos ou sozinho, escalando árvores e penhascos com facilidade surpreendente. Costuma ser pacífico se deixado em paz, mas defende seu território com fúria quando ameaçado. Sua força bruta o torna um adversário temido até por caçadores experientes."
 },
 "centopeiaGigante": {
  "id": "centopeiaGigante",
  "tipo": "fera",
  "name": "Centopeia Gigante",
  "nomeOriginal": "Giant Centipede",
  "fonte": "MM",
  "size": "pequeno",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 5,
   "dex": 14,
   "con": 12,
   "int": 1,
   "wis": 7,
   "cha": 3
  },
  "ac": 13,
  "acNote": "armadura natural",
  "maxHp": 4,
  "hpDice": "1d6+1",
  "speedFt": 30,
  "speeds": {
   "climbFt": 30
  },
  "senses": {
   "passivePerception": 8,
   "blindsightFt": 30
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 4,
    "damage": "1d4+2",
    "type": "perfurante",
    "reachFt": 5,
    "onHit": {
     "save": "con",
     "dc": 11,
     "condition": "envenenado",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "traits": [],
  "blurb": "Escala paredes e tetos para alcançar a presa e morde com um veneno forte. Quem cai a 0 PV pelo veneno fica estável, mas paralisado por uma hora.",
  "lore": "A centopeia gigante é um artrópode do tamanho de um cão pequeno, com o corpo coberto de placas duras e dezenas de patas. Ela prolifera em túneis do Subterrâneo, esgotos e porões úmidos de cidades. Não enxerga bem, mas percebe tudo o que se move ao seu redor e ataca por instinto o que chega perto. Costuma deixar a vítima imóvel e indefesa em vez de matá-la na hora."
 },
 "caranguejoGigante": {
  "id": "caranguejoGigante",
  "tipo": "fera",
  "name": "Caranguejo Gigante",
  "nomeOriginal": "Giant Crab",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1/8",
  "xp": 25,
  "abilities": {
   "str": 13,
   "dex": 15,
   "con": 11,
   "int": 1,
   "wis": 9,
   "cha": 3
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 13,
  "hpDice": "3d8",
  "speedFt": 30,
  "speeds": {
   "swimFt": 30
  },
  "senses": {
   "passivePerception": 9,
   "blindsightFt": 30
  },
  "saves": [],
  "skills": [
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Pinça",
    "bonus": 3,
    "damage": "1d6+1",
    "type": "concussão",
    "reachFt": 5,
    "onHit": {
     "semResistencia": true,
     "dc": 11,
     "escape": 11,
     "condition": "agarrado",
     "note": "é agarrado"
    }
   }
  ],
  "traits": [],
  "blurb": "Esconde-se na areia ou na água e agarra a presa com as pinças, podendo prender dois alvos ao mesmo tempo. Sua carapaça dura o torna difícil de acertar.",
  "lore": "Crustáceo do tamanho de um homem que habita praias, mangues e recifes. Respira tanto fora quanto dentro d'água e percebe os arredores pelo tato e pela vibração, sem depender dos olhos. Costuma ficar imóvel, meio enterrado, até que algo se aproxime o bastante. Ataca por instinto, defendendo território ou buscando alimento."
 },
 "crocodiloGigante": {
  "id": "crocodiloGigante",
  "tipo": "fera",
  "name": "Crocodilo Gigante",
  "nomeOriginal": "Giant Crocodile",
  "fonte": "MM",
  "size": "enorme",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 21,
   "dex": 9,
   "con": 17,
   "int": 2,
   "wis": 10,
   "cha": 7
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 85,
  "hpDice": "9d12+27",
  "speedFt": 30,
  "speeds": {
   "swimFt": 50
  },
  "senses": {
   "passivePerception": 10
  },
  "saves": [],
  "skills": [
   "furtividade"
  ],
  "expertise": [
   "furtividade"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 8,
    "damage": "3d10+5",
    "type": "perfurante",
    "reachFt": 5,
    "onHit": {
     "semResistencia": true,
     "dc": 16,
     "escape": 16,
     "condition": "contido",
     "note": "é agarrado"
    }
   },
   {
    "name": "Cauda",
    "bonus": 8,
    "damage": "2d8+5",
    "type": "concussão",
    "reachFt": 10,
    "onHit": {
     "save": "str",
     "dc": 16,
     "condition": "agarrado",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Mordida",
    "Cauda"
   ]
  },
  "traits": [],
  "blurb": "Abocanha uma vítima e a prende entre as mandíbulas enquanto varre os demais com a cauda, derrubando-os. Cada mordida causa dano enorme e deixa o alvo contido.",
  "lore": "Réptil colossal que habita pântanos profundos, rios lamacentos e lagoas tropicais. Passa horas submerso, só com os olhos acima da água, esperando uma presa se aproximar da margem. Quando ataca, arrasta a vítima para o fundo e a segura até que pare de lutar. Comunidades ribeirinhas às vezes o temem como a um monstro sagrado."
 },
 "aguiaGigante": {
  "id": "aguiaGigante",
  "tipo": "fera",
  "name": "Águia Gigante",
  "nomeOriginal": "Giant Eagle",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 16,
   "dex": 17,
   "con": 13,
   "int": 8,
   "wis": 14,
   "cha": 10
  },
  "ac": 13,
  "maxHp": 26,
  "hpDice": "4d10+4",
  "speedFt": 10,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80
  },
  "senses": {
   "passivePerception": 14
  },
  "saves": [],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Bico",
    "bonus": 5,
    "damage": "1d6+3",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Garras",
    "bonus": 5,
    "damage": "2d6+3",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Bico",
    "Garras"
   ]
  },
  "traits": [
   "visaoAgucada"
  ],
  "blurb": "Mergulha do alto a 24 m de voo e ataca com bico e garras na mesma rodada, causando dano cortante e perfurante considerável. Sua visão aguçada torna difícil se esconder dela.",
  "lore": "Águias gigantes são aves nobres de grande porte que fazem ninhos em picos montanhosos, colinas, planícies abertas e penhascos costeiros. Têm inteligência suficiente para entender o Comum e o Auran, embora só se comuniquem na própria língua. Costumam agir com senso de justiça, aliando-se a quem combate o mal e às vezes servindo de montaria a heróis de confiança. Defendem o território e os filhotes com ferocidade, vigiando tudo do alto."
 },
 "alceGigante": {
  "id": "alceGigante",
  "tipo": "fera",
  "name": "Alce Gigante",
  "nomeOriginal": "Giant Elk",
  "fonte": "MM",
  "size": "enorme",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 19,
   "dex": 16,
   "con": 14,
   "int": 7,
   "wis": 14,
   "cha": 10
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 42,
  "hpDice": "5d12+10",
  "speedFt": 60,
  "senses": {
   "passivePerception": 14
  },
  "saves": [],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Chifrada",
    "bonus": 6,
    "damage": "2d6+4",
    "type": "concussão",
    "reachFt": 10,
    "investida": {
     "pes": 20,
     "save": "str",
     "dc": 14,
     "dano": "2d6",
     "tipo": "concussão"
    }
   },
   {
    "name": "Cascos",
    "bonus": 6,
    "damage": "4d8+4",
    "type": "concussão",
    "reachFt": 5
   }
  ],
  "traits": [],
  "blurb": "Avança em disparada e acerta com a galhada a até 3 m, podendo derrubar o alvo; depois pisoteia com cascos devastadores quem estiver caído.",
  "lore": "Esse alce colossal é tão raro que avistá-lo costuma ser visto como sinal de grandes acontecimentos, como o nascimento de um monarca. Vive em montanhas, campos, florestas e colinas. Há lendas de deuses que assumem sua forma ao andar pelo Plano Material, por isso muitos povos consideram caçá-lo uma afronta aos céus. Compreende Comum, Élfico e Silvestre, embora não os fale."
 },
 "besouroDeFogoGigante": {
  "id": "besouroDeFogoGigante",
  "tipo": "fera",
  "name": "Besouro de Fogo Gigante",
  "nomeOriginal": "Giant Fire Beetle",
  "fonte": "MM",
  "size": "pequeno",
  "level": 1,
  "cr": "0",
  "xp": 10,
  "abilities": {
   "str": 8,
   "dex": 10,
   "con": 12,
   "int": 1,
   "wis": 7,
   "cha": 3
  },
  "ac": 13,
  "acNote": "armadura natural",
  "maxHp": 4,
  "hpDice": "1d6+1",
  "speedFt": 30,
  "senses": {
   "passivePerception": 8,
   "blindsightFt": 30
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 1,
    "damage": "1d6-1",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "luzPropria": {
   "claro": 10,
   "penumbra": 10
  },
  "traits": [],
  "blurb": "Um inseto fraco que morde com as mandíbulas, mas seu brilho constante revela a posição de quem estiver por perto. Sozinho é pouco ameaçador; o perigo está em iluminar o grupo para outros inimigos.",
  "lore": "Esse besouro noturno carrega duas glândulas que emitem uma luz forte e alaranjada. Costuma viver em cavernas, no Subterrâneo e em florestas escuras e sombrias. Mineiros e aventureiros o caçam com gosto, já que as glândulas continuam brilhando por alguns dias depois da morte do animal. Ataca por instinto quem se aproxima demais, sem qualquer estratégia."
 },
 "raGigante": {
  "id": "raGigante",
  "tipo": "fera",
  "name": "Rã Gigante",
  "nomeOriginal": "Giant Frog",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 12,
   "dex": 13,
   "con": 11,
   "int": 2,
   "wis": 10,
   "cha": 3
  },
  "ac": 11,
  "maxHp": 18,
  "hpDice": "4d8",
  "speedFt": 30,
  "speeds": {
   "swimFt": 30
  },
  "senses": {
   "passivePerception": 12,
   "darkvisionFt": 30
  },
  "saves": [],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 3,
    "damage": "1d6+1",
    "type": "perfurante",
    "reachFt": 5,
    "onHit": {
     "semResistencia": true,
     "dc": 11,
     "escape": 11,
     "condition": "contido",
     "note": "é agarrado"
    }
   }
  ],
  "acoesEspeciais": [
   {
    "nome": "Engolir",
    "tipo": "engolir",
    "tamanhoMax": "small",
    "dano": "2d4",
    "tipoDano": "ácido"
   }
  ],
  "traits": [
   "t_saltoParado"
  ],
  "blurb": "Salta de emboscada, prende a vítima com a língua e a mordida e engole criaturas pequenas, que passam a sofrer dano ácido dentro dele.",
  "lore": "Sapos do tamanho de um homem que vivem em pântanos e florestas úmidas, à beira de lagoas e charcos. Ficam imóveis entre juncos e lama, quase invisíveis, esperando algo passar ao alcance. Comem o que conseguirem engolir, de peixes a pequenos humanoides desavisados. Respiram tanto fora quanto dentro d'água e fogem para o fundo quando a presa resiste demais."
 },
 "hienaGigante": {
  "id": "hienaGigante",
  "tipo": "fera",
  "name": "Hiena Gigante",
  "nomeOriginal": "Giant Hyena",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 16,
   "dex": 14,
   "con": 14,
   "int": 2,
   "wis": 12,
   "cha": 7
  },
  "ac": 12,
  "maxHp": 45,
  "hpDice": "6d10+12",
  "speedFt": 50,
  "senses": {
   "passivePerception": 13
  },
  "saves": [],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 5,
    "damage": "2d6+3",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "traits": [
   "rampage"
  ],
  "blurb": "Fera veloz que morde com força e, ao derrubar um inimigo, avança logo em seguida para atacar outro alvo próximo.",
  "lore": "A hiena gigante é uma versão enorme e mais feroz da hiena comum, do tamanho de um cavalo. Ronda campos, colinas, florestas e desertos em busca de carniça ou de presas enfraquecidas. Costuma caçar em bando e se torna mais agressiva quando sente cheiro de sangue. Alguns gnolls e outros povos selvagens as mantêm como montarias ou feras de guerra."
 },
 "lagartoGigante": {
  "id": "lagartoGigante",
  "tipo": "fera",
  "name": "Lagarto Gigante",
  "nomeOriginal": "Giant Lizard",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 15,
   "dex": 12,
   "con": 13,
   "int": 2,
   "wis": 10,
   "cha": 5
  },
  "ac": 12,
  "acNote": "armadura natural",
  "maxHp": 19,
  "hpDice": "3d10+3",
  "speedFt": 30,
  "speeds": {
   "climbFt": 30
  },
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 30
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 4,
    "damage": "1d8+2",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "traits": [],
  "blurb": "Réptil robusto que avança escalando paredes e prende a presa com uma mordida forte. Sozinho é pouco perigoso, mas em grupo ou montado por um cavaleiro pode dar trabalho.",
  "lore": "O lagarto gigante é uma fera de grande porte, usada como montaria ou para puxar cargas. Os homens-lagarto costumam criá-los como animais de estimação. No Subterrâneo, drow, duergar e outros povos das profundezas os empregam como montarias e bestas de carga. Algumas linhagens conseguem nadar e prender o fôlego, e outras andam até pelo teto como aranhas."
 },
 "corujaGigante": {
  "id": "corujaGigante",
  "tipo": "fera",
  "name": "Coruja Gigante",
  "nomeOriginal": "Giant Owl",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 13,
   "dex": 15,
   "con": 12,
   "int": 8,
   "wis": 13,
   "cha": 10
  },
  "ac": 12,
  "maxHp": 19,
  "hpDice": "3d10+3",
  "speedFt": 5,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60
  },
  "senses": {
   "passivePerception": 15,
   "darkvisionFt": 120
  },
  "saves": [],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Garras",
    "bonus": 3,
    "damage": "2d6+1",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "traits": [
   "voaSemProvocar",
   "audicaoEVisaoApuradas"
  ],
  "blurb": "Mergulha em voo silencioso, rasga o alvo com as garras e se afasta sem sofrer ataques de oportunidade. Com visão no escuro de 36 m e sentidos aguçados, é quase impossível surpreendê-la.",
  "lore": "A coruja gigante é uma ave de rapina enorme que habita florestas, colinas e regiões geladas. Costuma fazer amizade com fadas e outros seres silvestres, atuando como sentinela dos bosques onde eles vivem. Embora só fale sua própria língua, compreende o Comum, o Élfico e o Silvestre. Caça à noite, guiada pela audição e pela visão apuradas."
 },
 "escorpiaoGigante": {
  "id": "escorpiaoGigante",
  "tipo": "fera",
  "name": "Escorpião Gigante",
  "nomeOriginal": "Giant Scorpion",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 15,
   "dex": 13,
   "con": 15,
   "int": 1,
   "wis": 9,
   "cha": 3
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 52,
  "hpDice": "7d10+14",
  "speedFt": 40,
  "senses": {
   "passivePerception": 9,
   "blindsightFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Pinça",
    "bonus": 4,
    "damage": "1d8+2",
    "type": "concussão",
    "reachFt": 5,
    "onHit": {
     "semResistencia": true,
     "dc": 12,
     "escape": 12,
     "condition": "agarrado",
     "note": "é agarrado"
    }
   },
   {
    "name": "Ferrão",
    "bonus": 4,
    "damage": "1d10+2",
    "type": "perfurante",
    "reachFt": 5,
    "onHit": {
     "save": "con",
     "dc": 12,
     "danoSeFalhar": {
      "damage": "4d10",
      "type": "veneno"
     },
     "metadeSePassar": true
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Pinça",
    "Pinça",
    "Ferrão"
   ]
  },
  "traits": [],
  "blurb": "Prende as vítimas com as duas pinças e crava o ferrão venenoso, que pode causar muito dano de veneno a quem falhar na resistência. Enxerga às cegas a curta distância, então escuridão não o atrapalha.",
  "lore": "O escorpião gigante é um predador do tamanho de um cavalo que caça nos desertos e terrenos áridos. Passa o dia enterrado na areia ou escondido em fendas de rocha e sai para caçar quando sente a vibração de uma presa por perto. Não tem inteligência nenhuma e age só por instinto, atacando qualquer criatura que pareça comestível. Viajantes temem suas pinças, que imobilizam, mas é o ferrão carregado de veneno que costuma matar."
 },
 "cavaloMarinhoGigante": {
  "id": "cavaloMarinhoGigante",
  "tipo": "fera",
  "name": "Cavalo-Marinho Gigante",
  "nomeOriginal": "Giant Sea Horse",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "1/2",
  "xp": 100,
  "abilities": {
   "str": 12,
   "dex": 15,
   "con": 11,
   "int": 2,
   "wis": 12,
   "cha": 5
  },
  "ac": 13,
  "acNote": "armadura natural",
  "maxHp": 16,
  "hpDice": "3d10",
  "speedFt": 0,
  "speeds": {
   "swimFt": 40
  },
  "senses": {
   "passivePerception": 11
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Cabeçada",
    "bonus": 3,
    "damage": "1d6+1",
    "type": "concussão",
    "reachFt": 5,
    "investida": {
     "pes": 20,
     "save": "str",
     "dc": 11,
     "dano": "2d6",
     "tipo": "concussão"
    }
   }
  ],
  "traits": [
   "t_respiracaoAquatica"
  ],
  "blurb": "Ganha velocidade nadando em linha reta e acerta o alvo com uma cabeçada que pode derrubá-lo. Sozinho é frágil, mas a investida causa dano considerável.",
  "lore": "Versão enorme do cavalo-marinho comum, com corpo alongado, cauda enrolada e cores vivas. Vive nos mares e só respira debaixo d'água. É um animal tímido, que costuma evitar confrontos. Elfos aquáticos o domesticam e o usam como montaria."
 },
 "tubaraoGigante": {
  "id": "tubaraoGigante",
  "tipo": "fera",
  "name": "Tubarão Gigante",
  "nomeOriginal": "Giant Shark",
  "fonte": "MM",
  "size": "enorme",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 23,
   "dex": 11,
   "con": 21,
   "int": 1,
   "wis": 10,
   "cha": 5
  },
  "ac": 13,
  "acNote": "armadura natural",
  "maxHp": 126,
  "hpDice": "11d12+55",
  "speedFt": 0,
  "speeds": {
   "swimFt": 50
  },
  "senses": {
   "passivePerception": 13,
   "blindsightFt": 60
  },
  "saves": [],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 9,
    "damage": "3d10+6",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "traits": [
   "frenesiDeSangue",
   "t_respiracaoAquatica"
  ],
  "blurb": "Um predador colossal que nada em velocidade e arranca pedaços com uma única mordida brutal. Quando sente sangue, fica ainda mais certeiro contra quem já está ferido.",
  "lore": "Este tubarão chega a uns nove metros de comprimento e costuma habitar as profundezas do oceano aberto. Não conhece o medo e trata qualquer coisa que encontre como possível refeição. Ataca até baleias e embarcações sem hesitar. Seus sentidos aguçados permitem localizar presas mesmo na escuridão das águas profundas."
 },
 "sapoGigante": {
  "id": "sapoGigante",
  "tipo": "fera",
  "name": "Sapo Gigante",
  "nomeOriginal": "Giant Toad",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 15,
   "dex": 13,
   "con": 13,
   "int": 2,
   "wis": 10,
   "cha": 3
  },
  "ac": 11,
  "maxHp": 39,
  "hpDice": "6d10+6",
  "speedFt": 20,
  "speeds": {
   "swimFt": 40
  },
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 30
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 4,
    "damage": "1d10+2",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d10",
     "type": "veneno"
    },
    "onHit": {
     "semResistencia": true,
     "dc": 13,
     "escape": 13,
     "condition": "contido",
     "note": "é agarrado"
    }
   }
  ],
  "acoesEspeciais": [
   {
    "nome": "Engolir",
    "tipo": "engolir",
    "tamanhoMax": "medium",
    "dano": "3d6",
    "tipoDano": "ácido"
   }
  ],
  "traits": [
   "t_saltoParado"
  ],
  "blurb": "Salta sobre a presa, prende-a com uma mordida venenosa e depois a engole inteira, dissolvendo-a em ácido dentro do estômago.",
  "lore": "O sapo gigante é um anfíbio do tamanho de um cavalo, encontrado em pântanos, florestas úmidas, litorais e até nas cavernas do Subterrâneo. Passa boa parte do tempo imóvel na água ou na lama, esperando algo comestível passar por perto. Quando ataca, dá um bote repentino e tenta engolir a vítima de uma vez. Não tem malícia nenhuma, apenas fome, mas viajantes desatentos costumam virar refeição."
 },
 "abutreGigante": {
  "id": "abutreGigante",
  "tipo": "fera",
  "name": "Abutre Gigante",
  "nomeOriginal": "Giant Vulture",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 15,
   "dex": 10,
   "con": 15,
   "int": 6,
   "wis": 12,
   "cha": 7
  },
  "ac": 10,
  "maxHp": 22,
  "hpDice": "3d10+6",
  "speedFt": 10,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60
  },
  "senses": {
   "passivePerception": 13
  },
  "saves": [],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Bico",
    "bonus": 4,
    "damage": "2d4+2",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Garras",
    "bonus": 4,
    "damage": "2d6+2",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Bico",
    "Garras"
   ]
  },
  "traits": [
   "keenSightSmell",
   "packTactics"
  ],
  "blurb": "Ataca com bico e garras no mesmo turno e fica bem mais perigoso em bando, ganhando vantagem quando um aliado está ao lado do alvo. Prefere mirar quem já está ferido.",
  "lore": "Este abutre enorme é mais esperto que os parentes menores e tem uma índole cruel. Não espera a presa morrer: ataca criaturas feridas para acabar logo com elas. Pode seguir um viajante sedento e faminto por dias, só para apreciar seu sofrimento. Ronda campos abertos e desertos, quase sempre em grupo."
 },
 "vespaGigante": {
  "id": "vespaGigante",
  "tipo": "fera",
  "name": "Vespa Gigante",
  "nomeOriginal": "Giant Wasp",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1/2",
  "xp": 100,
  "abilities": {
   "str": 10,
   "dex": 14,
   "con": 10,
   "int": 1,
   "wis": 10,
   "cha": 3
  },
  "ac": 12,
  "maxHp": 13,
  "hpDice": "3d8",
  "speedFt": 10,
  "flyFt": 50,
  "speeds": {
   "flyFt": 50
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
    "name": "Ferroada",
    "bonus": 4,
    "damage": "1d6+2",
    "type": "perfurante",
    "reachFt": 5,
    "onHit": {
     "save": "con",
     "dc": 11,
     "condition": "envenenado",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "traits": [],
  "blurb": "Voa rápido até a presa e crava um ferrão venenoso que causa dano perfurante e muito veneno. Quem cai a 0 PV pelo veneno fica paralisado por uma hora.",
  "lore": "A vespa gigante é um inseto do tamanho de um homem, capaz de voar em alta velocidade apesar de andar devagar no chão. É encontrada em campos, florestas e até nos arredores de cidades, onde constrói ninhos enormes. Age por puro instinto, atacando quem se aproxima do ninho ou parece uma boa refeição. Suas vítimas paralisadas costumam ser levadas para alimentar as larvas."
 },
 "doninhaGigante": {
  "id": "doninhaGigante",
  "tipo": "fera",
  "name": "Doninha Gigante",
  "nomeOriginal": "Giant Weasel",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1/8",
  "xp": 25,
  "abilities": {
   "str": 11,
   "dex": 16,
   "con": 10,
   "int": 4,
   "wis": 12,
   "cha": 5
  },
  "ac": 13,
  "maxHp": 9,
  "hpDice": "2d8",
  "speedFt": 40,
  "senses": {
   "passivePerception": 13,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "percepcao",
   "furtividade"
  ],
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
  "traits": [
   "keenHearingSmell"
  ],
  "blurb": "Predadora ágil e furtiva que se aproxima sem ser notada e morde com rapidez. Sozinha é frágil, mas seus sentidos aguçados tornam difícil surpreendê-la.",
  "lore": "A doninha gigante é uma versão do tamanho de um homem do pequeno caçador dos campos. Habita pradarias, florestas e colinas, onde se esconde em tocas e entre a vegetação alta. Caça à noite com a ajuda da visão no escuro, do faro e da audição apurada. Costuma atacar presas isoladas e foge quando a luta se volta contra ela."
 },
 "bocaTagarela": {
  "id": "bocaTagarela",
  "tipo": "aberração",
  "name": "Boca Tagarela",
  "nomeOriginal": "Gibbering Mouther",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 10,
   "dex": 8,
   "con": 16,
   "int": 3,
   "wis": 10,
   "cha": 6
  },
  "ac": 9,
  "maxHp": 67,
  "hpDice": "9d8+27",
  "speedFt": 10,
  "speeds": {
   "swimFt": 10
  },
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [
   "caido"
  ],
  "attacks": [
   {
    "name": "Mordidas",
    "bonus": 2,
    "damage": "5d6",
    "type": "perfurante",
    "reachFt": 5,
    "onHit": {
     "save": "str",
     "dc": 10,
     "condition": "caido",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "multiattack": {
   "count": 1
  },
  "acoesEspeciais": [
   {
    "nome": "Cuspe Cegante",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "raio",
    "areaFt": 15,
    "save": "dex",
    "dc": 13,
    "condition": "cego",
    "rounds": 1,
    "repete": false,
    "ateFimDoTurnoDele": true
   }
  ],
  "aura": {
   "raioFt": 20,
   "quando": "inicioDoAlvo",
   "save": "wis",
   "dc": 10,
   "condition": "desnorteado",
   "imunizaAoPassar": false,
   "rounds": 1
  },
  "traits": [
   "chaoAberrante",
   "aura"
  ],
  "blurb": "Massa lenta de bocas e olhos que transforma o chão em lama pegajosa e enlouquece quem ouve seu balbucio, deixando as vítimas sem agir enquanto ela morde e cega. Quem morre nas suas mordidas é absorvido.",
  "lore": "A boca tagarela é uma aberração nascida de feitiçaria vil, um amontoado disforme de olhos, bocas e carne derretida de antigas vítimas. Ela se arrasta prendendo bocas ao solo e puxando o próprio corpo, devagar em terra mas à vontade em água, lama e areia movediça. Ao perceber presas, suas muitas vozes começam a murmurar e gritar, confundindo e aterrorizando quem escuta. Então ela rasteja sobre os paralisados e os devora por inteiro, e os olhos e bocas dos mortos surgem em sua superfície para engrossar o coro. Costuma habitar o Subterrâneo."
 },
 "cavaleiroGithyanki": {
  "id": "cavaleiroGithyanki",
  "tipo": "humanoide",
  "name": "Cavaleiro Githyanki",
  "nomeOriginal": "Githyanki Knight",
  "fonte": "MM",
  "size": "médio",
  "level": 5,
  "cr": "8",
  "xp": 3900,
  "abilities": {
   "str": 16,
   "dex": 14,
   "con": 15,
   "int": 14,
   "wis": 14,
   "cha": 15
  },
  "ac": 18,
  "acNote": "armadura de placas",
  "maxHp": 91,
  "hpDice": "14d8+28",
  "speedFt": 30,
  "senses": {
   "passivePerception": 12
  },
  "saves": [
   "con",
   "int",
   "wis"
  ],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Espada Larga de Prata",
    "bonus": 9,
    "damage": "2d6+6",
    "type": "cortante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "3d6",
     "type": "psíquico"
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Espada Larga de Prata",
    "Espada Larga de Prata"
   ]
  },
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "salto",
    "passoNebuloso",
    "indetectavel",
    "linguas",
    "viagemPlanar",
    "telecinesia",
    "maoMagica"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "salto": 3,
    "passoNebuloso": 3,
    "indetectavel": 3,
    "linguas": 3,
    "viagemPlanar": 1,
    "telecinesia": 1
   },
   "aVontade": [
    "maoMagica"
   ],
   "cdPorMagia": {
    "salto": 13,
    "passoNebuloso": 13,
    "indetectavel": 13,
    "linguas": 13,
    "viagemPlanar": 13,
    "telecinesia": 13,
    "maoMagica": 13
   }
  },
  "traits": [],
  "blurb": "Guerreiro de elite que golpeia duas vezes por turno com uma espada larga de prata, somando dano psíquico ao corte. Usa psiônica para saltar, teletransportar-se em névoa ou arremessar inimigos com telecinesia.",
  "lore": "Os cavaleiros githyanki são os campeões marciais de seu povo, servindo à rainha-lich Vlaakith no Plano Astral. Caçam devoradores de mentes sem descanso e lideram incursões a outros mundos em navios astrais. Cada um porta uma espada de prata forjada para sua ordem, símbolo de honra e de crueldade. São disciplinados, arrogantes e tratam outras raças como presas ou servos."
 },
 "guerreiroGithyanki": {
  "id": "guerreiroGithyanki",
  "tipo": "humanoide",
  "name": "Guerreiro Githyanki",
  "nomeOriginal": "Githyanki Warrior",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 15,
   "dex": 14,
   "con": 12,
   "int": 13,
   "wis": 13,
   "cha": 10
  },
  "ac": 17,
  "acNote": "meia-armadura",
  "maxHp": 49,
  "hpDice": "9d8+9",
  "speedFt": 30,
  "senses": {
   "passivePerception": 11
  },
  "saves": [
   "con",
   "int",
   "wis"
  ],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Espada Grande",
    "bonus": 4,
    "damage": "2d6+2",
    "type": "cortante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "2d6",
     "type": "psíquico"
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Espada Grande",
    "Espada Grande"
   ]
  },
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "salto",
    "passoNebuloso",
    "indetectavel",
    "maoMagica"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "salto": 3,
    "passoNebuloso": 3,
    "indetectavel": 3
   },
   "aVontade": [
    "maoMagica"
   ]
  },
  "traits": [],
  "blurb": "Combatente disciplinado que golpeia duas vezes por turno com uma espada grande carregada de energia psíquica. Usa passo nebuloso e salto para se reposicionar rapidamente no campo de batalha.",
  "lore": "Os githyanki são um povo marcial que vive no Plano Astral, descendente de antigos escravos que se rebelaram contra os devoradores de mentes. Seus guerreiros formam a espinha dorsal de grupos de ataque que saqueiam outros mundos. Combinam treino rigoroso com poderes psiônicos inatos, e servem com fanatismo à sua rainha-lich. São arrogantes, cruéis e desprezam quem consideram inferior."
 },
 "mongeGithzerai": {
  "id": "mongeGithzerai",
  "tipo": "humanoide",
  "name": "Monge Githzerai",
  "nomeOriginal": "Githzerai Monk",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 12,
   "dex": 15,
   "con": 12,
   "int": 13,
   "wis": 14,
   "cha": 10
  },
  "ac": 14,
  "acNote": "defesa psíquica",
  "maxHp": 38,
  "hpDice": "7d8+7",
  "speedFt": 30,
  "senses": {
   "passivePerception": 14
  },
  "saves": [
   "str",
   "dex",
   "int",
   "wis"
  ],
  "skills": [
   "intuicao",
   "percepcao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Golpe Desarmado",
    "bonus": 4,
    "damage": "1d8+2",
    "type": "concussão",
    "reachFt": 5,
    "danoExtra": {
     "damage": "2d8",
     "type": "psíquico"
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Golpe Desarmado",
    "Golpe Desarmado"
   ]
  },
  "spellcasting": {
   "ability": "wis",
   "cantrips": [],
   "prepared": [
    "quedaSuave",
    "salto",
    "verOInvisivel",
    "escudoArcano",
    "maoMagica"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "quedaSuave": 3,
    "salto": 3,
    "verOInvisivel": 3,
    "escudoArcano": 3
   },
   "aVontade": [
    "maoMagica"
   ]
  },
  "traits": [
   "t_defesaPsiquica"
  ],
  "blurb": "Lutador desarmado que desfere dois golpes por turno, cada um somando concussão e dano psíquico. Usa psiônica para saltar, cair sem dano e erguer escudos mentais na hora certa.",
  "lore": "Os githzerai são um povo disciplinado que rompeu com seus parentes githyanki e se refugiou no caos do Limbo. Ali, mosteiros erguidos pela força da mente resistem à turbulência do plano. Os monges treinam corpo e espírito até que cada golpe carregue energia psíquica. Costumam ser reservados e calculistas, e só se envolvem em conflitos quando estes servem à ordem que buscam ou à guerra contra os devoradores de mentes."
 },
 "githzeraiZerth": {
  "id": "githzeraiZerth",
  "tipo": "humanoide",
  "name": "Githzerai Zerth",
  "nomeOriginal": "Githzerai Zerth",
  "fonte": "MM",
  "size": "médio",
  "level": 5,
  "cr": "6",
  "xp": 2300,
  "abilities": {
   "str": 13,
   "dex": 18,
   "con": 15,
   "int": 16,
   "wis": 17,
   "cha": 12
  },
  "ac": 17,
  "acNote": "defesa psíquica",
  "maxHp": 84,
  "hpDice": "13d8+26",
  "speedFt": 30,
  "senses": {
   "passivePerception": 16
  },
  "saves": [
   "str",
   "dex",
   "int",
   "wis"
  ],
  "skills": [
   "arcanismo",
   "intuicao",
   "percepcao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Golpe Desarmado",
    "bonus": 7,
    "damage": "2d6+4",
    "type": "concussão",
    "reachFt": 5,
    "danoExtra": {
     "damage": "3d8",
     "type": "psíquico"
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Golpe Desarmado",
    "Golpe Desarmado"
   ]
  },
  "spellcasting": {
   "ability": "wis",
   "cantrips": [],
   "prepared": [
    "quedaSuave",
    "salto",
    "verOInvisivel",
    "escudoArcano",
    "assassinoFantasmagorico",
    "viagemPlanar",
    "maoMagica"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "quedaSuave": 3,
    "salto": 3,
    "verOInvisivel": 3,
    "escudoArcano": 3,
    "assassinoFantasmagorico": 1,
    "viagemPlanar": 1
   },
   "aVontade": [
    "maoMagica"
   ]
  },
  "traits": [
   "t_defesaPsiquica"
  ],
  "blurb": "Monge psiônico ágil que desfere dois golpes desarmados mágicos, cada um somando dano psíquico pesado ao impacto. Pode se proteger com escudo arcano e conjurar assassino fantasmagórico para aterrorizar um alvo.",
  "lore": "Os zerths são mestres entre os githzerai, monges que dedicaram a vida a disciplinar a mente até que o pensamento molde a realidade. Vivem em mosteiros fortificados no caos do Limbo, mantidos estáveis apenas pela força de vontade. São reservados e metódicos, mas lutam com precisão implacável contra devoradores de mentes e contra seus parentes githyanki. Viajam entre planos quando sua ordem exige, sempre buscando equilíbrio e ordem."
 },
 "glabrezu": {
  "id": "glabrezu",
  "tipo": "corruptor",
  "name": "Glabrezu",
  "nomeOriginal": "Glabrezu",
  "fonte": "MM",
  "size": "grande",
  "level": 9,
  "cr": "9",
  "xp": 5000,
  "abilities": {
   "str": 20,
   "dex": 15,
   "con": 21,
   "int": 19,
   "wis": 17,
   "cha": 16
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 157,
  "hpDice": "15d10+75",
  "speedFt": 40,
  "senses": {
   "passivePerception": 13,
   "truesightFt": 120
  },
  "saves": [
   "str",
   "con",
   "wis",
   "cha"
  ],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "frio",
   "fogo",
   "elétrico",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "damageImmunities": [
   "veneno"
  ],
  "conditionImmunities": [
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Pinça",
    "bonus": 9,
    "damage": "2d10+5",
    "type": "concussão",
    "reachFt": 10,
    "onHit": {
     "semResistencia": true,
     "dc": 15,
     "escape": 15,
     "condition": "agarrado",
     "note": "é agarrado"
    }
   },
   {
    "name": "Punho",
    "bonus": 9,
    "damage": "2d4+2",
    "type": "concussão",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 4,
   "sequence": [
    "Pinça",
    "Pinça",
    "Punho",
    "Punho"
   ]
  },
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "confusao",
    "voo",
    "palavraDePoderAtordoar",
    "escuridao",
    "detectarMagia",
    "dissiparMagia"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "confusao": 1,
    "voo": 1,
    "palavraDePoderAtordoar": 1
   },
   "aVontade": [
    "escuridao",
    "detectarMagia",
    "dissiparMagia"
   ],
   "cdPorMagia": {
    "confusao": 16,
    "voo": 16,
    "palavraDePoderAtordoar": 16,
    "escuridao": 16,
    "detectarMagia": 16,
    "dissiparMagia": 16
   }
  },
  "traits": [
   "resistenciaAMagia"
  ],
  "blurb": "Demônio brutal que agarra com pinças de 3 m de alcance e esmurra com os punhos, ou troca os golpes por magias como confusão e palavra de poder atordoar. Resiste a magia e enxerga através de ilusões.",
  "lore": "O glabrezu é um demônio do Abismo, enorme e de quatro braços: dois terminam em pinças de caranguejo e dois em mãos. Mais astuto que a maioria de sua espécie, prefere a tentação à força bruta, oferecendo poder e riquezas a mortais desesperados em troca de sua ruína. Quando o engano falha, parte para o combate sem hesitar, esmagando quem resistir. Costuma servir a senhores demoníacos como conselheiro ou corruptor."
 },
 "gladiador": {
  "id": "gladiador",
  "tipo": "humanoide",
  "name": "Gladiador",
  "nomeOriginal": "Gladiator",
  "fonte": "MM",
  "size": "médio",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 18,
   "dex": 15,
   "con": 16,
   "int": 10,
   "wis": 12,
   "cha": 15
  },
  "ac": 16,
  "acNote": "couro batido e escudo",
  "maxHp": 112,
  "hpDice": "15d8+45",
  "speedFt": 30,
  "senses": {
   "passivePerception": 11
  },
  "saves": [
   "str",
   "dex",
   "con"
  ],
  "skills": [
   "atletismo",
   "intimidacao"
  ],
  "expertise": [
   "atletismo"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Lança",
    "bonus": 7,
    "damage": "2d6+4",
    "type": "perfurante",
    "reachFt": 5,
    "rangeFt": 20,
    "longRangeFt": 60,
    "danoExtra": {
     "damage": "2d8+4",
     "type": "perfurante"
    }
   },
   {
    "name": "Golpe de Escudo",
    "bonus": 7,
    "damage": "2d4+4",
    "type": "concussão",
    "reachFt": 5,
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
   "count": 3
  },
  "traits": [
   "bravura",
   "aparar"
  ],
  "blurb": "Lutador corpo a corpo resistente que desfere três golpes por turno com lança e escudo, podendo derrubar os alvos. Aparar ataques o torna difícil de acertar.",
  "lore": "Gladiadores são combatentes que lutam em arenas para divertir plateias barulhentas. Alguns são brigões selvagens de fossos, que encaram cada combate como questão de vida ou morte. Outros são duelistas profissionais, bem pagos, que raramente lutam até o fim. Costumam ser encontrados em cidades, onde há arenas e público."
 },
 "gnoll": {
  "id": "gnoll",
  "tipo": "humanoide",
  "name": "Gnoll",
  "nomeOriginal": "Gnoll",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1/2",
  "xp": 100,
  "abilities": {
   "str": 14,
   "dex": 12,
   "con": 11,
   "int": 6,
   "wis": 10,
   "cha": 7
  },
  "ac": 15,
  "acNote": "armadura de couro e escudo",
  "maxHp": 22,
  "hpDice": "5d8",
  "speedFt": 30,
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 4,
    "damage": "1d4+2",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Lança",
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
    "name": "Arco Longo",
    "bonus": 3,
    "damage": "1d8+1",
    "type": "perfurante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 150,
    "longRangeFt": 600
   }
  ],
  "traits": [
   "rampage"
  ],
  "blurb": "Ataca com lança ou arco longo e, ao derrubar um inimigo em combate corpo a corpo, avança e morde de novo na mesma rodada. Em bando, cada morte alimenta a próxima.",
  "lore": "Os gnolls nasceram de hienas que seguiam o lorde demônio Yeenoghu quando ele devastou o Plano Material, e se espalharam pelo mundo depois que ele foi banido ao Abismo. Vivem como saqueadores nômades nas fronteiras da civilização, surgindo do nada para arrasar vilas e fazendas e devorar os mortos. Não fabricam quase nada: usam armas e armaduras tiradas das vítimas, enfeitadas com orelhas, dentes e escalpos. Não têm consciência nem piedade, preferem alvos indefesos e, sem inimigo comum, brigam entre si."
 },
 "presaDeYeenoghu": {
  "id": "presaDeYeenoghu",
  "tipo": "corruptor",
  "name": "Presa de Yeenoghu",
  "nomeOriginal": "Gnoll Fang of Yeenoghu",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "4",
  "xp": 1100,
  "abilities": {
   "str": 17,
   "dex": 15,
   "con": 15,
   "int": 10,
   "wis": 11,
   "cha": 13
  },
  "ac": 14,
  "acNote": "armadura de couro",
  "maxHp": 65,
  "hpDice": "10d8+20",
  "speedFt": 30,
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 60
  },
  "saves": [
   "con",
   "wis",
   "cha"
  ],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 5,
    "damage": "1d6+3",
    "type": "perfurante",
    "reachFt": 5,
    "onHit": {
     "save": "con",
     "dc": 12,
     "danoSeFalhar": {
      "damage": "2d6",
      "type": "veneno"
     },
     "metadeSePassar": false
    }
   },
   {
    "name": "Garra",
    "bonus": 5,
    "damage": "1d8+3",
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
  "traits": [
   "rampage"
  ],
  "blurb": "Ataca com uma mordida venenosa e duas garras a cada turno. Quando derruba um inimigo, avança e morde de novo na mesma rodada.",
  "lore": "As Presas de Yeenoghu são gnolls que o Senhor Demônio das Hienas escolheu e transformou em corruptores ligados ao Abismo. Lideram bandos de gnolls em planícies, florestas, colinas e desertos, sempre à frente da matança. Têm fome insaciável de carne e destruição e espalham o culto de seu mestre demoníaco por onde o bando passa."
 },
 "liderDeMatilhaGnoll": {
  "id": "liderDeMatilhaGnoll",
  "tipo": "humanoide",
  "name": "Líder de Matilha Gnoll",
  "nomeOriginal": "Gnoll Pack Lord",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 16,
   "dex": 14,
   "con": 13,
   "int": 8,
   "wis": 11,
   "cha": 9
  },
  "ac": 15,
  "acNote": "camisão de malha",
  "maxHp": 49,
  "hpDice": "9d8+9",
  "speedFt": 30,
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 60
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
   },
   {
    "name": "Glaive",
    "bonus": 5,
    "damage": "1d10+3",
    "type": "cortante",
    "reachFt": 10
   },
   {
    "name": "Arco Longo",
    "bonus": 4,
    "damage": "1d8+2",
    "type": "perfurante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 150,
    "longRangeFt": 600
   }
  ],
  "multiattack": {
   "count": 2
  },
  "traits": [
   "incitarRampage",
   "rampage"
  ],
  "blurb": "Ataca duas vezes com a glaive de longo alcance ou com o arco longo e incita outros gnolls a golpear fora de turno. Quando derruba alguém, avança e morde de novo.",
  "lore": "É o gnoll mais forte e cruel do bando, que conquistou a liderança à base de violência. Conduz a matilha por campos, florestas, colinas e desertos em busca de presas e saques. Aproveita cada morte para levar seus seguidores a um frenesi sanguinário. Não tem piedade e só respeita a força."
 },
 "bode": {
  "id": "bode",
  "tipo": "fera",
  "name": "Bode",
  "nomeOriginal": "Goat",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "0",
  "xp": 10,
  "abilities": {
   "str": 12,
   "dex": 10,
   "con": 11,
   "int": 2,
   "wis": 10,
   "cha": 5
  },
  "ac": 10,
  "maxHp": 4,
  "hpDice": "1d8",
  "speedFt": 40,
  "senses": {
   "passivePerception": 10
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Cabeçada",
    "bonus": 3,
    "damage": "1d4+1",
    "type": "concussão",
    "reachFt": 5,
    "investida": {
     "pes": 20,
     "save": "str",
     "dc": 10,
     "dano": "1d4",
     "tipo": "concussão"
    }
   }
  ],
  "traits": [
   "pesFirmes"
  ],
  "blurb": "Corre em linha reta e dá uma cabeçada que pode derrubar o alvo. É fraco, mas difícil de ser derrubado.",
  "lore": "Animal comum de montanhas, colinas, campos e até cidades, criado por fazendeiros pelo leite, pela carne e pelo couro. É teimoso e ágil, capaz de subir encostas íngremes sem perder o equilíbrio. Normalmente evita brigas, mas reage com cabeçadas quando se sente ameaçado ou quando disputa território."
 },
 "filhoteDeDragaoDourado": {
  "id": "filhoteDeDragaoDourado",
  "tipo": "dragão",
  "name": "Filhote de Dragão Dourado",
  "nomeOriginal": "Gold Dragon Wyrmling",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 19,
   "dex": 14,
   "con": 17,
   "int": 14,
   "wis": 11,
   "cha": 16
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 60,
  "hpDice": "8d8+24",
  "speedFt": 30,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60,
   "swimFt": 30
  },
  "senses": {
   "passivePerception": 14,
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
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "fogo"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 6,
    "damage": "1d10+4",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "breath": {
   "name": "Armas de Sopro",
   "kind": "save",
   "shape": "cone",
   "areaFt": 15,
   "save": "dex",
   "dc": 13,
   "damage": "4d10",
   "damageType": "fogo",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    5,
    6
   ]
  },
  "traits": [],
  "blurb": "Morde com força e alterna entre um cone de fogo e um gás que drena a força dos inimigos. Voa rápido e nada bem, sem medo de chamas.",
  "lore": "O filhote de dragão dourado é a forma jovem do mais nobre dos dragões metálicos. Mesmo pequeno, já demonstra senso de justiça e curiosidade por tudo ao redor. Costuma viver perto de lagos e rios escondidos, pois respira tanto no ar quanto debaixo d'água. Evita brigas desnecessárias, mas defende com coragem quem considera inocente."
 },
 "gorgona": {
  "id": "gorgona",
  "tipo": "monstruosidade",
  "name": "Górgona",
  "nomeOriginal": "Gorgon",
  "fonte": "MM",
  "size": "grande",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 20,
   "dex": 11,
   "con": 18,
   "int": 2,
   "wis": 12,
   "cha": 7
  },
  "ac": 19,
  "acNote": "armadura natural",
  "maxHp": 114,
  "hpDice": "12d10+48",
  "speedFt": 40,
  "senses": {
   "passivePerception": 14,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "conditionImmunities": [
   "petrificado"
  ],
  "attacks": [
   {
    "name": "Chifrada",
    "bonus": 8,
    "damage": "2d12+5",
    "type": "perfurante",
    "reachFt": 5,
    "investida": {
     "pes": 20,
     "save": "str",
     "dc": 16
    }
   },
   {
    "name": "Cascos",
    "bonus": 8,
    "damage": "2d10+5",
    "type": "concussão",
    "reachFt": 5
   }
  ],
  "acoesEspeciais": [
   {
    "nome": "Sopro Petrificante (Recarga 5–6)",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 30,
    "save": "con",
    "dc": 13,
    "condition": "contido",
    "rounds": 10,
    "repete": true
   }
  ],
  "traits": [],
  "blurb": "Investe em linha reta para chifrar e derrubar o alvo, depois o pisoteia com os cascos. Seu sopro em cone pode transformar um grupo inteiro em pedra.",
  "lore": "A górgona é um touro monstruoso revestido de placas de ferro, que vão do negro fosco ao prateado reluzente, lubrificadas por óleos do próprio corpo. Quando adoece ou fica parada por muito tempo, enferruja e passa a ranger a cada passo. Ronda campos, florestas e colinas, avançando contra qualquer presa com um estrondo metálico. Petrifica os inimigos com seu hálito esverdeado e, quando sente fome, despedaça as estátuas e mói a pedra com os dentes para se alimentar. Seu covil é cercado por trilhas pisoteadas, árvores quebradas e restos de pedra das vítimas."
 },
 "goristro": {
  "id": "goristro",
  "tipo": "corruptor",
  "name": "Goristro",
  "nomeOriginal": "Goristro",
  "fonte": "MM",
  "size": "enorme",
  "level": 17,
  "cr": "17",
  "xp": 18000,
  "abilities": {
   "str": 25,
   "dex": 11,
   "con": 25,
   "int": 6,
   "wis": 13,
   "cha": 14
  },
  "ac": 19,
  "acNote": "armadura natural",
  "maxHp": 310,
  "hpDice": "23d12+161",
  "speedFt": 40,
  "senses": {
   "passivePerception": 17,
   "darkvisionFt": 120
  },
  "saves": [
   "str",
   "dex",
   "con",
   "wis"
  ],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "damageResistances": [
   "frio",
   "fogo",
   "elétrico",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "damageImmunities": [
   "veneno"
  ],
  "conditionImmunities": [
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Punho",
    "bonus": 13,
    "damage": "3d8+7",
    "type": "concussão",
    "reachFt": 10
   },
   {
    "name": "Casco",
    "bonus": 13,
    "damage": "3d10+7",
    "type": "concussão",
    "reachFt": 5,
    "onHit": {
     "save": "str",
     "dc": 21,
     "condition": "caido",
     "rounds": 1,
     "repete": false
    }
   },
   {
    "name": "Chifrada",
    "bonus": 13,
    "damage": "7d10+7",
    "type": "perfurante",
    "reachFt": 10,
    "investida": {
     "pes": 15,
     "save": "str",
     "dc": 21,
     "dano": "7d10",
     "tipo": "perfurante"
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Punho",
    "Punho",
    "Casco"
   ]
  },
  "traits": [
   "t_memoriaLabirintica",
   "resistenciaAMagia",
   "monstroDeCerco"
  ],
  "blurb": "Demônio colossal que investe de chifres baixos para empalar e arremessar alvos, depois esmaga com punhos e cascos que derrubam. Resiste a magia e despedaça estruturas com facilidade.",
  "lore": "O goristro é um demônio gigantesco com feições de touro, uma fera de cerco usada pelos senhores do Abismo para arrombar fortalezas. Tem pouca inteligência, mas uma memória impecável para caminhos, o que o torna um guia temível em labirintos. Costuma ser mantido como animal de guerra por demônios mais poderosos. Quando solto, avança sem hesitar contra muralhas e fileiras inimigas."
 },
 "gosmaCinzenta": {
  "id": "gosmaCinzenta",
  "tipo": "gosma",
  "name": "Gosma Cinzenta",
  "nomeOriginal": "Gray Ooze",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1/2",
  "xp": 100,
  "abilities": {
   "str": 12,
   "dex": 6,
   "con": 16,
   "int": 1,
   "wis": 6,
   "cha": 2
  },
  "ac": 8,
  "maxHp": 22,
  "hpDice": "3d8+9",
  "speedFt": 10,
  "speeds": {
   "climbFt": 10
  },
  "senses": {
   "passivePerception": 8,
   "blindsightFt": 60
  },
  "saves": [],
  "skills": [
   "furtividade"
  ],
  "expertise": [
   "furtividade"
  ],
  "damageResistances": [
   "ácido",
   "frio",
   "fogo"
  ],
  "conditionImmunities": [
   "cego",
   "enfeitiçado",
   "surdo",
   "exausto",
   "amedrontado",
   "caido"
  ],
  "attacks": [
   {
    "name": "Pseudópode",
    "bonus": 3,
    "damage": "1d6+1",
    "type": "concussão",
    "reachFt": 5,
    "danoExtra": {
     "damage": "2d6",
     "type": "ácido"
    }
   }
  ],
  "traits": [
   "amorfo",
   "corroiArma",
   "aparenciaFalsa"
  ],
  "blurb": "Fica imóvel como uma poça oleosa até a presa chegar perto e então golpeia com um pseudópode ácido. Corrói armas e armaduras de metal não mágicas, que ficam piores a cada contato.",
  "lore": "A gosma cinzenta é uma massa viva de lodo acinzentado que se arrasta pelos túneis do Subterrâneo. Ela se esconde em pedras úmidas e poças, quase impossível de distinguir do ambiente. É atraída por movimento e por metal, que dissolve com facilidade. Exemplares muito antigos, sobretudo os que vivem perto de criaturas psiônicas como devoradores de mentes, podem desenvolver uma mente rudimentar e poderes psíquicos limitados."
 },
 "slaadCinzento": {
  "id": "slaadCinzento",
  "tipo": "aberração",
  "name": "Slaad Cinzento",
  "nomeOriginal": "Gray Slaad",
  "fonte": "MM",
  "size": "médio",
  "level": 9,
  "cr": "9",
  "xp": 5000,
  "abilities": {
   "str": 17,
   "dex": 17,
   "con": 16,
   "int": 13,
   "wis": 8,
   "cha": 14
  },
  "ac": 18,
  "acNote": "armadura natural",
  "maxHp": 127,
  "hpDice": "17d8+51",
  "speedFt": 30,
  "senses": {
   "passivePerception": 17,
   "blindsightFt": 60,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "arcanismo",
   "percepcao"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageResistances": [
   "ácido",
   "frio",
   "fogo",
   "elétrico",
   "trovejante"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida (só forma de slaad)",
    "bonus": 7,
    "damage": "1d6+3",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Garras (só forma de slaad)",
    "bonus": 7,
    "damage": "1d10+3",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Espadão",
    "bonus": 7,
    "damage": "2d6+3",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida (só forma de slaad)",
    "Garras (só forma de slaad)",
    "Garras (só forma de slaad)"
   ]
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "viagemPlanar",
    "medo",
    "voo",
    "bolaDeFogo",
    "linguas",
    "detectarMagia",
    "detectarPensamentos",
    "invisibilidade",
    "maoMagica",
    "imagemMaior"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "viagemPlanar": 1,
    "medo": 2,
    "voo": 2,
    "bolaDeFogo": 2,
    "linguas": 2
   },
   "aVontade": [
    "detectarMagia",
    "detectarPensamentos",
    "invisibilidade",
    "maoMagica",
    "imagemMaior"
   ],
   "cdPorMagia": {
    "viagemPlanar": 14,
    "medo": 14,
    "voo": 14,
    "bolaDeFogo": 14,
    "linguas": 14,
    "detectarMagia": 14,
    "detectarPensamentos": 14,
    "invisibilidade": 14,
    "maoMagica": 14,
    "imagemMaior": 14
   }
  },
  "regeneracao": {
   "pv": 10,
   "bloqueia": []
  },
  "traits": [
   "metamorfo",
   "resistenciaAMagia",
   "armasMagicas",
   "regeneracaoDoLivro"
  ],
  "blurb": "Mordida e garras (ou espadão) em três ataques por turno, regeneração de 10 PV por rodada e magias como bola de fogo, medo e voo. Pode se disfarçar de humanoide e sumir invisível.",
  "lore": "Os slaadi cinzentos são agentes do caos nascidos no Limbo, servos diretos dos slaadi mais poderosos. Mudam de forma e se infiltram entre humanoides nas cidades para espionar, sabotar ou cumprir ordens de seus mestres. São curiosos sobre magia e costumam empunhar espadões como os mortais que imitam. Alguns trazem uma gema de controle no cérebro, que os obriga a obedecer a quem a possuir."
 },
 "filhoteDeDragaoVerde": {
  "id": "filhoteDeDragaoVerde",
  "tipo": "dragão",
  "name": "Filhote de Dragão Verde",
  "nomeOriginal": "Green Dragon Wyrmling",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 15,
   "dex": 12,
   "con": 13,
   "int": 14,
   "wis": 11,
   "cha": 13
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 38,
  "hpDice": "7d8+7",
  "speedFt": 30,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60,
   "swimFt": 30
  },
  "senses": {
   "passivePerception": 14,
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
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "veneno"
  ],
  "conditionImmunities": [
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 4,
    "damage": "1d10+2",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d6",
     "type": "veneno"
    }
   }
  ],
  "breath": {
   "name": "Sopro Venenoso",
   "kind": "save",
   "shape": "cone",
   "areaFt": 15,
   "save": "con",
   "dc": 11,
   "damage": "6d6",
   "damageType": "veneno",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    5,
    6
   ]
  },
  "traits": [],
  "blurb": "Morde com presas venenosas e, quando o fôlego recarrega, cobre a linha de frente com um cone de gás tóxico. Voa rápido e nada bem, então pode atacar de onde menos se espera.",
  "lore": "Recém-saído do ovo, o dragão verde já mostra a astúcia e a crueldade de sua espécie. Costuma se esconder em florestas densas e pântanos, usando lagos e rios como esconderijo graças à capacidade de respirar debaixo d'água. Gosta de enganar e intimidar criaturas menores, testando seu poder antes de atacar. Mesmo jovem, é ganancioso e começa cedo a juntar seu próprio tesouro."
 },
 "bruxaVerde": {
  "id": "bruxaVerde",
  "tipo": "feérico",
  "name": "Bruxa Verde",
  "nomeOriginal": "Green Hag",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 18,
   "dex": 12,
   "con": 16,
   "int": 13,
   "wis": 14,
   "cha": 14
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 82,
  "hpDice": "11d8+33",
  "speedFt": 30,
  "senses": {
   "passivePerception": 14,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "arcanismo",
   "enganacao",
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Garras",
    "bonus": 6,
    "damage": "2d8+4",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "luzesDancantes",
    "ilusaoMenor",
    "zombariaViciosa"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "aVontade": [
    "luzesDancantes",
    "ilusaoMenor",
    "zombariaViciosa"
   ],
   "cdPorMagia": {
    "luzesDancantes": 12,
    "ilusaoMenor": 12,
    "zombariaViciosa": 12
   }
  },
  "traits": [
   "t_aparenciaIlusoria",
   "invisivelAVontade",
   "t_imitacao"
  ],
  "blurb": "Rasga com garras pesadas (2d8+4 cortante) e prefere atacar de surpresa, ficando invisível ou disfarçada para escolher o momento. Usa zombaria cruel e ilusões para confundir antes de fechar o cerco.",
  "lore": "As bruxas verdes são fadas malignas que habitam pântanos, florestas sombrias e colinas isoladas. Adoram enganar viajantes, imitando vozes de pessoas queridas ou gritos de socorro para atraí-los à ruína. Vivem de crueldade e inveja, corrompendo almas e arruinando vidas por puro prazer. Às vezes se juntam a outras duas bruxas num círculo, ganhando magias muito mais poderosas."
 },
 "slaadVerde": {
  "id": "slaadVerde",
  "tipo": "aberração",
  "name": "Slaad Verde",
  "nomeOriginal": "Green Slaad",
  "fonte": "MM",
  "size": "grande",
  "level": 5,
  "cr": "8",
  "xp": 3900,
  "abilities": {
   "str": 18,
   "dex": 15,
   "con": 16,
   "int": 11,
   "wis": 8,
   "cha": 12
  },
  "ac": 16,
  "acNote": "armadura natural",
  "maxHp": 127,
  "hpDice": "15d10+45",
  "speedFt": 30,
  "senses": {
   "passivePerception": 12,
   "blindsightFt": 30,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "arcanismo",
   "percepcao"
  ],
  "expertise": [],
  "damageResistances": [
   "ácido",
   "frio",
   "fogo",
   "elétrico",
   "trovejante"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 7,
    "damage": "2d6+4",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Garra",
    "bonus": 7,
    "damage": "1d6+4",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Cajado",
    "bonus": 7,
    "damage": "2d6+4",
    "type": "concussão",
    "reachFt": 5
   },
   {
    "name": "Arremessar Chamas",
    "bonus": 4,
    "damage": "3d6",
    "type": "fogo",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 60,
    "longRangeFt": 60
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
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "bolaDeFogo",
    "medo",
    "invisibilidade",
    "detectarMagia",
    "detectarPensamentos",
    "maoMagica"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "bolaDeFogo": 1,
    "medo": 2,
    "invisibilidade": 2
   },
   "aVontade": [
    "detectarMagia",
    "detectarPensamentos",
    "maoMagica"
   ],
   "cdPorMagia": {
    "bolaDeFogo": 12,
    "medo": 12,
    "invisibilidade": 12,
    "detectarMagia": 12,
    "detectarPensamentos": 12,
    "maoMagica": 12
   }
  },
  "regeneracao": {
   "pv": 10,
   "bloqueia": []
  },
  "traits": [
   "metamorfo",
   "resistenciaAMagia",
   "regeneracaoDoLivro"
  ],
  "blurb": "Combina mordida e garras (ou cajado) em três ataques por turno, ou arremessa chamas à distância, e regenera 10 PV por rodada. Pode se disfarçar de humanoide, ficar invisível e soltar uma bola de fogo.",
  "lore": "Os slaads verdes são aberrações anfíbias do caos, nascidas do Limbo, mais astutas que seus parentes vermelhos e azuis. Muitos já foram slaads menores que amadureceram e agora dominam alguma magia inata. Gostam de se infiltrar entre humanoides sob forma disfarçada, espalhando desordem e buscando conhecimento arcano. Alguns carregam no cérebro uma gema de controle que os prende à vontade de quem a possui."
 },
 "grickAlfa": {
  "id": "grickAlfa",
  "tipo": "monstruosidade",
  "name": "Grick Alfa",
  "nomeOriginal": "Grick Alpha",
  "fonte": "MM",
  "size": "grande",
  "level": 5,
  "cr": "7",
  "xp": 2900,
  "abilities": {
   "str": 18,
   "dex": 16,
   "con": 15,
   "int": 4,
   "wis": 14,
   "cha": 9
  },
  "ac": 18,
  "acNote": "armadura natural",
  "maxHp": 75,
  "hpDice": "10d10+20",
  "speedFt": 30,
  "speeds": {
   "climbFt": 30
  },
  "senses": {
   "passivePerception": 12,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Cauda",
    "bonus": 7,
    "damage": "2d6+4",
    "type": "concussão",
    "reachFt": 10
   },
   {
    "name": "Tentáculos",
    "bonus": 7,
    "damage": "4d8+4",
    "type": "cortante",
    "reachFt": 10
   },
   {
    "name": "Bico",
    "bonus": 7,
    "damage": "2d8+4",
    "type": "perfurante",
    "reachFt": 10
   }
  ],
  "multiattack": {
   "count": 2
  },
  "traits": [
   "camuflagemDePedra"
  ],
  "blurb": "Ataca com cauda e tentáculos a 3 m de distância e, se os tentáculos acertarem, finaliza com uma bicada no mesmo alvo. Armas comuns pouco o ferem, pois ele resiste a dano físico não mágico.",
  "lore": "O grick alfa é o maior e mais forte de um ninho de gricks, uma fera vermiforme de couro rochoso que lembra uma pedra até a hora do bote. Vive em cavernas do Subterrâneo e em florestas de terreno pedregoso, onde espera imóvel que a presa se aproxime. Costuma liderar os gricks menores e fica com a melhor parte da caça. Pouco inteligente, age por instinto e luta até afastar ou devorar o que invadiu seu território."
 },
 "grifo": {
  "id": "grifo",
  "tipo": "monstruosidade",
  "name": "Grifo",
  "nomeOriginal": "Griffon",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 18,
   "dex": 15,
   "con": 16,
   "int": 2,
   "wis": 13,
   "cha": 8
  },
  "ac": 12,
  "maxHp": 59,
  "hpDice": "7d10+21",
  "speedFt": 30,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80
  },
  "senses": {
   "passivePerception": 15,
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
    "name": "Bico",
    "bonus": 6,
    "damage": "1d8+4",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Garras",
    "bonus": 6,
    "damage": "2d6+4",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Bico",
    "Garras"
   ]
  },
  "traits": [
   "visaoAgucada"
  ],
  "blurb": "Predador alado veloz que mergulha do alto e ataca com bico e garras na mesma rodada. Seu voo de 24 m permite escolher o alvo e fugir do alcance de quem luta a pé.",
  "lore": "Metade leão, metade águia, o grifo é um carnívoro feroz que caça em pequenos bandos a partir de ninhos erguidos em penhascos rochosos. Cavalos e animais de rebanho são sua presa favorita, e quem defende a montaria vira alvo da fúria da fera, enquanto quem a abandona costuma sair ileso. É territorial e derruba invasores do céu ou dos rochedos sem hesitar. Criado desde o ovo por treinadores experientes, pode se tornar uma montaria leal até a morte, embora jamais perca a fome por carne de cavalo."
 },
 "grimlock": {
  "id": "grimlock",
  "tipo": "humanoide",
  "name": "Grimlock",
  "nomeOriginal": "Grimlock",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 16,
   "dex": 12,
   "con": 12,
   "int": 9,
   "wis": 8,
   "cha": 6
  },
  "ac": 11,
  "maxHp": 11,
  "hpDice": "2d8+2",
  "speedFt": 30,
  "senses": {
   "passivePerception": 13,
   "blindsightFt": 30
  },
  "saves": [],
  "skills": [
   "atletismo",
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "conditionImmunities": [
   "cego"
  ],
  "attacks": [
   {
    "name": "Clava de Osso com Espinhos",
    "bonus": 5,
    "damage": "1d4+3",
    "type": "concussão",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d4",
     "type": "perfurante"
    }
   }
  ],
  "traits": [
   "t_sentidosCegos",
   "keenHearingSmell",
   "camuflagemDePedra"
  ],
  "blurb": "Caçador cego que percebe tudo ao redor pela audição e pelo olfato, imune a ilusões visuais e à cegueira. Golpeia com uma clava de osso cravejada de espinhos que causa concussão e perfuração ao mesmo tempo.",
  "lore": "Os grimlocks descendem de humanos que, por gerações, cultuaram os devoradores de mentes como deuses e acabaram virando canibais monstruosos. Quando o império dos illithids ruiu, esses cultistas fugiram para o Subterrâneo, e na escuridão seus olhos atrofiaram até as pálpebras se fecharem de vez. Hoje dependem de ouvidos e narizes aguçadíssimos, espalhando sangue e vísceras longe de seus covis para farejar a chegada de intrusos. Ainda servem aos devoradores de mentes e sobem à superfície para sequestrar vítimas, travando uma guerra que para eles nunca terminou."
 },
 "nagaGuardia": {
  "id": "nagaGuardia",
  "tipo": "monstruosidade",
  "name": "Naga Guardiã",
  "nomeOriginal": "Guardian Naga",
  "fonte": "MM",
  "size": "grande",
  "level": 9,
  "cr": "10",
  "xp": 5900,
  "abilities": {
   "str": 19,
   "dex": 18,
   "con": 16,
   "int": 16,
   "wis": 19,
   "cha": 18
  },
  "ac": 18,
  "acNote": "armadura natural",
  "maxHp": 127,
  "hpDice": "15d10+45",
  "speedFt": 40,
  "senses": {
   "passivePerception": 14,
   "darkvisionFt": 60
  },
  "saves": [
   "dex",
   "con",
   "int",
   "wis",
   "cha"
  ],
  "skills": [],
  "expertise": [],
  "damageImmunities": [
   "veneno"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 8,
    "damage": "1d8+4",
    "type": "perfurante",
    "reachFt": 10,
    "onHit": {
     "save": "con",
     "dc": 15,
     "danoSeFalhar": {
      "damage": "10d8",
      "type": "veneno"
     },
     "metadeSePassar": true
    }
   },
   {
    "name": "Cuspir Veneno",
    "bonus": 8,
    "damage": "10d8",
    "type": "veneno",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 15,
    "longRangeFt": 30
   }
  ],
  "spellcasting": {
   "ability": "wis",
   "cantrips": [
    "consertar",
    "chamaSagrada",
    "taumaturgia"
   ],
   "prepared": [
    "comando",
    "curarFerimentos",
    "escudoDaFe",
    "acalmarEmocoes",
    "imobilizarPessoa",
    "rogarMaldicao",
    "clarividencia",
    "banimento",
    "liberdadeDeMovimento",
    "golpeDeChama",
    "missao",
    "visaoDaVerdade"
   ],
   "slots": [
    0,
    4,
    3,
    3,
    3,
    2,
    1
   ],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "cdPorMagia": {
    "consertar": 16,
    "chamaSagrada": 16,
    "taumaturgia": 16,
    "comando": 16,
    "curarFerimentos": 16,
    "escudoDaFe": 16,
    "acalmarEmocoes": 16,
    "imobilizarPessoa": 16,
    "rogarMaldicao": 16,
    "clarividencia": 16,
    "banimento": 16,
    "liberdadeDeMovimento": 16,
    "golpeDeChama": 16,
    "missao": 16,
    "visaoDaVerdade": 16
   }
  },
  "traits": [
   "t_rejuvenescimento"
  ],
  "blurb": "Conjuradora divina que usa magias como imobilizar pessoa, banimento e coluna de chamas, enquanto morde ou cospe um veneno capaz de causar 45 de dano. Mesmo derrotada, volta à vida em poucos dias.",
  "lore": "A naga guardiã é uma serpente gigante de rosto humano, sábia e devotada ao bem e à ordem. Ela protege lugares sagrados, relíquias e segredos antigos, muitas vezes em florestas ou desertos remotos. Prefere advertir intrusos antes de lutar, mas não hesita em destruir quem insiste em profanar o que guarda. Sua essência imortal a faz renascer após a morte, o que a torna uma sentinela praticamente eterna."
 },
 "ginosfinge": {
  "id": "ginosfinge",
  "tipo": "monstruosidade",
  "name": "Ginosfinge",
  "nomeOriginal": "Gynosphinx",
  "fonte": "MM",
  "size": "grande",
  "level": 9,
  "cr": "11",
  "xp": 7200,
  "abilities": {
   "str": 18,
   "dex": 15,
   "con": 16,
   "int": 18,
   "wis": 18,
   "cha": 18
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 136,
  "hpDice": "16d10+48",
  "speedFt": 40,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60
  },
  "senses": {
   "passivePerception": 18,
   "truesightFt": 120
  },
  "saves": [],
  "skills": [
   "arcanismo",
   "historia",
   "percepcao",
   "religiao"
  ],
  "expertise": [
   "arcanismo",
   "historia"
  ],
  "damageResistances": [
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "damageImmunities": [
   "psíquico"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "amedrontado"
  ],
  "attacks": [
   {
    "name": "Garra",
    "bonus": 8,
    "damage": "2d8+4",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Garra",
    "Garra"
   ]
  },
  "spellcasting": {
   "ability": "int",
   "cantrips": [
    "maoMagica",
    "ilusaoMenor",
    "prestidigitacao"
   ],
   "prepared": [
    "detectarMagia",
    "identificar",
    "escudoArcano",
    "escuridao",
    "localizarObjeto",
    "sugestao",
    "dissiparMagia",
    "removerMaldicao",
    "linguas",
    "banimento",
    "invisibilidadeMaior",
    "lendasEHistorias"
   ],
   "slots": [
    0,
    4,
    3,
    3,
    3,
    1
   ],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "cdPorMagia": {
    "maoMagica": 16,
    "ilusaoMenor": 16,
    "prestidigitacao": 16,
    "detectarMagia": 16,
    "identificar": 16,
    "escudoArcano": 16,
    "escuridao": 16,
    "localizarObjeto": 16,
    "sugestao": 16,
    "dissiparMagia": 16,
    "removerMaldicao": 16,
    "linguas": 16,
    "banimento": 16,
    "invisibilidadeMaior": 16,
    "lendasEHistorias": 16
   }
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Ataque de Garra",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Garra"
    },
    {
     "nome": "Teletransporte",
     "custo": 2,
     "tipo": "teleporte",
     "alcanceFt": 120
    },
    {
     "nome": "Conjurar Magia",
     "custo": 3,
     "tipo": "magia"
    }
   ]
  },
  "traits": [
   "t_inescrutavel",
   "armasMagicas",
   "acoesLendarias"
  ],
  "blurb": "Conjuradora poderosa que alterna garras com magias como banimento e invisibilidade maior, teleportando-se pelo campo com ações lendárias. Resiste a armas comuns e enxerga a verdade a 36 m.",
  "lore": "A ginosfinge é uma guardiã sagrada com corpo de leão, asas e rosto de mulher, posta pelos deuses para proteger segredos e saberes antigos. Costuma habitar ruínas e templos esquecidos no deserto. Adora enigmas, charadas e conversas eruditas, testando a mente de quem a procura antes de conceder passagem ou conhecimento. Quem falha em seus desafios ou a desrespeita descobre que sua magia é tão afiada quanto suas garras."
 },
 "meioOgroOgrilhao": {
  "id": "meioOgroOgrilhao",
  "tipo": "gigante",
  "name": "Meio-Ogro (Ogrilhão)",
  "nomeOriginal": "Half-Ogre (Ogrillon)",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 17,
   "dex": 10,
   "con": 14,
   "int": 7,
   "wis": 9,
   "cha": 10
  },
  "ac": 12,
  "acNote": "armadura de couro cru",
  "maxHp": 30,
  "hpDice": "4d10+8",
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
    "name": "Machado de Batalha",
    "bonus": 5,
    "damage": "2d8+3",
    "type": "cortante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "2d10+3",
     "type": "cortante"
    }
   },
   {
    "name": "Azagaia",
    "bonus": 5,
    "damage": "2d6+3",
    "type": "perfurante",
    "reachFt": 5,
    "rangeFt": 30,
    "longRangeFt": 120
   }
  ],
  "traits": [],
  "blurb": "Um brutamontes grande que golpeia com um machado de batalha pesado e arremessa azagaias. Cada acerto causa dano alto para uma criatura de ND 1.",
  "lore": "O meio-ogro nasce da união entre um ogro e um humano, um orc ou outro humanoide. Herda o tamanho e a força do lado ogro, mas costuma ser um pouco mais esperto. Muitos vivem à margem, servindo de mercenários, guarda-costas ou capangas de tribos e bandos. O temperamento varia bastante, e alguns chegam a conviver bem em vilas e cidades."
 },
 "veteranoMeioDragaoVermelho": {
  "id": "veteranoMeioDragaoVermelho",
  "tipo": "humanoide",
  "name": "Veterano Meio-Dragão Vermelho",
  "nomeOriginal": "Half-Red Dragon Veteran",
  "fonte": "MM",
  "size": "médio",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 16,
   "dex": 13,
   "con": 14,
   "int": 10,
   "wis": 11,
   "cha": 10
  },
  "ac": 18,
  "acNote": "armadura de placas",
  "maxHp": 65,
  "hpDice": "10d8+20",
  "speedFt": 30,
  "senses": {
   "passivePerception": 12,
   "blindsightFt": 10,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "atletismo",
   "percepcao"
  ],
  "expertise": [],
  "damageResistances": [
   "fogo"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Espada Longa",
    "bonus": 5,
    "damage": "1d8+3",
    "type": "cortante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d10+3",
     "type": "cortante"
    }
   },
   {
    "name": "Espada Curta",
    "bonus": 5,
    "damage": "1d6+3",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Besta Pesada",
    "bonus": 3,
    "damage": "1d10+1",
    "type": "perfurante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 100,
    "longRangeFt": 400
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Espada Longa",
    "Espada Longa"
   ]
  },
  "breath": {
   "name": "Sopro de Fogo",
   "kind": "save",
   "shape": "cone",
   "areaFt": 15,
   "save": "dex",
   "dc": 15,
   "damage": "7d6",
   "damageType": "fogo",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    5,
    6
   ]
  },
  "traits": [],
  "blurb": "Guerreiro blindado que golpeia duas vezes com a espada longa e pode somar um golpe de espada curta. Seu sopro de fogo em cone causa dano pesado a grupos próximos.",
  "lore": "Meio-dragões surgem da união de um dragão disfarçado por magia com outra criatura, ou de rituais e feitiços que misturam sangue dracônico a um ser comum. Este é um soldado humano experiente que herdou a fúria e o orgulho dos dragões vermelhos. Não pode gerar filhos naturalmente, mas vive cerca do dobro de um humano comum. Costuma ser ganancioso, arrogante e desconfiado, e enxerga no escuro graças à sua herança."
 },
 "harpia": {
  "id": "harpia",
  "tipo": "monstruosidade",
  "name": "Harpia",
  "nomeOriginal": "Harpy",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 12,
   "dex": 13,
   "con": 12,
   "int": 7,
   "wis": 10,
   "cha": 13
  },
  "ac": 11,
  "maxHp": 38,
  "hpDice": "7d8+7",
  "speedFt": 20,
  "flyFt": 40,
  "speeds": {
   "flyFt": 40
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
    "name": "Garras",
    "bonus": 3,
    "damage": "2d4+1",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Clava",
    "bonus": 3,
    "damage": "1d4+1",
    "type": "concussão",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Garras",
    "Clava"
   ]
  },
  "acoesEspeciais": [
   {
    "nome": "Canção Sedutora",
    "tipo": "area",
    "shape": "raio",
    "areaFt": 300,
    "save": "wis",
    "dc": 11,
    "condition": "enfeiticado",
    "rounds": 10,
    "repete": true,
    "imunizaAoPassar": true
   }
  ],
  "traits": [],
  "blurb": "Canta uma melodia mágica que enfeitiça humanoides e gigantes a até 90 m, fazendo-os caminhar até ela incapacitados, muitas vezes por cima de precipícios e armadilhas. De perto, ataca com garras e clava.",
  "lore": "A harpia tem corpo, pernas e asas de abutre unidos ao tronco, braços e cabeça de uma mulher, e sente prazer genuíno com a dor alheia. Segundo a lenda, a primeira delas foi uma elfa amaldiçoada depois de não conseguir atrair um deus com seu canto. Vive em penhascos costeiros, montanhas e ruínas isoladas, lugares perigosos para quem não voa. É covarde: só ataca com vantagem clara e foge se a luta se complica. Guarda troféus e objetos brilhantes das vítimas em ninhos imundos."
 },
 "falcao": {
  "id": "falcao",
  "tipo": "fera",
  "name": "Falcão",
  "nomeOriginal": "Hawk",
  "fonte": "MM",
  "size": "miúdo",
  "level": 1,
  "cr": "0",
  "xp": 10,
  "abilities": {
   "str": 5,
   "dex": 16,
   "con": 8,
   "int": 2,
   "wis": 14,
   "cha": 6
  },
  "ac": 13,
  "maxHp": 1,
  "hpDice": "1d4-1",
  "speedFt": 10,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60
  },
  "senses": {
   "passivePerception": 14
  },
  "saves": [],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Garras",
    "bonus": 5,
    "damage": 1,
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "traits": [
   "visaoAgucada"
  ],
  "blurb": "Ave de rapina ágil que mergulha do alto para ferir com as garras; frágil, mas difícil de surpreender graças à visão aguçada.",
  "lore": "O falcão é uma pequena ave de caça que domina os céus de campos, florestas e montanhas. Plana em grandes altitudes vigiando o chão em busca de roedores e pássaros menores. Quando avista uma presa, despenca num mergulho veloz e a agarra com as garras. Por sua visão excepcional, costuma ser treinado por caçadores e servir de familiar a conjuradores."
 },
 "caoInfernal": {
  "id": "caoInfernal",
  "tipo": "corruptor",
  "name": "Cão Infernal",
  "nomeOriginal": "Hell Hound",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 17,
   "dex": 12,
   "con": 14,
   "int": 6,
   "wis": 13,
   "cha": 6
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 45,
  "hpDice": "7d8+14",
  "speedFt": 50,
  "senses": {
   "passivePerception": 15,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "percepcao"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "fogo"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 5,
    "damage": "1d8+3",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "2d6",
     "type": "fogo"
    }
   }
  ],
  "breath": {
   "name": "Sopro de Fogo",
   "kind": "save",
   "shape": "cone",
   "areaFt": 15,
   "save": "dex",
   "dc": 12,
   "damage": "6d6",
   "damageType": "fogo",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    5,
    6
   ]
  },
  "traits": [
   "keenHearingSmell",
   "packTactics"
  ],
  "blurb": "Caça em matilha, cercando a presa para atacar com vantagem, e morde com presas em brasa. De tempos em tempos cospe um cone de fogo que castiga grupos amontoados.",
  "lore": "O cão infernal é um corruptor com corpo de cão robusto e fogo ardendo nas entranhas, comum nos campos de batalha de Aqueronte e nos Planos Inferiores. No Plano Material costuma servir de guardião e companheiro a diabos, gigantes de fogo e outros senhores malignos. As matilhas escolhem as vítimas mais frágeis e as perseguem sem descanso, e cada refeição alimenta a chama interior. É esperto e obedece bem, mas nunca será outra coisa além de um assassino cruel; se o dono não o deixa saciar a fome, ele foge ou se volta contra ele. Ao morrer, o corpo se desfaz em fumaça e brasas, restando só tufos de pelo negro chamuscado."
 },
 "hezrou": {
  "id": "hezrou",
  "tipo": "corruptor",
  "name": "Hezrou",
  "nomeOriginal": "Hezrou",
  "fonte": "MM",
  "size": "grande",
  "level": 5,
  "cr": "8",
  "xp": 3900,
  "abilities": {
   "str": 19,
   "dex": 17,
   "con": 20,
   "int": 5,
   "wis": 12,
   "cha": 13
  },
  "ac": 16,
  "acNote": "armadura natural",
  "maxHp": 136,
  "hpDice": "13d10+65",
  "speedFt": 30,
  "senses": {
   "passivePerception": 11,
   "darkvisionFt": 120
  },
  "saves": [
   "str",
   "con",
   "wis"
  ],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "frio",
   "fogo",
   "elétrico",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "damageImmunities": [
   "veneno"
  ],
  "conditionImmunities": [
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 7,
    "damage": "2d10+4",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Garras",
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
    "Garras",
    "Garras"
   ]
  },
  "aura": {
   "raioFt": 10,
   "quando": "inicioDoAlvo",
   "save": "con",
   "dc": 14,
   "condition": "envenenado",
   "imunizaAoPassar": true
  },
  "traits": [
   "resistenciaAMagia",
   "aura"
  ],
  "blurb": "Demônio sapo robusto que avança para a linha de frente com mordida e duas garras. Seu fedor pode envenenar quem fica a até 3 m dele no início do turno.",
  "lore": "O hezrou é um demônio do Abismo com corpo de sapo gigante, couro grosso e braços terminados em garras. Nas hordas demoníacas, costuma servir de tropa de choque e esmaga as fileiras inimigas com força bruta. É pouco inteligente, mas teimoso e cruel, e só obedece a demônios mais poderosos por medo. Exala um cheiro pútrido tão forte que deixa nauseado qualquer um que se aproxime."
 },
 "giganteDaColina": {
  "id": "giganteDaColina",
  "tipo": "gigante",
  "name": "Gigante da Colina",
  "nomeOriginal": "Hill Giant",
  "fonte": "MM",
  "size": "enorme",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 21,
   "dex": 8,
   "con": 19,
   "int": 5,
   "wis": 9,
   "cha": 6
  },
  "ac": 13,
  "acNote": "armadura natural",
  "maxHp": 105,
  "hpDice": "10d12+40",
  "speedFt": 40,
  "senses": {
   "passivePerception": 12
  },
  "saves": [],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Clava Grande",
    "bonus": 8,
    "damage": "3d8+5",
    "type": "concussão",
    "reachFt": 10
   },
   {
    "name": "Rocha",
    "bonus": 8,
    "damage": "3d10+5",
    "type": "concussão",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 60,
    "longRangeFt": 240
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Clava Grande",
    "Clava Grande"
   ]
  },
  "traits": [],
  "blurb": "Brutamontes que esmaga inimigos com dois golpes de clava grande por turno e alcance de 3 m, ou arremessa rochas de longe. Cada acerto causa dano enorme de concussão.",
  "lore": "Gigantes da colina são os mais simplórios e gulosos de sua raça, vivendo em colinas e vales onde saqueiam fazendas e rebanhos. Passam a vida comendo tudo o que encontram, inclusive criaturas menores. São preguiçosos e pouco espertos, mas sua força bruta os torna temíveis. Costumam viver em bandos desorganizados, liderados pelo mais forte ou mais gordo."
 },
 "hipogrifo": {
  "id": "hipogrifo",
  "tipo": "monstruosidade",
  "name": "Hipogrifo",
  "nomeOriginal": "Hippogriff",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 17,
   "dex": 13,
   "con": 13,
   "int": 2,
   "wis": 12,
   "cha": 8
  },
  "ac": 11,
  "maxHp": 19,
  "hpDice": "3d10+3",
  "speedFt": 40,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60
  },
  "senses": {
   "passivePerception": 15
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
    "name": "Bico",
    "bonus": 5,
    "damage": "1d10+3",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Garras",
    "bonus": 5,
    "damage": "2d6+3",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Bico",
    "Garras"
   ]
  },
  "traits": [
   "visaoAgucada"
  ],
  "blurb": "Ataca do alto com bico e garras na mesma rodada, mergulhando a 18 m de voo. Tem visão aguçada, o que torna difícil surpreendê-lo.",
  "lore": "Metade águia e metade cavalo, o hipogrifo surgiu de alguma magia antiga cuja história ninguém mais lembra. Vive em montanhas, colinas e campos abertos, quase sempre perto do ninho, e forma um casal para a vida toda. Arisco por natureza, luta até morrer para proteger o parceiro ou os filhotes, que nascem vivos em vez de sair de ovos. Dragões, grifos e serpes o caçam com frequência. Criado desde pequeno, torna-se uma das montarias voadoras mais fáceis de treinar e mais leais que existem."
 },
 "capitaoHobgoblin": {
  "id": "capitaoHobgoblin",
  "tipo": "humanoide",
  "name": "Capitão Hobgoblin",
  "nomeOriginal": "Hobgoblin Captain",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 15,
   "dex": 14,
   "con": 14,
   "int": 12,
   "wis": 10,
   "cha": 13
  },
  "ac": 17,
  "acNote": "meia-armadura",
  "maxHp": 39,
  "hpDice": "6d8+12",
  "speedFt": 30,
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Espada Grande",
    "bonus": 4,
    "damage": "2d6+2",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Azagaia",
    "bonus": 4,
    "damage": "1d6+2",
    "type": "perfurante",
    "reachFt": 5,
    "rangeFt": 30,
    "longRangeFt": 120
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Espada Grande",
    "Espada Grande"
   ]
  },
  "traits": [
   "lideranca",
   "martialAdvantage"
  ],
  "blurb": "Comandante disciplinado que golpeia duas vezes com a espada grande e causa dano extra quando um aliado está ao lado do alvo. Sua liderança fortalece os ataques e resistências da tropa.",
  "lore": "Capitães hobgoblins comandam companhias de guerreiros goblinoides com rigor militar e pouca paciência para falhas. Sobem de posto provando valor em batalha e mantêm a ordem pela força e pelo exemplo. São vistos em acampamentos fortificados, desde planícies e colinas até as profundezas do Subterrâneo. Em combate, coordenam formações e gritam ordens que mantêm os soldados firmes."
 },
 "senhorDaGuerraHobgoblin": {
  "id": "senhorDaGuerraHobgoblin",
  "tipo": "humanoide",
  "name": "Senhor da Guerra Hobgoblin",
  "nomeOriginal": "Hobgoblin Warlord",
  "fonte": "MM",
  "size": "médio",
  "level": 5,
  "cr": "6",
  "xp": 2300,
  "abilities": {
   "str": 16,
   "dex": 14,
   "con": 16,
   "int": 14,
   "wis": 11,
   "cha": 15
  },
  "ac": 20,
  "acNote": "armadura de placas e escudo",
  "maxHp": 97,
  "hpDice": "13d8+39",
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
    "name": "Espada Longa",
    "bonus": 9,
    "damage": "1d8+3",
    "type": "cortante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d10+3",
     "type": "cortante"
    }
   },
   {
    "name": "Golpe de Escudo",
    "bonus": 9,
    "damage": "1d4+3",
    "type": "concussão",
    "reachFt": 5,
    "onHit": {
     "save": "str",
     "dc": 14,
     "condition": "caido",
     "rounds": 1,
     "repete": false
    }
   },
   {
    "name": "Azagaia",
    "bonus": 9,
    "damage": "1d6+3",
    "type": "perfurante",
    "reachFt": 5,
    "rangeFt": 30,
    "longRangeFt": 120
   }
  ],
  "multiattack": {
   "count": 3
  },
  "traits": [
   "lideranca",
   "martialAdvantage",
   "aparar"
  ],
  "blurb": "Comandante blindado que desfere três golpes por turno, derruba inimigos com o escudo e causa dano extra quando um aliado está ao lado do alvo. Sua liderança fortalece ataques e resistências da tropa inteira.",
  "lore": "O senhor da guerra é o topo da hierarquia militar hobgoblin, um general que conquistou o posto por mérito em batalha. Comanda legiões disciplinadas em campanhas de conquista por colinas, florestas, desertos e até no Subterrâneo. Valoriza a ordem, a estratégia e a obediência acima de tudo. Raramente luta sozinho, preferindo cercar os inimigos com seus soldados antes de avançar."
 },
 "homunculo": {
  "id": "homunculo",
  "tipo": "constructo",
  "name": "Homúnculo",
  "nomeOriginal": "Homunculus",
  "fonte": "MM",
  "size": "miúdo",
  "level": 1,
  "cr": "0",
  "xp": 10,
  "abilities": {
   "str": 4,
   "dex": 15,
   "con": 11,
   "int": 10,
   "wis": 10,
   "cha": 7
  },
  "ac": 13,
  "acNote": "armadura natural",
  "maxHp": 5,
  "hpDice": "2d4",
  "speedFt": 20,
  "flyFt": 40,
  "speeds": {
   "flyFt": 40
  },
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
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 4,
    "damage": 1,
    "type": "perfurante",
    "reachFt": 5,
    "onHit": {
     "save": "con",
     "dc": 10,
     "condition": "envenenado",
     "rounds": 10,
     "repete": false
    }
   }
  ],
  "traits": [
   "t_eloTelepatico"
  ],
  "blurb": "Pequeno constructo voador que morde com veneno capaz de deixar a vítima envenenada e até inconsciente. Frágil, prefere espionar e fugir a lutar de frente.",
  "lore": "O homúnculo é um servo minúsculo, do tamanho de um esquilo, moldado por um ritual raro com barro, cinzas, raiz de mandrágora e sangue. Ele funciona como uma extensão do seu criador: os dois partilham pensamentos, sentidos e idiomas por meio de um elo místico. Cada mestre só pode manter um deles por vez, e se o criador morre, o homúnculo perece junto. Magos e aventureiros o usam como batedor, espião ou mensageiro, já que tudo o que ele percebe chega ao mestre, mesmo de muito longe."
 },
 "horrorGancho": {
  "id": "horrorGancho",
  "tipo": "monstruosidade",
  "name": "Horror Gancho",
  "nomeOriginal": "Hook Horror",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 18,
   "dex": 10,
   "con": 15,
   "int": 6,
   "wis": 12,
   "cha": 7
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 75,
  "hpDice": "10d10+20",
  "speedFt": 30,
  "speeds": {
   "climbFt": 30
  },
  "senses": {
   "passivePerception": 13,
   "blindsightFt": 60,
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
    "name": "Gancho",
    "bonus": 6,
    "damage": "2d6+4",
    "type": "perfurante",
    "reachFt": 10
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Gancho",
    "Gancho"
   ]
  },
  "traits": [
   "echolocation",
   "keenHearing"
  ],
  "blurb": "Golpeia duas vezes por turno com ganchos de 3 m de alcance, mantendo inimigos à distância enquanto escala paredes. Sente presas no escuro pela ecolocalização, mas fica sem esse sentido se for ensurdecido.",
  "lore": "Predador agressivo do Subterrâneo, tem cabeça parecida com a de um abutre, corpo de besouro gigante e membros terminados em garras curvas como anzóis. Usa esses ganchos para subir penhascos e paredes de cavernas, atacando presas de cima, e foge escalando quando a luta vai mal. Caça em bandos e come de tudo, de fungos e líquens a qualquer criatura que consiga pegar. Vive em clãs familiares liderados pela fêmea mais velha e se comunica batendo os ganchos na carapaça ou na rocha, num idioma de estalos que ecoa por quilômetros."
 },
 "diaboChifrudo": {
  "id": "diaboChifrudo",
  "tipo": "corruptor",
  "name": "Diabo Chifrudo",
  "nomeOriginal": "Horned Devil",
  "fonte": "MM",
  "size": "grande",
  "level": 9,
  "cr": "11",
  "xp": 7200,
  "abilities": {
   "str": 22,
   "dex": 17,
   "con": 21,
   "int": 12,
   "wis": 16,
   "cha": 17
  },
  "ac": 18,
  "acNote": "armadura natural",
  "maxHp": 178,
  "hpDice": "17d10+85",
  "speedFt": 20,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60
  },
  "senses": {
   "passivePerception": 13,
   "darkvisionFt": 120
  },
  "saves": [
   "str",
   "dex",
   "wis",
   "cha"
  ],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "frio",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "damageImmunities": [
   "fogo",
   "veneno"
  ],
  "conditionImmunities": [
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Tridente",
    "bonus": 10,
    "damage": "2d8+6",
    "type": "perfurante",
    "reachFt": 10
   },
   {
    "name": "Cauda",
    "bonus": 10,
    "damage": "1d8+6",
    "type": "perfurante",
    "reachFt": 10
   },
   {
    "name": "Arremessar Chamas",
    "bonus": 7,
    "damage": "4d6",
    "type": "fogo",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 150,
    "longRangeFt": 150
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Tridente",
    "Tridente",
    "Cauda"
   ]
  },
  "features": [
   "devilsSight"
  ],
  "traits": [
   "resistenciaAMagia"
  ],
  "blurb": "Voa sobre o campo e golpeia com o tridente e a cauda a 3 m de distância, ou lança chamas de longe. O ferimento infernal da cauda drena PV a cada turno e piora a cada novo acerto.",
  "lore": "Diabos chifrudos são soldados alados dos Nove Infernos, brutos que preferem cumprir ordens a pensar nelas. Servem como tropa de choque e guardas nas legiões infernais. Detestam a própria posição e obedecem por medo dos superiores. Em batalha, mergulham do alto para empalar os inimigos."
 },
 "tubaraoCacador": {
  "id": "tubaraoCacador",
  "tipo": "fera",
  "name": "Tubarão-Caçador",
  "nomeOriginal": "Hunter Shark",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 18,
   "dex": 13,
   "con": 15,
   "int": 1,
   "wis": 10,
   "cha": 4
  },
  "ac": 12,
  "acNote": "armadura natural",
  "maxHp": 45,
  "hpDice": "6d10+12",
  "speedFt": 0,
  "speeds": {
   "swimFt": 40
  },
  "senses": {
   "passivePerception": 12,
   "blindsightFt": 30
  },
  "saves": [],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 6,
    "damage": "2d8+4",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "traits": [
   "frenesiDeSangue",
   "t_respiracaoAquatica"
  ],
  "blurb": "Predador marinho de mordida brutal que fica ainda mais letal contra presas feridas, atacando com vantagem quem já perdeu PV. Só se move e respira dentro d'água.",
  "lore": "O tubarão-caçador é um peixe de porte médio entre os tubarões, maior e mais agressivo que os de recife, mas menor que os gigantes. Adultos chegam a medir de 4,5 a 6 metros. Ronda as águas profundas e costuma caçar sozinho. Ainda assim, vários deles podem se reunir onde há comida farta."
 },
 "hiena": {
  "id": "hiena",
  "tipo": "fera",
  "name": "Hiena",
  "nomeOriginal": "Hyena",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "0",
  "xp": 10,
  "abilities": {
   "str": 11,
   "dex": 13,
   "con": 12,
   "int": 2,
   "wis": 12,
   "cha": 5
  },
  "ac": 11,
  "maxHp": 5,
  "hpDice": "1d8+1",
  "speedFt": 50,
  "senses": {
   "passivePerception": 13
  },
  "saves": [],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 2,
    "damage": "1d6",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "traits": [
   "packTactics"
  ],
  "blurb": "Ataca em bando, cercando a presa para morder com vantagem graças às Táticas de Matilha. Sozinha é fraca, mas várias juntas desgastam rapidamente um alvo isolado.",
  "lore": "A hiena é um carniceiro astuto das savanas, colinas, florestas e desertos. Vive em clãs barulhentos que disputam carcaças com outros predadores e atacam animais feridos ou desgarrados. Suas risadas estridentes anunciam a caçada e costumam atrair a atenção de gnolls, que as veem com simpatia. Covardes quando isoladas, tornam-se ousadas quando o grupo é numeroso."
 },
 "diaboDoGelo": {
  "id": "diaboDoGelo",
  "tipo": "corruptor",
  "name": "Diabo do Gelo",
  "nomeOriginal": "Ice Devil",
  "fonte": "MM",
  "size": "grande",
  "level": 13,
  "cr": "14",
  "xp": 11500,
  "abilities": {
   "str": 21,
   "dex": 14,
   "con": 18,
   "int": 18,
   "wis": 15,
   "cha": 18
  },
  "ac": 18,
  "acNote": "armadura natural",
  "maxHp": 180,
  "hpDice": "19d10+76",
  "speedFt": 40,
  "senses": {
   "passivePerception": 12,
   "blindsightFt": 60,
   "darkvisionFt": 120
  },
  "saves": [
   "dex",
   "con",
   "wis",
   "cha"
  ],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "damageImmunities": [
   "fogo",
   "veneno",
   "frio"
  ],
  "conditionImmunities": [
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 10,
    "damage": "2d6+5",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "3d6",
     "type": "frio"
    }
   },
   {
    "name": "Garras",
    "bonus": 10,
    "damage": "2d4+5",
    "type": "cortante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "3d6",
     "type": "frio"
    }
   },
   {
    "name": "Cauda",
    "bonus": 10,
    "damage": "2d6+5",
    "type": "concussão",
    "reachFt": 10,
    "danoExtra": {
     "damage": "3d6",
     "type": "frio"
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida",
    "Garras",
    "Cauda"
   ]
  },
  "acoesEspeciais": [
   {
    "nome": "Muralha de Gelo",
    "recharge": [
     6
    ],
    "tipo": "area",
    "shape": "raio",
    "areaFt": 60,
    "save": "dex",
    "dc": 17,
    "damage": "10d6",
    "damageType": "frio",
    "halfOnSave": true,
    "condition": "incapacitado",
    "rounds": 10,
    "repete": false
   }
  ],
  "features": [
   "devilsSight"
  ],
  "traits": [
   "resistenciaAMagia"
  ],
  "blurb": "Fera insectoide que dilacera com mordida, garras e cauda, cada golpe somando frio intenso. Ergue muralhas de gelo que dividem o grupo e castigam quem as atravessa.",
  "lore": "Diabos do gelo são infernais de alto escalão, comandantes frios e calculistas das legiões dos Nove Infernos. Lembram enormes insetos bípedes de carapaça branca, com mandíbulas cortantes e uma longa cauda. Odeiam a perda de controle e tratam seus subordinados com crueldade gélida. Muitos empunham lanças de gelo que entorpecem as vítimas, e alguns podem convocar outros de sua espécie para o combate."
 },
 "mefiteDeGelo": {
  "id": "mefiteDeGelo",
  "tipo": "elemental",
  "name": "Mefite de Gelo",
  "nomeOriginal": "Ice Mephit",
  "fonte": "MM",
  "size": "pequeno",
  "level": 1,
  "cr": "1/2",
  "xp": 100,
  "abilities": {
   "str": 7,
   "dex": 13,
   "con": 10,
   "int": 9,
   "wis": 11,
   "cha": 12
  },
  "ac": 11,
  "maxHp": 21,
  "hpDice": "6d6",
  "speedFt": 30,
  "flyFt": 30,
  "speeds": {
   "flyFt": 30
  },
  "senses": {
   "passivePerception": 12,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "damageImmunities": [
   "frio",
   "veneno"
  ],
  "damageVulnerabilities": [
   "concussão",
   "fogo"
  ],
  "conditionImmunities": [
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Garras",
    "bonus": 3,
    "damage": "1d4+1",
    "type": "cortante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d4",
     "type": "frio"
    }
   }
  ],
  "breath": {
   "name": "Sopro Congelante",
   "kind": "save",
   "shape": "cone",
   "areaFt": 15,
   "save": "dex",
   "dc": 10,
   "damage": "2d4",
   "damageType": "frio",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    6
   ]
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "nevoaObscurecente"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "aVontade": [
    "nevoaObscurecente"
   ]
  },
  "explosaoAoMorrer": {
   "pes": 5,
   "save": "dex",
   "dc": 10,
   "dano": "1d8",
   "tipo": "cortante",
   "metade": true
  },
  "traits": [
   "explosaoAoMorrer",
   "aparenciaFalsa"
  ],
  "blurb": "Pequeno elemental voador que arranha com garras geladas e sopra um cone de frio; ao morrer, estoura em estilhaços de gelo que cortam quem estiver colado nele.",
  "lore": "Mefites do gelo são diabretes elementais nascidos da fusão dos planos do ar e da água. Rondam as regiões árticas e geleiras, muitas vezes servindo a magos ou criaturas mais poderosas. São frios, distantes e cruéis, com um senso de humor mesquinho. Costumam ficar parados como lascas de gelo comuns para emboscar viajantes desatentos."
 },
 "diabrete": {
  "id": "diabrete",
  "tipo": "corruptor",
  "name": "Diabrete",
  "nomeOriginal": "Imp",
  "fonte": "MM",
  "size": "miúdo",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 6,
   "dex": 17,
   "con": 13,
   "int": 11,
   "wis": 12,
   "cha": 14
  },
  "ac": 13,
  "maxHp": 10,
  "hpDice": "3d4+3",
  "speedFt": 20,
  "flyFt": 40,
  "speeds": {
   "flyFt": 40
  },
  "senses": {
   "passivePerception": 11,
   "darkvisionFt": 120
  },
  "saves": [],
  "skills": [
   "enganacao",
   "intuicao",
   "persuasao",
   "furtividade"
  ],
  "expertise": [],
  "damageResistances": [
   "frio",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "damageImmunities": [
   "fogo",
   "veneno"
  ],
  "conditionImmunities": [
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Ferrão (Mordida na Forma Animal)",
    "bonus": 5,
    "damage": "1d4+3",
    "type": "perfurante",
    "reachFt": 5,
    "onHit": {
     "save": "con",
     "dc": 11,
     "danoSeFalhar": {
      "damage": "3d6",
      "type": "veneno"
     },
     "metadeSePassar": true
    }
   }
  ],
  "features": [
   "devilsSight"
  ],
  "traits": [
   "invisivelAVontade",
   "metamorfo",
   "resistenciaAMagia"
  ],
  "blurb": "Pequeno diabo voador que se torna invisível, aproxima-se sem ser visto e crava um ferrão venenoso. Resiste a magia e a armas comuns não prateadas, o que o torna difícil de derrubar.",
  "lore": "O diabrete é um demônio menor dos Nove Infernos, astuto e covarde, que adora intrigas e pequenas maldades. Muitos servem magos mortais como espiões, conselheiros ou familiares, sempre empurrando o mestre rumo à corrupção, de olho na alma dele. Apesar disso, costuma ser estranhamente leal e reage com fúria quando seu senhor é ameaçado. Disfarça-se de rato, corvo ou aranha para circular despercebido."
 },
 "incubo": {
  "id": "incubo",
  "tipo": "corruptor",
  "name": "Íncubo",
  "nomeOriginal": "Incubus",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "4",
  "xp": 1100,
  "abilities": {
   "str": 8,
   "dex": 17,
   "con": 13,
   "int": 15,
   "wis": 12,
   "cha": 20
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 66,
  "hpDice": "12d8+12",
  "speedFt": 30,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60
  },
  "senses": {
   "passivePerception": 15,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "enganacao",
   "intuicao",
   "percepcao",
   "persuasao",
   "furtividade"
  ],
  "expertise": [
   "enganacao",
   "intuicao",
   "percepcao",
   "persuasao",
   "furtividade"
  ],
  "damageResistances": [
   "frio",
   "fogo",
   "elétrico",
   "veneno",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Garra",
    "bonus": 5,
    "damage": "1d6+3",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "acoesEspeciais": [
   {
    "nome": "Encanto",
    "tipo": "alvo",
    "alcanceFt": 30,
    "save": "wis",
    "dc": 15,
    "condition": "enfeiticado",
    "rounds": 100,
    "repete": true,
    "imunizaAoPassar": true
   },
   {
    "nome": "Beijo Drenante",
    "tipo": "alvo",
    "alcanceFt": 5,
    "soComCondicao": "enfeiticado",
    "save": "con",
    "dc": 15,
    "damage": "5d10+5",
    "damageType": "psíquico",
    "halfOnSave": true,
    "reduzMaximo": true
   },
   {
    "nome": "Etereidade",
    "tipo": "etereo"
   }
  ],
  "traits": [
   "t_vinculoTelepatico",
   "metamorfo"
  ],
  "blurb": "Seduz à distância com seu Encanto e depois drena a vida da vítima com um beijo psíquico que reduz o máximo de PV. Em combate direto é frágil, preferindo fugir para o Plano Etéreo.",
  "lore": "O íncubo é um corruptor que se alimenta da devoção e da energia vital dos mortais. Assume formas humanas atraentes para circular por cidades, cultivando relações que terminam em ruína moral. Manipula suas vítimas com promessas e sonhos, mantendo contato telepático mesmo entre planos. Quando se cansa ou é descoberto, desaparece no Plano Etéreo."
 },
 "devoradorDeIntelecto": {
  "id": "devoradorDeIntelecto",
  "tipo": "aberração",
  "name": "Devorador de Intelecto",
  "nomeOriginal": "Intellect Devourer",
  "fonte": "MM",
  "size": "miúdo",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 6,
   "dex": 14,
   "con": 13,
   "int": 12,
   "wis": 11,
   "cha": 10
  },
  "ac": 12,
  "maxHp": 21,
  "hpDice": "6d4+6",
  "speedFt": 40,
  "senses": {
   "passivePerception": 12,
   "blindsightFt": 60
  },
  "saves": [],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "damageResistances": [
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "conditionImmunities": [
   "cego"
  ],
  "attacks": [
   {
    "name": "Garras",
    "bonus": 4,
    "damage": "2d4+2",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 1
  },
  "acoesEspeciais": [
   {
    "nome": "Devorar Intelecto",
    "tipo": "alvo",
    "alcanceFt": 10,
    "save": "int",
    "dc": 12,
    "damage": "2d10",
    "damageType": "psíquico",
    "halfOnSave": false,
    "condition": "atordoado",
    "rounds": 10,
    "repete": false
   }
  ],
  "traits": [
   "t_ladraoDeCorpos",
   "t_detectarSenciencia"
  ],
  "blurb": "Pequeno e rápido, ataca com garras enquanto drena a mente do alvo com dano psíquico, podendo zerar a Inteligência e deixá-lo atordoado. Contra vítimas incapacitadas, devora o cérebro e assume o corpo.",
  "lore": "Parece um cérebro ambulante coberto por uma crosta dura, apoiado em pernas de fera com garras. É criado pelos devoradores de mentes, que pegam o cérebro de um escravo e o submetem a um ritual terrível até que ele ganhe pernas e vontade própria. Ronda o Subterrâneo caçando seres pensantes para seus mestres. Depois de consumir a mente de uma vítima, usa o corpo dela como marionete para atrair outros até os domínios dos ilitides."
 },
 "perseguidorInvisivel": {
  "id": "perseguidorInvisivel",
  "tipo": "elemental",
  "name": "Perseguidor Invisível",
  "nomeOriginal": "Invisible Stalker",
  "fonte": "MM",
  "size": "médio",
  "level": 5,
  "cr": "6",
  "xp": 2300,
  "abilities": {
   "str": 16,
   "dex": 19,
   "con": 14,
   "int": 10,
   "wis": 15,
   "cha": 11
  },
  "ac": 14,
  "maxHp": 104,
  "hpDice": "16d8+32",
  "speedFt": 50,
  "flyFt": 50,
  "hover": true,
  "speeds": {
   "flyFt": 50
  },
  "senses": {
   "passivePerception": 18,
   "darkvisionFt": 60
  },
  "saves": [],
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
  "damageResistancesNote": "só de armas não mágicas",
  "damageImmunities": [
   "veneno"
  ],
  "conditionImmunities": [
   "exausto",
   "agarrado",
   "paralisado",
   "petrificado",
   "envenenado",
   "caido",
   "contido",
   "inconsciente"
  ],
  "attacks": [
   {
    "name": "Pancada",
    "bonus": 6,
    "damage": "2d6+3",
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
  "traits": [
   "invisivelAVontade",
   "t_rastreadorInfalivel"
  ],
  "blurb": "Um caçador de ar que nunca pode ser visto e golpeia duas vezes por turno, sempre com vantagem contra quem não o enxerga. Resiste a armas comuns e ignora agarrões, contenções e quedas.",
  "lore": "É um elemental do ar arrancado do seu plano e remodelado por magia poderosa para servir a quem o invocou. Só aceita missões de caçar uma criatura ou recuperar um objeto; qualquer outra ordem rompe o vínculo e o liberta. Serve contra a vontade e, em tarefas longas, procura brechas nas palavras do mestre para distorcer o comando. Feito de vento, pode ser ouvido ou sentido ao passar, mas mesmo magias que revelam o invisível mostram apenas um contorno borrado. Não precisa respirar, comer, beber nem dormir, e some numa rajada de ar quando derrotado."
 },
 "golemDeFerro": {
  "id": "golemDeFerro",
  "tipo": "constructo",
  "name": "Golem de Ferro",
  "nomeOriginal": "Iron Golem",
  "fonte": "MM",
  "size": "grande",
  "level": 13,
  "cr": "16",
  "xp": 15000,
  "abilities": {
   "str": 24,
   "dex": 9,
   "con": 20,
   "int": 3,
   "wis": 11,
   "cha": 1
  },
  "ac": 20,
  "acNote": "armadura natural",
  "maxHp": 210,
  "hpDice": "20d10+100",
  "speedFt": 30,
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 120
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "damageImmunities": [
   "fogo",
   "veneno",
   "psíquico",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageImmunitiesNote": "só de armas não mágicas",
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
    "bonus": 13,
    "damage": "3d8+7",
    "type": "concussão",
    "reachFt": 5
   },
   {
    "name": "Espada",
    "bonus": 13,
    "damage": "3d10+7",
    "type": "cortante",
    "reachFt": 10
   }
  ],
  "multiattack": {
   "count": 2
  },
  "breath": {
   "name": "Sopro Venenoso",
   "kind": "save",
   "shape": "cone",
   "areaFt": 15,
   "save": "con",
   "dc": 19,
   "damage": "10d8",
   "damageType": "veneno",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    5,
    6
   ]
  },
  "traits": [
   "absorcaoDeFogo",
   "formaImutavel",
   "resistenciaAMagia",
   "armasMagicas"
  ],
  "blurb": "Colosso de metal que esmaga e retalha com sua espada de longo alcance e expele uma nuvem de gás venenoso; armas comuns mal o arranham, e o fogo só o cura.",
  "lore": "O golem de ferro é o mais poderoso dos constructos criados por magos, forjado em uma peça maciça de metal e animado por rituais caríssimos. Não pensa por conta própria: obedece cegamente ao seu criador e pode guardar um lugar por séculos sem se cansar. Costuma ser encontrado vigiando cofres, tumbas e laboratórios arcanos. Em combate avança sem medo nem hesitação, até que a ordem recebida seja cumprida ou ele seja destruído."
 },
 "chacal": {
  "id": "chacal",
  "tipo": "fera",
  "name": "Chacal",
  "nomeOriginal": "Jackal",
  "fonte": "MM",
  "size": "pequeno",
  "level": 1,
  "cr": "0",
  "xp": 10,
  "abilities": {
   "str": 8,
   "dex": 15,
   "con": 11,
   "int": 3,
   "wis": 12,
   "cha": 6
  },
  "ac": 12,
  "maxHp": 3,
  "hpDice": "1d6",
  "speedFt": 40,
  "senses": {
   "passivePerception": 13
  },
  "saves": [],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 1,
    "damage": "1d4-1",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "traits": [
   "keenHearingSmell",
   "packTactics"
  ],
  "blurb": "Fraco sozinho, o chacal ataca em bando e ganha vantagem quando um aliado está ao lado do alvo. Sua mordida fere pouco, mas vários juntos incomodam.",
  "lore": "O chacal é um canídeo pequeno e magro que vive em campos abertos e desertos. Anda em matilhas e prefere cercar presas feridas ou distraídas a enfrentar inimigos fortes. Tem faro e audição aguçados, o que o torna difícil de surpreender. Também costuma ser escolhido como familiar por conjuradores."
 },
 "chacalobisomem": {
  "id": "chacalobisomem",
  "tipo": "humanoide",
  "name": "Chacalobisomem",
  "nomeOriginal": "Jackalwere",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1/2",
  "xp": 100,
  "abilities": {
   "str": 11,
   "dex": 15,
   "con": 11,
   "int": 13,
   "wis": 11,
   "cha": 10
  },
  "ac": 12,
  "maxHp": 18,
  "hpDice": "4d8",
  "speedFt": 40,
  "senses": {
   "passivePerception": 12
  },
  "saves": [],
  "skills": [
   "enganacao",
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "enganacao"
  ],
  "damageImmunities": [
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageImmunitiesNote": "só de armas não mágicas",
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida (só nas formas de chacal ou híbrida)",
    "bonus": 4,
    "damage": "1d4+2",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Cimitarra (só nas formas humana ou híbrida)",
    "bonus": 4,
    "damage": "1d6+2",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "acoesEspeciais": [
   {
    "nome": "Olhar do Sono",
    "tipo": "alvo",
    "alcanceFt": 30,
    "save": "wis",
    "dc": 10,
    "condition": "inconsciente",
    "rounds": 10,
    "repete": false,
    "imunizaAoPassar": true
   }
  ],
  "traits": [
   "metamorfo",
   "keenHearingSmell",
   "packTactics"
  ],
  "blurb": "Ataca em bando, com vantagem quando um aliado está perto do alvo, e usa o olhar para fazer adormecer quem falhar numa CD 10 de Sabedoria. Só armas mágicas ou de prata o ferem de verdade.",
  "lore": "É um chacal comum corrompido por poder demoníaco, criado por Graz'zt para servir às lâmias. Ronda estradas e trilhas dos desertos e campos, quase sempre disfarçado de viajante humano miserável que pede abrigo. Quando é acolhido, assume a forma híbrida e ataca. Mente por natureza, e quem presta atenção pode vê-lo fazer careta de dor ao dizer a verdade. Sequestra vítimas para seus mestres e prefere lutar ao lado de chacais, mas foge sem hesitar quando o inimigo é forte demais."
 },
 "kenku": {
  "id": "kenku",
  "tipo": "humanoide",
  "name": "Kenku",
  "nomeOriginal": "Kenku",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 10,
   "dex": 16,
   "con": 10,
   "int": 11,
   "wis": 10,
   "cha": 10
  },
  "ac": 13,
  "maxHp": 13,
  "hpDice": "3d8",
  "speedFt": 30,
  "senses": {
   "passivePerception": 12
  },
  "saves": [],
  "skills": [
   "enganacao",
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "enganacao"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Espada Curta",
    "bonus": 5,
    "damage": "1d6+3",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Arco Curto",
    "bonus": 5,
    "damage": "1d6+3",
    "type": "perfurante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 80,
    "longRangeFt": 320
   }
  ],
  "traits": [
   "emboscador",
   "t_mimetismo"
  ],
  "blurb": "Atacam de emboscada com espada curta ou arco curto, ganhando vantagem contra quem foi surpreendido no primeiro turno. Imitam vozes e ruídos para atrair vítimas a armadilhas.",
  "lore": "Os kenku são humanoides emplumados e sem asas que vagam pelo mundo como andarilhos movidos pela cobiça. Segundo suas lendas, perderam o voo como castigo de um antigo mestre ao qual roubaram o segredo da fala. Escondem o corpo sob trapos e mantos, vivem em florestas e cidades e costumam servir a quadrilhas como ladrões e falsificadores. Só se comunicam reproduzindo sons e frases que já ouviram, usando códigos secretos entre os membros do bando. Ainda sonham em voar, e suas punições e execuções lembram com amargura as asas perdidas."
 },
 "orca": {
  "id": "orca",
  "tipo": "fera",
  "name": "Orca",
  "nomeOriginal": "Killer Whale",
  "fonte": "MM",
  "size": "enorme",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 19,
   "dex": 10,
   "con": 13,
   "int": 3,
   "wis": 12,
   "cha": 7
  },
  "ac": 12,
  "acNote": "armadura natural",
  "maxHp": 90,
  "hpDice": "12d12+12",
  "speedFt": 0,
  "speeds": {
   "swimFt": 60
  },
  "senses": {
   "passivePerception": 13,
   "blindsightFt": 120
  },
  "saves": [],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 6,
    "damage": "5d6+4",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "traits": [
   "echolocation",
   "keenHearing"
  ],
  "blurb": "Predadora marinha enorme e veloz que localiza presas pelo som e desfere mordidas devastadoras. Seu ponto fraco é ficar surda, o que anula a percepção às cegas.",
  "lore": "A orca é um grande mamífero dos oceanos, inteligente para uma fera e temida por outras criaturas do mar. Caça em grupos familiares, cercando focas, peixes grandes e até baleias maiores. Usa ecos para enxergar no escuro das profundezas e sobe periodicamente à superfície para respirar. Raramente ataca humanoides, mas reage com violência quando ameaçada ou faminta."
 },
 "kobold": {
  "id": "kobold",
  "tipo": "humanoide",
  "name": "Kobold",
  "nomeOriginal": "Kobold",
  "fonte": "MM",
  "size": "pequeno",
  "level": 1,
  "cr": "1/8",
  "xp": 25,
  "abilities": {
   "str": 7,
   "dex": 15,
   "con": 9,
   "int": 8,
   "wis": 7,
   "cha": 8
  },
  "ac": 12,
  "maxHp": 5,
  "hpDice": "2d6-2",
  "speedFt": 30,
  "senses": {
   "passivePerception": 8,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Adaga",
    "bonus": 4,
    "damage": "1d4+2",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Funda",
    "bonus": 4,
    "damage": "1d4+2",
    "type": "concussão",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 30,
    "longRangeFt": 120
   }
  ],
  "traits": [
   "sunlightSensitivity",
   "packTactics"
  ],
  "blurb": "Frágil sozinho, o kobold fica perigoso em grupo: ganha vantagem quando um aliado está ao lado do alvo e alterna entre adaga e funda. Sob a luz do sol, porém, erra muito mais.",
  "lore": "Pequenos humanoides reptilianos e covardes, os kobolds veneram dragões malignos e os servem como lacaios. Vivem em covis de dragões ou, com mais frequência, em masmorras, onde juntam bugigangas para seus próprios tesouros. Compensam a fraqueza física com astúcia: cavam túneis baixos que atrapalham invasores maiores e enchem tudo de armadilhas engenhosas. Cultuam também o deus Kurtulmak, aprisionado num labirinto por um truque do deus dos gnomos, e por isso odeiam gnomos e pegadinhas."
 },
 "kraken": {
  "id": "kraken",
  "tipo": "monstruosidade",
  "name": "Kraken",
  "nomeOriginal": "Kraken",
  "fonte": "MM",
  "size": "imenso",
  "level": 21,
  "cr": "23",
  "xp": 50000,
  "abilities": {
   "str": 30,
   "dex": 11,
   "con": 25,
   "int": 22,
   "wis": 18,
   "cha": 20
  },
  "ac": 18,
  "acNote": "armadura natural",
  "maxHp": 472,
  "hpDice": "27d20+189",
  "speedFt": 20,
  "speeds": {
   "swimFt": 60
  },
  "senses": {
   "passivePerception": 14,
   "truesightFt": 120
  },
  "saves": [
   "str",
   "dex",
   "con",
   "int",
   "wis"
  ],
  "skills": [],
  "expertise": [],
  "damageImmunities": [
   "elétrico",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageImmunitiesNote": "só de armas não mágicas",
  "conditionImmunities": [
   "amedrontado",
   "paralisado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 17,
    "damage": "3d8+10",
    "type": "perfurante",
    "reachFt": 5,
    "engole": {
     "tamanhoMax": "large",
     "dano": "12d6",
     "tipoDano": "ácido",
     "regurgita": {
      "dano": 50,
      "dc": 25
     },
     "soAgarrado": true
    }
   },
   {
    "name": "Tentáculo",
    "bonus": 17,
    "damage": "3d6+10",
    "type": "concussão",
    "reachFt": 30,
    "onHit": {
     "semResistencia": true,
     "dc": 18,
     "escape": 18,
     "condition": "contido",
     "note": "é agarrado"
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Tentáculo",
    "Tentáculo",
    "Tentáculo"
   ]
  },
  "acoesEspeciais": [
   {
    "nome": "Arremessar",
    "tipo": "arremessar",
    "pes": 60
   },
   {
    "nome": "Tempestade de Raios",
    "tipo": "alvo",
    "alcanceFt": 120,
    "alvos": 3,
    "save": "dex",
    "dc": 23,
    "damage": "4d10",
    "damageType": "elétrico",
    "halfOnSave": true
   }
  ],
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Tentáculo ou Arremessar",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Tentáculo"
    },
    {
     "nome": "Tempestade de Raios (custa 2 ações)",
     "custo": 2,
     "tipo": "especial",
     "acao": "Tempestade de Raios"
    },
    {
     "nome": "Nuvem de Tinta (custa 3 ações)",
     "custo": 3,
     "tipo": "tinta",
     "raioFt": 60,
     "dc": 23,
     "damage": "3d10"
    }
   ]
  },
  "traits": [
   "liberdadeDeMovimento",
   "monstroDeCerco",
   "acoesLendarias"
  ],
  "blurb": "Agarra até dez alvos com tentáculos de 9 m de alcance, arremessa-os longe ou os engole para dissolvê-los em ácido, enquanto invoca raios a até 36 m. Armas comuns não o ferem e ele é imune a eletricidade.",
  "lore": "O kraken é um titã das profundezas que dorme por eras no fundo do mar, esperando algum presságio para despertar. Nos primórdios lutou como guerreiro dos deuses, mas rompeu essa servidão e jamais aceitou outro senhor. Quando emerge, afunda frotas inteiras, controla tempestades e pode subir rios para fazer ninho em lagos, arrasando cidades pelo caminho. Alguns são venerados como deuses por cultos em terra e no mar, mas sua mente antiquíssima deseja apenas a ruína de tudo. Seu covil costuma ser uma fenda ou caverna submersa cheia de destroços, tesouros e navios naufragados."
 },
 "kuoToa": {
  "id": "kuoToa",
  "tipo": "humanoide",
  "name": "Kuo-toa",
  "nomeOriginal": "Kuo-toa",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 13,
   "dex": 10,
   "con": 11,
   "int": 11,
   "wis": 10,
   "cha": 8
  },
  "ac": 13,
  "acNote": "armadura natural e escudo",
  "maxHp": 18,
  "hpDice": "4d8",
  "speedFt": 30,
  "speeds": {
   "swimFt": 30
  },
  "senses": {
   "passivePerception": 14,
   "darkvisionFt": 120
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
    "bonus": 3,
    "damage": "1d4+1",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Lança",
    "bonus": 3,
    "damage": "1d6+1",
    "type": "perfurante",
    "reachFt": 5,
    "rangeFt": 20,
    "longRangeFt": 60,
    "danoExtra": {
     "damage": "1d8+1",
     "type": "perfurante"
    }
   },
   {
    "name": "Rede",
    "bonus": 3,
    "damage": 0,
    "type": "nenhum",
    "reachFt": 5,
    "onHit": {
     "semResistencia": true,
     "dc": 10,
     "escape": 10,
     "condition": "contido",
     "note": "fica preso"
    },
    "ranged": true,
    "rangeFt": 5,
    "longRangeFt": 15
   }
  ],
  "traits": [
   "t_percepcaoSobrenatural",
   "t_escorregadio",
   "sunlightSensitivity",
   "escudoPegajoso"
  ],
  "blurb": "Luta com lança e rede para prender a presa, e seu escudo pegajoso gruda nas armas de quem erra o golpe. Fica fraco sob a luz do sol.",
  "lore": "Os kuo-toa são humanoides com feições de peixe que outrora viviam nas costas do mundo da superfície, até serem expulsos para o Subterrâneo. Séculos de escravidão sob os devoradores de mentes destruíram sua sanidade e os deixaram com uma devoção religiosa delirante. Inventam deuses absurdos, e a fé coletiva deles pode dar corpo a essas divindades. São governados por arquissacerdotes fanáticos e preferem capturar os inimigos a matá-los. Odeiam a luz do dia e vivem em guerra constante com os drow."
 },
 "arquissacerdoteKuoToa": {
  "id": "arquissacerdoteKuoToa",
  "tipo": "humanoide",
  "name": "Arquissacerdote Kuo-toa",
  "nomeOriginal": "Kuo-toa Archpriest",
  "fonte": "MM",
  "size": "médio",
  "level": 5,
  "cr": "6",
  "xp": 2300,
  "abilities": {
   "str": 16,
   "dex": 14,
   "con": 16,
   "int": 13,
   "wis": 16,
   "cha": 14
  },
  "ac": 13,
  "acNote": "armadura natural",
  "maxHp": 97,
  "hpDice": "13d8+39",
  "speedFt": 30,
  "speeds": {
   "swimFt": 30
  },
  "senses": {
   "passivePerception": 19,
   "darkvisionFt": 120
  },
  "saves": [],
  "skills": [
   "percepcao",
   "religiao"
  ],
  "expertise": [
   "percepcao",
   "religiao"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Cetro",
    "bonus": 6,
    "damage": "1d6+3",
    "type": "concussão",
    "reachFt": 5,
    "danoExtra": {
     "damage": "4d6",
     "type": "elétrico"
    }
   },
   {
    "name": "Ataque Desarmado",
    "bonus": 6,
    "damage": "1d4+3",
    "type": "concussão",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2
  },
  "spellcasting": {
   "ability": "wis",
   "cantrips": [
    "orientacao",
    "chamaSagrada",
    "taumaturgia"
   ],
   "prepared": [
    "detectarMagia",
    "santuario",
    "escudoDaFe",
    "imobilizarPessoa",
    "armaEspiritual",
    "espiritosGuardioes",
    "linguas",
    "adivinhacao",
    "curarFerimentosEmMassa",
    "videncia"
   ],
   "slots": [
    0,
    4,
    3,
    3,
    3,
    2
   ],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "cdPorMagia": {
    "orientacao": 14,
    "chamaSagrada": 14,
    "taumaturgia": 14,
    "detectarMagia": 14,
    "santuario": 14,
    "escudoDaFe": 14,
    "imobilizarPessoa": 14,
    "armaEspiritual": 14,
    "espiritosGuardioes": 14,
    "linguas": 14,
    "adivinhacao": 14,
    "curarFerimentosEmMassa": 14,
    "videncia": 14
   }
  },
  "traits": [
   "t_percepcaoSobrenatural",
   "t_escorregadio",
   "sunlightSensitivity"
  ],
  "blurb": "Conjurador divino que paralisa inimigos com Imobilizar Pessoa, cerca-se de guardiões espirituais e golpeia com um cetro carregado de eletricidade. Sofre sob a luz do sol.",
  "lore": "Os arquissacerdotes são os líderes religiosos das comunidades kuo-toa no Subterrâneo, servos fanáticos de deuses que o próprio povo inventou. Sua fé insana é tão intensa que de fato lhes concede poderes divinos. Governam os cardumes com mão de ferro, ordenando sacrifícios e guerras contra quem ameaça seus santuários submersos. Raramente lutam sozinhos, preferindo comandar monitores e chicoteadores enquanto lançam magias de longe."
 },
 "monitorKuoToa": {
  "id": "monitorKuoToa",
  "tipo": "humanoide",
  "name": "Monitor Kuo-toa",
  "nomeOriginal": "Kuo-toa Monitor",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 14,
   "dex": 10,
   "con": 14,
   "int": 12,
   "wis": 14,
   "cha": 11
  },
  "ac": 13,
  "acNote": "armadura natural, Defesa sem Armadura",
  "maxHp": 65,
  "hpDice": "10d8+20",
  "speedFt": 30,
  "speeds": {
   "swimFt": 30
  },
  "senses": {
   "passivePerception": 16,
   "darkvisionFt": 120
  },
  "saves": [],
  "skills": [
   "percepcao",
   "religiao"
  ],
  "expertise": [
   "percepcao",
   "religiao"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 6,
    "damage": "1d4+2",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Golpe Desarmado",
    "bonus": 6,
    "damage": "1d6+2",
    "type": "concussão",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d6",
     "type": "elétrico"
    }
   }
  ],
  "multiattack": {
   "count": 1
  },
  "traits": [
   "t_percepcaoSobrenatural",
   "t_escorregadio",
   "sunlightSensitivity"
  ],
  "blurb": "Lutador desarmado que combina uma mordida com dois golpes carregados de eletricidade, que impedem o alvo de usar reações. Percebe criaturas invisíveis por perto, mas sofre sob a luz do sol.",
  "lore": "Os monitores são monges guerreiros da sociedade kuo-toa, encarregados de manter a ordem e punir quem desafia os sacerdotes. Vivem nas cidades submersas e cavernas alagadas do Subterrâneo. Treinados em combate corpo a corpo, canalizam uma energia elétrica pelos punhos. Agem com disciplina fanática, caçando hereges e intrusos em nome de seus deuses estranhos."
 },
 "chicoteadorKuoToa": {
  "id": "chicoteadorKuoToa",
  "tipo": "humanoide",
  "name": "Chicoteador Kuo-toa",
  "nomeOriginal": "Kuo-toa Whip",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 14,
   "dex": 10,
   "con": 14,
   "int": 12,
   "wis": 14,
   "cha": 11
  },
  "ac": 11,
  "acNote": "armadura natural",
  "maxHp": 65,
  "hpDice": "10d8+20",
  "speedFt": 30,
  "speeds": {
   "swimFt": 30
  },
  "senses": {
   "passivePerception": 16,
   "darkvisionFt": 120
  },
  "saves": [],
  "skills": [
   "percepcao",
   "religiao"
  ],
  "expertise": [
   "percepcao",
   "religiao"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 4,
    "damage": "1d4+2",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Bastão-Pinça",
    "bonus": 4,
    "damage": "1d6+2",
    "type": "perfurante",
    "reachFt": 10,
    "onHit": {
     "semResistencia": true,
     "dc": 14,
     "escape": 14,
     "condition": "agarrado",
     "note": "é agarrado"
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Mordida",
    "Bastão-Pinça"
   ]
  },
  "spellcasting": {
   "ability": "wis",
   "cantrips": [
    "chamaSagrada",
    "taumaturgia"
   ],
   "prepared": [
    "perdicao",
    "escudoDaFe"
   ],
   "slots": [
    0,
    3
   ],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "cdPorMagia": {
    "chamaSagrada": 12,
    "taumaturgia": 12,
    "perdicao": 12,
    "escudoDaFe": 12
   }
  },
  "traits": [
   "t_percepcaoSobrenatural",
   "t_escorregadio",
   "sunlightSensitivity"
  ],
  "blurb": "Sacerdote kuo-toa que prende inimigos com seu bastão-pinça a 3 m e os morde, enquanto lança chama sagrada e perdição. Difícil de agarrar e capaz de perceber criaturas invisíveis.",
  "lore": "Os chicoteadores são os clérigos de nível inferior das comunidades kuo-toa, servindo aos arquissacerdotes e espalhando a fé fanática de seu povo. Vivem nas cavernas alagadas do Subterrâneo, onde conduzem ritos estranhos a deuses nascidos da loucura coletiva. Em combate, lideram grupos de guerreiros, capturando presas para sacrifício. Detestam a luz do sol e raramente sobem à superfície."
 },
 "lamia": {
  "id": "lamia",
  "tipo": "monstruosidade",
  "name": "Lâmia",
  "nomeOriginal": "Lamia",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "4",
  "xp": 1100,
  "abilities": {
   "str": 16,
   "dex": 13,
   "con": 15,
   "int": 14,
   "wis": 15,
   "cha": 16
  },
  "ac": 13,
  "acNote": "armadura natural",
  "maxHp": 97,
  "hpDice": "13d10+26",
  "speedFt": 30,
  "senses": {
   "passivePerception": 12,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "enganacao",
   "intuicao",
   "furtividade"
  ],
  "expertise": [
   "enganacao"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Garras",
    "bonus": 5,
    "damage": "2d10+3",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Adaga",
    "bonus": 5,
    "damage": "1d4+3",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Toque Inebriante",
    "bonus": 5,
    "damage": 0,
    "type": "nenhum",
    "reachFt": 5,
    "onHit": {
     "semResistencia": true,
     "condition": "amaldicoadoLamia",
     "rounds": 100,
     "note": "é amaldiçoado"
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Garras",
    "Adaga"
   ]
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "missao",
    "enfeiticarPessoa",
    "imagemEspelhada",
    "videncia",
    "sugestao",
    "disfarcarSe",
    "imagemMaior"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "missao": 1,
    "enfeiticarPessoa": 3,
    "imagemEspelhada": 3,
    "videncia": 3,
    "sugestao": 3
   },
   "aVontade": [
    "disfarcarSe",
    "imagemMaior"
   ],
   "cdPorMagia": {
    "missao": 13,
    "enfeiticarPessoa": 13,
    "imagemEspelhada": 13,
    "videncia": 13,
    "sugestao": 13,
    "disfarcarSe": 13,
    "imagemMaior": 13
   }
  },
  "traits": [],
  "blurb": "Prefere lutar de longe com ilusões e encantamentos, deixando servos na linha de frente; de perto, rasga com garras e adaga e usa o Toque Inebriante para minar a vontade das vítimas antes de enfeitiçá-las.",
  "lore": "Metade mulher de beleza sedutora, metade corpo leonino de quatro patas, a lâmia se instala em cidades arruinadas e tumbas esquecidas dos desertos. Ali governa como uma tirana hedonista, disfarçando a decadência do covil com ilusões e luxos roubados de caravanas, cercada de bajuladores e escravos. Usa chacais-lobisomens para saquear e capturar prisioneiros, e vigia seu território por meio de vidência em espelhos ou poças d'água. Adora corromper aventureiros virtuosos, e quem não lhe agrada vira banquete ou é largado para morrer no ermo. Muitas foram criadas pelo lorde demônio Graz'zt a partir de servos mortais, em troca de lealdade eterna."
 },
 "lemure": {
  "id": "lemure",
  "tipo": "corruptor",
  "name": "Lêmure",
  "nomeOriginal": "Lemure",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "0",
  "xp": 10,
  "abilities": {
   "str": 10,
   "dex": 5,
   "con": 11,
   "int": 1,
   "wis": 11,
   "cha": 3
  },
  "ac": 7,
  "maxHp": 13,
  "hpDice": "3d8",
  "speedFt": 15,
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 120
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "frio"
  ],
  "damageImmunities": [
   "fogo",
   "veneno"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "amedrontado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Punho",
    "bonus": 3,
    "damage": "1d4",
    "type": "concussão",
    "reachFt": 5
   }
  ],
  "features": [
   "devilsSight"
  ],
  "traits": [
   "t_rejuvenescimentoInfernal"
  ],
  "blurb": "Massa lenta e disforme que avança em bandos e esmurra com os punhos, causando pouco dano. O perigo está no número, e nos Nove Infernos ela volta a se erguer dias depois de destruída.",
  "lore": "Lêmures são a forma mais baixa entre os diabos, almas condenadas reduzidas a montes de carne derretida. Rastejam pelos Nove Infernos em enxames sem mente, servindo de bucha de canhão para diabos superiores. Não têm vontade própria e só obedecem a ordens em infernal, que compreendem mas não falam. Mesmo destruídos, costumam se reconstituir no inferno, a menos que sejam eliminados com poder sagrado."
 },
 "lich": {
  "id": "lich",
  "tipo": "morto-vivo",
  "name": "Lich",
  "nomeOriginal": "Lich",
  "fonte": "MM",
  "size": "médio",
  "level": 21,
  "cr": "21",
  "xp": 33000,
  "abilities": {
   "str": 11,
   "dex": 16,
   "con": 16,
   "int": 20,
   "wis": 14,
   "cha": 16
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 135,
  "hpDice": "18d8+54",
  "speedFt": 30,
  "senses": {
   "passivePerception": 19,
   "truesightFt": 120
  },
  "saves": [
   "con",
   "int",
   "wis"
  ],
  "skills": [
   "arcanismo",
   "historia",
   "intuicao",
   "percepcao"
  ],
  "expertise": [
   "arcanismo"
  ],
  "damageResistances": [
   "frio",
   "elétrico",
   "necrótico"
  ],
  "damageImmunities": [
   "veneno",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageImmunitiesNote": "só de armas não mágicas",
  "conditionImmunities": [
   "enfeitiçado",
   "exausto",
   "amedrontado",
   "paralisado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Toque Paralisante",
    "bonus": 12,
    "damage": "3d6",
    "type": "frio",
    "reachFt": 5,
    "onHit": {
     "save": "con",
     "dc": 18,
     "condition": "paralisado",
     "rounds": 10,
     "repete": true
    }
   }
  ],
  "spellcasting": {
   "ability": "int",
   "cantrips": [
    "maoMagica",
    "prestidigitacao",
    "raioDeGelo"
   ],
   "prepared": [
    "detectarMagia",
    "misselMagico",
    "escudoArcano",
    "ondaTrovejante",
    "detectarPensamentos",
    "invisibilidade",
    "flechaAcida",
    "imagemEspelhada",
    "animarMortos",
    "contramagia",
    "dissiparMagia",
    "bolaDeFogo",
    "praga",
    "dimensaoPorta",
    "nuvemMortal",
    "videncia",
    "desintegrar",
    "globoDeInvulnerabilidade",
    "dedoDaMorte",
    "viagemPlanar",
    "dominarMonstro",
    "palavraDePoderAtordoar",
    "palavraDePoderMatar"
   ],
   "slots": [
    0,
    4,
    3,
    3,
    3,
    3,
    1,
    1,
    1,
    1
   ],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "cdPorMagia": {
    "maoMagica": 20,
    "prestidigitacao": 20,
    "raioDeGelo": 20,
    "detectarMagia": 20,
    "misselMagico": 20,
    "escudoArcano": 20,
    "ondaTrovejante": 20,
    "detectarPensamentos": 20,
    "invisibilidade": 20,
    "flechaAcida": 20,
    "imagemEspelhada": 20,
    "animarMortos": 20,
    "contramagia": 20,
    "dissiparMagia": 20,
    "bolaDeFogo": 20,
    "praga": 20,
    "dimensaoPorta": 20,
    "nuvemMortal": 20,
    "videncia": 20,
    "desintegrar": 20,
    "globoDeInvulnerabilidade": 20,
    "dedoDaMorte": 20,
    "viagemPlanar": 20,
    "dominarMonstro": 20,
    "palavraDePoderAtordoar": 20,
    "palavraDePoderMatar": 20
   }
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Truque",
     "custo": 1,
     "tipo": "magia",
     "soTruque": true
    },
    {
     "nome": "Toque Paralisante (custa 2 ações)",
     "custo": 2,
     "tipo": "golpe",
     "arma": "Toque Paralisante"
    },
    {
     "nome": "Olhar Aterrorizante (custa 2 ações)",
     "custo": 2,
     "tipo": "alvo",
     "alcanceFt": 10,
     "save": "wis",
     "dc": 18,
     "condition": "amedrontado",
     "rounds": 10,
     "repete": true
    },
    {
     "nome": "Romper a Vida (custa 3 ações)",
     "custo": 3,
     "tipo": "area",
     "raioFt": 20,
     "save": "con",
     "dc": 18,
     "damage": "6d6",
     "damageType": "necrótico",
     "halfOnSave": true,
     "naoMortosVivos": true
    }
   ]
  },
  "traits": [
   "t_rejuvenescimento",
   "resisteExpulsar",
   "acoesLendarias"
  ],
  "blurb": "Conjurador de 18º nível que domina o campo com bola de fogo, desintegrar, dedo da morte e palavra de poder matar, além de paralisar quem chega perto com o toque gélido. Ignora armas não mágicas e ainda age fora do seu turno com ações lendárias.",
  "lore": "O lich é um antigo mago poderoso que trocou a vida pela não-morte para continuar existindo e acumulando poder. Sua alma fica presa num filactério, um objeto oculto e bem protegido que precisa ser alimentado periodicamente com almas sacrificadas. Enquanto o filactério existir, o corpo destruído se refaz ao lado dele em poucos dias. Vive isolado em torres, ruínas ou tumbas secretas repletas de armadilhas, mortos-vivos, constructos e demônios aprisionados. Coleciona magias e itens mágicos e não hesita em usá-los contra invasores."
 },
 "leao": {
  "id": "leao",
  "tipo": "fera",
  "name": "Leão",
  "nomeOriginal": "Lion",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 17,
   "dex": 15,
   "con": 13,
   "int": 3,
   "wis": 12,
   "cha": 8
  },
  "ac": 12,
  "maxHp": 26,
  "hpDice": "4d10+4",
  "speedFt": 50,
  "senses": {
   "passivePerception": 13
  },
  "saves": [],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "furtividade"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 5,
    "damage": "1d8+3",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Garra",
    "bonus": 5,
    "damage": "1d6+3",
    "type": "cortante",
    "reachFt": 5,
    "investida": {
     "pes": 20,
     "save": "str",
     "dc": 13,
     "mordeSeCair": "Mordida"
    }
   }
  ],
  "traits": [
   "keenSmell",
   "packTactics",
   "t_saltoComImpulso"
  ],
  "blurb": "Caçador de bando que avança em disparada para derrubar a presa com as garras e mordê-la no chão. Fica mais perigoso quando um companheiro está ao lado do alvo.",
  "lore": "O leão é um grande felino predador encontrado em savanas, colinas, desertos e regiões montanhosas. Vive em grupos familiares e caça de forma coordenada, cercando a vítima antes do ataque. Aproxima-se furtivamente pela vegetação alta e só se revela no último instante. Costuma escolher presas isoladas ou feridas."
 },
 "lagarto": {
  "id": "lagarto",
  "tipo": "fera",
  "name": "Lagarto",
  "nomeOriginal": "Lizard",
  "fonte": "MM",
  "size": "miúdo",
  "level": 1,
  "cr": "0",
  "xp": 10,
  "abilities": {
   "str": 2,
   "dex": 11,
   "con": 10,
   "int": 1,
   "wis": 8,
   "cha": 3
  },
  "ac": 10,
  "maxHp": 2,
  "hpDice": "1d4",
  "speedFt": 20,
  "speeds": {
   "climbFt": 20
  },
  "senses": {
   "passivePerception": 9,
   "darkvisionFt": 30
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 0,
    "damage": 1,
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "traits": [],
  "blurb": "Um réptil minúsculo e quase inofensivo, que só consegue dar mordidas fracas. Seu ponto forte é escalar paredes e enxergar no escuro a curta distância.",
  "lore": "O lagarto é um pequeno réptil comum em quase todo clima quente ou temperado, de muros de pedra a troncos de árvores. Ele passa o dia tomando sol e caçando insetos, e foge rapidamente quando ameaçado. Magos costumam escolhê-lo como familiar, porque ele se esgueira por frestas e sobe superfícies verticais com facilidade. Raramente ataca, a não ser quando é encurralado."
 },
 "reiHomemLagarto": {
  "id": "reiHomemLagarto",
  "tipo": "humanoide",
  "name": "Rei Homem-Lagarto",
  "nomeOriginal": "Lizard King",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "4",
  "xp": 1100,
  "abilities": {
   "str": 17,
   "dex": 12,
   "con": 15,
   "int": 11,
   "wis": 11,
   "cha": 15
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 78,
  "hpDice": "12d8+24",
  "speedFt": 30,
  "speeds": {
   "swimFt": 30
  },
  "senses": {
   "passivePerception": 14,
   "darkvisionFt": 60
  },
  "saves": [
   "con",
   "wis"
  ],
  "skills": [
   "percepcao",
   "furtividade",
   "sobrevivencia"
  ],
  "expertise": [
   "percepcao",
   "furtividade",
   "sobrevivencia"
  ],
  "conditionImmunities": [
   "amedrontado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 5,
    "damage": "1d6+3",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Garras",
    "bonus": 5,
    "damage": "1d4+3",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Tridente",
    "bonus": 5,
    "damage": "1d6+3",
    "type": "perfurante",
    "reachFt": 5,
    "rangeFt": 20,
    "longRangeFt": 60,
    "danoExtra": {
     "damage": "1d8+3",
     "type": "perfurante"
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Mordida",
    "Garras"
   ]
  },
  "espetar": {
   "dano": "3d6"
  },
  "traits": [
   "espetar"
  ],
  "blurb": "Combina mordida e golpes de tridente, e uma vez por turno empala o alvo para causar 3d6 de dano extra e ganhar PV temporários. Não pode ser amedrontado e luta tão bem na água quanto em terra.",
  "lore": "Alguns homens-lagarto nascem tocados pelo demônio Sess'inek e crescem mais astutos e ambiciosos que seus irmãos. Esses reis tomam o controle das tribos nos pântanos e florestas alagadas, exigindo obediência e sacrifícios. Desprezam a tradição dos xamãs e governam pelo medo e pela força. Costumam empunhar um tridente e liderar pessoalmente os ataques contra vizinhos."
 },
 "rainhaHomemLagarto": {
  "id": "rainhaHomemLagarto",
  "tipo": "humanoide",
  "name": "Rainha Homem-Lagarto",
  "nomeOriginal": "Lizard Queen",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "4",
  "xp": 1100,
  "abilities": {
   "str": 17,
   "dex": 12,
   "con": 15,
   "int": 11,
   "wis": 11,
   "cha": 15
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 78,
  "hpDice": "12d8+24",
  "speedFt": 30,
  "speeds": {
   "swimFt": 30
  },
  "senses": {
   "passivePerception": 14,
   "darkvisionFt": 60
  },
  "saves": [
   "con",
   "wis"
  ],
  "skills": [
   "percepcao",
   "furtividade",
   "sobrevivencia"
  ],
  "expertise": [
   "percepcao",
   "furtividade",
   "sobrevivencia"
  ],
  "conditionImmunities": [
   "amedrontado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 5,
    "damage": "1d6+3",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Garras",
    "bonus": 5,
    "damage": "1d4+3",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Tridente",
    "bonus": 5,
    "damage": "1d6+3",
    "type": "perfurante",
    "reachFt": 5,
    "rangeFt": 20,
    "longRangeFt": 60,
    "danoExtra": {
     "damage": "1d8+3",
     "type": "perfurante"
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Mordida",
    "Garras"
   ]
  },
  "espetar": {
   "dano": "3d6"
  },
  "traits": [
   "espetar"
  ],
  "blurb": "Combina mordida e golpes de tridente que empalam o alvo com 3d6 de dano extra, convertendo esse dano em PV temporários. Destemida, avança sem recuar e se mantém de pé por mais tempo do que parece.",
  "lore": "É uma soberana do povo lagarto que ganhou poder graças a pactos com demônios, e por isso fala abissal. Governa tribos em pântanos e florestas alagadas, onde se move com facilidade tanto na lama quanto debaixo d'água. Cruel e ambiciosa, conduz seus súditos a ataques contra povoados vizinhos e oferece prisioneiros a seus patronos sombrios. Não conhece o medo e costuma liderar os combates pessoalmente, empunhando seu tridente."
 },
 "homemLagarto": {
  "id": "homemLagarto",
  "tipo": "humanoide",
  "name": "Homem-Lagarto",
  "nomeOriginal": "Lizardfolk",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1/2",
  "xp": 100,
  "abilities": {
   "str": 15,
   "dex": 10,
   "con": 13,
   "int": 7,
   "wis": 12,
   "cha": 7
  },
  "ac": 15,
  "acNote": "armadura natural e escudo",
  "maxHp": 22,
  "hpDice": "4d8+4",
  "speedFt": 30,
  "speeds": {
   "swimFt": 30
  },
  "senses": {
   "passivePerception": 13
  },
  "saves": [],
  "skills": [
   "percepcao",
   "furtividade",
   "sobrevivencia"
  ],
  "expertise": [
   "furtividade",
   "sobrevivencia"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 4,
    "damage": "1d6+2",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Clava Pesada",
    "bonus": 4,
    "damage": "1d6+2",
    "type": "concussão",
    "reachFt": 5
   },
   {
    "name": "Azagaia",
    "bonus": 4,
    "damage": "1d6+2",
    "type": "perfurante",
    "reachFt": 5,
    "rangeFt": 30,
    "longRangeFt": 120
   },
   {
    "name": "Escudo Cravejado",
    "bonus": 4,
    "damage": "1d6+2",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2
  },
  "traits": [],
  "blurb": "Ataca duas vezes por turno combinando mordida com clava, escudo cravejado ou azagaia, e pode emboscar a partir da água, onde nada tão rápido quanto anda.",
  "lore": "Humanoides reptilianos de cultura simples que habitam pântanos e selvas, erguendo aldeias de cabanas em grutas, cavernas alagadas e ruínas meio submersas. Defendem seu território com batedores camuflados e tratam qualquer intruso como presa, sem se importar com noções de bem e mal. Apreciam carne humanoide e costumam levar prisioneiros para banquetes rituais ou sacrifícios ao deus Semuanya. Fazem ferramentas com ossos e escudos com couro e carapaças de monstros, e falam dracônico, chegando a prestar tributo a dragões. Raramente fazem alianças, mas quando fazem são aliados leais e ferozes."
 },
 "xamaPovoLagarto": {
  "id": "xamaPovoLagarto",
  "tipo": "humanoide",
  "name": "Xamã Povo-Lagarto",
  "nomeOriginal": "Lizardfolk Shaman",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 15,
   "dex": 10,
   "con": 13,
   "int": 10,
   "wis": 15,
   "cha": 8
  },
  "ac": 13,
  "acNote": "armadura natural",
  "maxHp": 27,
  "hpDice": "5d8+5",
  "speedFt": 30,
  "speeds": {
   "swimFt": 30
  },
  "senses": {
   "passivePerception": 14
  },
  "saves": [],
  "skills": [
   "percepcao",
   "furtividade",
   "sobrevivencia"
  ],
  "expertise": [
   "furtividade",
   "sobrevivencia"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 4,
    "damage": "1d6+2",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d10+2",
     "type": "perfurante"
    },
    "onHit": {
     "semResistencia": true,
     "dc": 12,
     "escape": 12,
     "condition": "contido",
     "note": "é agarrado"
    }
   },
   {
    "name": "Garras",
    "bonus": 4,
    "damage": "1d4+2",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Mordida",
    "Garras"
   ]
  },
  "spellcasting": {
   "ability": "wis",
   "cantrips": [
    "arteDruidica",
    "produzirChama",
    "chicoteDeEspinhos"
   ],
   "prepared": [
    "emaranhar",
    "nevoaObscurecente",
    "calorNoMetal",
    "crescimentoDeEspinhos",
    "conjurarAnimais",
    "crescimentoDePlantas"
   ],
   "slots": [
    0,
    4,
    3,
    2
   ],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "cdPorMagia": {
    "arteDruidica": 12,
    "produzirChama": 12,
    "chicoteDeEspinhos": 12,
    "emaranhar": 12,
    "nevoaObscurecente": 12,
    "calorNoMetal": 12,
    "crescimentoDeEspinhos": 12,
    "conjurarAnimais": 12,
    "crescimentoDePlantas": 12
   }
  },
  "traits": [
   "t_mudarDeForma"
  ],
  "blurb": "Druida do pântano que prende inimigos com magias de plantas e espinhos, esquenta armaduras e, quando quer morder de verdade, vira crocodilo e arrasta a presa contida.",
  "lore": "Entre o povo-lagarto, os xamãs são os guardiões dos ritos e intermediários entre a tribo e os espíritos da natureza. Vivem em pântanos e florestas alagadas, onde conhecem cada canal e cada tocaia. Pensam de forma fria e prática, julgando tudo pela utilidade para a sobrevivência do grupo. Em combate, preferem moldar o terreno a seu favor antes de avançar com garras e dentes."
 },
 "mefiteDeMagma": {
  "id": "mefiteDeMagma",
  "tipo": "elemental",
  "name": "Mefite de Magma",
  "nomeOriginal": "Magma Mephit",
  "fonte": "MM",
  "size": "pequeno",
  "level": 1,
  "cr": "1/2",
  "xp": 100,
  "abilities": {
   "str": 8,
   "dex": 12,
   "con": 12,
   "int": 7,
   "wis": 10,
   "cha": 10
  },
  "ac": 11,
  "maxHp": 22,
  "hpDice": "5d6+5",
  "speedFt": 30,
  "flyFt": 30,
  "speeds": {
   "flyFt": 30
  },
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "furtividade"
  ],
  "expertise": [],
  "damageImmunities": [
   "fogo",
   "veneno"
  ],
  "damageVulnerabilities": [
   "frio"
  ],
  "conditionImmunities": [
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Garras",
    "bonus": 3,
    "damage": "1d4+1",
    "type": "cortante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d4",
     "type": "fogo"
    }
   }
  ],
  "breath": {
   "name": "Sopro de Fogo",
   "kind": "save",
   "shape": "cone",
   "areaFt": 15,
   "save": "dex",
   "dc": 11,
   "damage": "2d6",
   "damageType": "fogo",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    6
   ]
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "calorNoMetal"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "aVontade": [
    "calorNoMetal"
   ],
   "cdPorMagia": {
    "calorNoMetal": 10
   }
  },
  "explosaoAoMorrer": {
   "pes": 5,
   "save": "dex",
   "dc": 11,
   "dano": "2d6",
   "tipo": "fogo",
   "metade": true
  },
  "traits": [
   "explosaoAoMorrer",
   "aparenciaFalsa"
  ],
  "blurb": "Pequeno elemental de lava que arranha com garras incandescentes, cospe um cone de fogo e pode aquecer metal de armaduras. Ao morrer, explode em lava — não fique colado nele no golpe final.",
  "lore": "Mefites de magma são criaturinhas elementais nascidas da fusão entre fogo e terra, comuns em cavernas vulcânicas e nas profundezas do Subterrâneo. São preguiçosos, mesquinhos e pouco espertos, mas adoram causar dor. Costumam ficar imóveis fingindo ser um monte de magma até alguém se aproximar. Muitas vezes servem a magos ou criaturas mais poderosas em troca de pouco."
 },
 "magmin": {
  "id": "magmin",
  "tipo": "elemental",
  "name": "Magmin",
  "nomeOriginal": "Magmin",
  "fonte": "MM",
  "size": "pequeno",
  "level": 1,
  "cr": "1/2",
  "xp": 100,
  "abilities": {
   "str": 7,
   "dex": 15,
   "con": 12,
   "int": 8,
   "wis": 11,
   "cha": 10
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 9,
  "hpDice": "2d6+2",
  "speedFt": 30,
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "damageImmunities": [
   "fogo"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Toque",
    "bonus": 4,
    "damage": "2d6",
    "type": "fogo",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d6",
     "type": "fogo"
    }
   }
  ],
  "explosaoAoMorrer": {
   "pes": 10,
   "save": "dex",
   "dc": 11,
   "dano": "2d6",
   "tipo": "fogo",
   "metade": true
  },
  "luzPropria": {
   "claro": 10,
   "penumbra": 10
  },
  "traits": [
   "explosaoAoMorrer"
  ],
  "blurb": "Pequeno e frágil, o magmin incendeia tudo o que toca, deixando os alvos queimando turno após turno. Ao morrer, explode em fogo e magma, então evite cercá-lo corpo a corpo.",
  "lore": "O magmin é um espírito elemental do fogo preso a um corpinho atarracado com casca de magma negra, de onde escapam pequenos jatos de chama. Só chega ao Plano Material quando alguém o invoca, e apenas o controle mágico do invocador o impede de queimar tudo ao redor. Vê qualquer coisa inflamável como lenha para um grande incêndio e não entende o mal que o fogo causa aos seres deste plano. Caprichoso e imprevisível, procura lugares muito quentes, como vulcões e florestas em chamas, e se diverte ateando fogo em objetos."
 },
 "mamute": {
  "id": "mamute",
  "tipo": "fera",
  "name": "Mamute",
  "nomeOriginal": "Mammoth",
  "fonte": "MM",
  "size": "enorme",
  "level": 5,
  "cr": "6",
  "xp": 2300,
  "abilities": {
   "str": 24,
   "dex": 9,
   "con": 21,
   "int": 3,
   "wis": 11,
   "cha": 6
  },
  "ac": 13,
  "acNote": "armadura natural",
  "maxHp": 126,
  "hpDice": "11d12+55",
  "speedFt": 40,
  "senses": {
   "passivePerception": 10
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Presas",
    "bonus": 10,
    "damage": "4d8+7",
    "type": "perfurante",
    "reachFt": 10,
    "investida": {
     "pes": 20,
     "save": "str",
     "dc": 18,
     "mordeSeCair": "Pisotear"
    }
   },
   {
    "name": "Pisotear",
    "bonus": 10,
    "damage": "4d10+7",
    "type": "concussão",
    "reachFt": 5
   }
  ],
  "traits": [],
  "blurb": "Investe em linha reta para derrubar o alvo com as presas e depois esmagá-lo com as patas. Um golpe de presa causa dano enorme e alcança até 3 m.",
  "lore": "O mamute é um parente peludo dos elefantes, com presas longas e curvas. É mais robusto e agressivo que seus primos de clima quente. Vive desde as tundras geladas até regiões quase tropicais, geralmente em manadas. Quando ameaçado, não foge: avança e pisoteia quem estiver no caminho."
 },
 "manes": {
  "id": "manes",
  "tipo": "corruptor",
  "name": "Manes",
  "nomeOriginal": "Manes",
  "fonte": "MM",
  "size": "pequeno",
  "level": 1,
  "cr": "1/8",
  "xp": 25,
  "abilities": {
   "str": 10,
   "dex": 9,
   "con": 13,
   "int": 3,
   "wis": 8,
   "cha": 4
  },
  "ac": 9,
  "acNote": "armadura natural",
  "maxHp": 9,
  "hpDice": "2d6+2",
  "speedFt": 20,
  "senses": {
   "passivePerception": 9,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "frio",
   "fogo",
   "elétrico"
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
    "name": "Garras",
    "bonus": 2,
    "damage": "2d4",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "traits": [],
  "blurb": "Demônio menor, lento e frágil, que avança em bandos e rasga com as garras. Sozinho é fraco, mas resiste a fogo, frio e eletricidade e não pode ser amedrontado nem enfeitiçado.",
  "lore": "Os manes são a forma mais baixa de demônio, nascidos das almas corrompidas de mortais cruéis que acabam no Abismo. Vagam em hordas famintas pelas planícies abissais, atacando qualquer coisa viva que encontrem. Não têm vontade própria além da fome e da violência, e demônios mais poderosos os usam como carne de canhão. Entendem o Abissal, mas não conseguem falar."
 },
 "manticora": {
  "id": "manticora",
  "tipo": "monstruosidade",
  "name": "Mantícora",
  "nomeOriginal": "Manticore",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 17,
   "dex": 16,
   "con": 17,
   "int": 7,
   "wis": 12,
   "cha": 8
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 68,
  "hpDice": "8d10+24",
  "speedFt": 30,
  "flyFt": 50,
  "speeds": {
   "flyFt": 50
  },
  "senses": {
   "passivePerception": 11,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 5,
    "damage": "1d8+3",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Garra",
    "bonus": 5,
    "damage": "1d6+3",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Espinho da Cauda",
    "bonus": 5,
    "damage": "1d8+3",
    "type": "perfurante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 100,
    "longRangeFt": 200
   }
  ],
  "multiattack": {
   "count": 3
  },
  "traits": [
   "t_espinhosRegenerativos"
  ],
  "blurb": "Dispara saraivadas de espinhos da cauda de longe enquanto voa e depois mergulha para morder e arranhar. Com três ataques por turno e alcance de 30 m, castiga até quem se esconde atrás da linha de frente.",
  "lore": "A mantícora é uma fera com corpo de leão, asas dracônicas e um rosto de aparência quase humana, e a cauda dela termina num feixe de espinhos. Caça em montanhas, colinas, campos e litorais, muitas vezes em bando, e divide a presa abatida com os demais. É pouco inteligente, mas cruel e falante: zomba das vítimas e pode poupar quem lhe ofereça algo mais valioso que uma refeição. Costuma servir senhores malignos que a alimentem bem, como hordas de orcs ou gigantes, e disputa território com grifos, quimeras e serpes, mas foge de dragões."
 },
 "marid": {
  "id": "marid",
  "tipo": "elemental",
  "name": "Marid",
  "nomeOriginal": "Marid",
  "fonte": "MM",
  "size": "grande",
  "level": 9,
  "cr": "11",
  "xp": 7200,
  "abilities": {
   "str": 22,
   "dex": 12,
   "con": 26,
   "int": 18,
   "wis": 17,
   "cha": 18
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 229,
  "hpDice": "17d10+136",
  "speedFt": 30,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60,
   "swimFt": 90
  },
  "senses": {
   "passivePerception": 13,
   "blindsightFt": 30,
   "darkvisionFt": 120
  },
  "saves": [
   "dex",
   "wis",
   "cha"
  ],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "ácido",
   "frio",
   "elétrico"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Tridente",
    "bonus": 10,
    "damage": "2d6+6",
    "type": "perfurante",
    "reachFt": 5,
    "rangeFt": 20,
    "longRangeFt": 60,
    "danoExtra": {
     "damage": "2d8+6",
     "type": "perfurante"
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Tridente",
    "Tridente"
   ]
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "linguas",
    "respirarNaAgua",
    "andarNaAgua",
    "formaGasosa",
    "invisibilidade",
    "viagemPlanar",
    "criarDestruirAgua",
    "detectarBemMal",
    "detectarMagia",
    "nevoaObscurecente",
    "purificarAlimentos"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "linguas": 3,
    "respirarNaAgua": 3,
    "andarNaAgua": 3,
    "formaGasosa": 1,
    "invisibilidade": 1,
    "viagemPlanar": 1
   },
   "aVontade": [
    "criarDestruirAgua",
    "detectarBemMal",
    "detectarMagia",
    "nevoaObscurecente",
    "purificarAlimentos"
   ],
   "cdPorMagia": {
    "linguas": 16,
    "respirarNaAgua": 16,
    "andarNaAgua": 16,
    "formaGasosa": 16,
    "invisibilidade": 16,
    "viagemPlanar": 16,
    "criarDestruirAgua": 16,
    "detectarBemMal": 16,
    "detectarMagia": 16,
    "nevoaObscurecente": 16,
    "purificarAlimentos": 16
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Jato d'Água",
    "tipo": "area",
    "shape": "linha",
    "areaFt": 60,
    "larguraFt": 5,
    "save": "dex",
    "dc": 16,
    "damage": "6d6",
    "damageType": "concussão",
    "halfOnSave": true,
    "condition": "caido",
    "rounds": 10,
    "repete": false
   }
  ],
  "traits": [
   "t_fimElemental"
  ],
  "blurb": "Gênio da água que crava o tridente duas vezes por turno e dispara jatos d'água em linha que derrubam e empurram grupos inteiros. Resistente, voa e nada muito rápido, e ainda conta com magias como névoa, invisibilidade e controlar água.",
  "lore": "Os marids são gênios nascidos no Plano Elemental da Água e se julgam muito superiores aos djinn, dao e efreet. Moram em fortalezas de coral que flutuam nas profundezas do plano, cheias de salões com ar onde ficam escravos e convidados, muitas vezes artistas e contadores de histórias raptados. Todos ostentam títulos de nobreza, quase sempre inventados, e tratam os humanoides como seres menores, aceitando lisonja e suborno. Adoram narrar lendas exageradas sobre si mesmos, e interromper uma delas é a forma mais rápida de provocar sua fúria."
 },
 "marilith": {
  "id": "marilith",
  "tipo": "corruptor",
  "name": "Marilith",
  "nomeOriginal": "Marilith",
  "fonte": "MM",
  "size": "grande",
  "level": 13,
  "cr": "16",
  "xp": 15000,
  "abilities": {
   "str": 18,
   "dex": 20,
   "con": 20,
   "int": 18,
   "wis": 16,
   "cha": 20
  },
  "ac": 18,
  "acNote": "armadura natural",
  "maxHp": 189,
  "hpDice": "18d10+90",
  "speedFt": 40,
  "senses": {
   "passivePerception": 13,
   "truesightFt": 120
  },
  "saves": [
   "str",
   "con",
   "wis",
   "cha"
  ],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "frio",
   "fogo",
   "elétrico",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "damageImmunities": [
   "veneno"
  ],
  "conditionImmunities": [
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Espada Longa",
    "bonus": 9,
    "damage": "2d8+4",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Cauda",
    "bonus": 9,
    "damage": "2d10+4",
    "type": "concussão",
    "reachFt": 10,
    "onHit": {
     "semResistencia": true,
     "dc": 19,
     "escape": 19,
     "condition": "contido",
     "note": "é agarrado"
    }
   }
  ],
  "multiattack": {
   "count": 2
  },
  "acoesEspeciais": [
   {
    "nome": "Teletransporte",
    "tipo": "teleporte",
    "alcanceFt": 120
   }
  ],
  "traits": [
   "resistenciaAMagia",
   "armasMagicas",
   "reativo",
   "aparar"
  ],
  "blurb": "Demônio de seis braços que desfere seis golpes de espada longa e uma cauda por turno, contendo alvos médios ou menores. Pode reagir em todo turno para aparar golpes e se teleporta pelo campo de batalha.",
  "lore": "A marilith é uma demônia do Abismo com torso feminino de seis braços e corpo inferior de serpente. Estrategista nata, comanda hordas demoníacas e adora planejar guerras e cercos. Raramente luta sem uma espada em cada mão, buscando o oponente mais forte para provar sua superioridade. Sua mente afiada a torna tão perigosa como general quanto como duelista."
 },
 "mastim": {
  "id": "mastim",
  "tipo": "fera",
  "name": "Mastim",
  "nomeOriginal": "Mastiff",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1/8",
  "xp": 25,
  "abilities": {
   "str": 13,
   "dex": 14,
   "con": 12,
   "int": 3,
   "wis": 12,
   "cha": 7
  },
  "ac": 12,
  "maxHp": 5,
  "hpDice": "1d8+1",
  "speedFt": 40,
  "senses": {
   "passivePerception": 13
  },
  "saves": [],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 3,
    "damage": "1d6+1",
    "type": "perfurante",
    "reachFt": 5,
    "onHit": {
     "save": "str",
     "dc": 11,
     "condition": "caido",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "traits": [
   "keenHearingSmell"
  ],
  "blurb": "Cão robusto que morde e derruba: cada mordida pode deixar o alvo caído, abrindo espaço para os aliados atacarem com vantagem. Difícil de surpreender graças ao faro e à audição.",
  "lore": "O mastim é um cão grande e forte, muito valorizado por povos humanoides pela fidelidade e pelos sentidos aguçados. É adestrado para vigiar propriedades, acompanhar caçadas ou lutar ao lado de soldados. Halflings e outros humanoides pequenos costumam usá-lo como montaria. Aparece em florestas, colinas e cidades, quase sempre junto de um dono."
 },
 "sereiano": {
  "id": "sereiano",
  "tipo": "humanoide",
  "name": "Sereiano",
  "nomeOriginal": "Merfolk",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1/8",
  "xp": 25,
  "abilities": {
   "str": 10,
   "dex": 13,
   "con": 12,
   "int": 11,
   "wis": 11,
   "cha": 12
  },
  "ac": 11,
  "maxHp": 11,
  "hpDice": "2d8+2",
  "speedFt": 10,
  "speeds": {
   "swimFt": 40
  },
  "senses": {
   "passivePerception": 12
  },
  "saves": [],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Lança",
    "bonus": 2,
    "damage": "1d6",
    "type": "perfurante",
    "reachFt": 5,
    "rangeFt": 20,
    "longRangeFt": 60,
    "danoExtra": {
     "damage": "1d8",
     "type": "perfurante"
    }
   }
  ],
  "traits": [],
  "blurb": "Luta com lança, golpeando de perto ou arremessando-a a distância; é ágil na água, mas quase inútil em terra firme.",
  "lore": "Os sereianos têm tronco humano e cauda de peixe, e enfeitam pele e escamas com conchas. Vivem em mares rasos, em cavernas submersas, labirintos de coral ou ruínas afundadas, onde cultivam o leito marinho e pastoreiam cardumes. Sem meios de forjar metal ou erguer cidades de pedra, organizam-se em pequenas tribos de caçadores-coletores, cada uma com seus próprios costumes. Às vezes um líder une várias tribos contra uma ameaça comum, e isso pode dar origem a reinos submarinos duradouros. Defendem seus lares com lanças feitas de destroços de navios e restos de criaturas marinhas."
 },
 "merrow": {
  "id": "merrow",
  "tipo": "monstruosidade",
  "name": "Merrow",
  "nomeOriginal": "Merrow",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 18,
   "dex": 10,
   "con": 15,
   "int": 8,
   "wis": 10,
   "cha": 9
  },
  "ac": 13,
  "acNote": "armadura natural",
  "maxHp": 45,
  "hpDice": "6d10+12",
  "speedFt": 10,
  "speeds": {
   "swimFt": 40
  },
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 6,
    "damage": "1d8+4",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Garras",
    "bonus": 6,
    "damage": "2d4+4",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Arpão",
    "bonus": 6,
    "damage": "2d6+4",
    "type": "perfurante",
    "reachFt": 5,
    "rangeFt": 20,
    "longRangeFt": 60
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Mordida",
    "Garras"
   ]
  },
  "traits": [],
  "blurb": "Brutamonte aquático que morde e golpeia com garras ou arpão; o arpão pode ser arremessado e arrastar a vítima até ele.",
  "lore": "Os merrow descendem de sereianos que enlouqueceram ao tocar um ídolo de Demogorgon e atravessaram um portal para o Abismo, onde gerações de tormento os deformaram em monstros enormes e cruéis. O Príncipe dos Demônios os devolve ao Plano Material sempre que pode, para semear destruição nos mares. Rondam águas costeiras caçando pescadores, sereianos e qualquer presa comestível, arrastando os afogados para suas grutas submersas. Atacam tudo que for menor ou mais fraco e guardam tesouros e troféus em cavernas, marcando os limites do território com cadáveres amarrados a algas."
 },
 "mezzoloth": {
  "id": "mezzoloth",
  "tipo": "corruptor",
  "name": "Mezzoloth",
  "nomeOriginal": "Mezzoloth",
  "fonte": "MM",
  "size": "médio",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 18,
   "dex": 11,
   "con": 16,
   "int": 7,
   "wis": 10,
   "cha": 11
  },
  "ac": 18,
  "acNote": "armadura natural",
  "maxHp": 75,
  "hpDice": "10d8+30",
  "speedFt": 40,
  "senses": {
   "passivePerception": 13,
   "blindsightFt": 60,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "damageResistances": [
   "frio",
   "fogo",
   "elétrico",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "damageImmunities": [
   "ácido",
   "veneno"
  ],
  "conditionImmunities": [
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Garras",
    "bonus": 7,
    "damage": "2d4+4",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Tridente",
    "bonus": 7,
    "damage": "1d6+4",
    "type": "perfurante",
    "reachFt": 5,
    "rangeFt": 20,
    "longRangeFt": 60,
    "danoExtra": {
     "damage": "1d8+4",
     "type": "perfurante"
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Garras",
    "Tridente"
   ]
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "nuvemMortal",
    "escuridao",
    "dissiparMagia"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "nuvemMortal": 1,
    "escuridao": 2,
    "dissiparMagia": 2
   },
   "cdPorMagia": {
    "nuvemMortal": 11,
    "escuridao": 11,
    "dissiparMagia": 11
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Teletransporte",
    "tipo": "teleporte",
    "alcanceFt": 60
   }
  ],
  "traits": [
   "resistenciaAMagia",
   "armasMagicas"
  ],
  "blurb": "Soldado yugoloth que ataca com garras e tridente e se teleporta para flanquear os inimigos. Resiste a magia e pode lançar névoa mortal sobre grupos inteiros.",
  "lore": "Mezzoloths são os soldados rasos dos yugoloths, demônios mercenários com corpo de inseto do tamanho de um homem. Servem a quem pagar mais, lutando em guerras nos planos inferiores e também no mundo material. São brutos e pouco inteligentes, mas disciplinados quando bem comandados. Costumam agir em bandos, cercando a presa e envolvendo-a em nuvens venenosas."
 },
 "devoradorDeMentes": {
  "id": "devoradorDeMentes",
  "tipo": "aberração",
  "name": "Devorador de Mentes",
  "nomeOriginal": "Mind Flayer",
  "fonte": "MM",
  "size": "médio",
  "level": 5,
  "cr": "7",
  "xp": 2900,
  "abilities": {
   "str": 11,
   "dex": 12,
   "con": 12,
   "int": 19,
   "wis": 17,
   "cha": 17
  },
  "ac": 15,
  "acNote": "peitoral",
  "maxHp": 71,
  "hpDice": "13d8+13",
  "speedFt": 30,
  "senses": {
   "passivePerception": 16,
   "darkvisionFt": 120
  },
  "saves": [
   "int",
   "wis",
   "cha"
  ],
  "skills": [
   "arcanismo",
   "enganacao",
   "intuicao",
   "percepcao",
   "persuasao",
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Tentáculos",
    "bonus": 7,
    "damage": "2d10+4",
    "type": "psíquico",
    "reachFt": 5,
    "onHit": {
     "semResistencia": true,
     "dc": 15,
     "escape": 15,
     "condition": "agarrado",
     "note": "é agarrado"
    }
   },
   {
    "name": "Extrair Cérebro",
    "bonus": 7,
    "damage": "10d10",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "dominarMonstro",
    "viagemPlanar",
    "detectarPensamentos",
    "levitacao"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "dominarMonstro": 1,
    "viagemPlanar": 1
   },
   "aVontade": [
    "detectarPensamentos",
    "levitacao"
   ],
   "cdPorMagia": {
    "dominarMonstro": 15,
    "viagemPlanar": 15,
    "detectarPensamentos": 15,
    "levitacao": 15
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Rajada Mental",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 60,
    "save": "int",
    "dc": 15,
    "damage": "4d8+4",
    "damageType": "psíquico",
    "halfOnSave": false,
    "condition": "atordoado",
    "rounds": 10,
    "repete": true
   }
  ],
  "traits": [
   "resistenciaAMagia"
  ],
  "blurb": "Atordoa grupos inteiros com a Rajada Mental e depois agarra as vítimas com os tentáculos para arrancar seus cérebros. Atacar com magia é difícil, pois ele resiste a feitiços.",
  "lore": "Também chamados de illithids, são aberrações de cabeça semelhante a um polvo que se alimentam de cérebros humanoides. Outrora governaram impérios que abrangiam muitos mundos e escravizaram povos como githyanki e kuo-toa. Hoje vivem em colônias no Subterrâneo, ligados telepaticamente a um cérebro ancião que coordena seus planos. Raramente lutam de frente: preferem mandar servos dominados ao combate enquanto se mantêm a salvo ou fogem."
 },
 "devoradorDeMentesArcanista": {
  "id": "devoradorDeMentesArcanista",
  "tipo": "aberração",
  "name": "Devorador de Mentes Arcanista",
  "nomeOriginal": "Mind Flayer Arcanist",
  "fonte": "MM",
  "size": "médio",
  "level": 5,
  "cr": "8",
  "xp": 3900,
  "abilities": {
   "str": 11,
   "dex": 12,
   "con": 12,
   "int": 19,
   "wis": 17,
   "cha": 17
  },
  "ac": 15,
  "acNote": "peitoral",
  "maxHp": 71,
  "hpDice": "13d8+13",
  "speedFt": 30,
  "senses": {
   "passivePerception": 16,
   "darkvisionFt": 120
  },
  "saves": [
   "int",
   "wis",
   "cha"
  ],
  "skills": [
   "arcanismo",
   "enganacao",
   "intuicao",
   "percepcao",
   "persuasao",
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Tentáculos",
    "bonus": 7,
    "damage": "2d10+4",
    "type": "psíquico",
    "reachFt": 5,
    "onHit": {
     "semResistencia": true,
     "dc": 15,
     "escape": 15,
     "condition": "agarrado",
     "note": "é agarrado"
    }
   },
   {
    "name": "Extrair Cérebro",
    "bonus": 7,
    "damage": "10d10",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "dominarMonstro",
    "viagemPlanar",
    "detectarPensamentos",
    "levitacao"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "dominarMonstro": 1,
    "viagemPlanar": 1
   },
   "aVontade": [
    "detectarPensamentos",
    "levitacao"
   ],
   "cdPorMagia": {
    "dominarMonstro": 15,
    "viagemPlanar": 15,
    "detectarPensamentos": 15,
    "levitacao": 15
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Explosão Mental",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 60,
    "save": "int",
    "dc": 15,
    "damage": "4d8+4",
    "damageType": "psíquico",
    "halfOnSave": false,
    "condition": "atordoado",
    "rounds": 10,
    "repete": true
   }
  ],
  "traits": [
   "resistenciaAMagia"
  ],
  "blurb": "Atordoa grupos com a Explosão Mental e agarra vítimas com os tentáculos para arrancar-lhes o cérebro, enquanto conjura magias de mago como relâmpago, muralha de energia e confusão. Resiste bem à magia e foge de outro plano quando a luta vira.",
  "lore": "Alguns devoradores de mentes estudam magia arcana em segredo, algo que seus pares e o cérebro ancião veem com desconfiança. Esses arcanistas habitam as cidades illithid do Subterrâneo e somam feitiços de mago aos seus poderes psiônicos naturais. Calculistas e frios, preferem manipular e dominar inimigos antes de se expor. Quando se alimentam, devoram o cérebro de humanoides capturados."
 },
 "minotauro": {
  "id": "minotauro",
  "tipo": "monstruosidade",
  "name": "Minotauro",
  "nomeOriginal": "Minotaur",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 18,
   "dex": 11,
   "con": 16,
   "int": 6,
   "wis": 16,
   "cha": 9
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 76,
  "hpDice": "9d10+27",
  "speedFt": 40,
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
    "name": "Machado Grande",
    "bonus": 6,
    "damage": "2d12+4",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Chifrada",
    "bonus": 6,
    "damage": "2d8+4",
    "type": "perfurante",
    "reachFt": 5,
    "investida": {
     "pes": 10,
     "save": "str",
     "dc": 14,
     "dano": "2d8",
     "tipo": "perfurante"
    }
   }
  ],
  "traits": [
   "t_memoriaLabirintica",
   "imprudente"
  ],
  "blurb": "Investe em linha reta para chifrar e derrubar o alvo, depois o retalha com o machado grande. Pode lutar de forma imprudente para ganhar vantagem, ficando mais fácil de acertar.",
  "lore": "Os minotauros são monstruosidades carnívoras nascidas de ritos demoníacos ligados a Baphomet, o Rei Chifrudo, senhor de um labirinto no Abismo. Costumam viver sozinhos em masmorras, cavernas tortuosas, florestas antigas e ruínas cheias de passagens, onde emboscam quem se perde por ali. O cheiro de sangue os leva a um frenesi em que atacam tudo o que veem como aríetes vivos. Desprezam hierarquia e quase nunca aceitam ser controlados. Hoje também se reproduzem entre si, formando uma raça própria."
 },
 "esqueletoDeMinotauro": {
  "id": "esqueletoDeMinotauro",
  "tipo": "morto-vivo",
  "name": "Esqueleto de Minotauro",
  "nomeOriginal": "Minotaur Skeleton",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 18,
   "dex": 11,
   "con": 15,
   "int": 6,
   "wis": 8,
   "cha": 5
  },
  "ac": 12,
  "acNote": "armadura natural",
  "maxHp": 67,
  "hpDice": "9d10+18",
  "speedFt": 40,
  "senses": {
   "passivePerception": 9,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "damageImmunities": [
   "veneno"
  ],
  "damageVulnerabilities": [
   "concussão"
  ],
  "conditionImmunities": [
   "exausto",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Machado Grande",
    "bonus": 6,
    "damage": "2d12+4",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Chifrada",
    "bonus": 6,
    "damage": "2d8+4",
    "type": "perfurante",
    "reachFt": 5,
    "investida": {
     "pes": 10,
     "save": "str",
     "dc": 14,
     "dano": "2d8",
     "tipo": "perfurante"
    }
   }
  ],
  "traits": [],
  "blurb": "Avança em linha reta e crava os chifres para derrubar e empurrar o alvo, depois golpeia com um machado grande devastador. É frágil contra dano de concussão.",
  "lore": "É o que resta de um minotauro depois que magia necromântica reanima seus ossos. Sem vontade própria, obedece a quem o ergueu e guarda labirintos, criptas e túneis do Subterrâneo. Ainda compreende o abissal que falava em vida, mas não consegue pronunciar palavra. Não se cansa nem sente medo, e investe com a mesma fúria bestial de antes."
 },
 "monodrone": {
  "id": "monodrone",
  "tipo": "constructo",
  "name": "Monodrone",
  "nomeOriginal": "Monodrone",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1/8",
  "xp": 25,
  "abilities": {
   "str": 10,
   "dex": 13,
   "con": 12,
   "int": 4,
   "wis": 10,
   "cha": 5
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 5,
  "hpDice": "1d8+1",
  "speedFt": 30,
  "flyFt": 30,
  "speeds": {
   "flyFt": 30
  },
  "senses": {
   "passivePerception": 10,
   "truesightFt": 120
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Adaga",
    "bonus": 3,
    "damage": "1d4+1",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Azagaia",
    "bonus": 2,
    "damage": "1d6",
    "type": "perfurante",
    "reachFt": 5,
    "rangeFt": 30,
    "longRangeFt": 120
   }
  ],
  "traits": [
   "t_menteAxiomatica",
   "t_desintegracao"
  ],
  "blurb": "Um modron simples que ataca com adaga corpo a corpo ou arremessa azagaias à distância. Sozinho é frágil, mas costuma aparecer em grupos disciplinados e enxerga o que é invisível ou ilusório com sua visão verdadeira.",
  "lore": "O monodrone é o modron de posto mais baixo, um construto esférico de um olho só, nascido em Mechanus, o plano da ordem absoluta. Consegue executar apenas uma tarefa de cada vez e repassa mensagens simples na hierarquia rígida comandada por Primus. Obedece sem questionar e age em formação ao lado de outros da sua espécie. Às vezes uma unidade se corrompe e vira um modron renegado, que passa a ser caçado pelos demais."
 },
 "mefiteDeLama": {
  "id": "mefiteDeLama",
  "tipo": "elemental",
  "name": "Mefite de Lama",
  "nomeOriginal": "Mud Mephit",
  "fonte": "MM",
  "size": "pequeno",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 8,
   "dex": 12,
   "con": 12,
   "int": 9,
   "wis": 11,
   "cha": 7
  },
  "ac": 11,
  "maxHp": 27,
  "hpDice": "6d6+6",
  "speedFt": 20,
  "flyFt": 20,
  "speeds": {
   "flyFt": 20,
   "swimFt": 20
  },
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "furtividade"
  ],
  "expertise": [],
  "damageImmunities": [
   "veneno"
  ],
  "conditionImmunities": [
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Punhos",
    "bonus": 3,
    "damage": "1d6+1",
    "type": "concussão",
    "reachFt": 5
   }
  ],
  "acoesEspeciais": [
   {
    "nome": "Sopro de Lama",
    "recharge": [
     6
    ],
    "tipo": "alvo",
    "alcanceFt": 5,
    "save": "dex",
    "dc": 11,
    "condition": "contido",
    "rounds": 10,
    "repete": true
   }
  ],
  "explosaoAoMorrer": {
   "pes": 5,
   "save": "dex",
   "dc": 11,
   "condicao": "contido",
   "rounds": 1
  },
  "traits": [
   "explosaoAoMorrer",
   "aparenciaFalsa"
  ],
  "blurb": "Um elemental lento e chorão que prende os inimigos com jatos de lama viscosa e, ao morrer, explode em barro grudento que imobiliza quem estiver por perto.",
  "lore": "O mefite de lama é um pequeno elemental nascido da mistura de terra e água, comum em pântanos e lodaçais. Vive reclamando e choramingando, pedindo atenção e compaixão a qualquer um que cruze seu caminho. Costuma ficar parado no meio da lama, idêntico a um monte de barro, até que uma vítima se aproxime. Em combate, prefere grudar o alvo no lugar e golpeá-lo com os punhos enquanto ele se debate."
 },
 "mula": {
  "id": "mula",
  "tipo": "fera",
  "name": "Mula",
  "nomeOriginal": "Mule",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1/8",
  "xp": 25,
  "abilities": {
   "str": 14,
   "dex": 10,
   "con": 13,
   "int": 2,
   "wis": 10,
   "cha": 5
  },
  "ac": 10,
  "maxHp": 11,
  "hpDice": "2d8+2",
  "speedFt": 40,
  "senses": {
   "passivePerception": 10
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Cascos",
    "bonus": 2,
    "damage": "1d4+2",
    "type": "concussão",
    "reachFt": 5
   }
  ],
  "traits": [
   "t_animalDeCarga",
   "pesFirmes"
  ],
  "blurb": "Animal de carga teimoso que só luta para se defender, dando coices com os cascos. Difícil de derrubar, mas frágil em combate.",
  "lore": "A mula é o cruzamento resistente entre cavalo e jumento, criada para carregar peso por longas distâncias. É comum em colinas, desertos e cidades, puxando carroças ou levando a bagagem de viajantes e mineiros. Tem fama de teimosa, mas é firme nas trilhas e aguenta terrenos onde um cavalo tropeçaria. Raramente ataca, a não ser quando assustada ou maltratada."
 },
 "senhorDasMumias": {
  "id": "senhorDasMumias",
  "tipo": "morto-vivo",
  "name": "Senhor das Múmias",
  "nomeOriginal": "Mummy Lord",
  "fonte": "MM",
  "size": "médio",
  "level": 13,
  "cr": "15",
  "xp": 13000,
  "abilities": {
   "str": 18,
   "dex": 10,
   "con": 17,
   "int": 11,
   "wis": 18,
   "cha": 16
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 97,
  "hpDice": "13d8+39",
  "speedFt": 20,
  "senses": {
   "passivePerception": 14,
   "darkvisionFt": 60
  },
  "saves": [
   "con",
   "int",
   "wis",
   "cha"
  ],
  "skills": [
   "historia",
   "religiao"
  ],
  "expertise": [],
  "damageImmunities": [
   "necrótico",
   "veneno",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageImmunitiesNote": "só de armas não mágicas",
  "damageVulnerabilities": [
   "fogo"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "exausto",
   "amedrontado",
   "paralisado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Punho Apodrecido",
    "bonus": 9,
    "damage": "3d6+4",
    "type": "concussão",
    "reachFt": 5,
    "onHit": {
     "save": "con",
     "dc": 16,
     "danoSeFalhar": {
      "damage": "6d6",
      "type": "necrótico"
     },
     "metadeSePassar": false
    }
   }
  ],
  "multiattack": {
   "count": 1
  },
  "spellcasting": {
   "ability": "wis",
   "cantrips": [
    "chamaSagrada",
    "taumaturgia"
   ],
   "prepared": [
    "comando",
    "raioGuiado",
    "escudoDaFe",
    "imobilizarPessoa",
    "silencio",
    "armaEspiritual",
    "animarMortos",
    "dissiparMagia",
    "adivinhacao",
    "guardiaoDaFe",
    "contagio",
    "pragaDeInsetos",
    "ferir"
   ],
   "slots": [
    0,
    4,
    3,
    3,
    3,
    2,
    1
   ],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "cdPorMagia": {
    "chamaSagrada": 17,
    "taumaturgia": 17,
    "comando": 17,
    "raioGuiado": 17,
    "escudoDaFe": 17,
    "imobilizarPessoa": 17,
    "silencio": 17,
    "armaEspiritual": 17,
    "animarMortos": 17,
    "dissiparMagia": 17,
    "adivinhacao": 17,
    "guardiaoDaFe": 17,
    "contagio": 17,
    "pragaDeInsetos": 17,
    "ferir": 17
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Olhar Aterrorizante",
    "tipo": "alvo",
    "alcanceFt": 60,
    "save": "wis",
    "dc": 16,
    "condition": "amedrontado",
    "rounds": 1,
    "repete": false,
    "ateFimDoTurnoDele": true
   }
  ],
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Ataque",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Punho Apodrecido"
    },
    {
     "nome": "Poeira Cegante",
     "custo": 1,
     "tipo": "area",
     "raioFt": 5,
     "save": "con",
     "dc": 16,
     "condition": "cego",
     "rounds": 1,
     "repete": false,
     "ateFimDoTurnoDoAlvo": true
    },
    {
     "nome": "Palavra Blasfema",
     "custo": 2,
     "tipo": "area",
     "raioFt": 10,
     "save": "con",
     "dc": 16,
     "condition": "atordoado",
     "rounds": 1,
     "repete": false,
     "ateFimDoTurnoDoAlvo": true,
     "naoMortosVivos": true
    },
    {
     "nome": "Canalizar Energia Negativa",
     "custo": 2,
     "tipo": "semCura",
     "raioFt": 60
    },
    {
     "nome": "Redemoinho de Areia",
     "custo": 2,
     "tipo": "mover",
     "pes": 60,
     "semOportunidade": true
    }
   ]
  },
  "traits": [
   "resistenciaAMagia",
   "t_rejuvenescimento",
   "acoesLendarias"
  ],
  "blurb": "Conjurador divino que combina um punho apodrecido devastador, capaz de amaldiçoar com a podridão de múmia, com um olhar que amedronta e paralisa. Suas ações lendárias cegam, atordoam e impedem a cura, e só o fogo e a magia a ferem de verdade.",
  "lore": "A múmia senhora é um governante ou sacerdote antigo, embalsamado por rituais sombrios para servir a seus deuses além da morte. Ela repousa em tumbas e pirâmides escondidas sob as areias do deserto, cercada de servos mortos-vivos e armadilhas. Seu coração é guardado em separado, e enquanto ele existir ela sempre retorna. Desperta com fúria quando sua tumba é profanada e persegue os ladrões sem descanso."
 },
 "miconideoAdulto": {
  "id": "miconideoAdulto",
  "tipo": "planta",
  "name": "Miconídeo Adulto",
  "nomeOriginal": "Myconid Adult",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1/2",
  "xp": 100,
  "abilities": {
   "str": 10,
   "dex": 10,
   "con": 12,
   "int": 10,
   "wis": 13,
   "cha": 7
  },
  "ac": 12,
  "acNote": "armadura natural",
  "maxHp": 22,
  "hpDice": "4d8+4",
  "speedFt": 20,
  "senses": {
   "passivePerception": 11,
   "darkvisionFt": 120
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Punho",
    "bonus": 2,
    "damage": "2d4",
    "type": "concussão",
    "reachFt": 5,
    "danoExtra": {
     "damage": "2d4",
     "type": "veneno"
    }
   }
  ],
  "acoesEspeciais": [
   {
    "nome": "Esporos Pacificadores",
    "porDia": 3,
    "tipo": "alvo",
    "alcanceFt": 5,
    "save": "con",
    "dc": 11,
    "condition": "atordoado",
    "rounds": 10,
    "repete": true
   }
  ],
  "traits": [
   "t_esporosDeComunhao",
   "t_esporosDeAlerta",
   "t_malDoSol"
  ],
  "blurb": "Fungo ambulante que golpeia com punhos venenosos e pode atordoar quem estiver colado nele com esporos calmantes. Frágil à luz do sol, mas alerta toda a colônia quando é ferido.",
  "lore": "Miconídeos são seres fúngicos pensantes que habitam as cavernas profundas do Subterrâneo, organizados em colônias pacíficas. Os adultos cuidam dos mais jovens e participam de comunhões em que mentes se unem por meio de esporos. Preferem evitar conflitos e usam seus esporos para acalmar intrusos antes de recorrer à força. Temem a luz do sol, que os enfraquece e pode matá-los."
 },
 "soberanoMiconideo": {
  "id": "soberanoMiconideo",
  "tipo": "planta",
  "name": "Soberano Miconídeo",
  "nomeOriginal": "Myconid Sovereign",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 12,
   "dex": 10,
   "con": 14,
   "int": 13,
   "wis": 15,
   "cha": 10
  },
  "ac": 13,
  "acNote": "armadura natural",
  "maxHp": 60,
  "hpDice": "8d10+16",
  "speedFt": 30,
  "senses": {
   "passivePerception": 12,
   "darkvisionFt": 120
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Punho",
    "bonus": 3,
    "damage": "3d4+1",
    "type": "concussão",
    "reachFt": 5,
    "danoExtra": {
     "damage": "3d4",
     "type": "veneno"
    }
   }
  ],
  "multiattack": {
   "count": 2
  },
  "acoesEspeciais": [
   {
    "nome": "Esporos Alucinógenos",
    "tipo": "alvo",
    "alcanceFt": 5,
    "save": "con",
    "dc": 12,
    "condition": "envenenado",
    "rounds": 10,
    "repete": true
   },
   {
    "nome": "Esporos Pacificadores",
    "tipo": "alvo",
    "alcanceFt": 5,
    "save": "con",
    "dc": 12,
    "condition": "atordoado",
    "rounds": 10,
    "repete": true
   }
  ],
  "traits": [
   "t_esporosAnimadores",
   "t_esporosDeComunhao",
   "t_esporosDeAflicao",
   "t_doencaDoSol"
  ],
  "blurb": "Combina socos venenosos com esporos que deixam o alvo atordoado ou incapacitado por alucinações. Também pode erguer cadáveres como servos de esporos.",
  "lore": "O soberano é o maior e mais antigo de um círculo de miconídeos, um fungo ambulante que governa sua colônia no Subterrâneo. Ele conduz as comunhões em que os fungos partilham pensamentos através de esporos. Costuma ser pacífico e contemplativo, mas defende sua comunidade com firmeza. Teme a luz do sol, que o enfraquece e pode matá-lo."
 },
 "brotoMiconideo": {
  "id": "brotoMiconideo",
  "tipo": "planta",
  "name": "Broto Miconídeo",
  "nomeOriginal": "Myconid Sprout",
  "fonte": "MM",
  "size": "pequeno",
  "level": 1,
  "cr": "0",
  "xp": 10,
  "abilities": {
   "str": 8,
   "dex": 10,
   "con": 10,
   "int": 8,
   "wis": 11,
   "cha": 5
  },
  "ac": 10,
  "maxHp": 7,
  "hpDice": "2d6",
  "speedFt": 10,
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 120
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Punho",
    "bonus": 1,
    "damage": "1d4-1",
    "type": "concussão",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d4",
     "type": "veneno"
    }
   }
  ],
  "traits": [
   "t_esporosDeAfinidade",
   "t_esporosDeAflicao",
   "t_enfermidadeSolar"
  ],
  "blurb": "Um fungo jovem e frágil que golpeia com punhos venenosos fracos; seu maior valor é alertar outros miconídeos e criar elos telepáticos.",
  "lore": "Brotos miconídeos são os membros mais novos de uma colônia de fungos que pensam e vivem nas profundezas da Umbreterna. Pequenos e lentos, ficam perto dos adultos e aprendem com eles a vida comunitária da colônia. São pacíficos por natureza e evitam conflitos sempre que podem. A luz do sol é mortal para eles, por isso raramente deixam a escuridão subterrânea."
 },
 "nalfeshnee": {
  "id": "nalfeshnee",
  "tipo": "corruptor",
  "name": "Nalfeshnee",
  "nomeOriginal": "Nalfeshnee",
  "fonte": "MM",
  "size": "grande",
  "level": 13,
  "cr": "13",
  "xp": 10000,
  "abilities": {
   "str": 21,
   "dex": 10,
   "con": 22,
   "int": 19,
   "wis": 12,
   "cha": 15
  },
  "ac": 18,
  "acNote": "armadura natural",
  "maxHp": 184,
  "hpDice": "16d10+96",
  "speedFt": 20,
  "flyFt": 30,
  "speeds": {
   "flyFt": 30
  },
  "senses": {
   "passivePerception": 11,
   "truesightFt": 120
  },
  "saves": [
   "con",
   "int",
   "wis",
   "cha"
  ],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "frio",
   "fogo",
   "elétrico",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "damageImmunities": [
   "veneno"
  ],
  "conditionImmunities": [
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 10,
    "damage": "5d10+5",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Garra",
    "bonus": 10,
    "damage": "3d6+5",
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
  "acoesEspeciais": [
   {
    "nome": "Aura de Horror (Recarga 5–6)",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "raio",
    "areaFt": 15,
    "save": "wis",
    "dc": 15,
    "condition": "amedrontado",
    "rounds": 10,
    "repete": true,
    "imunizaAoPassar": true
   },
   {
    "nome": "Teletransporte",
    "tipo": "teleporte",
    "alcanceFt": 120
   }
  ],
  "traits": [
   "resistenciaAMagia"
  ],
  "blurb": "Demônio corpulento que abre o combate com um clarão de luz multicolorida que amedronta quem está perto, depois morde e golpeia com garras de longo alcance. Teleporta-se com facilidade e resiste a magia.",
  "lore": "O nalfeshnee é um demônio enorme que mistura feições de javali e de macaco, com asas pequenas demais para o corpo pesado. Apesar da aparência grotesca, é astuto e se vê como estrategista e juiz entre os demônios do Abismo. Costuma comandar hordas menores e avaliar almas, decidindo o destino delas com crueldade. Em batalha prefere aterrorizar os inimigos antes de despedaçá-los."
 },
 "bruxaDaNoite": {
  "id": "bruxaDaNoite",
  "tipo": "corruptor",
  "name": "Bruxa da Noite",
  "nomeOriginal": "Night Hag",
  "fonte": "MM",
  "size": "médio",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 18,
   "dex": 15,
   "con": 16,
   "int": 16,
   "wis": 14,
   "cha": 16
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 112,
  "hpDice": "15d8+45",
  "speedFt": 30,
  "senses": {
   "passivePerception": 16,
   "darkvisionFt": 120
  },
  "saves": [],
  "skills": [
   "enganacao",
   "intuicao",
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "damageResistances": [
   "frio",
   "fogo",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "conditionImmunities": [
   "enfeitiçado"
  ],
  "attacks": [
   {
    "name": "Garras",
    "bonus": 7,
    "damage": "2d8+4",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "viagemPlanar",
    "raioDoEnfraquecimento",
    "sono",
    "detectarMagia",
    "misselMagico"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "viagemPlanar": 2,
    "raioDoEnfraquecimento": 2,
    "sono": 2
   },
   "aVontade": [
    "detectarMagia",
    "misselMagico"
   ],
   "cdPorMagia": {
    "viagemPlanar": 14,
    "raioDoEnfraquecimento": 14,
    "sono": 14,
    "detectarMagia": 14,
    "misselMagico": 14
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Forma Etérea",
    "tipo": "etereo"
   }
  ],
  "traits": [
   "t_mudarDeForma",
   "t_assombroDePesadelo",
   "resistenciaAMagia",
   "t_itensDaBruxaDaNoite"
  ],
  "blurb": "Corpo a corpo, rasga com garras (+7, 2d8+4 cortante) e alterna com mísseis mágicos e sono à distância; resiste a magia e a armas comuns não prateadas, e foge para o Plano Etéreo quando a luta vira contra ela.",
  "lore": "Ínferos de aparência de velha medonha, as bruxas da noite negociam almas corrompidas com os senhores dos Planos Inferiores. Invadem os sonhos de mortais adormecidos a partir do Plano Etéreo, consumindo-os noite após noite até a morte. Disfarçam-se como mulheres comuns para enganar e tentar suas vítimas rumo à maldade. Às vezes formam conciliábulos com outras bruxas, partilhando magias poderosas apesar da ganância de cada uma."
 },
 "pesadelo": {
  "id": "pesadelo",
  "tipo": "corruptor",
  "name": "Pesadelo",
  "nomeOriginal": "Nightmare",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 18,
   "dex": 15,
   "con": 16,
   "int": 10,
   "wis": 13,
   "cha": 15
  },
  "ac": 13,
  "acNote": "armadura natural",
  "maxHp": 68,
  "hpDice": "8d10+24",
  "speedFt": 60,
  "flyFt": 90,
  "speeds": {
   "flyFt": 90
  },
  "senses": {
   "passivePerception": 11
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "damageImmunities": [
   "fogo"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Cascos",
    "bonus": 6,
    "damage": "2d8+4",
    "type": "concussão",
    "reachFt": 5,
    "danoExtra": {
     "damage": "2d6",
     "type": "fogo"
    }
   }
  ],
  "acoesEspeciais": [
   {
    "nome": "Passo Etéreo",
    "tipo": "etereo"
   }
  ],
  "luzPropria": {
   "claro": 10,
   "penumbra": 10
  },
  "traits": [
   "t_concederResistenciaAFogo"
  ],
  "blurb": "Corcel infernal veloz que voa e esmaga inimigos com cascos em chamas, somando dano de fogo a cada golpe. Pode sumir para o Plano Etéreo levando aliados consigo.",
  "lore": "O pesadelo é um cavalo demoníaco de pelagem negra, com crina, cauda e cascos envoltos em fogo e olhos vermelhos que revelam uma mente maligna. Não nasce naturalmente: surge de um pégaso mutilado, cujas asas são arrancadas num ritual cruel de magia sombria que corrompe a criatura. Serve de montaria a demônios, diabos, liches, cavaleiros da morte e outros seres perversos. Quando convocado dos Planos Inferiores, só se mostra leal se receber um sacrifício digno para se alimentar."
 },
 "nicaloth": {
  "id": "nicaloth",
  "tipo": "corruptor",
  "name": "Nicaloth",
  "nomeOriginal": "Nycaloth",
  "fonte": "MM",
  "size": "grande",
  "level": 9,
  "cr": "9",
  "xp": 5000,
  "abilities": {
   "str": 20,
   "dex": 11,
   "con": 19,
   "int": 12,
   "wis": 10,
   "cha": 15
  },
  "ac": 18,
  "acNote": "armadura natural",
  "maxHp": 123,
  "hpDice": "13d10+52",
  "speedFt": 40,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60
  },
  "senses": {
   "passivePerception": 14,
   "blindsightFt": 60,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "intimidacao",
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "damageResistances": [
   "frio",
   "fogo",
   "elétrico",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "damageImmunities": [
   "ácido",
   "veneno"
  ],
  "conditionImmunities": [
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Garra",
    "bonus": 9,
    "damage": "2d6+5",
    "type": "cortante",
    "reachFt": 5,
    "onHit": {
     "save": "con",
     "dc": 16,
     "danoSeFalhar": {
      "damage": "2d4",
      "type": "cortante"
     },
     "metadeSePassar": false
    }
   },
   {
    "name": "Machado Grande",
    "bonus": 9,
    "damage": "2d12+5",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "escuridao",
    "detectarMagia",
    "dissiparMagia",
    "invisibilidade",
    "imagemEspelhada"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "aVontade": [
    "escuridao",
    "detectarMagia",
    "dissiparMagia",
    "invisibilidade",
    "imagemEspelhada"
   ]
  },
  "acoesEspeciais": [
   {
    "nome": "Teletransporte",
    "tipo": "teleporte",
    "alcanceFt": 60
   }
  ],
  "traits": [
   "resistenciaAMagia",
   "armasMagicas"
  ],
  "blurb": "Combatente alado que alterna golpes de machado e garras com teletransportes de até 18 m, surgindo onde menos se espera. Suas garras abrem feridas infernais que sangram cada vez mais até serem estancadas ou curadas por magia.",
  "lore": "Os nicaloths são yugoloths de elite, enormes demônios alados de pele esverdeada que servem como tropa de choque dos mercenários infernais. Vagam pelos planos inferiores vendendo seus serviços a quem pagar melhor, sem lealdade a nenhum lado da Guerra Sangrenta. Costumam comandar bandos de mezzoloths e atacam de surpresa, usando invisibilidade e escuridão para emboscar. Frios e brutais, valorizam apenas o contrato e a própria sobrevivência."
 },
 "polvo": {
  "id": "polvo",
  "tipo": "fera",
  "name": "Polvo",
  "nomeOriginal": "Octopus",
  "fonte": "MM",
  "size": "pequeno",
  "level": 1,
  "cr": "0",
  "xp": 10,
  "abilities": {
   "str": 4,
   "dex": 15,
   "con": 11,
   "int": 3,
   "wis": 10,
   "cha": 4
  },
  "ac": 12,
  "maxHp": 3,
  "hpDice": "1d6",
  "speedFt": 5,
  "speeds": {
   "swimFt": 30
  },
  "senses": {
   "passivePerception": 12,
   "darkvisionFt": 30
  },
  "saves": [],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Tentáculos",
    "bonus": 4,
    "damage": 1,
    "type": "concussão",
    "reachFt": 5,
    "onHit": {
     "semResistencia": true,
     "dc": 10,
     "escape": 10,
     "condition": "agarrado",
     "note": "é agarrado"
    }
   }
  ],
  "traits": [
   "nuvemDeTinta",
   "camuflagemSubmersa",
   "t_respiracaoAquatica"
  ],
  "blurb": "Agarra a presa com os tentáculos e, quando ameaçado, solta uma nuvem de tinta para fugir em disparada. Sozinho é fraco, mas difícil de encontrar debaixo d'água.",
  "lore": "O polvo é um animal marinho pequeno e esperto que vive entre rochas, recifes e destroços no fundo do mar. Muda de cor para se confundir com o ambiente e espera a presa passar por perto. Prefere fugir a lutar, escondendo-se atrás da tinta escura que expele. Magos às vezes o escolhem como familiar em regiões costeiras."
 },
 "oni": {
  "id": "oni",
  "tipo": "gigante",
  "name": "Oni",
  "nomeOriginal": "Oni",
  "fonte": "MM",
  "size": "grande",
  "level": 5,
  "cr": "7",
  "xp": 2900,
  "abilities": {
   "str": 19,
   "dex": 11,
   "con": 16,
   "int": 14,
   "wis": 12,
   "cha": 15
  },
  "ac": 16,
  "acNote": "cota de malha",
  "maxHp": 110,
  "hpDice": "13d10+39",
  "speedFt": 30,
  "flyFt": 30,
  "speeds": {
   "flyFt": 30
  },
  "senses": {
   "passivePerception": 14,
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
   "percepcao"
  ],
  "expertise": [
   "enganacao"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Garra (só na forma de oni)",
    "bonus": 7,
    "damage": "1d8+4",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Glaive",
    "bonus": 7,
    "damage": "2d10+4",
    "type": "cortante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "1d10+4",
     "type": "cortante"
    }
   }
  ],
  "multiattack": {
   "count": 2
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "enfeiticarPessoa",
    "coneDeFrio",
    "formaGasosa",
    "sono",
    "escuridao",
    "invisibilidade"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "enfeiticarPessoa": 1,
    "coneDeFrio": 1,
    "formaGasosa": 1,
    "sono": 1
   },
   "aVontade": [
    "escuridao",
    "invisibilidade"
   ],
   "cdPorMagia": {
    "enfeiticarPessoa": 13,
    "coneDeFrio": 13,
    "formaGasosa": 13,
    "sono": 13,
    "escuridao": 13,
    "invisibilidade": 13
   }
  },
  "regeneracao": {
   "pv": 10,
   "bloqueia": []
  },
  "traits": [
   "t_mudarDeForma",
   "armasMagicas",
   "regeneracaoDoLivro"
  ],
  "blurb": "Gigante astuto que golpeia com uma glaive de alcance 3 m e regenera 10 PV por turno; usa invisibilidade, escuridão e cone de frio para emboscar e desorientar o grupo.",
  "lore": "O oni é um ogro de aparência demoníaca, de pele azul ou verde, chifres curtos e dentes negros, e tem um apetite especial por bebês humanos. De dia, ele se disfarça de viajante ou lenhador e circula por vilas escolhendo suas futuras vítimas. Quando a noite cai, trai a confiança que conquistou e leva embora quem quer devorar. Também chamado de mago ogro por sua magia inata, costuma servir bruxas e magos malignos em troca de itens mágicos ou de um covil luxuoso e bem protegido."
 },
 "olhoDeGruumshOrc": {
  "id": "olhoDeGruumshOrc",
  "tipo": "humanoide",
  "name": "Olho de Gruumsh Orc",
  "nomeOriginal": "Orc Eye of Gruumsh",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 16,
   "dex": 12,
   "con": 17,
   "int": 9,
   "wis": 13,
   "cha": 12
  },
  "ac": 16,
  "acNote": "cota de anéis e escudo",
  "maxHp": 45,
  "hpDice": "6d8+18",
  "speedFt": 30,
  "senses": {
   "passivePerception": 11,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "intimidacao",
   "religiao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Lança",
    "bonus": 5,
    "damage": "1d6+3",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d8",
     "type": "perfurante"
    },
    "rangeFt": 20,
    "longRangeFt": 60
   }
  ],
  "spellcasting": {
   "ability": "wis",
   "cantrips": [
    "orientacao",
    "resistencia",
    "taumaturgia"
   ],
   "prepared": [
    "bencao",
    "comando",
    "augurio",
    "armaEspiritual"
   ],
   "slots": [
    0,
    4,
    2
   ],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "cdPorMagia": {
    "orientacao": 11,
    "resistencia": 11,
    "taumaturgia": 11,
    "bencao": 11,
    "comando": 11,
    "augurio": 11,
    "armaEspiritual": 11
   }
  },
  "traits": [
   "agressivo",
   "t_furiaDeGruumsh"
  ],
  "blurb": "Sacerdote orc que avança com fúria e golpeia com a lança abençoada, causando dano extra em cada acerto. Apoia o bando com bênção, comando e uma arma espiritual flutuante.",
  "lore": "Os Olhos de Gruumsh são orcs que arrancaram o próprio olho em devoção ao deus caolho da tribo. Em troca, recebem dele poderes divinos e passam a servir como clérigos e conselheiros do chefe. Acompanham os bandos em ataques por montanhas, florestas, pântanos e até no Subterrâneo. Pregam a guerra sem trégua e são os primeiros a incitar os guerreiros ao massacre."
 },
 "chefeDeGuerraOrc": {
  "id": "chefeDeGuerraOrc",
  "tipo": "humanoide",
  "name": "Chefe de Guerra Orc",
  "nomeOriginal": "Orc War Chief",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "4",
  "xp": 1100,
  "abilities": {
   "str": 18,
   "dex": 12,
   "con": 18,
   "int": 11,
   "wis": 11,
   "cha": 16
  },
  "ac": 16,
  "acNote": "cota de malha",
  "maxHp": 93,
  "hpDice": "11d8+44",
  "speedFt": 30,
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 60
  },
  "saves": [
   "str",
   "con",
   "wis"
  ],
  "skills": [
   "intimidacao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Machado Grande",
    "bonus": 6,
    "damage": "1d12+4",
    "type": "cortante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d8",
     "type": "cortante"
    }
   },
   {
    "name": "Lança",
    "bonus": 6,
    "damage": "1d6+4",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d8",
     "type": "perfurante"
    },
    "rangeFt": 20,
    "longRangeFt": 60
   }
  ],
  "multiattack": {
   "count": 2
  },
  "acoesEspeciais": [
   {
    "nome": "Grito de Guerra (1/Dia)",
    "porDia": 1,
    "tipo": "gritoDeGuerra",
    "raioFt": 30
   }
  ],
  "traits": [
   "agressivo",
   "t_furiaDeGruumsh"
  ],
  "blurb": "Avança com ação bônus sobre o inimigo e desfere dois golpes de machado grande reforçados pela fúria de Gruumsh. Uma vez por dia, seu grito de guerra dá vantagem aos aliados próximos.",
  "lore": "O chefe de guerra é o orc mais forte e cruel de sua tribo, que conquistou o posto derrubando rivais. Acredita-se abençoado por Gruumsh, o deus caolho dos orcs, e luta com fúria sagrada. Lidera bandos saqueadores em colinas, florestas, pântanos, montanhas e até no Subterrâneo. Seus guerreiros o seguem por medo e por sede de pilhagem, e ele está sempre na linha de frente do ataque."
 },
 "orog": {
  "id": "orog",
  "tipo": "humanoide",
  "name": "Orog",
  "nomeOriginal": "Orog",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 18,
   "dex": 12,
   "con": 18,
   "int": 12,
   "wis": 11,
   "cha": 12
  },
  "ac": 18,
  "acNote": "armadura de placas",
  "maxHp": 42,
  "hpDice": "5d8+20",
  "speedFt": 30,
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "intimidacao",
   "sobrevivencia"
  ],
  "expertise": [
   "intimidacao"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Machado Grande",
    "bonus": 6,
    "damage": "1d12+4",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Azagaia",
    "bonus": 6,
    "damage": "1d6+4",
    "type": "perfurante",
    "reachFt": 5,
    "rangeFt": 30,
    "longRangeFt": 120
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Machado Grande",
    "Machado Grande"
   ]
  },
  "traits": [
   "agressivo"
  ],
  "blurb": "Guerreiro orc de elite em armadura pesada que avança como ação bônus e desfere dois golpes de machado grande por turno. Difícil de ferir e muito perigoso no corpo a corpo.",
  "lore": "Orogs nascem da união entre orcs e orcas, abençoados por Gruumsh com força e astúcia acima do comum. Servem como tropa de choque e guardas de elite dos chefes tribais, muitas vezes liderando ataques. Vivem em cavernas do Subterrâneo, montanhas, florestas e ermos gelados, onde as tribos orcs se instalam. São disciplinados em batalha, mas tão cruéis e sedentos por destruição quanto seus parentes."
 },
 "coruja": {
  "id": "coruja",
  "tipo": "fera",
  "name": "Coruja",
  "nomeOriginal": "Owl",
  "fonte": "MM",
  "size": "miúdo",
  "level": 1,
  "cr": "0",
  "xp": 10,
  "abilities": {
   "str": 3,
   "dex": 13,
   "con": 8,
   "int": 2,
   "wis": 12,
   "cha": 7
  },
  "ac": 11,
  "maxHp": 1,
  "hpDice": "1d4-1",
  "speedFt": 5,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60
  },
  "senses": {
   "passivePerception": 13,
   "darkvisionFt": 120
  },
  "saves": [],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Garras",
    "bonus": 3,
    "damage": 1,
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "traits": [
   "voaSemProvocar",
   "audicaoEVisaoApuradas"
  ],
  "blurb": "Ave noturna minúscula que mergulha, arranha com as garras e se afasta voando sem sofrer ataques de oportunidade. Quase inofensiva em combate, mas excelente vigia graças aos sentidos apurados.",
  "lore": "A coruja é uma ave de rapina silenciosa, comum em florestas e regiões geladas. Caça à noite, guiada por uma visão no escuro de longo alcance e por uma audição finíssima. Prefere observar de galhos altos e evita confrontos com criaturas maiores. Magos e conjuradores costumam escolhê-la como familiar pela discrição e pela capacidade de vigiar."
 },
 "pantera": {
  "id": "pantera",
  "tipo": "fera",
  "name": "Pantera",
  "nomeOriginal": "Panther",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 14,
   "dex": 15,
   "con": 10,
   "int": 3,
   "wis": 14,
   "cha": 7
  },
  "ac": 12,
  "maxHp": 13,
  "hpDice": "3d8",
  "speedFt": 50,
  "speeds": {
   "climbFt": 40
  },
  "senses": {
   "passivePerception": 14
  },
  "saves": [],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "furtividade"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 4,
    "damage": "1d6+2",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Garra",
    "bonus": 4,
    "damage": "1d4+2",
    "type": "cortante",
    "reachFt": 5,
    "investida": {
     "pes": 20,
     "save": "str",
     "dc": 12,
     "mordeSeCair": "Mordida"
    }
   }
  ],
  "traits": [
   "keenSmell"
  ],
  "blurb": "Felino furtivo que avança em linha reta e salta sobre a presa, podendo derrubá-la com a garra e emendar uma mordida. Rápida e boa escaladora, costuma atacar de emboscada.",
  "lore": "A pantera é um grande felino caçador de pelagem escura, comum em florestas, colinas e campos abertos. Prefere caçar sozinha, espreitando entre a vegetação ou do alto das árvores. Seu faro apurado a ajuda a seguir presas por longas distâncias. Quando ataca, investe de surpresa e tenta derrubar a vítima antes que ela reaja."
 },
 "pegaso": {
  "id": "pegaso",
  "tipo": "celestial",
  "name": "Pégaso",
  "nomeOriginal": "Pegasus",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 18,
   "dex": 15,
   "con": 16,
   "int": 10,
   "wis": 15,
   "cha": 13
  },
  "ac": 12,
  "maxHp": 59,
  "hpDice": "7d10+21",
  "speedFt": 60,
  "flyFt": 90,
  "speeds": {
   "flyFt": 90
  },
  "senses": {
   "passivePerception": 16
  },
  "saves": [
   "dex",
   "wis",
   "cha"
  ],
  "skills": [
   "percepcao"
  ],
  "expertise": [
   "percepcao"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Cascos",
    "bonus": 6,
    "damage": "2d6+4",
    "type": "concussão",
    "reachFt": 5
   }
  ],
  "traits": [],
  "blurb": "Cavalo alado veloz que voa a 27 m por turno e golpeia com os cascos causando dano de concussão. Difícil de alcançar e com percepção aguçada, raramente é pego de surpresa.",
  "lore": "Pégasos são cavalos brancos de asas que passam quase toda a vida nos céus, pousando só para beber em fontes e lagos limpos e fugindo ao menor sinal de outra criatura. Têm inteligência comparável à de um humanoide, por isso não podem ser domados à força; é preciso convencê-los a servir, e apenas criaturas de bom coração conseguem. Quando aceitam um cavaleiro, criam com ele um laço que dura a vida inteira. Vêm das Clareiras Olímpicas de Arbórea, onde servem de montaria aos deuses élficos, que às vezes os enviam ao Plano Material para socorrer quem precisa. Formam casais para sempre e fazem ninhos em lugares de difícil acesso."
 },
 "pentadrone": {
  "id": "pentadrone",
  "tipo": "constructo",
  "name": "Pentadrone",
  "nomeOriginal": "Pentadrone",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 15,
   "dex": 14,
   "con": 12,
   "int": 10,
   "wis": 10,
   "cha": 13
  },
  "ac": 16,
  "acNote": "armadura natural",
  "maxHp": 32,
  "hpDice": "5d10+5",
  "speedFt": 40,
  "senses": {
   "passivePerception": 14,
   "truesightFt": 120
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
    "name": "Braço",
    "bonus": 4,
    "damage": "1d6+2",
    "type": "concussão",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 5
  },
  "acoesEspeciais": [
   {
    "nome": "Gás Paralisante",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 30,
    "save": "con",
    "dc": 11,
    "condition": "paralisado",
    "rounds": 10,
    "repete": true
   }
  ],
  "traits": [
   "t_menteAxiomatica",
   "t_desintegracao"
  ],
  "blurb": "Golpeia com cinco braços numa única investida e expele uma nuvem cônica de gás capaz de paralisar grupos inteiros. Sua visão verdadeira torna inútil tentar se esconder dele.",
  "lore": "O pentadrone é um modron de cinco braços em forma de estrela, encarregado de supervisionar a mão de obra das castas inferiores em Mechanus. Cumpre ordens com rigor absoluto e mantém a ordem entre os modrons mais simples. Quando destruído, seu corpo vira pó e deixa para trás apenas o que carregava. Às vezes uma unidade se corrompe por desgaste ou contato com o caos e passa a agir por conta própria, tornando-se alvo de caça pelos demais modrons."
 },
 "peryton": {
  "id": "peryton",
  "tipo": "monstruosidade",
  "name": "Peryton",
  "nomeOriginal": "Peryton",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 16,
   "dex": 12,
   "con": 13,
   "int": 9,
   "wis": 12,
   "cha": 10
  },
  "ac": 13,
  "acNote": "armadura natural",
  "maxHp": 33,
  "hpDice": "6d8+6",
  "speedFt": 20,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60
  },
  "senses": {
   "passivePerception": 15
  },
  "saves": [],
  "skills": [
   "percepcao"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageResistances": [
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Chifrada",
    "bonus": 5,
    "damage": "1d8+3",
    "type": "perfurante",
    "reachFt": 5,
    "investida": {
     "pes": 30,
     "dano": "2d8",
     "tipo": "perfurante",
     "soVoando": true
    }
   },
   {
    "name": "Garras",
    "bonus": 5,
    "damage": "2d4+3",
    "type": "perfurante",
    "reachFt": 5,
    "investida": {
     "pes": 30,
     "dano": "2d8",
     "tipo": "perfurante",
     "soVoando": true
    }
   }
  ],
  "multiattack": {
   "count": 1,
   "sequence": [
    "Chifrada"
   ]
  },
  "traits": [
   "voaSemProvocar",
   "keenSightSmell"
  ],
  "blurb": "Mergulha do alto contra o alvo para causar dano extra e se afasta voando sem sofrer ataques de oportunidade. Armas comuns pouco o ferem, e ele luta até a morte contra humanoides.",
  "lore": "Monstro com corpo e asas de ave de rapina e cabeça de cervo, cuja sombra tem forma humana. Faz ninhos em cavernas altas e cristas de montanha e caça nos vales e estradas abaixo. Prefere humanoides, sobretudo elfos e humanos, e arranca o coração das vítimas para levá-lo ao ninho, pois as fêmeas precisam comê-lo para se reproduzir. Quando ataca, persegue a presa com obstinação e, se for repelido, volta a espreitá-la de longe. Vilarejos montanheses costumam contratar aventureiros para destruir seus ninhos."
 },
 "aranhaDefasadora": {
  "id": "aranhaDefasadora",
  "tipo": "monstruosidade",
  "name": "Aranha Defasadora",
  "nomeOriginal": "Phase Spider",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 15,
   "dex": 15,
   "con": 12,
   "int": 6,
   "wis": 10,
   "cha": 6
  },
  "ac": 13,
  "acNote": "armadura natural",
  "maxHp": 32,
  "hpDice": "5d10+5",
  "speedFt": 30,
  "speeds": {
   "climbFt": 30
  },
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "furtividade"
  ],
  "expertise": [
   "furtividade"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 4,
    "damage": "1d10+2",
    "type": "perfurante",
    "reachFt": 5,
    "onHit": {
     "save": "con",
     "dc": 11,
     "condition": "envenenado",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "traits": [
   "saltoEtereo",
   "spiderClimb",
   "webWalker"
  ],
  "blurb": "Some no Plano Etéreo e reaparece ao lado da vítima para morder com um veneno poderoso, sumindo de novo logo em seguida. Quem cai a 0 PV pelo veneno fica paralisado por uma hora.",
  "lore": "Esta aranha gigante tem o dom mágico de atravessar a fronteira entre o Plano Material e o Plano Etéreo. Ela se desloca pelo plano etéreo sem ser vista e volta ao mundo físico onde quiser, como se teleportasse. Prefere emboscadas: surge do nada, crava as presas e desaparece antes que a presa reaja. Pode ser encontrada em quase qualquer lugar, de florestas e desertos ao Subterrâneo e até cidades."
 },
 "perfurador": {
  "id": "perfurador",
  "tipo": "monstruosidade",
  "name": "Perfurador",
  "nomeOriginal": "Piercer",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1/2",
  "xp": 100,
  "abilities": {
   "str": 10,
   "dex": 13,
   "con": 16,
   "int": 1,
   "wis": 7,
   "cha": 3
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 22,
  "hpDice": "3d8+9",
  "speedFt": 5,
  "speeds": {
   "climbFt": 5
  },
  "senses": {
   "passivePerception": 8,
   "blindsightFt": 30,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "furtividade"
  ],
  "expertise": [
   "furtividade"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Queda",
    "bonus": 3,
    "damage": "1d6",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "traits": [
   "aparenciaFalsa",
   "spiderClimb"
  ],
  "blurb": "Fica imóvel no teto como uma estalactite e despenca sobre quem passa embaixo, causando mais dano quanto maior a queda. Se errar, fica no chão, lento e vulnerável.",
  "lore": "O perfurador é a forma jovem do cordoador e vive grudado no teto de cavernas e túneis do Subterrâneo. Sua carapaça pétrea o faz parecer uma rocha comum, enquanto um corpo mole de lesma o leva devagar pelas paredes até a posição ideal. Percebe calor e ruído, espera a presa passar e se solta em silêncio. Costuma caçar em grupos que caem juntos, e os demais rastejam até o cadáver para dividir a refeição; caído, solta um muco fétido que afasta predadores."
 },
 "diaboDasProfundezas": {
  "id": "diaboDasProfundezas",
  "tipo": "corruptor",
  "name": "Diabo das Profundezas",
  "nomeOriginal": "Pit Fiend",
  "fonte": "MM",
  "size": "grande",
  "level": 17,
  "cr": "20",
  "xp": 25000,
  "abilities": {
   "str": 26,
   "dex": 14,
   "con": 24,
   "int": 22,
   "wis": 18,
   "cha": 24
  },
  "ac": 19,
  "acNote": "armadura natural",
  "maxHp": 300,
  "hpDice": "24d10+168",
  "speedFt": 30,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60
  },
  "senses": {
   "passivePerception": 14,
   "truesightFt": 120
  },
  "saves": [
   "dex",
   "con",
   "wis"
  ],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "frio",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "damageImmunities": [
   "fogo",
   "veneno"
  ],
  "conditionImmunities": [
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 14,
    "damage": "4d6+8",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "6d6",
     "type": "veneno"
    },
    "onHit": {
     "save": "con",
     "dc": 21,
     "condition": "envenenado",
     "rounds": 1,
     "repete": true
    }
   },
   {
    "name": "Garra",
    "bonus": 14,
    "damage": "2d8+8",
    "type": "cortante",
    "reachFt": 10
   },
   {
    "name": "Maça",
    "bonus": 14,
    "damage": "2d6+8",
    "type": "concussão",
    "reachFt": 10,
    "danoExtra": {
     "damage": "6d6",
     "type": "fogo"
    }
   },
   {
    "name": "Cauda",
    "bonus": 14,
    "damage": "3d10+8",
    "type": "concussão",
    "reachFt": 10
   }
  ],
  "multiattack": {
   "count": 4,
   "sequence": [
    "Mordida",
    "Garra",
    "Maça",
    "Cauda"
   ]
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "imobilizarMonstro",
    "muralhaDeFogo",
    "detectarMagia",
    "bolaDeFogo"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "imobilizarMonstro": 3,
    "muralhaDeFogo": 3
   },
   "aVontade": [
    "detectarMagia",
    "bolaDeFogo"
   ],
   "cdPorMagia": {
    "imobilizarMonstro": 21,
    "muralhaDeFogo": 21,
    "detectarMagia": 21,
    "bolaDeFogo": 21
   }
  },
  "aura": {
   "raioFt": 20,
   "quando": "inicioDoAlvo",
   "save": "wis",
   "dc": 21,
   "condition": "amedrontado",
   "imunizaAoPassar": true
  },
  "traits": [
   "aura",
   "resistenciaAMagia",
   "armasMagicas"
  ],
  "blurb": "Um general infernal que despeja quatro ataques por turno, com mordida venenosa que impede a cura e maça flamejante, enquanto sua aura de medo paralisa a coragem de quem se aproxima. Ainda lança bolas de fogo à vontade e imobiliza heróis com magia.",
  "lore": "Os diabos das profundezas são a elite da hierarquia dos Nove Infernos, servindo como generais e conselheiros dos arquiduques. Enormes, alados e cobertos de escamas, carregam uma maça e exalam uma presença opressiva. São estrategistas frios e arrogantes, que planejam guerras e intrigas com séculos de antecedência. Raramente lutam sem antes calcular cada vantagem, e comandam legiões de diabos menores com punho de ferro."
 },
 "pixie": {
  "id": "pixie",
  "tipo": "feérico",
  "name": "Pixie",
  "nomeOriginal": "Pixie",
  "fonte": "MM",
  "size": "miúdo",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 2,
   "dex": 20,
   "con": 8,
   "int": 10,
   "wis": 14,
   "cha": 15
  },
  "ac": 15,
  "maxHp": 1,
  "hpDice": "1d4-1",
  "speedFt": 10,
  "flyFt": 30,
  "speeds": {
   "flyFt": 30
  },
  "senses": {
   "passivePerception": 14
  },
  "saves": [],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "confusao",
    "luzesDancantes",
    "detectarBemMal",
    "detectarPensamentos",
    "dissiparMagia",
    "emaranhar",
    "voo",
    "forcaFantasmagorica",
    "metamorfose",
    "sono",
    "arteDruidica"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "confusao": 1,
    "luzesDancantes": 1,
    "detectarBemMal": 1,
    "detectarPensamentos": 1,
    "dissiparMagia": 1,
    "emaranhar": 1,
    "voo": 1,
    "forcaFantasmagorica": 1,
    "metamorfose": 1,
    "sono": 1
   },
   "aVontade": [
    "arteDruidica"
   ],
   "cdPorMagia": {
    "confusao": 12,
    "luzesDancantes": 12,
    "detectarBemMal": 12,
    "detectarPensamentos": 12,
    "dissiparMagia": 12,
    "emaranhar": 12,
    "voo": 12,
    "forcaFantasmagorica": 12,
    "metamorfose": 12,
    "sono": 12,
    "arteDruidica": 12
   }
  },
  "traits": [
   "invisivelAVontade",
   "resistenciaAMagia"
  ],
  "blurb": "Não carrega armas: fica invisível e usa magia inata (CD 12) para confundir, enredar, adormecer ou transformar inimigos. É frágil, com apenas 1 PV, mas difícil de encontrar e de afetar com magia.",
  "lore": "Fadas minúsculas, com cerca de 30 cm, parecidas com elfos e dotadas de asas cintilantes de libélula ou borboleta. Vivem em clareiras de florestas, no Agrestia das Fadas e no Plano Material, onde ajudam a mudar as estações. São curiosas e tímidas: observam viajantes de longe, pregam peças inofensivas e só se aproximam de quem se mostra gentil. Detestam violência e preferem fugir a lutar, e seu pó mágico desperta a cobiça de magos e monstros."
 },
 "planetar": {
  "id": "planetar",
  "tipo": "celestial",
  "name": "Planetar",
  "nomeOriginal": "Planetar",
  "fonte": "MM",
  "size": "grande",
  "level": 13,
  "cr": "16",
  "xp": 15000,
  "abilities": {
   "str": 24,
   "dex": 20,
   "con": 24,
   "int": 19,
   "wis": 22,
   "cha": 25
  },
  "ac": 19,
  "acNote": "armadura natural",
  "maxHp": 200,
  "hpDice": "16d10+112",
  "speedFt": 40,
  "flyFt": 120,
  "speeds": {
   "flyFt": 120
  },
  "senses": {
   "passivePerception": 21,
   "truesightFt": 120
  },
  "saves": [
   "con",
   "wis",
   "cha"
  ],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "damageResistances": [
   "radiante",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "conditionImmunities": [
   "enfeitiçado",
   "exausto",
   "amedrontado"
  ],
  "attacks": [
   {
    "name": "Espada Grande",
    "bonus": 12,
    "damage": "4d6+7",
    "type": "cortante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "5d8",
     "type": "radiante"
    }
   }
  ],
  "multiattack": {
   "count": 2
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "barreiraDeLaminas",
    "dissiparOBemEOMal",
    "golpeDeChama",
    "reviverOsMortos",
    "comunhao",
    "pragaDeInsetos",
    "detectarBemMal",
    "invisibilidade"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "barreiraDeLaminas": 3,
    "dissiparOBemEOMal": 3,
    "golpeDeChama": 3,
    "reviverOsMortos": 3,
    "comunhao": 1,
    "pragaDeInsetos": 1
   },
   "aVontade": [
    "detectarBemMal",
    "invisibilidade"
   ],
   "cdPorMagia": {
    "barreiraDeLaminas": 20,
    "dissiparOBemEOMal": 20,
    "golpeDeChama": 20,
    "reviverOsMortos": 20,
    "comunhao": 20,
    "pragaDeInsetos": 20,
    "detectarBemMal": 20,
    "invisibilidade": 20
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Toque Curativo",
    "porDia": 4,
    "tipo": "cura",
    "dados": "6d8+3"
   }
  ],
  "traits": [
   "armasMagicas",
   "t_percepcaoDivina",
   "resistenciaAMagia"
  ],
  "blurb": "Gigante alado que golpeia duas vezes com uma espada grande carregada de energia radiante, causando dano brutal, e ainda cura aliados e conjura barreiras de lâminas e colunas de chamas. Resiste à magia e não se deixa enganar.",
  "lore": "O planetar é um anjo poderoso, moldado da essência astral de um deus bondoso para servir como a arma viva dessa divindade. Tem pele verde opalescente, corpo musculoso e sem pelos, asas de penas brancas e porta uma espada enorme com elegância. Pode trazer chuva a uma terra seca ou soltar pragas sobre plantações, conforme a vontade divina. Nenhuma mentira escapa a seus ouvidos, e ele adora missões contra demônios e diabos. Não come, não bebe nem dorme, e quando auxilia mortais costuma assumir o comando."
 },
 "plesiossauro": {
  "id": "plesiossauro",
  "tipo": "fera",
  "name": "Plesiossauro",
  "nomeOriginal": "Plesiosaurus",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 18,
   "dex": 15,
   "con": 16,
   "int": 2,
   "wis": 12,
   "cha": 5
  },
  "ac": 13,
  "acNote": "armadura natural",
  "maxHp": 68,
  "hpDice": "8d10+24",
  "speedFt": 20,
  "speeds": {
   "swimFt": 40
  },
  "senses": {
   "passivePerception": 13
  },
  "saves": [],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 6,
    "damage": "3d6+4",
    "type": "perfurante",
    "reachFt": 10
   }
  ],
  "traits": [],
  "blurb": "Predador aquático de pescoço longo que ataca com mordidas de longo alcance (3 m), causando dano perfurante pesado. Muito mais perigoso na água, onde nada rápido, do que em terra.",
  "lore": "O plesiossauro é um réptil marinho de grande porte, com corpo largo, nadadeiras potentes e um pescoço comprido que termina em mandíbulas cheias de dentes. Habita mares, lagos profundos e águas costeiras, muitas vezes em regiões perdidas onde criaturas pré-históricas ainda sobrevivem. Caça peixes e qualquer presa que se aproxime demais da superfície, emergindo de surpresa. Pode passar longos períodos submerso e raramente se arrisca em terra firme, onde se move com lentidão."
 },
 "cobraVenenosa": {
  "id": "cobraVenenosa",
  "tipo": "fera",
  "name": "Cobra Venenosa",
  "nomeOriginal": "Poisonous Snake",
  "fonte": "MM",
  "size": "miúdo",
  "level": 1,
  "cr": "1/8",
  "xp": 25,
  "abilities": {
   "str": 2,
   "dex": 16,
   "con": 11,
   "int": 1,
   "wis": 10,
   "cha": 3
  },
  "ac": 13,
  "maxHp": 2,
  "hpDice": "1d4",
  "speedFt": 30,
  "speeds": {
   "swimFt": 30
  },
  "senses": {
   "passivePerception": 10,
   "blindsightFt": 10
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 5,
    "damage": "2d4",
    "type": "veneno",
    "reachFt": 5
   }
  ],
  "traits": [],
  "blurb": "Pequena e ágil, se aproxima rápido e morde para injetar veneno, que pode causar bem mais dano que a própria picada. Frágil, cai com qualquer golpe.",
  "lore": "Serpente miúda encontrada em campos, florestas, pântanos, colinas, desertos e litorais. Nada tão bem quanto rasteja e percebe presas próximas mesmo sem enxergá-las. Costuma evitar criaturas grandes, atacando apenas quando acuada ou pisada. Conjuradores às vezes a escolhem como familiar."
 },
 "ursoPolar": {
  "id": "ursoPolar",
  "tipo": "fera",
  "name": "Urso Polar",
  "nomeOriginal": "Polar Bear",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 20,
   "dex": 10,
   "con": 16,
   "int": 2,
   "wis": 13,
   "cha": 7
  },
  "ac": 12,
  "acNote": "armadura natural",
  "maxHp": 42,
  "hpDice": "5d10+15",
  "speedFt": 40,
  "speeds": {
   "swimFt": 30
  },
  "senses": {
   "passivePerception": 13
  },
  "saves": [],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 7,
    "damage": "1d8+5",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Garras",
    "bonus": 7,
    "damage": "2d6+5",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Mordida",
    "Garras"
   ]
  },
  "traits": [
   "keenSmell"
  ],
  "blurb": "Fera enorme e muito forte que avança sobre um alvo e o castiga com mordida e garras no mesmo turno, causando até 21 de dano por rodada.",
  "lore": "O urso polar é um predador gigantesco das terras geladas e dos mares cobertos de gelo. Nada bem e caça focas e outras presas em águas congelantes, farejando-as a grandes distâncias. Costuma andar sozinho e evita intrusos, mas fica perigoso quando está faminto ou quando alguém se aproxima de seus filhotes. Alguns vivem em cavernas geladas que descem até o Subterrâneo."
 },
 "poltergeist": {
  "id": "poltergeist",
  "tipo": "morto-vivo",
  "name": "Poltergeist",
  "nomeOriginal": "Poltergeist",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 1,
   "dex": 14,
   "con": 11,
   "int": 10,
   "wis": 10,
   "cha": 11
  },
  "ac": 12,
  "maxHp": 22,
  "hpDice": "5d8",
  "speedFt": 0,
  "flyFt": 50,
  "hover": true,
  "speeds": {
   "flyFt": 50
  },
  "senses": {
   "passivePerception": 10,
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
   "trovejante",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "damageImmunities": [
   "necrótico",
   "veneno"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "exausto",
   "agarrado",
   "paralisado",
   "petrificado",
   "envenenado",
   "caido",
   "contido",
   "inconsciente"
  ],
  "attacks": [
   {
    "name": "Pancada Energética",
    "bonus": 4,
    "damage": "3d6",
    "type": "energético",
    "reachFt": 5
   }
  ],
  "acoesEspeciais": [
   {
    "nome": "Impulso Telecinético",
    "tipo": "telecinese"
   }
  ],
  "traits": [
   "incorporealMovement",
   "sunlightSensitivity",
   "invisivelAVontade"
  ],
  "blurb": "Espírito invisível que atravessa paredes e golpeia com força pura, além de arremessar criaturas e objetos pelo ar com telecinesia. Difícil de enxergar e de ferir com armas comuns.",
  "lore": "O poltergeist é a alma perturbada de alguém que morreu sem entender como. Preso entre a confusão e a fúria, ele permanece invisível nos lugares onde viveu, seja em cidades ou nas profundezas do Subterrâneo. Sua mente despedaçada se manifesta como força telecinética, que ele usa para atirar móveis, pedras e pessoas. Evita a luz do sol, que o deixa desorientado."
 },
 "ponei": {
  "id": "ponei",
  "tipo": "fera",
  "name": "Pônei",
  "nomeOriginal": "Pony",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1/8",
  "xp": 25,
  "abilities": {
   "str": 15,
   "dex": 10,
   "con": 13,
   "int": 2,
   "wis": 11,
   "cha": 7
  },
  "ac": 10,
  "maxHp": 11,
  "hpDice": "2d8+2",
  "speedFt": 40,
  "senses": {
   "passivePerception": 10
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Cascos",
    "bonus": 4,
    "damage": "2d4+2",
    "type": "concussão",
    "reachFt": 5
   }
  ],
  "traits": [],
  "blurb": "Montaria pequena e resistente que só briga quando acuada, dando coices fortes com os cascos.",
  "lore": "O pônei é um cavalo de porte reduzido, robusto e de pernas curtas, criado em vilas e cidades. Serve como montaria para halflings e anões ou para puxar carroças leves. É dócil e trabalhador, mas pode reagir com coices quando assustado. Aguenta longas jornadas comendo pouco."
 },
 "pseudodragao": {
  "id": "pseudodragao",
  "tipo": "dragão",
  "name": "Pseudodragão",
  "nomeOriginal": "Pseudodragon",
  "fonte": "MM",
  "size": "miúdo",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 6,
   "dex": 15,
   "con": 13,
   "int": 10,
   "wis": 12,
   "cha": 10
  },
  "ac": 13,
  "maxHp": 7,
  "hpDice": "2d4+2",
  "speedFt": 15,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60
  },
  "senses": {
   "passivePerception": 13,
   "blindsightFt": 10,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 4,
    "damage": "1d4+2",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Ferroada",
    "bonus": 4,
    "damage": "1d4+2",
    "type": "perfurante",
    "reachFt": 5,
    "onHit": {
     "save": "con",
     "dc": 11,
     "condition": "envenenado",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "traits": [
   "audicaoEVisaoApuradas",
   "resistenciaAMagia",
   "t_telepatiaLimitada"
  ],
  "blurb": "Pequeno e veloz no ar, morde e ferroa com a cauda; o veneno da ferroada (CD 11 de Constituição) envenena por uma hora e pode derrubar o alvo inconsciente.",
  "lore": "O pseudodragão é um dragãozinho de escamas castanho-avermelhadas que vive escondido em ocos de árvores e pequenas cavernas. Apesar da aparência de dragão vermelho em miniatura, tem temperamento brincalhão e prefere evitar outras criaturas. Só luta quando provocado, usando o ferrão venenoso da cauda. Magos o cobiçam como familiar pela telepatia e resistência à magia, mas ele escolhe bem seus parceiros e abandona sem aviso quem o maltrata. Não fala, mas se expressa por imagens mentais e sons como ronronados, sibilos, trinados e rosnados."
 },
 "pteranodonte": {
  "id": "pteranodonte",
  "tipo": "fera",
  "name": "Pteranodonte",
  "nomeOriginal": "Pteranodon",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 12,
   "dex": 15,
   "con": 10,
   "int": 2,
   "wis": 9,
   "cha": 5
  },
  "ac": 13,
  "acNote": "armadura natural",
  "maxHp": 13,
  "hpDice": "3d8",
  "speedFt": 10,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60
  },
  "senses": {
   "passivePerception": 11
  },
  "saves": [],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 3,
    "damage": "2d4+1",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "traits": [
   "voaSemProvocar"
  ],
  "blurb": "Mergulha do céu para bicar e volta a subir sem provocar ataques de oportunidade. É frágil, mas difícil de alcançar, e se move devagar quando está no chão.",
  "lore": "O pteranodonte é um réptil voador de grandes asas membranosas e bico longo e sem dentes. Habita penhascos litorâneos, montanhas e campos abertos, onde plana por horas procurando peixes e pequenas presas. Costuma viver em bandos barulhentos que nidificam em rochedos altos. Raramente ataca criaturas grandes, a menos que esteja faminto ou que alguém ameace seus ninhos."
 },
 "vermePurpura": {
  "id": "vermePurpura",
  "tipo": "monstruosidade",
  "name": "Verme Púrpura",
  "nomeOriginal": "Purple Worm",
  "fonte": "MM",
  "size": "imenso",
  "level": 13,
  "cr": "15",
  "xp": 13000,
  "abilities": {
   "str": 28,
   "dex": 7,
   "con": 22,
   "int": 1,
   "wis": 8,
   "cha": 4
  },
  "ac": 18,
  "acNote": "armadura natural",
  "maxHp": 247,
  "hpDice": "15d20+90",
  "speedFt": 50,
  "speeds": {
   "burrowFt": 30
  },
  "senses": {
   "passivePerception": 9,
   "blindsightFt": 30,
   "tremorsenseFt": 60
  },
  "saves": [
   "con",
   "wis"
  ],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 14,
    "damage": "3d8+9",
    "type": "perfurante",
    "reachFt": 10,
    "engole": {
     "tamanhoMax": "large",
     "dano": "6d6",
     "tipoDano": "ácido",
     "regurgita": {
      "dano": 30,
      "dc": 21
     },
     "save": "dex",
     "dc": 19
    }
   },
   {
    "name": "Ferrão da Cauda",
    "bonus": 14,
    "damage": "3d6+9",
    "type": "perfurante",
    "reachFt": 10,
    "onHit": {
     "save": "con",
     "dc": 19,
     "danoSeFalhar": {
      "damage": "12d6",
      "type": "veneno"
     },
     "metadeSePassar": true
    }
   }
  ],
  "multiattack": {
   "count": 2
  },
  "traits": [
   "escavador"
  ],
  "blurb": "Um verme colossal que morde com força brutal, podendo engolir inteira uma criatura Grande ou menor, e golpeia com um ferrão de cauda carregado de veneno. Quem for engolido fica cego, contido e é dissolvido por ácido a cada turno.",
  "lore": "O verme púrpura é um predador gigantesco e quase sem mente que escava a rocha do Subterrâneo atrás de qualquer coisa que possa comer. Barulhos fortes o atraem, e não é raro que ele invada batalhas ou cidades subterrâneas, por isso drow, duergar e devoradores de mentes protegem seus assentamentos com barreiras especiais. Também aparece na superfície, em regiões rochosas e montanhosas, avançando com uma velocidade surpreendente. Como engole terra e pedra enquanto cava, seu corpo pode guardar metais preciosos e gemas, o que atrai caçadores de tesouro imprudentes. Os túneis que deixa para trás viram estradas para outras criaturas, já que ele raramente volta por onde passou."
 },
 "quadrone": {
  "id": "quadrone",
  "tipo": "constructo",
  "name": "Quadrone",
  "nomeOriginal": "Quadrone",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 12,
   "dex": 14,
   "con": 12,
   "int": 10,
   "wis": 10,
   "cha": 11
  },
  "ac": 16,
  "acNote": "armadura natural",
  "maxHp": 22,
  "hpDice": "4d8+4",
  "speedFt": 30,
  "flyFt": 30,
  "speeds": {
   "flyFt": 30
  },
  "senses": {
   "passivePerception": 12,
   "truesightFt": 120
  },
  "saves": [],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Punho",
    "bonus": 3,
    "damage": "1d4+1",
    "type": "concussão",
    "reachFt": 5
   },
   {
    "name": "Arco Curto",
    "bonus": 4,
    "damage": "1d6+2",
    "type": "perfurante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 80,
    "longRangeFt": 320
   }
  ],
  "multiattack": {
   "count": 2
  },
  "traits": [
   "t_menteAxiomatica",
   "t_desintegracao"
  ],
  "blurb": "Um modron cúbico que voa e dispara uma saraivada de quatro flechas por turno, ou golpeia duas vezes com os punhos de perto. Sua visão verdadeira de 36 m revela inimigos invisíveis ou disfarçados.",
  "lore": "Quadrones são modrons de forma cúbica, construtos da ordem absoluta de Mechanus, o plano da lei perfeita. Servem como soldados e supervisores de campo, comandando as fileiras inferiores na hierarquia rígida estabelecida por Primus. Cumprem ordens sem hesitar e raramente agem por conta própria. Alguns, corrompidos pelo desgaste ou pelo caos, tornam-se renegados e passam a ser caçados pelos próprios irmãos."
 },
 "quaggoth": {
  "id": "quaggoth",
  "tipo": "humanoide",
  "name": "Quaggoth",
  "nomeOriginal": "Quaggoth",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 17,
   "dex": 12,
   "con": 16,
   "int": 6,
   "wis": 12,
   "cha": 7
  },
  "ac": 13,
  "acNote": "armadura natural",
  "maxHp": 45,
  "hpDice": "6d8+18",
  "speedFt": 30,
  "speeds": {
   "climbFt": 30
  },
  "senses": {
   "passivePerception": 11,
   "darkvisionFt": 120
  },
  "saves": [],
  "skills": [
   "atletismo"
  ],
  "expertise": [],
  "damageImmunities": [
   "veneno"
  ],
  "conditionImmunities": [
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Garra",
    "bonus": 5,
    "damage": "1d6+3",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Garra",
    "Garra"
   ]
  },
  "furiaFerida": {
   "limiar": 10,
   "dano": "2d6"
  },
  "traits": [
   "furiaFerida"
  ],
  "blurb": "Ataca com duas garras e escala paredes com facilidade. Fica mais perigoso quando está quase morto: com 10 PV ou menos, ganha vantagem nos ataques e causa dano extra.",
  "lore": "Os quaggoths são humanoides peludos e selvagens que defendem seu território nos abismos do Subterrâneo. No passado viviam nas florestas da superfície, mas foram quase exterminados pelos elfos e se refugiaram nas profundezas. Lá, perderam a cor do pelo, adaptaram os olhos ao escuro e adotaram o canibalismo. Os drow criam esses brutos como tropas leais e usam o ódio que eles sentem pelos elfos em ataques à superfície. Alguns desenvolvem poderes psiônicos e passam a servir como xamãs da tribo, chamados thonots."
 },
 "quaggothServoDeEsporos": {
  "id": "quaggothServoDeEsporos",
  "tipo": "planta",
  "name": "Quaggoth Servo de Esporos",
  "nomeOriginal": "Quaggoth Spore Servant",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 17,
   "dex": 12,
   "con": 16,
   "int": 2,
   "wis": 6,
   "cha": 1
  },
  "ac": 13,
  "acNote": "armadura natural",
  "maxHp": 45,
  "hpDice": "6d8+18",
  "speedFt": 20,
  "speeds": {
   "climbFt": 20
  },
  "senses": {
   "passivePerception": 8,
   "blindsightFt": 30
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "damageImmunities": [
   "veneno"
  ],
  "conditionImmunities": [
   "cego",
   "enfeitiçado",
   "amedrontado",
   "paralisado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Garra",
    "bonus": 5,
    "damage": "1d6+3",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Garra",
    "Garra"
   ]
  },
  "traits": [],
  "blurb": "Um cadáver de quaggoth movido por fungos que avança devagar e rasga os inimigos com duas garras por turno. Não sente medo, não pode ser enfeitiçado nem paralisado e percebe tudo ao redor sem precisar de olhos.",
  "lore": "Este é o corpo de um quaggoth trazido de volta por esporos animadores de um soberano miconídeo. Sem mente nem vontade própria, ele perde a fala e os instintos de antes e passa a obedecer às ordens transmitidas pelos esporos de comunicação dos miconídeos, dando prioridade ao mais poderoso deles. Vaga pelas cavernas do Subterrâneo como guarda e operário das colônias fúngicas. Conserva a força bruta e a resistência do corpo original, mas se move com lentidão."
 },
 "quaggothThonot": {
  "id": "quaggothThonot",
  "tipo": "humanoide",
  "name": "Quaggoth Thonot",
  "nomeOriginal": "Quaggoth Thonot",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 17,
   "dex": 12,
   "con": 16,
   "int": 6,
   "wis": 12,
   "cha": 7
  },
  "ac": 13,
  "acNote": "armadura natural",
  "maxHp": 45,
  "hpDice": "6d8+18",
  "speedFt": 30,
  "speeds": {
   "climbFt": 30
  },
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 120
  },
  "saves": [],
  "skills": [
   "atletismo"
  ],
  "expertise": [],
  "damageImmunities": [
   "veneno"
  ],
  "conditionImmunities": [
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Garra",
    "bonus": 5,
    "damage": "1d6+3",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Garra",
    "Garra"
   ]
  },
  "spellcasting": {
   "ability": "wis",
   "cantrips": [],
   "prepared": [
    "curarFerimentos",
    "aumentarReduzir",
    "calorNoMetal",
    "imagemEspelhada",
    "quedaSuave",
    "maoMagica"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "curarFerimentos": 1,
    "aumentarReduzir": 1,
    "calorNoMetal": 1,
    "imagemEspelhada": 1
   },
   "aVontade": [
    "quedaSuave",
    "maoMagica"
   ],
   "cdPorMagia": {
    "curarFerimentos": 11,
    "aumentarReduzir": 11,
    "calorNoMetal": 11,
    "imagemEspelhada": 11,
    "quedaSuave": 11,
    "maoMagica": 11
   }
  },
  "furiaFerida": {
   "limiar": 10,
   "dano": "2d6"
  },
  "traits": [
   "furiaFerida"
  ],
  "blurb": "Bruto peludo que dilacera com duas garras e apoia o bando com magia psiônica, como curar ferimentos, crescer de tamanho ou esquentar armaduras metálicas. Fica ainda mais perigoso quando está quase morto.",
  "lore": "O thonot é um quaggoth raro, nascido com poderes psiônicos, que atua como líder espiritual e curandeiro da sua tribo no Subterrâneo. Esses humanoides de pelo branco vivem em cavernas profundas e costumam servir a senhores mais poderosos, como os drow. O thonot guia os outros em combate e usa sua mente para proteger os aliados. Como todo quaggoth, entra num frenesi selvagem quando gravemente ferido."
 },
 "piranha": {
  "id": "piranha",
  "tipo": "fera",
  "name": "Piranha",
  "nomeOriginal": "Quipper",
  "fonte": "MM",
  "size": "miúdo",
  "level": 1,
  "cr": "0",
  "xp": 10,
  "abilities": {
   "str": 2,
   "dex": 16,
   "con": 9,
   "int": 1,
   "wis": 7,
   "cha": 2
  },
  "ac": 13,
  "maxHp": 1,
  "hpDice": "1d4-1",
  "speedFt": 0,
  "speeds": {
   "swimFt": 40
  },
  "senses": {
   "passivePerception": 8,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 5,
    "damage": 1,
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "traits": [
   "frenesiDeSangue",
   "t_respiracaoAquatica"
  ],
  "blurb": "Peixe minúsculo que morde com dentes afiados e fica muito mais perigoso contra quem já está sangrando, atacando com vantagem alvos feridos.",
  "lore": "A piranha é um pequeno peixe carnívoro armado de dentes cortantes. Ela se adapta a quase qualquer corpo d'água, de rios quentes a lagos gelados nas profundezas do subterrâneo. Raramente anda sozinha, pois costuma formar cardumes vorazes que despedaçam presas muito maiores."
 },
 "rakshasa": {
  "id": "rakshasa",
  "tipo": "corruptor",
  "name": "Rakshasa",
  "nomeOriginal": "Rakshasa",
  "fonte": "MM",
  "size": "médio",
  "level": 13,
  "cr": "13",
  "xp": 10000,
  "abilities": {
   "str": 14,
   "dex": 17,
   "con": 18,
   "int": 13,
   "wis": 16,
   "cha": 20
  },
  "ac": 16,
  "acNote": "armadura natural",
  "maxHp": 110,
  "hpDice": "13d8+52",
  "speedFt": 40,
  "senses": {
   "passivePerception": 13,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "enganacao",
   "intuicao"
  ],
  "expertise": [],
  "damageImmunities": [
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageImmunitiesNote": "só de armas não mágicas",
  "damageVulnerabilities": [
   "perfurante"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Garra",
    "bonus": 7,
    "damage": "2d6+2",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Garra",
    "Garra"
   ]
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "enfeiticarPessoa",
    "detectarMagia",
    "invisibilidade",
    "imagemMaior",
    "sugestao",
    "dominarPessoa",
    "voo",
    "viagemPlanar",
    "visaoDaVerdade",
    "detectarPensamentos",
    "disfarcarSe",
    "maoMagica",
    "ilusaoMenor"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "enfeiticarPessoa": 3,
    "detectarMagia": 3,
    "invisibilidade": 3,
    "imagemMaior": 3,
    "sugestao": 3,
    "dominarPessoa": 1,
    "voo": 1,
    "viagemPlanar": 1,
    "visaoDaVerdade": 1
   },
   "aVontade": [
    "detectarPensamentos",
    "disfarcarSe",
    "maoMagica",
    "ilusaoMenor"
   ],
   "cdPorMagia": {
    "enfeiticarPessoa": 18,
    "detectarMagia": 18,
    "invisibilidade": 18,
    "imagemMaior": 18,
    "sugestao": 18,
    "dominarPessoa": 18,
    "voo": 18,
    "viagemPlanar": 18,
    "visaoDaVerdade": 18,
    "detectarPensamentos": 18,
    "disfarcarSe": 18,
    "maoMagica": 18,
    "ilusaoMenor": 18
   }
  },
  "traits": [
   "imunidadeMagicaLimitada"
  ],
  "blurb": "Dilacera com duas garras que amaldiçoam a vítima, impedindo-a de descansar, enquanto usa ilusões, enfeitiçamentos e dominação para virar o grupo contra si mesmo. Ignora magias de 6º nível ou menor e só armas mágicas o ferem.",
  "lore": "O rakshasa é um espírito infernal nascido de um ritual pelo qual diabos poderosos escaparam de seus corpos nos Nove Infernos. Na sua forma real mistura homem e tigre, com as palmas das mãos viradas para trás, mas quase sempre se disfarça de nobre, sacerdote ou mercador influente. Vive nas cidades do Plano Material, onde trama em segredo e se alimenta de carne humanoide. Se morrer fora dos Infernos, renasce lá depois de meses ou anos, lembrando de tudo, e caça quem o matou ou os entes queridos dessa pessoa. Só é destruído de vez se for morto nos próprios Nove Infernos."
 },
 "corvo": {
  "id": "corvo",
  "tipo": "fera",
  "name": "Corvo",
  "nomeOriginal": "Raven",
  "fonte": "MM",
  "size": "miúdo",
  "level": 1,
  "cr": "0",
  "xp": 10,
  "abilities": {
   "str": 2,
   "dex": 14,
   "con": 8,
   "int": 2,
   "wis": 12,
   "cha": 6
  },
  "ac": 12,
  "maxHp": 1,
  "hpDice": "1d4-1",
  "speedFt": 10,
  "flyFt": 50,
  "speeds": {
   "flyFt": 50
  },
  "senses": {
   "passivePerception": 13
  },
  "saves": [],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Bico",
    "bonus": 4,
    "damage": 1,
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "traits": [
   "t_imitacao"
  ],
  "blurb": "Ave pequena e frágil que bica com o bico afiado e foge voando rápido. Seu maior truque é imitar sons para distrair ou enganar.",
  "lore": "Corvos são aves negras e espertas encontradas em pântanos, colinas e cidades. Costumam se reunir em bandos perto de lixo, campos e cemitérios, sempre atentos ao que acontece ao redor. São curiosos e conseguem reproduzir ruídos que ouviram. Magos e bruxas frequentemente os escolhem como familiares."
 },
 "filhoteDeDragaoVermelho": {
  "id": "filhoteDeDragaoVermelho",
  "tipo": "dragão",
  "name": "Filhote de Dragão Vermelho",
  "nomeOriginal": "Red Dragon Wyrmling",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "4",
  "xp": 1100,
  "abilities": {
   "str": 19,
   "dex": 10,
   "con": 17,
   "int": 12,
   "wis": 11,
   "cha": 15
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 75,
  "hpDice": "10d8+30",
  "speedFt": 30,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60,
   "climbFt": 30
  },
  "senses": {
   "passivePerception": 14,
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
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "fogo"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 6,
    "damage": "1d10+4",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d6",
     "type": "fogo"
    }
   }
  ],
  "breath": {
   "name": "Sopro de Fogo",
   "kind": "save",
   "shape": "cone",
   "areaFt": 15,
   "save": "dex",
   "dc": 13,
   "damage": "7d6",
   "damageType": "fogo",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    5,
    6
   ]
  },
  "traits": [],
  "blurb": "Morde com presas incandescentes e, quando o fôlego recarrega, cobre um cone curto de chamas que pode derrubar grupos inteiros. Voa rápido e escala paredes, escolhendo de onde atacar.",
  "lore": "É o dragão vermelho recém-saído do ovo, já arrogante, ganancioso e cruel como os adultos de sua linhagem. Costuma se abrigar em cavernas quentes de montanhas ou perto de vulcões, onde começa a juntar seu primeiro tesouro. Ataca presas e intrusos sem hesitar, confiando no fogo e na própria fúria. Embora pequeno, já despreza as criaturas menores e exige obediência de quem consegue intimidar."
 },
 "slaadVermelho": {
  "id": "slaadVermelho",
  "tipo": "aberração",
  "name": "Slaad Vermelho",
  "nomeOriginal": "Red Slaad",
  "fonte": "MM",
  "size": "grande",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 16,
   "dex": 12,
   "con": 16,
   "int": 6,
   "wis": 6,
   "cha": 7
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 93,
  "hpDice": "11d10+33",
  "speedFt": 30,
  "senses": {
   "passivePerception": 11,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "damageResistances": [
   "ácido",
   "frio",
   "fogo",
   "elétrico",
   "trovejante"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 6,
    "damage": "2d4+3",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Garra",
    "bonus": 6,
    "damage": "1d8+3",
    "type": "perfurante",
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
  "regeneracao": {
   "pv": 10,
   "bloqueia": []
  },
  "traits": [
   "resistenciaAMagia",
   "regeneracaoDoLivro"
  ],
  "blurb": "Avança com mordida e duas garras a cada turno, regenerando 10 PV por rodada. Suas garras podem implantar um ovo de slaad em humanoides, uma doença que mata o hospedeiro meses depois.",
  "lore": "Os slaadi vermelhos são aberrações anfíbias nascidas do caos turbulento do Limbo, onde a Pedra Espiral distorce tudo ao redor. São os mais simples e brutos de sua espécie, movidos por fome e instinto de reprodução. Usam humanoides como incubadoras, cravando ovos sob a pele com as garras. Alguns foram dominados por magos com gemas implantadas no cérebro e servem como guardas obedientes."
 },
 "tubaraoDeRecife": {
  "id": "tubaraoDeRecife",
  "tipo": "fera",
  "name": "Tubarão-de-Recife",
  "nomeOriginal": "Reef Shark",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1/2",
  "xp": 100,
  "abilities": {
   "str": 14,
   "dex": 13,
   "con": 13,
   "int": 1,
   "wis": 10,
   "cha": 4
  },
  "ac": 12,
  "acNote": "armadura natural",
  "maxHp": 22,
  "hpDice": "4d8+4",
  "speedFt": 0,
  "speeds": {
   "swimFt": 40
  },
  "senses": {
   "passivePerception": 12,
   "blindsightFt": 30
  },
  "saves": [],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 4,
    "damage": "1d8+2",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "traits": [
   "packTactics",
   "t_respiracaoAquatica"
  ],
  "blurb": "Caça em pequenos grupos e ganha vantagem nas mordidas quando um aliado está ao lado da presa. Sozinho é frágil, mas em bando cerca e despedaça alvos isolados na água.",
  "lore": "É um tubarão de porte médio, bem menor que seus parentes caçadores e gigantes, com cerca de 2 a 3 metros de comprimento quando adulto. Vive em águas rasas e em torno de recifes de coral. Costuma se reunir em pequenos cardumes para caçar, cercando a presa em conjunto. Percebe o que está ao redor mesmo sem enxergar, graças à sua percepção às cegas."
 },
 "remorhaz": {
  "id": "remorhaz",
  "tipo": "monstruosidade",
  "name": "Remorhaz",
  "nomeOriginal": "Remorhaz",
  "fonte": "MM",
  "size": "enorme",
  "level": 9,
  "cr": "11",
  "xp": 7200,
  "abilities": {
   "str": 24,
   "dex": 13,
   "con": 21,
   "int": 4,
   "wis": 10,
   "cha": 5
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 195,
  "hpDice": "17d12+85",
  "speedFt": 30,
  "speeds": {
   "burrowFt": 20
  },
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 60,
   "tremorsenseFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "damageImmunities": [
   "frio",
   "fogo"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 11,
    "damage": "6d10+7",
    "type": "perfurante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "3d6",
     "type": "fogo"
    },
    "onHit": {
     "semResistencia": true,
     "dc": 17,
     "escape": 17,
     "condition": "contido",
     "note": "é agarrado"
    }
   }
  ],
  "acoesEspeciais": [
   {
    "nome": "Engolir",
    "tipo": "engolir",
    "tamanhoMax": "medium",
    "dano": "6d6",
    "tipoDano": "ácido",
    "regurgita": {
     "dano": 30,
     "dc": 15
    }
   }
  ],
  "corpoQuente": {
   "damage": "3d6",
   "type": "fogo"
  },
  "traits": [
   "corpoQuente"
  ],
  "blurb": "Surge de baixo do gelo, morde com força brutal e prende a vítima para depois engoli-la viva, onde o ácido a consome. Seu corpo escaldante queima quem o toca ou golpeia de perto.",
  "lore": "O remorhaz é um predador colossal das regiões geladas, que caça alces, ursos-polares e o que mais cruzar seu território. Para sobreviver ao frio, seu corpo produz um calor interno intenso, e por isso ele não suporta climas quentes. Escava fundo na neve e espera imóvel, sentindo as vibrações de presas passando acima, e consegue esfriar o corpo para não derreter o esconderijo. Gigantes do gelo caçam seus ninhos, pois filhotes criados desde o ovo podem ser treinados como guardiões de suas fortalezas."
 },
 "rinoceronte": {
  "id": "rinoceronte",
  "tipo": "fera",
  "name": "Rinoceronte",
  "nomeOriginal": "Rhinoceros",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 21,
   "dex": 8,
   "con": 15,
   "int": 2,
   "wis": 12,
   "cha": 6
  },
  "ac": 11,
  "acNote": "armadura natural",
  "maxHp": 45,
  "hpDice": "6d10+12",
  "speedFt": 40,
  "senses": {
   "passivePerception": 11
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Chifrada",
    "bonus": 7,
    "damage": "2d8+5",
    "type": "concussão",
    "reachFt": 5,
    "investida": {
     "pes": 20,
     "save": "str",
     "dc": 15,
     "dano": "2d8",
     "tipo": "concussão"
    }
   }
  ],
  "traits": [],
  "blurb": "Investe em linha reta contra o alvo e o atinge com o chifre, causando dano extra e podendo derrubá-lo. Mantenha distância ou bloqueie o caminho da investida.",
  "lore": "O rinoceronte é um herbívoro enorme de couro grosso que vive nas savanas e campos abertos. Costuma pastar em paz, mas tem pouca paciência com intrusos. Quando se sente ameaçado, abaixa a cabeça e dispara contra o que o incomoda. Sua força bruta basta para atropelar até guerreiros bem armados."
 },
 "cavaloDeMontaria": {
  "id": "cavaloDeMontaria",
  "tipo": "fera",
  "name": "Cavalo de Montaria",
  "nomeOriginal": "Riding Horse",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 16,
   "dex": 10,
   "con": 12,
   "int": 2,
   "wis": 11,
   "cha": 7
  },
  "ac": 10,
  "maxHp": 13,
  "hpDice": "2d10+2",
  "speedFt": 60,
  "senses": {
   "passivePerception": 10
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Cascos",
    "bonus": 5,
    "damage": "2d4+3",
    "type": "concussão",
    "reachFt": 5
   }
  ],
  "traits": [],
  "blurb": "Animal veloz que alcança 18 m por turno, ótimo para levar cavaleiros longe. Em combate, apenas dá coices com os cascos, sem grande ameaça.",
  "lore": "Cavalos de montaria são criados para transportar viajantes, mensageiros e patrulheiros por estradas e campos abertos. São comuns tanto em pastagens quanto em cidades, onde servem em estábulos e caravanas. Costumam fugir do perigo em vez de enfrentá-lo, mas reagem com coices quando encurralados ou assustados."
 },
 "roca": {
  "id": "roca",
  "tipo": "monstruosidade",
  "name": "Roca",
  "nomeOriginal": "Roc",
  "fonte": "MM",
  "size": "imenso",
  "level": 9,
  "cr": "11",
  "xp": 7200,
  "abilities": {
   "str": 28,
   "dex": 10,
   "con": 20,
   "int": 3,
   "wis": 10,
   "cha": 9
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 248,
  "hpDice": "16d20+80",
  "speedFt": 20,
  "flyFt": 120,
  "speeds": {
   "flyFt": 120
  },
  "senses": {
   "passivePerception": 14
  },
  "saves": [
   "dex",
   "con",
   "wis",
   "cha"
  ],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Bico",
    "bonus": 13,
    "damage": "4d8+9",
    "type": "perfurante",
    "reachFt": 10
   },
   {
    "name": "Garras",
    "bonus": 13,
    "damage": "4d6+9",
    "type": "cortante",
    "reachFt": 5,
    "onHit": {
     "semResistencia": true,
     "dc": 19,
     "escape": 19,
     "condition": "contido",
     "note": "é agarrado"
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Bico",
    "Garras"
   ]
  },
  "traits": [
   "visaoAgucada"
  ],
  "blurb": "Ave colossal que mergulha do céu, bica com alcance de 3 m e prende a vítima nas garras, deixando-a contida. Seus golpes causam dano altíssimo, e escapar exige muita força.",
  "lore": "A roca parece uma ave de rapina comum até se aproximar e revelar asas de mais de sessenta metros de envergadura. Foi criada por Annam, pai dos deuses gigantes, para disputar o céu com os dragões, e se espalhou pelo mundo quando aquela guerra terminou. Caça sozinha e voa por distâncias enormes atrás de presas grandes e lentas, como gigantes, baleias e elefantes, sem se interessar por alvos pequenos ou que se escondem com facilidade. Faz ninhos em fendas de montanhas com árvores, navios e restos de caravanas, onde às vezes sobram tesouros que ela ignora e, raramente, ovos maiores que um humano."
 },
 "enrolador": {
  "id": "enrolador",
  "tipo": "monstruosidade",
  "name": "Enrolador",
  "nomeOriginal": "Roper",
  "fonte": "MM",
  "size": "grande",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 18,
   "dex": 8,
   "con": 17,
   "int": 7,
   "wis": 16,
   "cha": 6
  },
  "ac": 20,
  "acNote": "armadura natural",
  "maxHp": 93,
  "hpDice": "11d10+33",
  "speedFt": 10,
  "speeds": {
   "climbFt": 10
  },
  "senses": {
   "passivePerception": 16,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "furtividade"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 7,
    "damage": "4d8+4",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Tentáculo",
    "bonus": 7,
    "damage": 0,
    "type": "nenhum",
    "reachFt": 50,
    "onHit": {
     "semResistencia": true,
     "dc": 15,
     "escape": 15,
     "condition": "contido",
     "note": "é agarrado"
    }
   }
  ],
  "multiattack": {
   "count": 4
  },
  "acoesEspeciais": [
   {
    "nome": "Puxar",
    "tipo": "puxarAgarrados",
    "pes": 25
   }
  ],
  "traits": [
   "aparenciaFalsa",
   "t_tentaculosAgarradores",
   "spiderClimb"
  ],
  "blurb": "Disfarçado de estalagmite, prende vítimas a até 15 m com seus tentáculos, deixando-as contidas e fracas, e as puxa para uma mordida brutal de 4d8+4. Atacar os tentáculos ou rompê-los é a melhor forma de escapar.",
  "lore": "O enrolador é um predador faminto das cavernas do Subterrâneo, a forma adulta do perfurador. Fica imóvel por horas com seu único olho fechado, passando por uma simples formação rochosa, até que uma presa se aproxime. Então lança tentáculos pegajosos que drenam a força da vítima e a arrasta até a boca de dentes de pedra. Come quase tudo, mas não digere platina, gemas nem itens mágicos, que às vezes ficam em sua moela. Seus sucos digestivos valem bom dinheiro para alquimistas."
 },
 "tapeteSufocante": {
  "id": "tapeteSufocante",
  "tipo": "constructo",
  "name": "Tapete Sufocante",
  "nomeOriginal": "Rug of Smothering",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 17,
   "dex": 14,
   "con": 10,
   "int": 1,
   "wis": 3,
   "cha": 1
  },
  "ac": 12,
  "maxHp": 33,
  "hpDice": "6d10",
  "speedFt": 10,
  "senses": {
   "passivePerception": 6,
   "blindsightFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "damageImmunities": [
   "veneno",
   "psíquico"
  ],
  "conditionImmunities": [
   "cego",
   "enfeitiçado",
   "surdo",
   "amedrontado",
   "paralisado",
   "petrificado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Sufocar",
    "bonus": 5,
    "damage": "2d6+3",
    "type": "concussão",
    "reachFt": 5,
    "onHit": {
     "semResistencia": true,
     "dc": 13,
     "escape": 13,
     "condition": "contido",
     "note": "é agarrado"
    }
   }
  ],
  "traits": [
   "suscetibilidadeAntimagica",
   "transfereDano",
   "aparenciaFalsa"
  ],
  "blurb": "Fica imóvel como um tapete comum até alguém pisar perto, então se enrola na vítima, cegando-a, prendendo-a e esmagando-a a cada turno. Bater nele enquanto agarra alguém fere também o prisioneiro.",
  "lore": "É um tapete animado por magia, criado para guardar salões, tesouros e aposentos de magos. Não pensa nem sente: apenas cumpre as ordens deixadas por seu criador. Espera parado no chão até que um intruso se aproxime e então ataca sem aviso. Por depender de magia, campos antimagia e dissipações podem desativá-lo."
 },
 "monstroDaFerrugem": {
  "id": "monstroDaFerrugem",
  "tipo": "monstruosidade",
  "name": "Monstro da Ferrugem",
  "nomeOriginal": "Rust Monster",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1/2",
  "xp": 100,
  "abilities": {
   "str": 13,
   "dex": 12,
   "con": 13,
   "int": 2,
   "wis": 13,
   "cha": 6
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 27,
  "hpDice": "5d8+5",
  "speedFt": 40,
  "senses": {
   "passivePerception": 11,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 3,
    "damage": "1d8+1",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "acoesEspeciais": [
   {
    "nome": "Antenas",
    "tipo": "corroerArmadura",
    "dc": 11
   }
  ],
  "traits": [
   "t_faroParaFerro",
   "corroiArma"
  ],
  "blurb": "Pouco letal com a mordida, mas suas antenas corroem armaduras, escudos e armas de metal, e qualquer arma metálica comum que o atinja enferruja.",
  "lore": "Criatura subterrânea com corpo coberto de placas grossas, cauda terminada em ponta óssea e duas antenas plumosas na cabeça de inseto. Vaga sozinha ou em pequenos grupos pelos túneis do Subterrâneo, farejando ferro, aço, adamante e mitral para enferrujar e devorar. Costuma ignorar quem não carrega metal, mas investe contra aventureiros armados e blindados. Largar objetos de ferro para trás é uma boa forma de distraí-lo, e, bem alimentado, pode até virar um bicho de estimação."
 },
 "sahuagin": {
  "id": "sahuagin",
  "tipo": "humanoide",
  "name": "Sahuagin",
  "nomeOriginal": "Sahuagin",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1/2",
  "xp": 100,
  "abilities": {
   "str": 13,
   "dex": 11,
   "con": 12,
   "int": 12,
   "wis": 13,
   "cha": 9
  },
  "ac": 12,
  "acNote": "armadura natural",
  "maxHp": 22,
  "hpDice": "4d8+4",
  "speedFt": 30,
  "speeds": {
   "swimFt": 40
  },
  "senses": {
   "passivePerception": 15,
   "darkvisionFt": 120
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
    "bonus": 3,
    "damage": "1d4+1",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Garras",
    "bonus": 3,
    "damage": "1d4+1",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Lança",
    "bonus": 3,
    "damage": "1d6+1",
    "type": "perfurante",
    "reachFt": 5,
    "rangeFt": 20,
    "longRangeFt": 60,
    "danoExtra": {
     "damage": "1d8+1",
     "type": "perfurante"
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Mordida",
    "Garras"
   ]
  },
  "traits": [
   "frenesiDeSangue",
   "t_anfibioLimitado",
   "t_telepatiaComTubaroes"
  ],
  "blurb": "Caçador anfíbio que morde e golpeia com garras ou lança, e fica ainda mais feroz contra quem já está ferido. Costuma atacar em grupo, às vezes com tubarões ao seu lado.",
  "lore": "Conhecidos nas costas como diabos do mar, os sahuagin são humanoides com feições de peixe que sobem das fossas oceânicas para saquear navios e aldeias litorâneas. Cultuam Sekolah, o deus tubarão, e suas sacerdotisas têm grande poder; os machos mutantes de quatro braços governam como barões. O cheiro de sangue os leva ao frenesi, e tubarões os tratam como aliados. Travam uma guerra de séculos contra os elfos aquáticos, infiltrando entre eles os malenti, sahuagin que nascem idênticos a elfos."
 },
 "baraoSahuagin": {
  "id": "baraoSahuagin",
  "tipo": "humanoide",
  "name": "Barão Sahuagin",
  "nomeOriginal": "Sahuagin Baron",
  "fonte": "MM",
  "size": "grande",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 19,
   "dex": 15,
   "con": 16,
   "int": 14,
   "wis": 13,
   "cha": 17
  },
  "ac": 16,
  "acNote": "peitoral",
  "maxHp": 76,
  "hpDice": "9d10+27",
  "speedFt": 30,
  "speeds": {
   "swimFt": 50
  },
  "senses": {
   "passivePerception": 17,
   "darkvisionFt": 120
  },
  "saves": [
   "dex",
   "con",
   "int",
   "wis"
  ],
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
    "damage": "2d4+4",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Garras",
    "bonus": 7,
    "damage": "2d6+4",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Tridente",
    "bonus": 7,
    "damage": "2d6+4",
    "type": "perfurante",
    "reachFt": 5,
    "rangeFt": 20,
    "longRangeFt": 60,
    "danoExtra": {
     "damage": "2d8+4",
     "type": "perfurante"
    }
   }
  ],
  "multiattack": {
   "count": 3
  },
  "traits": [
   "frenesiDeSangue",
   "t_anfibioLimitado",
   "t_telepatiaComTubaroes"
  ],
  "blurb": "Brutamontes aquático que morde e golpeia três vezes por turno com garras ou tridente, ficando ainda mais perigoso contra quem já está ferido. Pode convocar tubarões próximos para cercar suas presas.",
  "lore": "Os barões sahuagin são líderes enormes e cruéis que comandam grupos de guerreiros das profundezas. Vivem em cidadelas submersas e atacam litorais e navios em busca de saque e sacrifícios. O cheiro de sangue os leva a um frenesi assassino. Costumam lutar acompanhados de tubarões, que obedecem às suas ordens mentais."
 },
 "sacerdotisaSahuagin": {
  "id": "sacerdotisaSahuagin",
  "tipo": "humanoide",
  "name": "Sacerdotisa Sahuagin",
  "nomeOriginal": "Sahuagin Priestess",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 13,
   "dex": 11,
   "con": 12,
   "int": 12,
   "wis": 14,
   "cha": 13
  },
  "ac": 12,
  "acNote": "armadura natural",
  "maxHp": 33,
  "hpDice": "6d8+6",
  "speedFt": 30,
  "speeds": {
   "swimFt": 40
  },
  "senses": {
   "passivePerception": 16,
   "darkvisionFt": 120
  },
  "saves": [],
  "skills": [
   "percepcao",
   "religiao"
  ],
  "expertise": [
   "percepcao"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 3,
    "damage": "1d4+1",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Garras",
    "bonus": 3,
    "damage": "1d4+1",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2
  },
  "spellcasting": {
   "ability": "wis",
   "cantrips": [
    "orientacao",
    "taumaturgia"
   ],
   "prepared": [
    "bencao",
    "detectarMagia",
    "raioGuiado",
    "imobilizarPessoa",
    "armaEspiritual",
    "palavraCurativaEmMassa",
    "linguas"
   ],
   "slots": [
    0,
    4,
    3,
    3
   ],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "cdPorMagia": {
    "orientacao": 12,
    "taumaturgia": 12,
    "bencao": 12,
    "detectarMagia": 12,
    "raioGuiado": 12,
    "imobilizarPessoa": 12,
    "armaEspiritual": 12,
    "palavraCurativaEmMassa": 12,
    "linguas": 12
   }
  },
  "traits": [
   "frenesiDeSangue",
   "t_anfibiaLimitada",
   "t_telepatiaComTubaroes"
  ],
  "blurb": "Conjuradora divina que paralisa inimigos com imobilizar pessoa, invoca uma arma espiritual em forma de tridente e cura os aliados em massa. De perto morde e arranha, e fica ainda mais feroz contra alvos já feridos.",
  "lore": "As sacerdotisas são as líderes espirituais dos sahuagin, devotas do deus-tubarão Sekolah. Vivem em cidades submersas nos mares profundos e ao longo de costas perigosas. Elas comandam rituais, conduzem ataques contra povoados litorâneos e controlam tubarões com a mente. Dentro da sociedade sahuagin, a palavra delas tem peso quase igual à do rei."
 },
 "salamandra": {
  "id": "salamandra",
  "tipo": "elemental",
  "name": "Salamandra",
  "nomeOriginal": "Salamander",
  "fonte": "MM",
  "size": "grande",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 18,
   "dex": 14,
   "con": 15,
   "int": 11,
   "wis": 10,
   "cha": 12
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 90,
  "hpDice": "12d10+24",
  "speedFt": 30,
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "damageImmunities": [
   "fogo"
  ],
  "damageVulnerabilities": [
   "frio"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Lança",
    "bonus": 7,
    "damage": "2d6+4",
    "type": "perfurante",
    "reachFt": 5,
    "rangeFt": 20,
    "longRangeFt": 60,
    "danoExtra": {
     "damage": "2d8+4",
     "type": "perfurante"
    }
   },
   {
    "name": "Cauda",
    "bonus": 7,
    "damage": "2d6+4",
    "type": "concussão",
    "reachFt": 10,
    "danoExtra": {
     "damage": "2d6",
     "type": "fogo"
    },
    "onHit": {
     "semResistencia": true,
     "dc": 14,
     "escape": 14,
     "condition": "contido",
     "note": "é agarrado"
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Lança",
    "Cauda"
   ]
  },
  "corpoQuente": {
   "damage": "2d6",
   "type": "fogo"
  },
  "traits": [
   "corpoQuente"
  ],
  "blurb": "Combina estocadas de lança incandescente com uma cauda que agarra e contém a vítima enquanto a queima. Encostar nela ou golpeá-la de perto também causa queimaduras, mas o frio a fere em dobro.",
  "lore": "As salamandras são elementais serpentinos do Plano Elemental do Fogo, com corpo de cobra, espinhos fumegantes e olhos amarelos brilhantes. Adoram poder e destruição, e fora de seu plano buscam incêndios florestais e vulcões em erupção. Muitas foram escravizadas pelos efreet, que as usam como tropas de guerra e alimentam seu ódio pelos azers. Entre as livres, as mais velhas e maiores dominam bandos nômades que saqueiam outras comunidades. Seu calor natural as torna ferreiras excepcionais, capazes de moldar metal com as próprias mãos."
 },
 "satiro": {
  "id": "satiro",
  "tipo": "feérico",
  "name": "Sátiro",
  "nomeOriginal": "Satyr",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1/2",
  "xp": 100,
  "abilities": {
   "str": 12,
   "dex": 16,
   "con": 11,
   "int": 12,
   "wis": 10,
   "cha": 14
  },
  "ac": 14,
  "acNote": "armadura de couro",
  "maxHp": 31,
  "hpDice": "7d8",
  "speedFt": 40,
  "senses": {
   "passivePerception": 12
  },
  "saves": [],
  "skills": [
   "percepcao",
   "atuacao",
   "furtividade"
  ],
  "expertise": [
   "atuacao"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Chifrada",
    "bonus": 3,
    "damage": "2d4+1",
    "type": "concussão",
    "reachFt": 5
   },
   {
    "name": "Espada Curta",
    "bonus": 5,
    "damage": "1d6+3",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Arco Curto",
    "bonus": 5,
    "damage": "1d6+3",
    "type": "perfurante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 80,
    "longRangeFt": 320
   }
  ],
  "traits": [
   "resistenciaAMagia"
  ],
  "blurb": "Feérico ágil que alterna chifradas, espada curta e arco curto, resistindo bem a magias. Se carregar uma flauta de Pã, pode enfeitiçar, amedrontar ou adormecer um grupo inteiro de uma vez.",
  "lore": "Sátiros são feéricos barulhentos das florestas selvagens, movidos por curiosidade e busca de prazer. Têm torso de homem robusto, pernas peludas de bode com cascos fendidos e chifres que vão de pequenas saliências a grandes espirais de carneiro. Vivem atrás da bebida mais forte, da comida mais fina e da dança mais vertiginosa, e são capazes de sequestrar um menestrel ou invadir um palácio para satisfazer um desejo. Não perdem uma festa e espalham farra por onde passam, sem se importar com a confusão que deixam para trás."
 },
 "espantalho": {
  "id": "espantalho",
  "tipo": "constructo",
  "name": "Espantalho",
  "nomeOriginal": "Scarecrow",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 11,
   "dex": 13,
   "con": 11,
   "int": 10,
   "wis": 10,
   "cha": 13
  },
  "ac": 11,
  "maxHp": 36,
  "hpDice": "8d8",
  "speedFt": 30,
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "damageImmunities": [
   "veneno"
  ],
  "damageVulnerabilities": [
   "fogo"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "exausto",
   "amedrontado",
   "paralisado",
   "envenenado",
   "inconsciente"
  ],
  "attacks": [
   {
    "name": "Garra",
    "bonus": 3,
    "damage": "2d4+1",
    "type": "cortante",
    "reachFt": 5,
    "onHit": {
     "save": "wis",
     "dc": 11,
     "condition": "amedrontado",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Garra",
    "Garra"
   ]
  },
  "acoesEspeciais": [
   {
    "nome": "Olhar Aterrorizante",
    "tipo": "alvo",
    "alcanceFt": 30,
    "save": "wis",
    "dc": 11,
    "condition": "amedrontado",
    "rounds": 1,
    "repete": false,
    "ateFimDoTurnoDele": true
   }
  ],
  "traits": [
   "aparenciaFalsa"
  ],
  "blurb": "Ataca com duas garras que podem amedrontar a vítima e, com seu olhar aterrorizante, paralisa de medo quem o encara. É vulnerável a fogo, mas resiste a armas comuns.",
  "lore": "O espantalho é um constructo de palha e pano movido pelo espírito aprisionado de uma criatura maligna morta. Bruxas e megeras costumam usar espíritos de demônios para animá-los, e é essa presença vinda do além que torna seu olhar tão apavorante. Ele não guarda memórias da vida anterior e só quer cumprir as ordens de quem o criou, vigiando campos por meses sem se cansar. Se o criador morre, o espantalho pode seguir as últimas ordens, buscar vingança ou se destruir."
 },
 "escorpiao": {
  "id": "escorpiao",
  "tipo": "fera",
  "name": "Escorpião",
  "nomeOriginal": "Scorpion",
  "fonte": "MM",
  "size": "miúdo",
  "level": 1,
  "cr": "0",
  "xp": 10,
  "abilities": {
   "str": 2,
   "dex": 11,
   "con": 8,
   "int": 1,
   "wis": 8,
   "cha": 2
  },
  "ac": 11,
  "acNote": "armadura natural",
  "maxHp": 1,
  "hpDice": "1d4-1",
  "speedFt": 10,
  "senses": {
   "passivePerception": 9,
   "blindsightFt": 10
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Ferrão",
    "bonus": 2,
    "damage": "1d8",
    "type": "veneno",
    "reachFt": 5
   }
  ],
  "traits": [],
  "blurb": "Pequeno e lento, ataca com um ferrão venenoso que pode causar dano surpreendente para seu tamanho. Percebe quem chega perto mesmo sem enxergar.",
  "lore": "O escorpião é um aracnídeo minúsculo, comum em desertos e terras áridas. Esconde-se sob pedras e na areia durante o calor do dia e sai para caçar insetos. Não procura briga com criaturas grandes, mas pica sem hesitar quando é pisado ou incomodado. Magos às vezes o escolhem como familiar."
 },
 "bruxaDoMar": {
  "id": "bruxaDoMar",
  "tipo": "feérico",
  "name": "Bruxa do Mar",
  "nomeOriginal": "Sea Hag",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 16,
   "dex": 13,
   "con": 16,
   "int": 12,
   "wis": 12,
   "cha": 13
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 52,
  "hpDice": "7d8+21",
  "speedFt": 30,
  "speeds": {
   "swimFt": 40
  },
  "senses": {
   "passivePerception": 11,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Garras",
    "bonus": 5,
    "damage": "2d6+3",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "acoesEspeciais": [
   {
    "nome": "Olhar Mortal",
    "tipo": "alvo",
    "alcanceFt": 30,
    "soComCondicao": "amedrontado",
    "cai0": true,
    "save": "wis",
    "dc": 11
   }
  ],
  "aura": {
   "raioFt": 30,
   "quando": "inicioDoAlvo",
   "save": "wis",
   "dc": 11,
   "condition": "amedrontado",
   "imunizaAoPassar": true,
   "rounds": 10,
   "repete": true
  },
  "traits": [
   "t_aparenciaIlusoria",
   "aura"
  ],
  "blurb": "Sua forma verdadeira aterroriza quem a vê, e contra vítimas amedrontadas ela lança um olhar capaz de derrubá-las a 0 PV na hora. De perto, rasga com garras afiadas.",
  "lore": "A bruxa do mar é uma fada maligna que habita águas costeiras sombrias, recifes podres e naufrágios. Ela odeia a beleza e se dedica a corromper ou destruir tudo o que é belo ao seu redor. Costuma se esconder sob uma ilusão e atrair marinheiros e pescadores para a desgraça. Às vezes se junta a outras bruxas em um conciliábulo de três, ganhando acesso a magias poderosas."
 },
 "cavaloMarinho": {
  "id": "cavaloMarinho",
  "tipo": "fera",
  "name": "Cavalo-Marinho",
  "nomeOriginal": "Sea Horse",
  "fonte": "MM",
  "size": "miúdo",
  "level": 1,
  "cr": "0",
  "xp": 10,
  "abilities": {
   "str": 1,
   "dex": 12,
   "con": 8,
   "int": 1,
   "wis": 10,
   "cha": 2
  },
  "ac": 11,
  "maxHp": 1,
  "hpDice": "1d4-1",
  "speedFt": 0,
  "speeds": {
   "swimFt": 20
  },
  "senses": {
   "passivePerception": 10
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "traits": [
   "t_respiracaoAquatica"
  ],
  "blurb": "Uma criaturinha frágil e sem ataques, que só nada devagar e foge de qualquer ameaça. Não representa perigo em combate.",
  "lore": "O cavalo-marinho é um peixe minúsculo de corpo curvado e focinho comprido, comum em recifes e prados de algas de águas rasas. Ele passa o dia preso às plantas pela cauda, esperando o alimento passar. É tímido e indefeso, por isso confia na camuflagem para não ser notado. Alguns conjuradores que vivem perto do mar o escolhem como familiar."
 },
 "demonioDasSombras": {
  "id": "demonioDasSombras",
  "tipo": "corruptor",
  "name": "Demônio das Sombras",
  "nomeOriginal": "Shadow Demon",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "4",
  "xp": 1100,
  "abilities": {
   "str": 1,
   "dex": 17,
   "con": 12,
   "int": 14,
   "wis": 13,
   "cha": 14
  },
  "ac": 13,
  "maxHp": 66,
  "hpDice": "12d8+12",
  "speedFt": 30,
  "flyFt": 30,
  "speeds": {
   "flyFt": 30
  },
  "senses": {
   "passivePerception": 11,
   "darkvisionFt": 120
  },
  "saves": [
   "dex",
   "cha"
  ],
  "skills": [
   "furtividade"
  ],
  "expertise": [
   "furtividade"
  ],
  "damageResistances": [
   "ácido",
   "fogo",
   "necrótico",
   "trovejante",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "damageImmunities": [
   "frio",
   "elétrico",
   "veneno"
  ],
  "damageVulnerabilities": [
   "radiante"
  ],
  "conditionImmunities": [
   "exausto",
   "agarrado",
   "paralisado",
   "petrificado",
   "envenenado",
   "caido",
   "contido"
  ],
  "attacks": [
   {
    "name": "Garras",
    "bonus": 5,
    "damage": "2d6+3",
    "type": "psíquico",
    "reachFt": 5,
    "danoExtra": {
     "damage": "4d6+3",
     "type": "psíquico"
    }
   }
  ],
  "traits": [
   "incorporealMovement",
   "sensibilidadeALuz",
   "furtividadeNasSombras"
  ],
  "blurb": "Espreita na escuridão, se esconde com facilidade e atravessa paredes para atacar com garras psíquicas que ferem muito mais quando ele tem vantagem. É fraco sob luz intensa e vulnerável a dano radiante.",
  "lore": "Quando um demônio perece fora do Abismo, às vezes sua essência se recusa a voltar inteira e se torna uma sombra viva, sem corpo verdadeiro. Esse ser ressentido vaga por ruínas, masmorras e lugares sem luz, onde se sente seguro. Ele adora sussurrar telepaticamente para suas vítimas, alimentando medos e desconfianças antes de atacar. Evita a claridade e prefere emboscar quem está isolado."
 },
 "cogumeloGuinchador": {
  "id": "cogumeloGuinchador",
  "tipo": "planta",
  "name": "Cogumelo Guinchador",
  "nomeOriginal": "Shrieker",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "0",
  "xp": 10,
  "abilities": {
   "str": 1,
   "dex": 1,
   "con": 10,
   "int": 1,
   "wis": 3,
   "cha": 1
  },
  "ac": 5,
  "maxHp": 13,
  "hpDice": "3d8",
  "speedFt": 0,
  "senses": {
   "passivePerception": 6,
   "blindsightFt": 30
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [
   "cego",
   "surdo",
   "amedrontado"
  ],
  "traits": [
   "aparenciaFalsa",
   "t_guincho"
  ],
  "blurb": "Não ataca nem se move, mas grita alto sempre que alguém ou uma luz forte chega perto, avisando todos os monstros da região. É fácil de destruir, porém difícil de calar a tempo.",
  "lore": "É um fungo do tamanho de um humano que cresce nas cavernas escuras do Subterrâneo. Sem olhos nem ouvidos, percebe o ambiente ao redor e reage a intrusos com um berro estridente. Outras criaturas costumam cultivá-lo perto de seus covis como alarme natural. Predadores também aprendem que o grito anuncia presas por perto."
 },
 "filhoteDeDragaoDePrata": {
  "id": "filhoteDeDragaoDePrata",
  "tipo": "dragão",
  "name": "Filhote de Dragão de Prata",
  "nomeOriginal": "Silver Dragon Wyrmling",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 19,
   "dex": 10,
   "con": 17,
   "int": 12,
   "wis": 11,
   "cha": 15
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 45,
  "hpDice": "6d8+18",
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
   "dex",
   "con",
   "wis",
   "cha"
  ],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "frio"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 6,
    "damage": "1d10+4",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "breath": {
   "name": "Sopro de Frio",
   "kind": "save",
   "shape": "cone",
   "areaFt": 15,
   "save": "con",
   "dc": 13,
   "damage": "4d8",
   "damageType": "frio",
   "halfOnSave": true,
   "origem": "sopro",
   "chaveRecarga": "Armas de Sopro",
   "recharge": [
    5,
    6
   ]
  },
  "sopros": [
   {
    "name": "Sopro de Frio",
    "kind": "save",
    "shape": "cone",
    "areaFt": 15,
    "save": "con",
    "dc": 13,
    "damage": "4d8",
    "damageType": "frio",
    "halfOnSave": true,
    "origem": "sopro",
    "chaveRecarga": "Armas de Sopro",
    "recharge": [
     5,
     6
    ]
   },
   {
    "name": "Sopro Paralisante",
    "kind": "save",
    "shape": "cone",
    "areaFt": 15,
    "save": "con",
    "dc": 13,
    "condition": "paralisado",
    "rounds": 10,
    "origem": "sopro",
    "chaveRecarga": "Armas de Sopro",
    "recharge": [
     5,
     6
    ]
   }
  ],
  "traits": [],
  "blurb": "Morde com força e, quando o sopro recarrega, escolhe entre um cone gélido de dano ou um gás que paralisa quem estiver na frente. O sopro paralisante é o maior perigo, pois deixa os alvos indefesos.",
  "lore": "Filhotes de dragão de prata são jovens dragões metálicos de índole nobre e bondosa, curiosos a respeito das outras raças. Costumam viver em picos altos e nevados, perto das nuvens que tanto adoram. Mesmo pequenos, já falam dracônico e mostram um senso de justiça marcante. Preferem conversar a lutar, mas defendem os inocentes sem hesitar."
 },
 "girinoDeSlaad": {
  "id": "girinoDeSlaad",
  "tipo": "aberração",
  "name": "Girino de Slaad",
  "nomeOriginal": "Slaad Tadpole",
  "fonte": "MM",
  "size": "miúdo",
  "level": 1,
  "cr": "1/8",
  "xp": 25,
  "abilities": {
   "str": 7,
   "dex": 15,
   "con": 10,
   "int": 3,
   "wis": 5,
   "cha": 3
  },
  "ac": 12,
  "maxHp": 10,
  "hpDice": "4d4",
  "speedFt": 30,
  "senses": {
   "passivePerception": 7,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "furtividade"
  ],
  "expertise": [],
  "damageResistances": [
   "ácido",
   "frio",
   "fogo",
   "elétrico",
   "trovejante"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 4,
    "damage": "1d4+2",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "traits": [
   "resistenciaAMagia"
  ],
  "blurb": "Pequeno e frágil, ataca com mordidas rápidas e se esconde bem. Resiste a vários tipos de energia e à magia, o que o torna mais duro do que aparenta.",
  "lore": "Girinos de slaad são a forma jovem dos slaads, nascidos de ovos implantados em hospedeiros ou da desova no caótico plano do Limbo. Ao emergir, rastejam em busca de comida e de lugares escuros para crescer. São criaturas de instinto puro, famintas e agressivas apesar do tamanho. Com o tempo amadurecem em slaads adultos, levando consigo a natureza caótica da espécie."
 },
 "mefiteDeFumaca": {
  "id": "mefiteDeFumaca",
  "tipo": "elemental",
  "name": "Mefite de Fumaça",
  "nomeOriginal": "Smoke Mephit",
  "fonte": "MM",
  "size": "pequeno",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 6,
   "dex": 14,
   "con": 12,
   "int": 10,
   "wis": 10,
   "cha": 11
  },
  "ac": 12,
  "maxHp": 22,
  "hpDice": "5d6+5",
  "speedFt": 30,
  "flyFt": 30,
  "speeds": {
   "flyFt": 30
  },
  "senses": {
   "passivePerception": 12,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "damageImmunities": [
   "fogo",
   "veneno"
  ],
  "conditionImmunities": [
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Garras",
    "bonus": 4,
    "damage": "1d4+2",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "luzesDancantes"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "aVontade": [
    "luzesDancantes"
   ]
  },
  "acoesEspeciais": [
   {
    "nome": "Sopro de Cinzas",
    "recharge": [
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 15,
    "save": "dex",
    "dc": 10,
    "condition": "cego",
    "rounds": 1,
    "repete": false,
    "ateFimDoTurnoDele": true
   }
  ],
  "explosaoAoMorrer": {
   "pes": 5,
   "nuvem": true
  },
  "traits": [
   "explosaoAoMorrer"
  ],
  "blurb": "Voa ao redor dos inimigos arranhando com as garras e soprando cinzas ardentes que cegam quem estiver no cone. Ao morrer, deixa uma nuvem de fumaça que bloqueia a visão.",
  "lore": "Mefits da fumaça são pequenos elementais nascidos do encontro entre os planos do ar e do fogo. São preguiçosos, debochados e adoram zombar de outras criaturas. Costumam rondar chaminés, incêndios e cidades enfumaçadas. Raramente dizem a verdade e servem conjuradores apenas enquanto isso lhes convém."
 },
 "solar": {
  "id": "solar",
  "tipo": "celestial",
  "name": "Solar",
  "nomeOriginal": "Solar",
  "fonte": "MM",
  "size": "grande",
  "level": 21,
  "cr": "21",
  "xp": 33000,
  "abilities": {
   "str": 26,
   "dex": 22,
   "con": 26,
   "int": 25,
   "wis": 25,
   "cha": 30
  },
  "ac": 21,
  "acNote": "armadura natural",
  "maxHp": 243,
  "hpDice": "18d10+144",
  "speedFt": 50,
  "flyFt": 150,
  "speeds": {
   "flyFt": 150
  },
  "senses": {
   "passivePerception": 24,
   "truesightFt": 120
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
  "damageResistances": [
   "radiante",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "damageImmunities": [
   "necrótico",
   "veneno"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "exausto",
   "amedrontado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Espada Grande",
    "bonus": 15,
    "damage": "4d6+8",
    "type": "cortante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "6d8",
     "type": "radiante"
    }
   },
   {
    "name": "Arco Longo Exterminador",
    "bonus": 13,
    "damage": "2d8+6",
    "type": "perfurante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 150,
    "longRangeFt": 600,
    "onHit": {
     "save": "con",
     "dc": 15,
     "danoSeFalhar": {
      "damage": "6d8",
      "type": "radiante"
     },
     "metadeSePassar": false
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Espada Grande",
    "Espada Grande"
   ]
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "barreiraDeLaminas",
    "dissiparOBemEOMal",
    "ressurreicao",
    "comunhao",
    "detectarBemMal",
    "invisibilidade"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "barreiraDeLaminas": 3,
    "dissiparOBemEOMal": 3,
    "ressurreicao": 3,
    "comunhao": 1
   },
   "aVontade": [
    "detectarBemMal",
    "invisibilidade"
   ],
   "cdPorMagia": {
    "barreiraDeLaminas": 25,
    "dissiparOBemEOMal": 25,
    "ressurreicao": 25,
    "comunhao": 25,
    "detectarBemMal": 25,
    "invisibilidade": 25
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Espada Voadora",
    "tipo": "invocar",
    "opcoes": [
     {
      "id": "espadaVoadora",
      "dados": "1"
     }
    ],
    "porDia": 1
   },
   {
    "nome": "Toque Curativo",
    "porDia": 4,
    "tipo": "cura",
    "dados": "8d8+4"
   }
  ],
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Teletransporte",
     "custo": 1,
     "tipo": "teleporte",
     "alcanceFt": 120
    },
    {
     "nome": "Explosão Abrasadora",
     "custo": 2,
     "tipo": "area",
     "raioFt": 10,
     "save": "dex",
     "dc": 23,
     "damage": "4d6",
     "damageType": "fogo",
     "halfOnSave": true,
     "damage2": "4d6",
     "damageType2": "radiante",
     "soInimigos": true
    },
    {
     "nome": "Olhar Cegante",
     "custo": 3,
     "tipo": "alvo",
     "alcanceFt": 30,
     "save": "con",
     "dc": 15,
     "condition": "cego",
     "rounds": 100,
     "repete": false
    }
   ]
  },
  "traits": [
   "armasMagicas",
   "t_percepcaoDivina",
   "resistenciaAMagia",
   "acoesLendarias"
  ],
  "blurb": "Anjo supremo que combina espada grande, arco capaz de matar com uma flecha e uma espada que voa sozinha, tudo carregado de dano radiante. Teleporta-se, cega com o olhar e explode em fogo sagrado entre os turnos.",
  "lore": "O solar é o mais poderoso dos anjos, um fragmento da essência de um deus bondoso com glória quase divina. Fala-se que existem apenas vinte e quatro deles: alguns servem diretamente a divindades específicas, enquanto os demais permanecem em contemplação até que uma ameaça cósmica exija sua intervenção. Não precisa comer, beber nem dormir, e sua voz faz até príncipes demônios recuarem. Como todo anjo, age com convicção inabalável e não se curva a ninguém, vindo aos mortais para comandar, não para servir."
 },
 "aranha": {
  "id": "aranha",
  "tipo": "fera",
  "name": "Aranha",
  "nomeOriginal": "Spider",
  "fonte": "MM",
  "size": "miúdo",
  "level": 1,
  "cr": "0",
  "xp": 10,
  "abilities": {
   "str": 2,
   "dex": 14,
   "con": 8,
   "int": 1,
   "wis": 10,
   "cha": 2
  },
  "ac": 12,
  "maxHp": 1,
  "hpDice": "1d4-1",
  "speedFt": 20,
  "speeds": {
   "climbFt": 20
  },
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 30
  },
  "saves": [],
  "skills": [
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 4,
    "damage": "1d4",
    "type": "veneno",
    "reachFt": 5
   }
  ],
  "traits": [
   "spiderClimb",
   "webSense",
   "webWalker"
  ],
  "blurb": "Uma aranha minúscula que se esconde bem e morde com veneno fraco. Sozinha é pouco perigosa, mas sobe por paredes e tetos e percebe quem toca sua teia.",
  "lore": "Aranhas comuns vivem em cantos escuros, porões, florestas e cavernas, onde tecem teias para capturar insetos. Não têm inteligência real e agem por instinto, atacando só quando ameaçadas ou quando algo cai em sua teia. Magos às vezes as escolhem como familiares por causa de sua furtividade e da habilidade de escalar qualquer superfície."
 },
 "diaboEspinhoso": {
  "id": "diaboEspinhoso",
  "tipo": "corruptor",
  "name": "Diabo Espinhoso",
  "nomeOriginal": "Spined Devil",
  "fonte": "MM",
  "size": "pequeno",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 10,
   "dex": 15,
   "con": 12,
   "int": 11,
   "wis": 14,
   "cha": 8
  },
  "ac": 13,
  "acNote": "armadura natural",
  "maxHp": 22,
  "hpDice": "5d6+5",
  "speedFt": 20,
  "flyFt": 40,
  "speeds": {
   "flyFt": 40
  },
  "senses": {
   "passivePerception": 12,
   "darkvisionFt": 120
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "frio",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "damageImmunities": [
   "fogo",
   "veneno"
  ],
  "conditionImmunities": [
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 2,
    "damage": "2d4",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Forcado",
    "bonus": 2,
    "damage": "1d6",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Espinho da Cauda",
    "bonus": 4,
    "damage": "1d4+2",
    "type": "perfurante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 20,
    "longRangeFt": 80,
    "danoExtra": {
     "damage": "1d6",
     "type": "fogo"
    }
   }
  ],
  "multiattack": {
   "count": 2
  },
  "features": [
   "devilsSight"
  ],
  "traits": [
   "voaSemProvocar",
   "t_espinhosLimitados",
   "resistenciaAMagia"
  ],
  "blurb": "Voa em volta dos inimigos sem provocar ataques de oportunidade e dispara espinhos flamejantes da cauda à distância. De perto, morde e golpeia com seu forcado.",
  "lore": "O diabo espinhoso é um pequeno demônio alado dos Nove Infernos, coberto de espinhos e armado com um forcado. Costuma servir como batedor, mensageiro ou vigia para diabos mais poderosos. Prefere atacar do alto, lançando os espinhos da cauda, que pegam fogo ao voar. Rancoroso e covarde, evita combates justos e foge quando a situação piora."
 },
 "nagaEspiritual": {
  "id": "nagaEspiritual",
  "tipo": "monstruosidade",
  "name": "Naga Espiritual",
  "nomeOriginal": "Spirit Naga",
  "fonte": "MM",
  "size": "grande",
  "level": 5,
  "cr": "8",
  "xp": 3900,
  "abilities": {
   "str": 18,
   "dex": 17,
   "con": 14,
   "int": 16,
   "wis": 15,
   "cha": 16
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 75,
  "hpDice": "10d10+20",
  "speedFt": 40,
  "senses": {
   "passivePerception": 12,
   "darkvisionFt": 60
  },
  "saves": [
   "dex",
   "con",
   "wis",
   "cha"
  ],
  "skills": [],
  "expertise": [],
  "damageImmunities": [
   "veneno"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 7,
    "damage": "1d6+4",
    "type": "perfurante",
    "reachFt": 10,
    "onHit": {
     "save": "con",
     "dc": 13,
     "danoSeFalhar": {
      "damage": "7d8",
      "type": "veneno"
     },
     "metadeSePassar": true
    }
   }
  ],
  "spellcasting": {
   "ability": "int",
   "cantrips": [
    "maoMagica",
    "ilusaoMenor",
    "raioDeGelo"
   ],
   "prepared": [
    "enfeiticarPessoa",
    "detectarMagia",
    "sono",
    "detectarPensamentos",
    "imobilizarPessoa",
    "relampago",
    "respirarNaAgua",
    "praga",
    "dimensaoPorta",
    "dominarPessoa"
   ],
   "slots": [
    0,
    4,
    3,
    3,
    3,
    2
   ],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "cdPorMagia": {
    "maoMagica": 14,
    "ilusaoMenor": 14,
    "raioDeGelo": 14,
    "enfeiticarPessoa": 14,
    "detectarMagia": 14,
    "sono": 14,
    "detectarPensamentos": 14,
    "imobilizarPessoa": 14,
    "relampago": 14,
    "respirarNaAgua": 14,
    "praga": 14,
    "dimensaoPorta": 14,
    "dominarPessoa": 14
   }
  },
  "traits": [
   "t_rejuvenescimento"
  ],
  "blurb": "Conjuradora maligna que controla mentes com enfeitiçar e dominar pessoa, paralisa alvos e dispara relâmpagos, enquanto sua mordida injeta um veneno devastador. Mesmo morta, volta à vida dias depois.",
  "lore": "A naga espiritual é uma serpente gigantesca com rosto quase humano, movida pelo rancor e pela sede de poder. Esconde-se em cavernas e ruínas do Subterrâneo, onde trama vinganças contra quem a contrariou. Gosta de escravizar mentes fracas para que sirvam de guardas e espiões. Por renascer depois de morta, age com uma paciência e uma arrogância de quem se considera eterna."
 },
 "sprite": {
  "id": "sprite",
  "tipo": "feérico",
  "name": "Sprite",
  "nomeOriginal": "Sprite",
  "fonte": "MM",
  "size": "miúdo",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 3,
   "dex": 18,
   "con": 10,
   "int": 14,
   "wis": 13,
   "cha": 11
  },
  "ac": 15,
  "acNote": "armadura de couro",
  "maxHp": 2,
  "hpDice": "1d4",
  "speedFt": 10,
  "flyFt": 40,
  "speeds": {
   "flyFt": 40
  },
  "senses": {
   "passivePerception": 13
  },
  "saves": [],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "furtividade"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Espada Longa",
    "bonus": 2,
    "damage": 1,
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Arco Curto",
    "bonus": 6,
    "damage": 1,
    "type": "perfurante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 40,
    "longRangeFt": 160,
    "onHit": {
     "save": "con",
     "dc": 10,
     "condition": "envenenado",
     "rounds": 10,
     "repete": false
    }
   }
  ],
  "traits": [
   "t_visaoDoCoracao",
   "invisivelAVontade"
  ],
  "blurb": "Atiradora minúscula e invisível que dispara flechas envenenadas capazes de pôr o alvo para dormir. Frágil, foge e se esconde no ar antes de ser atingida.",
  "lore": "Fadas do tamanho de um dedo, com asas de libélula, que guardam bosques escondidos e vilarejos nos galhos de árvores e de treants. São guerreiras sérias e desconfiadas, que primeiro assustam os intrusos com ruídos na mata e depois os derrubam com flechas soníferas. Sentem as batidas do coração de uma criatura para julgar se ela é boa ou má. Preparam venenos e antídotos com ervas raras e apoiam aventureiros que combatem fadas malignas ou goblinoides."
 },
 "mefiteDeVapor": {
  "id": "mefiteDeVapor",
  "tipo": "elemental",
  "name": "Mefite de Vapor",
  "nomeOriginal": "Steam Mephit",
  "fonte": "MM",
  "size": "pequeno",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 5,
   "dex": 11,
   "con": 10,
   "int": 11,
   "wis": 10,
   "cha": 12
  },
  "ac": 10,
  "maxHp": 21,
  "hpDice": "6d6",
  "speedFt": 30,
  "flyFt": 30,
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
  "damageImmunities": [
   "fogo",
   "veneno"
  ],
  "conditionImmunities": [
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Garras",
    "bonus": 2,
    "damage": "1d4",
    "type": "cortante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d4",
     "type": "fogo"
    }
   }
  ],
  "breath": {
   "name": "Sopro de Vapor",
   "kind": "save",
   "shape": "cone",
   "areaFt": 15,
   "save": "dex",
   "dc": 10,
   "damage": "1d8",
   "damageType": "fogo",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    6
   ]
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "borrao"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "aVontade": [
    "borrao"
   ]
  },
  "explosaoAoMorrer": {
   "pes": 5,
   "save": "dex",
   "dc": 10,
   "dano": "1d8",
   "tipo": "fogo",
   "metade": false
  },
  "traits": [
   "explosaoAoMorrer"
  ],
  "blurb": "Arranha com garras escaldantes e solta um cone de vapor fervente; ao morrer, explode numa nuvem de vapor que queima quem estiver ao lado.",
  "lore": "Os mefites do vapor são pequenos elementais nascidos do encontro entre água e fogo, com corpos que soltam névoa quente sem parar. Costumam rondar fontes termais, gêiseres e regiões submersas aquecidas por vulcões. São arrogantes, mandões e adoram se gabar, embora fujam rápido quando a luta vira contra eles. Muitas vezes servem a conjuradores ou a criaturas elementais mais poderosas."
 },
 "giganteDePedra": {
  "id": "giganteDePedra",
  "tipo": "gigante",
  "name": "Gigante de Pedra",
  "nomeOriginal": "Stone Giant",
  "fonte": "MM",
  "size": "enorme",
  "level": 5,
  "cr": "7",
  "xp": 2900,
  "abilities": {
   "str": 23,
   "dex": 15,
   "con": 20,
   "int": 10,
   "wis": 12,
   "cha": 9
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 126,
  "hpDice": "11d12+55",
  "speedFt": 40,
  "senses": {
   "passivePerception": 14,
   "darkvisionFt": 60
  },
  "saves": [
   "dex",
   "con",
   "wis"
  ],
  "skills": [
   "atletismo",
   "percepcao"
  ],
  "expertise": [
   "atletismo"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Clava Grande",
    "bonus": 9,
    "damage": "3d8+6",
    "type": "concussão",
    "reachFt": 15
   },
   {
    "name": "Rocha",
    "bonus": 9,
    "damage": "4d10+6",
    "type": "concussão",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 60,
    "longRangeFt": 240,
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
   "count": 2,
   "sequence": [
    "Clava Grande",
    "Clava Grande"
   ]
  },
  "traits": [
   "camuflagemDePedra",
   "t_apanharRochas"
  ],
  "blurb": "Golpeia duas vezes com uma clava enorme de 4,5 m de alcance e arremessa rochas a grande distância que podem derrubar o alvo. Rochas lançadas contra ele podem ser apanhadas no ar.",
  "lore": "Gigantes de pedra são seres reclusos e contemplativos que habitam cavernas profundas nas montanhas, colinas e no Subterrâneo. Consideram o mundo da superfície um lugar efêmero, quase um sonho, e valorizam a arte esculpida na rocha. Mesclam-se às paredes rochosas com facilidade, emboscando intrusos. Costumam ser neutros e evitam conflitos, mas defendem seus territórios com força esmagadora e pedras arremessadas."
 },
 "golemDePedra": {
  "id": "golemDePedra",
  "tipo": "constructo",
  "name": "Golem de Pedra",
  "nomeOriginal": "Stone Golem",
  "fonte": "MM",
  "size": "grande",
  "level": 9,
  "cr": "10",
  "xp": 5900,
  "abilities": {
   "str": 22,
   "dex": 9,
   "con": 20,
   "int": 3,
   "wis": 11,
   "cha": 1
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 178,
  "hpDice": "17d10+85",
  "speedFt": 30,
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 120
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "damageImmunities": [
   "veneno",
   "psíquico",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageImmunitiesNote": "só de armas não mágicas",
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
    "bonus": 10,
    "damage": "3d8+6",
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
    "nome": "Lentidão",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "raio",
    "areaFt": 10,
    "save": "wis",
    "dc": 17,
    "condition": "lentificado",
    "rounds": 10,
    "repete": true
   }
  ],
  "traits": [
   "formaImutavel",
   "resistenciaAMagia",
   "armasMagicas"
  ],
  "blurb": "Um colosso de pedra que esmaga com dois golpes pesados e pode lançar uma magia de lentidão em quem estiver por perto. Resiste a magia e só é ferido por armas mágicas ou de adamante.",
  "lore": "O golem de pedra é um construto esculpido em rocha e animado por magia poderosa, geralmente para guardar templos, tumbas e cofres. Não pensa por conta própria e obedece fielmente às ordens de quem o criou, mesmo séculos depois. Fica imóvel como uma estátua até que um intruso desperte sua função. Não sente medo nem cansaço e luta até ser reduzido a escombros."
 },
 "giganteDaTempestade": {
  "id": "giganteDaTempestade",
  "tipo": "gigante",
  "name": "Gigante da Tempestade",
  "nomeOriginal": "Storm Giant",
  "fonte": "MM",
  "size": "enorme",
  "level": 13,
  "cr": "13",
  "xp": 10000,
  "abilities": {
   "str": 29,
   "dex": 14,
   "con": 20,
   "int": 16,
   "wis": 18,
   "cha": 18
  },
  "ac": 16,
  "acNote": "brunea",
  "maxHp": 230,
  "hpDice": "20d12+100",
  "speedFt": 50,
  "speeds": {
   "swimFt": 50
  },
  "senses": {
   "passivePerception": 19
  },
  "saves": [
   "str",
   "con",
   "wis",
   "cha"
  ],
  "skills": [
   "arcanismo",
   "atletismo",
   "historia",
   "percepcao"
  ],
  "expertise": [],
  "damageResistances": [
   "frio"
  ],
  "damageImmunities": [
   "elétrico",
   "trovejante"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Espada Grande",
    "bonus": 14,
    "damage": "6d6+9",
    "type": "cortante",
    "reachFt": 10
   },
   {
    "name": "Rocha",
    "bonus": 14,
    "damage": "4d12+9",
    "type": "concussão",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 60,
    "longRangeFt": 240
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Espada Grande",
    "Espada Grande"
   ]
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "respirarNaAgua",
    "detectarMagia",
    "quedaSuave",
    "levitacao",
    "luz"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "respirarNaAgua": 3
   },
   "aVontade": [
    "detectarMagia",
    "quedaSuave",
    "levitacao",
    "luz"
   ],
   "cdPorMagia": {
    "respirarNaAgua": 17,
    "detectarMagia": 17,
    "quedaSuave": 17,
    "levitacao": 17,
    "luz": 17
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Golpe de Relâmpago",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "raio",
    "areaFt": 500,
    "save": "dex",
    "dc": 17,
    "damage": "12d8",
    "damageType": "elétrico",
    "halfOnSave": true
   }
  ],
  "traits": [],
  "blurb": "Golpeia duas vezes com uma espada grande de alcance 3 m e arremessa rochas a distância, mas o maior perigo é o relâmpago que explode em área a até 150 m. Aguenta muito dano e ignora eletricidade e trovão.",
  "lore": "Os gigantes da tempestade são os mais poderosos e reclusos de sua raça, vivendo em castelos submersos, ilhas isoladas ou picos envoltos em nuvens. Muitos são videntes que leem presságios no céu e no mar. Costumam ser benevolentes, mas sua ira é tão violenta quanto um temporal. Raramente se envolvem com povos menores, a menos que vejam uma ameaça ao equilíbrio do mundo."
 },
 "sucubo": {
  "id": "sucubo",
  "tipo": "corruptor",
  "name": "Súcubo",
  "nomeOriginal": "Succubus",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "4",
  "xp": 1100,
  "abilities": {
   "str": 8,
   "dex": 17,
   "con": 13,
   "int": 15,
   "wis": 12,
   "cha": 20
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 66,
  "hpDice": "12d8+12",
  "speedFt": 30,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60
  },
  "senses": {
   "passivePerception": 15,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "enganacao",
   "intuicao",
   "percepcao",
   "persuasao",
   "furtividade"
  ],
  "expertise": [
   "enganacao",
   "intuicao",
   "percepcao",
   "persuasao",
   "furtividade"
  ],
  "damageResistances": [
   "frio",
   "fogo",
   "elétrico",
   "veneno",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Garra",
    "bonus": 5,
    "damage": "1d6+3",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "acoesEspeciais": [
   {
    "nome": "Enfeitiçar",
    "tipo": "alvo",
    "alcanceFt": 30,
    "save": "wis",
    "dc": 15,
    "condition": "enfeiticado",
    "rounds": 100,
    "repete": true,
    "imunizaAoPassar": true
   },
   {
    "nome": "Beijo Drenante",
    "tipo": "alvo",
    "alcanceFt": 5,
    "soComCondicao": "enfeiticado",
    "save": "con",
    "dc": 15,
    "damage": "5d10+5",
    "damageType": "psíquico",
    "halfOnSave": true,
    "reduzMaximo": true
   },
   {
    "nome": "Forma Etérea",
    "tipo": "etereo"
   }
  ],
  "traits": [
   "t_vinculoTelepatico",
   "metamorfo"
  ],
  "blurb": "Enfeitiça um humanoide a até 9 m e o faz obedecer, depois drena sua vida com um beijo que reduz o máximo de PV. Foge para o Plano Etéreo quando ameaçada e resiste a armas não mágicas.",
  "lore": "Corruptora infernal que se disfarça de mortal sedutor para desviar almas do bom caminho. Frequenta cidades, onde se infiltra entre nobres, artistas e devotos sob formas humanas. Prefere manipular a lutar, usando vítimas enfeitiçadas como servos e ferramentas. Mantém contato telepático com seus escravos mesmo de outros planos, sussurrando tentações até que a alma esteja perdida."
 },
 "enxameDeMorcegos": {
  "id": "enxameDeMorcegos",
  "tipo": "fera",
  "name": "Enxame de Morcegos",
  "nomeOriginal": "Swarm of Bats",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 5,
   "dex": 15,
   "con": 10,
   "int": 2,
   "wis": 12,
   "cha": 4
  },
  "ac": 12,
  "maxHp": 22,
  "hpDice": "5d8",
  "speedFt": 0,
  "flyFt": 30,
  "speeds": {
   "flyFt": 30
  },
  "senses": {
   "passivePerception": 11,
   "blindsightFt": 60
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
    "name": "Mordidas",
    "bonus": 4,
    "damage": "2d4",
    "type": "perfurante",
    "reachFt": 0,
    "danoMetade": "1d4"
   }
  ],
  "traits": [
   "echolocation",
   "keenHearing",
   "enxameDoLivro"
  ],
  "blurb": "Uma nuvem de morcegos que invade o espaço do alvo e o morde sem parar; resiste a armas comuns e perde força conforme é dispersada.",
  "lore": "São centenas de morcegos voando juntos como uma única massa barulhenta e faminta. Habitam cavernas, minas abandonadas, torres em ruínas e os sótãos de cidades antigas. Saem ao anoitecer e se orientam pelo eco dos próprios guinchos, o que os deixa perdidos diante do silêncio. Atacam quem perturba seus abrigos ou quem cruza seu caminho na escuridão."
 },
 "enxameDeBesouros": {
  "id": "enxameDeBesouros",
  "tipo": "fera",
  "name": "Enxame de Besouros",
  "nomeOriginal": "Swarm of Beetles",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1/2",
  "xp": 100,
  "abilities": {
   "str": 3,
   "dex": 13,
   "con": 10,
   "int": 1,
   "wis": 7,
   "cha": 1
  },
  "ac": 12,
  "acNote": "armadura natural",
  "maxHp": 22,
  "hpDice": "5d8",
  "speedFt": 20,
  "speeds": {
   "climbFt": 20,
   "burrowFt": 5
  },
  "senses": {
   "passivePerception": 8,
   "blindsightFt": 10
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
    "name": "Mordidas",
    "bonus": 3,
    "damage": "4d4",
    "type": "perfurante",
    "reachFt": 0,
    "danoMetade": "2d4"
   }
  ],
  "traits": [
   "enxameDoLivro"
  ],
  "blurb": "Uma massa de besouros que invade o espaço do alvo e o rói com mordidas; armas comuns pouco o afetam, mas ele enfraquece conforme perde PV.",
  "lore": "Milhares de besouros minúsculos se juntam e agem como uma só criatura faminta. Surgem em cavernas do Subterrâneo, florestas, pântanos, desertos e até nos porões das cidades. Escavam a terra e sobem paredes para alcançar presas, guiados por percepção às cegas. Não têm medo nem vontade própria, apenas avançam até devorar o que encontram ou serem dispersados."
 },
 "enxameDeSerpentesVenenosas": {
  "id": "enxameDeSerpentesVenenosas",
  "tipo": "fera",
  "name": "Enxame de Serpentes Venenosas",
  "nomeOriginal": "Swarm of Poisonous Snakes",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 8,
   "dex": 18,
   "con": 11,
   "int": 1,
   "wis": 10,
   "cha": 3
  },
  "ac": 14,
  "maxHp": 36,
  "hpDice": "8d8",
  "speedFt": 30,
  "speeds": {
   "swimFt": 30
  },
  "senses": {
   "passivePerception": 10,
   "blindsightFt": 10
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
    "name": "Mordidas",
    "bonus": 6,
    "damage": "2d6",
    "type": "perfurante",
    "reachFt": 0,
    "danoMetade": "1d6",
    "onHit": {
     "save": "con",
     "dc": 10,
     "danoSeFalhar": {
      "damage": "1d6",
      "type": "perfurante"
     },
     "metadeSePassar": true
    }
   }
  ],
  "traits": [
   "enxameDoLivro"
  ],
  "blurb": "Uma massa de cobras que invade o espaço do alvo e o morde sem parar, injetando veneno que causa muito dano mesmo quando o enxame já está enfraquecido. Resiste a armas comuns e ignora a maioria das condições.",
  "lore": "Esses enxames surgem quando dezenas de serpentes peçonhentas se juntam num ninho, numa toca ou num pântano infestado. Vivem em florestas densas e brejos, escondidas sob folhas, raízes e água rasa. Agem por instinto e atacam qualquer criatura que pise no seu território. Como se movem em conjunto, passam por frestas mínimas e cobrem o chão como um tapete vivo e sibilante."
 },
 "enxameDePiranhas": {
  "id": "enxameDePiranhas",
  "tipo": "fera",
  "name": "Enxame de Piranhas",
  "nomeOriginal": "Swarm of Quippers",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 13,
   "dex": 16,
   "con": 9,
   "int": 1,
   "wis": 7,
   "cha": 2
  },
  "ac": 13,
  "maxHp": 28,
  "hpDice": "8d8-8",
  "speedFt": 0,
  "speeds": {
   "swimFt": 40
  },
  "senses": {
   "passivePerception": 8,
   "darkvisionFt": 60
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
    "name": "Mordidas",
    "bonus": 5,
    "damage": "4d6",
    "type": "perfurante",
    "reachFt": 0,
    "danoMetade": "2d6"
   }
  ],
  "traits": [
   "frenesiDeSangue",
   "enxameDoLivro",
   "t_respiracaoAquatica"
  ],
  "blurb": "Uma nuvem de peixes vorazes que envolve a vítima na água e a dilacera com mordidas; fica ainda mais perigosa contra quem já está ferido. Resiste a armas comuns e enfraquece conforme perde PV.",
  "lore": "Piranhas são peixes pequenos de dentes afiados que caçam em grandes cardumes em rios e lagos. Sozinhas são pouco ameaçadoras, mas juntas atacam qualquer coisa que entre na água. O cheiro de sangue as deixa em frenesi, e um animal ferido pode ser reduzido a ossos em instantes. Não conseguem sair da água, então quem chega à margem fica a salvo."
 },
 "enxameDeCorvos": {
  "id": "enxameDeCorvos",
  "tipo": "fera",
  "name": "Enxame de Corvos",
  "nomeOriginal": "Swarm of Ravens",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 6,
   "dex": 14,
   "con": 8,
   "int": 3,
   "wis": 12,
   "cha": 6
  },
  "ac": 12,
  "maxHp": 24,
  "hpDice": "7d8-7",
  "speedFt": 10,
  "flyFt": 50,
  "speeds": {
   "flyFt": 50
  },
  "senses": {
   "passivePerception": 15
  },
  "saves": [],
  "skills": [
   "percepcao"
  ],
  "expertise": [
   "percepcao"
  ],
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
    "name": "Bicadas",
    "bonus": 4,
    "damage": "2d6",
    "type": "perfurante",
    "reachFt": 5,
    "danoMetade": "1d6"
   }
  ],
  "traits": [
   "enxameDoLivro"
  ],
  "blurb": "Uma nuvem de corvos que envolve o alvo e o bica sem parar, difícil de ferir com armas comuns. Perde força conforme é dispersado.",
  "lore": "Bandos de corvos se reúnem em grandes revoadas sobre florestas, pântanos, colinas e até cidades. Atraídos por carniça ou instigados por magia sombria, mergulham sobre viajantes em massa. Agem como uma só criatura, cercando a vítima numa tempestade de penas e bicos. Quando muitos caem, o restante tende a se espalhar."
 },
 "enxameDeAranhas": {
  "id": "enxameDeAranhas",
  "tipo": "fera",
  "name": "Enxame de Aranhas",
  "nomeOriginal": "Swarm of Spiders",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1/2",
  "xp": 100,
  "abilities": {
   "str": 3,
   "dex": 13,
   "con": 10,
   "int": 1,
   "wis": 7,
   "cha": 1
  },
  "ac": 12,
  "acNote": "armadura natural",
  "maxHp": 22,
  "hpDice": "5d8",
  "speedFt": 20,
  "speeds": {
   "climbFt": 20
  },
  "senses": {
   "passivePerception": 8,
   "blindsightFt": 10
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
    "name": "Picadas",
    "bonus": 3,
    "damage": "4d4",
    "type": "perfurante",
    "reachFt": 0,
    "danoMetade": "2d4"
   }
  ],
  "traits": [
   "enxameDoLivro",
   "spiderClimb",
   "webSense",
   "webWalker"
  ],
  "blurb": "Uma massa fervilhante de aranhas que invade o espaço do alvo e o cobre de picadas, causando bastante dano enquanto está inteira. Armas comuns pouco a ferem, e ela escala paredes e tetos com facilidade.",
  "lore": "Milhares de aranhas minúsculas agindo como uma única criatura faminta. Elas infestam cavernas, porões, florestas e ruínas, geralmente perto de grandes teias. Sem inteligência ou medo, avançam sobre qualquer presa que perturbe seu ninho. Cortar ou esmagar algumas poucas não detém o resto."
 },
 "enxameDeVespas": {
  "id": "enxameDeVespas",
  "tipo": "fera",
  "name": "Enxame de Vespas",
  "nomeOriginal": "Swarm of Wasps",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1/2",
  "xp": 100,
  "abilities": {
   "str": 3,
   "dex": 13,
   "con": 10,
   "int": 1,
   "wis": 7,
   "cha": 1
  },
  "ac": 12,
  "acNote": "armadura natural",
  "maxHp": 22,
  "hpDice": "5d8",
  "speedFt": 5,
  "flyFt": 30,
  "speeds": {
   "flyFt": 30
  },
  "senses": {
   "passivePerception": 8,
   "blindsightFt": 10
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
    "name": "Picadas",
    "bonus": 3,
    "damage": "4d4",
    "type": "perfurante",
    "reachFt": 0,
    "danoMetade": "2d4"
   }
  ],
  "traits": [
   "enxameDoLivro"
  ],
  "blurb": "Uma nuvem zumbidora que invade o espaço do alvo e o pica sem parar, causando muito dano enquanto está inteira. Resiste a armas comuns e ignora quase todas as condições de controle.",
  "lore": "Vespas furiosas costumam se reunir em grandes nuvens quando o ninho é perturbado ou alguém invade seu território. Aparecem em florestas, campos, pântanos e até em cidades e ruínas. O enxame não pensa nem negocia: persegue quem estiver por perto até que ele fuja ou caia. Golpes de espada pouco adiantam contra tantos insetos pequenos, e fogo ou magia de área costumam ser a melhor saída."
 },
 "tarrasque": {
  "id": "tarrasque",
  "tipo": "monstruosidade",
  "name": "Tarrasque",
  "nomeOriginal": "Tarrasque",
  "fonte": "MM",
  "size": "imenso",
  "level": 29,
  "cr": "30",
  "xp": 155000,
  "abilities": {
   "str": 30,
   "dex": 11,
   "con": 30,
   "int": 3,
   "wis": 11,
   "cha": 11
  },
  "ac": 25,
  "acNote": "armadura natural",
  "maxHp": 676,
  "hpDice": "33d20+330",
  "speedFt": 40,
  "senses": {
   "passivePerception": 10,
   "blindsightFt": 120
  },
  "saves": [
   "int",
   "wis",
   "cha"
  ],
  "skills": [],
  "expertise": [],
  "damageImmunities": [
   "fogo",
   "veneno",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageImmunitiesNote": "só de armas não mágicas",
  "conditionImmunities": [
   "enfeitiçado",
   "amedrontado",
   "paralisado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 19,
    "damage": "4d12+10",
    "type": "perfurante",
    "reachFt": 10,
    "onHit": {
     "semResistencia": true,
     "dc": 20,
     "escape": 20,
     "condition": "contido",
     "note": "é agarrado"
    }
   },
   {
    "name": "Garra",
    "bonus": 19,
    "damage": "4d8+10",
    "type": "cortante",
    "reachFt": 15
   },
   {
    "name": "Chifres",
    "bonus": 19,
    "damage": "4d10+10",
    "type": "perfurante",
    "reachFt": 10
   },
   {
    "name": "Cauda",
    "bonus": 19,
    "damage": "4d6+10",
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
   "count": 5,
   "sequence": [
    "Mordida",
    "Garra",
    "Garra",
    "Chifres",
    "Cauda"
   ]
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "presencaAterradora": {
   "dc": 17,
   "alcanceFt": 120
  },
  "acoesEspeciais": [
   {
    "nome": "Engolir",
    "tipo": "engolir",
    "tamanhoMax": "large",
    "dano": "16d6",
    "tipoDano": "ácido",
    "regurgita": {
     "dano": 60,
     "dc": 20
    }
   }
  ],
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
     "nome": "Mover",
     "custo": 1,
     "tipo": "mover",
     "metade": true,
     "semOportunidade": false
    },
    {
     "nome": "Abocanhar",
     "custo": 2,
     "tipo": "golpe",
     "arma": "Mordida"
    }
   ]
  },
  "traits": [
   "presencaAterradora",
   "resistenciaAMagia",
   "carapacaRefletora",
   "monstroDeCerco",
   "acoesLendarias"
  ],
  "blurb": "Um titã quase invulnerável que despedaça tudo ao alcance com cinco ataques por turno, engole criaturas inteiras e ainda pode devolver feitiços ao conjurador. Armas comuns não o ferem, e sua mera presença aterroriza exércitos.",
  "lore": "O tarrasque é visto como o pior flagelo do Plano Material, e muitos acreditam que existe apenas um. É um réptil colossal bípede, com cerca de 15 metros de altura, que anda curvado como uma ave de rapina e se equilibra na cauda imensa. Passa décadas ou séculos adormecido em um covil oculto nas profundezas da terra. Quando desperta, por motivos que ninguém compreende, emerge faminto e devora cidades inteiras. Algumas religiões o tratam como instrumento do castigo divino."
 },
 "thriKreen": {
  "id": "thriKreen",
  "tipo": "humanoide",
  "name": "Thri-kreen",
  "nomeOriginal": "Thri-kreen",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 12,
   "dex": 15,
   "con": 13,
   "int": 8,
   "wis": 12,
   "cha": 7
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 33,
  "hpDice": "6d8+6",
  "speedFt": 40,
  "senses": {
   "passivePerception": 13,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "percepcao",
   "furtividade",
   "sobrevivencia"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 3,
    "damage": "1d6+1",
    "type": "perfurante",
    "reachFt": 5,
    "onHit": {
     "save": "con",
     "dc": 11,
     "condition": "envenenado",
     "rounds": 10,
     "repete": true
    }
   },
   {
    "name": "Garras",
    "bonus": 3,
    "damage": "2d4+1",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Mordida",
    "Garras"
   ]
  },
  "traits": [
   "camuflagemGeral",
   "t_saltoParado"
  ],
  "blurb": "Caçador insetoide que salta longe e ataca com garras e uma mordida venenosa capaz de paralisar quem falhar feio na resistência. Some na paisagem graças à carapaça camuflada.",
  "lore": "Os thri-kreen são humanoides insetoides que percorrem desertos e savanas, mantendo distância das demais raças. Conversam entre si estalando as mandíbulas e mexendo as antenas, e com estrangeiros recorrem a desenhos na areia ou figuras feitas de gravetos. Enxergam quase todo ser vivo como possível refeição, com predileção por carne de elfo, mas poupam quem lhes pareça útil e nunca matam por diversão. Não dormem, descansando alertas, e vivem em média só uns trinta anos."
 },
 "tigre": {
  "id": "tigre",
  "tipo": "fera",
  "name": "Tigre",
  "nomeOriginal": "Tiger",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 17,
   "dex": 15,
   "con": 14,
   "int": 3,
   "wis": 12,
   "cha": 8
  },
  "ac": 12,
  "maxHp": 37,
  "hpDice": "5d10+10",
  "speedFt": 40,
  "senses": {
   "passivePerception": 13,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "furtividade"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 5,
    "damage": "1d10+3",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Garra",
    "bonus": 5,
    "damage": "1d8+3",
    "type": "cortante",
    "reachFt": 5,
    "investida": {
     "pes": 20,
     "save": "str",
     "dc": 13,
     "mordeSeCair": "Mordida"
    }
   }
  ],
  "traits": [
   "keenSmell"
  ],
  "blurb": "Predador furtivo que avança em linha reta para derrubar a presa com as garras e mordê-la em seguida. Perigoso contra alvos isolados que ele consegue jogar no chão.",
  "lore": "O tigre é um grande felino caçador que domina florestas e campos de capim alto. Caça sozinho, aproximando-se em silêncio graças à pelagem listrada que se confunde com a vegetação. Enxerga bem no escuro e fareja presas a grande distância. Quando ataca, salta de uma vez sobre a vítima para derrubá-la antes que ela reaja."
 },
 "ente": {
  "id": "ente",
  "tipo": "planta",
  "name": "Ente",
  "nomeOriginal": "Treant",
  "fonte": "MM",
  "size": "enorme",
  "level": 9,
  "cr": "9",
  "xp": 5000,
  "abilities": {
   "str": 23,
   "dex": 8,
   "con": 21,
   "int": 12,
   "wis": 16,
   "cha": 12
  },
  "ac": 16,
  "acNote": "armadura natural",
  "maxHp": 138,
  "hpDice": "12d12+60",
  "speedFt": 30,
  "senses": {
   "passivePerception": 13
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "concussão",
   "perfurante"
  ],
  "damageVulnerabilities": [
   "fogo"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Pancada",
    "bonus": 10,
    "damage": "3d6+6",
    "type": "concussão",
    "reachFt": 5
   },
   {
    "name": "Rocha",
    "bonus": 10,
    "damage": "4d10+6",
    "type": "concussão",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 60,
    "longRangeFt": 180
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
    "nome": "Animar Árvores",
    "porDia": 1,
    "tipo": "invocar",
    "opcoes": [
     {
      "id": "ente",
      "dados": "1d2"
     }
    ]
   }
  ],
  "traits": [
   "aparenciaFalsa",
   "monstroDeCerco"
  ],
  "blurb": "Árvore desperta e colossal que esmaga inimigos com dois golpes de galhos, arremessa rochas a longa distância e desperta árvores próximas para lutar ao seu lado. Resiste a concussão e perfuração, mas o fogo a fere em dobro.",
  "lore": "Entes são árvores que ganharam consciência em florestas antigas, impregnadas de magia natural, depois de séculos de meditação silenciosa. Com o despertar, surgem um rosto na casca, pernas no tronco e braços nos galhos, e a criatura se solta da terra para proteger seu bosque. Passam a maior parte do tempo imóveis como árvores comuns, mas percebem o que acontece a quilômetros pelas mudanças sutis ao redor. Toleram quem usa a floresta com respeito, mas reagem com fúria contra incendiários, envenenadores e quem derruba grandes árvores."
 },
 "guerreiroTribal": {
  "id": "guerreiroTribal",
  "tipo": "humanoide",
  "name": "Guerreiro Tribal",
  "nomeOriginal": "Tribal Warrior",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1/8",
  "xp": 25,
  "abilities": {
   "str": 13,
   "dex": 11,
   "con": 12,
   "int": 8,
   "wis": 11,
   "cha": 8
  },
  "ac": 12,
  "acNote": "armadura de couro batido",
  "maxHp": 11,
  "hpDice": "2d8+2",
  "speedFt": 30,
  "senses": {
   "passivePerception": 10
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Lança",
    "bonus": 3,
    "damage": "1d6+1",
    "type": "perfurante",
    "reachFt": 5,
    "rangeFt": 20,
    "longRangeFt": 60,
    "danoExtra": {
     "damage": "1d8+1",
     "type": "perfurante"
    }
   }
  ],
  "traits": [
   "packTactics"
  ],
  "blurb": "Luta em bando, ganhando vantagem quando um aliado está colado no alvo. Usa a lança corpo a corpo ou a arremessa à distância.",
  "lore": "Vive longe das cidades, em tribos que sobrevivem da caça e da pesca. Obedece ao chefe da tribo, geralmente o guerreiro mais forte ou mais velho, ou alguém tido como escolhido pelos deuses. Pode ser encontrado em quase qualquer ambiente selvagem, das montanhas geladas aos desertos. Sozinho é fraco, mas raramente anda sozinho."
 },
 "triceratops": {
  "id": "triceratops",
  "tipo": "fera",
  "name": "Tricerátops",
  "nomeOriginal": "Triceratops",
  "fonte": "MM",
  "size": "enorme",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 22,
   "dex": 9,
   "con": 17,
   "int": 2,
   "wis": 11,
   "cha": 5
  },
  "ac": 13,
  "acNote": "armadura natural",
  "maxHp": 95,
  "hpDice": "10d12+30",
  "speedFt": 50,
  "senses": {
   "passivePerception": 10
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Chifrada",
    "bonus": 9,
    "damage": "4d8+6",
    "type": "perfurante",
    "reachFt": 5,
    "investida": {
     "pes": 20,
     "save": "str",
     "dc": 13,
     "mordeSeCair": "Pisotear"
    }
   },
   {
    "name": "Pisotear",
    "bonus": 9,
    "damage": "3d10+6",
    "type": "concussão",
    "reachFt": 5
   }
  ],
  "traits": [],
  "blurb": "Investe em linha reta para cravar os chifres e derrubar o alvo, depois o esmaga com as patas enquanto ele está no chão. Cada chifrada e pisoteio arranca mais de 20 PV.",
  "lore": "O tricerátops é um dinossauro herbívoro enorme, coberto por um escudo ósseo e armado com três chifres. Vive em manadas nas planícies e pradarias de terras primitivas e perdidas. Não caça, mas é extremamente territorial e agressivo com quem se aproxima dos filhotes. Diante de uma ameaça, abaixa a cabeça e dispara numa carga capaz de atropelar quase qualquer coisa."
 },
 "tridrone": {
  "id": "tridrone",
  "tipo": "constructo",
  "name": "Tridrone",
  "nomeOriginal": "Tridrone",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1/2",
  "xp": 100,
  "abilities": {
   "str": 12,
   "dex": 13,
   "con": 12,
   "int": 9,
   "wis": 10,
   "cha": 9
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 16,
  "hpDice": "3d8+3",
  "speedFt": 30,
  "senses": {
   "passivePerception": 10,
   "truesightFt": 120
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Punho",
    "bonus": 3,
    "damage": "1d4+1",
    "type": "concussão",
    "reachFt": 5
   },
   {
    "name": "Azagaia",
    "bonus": 3,
    "damage": "1d6+1",
    "type": "perfurante",
    "reachFt": 5,
    "rangeFt": 30,
    "longRangeFt": 120
   }
  ],
  "multiattack": {
   "count": 3
  },
  "traits": [
   "t_menteAxiomatica",
   "t_desintegracao"
  ],
  "blurb": "Um modron triangular de três braços que desfere três socos ou arremessa três azagaias por turno. Sua visão verdadeira de 36 m impede que ilusões e invisibilidade o enganem.",
  "lore": "Tridrones são modrons de terceiro escalão, corpos em forma de pirâmide com três braços, três pernas e três olhos. Habitam Mechanus, o plano da ordem absoluta, onde supervisionam os monodrones e duodrones abaixo deles e obedecem sem hesitar aos superiores. Marcham em formação, executando ordens com precisão mecânica. Quando um deles se corrompe e passa a agir por conta própria, os demais modrons o caçam até destruí-lo."
 },
 "troglodita": {
  "id": "troglodita",
  "tipo": "humanoide",
  "name": "Troglodita",
  "nomeOriginal": "Troglodyte",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 14,
   "dex": 10,
   "con": 14,
   "int": 6,
   "wis": 10,
   "cha": 6
  },
  "ac": 11,
  "acNote": "armadura natural",
  "maxHp": 13,
  "hpDice": "2d8+4",
  "speedFt": 30,
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 4,
    "damage": "1d4+2",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Garra",
    "bonus": 4,
    "damage": "1d4+2",
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
  "aura": {
   "raioFt": 5,
   "quando": "inicioDoAlvo",
   "save": "con",
   "dc": 12,
   "condition": "envenenado",
   "imunizaAoPassar": true
  },
  "traits": [
   "camuflagemGeral",
   "aura",
   "sunlightSensitivity"
  ],
  "blurb": "Ataca com uma mordida e duas garras por turno, e seu fedor pode deixar envenenado quem começa o turno colado nele. Fica fraco sob a luz do sol.",
  "lore": "Trogloditas são humanoides brutais que ocupam as camadas mais rasas do Subterrâneo e vivem em guerra com tudo ao redor, inclusive entre si. Suas cavernas são imundas, cheias de restos de comida e secreções, e seus territórios são marcados com ossos e desenhos feitos de sangue ou esterco. Incapazes de planejar a longo prazo, sobrevivem de caçadas e ataques constantes, sentindo prazer cruel em capturar e devorar criaturas mais fracas. Quase nada fabricam, pilhando o que precisam das vítimas, e disputam armas de metal até a morte. Alguns cultuam Laogzed, um demônio sapo-lagarto gordo e adormecido no Abismo, cuja saciedade eterna eles sonham alcançar."
 },
 "troll": {
  "id": "troll",
  "tipo": "gigante",
  "name": "Troll",
  "nomeOriginal": "Troll",
  "fonte": "MM",
  "size": "grande",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 18,
   "dex": 13,
   "con": 20,
   "int": 7,
   "wis": 9,
   "cha": 7
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 84,
  "hpDice": "8d10+40",
  "speedFt": 30,
  "senses": {
   "passivePerception": 12,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 7,
    "damage": "1d6+4",
    "type": "perfurante",
    "reachFt": 5
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
  "regeneracao": {
   "pv": 10,
   "bloqueia": [
    "fogo",
    "ácido"
   ],
   "naoMorreA0": true
  },
  "traits": [
   "keenSmell",
   "regeneracaoDoLivro"
  ],
  "blurb": "Avança sem medo e rasga com uma mordida e duas garras por turno, curando 10 PV a cada rodada. Só fogo ou ácido impedem que ele se levante de novo.",
  "lore": "Trolls são gigantes famintos que devoram qualquer coisa que consigam abater. Não formam sociedades, mas se alugam como mercenários a orcs, ogros, ettins, bruxas e gigantes em troca de comida e tesouro, sem nunca obedecer de verdade. Suas feridas se fecham diante dos olhos, e membros decepados podem seguir lutando por conta própria até serem recolocados. Odeiam quem os fere com fogo ou ácido e priorizam esses inimigos com fúria. A regeneração constante às vezes gera mutações bizarras, como uma segunda cabeça brotando do pescoço cortado."
 },
 "tiranossauroRex": {
  "id": "tiranossauroRex",
  "tipo": "fera",
  "name": "Tiranossauro Rex",
  "nomeOriginal": "Tyrannosaurus Rex",
  "fonte": "MM",
  "size": "enorme",
  "level": 5,
  "cr": "8",
  "xp": 3900,
  "abilities": {
   "str": 25,
   "dex": 10,
   "con": 19,
   "int": 2,
   "wis": 12,
   "cha": 9
  },
  "ac": 13,
  "acNote": "armadura natural",
  "maxHp": 136,
  "hpDice": "13d12+52",
  "speedFt": 50,
  "senses": {
   "passivePerception": 14
  },
  "saves": [],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 10,
    "damage": "4d12+7",
    "type": "perfurante",
    "reachFt": 10,
    "onHit": {
     "semResistencia": true,
     "dc": 17,
     "escape": 17,
     "condition": "contido",
     "note": "é agarrado"
    }
   },
   {
    "name": "Cauda",
    "bonus": 10,
    "damage": "3d8+7",
    "type": "concussão",
    "reachFt": 10
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Mordida",
    "Cauda"
   ]
  },
  "traits": [],
  "blurb": "Um predador colossal que abocanha e prende presas médias ou menores enquanto varre outro inimigo com a cauda. Cada mordida causa dano devastador.",
  "lore": "O tiranossauro é um dos maiores caçadores entre os dinossauros, um carnívoro de porte enorme que domina as planícies e campos abertos. Movido pela fome, persegue qualquer criatura que pareça comestível e raramente desiste de uma caçada. Sua mandíbula esmaga ossos com facilidade, e ele costuma sacudir a vítima presa entre os dentes. Apesar da pouca inteligência, seus sentidos aguçados o tornam difícil de despistar."
 },
 "ultroloth": {
  "id": "ultroloth",
  "tipo": "corruptor",
  "name": "Ultroloth",
  "nomeOriginal": "Ultroloth",
  "fonte": "MM",
  "size": "médio",
  "level": 13,
  "cr": "13",
  "xp": 10000,
  "abilities": {
   "str": 16,
   "dex": 16,
   "con": 18,
   "int": 18,
   "wis": 15,
   "cha": 19
  },
  "ac": 19,
  "acNote": "armadura natural",
  "maxHp": 153,
  "hpDice": "18d8+72",
  "speedFt": 30,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60
  },
  "senses": {
   "passivePerception": 17,
   "truesightFt": 120
  },
  "saves": [],
  "skills": [
   "intimidacao",
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "damageResistances": [
   "frio",
   "fogo",
   "elétrico",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "damageImmunities": [
   "ácido",
   "veneno"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "amedrontado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Espada Longa",
    "bonus": 8,
    "damage": "1d8+3",
    "type": "cortante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d10+3",
     "type": "cortante"
    }
   }
  ],
  "multiattack": {
   "count": 3
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "dimensaoPorta",
    "medo",
    "muralhaDeFogo",
    "tempestadeDeFogo",
    "sugestaoEmMassa",
    "alterarAparencia",
    "clarividencia",
    "escuridao",
    "detectarMagia",
    "detectarPensamentos",
    "dissiparMagia",
    "invisibilidade",
    "sugestao"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "dimensaoPorta": 3,
    "medo": 3,
    "muralhaDeFogo": 3,
    "tempestadeDeFogo": 1,
    "sugestaoEmMassa": 1
   },
   "aVontade": [
    "alterarAparencia",
    "clarividencia",
    "escuridao",
    "detectarMagia",
    "detectarPensamentos",
    "dissiparMagia",
    "invisibilidade",
    "sugestao"
   ],
   "cdPorMagia": {
    "dimensaoPorta": 17,
    "medo": 17,
    "muralhaDeFogo": 17,
    "tempestadeDeFogo": 17,
    "sugestaoEmMassa": 17,
    "alterarAparencia": 17,
    "clarividencia": 17,
    "escuridao": 17,
    "detectarMagia": 17,
    "detectarPensamentos": 17,
    "dissiparMagia": 17,
    "invisibilidade": 17,
    "sugestao": 17
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Olhar Hipnótico",
    "tipo": "alvo",
    "alcanceFt": 30,
    "save": "wis",
    "dc": 17,
    "condition": "enfeiticado",
    "rounds": 1,
    "repete": false,
    "ateFimDoTurnoDele": true,
    "imunizaAoPassar": true
   },
   {
    "nome": "Teleporte",
    "tipo": "teleporte",
    "alcanceFt": 60
   }
  ],
  "traits": [
   "resistenciaAMagia",
   "armasMagicas"
  ],
  "blurb": "Comandante yugoloth que paralisa um alvo com o olhar hipnótico enquanto desfere três golpes de espada longa, e ainda se teleporta e conjura tempestade de fogo e sugestão em massa.",
  "lore": "Os ultroloths estão no topo da hierarquia dos yugoloths, demônios mercenários das planícies neutras e malignas do Hades e da Geena. Parecem figuras esguias, de rosto sem traços, com olhos que cintilam como opalas. Comandam exércitos de yugoloths menores e vendem seus serviços a quem pagar melhor, sem lealdade a ninguém. Frios e manipuladores, preferem dobrar mentes com magia a lutar abertamente."
 },
 "brutamonteUmbral": {
  "id": "brutamonteUmbral",
  "tipo": "monstruosidade",
  "name": "Brutamonte Umbral",
  "nomeOriginal": "Umber Hulk",
  "fonte": "MM",
  "size": "grande",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 20,
   "dex": 13,
   "con": 16,
   "int": 9,
   "wis": 10,
   "cha": 10
  },
  "ac": 18,
  "acNote": "armadura natural",
  "maxHp": 93,
  "hpDice": "11d10+33",
  "speedFt": 30,
  "speeds": {
   "burrowFt": 20
  },
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 120,
   "tremorsenseFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Garra",
    "bonus": 8,
    "damage": "1d8+5",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Mandíbulas",
    "bonus": 8,
    "damage": "2d8+5",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Garra",
    "Garra",
    "Mandíbulas"
   ]
  },
  "aura": {
   "raioFt": 30,
   "quando": "inicioDoAlvo",
   "save": "cha",
   "dc": 15,
   "condition": "desnorteado",
   "imunizaAoPassar": false,
   "rounds": 1
  },
  "traits": [
   "aura",
   "escavador"
  ],
  "blurb": "Irrompe das paredes de rocha e rasga os alvos com duas garras e mandíbulas poderosas. Seu olhar confunde quem começa o turno perto dele, fazendo a vítima ficar parada, vagar sem rumo ou atacar um aliado.",
  "lore": "O brutamonte umbral é uma monstruosidade das profundezas que escava túneis pela rocha atrás de comida, invadindo cavernas, masmorras e povoados do Subterrâneo. Gosta de se esconder dentro das paredes, sentindo pelas antenas a passagem das presas, e então explode para fora numa chuva de pedras. Sua carapaça de quitina aguenta os desmoronamentos que costuma provocar. Como seu olhar embaralha a memória, poucos sobreviventes lembram do ataque, e entre os povos do Subterrâneo ele virou uma lenda sombria sobre exploradores que somem sem deixar rastro."
 },
 "unicornio": {
  "id": "unicornio",
  "tipo": "celestial",
  "name": "Unicórnio",
  "nomeOriginal": "Unicorn",
  "fonte": "MM",
  "size": "grande",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 18,
   "dex": 14,
   "con": 15,
   "int": 11,
   "wis": 17,
   "cha": 16
  },
  "ac": 12,
  "maxHp": 67,
  "hpDice": "9d10+18",
  "speedFt": 50,
  "senses": {
   "passivePerception": 13,
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
   "paralisado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Cascos",
    "bonus": 7,
    "damage": "2d6+4",
    "type": "concussão",
    "reachFt": 5
   },
   {
    "name": "Chifre",
    "bonus": 7,
    "damage": "1d8+4",
    "type": "perfurante",
    "reachFt": 5,
    "investida": {
     "pes": 20,
     "save": "str",
     "dc": 15,
     "dano": "2d8",
     "tipo": "perfurante"
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Cascos",
    "Chifre"
   ]
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "acalmarEmocoes",
    "dissiparOBemEOMal",
    "emaranhar",
    "detectarBemMal",
    "arteDruidica",
    "passosSemPegadas"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "acalmarEmocoes": 1,
    "dissiparOBemEOMal": 1,
    "emaranhar": 1
   },
   "aVontade": [
    "detectarBemMal",
    "arteDruidica",
    "passosSemPegadas"
   ],
   "cdPorMagia": {
    "acalmarEmocoes": 14,
    "dissiparOBemEOMal": 14,
    "emaranhar": 14,
    "detectarBemMal": 14,
    "arteDruidica": 14,
    "passosSemPegadas": 14
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Toque Curativo",
    "porDia": 3,
    "tipo": "cura",
    "dados": "2d8+2"
   },
   {
    "nome": "Teletransporte",
    "porDia": 1,
    "tipo": "etereo"
   }
  ],
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Cascos",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Cascos"
    },
    {
     "nome": "Escudo Cintilante",
     "custo": 2,
     "tipo": "escudo",
     "bonus": 2,
     "alcanceFt": 60
    },
    {
     "nome": "Autocura",
     "custo": 3,
     "tipo": "curaPropria",
     "dados": "2d8+2"
    }
   ]
  },
  "traits": [
   "resistenciaAMagia",
   "armasMagicas",
   "acoesLendarias"
  ],
  "blurb": "Investe em linha reta para chifrar e derrubar o alvo, depois alterna cascos e chifre; cura aliados, protege-os com escudos cintilantes e resiste bem à magia.",
  "lore": "O unicórnio é um celestial, não um cavalo, enviado por deuses bondosos para guardar florestas encantadas e lugares sagrados. Em seu domínio nada passa despercebido, e os animais e as fadas locais vivem em paz sob sua proteção. Recebe bem quem tem bom coração, mas raramente deixa sair vivo quem traz maldade. Seu chifre de marfim concentra poder divino, e quem ajuda a matar um unicórnio costuma atrair a ira dos deuses. Em tempos sombrios, pode servir de montaria a um campeão sagrado, abandonando-o se ele se desviar do bem."
 },
 "vampiro": {
  "id": "vampiro",
  "tipo": "morto-vivo",
  "name": "Vampiro",
  "nomeOriginal": "Vampire",
  "fonte": "MM",
  "size": "médio",
  "level": 13,
  "cr": "13",
  "xp": 10000,
  "abilities": {
   "str": 18,
   "dex": 18,
   "con": 18,
   "int": 17,
   "wis": 15,
   "cha": 18
  },
  "ac": 16,
  "acNote": "armadura natural",
  "maxHp": 144,
  "hpDice": "17d8+68",
  "speedFt": 30,
  "senses": {
   "passivePerception": 17,
   "darkvisionFt": 120
  },
  "saves": [
   "dex",
   "wis",
   "cha"
  ],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "damageResistances": [
   "necrótico",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Golpe Desarmado",
    "bonus": 9,
    "damage": "1d8+4",
    "type": "concussão",
    "reachFt": 5
   },
   {
    "name": "Mordida",
    "bonus": 9,
    "damage": "1d6+4",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "3d6",
     "type": "necrótico"
    }
   }
  ],
  "multiattack": {
   "count": 2
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "acoesEspeciais": [
   {
    "nome": "Enfeitiçar",
    "tipo": "alvo",
    "alcanceFt": 30,
    "save": "wis",
    "dc": 17,
    "condition": "enfeiticado",
    "rounds": 10,
    "repete": true
   },
   {
    "nome": "Filhos da Noite",
    "porDia": 1,
    "tipo": "invocar",
    "opcoes": [
     {
      "id": "enxameDeMorcegos",
      "dados": "2d4"
     },
     {
      "id": "enxameDeRatos",
      "dados": "2d4"
     }
    ],
    "demoraDados": "1d4",
    "semSol": true
   }
  ],
  "regeneracao": {
   "pv": 20,
   "bloqueia": [
    "radiante"
   ]
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Mover",
     "custo": 1,
     "tipo": "mover",
     "metade": false,
     "semOportunidade": true
    },
    {
     "nome": "Golpe Desarmado",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Golpe Desarmado"
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
   "metamorfo",
   "t_fugaEnevoada",
   "regeneracaoDoLivro",
   "spiderClimb",
   "t_fraquezasVampiricas",
   "acoesLendarias"
  ],
  "blurb": "Agarra a vítima com golpes desarmados e a morde para drenar vida, regenerando-se a cada turno e enfeitiçando inimigos. Radiante, água benta, luz do sol e água corrente são suas fraquezas.",
  "lore": "Vampiros são mortos-vivos que despertaram para uma noite sem fim e se alimentam do sangue dos vivos. Não têm sombra nem reflexo e evitam a luz do sol, que os queima. Seus sentimentos antigos apodrecem em obsessões, e eles colecionam objetos e pessoas que simbolizam o que desejam. Cada um fica preso a um caixão ou túmulo onde precisa descansar de dia, geralmente escondido sob castelos ou mansões fortificadas guardadas por crias vampíricas."
 },
 "criaVampirica": {
  "id": "criaVampirica",
  "tipo": "morto-vivo",
  "name": "Cria Vampírica",
  "nomeOriginal": "Vampire Spawn",
  "fonte": "MM",
  "size": "médio",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 16,
   "dex": 16,
   "con": 16,
   "int": 11,
   "wis": 10,
   "cha": 12
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 82,
  "hpDice": "11d8+33",
  "speedFt": 30,
  "senses": {
   "passivePerception": 13,
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
  "expertise": [],
  "damageResistances": [
   "necrótico",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 6,
    "damage": "1d6+3",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "2d6",
     "type": "necrótico"
    }
   },
   {
    "name": "Garras",
    "bonus": 6,
    "damage": "2d4+3",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2
  },
  "regeneracao": {
   "pv": 10,
   "bloqueia": [
    "radiante"
   ]
  },
  "traits": [
   "regeneracaoDoLivro",
   "spiderClimb",
   "t_fraquezasVampiricas"
  ],
  "blurb": "Agarra a vítima com as garras e depois a morde, drenando vida para se curar; regenera 10 PV por turno a menos que sofra dano radiante ou esteja ao sol.",
  "lore": "Uma cria vampírica é alguém que um vampiro matou e trouxe de volta como servo morto-vivo. Ela conserva lembranças e idiomas de quando estava viva, mas sua vontade pertence ao mestre que a criou. Ronda cidades e túneis subterrâneos à noite, caçando para saciar uma sede constante de sangue. Herda as fraquezas do criador e teme a luz do sol, a água corrente e a estaca de madeira."
 },
 "vampiroConjurador": {
  "id": "vampiroConjurador",
  "tipo": "morto-vivo",
  "name": "Vampiro Conjurador",
  "nomeOriginal": "Vampire Spellcaster",
  "fonte": "MM",
  "size": "médio",
  "level": 13,
  "cr": "15",
  "xp": 13000,
  "abilities": {
   "str": 18,
   "dex": 18,
   "con": 18,
   "int": 17,
   "wis": 15,
   "cha": 18
  },
  "ac": 16,
  "acNote": "armadura natural",
  "maxHp": 144,
  "hpDice": "17d8+68",
  "speedFt": 30,
  "senses": {
   "passivePerception": 17,
   "darkvisionFt": 120
  },
  "saves": [
   "dex",
   "wis",
   "cha"
  ],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "damageResistances": [
   "necrótico",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Golpe Desarmado",
    "bonus": 9,
    "damage": "1d8+4",
    "type": "concussão",
    "reachFt": 5
   },
   {
    "name": "Mordida",
    "bonus": 9,
    "damage": "1d6+4",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "3d6",
     "type": "necrótico"
    }
   }
  ],
  "multiattack": {
   "count": 2
  },
  "spellcasting": {
   "ability": "int",
   "cantrips": [
    "maoMagica",
    "prestidigitacao",
    "raioDeGelo"
   ],
   "prepared": [
    "compreenderIdiomas",
    "nevoaObscurecente",
    "sono",
    "detectarPensamentos",
    "lufadaDeVento",
    "imagemEspelhada",
    "animarMortos",
    "rogarMaldicao",
    "indetectavel",
    "praga",
    "invisibilidadeMaior",
    "dominarPessoa"
   ],
   "slots": [
    0,
    4,
    3,
    3,
    3,
    1
   ],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "cdPorMagia": {
    "maoMagica": 16,
    "prestidigitacao": 16,
    "raioDeGelo": 16,
    "compreenderIdiomas": 16,
    "nevoaObscurecente": 16,
    "sono": 16,
    "detectarPensamentos": 16,
    "lufadaDeVento": 16,
    "imagemEspelhada": 16,
    "animarMortos": 16,
    "rogarMaldicao": 16,
    "indetectavel": 16,
    "praga": 16,
    "invisibilidadeMaior": 16,
    "dominarPessoa": 16
   }
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "acoesEspeciais": [
   {
    "nome": "Enfeitiçar",
    "tipo": "alvo",
    "alcanceFt": 30,
    "save": "wis",
    "dc": 17,
    "condition": "enfeiticado",
    "rounds": 10,
    "repete": true
   },
   {
    "nome": "Filhos da Noite",
    "porDia": 1,
    "tipo": "invocar",
    "opcoes": [
     {
      "id": "enxameDeMorcegos",
      "dados": "2d4"
     },
     {
      "id": "enxameDeRatos",
      "dados": "2d4"
     }
    ],
    "demoraDados": "1d4",
    "semSol": true
   }
  ],
  "regeneracao": {
   "pv": 20,
   "bloqueia": [
    "radiante"
   ]
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Mover",
     "custo": 1,
     "tipo": "mover",
     "metade": false,
     "semOportunidade": true
    },
    {
     "nome": "Golpe Desarmado",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Golpe Desarmado"
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
   "metamorfo",
   "t_fugaNebulosa",
   "regeneracaoDoLivro",
   "spiderClimb",
   "t_fraquezasVampiricas",
   "acoesLendarias"
  ],
  "blurb": "Vampiro que soma garras, mordida drenante e encanto a magias de mago como invisibilidade maior, praga e dominar pessoa. Regenera 20 PV por turno e foge como névoa ao cair, então luz solar, dano radiante e água corrente são as chaves para destruí-lo.",
  "lore": "Alguns vampiros estudaram as artes arcanas em vida e continuaram aperfeiçoando-as depois da maldição. Eles governam covis em cidades e castelos, usando feitiços para espionar, esconder-se e subjugar mortais. Calculistas e pacientes, preferem manipular de longe e só se expor quando a vitória é certa. Sempre mantêm um local de descanso protegido, para onde retornam quando derrotados."
 },
 "vampiroGuerreiro": {
  "id": "vampiroGuerreiro",
  "tipo": "morto-vivo",
  "name": "Vampiro Guerreiro",
  "nomeOriginal": "Vampire Warrior",
  "fonte": "MM",
  "size": "médio",
  "level": 13,
  "cr": "15",
  "xp": 13000,
  "abilities": {
   "str": 18,
   "dex": 18,
   "con": 18,
   "int": 17,
   "wis": 15,
   "cha": 18
  },
  "ac": 18,
  "acNote": "armadura de placas",
  "maxHp": 144,
  "hpDice": "17d8+68",
  "speedFt": 30,
  "senses": {
   "passivePerception": 17,
   "darkvisionFt": 120
  },
  "saves": [
   "dex",
   "wis",
   "cha"
  ],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "damageResistances": [
   "necrótico",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Golpe Desarmado (Só Forma Vampírica)",
    "bonus": 9,
    "damage": "1d8+4",
    "type": "concussão",
    "reachFt": 5
   },
   {
    "name": "Espada Grande",
    "bonus": 9,
    "damage": "2d6+4",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Mordida (Só Forma de Morcego ou Vampírica)",
    "bonus": 9,
    "damage": "1d6+4",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "3d6",
     "type": "necrótico"
    }
   }
  ],
  "multiattack": {
   "count": 2
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "acoesEspeciais": [
   {
    "nome": "Enfeitiçar",
    "tipo": "alvo",
    "alcanceFt": 30,
    "save": "wis",
    "dc": 17,
    "condition": "enfeiticado",
    "rounds": 10,
    "repete": true
   },
   {
    "nome": "Filhos da Noite",
    "porDia": 1,
    "tipo": "invocar",
    "opcoes": [
     {
      "id": "enxameDeMorcegos",
      "dados": "2d4"
     },
     {
      "id": "enxameDeRatos",
      "dados": "2d4"
     }
    ],
    "demoraDados": "1d4",
    "semSol": true
   }
  ],
  "regeneracao": {
   "pv": 20,
   "bloqueia": [
    "radiante"
   ]
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Mover",
     "custo": 1,
     "tipo": "mover",
     "metade": false,
     "semOportunidade": true
    },
    {
     "nome": "Golpe Desarmado",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Golpe Desarmado (Só Forma Vampírica)"
    },
    {
     "nome": "Mordida (Custa 2 Ações)",
     "custo": 2,
     "tipo": "golpe",
     "arma": "Mordida (Só Forma de Morcego ou Vampírica)"
    }
   ]
  },
  "traits": [
   "metamorfo",
   "t_fugaNebulosa",
   "regeneracaoDoLivro",
   "spiderClimb",
   "t_fraquezasVampiricas",
   "acoesLendarias"
  ],
  "blurb": "Combate com espada grande em dois golpes por turno, agarra e morde para drenar vida e se curar. Regenera 20 PV por turno e foge em forma de névoa quando derrubado, mas sofre com luz solar, água corrente e dano radiante.",
  "lore": "É um vampiro que manteve na morte a disciplina e o gosto pelo combate de quando era soldado ou cavaleiro. Veste armadura pesada e empunha espada grande, mas conserva todos os poderes e fraquezas de sua espécie. Costuma assombrar cidades, caçando à noite e voltando ao seu local de descanso antes do amanhecer. Quem morre drenado por ele pode se erguer como cria vampírica a seu serviço."
 },
 "vrock": {
  "id": "vrock",
  "tipo": "corruptor",
  "name": "Vrock",
  "nomeOriginal": "Vrock",
  "fonte": "MM",
  "size": "grande",
  "level": 5,
  "cr": "6",
  "xp": 2300,
  "abilities": {
   "str": 17,
   "dex": 15,
   "con": 18,
   "int": 8,
   "wis": 13,
   "cha": 8
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 104,
  "hpDice": "11d10+44",
  "speedFt": 40,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60
  },
  "senses": {
   "passivePerception": 11,
   "darkvisionFt": 120
  },
  "saves": [
   "dex",
   "wis",
   "cha"
  ],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "frio",
   "fogo",
   "elétrico",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "damageImmunities": [
   "veneno"
  ],
  "conditionImmunities": [
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Bico",
    "bonus": 6,
    "damage": "2d6+3",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Garras",
    "bonus": 6,
    "damage": "2d10+3",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Bico",
    "Garras"
   ]
  },
  "acoesEspeciais": [
   {
    "nome": "Esporos",
    "recharge": [
     6
    ],
    "tipo": "area",
    "shape": "raio",
    "areaFt": 15,
    "save": "con",
    "dc": 14,
    "damage": "1d10",
    "damageType": "veneno",
    "halfOnSave": false,
    "condition": "envenenado",
    "rounds": 10,
    "repete": true
   },
   {
    "nome": "Guincho Atordoante",
    "porDia": 1,
    "tipo": "area",
    "shape": "raio",
    "areaFt": 20,
    "save": "con",
    "dc": 14,
    "condition": "atordoado",
    "rounds": 1,
    "repete": false,
    "ateFimDoTurnoDele": true
   }
  ],
  "traits": [
   "resistenciaAMagia"
  ],
  "blurb": "Demônio abutre que mergulha do céu para bicar e rasgar com as garras, espalhando esporos venenosos e soltando um guincho capaz de atordoar quem estiver por perto.",
  "lore": "O vrock é um demônio do Abismo com corpo de homem e cabeça e asas de abutre gigante. Cruel e pouco inteligente, adora causar destruição e caos ao lado de outros de sua espécie. Costuma atacar em bandos, sobrevoando o campo de batalha e descendo sobre as presas mais fracas. Sua resistência à magia e às armas comuns o torna um adversário difícil de derrubar."
 },
 "abutre": {
  "id": "abutre",
  "tipo": "fera",
  "name": "Abutre",
  "nomeOriginal": "Vulture",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "0",
  "xp": 10,
  "abilities": {
   "str": 7,
   "dex": 10,
   "con": 13,
   "int": 2,
   "wis": 12,
   "cha": 4
  },
  "ac": 10,
  "maxHp": 5,
  "hpDice": "1d8+1",
  "speedFt": 10,
  "flyFt": 50,
  "speeds": {
   "flyFt": 50
  },
  "senses": {
   "passivePerception": 13
  },
  "saves": [],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Bico",
    "bonus": 2,
    "damage": "1d4",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "traits": [
   "keenSightSmell",
   "packTactics"
  ],
  "blurb": "Ave carniceira fraca que ataca em bando, ganhando vantagem quando um aliado está ao lado do alvo. Sozinha, quase não oferece perigo.",
  "lore": "O abutre é uma ave necrófaga comum em planícies, colinas e desertos. Circula no alto por longos períodos, guiado pela visão aguçada e pelo faro, à procura de carcaças ou de criaturas feridas demais para reagir. Raramente enfrenta presas saudáveis e prefere esperar que a morte faça o trabalho. Quando decide atacar, o faz em grupo, cercando a vítima e bicando sem parar."
 },
 "cavaloDeGuerra": {
  "id": "cavaloDeGuerra",
  "tipo": "fera",
  "name": "Cavalo de Guerra",
  "nomeOriginal": "Warhorse",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "1/2",
  "xp": 100,
  "abilities": {
   "str": 18,
   "dex": 12,
   "con": 13,
   "int": 2,
   "wis": 12,
   "cha": 7
  },
  "ac": 11,
  "maxHp": 19,
  "hpDice": "3d10+3",
  "speedFt": 60,
  "senses": {
   "passivePerception": 11
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Cascos",
    "bonus": 6,
    "damage": "2d6+4",
    "type": "concussão",
    "reachFt": 5,
    "investida": {
     "pes": 20,
     "save": "str",
     "dc": 14
    }
   }
  ],
  "traits": [],
  "blurb": "Investe em linha reta para derrubar o alvo com os cascos e pisoteá-lo enquanto está no chão. Rápido e forte, é perigoso em campo aberto.",
  "lore": "O cavalo de guerra é uma montaria grande e musculosa, criada e treinada para não fugir do barulho e do sangue das batalhas. É comum em cidades, castelos e acampamentos militares, sempre ao lado de cavaleiros e soldados montados. Obedece ao cavaleiro e avança contra os inimigos sem hesitar. Pode receber bardas de couro a placas, que aumentam sua CA sem mudar seu ND."
 },
 "esqueletoDeCavaloDeGuerra": {
  "id": "esqueletoDeCavaloDeGuerra",
  "tipo": "morto-vivo",
  "name": "Esqueleto de Cavalo de Guerra",
  "nomeOriginal": "Warhorse Skeleton",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "1/2",
  "xp": 100,
  "abilities": {
   "str": 18,
   "dex": 12,
   "con": 15,
   "int": 2,
   "wis": 8,
   "cha": 5
  },
  "ac": 13,
  "acNote": "restos de barda",
  "maxHp": 22,
  "hpDice": "3d10+6",
  "speedFt": 60,
  "senses": {
   "passivePerception": 9,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "damageImmunities": [
   "veneno"
  ],
  "damageVulnerabilities": [
   "concussão"
  ],
  "conditionImmunities": [
   "exausto",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Cascos",
    "bonus": 6,
    "damage": "2d6+4",
    "type": "concussão",
    "reachFt": 5
   }
  ],
  "traits": [],
  "blurb": "Montaria morta-viva veloz que esmaga inimigos com cascos pesados. Frágil contra golpes de concussão.",
  "lore": "É a ossada animada de um cavalo de batalha, ainda presa a pedaços da antiga armadura. Necromantes e cavaleiros mortos-vivos o usam como montaria incansável. Obedece sem hesitar a quem o ergueu e não sente medo, dor nem fadiga. Costuma rondar campos de batalha esquecidos e fortalezas sombrias."
 },
 "elementalDaAgua": {
  "id": "elementalDaAgua",
  "tipo": "elemental",
  "name": "Elemental da Água",
  "nomeOriginal": "Water Elemental",
  "fonte": "MM",
  "size": "grande",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 18,
   "dex": 14,
   "con": 18,
   "int": 5,
   "wis": 10,
   "cha": 8
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 114,
  "hpDice": "12d10+48",
  "speedFt": 30,
  "speeds": {
   "swimFt": 90
  },
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "ácido",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "damageImmunities": [
   "veneno"
  ],
  "conditionImmunities": [
   "exausto",
   "agarrado",
   "paralisado",
   "petrificado",
   "envenenado",
   "caido",
   "contido",
   "inconsciente"
  ],
  "attacks": [
   {
    "name": "Pancada",
    "bonus": 7,
    "damage": "2d8+4",
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
    "nome": "Engolfar",
    "recharge": [
     4,
     5,
     6
    ],
    "tipo": "area",
    "shape": "raio",
    "areaFt": 5,
    "save": "str",
    "dc": 15,
    "damage": "2d8+4",
    "damageType": "concussão",
    "halfOnSave": false,
    "condition": "agarrado",
    "rounds": 10,
    "repete": false
   }
  ],
  "traits": [
   "formaFluida",
   "congela"
  ],
  "blurb": "Uma onda viva que esmaga com golpes pesados e engole quem estiver em seu espaço, afogando e prendendo as vítimas. O frio a deixa lenta.",
  "lore": "É a essência dos mares e rios ganhando forma de uma grande massa de água revolta. Costuma surgir em costas, pântanos e profundezas submersas, geralmente invocada por magos ou nascida de lugares onde o Plano da Água toca o mundo. Tem pouca inteligência e age como uma maré furiosa, avançando sobre os inimigos e arrastando-os para dentro de si. Fala apenas aquano."
 },
 "doninha": {
  "id": "doninha",
  "tipo": "fera",
  "name": "Doninha",
  "nomeOriginal": "Weasel",
  "fonte": "MM",
  "size": "miúdo",
  "level": 1,
  "cr": "0",
  "xp": 10,
  "abilities": {
   "str": 3,
   "dex": 16,
   "con": 8,
   "int": 2,
   "wis": 12,
   "cha": 3
  },
  "ac": 13,
  "maxHp": 1,
  "hpDice": "1d4-1",
  "speedFt": 30,
  "senses": {
   "passivePerception": 13
  },
  "saves": [],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 5,
    "damage": 1,
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "traits": [
   "keenHearingSmell"
  ],
  "blurb": "Pequena, ágil e difícil de notar, a doninha morde com precisão, mas causa dano mínimo. Seu verdadeiro valor está nos sentidos apurados e na furtividade.",
  "lore": "A doninha é um mamífero minúsculo e esguio, comum em campos, bosques e celeiros. Caça roedores e pássaros, esgueirando-se por tocas e frestas estreitas. Costuma fugir de ameaças maiores, mas reage com mordidas rápidas quando encurralada. Magos às vezes a escolhem como familiar por sua discrição e faro aguçado."
 },
 "homemUrso": {
  "id": "homemUrso",
  "tipo": "humanoide",
  "name": "Homem-Urso",
  "nomeOriginal": "Werebear",
  "fonte": "MM",
  "size": "médio",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 19,
   "dex": 10,
   "con": 17,
   "int": 11,
   "wis": 12,
   "cha": 12
  },
  "ac": 10,
  "acNote": "armadura natural (forma de urso ou híbrida)",
  "maxHp": 135,
  "hpDice": "18d8+54",
  "speedFt": 30,
  "senses": {
   "passivePerception": 17
  },
  "saves": [],
  "skills": [
   "percepcao"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageImmunitiesNote": "só de armas não mágicas",
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 7,
    "damage": "2d10+4",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Garra",
    "bonus": 7,
    "damage": "2d8+4",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Machado Grande",
    "bonus": 7,
    "damage": "1d12+4",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2
  },
  "traits": [
   "metamorfo",
   "keenSmell"
  ],
  "blurb": "Combatente brutal que alterna machado grande e garras, com mordida capaz de transmitir a licantropia. Só armas mágicas ou prateadas o ferem de verdade.",
  "lore": "O lobisomem-urso é um humano amaldiçoado que pode assumir a forma de um grande urso ou de um híbrido entre homem e fera. Ao contrário de outros licantropos, costuma ser solitário e de boa índole, protegendo florestas, colinas e terras geladas de quem as ameaça. Evita cidades e prefere viver isolado, tratando os animais selvagens como seus protegidos. Quando provocado, porém, luta com fúria devastadora."
 },
 "homemJavali": {
  "id": "homemJavali",
  "tipo": "humanoide",
  "name": "Homem-Javali",
  "nomeOriginal": "Wereboar",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "4",
  "xp": 1100,
  "abilities": {
   "str": 17,
   "dex": 10,
   "con": 15,
   "int": 10,
   "wis": 11,
   "cha": 8
  },
  "ac": 10,
  "acNote": "10 na forma humanoide; armadura natural (11) nas formas de javali ou híbrida",
  "maxHp": 78,
  "hpDice": "12d8+24",
  "speedFt": 30,
  "senses": {
   "passivePerception": 12
  },
  "saves": [],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "damageImmunities": [
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageImmunitiesNote": "só de armas não mágicas",
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Marreta",
    "bonus": 5,
    "damage": "2d6+3",
    "type": "concussão",
    "reachFt": 5
   },
   {
    "name": "Presas",
    "bonus": 5,
    "damage": "2d6+3",
    "type": "cortante",
    "reachFt": 5,
    "investida": {
     "pes": 15,
     "save": "str",
     "dc": 13,
     "dano": "2d6",
     "tipo": "cortante"
    }
   }
  ],
  "multiattack": {
   "count": 2
  },
  "traits": [
   "metamorfo",
   "relentless"
  ],
  "blurb": "Investe em linha reta para rasgar com as presas e derrubar o alvo, depois castiga com a marreta. Só armas mágicas ou prateadas o ferem de verdade, e ele resiste a cair uma vez por descanso.",
  "lore": "O javali-lobisomem é um humano amaldiçoado pela licantropia, capaz de assumir a forma de um javali ou de um híbrido brutal. Costuma viver em campos, florestas e colinas, muitas vezes em pequenos clãs rústicos e desconfiados de forasteiros. É temperamental e agressivo, e reage a qualquer provocação com fúria cega. Quem sobrevive às suas presas pode acabar carregando a mesma maldição."
 },
 "homemRato": {
  "id": "homemRato",
  "tipo": "humanoide",
  "name": "Homem-Rato",
  "nomeOriginal": "Wererat",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 10,
   "dex": 15,
   "con": 12,
   "int": 11,
   "wis": 10,
   "cha": 8
  },
  "ac": 12,
  "maxHp": 33,
  "hpDice": "6d8+6",
  "speedFt": 30,
  "senses": {
   "passivePerception": 12,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "damageImmunities": [
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageImmunitiesNote": "só de armas não mágicas",
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 4,
    "damage": "1d4+2",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Espada Curta",
    "bonus": 4,
    "damage": "1d6+2",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Besta de Mão",
    "bonus": 4,
    "damage": "1d6+2",
    "type": "perfurante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 30,
    "longRangeFt": 120
   }
  ],
  "multiattack": {
   "count": 2
  },
  "traits": [
   "metamorfo",
   "keenSmell"
  ],
  "blurb": "Ataca com espada curta e besta de mão ou morde na forma híbrida, e sua mordida pode transmitir a licantropia. Só armas mágicas ou de prata o ferem de verdade.",
  "lore": "Homens-ratos são licantropos astutos e mesquinhos que escondem a maldição sob uma aparência humana comum. Costumam viver nos esgotos e becos das cidades, mas também em florestas próximas a povoados. Organizam-se em bandos que agem como guildas de ladrões, espionando e roubando nas sombras. Preferem emboscadas e fuga rápida a lutas abertas, muitas vezes cercados de ratos comuns."
 },
 "homemTigre": {
  "id": "homemTigre",
  "tipo": "humanoide",
  "name": "Homem-Tigre",
  "nomeOriginal": "Weretiger",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "4",
  "xp": 1100,
  "abilities": {
   "str": 17,
   "dex": 15,
   "con": 16,
   "int": 10,
   "wis": 13,
   "cha": 11
  },
  "ac": 12,
  "maxHp": 120,
  "hpDice": "16d8+48",
  "speedFt": 30,
  "senses": {
   "passivePerception": 15,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageImmunitiesNote": "só de armas não mágicas",
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 5,
    "damage": "1d10+3",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Garra",
    "bonus": 5,
    "damage": "1d8+3",
    "type": "cortante",
    "reachFt": 5,
    "investida": {
     "pes": 15,
     "save": "str",
     "dc": 14,
     "mordeSeCair": "Mordida"
    }
   },
   {
    "name": "Cimitarra",
    "bonus": 5,
    "damage": "1d6+3",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Arco Longo",
    "bonus": 4,
    "damage": "1d8+2",
    "type": "perfurante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 150,
    "longRangeFt": 600
   }
  ],
  "multiattack": {
   "count": 2
  },
  "traits": [
   "metamorfo",
   "keenHearingSmell"
  ],
  "blurb": "Caçador paciente que salta sobre a presa para derrubá-la e morder, ou luta com cimitarras e arco longo. Só armas mágicas ou prateadas o ferem de verdade, e sua mordida transmite a licantropia.",
  "lore": "O tigre-lobisomem é um humano amaldiçoado que pode assumir a forma de tigre ou de um híbrido entre homem e fera. Costuma viver isolado em savanas, florestas e desertos, perto de povoados onde troca mercadorias. É orgulhoso e seletivo, preferindo a companhia de outros de sua espécie. Caça por prazer e evita espalhar a maldição, embora a transmita com a mordida."
 },
 "lobisomem": {
  "id": "lobisomem",
  "tipo": "humanoide",
  "name": "Lobisomem",
  "nomeOriginal": "Werewolf",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 15,
   "dex": 13,
   "con": 14,
   "int": 10,
   "wis": 11,
   "cha": 10
  },
  "ac": 11,
  "acNote": "11 em forma humanoide; 12 (armadura natural) em forma de lobo ou híbrida",
  "maxHp": 58,
  "hpDice": "9d8+18",
  "speedFt": 30,
  "senses": {
   "passivePerception": 14
  },
  "saves": [],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageImmunitiesNote": "só de armas não mágicas",
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 4,
    "damage": "1d8+2",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Garras",
    "bonus": 4,
    "damage": "2d4+2",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Lança",
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
   }
  ],
  "multiattack": {
   "count": 2
  },
  "traits": [
   "metamorfo",
   "keenHearingSmell"
  ],
  "blurb": "Caçador feroz que alterna entre homem, lobo e fera híbrida, atacando com mordida e garras. Só armas mágicas ou prateadas o ferem de verdade, e sua mordida pode transmitir a maldição da licantropia.",
  "lore": "O lobisomem é um humano amaldiçoado que se transforma em lobo ou em uma criatura meio homem, meio lobo. Vive em florestas e colinas, muitas vezes escondendo sua natureza entre aldeões durante o dia. Quando a fera desperta, caça com selvageria e prazer cruel, perseguindo presas pelo faro. Muitos formam matilhas e espalham a maldição a quem sobrevive às suas mordidas."
 },
 "filhoteDeDragaoBranco": {
  "id": "filhoteDeDragaoBranco",
  "tipo": "dragão",
  "name": "Filhote de Dragão Branco",
  "nomeOriginal": "White Dragon Wyrmling",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 14,
   "dex": 10,
   "con": 14,
   "int": 5,
   "wis": 10,
   "cha": 11
  },
  "ac": 16,
  "acNote": "armadura natural",
  "maxHp": 32,
  "hpDice": "5d8+10",
  "speedFt": 30,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60,
   "swimFt": 30,
   "burrowFt": 15
  },
  "senses": {
   "passivePerception": 14,
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
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "frio"
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
     "type": "frio"
    }
   }
  ],
  "breath": {
   "name": "Sopro Gélido",
   "kind": "save",
   "shape": "cone",
   "areaFt": 15,
   "save": "con",
   "dc": 12,
   "damage": "5d8",
   "damageType": "frio",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    5,
    6
   ]
  },
  "traits": [],
  "blurb": "Morde com presas geladas e, quando pode, cospe um cone de granizo que castiga quem estiver perto. Voa rápido, nada e escava, então escolhe bem por onde atacar.",
  "lore": "É a forma mais jovem do dragão branco, o mais bestial e menos esperto dos dragões cromáticos. Nasce em regiões geladas, como geleiras, picos nevados e cavernas de gelo. Age mais por instinto e fome do que por astúcia, caçando presas menores e atacando de emboscada sob a neve. Mesmo pequeno, já é cruel e territorial, e guarda com zelo qualquer tesouro que encontre."
 },
 "fogoFatuo": {
  "id": "fogoFatuo",
  "tipo": "morto-vivo",
  "name": "Fogo-Fátuo",
  "nomeOriginal": "Will-o'-Wisp",
  "fonte": "MM",
  "size": "miúdo",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 1,
   "dex": 28,
   "con": 10,
   "int": 13,
   "wis": 14,
   "cha": 11
  },
  "ac": 19,
  "maxHp": 22,
  "hpDice": "9d4",
  "speedFt": 0,
  "flyFt": 50,
  "hover": true,
  "speeds": {
   "flyFt": 50
  },
  "senses": {
   "passivePerception": 12,
   "darkvisionFt": 120
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "ácido",
   "frio",
   "fogo",
   "necrótico",
   "trovejante",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "damageImmunities": [
   "elétrico",
   "veneno"
  ],
  "conditionImmunities": [
   "exausto",
   "agarrado",
   "paralisado",
   "envenenado",
   "caido",
   "contido",
   "inconsciente"
  ],
  "attacks": [
   {
    "name": "Choque",
    "bonus": 4,
    "damage": "2d8",
    "type": "elétrico",
    "reachFt": 5
   }
  ],
  "traits": [
   "invisivelAVontade",
   "consumirVida",
   "t_efemero",
   "incorporealMovement",
   "t_iluminacaoVariavel"
  ],
  "blurb": "Luz flutuante difícil de acertar que dispara choques elétricos de 2d8 e some na invisibilidade; quem cai a 0 PV perto dela pode ter a vida devorada.",
  "lore": "O fogo-fátuo é a alma de alguém maligno que morreu em sofrimento em terras impregnadas de magia, agora preso como uma bola de luz trêmula. Assombra pântanos, campos de batalha cobertos de ossos e lugares ermos. À distância parece a lanterna de um viajante, e usa essa falsa promessa de abrigo para atrair vítimas até areia movediça, covis de monstros e emboscadas. Alimenta-se do medo e da agonia dos que morrem, e muitas vezes se alia a bruxas, onis, dragões negros e cultistas. Quase nunca fala e, quando fala, sua voz é um sussurro distante."
 },
 "koboldAlado": {
  "id": "koboldAlado",
  "tipo": "humanoide",
  "name": "Kobold Alado",
  "nomeOriginal": "Winged Kobold",
  "fonte": "MM",
  "size": "pequeno",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 7,
   "dex": 16,
   "con": 9,
   "int": 8,
   "wis": 7,
   "cha": 8
  },
  "ac": 13,
  "maxHp": 7,
  "hpDice": "3d6-3",
  "speedFt": 30,
  "flyFt": 30,
  "speeds": {
   "flyFt": 30
  },
  "senses": {
   "passivePerception": 8,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Adaga",
    "bonus": 5,
    "damage": "1d4+3",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Pedra Solta",
    "bonus": 5,
    "damage": "1d6+3",
    "type": "concussão",
    "reachFt": 5,
    "ranged": true
   }
  ],
  "traits": [
   "sunlightSensitivity",
   "packTactics"
  ],
  "blurb": "Voa sobre os inimigos e solta pedras de cima, ou desce para apunhalar quando há aliados por perto. Frágil e ruim sob a luz do sol, mas perigoso em bando.",
  "lore": "Kobolds alados são membros raros de sua raça que nascem com asas semelhantes às de dragões, o que os faz se considerarem mais próximos dos dragões que veneram. Vivem junto das tribos kobolds em cavernas, ruínas e túneis, servindo como batedores e atacantes aéreos. Preferem emboscadas e ataques do alto, fugindo de confrontos diretos. Evitam a luz do dia e agem sempre em grupo."
 },
 "loboDoInverno": {
  "id": "loboDoInverno",
  "tipo": "monstruosidade",
  "name": "Lobo do Inverno",
  "nomeOriginal": "Winter Wolf",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 18,
   "dex": 13,
   "con": 14,
   "int": 7,
   "wis": 12,
   "cha": 8
  },
  "ac": 13,
  "acNote": "armadura natural",
  "maxHp": 75,
  "hpDice": "10d10+20",
  "speedFt": 50,
  "senses": {
   "passivePerception": 15
  },
  "saves": [],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "frio"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 6,
    "damage": "2d6+4",
    "type": "perfurante",
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
  "breath": {
   "name": "Sopro Gélido",
   "kind": "save",
   "shape": "cone",
   "areaFt": 15,
   "save": "dex",
   "dc": 12,
   "damage": "4d8",
   "damageType": "frio",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    5,
    6
   ]
  },
  "traits": [
   "keenHearingSmell",
   "packTactics",
   "t_camuflagemNaNeve"
  ],
  "blurb": "Caça em matilha, derrubando presas com mordidas e congelando grupos inteiros com um sopro gélido em cone. Fica muito mais perigoso quando um aliado está ao lado do alvo.",
  "lore": "Lobo enorme das regiões árticas, do porte de um lobo atroz, com pelagem branca como a neve e olhos azul-claros. É uma criatura cruel, frequentemente mantida por gigantes do gelo como sentinela e parceira de caçada. Entre si, comunica-se com rosnados e latidos, mas entende e fala o suficiente de Comum e Gigante para acompanhar conversas simples. Aproveita a neve para se esconder e emboscar suas vítimas."
 },
 "worg": {
  "id": "worg",
  "tipo": "monstruosidade",
  "name": "Worg",
  "nomeOriginal": "Worg",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "1/2",
  "xp": 100,
  "abilities": {
   "str": 16,
   "dex": 13,
   "con": 13,
   "int": 7,
   "wis": 11,
   "cha": 8
  },
  "ac": 13,
  "acNote": "armadura natural",
  "maxHp": 26,
  "hpDice": "4d10+4",
  "speedFt": 50,
  "senses": {
   "passivePerception": 14,
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
    "bonus": 5,
    "damage": "2d6+3",
    "type": "perfurante",
    "reachFt": 5,
    "onHit": {
     "save": "str",
     "dc": 13,
     "condition": "caido",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "traits": [
   "keenHearingSmell"
  ],
  "blurb": "Lobo gigante e veloz que avança 15 m por turno e morde com força para derrubar a presa. Seus sentidos aguçados tornam difícil se esconder dele.",
  "lore": "O worg é um lobo monstruoso e maligno que sente prazer em caçar e devorar seres mais fracos. Vagueia por campos, florestas e colinas isoladas, ou vive entre goblins e hobgoblins, que o criam como montaria. É astuto e rancoroso, e ataca o próprio cavaleiro se for maltratado ou passar fome. Fala sua própria língua e goblin, e alguns chegam a aprender o comum."
 },
 "serpe": {
  "id": "serpe",
  "tipo": "dragão",
  "name": "Serpe",
  "nomeOriginal": "Wyvern",
  "fonte": "MM",
  "size": "grande",
  "level": 5,
  "cr": "6",
  "xp": 2300,
  "abilities": {
   "str": 19,
   "dex": 10,
   "con": 16,
   "int": 5,
   "wis": 12,
   "cha": 6
  },
  "ac": 13,
  "acNote": "armadura natural",
  "maxHp": 110,
  "hpDice": "13d10+39",
  "speedFt": 20,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80
  },
  "senses": {
   "passivePerception": 14,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 7,
    "damage": "2d6+4",
    "type": "perfurante",
    "reachFt": 10
   },
   {
    "name": "Garras",
    "bonus": 7,
    "damage": "2d8+4",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Ferrão",
    "bonus": 7,
    "damage": "2d6+4",
    "type": "perfurante",
    "reachFt": 10,
    "onHit": {
     "save": "con",
     "dc": 15,
     "danoSeFalhar": {
      "damage": "7d6",
      "type": "veneno"
     },
     "metadeSePassar": true
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Mordida",
    "Ferrão"
   ]
  },
  "traits": [],
  "blurb": "Ataca dos céus com mordida e ferrão de longo alcance; o veneno do ferrão pode causar até 24 de dano extra. Em voo, troca um dos golpes por garras.",
  "lore": "A serpe é uma parente menor dos dragões, com duas patas, asas de couro e uma cauda que termina num ferrão venenoso capaz de matar em instantes. Caça em montanhas, colinas e florestas fechadas, e sua sombra no céu assusta as fronteiras civilizadas. Prefere lutar no ar e só desce ao chão quando não tem outra escolha. É agressiva e imprudente, segue sempre em linha reta até a presa e raramente desiste antes de se ferir gravemente. Caçadores a perseguem pelo veneno valioso, e domá-la como montaria é possível, mas perigosíssimo."
 },
 "xorn": {
  "id": "xorn",
  "tipo": "elemental",
  "name": "Xorn",
  "nomeOriginal": "Xorn",
  "fonte": "MM",
  "size": "médio",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 17,
   "dex": 10,
   "con": 22,
   "int": 11,
   "wis": 10,
   "cha": 11
  },
  "ac": 19,
  "acNote": "armadura natural",
  "maxHp": 73,
  "hpDice": "7d8+42",
  "speedFt": 20,
  "speeds": {
   "burrowFt": 20
  },
  "senses": {
   "passivePerception": 16,
   "darkvisionFt": 60,
   "tremorsenseFt": 60
  },
  "saves": [],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageResistances": [
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 6,
    "damage": "3d6+3",
    "type": "perfurante",
    "reachFt": 5
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
   "count": 3
  },
  "traits": [
   "deslizarNaTerra",
   "camuflagemDePedra",
   "t_faroParaTesouros"
  ],
  "blurb": "Emerge da rocha e ataca com três garras e uma mordida poderosa a cada turno. Resiste a golpes cortantes e perfurantes não mágicos que não sejam de adamante, o que o torna difícil de derrubar.",
  "lore": "O xorn vem do Plano Elemental da Terra e se alimenta de metais preciosos e gemas, que fareja à distância. No Plano Material, vaga pelo Subterrâneo atrás de comida, e fica hostil com mineiros e caçadores de tesouro quando os minérios escasseiam. Tem corpo pesado, uma boca enorme no topo da cabeça, três braços com garras e três olhos que enxergam em todas as direções. Atravessa pedra e terra fundindo-se a elas, sem deixar túnel ou rastro. Oferecer algumas gemas pode transformar um xorn faminto em aliado."
 },
 "yeti": {
  "id": "yeti",
  "tipo": "monstruosidade",
  "name": "Yeti",
  "nomeOriginal": "Yeti",
  "fonte": "MM",
  "size": "grande",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 18,
   "dex": 13,
   "con": 16,
   "int": 8,
   "wis": 12,
   "cha": 7
  },
  "ac": 12,
  "acNote": "armadura natural",
  "maxHp": 51,
  "hpDice": "6d10+18",
  "speedFt": 40,
  "speeds": {
   "climbFt": 40
  },
  "senses": {
   "passivePerception": 13,
   "darkvisionFt": 60
  },
  "saves": [],
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
    "name": "Garra",
    "bonus": 6,
    "damage": "1d6+4",
    "type": "cortante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d6",
     "type": "frio"
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Garra",
    "Garra"
   ]
  },
  "acoesEspeciais": [
   {
    "nome": "Olhar Congelante",
    "tipo": "alvo",
    "alcanceFt": 30,
    "save": "con",
    "dc": 13,
    "damage": "3d6",
    "damageType": "frio",
    "halfOnSave": false,
    "condition": "paralisado",
    "rounds": 10,
    "repete": true
   }
  ],
  "traits": [
   "t_medoDeFogo",
   "keenSmell",
   "t_camuflagemNaNeve"
  ],
  "blurb": "Paralisa a presa com um olhar gélido e depois a dilacera com duas garras que cortam e congelam. Fogo o deixa abalado, com desvantagem em ataques.",
  "lore": "O yeti é um predador enorme de pelagem branca que ronda os picos gelados das montanhas atrás de comida. Fareja carne viva a quilômetros e uiva durante a caçada, mesmo no meio de nevascas. Caça sozinho ou em pequenos grupos familiares e briga com outros yetis pelos restos, devorando inclusive os que caem. Quando a caça rareia, a fome o leva a atacar vilarejos, derrubando portões e paliçadas."
 },
 "yochlol": {
  "id": "yochlol",
  "tipo": "corruptor",
  "name": "Yochlol",
  "nomeOriginal": "Yochlol",
  "fonte": "MM",
  "size": "médio",
  "level": 9,
  "cr": "10",
  "xp": 5900,
  "abilities": {
   "str": 15,
   "dex": 14,
   "con": 18,
   "int": 13,
   "wis": 15,
   "cha": 15
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 136,
  "hpDice": "16d8+64",
  "speedFt": 30,
  "speeds": {
   "climbFt": 30
  },
  "senses": {
   "passivePerception": 12,
   "darkvisionFt": 120
  },
  "saves": [
   "dex",
   "int",
   "wis",
   "cha"
  ],
  "skills": [
   "enganacao",
   "intuicao"
  ],
  "expertise": [
   "enganacao"
  ],
  "damageResistances": [
   "frio",
   "fogo",
   "elétrico",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "damageImmunities": [
   "veneno"
  ],
  "conditionImmunities": [
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Pancada (Mordida na Forma de Aranha)",
    "bonus": 6,
    "damage": "6d6",
    "type": "veneno",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "dominarPessoa",
    "detectarPensamentos",
    "teia"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "dominarPessoa": 1
   },
   "aVontade": [
    "detectarPensamentos",
    "teia"
   ],
   "cdPorMagia": {
    "dominarPessoa": 14,
    "detectarPensamentos": 14,
    "teia": 14
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Forma de Névoa",
    "tipo": "nevoa"
   }
  ],
  "traits": [
   "metamorfo",
   "resistenciaAMagia",
   "spiderClimb",
   "webWalker"
  ],
  "blurb": "Demônio metamorfo que golpeia duas vezes com ataques carregados de veneno (6d6) e prende inimigos com teias. Pode virar névoa tóxica imune a dano não mágico, deixando quem ela envolve envenenado e incapacitado.",
  "lore": "Os yochlols são demônios servos de Lolth, a Rainha Aranha, enviados ao mundo para vigiar e punir seus fiéis. Costumam viver nos templos drow do Subterrâneo, onde se disfarçam de sacerdotisas élficas ou de aranhas gigantes. Em sua forma verdadeira parecem um amontoado viscoso de carne com tentáculos e um único olho. São espiões astutos que leem mentes e manipulam intrigas antes de partir para a violência."
 },
 "dragaoNegroJovem": {
  "id": "dragaoNegroJovem",
  "tipo": "dragão",
  "name": "Dragão Negro Jovem",
  "nomeOriginal": "Young Black Dragon",
  "fonte": "MM",
  "size": "grande",
  "level": 5,
  "cr": "7",
  "xp": 2900,
  "abilities": {
   "str": 19,
   "dex": 14,
   "con": 17,
   "int": 12,
   "wis": 11,
   "cha": 15
  },
  "ac": 18,
  "acNote": "armadura natural",
  "maxHp": 127,
  "hpDice": "15d10+45",
  "speedFt": 40,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80,
   "swimFt": 40
  },
  "senses": {
   "passivePerception": 16,
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
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "ácido"
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
     "damage": "1d8",
     "type": "ácido"
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
   "name": "Sopro Ácido",
   "kind": "save",
   "shape": "linha",
   "areaFt": 30,
   "save": "dex",
   "dc": 14,
   "damage": "11d8",
   "damageType": "ácido",
   "halfOnSave": true,
   "origem": "sopro",
   "larguraFt": 5,
   "recharge": [
    5,
    6
   ]
  },
  "traits": [],
  "blurb": "Ataca com mordida ácida e duas garras, e pode cuspir uma linha de ácido de 9 m que causa dano devastador. Voa rápido e nada bem, emboscando a partir de pântanos.",
  "lore": "Dragões negros são cromáticos cruéis que habitam pântanos sombrios e ruínas alagadas. O jovem já é territorial e mesquinho, aterrorizando vilarejos próximos para acumular tesouros. Gosta de se esconder sob águas turvas e atacar de surpresa. Despreza criaturas mais fracas e prefere vê-las sofrer antes de morrer."
 },
 "dragaoAzulJovem": {
  "id": "dragaoAzulJovem",
  "tipo": "dragão",
  "name": "Dragão Azul Jovem",
  "nomeOriginal": "Young Blue Dragon",
  "fonte": "MM",
  "size": "grande",
  "level": 9,
  "cr": "9",
  "xp": 5000,
  "abilities": {
   "str": 21,
   "dex": 10,
   "con": 19,
   "int": 14,
   "wis": 13,
   "cha": 17
  },
  "ac": 18,
  "acNote": "armadura natural",
  "maxHp": 152,
  "hpDice": "16d10+64",
  "speedFt": 40,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80,
   "burrowFt": 20
  },
  "senses": {
   "passivePerception": 19,
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
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "elétrico"
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
     "damage": "1d10",
     "type": "elétrico"
    }
   },
   {
    "name": "Garra",
    "bonus": 9,
    "damage": "2d6+5",
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
   "name": "Sopro de Relâmpago",
   "kind": "save",
   "shape": "linha",
   "areaFt": 60,
   "save": "dex",
   "dc": 16,
   "damage": "10d10",
   "damageType": "elétrico",
   "halfOnSave": true,
   "origem": "sopro",
   "larguraFt": 5,
   "recharge": [
    5,
    6
   ]
  },
  "traits": [],
  "blurb": "Investe com mordida eletrificada e duas garras, mas seu maior perigo é o sopro de relâmpago, uma linha de 18 m capaz de devastar um grupo alinhado. Voa muito rápido e pode se enterrar na areia para emboscar.",
  "lore": "Dragões azuis jovens dominam desertos e litorais áridos, onde fazem covis sob dunas e rochedos. São vaidosos, territoriais e cruéis, exigindo tributo de caravanas e povoados próximos. Gostam de se esconder sob a areia e surgir de repente, sob o estalo de trovões. Já são astutos o bastante para manipular servos e tramar contra rivais."
 },
 "dragaoDeLataoJovem": {
  "id": "dragaoDeLataoJovem",
  "tipo": "dragão",
  "name": "Dragão de Latão Jovem",
  "nomeOriginal": "Young Brass Dragon",
  "fonte": "MM",
  "size": "grande",
  "level": 5,
  "cr": "6",
  "xp": 2300,
  "abilities": {
   "str": 19,
   "dex": 10,
   "con": 17,
   "int": 12,
   "wis": 11,
   "cha": 15
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 110,
  "hpDice": "13d10+39",
  "speedFt": 40,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80,
   "burrowFt": 20
  },
  "senses": {
   "passivePerception": 16,
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
   "persuasao",
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "fogo"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 7,
    "damage": "2d10+4",
    "type": "perfurante",
    "reachFt": 10
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
   "name": "Sopro de Fogo",
   "kind": "save",
   "shape": "linha",
   "areaFt": 40,
   "save": "dex",
   "dc": 14,
   "damage": "12d6",
   "damageType": "fogo",
   "halfOnSave": true,
   "larguraFt": 5,
   "origem": "sopro",
   "chaveRecarga": "Armas de Sopro",
   "recharge": [
    5,
    6
   ]
  },
  "sopros": [
   {
    "name": "Sopro de Fogo",
    "kind": "save",
    "shape": "linha",
    "areaFt": 40,
    "save": "dex",
    "dc": 14,
    "damage": "12d6",
    "damageType": "fogo",
    "halfOnSave": true,
    "larguraFt": 5,
    "origem": "sopro",
    "chaveRecarga": "Armas de Sopro",
    "recharge": [
     5,
     6
    ]
   },
   {
    "name": "Sopro do Sono",
    "kind": "save",
    "shape": "cone",
    "areaFt": 30,
    "save": "con",
    "dc": 14,
    "condition": "inconsciente",
    "rounds": 1,
    "origem": "sopro",
    "chaveRecarga": "Armas de Sopro",
    "recharge": [
     5,
     6
    ]
   }
  ],
  "traits": [],
  "blurb": "Ataca com mordida e duas garras, mas sua arma mais traiçoeira é o gás do sono, que derruba grupos inteiros antes de um sopro de fogo em linha. Voa rápido e pode se enterrar na areia.",
  "lore": "Dragões de latão são os mais falantes dos dragões metálicos e adoram uma boa conversa com viajantes. Vivem em desertos quentes, onde fazem covis sob dunas ou entre rochas expostas ao sol. Os jovens são curiosos e vaidosos, e às vezes põem um visitante para dormir só para mantê-lo por perto e conversar depois. Raramente buscam briga, preferindo negociar ou enganar antes de recorrer às garras."
 },
 "dragaoDeBronzeJovem": {
  "id": "dragaoDeBronzeJovem",
  "tipo": "dragão",
  "name": "Dragão de Bronze Jovem",
  "nomeOriginal": "Young Bronze Dragon",
  "fonte": "MM",
  "size": "grande",
  "level": 5,
  "cr": "8",
  "xp": 3900,
  "abilities": {
   "str": 21,
   "dex": 10,
   "con": 19,
   "int": 14,
   "wis": 13,
   "cha": 17
  },
  "ac": 18,
  "acNote": "armadura natural",
  "maxHp": 142,
  "hpDice": "15d10+60",
  "speedFt": 40,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80,
   "swimFt": 40
  },
  "senses": {
   "passivePerception": 17,
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
   "intuicao",
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "elétrico"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 8,
    "damage": "2d10+5",
    "type": "perfurante",
    "reachFt": 10
   },
   {
    "name": "Garra",
    "bonus": 8,
    "damage": "2d6+5",
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
   "name": "Sopro Elétrico",
   "kind": "save",
   "shape": "linha",
   "areaFt": 60,
   "save": "dex",
   "dc": 15,
   "damage": "10d10",
   "damageType": "elétrico",
   "halfOnSave": true,
   "larguraFt": 5,
   "origem": "sopro",
   "chaveRecarga": "Armas de Sopro",
   "recharge": [
    5,
    6
   ]
  },
  "sopros": [
   {
    "name": "Sopro Elétrico",
    "kind": "save",
    "shape": "linha",
    "areaFt": 60,
    "save": "dex",
    "dc": 15,
    "damage": "10d10",
    "damageType": "elétrico",
    "halfOnSave": true,
    "larguraFt": 5,
    "origem": "sopro",
    "chaveRecarga": "Armas de Sopro",
    "recharge": [
     5,
     6
    ]
   },
   {
    "name": "Sopro Repulsor",
    "kind": "save",
    "shape": "cone",
    "areaFt": 30,
    "save": "str",
    "dc": 15,
    "empurraFt": 40,
    "origem": "sopro",
    "chaveRecarga": "Armas de Sopro",
    "recharge": [
     5,
     6
    ]
   }
  ],
  "traits": [],
  "blurb": "Combina mordida e garras com alcance e um sopro que alterna entre um raio devastador em linha e uma onda que empurra inimigos para longe. Voa rápido e luta tão bem na água quanto no ar.",
  "lore": "Dragões de bronze são metálicos de índole justa que fazem seus covis em cavernas costeiras, muitas vezes acessíveis só pelo mar. Fascinados por navios e pela guerra, gostam de observar embarcações e às vezes se disfarçam para ajudar causas nobres. O jovem ainda está formando seu tesouro, recolhido de naufrágios. Prefere conversar a lutar, mas enfrenta piratas e tiranos sem hesitar."
 },
 "dragaoDeCobreJovem": {
  "id": "dragaoDeCobreJovem",
  "tipo": "dragão",
  "name": "Dragão de Cobre Jovem",
  "nomeOriginal": "Young Copper Dragon",
  "fonte": "MM",
  "size": "grande",
  "level": 5,
  "cr": "7",
  "xp": 2900,
  "abilities": {
   "str": 19,
   "dex": 12,
   "con": 17,
   "int": 16,
   "wis": 13,
   "cha": 15
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 119,
  "hpDice": "14d10+42",
  "speedFt": 40,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80,
   "climbFt": 40
  },
  "senses": {
   "passivePerception": 17,
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
   "enganacao",
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "ácido"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 7,
    "damage": "2d10+4",
    "type": "perfurante",
    "reachFt": 10
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
   "name": "Armas de Sopro",
   "kind": "save",
   "shape": "linha",
   "areaFt": 40,
   "save": "dex",
   "dc": 14,
   "damage": "9d8",
   "damageType": "ácido",
   "halfOnSave": true,
   "origem": "sopro",
   "larguraFt": 5,
   "recharge": [
    5,
    6
   ]
  },
  "traits": [],
  "blurb": "Escala paredes e voa com agilidade, alternando mordidas e garras com um sopro de ácido em linha ou um gás que deixa os inimigos lentos e sem reações.",
  "lore": "Os dragões de cobre são brincalhões incorrigíveis que fazem seus covis em colinas e penhascos rochosos. Adoram piadas, charadas e histórias engraçadas, e costumam testar visitantes com enigmas antes de qualquer conversa. Mesmo jovens, já são astutos e preferem confundir e ridicularizar adversários a matá-los. Quem não sabe rir de si mesmo, porém, raramente cai nas graças de um deles."
 },
 "dragaoDeOuroJovem": {
  "id": "dragaoDeOuroJovem",
  "tipo": "dragão",
  "name": "Dragão de Ouro Jovem",
  "nomeOriginal": "Young Gold Dragon",
  "fonte": "MM",
  "size": "grande",
  "level": 9,
  "cr": "10",
  "xp": 5900,
  "abilities": {
   "str": 23,
   "dex": 14,
   "con": 21,
   "int": 16,
   "wis": 13,
   "cha": 20
  },
  "ac": 18,
  "acNote": "armadura natural",
  "maxHp": 178,
  "hpDice": "17d10+85",
  "speedFt": 40,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80,
   "swimFt": 40
  },
  "senses": {
   "passivePerception": 19,
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
   "intuicao",
   "percepcao",
   "persuasao",
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "fogo"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 10,
    "damage": "2d10+6",
    "type": "perfurante",
    "reachFt": 10
   },
   {
    "name": "Garra",
    "bonus": 10,
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
   "name": "Armas de Sopro",
   "kind": "save",
   "shape": "cone",
   "areaFt": 30,
   "save": "dex",
   "dc": 17,
   "damage": "10d10",
   "damageType": "fogo",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    5,
    6
   ]
  },
  "traits": [],
  "blurb": "Combina mordida de longo alcance e duas garras com sopros devastadores: um cone de fogo que causa 55 de dano ou um gás que drena a força dos inimigos. Voa rápido e nada bem, escolhendo onde lutar.",
  "lore": "Os dragões de ouro são os mais nobres entre os dragões metálicos, guiados por um forte senso de justiça. Ainda jovem, este já é poderoso e prefere observar e conversar antes de recorrer à violência. Costuma viver em campos e florestas, muitas vezes perto de lagos ou rios, pois respira tanto no ar quanto debaixo d'água. Às vezes assume disfarces para conviver discretamente entre os povos que protege."
 },
 "dragaoVermelhoJovem": {
  "id": "dragaoVermelhoJovem",
  "tipo": "dragão",
  "name": "Dragão Vermelho Jovem",
  "nomeOriginal": "Young Red Dragon",
  "fonte": "MM",
  "size": "grande",
  "level": 9,
  "cr": "10",
  "xp": 5900,
  "abilities": {
   "str": 23,
   "dex": 10,
   "con": 21,
   "int": 14,
   "wis": 11,
   "cha": 19
  },
  "ac": 18,
  "acNote": "armadura natural",
  "maxHp": 178,
  "hpDice": "17d10+85",
  "speedFt": 40,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80,
   "climbFt": 40
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
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "fogo"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 10,
    "damage": "2d10+6",
    "type": "perfurante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "1d6",
     "type": "fogo"
    }
   },
   {
    "name": "Garra",
    "bonus": 10,
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
   "name": "Sopro de Fogo",
   "kind": "save",
   "shape": "cone",
   "areaFt": 30,
   "save": "dex",
   "dc": 17,
   "damage": "16d6",
   "damageType": "fogo",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    5,
    6
   ]
  },
  "traits": [],
  "blurb": "Combina mordida flamejante e duas garras a cada turno e, quando recarrega, cospe um cone de fogo capaz de derrubar um grupo inteiro. Voa rápido e escala bem, escolhendo o ângulo do ataque.",
  "lore": "Dragões vermelhos são os mais arrogantes e cobiçosos dos dragões cromáticos, e mesmo os jovens já se consideram reis. Fazem covil em montanhas e colinas altas, de preferência perto de vulcões ou cavernas quentes. Acumulam tesouros com obsessão e atacam qualquer um que pareça ameaçar sua riqueza. Um jovem ainda está provando seu poder, por isso costuma ser impulsivo e cruel com quem invade seu território."
 },
 "dragaoVermelhoJovemDasSombras": {
  "id": "dragaoVermelhoJovemDasSombras",
  "tipo": "dragão",
  "name": "Dragão Vermelho Jovem das Sombras",
  "nomeOriginal": "Young Red Shadow Dragon",
  "fonte": "MM",
  "size": "grande",
  "level": 13,
  "cr": "13",
  "xp": 10000,
  "abilities": {
   "str": 23,
   "dex": 10,
   "con": 21,
   "int": 14,
   "wis": 11,
   "cha": 19
  },
  "ac": 18,
  "acNote": "armadura natural",
  "maxHp": 178,
  "hpDice": "17d10+85",
  "speedFt": 40,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80,
   "climbFt": 40
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
   "furtividade"
  ],
  "expertise": [
   "percepcao",
   "furtividade"
  ],
  "damageResistances": [
   "necrótico"
  ],
  "damageImmunities": [
   "fogo"
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
     "damage": "1d6",
     "type": "necrótico"
    }
   },
   {
    "name": "Garra",
    "bonus": 11,
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
   "name": "Sopro Sombrio",
   "kind": "save",
   "shape": "cone",
   "areaFt": 30,
   "save": "dex",
   "dc": 18,
   "damage": "16d6",
   "damageType": "necrótico",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    5,
    6
   ]
  },
  "traits": [
   "t_sombraViva",
   "furtividadeNasSombras",
   "sunlightSensitivity"
  ],
  "blurb": "Um dragão que se esconde na penumbra, ganha resistência a quase tudo no escuro e ataca com mordida e garras. Seu sopro de fogo sombrio causa dano necrótico em cone e transforma humanoides mortos em sombras sob seu comando.",
  "lore": "É um dragão vermelho jovem que foi transformado pela exposição prolongada à energia do Pendor das Sombras. As escamas perderam o brilho e ficaram escuras como fumaça, e o calor do seu fogo deu lugar a uma chama sombria que consome a vida. Costuma fazer covil no Subterrâneo, onde a falta de luz favorece seus ataques de emboscada. Continua orgulhoso e cruel como qualquer dragão vermelho, mas age com mais cautela e evita a luz do sol."
 },
 "remorhazJovem": {
  "id": "remorhazJovem",
  "tipo": "monstruosidade",
  "name": "Remorhaz Jovem",
  "nomeOriginal": "Young Remorhaz",
  "fonte": "MM",
  "size": "grande",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 18,
   "dex": 13,
   "con": 17,
   "int": 3,
   "wis": 10,
   "cha": 4
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 93,
  "hpDice": "11d10+33",
  "speedFt": 30,
  "speeds": {
   "burrowFt": 30
  },
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 60,
   "tremorsenseFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "damageImmunities": [
   "frio",
   "fogo"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 6,
    "damage": "3d10+4",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "2d6",
     "type": "fogo"
    }
   }
  ],
  "corpoQuente": {
   "damage": "2d6",
   "type": "fogo"
  },
  "traits": [
   "corpoQuente"
  ],
  "blurb": "Surge de dentro do gelo e morde com força brutal, somando perfuração e fogo. Seu corpo escaldante queima quem o toca ou o golpeia de perto.",
  "lore": "O remorhaz jovem é a forma ainda em crescimento de um predador colossal das terras geladas. Ele escava túneis sob a neve e o gelo, sentindo pelas vibrações do chão as presas que passam acima. Seu corpo gera um calor interno intenso, capaz de derreter o gelo ao redor e de queimar qualquer agressor. Mesmo jovem, já é faminto e territorial, atacando viajantes sem hesitar."
 },
 "dragaoDePrataJovem": {
  "id": "dragaoDePrataJovem",
  "tipo": "dragão",
  "name": "Dragão de Prata Jovem",
  "nomeOriginal": "Young Silver Dragon",
  "fonte": "MM",
  "size": "grande",
  "level": 9,
  "cr": "9",
  "xp": 5000,
  "abilities": {
   "str": 23,
   "dex": 10,
   "con": 21,
   "int": 14,
   "wis": 11,
   "cha": 19
  },
  "ac": 18,
  "acNote": "armadura natural",
  "maxHp": 168,
  "hpDice": "16d10+80",
  "speedFt": 40,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80
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
   "historia",
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "frio"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 10,
    "damage": "2d10+6",
    "type": "perfurante",
    "reachFt": 10
   },
   {
    "name": "Garra",
    "bonus": 10,
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
   "name": "Sopro de Frio",
   "kind": "save",
   "shape": "cone",
   "areaFt": 30,
   "save": "con",
   "dc": 17,
   "damage": "12d8",
   "damageType": "frio",
   "halfOnSave": true,
   "origem": "sopro",
   "chaveRecarga": "Armas de Sopro",
   "recharge": [
    5,
    6
   ]
  },
  "sopros": [
   {
    "name": "Sopro de Frio",
    "kind": "save",
    "shape": "cone",
    "areaFt": 30,
    "save": "con",
    "dc": 17,
    "damage": "12d8",
    "damageType": "frio",
    "halfOnSave": true,
    "origem": "sopro",
    "chaveRecarga": "Armas de Sopro",
    "recharge": [
     5,
     6
    ]
   },
   {
    "name": "Sopro Paralisante",
    "kind": "save",
    "shape": "cone",
    "areaFt": 30,
    "save": "con",
    "dc": 17,
    "condition": "paralisado",
    "rounds": 10,
    "origem": "sopro",
    "chaveRecarga": "Armas de Sopro",
    "recharge": [
     5,
     6
    ]
   }
  ],
  "traits": [],
  "blurb": "Ataca com mordida de longo alcance e duas garras, e pode soprar um cone de frio intenso ou um gás que paralisa grupos inteiros. Voa rápido e escolhe bem onde pousar.",
  "lore": "Os dragões de prata são dragões metálicos de índole nobre, que costumam viver no alto de montanhas e, às vezes, perto de cidades. Gostam da companhia de humanos e outros povos, chegando a passar tempo entre eles disfarçados. Mesmo jovens, já são inteligentes, curiosos e muito ligados à justiça. Preferem conversar a lutar, mas defendem os inocentes com ferocidade quando necessário."
 },
 "dragaoBrancoJovem": {
  "id": "dragaoBrancoJovem",
  "tipo": "dragão",
  "name": "Dragão Branco Jovem",
  "nomeOriginal": "Young White Dragon",
  "fonte": "MM",
  "size": "grande",
  "level": 5,
  "cr": "6",
  "xp": 2300,
  "abilities": {
   "str": 18,
   "dex": 10,
   "con": 18,
   "int": 6,
   "wis": 11,
   "cha": 12
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 133,
  "hpDice": "14d10+56",
  "speedFt": 40,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80,
   "swimFt": 40,
   "burrowFt": 20
  },
  "senses": {
   "passivePerception": 16,
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
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
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
     "damage": "1d8",
     "type": "frio"
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
   "name": "Sopro Gélido",
   "kind": "save",
   "shape": "cone",
   "areaFt": 30,
   "save": "con",
   "dc": 15,
   "damage": "10d8",
   "damageType": "frio",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    5,
    6
   ]
  },
  "traits": [
   "t_andarNoGelo"
  ],
  "blurb": "Combina mordida gélida e duas garras por turno, e seu sopro congelante em cone de 9 m pode causar 45 de dano de frio a vários alvos de uma vez. Voa, nada e escava, então pode atacar de onde menos se espera.",
  "lore": "O menor e mais bestial dos dragões cromáticos, o dragão branco jovem habita geleiras, picos nevados e mares congelados. Guia-se mais pelo instinto e pela fome do que pela astúcia, mas tem memória longa para ofensas. Costuma emboscar a presa enterrado na neve ou sob o gelo e caça tanto em terra quanto na água. Guarda com ciúme um tesouro escondido em cavernas de gelo."
 },
 "abominacaoYuanTi": {
  "id": "abominacaoYuanTi",
  "tipo": "monstruosidade",
  "name": "Abominação Yuan-ti",
  "nomeOriginal": "Yuan-ti Abomination",
  "fonte": "MM",
  "size": "grande",
  "level": 5,
  "cr": "7",
  "xp": 2900,
  "abilities": {
   "str": 19,
   "dex": 16,
   "con": 17,
   "int": 17,
   "wis": 15,
   "cha": 18
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 127,
  "hpDice": "15d10+45",
  "speedFt": 40,
  "senses": {
   "passivePerception": 15,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "damageImmunities": [
   "veneno"
  ],
  "conditionImmunities": [
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 7,
    "damage": "1d6+4",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "3d6",
     "type": "veneno"
    }
   },
   {
    "name": "Constrição",
    "bonus": 7,
    "damage": "2d6+4",
    "type": "concussão",
    "reachFt": 10,
    "onHit": {
     "semResistencia": true,
     "dc": 14,
     "escape": 14,
     "condition": "contido",
     "note": "é agarrado"
    }
   },
   {
    "name": "Cimitarra",
    "bonus": 7,
    "damage": "2d6+4",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Arco Longo",
    "bonus": 6,
    "damage": "2d8+3",
    "type": "perfurante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 150,
    "longRangeFt": 600,
    "danoExtra": {
     "damage": "3d6",
     "type": "veneno"
    }
   }
  ],
  "multiattack": {
   "count": 2
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "medo",
    "sugestao",
    "amizadeAnimal"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "medo": 1,
    "sugestao": 3
   },
   "aVontade": [
    "amizadeAnimal"
   ],
   "cdPorMagia": {
    "medo": 15,
    "sugestao": 15,
    "amizadeAnimal": 15
   }
  },
  "traits": [
   "metamorfo",
   "resistenciaAMagia"
  ],
  "blurb": "Serpente gigante com braços que alterna mordida venenosa, constrição e cimitarra, ou dispara flechas envenenadas de longe. Resiste à magia e pode amedrontar ou dominar com sugestões.",
  "lore": "As abominações são o ápice da transformação yuan-ti, criaturas quase totalmente serpentinas que governam os templos e cidades da raça. Habitam ruínas em florestas, pântanos e desertos, cercadas de cultistas e cobras. São inteligentes, cruéis e se veem como escolhidas por deuses serpentes. Manipulam servos com magia e só lutam pessoalmente quando seus planos estão em risco."
 },
 "yuanTiMalditoTipo1": {
  "id": "yuanTiMalditoTipo1",
  "tipo": "monstruosidade",
  "name": "Yuan-ti Maldito (Tipo 1)",
  "nomeOriginal": "Yuan-ti Malison (Type 1)",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 16,
   "dex": 14,
   "con": 13,
   "int": 14,
   "wis": 12,
   "cha": 16
  },
  "ac": 12,
  "maxHp": 66,
  "hpDice": "12d8+12",
  "speedFt": 30,
  "senses": {
   "passivePerception": 11,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "enganacao",
   "furtividade"
  ],
  "expertise": [],
  "damageImmunities": [
   "veneno"
  ],
  "conditionImmunities": [
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 5,
    "damage": "1d4+3",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "2d6",
     "type": "veneno"
    }
   },
   {
    "name": "Cimitarra",
    "bonus": 5,
    "damage": "1d6+3",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Arco Longo",
    "bonus": 4,
    "damage": "1d8+2",
    "type": "perfurante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 150,
    "longRangeFt": 600,
    "danoExtra": {
     "damage": "2d6",
     "type": "veneno"
    }
   }
  ],
  "multiattack": {
   "count": 2
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "sugestao",
    "amizadeAnimal"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "sugestao": 3
   },
   "aVontade": [
    "amizadeAnimal"
   ],
   "cdPorMagia": {
    "sugestao": 13,
    "amizadeAnimal": 13
   }
  },
  "traits": [
   "metamorfo",
   "resistenciaAMagia",
   "t_tipoDeMaldito"
  ],
  "blurb": "Combina mordida venenosa com cimitarra ou arco longo envenenado, atacando duas vezes por turno. Resiste bem à magia e pode manipular inimigos com sugestão.",
  "lore": "Os malditos são a casta intermediária dos yuan-ti, mesclas de humano e serpente; este tipo tem corpo humano e cabeça de cobra. Habitam templos em ruínas em selvas, pântanos e desertos, servindo a deuses serpentes. São astutos e cruéis, preferindo enganar e manipular antes de lutar. Podem assumir a forma de uma cobra para espionar ou fugir."
 },
 "yuanTiMalditoTipo2": {
  "id": "yuanTiMalditoTipo2",
  "tipo": "monstruosidade",
  "name": "Yuan-ti Maldito (Tipo 2)",
  "nomeOriginal": "Yuan-ti Malison (Type 2)",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 16,
   "dex": 14,
   "con": 13,
   "int": 14,
   "wis": 12,
   "cha": 16
  },
  "ac": 12,
  "maxHp": 66,
  "hpDice": "12d8+12",
  "speedFt": 30,
  "senses": {
   "passivePerception": 11,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "enganacao",
   "furtividade"
  ],
  "expertise": [],
  "damageImmunities": [
   "veneno"
  ],
  "conditionImmunities": [
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 5,
    "damage": "1d4+3",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "2d6",
     "type": "veneno"
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Mordida",
    "Mordida"
   ]
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "sugestao",
    "amizadeAnimal"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "sugestao": 3
   },
   "aVontade": [
    "amizadeAnimal"
   ],
   "cdPorMagia": {
    "sugestao": 13,
    "amizadeAnimal": 13
   }
  },
  "traits": [
   "metamorfo",
   "resistenciaAMagia",
   "t_tipoDeAbominacao"
  ],
  "blurb": "Ataca duas vezes com os braços de serpente, cada mordida somando veneno ao dano perfurante. Resiste bem a magia e usa sugestão para manipular inimigos.",
  "lore": "Este yuan-ti tem cabeça e tronco humanos, mas no lugar dos braços se contorcem duas serpentes vivas. Malisons formam a casta intermediária da sociedade yuan-ti, servindo como guardas, espiões e capatazes nos templos escondidos em selvas, pântanos e desertos. Astutos e cruéis, preferem enganar e dominar antes de lutar. Podem assumir a forma de uma cobra para se infiltrar ou fugir."
 },
 "yuanTiMalditoTipo3": {
  "id": "yuanTiMalditoTipo3",
  "tipo": "monstruosidade",
  "name": "Yuan-ti Maldito (Tipo 3)",
  "nomeOriginal": "Yuan-ti Malison (Type 3)",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 16,
   "dex": 14,
   "con": 13,
   "int": 14,
   "wis": 12,
   "cha": 16
  },
  "ac": 12,
  "maxHp": 66,
  "hpDice": "12d8+12",
  "speedFt": 30,
  "senses": {
   "passivePerception": 11,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "enganacao",
   "furtividade"
  ],
  "expertise": [],
  "damageImmunities": [
   "veneno"
  ],
  "conditionImmunities": [
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Mordida (somente forma de serpente)",
    "bonus": 5,
    "damage": "1d4+3",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "2d6",
     "type": "veneno"
    }
   },
   {
    "name": "Constrição",
    "bonus": 5,
    "damage": "2d6+3",
    "type": "concussão",
    "reachFt": 5,
    "onHit": {
     "semResistencia": true,
     "dc": 13,
     "escape": 13,
     "condition": "contido",
     "note": "é agarrado"
    }
   },
   {
    "name": "Cimitarra (somente forma yuan-ti)",
    "bonus": 5,
    "damage": "1d6+3",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Arco Longo (somente forma yuan-ti)",
    "bonus": 4,
    "damage": "1d8+2",
    "type": "perfurante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 150,
    "longRangeFt": 600
   }
  ],
  "multiattack": {
   "count": 2
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "sugestao",
    "amizadeAnimal"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "sugestao": 3
   },
   "aVontade": [
    "amizadeAnimal"
   ],
   "cdPorMagia": {
    "sugestao": 13,
    "amizadeAnimal": 13
   }
  },
  "traits": [
   "metamorfo",
   "resistenciaAMagia",
   "t_tipoDeAbominavel"
  ],
  "blurb": "Metade humano, metade serpente, alterna cimitarra e arco longo enquanto esmaga um alvo nos anéis do corpo, deixando-o contido. Resiste a magia e pode sugestionar inimigos.",
  "lore": "Os yuan-ti abomináveis formam a casta intermediária da sociedade serpentina, mais humanos que as abominações e menos que os sangue-puros. Este tipo tem cabeça e tronco humanos sobre uma longa cauda de cobra no lugar das pernas. Habitam templos arruinados em selvas, pântanos e desertos, onde servem a deuses-serpente e tramam contra os povos vizinhos. Costumam agir como guerreiros, sacerdotes e capatazes de escravos, usando enganação e veneno para dominar."
 },
 "yuanTiPuroSangue": {
  "id": "yuanTiPuroSangue",
  "tipo": "humanoide",
  "name": "Yuan-ti Puro-Sangue",
  "nomeOriginal": "Yuan-ti Pureblood",
  "fonte": "MM",
  "size": "médio",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 11,
   "dex": 12,
   "con": 11,
   "int": 13,
   "wis": 12,
   "cha": 14
  },
  "ac": 11,
  "maxHp": 40,
  "hpDice": "9d8",
  "speedFt": 30,
  "senses": {
   "passivePerception": 13,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "enganacao",
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "enganacao"
  ],
  "damageImmunities": [
   "veneno"
  ],
  "conditionImmunities": [
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Cimitarra",
    "bonus": 3,
    "damage": "1d6+1",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Arco Curto",
    "bonus": 3,
    "damage": "1d6+1",
    "type": "perfurante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 80,
    "longRangeFt": 320,
    "danoExtra": {
     "damage": "2d6",
     "type": "veneno"
    }
   }
  ],
  "multiattack": {
   "count": 2
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "borrifoVenenoso",
    "sugestao",
    "amizadeAnimal"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "borrifoVenenoso": 3,
    "sugestao": 3
   },
   "aVontade": [
    "amizadeAnimal"
   ],
   "cdPorMagia": {
    "borrifoVenenoso": 12,
    "sugestao": 12,
    "amizadeAnimal": 12
   }
  },
  "traits": [
   "resistenciaAMagia"
  ],
  "blurb": "Infiltrador que parece humano: golpeia duas vezes com a cimitarra ou dispara flechas envenenadas, e usa sugestão para manipular inimigos. Resiste bem a magia.",
  "lore": "Os puros-sangues são os yuan-ti mais parecidos com humanos, traídos apenas por detalhes como escamas ou olhos de serpente. Servem como espiões e agentes de seus parentes mais monstruosos, circulando por cidades humanas. Habitam selvas, pântanos e desertos em torno de templos antigos. São frios, calculistas e veem as outras raças como gado ou ferramentas."
 }
};

export const TRACOS_MM = {
 "t_invocarElementalDoAr": {
  "name": "Invocar Elemental do Ar",
  "desc": "Cinco aarakocra a até 9 m uns dos outros gastam ação e movimento por três turnos seguidos numa dança aérea, mantendo concentração; ao fim, surge um elemental do ar aliado a até 18 m, que obedece a ordens faladas. Ele dura 1 hora, até morrer ou todos os invocadores morrerem, ou até um deles dispensá-lo com ação bônus; cada invocador só repete após um descanso curto."
 },
 "t_nuvemDeMuco": {
  "name": "Nuvem de Muco",
  "desc": "Debaixo d'água, quem tocar o aboleth ou acertá-lo corpo a corpo a até 1,5 m faz teste de resistência de Constituição CD 14. Se falhar, fica doente por 1d4 horas e só consegue respirar submerso."
 },
 "t_telepatiaInvasiva": {
  "name": "Telepatia Invasiva",
  "desc": "Se uma criatura que ele vê falar com ele por telepatia, o aboleth descobre os maiores desejos dela."
 },
 "t_medoDeFogo": {
  "name": "Medo de Fogo",
  "desc": "Ao sofrer dano de fogo, tem desvantagem em jogadas de ataque e testes de habilidade até o fim do seu próximo turno."
 },
 "t_camuflagemNaNeve": {
  "name": "Camuflagem na Neve",
  "desc": "Vantagem em testes de Destreza (Furtividade) para se esconder em terreno nevado."
 },
 "t_mudarDeForma": {
  "name": "Mudar de Forma",
  "desc": "Transforma-se magicamente em humanoide Pequeno ou Médio, em gigante Grande ou volta à forma verdadeira, mantendo as estatísticas exceto o tamanho. Só a glaive se transforma junto; ao morrer, ele e a arma voltam ao normal."
 },
 "t_andarNoGelo": {
  "name": "Andar no Gelo",
  "desc": "Move-se e escala superfícies geladas sem precisar de teste. Terreno difícil de gelo ou neve não lhe custa movimento extra."
 },
 "t_inescrutavel": {
  "name": "Inescrutável",
  "desc": "Imune a efeitos que detectem emoções ou leiam pensamentos e a adivinhações que recuse. Testes de Sabedoria (Intuição) para entender suas intenções têm desvantagem."
 },
 "t_saltoComImpulso": {
  "name": "Salto com Impulso",
  "desc": "Após correr 3 m, pode saltar até 7,5 m em distância."
 },
 "t_coracaoDeHruggek": {
  "name": "Coração de Hruggek",
  "desc": "Tem vantagem em testes de resistência contra ficar enfeitiçado, amedrontado, paralisado, envenenado, atordoado ou ser posto para dormir."
 },
 "t_saltoParado": {
  "name": "Salto Parado",
  "desc": "Salta até 9 m em distância e 4,5 m em altura, mesmo sem correr antes."
 },
 "t_falarComSaposERas": {
  "name": "Falar com Sapos e Rãs",
  "desc": "Consegue transmitir ideias simples a sapos e rãs falando em Bullywug."
 },
 "t_camuflagemDoPantano": {
  "name": "Camuflagem do Pântano",
  "desc": "Tem vantagem em testes de Destreza (Furtividade) para se esconder em terreno pantanoso."
 },
 "t_bencaoInfernal": {
  "name": "Bênção Infernal",
  "desc": "Soma seu modificador de Carisma à CA."
 },
 "t_zumbido": {
  "name": "Zumbido",
  "desc": "Toda criatura que não seja demônio e comece o turno a até 9 m deve passar em um teste de resistência de Constituição CD 12 ou fica inconsciente por 10 minutos. Quem não consegue ouvir passa automaticamente, e o efeito termina se a vítima sofrer dano ou for molhada com água benta. Após um sucesso ou o fim do efeito, a criatura fica imune por 24 horas."
 },
 "t_sentirMagia": {
  "name": "Sentir Magia",
  "desc": "Percebe magia a até 36 m à vontade, como a magia detectar magia, mas sem que isso seja um efeito mágico."
 },
 "t_menteProtegida": {
  "name": "Mente Protegida",
  "desc": "É imune a vidência e a qualquer efeito que perceba suas emoções, leia seus pensamentos ou descubra sua localização."
 },
 "t_percepcaoDeProfundidadeRuim": {
  "name": "Percepção de Profundidade Ruim",
  "desc": "Tem desvantagem em qualquer jogada de ataque contra alvos a mais de 9 m de distância."
 },
 "t_morteElemental": {
  "name": "Morte Elemental",
  "desc": "Ao morrer, o corpo vira pó cristalino, deixando só o equipamento."
 },
 "t_duasCabecas": {
  "name": "Duas Cabeças",
  "desc": "Tem vantagem em testes de Sabedoria (Percepção) e em testes de resistência contra ficar cego, enfeitiçado, surdo, amedrontado, atordoado ou inconsciente."
 },
 "t_fimElemental": {
  "name": "Fim Elemental",
  "desc": "Ao morrer, o corpo se desfaz em água e espuma, restando apenas o equipamento que carregava."
 },
 "t_falarComBestasEPlantas": {
  "name": "Falar com Bestas e Plantas",
  "desc": "Consegue se comunicar com bestas e plantas como se falassem a mesma língua."
 },
 "t_caminharEmArvores": {
  "name": "Caminhar em Árvores",
  "desc": "Uma vez por turno, gasta 3 m de movimento para entrar em uma árvore viva ao seu alcance e sair de outra a até 18 m, num espaço livre a 1,5 m dela. Ambas as árvores devem ser Grandes ou maiores."
 },
 "t_resilienciaDuergar": {
  "name": "Resiliência Duergar",
  "desc": "Tem vantagem em testes de resistência contra veneno, magias e ilusões, e para evitar ficar enfeitiçado ou paralisado."
 },
 "t_menteAxiomatica": {
  "name": "Mente Axiomática",
  "desc": "Nenhum efeito consegue forçar o tridrone a agir contra sua natureza ou contra as ordens que recebeu."
 },
 "t_desintegracao": {
  "name": "Desintegração",
  "desc": "Ao morrer, o corpo vira pó e restam apenas as armas e os objetos que ele levava."
 },
 "t_asCoresDaIdade": {
  "name": "As Cores da Idade",
  "desc": "A cor das escamas indica a idade: vermelho (até 5 anos), laranja, amarelo (11–20), verde, azul, anil e violeta (51+). A cada fase ganha novas magias; a partir do verde o ND sobe para 2."
 },
 "t_telepatiaLimitada": {
  "name": "Telepatia Limitada",
  "desc": "Transmite ideias, emoções e imagens simples a qualquer criatura a até 30 m que entenda algum idioma."
 },
 "t_aversaoAoFogo": {
  "name": "Aversão ao Fogo",
  "desc": "Ao sofrer dano de fogo, tem desvantagem em jogadas de ataque e testes de habilidade até o fim do seu próximo turno."
 },
 "t_telepatiaAvancada": {
  "name": "Telepatia Avançada",
  "desc": "Percebe qualquer comunicação telepática a até 18 m e não pode ser surpreendido por criaturas que tenham alguma forma de telepatia."
 },
 "t_veuTelepatico": {
  "name": "Véu Telepático",
  "desc": "Imune a magias de adivinhação e a qualquer efeito que leia seus pensamentos ou detecte suas emoções."
 },
 "t_semelhancaInquietante": {
  "name": "Semelhança Inquietante",
  "desc": "Parece um observador; quem o vê pode reconhecer sua verdadeira natureza com um teste de Inteligência (Natureza) CD 15."
 },
 "t_cuboDeLimo": {
  "name": "Cubo de Limo",
  "desc": "Ocupa todo o seu espaço; quem entrar nele sofre Engolfar com desvantagem no teste. Criaturas dentro têm cobertura total; alguém a 1,5 m pode usar uma ação e um teste de Força CD 12 para puxar algo de dentro, sofrendo 10 (3d6) de dano ácido. Comporta uma criatura Grande ou até quatro Médias ou menores."
 },
 "t_transparente": {
  "name": "Transparente",
  "desc": "Se não se moveu nem atacou, é preciso um teste de Sabedoria (Percepção) CD 15 para notá-lo. Quem entra no espaço dele sem saber que está ali fica surpreso."
 },
 "t_respiracaoAquatica": {
  "name": "Respiração Aquática",
  "desc": "Só consegue respirar debaixo d'água."
 },
 "t_defesaPsiquica": {
  "name": "Defesa Psíquica",
  "desc": "Sem armadura nem escudo, soma o modificador de Sabedoria à CA."
 },
 "t_memoriaLabirintica": {
  "name": "Memória Labiríntica",
  "desc": "Lembra com perfeição qualquer caminho que já percorreu."
 },
 "t_aparenciaIlusoria": {
  "name": "Aparência Ilusória",
  "desc": "Disfarça-se magicamente como outra criatura feia de tamanho e forma humanoide semelhantes, até encerrar com uma ação bônus ou morrer. O toque revela a farsa; visualmente, exige uma ação e teste de Inteligência (Investigação) CD 16."
 },
 "t_imitacao": {
  "name": "Imitação",
  "desc": "Reproduz sons simples que já ouviu, como sussurros, choro de bebê ou guinchos de animais. Quem ouvir percebe que é imitação com um teste de Sabedoria (Intuição) CD 10."
 },
 "t_sentidosCegos": {
  "name": "Sentidos Cegos",
  "desc": "Perde a percepção às cegas se estiver surdo e sem conseguir sentir cheiros ao mesmo tempo."
 },
 "t_rejuvenescimento": {
  "name": "Rejuvenescimento",
  "desc": "Ao morrer, retorna à vida com todos os PV após 1d6 dias. Apenas a magia desejo impede o retorno."
 },
 "t_eloTelepatico": {
  "name": "Elo Telepático",
  "desc": "Enquanto estiver no mesmo plano que seu mestre, pode transmitir a ele tudo o que percebe, e os dois conversam por telepatia."
 },
 "t_vinculoTelepatico": {
  "name": "Vínculo Telepático",
  "desc": "Sua telepatia não tem limite de alcance com a criatura que ela enfeitiçou, funcionando até entre planos diferentes."
 },
 "t_ladraoDeCorpos": {
  "name": "Ladrão de Corpos",
  "desc": "Disputa de Inteligência contra um humanoide incapacitado a até 1,5 m sem proteção contra o bem e o mal; se vencer, devora o cérebro, entra no crânio e controla o corpo, ficando com cobertura total, mantendo Int, Sab, Car e traços e adotando o resto das estatísticas e conhecimentos do hospedeiro. Sai se o corpo morrer, se for alvo de proteção contra o bem e o mal ou de desejo que restaure o cérebro; pode sair voluntariamente gastando 1,5 m de movimento, e o corpo morre em 1 rodada sem o cérebro."
 },
 "t_detectarSenciencia": {
  "name": "Detectar Senciência",
  "desc": "Percebe a presença e a posição de qualquer criatura com Inteligência 3 ou mais a até 90 m, mesmo através de barreiras, exceto quem estiver sob mente vazia."
 },
 "t_rastreadorInfalivel": {
  "name": "Rastreador Infalível",
  "desc": "Recebe um alvo de quem o invocou e sabe a direção e a distância dele enquanto estiverem no mesmo plano. Também sempre sabe onde está seu invocador."
 },
 "t_mimetismo": {
  "name": "Mimetismo",
  "desc": "Reproduz qualquer som que já tenha ouvido, inclusive vozes. Quem ouve percebe a imitação com um teste de Sabedoria (Intuição) CD 14."
 },
 "t_percepcaoSobrenatural": {
  "name": "Percepção Sobrenatural",
  "desc": "Sente criaturas invisíveis ou no Plano Etéreo a até 9 m, e localiza exatamente as que estiverem se movendo."
 },
 "t_escorregadio": {
  "name": "Escorregadio",
  "desc": "Tem vantagem em testes de atributo e de resistência para escapar de agarrões."
 },
 "t_rejuvenescimentoInfernal": {
  "name": "Rejuvenescimento Infernal",
  "desc": "Se morrer nos Nove Infernos, revive com todos os PV após 1d10 dias. Isso não acontece se for morto por uma criatura de tendência boa sob efeito de bênção ou se seus restos receberem água benta."
 },
 "t_espinhosRegenerativos": {
  "name": "Espinhos Regenerativos",
  "desc": "Possui 24 espinhos na cauda. Os que forem disparados voltam a crescer após um descanso longo."
 },
 "t_animalDeCarga": {
  "name": "Animal de Carga",
  "desc": "Para calcular quanto peso consegue carregar, conta como um animal Grande."
 },
 "t_esporosDeComunhao": {
  "name": "Esporos de Comunhão",
  "desc": "Esporos num raio de 9 m que contornam cantos permitem que criaturas com Inteligência 2 ou mais (exceto mortos-vivos, constructos e elementais) se comuniquem por telepatia a até 9 m entre si por 1 hora."
 },
 "t_esporosDeAlerta": {
  "name": "Esporos de Alerta",
  "desc": "Sempre que sofre dano, todos os outros miconídeos a até 72 m percebem sua dor."
 },
 "t_malDoSol": {
  "name": "Mal do Sol",
  "desc": "Sob luz solar, tem desvantagem em testes de habilidade, jogadas de ataque e testes de resistência. Morre se passar mais de 1 hora sob sol direto."
 },
 "t_esporosAnimadores": {
  "name": "Esporos Animadores",
  "desc": "3/dia. Espalha esporos sobre o cadáver de um humanoide ou fera Grande ou menor a até 1,5 m; em 24 horas ele se ergue como servo de esporos por 1d4+1 semanas."
 },
 "t_esporosDeAflicao": {
  "name": "Esporos de Aflição",
  "desc": "Sempre que sofre dano, todos os outros miconídeos a até 72 m percebem sua dor."
 },
 "t_doencaDoSol": {
  "name": "Doença do Sol",
  "desc": "Sob luz solar tem desvantagem em testes de habilidade, jogadas de ataque e testes de resistência. Morre se ficar mais de 1 hora sob sol direto."
 },
 "t_esporosDeAfinidade": {
  "name": "Esporos de Afinidade",
  "desc": "3 vezes por dia, libera esporos num raio de 3 m que contornam esquinas, afetando criaturas com Inteligência 2 ou mais que não sejam mortos-vivos, constructos ou elementais. Por 1 hora, os afetados se comunicam por telepatia entre si enquanto estiverem a até 9 m uns dos outros."
 },
 "t_enfermidadeSolar": {
  "name": "Enfermidade Solar",
  "desc": "Sob luz solar, tem desvantagem em testes de habilidade, jogadas de ataque e testes de resistência. Morre se passar mais de 1 hora sob luz solar direta."
 },
 "t_assombroDePesadelo": {
  "name": "Assombro de Pesadelo",
  "desc": "1/dia, do Plano Etéreo, toca um humanoide adormecido (bloqueado por proteção contra o bem e o mal ou círculo mágico). Após 1 hora de pesadelos, o alvo não descansa e perde 5 (1d10) de PV máximo até restauração maior; se chegar a 0, morre, e se for mau sua alma vai para a bolsa."
 },
 "t_itensDaBruxaDaNoite": {
  "name": "Itens da Bruxa da Noite",
  "desc": "Carrega uma pedra-coração, que lhe permite ficar etérea e cura doenças ao toque, e uma bolsa de almas, que aprisiona a alma de um humanoide mau morto por seu Assombro de Pesadelo."
 },
 "t_concederResistenciaAFogo": {
  "name": "Conceder Resistência a Fogo",
  "desc": "Quem estiver montado no pesadelo pode receber dele resistência a dano de fogo."
 },
 "t_furiaDeGruumsh": {
  "name": "Fúria de Gruumsh",
  "desc": "Seus ataques com arma que acertam causam 4 (1d8) de dano extra, já somado aos ataques."
 },
 "t_percepcaoDivina": {
  "name": "Percepção Divina",
  "desc": "Sabe sempre quando ouve uma mentira."
 },
 "t_tentaculosAgarradores": {
  "name": "Tentáculos Agarradores",
  "desc": "Tem até seis tentáculos, cada um com CA 20, 10 PV e imunidade a veneno e psíquico; destruí-los não fere o enrolador, que cria outro no turno seguinte. Uma criatura pode usar uma ação e romper um tentáculo com um teste de Força CD 15."
 },
 "t_faroParaFerro": {
  "name": "Faro para Ferro",
  "desc": "Localiza com precisão, pelo cheiro, metal ferroso a até 9 m."
 },
 "t_anfibioLimitado": {
  "name": "Anfíbio Limitado",
  "desc": "Respira ar e água, mas precisa ficar submerso ao menos uma vez a cada 4 horas para não sufocar."
 },
 "t_telepatiaComTubaroes": {
  "name": "Telepatia com Tubarões",
  "desc": "Comanda magicamente, por telepatia limitada, qualquer tubarão a até 36 m dela."
 },
 "t_anfibiaLimitada": {
  "name": "Anfíbia Limitada",
  "desc": "Respira ar e água, mas sufoca se não ficar submersa pelo menos uma vez a cada 4 horas."
 },
 "t_guincho": {
  "name": "Guincho",
  "desc": "Quando uma criatura ou luz brilhante fica a até 9 m dele, solta um grito ouvido a até 90 m. Continua gritando enquanto o estímulo estiver no alcance e por mais 1d4 turnos dele depois."
 },
 "t_espinhosLimitados": {
  "name": "Espinhos Limitados",
  "desc": "Possui doze espinhos na cauda, que voltam a crescer após um descanso longo."
 },
 "t_visaoDoCoracao": {
  "name": "Visão do Coração",
  "desc": "Ao tocar uma criatura, descobre seu estado emocional. Se o alvo falhar num teste de resistência de Carisma CD 10, descobre também sua tendência; celestiais, corruptores e mortos-vivos falham automaticamente."
 },
 "t_apanharRochas": {
  "name": "Apanhar Rochas",
  "desc": "Rocha ou objeto parecido arremessado contra ele: com um sucesso em Destreza (CD 10) ele segura o projétil no ar, como reação, e não leva o dano de concussão."
 },
 "t_fugaEnevoada": {
  "name": "Fuga Enevoada",
  "desc": "Ao cair a 0 PV fora do local de descanso, vira névoa em vez de ficar inconsciente, se não estiver no sol ou em água corrente; senão é destruído. Precisa chegar ao local de descanso em 2 horas, onde fica paralisado até recuperar 1 PV após 1 hora."
 },
 "t_fraquezasVampiricas": {
  "name": "Fraquezas Vampíricas",
  "desc": "Não entra em residências sem convite; sofre 20 de ácido ao terminar o turno em água corrente; estaca de madeira no coração enquanto incapacitado no local de descanso o deixa paralisado; sofre 20 radiante ao iniciar turno sob sol e tem desvantagem em ataques e testes de atributo nele."
 },
 "t_fugaNebulosa": {
  "name": "Fuga Nebulosa",
  "desc": "Ao cair a 0 PV fora do seu local de descanso, vira névoa em vez de ficar inconsciente (se não estiver sob sol ou em água corrente). Precisa chegar ao local de descanso em 2 horas ou é destruído; lá fica paralisado até recuperar 1 PV, o que ocorre após 1 hora."
 },
 "t_efemero": {
  "name": "Efêmero",
  "desc": "Não pode vestir nem carregar nada."
 },
 "t_iluminacaoVariavel": {
  "name": "Iluminação Variável",
  "desc": "Emite luz plena num raio de 1,5 a 6 m e penumbra por igual distância além disso. Pode ajustar o raio com uma ação bônus."
 },
 "t_faroParaTesouros": {
  "name": "Faro para Tesouros",
  "desc": "Localiza com precisão, pelo cheiro, metais e pedras preciosas (moedas, gemas) a até 18 m."
 },
 "t_sombraViva": {
  "name": "Sombra Viva",
  "desc": "Na penumbra ou na escuridão, tem resistência a todo dano que não seja energético, psíquico ou radiante."
 },
 "t_tipoDeMaldito": {
  "name": "Tipo de Maldito",
  "desc": "Tipo 1: corpo humano com cabeça de serpente."
 },
 "t_tipoDeAbominacao": {
  "name": "Tipo de Abominação",
  "desc": "Tipo 2: cabeça e corpo humanos, com serpentes no lugar dos braços."
 },
 "t_tipoDeAbominavel": {
  "name": "Tipo de Abominável",
  "desc": "Tipo 3: cabeça e tronco humanos, com o corpo inferior serpentino no lugar das pernas."
 }
};
