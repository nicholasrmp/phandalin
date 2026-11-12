// GERADO por `src/dev/importar-bestiario.mjs bgg` — não edite à mão; mude o conversor ou o texto em
  // `src/dev/bestiario/bgg-pt.json` e rode de novo. Os números são os do livro (BGG, via o espelho do 5etools);
  // o texto é nosso, em pt-br. O que o motor ainda não faz está em `src/dev/bestiario/bgg-pendente.json`.
  
export const LIVRO_BGG = {
 "aerossauro": {
  "id": "aerossauro",
  "tipo": "monstruosidade",
  "name": "Aerossauro",
  "nomeOriginal": "Aerosaur",
  "fonte": "BGG",
  "size": "imenso",
  "level": 9,
  "cr": "10",
  "xp": 5900,
  "abilities": {
   "str": 26,
   "dex": 10,
   "con": 21,
   "int": 3,
   "wis": 10,
   "cha": 5
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 155,
  "hpDice": "10d20+50",
  "speedFt": 20,
  "flyFt": 120,
  "speeds": {
   "flyFt": 120
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
    "name": "Mordida",
    "bonus": 12,
    "damage": "3d12+8",
    "type": "perfurante",
    "reachFt": 10
   },
   {
    "name": "Garras",
    "bonus": 12,
    "damage": "3d10+8",
    "type": "cortante",
    "reachFt": 10
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
    "nome": "Rajadas de Asas",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "raio",
    "areaFt": 10,
    "save": "str",
    "dc": 20,
    "damage": "7d10",
    "damageType": "trovejante",
    "halfOnSave": true,
    "condition": "caido",
    "rounds": 10,
    "repete": false
   }
  ],
  "traits": [
   "resistenciaAMagia"
  ],
  "blurb": "Pterossauro gigantesco que mergulha do céu, prende a presa no bico e a dilacera com as garras. Suas rajadas de asas derrubam e arremessam quem estiver por perto.",
  "lore": "O aerossauro é um réptil voador colossal, parente dos dinossauros, cujas asas cobrem o céu como uma tempestade. Vive em penhascos altos e picos isolados, de onde vigia vastas planícies em busca de caça. Age por instinto, sem malícia, mas trata qualquer coisa do tamanho de um cavalo, ou até maior, como alimento. Sua resistência natural à magia o torna um alvo difícil para conjuradores que tentam afastá-lo."
 },
 "altissauro": {
  "id": "altissauro",
  "tipo": "monstruosidade",
  "name": "Altissauro",
  "nomeOriginal": "Altisaur",
  "fonte": "BGG",
  "size": "imenso",
  "level": 13,
  "cr": "13",
  "xp": 10000,
  "abilities": {
   "str": 28,
   "dex": 6,
   "con": 23,
   "int": 3,
   "wis": 12,
   "cha": 7
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 198,
  "hpDice": "12d20+72",
  "speedFt": 40,
  "senses": {
   "passivePerception": 21
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
    "name": "Pisotear",
    "bonus": 14,
    "damage": "7d6+9",
    "type": "concussão",
    "reachFt": 10,
    "onHit": {
     "save": "str",
     "dc": 22,
     "condition": "caido",
     "rounds": 1,
     "repete": false
    }
   },
   {
    "name": "Cauda",
    "bonus": 14,
    "damage": "8d8+9",
    "type": "concussão",
    "reachFt": 20
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Pisotear",
    "Cauda"
   ]
  },
  "traits": [
   "resistenciaAMagia"
  ],
  "blurb": "Um dinossauro colossal que esmaga com as patas e varre o campo com a cauda, derrubando e arremessando quem estiver perto. Seus golpes causam dano enorme, e a magia tem dificuldade em detê-lo.",
  "lore": "O altissauro é um saurópode gigantesco, tão alto que sua cabeça alcança as copas das árvores mais antigas. Vive em planícies e florestas primitivas, onde se alimenta da vegetação e caminha em passos lentos que fazem o chão tremer. Apesar de pouco inteligente, tem sentidos aguçados e percebe ameaças de longe. Quando provocado, defende-se com fúria esmagadora, e poucas criaturas sobrevivem a uma pisada sua."
 },
 "geleiaDeSaco": {
  "id": "geleiaDeSaco",
  "tipo": "gosma",
  "name": "Geleia de Saco",
  "nomeOriginal": "Bag Jelly",
  "fonte": "BGG",
  "size": "médio",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 13,
   "dex": 6,
   "con": 19,
   "int": 2,
   "wis": 7,
   "cha": 2
  },
  "ac": 8,
  "maxHp": 42,
  "hpDice": "5d8+20",
  "speedFt": 10,
  "speeds": {
   "climbFt": 10
  },
  "senses": {
   "passivePerception": 8,
   "blindsightFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "ácido",
   "concussão"
  ],
  "conditionImmunities": [
   "exausto"
  ],
  "attacks": [
   {
    "name": "Pseudopod",
    "bonus": 3,
    "damage": "2d6+1",
    "type": "ácido",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Pseudopod",
    "Pseudopod"
   ]
  },
  "traits": [
   "amorfo"
  ],
  "blurb": "Lenta e grudenta, ataca duas vezes com pseudópodes ácidos que prendem a vítima, e escapar dela é difícil. Resiste a ácido e a golpes de concussão.",
  "lore": "Gosma de cor verde-oliva aparentada aos limos que limpam masmorras, ela costuma morar dentro dos sacos que os gigantes carregam. Ali se alimenta de qualquer resto orgânico que encontre. Seu corpo aguenta bem ser esmagado, o que a mantém viva quando o gigante arremessa o saco ou senta em cima dele. Alguns gigantes evitam essas criaturas com limpeza rigorosa, mas outros as deixam ali de propósito como armadilha contra ladrões, que ficam colados e fazem barulho suficiente para acordar o dono."
 },
 "carnicalDasColinas": {
  "id": "carnicalDasColinas",
  "tipo": "morto-vivo",
  "name": "Carniçal das Colinas",
  "nomeOriginal": "Barrowghast",
  "fonte": "BGG",
  "size": "enorme",
  "level": 5,
  "cr": "7",
  "xp": 2900,
  "abilities": {
   "str": 21,
   "dex": 8,
   "con": 20,
   "int": 5,
   "wis": 9,
   "cha": 6
  },
  "ac": 12,
  "acNote": "armadura natural",
  "maxHp": 138,
  "hpDice": "12d12+60",
  "speedFt": 40,
  "senses": {
   "passivePerception": 9,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "necrótico",
   "veneno"
  ],
  "conditionImmunities": [
   "exausto",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Pancada",
    "bonus": 8,
    "damage": "2d12+5",
    "type": "concussão",
    "reachFt": 10
   },
   {
    "name": "Dreno de Vida",
    "bonus": 8,
    "damage": "1d8+5",
    "type": "necrótico",
    "reachFt": 10
   }
  ],
  "multiattack": {
   "count": 2,
   "sequencias": [
    [
     "Pancada",
     "Pancada"
    ],
    [
     "Pancada"
    ]
   ]
  },
  "aura": {
   "raioFt": 10,
   "quando": "inicioDoAlvo",
   "save": "con",
   "dc": 16,
   "condition": "envenenado",
   "imunizaAoPassar": true
  },
  "traits": [
   "aura",
   "t_feridaNociva"
  ],
  "blurb": "Gigante morto-vivo que golpeia com alcance de 3 m e drena vida, reduzindo o máximo de PV das vítimas. Seu fedor envenena quem fica perto e cortá-lo espirra icor venenoso.",
  "lore": "Quando um gigante das colinas morre faminto e consumido pela raiva, a energia do Plano Negativo pode reerguê-lo como esta criatura. Parece só um cadáver ambulante, mas é movido por rancor e cheio de energia necrótica. Seu sangue virou um icor grosso e tóxico que exala um cheiro insuportável. Já não come carne: deseja a força vital dos vivos, caçando primeiro antigos parentes e aliados, mas atacando qualquer um. Humanoides que ele drena até a morte voltam como zumbis."
 },
 "aparicaoDeTumuloDePedra": {
  "id": "aparicaoDeTumuloDePedra",
  "tipo": "morto-vivo",
  "name": "Aparição de Túmulo de Pedra",
  "nomeOriginal": "Cairnwight",
  "fonte": "BGG",
  "size": "enorme",
  "level": 9,
  "cr": "9",
  "xp": 5000,
  "abilities": {
   "str": 23,
   "dex": 10,
   "con": 21,
   "int": 10,
   "wis": 12,
   "cha": 9
  },
  "ac": 19,
  "acNote": "armadura natural",
  "maxHp": 138,
  "hpDice": "12d12+60",
  "speedFt": 40,
  "senses": {
   "passivePerception": 15,
   "darkvisionFt": 60
  },
  "saves": [
   "con",
   "wis"
  ],
  "skills": [
   "atletismo",
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "furtividade"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "exausto",
   "amedrontado",
   "petrificado"
  ],
  "attacks": [
   {
    "name": "Pancada",
    "bonus": 10,
    "damage": "3d10+6",
    "type": "concussão",
    "reachFt": 10
   },
   {
    "name": "Rocha",
    "bonus": 10,
    "damage": "3d8+6",
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
   "sequencias": [
    [
     "Pancada",
     "Pancada"
    ],
    [
     "Rocha",
     "Rocha"
    ]
   ]
  },
  "acoesEspeciais": [
   {
    "nome": "Toque Petrificante",
    "recharge": [
     5,
     6
    ],
    "tipo": "alvo",
    "alcanceFt": 10,
    "save": "con",
    "dc": 17,
    "damage": "4d12",
    "damageType": "energético",
    "halfOnSave": false,
    "condition": "contido",
    "rounds": 10,
    "repete": true
   }
  ],
  "traits": [],
  "blurb": "Gigante morto-vivo que golpeia com alcance de 3 m e arremessa rochas que derrubam. Seu toque petrificante pode transformar um aventureiro em estátua em dois turnos.",
  "lore": "Quando um gigante das pedras morre obcecado por terminar uma obra inspirada por Skoraeus Ossos-de-Pedra, pode se erguer como esta criatura para concluí-la. Depois que a escultura fica pronta, ele permanece na caverna como guardião eterno dela. Parece um gigante das pedras esquelético, coberto de líquens e crostas minerais que o camuflam nas rochas do seu túmulo. Quem atrapalha o trabalho, danifica a arte ou rouba algo vira pedra, e a estátua resultante é deixada do lado de fora como aviso antes que a caverna seja selada de novo."
 },
 "ceratops": {
  "id": "ceratops",
  "tipo": "monstruosidade",
  "name": "Ceratops",
  "nomeOriginal": "Ceratops",
  "fonte": "BGG",
  "size": "imenso",
  "level": 9,
  "cr": "9",
  "xp": 5000,
  "abilities": {
   "str": 24,
   "dex": 8,
   "con": 21,
   "int": 4,
   "wis": 10,
   "cha": 7
  },
  "ac": 16,
  "acNote": "armadura natural",
  "maxHp": 139,
  "hpDice": "9d20+45",
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
    "bonus": 11,
    "damage": "4d10+7",
    "type": "perfurante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "2d10",
     "type": "perfurante"
    },
    "onHit": {
     "save": "str",
     "dc": 19,
     "condition": "caido",
     "rounds": 1,
     "repete": false
    }
   },
   {
    "name": "Pisotear",
    "bonus": 11,
    "damage": "4d10+7",
    "type": "concussão",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Chifrada",
    "Pisotear"
   ]
  },
  "traits": [
   "resistenciaAMagia"
  ],
  "blurb": "Um colosso de chifres que investe em linha reta para empalar e arremessar quem estiver no caminho, depois pisoteia o que caiu. Cada golpe tira quase 30 PV, e magia tem dificuldade em detê-lo.",
  "lore": "O ceratops é um dinossauro gigantesco com couraça óssea e chifres enormes, parente monstruoso dos tricerátopos. Vive em planícies selvagens e vales primitivos, pastando em manadas. Apesar de herbívoro, é extremamente territorial e reage a qualquer ameaça com uma carga devastadora. Sua resistência natural à magia faz dele um alvo cobiçado e perigoso para caçadores e domadores."
 },
 "colossoDeCinzas": {
  "id": "colossoDeCinzas",
  "tipo": "elemental",
  "name": "Colosso de Cinzas",
  "nomeOriginal": "Cinder Hulk",
  "fonte": "BGG",
  "size": "grande",
  "level": 5,
  "cr": "7",
  "xp": 2900,
  "abilities": {
   "str": 20,
   "dex": 12,
   "con": 20,
   "int": 9,
   "wis": 14,
   "cha": 10
  },
  "ac": 16,
  "acNote": "armadura natural",
  "maxHp": 84,
  "hpDice": "8d10+40",
  "speedFt": 40,
  "senses": {
   "passivePerception": 15
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
   "fogo",
   "veneno"
  ],
  "conditionImmunities": [
   "exausto",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Pancada",
    "bonus": 8,
    "damage": "2d10+5",
    "type": "concussão",
    "reachFt": 5,
    "danoExtra": {
     "damage": "3d6",
     "type": "fogo"
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
    "nome": "Onda de Cinzas",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 30,
    "save": "dex",
    "dc": 16,
    "damage": "7d8",
    "damageType": "fogo",
    "halfOnSave": true,
    "condition": "cego",
    "rounds": 1,
    "repete": false,
    "ateFimDoTurnoDele": true
   }
  ],
  "explosaoAoMorrer": {
   "pes": 10,
   "save": "con",
   "dc": 16,
   "dano": "3d6",
   "tipo": "fogo",
   "metade": false
  },
  "traits": [
   "explosaoAoMorrer"
  ],
  "blurb": "Bruto elemental que esmaga com punhos em brasa e lança ondas de cinza ardente que queimam e cegam. Mesmo morto é perigoso, pois deixa uma nuvem escaldante de fumaça.",
  "lore": "Esses elementais vêm de antigos gigantes de fogo que se afastaram do mundo e se encharcaram da energia dos Planos Elementais até virarem fumaça e brasa. Têm metade do tamanho dos ancestrais e conservam a silhueta deles, mas o corpo mal se mantém unido em meio a cinzas rodopiantes. Vivem em enclaves isolados em lugares ardentes do Plano Material, nos planos do Ar e do Fogo e sobretudo na Grande Conflagração, a fronteira entre esses dois. Não guardam nada da cultura dos gigantes: só querem queimar tudo o que puderem até que a própria chama se apague."
 },
 "giganteDasNuvensApostadorDoDestino": {
  "id": "giganteDasNuvensApostadorDoDestino",
  "tipo": "gigante",
  "name": "Gigante das Nuvens Apostador do Destino",
  "nomeOriginal": "Cloud Giant Destiny Gambler",
  "fonte": "BGG",
  "size": "enorme",
  "level": 17,
  "cr": "19",
  "xp": 22000,
  "abilities": {
   "str": 27,
   "dex": 12,
   "con": 22,
   "int": 19,
   "wis": 16,
   "cha": 22
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 337,
  "hpDice": "27d12+162",
  "speedFt": 40,
  "flyFt": 40,
  "hover": true,
  "speeds": {
   "flyFt": 40
  },
  "senses": {
   "passivePerception": 19,
   "truesightFt": 30
  },
  "saves": [
   "con",
   "int",
   "wis",
   "cha"
  ],
  "skills": [
   "enganacao",
   "intuicao",
   "percepcao"
  ],
  "expertise": [
   "enganacao"
  ],
  "damageImmunities": [
   "trovejante"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Cajado Voador",
    "bonus": 14,
    "damage": "3d6+8",
    "type": "concussão",
    "reachFt": 10,
    "rangeFt": 30,
    "longRangeFt": 90,
    "danoExtra": {
     "damage": "3d10",
     "type": "trovejante"
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Cajado Voador",
    "Cajado Voador",
    "Cajado Voador"
   ]
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "formaGasosa",
    "imagemMaior",
    "detectarMagia",
    "nevoaObscurecente",
    "luz",
    "ilusaoMenor"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "formaGasosa": 1,
    "imagemMaior": 1
   },
   "aVontade": [
    "detectarMagia",
    "nevoaObscurecente",
    "luz",
    "ilusaoMenor"
   ],
   "cdPorMagia": {
    "formaGasosa": 20,
    "imagemMaior": 20,
    "detectarMagia": 20,
    "nevoaObscurecente": 20,
    "luz": 20,
    "ilusaoMenor": 20
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Palmas Trovejantes",
    "tipo": "area",
    "shape": "raio",
    "areaFt": 60,
    "save": "con",
    "dc": 20,
    "damage": "8d12",
    "damageType": "trovejante",
    "halfOnSave": true,
    "condition": "caido",
    "rounds": 1,
    "repete": false,
    "ateFimDoTurnoDele": true
   }
  ],
  "traits": [
   "t_runaDasNuvens",
   "t_anularMagia"
  ],
  "blurb": "Arremessa e golpeia com um cajado que volta à mão, causando concussão e trovão, e invoca nuvens trovejantes que derrubam grupos inteiros. Enquanto tiver a máscara rúnica, enxerga através de ilusões e anula magias lançadas perto dele.",
  "lore": "Entre os gigantes das nuvens, a posição na hierarquia sobe com a riqueza acumulada, e muitos a conquistam em jogos de azar. O apostador do destino é aquele que venceu desafios cada vez mais arriscados contra gigantes, povos menores e até criaturas de outros planos. Usa uma meia-máscara rúnica sobre os olhos que revela invisibilidade, escuridão e truques mágicos. Tão confiante que deixa o rival escolher os termos da aposta, ele costuma punir com magia devastadora quem prefere o combate."
 },
 "giganteDasNuvensDoArMaligno": {
  "id": "giganteDasNuvensDoArMaligno",
  "tipo": "gigante",
  "name": "Gigante das Nuvens do Ar Maligno",
  "nomeOriginal": "Cloud Giant of Evil Air",
  "fonte": "BGG",
  "size": "enorme",
  "level": 9,
  "cr": "12",
  "xp": 8400,
  "abilities": {
   "str": 27,
   "dex": 10,
   "con": 22,
   "int": 12,
   "wis": 16,
   "cha": 19
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 200,
  "hpDice": "16d12+96",
  "speedFt": 40,
  "flyFt": 40,
  "speeds": {
   "flyFt": 40
  },
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
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Cimitarra",
    "bonus": 12,
    "damage": "3d6+8",
    "type": "cortante",
    "reachFt": 10
   },
   {
    "name": "Bumerangue de Tempestade",
    "bonus": 12,
    "damage": "3d4+8",
    "type": "concussão",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 60,
    "longRangeFt": 240,
    "danoExtra": {
     "damage": "2d6",
     "type": "trovejante"
    },
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
    "Cimitarra",
    "Cimitarra",
    "Bumerangue de Tempestade"
   ]
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "formaGasosa",
    "telecinesia",
    "detectarMagia",
    "nevoaObscurecente",
    "luz"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "formaGasosa": 1,
    "telecinesia": 2
   },
   "aVontade": [
    "detectarMagia",
    "nevoaObscurecente",
    "luz"
   ],
   "cdPorMagia": {
    "formaGasosa": 16,
    "telecinesia": 16,
    "detectarMagia": 16,
    "nevoaObscurecente": 16,
    "luz": 16
   }
  },
  "traits": [
   "voaSemProvocar"
  ],
  "blurb": "Voa sobre o campo de batalha golpeando com a cimitarra e arremessando um bumerangue de tempestade que pode atordoar alvos distantes. Escapa voando sem sofrer ataques de oportunidade.",
  "lore": "Alguns gigantes das nuvens abandonam os deuses do Ordning e passam a servir Yan-C-Bin, o Príncipe do Ar Maligno. Astutos, carismáticos e poderosos, costumam assumir o comando de cultos do Mal Elemental, que se tornam muito mais perigosos sob sua liderança. Sua fortuna pessoal também enche os cofres do culto e financia planos ambiciosos. Eles vestem um colete mágico com asas de penas de roca, imbuído de ar elemental, que só permite ao próprio dono voar."
 },
 "bercoDoRebentoDasNuvens": {
  "id": "bercoDoRebentoDasNuvens",
  "tipo": "elemental",
  "name": "Berço do Rebento das Nuvens",
  "nomeOriginal": "Cradle of the Cloud Scion",
  "fonte": "BGG",
  "size": "imenso",
  "level": 25,
  "cr": "26",
  "xp": 90000,
  "abilities": {
   "str": 29,
   "dex": 21,
   "con": 28,
   "int": 14,
   "wis": 22,
   "cha": 19
  },
  "ac": 19,
  "acNote": "armadura natural",
  "maxHp": 624,
  "hpDice": "32d20+288",
  "speedFt": 0,
  "flyFt": 90,
  "hover": true,
  "speeds": {
   "flyFt": 90
  },
  "senses": {
   "passivePerception": 16
  },
  "saves": [
   "int",
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
    "name": "Pancada",
    "bonus": 17,
    "damage": "4d10+9",
    "type": "concussão",
    "reachFt": 20,
    "danoExtra": {
     "damage": "3d12",
     "type": "trovejante"
    }
   },
   {
    "name": "Dardo de Vento",
    "bonus": 17,
    "damage": "4d8+9",
    "type": "concussão",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 120,
    "longRangeFt": 120,
    "danoExtra": {
     "damage": "3d6",
     "type": "trovejante"
    },
    "onHit": {
     "save": "str",
     "dc": 25,
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
     "Pancada",
     "Pancada",
     "Pancada"
    ],
    [
     "Dardo de Vento",
     "Dardo de Vento",
     "Dardo de Vento"
    ]
   ]
  },
  "recursos": {
   "resistenciaLendaria": 5
  },
  "acoesEspeciais": [
   {
    "nome": "Vórtice",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "raio",
    "areaFt": 90,
    "save": "dex",
    "dc": 25,
    "damage": "11d12",
    "damageType": "concussão",
    "halfOnSave": true,
    "condition": "contido",
    "rounds": 1,
    "repete": false,
    "ateFimDoTurnoDele": true
   }
  ],
  "repreensao": {
   "nome": "Trovoada",
   "alcanceFt": 60,
   "save": "con",
   "dc": 25,
   "damage": "4d8",
   "damageType": "trovejante",
   "metade": false,
   "raioFt": 30
  },
  "traits": [
   "despertarDoRebento",
   "voaSemProvocar",
   "resistenciaAMagia",
   "monstroDeCerco",
   "t_trovoada"
  ],
  "blurb": "Uma tempestade viva que voa sem provocar ataques de oportunidade, golpeia de longe com dardos de vento e prende grupos inteiros num vórtice esmagador. Ao ser derrotada, libera o Rebento de Memnor que guardava.",
  "lore": "O Berço é uma massa colossal de nuvens e vento que serve de casulo para o Rebento de Memnor, herdeiro do deus gigante da astúcia. Paira nas alturas, longe do chão, e responde a qualquer ferimento com estrondos de trovão. Seu temperamento é caótico como uma tormenta, mas protege com ferocidade o ser que carrega. Quando o invólucro se desfaz em fiapos de nuvem, o verdadeiro perigo desperta."
 },
 "bercoDoRebentoDeFogo": {
  "id": "bercoDoRebentoDeFogo",
  "tipo": "elemental",
  "name": "Berço do Rebento de Fogo",
  "nomeOriginal": "Cradle of the Fire Scion",
  "fonte": "BGG",
  "size": "imenso",
  "level": 25,
  "cr": "25",
  "xp": 75000,
  "abilities": {
   "str": 28,
   "dex": 12,
   "con": 27,
   "int": 12,
   "wis": 20,
   "cha": 17
  },
  "ac": 20,
  "acNote": "armadura natural",
  "maxHp": 555,
  "hpDice": "30d20+240",
  "speedFt": 40,
  "senses": {
   "passivePerception": 15,
   "darkvisionFt": 120
  },
  "saves": [],
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
   "exausto",
   "petrificado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Pancada",
    "bonus": 17,
    "damage": "4d10+9",
    "type": "concussão",
    "reachFt": 20,
    "danoExtra": {
     "damage": "4d6",
     "type": "fogo"
    }
   },
   {
    "name": "Arremessar Lava",
    "bonus": 17,
    "damage": "4d8+9",
    "type": "fogo",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 120,
    "longRangeFt": 120,
    "danoExtra": {
     "damage": "3d6",
     "type": "fogo"
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequencias": [
    [
     "Pancada",
     "Pancada",
     "Pancada"
    ],
    [
     "Arremessar Lava",
     "Arremessar Lava",
     "Arremessar Lava"
    ]
   ]
  },
  "recursos": {
   "resistenciaLendaria": 5
  },
  "acoesEspeciais": [
   {
    "nome": "Sopro Eruptivo",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 90,
    "save": "dex",
    "dc": 24,
    "damage": "10d10",
    "damageType": "fogo",
    "halfOnSave": true,
    "condition": "envenenado",
    "rounds": 10,
    "repete": false
   }
  ],
  "traits": [
   "despertarDoRebento",
   "resistenciaAMagia",
   "monstroDeCerco"
  ],
  "blurb": "Colosso vulcânico que esmaga com alcance enorme, arremessa lava que incendeia e cospe um cone de fogo venenoso. Ao ser derrotado, liberta o Rebento de Surtur, então a luta ainda não acabou.",
  "lore": "O berço é uma carapaça elemental de rocha e magma que abriga, em gestação, o rebento de Surtur, o senhor dos gigantes de fogo. Ele surge em lugares de atividade vulcânica ligados ao culto de Surtur e age com a crueldade metódica do seu criador. Fala gigante e primordial, e protege o ser que carrega até que este esteja pronto para despertar. Quando sua casca cai, o verdadeiro horror emerge das cinzas."
 },
 "bercoDoHerdeiroDoGelo": {
  "id": "bercoDoHerdeiroDoGelo",
  "tipo": "elemental",
  "name": "Berço do Herdeiro do Gelo",
  "nomeOriginal": "Cradle of the Frost Scion",
  "fonte": "BGG",
  "size": "imenso",
  "level": 21,
  "cr": "24",
  "xp": 62000,
  "abilities": {
   "str": 27,
   "dex": 14,
   "con": 26,
   "int": 11,
   "wis": 19,
   "cha": 16
  },
  "ac": 20,
  "acNote": "armadura natural",
  "maxHp": 499,
  "hpDice": "27d20+216",
  "speedFt": 40,
  "speeds": {
   "swimFt": 40
  },
  "senses": {
   "passivePerception": 14,
   "darkvisionFt": 120
  },
  "saves": [
   "wis",
   "cha"
  ],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "fogo",
   "elétrico",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "damageImmunities": [
   "frio",
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
    "bonus": 15,
    "damage": "4d10+8",
    "type": "concussão",
    "reachFt": 20,
    "danoExtra": {
     "damage": "2d10",
     "type": "frio"
    }
   },
   {
    "name": "Arremessar Estalactite",
    "bonus": 15,
    "damage": "4d8+8",
    "type": "perfurante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 120,
    "longRangeFt": 120,
    "danoExtra": {
     "damage": "2d8",
     "type": "frio"
    },
    "onHit": {
     "save": "str",
     "dc": 23,
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
     "Pancada",
     "Pancada"
    ],
    [
     "Arremessar Estalactite",
     "Arremessar Estalactite"
    ]
   ]
  },
  "recursos": {
   "resistenciaLendaria": 5
  },
  "acoesEspeciais": [
   {
    "nome": "Sopro Congelante",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 90,
    "save": "con",
    "dc": 23,
    "damage": "8d12",
    "damageType": "frio",
    "halfOnSave": true,
    "condition": "petrificado",
    "rounds": 1,
    "repete": false,
    "ateFimDoTurnoDele": true
   }
  ],
  "traits": [
   "despertarDoRebento",
   "resistenciaAMagia",
   "monstroDeCerco"
  ],
  "blurb": "Colosso de gelo que esmaga com alcance de 6 m, arremessa estalactites que derrubam e congela áreas inteiras com o sopro, que pode transformar vítimas em estátuas. Ao ser destruído, libera o herdeiro de Thrym que guardava dentro de si.",
  "lore": "Este gigante elemental de gelo é uma casca viva que abriga o herdeiro de Thrym, uma entidade nascida do frio primordial. Ele protege o ser em gestação enquanto caminha e nada pelas regiões geladas do mundo. Quando o berço se despedaça, o herdeiro desperta de imediato para continuar a luta. Fala gigante e primordial, e costuma agir com uma frieza implacável."
 },
 "bercoDoRebentoDasColinas": {
  "id": "bercoDoRebentoDasColinas",
  "tipo": "elemental",
  "name": "Berço do Rebento das Colinas",
  "nomeOriginal": "Cradle of the Hill Scion",
  "fonte": "BGG",
  "size": "imenso",
  "level": 21,
  "cr": "22",
  "xp": 41000,
  "abilities": {
   "str": 25,
   "dex": 10,
   "con": 24,
   "int": 9,
   "wis": 16,
   "cha": 10
  },
  "ac": 19,
  "acNote": "armadura natural",
  "maxHp": 402,
  "hpDice": "23d20+161",
  "speedFt": 40,
  "senses": {
   "passivePerception": 13
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
  "conditionImmunities": [
   "exausto",
   "paralisado",
   "petrificado",
   "envenenado",
   "caido"
  ],
  "attacks": [
   {
    "name": "Pancada",
    "bonus": 14,
    "damage": "4d12+7",
    "type": "concussão",
    "reachFt": 20
   },
   {
    "name": "Cuspir Rocha",
    "bonus": 14,
    "damage": "4d8+7",
    "type": "concussão",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 120,
    "longRangeFt": 120,
    "onHit": {
     "save": "str",
     "dc": 22,
     "condition": "caido",
     "rounds": 1,
     "repete": false
    }
   },
   {
    "name": "Raiz Agarradora",
    "bonus": 14,
    "damage": "4d10+7",
    "type": "concussão",
    "reachFt": 30
   }
  ],
  "multiattack": {
   "count": 4,
   "sequencias": [
    [
     "Pancada",
     "Pancada",
     "Pancada",
     "Raiz Agarradora"
    ],
    [
     "Cuspir Rocha",
     "Cuspir Rocha",
     "Cuspir Rocha",
     "Raiz Agarradora"
    ]
   ]
  },
  "recursos": {
   "resistenciaLendaria": 5
  },
  "acoesEspeciais": [
   {
    "nome": "Colinas Ondulantes",
    "recharge": [
     6
    ],
    "tipo": "area",
    "shape": "raio",
    "areaFt": 120,
    "save": "str",
    "dc": 22,
    "damage": "9d12",
    "damageType": "concussão",
    "halfOnSave": true,
    "condition": "caido",
    "rounds": 10,
    "repete": false
   }
  ],
  "traits": [
   "despertarDoRebento",
   "resistenciaAMagia",
   "monstroDeCerco"
  ],
  "blurb": "Uma colina viva que esmaga com pancadas de longo alcance, cospe rochas que derrubam e prende inimigos com raízes que os moem a cada turno. Ao ser destruída, libera o rebento de Grolantor que carrega dentro de si.",
  "lore": "Este colosso elemental de terra, musgo e raízes serve de casulo para um rebento do deus gigante Grolantor. Ele se ergue de colinas e encostas, movido por fome e fúria caótica. Enquanto avança, protege a criatura que amadurece em seu interior. Derrotá-lo é só a primeira parte da luta, pois o próprio rebento emerge dos restos."
 },
 "bercoDoRebentoDePedra": {
  "id": "bercoDoRebentoDePedra",
  "tipo": "elemental",
  "name": "Berço do Rebento de Pedra",
  "nomeOriginal": "Cradle of the Stone Scion",
  "fonte": "BGG",
  "size": "imenso",
  "level": 21,
  "cr": "23",
  "xp": 50000,
  "abilities": {
   "str": 26,
   "dex": 15,
   "con": 24,
   "int": 11,
   "wis": 18,
   "cha": 10
  },
  "ac": 20,
  "acNote": "armadura natural",
  "maxHp": 455,
  "hpDice": "26d20+182",
  "speedFt": 40,
  "senses": {
   "passivePerception": 14,
   "tremorsenseFt": 120
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
   "ácido",
   "veneno"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "exausto",
   "amedrontado",
   "paralisado",
   "petrificado",
   "envenenado",
   "caido"
  ],
  "attacks": [
   {
    "name": "Pancada",
    "bonus": 15,
    "damage": "4d10+8",
    "type": "concussão",
    "reachFt": 20
   },
   {
    "name": "Cuspir Pedra",
    "bonus": 15,
    "damage": "3d10+8",
    "type": "concussão",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 120,
    "longRangeFt": 120,
    "onHit": {
     "save": "str",
     "dc": 23,
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
     "Pancada",
     "Pancada"
    ],
    [
     "Cuspir Pedra",
     "Cuspir Pedra"
    ]
   ]
  },
  "recursos": {
   "resistenciaLendaria": 5
  },
  "acoesEspeciais": [
   {
    "nome": "Rugido Estilhaçante (Recarga 5-6)",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "raio",
    "areaFt": 60,
    "save": "con",
    "dc": 23,
    "damage": "6d10",
    "damageType": "trovejante",
    "halfOnSave": false,
    "condition": "incapacitado",
    "rounds": 1,
    "repete": false,
    "ateFimDoTurnoDele": true
   }
  ],
  "traits": [
   "despertarDoRebento",
   "resistenciaAMagia",
   "monstroDeCerco"
  ],
  "blurb": "Colosso de rocha e cristal que esmaga a até 6 m, cospe pedras que derrubam e ruge para incapacitar todos ao redor. Ao cair, libera o rebento de Skoraeus que guarda dentro de si.",
  "lore": "Este gigante elemental é uma casca viva de pedra que abriga o rebento de Skoraeus, um ser nascido do deus gigante das profundezas. Ele vagueia por cavernas e regiões montanhosas, sentindo cada passo pelo tremor do chão. Cristais brilham em sua carapaça e explodem em luz quando ameaçado. Protege o que carrega com fúria implacável, e destruí-lo é só metade da luta."
 },
 "bercoDoRebentoDaTempestade": {
  "id": "bercoDoRebentoDaTempestade",
  "tipo": "elemental",
  "name": "Berço do Rebento da Tempestade",
  "nomeOriginal": "Cradle of the Storm Scion",
  "fonte": "BGG",
  "size": "imenso",
  "level": 25,
  "cr": "27",
  "xp": 105000,
  "abilities": {
   "str": 30,
   "dex": 14,
   "con": 29,
   "int": 16,
   "wis": 23,
   "cha": 18
  },
  "ac": 19,
  "acNote": "armadura natural",
  "maxHp": 682,
  "hpDice": "35d20+315",
  "speedFt": 40,
  "flyFt": 60,
  "hover": true,
  "speeds": {
   "flyFt": 60,
   "swimFt": 60
  },
  "senses": {
   "passivePerception": 16
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "frio",
   "fogo",
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
   "petrificado",
   "envenenado",
   "caido",
   "contido",
   "atordoado"
  ],
  "attacks": [
   {
    "name": "Pancada",
    "bonus": 18,
    "damage": "4d12+10",
    "type": "concussão",
    "reachFt": 20,
    "danoExtra": {
     "damage": "3d12",
     "type": "elétrico"
    }
   },
   {
    "name": "Cuspir Granizo",
    "bonus": 18,
    "damage": "4d10+10",
    "type": "concussão",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 120,
    "longRangeFt": 120,
    "danoExtra": {
     "damage": "4d6",
     "type": "frio"
    },
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
   "sequencias": [
    [
     "Pancada",
     "Pancada",
     "Pancada"
    ],
    [
     "Cuspir Granizo",
     "Cuspir Granizo",
     "Cuspir Granizo"
    ]
   ]
  },
  "recursos": {
   "resistenciaLendaria": 5
  },
  "acoesEspeciais": [
   {
    "nome": "Saraivada de Relâmpagos (Recarga 5–6)",
    "recharge": [
     5,
     6
    ],
    "tipo": "alvo",
    "alcanceFt": 500,
    "alvos": 2,
    "save": "dex",
    "dc": 22,
    "damage": "11d12",
    "damageType": "elétrico",
    "halfOnSave": true,
    "condition": "atordoado",
    "rounds": 1,
    "repete": false,
    "ateFimDoTurnoDele": true
   }
  ],
  "repreensao": {
   "nome": "Passo Trovejante",
   "alcanceFt": 10,
   "save": "con",
   "dc": 22,
   "damage": "4d6",
   "damageType": "trovejante",
   "metade": true,
   "raioFt": 10
  },
  "traits": [
   "despertarDoRebento",
   "resistenciaAMagia",
   "monstroDeCerco",
   "t_passoTrovejante"
  ],
  "blurb": "Colosso de tempestade que esmaga de perto, derruba com granizo à distância e fulmina dois alvos com raios atordoantes a até 150 m. Ao ser ferido, salta entre trovões; e ao cair, libera o Rebento de Stronmaus.",
  "lore": "Este gigantesco elemental é um casulo vivo de nuvens, gelo e relâmpagos que guarda em seu interior o Rebento de Stronmaus, herdeiro do deus gigante das tempestades. Costuma surgir sobre mares revoltos e céus carregados, flutuando como uma tormenta com vontade própria. É caótico e impetuoso, mas não maligno, e reage com fúria a quem ameaça a gestação do rebento. Derrotá-lo não encerra a luta: sua destruição apenas liberta o ser que ele protegia."
 },
 "giganteDaMorteCeifador": {
  "id": "giganteDaMorteCeifador",
  "tipo": "gigante",
  "name": "Gigante da Morte Ceifador",
  "nomeOriginal": "Death Giant Reaper",
  "fonte": "BGG",
  "size": "enorme",
  "level": 9,
  "cr": "12",
  "xp": 8400,
  "abilities": {
   "str": 27,
   "dex": 14,
   "con": 20,
   "int": 18,
   "wis": 16,
   "cha": 16
  },
  "ac": 18,
  "acNote": "armadura de placas",
  "maxHp": 172,
  "hpDice": "15d12+75",
  "speedFt": 40,
  "senses": {
   "passivePerception": 17,
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
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "damageImmunities": [
   "necrótico"
  ],
  "conditionImmunities": [
   "amedrontado"
  ],
  "attacks": [
   {
    "name": "Foice",
    "bonus": 12,
    "damage": "3d8+8",
    "type": "cortante",
    "reachFt": 15,
    "danoExtra": {
     "damage": "2d10",
     "type": "necrótico"
    }
   },
   {
    "name": "Raio de Alma",
    "bonus": 8,
    "damage": "4d10+4",
    "type": "necrótico",
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
     "Foice",
     "Foice"
    ],
    [
     "Raio de Alma",
     "Raio de Alma"
    ]
   ]
  },
  "traits": [],
  "blurb": "Ceifa inimigos a 4,5 m com uma foice que soma dano necrótico, ou dispara raios de alma à distância que o curam quando o alvo está amedrontado. Teleporta-se espalhando terror por onde passa.",
  "lore": "Gigantes da morte são gigantes que trocaram a vida comum por um pacto com as forças do fim e da sombra. Os ceifadores são os guerreiros dessa linhagem, encarregados de colher almas e caçar quem foge do destino. Vestem armadura pesada e empunham foices enormes, surgindo e sumindo em meio ao medo que provocam. São astutos, estudiosos de magia e de história antiga, e não conhecem o pavor."
 },
 "giganteDaMorteAmortalhado": {
  "id": "giganteDaMorteAmortalhado",
  "tipo": "gigante",
  "name": "Gigante da Morte Amortalhado",
  "nomeOriginal": "Death Giant Shrouded One",
  "fonte": "BGG",
  "size": "enorme",
  "level": 13,
  "cr": "15",
  "xp": 13000,
  "abilities": {
   "str": 27,
   "dex": 14,
   "con": 20,
   "int": 23,
   "wis": 16,
   "cha": 16
  },
  "ac": 12,
  "acNote": "15 com armadura arcana",
  "maxHp": 195,
  "hpDice": "17d12+85",
  "speedFt": 40,
  "senses": {
   "passivePerception": 18,
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
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "damageImmunities": [
   "necrótico"
  ],
  "conditionImmunities": [
   "amedrontado"
  ],
  "attacks": [
   {
    "name": "Explosão de Almas",
    "bonus": 11,
    "damage": "4d10+6",
    "type": "necrótico",
    "reachFt": 10
   },
   {
    "name": "Foice Ceifadora",
    "bonus": 11,
    "damage": "7d10",
    "type": "necrótico",
    "reachFt": 15
   }
  ],
  "multiattack": {
   "count": 3,
   "sequencias": [
    [
     "Explosão de Almas",
     "Explosão de Almas",
     "Explosão de Almas"
    ],
    [
     "Foice Ceifadora",
     "Foice Ceifadora",
     "Foice Ceifadora"
    ]
   ]
  },
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "falarComOsMortos",
    "discoFlutuante",
    "detectarMagia",
    "armaduraArcana"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "falarComOsMortos": 3,
    "discoFlutuante": 3
   },
   "aVontade": [
    "detectarMagia",
    "armaduraArcana"
   ]
  },
  "traits": [
   "t_runaDaMorte"
  ],
  "blurb": "Mago gigante que dispara rajadas de almas à distância e, com sua runa da morte, ceifa inimigos com uma foice necrótica que impede cura. Teleporta-se espalhando medo e se envolve em almas que enfraquecem as resistências de quem chega perto.",
  "lore": "Gigantes da morte amortalhados são estudiosos da magia que se dedicam aos segredos do fim da vida. Carregam um crânio de gigante gravado com uma runa da morte, fonte de seus poderes mais temidos. Falam com os mortos para extrair conhecimento e tratam o medo alheio como alimento. Costumam agir com frieza calculada, mantendo distância e atacando de longe antes de se aproximar para a colheita."
 },
 "colossoDePoeira": {
  "id": "colossoDePoeira",
  "tipo": "elemental",
  "name": "Colosso de Poeira",
  "nomeOriginal": "Dust Hulk",
  "fonte": "BGG",
  "size": "grande",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 15,
   "dex": 19,
   "con": 16,
   "int": 10,
   "wis": 12,
   "cha": 8
  },
  "ac": 16,
  "acNote": "armadura natural",
  "maxHp": 68,
  "hpDice": "8d10+24",
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
  "saves": [],
  "skills": [],
  "expertise": [],
  "damageImmunities": [
   "veneno"
  ],
  "conditionImmunities": [
   "exausto",
   "agarrado",
   "paralisado",
   "petrificado",
   "envenenado",
   "contido"
  ],
  "attacks": [
   {
    "name": "Pancada",
    "bonus": 7,
    "damage": "2d8+4",
    "type": "concussão",
    "reachFt": 10
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Pancada",
    "Pancada",
    "Pancada"
   ]
  },
  "explosaoAoMorrer": {
   "pes": 10,
   "save": "con",
   "dc": 14,
   "condicao": "cego",
   "rounds": 10
  },
  "traits": [
   "t_poeiraArdente",
   "formaFluida",
   "explosaoAoMorrer"
  ],
  "blurb": "Nuvem de cascalho que flutua sobre os inimigos, desferindo três pancadas de longo alcance e cegando quem estiver dentro dela com poeira abrasiva. Ao morrer, explode numa nuvem que pode cegar todos ao redor.",
  "lore": "Os colossos de poeira vêm de antigos clãs de gigantes de pedra que viviam isolados em regiões inóspitas, até que a energia do Plano do Ar desgastou seus corpos e os converteu em elementais. Hoje não passam de massas de pó e pedrisco que mal se mantêm unidas. Herdaram o gosto artístico dos ancestrais, mas em vez de esculpir rocha tratam o próprio corpo como obra viva. Deslizam por correntes de vento e túneis subterrâneos como tempestades de areia, dançando com formas que nunca param de mudar."
 },
 "ecoDeDemogorgon": {
  "id": "ecoDeDemogorgon",
  "tipo": "corruptor",
  "name": "Eco de Demogorgon",
  "nomeOriginal": "Echo of Demogorgon",
  "fonte": "BGG",
  "size": "grande",
  "level": 5,
  "cr": "6",
  "xp": 2300,
  "abilities": {
   "str": 22,
   "dex": 10,
   "con": 17,
   "int": 10,
   "wis": 12,
   "cha": 14
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 85,
  "hpDice": "10d10+30",
  "speedFt": 40,
  "senses": {
   "passivePerception": 17,
   "darkvisionFt": 60
  },
  "saves": [
   "str",
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
   "elétrico"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "amedrontado"
  ],
  "attacks": [
   {
    "name": "Tentáculo",
    "bonus": 9,
    "damage": "2d6+6",
    "type": "concussão",
    "reachFt": 10,
    "danoExtra": {
     "damage": "2d8",
     "type": "necrótico"
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
   "resistenciaAMagia",
   "sempreAlerta"
  ],
  "blurb": "Golpeia duas vezes com tentáculos de 3 m de alcance que causam dano necrótico extra, e seus gritos dissonantes podem ferir a mente de um alvo ou forçá-lo a atacar os próprios aliados.",
  "lore": "Ettins que se dedicam ao Príncipe dos Demônios, vendo nele uma alma gêmea de duas cabeças, às vezes recebem de Demogorgon uma suposta recompensa por seus serviços no Plano Material. Essa dádiva os deforma: os braços viram tentáculos e as cabeças ganham feições animalescas. A mudança os mergulha numa fúria constante, e as duas cabeças vivem berrando e mordendo uma à outra. Esses uivos carregam magia demoníaca, espalhando dor psíquica e caos entre quem está por perto."
 },
 "ceremorfoEttin": {
  "id": "ceremorfoEttin",
  "tipo": "aberração",
  "name": "Ceremorfo Ettin",
  "nomeOriginal": "Ettin Ceremorph",
  "fonte": "BGG",
  "size": "grande",
  "level": 5,
  "cr": "8",
  "xp": 3900,
  "abilities": {
   "str": 18,
   "dex": 14,
   "con": 18,
   "int": 18,
   "wis": 15,
   "cha": 14
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 104,
  "hpDice": "11d10+44",
  "speedFt": 40,
  "senses": {
   "passivePerception": 18,
   "darkvisionFt": 120
  },
  "saves": [
   "int",
   "wis"
  ],
  "skills": [
   "percepcao"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageResistances": [
   "psíquico"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "amedrontado",
   "atordoado",
   "inconsciente"
  ],
  "attacks": [
   {
    "name": "Pancada",
    "bonus": 7,
    "damage": "4d8+4",
    "type": "concussão",
    "reachFt": 10
   },
   {
    "name": "Tentáculos",
    "bonus": 7,
    "damage": "2d10+4",
    "type": "psíquico",
    "reachFt": 10,
    "onHit": {
     "save": "int",
     "dc": 15,
     "condition": "agarrado",
     "rounds": 1,
     "repete": false
    }
   },
   {
    "name": "Extrair Cérebro",
    "bonus": 7,
    "damage": "10d10",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Raio Mental (3/Dia)",
    "bonus": 7,
    "damage": "2d12+4",
    "type": "psíquico",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 120,
    "longRangeFt": 120,
    "onHit": {
     "save": "int",
     "dc": 15,
     "condition": "atordoado",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Pancada",
    "Tentáculos"
   ]
  },
  "traits": [
   "resistenciaAMagia"
  ],
  "blurb": "Gigante psiônico que esmaga e agarra com tentáculos capazes de atordoar, disparando raios mentais à distância. Quem fica preso e incapacitado corre o risco de ter o cérebro arrancado.",
  "lore": "É o resultado de experiências dos devoradores de mentes com ettins: as duas cabeças do gigante alimentam dois girinos illithid, que juntos conseguem transformar o corpo inteiro. Uma das cabeças afunda no tronco e passa a cuidar apenas do controle físico, enquanto a outra se dedica ao raciocínio e aos poderes psiônicos, mais fracos que os de um illithid comum. Essas criaturas servem às colônias de devoradores de mentes como guardiões dos cérebros anciões e de seus tesouros. Não guardam qualquer lembrança da vida que tinham como ettins."
 },
 "fensirDevorador": {
  "id": "fensirDevorador",
  "tipo": "celestial",
  "name": "Fensir Devorador",
  "nomeOriginal": "Fensir Devourer",
  "fonte": "BGG",
  "size": "enorme",
  "level": 5,
  "cr": "8",
  "xp": 3900,
  "abilities": {
   "str": 20,
   "dex": 10,
   "con": 21,
   "int": 10,
   "wis": 14,
   "cha": 11
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 138,
  "hpDice": "12d12+60",
  "speedFt": 40,
  "senses": {
   "passivePerception": 18,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "percepcao",
   "sobrevivencia"
  ],
  "expertise": [
   "percepcao",
   "sobrevivencia"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Dilacerar",
    "bonus": 8,
    "damage": "3d10+5",
    "type": "cortante",
    "reachFt": 10
   },
   {
    "name": "Rocha",
    "bonus": 8,
    "damage": "2d12+5",
    "type": "concussão",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 60,
    "longRangeFt": 240,
    "onHit": {
     "save": "str",
     "dc": 16,
     "condition": "caido",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "multiattack": {
   "count": 2
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
   "t_maldicaoDaMorte",
   "regeneracaoDoLivro",
   "sunlightSensitivity"
  ],
  "blurb": "Gigante brutal que rasga com garras de longo alcance e arremessa rochas capazes de derrubar alvos; regenera a cada turno, a menos que sofra ácido ou fogo. Ao morrer, lança uma maldição que impede descanso e corrói a mente de quem estiver perto.",
  "lore": "Os fensires devoradores são celestiais decaídos de linhagem trollesca, ligados às terras geladas dos gigantes. Caçam em bandos ou sozinhos, rastreando presas pela noite e pelas florestas escuras. Temem o sol, que transforma sua carne em pedra, por isso se escondem em cavernas durante o dia. Mesmo derrotados, deixam para trás uma praga amarga em quem os matou."
 },
 "fensirEscaramucador": {
  "id": "fensirEscaramucador",
  "tipo": "gigante",
  "name": "Fensir Escaramuçador",
  "nomeOriginal": "Fensir Skirmisher",
  "fonte": "BGG",
  "size": "grande",
  "level": 5,
  "cr": "6",
  "xp": 2300,
  "abilities": {
   "str": 18,
   "dex": 15,
   "con": 20,
   "int": 14,
   "wis": 11,
   "cha": 12
  },
  "ac": 15,
  "acNote": "camisão de malha",
  "maxHp": 94,
  "hpDice": "9d10+45",
  "speedFt": 30,
  "senses": {
   "passivePerception": 16,
   "darkvisionFt": 60
  },
  "saves": [
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
    "name": "Machado de Batalha",
    "bonus": 7,
    "damage": "2d8+4",
    "type": "cortante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "2d10+4",
     "type": "cortante"
    }
   },
   {
    "name": "Pedra Mágica",
    "bonus": 5,
    "damage": "2d12+2",
    "type": "concussão",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 60,
    "longRangeFt": 60,
    "onHit": {
     "save": "str",
     "dc": 13,
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
     "Machado de Batalha",
     "Machado de Batalha",
     "Machado de Batalha"
    ],
    [
     "Pedra Mágica",
     "Pedra Mágica"
    ]
   ]
  },
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "criarDestruirAgua",
    "detectarMagia",
    "passosSemPegadas"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "criarDestruirAgua": 1,
    "detectarMagia": 1,
    "passosSemPegadas": 1
   }
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
   "t_lamaEmPedra",
   "regeneracaoDoLivro",
   "sunlightSensitivity"
  ],
  "blurb": "Gigante regenerador que golpeia com machado de batalha três vezes ou arremessa pedras mágicas que derrubam, e lança lama que petrifica grupos inteiros. Fogo, ácido ou luz do sol são as chaves para derrubá-lo.",
  "lore": "Os fensir são gigantes ligados às trolls e às terras selvagens do norte, vivendo em cavernas e florestas sombrias longe do sol. O escaramuçador patrulha as fronteiras do território do seu clã, emboscando intrusos com táticas rápidas. Teme a luz do dia, que pode transformá-lo em pedra, por isso age principalmente à noite ou sob o céu encoberto. Apesar da brutalidade, é astuto e conhece magias simples de rastreio e sobrevivência."
 },
 "guardiaoPrimordialFirbolg": {
  "id": "guardiaoPrimordialFirbolg",
  "tipo": "humanoide",
  "name": "Guardião Primordial Firbolg",
  "nomeOriginal": "Firbolg Primeval Warden",
  "fonte": "BGG",
  "size": "médio",
  "level": 1,
  "cr": "4",
  "xp": 1100,
  "abilities": {
   "str": 16,
   "dex": 14,
   "con": 14,
   "int": 12,
   "wis": 16,
   "cha": 11
  },
  "ac": 16,
  "acNote": "gibão de peles e escudo",
  "maxHp": 65,
  "hpDice": "10d8+20",
  "speedFt": 30,
  "senses": {
   "passivePerception": 17
  },
  "saves": [
   "int",
   "wis"
  ],
  "skills": [
   "medicina",
   "natureza",
   "percepcao"
  ],
  "expertise": [
   "percepcao"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Lança",
    "bonus": 5,
    "damage": "1d6+3",
    "type": "perfurante",
    "reachFt": 5,
    "rangeFt": 20,
    "longRangeFt": 60,
    "danoExtra": {
     "damage": "2d8",
     "type": "fogo"
    }
   },
   {
    "name": "Lança de Fogo",
    "bonus": 5,
    "damage": "2d10+3",
    "type": "fogo",
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
     "Lança",
     "Lança"
    ],
    [
     "Lança de Fogo",
     "Lança de Fogo"
    ]
   ]
  },
  "spellcasting": {
   "ability": "wis",
   "cantrips": [],
   "prepared": [
    "comunhaoComANatureza",
    "detectarMagia",
    "disfarcarSe",
    "emaranhar",
    "falarComAnimais",
    "falarComPlantas"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "comunhaoComANatureza": 1,
    "detectarMagia": 1,
    "disfarcarSe": 1
   },
   "aVontade": [
    "emaranhar",
    "falarComAnimais",
    "falarComPlantas"
   ],
   "cdPorMagia": {
    "comunhaoComANatureza": 13,
    "detectarMagia": 13,
    "disfarcarSe": 13,
    "emaranhar": 13,
    "falarComAnimais": 13,
    "falarComPlantas": 13
   }
  },
  "traits": [],
  "blurb": "Combate com lança envolta em chamas ou dispara lanças de fogo a longa distância, e pode sumir invisível para se reposicionar. Também prende inimigos com vinhas mágicas.",
  "lore": "Os guardiões primordiais são druidas firbolg que zelam pelas florestas antigas e seus segredos. Costumam viver isolados em bosques remotos, conversando com plantas e animais para saber o que se passa em seus domínios. Preferem evitar conflitos e se escondem dos forasteiros, mas defendem a natureza com fogo e magia quando ela é ameaçada."
 },
 "firbolgAndarilho": {
  "id": "firbolgAndarilho",
  "tipo": "humanoide",
  "name": "Firbolg Andarilho",
  "nomeOriginal": "Firbolg Wanderer",
  "fonte": "BGG",
  "size": "médio",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 16,
   "dex": 14,
   "con": 16,
   "int": 14,
   "wis": 17,
   "cha": 16
  },
  "ac": 16,
  "acNote": "peitoral",
  "maxHp": 90,
  "hpDice": "12d8+36",
  "speedFt": 30,
  "senses": {
   "passivePerception": 16
  },
  "saves": [
   "dex",
   "cha"
  ],
  "skills": [
   "percepcao",
   "persuasao",
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [],
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
    "name": "Raio Enfeitiçante",
    "bonus": 6,
    "damage": "2d6+3",
    "type": "psíquico",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 60,
    "longRangeFt": 60,
    "onHit": {
     "save": "cha",
     "dc": 14,
     "condition": "enfeiticado",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "multiattack": {
   "count": 2
  },
  "spellcasting": {
   "ability": "wis",
   "cantrips": [],
   "prepared": [
    "detectarMagia",
    "disfarcarSe",
    "dissiparMagia",
    "metamorfose",
    "maoMagica",
    "ilusaoMenor",
    "risoHisterico"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "detectarMagia": 1,
    "disfarcarSe": 1,
    "dissiparMagia": 1,
    "metamorfose": 1
   },
   "aVontade": [
    "maoMagica",
    "ilusaoMenor",
    "risoHisterico"
   ],
   "cdPorMagia": {
    "detectarMagia": 14,
    "disfarcarSe": 14,
    "dissiparMagia": 14,
    "metamorfose": 14,
    "maoMagica": 14,
    "ilusaoMenor": 14,
    "risoHisterico": 14
   }
  },
  "traits": [],
  "blurb": "Combina espada longa e raios psíquicos que enfeitiçam, e usa uma duplicata ilusória para trocar de lugar e confundir os inimigos. Também lança magias como riso histérico e metamorfose.",
  "lore": "Firbolgs andarilhos são viajantes solitários que percorrem florestas e estradas, guardando a natureza e ajudando quem encontram. Servem como clérigos de divindades ligadas aos bosques. Preferem truques e ilusões à violência direta, disfarçando-se para observar os povos que visitam. Quando provocados, lutam com firmeza e magia que perturba a mente."
 },
 "giganteDeFogoInvocadorDaForja": {
  "id": "giganteDeFogoInvocadorDaForja",
  "tipo": "gigante",
  "name": "Gigante de Fogo Invocador da Forja",
  "nomeOriginal": "Fire Giant Forgecaller",
  "fonte": "BGG",
  "size": "enorme",
  "level": 17,
  "cr": "18",
  "xp": 20000,
  "abilities": {
   "str": 25,
   "dex": 11,
   "con": 23,
   "int": 16,
   "wis": 21,
   "cha": 18
  },
  "ac": 18,
  "acNote": "armadura de placas",
  "maxHp": 312,
  "hpDice": "25d12+150",
  "speedFt": 30,
  "flyFt": 30,
  "hover": true,
  "speeds": {
   "flyFt": 30
  },
  "senses": {
   "passivePerception": 21
  },
  "saves": [
   "dex",
   "int",
   "wis"
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
    "name": "Martelo da Forja",
    "bonus": 13,
    "damage": "5d6+7",
    "type": "concussão",
    "reachFt": 10,
    "onHit": {
     "save": "con",
     "dc": 19,
     "danoSeFalhar": {
      "damage": "3d6",
      "type": "fogo"
     },
     "metadeSePassar": false
    }
   },
   {
    "name": "Rocha Incandescente",
    "bonus": 13,
    "damage": "3d10+7",
    "type": "concussão",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 60,
    "longRangeFt": 240,
    "danoExtra": {
     "damage": "3d12",
     "type": "fogo"
    },
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
   "sequencias": [
    [
     "Martelo da Forja",
     "Martelo da Forja",
     "Martelo da Forja"
    ],
    [
     "Rocha Incandescente",
     "Rocha Incandescente"
    ]
   ]
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "acoesEspeciais": [
   {
    "nome": "Onda de Magma",
    "tipo": "area",
    "shape": "cone",
    "areaFt": 30,
    "save": "dex",
    "dc": 19,
    "damage": "8d8",
    "damageType": "fogo",
    "halfOnSave": true,
    "condition": "contido",
    "rounds": 10,
    "repete": false
   }
  ],
  "traits": [
   "t_runaDeFogo"
  ],
  "blurb": "Esmaga com um martelo que superaquece todo metal ao redor e arremessa rochas incandescentes que derrubam. Com sua runa de fogo, solta ondas de magma que prendem grupos inteiros e se envolve em fumaça para ganhar cobertura.",
  "lore": "É um gigante de fogo que dominou a antiga magia das runas e consegue comandar o calor dos vulcões, o fogo e o magma. Nas comunidades de sua raça, cuida das forjas e da defesa, muitas vezes em nome de Surtur. Alguns preferem a solidão e buscam o coração dos vulcões ou o Plano Elemental do Fogo para aperfeiçoar seu ofício. Sua armadura parece mal conter o calor e a fumaça que vazam dela, e ele voa impulsionado por jatos de chamas mágicas."
 },
 "giganteDoFogoDoFogoMaligno": {
  "id": "giganteDoFogoDoFogoMaligno",
  "tipo": "gigante",
  "name": "Gigante do Fogo do Fogo Maligno",
  "nomeOriginal": "Fire Giant of Evil Fire",
  "fonte": "BGG",
  "size": "enorme",
  "level": 9,
  "cr": "10",
  "xp": 5900,
  "abilities": {
   "str": 25,
   "dex": 9,
   "con": 23,
   "int": 10,
   "wis": 19,
   "cha": 14
  },
  "ac": 18,
  "acNote": "armadura de placas",
  "maxHp": 150,
  "hpDice": "12d12+72",
  "speedFt": 30,
  "senses": {
   "passivePerception": 18
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
   "fogo"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Cetro Abrasador",
    "bonus": 11,
    "damage": "3d6+7",
    "type": "concussão",
    "reachFt": 10,
    "danoExtra": {
     "damage": "2d8",
     "type": "fogo"
    }
   },
   {
    "name": "Raio de Imix",
    "bonus": 8,
    "damage": "3d10+4",
    "type": "fogo",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 120,
    "longRangeFt": 120,
    "onHit": {
     "save": "wis",
     "dc": 16,
     "condition": "amedrontado",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequencias": [
    [
     "Cetro Abrasador",
     "Cetro Abrasador"
    ],
    [
     "Raio de Imix",
     "Raio de Imix"
    ]
   ]
  },
  "explosaoAoMorrer": {
   "pes": 10,
   "save": "dex",
   "dc": 18,
   "dano": "6d6",
   "tipo": "perfurante",
   "metade": true
  },
  "traits": [
   "explosaoAoMorrer"
  ],
  "blurb": "Esmaga com um cetro em brasa que marca o alvo e impede que ele fique invisível, ou lança rajadas de fogo de longe que amedrontam. Mantenha distância quando ele cair: a armadura explode em estilhaços.",
  "lore": "Alguns gigantes do fogo, de tanto encarar as chamas, acabam percebendo Imix, o Príncipe do Fogo Maligno, olhando de volta para eles. Corrompidos, uns abandonam seus lares para se unir a cultistas, e outros continuam em suas comunidades, servindo em segredo aos planos destrutivos de Imix. Eles forjam armas e armaduras em chamas abençoadas pelo príncipe, e o metal se funde à carne, tornando impossível retirá-lo. Quando o gigante morre, a armadura detona como uma última dádiva do fogo devorador."
 },
 "infernalDeFogo": {
  "id": "infernalDeFogo",
  "tipo": "corruptor",
  "name": "Infernal de Fogo",
  "nomeOriginal": "Fire Hellion",
  "fonte": "BGG",
  "size": "enorme",
  "level": 9,
  "cr": "11",
  "xp": 7200,
  "abilities": {
   "str": 25,
   "dex": 10,
   "con": 23,
   "int": 16,
   "wis": 14,
   "cha": 21
  },
  "ac": 18,
  "acNote": "armadura de placas",
  "maxHp": 175,
  "hpDice": "14d12+84",
  "speedFt": 30,
  "senses": {
   "passivePerception": 16,
   "darkvisionFt": 120
  },
  "saves": [
   "wis",
   "cha"
  ],
  "skills": [
   "arcanismo",
   "atletismo",
   "percepcao"
  ],
  "expertise": [],
  "damageImmunities": [
   "fogo"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "amedrontado"
  ],
  "attacks": [
   {
    "name": "Maça-Estrela",
    "bonus": 11,
    "damage": "3d8+7",
    "type": "perfurante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "2d10",
     "type": "fogo"
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Maça-Estrela",
    "Maça-Estrela"
   ]
  },
  "acoesEspeciais": [
   {
    "nome": "Orbe Infernal",
    "tipo": "area",
    "shape": "raio",
    "areaFt": 120,
    "save": "dex",
    "dc": 17,
    "damage": "4d8",
    "damageType": "fogo",
    "halfOnSave": true
   }
  ],
  "traits": [
   "resistenciaAMagia",
   "t_tomadorDeAlmas"
  ],
  "blurb": "Gigante corrompido que esmaga com uma maça-estrela flamejante de longo alcance, impedindo a cura de quem atinge, e lança esferas de fogo infernal à distância. Quem cai diante dele tem a alma arrastada para Avernus.",
  "lore": "É um gigante de fogo que, obcecado pela Guerra Sangrenta, firmou pacto com um diabo poderoso em troca de táticas e dons mágicos. Com o tempo, o acordo o transformou em um corruptor, com chifres, cascos fendidos e cauda bifurcada. O diabo lhe ensinou a forjar ferro infernal com fogo dos Nove Infernos, criando armas que enviam as almas dos mortos para Avernus. Assim, o mestre recebe almas sem parar, e o gigante promete servi-lo como ferreiro após a morte."
 },
 "mortalhaIgnea": {
  "id": "mortalhaIgnea",
  "tipo": "morto-vivo",
  "name": "Mortalha Ígnea",
  "nomeOriginal": "Firegaunt",
  "fonte": "BGG",
  "size": "enorme",
  "level": 9,
  "cr": "11",
  "xp": 7200,
  "abilities": {
   "str": 25,
   "dex": 7,
   "con": 23,
   "int": 10,
   "wis": 14,
   "cha": 13
  },
  "ac": 15,
  "acNote": "placas danificadas",
  "maxHp": 175,
  "hpDice": "14d12+84",
  "speedFt": 40,
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
  "damageResistances": [
   "necrótico"
  ],
  "damageImmunities": [
   "fogo",
   "veneno"
  ],
  "conditionImmunities": [
   "exausto",
   "petrificado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Marreta Incandescente",
    "bonus": 11,
    "damage": "3d10+7",
    "type": "concussão",
    "reachFt": 10,
    "onHit": {
     "save": "dex",
     "dc": 18,
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
    "Marreta Incandescente",
    "Marreta Incandescente"
   ]
  },
  "breath": {
   "name": "Raios Carmesins",
   "kind": "save",
   "shape": "cone",
   "areaFt": 30,
   "save": "dex",
   "dc": 18,
   "damage": "7d8",
   "damageType": "fogo",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    5,
    6
   ]
  },
  "traits": [
   "t_sangueDeFogo"
  ],
  "blurb": "Gigante morto-vivo que esmaga com uma marreta incandescente de longo alcance e dispara raios carmesins num cone que incendeia todos os atingidos. Golpear de perto com lâminas ou pontas faz seu sangue de fogo queimar o atacante.",
  "lore": "Quando um gigante de fogo morre consumido por um ódio grande demais para deixá-lo partir, ele se levanta como uma mortalha ígnea. Não busca perdão nem descanso: quer apenas destruir o máximo de vidas antes de enfim se apagar. Seu corpo parece um cadáver carbonizado, com chamas vermelhas sobrenaturais correndo pelas veias e escapando pelas feridas e pela boca. Vaga à procura de criaturas vivas para aniquilar."
 },
 "colossoDeCarne": {
  "id": "colossoDeCarne",
  "tipo": "constructo",
  "name": "Colosso de Carne",
  "nomeOriginal": "Flesh Colossus",
  "fonte": "BGG",
  "size": "imenso",
  "level": 17,
  "cr": "20",
  "xp": 25000,
  "abilities": {
   "str": 24,
   "dex": 9,
   "con": 24,
   "int": 6,
   "wis": 10,
   "cha": 5
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 280,
  "hpDice": "16d20+112",
  "speedFt": 60,
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 120
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "damageImmunities": [
   "elétrico",
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
    "name": "Punho",
    "bonus": 13,
    "damage": "3d6+7",
    "type": "concussão",
    "reachFt": 20
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Punho",
    "Punho"
   ]
  },
  "acoesEspeciais": [
   {
    "nome": "Sopro Elemental",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 90,
    "save": "dex",
    "dc": 21,
    "damage": "9d8",
    "damageType": "energético",
    "halfOnSave": true
   }
  ],
  "traits": [
   "furorDoGolem",
   "formaImutavel",
   "resistenciaAMagia",
   "monstroDeCerco"
  ],
  "blurb": "Um gigante costurado que agarra até duas vítimas com punhos de 6 m de alcance, engole os presos em seu peito e cospe um sopro elemental devastador num cone de 27 m. Destruir o núcleo no peito impede que ele engula, mas o deixa enfurecido.",
  "lore": "Nos primórdios dos impérios gigantes, magos dessa raça juntaram a carne de gigantes mortos sobre um esqueleto de adamante para que continuassem servindo. No peito do colosso pulsa uma esfera de pedra que abriga espíritos de todos os planos elementais e funciona como seu coração. Muitos desses construtos antigos ainda vigiam ruínas esquecidas, locais sagrados e tesouros perdidos. Talvez algum deles proteja o segredo de como fabricar novos colossos."
 },
 "fomorianoRastejadorDasProfundezas": {
  "id": "fomorianoRastejadorDasProfundezas",
  "tipo": "gigante",
  "name": "Fomoriano Rastejador das Profundezas",
  "nomeOriginal": "Fomorian Deep Crawler",
  "fonte": "BGG",
  "size": "enorme",
  "level": 9,
  "cr": "10",
  "xp": 5900,
  "abilities": {
   "str": 23,
   "dex": 15,
   "con": 20,
   "int": 9,
   "wis": 17,
   "cha": 6
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 184,
  "hpDice": "16d12+80",
  "speedFt": 30,
  "speeds": {
   "climbFt": 30
  },
  "senses": {
   "passivePerception": 17,
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
    "name": "Pancada",
    "bonus": 10,
    "damage": "3d10+6",
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
    "nome": "Maldição Rastejante",
    "recharge": [
     4,
     5,
     6
    ],
    "tipo": "alvo",
    "alcanceFt": 60,
    "save": "wis",
    "dc": 15,
    "damage": "7d8",
    "damageType": "psíquico",
    "halfOnSave": false,
    "condition": "caido",
    "rounds": 100,
    "repete": false
   }
  ],
  "traits": [
   "t_contorcionista",
   "t_posturaRastejante",
   "spiderClimb"
  ],
  "blurb": "Gigante que se arrasta pelas paredes e tetos e esmaga com pancadas de 3 m de alcance. Sua maldição psíquica derruba a vítima e a impede de se levantar por uma hora.",
  "lore": "Fomorianos são gigantes deformados por antigas maldições, exilados nas cavernas do Subterrâneo. Este ramo da linhagem se adaptou a túneis estreitos, rastejando de bruços com corpo retorcido e membros longos. Espreita no escuro, preso ao teto, e cai sobre quem passa. Ressentido e cruel, gosta de ver as presas rastejarem como ele."
 },
 "fomorianoNobre": {
  "id": "fomorianoNobre",
  "tipo": "gigante",
  "name": "Fomoriano Nobre",
  "nomeOriginal": "Fomorian Noble",
  "fonte": "BGG",
  "size": "enorme",
  "level": 13,
  "cr": "15",
  "xp": 13000,
  "abilities": {
   "str": 23,
   "dex": 18,
   "con": 20,
   "int": 19,
   "wis": 14,
   "cha": 16
  },
  "ac": 14,
  "acNote": "17 com armadura arcana",
  "maxHp": 253,
  "hpDice": "22d12+110",
  "speedFt": 30,
  "senses": {
   "passivePerception": 17
  },
  "saves": [
   "int",
   "wis",
   "cha"
  ],
  "skills": [
   "arcanismo",
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "arcanismo"
  ],
  "conditionImmunities": [
   "enfeitiçado"
  ],
  "attacks": [
   {
    "name": "Bastão",
    "bonus": 11,
    "damage": "3d6+6",
    "type": "concussão",
    "reachFt": 10,
    "danoExtra": {
     "damage": "2d10",
     "type": "energético"
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Bastão",
    "Bastão",
    "Bastão"
   ]
  },
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "correnteDeRelampagos",
    "coneDeFrio",
    "bolaDeFogo",
    "voo",
    "viagemPlanar",
    "armaduraArcana",
    "maoMagica",
    "prestidigitacao"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "correnteDeRelampagos": 1,
    "coneDeFrio": 1,
    "bolaDeFogo": 1,
    "voo": 1,
    "viagemPlanar": 1
   },
   "aVontade": [
    "armaduraArcana",
    "maoMagica",
    "prestidigitacao"
   ],
   "cdPorMagia": {
    "correnteDeRelampagos": 17,
    "coneDeFrio": 17,
    "bolaDeFogo": 17,
    "voo": 17,
    "viagemPlanar": 17,
    "armaduraArcana": 17,
    "maoMagica": 17,
    "prestidigitacao": 17
   }
  },
  "traits": [],
  "blurb": "Gigante conjurador que golpeia com um bastão de alcance longo e lança relâmpagos, fogo e gelo em área. Sua presença sedutora pode enfeitiçar inimigos como ação bônus.",
  "lore": "Os nobres fomorianos são gigantes deformados que dominam magia arcana e se veem como a aristocracia de sua espécie. Costumam habitar o Subterrâneo ou recantos feéricos sombrios, cercados de servos enfeitiçados. Cruéis e vaidosos, usam o charme para manipular e a magia para punir quem os desafia. Quando a luta vira contra eles, preferem fugir para outro plano a morrer."
 },
 "fomorianoBruxoDasTrevas": {
  "id": "fomorianoBruxoDasTrevas",
  "tipo": "gigante",
  "name": "Fomoriano Bruxo das Trevas",
  "nomeOriginal": "Fomorian Warlock of the Dark",
  "fonte": "BGG",
  "size": "enorme",
  "level": 9,
  "cr": "12",
  "xp": 8400,
  "abilities": {
   "str": 23,
   "dex": 13,
   "con": 20,
   "int": 9,
   "wis": 14,
   "cha": 18
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 207,
  "hpDice": "18d12+90",
  "speedFt": 30,
  "senses": {
   "passivePerception": 16,
   "darkvisionFt": 120
  },
  "saves": [
   "wis",
   "cha"
  ],
  "skills": [
   "arcanismo",
   "percepcao",
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Grande Porrete",
    "bonus": 10,
    "damage": "3d8+6",
    "type": "concussão",
    "reachFt": 15,
    "danoExtra": {
     "damage": "2d6",
     "type": "necrótico"
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Grande Porrete",
    "Grande Porrete",
    "Grande Porrete"
   ]
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "detectarPensamentos",
    "sugestao",
    "telecinesia",
    "detectarMagia",
    "levitacao",
    "maoMagica",
    "prestidigitacao"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "detectarPensamentos": 1,
    "sugestao": 1,
    "telecinesia": 1
   },
   "aVontade": [
    "detectarMagia",
    "levitacao",
    "maoMagica",
    "prestidigitacao"
   ],
   "cdPorMagia": {
    "detectarPensamentos": 16,
    "sugestao": 16,
    "telecinesia": 16,
    "detectarMagia": 16,
    "levitacao": 16,
    "maoMagica": 16,
    "prestidigitacao": 16
   }
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "acoesEspeciais": [
   {
    "nome": "Maldição Corruptora",
    "tipo": "alvo",
    "alcanceFt": 60,
    "save": "cha",
    "dc": 16,
    "damage": "6d8",
    "damageType": "necrótico",
    "halfOnSave": false
   },
   {
    "nome": "Explosão Sobrenatural",
    "tipo": "area",
    "shape": "raio",
    "areaFt": 120,
    "save": "dex",
    "dc": 16,
    "damage": "5d12",
    "damageType": "energético",
    "halfOnSave": true,
    "condition": "caido",
    "rounds": 10,
    "repete": false
   }
  ],
  "features": [
   "devilsSight"
  ],
  "repreensao": {
   "nome": "Repreensão Venenosa",
   "alcanceFt": 60,
   "save": "con",
   "dc": 16,
   "condition": "envenenado"
  },
  "traits": [
   "t_runaDeSangue",
   "t_repreensaoVenenosa"
  ],
  "blurb": "Gigante deformado que esmaga com um grande porrete de longo alcance e lança explosões de energia arcana e trevas que cegam. Com sua runa de sangue, amaldiçoa alvos à distância e envenena quem o fere.",
  "lore": "Fomorianos são gigantes de corpo retorcido que habitam as profundezas do Subterrâneo, marcados por uma antiga maldição. Alguns buscam pactos com poderes sombrios e se tornam bruxos, trocando a força bruta por magia corruptora. Esse tipo guarda uma runa de sangue gravada em uma efígie, fonte de seus feitiços mais cruéis. Costuma liderar outros seres das trevas com astúcia e crueldade, usando sugestão e telepatia para manipular inimigos."
 },
 "moldadorDeGeloGiganteDoGelo": {
  "id": "moldadorDeGeloGiganteDoGelo",
  "tipo": "gigante",
  "name": "Moldador de Gelo Gigante do Gelo",
  "nomeOriginal": "Frost Giant Ice Shaper",
  "fonte": "BGG",
  "size": "enorme",
  "level": 17,
  "cr": "17",
  "xp": 18000,
  "abilities": {
   "str": 23,
   "dex": 10,
   "con": 21,
   "int": 11,
   "wis": 19,
   "cha": 16
  },
  "ac": 16,
  "acNote": "cota de malha",
  "maxHp": 310,
  "hpDice": "27d12+135",
  "speedFt": 40,
  "senses": {
   "passivePerception": 20
  },
  "saves": [
   "str",
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
    "bonus": 12,
    "damage": "3d10+6",
    "type": "cortante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "2d8",
     "type": "frio"
    }
   },
   {
    "name": "Raio Congelante",
    "bonus": 10,
    "damage": "3d8+4",
    "type": "frio",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 120,
    "longRangeFt": 120,
    "onHit": {
     "save": "con",
     "dc": 18,
     "condition": "contido",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "multiattack": {
   "count": 3
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "apararBonus": 6,
  "apararTudo": true,
  "traits": [
   "t_lobosDeGelo",
   "t_runaDoGelo",
   "aparar"
  ],
  "blurb": "Combina golpes de machado gélido com raios congelantes que prendem alvos à distância, enquanto lobos de gelo invocados cercam os inimigos. Sua armadura de gelo reativa explode em estilhaços contra quem estiver colado nele.",
  "lore": "Entre os gigantes do gelo, os que dominam a magia das runas recebem o título de moldadores de gelo e sobem depressa na hierarquia do ordning. Costumam virar jarls ou conselheiros que, na prática, governam por trás do trono. Quase sempre são fiéis a Thrym. Moldam a energia elemental do ar e da água para criar lobos de gelo, vestir couraças congeladas e lançar chuvas de lascas cortantes."
 },
 "giganteDoGeloDaAguaMaligna": {
  "id": "giganteDoGeloDaAguaMaligna",
  "tipo": "gigante",
  "name": "Gigante do Gelo da Água Maligna",
  "nomeOriginal": "Frost Giant of Evil Water",
  "fonte": "BGG",
  "size": "enorme",
  "level": 9,
  "cr": "11",
  "xp": 7200,
  "abilities": {
   "str": 23,
   "dex": 16,
   "con": 21,
   "int": 9,
   "wis": 14,
   "cha": 12
  },
  "ac": 16,
  "acNote": "brunea",
  "maxHp": 172,
  "hpDice": "15d12+75",
  "speedFt": 40,
  "speeds": {
   "swimFt": 40
  },
  "senses": {
   "passivePerception": 16
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
  "expertise": [],
  "damageImmunities": [
   "frio"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Machado de Batalha",
    "bonus": 10,
    "damage": "3d8+6",
    "type": "cortante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "3d10+6",
     "type": "cortante"
    }
   },
   {
    "name": "Arpão",
    "bonus": 7,
    "damage": "2d10+3",
    "type": "perfurante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 50,
    "longRangeFt": 200,
    "danoExtra": {
     "damage": "1d10",
     "type": "cortante"
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Machado de Batalha",
    "Machado de Batalha",
    "Arpão"
   ]
  },
  "traits": [],
  "blurb": "Fisga o alvo com um arpão à distância, puxa-o para perto com a ação bônus e o retalha com um machado de batalha gélido. Quem tenta se soltar do arpão se fere.",
  "lore": "São gigantes do gelo que abandonaram os deuses do Ordning para cultuar Olhydra, a Princesa da Água Maligna. Para eles, a água é uma força cruel que atinge sua forma mais pura no gelo. Costumam esconder sua fé enquanto empurram suas comunidades para a violência, e quando descobertos e banidos acabam liderando cultos em terras frias. Olhydra lhes concede a capacidade de respirar sob a água, e suas armaduras trazem bestas enormes que disparam arpões farpados para arrastar inimigos para dentro d'água."
 },
 "lamentoGelido": {
  "id": "lamentoGelido",
  "tipo": "morto-vivo",
  "name": "Lamento Gélido",
  "nomeOriginal": "Frostmourn",
  "fonte": "BGG",
  "size": "enorme",
  "level": 9,
  "cr": "10",
  "xp": 5900,
  "abilities": {
   "str": 23,
   "dex": 9,
   "con": 21,
   "int": 9,
   "wis": 11,
   "cha": 18
  },
  "ac": 13,
  "acNote": "armadura natural",
  "maxHp": 195,
  "hpDice": "17d12+85",
  "speedFt": 40,
  "senses": {
   "passivePerception": 14
  },
  "saves": [
   "con",
   "wis"
  ],
  "skills": [
   "atletismo",
   "percepcao"
  ],
  "expertise": [],
  "damageImmunities": [
   "frio",
   "veneno"
  ],
  "damageVulnerabilities": [
   "fogo"
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
    "name": "Toque Congelante",
    "bonus": 10,
    "damage": "4d8",
    "type": "frio",
    "reachFt": 5,
    "danoExtra": {
     "damage": "4d8",
     "type": "necrótico"
    }
   },
   {
    "name": "Machado de Gelo",
    "bonus": 10,
    "damage": "3d8+6",
    "type": "cortante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "2d6",
     "type": "frio"
    }
   },
   {
    "name": "Raio Polar",
    "bonus": 8,
    "damage": "5d10+4",
    "type": "frio",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 120,
    "longRangeFt": 120
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Toque Congelante",
    "Machado de Gelo"
   ]
  },
  "traits": [
   "t_fugaNaNevasca"
  ],
  "blurb": "Gigante morto-vivo que golpeia com machado de gelo e um toque que transforma quem cai em estátua congelada, além de disparar raios polares à distância. Ao ser atingido, vira nevasca, reduz o dano e se teleporta.",
  "lore": "Surge quando um gigante do gelo é assassinado de forma desonrosa, como envenenado, apunhalado pelas costas ou morto enquanto dormia. Parece um cadáver ressecado pelo frio extremo e ainda exibe a marca de sua morte, seja uma ferida que solta vapor gelado, sejam veias roxas de veneno. Movido pela vingança, caça seus assassinos. Mesmo depois de vingado, o ódio pelos vivos costuma mantê-lo vagando pelas terras selvagens por anos."
 },
 "furiaDeKostchtchie": {
  "id": "furiaDeKostchtchie",
  "tipo": "corruptor",
  "name": "Fúria de Kostchtchie",
  "nomeOriginal": "Fury of Kostchtchie",
  "fonte": "BGG",
  "size": "enorme",
  "level": 13,
  "cr": "14",
  "xp": 11500,
  "abilities": {
   "str": 26,
   "dex": 10,
   "con": 25,
   "int": 10,
   "wis": 12,
   "cha": 11
  },
  "ac": 16,
  "acNote": "armadura natural",
  "maxHp": 216,
  "hpDice": "16d12+112",
  "speedFt": 40,
  "senses": {
   "passivePerception": 16,
   "darkvisionFt": 120
  },
  "saves": [
   "con",
   "wis"
  ],
  "skills": [
   "atletismo",
   "percepcao"
  ],
  "expertise": [],
  "damageResistances": [
   "fogo",
   "elétrico",
   "veneno"
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
    "name": "Punho",
    "bonus": 13,
    "damage": "2d8+8",
    "type": "concussão",
    "reachFt": 10,
    "danoExtra": {
     "damage": "3d6",
     "type": "frio"
    }
   },
   {
    "name": "Rocha",
    "bonus": 13,
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
   "sequencias": [
    [
     "Punho",
     "Punho"
    ],
    [
     "Rocha",
     "Rocha"
    ]
   ]
  },
  "aura": {
   "raioFt": 10,
   "quando": "inicioDoAlvo",
   "save": "con",
   "dc": 20,
   "damage": "2d10",
   "damageType": "frio"
  },
  "traits": [
   "aura",
   "resistenciaAMagia"
  ],
  "blurb": "Gigante demoníaco que avança em investida e esmaga com punhos gélidos, causando ainda mais frio em quem já sofreu com sua aura congelante. De longe, arremessa rochas devastadoras.",
  "lore": "Gigantes do gelo frustrados com sua posição no ordning, ou que renegam Annam, às vezes passam a cultuar o lorde demônio Kostchtchie, que segundo suas lendas foi um gigante do gelo capaz de matar um lorde demônio e tomar seu domínio no Abismo. Quando ele atende a essas preces, o devoto ganha força sobrenatural, braços que ultrapassam os joelhos e um frio cortante ao seu redor. O preço é a própria alma, consumida aos poucos para alimentar o poder. A queimação no peito cresce até virar frenesi, e só a batalha consegue aliviá-la."
 },
 "gargantua": {
  "id": "gargantua",
  "tipo": "aberração",
  "name": "Gargântua",
  "nomeOriginal": "Gargantua",
  "fonte": "BGG",
  "size": "imenso",
  "level": 21,
  "cr": "21",
  "xp": 33000,
  "abilities": {
   "str": 27,
   "dex": 10,
   "con": 26,
   "int": 9,
   "wis": 16,
   "cha": 18
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 388,
  "hpDice": "21d20+168",
  "speedFt": 60,
  "senses": {
   "passivePerception": 13,
   "darkvisionFt": 120
  },
  "saves": [
   "dex",
   "int",
   "wis"
  ],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "energético",
   "psíquico"
  ],
  "conditionImmunities": [
   "amedrontado"
  ],
  "attacks": [
   {
    "name": "Pancada",
    "bonus": 15,
    "damage": "3d12+8",
    "type": "concussão",
    "reachFt": 20
   },
   {
    "name": "Rocha",
    "bonus": 15,
    "damage": "3d10+8",
    "type": "concussão",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 120,
    "longRangeFt": 480
   }
  ],
  "multiattack": {
   "count": 2,
   "sequencias": [
    [
     "Pancada",
     "Pancada"
    ],
    [
     "Rocha",
     "Rocha"
    ]
   ]
  },
  "aura": {
   "raioFt": 30,
   "quando": "inicioDoDono",
   "save": "wis",
   "dc": 19,
   "damage": "5d6",
   "damageType": "psíquico",
   "condition": "amedrontado",
   "rounds": 1,
   "imunizaAoPassar": true,
   "soInimigos": true
  },
  "repreensao": {
   "nome": "Peteleco",
   "alcanceFt": 20,
   "save": "str",
   "dc": 23,
   "damage": "3d6+8",
   "damageType": "concussão",
   "metade": false
  },
  "traits": [
   "aura",
   "t_peteleco",
   "t_imitacaoDeMagia"
  ],
  "blurb": "Colosso de 12 metros que esmaga com pancadas de longo alcance e arremessa rochas, enquanto sua aura distorcida fere a mente e amedronta quem estiver perto. Teleporta-se, incapacita alvos com maldições e pode até roubar magias lançadas contra ela.",
  "lore": "Raramente, por obra das estrelas ou do capricho de algum deus cruel, nasce entre gigantes uma criança que parece comum até chegar à idade adulta. Então a pele fica arroxeada, chifres brotam da cabeça e ela cresce até superar de longe qualquer gigante. Sem lugar entre os seus, a gargântua procura abrigos colossais, como florestas antigas, cânions profundos ou cavernas do Subterrâneo. Algumas só querem paz e isolamento; outras devolvem com fúria o medo que o mundo sente delas. Os gigantes culpam um pacto com o Reino Distante, a vingança de Karontor ou o desgosto do próprio Annam por sua existência."
 },
 "criancaGigante": {
  "id": "criancaGigante",
  "tipo": "gigante",
  "name": "Criança Gigante",
  "nomeOriginal": "Giant Child",
  "fonte": "BGG",
  "size": "médio",
  "level": 1,
  "cr": "0",
  "xp": 10,
  "abilities": {
   "str": 14,
   "dex": 10,
   "con": 10,
   "int": 10,
   "wis": 10,
   "cha": 10
  },
  "ac": 10,
  "maxHp": 4,
  "hpDice": "1d8",
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
    "name": "Clava",
    "bonus": 4,
    "damage": "1d4+2",
    "type": "concussão",
    "reachFt": 5
   }
  ],
  "traits": [],
  "blurb": "Um jovem gigante ainda pequeno que luta com uma clava, batendo com uma força surpreendente para o tamanho, mas que cai rápido.",
  "lore": "Filhotes de gigantes ainda têm o porte de um humano adulto, mas já mostram a força de sua linhagem. Costumam ficar perto dos pais ou dos clãs, aprendendo os costumes e a língua dos gigantes. Curiosos e às vezes travessos, podem brigar por brincadeira ou para proteger o próprio território. Encontrar um deles quase sempre significa que adultos estão por perto."
 },
 "gansoGigante": {
  "id": "gansoGigante",
  "tipo": "feérico",
  "name": "Ganso Gigante",
  "nomeOriginal": "Giant Goose",
  "fonte": "BGG",
  "size": "grande",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 14,
   "dex": 16,
   "con": 15,
   "int": 6,
   "wis": 14,
   "cha": 11
  },
  "ac": 13,
  "maxHp": 60,
  "hpDice": "8d10+16",
  "speedFt": 30,
  "flyFt": 30,
  "speeds": {
   "flyFt": 30
  },
  "senses": {
   "passivePerception": 16,
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
    "bonus": 4,
    "damage": "2d6+2",
    "type": "concussão",
    "reachFt": 10
   },
   {
    "name": "Asa",
    "bonus": 4,
    "damage": "1d10+2",
    "type": "concussão",
    "reachFt": 5,
    "onHit": {
     "save": "str",
     "dc": 12,
     "condition": "caido",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Bico",
    "Asa",
    "Asa"
   ]
  },
  "traits": [
   "t_grasnadoTrovejante"
  ],
  "blurb": "Ataca com bicadas de longo alcance e asas que derrubam os inimigos, e seu grasnado ensurdecedor causa dano trovejante em todos ao redor. Cuidado ao se aproximar em grupo.",
  "lore": "Gansos gigantes descendem de linhagens feéricas e são criados por gigantes como animais de fazenda e vigias. Seus sentidos aguçados e sua voz estrondosa alertam os donos sobre qualquer invasor. Sob o comando de quem cuida dele, o ganso pode botar um ovo oco de ouro puro, valioso e às vezes com um pequeno objeto ou item mágico dentro. Depois disso, precisa esperar um ano e um dia para botar outro."
 },
 "linceGigante": {
  "id": "linceGigante",
  "tipo": "feérico",
  "name": "Lince Gigante",
  "nomeOriginal": "Giant Lynx",
  "fonte": "BGG",
  "size": "médio",
  "level": 1,
  "cr": "1/2",
  "xp": 100,
  "abilities": {
   "str": 14,
   "dex": 18,
   "con": 13,
   "int": 12,
   "wis": 14,
   "cha": 10
  },
  "ac": 14,
  "maxHp": 22,
  "hpDice": "4d8+4",
  "speedFt": 30,
  "speeds": {
   "climbFt": 30
  },
  "senses": {
   "passivePerception": 16,
   "truesightFt": 60
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
   "frio"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Garras",
    "bonus": 6,
    "damage": "1d8+4",
    "type": "cortante",
    "reachFt": 5,
    "onHit": {
     "save": "str",
     "dc": 12,
     "condition": "caido",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "traits": [
   "t_visaoDoLince",
   "camuflagemGeral"
  ],
  "blurb": "Felino feérico ágil que avança em linha reta para derrubar a presa com as garras e então golpeá-la de novo enquanto está no chão. Enxerga através de ilusões e se esconde muito bem na mata e na neve.",
  "lore": "O lince gigante parece um gato selvagem comum, mas é uma criatura mágica vinda das florestas nevadas da Agrestia das Fadas. Sua pelagem clareia no inverno, o que o torna quase invisível na paisagem branca. Caça em pequenos bandos, usa um dom mágico para espionar terrenos de caça à distância e costuma desarmar as armadilhas que caçadores de peles deixam em seu território. Gigantes do gelo e das nuvens às vezes fazem amizade com esses felinos, que compartilham sua magia de adivinhação desde que sejam tratados com respeito."
 },
 "boiGigante": {
  "id": "boiGigante",
  "tipo": "feérico",
  "name": "Boi Gigante",
  "nomeOriginal": "Giant Ox",
  "fonte": "BGG",
  "size": "enorme",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 22,
   "dex": 10,
   "con": 19,
   "int": 4,
   "wis": 11,
   "cha": 9
  },
  "ac": 12,
  "acNote": "armadura natural",
  "maxHp": 105,
  "hpDice": "10d12+40",
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
    "name": "Chifrada",
    "bonus": 8,
    "damage": "2d6+6",
    "type": "perfurante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "2d6",
     "type": "perfurante"
    },
    "onHit": {
     "save": "str",
     "dc": 16,
     "condition": "caido",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "traits": [
   "t_animalDeCarga"
  ],
  "blurb": "Investe em linha reta contra o alvo e o atinge com os chifres de 3 m de distância; a carga causa dano extra e pode derrubar quem for atingido.",
  "lore": "Esses bois enormes servem aos gigantes como animais de carga e de tração, arrastando arados e carroças desproporcionais. Têm pelagem grossa e desgrenhada, muitas vezes em cores vivas como azul-celeste ou violeta. São feéricos de temperamento simples, que entendem os idiomas dos gigantes e o silvestre mas não falam. Costumam viver em vales isolados ou semiplanos primordiais, onde a fauna cresce a proporções descomunais."
 },
 "carneiroGigante": {
  "id": "carneiroGigante",
  "tipo": "feérico",
  "name": "Carneiro Gigante",
  "nomeOriginal": "Giant Ram",
  "fonte": "BGG",
  "size": "grande",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 19,
   "dex": 12,
   "con": 18,
   "int": 3,
   "wis": 14,
   "cha": 10
  },
  "ac": 13,
  "acNote": "armadura natural",
  "maxHp": 28,
  "hpDice": "3d10+12",
  "speedFt": 50,
  "senses": {
   "passivePerception": 12
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "frio",
   "fogo",
   "elétrico"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Marrada",
    "bonus": 6,
    "damage": "2d4+4",
    "type": "concussão",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d6",
     "type": "energético"
    },
    "onHit": {
     "save": "str",
     "dc": 14,
     "condition": "caido",
     "rounds": 1,
     "repete": false
    }
   },
   {
    "name": "Disparo de Energia",
    "bonus": 4,
    "damage": "2d6",
    "type": "energético",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 30,
    "longRangeFt": 30
   }
  ],
  "traits": [
   "resistenciaAMagia",
   "t_veloAbsorvente"
  ],
  "blurb": "Investe em linha reta para derrubar os alvos com cabeçadas carregadas de energia mágica e dispara rajadas energéticas à distância. Resiste bem a magia e devolve com um disparo os feitiços que falham contra ele.",
  "lore": "Esses carneiros enormes são criados pelos gigantes como um rebanho de grande valor. A lã deles absorve a magia do ambiente e a energia dos feitiços lançados ao redor. Enquanto o animal está vivo e com o velo intacto, usa esse poder acumulado para se defender, lançando rajadas que espantam predadores. Tosquiada com cuidado, a lã serve para tecer mantos de proteção ou forrar armaduras que resistem a frio, fogo ou eletricidade."
 },
 "carrapatoGigante": {
  "id": "carrapatoGigante",
  "tipo": "monstruosidade",
  "name": "Carrapato Gigante",
  "nomeOriginal": "Giant Tick",
  "fonte": "BGG",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 16,
   "dex": 10,
   "con": 16,
   "int": 2,
   "wis": 10,
   "cha": 2
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 52,
  "hpDice": "7d8+21",
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
    "name": "Probóscide",
    "bonus": 5,
    "damage": "2d6+3",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "traits": [
   "t_drenarSangue"
  ],
  "blurb": "Crava a probóscide na vítima e fica preso a ela, sugando sangue a cada turno e se curando com isso. Contra gigantes, o dreno é ainda mais brutal.",
  "lore": "Do tamanho de um javali, este carrapato vive há eras como parasita de gigantes, alimentando-se do sangue deles. Para os gigantes ele é só um incômodo dolorido, mas para criaturas menores é uma ameaça mortal. Faminto, ataca qualquer ser vivo que consiga alcançar e não larga mais a presa enquanto houver sangue para beber."
 },
 "gigant": {
  "id": "gigant",
  "tipo": "monstruosidade",
  "name": "Gigant",
  "nomeOriginal": "Gigant",
  "fonte": "BGG",
  "size": "imenso",
  "level": 17,
  "cr": "20",
  "xp": 25000,
  "abilities": {
   "str": 24,
   "dex": 14,
   "con": 21,
   "int": 3,
   "wis": 14,
   "cha": 11
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 325,
  "hpDice": "21d20+105",
  "speedFt": 50,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80,
   "burrowFt": 50
  },
  "senses": {
   "passivePerception": 18,
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
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mandíbulas",
    "bonus": 13,
    "damage": "4d6+7",
    "type": "cortante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "4d6+7",
     "type": "cortante"
    }
   },
   {
    "name": "Garras",
    "bonus": 13,
    "damage": "3d6+7",
    "type": "cortante",
    "reachFt": 20
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Mandíbulas",
    "Garras",
    "Garras"
   ]
  },
  "breath": {
   "name": "Poeira de Escamas",
   "kind": "save",
   "shape": "cube",
   "areaFt": 30,
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
   "resistenciaAMagia"
  ],
  "blurb": "Puxa as vítimas com as garras até as mandíbulas, onde as tritura a cada turno, e espalha uma poeira venenosa que impede a cura. Sua carapaça resiste à magia, e o zumbido das asas deixa incapacitado quem estiver por perto.",
  "lore": "O gigant é um inseto colossal parecido com um besouro, visto por uns como presságio de ruína, por outros como guardião da natureza ou mensageiro dos deuses. Os gigantes o temem como uma praga, pois ele os prefere como presa acima de qualquer outra comida. Agarra a vítima com as mandíbulas e a leva até o ninho para devorá-la. Mantém as asas recolhidas sob a carapaça, mas voa muito rápido quando as abre. Há gigantes que acreditam que essas criaturas surgem da aura mágica que envolve um gargantua."
 },
 "goliasParenteDosGigantes": {
  "id": "goliasParenteDosGigantes",
  "tipo": "humanoide",
  "name": "Golias Parente dos Gigantes",
  "nomeOriginal": "Goliath Giant-Kin",
  "fonte": "BGG",
  "size": "médio",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 18,
   "dex": 13,
   "con": 16,
   "int": 10,
   "wis": 12,
   "cha": 12
  },
  "ac": 18,
  "acNote": "meia-armadura e escudo",
  "maxHp": 67,
  "hpDice": "9d8+27",
  "speedFt": 30,
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
  "damageResistances": [
   "frio"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Lança",
    "bonus": 6,
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
    "Lança",
    "Lança"
   ]
  },
  "traits": [],
  "blurb": "Guerreiro robusto que golpeia duas vezes com a lança, corpo a corpo ou arremessando. Quando canaliza a magia dos gigantes, cada golpe corpo a corpo ganha dano extra do elemento do seu clã.",
  "lore": "Golias são humanoides de parentesco distante com os gigantes, fortalecidos pela essência das montanhas onde seus ancestrais viveram. Algumas comunidades convivem tão de perto com os gigantes que estes as aceitam como família, e seus membros servem de ponte entre os clãs gigantes e os povos menores. Mesmo sem passar de uns 2,4 m, enfrentam ogros em disputas de força. Veneram os ancestrais divinos dos gigantes, sobretudo as filhas de Annam, e adotam os valores do clã com que vivem: os vizinhos dos gigantes do gelo exaltam a força, os dos gigantes de pedra prezam a arte."
 },
 "gatoSorridente": {
  "id": "gatoSorridente",
  "tipo": "feérico",
  "name": "Gato Sorridente",
  "nomeOriginal": "Grinning Cat",
  "fonte": "BGG",
  "size": "grande",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 14,
   "dex": 15,
   "con": 13,
   "int": 15,
   "wis": 14,
   "cha": 16
  },
  "ac": 12,
  "maxHp": 45,
  "hpDice": "7d10+7",
  "speedFt": 40,
  "speeds": {
   "climbFt": 40
  },
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
    "name": "Mordida",
    "bonus": 4,
    "damage": "1d10+2",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Garras",
    "bonus": 4,
    "damage": "2d6+2",
    "type": "cortante",
    "reachFt": 5,
    "onHit": {
     "save": "str",
     "dc": 12,
     "condition": "invisivel",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "traits": [
   "t_desvanecer",
   "resistenciaAMagia"
  ],
  "blurb": "Some no ar e reaparece de surpresa: atacando invisível, suas garras podem derrubar o alvo, e ele morde quem estiver no chão. Teletransporta-se como ação bônus e resiste bem à magia.",
  "lore": "Fadas travessas com aparência de gatos domésticos enormes, garras finas como agulhas e um sorriso largo cheio de dentes. Costumam viver perto de enclaves de gigantes, descansando invisíveis em galhos à espera de presas ou de alguém para conversar. Adoram charadas e provocações, e mostram só o sorriso, a cauda ou a cabeça para confundir ou intimidar. Um bigode do gato, dado como presente ou tirado de um morto, permite conjurar passo nebuloso uma vez antes de virar fumaça."
 },
 "giganteDaColinaAvalanche": {
  "id": "giganteDaColinaAvalanche",
  "tipo": "gigante",
  "name": "Gigante da Colina Avalanche",
  "nomeOriginal": "Hill Giant Avalancher",
  "fonte": "BGG",
  "size": "enorme",
  "level": 9,
  "cr": "12",
  "xp": 8400,
  "abilities": {
   "str": 21,
   "dex": 8,
   "con": 19,
   "int": 9,
   "wis": 18,
   "cha": 10
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 220,
  "hpDice": "21d12+84",
  "speedFt": 40,
  "senses": {
   "passivePerception": 18
  },
  "saves": [
   "str",
   "con",
   "wis"
  ],
  "skills": [
   "natureza",
   "percepcao"
  ],
  "expertise": [
   "natureza"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Tacape",
    "bonus": 9,
    "damage": "3d8+5",
    "type": "concussão",
    "reachFt": 10,
    "danoExtra": {
     "damage": "2d8",
     "type": "trovejante"
    }
   }
  ],
  "multiattack": {
   "count": 1,
   "sequence": [
    "Tacape"
   ]
  },
  "spellcasting": {
   "ability": "wis",
   "cantrips": [],
   "prepared": [
    "muralhaDePedra",
    "arteDruidica",
    "orientacao"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "muralhaDePedra": 1
   },
   "aVontade": [
    "arteDruidica",
    "orientacao"
   ],
   "cdPorMagia": {
    "muralhaDePedra": 16,
    "arteDruidica": 16,
    "orientacao": 16
   }
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "acoesEspeciais": [
   {
    "nome": "Boleadeiras de Pedra",
    "tipo": "area",
    "shape": "raio",
    "areaFt": 60,
    "save": "dex",
    "dc": 16,
    "damage": "4d6",
    "damageType": "trovejante",
    "halfOnSave": false,
    "condition": "contido",
    "rounds": 1,
    "repete": false,
    "ateFimDoTurnoDele": true
   },
   {
    "nome": "Avalanche de Pedras",
    "tipo": "area",
    "shape": "raio",
    "areaFt": 120,
    "save": "dex",
    "dc": 16,
    "damage": "8d6",
    "damageType": "concussão",
    "halfOnSave": true,
    "condition": "caido",
    "rounds": 1,
    "repete": false,
    "ateFimDoTurnoDele": true
   }
  ],
  "repreensao": {
   "nome": "Repulsão da Colina",
   "alcanceFt": 10,
   "save": "con",
   "dc": 16,
   "damage": "3d6",
   "damageType": "energético",
   "metade": false,
   "empurraFt": 10
  },
  "traits": [
   "t_runaDaColina",
   "t_repulsaoDaColina"
  ],
  "blurb": "Esmaga com o tacape de longo alcance enquanto arremessa boleadeiras de pedra que prendem e explodem em trovão. Com a runa da colina, faz chover rochas numa grande área e repele quem o fere de perto.",
  "lore": "Alguns gigantes da colina aprendem a magia das runas e descobrem um laço profundo com a terra e a pedra. Esse poder, somado ao tamanho e à força, costuma colocá-los no comando de seus clãs. Andam cobertos de pedras amarradas em correntes e cordas, que usam para derrubar e golpear os inimigos. Os outros gigantes os chamam de avalanches pela rapidez com que abatem e devoram suas presas, como rochas despencando de uma encosta."
 },
 "colossoRelampago": {
  "id": "colossoRelampago",
  "tipo": "elemental",
  "name": "Colosso Relâmpago",
  "nomeOriginal": "Lightning Hulk",
  "fonte": "BGG",
  "size": "grande",
  "level": 9,
  "cr": "9",
  "xp": 5000,
  "abilities": {
   "str": 18,
   "dex": 21,
   "con": 16,
   "int": 14,
   "wis": 14,
   "cha": 15
  },
  "ac": 15,
  "maxHp": 102,
  "hpDice": "12d10+36",
  "speedFt": 0,
  "flyFt": 90,
  "hover": true,
  "speeds": {
   "flyFt": 90
  },
  "senses": {
   "passivePerception": 16
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
   "petrificado",
   "envenenado",
   "caido",
   "contido"
  ],
  "attacks": [
   {
    "name": "Arco Elétrico",
    "bonus": 9,
    "damage": "4d8",
    "type": "elétrico",
    "reachFt": 10,
    "rangeFt": 60,
    "longRangeFt": 60,
    "onHit": {
     "save": "dex",
     "dc": 18,
     "danoSeFalhar": {
      "damage": "4d8",
      "type": "elétrico"
     },
     "metadeSePassar": false
    }
   }
  ],
  "luzPropria": {
   "claro": 20,
   "penumbra": 20
  },
  "traits": [
   "t_formaDeRelampago"
  ],
  "blurb": "Um raio vivo que voa a 27 m, atravessa o espaço dos inimigos eletrocutando-os e dispara arcos elétricos que saltam para um segundo alvo. Tocá-lo ou golpeá-lo de perto também causa choque.",
  "lore": "Esses seres descendem de gigantes das tempestades que se afastaram do mundo há eras e deixaram que sua essência elemental, alimentada pelos Planos Elementais, consumisse a carne. Hoje são pouco mais que um relâmpago consciente, com um rosto difuso na ponta da descarga. Às vezes assumem por um instante a silhueta de um gigante, e perto de metal ou de terra firme parecem prestes a se dissipar. A mente acompanha o corpo: vagam de um lugar a outro sem propósito claro, longe da reflexão de seus parentes gigantes."
 },
 "bocarraDeYeenoghu": {
  "id": "bocarraDeYeenoghu",
  "tipo": "corruptor",
  "name": "Bocarra de Yeenoghu",
  "nomeOriginal": "Maw of Yeenoghu",
  "fonte": "BGG",
  "size": "enorme",
  "level": 9,
  "cr": "10",
  "xp": 5900,
  "abilities": {
   "str": 23,
   "dex": 10,
   "con": 21,
   "int": 8,
   "wis": 14,
   "cha": 10
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 161,
  "hpDice": "14d12+70",
  "speedFt": 40,
  "senses": {
   "passivePerception": 16,
   "darkvisionFt": 60
  },
  "saves": [
   "con",
   "cha"
  ],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Mordida",
    "bonus": 10,
    "damage": "2d12+6",
    "type": "perfurante",
    "reachFt": 10
   },
   {
    "name": "Arremesso de Presas",
    "bonus": 10,
    "damage": "1d10+6",
    "type": "perfurante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 30,
    "longRangeFt": 90
   }
  ],
  "multiattack": {
   "count": 2,
   "sequencias": [
    [
     "Mordida",
     "Mordida"
    ],
    [
     "Arremesso de Presas",
     "Arremesso de Presas"
    ]
   ]
  },
  "revide": {
   "nome": "Revide Dentado",
   "arma": "Mordida",
   "aoAcaso": true
  },
  "traits": [
   "t_investidaVoraz",
   "resistenciaAMagia",
   "t_revideDentado"
  ],
  "blurb": "Gigante demoníaco que avança de boca escancarada, abocanhando quem estiver no caminho e prendendo uma vítima entre os dentes. Quando ferido, revida mordendo ao acaso ou cuspindo presas à distância.",
  "lore": "Um gigante da colina cuja fome chamou a atenção de Yeenoghu, o Senhor Demônio da Carnificina, seja por pacto, por devorar um artefato maligno ou por sonhos sussurrados pelo próprio demônio. Transformado, ganha juba, postura curvada de gnoll e uma mandíbula enorme repleta de fileiras de dentes. Esses dentes não param de crescer, e a criatura morde e mastiga tudo o que alcança. As mais espertas arrancam as presas e as arremessam contra os inimigos. Investe de quatro sobre a presa, rasgando o chão como um arado."
 },
 "colossoDeNevoa": {
  "id": "colossoDeNevoa",
  "tipo": "elemental",
  "name": "Colosso de Névoa",
  "nomeOriginal": "Mist Hulk",
  "fonte": "BGG",
  "size": "grande",
  "level": 5,
  "cr": "6",
  "xp": 2300,
  "abilities": {
   "str": 18,
   "dex": 21,
   "con": 20,
   "int": 11,
   "wis": 13,
   "cha": 16
  },
  "ac": 15,
  "maxHp": 94,
  "hpDice": "9d10+45",
  "speedFt": 0,
  "flyFt": 40,
  "hover": true,
  "speeds": {
   "flyFt": 40
  },
  "senses": {
   "passivePerception": 14
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
  "expertise": [],
  "damageResistances": [
   "trovejante"
  ],
  "damageImmunities": [
   "veneno"
  ],
  "conditionImmunities": [
   "exausto",
   "paralisado",
   "envenenado",
   "contido"
  ],
  "attacks": [
   {
    "name": "Pancada",
    "bonus": 8,
    "damage": "2d10+5",
    "type": "frio",
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
    "nome": "Lamento Medonho",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "raio",
    "areaFt": 5,
    "save": "wis",
    "dc": 14,
    "damage": "4d6",
    "damageType": "psíquico",
    "halfOnSave": false,
    "condition": "incapacitado",
    "rounds": 10,
    "repete": true
   }
  ],
  "explosaoAoMorrer": {
   "pes": 10,
   "save": "dex",
   "dc": 16,
   "condicao": "caido",
   "rounds": 1,
   "dano": "2d10",
   "tipo": "concussão",
   "metade": true
  },
  "traits": [
   "formaFluida",
   "explosaoAoMorrer"
  ],
  "blurb": "Flutua como uma nuvem de tempestade, golpeando com punhos gélidos a 3 m e soltando um lamento que fere a mente e incapacita quem estiver por perto. Ao morrer, desaba numa onda d'água que derruba os vizinhos.",
  "lore": "Os colossos de névoa são elementais que descendem de antigos gigantes das nuvens, mesclando ar e água em um só corpo. Eras de isolamento em planos elementais ou semiplanos esquecidos apagaram quase toda a forma e a cultura de seus ancestrais. Parecem silhuetas humanoides feitas de nuvens carregadas, sempre soltando fiapos de vapor como se fossem se desfazer. Vivem mergulhados em tristeza e, quando ameaçados, uivam um pranto mágico que faz os ouvintes reviverem arrependimentos."
 },
 "brutamontesDeLama": {
  "id": "brutamontesDeLama",
  "tipo": "elemental",
  "name": "Brutamontes de Lama",
  "nomeOriginal": "Mud Hulk",
  "fonte": "BGG",
  "size": "grande",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 16,
   "dex": 8,
   "con": 16,
   "int": 5,
   "wis": 9,
   "cha": 6
  },
  "ac": 13,
  "acNote": "armadura natural",
  "maxHp": 68,
  "hpDice": "8d10+24",
  "speedFt": 40,
  "senses": {
   "passivePerception": 9
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "ácido"
  ],
  "conditionImmunities": [
   "exausto",
   "paralisado"
  ],
  "attacks": [
   {
    "name": "Pancada Envolvente",
    "bonus": 5,
    "damage": "1d12+3",
    "type": "concussão",
    "reachFt": 10,
    "danoExtra": {
     "damage": "1d12",
     "type": "ácido"
    },
    "onHit": {
     "save": "str",
     "dc": 13,
     "condition": "contido",
     "rounds": 1,
     "repete": true
    }
   }
  ],
  "breath": {
   "name": "Jato de Lama",
   "kind": "save",
   "shape": "sphere",
   "areaFt": 10,
   "save": "dex",
   "dc": 13,
   "damage": "2d6+3",
   "damageType": "concussão",
   "halfOnSave": true,
   "origem": "sopro"
  },
  "traits": [
   "amorfo",
   "t_lamaPegajosa"
  ],
  "blurb": "Avança por um chão de lama pegajosa, golpeia com alcance de 3 m e engole vítimas que sufocam e se dissolvem em ácido dentro dele. À distância, arremessa lama que causa dano e prende os inimigos no lugar.",
  "lore": "Descendem de gigantes das colinas isolados que, depois de devorar tudo ao redor, passaram a comer a própria terra até que sua natureza elemental os converteu em lama viva. Ainda lembram vagamente a forma gigante, mas o corpo escorre sem parar e deixa poças grossas por onde passam. A fome ancestral continua: envolvem qualquer coisa que pareça comestível e a absorvem diretamente. Quando ameaçados, atiram lama para imobilizar as presas antes de consumi-las."
 },
 "regissauro": {
  "id": "regissauro",
  "tipo": "monstruosidade",
  "name": "Regissauro",
  "nomeOriginal": "Regisaur",
  "fonte": "BGG",
  "size": "imenso",
  "level": 13,
  "cr": "14",
  "xp": 11500,
  "abilities": {
   "str": 27,
   "dex": 8,
   "con": 23,
   "int": 4,
   "wis": 12,
   "cha": 6
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 181,
  "hpDice": "11d20+66",
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
    "name": "Mordida",
    "bonus": 13,
    "damage": "6d12+8",
    "type": "perfurante",
    "reachFt": 10
   },
   {
    "name": "Cauda",
    "bonus": 13,
    "damage": "4d8+8",
    "type": "concussão",
    "reachFt": 20
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Mordida",
    "Cauda"
   ]
  },
  "traits": [
   "resistenciaAMagia"
  ],
  "blurb": "Um dinossauro colossal que morde com força brutal, prende a vítima entre as mandíbulas e a engole viva, enquanto a cauda atinge alvos a até 6 m. Resiste bem à magia.",
  "lore": "O regissauro é um predador gigantesco, uma fera de couro grosso que domina os territórios onde caça. Tem pouca inteligência, mas instinto de sobra: avança sobre a presa mais próxima e só para quando ela some em sua garganta. Feitiços parecem escorregar pela sua pele, o que o torna temido até por conjuradores experientes. Onde ele passa, as outras criaturas fogem ou se escondem."
 },
 "colossoDeGeada": {
  "id": "colossoDeGeada",
  "tipo": "elemental",
  "name": "Colosso de Geada",
  "nomeOriginal": "Rime Hulk",
  "fonte": "BGG",
  "size": "grande",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 18,
   "dex": 10,
   "con": 18,
   "int": 8,
   "wis": 9,
   "cha": 6
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 85,
  "hpDice": "9d10+36",
  "speedFt": 30,
  "senses": {
   "passivePerception": 9
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "damageImmunities": [
   "frio",
   "veneno"
  ],
  "conditionImmunities": [
   "exausto",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Pancada",
    "bonus": 7,
    "damage": "1d10+4",
    "type": "concussão",
    "reachFt": 10,
    "danoExtra": {
     "damage": "2d8",
     "type": "frio"
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
  "explosaoAoMorrer": {
   "pes": 10,
   "save": "con",
   "dc": 15,
   "dano": "3d6",
   "tipo": "frio",
   "metade": false
  },
  "traits": [
   "t_rastroDeGeada",
   "explosaoAoMorrer"
  ],
  "blurb": "Golpeia duas vezes com punhos gelados de longo alcance e atravessa as fileiras inimigas deixando um rastro de gelo que fere e retarda. Ao morrer, explode em geada — não fique colado nele.",
  "lore": "Esses seres são um ramo decaído da linhagem dos gigantes do gelo, herdeiros de antigos gigantes que se isolaram do mundo e acabaram dominados pela própria natureza elemental. A maioria habita o Gelo Eterno, plano congelado na fronteira entre o Ar e a Água elementais, mas alguns se escondem em fendas de geleiras polares. Menores e mais fracos que seus ancestrais, são massas brutas de gelo com forma vagamente gigante, que se desfazem e se recompõem sem parar enquanto soltam nuvens de geada. Por onde passam deixam gelo que prende os inimigos, e em geral são hostis a quem cruza seu caminho."
 },
 "colossoRunico": {
  "id": "colossoRunico",
  "tipo": "constructo",
  "name": "Colosso Rúnico",
  "nomeOriginal": "Runic Colossus",
  "fonte": "BGG",
  "size": "imenso",
  "level": 21,
  "cr": "21",
  "xp": 33000,
  "abilities": {
   "str": 25,
   "dex": 9,
   "con": 24,
   "int": 3,
   "wis": 11,
   "cha": 1
  },
  "ac": 20,
  "acNote": "armadura natural",
  "maxHp": 315,
  "hpDice": "18d20+126",
  "speedFt": 60,
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 120
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "damageResistances": [
   "ácido",
   "frio",
   "fogo",
   "elétrico"
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
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Pancada",
    "bonus": 14,
    "damage": "3d12+7",
    "type": "concussão",
    "reachFt": 20
   },
   {
    "name": "Pisotear",
    "bonus": 14,
    "damage": "4d10+7",
    "type": "concussão",
    "reachFt": 20,
    "onHit": {
     "save": "dex",
     "dc": 22,
     "condition": "caido",
     "rounds": 1,
     "repete": false
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
  "breath": {
   "name": "Raio Arcano",
   "kind": "save",
   "shape": "linha",
   "areaFt": 150,
   "save": "dex",
   "dc": 22,
   "damage": "9d12",
   "damageType": "energético",
   "halfOnSave": true,
   "origem": "sopro",
   "larguraFt": 10,
   "recharge": [
    5,
    6
   ]
  },
  "traits": [
   "formaImutavel",
   "resistenciaAMagia",
   "monstroDeCerco",
   "t_reflexaoDeMagia"
  ],
  "blurb": "Um gigante de pedra e metal que esmaga com pancadas de 6 m de alcance, prende vítimas sob o pé e dispara um raio de energia arcana em linha enorme. Ainda pode revidar conjuradores, anulando magias.",
  "lore": "Lendas gigantes contam que o primeiro colosso rúnico nasceu da união de várias linhagens de gigantes contra um dragão terrível: uns talharam a pedra, outros forjaram juntas e placas de metal, e os gigantes das tempestades gravaram as runas que o animam. Com cerca de 9 m de altura, é um guardião incansável. Vê qualquer criatura que não seja gigante como ameaça e a ataca assim que a avista, salvo ordens contrárias. O segredo de sua criação se perdeu, mas talvez ainda repouse em ruínas de antigos impérios gigantes."
 },
 "rebentoDeGrolantor": {
  "id": "rebentoDeGrolantor",
  "tipo": "gigante",
  "name": "Rebento de Grolantor",
  "nomeOriginal": "Scion of Grolantor",
  "fonte": "BGG",
  "size": "imenso",
  "level": 21,
  "cr": "22",
  "xp": 41000,
  "abilities": {
   "str": 27,
   "dex": 14,
   "con": 25,
   "int": 15,
   "wis": 21,
   "cha": 18
  },
  "ac": 18,
  "acNote": "armadura natural",
  "maxHp": 402,
  "hpDice": "23d20+161",
  "speedFt": 60,
  "senses": {
   "passivePerception": 22
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
   "exausto",
   "paralisado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Clava de Árvore Gigante",
    "bonus": 15,
    "damage": "4d10+8",
    "type": "concussão",
    "reachFt": 30,
    "onHit": {
     "save": "str",
     "dc": 23,
     "condition": "caido",
     "rounds": 1,
     "repete": false
    }
   },
   {
    "name": "Pancada",
    "bonus": 15,
    "damage": "4d8+8",
    "type": "energético",
    "reachFt": 20
   },
   {
    "name": "Rochedo",
    "bonus": 15,
    "damage": "3d12+8",
    "type": "concussão",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 120,
    "longRangeFt": 480
   }
  ],
  "multiattack": {
   "count": 6,
   "sequence": [
    "Clava de Árvore Gigante",
    "Pancada",
    "Pancada",
    "Rochedo",
    "Rochedo",
    "Rochedo"
   ]
  },
  "recursos": {
   "resistenciaLendaria": 6
  },
  "acoesEspeciais": [
   {
    "nome": "Inalar",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "linha",
    "areaFt": 120,
    "larguraFt": 15,
    "save": "str",
    "dc": 23,
    "damage": "7d6",
    "damageType": "energético",
    "halfOnSave": false,
    "condition": "contido",
    "rounds": 10,
    "repete": false
   }
  ],
  "traits": [
   "resistenciaAMagia",
   "monstroDeCerco",
   "t_alimentarSe"
  ],
  "blurb": "Titã colossal que esmaga com um tronco de árvore, arremessa inimigos para longe e suga criaturas para dentro do estômago com uma inalação devastadora. Cada passo seu faz o chão tremer e quebra a concentração dos conjuradores.",
  "lore": "Os rebentos de Grolantor são titãs nascidos da essência do deus gigante da fome e da brutalidade. Movidos por um apetite que nunca se sacia, vagam por terras selvagens devorando tudo o que encontram. Desprezam a ordem e as hierarquias dos outros gigantes e preferem a força bruta a qualquer acordo. Onde passam, ficam aldeias arrasadas e florestas arrancadas pela raiz."
 },
 "rebentoDeMemnor": {
  "id": "rebentoDeMemnor",
  "tipo": "gigante",
  "name": "Rebento de Memnor",
  "nomeOriginal": "Scion of Memnor",
  "fonte": "BGG",
  "size": "imenso",
  "level": 25,
  "cr": "26",
  "xp": 90000,
  "abilities": {
   "str": 30,
   "dex": 18,
   "con": 30,
   "int": 24,
   "wis": 22,
   "cha": 26
  },
  "ac": 20,
  "acNote": "armadura natural",
  "maxHp": 656,
  "hpDice": "32d20+320",
  "speedFt": 60,
  "flyFt": 80,
  "hover": true,
  "speeds": {
   "flyFt": 80
  },
  "senses": {
   "passivePerception": 24,
   "truesightFt": 120
  },
  "saves": [
   "dex",
   "cha"
  ],
  "skills": [
   "arcanismo",
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
   "trovejante"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "amedrontado",
   "paralisado",
   "petrificado"
  ],
  "attacks": [
   {
    "name": "Maça-Estrela de Nuvem",
    "bonus": 18,
    "damage": "4d10+10",
    "type": "energético",
    "reachFt": 30,
    "danoExtra": {
     "damage": "4d10",
     "type": "trovejante"
    }
   },
   {
    "name": "Dardo de Vento",
    "bonus": 18,
    "damage": "5d12+10",
    "type": "trovejante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 120,
    "longRangeFt": 480,
    "onHit": {
     "save": "str",
     "dc": 26,
     "condition": "caido",
     "rounds": 1,
     "repete": false
    }
   },
   {
    "name": "Pancada",
    "bonus": 18,
    "damage": "4d8+10",
    "type": "energético",
    "reachFt": 20
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Pancada",
    "Pancada"
   ]
  },
  "recursos": {
   "resistenciaLendaria": 6
  },
  "acoesEspeciais": [
   {
    "nome": "Vórtice Trovejante (Recarga 5–6)",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "raio",
    "areaFt": 120,
    "save": "str",
    "dc": 24,
    "damage": "8d12",
    "damageType": "trovejante",
    "halfOnSave": false,
    "condition": "atordoado",
    "rounds": 1,
    "repete": false,
    "ateFimDoTurnoDele": true
   }
  ],
  "traits": [
   "voaSemProvocar",
   "resistenciaAMagia",
   "monstroDeCerco"
  ],
  "blurb": "Titã voador que ataca de longe com dardos de vento e de perto com uma maça-estrela de nuvem, além de puxar grupos inteiros para um vórtice trovejante que atordoa. Sua névoa enganosa faz os heróis atacarem os próprios aliados.",
  "lore": "Os rebentos de Memnor são titãs nascidos da essência do ardiloso deus dos gigantes das nuvens. Pairam entre as nuvens e manipulam o vento, o trovão e a névoa com uma inteligência fria. Preferem enganar e semear discórdia a lutar de frente, mas quando entram em combate são devastadores. Mortais costumam encontrá-los em fortalezas celestes ou em tempestades que parecem ter vontade própria."
 },
 "rebentoDeSkoraeus": {
  "id": "rebentoDeSkoraeus",
  "tipo": "gigante",
  "name": "Rebento de Skoraeus",
  "nomeOriginal": "Scion of Skoraeus",
  "fonte": "BGG",
  "size": "imenso",
  "level": 21,
  "cr": "23",
  "xp": 50000,
  "abilities": {
   "str": 29,
   "dex": 20,
   "con": 26,
   "int": 19,
   "wis": 24,
   "cha": 14
  },
  "ac": 19,
  "acNote": "armadura natural",
  "maxHp": 444,
  "hpDice": "24d20+192",
  "speedFt": 60,
  "senses": {
   "passivePerception": 24,
   "truesightFt": 120
  },
  "saves": [
   "dex",
   "wis"
  ],
  "skills": [
   "acrobacia",
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
   "ácido"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "amedrontado",
   "paralisado",
   "petrificado"
  ],
  "attacks": [
   {
    "name": "Clava de Cristal",
    "bonus": 16,
    "damage": "4d12+9",
    "type": "concussão",
    "reachFt": 30,
    "onHit": {
     "save": "con",
     "dc": 22,
     "condition": "cego",
     "rounds": 1,
     "repete": false
    }
   },
   {
    "name": "Pancada",
    "bonus": 16,
    "damage": "4d10+9",
    "type": "energético",
    "reachFt": 20
   },
   {
    "name": "Pedra Rúnica",
    "bonus": 16,
    "damage": "4d8+9",
    "type": "concussão",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 120,
    "longRangeFt": 480,
    "danoExtra": {
     "damage": "3d12",
     "type": "energético"
    },
    "onHit": {
     "save": "dex",
     "dc": 22,
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
     "Clava de Cristal",
     "Pancada",
     "Pancada"
    ],
    [
     "Pedra Rúnica",
     "Pedra Rúnica"
    ]
   ]
  },
  "recursos": {
   "resistenciaLendaria": 6
  },
  "traits": [
   "t_apertoSepulcral",
   "resistenciaAMagia",
   "monstroDeCerco"
  ],
  "blurb": "Titã colossal que esmaga com clava de cristal e punhos de longo alcance, arremessa pedras rúnicas explosivas e pode petrificar quem agarra. Seus passos abalam o chão e quebram a concentração de conjuradores.",
  "lore": "Os rebentos de Skoraeus são titãs nascidos da essência do deus gigante da pedra e das profundezas. Habitam cavernas imensas e domínios subterrâneos, onde guardam segredos da terra e cristais antigos. Costumam ser reservados e pacientes, mas reagem com fúria esmagadora a quem profana seus salões. Sua magia rúnica transforma inimigos em estátuas que passam a fazer parte da rocha."
 },
 "rebentoDeStronmaus": {
  "id": "rebentoDeStronmaus",
  "tipo": "gigante",
  "name": "Rebento de Stronmaus",
  "nomeOriginal": "Scion of Stronmaus",
  "fonte": "BGG",
  "size": "imenso",
  "level": 25,
  "cr": "27",
  "xp": 105000,
  "abilities": {
   "str": 30,
   "dex": 20,
   "con": 30,
   "int": 26,
   "wis": 28,
   "cha": 24
  },
  "ac": 20,
  "acNote": "armadura natural",
  "maxHp": 656,
  "hpDice": "32d20+320",
  "speedFt": 60,
  "flyFt": 80,
  "hover": true,
  "speeds": {
   "flyFt": 80,
   "swimFt": 80
  },
  "senses": {
   "passivePerception": 27,
   "truesightFt": 120
  },
  "saves": [
   "dex",
   "int"
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
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "damageImmunities": [
   "elétrico",
   "trovejante"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "exausto",
   "amedrontado",
   "paralisado",
   "petrificado",
   "caido"
  ],
  "attacks": [
   {
    "name": "Espada de Relâmpago",
    "bonus": 18,
    "damage": "4d12+10",
    "type": "energético",
    "reachFt": 30,
    "danoExtra": {
     "damage": "4d10",
     "type": "elétrico"
    }
   },
   {
    "name": "Granizo",
    "bonus": 18,
    "damage": "4d10+10",
    "type": "concussão",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 120,
    "longRangeFt": 480,
    "danoExtra": {
     "damage": "4d8",
     "type": "frio"
    },
    "onHit": {
     "save": "str",
     "dc": 26,
     "condition": "caido",
     "rounds": 1,
     "repete": false
    }
   },
   {
    "name": "Pancada",
    "bonus": 18,
    "damage": "4d12+10",
    "type": "energético",
    "reachFt": 20
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Pancada",
    "Pancada"
   ]
  },
  "recursos": {
   "resistenciaLendaria": 6
  },
  "traits": [
   "voaSemProvocar",
   "resistenciaAMagia",
   "monstroDeCerco"
  ],
  "blurb": "Titã colossal que voa veloz golpeando com uma espada de relâmpagos a até 9 m e arremessando granizo a longa distância. Sua nuvem de tempestade alterna chuva ácida, gelo que imobiliza e raios que atordoam.",
  "lore": "Este titã descende de Stronmaus, o deus dos gigantes ligado às tempestades e ao céu. Carrega em si a fúria e a alegria das tormentas, e costuma habitar nuvens altas, picos e mares revoltos. Embora tenda ao bem, é imprevisível como o clima e reage com violência a quem ameaça seus domínios. Sábio e versado em magia e história antiga, raramente se envolve em assuntos mortais sem motivo grandioso."
 },
 "rebentoDeSurtur": {
  "id": "rebentoDeSurtur",
  "tipo": "gigante",
  "name": "Rebento de Surtur",
  "nomeOriginal": "Scion of Surtur",
  "fonte": "BGG",
  "size": "imenso",
  "level": 25,
  "cr": "25",
  "xp": 75000,
  "abilities": {
   "str": 30,
   "dex": 17,
   "con": 28,
   "int": 21,
   "wis": 24,
   "cha": 20
  },
  "ac": 20,
  "acNote": "armadura natural",
  "maxHp": 546,
  "hpDice": "28d20+252",
  "speedFt": 60,
  "senses": {
   "passivePerception": 25,
   "truesightFt": 120
  },
  "saves": [
   "dex",
   "cha"
  ],
  "skills": [
   "atletismo",
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
   "fogo"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "exausto",
   "amedrontado",
   "paralisado",
   "petrificado"
  ],
  "attacks": [
   {
    "name": "Lâmina de Lava",
    "bonus": 18,
    "damage": "4d10+10",
    "type": "cortante",
    "reachFt": 30,
    "danoExtra": {
     "damage": "4d8",
     "type": "fogo"
    }
   },
   {
    "name": "Bola de Lava",
    "bonus": 18,
    "damage": "3d12+10",
    "type": "concussão",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 120,
    "longRangeFt": 480,
    "danoExtra": {
     "damage": "3d6",
     "type": "fogo"
    },
    "onHit": {
     "save": "str",
     "dc": 26,
     "condition": "caido",
     "rounds": 1,
     "repete": false
    }
   },
   {
    "name": "Pancada",
    "bonus": 18,
    "damage": "4d8+10",
    "type": "energético",
    "reachFt": 20
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Pancada",
    "Pancada"
   ]
  },
  "recursos": {
   "resistenciaLendaria": 6
  },
  "acoesEspeciais": [
   {
    "nome": "Onda de Lava",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 90,
    "save": "dex",
    "dc": 25,
    "damage": "11d10",
    "damageType": "fogo",
    "halfOnSave": true,
    "condition": "contido",
    "rounds": 10,
    "repete": false
   }
  ],
  "traits": [
   "resistenciaAMagia",
   "monstroDeCerco"
  ],
  "blurb": "Titã de fogo colossal que golpeia com uma lâmina de lava de longo alcance, arremessa bolas de magma e sufoca o campo com fumaça incandescente. Sua onda de lava queima e prende grupos inteiros em rocha endurecida.",
  "lore": "Este titã é um descendente direto de Surtur, o lorde dos gigantes de fogo, e carrega em si o calor das forjas primordiais. Costuma surgir em regiões vulcânicas, fortalezas de basalto e lugares onde a terra se abre em rios de magma. Arrogante e disciplinado, ele se vê como herdeiro legítimo de uma ordem antiga e trata as raças menores como combustível para suas ambições. Onde caminha, o chão treme e o ar se enche de cinzas."
 },
 "rebentoDeThrym": {
  "id": "rebentoDeThrym",
  "tipo": "gigante",
  "name": "Rebento de Thrym",
  "nomeOriginal": "Scion of Thrym",
  "fonte": "BGG",
  "size": "imenso",
  "level": 21,
  "cr": "24",
  "xp": 62000,
  "abilities": {
   "str": 30,
   "dex": 16,
   "con": 27,
   "int": 17,
   "wis": 20,
   "cha": 21
  },
  "ac": 19,
  "acNote": "armadura natural",
  "maxHp": 499,
  "hpDice": "27d20+216",
  "speedFt": 60,
  "senses": {
   "passivePerception": 22,
   "truesightFt": 120
  },
  "saves": [
   "wis",
   "cha"
  ],
  "skills": [
   "atletismo",
   "percepcao"
  ],
  "expertise": [],
  "damageResistances": [
   "fogo",
   "elétrico",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "damageImmunities": [
   "frio"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "exausto",
   "amedrontado",
   "paralisado",
   "petrificado"
  ],
  "attacks": [
   {
    "name": "Machado de Gelo",
    "bonus": 17,
    "damage": "4d12+10",
    "type": "energético",
    "reachFt": 30,
    "danoExtra": {
     "damage": "4d8",
     "type": "frio"
    }
   },
   {
    "name": "Pancada",
    "bonus": 17,
    "damage": "4d10+10",
    "type": "energético",
    "reachFt": 20
   },
   {
    "name": "Arremesso de Geleira",
    "bonus": 17,
    "damage": "4d12+10",
    "type": "concussão",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 120,
    "longRangeFt": 480,
    "danoExtra": {
     "damage": "4d6",
     "type": "frio"
    },
    "onHit": {
     "save": "str",
     "dc": 25,
     "condition": "caido",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "multiattack": {
   "count": 5,
   "sequence": [
    "Machado de Gelo",
    "Pancada",
    "Pancada",
    "Arremesso de Geleira",
    "Arremesso de Geleira"
   ]
  },
  "recursos": {
   "resistenciaLendaria": 6
  },
  "acoesEspeciais": [
   {
    "nome": "Erupção Glacial",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "raio",
    "areaFt": 30,
    "save": "dex",
    "dc": 25,
    "damage": "8d8",
    "damageType": "concussão",
    "halfOnSave": true
   }
  ],
  "traits": [
   "resistenciaAMagia",
   "monstroDeCerco"
  ],
  "blurb": "Titã gélido que esmaga com machado de gelo e socos de alcance enorme, arremessa geleiras à distância e lança grupos inteiros ao ar com erupções de gelo. Ainda quebra a concentração de conjuradores só de se mover.",
  "lore": "Os rebentos de Thrym são titãs nascidos da essência do deus dos gigantes do gelo, encarnações vivas do inverno que não termina. Vagam por tundras, geleiras e picos congelados, onde o próprio chão parece obedecer à sua vontade. Costumam se impor sobre gigantes do gelo como líderes ou campeões divinos. São orgulhosos, implacáveis e enxergam o mundo como algo a ser soterrado sob o gelo."
 },
 "nuvemEspectral": {
  "id": "nuvemEspectral",
  "tipo": "morto-vivo",
  "name": "Nuvem Espectral",
  "nomeOriginal": "Spectral Cloud",
  "fonte": "BGG",
  "size": "enorme",
  "level": 13,
  "cr": "13",
  "xp": 10000,
  "abilities": {
   "str": 24,
   "dex": 12,
   "con": 18,
   "int": 12,
   "wis": 17,
   "cha": 16
  },
  "ac": 11,
  "maxHp": 189,
  "hpDice": "18d12+72",
  "speedFt": 0,
  "flyFt": 40,
  "hover": true,
  "speeds": {
   "flyFt": 40
  },
  "senses": {
   "passivePerception": 18
  },
  "saves": [
   "dex",
   "cha"
  ],
  "skills": [
   "percepcao"
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
  "damageImmunities": [
   "veneno",
   "trovejante"
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
    "name": "Toque Espectral",
    "bonus": 12,
    "damage": "3d8+7",
    "type": "energético",
    "reachFt": 10,
    "onHit": {
     "save": "con",
     "dc": 20,
     "danoSeFalhar": {
      "damage": "3d6",
      "type": "necrótico"
     },
     "metadeSePassar": false
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Toque Espectral",
    "Toque Espectral"
   ]
  },
  "acoesEspeciais": [
   {
    "nome": "Ventos Gélidos",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "linha",
    "areaFt": 60,
    "larguraFt": 10,
    "save": "con",
    "dc": 20,
    "damage": "7d10",
    "damageType": "frio",
    "halfOnSave": true,
    "condition": "incapacitado",
    "rounds": 10,
    "repete": true,
    "imunizaAoPassar": true
   }
  ],
  "traits": [
   "t_formaBorrada",
   "incorporealMovement"
  ],
  "blurb": "Uma massa de névoa morta-viva difícil de acertar à distância, que drena a vitalidade com toques energéticos e necróticos e sopra ventos gélidos capazes de deixar grupos inteiros incapacitados.",
  "lore": "Quando um gigante das nuvens morre traído ou após uma aposta desastrosa, seu espírito pode voltar como uma nuvem espectral. À primeira vista parece só um banco de neblina espessa, mas quem olha com atenção percebe uma silhueta sombria no interior, que no centro se revela o esqueleto do gigante. Contam também que alguns gigantes buscam esse destino de propósito, recusando o fim de suas longas vidas: num ritual, o coração é implantado numa nuvem, o corpo se desfaz e o espírito passa a animá-la."
 },
 "leaoMalhado": {
  "id": "leaoMalhado",
  "tipo": "fera",
  "name": "Leão Malhado",
  "nomeOriginal": "Spotted Lion",
  "fonte": "BGG",
  "size": "enorme",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 23,
   "dex": 14,
   "con": 17,
   "int": 5,
   "wis": 13,
   "cha": 10
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 66,
  "hpDice": "7d12+21",
  "speedFt": 60,
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
   "percepcao",
   "furtividade"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Dilacerar",
    "bonus": 8,
    "damage": "2d8+6",
    "type": "perfurante",
    "reachFt": 10,
    "onHit": {
     "save": "str",
     "dc": 16,
     "condition": "caido",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "traits": [
   "packTactics"
  ],
  "blurb": "Um felino enorme que avança em disparada para derrubar a presa com suas presas e garras e, com ela no chão, atacá-la de novo. Em bando, fica ainda mais letal, pois ganha vantagem quando um aliado está ao lado do alvo.",
  "lore": "O leão malhado tem cerca do dobro do tamanho de um leão comum, com pelagem e juba escuras pontilhadas de manchas cor de carvão. Vive e caça em grupos, perseguindo presas gigantescas como alces gigantes e mamutes. Gigantes de pedra e das nuvens costumam criá-lo como bicho de estimação e parceiro de caçada. Quando está de barriga cheia, tende mais a se espreguiçar do que a dar o alarme ao avistar intrusos."
 },
 "perseguidorDeBaphomet": {
  "id": "perseguidorDeBaphomet",
  "tipo": "corruptor",
  "name": "Perseguidor de Baphomet",
  "nomeOriginal": "Stalker of Baphomet",
  "fonte": "BGG",
  "size": "enorme",
  "level": 9,
  "cr": "12",
  "xp": 8400,
  "abilities": {
   "str": 25,
   "dex": 17,
   "con": 22,
   "int": 13,
   "wis": 16,
   "cha": 12
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 200,
  "hpDice": "16d12+96",
  "speedFt": 40,
  "senses": {
   "passivePerception": 17,
   "darkvisionFt": 120
  },
  "saves": [
   "dex",
   "wis"
  ],
  "skills": [
   "atletismo",
   "percepcao",
   "furtividade"
  ],
  "expertise": [
   "atletismo",
   "furtividade"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "amedrontado"
  ],
  "attacks": [
   {
    "name": "Glaive",
    "bonus": 11,
    "damage": "2d10+7",
    "type": "cortante",
    "reachFt": 15,
    "danoExtra": {
     "damage": "2d8",
     "type": "energético"
    }
   },
   {
    "name": "Rocha",
    "bonus": 11,
    "damage": "3d10+7",
    "type": "concussão",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 60,
    "longRangeFt": 240,
    "onHit": {
     "save": "str",
     "dc": 19,
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
     "Glaive",
     "Glaive"
    ],
    [
     "Rocha",
     "Rocha"
    ]
   ]
  },
  "spellcasting": {
   "ability": "wis",
   "cantrips": [],
   "prepared": [
    "fundirSeComPedra",
    "muralhaDePedra"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "fundirSeComPedra": 1,
    "muralhaDePedra": 1
   },
   "cdPorMagia": {
    "fundirSeComPedra": 15,
    "muralhaDePedra": 15
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Chifres Irrompentes",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "raio",
    "areaFt": 60,
    "save": "dex",
    "dc": 15,
    "damage": "6d10",
    "damageType": "perfurante",
    "halfOnSave": true
   }
  ],
  "traits": [
   "t_memoriaLabirintica",
   "resistenciaAMagia"
  ],
  "blurb": "Gigante demoníaco que golpeia com uma glaive de alcance longo e arremessa rochas que derrubam. Faz brotar chifres de pedra do chão que perfuram e lançam os inimigos para o alto.",
  "lore": "Gigantes de pedra raramente cultuam demônios, mas alguns se encantam com os labirintos que Baphomet, o Rei Chifrudo, ergue como campos de caça. Ao servi-lo, continuam esculpindo labirintos e saciam a sede de sangue caçando dentro deles. Os mais devotos são transformados em perseguidores, ganhando uma coroa de seis chifres. O Príncipe das Feras também lhes concede uma glaive mágica e o poder de arrancar chifres de pedra da terra."
 },
 "giganteDePedraDaTerraMaligna": {
  "id": "giganteDePedraDaTerraMaligna",
  "tipo": "gigante",
  "name": "Gigante de Pedra da Terra Maligna",
  "nomeOriginal": "Stone Giant of Evil Earth",
  "fonte": "BGG",
  "size": "enorme",
  "level": 9,
  "cr": "9",
  "xp": 5000,
  "abilities": {
   "str": 23,
   "dex": 13,
   "con": 22,
   "int": 10,
   "wis": 12,
   "cha": 9
  },
  "ac": 20,
  "acNote": "armadura de placas",
  "maxHp": 137,
  "hpDice": "11d12+66",
  "speedFt": 40,
  "senses": {
   "passivePerception": 15,
   "darkvisionFt": 60
  },
  "saves": [
   "str",
   "con"
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
    "name": "Clava de Pedra Trovejante",
    "bonus": 10,
    "damage": "3d6+6",
    "type": "concussão",
    "reachFt": 15,
    "danoExtra": {
     "damage": "3d6",
     "type": "trovejante"
    }
   },
   {
    "name": "Rocha",
    "bonus": 10,
    "damage": "3d8+6",
    "type": "concussão",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 60,
    "longRangeFt": 240,
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
   "count": 2,
   "sequencias": [
    [
     "Clava de Pedra Trovejante",
     "Clava de Pedra Trovejante"
    ],
    [
     "Rocha",
     "Rocha"
    ]
   ]
  },
  "traits": [
   "t_inabalavel"
  ],
  "blurb": "Brutamontes de armadura pesada que golpeia com uma clava de pedra cuja onda trovejante atinge todos ao redor do alvo, ou arremessa rochas que derrubam. Quase impossível de empurrar ou derrubar.",
  "lore": "Alguns gigantes de pedra, inclinados à crueldade, abandonam os deuses do Ordning e passam a adorar Ogrémoch, o Príncipe da Terra Maligna. Para eles, o mundo da superfície é um pesadelo que precisa ser esmagado até virar entulho. Vestem armaduras pesadas moldadas à imagem de seu patrono e empunham armas que vibram com energia trovejante. Servem como a força bruta dos cultos elementais que tramam a ruína do mundo."
 },
 "giganteDePedraFalarrocha": {
  "id": "giganteDePedraFalarrocha",
  "tipo": "gigante",
  "name": "Gigante de Pedra Falarrocha",
  "nomeOriginal": "Stone Giant Rockspeaker",
  "fonte": "BGG",
  "size": "enorme",
  "level": 13,
  "cr": "16",
  "xp": 15000,
  "abilities": {
   "str": 23,
   "dex": 15,
   "con": 20,
   "int": 19,
   "wis": 14,
   "cha": 10
  },
  "ac": 19,
  "acNote": "armadura natural",
  "maxHp": 276,
  "hpDice": "24d12+120",
  "speedFt": 40,
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
   "atletismo",
   "historia",
   "percepcao"
  ],
  "expertise": [
   "atletismo"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Cajado Prismático",
    "bonus": 11,
    "damage": "3d6+6",
    "type": "concussão",
    "reachFt": 10,
    "danoExtra": {
     "damage": "3d8",
     "type": "radiante"
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Cajado Prismático",
    "Cajado Prismático",
    "Cajado Prismático"
   ]
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "acoesEspeciais": [
   {
    "nome": "Geodo Explosivo",
    "tipo": "area",
    "shape": "raio",
    "areaFt": 60,
    "save": "dex",
    "dc": 17,
    "damage": "3d8",
    "damageType": "perfurante",
    "halfOnSave": true,
    "condition": "cego",
    "rounds": 1,
    "repete": false,
    "ateFimDoTurnoDele": true
   }
  ],
  "traits": [
   "t_raiosPrismaticos",
   "t_12VermelhoArdente",
   "t_34AzulAterrador",
   "t_56VerdeDrenante",
   "t_runaDePedra"
  ],
  "blurb": "Golpeia com um cajado prismático de 3 m de alcance e arremessa geodos que explodem em clarões cegantes. Enquanto mantém sua runa de pedra, dispara um cone de raios coloridos que cegam, amedrontam ou incapacitam.",
  "lore": "Entre os gigantes de pedra, a magia rúnica é mais comum que em outras linhagens, talvez pelo talento que têm para esculpir rocha. Os falarrochas unem essa magia a uma habilidade artística excepcional e servem às suas comunidades como líderes e oráculos. Costumam costurar cristais nas roupas e incrustá-los na própria pele, transformando-os em obras cintilantes com o poder das runas. Na batalha, fazem esses mesmos cristais lançarem feixes de luz intensa capazes de queimar e paralisar inimigos."
 },
 "caranguejoDaTempestade": {
  "id": "caranguejoDaTempestade",
  "tipo": "monstruosidade",
  "name": "Caranguejo da Tempestade",
  "nomeOriginal": "Storm Crab",
  "fonte": "BGG",
  "size": "imenso",
  "level": 9,
  "cr": "11",
  "xp": 7200,
  "abilities": {
   "str": 23,
   "dex": 10,
   "con": 21,
   "int": 5,
   "wis": 14,
   "cha": 9
  },
  "ac": 18,
  "acNote": "armadura natural",
  "maxHp": 155,
  "hpDice": "10d20+50",
  "speedFt": 40,
  "speeds": {
   "swimFt": 60
  },
  "senses": {
   "passivePerception": 16,
   "blindsightFt": 60
  },
  "saves": [
   "str",
   "con"
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
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Claw",
    "bonus": 10,
    "damage": "3d8+6",
    "type": "concussão",
    "reachFt": 15
   },
   {
    "name": "Stinger",
    "bonus": 10,
    "damage": "3d10+6",
    "type": "perfurante",
    "reachFt": 10,
    "onHit": {
     "save": "con",
     "dc": 17,
     "condition": "envenenado",
     "rounds": 10,
     "repete": true
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Claw",
    "Claw",
    "Stinger"
   ]
  },
  "acoesEspeciais": [
   {
    "nome": "Water Jet",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "linha",
    "areaFt": 150,
    "larguraFt": 10,
    "save": "dex",
    "dc": 17,
    "damage": "6d8",
    "damageType": "concussão",
    "halfOnSave": true,
    "condition": "caido",
    "rounds": 10,
    "repete": false
   }
  ],
  "traits": [],
  "blurb": "Agarra até quatro alvos com as pinças enquanto o ferrão envenena e paralisa; um jato de água em linha de 45 m derruba e empurra grupos inteiros.",
  "lore": "Crustáceo gigantesco com quatro pinças enormes e um ferrão venenoso, igualmente à vontade no fundo do mar e na praia. Segundo os gigantes, foi criado por Stronmaus ou por um de seus filhos nos tempos de um antigo império, para enfrentar tartarugas-dragão, dragões de bronze e outras ameaças marinhas. Hoje costuma vigiar as fortalezas submersas dos gigantes das tempestades e também as ruínas que eles deixaram para trás. É feroz com qualquer intruso e entende a língua dos gigantes, embora não consiga falar."
 },
 "giganteDasTempestadesInvocadorDaTormenta": {
  "id": "giganteDasTempestadesInvocadorDaTormenta",
  "tipo": "gigante",
  "name": "Gigante das Tempestades Invocador da Tormenta",
  "nomeOriginal": "Storm Giant Tempest Caller",
  "fonte": "BGG",
  "size": "enorme",
  "level": 17,
  "cr": "20",
  "xp": 25000,
  "abilities": {
   "str": 29,
   "dex": 14,
   "con": 20,
   "int": 21,
   "wis": 18,
   "cha": 25
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 310,
  "hpDice": "27d12+135",
  "speedFt": 50,
  "flyFt": 50,
  "hover": true,
  "speeds": {
   "flyFt": 50,
   "swimFt": 50
  },
  "senses": {
   "passivePerception": 20,
   "truesightFt": 120
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
   "percepcao"
  ],
  "expertise": [
   "arcanismo"
  ],
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
    "name": "Lâmina de Relâmpago",
    "bonus": 15,
    "damage": "3d8+9",
    "type": "cortante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "3d10",
     "type": "elétrico"
    }
   },
   {
    "name": "Lança de Relâmpago",
    "bonus": 13,
    "damage": "5d12+7",
    "type": "elétrico",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 500,
    "longRangeFt": 500
   }
  ],
  "multiattack": {
   "count": 3,
   "sequencias": [
    [
     "Lâmina de Relâmpago",
     "Lâmina de Relâmpago",
     "Lâmina de Relâmpago"
    ],
    [
     "Lança de Relâmpago",
     "Lança de Relâmpago",
     "Lança de Relâmpago"
    ]
   ]
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "dissiparMagia",
    "viagemPlanar",
    "enviarMensagem",
    "pararOTempo",
    "detectarMagia",
    "detectarPensamentos"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "dissiparMagia": 1,
    "viagemPlanar": 1,
    "enviarMensagem": 1,
    "pararOTempo": 1
   },
   "aVontade": [
    "detectarMagia",
    "detectarPensamentos"
   ],
   "cdPorMagia": {
    "dissiparMagia": 21,
    "viagemPlanar": 21,
    "enviarMensagem": 21,
    "pararOTempo": 21,
    "detectarMagia": 21,
    "detectarPensamentos": 21
   }
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "traits": [
   "t_chamadoDaTormentaRequerRunaDaTempestade",
   "sempreAlerta",
   "t_videnciaRequerRunaDaTempestade",
   "t_runaDaTempestade"
  ],
  "blurb": "Combate corpo a corpo com uma lâmina de relâmpagos ou arremessa lanças elétricas a centenas de metros, e pode envolver todos ao redor num vórtice elemental devastador. Destruir o cristal rúnico embutido no corpo dele anula seus poderes de runa.",
  "lore": "Esses gigantes das tempestades se colocam no topo do ordning, e poucos ousam contestar essa posição. Além da magia inata de sua raça, dominam a magia das runas e são tratados com enorme respeito entre os gigantes. Encaixam uma bola de cristal gravada com a runa da tempestade na testa ou na órbita do olho, o que lhes permite enxergar através de ilusões e espionar à distância. Dizem que, se algum gigante for capaz de atrair o olhar de Annam de volta ao mundo, será um deles."
 },
 "arautoDaTempestade": {
  "id": "arautoDaTempestade",
  "tipo": "aberração",
  "name": "Arauto da Tempestade",
  "nomeOriginal": "Storm Herald",
  "fonte": "BGG",
  "size": "enorme",
  "level": 17,
  "cr": "17",
  "xp": 18000,
  "abilities": {
   "str": 27,
   "dex": 14,
   "con": 22,
   "int": 24,
   "wis": 18,
   "cha": 18
  },
  "ac": 16,
  "acNote": "armadura natural",
  "maxHp": 287,
  "hpDice": "23d12+138",
  "speedFt": 50,
  "speeds": {
   "swimFt": 100
  },
  "senses": {
   "passivePerception": 20,
   "darkvisionFt": 120
  },
  "saves": [
   "wis",
   "cha"
  ],
  "skills": [
   "arcanismo",
   "enganacao",
   "percepcao"
  ],
  "expertise": [],
  "damageResistances": [
   "frio",
   "psíquico"
  ],
  "damageImmunities": [
   "elétrico",
   "trovejante"
  ],
  "conditionImmunities": [
   "enfeitiçado",
   "amedrontado"
  ],
  "attacks": [
   {
    "name": "Garra",
    "bonus": 14,
    "damage": "3d6+8",
    "type": "cortante",
    "reachFt": 10
   },
   {
    "name": "Tentáculos",
    "bonus": 14,
    "damage": "3d8+8",
    "type": "concussão",
    "reachFt": 10,
    "danoExtra": {
     "damage": "3d10",
     "type": "psíquico"
    }
   },
   {
    "name": "Tridente",
    "bonus": 14,
    "damage": "3d6+8",
    "type": "perfurante",
    "reachFt": 10,
    "danoExtra": {
     "damage": "3d8+8",
     "type": "perfurante"
    }
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Garra",
    "Tentáculos",
    "Tridente"
   ]
  },
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "enviarMensagem",
    "detectarMagia",
    "detectarPensamentos",
    "maoMagica"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "enviarMensagem": 1
   },
   "aVontade": [
    "detectarMagia",
    "detectarPensamentos",
    "maoMagica"
   ],
   "cdPorMagia": {
    "enviarMensagem": 21,
    "detectarMagia": 21,
    "detectarPensamentos": 21,
    "maoMagica": 21
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Onda Psíquica (Recarga 5–6)",
    "recharge": [
     6
    ],
    "tipo": "alvo",
    "alcanceFt": 90,
    "alvos": 3,
    "save": "int",
    "dc": 21,
    "damage": "3d10+7",
    "damageType": "psíquico",
    "halfOnSave": true,
    "condition": "atordoado",
    "rounds": 10,
    "repete": true
   }
  ],
  "traits": [
   "resistenciaAMagia"
  ],
  "blurb": "Gigante corrompido que golpeia com garra, tentáculos e tridente elétrico a 3 m de alcance, prendendo uma vítima e queimando sua mente. Sua Onda Psíquica atordoa até três alvos e pode explodir cabeças.",
  "lore": "É um gigante das tempestades que se perdeu nas profundezas oceânicas e caiu sob o domínio de alguma entidade antiga, como um kraken, um aboleth ou um Grande Antigo. A corrupção lhe dá barbatanas, tentáculos e poderes psíquicos temíveis, e sua vontade passa a pertencer inteiramente ao mestre. Trabalha para os planos desse senhor, seja recrutando outros gigantes, seja reunindo cultos de criaturas menores. Ao morrer, o corpo volta à antiga forma de gigante."
 },
 "espiritoDaTempestade": {
  "id": "espiritoDaTempestade",
  "tipo": "morto-vivo",
  "name": "Espírito da Tempestade",
  "nomeOriginal": "Tempest Spirit",
  "fonte": "BGG",
  "size": "enorme",
  "level": 13,
  "cr": "15",
  "xp": 13000,
  "abilities": {
   "str": 24,
   "dex": 14,
   "con": 20,
   "int": 16,
   "wis": 18,
   "cha": 19
  },
  "ac": 12,
  "maxHp": 195,
  "hpDice": "17d12+85",
  "speedFt": 0,
  "flyFt": 60,
  "hover": true,
  "speeds": {
   "flyFt": 60
  },
  "senses": {
   "passivePerception": 19
  },
  "saves": [
   "con",
   "int",
   "wis",
   "cha"
  ],
  "skills": [
   "arcanismo",
   "percepcao"
  ],
  "expertise": [],
  "damageResistances": [
   "frio",
   "necrótico",
   "veneno",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "damageImmunities": [
   "elétrico",
   "trovejante"
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
    "name": "Punho Relampejante",
    "bonus": 12,
    "damage": "4d8+7",
    "type": "elétrico",
    "reachFt": 10
   },
   {
    "name": "Granizo",
    "bonus": 12,
    "damage": "3d6+7",
    "type": "concussão",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 90,
    "longRangeFt": 180,
    "danoExtra": {
     "damage": "2d6",
     "type": "frio"
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequencias": [
    [
     "Punho Relampejante",
     "Punho Relampejante"
    ],
    [
     "Granizo",
     "Granizo"
    ]
   ]
  },
  "breath": {
   "name": "Raio da Morte (Recarga 5–6)",
   "kind": "save",
   "shape": "linha",
   "areaFt": 120,
   "save": "dex",
   "dc": 18,
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
  "recursos": {
   "resistenciaLendaria": 3
  },
  "traits": [
   "incorporealMovement"
  ],
  "blurb": "Gigante morto-vivo flutuante que golpeia com punhos de raio a 3 m e arremessa granizo de longe. Seu Raio da Morte em linha reduz o máximo de PV das vítimas, e como ação bônus invoca chuvas de granizo que derrubam grupos inteiros.",
  "lore": "Quando um gigante das tempestades tenta escapar da morte por um ritual que o transforma em tempestade, mas o realiza onde o Pendor das Sombras toca o Plano Material, a energia negativa corrompe o processo. Em vez de se dissolver nos elementos, a alma do gigante suga a energia ao redor e sua metade inferior vira uma nuvem de tempestade. A aparência lembra a de um djinni, e aventureiros às vezes confundem os dois. Alguns desses espíritos se isolam tentando desfazer a transformação; outros se entregam à fúria e devastam tudo, despejando granizo e relâmpagos necróticos sobre quem se aproxima."
 },
 "titanoterio": {
  "id": "titanoterio",
  "tipo": "fera",
  "name": "Titanotério",
  "nomeOriginal": "Titanothere",
  "fonte": "BGG",
  "size": "enorme",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 25,
   "dex": 10,
   "con": 19,
   "int": 2,
   "wis": 12,
   "cha": 6
  },
  "ac": 16,
  "acNote": "armadura natural",
  "maxHp": 136,
  "hpDice": "13d12+52",
  "speedFt": 50,
  "senses": {
   "passivePerception": 11
  },
  "saves": [],
  "skills": [],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Pisotear",
    "bonus": 10,
    "damage": "3d8+7",
    "type": "concussão",
    "reachFt": 10,
    "danoExtra": {
     "damage": "3d8",
     "type": "concussão"
    },
    "onHit": {
     "save": "str",
     "dc": 18,
     "condition": "caido",
     "rounds": 1,
     "repete": false
    }
   }
  ],
  "traits": [
   "t_bestaDeCarga"
  ],
  "blurb": "Um colosso que investe em linha reta e esmaga tudo com as patas, com alcance de 3 m. Se correr 6 m até o alvo antes de golpear, causa dano extra e pode derrubá-lo.",
  "lore": "Titanotérios são mamíferos gigantescos aparentados com os rinocerontes. A aparência varia muito: alguns não têm chifres e outros exibem vários, e a pele pode ser pedregosa, coberta de placas ou de pelo espesso. Todos são imensos, andam em manadas e têm temperamento irritadiço. Povos de regiões geladas e ermas às vezes os domesticam como montaria e animal de carga."
 },
 "amalgamaDeTrolls": {
  "id": "amalgamaDeTrolls",
  "tipo": "gigante",
  "name": "Amálgama de Trolls",
  "nomeOriginal": "Troll Amalgam",
  "fonte": "BGG",
  "size": "imenso",
  "level": 17,
  "cr": "17",
  "xp": 18000,
  "abilities": {
   "str": 25,
   "dex": 14,
   "con": 21,
   "int": 9,
   "wis": 16,
   "cha": 5
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 217,
  "hpDice": "14d20+70",
  "speedFt": 60,
  "speeds": {
   "climbFt": 60
  },
  "senses": {
   "passivePerception": 19,
   "darkvisionFt": 120
  },
  "saves": [
   "con",
   "wis"
  ],
  "skills": [
   "percepcao"
  ],
  "expertise": [],
  "damageResistances": [
   "veneno",
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "conditionImmunities": [
   "enfeitiçado",
   "amedrontado",
   "envenenado"
  ],
  "attacks": [
   {
    "name": "Dilacerar",
    "bonus": 13,
    "damage": "4d8+7",
    "type": "cortante",
    "reachFt": 15
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Dilacerar",
    "Dilacerar",
    "Dilacerar"
   ]
  },
  "recursos": {
   "resistenciaLendaria": 3
  },
  "regeneracao": {
   "pv": 15,
   "bloqueia": []
  },
  "traits": [
   "resistenciaAMagia",
   "regeneracaoDoLivro"
  ],
  "blurb": "Massa gigantesca de trolls fundidos que dilacera com três golpes de 4,5 m de alcance e arremessa membros vivos que agarram e retalham as vítimas. Regenera 15 PV por turno; só fogo ou ácido conseguem detê-la de vez.",
  "lore": "Quando muitos trolls se regeneram uns sobre os outros, a carne pode se misturar até formar um único colosso de braços, bocas e olhos. Esse amálgama vaga pelas profundezas e pelas terras selvagens movido por uma fome sem fim. Sua mente confusa mal se mantém coesa, mas seus instintos de caça são afiados. Até pedaços arrancados do corpo continuam vivos e às vezes crescem até virar trolls novos."
 },
 "trollMutante": {
  "id": "trollMutante",
  "tipo": "gigante",
  "name": "Troll Mutante",
  "nomeOriginal": "Troll Mutate",
  "fonte": "BGG",
  "size": "grande",
  "level": 5,
  "cr": "7",
  "xp": 2900,
  "abilities": {
   "str": 19,
   "dex": 13,
   "con": 18,
   "int": 17,
   "wis": 9,
   "cha": 12
  },
  "ac": 16,
  "acNote": "armadura natural",
  "maxHp": 95,
  "hpDice": "10d10+40",
  "speedFt": 30,
  "flyFt": 30,
  "speeds": {
   "flyFt": 30
  },
  "senses": {
   "passivePerception": 15,
   "blindsightFt": 60
  },
  "saves": [
   "con",
   "int"
  ],
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
    "name": "Dilacerar",
    "bonus": 7,
    "damage": "2d10+4",
    "type": "cortante",
    "reachFt": 5,
    "danoExtra": {
     "damage": "2d8",
     "type": "energético"
    }
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Dilacerar",
    "Dilacerar"
   ]
  },
  "acoesEspeciais": [
   {
    "nome": "Explosão Psíquica (Recarga 5–6)",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "raio",
    "areaFt": 30,
    "save": "int",
    "dc": 14,
    "damage": "8d6",
    "damageType": "psíquico",
    "halfOnSave": true
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
   "t_mutacao",
   "amorfo",
   "resistenciaAMagia",
   "t_repreensaoPsiquicaSoEspelhoPsionico",
   "regeneracaoDoLivro"
  ],
  "blurb": "Rasga com garras que somam dano cortante e energético e libera uma explosão psíquica em área de 9 m. Regenera 10 PV por turno, e só fogo ou ácido interrompem isso; se voltar do zero, ganha uma nova mutação.",
  "lore": "O troll mutante é fruto de experimentos que fundiram a carne regenerativa dos trolls com poder psiônico e arcano. Cada um nasce com uma deformação diferente, que pode ser um corpo elástico, asas, cicatrizes de magia ou uma mente que reflete dor. Ao contrário dos trolls comuns, é astuto e se comunica por telepatia. Quanto mais perto da morte chega, mais estranho se torna, pois cada regeneração forçada pode lhe dar uma mutação nova."
 }
};

export const TRACOS_BGG = {
 "t_feridaNociva": {
  "name": "Ferida Nociva",
  "desc": "Logo após sofrer dano perfurante ou cortante, cada criatura a até 1,5 m faz teste de resistência de Destreza CD 16, sofrendo 10 (3d6) de dano de veneno, ou metade se passar."
 },
 "t_runaDasNuvens": {
  "name": "Runa das Nuvens",
  "desc": "Enquanto segura ou usa a máscara com a runa, tem visão verdadeira de 9 m e pode usar Palmas Trovejantes e Anular Magia. A máscara tem CA 15, 45 PV, imunidade a necrótico, veneno e psíquico, recupera todos os PV ao fim de cada turno e vira pó se chegar a 0 PV ou se o gigante morrer; ele pode refazê-la num descanso curto ou longo."
 },
 "t_anularMagia": {
  "name": "Anular Magia",
  "desc": "Quando vê uma criatura a até 18 m lançar uma magia, tenta interrompê-la: magias de 3º círculo ou menor falham automaticamente; de 4º círculo ou maior, o conjurador precisa passar num teste de resistência de Inteligência CD 18 ou a magia falha."
 },
 "t_trovoada": {
  "name": "Trovoada",
  "desc": "Logo após sofrer dano, explode num raio de 9 m: as demais criaturas fazem teste de Constituição CD 25 ou sofrem 18 (4d8) trovejante e ficam surdas por 1 minuto."
 },
 "t_passoTrovejante": {
  "name": "Passo Trovejante",
  "desc": "Logo após sofrer dano, teleporta-se até 18 m para um espaço visível. Criaturas a até 3 m do ponto de partida fazem teste de resistência de Constituição CD 22, sofrendo 14 (4d6) de dano trovejante na falha ou metade no sucesso."
 },
 "t_runaDaMorte": {
  "name": "Runa da Morte",
  "desc": "Enquanto segura ou usa o crânio com a runa, pode usar Foice Ceifadora e Mortalha de Almas. O crânio tem CA 18, 35 PV, imunidade a necrótico, veneno e psíquico, recupera todos os PV ao fim de cada turno e vira pó se chegar a 0 PV ou se o gigante morrer; ele pode gravar outra runa num crânio após um descanso curto ou longo."
 },
 "t_poeiraArdente": {
  "name": "Poeira Ardente",
  "desc": "Uma criatura dentro do seu espaço faz teste de resistência de Constituição CD 14. Se falhar, sofre 10 (3d6) de dano de concussão e fica cega até o fim do próximo turno dela; se passar, sofre só metade do dano."
 },
 "t_maldicaoDaMorte": {
  "name": "Maldição da Morte",
  "desc": "Quando o fensir morre, cada criatura a até 9 m faz teste de resistência de Carisma CD 13 ou fica amaldiçoada por 24 horas. Amaldiçoada, não recupera nada com descansos e, ao fim de cada hora, repete o teste CD 13 ou sofre 11 (2d10) de dano psíquico."
 },
 "t_lamaEmPedra": {
  "name": "Lama em Pedra",
  "desc": "Recarga 5–6. Esfera de 9 m de raio a até 18 m: cada criatura que não seja fensir faz teste de resistência de Destreza CD 13 ou sofre 13 (3d8) de concussão e fica contida. No fim do próximo turno repete o teste: sucesso encerra o efeito, falha deixa petrificada por 24 horas."
 },
 "t_runaDeFogo": {
  "name": "Runa de Fogo",
  "desc": "Enquanto porta o objeto com a runa, pode usar Onda de Magma e Armadura de Fornalha. O objeto tem CA 15, 40 PV, imunidade a dano necrótico, veneno e psíquico, recupera todos os PV no fim de cada turno e vira pó se chegar a 0 PV ou se o gigante morrer; ele pode inscrever outra após um descanso curto ou longo."
 },
 "t_tomadorDeAlmas": {
  "name": "Tomador de Almas",
  "desc": "Gigante ou humanoide reduzido a 0 PV por ele morre, e sua alma vira um lêmure em Avernus em 1d4 horas. Depois disso, só volta com desejo ou matando o lêmure e usando ressurreição verdadeira no corpo."
 },
 "t_sangueDeFogo": {
  "name": "Sangue de Fogo",
  "desc": "Uma criatura a até 1,5 m que a acerte com ataque corpo a corpo de dano cortante ou perfurante sofre 5 (1d10) de dano de fogo."
 },
 "t_contorcionista": {
  "name": "Contorcionista",
  "desc": "Ocupa espaços próprios para criaturas Grandes sem precisar se espremer."
 },
 "t_posturaRastejante": {
  "name": "Postura Rastejante",
  "desc": "Enquanto caído, rastejar não custa movimento extra e os ataques contra ele não ganham vantagem por essa condição."
 },
 "t_runaDeSangue": {
  "name": "Runa de Sangue",
  "desc": "Enquanto porta o objeto com a runa, pode usar Maldição Corruptora e Repreensão Venenosa. O objeto tem CA 15, 30 PV, imunidade a dano necrótico, veneno e psíquico, recupera todos os PV ao fim de cada turno e vira pó a 0 PV ou se o fomoriano morrer; ele pode gravar uma nova runa após um descanso curto ou longo."
 },
 "t_repreensaoVenenosa": {
  "name": "Repreensão Venenosa",
  "desc": "Quando sofre dano de uma criatura visível a até 18 m, ela faz teste de resistência de Constituição CD 16 ou fica envenenada até o fim do próximo turno dela. Requer a runa de sangue."
 },
 "t_lobosDeGelo": {
  "name": "Lobos de Gelo",
  "desc": "Requer a Runa do Gelo. Invoca 1d4 lobos do inverno elementais a até 9 m, que agem logo após o gigante e obedecem a ele, recebendo +6 em ataque e dano enquanto estiverem a até 9 m dele. Somem após 1 minuto, se o gigante morrer ou se ele usar a ação de novo."
 },
 "t_runaDoGelo": {
  "name": "Runa do Gelo",
  "desc": "Enquanto porta o objeto com a runa, pode usar Lobos de Gelo e Armadura de Gelo. O objeto tem CA 16, 40 PV, imunidade a necrótico, veneno e psíquico, recupera todos os PV ao fim de cada turno e vira pó se chegar a 0 PV ou se o gigante morrer; ele pode gravar outra runa após um descanso curto ou longo."
 },
 "t_fugaNaNevasca": {
  "name": "Fuga na Nevasca",
  "desc": "Quando uma criatura que ele vê o acerta com uma jogada de ataque, ele vira nevasca e reduz esse dano à metade. Em seguida, pode se teleportar para um espaço desocupado visível a até 9 m."
 },
 "t_peteleco": {
  "name": "Peteleco",
  "desc": "Logo após sofrer dano de uma criatura Grande ou menor visível a até 6 m, o alvo faz teste de resistência de Força CD 23. Se falhar, sofre 18 (3d6 + 8) de dano de concussão, é empurrado até 30 m na horizontal e fica caído."
 },
 "t_imitacaoDeMagia": {
  "name": "Imitação de Magia",
  "desc": "Uma vez por dia, quando uma criatura visível lança magia de 5º nível ou menor, ela faz teste de resistência de Carisma CD 19. Se falhar, a gargântua lança a mesma magia no mesmo nível na hora, sem componentes materiais e escolhendo os alvos (+11 em ataques mágicos, CD 19)."
 },
 "t_grasnadoTrovejante": {
  "name": "Grasnado Trovejante",
  "desc": "Recarga 5–6. Todas as outras criaturas a até 9 m fazem teste de resistência de Constituição CD 12: na falha sofrem 16 (3d10) de dano trovejante e ficam surdas até o início do próximo turno do ganso; no sucesso, metade do dano. O som é ouvido a até 90 m."
 },
 "t_visaoDoLince": {
  "name": "Visão do Lince",
  "desc": "Uma vez por dia, conjura clarividência sem componentes, usando Sabedoria como atributo de conjuração."
 },
 "t_animalDeCarga": {
  "name": "Animal de Carga",
  "desc": "Para calcular quanto peso consegue carregar, conta como uma categoria de tamanho acima da sua."
 },
 "t_veloAbsorvente": {
  "name": "Velo Absorvente",
  "desc": "Recarga. Logo após passar num teste de resistência contra uma magia ou ser errado por um ataque de magia, faz um ataque de Disparo de Energia."
 },
 "t_drenarSangue": {
  "name": "Drenar Sangue",
  "desc": "Causa 10 (2d6 + 3) de dano necrótico a uma criatura à qual esteja preso (17, ou 4d6 + 3, se for um gigante), recuperando PV iguais ao dano. Não funciona contra constructos ou mortos-vivos."
 },
 "t_desvanecer": {
  "name": "Desvanecer",
  "desc": "Fica invisível, junto com o equipamento, por 1 hora ou até atacar. Pode manter visível uma parte do corpo, como o sorriso, a cabeça ou a cauda."
 },
 "t_runaDaColina": {
  "name": "Runa da Colina",
  "desc": "Enquanto segura ou veste o objeto com a runa, pode usar Avalanche de Pedras e Repulsão da Colina. O objeto tem CA 15, 20 PV, imunidade a dano necrótico, veneno e psíquico, recupera todos os PV ao fim de cada turno e vira pó se chegar a 0 PV ou se o gigante morrer; ele pode inscrever uma nova runa após um descanso curto ou longo."
 },
 "t_repulsaoDaColina": {
  "name": "Repulsão da Colina",
  "desc": "Requer a runa. Quando sofre dano de uma criatura visível a até 3 m, ela faz teste de resistência de Constituição CD 16 ou sofre 10 (3d6) de dano energético e é empurrada 3 m para longe."
 },
 "t_formaDeRelampago": {
  "name": "Forma de Relâmpago",
  "desc": "Pode entrar e parar no espaço de criaturas hostis. A criatura sofre 2d6 (7) de dano elétrico na primeira vez por turno em que ele entra no espaço dela ou se ele começa o turno ali. Passa por frestas de 2,5 cm sem se espremer, e quem o toca ou o acerta com ataque corpo a corpo a até 1,5 m sofre 2d6 (7) de dano elétrico."
 },
 "t_investidaVoraz": {
  "name": "Investida Voraz",
  "desc": "Recarga 5–6. Move-se até seu deslocamento sem provocar ataques de oportunidade, atravessando criaturas Grandes ou menores; cada uma faz teste de resistência de Força CD 18 ou sofre 25 (3d12 + 6) de dano perfurante e fica agarrada (CD 16 para escapar) e contida enquanto durar; quem já estiver agarrado assim fica caído. Só agarra uma criatura por vez."
 },
 "t_revideDentado": {
  "name": "Revide Dentado",
  "desc": "Ao sofrer dano, morde uma criatura aleatória a até 3 m. Se não houver ninguém ao alcance, pode fazer dois Arremessos de Presas."
 },
 "t_lamaPegajosa": {
  "name": "Lama Pegajosa",
  "desc": "O chão num raio de 4,5 m ao redor dele é terreno difícil para as outras criaturas."
 },
 "t_rastroDeGeada": {
  "name": "Rastro de Geada",
  "desc": "Recarga 5–6. Move-se até seu deslocamento sem provocar ataques de oportunidade, podendo atravessar criaturas Médias ou menores. Cada criatura cujo espaço ele entra pela primeira vez faz teste de resistência de Constituição CD 15: na falha sofre 22 (4d10) de dano de frio e tem o deslocamento reduzido em 3 m até o início do próximo turno dele; no sucesso, sofre metade do dano."
 },
 "t_reflexaoDeMagia": {
  "name": "Reflexão de Magia",
  "desc": "2/dia. Quando uma criatura a até 36 m conjura magia de 5º círculo ou menor, faz ataque mágico à distância (+14): 26 (4d12) de dano energético, e o alvo deve passar em teste de resistência de Inteligência CD 15 ou a magia falha sem efeito."
 },
 "t_alimentarSe": {
  "name": "Alimentar-se",
  "desc": "Logo após sofrer dano, se tiver alguém engolido, causa 10 (3d6) de dano energético a cada criatura engolida e recupera 10 PV."
 },
 "t_apertoSepulcral": {
  "name": "Aperto Sepulcral",
  "desc": "Recarga 5–6. Toca uma criatura Enorme ou menor a até 6 m: teste de Destreza CD 24 ou sofre 28 (8d6) energético e fica agarrada (fuga CD 19). Se ainda estiver agarrada no início do próximo turno do rebento, fica petrificada."
 },
 "t_formaBorrada": {
  "name": "Forma Borrada",
  "desc": "Ataques contra a nuvem têm desvantagem, a menos que o atacante esteja a até 4,5 m dela ou que ela esteja incapacitada."
 },
 "t_memoriaLabirintica": {
  "name": "Memória Labiríntica",
  "desc": "Lembra com perfeição qualquer caminho que já percorreu."
 },
 "t_inabalavel": {
  "name": "Inabalável",
  "desc": "Quando falha em um teste de resistência para não ser movido ou não ficar caído, considera que obteve sucesso."
 },
 "t_raiosPrismaticos": {
  "name": "Raios Prismáticos",
  "desc": "Exige a Runa de Pedra. Cone de 18 m; cada criatura faz teste de resistência de Destreza CD 17 e rola 1d6 para saber qual raio a atinge."
 },
 "t_12VermelhoArdente": {
  "name": "1-2: Vermelho Ardente",
  "desc": "Na falha, 35 (10d6) de dano radiante e fica cega até o fim do próximo turno do gigante; no sucesso, metade do dano."
 },
 "t_34AzulAterrador": {
  "name": "3-4: Azul Aterrador",
  "desc": "Na falha, 35 (10d6) de dano necrótico e fica amedrontada até o fim do próximo turno do gigante; no sucesso, metade do dano."
 },
 "t_56VerdeDrenante": {
  "name": "5-6: Verde Drenante",
  "desc": "Na falha, 35 (10d6) de dano energético e fica incapacitada até o fim do próximo turno do gigante; no sucesso, metade do dano."
 },
 "t_runaDePedra": {
  "name": "Runa de Pedra",
  "desc": "Enquanto segura ou veste o objeto mineral com a runa, pode usar Raios Prismáticos. O objeto tem CA 18, 30 PV, imunidade a dano necrótico, veneno e psíquico, recupera todos os PV ao fim de cada turno e vira pó se chegar a 0 PV ou se o gigante morrer; ele pode gravar outra runa após um descanso curto ou longo."
 },
 "t_chamadoDaTormentaRequerRunaDaTempestade": {
  "name": "Chamado da Tormenta (Requer Runa da Tempestade)",
  "desc": "Vórtice numa esfera de 18 m de raio centrada nele: os demais fazem teste de resistência de Destreza CD 21, sofrendo 43 (8d8+7) de dano de frio, elétrico ou trovejante (à escolha dele) na falha, ou metade no sucesso."
 },
 "t_videnciaRequerRunaDaTempestade": {
  "name": "Vidência (Requer Runa da Tempestade)",
  "desc": "Usa sua bola de cristal para conjurar vidência (CD 17)."
 },
 "t_runaDaTempestade": {
  "name": "Runa da Tempestade",
  "desc": "Enquanto a bola de cristal rúnica estiver embutida no corpo, pode usar Chamado da Tormenta e Vidência. O cristal tem CA 17, 50 PV, imunidade a necrótico, veneno e psíquico, recupera todos os PV no fim de cada turno e vira pó ao chegar a 0 PV ou com a morte do gigante; ele pode gravar a runa em outro cristal após um descanso."
 },
 "t_bestaDeCarga": {
  "name": "Besta de Carga",
  "desc": "Para calcular a capacidade de carga, o titanotério conta como uma categoria de tamanho acima da sua."
 },
 "t_mutacao": {
  "name": "Mutação",
  "desc": "Ao ser criado, recebe uma mutação aleatória entre quatro: Corpo Elástico, Espelho Psiônico, Marcado por Magia ou Forma Alada. A mutação define alguns traços da ficha."
 },
 "t_repreensaoPsiquicaSoEspelhoPsionico": {
  "name": "Repreensão Psíquica (só Espelho Psiônico)",
  "desc": "Quando sofre dano psíquico, cada criatura a até 6 m dele sofre o mesmo dano."
 }
};
