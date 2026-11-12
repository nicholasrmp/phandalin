// GERADO por `src/dev/importar-bestiario.mjs ai` — não edite à mão; mude o conversor ou o texto em
  // `src/dev/bestiario/ai-pt.json` e rode de novo. Os números são os do livro (AI, via o espelho do 5etools);
  // o texto é nosso, em pt-br. O que o motor ainda não faz está em `src/dev/bestiario/ai-pendente.json`.
  
export const LIVRO_AI = {
 "corvoDasProfundezasAnciao": {
  "id": "corvoDasProfundezasAnciao",
  "tipo": "monstruosidade",
  "name": "Corvo das Profundezas Ancião",
  "nomeOriginal": "Ancient Deep Crow",
  "fonte": "AI",
  "size": "enorme",
  "level": 13,
  "cr": "15",
  "xp": 13000,
  "abilities": {
   "str": 23,
   "dex": 16,
   "con": 23,
   "int": 10,
   "wis": 15,
   "cha": 19
  },
  "ac": 18,
  "acNote": "armadura natural",
  "maxHp": 187,
  "hpDice": "15d12+90",
  "speedFt": 20,
  "flyFt": 80,
  "speeds": {
   "flyFt": 80
  },
  "senses": {
   "passivePerception": 17,
   "blindsightFt": 60,
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
   "furtividade"
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
    "name": "Mandíbulas",
    "bonus": 11,
    "damage": "2d10+6",
    "type": "perfurante",
    "reachFt": 10,
    "onHit": {
     "semResistencia": true,
     "dc": 19,
     "escape": 19,
     "condition": "contido",
     "note": "é agarrado"
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
    "Mandíbulas",
    "Garra",
    "Garra"
   ]
  },
  "acoesEspeciais": [
   {
    "nome": "Grasnado Sombrio",
    "tipo": "area",
    "shape": "raio",
    "areaFt": 60,
    "save": "con",
    "dc": 17,
    "damage": "3d6",
    "damageType": "psíquico",
    "halfOnSave": false
   }
  ],
  "lendarias": {
   "acoes": 3,
   "opcoes": [
    {
     "nome": "Grasnado Sombrio",
     "custo": 2,
     "tipo": "especial",
     "acao": "Grasnado Sombrio"
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
   "resistenciaAMagia",
   "furtividadeNasSombras",
   "acoesLendarias"
  ],
  "blurb": "Agarra a presa com as mandíbulas e a rasga com as garras enquanto seu grasnado sombrio fere a mente de todos por perto. Esconde-se nas sombras com facilidade e resiste bem à magia.",
  "lore": "Pouquíssimo se sabe sobre os corvos das profundezas, e menos ainda sobre estes parentes colossais. Ninguém sabe dizer se são corvos comuns que envelheceram até atingir tamanho monstruoso ou uma forma superior que domina os menores. Vivem na escuridão das profundezas e caçam a partir das sombras. Quem estuda essas criaturas costuma recomendar apenas uma coisa: mantenha distância."
 },
 "auspiciaDran": {
  "id": "auspiciaDran",
  "tipo": "humanoide",
  "name": "Auspicia Dran",
  "nomeOriginal": "Auspicia Dran",
  "fonte": "AI",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 16,
   "dex": 14,
   "con": 14,
   "int": 15,
   "wis": 12,
   "cha": 10
  },
  "ac": 15,
  "acNote": "camisão de malha",
  "maxHp": 52,
  "hpDice": "8d8+16",
  "speedFt": 30,
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
  "multiattack": {
   "count": 2
  },
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "augurio",
    "detectarPensamentos"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "augurio": 1
   },
   "aVontade": [
    "detectarPensamentos"
   ]
  },
  "traits": [],
  "blurb": "Combatente meio-elfa que ataca duas vezes com espada longa ou besta leve, lendo pensamentos dos inimigos para antecipar seus movimentos.",
  "lore": "Irmã caçula de Omin Dran, Auspicia foi arrebatada ainda criança pela Cripta Errante e passou anos presa num sonho sombrio dentro dela, até ser resgatada pelo irmão e pela Equipe \"C\". De volta ao mundo, tenta descobrir quem realmente é e lidar com as sequelas do cativeiro. Saiu da cripta com poderes psiônicos crescentes: lê mentes sem querer e usa um brinco de diamante para conter o dom. Ainda guarda um elo misterioso com a cripta, que lhe traz lembranças de outros prisioneiros e visões de lugares distantes. Em combate, pressente o que vai acontecer e costuma usar isso para travar a luta e abrir espaço para negociação."
 },
 "brahmaLutier": {
  "id": "brahmaLutier",
  "tipo": "humanoide",
  "name": "Brahma Lutier",
  "nomeOriginal": "Brahma Lutier",
  "fonte": "AI",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 12,
   "dex": 15,
   "con": 12,
   "int": 11,
   "wis": 13,
   "cha": 16
  },
  "ac": 12,
  "maxHp": 33,
  "hpDice": "6d8+6",
  "speedFt": 30,
  "senses": {
   "passivePerception": 13
  },
  "saves": [],
  "skills": [
   "percepcao",
   "atuacao",
   "persuasao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Alaúde de Guerra",
    "bonus": 4,
    "damage": "1d6+2",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "spellcasting": {
   "ability": "cha",
   "cantrips": [
    "maoMagica",
    "mensagem",
    "zombariaViciosa"
   ],
   "prepared": [
    "enfeiticarPessoa",
    "heroismo",
    "escritaIlusoria",
    "sono",
    "servoInvisivel",
    "nuvemDeAdagas",
    "invisibilidade"
   ],
   "slots": [
    0,
    4,
    3
   ],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "cdPorMagia": {
    "maoMagica": 13,
    "mensagem": 13,
    "zombariaViciosa": 13,
    "enfeiticarPessoa": 13,
    "heroismo": 13,
    "escritaIlusoria": 13,
    "sono": 13,
    "servoInvisivel": 13,
    "nuvemDeAdagas": 13,
    "invisibilidade": 13
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Provocação",
    "porDia": 2,
    "tipo": "alvo",
    "alcanceFt": 30,
    "save": "cha",
    "dc": 13,
    "condition": "escarnecido",
    "rounds": 10,
    "repete": false,
    "bonus": true
   }
  ],
  "traits": [
   "t_cancaoDeDominacao",
   "ascendenciaFeerica",
   "t_provocacao"
  ],
  "blurb": "Barda elfa que luta de longe com zombarias, provocações e magias de controle como sono e nuvem de adagas. Seu maior perigo é a Canção de Dominação, capaz de virar um aliado contra o grupo.",
  "lore": "Brahma Lutier é uma elfa que já fez parte da Equipe \"B\" e se destaca como cartógrafa, espiã e trovadora. Aprendeu a arte da música com Audra Courtier, dona de uma estalagem em Red Larch, e ficou famosa por uma canção quase irresistível. Depois de romper com o marido, Oak Truestrike, deixou o grupo e passou a trabalhar sozinha. É alegre e homicida na mesma medida, e combate com um alaúde de guerra de origem draconata, cheio de compartimentos secretos e armas embutidas."
 },
 "quadrapodeDoCaos": {
  "id": "quadrapodeDoCaos",
  "tipo": "aberração",
  "name": "Quadrápode do Caos",
  "nomeOriginal": "Chaos Quadrapod",
  "fonte": "AI",
  "size": "grande",
  "level": 1,
  "cr": "4",
  "xp": 1100,
  "abilities": {
   "str": 18,
   "dex": 13,
   "con": 15,
   "int": 6,
   "wis": 10,
   "cha": 4
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 52,
  "hpDice": "7d10+14",
  "speedFt": 40,
  "speeds": {
   "climbFt": 40
  },
  "senses": {
   "passivePerception": 14,
   "blindsightFt": 120
  },
  "saves": [],
  "skills": [
   "acrobacia",
   "percepcao"
  ],
  "expertise": [
   "acrobacia",
   "percepcao"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Tentáculo",
    "bonus": 6,
    "damage": "2d6+4",
    "type": "concussão",
    "reachFt": 15,
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
    "Tentáculo",
    "Tentáculo"
   ]
  },
  "acoesEspeciais": [
   {
    "nome": "Nuvem do Caos",
    "tipo": "area",
    "shape": "raio",
    "areaFt": 60,
    "save": "cha",
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
  "blurb": "Agarra até dois alvos com tentáculos de 4,5 m de alcance, deixando-os contidos, e pode atordoar um grupo inteiro com uma explosão de luz caótica. Resiste bem à magia.",
  "lore": "É uma aberração vinda do Reino Distante, formada por quatro tentáculos cheios de ventosas presos a um núcleo pulsante de luz etérea. Carrega consigo a energia anárquica de seu plano natal e a usa para arrasar tudo o que encontra. Move-se arremessando os tentáculos viscosos à frente e puxando o corpo atrás deles. Seu avanço é marcado por um som úmido e repugnante enquanto persegue a presa sem descanso."
 },
 "dragaoMecanico": {
  "id": "dragaoMecanico",
  "tipo": "constructo",
  "name": "Dragão Mecânico",
  "nomeOriginal": "Clockwork Dragon",
  "fonte": "AI",
  "size": "médio",
  "level": 1,
  "cr": "1",
  "xp": 200,
  "abilities": {
   "str": 14,
   "dex": 10,
   "con": 12,
   "int": 10,
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
   "flyFt": 60
  },
  "senses": {
   "passivePerception": 14,
   "blindsightFt": 60,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "acrobacia",
   "percepcao"
  ],
  "expertise": [
   "percepcao"
  ],
  "damageImmunities": [
   "veneno",
   "psíquico"
  ],
  "conditionImmunities": [
   "cego",
   "enfeitiçado",
   "surdo",
   "exausto",
   "amedrontado",
   "paralisado",
   "petrificado",
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
  "breath": {
   "name": "Sopro de Fogo",
   "kind": "save",
   "shape": "cone",
   "areaFt": 15,
   "save": "dex",
   "dc": 11,
   "damage": "4d6",
   "damageType": "fogo",
   "halfOnSave": true,
   "origem": "sopro",
   "recharge": [
    5,
    6
   ]
  },
  "traits": [
   "aparenciaFalsa"
  ],
  "blurb": "Guardião de engrenagens que morde com força e solta um cone de fogo de 4,5 m; parado, passa por estátua e pode surpreender quem se aproxima.",
  "lore": "É um constructo de mecanismos finos, quase sempre moldado à semelhança dos dragões metálicos e revestido de latão, bronze, cobre ou imitações de ouro e prata. Quem o vê de relance costuma achar que é apenas uma escultura decorativa. Seus criadores o usam como sentinela, já que ele entende ordens complexas e também sabe reagir sozinho a ameaças. O sopro costuma ser de fogo, mas alguns são montados para expelir ácido, frio ou eletricidade, conforme o gosto de quem os fabricou."
 },
 "corvoDasProfundezas": {
  "id": "corvoDasProfundezas",
  "tipo": "monstruosidade",
  "name": "Corvo das Profundezas",
  "nomeOriginal": "Deep Crow",
  "fonte": "AI",
  "size": "grande",
  "level": 9,
  "cr": "9",
  "xp": 5000,
  "abilities": {
   "str": 20,
   "dex": 16,
   "con": 18,
   "int": 8,
   "wis": 15,
   "cha": 14
  },
  "ac": 17,
  "acNote": "armadura natural",
  "maxHp": 133,
  "hpDice": "14d10+56",
  "speedFt": 20,
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
   "wis"
  ],
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
    "name": "Mandíbulas",
    "bonus": 9,
    "damage": "2d10+5",
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
    "Mandíbulas",
    "Garra",
    "Garra"
   ]
  },
  "traits": [
   "resistenciaAMagia",
   "furtividadeNasSombras",
   "sunlightSensitivity"
  ],
  "blurb": "Predador alado que agarra a vítima com as mandíbulas, deixando-a contida enquanto a dilacera com as garras. Some nas sombras com facilidade, mas fica atrapalhado sob a luz do sol.",
  "lore": "Parece um corvo gigantesco, mas é na verdade um inseto alado, com boca de mandíbulas, quatro garras em cada pé e um aglomerado de olhos vermelhos. Há quem diga que descende de familiares de magos malignos abandonados no subterrâneo; outros falam em corvos comuns deformados por poderes sombrios. Vive sozinho em ninhos quentes perto de lava, saindo apenas para caçar, vigiar o território ou se reproduzir uma única vez na vida. Costuma arrebatar uma presa e levá-la voando para o covil, soltando-a de grandes alturas se ela resistir. Guarda rancores por anos e ensina os filhotes a odiar os mesmos inimigos."
 },
 "donaarBlitZen": {
  "id": "donaarBlitZen",
  "tipo": "humanoide",
  "name": "Donaar Blit'zen",
  "nomeOriginal": "Donaar Blit'zen",
  "fonte": "AI",
  "size": "médio",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 17,
   "dex": 8,
   "con": 14,
   "int": 10,
   "wis": 10,
   "cha": 16
  },
  "ac": 18,
  "acNote": "armadura de placas",
  "maxHp": 45,
  "hpDice": "7d8+14",
  "speedFt": 30,
  "senses": {
   "passivePerception": 10
  },
  "saves": [
   "wis",
   "cha"
  ],
  "skills": [
   "historia",
   "intuicao",
   "intimidacao",
   "persuasao"
  ],
  "expertise": [],
  "damageResistances": [
   "ácido"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Espada Grande",
    "bonus": 5,
    "damage": "2d6+3",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Chicote",
    "bonus": 5,
    "damage": "1d4+3",
    "type": "cortante",
    "reachFt": 10
   }
  ],
  "multiattack": {
   "count": 2,
   "sequencias": [
    [
     "Espada Grande",
     "Espada Grande"
    ],
    [
     "Chicote",
     "Chicote"
    ]
   ]
  },
  "breath": {
   "name": "Vômito Ácido",
   "kind": "save",
   "shape": "linha",
   "areaFt": 30,
   "save": "dex",
   "dc": 12,
   "damage": "2d6",
   "damageType": "ácido",
   "halfOnSave": true,
   "origem": "sopro",
   "larguraFt": 5
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "comando",
    "dueloCompelido",
    "curarFerimentos",
    "golpeColerico",
    "ajuda",
    "golpeMarcante",
    "restauracaoMenor",
    "eloDeProtecao",
    "zonaDaVerdade"
   ],
   "slots": [
    0,
    4,
    2
   ],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "cdPorMagia": {
    "comando": 13,
    "dueloCompelido": 13,
    "curarFerimentos": 13,
    "golpeColerico": 13,
    "ajuda": 13,
    "golpeMarcante": 13,
    "restauracaoMenor": 13,
    "eloDeProtecao": 13,
    "zonaDaVerdade": 13
   }
  },
  "traits": [
   "t_desafioDoCampeao"
  ],
  "blurb": "Paladino draconato que prende inimigos perto de si com seu desafio de campeão e os castiga com espada grande, chicote de alcance e vômito ácido em linha. Também conjura destruições e cura aliados.",
  "lore": "Donaar é o draconato corpulento que toma as decisões da Equipe \"C\", famoso pela fúria em combate e por cair no sono logo depois, ou em qualquer momento inconveniente. Uma peculiaridade de sua linhagem lhe deu uma cauda rara e fez seu sopro ácido sair como vômito, o que o deixou obcecado com a saúde dos dentes: a espada se chama Escova e o chicote, Fio Dental. Sua bravata é em parte encenação, já que ele aproveitou a vida de aventureiro longe do clã para se reinventar, e quem bajula seu orgulho dracônico conquista sua simpatia com facilidade. Ainda assim, tem um lado generoso: atua como padrinho de Chronaar, uma jovem draconata que o adotou como figura paterna enquanto ele vigiava seu ovo."
 },
 "flabbergast": {
  "id": "flabbergast",
  "tipo": "humanoide",
  "name": "Flabbergast",
  "nomeOriginal": "Flabbergast",
  "fonte": "AI",
  "size": "médio",
  "level": 1,
  "cr": "4",
  "xp": 1100,
  "abilities": {
   "str": 10,
   "dex": 14,
   "con": 10,
   "int": 17,
   "wis": 13,
   "cha": 13
  },
  "ac": 12,
  "acNote": "15 com armadura arcana",
  "maxHp": 40,
  "hpDice": "9d8",
  "speedFt": 30,
  "senses": {
   "passivePerception": 13
  },
  "saves": [
   "int",
   "wis"
  ],
  "skills": [
   "arcanismo",
   "persuasao",
   "historia",
   "percepcao"
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
  "spellcasting": {
   "ability": "int",
   "cantrips": [
    "raioDeFogo",
    "luz",
    "maoMagica",
    "prestidigitacao"
   ],
   "prepared": [
    "detectarMagia",
    "armaduraArcana",
    "sugestao",
    "relampago",
    "invisibilidadeMaior",
    "coneDeFrio"
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
    "raioDeFogo": 13,
    "luz": 13,
    "maoMagica": 13,
    "prestidigitacao": 13,
    "detectarMagia": 13,
    "armaduraArcana": 13,
    "sugestao": 13,
    "relampago": 13,
    "invisibilidadeMaior": 13,
    "coneDeFrio": 13
   }
  },
  "traits": [],
  "blurb": "Mago de 9º nível que prefere a diplomacia, mas quando pressionado fica invisível e dispara relâmpagos e cones de frio. Também manipula mentes com sugestão e magias de persuasão.",
  "lore": "Flabbergast é o reservado mordomo-chefe da sede da Acquisitions Incorporated, um burocrata pacifista vindo de uma família rica de Neverwinter. Odeia trabalho braçal e violência, preferindo aproximar pessoas e resolver conflitos com conversa. Raramente exibe seu poder mágico. No passado serviu Portentia Dran na Dran Enterprises e ainda carrega culpa por isso, o que faz alguns duvidarem de sua lealdade. É acompanhado pelo familiar Mister Snibbly, um gato."
 },
 "jimDarkmagic": {
  "id": "jimDarkmagic",
  "tipo": "humanoide",
  "name": "Jim Darkmagic",
  "nomeOriginal": "Jim Darkmagic",
  "fonte": "AI",
  "size": "médio",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 8,
   "dex": 14,
   "con": 10,
   "int": 18,
   "wis": 12,
   "cha": 14
  },
  "ac": 12,
  "acNote": "15 com armadura arcana",
  "maxHp": 40,
  "hpDice": "9d8",
  "speedFt": 30,
  "senses": {
   "passivePerception": 11
  },
  "saves": [
   "int",
   "wis"
  ],
  "skills": [
   "acrobacia",
   "lidarComAnimais",
   "arcanismo",
   "historia",
   "atuacao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Adaga",
    "bonus": 5,
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
    "amizade",
    "maoMagica",
    "ilusaoMenor",
    "prestidigitacao"
   ],
   "prepared": [
    "disfarcarSe",
    "armaduraArcana",
    "invisibilidade",
    "bolaDeFogo",
    "metamorfose",
    "despistar"
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
    "raioDeFogo": 15,
    "amizade": 15,
    "maoMagica": 15,
    "ilusaoMenor": 15,
    "prestidigitacao": 15,
    "disfarcarSe": 15,
    "armaduraArcana": 15,
    "invisibilidade": 15,
    "bolaDeFogo": 15,
    "metamorfose": 15,
    "despistar": 15
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Transporte Benigno",
    "tipo": "teleporte",
    "alcanceFt": 30,
    "bonus": true
   }
  ],
  "traits": [
   "t_conjuracaoMenor",
   "t_equipamentoEspecial",
   "t_transporteBenigno"
  ],
  "blurb": "Mago de 9º nível que prefere ficar longe, lançando bolas de fogo e mísseis mágicos enquanto troca de lugar com aliados por teletransporte. Carrega uma varinha das maravilhas, então espere o inesperado.",
  "lore": "Herdeiro de uma excêntrica família de magos que transita entre planos, Jim nasceu com talento arcano de sobra. Mesmo assim, sua verdadeira paixão sempre foi o palco, onde apresenta truques de mão em praças e feiras. Ficou famoso como arcanista-chefe da Acquisitions Incorporated, cargo em que às vezes incendeia mais do que deveria. Sonha em se aposentar para virar um ilusionista de verdade, sem magia real."
 },
 "kThrissDrowB": {
  "id": "kThrissDrowB",
  "tipo": "humanoide",
  "name": "K'thriss Drow'b",
  "nomeOriginal": "K'thriss Drow'b",
  "fonte": "AI",
  "size": "médio",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 8,
   "dex": 14,
   "con": 12,
   "int": 14,
   "wis": 11,
   "cha": 18
  },
  "ac": 14,
  "acNote": "couro batido",
  "maxHp": 44,
  "hpDice": "8d8+8",
  "speedFt": 30,
  "senses": {
   "passivePerception": 12,
   "darkvisionFt": 120
  },
  "saves": [
   "str",
   "dex",
   "con",
   "int",
   "wis",
   "cha"
  ],
  "skills": [
   "arcanismo",
   "intuicao",
   "investigacao",
   "percepcao",
   "religiao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Foice",
    "bonus": 4,
    "damage": "1d4+2",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Foice",
    "Foice"
   ]
  },
  "spellcasting": {
   "ability": "cha",
   "cantrips": [],
   "prepared": [
    "escuridao",
    "fogoDasFadas",
    "luzesDancantes",
    "disfarcarSe"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "escuridao": 1,
    "fogoDasFadas": 1
   },
   "aVontade": [
    "luzesDancantes",
    "disfarcarSe"
   ],
   "cdPorMagia": {
    "escuridao": 14,
    "fogoDasFadas": 14,
    "luzesDancantes": 14,
    "disfarcarSe": 14
   }
  },
  "traits": [
   "t_equipamentoEspecial",
   "t_menteDesperta",
   "ascendenciaFeerica"
  ],
  "blurb": "Bruxo drow que prefere lutar à distância com rajada mística, mísseis mágicos do manto e magias como despedaçar e sussurros dissonantes. Se for cercado, ataca duas vezes com a foice, mas é frágil sob a luz do sol.",
  "lore": "K'thriss é um bruxo drow ligado ao Ur, uma entidade ancestral, faminta e indiferente que existe além da realidade. Quando era um seguidor hesitante de Lolth, tocou fragmentos do Altar Negro, e a experiência deixou seu cabelo negro e seus olhos cristalinos e tortos. Vê a existência como um enigma sem sentido, mas costuma ser cortês, porque sabe que não pode arranjar mais inimigos. Suas magias se manifestam como tentáculos, e ele costuma andar vendado, enxergando pelos olhos de Ligotti, seu familiar alienígena."
 },
 "roboBarril": {
  "id": "roboBarril",
  "tipo": "constructo",
  "name": "Robô-Barril",
  "nomeOriginal": "Keg Robot",
  "fonte": "AI",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 16,
   "dex": 16,
   "con": 15,
   "int": 6,
   "wis": 8,
   "cha": 5
  },
  "ac": 14,
  "acNote": "armadura natural",
  "maxHp": 39,
  "hpDice": "6d8+12",
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
   "concussão",
   "perfurante",
   "cortante"
  ],
  "damageResistancesNote": "só de armas não mágicas",
  "damageImmunities": [
   "veneno",
   "psíquico"
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
    "name": "Punho",
    "bonus": 5,
    "damage": "1d8+3",
    "type": "concussão",
    "reachFt": 5
   },
   {
    "name": "Esguicho de Ácido",
    "bonus": 5,
    "damage": "1d8+3",
    "type": "ácido",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 20,
    "longRangeFt": 40
   }
  ],
  "acoesEspeciais": [
   {
    "nome": "Banho de Cerveja",
    "tipo": "area",
    "shape": "cone",
    "areaFt": 15,
    "save": "con",
    "dc": 13,
    "condition": "envenenado",
    "rounds": 10,
    "repete": true
   },
   {
    "nome": "Jato de Óleo Fervente",
    "recharge": [
     5,
     6
    ],
    "tipo": "area",
    "shape": "cone",
    "areaFt": 15,
    "save": "dex",
    "dc": 13,
    "damage": "1d8+3",
    "damageType": "fogo",
    "halfOnSave": true,
    "condition": "caido",
    "rounds": 10,
    "repete": false
   }
  ],
  "traits": [
   "t_armazenamentoPersonalizavel"
  ],
  "blurb": "Um construto atarracado que soca de perto, esguicha ácido a distância e encharca grupos com cerveja entorpecente ou óleo fervente. Cuidado com fogo perto de quem foi coberto de óleo.",
  "lore": "Construto de madeira e metal com corpo de barril e cara de anão de elmo com chifres, criado pelo departamento de pesquisa arcana da Acquisitions Incorporated. Foi pensado para carregar líquidos úteis a aventureiros, de água e óleo de lamparina a misturas alquímicas, mas ficou famoso mesmo como chopeira ambulante. Seus compartimentos às vezes vazam, dando um gosto peculiar às bebidas. Tem inteligência suficiente para agir sozinho e distinguir aliados de inimigos, e às vezes exibe um humor grosseiro que ninguém sabe explicar."
 },
 "morgN": {
  "id": "morgN",
  "tipo": "humanoide",
  "name": "Môrgæn",
  "nomeOriginal": "Môrgæn",
  "fonte": "AI",
  "size": "médio",
  "level": 1,
  "cr": "4",
  "xp": 1100,
  "abilities": {
   "str": 12,
   "dex": 18,
   "con": 12,
   "int": 12,
   "wis": 14,
   "cha": 10
  },
  "ac": 16,
  "acNote": "couro batido",
  "maxHp": 66,
  "hpDice": "12d8+12",
  "speedFt": 30,
  "senses": {
   "passivePerception": 14,
   "darkvisionFt": 60
  },
  "saves": [
   "str",
   "dex"
  ],
  "skills": [
   "atletismo",
   "intuicao",
   "natureza",
   "percepcao",
   "furtividade",
   "sobrevivencia"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Cimitarras",
    "bonus": 6,
    "damage": "1d6+4",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Arco Longo",
    "bonus": 6,
    "damage": "1d8+4",
    "type": "perfurante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 150,
    "longRangeFt": 600
   }
  ],
  "multiattack": {
   "count": 3,
   "sequencias": [
    [
     "Cimitarras",
     "Cimitarras",
     "Cimitarras"
    ],
    [
     "Arco Longo",
     "Arco Longo",
     "Arco Longo"
    ]
   ]
  },
  "spellcasting": {
   "ability": "int",
   "cantrips": [],
   "prepared": [
    "maoMagica"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "aVontade": [
    "maoMagica"
   ]
  },
  "traits": [
   "ascendenciaFeerica"
  ],
  "blurb": "Arqueira letal que dispara três flechas por turno a até 180 m de distância, ou troca o arco por cimitarras no corpo a corpo. Usa magias de patrulheira como marca do caçador e crescer espinhos para punir quem tenta alcançá-la.",
  "lore": "Môrgæn é uma patrulheira elfa da Acquisitions Incorporated, famosa como rastreadora e caçadora capaz de acertar alvos de qualquer distância e sumir na mata sem deixar pistas. Suas flechas feitas à mão assustam inimigos e até colegas, tanto que ela é a única do grupo que recebe pagamento adiantado. Criada na floresta, protege a natureza com ferocidade e prefere atirar primeiro sem perguntar depois. Mesmo assim, sabe se virar em missões de infiltração e conversa nas cidades, desde que seu gosto por bebida não atrapalhe."
 },
 "oakTruestrike": {
  "id": "oakTruestrike",
  "tipo": "humanoide",
  "name": "Oak Truestrike",
  "nomeOriginal": "Oak Truestrike",
  "fonte": "AI",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 13,
   "dex": 16,
   "con": 14,
   "int": 10,
   "wis": 13,
   "cha": 11
  },
  "ac": 15,
  "acNote": "couro batido",
  "maxHp": 32,
  "hpDice": "5d8+10",
  "speedFt": 30,
  "senses": {
   "passivePerception": 13
  },
  "saves": [],
  "skills": [
   "natureza",
   "percepcao",
   "atuacao",
   "furtividade",
   "sobrevivencia"
  ],
  "expertise": [
   "natureza"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Adaga de Gancho",
    "bonus": 5,
    "damage": "1d4+3",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Besta de Mão",
    "bonus": 5,
    "damage": "1d6+3",
    "type": "perfurante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 30,
    "longRangeFt": 120
   }
  ],
  "multiattack": {
   "count": 3,
   "sequencias": [
    [
     "Adaga de Gancho",
     "Adaga de Gancho",
     "Adaga de Gancho"
    ],
    [
     "Besta de Mão",
     "Besta de Mão",
     "Besta de Mão"
    ]
   ]
  },
  "revide": {
   "nome": "Devolver o Favor",
   "arma": "Adaga de Gancho"
  },
  "traits": [
   "ascendenciaFeerica",
   "audicaoEVisaoApuradas",
   "t_devolverOFavor"
  ],
  "blurb": "Elfo ágil que desfere três golpes por turno com adagas de gancho ou besta de mão, e revida quando é ferido em combate corpo a corpo.",
  "lore": "Oak Truestrike é quem toma as decisões da Equipe \"B\" e, segundo alguns, a reencarnação de um semideus. Arrogante e seguro de si, tem um talento estranho para dizer a cada pessoa o que ela quer ouvir, seja por magia sutil ou pura lábia de vigarista. A cada nova vida sua personalidade muda radicalmente, alternando entre bondade e maldade, e ele tenta equilibrar nesta vida as dívidas da anterior. A encarnação atual pende para o bem, embora carregue amargura e um desprezo frequente pelas pessoas."
 },
 "ominDran": {
  "id": "ominDran",
  "tipo": "humanoide",
  "name": "Omin Dran",
  "nomeOriginal": "Omin Dran",
  "fonte": "AI",
  "size": "médio",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 16,
   "dex": 8,
   "con": 14,
   "int": 11,
   "wis": 18,
   "cha": 12
  },
  "ac": 18,
  "acNote": "armadura de placas",
  "maxHp": 65,
  "hpDice": "10d8+20",
  "speedFt": 30,
  "senses": {
   "passivePerception": 17,
   "darkvisionFt": 60
  },
  "saves": [
   "wis",
   "cha"
  ],
  "skills": [
   "enganacao",
   "intuicao",
   "intimidacao",
   "medicina",
   "percepcao",
   "persuasao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Marreta",
    "bonus": 6,
    "damage": "2d6+3",
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
  "spellcasting": {
   "ability": "wis",
   "cantrips": [
    "orientacao",
    "chamaSagrada",
    "pouparOsMoribundos",
    "taumaturgia"
   ],
   "prepared": [
    "bencao",
    "comando",
    "favorDivino",
    "escudoDaFe",
    "aprimorarAtributo",
    "imobilizarPessoa",
    "armaMagica",
    "silencio",
    "armaEspiritual",
    "farolDeEsperanca",
    "mantoDoCruzado",
    "dissiparMagia",
    "palavraCurativaEmMassa",
    "espiritosGuardioes",
    "protecaoContraAMorte",
    "liberdadeDeMovimento",
    "localizarCriatura",
    "peleDePedra",
    "dissiparOBemEOMal",
    "golpeDeChama",
    "imobilizarMonstro",
    "restauracaoMaior",
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
    "orientacao": 15,
    "chamaSagrada": 15,
    "pouparOsMoribundos": 15,
    "taumaturgia": 15,
    "bencao": 15,
    "comando": 15,
    "favorDivino": 15,
    "escudoDaFe": 15,
    "aprimorarAtributo": 15,
    "imobilizarPessoa": 15,
    "armaMagica": 15,
    "silencio": 15,
    "armaEspiritual": 15,
    "farolDeEsperanca": 15,
    "mantoDoCruzado": 15,
    "dissiparMagia": 15,
    "palavraCurativaEmMassa": 15,
    "espiritosGuardioes": 15,
    "protecaoContraAMorte": 15,
    "liberdadeDeMovimento": 15,
    "localizarCriatura": 15,
    "peleDePedra": 15,
    "dissiparOBemEOMal": 15,
    "golpeDeChama": 15,
    "imobilizarMonstro": 15,
    "restauracaoMaior": 15,
    "lendasEHistorias": 15
   }
  },
  "traits": [
   "t_golpeDivino",
   "ascendenciaFeerica",
   "t_bencaoDoDeusDaGuerra"
  ],
  "blurb": "Clérigo de armadura pesada que esmaga inimigos com uma marreta, reforçando cada golpe com poder divino e uma lista ampla de magias como guardiões espirituais e golpe flamejante. Também pode garantir um acerto crucial a um aliado no momento certo.",
  "lore": "Meio-elfo criado em Red Larch, onde a mãe mantinha uma estalagem movimentada, Omin perdeu uma das irmãs para a Cripta Errante, uma criatura disfarçada de ruína. Em parte para procurá-la, fundou a Acquisitions Incorporated, empresa que transformou aventuras em franquias pela Costa da Espada. Devoto de Tymora, é implacável nos negócios, desastrado no amor e péssimo em jogos de azar. Há boatos de que seria um dos Lordes Mascarados de Águas Profundas, algo que ele apenas ri ao ouvir."
 },
 "pendragonBeestinger": {
  "id": "pendragonBeestinger",
  "tipo": "humanoide",
  "name": "Pendragon Beestinger",
  "nomeOriginal": "Pendragon Beestinger",
  "fonte": "AI",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 10,
   "dex": 14,
   "con": 12,
   "int": 17,
   "wis": 10,
   "cha": 11
  },
  "ac": 12,
  "acNote": "15 com armadura arcana",
  "maxHp": 27,
  "hpDice": "5d8+5",
  "speedFt": 30,
  "senses": {
   "passivePerception": 10
  },
  "saves": [],
  "skills": [
   "arcanismo",
   "investigacao",
   "atuacao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Espada Curta",
    "bonus": 4,
    "damage": "1d6+2",
    "type": "perfurante",
    "reachFt": 5
   }
  ],
  "spellcasting": {
   "ability": "int",
   "cantrips": [
    "respingoAcido",
    "luz",
    "maoMagica",
    "borrifoVenenoso",
    "toqueChocante"
   ],
   "prepared": [
    "detectarMagia",
    "armaduraArcana",
    "misselMagico",
    "sono",
    "cegueiraSurdez",
    "nuvemDeAdagas",
    "raioArdente"
   ],
   "slots": [
    0,
    4,
    3
   ],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "cdPorMagia": {
    "respingoAcido": 13,
    "luz": 13,
    "maoMagica": 13,
    "borrifoVenenoso": 13,
    "toqueChocante": 13,
    "detectarMagia": 13,
    "armaduraArcana": 13,
    "misselMagico": 13,
    "sono": 13,
    "cegueiraSurdez": 13,
    "nuvemDeAdagas": 13,
    "raioArdente": 13
   }
  },
  "traits": [
   "t_magiaEcoada"
  ],
  "blurb": "Mago de apoio que fica à distância lançando raio ardente, nuvem de adagas e sono; uma vez por dia repete a magia do turno anterior como ação bônus. De perto é frágil, com apenas uma espada curta.",
  "lore": "Pendragon é o cartógrafo da equipe \"B\" da Acquisitions Incorporated, que entrou no lugar de Brahma Lutier e teve como primeira missão ajudar a caçá-lo. Filho adotivo de Rosie Beestinger, da equipe \"C\", ele é o oposto da mãe em quase tudo e chegou a tentar matá-la, morrendo na tentativa antes de ser ressuscitado a pedido dela. Expulso da escola de magia por causa da má fama da família, aprendeu sozinho e virou uma espécie de arqueólogo arcano, fascinado por feitiços perigosos e bugigangas estranhas. Fica na equipe porque busca ali um senso de família, mesmo tendo que aturar Oak Truestrike como figura paterna."
 },
 "phoenixAnvil": {
  "id": "phoenixAnvil",
  "tipo": "humanoide",
  "name": "Phoenix Anvil",
  "nomeOriginal": "Phoenix Anvil",
  "fonte": "AI",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 15,
   "dex": 10,
   "con": 12,
   "int": 13,
   "wis": 16,
   "cha": 13
  },
  "ac": 18,
  "acNote": "cota de malha e escudo",
  "maxHp": 27,
  "hpDice": "5d8+5",
  "speedFt": 30,
  "senses": {
   "passivePerception": 13
  },
  "saves": [],
  "skills": [
   "atletismo",
   "atuacao",
   "persuasao",
   "religiao"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Martelo de Guerra",
    "bonus": 4,
    "damage": "1d8+2",
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
    "luz",
    "consertar",
    "chamaSagrada"
   ],
   "prepared": [
    "perdicao",
    "curarFerimentos",
    "raioGuiado",
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
    "orientacao": 13,
    "luz": 13,
    "consertar": 13,
    "chamaSagrada": 13,
    "perdicao": 13,
    "curarFerimentos": 13,
    "raioGuiado": 13,
    "imobilizarPessoa": 13,
    "armaEspiritual": 13
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Exibição Divina",
    "porDia": 1,
    "tipo": "area",
    "shape": "raio",
    "areaFt": 30,
    "save": "wis",
    "dc": 13,
    "condition": "cego",
    "rounds": 10,
    "repete": false,
    "bonus": true
   }
  ],
  "traits": [
   "t_exibicaoDivina"
  ],
  "blurb": "Clérigo de linha de frente que golpeia duas vezes com o martelo de guerra, empurrando inimigos, e pode cegar vários adversários de uma vez com o brilho divino do escudo. Também paralisa alvos com magia e cura aliados.",
  "lore": "Phoenix Anvil é o clérigo de Waukeen da equipe reserva de uma franquia de aventureiros, um homem tão calado que quase ninguém conhece sua voz. Cresceu brigando nas ruas até que um emprego varrendo a escadaria de um pequeno templo da deusa do comércio mudou seu rumo. Por saber o que é passar necessidade, persegue o ouro com disciplina e cuida com obsessão dos bens e das contas da franquia. Como considera os colegas parte desse patrimônio, é ferozmente leal a eles, embora só tenha criado laços de verdade com Oak Truestrike."
 },
 "portentiaDran": {
  "id": "portentiaDran",
  "tipo": "monstruosidade",
  "name": "Portentia Dran",
  "nomeOriginal": "Portentia Dran",
  "fonte": "AI",
  "size": "médio",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 12,
   "dex": 18,
   "con": 16,
   "int": 13,
   "wis": 12,
   "cha": 14
  },
  "ac": 17,
  "acNote": "camisão de malha",
  "maxHp": 45,
  "hpDice": "6d8+18",
  "speedFt": 30,
  "senses": {
   "passivePerception": 13,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "enganacao",
   "intuicao",
   "percepcao"
  ],
  "expertise": [
   "enganacao"
  ],
  "conditionImmunities": [
   "enfeitiçado"
  ],
  "attacks": [
   {
    "name": "Espada Curta",
    "bonus": 6,
    "damage": "1d6+4",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 3
  },
  "features": [
   "sneakAttack"
  ],
  "sneakAttack": "4d6",
  "traits": [
   "t_mudarDeForma"
  ],
  "blurb": "Portentia ataca três vezes por turno com espadas curtas e causa 14 de dano extra com Ataque Furtivo quando tem vantagem ou um aliado ao lado do alvo. Pode mudar de forma no meio da luta, confundindo quem tenta acompanhá-la.",
  "lore": "Portentia comanda a Dran Enterprises, a grande concorrente da Acquisitions Incorporated no ramo de aventuras lucrativas. Na verdade, ela é uma changeling que tomou o lugar da verdadeira Portentia quando a menina ainda era pequena. Há anos manipula a família Dran por dentro, e foi ela quem atraiu a irmã Auspicia para a Cripta Errante. Em combate e em conversas troca de rosto e de atitude o tempo todo, lutando para ferir e humilhar. Seus verdadeiros objetivos continuam um segredo só dela."
 },
 "profetisaDran": {
  "id": "profetisaDran",
  "tipo": "humanoide",
  "name": "Profetisa Dran",
  "nomeOriginal": "Prophetess Dran",
  "fonte": "AI",
  "size": "médio",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 14,
   "dex": 10,
   "con": 12,
   "int": 13,
   "wis": 16,
   "cha": 13
  },
  "ac": 14,
  "acNote": "peitoral",
  "maxHp": 27,
  "hpDice": "5d8+5",
  "speedFt": 30,
  "senses": {
   "passivePerception": 13,
   "darkvisionFt": 60
  },
  "saves": [],
  "skills": [
   "medicina",
   "persuasao",
   "religiao"
  ],
  "expertise": [
   "religiao"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Marreta",
    "bonus": 4,
    "damage": "2d6+2",
    "type": "concussão",
    "reachFt": 5
   }
  ],
  "spellcasting": {
   "ability": "wis",
   "cantrips": [
    "luz",
    "chamaSagrada",
    "taumaturgia"
   ],
   "prepared": [
    "curarFerimentos",
    "raioGuiado",
    "santuario",
    "restauracaoMenor",
    "armaEspiritual",
    "dissiparMagia",
    "espiritosGuardioes"
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
    "luz": 13,
    "chamaSagrada": 13,
    "taumaturgia": 13,
    "curarFerimentos": 13,
    "raioGuiado": 13,
    "santuario": 13,
    "restauracaoMenor": 13,
    "armaEspiritual": 13,
    "dissiparMagia": 13,
    "espiritosGuardioes": 13
   }
  },
  "traits": [
   "t_eminenciaDivina",
   "ascendenciaFeerica"
  ],
  "blurb": "Clériga elfa que avança com uma marreta e queima os inimigos com luz divina, gastando magia para somar dano radiante aos golpes. Pode cercar-se de guardiões espirituais e curar aliados no meio da luta.",
  "lore": "Dran é uma elfa devota que fala em nome de sua divindade e é tratada como profetisa por seus seguidores. Ordeira e bondosa, costuma agir como líder espiritual e curandeira de sua comunidade. Ainda assim, não foge do combate: veste peitoral e empunha uma marreta pesada. Quando luta, mistura fé e força bruta, abençoando cada golpe com poder sagrado."
 },
 "rosieBeestinger": {
  "id": "rosieBeestinger",
  "tipo": "humanoide",
  "name": "Rosie Beestinger",
  "nomeOriginal": "Rosie Beestinger",
  "fonte": "AI",
  "size": "pequeno",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 8,
   "dex": 16,
   "con": 12,
   "int": 12,
   "wis": 14,
   "cha": 14
  },
  "ac": 15,
  "acNote": "defesa sem armadura",
  "maxHp": 45,
  "hpDice": "10d6+10",
  "speedFt": 40,
  "senses": {
   "passivePerception": 12
  },
  "saves": [
   "str",
   "dex"
  ],
  "skills": [
   "acrobacia",
   "historia",
   "intimidacao",
   "furtividade"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Cajado do Mestre",
    "bonus": 6,
    "damage": "1d6+4",
    "type": "concussão",
    "reachFt": 5,
    "danoExtra": {
     "damage": "1d8+4",
     "type": "concussão"
    }
   },
   {
    "name": "Golpe Desarmado",
    "bonus": 5,
    "damage": "1d6+3",
    "type": "concussão",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 3,
   "sequence": [
    "Golpe Desarmado",
    "Golpe Desarmado"
   ]
  },
  "spellcasting": {
   "ability": "wis",
   "cantrips": [],
   "prepared": [
    "comando",
    "escuridao",
    "visaoNoEscuro",
    "passosSemPegadas",
    "silencio",
    "ilusaoMenor",
    "chamaSagrada",
    "taumaturgia"
   ],
   "slots": [],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "porDia": {
    "comando": 1,
    "escuridao": 1,
    "visaoNoEscuro": 1,
    "passosSemPegadas": 1,
    "silencio": 1
   },
   "aVontade": [
    "ilusaoMenor",
    "chamaSagrada",
    "taumaturgia"
   ],
   "cdPorMagia": {
    "comando": 12,
    "escuridao": 12,
    "visaoNoEscuro": 12,
    "passosSemPegadas": 12,
    "silencio": 12,
    "ilusaoMenor": 12,
    "chamaSagrada": 12,
    "taumaturgia": 12
   }
  },
  "acoesEspeciais": [
   {
    "nome": "Passo das Sombras",
    "tipo": "teleporte",
    "alcanceFt": 60,
    "bonus": true
   }
  ],
  "features": [
   "evasion"
  ],
  "traits": [
   "bravura",
   "t_agilidadeHalfling",
   "t_passoDasSombras",
   "t_desviarProjeteis"
  ],
  "blurb": "Monja halfling ágil que se teleporta entre sombras e despeja uma rajada de golpes de cajado e socos mágicos. Desvia projéteis e escapa de áreas de efeito com facilidade.",
  "lore": "Rosie é uma halfling idosa, miúda e de jeito de avó, o que faz muitos a subestimarem uma única vez. É a cartógrafa do Time \"C\" e famosa entre os halflings, em parte por sua enorme família de filhos naturais e adotados, vários deles aventureiros. Estudiosa das estrelas, busca no céu sinais dos laços que a unem à família. Boatos ligam o clã Beestinger ao crime organizado halfling, e seu apelido \"Avó Noite\" não ajuda, embora ela jure não saber de nada."
 },
 "splugothORetornado": {
  "id": "splugothORetornado",
  "tipo": "humanoide",
  "name": "Splugoth, o Retornado",
  "nomeOriginal": "Splugoth the Returned",
  "fonte": "AI",
  "size": "pequeno",
  "level": 1,
  "cr": "2",
  "xp": 450,
  "abilities": {
   "str": 10,
   "dex": 14,
   "con": 12,
   "int": 14,
   "wis": 11,
   "cha": 10
  },
  "ac": 15,
  "acNote": "armadura natural",
  "maxHp": 27,
  "hpDice": "6d6+6",
  "speedFt": 30,
  "senses": {
   "passivePerception": 10,
   "darkvisionFt": 60
  },
  "saves": [
   "int",
   "wis"
  ],
  "skills": [
   "furtividade"
  ],
  "expertise": [
   "furtividade"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Adaga",
    "bonus": 4,
    "damage": "1d4+2",
    "type": "cortante",
    "reachFt": 5
   }
  ],
  "multiattack": {
   "count": 2,
   "sequence": [
    "Adaga",
    "Adaga"
   ]
  },
  "acoesEspeciais": [
   {
    "nome": "Palavra do Além",
    "porDia": 1,
    "tipo": "area",
    "shape": "raio",
    "areaFt": 30,
    "save": "wis",
    "dc": 12,
    "condition": "atordoado",
    "rounds": 1,
    "repete": false,
    "ateFimDoTurnoDele": true
   }
  ],
  "traits": [
   "t_vantagemDefensiva",
   "nimbleEscape",
   "ascendenciaFeerica",
   "t_absorverAtaque"
  ],
  "blurb": "Goblin ágil que ataca duas vezes com a adaga, foge ou se esconde como ação bônus e fica difícil de acertar quando cercado de aliados. Uma vez por dia, pode atordoar quem estiver por perto com palavras trazidas do além.",
  "lore": "Splugoth já foi Splug, um goblin capturado por aventureiros da Acquisitions Incorporated que o deixaram morrer depois de ele salvar suas vidas. Voltou dos mortos, ninguém sabe quantas vezes, e adotou um nome mais dramático. Hoje lidera a linha de frente do grupo rival conhecido como os Seis. Sua única obsessão é se vingar da Acq Inc e, principalmente, de Omin Dran, nesta vida e nas próximas."
 },
 "viari": {
  "id": "viari",
  "tipo": "humanoide",
  "name": "Viari",
  "nomeOriginal": "Viari",
  "fonte": "AI",
  "size": "médio",
  "level": 5,
  "cr": "5",
  "xp": 1800,
  "abilities": {
   "str": 12,
   "dex": 20,
   "con": 14,
   "int": 10,
   "wis": 8,
   "cha": 14
  },
  "ac": 18,
  "acNote": "couro batido +1; 19 empunhando duas armas corpo a corpo",
  "maxHp": 65,
  "hpDice": "10d8+20",
  "speedFt": 30,
  "senses": {
   "passivePerception": 15
  },
  "saves": [
   "dex",
   "int"
  ],
  "skills": [
   "acrobacia",
   "atletismo",
   "percepcao",
   "atuacao",
   "persuasao",
   "prestidigitacao",
   "furtividade"
  ],
  "expertise": [
   "acrobacia",
   "atletismo",
   "percepcao",
   "prestidigitacao"
  ],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Espada Curta +1",
    "bonus": 9,
    "damage": "1d6+6",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Rapieira",
    "bonus": 8,
    "damage": "1d8+5",
    "type": "perfurante",
    "reachFt": 5
   },
   {
    "name": "Adaga",
    "bonus": 8,
    "damage": "1d4+5",
    "type": "perfurante",
    "reachFt": 5,
    "rangeFt": 20,
    "longRangeFt": 60
   }
  ],
  "multiattack": {
   "count": 4,
   "sequence": [
    "Espada Curta +1",
    "Espada Curta +1",
    "Rapieira",
    "Rapieira"
   ]
  },
  "features": [
   "evasion",
   "sneakAttack"
  ],
  "sneakAttack": "4d6",
  "traits": [
   "t_trabalhoNoSegundoAndar",
   "t_esquivaSobrenatural"
  ],
  "blurb": "Ladino ágil que desfere quatro golpes por turno com espada curta e rapieira, somando 4d6 de Ataque Furtivo quando tem vantagem ou um aliado ao lado do alvo. Escala e salta com facilidade e reduz à metade o dano de golpes que vê chegando.",
  "lore": "Viari cresceu numa pequena fazenda e guarda boas lembranças da família, embora se incomode com a preferência dos pais pelo irmão mais velho e jamais revele o nome que usava naquela época. Subiu rápido na Acquisitions Incorporated e hoje chefia o chamado Departamento de Esfaqueamento da companhia. É tão perigoso num duelo quanto numa discussão, gosta de planejar, adora saltar de lugares altos em combate e sabe ser vingativo. Certa vez derrubou sozinho um gigante com a Adaga do Apocalipse e perdeu o braço no feito; a magia o restaurou, mas quem o conhece percebe que aquele episódio ainda pesa sobre ele."
 },
 "walnutDankgrass": {
  "id": "walnutDankgrass",
  "tipo": "humanoide",
  "name": "Walnut Dankgrass",
  "nomeOriginal": "Walnut Dankgrass",
  "fonte": "AI",
  "size": "médio",
  "level": 1,
  "cr": "3",
  "xp": 700,
  "abilities": {
   "str": 8,
   "dex": 16,
   "con": 14,
   "int": 10,
   "wis": 18,
   "cha": 10
  },
  "ac": 14,
  "acNote": "armadura de couro",
  "maxHp": 52,
  "hpDice": "8d8+16",
  "speedFt": 35,
  "senses": {
   "passivePerception": 16,
   "darkvisionFt": 60
  },
  "saves": [
   "int",
   "wis"
  ],
  "skills": [
   "atletismo",
   "intuicao",
   "percepcao",
   "furtividade",
   "sobrevivencia"
  ],
  "expertise": [],
  "conditionImmunities": [],
  "attacks": [
   {
    "name": "Foremother (Cimitarra +1)",
    "bonus": 6,
    "damage": "1d6+4",
    "type": "cortante",
    "reachFt": 5
   },
   {
    "name": "Arco Longo",
    "bonus": 5,
    "damage": "1d8+3",
    "type": "perfurante",
    "reachFt": 5,
    "ranged": true,
    "rangeFt": 150,
    "longRangeFt": 600
   }
  ],
  "multiattack": {
   "count": 2,
   "sequencias": [
    [
     "Foremother (Cimitarra +1)",
     "Foremother (Cimitarra +1)"
    ],
    [
     "Arco Longo",
     "Arco Longo"
    ]
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
    "curarFerimentos",
    "emaranhar",
    "ondaTrovejante",
    "laminaFlamejante",
    "raioLunar",
    "passosSemPegadas",
    "convocarRelampagos",
    "dissiparMagia",
    "crescimentoDePlantas",
    "praga",
    "liberdadeDeMovimento"
   ],
   "slots": [
    0,
    4,
    3,
    3,
    1
   ],
   "noMotor": true,
   "conjuraNoTurno": "geral",
   "cdPorMagia": {
    "arteDruidica": 14,
    "produzirChama": 14,
    "chicoteDeEspinhos": 14,
    "curarFerimentos": 14,
    "emaranhar": 14,
    "ondaTrovejante": 14,
    "laminaFlamejante": 14,
    "raioLunar": 14,
    "passosSemPegadas": 14,
    "convocarRelampagos": 14,
    "dissiparMagia": 14,
    "crescimentoDePlantas": 14,
    "praga": 14,
    "liberdadeDeMovimento": 14
   }
  },
  "traits": [
   "ascendenciaFeerica",
   "t_mascaraDaNatureza",
   "t_formaSelvagem"
  ],
  "blurb": "Druida élfica que alterna golpes da cimitarra mágica Foremother e flechas de arco longo com magias como Raio Lunar, Invocar Relâmpago e Constrição; pode virar um lobo atroz e se curar gastando espaços de magia.",
  "lore": "Walnut cresceu num clã só de mulheres, druidas e patrulheiras devotas de Mielikki, que defendiam a natureza selvagem mais com lâminas do que com palavras. Quando o enclave foi aniquilado, ela ficou sozinha e movida apenas pela vingança. Apesar de detestar cidades, mudou-se para uma delas por acreditar que a origem do mal está ali, e atua como documante da Equipe \"C\". Desconfia de quase todos, exceto de quem lembra a estrutura matriarcal de seu povo, e segue suas convicções sem hesitar."
 }
};

