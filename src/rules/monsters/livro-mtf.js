// GERADO por `src/dev/importar-bestiario.mjs mtf` — não edite à mão; mude o conversor ou o texto em
  // `src/dev/bestiario/mtf-pt.json` e rode de novo. Os números são os do livro (MTF, via o espelho do 5etools);
  // o texto é nosso, em pt-br. O que o motor ainda não faz está em `src/dev/bestiario/mtf-pendente.json`.
  
export const LIVRO_MTF = {
 "desgracadoAbissal": {
  "id": "desgracadoAbissal",
  "tipo": "corruptor",
  "name": "Desgraçado Abissal",
  "nomeOriginal": "Abyssal Wretch",
  "fonte": "MTF",
  "size": "médio",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 9,
   "dex": 12,
   "con": 11,
   "int": 5,
   "wis": 8,
   "cha": 5
  },
  "ac": 11,
  "maxHp": 18,
  "hpDice": "4d8",
  "speedFt": 20,
  "senses": {
   "passivePerception": 9,
   "darkvisionFt": 120
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
    "name": "Mordida",
    "bonus": 3,
    "damage": "1d8+1",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "traits": [],
  "blurb": "Demônio lento e frágil que avança aos tropeços para morder quem estiver ao alcance. Sozinho é fraco, mas resiste a fogo, frio e eletricidade e não se deixa assustar nem enfeitiçar.",
  "lore": "É uma das formas mais miseráveis de demônio, nascida das almas mais baixas que chegam ao Abismo. Vaga em bandos pelas camadas infernais, faminto e sem rumo, atacando qualquer coisa que pareça comestível. Entende o idioma Abissal, mas é incapaz de falar. Demônios mais fortes o tratam como bucha de canhão."
 },
 "kruthikAdulto": {
  "id": "kruthikAdulto",
  "tipo": "monstruosidade",
  "name": "Kruthik Adulto",
  "nomeOriginal": "Adult Kruthik",
  "fonte": "MTF",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 15,
   "dex": 16,
   "con": 15,
   "int": 7,
   "wis": 12,
   "cha": 8
  },
  "ac": 18,
  "acNote": "armadura natural",
  "maxHp": 39,
  "hpDice": "6d8+12",
  "speedFt": 40,
  "speeds": {
   "climbFt": 40,
   "burrowFt": 20
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
    "name": "Estocada",
    "bonus": 5,
    "damage": "1d6+3",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Espinho",
    "bonus": 5,
    "damage": "1d4+3",
    "type": "perfurante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 20,
    "longRangeFt": 60
   }
  ],
  "multiattack": {
   "count": 2,
   "sequencias": [
    [
     "Estocada",
     "Estocada"
    ],
    [
     "Espinho",
     "Espinho"
    ]
   ]
  },
  "traits": [
   "keenSmell",
   "packTactics",
   "escavador"
  ],
  "blurb": "Ataca em bando, ganhando vantagem quando um aliado está ao lado do alvo, golpeando duas vezes com as patas afiadas ou disparando espinhos à distância. Escava até rocha sólida para surgir por onde ninguém espera.",
  "lore": "Kruthiks são monstruosidades reptilianas e insetoides que vivem em colmeias escavadas no subsolo, em desertos e montanhas. Os adultos defendem a ninhada e caçam em grupo, coordenando-se por meio de sibilos e estalos numa língua própria. Farejam presas de longe e cavam túneis pela pedra para cercá-las. Uma colmeia que cresce demais logo transborda para a superfície em busca de comida."
 },
 "oblexAdulto": {
  "id": "oblexAdulto",
  "tipo": "gosma",
  "name": "Oblex Adulto",
  "nomeOriginal": "Adult Oblex",
  "fonte": "MTF",
  "size": "médio",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 8,
   "dex": 19,
   "con": 16,
   "int": 19,
   "wis": 12,
   "cha": 15
  },
  "ac": 14,
  "maxHp": 75,
  "hpDice": "10d8+30",
  "speedFt": 20,
  "senses": {
   "passivePerception": 14,
   "blindsightFt": 60
  },
  "saves": [
   "int",
   "cha"
  ],
  "skills": [
   "enganacao",
   "percepcao"
  ],
  "expertise": [],
  "conditionImmunities": [
   "cego",
   "enfeitiçado",
   "surdo",
   "exausto",
   "caido"
  ],
  "attacks": [
   {
    "name": "Pseudópode",
    "bonus": 7,
    "damage": "1d6+4",
    "type": "concussão",
    "reachFt": 5,
    "danoExtra": {
     "damage": "2d4",
     "type": "psíquico"
    }
   }
  ],
  "multiattack": {
   "count": 1,
   "sequence": [
    "Pseudópode"
   ]
  },
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "enfeiticarPessoa",
    "borrifoDeCores",
    "detectarPensamentos",
    "imobilizarPessoa"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "enfeiticarPessoa": 3,
    "borrifoDeCores": 3,
    "detectarPensamentos": 3,
    "imobilizarPessoa": 3
   },
   "cdPorMagia": {
    "enfeiticarPessoa": 15,
    "borrifoDeCores": 15,
    "detectarPensamentos": 15,
    "imobilizarPessoa": 15
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Devorar Memórias",
    "tipo": "alvo",
    "alcanceFt": 5,
    "save": "wis",
    "dc": 15,
    "damage": "4d8",
    "damageType": "psíquico",
    "halfOnSave": false,
    "condition": "inconsciente",
    "rounds": 100,
    "repete": false
   }
  ],
  "traits": [
   "amorfo",
   "aversaoAoFogo",
   "t_imitacaoSulfurosa"
  ],
  "blurb": "Gosma inteligente que devora memórias com dano psíquico e enfraquece testes e ataques das vítimas, além de usar magias de enfeitiçar e paralisar. Pode criar cópias ilusórias de pessoas que já consumiu; fogo atrapalha seus ataques.",
  "lore": "O oblex é uma gosma astuta que se alimenta das lembranças de seres pensantes. Quanto mais memórias absorve, mais esperto e perigoso se torna, chegando a imitar as pessoas que devorou. Esconde-se em pântanos, no Subterrâneo e até nos esgotos e becos das cidades. Usa seus simulacros para atrair vítimas e cheira levemente a enxofre, o que pode denunciá-lo."
 },
 "mirmidaoElementalDoAr": {
  "id": "mirmidaoElementalDoAr",
  "tipo": "elemental",
  "name": "Mirmidão Elemental do Ar",
  "nomeOriginal": "Air Elemental Myrmidon",
  "fonte": "MTF",
  "size": "médio",
  "level": 5,
  "cr": "7",
  "xp": 2900,
  "abilities": {
   "str": 18,
   "dex": 14,
   "con": 14,
   "int": 9,
   "wis": 10,
   "cha": 10
  },
  "ac": 18,
  "acNote": "armadura de placas",
  "maxHp": 117,
  "hpDice": "18d8+36",
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
   "paralisado",
   "petrificado",
   "envenenado",
   "caido"
  ],
  "attacks": [
   {
    "name": "Mangual",
    "bonus": 7,
    "damage": "1d8+4",
    "type": "concussão",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mangual",
    "Mangual",
    "Mangual"
   ]
  },
  "traits": [
   "t_golpeRelampago",
   "armasMagicas"
  ],
  "blurb": "Guerreiro de vento encerrado em armadura que paira no ar e golpeia três vezes com seu mangual mágico. De tempos em tempos, descarrega um raio que pode deixar o alvo atordoado.",
  "lore": "É um espírito do ar preso dentro de uma armadura de placas por meio de rituais mágicos, criado para servir como soldado. Obedece com disciplina a quem o invocou e raramente age por vontade própria. Costuma guardar templos, fortalezas e santuários ligados ao elemento ar. Em combate, mantém-se flutuando e cerca os inimigos com rajadas e relâmpagos."
 },
 "alkilith": {
  "id": "alkilith",
  "tipo": "corruptor",
  "name": "Alkilith",
  "nomeOriginal": "Alkilith",
  "fonte": "MTF",
  "size": "médio",
  "level": 9,
  "cr": "11",
  "xp": 7200,
  "abilities": {
   "str": 12,
   "dex": 19,
   "con": 22,
   "int": 6,
   "wis": 11,
   "cha": 7
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 157,
  "hpDice": "15d8+90",
  "speedFt": 40,
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 120
  },
  "saves": [
   "dex",
   "con"
  ],
  "skills": [
   "furtividade"
  ],
  "expertise": [],
  "damageResistances": [
   "ácido",
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
   "enfeitiçado",
   "amedrontado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Tentáculo",
    "bonus": 8,
    "damage": "4d6+4",
    "type": "ácido",
    "reachFt": 15
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
  "traits": [
   "amorfo",
   "aparenciaFalsa",
   "t_fomentarLoucura",
   "resistenciaAMagia"
  ],
  "blurb": "Massa demoníaca que se disfarça de lodo e açoita com três tentáculos ácidos de longo alcance. Sua simples presença corrói a mente de quem está perto, podendo deixar a vítima em confusão.",
  "lore": "O alkilith é um demônio amorfo que lembra um tapete de fungo ou gosma pútrida. Costuma se infiltrar em frestas de portas, janelas e paredes, onde sua presença enfraquece a barreira entre os mundos e abre caminho para outros demônios do Abismo. Vive escondido no Subterrâneo e em cidades decadentes, esperando imóvel até que vítimas se aproximem. Não fala, mas entende o idioma abissal, e a loucura que espalha ao redor é muitas vezes o primeiro sinal de sua chegada."
 },
 "allip": {
  "id": "allip",
  "tipo": "morto-vivo",
  "name": "Allip",
  "nomeOriginal": "Allip",
  "fonte": "MTF",
  "size": "médio",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 6,
   "dex": 17,
   "con": 10,
   "int": 17,
   "wis": 15,
   "cha": 16
  },
  "ac": 13,
  "maxHp": 40,
  "hpDice": "9d8",
  "speedFt": 0,
  "flyFt": 40,
  "hover": true,
  "speeds": {
   "flyFt": 40
  },
  "senses": {
   "passivePerception": 15,
   "darkvisionFt": 60
  },
  "saves": [
   "int",
   "wis"
  ],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "damageResistances": [
   "ácido",
   "fogo",
   "elétrico",
   "trovejante",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "damageImmunities": [
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
    "name": "Toque Enlouquecedor",
    "bonus": 6,
    "damage": "4d6+3",
    "type": "psíquico",
    "reachFt": 5
   }
  ],
  "acoesEspeciais": [
   {
    "nome": "Sussurros da Loucura",
    "tipo": "alvo",
    "alcanceFt": 60,
    "alvos": 3,
    "save": "wis",
    "dc": 14,
    "damage": "1d8+3",
    "damageType": "psíquico",
    "halfOnSave": false
   },
   {
    "nome": "Balbucio Uivante",
    "recharge": [
     6
    ],
    "tipo": "area",
    "shape": "raio",
    "areaFt": 30,
    "save": "wis",
    "dc": 14,
    "damage": "2d8+3",
    "damageType": "psíquico",
    "halfOnSave": true,
    "condition": "atordoado",
    "rounds": 1,
    "repete": false,
    "ateFimDoTurnoDele": true
   }
  ],
  "traits": [
   "incorporealMovement"
  ],
  "blurb": "Espírito flutuante que ataca a mente: seu toque causa dano psíquico, seus sussurros forçam inimigos a golpear os próprios aliados e seu balbucio uivante pode atordoar todos ao redor. Atravessa paredes e resiste a armas comuns.",
  "lore": "O allip nasce quando alguém descobre um segredo guardado por uma maldição de um ser poderoso: o corpo é destruído e sobra apenas um espectro feito de pedaços da mente e de dor psíquica. Atormentado pelo conhecimento proibido, tenta aliviar o fardo despejando fragmentos dele em quem encontra, o que leva as vítimas à loucura. Alguns se escondem no gabinete de estudiosos e os induzem, por dias ou semanas, a escrever o segredo sem perceber, na esperança de escapar da maldição. Como morto-vivo, não precisa de ar, comida, bebida nem sono."
 },
 "amnizu": {
  "id": "amnizu",
  "tipo": "corruptor",
  "name": "Amnizu",
  "nomeOriginal": "Amnizu",
  "fonte": "MTF",
  "size": "médio",
  "level": 17,
  "cr": "18",
  "xp": 20000,
  "abilities": {
   "str": 11,
   "dex": 13,
   "con": 16,
   "int": 20,
   "wis": 12,
   "cha": 18
  },
  "ac": 21,
  "acNote": "armadura natural",
  "maxHp": 202,
  "hpDice": "27d8+81",
  "speedFt": 30,
  "flyFt": 40,
  "speeds": {
   "flyFt": 40
  },
  "senses": {
   "passivePerception": 17,
   "darkvisionFt": 120
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
   "enfeitiçado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Chicote de Feitor",
    "bonus": 11,
    "damage": "2d4+5",
    "type": "cortante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "6d10",
     "type": "energético"
    }
   },
   {
    "name": "Toque Disruptivo",
    "bonus": 11,
    "damage": "8d10",
    "type": "necrótico",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Chicote de Feitor",
    "Toque Disruptivo"
   ]
  },
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "dominarPessoa",
    "bolaDeFogo",
    "dominarMonstro",
    "enfraquecerOIntelecto",
    "enfeiticarPessoa",
    "comando"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "dominarPessoa": 3,
    "bolaDeFogo": 3,
    "dominarMonstro": 1,
    "enfraquecerOIntelecto": 1
   },
   "aVontade": [
    "enfeiticarPessoa",
    "comando"
   ],
   "cdPorMagia": {
    "dominarPessoa": 19,
    "bolaDeFogo": 19,
    "dominarMonstro": 19,
    "enfraquecerOIntelecto": 19,
    "enfeiticarPessoa": 19,
    "comando": 19
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Envenenar Mente",
    "tipo": "alvo",
    "alcanceFt": 60,
    "alvos": 2,
    "save": "wis",
    "dc": 19,
    "damage": "4d12",
    "damageType": "necrótico",
    "halfOnSave": false,
    "condition": "cego",
    "rounds": 1,
    "repete": false,
    "ateFimDoTurnoDele": true
   },
   {
    "nome": "Esquecimento",
    "recharge": [
     6
    ],
    "tipo": "alvo",
    "alcanceFt": 60,
    "save": "int",
    "dc": 18,
    "condition": "atordoado",
    "rounds": 10,
    "repete": false
   }
  ],
  "features": [
   "devilsSight"
  ],
  "traits": [
   "resistenciaAMagia",
   "t_encantoInstintivo"
  ],
  "blurb": "Comandante diabólico que fere com chicote de longo alcance e toque necrótico enquanto cega mentes à distância e pode atordoar e apagar memórias. Quem o ataca pode acabar golpeando um aliado.",
  "lore": "Os amnizus são oficiais dos Nove Infernos: conduzem legiões diabólicas à guerra e chefiam as sentinelas nos portões infernais. Prepotentes e cruéis, compensam a arrogância com mente estratégica afiada e lealdade inabalável aos arquiduques. Alguns vigiam o Rio Estige a partir de fortalezas em Dis e Estígia, recebendo as almas recém-chegadas como lemures. Ali, martelam as leis infernais nessas criaturas sem memória e as organizam em tropas."
 },
 "armanita": {
  "id": "armanita",
  "tipo": "corruptor",
  "name": "Armanita",
  "nomeOriginal": "Armanite",
  "fonte": "MTF",
  "size": "grande",
  "level": 5,
  "cr": "7",
  "xp": 2900,
  "abilities": {
   "str": 21,
   "dex": 18,
   "con": 21,
   "int": 8,
   "wis": 12,
   "cha": 13
  },
  "ac": 16,
  "acNote": "armadura natural",
  "maxHp": 84,
  "hpDice": "8d10+40",
  "speedFt": 60,
  "senses": {
   "passivePerception": 11,
   "darkvisionFt": 120
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
    "name": "Cascos",
    "bonus": 8,
    "damage": "2d6+5",
    "type": "concussão",
    "reachFt": 5
   },
   {
    "name": "Garras",
    "bonus": 8,
    "damage": "2d4+5",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Cauda Serrilhada",
    "bonus": 8,
    "damage": "2d10+5",
    "type": "cortante",
    "reachFt": 10
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Cascos",
    "Garras",
    "Cauda Serrilhada"
   ]
  },
  "breath": {
   "name": "Lança de Relâmpago",
   "kind": "save",
   "shape": "linha",
   "areaFt": 60,
   "save": "dex",
   "dc": 15,
   "damage": "6d8",
   "damageType": "elétrico",
   "halfOnSave": true,
   "origem": "sopro",
   "larguraFt": 10,
   "recharge": [
    5,
    6
   ]
  },
  "traits": [
   "resistenciaAMagia",
   "armasMagicas"
  ],
  "blurb": "Demônio veloz que avança como cavalaria pesada, golpeando com cascos, garras e cauda serrilhada no mesmo turno. Também dispara uma lança de relâmpago em linha que castiga grupos alinhados.",
  "lore": "Os armanitas são demônios com corpo de cavalo que correm em manadas pelas planícies devastadas do Abismo, movidos por pura sede de sangue. Os lordes demoníacos os usam como tropa de choque, lançando-os contra os flancos inimigos. Vivem para lutar e, sem adversários por perto, brigam entre si. Sua coragem beira a burrice, e diante de formações firmes recorrem à magia inata para abrir brechas com raios."
 },
 "couracadoAstral": {
  "id": "couracadoAstral",
  "tipo": "monstruosidade",
  "name": "Couraçado Astral",
  "nomeOriginal": "Astral Dreadnought",
  "fonte": "MTF",
  "size": "imenso",
  "level": 21,
  "cr": "21",
  "xp": 33000,
  "abilities": {
   "str": 28,
   "dex": 7,
   "con": 25,
   "int": 5,
   "wis": 14,
   "cha": 18
  },
  "ac": 20,
  "acNote": "armadura natural",
  "maxHp": 297,
  "hpDice": "17d20+119",
  "speedFt": 15,
  "flyFt": 80,
  "hover": true,
  "speeds": {
   "flyFt": 80
  },
  "senses": {
   "passivePerception": 19,
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
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "conditionImmunities": [
   "enfeitiçado",
   "exausto",
   "amedrontado",
   "paralisado",
   "petrificado",
   "envenenado",
   "caido",
   "atordoado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 16,
    "damage": "5d10+9",
    "type": "perfurante",
    "reachFt": 10,
    "engole": {
     "tamanhoMax": "huge",
     "exige": "zeroOuIncapacitado"
    }
   },
   {
    "name": "Garra",
    "bonus": 16,
    "damage": "3d6+9",
    "type": "cortante",
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
  "recursos": {
   "resistenciaLendaria": 3
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
     "nome": "Visita à Masmorra",
     "custo": 2,
     "tipo": "alvo",
     "alcanceFt": 60,
     "save": "cha",
     "dc": 19
    },
    {
     "nome": "Projeção Psíquica",
     "custo": 3,
     "tipo": "area",
     "raioFt": 60,
     "save": "wis",
     "dc": 19,
     "damage": "2d10+4",
     "damageType": "psíquico",
     "halfOnSave": true
    }
   ]
  },
  "traits": [
   "coneAntimagia",
   "t_entidadeAstral",
   "masmorraSemiplanar",
   "armasMagicas",
   "t_cortarCordaoDePrata",
   "acoesLendarias"
  ],
  "blurb": "Titã colossal que esmaga e devora com mordida e garras de longo alcance, enquanto seu olho anula toda magia num cone enorme. Quem cai diante dele é engolido para uma prisão em outro plano.",
  "lore": "Monstruosidade gigantesca criada por Tharizdun, o Deus Acorrentado, para caçar viajantes que buscam os portais do Plano Astral rumo às moradas dos deuses. Coberto de placas espinhosas, com garras em pinça e um único olho onde parecem girar constelações, vaga solitário pelo vazio prateado desde o início do multiverso. Não se comunica nem se reproduz: apenas devora o que encontra e segue sua patrulha silenciosa. O que engole vai parar num semiplano de pedra repleto de restos de vítimas antigas."
 },
 "eladrinDoOutono": {
  "id": "eladrinDoOutono",
  "tipo": "feérico",
  "name": "Eladrin do Outono",
  "nomeOriginal": "Autumn Eladrin",
  "fonte": "MTF",
  "size": "médio",
  "level": 9,
  "cr": "10",
  "xp": 5900,
  "abilities": {
   "str": 12,
   "dex": 16,
   "con": 16,
   "int": 14,
   "wis": 17,
   "cha": 18
  },
  "ac": 19,
  "acNote": "armadura natural",
  "maxHp": 127,
  "hpDice": "17d8+51",
  "speedFt": 30,
  "senses": {
   "passivePerception": 13,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "intuicao",
   "medicina"
  ],
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
    "name": "Espada Longa",
    "bonus": 5,
    "damage": "1d8+1",
    "type": "cortante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "4d8",
     "type": "psíquico"
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
     "damage": "4d8",
     "type": "psíquico"
    }
   }
  ],
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "curarFerimentos",
    "restauracaoMenor",
    "restauracaoMaior",
    "curaTotal",
    "reviverOsMortos",
    "acalmarEmocoes",
    "sono"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "curarFerimentos": 3,
    "restauracaoMenor": 3,
    "restauracaoMaior": 1,
    "curaTotal": 1,
    "reviverOsMortos": 1
   },
   "aVontade": [
    "acalmarEmocoes",
    "sono"
   ],
   "cdPorMagia": {
    "curarFerimentos": 16,
    "restauracaoMenor": 16,
    "restauracaoMaior": 16,
    "curaTotal": 16,
    "reviverOsMortos": 16,
    "acalmarEmocoes": 16,
    "sono": 16
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Passo Feérico",
    "recharge": [
     4,
     5,
     6
    ],
    "tipo": "teleporte",
    "alcanceFt": 30,
    "bonus": true
   }
  ],
  "aura": {
   "raioFt": 60,
   "quando": "inicioDoAlvo",
   "save": "wis",
   "dc": 16,
   "condition": "enfeiticado",
   "rounds": 10,
   "repete": true
  },
  "traits": [
   "aura",
   "t_passoFeerico",
   "resistenciaAMagia",
   "t_promoverAPaz"
  ],
  "blurb": "Encanta quem se aproxima e anula os ataques das criaturas enfeitiçadas, enquanto fere com espada ou arco carregados de dano psíquico. Também cura aliados com magias poderosas e se teleporta para escapar.",
  "lore": "Eladrins do outono são elfos feéricos ligados à estação da colheita e da serenidade. Habitam florestas encantadas, sobretudo nas bordas da Agrestia das Fadas, e costumam receber viajantes com hospitalidade. Preferem acalmar conflitos e tratar feridos a lutar. Quando forçados ao combate, usam seu encanto para desarmar a hostilidade antes de recorrer às armas."
 },
 "bael": {
  "id": "bael",
  "tipo": "corruptor",
  "name": "Bael",
  "nomeOriginal": "Bael",
  "fonte": "MTF",
  "size": "grande",
  "level": 17,
  "cr": "19",
  "xp": 22000,
  "abilities": {
   "str": 24,
   "dex": 17,
   "con": 20,
   "int": 21,
   "wis": 24,
   "cha": 24
  },
  "ac": 18,
  "acNote": "armadura de placas",
  "maxHp": 189,
  "hpDice": "18d10+90",
  "speedFt": 30,
  "senses": {
   "passivePerception": 23,
   "truesightFt": 120
  },
  "saves": [
   "dex",
   "con",
   "int",
   "cha"
  ],
  "skills": [
   "intimidacao",
   "percepcao",
   "persuasao"
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
   "enfeitiçado",
   "exausto",
   "amedrontado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Maça-Estrela Infernal",
    "bonus": 13,
    "damage": "2d8+7",
    "type": "perfurante",
    "reachFt": 20,
    "danoExtra": {
     "damage": "3d8",
     "type": "necrótico"
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
    "contramagia",
    "dissiparMagia",
    "voo",
    "sugestao",
    "muralhaDeFogo",
    "dominarMonstro",
    "alterarAparencia",
    "animarMortos",
    "enfeiticarPessoa",
    "detectarMagia",
    "infligirFerimentos",
    "invisibilidade",
    "imagemMaior"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "contramagia": 3,
    "dissiparMagia": 3,
    "voo": 3,
    "sugestao": 3,
    "muralhaDeFogo": 3,
    "dominarMonstro": 1
   },
   "aVontade": [
    "alterarAparencia",
    "animarMortos",
    "enfeiticarPessoa",
    "detectarMagia",
    "infligirFerimentos",
    "invisibilidade",
    "imagemMaior"
   ],
   "cdPorMagia": {
    "contramagia": 21,
    "dissiparMagia": 21,
    "voo": 21,
    "sugestao": 21,
    "muralhaDeFogo": 21,
    "dominarMonstro": 21,
    "alterarAparencia": 21,
    "animarMortos": 21,
    "enfeiticarPessoa": 21,
    "detectarMagia": 21,
    "infligirFerimentos": 21,
    "invisibilidade": 21,
    "imagemMaior": 21
   }
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "acoesEspeciais": [
   {
    "nome": "Teletransporte",
    "tipo": "teleporte",
    "alcanceFt": 120
   }
  ],
  "regeneracao": {
   "pv": 20,
   "bloqueia": [
    "frio",
    "radiante"
   ]
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Ataque",
     "custo": 2,
     "tipo": "golpe",
     "arma": "Maça-Estrela Infernal"
    },
    {
     "nome": "Despertar a Ganância",
     "custo": 1,
     "tipo": "magia",
     "magias": [
      "enfeiticarPessoa",
      "imagemMaior"
     ]
    },
    {
     "nome": "Comando Infernal",
     "custo": 1,
     "tipo": "especial",
     "acao": "Comando Infernal"
    },
    {
     "nome": "Teletransporte",
     "custo": 1,
     "tipo": "teleporte",
     "alcanceFt": 120
    }
   ]
  },
  "traits": [
   "t_comandoInfernal",
   "t_pavoroso",
   "resistenciaAMagia",
   "armasMagicas",
   "regeneracaoDoLivro",
   "acoesLendarias"
  ],
  "blurb": "Duque infernal que golpeia com uma maça-estrela de alcance enorme, regenera 20 PV por turno e aterroriza quem fica perto dele. Teletransporta-se pelo campo e usa magia de dominação e encantamento para virar inimigos contra aliados.",
  "lore": "Bael é um duque do Inferno, servo de alta patente nas hierarquias diabólicas e conhecido por sua crueldade calculada. Comanda legiões de diabos e prefere vencer pela manipulação, despertando a ganância dos mortais antes de esmagá-los. Sua presença é tão aterradora que guerreiros veteranos fogem só de vê-lo em fúria. Raramente luta sozinho e usa ilusões e encantamentos para escolher o terreno do confronto."
 },
 "balhannoth": {
  "id": "balhannoth",
  "tipo": "aberração",
  "name": "Balhannoth",
  "nomeOriginal": "Balhannoth",
  "fonte": "MTF",
  "size": "grande",
  "level": 9,
  "cr": "11",
  "xp": 7200,
  "abilities": {
   "str": 17,
   "dex": 8,
   "con": 18,
   "int": 6,
   "wis": 15,
   "cha": 8
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 114,
  "hpDice": "12d10+48",
  "speedFt": 25,
  "speeds": {
   "climbFt": 25
  },
  "senses": {
   "passivePerception": 16,
   "blindsightFt": 500
  },
  "saves": [
   "con"
  ],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "conditionImmunities": [
   "cego"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 7,
    "damage": "4d10+3",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Tentáculo",
    "bonus": 7,
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
  "multiattack": {
   "count": 6,
   "sequence": [
    "Tentáculo",
    "Tentáculo",
    "Tentáculo",
    "Tentáculo",
    "Tentáculo",
    "Tentáculo"
   ]
  },
  "recursos": {
   "resistenciaLendaria": 2
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Mordida",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Mordida"
    },
    {
     "nome": "Teletransporte",
     "custo": 1,
     "tipo": "teleporte",
     "alcanceFt": 60
    }
   ]
  },
  "traits": [
   "acoesLendarias"
  ],
  "blurb": "Agarra presas com quatro tentáculos de 3 m de alcance, morde quem está preso e se teleporta levando as vítimas. Pode ficar invisível e percebe tudo num raio enorme sem precisar de olhos.",
  "lore": "O balhannoth é um predador aberrante nascido no Pendor das Sombras, que se alimenta do medo e do desespero de suas presas. Com uma telepatia limitada, ele lê o que os viajantes desejam e molda a realidade do seu covil para imitar esse lugar sonhado, sempre com pequenos erros que denunciam o engano. Costuma rondar estradas movimentadas, escondido até poder capturar alguém e sumir para devorá-lo. Drow e outros habitantes do Subterrâneo às vezes o capturam para vigiar túneis, escravos e as entradas de seus enclaves."
 },
 "baphomet": {
  "id": "baphomet",
  "tipo": "corruptor",
  "name": "Baphomet",
  "nomeOriginal": "Baphomet",
  "fonte": "MTF",
  "size": "enorme",
  "level": 21,
  "cr": "23",
  "xp": 50000,
  "abilities": {
   "str": 30,
   "dex": 14,
   "con": 26,
   "int": 18,
   "wis": 24,
   "cha": 16
  },
  "ac": 22,
  "acNote": "armadura natural",
  "maxHp": 275,
  "hpDice": "19d12+152",
  "speedFt": 40,
  "senses": {
   "passivePerception": 24,
   "truesightFt": 120
  },
  "saves": [
   "dex",
   "con",
   "wis"
  ],
  "skills": [
   "intimidacao",
   "percepcao"
  ],
  "expertise": [
   "intimidacao"
  ],
  "damageResistances": [
   "frio",
   "fogo",
   "elétrico"
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
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Cortacoração",
    "bonus": 17,
    "damage": "2d10+10",
    "type": "cortante",
    "reachFt": 15
   },
   {
    "name": "Mordida",
    "bonus": 17,
    "damage": "2d8+10",
    "type": "perfurante",
    "reachFt": 10
   },
   {
    "name": "Chifrada",
    "bonus": 17,
    "damage": "2d6+10",
    "type": "perfurante",
    "reachFt": 10,
    "investida": {
     "pes": 10,
     "save": "str",
     "dc": 25,
     "dano": "3d10",
     "tipo": "perfurante"
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Cortacoração",
    "Mordida",
    "Chifrada"
   ]
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "teletransporte",
    "dissiparMagia",
    "dominarBesta",
    "marcaDoCacador",
    "labirinto",
    "muralhaDePedra",
    "detectarMagia"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "teletransporte": 1,
    "dissiparMagia": 3,
    "dominarBesta": 3,
    "marcaDoCacador": 3,
    "labirinto": 3,
    "muralhaDePedra": 3
   },
   "aVontade": [
    "detectarMagia"
   ],
   "cdPorMagia": {
    "teletransporte": 18,
    "dissiparMagia": 18,
    "dominarBesta": 18,
    "marcaDoCacador": 18,
    "labirinto": 18,
    "muralhaDePedra": 18,
    "detectarMagia": 18
   }
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
     "nome": "Golpe de Cortacoração",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Cortacoração"
    },
    {
     "nome": "Investida",
     "custo": 2,
     "tipo": "golpe",
     "arma": "Chifrada"
    }
   ]
  },
  "traits": [
   "presencaAterradora",
   "t_memoriaLabirintica",
   "resistenciaAMagia",
   "armasMagicas",
   "imprudente",
   "acoesLendarias"
  ],
  "blurb": "Senhor demônio com cabeça de touro que avança em investidas brutais, derrubando alvos com os chifres e retalhando com a glaive Cortacoração a 4,5 m de alcance. Sua presença aterrorizante e a imprudência calculada tornam cada turno perto dele um risco mortal.",
  "lore": "Baphomet é o Príncipe das Bestas, um lorde demônio do Abismo que governa uma fortaleza labiríntica e cultua a selvageria. Ele despreza a civilização e quer que todos cedam aos instintos brutais que escondem. Seus seguidores incluem minotauros e cultistas que caçam presas em labirintos em sua honra. Em combate, é um caçador implacável que nunca esquece um caminho percorrido."
 },
 "berbalang": {
  "id": "berbalang",
  "tipo": "aberração",
  "name": "Berbalang",
  "nomeOriginal": "Berbalang",
  "fonte": "MTF",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 9,
   "dex": 16,
   "con": 9,
   "int": 17,
   "wis": 11,
   "cha": 10
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 38,
  "hpDice": "11d8-11",
  "speedFt": 30,
  "flyFt": 40,
  "speeds": {
   "flyFt": 40
  },
  "senses": {
   "passivePerception": 12,
   "truesightFt": 120
  },
  "saves": [
   "dex",
   "int"
  ],
  "skills": [
   "arcanismo",
   "historia",
   "intuicao",
   "percepcao",
   "religiao"
  ],
  "expertise": [],
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
    "name": "Garras",
    "bonus": 5,
    "damage": "2d4+3",
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
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "viagemPlanar",
    "falarComOsMortos"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "viagemPlanar": 1
   },
   "aVontade": [
    "falarComOsMortos"
   ],
   "cdPorMagia": {
    "viagemPlanar": 13,
    "falarComOsMortos": 13
   }
  },
  "traits": [
   "t_duplicataEspectral"
  ],
  "blurb": "Morde e arranha em combate corpo a corpo, mas seu truque mais perigoso é enviar uma cópia espectral que causa dano psíquico enquanto o corpo verdadeiro fica inconsciente e vulnerável. Enxerga a verdade a 36 m e pode fugir mudando de plano.",
  "lore": "Os berbalangs rastejam sobre os cadáveres petrificados de deuses que flutuam no Plano Astral. Vivem pela obsessão de acumular segredos, invocando os espíritos dos mortos para interrogá-los e anotando as respostas nos próprios ossos dessas criaturas. Quase nunca falam com os vivos, mas os espionam com duplicatas espectrais, sempre por pouco tempo, já que o corpo fica desacordado nesse período. Viajantes poderosos os procuram como oráculos, mas só são atendidos se trouxerem um segredo valioso ou ossos interessantes; os githyanki às vezes os usam como espiões e vigias."
 },
 "abishaiNegro": {
  "id": "abishaiNegro",
  "tipo": "corruptor",
  "name": "Abishai Negro",
  "nomeOriginal": "Black Abishai",
  "fonte": "MTF",
  "size": "médio",
  "level": 5,
  "cr": "7",
  "xp": 2900,
  "abilities": {
   "str": 14,
   "dex": 17,
   "con": 14,
   "int": 13,
   "wis": 16,
   "cha": 11
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 58,
  "hpDice": "9d8+18",
  "speedFt": 30,
  "flyFt": 40,
  "speeds": {
   "flyFt": 40
  },
  "senses": {
   "passivePerception": 16,
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
  "expertise": [],
  "damageResistances": [
   "frio",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "damageImmunities": [
   "ácido",
   "fogo",
   "veneno"
  ],
  "conditionImmunities": [
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Cimitarra",
    "bonus": 6,
    "damage": "1d6+3",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Mordida",
    "bonus": 6,
    "damage": "1d10+3",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "2d8",
     "type": "ácido"
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Cimitarra",
    "Cimitarra",
    "Mordida"
   ]
  },
  "features": [
   "devilsSight"
  ],
  "traits": [
   "t_escuridaoRastejante",
   "resistenciaAMagia",
   "armasMagicas",
   "furtividadeNasSombras"
  ],
  "blurb": "Espreita nas sombras e se esconde como ação bônus, depois ataca com duas cimitarras e uma mordida ácida. Pode cobrir o campo com uma escuridão mágica que só ele enxerga através e que ele desloca à vontade.",
  "lore": "Os abishais negros são diabos dracônicos a serviço de Tiamat nos Nove Infernos, especializados em emboscada e infiltração. Atuam como espiões e assassinos, movendo-se em silêncio pelas trevas que eles mesmos conjuram. Com escamas escuras e asas largas, preferem cidades e lugares sombrios onde possam caçar sem serem vistos. Obedecem com fanatismo à Rainha dos Dragões e desprezam os mortais que enfrentam."
 },
 "abishaiAzul": {
  "id": "abishaiAzul",
  "tipo": "corruptor",
  "name": "Abishai Azul",
  "nomeOriginal": "Blue Abishai",
  "fonte": "MTF",
  "size": "médio",
  "level": 17,
  "cr": "17",
  "xp": 18000,
  "abilities": {
   "str": 15,
   "dex": 14,
   "con": 17,
   "int": 22,
   "wis": 23,
   "cha": 18
  },
  "ac": 19,
  "acNote": "armadura natural",
  "maxHp": 195,
  "hpDice": "26d8+78",
  "speedFt": 30,
  "flyFt": 50,
  "speeds": {
   "flyFt": 50
  },
  "senses": {
   "passivePerception": 16,
   "darkvisionFt": 120
  },
  "saves": [
   "int",
   "wis"
  ],
  "skills": [
   "arcanismo"
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
   "elétrico",
   "veneno"
  ],
  "conditionImmunities": [
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Bordão",
    "bonus": 8,
    "damage": "1d6+2",
    "type": "concussão",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d8+2",
     "type": "concussão"
    }
   },
   {
    "name": "Mordida",
    "bonus": 8,
    "damage": "2d10+2",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "4d6",
     "type": "elétrico"
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Bordão",
    "Mordida"
   ]
  },
  "spellcasting": {
   "ability": "int",
   "cantrips": [
    "amizade",
    "maoMagica",
    "mensagem",
    "ilusaoMenor",
    "toqueChocante"
   ],
   "prepared": [
    "orbeCromatico",
    "disfarcarSe",
    "recuoAcelerado",
    "misselMagico",
    "enfeiticarPessoa",
    "ondaTrovejante",
    "escuridao",
    "imagemEspelhada",
    "passoNebuloso",
    "dissiparMagia",
    "medo",
    "relampago",
    "dimensaoPorta",
    "invisibilidadeMaior",
    "tempestadeDeGelo",
    "coneDeFrio",
    "muralhaDeForca",
    "correnteDeRelampagos",
    "teletransporte"
   ],
   "slots": [
    0,
    4,
    3,
    3,
    3,
    2,
    1,
    1
   ],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "cdPorMagia": {
    "amizade": 20,
    "maoMagica": 20,
    "mensagem": 20,
    "ilusaoMenor": 20,
    "toqueChocante": 20,
    "orbeCromatico": 20,
    "disfarcarSe": 20,
    "recuoAcelerado": 20,
    "misselMagico": 20,
    "enfeiticarPessoa": 20,
    "ondaTrovejante": 20,
    "escuridao": 20,
    "imagemEspelhada": 20,
    "passoNebuloso": 20,
    "dissiparMagia": 20,
    "medo": 20,
    "relampago": 20,
    "dimensaoPorta": 20,
    "invisibilidadeMaior": 20,
    "tempestadeDeGelo": 20,
    "coneDeFrio": 20,
    "muralhaDeForca": 20,
    "correnteDeRelampagos": 20,
    "teletransporte": 20
   }
  },
  "features": [
   "devilsSight"
  ],
  "traits": [
   "resistenciaAMagia",
   "armasMagicas"
  ],
  "blurb": "Conjurador infernal de 13º nível que domina o campo com relâmpagos, frio, invisibilidade e muralhas de energia; de perto, alterna bordão e uma mordida carregada de eletricidade.",
  "lore": "Abishais azuis são diabos dracônicos a serviço de Tiamat nos Nove Infernos, devotados ao estudo da magia arcana. Preferem agir das sombras, usando ilusões, disfarces e encantos para manipular mortais e cumprir os planos da Rainha dos Dragões. Costumam rondar cidades e regiões costeiras atrás de segredos mágicos e servos úteis. Em combate, mantêm distância e só se aproximam quando o inimigo já está enfraquecido."
 },
 "garraDeOsso": {
  "id": "garraDeOsso",
  "tipo": "morto-vivo",
  "name": "Garra de Osso",
  "nomeOriginal": "Boneclaw",
  "fonte": "MTF",
  "size": "grande",
  "level": 9,
  "cr": "12",
  "xp": 8400,
  "abilities": {
   "str": 19,
   "dex": 16,
   "con": 15,
   "int": 13,
   "wis": 15,
   "cha": 9
  },
  "ac": 16,
  "acNote": "armadura natural",
  "maxHp": 127,
  "hpDice": "17d10+34",
  "speedFt": 40,
  "senses": {
   "passivePerception": 16,
   "darkvisionFt": 60
  },
  "saves": [
   "dex",
   "con",
   "wis"
  ],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "damageResistances": [
   "frio",
   "necrótico",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "conditionImmunities": [
   "enfeitiçado",
   "exausto",
   "amedrontado",
   "paralisado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Garra Perfurante",
    "bonus": 8,
    "damage": "3d10+4",
    "type": "perfurante",
    "reachFt": 15,
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
    "Garra Perfurante",
    "Garra Perfurante"
   ]
  },
  "acoesEspeciais": [
   {
    "nome": "Salto Sombrio",
    "tipo": "teleporte",
    "alcanceFt": 60
   }
  ],
  "traits": [
   "t_rejuvenescimento",
   "furtividadeNasSombras",
   "t_alcanceMortal"
  ],
  "blurb": "Espreita nas sombras e fisga vítimas a até 4,5 m com garras longas, puxando-as para perto e agarrando-as. Pode explodir em energia necrótica e se teletransportar pela escuridão levando a presa consigo.",
  "lore": "O garra de osso surge quando um mago tenta virar lich e falha: sua alma, sem forças para chegar ao filactério, procura um humanoide próximo cheio de ódio e se prende a ele. A partir daí, o morto-vivo serve aos desejos, conscientes ou não, desse novo mestre, que pode ser um criminoso qualquer ou até uma criança cruel. Gargalhando, ele se esconde em cantos escuros como uma aranha e tem prazer em torturar e matar. Enquanto o mestre viver, ele sempre volta, mas se o mestre abandonar sinceramente o mal, a criatura se desfaz para sempre. Não precisa respirar, comer, beber nem dormir."
 },
 "batedorDeBronze": {
  "id": "batedorDeBronze",
  "tipo": "constructo",
  "name": "Batedor de Bronze",
  "nomeOriginal": "Bronze Scout",
  "fonte": "MTF",
  "size": "médio",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 10,
   "dex": 16,
   "con": 11,
   "int": 3,
   "wis": 14,
   "cha": 1
  },
  "ac": 13,
  "maxHp": 18,
  "hpDice": "4d8",
  "speedFt": 30,
  "speeds": {
   "burrowFt": 30
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
   "percepcao",
   "furtividade"
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
   "petrificado",
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
     "damage": "1d6",
     "type": "elétrico"
    }
   }
  ],
  "acoesEspeciais": [
   {
    "nome": "Clarão Elétrico",
    "tipo": "area",
    "shape": "raio",
    "areaFt": 15,
    "save": "dex",
    "dc": 13,
    "damage": "4d6",
    "damageType": "elétrico",
    "halfOnSave": true
   }
  ],
  "traits": [
   "t_armaduraDeTerra",
   "resistenciaAMagia"
  ],
  "blurb": "Escava sob o solo sem provocar ataques de oportunidade e emerge para morder com eletricidade. Uma vez por descanso, descarrega um clarão elétrico que atinge todos que tocam o chão ao redor.",
  "lore": "O batedor de bronze é um autômato de engrenagens criado por gnomos para vigiar e explorar territórios. Seu corpo segmentado lembra um verme metálico que se move sob a terra com facilidade. Costuma ficar enterrado perto da superfície, observando com sentidos aguçados e esperando ordens do criador. Quando ameaçado, surge de repente e eletrifica o solo à sua volta."
 },
 "bulezau": {
  "id": "bulezau",
  "tipo": "corruptor",
  "name": "Bulezau",
  "nomeOriginal": "Bulezau",
  "fonte": "MTF",
  "size": "médio",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 15,
   "dex": 14,
   "con": 17,
   "int": 8,
   "wis": 9,
   "cha": 6
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 52,
  "hpDice": "7d8+21",
  "speedFt": 40,
  "senses": {
   "passivePerception": 9,
   "darkvisionFt": 120
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
    "name": "Cauda Farpada",
    "bonus": 4,
    "damage": "1d12+2",
    "type": "perfurante",
    "reachFt": 5,
    "onHit": {
     "save": "con",
     "dc": 13,
     "condition": "envenenado",
     "rounds": 1,
     "repete": true
    }
   }
  ],
  "traits": [
   "t_presencaPutrefata",
   "t_saltoParado",
   "pesFirmes"
  ],
  "blurb": "Demônio saltador que ataca com uma cauda farpada capaz de transmitir uma doença que corrói os PV máximos. Sua simples presença apodrece a carne de quem está por perto, e em bando o dano se acumula.",
  "lore": "Os bulezaus são demônios doentes que encarnam a fúria bestial da natureza. Habitam desfiladeiros e penhascos do Abismo e costumam servir como tropa de linha nos exércitos dos lordes demoníacos. Vivem para a matança e não temem morrer, por isso aparecem em quase toda comitiva demoníaca. Quando ninguém os comanda, juntam-se em turbas que brigam entre si até surgir uma presa melhor. Seus corpos são cobertos de feridas com larvas e exalam fedor de carne podre."
 },
 "coletorDeCadaveres": {
  "id": "coletorDeCadaveres",
  "tipo": "constructo",
  "name": "Coletor de Cadáveres",
  "nomeOriginal": "Cadaver Collector",
  "fonte": "MTF",
  "size": "grande",
  "level": 13,
  "cr": "14",
  "xp": 11500,
  "abilities": {
   "str": 21,
   "dex": 14,
   "con": 20,
   "int": 5,
   "wis": 11,
   "cha": 8
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 189,
  "hpDice": "18d10+90",
  "speedFt": 30,
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
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
    "damage": "3d8+5",
    "type": "concussão",
    "reachFt": 5,
    "danoExtra": {
     "damage": "3d10",
     "type": "necrótico"
    }
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
    "nome": "Sopro Paralisante",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 30,
    "save": "con",
    "dc": 18,
    "condition": "paralisado",
    "rounds": 10,
    "repete": false
   }
  ],
  "traits": [
   "resistenciaAMagia",
   "t_invocarEspectros"
  ],
  "blurb": "Um colosso de sucata bélica que paralisa grupos inteiros com seu sopro de gás e depois esmaga as vítimas com golpes que também drenam vida. Ainda pode erguer espectros dos mortos que carrega para cercar os inimigos.",
  "lore": "É uma máquina de guerra antiquíssima que vaga sem rumo pelas planícies devastadas de Aqueronte até ser convocada por algum necromante ou senhor da guerra cruel. Só atende ao chamado quando há uma grande batalha em curso, prestes a começar ou já travada. Cobre-se com armaduras e armas dos soldados caídos e espeta os corpos deles nas lanças presas à própria carcaça. Se quem a invocou morre, pode perambular pelo Plano Material por séculos, juntando cadáveres e buscando um caminho de volta. Não precisa respirar, comer, beber nem dormir."
 },
 "canoloth": {
  "id": "canoloth",
  "tipo": "corruptor",
  "name": "Canoloth",
  "nomeOriginal": "Canoloth",
  "fonte": "MTF",
  "size": "médio",
  "level": 5,
  "cr": "8",
  "xp": 3900,
  "abilities": {
   "str": 18,
   "dex": 10,
   "con": 17,
   "int": 5,
   "wis": 17,
   "cha": 12
  },
  "ac": 16,
  "acNote": "armadura natural",
  "maxHp": 120,
  "hpDice": "16d8+48",
  "speedFt": 50,
  "senses": {
   "passivePerception": 19,
   "darkvisionFt": 60,
   "truesightFt": 120
  },
  "saves": [],
  "skills": [
   "investigacao",
   "percepcao"
  ],
  "expertise": [
   "investigacao",
   "percepcao"
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
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 7,
    "damage": "6d6+4",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Garras",
    "bonus": 7,
    "damage": "2d10+4",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Língua",
    "bonus": 7,
    "damage": "2d12+4",
    "type": "perfurante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 30,
    "longRangeFt": 30,
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
   "count": 2,
   "sequencias": [
    [
     "Língua",
     "Garras"
    ],
    [
     "Mordida",
     "Garras"
    ]
   ]
  },
  "traits": [
   "t_travaDimensional",
   "resistenciaAMagia",
   "armasMagicas",
   "sempreAlerta"
  ],
  "blurb": "Caçador yugoloth que puxa presas de longe com a língua farpada e as despedaça com mordida e garras. Impede qualquer teletransporte por perto e enxerga através de ilusões e invisibilidade.",
  "lore": "O canoloth é um yugoloth bestial, parecido com um cão de caça sem olhos e coberto de placas, usado como rastreador e sentinela. Mercenários de outros yugoloths e de quem pagar bem, eles guardam portais, cofres e prisioneiros com lealdade fria ao contrato. Seus sentidos sobrenaturais quase nunca são enganados, e sua presença trava viagens mágicas ao redor. Aparecem em cidades, costas e nas profundezas do Subterrâneo, onde caçam fugitivos."
 },
 "estrangulador": {
  "id": "estrangulador",
  "tipo": "aberração",
  "name": "Estrangulador",
  "nomeOriginal": "Choker",
  "fonte": "MTF",
  "size": "pequeno",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 16,
   "dex": 14,
   "con": 13,
   "int": 4,
   "wis": 12,
   "cha": 7
  },
  "ac": 16,
  "acNote": "armadura natural",
  "maxHp": 13,
  "hpDice": "3d6+3",
  "speedFt": 30,
  "senses": {
   "passivePerception": 11,
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
    "name": "Tentáculo",
    "bonus": 5,
    "damage": "1d4+3",
    "type": "concussão",
    "reachFt": 10,
    "danoExtra": {
     "damage": "1d6",
     "type": "perfurante"
    },
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
   "count": 2,
   "sequence": [
    "Tentáculo",
    "Tentáculo"
   ]
  },
  "traits": [
   "t_rapidezAberrante",
   "t_semOssos",
   "spiderClimb"
  ],
  "blurb": "Escondido em frestas e tetos, ataca de longe com dois tentáculos de 3 m de alcance que agarram e contêm a vítima. Uma vez por descanso pode agir duas vezes no mesmo turno, prendendo dois alvos de surpresa.",
  "lore": "Pequena aberração subterrânea de membros finos e borrachudos, com cartilagem no lugar de ossos. Enfia-se em rachaduras das paredes de cavernas e espera, imóvel e silenciosa, que algo passe perto. Costuma deixar o cadáver da última presa à vista como isca, beliscando a carne quando tem fome; goblins são seu petisco preferido. Caça sozinho, mas raramente há um só na região, e eles se comunicam por uivos agudos que ecoam pela rocha."
 },
 "florCadaver": {
  "id": "florCadaver",
  "tipo": "planta",
  "name": "Flor-Cadáver",
  "nomeOriginal": "Corpse Flower",
  "fonte": "MTF",
  "size": "grande",
  "level": 5,
  "cr": "8",
  "xp": 3900,
  "abilities": {
   "str": 14,
   "dex": 14,
   "con": 16,
   "int": 7,
   "wis": 15,
   "cha": 3
  },
  "ac": 12,
  "maxHp": 127,
  "hpDice": "15d10+45",
  "speedFt": 20,
  "speeds": {
   "climbFt": 20
  },
  "senses": {
   "passivePerception": 12,
   "blindsightFt": 120
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [
   "cego",
   "surdo"
  ],
  "attacks": [
   {
    "name": "Tentáculo",
    "bonus": 5,
    "damage": "2d6+2",
    "type": "concussão",
    "reachFt": 10,
    "onHit": {
     "save": "con",
     "dc": 14,
     "danoSeFalhar": {
      "damage": "4d6",
      "type": "veneno"
     },
     "metadeSePassar": false
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
  "aura": {
   "raioFt": 10,
   "quando": "inicioDoAlvo",
   "save": "con",
   "dc": 14,
   "condition": "envenenado",
   "rounds": 1
  },
  "traits": [
   "t_colherOsMortos",
   "t_cadaveres",
   "spiderClimb",
   "aura"
  ],
  "blurb": "Açoita com três tentáculos venenosos a 3 m e espalha um fedor que deixa incapacitado quem estiver por perto. Usa os cadáveres guardados no corpo para se curar ou para erguer zumbis.",
  "lore": "Esta planta maligna brota sobre o túmulo de necromantes perversos ou sobre os restos de mortos-vivos poderosos. Se não for arrancada e queimada ainda como muda, cresce por semanas até se soltar do solo e sair em busca de cadáveres em cemitérios e campos de batalha. Ela enfia os corpos dentro de si para se alimentar e se regenerar, e odeia tudo o que vive. Seu cheiro de podridão serve de defesa e só se dissipa alguns dias depois que ela morre."
 },
 "bruxoMorto": {
  "id": "bruxoMorto",
  "tipo": "morto-vivo",
  "name": "Bruxo Morto",
  "nomeOriginal": "Deathlock",
  "fonte": "MTF",
  "size": "médio",
  "level": 1,
  "cr": "4",
  "xp": 1100,
  "abilities": {
   "str": 11,
   "dex": 15,
   "con": 10,
   "int": 14,
   "wis": 12,
   "cha": 16
  },
  "ac": 12,
  "acNote": "15 com armadura arcana",
  "maxHp": 36,
  "hpDice": "8d8",
  "speedFt": 30,
  "senses": {
   "passivePerception": 11,
   "darkvisionFt": 60
  },
  "saves": [
   "int",
   "cha"
  ],
  "skills": [
   "arcanismo",
   "historia"
  ],
  "expertise": [],
  "damageResistances": [
   "necrótico",
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
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Garra Mortal",
    "bonus": 4,
    "damage": "2d6+2",
    "type": "necrótico",
    "reachFt": 5
   }
  ],
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "detectarMagia",
    "disfarcarSe",
    "armaduraArcana"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "aVontade": [
    "detectarMagia",
    "disfarcarSe",
    "armaduraArcana"
   ],
   "cdPorMagia": {
    "detectarMagia": 13,
    "disfarcarSe": 13,
    "armaduraArcana": 13
   }
  },
  "traits": [
   "resisteExpulsar"
  ],
  "blurb": "Morto-vivo conjurador que prefere lutar à distância com rajada mística e magias de bruxo como braços e fome de Hadar, imobilizar pessoa e invisibilidade. De perto, sua garra causa dano necrótico, e armas comuns não prateadas o ferem pouco.",
  "lore": "Um bruxo que quebra o acordo com um patrono maligno pode voltar dos mortos como esta criatura, presa a servir seu mestre além da morte. Necromantes muito poderosos também conseguem criá-lo e assumir o papel de patrono. Ao despertar, perde as ambições que tinha em vida e passa a viver apenas para cumprir as vontades do mestre, seja destruir um templo, seja reunir lacaios ou materiais para rituais terríveis. Não precisa respirar, comer, beber nem dormir."
 },
 "mestreBruxomorto": {
  "id": "mestreBruxomorto",
  "tipo": "morto-vivo",
  "name": "Mestre Bruxomorto",
  "nomeOriginal": "Deathlock Mastermind",
  "fonte": "MTF",
  "size": "médio",
  "level": 5,
  "cr": "8",
  "xp": 3900,
  "abilities": {
   "str": 11,
   "dex": 16,
   "con": 12,
   "int": 15,
   "wis": 12,
   "cha": 17
  },
  "ac": 13,
  "acNote": "16 com armadura arcana",
  "maxHp": 110,
  "hpDice": "20d8+20",
  "speedFt": 30,
  "senses": {
   "passivePerception": 14,
   "darkvisionFt": 120
  },
  "saves": [
   "int",
   "cha"
  ],
  "skills": [
   "arcanismo",
   "historia",
   "percepcao"
  ],
  "expertise": [],
  "damageResistances": [
   "necrótico",
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
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Garra Mortal",
    "bonus": 6,
    "damage": "3d6+3",
    "type": "necrótico",
    "reachFt": 5
   },
   {
    "name": "Raios Sepulcrais",
    "bonus": 6,
    "damage": "4d8",
    "type": "necrótico",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 120,
    "longRangeFt": 120,
    "onHit": {
     "save": "str",
     "dc": 16,
     "condition": "contido",
     "rounds": 10,
     "repete": true
    }
   }
  ],
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "detectarMagia",
    "disfarcarSe",
    "armaduraArcana"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "aVontade": [
    "detectarMagia",
    "disfarcarSe",
    "armaduraArcana"
   ],
   "cdPorMagia": {
    "detectarMagia": 14,
    "disfarcarSe": 14,
    "armaduraArcana": 14
   }
  },
  "traits": [
   "resisteExpulsar"
  ],
  "blurb": "Conjurador morto-vivo que prende alvos à distância com raios sombrios que os deixam contidos e controla o campo com magias de bruxo como contramágica e imobilizar monstro.",
  "lore": "O bruxomorto é um bruxo que falhou em cumprir seu pacto e foi reerguido como morto-vivo pelo próprio patrono, preso a servi-lo além da morte. O mestre é o mais astuto da espécie, um estrategista que organiza planos complexos nas cidades. Muitas vezes se disfarça de vivo com ilusões para manipular cultos e agentes. Conserva a fala e o conhecimento que tinha em vida, mas sua vontade pertence a quem o reanimou."
 },
 "carnicalCondenado": {
  "id": "carnicalCondenado",
  "tipo": "morto-vivo",
  "name": "Carniçal Condenado",
  "nomeOriginal": "Deathlock Wight",
  "fonte": "MTF",
  "size": "médio",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 11,
   "dex": 14,
   "con": 16,
   "int": 12,
   "wis": 14,
   "cha": 16
  },
  "ac": 12,
  "acNote": "15 com armadura arcana",
  "maxHp": 37,
  "hpDice": "5d8+15",
  "speedFt": 30,
  "senses": {
   "passivePerception": 14,
   "darkvisionFt": 60
  },
  "saves": [
   "wis"
  ],
  "skills": [
   "arcanismo",
   "percepcao"
  ],
  "expertise": [],
  "damageResistances": [
   "necrótico",
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
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Raio Sepulcral",
    "bonus": 5,
    "damage": "1d8+3",
    "type": "necrótico",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 120,
    "longRangeFt": 120
   },
   {
    "name": "Drenar Vida",
    "bonus": 4,
    "damage": "2d6+2",
    "type": "necrótico",
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
    "medo",
    "imobilizarPessoa",
    "passoNebuloso",
    "detectarMagia",
    "disfarcarSe",
    "armaduraArcana"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "medo": 1,
    "imobilizarPessoa": 1,
    "passoNebuloso": 1
   },
   "aVontade": [
    "detectarMagia",
    "disfarcarSe",
    "armaduraArcana"
   ],
   "cdPorMagia": {
    "medo": 13,
    "imobilizarPessoa": 13,
    "passoNebuloso": 13,
    "detectarMagia": 13,
    "disfarcarSe": 13,
    "armaduraArcana": 13
   }
  },
  "traits": [
   "sunlightSensitivity"
  ],
  "blurb": "Fica à distância disparando dois Raios Sepulcrais necróticos e usa magias como medo e imobilizar pessoa; de perto, seu toque drena a vida e reduz o máximo de PV.",
  "lore": "É o cadáver reanimado de um bruxo que falhou com seu patrono e foi condenado a continuar servindo após a morte. Mantém parte do conhecimento arcano e da astúcia que tinha em vida. Costuma vigiar lugares de interesse do patrono ou comandar bandos de zumbis criados com suas vítimas. Detesta a luz do sol e prefere agir em ruínas e na escuridão."
 },
 "demogorgon": {
  "id": "demogorgon",
  "tipo": "corruptor",
  "name": "Demogorgon",
  "nomeOriginal": "Demogorgon",
  "fonte": "MTF",
  "size": "enorme",
  "level": 25,
  "cr": "26",
  "xp": 90000,
  "abilities": {
   "str": 29,
   "dex": 14,
   "con": 26,
   "int": 20,
   "wis": 17,
   "cha": 25
  },
  "ac": 22,
  "acNote": "armadura natural",
  "maxHp": 406,
  "hpDice": "28d12+224",
  "speedFt": 50,
  "speeds": {
   "swimFt": 50
  },
  "senses": {
   "passivePerception": 29,
   "truesightFt": 120
  },
  "saves": [
   "dex",
   "con",
   "wis",
   "cha"
  ],
  "skills": [
   "intuicao",
   "percepcao"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageResistances": [
   "frio",
   "fogo",
   "elétrico"
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
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Tentáculo",
    "bonus": 17,
    "damage": "3d12+9",
    "type": "concussão",
    "reachFt": 10
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Tentáculo",
    "Tentáculo"
   ]
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "dissiparMagia",
    "medo",
    "telecinesia",
    "enfraquecerOIntelecto",
    "detectarMagia",
    "imagemMaior"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "dissiparMagia": 3,
    "medo": 3,
    "telecinesia": 3,
    "enfraquecerOIntelecto": 1
   },
   "aVontade": [
    "detectarMagia",
    "imagemMaior"
   ],
   "cdPorMagia": {
    "dissiparMagia": 23,
    "medo": 23,
    "telecinesia": 23,
    "enfraquecerOIntelecto": 23,
    "detectarMagia": 23,
    "imagemMaior": 23
   }
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "acoesEspeciais": [
   {
    "nome": "Olhar",
    "tipo": "alvo",
    "alcanceFt": 120,
    "save": "wis",
    "dc": 23,
    "condition": "incapacitado",
    "rounds": 10,
    "repete": false
   }
  ],
  "lendarias": {
   "acoes": 2,
   "opcoes": [
    {
     "nome": "Cauda",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Cauda",
     "ataque": {
      "name": "Cauda",
      "bonus": 17,
      "damage": "2d10+9",
      "type": "concussão",
      "reachFt": 15,
      "danoExtra": {
       "damage": "2d10",
       "type": "necrótico"
      }
     }
    },
    {
     "nome": "Olhar Enlouquecedor",
     "custo": 1,
     "tipo": "especial",
     "acao": "Olhar"
    }
   ]
  },
  "traits": [
   "resistenciaAMagia",
   "armasMagicas",
   "t_duasCabecas",
   "acoesLendarias"
  ],
  "blurb": "Gigante demoníaco de duas cabeças que esmaga com tentáculos capazes de drenar o PV máximo e usa o olhar para atordoar, enfeitiçar ou enlouquecer quem o encara. Resiste à magia e só é ferido de verdade por armas mágicas.",
  "lore": "Conhecido como Príncipe dos Demônios, Demogorgon é um senhor do Abismo que personifica a loucura e a ruína, desejando arrastar todo o multiverso para o caos. Seu corpo mistura pernas de réptil, tronco de grande símio, tentáculos nos ombros e duas cabeças simiescas, Aameul e Hathradiah, que vivem em desacordo. Até o símbolo espiral de seu culto corrói a mente de quem o contempla, e seus seguidores acabam perdendo a sanidade. Ele habita Abysm, um palácio de torres gêmeas em forma de serpente cuja maior parte se estende por cavernas frias e submersas."
 },
 "derro": {
  "id": "derro",
  "tipo": "humanoide",
  "name": "Derro",
  "nomeOriginal": "Derro",
  "fonte": "MTF",
  "size": "pequeno",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 10,
   "dex": 14,
   "con": 12,
   "int": 11,
   "wis": 5,
   "cha": 9
  },
  "ac": 13,
  "acNote": "armadura de couro",
  "maxHp": 13,
  "hpDice": "3d6+3",
  "speedFt": 30,
  "senses": {
   "passivePerception": 7,
   "darkvisionFt": 120
  },
  "saves": [],
  "skills": [
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Lança com Gancho",
    "bonus": 2,
    "damage": "1d6",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Besta Leve",
    "bonus": 4,
    "damage": "1d8+2",
    "type": "perfurante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 80,
    "longRangeFt": 320
   }
  ],
  "traits": [
   "resistenciaAMagia",
   "sunlightSensitivity"
  ],
  "blurb": "Pequenos e traiçoeiros, atacam em bandos com bestas leves de longe e lanças com gancho que derrubam os inimigos. Resistem bem à magia, mas sofrem sob a luz do sol.",
  "lore": "Os derro são parentes distorcidos dos anões que rastejam pelo Subterrâneo atrás de refúgios seguros. Covardes diante dos mais fortes e cruéis com os mais fracos, vivem em bandos barulhentos e caóticos. Todos carregam alguma loucura, quase sempre paranoia e mania, e os que despertam poder de feitiçaria viram líderes, chamados sábios, tidos como abençoados pelo deus Diirinka. Os duergar dizem que eles descendem de um clã anão deixado para trás sob o domínio dos devoradores de mentes, enquanto os próprios derro contam lendas que celebram a traição e a sobrevivência a qualquer custo."
 },
 "sabioDerro": {
  "id": "sabioDerro",
  "tipo": "humanoide",
  "name": "Sábio Derro",
  "nomeOriginal": "Derro Savant",
  "fonte": "MTF",
  "size": "pequeno",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 9,
   "dex": 14,
   "con": 12,
   "int": 11,
   "wis": 5,
   "cha": 14
  },
  "ac": 13,
  "acNote": "armadura de couro",
  "maxHp": 36,
  "hpDice": "8d6+8",
  "speedFt": 30,
  "senses": {
   "passivePerception": 7,
   "darkvisionFt": 120
  },
  "saves": [],
  "skills": [
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Bordão",
    "bonus": 1,
    "damage": "1d6-1",
    "type": "concussão",
    "reachFt": 5
   }
  ],
  "spellcasting": {
   "ability": "cha",
   "cantrips": [
    "respingoAcido",
    "maoMagica",
    "mensagem",
    "prestidigitacao",
    "raioDeGelo"
   ],
   "prepared": [
    "maosFlamejantes",
    "orbeCromatico",
    "sono",
    "invisibilidade",
    "patasDeAranha",
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
    "respingoAcido": 12,
    "maoMagica": 12,
    "mensagem": 12,
    "prestidigitacao": 12,
    "raioDeGelo": 12,
    "maosFlamejantes": 12,
    "orbeCromatico": 12,
    "sono": 12,
    "invisibilidade": 12,
    "patasDeAranha": 12,
    "relampago": 12
   }
  },
  "traits": [
   "resistenciaAMagia",
   "sunlightSensitivity"
  ],
  "blurb": "Feiticeiro instável que fica atrás dos aliados lançando relâmpagos, mãos flamejantes e orbes cromáticos, além de sono e invisibilidade. Resiste bem à magia, mas é frágil no corpo a corpo e sofre sob a luz do sol.",
  "lore": "Os sábios derro são os raros membros desse povo subterrâneo que despertaram poder arcano em meio à loucura que aflige a raça. Vivem nas profundezas do Subterrâneo, onde os demais derro os tratam como profetas e conselheiros. Acreditam que sua magia lhes revela verdades ocultas, e isso os torna arrogantes e imprevisíveis. Costumam liderar bandos em emboscadas e saques contra outros habitantes das cavernas."
 },
 "dhergoloth": {
  "id": "dhergoloth",
  "tipo": "corruptor",
  "name": "Dhergoloth",
  "nomeOriginal": "Dhergoloth",
  "fonte": "MTF",
  "size": "médio",
  "level": 5,
  "cr": "7",
  "xp": 2900,
  "abilities": {
   "str": 17,
   "dex": 10,
   "con": 19,
   "int": 7,
   "wis": 10,
   "cha": 9
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 119,
  "hpDice": "14d8+56",
  "speedFt": 30,
  "senses": {
   "passivePerception": 10,
   "blindsightFt": 60,
   "darkvisionFt": 60
  },
  "saves": [
   "str"
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
   "ácido",
   "veneno"
  ],
  "conditionImmunities": [
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Garra",
    "bonus": 6,
    "damage": "2d8+3",
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
    "sono",
    "escuridao",
    "medo"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "sono": 3
   },
   "aVontade": [
    "escuridao",
    "medo"
   ],
   "cdPorMagia": {
    "sono": 10,
    "escuridao": 10,
    "medo": 10
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Garras Giratórias",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "raio",
    "areaFt": 5,
    "save": "dex",
    "dc": 14,
    "damage": "3d12+3",
    "damageType": "cortante",
    "halfOnSave": false
   },
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
  "blurb": "Brutamontes yugoloth que avança girando as garras, retalhando todos no caminho, e se teleporta para escolher a próxima vítima. Resiste a magia e ainda lança escuridão, medo e sono.",
  "lore": "Os dhergoloths são yugoloths de força bruta e pouca inteligência, usados como tropa de choque pelos mercenários demoníacos dos planos inferiores. Têm vários braços terminados em garras e entram em combate em um frenesi rodopiante. Obedecem a quem paga melhor ou a yugoloths mais poderosos, sem lealdade verdadeira. Às vezes são enviados ao Subterrâneo e a outros lugares sombrios para servir como guardas ou executores."
 },
 "trollTerrivel": {
  "id": "trollTerrivel",
  "tipo": "gigante",
  "name": "Troll Terrível",
  "nomeOriginal": "Dire Troll",
  "fonte": "MTF",
  "size": "enorme",
  "level": 13,
  "cr": "13",
  "xp": 10000,
  "abilities": {
   "str": 22,
   "dex": 15,
   "con": 21,
   "int": 9,
   "wis": 11,
   "cha": 5
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 172,
  "hpDice": "15d12+75",
  "speedFt": 40,
  "senses": {
   "passivePerception": 15,
   "darkvisionFt": 60
  },
  "saves": [
   "wis",
   "cha"
  ],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "damageResistances": [
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "conditionImmunities": [
   "amedrontado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 11,
    "damage": "1d8+6",
    "type": "perfurante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "1d10",
     "type": "veneno"
    }
   },
   {
    "name": "Garras",
    "bonus": 11,
    "damage": "3d6+6",
    "type": "cortante",
    "reachFt": 10
   }
  ],
  "multiattack": {
   "count": 5,
   "sequence": [
    "Mordida",
    "Garras",
    "Garras",
    "Garras",
    "Garras"
   ]
  },
  "acoesEspeciais": [
   {
    "nome": "Redemoinho de Garras",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "raio",
    "areaFt": 10,
    "save": "dex",
    "dc": 19,
    "damage": "8d10",
    "damageType": "cortante",
    "halfOnSave": true
   }
  ],
  "regeneracao": {
   "pv": 10,
   "bloqueia": []
  },
  "traits": [
   "audicaoEVisaoApuradas",
   "regeneracaoDoLivro"
  ],
  "blurb": "Gigante brutal que ataca cinco vezes por turno com mordida e garras, e pode girar num redemoinho de golpes que retalha tudo ao redor. Regenera sem parar; só fogo ou ácido o impedem de voltar a se levantar.",
  "lore": "O troll terrível é uma aberração enorme, nascida de trolls que cresceram muito além do normal após devorar carne mágica ou sobreviver a ferimentos terríveis. Vaga por montanhas, florestas, regiões geladas e pelas profundezas do Subterrâneo, sempre faminto. Não conhece medo nem sente os efeitos de venenos, e caça qualquer coisa que se mova. Grupos de trolls menores costumam segui-lo, e até gigantes evitam seu território."
 },
 "aracnomanteDrow": {
  "id": "aracnomanteDrow",
  "tipo": "humanoide",
  "name": "Aracnomante Drow",
  "nomeOriginal": "Drow Arachnomancer",
  "fonte": "MTF",
  "size": "médio",
  "level": 13,
  "cr": "13",
  "xp": 10000,
  "abilities": {
   "str": 11,
   "dex": 17,
   "con": 14,
   "int": 19,
   "wis": 14,
   "cha": 16
  },
  "ac": 15,
  "acNote": "couro batido",
  "maxHp": 162,
  "hpDice": "25d8+50",
  "speedFt": 30,
  "speeds": {
   "climbFt": 30
  },
  "senses": {
   "passivePerception": 17,
   "blindsightFt": 10,
   "darkvisionFt": 120
  },
  "saves": [
   "con",
   "int",
   "cha"
  ],
  "skills": [
   "arcanismo",
   "natureza",
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "damageResistances": [
   "veneno"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Toque Venenoso",
    "bonus": 8,
    "damage": "8d6",
    "type": "veneno",
    "reachFt": 5
   },
   {
    "name": "Mordida",
    "bonus": 7,
    "damage": "2d8+3",
    "type": "perfurante",
    "reachFt": 5,
    "onHit": {
     "save": "con",
     "dc": 15,
     "condition": "envenenado",
     "rounds": 1,
     "repete": false
    }
   },
   {
    "name": "Teia",
    "bonus": 8,
    "damage": 0,
    "type": "nenhum",
    "reachFt": 5,
    "onHit": {
     "semResistencia": true,
     "dc": 15,
     "escape": 15,
     "condition": "contido",
     "note": "fica preso"
    },
    "ranged": true,
    "rangeFt": 30,
    "longRangeFt": 60
   }
  ],
  "multiattack": {
   "count": 2,
   "sequencias": [
    [
     "Toque Venenoso",
     "Toque Venenoso"
    ],
    [
     "Mordida",
     "Mordida"
    ]
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
    "escuridao": 16,
    "fogoDasFadas": 16,
    "levitacao": 16,
    "luzesDancantes": 16
   }
  },
  "traits": [
   "t_mudarDeForma",
   "ascendenciaFeerica",
   "spiderClimb",
   "sunlightSensitivity",
   "webWalker"
  ],
  "blurb": "Bruxo drow que alterna entre forma élfica e de aranha gigante, envenenando com toques e mordidas e controlando o campo com teias, insetos e magias de dominação. O primeiro golpe que acerta a cada rodada causa uma grande carga extra de veneno.",
  "lore": "Os aracnomantes são bruxos drow que firmaram pacto com a deusa-aranha e receberam dela o dom de assumir a forma de aranha. Habitam as profundezas do Subterrâneo, em cidades e covis repletos de teias, onde conversam com aranhas e as comandam. Costumam servir como guardiões e caçadores das casas nobres, preparando emboscadas no escuro. Detestam a luz do sol, que os deixa vulneráveis."
 },
 "consorteFavoritoDrow": {
  "id": "consorteFavoritoDrow",
  "tipo": "humanoide",
  "name": "Consorte Favorito Drow",
  "nomeOriginal": "Drow Favored Consort",
  "fonte": "MTF",
  "size": "médio",
  "level": 17,
  "cr": "18",
  "xp": 20000,
  "abilities": {
   "str": 15,
   "dex": 20,
   "con": 16,
   "int": 18,
   "wis": 15,
   "cha": 18
  },
  "ac": 15,
  "acNote": "18 com armadura arcana",
  "maxHp": 225,
  "hpDice": "30d8+90",
  "speedFt": 30,
  "senses": {
   "passivePerception": 18,
   "darkvisionFt": 120
  },
  "saves": [
   "dex",
   "con",
   "cha"
  ],
  "skills": [
   "acrobacia",
   "atletismo",
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Cimitarra",
    "bonus": 11,
    "damage": "1d6+5",
    "type": "cortante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "4d8",
     "type": "veneno"
    }
   },
   {
    "name": "Besta de Mão",
    "bonus": 11,
    "damage": "1d6+5",
    "type": "perfurante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 30,
    "longRangeFt": 120,
    "onHit": {
     "save": "con",
     "dc": 13,
     "condition": "envenenado",
     "rounds": 1,
     "repete": false
    }
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
    "escuridao": 18,
    "fogoDasFadas": 18,
    "levitacao": 18,
    "luzesDancantes": 18
   }
  },
  "traits": [
   "ascendenciaFeerica",
   "sunlightSensitivity",
   "t_magiaDeGuerra"
  ],
  "blurb": "Mestre que mistura espada e magia: golpeia com cimitarras envenenadas enquanto lança bola de fogo, relâmpago em cadeia e cone de frio. Cada acerto da cimitarra enfraquece a resistência do alvo às suas magias.",
  "lore": "Os consortes favoritos são homens drow escolhidos por matronas poderosas como parceiros e conselheiros. Eles dominam tanto a arte da lâmina quanto a magia arcana, e muitos já tiveram treinamento de mago antes de chegar a esse posto. Vivem nas cidades drow do Subterrâneo, onde suas vidas dependem do favor de quem os escolheu. Costumam ser astutos e ambiciosos, sempre tramando para garantir a própria posição."
 },
 "capitaoDeCasaDrow": {
  "id": "capitaoDeCasaDrow",
  "tipo": "humanoide",
  "name": "Capitão de Casa Drow",
  "nomeOriginal": "Drow House Captain",
  "fonte": "MTF",
  "size": "médio",
  "level": 9,
  "cr": "9",
  "xp": 5000,
  "abilities": {
   "str": 14,
   "dex": 19,
   "con": 15,
   "int": 12,
   "wis": 14,
   "cha": 13
  },
  "ac": 16,
  "acNote": "cota de malha",
  "maxHp": 162,
  "hpDice": "25d8+50",
  "speedFt": 30,
  "senses": {
   "passivePerception": 16,
   "darkvisionFt": 120
  },
  "saves": [
   "dex",
   "con",
   "wis"
  ],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Cimitarra",
    "bonus": 8,
    "damage": "1d6+4",
    "type": "cortante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "4d6",
     "type": "veneno"
    }
   },
   {
    "name": "Chicote",
    "bonus": 8,
    "damage": "1d4+4",
    "type": "cortante",
    "reachFt": 10
   },
   {
    "name": "Besta de Mão",
    "bonus": 8,
    "damage": "1d6+4",
    "type": "perfurante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 30,
    "longRangeFt": 120,
    "onHit": {
     "save": "con",
     "dc": 13,
     "condition": "envenenado",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequencias": [
    [
     "Cimitarra",
     "Cimitarra",
     "Chicote"
    ],
    [
     "Cimitarra",
     "Cimitarra",
     "Besta de Mão"
    ]
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
    "escuridao": 13,
    "fogoDasFadas": 13,
    "levitacao": 13,
    "luzesDancantes": 13
   }
  },
  "traits": [
   "t_comandoDeBatalha",
   "ascendenciaFeerica",
   "sunlightSensitivity",
   "aparar"
  ],
  "blurb": "Comandante drow que golpeia com cimitarras envenenadas e usa o chicote para incitar aliados, enquanto coordena o grupo com ordens rápidas. Seus virotes podem derrubar alvos inconscientes.",
  "lore": "Os capitães de casa são os chefes militares das famílias nobres drow do Subterrâneo, encarregados de proteger e expandir o poder da casa. Costumam ser filhos de matronas, servindo com lealdade forçada. Lideram tropas de guerreiros e escravos, preferindo emboscadas na escuridão. Na luz do sol perdem boa parte da eficiência."
 },
 "inquisidoraDrow": {
  "id": "inquisidoraDrow",
  "tipo": "humanoide",
  "name": "Inquisidora Drow",
  "nomeOriginal": "Drow Inquisitor",
  "fonte": "MTF",
  "size": "médio",
  "level": 13,
  "cr": "14",
  "xp": 11500,
  "abilities": {
   "str": 11,
   "dex": 15,
   "con": 14,
   "int": 16,
   "wis": 21,
   "cha": 20
  },
  "ac": 16,
  "acNote": "peitoral",
  "maxHp": 143,
  "hpDice": "22d8+44",
  "speedFt": 30,
  "senses": {
   "passivePerception": 20,
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
  "conditionImmunities": [
   "amedrontado"
  ],
  "attacks": [
   {
    "name": "Lança da Morte",
    "bonus": 10,
    "damage": "1d6+5",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "4d8",
     "type": "necrótico"
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Lança da Morte",
    "Lança da Morte",
    "Lança da Morte"
   ]
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "clarividencia",
    "escuridao",
    "detectarPensamentos",
    "dissiparMagia",
    "fogoDasFadas",
    "levitacao",
    "sugestao",
    "luzesDancantes",
    "detectarMagia"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "clarividencia": 1,
    "escuridao": 1,
    "detectarPensamentos": 1,
    "dissiparMagia": 1,
    "fogoDasFadas": 1,
    "levitacao": 1,
    "sugestao": 1
   },
   "aVontade": [
    "luzesDancantes",
    "detectarMagia"
   ],
   "cdPorMagia": {
    "clarividencia": 18,
    "escuridao": 18,
    "detectarPensamentos": 18,
    "dissiparMagia": 18,
    "fogoDasFadas": 18,
    "levitacao": 18,
    "sugestao": 18,
    "luzesDancantes": 18,
    "detectarMagia": 18
   }
  },
  "traits": [
   "t_discernirMentira",
   "ascendenciaFeerica",
   "resistenciaAMagia",
   "sunlightSensitivity"
  ],
  "blurb": "Sacerdotisa de Lolth que golpeia três vezes com a lança da morte, causando dano necrótico que reduz os PV máximos do alvo, e ainda conta com magias divinas poderosas como ferir e banimento.",
  "lore": "As inquisidoras drow são sacerdotisas encarregadas de caçar hereges, traidores e infiltrados nas cidades do Subterrâneo. Usam magia e interrogatório para arrancar a verdade, e poucas mentiras escapam aos seus ouvidos. São temidas até pelas outras sacerdotisas, pois respondem diretamente às exigências da Rainha Aranha. Algumas chegam a invocar demônios para auxiliá-las em suas investigações."
 },
 "matriarcaDrow": {
  "id": "matriarcaDrow",
  "tipo": "humanoide",
  "name": "Matriarca Drow",
  "nomeOriginal": "Drow Matron Mother",
  "fonte": "MTF",
  "size": "médio",
  "level": 17,
  "cr": "20",
  "xp": 25000,
  "abilities": {
   "str": 12,
   "dex": 18,
   "con": 16,
   "int": 17,
   "wis": 21,
   "cha": 22
  },
  "ac": 17,
  "acNote": "meia-armadura",
  "maxHp": 262,
  "hpDice": "35d8+105",
  "speedFt": 30,
  "senses": {
   "passivePerception": 21,
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
  "conditionImmunities": [
   "enfeitiçado",
   "amedrontado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Cajado Demoníaco",
    "bonus": 10,
    "damage": "1d6+4",
    "type": "concussão",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d8+4",
     "type": "concussão"
    }
   },
   {
    "name": "Bastão de Tentáculos",
    "bonus": 9,
    "damage": "1d6",
    "type": "concussão",
    "reachFt": 15
   }
  ],
  "multiattack": {
   "count": 3,
   "sequencias": [
    [
     "Cajado Demoníaco",
     "Cajado Demoníaco"
    ],
    [
     "Bastão de Tentáculos",
     "Bastão de Tentáculos",
     "Bastão de Tentáculos"
    ]
   ]
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "clarividencia",
    "escuridao",
    "detectarPensamentos",
    "dissiparMagia",
    "fogoDasFadas",
    "levitacao",
    "sugestao",
    "luzesDancantes",
    "detectarMagia"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "clarividencia": 1,
    "escuridao": 1,
    "detectarPensamentos": 1,
    "dissiparMagia": 1,
    "fogoDasFadas": 1,
    "levitacao": 1,
    "sugestao": 1
   },
   "aVontade": [
    "luzesDancantes",
    "detectarMagia"
   ],
   "cdPorMagia": {
    "clarividencia": 20,
    "escuridao": 20,
    "detectarPensamentos": 20,
    "dissiparMagia": 20,
    "fogoDasFadas": 20,
    "levitacao": 20,
    "sugestao": 20,
    "luzesDancantes": 20,
    "detectarMagia": 20
   }
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Cajado Demoníaco",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Cajado Demoníaco"
    },
    {
     "nome": "Conjurar Magia",
     "custo": 1,
     "tipo": "magia",
     "maxCirculo": 1
    },
    {
     "nome": "Conjurar Magia",
     "custo": 2,
     "tipo": "magia",
     "maxCirculo": 2
    },
    {
     "nome": "Conjurar Magia",
     "custo": 3,
     "tipo": "magia",
     "maxCirculo": 3
    }
   ]
  },
  "traits": [
   "t_invocarServo",
   "ascendenciaFeerica",
   "t_favorVoluvelDeLolth",
   "resistenciaAMagia",
   "sunlightSensitivity",
   "acoesLendarias"
  ],
  "blurb": "Clériga suprema de Lolth que golpeia com um cajado demoníaco capaz de causar dano psíquico e medo, ou enlaça inimigos com um bastão de tentáculos que os deixa lentos. Conjura magias devastadoras, como palavra divina e portal, e comanda demônios aliados.",
  "lore": "A matriarca é a governante absoluta de uma casa nobre drow no Subterrâneo, escolhida e vigiada de perto pela Rainha Aranha. Seu poder vem tanto da devoção fanática a Lolth quanto das intrigas cruéis que travou para chegar ao topo. Cercada de sacerdotisas, filhas ambiciosas e servos demoníacos, ela raramente luta sem guarda. Mesmo sua bênção é perigosa: os favores da deusa sempre cobram um preço de quem os recebe."
 },
 "laminaSombriaDrow": {
  "id": "laminaSombriaDrow",
  "tipo": "humanoide",
  "name": "Lâmina Sombria Drow",
  "nomeOriginal": "Drow Shadowblade",
  "fonte": "MTF",
  "size": "médio",
  "level": 9,
  "cr": "11",
  "xp": 7200,
  "abilities": {
   "str": 14,
   "dex": 21,
   "con": 16,
   "int": 12,
   "wis": 14,
   "cha": 13
  },
  "ac": 17,
  "acNote": "couro batido",
  "maxHp": 150,
  "hpDice": "20d8+60",
  "speedFt": 30,
  "senses": {
   "passivePerception": 16,
   "darkvisionFt": 120
  },
  "saves": [
   "dex",
   "con",
   "wis"
  ],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Espada Sombria",
    "bonus": 9,
    "damage": "1d6+5",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "3d6",
     "type": "necrótico"
    }
   },
   {
    "name": "Besta de Mão",
    "bonus": 9,
    "damage": "1d6+5",
    "type": "perfurante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 30,
    "longRangeFt": 120,
    "onHit": {
     "save": "con",
     "dc": 13,
     "condition": "envenenado",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Espada Sombria",
    "Espada Sombria"
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
    "escuridao": 13,
    "fogoDasFadas": 13,
    "levitacao": 13,
    "luzesDancantes": 13
   }
  },
  "traits": [
   "ascendenciaFeerica",
   "t_passoSombrio",
   "sunlightSensitivity"
  ],
  "blurb": "Salta de sombra em sombra por teletransporte e golpeia com uma espada de trevas que causa dano perfurante, necrótico e venenoso. Os cubos de escuridão que deixa pelo caminho podem explodir em dano necrótico extra.",
  "lore": "Os lâminas sombrias são assassinos de elite dos drow, que juraram servir a forças demoníacas em troca do domínio sobre as sombras. Vivem no Subterrâneo, onde caçam inimigos das casas nobres e eliminam rivais sem deixar rastros. Preferem atacar de surpresa, aproveitando a escuridão para surgir ao lado da vítima e sumir logo depois. Alguns conseguem até invocar demônios das sombras para ajudá-los."
 },
 "despotaDuergar": {
  "id": "despotaDuergar",
  "tipo": "humanoide",
  "name": "Déspota Duergar",
  "nomeOriginal": "Duergar Despot",
  "fonte": "MTF",
  "size": "médio",
  "level": 9,
  "cr": "12",
  "xp": 8400,
  "abilities": {
   "str": 20,
   "dex": 5,
   "con": 19,
   "int": 15,
   "wis": 14,
   "cha": 13
  },
  "ac": 21,
  "acNote": "armadura natural",
  "maxHp": 119,
  "hpDice": "14d8+56",
  "speedFt": 25,
  "senses": {
   "passivePerception": 12,
   "darkvisionFt": 120
  },
  "saves": [
   "con",
   "wis"
  ],
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
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Punho de Ferro",
    "bonus": 9,
    "damage": "2d8+5",
    "type": "concussão",
    "reachFt": 5,
    "danoExtra": {
     "damage": "3d6",
     "type": "concussão"
    },
    "onHit": {
     "save": "str",
     "dc": 17,
     "condition": "caido",
     "rounds": 1,
     "repete": false
    }
   },
   {
    "name": "Pisão",
    "bonus": 9,
    "damage": "1d8+5",
    "type": "concussão",
    "reachFt": 5,
    "danoExtra": {
     "damage": "3d8+5",
     "type": "concussão"
    }
   }
  ],
  "multiattack": {
   "count": 4,
   "sequence": [
    "Punho de Ferro",
    "Punho de Ferro",
    "Pisão",
    "Pisão"
   ]
  },
  "breath": {
   "name": "Jato de Chamas",
   "kind": "save",
   "shape": "linha",
   "areaFt": 100,
   "save": "dex",
   "dc": 16,
   "damage": "4d8",
   "damageType": "fogo",
   "halfOnSave": true,
   "origem": "sopro",
   "larguraFt": 5
  },
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "contramagia",
    "passoNebuloso",
    "nuvemFetida",
    "maoMagica",
    "ilusaoMenor"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "contramagia": 1,
    "passoNebuloso": 1,
    "nuvemFetida": 1
   },
   "aVontade": [
    "maoMagica",
    "ilusaoMenor"
   ],
   "cdPorMagia": {
    "contramagia": 12,
    "passoNebuloso": 12,
    "nuvemFetida": 12,
    "maoMagica": 12,
    "ilusaoMenor": 12
   }
  },
  "traits": [
   "resistenciaAMagia",
   "t_motorPsiquico",
   "sunlightSensitivity"
  ],
  "blurb": "Uma carcaça de ferro movida a psiônica que arremessa inimigos com socos, pisoteia quem está caído e cospe jatos de fogo em linha. Cuidado ao derrubá-lo ou acertá-lo criticamente: ele explode em energia psíquica.",
  "lore": "Déspotas são duergar que trocaram boa parte do próprio corpo por uma estrutura metálica alimentada pela força da mente. Governam enclaves no Subterrâneo e em minas sob as montanhas com crueldade metódica. Sua armadura mecânica os torna lentos, mas quase impossíveis de ferir ou intimidar. Odeiam a luz do sol e raramente deixam a escuridão das profundezas."
 },
 "marteladorDuergar": {
  "id": "marteladorDuergar",
  "tipo": "constructo",
  "name": "Martelador Duergar",
  "nomeOriginal": "Duergar Hammerer",
  "fonte": "MTF",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 17,
   "dex": 7,
   "con": 12,
   "int": 5,
   "wis": 5,
   "cha": 5
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 33,
  "hpDice": "6d8+6",
  "speedFt": 20,
  "senses": {
   "passivePerception": 7,
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
    "name": "Garra",
    "bonus": 5,
    "damage": "1d6+3",
    "type": "concussão",
    "reachFt": 5
   },
   {
    "name": "Martelo",
    "bonus": 5,
    "damage": "2d6+3",
    "type": "concussão",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Garra",
    "Martelo"
   ]
  },
  "traits": [
   "t_motorDeDor",
   "monstroDeCerco"
  ],
  "blurb": "Constructo lento que golpeia com garra e martelo, causando dano dobrado a estruturas. Quem atacar o duergar preso dentro dele pode feri-lo mais, mas provoca uma retaliação imediata.",
  "lore": "O martelador é uma máquina de guerra duergar movida pelo sofrimento de um anão cinzento aprisionado em seu interior. A dor do prisioneiro alimenta o mecanismo, que avança pesadamente contra muralhas e inimigos. Esses constructos são vistos no Subterrâneo e em fortalezas nas montanhas. Entendem as ordens em anão, mas não falam."
 },
 "duergarKavalrachni": {
  "id": "duergarKavalrachni",
  "tipo": "humanoide",
  "name": "Duergar Kavalrachni",
  "nomeOriginal": "Duergar Kavalrachni",
  "fonte": "MTF",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
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
  "hpDice": "4d8+8",
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
     "damage": "2d4",
     "type": "veneno"
    }
   },
   {
    "name": "Besta Pesada",
    "bonus": 2,
    "damage": "1d10",
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
    "Picareta de Guerra",
    "Picareta de Guerra"
   ]
  },
  "traits": [
   "t_invisibilidadeCompartilhada",
   "t_treinamentoDeCavalaria",
   "t_resilienciaDuergar",
   "sunlightSensitivity"
  ],
  "blurb": "Cavaleiro duergar montado em uma aranha steeder, golpeia duas vezes com a picareta envenenada e faz a montaria atacar junto. Pode ficar invisível com a aranha para emboscar.",
  "lore": "Os kavalrachni formam a cavalaria dos duergar, anões cinzentos do Subterrâneo que montam grandes aranhas chamadas steeders. Patrulham túneis e cavernas, atacando caravanas e intrusos de surpresa. Treinam suas montarias para lutar em sincronia, saltando por paredes e tetos. Detestam a luz do sol, que os deixa desajeitados."
 },
 "mestreMentalDuergar": {
  "id": "mestreMentalDuergar",
  "tipo": "humanoide",
  "name": "Mestre Mental Duergar",
  "nomeOriginal": "Duergar Mind Master",
  "fonte": "MTF",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 11,
   "dex": 17,
   "con": 14,
   "int": 15,
   "wis": 10,
   "cha": 12
  },
  "ac": 14,
  "acNote": "armadura de couro (19 enquanto reduzido)",
  "maxHp": 39,
  "hpDice": "6d8+12",
  "speedFt": 25,
  "senses": {
   "passivePerception": 12,
   "darkvisionFt": 120,
   "truesightFt": 30
  },
  "saves": [
   "wis"
  ],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "damageResistances": [
   "veneno"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Adaga Venenomental",
    "bonus": 5,
    "damage": "1d4+3",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "3d6",
     "type": "psíquico"
    }
   }
  ],
  "multiattack": {
   "count": 2
  },
  "acoesEspeciais": [
   {
    "nome": "Domínio Mental",
    "tipo": "alvo",
    "alcanceFt": 60,
    "save": "int",
    "dc": 12,
    "condition": "enfeiticado",
    "rounds": 10,
    "repete": false
   }
  ],
  "traits": [
   "invisivelAVontade",
   "t_reduzir",
   "t_resilienciaDuergar",
   "sunlightSensitivity"
  ],
  "blurb": "Encolhe até ficar minúsculo, some de vista e golpeia com uma adaga que envenena a mente, enquanto força inimigos a atacarem os próprios aliados. Difícil de acertar e de encontrar.",
  "lore": "Os mestres mentais são duergar treinados para espionar e manipular, servindo como olhos e punhais ocultos dos clãs do Subterrâneo. Usam a magia ancestral de seu povo para diminuir de tamanho e se esgueirar por frestas e acampamentos inimigos. Preferem semear confusão, levando adversários a ferirem uns aos outros antes de atacar. Vivem nas profundezas e em montanhas, evitando a luz do sol."
 },
 "gritadorDuergar": {
  "id": "gritadorDuergar",
  "tipo": "constructo",
  "name": "Gritador Duergar",
  "nomeOriginal": "Duergar Screamer",
  "fonte": "MTF",
  "size": "médio",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 18,
   "dex": 7,
   "con": 12,
   "int": 5,
   "wis": 5,
   "cha": 5
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 38,
  "hpDice": "7d8+7",
  "speedFt": 20,
  "senses": {
   "passivePerception": 7,
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
    "name": "Broca",
    "bonus": 6,
    "damage": "1d12+4",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 1,
   "sequence": [
    "Broca"
   ]
  },
  "acoesEspeciais": [
   {
    "nome": "Grito Sônico",
    "tipo": "area",
    "shape": "cube",
    "areaFt": 15,
    "save": "str",
    "dc": 11,
    "damage": "2d6",
    "damageType": "trovejante",
    "halfOnSave": false,
    "condition": "caido",
    "rounds": 10,
    "repete": false
   }
  ],
  "traits": [
   "t_motorDeDor"
  ],
  "blurb": "Construto lento que perfura com uma broca e solta gritos sônicos que derrubam quem estiver por perto. Acertar o duergar preso dentro dele causa muito dano, mas provoca um contra-ataque completo.",
  "lore": "O gritador é uma máquina de guerra dos duergar movida pelo sofrimento de um anão cinzento aprisionado em seu interior, em geral um criminoso ou traidor condenado. Patrulha túneis e fortalezas no Subterrâneo, avançando devagar contra intrusos. Compreende ordens em anão, mas não fala, e sua única voz é o berro destrutivo que ecoa pelas cavernas. A dor do prisioneiro é o combustível que mantém a engrenagem funcionando."
 },
 "laminaDaAlmaDuergar": {
  "id": "laminaDaAlmaDuergar",
  "tipo": "humanoide",
  "name": "Lâmina da Alma Duergar",
  "nomeOriginal": "Duergar Soulblade",
  "fonte": "MTF",
  "size": "médio",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 11,
   "dex": 16,
   "con": 10,
   "int": 11,
   "wis": 10,
   "cha": 12
  },
  "ac": 14,
  "acNote": "armadura de couro",
  "maxHp": 18,
  "hpDice": "4d8",
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
    "name": "Lâmina da Alma",
    "bonus": 5,
    "damage": "1d6+3",
    "type": "energético",
    "reachFt": 5,
    "danoExtra": {
     "damage": "2d6+3",
     "type": "energético"
    }
   }
  ],
  "spellcasting": {
   "ability": "wis",
   "cantrips": [],
   "prepared": [
    "salto",
    "marcaDoCacador",
    "protecaoContraLaminas",
    "ataqueCerteiro"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "salto": 3,
    "marcaDoCacador": 3
   },
   "aVontade": [
    "protecaoContraLaminas",
    "ataqueCerteiro"
   ],
   "cdPorMagia": {
    "salto": 12,
    "marcaDoCacador": 12,
    "protecaoContraLaminas": 12,
    "ataqueCerteiro": 12
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Aumentar",
    "tipo": "aumentar"
   }
  ],
  "traits": [
   "invisivelAVontade",
   "t_resilienciaDuergar",
   "t_criarLaminaDaAlma",
   "sunlightSensitivity"
  ],
  "blurb": "Duelista psiônico que conjura uma lâmina de energia, usa Golpe Certeiro e Marca do Caçador para atacar com vantagem e causar dano extra. Pode ficar invisível ou crescer até tamanho Grande.",
  "lore": "Os lâminas da alma são guerreiros duergar que canalizam o poder psiônico da própria mente para forjar armas de pura energia. Vivem nas cidades sombrias do Subterrâneo e nas profundezas das montanhas, servindo como batedores e assassinos de seus clãs. Treinados com rigor, preferem emboscar o inimigo e atacar com precisão. São cruéis e disciplinados, e evitam a luz do sol, que os deixa vulneráveis."
 },
 "guardaDePedraDuergar": {
  "id": "guardaDePedraDuergar",
  "tipo": "humanoide",
  "name": "Guarda de Pedra Duergar",
  "nomeOriginal": "Duergar Stone Guard",
  "fonte": "MTF",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 18,
   "dex": 11,
   "con": 14,
   "int": 11,
   "wis": 10,
   "cha": 9
  },
  "ac": 18,
  "acNote": "cota de malha e escudo",
  "maxHp": 39,
  "hpDice": "6d8+12",
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
    "name": "Faca do Rei",
    "bonus": 6,
    "damage": "1d6+4",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "2d6+4",
     "type": "perfurante"
    }
   },
   {
    "name": "Azagaia",
    "bonus": 6,
    "damage": "1d6+4",
    "type": "perfurante",
    "reachFt": 5,
    "rangeFt": 30,
    "longRangeFt": 120,
    "danoExtra": {
     "damage": "2d6+4",
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
   "t_formacaoDeFalange",
   "sunlightSensitivity"
  ],
  "blurb": "Soldado de elite que luta em formação cerrada com outros duergar de escudo, ganhando vantagem nos ataques. Pode crescer até tamanho Grande para dobrar o dano ou ficar invisível para emboscar.",
  "lore": "Os guardas de pedra são a tropa de elite dos duergar, anões cinzentos que habitam as profundezas do Subterrâneo e as raízes das montanhas. Treinados para a guerra desde cedo, marcham em falanges disciplinadas de escudos unidos. Servem como escolta de nobres e linha de frente das cidades duergar. A luz do sol os incomoda, então preferem combater na escuridão."
 },
 "senhorDaGuerraDuergar": {
  "id": "senhorDaGuerraDuergar",
  "tipo": "humanoide",
  "name": "Senhor da Guerra Duergar",
  "nomeOriginal": "Duergar Warlord",
  "fonte": "MTF",
  "size": "médio",
  "level": 5,
  "cr": "6",
  "xp": 2300,
  "abilities": {
   "str": 18,
   "dex": 11,
   "con": 17,
   "int": 12,
   "wis": 12,
   "cha": 14
  },
  "ac": 20,
  "acNote": "armadura de placas e escudo",
  "maxHp": 75,
  "hpDice": "10d8+30",
  "speedFt": 25,
  "senses": {
   "passivePerception": 11,
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
    "name": "Martelo de Sintonia Psíquica",
    "bonus": 7,
    "damage": "1d10+4",
    "type": "concussão",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d10",
     "type": "psíquico"
    }
   },
   {
    "name": "Azagaia",
    "bonus": 7,
    "damage": "1d6+4",
    "type": "perfurante",
    "reachFt": 5,
    "rangeFt": 30,
    "longRangeFt": 120,
    "danoExtra": {
     "damage": "2d6+4",
     "type": "perfurante"
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequencias": [
    [
     "Martelo de Sintonia Psíquica",
     "Martelo de Sintonia Psíquica",
     "Martelo de Sintonia Psíquica"
    ],
    [
     "Azagaia",
     "Azagaia",
     "Azagaia"
    ]
   ]
  },
  "acoesEspeciais": [
   {
    "nome": "Aumentar",
    "tipo": "aumentar"
   }
  ],
  "traits": [
   "t_chamadoAoAtaque",
   "invisivelAVontade",
   "t_resilienciaDuergar",
   "sunlightSensitivity",
   "t_instrucaoFlageladora"
  ],
  "blurb": "Comandante blindado que golpeia três vezes com um martelo carregado de energia psíquica, cresce até tamanho Grande e faz seus soldados duergar atacarem fora do turno. Também consegue sumir de vista e forçar os aliados a acertar à custa de dor psíquica.",
  "lore": "Os senhores da guerra duergar comandam as tropas dos anões cinzentos nas profundezas do Subterrâneo e nas raízes das montanhas. Treinados em disciplina brutal, tratam a dor como ferramenta de ensino e não hesitam em ferir os próprios subordinados para arrancar deles um desempenho melhor. Lideram da linha de frente, ampliando o próprio corpo com magia e coordenando ataques em massa. Odeiam a luz do sol, que os deixa desajeitados e vulneráveis."
 },
 "duergarXarrorn": {
  "id": "duergarXarrorn",
  "tipo": "humanoide",
  "name": "Duergar Xarrorn",
  "nomeOriginal": "Duergar Xarrorn",
  "fonte": "MTF",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 16,
   "dex": 11,
   "con": 14,
   "int": 11,
   "wis": 10,
   "cha": 9
  },
  "ac": 18,
  "acNote": "armadura de placas",
  "maxHp": 26,
  "hpDice": "4d8+8",
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
    "name": "Lança-Chamas",
    "bonus": 5,
    "damage": "1d12+3",
    "type": "perfurante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "1d6",
     "type": "fogo"
    }
   }
  ],
  "breath": {
   "name": "Jato de Fogo",
   "kind": "save",
   "shape": "cone",
   "areaFt": 15,
   "save": "dex",
   "dc": 12,
   "damage": "3d6",
   "damageType": "fogo",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    5,
    6
   ]
  },
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
  "blurb": "Luta com uma lança-chamas de longo alcance, perfurando e queimando inimigos a até 3 m e cuspindo jatos de fogo em cone ou linha. Pode crescer até o tamanho Grande para dobrar o dano ou sumir invisível antes de atacar.",
  "lore": "Os xarrorn são duergar que se dedicam a armas movidas a fogo, criadas nas forjas das cidades do Subterrâneo. Carregam lanças que expelem chamas e servem como tropa de choque contra invasores e escravos rebeldes. Disciplinados e cruéis, odeiam a luz do sol e raramente deixam as profundezas ou as montanhas onde escavam."
 },
 "dybbuk": {
  "id": "dybbuk",
  "tipo": "corruptor",
  "name": "Dybbuk",
  "nomeOriginal": "Dybbuk",
  "fonte": "MTF",
  "size": "médio",
  "level": 1,
  "cr": "4",
  "xp": 1100,
  "abilities": {
   "str": 6,
   "dex": 19,
   "con": 16,
   "int": 16,
   "wis": 15,
   "cha": 14
  },
  "ac": 14,
  "maxHp": 37,
  "hpDice": "5d8+15",
  "speedFt": 0,
  "flyFt": 40,
  "hover": true,
  "speeds": {
   "flyFt": 40
  },
  "senses": {
   "passivePerception": 14,
   "darkvisionFt": 120
  },
  "saves": [],
  "skills": [
   "enganacao",
   "intimidacao",
   "percepcao"
  ],
  "expertise": [
   "enganacao"
  ],
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
    "name": "Tentáculo",
    "bonus": 6,
    "damage": "2d8+4",
    "type": "necrótico",
    "reachFt": 5
   }
  ],
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "medo",
    "forcaFantasmagorica",
    "dimensaoPorta"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "medo": 3,
    "forcaFantasmagorica": 3
   },
   "aVontade": [
    "dimensaoPorta"
   ],
   "cdPorMagia": {
    "medo": 12,
    "forcaFantasmagorica": 12,
    "dimensaoPorta": 12
   }
  },
  "traits": [
   "t_possuirCadaver",
   "incorporealMovement",
   "resistenciaAMagia",
   "t_profanarCadaver"
  ],
  "blurb": "Demônio flutuante e incorpóreo que drena a vida com tentáculos necróticos e se esconde dentro de cadáveres, ganhando um corpo novo e PV temporários. Resiste a magia e a armas comuns, e usa medo e ilusões para desorganizar o grupo.",
  "lore": "O dybbuk é um demônio do Abismo que, em sua forma verdadeira, lembra uma água-viva translúcida flutuando com longos filamentos. Ele raramente fica assim: prefere ocupar o primeiro cadáver adequado que encontra e devolvê-lo a uma falsa vida. Com as memórias do morto, consegue se passar por ele por algum tempo, mas seus vícios obsessivos logo o denunciam. Adora aterrorizar os vivos fazendo o corpo hospedeiro se contorcer, vomitar sangue e se mover de formas impossíveis."
 },
 "mirmidaoElementalDaTerra": {
  "id": "mirmidaoElementalDaTerra",
  "tipo": "elemental",
  "name": "Mirmidão Elemental da Terra",
  "nomeOriginal": "Earth Elemental Myrmidon",
  "fonte": "MTF",
  "size": "médio",
  "level": 5,
  "cr": "7",
  "xp": 2900,
  "abilities": {
   "str": 18,
   "dex": 10,
   "con": 17,
   "int": 8,
   "wis": 10,
   "cha": 10
  },
  "ac": 18,
  "acNote": "armadura de placas",
  "maxHp": 127,
  "hpDice": "17d8+51",
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
  "conditionImmunities": [
   "paralisado",
   "petrificado",
   "envenenado",
   "caido"
  ],
  "attacks": [
   {
    "name": "Marreta",
    "bonus": 7,
    "damage": "2d6+4",
    "type": "concussão",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Marreta",
    "Marreta"
   ]
  },
  "traits": [
   "t_golpeTrovejante",
   "armasMagicas"
  ],
  "blurb": "Guerreiro de pedra blindado que avança com uma marreta, golpeando duas vezes por turno; de tempos em tempos desfere um impacto trovejante capaz de derrubar o alvo. Resiste a armas comuns e não pode ser derrubado nem petrificado.",
  "lore": "Mirmidões elementais são espíritos da terra presos por magia ritual dentro de uma armadura forjada sob medida. Seus criadores os usam como soldados de elite e guardiões incansáveis, que obedecem sem questionar. Lutam com disciplina marcial, segurando posições e esmagando quem tenta passar. Sem um mestre, costumam continuar cumprindo a última ordem recebida."
 },
 "eidolon": {
  "id": "eidolon",
  "tipo": "morto-vivo",
  "name": "Eidolon",
  "nomeOriginal": "Eidolon",
  "fonte": "MTF",
  "size": "médio",
  "level": 9,
  "cr": "12",
  "xp": 8400,
  "abilities": {
   "str": 7,
   "dex": 8,
   "con": 9,
   "int": 14,
   "wis": 19,
   "cha": 16
  },
  "ac": 9,
  "maxHp": 63,
  "hpDice": "18d8-18",
  "speedFt": 0,
  "flyFt": 40,
  "hover": true,
  "speeds": {
   "flyFt": 40
  },
  "senses": {
   "passivePerception": 18,
   "darkvisionFt": 60
  },
  "saves": [
   "wis"
  ],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "damageResistances": [
   "ácido",
   "fogo",
   "elétrico",
   "trovejante",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "damageImmunities": [
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
  "acoesEspeciais": [
   {
    "nome": "Pavor Divino",
    "tipo": "area",
    "shape": "raio",
    "areaFt": 60,
    "save": "wis",
    "dc": 15,
    "condition": "amedrontado",
    "rounds": 10,
    "repete": true
   }
  ],
  "traits": [
   "incorporealMovement",
   "t_animacaoSagrada",
   "resisteExpulsar"
  ],
  "blurb": "Espírito guardião que espalha um terror divino capaz de fazer inimigos fugirem ou ficarem atordoados, e que pode se fundir a uma estátua sagrada para lutar com um corpo de pedra. Atravessa paredes e resiste a quase tudo que não seja mágico.",
  "lore": "O eidolon é a alma de um devoto fervoroso que, após a morte, recebeu de seu deus a tarefa eterna de vigiar um lugar sagrado. Ronda templos, criptas e santuários onde relíquias repousam ou milagres aconteceram, e jamais abandona o posto. Sozinho é frágil, mas quando invasores profanam o local ele mergulha numa estátua preparada para recebê-lo e a desperta como um guerreiro de pedra. Não precisa respirar, comer, beber nem dormir."
 },
 "oblexAnciao": {
  "id": "oblexAnciao",
  "tipo": "gosma",
  "name": "Oblex Ancião",
  "nomeOriginal": "Elder Oblex",
  "fonte": "MTF",
  "size": "enorme",
  "level": 9,
  "cr": "10",
  "xp": 5900,
  "abilities": {
   "str": 15,
   "dex": 16,
   "con": 21,
   "int": 22,
   "wis": 13,
   "cha": 18
  },
  "ac": 16,
  "maxHp": 115,
  "hpDice": "10d12+50",
  "speedFt": 20,
  "senses": {
   "passivePerception": 15,
   "blindsightFt": 60
  },
  "saves": [
   "int",
   "cha"
  ],
  "skills": [
   "arcanismo",
   "enganacao",
   "historia",
   "natureza",
   "percepcao",
   "religiao"
  ],
  "expertise": [],
  "conditionImmunities": [
   "cego",
   "enfeitiçado",
   "surdo",
   "exausto",
   "caido"
  ],
  "attacks": [
   {
    "name": "Pseudópode",
    "bonus": 7,
    "damage": "4d6+3",
    "type": "concussão",
    "reachFt": 10,
    "danoExtra": {
     "damage": "2d6",
     "type": "psíquico"
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Pseudópode",
    "Pseudópode"
   ]
  },
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "confusao",
    "dimensaoPorta",
    "dominarPessoa",
    "medo",
    "imobilizarMonstro",
    "padraoHipnotico",
    "telecinesia",
    "enfeiticarPessoa",
    "detectarPensamentos",
    "imobilizarPessoa"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "confusao": 3,
    "dimensaoPorta": 3,
    "dominarPessoa": 3,
    "medo": 3,
    "imobilizarMonstro": 3,
    "padraoHipnotico": 3,
    "telecinesia": 3
   },
   "aVontade": [
    "enfeiticarPessoa",
    "detectarPensamentos",
    "imobilizarPessoa"
   ],
   "cdPorMagia": {
    "confusao": 18,
    "dimensaoPorta": 18,
    "dominarPessoa": 18,
    "medo": 18,
    "imobilizarMonstro": 18,
    "padraoHipnotico": 18,
    "telecinesia": 18,
    "enfeiticarPessoa": 18,
    "detectarPensamentos": 18,
    "imobilizarPessoa": 18
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Devorar Memórias",
    "tipo": "alvo",
    "alcanceFt": 5,
    "save": "wis",
    "dc": 18,
    "damage": "8d10",
    "damageType": "psíquico",
    "halfOnSave": false,
    "condition": "inconsciente",
    "rounds": 100,
    "repete": false
   }
  ],
  "traits": [
   "amorfo",
   "aversaoAoFogo",
   "t_imitacaoSulfurosa"
  ],
  "blurb": "Gosma enorme e genial que golpeia com pseudópodes a 3 m e devora memórias, deixando as vítimas cada vez mais inúteis até desmaiarem. Domina, paralisa e confunde com magia inata poderosa, mas o fogo a desestabiliza.",
  "lore": "O oblex ancião é uma massa de lodo que passou séculos se alimentando de lembranças alheias e acumulou um intelecto assombroso. Esconde-se em pântanos, no Subterrâneo ou sob cidades, onde envia cópias sulfurosas de pessoas que já devorou para atrair novas presas. Planeja com paciência, manipula vítimas com magia mental e trata cada mente como um banquete de conhecimento. Teme o fogo, a única coisa capaz de abalar sua concentração."
 },
 "tempestadeAncia": {
  "id": "tempestadeAncia",
  "tipo": "elemental",
  "name": "Tempestade Anciã",
  "nomeOriginal": "Elder Tempest",
  "fonte": "MTF",
  "size": "imenso",
  "level": 21,
  "cr": "23",
  "xp": 50000,
  "abilities": {
   "str": 23,
   "dex": 28,
   "con": 23,
   "int": 2,
   "wis": 21,
   "cha": 18
  },
  "ac": 19,
  "maxHp": 264,
  "hpDice": "16d20+96",
  "speedFt": 0,
  "flyFt": 120,
  "hover": true,
  "speeds": {
   "flyFt": 120
  },
  "senses": {
   "passivePerception": 15,
   "darkvisionFt": 60
  },
  "saves": [
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
   "elétrico",
   "veneno",
   "trovejante"
  ],
  "conditionImmunities": [
   "exausto",
   "agarrado",
   "paralisado",
   "petrificado",
   "envenenado",
   "caido",
   "contido",
   "atordoado"
  ],
  "attacks": [
   {
    "name": "Pancada Trovejante",
    "bonus": 16,
    "damage": "4d6+9",
    "type": "trovejante",
    "reachFt": 20
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Pancada Trovejante",
    "Pancada Trovejante"
   ]
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Mover",
     "custo": 1,
     "tipo": "mover",
     "metade": false,
     "semOportunidade": false
    },
    {
     "nome": "Relâmpago",
     "custo": 2,
     "tipo": "area",
     "raioFt": 5,
     "save": "dex",
     "dc": 20,
     "damage": "3d10",
     "damageType": "elétrico",
     "halfOnSave": true,
     "soNoChao": true
    }
   ]
  },
  "traits": [
   "t_tempestadeDeRaios",
   "formaFluida",
   "voaSemProvocar",
   "t_tempestadeViva",
   "monstroDeCerco",
   "acoesLendarias"
  ],
  "blurb": "Uma tempestade viva que voa sobre o campo, golpeia com trovões a 6 m de distância e descarrega raios em área que podem atordoar. Suas rajadas lendárias arremessam inimigos longe e seus ventos atrapalham ataques à distância.",
  "lore": "A Tempestade Anciã é um elemental primordial do ar, uma força da natureza que ganhou consciência sem nunca ganhar razão. Ela vaga sobre montanhas, costas, planícies e terras geladas, carregando consigo um temporal de vários quilômetros de largura. Não tem objetivos nem malícia: destrói apenas porque passa. Povos que sofrem sua chegada costumam vê-la como presságio de deuses furiosos."
 },
 "steederFemea": {
  "id": "steederFemea",
  "tipo": "monstruosidade",
  "name": "Steeder Fêmea",
  "nomeOriginal": "Female Steeder",
  "fonte": "MTF",
  "size": "grande",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 15,
   "dex": 16,
   "con": 14,
   "int": 2,
   "wis": 10,
   "cha": 3
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 30,
  "hpDice": "4d10+8",
  "speedFt": 30,
  "speeds": {
   "climbFt": 30
  },
  "senses": {
   "passivePerception": 14,
   "darkvisionFt": 120
  },
  "saves": [],
  "skills": [
   "furtividade",
   "percepcao"
  ],
  "expertise": [
   "furtividade",
   "percepcao"
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
     "damage": "2d8",
     "type": "veneno"
    }
   }
  ],
  "traits": [
   "t_pataPegajosa",
   "spiderClimb",
   "t_saltoExtraordinario"
  ],
  "blurb": "Aranha gigante que salta de longe sobre a presa, prende-a numa pata pegajosa e injeta veneno com a mordida. Escala paredes e tetos com facilidade e ataca das sombras.",
  "lore": "Steeders são aranhas enormes do Subterrâneo, criadas pelos duergar como montarias de guerra. As fêmeas são maiores e mais agressivas que os machos. Movem-se por paredes e tetos de cavernas e cobrem grandes distâncias com saltos impressionantes. Sem um cavaleiro, caçam sozinhas, emboscando qualquer criatura que passe ao alcance."
 },
 "mirmidaoElementalDoFogo": {
  "id": "mirmidaoElementalDoFogo",
  "tipo": "elemental",
  "name": "Mirmidão Elemental do Fogo",
  "nomeOriginal": "Fire Elemental Myrmidon",
  "fonte": "MTF",
  "size": "médio",
  "level": 5,
  "cr": "7",
  "xp": 2900,
  "abilities": {
   "str": 13,
   "dex": 18,
   "con": 15,
   "int": 9,
   "wis": 10,
   "cha": 10
  },
  "ac": 18,
  "acNote": "armadura de placas",
  "maxHp": 123,
  "hpDice": "19d8+38",
  "speedFt": 40,
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
   "paralisado",
   "petrificado",
   "envenenado",
   "caido"
  ],
  "attacks": [
   {
    "name": "Cimitarra",
    "bonus": 7,
    "damage": "1d6+4",
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
  "luzPropria": {
   "claro": 20,
   "penumbra": 20
  },
  "traits": [
   "t_golpesArdentes",
   "armasMagicas"
  ],
  "blurb": "Guerreiro de chamas vivas que golpeia três vezes com cimitarras e, de tempos em tempos, incendeia cada golpe com dano de fogo extra. Resiste a armas comuns, mas sofre ao atravessar água.",
  "lore": "Mirmidões são elementais do fogo presos à força dentro de armaduras encantadas, criadas por meio de rituais mágicos. Esse invólucro dá forma e disciplina à chama, transformando-a num soldado obediente. Servem de guardas e tropas de elite para magos, cultos elementais e outros mestres poderosos. Lutam com precisão marcial, mas a fúria do fogo continua ardendo por dentro da armadura."
 },
 "frazUrbLuu": {
  "id": "frazUrbLuu",
  "tipo": "corruptor",
  "name": "Fraz-Urb'luu",
  "nomeOriginal": "Fraz-Urb'luu",
  "fonte": "MTF",
  "size": "grande",
  "level": 21,
  "cr": "23",
  "xp": 50000,
  "abilities": {
   "str": 29,
   "dex": 12,
   "con": 25,
   "int": 26,
   "wis": 24,
   "cha": 26
  },
  "ac": 18,
  "acNote": "armadura natural",
  "maxHp": 337,
  "hpDice": "27d10+189",
  "speedFt": 40,
  "flyFt": 40,
  "speeds": {
   "flyFt": 40
  },
  "senses": {
   "passivePerception": 24,
   "truesightFt": 120
  },
  "saves": [
   "dex",
   "con",
   "int",
   "wis"
  ],
  "skills": [
   "enganacao",
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
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 16,
    "damage": "3d6+9",
    "type": "perfurante",
    "reachFt": 10
   },
   {
    "name": "Punho",
    "bonus": 16,
    "damage": "3d8+9",
    "type": "concussão",
    "reachFt": 10
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida",
    "Punho",
    "Punho"
   ]
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "confusao",
    "despistar",
    "aparenciaEnganosa",
    "modificarMemoria",
    "alterarAparencia",
    "detectarMagia",
    "dissiparMagia",
    "forcaFantasmagorica"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "confusao": 3,
    "despistar": 3,
    "aparenciaEnganosa": 3,
    "modificarMemoria": 1
   },
   "aVontade": [
    "alterarAparencia",
    "detectarMagia",
    "dissiparMagia",
    "forcaFantasmagorica"
   ],
   "cdPorMagia": {
    "confusao": 23,
    "despistar": 23,
    "aparenciaEnganosa": 23,
    "modificarMemoria": 23,
    "alterarAparencia": 23,
    "detectarMagia": 23,
    "dissiparMagia": 23,
    "forcaFantasmagorica": 23
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
     "arma": "Cauda",
     "ataque": {
      "name": "Cauda",
      "bonus": 16,
      "damage": "2d10+9",
      "type": "concussão",
      "reachFt": 15,
      "onHit": {
       "semResistencia": true,
       "dc": 24,
       "escape": 24,
       "condition": "contido",
       "note": "é agarrado"
      }
     }
    },
    {
     "nome": "Assassino Fantasmagórico",
     "custo": 2,
     "tipo": "magia",
     "magias": [
      "assassinoFantasmagorico"
     ]
    }
   ]
  },
  "traits": [
   "resistenciaAMagia",
   "armasMagicas",
   "t_indetectavel",
   "acoesLendarias"
  ],
  "blurb": "Gigante demoníaco que mistura golpes brutais de punhos, mordida e cauda com ilusões e magias mentais devastadoras. Impossível de localizar por adivinhação, ele confunde, engana e esmaga quem cai em suas armadilhas.",
  "lore": "Fraz-Urb'luu é o Príncipe da Enganação, senhor demoníaco das ilusões, capaz de criar mundos oníricos que iludem até os mais atentos. Após séculos aprisionado sob o Castelo Greyhawk, em Oerth, ele voltou ao Abismo e reconstrói seu poder enquanto caça os fragmentos do cajado que lhe tomaram. Sua forma real lembra uma enorme gárgula de pescoço longo e sorriso perturbador, mas ele assume qualquer aparência e às vezes se perde nos próprios papéis. Muitos de seus cultistas nem sabem a quem servem, e ele adora ajudar caçadores de demônios até corrompê-los e reclamar suas almas. Seu covil é Zoragmelok, uma cidade-fortaleza de arquitetura impossível cercada por muralhas de adamante numa planície de pó branco."
 },
 "salamandraGlacial": {
  "id": "salamandraGlacial",
  "tipo": "elemental",
  "name": "Salamandra Glacial",
  "nomeOriginal": "Frost Salamander",
  "fonte": "MTF",
  "size": "enorme",
  "level": 9,
  "cr": "9",
  "xp": 5000,
  "abilities": {
   "str": 20,
   "dex": 12,
   "con": 18,
   "int": 7,
   "wis": 11,
   "cha": 7
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 168,
  "hpDice": "16d12+64",
  "speedFt": 60,
  "speeds": {
   "climbFt": 40,
   "burrowFt": 40
  },
  "senses": {
   "passivePerception": 14,
   "darkvisionFt": 60,
   "tremorsenseFt": 60
  },
  "saves": [
   "con",
   "wis"
  ],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "damageImmunities": [
   "frio"
  ],
  "damageVulnerabilities": [
   "fogo"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Garras",
    "bonus": 9,
    "damage": "1d6+5",
    "type": "perfurante",
    "reachFt": 10
   },
   {
    "name": "Mordida",
    "bonus": 9,
    "damage": "1d8+5",
    "type": "perfurante",
    "reachFt": 15,
    "danoExtra": {
     "damage": "1d10",
     "type": "frio"
    }
   }
  ],
  "multiattack": {
   "count": 5,
   "sequence": [
    "Garras",
    "Garras",
    "Garras",
    "Garras",
    "Mordida"
   ]
  },
  "breath": {
   "name": "Sopro Congelante",
   "kind": "save",
   "shape": "cone",
   "areaFt": 60,
   "save": "con",
   "dc": 17,
   "damage": "8d10",
   "damageType": "frio",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    6
   ]
  },
  "traits": [
   "t_furiaArdente"
  ],
  "blurb": "Fera enorme que dilacera com quatro garras e uma mordida gélida por turno e sopra um cone de vento congelante; dano de fogo só a deixa mais furiosa, recarregando seu sopro.",
  "lore": "Vem do Plano do Gelo, a Frostfell, situado entre os Planos do Ar e da Água, e às vezes atravessa portais até regiões geladas do Plano Material. É atraída por qualquer fonte de calor, e fogueiras ou forjas a levam a atacar acampamentos e vilarejos que outros predadores evitariam. Escava o gelo e se esfrega nos fragmentos, abrindo cavernas imensas que parecem abrigos convidativos, mas viajantes que dormem ali acabam devorados. Azers a caçam com fogueiras-isca por causa do couro e das presas, e gigantes do gelo às vezes a domam para cavar fortalezas."
 },
 "geryon": {
  "id": "geryon",
  "tipo": "corruptor",
  "name": "Geryon",
  "nomeOriginal": "Geryon",
  "fonte": "MTF",
  "size": "enorme",
  "level": 21,
  "cr": "22",
  "xp": 41000,
  "abilities": {
   "str": 29,
   "dex": 17,
   "con": 22,
   "int": 19,
   "wis": 16,
   "cha": 23
  },
  "ac": 19,
  "acNote": "armadura natural",
  "maxHp": 300,
  "hpDice": "24d12+144",
  "speedFt": 30,
  "flyFt": 50,
  "speeds": {
   "flyFt": 50
  },
  "senses": {
   "passivePerception": 20,
   "truesightFt": 120
  },
  "saves": [
   "dex",
   "con",
   "wis",
   "cha"
  ],
  "skills": [
   "enganacao",
   "intimidacao",
   "percepcao"
  ],
  "expertise": [],
  "damageResistances": [
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "damageImmunities": [
   "frio",
   "fogo",
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
    "name": "Garras",
    "bonus": 16,
    "damage": "4d6+9",
    "type": "cortante",
    "reachFt": 15,
    "danoExtra": {
     "damage": "6d8",
     "type": "cortante"
    }
   },
   {
    "name": "Ferrão",
    "bonus": 16,
    "damage": "2d4+9",
    "type": "perfurante",
    "reachFt": 20,
    "onHit": {
     "save": "con",
     "dc": 21,
     "condition": "envenenado",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Garras",
    "Ferrão"
   ]
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "palavraDivina",
    "alterarAparencia",
    "detectarMagia",
    "missao",
    "tempestadeDeGelo",
    "invisibilidade",
    "localizarObjeto",
    "sugestao",
    "muralhaDeGelo"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "palavraDivina": 1
   },
   "aVontade": [
    "alterarAparencia",
    "detectarMagia",
    "missao",
    "tempestadeDeGelo",
    "invisibilidade",
    "localizarObjeto",
    "sugestao",
    "muralhaDeGelo"
   ],
   "cdPorMagia": {
    "palavraDivina": 21,
    "alterarAparencia": 21,
    "detectarMagia": 21,
    "missao": 21,
    "tempestadeDeGelo": 21,
    "invisibilidade": 21,
    "localizarObjeto": 21,
    "sugestao": 21,
    "muralhaDeGelo": 21
   }
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "acoesEspeciais": [
   {
    "nome": "Teleporte",
    "tipo": "teleporte",
    "alcanceFt": 120
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
     "nome": "Olhar Infernal",
     "custo": 1,
     "tipo": "alvo",
     "alcanceFt": 60,
     "save": "wis",
     "dc": 23,
     "condition": "amedrontado",
     "rounds": 10,
     "repete": false
    },
    {
     "nome": "Ferroada Veloz",
     "custo": 2,
     "tipo": "golpe",
     "arma": "Ferrão"
    },
    {
     "nome": "Teleporte",
     "custo": 1,
     "tipo": "teleporte",
     "alcanceFt": 120
    }
   ]
  },
  "traits": [
   "resistenciaAMagia",
   "armasMagicas",
   "regeneracaoDoLivro",
   "acoesLendarias"
  ],
  "blurb": "Arquidiabo enorme e brutal que agarra presas com as garras a até 4,5 m e as perfura com um ferrão venenoso que corrói o máximo de PV. Regenera, teleporta-se e resiste a magia, então é preciso dano radiante e pressão constante.",
  "lore": "Geryon é um arquidiabo caçador que disputa há séculos com Levistus o domínio de Stygia, a camada gelada dos Nove Infernos. Embora Levistus esteja aprisionado no gelo por ordem de Asmodeus, ainda reivindica o trono, e Geryon trama sem parar para tomá-lo. Ao contrário de outros senhores infernais, ele prefere lutar pessoalmente e saborear o sangue dos inimigos, o que prejudica sua coleta de almas e sua hierarquia. Hoje ocupa a fortaleza Coldsteel, no coração de Stygia, cercado de diabos do gelo e minotauros escravizados, remoendo a traição de Asmodeus."
 },
 "giff": {
  "id": "giff",
  "tipo": "humanoide",
  "name": "Giff",
  "nomeOriginal": "Giff",
  "fonte": "MTF",
  "size": "médio",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 18,
   "dex": 14,
   "con": 17,
   "int": 11,
   "wis": 12,
   "cha": 12
  },
  "ac": 16,
  "acNote": "peitoral",
  "maxHp": 60,
  "hpDice": "8d8+24",
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
    "name": "Espada Longa",
    "bonus": 6,
    "damage": "1d8+4",
    "type": "cortante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d10+4",
     "type": "cortante"
    }
   },
   {
    "name": "Mosquete",
    "bonus": 4,
    "damage": "1d12+2",
    "type": "perfurante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 40,
    "longRangeFt": 120
   },
   {
    "name": "Pistola",
    "bonus": 4,
    "damage": "1d10+2",
    "type": "perfurante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 30,
    "longRangeFt": 90
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Pistola",
    "Pistola"
   ]
  },
  "acoesEspeciais": [
   {
    "nome": "Granada de Fragmentação",
    "porDia": 1,
    "tipo": "area",
    "shape": "raio",
    "areaFt": 20,
    "save": "dex",
    "dc": 15,
    "damage": "5d6",
    "damageType": "perfurante",
    "halfOnSave": true
   }
  ],
  "traits": [
   "t_investidaDeCabeca",
   "t_periciaComArmasDeFogo"
  ],
  "blurb": "Mercenário com cabeça de hipopótamo que dispara duas pistolas por turno sem precisar recarregar, derruba inimigos com investidas de cabeça e arremessa uma granada de fragmentação que fere todos numa área ampla.",
  "lore": "Os giff são humanoides enormes, com cabeça de hipopótamo, que vagam entre os mundos como soldados de aluguel vestidos com uniformes chamativos. Toda a sociedade deles funciona como um exército: cada indivíduo tem uma patente do nascimento à morte, e as promoções vêm por bravura. Só aceitam contratos em unidades formadas apenas por giff e se recusam a lutar contra a própria espécie. Adoram pólvora acima de tudo, preferindo barris dela a ouro como pagamento, e desprezam a magia, que quase nenhum deles pratica."
 },
 "gishGithyanki": {
  "id": "gishGithyanki",
  "tipo": "humanoide",
  "name": "Gish Githyanki",
  "nomeOriginal": "Githyanki Gish",
  "fonte": "MTF",
  "size": "médio",
  "level": 9,
  "cr": "10",
  "xp": 5900,
  "abilities": {
   "str": 17,
   "dex": 15,
   "con": 14,
   "int": 16,
   "wis": 15,
   "cha": 16
  },
  "ac": 17,
  "acNote": "meia-armadura",
  "maxHp": 123,
  "hpDice": "19d8+38",
  "speedFt": 30,
  "senses": {
   "passivePerception": 16
  },
  "saves": [
   "con",
   "int",
   "wis"
  ],
  "skills": [
   "intuicao",
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Espada Longa",
    "bonus": 7,
    "damage": "1d8+3",
    "type": "cortante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "4d8",
     "type": "psíquico"
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Espada Longa",
    "Espada Longa"
   ]
  },
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "salto",
    "passoNebuloso",
    "indetectavel",
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
    "viagemPlanar": 1,
    "telecinesia": 1
   },
   "aVontade": [
    "maoMagica"
   ],
   "cdPorMagia": {
    "salto": 15,
    "passoNebuloso": 15,
    "indetectavel": 15,
    "viagemPlanar": 15,
    "telecinesia": 15,
    "maoMagica": 15
   }
  },
  "traits": [
   "t_magiaDeGuerra"
  ],
  "blurb": "Guerreiro-mago que alterna golpes de espada longa carregados de dano psíquico com magias como bola de fogo, velocidade e contramágica. Após conjurar, ainda ataca com a arma como ação bônus, e some com passo nebuloso ou porta dimensional quando acuado.",
  "lore": "Os gishes são a elite marcial e arcana dos githyanki, treinados para unir lâmina e feitiço numa só disciplina de combate. Servem à rainha-lich Vlaakith em incursões que partem do Plano Astral rumo a outros mundos, em busca de saque e de devoradores de mentes para exterminar. Costumam liderar pequenos grupos de ataque, abrindo caminho com magia antes de entrar no corpo a corpo. Frios e disciplinados, enxergam outras raças apenas como presas ou obstáculos."
 },
 "kithRakGithyanki": {
  "id": "kithRakGithyanki",
  "tipo": "humanoide",
  "name": "Kith'rak Githyanki",
  "nomeOriginal": "Githyanki Kith'rak",
  "fonte": "MTF",
  "size": "médio",
  "level": 9,
  "cr": "12",
  "xp": 8400,
  "abilities": {
   "str": 18,
   "dex": 16,
   "con": 17,
   "int": 16,
   "wis": 15,
   "cha": 17
  },
  "ac": 18,
  "acNote": "armadura de placas",
  "maxHp": 180,
  "hpDice": "24d8+72",
  "speedFt": 30,
  "senses": {
   "passivePerception": 16
  },
  "saves": [
   "con",
   "int",
   "wis"
  ],
  "skills": [
   "intimidacao",
   "percepcao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Espadão",
    "bonus": 8,
    "damage": "2d6+4",
    "type": "cortante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "5d6",
     "type": "psíquico"
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Espadão",
    "Espadão",
    "Espadão"
   ]
  },
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "borrao",
    "salto",
    "passoNebuloso",
    "indetectavel",
    "viagemPlanar",
    "telecinesia",
    "maoMagica"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "borrao": 3,
    "salto": 3,
    "passoNebuloso": 3,
    "indetectavel": 3,
    "viagemPlanar": 1,
    "telecinesia": 1
   },
   "aVontade": [
    "maoMagica"
   ],
   "cdPorMagia": {
    "borrao": 15,
    "salto": 15,
    "passoNebuloso": 15,
    "indetectavel": 15,
    "viagemPlanar": 15,
    "telecinesia": 15,
    "maoMagica": 15
   }
  },
  "traits": [
   "t_reunirAsTropas",
   "aparar"
  ],
  "blurb": "Comandante de elite que desfere três golpes de espadão por turno, cada um somando dano psíquico pesado, e livra seus aliados de medo e encantamento. Apara ataques corpo a corpo e usa psiônica para se teleportar ou desaparecer.",
  "lore": "Os kith'rak são oficiais de alta patente do exército githyanki, encarregados de liderar pelotões de guerreiros em incursões pelos planos. Conquistaram o posto em batalhas sangrentas e mantêm a disciplina pela força e pelo exemplo. Obedecem cegamente à rainha-lich Vlaakith e odeiam os devoradores de mentes acima de tudo. Costumam aparecer à frente de grupos de ataque em desertos, montanhas e cidades do Plano Material."
 },
 "comandanteSupremoGithyanki": {
  "id": "comandanteSupremoGithyanki",
  "tipo": "humanoide",
  "name": "Comandante Supremo Githyanki",
  "nomeOriginal": "Githyanki Supreme Commander",
  "fonte": "MTF",
  "size": "médio",
  "level": 13,
  "cr": "14",
  "xp": 11500,
  "abilities": {
   "str": 19,
   "dex": 17,
   "con": 18,
   "int": 16,
   "wis": 16,
   "cha": 18
  },
  "ac": 18,
  "acNote": "armadura de placas",
  "maxHp": 187,
  "hpDice": "22d8+88",
  "speedFt": 30,
  "senses": {
   "passivePerception": 18
  },
  "saves": [
   "con",
   "int",
   "wis"
  ],
  "skills": [
   "intuicao",
   "intimidacao",
   "percepcao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Espada Grande de Prata",
    "bonus": 12,
    "damage": "2d6+7",
    "type": "cortante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "5d6",
     "type": "psíquico"
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Espada Grande de Prata",
    "Espada Grande de Prata"
   ]
  },
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "salto",
    "levitacao",
    "passoNebuloso",
    "indetectavel",
    "maoDeBigby",
    "sugestaoEmMassa",
    "viagemPlanar",
    "telecinesia",
    "maoMagica"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "salto": 3,
    "levitacao": 3,
    "passoNebuloso": 3,
    "indetectavel": 3,
    "maoDeBigby": 1,
    "sugestaoEmMassa": 1,
    "viagemPlanar": 1,
    "telecinesia": 1
   },
   "aVontade": [
    "maoMagica"
   ],
   "cdPorMagia": {
    "salto": 16,
    "levitacao": 16,
    "passoNebuloso": 16,
    "indetectavel": 16,
    "maoDeBigby": 16,
    "sugestaoEmMassa": 16,
    "viagemPlanar": 16,
    "telecinesia": 16,
    "maoMagica": 16
   }
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Ataque",
     "custo": 2,
     "tipo": "golpe",
     "arma": "Espada Grande de Prata"
    }
   ]
  },
  "traits": [
   "aparar",
   "acoesLendarias"
  ],
  "blurb": "Guerreiro de elite que golpeia duas vezes com a espada de prata, somando dano cortante a muito dano psíquico, e usa ações lendárias para atacar de novo, teleportar-se ou mandar aliados golpearem. Também apara golpes e lança magias psiônicas poderosas como mão de Bigby e sugestão em massa.",
  "lore": "Os comandantes supremos estão entre os mais temidos líderes militares do povo githyanki, servindo diretamente à rainha-lich que governa sua raça. Conduzem exércitos em incursões a partir do Plano Astral, saqueando mundos e caçando devoradores de mentes, inimigos ancestrais dos gith. Combinam disciplina marcial com poderes psiônicos refinados, comandando suas tropas pela mente e pela espada. Raramente aparecem sem uma escolta de guerreiros leais dispostos a morrer por eles."
 },
 "anarcaGithzerai": {
  "id": "anarcaGithzerai",
  "tipo": "humanoide",
  "name": "Anarca Githzerai",
  "nomeOriginal": "Githzerai Anarch",
  "fonte": "MTF",
  "size": "médio",
  "level": 13,
  "cr": "16",
  "xp": 15000,
  "abilities": {
   "str": 16,
   "dex": 21,
   "con": 18,
   "int": 18,
   "wis": 20,
   "cha": 14
  },
  "ac": 20,
  "acNote": "defesa psíquica",
  "maxHp": 144,
  "hpDice": "17d8+68",
  "speedFt": 30,
  "flyFt": 40,
  "hover": true,
  "speeds": {
   "flyFt": 40
  },
  "senses": {
   "passivePerception": 20
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
    "bonus": 10,
    "damage": "2d8+5",
    "type": "concussão",
    "reachFt": 5,
    "danoExtra": {
     "damage": "4d8",
     "type": "psíquico"
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Golpe Desarmado",
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
    "telecinesia",
    "globoDeInvulnerabilidade",
    "viagemPlanar",
    "muralhaDeForca",
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
    "telecinesia": 3,
    "globoDeInvulnerabilidade": 1,
    "viagemPlanar": 1,
    "muralhaDeForca": 1
   },
   "aVontade": [
    "maoMagica"
   ],
   "cdPorMagia": {
    "quedaSuave": 18,
    "salto": 18,
    "verOInvisivel": 18,
    "escudoArcano": 18,
    "telecinesia": 18,
    "globoDeInvulnerabilidade": 18,
    "viagemPlanar": 18,
    "muralhaDeForca": 18,
    "maoMagica": 18
   }
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Golpe",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Golpe Desarmado"
    },
    {
     "nome": "Alterar Gravidade",
     "custo": 3,
     "tipo": "magia",
     "magias": [
      "inverterAGravidade"
     ]
    }
   ]
  },
  "traits": [
   "t_defesaPsiquica",
   "acoesLendarias"
  ],
  "blurb": "Monge psiônico que flutua pelo campo desferindo três golpes desarmados carregados de dano psíquico, teleportando-se entre alvos. Pode inverter a gravidade em qualquer direção e erguer muralhas de energia para isolar o grupo.",
  "lore": "Os anarcas são os mestres mais poderosos entre os githzerai, capazes de impor ordem ao caos do Limbo apenas com a força da mente. Cada um sustenta ao seu redor ilhas de matéria estável onde seu povo constrói fortalezas e mosteiros. Vivem em disciplina rígida, meditando e treinando o corpo e a psique por séculos. Raramente deixam seus domínios, mas quando o fazem costuma ser para caçar devoradores de mentes ou proteger os seus."
 },
 "githzeraiIluminado": {
  "id": "githzeraiIluminado",
  "tipo": "humanoide",
  "name": "Githzerai Iluminado",
  "nomeOriginal": "Githzerai Enlightened",
  "fonte": "MTF",
  "size": "médio",
  "level": 9,
  "cr": "10",
  "xp": 5900,
  "abilities": {
   "str": 14,
   "dex": 19,
   "con": 16,
   "int": 17,
   "wis": 19,
   "cha": 13
  },
  "ac": 18,
  "acNote": "Defesa Psíquica",
  "maxHp": 112,
  "hpDice": "15d8+45",
  "speedFt": 30,
  "senses": {
   "passivePerception": 18
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
    "bonus": 8,
    "damage": "2d8+4",
    "type": "concussão",
    "reachFt": 5,
    "danoExtra": {
     "damage": "3d8",
     "type": "psíquico"
    }
   },
   {
    "name": "Golpe Temporal",
    "bonus": 8,
    "damage": "2d8+4",
    "type": "concussão",
    "reachFt": 5,
    "onHit": {
     "save": "wis",
     "dc": 16,
     "danoSeFalhar": {
      "damage": "8d12",
      "type": "psíquico"
     },
     "metadeSePassar": false
    },
    "recharge": [
     6
    ]
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Golpe Desarmado",
    "Golpe Desarmado",
    "Golpe Desarmado"
   ]
  },
  "spellcasting": {
   "ability": "wis",
   "cantrips": [],
   "prepared": [
    "borrao",
    "recuoAcelerado",
    "quedaSuave",
    "salto",
    "verOInvisivel",
    "escudoArcano",
    "velocidade",
    "viagemPlanar",
    "teletransporte",
    "maoMagica"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "borrao": 3,
    "recuoAcelerado": 3,
    "quedaSuave": 3,
    "salto": 3,
    "verOInvisivel": 3,
    "escudoArcano": 3,
    "velocidade": 1,
    "viagemPlanar": 1,
    "teletransporte": 1
   },
   "aVontade": [
    "maoMagica"
   ],
   "cdPorMagia": {
    "borrao": 16,
    "recuoAcelerado": 16,
    "quedaSuave": 16,
    "salto": 16,
    "verOInvisivel": 16,
    "escudoArcano": 16,
    "velocidade": 16,
    "viagemPlanar": 16,
    "teletransporte": 16,
    "maoMagica": 16
   }
  },
  "traits": [
   "t_defesaPsiquica"
  ],
  "blurb": "Monge psiônico que desfere três golpes desarmados carregados de dano psíquico e pode lançar o alvo para fora do tempo com um Golpe Temporal devastador. Usa magias inatas como velocidade, escudo e teleporte para se reposicionar.",
  "lore": "Os githzerai iluminados alcançaram um domínio da mente que poucos de seu povo atingem, após décadas de disciplina no caos do Limbo. Vivem em mosteiros isolados ou viajam pelo multiverso em missões de sua ordem. Calmos e reservados, só entram em combate quando necessário, mas então agem com precisão impiedosa. Seus golpes atingem tanto o corpo quanto a mente, e alguns chegam a arrancar inimigos do fluxo do tempo."
 },
 "tecelaoSombrio": {
  "id": "tecelaoSombrio",
  "tipo": "humanoide",
  "name": "Tecelão Sombrio",
  "nomeOriginal": "Gloom Weaver",
  "fonte": "MTF",
  "size": "médio",
  "level": 9,
  "cr": "9",
  "xp": 5000,
  "abilities": {
   "str": 11,
   "dex": 18,
   "con": 14,
   "int": 15,
   "wis": 12,
   "cha": 18
  },
  "ac": 14,
  "acNote": "17 com armadura arcana",
  "maxHp": 104,
  "hpDice": "16d8+32",
  "speedFt": 30,
  "senses": {
   "passivePerception": 11,
   "darkvisionFt": 60
  },
  "saves": [
   "dex",
   "con"
  ],
  "skills": [],
  "expertise": [],
  "damageImmunities": [
   "necrótico"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "exausto"
  ],
  "attacks": [
   {
    "name": "Lança Sombria",
    "bonus": 8,
    "damage": "1d6+4",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "4d12",
     "type": "necrótico"
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Lança Sombria",
    "Lança Sombria"
   ]
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "perdicao",
    "compulsao",
    "confusao",
    "visaoDaVerdade",
    "olhoArcano",
    "armaduraArcana",
    "falarComOsMortos"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "perdicao": 1,
    "compulsao": 1,
    "confusao": 1,
    "visaoDaVerdade": 1
   },
   "aVontade": [
    "olhoArcano",
    "armaduraArcana",
    "falarComOsMortos"
   ],
   "cdPorMagia": {
    "perdicao": 16,
    "compulsao": 16,
    "confusao": 16,
    "visaoDaVerdade": 16,
    "olhoArcano": 16,
    "armaduraArcana": 16,
    "falarComOsMortos": 16
   }
  },
  "traits": [
   "t_fardoDoTempo",
   "ascendenciaFeerica",
   "t_fugaNebulosa"
  ],
  "blurb": "Conjurador shadar-kai que alterna golpes de lança carregados de energia necrótica com magias de bruxo, enquanto quem fica perto dele sofre desvantagem nas resistências. Quando ferido, some e reaparece longe.",
  "lore": "Os tecelões sombrios são shadar-kai, elfos ligados ao Pendor das Sombras, que fizeram pactos com poderes sombrios para dominar a melancolia desse plano. Andam pelo Subterrâneo e pelas cidades como espiões e agentes de sua rainha. O peso do tempo parece emanar deles, enfraquecendo a vontade de quem se aproxima. Preferem enfraquecer o inimigo com ilusões e maldições antes de atacar de perto."
 },
 "dilaceradorCinzento": {
  "id": "dilaceradorCinzento",
  "tipo": "monstruosidade",
  "name": "Dilacerador Cinzento",
  "nomeOriginal": "Gray Render",
  "fonte": "MTF",
  "size": "grande",
  "level": 9,
  "cr": "12",
  "xp": 8400,
  "abilities": {
   "str": 19,
   "dex": 13,
   "con": 20,
   "int": 3,
   "wis": 6,
   "cha": 8
  },
  "ac": 19,
  "acNote": "armadura natural",
  "maxHp": 189,
  "hpDice": "18d10+90",
  "speedFt": 30,
  "senses": {
   "passivePerception": 12,
   "darkvisionFt": 60
  },
  "saves": [
   "str",
   "con"
  ],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 8,
    "damage": "2d12+4",
    "type": "perfurante",
    "reachFt": 5,
    "onHit": {
     "save": "str",
     "dc": 16,
     "condition": "caido",
     "rounds": 1,
     "repete": false
    }
   },
   {
    "name": "Garras",
    "bonus": 8,
    "damage": "2d8+4",
    "type": "cortante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "2d6",
     "type": "concussão"
    }
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
  "traits": [
   "t_furiaSangrenta"
  ],
  "blurb": "Brutamontes que morde para derrubar e depois rasga com garras de longo alcance, causando dano extra em quem está caído. Cada golpe que sofre o deixa mais furioso, levando-o a atacar alguém ao redor.",
  "lore": "O dilacerador cinzento é uma monstruosidade enorme e selvagem, frequentemente vista ao lado dos neogi, que talvez a tenham criado. Seu maior desejo é se ligar a uma criatura inteligente e defendê-la até a morte, cortejando-a com um canto estranho e gestos de submissão. Fiel em combate, é um companheiro caótico fora dele, capaz de destruir casas, matar montarias ou seguir o mestre contra ordens. Reproduz-se por nódulos que se soltam do corpo e não demonstra interesse pelos filhotes nem por outros da sua espécie. Habita florestas e colinas, muitas vezes abandonado por mestres exasperados."
 },
 "grazZt": {
  "id": "grazZt",
  "tipo": "corruptor",
  "name": "Graz'zt",
  "nomeOriginal": "Graz'zt",
  "fonte": "MTF",
  "size": "grande",
  "level": 21,
  "cr": "24",
  "xp": 62000,
  "abilities": {
   "str": 22,
   "dex": 15,
   "con": 21,
   "int": 23,
   "wis": 21,
   "cha": 26
  },
  "ac": 20,
  "acNote": "armadura natural",
  "maxHp": 346,
  "hpDice": "33d10+165",
  "speedFt": 40,
  "senses": {
   "passivePerception": 22,
   "truesightFt": 120
  },
  "saves": [
   "dex",
   "con",
   "wis"
  ],
  "skills": [
   "enganacao",
   "intuicao",
   "percepcao",
   "persuasao"
  ],
  "expertise": [],
  "damageResistances": [
   "frio",
   "fogo",
   "elétrico"
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
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Onda de Pesar (Espada Grande)",
    "bonus": 13,
    "damage": "4d6+6",
    "type": "cortante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "3d6",
     "type": "ácido"
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
    "contramagia",
    "escuridao",
    "dominarPessoa",
    "santuario",
    "telecinesia",
    "teletransporte",
    "dominarMonstro",
    "invisibilidadeMaior",
    "enfeiticarPessoa",
    "coroaDaLoucura",
    "detectarMagia",
    "dissiparMagia",
    "sussurrosDissonantes"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "contramagia": 3,
    "escuridao": 3,
    "dominarPessoa": 3,
    "santuario": 3,
    "telecinesia": 3,
    "teletransporte": 3,
    "dominarMonstro": 1,
    "invisibilidadeMaior": 1
   },
   "aVontade": [
    "enfeiticarPessoa",
    "coroaDaLoucura",
    "detectarMagia",
    "dissiparMagia",
    "sussurrosDissonantes"
   ],
   "cdPorMagia": {
    "contramagia": 23,
    "escuridao": 23,
    "dominarPessoa": 23,
    "santuario": 23,
    "telecinesia": 23,
    "teletransporte": 23,
    "dominarMonstro": 23,
    "invisibilidadeMaior": 23,
    "enfeiticarPessoa": 23,
    "coroaDaLoucura": 23,
    "detectarMagia": 23,
    "dissiparMagia": 23,
    "sussurrosDissonantes": 23
   }
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "acoesEspeciais": [
   {
    "nome": "Teletransporte",
    "tipo": "teleporte",
    "alcanceFt": 120
   }
  ],
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Ataque",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Onda de Pesar (Espada Grande)"
    },
    {
     "nome": "Semear Discórdia",
     "custo": 1,
     "tipo": "magia",
     "magias": [
      "coroaDaLoucura",
      "sussurrosDissonantes"
     ]
    },
    {
     "nome": "Teletransporte",
     "custo": 1,
     "tipo": "teleporte",
     "alcanceFt": 120
    }
   ]
  },
  "traits": [
   "metamorfo",
   "resistenciaAMagia",
   "armasMagicas",
   "acoesLendarias"
  ],
  "blurb": "Manipulador antes de guerreiro: enfeitiça e domina inimigos, faz marionetes deles com ações lendárias e se teletransporta pelo campo. Quando decide lutar, sua espada ondulada causa corte e ácido com alcance de 3 m.",
  "lore": "Conhecido como o Príncipe Sombrio, Graz'zt é um senhor demoníaco do Abismo cuja beleza esconde detalhes perturbadores, como seis dedos em cada mão. Ele governa Azzatar a partir do Palácio Argênteo, na cidade de Zelatar, um lugar de luxo extremo onde só a moderação e a bondade são proibidas. Seus cultos são sociedades secretas de excessos, mascaradas de alabastro, que controlam os outros com chantagem, vícios e manipulação. Prefere seduzir e enganar, mas se provocado empunha Angdrelve, a Onda de Pesar, com violência brutal. Sua presença prolongada num lugar chega a distorcer a própria realidade."
 },
 "abishaiVerde": {
  "id": "abishaiVerde",
  "tipo": "corruptor",
  "name": "Abishai Verde",
  "nomeOriginal": "Green Abishai",
  "fonte": "MTF",
  "size": "médio",
  "level": 13,
  "cr": "15",
  "xp": 13000,
  "abilities": {
   "str": 12,
   "dex": 17,
   "con": 16,
   "int": 17,
   "wis": 12,
   "cha": 19
  },
  "ac": 18,
  "acNote": "armadura natural",
  "maxHp": 187,
  "hpDice": "25d8+75",
  "speedFt": 30,
  "flyFt": 40,
  "speeds": {
   "flyFt": 40
  },
  "senses": {
   "passivePerception": 16,
   "darkvisionFt": 120
  },
  "saves": [
   "int",
   "cha"
  ],
  "skills": [
   "enganacao",
   "intuicao",
   "percepcao",
   "persuasao"
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
    "name": "Espada Longa",
    "bonus": 6,
    "damage": "1d8+1",
    "type": "cortante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d10+1",
     "type": "cortante"
    }
   },
   {
    "name": "Garras",
    "bonus": 8,
    "damage": "2d8+3",
    "type": "perfurante",
    "reachFt": 5,
    "onHit": {
     "save": "con",
     "dc": 16,
     "condition": "envenenado",
     "rounds": 10,
     "repete": true
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Garras",
    "Espada Longa"
   ]
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "enfeiticarPessoa",
    "detectarPensamentos",
    "medo",
    "confusao",
    "dominarPessoa",
    "sugestaoEmMassa",
    "alterarAparencia",
    "imagemMaior"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "enfeiticarPessoa": 3,
    "detectarPensamentos": 3,
    "medo": 3,
    "confusao": 1,
    "dominarPessoa": 1,
    "sugestaoEmMassa": 1
   },
   "aVontade": [
    "alterarAparencia",
    "imagemMaior"
   ],
   "cdPorMagia": {
    "enfeiticarPessoa": 17,
    "detectarPensamentos": 17,
    "medo": 17,
    "confusao": 17,
    "dominarPessoa": 17,
    "sugestaoEmMassa": 17,
    "alterarAparencia": 17,
    "imagemMaior": 17
   }
  },
  "features": [
   "devilsSight"
  ],
  "traits": [
   "resistenciaAMagia",
   "armasMagicas"
  ],
  "blurb": "Diabo manipulador que combina garras venenosas com espada longa ou magia de controle mental, como dominar pessoa e confusão. Resiste a magia e só é ferido de verdade por armas mágicas ou prateadas.",
  "lore": "Os abishais verdes são diabos dracônicos a serviço de Tiamat, enviados ao mundo para agir nas sombras. São mestres da intriga: mudam de aparência, sussurram mentiras e se infiltram em cortes e cidades. Preferem dobrar a vontade dos mortais a lutar abertamente, mas suas garras envenenadas são letais quando precisam sujar as mãos. Costumam servir como conselheiros e espiões de cultos dracônicos."
 },
 "maquinaDoFogoInfernal": {
  "id": "maquinaDoFogoInfernal",
  "tipo": "constructo",
  "name": "Máquina do Fogo Infernal",
  "nomeOriginal": "Hellfire Engine",
  "fonte": "MTF",
  "size": "enorme",
  "level": 13,
  "cr": "16",
  "xp": 15000,
  "abilities": {
   "str": 20,
   "dex": 16,
   "con": 24,
   "int": 2,
   "wis": 10,
   "cha": 1
  },
  "ac": 18,
  "acNote": "armadura natural",
  "maxHp": 216,
  "hpDice": "16d12+112",
  "speedFt": 40,
  "senses": {
   "passivePerception": 10,
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
   "psíquico",
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
   "enfeitiçado",
   "surdo",
   "exausto",
   "amedrontado",
   "paralisado",
   "envenenado",
   "inconsciente"
  ],
  "breath": {
   "name": "Armas do Fogo Infernal",
   "kind": "save",
   "shape": "cone",
   "areaFt": 60,
   "save": "dex",
   "dc": 20,
   "damage": "2d10",
   "damageType": "fogo",
   "halfOnSave": true,
   "origem": "sopro"
  },
  "acoesEspeciais": [
   {
    "nome": "Avanço Esmagador",
    "tipo": "area",
    "shape": "raio",
    "areaFt": 5,
    "save": "dex",
    "dc": 18,
    "damage": "8d6",
    "damageType": "concussão",
    "halfOnSave": false,
    "condition": "caido",
    "rounds": 10,
    "repete": false
   }
  ],
  "traits": [
   "formaImutavel",
   "resistenciaAMagia"
  ],
  "blurb": "Um colosso mecânico que atropela fileiras inteiras e alterna entre cone de fogo ácido, mangual elétrico e canhão trovejante de longo alcance. Quem morre para ela tem a alma arrastada para Avernus como lêmure.",
  "lore": "Construtos infernais de guerra, meio máquina e meio magia, mantidos de reserva por amnizus e outros generais diabólicos para conter invasões de demônios ou cruzados mortais. Às vezes uma delas escapa e sai devastando tudo, movida apenas pela compulsão de destruir. Têm formatos variados, mas nenhuma conhece sutileza: existem para varrer inimigos em ondas. Mortais que tombam diante delas se tornam soldados do Inferno em poucas horas, a menos que magia poderosa interfira. Não precisam respirar, comer, beber nem dormir."
 },
 "uivador": {
  "id": "uivador",
  "tipo": "corruptor",
  "name": "Uivador",
  "nomeOriginal": "Howler",
  "fonte": "MTF",
  "size": "grande",
  "level": 5,
  "cr": "8",
  "xp": 3900,
  "abilities": {
   "str": 17,
   "dex": 16,
   "con": 15,
   "int": 5,
   "wis": 20,
   "cha": 6
  },
  "ac": 16,
  "acNote": "armadura natural",
  "maxHp": 90,
  "hpDice": "12d10+24",
  "speedFt": 40,
  "senses": {
   "passivePerception": 15,
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
  "conditionImmunities": [
   "amedrontado"
  ],
  "attacks": [
   {
    "name": "Mordida Dilacerante",
    "bonus": 6,
    "damage": "2d6+3",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "4d10",
     "type": "psíquico"
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Mordida Dilacerante",
    "Mordida Dilacerante"
   ]
  },
  "acoesEspeciais": [
   {
    "nome": "Uivo Destruidor de Mentes",
    "recharge": [
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 60,
    "save": "wis",
    "dc": 16,
    "condition": "amedrontado",
    "rounds": 1,
    "repete": false,
    "ateFimDoTurnoDele": true
   }
  ],
  "traits": [
   "packTactics"
  ],
  "blurb": "Caça em matilha com vantagem nos ataques e um uivo que deixa os alvos amedrontados e incapacitados; contra vítimas amedrontadas, sua mordida causa dano psíquico devastador e ignora resistências.",
  "lore": "Os uivadores são feras de pesadelo nascidas em Pandemônio, mas espalhadas pelos Planos Inferiores porque muitos corruptores os capturam e adestram como cães de guerra. Só obedecem a quem os domina com brutalidade e se impõe como líder da matilha, seguindo-o depois sem hesitar. Seu lamento distante é ouvido antes de serem vistos e corrói a mente de quem escuta. Em combate, usam velocidade e número para encurralar a presa, enquanto o uivo impede pensamentos complexos e anula magias e poderes por instantes decisivos. Dizem que cantam porque saboreiam o medo."
 },
 "hutijin": {
  "id": "hutijin",
  "tipo": "corruptor",
  "name": "Hutijin",
  "nomeOriginal": "Hutijin",
  "fonte": "MTF",
  "size": "grande",
  "level": 21,
  "cr": "21",
  "xp": 33000,
  "abilities": {
   "str": 27,
   "dex": 15,
   "con": 25,
   "int": 23,
   "wis": 19,
   "cha": 25
  },
  "ac": 19,
  "acNote": "armadura natural",
  "maxHp": 200,
  "hpDice": "16d10+112",
  "speedFt": 30,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60
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
   "intimidacao",
   "percepcao"
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
   "enfeitiçado",
   "exausto",
   "amedrontado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 15,
    "damage": "2d6+8",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "3d6",
     "type": "veneno"
    },
    "onHit": {
     "save": "con",
     "dc": 22,
     "condition": "envenenado",
     "rounds": 1,
     "repete": true
    }
   },
   {
    "name": "Garra",
    "bonus": 15,
    "damage": "2d8+8",
    "type": "cortante",
    "reachFt": 10
   },
   {
    "name": "Maça",
    "bonus": 15,
    "damage": "2d6+8",
    "type": "concussão",
    "reachFt": 5
   },
   {
    "name": "Cauda",
    "bonus": 15,
    "damage": "2d10+8",
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
    "dissiparMagia",
    "curaTotal",
    "alterarAparencia",
    "animarMortos",
    "detectarMagia",
    "imobilizarMonstro",
    "invisibilidade",
    "relampago",
    "sugestao",
    "muralhaDeFogo"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "dissiparMagia": 3,
    "curaTotal": 1
   },
   "aVontade": [
    "alterarAparencia",
    "animarMortos",
    "detectarMagia",
    "imobilizarMonstro",
    "invisibilidade",
    "relampago",
    "sugestao",
    "muralhaDeFogo"
   ],
   "cdPorMagia": {
    "dissiparMagia": 22,
    "curaTotal": 22,
    "alterarAparencia": 22,
    "animarMortos": 22,
    "detectarMagia": 22,
    "imobilizarMonstro": 22,
    "invisibilidade": 22,
    "relampago": 22,
    "sugestao": 22,
    "muralhaDeFogo": 22
   }
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "acoesEspeciais": [
   {
    "nome": "Teletransporte",
    "tipo": "teleporte",
    "alcanceFt": 120
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
     "nome": "Ataque",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Maça"
    },
    {
     "nome": "Tempestade de Raios",
     "custo": 2,
     "tipo": "area",
     "raioFt": 20,
     "save": "dex",
     "dc": 22,
     "damage": "4d8",
     "damageType": "elétrico",
     "halfOnSave": true
    },
    {
     "nome": "Teletransporte",
     "custo": 1,
     "tipo": "teleporte",
     "alcanceFt": 120
    }
   ]
  },
  "traits": [
   "t_desesperoInfernal",
   "resistenciaAMagia",
   "armasMagicas",
   "regeneracaoDoLivro",
   "t_vozAterradora",
   "acoesLendarias"
  ],
  "blurb": "Duque infernal que despedaça com mordida venenosa, garra, maça e cauda, enquanto sua aura faz quem está perto falhar em resistências e sua voz espalha pavor. Regenera a cada turno e se teletransporta pelo campo, lançando tempestades de raios.",
  "lore": "Hutijin é um duque de Cania que serve Mefistófeles com uma lealdade rara nos Nove Infernos, talvez por estar preso a algum segredo do mestre. Ele comanda duas companhias de diabos das profundezas, a nobreza de Cania, e com elas esmaga qualquer rival. Odeia mortais e não tem cultos; quem o invoca fecha um acordo barato e apressado, mas recebe em seguida uma morte lenta. Arquidiabos rivais espalham os meios de invocá-lo para afastá-lo da guarda de seu senhor."
 },
 "hidroloth": {
  "id": "hidroloth",
  "tipo": "corruptor",
  "name": "Hidroloth",
  "nomeOriginal": "Hydroloth",
  "fonte": "MTF",
  "size": "médio",
  "level": 9,
  "cr": "9",
  "xp": 5000,
  "abilities": {
   "str": 12,
   "dex": 21,
   "con": 16,
   "int": 19,
   "wis": 10,
   "cha": 14
  },
  "ac": 15,
  "maxHp": 135,
  "hpDice": "18d8+54",
  "speedFt": 20,
  "speeds": {
   "swimFt": 40
  },
  "senses": {
   "passivePerception": 14,
   "blindsightFt": 60,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "intuicao",
   "percepcao"
  ],
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
   "ácido",
   "veneno"
  ],
  "damageVulnerabilities": [
   "fogo"
  ],
  "conditionImmunities": [
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Garras",
    "bonus": 9,
    "damage": "2d8+5",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Mordida",
    "bonus": 9,
    "damage": "2d10+5",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2
  },
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "coroaDaLoucura",
    "medo",
    "assassinoFantasmagorico",
    "sugestao",
    "escuridao",
    "detectarMagia",
    "dissiparMagia",
    "invisibilidade",
    "andarNaAgua"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "coroaDaLoucura": 3,
    "medo": 3,
    "assassinoFantasmagorico": 3,
    "sugestao": 3
   },
   "aVontade": [
    "escuridao",
    "detectarMagia",
    "dissiparMagia",
    "invisibilidade",
    "andarNaAgua"
   ],
   "cdPorMagia": {
    "coroaDaLoucura": 16,
    "medo": 16,
    "assassinoFantasmagorico": 16,
    "sugestao": 16,
    "escuridao": 16,
    "detectarMagia": 16,
    "dissiparMagia": 16,
    "invisibilidade": 16,
    "andarNaAgua": 16
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Roubar Memória (1/Dia)",
    "porDia": 1,
    "tipo": "alvo",
    "alcanceFt": 60,
    "save": "int",
    "dc": 16,
    "damage": "4d6",
    "damageType": "psíquico",
    "halfOnSave": false
   },
   {
    "nome": "Teletransporte",
    "tipo": "teleporte",
    "alcanceFt": 60
   }
  ],
  "traits": [
   "resistenciaAMagia",
   "armasMagicas",
   "t_memoriaProtegida",
   "t_vantagemAquatica"
  ],
  "blurb": "Combate melhor submerso, onde tem vantagem nos ataques, alternando garras e mordida com magias de medo e loucura. Seu Roubo de Memória pode deixar um herói sem perícias, sem magias e sem entender idiomas.",
  "lore": "Os hidroloths são yugoloths anfíbios, parecidos com sapos demoníacos, que vivem nas águas sombrias dos Planos Inferiores, especialmente perto do Rio Estige. Mercenários frios e calculistas, servem a quem pagar melhor e costumam ser contratados como guias ou guardas em travessias aquáticas. Dominam a água ao redor e apagam lembranças das vítimas, vendendo segredos roubados quando lhes convém. Suas próprias mentes são blindadas contra qualquer leitura ou alteração."
 },
 "cobraDeFerro": {
  "id": "cobraDeFerro",
  "tipo": "constructo",
  "name": "Cobra de Ferro",
  "nomeOriginal": "Iron Cobra",
  "fonte": "MTF",
  "size": "médio",
  "level": 1,
  "cr": "4",
  "xp": 1100,
  "abilities": {
   "str": 12,
   "dex": 16,
   "con": 14,
   "int": 3,
   "wis": 10,
   "cha": 1
  },
  "ac": 13,
  "maxHp": 45,
  "hpDice": "7d8+14",
  "speedFt": 30,
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
   "petrificado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 5,
    "damage": "1d6+3",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "3d8",
     "type": "veneno"
    },
    "onHit": {
     "save": "con",
     "dc": 13,
     "condition": "paralisado",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "traits": [
   "resistenciaAMagia"
  ],
  "blurb": "Constructo furtivo que dá botes venenosos; cada mordida pode causar dano extra de veneno, deixar o alvo confuso a ponto de atacar aliados ou paralisá-lo. Resiste bem à magia e ignora armas comuns.",
  "lore": "A cobra de ferro é um constructo mecânico em forma de serpente, montado por artífices e magos para vigiar tesouros ou eliminar alvos escolhidos. Ela obedece apenas ao criador e entende uma das línguas dele, mas não fala. Costuma ficar escondida e imóvel até a presa chegar perto, e então ataca com rapidez assustadora. O veneno alquímico guardado em suas presas varia a cada bote, o que a torna imprevisível em combate."
 },
 "juiblex": {
  "id": "juiblex",
  "tipo": "corruptor",
  "name": "Juiblex",
  "nomeOriginal": "Juiblex",
  "fonte": "MTF",
  "size": "enorme",
  "level": 21,
  "cr": "23",
  "xp": 50000,
  "abilities": {
   "str": 24,
   "dex": 10,
   "con": 23,
   "int": 20,
   "wis": 20,
   "cha": 16
  },
  "ac": 18,
  "acNote": "armadura natural",
  "maxHp": 350,
  "hpDice": "28d12+168",
  "speedFt": 30,
  "senses": {
   "passivePerception": 22,
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
  "damageResistances": [
   "frio",
   "fogo",
   "elétrico"
  ],
  "damageImmunities": [
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
   "exausto",
   "amedrontado",
   "agarrado",
   "paralisado",
   "petrificado",
   "envenenado",
   "caido",
   "contido",
   "atordoado",
   "inconsciente"
  ],
  "attacks": [
   {
    "name": "Açoite Ácido",
    "bonus": 14,
    "damage": "4d6+7",
    "type": "ácido",
    "reachFt": 10
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Açoite Ácido",
    "Açoite Ácido",
    "Açoite Ácido"
   ]
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "praga",
    "contagio",
    "formaGasosa",
    "respingoAcido",
    "detectarMagia"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "praga": 3,
    "contagio": 3,
    "formaGasosa": 3
   },
   "aVontade": [
    "respingoAcido",
    "detectarMagia"
   ],
   "cdPorMagia": {
    "praga": 18,
    "contagio": 18,
    "formaGasosa": 18,
    "respingoAcido": 18,
    "detectarMagia": 18
   }
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "acoesEspeciais": [
   {
    "nome": "Expelir Lodo",
    "recharge": [
     5,
     6
    ],
    "tipo": "alvo",
    "alcanceFt": 60,
    "save": "dex",
    "dc": 21,
    "damage": "10d10",
    "damageType": "ácido",
    "halfOnSave": false
   }
  ],
  "aura": {
   "raioFt": 10,
   "quando": "inicioDoAlvo",
   "save": "con",
   "dc": 21,
   "condition": "envenenado",
   "rounds": 1
  },
  "regeneracao": {
   "pv": 20,
   "bloqueia": [
    "fogo",
    "radiante"
   ],
   "naoMorreA0": true
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Respingo Ácido",
     "custo": 1,
     "tipo": "magia",
     "magias": [
      "respingoAcido"
     ]
    },
    {
     "nome": "Ataque",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Açoite Ácido"
    },
    {
     "nome": "Toque Corruptor",
     "custo": 2,
     "tipo": "golpe",
     "arma": "Toque Corruptor",
     "ataque": {
      "name": "Toque Corruptor",
      "bonus": 14,
      "damage": "4d6+7",
      "type": "veneno",
      "reachFt": 10
     }
    }
   ]
  },
  "traits": [
   "aura",
   "resistenciaAMagia",
   "armasMagicas",
   "regeneracaoDoLivro",
   "spiderClimb",
   "acoesLendarias"
  ],
  "blurb": "Massa de lodo demoníaco que açoita com pseudópodes ácidos de longo alcance, envenena quem chega perto e cospe gosma que corrói armaduras e armas de metal. Regenera 20 PV por turno, a menos que sofra dano de fogo ou radiante.",
  "lore": "Conhecido como o Senhor Sem Rosto e a Fome Gotejante, Juiblex é o lorde demônio dos limos e gosmas. Ele não se interessa pelas intrigas dos outros demônios: só quer devorar e converter matéria viva em mais de si mesmo. Aparece como um monte borbulhante de lodo negro e verde, com olhos vermelhos flutuando lá dentro, capaz de se erguer a uns 6 metros de altura. Apenas loucos o cultuam, e os que se entregam viram gosmas vagamente humanoides cujas identidades ele digere aos poucos. Habita os Fossos de Limo, camada pútrida do Abismo que divide com Zuggtmoy."
 },
 "senhorDaColmeiaKruthik": {
  "id": "senhorDaColmeiaKruthik",
  "tipo": "monstruosidade",
  "name": "Senhor da Colmeia Kruthik",
  "nomeOriginal": "Kruthik Hive Lord",
  "fonte": "MTF",
  "size": "grande",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 19,
   "dex": 16,
   "con": 17,
   "int": 10,
   "wis": 14,
   "cha": 10
  },
  "ac": 20,
  "acNote": "armadura natural",
  "maxHp": 102,
  "hpDice": "12d10+36",
  "speedFt": 40,
  "speeds": {
   "climbFt": 40,
   "burrowFt": 20
  },
  "senses": {
   "passivePerception": 12,
   "darkvisionFt": 60,
   "tremorsenseFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Estocada",
    "bonus": 7,
    "damage": "1d10+4",
    "type": "perfurante",
    "reachFt": 10
   },
   {
    "name": "Espinho",
    "bonus": 6,
    "damage": "1d6+4",
    "type": "perfurante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 30,
    "longRangeFt": 120
   }
  ],
  "multiattack": {
   "count": 2,
   "sequencias": [
    [
     "Estocada",
     "Estocada"
    ],
    [
     "Espinho",
     "Espinho"
    ]
   ]
  },
  "breath": {
   "name": "Jato de Ácido",
   "kind": "save",
   "shape": "cone",
   "areaFt": 15,
   "save": "dex",
   "dc": 14,
   "damage": "4d10",
   "damageType": "ácido",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    5,
    6
   ]
  },
  "traits": [
   "keenSmell",
   "packTactics",
   "escavador"
  ],
  "blurb": "Monstro couraçado que golpeia com ferrões a 3 m ou dispara espinhos à distância, e cospe um cone de ácido devastador. Fica ainda mais letal cercado pelos outros kruthiks da colmeia.",
  "lore": "Os kruthiks são predadores reptilianos e insectoides que vivem em colmeias escavadas sob desertos, montanhas e no Subterrâneo. O senhor da colmeia é o maior e mais forte do ninho, e comanda os demais com sons e cheiros. Ele cava túneis pela própria rocha, expandindo o território do enxame. Quando a colmeia é ameaçada, lidera ataques coordenados em que os kruthiks cercam a presa e a dilaceram juntos."
 },
 "leviata": {
  "id": "leviata",
  "tipo": "elemental",
  "name": "Leviatã",
  "nomeOriginal": "Leviathan",
  "fonte": "MTF",
  "size": "imenso",
  "level": 17,
  "cr": "20",
  "xp": 25000,
  "abilities": {
   "str": 30,
   "dex": 24,
   "con": 30,
   "int": 2,
   "wis": 18,
   "cha": 17
  },
  "ac": 17,
  "maxHp": 328,
  "hpDice": "16d20+160",
  "speedFt": 40,
  "speeds": {
   "swimFt": 120
  },
  "senses": {
   "passivePerception": 14,
   "darkvisionFt": 60
  },
  "saves": [
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
   "ácido",
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
   "atordoado"
  ],
  "attacks": [
   {
    "name": "Pancada",
    "bonus": 16,
    "damage": "1d10+10",
    "type": "concussão",
    "reachFt": 20,
    "danoExtra": {
     "damage": "1d10",
     "type": "ácido"
    }
   },
   {
    "name": "Cauda",
    "bonus": 16,
    "damage": "1d12+10",
    "type": "concussão",
    "reachFt": 20,
    "danoExtra": {
     "damage": "1d12",
     "type": "ácido"
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Pancada",
    "Cauda"
   ]
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Pancada",
     "custo": 2,
     "tipo": "golpe",
     "arma": "Pancada"
    },
    {
     "nome": "Mover",
     "custo": 1,
     "tipo": "mover",
     "metade": false,
     "semOportunidade": false
    }
   ]
  },
  "traits": [
   "t_maremoto",
   "t_congelamentoParcial",
   "monstroDeCerco",
   "formaFluida",
   "acoesLendarias"
  ],
  "blurb": "Uma massa colossal de água viva que esmaga com pancadas e cauda carregadas de ácido a 6 m de alcance e, submersa, ergue um tsunami devastador. Frio intenso é sua fraqueza: congelado, fica lento e impreciso.",
  "lore": "O leviatã é um elemental ancestral da água, uma onda gigantesca dotada de vontade própria. Habita mares profundos e litorais, onde pode afundar frotas e arrasar portos inteiros. Sua mente é simples, mas guiada por instinto e força bruta. Costuma surgir quando invocado por poderosos magos ou cultos elementais, ou quando o equilíbrio dos oceanos é perturbado."
 },
 "steederMacho": {
  "id": "steederMacho",
  "tipo": "monstruosidade",
  "name": "Steeder Macho",
  "nomeOriginal": "Male Steeder",
  "fonte": "MTF",
  "size": "médio",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 15,
   "dex": 12,
   "con": 14,
   "int": 2,
   "wis": 10,
   "cha": 3
  },
  "ac": 12,
  "acNote": "armadura natural",
  "maxHp": 13,
  "hpDice": "2d8+4",
  "speedFt": 30,
  "speeds": {
   "climbFt": 30
  },
  "senses": {
   "passivePerception": 14,
   "darkvisionFt": 120
  },
  "saves": [],
  "skills": [
   "furtividade",
   "percepcao"
  ],
  "expertise": [
   "furtividade",
   "percepcao"
  ],
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
    }
   }
  ],
  "traits": [
   "t_pernaPegajosa",
   "spiderClimb",
   "t_saltoExtraordinario"
  ],
  "blurb": "Aranha gigante saltadora que avança aos pulos enormes, morde com veneno e gruda presas pequenas na própria perna.",
  "lore": "Os steeders são aranhas do tamanho de um cavalo que habitam as cavernas profundas da Subterrânea. Os duergar as domesticam e as usam como montaria, aproveitando sua capacidade de escalar paredes e tetos. Os machos são menores e mais fracos que as fêmeas, mas continuam ágeis e furtivos. Na natureza, caçam emboscando presas no escuro com saltos repentinos."
 },
 "marut": {
  "id": "marut",
  "tipo": "constructo",
  "name": "Marut",
  "nomeOriginal": "Marut",
  "fonte": "MTF",
  "size": "grande",
  "level": 25,
  "cr": "25",
  "xp": 75000,
  "abilities": {
   "str": 28,
   "dex": 12,
   "con": 26,
   "int": 19,
   "wis": 15,
   "cha": 18
  },
  "ac": 22,
  "acNote": "armadura natural",
  "maxHp": 432,
  "hpDice": "32d10+256",
  "speedFt": 40,
  "flyFt": 30,
  "hover": true,
  "speeds": {
   "flyFt": 30
  },
  "senses": {
   "passivePerception": 20,
   "darkvisionFt": 60
  },
  "saves": [
   "int",
   "wis",
   "cha"
  ],
  "skills": [
   "intuicao",
   "intimidacao",
   "percepcao"
  ],
  "expertise": [],
  "damageResistances": [
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
   "enfeitiçado",
   "amedrontado",
   "paralisado",
   "envenenado",
   "inconsciente"
  ],
  "attacks": [
   {
    "name": "Pancada Infalível",
    "bonus": 0,
    "damage": 60,
    "type": "energético",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Pancada Infalível",
    "Pancada Infalível"
   ]
  },
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "viagemPlanar"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "aVontade": [
    "viagemPlanar"
   ],
   "cdPorMagia": {
    "viagemPlanar": 20
   }
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "acoesEspeciais": [
   {
    "nome": "Édito Flamejante",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cube",
    "areaFt": 60,
    "save": "wis",
    "dc": 20,
    "condition": "atordoado",
    "rounds": 1,
    "repete": false,
    "ateFimDoTurnoDele": true
   },
   {
    "nome": "Justificar",
    "tipo": "alvo",
    "alcanceFt": 60,
    "alvos": 2,
    "save": "cha",
    "dc": 20,
    "condition": "incapacitado",
    "rounds": 10,
    "repete": false
   }
  ],
  "traits": [
   "formaImutavel",
   "resistenciaAMagia"
  ],
  "blurb": "Um executor colossal cujas pancadas nunca erram e causam 60 de dano energético cada, capaz de atordoar grupos inteiros com uma explosão radiante. Também pode arrastar até dois alvos direto para Sigil, tirando-os da luta.",
  "lore": "O marut é um inevitável, construto criado por Primus, o líder dos modrons, para garantir que acordos entre seres dos planos sejam cumpridos. Contratos firmados no Salão da Concordância, em Sigil, são gravados numa placa de ouro e inseridos no peito do marut, que passa a vigiar as partes até o fim do acordo. Ele segue apenas o que está escrito, sem se importar com intenções, e só mata quando o contrato exige, quando é totalmente rompido ou quando é atacado. Não precisa respirar, comer, beber nem dormir."
 },
 "maurezhi": {
  "id": "maurezhi",
  "tipo": "corruptor",
  "name": "Maurezhi",
  "nomeOriginal": "Maurezhi",
  "fonte": "MTF",
  "size": "médio",
  "level": 5,
  "cr": "7",
  "xp": 2900,
  "abilities": {
   "str": 14,
   "dex": 17,
   "con": 12,
   "int": 11,
   "wis": 12,
   "cha": 15
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 88,
  "hpDice": "16d8+16",
  "speedFt": 30,
  "senses": {
   "passivePerception": 11,
   "darkvisionFt": 120
  },
  "saves": [],
  "skills": [
   "enganacao"
  ],
  "expertise": [],
  "damageResistances": [
   "frio",
   "fogo",
   "elétrico",
   "necrótico",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
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
    "bonus": 6,
    "damage": "2d10+3",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Garras",
    "bonus": 6,
    "damage": "2d8+3",
    "type": "cortante",
    "reachFt": 5,
    "onHit": {
     "save": "con",
     "dc": 12,
     "condition": "paralisado",
     "rounds": 10,
     "repete": true
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
   "t_erguerCarnical",
   "t_assumirForma",
   "resistenciaAMagia"
  ],
  "blurb": "Combina mordida e garras: as garras podem paralisar e a mordida drena o Carisma de humanoides, que se erguem como carniçais se chegarem a zero. Ainda consegue devolver à vida carniçais e lívidos abatidos por perto.",
  "lore": "Os maurezhi surgiram quando Doresain, o Rei dos Carniçais, corrompeu um povo élfico e moldou com ele uma nova linhagem de demônios. Sua função no mundo material é comandar bandos de carniçais e lívidos. Depois de devorar o cadáver de uma vítima humanoide, o demônio passa a ter a aparência dela, um disfarce que apodrece aos poucos ao longo de alguns dias. Funcionam como portadores de uma praga: quem é mordido perde a própria identidade até ser tomado por uma fome profana e virar carniçal."
 },
 "meazel": {
  "id": "meazel",
  "tipo": "humanoide",
  "name": "Meazel",
  "nomeOriginal": "Meazel",
  "fonte": "MTF",
  "size": "médio",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 8,
   "dex": 17,
   "con": 9,
   "int": 14,
   "wis": 13,
   "cha": 10
  },
  "ac": 13,
  "maxHp": 35,
  "hpDice": "10d8-10",
  "speedFt": 30,
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
    "name": "Garrote",
    "bonus": 5,
    "damage": "1d6+3",
    "type": "concussão",
    "reachFt": 5,
    "danoExtra": {
     "damage": "2d6+3",
     "type": "concussão"
    }
   },
   {
    "name": "Espada Curta",
    "bonus": 5,
    "damage": "1d6+3",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d6",
     "type": "necrótico"
    }
   }
  ],
  "acoesEspeciais": [
   {
    "nome": "Teleporte Sombrio",
    "recharge": [
     5,
     6
    ],
    "tipo": "teleporte",
    "alcanceFt": 500
   }
  ],
  "traits": [
   "furtividadeNasSombras"
  ],
  "blurb": "Embosca das sombras, estrangula a vítima com um garrote e a arrasta por teleporte sombrio para lugares isolados. Quem é levado fica marcado e não consegue se esconder de mortos-vivos e criaturas do Pendor das Sombras.",
  "lore": "Meazels já foram pessoas comuns que fugiram para o Pendor das Sombras querendo abandonar a vida mortal. A escuridão os deformou, e o rancor os tornou cruéis e solitários. Rondam os pontos onde aquele plano encosta no Material, atacando viajantes que chegam perto de seus covis. Gostam de capturar vítimas pelas sombras e largá-las em lugares remotos, onde horrores atraídos pela maldição terminam o serviço."
 },
 "merregon": {
  "id": "merregon",
  "tipo": "corruptor",
  "name": "Merregon",
  "nomeOriginal": "Merregon",
  "fonte": "MTF",
  "size": "médio",
  "level": 1,
  "cr": "4",
  "xp": 1100,
  "abilities": {
   "str": 18,
   "dex": 14,
   "con": 17,
   "int": 6,
   "wis": 12,
   "cha": 8
  },
  "ac": 16,
  "acNote": "armadura natural",
  "maxHp": 45,
  "hpDice": "6d8+18",
  "speedFt": 30,
  "senses": {
   "passivePerception": 11,
   "darkvisionFt": 60
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
   "amedrontado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Alabarda",
    "bonus": 6,
    "damage": "1d10+4",
    "type": "cortante",
    "reachFt": 10
   },
   {
    "name": "Besta Pesada",
    "bonus": 4,
    "damage": "1d10+2",
    "type": "perfurante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 100,
    "longRangeFt": 400
   }
  ],
  "multiattack": {
   "count": 5,
   "sequence": [
    "Alabarda",
    "Alabarda",
    "Alabarda",
    "Alabarda",
    "Alabarda"
   ]
  },
  "features": [
   "devilsSight"
  ],
  "traits": [
   "resistenciaAMagia",
   "t_guardaCostasLeal"
  ],
  "blurb": "Soldado infernal de alabarda com alcance de 3 m que ataca três vezes quando um demônio aliado poderoso está por perto. Protege outros diabos recebendo os golpes no lugar deles.",
  "lore": "Merregons são as almas de soldados, mercenários e guarda-costas que serviram ao mal sem hesitar e acabaram presos para sempre nos Nove Infernos. Formam a infantaria das legiões infernais, guardando os planos e seus senhores contra invasores. Não têm rosto: uma máscara de metal parafusada na cabeça mostra apenas a quem obedecem e em qual camada servem. Não falam e só se comunicam por telepatia com um ser de cada vez, por isso ficam desorientados quando seus comandantes caem. Leais até o fim, nunca recuam a menos que recebam ordem para isso."
 },
 "merrenoloth": {
  "id": "merrenoloth",
  "tipo": "corruptor",
  "name": "Merrenoloth",
  "nomeOriginal": "Merrenoloth",
  "fonte": "MTF",
  "size": "médio",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 8,
   "dex": 17,
   "con": 10,
   "int": 17,
   "wis": 14,
   "cha": 11
  },
  "ac": 13,
  "maxHp": 40,
  "hpDice": "9d8",
  "speedFt": 30,
  "speeds": {
   "swimFt": 40
  },
  "senses": {
   "passivePerception": 14,
   "blindsightFt": 60,
   "darkvisionFt": 60
  },
  "saves": [
   "dex",
   "int"
  ],
  "skills": [
   "historia",
   "natureza",
   "percepcao",
   "sobrevivencia"
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
    "name": "Remo",
    "bonus": 5,
    "damage": "2d4+3",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 1,
   "sequence": [
    "Remo"
   ]
  },
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "enfeiticarPessoa",
    "escuridao",
    "detectarMagia",
    "dissiparMagia",
    "lufadaDeVento"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "aVontade": [
    "enfeiticarPessoa",
    "escuridao",
    "detectarMagia",
    "dissiparMagia",
    "lufadaDeVento"
   ],
   "cdPorMagia": {
    "enfeiticarPessoa": 13,
    "escuridao": 13,
    "detectarMagia": 13,
    "dissiparMagia": 13,
    "lufadaDeVento": 13
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Olhar Aterrorizante",
    "tipo": "alvo",
    "alcanceFt": 60,
    "save": "wis",
    "dc": 13,
    "condition": "amedrontado",
    "rounds": 10,
    "repete": true
   },
   {
    "nome": "Teletransporte",
    "tipo": "teleporte",
    "alcanceFt": 60,
    "bonus": true
   }
  ],
  "traits": [
   "resistenciaAMagia",
   "armasMagicas",
   "t_teletransporte"
  ],
  "blurb": "Barqueiro yugoloth que se teletransporta pelo campo, amedronta alvos com o olhar e golpeia com seu remo; resiste bem à magia e domina água e clima com feitiços.",
  "lore": "Os merrenoloths são yugoloths que conduzem barcaças pelo Rio Estige, transportando passageiros e cargas entre os planos inferiores. Mercenários frios, servem a quem paga melhor e cumprem contratos sem questionar. Conhecem profundamente as correntes e os ventos, e são capazes de dobrar o tempo e as águas à sua vontade. Às vezes aparecem em costas do plano material, guiando navios de intenções sombrias."
 },
 "moloch": {
  "id": "moloch",
  "tipo": "corruptor",
  "name": "Moloch",
  "nomeOriginal": "Moloch",
  "fonte": "MTF",
  "size": "grande",
  "level": 21,
  "cr": "21",
  "xp": 33000,
  "abilities": {
   "str": 26,
   "dex": 19,
   "con": 22,
   "int": 21,
   "wis": 18,
   "cha": 23
  },
  "ac": 19,
  "acNote": "armadura natural",
  "maxHp": 253,
  "hpDice": "22d10+132",
  "speedFt": 30,
  "senses": {
   "passivePerception": 21,
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
   "intimidacao",
   "percepcao"
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
   "enfeitiçado",
   "exausto",
   "amedrontado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 15,
    "damage": "4d8+8",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Garra",
    "bonus": 15,
    "damage": "2d8+8",
    "type": "cortante",
    "reachFt": 10
   },
   {
    "name": "Chicote de Muitas Caudas",
    "bonus": 15,
    "damage": "2d4+8",
    "type": "cortante",
    "reachFt": 30,
    "onHit": {
     "save": "str",
     "dc": 24,
     "danoSeFalhar": {
      "damage": "2d10",
      "type": "elétrico"
     },
     "metadeSePassar": false
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mordida",
    "Garra",
    "Chicote de Muitas Caudas"
   ]
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "golpeDeChama",
    "alterarAparencia",
    "animarMortos",
    "maosFlamejantes",
    "confusao",
    "detectarMagia",
    "voo",
    "missao",
    "imagemMaior",
    "nuvemFetida",
    "sugestao",
    "muralhaDeFogo"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "golpeDeChama": 1
   },
   "aVontade": [
    "alterarAparencia",
    "animarMortos",
    "maosFlamejantes",
    "confusao",
    "detectarMagia",
    "voo",
    "missao",
    "imagemMaior",
    "nuvemFetida",
    "sugestao",
    "muralhaDeFogo"
   ],
   "cdPorMagia": {
    "golpeDeChama": 21,
    "alterarAparencia": 21,
    "animarMortos": 21,
    "maosFlamejantes": 21,
    "confusao": 21,
    "detectarMagia": 21,
    "voo": 21,
    "missao": 21,
    "imagemMaior": 21,
    "nuvemFetida": 21,
    "sugestao": 21,
    "muralhaDeFogo": 21
   }
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "acoesEspeciais": [
   {
    "nome": "Sopro do Desespero",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cube",
    "areaFt": 30,
    "save": "wis",
    "dc": 21,
    "damage": "5d10",
    "damageType": "psíquico",
    "halfOnSave": false,
    "condition": "amedrontado",
    "rounds": 10,
    "repete": true
   },
   {
    "nome": "Teletransporte",
    "tipo": "teleporte",
    "alcanceFt": 120
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
     "nome": "Névoa Fétida",
     "custo": 1,
     "tipo": "magia",
     "magias": [
      "nuvemFetida"
     ]
    },
    {
     "nome": "Teletransporte",
     "custo": 1,
     "tipo": "teleporte",
     "alcanceFt": 120
    },
    {
     "nome": "Chicote",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Chicote de Muitas Caudas"
    }
   ]
  },
  "traits": [
   "resistenciaAMagia",
   "armasMagicas",
   "regeneracaoDoLivro",
   "acoesLendarias"
  ],
  "blurb": "Arquidiabo brutal que puxa vítimas de longe com seu chicote de muitas caudas e as despedaça com mordida e garras. Seu Sopro do Desespero faz grupos inteiros largarem as armas e fugirem, e ele se regenera a cada turno, a menos que sofra dano radiante.",
  "lore": "Moloch já governou Malbolge, a sexta camada dos Nove Infernos, como recompensa por expulsar demônios de lá, mas conspirou contra Asmodeus sob a influência da bruxa da noite Malagard e acabou deposto e condenado. Fugiu por um portal planar e viu seu exército de retorno ser aniquilado enquanto estava preso em outro mundo. Hoje, sempre que entra nos Infernos, é reduzido à forma de um diabrete, por isso vaga pelos planos, sobretudo por Sigil, negociando com yugoloths e mortais em busca de riquezas e poder para retomar o trono. Seus cultistas quase todos o abandonaram, mas ídolos de olhos de joias em masmorras profundas ainda atraem monstros e aventureiros imprudentes."
 },
 "molydeus": {
  "id": "molydeus",
  "tipo": "corruptor",
  "name": "Molydeus",
  "nomeOriginal": "Molydeus",
  "fonte": "MTF",
  "size": "enorme",
  "level": 21,
  "cr": "21",
  "xp": 33000,
  "abilities": {
   "str": 28,
   "dex": 22,
   "con": 25,
   "int": 21,
   "wis": 24,
   "cha": 24
  },
  "ac": 19,
  "acNote": "armadura natural",
  "maxHp": 216,
  "hpDice": "16d12+112",
  "speedFt": 40,
  "senses": {
   "passivePerception": 31,
   "truesightFt": 120
  },
  "saves": [
   "str",
   "con",
   "wis",
   "cha"
  ],
  "skills": [
   "percepcao"
  ],
  "expertise": [
   "percepcao"
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
   "cego",
   "enfeitiçado",
   "surdo",
   "amedrontado",
   "envenenado",
   "atordoado"
  ],
  "attacks": [
   {
    "name": "Arma Demoníaca",
    "bonus": 16,
    "damage": "2d10+9",
    "type": "cortante",
    "reachFt": 15
   },
   {
    "name": "Mordida de Lobo",
    "bonus": 16,
    "damage": "2d6+9",
    "type": "perfurante",
    "reachFt": 10
   },
   {
    "name": "Mordida de Serpente",
    "bonus": 16,
    "damage": "1d6+9",
    "type": "perfurante",
    "reachFt": 15
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Arma Demoníaca",
    "Mordida de Lobo",
    "Mordida de Serpente"
   ]
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "relampago",
    "dissiparMagia",
    "metamorfose",
    "telecinesia",
    "teletransporte"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "relampago": 3
   },
   "aVontade": [
    "dissiparMagia",
    "metamorfose",
    "telecinesia",
    "teletransporte"
   ],
   "cdPorMagia": {
    "relampago": 22,
    "dissiparMagia": 22,
    "metamorfose": 22,
    "telecinesia": 22,
    "teletransporte": 22
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
     "arma": "Arma Demoníaca"
    }
   ]
  },
  "traits": [
   "resistenciaAMagia",
   "armasMagicas",
   "acoesLendarias"
  ],
  "blurb": "Demônio gigante de duas cabeças que ataca com arma demoníaca, mordida de lobo e mordida de serpente; a serpente drena o máximo de PV e pode transformar a vítima em mane, e um crítico da arma pode decapitar. Ainda conjura aprisionamento, metamorfose e relâmpago.",
  "lore": "O molydeus é o executor pessoal de um lorde demônio, temido até mais que o balor. Tem uns 3,6 m de altura, corpo vermelho humanoide, uma cabeça de lobo e outra de serpente num pescoço longo, pela qual seu mestre fala e o vigia a qualquer momento, o que o torna incapaz de traição. Nasce de um demônio que se destacou e foi recriado à força de torturas. Guarda os tesouros do mestre, sobretudo o amuleto que lhe permite renascer no Abismo, e porta uma arma feita da própria essência, cujo formato reflete o lorde que serve."
 },
 "nabassu": {
  "id": "nabassu",
  "tipo": "corruptor",
  "name": "Nabassu",
  "nomeOriginal": "Nabassu",
  "fonte": "MTF",
  "size": "médio",
  "level": 13,
  "cr": "15",
  "xp": 13000,
  "abilities": {
   "str": 22,
   "dex": 14,
   "con": 21,
   "int": 14,
   "wis": 15,
   "cha": 17
  },
  "ac": 18,
  "acNote": "armadura natural",
  "maxHp": 190,
  "hpDice": "20d8+100",
  "speedFt": 40,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60
  },
  "senses": {
   "passivePerception": 17,
   "darkvisionFt": 60
  },
  "saves": [
   "str",
   "dex"
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
    "name": "Garras",
    "bonus": 11,
    "damage": "2d10+6",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Mordida",
    "bonus": 11,
    "damage": "4d12+6",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Garras",
    "Mordida"
   ]
  },
  "traits": [
   "t_olharRoubaAlma",
   "t_sombrasDemoniacas",
   "t_devorarAlma",
   "resistenciaAMagia",
   "armasMagicas"
  ],
  "blurb": "Demônio voador que combina garras e uma mordida brutal com um olhar que arranca pedaços da alma, reduzindo o máximo de PV da vítima. Humanoides mortos pelo olhar voltam como carniçais sob seu comando.",
  "lore": "Os nabassus vagam pelos planos famintos por almas e atacam qualquer um que pareçam capazes de matar, inclusive outros demônios. Por devorarem almas, são desprezados até pelos próprios demônios e empurrados para as margens do Abismo, onde caçam sozinhos ou em bandos. Adoram ser invocados ao Plano Material, pois lá encontram um banquete de almas. Quem os conjura costuma virar a primeira refeição, a menos que mantenha o demônio bem alimentado."
 },
 "nagpa": {
  "id": "nagpa",
  "tipo": "humanoide",
  "name": "Nagpa",
  "nomeOriginal": "Nagpa",
  "fonte": "MTF",
  "size": "médio",
  "level": 17,
  "cr": "17",
  "xp": 18000,
  "abilities": {
   "str": 9,
   "dex": 15,
   "con": 12,
   "int": 23,
   "wis": 18,
   "cha": 21
  },
  "ac": 19,
  "acNote": "armadura natural",
  "maxHp": 187,
  "hpDice": "34d8+34",
  "speedFt": 30,
  "senses": {
   "passivePerception": 20,
   "truesightFt": 120
  },
  "saves": [
   "int",
   "wis",
   "cha"
  ],
  "skills": [
   "arcanismo",
   "enganacao",
   "historia",
   "intuicao",
   "percepcao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Cajado",
    "bonus": 8,
    "damage": "2d6+2",
    "type": "concussão",
    "reachFt": 5
   }
  ],
  "spellcasting": {
   "ability": "int",
   "cantrips": [
    "toqueArrepiante",
    "raioDeFogo",
    "maoMagica",
    "mensagem",
    "ilusaoMenor"
   ],
   "prepared": [
    "enfeiticarPessoa",
    "detectarMagia",
    "protecaoBemMal",
    "raioDeBruxa",
    "imobilizarPessoa",
    "raioDoEnfraquecimento",
    "sugestao",
    "contramagia",
    "bolaDeFogo",
    "voo",
    "confusao",
    "muralhaDeFogo",
    "dominarPessoa",
    "missao",
    "circuloDaMorte",
    "desintegrar",
    "sprayPrismatico",
    "enfraquecerOIntelecto"
   ],
   "slots": [
    0,
    4,
    3,
    3,
    3,
    2,
    1,
    1,
    1
   ],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "cdPorMagia": {
    "toqueArrepiante": 20,
    "raioDeFogo": 20,
    "maoMagica": 20,
    "mensagem": 20,
    "ilusaoMenor": 20,
    "enfeiticarPessoa": 20,
    "detectarMagia": 20,
    "protecaoBemMal": 20,
    "raioDeBruxa": 20,
    "imobilizarPessoa": 20,
    "raioDoEnfraquecimento": 20,
    "sugestao": 20,
    "contramagia": 20,
    "bolaDeFogo": 20,
    "voo": 20,
    "confusao": 20,
    "muralhaDeFogo": 20,
    "dominarPessoa": 20,
    "missao": 20,
    "circuloDaMorte": 20,
    "desintegrar": 20,
    "sprayPrismatico": 20,
    "enfraquecerOIntelecto": 20
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Corrupção",
    "tipo": "alvo",
    "alcanceFt": 90,
    "save": "cha",
    "dc": 20,
    "condition": "enfeiticado",
    "rounds": 1,
    "repete": false,
    "ateFimDoTurnoDele": true,
    "bonus": true
   },
   {
    "nome": "Paralisia (Recarga 6)",
    "recharge": [
     6
    ],
    "tipo": "area",
    "shape": "raio",
    "areaFt": 30,
    "save": "wis",
    "dc": 20,
    "condition": "paralisado",
    "rounds": 10,
    "repete": true,
    "bonus": true
   }
  ],
  "traits": [
   "t_corrupcao",
   "t_paralisiaRecarga6"
  ],
  "blurb": "Mago ancestral que prefere lutar à distância com magias devastadoras, como desintegrar e rajada prismática. Com ações bônus, enfeitiça um alvo ou paralisa todos ao redor, abrindo caminho para golpes finais.",
  "lore": "Os nagpas eram treze magos poderosos que a Rainha Corvo amaldiçoou por sabotarem um ritual capaz de evitar uma guerra divina, transformando-os em criaturas sarnentas com aparência de aves. A maldição os impede de obter saber e poder de qualquer fonte que não sejam as ruínas de civilizações caídas e grandes catástrofes. Por isso tramam colapsos de cidades e reinos, manipulando outras criaturas em vários planos simultâneos e com enorme paciência. Só saem das sombras para dar o golpe final e saquear bibliotecas e cofres dos escombros. Temem a Rainha Corvo acima de tudo e se tornam bajuladores servis quando não conseguem fugir de seus agentes."
 },
 "narzugon": {
  "id": "narzugon",
  "tipo": "corruptor",
  "name": "Narzugon",
  "nomeOriginal": "Narzugon",
  "fonte": "MTF",
  "size": "médio",
  "level": 13,
  "cr": "13",
  "xp": 10000,
  "abilities": {
   "str": 20,
   "dex": 10,
   "con": 17,
   "int": 16,
   "wis": 14,
   "cha": 19
  },
  "ac": 20,
  "acNote": "armadura de placas e escudo",
  "maxHp": 112,
  "hpDice": "15d8+45",
  "speedFt": 30,
  "senses": {
   "passivePerception": 17,
   "darkvisionFt": 120
  },
  "saves": [
   "dex",
   "con",
   "cha"
  ],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "damageResistances": [
   "ácido",
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
   "enfeitiçado",
   "amedrontado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Lança de Fogo Infernal",
    "bonus": 10,
    "damage": "1d12+5",
    "type": "perfurante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "3d10",
     "type": "fogo"
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Lança de Fogo Infernal",
    "Lança de Fogo Infernal",
    "Lança de Fogo Infernal"
   ]
  },
  "acoesEspeciais": [
   {
    "nome": "Comando Aterrorizante",
    "tipo": "area",
    "shape": "raio",
    "areaFt": 60,
    "save": "cha",
    "dc": 17,
    "condition": "amedrontado",
    "rounds": 10,
    "repete": true,
    "imunizaAoPassar": true
   }
  ],
  "traits": [
   "t_comandoInfernal",
   "t_cura",
   "t_sentidoDiabolico",
   "t_arreiosInfernais",
   "resistenciaAMagia"
  ],
  "blurb": "Cavaleiro infernal que ataca três vezes por turno com uma lança de fogo infernal de 3 m de alcance, enquanto aterroriza os inimigos ou fortalece os aliados. Quem morre pela lança tem a alma arrastada para os Nove Infernos como lêmure.",
  "lore": "Narzugons são as almas de paladinos que firmaram pactos com diabos e mantiveram, após a morte, um código de honra corrompido. Os arquiduques dos Nove Infernos os valorizam como campeões obedientes para comandar suas legiões. Montados em pesadelos presos por arreios infernais, percorrem os planos cumprindo as ordens de seus senhores. Cada um carrega uma lança única, forjada em fogo infernal e marcada com o símbolo do cavaleiro e de seu mestre."
 },
 "andarilhoNoturno": {
  "id": "andarilhoNoturno",
  "tipo": "morto-vivo",
  "name": "Andarilho Noturno",
  "nomeOriginal": "Nightwalker",
  "fonte": "MTF",
  "size": "enorme",
  "level": 17,
  "cr": "20",
  "xp": 25000,
  "abilities": {
   "str": 22,
   "dex": 19,
   "con": 24,
   "int": 6,
   "wis": 9,
   "cha": 8
  },
  "ac": 14,
  "maxHp": 297,
  "hpDice": "22d12+154",
  "speedFt": 40,
  "flyFt": 40,
  "speeds": {
   "flyFt": 40
  },
  "senses": {
   "passivePerception": 9,
   "darkvisionFt": 120
  },
  "saves": [
   "con"
  ],
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
    "name": "Foco Debilitante",
    "bonus": 12,
    "damage": "5d8+6",
    "type": "necrótico",
    "reachFt": 15
   }
  ],
  "multiattack": {
   "count": 2
  },
  "acoesEspeciais": [
   {
    "nome": "Dedo da Perdição",
    "recharge": [
     6
    ],
    "tipo": "alvo",
    "alcanceFt": 300,
    "save": "wis",
    "dc": 21,
    "damage": "4d12",
    "damageType": "necrótico",
    "halfOnSave": false,
    "condition": "amedrontado",
    "rounds": 1,
    "repete": false,
    "ateFimDoTurnoDele": true,
    "imunizaAoPassar": true
   }
  ],
  "aura": {
   "raioFt": 30,
   "quando": "inicioDoAlvo",
   "save": "con",
   "dc": 21,
   "damage": "4d6",
   "damageType": "necrótico",
   "imunizaAoPassar": true
  },
  "traits": [
   "aura",
   "t_devoradorDeVida"
  ],
  "blurb": "Colosso morto-vivo cercado por uma aura que drena a vida de quem estiver a até 9 m, golpeando com alcance de 4,5 m e reduzindo o PV máximo das vítimas. Quem cai diante dele morre de vez, e seu dedo da perdição pode paralisar de medo um alvo a quase 100 m.",
  "lore": "Andarilhos noturnos são mortos-vivos gigantescos que surgem do Plano Negativo, um reino de escuridão absoluta e hostil a toda forma de vida. Sempre que alguém consegue penetrar nesse plano e sobreviver, fica preso lá dentro, e um andarilho é libertado no mundo em seu lugar. Para o prisioneiro escapar, a criatura precisa ser atraída de volta com oferendas de vida; se ela for destruída, não há mais saída. Costumam rondar lugares ligados a quem os libertou, mas não servem a ninguém: existem apenas para extinguir os vivos. Não precisam respirar, comer, beber nem dormir."
 },
 "nupperibo": {
  "id": "nupperibo",
  "tipo": "corruptor",
  "name": "Nupperibo",
  "nomeOriginal": "Nupperibo",
  "fonte": "MTF",
  "size": "médio",
  "level": 1,
  "cr": "1/2",
  "xp": 100,
  "abilities": {
   "str": 16,
   "dex": 11,
   "con": 13,
   "int": 3,
   "wis": 8,
   "cha": 1
  },
  "ac": 13,
  "acNote": "armadura natural",
  "maxHp": 11,
  "hpDice": "2d8+2",
  "speedFt": 20,
  "senses": {
   "passivePerception": 11,
   "blindsightFt": 10
  },
  "saves": [],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "damageResistances": [
   "ácido",
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
   "cego",
   "enfeitiçado",
   "amedrontado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 5,
    "damage": "1d6+3",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "aura": {
   "raioFt": 20,
   "quando": "inicioDoAlvo",
   "save": "con",
   "dc": 11,
   "damage": "1d4",
   "damageType": "perfurante"
  },
  "traits": [
   "aura",
   "t_movidoPelaFome"
  ],
  "blurb": "Lento e cego, avança mordendo enquanto uma nuvem de insetos fere quem estiver por perto; em bando, essas nuvens se sobrepõem e ficam bem mais difíceis de resistir.",
  "lore": "Nupperibos são as almas mais desprezíveis dos Nove Infernos, gente cuja maldade em vida nasceu da preguiça e do descaso. Cegos e inchados de fome, vagam sem rumo pelas paisagens infernais engolindo restos podres e bichos. Sozinhos são patéticos, mas andam em multidões capazes de bloquear vales inteiros, envoltos em enxames de insetos e parasitas. Quando sentem uma presa, perseguem-na sem descanso, e obedecem cegamente a ordens telepáticas de outros diabos."
 },
 "besteiroDeCarvalho": {
  "id": "besteiroDeCarvalho",
  "tipo": "constructo",
  "name": "Besteiro de Carvalho",
  "nomeOriginal": "Oaken Bolter",
  "fonte": "MTF",
  "size": "médio",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 12,
   "dex": 18,
   "con": 15,
   "int": 3,
   "wis": 10,
   "cha": 1
  },
  "ac": 16,
  "acNote": "armadura natural",
  "maxHp": 58,
  "hpDice": "9d8+18",
  "speedFt": 30,
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
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
   "petrificado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Virote Perfurante",
    "bonus": 7,
    "damage": "2d10+4",
    "type": "perfurante",
    "reachFt": 5,
    "rangeFt": 100,
    "longRangeFt": 400
   },
   {
    "name": "Arpão",
    "bonus": 7,
    "damage": "1d10+4",
    "type": "perfurante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 50,
    "longRangeFt": 200,
    "danoExtra": {
     "damage": "1d10",
     "type": "cortante"
    },
    "onHit": {
     "semResistencia": true,
     "dc": 12,
     "escape": 12,
     "condition": "agarrado",
     "note": "é agarrado"
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequencias": [
    [
     "Virote Perfurante",
     "Virote Perfurante"
    ],
    [
     "Virote Perfurante",
     "Arpão"
    ]
   ]
  },
  "traits": [
   "t_viroteExplosivo",
   "resistenciaAMagia"
  ],
  "blurb": "Constructo de artilharia que dispara virotes pesados de longe, arpoa alvos para puxá-los até si e lança cargas explosivas que queimam grupos inteiros.",
  "lore": "O besteiro de carvalho é uma máquina de guerra mecânica, feita de madeira reforçada e engrenagens, criada por inventores gnomos para proteger seus domínios. Funciona como uma torre de vigia ambulante, atacando invasores a grande distância. Não tem vontade própria e obedece às ordens de quem o construiu, compreendendo a língua do criador sem conseguir falar. Costuma ser posicionado em florestas, colinas e passagens montanhosas, onde tem boa linha de tiro."
 },
 "criaDeOblex": {
  "id": "criaDeOblex",
  "tipo": "gosma",
  "name": "Cria de Oblex",
  "nomeOriginal": "Oblex Spawn",
  "fonte": "MTF",
  "size": "miúdo",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 8,
   "dex": 16,
   "con": 15,
   "int": 14,
   "wis": 11,
   "cha": 10
  },
  "ac": 13,
  "maxHp": 18,
  "hpDice": "4d4+8",
  "speedFt": 20,
  "senses": {
   "passivePerception": 12,
   "blindsightFt": 60
  },
  "saves": [
   "int",
   "cha"
  ],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [
   "cego",
   "enfeitiçado",
   "surdo",
   "exausto",
   "caido"
  ],
  "attacks": [
   {
    "name": "Pseudópode",
    "bonus": 5,
    "damage": "1d4+3",
    "type": "concussão",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d4",
     "type": "psíquico"
    }
   }
  ],
  "traits": [
   "amorfo",
   "aversaoAoFogo"
  ],
  "blurb": "Pequena gosma que se esgueira por frestas mínimas e golpeia com um pseudópode que machuca o corpo e a mente. Fogo a deixa atrapalhada por um turno.",
  "lore": "A cria de oblex é um fragmento recém-separado de um oblex maior, uma gosma que se alimenta de memórias e pensamentos. Ainda jovem, não consegue imitar pessoas como seus pais, mas já carrega astúcia e malícia. Esconde-se em esgotos, pântanos e túneis do Subterrâneo, deslizando por rachaduras para emboscar vítimas. Costuma agir como batedora ou isca a serviço do oblex que a gerou."
 },
 "ogroAriete": {
  "id": "ogroAriete",
  "tipo": "gigante",
  "name": "Ogro Aríete",
  "nomeOriginal": "Ogre Battering Ram",
  "fonte": "MTF",
  "size": "grande",
  "level": 1,
  "cr": "4",
  "xp": 1100,
  "abilities": {
   "str": 19,
   "dex": 8,
   "con": 16,
   "int": 5,
   "wis": 7,
   "cha": 7
  },
  "ac": 14,
  "acNote": "cota de anéis",
  "maxHp": 59,
  "hpDice": "7d10+21",
  "speedFt": 40,
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
    "name": "Pancada",
    "bonus": 6,
    "damage": "2d10+4",
    "type": "concussão",
    "reachFt": 5
   }
  ],
  "traits": [
   "t_bloquearOCaminho",
   "monstroDeCerco"
  ],
  "blurb": "Brutamontes que derruba portões e empurra inimigos com golpes pesados. Quando decide bloquear a passagem, fica difícil de acertar e pune duramente quem tenta escapar dele.",
  "lore": "Ogros aríetes são gigantes brutos treinados por chefes de guerra para arrebentar portas, muralhas e linhas de defesa. Carregam troncos reforçados ou escudos enormes e avançam na frente da horda. Vivem em colinas, montanhas e campos abertos, servindo a quem lhes der comida e destruição. Pouco espertos, compensam com teimosia e força bruta."
 },
 "ogroLancadorDeVirotes": {
  "id": "ogroLancadorDeVirotes",
  "tipo": "gigante",
  "name": "Ogro Lançador de Virotes",
  "nomeOriginal": "Ogre Bolt Launcher",
  "fonte": "MTF",
  "size": "grande",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 19,
   "dex": 12,
   "con": 16,
   "int": 5,
   "wis": 7,
   "cha": 7
  },
  "ac": 13,
  "acNote": "armadura de couro cru",
  "maxHp": 59,
  "hpDice": "7d10+21",
  "speedFt": 40,
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
    "name": "Punho",
    "bonus": 6,
    "damage": "2d4+4",
    "type": "concussão",
    "reachFt": 5
   },
   {
    "name": "Lançador de Virotes",
    "bonus": 3,
    "damage": "3d10+1",
    "type": "perfurante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 120,
    "longRangeFt": 480
   }
  ],
  "traits": [],
  "blurb": "Fica à distância disparando virotes enormes que causam dano perfurante pesado, apesar da mira ruim; de perto, recorre aos punhos.",
  "lore": "Este ogro carrega uma besta gigantesca, construída para o seu tamanho, capaz de arremessar virotes do comprimento de uma lança. Costuma servir de artilharia em bandos de ogros ou junto de gigantes que o mantêm por perto. Embora seja estúpido e pouco preciso, cada disparo que acerta pode derrubar um aventureiro. Ronda colinas, montanhas e campos abertos, onde tem linha de tiro livre."
 },
 "ogroBrutamontesDeCorrente": {
  "id": "ogroBrutamontesDeCorrente",
  "tipo": "gigante",
  "name": "Ogro Brutamontes de Corrente",
  "nomeOriginal": "Ogre Chain Brute",
  "fonte": "MTF",
  "size": "grande",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 19,
   "dex": 8,
   "con": 16,
   "int": 5,
   "wis": 7,
   "cha": 7
  },
  "ac": 11,
  "acNote": "armadura de couro cru",
  "maxHp": 59,
  "hpDice": "7d10+21",
  "speedFt": 40,
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
    "name": "Soco",
    "bonus": 6,
    "damage": "2d4+4",
    "type": "concussão",
    "reachFt": 5
   },
   {
    "name": "Pancada da Corrente",
    "bonus": 6,
    "damage": "2d8+4",
    "type": "concussão",
    "reachFt": 10,
    "onHit": {
     "save": "con",
     "dc": 14,
     "condition": "inconsciente",
     "rounds": 10,
     "repete": false
    },
    "recharge": [
     6
    ]
   }
  ],
  "acoesEspeciais": [
   {
    "nome": "Varredura da Corrente",
    "tipo": "area",
    "shape": "raio",
    "areaFt": 10,
    "save": "dex",
    "dc": 14,
    "damage": "1d8+4",
    "damageType": "concussão",
    "halfOnSave": true,
    "condition": "caido",
    "rounds": 10,
    "repete": false
   }
  ],
  "traits": [],
  "blurb": "Gira uma corrente pesada que derruba todos ao redor e, de tempos em tempos, desfere um golpe capaz de deixar o alvo inconsciente. Manter distância de 3 m é a melhor defesa.",
  "lore": "Este ogro carrega uma longa corrente de ferro, usada tanto para açoitar escravos quanto para esmagar inimigos. Vive em colinas, montanhas e campos abertos, muitas vezes servindo como guarda ou capataz em bandos de ogros. É bruto e pouco inteligente, mas sabe que um bom giro da corrente resolve quase qualquer problema. Gosta de nocautear as vítimas para levá-las vivas."
 },
 "ogroLiteira": {
  "id": "ogroLiteira",
  "tipo": "gigante",
  "name": "Ogro Liteira",
  "nomeOriginal": "Ogre Howdah",
  "fonte": "MTF",
  "size": "grande",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 19,
   "dex": 8,
   "con": 16,
   "int": 5,
   "wis": 7,
   "cha": 7
  },
  "ac": 13,
  "acNote": "peitoral",
  "maxHp": 59,
  "hpDice": "7d10+21",
  "speedFt": 40,
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
    "name": "Maça",
    "bonus": 6,
    "damage": "2d6+4",
    "type": "concussão",
    "reachFt": 5
   }
  ],
  "traits": [
   "t_liteira"
  ],
  "blurb": "Um ogro que carrega nas costas um pequeno forte cheio de goblins ou kobolds, que atacam de cima protegidos enquanto ele esmaga inimigos com a maça.",
  "lore": "Goblinoides e outras criaturas pequenas às vezes domesticam ogros e os transformam em montarias de guerra, prendendo uma torre de madeira em suas costas. O ogro serve como fortaleza ambulante nas planícies e colinas, levando arqueiros e lanceiros para o meio da batalha. Pouco inteligente, ele obedece enquanto for bem alimentado e tiver algo para esmagar. Quando o gigante tomba, os passageiros despencam ao redor dele."
 },
 "oinoloth": {
  "id": "oinoloth",
  "tipo": "corruptor",
  "name": "Oinoloth",
  "nomeOriginal": "Oinoloth",
  "fonte": "MTF",
  "size": "médio",
  "level": 9,
  "cr": "12",
  "xp": 8400,
  "abilities": {
   "str": 19,
   "dex": 17,
   "con": 18,
   "int": 17,
   "wis": 16,
   "cha": 19
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 126,
  "hpDice": "12d10+60",
  "speedFt": 40,
  "senses": {
   "passivePerception": 17,
   "blindsightFt": 60,
   "darkvisionFt": 60
  },
  "saves": [
   "con",
   "wis"
  ],
  "skills": [
   "enganacao",
   "intimidacao",
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
    "name": "Garra",
    "bonus": 8,
    "damage": "3d6+4",
    "type": "cortante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "4d10",
     "type": "necrótico"
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
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "enfraquecerOIntelecto",
    "globoDeInvulnerabilidade",
    "muralhaDeFogo",
    "muralhaDeGelo",
    "escuridao",
    "detectarMagia",
    "dissiparMagia",
    "invisibilidade"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "enfraquecerOIntelecto": 1,
    "globoDeInvulnerabilidade": 1,
    "muralhaDeFogo": 1,
    "muralhaDeGelo": 1
   },
   "aVontade": [
    "escuridao",
    "detectarMagia",
    "dissiparMagia",
    "invisibilidade"
   ],
   "cdPorMagia": {
    "enfraquecerOIntelecto": 16,
    "globoDeInvulnerabilidade": 16,
    "muralhaDeFogo": 16,
    "muralhaDeGelo": 16,
    "escuridao": 16,
    "detectarMagia": 16,
    "dissiparMagia": 16,
    "invisibilidade": 16
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Teletransporte",
    "tipo": "teleporte",
    "alcanceFt": 60
   },
   {
    "nome": "Olhar Paralisante",
    "tipo": "alvo",
    "alcanceFt": 30,
    "save": "wis",
    "dc": 16,
    "condition": "enfeiticado",
    "rounds": 1,
    "repete": false,
    "ateFimDoTurnoDele": true,
    "imunizaAoPassar": true
   }
  ],
  "traits": [
   "t_curaCorrompida",
   "t_portadorDePragas",
   "resistenciaAMagia",
   "armasMagicas"
  ],
  "blurb": "Yugoloth da peste que prende alvos com o olhar e dilacera com garras carregadas de energia necrótica, enquanto espalha uma praga que envenena e impede a cura. Também conjura muralhas de fogo e gelo, debilidade mental e teleporta-se pelo campo.",
  "lore": "Os oinoloths são yugoloths ligados à doença e à fome, enviados para onde a guerra precisa de um empurrão rumo à ruína. Por onde passam, as plantações secam e os enfermos definham. Servem aos senhores dos yugoloths como mercenários de alto preço e costumam oferecer curas falsas que cobram caro do corpo de quem aceita. São frios, calculistas e indiferentes ao sofrimento que causam, vistos em desertos e nas profundezas do Subterrâneo."
 },
 "orcus": {
  "id": "orcus",
  "tipo": "corruptor",
  "name": "Orcus",
  "nomeOriginal": "Orcus",
  "fonte": "MTF",
  "size": "enorme",
  "level": 25,
  "cr": "26",
  "xp": 90000,
  "abilities": {
   "str": 27,
   "dex": 14,
   "con": 25,
   "int": 20,
   "wis": 20,
   "cha": 25
  },
  "ac": 17,
  "acNote": "armadura natural (20 com a Varinha de Orcus)",
  "maxHp": 405,
  "hpDice": "30d12+210",
  "speedFt": 40,
  "flyFt": 40,
  "speeds": {
   "flyFt": 40
  },
  "senses": {
   "passivePerception": 22,
   "truesightFt": 120
  },
  "saves": [
   "dex",
   "con",
   "wis"
  ],
  "skills": [
   "arcanismo",
   "percepcao"
  ],
  "expertise": [],
  "damageResistances": [
   "frio",
   "fogo",
   "elétrico"
  ],
  "damageImmunities": [
   "necrótico",
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
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Varinha de Orcus",
    "bonus": 19,
    "damage": "3d8+8",
    "type": "concussão",
    "reachFt": 10,
    "danoExtra": {
     "damage": "2d12",
     "type": "necrótico"
    }
   },
   {
    "name": "Cauda",
    "bonus": 16,
    "damage": "3d8+8",
    "type": "perfurante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "2d8",
     "type": "veneno"
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Varinha de Orcus",
    "Varinha de Orcus"
   ]
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "pararOTempo",
    "dissiparMagia",
    "toqueArrepiante",
    "detectarMagia"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "pararOTempo": 1,
    "dissiparMagia": 3
   },
   "aVontade": [
    "toqueArrepiante",
    "detectarMagia"
   ],
   "cdPorMagia": {
    "pararOTempo": 23,
    "dissiparMagia": 23,
    "toqueArrepiante": 23,
    "detectarMagia": 23
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
     "nome": "Um Gosto da Não Vida",
     "custo": 1,
     "tipo": "magia",
     "magias": [
      "toqueArrepiante"
     ]
    }
   ]
  },
  "traits": [
   "t_varinhaDeOrcus",
   "resistenciaAMagia",
   "armasMagicas",
   "t_mestreDaNaoVida",
   "acoesLendarias"
  ],
  "blurb": "Gigante demoníaco que esmaga com a varinha, causando dano de concussão e necrótico, e lança morte em área com magias como círculo da morte e palavra de poder matar. Ignora armas não mágicas e pode erguer exércitos de mortos-vivos no meio da batalha.",
  "lore": "Orcus é o Príncipe Demônio dos Mortos-Vivos, também chamado de Senhor do Sangue. Sonha em extinguir toda a vida e transformar o multiverso numa imensa necrópole governada por ele. Tem corpo inchado e apodrecido, pernas de bode, asas de morcego e uma cabeça que lembra um crânio caprino. Governa Thanatos, camada do Abismo onde fica Naratyr, uma cidade-fortaleza fria e silenciosa cercada pelo Estige, com um castelo de ossos e paredes de carne. Seus seguidores, de carniçais a necromantes, recebem migalhas de seu poder em troca de espalhar a morte."
 },
 "orthon": {
  "id": "orthon",
  "tipo": "corruptor",
  "name": "Orthon",
  "nomeOriginal": "Orthon",
  "fonte": "MTF",
  "size": "grande",
  "level": 9,
  "cr": "10",
  "xp": 5900,
  "abilities": {
   "str": 22,
   "dex": 16,
   "con": 21,
   "int": 15,
   "wis": 15,
   "cha": 16
  },
  "ac": 17,
  "acNote": "meia-armadura",
  "maxHp": 105,
  "hpDice": "10d10+50",
  "speedFt": 30,
  "speeds": {
   "climbFt": 30
  },
  "senses": {
   "passivePerception": 20,
   "darkvisionFt": 120,
   "truesightFt": 30
  },
  "saves": [
   "dex",
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
   "enfeitiçado",
   "exausto",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Adaga Infernal",
    "bonus": 10,
    "damage": "2d4+6",
    "type": "cortante",
    "reachFt": 5,
    "onHit": {
     "save": "con",
     "dc": 17,
     "condition": "envenenado",
     "rounds": 10,
     "repete": true
    }
   },
   {
    "name": "Besta de Latão",
    "bonus": 7,
    "damage": "2d10+3",
    "type": "perfurante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 100,
    "longRangeFt": 400
   }
  ],
  "traits": [
   "t_campoDeInvisibilidade",
   "resistenciaAMagia",
   "t_retribuicaoExplosiva"
  ],
  "blurb": "Caçador infernal que some com uma ação bônus e ataca de surpresa, alternando adaga venenosa e uma besta de latão com virotes de efeitos variados (ácido, cegueira, paralisia, teia). Ao cair quase morto, explode em fogo e trovão.",
  "lore": "O orthon é o diabo que os arquiduques dos Nove Infernos enviam quando alguém precisa ser rastreado, capturado ou eliminado. Persegue suas presas por todo o multiverso sem descanso, quase sempre invisível, e com sentidos aguçadíssimos. Adora a emoção da caçada e do duelo contra um rival à altura. Sem ordens do seu senhor, pode aceitar trabalho de quem lhe prometa um desafio digno, e conhece os Infernos como poucos guias."
 },
 "fenix": {
  "id": "fenix",
  "tipo": "elemental",
  "name": "Fênix",
  "nomeOriginal": "Phoenix",
  "fonte": "MTF",
  "size": "imenso",
  "level": 13,
  "cr": "16",
  "xp": 15000,
  "abilities": {
   "str": 19,
   "dex": 26,
   "con": 25,
   "int": 2,
   "wis": 21,
   "cha": 18
  },
  "ac": 18,
  "maxHp": 175,
  "hpDice": "10d20+70",
  "speedFt": 20,
  "flyFt": 120,
  "speeds": {
   "flyFt": 120
  },
  "senses": {
   "passivePerception": 15,
   "darkvisionFt": 60
  },
  "saves": [
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
   "atordoado"
  ],
  "attacks": [
   {
    "name": "Bico",
    "bonus": 13,
    "damage": "2d6+8",
    "type": "fogo",
    "reachFt": 15,
    "danoExtra": {
     "damage": "1d10",
     "type": "fogo"
    }
   },
   {
    "name": "Garras Flamejantes",
    "bonus": 13,
    "damage": "2d8+8",
    "type": "fogo",
    "reachFt": 15
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Bico",
    "Garras Flamejantes"
   ]
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "explosaoAoMorrer": {
   "pes": 5,
   "save": "dex",
   "dc": 20,
   "dano": "4d10",
   "tipo": "fogo",
   "metade": true
  },
  "corpoQuente": {
   "damage": "1d10",
   "type": "fogo"
  },
  "luzPropria": {
   "claro": 60,
   "penumbra": 30
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Bicada",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Bico"
    },
    {
     "nome": "Mover",
     "custo": 1,
     "tipo": "mover",
     "metade": false,
     "semOportunidade": false
    },
    {
     "nome": "Mergulho",
     "custo": 2,
     "tipo": "golpe",
     "arma": "Garras Flamejantes"
    }
   ]
  },
  "traits": [
   "explosaoAoMorrer",
   "formaFluida",
   "voaSemProvocar",
   "monstroDeCerco",
   "acoesLendarias"
  ],
  "blurb": "Ave de fogo colossal e veloz, que mergulha sobre os inimigos com bico e garras flamejantes e incendeia quem toca. Ao morrer, explode numa onda de fogo e depois renasce.",
  "lore": "A fênix é um elemental do fogo em forma de ave gigantesca, nascida da fúria das chamas primordiais. Costuma ser vista sobre desertos e cordilheiras, deixando um rastro de luz e calor por onde passa. Tem pouca inteligência e age por instinto, queimando tudo o que encontra. Matá-la não basta: das cinzas resta um ovo ardente que, em poucos dias, choca uma nova fênix."
 },
 "abishaiVermelho": {
  "id": "abishaiVermelho",
  "tipo": "corruptor",
  "name": "Abishai Vermelho",
  "nomeOriginal": "Red Abishai",
  "fonte": "MTF",
  "size": "médio",
  "level": 17,
  "cr": "19",
  "xp": 22000,
  "abilities": {
   "str": 23,
   "dex": 16,
   "con": 19,
   "int": 14,
   "wis": 15,
   "cha": 19
  },
  "ac": 22,
  "acNote": "armadura natural",
  "maxHp": 255,
  "hpDice": "30d8+120",
  "speedFt": 30,
  "flyFt": 50,
  "speeds": {
   "flyFt": 50
  },
  "senses": {
   "passivePerception": 18,
   "darkvisionFt": 120
  },
  "saves": [
   "str",
   "con",
   "wis"
  ],
  "skills": [
   "intimidacao",
   "percepcao"
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
    "name": "Estrela da Manhã",
    "bonus": 12,
    "damage": "1d8+6",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Garra",
    "bonus": 12,
    "damage": "2d10+6",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Mordida",
    "bonus": 12,
    "damage": "3d10+6",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "7d10",
     "type": "fogo"
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Estrela da Manhã",
    "Garra",
    "Mordida"
   ]
  },
  "presencaAterradora": {
   "dc": 18,
   "alcanceFt": 120
  },
  "features": [
   "devilsSight"
  ],
  "traits": [
   "presencaAterradora",
   "t_incitarFanatismo",
   "t_poderDaRainhaDragao",
   "resistenciaAMagia",
   "armasMagicas"
  ],
  "blurb": "Comandante infernal que aterroriza os inimigos e inflama os aliados, rasgando alvos com estrela da manhã, garra e uma mordida flamejante devastadora. Ainda pode dominar dragões, especialmente os cromáticos.",
  "lore": "Os abishais vermelhos são diabos dracônicos a serviço de Tiamat, a Rainha dos Dragões, e atuam como generais e arautos de sua vontade. Costumam liderar cultos e exércitos em regiões montanhosas ou cidades onde a influência da deusa se espalha. Seu fervor contagia os seguidores, transformando tropas comuns em fanáticos destemidos. Diante de dragões, usam a autoridade de sua senhora para submetê-los e trazê-los para a causa."
 },
 "recuperador": {
  "id": "recuperador",
  "tipo": "constructo",
  "name": "Recuperador",
  "nomeOriginal": "Retriever",
  "fonte": "MTF",
  "size": "grande",
  "level": 13,
  "cr": "14",
  "xp": 11500,
  "abilities": {
   "str": 22,
   "dex": 16,
   "con": 20,
   "int": 3,
   "wis": 11,
   "cha": 4
  },
  "ac": 19,
  "acNote": "armadura natural",
  "maxHp": 210,
  "hpDice": "20d10+100",
  "speedFt": 40,
  "speeds": {
   "climbFt": 40
  },
  "senses": {
   "passivePerception": 15,
   "blindsightFt": 30,
   "darkvisionFt": 60
  },
  "saves": [
   "dex",
   "con",
   "wis"
  ],
  "skills": [
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
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
   "exausto",
   "amedrontado",
   "paralisado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Pata Dianteira",
    "bonus": 11,
    "damage": "2d8+6",
    "type": "cortante",
    "reachFt": 10
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Pata Dianteira",
    "Pata Dianteira"
   ]
  },
  "spellcasting": {
   "ability": "wis",
   "cantrips": [],
   "prepared": [
    "viagemPlanar",
    "teia"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "viagemPlanar": 3,
    "teia": 3
   },
   "cdPorMagia": {
    "viagemPlanar": 13,
    "teia": 13
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Raio de Força",
    "tipo": "alvo",
    "alcanceFt": 60,
    "save": "dex",
    "dc": 16,
    "damage": "5d10",
    "damageType": "energético",
    "halfOnSave": true
   },
   {
    "nome": "Raio Paralisante (Recarga 5–6)",
    "recharge": [
     5,
     6
    ],
    "tipo": "alvo",
    "alcanceFt": 60,
    "save": "con",
    "dc": 18,
    "condition": "paralisado",
    "rounds": 10,
    "repete": true
   }
  ],
  "traits": [
   "t_rastreadorInfalivel"
  ],
  "blurb": "Constructo aracnídeo que golpeia com as patas dianteiras enquanto dispara raios de energia ou de paralisia; quem fica paralisado pode ser carregado para longe ou arrastado para outro plano. Só armas mágicas ou de adamante o ferem de verdade.",
  "lore": "Os drow criaram estes constructos de metal e magia para caçar demônios no Abismo e trazê-los como escravos ou oferendas rituais. Dentro de cada um está aprisionado o espírito de um bebilith, reduzido a pouco mais que crueldade e astúcia. Hoje são enviados sempre que um drow poderoso quer alguém ou algo capturado inteiro e vivo. Raramente saem das mãos dos elfos negros, que temem vê-los voltados contra si."
 },
 "trollApodrecido": {
  "id": "trollApodrecido",
  "tipo": "gigante",
  "name": "Troll Apodrecido",
  "nomeOriginal": "Rot Troll",
  "fonte": "MTF",
  "size": "grande",
  "level": 9,
  "cr": "9",
  "xp": 5000,
  "abilities": {
   "str": 18,
   "dex": 13,
   "con": 22,
   "int": 5,
   "wis": 8,
   "cha": 4
  },
  "ac": 16,
  "acNote": "armadura natural",
  "maxHp": 138,
  "hpDice": "12d10+72",
  "speedFt": 30,
  "senses": {
   "passivePerception": 13,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "damageImmunities": [
   "necrótico"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 8,
    "damage": "1d6+4",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "3d10",
     "type": "necrótico"
    }
   },
   {
    "name": "Garras",
    "bonus": 8,
    "damage": "2d6+4",
    "type": "cortante",
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
    "Mordida",
    "Garras",
    "Garras"
   ]
  },
  "traits": [
   "t_degeneracaoRancosa"
  ],
  "blurb": "Ataca com mordida e garras que somam dano necrótico, e sua carne podre corrói quem fica colado nele a cada turno. Fogo ou ácido interrompem essa aura de putrefação.",
  "lore": "O troll apodrecido surge quando um troll é exposto a energia necrótica em excesso e sua regeneração se corrompe. Em vez de se curar, seu corpo se decompõe sem parar, espalhando podridão em tudo ao redor. Vaga por pântanos, florestas, desertos e pelo Subterrâneo, movido por uma fome brutal. É estúpido e feroz, mas extremamente resistente."
 },
 "rutterkin": {
  "id": "rutterkin",
  "tipo": "corruptor",
  "name": "Rutterkin",
  "nomeOriginal": "Rutterkin",
  "fonte": "MTF",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 14,
   "dex": 15,
   "con": 17,
   "int": 5,
   "wis": 12,
   "cha": 6
  },
  "ac": 12,
  "maxHp": 37,
  "hpDice": "5d8+15",
  "speedFt": 20,
  "senses": {
   "passivePerception": 11,
   "darkvisionFt": 120
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
    "name": "Mordida",
    "bonus": 4,
    "damage": "3d6+2",
    "type": "perfurante",
    "reachFt": 5,
    "onHit": {
     "save": "con",
     "dc": 13,
     "condition": "envenenado",
     "rounds": 1,
     "repete": true
    }
   }
  ],
  "aura": {
   "raioFt": 30,
   "quando": "inicioDoAlvo",
   "save": "wis",
   "dc": 11,
   "condition": "amedrontado",
   "rounds": 10,
   "repete": true
  },
  "traits": [
   "aura"
  ],
  "blurb": "Rutterkins atacam em bando e, quando três ou mais cercam a vítima, irradiam um medo que a deixa paralisada no lugar. A mordida transmite uma doença abissal capaz de transformar quem morre por ela em um desgraçado abissal.",
  "lore": "Os rutterkins são demônios deformados que vagam pelo Abismo em turbas famintas. Funcionam como guardiões do plano, caçando qualquer criatura que não seja demoníaca. Ao avistar um intruso, se juntam e avançam em massa, precedidos por uma onda de pavor. Suas mordidas espalham uma praga que retorce a carne das vítimas até convertê-las em desgraçados abissais, que passam a seguir a turba."
 },
 "estatuaSagrada": {
  "id": "estatuaSagrada",
  "tipo": "constructo",
  "name": "Estátua Sagrada",
  "nomeOriginal": "Sacred Statue",
  "fonte": "MTF",
  "size": "grande",
  "level": 1,
  "cr": "0",
  "xp": 10,
  "abilities": {
   "str": 19,
   "dex": 8,
   "con": 19,
   "int": 14,
   "wis": 19,
   "cha": 16
  },
  "ac": 19,
  "acNote": "armadura natural",
  "maxHp": 95,
  "hpDice": "10d10+40",
  "speedFt": 25,
  "senses": {
   "passivePerception": 14,
   "darkvisionFt": 60
  },
  "saves": [
   "wis"
  ],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "ácido",
   "fogo",
   "elétrico",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "damageImmunities": [
   "frio",
   "necrótico",
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
    "name": "Pancada",
    "bonus": 8,
    "damage": "6d12+4",
    "type": "concussão",
    "reachFt": 10
   },
   {
    "name": "Rocha",
    "bonus": 8,
    "damage": "6d10+4",
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
    "Pancada",
    "Pancada"
   ]
  },
  "traits": [
   "aparenciaFalsa",
   "t_habitanteFantasmagorico",
   "t_inerte"
  ],
  "blurb": "Colosso de pedra animado por um eidolon que esmaga com pancadas brutais a 3 m de alcance ou arremessa rochas de longe. Resiste a quase tudo que não seja mágico e golpeia com dano devastador.",
  "lore": "A estátua sagrada é uma imagem de culto que serve de corpo para um eidolon, espírito devoto preso para guardar um lugar santo. Enquanto ninguém a habita, não passa de pedra esculpida. Quando invasores profanam o templo, o eidolon entra nela e a estátua se ergue para defender o local. Não só deuses prendem almas a ídolos: arquidiabos como Moloch fazem o mesmo com seus cultistas."
 },
 "dancarinoDasSombras": {
  "id": "dancarinoDasSombras",
  "tipo": "humanoide",
  "name": "Dançarino das Sombras",
  "nomeOriginal": "Shadow Dancer",
  "fonte": "MTF",
  "size": "médio",
  "level": 5,
  "cr": "7",
  "xp": 2900,
  "abilities": {
   "str": 12,
   "dex": 16,
   "con": 13,
   "int": 11,
   "wis": 12,
   "cha": 12
  },
  "ac": 15,
  "acNote": "couro batido",
  "maxHp": 71,
  "hpDice": "13d8+13",
  "speedFt": 30,
  "senses": {
   "passivePerception": 11,
   "darkvisionFt": 60
  },
  "saves": [
   "dex",
   "cha"
  ],
  "skills": [
   "furtividade"
  ],
  "expertise": [],
  "damageResistances": [
   "necrótico"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "exausto"
  ],
  "attacks": [
   {
    "name": "Corrente Cravejada",
    "bonus": 6,
    "damage": "2d6+3",
    "type": "perfurante",
    "reachFt": 10
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Corrente Cravejada",
    "Corrente Cravejada",
    "Corrente Cravejada"
   ]
  },
  "acoesEspeciais": [
   {
    "nome": "Salto Sombrio",
    "tipo": "teleporte",
    "alcanceFt": 30,
    "bonus": true
   }
  ],
  "traits": [
   "ascendenciaFeerica",
   "t_saltoSombrio"
  ],
  "blurb": "Salta de sombra em sombra com ação bônus e golpeia três vezes com uma corrente cravejada de 3 m de alcance, podendo agarrar, derrubar ou causar dano necrótico pesado a cada acerto.",
  "lore": "Os dançarinos das sombras são shadar-kai, elfos ligados ao Pendor das Sombras que aprenderam a mover-se pela escuridão como se ela fosse uma porta. Atuam como espiões, guardas e assassinos a serviço de sua rainha sombria. Preferem lutar em locais mal iluminados, onde surgem e somem entre os inimigos. Podem ser encontrados em florestas, cidades e no Subterrâneo."
 },
 "sibriex": {
  "id": "sibriex",
  "tipo": "corruptor",
  "name": "Sibriex",
  "nomeOriginal": "Sibriex",
  "fonte": "MTF",
  "size": "enorme",
  "level": 17,
  "cr": "18",
  "xp": 20000,
  "abilities": {
   "str": 10,
   "dex": 3,
   "con": 23,
   "int": 25,
   "wis": 24,
   "cha": 25
  },
  "ac": 19,
  "acNote": "armadura natural",
  "maxHp": 150,
  "hpDice": "12d12+72",
  "speedFt": 0,
  "flyFt": 20,
  "hover": true,
  "speeds": {
   "flyFt": 20
  },
  "senses": {
   "passivePerception": 23,
   "truesightFt": 120
  },
  "saves": [
   "int",
   "cha"
  ],
  "skills": [
   "arcanismo",
   "historia",
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
    "name": "Corrente",
    "bonus": 6,
    "damage": "2d12+7",
    "type": "perfurante",
    "reachFt": 15
   },
   {
    "name": "Mordida",
    "bonus": 6,
    "damage": "2d8",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "2d8",
     "type": "ácido"
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
    "enfraquecerOIntelecto",
    "enfeiticarPessoa",
    "comando",
    "dissiparMagia",
    "imobilizarMonstro"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "enfraquecerOIntelecto": 3
   },
   "aVontade": [
    "enfeiticarPessoa",
    "comando",
    "dissiparMagia",
    "imobilizarMonstro"
   ],
   "cdPorMagia": {
    "enfraquecerOIntelecto": 21,
    "enfeiticarPessoa": 21,
    "comando": 21,
    "dissiparMagia": 21,
    "imobilizarMonstro": 21
   }
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "acoesEspeciais": [
   {
    "nome": "Esguicho de Bile",
    "tipo": "alvo",
    "alcanceFt": 120,
    "save": "dex",
    "dc": 20,
    "damage": "10d6",
    "damageType": "ácido",
    "halfOnSave": false
   },
   {
    "nome": "Deformar Criatura",
    "tipo": "alvo",
    "alcanceFt": 120,
    "alvos": 3,
    "save": "con",
    "dc": 20,
    "condition": "envenenado",
    "rounds": 10,
    "repete": true
   }
  ],
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Lançar Magia",
     "custo": 1,
     "tipo": "magia"
    },
    {
     "nome": "Borrifar Bile",
     "custo": 1,
     "tipo": "especial",
     "acao": "Esguicho de Bile"
    },
    {
     "nome": "Deformar",
     "custo": 2,
     "tipo": "especial",
     "acao": "Deformar Criatura"
    }
   ]
  },
  "traits": [
   "t_contaminacao",
   "resistenciaAMagia",
   "acoesLendarias"
  ],
  "blurb": "Flutua lentamente enquanto sua aura corrompe o chão e envenena quem chega perto; cospe bile ácida a longa distância e deforma até três inimigos por vez, podendo transformá-los em servos abissais. Também lança magias poderosas como imobilizar monstro e enfraquecer o intelecto.",
  "lore": "O sibriex é um demônio antiquíssimo, talvez tão velho quanto o próprio Abismo, que se esconde em regiões isoladas desse plano. Seu corpo enorme escorre sangue e bile, e a terra onde esses fluidos caem apodrece. Acumula há eras segredos de todos os planos e os negocia com cautela, servindo às vezes de conselheiro até para lordes demônios. Também molda carne: cria hordas de demônios menores e enxerta novos membros em quem lhe pede, sempre cobrando um favor ou tesouro em troca."
 },
 "espreitador": {
  "id": "espreitador",
  "tipo": "humanoide",
  "name": "Espreitador",
  "nomeOriginal": "Skulk",
  "fonte": "MTF",
  "size": "médio",
  "level": 1,
  "cr": "1/2",
  "xp": 100,
  "abilities": {
   "str": 6,
   "dex": 19,
   "con": 10,
   "int": 10,
   "wis": 7,
   "cha": 1
  },
  "ac": 14,
  "maxHp": 18,
  "hpDice": "4d8",
  "speedFt": 30,
  "senses": {
   "passivePerception": 8,
   "darkvisionFt": 120
  },
  "saves": [
   "con"
  ],
  "skills": [
   "furtividade"
  ],
  "expertise": [
   "furtividade"
  ],
  "damageImmunities": [
   "radiante"
  ],
  "conditionImmunities": [
   "cego"
  ],
  "attacks": [
   {
    "name": "Garras",
    "bonus": 6,
    "damage": "1d4+4",
    "type": "cortante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "2d6",
     "type": "necrótico"
    }
   }
  ],
  "traits": [
   "t_invisibilidadeFalivel",
   "t_semRastros"
  ],
  "blurb": "Sempre invisível, ataca com vantagem e suas garras causam dano necrótico extra quando isso acontece. Só espelhos, velas especiais ou crianças revelam sua posição.",
  "lore": "Espreitadores são o que resta de viajantes que se perderam no Pendor das Sombras até esquecer quem eram, ficando invisíveis para sempre. Quando vistos, parecem humanoides cinzentos, lisos e sem traços marcantes. Podem ser invocados por um ritual em que recebem parte da identidade de quem os chama, servindo-o por 30 dias e ganhando uma vaga semelhança com ele. Cruéis, cumprem ordens da forma mais sangrenta possível, já que só voltam ao seu plano ao morrer. Às vezes matam alguém e passam a imitar sua vida em silêncio, chegando a esvaziar vilarejos inteiros."
 },
 "senhorDasCaveiras": {
  "id": "senhorDasCaveiras",
  "tipo": "morto-vivo",
  "name": "Senhor das Caveiras",
  "nomeOriginal": "Skull Lord",
  "fonte": "MTF",
  "size": "médio",
  "level": 13,
  "cr": "15",
  "xp": 13000,
  "abilities": {
   "str": 14,
   "dex": 16,
   "con": 17,
   "int": 16,
   "wis": 15,
   "cha": 21
  },
  "ac": 18,
  "acNote": "armadura de placas",
  "maxHp": 105,
  "hpDice": "14d8+42",
  "speedFt": 30,
  "senses": {
   "passivePerception": 22,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "atletismo",
   "historia",
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageResistances": [
   "frio",
   "necrótico",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "damageImmunities": [
   "veneno"
  ],
  "conditionImmunities": [
   "cego",
   "enfeitiçado",
   "surdo",
   "exausto",
   "amedrontado",
   "envenenado",
   "atordoado",
   "inconsciente"
  ],
  "attacks": [
   {
    "name": "Cajado de Osso",
    "bonus": 8,
    "damage": "1d8+3",
    "type": "concussão",
    "reachFt": 5,
    "danoExtra": {
     "damage": "4d6",
     "type": "necrótico"
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Cajado de Osso",
    "Cajado de Osso",
    "Cajado de Osso"
   ]
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [
    "toqueArrepiante",
    "raioDeFogo",
    "maoMagica",
    "borrifoVenenoso",
    "raioDeGelo",
    "toqueChocante"
   ],
   "prepared": [
    "misselMagico",
    "recuoAcelerado",
    "ondaTrovejante",
    "imagemEspelhada",
    "raioArdente",
    "medo",
    "velocidade",
    "dimensaoPorta",
    "tempestadeDeGelo",
    "nuvemMortal",
    "coneDeFrio",
    "olharPerturbador",
    "dedoDaMorte"
   ],
   "slots": [
    0,
    4,
    3,
    3,
    3,
    2,
    1,
    1
   ],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "cdPorMagia": {
    "toqueArrepiante": 18,
    "raioDeFogo": 18,
    "maoMagica": 18,
    "borrifoVenenoso": 18,
    "raioDeGelo": 18,
    "toqueChocante": 18,
    "misselMagico": 18,
    "recuoAcelerado": 18,
    "ondaTrovejante": 18,
    "imagemEspelhada": 18,
    "raioArdente": 18,
    "medo": 18,
    "velocidade": 18,
    "dimensaoPorta": 18,
    "tempestadeDeGelo": 18,
    "nuvemMortal": 18,
    "coneDeFrio": 18,
    "olharPerturbador": 18,
    "dedoDaMorte": 18
   }
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "features": [
   "evasion"
  ],
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Cajado de Osso",
     "custo": 2,
     "tipo": "golpe",
     "arma": "Cajado de Osso"
    },
    {
     "nome": "Truque",
     "custo": 1,
     "tipo": "magia",
     "soTruque": true
    },
    {
     "nome": "Mover",
     "custo": 1,
     "tipo": "mover",
     "metade": false,
     "semOportunidade": true
    }
   ]
  },
  "traits": [
   "t_mestreDaSepultura",
   "acoesLendarias"
  ],
  "blurb": "Feiticeiro morto-vivo de três crânios que golpeia com um cajado de osso carregado de energia necrótica e lança magias devastadoras como dedo da morte e cone de frio. Invoca esqueletos e zumbis e fortalece todos os mortos-vivos aliados ao redor.",
  "lore": "Os senhores das caveiras são abominações formadas pela fusão de três líderes traidores em um único corpo morto-vivo. Os primeiros surgiram quando Vecna, traído por Kas, puniu seus generais desleais unindo-os em trios amaldiçoados. Hoje dominam vastos territórios no Pendor das Sombras, guerreando contra rivais à frente de hordas de mortos-vivos. Porém, suas três mentes vivem conspirando umas contra as outras, o que os torna seus próprios piores inimigos. Não precisam respirar, comer, beber nem dormir."
 },
 "mercadorDeAlmas": {
  "id": "mercadorDeAlmas",
  "tipo": "humanoide",
  "name": "Mercador de Almas",
  "nomeOriginal": "Soul Monger",
  "fonte": "MTF",
  "size": "médio",
  "level": 9,
  "cr": "11",
  "xp": 7200,
  "abilities": {
   "str": 8,
   "dex": 17,
   "con": 14,
   "int": 19,
   "wis": 15,
   "cha": 13
  },
  "ac": 15,
  "acNote": "couro batido",
  "maxHp": 123,
  "hpDice": "19d8+38",
  "speedFt": 30,
  "senses": {
   "passivePerception": 17,
   "darkvisionFt": 60
  },
  "saves": [
   "dex",
   "wis",
   "cha"
  ],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "damageImmunities": [
   "necrótico",
   "psíquico"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "exausto",
   "amedrontado"
  ],
  "attacks": [
   {
    "name": "Adaga Fantasmagórica",
    "bonus": 7,
    "damage": "4d4+3",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "3d12",
     "type": "necrótico"
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Adaga Fantasmagórica",
    "Adaga Fantasmagórica"
   ]
  },
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "rogarMaldicao",
    "correnteDeRelampagos",
    "dedoDaMorte",
    "formaGasosa",
    "assassinoFantasmagorico",
    "aparenciaEnganosa",
    "toqueArrepiante",
    "borrifoVenenoso"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "rogarMaldicao": 1,
    "correnteDeRelampagos": 1,
    "dedoDaMorte": 1,
    "formaGasosa": 1,
    "assassinoFantasmagorico": 1,
    "aparenciaEnganosa": 1
   },
   "aVontade": [
    "toqueArrepiante",
    "borrifoVenenoso"
   ],
   "cdPorMagia": {
    "rogarMaldicao": 16,
    "correnteDeRelampagos": 16,
    "dedoDaMorte": 16,
    "formaGasosa": 16,
    "assassinoFantasmagorico": 16,
    "aparenciaEnganosa": 16,
    "toqueArrepiante": 16,
    "borrifoVenenoso": 16
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Onda de Exaustão",
    "recharge": [
     4,
     5,
     6
    ],
    "tipo": "area",
    "shape": "cube",
    "areaFt": 60,
    "save": "con",
    "dc": 16,
    "damage": "10d8",
    "damageType": "psíquico",
    "halfOnSave": false,
    "condition": "exausto",
    "rounds": 10,
    "repete": false
   }
  ],
  "traits": [
   "ascendenciaFeerica",
   "resistenciaAMagia",
   "t_sedeDeAlmas",
   "t_pesoDasEras"
  ],
  "blurb": "Luta de perto com adagas fantasmagóricas que causam dano necrótico e deixam o alvo vulnerável a magias, enquanto sua onda de cansaço esgota grupos inteiros. Quem fica ao seu lado tem o passo arrastado pelo peso dos séculos.",
  "lore": "Os mercadores de almas são shadar-kai, elfos ligados ao Pendor das Sombras que carregam no corpo a melancolia daquele plano. Alimentam-se da essência dos que matam, ficando mais ferozes a cada vítima. Costumam agir no Subterrâneo ou em cidades sombrias, servindo como agentes e caçadores de sua rainha. São frios, calculistas e imunes ao medo e ao desespero que espalham."
 },
 "trollEspiritual": {
  "id": "trollEspiritual",
  "tipo": "gigante",
  "name": "Troll Espiritual",
  "nomeOriginal": "Spirit Troll",
  "fonte": "MTF",
  "size": "grande",
  "level": 9,
  "cr": "11",
  "xp": 7200,
  "abilities": {
   "str": 1,
   "dex": 17,
   "con": 13,
   "int": 8,
   "wis": 9,
   "cha": 16
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 97,
  "hpDice": "15d10+15",
  "speedFt": 30,
  "senses": {
   "passivePerception": 13,
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
  "damageImmunities": [
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageImmunitiesNote": "só de armas não mágicas",
  "conditionImmunities": [
   "exausto",
   "agarrado",
   "paralisado",
   "petrificado",
   "caido",
   "contido",
   "inconsciente"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 7,
    "damage": "3d10+3",
    "type": "psíquico",
    "reachFt": 5,
    "onHit": {
     "save": "wis",
     "dc": 15,
     "condition": "atordoado",
     "rounds": 10,
     "repete": true
    }
   },
   {
    "name": "Garras",
    "bonus": 7,
    "damage": "2d10+3",
    "type": "psíquico",
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
  "regeneracao": {
   "pv": 10,
   "bloqueia": [
    "energético",
    "psíquico"
   ],
   "naoMorreA0": true
  },
  "traits": [
   "incorporealMovement",
   "regeneracaoDoLivro"
  ],
  "blurb": "Um troll fantasmagórico que atravessa paredes e criaturas, rasgando a mente das vítimas com garras e mordida psíquicas que podem atordoar. Armas comuns não o ferem, e ele só para de se regenerar quando sofre dano psíquico ou energético.",
  "lore": "Quando um troll perde o corpo de forma que sua regeneração não consegue reverter, como por magia psíquica, às vezes sua essência teimosa persiste como um espírito. Essa forma etérea mantém a fome e a fúria da criatura original, agora voltadas contra a mente dos vivos. Assombra pântanos, florestas, litorais e as cavernas do Subterrâneo. É caótico e implacável, e caçá-lo exige magia capaz de ferir o próprio espírito."
 },
 "eladrinDaPrimavera": {
  "id": "eladrinDaPrimavera",
  "tipo": "feérico",
  "name": "Eladrin da Primavera",
  "nomeOriginal": "Spring Eladrin",
  "fonte": "MTF",
  "size": "médio",
  "level": 9,
  "cr": "10",
  "xp": 5900,
  "abilities": {
   "str": 14,
   "dex": 16,
   "con": 16,
   "int": 18,
   "wis": 11,
   "cha": 18
  },
  "ac": 19,
  "acNote": "armadura natural",
  "maxHp": 127,
  "hpDice": "17d8+51",
  "speedFt": 30,
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "enganacao",
   "persuasao"
  ],
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
    "name": "Espada Longa",
    "bonus": 6,
    "damage": "1d8+2",
    "type": "cortante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d8",
     "type": "psíquico"
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
     "damage": "1d8",
     "type": "psíquico"
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
    "confusao",
    "cativar",
    "sugestao",
    "dancaIrresistivelDeOtto",
    "enfeiticarPessoa",
    "risoHisterico"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "confusao": 3,
    "cativar": 3,
    "sugestao": 3,
    "dancaIrresistivelDeOtto": 1
   },
   "aVontade": [
    "enfeiticarPessoa",
    "risoHisterico"
   ],
   "cdPorMagia": {
    "confusao": 16,
    "cativar": 16,
    "sugestao": 16,
    "dancaIrresistivelDeOtto": 16,
    "enfeiticarPessoa": 16,
    "risoHisterico": 16
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Passo Feérico",
    "recharge": [
     4,
     5,
     6
    ],
    "tipo": "teleporte",
    "alcanceFt": 30,
    "bonus": true
   }
  ],
  "aura": {
   "raioFt": 60,
   "quando": "inicioDoAlvo",
   "save": "wis",
   "dc": 16,
   "condition": "enfeiticado",
   "rounds": 10,
   "repete": true
  },
  "traits": [
   "t_passoFeerico",
   "aura",
   "resistenciaAMagia"
  ],
  "blurb": "Encanta todos ao redor com sua alegria contagiante e alterna golpes de espada ou arco com magias de controle mental, teleportando-se pelo campo. Resiste a armas comuns e a magia.",
  "lore": "Os eladrins da primavera são elfos feéricos tomados pelo humor da estação do renascimento, cheios de entusiasmo e vontade de festejar. Vivem em florestas e campos ligados à Agrestia das Fadas, onde a vida brota sem parar. Costumam arrastar viajantes para danças e brincadeiras que podem durar dias. Mesmo amistosos, são caprichosos e veem os mortais como divertimento passageiro."
 },
 "grueCriaEstelar": {
  "id": "grueCriaEstelar",
  "tipo": "aberração",
  "name": "Grue Cria Estelar",
  "nomeOriginal": "Star Spawn Grue",
  "fonte": "MTF",
  "size": "pequeno",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 6,
   "dex": 13,
   "con": 10,
   "int": 9,
   "wis": 11,
   "cha": 6
  },
  "ac": 11,
  "maxHp": 17,
  "hpDice": "5d6",
  "speedFt": 30,
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "damageImmunities": [
   "psíquico"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida Desnorteante",
    "bonus": 3,
    "damage": "2d4+1",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "traits": [
   "t_auraDeLoucura"
  ],
  "blurb": "Pequena e fraca sozinha, mas sua aura de loucura atrapalha as defesas e os ataques de quem está perto, e sua mordida deixa a vítima exposta aos golpes dos aliados.",
  "lore": "Os grues são as menores e mais numerosas crias estelares, aberrações nascidas da influência de entidades vindas de além das estrelas. Costumam surgir em grupos ao redor de cultistas e de crias estelares maiores, servindo como tropa descartável. Sua simples presença perturba a mente das criaturas comuns, que perdem a concentração e passam a golpear a esmo. Aparecem em pântanos e montanhas isolados, onde rituais cósmicos rasgaram o véu da realidade."
 },
 "brutamontesCriaEstelar": {
  "id": "brutamontesCriaEstelar",
  "tipo": "aberração",
  "name": "Brutamontes Cria Estelar",
  "nomeOriginal": "Star Spawn Hulk",
  "fonte": "MTF",
  "size": "grande",
  "level": 9,
  "cr": "10",
  "xp": 5900,
  "abilities": {
   "str": 20,
   "dex": 8,
   "con": 21,
   "int": 7,
   "wis": 12,
   "cha": 9
  },
  "ac": 16,
  "acNote": "armadura natural",
  "maxHp": 136,
  "hpDice": "13d10+65",
  "speedFt": 30,
  "senses": {
   "passivePerception": 15,
   "darkvisionFt": 60
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
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "conditionImmunities": [
   "enfeitiçado",
   "amedrontado"
  ],
  "attacks": [
   {
    "name": "Pancada",
    "bonus": 9,
    "damage": "2d8+5",
    "type": "concussão",
    "reachFt": 10
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
    "nome": "Braços Ceifadores",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "raio",
    "areaFt": 10,
    "save": "dex",
    "dc": 17,
    "condition": "caido",
    "rounds": 10,
    "repete": false
   }
  ],
  "traits": [
   "t_espelhoPsiquico"
  ],
  "blurb": "Gigante de carne que esmaga com dois golpes de longo alcance, podendo atordoar quem leva os dois, e varre todos ao redor derrubando-os. Dano psíquico contra ele ricocheteia em quem estiver por perto.",
  "lore": "O brutamontes é um humanoide deformado e inchado pela influência de entidades vindas de além das estrelas. Sua mente foi destruída e substituída por um vazio que reflete energia psíquica. Costuma servir de guarda-costas e aríete para crias estelares mais inteligentes e cultistas do Reino Distante. Não teme nem pode ser seduzido, avançando sem hesitar contra qualquer inimigo."
 },
 "magoLarvaCriaEstelar": {
  "id": "magoLarvaCriaEstelar",
  "tipo": "aberração",
  "name": "Mago Larva Cria Estelar",
  "nomeOriginal": "Star Spawn Larva Mage",
  "fonte": "MTF",
  "size": "médio",
  "level": 13,
  "cr": "16",
  "xp": 15000,
  "abilities": {
   "str": 17,
   "dex": 12,
   "con": 23,
   "int": 18,
   "wis": 12,
   "cha": 16
  },
  "ac": 16,
  "acNote": "armadura natural",
  "maxHp": 168,
  "hpDice": "16d8+96",
  "speedFt": 30,
  "senses": {
   "passivePerception": 16,
   "darkvisionFt": 60
  },
  "saves": [
   "dex",
   "wis",
   "cha"
  ],
  "skills": [
   "percepcao"
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
   "psíquico"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "amedrontado",
   "paralisado",
   "petrificado",
   "envenenado",
   "contido"
  ],
  "attacks": [
   {
    "name": "Pancada",
    "bonus": 8,
    "damage": "1d8+3",
    "type": "concussão",
    "reachFt": 10,
    "onHit": {
     "save": "con",
     "dc": 19,
     "condition": "envenenado",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "circuloDaMorte",
    "dominarMonstro",
    "rajadaMistica",
    "ilusaoMenor"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "circuloDaMorte": 1,
    "dominarMonstro": 3
   },
   "aVontade": [
    "rajadaMistica",
    "ilusaoMenor"
   ],
   "cdPorMagia": {
    "circuloDaMorte": 16,
    "dominarMonstro": 16,
    "rajadaMistica": 16,
    "ilusaoMenor": 16
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Praga de Vermes",
    "recharge": [
     6
    ],
    "tipo": "area",
    "shape": "raio",
    "areaFt": 10,
    "save": "dex",
    "dc": 19,
    "damage": "5d8",
    "damageType": "necrótico",
    "halfOnSave": false,
    "condition": "cego",
    "rounds": 10,
    "repete": true
   }
  ],
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Pancada",
     "custo": 2,
     "tipo": "golpe",
     "arma": "Pancada"
    }
   ]
  },
  "traits": [
   "t_retornoAosVermes",
   "t_nutrirSeDaFraqueza",
   "acoesLendarias"
  ],
  "blurb": "Feiticeiro vermiforme que lança rajadas místicas, domina mentes e solta enxames de vermes que cegam, prendem e corroem quem estiver perto. Mesmo derrotado, pode voltar a se formar a partir dos vermes.",
  "lore": "O mago larva é o que resta de um conjurador mortal que buscou poder junto às entidades de além das estrelas e acabou consumido por elas. Seu corpo virou uma massa pulsante de vermes, guiada por uma mente alienígena e cruel. Costuma liderar outras crias estelares e cultistas em locais isolados, como montanhas remotas, preparando a chegada de seus mestres cósmicos. Alimenta-se do desespero e da fraqueza de quem enfrenta."
 },
 "mutiladorCriaEstelar": {
  "id": "mutiladorCriaEstelar",
  "tipo": "aberração",
  "name": "Mutilador Cria Estelar",
  "nomeOriginal": "Star Spawn Mangler",
  "fonte": "MTF",
  "size": "médio",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 8,
   "dex": 18,
   "con": 12,
   "int": 11,
   "wis": 12,
   "cha": 7
  },
  "ac": 14,
  "maxHp": 71,
  "hpDice": "13d8+13",
  "speedFt": 40,
  "speeds": {
   "climbFt": 40
  },
  "senses": {
   "passivePerception": 11,
   "darkvisionFt": 60
  },
  "saves": [
   "dex",
   "con"
  ],
  "skills": [
   "furtividade"
  ],
  "expertise": [],
  "damageResistances": [
   "frio"
  ],
  "damageImmunities": [
   "psíquico"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "amedrontado",
   "caido"
  ],
  "attacks": [
   {
    "name": "Garra",
    "bonus": 7,
    "damage": "1d8+4",
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
    "Garra",
    "Garra"
   ]
  },
  "traits": [
   "t_rajadaDeGarras",
   "emboscador",
   "furtividadeNasSombras"
  ],
  "blurb": "Predador furtivo que se esconde nas sombras e surge de emboscada, despejando uma saraivada de garras sobre um único alvo. Quando ataca com vantagem, cada golpe também fere a mente da vítima.",
  "lore": "O mutilador é uma aberração magra e de muitos braços, nascida da influência de entidades vindas de além das estrelas. Ele espreita em lugares escuros, como cavernas, ruínas e os arredores de cultos que adoram horrores cósmicos. Prefere atacar antes que a presa perceba o perigo, retalhando-a com uma fúria de garras e depois sumindo de novo na escuridão. Fala apenas o Dialeto Subterrâneo e quase nunca negocia."
 },
 "videnteCriaEstelar": {
  "id": "videnteCriaEstelar",
  "tipo": "aberração",
  "name": "Vidente Cria Estelar",
  "nomeOriginal": "Star Spawn Seer",
  "fonte": "MTF",
  "size": "médio",
  "level": 13,
  "cr": "13",
  "xp": 10000,
  "abilities": {
   "str": 14,
   "dex": 12,
   "con": 18,
   "int": 22,
   "wis": 19,
   "cha": 16
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 153,
  "hpDice": "18d8+72",
  "speedFt": 30,
  "senses": {
   "passivePerception": 19,
   "darkvisionFt": 60
  },
  "saves": [
   "dex",
   "int",
   "wis",
   "cha"
  ],
  "skills": [
   "percepcao"
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
   "psíquico"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "amedrontado"
  ],
  "attacks": [
   {
    "name": "Cajado Cometa",
    "bonus": 11,
    "damage": "1d6+6",
    "type": "concussão",
    "reachFt": 5,
    "danoExtra": {
     "damage": "4d8",
     "type": "psíquico"
    },
    "onHit": {
     "save": "con",
     "dc": 19,
     "condition": "incapacitado",
     "rounds": 1,
     "repete": false
    }
   },
   {
    "name": "Orbe Psíquico",
    "bonus": 11,
    "damage": "5d10",
    "type": "psíquico",
    "reachFt": 5,
    "ranged": true
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Cajado Cometa",
    "Cajado Cometa"
   ]
  },
  "acoesEspeciais": [
   {
    "nome": "Colapsar Distância",
    "recharge": [
     6
    ],
    "tipo": "alvo",
    "alcanceFt": 30,
    "save": "wis",
    "dc": 19,
    "damage": "6d12",
    "damageType": "psíquico",
    "halfOnSave": false
   }
  ],
  "traits": [
   "incorporealMovement",
   "t_dobrarOEspaco"
  ],
  "blurb": "Conjurador alienígena que dispara orbes psíquicos à distância e golpeia com um cajado que pode deixar o alvo incapacitado. Também distorce o espaço para arremessar inimigos e ferir quem estiver perto deles.",
  "lore": "Os videntes são crias estelares que servem de profetas e líderes para os cultos que adoram entidades de além das estrelas. Têm forma vagamente humana, mas a mente e o corpo foram moldados por forças cósmicas incompreensíveis. Costumam ficar em montanhas, pântanos ou nos subterrâneos das cidades, conduzindo rituais que preparam a chegada de seus mestres. Manipulam o espaço com facilidade e usam outras crias como escudos sem hesitar."
 },
 "predadorDeAco": {
  "id": "predadorDeAco",
  "tipo": "constructo",
  "name": "Predador de Aço",
  "nomeOriginal": "Steel Predator",
  "fonte": "MTF",
  "size": "grande",
  "level": 13,
  "cr": "16",
  "xp": 15000,
  "abilities": {
   "str": 24,
   "dex": 17,
   "con": 22,
   "int": 4,
   "wis": 14,
   "cha": 6
  },
  "ac": 20,
  "acNote": "armadura natural",
  "maxHp": 207,
  "hpDice": "18d10+108",
  "speedFt": 40,
  "senses": {
   "passivePerception": 17,
   "blindsightFt": 30,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "percepcao",
   "furtividade",
   "sobrevivencia"
  ],
  "expertise": [],
  "damageResistances": [
   "frio",
   "elétrico",
   "necrótico",
   "trovejante"
  ],
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
   "envenenado",
   "atordoado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 12,
    "damage": "2d6+7",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Garra",
    "bonus": 12,
    "damage": "2d8+7",
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
   "ability": "wis",
   "cantrips": [],
   "prepared": [
    "dimensaoPorta",
    "viagemPlanar"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "dimensaoPorta": 3,
    "viagemPlanar": 3
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Rugido Atordoante",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 60,
    "save": "con",
    "dc": 19,
    "damage": "5d10",
    "damageType": "trovejante",
    "halfOnSave": true,
    "condition": "atordoado",
    "rounds": 10,
    "repete": true
   }
  ],
  "traits": [
   "resistenciaAMagia",
   "armasMagicas"
  ],
  "blurb": "Caçador mecânico que avança com mordida e garras brutais e solta um rugido em cone capaz de atordoar um grupo inteiro. Resiste a magia e ignora armas não mágicas.",
  "lore": "O predador de aço é um assassino construído sob encomenda por um hexton modron renegado, exilado de Mechanus e hoje dono de uma oficina em Sigil. Para fabricá-lo, a máquina do hexton recebe um objeto ligado à vítima, e a criatura sai em disparada atrás dela, sentindo sua posição até através dos planos. Em combate, concentra-se apenas no alvo e só ataca outros se eles atrapalharem. Concluída a missão, volta a Sigil para ser desmontado, mas um predador danificado pode enlouquecer e caçar qualquer um parecido com a presa original. Não precisa respirar, comer, beber nem dormir."
 },
 "amaldicoadoDePedra": {
  "id": "amaldicoadoDePedra",
  "tipo": "constructo",
  "name": "Amaldiçoado de Pedra",
  "nomeOriginal": "Stone Cursed",
  "fonte": "MTF",
  "size": "médio",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 16,
   "dex": 5,
   "con": 14,
   "int": 5,
   "wis": 8,
   "cha": 7
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 19,
  "hpDice": "3d8+4",
  "speedFt": 10,
  "senses": {
   "passivePerception": 9
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
   "enfeitiçado",
   "exausto",
   "amedrontado",
   "petrificado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Garras Petrificantes",
    "bonus": 5,
    "damage": "1d10+3",
    "type": "cortante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "2d10+3",
     "type": "cortante"
    },
    "onHit": {
     "save": "con",
     "dc": 12,
     "condition": "contido",
     "rounds": 1,
     "repete": true
    }
   }
  ],
  "traits": [
   "t_oportunistaAstuto",
   "aparenciaFalsa"
  ],
  "blurb": "Estátua lenta que pune quem tenta se afastar, com vantagem em ataques de oportunidade; suas garras podem petrificar o alvo. É vulnerável a dano de concussão.",
  "lore": "É uma vítima petrificada reanimada por um ritual alquímico que mistura sangue de basilisco e cinzas de penas de cocatriz, despertando um eco tênue do espírito original. Serve com lealdade total a quem a criou, mas carrega um ódio cruel por tudo que vive. Em combate, garras de pedra cobertas de uma lama cinzenta brotam de seus dedos e transformam em estátua quem cortam. Ao ser destruída, deixa cair um crânio de obsidiana que guarda fragmentos das memórias da vítima, que um conjurador habilidoso pode tentar consultar. Não precisa de ar, comida, bebida nem sono."
 },
 "defensorDePedra": {
  "id": "defensorDePedra",
  "tipo": "constructo",
  "name": "Defensor de Pedra",
  "nomeOriginal": "Stone Defender",
  "fonte": "MTF",
  "size": "médio",
  "level": 1,
  "cr": "4",
  "xp": 1100,
  "abilities": {
   "str": 19,
   "dex": 10,
   "con": 17,
   "int": 3,
   "wis": 10,
   "cha": 1
  },
  "ac": 16,
  "acNote": "armadura natural",
  "maxHp": 52,
  "hpDice": "7d8+21",
  "speedFt": 30,
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
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
   "petrificado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Pancada",
    "bonus": 6,
    "damage": "2d6+4",
    "type": "concussão",
    "reachFt": 5
   }
  ],
  "traits": [
   "aparenciaFalsa",
   "resistenciaAMagia",
   "t_interceptarAtaque"
  ],
  "blurb": "Construto de pedra que derruba os inimigos com pancadas pesadas e protege os aliados próximos, desviando golpes que os acertariam. Resiste a magia e ignora armas comuns que não sejam de adamante.",
  "lore": "O defensor de pedra é um guardião mecânico revestido de rocha, criado por gnomos engenhosos para vigiar suas tocas e oficinas. Quando fica parado junto a paredes de pedra ou barrancos de terra, confunde-se com a paisagem. Não fala, mas obedece às ordens do criador em um idioma que compreende. Seu papel é proteger quem está ao seu lado, colocando o próprio corpo entre o aliado e o perigo."
 },
 "eladrinDoVerao": {
  "id": "eladrinDoVerao",
  "tipo": "feérico",
  "name": "Eladrin do Verão",
  "nomeOriginal": "Summer Eladrin",
  "fonte": "MTF",
  "size": "médio",
  "level": 9,
  "cr": "10",
  "xp": 5900,
  "abilities": {
   "str": 19,
   "dex": 21,
   "con": 16,
   "int": 14,
   "wis": 12,
   "cha": 18
  },
  "ac": 19,
  "acNote": "armadura natural",
  "maxHp": 127,
  "hpDice": "17d8+51",
  "speedFt": 50,
  "senses": {
   "passivePerception": 11,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "atletismo",
   "intimidacao"
  ],
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
    "name": "Espada Longa",
    "bonus": 8,
    "damage": "2d8+4",
    "type": "cortante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d8",
     "type": "fogo"
    }
   },
   {
    "name": "Arco Longo",
    "bonus": 9,
    "damage": "2d8+5",
    "type": "perfurante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 150,
    "longRangeFt": 600,
    "danoExtra": {
     "damage": "1d8",
     "type": "fogo"
    }
   }
  ],
  "multiattack": {
   "count": 2
  },
  "acoesEspeciais": [
   {
    "nome": "Passo Feérico",
    "recharge": [
     4,
     5,
     6
    ],
    "tipo": "teleporte",
    "alcanceFt": 30,
    "bonus": true
   }
  ],
  "aura": {
   "raioFt": 60,
   "quando": "inicioDoAlvo",
   "save": "wis",
   "dc": 16,
   "condition": "amedrontado",
   "rounds": 10,
   "repete": true
  },
  "traits": [
   "aura",
   "t_passoFeerico",
   "resistenciaAMagia",
   "aparar"
  ],
  "blurb": "Guerreiro feérico veloz que alterna espada longa e arco longo, ambos com dano extra de fogo, e se teleporta pelo campo de batalha. Sua presença aterradora amedronta quem se aproxima, e ele apara golpes corpo a corpo.",
  "lore": "Eladrins do verão são elfos feéricos tomados pela estação do calor, ardentes, impetuosos e sempre prontos para a luta. Vivem em regiões ligadas à Agrestia das Fadas, como florestas e desertos, onde a fúria do sol de verão se manifesta. Movem-se pela paixão do combate e intimidam adversários com sua simples presença. Seu humor pode mudar de estação com o tempo, mas enquanto o verão os domina, buscam desafios e glória."
 },
 "comandanteEspectroDaEspada": {
  "id": "comandanteEspectroDaEspada",
  "tipo": "morto-vivo",
  "name": "Comandante Espectro da Espada",
  "nomeOriginal": "Sword Wraith Commander",
  "fonte": "MTF",
  "size": "médio",
  "level": 5,
  "cr": "8",
  "xp": 3900,
  "abilities": {
   "str": 18,
   "dex": 14,
   "con": 18,
   "int": 11,
   "wis": 12,
   "cha": 14
  },
  "ac": 18,
  "acNote": "peitoral e escudo",
  "maxHp": 127,
  "hpDice": "15d8+60",
  "speedFt": 30,
  "senses": {
   "passivePerception": 14,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "damageResistances": [
   "necrótico",
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
   "amedrontado",
   "envenenado",
   "inconsciente"
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
    }
   },
   {
    "name": "Arco Longo",
    "bonus": 5,
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
  "acoesEspeciais": [
   {
    "nome": "Fúria Marcial",
    "tipo": "golpeBonus",
    "extra": "2d8",
    "extraTipo": "necrótico",
    "exposto": true,
    "bonus": true
   }
  ],
  "traits": [
   "t_chamadoAHonra",
   "t_furiaMarcial",
   "t_desafioAoExpulsar"
  ],
  "blurb": "Guerreiro morto-vivo que golpeia duas vezes com a espada longa e pode arriscar a guarda para um ataque extra carregado de energia necrótica. Ferido, ergue do chão uma tropa de espectros guerreiros para lutar ao seu lado.",
  "lore": "Espectros da espada são soldados mortos cuja sede de glória e disciplina militar sobreviveram à própria morte. O comandante foi um líder em vida e continua organizando suas fileiras fantasmagóricas em velhos campos de batalha, sejam planícies ou pântanos. Ele despreza a covardia e busca combates que o honrem. Mantém o idioma que falava em vida e raramente recua."
 },
 "guerreiroEspectroDaEspada": {
  "id": "guerreiroEspectroDaEspada",
  "tipo": "morto-vivo",
  "name": "Guerreiro Espectro da Espada",
  "nomeOriginal": "Sword Wraith Warrior",
  "fonte": "MTF",
  "size": "médio",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 18,
   "dex": 12,
   "con": 17,
   "int": 6,
   "wis": 9,
   "cha": 10
  },
  "ac": 16,
  "acNote": "camisão de malha e escudo",
  "maxHp": 45,
  "hpDice": "6d8+18",
  "speedFt": 30,
  "senses": {
   "passivePerception": 9,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "necrótico",
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
   "amedrontado",
   "envenenado",
   "inconsciente"
  ],
  "attacks": [
   {
    "name": "Espada Longa",
    "bonus": 6,
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
    "bonus": 3,
    "damage": "1d8+1",
    "type": "perfurante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 150,
    "longRangeFt": 600
   }
  ],
  "acoesEspeciais": [
   {
    "nome": "Fúria Marcial",
    "tipo": "golpeBonus",
    "exposto": true,
    "bonus": true
   }
  ],
  "traits": [
   "t_furiaMarcial"
  ],
  "blurb": "Combatente morto-vivo incansável que golpeia com espada longa e pode atacar de novo com ação bônus, ficando mais exposto ao fazê-lo. Resiste a armas comuns e não se assusta nem se cansa.",
  "lore": "Espectros da espada são guerreiros cuja sede de glória e de batalha não terminou com a morte. Erguem-se nos antigos campos de combate, em planícies e pântanos, ainda vestindo o equipamento que usavam em vida. Obedecem a uma rígida disciplina marcial e costumam seguir comandantes poderosos. Lutam sem medo nem descanso, buscando um confronto digno que nunca os satisfaz."
 },
 "oRaivoso": {
  "id": "oRaivoso",
  "tipo": "monstruosidade",
  "name": "O Raivoso",
  "nomeOriginal": "The Angry",
  "fonte": "MTF",
  "size": "médio",
  "level": 13,
  "cr": "13",
  "xp": 10000,
  "abilities": {
   "str": 17,
   "dex": 10,
   "con": 19,
   "int": 8,
   "wis": 13,
   "cha": 6
  },
  "ac": 18,
  "acNote": "armadura natural",
  "maxHp": 255,
  "hpDice": "30d8+120",
  "speedFt": 30,
  "senses": {
   "passivePerception": 16,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "damageResistances": [
   "concussão",
   "perfurante",
   "cortante"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Gancho",
    "bonus": 8,
    "damage": "2d12+3",
    "type": "perfurante",
    "reachFt": 5
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
   "t_duasCabecas",
   "t_furiaCrescente"
  ],
  "blurb": "Brutamontes de duas cabeças que ataca com ganchos e fica mais perigoso quando é ferido: cada golpe recebido lhe dá vantagem e dano psíquico extra. Se ninguém o machucar, ele luta com desvantagem.",
  "lore": "O Raivoso é um dos Sorrowsworn, criaturas nascidas da Umbra (Shadowfell) que encarnam emoções sombrias. Ele personifica a fúria que se alimenta de si mesma, com duas cabeças que vivem discutindo e gritando uma com a outra. Ronda o Subterrâneo e becos de cidades, atraído por lugares onde a raiva ferve. Quanto mais o provocam, mais violento ele fica, e na penumbra suas carnes resistem a armas comuns."
 },
 "oFaminto": {
  "id": "oFaminto",
  "tipo": "monstruosidade",
  "name": "O Faminto",
  "nomeOriginal": "The Hungry",
  "fonte": "MTF",
  "size": "médio",
  "level": 9,
  "cr": "11",
  "xp": 7200,
  "abilities": {
   "str": 19,
   "dex": 10,
   "con": 17,
   "int": 6,
   "wis": 11,
   "cha": 6
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 225,
  "hpDice": "30d8+90",
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
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 8,
    "damage": "1d8+4",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "3d8",
     "type": "necrótico"
    }
   },
   {
    "name": "Garras",
    "bonus": 8,
    "damage": "4d6+4",
    "type": "cortante",
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
   "count": 2,
   "sequence": [
    "Mordida",
    "Garras"
   ]
  },
  "traits": [
   "t_fomeDeVida"
  ],
  "blurb": "Agarra presas com garras de longo alcance e as rasga com mordidas necróticas. Fica ainda mais letal quando alguém por perto recupera PV, então curar diante dele é arriscado.",
  "lore": "O Faminto é um dos lamentados, criaturas nascidas no Pendor Sombrio a partir das angústias de quem vaga por aquele plano sombrio. Encarna a fome que nunca se satisfaz e devora tanto a carne quanto a força vital das vítimas. Costuma rondar florestas, cidades e as profundezas do Subterrâneo. Prefere caçar na penumbra, onde seu corpo se torna quase imune a armas comuns."
 },
 "oSolitario": {
  "id": "oSolitario",
  "tipo": "monstruosidade",
  "name": "O Solitário",
  "nomeOriginal": "The Lonely",
  "fonte": "MTF",
  "size": "médio",
  "level": 9,
  "cr": "9",
  "xp": 5000,
  "abilities": {
   "str": 16,
   "dex": 12,
   "con": 17,
   "int": 6,
   "wis": 11,
   "cha": 6
  },
  "ac": 16,
  "acNote": "armadura natural",
  "maxHp": 112,
  "hpDice": "15d8+45",
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
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Braço-Arpão",
    "bonus": 7,
    "damage": "4d8+3",
    "type": "perfurante",
    "reachFt": 60,
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
   "count": 1,
   "sequence": [
    "Braço-Arpão"
   ]
  },
  "acoesEspeciais": [
   {
    "nome": "Abraço Pesaroso",
    "tipo": "puxarAgarrados",
    "pes": 30
   }
  ],
  "aura": {
   "raioFt": 5,
   "quando": "inicioDoDono",
   "save": "wis",
   "dc": 15,
   "damage": "3d6",
   "damageType": "psíquico"
  },
  "traits": [
   "aura",
   "t_prosperaNaCompanhia"
  ],
  "blurb": "Arpoa vítimas a até 18 m com seus braços farpados, agarra até duas criaturas e as arrasta para perto enquanto drena suas mentes com dano psíquico. Luta melhor cercado de gente e resiste a armas comuns na penumbra ou escuridão.",
  "lore": "O Solitário é um dos Sorrowsworn, criaturas nascidas da Umbra Sombria que encarnam emoções sombrias. Ele anseia por companhia, mas qualquer ser que se aproxima acaba ferido por sua presença. Costuma se esconder em lugares ermos, fingindo fragilidade até lançar seus arpões contra quem passar. Depois puxa as presas para um abraço que esmaga a mente, condenado a destruir aquilo que deseja."
 },
 "oPerdido": {
  "id": "oPerdido",
  "tipo": "monstruosidade",
  "name": "O Perdido",
  "nomeOriginal": "The Lost",
  "fonte": "MTF",
  "size": "médio",
  "level": 5,
  "cr": "7",
  "xp": 2900,
  "abilities": {
   "str": 17,
   "dex": 12,
   "con": 15,
   "int": 6,
   "wis": 7,
   "cha": 5
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 78,
  "hpDice": "12d8+24",
  "speedFt": 30,
  "senses": {
   "passivePerception": 8,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "atletismo"
  ],
  "expertise": [],
  "damageResistances": [
   "concussão",
   "perfurante",
   "cortante"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Espinho do Braço",
    "bonus": 6,
    "damage": "2d10+3",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Abraço",
    "bonus": 6,
    "damage": "4d10+3",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "6d8",
     "type": "psíquico"
    },
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
    "Espinho do Braço",
    "Espinho do Braço"
   ]
  },
  "traits": [
   "t_abracoApertado"
  ],
  "blurb": "Golpeia com espinhos nos braços e tenta abraçar a vítima, prendendo-a e corroendo sua mente com dano psíquico a cada turno. Fica mais resistente a golpes físicos na penumbra e no escuro, e ferir o Perdido também machuca quem ele segura.",
  "lore": "O Perdido é um dos Sorrowsworn, criaturas nascidas da desolação do Pendor das Sombras. Ele encarna o desespero de quem se afastou de tudo o que conhecia e já não encontra o caminho de volta. Sua figura é humanoide, com braços cobertos de espinhos que se cravam em quem ele envolve. Vaga por ermos e cidades em busca de alguém para agarrar, como se o abraço pudesse aliviar o próprio vazio, mas só espalha agonia."
 },
 "oDesgracado": {
  "id": "oDesgracado",
  "tipo": "monstruosidade",
  "name": "O Desgraçado",
  "nomeOriginal": "The Wretched",
  "fonte": "MTF",
  "size": "pequeno",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 7,
   "dex": 12,
   "con": 9,
   "int": 5,
   "wis": 6,
   "cha": 5
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 10,
  "hpDice": "4d6-4",
  "speedFt": 40,
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
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 3,
    "damage": "1d10+1",
    "type": "perfurante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d10+1",
     "type": "necrótico"
    }
   }
  ],
  "traits": [
   "packTactics"
  ],
  "blurb": "Caça em bando: só acerta bem quando um aliado está colado no alvo, e então crava os dentes e fica preso, drenando vida a cada turno. Na penumbra ou no escuro, resiste a armas comuns.",
  "lore": "Os Desgraçados são os mais fracos dos lamentosos, criaturas nascidas da tristeza e da escuridão do Pendor das Sombras. Pequenos e famintos, andam sempre em grupos, porque sozinhos mal conseguem ferir alguém. Rondam pântanos, cidades decadentes e o Subterrâneo, cercando presas isoladas. Quando mordem, agarram-se à vítima e sugam sua força vital até serem arrancados."
 },
 "titivilus": {
  "id": "titivilus",
  "tipo": "corruptor",
  "name": "Titivilus",
  "nomeOriginal": "Titivilus",
  "fonte": "MTF",
  "size": "médio",
  "level": 13,
  "cr": "16",
  "xp": 15000,
  "abilities": {
   "str": 19,
   "dex": 22,
   "con": 17,
   "int": 24,
   "wis": 22,
   "cha": 26
  },
  "ac": 20,
  "acNote": "armadura natural",
  "maxHp": 127,
  "hpDice": "17d8+51",
  "speedFt": 40,
  "flyFt": 60,
  "speeds": {
   "flyFt": 60
  },
  "senses": {
   "passivePerception": 16,
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
   "intimidacao",
   "persuasao"
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
   "enfeitiçado",
   "exausto",
   "amedrontado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Espada de Prata",
    "bonus": 9,
    "damage": "1d8+4",
    "type": "cortante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "3d10",
     "type": "necrótico"
    }
   }
  ],
  "multiattack": {
   "count": 1,
   "sequence": [
    "Espada de Prata"
   ]
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "invisibilidadeMaior",
    "despistar",
    "enfraquecerOIntelecto",
    "alterarAparencia",
    "animarMortos",
    "rogarMaldicao",
    "confusao",
    "imagemMaior",
    "modificarMemoria",
    "indetectavel",
    "enviarMensagem",
    "sugestao"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "invisibilidadeMaior": 3,
    "despistar": 3,
    "enfraquecerOIntelecto": 1
   },
   "aVontade": [
    "alterarAparencia",
    "animarMortos",
    "rogarMaldicao",
    "confusao",
    "imagemMaior",
    "modificarMemoria",
    "indetectavel",
    "enviarMensagem",
    "sugestao"
   ],
   "cdPorMagia": {
    "invisibilidadeMaior": 21,
    "despistar": 21,
    "enfraquecerOIntelecto": 21,
    "alterarAparencia": 21,
    "animarMortos": 21,
    "rogarMaldicao": 21,
    "confusao": 21,
    "imagemMaior": 21,
    "modificarMemoria": 21,
    "indetectavel": 21,
    "enviarMensagem": 21,
    "sugestao": 21
   }
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "acoesEspeciais": [
   {
    "nome": "Palavra Aterradora",
    "tipo": "alvo",
    "alcanceFt": 10,
    "save": "wis",
    "dc": 21,
    "condition": "amedrontado",
    "rounds": 10,
    "repete": true
   },
   {
    "nome": "Teletransporte",
    "tipo": "teleporte",
    "alcanceFt": 120
   },
   {
    "nome": "Palavras Distorcidas",
    "tipo": "alvo",
    "alcanceFt": 60,
    "save": "cha",
    "dc": 21,
    "condition": "enfeiticado",
    "rounds": 10,
    "repete": true
   }
  ],
  "regeneracao": {
   "pv": 10,
   "bloqueia": [
    "frio",
    "radiante"
   ]
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Investida",
     "custo": 2,
     "tipo": "golpe",
     "arma": "Espada de Prata"
    },
    {
     "nome": "Orientação Corruptora",
     "custo": 1,
     "tipo": "especial",
     "acao": "Palavras Distorcidas"
    },
    {
     "nome": "Teletransporte",
     "custo": 1,
     "tipo": "teleporte",
     "alcanceFt": 120
    }
   ]
  },
  "traits": [
   "resistenciaAMagia",
   "armasMagicas",
   "regeneracaoDoLivro",
   "t_ventriloquismo",
   "acoesLendarias"
  ],
  "blurb": "Manipulador que luta com palavras: enfeitiça, assusta e manda os inimigos fugirem enquanto sua espada de prata drena o PV máximo. Regenera, se teletransporta e resiste a magia, então é difícil de encurralar.",
  "lore": "Titivilus é o arquidiabo conselheiro de Dispater, senhor do segundo círculo dos Nove Infernos, e hoje é o segundo poder na cidade de Dis. Fraco em força bruta para um arquidiabo, subiu na hierarquia só com lábia, dizendo a coisa certa na hora certa. Alimentou a paranoia de Dispater até que o mestre se trancasse no palácio, deixando o governo e os pactos com mortais nas mãos do conselheiro, o que faz alguns suspeitarem que ele tomou o lugar do arquiduque. Sabendo que sua posição é frágil, recruta aventureiros como peões descartáveis para eliminar rivais e criar problemas que só ele resolve."
 },
 "tortle": {
  "id": "tortle",
  "tipo": "humanoide",
  "name": "Tortle",
  "nomeOriginal": "Tortle",
  "fonte": "MTF",
  "size": "médio",
  "level": 1,
  "cr": "1/4",
  "xp": 50,
  "abilities": {
   "str": 15,
   "dex": 10,
   "con": 12,
   "int": 11,
   "wis": 13,
   "cha": 12
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 22,
  "hpDice": "4d8+4",
  "speedFt": 30,
  "senses": {
   "passivePerception": 11
  },
  "saves": [],
  "skills": [
   "atletismo",
   "sobrevivencia"
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
   },
   {
    "name": "Bordão",
    "bonus": 4,
    "damage": "1d6+2",
    "type": "concussão",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d8+2",
     "type": "concussão"
    }
   },
   {
    "name": "Besta Leve",
    "bonus": 2,
    "damage": "1d8",
    "type": "perfurante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 80,
    "longRangeFt": 320
   }
  ],
  "acoesEspeciais": [
   {
    "nome": "Defesa do Casco",
    "tipo": "concha",
    "ca": 4
   }
  ],
  "traits": [],
  "blurb": "Humanoide-tartaruga resistente que luta com garras, bordão ou besta leve. Quando a luta aperta, recolhe-se no casco e fica muito difícil de ferir.",
  "lore": "Os tortles são humanoides com aparência de tartaruga que carregam a própria casa nas costas. Vivem em litorais e ilhas, levando uma vida errante e simples, sempre atentos ao mar e à natureza. Costumam ser honrados, pacientes e de boa índole, valorizando a jornada mais que o destino. Mergulham com facilidade e passam longos períodos sob a água."
 },
 "druidaTortle": {
  "id": "druidaTortle",
  "tipo": "humanoide",
  "name": "Druida Tortle",
  "nomeOriginal": "Tortle Druid",
  "fonte": "MTF",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 14,
   "dex": 10,
   "con": 12,
   "int": 11,
   "wis": 15,
   "cha": 12
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 33,
  "hpDice": "6d8+6",
  "speedFt": 30,
  "senses": {
   "passivePerception": 12
  },
  "saves": [],
  "skills": [
   "lidarComAnimais",
   "natureza",
   "sobrevivencia"
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
   },
   {
    "name": "Bordão",
    "bonus": 4,
    "damage": "1d6+2",
    "type": "concussão",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d8+2",
     "type": "concussão"
    }
   }
  ],
  "spellcasting": {
   "ability": "wis",
   "cantrips": [
    "arteDruidica",
    "orientacao",
    "produzirChama"
   ],
   "prepared": [
    "amizadeAnimal",
    "curarFerimentos",
    "falarComAnimais",
    "ondaTrovejante",
    "visaoNoEscuro",
    "imobilizarPessoa"
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
    "orientacao": 12,
    "produzirChama": 12,
    "amizadeAnimal": 12,
    "curarFerimentos": 12,
    "falarComAnimais": 12,
    "ondaTrovejante": 12,
    "visaoNoEscuro": 12,
    "imobilizarPessoa": 12
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Defesa do Casco",
    "tipo": "concha",
    "ca": 4
   }
  ],
  "traits": [],
  "blurb": "Druida resistente que cura aliados, paralisa inimigos com Imobilizar Pessoa e empurra grupos com Onda Trovejante. Quando aperta, recolhe-se no casco e fica com CA 21.",
  "lore": "Tortles são humanoides com aparência de tartaruga que vivem em litorais e ilhas, levando a casa nas costas. Os druidas desse povo cultivam laços com animais e com o mar, guiando viajantes e protegendo seus territórios costeiros. São pacientes e metódicos, preferem conversar com as feras a lutar contra elas e só recorrem à magia de combate quando não têm escolha."
 },
 "nevoaVampirica": {
  "id": "nevoaVampirica",
  "tipo": "morto-vivo",
  "name": "Névoa Vampírica",
  "nomeOriginal": "Vampiric Mist",
  "fonte": "MTF",
  "size": "médio",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 6,
   "dex": 16,
   "con": 16,
   "int": 6,
   "wis": 12,
   "cha": 7
  },
  "ac": 13,
  "maxHp": 30,
  "hpDice": "4d8+12",
  "speedFt": 0,
  "flyFt": 30,
  "hover": true,
  "speeds": {
   "flyFt": 30
  },
  "senses": {
   "passivePerception": 11,
   "darkvisionFt": 60
  },
  "saves": [
   "wis"
  ],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "ácido",
   "frio",
   "elétrico",
   "necrótico",
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
   "enfeitiçado",
   "exausto",
   "agarrado",
   "paralisado",
   "petrificado",
   "envenenado",
   "caido",
   "contido"
  ],
  "acoesEspeciais": [
   {
    "nome": "Drenar Vida",
    "tipo": "area",
    "shape": "raio",
    "areaFt": 5,
    "reduzMaximo": true,
    "save": "con",
    "dc": 13,
    "damage": "2d6+3",
    "damageType": "necrótico",
    "halfOnSave": false
   }
  ],
  "traits": [
   "t_sentirVida",
   "t_proibicao",
   "formaFluida",
   "sunlightSensitivity"
  ],
  "blurb": "Nuvem flutuante que invade o espaço da vítima e drena sua vida, curando-se e reduzindo o máximo de PV do alvo. Resiste a armas comuns, mas sofre muito sob a luz do sol.",
  "lore": "Restos de vampiros que, derrotados ou azarados, não conseguiram voltar a seus túmulos e se desfizeram em névoa, perdendo mente e personalidade. Sobra apenas uma sede insaciável de sangue. Confunde-se com a neblina comum, exceto pelo cheiro de cemitério, e faz o sangue da presa escorrer pelos poros e ser absorvido sem dor, podendo se alimentar de quem dorme. Fareja ferimentos a mais de um quilômetro e prefere atacar os já feridos; quanto mais come, mais vermelha fica, até gotejar sangue. Não precisa respirar nem dormir."
 },
 "trollVenenoso": {
  "id": "trollVenenoso",
  "tipo": "gigante",
  "name": "Troll Venenoso",
  "nomeOriginal": "Venom Troll",
  "fonte": "MTF",
  "size": "grande",
  "level": 5,
  "cr": "7",
  "xp": 2900,
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
  "maxHp": 94,
  "hpDice": "9d10+45",
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
     "damage": "1d8",
     "type": "veneno"
    }
   },
   {
    "name": "Garras",
    "bonus": 7,
    "damage": "2d6+4",
    "type": "cortante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d8",
     "type": "veneno"
    }
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
  "acoesEspeciais": [
   {
    "nome": "Jato de Veneno",
    "recharge": [
     6
    ],
    "tipo": "area",
    "shape": "cube",
    "areaFt": 15,
    "save": "con",
    "dc": 16,
    "damage": "2d6",
    "damageType": "cortante",
    "halfOnSave": true,
    "condition": "envenenado",
    "rounds": 10,
    "repete": true
   }
  ],
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
   "t_respingoVenenoso",
   "regeneracaoDoLivro"
  ],
  "blurb": "Briga corpo a corpo com mordida e garras envenenadas e, sempre que é ferido, espirra veneno em quem está colado nele. Regenera a cada turno, e só fogo ou ácido interrompem a cura.",
  "lore": "É um troll cuja carne absorveu toxinas, seja por comer criaturas venenosas, seja por viver em pântanos e cavernas contaminadas. O sangue dele virou um veneno que queima a pele e os pulmões. Ronda florestas sombrias, brejos e o Subterrâneo atrás de presas. Ataca com fúria e não teme se cortar, porque cada ferida vira uma arma contra quem está por perto."
 },
 "wastrilith": {
  "id": "wastrilith",
  "tipo": "corruptor",
  "name": "Wastrilith",
  "nomeOriginal": "Wastrilith",
  "fonte": "MTF",
  "size": "grande",
  "level": 13,
  "cr": "13",
  "xp": 10000,
  "abilities": {
   "str": 19,
   "dex": 18,
   "con": 21,
   "int": 19,
   "wis": 12,
   "cha": 14
  },
  "ac": 18,
  "acNote": "armadura natural",
  "maxHp": 157,
  "hpDice": "15d10+75",
  "speedFt": 30,
  "speeds": {
   "swimFt": 80
  },
  "senses": {
   "passivePerception": 11,
   "darkvisionFt": 120
  },
  "saves": [
   "str",
   "con"
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
    "bonus": 9,
    "damage": "4d12+4",
    "type": "perfurante",
    "reachFt": 10
   },
   {
    "name": "Garras",
    "bonus": 9,
    "damage": "4d6+4",
    "type": "cortante",
    "reachFt": 10
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
  "acoesEspeciais": [
   {
    "nome": "Jato Agarrador",
    "tipo": "alvo",
    "alcanceFt": 60,
    "save": "str",
    "dc": 17,
    "damage": "4d8+4",
    "damageType": "ácido",
    "halfOnSave": true
   }
  ],
  "traits": [
   "t_aguaCorrompida",
   "resistenciaAMagia",
   "t_correnteza"
  ],
  "blurb": "Demônio aquático que puxa vítimas com jatos de água ácida e as despedaça com mordida e garras de longo alcance. A água ao seu redor vira veneno e, submerso, ele transforma o mar em terreno difícil.",
  "lore": "O wastrilith é um demônio das águas do Abismo e de qualquer lago, pântano ou mar tocado pela influência desse plano. Ele se impõe como senhor das profundezas e governa seus domínios com crueldade. Sua simples presença apodrece a água próxima, mesmo quando ele se desloca por terra, e essa água contaminada carrega parte de sua essência e obedece às suas vontades. Quem bebe dela pode definhar até a morte ou acabar servindo ao caos, e a mancha deixada pode durar décadas e até abrir caminho para o Abismo."
 },
 "mirmidaoElementalDaAgua": {
  "id": "mirmidaoElementalDaAgua",
  "tipo": "elemental",
  "name": "Mirmidão Elemental da Água",
  "nomeOriginal": "Water Elemental Myrmidon",
  "fonte": "MTF",
  "size": "médio",
  "level": 5,
  "cr": "7",
  "xp": 2900,
  "abilities": {
   "str": 18,
   "dex": 14,
   "con": 15,
   "int": 8,
   "wis": 10,
   "cha": 10
  },
  "ac": 18,
  "acNote": "armadura de placas",
  "maxHp": 127,
  "hpDice": "17d8+51",
  "speedFt": 40,
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
   "paralisado",
   "petrificado",
   "envenenado",
   "caido"
  ],
  "attacks": [
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
   "count": 3,
   "sequence": [
    "Tridente",
    "Tridente",
    "Tridente"
   ]
  },
  "traits": [
   "t_golpesCongelantes",
   "armasMagicas"
  ],
  "blurb": "Guerreiro de água viva que golpeia três vezes com seu tridente mágico; de tempos em tempos, seus ataques congelam o alvo, causando frio extra e deixando-o mais lento.",
  "lore": "É um elemental da água preso dentro de uma armadura encantada e forjado em um ritual para servir como soldado. Obedece ao criador com disciplina absoluta e luta com a precisão de um veterano. Costuma guardar templos, fortalezas costeiras e portais ligados ao Plano Elemental da Água. Não se cansa e não teme a morte, avançando em formação até cumprir a ordem recebida."
 },
 "abishaiBranco": {
  "id": "abishaiBranco",
  "tipo": "corruptor",
  "name": "Abishai Branco",
  "nomeOriginal": "White Abishai",
  "fonte": "MTF",
  "size": "médio",
  "level": 5,
  "cr": "6",
  "xp": 2300,
  "abilities": {
   "str": 16,
   "dex": 11,
   "con": 18,
   "int": 11,
   "wis": 12,
   "cha": 13
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 68,
  "hpDice": "8d8+32",
  "speedFt": 30,
  "flyFt": 40,
  "speeds": {
   "flyFt": 40
  },
  "senses": {
   "passivePerception": 11,
   "darkvisionFt": 120
  },
  "saves": [
   "str",
   "con"
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
   "frio",
   "fogo",
   "veneno"
  ],
  "conditionImmunities": [
   "envenenado"
  ],
  "attacks": [
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
    "name": "Garra",
    "bonus": 6,
    "damage": "1d10+3",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Mordida",
    "bonus": 6,
    "damage": "1d4+3",
    "type": "perfurante",
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
    "Espada Longa",
    "Garra"
   ]
  },
  "features": [
   "devilsSight"
  ],
  "revide": {
   "nome": "Represália Cruel",
   "arma": "Mordida",
   "aoAcaso": true
  },
  "traits": [
   "resistenciaAMagia",
   "armasMagicas",
   "imprudente",
   "t_represaliaCruel"
  ],
  "blurb": "Combatente imprudente que pode atacar com vantagem em troca de ficar exposto, golpeando com espada longa e garra. Ao sofrer dano, revida com uma mordida gélida ou avança contra um inimigo.",
  "lore": "Abishais são diabos dracônicos a serviço de Tiamat nos Nove Infernos, e os brancos ocupam o degrau mais baixo dessa hierarquia. Movidos por fúria e desespero, lançam-se na batalha sem pensar na própria segurança. Costumam servir como tropa de choque em cultos e cidades corrompidas, obedecendo a abishais mais poderosos. Sua lealdade à Rainha dos Dragões é absoluta, e falham raramente por falta de vontade."
 },
 "eladrinDoInverno": {
  "id": "eladrinDoInverno",
  "tipo": "feérico",
  "name": "Eladrin do Inverno",
  "nomeOriginal": "Winter Eladrin",
  "fonte": "MTF",
  "size": "médio",
  "level": 9,
  "cr": "10",
  "xp": 5900,
  "abilities": {
   "str": 11,
   "dex": 10,
   "con": 16,
   "int": 18,
   "wis": 17,
   "cha": 13
  },
  "ac": 19,
  "acNote": "armadura natural",
  "maxHp": 127,
  "hpDice": "17d8+51",
  "speedFt": 30,
  "senses": {
   "passivePerception": 13,
   "darkvisionFt": 60
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
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Espada Longa",
    "bonus": 4,
    "damage": "1d8",
    "type": "cortante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d10",
     "type": "cortante"
    }
   },
   {
    "name": "Arco Longo",
    "bonus": 4,
    "damage": "1d8",
    "type": "perfurante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 150,
    "longRangeFt": 600
   }
  ],
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "coneDeFrio",
    "tempestadeDeGelo",
    "nevoaObscurecente",
    "lufadaDeVento"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "coneDeFrio": 1,
    "tempestadeDeGelo": 1
   },
   "aVontade": [
    "nevoaObscurecente",
    "lufadaDeVento"
   ],
   "cdPorMagia": {
    "coneDeFrio": 16,
    "tempestadeDeGelo": 16,
    "nevoaObscurecente": 16,
    "lufadaDeVento": 16
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Passo Feérico",
    "recharge": [
     4,
     5,
     6
    ],
    "tipo": "teleporte",
    "alcanceFt": 30,
    "bonus": true
   }
  ],
  "aura": {
   "raioFt": 60,
   "quando": "inicioDoAlvo",
   "save": "wis",
   "dc": 13,
   "condition": "enfeiticado",
   "rounds": 10,
   "repete": true
  },
  "repreensao": {
   "nome": "Repreensão Gélida",
   "alcanceFt": 60,
   "save": "con",
   "dc": 16,
   "damage": "2d10",
   "damageType": "frio",
   "metade": false
  },
  "traits": [
   "t_passoFeerico",
   "resistenciaAMagia",
   "aura",
   "t_repreensaoGelida"
  ],
  "blurb": "Abate a vontade dos inimigos com uma aura de tristeza que os enfeitiça e enfraquece, enquanto lança cone de frio e tempestade de gelo. Quem o fere sente o troco gélido na hora.",
  "lore": "Os eladrins do inverno são elfos feéricos tomados pelo luto e pela melancolia, ligados à estação mais fria da Agrestia das Fadas. Costumam habitar florestas congeladas e ermos árticos, onde o silêncio combina com seu humor. Sua presença carrega uma tristeza tão intensa que contagia quem se aproxima. Raramente buscam briga, mas respondem a ofensas com frieza implacável."
 },
 "yagnoloth": {
  "id": "yagnoloth",
  "tipo": "corruptor",
  "name": "Yagnoloth",
  "nomeOriginal": "Yagnoloth",
  "fonte": "MTF",
  "size": "grande",
  "level": 9,
  "cr": "11",
  "xp": 7200,
  "abilities": {
   "str": 19,
   "dex": 14,
   "con": 21,
   "int": 16,
   "wis": 15,
   "cha": 18
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 147,
  "hpDice": "14d10+70",
  "speedFt": 40,
  "senses": {
   "passivePerception": 16,
   "blindsightFt": 60,
   "darkvisionFt": 60
  },
  "saves": [
   "dex",
   "int",
   "wis",
   "cha"
  ],
  "skills": [
   "enganacao",
   "intuicao",
   "percepcao",
   "persuasao"
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
    "name": "Toque Eletrizado",
    "bonus": 8,
    "damage": "6d8",
    "type": "elétrico",
    "reachFt": 5
   },
   {
    "name": "Braço Massivo",
    "bonus": 8,
    "damage": "3d12+4",
    "type": "concussão",
    "reachFt": 15,
    "onHit": {
     "save": "con",
     "dc": 16,
     "condition": "atordoado",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Braço Massivo",
    "Toque Eletrizado",
    "Braço Massivo"
   ]
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "relampago",
    "escuridao",
    "detectarMagia",
    "dissiparMagia",
    "invisibilidade",
    "sugestao"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "relampago": 3
   },
   "aVontade": [
    "escuridao",
    "detectarMagia",
    "dissiparMagia",
    "invisibilidade",
    "sugestao"
   ],
   "cdPorMagia": {
    "relampago": 16,
    "escuridao": 16,
    "detectarMagia": 16,
    "dissiparMagia": 16,
    "invisibilidade": 16,
    "sugestao": 16
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
   "t_sanguessugaVital",
   "t_astuciaDeBatalha",
   "resistenciaAMagia",
   "armasMagicas"
  ],
  "blurb": "Gigante assimétrico que esmaga com um braço colossal de 4,5 m de alcance, capaz de atordoar, e eletrocuta com o outro; teleporta-se pelo campo e drena a vida de quem cai incapacitado.",
  "lore": "O yagnoloth é um yugoloth corpulento, com um braço enorme e outro pequeno e crepitante de eletricidade. Atua como diplomata e oficial de campo dos exércitos yugoloth, negociando contratos com mortais e outros demônios em nome de seus mestres. Fala com charme calculado, mas cumpre sempre a letra do acordo e nada além dela. Em combate, coordena os mercenários ao redor e prefere esgotar o inimigo antes de sugar sua essência vital."
 },
 "yeenoghu": {
  "id": "yeenoghu",
  "tipo": "corruptor",
  "name": "Yeenoghu",
  "nomeOriginal": "Yeenoghu",
  "fonte": "MTF",
  "size": "enorme",
  "level": 21,
  "cr": "24",
  "xp": 62000,
  "abilities": {
   "str": 29,
   "dex": 16,
   "con": 26,
   "int": 15,
   "wis": 24,
   "cha": 15
  },
  "ac": 20,
  "acNote": "armadura natural",
  "maxHp": 333,
  "hpDice": "23d12+184",
  "speedFt": 50,
  "senses": {
   "passivePerception": 24,
   "truesightFt": 120
  },
  "saves": [
   "dex",
   "con",
   "wis"
  ],
  "skills": [
   "intimidacao",
   "percepcao"
  ],
  "expertise": [],
  "damageResistances": [
   "frio",
   "fogo",
   "elétrico"
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
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Mangual",
    "bonus": 16,
    "damage": "1d12+9",
    "type": "concussão",
    "reachFt": 15
   },
   {
    "name": "Mordida",
    "bonus": 16,
    "damage": "1d10+9",
    "type": "perfurante",
    "reachFt": 10
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mangual",
    "Mangual",
    "Mangual"
   ]
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "teletransporte",
    "dissiparMagia",
    "medo",
    "invisibilidade",
    "detectarMagia"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "teletransporte": 1,
    "dissiparMagia": 3,
    "medo": 3,
    "invisibilidade": 3
   },
   "aVontade": [
    "detectarMagia"
   ],
   "cdPorMagia": {
    "teletransporte": 17,
    "dissiparMagia": 17,
    "medo": 17,
    "invisibilidade": 17,
    "detectarMagia": 17
   }
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Rebater",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Mangual"
    },
    {
     "nome": "Selvageria",
     "custo": 2,
     "tipo": "golpe",
     "arma": "Mordida"
    }
   ]
  },
  "traits": [
   "resistenciaAMagia",
   "armasMagicas",
   "rampage",
   "acoesLendarias"
  ],
  "blurb": "Senhor demônio gnoll que gira um mangual de três cabeças com 4,5 m de alcance, podendo paralisar, confundir ou esmagar com dano extra a cada sequência de golpes. Quando derruba alguém, avança e morde de novo, e entre turnos arremessa inimigos para longe ou morde todos ao redor.",
  "lore": "Conhecido como a Fera da Carnificina, Yeenoghu é um gnoll colossal de mais de 4 m, coberto de cicatrizes, pelo emaranhado e armaduras remendadas presas por correntes. Segundo a lenda, as hienas que comeram as presas dele se tornaram os primeiros gnolls, que hoje servem como instrumentos de sua fúria. Ele só deseja matança e ruína, adora aterrorizar as vítimas antes de matá-las e jamais negocia. Seu covil no Abismo, os Vales da Morte, é um terreno árido de colinas e ravinas onde caça mortais capturados, cercado de gnolls, hienas e carniçais. Odeia Baphomet, e os seguidores dos dois se atacam sempre que se encontram."
 },
 "kruthikJovem": {
  "id": "kruthikJovem",
  "tipo": "monstruosidade",
  "name": "Kruthik Jovem",
  "nomeOriginal": "Young Kruthik",
  "fonte": "MTF",
  "size": "pequeno",
  "level": 1,
  "cr": "1/8",
  "xp": 25,
  "abilities": {
   "str": 13,
   "dex": 16,
   "con": 13,
   "int": 4,
   "wis": 10,
   "cha": 6
  },
  "ac": 16,
  "acNote": "armadura natural",
  "maxHp": 9,
  "hpDice": "2d6+2",
  "speedFt": 30,
  "speeds": {
   "climbFt": 30,
   "burrowFt": 10
  },
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 30,
   "tremorsenseFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Estocada",
    "bonus": 5,
    "damage": "1d4+3",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "traits": [
   "keenSmell",
   "packTactics",
   "escavador"
  ],
  "blurb": "Pequeno réptil-inseto que ataca em bando, ganhando vantagem quando um aliado está ao lado do alvo. Escava túneis na rocha e sente vibrações a até 18 m, o que torna difícil escapar dele.",
  "lore": "Kruthiks são monstruosidades de carapaça dura, parecidas com répteis e insetos ao mesmo tempo, que vivem em colmeias cavadas sob desertos, montanhas e no Subterrâneo. Os jovens nascem em grandes ninhadas e passam o tempo caçando para alimentar a colônia. Comunicam-se por estalos e chiados numa língua própria. Quando encontram uma presa, chamam os irmãos e a cercam até derrubá-la."
 },
 "zaratan": {
  "id": "zaratan",
  "tipo": "elemental",
  "name": "Zaratan",
  "nomeOriginal": "Zaratan",
  "fonte": "MTF",
  "size": "imenso",
  "level": 21,
  "cr": "22",
  "xp": 41000,
  "abilities": {
   "str": 30,
   "dex": 10,
   "con": 30,
   "int": 2,
   "wis": 21,
   "cha": 18
  },
  "ac": 21,
  "acNote": "armadura natural",
  "maxHp": 307,
  "hpDice": "15d20+150",
  "speedFt": 40,
  "speeds": {
   "swimFt": 40
  },
  "senses": {
   "passivePerception": 15,
   "darkvisionFt": 60,
   "tremorsenseFt": 60
  },
  "saves": [
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
  "damageVulnerabilities": [
   "trovejante"
  ],
  "conditionImmunities": [
   "exausto",
   "paralisado",
   "petrificado",
   "envenenado",
   "atordoado"
  ],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 17,
    "damage": "4d8+10",
    "type": "perfurante",
    "reachFt": 20
   },
   {
    "name": "Pisão",
    "bonus": 17,
    "damage": "3d10+10",
    "type": "concussão",
    "reachFt": 20
   },
   {
    "name": "Cuspir Rocha",
    "bonus": 17,
    "damage": "6d8+10",
    "type": "concussão",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 120,
    "longRangeFt": 240
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Mordida",
    "Pisão"
   ]
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "acoesEspeciais": [
   {
    "nome": "Vomitar Destroços (Recarga 5–6)",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cube",
    "areaFt": 90,
    "save": "dex",
    "dc": 25,
    "damage": "6d10",
    "damageType": "concussão",
    "halfOnSave": true,
    "condition": "caido",
    "rounds": 10,
    "repete": false
   }
  ],
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Pisão",
     "custo": 1,
     "tipo": "golpe",
     "arma": "Pisão"
    },
    {
     "nome": "Mover",
     "custo": 1,
     "tipo": "mover",
     "metade": false,
     "semOportunidade": false
    },
    {
     "nome": "Cuspir",
     "custo": 2,
     "tipo": "golpe",
     "arma": "Cuspir Rocha"
    },
    {
     "nome": "Emergir",
     "custo": 2,
     "tipo": "golpe",
     "arma": "Cuspir Rocha"
    }
   ]
  },
  "traits": [
   "t_passosQueAbalamATerra",
   "armasMagicas",
   "monstroDeCerco",
   "acoesLendarias"
  ],
  "blurb": "Tartaruga colossal de pedra que morde e pisoteia a até 6 m, cospe rochas a longa distância e vomita uma nuvem de destroços. Ao andar, faz o chão tremer, derruba construções e quebra concentração; quando ferida, recolhe-se no casco para se curar.",
  "lore": "O zaratan é um elemental da terra gigantesco, parecido com uma tartaruga cujo casco carrega rochas, terra e até vegetação. Vagueia lentamente por desertos, colinas, montanhas e até pelo Subterrâneo, muitas vezes confundido com parte da paisagem. Tem pouca inteligência, mas uma percepção aguçada do que se move à sua volta. Quando provocado, sua passagem arrasa vilarejos inteiros e deixa só escombros."
 },
 "zariel": {
  "id": "zariel",
  "tipo": "corruptor",
  "name": "Zariel",
  "nomeOriginal": "Zariel",
  "fonte": "MTF",
  "size": "grande",
  "level": 25,
  "cr": "26",
  "xp": 90000,
  "abilities": {
   "str": 27,
   "dex": 24,
   "con": 28,
   "int": 26,
   "wis": 27,
   "cha": 30
  },
  "ac": 21,
  "acNote": "armadura natural",
  "maxHp": 580,
  "hpDice": "40d10+360",
  "speedFt": 50,
  "flyFt": 150,
  "speeds": {
   "flyFt": 150
  },
  "senses": {
   "passivePerception": 26,
   "darkvisionFt": 120
  },
  "saves": [
   "int",
   "wis",
   "cha"
  ],
  "skills": [
   "intimidacao",
   "percepcao"
  ],
  "expertise": [],
  "damageResistances": [
   "frio",
   "fogo",
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
    "name": "Espada Longa",
    "bonus": 16,
    "damage": "2d8+8",
    "type": "cortante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "8d8",
     "type": "fogo"
    }
   },
   {
    "name": "Azagaia",
    "bonus": 16,
    "damage": "2d6+8",
    "type": "perfurante",
    "reachFt": 10,
    "rangeFt": 30,
    "longRangeFt": 120,
    "danoExtra": {
     "damage": "8d8",
     "type": "fogo"
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
    "dedoDaMorte",
    "alterarAparencia",
    "detectarBemMal",
    "bolaDeFogo",
    "invisibilidade",
    "muralhaDeFogo"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "barreiraDeLaminas": 3,
    "dissiparOBemEOMal": 3,
    "dedoDaMorte": 3
   },
   "aVontade": [
    "alterarAparencia",
    "detectarBemMal",
    "bolaDeFogo",
    "invisibilidade",
    "muralhaDeFogo"
   ],
   "cdPorMagia": {
    "barreiraDeLaminas": 26,
    "dissiparOBemEOMal": 26,
    "dedoDaMorte": 26,
    "alterarAparencia": 26,
    "detectarBemMal": 26,
    "bolaDeFogo": 26,
    "invisibilidade": 26,
    "muralhaDeFogo": 26
   }
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "acoesEspeciais": [
   {
    "nome": "Toque Horrendo",
    "recharge": [
     5,
     6
    ],
    "tipo": "alvo",
    "alcanceFt": 10,
    "save": "con",
    "dc": 26,
    "damage": "8d10",
    "damageType": "necrótico",
    "halfOnSave": false,
    "condition": "envenenado",
    "rounds": 10,
    "repete": true
   },
   {
    "nome": "Teletransporte",
    "tipo": "teleporte",
    "alcanceFt": 120
   }
  ],
  "features": [
   "devilsSight"
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
     "nome": "Olhar Incinerador",
     "custo": 2,
     "tipo": "alvo",
     "alcanceFt": 120,
     "save": "wis",
     "dc": 26,
     "damage": "4d10",
     "damageType": "fogo",
     "halfOnSave": false
    },
    {
     "nome": "Teletransporte",
     "custo": 1,
     "tipo": "teleporte",
     "alcanceFt": 120
    }
   ]
  },
  "traits": [
   "armasMagicas",
   "resistenciaAMagia",
   "regeneracaoDoLivro",
   "acoesLendarias"
  ],
  "blurb": "Arquidiaba guerreira que combina espada longa ou azagaias flamejantes (cada golpe soma 36 de dano de fogo) com um toque necrótico que cega e ensurdece, teleportando-se pelo campo à vontade. Regenera 20 PV por turno, a menos que sofra dano radiante.",
  "lore": "Zariel foi um anjo enviado para vigiar a Guerra Sangrenta, mas acabou corrompida pelos Nove Infernos e caiu. Hoje governa Avernus, a primeira camada infernal, por onde passa todo viajante e onde se reúnem os exércitos diabólicos contra os demônios. Ela tomou de volta o posto do cauteloso Bel, que agora a aconselha, e muitos suspeitam que sonha em derrubar Asmodeus. Busca as almas dos maiores guerreiros mortais com pactos eternos e implacáveis, deixando-os viver e se aperfeiçoar até cobrar a dívida. Reside numa vasta cidadela de basalto cercada de torres, com vítimas queimadas acorrentadas às muralhas."
 },
 "zuggtmoy": {
  "id": "zuggtmoy",
  "tipo": "corruptor",
  "name": "Zuggtmoy",
  "nomeOriginal": "Zuggtmoy",
  "fonte": "MTF",
  "size": "grande",
  "level": 21,
  "cr": "23",
  "xp": 50000,
  "abilities": {
   "str": 22,
   "dex": 15,
   "con": 18,
   "int": 20,
   "wis": 19,
   "cha": 24
  },
  "ac": 18,
  "acNote": "armadura natural",
  "maxHp": 304,
  "hpDice": "32d10+128",
  "speedFt": 30,
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
  "damageResistances": [
   "frio",
   "fogo",
   "elétrico"
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
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Pseudópode",
    "bonus": 13,
    "damage": "2d8+6",
    "type": "concussão",
    "reachFt": 10,
    "danoExtra": {
     "damage": "2d8",
     "type": "veneno"
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Pseudópode",
    "Pseudópode",
    "Pseudópode"
   ]
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "dissiparMagia",
    "golpeConstritor",
    "emaranhar",
    "crescimentoDePlantas",
    "teletransporte",
    "detectarMagia",
    "localizarAnimaisPlantas",
    "raioDeDoenca"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "dissiparMagia": 3,
    "golpeConstritor": 3,
    "emaranhar": 3,
    "crescimentoDePlantas": 3,
    "teletransporte": 1
   },
   "aVontade": [
    "detectarMagia",
    "localizarAnimaisPlantas",
    "raioDeDoenca"
   ],
   "cdPorMagia": {
    "dissiparMagia": 22,
    "golpeConstritor": 22,
    "emaranhar": 22,
    "crescimentoDePlantas": 22,
    "teletransporte": 22,
    "detectarMagia": 22,
    "localizarAnimaisPlantas": 22,
    "raioDeDoenca": 22
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
     "arma": "Pseudópode"
    }
   ]
  },
  "traits": [
   "t_esporosDeInfestacao",
   "t_esporosDeControleMental",
   "resistenciaAMagia",
   "armasMagicas",
   "t_servoProtetor",
   "acoesLendarias"
  ],
  "blurb": "Golpeia com três pseudópodes que causam dano de concussão e de veneno, e espalha nuvens de esporos que adoecem, enlouquecem ou dominam quem está por perto. Usa os servos enfeitiçados como escudo e os comanda à distância.",
  "lore": "Zuggtmoy, a Rainha Demônio dos Fungos e Senhora da Podridão, só quer contaminar os vivos com seus esporos. As vítimas viram servos sem mente e, mais tarde, adubo para os fungos que ela gera. Seu corpo fúngico pode assumir uma forma vagamente humanoide, magra e coberta de micélio e líquen, que imita a vida mortal sem ter alma. Muitos de seus cultistas a servem sem perceber, tomados pelos esporos até que carne e fungo se tornem uma coisa só. Ela reina em Shedaklah, num palácio de cogumelos colossais ligados por pontes de orelhas-de-pau e cercados por bufas ácidas e vapores venenosos."
 }
};

export const TRACOS_MTF = {
 "t_imitacaoSulfurosa": {
  "name": "Imitação Sulfurosa",
  "desc": "Como ação bônus, cria uma cópia perfeita (com leve cheiro de enxofre) de uma criatura Média ou menor cujas memórias roubou, ligada a ele por um filamento de até 36 m; pode imitar 2d6 + 1 criaturas diferentes. A cópia conta como o próprio oblex e some se o filamento, imune a dano, for cortado por falta de uma abertura de 2,5 cm."
 },
 "t_golpeRelampago": {
  "name": "Golpe Relâmpago",
  "desc": "Recarga 6. Faz um ataque de mangual que, se acertar, causa 18 (4d8) de dano elétrico adicional. Quem leva o golpe faz Constituição CD 13; se falhar, fica atordoado até o fim do próximo turno do mirmidão."
 },
 "t_fomentarLoucura": {
  "name": "Fomentar Loucura",
  "desc": "Criaturas não demoníacas que começam o turno a até 9 m fazem teste de resistência de Sabedoria CD 18; se falharem, têm desvantagem na próxima jogada de ataque, teste de resistência ou teste de habilidade. Se falharem por 5 ou mais, ficam sob o efeito da magia confusão por 1 minuto (sem concentração), ficando imunes a este traço enquanto durar."
 },
 "t_encantoInstintivo": {
  "name": "Encanto Instintivo",
  "desc": "Quando uma criatura a até 18 m o ataca e há outro alvo ao alcance, ela faz teste de Sabedoria CD 19; se falhar, precisa atacar a criatura mais próxima dela (exceto o amnizu e ela mesma). Com sucesso, fica imune a esse efeito por 24 horas."
 },
 "t_entidadeAstral": {
  "name": "Entidade Astral",
  "desc": "Não pode sair do Plano Astral nem ser banido ou transportado para fora dele."
 },
 "t_cortarCordaoDePrata": {
  "name": "Cortar Cordão de Prata",
  "desc": "Ao obter um crítico contra alguém em projeção astral, pode cortar o cordão de prata do alvo em vez de causar dano."
 },
 "t_passoFeerico": {
  "name": "Passo Feérico",
  "desc": "Recarga 4–6. Como ação bônus, teleporta-se até 9 m para um espaço desocupado que consiga ver."
 },
 "t_promoverAPaz": {
  "name": "Promover a Paz",
  "desc": "Quando uma criatura enfeitiçada por ele, a até 18 m e visível, acerta um ataque, o eladrin faz o ataque errar."
 },
 "t_comandoInfernal": {
  "name": "Comando Infernal",
  "desc": "Aliados a até 18 m não podem ficar enfeitiçados nem amedrontados até o fim do próximo turno do narzugon."
 },
 "t_pavoroso": {
  "name": "Pavoroso",
  "desc": "Como ação bônus, até o início do próximo turno dele, toda criatura que não seja diabo e comece o turno a até 3 m de Bael faz teste de resistência de Sabedoria CD 22 ou fica amedrontada até o início do próprio próximo turno."
 },
 "t_memoriaLabirintica": {
  "name": "Memória Labiríntica",
  "desc": "Lembra com perfeição qualquer trajeto que já percorreu e é imune à magia labirinto."
 },
 "t_duplicataEspectral": {
  "name": "Duplicata Espectral",
  "desc": "Recarrega após descanso curto ou longo. Com uma ação bônus, cria uma cópia de si em espaço visível a até 18 m; enquanto ela existe, o berbalang fica inconsciente. A cópia tem as mesmas estatísticas, seus ataques causam dano psíquico e ela some se ela ou o berbalang caírem a 0 PV ou quando ele quiser."
 },
 "t_escuridaoRastejante": {
  "name": "Escuridão Rastejante",
  "desc": "Recarga 5–6. Conjura escuridão num ponto a até 36 m, sem componentes (Sabedoria). Enquanto durar, pode mover a área até 18 m como ação bônus."
 },
 "t_rejuvenescimento": {
  "name": "Rejuvenescimento",
  "desc": "Se for destruído enquanto seu mestre estiver vivo, ganha um corpo novo com todos os PV em 1d10 horas, a até 1,6 km do mestre."
 },
 "t_alcanceMortal": {
  "name": "Alcance Mortal",
  "desc": "Quando um inimigo visível entra no seu alcance, faz um ataque de garra contra ele; se acertar, pode fazer um segundo ataque de garra no mesmo alvo."
 },
 "t_armaduraDeTerra": {
  "name": "Armadura de Terra",
  "desc": "Não provoca ataques de oportunidade enquanto escava."
 },
 "t_presencaPutrefata": {
  "name": "Presença Putrefata",
  "desc": "Uma criatura que não seja demônio e comece o turno a até 9 m de um ou mais bulezaus faz um teste de resistência de Constituição CD 13. Se falhar, sofre 1d6 de dano necrótico mais 1 para cada bulezau a até 9 m dela."
 },
 "t_saltoParado": {
  "name": "Salto Parado",
  "desc": "Salta até 6 m em distância e 3 m em altura, mesmo sem correr antes."
 },
 "t_invocarEspectros": {
  "name": "Invocar Espectros",
  "desc": "Como ação bônus, faz surgir 1d6 espectros (sem Sensibilidade à Luz Solar) em espaços livres a até 4,5 m. Eles agem logo após o coletor na mesma iniciativa e somem se ele for destruído. Recarrega após descanso curto ou longo."
 },
 "t_travaDimensional": {
  "name": "Trava Dimensional",
  "desc": "Nenhuma outra criatura consegue se teletransportar para um ponto a até 18 m do canoloth ou sair de lá dessa forma; a tentativa é perdida."
 },
 "t_rapidezAberrante": {
  "name": "Rapidez Aberrante",
  "desc": "Uma vez, recuperando após descanso curto ou longo, pode realizar uma ação adicional no seu turno."
 },
 "t_semOssos": {
  "name": "Sem Ossos",
  "desc": "Passa e permanece em espaços de apenas 10 cm de largura sem precisar se espremer."
 },
 "t_colherOsMortos": {
  "name": "Colher os Mortos",
  "desc": "Pega um humanoide morto e desprotegido a até 3 m e o guarda no próprio corpo, com todo o equipamento, para uso com o traço Cadáveres."
 },
 "t_cadaveres": {
  "name": "Cadáveres",
  "desc": "Começa com 1d6+3 corpos humanoides guardados (máximo de nove), protegidos por cobertura total. Com uma ação bônus, digere um corpo para recuperar 11 (2d10) PV ou anima um como zumbi a 1,5 m, que age logo depois dela como aliado autônomo e também carrega o fedor."
 },
 "t_duasCabecas": {
  "name": "Duas Cabeças",
  "desc": "Tem vantagem em testes de Sabedoria (Percepção) e em testes de resistência contra ficar cego, enfeitiçado, surdo, amedrontado, atordoado ou inconsciente."
 },
 "t_mudarDeForma": {
  "name": "Mudar de Forma",
  "desc": "Com uma ação bônus, vira uma aranha gigante por até 1 hora e pode voltar ao normal com outra ação bônus; recarrega após descanso curto ou longo. Mantém as estatísticas, fala e conjura nas duas formas, mas não usa o equipamento enquanto aranha."
 },
 "t_magiaDeGuerra": {
  "name": "Magia de Guerra",
  "desc": "Quando gasta sua ação para conjurar uma magia, pode fazer um ataque com arma como ação bônus."
 },
 "t_comandoDeBatalha": {
  "name": "Comando de Batalha",
  "desc": "Como ação bônus, escolhe um aliado visível a até 9 m que possa vê-lo ou ouvi-lo; esse aliado pode usar a reação para um ataque corpo a corpo ou para Esquivar ou Esconder."
 },
 "t_discernirMentira": {
  "name": "Discernir Mentira",
  "desc": "Ela percebe sempre que uma criatura mente em um idioma que ela entende."
 },
 "t_invocarServo": {
  "name": "Invocar Servo",
  "desc": "1/dia, invoca um recuperador ou uma yochlol a até 18 m, que luta a seu lado por 10 minutos, sem poder invocar outros demônios, até morrer, a matriarca morrer ou dispensá-lo com uma ação."
 },
 "t_favorVoluvelDeLolth": {
  "name": "Favor Volúvel de Lolth",
  "desc": "Com uma ação bônus, escolhe um aliado visível a até 9 m: ele sofre 7 (2d6) de dano psíquico, mas ganha vantagem na próxima jogada de ataque até o fim do seu próximo turno."
 },
 "t_passoSombrio": {
  "name": "Passo Sombrio",
  "desc": "Estando na penumbra ou na escuridão, pode usar uma ação bônus para se teletransportar até 18 m para um espaço visível também na penumbra ou escuridão. Depois disso, tem vantagem no primeiro ataque corpo a corpo que fizer até o fim do turno."
 },
 "t_motorPsiquico": {
  "name": "Motor Psíquico",
  "desc": "Ao sofrer um acerto crítico ou cair a 0 PV, libera 14 (4d6) de dano psíquico em cada criatura a até 1,5 m."
 },
 "t_motorDeDor": {
  "name": "Motor de Dor",
  "desc": "Uma vez por turno, quem ataca o gritador pode mirar o duergar preso nele, com desvantagem. Se acertar, causa 11 (2d10) de dano extra, e o gritador pode usar sua reação para fazer um Ataque Múltiplo."
 },
 "t_invisibilidadeCompartilhada": {
  "name": "Invisibilidade Compartilhada",
  "desc": "Recarrega após descanso curto ou longo. Fica invisível com seu equipamento por até 1 hora (concentração), terminando se atacar ou conjurar magia; a steeder fêmea que montar também fica invisível até atacar."
 },
 "t_treinamentoDeCavalaria": {
  "name": "Treinamento de Cavalaria",
  "desc": "Ao acertar um ataque corpo a corpo enquanto monta uma steeder fêmea, a montaria pode usar a reação para atacar o mesmo alvo corpo a corpo."
 },
 "t_resilienciaDuergar": {
  "name": "Resiliência Duergar",
  "desc": "Tem vantagem em testes de resistência contra veneno, magias e ilusões, e para evitar ficar enfeitiçado ou paralisado."
 },
 "t_reduzir": {
  "name": "Reduzir",
  "desc": "Uma vez por descanso, por 1 minuto fica Miúdo: dano de arma cai para 1, desvantagem em tudo que use Força, +5 na CA e em Furtividade, e pode se Esconder como ação bônus."
 },
 "t_criarLaminaDaAlma": {
  "name": "Criar Lâmina da Alma",
  "desc": "Com uma ação bônus, forma na mão uma lâmina visível de energia psiônica do tamanho de uma espada curta. Ela some se sair da mão dele ou se ele morrer ou ficar incapacitado."
 },
 "t_formacaoDeFalange": {
  "name": "Formação de Falange",
  "desc": "Enquanto estiver a até 1,5 m de um aliado duergar empunhando escudo, tem vantagem em jogadas de ataque e testes de resistência de Destreza."
 },
 "t_chamadoAoAtaque": {
  "name": "Chamado ao Ataque",
  "desc": "Até três duergar aliados a até 36 m que possam ouvi-lo podem usar a reação para fazer um ataque com arma cada."
 },
 "t_instrucaoFlageladora": {
  "name": "Instrução Flageladora",
  "desc": "Quando um aliado que ele vê rola um d20, o senhor da guerra rola 1d6; o aliado pode somar o resultado à rolagem sofrendo 3 (1d6) de dano psíquico. Não afeta criaturas imunes a dano psíquico."
 },
 "t_possuirCadaver": {
  "name": "Possuir Cadáver",
  "desc": "(Recarga 6) Entra num cadáver intacto de besta ou humanoide, Grande ou menor, a até 1,5 m, tornando-se morto-vivo com aparência viva e ganhando PV temporários iguais ao PV máximo que o corpo tinha em vida. Mantém seus PV, mentais, telepatia e imunidades, mas usa as demais estatísticas do corpo. Sai quando os PV temporários acabam ou com uma ação bônus, surgindo a até 1,5 m."
 },
 "t_profanarCadaver": {
  "name": "Profanar Cadáver",
  "desc": "Com uma ação bônus enquanto possui um cadáver, faz o corpo agir de modo grotesco. Bestas e humanoides que virem precisam passar num teste de resistência de Sabedoria CD 12 ou ficam amedrontados por 1 minuto, repetindo o teste ao fim de cada turno; quem passar fica imune por 24 horas."
 },
 "t_golpeTrovejante": {
  "name": "Golpe Trovejante",
  "desc": "Recarga 5–6. Faz um ataque de marreta que, se acertar, causa 16 (3d10) de dano trovejante extra. O alvo faz um teste de resistência de Força CD 14 ou fica caído."
 },
 "t_animacaoSagrada": {
  "name": "Animação Sagrada",
  "desc": "Recarga 5–6. Ao entrar no espaço de uma estátua sagrada, pode sumir dentro dela e controlá-la, passando a usar as estatísticas da estátua sagrada no lugar das suas."
 },
 "t_tempestadeDeRaios": {
  "name": "Tempestade de Raios",
  "desc": "Recarga 6. Todas as outras criaturas a até 36 m fazem teste de resistência de Destreza CD 20: 27 (6d8) de dano elétrico, ou metade se passarem. Quem falhar por 5 ou mais fica atordoado até o fim do próximo turno."
 },
 "t_tempestadeViva": {
  "name": "Tempestade Viva",
  "desc": "Está sempre no centro de um temporal de 1d6+4 milhas de diâmetro, com chuva ou neve que deixa a área levemente obscurecida e dá desvantagem em Percepção pela audição. Os ventos fortes dão desvantagem em ataques à distância, apagam chamas e dissipam névoa."
 },
 "t_pataPegajosa": {
  "name": "Pata Pegajosa",
  "desc": "Ataque corpo a corpo +5, alcance 1,5 m, contra criatura Média ou menor. O alvo fica grudado e agarrado (CD 12 para escapar); só uma criatura por vez."
 },
 "t_saltoExtraordinario": {
  "name": "Salto Extraordinário",
  "desc": "Seus saltos em distância são triplicados: cada 0,3 m de deslocamento gasto no salto o leva 0,9 m adiante."
 },
 "t_golpesArdentes": {
  "name": "Golpes Ardentes",
  "desc": "Recarga 5–6. Usa Ataques Múltiplos, e cada acerto causa 5 (1d10) de dano de fogo adicional."
 },
 "t_indetectavel": {
  "name": "Indetectável",
  "desc": "Não pode ser alvo de magia de adivinhação, nem visto por sensores de vidência, nem percebido por habilidades que detectam demônios ou corruptores."
 },
 "t_furiaArdente": {
  "name": "Fúria Ardente",
  "desc": "Sempre que sofre dano de fogo, o Sopro Congelante é recarregado na hora."
 },
 "t_investidaDeCabeca": {
  "name": "Investida de Cabeça",
  "desc": "Se o giff se mover ao menos 6 m em linha reta e terminar a até 1,5 m de uma criatura Grande ou menor, ela faz um teste de resistência de Força CD 14; se falhar, sofre 7 (2d6) de dano de concussão e fica caída."
 },
 "t_periciaComArmasDeFogo": {
  "name": "Perícia com Armas de Fogo",
  "desc": "O giff ignora a propriedade de recarga de mosquetes e pistolas."
 },
 "t_reunirAsTropas": {
  "name": "Reunir as Tropas",
  "desc": "Como ação bônus, encerra as condições enfeitiçado e amedrontado em si mesmo e em criaturas escolhidas que veja a até 9 m."
 },
 "t_defesaPsiquica": {
  "name": "Defesa Psíquica",
  "desc": "Sem armadura e sem escudo, soma o modificador de Sabedoria à CA."
 },
 "t_fardoDoTempo": {
  "name": "Fardo do Tempo",
  "desc": "Feras e humanoides que não sejam shadar-kai têm desvantagem em testes de resistência enquanto estiverem a até 3 m do tecelão."
 },
 "t_fugaNebulosa": {
  "name": "Fuga Nebulosa",
  "desc": "Ao sofrer dano, fica invisível e se teletransporta até 18 m para um espaço visível. A invisibilidade dura até o início do próximo turno ou até atacar ou conjurar. Recarrega após descanso curto ou longo."
 },
 "t_furiaSangrenta": {
  "name": "Fúria Sangrenta",
  "desc": "Ao sofrer dano, faz um ataque de garras contra uma criatura aleatória ao seu alcance, exceto seu mestre."
 },
 "t_desesperoInfernal": {
  "name": "Desespero Infernal",
  "desc": "Criaturas que não sejam diabos a até 4,5 m de Hutijin fazem testes de resistência com desvantagem."
 },
 "t_vozAterradora": {
  "name": "Voz Aterradora",
  "desc": "Recarga 5–6. Ao sofrer dano, criaturas não diabos a até 9 m fazem CD 22 de Sabedoria ou ficam amedrontadas por 1 minuto, repetindo o teste ao fim de cada turno. Quem resiste fica imune por 24 horas."
 },
 "t_memoriaProtegida": {
  "name": "Memória Protegida",
  "desc": "Imune às águas do Rio Estige e a qualquer efeito que roube, altere, detecte ou leia suas memórias e pensamentos."
 },
 "t_vantagemAquatica": {
  "name": "Vantagem Aquática",
  "desc": "Enquanto estiver submerso em líquido, tem vantagem nas jogadas de ataque."
 },
 "t_maremoto": {
  "name": "Maremoto",
  "desc": "Recarga 6. Submerso, cria uma muralha de água de até 75 m de comprimento e altura e 15 m de espessura; criaturas na área fazem teste de Força CD 24, sofrendo 33 (6d10) de concussão na falha ou metade no sucesso. A cada turno ela avança 15 m, forçando novo teste CD 24 contra 27 (5d10) de dano, perde 15 m de altura e 1d10 de dano até sumir; nadar dentro dela exige teste de Força (Atletismo) CD 24."
 },
 "t_congelamentoParcial": {
  "name": "Congelamento Parcial",
  "desc": "Se sofrer 50 ou mais de dano de frio num único turno, até o fim do seu próximo turno seus deslocamentos caem para 6 m e seus ataques têm desvantagem."
 },
 "t_pernaPegajosa": {
  "name": "Perna Pegajosa",
  "desc": "Ataque corpo a corpo com arma, +4 para acertar, alcance 1,5 m, contra uma criatura Pequena ou Miúda. Se acertar, o alvo fica grudado e agarrado (CD 12 para escapar); só pode manter uma criatura agarrada por vez."
 },
 "t_erguerCarnical": {
  "name": "Erguer Carniçal",
  "desc": "Recarga 5–6. Escolhe um carniçal ou lívido morto que veja a até 9 m; ele volta à vida com todos os PV."
 },
 "t_assumirForma": {
  "name": "Assumir Forma",
  "desc": "Pode adotar a aparência de qualquer humanoide Médio que tenha devorado. O disfarce dura 1d6 dias, apodrecendo gradualmente até se desprender do corpo do demônio."
 },
 "t_guardaCostasLeal": {
  "name": "Guarda-Costas Leal",
  "desc": "Quando outro corruptor a até 1,5 m dele é atingido por um ataque, o merregon passa a ser o alvo atingido no lugar dele."
 },
 "t_teletransporte": {
  "name": "Teletransporte",
  "desc": "Com uma ação bônus, teletransporta-se com seu equipamento até 18 m para um espaço desocupado que possa ver."
 },
 "t_olharRoubaAlma": {
  "name": "Olhar Rouba-Alma",
  "desc": "Uma criatura a até 9 m que consiga ver o nabassu (não constructo nem morto-vivo) faz teste de resistência de Carisma CD 16; se falhar, seu máximo de PV cai 13 (2d12) até um descanso curto ou longo, e o nabassu ganha o mesmo valor em PV temporários. Se o máximo chegar a 0, a vítima morre, e um humanoide se ergue na hora como carniçal sob controle do demônio."
 },
 "t_sombrasDemoniacas": {
  "name": "Sombras Demoníacas",
  "desc": "Um raio de 3 m ao redor do nabassu fica em penumbra, e luz não mágica não consegue iluminar essa área."
 },
 "t_devorarAlma": {
  "name": "Devorar Alma",
  "desc": "Passando 10 minutos a até 1,5 m do cadáver de alguém que matou na última hora (exceto constructos e mortos-vivos), ganha d8s igual à metade dos Dados de Vida da vítima e soma o resultado aos PV; a cada 4 dados obtidos, seus ataques causam 3 (1d6) de dano extra. Os benefícios duram 6 dias, e a vítima só volta à vida com desejo."
 },
 "t_corrupcao": {
  "name": "Corrupção",
  "desc": "Como ação bônus, escolhe uma criatura visível a até 27 m, que faz teste de resistência de Carisma CD 20 (com desvantagem se for maligna). Se falhar, fica enfeitiçada até o início do próximo turno do nagpa; se passar, fica imune a este efeito por 24 horas."
 },
 "t_paralisiaRecarga6": {
  "name": "Paralisia (Recarga 6)",
  "desc": "Como ação bônus, cada criatura a até 9 m deve passar num teste de resistência de Sabedoria CD 20 ou ficar paralisada por 1 minuto, repetindo o teste ao fim de cada turno. Mortos-vivos e constructos são imunes."
 },
 "t_cura": {
  "name": "Cura",
  "desc": "Uma vez por dia, o narzugon ou uma criatura que ele toque recupera até 100 PV."
 },
 "t_sentidoDiabolico": {
  "name": "Sentido Diabólico",
  "desc": "Tem vantagem em testes de Sabedoria (Percepção) para perceber criaturas de tendência boa."
 },
 "t_arreiosInfernais": {
  "name": "Arreios Infernais",
  "desc": "Suas esporas fazem parte de arreios infernais e permitem invocar seu pesadelo companheiro."
 },
 "t_devoradorDeVida": {
  "name": "Devorador de Vida",
  "desc": "Uma criatura levada a 0 PV pelo dano dele morre e só pode voltar à vida com a magia desejo."
 },
 "t_movidoPelaFome": {
  "name": "Movido pela Fome",
  "desc": "Nos Nove Infernos, nupperibos rastreiam sem falhas qualquer criatura ferida pela Nuvem de Vermes de algum nupperibo nas últimas 24 horas."
 },
 "t_viroteExplosivo": {
  "name": "Virote Explosivo",
  "desc": "Dispara uma carga em um ponto a até 36 m; criaturas a até 6 m dele fazem teste de resistência de Destreza CD 15, sofrendo 17 (5d6) de dano de fogo na falha ou metade no sucesso. Recarga 5–6."
 },
 "t_bloquearOCaminho": {
  "name": "Bloquear o Caminho",
  "desc": "Até o início do próximo turno, ataques contra o ogro têm desvantagem e seu ataque de oportunidade tem vantagem, causando 16 (3d10) de dano de concussão extra. Inimigos que tentem sair do alcance dele sem teletransporte devem passar num teste de resistência de Força CD 14 ou ficam com deslocamento 0 até o início do próximo turno do ogro."
 },
 "t_liteira": {
  "name": "Liteira",
  "desc": "Até quatro criaturas Pequenas viajam no forte nas costas do ogro, com três quartos de cobertura contra ataques e efeitos de fora. Para atacar corpo a corpo alvos a até 1,5 m do ogro, precisam usar lanças ou armas de alcance. Se o ogro morrer, elas vão para espaços livres a até 1,5 m dele."
 },
 "t_curaCorrompida": {
  "name": "Cura Corrompida",
  "desc": "Recarga 6. Toca uma criatura voluntária a até 1,5 m, que recupera todos os PV e pode ter uma doença ou a condição cego, surdo, paralisado ou envenenado removida. Em troca, ela ganha 1 nível de exaustão e perde 7 (2d6) de PV máximo, só restaurável por desejo ou três restaurações maiores na mesma hora; morre se o máximo chegar a 0."
 },
 "t_portadorDePragas": {
  "name": "Portador de Pragas",
  "desc": "Recarga 5–6. Como ação bônus, contamina a área num raio de 9 m por 24 horas: plantas morrem e curas por magia ali curam metade. Quem entra ou começa o turno na área faz teste de resistência de Constituição CD 16; se falhar, sofre 14 (4d6) de dano necrótico e fica envenenado sem poder recuperar PV, perdendo 1d10 de PV máximo a cada 24 horas em que falhar novamente, até acumular três sucessos; se passar, fica imune por 24 horas."
 },
 "t_varinhaDeOrcus": {
  "name": "Varinha de Orcus",
  "desc": "A varinha tem 7 cargas (recupera 1d4+3 ao amanhecer) e CD 18. Com uma ação, Orcus lança animar mortos, praga ou falar com os mortos, ou gasta cargas para círculo da morte (1), dedo da morte (1) ou palavra de poder matar (2). Uma vez por dia, conjura mortos-vivos com até 500 PV médios somados a até 90 m, que lhe obedecem."
 },
 "t_mestreDaNaoVida": {
  "name": "Mestre da Não Vida",
  "desc": "Escolhe o nível ao lançar animar mortos ou criar mortos-vivos, e as criaturas ficam sob seu controle para sempre. Pode lançar criar mortos-vivos a qualquer hora."
 },
 "t_campoDeInvisibilidade": {
  "name": "Campo de Invisibilidade",
  "desc": "Com uma ação bônus, fica invisível junto com o equipamento que carrega. A invisibilidade acaba logo após ele fazer uma jogada de ataque ou ser atingido."
 },
 "t_retribuicaoExplosiva": {
  "name": "Retribuição Explosiva",
  "desc": "Ao ficar com 15 PV ou menos, explode: todas as outras criaturas a até 9 m fazem teste de resistência de Destreza CD 17, sofrendo 2d8 de fogo mais 2d8 trovejante na falha ou metade no sucesso. O orthon e suas armas são destruídos."
 },
 "t_incitarFanatismo": {
  "name": "Incitar Fanatismo",
  "desc": "Até quatro aliados a até 18 m que possam vê-lo ganham vantagem nas jogadas de ataque e não podem ficar amedrontados por 1 minuto."
 },
 "t_poderDaRainhaDragao": {
  "name": "Poder da Rainha Dragão",
  "desc": "Um dragão visível a até 36 m faz teste de resistência de Carisma CD 18 (com desvantagem se for cromático) ou fica enfeitiçado por 1 hora, tratando o abishai como aliado a proteger; dano do abishai ou de seus companheiros encerra o efeito. Se passar, fica imune por 1 hora."
 },
 "t_rastreadorInfalivel": {
  "name": "Rastreador Infalível",
  "desc": "Recebe do mestre um único alvo, uma criatura ou objeto específico ou de um tipo conhecido. Sabe a direção e a distância até ele enquanto estiverem no mesmo plano, e sempre sabe onde seu mestre está."
 },
 "t_degeneracaoRancosa": {
  "name": "Degeneração Rançosa",
  "desc": "No fim de cada turno do troll, toda criatura a até 1,5 m dele sofre 11 (2d10) de dano necrótico. Isso não acontece se ele tiver sofrido dano de ácido ou fogo desde o fim do seu turno anterior."
 },
 "t_habitanteFantasmagorico": {
  "name": "Habitante Fantasmagórico",
  "desc": "O eidolon fica dentro da estátua até ela chegar a 0 PV, até sair com uma ação bônus ou ser expulso por efeitos como dissipar o bem e o mal. Ao sair, surge num espaço livre a até 1,5 m dela."
 },
 "t_inerte": {
  "name": "Inerte",
  "desc": "Sem um eidolon dentro, a estátua é apenas um objeto."
 },
 "t_saltoSombrio": {
  "name": "Salto Sombrio",
  "desc": "Como ação bônus, teleporta-se até 9 m para um espaço desocupado que veja, desde que a origem e o destino estejam na penumbra ou escuridão. Pode fazê-lo entre os ataques de outra ação."
 },
 "t_contaminacao": {
  "name": "Contaminação",
  "desc": "Aura de 9 m que seca plantas e torna o chão terreno difícil para os outros. Quem começa o turno nela faz teste de resistência de Constituição CD 20 ou sofre 14 (4d6) de dano de veneno; quem passa fica imune por 24 horas."
 },
 "t_invisibilidadeFalivel": {
  "name": "Invisibilidade Falível",
  "desc": "Está sempre invisível, mas aparece como humanoide sem graça em reflexos, como vulto translúcido à luz de uma vela feita com gordura de cadáver desconhecido, e crianças humanoides de até 10 anos o enxergam normalmente."
 },
 "t_semRastros": {
  "name": "Sem Rastros",
  "desc": "Não deixa pegadas nem qualquer rastro de por onde passou."
 },
 "t_mestreDaSepultura": {
  "name": "Mestre da Sepultura",
  "desc": "Mortos-vivos aliados a até 9 m dele têm vantagem em testes de resistência e recuperam 1d6 PV ao começar o turno nessa área."
 },
 "t_sedeDeAlmas": {
  "name": "Sede de Almas",
  "desc": "Ao derrubar uma criatura a 0 PV, pode ganhar PV temporários iguais à metade do PV máximo dela. Enquanto tiver esses PV temporários, tem vantagem nas jogadas de ataque."
 },
 "t_pesoDasEras": {
  "name": "Peso das Eras",
  "desc": "Bestas e humanoides (exceto shadar-kai) que começam o turno a até 1,5 m dele têm o deslocamento reduzido em 6 m até o início do próximo turno."
 },
 "t_auraDeLoucura": {
  "name": "Aura de Loucura",
  "desc": "Criaturas que não sejam aberrações a até 6 m do grue têm desvantagem em testes de resistência e em jogadas de ataque contra alvos que não sejam grues crias estelares."
 },
 "t_espelhoPsiquico": {
  "name": "Espelho Psíquico",
  "desc": "Quando sofreria dano psíquico, não sofre nada e cada criatura a até 3 m dele recebe esse dano no lugar. Magia não consegue detectar seus pensamentos nem sua localização."
 },
 "t_retornoAosVermes": {
  "name": "Retorno aos Vermes",
  "desc": "Ao chegar a 0 PV, desfaz-se num enxame de insetos no mesmo espaço. Se o enxame sobreviver, o mago se recompõe 24 horas depois."
 },
 "t_nutrirSeDaFraqueza": {
  "name": "Nutrir-se da Fraqueza",
  "desc": "Quando uma criatura a até 6 m falha num teste de resistência, o mago ganha 10 PV temporários."
 },
 "t_rajadaDeGarras": {
  "name": "Rajada de Garras",
  "desc": "Recarga 4–6. Faz seis ataques de garra contra um único alvo. Antes ou depois, pode se mover até seu deslocamento como ação bônus sem provocar ataques de oportunidade."
 },
 "t_dobrarOEspaco": {
  "name": "Dobrar o Espaço",
  "desc": "Quando seria atingido por um ataque, troca de lugar por teletransporte com outra cria estelar visível a até 18 m, que recebe o ataque no lugar dele."
 },
 "t_oportunistaAstuto": {
  "name": "Oportunista Astuto",
  "desc": "Tem vantagem nas jogadas de ataque de oportunidade."
 },
 "t_interceptarAtaque": {
  "name": "Interceptar Ataque",
  "desc": "Quando outra criatura a até 1,5 m dele é atingida por uma jogada de ataque, concede +5 na CA dela contra esse ataque, podendo fazê-lo errar. Precisa ver a criatura e o atacante."
 },
 "t_chamadoAHonra": {
  "name": "Chamado à Honra",
  "desc": "Uma vez por dia, se já sofreu dano neste combate, ganha vantagem em jogadas de ataque até o fim do próximo turno e invoca 1d4+1 guerreiros espectros da espada a até 9 m. Eles agem logo após o comandante e duram até chegarem a 0 PV."
 },
 "t_furiaMarcial": {
  "name": "Fúria Marcial",
  "desc": "Com uma ação bônus, faz um ataque com arma. Se fizer, ataques contra ele têm vantagem até o início do próximo turno dele."
 },
 "t_desafioAoExpulsar": {
  "name": "Desafio ao Expulsar",
  "desc": "Ele e outros espectros da espada a até 9 m têm vantagem em testes de resistência contra efeitos de expulsar mortos-vivos."
 },
 "t_furiaCrescente": {
  "name": "Fúria Crescente",
  "desc": "Ao sofrer dano de outra criatura, ganha vantagem em ataques até o fim do seu próximo turno, e o primeiro acerto de gancho nesse turno causa 19 (3d12) de dano psíquico extra. Se ninguém o feriu desde o fim do seu último turno, ataca com desvantagem."
 },
 "t_fomeDeVida": {
  "name": "Fome de Vida",
  "desc": "Quando uma criatura que ele consegue ver recupera PV, o Faminto ganha vantagem nas jogadas de ataque até o fim do seu próximo turno. Nesse período, a mordida causa 22 (4d10) de dano necrótico adicional."
 },
 "t_prosperaNaCompanhia": {
  "name": "Prospera na Companhia",
  "desc": "Tem vantagem nas jogadas de ataque se houver ao menos duas outras criaturas a até 9 m; caso contrário, tem desvantagem."
 },
 "t_abracoApertado": {
  "name": "Abraço Apertado",
  "desc": "Quando o Perdido sofre dano enquanto mantém uma criatura agarrada, essa criatura sofre 18 (4d8) de dano psíquico."
 },
 "t_ventriloquismo": {
  "name": "Ventriloquismo",
  "desc": "Ao falar, pode fazer a voz surgir de um ponto a até 18 m."
 },
 "t_sentirVida": {
  "name": "Sentir Vida",
  "desc": "Percebe a posição de qualquer criatura a até 18 m, exceto constructos e mortos-vivos."
 },
 "t_proibicao": {
  "name": "Proibição",
  "desc": "Só pode entrar em uma residência se algum morador a convidar."
 },
 "t_respingoVenenoso": {
  "name": "Respingo Venenoso",
  "desc": "Sempre que sofre dano que não seja psíquico, cada criatura a até 1,5 m dele sofre 9 (2d8) de dano de veneno."
 },
 "t_aguaCorrompida": {
  "name": "Água Corrompida",
  "desc": "No início de cada turno, a água exposta a até 9 m fica corrompida (e levemente obscurecida debaixo d'água). Quem bebe ou nada nela faz teste de resistência de Constituição CD 18: falha causa 14 (4d6) de dano de veneno e envenenado por 1 minuto, com novo teste ao fim que, se falhar, causa 18 (4d8) de veneno e mantém envenenado até um descanso longo; sucesso dá imunidade por 24 horas. Outro demônio que beba essa água com uma ação ganha 11 (2d10) PV temporários."
 },
 "t_correnteza": {
  "name": "Correnteza",
  "desc": "Como ação bônus, estando submerso, torna toda a água a até 18 m terreno difícil para as outras criaturas até o início do seu próximo turno."
 },
 "t_golpesCongelantes": {
  "name": "Golpes Congelantes",
  "desc": "Recarga 6. Usa Ataques Múltiplos e cada acerto causa 5 (1d10) de dano de frio adicional. Um alvo atingido tem o deslocamento reduzido em 3 m até o fim do próximo turno do mirmidão."
 },
 "t_represaliaCruel": {
  "name": "Represália Cruel",
  "desc": "Ao sofrer dano, morde uma criatura aleatória a até 1,5 m. Se não houver ninguém ao alcance, move até metade do deslocamento rumo a um inimigo visível sem provocar ataques de oportunidade."
 },
 "t_repreensaoGelida": {
  "name": "Repreensão Gélida",
  "desc": "Ao sofrer dano de uma criatura visível a até 18 m, obriga-a a passar num teste de resistência de Constituição CD 16 ou sofrer 11 (2d10) de dano de frio."
 },
 "t_sanguessugaVital": {
  "name": "Sanguessuga Vital",
  "desc": "Toca uma criatura incapacitada a até 4,5 m: ela sofre 36 (7d8 + 4) de dano necrótico e o yagnoloth ganha PV temporários iguais à metade. Se falhar num teste de Constituição CD 16, o PV máximo do alvo cai no valor do dano até um descanso longo; se chegar a 0, morre."
 },
 "t_astuciaDeBatalha": {
  "name": "Astúcia de Batalha",
  "desc": "Recarga 4–6. Até dois yugoloths aliados a até 18 m que o ouçam podem usar a reação para fazer um ataque corpo a corpo cada."
 },
 "t_passosQueAbalamATerra": {
  "name": "Passos que Abalam a Terra",
  "desc": "Como ação bônus após andar ao menos 3 m no chão, cria uma onda de choque num raio de 36 m: a área vira terreno difícil por 1 minuto e quem está concentrado no chão faz teste de Constituição CD 25 ou perde a concentração. Estruturas sofrem 100 de dano trovejante; criaturas perto de uma que desaba fazem teste de Destreza CD 25, sofrendo 17 (5d6) de concussão, ficando caídas e soterradas (contidas, escapam com Atletismo CD 20) na falha, ou metade do dano no sucesso."
 },
 "t_esporosDeInfestacao": {
  "name": "Esporos de Infestação",
  "desc": "3 vezes por dia, cria uma nuvem com 6 m de raio centrada nela, que dura 1 minuto. Criaturas de carne e osso dentro dela fazem um teste de resistência de Constituição CD 19. Quem falha contrai uma doença e uma loucura aleatória, repete o teste a cada 24 horas e, após três falhas, morre e se ergue como servo de esporos. Quem passa fica imune a esses esporos por 24 horas."
 },
 "t_esporosDeControleMental": {
  "name": "Esporos de Controle Mental",
  "desc": "Recarga 5–6. Cria uma nuvem com 6 m de raio que dura 1 minuto. Humanoides e bestas dentro dela fazem um teste de resistência de Sabedoria CD 19 e, se falharem, ficam enfeitiçados por ela durante 24 horas. Quem passa fica imune a esses esporos por 24 horas."
 },
 "t_servoProtetor": {
  "name": "Servo Protetor",
  "desc": "Quando é atingida por um ataque, uma criatura enfeitiçada por ela a até 1,5 m precisa usar a própria reação para receber o golpe no lugar dela."
 }
};