export const TRACOS_AI = {
 "t_cancaoDeDominacao": {
  "name": "Canção de Dominação",
  "desc": "Três vezes por dia, uma criatura que possa vê-la ou ouvi-la faz teste de resistência de Sabedoria CD 13; se falhar, fica enfeitiçada por 1 minuto, repetindo o teste ao fim de cada turno (com desvantagem se desejar estar sob o encanto). Por 1 hora após o fim do efeito, o alvo tem desvantagem em testes resistidos de Inteligência, Sabedoria ou Carisma contra Brahma."
 },
 "t_provocacao": {
  "name": "Provocação",
  "desc": "Duas vezes por dia, como ação bônus, escolhe uma criatura que veja a até 9 m e que possa ouvi-la. Se falhar num teste de resistência de Carisma CD 13, o alvo tem desvantagem em testes de habilidade, ataques e testes de resistência até o início do próximo turno de Brahma."
 },
 "t_desafioDoCampeao": {
  "name": "Desafio do Campeão",
  "desc": "Recarrega após um descanso curto ou longo. Como ação bônus, as criaturas que ele escolher e puder ver a até 9 m fazem um teste de resistência de Sabedoria CD 13. Quem falhar não pode se afastar voluntariamente mais de 9 m dele, e o efeito termina se Donaar ficar incapacitado ou morrer, ou se o alvo for levado para mais longe que isso."
 },
 "t_conjuracaoMenor": {
  "name": "Conjuração Menor",
  "desc": "Cria na mão ou num espaço livre a até 3 m um objeto inanimado de até 90 cm de lado e 4,5 kg, que emite luz fraca em 1,5 m. Some se sofrer dano, após 1 hora ou se usar o efeito de novo."
 },
 "t_equipamentoEspecial": {
  "name": "Equipamento Especial",
  "desc": "Veste um manto das estrelas, que lhe permite conjurar mísseis mágicos com 7 dardos até 6 vezes por dia."
 },
 "t_transporteBenigno": {
  "name": "Transporte Benigno",
  "desc": "Com uma ação bônus, teleporta-se até 9 m para um espaço visível, livre ou ocupado por criatura Pequena ou Média voluntária, com quem troca de lugar. Recarrega quando ele lança uma magia de conjuração de 1º nível ou superior."
 },
 "t_menteDesperta": {
  "name": "Mente Desperta",
  "desc": "Fala por telepatia com qualquer criatura que veja a até 9 m, desde que ela entenda algum idioma."
 },
 "t_armazenamentoPersonalizavel": {
  "name": "Armazenamento Personalizável",
  "desc": "Carrega até três líquidos diferentes, somando 12 galões; cada ataque líquido gasta um galão. Reabastecer leva 2 rodadas por galão, e cargas diferentes podem mudar seus ataques."
 },
 "t_devolverOFavor": {
  "name": "Devolver o Favor",
  "desc": "Três vezes por dia, ao sofrer dano de um ataque corpo a corpo com arma, faz um ataque com a adaga de gancho como reação."
 },
 "t_golpeDivino": {
  "name": "Golpe Divino",
  "desc": "Uma vez por turno, ao acertar um ataque com arma, causa 4 (1d8) de dano extra do mesmo tipo da arma."
 },
 "t_bencaoDoDeusDaGuerra": {
  "name": "Bênção do Deus da Guerra",
  "desc": "Quando uma criatura a até 9 m faz uma jogada de ataque, antes de saber o resultado, Omin concede +10 nessa jogada. Recarrega após descanso curto ou longo."
 },
 "t_magiaEcoada": {
  "name": "Magia Ecoada",
  "desc": "Uma vez por dia, pode lançar de novo, como ação bônus, a magia que usou no turno anterior. Gasta um espaço de magia normalmente."
 },
 "t_exibicaoDivina": {
  "name": "Exibição Divina",
  "desc": "Uma vez por dia, como ação bônus, o escudo de Phoenix brilha com luz divina. Criaturas à escolha dele a até 9 m fazem teste de resistência de Sabedoria CD 13 ou ficam cegas por 1 minuto, repetindo o teste ao fim de cada turno."
 },
 "t_mudarDeForma": {
  "name": "Mudar de Forma",
  "desc": "Transforma-se magicamente em um humanoide ou fera de ND 3 ou menor, ou volta à forma verdadeira. Mantém suas estatísticas e a fala, mas assume CA, deslocamentos, Força, Destreza e sentidos da nova forma, ganhando também capacidades que ela possua."
 },
 "t_eminenciaDivina": {
  "name": "Eminência Divina",
  "desc": "Com uma ação bônus, gasta um espaço de magia para que seus ataques corpo a corpo com arma causem 10 (3d6) de dano radiante extra até o fim do turno. Cada nível do espaço acima do 1º soma mais 1d6."
 },
 "t_agilidadeHalfling": {
  "name": "Agilidade Halfling",
  "desc": "Pode atravessar o espaço de criaturas de tamanho maior que o dela."
 },
 "t_passoDasSombras": {
  "name": "Passo das Sombras",
  "desc": "Em penumbra ou escuridão, com ação bônus se teleporta até 18 m para um espaço visível também na penumbra ou escuridão. Ganha vantagem no primeiro ataque corpo a corpo antes do fim do turno."
 },
 "t_desviarProjeteis": {
  "name": "Desviar Projéteis",
  "desc": "Ao ser atingida por ataque à distância com arma, reduz o dano em 1d10+9. Se zerar o dano e tiver uma mão livre, apanha o projétil se couber em uma mão."
 },
 "t_vantagemDefensiva": {
  "name": "Vantagem Defensiva",
  "desc": "Se pelo menos dois aliados não incapacitados estiverem a até 1,5 m dele, os ataques contra Splugoth são feitos com desvantagem."
 },
 "t_absorverAtaque": {
  "name": "Absorver Ataque",
  "desc": "Quando uma criatura visível o acerta com ataque corpo a corpo com arma, o ataque é anulado e a arma fica presa nele. Para soltá-la, a criatura precisa usar uma ação e passar em um teste de Força (Atletismo) CD 12. Armas naturais também têm o ataque anulado, mas se soltam sozinhas no fim do turno do atacante."
 },
 "t_trabalhoNoSegundoAndar": {
  "name": "Trabalho no Segundo Andar",
  "desc": "Escalar não gasta movimento extra, e seus saltos com corrida alcançam 1,5 m a mais."
 },
 "t_esquivaSobrenatural": {
  "name": "Esquiva Sobrenatural",
  "desc": "Quando um atacante que ele consegue ver o acerta, reduz o dano desse ataque à metade."
 },
 "t_mascaraDaNatureza": {
  "name": "Máscara da Natureza",
  "desc": "Pode tentar se esconder estando só levemente obscurecida por folhagem, chuva forte, neve, névoa ou fenômenos naturais parecidos."
 },
 "t_formaSelvagem": {
  "name": "Forma Selvagem",
  "desc": "Com uma ação bônus, vira um lobo atroz por até 3 horas, mantendo Int, Sab, Car e personalidade; volta ao normal com ação bônus ou ao cair a 0 PV ou inconsciente. Recarrega após descanso curto ou longo. Nessa forma seus ataques são mágicos e, com ação bônus, ela gasta um espaço de magia para recuperar 1d8 PV por nível do espaço."
 }
};
